// Tests for section 17 of apps-script/Code.gs: our own "Add another email" sign-in link email.
// Run:  node --experimental-default-type=module tests/signin-link.test.mjs
// The script is loaded into a sandbox with stand-ins for Google's services, so nothing real is touched.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

let props, cache, sent, quota, oob, oobAsks;
const accounts = { 'tok-a': { localId: 'uA', email: 'Work@Acme.com' }, 'tok-b': { localId: 'uB', email: '<b>x</b>@evil.com' } };
function reset(){ props = { fs_sa_token: JSON.stringify({ token: 'sa', exp: Date.now() + 3600000 }) }; cache = {}; sent = []; quota = 100; oob = 'ok'; oobAsks = []; }
reset();
const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, RegExp, Set, Error,
  Logger: { log(){} },
  Session: { getScriptTimeZone: () => 'UTC', getEffectiveUser: () => ({ getEmail: () => 'rob@productadvisory.co' }) },
  Utilities: { formatDate: (d) => new Date(d).toISOString().slice(0, 10) },
  ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); },
    deleteProperty: (k) => { delete props[k]; }, getKeys: () => Object.keys(props) }) },
  CacheService: { getScriptCache: () => ({ get: (k) => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = v; } }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  MailApp: { getRemainingDailyQuota: () => quota, sendEmail: (m) => { sent.push(m); } },
  GmailApp: { getAliases: () => [], sendEmail(){} },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => null }) },
  UrlFetchApp: { fetch: (url, opts) => {
    if (/accounts:lookup/.test(url)) { const tok = JSON.parse(opts.payload).idToken; return accounts[tok] ? res(200, { users: [accounts[tok]] }) : res(400, {}); }
    if (/accounts:sendOobCode/.test(url)) {
      oobAsks.push({ url, auth: opts.headers.Authorization, body: JSON.parse(opts.payload) });
      return oob === 'ok' ? res(200, { oobLink: 'https://product-advisory-lms.firebaseapp.com/__/auth/action?mode=signIn&oobCode=X&a="b"' }) : res(403, {});
    }
    throw new Error('unexpected url ' + url);
  } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
const E = (tok, email) => ctx.signinLinkEndpoint_(tok, email);

t('a token Google does not accept is refused, and nothing is asked or sent', E('nope', 'me@home.net').error === 'not_verified' && !oobAsks.length && !sent.length);
t('a bad address is refused', E('tok-a', 'not an email').error === 'bad_email' && E('tok-a', 'a@b.com, c@d.com').error === 'bad_email');
t('the person\'s own main email is refused', E('tok-a', 'work@acme.com').error === 'same_email');
reset(); props.BLOCKED_SENDERS = '@spam.test';
t('a blocked address is refused', E('tok-a', 'x@spam.test').error === 'bad_email' && !sent.length);

reset();
const r = E('tok-a', ' Me@Home.net ');
const ask = oobAsks[0] || { body: {} };
t('a good request sends one email', r.ok === true && r.sent === true && sent.length === 1, JSON.stringify(r));
t('Firebase is asked for the link only, as the project, returning to My Profile on our site', /projects\/product-advisory-lms\/accounts:sendOobCode$/.test(ask.url) && ask.auth === 'Bearer sa' && ask.body.requestType === 'EMAIL_SIGNIN' && ask.body.returnOobLink === true && ask.body.canHandleCodeInApp === true && ask.body.email === 'me@home.net' && ask.body.continueUrl === 'https://assessment.productadvisory.co/profile?linkEmail=1#signin');
const m = sent[0] || {};
t('the email goes to the address being added, from Product Advisory Learning, replies to assessment@', m.to === 'me@home.net' && m.name === 'Product Advisory Learning' && m.replyTo === 'assessment@productadvisory.co' && /Add me@home\.net to your Product Advisory Learning account/.test(m.subject));
t('it says who asked and has the button with the link (made safe)', /<strong>work@acme\.com<\/strong> asked to add <strong>me@home\.net<\/strong>/.test(m.htmlBody) && /href="https:\/\/product-advisory-lms\.firebaseapp\.com\/__\/auth\/action\?mode=signIn&amp;oobCode=X&amp;a=&quot;b&quot;"/.test(m.htmlBody) && />Add this email</.test(m.htmlBody));
t('the plain-text version has the link and the "didn\'t ask" note', m.body.indexOf('oobCode=X') > -1 && /Didn't ask for this\? You can ignore this email/.test(m.body));
reset();
E('tok-b', 'me@home.net');
t('a name or email with HTML in it cannot add markup', sent[0].htmlBody.indexOf('<b>x</b>') === -1 && sent[0].htmlBody.indexOf('&lt;b&gt;x&lt;/b&gt;@evil.com') > -1);

reset();
for (let i = 0; i < 3; i++) E('tok-a', 'same@home.net');
t('at most 3 an hour to any one address', E('tok-a', 'same@home.net').error === 'rate' && sent.length === 3);
reset();
['a', 'b', 'c', 'd', 'e'].forEach(x => E('tok-a', x + '@home.net'));
t('at most 5 an hour per person', E('tok-a', 'f@home.net').error === 'rate' && sent.length === 5);
reset(); props['signinlinkday_' + new Date().toISOString().slice(0, 10)] = '40';
t('a daily limit in total', E('tok-a', 'me@home.net').error === 'daily_limit' && !sent.length);
reset(); quota = 10;
t('the last of Gmail\'s daily allowance is kept for everything else', E('tok-a', 'me@home.net').error === 'daily_limit');
reset(); oob = 'fail';
const bad = E('tok-a', 'me@home.net');
t('if Firebase gives no link, nothing is sent and the page is told (it then uses Firebase\'s own email)', bad.ok === false && bad.error === 'link_error' && !sent.length);
reset(); delete props.fs_sa_token;
t('without the service account key it says so, and sends nothing', E('tok-a', 'me@home.net').error === 'link_error' && !sent.length);

reset();
const via = ctx.doGet({ parameter: { action: 'signinLink', idToken: 'tok-a', email: 'me@home.net', callback: 'cb1' } });
t('the page reaches it through doGet', /^cb1\(/.test(via.text) && /"sent":true/.test(via.text) && sent.length === 1, via.text);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
