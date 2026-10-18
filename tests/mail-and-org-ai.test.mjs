// Tests for sections 9-11 of apps-script/Code.gs: which address each email comes from, the welcome email,
// and the company admin's "Explain with AI".
// Run:  node --experimental-default-type=module tests/mail-and-org-ai.test.mjs
// The script is loaded into a sandbox with stand-ins for Google's services, so nothing real is touched.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../company-core.js';
import '../company-report.js';

const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

/* ------------------------------------------------ stand-ins for Google */
let sheets, props, sentMail, gmailSent, quota, fetchLog, groqMode, gmailMode, aliases, accounts, memberships, owners, mailThrows;
function reset(){
  sheets = {}; props = {}; sentMail = []; gmailSent = []; quota = 100; fetchLog = []; groqMode = 'ok'; gmailMode = 'ok'; aliases = []; mailThrows = false;
  owners = { owner1: true };
  memberships = { adminA: { orgId: 'orgA', role: 'admin', status: 'active' }, memberA: { orgId: 'orgA', role: 'member', status: 'active' },
    exAdmin: { orgId: 'orgA', role: 'admin', status: 'removed' }, adminB: { orgId: 'orgB', role: 'admin', status: 'active' } };
  const created = Date.now() - 3600000;
  accounts = {
    'new-token': { localId: 'uNew', email: 'New.Person@Example.com', displayName: 'Nora Newcomer', createdAt: String(created) },
    'noname-token': { localId: 'uNoName', email: 'plain@example.com', createdAt: String(created) },
    'html-token': { localId: 'uHtml', email: 'html@example.com', displayName: '<b>Bob</b> & Co', createdAt: String(created) },
    'old-token': { localId: 'uOld', email: 'old@example.com', displayName: 'Old', createdAt: String(Date.now() - 10 * 86400000) },
    'adminA-token': { localId: 'adminA', email: 'a@acme.com' }, 'memberA-token': { localId: 'memberA', email: 'm@acme.com' },
    'exAdmin-token': { localId: 'exAdmin', email: 'e@acme.com' }, 'adminB-token': { localId: 'adminB', email: 'b@beta.com' },
    'owner-token': { localId: 'owner1', email: 'rob@owner.com' }, 'stranger-token': { localId: 'stranger', email: 's@x.com' }
  };
}
reset();

const mkSheet = (name) => {
  const rows = sheets[name];
  return {
    appendRow: (r) => { rows.push(r); }, getLastRow: () => rows.length, setFrozenRows(){},
    getDataRange: () => ({ getValues: () => rows }),
    getRange: (row, col, n) => ({ getValues: () => rows.slice(row - 1, row - 1 + n).map(r => [r[col - 1]]) }),
    deleteRow: (i) => { rows.splice(i - 1, 1); }
  };
};
const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, RegExp, Set, Error,
  Logger: { log(){} },
  Session: { getScriptTimeZone: () => 'UTC', getEffectiveUser: () => ({ getEmail: () => 'owner@gmail.com' }) },
  Utilities: { formatDate: (d, tz, f) => new Date(d).toISOString().slice(0, 10) },
  ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); },
    deleteProperty: (k) => { delete props[k]; }, getKeys: () => Object.keys(props) }) },
  CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {}, waitLock() {} }) },
  MailApp: { getRemainingDailyQuota: () => quota, sendEmail: (m) => { if (mailThrows) throw new Error('mail down'); sentMail.push(m); } },
  GmailApp: { getAliases: () => { if (gmailMode === 'nopermission') throw new Error('no permission'); return aliases; },
    sendEmail: (to, subject, body, opts) => { if (gmailMode === 'sendfails') throw new Error('alias refused'); gmailSent.push({ to, subject, body, opts }); } },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({
    getSheetByName: (n) => (sheets[n] ? mkSheet(n) : null),
    insertSheet: (n) => { sheets[n] = []; return mkSheet(n); } }) },
  UrlFetchApp: { fetch: (url, opts) => {
    fetchLog.push({ url, opts });
    const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
    if (url.indexOf('identitytoolkit') > -1) {
      const tok = JSON.parse(opts.payload).idToken;
      return accounts[tok] ? res(200, { users: [accounts[tok]] }) : res(400, { error: { message: 'INVALID_ID_TOKEN' } });
    }
    if (url.indexOf('firestore.googleapis.com') > -1) {
      const tok = opts.headers.Authorization.replace('Bearer ', '');
      const uid = accounts[tok] && accounts[tok].localId;
      let m = url.match(/platformAdmins\/([^?]+)$/);
      if (m) return owners[decodeURIComponent(m[1])] && decodeURIComponent(m[1]) === uid ? res(200, { fields: {} }) : res(404, {});
      m = url.match(/memberships\/([^?]+)$/);
      if (m) {
        const d = memberships[decodeURIComponent(m[1])];
        return d && decodeURIComponent(m[1]) === uid ? res(200, { fields: { orgId: { stringValue: d.orgId }, role: { stringValue: d.role }, status: { stringValue: d.status } } }) : res(404, {});
      }
    }
    if (url.indexOf('api.groq.com') > -1) {
      if (groqMode === 'error') return res(500, { error: 'boom' });
      if (groqMode === 'empty') return res(200, { choices: [{ message: { content: '' } }] });
      return res(200, { choices: [{ message: { content: 'What it shows: A first look.\nWhat to watch:\n- Quiet people\nNext steps:\n- Send a reminder' } }] });
    }
    throw new Error('unexpected url ' + url);
  } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
const G = (name) => ctx[name];
const run = (code) => vm.runInContext(code, ctx);

console.log('--- which address each email comes from ---');
{
  const addrs = run('MAIL_ADDR_');
  t('all eight addresses are on the one list', Object.keys(addrs).sort().join() === 'assessment,feedback,info,legal,marketing,noreply,sales,toolkit' && Object.values(addrs).every(a => /@productadvisory\.co$/.test(a)));
  const msg = () => ({ to: 'x@y.com', subject: 'Hi', body: 'text', htmlBody: '<p>html</p>', name: 'Product Advisory', replyTo: 'r@y.com' });
  reset();
  t('with no alias set up, it sends the normal way and says so', G('sendMail_')(msg(), 'noreply') === 'default' && sentMail.length === 1 && gmailSent.length === 0 && sentMail[0].replyTo === 'r@y.com');
  reset(); aliases = ['noreply@productadvisory.co', 'Sales@ProductAdvisory.co'];
  t('with the alias set up, it really comes from that address (any capitals)', G('sendMail_')(msg(), 'sales') === 'alias' && gmailSent.length === 1 && gmailSent[0].opts.from === 'sales@productadvisory.co' && gmailSent[0].opts.replyTo === 'r@y.com' && gmailSent[0].opts.htmlBody === '<p>html</p>' && gmailSent[0].opts.name === 'Product Advisory' && sentMail.length === 0);
  reset(); aliases = ['noreply@productadvisory.co'];
  t('an address that is not set up falls back, while the others still work', G('sendMail_')(msg(), 'sales') === 'default' && sentMail.length === 1 && G('sendMail_')(msg(), 'noreply') === 'alias');
  reset(); aliases = ['noreply@productadvisory.co']; gmailMode = 'sendfails';
  t('if Gmail refuses the alias at the moment of sending, the email still goes out the normal way', G('sendMail_')(msg(), 'noreply') === 'default' && sentMail.length === 1);
  reset(); gmailMode = 'nopermission';
  t('before Gmail permission is granted, nothing breaks', G('sendMail_')(msg(), 'noreply') === 'default' && sentMail.length === 1);
  reset();
  t('an unknown key just sends the normal way', G('sendMail_')(msg(), 'nobody') === 'default' && sentMail.length === 1);
  reset(); mailThrows = true;
  let threw = false; try { G('sendMail_')(msg(), 'noreply'); } catch (e) { threw = true; }
  t('if Gmail itself is down the error reaches the caller (so a retry is possible)', threw);
  reset();
  t('the thank-you for a request comes from sales and replies go to sales', run('LEAD_REPLY_TO_') === 'sales@productadvisory.co' && run("MAIL_ADDR_.sales") === 'sales@productadvisory.co');
}

console.log('--- the welcome email ---');
{
  reset();
  const welcome = G('welcomeEndpoint_');
  t('a token Google does not accept is refused', JSON.stringify(welcome('nope')) === JSON.stringify({ ok: false, error: 'not_verified' }) && sentMail.length === 0);
  t('no token at all is refused', welcome('').error === 'not_verified');
  const old = welcome('old-token');
  t('an account older than three days gets nothing, and nothing is recorded', old.ok === true && old.skipped === 'not_new' && sentMail.length === 0 && !sheets.Welcomes);

  const r = welcome('new-token');
  t('a new account gets one email', r.ok === true && r.sent === true && sentMail.length === 1);
  const m = sentMail[0];
  t('it goes only to that account\'s own address, lower-cased', m.to === 'new.person@example.com');
  t('replies go to assessment@, and it is sent as Product Advisory Learning', m.replyTo === 'assessment@productadvisory.co' && m.name === 'Product Advisory Learning');
  t('the greeting uses the first name', /^Hi Nora,/.test(m.body) && /Hi Nora,/.test(m.htmlBody));
  t('it has the subject Welcome to Product Advisory Learning', m.subject === 'Welcome to Product Advisory Learning');
  t('it links to the dashboard and the free assessment', m.body.indexOf('https://assessment.productadvisory.co/lms-dashboard.html') > -1 && m.body.indexOf('https://assessment.productadvisory.co/index.html') > -1 && /href="https:\/\/assessment\.productadvisory\.co\/lms-dashboard\.html"/.test(m.htmlBody));
  t('it names the right mailboxes: assessment, feedback and legal', /assessment@productadvisory\.co/.test(m.body) && /feedback@productadvisory\.co/.test(m.body) && /legal@productadvisory\.co/.test(m.body));
  t('it explains how to get a password reset without promising a sender address', /Forgot password/.test(m.body) && !/noreply/.test(m.body));
  t('it recorded the account on the Welcomes tab (date, id, email)', sheets.Welcomes.length === 2 && sheets.Welcomes[0].join() === 'Sent,User ID,Email' && sheets.Welcomes[1][1] === 'uNew' && sheets.Welcomes[1][2] === 'new.person@example.com');
  const again = welcome('new-token');
  t('asking again sends nothing more', again.ok === true && again.skipped === 'already' && sentMail.length === 1);

  const nn = welcome('noname-token');
  t('with no name it says "Hi there,"', nn.sent === true && /^Hi there,/.test(sentMail[1].body));
  const h = welcome('html-token');
  t('a name with markup in it is escaped in the HTML version', h.sent === true && /Hi &lt;b&gt;Bob&lt;\/b&gt;/.test(sentMail[2].htmlBody) && !/<b>Bob/.test(sentMail[2].htmlBody));

  reset();
  props['welcomeday_' + new Date().toISOString().slice(0, 10)] = '40';
  t('after 40 welcomes in a day it stops and records nothing (so they are sent tomorrow when the page asks again)', welcome('new-token').error === 'daily_limit' && sentMail.length === 0 && !sheets.Welcomes.slice(1).length);
  reset(); quota = 9;
  t('when Gmail has fewer than 10 emails left it holds back, keeping them for invitations and requests', welcome('new-token').error === 'quota' && sentMail.length === 0);
  reset(); mailThrows = true;
  const bad = welcome('new-token');
  t('if Gmail fails, the error is reported and the account is NOT recorded, so it is retried later', bad.ok === false && bad.error === 'mail_error' && (!sheets.Welcomes || sheets.Welcomes.length <= 1));
  mailThrows = false;
  t('and the retry then succeeds', welcome('new-token').sent === true && sentMail.length === 1);

  reset(); aliases = ['noreply@productadvisory.co'];
  welcome('new-token');
  t('with noreply@ set up in Gmail the welcome really comes from it', gmailSent.length === 1 && gmailSent[0].opts.from === 'noreply@productadvisory.co' && gmailSent[0].opts.replyTo === 'assessment@productadvisory.co');

  reset();
  const sendOnly = G('doGet')({ parameter: { action: 'welcome', idToken: 'new-token', callback: 'cb' } });
  t('the web address "?action=welcome" is wired up and answers in JSONP', /^cb\(\{"ok":true,"sent":true\}\);?$/.test(sendOnly.text) && sentMail.length === 1, sendOnly.text);

  reset();
  welcome('new-token');
  const del = G('deleteAccountData_')('new-token');
  t('deleting an account removes its row from the Welcomes tab', del.ok === true && del.removed.welcomes === 1 && sheets.Welcomes.length === 1, JSON.stringify(del));
}

console.log('--- company report: who may ask, and what is sent ---');
const C = globalThis.CompanyCore, R = globalThis.CompanyReport;
const goodFacts = () => ({ people: 6, assessed: 5, learning: 2, finished: 1, quiet: 1, pendingInvites: 2, avgOverallPct: 48, avgPlanPct: 12,
  funnel: [{ step: 'Invited or joined', count: 8 }, { step: 'Joined', count: 6 }, { step: 'Took the assessment', count: 5 }, { step: 'Started learning', count: 3 }, { step: 'Finished their plan', count: 1 }],
  areas: [{ area: 'Customer & Market Discovery', teamAvgPct: 50, allAvgPct: 40 }, { area: 'AI Fluency — Organizational', teamAvgPct: 20, allAvgPct: null }],
  focusAreas: ['AI Fluency — Organizational'], trend: { weeks: 4, avgPlanFromPct: 2, avgPlanToPct: 12, startedFrom: 0, startedTo: 3 } });
{
  reset(); props.GROQ_API_KEY = 'k';
  const ai = G('orgReportAiEndpoint_');
  const call = (tok, org, facts) => ai(tok, org, typeof facts === 'string' ? facts : JSON.stringify(facts));
  t('the wording the page uses for areas and funnel steps matches the page\'s own lists', run('ORG_AREA_LABELS_').join('|') === C.DOMAINS.map(d => d[1]).join('|') && R.funnel([], [], Date.now()).steps.map(s => s.label).join('|') === run('ORG_FUNNEL_STEPS_').join('|'));

  t('a token Google does not accept is refused', call('nope', 'orgA', goodFacts()).error === 'not_verified');
  t('an active admin of the company is allowed', call('adminA-token', 'orgA', goodFacts()).ok === true);
  t('the owner is allowed for any company', call('owner-token', 'orgA', goodFacts()).ok === true && call('owner-token', 'orgZ', goodFacts()).ok === true);
  t('an admin of another company is refused', call('adminB-token', 'orgA', goodFacts()).error === 'not_admin');
  t('a plain member is refused', call('memberA-token', 'orgA', goodFacts()).error === 'not_admin');
  t('an admin whose membership ended is refused', call('exAdmin-token', 'orgA', goodFacts()).error === 'not_admin');
  t('a stranger is refused', call('stranger-token', 'orgA', goodFacts()).error === 'not_admin');
  t('a company id that is not an id is refused before anything is read', (() => { fetchLog = []; const x = call('adminA-token', '../../x', goodFacts()); return x.error === 'not_admin' && !fetchLog.some(f => /firestore/.test(f.url)); })());
  const groqCalls = () => fetchLog.filter(f => /groq/.test(f.url));
  t('refused callers never reach the AI', (() => { reset(); props.GROQ_API_KEY = 'k'; call('adminB-token', 'orgA', goodFacts()); call('memberA-token', 'orgA', goodFacts()); return groqCalls().length === 0; })());

  reset(); props.GROQ_API_KEY = 'k';
  const ok = call('adminA-token', 'orgA', goodFacts());
  const sent = JSON.parse(JSON.parse(groqCalls()[0].opts.payload).messages[1].content.replace('Here are the numbers:\n', ''));
  t('the answer is returned', ok.ok === true && /What it shows/.test(ok.text));
  t('exactly the cleaned numbers reach the AI', JSON.stringify(sent) === JSON.stringify(goodFacts()), JSON.stringify(sent).slice(0, 120));
  t('the instructions tell it to use only the numbers, and to say when a team is small', /Use ONLY the numbers/.test(JSON.parse(groqCalls()[0].opts.payload).messages[0].content) && /first look/.test(JSON.parse(groqCalls()[0].opts.payload).messages[0].content));

  // what the real page would send
  const rows = C.buildTeamRows([{ id: 'u1', role: 'member', status: 'active', displayName: 'Ann A', email: 'ann@acme.com', joinedAtMs: Date.now() - 9e8 }],
    { u1: { identity: { name: 'Ann A', email: 'ann@acme.com' }, assessment: { tier: 'Moderate Experience', overallPct: 40, categoryPct: { discovery: 40, strategy: 40, prioritization: 40, execution: 40, stakeholder: 40, aiIndividual: 40, aiOrg: 40 }, answers: [] }, courses: {}, lastActiveAt: new Date().toISOString() } }, Date.now());
  const real = R.build({ rows, invites: [], snapshots: [], platform: { totalCompletions: 30, categoryAverages: { discovery: 50, strategy: 50, prioritization: 50, execution: 50, stakeholder: 50, aiIndividual: 50, aiOrg: 50 } }, focusAreas: ['aiOrg', 'strategy', 'discovery'], nowMs: Date.now() });
  reset(); props.GROQ_API_KEY = 'k';
  t('what the page really sends passes the check (the two stay in step)', call('adminA-token', 'orgA', real.aiFacts).ok === true, JSON.stringify(call('adminA-token', 'orgA', real.aiFacts)));
  const withTrend = Object.assign({}, real.aiFacts, { trend: { weeks: 3, avgPlanFromPct: null, avgPlanToPct: 5, startedFrom: 1, startedTo: 2 } });
  t('a trend with an unknown starting score is fine', call('adminA-token', 'orgA', withTrend).ok === true);

  const leaks = [
    ['an extra field with a name in it is dropped, not forwarded', Object.assign(goodFacts(), { companyName: 'Acme Health', contact: 'ann@acme.com' }), true],
    ['an area name that is not one of the seven is refused', Object.assign(goodFacts(), { areas: [{ area: 'Ann Admin', teamAvgPct: 50, allAvgPct: 40 }] }), false],
    ['an email address hidden in an area name is refused', Object.assign(goodFacts(), { areas: [{ area: 'ann@acme.com', teamAvgPct: 50, allAvgPct: 40 }] }), false],
    ['a funnel step that is not one of the five is refused', Object.assign(goodFacts(), { funnel: [{ step: 'Ann joined', count: 1 }] }), false],
    ['a focus area that is not one of the seven is refused', Object.assign(goodFacts(), { focusAreas: ['Acme Health'] }), false],
    ['text where a number belongs is refused', Object.assign(goodFacts(), { people: 'six' }), false],
    ['a fraction is refused', Object.assign(goodFacts(), { people: 6.5 }), false],
    ['a negative number is refused', Object.assign(goodFacts(), { quiet: -1 }), false],
    ['a percentage over 100 is refused', Object.assign(goodFacts(), { avgPlanPct: 120 }), false],
    ['more than seven areas is refused', Object.assign(goodFacts(), { areas: Array(8).fill({ area: 'Execution & Delivery', teamAvgPct: 1, allAvgPct: 1 }) }), false],
    ['more than five funnel steps is refused', Object.assign(goodFacts(), { funnel: Array(6).fill({ step: 'Joined', count: 1 }) }), false],
    ['more than three focus areas is refused', Object.assign(goodFacts(), { focusAreas: ['Execution & Delivery', 'Execution & Delivery', 'Execution & Delivery', 'Execution & Delivery'] }), false]
  ];
  leaks.forEach(([label, facts, allowed]) => {
    reset(); props.GROQ_API_KEY = 'k';
    const res = call('adminA-token', 'orgA', facts);
    const body = groqCalls().length ? JSON.parse(groqCalls()[0].opts.payload).messages[1].content : '';
    t(label, allowed ? (res.ok === true && !/Acme|ann@/.test(body)) : (res.error === 'bad_facts' && groqCalls().length === 0), JSON.stringify(res));
  });
  reset(); props.GROQ_API_KEY = 'k';
  t('something that is not JSON is refused', call('adminA-token', 'orgA', 'not json').error === 'bad_facts' && call('adminA-token', 'orgA', '').error === 'bad_facts');
  t('a required number left out is refused', (() => { const f = goodFacts(); delete f.people; return call('adminA-token', 'orgA', f).error === 'bad_facts'; })());

  reset();
  t('with no Groq key set it says so, and nothing is spent', call('adminA-token', 'orgA', goodFacts()).error === 'no_key' && groqCalls().length === 0);
  reset(); props.GROQ_API_KEY = 'k';
  const day = new Date().toISOString().slice(0, 10);
  let n = 0; for (let i = 0; i < 6; i++) if (call('adminA-token', 'orgA', goodFacts()).ok === true) n++;
  t('one company gets 5 explanations a day, then "daily limit"', n === 5 && call('adminA-token', 'orgA', goodFacts()).error === 'daily_limit' && groqCalls().length === 5, String(n));
  t('another company is not affected', call('adminB-token', 'orgB', goodFacts()).ok === true);
  reset(); props.GROQ_API_KEY = 'k'; props['orgai_' + day] = '40';
  t('all companies together get 40 a day', call('adminA-token', 'orgA', goodFacts()).error === 'daily_limit');
  reset(); props.GROQ_API_KEY = 'k'; props.orgai_2020_01_01 = '3'; props['orgai_2020-01-01'] = '3';
  call('adminA-token', 'orgA', goodFacts());
  t('old daily counters are cleared out', Object.keys(props).filter(k => /^orgai_/.test(k)).every(k => k.indexOf('orgai_' + day) === 0));
  reset(); props.GROQ_API_KEY = 'k'; groqMode = 'error';
  t('if the AI service fails it says so, with the status', (() => { const x = call('adminA-token', 'orgA', goodFacts()); return x.error === 'ai_error' && /500/.test(x.detail); })());
  reset(); props.GROQ_API_KEY = 'k'; groqMode = 'empty';
  t('an empty answer is an error, not a blank box', call('adminA-token', 'orgA', goodFacts()).error === 'ai_error');
  reset(); props.GROQ_API_KEY = 'k';
  const routed = G('doGet')({ parameter: { action: 'orgReportAi', idToken: 'adminA-token', org: 'orgA', facts: JSON.stringify(goodFacts()), callback: 'cb' } });
  t('the web address "?action=orgReportAi" is wired up and answers in JSONP', /^cb\(\{"ok":true,"text":/.test(routed.text), routed.text.slice(0, 60));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
