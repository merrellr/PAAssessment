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
    statusFrom: statusFrom, dateFrom: dateFrom, fromRows: fromRows, sample: sample, SAMPLE_SETTINGS: SAMPLE_SETTINGS };
})(typeof window !== 'undefined' ? window : globalThis);
