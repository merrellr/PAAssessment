// Classic script: seeds the fake database for one scenario before company.html's modules run.
(function(){
  const p = new URLSearchParams(location.search);
  const scn = p.get('scn') || 'admin';
  const day = 864e5;
  const ago = (d) => new Date(Date.now() - d * day).toISOString();
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__scn = scn;

  const me = { uid: 'uAdmin', email: 'Ann@Acme.com', displayName: 'Ann Admin', getIdToken: async function(){ return 'tok'; } };
  window.__fakeUser = scn === 'signedout' ? null
    : (scn === 'owner' || scn === 'ownernoorg') ? { uid: 'owner1', email: 'owner@x.com', displayName: 'Owner', getIdToken: async function(){ return 'tok'; } }
    : scn === 'member' ? { uid: 'uBen', email: 'ben@acme.com', displayName: 'Ben', getIdToken: async function(){ return 'tok'; } }
    : scn === 'plain' ? { uid: 'uNobody', email: 'nobody@x.com', displayName: 'Nobody', getIdToken: async function(){ return 'tok'; } }
    : me;

  const cats = (v) => ({ discovery: v, strategy: v, prioritization: v, execution: v, stakeholder: v, aiIndividual: v, aiOrg: v });

  window.__seed = function(store, Timestamp){
    const T = (d) => Timestamp.fromMillis(Date.now() - d * day);
    const mem = (uid, role, name, email, extra) => {
      store['memberships/' + uid] = Object.assign({ orgId: 'orgA', orgName: 'Acme Health', role: role, status: 'active', inviteToken: 'tok' + uid,
        joinedAt: T(60), endedAt: null, email: email, displayName: name }, extra || {});
    };
    store['orgs/orgA'] = { name: 'Acme Health', plan: 'seat', seatLimit: 10, focusAreas: ['aiOrg', 'discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual'],
      notes: 'secret owner notes', contactName: 'Pat Contact', contactEmail: 'pat@acme.com', contactPhone: '555-0000', billingAddress: '1 Main St',
      status: scn === 'archived' ? 'archived' : 'active', createdAt: T(100), createdBy: 'owner1', updatedAt: T(10) };

    // the member-readable copy of the focus list (the 'nocopy' scenario has none, as for companies made before it existed)
    if (scn !== 'nocopy') store['orgFocus/orgA'] = { focusAreas: store['orgs/orgA'].focusAreas.slice(), updatedAt: T(10) };

    if (scn === 'ownernoorg' || scn === 'plain' || scn === 'signedout') {
      if (scn === 'plain') store['progress/uNobody'] = {};
      return;
    }

    if (scn === 'empty') {
      mem('uAdmin', 'admin', 'Ann Admin', 'ann@acme.com', { joinedAt: T(1) });
      return;
    }

    mem('uAdmin', 'admin', 'Ann Admin', 'ann@acme.com');
    if (scn === 'member') { mem('uBen', 'member', 'Ben B', 'ben@acme.com'); return; }

    if (scn === 'removedadmin') { mem('uAdmin', 'admin', 'Ann Admin', 'ann@acme.com', { status: 'removed', endedAt: T(1) }); return; }

    mem('uBen', 'member', 'Ben B', 'ben@acme.com');
    mem('uCy', 'member', 'Cy C', 'cy@acme.com', { joinedAt: T(2) });
    mem('uDee', 'member', 'Dee D', 'dee@acme.com');
    mem('uEli', 'member', 'Eli E', 'eli@acme.com');
    mem('uFay', 'member', '', '');
    mem('uOld', 'member', 'Old Timer', 'old@acme.com', { status: 'removed', endedAt: T(20), joinedAt: T(300) });

    const adv = {};
    ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg'].forEach(k => { adv[k + '-advanced'] = { completed: [1, 2, 3, 4, 5], lastLesson: 5, updatedAt: ago(4) }; });

    store['orgs/orgA/members/uAdmin'] = { identity: { name: 'Ann Admin', email: 'ann@acme.com' }, lastActiveAt: ago(2), updatedAt: T(2),
      assessment: { tier: 'Lots of Experience', overallPct: 70, categoryPct: { discovery: 90, strategy: 70, prioritization: 60, execution: 55, stakeholder: 40, aiIndividual: 30, aiOrg: 20 },
        submittedAt: ago(20), answers: [
          { n: 1, cat: 'discovery', question: 'How do you validate a problem?', answer: '=HYPERLINK("http://evil.example","click")', points: 2 },
          { n: 2, cat: 'strategy', question: 'How often do you revisit strategy?', answer: 'Quarterly', points: 3 }] },
      courses: { 'discovery-advanced': { completed: [1, 2, 3, 4, 5], lastLesson: 5, updatedAt: ago(2) } } };
    store['orgs/orgA/members/uBen'] = { identity: { name: 'Ben B', email: 'ben@acme.com' }, lastActiveAt: ago(5), updatedAt: T(5),
      assessment: { tier: 'Limited Experience', overallPct: 15, categoryPct: cats(10), submittedAt: ago(30), answers: [] },
      courses: { 'discovery-novice': { completed: [1, 2], lastLesson: 2, updatedAt: ago(5) } } };
    // uCy has joined but nothing has been shared yet.
    store['orgs/orgA/members/uDee'] = { identity: { name: 'Dee D', email: 'dee@acme.com' }, lastActiveAt: ago(100), updatedAt: T(100),
      assessment: { tier: 'Advanced Experience', overallPct: 95, categoryPct: cats(90), submittedAt: ago(120), answers: [] }, courses: adv };
    store['orgs/orgA/members/uEli'] = { identity: { name: 'Eli E', email: 'eli@acme.com' }, lastActiveAt: ago(45), updatedAt: T(45),
      assessment: { tier: 'Moderate Experience', overallPct: 40, categoryPct: cats(40), submittedAt: ago(45), answers: [] }, courses: {} };
    store['orgs/orgA/members/uFay'] = { identity: null, lastActiveAt: ago(3), updatedAt: T(3),
      assessment: { tier: 'Limited Experience', overallPct: 20, categoryPct: cats(20), submittedAt: ago(3), answers: [] }, courses: {} };
    store['orgs/orgA/members/uOld'] = { identity: { name: 'Old Timer', email: 'old@acme.com' }, lastActiveAt: ago(40), updatedAt: T(40),
      assessment: { tier: 'Moderate Experience', overallPct: 30, categoryPct: cats(30), submittedAt: ago(60), answers: [{ n: 1, cat: 'discovery', question: 'Old question?', answer: 'Old answer', points: 1 }] }, courses: {} };

    const inv = (token, over) => { store['invites/' + token] = Object.assign({ orgId: 'orgA', orgName: 'Acme Health', email: token + '@acme.com', name: '', role: 'member', status: 'open',
      createdAt: T(3), createdBy: 'uAdmin', expiresAt: Timestamp.fromMillis(Date.now() + 20 * day), usedBy: null, usedAt: null }, over || {}); };
    inv('newone', { name: 'New One' });
    inv('bossone', { role: 'admin', createdBy: 'owner1', name: 'Boss One' });
    inv('stale', { expiresAt: Timestamp.fromMillis(Date.now() - 2 * day) });
    inv('usedone', { status: 'used', usedBy: 'uBen', usedAt: T(50) });
    inv('revoked1', { status: 'revoked' });
    store['invites/othercompany'] = { orgId: 'orgZ', orgName: 'Other Co', email: 'x@z.com', role: 'member', status: 'open', createdAt: T(1), createdBy: 'owner1',
      expiresAt: Timestamp.fromMillis(Date.now() + 5 * day), usedBy: null, usedAt: null };

    // a little history for the Recent activity card
    store['orgs/orgA/audit/a1'] = { action: 'company.created', actorUid: 'owner1', actorEmail: 'owner@x.com', targetEmail: '', detail: '', at: T(100) };
    store['orgs/orgA/audit/a2'] = { action: 'invite.created', actorUid: 'uAdmin', actorEmail: 'ann@acme.com', targetEmail: 'ben@acme.com', detail: 'member', at: T(60) };
    store['orgs/orgA/audit/a3'] = { action: 'focus.changed', actorUid: 'uAdmin', actorEmail: 'ann@acme.com', targetEmail: '', detail: '1. AI Fluency — Organizational', at: T(10) };

    if (scn === 'auditdenied') window.__failList = /^orgs\/orgA\/audit$/;
    if (scn === 'denied') window.__failList = /^memberships$/;
    if (scn === 'sharesdenied') window.__failList = /^orgs\/orgA\/members$/;
  };
})();
