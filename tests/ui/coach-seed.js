(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'free';
  window.__scn = scn;
  try { localStorage.removeItem('pa_coach_chat'); } catch (e) {}
  window.__fakeUser = { uid: 'uCo', email: 'co@acme.com', displayName: 'Casey Coach', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  // the lesson search index (normally ask-index.js): two passages
  window.PA_ASK = [
    { u: 'lesson.html?course=prioritization-novice&lesson=2', t: 'Lesson 2: A Value-vs-Effort View', x: 'Plot each request by value and effort so the quick wins stand out.' },
    { u: 'lesson.html?course=prioritization-novice&lesson=3', t: 'Lesson 3: Score, Don\'t Argue', x: 'Agree the scoring rubric first, then score each request against it.' }
  ];
  // stand-in for the Apps Script (section 14b): records what the page sends
  window.__sent = [];
  window.__backend = function (p) {
    window.__sent.push(p);
    if (p.action === 'coachStatus') return Promise.resolve(scn === 'used' ? { ok: true, kind: 'used', left: 0, conv: 'cOld' } : scn === 'company' ? { ok: true, kind: 'company', left: null } : { ok: true, kind: 'free', left: 10, conv: '' });
    if (p.action === 'coachChat') {
      var n = window.__sent.filter(function (x) { return x.action === 'coachChat'; }).length;
      if (scn === 'free' && n >= 3) return Promise.resolve({ ok: false, error: 'upgrade' });
      return Promise.resolve({ ok: true, text: 'Start with the value-vs-effort view [1], then agree a rubric [2].\n- Pick three requests\n- Score them\n[[practice:prioritization]]', cited: [1, 2], kind: scn === 'company' ? 'company' : 'free', left: scn === 'company' ? null : 10 - n });
    }
    return Promise.resolve(null);
  };
  // the page's backend calls go to the stand-in, from the moment account-menu.js sets PAAccount up
  var pa = null;
  Object.defineProperty(window, 'PAAccount', { configurable: true, get: function () { return pa; },
    set: function (v) { pa = v; if (v) { v.backend = window.__backend; v.idToken = function () { return Promise.resolve('tok'); }; } } });
  window.__seed = function(store){
    store['progress/uCo'] = { courses: {}, answers: [
      { d: 'prioritization', id: 'prioritization-novice:2:0', t: 'scenario', ok: false, at: Date.now() - 5e5, src: 'practice' },
      { d: 'prioritization', id: 'prioritization-novice:2:1', t: 'scenario', ok: false, at: Date.now() - 4e5, src: 'practice' }],
      assessmentResult: { categoryPct: { discovery: 70, strategy: 60, prioritization: 35, execution: 55, stakeholder: 50, aiIndividual: 80, aiOrg: 45 } } };
  };
})();
