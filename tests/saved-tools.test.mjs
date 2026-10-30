// Tests for saved-tools-core.js (My saved tools, my-tools.html).   Run:  node tests/saved-tools.test.mjs
import '../saved-tools-core.js';
const C = globalThis.SavedToolsCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
// what www's save.js builds
const hand = (o) => '#save=' + Buffer.from(JSON.stringify(o), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const good = { v: 1, tool: 'bbp', doc: '', title: 'Analytics dashboard ✓', summary: 'Leading: Partner', data: 'eyJ0IjoiQSJ9' };

const h = C.parseHandoff(hand(good));
t('a handoff from a tool is read, unicode included', h && h.tool === 'bbp' && h.title === 'Analytics dashboard ✓' && h.data === 'eyJ0IjoiQSJ9' && h.doc === '', JSON.stringify(h));
t('it carries the saved copy\'s id when the tool was opened from here', C.parseHandoff(hand(Object.assign({}, good, { doc: 'abc123XYZ' }))).doc === 'abc123XYZ');
t('a strange id is dropped (a new copy is saved instead)', C.parseHandoff(hand(Object.assign({}, good, { doc: '../x' }))).doc === '');
t('anything that is not a handoff is ignored', C.parseHandoff('') === null && C.parseHandoff('#m=abc') === null && C.parseHandoff('#save=%%%') === null && C.parseHandoff('#save=bm90IGpzb24') === null);
t('only the four tools', C.parseHandoff(hand(Object.assign({}, good, { tool: 'other' }))) === null);
t('the data must be a share-link encoding, and not too large', C.parseHandoff(hand(Object.assign({}, good, { data: '<b>' }))) === null && C.parseHandoff(hand(Object.assign({}, good, { data: 'a'.repeat(20001) }))) === null);
t('an unknown version is ignored', C.parseHandoff(hand(Object.assign({}, good, { v: 2 }))) === null);
t('long titles and summaries are trimmed', C.parseHandoff(hand(Object.assign({}, good, { title: 'x'.repeat(300), summary: 'y'.repeat(300) }))).title.length === 100);
t('the record has exactly the fields the rules allow (times added on save)', JSON.stringify(Object.keys(C.record('u1', h))) === '["uid","tool","title","summary","data"]');
t('a saved tool opens back on its page, with its id', C.openUrl('bbp', 'abc', 'id9') === 'https://www.productadvisory.co/build-buy-partner#m=abc&doc=id9' && C.openUrl('scorecard', 'q', '') === 'https://www.productadvisory.co/scorecard#s=q' && C.openUrl('ai', 'q', 'x') === 'https://www.productadvisory.co/ai-use-cases#u=q&doc=x' && C.openUrl('impact', 'q', 'x') === 'https://www.productadvisory.co/impact-score#s=q&doc=x');
t('titles: an untitled one says which tool, and copies say so', C.displayTitle({ tool: 'impact', title: '' }) === 'Untitled impact score' && C.copyTitle('Q3 roadmap') === 'Copy of Q3 roadmap');
const ts = (n) => ({ toMillis: () => n });
t('newest first; one still saving goes to the top', C.sortNewest([{ id: 'a', updatedAt: ts(1) }, { id: 'b', updatedAt: ts(5) }, { id: 'c' }]).map(d => d.id).join() === 'c,b,a');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
