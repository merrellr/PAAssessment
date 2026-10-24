// Tests for section 18 of apps-script/Code.gs: copying past assessments from the Responses tab into each
// account's history (My Profile > My assessments). Code.gs and notify.gs are loaded into a sandbox with
// stand-ins for Google's services and a small in-memory Firestore, so nothing real is touched.
// Run:  node --experimental-default-type=module tests/history-import.test.mjs
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

const cat = (v) => [v, v, v, v, v, v, v];
const row = (iso, email, pct, tier, id) => [new Date(iso), 'Name', email, '', '', '', '', pct, tier].concat(cat(pct), Array(14).fill('A'), [id || '']);
let store, users, sheets, patches, logs;
function reset(){
  sheets = { Responses: [['Timestamp', 'Name', 'Email'],
    row('2025-11-01T10:00:00Z', 'Work@Acme.com', 40, 'Limited Experience'),            // first attempt, already kept on the account as "partial"
    row('2026-02-01T10:00:00Z', 'work@acme.com', 55, 'Moderate Experience'),           // a retake that was replaced
    row('2026-05-01T10:00:05Z', 'work@acme.com', 70, 'Lots of Experience', 'a3'),      // the latest, on the account with its id
    row('2026-03-01T10:00:00Z', 'me@home.net', 62, 'Moderate Experience'),            // from the email linked to the same account
    row('2026-04-01T10:00:00Z', 'nobody@x.com', 50, 'Moderate Experience'),           // took it without an account
    row('2026-04-02T10:00:00Z', 'norecord@x.com', 45, 'Moderate Experience'),         // an account with no learning record
    ['', '', '', '', '', '', '', '', '']] };
  users = [
    { localId: 'uWork', email: 'work@acme.com', providerUserInfo: [{ providerId: 'password', email: 'work@acme.com' }, { providerId: 'password', email: 'Me@Home.net' }] },
    { localId: 'uNoRec', email: 'norecord@x.com' },
    { localId: 'uNone', email: 'quiet@x.com' }
  ];
  store = {
    'progress/uWork': { courses: {}, assessmentResult: { overallPct: 70, tier: 'Lots of Experience', assessmentId: 'a3', categoryPct: { discovery: 70 }, answers: [{ n: 1 }],
      submittedAt: '2026-05-01T10:00:00.000Z', firstSubmittedAt: '2025-11-01T10:00:02.000Z', firstOverallPct: 40, firstTier: 'Limited Experience' } },
    'progress/uNone': { courses: {} }
  };
  patches = []; logs = [];
}
reset();

function enc(v){
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  const f = {}; Object.keys(v).forEach(k => { f[k] = enc(v[k]); }); return { mapValue: { fields: f } };
}
function dec(v){
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  const o = {}; Object.keys(v.mapValue.fields || {}).forEach(k => { o[k] = dec(v.mapValue.fields[k]); }); return o;
}
const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, decodeURIComponent, RegExp, Set, Error,
  Logger: { log(m){ logs.push(String(m)); } },
  Session: { getScriptTimeZone: () => 'UTC', getEffectiveUser: () => ({ getEmail: () => 'rob@x.com' }) },
  Utilities: { formatDate: (d) => new Date(d).toISOString().slice(0, 10) },
  ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'fs_sa_token' ? JSON.stringify({ token: 'sa', exp: Date.now() + 3600000 }) : null), setProperty(){}, deleteProperty(){}, getKeys: () => [] }) },
  CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  MailApp: { getRemainingDailyQuota: () => 100, sendEmail(){ throw new Error('no email expected'); } },
  GmailApp: { getAliases: () => [], sendEmail(){ throw new Error('no email expected'); } },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => (sheets[n] ? { getDataRange: () => ({ getValues: () => sheets[n] }) } : null) }) },
  UrlFetchApp: { fetch: (url, opts) => {
    opts = opts || {};
    if (/accounts:batchGet/.test(url)) return res(200, { users });
    const base = 'https://firestore.googleapis.com/v1/projects/product-advisory-lms/databases/(default)/documents/';
    if (url.indexOf(base) === 0) {
      const p = decodeURIComponent(url.slice(base.length).split('?')[0]);
      if ((opts.method || 'get') === 'patch') {
        if (!store[p]) return res(404, {});
        patches.push({ p, url });
        const f = JSON.parse(opts.payload).fields;
        Object.keys(f).forEach(k => { store[p][k] = dec(f[k]); });
        return res(200, {});
      }
      if (!store[p]) return res(404, {});
      return res(200, { name: base + p, fields: enc(store[p]).mapValue.fields });
    }
    throw new Error('unexpected url ' + url);
  } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'notify.gs'), 'utf8'), ctx, { filename: 'notify.gs' });
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });

ctx.previewAssessmentHistoryImport();
t('the preview changes nothing', patches.length === 0 && !store['progress/uWork'].assessmentHistory);
t('and says what it would do', /Preview, nothing changed\. 2 accounts have assessments.*1 would be updated, with 2 earlier assessments added/.test(logs[0]), logs.join(' / '));
t('it says how many emails have no account', logs.some(l => /^1 emails in the Responses tab have no account/.test(l)) && logs.some(l => /1 accounts were skipped because they have no learning record/.test(l)), logs.join(' / '));

logs = [];
ctx.importAssessmentHistory();
const h = store['progress/uWork'].assessmentHistory || [];
t('the account gets every past assessment, from both of its emails, oldest first', JSON.stringify(h.map(e => e.overallPct)) === '[40,55,62,70]', JSON.stringify(h));
t('the first attempt now has its area scores (it only had the overall score)', !h[0].partial && h[0].categoryPct && h[0].categoryPct.discovery === 40);
t('the latest is counted once and keeps its id', h.filter(e => e.overallPct === 70).length === 1 && h[3].assessmentId === 'a3');
t('dates and tiers come from the spreadsheet', h[1].submittedAt === '2026-02-01T10:00:00.000Z' && h[1].tier === 'Moderate Experience');
t('only the history is written, and only to an account that already has a record', patches.length === 1 && /updateMask\.fieldPaths=assessmentHistory&currentDocument\.exists=true/.test(patches[0].url) && !store['progress/uNoRec']);
t('the latest result itself is unchanged', store['progress/uWork'].assessmentResult.overallPct === 70 && !!store['progress/uWork'].assessmentResult.answers);
t('an account with no assessments is left alone', !store['progress/uNone'].assessmentHistory);

logs = [];
ctx.importAssessmentHistory();
t('running it again adds nothing and writes nothing', patches.length === 1 && (store['progress/uWork'].assessmentHistory || []).length === 4 && /0 were updated, with 0 earlier/.test(logs[0]), logs.join(' / '));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
