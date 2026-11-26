// Tests for plan-core.js (the Compass study plan).   Run:  node tests/plan-core.test.mjs
import fs from 'fs';
import '../coach-core.js';
globalThis.window = globalThis;
eval(fs.readFileSync(new URL('../coach-bank.js', import.meta.url), 'utf8'));
eval(fs.readFileSync(new URL('../plan-core.js', import.meta.url), 'utf8'));
const P = globalThis.PlanCore, BANK = globalThis.CoachBank;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

const AREAS = { discovery: 'Discovery', strategy: 'Strategy', prioritization: 'Prioritization', execution: 'Execution', stakeholder: 'Stakeholders', aiIndividual: 'AI (you)', aiOrg: 'AI (org)' };
const pct = { discovery: 70, strategy: 40, prioritization: 60, execution: 80, stakeholder: 45, aiIndividual: 30, aiOrg: 65 };
const NOW = new Date(2026, 10, 2, 9).getTime(), DAY = 864e5;
const base = { areas: AREAS, pct, log: [], progress: { courses: {} }, bank: BANK, now: NOW, assessUrl: '/assess' };

// building
let plan = P.build(base, { aim: 'ai', weeks: 4, hours: 2 });
t('4 weeks, starting today', plan.list.length === 4 && plan.start === new Date(2026, 10, 2).getTime() && plan.dated);
t('the aim pulls its areas forward: AI first for "Lead with AI"', plan.list[0].d === 'aiIndividual', plan.list.map(w => w.d).join());
t('"Get promoted" starts with Strategy (needs attention and central to it)', P.build(base, { aim: 'promoted', weeks: 4, hours: 2 }).list[0].d === 'strategy');
t('"Sharpen my skills" follows readiness: the area most in need first', P.build(base, { aim: 'sharpen', weeks: 4, hours: 2 }).list[0].d === 'aiIndividual');
t('each week says why its area', /Central to leading with AI/.test(plan.list[0].why), plan.list[0].why);
const mins = w => w.items.reduce((n, i) => n + i.min, 0);
t('each week fits the time a week (2 hours)', plan.list.every(w => mins(w) <= 120 && mins(w) >= 60), plan.list.map(mins).join());
t('each week has lessons and practice; only the last week has the skill check', plan.list.every(w => w.items.some(i => i.k === 'lesson') && w.items.some(i => i.k === 'practice')) && plan.list.map(w => w.items.some(i => i.k === 'check')).join() === 'false,false,false,true');
const keys = plan.list.flatMap(w => w.items.filter(i => i.k === 'lesson').map(i => i.course + i.lesson));
t('no lesson is planned twice', new Set(keys).size === keys.length);
t('lessons already done are skipped', !P.build({ ...base, progress: { courses: { 'aiIndividual-moderate': { completed: [1] } } } }, { aim: 'ai', weeks: 2, hours: 1 }).list[0].items.some(i => i.course === 'aiIndividual-moderate' && i.lesson === 1));
t('lesson titles lose the "Lesson n:" prefix', plan.list[0].items.filter(i => i.k === 'lesson').every(i => !/^Lesson \d/.test(i.title)));
t('more time a week means more in each week', mins(P.build(base, { aim: 'ai', weeks: 4, hours: 4 }).list[0]) > mins(plan.list[0]));
const nd = P.build(base, { aim: 'product', weeks: 0, hours: 1 });
t('no date: a 6-week plan, marked as not dated', nd.list.length === 6 && !nd.dated);
t('summary: total time, lessons, sessions and areas', (s => s.lessons === keys.length && s.minutes > 0 && s.sessions >= 4 && s.areas.length === 3)(P.summary(plan)), JSON.stringify(P.summary(plan)));

// status
let st = P.status(plan, { ...base, now: NOW + 2 * DAY });
t('status: week 1 of 4, nothing done yet', st.current === 0 && st.week.state === 'now' && st.week.done === 0 && /Week 1 of 4: 0 of \d+ done/.test(st.line), st.line);
t('status: the next item is this week\'s first', st.next && st.next.k === 'lesson');
const w1 = plan.list[0], lessons1 = w1.items.filter(i => i.k === 'lesson'), prac1 = w1.items.find(i => i.k === 'practice');
const courses = {}; lessons1.forEach(l => { (courses[l.course] = courses[l.course] || { completed: [] }).completed.push(l.lesson); });
const log = Array.from({ length: prac1.n * P.SESSION_QS }, (_, i) => ({ d: prac1.d, id: 'q' + i, t: 'scenario', ok: true, at: NOW + DAY + i, src: 'practice' }));
st = P.status(plan, { ...base, progress: { courses }, log, now: NOW + 3 * DAY });
t('status: lessons finished and enough practice answers complete the week', st.week.complete && /This week’s plan is done/.test(st.line), st.line);
st = P.status(plan, { ...base, progress: { courses }, log: log.slice(0, 2), now: NOW + 3 * DAY });
t('status: practice shows how far along', /^2 of \d+ questions$/.test(st.week.items.find(i => i.k === 'practice').part) && !st.week.complete);
st = P.status(plan, { ...base, now: NOW + 9 * DAY });
t('status: in week 2, week 1 left open is noted', st.current === 1 && st.behind === 1 && /1 earlier week still open/.test(st.line), st.line);
st = P.status(plan, { ...base, now: NOW + 40 * DAY });
t('status: past the end, it says so', st.over && /dates have passed/.test(st.line));
const last = plan.list[3];
st = P.status(plan, { ...base, assessedAt: new Date(NOW + 23 * DAY).toISOString(), now: NOW + 24 * DAY });
t('status: a skill check in the last week ticks the check', st.weeks[3].items.find(i => i.k === 'check').done);
t('status: no plan, no status', P.status(null, base) === null);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
