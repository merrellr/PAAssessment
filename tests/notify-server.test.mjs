// Tests for section 16 of apps-script/Code.gs (check-in emails and company reports) together with
// apps-script/notify.gs. Both are loaded into a sandbox with stand-ins for Google's services and a small
// in-memory Firestore, so nothing real is touched.
// Run:  node --experimental-default-type=module tests/notify-server.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

const DAY = 86400000;
const MON = Date.parse('2026-10-19T16:00:00Z');      // a Monday, 4pm UTC (the script's time zone here)
const cat = { discovery: 30, strategy: 60, prioritization: 80, execution: 45, stakeholder: 70, aiIndividual: 20, aiOrg: 55 };
const TS = (iso) => ({ __ts: iso });

/* ------------------------------------------------ an in-memory Firestore */
let store, users, sheets, props, sentMail, quota, fetchLog, tokenFetches, failPaths;
function reset(){
  props = { FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ client_email: 'sa@x.iam.gserviceaccount.com', private_key: 'KEY' }) };
  sheets = { Responses: [['Timestamp'], [new Date(MON - 50 * DAY), 'Old', 'old@x.com', '', '', '', '', 40, 'Moderate Experience', 30, 60, 80, 45, 70, 20, 55]] };
  sentMail = []; quota = 1400; fetchLog = []; tokenFetches = 0; failPaths = [];
  const old = String(MON - 90 * DAY);
  users = [
    { localId: 'learner1', email: 'Jane@Acme.com', displayName: 'Jane Doe', emailVerified: true, createdAt: old },
    { localId: 'unverif1', email: 'u@x.com', emailVerified: false, createdAt: old },
    { localId: 'offuser1', email: 'off@x.com', emailVerified: true, createdAt: old },
    { localId: 'newuser1', email: 'new@x.com', emailVerified: true, createdAt: String(MON - 3600000) },
    { localId: 'disabld1', email: 'd@x.com', emailVerified: true, disabled: true, createdAt: old },
    { localId: 'olduser1', email: 'old@x.com', displayName: 'Olive Old', emailVerified: true, createdAt: old },
    { localId: 'admin001', email: 'pat@acme.com', displayName: 'Pat Admin', emailVerified: true, createdAt: old },
    { localId: 'admin002', email: 'arch@z.com', emailVerified: true, createdAt: old }
  ];
  store = {
    'progress/learner1': { goals: { weeklyLessons: 2, focus: ['aiIndividual'] }, lessonLog: { '2026-10-13': 1, '2026-10-15': 1 }, courses: {}, assessmentResult: { overallPct: 50, categoryPct: cat } },
    'progress/offuser1': { notify: { checkin: 'off' } },
    'progress/olduser1': { courses: {} },
    'progress/admin001': { notify: { checkin: 'off', orgReport: 'weekly' } },
    'progress/admin002': { notify: { checkin: 'off' } },
    'memberships/admin001': { orgId: 'org1', role: 'admin', status: 'active', email: 'pat@acme.com', displayName: 'Pat Admin', joinedAt: TS(new Date(MON - 60 * DAY).toISOString()) },
    'memberships/learner1': { orgId: 'org1', role: 'member', status: 'active', email: 'jane@acme.com', displayName: 'Jane Doe', joinedAt: TS(new Date(MON - 60 * DAY).toISOString()) },
    'memberships/admin002': { orgId: 'org2', role: 'admin', status: 'active', email: 'arch@z.com', joinedAt: TS(new Date(MON - 60 * DAY).toISOString()) },
    'orgs/org1': { name: 'TestCo', plan: 'seat', seatLimit: 10, status: 'active', focusAreas: ['aiIndividual', 'discovery', 'strategy'] },
    'orgs/org2': { name: 'Archived Inc', plan: 'flat', status: 'archived' },
    'orgs/org1/members/learner1': { identity: { name: 'Jane Doe', email: 'jane@acme.com' }, assessment: { overallPct: 50, categoryPct: cat, answers: [] }, courses: { 'aiIndividual-novice': { completed: [1] } }, lastActiveAt: '2026-10-15T18:00:00Z' },
    'invites/inv1': { orgId: 'org1', status: 'open', role: 'member', email: 'x@acme.com', expiresAt: TS(new Date(MON + 5 * DAY).toISOString()) }
  };
}

function enc(v){
  if (v === null || v === undefined) return { nullValue: null };
  if (v.__ts) return { timestampValue: v.__ts };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  const f = {}; Object.keys(v).forEach(k => { f[k] = enc(v[k]); }); return { mapValue: { fields: f } };
}
const docOut = (p) => ({ name: 'projects/product-advisory-lms/databases/(default)/documents/' + p, fields: enc(store[p]).mapValue.fields });
const children = (col) => Object.keys(store).filter(p => p.indexOf(col + '/') === 0 && p.slice(col.length + 1).indexOf('/') === -1);

function firestore(url, opts){
  const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
  if (opts.headers.Authorization !== 'Bearer sa-token') return res(401, {});
  const base = 'https://firestore.googleapis.com/v1/projects/product-advisory-lms/databases/(default)/documents';
  const [pathPart, qs] = url.slice(base.length).split('?');
  const method = (opts.method || 'get').toLowerCase();
  if (pathPart === ':runQuery'){
    const sq = JSON.parse(opts.payload).structuredQuery;
    const col = sq.from[0].collectionId, f = sq.where.fieldFilter;
    return res(200, children(col).filter(p => store[p][f.field.fieldPath] === f.value.stringValue).map(p => ({ document: docOut(p) })).concat([{ readTime: 'x' }]));
  }
  if (pathPart === ':batchGet'){
    return res(200, JSON.parse(opts.payload).documents.map(n => { const p = n.split('/documents/')[1]; return store[p] ? { found: docOut(p) } : { missing: n }; }));
  }
  const p = decodeURIComponent(pathPart.slice(1));
  if (failPaths.some(f => p.indexOf(f) === 0)) return res(500, {});
  if (method === 'patch'){
    if (!store[p]) return res(404, {});
    const fields = JSON.parse(opts.payload).fields.notify.mapValue.fields;
    const kind = Object.keys(fields)[0];
    store[p].notify = Object.assign({}, store[p].notify, { [kind]: fields[kind].stringValue });
    return res(200, docOut(p));
  }
  if (p.split('/').length % 2 === 1) return res(200, { documents: children(p).map(docOut) });
  return store[p] ? res(200, docOut(p)) : res(404, {});
}

const mkSheet = (name) => {
  const rows = sheets[name];
  return {
    appendRow: (r) => { rows.push(r); }, getLastRow: () => rows.length, setFrozenRows(){},
    getDataRange: () => ({ getValues: () => rows }),
    getRange: (row, col, n, w) => ({
      getValues: () => rows.slice(row - 1, row - 1 + n).map(r => [r[col - 1]]),
      setValues: (vals) => { vals.forEach((v, i) => { rows[row - 1 + i] = v.slice(); }); } }),
    deleteRow: (i) => { rows.splice(i - 1, 1); }
  };
};

const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, decodeURIComponent, RegExp, Set, Error,
  Logger: { log(m){ sandbox.__log.push(String(m)); } }, __log: [],
  Session: { getScriptTimeZone: () => 'UTC', getEffectiveUser: () => ({ getEmail: () => 'pat@acme.com' }) },
  Utilities: {
    formatDate: (d, tz, f) => (f === 'Z' ? '+0000' : new Date(d).toISOString().slice(0, 10)),
    base64EncodeWebSafe: (x) => Buffer.from(typeof x === 'string' ? x : Uint8Array.from(x)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    computeRsaSha256Signature: (input, key) => Array.from(crypto.createHash('sha256').update(key + input).digest()),
    computeHmacSha256Signature: (input, key) => Array.from(crypto.createHmac('sha256', key).update(input).digest()),
    getUuid: () => crypto.randomUUID()
  },
  ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); },
    deleteProperty: (k) => { delete props[k]; }, getKeys: () => Object.keys(props) }) },
  CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {}, waitLock() {} }) },
  MailApp: { getRemainingDailyQuota: () => quota, sendEmail: (m) => { sentMail.push(m); quota--; } },
  GmailApp: { getAliases: () => [], sendEmail(){} },
  ScriptApp: { getProjectTriggers: () => [], newTrigger(){ return { timeBased(){ return { everyHours(){ return { create(){} }; } }; } }; }, deleteTrigger(){} },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({
    getSheetByName: (n) => (sheets[n] ? mkSheet(n) : null),
    insertSheet: (n) => { sheets[n] = []; return mkSheet(n); } }) },
  UrlFetchApp: { fetch: (url, opts) => {
    opts = opts || {};
    fetchLog.push({ url, opts });
    const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
    if (url === 'https://oauth2.googleapis.com/token'){
      tokenFetches++;
      const parts = String(opts.payload.assertion).split('.');
      const claim = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
      sandbox.__lastClaim = claim;
      return parts.length === 3 && opts.payload.grant_type === 'urn:ietf:params:oauth:grant-type:jwt-bearer' ? res(200, { access_token: 'sa-token' }) : res(400, {});
    }
    if (url.indexOf('/accounts:batchGet') > -1){
      if (opts.headers.Authorization !== 'Bearer sa-token') return res(401, {});
      return res(200, { users: users });
    }
    if (url.indexOf('accounts:lookup') > -1){
      const tok = JSON.parse(opts.payload).idToken;
      const u = users.filter(x => tok === x.localId + '-token')[0];
      return u ? res(200, { users: [u] }) : res(400, {});
    }
    if (url.indexOf('firestore.googleapis.com') > -1) return firestore(url, opts);
    throw new Error('unexpected url ' + url);
  } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'notify.gs'), 'utf8'), ctx, { filename: 'notify.gs' });
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
const G = (name) => ctx[name];
const toAddr = (m) => m.to;

console.log('--- the service account ---');
reset();
{
  t('a token is made from the key with a signed JWT for Google Cloud', G('fsServiceToken_')() === 'sa-token' && sandbox.__lastClaim.iss === 'sa@x.iam.gserviceaccount.com' && /cloud-platform/.test(sandbox.__lastClaim.scope) && sandbox.__lastClaim.exp - sandbox.__lastClaim.iat === 3600);
  G('fsServiceToken_')();
  t('the token is reused while it is fresh', tokenFetches === 1);
  delete props.FIREBASE_SERVICE_ACCOUNT; delete props.fs_sa_token;
  let threw = ''; try { G('fsServiceToken_')(); } catch (e) { threw = e.message; }
  t('without the key, it says so plainly', threw === 'no_service_account');
  sandbox.__log.length = 0; G('checkNotificationsSetup')();
  t('the setup check explains what to add', /FIREBASE_SERVICE_ACCOUNT/.test(sandbox.__log.join(' ')));
}

console.log('--- reading Firestore ---');
reset();
{
  const d = G('fsGet_')('orgs/org1');
  t('a document comes back as plain values', d.name === 'TestCo' && d.seatLimit === 10 && d.focusAreas.join() === 'aiIndividual,discovery,strategy');
  t('a missing document is null', G('fsGet_')('orgs/nope') === null);
  t('a collection lists its documents with ids', G('fsList_')('orgs/org1/members').map(x => x.id).join() === 'learner1');
  t('a query finds documents by a field', G('fsWhere_')('memberships', 'orgId', 'org1').map(x => x.id).sort().join() === 'admin001,learner1');
  const many = G('fsGetMany_')('progress', ['learner1', 'nobody']);
  t('several documents at once, missing ones left out', Object.keys(many).join() === 'learner1' && many.learner1.goals.weeklyLessons === 2);
  const od = G('notifyOrgData_')('org1');
  t('a company is read the way its dashboard reads it', od.org.name === 'TestCo' && od.rows.length === 2 && od.invites.length === 1 && od.invites[0].expiresAtMs > MON);
}

console.log('--- who is due ---');
reset();
{
  const r = G('notifyRun_')(MON, { dryRun: true });
  t('dry run: counts without sending', sentMail.length === 0 && r.checkinsDue === 2 && r.reportsDue === 1, JSON.stringify(r));
  // learner1 (goal set) and olduser1 (no settings: weekly) are due; unverified, off, brand-new and disabled are not.
}

console.log('--- a real run ---');
reset();
{
  const r = G('notifyRun_')(MON);
  const to = sentMail.map(toAddr).sort().join();
  t('sends the due check-ins and the company report', r.sent === 3 && to === 'jane@acme.com,old@x.com,pat@acme.com', to + ' ' + JSON.stringify(r));
  const jane = sentMail.filter(m => m.to === 'jane@acme.com')[0];
  t('the check-in covers last week and the goal', jane.subject === 'Your weekly check-in: 2 of 2 lessons last week' && /You hit your goal last week/.test(jane.htmlBody), jane.subject);
  t('its links carry a working signature', (() => { const m = /email-settings\?u=learner1&amp;k=([A-Za-z0-9_-]+)&amp;off=checkin/.exec(jane.htmlBody); return m && m[1] === G('notifySig_')('learner1'); })());
  const old = sentMail.filter(m => m.to === 'old@x.com')[0];
  t('an older account without the result in Firestore uses the Responses tab', /Your plan/.test(old.htmlBody) && !/start with the assessment/.test(old.subject), old.subject);
  const rep = sentMail.filter(m => m.to === 'pat@acme.com')[0];
  t('the admin report is for their company, with a link to the full report', /^TestCo — weekly learning report: 1 person active last week$/.test(rep.subject) && rep.htmlBody.indexOf('company?org=org1#reportCard') > -1, rep.subject);
  t('the archived company gets no report', !sentMail.some(m => m.to === 'arch@z.com'));
  const tab = sheets.Notifications;
  t('the Notifications tab records each one', tab.length === 4 && tab[0][0] === 'Key' && tab.slice(1).every(row => row[7] === 'Sent') && tab.some(row => row[0] === 'org:org1:admin001' && row[4] === 'TestCo'));
  const again = G('notifyRun_')(MON + 3600000);
  t('the next hourly run sends nothing more this week', again.sent === 0 && sentMail.length === 3 && again.checkinsDue === 0 && again.reportsDue === 0, JSON.stringify(again));
  const nextWeek = G('notifyRun_')(MON + 7 * DAY);
  t('next Monday they go out again, and the account made last week gets its first', nextWeek.sent === 4 && sentMail.some(m => m.to === 'new@x.com') && sheets.Notifications.length === 5, JSON.stringify(nextWeek) + ' rows=' + sheets.Notifications.length);
}

console.log('--- limits ---');
reset();
{
  const early = G('notifyRun_')(Date.parse('2026-10-19T07:00:00Z'));
  t('nothing goes out before 8am', early.stopped === 'before_8am' && sentMail.length === 0);
  quota = 61;
  const r = G('notifyRun_')(MON);
  t('stops while the daily allowance is still kept for invites and welcomes', r.sent === 1 && r.stopped === 'daily_limit' && quota === 60, JSON.stringify(r));
  quota = 1400;
  const rest = G('notifyRun_')(MON + 3600000);
  t('what was left goes out on the next run', rest.sent === 2 && sentMail.length === 3);
}
reset();
{
  failPaths = ['orgs/org1'];
  const r = G('notifyRun_')(MON);
  t('one company that cannot be read does not stop the check-ins', r.sent === 2 && r.failed === 1 && sheets.Notifications.some(row => /^Failed/.test(row[7])), JSON.stringify(r));
  failPaths = [];
  t('and it is not retried every hour', G('notifyRun_')(MON + 3600000).reportsDue === 0);
}

console.log('--- the email settings page ---');
reset();
{
  const sig = G('notifySig_')('learner1');
  t('a wrong signature is refused', G('emailPrefsEndpoint_')('learner1', 'nope', '', '').error === 'bad_link' && G('emailPrefsEndpoint_')('learner1', G('notifySig_')('olduser1'), '', '').error === 'bad_link');
  const r = G('emailPrefsEndpoint_')('learner1', sig, '', '');
  t('shows the current choices (weekly by default)', r.ok && r.checkin === 'weekly' && r.orgReport === 'weekly' && r.admin === false, JSON.stringify(r));
  const off = G('emailPrefsEndpoint_')('learner1', sig, 'checkin', 'off');
  t('one click turns the check-in off', off.ok && off.checkin === 'off' && store['progress/learner1'].notify.checkin === 'off' && store['progress/learner1'].goals.weeklyLessons === 2);
  t('and the next run skips them', G('notifyRun_')(MON, { dryRun: true }).checkinsDue === 1);
  t('a frequency can be chosen too', G('emailPrefsEndpoint_')('learner1', sig, 'checkin', 'monthly').checkin === 'monthly');
  t('an unknown choice is refused', G('emailPrefsEndpoint_')('learner1', sig, 'checkin', 'hourly').error === 'bad_choice' && G('emailPrefsEndpoint_')('learner1', sig, 'everything', 'off').error === 'bad_choice');
  const a = G('emailPrefsEndpoint_')('admin001', G('notifySig_')('admin001'), 'orgReport', 'daily');
  t('an admin sees the report choice and their company', a.ok && a.admin && a.orgName === 'TestCo' && a.orgReport === 'daily' && store['progress/admin001'].notify.checkin === 'off');
  t('an account with no progress is not created by a link', G('emailPrefsEndpoint_')('newuser1', G('notifySig_')('newuser1'), 'checkin', 'off').error === 'no_account' && !store['progress/newuser1']);
  delete props.FIREBASE_SERVICE_ACCOUNT; delete props.fs_sa_token;
  t('before the key is added the page says it is not set up', G('emailPrefsEndpoint_')('learner1', sig, '', '').error === 'not_set_up');
  const out = G('doGet')({ parameter: { action: 'emailPrefs', u: 'learner1', k: 'x', callback: 'cb' } });
  t('the web app answers it as JSONP', /^cb\(\{"ok":false,"error":"bad_link"\}\);$/.test(out.text), out.text);
}

console.log('--- previews and deletion ---');
reset();
{
  G('sendMyCheckinPreview')();
  t('the preview goes to you, marked as a preview', sentMail.length === 1 && sentMail[0].to === 'pat@acme.com' && /^\[Preview\] Your weekly check-in/.test(sentMail[0].subject));
  G('sendOrgReportPreview')('org1');
  t('the company preview too', sentMail.length === 2 && /^\[Preview\] TestCo/.test(sentMail[1].subject));
  G('notifyRun_')(MON);
  const before = sheets.Notifications.length;
  const del = G('deleteAccountData_')('learner1-token');
  t('deleting an account removes its Notifications rows', del.ok && del.removed.notifications === 1 && sheets.Notifications.length === before - 1, JSON.stringify(del));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
