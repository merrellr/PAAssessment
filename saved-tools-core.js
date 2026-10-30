/* My saved tools (my-tools.html): the parts with no Firebase in them, so they can be tested on their own
   (tests/saved-tools.test.mjs). The four free interactive tools live on www.productadvisory.co; their "Save to my
   account" button opens /my-tools#save=<base64url JSON { v, tool, doc, title, summary, data }>, where `data` is the
   tool's own share-link encoding. A saved tool opens back on www as <tool url>#<prefix>=<data>&doc=<id>, and the
   tool remembers the id so its next Save updates the same copy. */
(function (root) {
  'use strict';

  const WWW = 'https://www.productadvisory.co/';
  const TOOLS = {
    scorecard: { name: 'Feature Prioritization Scorecard', short: 'Scorecard', url: WWW + 'scorecard', prefix: 's' },
    ai: { name: 'AI Use Case Prioritization', short: 'AI use cases', url: WWW + 'ai-use-cases', prefix: 'u' },
    bbp: { name: 'Build, Buy, or Partner Decision Matrix', short: 'Build, buy, or partner', url: WWW + 'build-buy-partner', prefix: 'm' },
    impact: { name: 'Organizational Impact Score', short: 'Impact score', url: WWW + 'impact-score', prefix: 's' }
  };
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

  root.SavedToolsCore = { TOOLS, MAX_DATA, parseHandoff, record, openUrl, displayTitle, copyTitle, sortNewest };
})(typeof window !== 'undefined' ? window : globalThis);
