/* Compass, the assistant in Learning's header (the Compass button pa-shell.js draws). A panel on the right that can
   go full screen; it answers about what's on the page (window.PACompassPage, see compass-core.js) and the lessons,
   with numbered sources. The conversation stays for this tab as you move between pages (sessionStorage), and the
   panel reopens where you left it. Nothing is sent until the learner asks. Server: apps-script/Code.gs, section 14b.

   PACompass.open(), .close(), .toggle(), .ask(question) */
(function () {
  'use strict';
  if (window.PACompass) return;
  var C = window.CompassCore;
  if (!C) return;
  var KEY = 'pa_compass_v1';
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>';
  var EXPAND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  var SHRINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var NEW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  var state = load();
  function load() {
    try { var s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.msgs)) return s; } catch (e) { /* storage off */ }
    return { msgs: [], open: false, full: false, left: null };
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ msgs: state.msgs.slice(-30), open: state.open, full: state.full, left: state.left })); } catch (e) { /* storage off */ } }
  function track(name, extra) { try { if (window.gtag) window.gtag('event', name, extra || {}); } catch (e) { /* no analytics */ } }

  function pageInfo() {
    try { var p = typeof window.PACompassPage === 'function' ? window.PACompassPage() : null; if (p && p.x) return { k: C.SEES[p.k] ? p.k : 'page', t: String(p.t || ''), x: String(p.x) }; } catch (e) { /* no page info */ }
    return null;
  }
  function kind() { var p = pageInfo(); return p ? p.k : 'page'; }

  /* ---------------------------------------------------------------- the panel */
  var panel = document.createElement('aside');
  panel.className = 'cp';
  panel.id = 'paCompass';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Compass, your learning assistant');
  panel.hidden = true;
  panel.innerHTML =
    '<div class="cp-in">' +
    '<header class="cp-head"><span class="cp-mark">' + ICON + '</span><div class="cp-id"><b>Compass</b><small class="cp-sees"></small></div>' +
    '<button type="button" class="cp-btn cp-new" title="New conversation" aria-label="Start a new conversation">' + NEW + '</button>' +
    '<button type="button" class="cp-btn cp-full" aria-pressed="false"></button>' +
    '<button type="button" class="cp-btn cp-x" aria-label="Close Compass" title="Close">' + CLOSE + '</button></header>' +
    '<div class="cp-log" role="log" aria-live="polite" tabindex="-1"></div>' +
    '<form class="cp-form"><label class="cp-sr" for="cpInput">Ask Compass</label>' +
    '<textarea id="cpInput" rows="1" maxlength="400" placeholder=""></textarea>' +
    '<button type="submit" class="cp-send" aria-label="Ask">' + SEND + '</button></form>' +
    '<p class="cp-foot"></p></div>';
  document.body.appendChild(panel);
  var log = panel.querySelector('.cp-log'), input = panel.querySelector('textarea'), form = panel.querySelector('form');
  var fullBtn = panel.querySelector('.cp-full'), opener = null, busy = false;

  function paintChrome() {
    var k = kind();
    panel.querySelector('.cp-sees').textContent = 'Sees: ' + C.SEES[k] + ' and your courses';
    input.placeholder = C.PLACEHOLDER[k];
    panel.classList.toggle('full', !!state.full);
    document.documentElement.classList.toggle('cp-full-open', !!(state.open && state.full));
    fullBtn.setAttribute('aria-pressed', state.full ? 'true' : 'false');
    fullBtn.setAttribute('aria-label', state.full ? 'Back to the side panel' : 'Full screen');
    fullBtn.title = state.full ? 'Side panel' : 'Full screen';
    fullBtn.innerHTML = state.full ? SHRINK : EXPAND;
    panel.querySelector('.cp-foot').innerHTML = 'Answers come only from this page and the courses, with sources. Nothing is shared until you ask.' +
      (state.left !== null && state.left !== undefined ? ' <span class="cp-left">' + state.left + ' question' + (state.left === 1 ? '' : 's') + ' left today.</span>' : '');
  }

  function welcome() {
    var k = kind(), box = document.createElement('div');
    box.className = 'cp-hello';
    box.innerHTML = '<p><b>Hi, I’m Compass.</b> Ask me anything about ' + C.esc(C.SEES[k].charAt(0).toLowerCase() + C.SEES[k].slice(1)) +
      ' or your courses. I answer from the course itself and show where each answer comes from.</p><div class="cp-chips"></div>';
    var chips = box.querySelector('.cp-chips');
    C.SUGGEST[k].forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cp-chip'; b.textContent = q;
      b.addEventListener('click', function () { ask(q); });
      chips.appendChild(b);
    });
    return box;
  }

  function msgNode(m) {
    var d = document.createElement('div');
    d.className = 'cp-msg cp-' + m.r + (m.err ? ' cp-err' : '');
    if (m.r === 'u') { d.textContent = m.t; return d; }
    if (m.err) { d.innerHTML = '<p>' + C.errorText(m.err) + (m.why ? '<small class="cp-why">Details: ' + C.esc(m.why) + '</small>' : '') + '</p>'; return d; }
    d.innerHTML = C.render(m.t, m.src);
    var cited = (m.cited || []).filter(function (n) { return m.src && m.src[n - 1]; });
    if (cited.length) {
      var ol = document.createElement('ol');
      ol.className = 'cp-src';
      cited.sort(function (a, b) { return a - b; }).forEach(function (n) {
        var s = m.src[n - 1], li = document.createElement('li');
        li.innerHTML = '<b>' + n + '</b> ' + (s.self || !s.u ? '<span>' + C.esc(s.t) + '</span>' : '<a href="' + C.esc(s.u) + '">' + C.esc(s.t) + '</a>');
        ol.appendChild(li);
      });
      d.appendChild(ol);
    }
    var acts = document.createElement('div');
    acts.className = 'cp-acts';
    var copy = document.createElement('button');
    copy.type = 'button'; copy.textContent = 'Copy';
    copy.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(m.t.replace(/\[\d\]/g, '')).then(function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 1500); }, function () { /* not allowed */ });
    });
    acts.appendChild(copy);
    d.appendChild(acts);
    return d;
  }

  function paintLog() {
    log.textContent = '';
    if (!state.msgs.length) log.appendChild(welcome());
    state.msgs.forEach(function (m) { log.appendChild(msgNode(m)); });
    if (busy) {
      var w = document.createElement('div');
      w.className = 'cp-msg cp-a cp-wait';
      w.innerHTML = '<span class="cp-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="cp-sr">Compass is reading the page and the lessons</span>';
      log.appendChild(w);
    }
    log.scrollTop = log.scrollHeight;
  }

  /* ---------------------------------------------------------------- asking */
  function ask(q) {
    q = String(q || '').replace(/\s+/g, ' ').trim();
    if (!q || busy) return;
    if (q.length > 400) q = q.slice(0, 400);
    var hist = C.history(state.msgs);
    state.msgs.push({ r: 'u', t: q });
    busy = true; save(); paintLog();
    input.value = ''; fit();
    var page = pageInfo(), sent = page ? { k: page.k, t: page.t, x: C.pickPage(page.x, q) } : null;
    var passages = [], shell = window.PAShell, acct = window.PAAccount;
    track('compass_ask', { page: sent ? sent.k : 'none' });
    var done = function (m) { busy = false; state.msgs.push(m); save(); paintLog(); paintChrome(); input.focus(); };
    if (!navigator.onLine) return done({ r: 'a', err: 'offline' });
    // A page can bring its own way to ask (www asks through notes-bridge.html): fn(q, hist, page) -> Promise<{ r, passages }>.
    var own = typeof window.PACompassTransport === 'function' ? window.PACompassTransport : null;
    (own ? own(q, hist, sent).then(function (x) { passages = (x && x.passages) || []; return x && x.r; }) :
    (shell && shell.loadAsk ? shell.loadAsk() : Promise.resolve()).then(function () {
      passages = shell && shell.retrieve ? shell.retrieve(q + (sent && sent.t ? ' ' + sent.t : ''), 4) : [];
      return acct ? acct.idToken() : null;
    }).then(function (tok) {
      if (!tok) throw { code: 'signin' };
      return acct.backend({ action: 'compass', idToken: tok, q: q, h: JSON.stringify(hist), page: sent ? JSON.stringify(sent) : '',
        ctx: JSON.stringify(passages.map(function (p) { return { u: p.u, t: p.t, x: String(p.x).slice(0, 650) }; })) }, 45000);   // an answer can take a while
    })).then(function (r) {
      if (!r || !r.ok) throw { code: r && r.error || 'down', detail: r ? r.detail : 'no reply from the server in time' };
      if (typeof r.left === 'number') state.left = r.left;
      done({ r: 'a', t: r.text, cited: r.cited || [], src: C.sources(sent, passages, location.pathname + location.search) });
    }).catch(function (e) { done({ r: 'a', err: (e && e.code) || 'down', why: e && e.detail ? String(e.detail).slice(0, 200) : '' }); });
  }

  function fit() { input.style.height = 'auto'; input.style.height = Math.min(160, input.scrollHeight) + 'px'; }
  input.addEventListener('input', fit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });

  /* ---------------------------------------------------------------- open, close, full screen */
  function setButtons() {
    document.querySelectorAll('[data-pa="compass"]').forEach(function (b) { b.setAttribute('aria-expanded', state.open ? 'true' : 'false'); });
  }
  function open(focus) {
    if (!state.open) opener = document.activeElement;
    state.open = true; save();
    panel.hidden = false;
    document.documentElement.classList.add('cp-open');
    paintChrome(); paintLog(); setButtons();
    if (focus !== false) setTimeout(function () { input.focus(); }, 30);
    track('compass_open');
  }
  function close() {
    state.open = false; save();
    panel.hidden = true;
    document.documentElement.classList.remove('cp-open', 'cp-full-open');
    setButtons();
    var b = opener && opener.focus && document.contains(opener) && opener !== document.body ? opener : document.getElementById('paCompassFab');
    if (b) b.focus();
  }
  panel.querySelector('.cp-x').addEventListener('click', close);
  fullBtn.addEventListener('click', function () { state.full = !state.full; save(); paintChrome(); input.focus(); track('compass_full', { on: state.full ? 1 : 0 }); });
  panel.querySelector('.cp-new').addEventListener('click', function () { if (busy) return; state.msgs = []; save(); paintLog(); input.focus(); });
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); if (state.full) { state.full = false; save(); paintChrome(); } else close(); } });

  window.PACompass = { open: open, close: close, toggle: function () { if (state.open) close(); else open(); }, ask: function (q) { open(); ask(q); } };
  if (state.open) open(false);   // it was open on the last page
  // the page says what Compass can see once its own script has run: label and suggestions follow
  var repaint = function () { if (state.open) { paintChrome(); if (!state.msgs.length) paintLog(); } };
  if (document.readyState !== 'complete') addEventListener('load', function () { repaint(); setTimeout(repaint, 1500); });
  else setTimeout(repaint, 0);
})();
