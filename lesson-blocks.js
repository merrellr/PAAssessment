/* Lesson building blocks: the richer pieces a course can use besides plain text.
   A lesson may list `blocks` (in reading order) instead of, or after, its `body`:

     { type: 'html', html }                                    any HTML, as `body` is
     { type: 'story', title, cast: [{ id, name, role }], beats: [{ who, text } | { narration }], pause }
                                                              a short scene; with `pause` (a number) the
                                                              rest waits behind "What happens next?"
     { type: 'stat', value, label, source, sourceUrl }         one number that carries the point
     { type: 'bars', title, subtitle, unit, items: [{ label, value }], highlight, source, sourceUrl, note }
     { type: 'curve', title, subtitle, xLabel, yLabel, unit, points: [[x, y]], start, readout, source, sourceUrl, note }
                                                              a line with a slider; readout(x, y) → sentence
     { type: 'matrix', title, columns, rows: [{ label, cells: ['yes'|'part'|'no'] }], gap, note }
     { type: 'compare', items: [{ tone: 'bad'|'good', label, text, why }] }
     { type: 'sort', title, prompt, buckets: [{ id, label }], items: [{ text, bucket, why }] }
     { type: 'scenario', title, setup, question, choices: [{ label, outcome, verdict: 'best'|'ok'|'risky' }] }
     { type: 'flow', title, steps: [{ title, text, tag }] }
     { type: 'personas', items: [{ name, role, kind, wants, worries, quote }] }
     { type: 'takeaway', text }
     { type: 'quote', text, who }

   Content files are ours, so text fields may hold simple HTML (<strong>, <em>).
   LessonBlocks.text(blocks) gives the plain words, for search and "Ask AI"
   (tools/build-search-index.mjs); it needs no page, so it also runs in Node. */
(function (root) {
  'use strict';

  const strip = (s) => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

  /* ------------------------------------------------------------ plain text */
  function text(blocks) {
    const out = [];
    (blocks || []).forEach(b => {
      const add = (...xs) => xs.forEach(x => { const t = strip(x); if (t) out.push(t); });
      switch (b.type) {
        case 'html': add(String(b.html || '').replace(/<svg[\s\S]*?<\/svg>/gi, ' ')); break;
        case 'story': add(b.title); (b.beats || []).forEach(x => {
          const who = (b.cast || []).filter(c => c.id === x.who)[0];
          add(x.narration ? x.narration : (who ? who.name + ': ' : '') + x.text);
        }); break;
        case 'stat': add(b.value + ' ' + b.label, b.source); break;
        case 'bars': add(b.title, b.subtitle); (b.items || []).forEach(i => add(i.label + ': ' + i.value + (b.unit || ''))); add(b.note, b.source); break;
        case 'curve': add(b.title, b.subtitle, b.note, b.source); break;
        case 'matrix': add(b.title, b.note); break;
        case 'compare': (b.items || []).forEach(i => add(i.label + ': ' + strip(i.text) + ' ' + strip(i.why))); break;
        case 'sort': add(b.title, b.prompt); (b.items || []).forEach(i => add(i.text + ' (' + ((b.buckets || []).filter(k => k.id === i.bucket)[0] || {}).label + '): ' + strip(i.why))); break;
        case 'scenario': add(b.title, b.setup, b.question); (b.choices || []).forEach(c => add(c.label + ': ' + strip(c.outcome))); break;
        case 'flow': add(b.title); (b.steps || []).forEach(s => add(s.title + ': ' + strip(s.text))); break;
        case 'personas': (b.items || []).forEach(p => add(p.name + ', ' + p.role + '. Wants: ' + strip(p.wants) + '. Worries: ' + strip(p.worries) + '.')); break;
        case 'takeaway': case 'quote': add(b.text); break;
      }
    });
    return out.join(' ');
  }

  /* ------------------------------------------------------------- the page */
  let uid = 0;
  const nextId = (p) => p + '-' + (++uid);
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function head(box, eyebrow, title, subtitle) {
    if (eyebrow) box.appendChild(el('span', 'lb-eyebrow', eyebrow));
    if (title) box.appendChild(el('h3', 'lb-title', title));
    if (subtitle) box.appendChild(el('p', 'lb-sub', subtitle));
  }
  function source(box, b) {
    if (!b.source && !b.note) return;
    const p = el('p', 'lb-source');
    if (b.note) p.appendChild(el('span', '', b.note + (b.source ? ' ' : '')));
    if (b.source) {
      const s = el('span', '', 'Source: ');
      if (b.sourceUrl) { const a = el('a', '', b.source); a.href = b.sourceUrl; a.target = '_blank'; a.rel = 'noopener'; s.appendChild(a); }
      else s.appendChild(document.createTextNode(strip(b.source)));
      p.appendChild(s);
    }
    box.appendChild(p);
  }
  const initials = (name) => strip(name).split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase();

  // One floating tooltip for every chart on the page.
  let tip = null;
  function showTip(target, html) {
    if (!tip) { tip = el('div', 'lb-tip'); tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    tip.innerHTML = html;
    tip.hidden = false;
    const r = target.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const x = Math.min(window.innerWidth - t.width - 8, Math.max(8, r.left + r.width / 2 - t.width / 2));
    const y = r.top - t.height - 8 < 8 ? r.bottom + 8 : r.top - t.height - 8;
    tip.style.left = (x + window.scrollX) + 'px';
    tip.style.top = (y + window.scrollY) + 'px';
  }
  function hideTip() { if (tip) tip.hidden = true; }
  function hoverable(node, html) {
    node.addEventListener('mouseenter', () => showTip(node, html()));
    node.addEventListener('mouseleave', hideTip);
    node.addEventListener('focus', () => showTip(node, html()));
    node.addEventListener('blur', hideTip);
  }
  // The numbers behind a chart, for screen readers and anyone who prefers a table.
  function dataTable(caption, cols, rows) {
    const t = el('table', 'lb-sr');
    t.innerHTML = '<caption>' + caption + '</caption><thead><tr>' + cols.map(c => '<th scope="col">' + c + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + r.map((c, i) => (i ? '<td>' : '<th scope="row">') + c + (i ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</tbody>';
    return t;
  }

  const R = {};

  R.html = (b) => { const d = el('div', 'lb-html', b.html || ''); return d; };

  R.story = (b) => {
    const box = el('section', 'lb lb-story');
    head(box, 'The story', b.title);
    const cast = {};
    (b.cast || []).forEach((c, i) => { cast[c.id] = Object.assign({ n: i }, c); });
    if ((b.cast || []).length) {
      const row = el('div', 'lb-cast');
      b.cast.forEach((c, i) => row.appendChild(el('span', 'lb-person', '<span class="lb-av lb-av' + (i % 4) + '" aria-hidden="true">' + initials(c.name) + '</span><span><b>' + c.name + '</b>' + (c.role ? '<small>' + c.role + '</small>' : '') + '</span>')));
      box.appendChild(row);
    }
    const list = el('ol', 'lb-beats');
    const items = (b.beats || []).map(x => {
      const li = el('li', x.narration ? 'lb-beat lb-narr' : 'lb-beat');
      if (x.narration) li.innerHTML = '<p>' + x.narration + '</p>';
      else {
        const c = cast[x.who] || { name: x.who || '', n: 0 };
        li.innerHTML = '<span class="lb-av lb-av' + (c.n % 4) + '" aria-hidden="true">' + initials(c.name) + '</span><div class="lb-bubble"><b>' + c.name + '</b><p>' + x.text + '</p></div>';
      }
      list.appendChild(li);
      return li;
    });
    box.appendChild(list);
    const pause = Number(b.pause) || 0;
    if (pause > 0 && pause < items.length) {
      items.slice(pause).forEach(li => { li.hidden = true; });
      const more = el('button', 'lb-more', 'What happens next? <span aria-hidden="true">↓</span>');
      more.type = 'button';
      more.addEventListener('click', () => { items.slice(pause).forEach(li => { li.hidden = false; }); more.remove(); items[pause].setAttribute('tabindex', '-1'); items[pause].focus(); });
      box.appendChild(more);
    }
    return box;
  };

  R.stat = (b) => {
    const box = el('section', 'lb lb-stat');
    box.appendChild(el('div', 'lb-stat-value', b.value));
    box.appendChild(el('p', 'lb-stat-label', b.label));
    source(box, b);
    return box;
  };

  R.bars = (b) => {
    const box = el('figure', 'lb lb-bars');
    head(box, 'The data', b.title, b.subtitle);
    const unit = b.unit || '';
    const max = b.max || Math.max.apply(null, (b.items || []).map(i => i.value)) || 1;
    const hi = typeof b.highlight === 'number' ? b.highlight : (b.items || []).map(i => i.label).indexOf(b.highlight);
    const list = el('div', 'lb-barlist');
    (b.items || []).forEach((i, n) => {
      const row = el('div', 'lb-bar' + (hi === -1 || hi === n ? ' is-on' : ''));
      row.tabIndex = 0;
      row.setAttribute('aria-label', strip(i.label) + ': ' + i.value + unit);
      row.innerHTML = '<span class="lb-bar-label">' + i.label + '</span><span class="lb-bar-track"><span class="lb-bar-fill" style="--w:' + Math.max(1.5, i.value / max * 100).toFixed(1) + '%"></span></span><span class="lb-bar-val">' + i.value + unit + '</span>';
      hoverable(row, () => '<b>' + i.label + '</b><br>' + i.value + unit + (i.detail ? '<br><span>' + i.detail + '</span>' : ''));
      list.appendChild(row);
    });
    box.appendChild(list);
    box.appendChild(dataTable(strip(b.title), ['', strip(b.valueLabel || 'Value')], (b.items || []).map(i => [strip(i.label), i.value + unit])));
    source(box, b);
    // grow the bars in when the chart scrolls into view
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      box.classList.add('lb-wait');
      const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { box.classList.remove('lb-wait'); io.disconnect(); } }, { threshold: 0.25 });
      io.observe(box);
    }
    return box;
  };

  R.curve = (b) => {
    const box = el('figure', 'lb lb-curve');
    head(box, 'Try it', b.title, b.subtitle);
    const pts = b.points || [];
    const W = 560, H = 230, L = 44, Rr = 16, T = 14, B = 34;
    const xs = pts.map(p => p[0]), xMin = Math.min.apply(null, xs), xMax = Math.max.apply(null, xs);
    const yMax = b.yMax || 100, unit = b.unit || '';
    const sx = (x) => L + (x - xMin) / ((xMax - xMin) || 1) * (W - L - Rr);
    const sy = (y) => T + (1 - y / yMax) * (H - T - B);
    let grid = '';
    [0, 0.25, 0.5, 0.75, 1].forEach(f => {
      const y = sy(f * yMax);
      grid += '<line class="lb-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y + '" y2="' + y + '"/><text class="lb-axis" x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(f * yMax) + unit + '</text>';
    });
    pts.forEach(p => { grid += '<text class="lb-axis" x="' + sx(p[0]) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + p[0] + '</text>'; });
    const d = pts.map((p, i) => (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1)).join(' ');
    const svgId = nextId('lbc');
    box.insertAdjacentHTML('beforeend', '<div class="lb-plot"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="' + svgId + '"><title id="' + svgId + '">' + strip(b.title) + '</title>' + grid +
      '<text class="lb-axis lb-axis-name" x="' + ((L + W - Rr) / 2) + '" y="' + (H - 2) + '" text-anchor="middle">' + (b.xLabel || '') + '</text>' +
      '<path class="lb-area" d="' + d + ' L' + sx(xMax) + ' ' + sy(0) + ' L' + sx(xMin) + ' ' + sy(0) + ' Z"/>' +
      '<path class="lb-line" d="' + d + '"/><line class="lb-cross" y1="' + T + '" y2="' + (H - B) + '"/><circle class="lb-dot" r="6"/></svg></div>');
    const svg = box.querySelector('svg'), dot = svg.querySelector('.lb-dot'), cross = svg.querySelector('.lb-cross');
    const ctl = el('div', 'lb-slider');
    const sid = nextId('lbs');
    ctl.innerHTML = '<label for="' + sid + '">' + (b.sliderLabel || b.xLabel || '') + '</label><input type="range" id="' + sid + '" min="0" max="' + (pts.length - 1) + '" step="1"><output class="lb-readout" for="' + sid + '" aria-live="polite"></output>';
    box.appendChild(ctl);
    const input = ctl.querySelector('input'), out = ctl.querySelector('output');
    const set = (i) => {
      const p = pts[i];
      dot.setAttribute('cx', sx(p[0])); dot.setAttribute('cy', sy(p[1]));
      cross.setAttribute('x1', sx(p[0])); cross.setAttribute('x2', sx(p[0]));
      out.innerHTML = b.readout ? b.readout(p[0], p[1]) : (p[0] + ': ' + p[1] + unit);
      input.value = i;
    };
    input.addEventListener('input', () => set(Number(input.value)));
    // hovering the plot moves the marker to the nearest point
    svg.addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
      let best = 0; pts.forEach((p, i) => { if (Math.abs(sx(p[0]) - x) < Math.abs(sx(pts[best][0]) - x)) best = i; });
      set(best);
    });
    set(Math.max(0, Math.min(pts.length - 1, b.start === undefined ? pts.length - 1 : b.start)));
    box.appendChild(dataTable(strip(b.title), [strip(b.xLabel || 'x'), strip(b.yLabel || 'y')], pts.map(p => [p[0], p[1] + unit])));
    source(box, b);
    return box;
  };

  R.matrix = (b) => {
    const box = el('figure', 'lb lb-matrix');
    head(box, 'Where is the gap?', b.title, b.subtitle);
    // drawn marks (a font's ◐ varies too much): filled, half, empty
    const dot = (k) => '<svg class="lb-mk lb-mk-' + k + '" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.5"/>' + (k === 'part' ? '<path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z"/>' : '') + '</svg>';
    const MARK = { yes: [dot('yes'), 'Handles it well'], part: [dot('part'), 'Partly'], no: [dot('no'), 'Does not'] };
    const wrap = el('div', 'lb-scroll');
    const t = el('table', 'lb-table');
    t.innerHTML = '<thead><tr><th scope="col"><span class="lb-sr-text">Option</span></th>' + (b.columns || []).map((c, i) => '<th scope="col"' + (i === b.gap ? ' class="is-gap"' : '') + '>' + c + '</th>').join('') + '</tr></thead><tbody>' +
      (b.rows || []).map(r => '<tr><th scope="row">' + r.label + '</th>' + r.cells.map((c, i) => '<td class="lb-m-' + c + (i === b.gap ? ' is-gap' : '') + '"><span aria-hidden="true">' + (MARK[c] || ['', ''])[0] + '</span><span class="lb-sr-text">' + (MARK[c] || ['', c])[1] + '</span></td>').join('') + '</tr>').join('') + '</tbody>';
    wrap.appendChild(t);
    box.appendChild(wrap);
    box.appendChild(el('p', 'lb-legend', '<span>' + MARK.yes[0] + ' handles it well</span><span>' + MARK.part[0] + ' partly</span><span>' + MARK.no[0] + ' does not</span>' + (b.gap !== undefined ? '<span class="lb-legend-gap">highlighted: the gap</span>' : '')));
    source(box, b);
    return box;
  };

  R.compare = (b) => {
    const box = el('div', 'lb lb-compare');
    (b.items || []).forEach(i => {
      const good = i.tone === 'good';
      box.appendChild(el('div', 'lb-cmp ' + (good ? 'is-good' : 'is-bad'),
        '<span class="lb-cmp-tag"><span aria-hidden="true">' + (good ? '✓' : '✕') + '</span> ' + (i.label || (good ? 'Better' : 'Weaker')) + '</span><p class="lb-cmp-text">' + i.text + '</p>' + (i.why ? '<p class="lb-cmp-why">' + i.why + '</p>' : '')));
    });
    return box;
  };

  R.sort = (b) => {
    const box = el('section', 'lb lb-sort');
    head(box, 'Practice', b.title, b.prompt);
    const list = el('ol', 'lb-sort-list');
    let answered = 0, right = 0;
    const score = el('p', 'lb-score');
    score.setAttribute('aria-live', 'polite');
    const total = (b.items || []).length;
    (b.items || []).forEach(item => {
      const li = el('li', 'lb-sort-item');
      li.appendChild(el('p', 'lb-sort-text', item.text));
      const btns = el('div', 'lb-sort-btns');
      btns.setAttribute('role', 'group');
      btns.setAttribute('aria-label', strip(item.text));
      const fb = el('p', 'lb-sort-fb');
      (b.buckets || []).forEach(k => {
        const btn = el('button', 'lb-chip', k.label);
        btn.type = 'button';
        btn.dataset.bucket = k.id;
        btn.addEventListener('click', () => {
          if (li.dataset.done) return;
          li.dataset.done = '1';
          const ok = k.id === item.bucket;
          answered++; if (ok) right++;
          li.classList.add(ok ? 'is-right' : 'is-wrong');
          btn.classList.add('is-picked');
          btns.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.bucket === item.bucket) x.classList.add('is-answer'); });
          const correct = ((b.buckets || []).filter(x => x.id === item.bucket)[0] || {}).label;
          fb.innerHTML = '<b>' + (ok ? 'Right.' : 'Not quite: ' + correct + '.') + '</b> ' + (item.why || '');
          score.textContent = answered === total ? 'You got ' + right + ' of ' + total + '.' + (right === total ? ' Spot on.' : '') : '';
        });
        btns.appendChild(btn);
      });
      li.append(btns, fb);
      list.appendChild(li);
    });
    box.append(list, score);
    return box;
  };

  R.scenario = (b) => {
    const box = el('section', 'lb lb-scenario');
    head(box, 'Your call', b.title, b.setup);
    if (b.question) box.appendChild(el('p', 'lb-q', b.question));
    const opts = el('div', 'lb-choices');
    const out = el('div', 'lb-outcome');
    out.setAttribute('aria-live', 'polite');
    const V = { best: ['Strong move', 'is-good'], ok: ['Reasonable, with a catch', 'is-ok'], risky: ['Risky', 'is-bad'] };
    (b.choices || []).forEach((c, i) => {
      const btn = el('button', 'lb-choice', '<span class="lb-choice-key" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span><span>' + c.label + '</span>');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        opts.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'));
        const v = V[c.verdict] || V.ok;
        out.className = 'lb-outcome ' + v[1];
        out.innerHTML = '<b>' + v[0] + '.</b> ' + c.outcome + ((b.choices || []).length > 1 ? '<span class="lb-try">Try another option to see how it plays out.</span>' : '');
      });
      opts.appendChild(btn);
    });
    box.append(opts, out);
    return box;
  };

  R.flow = (b) => {
    const box = el('section', 'lb lb-flow');
    head(box, '', b.title, b.subtitle);
    const ol = el('ol', 'lb-steps');
    (b.steps || []).forEach((s, i) => ol.appendChild(el('li', 'lb-step', '<span class="lb-step-n" aria-hidden="true">' + (i + 1) + '</span>' + (s.tag ? '<span class="lb-step-tag">' + s.tag + '</span>' : '') + '<b>' + s.title + '</b><p>' + s.text + '</p>')));
    box.appendChild(ol);
    source(box, b);
    return box;
  };

  R.personas = (b) => {
    const box = el('section', 'lb lb-personas');
    head(box, 'Who it is for', b.title, b.subtitle);
    const grid = el('div', 'lb-pgrid');
    (b.items || []).forEach((p, i) => grid.appendChild(el('article', 'lb-persona',
      '<header><span class="lb-av lb-av' + (i % 4) + '" aria-hidden="true">' + initials(p.name) + '</span><div><b>' + p.name + '</b><small>' + p.role + '</small></div>' + (p.kind ? '<span class="lb-kind">' + p.kind + '</span>' : '') + '</header>' +
      (p.quote ? '<blockquote>“' + p.quote + '”</blockquote>' : '') +
      '<dl><dt>Wants</dt><dd>' + p.wants + '</dd><dt>Worries</dt><dd>' + p.worries + '</dd></dl>')));
    box.appendChild(grid);
    return box;
  };

  R.takeaway = (b) => el('aside', 'lb lb-takeaway', '<span class="lb-eyebrow">Key idea</span><p>' + b.text + '</p>');
  R.quote = (b) => el('blockquote', 'lb lb-quote', '<p>' + b.text + '</p>' + (b.who ? '<cite>' + b.who + '</cite>' : ''));

  function render(container, blocks) {
    (blocks || []).forEach(b => {
      const make = R[b.type];
      if (!make) return;
      const node = make(b);
      node.dataset.block = b.type;
      container.appendChild(node);
    });
  }

  // Rough reading time: about 220 words a minute, plus a minute for each exercise.
  function minutes(lesson) {
    const words = (strip(lesson.body || '') + ' ' + text(lesson.blocks || [])).split(/\s+/).filter(Boolean).length;
    const tasks = (lesson.blocks || []).filter(b => b.type === 'sort' || b.type === 'scenario' || b.type === 'curve').length + ((lesson.checks || []).length ? 1 : 0);
    return Math.max(3, Math.round(words / 220 + tasks));
  }

  root.LessonBlocks = { render: render, text: text, minutes: minutes, types: Object.keys(R) };
})(typeof globalThis !== 'undefined' ? globalThis : window);
