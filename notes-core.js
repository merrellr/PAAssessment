/* My notes: highlights, notes and tags, wherever they were made:
     on www.productadvisory.co   Product+ articles and the book (kind 'article' or 'book')
     in Learning                 lessons (kind 'lesson', highlighted with notes-ui.js on lesson.html) and
                                 saved toolkit work (kind 'tool': a note with no quote, on my-tools.html)
   The parts with no Firebase in them, so they can be tested on their own (tests/notes-core.test.mjs).

   On www, assets/js/notes.js keeps the notes in the browser. When the reader is signed in here, it sends them to
   notes-bridge.html (a hidden frame on www) which merges them with the copy in Firestore, readerNotes/{uid}/items/{id},
   and sends the merged set back. my-notes.html lists, edits and exports them.

   A note: { id, url, title, kind, color, quote, prefix, suffix, pos, note, tags, created, updated, deleted }.
   url is the page's address: on www for articles and the book, here for lessons (/lesson?course=…&lesson=…) and
   toolkit work (/my-tools?open=<id>).
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
  const KINDS = ['article', 'book', 'lesson', 'tool'];
  const URL_OK = /^\/[a-z0-9/_-]*(\?[A-Za-z0-9=&_-]*)?$/;   // the same pattern as firestore.rules
  // My notes' categories
  const CATEGORIES = [['all', 'All'], ['insights', 'Insights'], ['learning', 'My Learning'], ['tools', 'My Toolkits']];
  const CATEGORY_OF = { article: 'insights', book: 'insights', lesson: 'learning', tool: 'tools' };
  const KIND_LABEL = { article: 'Article', book: 'Book', lesson: 'Lesson', tool: 'Toolkit' };
  const onWww = (kind) => kind === 'article' || kind === 'book';

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
    if (!URL_OK.test(url)) return null;
    const deleted = n.deleted === true;
    const rec = {
      id: n.id, url,
      title: str(n.title, 200),
      kind: KINDS.indexOf(n.kind) > -1 ? n.kind : 'article',
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
    // a highlight needs its words; a toolkit note (no quote) needs its note
    if (!deleted && (rec.kind === 'tool' ? !rec.note.trim() : !rec.quote)) return null;
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
  // within a page. Filtered by a search, a tag, a category ('all', 'insights', 'learning', 'tools') and a kind.
  function view(list, opts) {
    const o = opts || {};
    const q = String(o.q || '').trim().toLowerCase();
    let notes = live(list);
    if (o.category && o.category !== 'all') notes = notes.filter((n) => CATEGORY_OF[n.kind] === o.category);
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

  function categoryCounts(list) {
    const c = { all: 0, insights: 0, learning: 0, tools: 0 };
    live(list).forEach((n) => { c.all++; c[CATEGORY_OF[n.kind]]++; });
    return c;
  }

  // Where a note lives: www for articles and the book, this site for lessons and toolkit work.
  const pageUrl = (n) => (onWww(n.kind) ? WWW : '') + n.url;
  const openUrl = (n) => pageUrl(n) + (n.kind === 'tool' ? '' : '#pa-note=' + n.id);

  // The notes on one page, in reading order (or newest first for toolkit notes, which have no place in a text).
  function onPage(list, url) {
    return live(list).filter((n) => n.url === url).sort((a, b) => (a.kind === 'tool' ? b.updated - a.updated : a.pos - b.pos));
  }
  function countByUrl(list) {
    const c = {};
    live(list).forEach((n) => { c[n.url] = (c[n.url] || 0) + 1; });
    return c;
  }
  const newest = (list, k) => live(list).slice().sort((a, b) => b.updated - a.updated).slice(0, k || 3);

  /* Reading and writing an account's notes in Firestore. `fb` is { db, collection, getDocs, doc, setDoc, serverTimestamp }
     from the page's own Firebase imports (so this file stays free of them). */
  function store(fb, uid) {
    const col = () => fb.collection(fb.db, 'readerNotes', uid, 'items');
    return {
      async all() {
        const snap = await fb.getDocs(col());
        return snap.docs.map((d) => clean(Object.assign({ id: d.id }, d.data()))).filter(Boolean);
      },
      async save(n) {
        const c = clean(n);
        if (!c) throw new Error('not a note');
        await fb.setDoc(fb.doc(fb.db, 'readerNotes', uid, 'items', c.id), Object.assign(toDoc(c), { savedAt: fb.serverTimestamp() }));
        return c;
      }
    };
  }
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function toMarkdown(list, date) {
    const out = ['# My notes from Product Advisory', '', 'Exported ' + (date || new Date().toISOString().slice(0, 10)), ''];
    view(list, {}).forEach((g) => {
      const abs = (onWww(g.kind) ? WWW : 'https://assessment.productadvisory.co') + g.url;
      out.push('## ' + g.title + ' (' + KIND_LABEL[g.kind] + ')', '', abs, '');
      g.notes.forEach((n) => {
        if (n.quote) out.push('> ' + n.quote.replace(/\s*\n+\s*/g, ' '), '');
        if (n.note) out.push(n.note, '');
        if (n.tags.length) out.push(n.tags.map((t) => '#' + t.replace(/\s+/g, '-')).join(' '), '');
      });
    });
    return out.join('\n');
  }

  root.NotesCore = { WWW, ORIGINS, COLORS, COLOR_NAMES, MAX_NOTES, KINDS, CATEGORIES, CATEGORY_OF, KIND_LABEL, clean, toDoc, merge, edit, live, view,
    tagCounts, categoryCounts, pageUrl, openUrl, onPage, countByUrl, newest, store, newId, toMarkdown };
})(typeof window !== 'undefined' ? window : globalThis);
