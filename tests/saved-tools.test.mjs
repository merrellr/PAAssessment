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
// the list: filter, search and order
const L = [
  { id: 'a', tool: 'impact', title: 'Q3 roadmap', summary: '1. SSO (Big bet)', updatedAt: ts(30) },
  { id: 'b', tool: 'scorecard', title: '', summary: '1. Onboarding', updatedAt: ts(50) },
  { id: 'c', tool: 'impact', title: 'annual plan', summary: '', updatedAt: ts(10) },
  { id: 'd', tool: 'bbp', title: 'Billing vendor', summary: 'Leading: Buy', updatedAt: ts(40) }
];
const ids = (x) => x.map(d => d.id).join();
t('list: newest first by default', ids(C.filterSort(L, {})) === 'b,d,a,c' && ids(C.filterSort(L)) === 'b,d,a,c');
t('list: one tool, or all', ids(C.filterSort(L, { tool: 'impact' })) === 'a,c' && ids(C.filterSort(L, { tool: 'all' })) === 'b,d,a,c');
t('list: search looks in the name, summary and tool name, every word, any case', ids(C.filterSort(L, { q: 'SSO' })) === 'a' && ids(C.filterSort(L, { q: 'untitled' })) === 'b' && ids(C.filterSort(L, { q: 'decision billing' })) === 'd' && ids(C.filterSort(L, { q: 'nothing like this' })) === '');
t('list: oldest first, by name (A to Z, any case), by tool', ids(C.filterSort(L, { sort: 'oldest' })) === 'c,a,d,b' && ids(C.filterSort(L, { sort: 'name' })) === 'c,d,a,b' && ids(C.filterSort(L, { sort: 'tool' })) === 'b,d,a,c');
t('list: counts per tool', JSON.stringify(C.countByTool(L)) === JSON.stringify({ all: 4, scorecard: 1, ai: 0, bbp: 1, impact: 2 }));
t('list: the original is never reordered', ids(L) === 'a,b,c,d');

t('download name: the saved name and the tool, safe for any computer', C.fileName({ tool: 'bbp', title: 'Q3: vendor/partner?' }) === 'Q3 vendor partner - Build, Buy, or Partner Decision Matrix.csv' && C.fileName({ tool: 'impact', title: '' }) === 'Untitled impact score - Organizational Impact Score.csv');
t('each tool names its scoring file on www', Object.keys(C.TOOLS).every(k => /-core\.js$/.test(C.TOOLS[k].core) && /Core$/.test(C.TOOLS[k].global)) && C.CORE_BASE === 'https://www.productadvisory.co/assets/js/');
t('share link: the public tool page with the work, never the saved copy\'s id', C.shareUrl('impact', 'abc') === 'https://www.productadvisory.co/impact-score#s=abc' && C.shareUrl('impact', '') === '' && C.shareUrl('nope', 'x') === '');
t('workspace: the tool page with ?embed=1 and the work in the #', C.embedUrl('bbp', 'xyz') === 'https://www.productadvisory.co/build-buy-partner?embed=1#m=xyz' && C.embedUrl('ai', '') === 'https://www.productadvisory.co/ai-use-cases?embed=1');
t('workspace: "Try the example" (only for new work), and a test copy of www', C.embedUrl('scorecard', '', { example: true }) === 'https://www.productadvisory.co/scorecard?embed=1&start=example' && C.embedUrl('scorecard', 'd', { example: true }) === 'https://www.productadvisory.co/scorecard?embed=1#s=d' && C.embedUrl('impact', '', { base: 'http://127.0.0.1:8799/fake-' }) === 'http://127.0.0.1:8799/fake-impact-score?embed=1');
t('links inside a tool: another tool is recognised, anything else is not', C.toolForUrl('https://www.productadvisory.co/scorecard') === 'scorecard' && C.toolForUrl('https://www.productadvisory.co/build-buy-partner.html') === 'bbp' && C.toolForUrl('https://www.productadvisory.co/services#strategy') === '' && C.toolForUrl('https://evil.example/scorecard') === '' && C.toolForUrl('not a url') === '' && C.toolForUrl('http://127.0.0.1:8799/faketool-scorecard', 'http://127.0.0.1:8799/faketool-') === 'scorecard' && C.toolForUrl('http://127.0.0.1:8799/scorecard', 'http://127.0.0.1:8799/faketool-') === '');
const now = Date.UTC(2026, 9, 30, 12);
t('times: just now, minutes, hours, yesterday, days, then a date', C.ago(now - 10e3, now) === 'just now' && C.ago(now - 60e3, now) === '1 minute ago' && C.ago(now - 5 * 60e3, now) === '5 minutes ago' && C.ago(now - 3 * 3600e3, now) === '3 hours ago' && C.ago(now - 30 * 3600e3, now) === 'yesterday' && C.ago(now - 4 * 864e5, now) === '4 days ago' && /2026/.test(C.ago(now - 30 * 864e5, now)) && C.ago(0, now) === 'just now');
t('each tool has a short description for the toolkit', Object.keys(C.TOOLS).every(k => C.TOOLS[k].blurb && C.TOOLS[k].noun));
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
