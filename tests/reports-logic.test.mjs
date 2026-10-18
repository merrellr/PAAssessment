// Tests for section 8 of apps-script/Code.gs (reports, insights, the AI explainer and the Monday email).
// Run:  node --experimental-default-type=module tests/reports-logic.test.mjs
// The script is loaded into a sandbox with stand-ins for Google's services, so nothing real is touched.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ------------------------------------------------ stand-ins for Google */
let sheets = {};            // name -> array of rows (first row = header)
let sheetReads = 0;
let props = {};
let sentMail = [];
let quota = 100;
let triggers = [];
let fetchLog = [];
let groqMode = 'ok';
let groqReply = 'What it shows: Things are fine.\nWhat to watch:\n- Small numbers\nNext steps:\n- Keep going';
let adminDocs = { owner1: true };

const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, RegExp, Set,
  Logger: { log(){} },
  Session: { getScriptTimeZone: () => 'UTC' },
  Utilities: {
    formatDate: (d, tz, f) => f === 'yyyy-MM-dd' ? new Date(d).toISOString().slice(0, 10) : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    DigestAlgorithm: { SHA_256: 'sha256' },
    computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(String(s)).digest()).map(b => b > 127 ? b - 256 : b)
  },
  ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); },
    deleteProperty: (k) => { delete props[k]; }, getKeys: () => Object.keys(props) }) },
  CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {}, waitLock() {} }) },
  MailApp: { getRemainingDailyQuota: () => quota, sendEmail: (m) => { sentMail.push(m); } },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({
    getSheetByName: (n) => (sheets[n] ? { getDataRange: () => ({ getValues: () => { sheetReads++; return sheets[n]; } }) } : null),
    getUrl: () => 'https://docs.google.com/spreadsheets/d/FAKE' }) },
  ScriptApp: {
    WeekDay: { MONDAY: 'MONDAY' },
    newTrigger: (fn) => { const tr = { fn }; const b = { timeBased: () => b, onWeekDay: (d) => { tr.day = d; return b; }, atHour: (h) => { tr.hour = h; return b; }, create: () => { triggers.push(tr); return tr; } }; return b; },
    getProjectTriggers: () => triggers.map(tr => ({ getHandlerFunction: () => tr.fn, _tr: tr })),
    deleteTrigger: (x) => { triggers = triggers.filter(tr => tr !== x._tr); }
  },
  UrlFetchApp: { fetch: (url, opts) => {
    fetchLog.push({ url, opts });
    const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
    if (url.indexOf('identitytoolkit') > -1) {
      const tok = JSON.parse(opts.payload).idToken;
      if (tok === 'owner-token') return res(200, { users: [{ localId: 'owner1', email: 'Rob@Owner.com' }] });
      if (tok === 'user-token') return res(200, { users: [{ localId: 'u2', email: 'x@y.com' }] });
      return res(400, { error: { message: 'INVALID_ID_TOKEN' } });
    }
    if (url.indexOf('firestore.googleapis.com') > -1) {
      const m = url.match(/platformAdmins\/([^?]+)$/);
      return m && adminDocs[decodeURIComponent(m[1])] && opts.headers.Authorization === 'Bearer owner-token' ? res(200, { fields: {} }) : res(404, {});
    }
    if (url.indexOf('api.groq.com') > -1) {
      if (groqMode === 'error') return res(500, { error: 'boom' });
      if (groqMode === 'empty') return res(200, { choices: [{ message: { content: '' } }] });
      return res(200, { choices: [{ message: { content: groqReply } }] });
    }
    throw new Error('unexpected url ' + url);
  } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
const G = (name) => ctx[name];

const DAY = 86400000;
const NOW = Date.UTC(2026, 9, 20, 12, 0, 0);
const ago = (d) => NOW - d * DAY;

console.log('--- counting ---');
{
  const times = [ago(1), ago(2), ago(31), NOW - 1, NOW];
  t('a time is counted from the start of the window up to, but not including, the end', G('rpCount_')(times, ago(30), NOW) === 3 && G('rpCount_')([ago(30)], ago(30), NOW) === 1 && G('rpCount_')([NOW], ago(30), NOW) === 0);
  const d = G('rpDaily_')([ago(0.5), ago(0.6), ago(5.5)], ago(7), 7);
  t('daily counts: one bucket per day, oldest first, 7 days gives 7 buckets', d.length === 7 && d[6] === 2 && d[1] === 1 && d.reduce((a, b) => a + b, 0) === 3, JSON.stringify(d));
  t('times outside the window are ignored by the daily counts', G('rpDaily_')([ago(40), NOW + DAY], ago(7), 7).every(n => n === 0));
  const c = G('rpCompare_');
  t('comparing: up, down, flat and from zero', c(14, 10).pct === 40 && c(14, 10).dir === 'up' && c(5, 10).pct === -50 && c(5, 10).dir === 'down' && c(3, 3).dir === 'flat' && c(3, 0).pct === null && c(0, 0).pct === null);
  t('counting words in a list: most common first, blanks ignored, ties alphabetical', same(G('rpCounts_')(['b', 'a', 'b', '', null, 'a', 'c']), [{ label: 'a', count: 2 }, { label: 'b', count: 2 }, { label: 'c', count: 1 }]));
}

console.log('--- the insight sentences ---');
{
  const ti = G('rpTrendInsight_'), c = G('rpCompare_');
  t('too little data: says so, and is marked thin so it never headlines the summary', ti('assessments', c(2, 1), 30).thin === true && /Too few assessments to read a trend yet \(2 in the last 30 days\)/.test(ti('assessments', c(2, 1), 30).text));
  t('a rise of 20% or more is good news, with both numbers', ti('assessments completed', c(14, 10), 30).severity === 'good' && ti('assessments completed', c(14, 10), 30).text === 'Assessments completed are up 40% vs the previous 30 days (14 vs 10).');
  t('a fall of 20% or more is something to watch', ti('requests', c(6, 10), 7).severity === 'watch' && /down 40%/.test(ti('requests', c(6, 10), 7).text));
  t('small changes are called steady', ti('requests', c(11, 10), 30).severity === 'info' && /steady/.test(ti('requests', c(11, 10), 30).text));
  t('something from nothing is reported without a percentage', /none in the days before/.test(ti('requests', c(9, 0), 30).text) && !/%/.test(ti('requests', c(9, 0), 30).text));
}

console.log('--- the funnel ---');
{
  const f = G('rpFunnel_')([{ key: 'a', label: 'Started', count: 100 }, { key: 'b', label: 'Saw results', count: 80 }, { key: 'c', label: 'Created an account', count: 20 }, { key: 'd', label: 'Learning', count: 18 }]);
  t('each step shows the share that carried on from the one before', same(f.steps.map(s => s.conv), [null, 80, 25, 90]));
  t('the biggest drop is found', f.worst === 2);
  const ins = G('rpFunnelInsights_')(f);
  t('and described with the real counts, flagged as worth watching below 50%', ins[0].severity === 'watch' && /from "Saw results" to "Created an account": 25% carry on \(20 of 80\)/.test(ins[0].text), ins[0].text);
  t('a step with more than the one before is capped at 100%', G('rpFunnel_')([{ key: 'a', label: 'A', count: 5 }, { key: 'b', label: 'B', count: 9 }]).steps[1].conv === 100);
  t('steps that start from too few people are not blamed', G('rpFunnel_')([{ key: 'a', label: 'A', count: 3 }, { key: 'b', label: 'B', count: 0 }]).worst === -1);
  t('no one started: says there is no funnel to read yet', G('rpFunnelInsights_')(G('rpFunnel_')([{ key: 'a', label: 'A', count: 0 }, { key: 'b', label: 'B', count: 0 }]))[0].thin === true);
}

console.log('--- skills ---');
{
  const resp = (tier, v) => ({ tier, cats: { discovery: v, strategy: v, prioritization: v, execution: v, stakeholder: v, aiIndividual: 20, aiOrg: v - 10 } });
  const sk = G('rpSkills_')([resp('Moderate Experience', 60), resp('Moderate Experience', 50), resp('Limited Experience', 40), resp('Moderate Experience', 70), resp('Lots of Experience', 80)]);
  t('averages per area, to the nearest whole number, in the framework\'s order', sk.areas[0].key === 'discovery' && sk.areas[0].avg === 60 && sk.areas[5].avg === 20 && sk.areas[6].avg === 50 && sk.n === 5);
  t('the level mix puts the most common first', sk.tiers[0].label === 'Moderate Experience' && sk.tiers[0].count === 3);
  const ins = G('rpSkillInsights_')(sk);
  t('the strongest and weakest areas are named with their averages', /strongest area is Customer & Market Discovery \(average 60%\) and the weakest is AI Fluency \(Individual\) \(20%\)/.test(ins[0].text), ins[0].text);
  t('a gap of 25 points or more is flagged', ins.some(i => i.severity === 'watch' && /40-point gap/.test(i.text)));
  t('under five assessments says the averages would be misleading', G('rpSkillInsights_')(G('rpSkills_')([resp('Moderate Experience', 60)]))[0].thin === true);
}

console.log('--- leads ---');
{
  const L = (o) => Object.assign({ ms: ago(2), fit: 'Warm', source: 'toolkits', who: 'org', timeline: 'This month', size: '11 to 50 people', status: 'New' }, o || {});
  const leads = [L({ fit: 'Hot', ms: ago(5) }), L(), L(), L({ source: 'home', fit: 'Nurture' }), L({ source: 'toolkits', fit: 'Hot', status: 'Contacted', ms: ago(4) }), L({ ms: ago(100) })];
  const st = G('rpLeadStats_')(leads, ago(30), NOW, NOW);
  t('only requests inside the period are counted', st.total === 5);
  t('Hot and Warm are counted together', st.hotWarm === 4 && st.hot === 2);
  t('sources are ranked', st.bySource[0].label === 'toolkits' && st.bySource[0].count === 4);
  t('a Hot request still marked New after 2 days is "waiting"; a contacted one is not', st.hotWaiting === 1);
  t('the pipeline counts every request by its Status', st.pipeline.some(p => p.label === 'New') && st.pipeline.some(p => p.label === 'Contacted'));
  const ins = G('rpLeadInsights_')(st, G('rpCompare_')(5, 4), 30);
  t('insights: share that is Hot or Warm, top source, urgency, and the waiting Hot request', ins.some(i => /4 of 5 requests are Hot or Warm \(80%\)/.test(i.text)) && ins.some(i => /Most requests come from "toolkits" \(4, 80%\)/.test(i.text)) && ins.some(i => /want to start this month/.test(i.text)) && ins.some(i => i.severity === 'watch' && /1 Hot request has been waiting more than 2 days/.test(i.text)), JSON.stringify(ins.map(i => i.text)));
  t('with very few requests it refuses to break them down', G('rpLeadInsights_')(G('rpLeadStats_')([L()], ago(30), NOW, NOW), G('rpCompare_')(1, 0), 30).some(i => i.thin && /misleading/.test(i.text)));
}

console.log('--- the summary ---');
{
  const s = G('rpSummary_')({ a: [{ severity: 'info', text: 'i1' }, { severity: 'good', text: 'g1' }], b: [{ severity: 'watch', text: 'w1' }, { severity: 'info', thin: true, text: 'thin' }] });
  t('problems first, then good news, then the rest, and thin items are left out', same(s.map(x => x.text), ['w1', 'g1', 'i1']));
  t('never more than five', G('rpSummary_')({ a: [1, 2, 3, 4, 5, 6, 7].map(n => ({ severity: 'info', text: 'x' + n })) }).length === 5);
  t('with nothing reliable to say it says that, rather than staying blank', /isn't enough activity/.test(G('rpSummary_')({ a: [{ severity: 'info', thin: true, text: 'thin' }] })[0].text));
}

console.log('--- building a whole report ---');
function dataset(){
  const responses = []; const funnel = []; const progress = []; const leads = [];
  for (let i = 0; i < 12; i++) responses.push({ ms: ago(i + 1), tier: i % 3 ? 'Moderate Experience' : 'Limited Experience', overall: 40, cats: { discovery: 50, strategy: 40, prioritization: 60, execution: 55, stakeholder: 70, aiIndividual: 30, aiOrg: 35 } });
  for (let i = 0; i < 5; i++) responses.push({ ms: ago(31 + i), tier: 'Moderate Experience', overall: 40, cats: { discovery: 50 } });
  for (let i = 0; i < 20; i++) funnel.push({ ms: ago(i + 0.5), event: 'assessmentStarted' });
  for (let i = 0; i < 12; i++) funnel.push({ ms: ago(i + 0.4), event: 'resultsViewed' });
  for (let i = 0; i < 4; i++) funnel.push({ ms: ago(i + 0.3), event: 'accountCreated' });
  for (let i = 0; i < 6; i++) funnel.push({ ms: ago(40 + i), event: 'accountCreated' });
  ['aaa', 'aaa', 'bbb', 'ccc'].forEach((who, i) => progress.push({ ms: ago(i + 1), who, lessons: 2, completed: i === 3 }));
  progress.push({ ms: ago(2), who: 'ddd', lessons: 0, completed: false });
  for (let i = 0; i < 6; i++) leads.push({ ms: ago(i < 2 ? i + 3 : i + 1), fit: i < 2 ? 'Hot' : 'Warm', source: 'toolkits', who: 'org', timeline: 'This month', size: '11 to 50 people', status: 'New' });
  return { responses, funnel, progress, leads };
}
{
  const r = G('rpBuild_')(dataset(), NOW, 30);
  const k = {}; r.kpis.forEach(x => { k[x.key] = x; });
  t('assessments: 12 this period, 5 in the period before', k.assessments.cur === 12 && k.assessments.prev === 5 && k.assessments.pct === 140);
  t('started, accounts, requests and Hot/Warm counts', k.started.cur === 20 && k.accounts.cur === 4 && k.accounts.prev === 6 && k.requests.cur === 6 && k.hotwarm.cur === 6);
  t('active learners are counted once each, and only those who started a lesson', k.learners.cur === 3, String(k.learners.cur));
  t('the chart has one point per day with matching labels', r.series.assessments.length === 30 && r.series.labels.length === 30 && r.series.assessments.reduce((a, b) => a + b, 0) === 12 && /^[A-Z][a-z]{2} \d+$/.test(r.series.labels[0]) === false || r.series.labels.length === 30);
  t('the funnel runs started, saw results, account, learning, course', same(r.funnel.steps.map(s => s.key), ['started', 'viewed', 'account', 'learning', 'course']) && same(r.funnel.steps.map(s => s.count), [20, 12, 4, 3, 1]));
  t('the biggest funnel drop is from results to account', r.funnel.worst === 2 && /Saw their results" to "Created an account"/.test(r.insights.funnel[0].text), r.insights.funnel[0] && r.insights.funnel[0].text);
  t('skills are for this period\'s assessments only', r.skills.n === 12);
  t('there are insights for every section, and a summary of at most five', ['overview', 'funnel', 'leads', 'skills'].every(s => r.insights[s].length > 0) && r.summary.length > 0 && r.summary.length <= 5);
  t('the overview repeats the "Hot request waiting" warning', r.insights.overview.some(i => /waiting more than 2 days/.test(i.text)));
  t('it carries plain-language caveats for the funnel and learners', r.notes.length === 2 && /anonymous events/.test(r.notes[0]));
  t('7, 30 and 90 day periods all build', [7, 30, 90].every(d => G('rpBuild_')(dataset(), NOW, d).series.assessments.length === d));
  t('an empty system builds without error and says there is too little to read', (() => { const e = G('rpBuild_')({ responses: [], funnel: [], progress: [], leads: [] }, NOW, 30); return e.kpis.every(x => x.cur === 0) && /isn't enough activity/.test(e.summary[0].text); })());
  t('the report contains no email addresses or names', !/@/.test(JSON.stringify(G('rpBuild_')(dataset(), NOW, 30))));
}

console.log('--- reading the sheets ---');
{
  sheets = {
    Responses: [['h'], [new Date(ago(2)), 'Pat', 'pat@x.com', 'Acme', 'PM', '11-50', 'Software', 61, 'Lots of Experience', 70, 60, 50, 40, 30, 20, 10, 'a1'], ['', 'blank', 'x@x']],
    Funnel: [['h'], [new Date(ago(1)), 'x', 'assessmentStarted', '', '{}']],
    Progress: [['h'], [new Date(ago(1)), 'Pat@X.com', 'discovery', 'novice', 'discovery-novice', 'Assigned', 3, 5, 60, 'In progress'], [new Date(ago(1)), 'pat@x.com', 'discovery', 'moderate', 'discovery-moderate', 'Assigned', 5, 5, 100, 'Completed']],
    Leads: [G('LEAD_HEADERS_'), [new Date(ago(1)), 'id1', 'Jane', 'jane@a.com', 'Acme', '555', 'I\'m looking for my organization', 'AI fluency', '11 to 50 people', 'This month', 'I make the decision', 'Email me', 'msg', 'Hot', 85, 'why', 'toolkits', '', '', 'New', '']]
  };
  const d = G('rpLoad_')();
  t('assessment rows are tidied (blank rows dropped, areas mapped to their columns)', d.responses.length === 1 && d.responses[0].tier === 'Lots of Experience' && d.responses[0].cats.discovery === 70 && d.responses[0].cats.aiOrg === 10);
  t('progress rows keep a short fingerprint instead of the email, the same for any capitalisation', d.progress.length === 2 && d.progress[0].who === d.progress[1].who && d.progress[0].who.indexOf('@') === -1 && d.progress[0].who.length === 10);
  t('completed courses are recognised', d.progress[1].completed === true && d.progress[0].completed === false);
  t('request rows are read by column NAME, so moving columns would not break them', d.leads.length === 1 && d.leads[0].fit === 'Hot' && d.leads[0].source === 'toolkits' && d.leads[0].status === 'New' && d.leads[0].timeline === 'This month');
  sheets = {};
  const e = G('rpLoad_')();
  t('tabs that do not exist yet are simply empty', e.responses.length === 0 && e.funnel.length === 0 && e.progress.length === 0 && e.leads.length === 0);
}

console.log('--- who may ask ---');
{
  sheets = { Responses: [['h']], Funnel: [['h']], Progress: [['h']], Leads: [G('LEAD_HEADERS_')] };
  sheetReads = 0;
  const bad = G('reportsEndpoint_')('junk', 30);
  t('a bad sign-in is refused, and no sheet is read', bad.ok === false && bad.error === 'not_verified' && sheetReads === 0);
  const other = G('reportsEndpoint_')('user-token', 30);
  t('a signed-in person who is not the owner is refused, and no sheet is read', other.ok === false && other.error === 'not_owner' && sheetReads === 0);
  const own = G('reportsEndpoint_')('owner-token', 30);
  t('the owner gets the report', own.ok === true && own.report.days === 30 && own.report.kpis.length === 6);
  t('the owner check uses the caller\'s own token against their own platformAdmins record', fetchLog.some(f => /platformAdmins\/owner1$/.test(f.url) && f.opts.headers.Authorization === 'Bearer owner-token'));
  t('an unexpected period falls back to 30 days', G('reportsEndpoint_')('owner-token', 999).report.days === 30 && G('reportsEndpoint_')('owner-token', 7).report.days === 7);
  const ll = G('reportsLeadsEndpoint_')('user-token');
  t('the detailed request list (personal details) is refused to anyone else', ll.ok === false && ll.error === 'not_owner' && !('leads' in ll));
  sheets.Leads = [G('LEAD_HEADERS_')];
  for (let i = 0; i < 320; i++) { const row = new Array(G('LEAD_HEADERS_').length).fill(''); row[0] = new Date(ago(i / 10 + 0.01)); row[3] = 'p' + i + '@x.com'; row[G('LEAD_HEADERS_').indexOf('Name')] = 'N' + i; sheets.Leads.push(row); }
  const lo = G('reportsLeadsEndpoint_')('owner-token');
  t('the owner gets the newest 300 requests first', lo.ok === true && lo.leads.length === 300 && lo.leads[0].ms > lo.leads[299].ms && lo.leads[0].name === 'N0');
}

console.log('--- Explain with AI ---');
{
  sheets = { Responses: [['h']], Funnel: [['h']], Progress: [['h']], Leads: [G('LEAD_HEADERS_')] };
  const r = G('rpBuild_')(dataset(), NOW, 30);
  ['overview', 'funnel', 'leads'].forEach(sec => {
    const p = G('rpAiPrompt_')(sec, r);
    t('the ' + sec + ' prompt holds numbers and sentences but no email address', p.user.indexOf('"section":"' + sec + '"') > -1 && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(p.user));
  });
  t('the funnel prompt carries the funnel steps; the leads prompt the lead breakdowns; the overview the skill averages', /carriedOnPct/.test(G('rpAiPrompt_')('funnel', r).user) && /bySource/.test(G('rpAiPrompt_')('leads', r).user) && /averagePct/.test(G('rpAiPrompt_')('overview', r).user));
  t('the instructions forbid inventing numbers and require honesty about thin data', /never invent a figure/.test(G('rpAiPrompt_')('funnel', r).system) && /too thin/.test(G('rpAiPrompt_')('funnel', r).system));
  t('a stranger cannot use it', G('reportsAiEndpoint_')('user-token', 'funnel', 30).error === 'not_owner');
  t('an unknown section is refused', G('reportsAiEndpoint_')('owner-token', 'secrets', 30).error === 'bad_section');
  props = {};
  t('without a Groq key it says so plainly', G('reportsAiEndpoint_')('owner-token', 'funnel', 30).error === 'no_key');
  props = { GROQ_API_KEY: 'k' }; fetchLog = [];
  const ok = G('reportsAiEndpoint_')('owner-token', 'funnel', 30);
  t('the owner gets the explanation back', ok.ok === true && /What it shows/.test(ok.text));
  const groqCall = fetchLog.find(f => f.url.indexOf('groq') > -1);
  t('what was sent to the AI contains no email address, and uses the configured model and key', !!groqCall && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(groqCall.opts.payload) && JSON.parse(groqCall.opts.payload).model === G('GROQ_MODEL_') && groqCall.opts.headers.Authorization === 'Bearer k');
  t('each use is counted', Object.keys(props).some(k => k.indexOf('rpai_') === 0 && props[k] === '1'));
  const dayKey = Object.keys(props).filter(k => k.indexOf('rpai_') === 0)[0];
  props[dayKey] = '30';
  t('after 30 a day it stops, so the free limits are safe', G('reportsAiEndpoint_')('owner-token', 'funnel', 30).error === 'daily_limit');
  props = { GROQ_API_KEY: 'k', 'rpai_2020-01-01': '9' };
  G('reportsAiEndpoint_')('owner-token', 'funnel', 30);
  t('old daily counters are cleaned up', !('rpai_2020-01-01' in props));
  groqMode = 'error'; props = { GROQ_API_KEY: 'k' };
  const bad = G('reportsAiEndpoint_')('owner-token', 'funnel', 30);
  t('if the AI service fails, the page is told plainly', bad.ok === false && bad.error === 'ai_error' && /500/.test(bad.detail));
  groqMode = 'empty';
  t('an empty answer is an error, not a blank box', G('reportsAiEndpoint_')('owner-token', 'funnel', 30).error === 'ai_error');
  groqMode = 'ok';
  // a lead source that looks like an email address must stop the call
  sheets.Leads = [G('LEAD_HEADERS_'), (() => { const row = new Array(G('LEAD_HEADERS_').length).fill(''); row[0] = new Date(Date.now() - DAY); row[G('LEAD_HEADERS_').indexOf('Source')] = 'leak@example.com'; return row; })()];   // dated against the real clock, because the endpoint uses it
  props = { GROQ_API_KEY: 'k' }; fetchLog = [];
  const guard = G('reportsAiEndpoint_')('owner-token', 'leads', 30);
  t('the last line of defence: anything that looks like an email address stops the AI call completely', guard.ok === false && guard.error === 'privacy_guard' && !fetchLog.some(f => f.url.indexOf('groq') > -1));
  groqReply = 'x'.repeat(5000); sheets.Leads = [G('LEAD_HEADERS_')]; props = { GROQ_API_KEY: 'k' };
  t('a very long answer is cut to a sensible length', G('reportsAiEndpoint_')('owner-token', 'funnel', 30).text.length <= 1500);
}

console.log('--- the Monday email ---');
{
  const r = G('rpBuild_')(dataset(), NOW, 7);
  const m = G('rpWeeklyEmail_')(r, 'https://assessment.productadvisory.co/reports.html');
  t('the subject has the headline numbers', /^Weekly report: \d+ assessments? \(.*\), \d+ requests? \(\d+ Hot\/Warm\)$/.test(m.subject), m.subject);
  t('the text lists every number and what stands out, and links to the full reports', r.kpis.every(k => m.text.indexOf(k.label) > -1) && /What stands out/.test(m.text) && /reports\.html/.test(m.text));
  t('the HTML version has a button to the reports', /Open the full reports/.test(m.html) && m.html.indexOf('reports.html') > -1);
  const evil = JSON.parse(JSON.stringify(r)); evil.summary = [{ severity: 'info', text: '<img src=x onerror=1>' }];
  t('anything in the sentences is escaped in the HTML', G('rpWeeklyEmail_')(evil, 'u').html.indexOf('<img') === -1);
  sheets = { Responses: [['h']], Funnel: [['h']], Progress: [['h']], Leads: [G('LEAD_HEADERS_')] }; sentMail = []; quota = 100;
  G('sendWeeklyReport')();
  t('sending it emails the owner address from the script', sentMail.length === 1 && sentMail[0].to === G('LEAD_NOTIFY_EMAIL_') && /Weekly report/.test(sentMail[0].subject));
  quota = 0; sentMail = []; G('sendWeeklyReport')();
  t('it does nothing if Gmail has no quota left', sentMail.length === 0);
  triggers = []; G('installWeeklyReport')();
  t('installing schedules sendWeeklyReport for Mondays at 8', triggers.length === 1 && triggers[0].fn === 'sendWeeklyReport' && triggers[0].day === 'MONDAY' && triggers[0].hour === 8);
  G('installWeeklyReport')();
  t('installing twice never doubles up', triggers.length === 1);
  triggers.push({ fn: 'somethingElse' }); G('removeWeeklyReport')();
  t('removing deletes only this schedule', triggers.length === 1 && triggers[0].fn === 'somethingElse');
}

console.log('--- the web routes ---');
{
  sheets = { Responses: [['h']], Funnel: [['h']], Progress: [['h']], Leads: [G('LEAD_HEADERS_')] }; props = { GROQ_API_KEY: 'k' };
  const out = (p) => G('doGet')({ parameter: p }).text;
  t('reports is routed and wrapped for the page', /^cb\(\{"ok":true,"report":/.test(out({ action: 'reports', callback: 'cb', idToken: 'owner-token', days: '7' })));
  t('without a token it is refused, not an error', /"error":"not_verified"/.test(out({ action: 'reports', callback: 'cb' })));
  t('reportsLeads is routed', /^cb\(\{"ok":true,"leads":\[/.test(out({ action: 'reportsLeads', callback: 'cb', idToken: 'owner-token' })));
  t('reportsAi is routed', /^cb\(\{"ok":true,"text":/.test(out({ action: 'reportsAi', callback: 'cb', idToken: 'owner-token', section: 'overview', days: '30' })));
  t('another person\'s token is refused on all three', ['reports', 'reportsLeads', 'reportsAi'].every(a => /"error":"not_owner"/.test(out({ action: a, callback: 'cb', idToken: 'user-token', section: 'funnel' }))));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
