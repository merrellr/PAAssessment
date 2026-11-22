// Tests for compass-core.js (Compass, the assistant in Learning's header).   Run:  node tests/compass-core.test.mjs
import '../compass-core.js';
const C = globalThis.CompassCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

console.log('--- what a page sends ---');
const short = 'Pricing pages are glanced at.\nShow it for five seconds.';
t('a short page goes whole', C.pickPage(short, 'anything') === short);
const long = ['Lesson opening: why pricing pages matter.'].concat(Array.from({ length: 40 }, (_, i) => 'Paragraph ' + i + ' about onboarding flows and activation metrics in detail.'))
  .concat(['The decoy effect makes the middle plan look better.']).concat(Array.from({ length: 20 }, (_, i) => 'Closing paragraph ' + i + ' about retention.')).join('\n');
const picked = C.pickPage(long, 'What is the decoy effect?', 600);
t('a long page is cut to the limit', picked.length <= 600, picked.length);
t('it keeps the opening and the part that matches the question', picked.indexOf('Lesson opening') === 0 && picked.indexOf('decoy effect') > -1, picked.slice(0, 200));
t('a gap in the page is marked', picked.indexOf('…') > -1);
t('pieces break at line ends, and a very long line is split', C.chunks('a\nb', 600).length === 1 && C.chunks('x'.repeat(1300), 600).length === 3);

console.log('--- the conversation ---');
const msgs = [{ r: 'u', t: 'Q1' }, { r: 'a', t: 'A1' }, { r: 'u', t: 'Q2' }, { r: 'a', t: 'Oops', err: 'daily_limit' }, { r: 'u', t: 'x'.repeat(900) }];
const h = C.history(msgs);
t('errors are left out, and long turns are cut', h.length === 4 && !h.some(m => m.t === 'Oops') && h[3].t.length === 400);
t('only the last six turns', C.history(Array.from({ length: 20 }, (_, i) => ({ r: i % 2 ? 'a' : 'u', t: 'turn ' + i }))).length === 6);

console.log('--- sources and answers ---');
const src = C.sources({ t: 'Lesson 2' }, [{ u: 'lesson.html?course=strategy-moderate&lesson=3', t: 'Strategy: Lesson 3' }], '/lesson?course=x&lesson=2');
t('this page is [1], then the lesson passages, with clean addresses', src[0].self && src[0].t === 'This page: Lesson 2' && src[1].u === '/lesson?course=strategy-moderate&lesson=3');
const html = C.render('It is read fast [1].\n- Show it [2]\n- Ask three questions [9]\nDone <b>.', src);
t('[n] becomes a link to its source; [1] (this page) is marked, not linked', /<span class="cp-cite"[^>]*>1<\/span>/.test(html) && /<a class="cp-cite" href="\/lesson\?course=strategy-moderate&amp;lesson=3"/.test(html));
t('a citation with no source is dropped', !/9/.test(html.replace(/lesson=\d/g, '')));
t('bullets become a list, and HTML in an answer is shown as text', /<ul><li>Show it/.test(html) && /&lt;b&gt;/.test(html) && !/<b>/.test(html));
t('every kind of page has a label, a prompt and suggestions', Object.keys(C.SEES).every(k => C.PLACEHOLDER[k] && C.SUGGEST[k] && C.SUGGEST[k].length >= 3));
t('errors read as plain sentences, with a sign-in link where it helps', /Sign in/.test(C.errorText('signin')) && /tomorrow/.test(C.errorText('daily_limit')) && /try again/.test(C.errorText('anything')));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
