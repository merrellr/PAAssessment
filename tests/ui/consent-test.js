// Drives the real analytics.js cookie notice (and account-menu.js's part in it) in a plain page.
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const stored = () => { try { return localStorage.getItem('pa_cookie_consent') || ''; } catch (e) { return ''; } };
const storedAt = () => { try { return localStorage.getItem('pa_cookie_consent_at') || ''; } catch (e) { return ''; } };
const banner = () => $('paCookieBanner');

(async function run(){
  try {
    await sleep(500);
    t('the analytics script is on the page and never starts Google on a local test server', !!window.PAAnalytics && window.dataLayer === undefined && !document.querySelector('script[src*="googletagmanager"]'));

    if (scn === 'new'){
      t('a first-time visitor sees the cookie notice', !!banner() && /Cookies and analytics/.test(banner().textContent));
      t('it says what it is for, that it sets cookies, and that it is not for advertising', /Google Analytics/.test(banner().textContent) && /sets cookies/.test(banner().textContent) && /not use it for advertising/.test(banner().textContent));
      t('it links to the Privacy Policy, opening in a new tab', (() => { const a = banner().querySelector('a'); return !!a && a.href === 'https://www.productadvisory.co/privacy-policy' && a.target === '_blank' && /noopener/.test(a.rel); })());
      t('Accept and Decline are both there, as equal buttons', !!$('paCookieAccept') && !!$('paCookieDecline') && $('paCookieAccept').className === $('paCookieDecline').className);
      t('it is announced as a region with a name, for screen readers', banner().getAttribute('role') === 'region' && /Cookies/.test(banner().getAttribute('aria-label')));
      t('nothing is remembered yet', stored() === '' && PAAnalytics.state().consent === '' && PAAnalytics.state().banner === true);
      $('paCookieDecline').click(); await sleep(30);
      t('Decline is remembered and the notice goes away', stored() === 'declined' && !banner() && /^\d{4}-\d{2}-\d{2}T/.test(storedAt()) && PAAnalytics.state().consent === 'declined');
      t('a decline never starts Google', PAAnalytics.state().started === false);
      t('the choice can be changed from a "Cookie settings" link', (() => { const a = document.createElement('a'); a.href = '#'; a.setAttribute('data-cookie-settings', ''); a.textContent = 'Cookie settings'; document.body.appendChild(a); a.click(); return !!banner(); })());
      $('paCookieAccept').click(); await sleep(30);
      t('Accept is remembered and the notice goes away', stored() === 'accepted' && !banner() && PAAnalytics.state().consent === 'accepted');
      t('the reopened notice does not stack up a second one', document.querySelectorAll('#paCookieBanner').length === 0);
      PAAnalytics.reopen(); PAAnalytics.reopen();
      t('opening it twice still shows only one', document.querySelectorAll('#paCookieBanner').length === 1);
    } else if (scn === 'us_new'){
      t('a first-time visitor outside Europe is not shown the notice', !banner() && stored() === '' && PAAnalytics.state().banner === false);
      t('(on a local test server Google still never starts)', PAAnalytics.state().started === false);
      t('they can still open "Cookie settings"', (() => { PAAnalytics.reopen(); return !!banner(); })());
      $('paCookieDecline').click(); await sleep(30);
      t('and a Decline from there is remembered', stored() === 'declined' && !banner());
    } else if (scn === 'stored_accepted'){
      t('someone who accepted before is not asked again', !banner() && PAAnalytics.state().consent === 'accepted');
    } else if (scn === 'stored_declined'){
      t('someone who declined before is not asked again', !banner() && PAAnalytics.state().consent === 'declined');
      PAAnalytics.reopen();
      t('but can open the settings and change their mind', !!banner());
    } else if (scn === 'signedin'){
      t('someone who is signed in is not shown the notice', !banner());
      t('and counts as having accepted, recorded as accepted on this device', stored() === 'accepted' && PAAnalytics.state().consent === 'accepted');
      t('their Profile menu has "Cookie settings", which opens the notice again', (() => { const b = $('paAccountBtn'); b.click(); const c = $('paAccountCookies'); if (!c) return false; c.click(); return !!banner() && $('paAccountMenu').hidden === true; })());
      $('paCookieDecline').click(); await sleep(30);
      t('they can still decline from there', stored() === 'declined' && !banner());
    } else if (scn === 'signedin_declined'){
      t('someone who clicked Decline and then signed in stays declined', stored() === 'declined' && !banner());
    } else if (scn === 'dnt' || scn === 'gpc'){
      t('a visitor whose browser says Do Not Track / Global Privacy Control is neither tracked nor shown the notice', !banner() && PAAnalytics.state().started === false && stored() === '');
      PAAnalytics.reopen();
      t('and "Cookie settings" does nothing for them', !banner());
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
})();
