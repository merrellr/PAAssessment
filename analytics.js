/* Google Analytics 4 for the public and learner pages. Added with one line in each page's <head>:
       <script src="analytics.js"></script>
   It is left OFF the owner and admin pages (owner, owner-tools, owner-pilot, reports, company), the invitation
   page (its address holds a secret link) and the aggregate results page.

   What it does, and does not do:
   - Does nothing on a local test server (localhost, 127.0.0.1, *.localhost, *.test), so building and testing the
     site never shows up in the numbers.
   - Does nothing for visitors who send "Do Not Track" or "Global Privacy Control".
   - Advertising features are switched off (no ad personalization, no Google signals).
   - Only a short list of harmless address parameters is sent along with a page view (which course or lesson, which
     button on the website the visitor came from). Anything else in the address, such as an invitation token, a
     company id or the #part, is dropped before it leaves the browser. */
(function (root) {
  'use strict';
  var MEASUREMENT_ID = 'G-4XFS1QWS9H';
  var KEEP = ['course', 'lesson', 'src', 'who', 'call'];

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

  // Why it will not run here, or '' when it will.
  function skipReason(env) {
    if (isLocal(env.location.hostname)) return 'local';
    var nav = env.navigator || {};
    if (nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || env.doNotTrack === '1') return 'do-not-track';
    if (nav.globalPrivacyControl === true) return 'global-privacy-control';
    return '';
  }

  function start(env) {
    if (skipReason(env)) return false;
    env.dataLayer = env.dataLayer || [];
    var gtag = function () { env.dataLayer.push(arguments); };
    env.gtag = gtag;
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, page_location: cleanUrl(env.location) });
    var s = env.document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    env.document.head.appendChild(s);
    return true;
  }

  root.PAAnalytics = { MEASUREMENT_ID: MEASUREMENT_ID, KEEP: KEEP, isLocal: isLocal, cleanUrl: cleanUrl, skipReason: skipReason, start: start };
  if (typeof document !== 'undefined' && typeof location !== 'undefined') start(root);
})(typeof globalThis !== 'undefined' ? globalThis : window);
