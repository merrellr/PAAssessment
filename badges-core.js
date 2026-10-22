/* Badges: what a learner has earned and how close they are to the next ones.
   Pure logic (no Firebase, no page code), shared by My profile, the dashboard and
   later the emails, and tested on its own (tests/badges-core.test.mjs). It builds
   on company-core.js and notify-core.js, which must be loaded first.

   Everything is worked out from what the progress document already holds:
     courses        lessons finished in each course
     lessonLog      { 'YYYY-MM-DD': lessons finished that day } (lesson.html)
     activeLog      { 'YYYY-MM-DD': 1 } days the learner opened a page (dashboard and lessons)
     goals          the weekly goal (My profile)
     assessmentResult, profile (company, job title, photo), courses[*].reflections
   and the account's creation time. When a badge is first seen as earned, the page
   stores the date in progress.badges = { id: 'ISO date' }, so "earned on" never moves. */
(function (root) {
  'use strict';
  const C = root.CompanyCore;
  const N = root.NotifyCore;
  const DAY = 86400000;
  const KEEP_DAYS = 400;

  const GROUPS = [
    ['start', 'Getting started'],
    ['active', 'Showing up'],
    ['goal', 'Weekly goal'],
    ['lessons', 'Lessons'],
    ['courses', 'Courses'],
    ['mastery', 'Mastery']
  ];

  // metal: the colour of the medal, from first steps to the rarest.
  // metric: the stat it counts; goal: how many it takes.
  const BADGES = [
    { id: 'account', group: 'start', title: 'Welcome aboard', text: 'Created your account', metric: 'account', goal: 1, metal: 'bronze', icon: 'spark' },
    { id: 'assessed', group: 'start', title: 'Know where you stand', text: 'Took the assessment', metric: 'assessed', goal: 1, metal: 'bronze', icon: 'compass' },
    { id: 'profile', group: 'start', title: 'All about you', text: 'Added your company and role to your profile', metric: 'profile', goal: 1, metal: 'bronze', icon: 'person' },
    { id: 'lesson1', group: 'start', title: 'First step', text: 'Finished your first lesson', metric: 'lessons', goal: 1, metal: 'bronze', icon: 'book' },
    { id: 'note1', group: 'start', title: 'Thinking out loud', text: 'Wrote your first reflection in a lesson', metric: 'notes', goal: 1, metal: 'bronze', icon: 'pen' },

    { id: 'active7', group: 'active', title: '7 days', text: 'Learned on 7 different days', metric: 'activeDays', goal: 7, metal: 'bronze', icon: 'calendar' },
    { id: 'active14', group: 'active', title: '14 days', text: 'Learned on 14 different days', metric: 'activeDays', goal: 14, metal: 'silver', icon: 'calendar' },
    { id: 'active30', group: 'active', title: '30 days', text: 'Learned on 30 different days', metric: 'activeDays', goal: 30, metal: 'gold', icon: 'calendar' },
    { id: 'active60', group: 'active', title: '60 days', text: 'Learned on 60 different days', metric: 'activeDays', goal: 60, metal: 'gold', icon: 'calendar' },
    { id: 'active100', group: 'active', title: '100 days', text: 'Learned on 100 different days', metric: 'activeDays', goal: 100, metal: 'platinum', icon: 'calendar' },

    { id: 'goal1', group: 'goal', title: 'Goal getter', text: 'Met your weekly goal', metric: 'goalWeeks', goal: 1, metal: 'bronze', icon: 'target' },
    { id: 'goal4', group: 'goal', title: 'Habit forming', text: 'Met your weekly goal in 4 weeks', metric: 'goalWeeks', goal: 4, metal: 'silver', icon: 'target' },
    { id: 'streak4', group: 'goal', title: 'On a roll', text: 'Met your weekly goal 4 weeks in a row', metric: 'goalStreak', goal: 4, metal: 'gold', icon: 'flame' },
    { id: 'goal12', group: 'goal', title: 'Quarter of practice', text: 'Met your weekly goal in 12 weeks', metric: 'goalWeeks', goal: 12, metal: 'platinum', icon: 'target' },

    { id: 'lessons10', group: 'lessons', title: '10 lessons', text: 'Finished 10 lessons', metric: 'lessons', goal: 10, metal: 'bronze', icon: 'book' },
    { id: 'lessons25', group: 'lessons', title: '25 lessons', text: 'Finished 25 lessons', metric: 'lessons', goal: 25, metal: 'silver', icon: 'book' },
    { id: 'lessons50', group: 'lessons', title: '50 lessons', text: 'Finished 50 lessons', metric: 'lessons', goal: 50, metal: 'gold', icon: 'book' },
    { id: 'lessons100', group: 'lessons', title: '100 lessons', text: 'Finished 100 lessons', metric: 'lessons', goal: 100, metal: 'platinum', icon: 'book' },

    { id: 'course1', group: 'courses', title: 'First course', text: 'Finished a whole course', metric: 'courses', goal: 1, metal: 'bronze', icon: 'cap' },
    { id: 'course5', group: 'courses', title: '5 courses', text: 'Finished 5 courses', metric: 'courses', goal: 5, metal: 'silver', icon: 'cap' },
    { id: 'course10', group: 'courses', title: '10 courses', text: 'Finished 10 courses', metric: 'courses', goal: 10, metal: 'gold', icon: 'cap' },
    { id: 'course20', group: 'courses', title: '20 courses', text: 'Finished 20 courses', metric: 'courses', goal: 20, metal: 'gold', icon: 'cap' },
    { id: 'courseAll', group: 'courses', title: 'Completionist', text: 'Finished all 28 courses', metric: 'courses', goal: 28, metal: 'platinum', icon: 'crown' },

    { id: 'area1', group: 'mastery', title: 'Area complete', text: 'Finished every course in your plan for one skill area', metric: 'areasDone', goal: 1, metal: 'silver', icon: 'flag' },
    { id: 'plan', group: 'mastery', title: 'Plan complete', text: 'Finished every course in your plan', metric: 'planDone', goal: 1, metal: 'gold', icon: 'trophy' },
    { id: 'adv1', group: 'mastery', title: 'Advanced in an area', text: 'Assessed at Advanced Experience in a skill area', metric: 'areasAdvanced', goal: 1, metal: 'silver', icon: 'star' },
    { id: 'graduate', group: 'mastery', title: 'Graduated to Advanced', text: 'Assessed at Advanced Experience overall', metric: 'advancedOverall', goal: 1, metal: 'gold', icon: 'medal' },
    { id: 'adv7', group: 'mastery', title: 'Advanced everywhere', text: 'Assessed at Advanced Experience in all seven skill areas', metric: 'areasAdvanced', goal: 7, metal: 'platinum', icon: 'crown' }
  ];

  const dayKey = (ms, off) => N.dateKey(ms, off);

  // Adds today to the activity log, keeping a little over a year.
  function logActive(log, ms, offsetMin) {
    const out = {};
    const oldest = dayKey(ms - KEEP_DAYS * DAY, offsetMin);
    Object.keys(log || {}).forEach(k => { if (/^\d{4}-\d\d-\d\d$/.test(k) && k >= oldest) out[k] = 1; });
    out[dayKey(ms, offsetMin)] = 1;
    return out;
  }

  // Monday of the week a 'YYYY-MM-DD' falls in, as 'YYYY-MM-DD'.
  function weekOf(key) {
    const d = new Date(key + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }

  /* The numbers the badges count.
     input: { progress, assessment ({ categoryPct, overallPct, tier }) or null, createdMs, nowMs, offsetMin } */
  function stats(input) {
    const p = input.progress || {};
    const courses = p.courses || {};
    const a = input.assessment || null;

    let lessons = 0, coursesDone = 0, notes = 0;
    Object.keys(C.LESSON_COUNTS).forEach(id => {
      const done = C.lessonsDone(courses, id);
      lessons += done;
      if (done >= C.LESSON_COUNTS[id]) coursesDone++;
    });
    Object.keys(courses).forEach(id => {
      const r = courses[id] && courses[id].reflections;
      if (r && typeof r === 'object') Object.keys(r).forEach(k => { if (String(r[k] || '').trim()) notes++; });
    });

    // Days active: any day with a visit or a finished lesson.
    const days = {};
    Object.keys(p.activeLog || {}).forEach(k => { days[k] = 1; });
    Object.keys(p.lessonLog || {}).forEach(k => { if (Number(p.lessonLog[k]) > 0) days[k] = 1; });

    // Weeks in which the weekly goal was met, and the longest run of them back to back.
    const goal = N.normalizeGoals(p.goals).weeklyLessons;
    const perWeek = {};
    Object.keys(p.lessonLog || {}).forEach(k => { if (/^\d{4}-\d\d-\d\d$/.test(k)) perWeek[weekOf(k)] = (perWeek[weekOf(k)] || 0) + (Number(p.lessonLog[k]) || 0); });
    const metWeeks = Object.keys(perWeek).filter(w => perWeek[w] >= goal).sort();
    let streak = 0, run = 0, prev = null;
    metWeeks.forEach(w => {
      run = prev && Date.parse(w) - Date.parse(prev) === 7 * DAY ? run + 1 : 1;
      streak = Math.max(streak, run);
      prev = w;
    });

    // The plan and the skill areas.
    const plan = C.assignedCourses(a);
    let planLessons = 0, planDoneLessons = 0;
    const byArea = {};
    plan.forEach(c => {
      const done = Math.min(C.lessonsDone(courses, c.id), c.lessons);
      planLessons += c.lessons; planDoneLessons += done;
      byArea[c.domain] = byArea[c.domain] || { total: 0, done: 0 };
      byArea[c.domain].total += c.lessons; byArea[c.domain].done += done;
    });
    const areasDone = Object.keys(byArea).filter(k => byArea[k].total > 0 && byArea[k].done >= byArea[k].total).length;
    const cat = (a && a.categoryPct) || {};
    const areasAdvanced = C.DOMAINS.filter(d => C.tierSlugForPct(Number(cat[d[0]]) || 0) === 'advanced').length;
    const overall = a && typeof a.overallPct === 'number' ? a.overallPct : null;
    const prof = p.profile || {};

    return {
      account: 1,   // badges are only shown to someone signed in
      assessed: a ? 1 : 0,
      profile: prof.company && prof.jobTitle ? 1 : 0,
      lessons: lessons,
      notes: notes,
      activeDays: Object.keys(days).length,
      goalWeeks: metWeeks.length,
      goalStreak: streak,
      courses: coursesDone,
      areasDone: areasDone,
      planDone: planLessons > 0 && planDoneLessons >= planLessons ? 1 : 0,
      areasAdvanced: a ? areasAdvanced : 0,
      advancedOverall: (overall !== null && C.tierSlugForPct(overall) === 'advanced') || /^advanced/i.test(String(a && a.tier || '')) ? 1 : 0
    };
  }

  /* Every badge with its state. earned: { id: ISO date } as stored on the progress document.
     A badge counts as earned once its goal is reached, and stays earned after that
     (a retake can lower a score, but never takes a badge away). */
  function evaluate(st, earned) {
    earned = earned || {};
    return BADGES.map(b => {
      const value = Math.min(st[b.metric] || 0, b.goal);
      const have = !!earned[b.id] || (st[b.metric] || 0) >= b.goal;
      return Object.assign({}, b, { value: have ? b.goal : value, have: have, pct: have ? 100 : Math.round(value / b.goal * 100), earnedAt: earned[b.id] || null });
    });
  }

  // Badges reached now that are not stored yet: { id: isoDate } to add to progress.badges.
  function newlyEarned(list, nowMs) {
    const out = {};
    list.forEach(b => { if (b.have && !b.earnedAt) out[b.id] = new Date(nowMs).toISOString(); });
    return out;
  }

  // The nearest badges not yet earned, closest first (for "up next").
  function upNext(list, n) {
    return list.filter(b => !b.have).sort((x, y) => (y.pct - x.pct) || (x.goal - y.goal)).slice(0, n || 3);
  }

  function summary(list) {
    const have = list.filter(b => b.have).length;
    return { have: have, total: list.length, pct: Math.round(have / list.length * 100) };
  }

  /* -------------------------------------------------------------- drawing */
  // Line icons, 24×24, drawn in the medal's ink colour.
  const ICONS = {
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    compass: '<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4z"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6"/>',
    book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 19.7 4 20.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5z"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="m9.5 14.5 1.8 1.8 3.4-3.4"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2"/>',
    flame: '<path d="M12 21c3.9 0 6-2.6 6-5.6 0-3.7-3-5.4-3.6-8.9-1.9 1.4-2.7 3-2.7 4.7-1-.7-1.6-1.9-1.7-3.2C7.7 9.7 6 12.4 6 15.4 6 18.4 8.1 21 12 21z"/>',
    cap: '<path d="m3 9 9-4 9 4-9 4z"/><path d="M7 11v4.5c1.4 1.3 3.1 2 5 2s3.6-.7 5-2V11M21 9v5"/>',
    crown: '<path d="m4 8 4 4 4-6 4 6 4-4-1.5 10h-13z"/><path d="M6.5 20h11"/>',
    flag: '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    medal: '<circle cx="12" cy="14" r="5.5"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/><path d="m10 14 1.4 1.4L14.5 12"/>'
  };

  // A medal with a progress ring: full colour when earned, grey with the ring partly drawn when not.
  function medalSvg(b, size) {
    size = size || 64;
    const r = 28, c = 2 * Math.PI * r;
    const on = b.have;
    return '<svg class="bd-medal bd-' + b.metal + (on ? ' is-on' : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle class="bd-track" cx="32" cy="32" r="' + r + '" fill="none" stroke-width="4"/>' +
      '<circle class="bd-ring" cx="32" cy="32" r="' + r + '" fill="none" stroke-width="4" stroke-linecap="round" transform="rotate(-90 32 32)" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - b.pct / 100)).toFixed(2) + '"/>' +
      '<circle class="bd-face" cx="32" cy="32" r="22"/>' +
      '<g class="bd-icon" transform="translate(20 20)" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[b.icon] || ICONS.star) + '</g></svg>';
  }

  root.BadgesCore = { GROUPS, BADGES, logActive, stats, evaluate, newlyEarned, upNext, summary, medalSvg, weekOf };
})(typeof globalThis !== 'undefined' ? globalThis : window);
