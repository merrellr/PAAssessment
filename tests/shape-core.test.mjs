// Tests for shape-core.js ("My shape").   Run:  node tests/shape-core.test.mjs
import fs from 'fs';
globalThis.window = globalThis;
for (const f of ['company-core.js', 'roles-core.js', 'coach-bank.js', 'coach-charts.js', 'competencies-core.js', 'shape-core.js']) eval(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const S = globalThis.ShapeCore, K = globalThis.CompetencyCore, R = globalThis.RolesCore, B = globalThis.CoachBank;
const QS = B.questions.concat(globalThis.CoachCharts.questions);
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
const pct = { discovery: 70, strategy: 40, prioritization: 60, execution: 80, stakeholder: 55, aiIndividual: 30, aiOrg: 45 };
const get = (lv, k) => lv.find(c => c.key === k);

let lv = S.levels({ pct: null, log: [], progress: {}, questions: QS });
t('nothing yet: every competency unknown', lv.length === 28 && lv.every(c => c.level === 0 && c.strength === 'none'));
lv = S.levels({ pct, log: [], progress: {}, questions: QS });
t('the skill check sets the starting level for an area\'s competencies (70% → Lots of, 3)', get(lv, 'd.framing').level === 3 && get(lv, 'd.research').level === 3 && get(lv, 's.vision').level === 2, get(lv, 'd.framing').level);
t('skill check alone is thin evidence', get(lv, 'd.framing').strength === 'thin');

// practice: Strategy questions tagged to roadmaps, right at Moderate (2) and Lots of (3)
const roadQs = QS.filter(q => K.forQuestion(q).includes('s.roadmap') && (q.tier === 'experienced')).slice(0, 6);
const log = roadQs.map((q, i) => ({ d: q.d, id: q.id, t: q.t, ok: true, at: i, src: 'practice' }));
lv = S.levels({ pct, log, progress: {}, questions: QS });
t('right answers at a higher level raise the competency (2 → toward 3)', get(lv, 's.roadmap').level > 2.5 && get(lv, 's.roadmap').level <= 3 && get(lv, 's.gtm').level === 2, get(lv, 's.roadmap').level);
t('more evidence, stronger', get(lv, 's.roadmap').strength === 'some' || get(lv, 's.roadmap').strength === 'strong');
const easyQs = QS.filter(q => K.forQuestion(q).includes('s.roadmap') && q.tier === 'novice').slice(0, 6);
const missLog = easyQs.map((q, i) => ({ d: q.d, id: q.id, t: q.t, ok: false, at: i, src: 'practice' }));
t('a miss counts one level below the question: missing a Lots-of question is still Moderate', S.levels({ pct, log: roadQs.map((q, i) => ({ id: q.id, ok: false, at: i })), progress: {}, questions: QS }).find(c => c.key === 's.roadmap').level === 2);
t('misses on Limited-level questions pull it down', S.levels({ pct, log: missLog, progress: {}, questions: QS }).find(c => c.key === 's.roadmap').level < 2);
t('answers to questions that are not in the bank are ignored', S.levels({ pct, log: [{ id: 'nope', ok: true }], progress: {}, questions: QS }).find(c => c.key === 's.roadmap').level === 2);

// lessons finished set a floor
lv = S.levels({ pct, log: [], progress: { courses: { 'aiIndividual-experienced': { completed: [1, 4] } } }, questions: QS });
t('finishing a lesson at Lots of (3) means at least 2.5 in what it builds', get(lv, 'ai.check').level === 2.5 && get(lv, 'ai.tools').level === 2);

// a role
const spm = R.ROLES.find(r => r.id === 'spm'), targets = S.targetsFor(spm.targets);
t('a role\'s competency targets come from its area targets', targets['d.framing'] === spm.targets.discovery && Object.keys(targets).length === 28);
lv = S.levels({ pct, log: [], progress: {}, questions: QS });
const cmp = S.compare(lv, targets, {}, B);
t('compare: met, close and below against the role', cmp.total === 28 && cmp.rows.find(r => r.key === 'e.plan').status === 'met' && cmp.rows.find(r => r.key === 'ai.tools').status === 'below');
t('top 3 gaps, biggest first, each with the next lesson that builds it', cmp.top.length === 3 && cmp.top[0].gap >= cmp.top[2].gap && cmp.top.every(g => g.next && /^\/lesson\?course=/.test(g.next.href) && K.forLesson(g.next.course, g.next.lesson).includes(g.key)), JSON.stringify(cmp.top.map(g => [g.key, g.gap, g.next && g.next.course])));
t('the next lesson is not one already done', (() => { const g = cmp.top[0]; const done = { courses: { [g.next.course]: { completed: [g.next.lesson] } } }; const again = S.compare(lv, targets, done, B).top.find(x => x.key === g.key); return !again.next || again.next.course + again.next.lesson !== g.next.course + g.next.lesson; })());

// place me
t('place me: too little to go on without a skill check', S.place(S.levels({ pct: null, log: [], progress: {}, questions: QS }), R.ROLES) === null);
const strong = { discovery: 90, strategy: 90, prioritization: 90, execution: 90, stakeholder: 90, aiIndividual: 90, aiOrg: 90 };
const pl = S.place(S.levels({ pct: strong, log: [], progress: {}, questions: QS }), R.ROLES);
t('place me: an all-advanced shape is closest to a senior role', pl && ['gpm', 'head'].includes(pl.role.id), pl && pl.role.id);
const early = { discovery: 30, strategy: 10, prioritization: 30, execution: 30, stakeholder: 30, aiIndividual: 30, aiOrg: 10 };
t('place me: an early shape is closest to Associate PM', S.place(S.levels({ pct: early, log: [], progress: {}, questions: QS }), R.ROLES).role.id === 'apm');
t('area averages', S.areaAverages(S.levels({ pct, log: [], progress: {}, questions: QS })).discovery === 3);

{ // with every Strategy lesson done, go-to-market's next lesson comes from another area that builds it
  const all = {}; Object.keys(K.LESSONS).filter(c => c.startsWith('strategy-')).forEach(c => { all[c] = { completed: K.LESSONS[c].map((_, i) => i + 1) }; });
  const gtm = S.compare(S.levels({ pct, log: [], progress: { courses: all }, questions: QS }), S.targetsFor({ strategy: 4 }), { courses: all }, B).rows.find(r => r.key === 's.gtm');
  const next = S.compare(S.levels({ pct, log: [], progress: { courses: all }, questions: QS }), S.targetsFor({ strategy: 4 }), { courses: all }, B).top.concat([]).find(g => g.key === 's.gtm');
  t('the next lesson can come from another area that builds the competency', !next || (next.next && !next.next.course.startsWith('strategy-') && K.forLesson(next.next.course, next.next.lesson).includes('s.gtm')), JSON.stringify(next && next.next));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
