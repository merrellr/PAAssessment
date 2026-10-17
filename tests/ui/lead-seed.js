// Classic script: sets up one scenario for request-info.html before its modules run.
(function(){
  const p = new URLSearchParams(location.search);
  const scn = p.get('scn') || 'org';
  window.__scn = scn;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));

  window.__fakeUser = scn === 'signedin'
    ? { uid: 'uLead', email: 'Pat@Acme-Health.com', displayName: 'Pat Lee', emailVerified: true, getIdToken: async function(){ return 'tok'; } }
    : null;

  window.__seed = function(store, Timestamp){
    store['progress/uLead'] = { courses: {}, assessmentResult: { tier: 'Moderate Experience', overallPct: 41.4, categoryPct: { discovery: 80, strategy: 20, aiOrg: 55 }, answers: [{ n: 1, question: 'private answer' }] } };
  };

  // The server is reached with fetch (to send) and a <script> tag (to ask "did it arrive?"). Both are faked here.
  window.__posts = [];
  window.__calls = [];
  window.fetch = async function(url, opts){
    window.__posts.push({ url: String(url), opts: opts, body: opts && opts.body ? JSON.parse(opts.body) : null });
    if (scn === 'fail') throw new TypeError('network down');
    return {};
  };
  let polls = 0;
  const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get: function(){ return desc.get.call(this); }, set: function(v){
    if (String(v).indexOf('script.google.com') === -1) { desc.set.call(this, v); return; }
    const q = Object.fromEntries(new URL(v).searchParams);
    window.__calls.push(q.action);
    setTimeout(function(){
      const cb = window[q.callback]; if (!cb) return;
      if (q.action === 'leadsCheck') return cb(scn === 'nobackend' ? null : { ok: true, leads: true });
      if (q.action === 'leadStatus'){
        polls++;
        if (scn === 'unconfirmed') return cb({ ok: true, found: false });
        if (scn === 'ratelimit') return cb({ ok: false, found: true, error: 'rate_limited' });
        if (scn === 'rejected') return cb({ ok: false, found: true, error: 'invalid' });
        return cb(polls >= 2 ? { ok: true, found: true } : { ok: true, found: false });   // arrives on the second look
      }
      cb(null);
    }, 20);
  } });
})();
