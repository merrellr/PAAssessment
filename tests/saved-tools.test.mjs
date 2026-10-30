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

// a tool's export, read back to draw its results
const rows = C.parseCSV('Rank,"Name, with comma","He said ""hi"""\r\n1,\'-5,\'=SUM(A1)\r\n\r\nlast');
t('CSV: quotes, commas and doubled quotes are read', rows[0].join('|') === 'Rank|Name, with comma|He said "hi"', JSON.stringify(rows[0]));
t('CSV: cells guarded against spreadsheet formulas show as typed', rows[1].join('|') === '1|-5|=SUM(A1)', JSON.stringify(rows[1]));
t('CSV: a line break inside quotes stays in the cell', C.parseCSV('"a\nb",c')[0][0] === 'a\nb');
const parts = C.csvSections('Organizational Impact Score,Q3\r\n\r\nRank,Initiative,Score\r\n1,SSO,62\r\n2,Onboarding,64\r\nTotal weight,100\r\n\r\nOur decision,Partner\r\nWhy,"Cheapest, fast"\r\n');
t('sections: split at blank lines', parts.length === 3, JSON.stringify(parts));
t('sections: label and value lines become pairs', parts[0].kind === 'pairs' && parts[0].rows[0].join('|') === 'Organizational Impact Score|Q3' && parts[2].kind === 'pairs' && parts[2].rows[1][1] === 'Cheapest, fast');
t('sections: a table keeps its headings, short rows padded', parts[1].kind === 'table' && parts[1].head.join() === 'Rank,Initiative,Score' && parts[1].rows.length === 3 && parts[1].rows[2].join('|') === 'Total weight|100|');
t('sections: nothing gives nothing', C.csvSections('').length === 0);
t('download name: the saved name and the tool, safe for any computer', C.fileName({ tool: 'bbp', title: 'Q3: vendor/partner?' }) === 'Q3 vendor partner - Build, Buy, or Partner Decision Matrix.csv' && C.fileName({ tool: 'impact', title: '' }) === 'Untitled impact score - Organizational Impact Score.csv');
t('each tool names its scoring file on www', Object.keys(C.TOOLS).every(k => /-core\.js$/.test(C.TOOLS[k].core) && /Core$/.test(C.TOOLS[k].global)) && C.CORE_BASE === 'https://www.productadvisory.co/assets/js/');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
