// Tests for analytics.js (Google Analytics 4) and for which pages carry it.
// Run:  node --experimental-default-type=module tests/analytics.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../analytics.js';

const A = globalThis.PAAnalytics;
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

const loc = (url) => { const u = new URL(url); return { hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash }; };
function env(url, nav) {
  const appended = [];
  return { location: loc(url), navigator: nav || {}, document: { createElement: () => ({}), head: { appendChild: (s) => appended.push(s) } }, appended: appended };
}

console.log('--- the measurement id ---');
t('it is the id the owner gave', A.MEASUREMENT_ID === 'G-4XFS1QWS9H');

console.log('--- where it runs ---');
{
  ['http://localhost:8000/index.html', 'http://127.0.0.1:8777/x.html', 'http://[::1]:3000/', 'http://app.localhost/x', 'http://site.test/x'].forEach(u => {
    const e = env(u);
    t('does nothing on ' + u, A.start(e) === false && !e.dataLayer && e.appended.length === 0);
  });
  const e = env('https://assessment.productadvisory.co/index.html');
  t('runs on the real site', A.start(e) === true && e.appended.length === 1);
  t('it loads the Google script for this id, asynchronously', e.appended[0].src === 'https://www.googletagmanager.com/gtag/js?id=G-4XFS1QWS9H' && e.appended[0].async === true);
  const calls = e.dataLayer.map(a => Array.prototype.slice.call(a));
  t('advertising is off before anything is sent, analytics storage is on', JSON.stringify(calls[0]) === JSON.stringify(['consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' }]));
  t('until someone accepts, visitors Google places in the EEA, UK or Switzerland get no analytics cookies', calls[1][0] === 'consent' && calls[1][1] === 'default' && calls[1][2].analytics_storage === 'denied' && calls[1][2].ad_storage === 'denied' && calls[1][2].region.indexOf('DE') > -1 && calls[1][2].region.indexOf('GB') > -1 && calls[1][2].region.indexOf('CH') > -1 && calls[1][2].region.indexOf('US') === -1);
  const config = calls.filter(c => c[0] === 'config')[0];
  t('then the id is configured with Google signals and ad personalization off', !!config && config[1] === 'G-4XFS1QWS9H' && config[2].allow_google_signals === false && config[2].allow_ad_personalization_signals === false);
  t('the consent defaults come before the id is configured', calls.findIndex(c => c[0] === 'config') > 1);
  t('Do Not Track is respected', A.start(env('https://assessment.productadvisory.co/', { doNotTrack: '1' })) === false);
  t('so is "yes" from older browsers', A.start(env('https://assessment.productadvisory.co/', { doNotTrack: 'yes' })) === false);
  t('Global Privacy Control is respected', A.start(env('https://assessment.productadvisory.co/', { globalPrivacyControl: true })) === false);
  t('"do not track" set to 0 does not stop it', A.start(env('https://assessment.productadvisory.co/', { doNotTrack: '0' })) === true);
  t('the reason is reported', A.skipReason(env('http://localhost/')) === 'local' && A.skipReason(env('https://x.com/', { doNotTrack: '1' })) === 'do-not-track' && A.skipReason(env('https://x.com/', { globalPrivacyControl: true })) === 'global-privacy-control' && A.skipReason(env('https://x.com/')) === '');
}

console.log('--- what is sent about the address ---');
{
  const clean = (u) => A.cleanUrl(loc(u));
  t('a plain page is sent as it is, without the #part', clean('https://assessment.productadvisory.co/index.html#results') === 'https://assessment.productadvisory.co/index.html');
  t('which course and lesson are kept', clean('https://assessment.productadvisory.co/lesson.html?course=discovery-novice&lesson=5') === 'https://assessment.productadvisory.co/lesson.html?course=discovery-novice&lesson=5');
  t('the button on the website that sent them is kept', clean('https://assessment.productadvisory.co/request-info.html?src=toolkits&who=org&call=1') === 'https://assessment.productadvisory.co/request-info.html?src=toolkits&who=org&call=1');
  t('which tool a roadmap link pointed at is kept', clean('https://assessment.productadvisory.co/tool-requests.html?tool=ai-use-case-prioritization&src=site') === 'https://assessment.productadvisory.co/tool-requests.html?src=site&tool=ai-use-case-prioritization');
  t('an invitation token never leaves the browser', !/token|abc123/.test(clean('https://assessment.productadvisory.co/join.html?token=abc123abc123abc123')));
  t('a company id never leaves the browser', !/orgA|org=/.test(clean('https://assessment.productadvisory.co/company.html?org=orgA')));
  t('anything else is dropped, even next to allowed parameters', clean('https://assessment.productadvisory.co/lesson.html?email=a%40b.com&course=aiOrg-novice&x=1') === 'https://assessment.productadvisory.co/lesson.html?course=aiOrg-novice');
  t('an allowed parameter with odd characters is dropped', clean('https://assessment.productadvisory.co/lesson.html?course=a%40b.com') === 'https://assessment.productadvisory.co/lesson.html');
  t('and one that is far too long', clean('https://assessment.productadvisory.co/lesson.html?course=' + 'a'.repeat(60)) === 'https://assessment.productadvisory.co/lesson.html');
}

console.log('--- which pages have it ---');
{
  const withIt = ['index', 'framework', 'request-info', 'tool-requests', 'lms-dashboard', 'lesson', 'profile', 'feedback'];
  const without = ['owner', 'owner-tools', 'owner-pilot', 'reports', 'company', 'join', 'assessment-dashboard'];
  const has = (p) => /<script src="analytics\.js"><\/script>/.test(fs.readFileSync(path.join(root, p + '.html'), 'utf8'));
  withIt.forEach(p => t(p + '.html has it', has(p)));
  without.forEach(p => t(p + '.html does not (private, admin or secret-link page)', !has(p)));
  const inHead = (p) => { const h = fs.readFileSync(path.join(root, p + '.html'), 'utf8'); return h.indexOf('analytics.js') > -1 && h.indexOf('analytics.js') < h.indexOf('</head>'); };
  t('on each page it is in the head, so the page view is counted early', withIt.every(inHead));
  const all = fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''));
  const unknown = all.filter(p => withIt.indexOf(p) === -1 && without.indexOf(p) === -1);
  t('every page in the site has been decided on (a new page must be added to one of the lists)', unknown.length === 0, unknown.join());
  t('the id appears only in analytics.js, never pasted into a page', all.every(p => fs.readFileSync(path.join(root, p + '.html'), 'utf8').indexOf('G-4XFS1QWS9H') === -1));
}

console.log('--- the visitor\'s choice ---');
{
  const store = (init, throws) => { const d = Object.assign({}, init); return { d, getItem: (k) => { if (throws) throw new Error('blocked'); return k in d ? d[k] : null; }, setItem: (k, v) => { if (throws) throw new Error('blocked'); d[k] = String(v); } }; };
  const e = (url, ls, nav) => Object.assign(env(url, nav), { localStorage: ls });
  const site = 'https://assessment.productadvisory.co/';
  t('nothing stored: nobody has been asked yet', A.readConsent(e(site, store({}))) === '');
  t('"accepted" and "declined" are understood', A.readConsent(e(site, store({ pa_cookie_consent: 'accepted' }))) === 'accepted' && A.readConsent(e(site, store({ pa_cookie_consent: 'declined' }))) === 'declined');
  t('anything else is treated as not asked, never as a yes', A.readConsent(e(site, store({ pa_cookie_consent: 'yes' }))) === '' && A.readConsent(e(site, store({ pa_cookie_consent: '1' }))) === '' && A.readConsent(e(site, store({ pa_cookie_consent: '' }))) === '');
  const ls = store({}); const ev = e(site, ls);
  A.writeConsent(ev, 'accepted');
  t('a choice is written with the time it was made', ls.d.pa_cookie_consent === 'accepted' && /^\d{4}-\d{2}-\d{2}T/.test(ls.d.pa_cookie_consent_at));
  t('blocked storage never breaks the page (the visitor is simply asked again next time)', A.readConsent(e(site, store({}, true))) === '' && (() => { try { A.writeConsent(e(site, store({}, true)), 'accepted'); return true; } catch (x) { return false; } })());
  const tz = (zone, ls, nav) => Object.assign(e(site, ls, nav), { __paTimeZone: zone });
  t('first visit from Europe: show the notice, nothing loads yet', A.decide(tz('Europe/Berlin', store({}))) === 'banner');
  t('first visit from the UK, Ireland, Iceland or Cyprus: the notice too', ['Europe/London', 'Europe/Dublin', 'Atlantic/Reykjavik', 'Asia/Nicosia', 'Atlantic/Canary'].every(z => A.decide(tz(z, store({}))) === 'banner'));
  t('first visit from the US or elsewhere: start Google, no notice', ['America/Chicago', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney', ''].every(z => A.decide(tz(z, store({}))) === 'start'));
  t('first visit from Moscow or Istanbul: no notice', A.decide(tz('Europe/Moscow', store({}))) === 'start' && A.decide(tz('Europe/Istanbul', store({}))) === 'start');
  t('a European visitor who accepted is not asked again', A.decide(tz('Europe/Paris', store({ pa_cookie_consent: 'accepted' }))) === 'start');
  t('a European visitor who declined is not asked again', A.decide(tz('Europe/Paris', store({ pa_cookie_consent: 'declined' }))) === 'none');
  t('a US visitor who declined (from Cookie settings) stays off', A.decide(tz('America/Chicago', store({ pa_cookie_consent: 'declined' }))) === 'none');
  const acc = e(site, store({ pa_cookie_consent: 'accepted' }));
  A.start(acc);
  t('after an accept, Google gets no "denied" default for any region', acc.dataLayer.map(a => Array.prototype.slice.call(a)).every(c => !(c[0] === 'consent' && c[2] && c[2].region)));
  t('accepted before: start Google, no notice', A.decide(e(site, store({ pa_cookie_consent: 'accepted' }))) === 'start');
  t('declined before: do nothing, no notice', A.decide(e(site, store({ pa_cookie_consent: 'declined' }))) === 'none');
  t('Do Not Track: nothing, even if they had accepted', A.decide(e(site, store({ pa_cookie_consent: 'accepted' }), { doNotTrack: '1' })) === 'none' && A.decide(e(site, store({}), { doNotTrack: '1' })) === 'none');
  t('Global Privacy Control: nothing, and no notice', A.decide(e(site, store({}), { globalPrivacyControl: true })) === 'none');
  t('a local test server still shows the notice (so it can be tested) but never starts Google', A.decide(Object.assign(e('http://localhost:8000/', store({})), { __paTimeZone: 'Europe/Berlin' })) === 'banner' && A.start(e('http://localhost:8000/', store({ pa_cookie_consent: 'accepted' }))) === false);
  const e2 = e(site, store({ pa_cookie_consent: 'accepted' }));
  t('Google is started once per page, however many times it is asked', A.start(e2) === true && A.start(e2) === false && e2.appended.length === 1);
  t('Google is not started on the real site unless start is called (accepting is what calls it)', (() => { const x = e(site, store({})); return !x.dataLayer && x.appended.length === 0; })());
  t('the choice key is the one the pages and tests use', A.KEY === 'pa_cookie_consent');
}

console.log('--- the notice is wired into the pages ---');
{
  const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
  ['index', 'lesson', 'profile'].forEach(p => t(p + '.html has a "Cookie settings" link in its footer', /data-cookie-settings[^>]*>Cookie settings<\/a>/.test(read(p + '.html'))));
  t('the dashboard\'s Profile menu has "Cookie settings"', /profile-dropdown-item" href="#" data-cookie-settings>Cookie settings<\/a>/.test(read('lms-dashboard.html')));
  const menu = read('account-menu.js');
  t('signing in counts as accepting (account-menu.js calls acceptFromAccount for every signed-in person, with or without the menu)', /PAAnalytics\.acceptFromAccount\(\)/.test(menu) && menu.indexOf('acceptFromAccount') < menu.indexOf('if (!MENU) return;'));
  t('the Profile menu has a "Cookie settings" button that reopens the notice', /Cookie settings/.test(menu) && /PAAnalytics\.reopen\(\)/.test(menu));
  const an = read('analytics.js');
  t('no Google script is added except inside start()', (an.match(/googletagmanager/g) || []).length === 1 && /function start\(env\)[\s\S]*googletagmanager/.test(an));
  t('the notice links to the Privacy Policy used elsewhere on the site', an.indexOf('https://www.productadvisory.co/privacy-policy') > -1);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
