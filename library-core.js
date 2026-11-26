// library-core.js: everything Learning has, in one list (lessons, lesson audio, practice by area and the toolkits),
// and Compass's three picks from it, each with the reason. No DOM: library-ui.js draws it, tests/library-core.test.mjs
// checks it. ctx is the coach's context (areas, pct, log, progress, bank); audio is /audio/lessons/index.json
// ({ 'course-n': { duration } }); tools is SavedToolsCore.TOOLS; plan is PlanCore.status(...) or null.
(function (root) {
  var C = root.CoachCore;
  var LEVEL = { novice: 'Novice', moderate: 'Moderate', experienced: 'Experienced', advanced: 'Advanced' };
  // which toolkit puts an area into practice on your own work
  var AREA_TOOL = { prioritization: 'scorecard', strategy: 'bbp', execution: 'impact', aiIndividual: 'ai', aiOrg: 'ready', discovery: 'scorecard', stakeholder: 'impact' };
  var KINDS = { lesson: 'Lesson', listen: 'Listen', article: 'Article', practice: 'Practice', tool: 'Toolkit' };

  function areaName(ctx, d) { return (ctx.areas || {})[d] || d; }
  function mins(sec) { return Math.max(1, Math.round(sec / 60)); }

  // Every item. Lessons in course order (area, then level); a lesson with audio also appears as a Listen item.
  function items(ctx, audio, tools) {
    var lessons = (ctx.bank && ctx.bank.lessons) || {}, out = [], articles = (root.CompanyCore && root.CompanyCore.COURSE_ARTICLES) || {};
    Object.keys(ctx.areas || {}).forEach(function (d) {
      C.TIERS.forEach(function (tier) {
        var cid = d + '-' + tier, done = C.doneIds(ctx.progress, cid);
        (lessons[cid] || []).forEach(function (l) {
          var title = l.title.replace(/^Lesson \d+:\s*/, ''), href = '/lesson?course=' + cid + '&lesson=' + l.id, a = audio && audio[cid + '-' + l.id];
          var base = { d: d, area: areaName(ctx, d), course: cid, lesson: l.id, level: LEVEL[tier], title: title, done: done.indexOf(l.id) > -1 };
          out.push(Object.assign({ kind: 'lesson', min: l.min, href: href }, base));
          if (a && a.duration) out.push(Object.assign({ kind: 'listen', min: mins(a.duration), href: href + '&listen=1' }, base));
        });
      });
      C.TIERS.forEach(function (tier) {   // the course's companion article (CompanyCore.COURSE_ARTICLES), where there is one
        var url = articles[d + '-' + tier];
        if (url) out.push({ kind: 'article', d: d, area: areaName(ctx, d), course: d + '-' + tier, level: LEVEL[tier], title: 'Companion article: ' + areaName(ctx, d) + ', ' + LEVEL[tier], min: 8, href: url, ext: true, done: false });
      });
      out.push({ kind: 'practice', d: d, area: areaName(ctx, d), title: 'Practice: ' + areaName(ctx, d), min: 10, href: '/practice?area=' + d, done: false });
    });
    Object.keys(tools || {}).forEach(function (k) {
      var t = tools[k], areas = Object.keys(AREA_TOOL).filter(function (d) { return AREA_TOOL[d] === k; });
      out.push({ kind: 'tool', tool: k, d: areas[0] || null, area: areas.map(function (d) { return areaName(ctx, d); }).join(', '), title: t.name, blurb: t.blurb, min: 15, href: '/my-tools', done: false });
    });
    return out;
  }

  // Compass's three picks: what to read next, something to listen to, and a toolkit to use it on your own work.
  function picks(ctx, all, plan) {
    var areas = C.readiness(ctx), next = C.nextStep(ctx), out = [], used = {};
    var need = areas.filter(function (a) { return a.status === 'attention'; }), dev = areas.filter(function (a) { return a.status === 'developing'; });
    var focus = (plan && !plan.over && plan.week && plan.week.d) || next.area || (need[0] && need[0].key) || (areas[0] && areas[0].key);
    var add = function (it, why) { if (it && !used[it.kind + it.href]) { used[it.kind + it.href] = 1; out.push(Object.assign({}, it, { why: why })); } };
    var firstLeft = function (kind, d) { return all.filter(function (x) { return x.kind === kind && x.d === d && !x.done; })[0]; };
    var PHRASE = { attention: 'needs attention', developing: 'is developing', strong: 'is strong', unknown: 'hasn’t been checked yet' };
    var status = function (d) { var a = areas.filter(function (x) { return x.key === d; })[0]; return a ? PHRASE[a.status] : ''; };

    // 1. read: the plan's next lesson, else the next lesson in the area Compass would work on
    var pn = plan && plan.next && plan.next.k === 'lesson' ? all.filter(function (x) { return x.kind === 'lesson' && x.course === plan.next.course && x.lesson === plan.next.lesson; })[0] : null;
    if (pn) add(pn, 'Next in your study plan.');
    else if (focus) {
      var l = C.lessonFor(ctx, focus), li = l && all.filter(function (x) { return x.kind === 'lesson' && x.course === l.courseId && x.lesson === l.lesson; })[0];
      add(li || firstLeft('lesson', focus), areaName(ctx, focus) + ' ' + (status(focus) || 'is where Compass would start') + ', and this is the next lesson there.');
    }
    // 2. listen: a lesson in a developing area (or the next focus area), for when you're away from a screen
    var ld = (dev[0] && dev[0].key) || (need[1] && need[1].key) || focus;
    var lis = firstLeft('listen', ld);
    if (lis && out[0] && lis.href.indexOf(out[0].href) === 0) lis = all.filter(function (x) { return x.kind === 'listen' && x.d === ld && !x.done && x.href.indexOf(out[0].href) !== 0; })[0];
    add(lis, 'Listen on the go: ' + (lis ? lis.min : '') + ' min on ' + areaName(ctx, ld) + (status(ld) ? ', which ' + status(ld) : '') + '.');
    // 3. use it: the toolkit for the focus area, on your own work
    var tool = all.filter(function (x) { return x.kind === 'tool' && x.tool === AREA_TOOL[focus]; })[0];
    add(tool, 'Put ' + areaName(ctx, focus) + ' to work on something real: your work saves to My Toolkits.');
    // fill up with practice if anything was missing
    if (out.length < 3 && focus) add(firstLeft('practice', focus), 'A short practice session shows where you stand.');
    return out.slice(0, 3);
  }

  // Browse: filter by kind, area and words. q matches the title, the area or the level.
  function filter(all, f) {
    var words = String(f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter(function (x) {
      if (f.kind && f.kind !== 'all' && x.kind !== f.kind) return false;
      if (f.d && f.d !== 'all' && (x.kind === 'tool' ? AREA_TOOL[f.d] !== x.tool : x.d !== f.d)) return false;
      var hay = (x.title + ' ' + x.area + ' ' + (x.level || '') + ' ' + (x.blurb || '')).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    });
  }

  root.LibraryCore = { KINDS: KINDS, AREA_TOOL: AREA_TOOL, items: items, picks: picks, filter: filter };
})(typeof window !== 'undefined' ? window : globalThis);
