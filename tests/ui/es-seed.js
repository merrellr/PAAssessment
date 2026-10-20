// Classic script: sets up one scenario for email-settings.html (opened from a link in an email, signed out).
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'plain';
  window.__scn = scn;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__fakeUser = null;

  // The page talks to the script with a <script> tag (JSONP). A small stand-in for emailPrefsEndpoint_ answers here.
  window.__calls = [];
  const saved = { checkin: scn === 'monthly' ? 'monthly' : 'weekly', orgReport: 'weekly' };
  const admin = scn === 'admin' || scn === 'adminoff';
  const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get: function(){ return desc.get.call(this); }, set: function(v){
    if (String(v).indexOf('script.google.com') === -1) { desc.set.call(this, v); return; }
    const q = Object.fromEntries(new URL(v).searchParams);
    if (q.action === 'emailPrefs') window.__calls.push(q);
    setTimeout(function(){
      const cb = window[q.callback]; if (!cb) return;
      if (q.action !== 'emailPrefs') return cb({ ok: true });
      if (scn === 'badlink' || q.k !== 'goodsig') return cb({ ok: false, error: 'bad_link' });
      if (scn === 'down') return cb(null);
      if (q.kind){
        if (scn === 'savefail' && q.freq === 'daily') return cb({ ok: false, error: 'server_error' });
        saved[q.kind] = q.freq;
      }
      cb({ ok: true, checkin: saved.checkin, orgReport: saved.orgReport, admin: admin, orgName: admin ? 'TestCo' : '' });
    }, 20);
  } });
})();
