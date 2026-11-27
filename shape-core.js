// shape-core.js: "My shape", a learner's level in each of the 28 competencies (competencies-core.js) and how it
// compares with a role. A level is 0 (not known yet) or 0.5 to 4, on the course levels (Limited 1, Moderate 2,
// Lots of 3, Advanced 4), from three kinds of evidence:
//   - the skill check: the area's level is the starting point for its four competencies (it counts as 2 answers);
//   - practice: each answer to a question tagged to the competency, at that question's level (right: that level;
//     a miss: one below), the last 10 counting;
//   - lessons finished: finishing a lesson at a level means at least half a level below it.
// Evidence strength says how much is behind each level: thin, some or strong. No DOM: shape-ui.js draws it,
// tests/shape-core.test.mjs checks it. Needs competencies-core.js (and roles-core.js for roles).
(function (root) {
  var K = root.CompetencyCore;
  var TIERS = ['novice', 'moderate', 'experienced', 'advanced'];
  var PRIOR_WEIGHT = 2, RECENT = 10;

  function areaLevelFromPct(p) { return typeof p !== 'number' ? 0 : p > 75 ? 4 : p > 50 ? 3 : p > 25 ? 2 : 1; }
  function done(progress, cid) { var c = progress && progress.courses && progress.courses[cid]; return (c && c.completed) || []; }
  function round(x) { return Math.round(x * 10) / 10; }

  // ctx: { pct: { area: % }, log: answers, progress, questions: [bank questions incl. charts] }
  function levels(ctx) {
    var byId = {}; (ctx.questions || []).forEach(function (q) { byId[q.id] = q; });
    var ev = {}; K.LIST.forEach(function (c) { ev[c.key] = { pts: [], lessons: 0, lessonLevel: 0 }; });
    (ctx.log || []).forEach(function (e) {
      var q = e && byId[e.id]; if (!q) return;
      var t = TIERS.indexOf(q.tier) + 1; if (!t) return;
      K.forQuestion(q).forEach(function (k) { ev[k].pts.push(e.ok ? t : Math.max(0.5, t - 1)); });
    });
    Object.keys(K.LESSONS).forEach(function (cid) {
      var t = TIERS.indexOf(cid.split('-').pop()) + 1, d = done(ctx.progress, cid);
      K.LESSONS[cid].forEach(function (tags, i) {
        if (d.indexOf(i + 1) < 0) return;
        tags.forEach(function (k) { ev[k].lessons++; ev[k].lessonLevel = Math.max(ev[k].lessonLevel, t); });
      });
    });
    return K.LIST.map(function (c) {
      var e = ev[c.key], prior = areaLevelFromPct(ctx.pct ? ctx.pct[c.area] : undefined);
      var recent = e.pts.slice(-RECENT), n = recent.length, sum = recent.reduce(function (a, b) { return a + b; }, 0);
      var w = prior ? PRIOR_WEIGHT : 0, level = w + n ? (prior * w + sum) / (w + n) : 0;
      if (e.lessonLevel) level = Math.max(level, e.lessonLevel - 0.5);
      var weight = n + e.lessons * 0.5 + (prior ? 2 : 0);
      return { key: c.key, area: c.area, name: c.name, level: round(level), prior: prior, answers: e.pts.length, recent: n,
        lessons: e.lessons,
        strength: !level ? 'none' : weight >= 10 ? 'strong' : weight >= 4 ? 'some' : 'thin' };
    });
  }

  // A role's target for each competency: the area target (role targets are per area; C3 adds per-competency ones).
  function targetsFor(areaTargets) {
    var out = {}; K.LIST.forEach(function (c) { var t = areaTargets && areaTargets[c.area]; out[c.key] = t ? (typeof t === 'object' ? t.target : t) : 0; });
    return out;
  }

  // Compared with a role: each competency's gap (target - level, when the target is above), and the top gaps,
  // biggest first, each with the next lesson that builds it (not done yet, from the level just above where they are).
  function compare(lv, targets, progress, bank) {
    var rows = lv.map(function (c) { var t = targets[c.key] || 0; return Object.assign({}, c, { target: t, gap: t && c.level ? round(t - c.level) : t ? t : 0, status: !t ? 'none' : !c.level ? 'unknown' : c.level >= t ? 'met' : t - c.level <= 0.5 ? 'close' : 'below' }); });
    var gaps = rows.filter(function (r) { return r.target && r.gap > 0.25; }).sort(function (a, b) { return b.gap - a.gap || a.level - b.level; });
    var top = gaps.slice(0, 3).map(function (r) { return Object.assign({}, r, { next: nextLesson(r, progress, bank) }); });
    var withTarget = rows.filter(function (r) { return r.target; });
    return { rows: rows, top: top, met: withTarget.filter(function (r) { return r.status === 'met'; }).length, total: withTarget.length };
  }
  // From the level just above where they are, then any level; the competency's own area first, then lessons in other
  // areas that also build it.
  function nextLesson(r, progress, bank) {
    var from = Math.max(0, Math.min(3, Math.floor(r.level || 0)));
    var areas = [r.area].concat(Object.keys(K.LESSONS).map(function (cid) { return cid.replace(/-[a-z]+$/, ''); }).filter(function (a, i, all) { return a !== r.area && all.indexOf(a) === i; }));
    for (var pass = 0; pass < 2; pass++) {
      for (var ai = 0; ai < areas.length; ai++) {
        for (var t = pass ? 0 : from; t < 4; t++) {
          var cid = areas[ai] + '-' + TIERS[t], tags = K.LESSONS[cid] || [], d = done(progress, cid), ls = (bank && bank.lessons && bank.lessons[cid]) || [];
          for (var i = 0; i < tags.length; i++) {
            if (tags[i].indexOf(r.key) > -1 && d.indexOf(i + 1) < 0) {
              var l = ls[i];
              return { course: cid, lesson: i + 1, title: l ? l.title.replace(/^Lesson \d+:\s*/, '') : 'Lesson ' + (i + 1), href: '/lesson?course=' + cid + '&lesson=' + (i + 1) };
            }
          }
        }
      }
    }
    return null;
  }

  // "Place me automatically": the role whose targets this shape is closest to (only areas with a known level count),
  // and how many of its competency targets are met. roles: RolesCore.rolesFor(...).
  function place(lv, roles) {
    var known = lv.filter(function (c) { return c.level; });
    if (known.length < 8) return null;   // too little to go on
    var best = null;
    (roles || []).forEach(function (r) {
      var d = 0; known.forEach(function (c) { var t = r.targets[c.area] || 0; if (t) d += (c.level - t) * (c.level - t); });
      d = d / known.length;
      if (!best || d < best.d) best = { role: r, d: d };
    });
    return best ? { role: best.role, fit: best.d < 0.35 ? 'close' : best.d < 1 ? 'fair' : 'loose' } : null;
  }

  // Each area's average level, for a quick summary.
  function areaAverages(lv) {
    var out = {}; lv.forEach(function (c) { if (!c.level) return; (out[c.area] = out[c.area] || []).push(c.level); });
    Object.keys(out).forEach(function (a) { out[a] = round(out[a].reduce(function (x, y) { return x + y; }, 0) / out[a].length); });
    return out;
  }

  root.ShapeCore = { levels: levels, targetsFor: targetsFor, compare: compare, place: place, areaAverages: areaAverages, areaLevelFromPct: areaLevelFromPct };
})(typeof window !== 'undefined' ? window : globalThis);
