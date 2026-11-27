(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'fresh';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uCk', email: 'ck@acme.com', displayName: 'Casey Check', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store){
    var p = { courses: {}, answers: [{ d: 'strategy', id: 'strategy-novice:1:0', t: 'knowledge', ok: true, at: Date.now() - 6e4, src: 'lesson' }] };
    // resume: stopped after 30 of the 32 questions
    if (scn === 'resume') p.check = { i: 30, right: 20, done: window.CompetencyCheck.questions.slice(0, 30).map(function (q) { return q.id; }), startedAt: '2026-11-20T00:00:00Z', areas: { discovery: { n: 6, r: 4 }, strategy: { n: 4, r: 3 }, prioritization: { n: 4, r: 3 }, execution: { n: 4, r: 3 }, stakeholder: { n: 4, r: 3 }, aiIndividual: { n: 4, r: 2 }, aiOrg: { n: 4, r: 2 } } };
    store['progress/uCk'] = p;
  };
})();
