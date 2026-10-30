// Tests for learning-home-core.js (the top of My Learning, "Pick up where you left off").   Run:  node tests/learning-home.test.mjs
import '../learning-home-core.js';
const H = globalThis.LearningHomeCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
const course = (id, n, domain) => ({ title: 'Course ' + id, domain: domain || 'discovery', lessons: Array.from({ length: n }, (_, i) => ({ id: i + 1 })) });
const CAT = { a: course('a', 5), b: course('b', 3, 'strategy'), c: course('c', 4, 'execution'), d: course('d', 2) };

const p1 = { courses: {
  a: { completed: [1, 2], lastLesson: 2, updatedAt: '2026-10-01T10:00:00Z' },
  b: { completed: [1], lastLesson: 1, updatedAt: '2026-10-05T10:00:00Z' },
  d: { completed: [1, 2], lastLesson: 2, updatedAt: '2026-10-09T10:00:00Z' },
  gone: { completed: [1], updatedAt: '2026-10-10T10:00:00Z' }
} };
const r = H.resume(p1, CAT);
t('resume: the course worked on most recently that is not finished (finished and unknown courses skipped)', r && r.courseId === 'b' && r.next === 2 && r.done === 1 && r.total === 3 && r.pct === 33, JSON.stringify(r));
t('resume: nothing started means nothing to resume', H.resume({ courses: {} }, CAT) === null && H.resume({}, CAT) === null && H.resume(null, CAT) === null);
t('resume: a course opened but with no lesson done is not "in progress"', H.resume({ courses: { a: { completed: [], updatedAt: '2026-10-01' } } }, CAT) === null);
t('next lesson: the first not done after the last one finished', H.nextLesson({ courses: { a: { completed: [1, 2, 4], lastLesson: 2 } } }, CAT, 'a') === 3);
t('next lesson: going back to a skipped lesson when everything after is done', H.nextLesson({ courses: { a: { completed: [2, 3, 4, 5], lastLesson: 5 } } }, CAT, 'a') === 1);
t('next lesson: lesson ids a course no longer has, and repeats, are ignored', H.doneIds({ courses: { b: { completed: [1, 1, 7] } } }, CAT, 'b').join() === '1' && H.nextLesson({ courses: { b: { completed: [1, 1, 7], lastLesson: 7 } } }, CAT, 'b') === 2);
t('complete only when every lesson is done', H.isComplete(p1, CAT, 'd') && !H.isComplete(p1, CAT, 'a') && !H.isComplete(p1, CAT, 'nope'));
const u = H.upNext(['b', 'c', 'a'], p1, CAT, 'b');
t('up next: the first recommendation that is not the one being resumed', u && u.courseId === 'c' && u.next === 1 && u.done === 0, JSON.stringify(u));
t('up next: finished and unknown courses are skipped; none left gives null', H.upNext(['d', 'zz'], p1, CAT, '') === null && H.upNext([], p1, CAT, '') === null && H.upNext(null, p1, CAT, '') === null);
t('up next: a started recommendation continues where it was', H.upNext(['a'], p1, CAT, 'b').next === 3);
t('greeting: first name and the time of day', H.greeting('Sam Lee', 9) === 'Good morning, Sam' && H.greeting('Sam', 14) === 'Good afternoon, Sam' && H.greeting('Sam', 20) === 'Good evening, Sam' && H.greeting('', 9) === 'Good morning' && H.greeting(null, 2) === 'Welcome back');
const ts = (n) => ({ toMillis: () => n });
t('recent saved tools: newest first, at most three', H.recentSaved([{ id: 'a', updatedAt: ts(1) }, { id: 'b', updatedAt: ts(9) }, { id: 'c' }, { id: 'd', updatedAt: ts(5) }], 3).map(d => d.id).join() === 'b,d,a');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
