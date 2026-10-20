/* Email check-ins: the learner's own check-in and the company admin's report.
   Pure logic (no Firebase, no Google services) so it can be tested on its own
   (tests/notify-core.test.mjs) and run unchanged inside Apps Script, where
   apps-script/notify.gs is built from this file, company-core.js and
   company-report.js by tools/build-notify-gs.mjs. It builds on company-core.js
   (and company-report.js for the admin report), which must be loaded first.

   What a person's progress document holds for this:
     notify:    { checkin: 'daily' | 'weekly' | 'monthly' | 'off', orgReport: same }
                (missing means weekly: everyone gets the weekly email until they change it)
     goals:     { weeklyLessons: 1-10, focus: up to 3 skill-area keys }
     lessonLog: { 'YYYY-MM-DD': lessons finished that day }, written by lesson.html

   An email covers the period that has just ended: the daily one (sent in the
   morning) covers yesterday, the weekly one (Monday) last week, the monthly one
   (the 1st) last month. */
(function (root) {
  'use strict';
  const C = root.CompanyCore;
  const DAY = 86400000;

  const FREQS = ['daily', 'weekly', 'monthly', 'off'];
  const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', off: 'Off' };
  const DEFAULT_FREQ = 'weekly';
  const DEFAULT_GOAL = 2;
  const GOAL_MIN = 1;
  const GOAL_MAX = 10;
  const MAX_FOCUS = 3;
  const SEND_HOUR = 8;          // emails go out from 8am, script time
  const LOG_KEEP_DAYS = 400;    // lessonLog entries older than this are dropped

  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const domainKeys = C.DOMAINS.map(d => d[0]);

  /* ------------------------------------------------------------ preferences */
  function normalizeFreq(v) { return FREQS.indexOf(v) > -1 ? v : DEFAULT_FREQ; }

  function normalizeGoals(g) {
    g = g || {};
    const n = Math.round(Number(g.weeklyLessons));
    const focus = [];
    (Array.isArray(g.focus) ? g.focus : []).forEach(k => { if (domainKeys.indexOf(k) > -1 && focus.indexOf(k) === -1 && focus.length < MAX_FOCUS) focus.push(k); });
    return { weeklyLessons: Number.isFinite(n) ? Math.min(GOAL_MAX, Math.max(GOAL_MIN, n)) : DEFAULT_GOAL, focus: focus };
  }

  // The settings in one progress document, with the defaults filled in.
  function prefsOf(progress) {
    const n = (progress && progress.notify) || {};
    return { checkin: normalizeFreq(n.checkin), orgReport: normalizeFreq(n.orgReport), goals: normalizeGoals(progress && progress.goals) };
  }

  /* ------------------------------------------------------------------ dates */
  // Local calendar parts of a moment, for a fixed offset from UTC in minutes
  // (the script's time zone, e.g. -420 for Pacific daylight time).
  function localParts(ms, offsetMin) {
    const d = new Date(ms + (offsetMin || 0) * 60000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay(), hour: d.getUTCHours() };
  }
  const pad = (n) => (n < 10 ? '0' : '') + n;
  function dateKey(ms, offsetMin) { const p = localParts(ms, offsetMin); return p.y + '-' + pad(p.m + 1) + '-' + pad(p.d); }
  // The UTC moment of a local midnight.
  function localMidnight(y, m, d, offsetMin) { return Date.UTC(y, m, d) - (offsetMin || 0) * 60000; }

  // When the current period began: today, this week (Monday) or this month.
  function periodStart(freq, nowMs, offsetMin) {
    const p = localParts(nowMs, offsetMin);
    if (freq === 'daily') return localMidnight(p.y, p.m, p.d, offsetMin);
    if (freq === 'monthly') return localMidnight(p.y, p.m, 1, offsetMin);
    return localMidnight(p.y, p.m, p.d - ((p.dow + 6) % 7), offsetMin);   // weekly: back to Monday
  }

  // The period an email sent now looks back on: [from, to).
  function reportWindow(freq, nowMs, offsetMin) {
    const to = periodStart(freq, nowMs, offsetMin);
    const p = localParts(to, offsetMin);
    let from;
    if (freq === 'daily') from = localMidnight(p.y, p.m, p.d - 1, offsetMin);
    else if (freq === 'monthly') from = localMidnight(p.y, p.m - 1, 1, offsetMin);
    else from = localMidnight(p.y, p.m, p.d - 7, offsetMin);
    return { from: from, to: to, label: freq === 'daily' ? 'yesterday' : freq === 'monthly' ? 'last month' : 'last week',
      next: freq === 'daily' ? 'today' : freq === 'monthly' ? 'this month' : 'this week' };
  }

  // Is an email of this frequency due now? lastMs is when the last one went
  // out, or when the account was made (so a brand-new account waits for the
  // next period instead of getting one straight away).
  function isDue(freq, lastMs, nowMs, offsetMin, sendHour) {
    if (FREQS.indexOf(freq) === -1 || freq === 'off') return false;
    if (localParts(nowMs, offsetMin).hour < (sendHour === undefined ? SEND_HOUR : sendHour)) return false;
    return (Number(lastMs) || 0) < periodStart(freq, nowMs, offsetMin);
  }

  /* ------------------------------------------------------------- lesson log */
  // Adds one finished lesson to the log for the day it happened, dropping old days.
  function logLesson(log, ms, offsetMin) {
    const out = {};
    const oldest = dateKey(ms - LOG_KEEP_DAYS * DAY, offsetMin);
    Object.keys(log || {}).forEach(k => { if (/^\d{4}-\d\d-\d\d$/.test(k) && k >= oldest) out[k] = Number(log[k]) || 0; });
    const key = dateKey(ms, offsetMin);
    out[key] = (out[key] || 0) + 1;
    return out;
  }

  // Lessons finished between two moments (by local day; [fromMs, toMs)).
  function lessonsBetween(log, fromMs, toMs, offsetMin) {
    const a = dateKey(fromMs, offsetMin), b = dateKey(toMs - 1, offsetMin);
    let n = 0;
    Object.keys(log || {}).forEach(k => { if (k >= a && k <= b) n += Number(log[k]) || 0; });
    return n;
  }

  // The goal for one email's period, from the weekly goal.
  function targetFor(freq, weekly) {
    if (freq === 'daily') return Math.max(1, Math.round(weekly / 5));
    if (freq === 'monthly') return weekly * 4;
    return weekly;
  }

  // This week so far, for the dashboard: { done, target, pct }.
  function weekSoFar(progress, nowMs, offsetMin) {
    const goals = normalizeGoals(progress && progress.goals);
    const from = periodStart('weekly', nowMs, offsetMin);
    const done = lessonsBetween(progress && progress.lessonLog, from, nowMs + DAY, offsetMin);
    return { done: done, target: goals.weeklyLessons, pct: Math.min(100, Math.round(done / goals.weeklyLessons * 100)), focus: goals.focus };
  }

  /* ------------------------------------------------------- what to do next */
  // The next lesson: carry on with the course touched most recently, else the
  // first unfinished course in the plan, focus areas first.
  function nextLesson(plan, courses, focus) {
    const open = plan.filter(c => c.lessons > 0 && C.lessonsDone(courses, c.id) < c.lessons);
    if (!open.length) return null;
    const started = open.filter(c => courses && courses[c.id] && courses[c.id].updatedAt)
      .sort((a, b) => String(courses[b.id].updatedAt).localeCompare(String(courses[a.id].updatedAt)));
    const rank = (c) => { const i = focus.indexOf(c.domain); return i === -1 ? focus.length : i; };
    const pick = started[0] || open.slice().sort((a, b) => rank(a) - rank(b) || C.TIER_SLUGS.indexOf(a.tier) - C.TIER_SLUGS.indexOf(b.tier))[0];
    const doneSet = {};
    ((courses && courses[pick.id] && courses[pick.id].completed) || []).forEach(n => { doneSet[n] = true; });
    let lesson = 1;
    while (lesson <= pick.lessons && doneSet[lesson]) lesson++;
    return { courseId: pick.id, lesson: lesson, lessons: pick.lessons, resume: !!started[0], title: C.prettyCourseId(pick.id) };
  }

  /* --------------------------------------------------- the learner check-in */
  /* input: {
       name, progress (the progress document), assessment ({ categoryPct } or null),
       freq, nowMs, offsetMin,
       links: { site, settings, unsubscribe }   (site ends with '/')
     } */
  function checkin(input) {
    const freq = normalizeFreq(input.freq);
    const progress = input.progress || {};
    const courses = progress.courses || {};
    const goals = normalizeGoals(progress.goals);
    const win = reportWindow(freq, input.nowMs, input.offsetMin);
    const done = lessonsBetween(progress.lessonLog, win.from, win.to, input.offsetMin);
    const target = targetFor(freq, goals.weeklyLessons);
    const plan = C.assignedCourses(input.assessment || null);
    let planTotal = 0, planDone = 0;
    plan.forEach(c => { planTotal += c.lessons; planDone += Math.min(C.lessonsDone(courses, c.id), c.lessons); });
    const planPct = planTotal ? Math.round(planDone / planTotal * 100) : null;

    // Focus areas: the ones chosen, else the two weakest in the assessment.
    let focus = goals.focus.slice(), suggested = false;
    if (!focus.length && input.assessment && input.assessment.categoryPct) {
      const cat = input.assessment.categoryPct;
      focus = domainKeys.slice().sort((a, b) => (Number(cat[a]) || 0) - (Number(cat[b]) || 0)).slice(0, 2);
      suggested = true;
    }
    const focusRows = focus.map(k => {
      let t = 0, d = 0;
      plan.filter(c => c.domain === k).forEach(c => { t += c.lessons; d += Math.min(C.lessonsDone(courses, c.id), c.lessons); });
      return { key: k, label: C.domainLabel(k), done: d, total: t, pct: t ? Math.round(d / t * 100) : null };
    });

    const next = nextLesson(plan, courses, focus);
    const site = (input.links && input.links.site) || '';
    const first = String(input.name || '').trim().split(/\s+/)[0] || '';

    let status, headline;
    if (!input.assessment) {
      status = 'not_assessed';
      headline = 'Your plan starts with a 10-minute assessment. It shows where you are strong and picks your courses.';
    } else if (planTotal && planDone >= planTotal) {
      status = 'finished';
      headline = "You've finished every course in your plan. Retake the assessment to see how far you've come and get a new plan.";
    } else if (done >= target) {
      status = 'on_track';
      headline = 'You hit your goal ' + win.label + ': ' + done + ' of ' + plural(target, 'lesson') + '. Keep it going.';
    } else if (done > 0) {
      status = 'behind';
      headline = plural(done, 'lesson') + ' ' + win.label + ', ' + (target - done) + ' short of your goal of ' + target + '. One short lesson ' + win.next + ' closes the gap.';
    } else {
      status = 'idle';
      headline = 'No lessons ' + win.label + '. One 10-minute lesson ' + win.next + ' gets you moving again.';
    }

    const subjectBits = { daily: 'Your daily check-in', weekly: 'Your weekly check-in', monthly: 'Your monthly check-in' };
    const subject = subjectBits[freq] + ': ' + (status === 'not_assessed' ? 'start with the assessment'
      : status === 'finished' ? 'plan complete'
      : done + ' of ' + plural(target, 'lesson') + ' ' + win.label);

    return {
      freq: freq, subject: subject, greeting: first ? 'Hi ' + first + ',' : 'Hi,', headline: headline, status: status,
      window: win, done: done, target: target, goalPct: Math.min(100, Math.round(done / target * 100)),
      planPct: planPct, planDone: planDone, planTotal: planTotal,
      focus: focusRows, focusSuggested: suggested,
      next: next ? Object.assign({}, next, { url: site + 'lesson?course=' + encodeURIComponent(next.courseId) + '&lesson=' + next.lesson }) : null,
      cta: !input.assessment ? { label: 'Take the assessment', url: site } : next ? { label: (next.resume ? 'Pick up where you left off' : 'Start your next lesson'), url: site + 'lesson?course=' + encodeURIComponent(next.courseId) + '&lesson=' + next.lesson } : { label: 'Open my learning', url: site + 'lms-dashboard' },
      links: { dashboard: site + 'lms-dashboard', goals: site + 'profile#goals', settings: (input.links && input.links.settings) || '', unsubscribe: (input.links && input.links.unsubscribe) || '' }
    };
  }

  /* ---------------------------------------------------- the admin's report */
  /* input: {
       org, rows (C.buildTeamRows, active people only), invites, snapshots, platform,
       freq, nowMs, offsetMin, adminName,
       links: { site, settings, unsubscribe }
     } */
  function orgReport(input) {
    const R = root.CompanyReport;
    const freq = normalizeFreq(input.freq);
    const org = input.org || {};
    const rows = input.rows || [];
    const win = reportWindow(freq, input.nowMs, input.offsetMin);
    const report = R.build({ rows: rows, invites: input.invites || [], snapshots: input.snapshots || [], platform: input.platform || null, focusAreas: org.focusAreas || [], nowMs: input.nowMs });
    const r = report.rollup;
    const pending = (input.invites || []).filter(i => C.inviteStatus(i, input.nowMs) === 'open').length;
    const active = rows.length;
    const activeInWindow = rows.filter(x => { const t = Date.parse((x.progress && x.progress.lastActiveAt) || ''); return Number.isFinite(t) && t >= win.from && t < win.to; }).length;
    const focus = C.focusProgress(rows, org.focusAreas || []);
    const site = (input.links && input.links.site) || '';
    const first = String(input.adminName || '').trim().split(/\s+/)[0] || '';

    const tiles = [
      { label: 'People', n: r.people },
      { label: 'Took the assessment', n: r.assessed },
      { label: 'Learning now', n: r.learning },
      { label: 'Finished their plan', n: r.finished },
      { label: 'Active ' + win.label, n: activeInWindow },
      { label: 'Quiet for 30+ days', n: r.inactive, warn: r.inactive > 0 }
    ];
    if (r.avgPlanPct !== null) tiles.push({ label: 'Average plan complete', n: r.avgPlanPct + '%' });

    const name = org.name || 'Your company';
    const word = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[freq];
    return {
      freq: freq, orgName: name, subject: name + ' — ' + word.toLowerCase() + ' learning report: ' + plural(activeInWindow, 'person', 'people') + ' active ' + win.label,
      title: word + ' learning report', greeting: first ? 'Hi ' + first + ',' : 'Hi,',
      headline: report.headline, window: win, tiles: tiles,
      seats: C.seatCounts(org, active, pending),
      highlights: (report.summary.length ? report.summary : report.insights.slice(0, 1)).map(i => ({ severity: i.severity, text: i.text })),
      focus: focus.custom ? focus.areas.slice(0, C.FOCUS_TOP).map(a => ({ label: a.label, pct: a.pct })) : [],
      url: site + 'company?org=' + encodeURIComponent(org.id || '') + '#reportCard',
      links: { settings: (input.links && input.links.settings) || '', unsubscribe: (input.links && input.links.unsubscribe) || '' }
    };
  }

  /* ----------------------------------------------------------------- email */
  const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const NAVY = '#1A4584', DEEP = '#12305e', CYAN = '#35C2E8', INK = '#16213E', SOFT = '#4B5768', MUTED = '#6B7686', LINE = '#E3E9F0', TINT = '#EEF4FB', OK = '#2E8B57', WARN = '#C0622A';
  const FONT = 'font-family:Arial,Helvetica,sans-serif;';

  function bar(pct, color) {
    const w = Math.max(0, Math.min(100, Math.round(pct || 0)));
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>' +
      (w > 0 ? '<td width="' + w + '%" style="background:' + (color || NAVY) + ';height:8px;border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>' : '') +
      (w < 100 ? '<td style="background:' + LINE + ';height:8px;border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>' : '') + '</tr></table>';
  }
  function button(label, url) {
    return '<a href="' + esc(url) + '" style="display:inline-block;padding:12px 22px;border-radius:8px;background:' + NAVY + ';color:#ffffff;text-decoration:none;font-weight:bold;' + FONT + 'font-size:15px;">' + esc(label) + '</a>';
  }
  function shell(inner, footer) {
    return '<div style="background:#F5F8FB;padding:24px 12px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid ' + LINE + ';border-radius:14px;border-collapse:separate;">' +
      '<tr><td style="padding:0;"><div style="height:4px;background:' + NAVY + ';background:linear-gradient(90deg,' + NAVY + ',' + CYAN + ');border-radius:14px 14px 0 0;"></div></td></tr>' +
      '<tr><td style="padding:26px 28px 8px;' + FONT + 'color:' + INK + ';font-size:15px;line-height:1.55;">' +
      '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:' + MUTED + ';font-weight:bold;margin-bottom:14px;">Product Advisory · Learning</div>' + inner + '</td></tr>' +
      '<tr><td style="padding:16px 28px 24px;border-top:1px solid ' + LINE + ';' + FONT + 'font-size:12px;line-height:1.5;color:' + MUTED + ';">' + footer + '</td></tr></table></div>';
  }
  function footerHtml(what, freq, links) {
    return 'You get this ' + esc(what) + ' ' + esc(FREQ_LABELS[freq].toLowerCase()) + '. ' +
      (links.settings ? '<a href="' + esc(links.settings) + '" style="color:' + NAVY + ';">Change how often</a>' : '') +
      (links.settings && links.unsubscribe ? ' · ' : '') +
      (links.unsubscribe ? '<a href="' + esc(links.unsubscribe) + '" style="color:' + NAVY + ';">Unsubscribe</a>' : '') +
      '<br>Product Advisory, LLC · <a href="https://www.productadvisory.co" style="color:' + MUTED + ';">productadvisory.co</a>';
  }
  function footerText(what, freq, links) {
    return '\n--\nYou get this ' + what + ' ' + FREQ_LABELS[freq].toLowerCase() + '.' +
      (links.settings ? '\nChange how often: ' + links.settings : '') + (links.unsubscribe ? '\nUnsubscribe: ' + links.unsubscribe : '') + '\nProduct Advisory, LLC';
  }

  function checkinEmail(m) {
    const statusColor = m.status === 'on_track' || m.status === 'finished' ? OK : m.status === 'idle' ? WARN : NAVY;
    let h = '<p style="margin:0 0 6px;">' + esc(m.greeting) + '</p>' +
      '<h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:' + DEEP + ';">' + esc(m.headline) + '</h1>';
    if (m.status !== 'not_assessed') {
      h += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 18px;"><tr>' +
        '<td width="48%" style="padding:14px 16px;background:' + TINT + ';border-radius:10px;vertical-align:top;">' +
        '<div style="font-size:12px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:.06em;font-weight:bold;">Goal ' + esc(m.window.label) + '</div>' +
        '<div style="font-size:26px;font-weight:bold;color:' + statusColor + ';margin:4px 0 8px;">' + m.done + ' <span style="font-size:15px;color:' + SOFT + ';font-weight:normal;">of ' + m.target + ' lessons</span></div>' + bar(m.goalPct, statusColor) + '</td>' +
        '<td width="4%" style="font-size:0;">&nbsp;</td>' +
        '<td width="48%" style="padding:14px 16px;background:' + TINT + ';border-radius:10px;vertical-align:top;">' +
        '<div style="font-size:12px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:.06em;font-weight:bold;">Your plan</div>' +
        '<div style="font-size:26px;font-weight:bold;color:' + NAVY + ';margin:4px 0 8px;">' + (m.planPct === null ? '—' : m.planPct + '%') + ' <span style="font-size:15px;color:' + SOFT + ';font-weight:normal;">' + m.planDone + ' of ' + m.planTotal + ' lessons</span></div>' + bar(m.planPct, NAVY) + '</td>' +
        '</tr></table>';
    }
    if (m.focus.length) {
      h += '<h2 style="margin:0 0 8px;font-size:15px;color:' + DEEP + ';">' + (m.focusSuggested ? 'Suggested focus areas' : 'Your focus areas') + '</h2>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 6px;">' +
        m.focus.map(f => '<tr><td style="padding:6px 0 2px;font-size:14px;">' + esc(f.label) + '</td><td style="padding:6px 0 2px;font-size:13px;color:' + SOFT + ';text-align:right;white-space:nowrap;">' + (f.total ? f.done + ' of ' + f.total : 'tested out') + '</td></tr>' +
          '<tr><td colspan="2" style="padding:0 0 6px;">' + bar(f.total ? f.pct : 100, CYAN) + '</td></tr>').join('') + '</table>';
      if (m.focusSuggested) h += '<p style="margin:0 0 14px;font-size:13px;color:' + SOFT + ';">These are your two lowest-scoring areas. <a href="' + esc(m.links.goals) + '" style="color:' + NAVY + ';">Choose your own focus areas</a>.</p>';
    }
    if (m.next) {
      h += '<div style="margin:16px 0 6px;padding:14px 16px;border:1px solid ' + LINE + ';border-left:4px solid ' + CYAN + ';border-radius:8px;">' +
        '<div style="font-size:12px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:.06em;font-weight:bold;">' + (m.next.resume ? 'Pick up where you left off' : 'Up next') + '</div>' +
        '<div style="font-size:15px;font-weight:bold;color:' + INK + ';margin-top:3px;">' + esc(m.next.title) + '</div>' +
        '<div style="font-size:13px;color:' + SOFT + ';">Lesson ' + m.next.lesson + ' of ' + m.next.lessons + ' · about 10 minutes</div></div>';
    }
    h += '<p style="margin:18px 0 6px;">' + button(m.cta.label, m.cta.url) + '</p>' +
      '<p style="margin:10px 0 0;font-size:13px;color:' + SOFT + ';"><a href="' + esc(m.links.dashboard) + '" style="color:' + NAVY + ';">Open my learning</a> · <a href="' + esc(m.links.goals) + '" style="color:' + NAVY + ';">Change my goals</a></p>';

    const lines = [m.greeting, '', m.headline, ''];
    if (m.status !== 'not_assessed') {
      lines.push('Goal ' + m.window.label + ': ' + m.done + ' of ' + m.target + ' lessons');
      lines.push('Your plan: ' + (m.planPct === null ? '-' : m.planPct + '%') + ' (' + m.planDone + ' of ' + m.planTotal + ' lessons)');
    }
    if (m.focus.length) { lines.push('', (m.focusSuggested ? 'Suggested focus areas' : 'Your focus areas') + ':'); m.focus.forEach(f => lines.push('- ' + f.label + ': ' + (f.total ? f.done + ' of ' + f.total + ' lessons' : 'tested out'))); }
    if (m.next) lines.push('', (m.next.resume ? 'Pick up where you left off: ' : 'Up next: ') + m.next.title + ', lesson ' + m.next.lesson + ' of ' + m.next.lessons);
    lines.push('', m.cta.label + ': ' + m.cta.url, 'Change my goals: ' + m.links.goals);
    return { subject: m.subject, html: shell(h, footerHtml('check-in', m.freq, m.links)), text: lines.join('\n') + footerText('check-in', m.freq, m.links) };
  }

  function orgEmail(m) {
    const SEV = { good: ['Good news', OK], watch: ['Watch', WARN], info: ['Note', NAVY] };
    let h = '<p style="margin:0 0 6px;">' + esc(m.greeting) + '</p>' +
      '<h1 style="margin:0 0 4px;font-size:21px;line-height:1.3;color:' + DEEP + ';">' + esc(m.orgName) + ': ' + esc(m.title.toLowerCase()) + '</h1>' +
      '<p style="margin:0 0 16px;color:' + SOFT + ';">' + esc(m.headline) + '</p>' +
      '<p style="margin:0 0 14px;font-size:13px;color:' + SOFT + ';">Seats: ' + m.seats.map(s => '<b style="color:' + (s.warn ? WARN : INK) + ';">' + esc(String(s.n)) + '</b> ' + esc(s.label.toLowerCase())).join(' · ') + '</p>';
    const cells = m.tiles.map(t => '<td width="33%" style="padding:10px 12px;background:' + TINT + ';border-radius:10px;vertical-align:top;">' +
      '<div style="font-size:22px;font-weight:bold;color:' + (t.warn ? WARN : NAVY) + ';">' + esc(String(t.n)) + '</div><div style="font-size:12px;color:' + SOFT + ';">' + esc(t.label) + '</div></td>');
    h += '<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate;margin:0 -6px 12px;">';
    for (let i = 0; i < cells.length; i += 3) h += '<tr>' + cells.slice(i, i + 3).join('') + (i + 3 > cells.length ? '<td width="33%"></td>'.repeat(i + 3 - cells.length) : '') + '</tr>';
    h += '</table>';
    if (m.highlights.length) {
      h += '<h2 style="margin:6px 0 8px;font-size:15px;color:' + DEEP + ';">What stands out</h2>' +
        m.highlights.map(x => { const s = SEV[x.severity] || SEV.info; return '<p style="margin:0 0 8px;font-size:14px;"><span style="display:inline-block;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:' + s[1] + ';margin-right:6px;">' + s[0] + '</span>' + esc(x.text) + '</p>'; }).join('');
    }
    if (m.focus.length) {
      h += '<h2 style="margin:14px 0 8px;font-size:15px;color:' + DEEP + ';">Focus areas</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
        m.focus.map(f => '<tr><td style="padding:5px 0 2px;font-size:14px;">' + esc(f.label) + '</td><td style="padding:5px 0 2px;font-size:13px;color:' + SOFT + ';text-align:right;">' + (f.pct === null || f.pct === undefined ? '—' : f.pct + '%') + '</td></tr><tr><td colspan="2" style="padding:0 0 5px;">' + bar(f.pct || 0, CYAN) + '</td></tr>').join('') + '</table>';
    }
    h += '<p style="margin:20px 0 4px;">' + button('See the full report', m.url) + '</p>' +
      '<p style="margin:8px 0 0;font-size:13px;color:' + SOFT + ';">The full report has the adoption funnel, how your team compares, each person\'s progress and "Explain with AI".</p>';

    const lines = [m.greeting, '', m.orgName + ': ' + m.title.toLowerCase(), m.headline, '',
      'Seats: ' + m.seats.map(s => s.n + ' ' + s.label.toLowerCase()).join(', '), ''];
    m.tiles.forEach(t => lines.push(t.label + ': ' + t.n));
    if (m.highlights.length) { lines.push('', 'What stands out:'); m.highlights.forEach(x => lines.push('- ' + x.text)); }
    if (m.focus.length) { lines.push('', 'Focus areas:'); m.focus.forEach(f => lines.push('- ' + f.label + ': ' + (f.pct === null || f.pct === undefined ? '-' : f.pct + '%'))); }
    lines.push('', 'See the full report: ' + m.url);
    return { subject: m.subject, html: shell(h, footerHtml('report', m.freq, m.links)), text: lines.join('\n') + footerText('report', m.freq, m.links) };
  }

  // "j***@acme.com", for the email settings page (opened from a link, without signing in).
  function maskEmail(e) {
    const s = String(e || ''), at = s.indexOf('@');
    if (at < 1) return '';
    return s.charAt(0) + '***' + s.slice(at);
  }

  root.NotifyCore = {
    FREQS, FREQ_LABELS, DEFAULT_FREQ, DEFAULT_GOAL, GOAL_MIN, GOAL_MAX, MAX_FOCUS, SEND_HOUR,
    normalizeFreq, normalizeGoals, prefsOf, localParts, dateKey, periodStart, reportWindow, isDue,
    logLesson, lessonsBetween, targetFor, weekSoFar, nextLesson, checkin, orgReport, checkinEmail, orgEmail, maskEmail
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
