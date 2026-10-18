/* The pilot and customer tracker (owner-pilot.html): where a company is in the
   journey from prospect to active customer, the run book of things to do at each
   stage, the goals agreed for a pilot and whether they are met, a before-and-after
   comparison from the weekly snapshots, and a simple health check once someone is
   a customer. Pure logic (no Firebase, no page code), tested in
   tests/pilot-core.test.mjs. Needs company-core.js and company-report.js first. */
(function (root) {
  'use strict';
  const C = root.CompanyCore;
  const DAY = 86400000;
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const DAY_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

  /* ------------------------------------------------------------- stages */
  // phase groups the run book: 'plan' before the pilot starts, 'run' while it runs, and so on.
  const STAGES = [
    { key: 'prospect', label: 'Prospect', phase: 'plan', hint: 'Interested, but nothing agreed yet.' },
    { key: 'pilot_planned', label: 'Pilot planned', phase: 'plan', hint: 'Scope and dates agreed, not started.' },
    { key: 'pilot_running', label: 'Pilot running', phase: 'run', hint: 'People are taking the assessment and learning.' },
    { key: 'pilot_review', label: 'Pilot review', phase: 'review', hint: 'The pilot has finished. Reading out the results and deciding.' },
    { key: 'onboarding', label: 'Customer: onboarding', phase: 'onboard', hint: 'Signed. The first 30 days.' },
    { key: 'active', label: 'Customer: active', phase: 'grow', hint: 'Live and growing. Reviews every 30 to 90 days.' },
    { key: 'closed', label: 'Paused or lost', phase: 'closed', hint: 'Not going ahead for now.' }
  ];
  const STAGE_KEYS = STAGES.map(s => s.key);
  const stageOf = (key) => STAGES.filter(s => s.key === key)[0] || STAGES[0];

  /* ----------------------------------------------------------- the run book */
  // auto: the page ticks the item itself when the data shows it is done. Everything else is ticked by hand.
  const RUNBOOK = {
    plan: { title: 'Before the pilot', items: [
      { id: 'goals', text: 'Agree what success looks like with the sponsor, and enter it as goals below', hint: 'Three or four numbers they care about is enough.' },
      { id: 'group', text: 'Agree who is in the pilot group and how many people', hint: 'A team of 10 to 30 gives clear results without a long setup.' },
      { id: 'dates', text: 'Agree the start and end dates (4 to 6 weeks works well)' },
      { id: 'contact', text: 'Get the admin contact and the person who signs off', hint: 'Enter them on the company record in the console.' },
      { id: 'company', text: 'Create the company in the owner console', auto: 'company' },
      { id: 'admin', text: 'Invite their admin and confirm they joined', auto: 'admin' },
      { id: 'focus', text: 'Set their focus areas (the skills they care about most)' },
      { id: 'kickoff', text: 'Send the kickoff email: what to do, by when, who to ask' }
    ] },
    run: { title: 'While the pilot runs', items: [
      { id: 'invited', text: 'Invite everyone in the pilot group', auto: 'invited' },
      { id: 'baseline', text: 'Save the baseline (a snapshot of where they start)', auto: 'baseline', hint: 'Do this once most people have taken the assessment.' },
      { id: 'joined', text: 'At least 80% of the people you invited have joined', auto: 'joined80' },
      { id: 'assessed', text: 'At least 90% of the people have taken the assessment', auto: 'assessed90' },
      { id: 'check1', text: 'Check-in call after week 1: remove blockers' },
      { id: 'remind', text: 'Remind anyone who has not started (the report lists who is quiet)' },
      { id: 'started', text: 'At least 60% of the people have started learning', auto: 'started60' },
      { id: 'check2', text: 'Mid-pilot check-in: share progress with the sponsor' },
      { id: 'feedback', text: 'Ask two or three people for a sentence of feedback' }
    ] },
    review: { title: 'The pilot review', items: [
      { id: 'summary', text: 'Print the pilot summary and read it through', hint: 'Use the "Print the pilot summary" button.' },
      { id: 'readout', text: 'Hold the results meeting with the sponsor' },
      { id: 'proposal', text: 'Send the proposal: seats, price and start date' },
      { id: 'objections', text: 'Write down any concerns they raised, in the timeline' },
      { id: 'decision', text: 'Record the decision (signed, extended, or not going ahead)' }
    ] },
    onboard: { title: 'The first 30 days as a customer', items: [
      { id: 'contract', text: 'Contract signed and seats or plan set on the company record' },
      { id: 'invite_all', text: 'Invite everyone covered by the contract' },
      { id: 'admin_train', text: 'Walk the admin through the dashboard and the report' },
      { id: 'announce', text: 'Help them announce it to the team (a short email they can send)' },
      { id: 'cadence', text: 'Set the next check-in date and the review dates (30, 60 and 90 days)' },
      { id: 'd30', text: '30-day review held' }
    ] },
    grow: { title: 'Keeping a customer', items: [
      { id: 'd60', text: '60-day review held' },
      { id: 'd90', text: '90-day review held, results shared with the sponsor' },
      { id: 'renewal', text: 'Renewal date set, with a reminder two months before' },
      { id: 'expand', text: 'Asked whether other teams could use it' },
      { id: 'proof', text: 'Asked for a testimonial or a short case study (with their permission)' }
    ] },
    closed: { title: 'Paused or lost', items: [
      { id: 'reason', text: 'Write down why, in the timeline' },
      { id: 'revisit', text: 'Set a date to get back in touch, if it makes sense' }
    ] }
  };
  const ALL_ITEMS = [].concat.apply([], Object.keys(RUNBOOK).map(k => RUNBOOK[k].items.map(i => i.id)));

  /* ------------------------------------------------------------------- goals */
  // What a pilot goal can measure. dir 'min': the number should reach the target; 'max': stay at or under it.
  const METRICS = [
    { key: 'joined_pct', label: 'Invited people who have joined', unit: '%', dir: 'min', def: 80 },
    { key: 'assessed_pct', label: 'People who took the assessment', unit: '%', dir: 'min', def: 90 },
    { key: 'started_pct', label: 'People who started learning', unit: '%', dir: 'min', def: 60 },
    { key: 'finished_pct', label: 'People who finished their plan', unit: '%', dir: 'min', def: 20 },
    { key: 'plan_pct', label: 'Average share of the learning plan completed', unit: '%', dir: 'min', def: 25 },
    { key: 'quiet_pct', label: 'People quiet for 30+ days (lower is better)', unit: '%', dir: 'max', def: 20 },
    { key: 'overall_gain', label: 'Average overall score gain since the baseline', unit: ' points', dir: 'min', def: 5 }
  ];
  const metricOf = (key) => METRICS.filter(m => m.key === key)[0] || null;
  const DEFAULT_GOALS = [{ metric: 'assessed_pct', target: 90 }, { metric: 'started_pct', target: 60 }, { metric: 'plan_pct', target: 25 }];
  const MAX_GOALS = 8;

  const pct = (a, b) => (b > 0 ? Math.round(a / b * 100) : null);

  // The company's numbers right now, in the terms the goals use.
  function currentNumbers(rows, invites, nowMs, baselineSnap) {
    const r = C.rollup(rows);
    const open = invites.filter(i => C.inviteStatus(i, nowMs) === 'open').length;
    return {
      people: r.people, assessed: r.assessed, learning: r.learning, finished: r.finished, quiet: r.inactive, pending: open,
      joined_pct: pct(r.people, r.people + open),
      assessed_pct: pct(r.assessed, r.people),
      started_pct: pct(r.learning + r.finished, r.people),
      finished_pct: pct(r.finished, r.people),
      plan_pct: r.avgPlanPct,
      quiet_pct: pct(r.inactive, r.people),
      overall_gain: baselineSnap && baselineSnap.avgOverall !== null && baselineSnap.avgOverall !== undefined && r.avgOverall !== null ? r.avgOverall - baselineSnap.avgOverall : null,
      avgOverall: r.avgOverall, areas: r.domains
    };
  }

  // goal: { metric, target }. Returns { label, target, value, status, text } where status is
  // 'met', 'not_yet' or 'unknown' (no data to judge yet).
  function judgeGoal(goal, now) {
    const m = metricOf(goal.metric);
    if (!m) return { label: goal.metric, target: goal.target, value: null, status: 'unknown', text: 'Unknown measure' };
    const v = now[m.key];
    const shown = (x) => x + m.unit;
    if (v === null || v === undefined) return { label: m.label, target: goal.target, value: null, status: 'unknown', text: 'No data yet (target ' + (m.dir === 'max' ? 'at most ' : '') + shown(goal.target) + ')' };
    const met = m.dir === 'max' ? v <= goal.target : v >= goal.target;
    return { label: m.label, target: goal.target, value: v, status: met ? 'met' : 'not_yet',
      text: shown(v) + ' (target ' + (m.dir === 'max' ? 'at most ' : '') + shown(goal.target) + ')' };
  }

  function validGoals(list) {
    if (!Array.isArray(list) || list.length > MAX_GOALS) return false;
    const seen = {};
    return list.every(g => g && metricOf(g.metric) && !seen[g.metric] && (seen[g.metric] = true) && Number.isInteger(g.target) && g.target >= 0 && g.target <= 100);
  }

  /* --------------------------------------------------------------- baseline */
  // snaps: [{ day, atMs, ... }] oldest first. The chosen baseline day if there is one, otherwise the first
  // snapshot on or after the pilot start, otherwise none.
  function pickBaseline(snaps, pilot) {
    if (pilot && pilot.baselineDay) {
      const s = snaps.filter(x => x.day === pilot.baselineDay)[0];
      if (s) return s;
    }
    if (pilot && pilot.pilotStart) {
      const s = snaps.filter(x => x.day >= pilot.pilotStart)[0];
      if (s) return s;
    }
    return null;
  }

  // Before and after, one line per measure: { label, before, after, delta, unit, good }
  function beforeAfter(baseline, now) {
    if (!baseline) return [];
    const row = (label, before, after, unit, lowerIsBetter) => {
      const delta = before === null || before === undefined || after === null || after === undefined ? null : after - before;
      return { label: label, before: before === undefined ? null : before, after: after === undefined ? null : after, delta: delta, unit: unit || '',
        good: delta === null || delta === 0 ? null : (lowerIsBetter ? delta < 0 : delta > 0) };
    };
    const out = [
      row('People in the company', baseline.people, now.people),
      row('Took the assessment', baseline.assessed, now.assessed),
      row('Started learning', (baseline.learning || 0) + (baseline.finished || 0), now.learning + now.finished),
      row('Finished their plan', baseline.finished, now.finished),
      row('Average overall score', baseline.avgOverall, now.avgOverall, '%'),
      row('Average plan complete', baseline.avgPlan, now.plan_pct, '%')
    ];
    now.areas.forEach(a => out.push(row(a.label, (baseline.areas || {})[a.key] === undefined ? null : baseline.areas[a.key], a.avg, '%')));
    return out;
  }

  /* ------------------------------------------------------------------ health */
  // A simple health check for customers. level: 'green' | 'amber' | 'red', with plain reasons.
  function health(input) {
    const stage = stageOf(input.pilot.stage);
    if (stage.phase !== 'onboard' && stage.phase !== 'grow') return null;
    const now = input.now, org = input.org || {}, nowMs = input.nowMs;
    const reasons = []; let level = 'green';
    const bump = (to, text) => { reasons.push(text); if (to === 'red' || (to === 'amber' && level === 'green')) level = to; };

    if (!now.people) bump('red', 'No one has joined yet.');
    else {
      if (now.quiet_pct >= 40) bump('red', plural(now.quiet, 'person is', 'people are') + ' quiet for 30+ days (' + now.quiet_pct + '%).');
      else if (now.quiet_pct >= 20) bump('amber', plural(now.quiet, 'person is', 'people are') + ' quiet for 30+ days (' + now.quiet_pct + '%).');
      if (now.assessed_pct !== null && now.assessed_pct < 60 && stageDays(input.pilot, nowMs) >= 14) bump('amber', 'Only ' + now.assessed_pct + '% have taken the assessment.');
    }
    if (org.plan === 'seat' && org.seatLimit > 0 && stageDays(input.pilot, nowMs) >= 30 && now.people / org.seatLimit < 0.5) {
      bump('amber', 'Only ' + now.people + ' of ' + org.seatLimit + ' seats are in use.');
    }
    const tr = input.trend;
    if (tr && tr.weeks >= 2 && tr.started.to <= tr.started.from && now.people >= 5) bump('amber', 'No more people have started learning over the last ' + plural(tr.weeks, 'week') + '.');
    const due = input.pilot.nextCheckin;
    if (due && DAY_RE.test(due)) {
      const late = Math.floor((nowMs - Date.parse(due + 'T00:00:00Z')) / DAY);
      if (late > 14) bump('red', 'The next check-in is ' + late + ' days overdue.');
      else if (late > 0) bump('amber', 'The next check-in was due ' + plural(late, 'day') + ' ago.');
    } else {
      bump('amber', 'No next check-in is set.');
    }
    const renew = input.pilot.renewalDate;
    if (renew && DAY_RE.test(renew)) {
      const left = Math.ceil((Date.parse(renew + 'T00:00:00Z') - nowMs) / DAY);
      if (left <= 60 && left >= 0 && now.plan_pct !== null && now.plan_pct < 30) bump('amber', 'Renewal is in ' + plural(left, 'day') + ' and the average plan is only ' + now.plan_pct + '% complete.');
    }
    return { level: level, reasons: reasons.length ? reasons : ['Everything on track.'] };
  }

  // Days since the stage started, from whichever date we know: the pilot end for a customer, else the start.
  function stageDays(pilot, nowMs) {
    const d = pilot.pilotEnd || pilot.pilotStart;
    return d && DAY_RE.test(d) ? Math.max(0, Math.floor((nowMs - Date.parse(d + 'T00:00:00Z')) / DAY)) : 0;
  }

  /* ------------------------------------------------------ run book progress */
  // Which run-book items are done: those ticked by hand, plus those the data proves.
  function autoDone(ctx) {
    const now = ctx.now, org = ctx.org || {};
    return {
      company: true,
      admin: ctx.rows.some(r => r.role === 'admin'),
      invited: now.people + now.pending > 0,
      baseline: !!ctx.baseline,
      joined80: now.joined_pct !== null && now.joined_pct >= 80,
      assessed90: now.assessed_pct !== null && now.assessed_pct >= 90,
      started60: now.started_pct !== null && now.started_pct >= 60
    };
  }

  // Items for one phase with their state: { id, text, hint, auto, done, byHand }
  function checklist(phase, done, auto) {
    const book = RUNBOOK[phase];
    if (!book) return { title: '', items: [], done: 0, total: 0 };
    const doneSet = {};
    (done || []).forEach(id => { doneSet[id] = true; });
    const items = book.items.map(i => {
      const isAuto = !!i.auto;
      const ok = isAuto ? !!auto[i.auto] : !!doneSet[i.id];
      return { id: i.id, text: i.text, hint: i.hint || '', auto: isAuto, done: ok };
    });
    return { title: book.title, items: items, done: items.filter(i => i.done).length, total: items.length };
  }

  /* ------------------------------------------------------- pilot summary */
  function fmtDay(d) {
    if (!d || !DAY_RE.test(d)) return '';
    return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  // The plain sentences at the top of the printable summary.
  function summaryLines(input) {
    const p = input.pilot, now = input.now, judged = input.goals;
    const lines = [];
    const span = p.pilotStart ? fmtDay(p.pilotStart) + (p.pilotEnd ? ' to ' + fmtDay(p.pilotEnd) : ' onward') : '';
    lines.push((span ? 'Pilot period: ' + span + '. ' : '') + plural(now.people, 'person', 'people') + ' took part' + (now.pending ? ' (' + now.pending + ' more invited and not yet joined)' : '') + '.');
    if (now.people) {
      lines.push(plural(now.assessed, 'person', 'people') + ' took the assessment (' + (now.assessed_pct === null ? 0 : now.assessed_pct) + '%), ' + (now.learning + now.finished) + ' started learning, and ' + now.finished + ' finished their plan.');
    }
    if (judged.length) {
      const met = judged.filter(g => g.status === 'met').length, known = judged.filter(g => g.status !== 'unknown').length;
      lines.push(known ? 'Goals met: ' + met + ' of ' + judged.length + '.' : 'Goals: not enough data yet to judge.');
    }
    if (input.baseline && input.beforeAfter.length) {
      const o = input.beforeAfter.filter(r => r.label === 'Average overall score')[0];
      if (o && o.delta !== null) lines.push('Average overall score ' + (o.delta > 0 ? 'rose' : o.delta < 0 ? 'fell' : 'stayed') + (o.delta === 0 ? ' at ' + o.after + '%' : ' from ' + o.before + '% to ' + o.after + '%') + ' since the baseline.');
    }
    return lines;
  }

  /* ------------------------------------------------ a few things to do next */
  // At most three suggestions, from the data and the stage.
  function nextSteps(ctx) {
    const out = [], p = ctx.pilot, now = ctx.now, stage = stageOf(p.stage), nowMs = ctx.nowMs;
    const add = (t) => { if (out.length < 3) out.push(t); };
    if (stage.phase === 'plan') {
      if (!ctx.goals.length) add('Add two or three goals so you know what success looks like.');
      if (!p.pilotStart) add('Agree a start date and enter it.');
      if (!now.people && !now.pending) add('Invite their admin from the company page in the console.');
      return out;
    }
    if (stage.phase === 'run') {
      if (!ctx.baseline && now.assessed >= Math.max(3, Math.ceil(now.people * 0.5))) add('Save the baseline now: most people have taken the assessment.');
      if (now.pending > 0) add(plural(now.pending, 'invitation is', 'invitations are') + ' still waiting. Ask the sponsor to nudge them.');
      if (now.assessed < now.people) add(plural(now.people - now.assessed, 'person has', 'people have') + " not taken the assessment yet.");
      if (now.quiet > 0) add(plural(now.quiet, 'person is', 'people are') + ' quiet. Send a short reminder.');
      if (p.pilotEnd && DAY_RE.test(p.pilotEnd) && Date.parse(p.pilotEnd + 'T00:00:00Z') - nowMs < 7 * DAY) add('The pilot ends within a week. Book the results meeting.');
      return out;
    }
    if (stage.phase === 'review') {
      add('Print the pilot summary and book the results meeting.');
      if (ctx.goals.length && ctx.goals.every(g => g.status === 'met')) add('Every goal was met. Lead the meeting with that.');
      return out;
    }
    if (stage.phase === 'onboard' || stage.phase === 'grow') {
      if (ctx.health && ctx.health.level !== 'green') ctx.health.reasons.slice(0, 2).forEach(add);
      if (!p.nextCheckin) add('Set the next check-in date.');
      if (!p.renewalDate) add('Set the renewal date.');
    }
    return out;
  }

  /* ----------------------------------------------------------- the whole thing */
  // input: { pilot, org, rows (active people), invites, snapshots (oldest first), nowMs }
  function build(input) {
    const pilot = Object.assign({ stage: 'prospect', pilotStart: '', pilotEnd: '', nextCheckin: '', renewalDate: '', baselineDay: '', sponsor: '', pilotSize: 0, goals: [], done: [], summaryNote: '' }, input.pilot || {});
    const rows = input.rows, snaps = input.snapshots || [], nowMs = input.nowMs;
    const baseline = pickBaseline(snaps, pilot);
    const now = currentNumbers(rows, input.invites || [], nowMs, baseline);
    const goals = (pilot.goals || []).map(g => judgeGoal(g, now));
    const stage = stageOf(pilot.stage);
    const auto = autoDone({ now: now, rows: rows, baseline: baseline, org: input.org });
    const trend = root.CompanyReport ? root.CompanyReport.trend(snaps) : null;
    const hl = health({ pilot: pilot, now: now, org: input.org, nowMs: nowMs, trend: trend });
    const ba = beforeAfter(baseline, now);
    const ctx = { pilot: pilot, now: now, goals: goals, baseline: baseline, health: hl, nowMs: nowMs, beforeAfter: ba };
    return {
      pilot: pilot, stage: stage, now: now, goals: goals, baseline: baseline, beforeAfter: ba, health: hl, trend: trend,
      checklist: checklist(stage.phase, pilot.done, auto), auto: auto,
      next: nextSteps(ctx), summary: summaryLines(ctx)
    };
  }

  root.PilotCore = {
    STAGES, STAGE_KEYS, RUNBOOK, ALL_ITEMS, METRICS, DEFAULT_GOALS, MAX_GOALS, DAY_RE,
    stageOf, metricOf, currentNumbers, judgeGoal, validGoals, pickBaseline, beforeAfter, health, stageDays, autoDone, checklist,
    fmtDay, summaryLines, nextSteps, build
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
