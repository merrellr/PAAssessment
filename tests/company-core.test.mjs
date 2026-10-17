// Tests for company-core.js (the team report shared by the owner console and the
// company dashboard).
// Run:  node --experimental-default-type=module tests/company-core.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../company-core.js';

const C = globalThis.CompanyCore;
const here = path.dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const NOW = Date.parse('2026-10-13T12:00:00.000Z');
const DAY = 86400000;
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();

console.log('--- lesson counts match the real course files ---');
{
  const dir = path.join(here, '..', 'content');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'framework-data.js');
  t('every course file has an entry (28 courses)', files.length === 28 && files.length === Object.keys(C.LESSON_COUNTS).length, files.length + ' files');
  files.forEach(f => {
    const id = f.replace(/\.js$/, '');
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const i = text.indexOf('lessons:');
    const n = (text.slice(i).match(/^\s{4}\{\s*\r?\n\s{6}id:\s*\d+/gm) || []).length;
    t(id + ' has ' + C.LESSON_COUNTS[id] + ' lessons', n === C.LESSON_COUNTS[id], 'file has ' + n);
  });
}

console.log('--- which courses are assigned ---');
{
  const none = C.assignedCourses(null);
  t('no assessment means no assigned courses', none.length === 0);
  const low = C.assignedCourses({ categoryPct: {} });
  t('everything at the bottom level is assigned all 4 levels in all 7 areas (28)', low.length === 28);
  const mixed = C.assignedCourses({ categoryPct: { discovery: 80, strategy: 60, prioritization: 30, execution: 10, stakeholder: 51, aiIndividual: 25, aiOrg: 76 } });
  const ids = mixed.map(c => c.id);
  t('advanced in an area leaves only the advanced course', ids.filter(i => i.startsWith('discovery-')).join() === 'discovery-advanced');
  t('"experienced" leaves experienced and advanced', ids.filter(i => i.startsWith('strategy-')).join() === 'strategy-experienced,strategy-advanced');
  t('exactly 25 is still the bottom level, 25.01 is not', C.assignedCourses({ categoryPct: { aiIndividual: 25 } }).filter(c => c.domain === 'aiIndividual').length === 4
    && C.assignedCourses({ categoryPct: { aiIndividual: 25.01 } }).filter(c => c.domain === 'aiIndividual').length === 3);
  t('each assigned course carries its real lesson count', mixed.find(c => c.id === 'stakeholder-experienced').lessons === 4);
}

console.log('--- lessons done ---');
{
  const courses = { 'discovery-novice': { completed: [1, 2, 2, 9, 'x', 0, 3] } };
  t('duplicates, lessons that do not exist and junk are not counted', C.lessonsDone(courses, 'discovery-novice') === 3);
  t('an untouched course is 0', C.lessonsDone(courses, 'aiOrg-novice') === 0);
  t('no courses at all is 0', C.lessonsDone(null, 'aiOrg-novice') === 0);
}

console.log('--- a person\'s status ---');
{
  const allDone = {};
  const cat = { discovery: 80, strategy: 80, prioritization: 80, execution: 80, stakeholder: 80, aiIndividual: 80, aiOrg: 80 };
  C.DOMAINS.forEach(d => { allDone[d[0] + '-advanced'] = { completed: [1, 2, 3, 4, 5] }; });

  const none = C.memberProgress(null, NOW - 3 * DAY, NOW);
  t('no record yet: not assessed, nothing to show', none.status === 'not_assessed' && !none.hasShare && !none.assessed && none.planTotal === 0);

  const assessed = C.memberProgress({ identity: { name: 'A', email: 'a@x.com' }, assessment: { tier: 'Moderate Experience', overallPct: 40, categoryPct: { discovery: 40 } }, courses: {}, lastActiveAt: iso(2) }, NOW - 5 * DAY, NOW);
  t('assessed and no lessons yet: "assessed"', assessed.status === 'assessed' && assessed.assessed && assessed.overallPct === 40);
  t('level label comes from the assessment', assessed.tierLabel === 'Moderate Experience' && assessed.tierSlug === 'moderate');

  const learning = C.memberProgress({ identity: { name: 'A', email: 'a@x.com' }, assessment: { tier: 'Limited Experience', overallPct: 10, categoryPct: {} }, courses: { 'discovery-novice': { completed: [1, 2] } }, lastActiveAt: iso(1) }, NOW - 5 * DAY, NOW);
  t('some lessons done: "learning", counted against the plan', learning.status === 'learning' && learning.planDone === 2 && learning.planTotal === Object.values(C.LESSON_COUNTS).reduce((a, b) => a + b, 0));
  t('plan percentage is lessons done over lessons in the plan', learning.planPct === Math.round(2 / learning.planTotal * 100));

  const finished = C.memberProgress({ identity: null, assessment: { tier: 'Advanced Experience', overallPct: 85, categoryPct: cat }, courses: allDone, lastActiveAt: iso(100) }, NOW - 200 * DAY, NOW);
  t('every assigned lesson done: "finished"', finished.status === 'finished' && finished.planPct === 100 && finished.coursesFinished === 7);
  t('finished people are never flagged inactive', finished.inactive === false);
  t('a deleted account is recognised', finished.anonymous === true);

  const lessonsNoAssessment = C.memberProgress({ identity: { name: 'A', email: 'a@x.com' }, assessment: null, courses: { 'aiOrg-novice': { completed: [1] } }, lastActiveAt: iso(1) }, NOW - 5 * DAY, NOW);
  t('lessons without an assessment still count as learning', lessonsNoAssessment.status === 'learning' && lessonsNoAssessment.planTotal === 0 && lessonsNoAssessment.planPct === null);

  const quiet = C.memberProgress({ identity: { name: 'A', email: 'a@x.com' }, assessment: { tier: 'Limited Experience', overallPct: 10, categoryPct: {} }, courses: {}, lastActiveAt: iso(31) }, NOW - 90 * DAY, NOW);
  const recent = C.memberProgress({ identity: { name: 'A', email: 'a@x.com' }, assessment: { tier: 'Limited Experience', overallPct: 10, categoryPct: {} }, courses: {}, lastActiveAt: iso(29) }, NOW - 90 * DAY, NOW);
  t('31 days quiet is inactive, 29 is not', quiet.inactive === true && recent.inactive === false);
  const neverActive = C.memberProgress({ identity: { name: 'A', email: 'a@x.com' }, assessment: null, courses: {}, lastActiveAt: null }, NOW - 45 * DAY, NOW);
  const newJoiner = C.memberProgress(null, NOW - 3 * DAY, NOW);
  t('never active counts from the day they joined', neverActive.inactive === true && newJoiner.inactive === false);
}

console.log('--- team rows and filters ---');
const memberships = [
  { id: 'u1', role: 'admin', status: 'active', displayName: 'Ann Admin', email: 'ann@x.com', joinedAtMs: NOW - 60 * DAY },
  { id: 'u2', role: 'member', status: 'active', displayName: 'Ben', email: 'ben@x.com', joinedAtMs: NOW - 40 * DAY },
  { id: 'u3', role: 'member', status: 'active', displayName: '', email: '', joinedAtMs: NOW - 40 * DAY },
  { id: 'u4', role: 'member', status: 'removed', displayName: 'Old Timer', email: 'old@x.com', joinedAtMs: NOW - 400 * DAY, endedAtMs: NOW - 30 * DAY },
  { id: 'u5', role: 'member', status: 'active', displayName: 'Cy', email: 'cy@x.com', joinedAtMs: NOW - 2 * DAY }
];
const shares = {
  u1: { identity: { name: 'Ann A.', email: 'ann@x.com' }, assessment: { tier: 'Lots of Experience', overallPct: 70, categoryPct: { discovery: 90, strategy: 70, prioritization: 60, execution: 55, stakeholder: 40, aiIndividual: 30, aiOrg: 20 }, answers: [{ n: 1, cat: 'discovery', question: 'Q1?', answer: '=cmd|\' /C calc\'!A0', points: 2 }], submittedAt: iso(20) },
        courses: { 'discovery-advanced': { completed: [1, 2, 3, 4, 5] } }, lastActiveAt: iso(3) },
  u2: { identity: { name: 'Ben B', email: 'ben@x.com' }, assessment: { tier: 'Limited Experience', overallPct: 15, categoryPct: { discovery: 10, strategy: 20, prioritization: 10, execution: 10, stakeholder: 10, aiIndividual: 10, aiOrg: 10 }, answers: [] , submittedAt: iso(50) },
        courses: {}, lastActiveAt: iso(45) },
  u3: { identity: null, assessment: { tier: 'Moderate Experience', overallPct: 40, categoryPct: { discovery: 40, strategy: 40, prioritization: 40, execution: 40, stakeholder: 40, aiIndividual: 40, aiOrg: 40 }, answers: [] }, courses: { 'discovery-moderate': { completed: [1] } }, lastActiveAt: iso(5) },
  u4: { identity: { name: 'Old Timer', email: 'old@x.com' }, assessment: null, courses: {}, lastActiveAt: iso(200) }
};
const rows = C.buildTeamRows(memberships, shares, NOW);
t('one row per membership', rows.length === 5);
t('the name on the shared record wins over the membership name', rows[0].name === 'Ann A.');
t('a deleted account with nothing left is marked', rows[2].removedIdentity === true && rows[2].name === '');
t('removed people are marked removed', rows[3].status === 'removed');
t('someone with no shared record yet still gets a row', rows[4].progress.status === 'not_assessed' && !rows[4].progress.hasShare);

const active = rows.filter(r => r.status === 'active');
t('search matches name or email', C.filterTeamRows(active, 'BEN', 'all').length === 1 && C.filterTeamRows(active, 'x.com', 'all').length === 3);
t('filter by status', C.filterTeamRows(active, '', 'learning').length === 2 && C.filterTeamRows(active, '', 'not_assessed').length === 1);
t('filter by inactive', C.filterTeamRows(active, '', 'inactive').length === 1 && C.filterTeamRows(active, '', 'inactive')[0].id === 'u2');

console.log('--- roll-up ---');
{
  const r = C.rollup(active);
  t('people, assessed and not assessed add up', r.people === 4 && r.assessed === 3 && r.notAssessed === 1);
  t('learning, assessed-not-started and finished counts', r.learning === 2 && r.assessedNotStarted === 1 && r.finished === 0);
  t('inactive count', r.inactive === 1);
  t('level distribution is by overall score', same(r.byTier.map(b => b.count), [1, 1, 1, 0]));
  t('average overall is over assessed people only', r.avgOverall === Math.round((70 + 15 + 40) / 3));
  const disc = r.domains.find(d => d.key === 'discovery');
  t('area averages use only people with a score', disc.n === 3 && disc.avg === Math.round((90 + 10 + 40) / 3));
  t('strongest and weakest areas are found', r.strongest.key === 'discovery' && r.weakest.key === 'aiOrg');
  const empty = C.rollup([]);
  t('an empty team has no averages and no crash', empty.people === 0 && empty.avgOverall === null && empty.weakest === null && empty.domains.every(d => d.avg === null));
}

console.log('--- focus areas ---');
{
  const std = C.DEFAULT_FOCUS_ORDER;
  t('the standard order is the framework order, all seven', std.join() === 'discovery,strategy,prioritization,execution,stakeholder,aiIndividual,aiOrg');
  t('the standard order is NOT a customised ranking (so it changes nothing)', C.focusIsCustom(std) === false);
  t('an empty list is not customised either', C.focusIsCustom([]) === false && C.focusIsCustom(null) === false && C.focusIsCustom(undefined) === false);
  t('any other order is customised', C.focusIsCustom(['aiOrg']) === true && C.focusIsCustom(std.slice().reverse()) === true);
  t('rank 0 is the top; unranked areas come after every ranked one', C.focusRank(['b', 'a'], 'b') === 0 && C.focusRank(['b', 'a'], 'a') === 1 && C.focusRank(['b', 'a'], 'zzz') === 99 && C.focusRank(null, 'a') === 99);
  t('moving, adding and removing keep the list valid', same(C.moveItem(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c']) && same(C.moveItem(['a'], 0, -1), ['a']));
  t('placing an area puts it where asked and never duplicates it', same(C.placeFocus(['discovery', 'strategy'], 'aiOrg', 1), ['discovery', 'aiOrg', 'strategy']) && same(C.placeFocus(['discovery', 'strategy'], 'strategy', 0), ['strategy', 'discovery']));
  t('an unknown area cannot be placed', same(C.placeFocus(['discovery'], 'nope', 0), ['discovery']));
  t('areas not in the list are offered back', same(C.availableFocus(['discovery', 'aiOrg']), ['strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual']));
  t('removing drops just that area', same(C.removeFocus(['discovery', 'aiOrg'], 'aiOrg'), ['discovery']));

  const fp = C.focusProgress(active, ['aiOrg', 'discovery', 'strategy', 'prioritization']);
  t('progress is listed in the company\'s order with ranks', same(fp.areas.map(a => a.key + ':' + a.rank), ['aiOrg:1', 'discovery:2', 'strategy:3', 'prioritization:4']));
  const disc = fp.areas.find(a => a.key === 'discovery');
  // Ann: discovery-advanced, 5 of 5 done. Ben: all four discovery levels, 21 lessons, 0 done. The deleted account: moderate and up, 16 lessons, 1 done.
  t('lessons done and assigned are added up over assessed people only', disc.total === 5 + 21 + 16 && disc.done === 5 + 0 + 1, JSON.stringify(disc));
  t('area percentage', disc.pct === Math.round(6 / 42 * 100));
  t('the headline figure covers the top three ranked areas only', same(fp.top.keys, ['aiOrg', 'discovery', 'strategy']) && fp.top.done === fp.areas.slice(0, 3).reduce((s, a) => s + a.done, 0) && fp.top.total === fp.areas.slice(0, 3).reduce((s, a) => s + a.total, 0));
  t('it is flagged as customised', fp.custom === true);
  t('people who have not taken the assessment are not counted', fp.assessed === 3);
  const none = C.focusProgress([], ['discovery']);
  t('with nobody assessed there is no percentage and no crash', none.top.pct === null && none.areas[0].pct === null);
  t('with no priorities there is nothing to report', C.focusProgress(active, []).areas.length === 0 && C.focusProgress(active, []).top.pct === null);
}

console.log('--- spreadsheet exports ---');
{
  const csv = C.buildTeamCsv(rows);
  const lines = csv.split('\r\n');
  t('team CSV has a header plus one line per person', lines.length === 6 && lines[0].startsWith('Name,Email,Role,Status'));
  t('team CSV marks admins and former members', lines[1].includes(',Admin,') && lines[4].includes('Former member'));
  const answers = C.buildAnswersCsv(rows);
  t('answers CSV lists each answer', answers.split('\r\n').length === 2);
  t('a formula in an answer cannot run when the file is opened', answers.includes("'=cmd") && !/(^|,)=cmd/.test(answers));
  t('plain numbers and phone numbers are not altered', C.csvCell('-12.5') === '-12.5' && C.csvCell('+1 (555) 010-0100') === '+1 (555) 010-0100' && C.csvCell(42) === '42');
  t('commas, quotes and line breaks are quoted', C.csvCell('a,b') === '"a,b"' && C.csvCell('say "hi"') === '"say ""hi"""' && C.csvCell('a\nb') === '"a\nb"');
  t('names starting with @ or - are neutralised', C.csvCell('@evil') === "'@evil" && C.csvCell('-cmd') === "'-cmd");
}

console.log('--- invite helpers (moved here from the owner console) ---');
{
  const p = C.parseInviteLines('Email,Name,Phone\nJane@Acme.com, Jane, 555\nbad line\njane@acme.com\nSam Lee, sam@acme.com');
  t('header skipped, case folded, duplicates and junk reported', p.entries.length === 2 && p.errors.length === 2 && p.entries[0].email === 'jane@acme.com');
  t('"name, email" order is understood', p.entries[1].email === 'sam@acme.com' && p.entries[1].name === 'Sam Lee');
  const c = C.classifyInvites(p.entries, ['jane@acme.com'], []);
  t('people already in the company are skipped', c.toCreate.length === 1 && c.skipped.length === 1);
  t('an invite past its date is expired', C.inviteStatus({ status: 'open', expiresAtMs: NOW - 1 }, NOW) === 'expired' && C.inviteStatus({ status: 'open', expiresAtMs: NOW + 1 }, NOW) === 'open');
  t('seats warn but never block', C.seatInfo({ plan: 'seat', seatLimit: 3 }, 2, 1, 1).wouldExceed === true && C.seatInfo({ plan: 'flat' }, 99, 9, 9).wouldExceed === false);
  t('course names read well', C.prettyCourseId('aiOrg-moderate') === 'AI Fluency — Organizational · Moderate Experience');
  t('tokens are 32 hex characters and differ', /^[0-9a-f]{32}$/.test(C.randomToken()) && C.randomToken() !== C.randomToken());
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
