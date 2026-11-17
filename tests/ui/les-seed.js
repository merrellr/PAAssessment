(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'member';
  window.__scn = scn;
  // Lesson audio: a small list of what has been narrated, so the test doesn't depend on the real audio/lessons/index.json.
  if (scn === 'listen' || scn === 'noaudio'){
    var realFetch = window.fetch;
    window.__fetched = [];
    window.fetch = function(url, opts){
      if (/audio\/lessons\/lines\//.test(String(url))){
        // a line every 2 seconds, the two titles first, then one per line on the page (lesson-script.js decides which)
        window.__fetched.push(String(url));
        var n = window.PALessonScript.read(document.querySelector('#lessonBody')).els.length;
        var times = [[0, 0], [0, 0]]; for (var i = 0; i < n; i++) times.push([i * 2, i * 2 + 1.8]);
        return Promise.resolve(new Response(JSON.stringify(times), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (/audio\/lessons\/index\.json/.test(String(url))){
        window.__fetched.push(String(url));
        var idx = scn === 'listen' ? { 'discovery-novice-2': { duration: 128.4, bytes: 771040, hash: 'x', lines: 99 }, 'discovery-novice-3': { duration: 61, bytes: 1, hash: 'y' } } : {};
        return Promise.resolve(new Response(JSON.stringify(idx), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return realFetch.apply(this, arguments);
    };
  }
  window.__fakeUser = { uid: 'uLes', email: 'Les@Acme.com', displayName: 'Les User', emailVerified: true, providerData: [], getIdToken: async function(){ return 'tok'; } };
  window.__seed = function(store, Timestamp){
    var partway = scn === 'member' || scn === 'plain';   // four of five lessons already done: the next one finishes the course
    store['progress/uLes'] = {
      courses: partway ? { 'discovery-novice': { completed: [1, 2, 3, 4], lastLesson: 4, updatedAt: '2026-10-06T10:00:00.000Z', reflections: { l1: 'PRIVATE THOUGHTS' } } } : {},
      profile: { phone: '555-0100' },
      assessmentResult: { tier: 'Moderate Experience', overallPct: 55, overallTotal: 23, overallMax: 42,
        categoryPct: { discovery: 20, strategy: 50, prioritization: 55, execution: 60, stakeholder: 65, aiIndividual: 45, aiOrg: 35 },
        assessmentId: 'les-1', submittedAt: '2026-10-05T10:00:00.000Z', answers: [{ n: 1, cat: 'discovery', question: 'Q', answer: 'A', points: 1 }] }
    };
    if (scn === 'member' || scn === 'nav') store['memberships/uLes'] = { orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: null, email: 'les@acme.com', displayName: 'Les User' };
  };
  // remember what had been written at the moment the page changes, to prove the company copy is saved BEFORE moving on
  addEventListener('pagehide', function(){ try { sessionStorage.setItem('navlog', JSON.stringify((window.__writeLog || []).map(function(w){ return w.op + ':' + w.path; }))); } catch (e) {} });
})();
