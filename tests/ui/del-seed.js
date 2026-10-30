(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'member';
  window.__scn = scn;
  window.__fakeUser = { uid: 'uDel', email: 'del@acme.com', displayName: 'Del User', emailVerified: true, providerData: [{ providerId: 'password', email: 'del@acme.com' }], getIdToken: async function(){ return 'tok'; }, reload: async function(){} };
  if (scn === 'signingoogle' || scn === 'signinbrand' || scn === 'signinlink' || scn === 'mergeother') window.__fakeUser.providerData = [{ providerId: 'google.com', email: 'del@acme.com' }];
  // Two-step verification: twostepauto arrives from the "Set it up" card (?twostep=setup), with Firebase wanting a
  // recent sign-in first; twostepunverified has not confirmed its email yet.
  if (scn === 'twostepunverified') window.__fakeUser.emailVerified = false;
  // twostepgoogle: a Google-only account that turned two-step on before it was offered only to password accounts;
  // turning it off, Firebase asks to confirm it's you (blocked: the browser blocks the Google window).
  // twostepgooglenone: a Google-only account without it: the setting is not shown. twostepcode: an error with no wording of its own
  if (/^twostepgoogle/.test(scn)) { window.__fakeUser.providerData = [{ providerId: 'google.com', email: 'del@acme.com' }]; window.__mfaNeedRecent = true; }
  if (scn === 'twostepgoogle' || scn === 'twostepgoogleblocked') window.__fakeUser.__factors = [{ uid: 'f1', factorId: 'totp', displayName: 'Authenticator app' }];
  if (scn === 'twostepgoogleblocked') window.__popupBlocked = true;
  if (scn === 'twostepcode') window.__mfaOddError = 'auth/odd-thing';
  if (scn === 'twostepauto') { window.__mfaNeedRecent = true; history.replaceState(null, '', location.pathname + '?scn=twostepauto&twostep=setup'); }
  if (scn === 'signinlink') { try { localStorage.setItem('pa_link_email', 'me@home.net'); } catch (e) {} history.replaceState(null, '', location.pathname + '?scn=signinlink&linkEmail=1&oobCode=abc&mode=signIn'); }
  // Two accounts: keep one. The other account the second sign-in finds, with more progress than this one.
  if (scn === 'mergekeep'){
    window.__linkErrorEmail = 'me.personal@gmail.com';
    window.__otherUser = { uid: 'uHome', email: 'me.personal@gmail.com', providerData: [{ providerId: 'google.com', email: 'me.personal@gmail.com' }], getIdToken: async function(){ return 'tok2'; }, reload: async function(){} };
  }
  if (scn === 'mergeother'){
    try { localStorage.setItem('pa_link_email', 'me@home.net'); } catch (e) {}
    history.replaceState(null, '', location.pathname + '?scn=mergeother&linkEmail=1&oobCode=abc&mode=signIn');
    window.__linkError = 'auth/email-already-in-use';
    window.__otherUser = { uid: 'uHome', email: 'me@home.net', emailVerified: true, providerData: [{ providerId: 'password', email: 'me@home.net' }], getIdToken: async function(){ return 'tok2'; }, reload: async function(){} };
  }
  window.__calls = [];
  // the Apps Script spreadsheet clean-up and the company list are reached through a <script> tag; answer them here
  var desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get: function(){ return desc.get.call(this); }, set: function(v){
    if (String(v).indexOf('script.google.com') === -1) { desc.set.call(this, v); return; }
    var q = Object.fromEntries(new URL(v).searchParams); window.__calls.push(q.action + '@' + window.__writeLog.length);
    setTimeout(function(){ var cb = window[q.callback]; if (!cb) return; if (q.action === 'signinLink') { window.__brandAsk = q; cb(scn !== 'signinbrand' ? null : q.email === 'busy@x.com' ? { ok: false, error: 'rate' } : { ok: true, sent: true }); return; }
      cb(q.action === 'deleteAccount' ? { ok: true } : (q.action === 'companyMatch' ? { ok: true, match: q.idToken ? '<img src=x onerror="window.__pwned=1">Acme' : null } : null)); }, 10);
  } });
  window.__seed = function(store, Timestamp){
    var ts = Timestamp.now();
    store['progress/uDel'] = { courses: {}, profile: { phone: '555' }, orgIds: scn === 'nonmember' || scn === 'mergeother' ? [] : ['orgOld', 'orgA'] };
    // saved tools (my-tools.html): two of this account's, and somebody else's
    store['savedTools/st1'] = { uid: 'uDel', tool: 'bbp', title: 'Vendor choice', summary: 'Leading: Buy', data: 'AAA', createdAt: ts, updatedAt: ts };
    store['savedTools/st2'] = { uid: 'uDel', tool: 'impact', title: '', summary: '', data: 'BBB', createdAt: ts, updatedAt: ts };
    store['savedTools/so1'] = { uid: 'uOther', tool: 'ai', title: 'Theirs', summary: '', data: 'CCC', createdAt: ts, updatedAt: ts };
    if (/^merge/.test(scn)){
      store['progress/uHome'] = { courses: { 'discovery-novice': { completed: [1, 2, 3, 4, 5, 6] } }, assessmentResult: { tier: 'Lots of Experience', overallPct: 70, categoryPct: {} }, lessonLog: { '2026-10-02': 3 }, profile: { company: 'Home' } };
      store['toolVotes/uHome_t1'] = { uid: 'uHome', toolId: 't1', email: 'x', notify: false, createdAt: ts };
      store['tools/t3'] = { title: 'Three', description: '', category: '', status: 'planned', order: 3, voteCount: 1, createdAt: ts, updatedAt: ts };
      store['toolVotes/uHome_t3'] = { uid: 'uHome', toolId: 't3', email: 'x', notify: true, createdAt: ts };
    }
    if (scn === 'goals') { store['progress/uDel'].goals = { weeklyLessons: 3, focus: ['aiOrg'] }; store['progress/uDel'].notify = { checkin: 'monthly' }; store['progress/uDel'].lessonLog = { '2026-10-01': 2 }; }
    if (scn === 'badges'){
      var u = store['progress/uDel'];
      u.profile = { company: 'Acme', jobTitle: 'PM' };
      u.courses = { 'discovery-novice': { completed: [1, 2, 3, 4, 5], reflections: { '1': 'My note' } } };
      u.assessmentHistory = [{ submittedAt: '2026-05-01T12:00:00.000Z', tier: 'Moderate Experience', overallPct: 60, assessmentId: 'old', categoryPct: { discovery: 70, strategy: 50, prioritization: 60, execution: 60, stakeholder: 60, aiIndividual: 60, aiOrg: 60 } }];
      u.assessmentResult = { submittedAt: '2026-09-01T12:00:00.000Z', assessmentId: 'new', tier: 'Advanced Experience', overallPct: 82, categoryPct: { discovery: 90, strategy: 60, prioritization: 60, execution: 60, stakeholder: 60, aiIndividual: 60, aiOrg: 60 } };
      u.badges = { account: '2026-01-05T12:00:00.000Z', active7: '2026-02-01T12:00:00.000Z' };
    }
    if (scn !== 'nonmember' && scn !== 'mergeother'){
      store['memberships/uDel'] = { orgId: 'orgA', orgName: 'Acme', role: scn === 'goalsadmin' || scn === 'twostepadmin' ? 'admin' : 'member', status: 'active', inviteToken: 't', joinedAt: ts, endedAt: null, email: 'del@acme.com', displayName: 'Del User', phone: '555-0100' };
      var sh = function(){ return { identity: { name: 'Del User', email: 'del@acme.com' }, assessment: { tier: 'Lots of Experience', overallPct: 80 }, courses: {}, lastActiveAt: null, updatedAt: ts }; };
      store['orgs/orgA/members/uDel'] = sh();
      store['orgs/orgOld/members/uDel'] = sh();
    }
    // Tool Roadmap activity: two live tools (one whose count has drifted to 0), a vote for a tool that was
    // since deleted, a vote by somebody else, and a pending suggestion
    store['tools/t1'] = { title: 'One', description: '', category: '', status: 'planned', order: 1, voteCount: 4, createdAt: ts, updatedAt: ts };
    store['tools/t2'] = { title: 'Two', description: '', category: '', status: 'planned', order: 2, voteCount: 0, createdAt: ts, updatedAt: ts };
    store['toolVotes/uDel_t1'] = { uid: 'uDel', toolId: 't1', email: 'del@acme.com', notify: true, createdAt: ts };
    store['toolVotes/uDel_t2'] = { uid: 'uDel', toolId: 't2', email: 'del@acme.com', notify: false, createdAt: ts };
    store['toolVotes/uDel_tGone'] = { uid: 'uDel', toolId: 'tGone', email: 'del@acme.com', notify: false, createdAt: ts };
    store['toolVotes/uOther_t1'] = { uid: 'uOther', toolId: 't1', email: 'other@x.com', notify: true, createdAt: ts };
    store['toolSuggestions/uDel'] = { uid: 'uDel', email: 'del@acme.com', text: 'A pricing worksheet', status: 'pending', createdAt: ts };
    if (scn === 'blocked') window.__failWrite = /^orgs\/orgA\/members\/uDel$/;
    if (scn === 'votefail') window.__failWrite = /^toolVotes\//;
  };
})();
