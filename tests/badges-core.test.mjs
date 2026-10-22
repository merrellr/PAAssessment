// Tests for badges-core.js (My badges).
// Run:  node --experimental-default-type=module tests/badges-core.test.mjs
import '../company-core.js';
import '../notify-core.js';
import '../badges-core.js';

const C = globalThis.CompanyCore;
const B = globalThis.BadgesCore;
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const NOW = Date.parse('2026-10-22T16:00:00Z');
const cat = (v) => ({ discovery: v, strategy: v, prioritization: v, execution: v, stakeholder: v, aiIndividual: v, aiOrg: v });
const full = (id) => ({ completed: Array.from({ length: C.LESSON_COUNTS[id] }, (_, i) => i + 1) });
const st = (progress, assessment) => B.stats({ progress: progress || {}, assessment: assessment === undefined ? null : assessment, nowMs: NOW, offsetMin: 0 });
const ev = (s, earned) => B.evaluate(s, earned);
const byId = (list, id) => list.filter(b => b.id === id)[0];

/* ---------------- the list */
t('every badge has a known group, metric, icon and a positive goal', B.BADGES.every(b => B.GROUPS.some(g => g[0] === b.group) && b.goal > 0 && b.title && b.text && b.icon));
t('badge ids are unique', new Set(B.BADGES.map(b => b.id)).size === B.BADGES.length);
t('the ones asked for are there: 7, 14 and 30 active days, 1, 5 and 10 courses, Graduated to Advanced',
  ['active7', 'active14', 'active30', 'course1', 'course5', 'course10', 'graduate', 'account'].every(id => B.BADGES.some(b => b.id === id)));
t('the all-courses badge matches the real number of courses', byId(B.BADGES, 'courseAll').goal === Object.keys(C.LESSON_COUNTS).length);

/* ---------------- a brand-new account */
{
  const list = ev(st({}));
  t('a new account has only "Welcome aboard"', list.filter(b => b.have).map(b => b.id).join() === 'account');
  t('locked badges show 0% progress', byId(list, 'active7').pct === 0 && !byId(list, 'active7').have);
  t('summary counts earned and total', B.summary(list).have === 1 && B.summary(list).total === B.BADGES.length);
}

/* ---------------- activity */
{
  let log = {};
  for (let i = 0; i < 5; i++) log = B.logActive(log, NOW - i * 86400000, 0);
  log = B.logActive(log, NOW, 0);   // same day twice counts once
  const s = st({ activeLog: log, lessonLog: { '2026-09-01': 1, '2026-10-22': 1 } });
  t('active days count each day once, visits and lesson days together', s.activeDays === 6, s.activeDays);
  const a7 = byId(ev(s), 'active7');
  t('7 days: 6 of 7 shows the progress', !a7.have && a7.value === 6 && a7.pct === 86);
  const old = B.logActive({ '2024-01-01': 1, junk: 1 }, NOW, 0);
  t('the activity log drops days older than about a year and junk', !('2024-01-01' in old) && !('junk' in old) && old['2026-10-22'] === 1);
}

/* ---------------- weekly goal */
{
  // goal 2: met in the weeks of Oct 5, Oct 12 and Oct 19 (3 in a row), and in early September
  const lessonLog = { '2026-09-01': 2, '2026-10-05': 1, '2026-10-07': 1, '2026-10-12': 3, '2026-10-20': 2, '2026-09-15': 1 };
  const s = st({ goals: { weeklyLessons: 2 }, lessonLog });
  t('weeks with the goal met are counted', s.goalWeeks === 4, s.goalWeeks);
  t('the longest run of weeks in a row is found', s.goalStreak === 3, s.goalStreak);
  const l = ev(s);
  t('goal badges follow', byId(l, 'goal1').have && byId(l, 'goal4').have && !byId(l, 'streak4').have && byId(l, 'streak4').value === 3);
  t('week of: Monday', B.weekOf('2026-10-25') === '2026-10-19' && B.weekOf('2026-10-19') === '2026-10-19');
}

/* ---------------- lessons, courses, notes, profile */
{
  const courses = { 'discovery-novice': Object.assign(full('discovery-novice'), { reflections: { 1: 'my thought', 2: '  ' } }), 'strategy-novice': { completed: [1, 2] }, 'nope-course': { completed: [1, 2, 3] } };
  const s = st({ courses, profile: { company: 'Acme', jobTitle: 'PM' } });
  t('lessons count only real lessons', s.lessons === C.LESSON_COUNTS['discovery-novice'] + 2, s.lessons);
  t('a course counts when every lesson is done', s.courses === 1);
  t('blank notes do not count', s.notes === 1);
  t('profile complete needs company and role', s.profile === 1 && st({ profile: { company: 'Acme' } }).profile === 0);
  const l = ev(s);
  t('first lesson, first course, first note and profile badges', ['lesson1', 'course1', 'note1', 'profile'].every(id => byId(l, id).have) && !byId(l, 'course5').have && byId(l, 'course5').value === 1);
}

/* ---------------- assessment and mastery */
{
  const adv = { overallPct: 82, tier: 'Advanced Experience', categoryPct: Object.assign(cat(60), { discovery: 90 }) };
  const s = st({}, adv);
  t('graduated to Advanced from the overall score', s.advancedOverall === 1 && s.assessed === 1);
  t('advanced areas are counted', s.areasAdvanced === 1);
  const l = ev(s);
  t('graduate and advanced-in-an-area badges', byId(l, 'graduate').have && byId(l, 'adv1').have && !byId(l, 'adv7').have);
  // plan: everything above the tested level in each area
  const a = { overallPct: 90, tier: 'Advanced Experience', categoryPct: cat(90) };
  const courses = {};
  C.assignedCourses(a).forEach(c => { courses[c.id] = full(c.id); });
  const s2 = st({ courses }, a);
  t('a finished plan finishes every area in it', s2.planDone === 1 && s2.areasDone === 7 && s2.areasAdvanced === 7);
  t('no assessment: no plan, no mastery', st({}).planDone === 0 && st({}).areasAdvanced === 0 && st({}).advancedOverall === 0);
}

/* ---------------- earned badges stay earned */
{
  const s = st({});
  const l = ev(s, { active7: '2026-10-01T00:00:00.000Z' });
  t('a stored badge stays earned even if the numbers drop', byId(l, 'active7').have && byId(l, 'active7').earnedAt === '2026-10-01T00:00:00.000Z' && byId(l, 'active7').pct === 100);
  const fresh = B.newlyEarned(ev(st({ courses: { 'discovery-novice': full('discovery-novice') } }), { account: 'x' }), NOW);
  t('newly earned lists only what is not stored yet, with today\'s date', Object.keys(fresh).sort().join() === 'course1,lesson1' && fresh.course1 === new Date(NOW).toISOString(), Object.keys(fresh).join());
  const next = B.upNext(ev(st({ activeLog: B.logActive({}, NOW, 0) })), 2);
  t('up next picks the closest unearned badges', next.length === 2 && next.every(b => !b.have) && next[0].pct >= next[1].pct);
}

/* ---------------- drawing */
{
  const get = (id, have) => Object.assign({}, byId(B.BADGES, id), { have: have, pct: have ? 100 : 25 });
  const grad = B.medalSvg(get('graduate', true));
  t('an earned medal has a metal rim, an enamel face in its own colour and a gloss', /bd-gold bd-shape-star is-on/.test(grad) && /id="bd-graduate-rim"/.test(grad) && /stop-color="#12305E"/.test(grad) && /-gloss\)/.test(grad));
  t('it shows its icon, embossed with a shadow', (grad.match(/scale\(1.6\)/g) || []).length === 2 && /class="bd-icon"/.test(grad));
  const days = B.medalSvg(get('active30', true), 72);
  t('counting badges show their number and unit on a hexagon', /bd-shape-hexagon/.test(days) && />30<\/text>/.test(days) && />DAYS<\/text>/.test(days));
  t('a small medal leaves the number off', !/<text/.test(B.medalSvg(get('active30', true), 22)));
  const off = B.medalSvg(get('lessons50', false));
  t('a locked medal is the same shape, flat, with no colours of its own', /bd-shape-square/.test(off) && !/is-on/.test(off) && !/<defs>/.test(off) && /bd-l-face/.test(off) && />50<\/text>/.test(off));
  t('every group has its own shape', new Set(B.GROUPS.map(g => g[2])).size === B.GROUPS.length);
  t('every badge has an enamel colour', B.BADGES.every(b => b.hue && /^#[0-9A-F]{6}$/i.test(b.hue[0]) && /^#[0-9A-F]{6}$/i.test(b.hue[1])));
  t('an unknown icon falls back to a star', /m12 3.5/.test(B.medalSvg({ id: 'x', group: 'start', have: false, pct: 0, metal: 'silver', icon: 'nope' })));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
