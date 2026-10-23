// Tests for merge-core.js (combining two learning accounts).
// Run:  node --experimental-default-type=module tests/merge-core.test.mjs
import '../merge-core.js';

const M = globalThis.MergeCore;
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const J = (v) => JSON.stringify(v);

const work = {
  courses: {
    'discovery-novice': { completed: [1, 2], reflections: { '1': 'Work note', '2': '' }, updatedAt: '2026-03-01T00:00:00.000Z', lastLesson: 2 },
    'strategy-novice': { completed: [1], updatedAt: '2026-02-01T00:00:00.000Z' }
  },
  assessmentResult: { tier: 'Some Experience', overallPct: 55, submittedAt: '2026-01-10T00:00:00.000Z', firstSubmittedAt: '2026-01-10T00:00:00.000Z', firstOverallPct: 55, firstTier: 'Some Experience' },
  badges: { account: '2026-01-05T00:00:00.000Z', firstLesson: '2026-02-01T00:00:00.000Z' },
  activeLog: { '2026-03-01': 1, '2026-03-02': 1 },
  lessonLog: { '2026-03-01': 2 },
  totalActiveMs: 1000,
  profile: { company: 'Acme', jobTitle: '', phone: '555' },
  goals: { weeklyLessons: 3 },
  orgIds: ['orgA'],
  agreedToTermsAt: '2026-01-05T00:00:00.000Z'
};
const home = {
  courses: {
    'discovery-novice': { completed: [2, 3, 4], reflections: { '2': 'Home note', '3': 'Another' }, updatedAt: '2026-04-01T00:00:00.000Z', lastLesson: 4 },
    'execution-novice': { completed: [1, 2, 3], updatedAt: '2026-04-02T00:00:00.000Z' }
  },
  assessmentResult: { tier: 'Advanced Experience', overallPct: 82, submittedAt: '2026-04-05T00:00:00.000Z', firstSubmittedAt: '2025-12-01T00:00:00.000Z', firstOverallPct: 40, firstTier: 'Little Experience' },
  badges: { account: '2025-12-01T00:00:00.000Z', assessed: '2025-12-01T00:00:00.000Z' },
  activeLog: { '2026-03-01': 1, '2026-04-01': 1 },
  lessonLog: { '2026-03-01': 1, '2026-04-01': 3 },
  totalActiveMs: 500,
  profile: { company: 'Home Co', jobTitle: 'Senior PM', photo: 'data:x' },
  goals: { weeklyLessons: 5 },
  notify: { checkin: 'weekly' },
  agreedToTermsAt: '2025-12-01T00:00:00.000Z',
  hasSeenWelcome: true
};

const c = M.combine(work, home);
const dn = c.courses['discovery-novice'];
t('every lesson finished in either account is kept, once each', J(dn.completed) === '[1,2,3,4]', J(dn.completed));
t('courses only one account started are kept', J(c.courses['strategy-novice'].completed) === '[1]' && J(c.courses['execution-novice'].completed) === '[1,2,3]');
t('notes: the main account\'s, the other\'s where the main one has none', dn.reflections['1'] === 'Work note' && dn.reflections['2'] === 'Home note' && dn.reflections['3'] === 'Another', J(dn.reflections));
t('the course keeps the newest update and its last lesson', dn.updatedAt === '2026-04-01T00:00:00.000Z' && dn.lastLesson === 4);
t('the most recent assessment is the one kept', c.assessmentResult.tier === 'Advanced Experience' && c.assessmentResult.overallPct === 82);
t('the first-ever attempt comes from whichever took it first', c.assessmentResult.firstSubmittedAt === '2025-12-01T00:00:00.000Z' && c.assessmentResult.firstOverallPct === 40 && c.assessmentResult.firstTier === 'Little Experience');
t('badges from both, each with its earliest date', c.badges.account === '2025-12-01T00:00:00.000Z' && c.badges.firstLesson && c.badges.assessed, J(c.badges));
t('every active day from both', J(Object.keys(c.activeLog).sort()) === '["2026-03-01","2026-03-02","2026-04-01"]');
t('lessons on the same day are added together', c.lessonLog['2026-03-01'] === 3 && c.lessonLog['2026-04-01'] === 3);
t('time spent is added together', c.totalActiveMs === 1500);
t('profile: the main account\'s, blanks filled from the other', c.profile.company === 'Acme' && c.profile.jobTitle === 'Senior PM' && c.profile.phone === '555' && c.profile.photo === 'data:x', J(c.profile));
t('settings: the main account\'s goals, the other\'s where the main has none', c.goals.weeklyLessons === 3 && c.notify.checkin === 'weekly');
t('the company list stays the main account\'s', J(c.orgIds) === '["orgA"]');
t('agreed to terms: the earliest; welcome seen if either saw it', c.agreedToTermsAt === '2025-12-01T00:00:00.000Z' && c.hasSeenWelcome === true);

const r = M.combine(home, work);
t('the other way round, the newest assessment still wins', r.assessmentResult.tier === 'Advanced Experience');
t('and the main account\'s profile comes first', r.profile.company === 'Home Co' && r.profile.phone === '555');

const e = M.combine({}, { courses: { x: { completed: [1] } } });
t('an empty main account takes everything from the other', J(e.courses.x.completed) === '[1]' && !('assessmentResult' in e));
t('one assessment only: that one is kept', M.combine({ assessmentResult: { tier: 'A', submittedAt: '2026-01-01' } }, {}).assessmentResult.tier === 'A');
t('nothing to combine gives an empty record with no courses', J(M.combine(null, undefined)) === '{"courses":{}}');
t('the inputs are not changed', J(work.courses['discovery-novice'].completed) === '[1,2]' && work.profile.jobTitle === '');

t('votes to move: tools only the other voted for, once each', J(M.votesToMove(['t1'], ['t1', 't2', 't2', 't3'])) === '["t2","t3"]');
t('no votes to move when there are none', J(M.votesToMove(null, undefined)) === '[]');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
