(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'join';
  window.__scn = scn;
  window.__pollMs = 300;
  window.__navTo = null; window.__nav = function(u){ window.__navTo = u; };
  var who = { fac: { uid: 'uFac', email: 'fran@acme.com', displayName: 'Fran' }, pri: { uid: 'uPri', email: 'priya@acme.com', displayName: 'Priya' },
    new: { uid: 'uNew', email: 'nia@acme.com', displayName: 'Nia' } };
  var as = { create: 'fac', join: 'new', waiting: 'fac', reveal: 'fac', member: 'pri', agree: 'fac', agreed: 'pri', blind: 'pri', missing: 'pri', signedout: null }[scn];
  window.__fakeUser = as ? Object.assign({ emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } }, who[as]) : null;
  // a stand-in for the Scorecard's own file on www (decode and encode only)
  window.ScorecardCore = {
    decode: function(d){ return d === 'SC1' ? { title: 'Q1 roadmap', criteria: [{ name: 'Customer value', weight: 5, cost: false }, { name: 'Effort', weight: 3, cost: true }],
      features: [{ name: 'Mobile app' }, { name: 'SSO' }, { name: 'Bulk export' }] } : null; },
    encode: function(s){ window.__encoded = s; return 'ENC' + s.features.length; }
  };
  window.__seed = function(store, Timestamp){
    store['savedTools/sc1'] = { uid: 'uFac', tool: 'scorecard', title: 'Q1 roadmap', summary: '', data: 'SC1', createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    if (scn === 'create' || scn === 'missing' || scn === 'signedout') return;
    var status = { reveal: 'revealed', member: 'revealed', agree: 'revealed', agreed: 'agreed' }[scn] || 'scoring';
    store['teamSessions/s1'] = { owner: 'uFac', ownerName: 'Fran', tool: 'scorecard', title: 'Q1 roadmap',
      criteria: [{ name: 'Customer value', weight: 5, cost: false }, { name: 'Effort', weight: 3, cost: true }], features: ['Mobile app', 'SSO', 'Bulk export'],
      status: status, members: { uFac: 'Fran', uPri: 'Priya', uMar: 'Marcus', uDan: 'Dana' }, submitted: scn === 'blind' ? { uFac: true } : { uFac: true, uPri: true, uMar: true },
      agreed: scn === 'agreed' ? ['43', '33', '21'] : null, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    store['teamSessions/s1/scores/uFac'] = { name: 'Fran', scores: ['52', '33', '21'] };
    store['teamSessions/s1/scores/uPri'] = { name: 'Priya', scores: ['24', '33', '22'] };
    store['teamSessions/s1/scores/uMar'] = { name: 'Marcus', scores: ['53', '43', '21'] };
    store['teamSessions/s1/scores/uDan'] = { name: 'Dana', scores: ['4', '', ''] };   // started, not finished
  };
})();
