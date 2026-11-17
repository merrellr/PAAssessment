(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'area';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uPr', email: 'pr@acme.com', displayName: 'Pat Practice', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store){
    var now = Date.now(), answers = [];
    if (scn === 'coached') {   // two scenario misses in Strategy: the coach should lead with those
      [['knowledge', true], ['scenario', false], ['scenario', false], ['scenario', false]].forEach(function (x, i) {
        answers.push({ d: 'strategy', id: 'strategy-novice:9:' + i, t: x[0], ok: x[1], at: now - (10 - i) * 6e4, src: 'lesson' });
      });
    }
    store['progress/uPr'] = { courses: {}, answers: answers,
      assessmentResult: { categoryPct: { discovery: 70, strategy: 40, prioritization: 60, execution: 55, stakeholder: 50, aiIndividual: 80, aiOrg: 45 }, submittedAt: '2026-10-20T00:00:00Z' } };
  };
})();
