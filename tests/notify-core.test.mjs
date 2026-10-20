// Tests for notify-core.js (email check-ins and the admin's report).
// Run:  node --experimental-default-type=module tests/notify-core.test.mjs
import '../company-core.js';
import '../company-report.js';
import '../notify-core.js';
import fs from 'node:fs';
import { renderNotifyGs } from '../tools/build-notify-gs.mjs';

const C = globalThis.CompanyCore;
const N = globalThis.NotifyCore;

let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

const PDT = -420;                                       // Pacific daylight time
const DAY = 86400000;
const at = (s) => Date.parse(s);                        // an ISO moment
// Wednesday 2026-10-21, 09:30 Pacific
const WED = at('2026-10-21T16:30:00Z');
// Monday 2026-10-19, 08:15 Pacific, and 07:15 (before the send hour)
const MON = at('2026-10-19T15:15:00Z');
const MON_EARLY = at('2026-10-19T14:15:00Z');

/* ---------------- preferences */
t('no settings means a weekly check-in and a weekly report', JSON.stringify(N.prefsOf({})) === JSON.stringify({ checkin: 'weekly', orgReport: 'weekly', goals: { weeklyLessons: 2, focus: [] } }));
t('a chosen frequency is kept, an unknown one becomes weekly', N.prefsOf({ notify: { checkin: 'daily', orgReport: 'off' } }).checkin === 'daily' && N.prefsOf({ notify: { orgReport: 'off' } }).orgReport === 'off' && N.normalizeFreq('hourly') === 'weekly');
t('the weekly goal is a whole number from 1 to 10', N.normalizeGoals({ weeklyLessons: 0 }).weeklyLessons === 1 && N.normalizeGoals({ weeklyLessons: 99 }).weeklyLessons === 10 && N.normalizeGoals({ weeklyLessons: '3.4' }).weeklyLessons === 3 && N.normalizeGoals({ weeklyLessons: 'x' }).weeklyLessons === 2);
t('focus areas: known keys only, no repeats, at most three', JSON.stringify(N.normalizeGoals({ focus: ['aiOrg', 'nope', 'aiOrg', 'strategy', 'discovery', 'execution'] }).focus) === '["aiOrg","strategy","discovery"]');

/* ---------------- dates */
t('local date key uses the offset', N.dateKey(at('2026-10-20T03:00:00Z'), PDT) === '2026-10-19' && N.dateKey(at('2026-10-20T03:00:00Z'), 0) === '2026-10-20');
t('the week starts on Monday at local midnight', N.periodStart('weekly', WED, PDT) === at('2026-10-19T07:00:00Z'));
t('a Sunday belongs to the week that started the Monday before', N.periodStart('weekly', at('2026-10-25T20:00:00Z'), PDT) === at('2026-10-19T07:00:00Z'));
t('the month starts on the 1st', N.periodStart('monthly', WED, PDT) === at('2026-10-01T07:00:00Z'));
t('the day starts at local midnight', N.periodStart('daily', WED, PDT) === at('2026-10-21T07:00:00Z'));
{
  const w = N.reportWindow('weekly', MON, PDT);
  t('the Monday email looks back on last week', w.from === at('2026-10-12T07:00:00Z') && w.to === at('2026-10-19T07:00:00Z') && w.label === 'last week' && w.next === 'this week');
  const d = N.reportWindow('daily', WED, PDT);
  t('the daily email looks back on yesterday', d.from === at('2026-10-20T07:00:00Z') && d.to === at('2026-10-21T07:00:00Z') && d.label === 'yesterday');
  const m = N.reportWindow('monthly', WED, PDT);
  t('the monthly email looks back on last month', m.from === at('2026-09-01T07:00:00Z') && m.to === at('2026-10-01T07:00:00Z') && m.label === 'last month');
  const jan = N.reportWindow('monthly', at('2027-01-02T18:00:00Z'), PDT);
  t('in January, last month is December of the year before', jan.from === at('2026-12-01T07:00:00Z'), new Date(jan.from).toISOString());
}

/* ---------------- when an email is due */
t('weekly: due on Monday from 8am when the last one went out the week before', N.isDue('weekly', at('2026-10-12T15:00:00Z'), MON, PDT));
t('weekly: not before 8am', !N.isDue('weekly', at('2026-10-12T15:00:00Z'), MON_EARLY, PDT));
t('weekly: not twice in a week', !N.isDue('weekly', MON, WED, PDT));
t('weekly: one missed on Monday (daily limit) goes out the next run', N.isDue('weekly', at('2026-10-12T15:00:00Z'), WED, PDT));
t('a brand-new account waits for the next period', !N.isDue('weekly', at('2026-10-20T18:00:00Z'), WED, PDT));
t('an account with no record at all is due (existing users get the email)', N.isDue('weekly', 0, WED, PDT));
t('daily: due once a day', N.isDue('daily', at('2026-10-20T16:00:00Z'), WED, PDT) && !N.isDue('daily', at('2026-10-21T15:10:00Z'), WED, PDT));
t('monthly: due once a month', N.isDue('monthly', at('2026-09-01T16:00:00Z'), WED, PDT) && !N.isDue('monthly', at('2026-10-01T16:00:00Z'), WED, PDT));
t('off is never due, nor an unknown frequency', !N.isDue('off', 0, WED, PDT) && !N.isDue('hourly', 0, WED, PDT));

/* ---------------- lesson log */
{
  let log = N.logLesson({}, at('2026-10-20T18:00:00Z'), PDT);
  log = N.logLesson(log, at('2026-10-20T19:00:00Z'), PDT);
  log = N.logLesson(log, at('2026-10-14T18:00:00Z'), PDT);
  t('lessons are counted by local day', log['2026-10-20'] === 2 && log['2026-10-14'] === 1);
  const old = N.logLesson({ '2024-01-01': 3, 'junk': 9 }, at('2026-10-20T18:00:00Z'), PDT);
  t('old days and junk keys are dropped', !('2024-01-01' in old) && !('junk' in old) && old['2026-10-20'] === 1);
  t('lessons between two moments', N.lessonsBetween(log, at('2026-10-19T07:00:00Z'), at('2026-10-26T07:00:00Z'), PDT) === 2 && N.lessonsBetween(log, at('2026-10-12T07:00:00Z'), at('2026-10-19T07:00:00Z'), PDT) === 1);
  const w = N.weekSoFar({ lessonLog: log, goals: { weeklyLessons: 3 } }, WED, PDT);
  t('this week so far, for the dashboard', w.done === 2 && w.target === 3 && w.pct === 67);
}
t('the goal for a period follows the weekly goal', N.targetFor('weekly', 3) === 3 && N.targetFor('daily', 3) === 1 && N.targetFor('daily', 10) === 2 && N.targetFor('monthly', 3) === 12);

/* ---------------- the learner's check-in */
const cat = (o) => Object.assign({ discovery: 30, strategy: 60, prioritization: 80, execution: 45, stakeholder: 70, aiIndividual: 20, aiOrg: 55 }, o || {});
const LINKS = { site: 'https://assessment.productadvisory.co/', settings: 'https://s/settings', unsubscribe: 'https://s/off' };
function mk(progress, over){
  return N.checkin(Object.assign({ name: 'Jane Doe', progress: progress, assessment: { categoryPct: cat() }, freq: 'weekly', nowMs: MON, offsetMin: PDT, links: LINKS }, over || {}));
}
{
  const lastWeek = { '2026-10-13': 1, '2026-10-16': 2 };
  const m = mk({ goals: { weeklyLessons: 3, focus: ['aiIndividual'] }, lessonLog: lastWeek, courses: {} });
  t('goal hit: says so, counts last week only', m.status === 'on_track' && m.done === 3 && m.target === 3 && /You hit your goal last week: 3 of 3 lessons/.test(m.headline), m.headline);
  t('subject gives the count', m.subject === 'Your weekly check-in: 3 of 3 lessons last week', m.subject);
  t('greets by first name', m.greeting === 'Hi Jane,');
  t('focus areas show plan progress in that area', m.focus.length === 1 && m.focus[0].label === 'AI Fluency — Individual' && m.focus[0].total === 21 && m.focus[0].done === 0, JSON.stringify(m.focus));
  t('next lesson comes from the first focus area, lowest level first', m.next && m.next.courseId === 'aiIndividual-novice' && m.next.lesson === 1 && !m.next.resume, JSON.stringify(m.next));
  t('the button opens that lesson', m.cta.url === 'https://assessment.productadvisory.co/lesson?course=aiIndividual-novice&lesson=1' && m.cta.label === 'Start your next lesson');
}
{
  const m = mk({ goals: { weeklyLessons: 3 }, lessonLog: { '2026-10-15': 1 }, courses: { 'execution-moderate': { completed: [1, 2], updatedAt: '2026-10-15T18:00:00Z' }, 'discovery-moderate': { completed: [1], updatedAt: '2026-10-01T18:00:00Z' } } });
  t('behind: says how far short and what closes the gap', m.status === 'behind' && /1 lesson last week, 2 short of your goal of 3/.test(m.headline), m.headline);
  t('carries on with the course touched last, at its first unfinished lesson', m.next.courseId === 'execution-moderate' && m.next.lesson === 3 && m.next.resume && m.cta.label === 'Pick up where you left off');
  t('with no focus areas chosen, suggests the two weakest', m.focusSuggested && m.focus.map(f => f.key).join() === 'aiIndividual,discovery');
  t('plan progress counts only courses in the plan', m.planDone === 3 && m.planTotal > 0 && m.planPct === Math.round(3 / m.planTotal * 100));
}
{
  const m = mk({ lessonLog: { '2026-10-19': 4 } });
  t('idle: lessons this week do not count for last week', m.status === 'idle' && m.done === 0 && /No lessons last week/.test(m.headline));
}
{
  const m = mk({}, { assessment: null });
  t('not assessed: points to the assessment', m.status === 'not_assessed' && m.cta.url === 'https://assessment.productadvisory.co/' && m.subject === 'Your weekly check-in: start with the assessment' && m.planPct === null);
}
{
  const all = {};
  C.assignedCourses({ categoryPct: cat({ discovery: 90, strategy: 90, prioritization: 90, execution: 90, stakeholder: 90, aiIndividual: 90, aiOrg: 90 }) })
    .forEach(c => { all[c.id] = { completed: Array.from({ length: c.lessons }, (_, i) => i + 1) }; });
  const m = mk({ courses: all }, { assessment: { categoryPct: cat({ discovery: 90, strategy: 90, prioritization: 90, execution: 90, stakeholder: 90, aiIndividual: 90, aiOrg: 90 }) } });
  t('finished: says so and offers the dashboard', m.status === 'finished' && m.next === null && m.cta.url.endsWith('/lms-dashboard') && m.planPct === 100);
}
{
  const d = mk({ goals: { weeklyLessons: 5 }, lessonLog: { '2026-10-18': 1 } }, { freq: 'daily' });
  t('daily: yesterday, with a daily goal', d.done === 1 && d.target === 1 && d.subject === 'Your daily check-in: 1 of 1 lesson yesterday', d.subject);
}

/* ---------------- the email itself */
{
  const m = mk({ goals: { weeklyLessons: 2, focus: ['strategy'] }, lessonLog: { '2026-10-13': 1 } });
  const e = N.checkinEmail(m);
  t('email has the subject, the headline, the goal and the button', e.subject === m.subject && e.html.indexOf('1 short of your goal of 2') > -1 && e.html.indexOf('Start your next lesson') > -1 && e.html.indexOf(m.cta.url.replace(/&/g, '&amp;')) > -1);
  t('email footer has change-how-often and unsubscribe links', e.html.indexOf('https://s/settings') > -1 && e.html.indexOf('https://s/off') > -1 && /You get this check-in weekly/.test(e.html));
  t('the plain-text version has the same essentials', /Goal last week: 1 of 2 lessons/.test(e.text) && /Unsubscribe: https:\/\/s\/off/.test(e.text) && /Your focus areas:\n- Product Strategy/.test(e.text));
  const x = N.checkinEmail(mk({}, { name: '<b>Eve</b>' }));
  t('names are escaped in the email', x.html.indexOf('<b>Eve</b>') === -1 && x.html.indexOf('&lt;b&gt;Eve&lt;/b&gt;') > -1);
}

/* ---------------- the admin's report */
{
  const memberships = [], shares = {};
  const add = (id, share) => { memberships.push({ id: id, role: 'member', status: 'active', displayName: id, email: id + '@x.com', joinedAtMs: MON - 60 * DAY }); if (share) shares[id] = share; };
  add('a', { identity: { name: 'A', email: 'a@x.com' }, assessment: { overallPct: 40, categoryPct: cat(), answers: [] }, courses: { 'discovery-moderate': { completed: [1, 2] } }, lastActiveAt: '2026-10-14T18:00:00Z' });
  add('b', { identity: { name: 'B', email: 'b@x.com' }, assessment: { overallPct: 40, categoryPct: cat(), answers: [] }, courses: {}, lastActiveAt: '2026-08-01T18:00:00Z' });
  add('c', null);
  const rows = C.buildTeamRows(memberships, shares, MON).filter(r => r.status === 'active');
  const invites = [{ status: 'open', expiresAtMs: MON + 5 * DAY }, { status: 'open', expiresAtMs: MON - DAY }];
  const org = { id: 'org1', name: 'TestCo', plan: 'seat', seatLimit: 10, focusAreas: ['discovery', 'aiOrg', 'strategy'] };
  const m = N.orgReport({ org: org, rows: rows, invites: invites, freq: 'weekly', nowMs: MON, offsetMin: PDT, adminName: 'Pat Admin', links: LINKS });
  const tile = (label) => (m.tiles.filter(x => x.label === label)[0] || {}).n;
  t('report counts the team', tile('People') === 3 && tile('Took the assessment') === 2 && tile('Learning now') === 1, JSON.stringify(m.tiles));
  t('report counts who was active last week', tile('Active last week') === 1);
  t('quiet people are flagged', tile('Quiet for 30+ days') >= 1 && m.tiles.filter(x => x.label === 'Quiet for 30+ days')[0].warn);
  t('seats: active, pending, available', m.seats.map(s => s.n).join() === '3,1,6', m.seats.map(s => s.n).join());
  t('subject names the company and the activity', m.subject === 'TestCo — weekly learning report: 1 person active last week', m.subject);
  t('focus areas follow the company ranking', m.focus.length === 3 && m.focus[0].label === 'Customer & Market Discovery');
  t('links to the full report on the company page', m.url === 'https://assessment.productadvisory.co/company?org=org1#reportCard');
  t('highlights come from the report rules', m.highlights.length > 0 && m.highlights.every(h => h.text));
  const e = N.orgEmail(m);
  t('report email has the summary, the button and the footer', e.html.indexOf('See the full report') > -1 && e.html.indexOf('What stands out') > -1 && /You get this report weekly/.test(e.html) && /See the full report: https:/.test(e.text));
  const none = N.orgReport({ org: Object.assign({}, org, { focusAreas: [] }), rows: [], invites: [], freq: 'monthly', nowMs: WED, offsetMin: PDT, links: LINKS });
  t('an empty company still gets a sensible report', none.headline === 'No one has joined yet.' && none.subject === 'TestCo — monthly learning report: 0 people active last month' && N.orgEmail(none).html.length > 0);
}

t('email masked for the settings page', N.maskEmail('jane@acme.com') === 'j***@acme.com' && N.maskEmail('nope') === '');

t('apps-script/notify.gs is up to date (run: node tools/build-notify-gs.mjs)', fs.readFileSync(new URL('../apps-script/notify.gs', import.meta.url), 'utf8') === renderNotifyGs());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
