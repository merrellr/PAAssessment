/* ================================================================
   "Make it yours" for Product Advisory Learning. Applies the visitor's
   look before the page paints, so there is no flash of the default.
   Loaded in <head>, without defer, on every themed page.

   The look is shared with www.productadvisory.co and the portfolio:
   it is kept in a small preference cookie on .productadvisory.co
   ("pa_look": style, accent, text size, density, motion, colour mode),
   so choosing dark mode on one site opens the others the same way.
   No personal data. Browser storage is the fallback (and the only
   store on a test server, where the cookie can't be shared).

   Sets on <html>: data-style, data-accent, data-text, data-density,
   data-motion and data-theme. pa-theme.css does the rest.
   ================================================================ */
(function () {
  "use strict";
  var DEFAULTS = { style: "classic", accent: "", text: "m", density: "comfortable", motion: "full" };
  var CHOICES = {
    style: ["classic", "editorial", "boardroom", "lab"],
    accent: ["", "cyan", "green", "blue", "plum", "coral", "gold"],
    text: ["s", "m", "l", "xl"],
    density: ["comfortable", "compact"],
    motion: ["full", "reduced"]
  };
  var MODES = ["light", "dark"];
  var COOKIE = "pa_look";
  var FONTS = {
    editorial: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap",
    boardroom: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,600;1,600&display=swap",
    lab: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
  };

  function loadFont(style) {
    if (!FONTS[style] || document.getElementById("font-" + style)) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = FONTS[style]; l.id = "font-" + style;
    document.head.appendChild(l);
  }
  function parse(json) { try { return JSON.parse(json || "null"); } catch (e) { return null; } }
  function sharedDomain() {
    var h = location.hostname;
    return h === "productadvisory.co" || /\.productadvisory\.co$/.test(h) ? "productadvisory.co" : "";
  }
  function readCookie() {
    var m = (document.cookie || "").match(/(?:^|;\s*)pa_look=([^;]*)/);
    return m ? parse(decodeURIComponent(m[1])) : null;
  }
  function writeCookie(look) {
    var d = sharedDomain();
    if (!d) return;
    try {
      document.cookie = COOKIE + "=" + encodeURIComponent(JSON.stringify(look)) + "; Domain=" + d +
        "; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
    } catch (e) { /* cookies blocked */ }
  }
  function readLocal() {
    try { return parse(localStorage.getItem(COOKIE)); } catch (e) { return null; }
  }
  function writeLocal(look) {
    try { localStorage.setItem(COOKIE, JSON.stringify(look)); } catch (e) { /* storage blocked */ }
  }
  function clean(p) {
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) { out[k] = p && CHOICES[k].indexOf(p[k]) > -1 ? p[k] : DEFAULTS[k]; });
    out.mode = p && MODES.indexOf(p.mode) > -1 ? p.mode : "";
    return out;
  }

  /** The saved look: the shared cookie first, then this browser's copy. */
  function read() { return clean(readCookie() || readLocal() || {}); }

  function apply(p) {
    var root = document.documentElement;
    Object.keys(DEFAULTS).forEach(function (k) {
      if (p[k] && p[k] !== DEFAULTS[k]) root.setAttribute("data-" + k, p[k]);
      else root.removeAttribute("data-" + k);
    });
    if (p.mode) root.setAttribute("data-theme", p.mode); else root.removeAttribute("data-theme");
    loadFont(p.style);
  }

  function save(p) {
    var look = clean(p);
    writeCookie(look);
    writeLocal(look);
    apply(look);
    try { window.dispatchEvent(new CustomEvent("pa-look-changed", { detail: look })); } catch (e) { /* old browsers */ }
    return look;
  }

  function set(key, value) { var p = read(); p[key] = value; return save(p); }

  function reset() {
    var d = sharedDomain();
    if (d) { try { document.cookie = COOKIE + "=; Domain=" + d + "; Path=/; Max-Age=0; SameSite=Lax; Secure"; } catch (e) { /* ignore */ } }
    try { localStorage.removeItem(COOKIE); } catch (e) { /* ignore */ }
    apply(clean({}));
  }

  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  }

  window.PALook = {
    DEFAULTS: DEFAULTS, CHOICES: CHOICES, MODES: MODES,
    read: read, save: save, set: set, reset: reset, apply: apply, isDark: isDark, clean: clean
  };
  apply(read());
})();
