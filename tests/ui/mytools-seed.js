// Classic script: seeds the fake database for one scenario before my-tools.html's modules run.
//   handoff: signed out, arriving from a tool's "Save to my account" with work in the #; creates an account, then saves
//   update: signed in, back from a tool opened here (its id in the handoff): update that copy, or save a new one
//   list: signed in with two saved tools (and someone else's): open, copy, rename, delete
//   empty: signed in, nothing saved.   bad: a # that isn't a handoff is ignored
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'list';
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__scn = scn;
  try { sessionStorage.clear(); } catch (e) {}
  const me = { uid: 'uMe', email: 'me@example.com', displayName: 'Me Person', emailVerified: true, providerData: [{ providerId: 'password' }], getIdToken: async () => 'tok' };
  window.__fakeUser = scn === 'handoff' ? null : me;
  // what www's save.js puts in the link
  const hand = (o) => { const b = new TextEncoder().encode(JSON.stringify(o)); let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  if (scn === 'handoff') history.replaceState(null, '', location.pathname + '?scn=handoff#save=' + hand({ v: 1, tool: 'bbp', doc: '', title: 'Analytics dashboard', summary: 'Leading: Partner', data: 'eyJ0IjoiQSJ9' }));
  if (scn === 'update') history.replaceState(null, '', location.pathname + '?scn=update#save=' + hand({ v: 1, tool: 'impact', doc: 'd1', title: 'Roadmap v2', summary: '1. SSO (Big bet)', data: 'NEWDATA' }));
  if (scn === 'bad') history.replaceState(null, '', location.pathname + '?scn=bad#save=not-a-handoff');
  window.__seed = function(store, Timestamp){
    const at = (days) => Timestamp.fromMillis(Date.now() - days * 864e5);
    if (scn === 'list' || scn === 'update') {
      store['savedTools/d1'] = { uid: 'uMe', tool: 'impact', title: 'Roadmap', summary: '1. SSO (Big bet)', data: 'OLDDATA', createdAt: at(10), updatedAt: at(5) };
      store['savedTools/d2'] = { uid: 'uMe', tool: 'scorecard', title: '', summary: '1. Onboarding', data: 'SCDATA', createdAt: at(3), updatedAt: at(1) };
      store['savedTools/x9'] = { uid: 'uOther', tool: 'ai', title: 'Not mine', summary: '', data: 'XX', createdAt: at(2), updatedAt: at(0) };
    }
  };
})();
