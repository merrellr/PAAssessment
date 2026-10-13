// Classic script: seeds the fake database for one scenario before the page's modules run.
(function(){
  const p = new URLSearchParams(location.search);
  const scn = p.get('scn') || 'ready';
  const TOKEN = '0123456789abcdef0123456789abcdef';
  const day = 864e5;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));

  const user = { uid: 'uNew', email: 'New@A.com', displayName: 'New Person' };
  window.__fakeUser = scn === 'signedout' ? null : user;

  window.__seed = function(store, Timestamp){
    const inv = (over) => Object.assign({ orgId: 'orgA', orgName: 'Acme Health', email: 'new@a.com', name: 'N', phone: '555-0100',
      role: 'member', status: 'open', createdAt: Timestamp.now(), createdBy: 'owner1', expiresAt: Timestamp.fromMillis(Date.now() + 10 * day),
      usedBy: null, usedAt: null }, over || {});
    const mem = (over) => Object.assign({ orgId: 'orgB', orgName: 'Beta Corp', role: 'member', status: 'active', inviteToken: 'old',
      joinedAt: Timestamp.now(), endedAt: null, email: 'new@a.com', displayName: 'New Person', phone: '999' }, over || {});
    store['progress/uNew'] = { courses: {}, profile: { phone: '555' } };
    if (scn === 'notfound' || scn === 'badtoken') return;
    store['invites/' + TOKEN] = inv();
    if (scn === 'admin') store['invites/' + TOKEN] = inv({ role: 'admin' });
    if (scn === 'expired') store['invites/' + TOKEN] = inv({ expiresAt: Timestamp.fromMillis(Date.now() - day) });
    if (scn === 'revoked') store['invites/' + TOKEN] = inv({ status: 'revoked' });
    if (scn === 'used') store['invites/' + TOKEN] = inv({ status: 'used', usedBy: 'someoneElse', usedAt: Timestamp.now() });
    if (scn === 'elsewhere') store['memberships/uNew'] = mem();
    if (scn === 'herealready') store['memberships/uNew'] = mem({ orgId: 'orgA', orgName: 'Acme Health' });
    if (scn === 'joinedbefore'){
      store['invites/' + TOKEN] = inv({ status: 'used', usedBy: 'uNew', usedAt: Timestamp.now() });
      store['memberships/uNew'] = mem({ orgId: 'orgA', orgName: 'Acme Health' });
    }
    if (scn === 'rejoin') store['memberships/uNew'] = mem({ status: 'removed', endedAt: Timestamp.now() });
    if (scn === 'nophone'){ const i = inv(); delete i.phone; delete i.name; store['invites/' + TOKEN] = i; }
    if (scn === 'denied') window.__failCommit = 'permission-denied';
    if (scn === 'flaky') window.__failCommit = 'unavailable';
    if (scn === 'sharefail') window.__failWrite = /^orgs\/orgA\/members\//;
  };
  window.__scn = scn;
  window.__TOKEN = TOKEN;
})();
