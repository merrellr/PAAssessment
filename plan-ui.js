// plan-ui.js: draws the Compass study plan (plan-core.js) on My Learning (the "My plan" tab, #planPanel) and on Home
// (#homePlan). With no plan yet, the tab asks three questions and shows the plan before it's saved.
//   PlanUI.render(ctx, { save: function (planOrNull) { return Promise } })
// ctx is the coach's context (areas, pct, log, progress, bank, assessUrl, assessedAt, now).
(function (root) {
  var P = root.PlanCore;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var ARROW = '<span aria-hidden="true"> →</span>';
  var KIND = { lesson: 'Lesson', practice: 'Practice', check: 'Skill check' };
  var answers = { aim: '', weeks: null, hours: null }, preview = null, ctx0 = null, opts0 = {};

  function icon() { return (root.CompassCore && root.CompassCore.ICON) || (root.PAIcons && root.PAIcons.compass) || ''; }
  function day(t) { return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function hm(min) { var h = Math.floor(min / 60), m = Math.round(min % 60 / 5) * 5; return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m || !h ? m + ' min' : ''); }
  function area(d) { return (ctx0.areas || {})[d] || d; }

  // ---------------------------------------------------------------- the questions
  function group(key, q, list) {
    return '<fieldset class="pl-q"><legend>' + esc(q) + '</legend><div class="pl-opts" role="radiogroup">' + list.map(function (o) {
      var on = String(answers[key]) === String(o.v);
      return '<button type="button" role="radio" aria-checked="' + on + '" class="pl-opt' + (on ? ' on' : '') + '" data-pl="' + key + '" data-v="' + esc(o.v) + '">' + esc(o.label) + '</button>';
    }).join('') + '</div></fieldset>';
  }
  function builder() {
    var aims = Object.keys(P.AIMS).map(function (k) { return { v: k, label: P.AIMS[k].label }; });
    var ready = answers.aim && answers.weeks !== null && answers.hours !== null;
    return '<section class="card pl-build" aria-labelledby="plBuildT"><div class="pl-head"><span class="pl-mark" aria-hidden="true">' + icon() + '</span>' +
      '<div><span class="eyebrow">Compass study plan</span><h2 id="plBuildT">Let Compass build your study plan</h2>' +
      '<p class="cc-muted">Answer three quick questions. Compass uses your skill check and your answers so far to plan each week: which lessons, how much practice, and when to check again.</p></div></div>' +
      group('aim', 'What are you working toward?', aims) +
      group('weeks', 'By when?', P.WHEN) +
      group('hours', 'How much time a week?', P.HOURS) +
      '<div class="pl-go"><button type="button" class="cc-btn" data-pl-act="build"' + (ready ? '' : ' disabled') + '>Build my plan' + ARROW + '</button>' +
      (ready ? '' : '<span class="cc-muted">Choose an answer to each question.</span>') + '</div></section>';
  }

  // ---------------------------------------------------------------- a week, and the plan
  function item(it, live) {
    var mark = live ? '<span class="pl-tick' + (it.done ? ' done' : '') + '" aria-hidden="true">' + (it.done ? '✓' : '') + '</span>' : '<span class="pl-tick" aria-hidden="true"></span>';
    return '<li class="pl-item' + (it.done ? ' done' : '') + '">' + mark + '<span class="pl-k">' + esc(KIND[it.k]) + '</span>' +
      '<a href="' + esc(it.href) + '" data-pl-go="' + it.k + '">' + esc(it.title) + '</a>' +
      '<span class="pl-m">' + (it.part && !it.done ? esc(it.part) : it.min + ' min') + (live && it.done ? '<span class="sr-only"> (done)</span>' : '') + '</span></li>';
  }
  function weekCard(w, i, live) {
    var mins = w.items.reduce(function (n, x) { return n + x.min; }, 0), open = !live || w.state === 'now';
    var head = '<span class="pl-wn">Week ' + (i + 1) + '</span>' + (live ? '<span class="pl-wd">' + day(w.from) + ' – ' + day(w.to - 864e5) + '</span>' : '') +
      '<b>' + esc(area(w.d)) + '</b>' + (live ? '<span class="pl-wp">' + (w.complete ? '<span class="pl-done">Done</span>' : w.done + ' of ' + w.total) + '</span>' : '<span class="pl-wp">' + hm(mins) + '</span>');
    return '<details class="card pl-week' + (live ? ' s-' + w.state : '') + '"' + (open ? ' open' : '') + '><summary>' + head + '</summary>' +
      '<p class="pl-why">' + esc(w.why) + '</p><ul class="pl-items">' + w.items.map(function (x) { return item(x, live); }).join('') + '</ul></details>';
  }
  function previewView(plan) {
    var s = P.summary(plan), per = Math.round(s.minutes / plan.list.length);
    return '<section class="card pl-sum" aria-labelledby="plPrevT"><span class="eyebrow">Your plan, before you save it</span><h2 id="plPrevT">' + esc(P.AIMS[plan.aim].label) + ': ' + plan.list.length + ' weeks</h2>' +
      '<p>' + s.lessons + ' lessons and ' + s.sessions + ' practice sessions across ' + s.areas.map(area).join(', ') + ', about ' + hm(per) + ' a week' +
      (per < plan.hours * 60 - 20 ? ' (less than the ' + plan.hours + ' hours you have: there are only so many new lessons, so the rest is yours)' : '') + '. ' +
      (plan.weeks >= 2 ? 'It ends with a fresh skill check to see how far you’ve come.' : '') + '</p>' +
      '<div class="pl-go"><button type="button" class="cc-btn" data-pl-act="save">Use this plan' + ARROW + '</button><button type="button" class="cc-btn ghost" data-pl-act="edit">Change my answers</button></div></section>' +
      '<div class="pl-weeks">' + plan.list.map(function (w, i) { return weekCard(w, i, false); }).join('') + '</div>';
  }
  function planView(st) {
    var pctDone = Math.round(100 * st.weeks.reduce(function (n, w) { return n + w.done; }, 0) / Math.max(1, st.weeks.reduce(function (n, w) { return n + w.total; }, 0)));
    var nx = st.next;
    return '<section class="card pl-sum" aria-labelledby="plT"><div class="pl-sum-top"><div><span class="eyebrow">Your study plan · ' + esc(st.aimLabel) + '</span>' +
      '<h2 id="plT">' + (st.allDone ? 'Plan complete' : st.over ? 'Plan ended ' + day(st.ends) : 'Week ' + (st.current + 1) + ' of ' + st.weeks.length) + '</h2>' +
      '<p class="pl-line">' + esc(st.line.replace(/^Week \d+ of \d+: (\w)/, function (m, c) { return c.toUpperCase(); })) + '</p></div>' +
      '<div class="pl-ring" role="img" aria-label="' + pctDone + '% of the plan done" style="--p:' + pctDone + '"><span>' + pctDone + '%</span></div></div>' +
      (nx && !st.allDone ? '<a class="cc-ready pl-next" href="' + esc(nx.href) + '" data-pl-go="next"><span class="cc-ready-k">Next in your plan:</span> <b>' + esc(nx.title) + '</b><span class="cc-ready-m">' + nx.min + ' min</span></a>' : '') +
      '<p class="cc-muted pl-meta">' + (st.dated ? 'Ends ' + day(st.ends) : 'No end date') + ' · about ' + st.hours + ' h a week. Lessons tick off as you finish them, practice as you answer questions in that area.</p>' +
      '<div class="pl-go"><button type="button" class="cc-btn ghost sm" data-pl-act="new">Make a new plan</button><button type="button" class="linklike" data-pl-act="remove">Remove my plan</button></div></section>' +
      '<div class="pl-weeks">' + st.weeks.map(function (w, i) { return weekCard(w, i, true); }).join('') + '</div>';
  }

  // ---------------------------------------------------------------- Home
  function homeView(st) {
    if (!st) {
      return '<div class="hp-ask"><span class="pl-mark sm" aria-hidden="true">' + icon() + '</span><div><b>Want a plan?</b> <span class="cc-muted">Compass can build you a week-by-week study plan in three questions.</span></div>' +
        '<a class="cc-btn sm" href="/my-learning#plan" data-pl-go="home-new">Build my plan</a></div>';
    }
    var w = st.week, todo = w.items.filter(function (x) { return !x.done; }).slice(0, 3);
    return '<div class="hp-head"><span class="eyebrow">This week in your plan</span><span class="hp-wk">' + (st.over ? 'Plan ended' : 'Week ' + w.n + ' of ' + st.weeks.length) + ' · ' + esc(area(w.d)) + '</span></div>' +
      '<p class="hp-line">' + esc(st.line) + '</p>' +
      (todo.length && !st.allDone ? '<ul class="pl-items">' + todo.map(function (x) { return item(x, true); }).join('') + '</ul>' : '') +
      '<div class="home-go"><a class="more" href="/my-learning#plan">See my whole plan' + ARROW + '</a></div>';
  }

  // ---------------------------------------------------------------- draw and wire
  function draw() {
    var plan = ctx0.progress && ctx0.progress.studyPlan, st = plan ? P.status(plan, ctx0) : null;
    var panel = $('planPanel');
    if (panel) panel.innerHTML = preview ? previewView(preview) : st ? planView(st) : builder();
    var home = $('homePlan');
    if (home) { home.innerHTML = homeView(st); home.hidden = !ctx0.pct; home.classList.toggle('has-plan', !!st); }
    wire();
    return st;
  }
  function wire() {
    Array.prototype.forEach.call(document.querySelectorAll('#planPanel [data-pl]'), function (b) {
      b.onclick = function () { var k = b.getAttribute('data-pl'), v = b.getAttribute('data-v'); answers[k] = k === 'aim' ? v : +v; draw(); var x = document.querySelector('#planPanel [data-pl="' + k + '"][data-v="' + v + '"]'); if (x) x.focus(); };
      b.onkeydown = function (e) {   // arrow keys move along a group, as radio buttons do
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!step) return;
        e.preventDefault(); var all = Array.prototype.slice.call(b.parentNode.children), n = all[(all.indexOf(b) + step + all.length) % all.length]; n.click();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-pl-act]'), function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-pl-act'), ev = root.PAAnalytics ? root.PAAnalytics.event.bind(root.PAAnalytics) : function () {};
        if (a === 'build') { preview = P.build(ctx0, answers); ev('plan_preview', { aim: answers.aim, weeks: answers.weeks, hours: answers.hours }); draw(); focusTop(); }
        else if (a === 'edit') { preview = null; draw(); focusTop(); }
        else if (a === 'new') { var old = ctx0.progress.studyPlan || {}; answers = { aim: old.aim || '', weeks: old.dated ? old.weeks : old.weeks ? 0 : null, hours: old.hours || null }; preview = null; ctx0.progress.studyPlan = null; draw(); focusTop(); }
        else if (a === 'save') {
          var plan = preview; b.disabled = true;
          Promise.resolve(opts0.save && opts0.save(plan)).then(function () {
            ctx0.progress.studyPlan = plan; preview = null; ev('plan_saved', { aim: plan.aim, weeks: plan.weeks, hours: plan.hours }); draw(); focusTop();
          }).catch(function () { b.disabled = false; b.insertAdjacentHTML('afterend', '<span class="pl-err" role="alert">Couldn’t save your plan just now. Try again.</span>'); });
        } else if (a === 'remove') {
          if (!root.confirm('Remove your study plan? Your lessons and answers stay as they are.')) return;
          Promise.resolve(opts0.save && opts0.save(null)).then(function () { ctx0.progress.studyPlan = null; ev('plan_removed', {}); draw(); focusTop(); });
        }
      };
    });
  }
  function focusTop() { var h = document.querySelector('#planPanel h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: false }); } }

  // The plan's status for others (the Compass Suggests chip, the check-ins): null with no plan.
  function render(ctx, opts) {
    if (!P) return null;
    ctx0 = ctx; opts0 = opts || {};
    if (!ctx0.progress) ctx0.progress = {};
    return draw();
  }

  root.PlanUI = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
