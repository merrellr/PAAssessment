// library-ui.js: the Library tab on My Learning (#libraryPanel). Compass's three picks ("Worth your time right now"),
// an Ask Compass box, and everything else under "Browse everything", filtered by kind, area and words.
//   LibraryUI.render(ctx, { plan })   ctx: the coach's context; plan: PlanCore.status(...) or null
(function (root) {
  var L = root.LibraryCore;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var ARROW = '<span aria-hidden="true"> →</span>';
  var ICO = {
    lesson: '<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
    listen: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>',
    practice: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2"/>',
    article: '<path d="M6 4h9l3 3v13H6z"/><path d="M9 10h6M9 13.5h6M9 17h4"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'
  };
  var VERB = { lesson: 'Read', listen: 'Listen', article: 'Read', practice: 'Practise', tool: 'Open' };
  var audio = null, state = { kind: 'all', d: 'all', q: '', open: false, shown: 40 }, ctx0, all = [], plan0 = null, listenOf = {};

  function ico(k) { return '<span class="lb-ico k-' + k + '" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICO[k] + '</svg></span>'; }
  function meta(x) { return [L.KINDS[x.kind], x.kind === 'tool' ? '' : x.area, x.level, x.min + ' min'].filter(Boolean).map(esc).join(' · '); }

  function pickCard(x) {
    return '<a class="card lb-pick" href="' + esc(x.href) + '" data-lib-go="pick-' + x.kind + '">' + ico(x.kind) +
      '<span class="lb-pk">' + esc(L.KINDS[x.kind]) + ' · ' + x.min + ' min</span><b>' + esc(x.title) + '</b>' +
      '<span class="lb-why"><span class="sr-only">Why Compass picked this: </span>' + esc(x.why) + '</span><span class="lb-cta">' + VERB[x.kind] + ARROW + '</span></a>';
  }
  function row(x) {
    return '<li class="lb-row' + (x.done ? ' done' : '') + '">' + ico(x.kind) + '<a href="' + esc(x.href) + '" data-lib-go="row-' + x.kind + '"' + (x.ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(x.title) + (x.ext ? '<span class="sr-only"> (opens in a new tab)</span> <span aria-hidden="true">↗</span>' : '') + '</a>' +
      '<span class="lb-meta">' + meta(x) + (x.done ? ' · <span class="lb-done">Done</span>' : '') +
      (x.kind === 'lesson' && state.kind === 'all' && listenOf[x.href] ? ' · <a class="lb-listen" href="' + esc(listenOf[x.href].href) + '" data-lib-go="row-listen">Listen, ' + listenOf[x.href].min + ' min</a>' : '') + '</span></li>';
  }
  function browse() {
    var list = L.filter(all, state), more;
    if (state.kind === 'all') list = list.filter(function (x) { return x.kind !== 'listen'; });   // a lesson's Listen is on its row
    more = list.length - state.shown;
    var kinds = [['all', 'Everything']].concat(Object.keys(L.KINDS).map(function (k) { return [k, { lesson: 'Lessons', listen: 'Listen', article: 'Articles', practice: 'Practice', tool: 'Toolkits' }[k]]; }));
    return '<div class="lb-filters"><div class="lb-kinds" role="group" aria-label="Show">' + kinds.map(function (k) {
        return '<button type="button" class="pl-opt' + (state.kind === k[0] ? ' on' : '') + '" aria-pressed="' + (state.kind === k[0]) + '" data-lib-kind="' + k[0] + '">' + esc(k[1]) + '</button>';
      }).join('') + '</div>' +
      '<label class="sr-only" for="lbArea">Skill area</label><select id="lbArea" class="lb-area"><option value="all">All skill areas</option>' + Object.keys(ctx0.areas || {}).map(function (d) {
        return '<option value="' + esc(d) + '"' + (state.d === d ? ' selected' : '') + '>' + esc(ctx0.areas[d]) + '</option>';
      }).join('') + '</select>' +
      '<label class="sr-only" for="lbQ">Search the library</label><input id="lbQ" class="lb-q" type="search" placeholder="Search the library" value="' + esc(state.q) + '" autocomplete="off"></div>' +
      '<p class="cc-muted lb-count" aria-live="polite">' + (list.length ? list.length + (list.length === 1 ? ' item' : ' items') : 'Nothing matches. Try fewer words, or ask Compass above.') + '</p>' +
      '<ul class="lb-list">' + list.slice(0, state.shown).map(row).join('') + '</ul>' +
      (more > 0 ? '<button type="button" class="cc-btn ghost sm" data-lib-more>Show ' + Math.min(more, 40) + ' more</button>' : '');
  }
  function view() {
    var picks = L.picks(ctx0, all, plan0), icon = (root.PAIcons && root.PAIcons.compass) || '';
    var counts = {}; all.forEach(function (x) { counts[x.kind] = (counts[x.kind] || 0) + 1; });
    return '<section class="lb-top" aria-labelledby="lbPicksT"><div class="lb-head"><div><span class="eyebrow">Library</span><h2 id="lbPicksT">Worth your time right now</h2>' +
      '<p class="cc-muted">Compass picks three from everything here, using your skill check' + (plan0 ? ', your answers and your study plan' : ' and your answers') + '.</p></div></div>' +
      '<div class="lb-picks">' + picks.map(pickCard).join('') + '</div></section>' +
      '<section class="card lb-askcard" aria-label="Ask Compass about the library"><form class="cc-ask cc-ask-home" data-coach-ask><span class="cc-ask-compass" aria-hidden="true">' + icon + '</span>' +
      '<input type="text" maxlength="300" placeholder="Ask Compass what to read, listen to or try…" aria-label="Ask Compass"><button type="submit" aria-label="Ask">↑</button></form>' +
      '<div class="cc-try" aria-label="Example questions"><span>Try:</span>' + ['What should I read about running discovery interviews?', 'Something short to listen to on prioritization', 'Which toolkit helps me decide build or buy?'].map(function (q) {
        return '<button type="button" class="cc-try-q" data-try="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></section>' +
      '<details class="card lb-browse"' + (state.open ? ' open' : '') + '><summary><b>Browse everything</b><span class="cc-muted">' + (counts.lesson || 0) + ' lessons · ' + (counts.listen || 0) + ' to listen to · ' + (counts.article || 0) + ' articles · ' + (counts.tool || 0) + ' toolkits · practice in every area</span></summary>' +
      '<div class="lb-body">' + (state.open ? browse() : '') + '</div></details>';
  }

  function drawBrowse() {
    var body = document.querySelector('#libraryPanel .lb-body');
    if (!body) return;
    body.innerHTML = browse(); wireBrowse();
  }
  function wireBrowse() {
    var p = $('libraryPanel');
    Array.prototype.forEach.call(p.querySelectorAll('[data-lib-kind]'), function (b) {
      b.onclick = function () { state.kind = b.getAttribute('data-lib-kind'); state.shown = 40; drawBrowse(); var x = p.querySelector('[data-lib-kind="' + state.kind + '"]'); if (x) x.focus(); };
    });
    var a = $('lbArea'); if (a) a.onchange = function () { state.d = a.value; state.shown = 40; drawBrowse(); $('lbArea').focus(); };
    var q = $('lbQ'); if (q) q.oninput = function () {
      state.q = q.value; state.shown = 40;
      var pos = q.selectionStart; drawBrowse(); var n = $('lbQ'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {}
    };
    var m = p.querySelector('[data-lib-more]'); if (m) m.onclick = function () { state.shown += 40; drawBrowse(); var rows = p.querySelectorAll('.lb-row a'); if (rows[state.shown - 40]) rows[state.shown - 40].focus(); };
  }
  function draw() {
    var p = $('libraryPanel');
    if (!p) return;
    // a redraw (the audio list arriving, a fresh render) keeps focus, and the caret, where they were
    var act = document.activeElement, keepId = act && p.contains(act) && act.id ? act.id : '', caret = keepId && act.selectionStart != null ? act.selectionStart : null;
    p.innerHTML = view();
    var det = p.querySelector('.lb-browse');
    det.addEventListener('toggle', function () { state.open = det.open; if (det.open && !p.querySelector('.lb-list')) drawBrowse(); });
    if (state.open) wireBrowse();
    if (keepId && $(keepId)) { $(keepId).focus({ preventScroll: true }); if (caret != null) try { $(keepId).setSelectionRange(caret, caret); } catch (e) {} }
    if (root.CoachUI && root.CoachUI.wireAsk) root.CoachUI.wireAsk(p);
    Array.prototype.forEach.call(p.querySelectorAll('[data-lib-go]'), function (a) {
      a.addEventListener('click', function () { if (root.PAAnalytics) root.PAAnalytics.event('library_go', { kind: a.getAttribute('data-lib-go') }); });
    });
  }

  function render(ctx, opts) {
    if (!L || !$('libraryPanel')) return;
    ctx0 = ctx; plan0 = (opts && opts.plan) || null;
    var go = function () {
      all = L.items(ctx0, audio || {}, root.SavedToolsCore ? root.SavedToolsCore.TOOLS : {});
      listenOf = {}; all.forEach(function (x) { if (x.kind === 'listen') listenOf[x.href.replace('&listen=1', '')] = x; });
      draw();
    };
    go();
    if (audio === null) {   // the lesson audio index, for the Listen items and their minutes
      audio = {};
      fetch('/audio/lessons/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { audio = j || {}; go(); }).catch(function () {});
    }
  }

  root.LibraryUI = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
