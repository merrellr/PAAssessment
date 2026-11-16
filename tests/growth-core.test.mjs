// Tests for growth-core.js (Home: "Your next best step" and "My growth").
// Run:  node --experimental-default-type=module tests/growth-core.test.mjs
import '../growth-core.js';
const G = globalThis.GrowthCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
const NOW = Date.parse('2026-11-16T12:00:00Z');

console.log('--- the next best step ---');
{
  const resume = { courseId: 'discovery-novice', title: 'Discovery', done: 2, total: 5, pct: 40, next: 3 };
  const assigned = [
    { course: 'strategy-novice', title: 'Strategy', done: 0, total: 5, pct: 0, next: 1, finished: false, overdue: true, soon: false, due: '2026-11-10', dueLabel: '6 days overdue' },
    { course: 'discovery-novice', title: 'Discovery', done: 2, total: 5, pct: 40, next: 3, finished: false, overdue: false, soon: false, due: '', dueLabel: 'No due date' },
    { course: 'execution-novice', title: 'Execution', done: 5, total: 5, pct: 100, next: 5, finished: true, overdue: false, soon: false, due: '', dueLabel: 'Finished' }];
  const upNext = [{ courseId: 'aiOrg-novice', title: 'AI Org', done: 0, total: 5, pct: 0, next: 1 }, { courseId: 'strategy-novice', title: 'Strategy', done: 0, total: 5, pct: 0, next: 1 }];
  const s = G.nextSteps(resume, assigned, upNext);
  t('an overdue company course comes first, then the one in progress, then recommendations', s.map(x => x.courseId).join() === 'strategy-novice,discovery-novice,aiOrg-novice', s.map(x => x.courseId).join());
  t('each course appears once, and finished ones never', s.length === 3 && !s.some(x => x.courseId === 'execution-novice'));
  t('each step says why', /6 days overdue/.test(s[0].why) && /40% through/.test(s[1].why) && /assessment/.test(s[2].why), s.map(x => x.why).join(' | '));
  t('with something in progress, "after that" is still shown (the second step)', s.length >= 2 && s[1].kind === 'resume');
  const plain = G.nextSteps(resume, [], upNext);
  t('without a company: the course in progress, then what is recommended', plain.map(x => x.kind).join() === 'resume,recommended,recommended');
  t('nothing at all: no steps', G.nextSteps(null, [], []).length === 0);
  t('a company course that is not urgent comes after the one in progress',
    G.nextSteps(resume, [assigned[1], { course: 'x-novice', title: 'X', done: 0, total: 5, pct: 0, next: 1, finished: false, overdue: false, soon: false, due: '2026-12-20', dueLabel: 'Due Dec 20' }], []).map(x => x.courseId).join() === 'discovery-novice,x-novice');
}

console.log('--- my growth ---');
{
  const D = [['discovery', 'Discovery'], ['strategy', 'Strategy'], ['aiOrg', 'AI Org']];
  const a1 = { submittedAt: '2026-08-01T10:00:00Z', overallPct: 38, categoryPct: { discovery: 40, strategy: 50, aiOrg: 20 } };
  const a2 = { submittedAt: '2026-10-01T10:00:00Z', overallPct: 47, categoryPct: { discovery: 55, strategy: 52, aiOrg: 30 } };
  const a3 = { submittedAt: '2026-11-01T10:00:00Z', overallPct: 55, categoryPct: { discovery: 65, strategy: 50, aiOrg: 38 } };
  const partial = { submittedAt: '2026-06-01T10:00:00Z', overallPct: 30, partial: true };
  const g = G.growth([partial, a1, a2, a3], D, NOW);
  t('first full attempt against the latest', g.state === 'two' && g.attempts === 3 && g.overallThen === 38 && g.overallNow === 55);
  t('areas sorted by how much they grew', g.areas.map(a => a.key + ':' + a.delta).join() === 'discovery:25,aiOrg:18,strategy:0', g.areas.map(a => a.key + ':' + a.delta).join());
  t('how many areas grew, the biggest jump, and the remaining gap', g.grew === 2 && g.biggest.key === 'discovery' && g.gap.key === 'aiOrg');
  t('every attempt is a point for the over-time view', g.areas[0].series.length === 3 && g.areas[0].series[1].v === 55);
  t('the latest attempt was 15 days ago: no retake yet, due in 75 days', !g.retake.due && g.retake.inDays === 75, JSON.stringify(g.retake));
  const one = G.growth([a1], D, NOW);
  t('one attempt: the starting point, in display order, no biggest jump', one.state === 'one' && one.areas.map(a => a.key).join() === 'discovery,strategy,aiOrg' && one.biggest === null);
  t('107 days since the only attempt: a retake is due', one.retake.due && one.retake.daysSince === 107);
  t('no area scores at all: nothing to show', G.growth([partial], D, NOW).state === 'none' && G.growth([], D, NOW).state === 'none');
  t('no growth anywhere: no "biggest jump"', G.growth([a1, Object.assign({}, a1, { submittedAt: '2026-09-01T00:00:00Z' })], D, NOW).biggest === null);
  t('month labels', G.monthLabel('2026-08-01T10:00:00Z') === 'Aug 2026' && G.monthLabel('') === '');
  t('spark points run left to right inside the box', G.sparkPoints([{ v: 0 }, { v: 100 }], 200, 56) === '0.0,52.0 200.0,4.0' && G.sparkPoints([{ v: 50 }], 200, 56) === '100.0,28.0');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
