// Tests for styles-org-core.js (sharing DISC Work Styles inside a company).   Run:  node tests/styles-org-core.test.mjs
import fs from 'fs';
globalThis.window = globalThis;
eval(fs.readFileSync(new URL('../styles-org-core.js', import.meta.url), 'utf8'));
const O = globalThis.StylesOrgCore;
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };
const raw = { mode: 'team', teams: {
  prod: { name: '  Product   team ', members: ['ann', 'bob', 'bob', 'gone'], sees: ['eng', 'prod', 'nope'] },
  eng: { name: 'Engineering', members: ['cat', 'dan'], sees: [] },
  des: { name: 'Design', members: ['eve', 'ann'], sees: ['prod'] },
  blank: { name: '   ', members: ['ann'] }, 'bad id!': { name: 'X', members: [] } } };
const c = O.clean(raw, ['ann', 'bob', 'cat', 'dan', 'eve']);
t('clean: names tidied, repeats and people outside the company dropped, unnamed and odd teams dropped', c.mode === 'team' && c.teams.prod.name === 'Product team' && c.teams.prod.members.join() === 'ann,bob' && !c.teams.blank && !c.teams['bad id!']);
t('clean: a team sees only real other teams', c.teams.prod.sees.join() === 'eng' && c.teams.des.sees.join() === 'prod');
t('clean: an unknown mode is "not shared"', O.clean({ mode: 'everybody' }).mode === 'none');
const v = O.viewers(c);
t('viewers: your own team', v.bob.includes('ann') && !v.bob.includes('bob'));
t('viewers: and the teams your team may see', v.ann.includes('cat') && v.bob.includes('dan'));
t('viewers: not the other way round (Engineering does not see Product)', !v.cat.includes('ann') && v.cat.join() === 'dan');
t('viewers: someone in two teams sees both', v.ann.includes('eve') && v.ann.includes('cat'));
t('viewers: Design sees Product as well as itself', v.eve.includes('bob') && v.eve.includes('ann'));
t('teams of a person', O.teamsOf(c, 'ann').sort().join() === 'des,prod' && O.teamsOf(c, 'zed').length === 0);
t('sharing: the company decides in team and all modes; by choice in optional; never in none', O.shouldShare('team') && O.shouldShare('all') && O.shouldShare('optional', true) && !O.shouldShare('optional', false) && !O.shouldShare('none', true));
t('removing your own: only where it is your choice', O.canUnshare('optional') && O.canUnshare('none') && !O.canUnshare('team') && !O.canUnshare('all'));
t('the notice says who can see it: your team, and the teams that may see it', /your team \(Engineering\), Product team and its admins/.test(O.audience(c, 'cat', 'Acme')) && /your team \(Product team\), Design and its admins/.test(O.audience(c, 'bob', 'Acme')), O.audience(c, 'cat', 'Acme'));
t('the notice for each mode', /private to you/.test(O.audience({ mode: 'none' }, 'x', 'Acme')) && /Everyone in Acme/.test(O.audience({ mode: 'all' }, 'x', 'Acme')) && /You choose/.test(O.audience({ mode: 'optional' }, 'x', 'Acme')) && /not in a team yet/.test(O.audience(c, 'zed', 'Acme')));
const rec = O.shareRecord({ scores: { d: 75.4, i: 120, s: -3, c: 'x' }, primary: 'd', secondary: 'i', answers: { ws1: {} } }, 'Ann');
t('the company copy: name and scores only, kept in range, never the answers', rec.name === 'Ann' && rec.scores.d === 75 && rec.scores.i === 100 && rec.scores.s === 0 && rec.scores.c === 0 && !('answers' in rec) && Object.keys(rec).sort().join() === 'name,primary,scores,secondary');
t('no style, no copy', O.shareRecord({ scores: {} }, 'x') === null);
t('team ids', /^t[a-z0-9]{9}$/.test(O.newTeamId()));
// W3: names, grants, requests
const cn = O.clean(Object.assign({}, raw, { names: { ann: '  Ann  A ', bob: 'Bob', zed: 'Not in a team' } }), ['ann', 'bob', 'cat', 'dan', 'eve']);
t('names are kept only for people in teams, tidied', cn.names.ann === 'Ann A' && cn.names.bob === 'Bob' && !cn.names.zed);
const vg = O.viewers(c, [{ viewer: 'cat', subjects: ['ann', 'cat'] }, { viewer: 'zed', subjects: ['bob'] }]);
t('grants add to who someone may see (never themselves), even outside any team', vg.cat.join() === 'ann,dan' && vg.zed.join() === 'bob');
const rq = O.cleanRequest({ kind: 'team', targetId: 'eng', targetName: '  Engineering ', reason: '  We   start a joint project next week  ', extra: 1 });
t('a request: tidied, only its own fields', rq.kind === 'team' && rq.targetName === 'Engineering' && rq.reason === 'We start a joint project next week' && Object.keys(rq).sort().join() === 'kind,reason,targetId,targetName');
t('a request needs someone and a reason', O.requestProblems(O.cleanRequest({ reason: 'x' })).length === 2 && O.requestProblems(rq).length === 0);
t('approving a team request covers its members now, not the asker', O.subjectsFor(c, { kind: 'team', targetId: 'prod' }, 'ann').join() === 'bob' && O.subjectsFor(c, { kind: 'person', targetId: 'eve' }, 'cat').join() === 'eve' && O.subjectsFor(c, { kind: 'person', targetId: 'cat' }, 'cat').length === 0);
const rb = O.requestable(cn, 'cat', ['dan']);
t('what a member can ask for: teams with someone they can\'t see, and named people they can\'t see', rb.teams.map(x => x.name).sort().join() === 'Design,Product team' && rb.people.map(x => x.name).join() === 'Ann A,Bob');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
