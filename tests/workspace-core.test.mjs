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

// the views
const V = [
  { id: 'acctBig01', type: 'account', title: 'Big', value: 400000, band: 'b4', tier: 3, links: [] },
  { id: 'acctMid01', type: 'account', title: 'Mid', value: null, band: 'b2', tier: 1, links: [] },
  { id: 'acctSml01', type: 'account', title: 'Small', value: 5000, band: 'b1', tier: 0, links: [] },
  { id: 'ideaPop01', type: 'idea', title: 'Popular', votes: 50, links: ['acctSml01'] },
  { id: 'ideaVal01', type: 'idea', title: 'Valuable', votes: 3, links: ['acctBig01', 'acctMid01', 'featA0001'] },
  { id: 'ideaNon01', type: 'idea', title: 'Nobody', votes: 0, links: [] },
  { id: 'relLate01', type: 'release', title: 'Late', date: '2027-09-01', links: ['goalA0001'] },
  { id: 'relSoon01', type: 'release', title: 'Soon', date: '2027-03-01', links: [] },
  { id: 'featA0001', type: 'feature', title: 'A', area: 'Core', status: 'done', links: ['relSoon01', 'goalA0001'] },
  { id: 'featB0001', type: 'feature', title: 'B', area: 'Core', links: ['relLate01', 'goalA0001'] },
  { id: 'featC0001', type: 'feature', title: 'C', area: '', links: ['goalA0001'] },
  { id: 'goalA0001', type: 'goal', title: 'Goal A', date: '2027-06-30', links: [] },
  { id: 'goalB0001', type: 'goal', title: 'Goal B', date: '', links: [] }
];
const vr = W.valueRank(V);
t('value view: ranked by account value weighted by how strategic, not by votes', vr[0].title === 'Valuable' && vr[0].score === 400000 * 2 + 30000 && vr[0].value === 430000 && vr[0].voteRank === 2 && vr[1].title === 'Popular' && vr[1].voteRank === 1, JSON.stringify(vr.map(r => [r.title, r.score, r.rank, r.voteRank])));
t('value view: exact only when every account behind it has a figure; strategic accounts counted', vr[0].exact === false && vr[1].exact === true && vr[0].strategic === 1);
t('value view: an idea with no accounts ranks last, at 0', vr[2].title === 'Nobody' && vr[2].score === 0 && vr[2].rank === 3);
t('value view: weighting can be left out', W.valueRank(V, { weighted: false })[0].score === 430000);
t('value view: shift is how many places value lifts it above votes', vr[0].shift === 1 && vr[1].shift === -1);
t('money', W.money(430000) === '$430k' && W.money(1250000, true) === '≈ $1.3m' && W.money(800) === '$800');
const rm = W.releaseMap(V);
t('release map: releases by date, then "No release"', rm.cols.map(c => c.title).join() === 'Soon,Late,No release', rm.cols.map(c => c.title).join());
t('release map: areas, with "No area" last', rm.rows.map(r => r.label).join() === 'Core,No area');
t('release map: each feature in its cell, with the ideas linked to it', rm.rows[0].cells[0][0].title === 'A' && rm.rows[0].cells[0][0].ideas[0].title === 'Valuable' && rm.rows[0].cells[1][0].title === 'B' && rm.rows[1].cells[2][0].title === 'C');
t('release map: counts per release', rm.cols[0].features === 1 && rm.cols[0].ideas === 1 && rm.cols[2].features === 1);
const gt = W.goalTimeline(V), ga = gt.goals[0];
t('goal timeline: goals by date, undated last', gt.goals.map(g => g.title).join() === 'Goal A,Goal B');
t('goal timeline: features placed at their release dates, in order', ga.features.map(f => f.title + '@' + f.date).join() === 'A@2027-03-01,B@2027-09-01');
t('goal timeline: a feature landing after the goal’s target is flagged', !ga.features[0].late && ga.features[1].late);
t('goal timeline: a feature with no release is not scheduled', ga.unscheduled.map(f => f.title).join() === 'C');
t('goal timeline: the goal’s releases as markers, and how many features are done', ga.releases.map(r => r.title).join() === 'Late' && ga.done === 1);
t('goal timeline: the range covers targets and releases', gt.range.from === '2027-03-01' && gt.range.to === '2027-09-01');
t('position on the axis', W.position('2027-03-01', gt.range) === 0 && W.position('2027-09-01', gt.range) === 1 && W.position('', gt.range) === 0 && W.position('2027-05-01', { from: '2027-05-01', to: '2027-05-01' }) === 0.5);
const sv = W.valueRank(W.sample());
t('sample: the most-voted idea is not the most valuable (the point of the view)', sv[0].voteRank > 1 && sv.find(r => r.voteRank === 1).rank > 3);

// product map
const SP = W.sample(), pm = W.productMap(SP);
t('map: five columns in link order, every item placed once', pm.cols.map(c => c.type).join() === 'account,idea,feature,release,goal' && pm.cols.reduce((n, c) => n + c.nodes.length, 0) === SP.length);
const nodes = pm.cols.flatMap(c => c.nodes);
t('map: no two items overlap in a column', pm.cols.every(c => c.nodes.every((n, i) => i === 0 || n.y >= c.nodes[i - 1].y + pm.size.h)));
t('map: everything fits inside the map', nodes.every(n => n.x >= 0 && n.y >= 0 && n.x + pm.size.w <= pm.width && n.y + pm.size.h <= pm.height));
const linkCount = SP.reduce((n, i) => n + i.links.length, 0);
t('map: one line per link, always from the left column to the right', pm.edges.length === linkCount && pm.edges.every(e => { const a = nodes.find(n => n.id === e.from), b = nodes.find(n => n.id === e.to); return a.x < b.x; }));
const crossings = (P) => { let x = 0; const by = {}; P.cols.forEach(c => c.nodes.forEach(n => { by[n.id] = n; })); const E = P.edges;
  for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { const a = E[i], b = E[j]; if (by[a.from].x !== by[b.from].x || by[a.to].x !== by[b.to].x) continue; if ((by[a.from].y - by[b.from].y) * (by[a.to].y - by[b.to].y) < 0) x++; } return x; };
t('map: ordering keeps line crossings low on the sample', crossings(pm) <= 20, crossings(pm));
const tAcc = W.trace(SP, 'samplea6'), typeOf = (id) => SP.find(i => i.id === id).type;
t('trace from an account: only rightwards (its ideas and what they became), no other accounts', tAcc.ids.filter(id => typeOf(id) === 'account').length === 1 && tAcc.ids.includes('samplei2') && tAcc.ids.includes('samplef5') && tAcc.ids.includes('sampleg1'));
const tFeat = W.trace(SP, 'samplef7');
t('trace from a feature: the ideas and accounts behind it, and its goal', tFeat.ids.includes('samplei3') && tFeat.ids.includes('samplea3') && tFeat.ids.includes('sampleg3') && !tFeat.ids.includes('samplea1'));
t('trace: its lines are named from left to right', tFeat.edges.includes('samplei3>samplef7') && tFeat.edges.includes('samplef7>sampleg3'));
t('trace: an unknown item traces nothing', W.trace(SP, 'nope').ids.length === 0);
t('map: an empty workspace still has its five columns', W.productMap([]).cols.length === 5 && W.productMap([]).edges.length === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
