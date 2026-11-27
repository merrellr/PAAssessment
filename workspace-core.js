// workspace-core.js: the Team Knowledge Workspace (workspace.html), with no DOM. A company's product picture as
// five kinds of item that link to each other:
//   account  a customer (value as a band or an exact annual figure, and how strategic it is)
//   idea     a request or opportunity: linked to the accounts asking and the features that answer it
//   feature  something being built: linked to its release and the goals it serves
//   release  a dated release: linked to the goals it moves
//   goal     a goal with a target date
// Links are kept on one side (the "from" types above) and read both ways (graph). Every member of the company
// reads and edits the workspace; whoever added an item, or an admin, can delete it (firestore.rules,
// workspaces/{orgId}/items). Also: CSV import (parse, guess the columns, build items) and a fictional sample
// company for anyone without one. Tests: tests/workspace-core.test.mjs.
(function (root) {
  var TYPES = {
    goal: { label: 'Goal', plural: 'Goals', links: [], status: ['', 'on_track', 'at_risk', 'done'], date: 'Target date' },
    release: { label: 'Release', plural: 'Releases', links: ['goal'], status: ['', 'planned', 'in_progress', 'shipped'], date: 'Release date' },
    feature: { label: 'Feature', plural: 'Features', links: ['release', 'goal'], status: ['', 'planned', 'in_progress', 'done', 'parked'], area: true },
    idea: { label: 'Idea', plural: 'Ideas', links: ['account', 'feature'], status: ['', 'new', 'considering', 'planned', 'declined'], area: true, votes: true },
    account: { label: 'Account', plural: 'Accounts', links: [], status: [], value: true }
  };
  var ORDER = ['goal', 'release', 'feature', 'idea', 'account'];
  var STATUS = { on_track: 'On track', at_risk: 'At risk', done: 'Done', planned: 'Planned', in_progress: 'In progress', shipped: 'Shipped',
    parked: 'Parked', 'new': 'New', considering: 'Considering', declined: 'Declined' };
  // Annual account value, by band (mid points are used to rank when only a band is known)
  var BANDS = [
    { id: 'b1', label: 'Under $10k', mid: 5000 },
    { id: 'b2', label: '$10k–$50k', mid: 30000 },
    { id: 'b3', label: '$50k–$250k', mid: 150000 },
    { id: 'b4', label: '$250k+', mid: 400000 }
  ];
  var TIERS = ['Not set', 'Standard', 'Important', 'Strategic'];
  var VALUE_MODES = { bands: 'Value bands only', either: 'Bands, or an exact figure where known', exact: 'Exact annual figures' };
  var MAX_ITEMS = 500, MAX_LINKS = 40, MAX_AREAS = 20;
  var LIMITS = { title: 120, note: 2000, area: 40 };
  var FIELDS = ['type', 'title', 'note', 'area', 'status', 'date', 'links', 'band', 'value', 'tier', 'votes'];

  function str(v, n) { return String(v == null ? '' : v).replace(/\s+/g, function (s) { return /\n/.test(s) ? s : ' '; }).trim().slice(0, n); }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
  function isId(s) { return typeof s === 'string' && /^[A-Za-z0-9]{6,32}$/.test(s); }
  function newId() { var c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', s = ''; for (var i = 0; i < 20; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }

  // An item as it is saved: only known fields, trimmed and in range; fields that don't apply to its type are blank.
  // byId (optional) drops links to items that don't exist or aren't a type this one links to.
  function clean(it, byId, valueMode) {
    var type = TYPES[it.type] ? it.type : 'idea', T = TYPES[type];
    var out = { type: type, title: str(it.title, LIMITS.title), note: String(it.note == null ? '' : it.note).trim().slice(0, LIMITS.note),
      area: T.area ? str(it.area, LIMITS.area) : '', status: T.status.indexOf(it.status) > -1 ? it.status : '',
      date: T.date && isDate(String(it.date || '')) ? it.date : '', links: [], band: '', value: null, tier: 0, votes: 0 };
    var seen = {};
    (Array.isArray(it.links) ? it.links : []).forEach(function (id) {
      if (!isId(id) || seen[id] || out.links.length >= MAX_LINKS) return;
      if (byId) { var o = byId[id]; if (!o || T.links.indexOf(o.type) < 0) return; }
      seen[id] = 1; out.links.push(id);
    });
    if (T.value) {
      out.band = BANDS.some(function (b) { return b.id === it.band; }) ? it.band : '';
      var v = typeof it.value === 'number' ? it.value : parseMoney(it.value);
      out.value = valueMode !== 'bands' && v != null && v >= 0 && v <= 1e10 ? Math.round(v) : null;
      out.tier = [0, 1, 2, 3].indexOf(+it.tier) > -1 ? +it.tier : 0;
    }
    if (T.votes) { var n = Math.round(+it.votes || 0); out.votes = n >= 0 && n <= 100000 ? n : 0; }
    return out;
  }
  // What's wrong with an item, in words (empty: fine to save)
  function problems(it) {
    var p = [];
    if (!TYPES[it.type]) p.push('Pick what kind of item this is.');
    if (!str(it.title, LIMITS.title)) p.push('Give it a title.');
    if (it.date && !isDate(it.date)) p.push('The date should look like 2027-03-31.');
    return p;
  }

  function parseMoney(v) {
    if (v == null || v === '') return null;
    var s = String(v).trim().toLowerCase().replace(/[$£€,\s]/g, ''), m = s.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
    if (!m) return null;
    return Math.round(parseFloat(m[1]) * (m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : 1));
  }
  function bandFor(v) { if (v == null) return ''; return v < 1e4 ? 'b1' : v < 5e4 ? 'b2' : v < 2.5e5 ? 'b3' : 'b4'; }
  // An account's annual value for ranking: the exact figure when there is one, else the middle of its band
  function accountValue(a) {
    if (!a) return 0;
    if (typeof a.value === 'number' && a.value >= 0) return a.value;
    var b = BANDS.filter(function (x) { return x.id === a.band; })[0];
    return b ? b.mid : 0;
  }
  function valueLabel(a, mode) {
    if (mode !== 'bands' && typeof a.value === 'number') return '$' + (a.value >= 1e6 ? (a.value / 1e6).toFixed(1).replace(/\.0$/, '') + 'm' : a.value >= 1e3 ? Math.round(a.value / 1e3) + 'k' : a.value);
    var b = BANDS.filter(function (x) { return x.id === (a.band || bandFor(a.value)); })[0];
    return b ? b.label : 'Value not set';
  }

  // Links read both ways: { id: [ids it is connected to] }
  function graph(items) {
    var g = {}, byId = {};
    items.forEach(function (it) { byId[it.id] = it; g[it.id] = []; });
    items.forEach(function (it) {
      (it.links || []).forEach(function (id) {
        if (!byId[id]) return;
        if (g[it.id].indexOf(id) < 0) g[it.id].push(id);
        if (g[id].indexOf(it.id) < 0) g[id].push(it.id);
      });
    });
    return g;
  }
  // Items this type can link to (its "from" side), and the types that link to it
  function linkTargets(type) { return (TYPES[type] || {}).links || []; }
  function linkedFrom(type) { return ORDER.filter(function (t) { return TYPES[t].links.indexOf(type) > -1; }); }

  function counts(items) { var c = {}; ORDER.forEach(function (t) { c[t] = 0; }); items.forEach(function (it) { if (c[it.type] != null) c[it.type]++; }); return c; }
  function search(items, q, type) {
    var words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(function (it) {
      if (type && it.type !== type) return false;
      var hay = (it.title + ' ' + (it.note || '') + ' ' + (it.area || '')).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    });
  }
  // Areas in use, plus the company's own list (settings), for the area picker
  function areas(items, settings) {
    var out = ((settings && settings.areas) || []).slice();
    items.forEach(function (it) { if (it.area && out.indexOf(it.area) < 0) out.push(it.area); });
    return out.slice(0, 60);
  }

  // ----------------------------------------------------------------------------------------------- CSV import
  // RFC 4180-ish: commas (or semicolons/tabs, whichever the header uses most), quotes with "" inside, newlines in quotes
  function parseCsv(text) {
    text = String(text || '').replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '', delim = [',', ';', '\t'].sort(function (a, b) { return first.split(b).length - first.split(a).length; })[0];
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"' && cell === '') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
    if (!rows.length) return { headers: [], rows: [] };
    return { headers: rows[0].map(function (h) { return h.trim(); }), rows: rows.slice(1) };
  }
  var GUESS = {
    title: /^(title|name|summary|idea|feature|account|goal|release|item)( name| title)?$/i,
    type: /^(type|kind|item type|issue type|category)$/i,
    note: /^(note|notes|description|details|body|comment)s?$/i,
    area: /^(area|product area|component|components|theme|module)s?$/i,
    status: /^(status|state|stage)$/i,
    date: /^(date|due|due date|release date|target|target date|ship date|fix version date)$/i,
    value: /^(value|arr|mrr|revenue|annual value|contract value|acv)$/i,
    band: /^(band|value band|tier band|size)$/i,
    tier: /^(tier|strategic|importance|priority tier)$/i,
    votes: /^(votes|vote count|requests|request count|upvotes)$/i,
    links: /^(links?|linked to|related|accounts|features|goals?|release|parent|epic link)$/i
  };
  function guessMapping(headers) {
    var m = {};
    Object.keys(GUESS).forEach(function (f) {
      for (var i = 0; i < headers.length; i++) if (GUESS[f].test(headers[i]) && !Object.keys(m).some(function (k) { return m[k] === i; })) { m[f] = i; break; }
    });
    return m;
  }
  function typeFrom(s) {
    s = String(s || '').trim().toLowerCase();
    if (/goal|objective|okr/.test(s)) return 'goal';
    if (/release|version|milestone/.test(s)) return 'release';
    if (/feature|epic|story|initiative/.test(s)) return 'feature';
    if (/idea|request|insight|feedback/.test(s)) return 'idea';
    if (/account|customer|client|company/.test(s)) return 'account';
    return '';
  }
  function statusFrom(type, s) {
    s = String(s || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    var map = { todo: 'planned', to_do: 'planned', backlog: 'planned', open: 'new', doing: 'in_progress', in_development: 'in_progress', released: 'shipped', complete: 'done', completed: 'done', closed: 'done', rejected: 'declined', wont_do: 'declined', at_risk: 'at_risk', on_track: 'on_track' };
    s = map[s] || s;
    if (type === 'release' && s === 'done') s = 'shipped';
    return TYPES[type].status.indexOf(s) > -1 ? s : '';
  }
  function dateFrom(s) {
    s = String(s || '').trim();
    if (isDate(s)) return s;
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);   // US month/day/year
    if (m) { var d = m[3] + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2); return isDate(d) ? d : ''; }
    var t = Date.parse(s); return s && !isNaN(t) ? new Date(t).toISOString().slice(0, 10) : '';
  }
  // Rows to new items. mapping: { field: column index }; fallbackType when there is no type column (or it's blank);
  // existing: the workspace's items, so "linked to" can name them by title. Rows with no title, or past the
  // workspace limit, are skipped and said why. Returns { items (with ids), skipped: [{ row, reason }] }.
  function fromRows(rows, mapping, fallbackType, existing, valueMode) {
    existing = existing || [];
    var room = MAX_ITEMS - existing.length, items = [], skipped = [];
    var cell = function (r, f) { return mapping[f] == null ? '' : String(r[mapping[f]] == null ? '' : r[mapping[f]]).trim(); };
    rows.forEach(function (r, i) {
      var type = typeFrom(cell(r, 'type')) || fallbackType;
      if (!TYPES[type]) { skipped.push({ row: i + 2, reason: 'not a goal, release, feature, idea or account' }); return; }
      if (!cell(r, 'title')) { skipped.push({ row: i + 2, reason: 'no title' }); return; }
      if (items.length >= room) { skipped.push({ row: i + 2, reason: 'the workspace is full (' + MAX_ITEMS + ' items)' }); return; }
      var band = cell(r, 'band'), value = parseMoney(cell(r, 'value'));
      var bandId = (BANDS.filter(function (b) { return b.id === band || b.label.toLowerCase() === band.toLowerCase(); })[0] || {}).id || bandFor(value);
      var tierS = cell(r, 'tier').toLowerCase(), tier = TIERS.map(function (t) { return t.toLowerCase(); }).indexOf(tierS);
      if (tier < 0) tier = /^[0-3]$/.test(tierS) ? +tierS : /key|strategic|high/.test(tierS) ? 3 : /important|medium/.test(tierS) ? 2 : /low|standard/.test(tierS) ? 1 : 0;
      var it = clean({ type: type, title: cell(r, 'title'), note: cell(r, 'note'), area: cell(r, 'area'), status: statusFrom(type, cell(r, 'status')),
        date: dateFrom(cell(r, 'date')), band: bandId, value: value, tier: tier, votes: parseInt(cell(r, 'votes'), 10) || 0 }, null, valueMode);
      it.id = newId(); it._linkNames = cell(r, 'links').split(/\s*[;|]\s*/).filter(Boolean);
      items.push(it);
    });
    // "linked to": by title (any case), among what's there and what's coming in, kept only where the types can link
    var byTitle = {};
    existing.concat(items).forEach(function (it) { var k = it.title.toLowerCase(); (byTitle[k] = byTitle[k] || []).push(it); });
    items.forEach(function (it) {
      var allowed = linkTargets(it.type);
      it.links = [];
      it._linkNames.forEach(function (n) {
        var hit = (byTitle[n.toLowerCase()] || []).filter(function (o) { return allowed.indexOf(o.type) > -1; })[0];
        if (hit && it.links.indexOf(hit.id) < 0 && it.links.length < MAX_LINKS) it.links.push(hit.id);
      });
      delete it._linkNames;
    });
    return { items: items, skipped: skipped };
  }

  // ------------------------------------------------------------------------------------------------ the views
  var TIER_WEIGHT = [1, 1, 1.5, 2];   // Not set, Standard, Important, Strategic
  function index(items) { var m = {}; items.forEach(function (i) { m[i.id] = i; }); return m; }
  function rankBy(list, key) {   // 1 = highest; ties share a rank
    var sorted = list.slice().sort(function (a, b) { return b[key] - a[key]; }), r = {};
    sorted.forEach(function (x, i) { r[x.id] = i && sorted[i - 1][key] === x[key] ? r[sorted[i - 1].id] : i + 1; });
    return r;
  }
  // Value view: each idea with the accounts asking for it, their annual value (exact or band middle), that value
  // weighted by how strategic each account is (weighted: false to leave it out), and its votes; ranked by value,
  // with its rank by votes beside it. exact: true when every account behind it has an exact figure.
  function valueRank(items, opts) {
    var weighted = !(opts && opts.weighted === false), m = index(items);
    var rows = items.filter(function (i) { return i.type === 'idea'; }).map(function (idea) {
      var accts = (idea.links || []).map(function (id) { return m[id]; }).filter(function (a) { return a && a.type === 'account'; });
      var value = 0, score = 0;
      accts.forEach(function (a) { var v = accountValue(a); value += v; score += v * (weighted ? TIER_WEIGHT[a.tier || 0] : 1); });
      return { id: idea.id, title: idea.title, area: idea.area || '', status: idea.status || '', votes: idea.votes || 0, accounts: accts, value: value, score: Math.round(score),
        exact: accts.length > 0 && accts.every(function (a) { return typeof a.value === 'number'; }), strategic: accts.filter(function (a) { return a.tier === 3; }).length };
    });
    var byValue = rankBy(rows, 'score'), byVotes = rankBy(rows, 'votes');
    rows.forEach(function (r) { r.rank = byValue[r.id]; r.voteRank = byVotes[r.id]; r.shift = r.voteRank - r.rank; });
    return rows.sort(function (a, b) { return a.rank - b.rank || b.votes - a.votes || a.title.localeCompare(b.title); });
  }
  function money(v, approx) {
    var s = v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'm' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(Math.round(v));
    return (approx ? '≈ $' : '$') + s;
  }

  // Release map: product areas (rows) by releases in date order (columns), plus "No area" and "No release".
  // A cell holds the features in that area and release, each with the ideas linked to it.
  function releaseMap(items) {
    var m = index(items), feats = items.filter(function (i) { return i.type === 'feature'; });
    var releases = items.filter(function (i) { return i.type === 'release'; }).sort(function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title); });
    var g = graph(items), cols = releases.map(function (r) { return { id: r.id, title: r.title, date: r.date || '', status: r.status || '' }; });
    var relOf = function (f) { var r = (f.links || []).map(function (id) { return m[id]; }).filter(function (x) { return x && x.type === 'release'; })[0]; return r ? r.id : ''; };
    if (feats.some(function (f) { return !relOf(f); })) cols.push({ id: '', title: 'No release', date: '', status: '' });
    var areaNames = []; feats.forEach(function (f) { var a = f.area || ''; if (areaNames.indexOf(a) < 0) areaNames.push(a); });
    areaNames.sort(function (a, b) { return !a ? 1 : !b ? -1 : a.localeCompare(b); });
    var rows = areaNames.map(function (a) {
      return { area: a, label: a || 'No area', cells: cols.map(function (c) {
        return feats.filter(function (f) { return (f.area || '') === a && relOf(f) === c.id; }).sort(function (x, y) { return x.title.localeCompare(y.title); }).map(function (f) {
          return { id: f.id, title: f.title, status: f.status || '', ideas: (g[f.id] || []).map(function (id) { return m[id]; }).filter(function (x) { return x && x.type === 'idea'; }).map(function (x) { return { id: x.id, title: x.title }; }) };
        });
      }) };
    });
    var ideasIn = cols.map(function (c, ci) { var seen = {}; rows.forEach(function (r) { r.cells[ci].forEach(function (f) { f.ideas.forEach(function (i) { seen[i.id] = 1; }); }); }); return Object.keys(seen).length; });
    cols.forEach(function (c, i) { c.features = rows.reduce(function (n, r) { return n + r.cells[i].length; }, 0); c.ideas = ideasIn[i]; });
    return { cols: cols, rows: rows };
  }

  // Goal timeline: each goal (by target date) with the features linked to it, each placed at its release's date
  // (features with no dated release are listed as not scheduled), and the releases linked to it, as markers.
  // range: the earliest and latest dates shown (goal targets and release dates), for drawing a shared axis.
  function goalTimeline(items) {
    var m = index(items), g = graph(items), all = [];
    var relOf = function (f) { return (f.links || []).map(function (id) { return m[id]; }).filter(function (x) { return x && x.type === 'release'; })[0] || null; };
    var goals = items.filter(function (i) { return i.type === 'goal'; }).sort(function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title); });
    var out = goals.map(function (goal) {
      var linked = g[goal.id] || [], feats = {}, rels = linked.map(function (id) { return m[id]; }).filter(function (x) { return x && x.type === 'release'; });
      linked.forEach(function (id) { if (m[id] && m[id].type === 'feature') feats[id] = m[id]; });
      var placed = [], unscheduled = [];
      Object.keys(feats).forEach(function (id) {
        var f = feats[id], r = relOf(f);
        if (r && r.date) { placed.push({ id: f.id, title: f.title, status: f.status || '', date: r.date, release: r.title, releaseId: r.id, late: !!(goal.date && r.date > goal.date) }); all.push(r.date); }
        else unscheduled.push({ id: f.id, title: f.title, status: f.status || '', release: r ? r.title : '' });
      });
      placed.sort(function (a, b) { return a.date.localeCompare(b.date) || a.title.localeCompare(b.title); });
      unscheduled.sort(function (a, b) { return a.title.localeCompare(b.title); });
      if (goal.date) all.push(goal.date);
      var releases = rels.filter(function (r) { return r.date; }).map(function (r) { all.push(r.date); return { id: r.id, title: r.title, date: r.date, status: r.status || '' }; })
        .sort(function (a, b) { return a.date.localeCompare(b.date); });
      return { id: goal.id, title: goal.title, date: goal.date || '', status: goal.status || '', features: placed, unscheduled: unscheduled, releases: releases,
        done: placed.concat(unscheduled).filter(function (f) { return f.status === 'done'; }).length };
    });
    all.sort();
    return { goals: out, range: all.length ? { from: all[0], to: all[all.length - 1] } : null };
  }
  // Where a date falls between two others, 0 to 1 (for the timeline axis)
  function position(date, range) {
    if (!range || !date) return 0;
    var a = Date.parse(range.from), b = Date.parse(range.to), d = Date.parse(date);
    return b > a ? Math.max(0, Math.min(1, (d - a) / (b - a))) : 0.5;
  }

  // Product map: the five kinds as columns in link order (accounts → ideas → features → releases → goals), every
  // link as a line between two columns. Each item gets a place; the order within a column starts sensibly (value,
  // date) and is then nudged towards the middle of what it links to, so lines cross less.
  //   productMap(items, { nodeW, nodeH, gapX, gapY }) → { cols: [{ type, label, x, nodes: [{ id, title, type, status, x, y }] }],
  //     edges: [{ from, to }] (from: the left end), width, height, size: { w, h } }
  var MAP_COLS = ['account', 'idea', 'feature', 'release', 'goal'];
  function productMap(items, o) {
    o = o || {};
    var W = o.nodeW || 160, H = o.nodeH || 38, GX = o.gapX || 56, GY = o.gapY || 8, m = index(items);
    var col = {}; MAP_COLS.forEach(function (t, i) { col[t] = i; });
    var edges = [], seen = {};
    items.forEach(function (it) {
      (it.links || []).forEach(function (id) {
        var o2 = m[id]; if (!o2 || col[it.type] == null || col[o2.type] == null || col[it.type] === col[o2.type]) return;
        var a = col[it.type] < col[o2.type] ? it.id : o2.id, b = a === it.id ? o2.id : it.id, k = a + '>' + b;
        if (!seen[k]) { seen[k] = 1; edges.push({ from: a, to: b }); }
      });
    });
    var nb = {}; items.forEach(function (i) { nb[i.id] = []; });
    edges.forEach(function (e) { nb[e.from].push(e.to); nb[e.to].push(e.from); });
    var vr = {}; valueRank(items).forEach(function (r) { vr[r.id] = r.rank; });
    var start = {
      account: function (a, b) { return accountValue(b) - accountValue(a) || a.title.localeCompare(b.title); },
      idea: function (a, b) { return vr[a.id] - vr[b.id] || a.title.localeCompare(b.title); },
      feature: function (a, b) { return a.title.localeCompare(b.title); },
      release: function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title); },
      goal: function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title); }
    };
    var lists = MAP_COLS.map(function (t) { return items.filter(function (i) { return i.type === t; }).sort(start[t]); });
    var pos = {};
    var place = function () { lists.forEach(function (l) { l.forEach(function (it, i) { pos[it.id] = i / Math.max(1, l.length - 1); }); }); };
    place();
    // barycentre sweeps: right, then left, twice; items with no links keep their place
    for (var sweep = 0; sweep < 4; sweep++) {
      var order = sweep % 2 ? [3, 2, 1, 0] : [1, 2, 3, 4];
      order.forEach(function (ci) {
        var l = lists[ci], bc = {};
        l.forEach(function (it) { var ps = nb[it.id].map(function (id) { return pos[id]; }); bc[it.id] = ps.length ? ps.reduce(function (a, b) { return a + b; }, 0) / ps.length : pos[it.id]; });
        l.sort(function (a, b) { return bc[a.id] - bc[b.id] || pos[a.id] - pos[b.id]; });
        l.forEach(function (it, i) { pos[it.id] = i / Math.max(1, l.length - 1); });
      });
    }
    var tallest = Math.max.apply(null, lists.map(function (l) { return l.length; }).concat([1]));
    var height = tallest * (H + GY) - GY;
    var cols = MAP_COLS.map(function (t, ci) {
      var l = lists[ci], x = ci * (W + GX), top = (height - (l.length * (H + GY) - GY)) / 2;   // shorter columns are centred
      return { type: t, label: TYPES[t].plural, x: x, nodes: l.map(function (it, i) { return { id: it.id, title: it.title, type: t, status: it.status || '', x: x, y: Math.max(0, top) + i * (H + GY) }; }) };
    });
    return { cols: cols, edges: edges, width: MAP_COLS.length * W + (MAP_COLS.length - 1) * GX, height: Math.max(H, height), size: { w: W, h: H } };
  }
  // Everything one item leads to and comes from along the chain: going right only to the right, going left only to
  // the left (so an account shows what its requests became, not every other account behind those features).
  function trace(items, id) {
    var m = index(items), col = {}; MAP_COLS.forEach(function (t, i) { col[t] = i; });
    if (!m[id] || col[m[id].type] == null) return { ids: [], edges: [] };
    var g = graph(items), ids = {}, edges = {};
    ids[id] = 1;
    [1, -1].forEach(function (dir) {
      var todo = [id];
      while (todo.length) {
        var cur = todo.shift();
        (g[cur] || []).forEach(function (n) {
          if (!m[n] || col[m[n].type] == null || (col[m[n].type] - col[m[cur].type]) * dir <= 0) return;
          var k = dir > 0 ? cur + '>' + n : n + '>' + cur; edges[k] = 1;
          if (!ids[n]) { ids[n] = 1; todo.push(n); }
        });
      }
    });
    return { ids: Object.keys(ids), edges: Object.keys(edges) };
  }

  // ------------------------------------------------------------------------------------- notes, updates, Ask
  var NOTE_LIMITS = { title: 120, note: 4000, update: 600, source: 200, links: 20 };
  // A note (title, body, where it came from) or a short update, linked to items (byId drops links to missing ones)
  function cleanNote(n, byId) {
    var kind = n.kind === 'update' ? 'update' : 'note', seen = {}, links = [];
    (Array.isArray(n.links) ? n.links : []).forEach(function (id) {
      if (!isId(id) || seen[id] || links.length >= NOTE_LIMITS.links || (byId && !byId[id])) return; seen[id] = 1; links.push(id);
    });
    return { kind: kind, title: kind === 'note' ? str(n.title, NOTE_LIMITS.title) : '', body: String(n.body == null ? '' : n.body).trim().slice(0, NOTE_LIMITS[kind]),
      links: links, source: kind === 'note' ? str(n.source, NOTE_LIMITS.source) : '' };
  }
  function noteProblems(n) {
    var p = [];
    if (n.kind === 'note' && !n.title) p.push('Give the note a title.');
    if (!n.body) p.push(n.kind === 'update' ? 'Write the update.' : 'Write the note.');
    return p;
  }
  function ms(v) { return v == null ? 0 : typeof v === 'number' ? v : v.toMillis ? v.toMillis() : v.seconds ? v.seconds * 1000 : Date.parse(v) || 0; }
  // What's been happening, newest first: posted updates, notes added, and items added or changed (only each item's
  // latest change is known). Each: { at, kind: 'update' | 'note' | 'added' | 'changed', who, id, title, text, links, type }
  function feed(items, notes, max) {
    var out = [];
    (notes || []).forEach(function (n) {
      out.push({ at: ms(n.createdAt), kind: n.kind === 'update' ? 'update' : 'note', who: n.authorName || '', id: n.id, title: n.title || '', text: n.body || '', links: n.links || [] });
    });
    (items || []).forEach(function (it) {
      var c = ms(it.createdAt), u = ms(it.updatedAt);
      if (!c && !u) return;
      var changed = !!u && (!c || u - c > 60000);   // no creation time known: it was at least changed then
      out.push({ at: changed ? u : c || u, kind: changed ? 'changed' : 'added', who: it.updatedByName || '', id: it.id, title: it.title, text: '', links: [], type: it.type });
    });
    return out.sort(function (a, b) { return b.at - a.at; }).slice(0, max || 60);
  }
  function notesFor(notes, id) { return (notes || []).filter(function (n) { return (n.links || []).indexOf(id) > -1; }).sort(function (a, b) { return ms(b.createdAt) - ms(a.createdAt); }); }

  // Ask: the workspace written out as entries, the ones that share the most words with the question first (the
  // rest in a sensible order), up to a budget. Returns { text: entries joined by blank lines, refs: [{ id, kind }] in
  // the same order, so the answer's [n] can open the nth }.
  var STOP = { the: 1, a: 1, an: 1, and: 1, or: 1, of: 1, to: 1, in: 1, on: 1, for: 1, is: 1, are: 1, we: 1, our: 1, what: 1, which: 1, who: 1, how: 1, do: 1, does: 1, it: 1, this: 1, that: 1, with: 1, by: 1, be: 1, at: 1, from: 1, any: 1, about: 1 };
  function words(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9$£€%\s-]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 1 && !STOP[w]; }); }
  function askContext(question, items, notes, settings, budget) {
    budget = budget || 3500;
    var m = index(items), g = graph(items), mode = (settings && settings.valueMode) || 'either';
    var title = function (id) { return m[id] ? m[id].title : null; };
    var entries = items.map(function (it) {
      var T = TYPES[it.type], bits = [T.label + ': ' + it.title];
      if (it.status) bits.push('Status: ' + STATUS[it.status]);
      if (it.area) bits.push('Area: ' + it.area);
      if (it.date) bits.push((T.date || 'Date') + ': ' + it.date);
      if (it.type === 'account') { bits.push('Annual value: ' + valueLabel(it, mode)); if (it.tier) bits.push('How strategic: ' + TIERS[it.tier]); }
      if (it.type === 'idea') bits.push('Votes: ' + (it.votes || 0));
      var linked = (g[it.id] || []).map(function (id) { return m[id] ? TYPES[m[id].type].label + ' "' + m[id].title + '"' : null; }).filter(Boolean);
      if (linked.length) bits.push('Linked to: ' + linked.slice(0, 12).join(', '));
      if (it.note) bits.push('Notes: ' + it.note.slice(0, 400));
      return { id: it.id, kind: 'item', text: bits.join('. '), order: ORDER.indexOf(it.type) };
    }).concat((notes || []).map(function (n) {
      var about = (n.links || []).map(title).filter(Boolean);
      return { id: n.id, kind: n.kind, text: (n.kind === 'update' ? 'Update' : 'Note: ' + n.title) + (n.authorName ? ' (by ' + n.authorName + ')' : '') +
        (n.source ? ' [from ' + n.source + ']' : '') + '. ' + String(n.body || '').slice(0, 900) + (about.length ? ' About: ' + about.join(', ') : ''), order: 5, at: ms(n.createdAt) };
    }));
    var q = words(question);
    entries.forEach(function (e) { var w = words(e.text), hit = 0; q.forEach(function (x) { if (w.indexOf(x) > -1) hit++; }); e.score = hit; });
    entries.sort(function (a, b) { return b.score - a.score || a.order - b.order || (b.at || 0) - (a.at || 0); });
    var out = [], refs = [], used = 0;
    for (var i = 0; i < entries.length && refs.length < 30; i++) {
      var tx = entries[i].text.replace(/\s*\n+\s*/g, ' ');
      if (used + tx.length + 2 > budget) continue;
      out.push(tx); refs.push({ id: entries[i].id, kind: entries[i].kind }); used += tx.length + 2;
    }
    return { text: out.join('\n\n'), refs: refs };
  }
  // The sample's notes and updates (fictional, like the rest of Tidewater)
  function sampleNotes() {
    var day = 864e5, now = Date.now();   // dated back from today, so "2 days ago" reads right
    return [
      { id: 'samplen1', kind: 'note', title: 'Northgate evaluation call', body: 'Northgate will only roll out to all regions if dispatch works across branches. They asked for a date; we said the autumn release, not sooner.', links: ['samplea6', 'samplei2', 'samplef5'], source: 'Customer call, 9 Jun', authorName: 'Priya (sample)', createdAt: now - 9 * day },
      { id: 'samplen2', kind: 'note', title: 'Why self-booking is parked', body: 'Most requests come from accounts under $50k a year. We agreed to revisit after route optimisation ships.', links: ['samplef7', 'samplei3'], source: 'Planning, 2 Jun', authorName: 'Sam (sample)', createdAt: now - 16 * day },
      { id: 'sampleu1', kind: 'update', title: '', body: 'Route optimisation is in beta with Harbor. Early drive-time savings look like 40 minutes a technician a day.', links: ['samplef4', 'samplea1'], source: '', authorName: 'Priya (sample)', createdAt: now - 2 * day },
      { id: 'sampleu2', kind: 'update', title: '', body: 'Spring release is out: guided setup and sample jobs.', links: ['sampler1'], source: '', authorName: 'Sam (sample)', createdAt: now - 95 * day }
    ];
  }

  // ------------------------------------------------------------------------------------------ the sample company
  // Fictional: Tidewater, a scheduling app for field-service teams. Every name and number is made up.
  function sample() {
    var S = [
      ['g1', 'goal', 'Grow mid-market revenue 30%', 'Win and expand accounts with 50–500 technicians.', '', 'on_track', '2027-12-31'],
      ['g2', 'goal', 'Cut time to first job under one day', 'New teams should schedule a real job on day one.', '', 'at_risk', '2027-06-30'],
      ['g3', 'goal', 'Halve missed appointments', 'Fewer no-shows for our customers’ customers.', '', 'on_track', '2027-09-30'],
      ['r1', 'release', 'Spring release', '', '', 'shipped', '2027-03-15', ['g2']],
      ['r2', 'release', 'Summer release', '', '', 'in_progress', '2027-06-20', ['g1', 'g3']],
      ['r3', 'release', 'Autumn release', '', '', 'planned', '2027-10-05', ['g1']],
      ['f1', 'feature', 'Guided setup', 'A step-by-step first week for new admins.', 'Onboarding', 'done', '', ['r1', 'g2']],
      ['f2', 'feature', 'Sample jobs on sign-up', 'Pre-filled jobs so the calendar is never empty.', 'Onboarding', 'done', '', ['r1', 'g2']],
      ['f3', 'feature', 'Text reminders with reschedule link', '', 'Notifications', 'in_progress', '', ['r2', 'g3']],
      ['f4', 'feature', 'Route optimisation', 'Order a technician’s day by drive time.', 'Scheduling', 'in_progress', '', ['r2', 'g1']],
      ['f5', 'feature', 'Multi-region teams', 'Dispatch across several branches.', 'Scheduling', 'planned', '', ['r3', 'g1']],
      ['f6', 'feature', 'Accounting export', 'Send completed jobs to the books.', 'Integrations', 'planned', '', ['r3', 'g1']],
      ['f7', 'feature', 'Customer self-booking page', '', 'Booking', 'parked', '', ['g3']],
      ['a1', 'account', 'Harbor Plumbing Co.', '420 technicians, three regions.', '', '', '', [], 'b4', 380000, 3],
      ['a2', 'account', 'Summit Heating & Air', '', '', '', '', [], 'b3', 120000, 3],
      ['a3', 'account', 'Greenleaf Lawn Care', 'Seasonal; peaks in spring.', '', '', '', [], 'b2', 28000, 1],
      ['a4', 'account', 'Brightline Electric', '', '', '', '', [], 'b3', 95000, 2],
      ['a5', 'account', 'Kestrel Pest Control', '', '', '', '', [], 'b1', 6000, 1],
      ['a6', 'account', 'Northgate Facilities', 'Evaluating; large rollout if it fits.', '', '', '', [], 'b4', 300000, 3],
      ['i1', 'idea', 'Plan routes by drive time', 'Technicians lose an hour a day to backtracking.', 'Scheduling', 'planned', '', ['a1', 'a2', 'a6', 'f4'], '', null, 0, 14],
      ['i2', 'idea', 'Dispatch across branches', '', 'Scheduling', 'planned', '', ['a1', 'a6', 'f5'], '', null, 0, 6],
      ['i3', 'idea', 'Let customers book online', 'Many small accounts ask for this.', 'Booking', 'considering', '', ['a3', 'a5', 'f7'], '', null, 0, 41],
      ['i4', 'idea', 'Reminder texts the day before', '', 'Notifications', 'planned', '', ['a2', 'a3', 'a4', 'f3'], '', null, 0, 23],
      ['i5', 'idea', 'Export jobs to accounting', '', 'Integrations', 'planned', '', ['a4', 'a6', 'f6'], '', null, 0, 9],
      ['i6', 'idea', 'Dark mode for the technician app', '', 'Mobile', 'new', '', ['a5'], '', null, 0, 37],
      ['i7', 'idea', 'Photo proof of a finished job', 'Disputes take days to settle without it.', 'Mobile', 'new', '', ['a1', 'a4'], '', null, 0, 11]
    ];
    return S.map(function (r) {
      var it = clean({ type: r[1], title: r[2], note: r[3], area: r[4], status: r[5], date: r[6], links: (r[7] || []).map(function (x) { return 'sample' + x; }), band: r[8], value: r[9], tier: r[10], votes: r[11] }, null, 'either');
      it.id = 'sample' + r[0];
      return it;
    });
  }
  var SAMPLE_SETTINGS = { valueMode: 'either', areas: ['Onboarding', 'Scheduling', 'Notifications', 'Booking', 'Integrations', 'Mobile'] };

  root.WorkspaceCore = { TYPES: TYPES, ORDER: ORDER, STATUS: STATUS, BANDS: BANDS, TIERS: TIERS, VALUE_MODES: VALUE_MODES, MAX_ITEMS: MAX_ITEMS,
    MAX_LINKS: MAX_LINKS, MAX_AREAS: MAX_AREAS, LIMITS: LIMITS, FIELDS: FIELDS, clean: clean, problems: problems, newId: newId, isId: isId, isDate: isDate,
    parseMoney: parseMoney, bandFor: bandFor, accountValue: accountValue, valueLabel: valueLabel, graph: graph, linkTargets: linkTargets,
    linkedFrom: linkedFrom, counts: counts, search: search, areas: areas, parseCsv: parseCsv, guessMapping: guessMapping, typeFrom: typeFrom,
    statusFrom: statusFrom, dateFrom: dateFrom, fromRows: fromRows, sample: sample, SAMPLE_SETTINGS: SAMPLE_SETTINGS,
    TIER_WEIGHT: TIER_WEIGHT, valueRank: valueRank, money: money, releaseMap: releaseMap, goalTimeline: goalTimeline, position: position,
    MAP_COLS: MAP_COLS, productMap: productMap, trace: trace,
    NOTE_LIMITS: NOTE_LIMITS, cleanNote: cleanNote, noteProblems: noteProblems, ms: ms, feed: feed, notesFor: notesFor, askContext: askContext, sampleNotes: sampleNotes };
})(typeof window !== 'undefined' ? window : globalThis);
