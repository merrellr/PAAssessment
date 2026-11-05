// Tests for roles-core.js (role targets).   Run:  node --experimental-default-type=module tests/roles-core.test.mjs
import '../company-core.js';
import '../notify-core.js';
import '../badges-core.js';
import '../roles-core.js';
const R = globalThis.RolesCore, B = globalThis.BadgesCore, C = globalThis.CompanyCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

t('every standard role has a target from 1 to 4 in all seven areas', R.ROLES.length >= 5 && R.ROLES.every(r => R.AREAS.every(k => r.targets[k] >= 1 && r.targets[k] <= 4)) && new Set(R.ROLES.map(r => r.id)).size === R.ROLES.length);
t('the ladder rises: a Senior PM aims at least as high as a PM in every area', R.AREAS.every(k => R.ROLES.find(r => r.id === 'spm').targets[k] >= R.ROLES.find(r => r.id === 'pm').targets[k]));

// a company changes, hides and adds roles
const list = R.rolesFor({ pm: { targets: { strategy: 3, discovery: 9 } }, po: { hidden: true }, 'data-pm': { title: 'Data PM', targets: { aiOrg: 3, execution: 2 } }, 'Bad Id': { title: 'x' }, empty: { targets: {} } });
const pm = R.roleById(list, 'pm');
t('a company can raise a standard role\'s target; out-of-range values are ignored', pm.targets.strategy === 3 && pm.targets.discovery === 3 && pm.changed && pm.standard);
t('a company can hide a standard role', !R.roleById(list, 'po'));
t('a company can add its own role (well-formed ids with a title only)', R.roleById(list, 'data-pm').title === 'Data PM' && R.roleById(list, 'data-pm').group === 'Your company' && !R.roleById(list, 'Bad Id') && !R.roleById(list, 'empty'));
t('no company changes: the standard list', R.rolesFor(null).length === R.ROLES.length && R.rolesFor(undefined).every(r => !r.changed));

// targets: the role, raised by personal ones
const tg = R.targetsFor(R.roleById(R.rolesFor(), 'pm'), { strategy: 4, discovery: 1, aiOrg: 2, nope: 4 });
t('a personal target raises the role\'s; a lower one changes nothing', tg.strategy.target === 4 && tg.strategy.source === 'personal' && tg.discovery.target === 3 && tg.discovery.source === 'role' && tg.aiOrg.source === 'both' && !tg.nope);
const solo = R.targetsFor(null, { execution: 2 });
t('without a role, personal targets alone', Object.keys(solo).join() === 'execution' && solo.execution.source === 'personal');

// levels: assessment OR finished course
const pct = { discovery: 80, strategy: 30, prioritization: 10, execution: 55, stakeholder: 60, aiIndividual: 20, aiOrg: 40 };
const done = (id) => { const o = {}; o[id] = { completed: Array.from({ length: C.LESSON_COUNTS[id] }, (_, i) => i + 1) }; return o; };
const lv = R.levels({ categoryPct: pct }, done('prioritization-experienced'));
t('the assessment places each area at a level', lv.discovery.level === 4 && lv.strategy.level === 2 && lv.execution.level === 3 && lv.discovery.by === 'assessment');
t('finishing a course counts as reaching its level', lv.prioritization.level === 3 && lv.prioritization.by === 'course' && lv.prioritization.fromAssessment === 1);
t('nothing known yet: level 0', R.levels(null, {}).strategy.level === 0);

const ev = R.evaluate(R.targetsFor(R.roleById(R.rolesFor(), 'pm'), {}), lv);
const row = (k) => ev.rows.find(r => r.area === k);
t('above, met and below against a PM\'s targets', row('discovery').status === 'above' && row('execution').status === 'met' && row('prioritization').status === 'met' && row('strategy').status === 'met' && row('aiIndividual').status === 'below', ev.rows.map(r => r.area + ':' + r.status).join(' '));
t('totals for the badges', ev.total === 7 && ev.met === 6 && ev.above === 2 && !ev.roleMet && ev.pct === 86, JSON.stringify({ met: ev.met, above: ev.above }));
t('each row names the course that gets there', row('aiIndividual').course === 'aiIndividual-experienced' && row('aiIndividual').targetLabel === 'Lots of Experience');
t('no assessment and no course: unknown, not "below"', R.evaluate(R.targetsFor(R.roleById(R.rolesFor(), 'apm'), {}), R.levels(null, {})).rows.every(r => r.status === 'unknown'));

// one call for a learner, and the badges it unlocks
const all4 = {}; R.AREAS.forEach(k => { all4[k] = 90; });
const me = R.forLearner({ roleId: 'spm', personal: { aiOrg: 4 }, assessment: { categoryPct: all4 }, courses: {} });
t('everything at Advanced: every target met, the personal one too', me.role.id === 'spm' && me.roleMet && me.met === 7 && me.personalMet === 1 && me.above === 6);
const st = B.stats({ progress: {}, assessment: { categoryPct: all4, overallPct: 90 }, createdMs: 0, nowMs: Date.parse('2026-11-05T12:00:00Z'), offsetMin: 0, targets: me });
const got = B.evaluate(st, {}).filter(b => b.group === 'targets' && b.have).map(b => b.id).sort().join();
t('…which earns every Role targets badge', got === 'above1,above3,personal1,roleReady,target1,target4', got);
const none = B.stats({ progress: {}, assessment: null, createdMs: 0, nowMs: 0, offsetMin: 0 });
t('without targets, the target badges stay unearned', none.targetsMet === 0 && none.roleReady === 0 && none.personalMet === 0);
const noRole = R.forLearner({ roleId: '', personal: { discovery: 1 }, assessment: { categoryPct: all4 }, courses: {} });
t('"Role ready" needs a role, not just personal targets', B.stats({ progress: {}, assessment: null, createdMs: 0, nowMs: 0, offsetMin: 0, targets: noRole }).roleReady === 0 && noRole.personalMet === 1);
t('the Role targets medals have their own shape', /<path/.test(B.medalSvg(Object.assign({}, B.BADGES.find(b => b.id === 'roleReady'), { have: true }), 64)));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
