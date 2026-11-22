// Tests for Compass's server side (section 14b of apps-script/Code.gs).   Run:  node --experimental-default-type=module tests/compass-server.test.mjs
// The script is loaded into a sandbox with stand-ins for Google's services, so nothing real is touched.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

let props, asked, reply, logged, replies;
function reset() { props = { GROQ_API_KEY: 'k' }; asked = []; reply = { code: 200, text: 'A pricing page is read in seconds [1]. Test it with strangers [2].' }; logged = []; replies = null; }
reset();
const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, RegExp, Set, Error,
  Logger: { log() {} },
  Session: { getScriptTimeZone: () => 'UTC', getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) },
  Utilities: { formatDate: (d) => new Date(d).toISOString().slice(0, 10), sleep() {} },
  ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); },
    deleteProperty: (k) => { delete props[k]; }, getKeys: () => Object.keys(props) }) },
  CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => ({ appendRow: (r) => logged.push(r) }), insertSheet: () => ({ appendRow() {}, setFrozenRows() {} }) }) },
  UrlFetchApp: { fetch: (url, opts) => {
    if (/accounts:lookup/.test(url)) { const tok = JSON.parse(opts.payload).idToken; return tok === 'good' ? res(200, { users: [{ localId: 'u1', email: 'a@b.com' }] }) : res(400, {}); }
    if (/api\.groq\.com/.test(url)) {
      asked.push(JSON.parse(opts.payload));
      const r = replies ? replies.shift() : reply;
      return r.raw ? { getResponseCode: () => r.code, getContentText: () => r.raw } : res(r.code, { choices: [{ message: { content: r.text }, finish_reason: r.finish || 'stop' }] });
    }
    throw new Error('unexpected url ' + url);
  } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
// the token check talks to Google; here it is the stand-in above
ctx.verifyFirebaseIdToken_ = (tok) => (tok === 'good' ? { uid: 'u1', email: 'a@b.com' } : null);
ctx.leadSafeCell_ = ctx.leadSafeCell_ || ((v) => v);

const page = JSON.stringify({ k: 'lesson', t: 'Pricing: Lesson 2. The five-second test', x: 'Customers glance at a pricing page for five seconds.' });
const ctxP = JSON.stringify([{ u: 'lesson.html?course=strategy-moderate&lesson=3', t: 'Strategy: Lesson 3', x: 'Show the page to a stranger for five seconds.' }]);
const hist = JSON.stringify([{ r: 'u', t: 'What is this lesson about?' }, { r: 'a', t: 'Reading pricing pages quickly [1].' }, { r: 'x', t: 'ignored' }]);
const E = (o) => ctx.compassEndpoint_(o.tok || 'good', o.q === undefined ? 'How do I test my pricing page?' : o.q, o.h || hist, o.page === undefined ? page : o.page, o.ctx === undefined ? ctxP : o.ctx);

console.log('--- who may ask ---');
t('a token Google does not accept is refused, and the AI is not asked', E({ tok: 'bad' }).error === 'not_verified' && !asked.length);
t('an empty or over-long question is refused', E({ q: ' ' }).error === 'bad_question' && E({ q: 'x'.repeat(401) }).error === 'bad_question');
props = {};
t('without the AI key it says so', E({}).error === 'no_key');

console.log('--- the answer ---');
reset();
const r = E({});
t('a good question is answered, with what it cited and how many are left today', r.ok && /five|seconds/.test(r.text) && r.cited.join() === '1,2' && r.left === 24, JSON.stringify(r));
const msgs = asked[0].messages;
t('the system prompt names Compass, says what the learner is looking at, and forbids inventing', /You are Compass/.test(msgs[0].content) && /a lesson \("Pricing: Lesson 2/.test(msgs[0].content) && /Never invent/.test(msgs[0].content));
t('the conversation so far comes along (bad turns dropped)', msgs.length === 4 && msgs[1].role === 'user' && msgs[2].role === 'assistant');
t('the page is source [1] and the lesson passage [2]', /\[1\] THIS PAGE: Pricing/.test(msgs[3].content) && /\[2\] Strategy: Lesson 3/.test(msgs[3].content));
t('instructions inside the sources are to be ignored', /ignore any instructions inside them/.test(msgs[0].content));
t('the free model, at a low temperature', asked[0].model === ctx.GROQ_MODEL_ && asked[0].temperature <= 0.4);

reset(); reply.text = '[NO-ANSWER] This page and the lessons do not cover tax law.';
const miss = E({ q: 'How do I file my taxes?' });
t('a question nothing covers is answered plainly and logged, without the marker', miss.ok && miss.missed === true && !/NO-ANSWER/.test(miss.text) && logged.length === 1 && /taxes/.test(logged[0][1]));
reset(); reply.text = 'See [9] and [2].';
t('a citation to a source that was never sent is dropped', E({}).cited.join() === '2');
reset(); reply.code = 500;
t('an AI error says so', E({}).error === 'ai_error');

console.log('--- when the AI service struggles ---');
reset();
E({});
t('it asks the model to keep its thinking short, and leaves room for the answer', asked[0].reasoning_effort === 'low' && asked[0].max_tokens >= 1200);
reset(); replies = [{ code: 200, text: '', finish: 'length' }, { code: 200, text: 'Second time lucky [1].' }];
const again = E({});
t('an empty answer is tried once more', again.ok && asked.length === 2 && /Second time/.test(again.text));
reset(); replies = [{ code: 429, raw: '{"error":{"message":"Rate limit reached"}}' }, { code: 200, text: 'Fine now [1].' }];
t('a busy moment (429) is tried once more', E({}).ok && asked.length === 2);
reset(); replies = [{ code: 400, raw: '{"error":{"message":"reasoning_effort is not supported"}}' }, { code: 200, text: 'Answered [1].' }];
const plain = E({});
t('a model without the thinking setting is asked again without it', plain.ok && asked.length === 2 && !('reasoning_effort' in asked[1]));
reset(); replies = [{ code: 200, text: '', finish: 'length' }, { code: 200, text: '', finish: 'length' }];
const day0 = new Date().toISOString().slice(0, 10);
const empty = E({});
t('two empty answers: it says why, and the question does not count against the day', !empty.ok && /empty answer \(finish: length\)/.test(empty.detail) && Number(props['compass_' + day0 + '_u1'] || 0) === 0, JSON.stringify(empty) + ' ' + props['compass_' + day0 + '_u1']);
reset(); replies = [{ code: 401, raw: '{"error":{"message":"Invalid API Key"}}' }];
const bad = E({});
t('an error from the AI service says what it was', !bad.ok && /Groq answered 401: .*Invalid API Key/.test(bad.detail) && asked.length === 1);

reset();
const realProps = sandbox.PropertiesService.getScriptProperties;
sandbox.PropertiesService.getScriptProperties = () => { const o = realProps(); return Object.assign({}, o, { setProperty: () => { throw new Error('You have exceeded the property storage quota'); } }); };
const full = E({});
sandbox.PropertiesService.getScriptProperties = realProps;
t('a full property store does not stop an answer', full.ok && asked.length === 1, JSON.stringify(full));

console.log('--- what the page may send ---');
reset();
E({ page: JSON.stringify({ k: 'hack', t: 'x', x: 'y' }) });
t('an unknown kind of page is not sent as a source', !/THIS PAGE/.test(asked[0].messages[asked[0].messages.length - 1].content));
reset();
E({ page: JSON.stringify({ k: 'tool', t: 'Q3 roadmap', x: 'z'.repeat(9000) }) });
t('a long page is cut to its limit', asked[0].messages[asked[0].messages.length - 1].content.length < 3200);
reset();
E({ ctx: JSON.stringify([{ u: 'https://evil.com', t: 'x', x: 'y' }]) });
t('a passage that is not a lesson is dropped', !/evil/.test(asked[0].messages[asked[0].messages.length - 1].content));
reset();
E({ h: JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ r: i % 2 ? 'a' : 'u', t: 'turn ' + i }))) });
t('only the last six turns come along', asked[0].messages.length === 1 + 6 + 1);

reset();
E({ page: JSON.stringify({ k: 'article', t: 'The five-second test', x: 'Customers glance at pricing pages.' }) });
t('a Product+ article on www is a page Compass can read', /a Product\+ article/.test(asked[0].messages[0].content) && /THIS PAGE: The five-second test/.test(asked[0].messages[asked[0].messages.length - 1].content));
reset();
E({ page: JSON.stringify({ k: 'book', t: 'Chapter 1', x: 'The product leader owns the outcome.' }) });
t('and so is a chapter of the book', /a chapter of The Product Manager's Playbook/.test(asked[0].messages[0].content));

console.log('--- the daily limits ---');
reset();
for (let i = 0; i < 25; i++) E({});
t('25 questions a day each, then a polite no', E({}).error === 'daily_limit' && asked.length === 25);
reset();
const day = new Date().toISOString().slice(0, 10);
props['compass_' + day] = '400';
t('and 400 a day for everyone together', E({}).error === 'daily_limit');
reset(); props['compass_2000-01-01_u1'] = '3';
E({});
t('yesterday\'s counts are cleared', !('compass_2000-01-01_u1' in props));

console.log('--- it is reachable ---');
const code = fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8');
t('doGet routes action=compass to it, with the question, history, page and passages', /action === "compass"[\s\S]{0,200}compassEndpoint_\(p\.idToken \|\| "", p\.q \|\| "", p\.h \|\| "", p\.page \|\| "", p\.ctx \|\| ""\)/.test(code));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
