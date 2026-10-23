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
  var BOOK_CALL = "https://www.productadvisory.co/book";
  var NEW_TAB = '<span class="sr-only"> (opens in a new tab)</span>';

  // The assessment is reached from the dashboard (first launch, or Retake) and the Toolkits Roadmap
  // from www.productadvisory.co or the Profile menu, so the header stays this short.
  var LINKS = [
    ["/lms-dashboard", "My Learning"]
  ];

  // This page's clean address (/lms-dashboard, / for the assessment), whether it was opened as /lms-dashboard or /lms-dashboard.html.
  function page() { var p = location.pathname.split("/").pop().replace(/\.html$/, ""); return !p || p === "index" ? "/" : "/" + p; }
  // The search and Ask indexes name pages by file ("lesson.html?course=..."); links use the clean address.
  function clean(u) { return String(u).replace(/^index\.html/, "/").replace(/^([a-z-]+)\.html/, "/$1"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function tiny(path) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>"; }
  var ICON = {
    search: tiny('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    sliders: tiny('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    moon: tiny('<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"/>'),
    menu: tiny('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: tiny('<path d="M6 6l12 12M18 6 6 18"/>'),
    help: tiny('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17h.01"/>')
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
      '<a class="pa-brand" href="/lms-dashboard" aria-label="Product Advisory Learning, my dashboard">' + WORDMARK + '<span class="pa-app">Learning</span></a>' +
      '<nav class="pa-links" aria-label="Main">' + links + '<button type="button" class="pa-m-only" data-pa="help">Help</button><button type="button" class="pa-m-only" data-pa="prefs">Make it yours</button></nav>' +
      '<div class="pa-tools">' +
      '<button type="button" class="pa-icon pa-help-btn" data-pa="help" aria-label="Help: answers, ask a question, send feedback" title="Help">' + ICON.help + '<span class="pa-help-lbl">Help</span></button>' +
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
      '<div class="pa-panel-foot"><button type="button" class="pa-btn ghost" data-pa="reset">Reset everything</button><a class="pa-btn ghost" href="' + WWW + 'preferences" target="_blank" rel="noopener">More on productadvisory.co<span aria-hidden="true"> ↗</span>' + NEW_TAB + "</a></div>" +
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

  /* ---------------------------------------------------------------- Help (every page) */
  // Short answers about using the site, searchable as you type: [group, question, answer (HTML), extra search words]. A question they don't cover can go to the lessons
  // (Ask AI), to the feedback form, or to a person.
  var HELP = [
    ["Getting started", "What is Product Advisory Learning?", "A skill check and a set of short courses for product management and working with AI. The assessment shows where you are in seven skill areas, and your dashboard turns that into a course plan matched to your level.", "about what platform"],
    ["Getting started", "Where do I start?", "Take the assessment first (it opens from your dashboard), then follow <b>Recommended for you</b> on your dashboard. Your progress saves as you go, so you can stop and come back any time.", "begin first step new"],
    ["The assessment", "How does the assessment work?", "Fourteen quick questions about how you work today. When you finish you see your level in each of the seven skill areas, from Limited to Advanced Experience, and your dashboard builds a course plan from it.", "skill check test quiz questions results level"],
    ["The assessment", "Can I take it again?", "Yes. Use <b>Retake</b> on your dashboard, next to your results. Your new results replace the old ones, and your course plan updates to match.", "retake redo again repeat assessment results"],
    ["The assessment", "What do the four levels mean?", 'Limited, Moderate, Lots of and Advanced Experience describe how you work in each area today, not how long you have done the job. The <a href="/framework">training framework</a> describes each level in every area.', "level tier limited moderate advanced experience framework"],
    ["Courses and progress", "Does my progress save?", "Yes, automatically, whenever you are signed in. Open a course from your dashboard and you pick up where you left off.", "progress save resume continue course lesson lost"],
    ["Courses and progress", "Can I set a weekly goal?", 'Yes. On <a href="/profile#goals">My Profile</a>, choose how many lessons a week and up to three focus areas. Your dashboard shows how this week is going, and your check-in email reports on it.', "goal target weekly focus areas plan habit"],
    ["Courses and progress", "Where are my notes?", "The answers you write in lessons are under <b>Your notes</b> on your dashboard. They are private to you, and are never shared with a company.", "notes reflections answers private"],
    ["Courses and progress", "Can I ask a question about a lesson?", "Yes. Type your question in the box above and choose <b>Ask the lessons</b>, or press Ctrl K (⌘K on a Mac) on any page. The answer comes only from the course lessons, with links to them.", "ask ai question lesson course help"],
    ["Your account", "How do I change my password or email?", 'Change your password from the <b>Profile</b> menu on your dashboard. Change your email on <a href="/profile">My Profile</a>; we send a link to the new address to confirm it.', "password email change account login"],
    ["Your account", "Can I sign in with my personal email too?", 'Yes. On <a href="/profile#signin">My Profile</a>, under <b>Ways to sign in</b>, add your personal Google account (or, if you sign in with Google, another email). Every way opens the same account, so your learning stays with you if you change jobs.', "personal email gmail second email link account sign in google change job keep progress"],
    ["Your account", "How do I add a profile photo?", 'On <a href="/profile">My Profile</a>, choose <b>Upload photo</b>, then drag and zoom it to fit the circle. It shows on your Profile button, and only you see it.', "photo picture image avatar upload profile"],
    ["Your account", "How do I change or stop the emails?", 'On <a href="/profile#goals">My Profile</a>, under <b>Goals and check-in emails</b>, choose Daily, Weekly, Monthly or Off. Every email also has <b>Change how often</b> and <b>Unsubscribe</b> links at the bottom.', "email emails unsubscribe stop notifications check-in reminders frequency report weekly"],
    ["Your account", "I forgot my password", 'On the <a href="/lms-dashboard">dashboard</a> sign-in, choose <b>Forgot password?</b> and we email you a link to set a new one. If you signed up with Google, use <b>Continue with Google</b> instead.', "password reset forgot login sign in"],
    ["Your account", "How do I delete my account?", 'On <a href="/profile">My Profile</a>, at the bottom. It removes your sign-in, your progress and your assessment results.', "delete remove account data privacy"],
    ["Teams and companies", "What does my company see?", "If you joined through a company invitation, your assessment results, answers and course progress are shared with that company's admins while you are a member. Your notes and phone number are never shared, and the account stays yours if you leave.", "company employer admin share privacy see data team"],
    ["Teams and companies", "My invitation link doesn't work", "Check that you copied the whole link from the email. If it still doesn't work, ask the person who invited you to send it again; links can expire or be replaced.", "invite invitation link join expired company"],
    ["Teams and companies", "Can my whole team take the assessment?", 'Yes. <a href="/request-info?who=org">Tell us about your team</a> and we will set up a company account with its own dashboard.', "team company organization pricing group"],
    ["Toolkits", "How do I request or vote for a toolkit?", 'On the <a href="/tool-requests">Toolkits Roadmap</a>: vote for up to three tools, or use <b>Request a tool</b> to suggest your own. Voting and requests need a free account with a verified email.', "tool toolkit request vote roadmap suggest"],
    ["Toolkits", "Where are the free toolkits?", 'On <a href="https://www.productadvisory.co/toolkits" target="_blank" rel="noopener">productadvisory.co/toolkits<span aria-hidden="true"> ↗</span>' + NEW_TAB + "</a>: fillable PDFs and Google Sheets.", "toolkit tools download template pdf sheet free"],
    ["This site", "Can I change how the site looks?", "Yes. <b>Make it yours</b> (the sliders button at the top) sets light or dark, text size, style and accent colour. Your choice follows you to www.productadvisory.co on this browser.", "dark mode light theme text size font accent"]
  ];
  var help, helpQ, helpFocus;
  function buildHelp() {
    help = document.createElement("div");
    help.className = "pa-panel-back pa-help-back";
    var grp = "", list = "";
    HELP.forEach(function (h, i) {
      if (h[0] !== grp) { grp = h[0]; list += '<h3 class="pa-help-grp">' + esc(grp) + "</h3>"; }
      list += '<details class="pa-help-item" data-i="' + i + '"><summary>' + esc(h[1]) + "</summary><p>" + h[2] + "</p></details>";
    });
    help.innerHTML = '<div class="pa-panel pa-help" role="dialog" aria-modal="true" aria-labelledby="paHelpTitle">' +
      '<div class="pa-panel-head"><div><h2 id="paHelpTitle">Help</h2></div><button type="button" class="pa-icon" data-pa="close" aria-label="Close">' + ICON.close + "</button></div>" +
      "<p>Search the answers below, ask about the course content, or tell us what's missing.</p>" +
      '<input type="search" class="pa-help-q" placeholder="What do you need help with?" aria-label="Search help" autocomplete="off">' +
      '<div class="pa-help-ask" hidden></div>' +
      '<div class="pa-help-list">' + list + '</div><p class="pa-help-none" hidden>No answer here yet. Ask the lessons, or send us a note below.</p>' +
      '<div class="pa-panel-foot pa-help-foot"><a class="pa-btn" href="/feedback">Send feedback</a>' +
      '<a class="pa-btn ghost" href="mailto:info@productadvisory.co?subject=' + encodeURIComponent("Help with Product Advisory Learning") + '">Email us</a>' +
      '<a class="pa-btn ghost" href="' + BOOK_CALL + '" target="_blank" rel="noopener">Book a call<span aria-hidden="true"> ↗</span>' + NEW_TAB + "</a></div></div>";
    document.body.appendChild(help);
    helpQ = help.querySelector(".pa-help-q");
    help.addEventListener("click", function (e) {
      if (e.target === help) return closeHelp();
      var b = e.target.closest ? e.target.closest("[data-pa]") : null;
      if (b && b.getAttribute("data-pa") === "close") return closeHelp();
      if (b && b.getAttribute("data-pa") === "ask") { var q = helpQ.value.trim(); closeHelp(); openPalette(); palInput.value = q; showAnswer(q); }
    });
    help.addEventListener("keydown", function (e) { if (e.key === "Escape") closeHelp(); });
    helpQ.addEventListener("input", filterHelp);
  }
  function filterHelp() {
    var q = helpQ.value.trim(), qs = terms(q), shown = 0;
    // Answers that match every word you typed; if none do, those that match any of them.
    var score = HELP.map(function (h) { var hay = terms(h[1] + " " + h[2].replace(/<[^>]+>/g, " ") + " " + (h[3] || "")).join(" ");
      return qs.filter(function (w) { return hay.indexOf(w) > -1; }).length; });
    var strict = qs.length > 0 && score.some(function (n) { return n === qs.length; });
    var hits = score.map(function (n) { return strict ? n === qs.length : n > 0; });
    Array.prototype.forEach.call(help.querySelectorAll(".pa-help-item"), function (d) {
      d.hidden = !!qs.length && !hits[d.getAttribute("data-i")];
      d.open = !!qs.length && !d.hidden && strict;
      if (!d.hidden) shown++;
    });
    Array.prototype.forEach.call(help.querySelectorAll(".pa-help-grp"), function (g) {
      var n = g.nextElementSibling, any = false;
      while (n && n.classList.contains("pa-help-item")) { if (!n.hidden) any = true; n = n.nextElementSibling; }
      g.hidden = !any;
    });
    help.querySelector(".pa-help-none").hidden = !qs.length || shown > 0;
    var ask = help.querySelector(".pa-help-ask");
    ask.hidden = !isQuestion(q);
    ask.innerHTML = ask.hidden ? "" : '<button type="button" class="pa-help-askbtn" data-pa="ask"><span aria-hidden="true">✦</span> Ask the lessons: “' + esc(q) + "”</button>";
  }
  function openHelp() {
    if (!help) buildHelp();
    if (pal && pal.classList.contains("open")) closePalette();
    helpFocus = document.activeElement;
    help.classList.add("open");
    helpQ.value = ""; filterHelp();
    helpQ.focus();
  }
  function closeHelp() {
    if (!help) return;
    help.classList.remove("open");
    if (helpFocus && helpFocus.focus) helpFocus.focus();
  }

  /* ---------------------------------------------------------------- search (⌘K) */
  var ACTIONS = [
    { g: "Go to", t: "My Learning", i: "⌂", u: "/lms-dashboard" },
    { g: "Go to", t: "The training framework", i: "◆", u: "/framework" },
    { g: "Go to", t: "My Profile", i: "☺", u: "/profile" },
    { g: "Go to", t: "My Badges", i: "★", u: "/profile#badges" },
    { g: "Go to", t: "Team assessments for your company", i: "✉", u: "/request-info?who=org" },
    { g: "Product Advisory", t: "Services", i: "↗", u: WWW + "services", ext: true },
    { g: "Product Advisory", t: "Free toolkits", i: "↗", u: WWW + "toolkits", ext: true },
    { g: "Product Advisory", t: "About", i: "↗", u: WWW + "about", ext: true },
    { g: "Product Advisory", t: "Contact", i: "↗", u: WWW + "contact", ext: true },
    { g: "Product Advisory", t: "Book a free 30-minute call", i: "☎", u: BOOK_CALL, ext: true },
    { g: "Make it yours", t: "Toggle light / dark", i: "◐", run: toggleTheme },
    { g: "Make it yours", t: "Open Make it yours", i: "⚙", run: openPanel },
    { g: "Help", t: "Help: answers, guidance and feedback", i: "?", run: function () { openHelp(); } }
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
  /* ---------------------------------------------------------------- Ask AI (answers from the lessons) */
  // ask-index.js holds every lesson's text in short passages; it is loaded only when someone asks.
  var askLoading = null, askStats = null;
  var STOP = ("a an and are as at be but by can do does for from get how i if in into is it its me my of on or our should so " +
    "that the their them then there these they this to us was we what when where which who why will with you your about").split(" ");
  function loadAsk() {
    if (window.PA_ASK) return Promise.resolve();
    if (askLoading) return askLoading;
    askLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "ask-index.js";
      s.onload = function () { resolve(); };
      s.onerror = function () { askLoading = null; reject(new Error("index")); };
      document.head.appendChild(s);
    });
    return askLoading;
  }
  // Rough word roots, so "feature", "features" and "prioritizing", "prioritize" match each other.
  function stem(w) { for (var k = 0; k < 2 && w.length > 4; k++) w = w.replace(/(ings?|ed|es|e|s)$/, ""); return w; }
  function terms(s) { return words(s).filter(function (w) { return STOP.indexOf(w) < 0 && (w.length > 2 || /\d/.test(w)); }).map(stem); }
  // Best passages for a question: words weighted by how rare they are, a bonus for the lesson title, at most two per lesson.
  function retrieve(q, max) {
    var data = window.PA_ASK || [];
    if (!askStats) {
      var df = {};
      askStats = { df: df, docs: data.map(function (p) {
        var tf = {}, tt = {};
        terms(p.x).forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
        terms(p.t).forEach(function (w) { tt[w] = 1; });
        Object.keys(tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
        return { tf: tf, tt: tt };
      }) };
    }
    var qs = terms(q).filter(function (w, i, a) { return a.indexOf(w) === i; });
    var n = data.length || 1, scored = [];
    data.forEach(function (p, i) {
      var d = askStats.docs[i], score = 0;
      qs.forEach(function (w) {
        var idf = Math.log(1 + n / (1 + (askStats.df[w] || 0)));
        if (d.tf[w]) score += idf * (1 + Math.log(d.tf[w]));
        if (d.tt[w]) score += idf * 1.5;
      });
      if (score > 0) scored.push({ p: p, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var out = [], per = {};
    for (var k = 0; k < scored.length && out.length < max; k++) {
      var u = scored[k].p.u;
      if ((per[u] || 0) >= 2) continue;
      per[u] = (per[u] || 0) + 1;
      out.push(scored[k].p);
    }
    return out;
  }
  function isQuestion(q) { return /\?\s*$/.test(q) || words(q).length >= 3; }
  function answerHtml(text, used) {
    var lines = esc(text).split(/\n+/), html = "", list = false;
    lines.forEach(function (ln) {
      ln = ln.trim();
      if (!ln) return;
      ln = ln.replace(/\[(\d)\]/g, function (m, d) {
        var p = used[+d - 1];
        return p ? '<a class="pa-cite" href="' + esc(clean(p.u)) + '" title="' + esc(p.t) + '">' + d + "</a>" : "";
      });
      if (/^[-•]\s+/.test(ln)) { if (!list) { html += "<ul>"; list = true; } html += "<li>" + ln.replace(/^[-•]\s+/, "") + "</li>"; }
      else { if (list) { html += "</ul>"; list = false; } html += "<p>" + ln + "</p>"; }
    });
    return html + (list ? "</ul>" : "");
  }
  // One row per lesson, with every passage number that came from it; lessons the answer did not cite are dimmed.
  function sourcesHtml(used, cited) {
    var order = [], nums = {}, rows = "";
    used.forEach(function (p, i) { if (!nums[p.u]) { nums[p.u] = []; order.push(p); } nums[p.u].push(i + 1); });
    order.forEach(function (p) {
      var on = !cited || nums[p.u].some(function (n) { return cited.indexOf(n) > -1; });
      rows += '<li' + (on ? "" : ' class="pa-dim"') + '><a href="' + esc(clean(p.u)) + '"><b>' + nums[p.u].join(" ") + "</b> " + esc(p.t) + "</a></li>";
    });
    return '<div class="pa-src"><h4>From the lessons</h4><ol>' + rows + "</ol></div>";
  }
  // A question no lesson matched goes on the "Unanswered questions" tab (signed-in learners only), so the
  // missing lessons show up. Fire and forget: the visitor sees nothing different.
  function reportMiss(q) {
    var acct = window.PAAccount;
    if (!acct) return;
    acct.idToken().then(function (tok) { if (tok) acct.backend({ action: "askMiss", idToken: tok, q: q }); }).catch(function () {});
  }
  var askSeq = 0;
  function showAnswer(q) {
    var seq = ++askSeq;
    palItems = [];
    var box = function (html) { if (seq === askSeq) palList.innerHTML = '<li class="pa-answer" role="presentation"><div aria-live="polite">' + html + "</div></li>"; };
    var head = '<p class="pa-q">' + esc(q) + "</p>";
    box(head + '<p class="pa-wait">Reading the lessons…</p>');
    var used = [];
    loadAsk().then(function () {
      used = retrieve(q, 4);
      if (!used.length) throw { code: "nothing" };
      var acct = window.PAAccount;
      return acct ? acct.idToken() : null;
    }).then(function (tok) {
      if (!tok) throw { code: "signin" };
      var ctx = used.map(function (p) { return { u: p.u, t: p.t, x: p.x.slice(0, 700) }; });
      return window.PAAccount.backend({ action: "askLessons", idToken: tok, q: q, ctx: JSON.stringify(ctx) });
    }).then(function (r) {
      if (!r || !r.ok) throw { code: r && r.error || "down" };
      box(head + '<div class="pa-ans">' + answerHtml(r.text, used) + "</div>" + sourcesHtml(used, r.cited && r.cited.length ? r.cited : null) +
        '<p class="pa-note">An AI answer written only from your course lessons. Open a lesson for the full picture.</p>');
    }).catch(function (e) {
      var code = e && e.code, msg;
      if (code === "nothing") reportMiss(q);
      if (code === "nothing") msg = "The lessons don't cover that yet. Try other words, or <a href=\"" + WWW + "?ask=" + encodeURIComponent(q) + "\" target=\"_blank\" rel=\"noopener\">ask on productadvisory.co<span aria-hidden=\"true\"> ↗</span>" + NEW_TAB + "</a>.";
      else if (code === "signin" || code === "not_verified") msg = 'Answers from the lessons are for signed-in learners. <a href="/lms-dashboard">Sign in on your dashboard</a>, then ask again.';
      else if (code === "daily_limit") msg = "You've asked a lot today. Ask again tomorrow; the lessons below are the closest matches.";
      else msg = "Couldn't get an answer just now. The lessons below are the closest matches.";
      box(head + '<p class="pa-wait">' + msg + "</p>" + (used.length && code !== "nothing" ? sourcesHtml(used, null) : ""));
    });
  }

  function buildPalette() {
    pal = document.createElement("div");
    pal.className = "palette-backdrop";
    pal.innerHTML = '<div class="palette" role="dialog" aria-modal="true" aria-label="Search">' +
      '<input type="text" placeholder="Search the lessons, or ask a question…" aria-label="Search or ask" autocomplete="off">' +
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
    if (it.ask) return showAnswer(it.ask);
    closePalette();
    if (it.run) return it.run();
    if (it.ext) window.open(it.u, "_blank", "noopener");
    else location.href = it.u;
  }
  function renderPalette() {
    var q = palInput.value.trim();
    var ql = q.toLowerCase();
    var acts = ACTIONS.filter(function (a) { return !ql || (a.t + " " + a.g).toLowerCase().indexOf(ql) > -1; });
    var hits = q ? searchIndex(q).map(function (it) { return { g: KIND[it.k], t: it.t, sub: it.s, i: it.k === "lesson" ? "›" : it.k === "course" ? "▤" : "◆", u: clean(it.u) }; }) : [];
    palItems = (q && isQuestion(q) ? [{ g: "Ask AI", t: "Ask the lessons: “" + q + "”", i: "✦", ask: q }] : []).concat(hits, acts);
    if (q && !hits.length && window.PA_SEARCH && !isQuestion(q)) {
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
      else if (a === "help") openHelp();
      else if (a === "menu") { var open = nav.classList.toggle("open"); b.setAttribute("aria-expanded", open ? "true" : "false"); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.PAShell = { openHelp: openHelp, openSearch: openPalette, openPrefs: openPanel, toggleTheme: toggleTheme, search: searchIndex, loadIndex: loadIndex, retrieve: retrieve, loadAsk: loadAsk, ask: showAnswer };
})();
