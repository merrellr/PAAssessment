// plan-core.js: the Compass study plan. Three answers (what you're aiming for, by when, and how much time a week) and
// what Compass knows (readiness by area, the lessons not yet done) become a week-by-week plan of lessons, practice
// sessions and a closing skill check. Saved on progress.studyPlan; the status of each week is worked out from the
// lessons finished, the practice answers and the skill check date, so nothing extra has to be recorded.
// No DOM, no network: plan-ui.js draws it, tests/plan-core.test.mjs checks it.
(function (root) {
  var C = root.CoachCore;
  var DAY = 864e5, WEEK = 7 * DAY;
  var SESSION_MIN = 10, SESSION_QS = 4, CHECK_MIN = 15, LESSON_EXTRA = 4, WEEK_LESSONS = 8;   // a lesson: its reading time plus its questions

  var AIMS = {
    promoted: { label: 'Get promoted', short: 'getting promoted', areas: ['strategy', 'stakeholder', 'prioritization', 'execution'] },
    product: { label: 'Move into product', short: 'moving into product', areas: ['discovery', 'strategy', 'prioritization', 'execution'] },
    ai: { label: 'Lead with AI', short: 'leading with AI', areas: ['aiIndividual', 'aiOrg', 'discovery'] },
    sharpen: { label: 'Sharpen my skills', short: 'sharpening your skills', areas: [] }
  };
  var WHEN = [{ v: 2, label: '2 weeks' }, { v: 4, label: '1 month' }, { v: 8, label: '2 months' }, { v: 0, label: 'No date' }];
  var HOURS = [{ v: 1, label: '1 hour' }, { v: 2, label: '2 hours' }, { v: 3, label: '3 hours' }, { v: 4, label: '4 hours' }];
  var NO_DATE_WEEKS = 6, MAX_WEEKS = 8;
  var RANK = { attention: 0, unknown: 1, developing: 2, strong: 3 };

  function areaName(ctx, d) { return (ctx.areas || {})[d] || d; }
  function plural(n, one) { return n + ' ' + (n === 1 ? one : one + 's'); }

  // The areas to work on, in order: the ones that need it most, with the aim's areas pulled forward.
  function order(ctx, aim) {
    var want = (AIMS[aim] || AIMS.sharpen).areas;
    return C.readiness(ctx).map(function (a, i) {
      var w = want.indexOf(a.key), boost = w < 0 ? 0 : 2.5 - w * 0.2;   // the aim's areas first, unless already strong
      return { a: a, score: RANK[a.status] - boost + (a.pct === null ? 50 : a.pct) / 1000 + i * 1e-6 };   // ties: the lower skill check score first
    }).sort(function (x, y) { return x.score - y.score; }).map(function (x) { return x.a; });
  }

  // Lessons not yet done in an area, from the level the skill check suggests (the same start as CoachCore.lessonFor).
  function lessonsLeft(ctx, d, taken) {
    var lessons = (ctx.bank && ctx.bank.lessons) || {}, p = ctx.pct && typeof ctx.pct[d] === 'number' ? ctx.pct[d] : 0;
    var start = p > 75 ? 3 : p > 50 ? 2 : p > 25 ? 1 : 0, out = [];
    for (var i = start; i < C.TIERS.length; i++) {
      var cid = d + '-' + C.TIERS[i], ls = lessons[cid] || [], done = C.doneIds(ctx.progress, cid);
      ls.forEach(function (l) {
        var key = cid + ':' + l.id;
        if (done.indexOf(l.id) < 0 && !taken[key]) out.push({ k: 'lesson', d: d, course: cid, lesson: l.id, title: l.title.replace(/^Lesson \d+:\s*/, ''), min: l.min + LESSON_EXTRA, href: '/lesson?course=' + cid + '&lesson=' + l.id });
      });
    }
    return out;
  }

  // Build a plan. answers: { aim, weeks (0 = no date), hours }. Returns the object saved on progress.studyPlan.
  function build(ctx, answers) {
    var aim = AIMS[answers.aim] ? answers.aim : 'sharpen';
    var weeks = Math.max(1, Math.min(MAX_WEEKS, +answers.weeks || NO_DATE_WEEKS));
    var hours = Math.max(1, Math.min(4, +answers.hours || 2)), budget = hours * 60;
    var areas = order(ctx, aim), focusN = Math.max(1, Math.min(areas.length, weeks <= 2 ? 2 : weeks <= 4 ? 3 : 4));
    var focus = areas.slice(0, focusN), taken = {}, list = [];
    for (var w = 0; w < weeks; w++) {
      var last = w === weeks - 1 && weeks >= 2;
      var a = focus[w % focus.length], items = [], used = 0;
      var room = (last ? budget - CHECK_MIN : budget) * 0.55;
      lessonsLeft(ctx, a.key, taken).some(function (l) {
        if (items.length && used + l.min > room) return true;
        items.push(l); taken[l.course + ':' + l.lesson] = 1; used += l.min;
        return items.length >= WEEK_LESSONS;
      });
      var left = (last ? budget - CHECK_MIN : budget) - used;
      var sessions = Math.max(1, Math.min(10, Math.floor(left / SESSION_MIN)));
      items.push({ k: 'practice', d: a.key, n: sessions, min: sessions * SESSION_MIN, title: plural(sessions, 'practice session') + ' in ' + areaName(ctx, a.key), href: '/practice?area=' + a.key });
      if (last) items.push({ k: 'check', min: CHECK_MIN, title: 'Retake the skill check to see how far you’ve come', href: ctx.assessUrl || '/' });
      list.push({ d: a.key, why: whyWeek(ctx, a, aim), items: items });
    }
    return { v: 1, aim: aim, weeks: weeks, dated: !!+answers.weeks, hours: hours, start: startOfDay(ctx.now || Date.now()), list: list };
  }
  function whyWeek(ctx, a, aim) {
    var inAim = (AIMS[aim] || AIMS.sharpen).areas.indexOf(a.key) > -1;
    var st = a.status === 'attention' ? 'it needs attention' : a.status === 'unknown' ? 'there’s nothing to go on yet' : a.status === 'developing' ? 'it’s developing' : 'it’s strong; this keeps it fresh';
    return (inAim ? 'Central to ' + AIMS[aim].short + ', and ' : 'Because ') + st + '.';
  }
  function startOfDay(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

  // Where the plan stands now: each week with its dates and each item marked done (or how far along), the current
  // week, and a line for Home. ctx needs progress, log (answers) and assessedAt.
  function status(plan, ctx) {
    if (!plan || !plan.list || !plan.list.length) return null;
    var now = ctx.now || Date.now(), log = ctx.log || [];
    var cur = Math.max(0, Math.min(plan.list.length - 1, Math.floor((now - plan.start) / WEEK)));
    var over = now >= plan.start + plan.list.length * WEEK;
    var weeks = plan.list.map(function (wk, i) {
      var from = plan.start + i * WEEK, to = from + WEEK;
      var items = wk.items.map(function (it) {
        var done = false, part = '';
        if (it.k === 'lesson') done = C.doneIds(ctx.progress, it.course).indexOf(it.lesson) > -1;
        else if (it.k === 'practice') {
          var need = it.n * SESSION_QS, got = log.filter(function (e) { return e.d === it.d && e.src === 'practice' && e.at >= from && e.at < to; }).length;
          done = got >= need; part = Math.min(got, need) + ' of ' + need + ' questions';
        } else if (it.k === 'check') done = !!ctx.assessedAt && Date.parse(ctx.assessedAt) >= from;
        return Object.assign({}, it, { done: done, part: part });
      });
      var n = items.filter(function (x) { return x.done; }).length;
      return { n: i + 1, d: wk.d, why: wk.why, from: from, to: to, items: items, done: n, total: items.length, complete: n === items.length,
        state: i < cur ? 'past' : i === cur && !over ? 'now' : i === cur && over ? 'past' : 'next' };
    });
    var week = weeks[cur], todo = week.items.filter(function (x) { return !x.done; });
    var behind = weeks.slice(0, cur).filter(function (w) { return !w.complete; }).length;
    var allDone = weeks.every(function (w) { return w.complete; });
    var line = allDone ? 'You’ve finished your study plan. Well done.'
      : over ? 'Your plan’s dates have passed with ' + plural(weeks.filter(function (w) { return !w.complete; }).length, 'week') + ' still open. Pick up where you left off, or make a new plan.'
      : week.complete ? 'This week’s plan is done. Next week: ' + areaName(ctx, (weeks[cur + 1] || week).d) + '.'
      : 'Week ' + week.n + ' of ' + weeks.length + ': ' + week.done + ' of ' + week.total + ' done' + (behind ? ', with ' + plural(behind, 'earlier week') + ' still open' : '') + '.';
    return { aim: plan.aim, aimLabel: (AIMS[plan.aim] || AIMS.sharpen).label, weeks: weeks, current: cur, week: week, next: todo[0] || null, behind: behind, over: over, allDone: allDone, line: line,
      ends: plan.start + plan.list.length * WEEK - DAY, dated: plan.dated, hours: plan.hours };
  }

  // The plan's total time and lessons, for the preview.
  function summary(plan) {
    var mins = 0, lessons = 0, sessions = 0;
    plan.list.forEach(function (w) { w.items.forEach(function (it) { mins += it.min; if (it.k === 'lesson') lessons++; if (it.k === 'practice') sessions += it.n; }); });
    return { minutes: mins, lessons: lessons, sessions: sessions, areas: plan.list.map(function (w) { return w.d; }).filter(function (d, i, a) { return a.indexOf(d) === i; }) };
  }

  root.PlanCore = { AIMS: AIMS, WHEN: WHEN, HOURS: HOURS, SESSION_QS: SESSION_QS, build: build, status: status, summary: summary, order: order };
})(typeof window !== 'undefined' ? window : globalThis);
