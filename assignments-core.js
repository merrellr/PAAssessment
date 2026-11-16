/* Team assignments: a company admin gives the whole team a course to finish, optionally by a date. The pure logic,
   with no Firebase and no page code, so it can be tested on its own (tests/assignments-core.test.mjs).
   Used by company.html (set them, and see who has finished) and lms-dashboard.html (each learner's "From your
   company" card).

   Stored in orgAssignments/{orgId} as { items: [...], updatedAt }, readable by the company's admins and active
   members (see firestore.rules). One item:
     { id: 'a1b2c3d4', course: 'discovery-novice', due: '2026-12-15' or '', note: 'up to 200 characters',
       assignedAt: '2026-11-16' }
   Everything that reads the list runs it through normalize() first, so a damaged or hand-edited list can only
   ever show known courses with sensible dates. */
(function (root) {
  'use strict';

  const MAX = 20, NOTE_MAX = 200, SOON_DAYS = 7;
  const DAY = /^\d{4}-\d{2}-\d{2}$/;

  function isDay(s) {
    if (typeof s !== 'string' || !DAY.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  }
  function today(nowMs) { return new Date(nowMs).toISOString().slice(0, 10); }
  // Whole days from a to b (both YYYY-MM-DD); negative when b is earlier.
  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }

  /* A safe list: known courses only, one entry per course (the first), valid dates, short notes, at most MAX.
     knownCourses: { courseId: lessonCount } (CompanyCore.LESSON_COUNTS). */
  function normalize(items, knownCourses) {
    const out = [], seen = {};
    (Array.isArray(items) ? items : []).forEach(it => {
      if (!it || typeof it !== 'object' || out.length >= MAX) return;
      const course = String(it.course || '');
      if (!knownCourses[course] || seen[course]) return;
      seen[course] = true;
      out.push({
        id: /^[A-Za-z0-9_-]{4,40}$/.test(String(it.id || '')) ? String(it.id) : 'a' + course,
        course: course,
        due: isDay(it.due) ? it.due : '',
        note: String(it.note || '').replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX),
        assignedAt: isDay(it.assignedAt) ? it.assignedAt : ''
      });
    });
    return out;
  }

  /* Adds one assignment. Returns { items } or { error } (a sentence for the admin). */
  function add(items, entry, knownCourses, todayIso, id) {
    const list = normalize(items, knownCourses);
    const course = String((entry && entry.course) || '');
    const due = String((entry && entry.due) || '');
    if (!knownCourses[course]) return { error: 'Choose a course.' };
    if (list.some(x => x.course === course)) return { error: 'That course is already assigned. Remove it first to change it.' };
    if (list.length >= MAX) return { error: 'You can have up to ' + MAX + ' assignments at a time. Remove a finished one first.' };
    if (due && !isDay(due)) return { error: 'Choose a valid due date, or leave it blank.' };
    if (due && due < todayIso) return { error: 'The due date is in the past.' };
    list.push({ id: id, course: course, due: due, note: String((entry && entry.note) || '').replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX), assignedAt: todayIso });
    return { items: list };
  }

  function remove(items, id, knownCourses) { return normalize(items, knownCourses).filter(x => x.id !== id); }

  // Soonest due first, then the ones with no date, each in the order they were added.
  function sorted(items) {
    return items.map((x, i) => ({ x: x, i: i }))
      .sort((a, b) => (a.x.due || '9999').localeCompare(b.x.due || '9999') || a.i - b.i)
      .map(o => o.x);
  }

  /* "Due Dec 15", "Due today", "Due tomorrow", "3 days overdue"; and whether it is overdue or due within a week. */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function prettyDay(iso) { return MONTHS[Number(iso.slice(5, 7)) - 1] + ' ' + Number(iso.slice(8, 10)); }
  function dueInfo(due, todayIso) {
    if (!due) return { label: 'No due date', overdue: false, soon: false, days: null };
    const days = daysBetween(todayIso, due);
    if (days < 0) return { label: (-days) + (days === -1 ? ' day' : ' days') + ' overdue', overdue: true, soon: false, days: days };
    if (days === 0) return { label: 'Due today', overdue: false, soon: true, days: 0 };
    if (days === 1) return { label: 'Due tomorrow', overdue: false, soon: true, days: 1 };
    return { label: 'Due ' + prettyDay(due), overdue: false, soon: days <= SOON_DAYS, days: days };
  }

  // Lessons finished in a course, counting only lessons that exist (as CompanyCore.lessonsDone does).
  function lessonsDone(courses, id, total) {
    const c = courses && courses[id], seen = {};
    ((c && c.completed) || []).forEach(n => { if (Number.isInteger(n) && n >= 1 && n <= total) seen[n] = true; });
    return Object.keys(seen).length;
  }

  /* A learner's own view: one card per assignment, still-to-do first (soonest due first), finished last.
     progress: their progress/{uid} document; catalog: the dashboard's CATALOG ({ id: { title, lessons: [...] } }). */
  function forLearner(items, progress, catalog, knownCourses, todayIso) {
    const courses = (progress && progress.courses) || {};
    const cards = sorted(normalize(items, knownCourses)).filter(x => catalog[x.course]).map(x => {
      const lessons = catalog[x.course].lessons.map(l => l.id);
      const done = lessons.filter(id => ((courses[x.course] || {}).completed || []).indexOf(id) > -1).length;
      const total = lessons.length, finished = total > 0 && done >= total;
      const d = dueInfo(x.due, todayIso);
      const left = lessons.filter(id => ((courses[x.course] || {}).completed || []).indexOf(id) === -1);
      return { id: x.id, course: x.course, title: catalog[x.course].title, note: x.note, due: x.due,
        done: done, total: total, pct: total ? Math.round(done / total * 100) : 0, finished: finished,
        next: left.length ? left[0] : (lessons[0] || 1),
        dueLabel: finished ? 'Finished' : d.label, overdue: !finished && d.overdue, soon: !finished && d.soon };
    });
    return cards.filter(c => !c.finished).concat(cards.filter(c => c.finished));
  }

  /* The team's progress on one assignment, for the admin.
     people: [{ name, email, courses }] for the company's active members (courses from their shared record, or {}).
     Returns counts, and who hasn't finished yet (furthest behind first) with how far they've got. */
  function teamProgress(item, people, knownCourses, todayIso) {
    const total = knownCourses[item.course] || 0;
    let finished = 0, started = 0, notStarted = 0;
    const behind = [];
    (people || []).forEach(p => {
      const done = Math.min(lessonsDone(p.courses || {}, item.course, total), total);
      if (total > 0 && done >= total) { finished++; return; }
      if (done > 0) started++; else notStarted++;
      behind.push({ name: p.name || p.email || 'Someone', email: p.email || '', done: done, total: total });
    });
    behind.sort((a, b) => a.done - b.done || a.name.localeCompare(b.name));
    const d = dueInfo(item.due, todayIso);
    const n = (people || []).length;
    return { people: n, finished: finished, started: started, notStarted: notStarted, total: total,
      pct: n ? Math.round(finished / n * 100) : 0, behind: behind,
      dueLabel: n && finished === n ? 'Everyone has finished' : d.label,
      overdue: d.overdue && finished < n, soon: d.soon && finished < n };
  }

  // A short id for a new assignment.
  function newId(rand) {
    const abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = 'a';
    for (let i = 0; i < 9; i++) s += abc[Math.floor((rand || Math.random)() * abc.length)];
    return s;
  }

  root.AssignmentsCore = { MAX, NOTE_MAX, SOON_DAYS, isDay, today, daysBetween, normalize, add, remove, sorted, dueInfo,
    prettyDay, lessonsDone, forLearner, teamProgress, newId };
})(typeof globalThis !== 'undefined' ? globalThis : window);
