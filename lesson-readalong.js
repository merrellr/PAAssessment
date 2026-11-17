/* Read-along for a lesson's narration, the same as on the Product+ articles: the paragraph being read is highlighted,
   and the word being spoken within it, and it's kept in view. Scrolling the page yourself stops the following until you
   press "Follow along"; with read-along on, a click on a paragraph plays from there.

   PAReadAlong.attach({ audio, body, times, toggle, follow, seek }) -> { set(on), clear() }
     audio   the <audio> element
     body    the lesson body (#lessonBody); lesson-script.js decides which element each narrated line comes from
     times   [[start, end], ...] for every narrated line, from audio/lessons/lines/<course>-<lesson>.json
             (the first two lines are the course and lesson titles, which aren't on the page as text to follow)
     toggle  the Read along on/off button (aria-pressed)
     follow  the "Follow along" button, shown when the reader has scrolled away
   Returns null when the page and the narration don't line up (the lesson changed since it was narrated). */
(function () {
  "use strict";
  var TEXT = "p, li, h2, h3, h4, figcaption, blockquote, dt, dd";
  var KEY = "pa-read-along";

  function attach(o) {
    if (!window.PALessonScript || !o.body || !o.times) return null;
    var els = window.PALessonScript.read(o.body).els;
    if (o.times.length !== els.length + 2) return null;   // out of step: no highlighting rather than the wrong paragraph
    var bt = o.times.slice(2), audio = o.audio, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var on = true, follow = true, active = -1, words = null, lastWord = -1, raf = 0, autoScrolling = 0;
    try { on = localStorage.getItem(KEY) !== "off"; } catch (e) { /* storage off */ }

    function blockAt(t) {
      for (var i = 0; i < bt.length; i++) { if (t >= bt[i][0] - 0.05 && t < (i + 1 < bt.length ? bt[i + 1][0] : bt[i][1] + 1)) return i; }
      return -1;
    }
    // Each word in its own <span>, with when it is spoken (its share of the line's time, by length). Only for plain
    // text blocks: a practice block or a chart is highlighted as a whole.
    function wrapWords(el) {
      if (el._raWords) return el._raWords;
      if (!el.matches(TEXT) || el.querySelector("button, input, textarea, select")) { el._raWords = []; return el._raWords; }
      var list = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        if (!node.nodeValue.trim() || node.parentNode.closest("[aria-hidden='true'], .sr-only")) return;
        var frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var w = document.createElement("span"); w.className = "ra-w"; w.textContent = p; frag.appendChild(w); list.push(w);
        });
        node.parentNode.replaceChild(frag, node);
      });
      var total = list.reduce(function (a, w) { return a + w.textContent.length + 1; }, 0) || 1, acc = 0;
      list.forEach(function (w) { w._at = acc / total; acc += w.textContent.length + 1; });
      el._raWords = list;
      return list;
    }
    function clear() {
      if (active > -1) { els[active].classList.remove("ra-on"); (els[active]._raWords || []).forEach(function (w) { w.classList.remove("ra-now", "ra-done"); }); }
      active = -1; words = null; lastWord = -1;
    }
    function keepInView(el) {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      if (r.top > vh * 0.18 && r.bottom < vh * 0.72) return;
      autoScrolling = Date.now();
      el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
    function at(t) {
      if (!on) { if (active > -1) clear(); return; }
      var i = blockAt(t);
      if (i !== active) {
        clear();
        if (i < 0) return;
        active = i; els[i].classList.add("ra-on"); words = wrapWords(els[i]);
        if (follow) keepInView(els[i]);
      }
      if (!words || !words.length) return;
      var f = (t - bt[active][0]) / Math.max(0.2, bt[active][1] - bt[active][0]), k = 0;
      for (var j = 0; j < words.length; j++) { if (words[j]._at <= f) k = j; }
      if (k !== lastWord) {
        words.forEach(function (w, j) { w.classList.toggle("ra-done", j < k); w.classList.toggle("ra-now", j === k); });
        lastWord = k;
      }
    }
    function loop() { raf = 0; if (!audio.paused && on) { at(audio.currentTime); raf = requestAnimationFrame(loop); } }
    function showFollow() { if (o.follow) o.follow.hidden = follow || !on || audio.paused; }
    function set(v) {
      on = !!v;
      if (o.toggle) o.toggle.setAttribute("aria-pressed", String(on));
      o.body.classList.toggle("read-along", on);
      try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, "off"); } catch (e) { /* storage off */ }
      if (!on) clear(); else { follow = true; at(audio.currentTime); if (!audio.paused && !raf) raf = requestAnimationFrame(loop); }
      showFollow();
    }
    audio.addEventListener("play", function () { if (on && !raf) raf = requestAnimationFrame(loop); showFollow(); });
    audio.addEventListener("pause", showFollow);
    audio.addEventListener("seeked", function () { at(audio.currentTime); });
    audio.addEventListener("ended", function () { clear(); showFollow(); });
    // the reader scrolling the page themselves stops the following until they ask for it again
    ["wheel", "touchmove", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, function (e) {
        if (!on || audio.paused || Date.now() - autoScrolling < 900) return;
        if (ev === "keydown" && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].indexOf(e.key) < 0) return;
        if (ev === "keydown" && e.key === " " && e.target !== document.body) return;
        if (follow) { follow = false; showFollow(); }
      }, { passive: true });
    });
    if (o.follow) o.follow.addEventListener("click", function () { follow = true; showFollow(); if (active > -1) keepInView(els[active]); else at(audio.currentTime); });
    if (o.toggle) o.toggle.addEventListener("click", function () { set(!on); });
    // with read-along on, a click on a paragraph plays from it (not a click on a control, or while selecting text)
    els.forEach(function (el, i) {
      if (!el.matches(TEXT)) return;
      el.setAttribute("data-ra", "");
      el.addEventListener("click", function (e) {
        if (!on || e.target.closest("a, button, input, textarea, select, label") || String(window.getSelection && window.getSelection()).length) return;
        audio.currentTime = bt[i][0];
        if (audio.paused) audio.play().catch(function () {});
        if (o.seek) o.seek(bt[i][0]);
      });
    });
    set(on);
    return { set: set, clear: clear, lines: els.length };
  }
  window.PAReadAlong = { attach: attach };
})();
