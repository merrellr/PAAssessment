/* Small, dependency-free charts for the Reports page (reports.html): a line chart
   drawn in SVG, and bar and funnel charts drawn in plain HTML. Each one carries a
   text description for screen readers. They only draw what they are given. */
(function (root) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(k => {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    });
    kids.forEach(c => { if (c !== null && c !== undefined) n.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return n;
  }
  function s(tag, attrs, text) {
    const n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(k => n.setAttribute(k, attrs[k]));
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // 1, 2, 5, 10, 20, 50 ... at or above the largest value, so axis labels are round numbers.
  function niceMax(v) {
    if (!(v > 0)) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  /* opts: { labels: [text per point], series: [{ name, color, values: [number] }], title, height, integer }
     integer: true keeps the axis to whole numbers (for counts of people or requests). */
  function line(container, opts) {
    container.innerHTML = '';
    const W = 640, H = opts.height || 220, L = 38, R = 12, T = 12, B = 30;
    const n = opts.labels.length;
    const all = [].concat.apply([], opts.series.map(x => x.values));
    let max = niceMax(Math.max.apply(null, all.concat([0])));
    if (opts.integer) max = Math.max(4, Math.ceil(max / 4) * 4);   // counts of people: four gridlines, whole numbers only
    const total = opts.series.map(x => x.name + ': ' + x.values.reduce((a, b) => a + b, 0));
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': (opts.title || 'Line chart') + '. Totals - ' + total.join(', ') + '.', class: 'chart-svg', preserveAspectRatio: 'xMidYMid meet' });
    svg.appendChild(s('title', {}, opts.title || 'Line chart'));

    const x = (i) => L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R));
    const y = (v) => T + (1 - v / max) * (H - T - B);
    for (let g = 0; g <= 4; g++) {
      const v = (max / 4) * g;
      svg.appendChild(s('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'chart-grid' }));
      svg.appendChild(s('text', { x: L - 6, y: y(v) + 4, class: 'chart-axis', 'text-anchor': 'end' }, String(Math.round(v * 10) / 10)));
    }
    const every = Math.max(1, Math.ceil(n / 6));
    opts.labels.forEach((lab, i) => {
      if (i % every === 0 || i === n - 1) svg.appendChild(s('text', { x: x(i), y: H - 8, class: 'chart-axis', 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, lab));
    });
    opts.series.forEach(se => {
      const pts = se.values.map((v, i) => x(i) + ',' + y(v)).join(' ');
      svg.appendChild(s('polyline', { points: pts, fill: 'none', stroke: se.color, 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'data-series': se.name }));
      const last = se.values.length - 1;
      if (last >= 0) svg.appendChild(s('circle', { cx: x(last), cy: y(se.values[last]), r: 3.6, fill: se.color }));
    });
    container.appendChild(svg);
    container.appendChild(h('div', { class: 'chart-legend' }, ...opts.series.map(se =>
      h('span', { class: 'legend-item' }, h('i', { style: 'background:' + se.color + ';' }), se.name + ' (' + se.values.reduce((a, b) => a + b, 0) + ')'))));
    if (!all.some(v => v > 0)) container.appendChild(h('p', { class: 'chart-empty', text: 'Nothing recorded in this period yet.' }));
  }

  /* items: [{ label, value, note? }]. opts: { max, suffix, color } */
  function bars(container, items, opts) {
    opts = opts || {};
    container.innerHTML = '';
    if (!items.length) { container.appendChild(h('p', { class: 'chart-empty', text: 'Nothing to show yet.' })); return; }
    const max = opts.max || Math.max.apply(null, items.map(i => i.value).concat([1]));
    items.forEach(it => {
      const pct = Math.max(0, Math.min(100, (it.value / max) * 100));
      const val = (it.value === null ? '—' : it.value) + (it.value === null ? '' : (opts.suffix || ''));
      container.appendChild(h('div', { class: 'bar-row' },
        h('div', { class: 'bar-label', text: it.label }),
        h('div', { class: 'bar-track', role: 'img', 'aria-label': it.label + ': ' + val }, h('span', { class: 'bar-fill', style: 'width:' + (it.value === null ? 0 : pct) + '%;' + (opts.color ? 'background:' + opts.color + ';' : '') })),
        h('div', { class: 'bar-val', text: val })));
      if (it.note) container.lastChild.querySelector('.bar-label').appendChild(h('span', { class: 'bar-note', text: it.note }));
    });
  }

  /* steps: [{ label, count, conv }], worst: index of the biggest drop (or -1) */
  function funnel(container, steps, worst) {
    container.innerHTML = '';
    const max = Math.max.apply(null, steps.map(s2 => s2.count).concat([1]));
    steps.forEach((st, i) => {
      const row = h('div', { class: 'funnel-row' + (i === worst ? ' worst' : '') },
        h('div', { class: 'funnel-label', text: st.label }),
        h('div', { class: 'funnel-track', role: 'img', 'aria-label': st.label + ': ' + st.count }, h('span', { class: 'funnel-fill', style: 'width:' + Math.max(st.count > 0 ? 2 : 0, (st.count / max) * 100) + '%;' })),
        h('div', { class: 'funnel-count', text: String(st.count) }),
        h('div', { class: 'funnel-conv' + (i === worst ? ' bad' : ''), text: st.conv === null ? '' : st.conv + '% carried on' }));
      container.appendChild(row);
    });
  }

  root.Charts = { line: line, bars: bars, funnel: funnel, niceMax: niceMax };
})(typeof globalThis !== 'undefined' ? globalThis : window);
