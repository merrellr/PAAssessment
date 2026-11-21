/* My notes: the highlights, notes and tags readers make on www.productadvisory.co (articles and the book).
   The parts with no Firebase in them, so they can be tested on their own (tests/notes-core.test.mjs).

   On www, assets/js/notes.js keeps the notes in the browser. When the reader is signed in here, it sends them to
   notes-bridge.html (a hidden frame on www) which merges them with the copy in Firestore, readerNotes/{uid}/items/{id},
   and sends the merged set back. my-notes.html lists, edits and exports them.

   A note: { id, url, title, kind, color, quote, prefix, suffix, pos, note, tags, created, updated, deleted }.
   `updated` is the time of the last edit (milliseconds, from the reader's device); the newer copy of a note wins.
   A deleted note stays as a marker (deleted: true, its words cleared) so the deletion reaches every device. */
(function (root) {
  'use strict';

  const WWW = 'https://www.productadvisory.co';
  const ORIGINS = [WWW, 'https://productadvisory.co'];   // the pages allowed to talk to the bridge
  const COLORS = ['y', 'b', 'g', 'p'];
  const COLOR_NAMES = { y: 'Yellow', b: 'Blue', g: 'Green', p: 'Pink' };
  const MAX_NOTES = 3000;
  const ID = /^[a-z0-9]{6,24}$/;

  const str = (v, max) => String(v == null ? '' : v).slice(0, max);
  const int = (v) => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.floor(v) : 0);

  function cleanTags(list) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach((t) => {
      t = String(t == null ? '' : t).replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 30);
      if (t && out.indexOf(t) < 0 && out.length < 10) out.push(t);
    });
    return out;
  }

  // A note as it is stored: exactly the fields the security rules allow (savedAt is added on save), or null if it
  // isn't one.
  function clean(n) {
    if (!n || typeof n !== 'object' || !ID.test(String(n.id || ''))) return null;
    const url = str(n.url, 200);
    if (!/^\/[a-z0-9/_-]*$/.test(url)) return null;
    const deleted = n.deleted === true;
    const rec = {
      id: n.id, url,
      title: str(n.title, 200),
      kind: n.kind === 'book' ? 'book' : 'article',
      color: COLORS.indexOf(n.color) > -1 ? n.color : 'y',
      quote: deleted ? '' : str(n.quote, 3000),
      prefix: deleted ? '' : str(n.prefix, 40),
      suffix: deleted ? '' : str(n.suffix, 40),
      pos: deleted ? 0 : int(n.pos),
      note: deleted ? '' : str(n.note, 2000),
      tags: deleted ? [] : cleanTags(n.tags),
      created: int(n.created),
      updated: int(n.updated),
      deleted
    };
    if (!deleted && !rec.quote) return null;
    return rec;
  }

  // What Firestore stores for a note (no id: that is the document's name).
  function toDoc(n) {
    const d = Object.assign({}, n);
    delete d.id;
    return d;
  }

  /* The device's copy and the account's copy, merged: each note's newer version wins. Returns the merged list and the
     notes the account needs (newer on the device, or not there at all). */
  function merge(local, remote) {
    const byId = {};
    (remote || []).forEach((r) => { const c = clean(r); if (c) byId[c.id] = c; });
    const upload = [];
    (local || []).slice(0, MAX_NOTES).forEach((l) => {
      const c = clean(l);
      if (!c) return;
      const have = byId[c.id];
      if (!have || c.updated > have.updated) {
        if (!have && c.deleted) return;   // deleted before it ever reached the account: nothing to store
        byId[c.id] = c;
        upload.push(c);
      }
    });
    return { notes: Object.keys(byId).map((k) => byId[k]), upload };
  }

  // A note edited or deleted here on Learning: a new version, so it wins on every device.
  function edit(n, change, now) {
    const t = Math.max(int(now) || Date.now(), int(n.updated) + 1);
    if (change === 'delete') return clean({ id: n.id, url: n.url, title: n.title, kind: n.kind, created: n.created, updated: t, deleted: true });
    return clean(Object.assign({}, n, change, { updated: t }));
  }

  const live = (list) => (list || []).filter((n) => n && !n.deleted);

  // For the page: grouped by the page they were made on, the most recently touched page first, and in reading order
  // within a page. Filtered by a search, a tag and a kind ('all', 'article', 'book').
  function view(list, opts) {
    const o = opts || {};
    const q = String(o.q || '').trim().toLowerCase();
    let notes = live(list);
    if (o.kind && o.kind !== 'all') notes = notes.filter((n) => n.kind === o.kind);
    if (o.tag) notes = notes.filter((n) => (n.tags || []).indexOf(o.tag) > -1);
    if (q) notes = notes.filter((n) => (n.quote + ' ' + n.note + ' ' + n.title + ' ' + (n.tags || []).join(' ')).toLowerCase().indexOf(q) > -1);
    const groups = {};
    notes.forEach((n) => {
      const g = groups[n.url] || (groups[n.url] = { url: n.url, title: n.title || n.url, kind: n.kind, latest: 0, notes: [] });
      g.notes.push(n);
      if (n.updated > g.latest) { g.latest = n.updated; if (n.title) g.title = n.title; }
    });
    return Object.keys(groups).map((k) => groups[k])
      .map((g) => Object.assign(g, { notes: g.notes.sort((a, b) => a.pos - b.pos) }))
      .sort((a, b) => b.latest - a.latest);
  }

  function tagCounts(list) {
    const c = {};
    live(list).forEach((n) => (n.tags || []).forEach((t) => { c[t] = (c[t] || 0) + 1; }));
    return Object.keys(c).sort().map((t) => ({ tag: t, n: c[t] }));
  }

  const pageUrl = (n) => WWW + n.url;
  const openUrl = (n) => WWW + n.url + '#pa-note=' + n.id;

  function toMarkdown(list, date) {
    const out = ['# My notes from Product Advisory', '', 'Exported ' + (date || new Date().toISOString().slice(0, 10)), ''];
    view(list, {}).forEach((g) => {
      out.push('## ' + g.title, '', WWW + g.url, '');
      g.notes.forEach((n) => {
        out.push('> ' + n.quote.replace(/\s*\n+\s*/g, ' '), '');
        if (n.note) out.push(n.note, '');
        if (n.tags.length) out.push(n.tags.map((t) => '#' + t.replace(/\s+/g, '-')).join(' '), '');
      });
    });
    return out.join('\n');
  }

  root.NotesCore = { WWW, ORIGINS, COLORS, COLOR_NAMES, MAX_NOTES, clean, toDoc, merge, edit, live, view, tagCounts, pageUrl, openUrl, toMarkdown };
})(typeof window !== 'undefined' ? window : globalThis);
