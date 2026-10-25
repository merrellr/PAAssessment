// Two-step verification on the learning dashboard (two-step.js, account-menu.js).
//   signin: signed out; mfa@x.com and Google (g@x.com) have two-step verification, so signing in asks for a code
//   nudge: a learner with a verified email and no two-step: the "Protect your account" card, with Not now
//   owner: the platform owner without two-step: the card says it's required, and only offers Later
//   on: already set up: no card.   unverified: email not confirmed yet: no card
//   ownernever: the owner chooses "Don't remind me again".   turnedoff: they already did, on another device
//   google: a learner who signs in only with Google: no card.   googleowner: the owner signing in with Google: still required
(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'nudge';
  window.__scn = scn;
  try { localStorage.removeItem('pa_2step_snooze_uTwo'); localStorage.removeItem('pa_2step_off_uTwo'); } catch (e) {}
  window.__fakeUser = scn === 'signin' ? null : { uid: 'uTwo', email: 'two@acme.com', displayName: 'Two Step', emailVerified: scn !== 'unverified', providerData: [{ providerId: 'password', email: 'two@acme.com' }], getIdToken: async function(){ return 'tok'; } };
  if (scn === 'google' || scn === 'googleowner') window.__fakeUser.providerData = [{ providerId: 'google.com', email: 'two@acme.com' }];
  if (scn === 'on') window.__fakeUser.__factors = [{ uid: 'f1', factorId: 'totp', displayName: 'Authenticator app' }];
  if (scn === 'signin') window.__mfaAccounts = { 'mfa@x.com': true, 'g@x.com': true };
  window.__seed = function(store){
    store['progress/uTwo'] = { courses: {} };
    store['progress/uMfa'] = { courses: {} };
    if (scn === 'owner' || scn === 'googleowner' || scn === 'ownernever' || scn === 'turnedoff') store['platformAdmins/uTwo'] = { note: 'owner' };
    if (scn === 'turnedoff') store['progress/uTwo'].twoStepNudgeOff = true;
  };
})();
