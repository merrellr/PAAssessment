// Classic script: seeds the fake database for one scenario before my-tools.html's modules run.
//   handoff: signed out, arriving from a public tool's "Save to my account" with work in the #; creates an account, saves
//   update: signed in, back from a public tool opened from here (its id in the handoff): update that copy, or save a new one
//   list: signed in with two saved pieces of work (and someone else's): open, copy, rename, delete from the cards
//   open: a saved piece of work in the workspace (my-tools?open=d1): the tool runs here and each change saves
//   new: a new decision matrix from "Try the example" (my-tools?new=bbp&start=example): created on its first change
//   legacy: an older my-tools?view=d1 link opens the workspace too
//   filter: five saved: filter by tool, search, order.   empty: nothing saved.   bad: a # that isn't a handoff
//   signedout: my-tools?open=d1 while signed out asks them to log in first
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'list';
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__scn = scn;
  // the tools run from tests/ui/fake-tool.html (copied to faketool-<page>.html); their scoring files from fakecore-*.js
  window.PA_TOOL_PAGE_BASE = location.origin + '/faketool-';
  window.PA_TOOL_CORE_BASE = './fakecore-';
  try { sessionStorage.clear(); localStorage.removeItem('pa_ws_tip'); } catch (e) {}
  const me = { uid: 'uMe', email: 'me@example.com', displayName: 'Me Person', emailVerified: true, providerData: [{ providerId: 'password' }], getIdToken: async () => 'tok' };
  window.__fakeUser = scn === 'handoff' || scn === 'signedout' ? null : me;
  try { localStorage.setItem('pa_2s_nudge_off_uMe', '1'); } catch (e) {}
  // what www's save.js puts in the link
  const hand = (o) => { const b = new TextEncoder().encode(JSON.stringify(o)); let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const at = (q) => history.replaceState(null, '', location.pathname + '?scn=' + scn + q);
  if (scn === 'handoff') at('#save=' + hand({ v: 1, tool: 'bbp', doc: '', title: 'Analytics dashboard', summary: 'Leading: Partner', data: 'eyJ0IjoiQSJ9' }));
  if (scn === 'update') at('#save=' + hand({ v: 1, tool: 'impact', doc: 'd1', title: 'Roadmap v2', summary: '1. SSO (Big bet)', data: 'NEWDATA' }));
  if (scn === 'bad') at('#save=not-a-handoff');
  if (scn === 'open' || scn === 'signedout') at('&open=d1');
  if (scn === 'legacy') at('&view=d1');
  if (scn === 'new') at('&new=bbp&start=example');
  window.__seed = function(store, Timestamp){
    const ago = (days) => Timestamp.fromMillis(Date.now() - days * 864e5);
    if (scn !== 'empty' && scn !== 'handoff' && scn !== 'bad' && scn !== 'new') {
      store['savedTools/d1'] = { uid: scn === 'signedout' ? 'uSignedIn' : 'uMe', tool: 'impact', title: 'Roadmap', summary: '1. SSO (Big bet)', data: 'OLDDATA', createdAt: ago(10), updatedAt: ago(5) };
      store['savedTools/d2'] = { uid: 'uMe', tool: 'scorecard', title: '', summary: '1. Onboarding', data: 'SCDATA', createdAt: ago(3), updatedAt: ago(1) };
      store['savedTools/x9'] = { uid: 'uOther', tool: 'ai', title: 'Not mine', summary: '', data: 'XX', createdAt: ago(2), updatedAt: ago(0) };
    }
    if (scn === 'filter') {
      store['savedTools/d3'] = { uid: 'uMe', tool: 'impact', title: 'Annual plan', summary: '1. Billing', data: 'A3', createdAt: ago(20), updatedAt: ago(20) };
      store['savedTools/d4'] = { uid: 'uMe', tool: 'bbp', title: 'Vendor choice', summary: 'Leading: Buy', data: 'A4', createdAt: ago(8), updatedAt: ago(8) };
      store['savedTools/d5'] = { uid: 'uMe', tool: 'ai', title: 'Support bots', summary: '1. Ticket summaries', data: 'A5', createdAt: ago(2), updatedAt: ago(2) };
    }
  };
})();
