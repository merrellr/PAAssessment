// Tests for notes-core.js (My notes: highlights and notes from www).   Run:  node tests/notes-core.test.mjs
import '../notes-core.js';
const N = globalThis.NotesCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

const note = (o) => Object.assign({ id: 'abc123', url: '/insights/five-second-test', title: 'The five-second test', kind: 'article', color: 'g',
  quote: 'Customers glance', prefix: 'Real ', suffix: ' at pricing', pos: 120, note: 'Use in onboarding', tags: ['Pricing', 'pricing', ' UX  team '],
  created: 1000, updated: 2000 }, o || {});

console.log('--- a note as stored ---');
const c = N.clean(note());
t('exactly the fields the rules allow', JSON.stringify(Object.keys(N.toDoc(c))) === '["url","title","kind","color","quote","prefix","suffix","pos","note","tags","created","updated","deleted"]');
t('tags are trimmed, lower case and not repeated', c.tags.join('|') === 'pricing|ux team');
t('only our own kind of id', N.clean(note({ id: '../x' })) === null && N.clean(note({ id: 'AB' })) === null);
t('only a page address on www, nothing else', N.clean(note({ url: 'https://evil.com/x' })) === null && N.clean(note({ url: '/insights/<b>' })) === null);
t('an unknown colour becomes yellow', N.clean(note({ color: 'red' })).color === 'y');
t('long text is cut to what the rules allow', N.clean(note({ quote: 'q'.repeat(5000), note: 'n'.repeat(5000), prefix: 'p'.repeat(90) })).quote.length === 3000 && N.clean(note({ note: 'n'.repeat(5000) })).note.length === 2000);
t('no more than ten tags', N.clean(note({ tags: Array.from({ length: 20 }, (_, i) => 't' + i) })).tags.length === 10);
t('a highlight needs its words', N.clean(note({ quote: '' })) === null);
const del = N.clean(note({ deleted: true }));
t('a deleted note keeps none of its words', del && del.deleted === true && del.quote === '' && del.note === '' && del.tags.length === 0);

console.log('--- merging the device and the account ---');
const remote = [note({ id: 'aaaaaa', updated: 5000, note: 'account' }), note({ id: 'bbbbbb', updated: 1000, note: 'old' })];
const local = [note({ id: 'aaaaaa', updated: 4000, note: 'device' }), note({ id: 'bbbbbb', updated: 3000, note: 'newer' }), note({ id: 'cccccc', updated: 10 }), note({ id: 'dddddd', deleted: true, updated: 9 })];
const m = N.merge(local, remote);
const by = Object.fromEntries(m.notes.map((n) => [n.id, n]));
t('the newer edit wins either way', by.aaaaaa.note === 'account' && by.bbbbbb.note === 'newer');
t('a note only on the device is added', !!by.cccccc);
t('only what the account lacks is uploaded', m.upload.map((n) => n.id).sort().join() === 'bbbbbb,cccccc');
t('a note deleted before it was ever synced is not uploaded', !by.dddddd);
const gone = N.merge([note({ id: 'aaaaaa', deleted: true, updated: 9000 })], remote);
t('a deletion on the device reaches the account', gone.upload.length === 1 && gone.upload[0].deleted === true);
t('junk from the page is ignored', N.merge([null, 5, { id: 'x' }, note({ url: 'javascript:x' })], []).notes.length === 0);

console.log('--- editing here ---');
const e = N.edit(c, { note: 'changed', tags: ['A'] }, 100);
t('an edit here is newer than the last one, even with a slow clock', e.note === 'changed' && e.tags[0] === 'a' && e.updated === 2001);
const d = N.edit(c, 'delete', 9999);
t('deleting here leaves a marker', d.deleted === true && d.updated === 9999 && d.quote === '');

console.log('--- the page ---');
const list = [note({ id: 'pppp01', url: '/books/playbook/x', title: 'Chapter X', kind: 'book', pos: 50, updated: 10, tags: ['strategy'] }),
  note({ id: 'pppp02', url: '/books/playbook/x', title: 'Chapter X', kind: 'book', pos: 5, updated: 20 }),
  note({ id: 'pppp03', updated: 15 }), N.edit(note({ id: 'pppp04' }), 'delete', 30)].map(N.clean);
const v = N.view(list, {});
t('grouped by page, the most recently touched first, in reading order', v.length === 2 && v[0].url === '/books/playbook/x' && v[0].notes.map((n) => n.id).join() === 'pppp02,pppp01');
t('deleted notes are not shown', !v.some((g) => g.notes.some((n) => n.id === 'pppp04')));
t('filters: kind, tag and search', N.view(list, { kind: 'article' }).length === 1 && N.view(list, { tag: 'strategy' })[0].notes.length === 1 && N.view(list, { q: 'ONBOARD' }).length === 2 && N.view(list, { q: 'zzz' }).length === 0);
t('tag counts', JSON.stringify(N.tagCounts(list)) === JSON.stringify([{ tag: 'pricing', n: 2 }, { tag: 'strategy', n: 1 }, { tag: 'ux team', n: 2 }]));
t('links go back to the place on www', N.openUrl(c) === 'https://www.productadvisory.co/insights/five-second-test#pa-note=abc123');
const md = N.toMarkdown(list, '2026-11-21');
t('the export is plain Markdown with each page, quote, note and tags', /^# My notes from Product Advisory/.test(md) && md.indexOf('## Chapter X') > -1 && md.indexOf('> Customers glance') > -1 && md.indexOf('#ux-team') > -1 && md.indexOf('Exported 2026-11-21') > -1);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
