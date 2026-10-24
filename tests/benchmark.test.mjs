// Tests for section 19 of apps-script/Code.gs: the anonymised benchmark report.
// Run:  node --experimental-default-type=module tests/benchmark.test.mjs
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
let tabs, logs, props;
const sheet = (name) => {
  const rows = tabs[name];
  return { getDataRange: () => ({ getValues: () => rows }), clear(){ rows.length = 0; }, setFrozenRows(){},
    getRange: (r, c, n, w) => ({ setValues: (v) => { v.forEach((x, i) => { rows[r - 1 + i] = x; }); } }) };
};
const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, RegExp, Set, Error,
  Logger: { log(m){ logs.push(String(m)); } },
  Session: { getScriptTimeZone: () => 'UTC', getEffectiveUser: () => ({ getEmail: () => 'owner@gmail.com' }) },
  Utilities: { formatDate: (d) => new Date(d).toISOString().slice(0, 10) },
  ContentService: { MimeType: {}, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null) }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => (tabs[n] ? sheet(n) : null), insertSheet: (n) => { tabs[n] = []; return sheet(n); } }) },
  UrlFetchApp: { fetch(){ throw new Error('no network'); } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });

// rows: [time, name, email, company, title, size, industry, overall, tier, 7 areas...]
const row = (iso, email, pct, tier, size, industry, areas) => [new Date(iso), 'Name', email, 'Co', 'PM', size, industry, pct, tier].concat(areas || [pct, pct, pct, pct, pct, 30, 20]);
const rows = [];
for (let i = 0; i < 12; i++) rows.push(row('2026-03-0' + (1 + (i % 9)) + 'T10:00:00Z', 'p' + i + '@a.com', 60, 'Moderate Experience', '51-200', 'Healthcare'));
for (let i = 0; i < 20; i++) rows.push(row('2026-04-01T10:00:00Z', 'q' + i + '@b.com', 80, 'Lots of Experience', '1000+', i < 4 ? 'Retail' : 'Software'));
rows.push(row('2026-01-01T10:00:00Z', 'p0@a.com', 40, 'Limited Experience', '51-200', 'Healthcare'));   // p0's first try: retake +20
rows.push(row('2026-05-01T10:00:00Z', 'owner@gmail.com', 99, 'Advanced Experience', '1-10', 'Consulting'));
rows.push(row('2026-05-01T10:00:00Z', 'rob@productadvisory.co', 99, 'Advanced Experience', '1-10', 'Consulting'));
rows.push(row('2026-05-01T10:00:00Z', 'tester@x.com', 5, 'Limited Experience', '1-10', 'Consulting'));
rows.push(['', '', '', '', '', '', '', '', '']);
props = { BENCHMARK_EXCLUDE: 'tester@x.com' };

const b = ctx.benchmarkFrom_(rows, ctx.bmExcluded_());
t('each person once, at their latest attempt; owner, @productadvisory.co and excluded test accounts left out', b.people === 32 && b.attempts === 33, b.people + '/' + b.attempts);
t('the average uses latest attempts only', b.overall.mean === Math.round((12 * 60 + 20 * 80) / 32 * 10) / 10 && b.overall.median === 80, JSON.stringify(b.overall));
t('tiers as shares of people', JSON.stringify(b.tiers.map(x => x.tier + ':' + x.share)) === '["Lots of Experience:63","Moderate Experience:38"]', JSON.stringify(b.tiers));
t('areas from strongest to weakest, with the share under 50%', b.areas[b.areas.length - 1].key === 'aiOrg' && b.areas[b.areas.length - 1].below50 === 100 && b.areas[0].mean > b.areas[6].mean);
t('retakes: how much people improved', b.retakes && b.retakes.people === 1 && b.retakes.meanChange === 20 && b.retakes.improved === 100);
const names = b.groups.map(g => g.name).sort();
t('groups of 10 or more are shown; smaller ones (Retail, 4 people) are hidden', JSON.stringify(names) === '["1000+","51-200","Healthcare","Software"]', JSON.stringify(names));
t('30 or more people: ready to publish', b.publishable === true);
t('no names, emails or companies anywhere in the result', !/@|Name|"Co"/.test(JSON.stringify(b)));

tabs = { Responses: [['Timestamp']].concat(rows) }; logs = [];
ctx.benchmarkReport();
const tab = tabs.Benchmark;
t('the Benchmark tab is written, with a header and the key lines', tab[0][0] === 'Benchmark' && tab.some(r => r[0] === 'People' && r[1] === 32) && tab.some(r => /^Area: AI fluency \(organizational\)/.test(r[0]) && /weakest/.test(r[2])));
t('and a one-line summary is logged', /32 people \(33 assessments\)\. Average .*Weakest: AI fluency \(organizational\)\. Enough to publish/.test(logs[0]), logs[0]);
t('the tab never contains an email', !JSON.stringify(tab).includes('@a.com') && !JSON.stringify(tab).includes('@b.com'));

const small = ctx.benchmarkFrom_(rows.slice(0, 5), []);
t('fewer than 30 people: marked not ready to publish', small.publishable === false && small.people === 5);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
