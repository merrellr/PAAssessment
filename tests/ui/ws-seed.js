(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'member';
  window.__scn = scn;
  window.confirm = function(){ return true; };
  var uid = scn === 'admin' ? 'uAdm' : 'uMem';
  if (scn === 'ask') window.__askReply = { ok: true, text: 'Harbor Plumbing wants route planning [2]. It has 12 votes [1].\n- Next: link it to a feature [9]', left: 21 };
  window.__fakeUser = { uid: uid, email: uid + '@acme.com', displayName: 'Wes Space', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store){
    var ts = { toMillis: function(){ return 0; } };
    if (scn === 'solo') return;   // no company: the sample
    store['memberships/' + uid] = { orgId: 'orgA', orgName: 'Acme', role: scn === 'admin' ? 'admin' : 'member', status: 'active' };
    if (scn === 'ask') store['orgFeatures/orgA'] = { wsAsk: true };
    store['workspaces/orgA/notes/noteOther01'] = { kind: 'note', title: 'Harbor call', body: 'Harbor asked about route planning again.', links: ['acct000001'], source: 'Call, 3 Jun', authorId: 'uOther', authorName: 'Olive', createdAt: { toMillis: function(){ return Date.now() - 3 * 864e5; } }, updatedAt: ts };
    store['workspaces/orgA'] = { valueMode: scn === 'admin' ? 'either' : 'bands', areas: ['Scheduling', 'Mobile'] };
    var it = function (o) { return Object.assign({ note: '', area: '', status: '', date: '', links: [], band: '', value: null, tier: 0, votes: 0, createdBy: 'uOther', createdAt: ts, updatedBy: 'uOther', updatedAt: ts }, o); };
    store['workspaces/orgA/items/goal000001'] = it({ type: 'goal', title: 'Grow mid-market', status: 'on_track', date: '2027-12-31' });
    store['workspaces/orgA/items/rel0000001'] = it({ type: 'release', title: 'Summer release', date: '2027-06-20', links: ['goal000001'] });
    store['workspaces/orgA/items/acct000001'] = it({ type: 'account', title: 'Harbor Plumbing', band: 'b4', value: 380000, tier: 3 });
    store['workspaces/orgA/items/idea000001'] = it({ type: 'idea', title: 'Route planning', area: 'Scheduling', status: 'new', votes: 12, links: ['acct000001'], createdBy: uid });
  };
})();
