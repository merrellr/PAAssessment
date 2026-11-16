/* Home: "Your next best step" and "My growth". The parts with no Firebase and no page code, tested in
   tests/growth-core.test.mjs. Used by lms-dashboard.html.

   nextSteps: one ordered list of what to do next, so the card can show the best step and what comes after it:
     1. a course the person's company assigned that is overdue or due within a week
     2. the course they are in the middle of
     3. any other course their company assigned
     4. the next course recommended from their assessment
   Each course appears once. Each step says why it was chosen.

   growth: their first assessment that has area scores, against their latest, area by area (sorted by how much
   they grew), plus every attempt for the "Over time" view, and whether a retake is worthwhile (90 days on). */
(function (root) {
  'use strict';

  const RETAKE_DAYS = 90;

  /* resume:    LearningHomeCore.resume(...) (the course in progress) or null
     assigned:  AssignmentsCore.forLearner(...) cards (to-do first)
     upNext:    LearningHomeCore cards recommended from the assessment, best first (may be empty)
     Returns [{ kind, courseId, title, done, total, pct, next, why, due? }] best first. */
  function nextSteps(resume, assigned, upNext) {
    const out = [], seen = {};
    const push = (kind, c, why, extra) => {
      if (!c || seen[c.courseId || c.course]) return;
      const id = c.courseId || c.course;
      seen[id] = true;
      out.push(Object.assign({ kind: kind, courseId: id, title: c.title, done: c.done, total: c.total, pct: c.pct, next: c.next, why: why }, extra || {}));
    };
    const todo = (assigned || []).filter(a => !a.finished);
    todo.filter(a => a.overdue || a.soon).forEach(a => push('assigned', a,
      'Your company assigned it, and it is ' + (a.overdue ? a.dueLabel.toLowerCase() : a.dueLabel.charAt(0).toLowerCase() + a.dueLabel.slice(1)) + '.', { due: a.dueLabel }));
    if (resume) push('resume', resume, 'You are already ' + resume.pct + '% through it. Finishing what you started is the fastest win.');
    todo.forEach(a => push('assigned', a, 'Your company asked the team to finish it' + (a.due ? ' (' + a.dueLabel.charAt(0).toLowerCase() + a.dueLabel.slice(1) + ')' : '') + '.', { due: a.dueLabel }));
    (upNext || []).forEach(c => push('recommended', c, 'Recommended from your assessment: it is where you have the most to gain.'));
    return out;
  }

  const time = (v) => { const n = Date.parse(v || ''); return isFinite(n) ? n : 0; };

  /* attempts: AssessHistory.list(progress) (oldest first)
     domains:  [[key, label], ...] in display order
     nowMs:    the current time */
  function growth(attempts, domains, nowMs) {
    const full = (attempts || []).filter(a => a && a.categoryPct && Object.keys(a.categoryPct).length);
    const latestAny = (attempts || []).length ? attempts[attempts.length - 1] : null;
    const sinceDays = latestAny && time(latestAny.submittedAt) ? Math.floor((nowMs - time(latestAny.submittedAt)) / 86400000) : null;
    const retake = { due: sinceDays !== null && sinceDays >= RETAKE_DAYS, daysSince: sinceDays, inDays: sinceDays === null ? null : Math.max(0, RETAKE_DAYS - sinceDays) };
    if (!full.length) return { state: 'none', areas: [], retake: retake, attempts: 0 };
    const first = full[0], last = full[full.length - 1];
    const val = (a, k) => { const v = Number(a.categoryPct[k]); return isFinite(v) ? Math.round(v) : null; };
    const areas = domains.map(d => {
      const then = val(first, d[0]), now = val(last, d[0]);
      return { key: d[0], label: d[1], then: then, now: now, delta: then === null || now === null ? null : now - then,
        series: full.map(a => ({ at: a.submittedAt, v: val(a, d[0]) })).filter(p => p.v !== null) };
    }).filter(a => a.now !== null);
    const one = full.length === 1;
    if (!one) areas.sort((a, b) => (b.delta || 0) - (a.delta || 0) || domains.findIndex(d => d[0] === a.key) - domains.findIndex(d => d[0] === b.key));
    const grew = areas.filter(a => a.delta > 0).length;
    const biggest = one ? null : areas.slice().sort((a, b) => b.delta - a.delta)[0];
    const gap = areas.slice().sort((a, b) => a.now - b.now)[0] || null;
    return {
      state: one ? 'one' : 'two', attempts: full.length, firstAt: first.submittedAt, latestAt: last.submittedAt,
      overallThen: Math.round(Number(first.overallPct)), overallNow: Math.round(Number(last.overallPct)),
      areas: areas, grew: grew, biggest: biggest && biggest.delta > 0 ? biggest : null, gap: gap, retake: retake
    };
  }

  // "Aug 2026" for a date.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function monthLabel(iso) { const t = time(iso); if (!t) return ''; const d = new Date(t); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }

  // Points for a small line chart, w x h, values 0 to 100 (y grows downward), with a little padding.
  function sparkPoints(series, w, h) {
    const pad = 4, n = series.length;
    if (!n) return '';
    return series.map((p, i) => ((n === 1 ? w / 2 : i * w / (n - 1))).toFixed(1) + ',' + (h - pad - p.v / 100 * (h - 2 * pad)).toFixed(1)).join(' ');
  }

  root.GrowthCore = { RETAKE_DAYS, nextSteps, growth, monthLabel, sparkPoints };
})(typeof globalThis !== 'undefined' ? globalThis : window);
