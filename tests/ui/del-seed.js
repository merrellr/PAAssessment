(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'member';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uDel', email: 'del@acme.com', displayName: 'Del User', emailVerified: true, providerData: [{ providerId: 'password' }], getIdToken: async function(){ return 'tok'; } };
  window.__calls = [];
  // the Apps Script spreadsheet clean-up and the company list are reached through a <script> tag; answer them here
  var desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get: function(){ return desc.get.call(this); }, set: function(v){
    if (String(v).indexOf('script.google.com') === -1) { desc.set.call(this, v); return; }
    var q = Object.fromEntries(new URL(v).searchParams); window.__calls.push(q.action + '@' + window.__writeLog.length);
    setTimeout(function(){ var cb = window[q.callback]; if (!cb) return; cb(q.action === 'deleteAccount' ? { ok: true } : (q.action === 'companies' ? [] : null)); }, 10);
  } });
  window.__seed = function(store, Timestamp){
    var ts = Timestamp.now();
    store['progress/uDel'] = { courses: {}, profile: { phone: '555' }, orgIds: scn === 'nonmember' ? [] : ['orgOld', 'orgA'] };
    if (scn !== 'nonmember'){
      store['memberships/uDel'] = { orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active', inviteToken: 't', joinedAt: ts, endedAt: null, email: 'del@acme.com', displayName: 'Del User', phone: '555-0100' };
      var sh = function(){ return { identity: { name: 'Del User', email: 'del@acme.com' }, assessment: { tier: 'Lots of Experience', overallPct: 80 }, courses: {}, lastActiveAt: null, updatedAt: ts }; };
      store['orgs/orgA/members/uDel'] = sh();
      store['orgs/orgOld/members/uDel'] = sh();
    }
    if (scn === 'blocked') window.__failWrite = /^orgs\/orgA\/members\/uDel$/;
  };
})();
