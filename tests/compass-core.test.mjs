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

console.log('--- lesson search (for the bridge) and www ---');
const idx = [
  { u: 'lesson.html?course=strategy-moderate&lesson=1', t: 'Pricing pages', x: 'Customers glance at a pricing page for five seconds before deciding.' },
  { u: 'lesson.html?course=strategy-moderate&lesson=1', t: 'Pricing pages', x: 'The decoy plan makes the middle option look better.' },
  { u: 'lesson.html?course=strategy-moderate&lesson=1', t: 'Pricing pages', x: 'Count the decisions a buyer must make.' },
  { u: 'lesson.html?course=discovery-novice&lesson=2', t: 'Interviews', x: 'Ask about the last time the problem happened.' }];
const hits = C.retrieve(idx, 'How does pricing page decoy work?', 4);
t('the passages that match the question, at most two per lesson', hits.length === 2 && hits.every(h => /strategy/.test(h.u)) && hits.some(h => h.x.indexOf('decoy') > -1));
t('nothing matching gives nothing', C.retrieve(idx, 'zzz qqq', 4).length === 0 && C.retrieve([], 'pricing', 4).length === 0);
t('articles and the book have a label, a prompt and suggestions', C.SEES.article === 'This article' && C.SEES.book === 'This chapter' && C.SUGGEST.book.length >= 3);
t('the sign-in message links to Learning itself (it also shows on www)', /https:\/\/assessment\.productadvisory\.co\/lms-dashboard/.test(C.errorText('signin')));

console.log('--- the request fits in a web address ---');
const tok = 'e'.repeat(1200), base = { action: 'compass', idToken: tok, q: 'Explain this lesson simply' };
const bigPage = { k: 'lesson', t: 'Pricing: Lesson 2', x: 'The decoy effect — “middle” plans win. '.repeat(60).slice(0, 2000) };
const ps = Array.from({ length: 4 }, (_, i) => ({ u: 'lesson.html?course=strategy-moderate&lesson=' + (i + 1), t: 'Strategy: Lesson ' + (i + 1), x: 'Show the page to a stranger — for “five” seconds, then ask. '.repeat(20) }));
const hist6 = Array.from({ length: 6 }, (_, i) => ({ r: i % 2 ? 'a' : 'u', t: 'A long turn about pricing — “decoys” and anchors. '.repeat(12) }));
const len = (p) => new URLSearchParams(p).toString().length;
const f = C.fitRequest(base, bigPage, ps, hist6);
t('a big question with history is trimmed to fit', len(f.params) <= C.URL_MAX, len(f.params));
t('it still sends the question, the page and at least one passage', f.params.q === base.q && JSON.parse(f.params.page).x.length >= 300 && f.passages.length >= 1 && JSON.parse(f.params.ctx).length === f.passages.length);
const small = C.fitRequest(base, { k: 'lesson', t: 'x', x: 'short page' }, ps.slice(0, 1).map((p) => Object.assign({}, p, { x: 'short' })), []);
t('a small question goes as it is', JSON.parse(small.params.page).x === 'short page' && small.passages.length === 1);
t('no page at all is fine', C.fitRequest(base, null, [], []).params.page === '');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
