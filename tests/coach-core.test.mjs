// Tests for coach-core.js (the coach on My Learning and Practice) and coach-bank.js.   Run:  node tests/coach-core.test.mjs
import fs from 'fs';
import { execFileSync } from 'child_process';
import '../coach-core.js';
const C = globalThis.CoachCore;
globalThis.window = globalThis;
eval(fs.readFileSync(new URL('../coach-bank.js', import.meta.url), 'utf8'));
const BANK = globalThis.CoachBank;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

const AREAS = { discovery: 'Discovery', strategy: 'Strategy', prioritization: 'Prioritization' };
const NOW = Date.parse('2026-11-17T12:00:00Z');
const ans = (d, ok, t, i) => ({ d, id: d + ':' + (i || 0), t: t || 'scenario', ok, at: NOW - 1000 * (100 - (i || 0)), src: 'practice' });

// question kinds
t('a plain question about the idea is "Understanding the idea"', C.qType('What is the purpose of a problem statement?') === 'knowledge');
t('a situation is "Applying it to a situation"', C.qType('A colleague says the backlog is fine. What does the lesson suggest is missing?') === 'scenario');
t('a situation that asks what to do is "Making the call"', C.qType('Your VP wants the feature now. What should you do first?') === 'decision');
t('a question about numbers is "Reading the evidence"', C.qType('Two metrics move in opposite directions this month. Whose job is it to resolve that?') === 'data');

// the answer log
let log = [];
for (let i = 0; i < 405; i++) log = C.record(log, { d: 'discovery', id: 'q' + i, t: 'knowledge', ok: true, at: i });
t('the answer log keeps the most recent ' + C.LOG_MAX + ' answers', log.length === C.LOG_MAX && log[0].id === 'q5' && log[log.length - 1].id === 'q404');
t('an unknown question kind is stored as "knowledge"', C.record([], { d: 'x', id: 'y', t: 'bogus', ok: 1 })[0].t === 'knowledge');

// readiness
const pct = { discovery: 80, strategy: 40, prioritization: 60 };
let r = C.readiness({ areas: AREAS, pct, log: [] });
t('with no answers yet, status comes from the skill check (80 strong, 60 developing, 40 needs attention)',
  r[0].status === 'strong' && r[2].status === 'developing' && r[1].status === 'attention' && r.every(a => a.basis === 'assessment'), r.map(a => a.status).join());
const plog = [ans('strategy', true, 'knowledge', 1), ans('strategy', true, 'knowledge', 2), ans('strategy', false, 'scenario', 3), ans('strategy', false, 'scenario', 4), ans('strategy', true, 'knowledge', 5), ans('strategy', false, 'scenario', 6)];
r = C.readiness({ areas: AREAS, pct, log: plog });
const s = r.find(a => a.key === 'strategy');
t('with 4 or more answers, the answers decide (3 of 6 right: developing)', s.basis === 'practice' && s.status === 'developing' && s.correct === 3 && s.total === 6, JSON.stringify(s));
t('the last 8 answers are kept in order for the dots, with the last 3 counted', s.last8.join() === 'true,true,false,false,true,false' && s.recentMissed === 2 && s.recentN === 3);
t('no skill check and no answers: not yet known', C.readiness({ areas: AREAS, pct: null, log: [] })[0].status === 'unknown');

// stage
t('stage: any area needing attention is Building', C.stage(C.readiness({ areas: AREAS, pct, log: [] })).label === 'Building');
t('stage: all at least developing is Strengthening; all strong is Reviewing; nothing known is Getting started',
  C.stage(C.readiness({ areas: AREAS, pct: { discovery: 80, strategy: 60, prioritization: 90 }, log: [] })).label === 'Strengthening'
  && C.stage(C.readiness({ areas: AREAS, pct: { discovery: 80, strategy: 90, prioritization: 99 }, log: [] })).label === 'Reviewing'
  && C.stage(C.readiness({ areas: AREAS, pct: null, log: [] })).label === 'Getting started');

// styles
const st = C.styles(plog);
t('by kind of question: only the kinds answered, with how many right', st.length === 2 && st[0].t === 'knowledge' && st[0].correct === 3 && st[1].t === 'scenario' && st[1].correct === 0 && st[1].total === 3, JSON.stringify(st));
t('the weakest kind in an area needs 2+ misses and under half right', C.weakStyle(plog, 'strategy').t === 'scenario' && C.weakStyle(plog, 'discovery') === null);

// next step
const ctx = { areas: AREAS, pct, log: plog, now: NOW, bank: BANK, progress: { courses: {} }, assessedAt: '2026-10-20T00:00:00Z' };
// use real course ids from the bank so lessons resolve
const ctxReal = { ...ctx, areas: { discovery: 'Customer & Market Discovery', strategy: 'Product Strategy & Roadmapping', prioritization: 'Prioritization & Trade-offs' } };
let n = C.nextStep(ctxReal);
t('next step: practice in the area that needs it most, with the evidence', n.kind === 'practice' && n.area === 'strategy' && /You missed 2 of your last 3 Product Strategy & Roadmapping questions\./.test(n.why), n.why);
t('and the kind of question behind the misses', /Most of the misses are questions that apply it to a situation/.test(n.why), n.why);
t('and a lesson ready if they need it, at their level (40% -> the second course)', n.ready && n.ready.courseId === 'strategy-moderate' && n.ready.lesson === 1 && /^\/lesson\?course=strategy-moderate&lesson=1$/.test(n.ready.href), JSON.stringify(n.ready));
t('evidence chips', n.chips.join('|') === '2 of last 3 missed|3 of 6 correct overall|Developing', n.chips.join('|'));
t('the lesson skips ones already done', C.lessonFor({ ...ctxReal, progress: { courses: { 'strategy-moderate': { completed: [1, 2] } } } }, 'strategy').lesson === 3);
t('with no skill check, the first step is the skill check', C.nextStep({ areas: AREAS, pct: null, log: [], now: NOW }).kind === 'assess');
const none = C.nextStep({ ...ctxReal, log: [] });
t('before any answers, the reason is the skill check score', none.area === 'strategy' && /Your skill check put Product Strategy & Roadmapping at 40%, your lowest area/.test(none.why), none.why);
const allStrong = { ...ctxReal, pct: { discovery: 90, strategy: 90, prioritization: 90 }, log: [] };
t('everything strong: continue the course in progress', C.nextStep({ ...allStrong, resume: { courseId: 'discovery-novice', title: 'Discovery', next: 3, total: 5, done: 2, pct: 40, domain: 'discovery' } }).kind === 'learn');
t('everything strong and nothing in progress: keep an area fresh', C.nextStep(allStrong).kind === 'review');

// alternatives
const alts = C.alternatives(ctxReal, n);
t('alternatives: another area to practise, a reassessment when the skill check is 2+ weeks old, and read-first', alts.map(a => a.kind).join() === 'practice,reassess,teach', alts.map(a => a.kind).join());
t('the reassessment says how long ago', /Your last skill check was 28 days ago/.test(alts[1].why), alts[1].why);

// loop
const lp = C.loop({ ...ctxReal, lessonsDone: 3 });
t('the loop: assessed, gaps found, learning started, practice is where they are', lp.steps.map(x => x.done ? 1 : 0).join('') === '111000' && lp.current === 3 && lp.steps[1].sub === 'No area flagged' && C.loop({ ...ctxReal, log: [] }).steps[1].sub === '1 area flagged' && lp.steps[2].sub === '3 lessons done', JSON.stringify(lp.steps.map(x => x.sub)));
t('reassess: suggested in a number of days, or due', /Suggested in 2 days/.test(lp.steps[5].sub) && C.loop({ ...ctxReal, assessedAt: '2026-09-01' }).steps[5].sub === 'Due now', lp.steps[5].sub);

// practice questions
const q1 = C.pickQuestion(BANK, 'strategy', 1, [], []);
t('practice: a question from the area at the level asked for', q1 && q1.d === 'strategy' && q1.tier === 'moderate', q1 && q1.id);
const q2 = C.pickQuestion(BANK, 'strategy', 1, [q1.id], [{ id: q1.id }]);
t('never the one just asked, and unseen before seen', q2 && q2.id !== q1.id);
t('a kind of question can be preferred', C.pickQuestion(BANK, 'strategy', 1, [], [], 'scenario').t === 'scenario');
t('start level from the skill check', C.startLevel({ x: 20 }, 'x') === 0 && C.startLevel({ x: 60 }, 'x') === 2 && C.startLevel(null, 'x') === 0);

// adapting a session
t('two right in a row: harder', C.adapt([true, true]) === 'harder' && C.adapt([false, true, true]) === 'harder');
t('two misses in a row: offer to slow down or teach first, not again on the third miss', C.adapt([false, false]) === 'offer' && C.adapt([true, false, false]) === 'offer' && C.adapt([false, false, false]) === null);
t('mixed or too few: carry on', C.adapt([true]) === null && C.adapt([true, false]) === null && C.adapt([]) === null);
t('recap: how many right and a line about it', C.recap([true, true, false, true], 'Strategy').right === 3 && /moves up/.test(C.recap([true, true, false, true], 'Strategy').line) && /harder/.test(C.recap([true, true], 'X').line));

// the bank
t('the bank has every course and a few hundred questions, each with options, an answer and its kind',
  Object.keys(BANK.lessons).length === 28 && BANK.questions.length > 250 && BANK.questions.every(q => q.o.length >= 2 && q.a >= 0 && q.a < q.o.length && C.STYLES[q.t]));
t('every lesson has a title and a reading time', Object.values(BANK.lessons).every(ls => ls.every(l => l.title && l.min >= 3)));
let fresh = true;
try { execFileSync('node', [new URL('../tools/coach/build-bank.mjs', import.meta.url).pathname, '--check'], { stdio: 'pipe' }); } catch (e) { fresh = false; }
t('coach-bank.js matches content/ (else run node tools/coach/build-bank.mjs)', fresh);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
