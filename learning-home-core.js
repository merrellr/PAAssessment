/* The top of My Learning (lms-dashboard.html), "Pick up where you left off": the parts with no Firebase in them,
   tested in tests/learning-home.test.mjs.
   - resume: the course someone was last working on and the lesson to open next
   - upNext: the first course the dashboard recommends that isn't that one and isn't finished
   - recentSaved: their newest saved tools (My saved tools, my-tools.html) */
(function (root) {
  'use strict';

  // Lesson ids of a course that are really done (ids the course no longer has are ignored).
  function doneIds(progress, catalog, courseId) {
    const course = catalog[courseId], cp = (progress && progress.courses && progress.courses[courseId]) || {};
    if (!course) return [];
    const ids = course.lessons.map(l => l.id);
    return (cp.completed || []).filter((id, i, a) => ids.indexOf(id) > -1 && a.indexOf(id) === i);
  }

  function isComplete(progress, catalog, courseId) {
    const course = catalog[courseId];
    return !!course && course.lessons.length > 0 && doneIds(progress, catalog, courseId).length >= course.lessons.length;
  }

  // The lesson to open next: the first one not done after the last one finished, else the first one not done.
  function nextLesson(progress, catalog, courseId) {
    const course = catalog[courseId];
    if (!course || !course.lessons.length) return 1;
    const done = doneIds(progress, catalog, courseId), cp = (progress.courses || {})[courseId] || {};
    const left = course.lessons.map(l => l.id).filter(id => done.indexOf(id) === -1);
    if (!left.length) return course.lessons[course.lessons.length - 1].id;
    const after = left.filter(id => id > (cp.lastLesson || 0));
    return after.length ? after[0] : left[0];
  }

  function courseCard(progress, catalog, courseId) {
    const course = catalog[courseId];
    const cp = (progress && progress.courses && progress.courses[courseId]) || {};
    const done = doneIds(progress, catalog, courseId).length, total = course.lessons.length;
    return { courseId, title: course.title, domain: course.domain, done, total, pct: total ? Math.round(done / total * 100) : 0,
      next: nextLesson(progress || {}, catalog, courseId), updatedAt: cp.updatedAt || '' };
  }

  // The course worked on most recently that has at least one lesson done and isn't finished, or null.
  function resume(progress, catalog) {
    const courses = (progress && progress.courses) || {};
    const open = Object.keys(courses)
      .filter(cid => catalog[cid] && doneIds(progress, catalog, cid).length > 0 && !isComplete(progress, catalog, cid))
      .sort((a, b) => String(courses[b].updatedAt || '').localeCompare(String(courses[a].updatedAt || '')) || a.localeCompare(b));
    return open.length ? courseCard(progress, catalog, open[0]) : null;
  }

  // The first recommended course (in the dashboard's order) that isn't `skipId` and isn't finished, or null.
  function upNext(recommended, progress, catalog, skipId) {
    const pick = (recommended || []).filter(cid => catalog[cid] && cid !== skipId && !isComplete(progress || {}, catalog, cid))[0];
    return pick ? courseCard(progress || {}, catalog, pick) : null;
  }

  // "Good morning, Sam": the first name only, and a plain hello when there's no name.
  function greeting(name, hour) {
    const first = String(name || '').trim().split(/\s+/)[0] || '';
    const part = hour < 5 ? 'Welcome back' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return first ? part + ', ' + first : part;
  }

  // Newest first (Firestore Timestamps, or anything with toMillis), at most n.
  function recentSaved(list, n) {
    const ms = (d) => (d.updatedAt && d.updatedAt.toMillis ? d.updatedAt.toMillis() : 0);
    return (list || []).slice().sort((a, b) => ms(b) - ms(a)).slice(0, n || 3);
  }

  root.LearningHomeCore = { doneIds, isComplete, nextLesson, resume, upNext, greeting, recentSaved };
})(typeof window !== 'undefined' ? window : globalThis);
