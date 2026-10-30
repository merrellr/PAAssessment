/* My saved tools (my-tools.html): the parts with no Firebase in them, so they can be tested on their own
   (tests/saved-tools.test.mjs). The four free interactive tools live on www.productadvisory.co; their "Save to my
   account" button opens /my-tools#save=<base64url JSON { v, tool, doc, title, summary, data }>, where `data` is the
   tool's own share-link encoding. A saved tool opens back on www as <tool url>#<prefix>=<data>&doc=<id>, and the
   tool remembers the id so its next Save updates the same copy. */
(function (root) {
  'use strict';

  const WWW = 'https://www.productadvisory.co/';
  // core: the tool's scoring file on www (its decode and toCSV draw a saved tool's results here, so the sums are
  // never copied into this site) and the name it puts on window.
  const TOOLS = {
    scorecard: { name: 'Feature Prioritization Scorecard', short: 'Scorecard', url: WWW + 'scorecard', prefix: 's', core: 'scorecard-core.js', global: 'ScorecardCore' },
    ai: { name: 'AI Use Case Prioritization', short: 'AI use cases', url: WWW + 'ai-use-cases', prefix: 'u', core: 'ai-usecases-core.js', global: 'AIUseCaseCore' },
    bbp: { name: 'Build, Buy, or Partner Decision Matrix', short: 'Build, buy, or partner', url: WWW + 'build-buy-partner', prefix: 'm', core: 'bbp-core.js', global: 'BBPCore' },
    impact: { name: 'Organizational Impact Score', short: 'Impact score', url: WWW + 'impact-score', prefix: 's', core: 'impact-core.js', global: 'ImpactCore' }
  };
  const CORE_BASE = WWW + 'assets/js/';
  const MAX_DATA = 20000;

  const clean = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);

  function b64decode(str) {
    const b = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b + '==='.slice((b.length + 3) % 4)), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // The work a tool handed over in the link: { tool, doc, title, summary, data }, or null if the link isn't one.
  function parseHandoff(hash) {
    const m = String(hash || '').match(/^#save=([A-Za-z0-9_-]{1,40000})$/);
    if (!m) return null;
    let o;
    try { o = JSON.parse(b64decode(m[1])); } catch (e) { return null; }
    if (!o || o.v !== 1 || !TOOLS[o.tool]) return null;
    if (typeof o.data !== 'string' || !/^[A-Za-z0-9_-]+$/.test(o.data) || o.data.length > MAX_DATA) return null;
    const doc = typeof o.doc === 'string' && /^[A-Za-z0-9]{1,40}$/.test(o.doc) ? o.doc : '';
    return { tool: o.tool, doc, title: clean(o.title, 100), summary: clean(o.summary, 200), data: o.data };
  }

  // What is stored (without the times, which the page adds as server timestamps).
  function record(uid, h) {
    return { uid, tool: h.tool, title: clean(h.title, 100), summary: clean(h.summary, 200), data: h.data };
  }

  function openUrl(tool, data, id) {
    const t = TOOLS[tool];
    return t ? t.url + '#' + t.prefix + '=' + data + (id ? '&doc=' + id : '') : WWW + 'toolkits';
  }

  function displayTitle(d) { return d.title || 'Untitled ' + (TOOLS[d.tool] ? TOOLS[d.tool].short.toLowerCase() : 'tool'); }
  function copyTitle(title) { return clean('Copy of ' + (title || 'untitled'), 100); }

  // Newest first. updatedAt is a Firestore Timestamp (or anything with toMillis), or missing while a write is pending.
  function sortNewest(list) {
    const ms = (d) => (d.updatedAt && d.updatedAt.toMillis ? d.updatedAt.toMillis() : Date.now());
    return list.slice().sort((a, b) => ms(b) - ms(a));
  }

  // The list on My saved tools: one tool or all ('' or 'all'), words to look for in the name, summary or tool, and
  // an order: 'newest' (default), 'oldest', 'name' or 'tool'.
  function filterSort(list, opts) {
    const o = opts || {}, tool = o.tool && o.tool !== 'all' ? o.tool : '';
    const words = String(o.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    const hay = (d) => (displayTitle(d) + ' ' + (d.summary || '') + ' ' + (TOOLS[d.tool] ? TOOLS[d.tool].name : '')).toLowerCase();
    let out = list.filter(d => (!tool || d.tool === tool) && words.every(w => hay(d).indexOf(w) > -1));
    const byName = (a, b) => displayTitle(a).localeCompare(displayTitle(b), undefined, { sensitivity: 'base' });
    if (o.sort === 'name') return out.slice().sort(byName);
    out = sortNewest(out);
    if (o.sort === 'oldest') return out.reverse();
    if (o.sort === 'tool') {
      const order = Object.keys(TOOLS);
      return out.map((d, i) => [d, i]).sort((a, b) => (order.indexOf(a[0].tool) - order.indexOf(b[0].tool)) || (a[1] - b[1])).map(x => x[0]);
    }
    return out;
  }

  function countByTool(list) {
    const n = { all: list.length };
    Object.keys(TOOLS).forEach(k => { n[k] = 0; });
    list.forEach(d => { if (d.tool in n) n[d.tool]++; });
    return n;
  }

  // A tool's export (toCSV) read back into rows of cells. Cells the tool guarded against spreadsheet formulas
  // ('=..., '-5) are shown as typed.
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map(r => r.map(v => (/^'[=+\-@\t\r]/.test(v) ? v.slice(1) : v)));
  }

  // The export split at its blank lines into parts: a table (first row the headings) or, when no row has more
  // than two filled cells, a list of label and value pairs.
  function csvSections(text) {
    const parts = []; let cur = [];
    parseCSV(text).forEach(r => {
      if (r.every(v => v === '')) { if (cur.length) parts.push(cur); cur = []; } else cur.push(r);
    });
    if (cur.length) parts.push(cur);
    return parts.map(rows => {
      const filled = (r) => r.filter(v => v !== '').length;
      if (rows.every(r => filled(r) <= 2)) return { kind: 'pairs', rows: rows.map(r => [r[0] || '', r.slice(1).filter(v => v !== '').join(' ')]) };
      const width = Math.max.apply(null, rows.map(r => r.length));
      const pad = (r) => r.concat(Array(width - r.length).fill(''));
      return { kind: 'table', head: pad(rows[0]), rows: rows.slice(1).map(pad) };
    });
  }

  // A file name for a saved tool's download: "Q3 roadmap - Organizational Impact Score.csv".
  function fileName(d) {
    const name = (displayTitle(d) + (TOOLS[d.tool] ? ' - ' + TOOLS[d.tool].name : '')).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
    return name.slice(0, 120) + '.csv';
  }

  root.SavedToolsCore = { TOOLS, CORE_BASE, MAX_DATA, parseHandoff, record, openUrl, displayTitle, copyTitle, sortNewest,
    filterSort, countByTool, parseCSV, csvSections, fileName };
})(typeof window !== 'undefined' ? window : globalThis);
