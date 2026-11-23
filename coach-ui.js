/* The coach on My Learning (lms-dashboard.html): the Coach, My readiness and My gaps tabs, and the small coach card
   on Home. The thinking is in coach-core.js; this file only draws it. CoachUI.render(state) where state is
   { areas: {key: name}, pct, assessedAt, log, progress, bank, resume, lessonsDone, assessUrl, name } */
(function (root) {
  'use strict';
  var C = root.CoachCore;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>';
  var ARROW = '<span aria-hidden="true"> →</span>';
  // What each area is about, in a line (the readiness and gap cards)
  var ABOUT = {
    discovery: 'Find real customer problems and test ideas before building.',
    strategy: 'Set direction, turn it into a roadmap, and keep people behind it.',
    prioritization: 'Decide what to build next, and say no with a reason.',
    execution: 'Ship predictably, with quality, and learn from what ships.',
    stakeholder: 'Align and influence the people around the product.',
    aiIndividual: 'Use AI well in your own product work.',
    aiOrg: 'Help your organization adopt AI with structure and care.'
  };
  function chip(status, label) { return '<span class="cc-chip cc-' + status + '"><i aria-hidden="true"></i>' + esc(label) + '</span>'; }
  function dots(last8) {
    if (!last8.length) return '';
    var n = last8.filter(Boolean).length;
    return '<span class="cc-dots" role="img" aria-label="' + n + ' of the last ' + last8.length + ' right">' +
      last8.map(function (ok) { return '<i class="' + (ok ? 'ok' : 'miss') + '">' + (ok ? '✓' : '') + '</i>'; }).join('') +
      '</span><span class="cc-dots-n">' + n + ' of last ' + last8.length + '</span>';
  }
  function bar(area) {
    var share = area.total ? area.correct / area.total : (area.pct === null ? 0 : area.pct / 100);
    return '<span class="cc-bar cc-' + area.status + '"><i style="width:' + Math.round(share * 100) + '%"></i></span>';
  }
  function evidence(area) {
    return area.total ? area.correct + ' of ' + area.total + ' answers right' : area.pct !== null ? 'Skill check: ' + area.pct + '%' : 'Nothing yet';
  }

  // ---------------------------------------------------------------- the Coach tab
  function coachTab(s, next, alts, areas, stage) {
    var html = '';
    html += '<section class="card cc-next" aria-labelledby="ccNextTitle"><div class="cc-next-ico" aria-hidden="true">' + ICON + '</div><div class="cc-next-main">' +
      '<span class="eyebrow">Here’s what I’d do next</span><h2 id="ccNextTitle">' + esc(next.title) + '</h2><p class="cc-why">' + esc(next.why) + '</p>' +
      (next.chips.length ? '<div class="cc-chips">' + next.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '') +
      (next.ready ? '<a class="cc-ready" href="' + esc(next.ready.href) + '"><span class="cc-ready-k">Ready if you need it:</span> <b>' + esc(next.ready.title) + '</b><span class="cc-ready-m">' + next.ready.min + ' min</span></a>' : '') +
      '</div><div class="cc-next-go"><a class="cc-btn" href="' + esc(next.action.href) + '" data-coach-go="' + esc(next.kind) + '">' + esc(next.action.label) + ARROW + '</a>' +
      '<span class="cc-min">About ' + next.minutes + ' min</span></div></section>';
    if (alts.length) {
      html += '<h3 class="cc-sub">Or, if you’d rather</h3><div class="cc-alts">' + alts.map(function (a) {
        return '<a class="card cc-alt" href="' + esc(a.href) + '" data-coach-go="' + esc(a.kind) + '"><span class="cc-alt-top"><b>' + esc(a.title) + '</b><span>' + a.minutes + ' min</span></span>' +
          '<span class="cc-alt-why">' + esc(a.why) + '</span><span class="cc-alt-cta">' + esc(a.cta) + ARROW + '</span></a>';
      }).join('') + '</div>';
    }
    var lp = C.loop(s);
    html += '<div class="cc-row"><section class="card cc-loop" aria-labelledby="ccLoopTitle"><h3 id="ccLoopTitle">Your learning loop</h3>' +
      '<p class="cc-muted">Assess, find the gaps, learn, practise, understand why, then check again. Compass keeps you moving round it.</p><ol class="cc-steps">' +
      lp.steps.map(function (st, i) {
        var state = st.done ? 'done' : i === lp.current ? 'now' : 'todo';
        return '<li class="cc-step ' + state + '"' + (state === 'now' ? ' aria-current="step"' : '') + '><span class="cc-step-n" aria-hidden="true">' + (st.done ? '✓' : i + 1) + '</span>' +
          '<b>' + esc(st.label) + '</b><small>' + esc(st.sub) + '</small></li>';
      }).join('') + '</ol></section>' +
      '<section class="card cc-ready-sum" aria-labelledby="ccReadySumTitle"><div class="cc-sum-head"><h3 id="ccReadySumTitle">My readiness</h3><span>Status: <b>' + esc(stage.label) + '</b></span></div><ul>' +
      areas.map(function (a) { return '<li><span>' + esc(a.name) + '</span>' + chip(a.status, a.label) + '</li>'; }).join('') +
      '</ul><button type="button" class="linklike" data-ltab-go="readiness">View readiness' + ARROW + '</button></section></div>';
    return html;
  }

  // ---------------------------------------------------------------- My readiness
  function readinessTab(s, areas, stage) {
    var answers = (s.log || []).length;
    var html = '<section class="card cc-stage"><div class="cc-stage-head"><div><span class="cc-muted">Overall</span><h2>' + esc(stage.label) + '</h2></div>' +
      '<span class="cc-muted">' + (answers ? 'Based on ' + answers + ' answer' + (answers === 1 ? '' : 's') : 'Based on') + (s.pct ? (answers ? ' and' : '') + ' your skill check' : '') + '</span></div><ol class="cc-stage-steps">' +
      stage.steps.map(function (st, i) { return '<li class="' + (i <= stage.index ? 'on' : '') + (i === stage.index ? ' now' : '') + '"><i aria-hidden="true"></i><b>' + esc(st.label) + '</b><small>' + esc(st.sub) + '</small></li>'; }).join('') +
      '</ol><p class="cc-note">This is how your learning is going, from your skill check and the questions you answer. It isn’t a grade, and it changes as you practise.</p></section>' +
      '<h3 class="cc-sub">By skill area</h3><div class="cc-areas">' +
      areas.map(function (a) {
        return '<section class="card cc-area"><div class="cc-area-head"><h4>' + esc(a.name) + '</h4>' + chip(a.status, a.label) + '</div><p class="cc-muted">' + esc(ABOUT[a.key] || '') + '</p>' +
          bar(a) + '<p class="cc-area-ev">' + esc(evidence(a)) + (a.total && a.pct !== null ? ' · skill check ' + a.pct + '%' : '') + '</p>' + (a.last8.length ? '<p class="cc-area-dots">' + dots(a.last8) + '</p>' : '') +
          '<a class="cc-area-go" href="/practice?area=' + esc(a.key) + '">' + (a.total ? 'Practise' : 'Start practising') + ARROW + '</a></section>';
      }).join('') + '</div>';
    return html;
  }

  // ---------------------------------------------------------------- My gaps
  function understanding(s, a) {
    var st = C.styles(s.log, a.key), ws = C.weakStyle(s.log, a.key);
    if (!a.total) return a.pct === null ? 'Nothing to go on yet. A few practice questions will show where you stand.' : 'From your skill check only (' + a.pct + '%). A few practice questions will show which kind of question trips you up.';
    var good = st.filter(function (x) { return x.correct / x.total >= 0.75 && x.total >= 2; });
    var P = C.STYLE_PHRASE;
    if (ws && good.length) return 'You’re getting ' + P[good[0].t] + ' right; ' + P[ws.t] + ' are where the misses are.';
    if (ws) return 'Most of the misses are ' + P[ws.t] + '.';
    if (a.status === 'strong') return 'Solid across the questions you’ve answered.';
    return 'No clear pattern in the misses yet. A few more answers will show one.';
  }
  function nextAction(a) {
    return a.status === 'attention' ? 'Read the idea through, then work three applied questions.' : a.status === 'developing' ? 'Mix in a few harder questions a couple of times a week.' : a.status === 'strong' ? 'A quick check now and then keeps it fresh.' : 'Answer a few practice questions so I can see where you stand.';
  }
  function gapsTab(s, next, areas) {
    var html = '';
    if (next.kind === 'practice' || next.kind === 'assess') {
      html += '<section class="card cc-next cc-opp"><div class="cc-next-ico" aria-hidden="true">' + ICON + '</div><div class="cc-next-main"><span class="eyebrow">Biggest opportunity</span><h2>' + esc(next.title) + '</h2>' +
        '<p class="cc-why">' + esc(next.why) + '</p></div><div class="cc-next-go"><a class="cc-btn" href="' + esc(next.action.href) + '">' + esc(next.action.label) + ARROW + '</a></div></section>';
    }
    var st = C.styles(s.log);
    html += '<section class="card cc-styles"><div class="cc-sum-head"><h3>How you answer, by kind of question</h3><span class="cc-muted">All areas · ' + (s.log || []).length + ' answers</span></div>';
    if (st.length) {
      html += '<p class="cc-muted">I look at which <em>kind</em> of question you miss, not just which topic. It shows whether the gap is the idea itself or using it.</p><ul class="cc-style-bars">' +
        st.map(function (x) {
          var r = x.correct / x.total, cls = r >= 0.75 ? 'strong' : r >= 0.5 ? 'developing' : 'attention';
          return '<li><span>' + esc(x.label) + '</span><span class="cc-bar cc-' + cls + '"><i style="width:' + Math.round(r * 100) + '%"></i></span><span class="cc-muted">' + x.correct + ' of ' + x.total + ' right</span></li>';
        }).join('') + '</ul>';
    } else {
      html += '<p class="cc-muted">Answer a few questions (in a lesson, a refresher or Practice) and this shows which kind of question you find hardest.</p>';
    }
    html += '</section>';
    [['attention', 'Needs attention'], ['developing', 'Developing'], ['strong', 'Strong'], ['unknown', 'Not yet known']].forEach(function (g) {
      var list = areas.filter(function (a) { return a.status === g[0]; });
      if (!list.length) return;
      html += '<h3 class="cc-sub cc-group"><i class="cc-dot cc-' + g[0] + '" aria-hidden="true"></i>' + g[1] + ' <span class="cc-muted">(' + list.length + ')</span></h3>';
      list.forEach(function (a) {
        var lesson = C.lessonFor(s, a.key);
        if (!a.total) {   // nothing answered yet: one compact row
          html += '<section class="card cc-gap compact"><div><h4>' + esc(a.name) + '</h4><p class="cc-muted">' + esc(a.pct !== null ? 'Skill check ' + a.pct + '% \u00b7 no practice yet' : 'No practice yet') + '</p></div>' + chip(a.status, a.label) +
            '<div class="cc-gap-go"><a class="cc-btn sm" href="/practice?area=' + esc(a.key) + '">Practice</a>' + (lesson ? '<a class="cc-btn ghost sm" href="' + esc(lesson.href) + '">Teach me</a>' : '') + '</div></section>';
          return;
        }
        html += '<section class="card cc-gap"><div class="cc-area-head"><div><h4>' + esc(a.name) + '</h4><p class="cc-muted">' + esc(ABOUT[a.key] || '') + '</p></div>' + chip(a.status, a.label) + '</div>' +
          '<div class="cc-gap-cols"><div><span class="cc-k">Where you are</span><p>' + esc(understanding(s, a)) + '</p></div>' +
          '<div><span class="cc-k">Recent answers</span><p>' + (a.last8.length ? dots(a.last8) + '<br><span class="cc-muted">' + a.correct + ' of ' + a.total + ' right overall</span>' : '<span class="cc-muted">' + esc(evidence(a)) + '</span>') + '</p></div>' +
          '<div><span class="cc-k">Suggested next</span><p>' + esc(nextAction(a)) + '</p></div></div>' +
          '<div class="cc-gap-go">' + (lesson ? '<a class="cc-btn sm" href="' + esc(lesson.href) + '">Teach me</a>' : '') +
          '<a class="cc-btn ghost sm" href="/practice?area=' + esc(a.key) + '">Practice</a>' +
          (lesson ? '<a class="cc-btn ghost sm" href="/lesson?course=' + esc(lesson.courseId) + '">Review the course</a>' : '') + '</div></section>';
      });
    });
    return html;
  }

  // ---------------------------------------------------------------- Home: a small coach card
  // Example questions for the "Ask Compass…" box, from what Compass suggests and where the learner is. A click puts one
  // in the box (it isn't sent until they press Ask).
  function examples(s, next) {
    var name = next.area ? ((s && s.areas) || {})[next.area] || '' : '';
    var out = ['Why is this my next step?'];
    if (name) out.push('Explain ' + name + ' in plain English');
    out.push(next.kind === 'assess' ? 'What does the assessment cover?' : 'Plan my learning for this week');
    return out.slice(0, 3);
  }
  function homeCard(s, next) {
    var icon = (root.PAIcons && root.PAIcons.compass) || ICON;
    return '<div class="cc-home-ico cc-home-compass" aria-hidden="true">' + icon + '</div><div class="cc-home-main"><span class="eyebrow">Compass Suggests</span>' +
      '<p class="cc-home-t"><b>' + esc(next.title) + '.</b> ' + esc(next.why.split(/(?<=\.)\s/)[0]) + '</p>' +
      '<form class="cc-ask cc-ask-sm" data-coach-ask><input type="text" maxlength="300" placeholder="Ask Compass…" aria-label="Ask Compass"><button type="submit" aria-label="Ask">↑</button></form>' +
      '<div class="cc-try" aria-label="Example questions"><span>Try:</span>' + examples(s, next).map(function (q) {
        return '<button type="button" class="cc-try-q" data-try="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div>' +
      '<div class="cc-home-go"><a class="cc-btn sm" href="' + esc(next.action.href) + '" data-coach-go="' + esc(next.kind) + '">' + esc(next.action.label) + '</a>' +
      '<a class="linklike" href="/my-learning">Open My Learning' + ARROW + '</a></div>';
  }

  // The ask box: answers from the lessons (Ask, in pa-shell.js) for now.
  function wireAsk(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('[data-coach-ask]'), function (f) {
      if (f._wired) return; f._wired = true;
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = f.querySelector('input').value.trim();
        if (!q) return;
        if (root.PAAnalytics) root.PAAnalytics.event('coach_ask', { len: q.length, to: 'compass' });
        // Compass answers it, in its panel; without it (an old cached page), the coach does
        var sh = root.PAShell;
        if (sh && sh.askCompass) { f.querySelector('input').value = ''; sh.askCompass(q).catch(function () { root.location.href = '/coach?q=' + encodeURIComponent(q); }); }
        else root.location.href = '/coach?q=' + encodeURIComponent(q);
      });
      // the example questions: a click fills the box
      Array.prototype.forEach.call((f.parentNode || f).querySelectorAll('[data-try]'), function (b) {
        b.addEventListener('click', function () { var i = f.querySelector('input'); i.value = b.getAttribute('data-try'); i.focus(); if (root.PAAnalytics) root.PAAnalytics.event('compass_try', {}); });
      });
    });
  }

  function render(s) {
    if (!C) return;
    var areas = C.readiness(s), stage = C.stage(areas), next = C.nextStep(s), alts = C.alternatives(s, next);
    if ($('coachPanel')) $('coachPanel').innerHTML = coachTab(s, next, alts, areas, stage);
    if ($('readinessPanel')) $('readinessPanel').innerHTML = readinessTab(s, areas, stage);
    if ($('gapsPanel')) $('gapsPanel').innerHTML = gapsTab(s, next, areas);
    var home = $('coachHome');
    if (home) { home.innerHTML = homeCard(s, next); home.hidden = false; }
    wireAsk(document);
    Array.prototype.forEach.call(document.querySelectorAll('[data-coach-go]'), function (a) {
      if (a._wired) return; a._wired = true;
      a.addEventListener('click', function () { if (root.PAAnalytics) root.PAAnalytics.event('coach_go', { kind: a.getAttribute('data-coach-go') }); });
    });
    return { next: next, areas: areas, stage: stage };
  }

  root.CoachUI = { render: render, wireAsk: wireAsk, ABOUT: ABOUT };
})(typeof window !== 'undefined' ? window : globalThis);
