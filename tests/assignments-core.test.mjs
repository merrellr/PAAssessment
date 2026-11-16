// Tests for assignments-core.js (team assignments: a company gives everyone a course to finish by a date).
// Run:  node --experimental-default-type=module tests/assignments-core.test.mjs
import '../company-core.js';
import '../assignments-core.js';
const A = globalThis.AssignmentsCore, C = globalThis.CompanyCore;
const K = C.LESSON_COUNTS;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
const TODAY = '2026-11-16';

console.log('--- the list is always safe ---');
{
  const raw = [
    { id: 'a1', course: 'discovery-novice', due: '2026-12-15', note: '  Finish  before  planning ', assignedAt: TODAY },
    { id: 'a2', course: 'discovery-novice', due: '2026-12-20' },            // the same course twice: the first wins
    { id: 'a3', course: 'nope-novice' },                                      // unknown course
    { id: 'x<script>', course: 'strategy-novice', due: '2026-02-30' },        // bad id and an impossible date
    null, 'text'
  ];
  const n = A.normalize(raw, K);
  t('unknown courses, repeats and junk are dropped', n.length === 2 && n[0].course === 'discovery-novice' && n[1].course === 'strategy-novice', JSON.stringify(n));
  t('notes are tidied; impossible dates become no date; a bad id is replaced', n[0].note === 'Finish before planning' && n[1].due === '' && n[1].id === 'astrategy-novice');
  t('never more than ' + A.MAX, A.normalize(Object.keys(K).map((c, i) => ({ id: 'id' + i + 'xx', course: c })), K).length === A.MAX);
  t('not a list gives an empty list', A.normalize(null, K).length === 0 && A.normalize({}, K).length === 0);
}

console.log('--- adding and removing ---');
{
  let r = A.add([], { course: 'execution-novice', due: '2026-12-01', note: 'Q1 kickoff' }, K, TODAY, 'abc12345');
  t('an assignment is added with today as its date', r.items && r.items.length === 1 && r.items[0].assignedAt === TODAY && r.items[0].id === 'abc12345');
  t('the same course twice is refused', /already assigned/.test(A.add(r.items, { course: 'execution-novice' }, K, TODAY, 'zz99zz99').error));
  t('a course is required', /Choose a course/.test(A.add([], { course: '' }, K, TODAY, 'q1q1q1q1').error));
  t('a past due date is refused; no date is fine', /past/.test(A.add([], { course: 'strategy-novice', due: '2026-11-15' }, K, TODAY, 'q2q2q2q2').error)
    && A.add([], { course: 'strategy-novice', due: '' }, K, TODAY, 'q3q3q3q3').items[0].due === '');
  t('a due date of today is allowed', !!A.add([], { course: 'strategy-novice', due: TODAY }, K, TODAY, 'q4q4q4q4').items);
  const full = Object.keys(K).slice(0, A.MAX).map((c, i) => ({ id: 'full' + i, course: c }));
  t('no more than ' + A.MAX + ' at once', /up to 20/.test(A.add(full, { course: Object.keys(K)[A.MAX] }, K, TODAY, 'q5q5q5q5').error));
  t('remove takes one out', A.remove(r.items, 'abc12345', K).length === 0);
  t('new ids are short and safe', /^a[a-z0-9]{9}$/.test(A.newId()));
}

console.log('--- due dates ---');
t('days between', A.daysBetween('2026-11-16', '2026-12-01') === 15 && A.daysBetween('2026-11-16', '2026-11-14') === -2);
t('the labels', A.dueInfo('2026-12-15', TODAY).label === 'Due Dec 15' && A.dueInfo(TODAY, TODAY).label === 'Due today'
  && A.dueInfo('2026-11-17', TODAY).label === 'Due tomorrow' && A.dueInfo('2026-11-13', TODAY).label === '3 days overdue'
  && A.dueInfo('2026-11-15', TODAY).label === '1 day overdue' && A.dueInfo('', TODAY).label === 'No due date');
t('soon means within a week', A.dueInfo('2026-11-23', TODAY).soon && !A.dueInfo('2026-11-24', TODAY).soon);
t('sorted: soonest first, no date last', A.sorted([{ due: '' }, { due: '2026-12-31' }, { due: '2026-12-01' }]).map(x => x.due).join() === '2026-12-01,2026-12-31,');

console.log('--- a learner\'s own card ---');
{
  const catalog = { 'discovery-novice': { title: 'Discovery Basics', lessons: [1, 2, 3, 4, 5].map(id => ({ id })) },
    'strategy-novice': { title: 'Strategy Basics', lessons: [1, 2, 3, 4, 5].map(id => ({ id })) },
    'execution-novice': { title: 'Execution Basics', lessons: [1, 2, 3, 4, 5].map(id => ({ id })) } };
  const items = [{ id: 'x1', course: 'discovery-novice', due: '2026-11-10' }, { id: 'x2', course: 'strategy-novice', due: '' },
    { id: 'x3', course: 'execution-novice', due: '2026-11-20' }];
  const progress = { courses: { 'discovery-novice': { completed: [1, 2, 3, 4, 5] }, 'execution-novice': { completed: [1, 3, 9] } } };
  const cards = A.forLearner(items, progress, catalog, K, TODAY);
  t('to-do first (soonest due), finished last', cards.map(c => c.course).join() === 'execution-novice,strategy-novice,discovery-novice', cards.map(c => c.course).join());
  t('progress counts only real lessons, and the next lesson is the first not done', cards[0].done === 2 && cards[0].next === 2 && cards[0].pct === 40);
  t('a finished course says so and is never overdue', cards[2].finished && cards[2].dueLabel === 'Finished' && !cards[2].overdue);
  t('due soon is flagged', cards[0].soon && cards[0].dueLabel === 'Due Nov 20');
  t('nothing assigned: no cards', A.forLearner([], progress, catalog, K, TODAY).length === 0);
}

console.log('--- the team\'s progress, for the admin ---');
{
  const item = { id: 'x1', course: 'discovery-novice', due: '2026-11-10' };
  const people = [
    { name: 'Ana', email: 'ana@x.co', courses: { 'discovery-novice': { completed: [1, 2, 3, 4, 5] } } },
    { name: 'Ben', email: 'ben@x.co', courses: { 'discovery-novice': { completed: [1, 2] } } },
    { name: 'Cy', email: 'cy@x.co', courses: {} },
    { name: '', email: 'dee@x.co' }
  ];
  const p = A.teamProgress(item, people, K, TODAY);
  t('finished, in progress and not started are counted', p.finished === 1 && p.started === 1 && p.notStarted === 2 && p.people === 4 && p.pct === 25);
  t('who is behind, furthest behind first, with a name or email', p.behind.map(x => x.name).join() === 'Cy,dee@x.co,Ben' && p.behind[2].done === 2 && p.behind[2].total === 5, p.behind.map(x => x.name).join());
  t('past the due date with people left: overdue', p.overdue && p.dueLabel === '6 days overdue');
  const all = A.teamProgress(item, [people[0]], K, TODAY);
  t('everyone finished: never overdue', !all.overdue && all.dueLabel === 'Everyone has finished' && all.pct === 100);
  t('no members yet: nothing to count', A.teamProgress(item, [], K, TODAY).pct === 0);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
