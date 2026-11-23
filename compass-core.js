/* Compass, the assistant in Learning's header: the parts with no page or network in them, so they can be tested on
   their own (tests/compass-core.test.mjs). compass-ui.js draws the panel and asks the server (apps-script/Code.gs,
   section 14b: action=compass).

   What a page lets Compass see: it sets window.PACompassPage to a function returning { k, t, x }:
     k  what kind of page: lesson, home, learning, tool, tools, notes or page
     t  its title, as the learner would name it
     x  its text (the lesson, the work, the notes). Only the parts that match the question are sent, and only when
        the learner asks something. */
(function (root) {
  'use strict';

  // CompassIcon: the one Compass mark (circle, compass star, blue north needle), used at every Compass entry point on
  // both sites. Copies: pa-shell.js (ICON.compass) and www's assets/js/compass-www.js; tests/compass-core.test.mjs keeps them identical.
  // It draws in currentColor, with the needle always blue, so it sits on the slate disc of the button and the panel.
  var ICON = '<svg class="pa-cicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 3.7 13.2 10.8 20.3 12 13.2 13.2 12 20.3 10.8 13.2 3.7 12 10.8 10.8Z" fill="currentColor" stroke="none"/><path d="M18.15 5.85 12 12 13.94 13.94Z" fill="#2563EB" stroke="none"/><path d="M18.15 5.85 12 12 10.06 10.06Z" fill="#5B9BFF" stroke="none"/><path d="M5.85 18.15 12 12 13.94 13.94Z" fill="#64748B" stroke="none"/><path d="M5.85 18.15 12 12 10.06 10.06Z" fill="#94A3B8" stroke="none"/><circle cx="12" cy="12" r="1.05" fill="#0F172A" stroke="none"/></svg>';
  // The line under "Compass" in the panel: what it can see on this kind of page.
  var SEES_LINE = { home: 'Your assessment & learning plan', learning: 'Your assessment & learning plan' };
  function seesLine(k) { return SEES_LINE[k] || ((SEES[k] || SEES.page) + ' and your courses'); }
  var SEES = { lesson: 'This lesson', home: 'Your home page', learning: 'Your courses', tool: 'This piece of work',
    tools: 'Your toolkit', notes: 'Your notes', page: 'This page', article: 'This article', book: 'This chapter' };
  var PLACEHOLDER = { lesson: 'Ask about this lesson…', home: 'Ask about your learning…', learning: 'Ask about the courses…',
    tool: 'Ask about this work…', tools: 'Ask about your toolkit…', notes: 'Ask about your notes…', page: 'Ask about the courses…',
    article: 'Ask about this article…', book: 'Ask about this chapter…' };
  var SUGGEST = {
    lesson: ['Explain this lesson simply', 'Give me a real-world example', 'Quiz me on this lesson', 'What are the key takeaways?'],
    home: ['What should I do next?', 'Summarize where I am', 'Which lesson should I finish first?'],
    learning: ['Which course should I start with?', 'What does each skill area cover?', 'How long does a course take?'],
    tool: ['Explain these results', 'What would change the ranking?', 'What should I check before deciding?'],
    tools: ['Which tool helps me prioritize features?', 'Summarize my saved work', 'When should I build, buy or partner?'],
    notes: ['Summarize my notes', 'What themes show up in my notes?', 'Turn my notes into three actions'],
    page: ['What can I learn here?', 'How do I prioritize features?', 'What is product discovery?'],
    article: ['Summarize this article', 'How would I apply this at work?', 'What should I try first?', 'Which lesson goes deeper?'],
    book: ['Summarize this chapter', 'Explain the main idea simply', 'Quiz me on this chapter', 'How do I apply this with my team?']
  };
  var LEARNING = 'https://assessment.productadvisory.co';
  var PAGE_CHARS = 2000;     // what a page sends at most (the server allows a little more)
  var HISTORY = 6;           // turns of the conversation that come along

  var STOP = ('a an and are as at be but by can do does for from how i if in into is it its me my of on or our so that the their them ' +
    'then there these this to us was we what when where which who why will with you your about explain give tell please').split(' ');
  function words(s) { return String(s || '').toLowerCase().match(/[a-z0-9]+/g) || []; }
  function stem(w) { for (var k = 0; k < 2 && w.length > 4; k++) w = w.replace(/(ings?|ed|es|e|s)$/, ''); return w; }
  function terms(s) { return words(s).filter(function (w) { return STOP.indexOf(w) < 0 && (w.length > 2 || /\d/.test(w)); }).map(stem); }

  // The page's text in pieces of about `size` characters, broken at line ends.
  function chunks(text, size) {
    size = size || 600;
    var out = [], cur = '';
    String(text || '').split(/\n+/).forEach(function (line) {
      line = line.replace(/\s+/g, ' ').trim();
      if (!line) return;
      while (line.length > size) { if (cur) { out.push(cur); cur = ''; } out.push(line.slice(0, size)); line = line.slice(size); }
      if (cur && cur.length + line.length + 1 > size) { out.push(cur); cur = ''; }
      cur = cur ? cur + '\n' + line : line;
    });
    if (cur) out.push(cur);
    return out;
  }

  // The part of the page to send with a question: all of it when it's short; otherwise the opening, then the pieces
  // that share the most words with the question, in page order, up to the limit.
  function pickPage(text, q, limit) {
    limit = limit || PAGE_CHARS;
    var cs = chunks(text, Math.max(120, Math.min(500, Math.floor(limit / 4))));
    var whole = cs.join('\n');
    if (whole.length <= limit) return whole;
    var qs = terms(q), keep = { 0: true }, used = cs[0].length;
    var scored = cs.map(function (c, i) {
      var ts = terms(c), hit = 0;
      qs.forEach(function (w) { if (ts.indexOf(w) > -1) hit++; });
      return { i: i, s: hit, len: c.length };
    }).filter(function (x) { return x.i > 0 && x.s > 0; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    scored.forEach(function (x) { if (used + x.len + 2 <= limit) { keep[x.i] = true; used += x.len + 2; } });
    // still room: the pieces after the opening, in order
    for (var i = 1; i < cs.length && used + cs[i].length + 2 <= limit; i++) if (!keep[i]) { keep[i] = true; used += cs[i].length + 2; }
    var out = [], last = -1;
    cs.forEach(function (c, i) { if (!keep[i]) return; if (last > -1 && i !== last + 1) out.push('…'); out.push(c); last = i; });
    return out.join('\n').slice(0, limit);
  }

  // The conversation so far, as the server takes it: [{ r: 'u'|'a', t }], answers only (no errors), most recent last.
  function history(msgs) {
    return (msgs || []).filter(function (m) { return m && (m.r === 'u' || (m.r === 'a' && !m.err)) && m.t; })
      .slice(-HISTORY).map(function (m) { return { r: m.r, t: String(m.t).slice(0, m.r === 'u' ? 400 : 700) }; });
  }

  // Lesson links in Ask's index name the file (lesson.html?course=…); the site uses clean addresses.
  function cleanUrl(u) { return String(u || '').replace(/^\/?([a-z-]+)\.html/, '/$1'); }

  // The sources an answer can cite, numbered as the server numbers them: [1] this page (if it sent one), then the passages.
  /* The request travels in a web address, and the browser adds the reader's Google cookies to it: past about 16 KB
     together Google refuses it with an error page before the script ever runs. So the question's extras (the
     conversation, the page excerpt, the lesson passages) are trimmed, least useful first, until the address fits.
     base: the fixed fields (action, idToken, q). Returns { params, passages } with the passages actually sent. */
  var URL_MAX = 5500;
  function fitRequest(base, page, passages, hist, max) {
    max = max || URL_MAX; passages = passages || []; hist = hist || [];
    var pc = page ? String(page.x || '').length : 0, np = passages.length, xc = 650, nh = hist.length, params;
    for (var guard = 0; guard < 60; guard++) {
      var kept = passages.slice(0, np);
      params = Object.assign({}, base, {
        h: JSON.stringify(hist.slice(hist.length - nh)),
        page: page ? JSON.stringify({ k: page.k, t: page.t, x: String(page.x || '').slice(0, pc) }) : '',
        ctx: JSON.stringify(kept.map(function (p) { return { u: p.u, t: p.t, x: String(p.x).slice(0, xc) }; }))
      });
      if (new URLSearchParams(params).toString().length <= max) return { params: params, passages: kept };
      if (nh > 2) nh -= 2;
      else if (xc > 350) xc -= 100;
      else if (pc > 800) pc = Math.floor(pc * 0.8);
      else if (np > 1) np--;
      else if (nh > 0) nh = 0;
      else if (pc > 300) pc = Math.floor(pc * 0.7);
      else break;
    }
    return { params: params, passages: passages.slice(0, np) };
  }

  function sources(page, passages, here) {
    var out = [];
    if (page) out.push({ t: page.t ? 'This page: ' + page.t : 'This page', u: here || '' , self: true });
    (passages || []).forEach(function (p) { out.push({ t: p.t, u: cleanUrl(p.u) }); });
    return out;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // An answer as HTML: paragraphs and '- ' bullets, with [n] turned into links to its source.
  function render(text, srcs) {
    var html = '', list = false;
    esc(text).split(/\n+/).forEach(function (ln) {
      ln = ln.trim();
      if (!ln) return;
      ln = ln.replace(/\[(\d)\]/g, function (m, d) {
        var s = (srcs || [])[+d - 1];
        if (!s) return '';
        return s.self ? '<span class="cp-cite" title="' + esc(s.t) + '">' + d + '</span>' : '<a class="cp-cite" href="' + esc(s.u) + '" title="' + esc(s.t) + '">' + d + '</a>';
      });
      if (/^[-•*]\s+/.test(ln)) { if (!list) { html += '<ul>'; list = true; } html += '<li>' + ln.replace(/^[-•*]\s+/, '') + '</li>'; }
      else { if (list) { html += '</ul>'; list = false; } html += '<p>' + ln + '</p>'; }
    });
    return html + (list ? '</ul>' : '');
  }

  var ERRORS = {
    signin: 'Compass comes free with a Product Advisory Learning account. <a href="' + LEARNING + '/lms-dashboard" target="_blank" rel="noopener">Sign in or create one</a>, then ask again here.',
    not_verified: 'Compass comes free with a Product Advisory Learning account. <a href="' + LEARNING + '/lms-dashboard" target="_blank" rel="noopener">Sign in or create one</a>, then ask again here.',
    daily_limit: 'That’s all the questions for today. Compass will be back tomorrow.',
    bad_question: 'Try asking that in a few more words (up to 400 characters).',
    no_key: 'Compass is resting just now. Please try again later.',
    offline: 'You seem to be offline. Check your connection and try again.'
  };
  function errorText(code) { return ERRORS[code] || 'Compass couldn’t answer just now. Please try again in a moment.'; }

  /* The best lesson passages for a question, from Ask's index (ask-index.js: [{ u, t, x }]), as pa-shell.js's search
     does: words weighted by how rare they are, a bonus for the lesson title, at most two per lesson. For pages that
     don't have pa-shell.js (notes-bridge.html, answering for www). */
  var stats = null, statsFor = null;
  function retrieve(data, q, max) {
    data = data || [];
    if (statsFor !== data) {
      var df = {};
      stats = { df: df, docs: data.map(function (p) {
        var tf = {}, tt = {};
        terms(p.x).forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
        terms(p.t).forEach(function (w) { tt[w] = 1; });
        Object.keys(tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
        return { tf: tf, tt: tt };
      }) };
      statsFor = data;
    }
    var qs = terms(q).filter(function (w, i, a) { return a.indexOf(w) === i; });
    var n = data.length || 1, scored = [];
    data.forEach(function (p, i) {
      var d = stats.docs[i], score = 0;
      qs.forEach(function (w) {
        var idf = Math.log(1 + n / (1 + (stats.df[w] || 0)));
        if (d.tf[w]) score += idf * (1 + Math.log(d.tf[w]));
        if (d.tt[w]) score += idf * 1.5;
      });
      if (score > 0) scored.push({ p: p, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var out = [], per = {};
    for (var k = 0; k < scored.length && out.length < (max || 4); k++) {
      var u = scored[k].p.u;
      if ((per[u] || 0) >= 2) continue;
      per[u] = (per[u] || 0) + 1;
      out.push(scored[k].p);
    }
    return out;
  }

  root.CompassCore = { ICON: ICON, SEES_LINE: SEES_LINE, seesLine: seesLine, fitRequest: fitRequest, URL_MAX: URL_MAX, SEES: SEES, LEARNING: LEARNING, retrieve: retrieve, PLACEHOLDER: PLACEHOLDER, SUGGEST: SUGGEST, PAGE_CHARS: PAGE_CHARS, HISTORY: HISTORY,
    terms: terms, chunks: chunks, pickPage: pickPage, history: history, cleanUrl: cleanUrl, sources: sources, render: render, esc: esc, errorText: errorText };
})(typeof window !== 'undefined' ? window : globalThis);
