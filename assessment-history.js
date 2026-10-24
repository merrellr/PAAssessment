/* Every assessment a learner has taken, so a retake (or combining two accounts) adds to their history
   instead of replacing it. Pure logic, tested on its own (tests/assessment-history.test.mjs).

   The progress document keeps the latest result in assessmentResult (what the dashboard, lessons and
   plan use) and the past ones in assessmentHistory: a list of
     { submittedAt, tier, overallPct, categoryPct, assessmentId }      (no answers, to stay small)
   oldest first, at most MAX. Older accounts have no list yet: list() also counts their latest result
   and the first attempt kept on it (firstSubmittedAt, firstOverallPct, firstTier, with no area scores;
   marked partial), so nothing they already had is lost. */
(function (root) {
  'use strict';
  const MAX = 50;
  const time = (v) => { const n = Date.parse(v || ''); return isFinite(n) ? n : 0; };

  function entry(r) {
    if (!r || typeof r !== 'object' || !isFinite(Number(r.overallPct))) return null;
    const e = { submittedAt: r.submittedAt || r.firstSubmittedAt || '', tier: String(r.tier || ''), overallPct: Math.round(Number(r.overallPct)) };
    if (r.categoryPct && typeof r.categoryPct === 'object') {
      e.categoryPct = {};
      Object.keys(r.categoryPct).forEach(k => { const v = Number(r.categoryPct[k]); if (isFinite(v)) e.categoryPct[k] = Math.round(v); });
    }
    if (r.assessmentId) e.assessmentId = String(r.assessmentId);
    if (r.partial) e.partial = true;
    return e;
  }

  // One attempt counts once: the same assessmentId; or, when one of them has none (older results, and the
  // first attempt kept on an older account), the same score saved within a few minutes of each other: the
  // results spreadsheet and the account record the same attempt seconds apart.
  const SAME_MS = 15 * 60000;
  function sameAttempt(a, b) {
    if (a.assessmentId && b.assessmentId) return a.assessmentId === b.assessmentId;
    if (!a.submittedAt || !b.submittedAt) return false;
    const gap = Math.abs(time(a.submittedAt) - time(b.submittedAt));
    return gap === 0 || (gap <= SAME_MS && a.overallPct === b.overallPct);
  }

  // Adds each entry unless it's already there; a full entry replaces a partial one for the same attempt.
  function union(lists) {
    const out = [];
    lists.forEach(list => (list || []).forEach(raw => {
      const e = entry(raw);
      if (!e) return;
      const i = out.findIndex(x => sameAttempt(x, e));
      if (i < 0) out.push(e);
      else if ((out[i].partial && !e.partial) || (!out[i].categoryPct && e.categoryPct)) out[i] = Object.assign({}, e, { assessmentId: e.assessmentId || out[i].assessmentId });
      else if (!out[i].assessmentId && e.assessmentId) out[i].assessmentId = e.assessmentId;
    }));
    out.sort((a, b) => time(a.submittedAt) - time(b.submittedAt));
    return out.slice(-MAX);
  }

  // Every attempt the document knows about, oldest first.
  function list(doc) {
    doc = doc || {};
    const latest = doc.assessmentResult || null;
    const first = latest && latest.firstSubmittedAt && latest.firstOverallPct !== undefined && time(latest.firstSubmittedAt) !== time(latest.submittedAt)
      ? { submittedAt: latest.firstSubmittedAt, tier: latest.firstTier, overallPct: latest.firstOverallPct, partial: true } : null;
    return union([doc.assessmentHistory, first ? [first] : [], latest ? [latest] : []]);
  }

  // The history to save after a new result (already given its submittedAt).
  function add(doc, result) { return union([list(doc), [result]]); }

  // Two accounts' histories together (combining accounts).
  function combine(a, b) { return union([list(a), list(b)]); }

  root.AssessHistory = { MAX, entry, list, add, combine };
})(typeof globalThis !== 'undefined' ? globalThis : window);
