// Classic script: sets up one scenario for the shared Profile menu (account-menu.js) before it runs.
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'plain';
  window.__scn = scn;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  const hours = 3600000;
  const user = (uid, email, name, createdMsAgo) => ({ uid: uid, email: email, displayName: name, getIdToken: async function(){ return 'tok'; },
    metadata: createdMsAgo === undefined ? undefined : { creationTime: new Date(Date.now() - createdMsAgo).toUTCString() } });
  const welcomeScn = /^(new|old|welcome)/.test(scn);
  window.__fakeUser = scn === 'signedout' ? null
    : scn === 'owner' ? user('owner1', 'owner@x.com', 'Olivia Owner')
    : scn === 'noname' ? user('uP', 'pat.jones@x.com', null)
    : scn.indexOf('admin') === 0 || scn === 'removedadmin' || scn === 'memberrole' ? user('uAdm', 'adm@x.com', 'Ada Admin')
    : scn === 'oldaccount' ? user('uOld', 'old@x.com', 'Old Hand', 10 * 24 * hours)
    : welcomeScn ? user('uNew', 'new@x.com', 'Nora Newcomer', 1 * hours)
    : user('uP', 'plain@x.com', 'Pat Plain');
  window.__seed = function(store){
    if (scn === 'admin') store['memberships/uAdm'] = { orgId: 'orgA', role: 'admin', status: 'active' };
    if (scn === 'removedadmin') store['memberships/uAdm'] = { orgId: 'orgA', role: 'admin', status: 'removed' };
    if (scn === 'memberrole') store['memberships/uAdm'] = { orgId: 'orgA', role: 'member', status: 'active' };
  };
  if (scn === 'welcomedone') { try { localStorage.setItem('pa_welcomed_uNew', '1'); } catch (e) { /* ignore */ } }
  else { try { localStorage.removeItem('pa_welcomed_uNew'); localStorage.removeItem('pa_welcomed_uOld'); } catch (e) { /* ignore */ } }

  // The email script is reached by a <script> tag; answer it here.
  window.__calls = [];
  const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get: function(){ return desc.get.call(this); }, set: function(v){
    if (String(v).indexOf('script.google.com') === -1) { desc.set.call(this, v); return; }
    const q = Object.fromEntries(new URL(v).searchParams);
    window.__calls.push(q);
    setTimeout(function(){
      const cb = window[q.callback]; if (!cb) return;
      if (scn === 'welcomefail') cb({ ok: false, error: 'mail_error' });
      else if (scn === 'welcomedown') cb(null);
      else cb({ ok: true, sent: true });
    }, 10);
  } });
})();
