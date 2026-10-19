// Classic script: sets up one scenario for the cookie notice (analytics.js) before it runs.
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'new';
  window.__scn = scn;
  // Where the visitor appears to be: Europe asks first, elsewhere starts with no notice (analytics.js reads this).
  window.__paTimeZone = scn === 'us_new' ? 'America/Chicago' : 'Europe/Berlin';
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  const signedIn = /^signedin/.test(scn);
  window.__fakeUser = signedIn ? { uid: 'uC', email: 'c@x.com', displayName: 'Cora Cookie', getIdToken: async function(){ return 'tok'; } } : null;
  try {
    localStorage.removeItem('pa_cookie_consent'); localStorage.removeItem('pa_cookie_consent_at');
    if (scn === 'stored_accepted') localStorage.setItem('pa_cookie_consent', 'accepted');
    if (scn === 'stored_declined' || scn === 'signedin_declined') localStorage.setItem('pa_cookie_consent', 'declined');
  } catch (e) { /* ignore */ }
  if (scn === 'dnt') Object.defineProperty(navigator, 'doNotTrack', { configurable: true, get: function(){ return '1'; } });
  if (scn === 'gpc') Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, get: function(){ return true; } });
})();
