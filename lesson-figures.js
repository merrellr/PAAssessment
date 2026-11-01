/* Lesson figures, in the Product+ style of the articles on www.productadvisory.co: a cream card with a serif title, a
   short subtitle, and one idea drawn with a few large, readable pieces. Course content describes a figure as data
   (lesson.figures = { name: { type, title, sub, ... } }) and marks where it goes in the lesson text with
   <div data-fig="name"></div>; lesson.html calls PAFig.mount(). Everything is HTML and CSS (lesson-figures.css), so the
   text stays sharp at any size, reflows on a phone, follows light and dark, and is read by screen readers and search.

   Types (all take title, sub, foot):
     cards     items [{ icon, title, tag, text, tone }], cols, dashed
     steps     items [{ title, text, tone, tag }]          a row with arrows (numbered grid past four)
     loop      items [{ badge, title, text }], center      a cycle around a ring
     compare   columns [{ label, tone, items: [], foot }], arrow (before → after)
     hub       center { title, text }, items [{ title, text, tone }]
     quadrant  x, y, quads [tl, tr, bl, br] ({ label, text, tone }), points [{ label, x, y }] (0 to 1)
     bars      items [{ label, value, display, tone, note }], max, unit
     timeline  items [{ when, title, text, tone }]
     equation  parts [{ title, text, tone }], ops ['÷', '=']
     record    heading, rows [[label, value, tone]]          a filled-in card (a bet, a brief)
     split     items [{ label, value, tone, text }]          shares of one whole
     line      x, y, series [{ label, tone, points: [[x, y]], dashed }], marks [{ x, label }], notes [{ x, y, text }]
     venn      left, right, overlap ({ title, text })
     decision  start, question, yes { label, title, text }, no { ... }, back (the loop label)
   Tones: teal, mint, amber, coral, sky, violet, navy, sand. */
(function (root) {
  'use strict';

  const TONES = ['teal', 'mint', 'amber', 'coral', 'sky', 'violet', 'navy', 'sand'];
  const tone = (t, i) => 'pf-t-' + (TONES.indexOf(t) > -1 ? t : TONES[(i || 0) % 6]);
  const esc = (s) => String(s == null ? '' : s).replace(/&(?![a-z#0-9]+;)/gi, '&amp;');   // content is trusted HTML; just keep stray & valid
  const has = (s) => s != null && s !== '';

  const ICON = {
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 13.7c2.9.2 5 2.1 5 5.3"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
    chart: '<path d="M4 20V10M10 20V5M16 20v-7M3 20h18"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.5 9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.4"/>',
    spark: '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M18.5 15l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    branch: '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.2v9.6M18 10.2c0 4-4 4.6-9.8 7.4"/>',
    bolt: '<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
    warning: '<path d="M12 3.5L21.5 20h-19z"/><path d="M12 10v4.5M12 17.4v.1"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    refresh: '<path d="M20 7v5h-5"/><path d="M19.5 12A7.5 7.5 0 1 1 17 6.4"/>',
    scale: '<path d="M12 3v18M5 21h14M4 8h16"/><path d="M4 8l-2.5 6a3 3 0 0 0 5 0zM20 8l-2.5 6a3 3 0 0 0 5 0z"/>',
    rocket: '<path d="M12 15l-3-3c1.5-5 5-8.5 11-9-.5 6-4 9.5-8 12z"/><path d="M9 12l-4 1 3-4h3M12 15l-1 4 4-3v-3"/><circle cx="15" cy="9" r="1.3"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M15 9c-.5-1.2-1.7-1.8-3-1.8-1.7 0-3 .9-3 2.2 0 3 6 1.5 6 4.6 0 1.3-1.3 2.3-3 2.3-1.4 0-2.6-.6-3.1-1.8M12 5.8v1.4M12 16.8v1.4"/>',
    map: '<path d="M3 6l6-2.5 6 2.5 6-2.5v14L15 20l-6-2.5L3 20z"/><path d="M9 3.5v14M15 6v14"/>',
    hand: '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6.5 7S5 17.5 4.5 15L3 11.5a1.5 1.5 0 0 1 2.6-1.4L8 13"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    caption: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 11h4M13 11h4M7 14.5h6M15 14.5h2"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'
  };
  const MARK = { check: '<svg class="pf-m" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4L18 8"/></svg>', x: '<svg class="pf-m" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 7.5l9 9M16.5 7.5l-9 9"/></svg>' };
  const icon = (name) => ICON[name] ? '<svg class="pf-ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + '</svg>' : '';
  const arrow = (dir) => '<span class="pf-arrow pf-arrow-' + (dir || 'r') + '" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>';

  function frame(f, body, extra) {
    return '<figure class="pf pf--' + f.type + (extra ? ' ' + extra : '') + '">' +
      (has(f.title) ? '<figcaption class="pf-head"><span class="pf-title">' + esc(f.title) + '</span>' + (has(f.sub) ? '<span class="pf-sub">' + esc(f.sub) + '</span>' : '') + '</figcaption>' : '') +
      body + (has(f.foot) ? '<p class="pf-foot"><span class="pf-foot-k">Key idea</span>' + esc(f.foot) + '</p>' : '') + '</figure>';
  }

  const T = {};

  T.cards = (f) => {
    const n = f.items.length, cols = f.cols || (n === 4 ? 2 : Math.min(n, 3));
    return frame(f, '<div class="pf-cards" style="--cols:' + cols + '">' + f.items.map((c, i) =>
      '<div class="pf-card ' + tone(c.tone, i) + (f.dashed ? ' pf-dashed' : '') + '">' + icon(c.icon) +
      (has(c.label) ? '<span class="pf-label">' + esc(c.label) + '</span>' : '') +
      '<b class="pf-card-t">' + esc(c.title) + '</b>' + (has(c.tag) ? '<i class="pf-tag">' + esc(c.tag) + '</i>' : '') +
      (has(c.text) ? '<p>' + esc(c.text) + '</p>' : '') + (has(c.quote) ? '<q class="pf-quote">' + esc(c.quote) + '</q>' : '') + '</div>').join('') + '</div>');
  };

  T.steps = (f) => {
    const n = f.items.length, grid = n > 4 || f.grid;
    const item = (s, i) => '<div class="pf-step ' + tone(s.tone || f.tone || 'teal', i) + '"><span class="pf-num">' + (has(s.badge) ? esc(s.badge) : i + 1) + '</span>' +
      (has(s.tag) ? '<span class="pf-label">' + esc(s.tag) + '</span>' : '') + '<b class="pf-card-t">' + esc(s.title) + '</b>' + (has(s.text) ? '<p>' + esc(s.text) + '</p>' : '') + '</div>';
    if (grid) return frame(f, '<div class="pf-stepgrid" style="--cols:' + Math.min(3, Math.ceil(n / 2)) + '">' + f.items.map(item).join('') + '</div>');
    return frame(f, '<div class="pf-steps">' + f.items.map((s, i) => (i ? arrow() : '') + item(s, i)).join('') + '</div>');
  };

  // Points around an ellipse (in % of the box), starting at the top and going clockwise.
  const around = (n, rx, ry, cy, start) => Array.from({ length: n }, (_, i) => {
    const a = (start == null ? -90 : start) + 360 * i / n, r = a * Math.PI / 180;
    return { x: 50 + rx * Math.cos(r), y: cy + ry * Math.sin(r), cos: Math.cos(r) };
  });

  // The loop is drawn on a 2:1 box (viewBox 200 x 100), so the ring and its arrowheads keep their shape.
  T.loop = (f) => {
    const n = f.items.length, CX = 100, CY = 50, RX = 62, RY = 37;
    const at = (deg) => { const r = deg * Math.PI / 180; return { x: CX + RX * Math.cos(r), y: CY + RY * Math.sin(r), cos: Math.cos(r), sin: Math.sin(r) }; };
    const nodes = f.items.map((s, i) => {
      const p = at(-90 + 360 * i / n), side = p.cos > 0.35 ? 'r' : p.cos < -0.35 ? 'l' : 'c';
      return '<div class="pf-node pf-side-' + side + ' ' + tone(s.tone || f.tone || 'teal', i) + '" style="left:' + (p.x / 2).toFixed(1) + '%;top:' + p.y.toFixed(1) + '%">' +
        '<span class="pf-badge">' + esc(has(s.badge) ? s.badge : i + 1) + '</span><span class="pf-node-tx">' + (has(s.tag) ? '<span class="pf-label">' + esc(s.tag) + '</span>' : '') + '<b>' + esc(s.title) + '</b>' + (has(s.text) ? '<small>' + esc(s.text) + '</small>' : '') + '</span></div>';
    }).join('');
    let heads = '';
    for (let i = 0; i < n; i++) {
      const p = at(-90 + 360 * (i + 0.5) / n);
      const deg = Math.atan2(RY * p.cos, -RX * p.sin) * 180 / Math.PI;   // the ring's direction there, going clockwise
      heads += '<path d="M-3 -3.2 L1.2 0 L-3 3.2" transform="translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') rotate(' + deg.toFixed(1) + ')"/>';
    }
    const ring = '<svg class="pf-ring" viewBox="0 0 200 100" aria-hidden="true"><ellipse cx="' + CX + '" cy="' + CY + '" rx="' + RX + '" ry="' + RY + '"/>' + heads + '</svg>';
    const list = '<ol class="pf-looplist">' + f.items.map((s, i) => '<li class="' + tone(s.tone || f.tone || 'teal', i) + '"><span class="pf-badge">' + esc(has(s.badge) ? s.badge : i + 1) + '</span><span>' + (has(s.tag) ? '<span class="pf-label">' + esc(s.tag) + '</span>' : '') + '<b>' + esc(s.title) + '</b>' + (has(s.text) ? '<small>' + esc(s.text) + '</small>' : '') + '</span></li>').join('') +
      (has(f.center) ? '<li class="pf-loopback"><span>↻</span><i>' + esc(f.center) + '</i></li>' : '') + '</ol>';
    return frame(f, '<div class="pf-loopbox">' + ring + nodes + (has(f.center) ? '<i class="pf-center">' + esc(f.center) + '</i>' : '') + '</div>' + list);
  };

  T.compare = (f) => {
    const cols = f.columns;
    return frame(f, '<div class="pf-compare' + (f.arrow ? ' pf-has-arrow' : '') + '" style="--cols:' + cols.length + '">' + cols.map((c, i) =>
      (f.arrow && i ? arrow() : '') +
      '<div class="pf-col ' + tone(c.tone, i) + (f.reveal && i ? ' pf-veiled' : '') + '">' + (f.reveal && i ? '<button type="button" class="pf-reveal-btn"><span>' + esc(f.reveal) + '</span><b>Show me</b></button><div class="pf-veil" aria-hidden="true">' : '') +
      (has(c.icon) ? icon(c.icon) : '') + '<span class="pf-label">' + esc(c.label) + '</span>' +
      (has(c.title) ? '<b class="pf-card-t">' + esc(c.title) + '</b>' : '') +
      '<ul' + (c.mark ? ' class="pf-marks pf-mark-' + c.mark + '"' : '') + '>' + (c.items || []).map(x => '<li>' + (c.mark ? MARK[c.mark] : '') + esc(x) + '</li>').join('') + '</ul>' + (has(c.foot) ? '<i class="pf-tag">' + esc(c.foot) + '</i>' : '') + (f.reveal && i ? '</div>' : '') + '</div>').join('') + '</div>');
  };

  T.hub = (f) => {
    const n = f.items.length, pts = around(n, 36, 36, 50, n === 4 ? -45 : n === 6 ? -60 : -90);
    const lines = pts.map(p => '<line x1="50" y1="50" x2="' + p.x.toFixed(1) + '" y2="' + p.y.toFixed(1) + '"/>').join('');
    const nodes = f.items.map((s, i) => '<div class="pf-spoke ' + tone(s.tone || f.tone, i) + '" style="left:' + pts[i].x.toFixed(1) + '%;top:' + pts[i].y.toFixed(1) + '%"><b>' + esc(s.title) + '</b>' + (has(s.text) ? '<small>' + esc(s.text) + '</small>' : '') + '</div>').join('');
    const c = f.center;
    return frame(f, '<div class="pf-hubbox"><svg class="pf-hublines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + lines + '</svg>' +
      '<div class="pf-hubcenter"><b>' + esc(c.title) + '</b>' + (has(c.text) ? '<small>' + esc(c.text) + '</small>' : '') + '</div>' + nodes + '</div>');
  };

  T.quadrant = (f) => {
    const q = f.quads, pos = ['tl', 'tr', 'bl', 'br'];
    const quads = q.map((x, i) => '<div class="pf-quad pf-q-' + pos[i] + ' ' + tone(x.tone, i) + '"><b>' + esc(x.label) + '</b>' + (has(x.text) ? '<small>' + esc(x.text) + '</small>' : '') + '</div>').join('');
    const pts = (f.points || []).map(p => '<span class="pf-pt" style="left:' + (p.x * 100).toFixed(1) + '%;bottom:' + (p.y * 100).toFixed(1) + '%"><i></i>' + esc(p.label) + '</span>').join('');
    return frame(f, '<div class="pf-quadwrap"><span class="pf-axis-y">' + esc(f.y) + ' →</span><div class="pf-quadbox">' + quads + '<div class="pf-pts">' + pts + '</div></div><span class="pf-axis-x">' + esc(f.x) + ' →</span></div>');
  };

  T.bars = (f) => {
    const max = f.max || Math.max.apply(null, f.items.map(b => b.value));
    return frame(f, '<div class="pf-bars">' + f.items.map((b, i) =>
      '<div class="pf-bar ' + tone(b.tone || f.tone || 'teal', i) + '"><span class="pf-bar-l">' + esc(b.label) + '</span><span class="pf-bar-track"><span class="pf-bar-fill" style="width:' + Math.max(2, 100 * b.value / max).toFixed(1) + '%"></span></span>' +
      '<b class="pf-bar-v">' + esc(has(b.display) ? b.display : b.value + (f.unit || '')) + '</b>' + (has(b.note) ? '<small>' + esc(b.note) + '</small>' : '') + '</div>').join('') + '</div>');
  };

  T.timeline = (f) => frame(f, '<ol class="pf-timeline' + (f.items.length > 5 || f.vertical ? ' pf-vertical' : '') + '" style="--n:' + f.items.length + '">' + f.items.map((s, i) =>
    '<li class="' + tone(s.tone || f.tone || 'teal', i) + '"><span class="pf-when">' + esc(s.when) + '</span><span class="pf-dot"></span><b>' + esc(s.title) + '</b>' + (has(s.text) ? '<small>' + esc(s.text) + '</small>' : '') + '</li>').join('') + '</ol>');

  T.equation = (f) => frame(f, '<div class="pf-eq">' + f.parts.map((p, i) =>
    (i ? '<span class="pf-op" aria-hidden="true">' + esc((f.ops || [])[i - 1] || '+') + '</span>' : '') +
    '<div class="pf-term ' + tone(p.tone, i) + '"><b>' + esc(p.title) + '</b>' + (has(p.text) ? '<small>' + esc(p.text) + '</small>' : '') + '</div>').join('') + '</div>');

  T.record = (f) => frame(f, '<div class="pf-record"><div class="pf-record-h">' + esc(f.heading) + '</div><dl>' + f.rows.map(r =>
    '<div class="' + (r[2] ? tone(r[2]) + ' pf-hl' : '') + '"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('') + '</dl></div>');

  T.split = (f) => frame(f, '<div class="pf-split"><div class="pf-split-bar">' + f.items.map((s, i) =>
    '<span class="' + tone(s.tone, i) + '" style="flex:' + s.value + '"><b>' + esc(s.value) + '%</b></span>').join('') + '</div><ul class="pf-split-key">' +
    f.items.map((s, i) => '<li class="' + tone(s.tone, i) + '"><i></i><b>' + esc(s.label) + '</b>' + (has(s.text) ? ' <small>' + esc(s.text) + '</small>' : '') + '</li>').join('') + '</ul></div>');

  T.line = (f) => {
    const W = 600, H = 280, L = 46, R = 18, Tp = 20, B = 40;
    const all = f.series.flatMap(s => s.points);
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const x0 = f.xmin != null ? f.xmin : Math.min.apply(null, xs), x1 = f.xmax != null ? f.xmax : Math.max.apply(null, xs);
    const y0 = f.ymin != null ? f.ymin : 0, y1 = f.ymax != null ? f.ymax : Math.max.apply(null, ys) * 1.1;
    const X = (v) => L + (W - L - R) * (v - x0) / ((x1 - x0) || 1), Y = (v) => H - B - (H - B - Tp) * (v - y0) / ((y1 - y0) || 1);
    let svg = '<svg class="pf-line" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(f.alt || f.title) + '">';
    svg += '<line class="pf-axis" x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '"/><line class="pf-axis" x1="' + L + '" y1="' + Tp + '" x2="' + L + '" y2="' + (H - B) + '"/>';
    svg += '<text class="pf-ax" x="' + (W - R) + '" y="' + (H - 12) + '" text-anchor="end">' + esc(f.x) + ' →</text>';
    svg += '<text class="pf-ax" transform="translate(16 ' + (H - B) + ') rotate(-90)">' + esc(f.y) + ' →</text>';
    (f.marks || []).forEach(m => { svg += '<line class="pf-mark" x1="' + X(m.x) + '" y1="' + Tp + '" x2="' + X(m.x) + '" y2="' + (H - B) + '"/><text class="pf-marktx" x="' + (X(m.x) + 6) + '" y="' + (Tp + 12) + '">' + esc(m.label) + '</text>'; });
    f.series.forEach((s, i) => {
      const d = s.points.map((p, k) => (k ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
      svg += '<path class="pf-series ' + tone(s.tone, i) + (s.dashed ? ' pf-dash' : '') + '" d="' + d + '"/>';
      if (s.dots) s.points.forEach(p => { svg += '<circle class="pf-sdot ' + tone(s.tone, i) + '" cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="4.5"/>'; });
    });
    (f.notes || []).forEach(nt => { svg += '<circle class="pf-note-dot" cx="' + X(nt.x) + '" cy="' + Y(nt.y) + '" r="5.5"/><text class="pf-notetx" x="' + (X(nt.x) + (nt.left ? -10 : 10)) + '" y="' + (Y(nt.y) + (nt.below ? 20 : -10)) + '" text-anchor="' + (nt.left ? 'end' : 'start') + '">' + esc(nt.text) + '</text>'; });
    svg += '</svg>';
    const key = f.series.length > 1 ? '<ul class="pf-key">' + f.series.map((s, i) => '<li class="' + tone(s.tone, i) + (s.dashed ? ' pf-dash' : '') + '"><i></i>' + esc(s.label) + '</li>').join('') + '</ul>' : '';
    return frame(f, svg + key);
  };

  T.venn = (f) => frame(f, '<div class="pf-venn"><div class="pf-circ pf-t-sky"><b>' + esc(f.left.title) + '</b><small>' + esc(f.left.text || '') + '</small></div>' +
    '<div class="pf-circ pf-t-violet"><b>' + esc(f.right.title) + '</b><small>' + esc(f.right.text || '') + '</small></div>' +
    '<div class="pf-overlap"><b>' + esc(f.overlap.title) + '</b>' + (has(f.overlap.text) ? '<small>' + esc(f.overlap.text) + '</small>' : '') + '</div></div>');

  T.decision = (f) => frame(f, '<div class="pf-decision"><div class="pf-dstart"><b>' + esc(f.start) + '</b></div>' + arrow() +
    '<div class="pf-dq"><span>' + esc(f.question) + '</span></div>' + arrow() + '<div class="pf-dbranches">' +
    [['yes', f.yes, 'coral'], ['no', f.no, 'teal']].map(([k, b, t]) => '<div class="pf-dbr ' + tone(b.tone || t) + '"><span class="pf-label">' + esc(b.label || k) + '</span><b class="pf-card-t">' + esc(b.title) + '</b>' + (has(b.text) ? '<p>' + esc(b.text) + '</p>' : '') + '</div>').join('') +
    '</div></div>' + (has(f.back) ? '<p class="pf-dback">↺ ' + esc(f.back) + '</p>' : ''));

  T.stats = (f) => frame(f, '<div class="pf-stats" style="--cols:' + Math.min(4, f.items.length) + '">' + f.items.map((s, i) =>
    '<div class="pf-stat ' + tone(s.tone || f.tone || 'teal', i) + '"><span class="pf-stat-l">' + esc(s.label) + '</span><b class="pf-stat-v">' + esc(s.value) + '</b>' + (has(s.text) ? '<small>' + esc(s.text) + '</small>' : '') + '</div>').join('') + '</div>' +
    (f.columns ? T.columns(Object.assign({}, f.columns, { type: 'columns', inner: true })) : ''));

  // Vertical bars: values [{ label, value }]
  T.columns = (f) => {
    const max = f.max || Math.max.apply(null, f.values.map(v => v.value));
    const body = (has(f.caption) ? '<span class="pf-label pf-cols-cap">' + esc(f.caption) + '</span>' : '') + '<div class="pf-columns ' + tone(f.tone || 'teal') + '">' + f.values.map((v, i) =>
      '<div class="pf-colbar"><span class="pf-colbar-v">' + esc(has(v.display) ? v.display : v.value) + '</span><span class="pf-colbar-fill" style="height:' + Math.max(3, 100 * v.value / max).toFixed(1) + '%;opacity:' + (0.45 + 0.55 * (i + 1) / f.values.length).toFixed(2) + '"></span><span class="pf-colbar-l">' + esc(v.label) + '</span></div>').join('') + '</div>';
    return f.inner ? '<div class="pf-cols-wrap">' + body + '</div>' : frame(f, body);
  };

  // A process drawn as a line of steps. A lane can show the product as a detour off the line (one more place to go)
  // or as a highlighted step on it; a { stack } fans out into parallel steps; `base` is a band shared under the line.
  // lanes [{ label, tone, nodes: [{ title, text, icon, tag, tone, state: 'hl' | 'down' | 'muted' } | { stack: [...] }],
  //          detour: { at, title, text, icon }, base, result, mark: 'check' | 'x' }]
  T.chain = (f) => {
    const node = (n, i, lane) => {
      const t = n.tone || (n.state === 'hl' ? lane.tone || 'teal' : n.state === 'down' ? 'coral' : 'navy');
      return '<div class="pf-cn ' + tone(t) + (n.state ? ' pf-cn-' + n.state : '') + '"><span class="pf-cn-dot">' + (n.state === 'down' ? MARK.x : icon(n.icon || 'target')) + '</span>' +
        '<span class="pf-cn-tx">' + (has(n.tag) ? '<span class="pf-cn-tag">' + esc(n.tag) + '</span>' : '') + '<b>' + esc(n.title) + '</b>' + (has(n.text) ? '<small>' + esc(n.text) + '</small>' : '') + '</span></div>';
    };
    const lanes = f.lanes.map((lane, li) => {
      const nodes = lane.nodes, d = lane.detour;
      let row = '';
      nodes.forEach((n, i) => {
        if (i) {
          if (d && d.at === i - 1) row += '<span class="pf-cl pf-cl-detour ' + tone(d.tone || lane.tone || 'coral') + '"><span class="pf-detour">' + icon(d.icon) + '<b>' + esc(d.title) + '</b>' + (has(d.text) ? '<small>' + esc(d.text) + '</small>' : '') + '</span></span>';
          else row += '<span class="pf-cl"></span>';
        }
        row += n.stack ? '<div class="pf-cstack' + (i ? ' pf-in-l' : '') + (i < nodes.length - 1 ? ' pf-in-r' : '') + '">' + n.stack.map(x => node(x, i, lane)).join('') + '</div>' : node(n, i, lane);
      });
      return '<div class="pf-lane ' + tone(lane.tone || 'navy', li) + '">' + (has(lane.label) ? '<span class="pf-label">' + esc(lane.label) + '</span>' : '') +
        '<div class="pf-chain-row' + (d ? ' pf-has-detour' : '') + '">' + row + '</div>' + (has(lane.base) ? '<div class="pf-base">' + esc(lane.base) + '</div>' : '') +
        (has(lane.result) ? '<p class="pf-result' + (lane.mark ? ' pf-marks pf-mark-' + lane.mark : '') + '">' + (lane.mark ? MARK[lane.mark] : '') + esc(lane.result) + '</p>' : '') + '</div>';
    }).join('');
    return frame(f, '<div class="pf-chain">' + lanes + '</div>');
  };

  // Work laid out along time: rows of segments sized by how long they take.
  // rows [{ label, tone, segments: [{ len, kind, label }], result, mark }], kinds { kind: 'name in the key' }, x
  const KIND = { build: 'navy', test: 'teal', risk: 'coral', good: 'mint', wait: 'sand' };
  T.track = (f) => {
    const kinds = f.kinds || {};
    const rows = f.rows.map((r, ri) => {
      const total = r.segments.reduce((a, g) => a + g.len, 0);
      return '<div class="pf-trow ' + tone(r.tone || 'navy', ri) + (r.segments.length > 5 ? ' pf-many' : '') + '"><span class="pf-label">' + esc(r.label) + '</span><div class="pf-tbar">' + r.segments.map(g =>
        '<span class="pf-seg pf-seg-' + g.kind + ' ' + tone(KIND[g.kind] || 'sand') + '" style="flex:' + g.len + '" title="' + esc(g.label || kinds[g.kind] || '') + '"><i>' + esc(g.label || '') + '</i></span>').join('') + '</div>' +
        (has(r.result) ? '<p class="pf-result' + (r.mark ? ' pf-marks pf-mark-' + r.mark : '') + '">' + (r.mark ? MARK[r.mark] : '') + esc(r.result) + '</p>' : '') + '<span hidden>' + total + '</span></div>';
    }).join('');
    const key = Object.keys(kinds).length ? '<ul class="pf-key">' + Object.keys(kinds).map(k => '<li class="' + tone(KIND[k] || 'sand') + ' pf-key-seg"><i></i>' + esc(kinds[k]) + '</li>').join('') + '</ul>' : '';
    return frame(f, '<div class="pf-track">' + rows + (has(f.x) ? '<span class="pf-taxis">' + esc(f.x) + '</span>' : '') + '</div>' + key);
  };

  // How often each touchpoint happens over one span of time: one dot per occurrence.
  // rows [{ label, title, count, text, tone }], span
  T.cadence = (f) => frame(f, '<div class="pf-cadence">' + (has(f.span) ? '<span class="pf-cad-span">' + esc(f.span) + '</span>' : '') + f.rows.map((r, i) => {
    let dots = '';
    for (let k = 0; k < r.count; k++) dots += '<i style="left:' + ((k + 0.5) / r.count * 100).toFixed(2) + '%"></i>';
    return '<div class="pf-cad ' + tone(r.tone || f.tone || 'teal', i) + (r.count > 30 ? ' pf-dense' : '') + '"><span class="pf-cad-l"><span class="pf-label">' + esc(r.label) + '</span><b>' + esc(r.title) + '</b>' + (has(r.text) ? '<small>' + esc(r.text) + '</small>' : '') + '</span>' +
      '<span class="pf-cad-dots" aria-hidden="true">' + dots + '</span><span class="pf-cad-n">' + r.count + '×</span></div>';
  }).join('') + '</div>');

  // Levels from the few at the top to the many at the bottom. levels [{ title, text, tone }], top, bottom
  T.pyramid = (f) => {
    const n = f.levels.length;
    return frame(f, '<div class="pf-pyr">' + (has(f.top) || has(f.bottom) ? '<span class="pf-pyr-axis"><span>' + esc(f.top || '') + '</span><span>' + esc(f.bottom || '') + '</span></span>' : '') +
      '<div class="pf-pyr-levels">' + f.levels.map((l, i) => '<div class="pf-lvl ' + tone(l.tone, i) + '" style="width:' + (n > 1 ? 46 + 54 * i / (n - 1) : 100).toFixed(1) + '%"><b>' + esc(l.title) + '</b>' + (has(l.text) ? '<small>' + esc(l.text) + '</small>' : '') + '</div>').join('') + '</div></div>');
  };

  // An empathy map: what a person says, thinks, does and feels, around them. hl: quadrants to highlight; gap: the point.
  const EMP = [['says', 'Says', 'chat', 'teal'], ['thinks', 'Thinks', 'spark', 'violet'], ['does', 'Does', 'hand', 'amber'], ['feels', 'Feels', 'heart', 'coral']];
  T.empathy = (f) => {
    const hl = f.hl || [];
    return frame(f, '<div class="pf-emp">' + EMP.map(([k, label, ic, t]) => {
      const q = f[k] || {};
      return '<div class="pf-emq pf-emq-' + k + ' ' + tone(t) + (hl.indexOf(k) > -1 ? ' pf-emq-hl' : '') + (hl.length && hl.indexOf(k) === -1 ? ' pf-emq-dim' : '') + '">' + icon(ic) + '<span class="pf-label">' + label + '</span><b>' + esc(q.title || '') + '</b>' + (has(q.text) ? '<small>' + esc(q.text) + '</small>' : '') + '</div>';
    }).join('') + '<div class="pf-emc">' + icon('user') + '<b>' + esc((f.center || {}).title || 'The user') + '</b>' + (has((f.center || {}).text) ? '<small>' + esc(f.center.text) + '</small>' : '') + '</div></div>' +
      (has(f.gap) ? '<p class="pf-gap">' + icon('warning') + '<span>' + esc(f.gap) + '</span></p>' : ''));
  };

  function html(f) { return T[f.type] ? T[f.type](f) : ''; }

  // Replace each <div data-fig="name"> in `rootEl` with its figure from `figures`.
  const SEQ = '.pf-step, .pf-node, .pf-spoke, .pf-card, .pf-col, .pf-cn, .pf-cl, .pf-seg, .pf-cad, .pf-lvl, .pf-emq, .pf-bar, .pf-timeline li, .pf-term, .pf-stat, .pf-colbar, .pf-quad';
  let watcher = null;
  function animate(fig) {
    const calm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm || !root.IntersectionObserver) return;
    // the pieces arrive in reading order, once, as the figure scrolls into view
    fig.querySelectorAll(SEQ).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 14)));
    fig.classList.add('pf-anim');
    if (!watcher) watcher = new root.IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('pf-in'); watcher.unobserve(e.target); } }), { threshold: 0.2 });
    watcher.observe(fig);
  }

  // Replace each <div data-fig="name"> in `rootEl` with its figure from `figures`.
  function mount(rootEl, figures) {
    if (!rootEl || !figures) return;
    rootEl.querySelectorAll('[data-fig]').forEach(slot => {
      const f = figures[slot.getAttribute('data-fig')];
      if (!f || !T[f.type]) return;
      const box = slot.ownerDocument.createElement('div');
      box.innerHTML = html(f);
      const fig = box.firstChild;
      slot.parentNode.replaceChild(fig, slot);
      animate(fig);
    });
    if (!rootEl.__pfReveal && rootEl.addEventListener) {
      rootEl.__pfReveal = true;
      // "Think first, then look": the later side of a before/after comparison opens when asked
      rootEl.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('.pf-reveal-btn');
        if (!btn) return;
        const col = btn.parentNode;
        col.classList.remove('pf-veiled');
        col.querySelector('.pf-veil').removeAttribute('aria-hidden');
        btn.remove();
        col.setAttribute('tabindex', '-1');
        col.focus({ preventScroll: true });
      });
    }
  }

  // The words in a figure, for search and Ask.
  function text(f) {
    const out = [];
    const walk = (v, k) => {
      if (/^(type|tone|icon|cols|badge|mark|state|hl|at|len|kind|count|reveal)$/.test(k || '')) return;
      if (typeof v === 'string') out.push(v.replace(/<[^>]+>/g, ''));
      else if (Array.isArray(v)) v.forEach(x => walk(x));
      else if (v && typeof v === 'object') Object.keys(v).forEach(key => walk(v[key], key));
    };
    walk(f);
    return out.join(' ').replace(/\s+/g, ' ').trim();
  }

  root.PAFig = { html, mount, text, types: Object.keys(T), icons: Object.keys(ICON) };
})(typeof window !== 'undefined' ? window : globalThis);
