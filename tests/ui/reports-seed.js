// Classic script: sets up one scenario for reports.html before its modules run. The server is faked.
(function(){
  const p = new URLSearchParams(location.search);
  const scn = p.get('scn') || 'main';
  window.__scn = scn;
  window.__errs = [];
  addEventListener('error', e => window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)));

  window.__fakeUser = scn === 'signedout' ? null
    : scn === 'notowner' ? { uid: 'uNot', email: 'not@x.com', getIdToken: async function(){ return 'tok'; } }
    : { uid: 'owner1', email: 'owner@x.com', getIdToken: async function(){ return 'tok'; } };

  const DAY = 864e5, NOW = Date.now();
  function report(days){
    const labels = []; const mk = (f) => { const a = []; for (let i = 0; i < days; i++) a.push(f(i)); return a; };
    for (let i = 0; i < days; i++) labels.push('Day ' + (i + 1));
    const kpi = (key, label, cur, prev, note) => ({ key: key, label: label, cur: cur, prev: prev, delta: cur - prev, pct: prev > 0 ? Math.round((cur - prev) / prev * 100) : null, dir: cur > prev ? 'up' : cur < prev ? 'down' : 'flat', note: note });
    return {
      generatedAt: NOW, days: days,
      kpis: [kpi('assessments', 'Assessments completed', days === 7 ? 7 : 12, 5), kpi('started', 'Assessments started', 20, 18), kpi('accounts', 'Accounts created', 4, 6), kpi('requests', 'Requests for information', 6, 0),
        kpi('hotwarm', 'Hot or Warm requests', 6, 0), kpi('learners', 'Active learners', 3, 3, 'People who started a lesson and opened their dashboard in the period.')],
      series: { labels: labels, assessments: mk(i => i % 3), requests: mk(i => i % 5 === 0 ? 1 : 0), accounts: mk(i => i % 7 === 0 ? 1 : 0), started: mk(() => 1) },
      funnel: { worst: 2, steps: [{ key: 'started', label: 'Started the assessment', count: 20, conv: null }, { key: 'viewed', label: 'Saw their results', count: 12, conv: 60 },
        { key: 'account', label: 'Created an account', count: 4, conv: 33 }, { key: 'learning', label: 'Started learning', count: 3, conv: 75 }, { key: 'course', label: 'Finished a course', count: 1, conv: 33 }] },
      skills: { n: 12, tiers: [{ label: 'Moderate Experience', count: 8 }, { label: 'Limited Experience', count: 4 }],
        areas: [{ key: 'discovery', label: 'Customer & Market Discovery', n: 12, avg: 50 }, { key: 'strategy', label: 'Product Strategy & Roadmapping', n: 12, avg: 40 }, { key: 'prioritization', label: 'Prioritization & Trade-offs', n: 12, avg: 60 },
          { key: 'execution', label: 'Execution & Delivery', n: 12, avg: 55 }, { key: 'stakeholder', label: 'Stakeholder Communication & Influence', n: 12, avg: 70 }, { key: 'aiIndividual', label: 'AI Fluency (Individual)', n: 12, avg: 30 }, { key: 'aiOrg', label: 'AI Fluency (Organizational)', n: 0, avg: null }] },
      leads: { total: 6, hotWarm: 6, hot: 2, hotWaiting: 2, byFit: [{ label: 'Warm', count: 4 }, { label: 'Hot', count: 2 }], bySource: [{ label: 'toolkits', count: 5 }, { label: 'home', count: 1 }],
        byWho: [{ label: "I'm looking for my organization", count: 6 }], byTimeline: [{ label: 'This month', count: 6 }], bySize: [{ label: '11 to 50 people', count: 6 }], pipeline: [{ label: 'New', count: 5 }, { label: 'Contacted', count: 1 }] },
      insights: {
        overview: [{ severity: 'good', text: 'Assessments completed are up 140% vs the previous ' + days + ' days (12 vs 5).' }, { severity: 'info', thin: true, text: 'Too few accounts created to read a trend yet (4 in the last ' + days + ' days).' }, { severity: 'watch', text: '2 Hot requests have been waiting more than 2 days with Status "New". Reply to them first.' }],
        funnel: [{ severity: 'watch', text: 'The biggest drop is from "Saw their results" to "Created an account": 33% carry on (4 of 12).' }],
        leads: [{ severity: 'info', text: '6 of 6 requests are Hot or Warm (100%).' }, { severity: 'watch', text: '2 Hot requests have been waiting more than 2 days with Status "New". Reply to them first.' }],
        skills: [{ severity: 'info', text: 'Across 12 assessments, the strongest area is Stakeholder Communication & Influence (average 70%) and the weakest is AI Fluency (Individual) (30%).' }] },
      summary: [{ severity: 'watch', text: '2 Hot requests have been waiting more than 2 days with Status "New". Reply to them first.' }, { severity: 'watch', text: 'The biggest drop is from "Saw their results" to "Created an account": 33% carry on (4 of 12).' }, { severity: 'good', text: 'Assessments completed are up 140% vs the previous ' + days + ' days (12 vs 5).' }],
      notes: ['Funnel steps count anonymous events, so each step is a volume, not the same people followed through.', 'Active learners are people who opened their dashboard in the period; completions are not time-stamped.']
    };
  }
  window.__leadRows = [
    { ms: NOW - DAY, id: 'l1', name: 'Jane Smith', email: 'jane@acme.com', company: 'Acme Health', who: "I'm looking for my organization", interests: 'AI fluency for my organization', size: '11 to 50 people', timeline: 'This month', role: 'I make the decision', fit: 'Hot', score: 90, source: 'toolkits', status: 'New', message: 'Assess all 60 PMs', why: 'Timeline: This month (+25)' },
    { ms: NOW - 3 * DAY, id: 'l2', name: 'Sam Lee', email: 'sam@globex.com', company: 'Globex', who: 'I lead a product team', interests: 'Toolkits & templates', size: '2 to 10 people', timeline: 'Later this year', role: '', fit: 'Warm', score: 55, source: 'home', status: 'Contacted', message: '', why: '' },
    { ms: NOW - 5 * DAY, id: 'l3', name: '=HYPERLINK("http://evil","x")', email: 'eve@x.com', company: '', who: 'Something else', interests: 'Not sure yet', size: '', timeline: 'Just exploring', role: '', fit: 'Nurture', score: 10, source: '', status: 'New', message: '', why: '' }];

  window.__calls = [];
  window.__aiMode = 'ok';
  const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get: function(){ return desc.get.call(this); }, set: function(v){
    if (String(v).indexOf('script.google.com') === -1) { desc.set.call(this, v); return; }
    const q = Object.fromEntries(new URL(v).searchParams);
    window.__calls.push(q);
    setTimeout(function(){
      const cb = window[q.callback]; if (!cb) return;
      if (scn === 'unreachable') return cb(null);
      if (scn === 'oldscript') return cb({ totalCompletions: 19, tierCounts: {}, categoryAverages: {} });
      if (scn === 'serverrefuses') return cb({ ok: false, error: 'not_owner' });
      if (q.action === 'reports') return cb({ ok: true, report: report(Number(q.days) || 30) });
      if (q.action === 'reportsLeads') return cb({ ok: true, leads: window.__leadRows });
      if (q.action === 'reportsAi'){
        if (window.__aiMode === 'ok') return cb({ ok: true, text: 'What it shows: Requests are up.\nWhat to watch:\n- Hot requests waiting\nNext steps:\n- Reply today' });
        return cb({ ok: false, error: window.__aiMode });
      }
      cb(null);
    }, 20);
  } });
})();
