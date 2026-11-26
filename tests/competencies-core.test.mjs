// Tests for competencies-core.js (the competency model).   Run:  node tests/competencies-core.test.mjs
import fs from 'fs';
import { execFileSync } from 'child_process';
globalThis.window = globalThis;
eval(fs.readFileSync(new URL('../coach-bank.js', import.meta.url), 'utf8'));
eval(fs.readFileSync(new URL('../coach-charts.js', import.meta.url), 'utf8'));
eval(fs.readFileSync(new URL('../competencies-core.js', import.meta.url), 'utf8'));
const K = globalThis.CompetencyCore, B = globalThis.CoachBank, Q = B.questions.concat(globalThis.CoachCharts.questions);
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
const AREAS = ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg'];

t('28 competencies, four in each of the seven areas', K.LIST.length === 28 && AREAS.every(a => K.inArea(a).length === 4));
t('keys are unique, and each has a name, what it is and four level descriptions', new Set(K.LIST.map(c => c.key)).size === 28 && K.LIST.every(c => c.name && c.about && c.levels.length === 4 && c.levels.every(l => l.length > 15)));
const courses = Object.keys(B.lessons);
t('every course in the bank is tagged, lesson for lesson', courses.every(c => K.LESSONS[c] && K.LESSONS[c].length === B.lessons[c].length) && Object.keys(K.LESSONS).length === courses.length,
  courses.filter(c => !K.LESSONS[c] || K.LESSONS[c].length !== B.lessons[c].length).join());
t('every lesson builds one or two known competencies', Object.values(K.LESSONS).every(ls => ls.every(tags => tags.length >= 1 && tags.length <= 2 && tags.every(k => K.BY[k]))));
const lessonsPer = {}, qPer = {};
Object.values(K.LESSONS).forEach(ls => ls.forEach(tags => tags.forEach(k => { lessonsPer[k] = (lessonsPer[k] || 0) + 1; })));
Q.forEach(q => K.forQuestion(q).forEach(k => { qPer[k] = (qPer[k] || 0) + 1; }));
t('every competency is built by at least 3 lessons', K.LIST.every(c => (lessonsPer[c.key] || 0) >= 3), K.LIST.filter(c => (lessonsPer[c.key] || 0) < 3).map(c => c.key + ':' + (lessonsPer[c.key] || 0)).join());
t('every competency has at least 6 practice questions behind it', K.LIST.every(c => (qPer[c.key] || 0) >= 6), K.LIST.filter(c => (qPer[c.key] || 0) < 6).map(c => c.key + ':' + (qPer[c.key] || 0)).join());
t('every practice question maps to a competency', Q.every(q => K.forQuestion(q).length > 0));
let fresh = true;
try { execFileSync('node', [new URL('../tools/build-competency-doc.mjs', import.meta.url).pathname, '--check'], { stdio: 'pipe' }); } catch (e) { fresh = false; }
t('docs/competency-model.md matches competencies-core.js (else run node tools/build-competency-doc.mjs)', fresh);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
