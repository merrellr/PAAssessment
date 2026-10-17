// Classic script: seeds the fake database for one scenario before tool-requests.html's modules run.
(function(){
  const p = new URLSearchParams(location.search);
  const scn = p.get('scn') || 'fresh';
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__scn = scn;

  const mkUser = (uid, verified) => ({
    uid: uid, email: uid + '@Example.com', displayName: 'Pat ' + uid, emailVerified: verified,
    getIdToken: async function(){ return 'tok'; },
    reload: async function(){ if (this.__willVerify) this.emailVerified = true; }
  });
  window.__fakeUser = scn === 'anon' ? null
    : scn === 'unverified' ? mkUser('uUnver', false)
    : scn === 'voter' ? mkUser('uVoter', true)
    : mkUser('uFresh', true);

  window.__seed = function(store, Timestamp){
    const now = Timestamp.now();
    const tool = (title, status, votes, order, extra) => Object.assign({ title: title, description: title + ' helps you do something useful.', category: 'Strategy',
      status: status, order: order, voteCount: votes, createdAt: now, updatedAt: now }, extra || {});
    if (scn === 'empty') { /* no tools yet */ }
    else {
      store['tools/t1'] = tool('Alpha Scorecard', 'planned', 5, 1);
      store['tools/t2'] = tool('Beta Map', 'considering', 9, 2);
      store['tools/t3'] = tool('Gamma Guide', 'in_progress', 0, 3);
      store['tools/t4'] = tool('Delta Checklist', 'considering', 2, 4);
      store['tools/t5'] = tool('Epsilon Released', 'released', 20, 5, { launchUrl: 'https://example.com/epsilon' });
    }
    store['progress/uFresh'] = { courses: {} };
    store['progress/uVoter'] = { courses: {}, assessmentResult: { tier: 'Moderate Experience', overallPct: 40, categoryPct: {} } };
    if (scn === 'voter') {
      ['t1', 't2', 't4'].forEach(id => { store['toolVotes/uVoter_' + id] = { uid: 'uVoter', toolId: id, email: 'uvoter@example.com', notify: id === 't2', createdAt: now }; });
    }
    if (scn === 'suggested') store['toolSuggestions/uFresh'] = { uid: 'uFresh', email: 'ufresh@example.com', text: 'A pricing worksheet', status: 'pending', createdAt: now };
    if (scn === 'approved') store['toolSuggestions/uFresh'] = { uid: 'uFresh', email: 'ufresh@example.com', text: 'A pricing worksheet', status: 'approved', createdAt: now };
    if (scn === 'loaderror') window.__failList = /^tools$/;
  };
})();
