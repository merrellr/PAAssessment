// Classic script: sets up one scenario for feedback.html before its modules run.
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'signedin';
  window.__scn = scn;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));

  window.__fakeUser = scn === 'signedout' ? null
    : { uid: 'uFb', email: 'pat@acme.com', displayName: 'Pat Lee', emailVerified: true, getIdToken: async function(){ return 'tok'; } };

  // The form sends with a <script> tag (JSONP). The script answers here: "ok", or the daily limit for 'limit'.
  window.__calls = [];
  const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get: function(){ return desc.get.call(this); }, set: function(v){
    if (String(v).indexOf('script.google.com') === -1) { desc.set.call(this, v); return; }
    const q = Object.fromEntries(new URL(v).searchParams);
    if (q.action === 'feedback') window.__calls.push(q);
    setTimeout(function(){
      const cb = window[q.callback]; if (!cb) return;
      if (q.action === 'feedback') return cb(scn === 'limit' ? { ok: false, error: 'daily_limit' } : { ok: true, emailed: true });
      cb({ ok: true });
    }, 20);
  } });
})();
