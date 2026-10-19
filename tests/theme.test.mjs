// Tests for the shared Product Advisory look: the theme files on each page, the search index, and "Make it yours".
// Run:  node --experimental-default-type=module tests/theme.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildIndex, renderIndex, buildAskIndex, renderAskIndex, ASK_PASSAGE_MAX } from '../tools/build-search-index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// Pages that have the new look. Add a page here when it is converted.
const THEMED = ['index', 'framework', 'request-info', 'tool-requests', 'lms-dashboard', 'lesson', 'profile', 'join', 'company', 'owner', 'reports', 'owner-tools', 'owner-pilot', 'assessment-dashboard'];

console.log('--- the theme files are on each themed page, in the right order ---');
for (const p of THEMED) {
  const h = read(p + '.html');
  const head = h.slice(0, h.indexOf('</head>'));
  const prefs = head.indexOf('<script src="pa-prefs.js"></script>');
  const style = head.indexOf('<style');
  const theme = head.indexOf('<link rel="stylesheet" href="pa-theme.css">');
  t(p + '.html: pa-prefs.js in the head, before the page styles (so there is no flash of the wrong look)', prefs > -1 && prefs < style);
  t(p + '.html: pa-theme.css after the page styles (so it can re-point their colours)', theme > head.indexOf('</style>'));
  t(p + '.html: pa-shell.js straight after <body> (the header is drawn before the page)', /<body[^>]*>\s*<script src="pa-shell\.js"><\/script>/.test(h));
  t(p + '.html: the old fonts are gone', !/Space\+Grotesk|IBM\+Plex/.test(h) && !/['"]Space Grotesk['"]|['"]IBM Plex Sans['"]/.test(h));
  t(p + '.html: no SVG attribute lost its quotes in the conversion', !/(font-family|fill|stroke)=var\(/.test(h));
}

console.log('--- the search index ---');
{
  const items = buildIndex();
  t('search-index.js is up to date with content/ (run: node tools/build-search-index.mjs)', read('search-index.js') === renderIndex(items));
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('company-core.js'), sandbox);
  const counts = (sandbox.CompanyCore || sandbox.window.CompanyCore || {}).LESSON_COUNTS || {};
  const courses = items.filter(i => i.k === 'course');
  t('every course with content is in the index (' + courses.length + ')', courses.length === Object.keys(counts).length, courses.length + ' vs ' + Object.keys(counts).length);
  const wrong = courses.filter(c => { const id = c.u.match(/course=([^&]+)/)[1]; return items.filter(i => i.k === 'lesson' && i.u.indexOf('course=' + id + '&') > -1).length !== counts[id]; });
  t('each course lists the same number of lessons the dashboard counts', wrong.length === 0, wrong.map(w => w.t).join());
  t('all seven skill areas link to their section of the framework', items.filter(i => i.k === 'framework').every(i => /^framework\.html#[a-zA-Z]+$/.test(i.u)) && items.filter(i => i.k === 'framework').length === 7);
  t('lesson links go to lesson.html with a course and lesson number', items.filter(i => i.k === 'lesson').every(i => /^lesson\.html\?course=[a-zA-Z]+-[a-z]+&lesson=\d+$/.test(i.u)));
  t('no lesson text in the index carries HTML', items.every(i => !/<[a-z]/i.test(i.x || '')));
}

console.log('--- the "Ask AI" passages ---');
{
  const ask = buildAskIndex();
  t('ask-index.js is up to date with content/ (run: node tools/build-search-index.mjs)', read('ask-index.js') === renderAskIndex(ask));
  const lessons = buildIndex().filter(i => i.k === 'lesson').map(i => i.u);
  const covered = new Set(ask.map(p => p.u));
  t('every lesson has at least one passage (' + lessons.length + ')', lessons.every(u => covered.has(u)), lessons.filter(u => !covered.has(u)).slice(0, 3).join());
  // the same link check the Apps Script applies (askClean_ in apps-script/Code.gs)
  const LINK = /^(lesson\.html\?course=[a-zA-Z]+-[a-z]+&lesson=\d{1,2}|framework\.html#[a-zA-Z]+)$/;
  const gs = fs.readFileSync(path.join(root, 'apps-script', 'Code.gs'), 'utf8');
  t('the Apps Script accepts the same links the passages use', gs.indexOf(LINK.source) > -1 && ask.every(p => LINK.test(p.u)));
  t('every passage fits what the Apps Script keeps (' + ASK_PASSAGE_MAX + ' characters or fewer)', ask.every(p => p.x.length > 0 && p.x.length <= ASK_PASSAGE_MAX) && /ASK_PASSAGE_CHARS_ = 900;/.test(gs));
  t('no passage carries HTML or a diagram\'s text', ask.every(p => !/<[a-z]|viewBox|marker/i.test(p.x)));
  t('a quick check keeps its answer in the same passage', ask.every(p => !/^Answer:/.test(p.x)));
}

console.log('--- "Make it yours" (pa-prefs.js) ---');
function load(host, cookie, store) {
  const attrs = {};
  const doc = {
    cookie: cookie || '',
    documentElement: { setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; }, getAttribute: (k) => attrs[k] || null },
    head: { appendChild: () => {} }, getElementById: () => null, createElement: () => ({})
  };
  let written = [];
  Object.defineProperty(doc, 'cookie', { get: () => cookie || '', set: (v) => { written.push(v); } });
  const ls = store || {};
  const win = { location: { hostname: host }, document: doc, matchMedia: () => ({ matches: false }), dispatchEvent: () => {}, CustomEvent: function () {},
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(read('pa-prefs.js'), win);
  return { L: win.PALook, attrs, written, ls };
}
{
  const a = load('assessment.productadvisory.co');
  t('a first visit gets the defaults and sets nothing on the page', a.L.read().style === 'classic' && a.L.read().mode === '' && Object.keys(a.attrs).length === 0);
  const b = load('assessment.productadvisory.co', 'pa_look=' + encodeURIComponent(JSON.stringify({ style: 'lab', mode: 'dark', text: 'l', accent: 'gold' })));
  t('a look saved on another productadvisory.co site is applied before the page draws', b.attrs['data-style'] === 'lab' && b.attrs['data-theme'] === 'dark' && b.attrs['data-text'] === 'l' && b.attrs['data-accent'] === 'gold');
  const c = load('assessment.productadvisory.co', 'pa_look=' + encodeURIComponent(JSON.stringify({ style: 'hacked', mode: 'purple', text: '<b>' })));
  t('anything unexpected in the cookie falls back to the defaults', c.L.read().style === 'classic' && c.L.read().mode === '' && c.L.read().text === 'm' && !c.attrs['data-style']);
  const d = load('assessment.productadvisory.co');
  d.L.set('mode', 'dark');
  t('a choice is saved in a cookie shared by every productadvisory.co site', d.written.length === 1 && /^pa_look=/.test(d.written[0]) && /Domain=productadvisory\.co/.test(d.written[0]) && /Secure/.test(d.written[0]) && /SameSite=Lax/.test(d.written[0]));
  t('and kept in this browser too', JSON.parse(d.ls.pa_look).mode === 'dark');
  const e = load('127.0.0.1');
  e.L.set('style', 'editorial');
  t('on a test server no cookie is written, only browser storage', e.written.length === 0 && JSON.parse(e.ls.pa_look).style === 'editorial');
  const f = load('evil-productadvisory.co.example.com');
  f.L.set('mode', 'dark');
  t('a look-alike domain never gets the shared cookie', f.written.length === 0);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
