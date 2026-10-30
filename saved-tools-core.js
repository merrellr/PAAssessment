/* My toolkit (my-tools.html): the parts with no Firebase in them, so they can be tested on their own
   (tests/saved-tools.test.mjs). The four interactive tools are built on www.productadvisory.co. In Learning they run
   inside the toolkit's workspace (a frame on the tool's page with ?embed=1; see www's save.js), which saves each
   change to the person's account. On the public pages, "Save to my account" opens
   /my-tools#save=<base64url JSON { v, tool, doc, title, summary, data }>, where `data` is the tool's own share-link
   encoding. */
(function (root) {
  'use strict';

  const WWW = 'https://www.productadvisory.co/';
  // core: the tool's scoring file on www (its decode and toCSV draw a saved tool's results here, so the sums are
  // never copied into this site) and the name it puts on window.
  const TOOLS = {
    scorecard: { name: 'Feature Prioritization Scorecard', short: 'Scorecard', url: WWW + 'scorecard', prefix: 's', core: 'scorecard-core.js', global: 'ScorecardCore',
      blurb: 'Rank features by value, effort and risk, or by RICE.', noun: 'scorecard' },
    ai: { name: 'AI Use Case Prioritization', short: 'AI use cases', url: WWW + 'ai-use-cases', prefix: 'u', core: 'ai-usecases-core.js', global: 'AIUseCaseCore',
      blurb: 'Sort AI ideas into quick wins and bets, and pick a first pilot.', noun: 'AI use case list' },
    bbp: { name: 'Build, Buy, or Partner Decision Matrix', short: 'Build, buy, or partner', url: WWW + 'build-buy-partner', prefix: 'm', core: 'bbp-core.js', global: 'BBPCore',
      blurb: 'Compare build, buy and partner on weighted criteria and three-year cost.', noun: 'decision matrix' },
    impact: { name: 'Organizational Impact Score', short: 'Impact score', url: WWW + 'impact-score', prefix: 's', core: 'impact-core.js', global: 'ImpactCore',
      blurb: 'Score initiatives against weighted KPIs and get a suggested action for each.', noun: 'impact score' }
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

  // A link that gives whoever opens it their own copy, on the public tool page (no id: it never touches the original).
  function shareUrl(tool, data) { return TOOLS[tool] && data ? openUrl(tool, data, '') : ''; }

  // The tool running inside Learning's workspace: its page on www (or `base`, for tests) with ?embed=1, the saved
  // work in the #, and start=example for "Try the example".
  function embedUrl(tool, data, opts) {
    const t = TOOLS[tool], o = opts || {};
    if (!t) return '';
    const base = o.base || WWW;
    return base + t.url.slice(WWW.length) + '?embed=1' + (o.example && !data ? '&start=example' : '') + (data ? '#' + t.prefix + '=' + data : '');
  }

  // Which tool a link inside a tool points at ('' for anything else), so Learning opens it in the workspace.
  function toolForUrl(href, base) {
    let u;
    try { u = new URL(href); } catch (e) { return ''; }
    const bare = u.origin + u.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    const page = [WWW].concat(base ? [base] : []).map(b => (bare.indexOf(b) === 0 ? bare.slice(b.length) : null)).filter(x => x !== null)[0];
    if (page === undefined) return '';
    return Object.keys(TOOLS).filter(k => TOOLS[k].url.slice(WWW.length) === page)[0] || '';
  }

  // "just now", "5 minutes ago", "3 hours ago", "yesterday", "4 days ago", then the date.
  function ago(ms, now) {
    if (!ms) return 'just now';
    const s = Math.max(0, ((now || Date.now()) - ms) / 1000);
    if (s < 45) return 'just now';
    if (s < 3600) { const m = Math.max(1, Math.round(s / 60)); return m + (m === 1 ? ' minute' : ' minutes') + ' ago'; }
    if (s < 86400) { const h = Math.round(s / 3600); return h + (h === 1 ? ' hour' : ' hours') + ' ago'; }
    const d = Math.floor(s / 86400);
    if (d === 1) return 'yesterday';
    if (d < 7) return d + ' days ago';
    return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function displayTitle(d) { return d.title || 'Untitled ' + (TOOLS[d.tool] ? TOOLS[d.tool].short.toLowerCase() : 'tool'); }
  function copyTitle(title) { return clean('Copy of ' + (title || 'untitled'), 100); }

  // Newest first. updatedAt is a Firestore Timestamp (or anything with toMillis), or missing while a write is pending.
  function sortNewest(list) {
    const ms = (d) => (d.updatedAt && d.updatedAt.toMillis ? d.updatedAt.toMillis() : Date.now());
    return list.slice().sort((a, b) => ms(b) - ms(a));
  }

  // The list in My toolkit: one tool or all ('' or 'all'), words to look for in the name, summary or tool, and
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

  // A file name for a saved tool's download: "Q3 roadmap - Organizational Impact Score.csv".
  function fileName(d) {
    const name = (displayTitle(d) + (TOOLS[d.tool] ? ' - ' + TOOLS[d.tool].name : '')).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
    return name.slice(0, 120) + '.csv';
  }

  root.SavedToolsCore = { TOOLS, CORE_BASE, MAX_DATA, parseHandoff, record, openUrl, displayTitle, copyTitle, sortNewest,
    filterSort, countByTool, fileName, shareUrl, embedUrl, toolForUrl, ago };
})(typeof window !== 'undefined' ? window : globalThis);
