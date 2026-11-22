/* Highlights, notes and tags in Learning's lessons: the same as on www's articles and book (www's assets/js/notes.js),
   but saved straight to the reader's account (they are always signed in here), through NotesCore.store.

   PANotes.attach({ root, page, title, kind, store }) -> { repaint() }
     root   the element whose text can be highlighted (#lessonBody)
     page   this page's address, as stored: /lesson?course=…&lesson=…
     title  shown in My notes ("Course: Lesson 3. Title")
     kind   'lesson'
     store  NotesCore.store(...) for the signed-in person: { all(), save(note) }

   Select text: four colours, Note and Copy. Click a highlight to change its colour, note or tags, or delete it.
   Notes (bottom right) lists this lesson's notes or all of them, and links to My notes. Styles: notes-ui.css. */
(function () {
  "use strict";
  var N = window.NotesCore;
  var COLORS = [["y", "Yellow"], ["b", "Blue"], ["g", "Green"], ["p", "Pink"]];
  var SKIP = "button, input, textarea, select, label, script, style, .pa-note-ui, sup, [aria-hidden='true']";
  var ICON = {
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M9 9h6M9 13h4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16l-7-4-7 4z"/></svg>'
  };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;   // only our own icons
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function track(name, extra) { try { if (window.gtag) window.gtag("event", name, Object.assign({ kind: "lesson" }, extra || {})); } catch (e) { /* no analytics */ } }

  function attach(o) {
    var root = o.root, PAGE = o.page, TITLE = String(o.title || "").slice(0, 200), KIND = o.kind || "lesson", store = o.store;
    if (!root || !N || !store || !window.getSelection) return null;
    var notes = {};   // id -> note (deleted ones kept, so a deletion isn't undone by a late save)
    var loaded = false;

    /* ------------------------------------------------------------ the page's text */
    function textNodes() {
      var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) { return n.parentNode.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
      });
      while (w.nextNode()) out.push(w.currentNode);
      return out;
    }
    function flat() {
      var text = "", map = [];
      textNodes().forEach(function (n) { map.push({ node: n, start: text.length }); text += n.nodeValue; });
      return { text: text, map: map };
    }
    function boundary(f, container, off) {
      for (var i = 0; i < f.map.length; i++) if (f.map[i].node === container) return f.map[i].start + off;
      var r = document.createRange();
      try { r.setStart(container, off); } catch (e) { return -1; }
      for (var j = 0; j < f.map.length; j++) if (r.comparePoint(f.map[j].node, 0) >= 0) return f.map[j].start;
      return f.text.length;
    }
    function find(f, n) {
      var hits = [], i = f.text.indexOf(n.quote);
      while (i > -1 && hits.length < 50) { hits.push(i); i = f.text.indexOf(n.quote, i + 1); }
      if (!hits.length) return -1;
      var score = function (at) {
        var s = 0;
        if (f.text.slice(Math.max(0, at - n.prefix.length), at) === n.prefix) s += 2;
        if (f.text.substr(at + n.quote.length, n.suffix.length) === n.suffix) s += 2;
        return s - Math.abs(at - n.pos) / 1e6;
      };
      hits.sort(function (a, b) { return score(b) - score(a); });
      return hits[0];
    }

    /* ------------------------------------------------------------ drawing */
    function unwrap(id) {
      root.querySelectorAll("mark.pa-hl" + (id ? '[data-note="' + id + '"]' : "")).forEach(function (m) {
        var p = m.parentNode;
        while (m.firstChild) p.insertBefore(m.firstChild, m);
        p.removeChild(m);
        p.normalize();
      });
    }
    function wrap(n) {
      var f = flat(), at = find(f, n);
      n._lost = at < 0;
      if (at < 0) return;
      var end = at + n.quote.length, parts = [];
      f.map.forEach(function (m) {
        var s = m.start, e = m.start + m.node.nodeValue.length;
        if (e <= at || s >= end) return;
        parts.push({ node: m.node, from: Math.max(at, s) - s, to: Math.min(end, e) - s });
      });
      parts.forEach(function (p, k) {
        var node = p.node;
        if (!node.nodeValue.slice(p.from, p.to).trim() && parts.length > 1) return;
        if (p.to < node.nodeValue.length) node.splitText(p.to);
        if (p.from > 0) node = node.splitText(p.from);
        var m = document.createElement("mark");
        m.className = "pa-hl pa-hl-" + n.color + (n.note ? " has-note" : "");
        m.setAttribute("data-note", n.id);
        if (k === 0) { m.setAttribute("tabindex", "0"); m.setAttribute("role", "button"); m.setAttribute("aria-label", "Highlight" + (n.note ? " with a note" : "") + ": open to edit"); }
        node.parentNode.insertBefore(m, node);
        m.appendChild(node);
      });
    }
    function mine() { return N.onPage(Object.keys(notes).map(function (k) { return notes[k]; }), PAGE); }
    function all() { return N.live(Object.keys(notes).map(function (k) { return notes[k]; })).sort(function (a, b) { return b.updated - a.updated; }); }
    function paint() { unwrap(); mine().forEach(wrap); }
    function refresh(n) { unwrap(n.id); if (!n.deleted) wrap(n); }

    /* ------------------------------------------------------------ saving */
    var pendingSave = {};
    function put(n) {
      n.updated = Math.max(Date.now(), (n.updated || 0) + 1);
      notes[n.id] = n;
      clearTimeout(pendingSave[n.id]);
      pendingSave[n.id] = setTimeout(function () {
        store.save(n).catch(function () { toast("That didn't save. Check your connection and try again."); });
      }, 600);
    }

    /* ------------------------------------------------------------ the selection toolbar */
    var bar = el("div", { class: "pa-note-ui pa-selbar", role: "toolbar", "aria-label": "Highlight or note", hidden: true });
    var keep = function (e) { e.preventDefault(); };
    COLORS.forEach(function (c) {
      bar.appendChild(el("button", { type: "button", class: "pa-dot pa-hl-" + c[0], "aria-label": "Highlight " + c[1].toLowerCase(), title: c[1], onmousedown: keep, onclick: function () { create(c[0], false); } }));
    });
    bar.appendChild(el("button", { type: "button", class: "pa-sb-btn", html: ICON.note + "<span>Note</span>", onmousedown: keep, onclick: function () { create("y", true); } }));
    bar.appendChild(el("button", { type: "button", class: "pa-sb-btn", html: ICON.copy + "<span>Copy</span>", "aria-label": "Copy the text", onmousedown: keep, onclick: function () {
      var t = String(getSelection()); hideBar();
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast("Copied"); }, function () { /* not allowed */ });
    } }));
    document.body.appendChild(bar);
    var pending = null;
    function hideBar() { bar.hidden = true; pending = null; }
    function place(box, rect, below) {
      var w = box.offsetWidth, h = box.offsetHeight, x = rect.left + rect.width / 2 - w / 2 + scrollX, y;
      x = Math.max(scrollX + 8, Math.min(x, scrollX + document.documentElement.clientWidth - w - 8));
      y = below || rect.top < h + 80 ? rect.bottom + scrollY + 10 : rect.top + scrollY - h - 10;
      box.style.left = x + "px"; box.style.top = y + "px";
    }
    function readSelection() {
      var sel = getSelection();
      if (!sel.rangeCount || sel.isCollapsed) return null;
      var r = sel.getRangeAt(0), c = r.commonAncestorContainer;
      if (!root.contains(c)) return null;
      if (c.nodeType === 1 && c.closest && c.closest(SKIP)) return null;
      var f = flat(), s = boundary(f, r.startContainer, r.startOffset), e = boundary(f, r.endContainer, r.endOffset);
      if (s < 0 || e <= s) return null;
      var raw = f.text.slice(s, e);
      s += raw.length - raw.replace(/^\s+/, "").length; e -= raw.length - raw.replace(/\s+$/, "").length;
      if (e - s < 2) return null;
      if (e - s > 3000) e = s + 3000;
      return { s: s, e: e, text: f.text, rect: r.getBoundingClientRect() };
    }
    var coarse = matchMedia("(pointer: coarse)");
    function onSelect() {
      if (!loaded || (editor.box && !editor.box.hidden)) return;
      var p = readSelection();
      if (!p) { if (!bar.hidden) hideBar(); return; }
      pending = p; bar.hidden = false; place(bar, p.rect, coarse.matches);
    }
    var selTimer = 0;
    document.addEventListener("selectionchange", function () { clearTimeout(selTimer); selTimer = setTimeout(onSelect, 220); });

    function create(color, withNote) {
      if (!pending) return;
      var p = pending, now = Date.now();
      var n = { id: N.newId(), url: PAGE, title: TITLE, kind: KIND, color: color, quote: p.text.slice(p.s, p.e),
        prefix: p.text.slice(Math.max(0, p.s - 32), p.s), suffix: p.text.slice(p.e, p.e + 32), pos: p.s,
        note: "", tags: [], created: now, updated: now, deleted: false };
      hideBar();
      getSelection().removeAllRanges();
      put(n); wrap(n); renderPanel();
      track("note_create", { color: color, with_note: withNote ? 1 : 0 });
      if (withNote) openEditor(n.id, true);
      else hint();
    }

    /* ------------------------------------------------------------ editing */
    var editor = { box: null, id: null };
    function buildEditor() {
      var box = el("div", { class: "pa-note-ui pa-editor", role: "dialog", "aria-label": "Your note", hidden: true });
      var dots = el("div", { class: "pa-ed-dots", role: "radiogroup", "aria-label": "Colour" });
      COLORS.forEach(function (c) {
        dots.appendChild(el("button", { type: "button", role: "radio", class: "pa-dot pa-hl-" + c[0], "data-c": c[0], "aria-label": c[1], title: c[1],
          onclick: function () { var n = notes[editor.id]; if (!n) return; n.color = c[0]; put(n); refresh(n); syncDots(); renderPanel(); } }));
      });
      var ta = el("textarea", { class: "pa-ed-text", rows: "3", maxlength: "2000", placeholder: "Add a note for yourself…", "aria-label": "Note" });
      var tags = el("input", { class: "pa-ed-tags", type: "text", maxlength: "200", placeholder: "Tags, separated by commas", "aria-label": "Tags" });
      var commit = function () {
        var n = notes[editor.id]; if (!n) return;
        var note = ta.value.slice(0, 2000), tg = (N.clean(Object.assign({}, n, { tags: tags.value.split(/[,#\n]/) })) || n).tags;
        if (note === n.note && tg.join(",") === (n.tags || []).join(",")) return;
        n.note = note; n.tags = tg; put(n); refresh(n); renderPanel();
      };
      ta.addEventListener("input", debounce(commit, 500));
      ta.addEventListener("blur", commit);
      tags.addEventListener("change", commit);
      box.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closeEditor(); } });
      box.appendChild(dots); box.appendChild(ta); box.appendChild(tags);
      box.appendChild(el("div", { class: "pa-ed-foot" }, [
        el("button", { type: "button", class: "pa-ed-del", text: "Delete", onclick: function () { remove(editor.id); closeEditor(); } }),
        el("button", { type: "button", class: "pa-ed-done", text: "Done", onclick: function () { closeEditor(); } })
      ]));
      document.body.appendChild(box);
      editor.box = box; editor.ta = ta; editor.tags = tags; editor.commit = commit; editor.dots = dots;
    }
    function syncDots() {
      var n = notes[editor.id];
      editor.dots.querySelectorAll("[data-c]").forEach(function (d) { d.setAttribute("aria-checked", n && n.color === d.getAttribute("data-c") ? "true" : "false"); });
    }
    function openEditor(id, focusNote) {
      if (!editor.box) buildEditor();
      var n = notes[id], m = root.querySelector('mark.pa-hl[data-note="' + id + '"]');
      if (!n || !m) return;
      hideBar();
      editor.id = id;
      editor.ta.value = n.note || "";
      editor.tags.value = (n.tags || []).join(", ");
      syncDots();
      editor.box.hidden = false;
      place(editor.box, m.getBoundingClientRect(), true);
      if (focusNote !== false) editor.ta.focus({ preventScroll: true });
    }
    function closeEditor() {
      if (!editor.box || editor.box.hidden) return;
      editor.commit();
      editor.box.hidden = true;
      var m = editor.id && root.querySelector('mark.pa-hl[data-note="' + editor.id + '"]');
      editor.id = null;
      if (m) m.focus({ preventScroll: true });
    }
    document.addEventListener("mousedown", function (e) {
      if (editor.box && !editor.box.hidden && !editor.box.contains(e.target) && !e.target.closest("mark.pa-hl")) closeEditor();
    });
    // capture, so a click on a highlight opens it instead of also starting the narration there (read-along)
    root.addEventListener("click", function (e) {
      var m = e.target.closest && e.target.closest("mark.pa-hl");
      if (!m || !getSelection().isCollapsed) return;
      e.preventDefault(); e.stopPropagation();
      openEditor(m.getAttribute("data-note"));
    }, true);
    root.addEventListener("keydown", function (e) {
      var m = e.target.closest && e.target.closest("mark.pa-hl");
      if (m && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openEditor(m.getAttribute("data-note")); }
    });
    function remove(id) {
      var n = notes[id]; if (!n) return;
      var before = Object.assign({}, n);
      var gone = N.edit(n, "delete");
      unwrap(id);
      notes[id] = gone;
      clearTimeout(pendingSave[id]);
      store.save(gone).catch(function () { toast("That didn't delete. Check your connection and try again."); });
      renderPanel();
      track("note_delete");
      toast("Highlight deleted", "Undo", function () { var back = Object.assign({}, before, { deleted: false }); put(back); refresh(back); renderPanel(); });
    }

    /* ------------------------------------------------------------ toast */
    var toastBox = null, toastTimer = 0;
    function toast(msg, action, fn) {
      if (!toastBox) { toastBox = el("div", { class: "pa-note-ui pa-note-toast", role: "status" }); document.body.appendChild(toastBox); }
      toastBox.textContent = "";
      toastBox.appendChild(el("span", { text: msg }));
      if (action) toastBox.appendChild(el("button", { type: "button", text: action, onclick: function () { toastBox.classList.remove("on"); fn(); } }));
      toastBox.classList.add("on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastBox.classList.remove("on"); }, action ? 6000 : 2400);
    }
    function hint() {
      try { if (localStorage.getItem("pa_notes_hint_lesson")) return; localStorage.setItem("pa_notes_hint_lesson", "1"); } catch (e) { return; }
      toast("Saved to your account. Find it under Notes, bottom right, or in My notes.");
    }

    /* ------------------------------------------------------------ the Notes panel */
    var fab = el("button", { type: "button", class: "pa-note-ui pa-notes-fab", "aria-expanded": "false", "aria-controls": "pa-notes-panel", html: ICON.list + '<span>Notes</span><b class="pa-fab-n"></b>' });
    var panel = el("aside", { class: "pa-note-ui pa-notes-panel", id: "pa-notes-panel", "aria-label": "Your highlights and notes", hidden: true });
    document.body.appendChild(fab); document.body.appendChild(panel);
    var scope = "page";
    fab.addEventListener("click", function () { if (panel.hidden) { panel.hidden = false; fab.setAttribute("aria-expanded", "true"); renderPanel(); var h = panel.querySelector("h2"); if (h) h.focus(); track("notes_open"); } else closePanel(); });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
    function closePanel() { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.focus(); }
    function renderPanel() {
      var here = mine().length;
      fab.querySelector(".pa-fab-n").textContent = here ? String(here) : "";
      if (panel.hidden) return;
      var list = scope === "page" ? mine() : all();
      panel.textContent = "";
      panel.appendChild(el("div", { class: "pa-np-head" }, [
        el("h2", { tabindex: "-1", text: "Your notes" }),
        el("button", { type: "button", class: "pa-np-x", "aria-label": "Close", html: "&times;", onclick: closePanel })
      ]));
      var tabs = el("div", { class: "pa-np-tabs", role: "group", "aria-label": "Show" });
      [["page", "This lesson (" + here + ")"], ["all", "All (" + all().length + ")"]].forEach(function (t) {
        tabs.appendChild(el("button", { type: "button", "aria-pressed": scope === t[0] ? "true" : "false", text: t[1], onclick: function () { scope = t[0]; renderPanel(); } }));
      });
      panel.appendChild(tabs);
      if (!list.length) panel.appendChild(el("p", { class: "pa-np-empty", text: scope === "page" ? "Select any text in this lesson to highlight it, add a note or tag it." : "Nothing saved yet." }));
      var ol = el("ol", { class: "pa-np-list" });
      list.forEach(function (n) {
        var here = n.url === PAGE;
        var a = el("a", { class: "pa-np-item pa-hl-" + n.color, href: N.openUrl(n) }, [
          scope === "all" ? el("small", { class: "pa-np-where", text: (N.KIND_LABEL[n.kind] || "") + " · " + (n.title || n.url) }) : null,
          n.quote ? el("q", { text: n.quote.length > 220 ? n.quote.slice(0, 220) + "…" : n.quote }) : null,
          n.note ? el("p", { class: "pa-np-note", text: n.note }) : null,
          (n.tags || []).length ? el("span", { class: "pa-np-tags", text: n.tags.map(function (t) { return "#" + t; }).join(" ") }) : null,
          here && n._lost ? el("small", { class: "pa-np-lost", text: "This passage has changed since you saved it." }) : null
        ]);
        if (here) a.addEventListener("click", function (e) { e.preventDefault(); jump(n.id, true); });
        ol.appendChild(el("li", {}, [a]));
      });
      panel.appendChild(ol);
      panel.appendChild(el("div", { class: "pa-np-foot" }, [el("p", { class: "pa-np-sync" }, [
        el("span", { class: "pa-sync-dot on", "aria-hidden": "true" }), "Saved to your account. ", el("a", { href: "/my-notes", text: "Open My notes" })
      ])]));
    }
    function jump(id, edit) {
      var m = root.querySelector('mark.pa-hl[data-note="' + id + '"]');
      if (!m) return false;
      if (matchMedia("(max-width: 760px)").matches) { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); }
      m.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      root.querySelectorAll('mark.pa-hl[data-note="' + id + '"]').forEach(function (x) { x.classList.remove("flash"); void x.offsetWidth; x.classList.add("flash"); });
      if (edit) setTimeout(function () { openEditor(id, false); }, 450);
      return true;
    }

    /* ------------------------------------------------------------ start */
    store.all().then(function (list) {
      list.forEach(function (n) { notes[n.id] = n; });
      loaded = true;
      paint(); renderPanel();
      var m = /#pa-note=([a-z0-9]{6,24})$/.exec(location.hash);
      if (m) setTimeout(function () { if (jump(m[1], false)) history.replaceState(null, "", location.pathname + location.search); }, 300);
    }, function () {
      loaded = true;   // highlighting still works; it saves as it goes
      renderPanel();
    });
    return { repaint: function () { paint(); renderPanel(); } };
  }

  window.PANotes = { attach: attach };
})();
