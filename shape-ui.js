// shape-ui.js: "My shape" on My Learning (My readiness tab, #shapePanel) and a line on Home's readiness card
// (#homeShapeLine). A radial petal chart of the 28 competencies, grouped by area (petal length: level; shade: how
// much evidence), the target role as a dashed outline, the top three gaps with the next lesson, and every
// competency in a table.
//   ShapeUI.render(ctx, { roles, roleId, personal, save: function ({ roleId, personal }) { return Promise } })
// ctx: { pct, log, progress, bank }.
(function (root) {
  var S = root.ShapeCore, K = root.CompetencyCore;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var ARROW = '<span aria-hidden="true"> →</span>';
  var AREAS = ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg'];
  var AREA_SHORT = { discovery: 'Discovery', strategy: 'Strategy', prioritization: 'Prioritization', execution: 'Execution', stakeholder: 'Stakeholders', aiIndividual: 'AI (you)', aiOrg: 'AI (org)' };
  var AREA_PRACTICE = function (a) { return '/practice?area=' + a; };
  var LEVEL = ['Not yet known', 'Limited', 'Moderate', 'Lots of', 'Advanced'];
  var STRENGTH = { none: 'No evidence yet', thin: 'Thin evidence', some: 'Some evidence', strong: 'Strong evidence' };
  var state = { ctx: null, opts: null, placed: null };

  function lvLabel(x) { return x ? LEVEL[Math.max(1, Math.min(4, Math.round(x)))] + ' (' + x.toFixed(1) + ')' : 'Not yet known'; }

  // ---------------------------------------------------------------- the petal chart
  function chart(rows, roleTitle, small) {
    var W = small ? 180 : 440, c = W / 2, r0 = small ? 14 : 36, R = small ? 74 : 150;
    var GAP = 0.7, unit = 360 / (28 + 7 * GAP), out = [];
    var rad = function (deg) { return (deg - 90) * Math.PI / 180; };
    var pt = function (r, deg) { return (c + r * Math.cos(rad(deg))).toFixed(1) + ',' + (c + r * Math.sin(rad(deg))).toFixed(1); };
    var rOf = function (lv) { return r0 + (R - r0) * Math.max(0, Math.min(4, lv)) / 4; };
    var wedge = function (ra, rb, a, b) { return 'M' + pt(ra, a) + 'L' + pt(rb, a) + 'A' + rb + ',' + rb + ' 0 0 1 ' + pt(rb, b) + 'L' + pt(ra, b) + 'A' + ra + ',' + ra + ' 0 0 0 ' + pt(ra, a) + 'Z'; };
    if (!small) for (var g = 1; g <= 4; g++) out.push('<circle class="sh-ring" cx="' + c + '" cy="' + c + '" r="' + rOf(g) + '"/>');
    var ang = 0;
    AREAS.forEach(function (a) {
      var group = rows.filter(function (r) { return r.area === a; }), a0 = ang, tpath = [];
      group.forEach(function (r) {
        var s = ang + unit * 0.08, e = ang + unit * 0.92;
        if (r.level) out.push('<path class="sh-petal s-' + r.strength + '" d="' + wedge(r0, rOf(r.level), s, e) + '"><title>' + esc(r.name + ': ' + lvLabel(r.level) + (r.target ? ', target ' + LEVEL[r.target] : '') + '. ' + STRENGTH[r.strength] + '.') + '</title></path>');
        else out.push('<path class="sh-petal s-none" d="' + wedge(r0, r0 + 4, s, e) + '"><title>' + esc(r.name + ': not yet known') + '</title></path>');
        if (r.target) tpath.push([rOf(r.target), ang, ang + unit]);
        ang += unit;
      });
      // the target: a dashed, stepped outline across the area's petals
      if (tpath.length) {
        var d = 'M' + pt(tpath[0][0], tpath[0][1]);
        tpath.forEach(function (p, i) { if (i) d += 'L' + pt(p[0], p[1]); d += 'A' + p[0] + ',' + p[0] + ' 0 0 1 ' + pt(p[0], p[2]); });
        out.push('<path class="sh-target" d="' + d + '"/>');
      }
      if (!small) {
        var mid = (a0 + ang) / 2, lr = R + 20, x = c + lr * Math.cos(rad(mid)), y = c + lr * Math.sin(rad(mid));
        var anchor = Math.abs(x - c) < 12 ? 'middle' : x > c ? 'start' : 'end';
        out.push('<path class="sh-band" d="' + wedge(R + 6, R + 9, a0 + unit * 0.08, ang - unit * 0.08) + '"/>');
        out.push('<text class="sh-area" x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(AREA_SHORT[a]) + '</text>');
      }
      ang += unit * GAP;
    });
    var pad = small ? 4 : 64;
    var known = rows.filter(function (r) { return r.level; }).length;
    return '<svg class="sh-svg' + (small ? ' sm' : '') + '" viewBox="' + (-pad) + ' ' + (small ? -pad : -14) + ' ' + (W + pad * 2) + ' ' + (W + (small ? pad * 2 : 28)) + '" role="img" aria-label="' +
      esc('Skills shape: ' + known + ' of 28 competencies known' + (roleTitle ? ', with ' + roleTitle + ' as a dashed outline' : '') + '. Every competency is in the table below.') + '">' + out.join('') + '</svg>';
  }

  // ---------------------------------------------------------------- the panel
  function roleOptions(roles, id) {
    var groups = {}; (roles || []).forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    return '<option value=""' + (id ? '' : ' selected') + '>Choose a role…</option>' + Object.keys(groups).map(function (g) {
      return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === id ? ' selected' : '') + '>' + esc(r.title) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
  }
  function view(lv, role, cmp) {
    var known = lv.filter(function (c) { return c.level; }).length;
    var rows = cmp ? cmp.rows : lv;
    var gaps = !role ? '<div class="sh-empty"><p><b>Pick a role</b> to see your shape against it, and the gaps worth closing first.</p></div>'
      : !cmp.top.length ? '<p class="sh-ok">You’re at or above ' + esc(role.title) + ' in every competency we have evidence for. Try a more senior role to see what’s next.</p>'
      : '<ol class="sh-gaps">' + cmp.top.map(function (g) {
        return '<li><div class="sh-g-top"><b>' + esc(g.name) + '</b><span class="sh-g-area">' + esc(AREA_SHORT[g.area]) + '</span></div>' +
          '<p class="sh-g-lv">' + (g.level ? 'You: ' + esc(LEVEL[Math.max(1, Math.round(g.level))]) : 'Not yet known') + ' · ' + esc(role.title) + ': ' + esc(LEVEL[g.target]) + ' <span class="sh-str">' + esc(STRENGTH[g.strength]) + '</span></p>' +
          '<p class="sh-g-what">' + esc((K.BY[g.key].levels[g.target - 1] || '')) + '</p>' +
          '<div class="sh-g-go">' + (g.next ? '<a class="cc-btn sm" href="' + esc(g.next.href) + '" data-shape-go="lesson">Next: ' + esc(g.next.title) + '</a>' : '') +
          '<a class="cc-btn ghost sm" href="' + AREA_PRACTICE(g.area) + '" data-shape-go="practice">Practise</a></div></li>';
      }).join('') + '</ol>';
    var table = '<details class="sh-all"><summary>All 28 competencies</summary><div class="sh-tw"><table><thead><tr><th scope="col">Competency</th><th scope="col">Area</th><th scope="col">You</th>' + (role ? '<th scope="col">' + esc(role.title) + '</th>' : '') + '<th scope="col">Evidence</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr class="' + (r.status ? 'st-' + r.status : '') + '"><th scope="row">' + esc(r.name) + '</th><td>' + esc(AREA_SHORT[r.area]) + '</td><td>' + esc(lvLabel(r.level)) + '</td>' +
          (role ? '<td>' + (r.target ? esc(LEVEL[r.target]) + (r.status === 'met' ? ' <span class="sh-met">✓</span>' : '') : '–') + '</td>' : '') + '<td>' + esc(STRENGTH[r.strength]) + '</td></tr>';
      }).join('') + '</tbody></table></div></details>';
    var placed = state.placed;
    return '<section class="card sh-card" aria-labelledby="shT"><div class="sh-head"><div><span class="eyebrow">My shape</span><h2 id="shT">Your skills shape</h2>' +
      '<p class="cc-muted">28 competencies under the seven skill areas, from your skill check, practice and lessons. Like readiness, it isn’t a grade: it moves as you practise.</p></div>' +
      '<div class="sh-target-pick"><label for="shRole">Measured against</label><select id="shRole">' + roleOptions(state.opts.roles, role ? role.id : '') + '</select>' +
      '<button type="button" class="linklike" id="shPlace">Place me automatically</button>' +
      (placed ? '<p class="sh-placed" role="status">' + (placed.none ? 'Not enough to go on yet: take the skill check or a few practice sessions first.' :
        'Your shape is ' + (placed.fit === 'close' ? 'closest to' : 'nearest to') + ' <b>' + esc(placed.role.title) + '</b>.' + (role && role.id === placed.role.id ? '' : ' <button type="button" class="linklike" id="shUsePlaced">Measure against it</button>')) + '</p>' : '') +
      '</div></div>' +
      '<div class="sh-body"><figure class="sh-fig">' + chart(rows, role && role.title) +
      '<figcaption class="sh-legend"><span><i class="sh-k s-strong"></i>Your level (darker: more evidence)</span>' + (role ? '<span><i class="sh-k k-target"></i>' + esc(role.title) + '</span>' : '') + '<span class="cc-muted">' + known + ' of 28 known</span></figcaption></figure>' +
      '<div class="sh-side"><h3>' + (role ? 'Top gaps to ' + esc(role.title) : 'Your gaps') + '</h3>' + gaps +
      (cmp ? '<p class="cc-muted sh-count">' + cmp.met + ' of ' + cmp.total + ' competencies at or above the role.</p>' : '') + '</div></div>' + table + '</section>';
  }

  function draw() {
    var ctx = state.ctx, opts = state.opts;
    var lv = S.levels({ pct: ctx.pct, log: ctx.log, progress: ctx.progress, questions: ctx.questions });
    var role = opts.roleId && root.RolesCore ? root.RolesCore.roleById(opts.roles, opts.roleId) : null;
    var targets = role && root.RolesCore ? root.RolesCore.targetsFor(role, opts.personal) : null;
    var cmp = role ? S.compare(lv, S.targetsFor(targets), ctx.progress, ctx.bank) : null;
    var p = $('shapePanel');
    if (p) { p.innerHTML = view(lv, role, cmp); wire(lv); }
    var h = $('homeShapeLine');
    if (h) {
      var known = lv.filter(function (c) { return c.level; }).length;
      h.innerHTML = known ? '<a class="hs-line" href="/my-learning#readiness" data-shape-go="home"><span class="hs-mini" aria-hidden="true">' + chart(cmp ? cmp.rows : lv, null, true) + '</span><span><b>My skills shape</b><br><span class="cc-muted">' +
        (cmp ? cmp.met + ' of ' + cmp.total + ' at ' + esc(role.title) + (cmp.top[0] ? ' · biggest gap: ' + esc(cmp.top[0].name) : '') : known + ' of 28 competencies known · pick a role to compare') + '</span></span></a>' : '';
      h.hidden = !known;
    }
    return { levels: lv, role: role, compare: cmp };
  }
  function wire(lv) {
    var sel = $('shRole');
    if (sel) sel.onchange = function () { pick(sel.value, '#shRole'); };
    var pl = $('shPlace');
    if (pl) pl.onclick = function () {
      var res = S.place(lv, state.opts.roles);
      state.placed = res || { none: true };
      if (root.PAAnalytics) root.PAAnalytics.event('shape_place', { role: res ? res.role.id : 'none' });
      draw(); var f = $('shUsePlaced') || $('shPlace'); if (f) f.focus();
    };
    var use = $('shUsePlaced');
    if (use) use.onclick = function () { pick(state.placed.role.id, '#shRole'); };
  }
  function pick(id, focusSel) {
    state.opts.roleId = id;
    if (root.PAAnalytics) root.PAAnalytics.event('shape_role', { role: id || 'none' });
    var done = function () { draw(); var f = document.querySelector(focusSel); if (f) f.focus(); };
    Promise.resolve(state.opts.save && state.opts.save({ roleId: id, personal: state.opts.personal || {} })).then(done, done);
  }

  function render(ctx, opts) {
    if (!S || !K) return null;
    state.ctx = ctx; state.opts = opts || {}; state.placed = null;
    if (!state.ctx.questions) state.ctx.questions = ((ctx.bank && ctx.bank.questions) || []).concat((root.CoachCharts && root.CoachCharts.questions) || []);
    return draw();
  }

  root.ShapeUI = { render: render, chart: chart };
})(typeof window !== 'undefined' ? window : globalThis);
