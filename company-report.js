/* The company admin's report: a short list of what stands out, an adoption
   funnel, how the team compares with everyone who has taken the assessment, and
   a trend from weekly snapshots. It is pure logic (no Firebase, no page code) so
   it can be tested on its own (tests/company-report.test.mjs). It builds on
   company-core.js, which must be loaded first.

   Every sentence is written by fixed rules, with counts instead of percentages
   when a team is small, so a team of three is never described as a "trend". */
(function (root) {
  'use strict';
  const C = root.CompanyCore;
  const DAY = 86400000;

  const MIN_COMPARE_PEOPLE = 3;      // assessed people needed before an area is compared with everyone
  const MIN_COMPARE_ALL = 10;        // assessments by everyone needed before a comparison means anything
  const COMPARE_GAP = 10;            // points apart before it is worth saying
  const THIN_TEAM = 5;               // under this many assessed people, say it is a first look
  const SNAPSHOT_EVERY_DAYS = 7;
  const TREND_MIN_DAYS = 7;
  const TREND_TARGET_DAYS = 35;

  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const pct = (a, b) => (b > 0 ? Math.min(100, Math.round(a / b * 100)) : null);

  /* ---------------------------------------------------------- snapshots */
  // One small record of the team's numbers, saved at most once a week by the
  // dashboard (orgs/{id}/snapshots/{day}). Numbers only: no names or emails.
  function snapshotOf(rows, nowMs) {
    const r = C.rollup(rows);
    let lessons = 0;
    rows.forEach(x => { lessons += x.progress.planDone || 0; });
    const areas = {};
    r.domains.forEach(d => { if (d.avg !== null) areas[d.key] = d.avg; });
    return {
      day: new Date(nowMs).toISOString().slice(0, 10),
      people: r.people, assessed: r.assessed, learning: r.learning, finished: r.finished, inactive: r.inactive,
      avgOverall: r.avgOverall, avgPlan: r.avgPlanPct, lessons: lessons, areas: areas
    };
  }

  // snaps: [{ atMs, ... }] oldest first. True when a new weekly snapshot is due.
  function snapshotDue(snaps, people, nowMs) {
    if (!people) return false;
    if (!snaps.length) return true;
    const last = snaps[snaps.length - 1].atMs || 0;
    return nowMs - last >= (SNAPSHOT_EVERY_DAYS - 0.5) * DAY;
  }

  // Compares the newest snapshot with an older one at least a week back,
  // preferring one about a month back. Null when there is nothing to compare.
  function trend(snaps) {
    if (snaps.length < 2) return null;
    const to = snaps[snaps.length - 1];
    const older = snaps.slice(0, -1).filter(s => to.atMs - s.atMs >= TREND_MIN_DAYS * DAY);
    if (!older.length) return null;
    const near = older.filter(s => to.atMs - s.atMs <= TREND_TARGET_DAYS * DAY);
    const from = near.length ? near[0] : older[older.length - 1];
    const weeks = Math.max(1, Math.round((to.atMs - from.atMs) / (7 * DAY)));
    const started = (s) => (s.learning || 0) + (s.finished || 0);
    return {
      from: from, to: to, weeks: weeks,
      assessed: { from: from.assessed, to: to.assessed },
      started: { from: started(from), to: started(to) },
      finished: { from: from.finished, to: to.finished },
      avgPlan: { from: from.avgPlan, to: to.avgPlan }
    };
  }

  function trendSeries(snaps) {
    return {
      labels: snaps.map(s => s.day.slice(5)),
      series: [
        { key: 'assessed', name: 'Took the assessment', values: snaps.map(s => s.assessed) },
        { key: 'started', name: 'Started learning', values: snaps.map(s => (s.learning || 0) + (s.finished || 0)) },
        { key: 'finished', name: 'Finished their plan', values: snaps.map(s => s.finished) }
      ]
    };
  }

  /* -------------------------------------------------------------- funnel */
  // Invited or joined, joined, took the assessment, started learning, finished.
  function funnel(rows, invites, nowMs) {
    const open = invites.filter(i => C.inviteStatus(i, nowMs) === 'open').length;
    const r = C.rollup(rows);
    const counts = [
      ['invited', 'Invited or joined', r.people + open],
      ['joined', 'Joined', r.people],
      ['assessed', 'Took the assessment', r.assessed],
      ['started', 'Started learning', r.learning + r.finished],
      ['finished', 'Finished their plan', r.finished]
    ];
    const steps = counts.map((c, i) => ({ key: c[0], label: c[1], count: c[2], conv: i === 0 ? null : pct(c[2], counts[i - 1][2]) }));
    // The biggest drop, ignoring steps that follow a handful of people.
    let worst = -1, low = 101;
    steps.forEach((s, i) => { if (i > 0 && counts[i - 1][2] >= 3 && s.conv !== null && s.conv < low && s.conv < 100) { low = s.conv; worst = i; } });
    return { steps: steps, worst: worst, pending: open };
  }

  /* --------------------------------------------- compared with everyone */
  // platform: { totalCompletions, categoryAverages: { key: percent } } or null.
  function compare(rollup, platform) {
    if (!platform || !(platform.totalCompletions >= MIN_COMPARE_ALL) || !platform.categoryAverages) return { ok: false, all: platform ? platform.totalCompletions || 0 : 0, areas: [] };
    const areas = [];
    rollup.domains.forEach(d => {
      const all = platform.categoryAverages[d.key];
      if (d.avg === null || d.n < MIN_COMPARE_PEOPLE || typeof all !== 'number') return;
      areas.push({ key: d.key, label: d.label, team: d.avg, all: all, gap: d.avg - all, n: d.n });
    });
    return { ok: true, all: platform.totalCompletions, areas: areas };
  }

  /* ------------------------------------------------------------- insights */
  function insights(ctx) {
    const r = ctx.rollup, out = [];
    const add = (severity, text, thin) => out.push(thin ? { severity: severity, text: text, thin: true } : { severity: severity, text: text });

    if (!r.people) {
      add('info', ctx.funnel.pending
        ? plural(ctx.funnel.pending, 'invitation') + (ctx.funnel.pending === 1 ? ' is' : ' are') + ' waiting to be accepted. This report fills in once people join and take the assessment.'
        : 'No one has joined yet. Invite people from the section below and this report fills in as they take the assessment.');
      return out;
    }

    const pend = ctx.funnel.pending;
    if (pend > 0) {
      const oldest = Math.max.apply(null, ctx.invites.filter(i => C.inviteStatus(i, ctx.nowMs) === 'open').map(i => Math.floor((ctx.nowMs - (i.createdAtMs || ctx.nowMs)) / DAY)));
      add(oldest >= 7 ? 'watch' : 'info', plural(pend, 'invitation') + (pend === 1 ? ' is' : ' are') + ' still waiting to be accepted' +
        (oldest >= 7 ? ' (the oldest was sent ' + oldest + ' days ago). A short reminder usually helps.' : '.'));
    }
    if (r.notAssessed > 0) add('watch', r.notAssessed + ' of ' + plural(r.people, 'person', 'people') + (r.notAssessed === 1 ? " hasn't" : " haven't") +
      ' taken the assessment yet, so their level and plan are not in the numbers below.');
    if (r.assessedNotStarted > 0) add('watch', plural(r.assessedNotStarted, 'person has', 'people have') + ' taken the assessment but not started a lesson. This is the easiest group to move: ask them to open their dashboard.');
    if (r.inactive > 0) add('watch', plural(r.inactive, 'person has', 'people have') + ' been quiet for ' + C.INACTIVE_DAYS + '+ days.');
    if (r.finished > 0) add('good', plural(r.finished, 'person has', 'people have') + ' finished their whole learning plan.');

    if (r.weakest && r.assessed >= 3) {
      add('info', 'Across ' + plural(r.assessed, 'assessed person', 'assessed people') + ', the lowest area is ' + r.weakest.label + ' (average ' + r.weakest.avg + '%) and the highest is ' +
        r.strongest.label + ' (' + r.strongest.avg + '%).' + (r.assessed < THIN_TEAM ? ' With so few people this is a first look, not a pattern.' : ''), r.assessed < THIN_TEAM);
    }
    if (ctx.focus && ctx.focus.custom && ctx.focus.top.total > 0) {
      const names = ctx.focus.areas.slice(0, C.FOCUS_TOP).map(a => a.label).join(', ');
      add(ctx.focus.top.pct >= 50 ? 'good' : 'info', 'Progress on your focus areas (' + names + '): ' + ctx.focus.top.pct + '% of the assigned lessons are done (' + ctx.focus.top.done + ' of ' + ctx.focus.top.total + ').');
    }

    if (ctx.compare && ctx.compare.ok) {
      const far = ctx.compare.areas.filter(a => Math.abs(a.gap) >= COMPARE_GAP).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 2);
      far.forEach(a => add(a.gap < 0 ? 'watch' : 'good', 'Your team averages ' + a.team + '% in ' + a.label + ', ' + Math.abs(a.gap) + ' points ' + (a.gap < 0 ? 'below' : 'above') +
        ' the average of everyone who has taken the assessment (' + a.all + '%).'));
      if (!far.length && ctx.compare.areas.length) add('info', 'In every skill area compared, your team is within ' + COMPARE_GAP + ' points of everyone who has taken the assessment.');
    }

    const t = ctx.trend;
    if (t) {
      const span = plural(t.weeks, 'week');
      if (t.avgPlan.from !== null && t.avgPlan.to !== null) {
        const d = t.avgPlan.to - t.avgPlan.from;
        add(d > 0 ? 'good' : d < 0 ? 'watch' : 'info', 'Average plan complete ' + (d === 0 ? 'has stayed at ' + t.avgPlan.to + '%' : 'moved from ' + t.avgPlan.from + '% to ' + t.avgPlan.to + '%') + ' over ' + span + '.');
      }
      if (t.started.to !== t.started.from) add(t.started.to > t.started.from ? 'good' : 'watch', 'People who have started learning: ' + t.started.from + ' then, ' + t.started.to + ' now (' + span + ' apart).');
    } else if (ctx.snapshotCount === 1) {
      add('info', 'Trend charts start after your next weekly snapshot. The first one was saved today.', true);
    }
    return out;
  }

  const RANK = { watch: 0, good: 1, info: 2 };
  function summary(list) {
    return list.filter(i => !i.thin).map((i, n) => ({ i: i, n: n })).sort((a, b) => (RANK[a.i.severity] - RANK[b.i.severity]) || (a.n - b.n)).slice(0, 4).map(x => x.i);
  }

  function headline(r, f) {
    if (!r.people) return 'No one has joined yet.';
    if (!r.assessed) return plural(r.people, 'person has', 'people have') + ' joined and no one has taken the assessment yet.';
    const parts = [r.assessed + ' of ' + plural(r.people, 'person', 'people') + ' ' + (r.assessed === 1 ? 'has' : 'have') + ' taken the assessment'];
    if (r.learning + r.finished > 0) parts.push((r.learning + r.finished) + ' ' + (r.learning + r.finished === 1 ? 'is' : 'are') + ' learning or finished');
    return parts.join(' and ') + '.';
  }

  /* ---------------------------------------------------------- the report */
  // rows: active people with progress; invites: this company's invites;
  // snaps: snapshots oldest first; platform: the public totals, or null.
  function build(input) {
    const nowMs = input.nowMs;
    const rows = input.rows, invites = input.invites || [], snaps = input.snapshots || [];
    const r = C.rollup(rows);
    const f = funnel(rows, invites, nowMs);
    const cmp = compare(r, input.platform || null);
    const tr = trend(snaps);
    const focus = C.focusProgress(rows, input.focusAreas || []);
    const list = insights({ rollup: r, funnel: f, invites: invites, focus: focus, compare: cmp, trend: tr, snapshotCount: snaps.length, nowMs: nowMs });
    return {
      headline: headline(r, f), rollup: r, funnel: f, compare: cmp, trend: tr, series: snaps.length >= 2 ? trendSeries(snaps) : null,
      insights: list, summary: summary(list),
      notes: [
        'Numbers cover people who are active in this company today.',
        'The comparison uses the average of everyone who has taken the assessment' + (cmp.all ? ' (' + cmp.all + ' people)' : '') + ' and only appears when your team and the total are large enough to mean something.',
        'The trend comes from a snapshot saved at most once a week when this page is opened, so it builds up over time.'
      ],
      aiFacts: aiFacts(r, f, cmp, tr, focus)
    };
  }

  // Only numbers and the fixed names of the seven skill areas: no company name,
  // no people. This is the only thing "Explain with AI" ever sends.
  function aiFacts(r, f, cmp, tr, focus) {
    return {
      people: r.people, assessed: r.assessed, learning: r.learning, finished: r.finished, quiet: r.inactive, pendingInvites: f.pending,
      avgOverallPct: r.avgOverall, avgPlanPct: r.avgPlanPct,
      funnel: f.steps.map(s => ({ step: s.label, count: s.count })),
      areas: r.domains.filter(d => d.avg !== null).map(d => {
        const c = cmp.areas.filter(a => a.key === d.key)[0];
        return { area: d.label, teamAvgPct: d.avg, allAvgPct: c ? c.all : null };
      }),
      focusAreas: focus.custom ? focus.areas.slice(0, C.FOCUS_TOP).map(a => a.label) : [],
      trend: tr ? { weeks: tr.weeks, avgPlanFromPct: tr.avgPlan.from, avgPlanToPct: tr.avgPlan.to, startedFrom: tr.started.from, startedTo: tr.started.to } : null
    };
  }

  root.CompanyReport = {
    MIN_COMPARE_PEOPLE, MIN_COMPARE_ALL, COMPARE_GAP, THIN_TEAM, SNAPSHOT_EVERY_DAYS,
    snapshotOf, snapshotDue, trend, trendSeries, funnel, compare, insights, summary, headline, aiFacts, build
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
