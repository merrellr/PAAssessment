// Tests for section 20 of apps-script/Code.gs: the monthly data check (is any Sheet ready to move to Firestore?).
// Run:  node --experimental-default-type=module tests/growth-check.test.mjs
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

let props, mail, triggers, quota, claims, files;
const book = (id, name, tabs) => ({
  getId: () => id, getName: () => name,
  getSheets: () => tabs.map(([n, rows, cols, type]) => type === 'OBJECT'
    ? { getName: () => n, getType: () => 'OBJECT', getLastRow: () => { throw new Error('The action is not supported for OBJECT sheet.'); }, getMaxRows: () => { throw new Error('The action is not supported for OBJECT sheet.'); }, getMaxColumns: () => { throw new Error('The action is not supported for OBJECT sheet.'); } }
    : { getName: () => n, getType: () => 'GRID', getLastRow: () => rows + 1, getMaxRows: () => rows + 1, getMaxColumns: () => cols || 10 })
});
const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, RegExp, Set, Error,
  Logger: { log(){} },
  Session: { getScriptTimeZone: () => 'UTC', getEffectiveUser: () => ({ getEmail: () => 'rob@productadvisory.co' }) },
  Utilities: { formatDate: (d, tz, f) => f === 'Z' ? '+0000' : new Date(d).toISOString().slice(0, 10) },
  ContentService: { MimeType: {}, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); } }) },
  SpreadsheetApp: {
    SheetType: { GRID: 'GRID', OBJECT: 'OBJECT' },
    getActiveSpreadsheet: () => files.main,
    openById: (id) => { if (!files[id]) throw new Error('You do not have permission'); return files[id]; }
  },
  MailApp: { getRemainingDailyQuota: () => quota, sendEmail: (m) => mail.push(m) },
  GmailApp: { getAliases: () => [] },
  ScriptApp: {
    getScriptId: () => 'script1',
    getProjectTriggers: () => triggers,
    deleteTrigger: (x) => { triggers = triggers.filter(y => y !== x); },
    newTrigger: (fn) => { const tr = { fn, getHandlerFunction: () => fn }; const b = { timeBased: () => b, onMonthDay: (d) => { tr.day = d; return b; }, atHour: (h) => { tr.hour = h; return b; }, create: () => { triggers.push(tr); return tr; } }; return b; }
  },
  UrlFetchApp: { fetch(){ throw new Error('no network'); } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'notify.gs'), 'utf8'), ctx, { filename: 'notify.gs' });
// The claim (section 16) is stubbed: once per id.
ctx.notifyClaim_ = (id) => { if (claims.has(id)) return 'taken'; claims.add(id); return 'ok'; };
ctx.notifyUnclaim_ = (id) => { claims.delete(id); };
const reset = () => { props = {}; mail = []; triggers = []; quota = 1400; claims = new Set(); files = {}; };

/* ---------------- which other spreadsheets to watch */
reset();
const ids = ctx.growthWatchIds_('https://docs.google.com/spreadsheets/d/1f0RYAFyjGRUQIhBgZ1Hszf5ree2BPlPj34csV6Q1gZQ/edit?usp=sharing, 1O-LxlVZRePkK9hqLufENno08Nt2H9NojAgw_NHUux0Y\n1O-LxlVZRePkK9hqLufENno08Nt2H9NojAgw_NHUux0Y nonsense');
t('addresses and bare ids are both understood, duplicates and junk dropped', ids.length === 2 && ids[0] === '1f0RYAFyjGRUQIhBgZ1Hszf5ree2BPlPj34csV6Q1gZQ' && ids[1] === '1O-LxlVZRePkK9hqLufENno08Nt2H9NojAgw_NHUux0Y', JSON.stringify(ids));
t('nothing set means only this spreadsheet', ctx.growthWatchIds_(null).length === 0);

/* ---------------- the report */
const R = (fls, last) => ctx.growthReport_(fls, last || {}, {});
let r = R([{ id: 'a', name: 'Results', cells: 20000, tabs: [{ name: 'Leads', rows: 40 }, { name: 'Feedback', rows: 12 }] }]);
t('small logs: all clear, nothing flagged', r.flags.length === 0 && r.subject === 'Monthly data check: all clear' && /Nothing to do/.test(r.text), r.subject);
t('the first month shows the tabs as new (nothing to compare with yet)', /Leads: 40 rows \(new this month\)/.test(r.text), r.text);
t('it remembers this month\'s counts for next month', r.counts['a|Leads'] === 40 && r.counts['a|Feedback'] === 12);

r = R([{ id: 'a', name: 'Results', cells: 20000, tabs: [{ name: 'Leads', rows: 52000 }, { name: 'Usage', rows: 26000 }, { name: 'Feedback', rows: 100 }] }]);
t('50,000 rows says move now, 25,000 says plan it', r.flags.length === 2 && r.flags[0].tab === 'Leads' && r.flags[0].status === 'move' && r.flags[1].tab === 'Usage' && r.flags[1].status === 'plan', JSON.stringify(r.flags));
t('the subject counts what needs a look', r.subject === 'Monthly data check: 2 things to look at', r.subject);
t('the email says what to do about it', /Move now: Results > Leads/.test(r.text) && /Ask Claude to move it/.test(r.text));

r = R([{ id: 'a', name: 'Results', cells: 20000, tabs: [{ name: 'Usage', rows: 14000 }] }], { 'a|Usage': 8000 });
t('a fast-growing tab is flagged before it gets there (6,000 a month reaches 50,000 in 6 months)', r.flags.length === 1 && r.flags[0].status === 'plan' && /about 6 months/.test(r.flags[0].why), JSON.stringify(r.flags));
t('the change since last month is shown', /Usage: 14,000 rows \(\+6,000 this month\)/.test(r.text), r.text);
r = R([{ id: 'a', name: 'Results', cells: 20000, tabs: [{ name: 'Usage', rows: 14000 }] }], { 'a|Usage': 13000 });
t('slow growth is fine', r.flags.length === 0);

r = R([{ id: 'a', name: 'Results', cells: 8500000, tabs: [{ name: 'Responses', rows: 9000 }] }]);
t('a spreadsheet near Google\'s 10 million cell limit is flagged', r.flags.length === 1 && r.flags[0].tab === '(whole file)' && r.flags[0].status === 'move' && /85%/.test(r.flags[0].why), JSON.stringify(r.flags));

r = R([{ id: 'x', name: 'Spreadsheet x', error: 'You do not have permission' }]);
t('a spreadsheet that cannot be opened is flagged, not skipped', r.flags.length === 1 && r.flags[0].status === 'error' && /could not be opened/.test(r.text));

r = R([{ id: 'a', name: '<Results>', cells: 1, tabs: [{ name: 'Leads & <b>', rows: 52000 }] }]);
t('names are escaped in the email', !/<b>/.test(r.html) && /&lt;b&gt;/.test(r.html));

r = R([{ id: 'a', name: 'Results', cells: 1, tabs: [{ name: 'Leads', rows: 1 }] }]);
t('one row reads "1 row"', /Leads: 1 row \(/.test(r.text), r.text);

/* ---------------- the monthly run */
reset();
files.main = book('main', 'Product Advisory results', [['Leads', 40], ['Feedback', 5]]);
files['1f0RYAFyjGRUQIhBgZ1Hszf5ree2BPlPj34csV6Q1gZQ'] = book('1f0RYAFyjGRUQIhBgZ1Hszf5ree2BPlPj34csV6Q1gZQ', 'Product Advisory site log', [['Ask', 300]]);
props.GROWTH_WATCH_SHEETS = 'https://docs.google.com/spreadsheets/d/1f0RYAFyjGRUQIhBgZ1Hszf5ree2BPlPj34csV6Q1gZQ/edit, 1O-LxlVZRePkK9hqLufENno08Nt2H9NojAgw_NHUux0Y';
ctx.monthlyDataCheck();
t('it emails rob@ once', mail.length === 1 && mail[0].to === 'rob@productadvisory.co', JSON.stringify(mail.map(m => m.to)));
t('it covers this spreadsheet and the other logs', /Product Advisory results > Leads/.test(mail[0].body) && /Product Advisory site log > Ask: 300 rows/.test(mail[0].body), mail[0].body);
t('a log it cannot open is named in the email', /could not be opened/.test(mail[0].body) && mail[0].subject === 'Monthly data check: 1 thing to look at', mail[0].subject);
t('the header row is not counted', /Leads: 40 rows/.test(mail[0].body));

reset();
files.main = book('main', 'Results', [['Leads', 40], ['Funnel chart', 0, 0, 'OBJECT'], ['Feedback', 5]]);
ctx.monthlyDataCheck();
t('a chart on its own tab is skipped, not an error (the live sheet has one)', mail.length === 1 && /Leads: 40 rows/.test(mail[0].body) && /Feedback: 5 rows/.test(mail[0].body) && !/Funnel chart/.test(mail[0].body), mail[0] && mail[0].body);
t('this month\'s counts are saved for next month', JSON.parse(props.GROWTH_LAST)['main|Leads'] === 40);
ctx.monthlyDataCheck();
t('a second run in the same month (another copy of the script) sends nothing', mail.length === 1);

reset();
files.main = book('main', 'Results', [['Leads', 40]]);
quota = 0;
ctx.monthlyDataCheck();
t('no email allowance left: nothing is sent and nothing is claimed', mail.length === 0 && claims.size === 0);

/* ---------------- the schedule */
reset();
ctx.installMonthlyDataCheck(); ctx.installMonthlyDataCheck();
t('install sets one trigger, on the 1st around 9am, even when run twice', triggers.length === 1 && triggers[0].fn === 'monthlyDataCheck' && triggers[0].day === 1 && triggers[0].hour === 9);
ctx.removeMonthlyDataCheck();
t('remove switches it off', triggers.length === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
