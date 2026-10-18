// Tests for pilot-core.js (the pilot and customer tracker).
// Run:  node --experimental-default-type=module tests/pilot-core.test.mjs
import '../company-core.js';
import '../company-report.js';
import '../pilot-core.js';

const C = globalThis.CompanyCore, R = globalThis.CompanyReport, P = globalThis.PilotCore;

let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const NOW = Date.parse('2026-10-13T12:00:00.000Z');
const DAY = 86400000;
const iso = (d) => new Date(NOW - d * DAY).toISOString();
const dayStr = (d) => iso(d).slice(0, 10);
const cat = (v) => ({ discovery: v, strategy: v, prioritization: v, execution: v, stakeholder: v, aiIndividual: v, aiOrg: v });

function team(spec, adminFirst) {
  const memberships = [], shares = {};
  let i = 0;
  Object.keys(spec).forEach(state => {
    for (let k = 0; k < spec[state]; k++) {
      const id = 'u' + (++i);
      memberships.push({ id: id, role: adminFirst && i === 1 ? 'admin' : 'member', status: 'active', displayName: 'P' + i, email: 'p' + i + '@x.com', joinedAtMs: NOW - 40 * DAY });
      if (state === 'none') continue;
      const share = { identity: { name: 'P' + i, email: 'p' + i + '@x.com' }, assessment: { tier: 'Moderate Experience', overallPct: 40, categoryPct: cat(40), answers: [] }, courses: {}, lastActiveAt: iso(2) };
      if (state === 'learning') share.courses = { 'discovery-moderate': { completed: [1, 2] } };
      if (state === 'quiet') share.lastActiveAt = iso(45);
      if (state === 'finished') { share.assessment.overallPct = 80; share.assessment.categoryPct = cat(80); C.DOMAINS.forEach(d => { share.courses[d[0] + '-advanced'] = { completed: [1, 2, 3, 4, 5, 6] }; }); }
      shares[id] = share;
    }
  });
  return C.buildTeamRows(memberships, shares, NOW);
}
const openInvite = (n) => Array.from({ length: n }, (_, i) => ({ id: 't' + i, status: 'open', createdAtMs: NOW - DAY, expiresAtMs: NOW + 10 * DAY }));
const snap = (daysAgo, o) => Object.assign({ atMs: NOW - daysAgo * DAY, day: dayStr(daysAgo), people: 5, assessed: 3, learning: 1, finished: 0, inactive: 0, avgOverall: 40, avgPlan: 5, lessons: 10, areas: { discovery: 40, strategy: 40 } }, o || {});

console.log('--- stages and the run book ---');
{
  t('seven stages, in order, each with a label', P.STAGE_KEYS.join() === 'prospect,pilot_planned,pilot_running,pilot_review,onboarding,active,closed' && P.STAGES.every(s => s.label && s.hint));
  t('an unknown stage falls back to prospect', P.stageOf('nonsense').key === 'prospect');
  t('every stage has a run book, and every run-book item has an id and some words', P.STAGES.every(s => P.RUNBOOK[s.phase]) && P.ALL_ITEMS.length >= 30 && new Set(P.ALL_ITEMS).size === P.ALL_ITEMS.length);
  t('item ids are short and safe to store', P.ALL_ITEMS.every(id => /^[a-z0-9_]{2,20}$/.test(id)));
  t('the run book covers before, during and after the pilot, and the first 30 days', ['plan', 'run', 'review', 'onboard', 'grow'].every(k => P.RUNBOOK[k].items.length >= 5));
}

console.log('--- goals ---');
{
  const now = P.currentNumbers(team({ none: 1, assessed: 2, learning: 3, finished: 2 }, true), openInvite(2), NOW, null);
  t('the numbers goals use: people, assessed, started, finished', now.people === 8 && now.assessed === 7 && now.learning === 3 && now.finished === 2, JSON.stringify([now.people, now.assessed, now.learning, now.finished]));
  t('joined is the share of invited people who joined (8 of 10)', now.joined_pct === 80 && now.pending === 2);
  t('assessed 88%, started 63%, finished 25%', now.assessed_pct === 88 && now.started_pct === 63 && now.finished_pct === 25, [now.assessed_pct, now.started_pct, now.finished_pct].join());
  const met = P.judgeGoal({ metric: 'assessed_pct', target: 85 }, now);
  t('a goal at or above its target is met, with the numbers in plain words', met.status === 'met' && met.text === '88% (target 85%)' && met.label === 'People who took the assessment');
  t('a goal below target is not yet met', P.judgeGoal({ metric: 'assessed_pct', target: 90 }, now).status === 'not_yet');
  t('exactly on target is met', P.judgeGoal({ metric: 'joined_pct', target: 80 }, now).status === 'met');
  const q = P.judgeGoal({ metric: 'quiet_pct', target: 20 }, now);
  t('"quiet" goals work the other way round: lower is better', q.status === (now.quiet_pct <= 20 ? 'met' : 'not_yet') && /at most 20%/.test(q.text));
  t('a goal with no data yet says so rather than failing', P.judgeGoal({ metric: 'overall_gain', target: 5 }, now).status === 'unknown' && /No data yet/.test(P.judgeGoal({ metric: 'overall_gain', target: 5 }, now).text));
  t('an unknown measure is reported, not crashed on', P.judgeGoal({ metric: 'bogus', target: 5 }, now).status === 'unknown');
  const gain = P.currentNumbers(team({ finished: 3 }), [], NOW, snap(30, { avgOverall: 50 }));
  t('score gain is today\'s average minus the baseline\'s', gain.overall_gain === 30 && P.judgeGoal({ metric: 'overall_gain', target: 25 }, gain).status === 'met');
  t('an empty company has no percentages, not zero or an error', (() => { const e = P.currentNumbers([], [], NOW, null); return e.assessed_pct === null && e.joined_pct === null && e.plan_pct === null; })());
  t('the default goals are valid', P.validGoals(P.DEFAULT_GOALS));
  t('goals must be known measures, whole targets 0 to 100, no repeats, at most 8', P.validGoals([]) && !P.validGoals([{ metric: 'x', target: 5 }]) && !P.validGoals([{ metric: 'assessed_pct', target: 101 }]) && !P.validGoals([{ metric: 'assessed_pct', target: 5.5 }]) && !P.validGoals([{ metric: 'assessed_pct', target: 5 }, { metric: 'assessed_pct', target: 6 }]) && !P.validGoals(P.METRICS.concat(P.METRICS).map((m, i) => ({ metric: m.key, target: i }))) && !P.validGoals('nope'));
}

console.log('--- the baseline and before-and-after ---');
{
  const snaps = [snap(40, { day: dayStr(40) }), snap(21), snap(7)];
  t('the chosen baseline day wins', P.pickBaseline(snaps, { baselineDay: dayStr(21), pilotStart: dayStr(40) }).day === dayStr(21));
  t('otherwise the first snapshot on or after the pilot start', P.pickBaseline(snaps, { pilotStart: dayStr(25) }).day === dayStr(21));
  t('a chosen day with no snapshot falls back to the start date', P.pickBaseline(snaps, { baselineDay: '2020-01-01', pilotStart: dayStr(10) }).day === dayStr(7));
  t('no start date and no chosen day: no baseline (the page asks the owner to save one)', P.pickBaseline(snaps, {}) === null && P.pickBaseline([], { pilotStart: dayStr(5) }) === null);
  const now = P.currentNumbers(team({ assessed: 1, learning: 2, finished: 2 }), [], NOW, null);
  const ba = P.beforeAfter(snap(21, { people: 3, assessed: 1, learning: 0, finished: 0, avgOverall: 30, avgPlan: 0 }), now);
  const by = (l) => ba.filter(r => r.label === l)[0];
  t('one line per measure plus one per skill area', ba.length === 6 + 7);
  t('people and assessed show before, after and the change', by('People in the company').before === 3 && by('People in the company').after === 5 && by('People in the company').delta === 2);
  t('"started learning" counts learning and finished on both sides', by('Started learning').before === 0 && by('Started learning').after === 4);
  t('scores carry a % unit and a good/bad flag', by('Average overall score').unit === '%' && by('Average overall score').good === true);
  t('average plan complete compares the baseline with today\'s figure', by('Average plan complete').before === 0 && by('Average plan complete').after === now.plan_pct && by('Average plan complete').after !== null && by('Average plan complete').delta === now.plan_pct, JSON.stringify(by('Average plan complete')));
  t('an area with no earlier score has no change, not a made-up one', by('Customer & Market Discovery').before === 40 && by('AI Fluency — Organizational').before === null && by('AI Fluency — Organizational').delta === null && by('AI Fluency — Organizational').good === null);
  t('no baseline: nothing to compare', P.beforeAfter(null, now).length === 0);
}

console.log('--- the health of a customer ---');
{
  const org = { plan: 'seat', seatLimit: 20 };
  const mk = (spec, pilot, trend, adminFirst) => P.health({ pilot: Object.assign({ stage: 'active', pilotEnd: dayStr(60), nextCheckin: dayStr(-10), renewalDate: '' }, pilot || {}), org: org, nowMs: NOW,
    now: P.currentNumbers(team(spec, adminFirst), [], NOW, null), trend: trend || null });
  t('not shown before someone is a customer', P.health({ pilot: { stage: 'pilot_running' }, org: org, nowMs: NOW, now: P.currentNumbers(team({ learning: 5 }), [], NOW, null), trend: null }) === null);
  const good = mk({ learning: 12, finished: 3 });
  t('a busy customer with a check-in booked is green', good.level === 'green' && good.reasons[0] === 'Everything on track.', JSON.stringify(good));
  const amber = mk({ learning: 10, quiet: 3 });
  t('20% or more quiet is amber, saying how many', amber.level === 'amber' && /3 people are quiet for 30\+ days \(23%\)/.test(amber.reasons.join(' ')), JSON.stringify(amber));
  const red = mk({ learning: 5, quiet: 5 });
  t('40% or more quiet is red', red.level === 'red');
  t('no one joined is red', mk({}, {}).level === 'red');
  t('few seats in use after 30 days is amber', mk({ learning: 8 }).reasons.join(' ').indexOf('8 of 20 seats') > -1 && mk({ learning: 8 }).level === 'amber');
  t('plenty of seats in use is fine', mk({ learning: 12 }).reasons.join(' ').indexOf('seats') === -1);
  t('no next check-in set is amber', mk({ learning: 12 }, { nextCheckin: '' }).reasons.join(' ').indexOf('No next check-in is set') > -1);
  t('a check-in a few days late is amber, over two weeks late is red', mk({ learning: 12 }, { nextCheckin: dayStr(5) }).level === 'amber' && mk({ learning: 12 }, { nextCheckin: dayStr(20) }).level === 'red');
  t('no one new started learning for two weeks is amber', mk({ learning: 12 }, {}, { weeks: 3, started: { from: 12, to: 12 } }).reasons.join(' ').indexOf('No more people have started learning') > -1);
  t('a renewal soon with a low plan is amber', mk({ learning: 12 }, { renewalDate: dayStr(-30) }).reasons.join(' ').indexOf('Renewal is in 30 days') > -1);
  t('a renewal far away is not mentioned', mk({ learning: 12 }, { renewalDate: dayStr(-200) }).reasons.join(' ').indexOf('Renewal') === -1);
  t('onboarding customers are checked too', P.health({ pilot: { stage: 'onboarding', pilotEnd: dayStr(5), nextCheckin: dayStr(-3) }, org: org, nowMs: NOW, now: P.currentNumbers(team({ learning: 5 }), [], NOW, null), trend: null }).level !== undefined);
}

console.log('--- run-book progress ---');
{
  const rows = team({ assessed: 1, learning: 8, finished: 1 }, true);
  const now = P.currentNumbers(rows, openInvite(1), NOW, null);
  const auto = P.autoDone({ now: now, rows: rows, baseline: null, org: {} });
  t('the page can see for itself: company exists, an admin joined, people invited', auto.company === true && auto.admin === true && auto.invited === true);
  t('percentage items turn on at 80, 90 and 60', auto.joined80 === true && auto.assessed90 === true && auto.started60 === true);
  t('the baseline item is off until a baseline exists', auto.baseline === false && P.autoDone({ now: now, rows: rows, baseline: snap(5), org: {} }).baseline === true);
  const low = P.autoDone({ now: P.currentNumbers(team({ none: 5, assessed: 1 }), [], NOW, null), rows: [], baseline: null, org: {} });
  t('a company that is behind is not ticked', low.assessed90 === false && low.started60 === false && low.admin === false);
  const cl = P.checklist('plan', ['goals', 'dates', 'focus'], auto);
  t('hand-ticked items show as done and the count is right', cl.items.filter(i => i.id === 'goals')[0].done && cl.items.filter(i => i.id === 'kickoff')[0].done === false && cl.total === 8);
  t('automatic items ignore the hand ticks and follow the data', cl.items.filter(i => i.id === 'admin')[0].done === true && cl.items.filter(i => i.id === 'admin')[0].auto === true && P.checklist('plan', ['admin'], { admin: false }).items.filter(i => i.id === 'admin')[0].done === false);
  t('done = hand ticks + automatic ones', cl.done === 3 + 2, String(cl.done));
  t('an unknown phase gives an empty list, not a crash', P.checklist('zzz', [], {}).items.length === 0);
}

console.log('--- putting it together ---');
{
  const base = { org: { plan: 'seat', seatLimit: 20 }, nowMs: NOW };
  const run = P.build(Object.assign({}, base, { pilot: { stage: 'pilot_running', pilotStart: dayStr(21), pilotEnd: dayStr(-7), goals: [{ metric: 'assessed_pct', target: 90 }, { metric: 'plan_pct', target: 25 }] },
    rows: team({ none: 1, assessed: 2, learning: 4, finished: 1 }, true), invites: openInvite(2), snapshots: [snap(20), snap(7)] }));
  t('the stage and its run book are chosen from the stage', run.stage.key === 'pilot_running' && run.checklist.title === 'While the pilot runs');
  t('the baseline is the first snapshot since the start', run.baseline && run.baseline.day === dayStr(20));
  t('goals are judged', run.goals.length === 2 && run.goals[0].status === 'not_yet' && run.goals[1].label.indexOf('learning plan') > -1);
  t('no health for a pilot', run.health === null);
  t('before-and-after rows are ready', run.beforeAfter.length === 13);
  t('suggestions: at most three, about what is behind', run.next.length > 0 && run.next.length <= 3 && run.next.some(s => /invitations are still waiting|not taken the assessment|quiet/.test(s)), run.next.join(' | '));
  t('the summary says who took part, what they did, and goals met', /8 people took part \(2 more invited/.test(run.summary[0]) && /took the assessment/.test(run.summary[1]) && /Goals met: \d of 2\./.test(run.summary[2]), run.summary.join(' | '));
  t('and how the score moved, once there is a baseline', run.summary.some(s => /Average overall score/.test(s)));

  const noBase = P.build(Object.assign({}, base, { pilot: { stage: 'pilot_running', pilotStart: dayStr(3) }, rows: team({ assessed: 5 }), invites: [], snapshots: [] }));
  t('with no baseline, the page is told to save one when half have taken the assessment', noBase.baseline === null && noBase.next.some(s => /Save the baseline now/.test(s)), noBase.next.join(' | '));
  const plan = P.build(Object.assign({}, base, { pilot: { stage: 'prospect' }, rows: [], invites: [], snapshots: [] }));
  t('a brand-new prospect is told to add goals, a start date and an admin', plan.next.length === 3 && /goals/.test(plan.next[0]) && /start date/.test(plan.next[1]) && /admin/.test(plan.next[2]), plan.next.join(' | '));
  t('and the empty summary does not crash', plan.summary[0] === '0 people took part.' && plan.goals.length === 0);
  const review = P.build(Object.assign({}, base, { pilot: { stage: 'pilot_review', pilotStart: dayStr(40), goals: [{ metric: 'assessed_pct', target: 50 }] }, rows: team({ finished: 4 }), invites: [], snapshots: [snap(39), snap(1)] }));
  t('in review: print the summary, and if every goal is met, lead with that', review.next[0] === 'Print the pilot summary and book the results meeting.' && review.next.some(s => /Every goal was met/.test(s)));
  const cust = P.build(Object.assign({}, base, { pilot: { stage: 'active', pilotEnd: dayStr(90) }, rows: team({ learning: 4, quiet: 4 }), invites: [], snapshots: [] }));
  t('a customer gets a health check and its reasons as next steps', cust.health && cust.health.level === 'red' && cust.next.length > 0 && cust.next.length <= 3);
  t('missing fields get safe defaults', (() => { const x = P.build(Object.assign({}, base, { pilot: null, rows: [], invites: [], snapshots: [] })); return x.pilot.stage === 'prospect' && Array.isArray(x.pilot.goals); })());
  t('the printable dates read as dates', P.fmtDay('2026-10-13') === 'Oct 13, 2026' && P.fmtDay('') === '' && P.fmtDay('nonsense') === '');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
