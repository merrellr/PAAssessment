// Classic script: seeds the fake database for one scenario before owner-pilot.html's modules run.
(function(){
  const p = new URLSearchParams(location.search);
  const scn = p.get('scn') || 'main';
  const day = 864e5;
  const ago = (d) => new Date(Date.now() - d * day).toISOString();
  const dayStr = (d) => ago(d).slice(0, 10);
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__scn = scn;
  window.__fakeUser = scn === 'signedout' ? null
    : scn === 'notowner' ? { uid: 'uNot', email: 'not@x.com', getIdToken: async function(){ return 'tok'; } }
    : { uid: 'owner1', email: 'owner@x.com', getIdToken: async function(){ return 'tok'; } };

  const cats = (v) => ({ discovery: v, strategy: v, prioritization: v, execution: v, stakeholder: v, aiIndividual: v, aiOrg: v });

  window.__seed = function(store, Timestamp){
    const T = (d) => Timestamp.fromMillis(Date.now() - d * day);
    store['orgs/orgA'] = { name: 'Acme Health', plan: 'seat', seatLimit: 20, focusAreas: [], notes: '', contactName: 'Pat Contact', status: 'active', createdAt: T(100), createdBy: 'owner1', updatedAt: T(10) };
    if (scn === 'signedout' || scn === 'notowner' || scn === 'noorg' || scn === 'notfound') return;

    const mem = (uid, role, name, email, joined) => { store['memberships/' + uid] = { orgId: 'orgA', orgName: 'Acme Health', role: role, status: 'active', inviteToken: 't' + uid, joinedAt: T(joined || 60), endedAt: null, email: email, displayName: name }; };
    mem('uAdmin', 'admin', 'Ann Admin', 'ann@acme.com');
    mem('uBen', 'member', 'Ben B', 'ben@acme.com');
    mem('uCy', 'member', 'Cy C', 'cy@acme.com', 2);
    mem('uDee', 'member', 'Dee D', 'dee@acme.com');
    mem('uEli', 'member', 'Eli E', 'eli@acme.com');
    const adv = {};
    ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg'].forEach(k => { adv[k + '-advanced'] = { completed: [1, 2, 3, 4, 5, 6], lastLesson: 5, updatedAt: ago(4) }; });
    const share = (name, email, overall, cat, courses, active) => ({ identity: { name: name, email: email }, lastActiveAt: ago(active), updatedAt: T(active),
      assessment: { tier: 'Moderate Experience', overallPct: overall, categoryPct: cat, submittedAt: ago(20), answers: [] }, courses: courses });
    store['orgs/orgA/members/uAdmin'] = share('Ann Admin', 'ann@acme.com', 60, cats(60), { 'discovery-advanced': { completed: [1, 2, 3, 4, 5], lastLesson: 5, updatedAt: ago(2) } }, 2);
    store['orgs/orgA/members/uBen'] = share('Ben B', 'ben@acme.com', 30, cats(30), { 'discovery-moderate': { completed: [1, 2], lastLesson: 2, updatedAt: ago(5) } }, 5);
    store['orgs/orgA/members/uDee'] = share('Dee D', 'dee@acme.com', 90, cats(90), adv, 4);
    store['orgs/orgA/members/uEli'] = share('Eli E', 'eli@acme.com', 40, cats(40), {}, 45);
    store['invites/newone'] = { orgId: 'orgA', orgName: 'Acme Health', email: 'new@acme.com', name: '', role: 'member', status: 'open', createdAt: T(3), createdBy: 'owner1', expiresAt: Timestamp.fromMillis(Date.now() + 20 * day), usedBy: null, usedAt: null };

    // two weekly snapshots: one just after the pilot started, one a week ago
    const snap = (d, o) => { const k = dayStr(d); store['orgs/orgA/snapshots/' + k] = Object.assign({ day: k, at: T(d), people: 4, assessed: 3, learning: 1, finished: 0, inactive: 0, avgOverall: 40, avgPlan: 5, lessons: 6, areas: { discovery: 40, strategy: 40 } }, o || {}); };
    const pilot = (o) => { store['orgPilot/orgA'] = Object.assign({ stage: 'pilot_running', pilotStart: dayStr(21), pilotEnd: dayStr(-14), nextCheckin: dayStr(-5), renewalDate: '', baselineDay: '', sponsor: 'Pat Sponsor', pilotSize: 6,
      goals: [{ metric: 'assessed_pct', target: 90 }, { metric: 'started_pct', target: 60 }], done: ['goals', 'dates'], summaryNote: 'Going well so far.', updatedAt: T(1) }, o || {}); };

    if (scn === 'fresh') return;                         // a company with no pilot record at all
    if (scn === 'customer') {
      snap(100, { people: 5, assessed: 1, learning: 0 }); snap(60, { people: 5, assessed: 3, learning: 1, finished: 0, avgOverall: 38 }); snap(7);
      pilot({ stage: 'active', pilotStart: dayStr(130), pilotEnd: dayStr(100), nextCheckin: '', renewalDate: '' });
      return;
    }
    snap(20); snap(7, { people: 5, assessed: 4, learning: 2, finished: 1, avgOverall: 55, avgPlan: 20, areas: { discovery: 55, strategy: 50 } });
    pilot();
    store['orgPilot/orgA/log/l1'] = { at: T(6), kind: 'call', text: 'Kickoff call with Pat. Wants a mid-point update.' };
    store['orgPilot/orgA/log/l2'] = { at: T(2), kind: 'note', text: 'Two people stuck on sign-in; sent them the link again.' };
    if (scn === 'saverefused') window.__failWrite = /^orgPilot\//;
    if (scn === 'snapfail') window.__failWrite = /\/snapshots\//;
    if (scn === 'deniedpilot') window.__failList = /^orgPilot\/orgA\/log$/;
  };
})();
