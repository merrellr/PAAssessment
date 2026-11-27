// Tests for competency-check.js (the 10-minute competency check) and how its answers reach My shape.
// Run:  node tests/competency-check.test.mjs
import fs from 'fs';
globalThis.window = globalThis;
['coach-core.js', 'competencies-core.js', 'shape-core.js', 'competency-check.js'].forEach(f => eval(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8')));
const K = globalThis.CompetencyCore, S = globalThis.ShapeCore, C = globalThis.CoachCore, Q = globalThis.CompetencyCheck.questions;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
const AREAS = ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg'];

t('32 questions with unique ids', Q.length === 32 && new Set(Q.map(q => q.id)).size === 32);
t('every one of the 28 competencies has at least one', K.LIST.every(c => Q.some(q => q.k === c.key)));
t('each question names a real competency, in its own domain', Q.every(q => K.BY[q.k] && K.BY[q.k].area === q.d && AREAS.includes(q.d)));
t('each has a situation, four options, a right answer, a why and a level', Q.every(q => q.q.length > 30 && q.o.length === 4 && q.a >= 0 && q.a < 4 && q.x.length > 30 && ['novice', 'moderate', 'experienced', 'advanced'].includes(q.tier)));
const spread = [0, 0, 0, 0]; Q.forEach(q => spread[q.a]++);
t('the right answer is not always in the same place', spread.every(n => n >= 4), spread.join(','));
t('the right answer is not reliably the longest', Q.filter(q => q.o[q.a].length === Math.max(...q.o.map(o => o.length))).length < Q.length * 0.4);
t('about ten minutes', globalThis.CompetencyCheck.MINUTES === 10);

t('a check question counts for its own competency', JSON.stringify(K.forQuestion(Q[0])) === JSON.stringify([Q[0].k]));
t('an unknown competency counts for nothing', K.forQuestion({ k: 'nope' }).length === 0);
let log = []; Q.forEach(q => { log = C.record(log, { d: q.d, id: q.id, t: q.t, ok: true, src: 'check' }); });
const lv = S.levels({ log, questions: Q });
t('the whole check, all right: every competency known', lv.every(c => c.level > 0), lv.filter(c => !c.level).map(c => c.key).join(','));
t('all right at "Lots of experience": level 3', lv.filter(c => c.answers === 1).every(c => c.level === 3));
t('recent activity names it', C.recentActivity ? /Competency check in/.test(JSON.stringify(C.recentActivity(log.map(e => Object.assign({}, e, { at: Date.now() })), {}))) : true);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
