// Tests for workspace-core.js (the Team Knowledge Workspace, no DOM).   Run:  node tests/workspace-core.test.mjs
import fs from 'fs';
globalThis.window = globalThis;
eval(fs.readFileSync(new URL('../workspace-core.js', import.meta.url), 'utf8'));
const W = globalThis.WorkspaceCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

// clean: only known fields, in range; what doesn't apply to the type is blank
const c = W.clean({ type: 'idea', title: '  Route   planning  ', note: 'x'.repeat(3000), area: 'Scheduling', status: 'planned', date: '2027-01-01', votes: '12', band: 'b4', value: 5, links: ['bad id', 'abcdef1', 'abcdef1'], extra: 1 });
t('clean: title trimmed and spaces folded, note capped, the type’s own fields kept', c.title === 'Route planning' && c.note.length === 2000 && c.area === 'Scheduling' && c.status === 'planned' && c.votes === 12);
t('clean: an idea has no date, band or value; bad and repeated links dropped', c.date === '' && c.band === '' && c.value === null && JSON.stringify(c.links) === '["abcdef1"]');
t('clean: exactly the saved fields', JSON.stringify(Object.keys(c).sort()) === JSON.stringify(W.FIELDS.slice().sort()));
const acc = W.clean({ type: 'account', title: 'Acme', band: 'b3', value: '$120k', tier: 3, area: 'x', status: 'planned' });
t('clean: an account keeps band, value (from "$120k") and tier, but no area or status', acc.band === 'b3' && acc.value === 120000 && acc.tier === 3 && acc.area === '' && acc.status === '');
t('clean: in "bands only" mode an exact value is not kept', W.clean({ type: 'account', title: 'A', value: 5000, band: 'b1' }, null, 'bands').value === null);
t('clean: an unknown status or a bad date is blanked', W.clean({ type: 'release', title: 'R', status: 'nope', date: '2027-13-45' }).status === '' && W.clean({ type: 'release', title: 'R', date: '2027-13-45' }).date === '');
const byId = { goal0001: { type: 'goal' }, acct0001: { type: 'account' } };
t('clean with the workspace: a feature keeps its link to a goal but not to an account (features link releases and goals)', JSON.stringify(W.clean({ type: 'feature', title: 'F', links: ['goal0001', 'acct0001', 'missing1'] }, byId).links) === '["goal0001"]');
t('problems: a title is needed, and a type', W.problems({ type: 'idea', title: ' ' }).length === 1 && W.problems({ type: 'x', title: 'a' }).length === 1 && W.problems({ type: 'goal', title: 'G' }).length === 0);

// value
t('money: $1,200 / 45k / 1.5m / nonsense', W.parseMoney('$1,200') === 1200 && W.parseMoney('45k') === 45000 && W.parseMoney('1.5m') === 1500000 && W.parseMoney('lots') === null);
t('band from a value', W.bandFor(5000) === 'b1' && W.bandFor(10000) === 'b2' && W.bandFor(250000) === 'b4');
t('account value: exact when known, else the band’s middle', W.accountValue({ value: 70000, band: 'b4' }) === 70000 && W.accountValue({ value: null, band: 'b2' }) === 30000 && W.accountValue({}) === 0);
t('value label: a band in bands mode even when a figure exists; the figure otherwise', W.valueLabel({ value: 70000, band: 'b3' }, 'bands') === '$50k–$250k' && W.valueLabel({ value: 70000 }, 'either') === '$70k' && W.valueLabel({ value: 1500000 }, 'exact') === '$1.5m');

// graph
const items = [{ id: 'aaaaaa', type: 'idea', links: ['bbbbbb', 'cccccc'] }, { id: 'bbbbbb', type: 'account', links: [] }, { id: 'cccccc', type: 'feature', links: ['dddddd', 'zzzzzz'] }, { id: 'dddddd', type: 'release', links: [] }];
const g = W.graph(items);
t('graph: links read both ways, missing items ignored', g.bbbbbb[0] === 'aaaaaa' && g.cccccc.length === 2 && g.dddddd[0] === 'cccccc');
t('who links to what', JSON.stringify(W.linkTargets('idea')) === '["account","feature"]' && JSON.stringify(W.linkedFrom('goal')) === '["release","feature"]');
t('counts and search (all words, any field)', W.counts(W.sample()).account === 6 && W.search(W.sample(), 'drive time').length === 2 && W.search(W.sample(), 'drive', 'idea').length === 1);

// CSV
const csv = 'Title,Type,Description,Status,Value,Linked to\n"Harbor, Inc.",Customer,"Big one, ""key""",,$300k,\nRoute planning,Request,"Line one\nline two",open,,"Harbor, Inc.; Nope"\n,idea,no title,,,\nSpring,Release,,,,';
const parsed = W.parseCsv(csv);
t('csv: quotes, commas and newlines inside quotes', parsed.headers.length === 6 && parsed.rows.length === 4 && parsed.rows[0][0] === 'Harbor, Inc.' && parsed.rows[0][2] === 'Big one, "key"' && parsed.rows[1][2] === 'Line one\nline two');
t('csv: semicolon files too', W.parseCsv('Name;Type\nA;goal').rows[0][1] === 'goal');
const m = W.guessMapping(parsed.headers);
t('csv: columns guessed from their headers', m.title === 0 && m.type === 1 && m.note === 2 && m.status === 3 && m.value === 4 && m.links === 5, JSON.stringify(m));
const r = W.fromRows(parsed.rows, m, 'idea', [], 'either');
t('import: types from words like Customer and Request; a row with no title is skipped and said why', r.items.length === 3 && r.items[0].type === 'account' && r.items[1].type === 'idea' && r.skipped.length === 1 && r.skipped[0].row === 4 && /no title/.test(r.skipped[0].reason));
t('import: value to a band too, status mapped ("open" → New)', r.items[0].value === 300000 && r.items[0].band === 'b4' && r.items[1].status === 'new');
t('import: "linked to" finds items by title where the types can link', JSON.stringify(r.items[1].links) === JSON.stringify([r.items[0].id]));
t('import: ids are fresh and valid', r.items.every(i => W.isId(i.id)) && new Set(r.items.map(i => i.id)).size === 3);
const full = Array.from({ length: W.MAX_ITEMS - 1 }, (_, i) => ({ id: 'x' + i + 'aaaaa', type: 'goal', title: 'G' + i }));
const r2 = W.fromRows([['A'], ['B']], { title: 0 }, 'goal', full);
t('import: stops at the workspace limit', r2.items.length === 1 && /full/.test(r2.skipped[0].reason));
t('dates: ISO, US month/day/year, and nonsense', W.dateFrom('2027-02-03') === '2027-02-03' && W.dateFrom('3/9/2027') === '2027-03-09' && W.dateFrom('soon') === '');

// sample
const S = W.sample(), sg = W.graph(S);
t('sample: every kind of item, valid ids, all links resolve', W.ORDER.every(k => S.some(i => i.type === k)) && S.every(i => W.isId(i.id)) && S.every(i => i.links.every(l => S.some(o => o.id === l))));
t('sample: every link is a type its item may link to', S.every(i => i.links.every(l => W.linkTargets(i.type).indexOf(S.find(o => o.id === l).type) > -1)));
t('sample: nothing is left unconnected', S.every(i => sg[i.id].length > 0));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
