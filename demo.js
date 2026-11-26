// demo.js: the live demo (?demo=1 on My Learning, Practice and lessons, for anyone signed in). A fictional
// learner, Alex Rivera, with a skill check, finished lessons, practice answers over the last two weeks and a study
// plan, so a buyer sees every part of Compass working. Nothing is read from or written to anyone's account: the pages
// load DemoCore.progress() instead of the owner's record, and every write is skipped (window.__paDemo).
// DemoUI.script() adds the banner and the demo script: what to show, in order, with a "Show me" for each.
(function (root) {
  var DAY = 864e5;
  var NAME = 'Alex Rivera';
  var PCT = { discovery: 72, strategy: 48, prioritization: 61, execution: 78, stakeholder: 55, aiIndividual: 38, aiOrg: 44 };

  // Answers: [area, days ago, kind, right?]. Strategy: the idea is understood, applying it is where the misses are,
  // and today's session moves it up. AI Fluency (you): few answers, mostly missed. Execution: solid.
  var ANSWERS = [
    ['strategy', 12, 'knowledge', 1], ['strategy', 12, 'scenario', 0], ['strategy', 12, 'scenario', 0], ['strategy', 12, 'knowledge', 1],
    ['execution', 10, 'knowledge', 1], ['execution', 10, 'decision', 1], ['execution', 10, 'scenario', 1], ['execution', 10, 'data', 1],
    ['aiIndividual', 8, 'knowledge', 0], ['aiIndividual', 8, 'scenario', 0], ['aiIndividual', 8, 'knowledge', 1],
    ['strategy', 5, 'scenario', 0], ['strategy', 5, 'knowledge', 1], ['strategy', 5, 'scenario', 0], ['strategy', 5, 'decision', 0],
    ['discovery', 3, 'knowledge', 1, 'lesson'], ['discovery', 3, 'scenario', 1, 'lesson'],
    ['prioritization', 2, 'decision', 1], ['prioritization', 2, 'data', 0], ['prioritization', 2, 'scenario', 1], ['prioritization', 2, 'knowledge', 1],
    ['strategy', 0, 'scenario', 1], ['strategy', 0, 'scenario', 1], ['strategy', 0, 'knowledge', 1], ['strategy', 0, 'decision', 1]
  ];

  function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  function progress(now) {
    now = now || Date.now();
    var answers = ANSWERS.map(function (a, i) {
      var at = a[1] === 0 ? now - (ANSWERS.length - i) * 90e3 : now - a[1] * DAY - (40 - i) * 60e3;
      return { d: a[0], id: 'demo-' + i, t: a[2], ok: !!a[3], at: at, src: a[4] || 'practice' };
    });
    var lessonLog = {};
    [[14, 2], [11, 1], [6, 2], [3, 1], [1, 1]].forEach(function (x) { lessonLog[dayKey(now - x[0] * DAY)] = x[1]; });
    var taken = new Date(now - 32 * DAY).toISOString();
    return {
      demo: true, hasSeenWelcome: true, agreedToTermsAt: taken, catalogView: 'plan',
      profile: { firstName: 'Alex', lastName: 'Rivera', title: 'Senior Product Manager' },
      courses: {
        'discovery-moderate': { completed: [1, 2, 3], lastLesson: 3, updatedAt: new Date(now - 3 * DAY).toISOString() },
        'strategy-novice': { completed: [1, 2, 3, 4], lastLesson: 4, updatedAt: new Date(now - 6 * DAY).toISOString() },
        'aiIndividual-novice': { completed: [1, 2], lastLesson: 2, updatedAt: new Date(now - 1 * DAY).toISOString() }
      },
      answers: answers, lessonLog: lessonLog, goals: { weeklyLessons: 3, focus: ['strategy', 'aiIndividual'] },
      assessmentResult: { tier: 'Moderate Experience', overallPct: 57, categoryPct: PCT, submittedAt: taken, firstSubmittedAt: taken, assessmentId: 'demo' },
      studyPlan: null   // built on the page (PlanCore needs the lesson list), started 8 days ago
    };
  }
  // The study plan: "Get promoted", a month, two hours a week, started 8 days ago, so it's week 2.
  function plan(ctx) {
    if (!root.PlanCore) return null;
    var now = ctx.now || Date.now(), p = root.PlanCore.build(Object.assign({}, ctx, { now: now - 8 * DAY }), { aim: 'promoted', weeks: 4, hours: 2 });
    return p;
  }

  // ---------------------------------------------------------------- the banner and the demo script
  var STEPS = [
    { t: 'Compass Suggests', p: 'One next step, with its evidence (the score, recent answers) and how long it takes. "Last time" picks up where Alex left off.', go: { view: 'home', el: 'coachHome' } },
    { t: 'The learning loop', p: 'Assess, find the gaps, learn, practise, check again. The tiles show what Alex has done and where they are now.', go: { view: 'home', el: 'homeLoop' } },
    { t: 'A study plan', p: 'Three questions (goal, deadline, hours a week) and Compass plans each week. Lessons and practice tick off by themselves; the weekly email follows it.', go: { tab: 'plan' } },
    { t: 'Readiness, and what changed', p: 'Status by area from the skill check and real answers, not a grade. Today Strategy moved up, and it says so.', go: { tab: 'readiness' } },
    { t: 'Gaps: the kind of question', p: 'Not just which topic: Alex gets the idea of strategy right but misses when applying it. That changes what to do next.', go: { tab: 'gaps' } },
    { t: 'The Library', p: 'Everything in one place, with three picks and the reason for each: read, listen on the go, and a toolkit to use on real work.', go: { tab: 'library' } },
    { t: 'Practice that adapts', p: 'Two right in a row: harder. Two misses: an offer to teach the idea first. Every answer explains why.', go: { href: '/practice?demo=1&area=strategy' } }
  ];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function show(go) {
    if (go.href) { location.href = go.href; return; }
    if (go.view === 'home' && root.showView) root.showView('home');
    if (go.tab) { if (root.showView) root.showView('learning'); if (root.setLearnTab) root.setLearnTab(go.tab); }
    var el = go.el ? document.getElementById(go.el) : document.querySelector('.cc-tabs');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('demo-flash'); setTimeout(function () { el.classList.remove('demo-flash'); }, 1600); }
  }
  // inside the demo, links to My Learning, Practice and lessons stay in the demo
  var KEEP = /^\/(lms-dashboard|my-learning|practice|lesson)(\?|#|$)/;
  function keepDemo(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('data-demo-exit')) return;
    var u = new URL(a.getAttribute('href'), location.href);
    if (u.origin !== location.origin || !KEEP.test(u.pathname + (u.search ? '?' : '')) || u.searchParams.get('demo') === '1') return;
    u.searchParams.set('demo', '1'); a.setAttribute('href', u.pathname + u.search + u.hash);
  }
  function script(page) {
    document.body.classList.add('pa-demo');
    document.addEventListener('click', keepDemo, true);
    var bar = document.createElement('div');
    bar.className = 'demo-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Demo mode');
    bar.innerHTML = '<b>Demo mode</b><span>You’re seeing ' + NAME + ', a fictional learner. Nothing here is saved, and your own account isn’t shown or changed.</span>' +
      '<span class="demo-acts"><button type="button" data-demo="reset">Reset demo</button><a href="' + (page === 'dashboard' ? '/lms-dashboard' : location.pathname + location.search.replace(/[?&]demo=1/, '').replace(/^&/, '?')) + '" data-demo-exit>Exit demo</a></span>';
    document.body.insertBefore(bar, document.body.firstChild);
    bar.querySelector('[data-demo="reset"]').onclick = function () { location.href = '/lms-dashboard?demo=1'; };
    if (page !== 'dashboard') return;
    var box = document.createElement('aside');
    box.className = 'demo-script'; box.setAttribute('aria-label', 'Demo script');
    box.innerHTML = '<details><summary>Demo script <span>' + STEPS.length + ' steps</span></summary><ol>' + STEPS.map(function (s, i) {
      return '<li><b>' + esc(s.t) + '</b><p>' + esc(s.p) + '</p><button type="button" data-step="' + i + '">Show me</button></li>';
    }).join('') + '</ol></details>';
    document.body.appendChild(box);
    Array.prototype.forEach.call(box.querySelectorAll('[data-step]'), function (b) {
      b.onclick = function () {
        Array.prototype.forEach.call(box.querySelectorAll('li'), function (li) { li.classList.remove('on'); });
        b.parentNode.classList.add('on'); show(STEPS[+b.getAttribute('data-step')].go);
      };
    });
  }

  // Log that this account opened the demo (once a session): Apps Script demoView, with where they came from (?src=).
  function log(user, endpoint, page) {
    try { if (sessionStorage.getItem('pa-demo-logged')) return; sessionStorage.setItem('pa-demo-logged', '1'); } catch (e) {}
    if (!user || !user.getIdToken || !endpoint) return;
    var src = (new URLSearchParams(location.search).get('src') || '').replace(/[^a-z0-9-]/g, '').slice(0, 40);
    user.getIdToken().then(function (tok) {
      var cb = 'paDemo_' + Date.now(), s = document.createElement('script');
      root[cb] = function () { delete root[cb]; s.remove(); };
      s.src = endpoint + '?action=demoView&idToken=' + encodeURIComponent(tok) + '&src=' + encodeURIComponent(src) + '&page=' + encodeURIComponent(page) + '&callback=' + cb;
      s.onerror = function () { delete root[cb]; s.remove(); };
      (root.PAJsonp || function (x) { document.body.appendChild(x); })(s);
    }).catch(function () {});
  }

  root.DemoCore = { NAME: NAME, PCT: PCT, progress: progress, plan: plan, STEPS: STEPS, log: log };
  root.DemoUI = { script: script };
})(typeof window !== 'undefined' ? window : globalThis);
