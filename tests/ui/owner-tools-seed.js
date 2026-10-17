// Classic script: seeds the fake database for one scenario before owner-tools.html's modules run.
(function(){
  const p = new URLSearchParams(location.search);
  const scn = p.get('scn') || 'main';
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  window.__scn = scn;
  window.__fakeUser = scn === 'signedout' ? null
    : scn === 'notowner' ? { uid: 'uNot', email: 'not@x.com', getIdToken: async function(){ return 'tok'; } }
    : { uid: 'owner1', email: 'owner@x.com', getIdToken: async function(){ return 'tok'; } };

  window.__seed = function(store, Timestamp){
    const now = Timestamp.now();
    const tool = (title, status, votes, order, extra) => Object.assign({ title: title, description: 'About ' + title, category: 'Strategy', status: status, order: order, voteCount: votes, createdAt: now, updatedAt: now }, extra || {});
    store['tools/tA'] = tool('Alpha Scorecard', 'planned', 2, 1);
    store['tools/tB'] = tool('Beta Map', 'considering', 5, 2);          // recorded votes: 3, so the count is wrong on purpose
    store['tools/tC'] = tool('Gamma Released', 'released', 0, 3, { launchUrl: 'https://example.com/gamma' });
    const vote = (uid, toolId, email, notify) => { store['toolVotes/' + uid + '_' + toolId] = { uid: uid, toolId: toolId, email: email, notify: notify, createdAt: now }; };
    vote('uA', 'tA', 'a@x.com', true);
    vote('uB', 'tA', 'b@x.com', false);
    vote('uA', 'tB', 'a@x.com', true);
    vote('uC', 'tB', 'c@x.com', true);
    vote('uD', 'tB', 'd@x.com', false);
    store['toolSuggestions/s1'] = { uid: 's1', email: 's1@x.com', text: 'Pricing worksheet for B2B products', status: 'pending', createdAt: now };
    store['toolSuggestions/s2'] = { uid: 's2', email: 's2@x.com', text: 'Something off topic', status: 'pending', createdAt: now };
    store['toolSuggestions/s3'] = { uid: 's3', email: 's3@x.com', text: 'Already handled', status: 'approved', createdAt: now };
    if (scn === 'empty') { delete store['tools/tA']; delete store['tools/tB']; delete store['tools/tC']; }
  };
})();
