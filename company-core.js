/* Pure logic shared by the owner console (owner.html) and the company admin
   dashboard (company.html). It has no Firebase and no page code in it, so it
   can be tested on its own (tests/company-core.test.mjs).

   Two parts:
   1. Invite and people helpers, moved here from owner.html so both pages use
      one copy.
   2. The team report: what "assessed", "learning" and "finished" mean, how a
      person's progress is counted, and the numbers shown to company admins. */
(function (root) {
  'use strict';

  const DOMAINS = [
    ['discovery', 'Customer & Market Discovery'],
    ['strategy', 'Product Strategy & Roadmapping'],
    ['prioritization', 'Prioritization & Trade-offs'],
    ['execution', 'Execution & Delivery'],
    ['stakeholder', 'Stakeholder Communication & Influence'],
    ['aiIndividual', 'AI Fluency — Individual'],
    ['aiOrg', 'AI Fluency — Organizational']
  ];
  const labels = {};
  DOMAINS.forEach(d => { labels[d[0]] = d[1]; });
  const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

  function domainLabel(key) { return labels[key] || key; }

  /* ------------------------------------------------------------ invites */
  // One person per line: email, then optional name, then optional phone,
  // separated by commas, tabs or semicolons. A header line is ignored, and a
  // line written as "name, email" is understood too.
  function parseInviteLines(text) {
    const entries = [], errors = [], seen = {};
    String(text || '').split(/\r?\n/).forEach((raw, idx) => {
      const line = raw.trim();
      if (!line) return;
      const cells = line.split(/[,\t;]/).map(s => s.trim().replace(/^"|"$/g, '').trim());
      if (idx === 0 && /^e-?mail/i.test(cells[0]) && cells[0].indexOf('@') === -1) return;
      let emailAt = cells.findIndex(c => c.indexOf('@') !== -1);
      if (emailAt === -1) emailAt = 0;
      const email = (cells[emailAt] || '').toLowerCase();
      const others = cells.filter((c, i) => i !== emailAt);
      if (!EMAIL_RE.test(email) || email.length > 254) {
        errors.push({ line: idx + 1, text: line, reason: 'Not a valid email address' });
        return;
      }
      if (seen[email]) {
        errors.push({ line: idx + 1, text: line, reason: 'Listed more than once' });
        return;
      }
      seen[email] = true;
      entries.push({ email: email, name: (others[0] || '').slice(0, 100), phone: (others[1] || '').slice(0, 40) });
    });
    return { entries: entries, errors: errors };
  }

  // Splits parsed entries into ones to invite and ones to skip because the
  // person is already active in this company or already has an open invite.
  function classifyInvites(entries, activeEmails, openInviteEmails) {
    const active = {}, open = {};
    (activeEmails || []).forEach(e => { active[String(e).toLowerCase()] = true; });
    (openInviteEmails || []).forEach(e => { open[String(e).toLowerCase()] = true; });
    const toCreate = [], skipped = [];
    entries.forEach(en => {
      if (active[en.email]) skipped.push({ email: en.email, reason: 'Already a member of this company' });
      else if (open[en.email]) skipped.push({ email: en.email, reason: 'Already has an open invite' });
      else toCreate.push(en);
    });
    return { toCreate: toCreate, skipped: skipped };
  }

  function inviteStatus(inv, nowMs) {
    if (inv.status === 'used') return 'used';
    if (inv.status === 'revoked') return 'revoked';
    const exp = inv.expiresAtMs;
    if (typeof exp === 'number' && exp < nowMs) return 'expired';
    return 'open';
  }

  // Seats count every ACTIVE person (admins and members). Pending invites are
  // shown separately and only warn, they do not block.
  function seatInfo(org, activeCount, pendingInvites, newInvites) {
    const limit = org.plan === 'seat' ? (org.seatLimit || 0) : null;
    const wanted = activeCount + pendingInvites + (newInvites || 0);
    // available: seats not taken by an active person or held by a waiting invitation (null on a flat plan)
    return { limit: limit, active: activeCount, pending: pendingInvites, wouldExceed: limit !== null && wanted > limit,
      available: limit === null ? null : Math.max(0, limit - activeCount - pendingInvites) };
  }

  // The three counts at the top of a company card: active, pending and available seats.
  function seatCounts(org, activeCount, pendingInvites) {
    const s = seatInfo(org, activeCount, pendingInvites, 0);
    return [
      { key: 'active', n: s.active, label: 'Active' + (s.limit !== null && s.active > s.limit ? ' (over the limit)' : ''), warn: s.limit !== null && s.active > s.limit },
      { key: 'pending', n: s.pending, label: 'Pending' },
      s.limit === null
        ? { key: 'available', n: '∞', label: 'Available (flat plan)' }
        : { key: 'available', n: s.available, label: 'Available of ' + s.limit, warn: s.wouldExceed }
    ];
  }

  const ORDER = { active: 0, invited: 1, expired: 2, removed: 3 };

  // Combines memberships and invites into one list of people for one role.
  function buildPeopleRows(role, memberships, invites, nowMs) {
    const rows = [];
    memberships.forEach(m => {
      if (m.role !== role) return;
      rows.push({ kind: 'member', id: m.id, role: role, name: m.displayName || '', email: m.email || '', phone: m.phone || '',
        status: m.status === 'removed' ? 'removed' : 'active', dateMs: m.joinedAtMs || 0 });
    });
    invites.forEach(inv => {
      if (inv.role !== role) return;
      const st = inviteStatus(inv, nowMs);
      if (st === 'used' || st === 'revoked') return;
      rows.push({ kind: 'invite', id: inv.id, token: inv.id, role: role, name: inv.name || '', email: inv.email || '', phone: inv.phone || '',
        status: st === 'open' ? 'invited' : 'expired', dateMs: inv.createdAtMs || 0, expiresAtMs: inv.expiresAtMs || 0 });
    });
    rows.sort((a, b) => (ORDER[a.status] - ORDER[b.status]) || (a.name || a.email).toLowerCase().localeCompare((b.name || b.email).toLowerCase()));
    return rows;
  }

  function randomToken() {
    const bytes = new Uint8Array(16);
    (root.crypto || root.msCrypto).getRandomValues(bytes);
    return Array.prototype.map.call(bytes, b => ('0' + b.toString(16)).slice(-2)).join('');
  }

  /* --------------------------------------------------------- spreadsheets */
  // A cell that starts with = + - @ can be run as a formula when the file is
  // opened in a spreadsheet, and names and free-text answers come from other
  // people. Such cells get a leading apostrophe. Plain numbers and phone
  // numbers (digits, spaces, brackets, dots, dashes) are left alone.
  function csvCell(v) {
    let s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function buildInviteCsv(rows) {
    const lines = [['Email', 'Name', 'Phone', 'Role', 'Invite link', 'Expires'].map(csvCell).join(',')];
    rows.forEach(r => lines.push([r.email, r.name, r.phone, r.role, r.link, r.expires].map(csvCell).join(',')));
    return lines.join('\r\n');
  }

  /* ------------------------------------------------------ course catalogue */
  // Course ids look like "aiOrg-moderate": a skill area, then a level.
  const TIER_SLUGS = ['novice', 'moderate', 'experienced', 'advanced'];
  const LEVEL_LABELS = { novice: 'Limited Experience', moderate: 'Moderate Experience', experienced: 'Lots of Experience', advanced: 'Advanced Experience' };

  // How many lessons each course really has (the files in content/). Kept in
  // step with those files by tests/company-core.test.mjs, which fails if a
  // course gains or loses a lesson without this table being updated.
  const LESSON_COUNTS = {
    'discovery-novice': 5, 'discovery-moderate': 5, 'discovery-experienced': 6, 'discovery-advanced': 5,
    'strategy-novice': 5, 'strategy-moderate': 5, 'strategy-experienced': 5, 'strategy-advanced': 5,
    'prioritization-novice': 5, 'prioritization-moderate': 5, 'prioritization-experienced': 5, 'prioritization-advanced': 5,
    'execution-novice': 5, 'execution-moderate': 6, 'execution-experienced': 5, 'execution-advanced': 5,
    'stakeholder-novice': 5, 'stakeholder-moderate': 4, 'stakeholder-experienced': 4, 'stakeholder-advanced': 5,
    'aiIndividual-novice': 5, 'aiIndividual-moderate': 5, 'aiIndividual-experienced': 6, 'aiIndividual-advanced': 5,
    'aiOrg-novice': 5, 'aiOrg-moderate': 5, 'aiOrg-experienced': 6, 'aiOrg-advanced': 5
  };

  // The companion article for the courses that have one (12 of 28). Kept in step
  // with the files in content/ by tests/company-core.test.mjs, which fails if a
  // course's sourceUrl changes without this table being updated.
  const COURSE_ARTICLES = {
    'aiIndividual-advanced': 'https://www.linkedin.com/pulse/day-life-product-manager-working-ai-agents-2026-edition-merrell-uwsic',
    'aiIndividual-experienced': 'https://www.linkedin.com/pulse/how-run-product-discovery-ai-agents-without-losing-voice-merrell-mvrdc',
    'aiIndividual-moderate': 'https://www.linkedin.com/pulse/from-roadmaps-rituals-how-agentic-ai-rewriting-job-merrell-mism-r8pnc',
    'aiIndividual-novice': 'https://www.linkedin.com/pulse/ai-project-its-practice-heres-how-build-one-robert-merrell-4skoc',
    'aiOrg-advanced': 'https://www.linkedin.com/pulse/beyond-automation-win-customers-life-robert-merrell-bxltc',
    'aiOrg-experienced': 'https://www.linkedin.com/pulse/agentic-ai-internal-product-building-pm-copilots-your-robert-merrell-jlepc',
    'aiOrg-moderate': 'https://www.linkedin.com/pulse/stop-enabling-individuals-start-organization-robert-merrell-uoboc/',
    'aiOrg-novice': 'https://www.linkedin.com/pulse/your-first-ai-product-team-designing-squad-agents-just-robert-merrell-vudmc',
    'discovery-experienced': 'https://www.linkedin.com/pulse/overcoming-common-pitfalls-early-stage-product-saas-robert-merrell-eshlc',
    'execution-moderate': 'https://www.linkedin.com/pulse/improving-accessibility-ai-tools-innovations-making-life-merrell-wndmc',
    'prioritization-experienced': 'https://www.linkedin.com/pulse/feature-fallacy-why-shipping-more-isnt-helping-your-do-merrell-mism-ozcbc',
    'strategy-advanced': 'https://www.linkedin.com/pulse/how-build-product-focused-ai-agents-actually-make-merrell-mism-rmu8c'
  };

  function prettyCourseId(id) {
    const s = String(id);
    const i = s.lastIndexOf('-');
    const area = i > -1 ? s.slice(0, i) : s;
    const level = i > -1 ? s.slice(i + 1) : '';
    const areaLabel = labels[area] || (area.charAt(0).toUpperCase() + area.slice(1));
    return level ? areaLabel + ' · ' + (LEVEL_LABELS[level] || level) : areaLabel;
  }

  // The same thresholds the learner's own dashboard uses.
  function tierSlugForPct(pct) {
    if (pct > 75) return 'advanced';
    if (pct > 50) return 'experienced';
    if (pct > 25) return 'moderate';
    return 'novice';
  }

  /* ----------------------------------------------------- a person's progress */
  const INACTIVE_DAYS = 30;

  // The courses assigned to someone: for each skill area, the level they
  // tested at and every level above it (as on their own dashboard).
  function assignedCourses(assessment) {
    const out = [];
    if (!assessment) return out;
    const cat = assessment.categoryPct || {};
    DOMAINS.forEach(d => {
      const from = TIER_SLUGS.indexOf(tierSlugForPct(Number(cat[d[0]]) || 0));
      TIER_SLUGS.forEach((slug, i) => {
        if (i < from) return;
        const id = d[0] + '-' + slug;
        out.push({ id: id, domain: d[0], tier: slug, lessons: LESSON_COUNTS[id] || 0 });
      });
    });
    return out;
  }

  // Lessons finished in one course, counting only lessons that exist.
  function lessonsDone(courses, id) {
    const total = LESSON_COUNTS[id] || 0;
    const c = courses && courses[id];
    const seen = {};
    ((c && c.completed) || []).forEach(n => { if (Number.isInteger(n) && n >= 1 && n <= total) seen[n] = true; });
    return Object.keys(seen).length;
  }

  /* Boils one shared record down to the facts the admin pages show.
     share:      the orgs/{orgId}/members/{uid} document, or null
     joinedAtMs: when they joined, used when they have never been active
     nowMs:      the current time */
  function memberProgress(share, joinedAtMs, nowMs) {
    const a = share && share.assessment ? share.assessment : null;
    const courses = (share && share.courses) || {};

    const plan = assignedCourses(a);
    let planTotal = 0, planDone = 0, planFinished = 0;
    const planCourses = plan.map(c => {
      const done = Math.min(lessonsDone(courses, c.id), c.lessons);
      planTotal += c.lessons;
      planDone += done;
      const finished = c.lessons > 0 && done >= c.lessons;
      if (finished) planFinished++;
      return { id: c.id, domain: c.domain, tier: c.tier, lessons: c.lessons, done: done, finished: finished };
    });

    let anyLessons = 0;
    Object.keys(courses).forEach(id => { anyLessons += lessonsDone(courses, id); });

    let status;
    if (a && planTotal > 0 && planDone >= planTotal) status = 'finished';
    else if (anyLessons > 0) status = 'learning';
    else if (a) status = 'assessed';
    else status = 'not_assessed';

    const lastActiveAt = share && share.lastActiveAt ? share.lastActiveAt : null;
    const lastMs = lastActiveAt ? Date.parse(lastActiveAt) : null;
    const since = Number.isFinite(lastMs) ? lastMs : (joinedAtMs || null);
    const quiet = since !== null && (nowMs - since) > INACTIVE_DAYS * 86400000;

    const overallPct = a && typeof a.overallPct === 'number' ? a.overallPct : null;
    return {
      hasShare: !!share,
      anonymous: !!share && share.identity === null,
      assessed: !!a,
      tierSlug: overallPct !== null ? tierSlugForPct(overallPct) : null,
      tierLabel: a ? (a.tier || (overallPct !== null ? LEVEL_LABELS[tierSlugForPct(overallPct)] : null)) : null,
      overallPct: overallPct === null ? null : Math.round(overallPct),
      categoryPct: a && a.categoryPct ? a.categoryPct : null,
      answers: a && Array.isArray(a.answers) ? a.answers : [],
      takenAt: a && a.submittedAt ? a.submittedAt : null,
      planCourses: planCourses,
      planTotal: planTotal,
      planDone: planDone,
      planPct: planTotal > 0 ? Math.round(planDone / planTotal * 100) : null,
      coursesFinished: planFinished,
      coursesAssigned: planCourses.length,
      lessonsDoneAll: anyLessons,
      status: status,
      lastActiveAt: lastActiveAt,
      inactive: status !== 'finished' && quiet
    };
  }

  const STATUS_LABELS = {
    not_assessed: 'Not assessed yet',
    assessed: 'Assessed, not started',
    learning: 'Learning',
    finished: 'Finished their plan'
  };

  // One row per membership, with the person's progress worked out.
  // memberships: [{ id, role, status, displayName, email, phone, joinedAtMs }]
  // shares:      { uid: shareDocument }
  function buildTeamRows(memberships, shares, nowMs) {
    return memberships.map(m => {
      const share = shares && shares[m.id] ? shares[m.id] : null;
      const p = memberProgress(share, m.joinedAtMs, nowMs);
      const named = (share && share.identity && share.identity.name) || m.displayName || '';
      const email = (share && share.identity && share.identity.email) || m.email || '';
      return {
        id: m.id,
        role: m.role,
        status: m.status === 'removed' ? 'removed' : 'active',
        name: named,
        email: email,
        phone: m.phone || '',
        joinedAtMs: m.joinedAtMs || 0,
        endedAtMs: m.endedAtMs || 0,
        removedIdentity: !named && !email,
        progress: p
      };
    });
  }

  function filterTeamRows(rows, term, statusFilter) {
    const t = String(term || '').trim().toLowerCase();
    return rows.filter(r => {
      if (t && (r.name + ' ' + r.email).toLowerCase().indexOf(t) === -1) return false;
      if (!statusFilter || statusFilter === 'all') return true;
      if (statusFilter === 'inactive') return r.progress.inactive;
      return r.progress.status === statusFilter;
    });
  }

  /* ----------------------------------------------------------- the roll-up */
  // Numbers for the top of the dashboard. `rows` are the ACTIVE people only.
  function rollup(rows) {
    const out = {
      people: rows.length, assessed: 0, notAssessed: 0, assessedNotStarted: 0, learning: 0, finished: 0, inactive: 0,
      byTier: TIER_SLUGS.map(s => ({ slug: s, label: LEVEL_LABELS[s], count: 0 })),
      avgOverall: null, avgPlanPct: null,
      domains: DOMAINS.map(d => ({ key: d[0], label: d[1], avg: null, n: 0 })),
      weakest: null, strongest: null
    };
    let overallSum = 0, overallN = 0, planSum = 0, planN = 0;
    const domSum = {}, domN = {};
    rows.forEach(r => {
      const p = r.progress;
      if (p.assessed) out.assessed++; else out.notAssessed++;
      if (p.status === 'assessed') out.assessedNotStarted++;
      if (p.status === 'learning') out.learning++;
      if (p.status === 'finished') out.finished++;
      if (p.inactive) out.inactive++;
      if (p.tierSlug) out.byTier[TIER_SLUGS.indexOf(p.tierSlug)].count++;
      if (p.overallPct !== null) { overallSum += p.overallPct; overallN++; }
      if (p.planPct !== null) { planSum += p.planPct; planN++; }
      if (p.categoryPct) {
        DOMAINS.forEach(d => {
          const v = p.categoryPct[d[0]];
          if (typeof v === 'number') { domSum[d[0]] = (domSum[d[0]] || 0) + v; domN[d[0]] = (domN[d[0]] || 0) + 1; }
        });
      }
    });
    out.avgOverall = overallN ? Math.round(overallSum / overallN) : null;
    out.avgPlanPct = planN ? Math.round(planSum / planN) : null;
    out.domains.forEach(d => {
      if (domN[d.key]) { d.n = domN[d.key]; d.avg = Math.round(domSum[d.key] / domN[d.key]); }
    });
    const scored = out.domains.filter(d => d.avg !== null);
    if (scored.length >= 2) {
      out.weakest = scored.reduce((lo, d) => (d.avg < lo.avg ? d : lo));
      out.strongest = scored.reduce((hi, d) => (d.avg > hi.avg ? d : hi));
    }
    return out;
  }

  /* ----------------------------------------------------------- focus areas */
  // New companies start with every skill area ranked in the framework's own
  // order. The ranking only breaks ties in a member's recommendations, so a
  // company that wants real emphasis moves its chosen areas to the top.
  const DEFAULT_FOCUS_ORDER = DOMAINS.map(d => d[0]);
  const FOCUS_TOP = 3;   // "our focus" for the progress number = the top three ranked areas

  function moveItem(list, index, delta) {
    const target = index + delta;
    if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list.slice();
    const copy = list.slice();
    const tmp = copy[index]; copy[index] = copy[target]; copy[target] = tmp;
    return copy;
  }

  function availableFocus(list) {
    return DOMAINS.map(d => d[0]).filter(k => list.indexOf(k) === -1);
  }

  function placeFocus(list, key, index) {
    if (!(key in labels)) return list.slice();
    const without = list.filter(k => k !== key);
    const i = Math.max(0, Math.min(index, without.length));
    without.splice(i, 0, key);
    return without;
  }

  function removeFocus(list, key) { return list.filter(k => k !== key); }

  // True when a company has actually chosen something: a list that is not
  // empty and not just the standard order. Only then does it affect anyone's
  // recommendations, so a company that never touched it changes nothing.
  function focusIsCustom(list) {
    return Array.isArray(list) && list.length > 0 && list.join() !== DEFAULT_FOCUS_ORDER.join();
  }

  // Where a skill area sits in a company's ranking (0 = top). Areas that are
  // not ranked come after every ranked one.
  function focusRank(list, key) {
    const i = Array.isArray(list) ? list.indexOf(key) : -1;
    return i === -1 ? 99 : i;
  }

  // "Progress on our focus": for each ranked area, how much of the team's
  // assigned lessons in it are done, and one headline figure for the top areas.
  // rows are the ACTIVE people with their progress worked out.
  function focusProgress(rows, list) {
    const areas = (list || []).map((key, i) => ({ key: key, label: domainLabel(key), rank: i + 1, done: 0, total: 0, pct: null }));
    const byKey = {};
    areas.forEach(a => { byKey[a.key] = a; });
    let assessed = 0;
    rows.forEach(r => {
      const p = r.progress;
      if (!p.assessed) return;
      assessed++;
      p.planCourses.forEach(c => {
        const a = byKey[c.domain];
        if (a) { a.done += c.done; a.total += c.lessons; }
      });
    });
    areas.forEach(a => { a.pct = a.total > 0 ? Math.round(a.done / a.total * 100) : null; });
    const top = areas.slice(0, FOCUS_TOP);
    const done = top.reduce((s, a) => s + a.done, 0);
    const total = top.reduce((s, a) => s + a.total, 0);
    return {
      areas: areas, assessed: assessed, custom: focusIsCustom(list),
      top: { keys: top.map(a => a.key), done: done, total: total, pct: total > 0 ? Math.round(done / total * 100) : null }
    };
  }

  /* ------------------------------------------------------------ activity log */
  // What admins and the owner did, kept in orgs/{id}/audit (see firestore.rules).
  const AUDIT_ACTIONS = ['company.created', 'company.edited', 'company.archived', 'company.restored',
    'invite.created', 'invite.revoked', 'invite.renewed', 'member.removed', 'focus.changed'];

  // The fields of one log entry. The page adds the server's time ("at").
  function buildAuditEntry(actor, action, targetEmail, detail) {
    return {
      action: action,
      actorUid: actor.uid,
      actorEmail: String(actor.email || '').toLowerCase(),
      targetEmail: String(targetEmail || '').slice(0, 254),
      detail: String(detail || '').slice(0, 300)
    };
  }

  // One plain sentence for an entry, without who did it.
  function describeAudit(e) {
    const who = e.targetEmail || 'someone';
    switch (e.action) {
      case 'company.created': return 'created the company';
      case 'company.edited': return 'edited the company details';
      case 'company.archived': return 'archived the company';
      case 'company.restored': return 'restored the company';
      case 'invite.created': return 'invited ' + who + (e.detail ? ' (' + e.detail + ')' : '');
      case 'invite.revoked': return 'withdrew the invitation to ' + who;
      case 'invite.renewed': return 'sent a new invitation to ' + who;
      case 'member.removed': return 'removed ' + who + ' from the company';
      case 'focus.changed': return 'changed the focus priorities' + (e.detail ? ': ' + e.detail : '');
      default: return e.action || 'did something';
    }
  }

  /* ---------------------------------------------------------- the exports */
  function isoDay(ms) {
    return ms ? new Date(ms).toISOString().slice(0, 10) : '';
  }

  function buildTeamCsv(rows) {
    const head = ['Name', 'Email', 'Role', 'Status', 'Inactive 30+ days', 'Overall level', 'Overall %']
      .concat(DOMAINS.map(d => d[1] + ' %'))
      .concat(['Lessons done in plan', 'Lessons in plan', 'Plan complete %', 'Courses finished', 'Courses assigned', 'Last active', 'Joined']);
    const lines = [head.map(csvCell).join(',')];
    rows.forEach(r => {
      const p = r.progress;
      const cells = [
        r.name, r.email, r.role === 'admin' ? 'Admin' : 'Member',
        r.status === 'removed' ? 'Former member' : STATUS_LABELS[p.status], p.inactive ? 'Yes' : '',
        p.tierLabel || '', p.overallPct === null ? '' : p.overallPct
      ];
      DOMAINS.forEach(d => {
        const v = p.categoryPct ? p.categoryPct[d[0]] : null;
        cells.push(typeof v === 'number' ? Math.round(v) : '');
      });
      cells.push(p.assessed ? p.planDone : '', p.assessed ? p.planTotal : '', p.planPct === null ? '' : p.planPct,
        p.assessed ? p.coursesFinished : '', p.assessed ? p.coursesAssigned : '',
        p.lastActiveAt ? p.lastActiveAt.slice(0, 10) : '', isoDay(r.joinedAtMs));
      lines.push(cells.map(csvCell).join(','));
    });
    return lines.join('\r\n');
  }

  function buildAnswersCsv(rows) {
    const lines = [['Name', 'Email', 'Assessment taken', 'Question #', 'Category', 'Question', 'Answer', 'Points'].map(csvCell).join(',')];
    rows.forEach(r => {
      const p = r.progress;
      p.answers.forEach(x => {
        lines.push([r.name, r.email, p.takenAt ? p.takenAt.slice(0, 10) : '', x.n, x.cat, x.question, x.answer, x.points].map(csvCell).join(','));
      });
    });
    return lines.join('\r\n');
  }

  root.CompanyCore = {
    DOMAINS, EMAIL_RE, TIER_SLUGS, LEVEL_LABELS, LESSON_COUNTS, COURSE_ARTICLES, STATUS_LABELS, INACTIVE_DAYS,
    domainLabel, parseInviteLines, classifyInvites, inviteStatus, seatInfo, seatCounts, buildPeopleRows, randomToken,
    csvCell, buildInviteCsv, prettyCourseId, tierSlugForPct,
    assignedCourses, lessonsDone, memberProgress, buildTeamRows, filterTeamRows, rollup, buildTeamCsv, buildAnswersCsv,
    AUDIT_ACTIONS, buildAuditEntry, describeAudit,
    DEFAULT_FOCUS_ORDER, FOCUS_TOP, moveItem, availableFocus, placeFocus, removeFocus, focusIsCustom, focusRank, focusProgress
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
