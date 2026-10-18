// Classic script: sets up one scenario for index.html (the free assessment) before its scripts run.
(function(){
  const scn = new URLSearchParams(location.search).get('scn') || 'high';
  window.__scn = scn;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__fakeUser = null;                 // nobody signed in: the free assessment
  try { sessionStorage.clear(); } catch (e) { /* ignore */ }

  // Everything the page sends to the Apps Script (anonymous funnel events and the result row) is recorded, not sent.
  window.__posts = [];
  window.fetch = function(url, opts){
    try { window.__posts.push(JSON.parse(opts && opts.body || '{}')); } catch (e) { window.__posts.push({ unreadable: true }); }
    return Promise.resolve({ ok: true, json: async function(){ return {}; }, text: async function(){ return 'OK'; } });
  };
  // The page uses <script> tags for JSONP lookups; nothing here needs an answer.
})();
