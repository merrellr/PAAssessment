/* The coach: the parts with no Firebase or page in them, tested in tests/coach-core.test.mjs.
   Used by My Learning (lms-dashboard.html), Practice (practice.html) and the lesson page (lesson.html).

   The coach works from three things it already knows about someone:
     - their skill check (assessment): a score per skill area, and when they took it
     - their courses: lessons done, the course in progress
     - their answers: every lesson check, refresher and practice question they answer is kept on their progress
       record as a short entry (record), most recent last: { d: area, id: question id, t: question type, ok, at }
   From those it says how ready they are in each area (readiness), where the gaps are, by area and by the kind of
   question they miss (styles), what it would do next and why (nextStep), and what else they could do (alternatives).
   Everything it says comes with the evidence ("You missed 2 of your last 3 ..."), never a bare score. */
(function (root) {
  'use strict';

  var TIERS = ['novice', 'moderate', 'experienced', 'advanced'];
  var LOG_MAX = 400;           // answers kept per person (oldest dropped)
  var REASSESS_DAYS = 30;      // a fresh skill check is suggested this long after the last one

  // The kind of question, from its wording: a plain question about the idea, the idea applied to a situation, a
  // situation that asks what to do, or one about numbers and evidence. Shared with tools/coach/build-bank.mjs.
  var STYLES = {
    knowledge: 'Understanding the idea',
    scenario: 'Applying it to a situation',
    decision: 'Making the call',
    data: 'Reading the evidence'
  };
  // the same kinds, as they read in a sentence
  var STYLE_PHRASE = {
    knowledge: 'questions about the idea itself',
    scenario: 'questions that apply it to a situation',
    decision: 'questions that ask you to make the call',
    data: 'questions about reading the evidence'
  };
  var STYLE_ORDER = ['knowledge', 'scenario', 'decision', 'data'];
  function qType(question) {
    var Q = String(question || ''), s = Q.toLowerCase();
    var sentences = (Q.match(/[.!?]["”]?\s+(?=[A-Z"“])/g) || []).length;
    var situation = sentences >= 1 || /^(a|an|two|three|your|you|imagine|suppose|after|during|when|in a)\b/i.test(Q) || /["“]/.test(Q);
    var evidence = /\d+(\.\d+)?\s?%|\$\d|\bchart\b|\bmetrics?\b|\brate\b|\baverage\b|\bkpis?\b|\bscores?\b|\bdata\b|\bsurvey\b|\bsample\b/.test(s);
    var call = /\bwhat should|\bwhich (is the )?(best|first|right)\b|\bbest (next|first|way|response|move)\b|\bmost (useful|effective|appropriate|important) (next|first|thing|step|move|response)\b|\bshould (she|he|they|you|the team)\b|\bwhat would you\b|\bfirst move\b/.test(s);
    if (evidence && situation) return 'data';
    if (situation && call) return 'decision';
    if (situation) return 'scenario';
    if (evidence) return 'data';
    return 'knowledge';
  }

  // One answer onto the log (a new array; the oldest dropped past LOG_MAX).
  function record(log, entry) {
    var e = { d: String(entry.d || ''), id: String(entry.id || ''), t: STYLES[entry.t] ? entry.t : 'knowledge', ok: !!entry.ok, at: +entry.at || Date.now() };
    if (entry.src) e.src = String(entry.src);
    var out = (Array.isArray(log) ? log : []).concat([e]);
    return out.length > LOG_MAX ? out.slice(out.length - LOG_MAX) : out;
  }

  function areaLog(log, d) { return (log || []).filter(function (e) { return e && e.d === d; }); }

  // An area's status: from its answers once there are 4 or more (the last 8 count), else from the skill check.
  // 'strong' (3 in 4 or better), 'developing' (half or better), 'attention' (less), or 'unknown' (nothing yet).
  var STATUS = { strong: 'Strong', developing: 'Developing', attention: 'Needs attention', unknown: 'Not yet known' };
  function statusFor(ratio) { return ratio >= 0.75 ? 'strong' : ratio >= 0.5 ? 'developing' : 'attention'; }

  function readiness(ctx) {
    var areas = ctx.areas || {}, pct = ctx.pct || null, log = ctx.log || [];
    return Object.keys(areas).map(function (d) {
      var all = areaLog(log, d), last8 = all.slice(-8).map(function (e) { return !!e.ok; });
      var correct = all.filter(function (e) { return e.ok; }).length, p = pct && typeof pct[d] === 'number' ? Math.round(pct[d]) : null;
      var status, basis;
      if (all.length >= 4) { status = statusFor(last8.filter(Boolean).length / last8.length); basis = 'practice'; }
      else if (p !== null) { status = statusFor(p / 100); basis = 'assessment'; }
      else { status = 'unknown'; basis = 'none'; }
      var recent = all.slice(-3);
      return { key: d, name: areas[d], status: status, label: STATUS[status], basis: basis, pct: p,
        correct: correct, total: all.length, last8: last8,
        recentMissed: recent.filter(function (e) { return !e.ok; }).length, recentN: recent.length };
    });
  }

  // The overall stage: Getting started (nothing known yet), Building (an area needs attention), Strengthening (the
  // rest are at least developing), Reviewing (everything strong: keep it fresh).
  var STAGES = [
    { key: 'start', label: 'Getting started', sub: 'Establishing a baseline' },
    { key: 'building', label: 'Building', sub: 'Closing priority gaps' },
    { key: 'strengthening', label: 'Strengthening', sub: 'Applying across areas' },
    { key: 'reviewing', label: 'Reviewing', sub: 'Keeping it fresh' }
  ];
  function stage(areas) {
    var known = (areas || []).filter(function (a) { return a.status !== 'unknown'; });
    var i = !known.length ? 0 : known.some(function (a) { return a.status === 'attention'; }) ? 1
      : known.some(function (a) { return a.status === 'developing'; }) ? 2 : 3;
    return { index: i, key: STAGES[i].key, label: STAGES[i].label, sub: STAGES[i].sub, steps: STAGES };
  }

  // How someone does by kind of question (all areas, or one): [{ t, label, correct, total }], only kinds answered.
  function styles(log, d) {
    var list = d ? areaLog(log, d) : (log || []);
    return STYLE_ORDER.map(function (t) {
      var of = list.filter(function (e) { return e.t === t; });
      return { t: t, label: STYLES[t], correct: of.filter(function (e) { return e.ok; }).length, total: of.length };
    }).filter(function (s) { return s.total > 0; });
  }
  // The kind of question missed most in an area (at least 2 misses and below half right), or null.
  function weakStyle(log, d) {
    var w = styles(log, d).filter(function (s) { return s.total - s.correct >= 2 && s.correct / s.total < 0.5; })
      .sort(function (a, b) { return (a.correct / a.total) - (b.correct / b.total) || (b.total - a.total); });
    return w[0] || null;
  }

  // Lessons: which one to read for an area. The course at their level (from the skill check) or the next one up that
  // isn't finished, and in it the next lesson not done. Titles and minutes come from the practice bank.
  function doneIds(progress, courseId) {
    var cp = progress && progress.courses && progress.courses[courseId];
    return (cp && cp.completed) || [];
  }
  function lessonFor(ctx, d) {
    var lessons = (ctx.bank && ctx.bank.lessons) || {}, p = ctx.pct && typeof ctx.pct[d] === 'number' ? ctx.pct[d] : 0;
    var start = p > 75 ? 3 : p > 50 ? 2 : p > 25 ? 1 : 0;
    for (var i = start; i < TIERS.length; i++) {
      var cid = d + '-' + TIERS[i], ls = lessons[cid];
      if (!ls || !ls.length) continue;
      var done = doneIds(ctx.progress, cid), left = ls.filter(function (l) { return done.indexOf(l.id) < 0; });
      if (left.length) {
        var l = left[0];
        return { courseId: cid, lesson: l.id, title: l.title, min: l.min, href: '/lesson?course=' + cid + '&lesson=' + l.id };
      }
    }
    return null;
  }

  function areaName(ctx, d) { return (ctx.areas || {})[d] || d; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many || one + 's'); }
  function daysSince(at, now) { return at ? Math.floor((now - new Date(at).getTime()) / 864e5) : null; }

  // The area the coach would work on first: the one needing attention with the most recent misses, then the lowest
  // share right, then the lowest skill check score. Areas with nothing known come last.
  function focusArea(areas) {
    var rank = { attention: 0, developing: 1, strong: 2, unknown: 3 };
    var ratio = function (a) { return a.last8.length ? a.last8.filter(Boolean).length / a.last8.length : (a.pct === null ? 1 : a.pct / 100); };
    return (areas || []).slice().sort(function (a, b) {
      return rank[a.status] - rank[b.status] || (b.recentMissed - a.recentMissed) || (ratio(a) - ratio(b)) || ((a.pct === null ? 101 : a.pct) - (b.pct === null ? 101 : b.pct));
    })[0] || null;
  }

  // What the coach would do next, with the evidence. kind: 'assess' | 'practice' | 'learn' | 'review'.
  // { kind, area, title, why, chips: [..], action: { label, href }, ready: lesson|null, minutes }
  function nextStep(ctx) {
    var now = ctx.now || Date.now(), areas = readiness(ctx), log = ctx.log || [];
    if (!ctx.pct) {
      return { kind: 'assess', area: null, title: 'Find your starting point', minutes: 10,
        why: "I don't know where you stand yet. A short skill check across the seven areas tells me where to focus, and every recommendation after that is built on it.",
        chips: [], action: { label: 'Take the skill check', href: ctx.assessUrl || '/' }, ready: null };
    }
    var f = focusArea(areas);
    if (f && f.status === 'strong') f = null;
    if (f) {
      var ready = lessonFor(ctx, f.key), ws = weakStyle(log, f.key), name = f.name, why, chips = [];
      if (f.basis === 'practice') {
        why = f.recentMissed >= 2 ? 'You missed ' + f.recentMissed + ' of your last ' + f.recentN + ' ' + name + ' questions.'
          : 'You have ' + f.correct + ' of ' + plural(f.total, 'answer') + ' right in ' + name + ', and the last few are mixed.';
        if (ws) why += ' Most of the misses are ' + STYLE_PHRASE[ws.t] + ', so I\'ll start there.';
        chips.push(f.recentMissed + ' of last ' + f.recentN + ' missed', f.correct + ' of ' + f.total + ' correct overall', f.label);
      } else {
        why = 'Your skill check put ' + name + ' at ' + f.pct + '%, ' + (f === focusArea(areas) && f.status === 'attention' ? 'your lowest area' : 'one to build on') +
          '. A short practice session shows me which kind of question trips you up, so I can aim the next one.';
        chips.push('Skill check: ' + f.pct + '%', f.label);
      }
      if (ready) why += ' I\'ll bring in “' + ready.title.replace(/^Lesson \d+:\s*/, '') + '” if you need it.';
      return { kind: 'practice', area: f.key, title: 'Targeted ' + name + ' session', why: why, chips: chips, minutes: 10,
        action: { label: 'Start session', href: '/practice?area=' + f.key }, ready: ready };
    }
    // nothing needs attention: carry on with a course, else keep it fresh
    if (ctx.resume) {
      return { kind: 'learn', area: ctx.resume.domain || null, title: 'Lesson ' + ctx.resume.next + ' of ' + ctx.resume.total + ': ' + ctx.resume.title,
        why: 'Your areas are holding up. You\'re ' + ctx.resume.pct + '% through this course, and finishing what you started is the fastest win.',
        chips: [ctx.resume.done + ' of ' + ctx.resume.total + ' lessons done'], minutes: 5,
        action: { label: 'Continue with lesson ' + ctx.resume.next, href: '/lesson?course=' + ctx.resume.courseId + '&lesson=' + ctx.resume.next }, ready: null };
    }
    var stale = areas.filter(function (a) { return a.total; }).sort(function (a, b) { return lastAt(log, a.key) - lastAt(log, b.key); })[0] || areas[0];
    return { kind: 'review', area: stale.key, title: 'Keep ' + stale.name + ' fresh', minutes: 8,
      why: 'Everything is strong right now. A short mixed session on the area you practised longest ago keeps it that way.',
      chips: [stale.label], action: { label: 'Start session', href: '/practice?area=' + stale.key }, ready: null };
  }
  function lastAt(log, d) { var a = areaLog(log, d); return a.length ? a[a.length - 1].at : 0; }

  // "Or, if you'd rather": up to three other good options, each with a reason.
  function alternatives(ctx, main) {
    var now = ctx.now || Date.now(), areas = readiness(ctx), out = [];
    if (!ctx.pct) return out;
    var second = areas.filter(function (a) { return a.key !== (main && main.area) && (a.status === 'developing' || a.status === 'attention'); })
      .sort(function (a, b) { return (b.recentMissed - a.recentMissed) || ((a.pct || 0) - (b.pct || 0)); })[0];
    if (second) {
      out.push({ kind: 'practice', title: second.name + ' practice', minutes: 10, cta: 'Start',
        why: second.basis === 'practice' ? second.label + ': ' + second.correct + ' of ' + second.total + ' right so far.' + (second.recentMissed ? ' ' + second.recentMissed + ' of your last ' + second.recentN + ' were misses.' : '')
          : second.label + ' on your skill check (' + second.pct + '%). No practice there yet.',
        href: '/practice?area=' + second.key });
    }
    var days = daysSince(ctx.assessedAt, now);
    if (days !== null && days >= 14) {
      out.push({ kind: 'reassess', title: 'Quick reassessment', minutes: 10, cta: 'Reassess',
        why: 'Your last skill check was ' + plural(days, 'day') + ' ago. A fresh one would sharpen my recommendations.', href: ctx.assessUrl || '/' });
    }
    if (main && main.ready) {
      out.push({ kind: 'teach', title: 'Understand the idea first', minutes: main.ready.min || 5, cta: 'Teach me',
        why: 'If you\'d rather read it through before practising: ' + main.ready.title + '.', href: main.ready.href });
    } else if (ctx.resume && (!main || main.kind !== 'learn')) {
      out.push({ kind: 'learn', title: 'Continue ' + ctx.resume.title, minutes: 5, cta: 'Continue',
        why: ctx.resume.done + ' of ' + ctx.resume.total + ' lessons done.', href: '/lesson?course=' + ctx.resume.courseId + '&lesson=' + ctx.resume.next });
    }
    return out.slice(0, 3);
  }

  // The preparation loop: Assess, Find my gaps, Learn, Practice, Explain why, Reassess, each with where they are.
  function loop(ctx) {
    var now = ctx.now || Date.now(), areas = readiness(ctx), log = ctx.log || [], days = daysSince(ctx.assessedAt, now);
    var flagged = areas.filter(function (a) { return a.status === 'attention'; }).length, lessons = ctx.lessonsDone || 0;
    var practiced = log.filter(function (e) { return e.src === 'practice'; }).length;
    var steps = [
      { key: 'assess', label: 'Assess', done: !!ctx.pct, sub: ctx.pct ? (ctx.assessedLabel || 'Skill check done') : 'Not yet' },
      { key: 'gaps', label: 'Find my gaps', done: !!ctx.pct, sub: !ctx.pct ? 'After the skill check' : flagged ? plural(flagged, 'area') + ' flagged' : 'No area flagged' },
      { key: 'learn', label: 'Learn', done: lessons > 0, sub: lessons ? plural(lessons, 'lesson') + ' done' : 'Not started' },
      { key: 'practice', label: 'Practice', done: practiced >= 8, sub: practiced ? plural(practiced, 'answer') : 'Up next' },
      { key: 'why', label: 'Explain why', done: practiced >= 8, sub: 'After each answer' },
      { key: 'reassess', label: 'Reassess', done: false, sub: days === null ? 'After practice' : days >= REASSESS_DAYS ? 'Due now' : 'Suggested in ' + plural(REASSESS_DAYS - days, 'day') }
    ];
    var current = 0;
    while (current < steps.length - 1 && steps[current].done) current++;
    return { steps: steps, current: current };
  }

  // Recent activity, newest first: practice sessions, lesson checks and refreshers (grouped by day and area), and
  // lessons finished (progress.lessonLog: { 'YYYY-MM-DD': n }). Each: { at, kind, d, title, detail, flag }, where
  // flag is 'review' when most of the answers were misses, 'good' when they were all right.
  var SRC = { practice: 'Practised', lesson: 'Lesson check in', review: 'Refresher in' };
  function activity(ctx, max) {
    var log = ctx.log || [], groups = {}, out = [];
    log.forEach(function (e) {
      if (!e || !e.at) return;
      var day = new Date(e.at).toDateString(), src = SRC[e.src] ? e.src : 'lesson', k = day + '|' + e.d + '|' + src;
      var g = groups[k] || (groups[k] = { at: 0, kind: src, d: e.d, n: 0, right: 0 });
      g.at = Math.max(g.at, e.at); g.n++; if (e.ok) g.right++;
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], name = areaName(ctx, g.d);
      out.push({ at: g.at, kind: g.kind, d: g.d, title: SRC[g.kind] + ' ' + name,
        detail: g.n === 1 ? (g.right ? 'Right' : 'Missed') : g.right + ' of ' + g.n + ' right',
        flag: g.n - g.right >= 2 && g.right / g.n < 0.5 ? 'review' : g.right === g.n ? 'good' : '' });
    });
    var lessonLog = ctx.lessonLog || (ctx.progress && ctx.progress.lessonLog) || {};
    Object.keys(lessonLog).forEach(function (day) {
      var n = +lessonLog[day] || 0, t = new Date(day + 'T00:00:00').getTime();   // the start of the day: below that day's sessions
      if (n > 0 && isFinite(t)) out.push({ at: t, kind: 'lessons', d: null, title: 'Finished ' + plural(n, 'lesson'), detail: '', flag: 'good' });
    });
    return out.sort(function (a, b) { return b.at - a.at; }).slice(0, max || 6);
  }
  // "Today", "Yesterday", or a short date.
  function when(at, now) {
    var d = new Date(at), today = new Date(now || Date.now());
    var days = Math.round((new Date(today.toDateString()) - new Date(d.toDateString())) / 864e5);
    return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // What has changed since a moment (the start of today, by default): areas whose status moved, and the answers given
  // since. { answers, right, moves: [{ d, name, from, to, up }], line }.
  function changes(ctx, since) {
    var now = ctx.now || Date.now(), from = since || new Date(new Date(now).toDateString()).getTime(), log = ctx.log || [];
    var after = log.filter(function (e) { return e.at >= from; });
    var before = readiness(Object.assign({}, ctx, { log: log.filter(function (e) { return e.at < from; }) }));
    var nowR = readiness(ctx), rank = { unknown: -1, attention: 0, developing: 1, strong: 2 };
    var moves = [];
    nowR.forEach(function (a, i) {
      var b = before[i];
      if (b && b.status !== a.status && a.status !== 'unknown') moves.push({ d: a.key, name: a.name, from: b.label, to: a.label, up: rank[a.status] > rank[b.status] });
    });
    var right = after.filter(function (e) { return e.ok; }).length, line;
    if (!after.length) line = 'Nothing new yet today. One focused session is enough for me to start updating this.';
    else {
      line = 'Today: ' + plural(after.length, 'answer') + ', ' + right + ' right.';
      if (moves.length) line += ' ' + moves.map(function (m) { return m.name + ' ' + (m.up ? 'moved up' : 'slipped') + ' to ' + m.to; }).join('; ') + '.';
      else line += ' No area has changed status yet.';
    }
    return { answers: after.length, right: right, moves: moves, line: line };
  }

  // Practice: the next question for an area. Unseen before seen, at the level asked for (or the nearest), never the
  // one just asked. level: 0-3 (novice to advanced). Returns a bank question or null.
  function pickQuestion(bank, d, level, askedIds, log, style) {
    var qs = ((bank && bank.questions) || []).filter(function (q) { return q.d === d && (askedIds || []).indexOf(q.id) < 0; });
    if (!qs.length) return null;
    var seen = {};
    (log || []).forEach(function (e) { seen[e.id] = (seen[e.id] || 0) + 1; });
    var lvl = function (q) { return TIERS.indexOf(q.tier); };
    qs.sort(function (a, b) {
      return ((seen[a.id] || 0) - (seen[b.id] || 0))
        || (style ? (a.t === style ? 0 : 1) - (b.t === style ? 0 : 1) : 0)
        || (Math.abs(lvl(a) - level) - Math.abs(lvl(b) - level))
        || a.id.localeCompare(b.id);
    });
    return qs[0];
  }
  // How a practice session adapts after each answer, from this session's answers so far (true/false, oldest first):
  // two right in a row and the level goes up ('harder'); two misses in a row and the coach offers to slow down or
  // teach the idea first ('offer'); otherwise carry on (null). Not twice in a row for the same pair.
  function adapt(answers) {
    var n = (answers || []).length;
    if (n < 2) return null;
    var a = answers[n - 1], b = answers[n - 2], c = n >= 3 ? answers[n - 3] : null;
    if (a && b && !(c === true && n >= 3 && answers[n - 4] === true)) return 'harder';
    if (!a && !b && c !== false) return 'offer';
    return null;
  }
  // The recap at the end of a session: "3 of 4 right", and the one line the coach says about it.
  function recap(answers, areaName) {
    var right = (answers || []).filter(Boolean).length, n = (answers || []).length;
    var line = !n ? 'No answers this time.' : right === n ? 'Every one right. I’ll make the next ' + areaName + ' session harder.'
      : right / n >= 0.5 ? 'More right than not. One more session like this and ' + areaName + ' moves up.'
      : 'This is the area to keep working on. Reading the idea through first usually helps.';
    return { right: right, n: n, line: line };
  }

  // The level to start an area at, from the skill check (0-3).
  function startLevel(pct, d) { var p = pct && typeof pct[d] === 'number' ? pct[d] : 0; return p > 75 ? 3 : p > 50 ? 2 : p > 25 ? 1 : 0; }

  root.CoachCore = { STYLES: STYLES, STYLE_PHRASE: STYLE_PHRASE, STATUS: STATUS, STAGES: STAGES, TIERS: TIERS, LOG_MAX: LOG_MAX, REASSESS_DAYS: REASSESS_DAYS,
    qType: qType, record: record, readiness: readiness, stage: stage, styles: styles, weakStyle: weakStyle, lessonFor: lessonFor,
    nextStep: nextStep, alternatives: alternatives, loop: loop, activity: activity, when: when, changes: changes, pickQuestion: pickQuestion, startLevel: startLevel, adapt: adapt, recap: recap };
})(typeof window !== 'undefined' ? window : globalThis);
