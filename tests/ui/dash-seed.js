(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var p = new URLSearchParams(location.search);
  var scn = p.get('scn') || 'member';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uDash', email: 'Dash@Acme.com', displayName: 'Dash User', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store, Timestamp){
    store['progress/uDash'] = {
      courses: { 'discovery-novice': { completed: [1, 2], lastLesson: 2, updatedAt: '2026-10-07T09:00:00.000Z', reflections: { l1: 'PRIVATE THOUGHTS' } } },
      profile: { phone: '555-0100', company: 'Acme' },
      assessmentResult: { tier: 'Moderate Experience', overallPct: 55, overallTotal: 23, overallMax: 42, categoryPct: { discovery: 40, strategy: 50, prioritization: 55, execution: 60, stakeholder: 65, aiIndividual: 45, aiOrg: 35 },
        assessmentId: 'dash-1', submittedAt: '2026-10-05T10:00:00.000Z', answers: [{ n: 1, cat: 'discovery', question: 'Q', answer: 'A', points: 1 }] }
    };
    if (scn === 'member') store['memberships/uDash'] = { orgId: 'orgA', orgName: 'Acme Health', role: 'member', status: 'active', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: null, email: 'dash@acme.com', displayName: 'Dash User' };
    if (scn === 'admin') store['memberships/uDash'] = { orgId: 'orgA', orgName: 'Acme Health', role: 'admin', status: 'active', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: null, email: 'dash@acme.com', displayName: 'Dash User' };
    if (scn === 'removed') store['memberships/uDash'] = { orgId: 'orgA', orgName: 'Acme Health', role: 'member', status: 'removed', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: Timestamp.now(), email: 'dash@acme.com', displayName: 'Dash User' };
    if (scn === 'owner') store['platformAdmins/uDash'] = { note: 'owner' };
  };
})();