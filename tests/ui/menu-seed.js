// Classic script: sets up one scenario for the shared Profile menu (account-menu.js) before it runs.
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'plain';
  window.__scn = scn;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  const user = (uid, email, name) => ({ uid: uid, email: email, displayName: name, getIdToken: async function(){ return 'tok'; } });
  window.__fakeUser = scn === 'signedout' ? null
    : scn === 'owner' ? user('owner1', 'owner@x.com', 'Olivia Owner')
    : scn === 'noname' ? user('uP', 'pat.jones@x.com', null)
    : scn.indexOf('admin') === 0 || scn === 'removedadmin' || scn === 'memberrole' ? user('uAdm', 'adm@x.com', 'Ada Admin')
    : user('uP', 'plain@x.com', 'Pat Plain');
  window.__seed = function(store){
    if (scn === 'admin') store['memberships/uAdm'] = { orgId: 'orgA', role: 'admin', status: 'active' };
    if (scn === 'removedadmin') store['memberships/uAdm'] = { orgId: 'orgA', role: 'admin', status: 'removed' };
    if (scn === 'memberrole') store['memberships/uAdm'] = { orgId: 'orgA', role: 'member', status: 'active' };
  };
})();
