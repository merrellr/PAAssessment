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
    var co = { optional: 'optional', team: 'team', unpaid: 'all' }[scn];
    if (co) {
      store['memberships/uWs'] = { orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active' };
      store['orgStyleSettings/orgA'] = { mode: co, teams: { tprod: { name: 'Product', members: ['uWs', 'uMo'], sees: ['teng'] }, teng: { name: 'Engineering', members: ['uEd'], sees: [] }, tdes: { name: 'Design', members: ['uZoe'], sees: [] } },
        names: { uWs: 'Wren Style', uMo: 'Mo Team', uEd: 'Ed Eng', uZoe: 'Zoe Zee' } };
      if (scn === 'team') store['orgStyleGrants/orgA/items/grantOld01'] = { viewer: 'uZoe', viewerName: 'Zoe Zee', subjects: ['uWs'], targetName: 'Wren Style', reason: 'Pairing on onboarding', approvedBy: 'uAdm', at: { toDate: function () { return new Date('2026-11-20T00:00:00Z'); }, toMillis: function () { return 0; } } };
      if (scn !== 'unpaid') store['orgFeatures/orgA'] = { styles: true };
      store['orgStyleViews/orgA/viewers/uWs'] = { uids: ['uMo', 'uEd'] };
      store['orgStyles/orgA/people/uMo'] = { name: 'Mo Team', scores: { d: 30, i: 85, s: 70, c: 15 }, primary: 'i', secondary: 's', at: 1 };
      store['orgStyles/orgA/people/uEd'] = { name: 'Ed Eng', scores: { d: 40, i: 10, s: 50, c: 100 }, primary: 'c', secondary: '', at: 1 };
      var b2 = {}; Q.forEach(function (q) { b2[q.id] = { most: 'd', least: 's' }; });
      if (scn !== 'team') p.workStyle = window.StylesCore.toSave(b2, '2026-11-20T00:00:00Z');
    }
    store['progress/uWs'] = p;
  };
})();
