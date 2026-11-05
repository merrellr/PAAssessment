/* Role targets: the level a role should reach in each of the seven skill areas, and where a learner stands.
   Pure logic (no Firebase, no page code), tested in tests/roles-core.test.mjs. Needs company-core.js first.

   - A standard list of roles, each with a target level per skill area (ROLES). A company can change a
     standard role's targets or add its own roles (orgRoles, below), and assign each person a role.
   - A learner can add personal targets on top: a personal target raises the role's target in that area.
   - A target is met when the latest assessment places the learner at that level or above, OR they have
     finished that area's course at that level or above. Above target: past the target level.

   Levels are 1 to 4: Limited, Moderate, Lots of, Advanced Experience (the four course levels). */
(function (root) {
  'use strict';
  const C = root.CompanyCore;
  const AREAS = C.DOMAINS.map(d => d[0]);
  const AREA_LABELS = {};
  C.DOMAINS.forEach(d => { AREA_LABELS[d[0]] = d[1]; });
  const TIERS = ['novice', 'moderate', 'experienced', 'advanced'];
  const LEVELS = ['Limited Experience', 'Moderate Experience', 'Lots of Experience', 'Advanced Experience'];
  const SHORT = ['Limited', 'Moderate', 'Lots', 'Advanced'];

  // targets in area order: discovery, strategy, prioritization, execution, stakeholder, aiIndividual, aiOrg
  const t = (a) => { const o = {}; AREAS.forEach((k, i) => { o[k] = a[i]; }); return o; };
  const ROLES = [
    { id: 'apm', title: 'Associate Product Manager', group: 'Product ladder', targets: t([2, 1, 2, 2, 2, 2, 1]) },
    { id: 'pm', title: 'Product Manager', group: 'Product ladder', targets: t([3, 2, 3, 3, 2, 3, 2]) },
    { id: 'spm', title: 'Senior Product Manager', group: 'Product ladder', targets: t([3, 3, 3, 3, 3, 3, 2]) },
    { id: 'gpm', title: 'Group or Principal Product Manager', group: 'Product ladder', targets: t([4, 4, 3, 3, 4, 3, 3]) },
    { id: 'head', title: 'Head of Product, Director or VP', group: 'Product ladder', targets: t([3, 4, 4, 3, 4, 3, 4]) },
    { id: 'po', title: 'Product Owner', group: 'Working with product', targets: t([2, 2, 3, 3, 2, 2, 1]) },
    { id: 'partner', title: 'Designer or Engineer partnering with product', group: 'Working with product', targets: t([3, 1, 2, 2, 2, 2, 1]) },
    { id: 'exec', title: 'Executive sponsor', group: 'Working with product', targets: t([2, 3, 3, 2, 3, 2, 4]) }
  ];

  const clampLevel = (v) => { const n = Math.round(Number(v)); return n >= 1 && n <= 4 ? n : 0; };
  function cleanTargets(raw) {
    const out = {};
    AREAS.forEach(k => { const v = clampLevel(raw && raw[k]); if (v) out[k] = v; });
    return out;
  }

  /* The roles a person can be given: the standard ones with a company's changes, then the company's own.
     orgRoles: { roleId: { title, targets, hidden } } (orgs/{id}.roles). A standard id changes that role
     (hidden: true leaves it out); any other id adds a role. Ids are lowercase letters, digits and dashes. */
  function rolesFor(orgRoles) {
    const extra = orgRoles && typeof orgRoles === 'object' ? orgRoles : {};
    const out = [];
    ROLES.forEach(r => {
      const o = extra[r.id];
      if (o && o.hidden) return;
      out.push({ id: r.id, title: (o && String(o.title || '').trim().slice(0, 80)) || r.title, group: r.group,
        targets: Object.assign({}, r.targets, cleanTargets(o && o.targets)), standard: true, changed: !!(o && (o.title || o.targets)) });
    });
    Object.keys(extra).filter(id => /^[a-z0-9-]{1,40}$/.test(id) && !ROLES.some(r => r.id === id)).sort().forEach(id => {
      const o = extra[id] || {};
      const title = String(o.title || '').trim().slice(0, 80);
      if (!title || o.hidden) return;
      out.push({ id: id, title: title, group: 'Your company', targets: cleanTargets(o.targets), standard: false, changed: true });
    });
    return out;
  }
  const roleById = (list, id) => (list || []).filter(r => r.id === id)[0] || null;

  /* Where someone stands in each area (0 = not yet known, else 1 to 4), from the assessment and from courses.
     assessment: { categoryPct }; courses: progress.courses. */
  function levels(assessment, courses) {
    const cat = (assessment && assessment.categoryPct) || null;
    const out = {};
    AREAS.forEach(k => {
      const fromAssessment = cat && cat[k] !== undefined ? TIERS.indexOf(C.tierSlugForPct(Number(cat[k]) || 0)) + 1 : 0;
      let fromCourses = 0;
      TIERS.forEach((slug, i) => {
        const id = k + '-' + slug, total = C.LESSON_COUNTS[id] || 0;
        if (total && C.lessonsDone(courses || {}, id) >= total) fromCourses = Math.max(fromCourses, i + 1);
      });
      out[k] = { level: Math.max(fromAssessment, fromCourses), fromAssessment, fromCourses, by: fromCourses > fromAssessment ? 'course' : fromAssessment ? 'assessment' : '' };
    });
    return out;
  }

  /* The targets that apply: the role's, raised by any personal target. { area: { target, source } }
     source: 'role', 'personal' (no role target, or the personal one is higher) or 'both' (they agree). */
  function targetsFor(role, personal) {
    const p = cleanTargets(personal);
    const r = (role && role.targets) || {};
    const out = {};
    AREAS.forEach(k => {
      const a = clampLevel(r[k]), b = p[k] || 0;
      if (!a && !b) return;
      out[k] = { target: Math.max(a, b), source: !b || b < a ? 'role' : !a || b > a ? 'personal' : 'both', role: a };
    });
    return out;
  }

  /* Each area with its target and where the learner stands, plus the totals the badges count.
     status: 'above' (past the target), 'met', 'below', 'unknown' (no assessment and no course finished). */
  function evaluate(targets, lv) {
    const rows = AREAS.filter(k => targets[k]).map(k => {
      const target = targets[k].target, cur = (lv[k] && lv[k].level) || 0;
      const status = !cur ? 'unknown' : cur > target ? 'above' : cur === target ? 'met' : 'below';
      return { area: k, label: AREA_LABELS[k], target, level: cur, by: (lv[k] && lv[k].by) || '', status, source: targets[k].source,
        course: k + '-' + TIERS[Math.min(target, 4) - 1], targetLabel: LEVELS[target - 1], levelLabel: cur ? LEVELS[cur - 1] : 'Not yet known' };
    });
    const met = rows.filter(r => r.status === 'met' || r.status === 'above').length;
    const roleRows = rows.filter(r => r.source !== 'personal');
    const personalRows = rows.filter(r => r.source !== 'role');
    return {
      rows,
      total: rows.length,
      met,
      above: rows.filter(r => r.status === 'above').length,
      roleMet: roleRows.length > 0 && roleRows.every(r => r.status === 'met' || r.status === 'above'),
      personalMet: personalRows.filter(r => r.status === 'met' || r.status === 'above').length,
      pct: rows.length ? Math.round(met / rows.length * 100) : 0
    };
  }

  // Everything for one learner. input: { roleId, orgRoles, personal, assessment, courses }
  function forLearner(input) {
    const list = rolesFor(input.orgRoles);
    const role = roleById(list, input.roleId);
    const targets = targetsFor(role, input.personal);
    return Object.assign({ role, roles: list }, evaluate(targets, levels(input.assessment, input.courses)));
  }

  /* For a progress document: the role (a company's assignment wins over the learner's own choice) and the
     personal targets in progress.targets = { roleId, personal: { area: level } }. null when there are none.
     opts: { orgRoles, assignedRoleId } */
  function forProgress(progress, assessment, opts) {
    opts = opts || {};
    const tg = (progress && progress.targets) || {};
    const roleId = opts.assignedRoleId || tg.roleId || '';
    if (!roleId && !Object.keys(cleanTargets(tg.personal)).length) return null;
    return forLearner({ roleId, orgRoles: opts.orgRoles, personal: tg.personal, assessment, courses: (progress && progress.courses) || {} });
  }

  root.RolesCore = { AREAS, AREA_LABELS, LEVELS, SHORT, TIERS, ROLES, cleanTargets, rolesFor, roleById, levels, targetsFor, evaluate, forLearner, forProgress };
})(typeof window !== 'undefined' ? window : globalThis);
