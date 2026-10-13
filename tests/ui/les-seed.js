(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'member';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uLes', email: 'Les@Acme.com', displayName: 'Les User', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store, Timestamp){
    var partway = scn === 'member' || scn === 'plain';   // four of five lessons already done: the next one finishes the course
    store['progress/uLes'] = {
      courses: partway ? { 'discovery-novice': { completed: [1, 2, 3, 4], lastLesson: 4, updatedAt: '2026-10-06T10:00:00.000Z', reflections: { l1: 'PRIVATE THOUGHTS' } } } : {},
      profile: { phone: '555-0100' },
      assessmentResult: { tier: 'Moderate Experience', overallPct: 55, overallTotal: 23, overallMax: 42,
        categoryPct: { discovery: 20, strategy: 50, prioritization: 55, execution: 60, stakeholder: 65, aiIndividual: 45, aiOrg: 35 },
        assessmentId: 'les-1', submittedAt: '2026-10-05T10:00:00.000Z', answers: [{ n: 1, cat: 'discovery', question: 'Q', answer: 'A', points: 1 }] }
    };
    if (scn === 'member' || scn === 'nav') store['memberships/uLes'] = { orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: null, email: 'les@acme.com', displayName: 'Les User' };
  };
  // remember what had been written at the moment the page changes, to prove the company copy is saved BEFORE moving on
  addEventListener('pagehide', function(){ try { sessionStorage.setItem('navlog', JSON.stringify((window.__writeLog || []).map(function(w){ return w.op + ':' + w.path; }))); } catch (e) {} });
})();
