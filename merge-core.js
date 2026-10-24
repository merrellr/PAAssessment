/* Combining two learning accounts into one (My Profile → Ways to sign in → "Combine your two accounts").
   Pure logic (no Firebase, no page code), tested on its own (tests/merge-core.test.mjs).

   combine(main, other) takes the two progress documents and returns the one the main account keeps.
   Nothing is lost that either account earned; where only one value can stay, the rule is:
     courses          every lesson finished in either; for each note (reflection), the main account's,
                      or the other's where the main one has none; the newest updatedAt; lastLesson and
                      the rest from whichever account touched the course last
     assessmentResult the most recent one (submittedAt), with the first-ever attempt (firstSubmittedAt,
                      firstOverallPct, firstTier) from whichever account took it first
     assessmentHistory every assessment either account took (assessment-history.js, when loaded)
     badges           every badge either earned, with the earliest date
     activeLog        every day either was active
     lessonLog        lessons per day, added together
     totalActiveMs    added together
     profile          the main account's, with blanks filled in from the other's
     agreedToTermsAt  the earliest; hasSeenWelcome if either has
     everything else  (goals, check-in emails, company list, settings) the main account's, or the
                      other's where the main one has none */
(function (root) {
  'use strict';

  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const time = (v) => { const n = Date.parse(v || ''); return isFinite(n) ? n : 0; };
  const blank = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);

  function course(a, b) {
    if (!a) return Object.assign({}, b);
    if (!b) return Object.assign({}, a);
    const newer = time(b.updatedAt) > time(a.updatedAt) ? b : a, older = newer === a ? b : a;
    const out = Object.assign({}, older, newer);
    const done = {};
    (a.completed || []).concat(b.completed || []).forEach(n => { done[n] = Number(n); });
    out.completed = Object.keys(done).map(k => done[k]).filter(n => isFinite(n)).sort((x, y) => x - y);
    const notes = Object.assign({}, obj(b.reflections));
    Object.keys(obj(a.reflections)).forEach(k => { if (!blank(a.reflections[k])) notes[k] = a.reflections[k]; });
    if (Object.keys(notes).length) out.reflections = notes;
    const up = Math.max(time(a.updatedAt), time(b.updatedAt));
    if (up) out.updatedAt = new Date(up).toISOString();
    return out;
  }

  function assessment(a, b) {
    if (!a || !b) return a || b || null;
    const latest = time(b.submittedAt) > time(a.submittedAt) ? b : a;
    const firstOf = (x) => time(x.firstSubmittedAt || x.submittedAt) || Infinity;
    const first = firstOf(b) < firstOf(a) ? b : a;
    const out = Object.assign({}, latest);
    out.firstSubmittedAt = first.firstSubmittedAt || first.submittedAt || latest.firstSubmittedAt;
    out.firstOverallPct = first.firstOverallPct !== undefined ? first.firstOverallPct : first.overallPct;
    out.firstTier = first.firstTier || first.tier;
    return out;
  }

  function combine(main, other) {
    main = obj(main); other = obj(other);
    const out = Object.assign({}, other, main);
    Object.keys(other).forEach(k => { if (blank(main[k]) && !blank(other[k])) out[k] = other[k]; });

    const courses = {};
    Object.keys(Object.assign({}, obj(other.courses), obj(main.courses))).forEach(id => {
      courses[id] = course(obj(main.courses)[id], obj(other.courses)[id]);
    });
    out.courses = courses;

    const a = assessment(main.assessmentResult || null, other.assessmentResult || null);
    if (a) out.assessmentResult = a; else delete out.assessmentResult;
    if (root.AssessHistory){
      const h = root.AssessHistory.combine(main, other);
      if (h.length) out.assessmentHistory = h; else delete out.assessmentHistory;
    }

    const badges = Object.assign({}, obj(other.badges));
    Object.keys(obj(main.badges)).forEach(id => {
      const x = main.badges[id], y = badges[id];
      badges[id] = !y || (time(x) && time(x) < time(y)) ? x : y;
    });
    if (Object.keys(badges).length) out.badges = badges;

    const active = Object.assign({}, obj(other.activeLog), obj(main.activeLog));
    if (Object.keys(active).length) out.activeLog = active;
    const lessons = {};
    [main.lessonLog, other.lessonLog].forEach(log => Object.keys(obj(log)).forEach(d => { lessons[d] = (lessons[d] || 0) + (Number(log[d]) || 0); }));
    if (Object.keys(lessons).length) out.lessonLog = lessons;

    const ms = (Number(main.totalActiveMs) || 0) + (Number(other.totalActiveMs) || 0);
    if (ms) out.totalActiveMs = ms;

    const profile = Object.assign({}, obj(main.profile));
    Object.keys(obj(other.profile)).forEach(k => { if (blank(profile[k])) profile[k] = other.profile[k]; });
    if (Object.keys(profile).length) out.profile = profile;

    const terms = [main.agreedToTermsAt, other.agreedToTermsAt].filter(time).sort((x, y) => time(x) - time(y))[0];
    if (terms) out.agreedToTermsAt = terms;
    if (main.hasSeenWelcome || other.hasSeenWelcome) out.hasSeenWelcome = true;
    return out;
  }

  // The tools to vote for on the main account: those the other voted for and the main one did not.
  function votesToMove(mainToolIds, otherToolIds) {
    const have = {};
    (mainToolIds || []).forEach(id => { have[id] = 1; });
    return (otherToolIds || []).filter((id, i, all) => !have[id] && all.indexOf(id) === i);
  }

  root.MergeCore = { combine, votesToMove };
})(typeof globalThis !== 'undefined' ? globalThis : window);
