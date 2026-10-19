/* Google Analytics 4 for the public and learner pages, behind a cookie notice. Added with one line in each page's
   <head>:   <script src="analytics.js"></script>
   It is left OFF the owner and admin pages (owner, owner-tools, owner-pilot, reports, company), the invitation
   page (its address holds a secret link) and the aggregate results page.

   By location (the same rules as www.productadvisory.co):
   - Device time zone in Europe (the EEA, UK and Switzerland, and a little beyond): nothing from Google loads until
     the visitor says yes. A notice at the bottom of the page offers Accept and Decline (equal weight).
   - Elsewhere: Google Analytics starts with no notice. As a safety net, Google's Consent Mode keeps analytics
     cookies off for anyone whose IP address is in the EEA, UK or Switzerland until they accept (the `region`
     default in start()), so a traveller or VPN user is never given cookies without asking.
   - The answer is kept in the browser (localStorage "pa_cookie_consent"), so nobody is asked again.
     Accepted: Google Analytics runs with cookies. Declined: it never loads.
   - Signed in (account-menu.js calls acceptFromAccount): someone who has an account has already agreed to the Terms
     and Privacy Policy when creating it, so they are not asked again. A person who clicked Decline before signing in
     stays declined.
   - "Cookie settings" links (the footer, the Profile menu) reopen the notice so the choice can be changed.

   Also:
   - Nothing runs on a local test server (localhost, 127.0.0.1, *.localhost, *.test) except the notice itself, so
     testing the site never shows up in the numbers.
   - Visitors who send "Do Not Track" or "Global Privacy Control" are never tracked, and are not shown the notice.
   - Advertising features are off (no ad personalization, no Google signals).
   - Only a short list of harmless address parameters is sent with a page view (which course or lesson, which button
     on the website the visitor came from). The rest of the address (an invitation token, a company id, the #part)
     is dropped before it leaves the browser. */
(function (root) {
  'use strict';
  var MEASUREMENT_ID = 'G-4XFS1QWS9H';
  var KEEP = ['course', 'lesson', 'src', 'who', 'call'];
  var KEY = 'pa_cookie_consent';
  var PRIVACY_URL = 'https://www.productadvisory.co/privacy-policy';
  // EEA (EU + Iceland, Liechtenstein, Norway), UK and Switzerland, for Google's own IP-based check.
  var STRICT = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
    'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];

  function isLocal(host) {
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || /\.localhost$/.test(host) || /\.test$/.test(host);
  }

  // The page address with only the allowed parameters kept.
  function cleanUrl(loc) {
    var out = loc.origin + loc.pathname;
    var parts = [];
    var params = new URLSearchParams(loc.search || '');
    KEEP.forEach(function (k) {
      var v = params.get(k);
      if (v !== null && /^[A-Za-z0-9_-]{1,40}$/.test(v)) parts.push(k + '=' + v);
    });
    return parts.length ? out + '?' + parts.join('&') : out;
  }

  // The visitor's own browser signal, or '' when there is none.
  function privacySignal(env) {
    var nav = env.navigator || {};
    if (nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || env.doNotTrack === '1') return 'do-not-track';
    if (nav.globalPrivacyControl === true) return 'global-privacy-control';
    return '';
  }

  // Why Google Analytics will not run here, or '' when it may.
  function skipReason(env) {
    if (isLocal(env.location.hostname)) return 'local';
    return privacySignal(env);
  }

  // The device's time zone, as a stand-in for location. env.__paTimeZone lets tests choose one.
  function timeZone(env) {
    if (env.__paTimeZone) return env.__paTimeZone;
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }
  // Whether to ask before anything loads. Errs towards asking.
  function inStrictZone(env) {
    var tz = timeZone(env);
    if (/^Europe\/(Moscow|Minsk|Kaliningrad|Samara|Ulyanovsk|Saratov|Volgograd|Kirov|Astrakhan|Istanbul)$/.test(tz)) return false;
    return /^Europe\//.test(tz) ||
      /^(Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Asia\/(Nicosia|Famagusta)|Arctic\/Longyearbyen)$/.test(tz);
  }

  /* ---------------------------------------------------------------- the visitor's choice */
  function readConsent(env) {
    try { var v = env.localStorage.getItem(KEY); return v === 'accepted' || v === 'declined' ? v : ''; } catch (e) { return ''; }
  }
  function writeConsent(env, v) {
    try { env.localStorage.setItem(KEY, v); env.localStorage.setItem(KEY + '_at', new Date().toISOString()); } catch (e) { /* storage blocked: asked again next time */ }
  }

  // What to do when a page opens: 'start' (accepted, or not asked and outside Europe), 'banner' (not asked, in
  // Europe) or 'none' (declined, or a privacy signal).
  function decide(env) {
    if (privacySignal(env)) return 'none';
    var c = readConsent(env);
    if (c === 'accepted') return 'start';
    if (c === 'declined') return 'none';
    return inStrictZone(env) ? 'banner' : 'start';
  }

  function start(env) {
    if (env.__paStarted || skipReason(env)) return false;
    env.__paStarted = true;
    env.dataLayer = env.dataLayer || [];
    var gtag = function () { env.dataLayer.push(arguments); };
    env.gtag = gtag;
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    // Until they accept, visitors Google locates in the EEA, UK or Switzerland get no analytics cookies.
    if (readConsent(env) !== 'accepted') gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: STRICT });
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, page_location: cleanUrl(env.location) });
    var s = env.document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    env.document.head.appendChild(s);
    return true;
  }

  /* ---------------------------------------------------------------------- the notice */
  var STYLE = '.pa-cookie{position:fixed;left:0;right:0;bottom:0;z-index:1000;display:flex;justify-content:center;padding:12px;pointer-events:none;}' +
    '.pa-cookie-box{pointer-events:auto;max-width:720px;width:100%;box-sizing:border-box;background:#fff;color:#16213E;border:1px solid #DCE3EE;border-radius:14px;box-shadow:0 8px 32px rgba(22,33,62,0.18);padding:16px 18px;font:14px/1.5 "IBM Plex Sans",system-ui,sans-serif;}' +
    '.pa-cookie-box strong{font-family:"Space Grotesk","IBM Plex Sans",system-ui,sans-serif;font-size:15px;}' +
    '.pa-cookie-box p{margin:4px 0 12px;color:#4B5768;}' +
    '.pa-cookie-box a{color:#1A4584;}' +
    '.pa-cookie-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;}' +
    '.pa-cookie-btn{font:600 14px "Space Grotesk","IBM Plex Sans",system-ui,sans-serif;padding:9px 20px;border-radius:8px;border:1.5px solid #1A4584;background:#fff;color:#1A4584;cursor:pointer;}' +
    '.pa-cookie-btn:hover{background:#EEF3FA;}' +
    '.pa-cookie-btn:focus-visible{outline:3px solid #35C2E8;outline-offset:2px;}' +
    '@media print{.pa-cookie{display:none;}}';

  function removeBanner(doc) {
    var b = doc.getElementById('paCookieBanner');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function showBanner(env) {
    var doc = env.document;
    if (!doc.body || doc.getElementById('paCookieBanner')) return;
    if (!doc.getElementById('paCookieStyle')) {
      var st = doc.createElement('style'); st.id = 'paCookieStyle'; st.textContent = STYLE; doc.head.appendChild(st);
    }
    var wrap = doc.createElement('div');
    wrap.className = 'pa-cookie'; wrap.id = 'paCookieBanner';
    wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', 'Cookies and analytics');
    var box = doc.createElement('div'); box.className = 'pa-cookie-box';
    var title = doc.createElement('strong'); title.textContent = 'Cookies and analytics';
    var p = doc.createElement('p');
    p.appendChild(doc.createTextNode('We use Google Analytics to see which pages are used and where people get stuck, so we can improve the free assessment and the courses. It sets cookies on your device. We do not use it for advertising. '));
    var a = doc.createElement('a'); a.href = PRIVACY_URL; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Privacy Policy';
    p.appendChild(a); p.appendChild(doc.createTextNode('.'));
    var row = doc.createElement('div'); row.className = 'pa-cookie-row';
    var yes = doc.createElement('button'); yes.type = 'button'; yes.className = 'pa-cookie-btn'; yes.id = 'paCookieAccept'; yes.textContent = 'Accept';
    var no = doc.createElement('button'); no.type = 'button'; no.className = 'pa-cookie-btn'; no.id = 'paCookieDecline'; no.textContent = 'Decline';
    yes.addEventListener('click', function () { api.accept('banner'); });
    no.addEventListener('click', function () { api.decline(); });
    row.appendChild(yes); row.appendChild(no);
    box.appendChild(title); box.appendChild(p); box.appendChild(row);
    wrap.appendChild(box);
    doc.body.appendChild(wrap);
  }

  // Start Google if it isn't running; if it is (started before a yes), turn analytics cookies on.
  function grant(env) {
    if (env.__paStarted) { if (env.gtag) env.gtag('consent', 'update', { analytics_storage: 'granted' }); return; }
    start(env);
  }

  /* ------------------------------------------------------------------------ public */
  var api = {
    MEASUREMENT_ID: MEASUREMENT_ID, KEEP: KEEP, KEY: KEY, STRICT: STRICT,
    isLocal: isLocal, cleanUrl: cleanUrl, skipReason: skipReason, privacySignal: privacySignal, decide: decide, inStrictZone: inStrictZone,
    start: start, readConsent: readConsent, writeConsent: writeConsent, showBanner: showBanner,
    consent: function () { return readConsent(root); },
    accept: function () { writeConsent(root, 'accepted'); removeBanner(root.document); grant(root); },
    // Already running (outside Europe, not asked): switch cookies off for the rest of this page; it won't load next time.
    decline: function () { writeConsent(root, 'declined'); removeBanner(root.document); if (root.__paStarted && root.gtag) root.gtag('consent', 'update', { analytics_storage: 'denied' }); },
    // Signed-in people have agreed to the Privacy Policy by creating an account, so no question is needed.
    // An earlier "Decline" on this device is respected.
    acceptFromAccount: function () {
      var c = readConsent(root);
      if (c === 'declined') return;
      if (c === '') writeConsent(root, 'accepted');
      removeBanner(root.document);
      grant(root);
    },
    // "Cookie settings": show the notice again so the choice can be changed.
    reopen: function () { if (privacySignal(root)) return; removeBanner(root.document); showBanner(root); },
    state: function () { return { consent: readConsent(root), started: !!root.__paStarted, banner: !!root.document.getElementById('paCookieBanner') }; }
  };
  root.PAAnalytics = api;

  if (typeof document !== 'undefined' && typeof location !== 'undefined') {
    var go = function () {
      var what = decide(root);
      if (what === 'start') start(root);
      else if (what === 'banner') showBanner(root);
    };
    // "Cookie settings" links anywhere on a page.
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
      if (t) { e.preventDefault(); api.reopen(); }
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
