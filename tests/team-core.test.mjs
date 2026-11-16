// Tests for team-core.js (team mode for the Feature Prioritization Scorecard).
// Run:  node --experimental-default-type=module tests/team-core.test.mjs
import '../team-core.js';
const T = globalThis.TeamCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

const setup = T.fromScorecard({ title: 'Q1 roadmap', criteria: [
  { name: 'Customer value', weight: 5, cost: false }, { name: 'Effort', weight: 3, cost: true }, { name: '', weight: 2 }],
  features: [{ name: 'Mobile app' }, { name: 'SSO' }, { name: '  ' }, { name: 'Bulk export' }] });

console.log('--- setting up ---');
t('a session copies the named criteria and features', setup.criteria.length === 2 && setup.features.join() === 'Mobile app,SSO,Bulk export' && setup.title === 'Q1 roadmap');
t('a cost criterion stays a cost', setup.criteria[1].cost === true);
t('two features and a weighted criterion are enough', T.setupProblem(setup) === '');
t('one feature is not', /two features/.test(T.setupProblem(T.fromScorecard({ criteria: setup.criteria, features: ['A'] }))));
t('no weighted criterion is not', /criterion/.test(T.setupProblem(T.fromScorecard({ criteria: [{ name: 'X', weight: 0 }], features: ['A', 'B'] }))));

console.log('--- scoring alone ---');
const blank = T.blankScores(setup);
t('a blank card has a 0 (not scored) for every cell', blank.length === 3 && blank.every(r => r.join() === '0,0'));
t('progress counts the scored cells', T.progress(setup, [[5, 1], [3, 0], [0, 0]]).done === 3 && !T.progress(setup, [[5, 1]]).complete);
t('it is complete when every cell is scored', T.progress(setup, [[5, 1], [3, 3], [2, 2]]).complete);
t('bad values are cleaned (1-5, or 0)', T.normalizeScores(setup, [[9, -2], ['x']]).map(r => r.join()).join('|') === '5,0|0,0|0,0');

t('scores are stored as a digit string per feature (Firestore has no lists in lists)', T.encodeScores(setup, [[5, 2], [3, 0]]).join() === '52,30,00');
t('and read back the same way', T.normalizeScores(setup, ['52', '3', 'x9']).map(r => r.join()).join('|') === '5,2|3,0|0,5');
console.log('--- the score, as the Scorecard works it out ---');
t('all best (5 value, effort 1) is 100', T.featureScore(setup.criteria, [5, 1]) === 100);
t('all worst (1 value, effort 5) is 0', T.featureScore(setup.criteria, [1, 5]) === 0);
t('the middle is 50', T.featureScore(setup.criteria, [3, 3]) === 50);
t('value 5 and effort 5: value counts 5 of 8', T.featureScore(setup.criteria, [5, 5]) === 63);

console.log('--- the reveal ---');
const people = [
  { uid: 'a', name: 'Priya', scores: [[5, 2], [3, 3], [2, 1]] },
  { uid: 'b', name: 'Marcus', scores: [[2, 4], [3, 3], [2, 2]] },
  { uid: 'c', name: 'Dana', scores: [[5, 3], [4, 3], [2, 1]] },
  { uid: 'd', name: 'Sam', scores: [[4, 2], [0, 0], [0, 0]] }   // not finished: left out
];
const r = T.reveal(setup, people);
t('only people who finished are counted', r.people.map(p => p.name).join() === 'Priya,Marcus,Dana');
const mobile = r.features.find(f => f.name === 'Mobile app');
t('each person\'s score per feature', mobile.scores.join() === '91,25,81', mobile.scores.join());
t('the spread and the average', mobile.spread === 66 && mobile.avg === 66 && mobile.lo === 25 && mobile.hi === 91);
t('a wide spread says Discuss', mobile.level === 'discuss' && mobile.label === 'Discuss');
t('features are sorted by how far apart people are', r.features[0].name === 'Mobile app');
t('the criterion they disagreed on most, and who', mobile.split.criterion === 'Customer value' && mobile.split.high.join() === 'Priya,Dana' && mobile.split.low.join() === 'Marcus');
const sso = r.features.find(f => f.name === 'SSO'), bulk = r.features.find(f => f.name === 'Bulk export');
t('16 points apart is Some gap', sso.spread === 16 && sso.level === 'gap' && sso.label === 'Some gap');
t('close scores say Agreed', bulk.spread === 9 && bulk.level === 'agreed' && r.agreed.map(f => f.name).join() === 'Bulk export');
t('the discussion list holds the features worth discussing', r.discuss.length >= 1 && r.discuss[0].name === 'Mobile app');
t('a line to start the discussion', /^Mobile app: 66 points apart\. Priya and Dana scored Customer value 5, Marcus 2\./.test(T.discussLine(mobile)), T.discussLine(mobile));

console.log('--- agreeing ---');
const agreed = T.consensus(setup, people);
t('the agreed scores start from each criterion\'s average', agreed[0].join() === '4,3' && agreed[1].join() === '3,3', agreed.map(x => x.join()).join('|'));
const rank = T.ranking(setup, agreed);
t('the ranking orders features by their agreed score', rank.map(x => x.name).join() === 'Bulk export,Mobile app,SSO' || rank[0].score >= rank[1].score, rank.map(x => x.name + ' ' + x.score).join());
t('equal scores share a rank', T.ranking(setup, [[3, 3], [3, 3], [5, 1]]).map(x => x.rank).join() === '1,2,2');
const sc = T.toScorecard(setup, agreed);
t('the result becomes a normal scorecard', sc.features.length === 3 && sc.features[0].scores.join() === '4,3' && sc.criteria[1].cost === true && sc.method === 'weighted');
t('stored agreed scores work too', T.ranking(setup, ['43', '33', '21'])[0].score === T.ranking(setup, [[4, 3], [3, 3], [2, 1]])[0].score);
t('nobody finished: the starting point is the middle', T.consensus(setup, [])[0].join() === '3,3');

console.log('--- links ---');
const id = T.newId();
t('a session id is 20 letters and digits', /^[A-Za-z0-9]{20}$/.test(id));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
