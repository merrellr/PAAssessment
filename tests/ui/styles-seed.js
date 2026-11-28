(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'fresh';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uWs', email: 'ws@acme.com', displayName: 'Wren Style', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store){
    var p = { courses: {} }, Q = window.StylesCore.QUESTIONS;
    if (scn === 'resume') { var a = {}; Q.slice(0, 22).forEach(function (q) { a[q.id] = { most: 'c', least: 'i' }; }); p.workStyleDraft = { answers: a, i: 22, at: '2026-11-20T00:00:00Z' }; }
    if (scn === 'done') { var b = {}; Q.forEach(function (q, n) { b[q.id] = n % 2 ? { most: 'i', least: 'c' } : { most: 'd', least: 'c' }; }); p.workStyle = window.StylesCore.toSave(b, '2026-11-20T00:00:00Z'); }
    store['progress/uWs'] = p;
  };
})();
