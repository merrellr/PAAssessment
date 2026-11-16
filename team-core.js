/* Team mode for the Feature Prioritization Scorecard: the parts with no Firebase and no page code, tested in
   tests/team-core.test.mjs. Used by team-session.html.

   A session copies a scorecard's criteria ({ name, weight 0-5, cost }) and feature names. Everyone scores every
   feature on every criterion, 1 to 5, alone. Nobody sees anyone else's scores until the facilitator reveals them.
   Then each feature shows each person's score (0 to 100, worked out exactly as the Scorecard does), the spread
   between the highest and the lowest, and which criterion they disagreed on most. The facilitator starts the team's
   agreed scores from the average and saves the ranking.

   Session statuses: 'scoring' -> 'revealed' (can go back to 'scoring') -> 'agreed'. */
(function (root) {
  'use strict';

  const MAX_FEATURES = 30, MAX_CRITERIA = 8, MAX_NAME = 80, MAX_TITLE = 100;
  const DISCUSS = 25, SOME_GAP = 15;   // spread in points (0 to 100)

  const clean = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max || MAX_NAME);
  const clamp = (n, lo, hi, d) => { n = Math.round(Number(n)); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

  // A session's setup from a saved scorecard (ScorecardCore.decode(...) output, or anything with criteria and features).
  function fromScorecard(sc, title) {
    sc = sc || {};
    const criteria = (Array.isArray(sc.criteria) ? sc.criteria : []).slice(0, MAX_CRITERIA)
      .map(c => ({ name: clean(c.name), weight: clamp(c.weight, 0, 5, 3), cost: !!c.cost })).filter(c => c.name);
    const features = (Array.isArray(sc.features) ? sc.features : []).map(f => clean(typeof f === 'string' ? f : f && f.name))
      .filter(Boolean).slice(0, MAX_FEATURES);
    return { title: clean(title || sc.title || 'Team scoring', MAX_TITLE), criteria: criteria, features: features };
  }

  // Is a setup worth starting? At least two features and one weighted criterion.
  function setupProblem(setup) {
    if (!setup.features || setup.features.length < 2) return 'Add at least two features to score.';
    if (!setup.criteria || !setup.criteria.some(c => c.weight > 0)) return 'Add at least one criterion with a weight.';
    return '';
  }

  // One person's scores as stored: a row per feature, a 1-5 (or 0: not scored yet) per criterion.
  function blankScores(setup) { return setup.features.map(() => setup.criteria.map(() => 0)); }
  // Stored in Firestore (which has no lists inside lists) as a string per feature, a digit per criterion: "52".
  function normalizeScores(setup, raw) {
    const rows = Array.isArray(raw) ? raw : [];
    const row = (r) => typeof r === 'string' ? r.split('') : (Array.isArray(r) ? r : []);
    return setup.features.map((_, i) => setup.criteria.map((__, j) => clamp(row(rows[i])[j], 0, 5, 0)));
  }
  function encodeScores(setup, scores) { return normalizeScores(setup, scores).map(r => r.join('')); }
  // How many of the feature-by-criterion cells are scored, and whether all of them are.
  function progress(setup, scores) {
    const s = normalizeScores(setup, scores), total = setup.features.length * setup.criteria.length;
    const done = s.reduce((a, r) => a + r.filter(v => v > 0).length, 0);
    return { done: done, total: total, complete: total > 0 && done === total };
  }

  // A feature's 0-100 score from one row of 1-5 scores: the Scorecard's weighted average (a cost counts the other way).
  function featureScore(criteria, row) {
    const total = criteria.reduce((a, c) => a + c.weight, 0);
    if (!total) return 0;
    const pts = criteria.reduce((a, c, j) => {
      const raw = clamp(row[j], 1, 5, 3), v = c.cost ? 6 - raw : raw;
      return a + c.weight * (v - 1) / (4 * total) * 100;
    }, 0);
    return Math.round(pts);
  }

  const level = (spread) => spread >= DISCUSS ? 'discuss' : spread >= SOME_GAP ? 'gap' : 'agreed';
  const LEVEL_LABEL = { discuss: 'Discuss', gap: 'Some gap', agreed: 'Agreed' };

  /* The reveal. people: [{ uid, name, scores }] (only complete ones count).
     Returns { people: [{ uid, name }], features: [{ index, name, scores: [0-100 per person], avg, lo, hi, spread, level,
     label, split: { criterion, cost, high: [names], low: [names], highVal, lowVal } }] sorted biggest spread first,
     discuss: the top two worth discussing, agreed: features everyone is close on, best first }. */
  function reveal(setup, people) {
    const ppl = (people || []).filter(p => progress(setup, p.scores).complete)
      .map(p => ({ uid: p.uid, name: clean(p.name) || 'Someone', scores: normalizeScores(setup, p.scores) }));
    const features = setup.features.map((name, i) => {
      const scores = ppl.map(p => featureScore(setup.criteria, p.scores[i]));
      const lo = scores.length ? Math.min.apply(null, scores) : 0, hi = scores.length ? Math.max.apply(null, scores) : 0;
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      // the criterion they disagreed on most: the widest range of raw scores, weighted by how much it counts
      let split = null, best = -1;
      setup.criteria.forEach((c, j) => {
        const vals = ppl.map(p => p.scores[i][j]);
        if (!vals.length) return;
        const h = Math.max.apply(null, vals), l = Math.min.apply(null, vals), w = (h - l) * c.weight;
        if (w > best && h > l) {
          best = w;
          split = { criterion: c.name, cost: c.cost, highVal: h, lowVal: l,
            high: ppl.filter(p => p.scores[i][j] === h).map(p => p.name), low: ppl.filter(p => p.scores[i][j] === l).map(p => p.name) };
        }
      });
      const spread = hi - lo, lv = level(spread);
      return { index: i, name: name, scores: scores, avg: avg, lo: lo, hi: hi, spread: spread, level: lv, label: LEVEL_LABEL[lv], split: split };
    });
    const bySpread = features.slice().sort((a, b) => b.spread - a.spread || b.avg - a.avg || a.index - b.index);
    return {
      people: ppl.map(p => ({ uid: p.uid, name: p.name })),
      features: bySpread,
      discuss: bySpread.filter(f => f.level === 'discuss').slice(0, 2),
      agreed: features.filter(f => f.level === 'agreed').sort((a, b) => b.avg - a.avg)
    };
  }

  // "Mobile app: 40 points apart. Dana scored Customer value 5, Marcus 2."
  function discussLine(f) {
    let s = f.name + ': ' + f.spread + ' points apart.';
    if (f.split) s += ' ' + f.split.high.join(' and ') + ' scored ' + f.split.criterion + ' ' + f.split.highVal + ', ' +
      f.split.low.join(' and ') + ' ' + f.split.lowVal + '. Ask what each of them is seeing.';
    return s;
  }

  // The starting point for the team's agreed scores: each criterion's average, rounded (1-5).
  function consensus(setup, people) {
    const ppl = (people || []).filter(p => progress(setup, p.scores).complete).map(p => normalizeScores(setup, p.scores));
    return setup.features.map((_, i) => setup.criteria.map((__, j) => {
      if (!ppl.length) return 3;
      return clamp(ppl.reduce((a, s) => a + s[i][j], 0) / ppl.length, 1, 5, 3);
    }));
  }
  // Agreed scores as stored ("43" per feature) or as rows, back to rows of 1-5.
  function agreedRows(setup, raw) { return normalizeScores(setup, raw).map(r => r.map(v => v || 3)); }

  // The agreed ranking: [{ index, name, score, rank }], best first (equal scores share a rank).
  function ranking(setup, agreed) {
    agreed = agreedRows(setup, agreed);
    const rows = setup.features.map((name, i) => ({ index: i, name: name, score: featureScore(setup.criteria, (agreed || [])[i] || []) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    rows.forEach((r, k) => { r.rank = k && rows[k - 1].score === r.score ? rows[k - 1].rank : k + 1; });
    return rows;
  }

  // The agreed result as a Scorecard (for ScorecardCore.encode, so it can be saved to My Toolkits).
  function toScorecard(setup, agreed) {
    agreed = agreedRows(setup, agreed);
    return { title: setup.title, method: 'weighted', template: 'balanced',
      criteria: setup.criteria.map(c => ({ name: c.name, weight: c.weight, cost: c.cost })),
      features: setup.features.map((name, i) => ({ name: name, scores: setup.criteria.map((_, j) => clamp(((agreed || [])[i] || [])[j], 1, 5, 3)),
        rice: { reach: 0, impact: 1, confidence: 80, effort: 1 } })) };
  }

  // A session id: 20 letters and digits, so a link can't be guessed.
  function newId(rand) {
    const a = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 20; i++) s += a[Math.floor((rand || Math.random)() * a.length)];
    return s;
  }

  root.TeamCore = { MAX_FEATURES, MAX_CRITERIA, DISCUSS, SOME_GAP, fromScorecard, setupProblem, blankScores, normalizeScores, encodeScores, agreedRows, progress,
    featureScore, reveal, discussLine, consensus, ranking, toScorecard, newId };
})(typeof globalThis !== 'undefined' ? globalThis : window);
