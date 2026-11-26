(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var p = new URLSearchParams(location.search);
  var scn = p.get('scn') || 'member';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uDash', email: 'Dash@Acme.com', displayName: 'Dash User', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store, Timestamp){
    store['progress/uDash'] = {
      courses: { 'discovery-novice': { completed: [1, 2], lastLesson: 2, updatedAt: '2026-10-07T09:00:00.000Z', reflections: { l1: 'PRIVATE THOUGHTS' } } },
      profile: { phone: '555-0100', company: 'Acme' },
      assessmentResult: { tier: 'Moderate Experience', overallPct: 55, overallTotal: 23, overallMax: 42, categoryPct: { discovery: 40, strategy: 50, prioritization: 55, execution: 60, stakeholder: 65, aiIndividual: 45, aiOrg: 35 },
        assessmentId: 'dash-1', submittedAt: '2026-10-05T10:00:00.000Z', answers: [{ n: 1, cat: 'discovery', question: 'Q', answer: 'A', points: 1 }] }
    };
    if (scn === 'member' || scn === 'focus' || scn === 'focusdefault' || scn === 'assigned') store['memberships/uDash'] = { orgId: 'orgA', orgName: 'Acme Health', role: 'member', status: 'active', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: null, email: 'dash@acme.com', displayName: 'Dash User' };
    // a course counts as complete only when ALL its real lessons are done (discovery-moderate has 5)
    // a weekly goal of 2, with one lesson finished today and two last month
    if (scn === 'threelessons') { var d = new Date(), key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      store['progress/uDash'].goals = { weeklyLessons: 2, focus: [] }; store['progress/uDash'].lessonLog = { '2026-09-01': 2 }; store['progress/uDash'].lessonLog[key] = 1; }
    // practice answers: a hard session yesterday, a good one today (Strategy moves up), and a lesson check
    if (scn === 'activity') { var N = Date.now(), Y = N - 864e5, A = function (d, ok, at, src, t) { return { d: d, id: d + at, t: t || 'scenario', ok: ok, at: at, src: src || 'practice' }; };
      store['progress/uDash'].answers = [A('strategy', false, Y - 40), A('strategy', false, Y - 30), A('strategy', false, Y - 20), A('strategy', true, Y - 10, 0, 'knowledge'),
        A('discovery', true, N - 5000, 'lesson', 'knowledge'), A('strategy', true, N - 4500), A('strategy', true, N - 4000), A('strategy', true, N - 3000), A('strategy', true, N - 2000)];
      var td = new Date(N), tk = td.getFullYear() + '-' + ('0' + (td.getMonth() + 1)).slice(-2) + '-' + ('0' + td.getDate()).slice(-2);
      store['progress/uDash'].lessonLog = {}; store['progress/uDash'].lessonLog[tk] = 1; }
    if (scn === 'threelessons') store['progress/uDash'].courses['discovery-moderate'] = { completed: [1, 2, 3], lastLesson: 3, updatedAt: '2026-10-08T09:00:00.000Z' };
    // finished long ago, with a saved reflection on its last lesson: eligible for spaced review
    if (scn === 'allfive') store['progress/uDash'].courses['discovery-moderate'] = { completed: [1, 2, 3, 4, 5], lastLesson: 5, updatedAt: '2026-10-08T09:00:00.000Z', reflections: { '5': 'My own answer to the final question' } };
    // finished only 3 days ago: too soon to review
    if (scn === 'recentdone') store['progress/uDash'].courses['discovery-moderate'] = { completed: [1, 2, 3, 4, 5], lastLesson: 5, updatedAt: new Date(Date.now() - 3 * 864e5).toISOString() };
    // a company ranking: customised for 'focus', the untouched standard order for 'focusdefault', none at all for 'member'
    if (scn === 'profilecard') store['progress/uDash'].hasSeenWelcome = true;
    if (scn === 'tourstaken' || scn === 'tourlink') store['progress/uDash'].hasSeenWelcome = true;
    if (scn === 'tourstaken') store['progress/uDash'].toursTaken = ['learning'];
    if (scn === 'focus') store['orgFocus/orgA'] = { focusAreas: ['strategy', 'aiIndividual', 'discovery'], updatedAt: Timestamp.now() };
    if (scn === 'focusdefault') store['orgFocus/orgA'] = { focusAreas: ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg'], updatedAt: Timestamp.now() };
    if (scn === 'admin') store['memberships/uDash'] = { orgId: 'orgA', orgName: 'Acme Health', role: 'admin', status: 'active', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: null, email: 'dash@acme.com', displayName: 'Dash User' };
    if (scn === 'removed') store['memberships/uDash'] = { orgId: 'orgA', orgName: 'Acme Health', role: 'member', status: 'removed', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: Timestamp.now(), email: 'dash@acme.com', displayName: 'Dash User' };
    if (scn === 'removedold') store['memberships/uDash'] = { orgId: 'orgA', orgName: 'Acme Health', role: 'member', status: 'removed', inviteToken: 't', joinedAt: Timestamp.fromMillis(Date.now() - 400 * 864e5), endedAt: Timestamp.fromMillis(Date.now() - 90 * 864e5), email: 'dash@acme.com', displayName: 'Dash User' };
    if (scn === 'owner') store['platformAdmins/uDash'] = { note: 'owner' };
    // an earlier assessment, so My growth can compare (discovery grew most, stakeholder dropped a little)
    if (scn === 'growth') store['progress/uDash'].assessmentHistory = [
      { assessmentId: 'dash-0', submittedAt: '2026-06-01T10:00:00.000Z', tier: 'Limited Experience', overallPct: 38,
        categoryPct: { discovery: 15, strategy: 40, prioritization: 45, execution: 50, stakeholder: 68, aiIndividual: 30, aiOrg: 20 } }];
    // team assignments: one due tomorrow (2 of its 5 lessons done), one with no date, and a damaged entry that is ignored.
    // A removed member's company still has the list, but they must not see it.
    if (scn === 'assigned' || scn === 'removed'){
      const tomorrow = new Date(Date.now() + 864e5), pad = (n) => ('0' + n).slice(-2);
      store['orgAssignments/orgA'] = { updatedAt: Timestamp.now(), items: [
        { id: 'a1strategy', course: 'strategy-novice', due: '', note: '', assignedAt: '2026-11-01' },
        { id: 'a2discovery', course: 'discovery-novice', due: tomorrow.getFullYear() + '-' + pad(tomorrow.getMonth() + 1) + '-' + pad(tomorrow.getDate()), note: 'Before <b>planning</b>', assignedAt: '2026-11-01' },
        { id: 'a3junk', course: 'not-a-course' }] };
    }
    // My saved tools on the top of the page (and someone else's, never shown)
    if (scn === 'member'){
      store['savedTools/t1'] = { uid: 'uDash', tool: 'impact', title: 'Q3 roadmap', summary: '1. SSO', data: 'X', createdAt: Timestamp.fromMillis(Date.now() - 5 * 864e5), updatedAt: Timestamp.fromMillis(Date.now() - 2 * 864e5) };
      store['savedTools/t2'] = { uid: 'uDash', tool: 'bbp', title: '', summary: 'Leading: Partner', data: 'Y', createdAt: Timestamp.fromMillis(Date.now() - 864e5), updatedAt: Timestamp.fromMillis(Date.now() - 864e5) };
      store['savedTools/t9'] = { uid: 'uOther', tool: 'ai', title: 'Not mine', summary: '', data: 'Z', createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    }
  };
})();