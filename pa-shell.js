/* ================================================================
   Product Advisory Learning: the site header, light/dark toggle,
   "Make it yours" panel and the search menu (⌘K / Ctrl+K or /),
   matching www.productadvisory.co. No dependencies.

   Add to a page with one line straight after <body>:
     <script src="pa-shell.js"></script>
   (pa-prefs.js and pa-theme.css go in the <head>.) The header is drawn
   on the spot, so it never jumps in after the page. account-menu.js
   puts the Profile button in the header's #paNavAccount slot.
   ================================================================ */
(function () {
  "use strict";
  var WWW = "https://www.productadvisory.co/";
  var CALENDLY = "https://calendly.com/productadvisory/30min";
  var NEW_TAB = '<span class="sr-only"> (opens in a new tab)</span>';

  var LINKS = [
    ["index.html", "Assessment"],
    ["lms-dashboard.html", "My learning"],
    ["framework.html", "Framework"],
    ["tool-requests.html", "Tool Roadmap"],
    [WWW, "Product Advisory"]
  ];

  function page() { var p = location.pathname.split("/").pop(); return p || "index.html"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function tiny(path) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>"; }
  var ICON = {
    search: tiny('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    sliders: tiny('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    moon: tiny('<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"/>'),
    menu: tiny('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: tiny('<path d="M6 6l12 12M18 6 6 18"/>')
  };
  var WORDMARK = '<span class="pa-wm" aria-hidden="true"><span class="pa-wm-box">Product</span><span>&Lambda;dvisory</span></span>';

  /* ---------------------------------------------------------------- header */
  function header() {
    var here = page();
    var links = LINKS.map(function (l) {
      var ext = /^https?:/.test(l[0]);
      return '<a href="' + l[0] + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + (l[0] === here ? ' aria-current="page"' : "") + ">" +
        esc(l[1]) + (ext ? '<span aria-hidden="true"> ↗</span>' + NEW_TAB : "") + "</a>";
    }).join("");
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    return '<header class="pa-nav" id="paNav"><div class="pa-nav-in">' +
      '<a class="pa-brand" href="index.html" aria-label="Product Advisory Learning, home">' + WORDMARK + '<span class="pa-app">Learning</span></a>' +
      '<nav class="pa-links" aria-label="Main">' + links + '<button type="button" class="pa-m-only" data-pa="prefs">Make it yours</button></nav>' +
      '<div class="pa-tools">' +
      '<button type="button" class="pa-icon" data-pa="search" aria-label="Search courses and lessons">' + ICON.search + "<kbd>" + (mac ? "⌘" : "Ctrl") + "</kbd><kbd>K</kbd></button>" +
      '<button type="button" class="pa-icon pa-prefs-btn" data-pa="prefs" aria-label="Make it yours: change how this site looks" title="Make it yours">' + ICON.sliders + "</button>" +
      '<button type="button" class="pa-icon" data-pa="theme" aria-label="Toggle light or dark" title="Light / dark">' + ICON.moon + "</button>" +
      '<span id="paNavAccount"></span>' +
      '<button type="button" class="pa-icon pa-menu-btn" data-pa="menu" aria-label="Menu" aria-expanded="false">' + ICON.menu + "</button>" +
      "</div></div></header>";
  }

  // Drawn where this script sits (straight after <body>), before the rest of the page.
  var me = document.currentScript;
  if (me && document.body && !document.getElementById("paNav")) {
    document.documentElement.classList.add("pa-shell");
    me.insertAdjacentHTML("afterend", header());
  }

  /* The pages pad <body>; pull the header out to the edges and the top. */
  function fitHeader() {
    var nav = document.getElementById("paNav");
    if (!nav || nav.parentNode !== document.body) return;
    var cs = getComputedStyle(document.body);
    nav.style.marginLeft = "-" + cs.paddingLeft;
    nav.style.marginRight = "-" + cs.paddingRight;
    nav.style.marginTop = "-" + cs.paddingTop;
    nav.style.marginBottom = cs.paddingTop;
    nav.style.width = "calc(100% + " + cs.paddingLeft + " + " + cs.paddingRight + ")";
    nav.style.alignSelf = "stretch";
  }

  /* ---------------------------------------------------------------- toast */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  function toggleTheme() {
    var L = window.PALook;
    if (!L) return;
    var next = L.isDark() ? "light" : "dark";
    L.set("mode", next);
    syncPanel();
  }

  /* ---------------------------------------------------------------- Make it yours */
  var STYLES = [
    ["classic", "Classic", "Market <em>Driven</em>", "Product Advisory navy and cyan."],
    ["editorial", "Editorial", "Market <em>Driven</em>", "Warm paper, serif headlines."],
    ["boardroom", "Boardroom", "Market <em>Driven</em>", "Navy and gold, squared off."],
    ["lab", "Lab", "market_<em>driven</em>", "Monospace on a grid."]
  ];
  var ACCENTS = [["cyan", "#35c2e8"], ["green", "#0b7a64"], ["blue", "#2457d6"], ["plum", "#8a3ab9"], ["coral", "#e0612b"], ["gold", "#c9971c"]];
  var panel;
  function seg(key, label, opts) {
    return '<div class="pa-pref"><h3 id="pa-' + key + '-l">' + label + '</h3><div class="pa-seg" role="radiogroup" aria-labelledby="pa-' + key + '-l" data-key="' + key + '">' +
      opts.map(function (o) { return '<button type="button" role="radio" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div></div>";
  }
  function buildPanel() {
    panel = document.createElement("div");
    panel.className = "pa-panel-back";
    panel.innerHTML = '<div class="pa-panel" role="dialog" aria-modal="true" aria-labelledby="paPanelTitle">' +
      '<div class="pa-panel-head"><div><h2 id="paPanelTitle">Make it yours</h2></div><button type="button" class="pa-icon" data-pa="close" aria-label="Close">' + ICON.close + "</button></div>" +
      "<p>Changes apply as you click. They follow you to www.productadvisory.co too, on this browser.</p>" +
      '<div class="pa-pref"><h3 id="pa-style-l">Style</h3><div class="style-picks" role="radiogroup" aria-labelledby="pa-style-l" data-key="style">' +
      STYLES.map(function (s) { return '<button type="button" role="radio" data-v="' + s[0] + '" class="style-card"><span class="mini mini-' + s[0] + '" aria-hidden="true"><i class="mh">' + s[2] + '</i><i class="ml"></i><i class="ml s"></i><i class="mb"></i></span><b>' + s[1] + "</b><span>" + s[3] + "</span></button>"; }).join("") +
      "</div></div>" +
      '<div class="pa-pref"><h3 id="pa-accent-l">Accent</h3><div class="swatches" role="radiogroup" aria-labelledby="pa-accent-l" data-key="accent"><button type="button" role="radio" data-v="" class="sw sw-default" title="Style default">Auto</button>' +
      ACCENTS.map(function (a) { return '<button type="button" role="radio" data-v="' + a[0] + '" class="sw" style="--c:' + a[1] + '" title="' + a[0] + '" aria-label="' + a[0] + '"></button>'; }).join("") + "</div></div>" +
      seg("mode", "Colour mode", [["", "System"], ["light", "Light"], ["dark", "Dark"]]) +
      seg("text", "Text size", [["s", "Small"], ["m", "Default"], ["l", "Large"], ["xl", "Larger"]]) +
      seg("density", "Density", [["comfortable", "Comfortable"], ["compact", "Compact"]]) +
      seg("motion", "Motion", [["full", "On"], ["reduced", "Off"]]) +
      '<div class="pa-panel-foot"><button type="button" class="pa-btn ghost" data-pa="reset">Reset everything</button><a class="pa-btn ghost" href="' + WWW + 'preferences.html" target="_blank" rel="noopener">More on productadvisory.co<span aria-hidden="true"> ↗</span>' + NEW_TAB + "</a></div>" +
      "</div>";
    document.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      if (e.target === panel) return closePanel();
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b) return;
      var act = b.getAttribute("data-pa");
      if (act === "close") return closePanel();
      if (act === "reset") { window.PALook.reset(); syncPanel(); toast("Back to the defaults"); return; }
      var grp = b.closest("[data-key]");
      if (grp && b.hasAttribute("data-v")) { window.PALook.set(grp.getAttribute("data-key"), b.getAttribute("data-v")); syncPanel(); }
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") return closePanel();
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].indexOf(e.key) < 0) return;
      var grp = e.target.closest && e.target.closest("[role=radiogroup]");
      if (!grp) return;
      var radios = Array.prototype.slice.call(grp.querySelectorAll("[role=radio]"));
      var i = radios.indexOf(e.target);
      if (i < 0) return;
      e.preventDefault();
      var next = radios[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : radios.length - 1)) % radios.length];
      next.focus(); next.click();
    });
  }
  function syncPanel() {
    if (!panel || !window.PALook) return;
    var p = window.PALook.read();
    Array.prototype.forEach.call(panel.querySelectorAll("[data-key]"), function (grp) {
      var cur = p[grp.getAttribute("data-key")] || "";
      Array.prototype.forEach.call(grp.querySelectorAll("[role=radio]"), function (b) {
        var on = b.getAttribute("data-v") === cur;
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
    });
  }
  var lastFocus;
  function openPanel() {
    if (!panel) buildPanel();
    syncPanel();
    lastFocus = document.activeElement;
    panel.classList.add("open");
    var first = panel.querySelector("[aria-checked=true]") || panel.querySelector("button");
    if (first) first.focus();
  }
  function closePanel() {
    if (!panel) return;
    panel.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------------------------------------------------------- search (⌘K) */
  var ACTIONS = [
    { g: "Go to", t: "Take the assessment", i: "✓", u: "index.html" },
    { g: "Go to", t: "My learning dashboard", i: "⌂", u: "lms-dashboard.html" },
    { g: "Go to", t: "The training framework", i: "◆", u: "framework.html" },
    { g: "Go to", t: "Tool Roadmap: vote for the next toolkit", i: "▣", u: "tool-requests.html" },
    { g: "Go to", t: "My profile", i: "☺", u: "profile.html" },
    { g: "Go to", t: "Team assessments for your company", i: "✉", u: "request-info.html?who=org" },
    { g: "Product Advisory", t: "Services", i: "↗", u: WWW + "services.html", ext: true },
    { g: "Product Advisory", t: "Free toolkits", i: "↗", u: WWW + "toolkits.html", ext: true },
    { g: "Product Advisory", t: "About", i: "↗", u: WWW + "about.html", ext: true },
    { g: "Product Advisory", t: "Contact", i: "↗", u: WWW + "contact.html", ext: true },
    { g: "Product Advisory", t: "Book a free 30-minute call", i: "☎", u: CALENDLY, ext: true },
    { g: "Make it yours", t: "Toggle light / dark", i: "◐", run: toggleTheme },
    { g: "Make it yours", t: "Open Make it yours", i: "⚙", run: openPanel }
  ];
  var KIND = { course: "Courses", lesson: "Lessons", framework: "Skill areas" };
  var pal, palInput, palList, palItems = [], palSel = 0, palFocus, indexLoading = false;

  function loadIndex(then) {
    if (window.PA_SEARCH) return then && then();
    if (indexLoading) return;
    indexLoading = true;
    var s = document.createElement("script");
    s.src = "search-index.js";
    s.onload = function () { indexLoading = false; if (then) then(); };
    s.onerror = function () { indexLoading = false; };
    document.head.appendChild(s);
  }
  function words(s) { return String(s || "").toLowerCase().replace(/[’']/g, "").match(/[a-z0-9+]+/g) || []; }
  function searchIndex(q) {
    var data = window.PA_SEARCH || [];
    var qs = words(q).filter(function (w) { return w.length > 1 || /\d/.test(w); });
    if (!qs.length) return [];
    var out = [];
    data.forEach(function (it) {
      var t = it.t.toLowerCase(), s = (it.s || "").toLowerCase(), x = (it.x || "").toLowerCase(), score = 0, all = true;
      qs.forEach(function (w) {
        var hit = 0;
        if (t.indexOf(w) > -1) hit += 6;
        if (s.indexOf(w) > -1) hit += 3;
        if (x.indexOf(w) > -1) hit += 1;
        if (!hit) all = false;
        score += hit;
      });
      if (score && all) out.push({ it: it, score: score + (it.k === "course" ? 1 : 0) });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 24).map(function (r) { return r.it; });
  }
  function buildPalette() {
    pal = document.createElement("div");
    pal.className = "palette-backdrop";
    pal.innerHTML = '<div class="palette" role="dialog" aria-modal="true" aria-label="Search">' +
      '<input type="text" placeholder="Search courses, lessons and skill areas…" aria-label="Search" autocomplete="off">' +
      '<ul role="listbox"></ul>' +
      '<div class="foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div></div>';
    document.body.appendChild(pal);
    palInput = pal.querySelector("input"); palList = pal.querySelector("ul");
    pal.addEventListener("click", function (e) { if (e.target === pal) closePalette(); });
    palInput.addEventListener("input", renderPalette);
    palInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); markSel(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); palSel = Math.max(0, palSel - 1); markSel(); }
      else if (e.key === "Enter") { e.preventDefault(); if (palItems[palSel]) go(palItems[palSel]); }
      else if (e.key === "Escape") { closePalette(); }
      else if (e.key === "Tab") { e.preventDefault(); }
    });
  }
  function go(it) {
    closePalette();
    if (it.run) return it.run();
    if (it.ext) window.open(it.u, "_blank", "noopener");
    else location.href = it.u;
  }
  function renderPalette() {
    var q = palInput.value.trim();
    var ql = q.toLowerCase();
    var acts = ACTIONS.filter(function (a) { return !ql || (a.t + " " + a.g).toLowerCase().indexOf(ql) > -1; });
    var hits = q ? searchIndex(q).map(function (it) { return { g: KIND[it.k], t: it.t, sub: it.s, i: it.k === "lesson" ? "›" : it.k === "course" ? "▤" : "◆", u: it.u }; }) : [];
    palItems = hits.concat(acts);
    if (q && !hits.length && window.PA_SEARCH) {
      palItems.push({ g: "Ask Product Advisory", t: "Ask on productadvisory.co: “" + q + "”", i: "?", u: WWW + "?ask=" + encodeURIComponent(q), ext: true });
    }
    palSel = 0;
    var html = "", grp = "";
    palItems.forEach(function (a, n) {
      if (a.g !== grp) { grp = a.g; html += '<li class="grp" role="presentation">' + esc(grp) + "</li>"; }
      html += '<li><button type="button" role="option" data-n="' + n + '"><span class="pi">' + esc(a.i) + '</span><span class="pa-txt">' + esc(a.t) +
        (a.sub ? '<span class="pa-sub">' + esc(a.sub) + "</span>" : "") + "</span>" + (a.ext ? "<small>opens in a new tab</small>" : "") + "</button></li>";
    });
    if (!palItems.length) html = '<li class="pa-empty">' + (window.PA_SEARCH ? "No matches." : "Loading courses…") + "</li>";
    palList.innerHTML = html;
    Array.prototype.forEach.call(palList.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { go(palItems[+b.getAttribute("data-n")]); });
      b.addEventListener("mousemove", function () { palSel = +b.getAttribute("data-n"); markSel(); });
    });
    markSel();
  }
  function markSel() {
    Array.prototype.forEach.call(palList.querySelectorAll("button"), function (b) {
      var on = +b.getAttribute("data-n") === palSel;
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (on) b.scrollIntoView({ block: "nearest" });
    });
  }
  function openPalette() {
    if (!pal) buildPalette();
    palFocus = document.activeElement;
    pal.classList.add("open");
    palInput.value = "";
    renderPalette();
    palInput.focus();
    loadIndex(function () { if (pal.classList.contains("open")) renderPalette(); });
  }
  function closePalette() {
    if (!pal) return;
    pal.classList.remove("open");
    if (palFocus && palFocus.focus) palFocus.focus();
  }

  /* ---------------------------------------------------------------- wiring */
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); if (pal && pal.classList.contains("open")) closePalette(); else openPalette(); }
    else if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") && !(document.activeElement && document.activeElement.isContentEditable) && !(pal && pal.classList.contains("open"))) { e.preventDefault(); openPalette(); }
  });
  function init() {
    fitHeader();
    window.addEventListener("resize", fitHeader);
    var nav = document.getElementById("paNav");
    if (!nav) return;
    nav.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-pa]") : null;
      if (!b) return;
      var a = b.getAttribute("data-pa");
      if (a === "search") openPalette();
      else if (a === "prefs") openPanel();
      else if (a === "theme") toggleTheme();
      else if (a === "menu") { var open = nav.classList.toggle("open"); b.setAttribute("aria-expanded", open ? "true" : "false"); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.PAShell = { openSearch: openPalette, openPrefs: openPanel, toggleTheme: toggleTheme, search: searchIndex, loadIndex: loadIndex };
})();
