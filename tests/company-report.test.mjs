// Tests for company-report.js (the company admin's report).
// Run:  node --experimental-default-type=module tests/company-report.test.mjs
import '../company-core.js';
import '../company-report.js';

const C = globalThis.CompanyCore;
const R = globalThis.CompanyReport;

let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

const NOW = Date.parse('2026-10-13T12:00:00.000Z');
const DAY = 86400000;
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();
const cat = (v) => ({ discovery: v, strategy: v, prioritization: v, execution: v, stakeholder: v, aiIndividual: v, aiOrg: v });

// n people, in the stated states, as active team rows.
function team(spec) {
  const memberships = [], shares = {};
  let i = 0;
  Object.keys(spec).forEach(state => {
    for (let k = 0; k < spec[state]; k++) {
      const id = 'u' + (++i);
      memberships.push({ id: id, role: 'member', status: 'active', displayName: 'P' + i, email: 'p' + i + '@x.com', joinedAtMs: NOW - 40 * DAY });
      if (state === 'none') continue;
      const share = { identity: { name: 'P' + i, email: 'p' + i + '@x.com' }, assessment: { tier: 'Moderate Experience', overallPct: 40, categoryPct: cat(40), answers: [] }, courses: {}, lastActiveAt: iso(2) };
      if (state === 'learning') share.courses = { 'discovery-moderate': { completed: [1, 2] } };
      if (state === 'quiet') share.lastActiveAt = iso(45);
      if (state === 'finished') {
        share.assessment.categoryPct = cat(80);
        share.assessment.overallPct = 80;
        C.DOMAINS.forEach(d => { share.courses[d[0] + '-advanced'] = { completed: [1, 2, 3, 4, 5, 6] }; });
      }
      shares[id] = share;
    }
  });
  return C.buildTeamRows(memberships, shares, NOW);
}
const openInvite = (daysAgo) => ({ id: 'tok' + daysAgo, status: 'open', createdAtMs: NOW - daysAgo * DAY, expiresAtMs: NOW + 10 * DAY });

console.log('--- the weekly snapshot ---');
{
  const rows = team({ none: 1, assessed: 2, learning: 2, finished: 1 });
  const s = R.snapshotOf(rows, NOW);
  t('the day is today, in year-month-day form', s.day === '2026-10-13');
  t('it counts people, assessed, learning, finished', s.people === 6 && s.assessed === 5 && s.learning === 2 && s.finished === 1, JSON.stringify(s));
  t('it holds only numbers (no names or emails)', !/P\d|@x\.com/.test(JSON.stringify(s)));
  t('average skill scores are saved per area', s.areas.discovery !== undefined && Object.keys(s.areas).length === 7);
  t('an empty team has no area averages and no scores', (() => { const e = R.snapshotOf([], NOW); return e.people === 0 && e.avgOverall === null && Object.keys(e.areas).length === 0; })());
  t('a snapshot is due when there is none and there are people', R.snapshotDue([], 3, NOW) === true);
  t('never for an empty company', R.snapshotDue([], 0, NOW) === false);
  t('not due 3 days after the last one', R.snapshotDue([{ atMs: NOW - 3 * DAY }], 3, NOW) === false);
  t('due 7 days after the last one', R.snapshotDue([{ atMs: NOW - 7 * DAY }], 3, NOW) === true);
  t('due a little under 7 days after (so a weekly visit never misses)', R.snapshotDue([{ atMs: NOW - 6.6 * DAY }], 3, NOW) === true);
}

console.log('--- the trend ---');
{
  const snap = (daysAgo, o) => Object.assign({ atMs: NOW - daysAgo * DAY, day: iso(daysAgo).slice(0, 10), people: 6, assessed: 3, learning: 1, finished: 0, inactive: 0, avgOverall: 40, avgPlan: 5, lessons: 10, areas: {} }, o || {});
  t('one snapshot is no trend', R.trend([snap(0)]) === null);
  t('two snapshots less than a week apart are no trend', R.trend([snap(5), snap(0)]) === null);
  const tr = R.trend([snap(28, { assessed: 2, learning: 0, avgPlan: 2 }), snap(0, { assessed: 5, learning: 3, finished: 1, avgPlan: 20 })]);
  t('four weeks apart: compared over 4 weeks', tr && tr.weeks === 4 && tr.avgPlan.from === 2 && tr.avgPlan.to === 20 && tr.started.from === 0 && tr.started.to === 4, JSON.stringify(tr && tr.weeks));
  const many = R.trend([snap(70), snap(35), snap(21), snap(14), snap(7), snap(0)]);
  t('with many, it picks the oldest within about five weeks', many && many.weeks === 5, String(many && many.weeks));
  const far = R.trend([snap(70), snap(60), snap(0)]);
  t('if nothing is within five weeks it uses the newest one at least a week back', far && far.weeks === Math.round(60 / 7), String(far && far.weeks));
  const ser = R.trendSeries([snap(14), snap(7), snap(0)]);
  t('the chart series line up with the snapshots', ser.labels.length === 3 && ser.series.length === 3 && ser.series.every(s => s.values.length === 3) && ser.labels[2] === iso(0).slice(5, 10));
}

console.log('--- the adoption funnel ---');
{
  const rows = team({ none: 2, assessed: 2, learning: 3, finished: 1 });
  const f = R.funnel(rows, [openInvite(2), openInvite(3)], NOW);
  t('five steps, counts in order', f.steps.map(s => s.count).join() === '10,8,6,4,1', f.steps.map(s => s.count).join());
  t('"started" counts learning and finished', f.steps[3].count === 4);
  t('each step shows the share that carried on', f.steps[0].conv === null && f.steps[1].conv === 80 && f.steps[2].conv === 75 && f.steps[3].conv === 67 && f.steps[4].conv === 25, f.steps.map(s => s.conv).join());
  t('the biggest drop is marked', f.worst === 4 && f.pending === 2, String(f.worst));
  t('closed invites are not counted as waiting', R.funnel(rows, [{ id: 'a', status: 'revoked', createdAtMs: NOW }, { id: 'b', status: 'used', createdAtMs: NOW }, { id: 'c', status: 'open', createdAtMs: NOW - 20 * DAY, expiresAtMs: NOW - DAY }], NOW).pending === 0);
  const tiny = R.funnel(team({ assessed: 2 }), [], NOW);
  t('a drop after only a couple of people is not called the worst', tiny.worst === -1);
  t('an empty company has a funnel of zeros and no worst step', (() => { const e = R.funnel([], [], NOW); return e.steps.every(s => s.count === 0) && e.worst === -1; })());
}

console.log('--- compared with everyone ---');
{
  const r = C.rollup(team({ finished: 2, assessed: 3 }));
  const ok = R.compare(r, { totalCompletions: 40, categoryAverages: cat(50) });
  t('each area gets the team average, the overall average and the gap', ok.ok && ok.areas.length === 7 && ok.areas[0].team === r.domains[0].avg && ok.areas[0].all === 50 && ok.areas[0].gap === r.domains[0].avg - 50);
  t('too few assessments by everyone: no comparison at all', R.compare(r, { totalCompletions: 9, categoryAverages: cat(50) }).ok === false);
  t('no public numbers: no comparison', R.compare(r, null).ok === false);
  const small = C.rollup(team({ assessed: 2 }));
  t('fewer than three assessed people: that area is not compared', R.compare(small, { totalCompletions: 40, categoryAverages: cat(50) }).areas.length === 0);
}

console.log('--- the sentences ---');
const find = (list, re) => list.filter(i => re.test(i.text));
{
  const platform = { totalCompletions: 40, categoryAverages: { discovery: 40, strategy: 40, prioritization: 40, execution: 40, stakeholder: 40, aiIndividual: 70, aiOrg: 40 } };
  const rows = team({ none: 2, assessed: 2, learning: 3, finished: 1, quiet: 1 });
  const rep = R.build({ rows: rows, invites: [openInvite(12)], snapshots: [], platform: platform, focusAreas: [], nowMs: NOW });
  const L = rep.insights;
  t('a headline in one sentence', /^7 of 9 people have taken the assessment and 4 are learning or finished\.$/.test(rep.headline), rep.headline);
  t('waiting invitations, with how long the oldest has waited', find(L, /1 invitation is still waiting to be accepted \(the oldest was sent 12 days ago\)/).length === 1 && find(L, /waiting/)[0].severity === 'watch');
  t('people who have not taken the assessment', find(L, /2 of 9 people haven't taken the assessment yet/).length === 1);
  t('people assessed but not started', find(L, /3 people have taken the assessment but not started a lesson/).length === 1);
  t('people quiet for 30+ days', find(L, /3 people have been quiet for 30\+ days/).length === 1);
  t('people who finished', find(L, /1 person has finished their whole learning plan/).length === 1 && find(L, /finished their whole/)[0].severity === 'good');
  t('lowest and highest areas are named with their averages', find(L, /the lowest area is .* \(average \d+%\) and the highest is/).length === 1);
  t('a team ahead of everyone is good news, one behind is a watch item', find(L, /above the average of everyone/).every(i => i.severity === 'good') && find(L, /below the average of everyone/).every(i => i.severity === 'watch'));
  t('at most two comparison sentences', find(L, /the average of everyone who has taken the assessment/).length <= 2);
  t('a team of 6 assessed is not called a first look', find(L, /first look/).length === 0);

  const sm = R.build({ rows: team({ assessed: 3 }), invites: [], snapshots: [], platform: null, focusAreas: [], nowMs: NOW });
  const first = find(sm.insights, /lowest area|first look/);
  t('with 3 assessed people the area sentence says it is a first look and is kept out of the summary', first.length === 0 || (first[0].thin === true && !sm.summary.some(i => /first look/.test(i.text))));

  t('the summary has at most four items, problems first', rep.summary.length <= 4 && rep.summary[0].severity === 'watch' && rep.summary.every(i => !i.thin));
  t('a recent invitation is information, not a problem', (() => { const x = R.build({ rows: rows, invites: [openInvite(2)], snapshots: [], platform: null, focusAreas: [], nowMs: NOW }); return find(x.insights, /waiting/)[0].severity === 'info' && !/oldest/.test(find(x.insights, /waiting/)[0].text); })());

  const empty = R.build({ rows: [], invites: [], snapshots: [], platform: null, focusAreas: [], nowMs: NOW });
  t('an empty company is told how to start', empty.insights.length === 1 && /Invite people/.test(empty.insights[0].text) && empty.headline === 'No one has joined yet.');
  const emptyPending = R.build({ rows: [], invites: [openInvite(1), openInvite(2)], snapshots: [], platform: null, focusAreas: [], nowMs: NOW });
  t('an empty company with invitations says they are waiting', /2 invitations are waiting to be accepted/.test(emptyPending.insights[0].text));

  const inRange = R.build({ rows: rows, invites: [], snapshots: [], platform: { totalCompletions: 40, categoryAverages: cat(Math.round(rep.rollup.domains[0].avg)) }, focusAreas: [], nowMs: NOW });
  t('within ten points everywhere: one calm sentence', find(inRange.insights, /within 10 points of everyone/).length === 1);

  const withFocus = R.build({ rows: rows, invites: [], snapshots: [], platform: null, focusAreas: ['aiOrg', 'aiIndividual', 'strategy', 'discovery'], nowMs: NOW });
  t('progress on a chosen focus is reported with real counts', find(withFocus.insights, /Progress on your focus areas \(AI Fluency — Organizational, AI Fluency — Individual, Product Strategy & Roadmapping\): \d+% of the assigned lessons are done \(\d+ of \d+\)/).length === 1);
  t('the standard order is not reported as a focus', find(rep.insights, /focus areas/).length === 0);
}

console.log('--- trend sentences ---');
{
  const rows = team({ assessed: 2, learning: 3 });
  const snap = (daysAgo, o) => Object.assign({ atMs: NOW - daysAgo * DAY, day: iso(daysAgo).slice(0, 10), people: 5, assessed: 2, learning: 1, finished: 0, inactive: 0, avgOverall: 40, avgPlan: 5, lessons: 10, areas: {} }, o || {});
  const up = R.build({ rows: rows, invites: [], snapshots: [snap(28, { avgPlan: 2, learning: 0 }), snap(0, { avgPlan: 9, learning: 3 })], platform: null, focusAreas: [], nowMs: NOW });
  t('growth is good news with the real numbers and weeks', find(up.insights, /Average plan complete moved from 2% to 9% over 4 weeks/)[0].severity === 'good' && find(up.insights, /People who have started learning: 0 then, 3 now/).length === 1);
  const down = R.build({ rows: rows, invites: [], snapshots: [snap(28, { avgPlan: 20 }), snap(0, { avgPlan: 9 })], platform: null, focusAreas: [], nowMs: NOW });
  t('a fall is a watch item', find(down.insights, /moved from 20% to 9%/)[0].severity === 'watch');
  const flat = R.build({ rows: rows, invites: [], snapshots: [snap(14, { avgPlan: 9 }), snap(0, { avgPlan: 9 })], platform: null, focusAreas: [], nowMs: NOW });
  t('no change is said plainly', find(flat.insights, /has stayed at 9% over 2 weeks/).length === 1);
  const one = R.build({ rows: rows, invites: [], snapshots: [snap(0)], platform: null, focusAreas: [], nowMs: NOW });
  t('with one snapshot it says trends start after the next one, and keeps it out of the summary', find(one.insights, /Trend charts start after your next weekly snapshot/)[0].thin === true && one.series === null && !one.summary.some(i => /Trend charts/.test(i.text)));
  t('with two or more the chart series is provided', up.series && up.series.labels.length === 2);
}

console.log('--- what Explain with AI may send ---');
{
  const rows = team({ none: 1, assessed: 2, learning: 2, finished: 1 });
  const rep = R.build({ rows: rows, invites: [openInvite(3)], snapshots: [], platform: { totalCompletions: 40, categoryAverages: cat(50) }, focusAreas: ['aiOrg', 'strategy', 'discovery', 'execution'], nowMs: NOW });
  const f = rep.aiFacts, json = JSON.stringify(f);
  t('only counts, percentages and the fixed area names', f.people === 6 && f.funnel.length === 5 && f.areas.length === 7 && f.areas.every(a => typeof a.area === 'string' && typeof a.teamAvgPct === 'number'));
  t('no names, emails or ids anywhere in it', !/@|P\d|u\d|tok\d/.test(json), json.slice(0, 200));
  t('chosen focus areas are the fixed area names', f.focusAreas.join() === 'AI Fluency — Organizational,Product Strategy & Roadmapping,Customer & Market Discovery');
  t('the comparison appears only when there is one', f.areas[0].allAvgPct === 50 && R.build({ rows: rows, invites: [], snapshots: [], platform: null, focusAreas: [], nowMs: NOW }).aiFacts.areas[0].allAvgPct === null);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
