/* ==================================================================
   notify.gs: GENERATED, do not edit here.
   ------------------------------------------------------------------
   The check-in and company-report logic, shared with the website:
   company-core.js, company-report.js, notify-core.js, assessment-history.js.
   Rebuild with: node tools/build-notify-gs.mjs
   In the Apps Script editor this is a second file next to Code.gs
   (Files > + > Script, name it "notify"). Paste the whole file.
   ================================================================== */

/* ----- company-core.js ----- */
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

/* ----- company-report.js ----- */
/* The company admin's report: a short list of what stands out, an adoption
   funnel, how the team compares with everyone who has taken the assessment, and
   a trend from weekly snapshots. It is pure logic (no Firebase, no page code) so
   it can be tested on its own (tests/company-report.test.mjs). It builds on
   company-core.js, which must be loaded first.

   Every sentence is written by fixed rules, with counts instead of percentages
   when a team is small, so a team of three is never described as a "trend". */
(function (root) {
  'use strict';
  const C = root.CompanyCore;
  const DAY = 86400000;

  const MIN_COMPARE_PEOPLE = 3;      // assessed people needed before an area is compared with everyone
  const MIN_COMPARE_ALL = 10;        // assessments by everyone needed before a comparison means anything
  const COMPARE_GAP = 10;            // points apart before it is worth saying
  const THIN_TEAM = 5;               // under this many assessed people, say it is a first look
  const SNAPSHOT_EVERY_DAYS = 7;
  const TREND_MIN_DAYS = 7;
  const TREND_TARGET_DAYS = 35;

  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const pct = (a, b) => (b > 0 ? Math.min(100, Math.round(a / b * 100)) : null);

  /* ---------------------------------------------------------- snapshots */
  // One small record of the team's numbers, saved at most once a week by the
  // dashboard (orgs/{id}/snapshots/{day}). Numbers only: no names or emails.
  function snapshotOf(rows, nowMs) {
    const r = C.rollup(rows);
    let lessons = 0;
    rows.forEach(x => { lessons += x.progress.planDone || 0; });
    const areas = {};
    r.domains.forEach(d => { if (d.avg !== null) areas[d.key] = d.avg; });
    return {
      day: new Date(nowMs).toISOString().slice(0, 10),
      people: r.people, assessed: r.assessed, learning: r.learning, finished: r.finished, inactive: r.inactive,
      avgOverall: r.avgOverall, avgPlan: r.avgPlanPct, lessons: lessons, areas: areas
    };
  }

  // snaps: [{ atMs, ... }] oldest first. True when a new weekly snapshot is due.
  function snapshotDue(snaps, people, nowMs) {
    if (!people) return false;
    if (!snaps.length) return true;
    const last = snaps[snaps.length - 1].atMs || 0;
    return nowMs - last >= (SNAPSHOT_EVERY_DAYS - 0.5) * DAY;
  }

  // Compares the newest snapshot with an older one at least a week back,
  // preferring one about a month back. Null when there is nothing to compare.
  function trend(snaps) {
    if (snaps.length < 2) return null;
    const to = snaps[snaps.length - 1];
    const older = snaps.slice(0, -1).filter(s => to.atMs - s.atMs >= TREND_MIN_DAYS * DAY);
    if (!older.length) return null;
    const near = older.filter(s => to.atMs - s.atMs <= TREND_TARGET_DAYS * DAY);
    const from = near.length ? near[0] : older[older.length - 1];
    const weeks = Math.max(1, Math.round((to.atMs - from.atMs) / (7 * DAY)));
    const started = (s) => (s.learning || 0) + (s.finished || 0);
    return {
      from: from, to: to, weeks: weeks,
      assessed: { from: from.assessed, to: to.assessed },
      started: { from: started(from), to: started(to) },
      finished: { from: from.finished, to: to.finished },
      avgPlan: { from: from.avgPlan, to: to.avgPlan }
    };
  }

  function trendSeries(snaps) {
    return {
      labels: snaps.map(s => s.day.slice(5)),
      series: [
        { key: 'assessed', name: 'Took the assessment', values: snaps.map(s => s.assessed) },
        { key: 'started', name: 'Started learning', values: snaps.map(s => (s.learning || 0) + (s.finished || 0)) },
        { key: 'finished', name: 'Finished their plan', values: snaps.map(s => s.finished) }
      ]
    };
  }

  /* -------------------------------------------------------------- funnel */
  // Invited or joined, joined, took the assessment, started learning, finished.
  function funnel(rows, invites, nowMs) {
    const open = invites.filter(i => C.inviteStatus(i, nowMs) === 'open').length;
    const r = C.rollup(rows);
    const counts = [
      ['invited', 'Invited or joined', r.people + open],
      ['joined', 'Joined', r.people],
      ['assessed', 'Took the assessment', r.assessed],
      ['started', 'Started learning', r.learning + r.finished],
      ['finished', 'Finished their plan', r.finished]
    ];
    const steps = counts.map((c, i) => ({ key: c[0], label: c[1], count: c[2], conv: i === 0 ? null : pct(c[2], counts[i - 1][2]) }));
    // The biggest drop, ignoring steps that follow a handful of people.
    let worst = -1, low = 101;
    steps.forEach((s, i) => { if (i > 0 && counts[i - 1][2] >= 3 && s.conv !== null && s.conv < low && s.conv < 100) { low = s.conv; worst = i; } });
    return { steps: steps, worst: worst, pending: open };
  }

  /* --------------------------------------------- compared with everyone */
  // platform: { totalCompletions, categoryAverages: { key: percent } } or null.
  function compare(rollup, platform) {
    if (!platform || !(platform.totalCompletions >= MIN_COMPARE_ALL) || !platform.categoryAverages) return { ok: false, all: platform ? platform.totalCompletions || 0 : 0, areas: [] };
    const areas = [];
    rollup.domains.forEach(d => {
      const all = platform.categoryAverages[d.key];
      if (d.avg === null || d.n < MIN_COMPARE_PEOPLE || typeof all !== 'number') return;
      areas.push({ key: d.key, label: d.label, team: d.avg, all: all, gap: d.avg - all, n: d.n });
    });
    return { ok: true, all: platform.totalCompletions, areas: areas };
  }

  /* ------------------------------------------------------------- insights */
  function insights(ctx) {
    const r = ctx.rollup, out = [];
    const add = (severity, text, thin) => out.push(thin ? { severity: severity, text: text, thin: true } : { severity: severity, text: text });

    if (!r.people) {
      add('info', ctx.funnel.pending
        ? plural(ctx.funnel.pending, 'invitation') + (ctx.funnel.pending === 1 ? ' is' : ' are') + ' waiting to be accepted. This report fills in once people join and take the assessment.'
        : 'No one has joined yet. Invite people from the section below and this report fills in as they take the assessment.');
      return out;
    }

    const pend = ctx.funnel.pending;
    if (pend > 0) {
      const oldest = Math.max.apply(null, ctx.invites.filter(i => C.inviteStatus(i, ctx.nowMs) === 'open').map(i => Math.floor((ctx.nowMs - (i.createdAtMs || ctx.nowMs)) / DAY)));
      add(oldest >= 7 ? 'watch' : 'info', plural(pend, 'invitation') + (pend === 1 ? ' is' : ' are') + ' still waiting to be accepted' +
        (oldest >= 7 ? ' (the oldest was sent ' + oldest + ' days ago). A short reminder usually helps.' : '.'));
    }
    if (r.notAssessed > 0) add('watch', r.notAssessed + ' of ' + plural(r.people, 'person', 'people') + (r.notAssessed === 1 ? " hasn't" : " haven't") +
      ' taken the assessment yet, so their level and plan are not in the numbers below.');
    if (r.assessedNotStarted > 0) add('watch', plural(r.assessedNotStarted, 'person has', 'people have') + ' taken the assessment but not started a lesson. This is the easiest group to move: ask them to open their dashboard.');
    if (r.inactive > 0) add('watch', plural(r.inactive, 'person has', 'people have') + ' been quiet for ' + C.INACTIVE_DAYS + '+ days.');
    if (r.finished > 0) add('good', plural(r.finished, 'person has', 'people have') + ' finished their whole learning plan.');

    if (r.weakest && r.assessed >= 3) {
      add('info', 'Across ' + plural(r.assessed, 'assessed person', 'assessed people') + ', the lowest area is ' + r.weakest.label + ' (average ' + r.weakest.avg + '%) and the highest is ' +
        r.strongest.label + ' (' + r.strongest.avg + '%).' + (r.assessed < THIN_TEAM ? ' With so few people this is a first look, not a pattern.' : ''), r.assessed < THIN_TEAM);
    }
    if (ctx.focus && ctx.focus.custom && ctx.focus.top.total > 0) {
      const names = ctx.focus.areas.slice(0, C.FOCUS_TOP).map(a => a.label).join(', ');
      add(ctx.focus.top.pct >= 50 ? 'good' : 'info', 'Progress on your focus areas (' + names + '): ' + ctx.focus.top.pct + '% of the assigned lessons are done (' + ctx.focus.top.done + ' of ' + ctx.focus.top.total + ').');
    }

    if (ctx.compare && ctx.compare.ok) {
      const far = ctx.compare.areas.filter(a => Math.abs(a.gap) >= COMPARE_GAP).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 2);
      far.forEach(a => add(a.gap < 0 ? 'watch' : 'good', 'Your team averages ' + a.team + '% in ' + a.label + ', ' + Math.abs(a.gap) + ' points ' + (a.gap < 0 ? 'below' : 'above') +
        ' the average of everyone who has taken the assessment (' + a.all + '%).'));
      if (!far.length && ctx.compare.areas.length) add('info', 'In every skill area compared, your team is within ' + COMPARE_GAP + ' points of everyone who has taken the assessment.');
    }

    const t = ctx.trend;
    if (t) {
      const span = plural(t.weeks, 'week');
      if (t.avgPlan.from !== null && t.avgPlan.to !== null) {
        const d = t.avgPlan.to - t.avgPlan.from;
        add(d > 0 ? 'good' : d < 0 ? 'watch' : 'info', 'Average plan complete ' + (d === 0 ? 'has stayed at ' + t.avgPlan.to + '%' : 'moved from ' + t.avgPlan.from + '% to ' + t.avgPlan.to + '%') + ' over ' + span + '.');
      }
      if (t.started.to !== t.started.from) add(t.started.to > t.started.from ? 'good' : 'watch', 'People who have started learning: ' + t.started.from + ' then, ' + t.started.to + ' now (' + span + ' apart).');
    } else if (ctx.snapshotCount === 1) {
      add('info', 'Trend charts start after your next weekly snapshot. The first one was saved today.', true);
    }
    return out;
  }

  const RANK = { watch: 0, good: 1, info: 2 };
  function summary(list) {
    return list.filter(i => !i.thin).map((i, n) => ({ i: i, n: n })).sort((a, b) => (RANK[a.i.severity] - RANK[b.i.severity]) || (a.n - b.n)).slice(0, 4).map(x => x.i);
  }

  function headline(r, f) {
    if (!r.people) return 'No one has joined yet.';
    if (!r.assessed) return plural(r.people, 'person has', 'people have') + ' joined and no one has taken the assessment yet.';
    const parts = [r.assessed + ' of ' + plural(r.people, 'person', 'people') + ' ' + (r.assessed === 1 ? 'has' : 'have') + ' taken the assessment'];
    if (r.learning + r.finished > 0) parts.push((r.learning + r.finished) + ' ' + (r.learning + r.finished === 1 ? 'is' : 'are') + ' learning or finished');
    return parts.join(' and ') + '.';
  }

  /* ---------------------------------------------------------- the report */
  // rows: active people with progress; invites: this company's invites;
  // snaps: snapshots oldest first; platform: the public totals, or null.
  function build(input) {
    const nowMs = input.nowMs;
    const rows = input.rows, invites = input.invites || [], snaps = input.snapshots || [];
    const r = C.rollup(rows);
    const f = funnel(rows, invites, nowMs);
    const cmp = compare(r, input.platform || null);
    const tr = trend(snaps);
    const focus = C.focusProgress(rows, input.focusAreas || []);
    const list = insights({ rollup: r, funnel: f, invites: invites, focus: focus, compare: cmp, trend: tr, snapshotCount: snaps.length, nowMs: nowMs });
    return {
      headline: headline(r, f), rollup: r, funnel: f, compare: cmp, trend: tr, series: snaps.length >= 2 ? trendSeries(snaps) : null,
      insights: list, summary: summary(list),
      notes: [
        'Numbers cover people who are active in this company today.',
        'The comparison uses the average of everyone who has taken the assessment' + (cmp.all ? ' (' + cmp.all + ' people)' : '') + ' and only appears when your team and the total are large enough to mean something.',
        'The trend comes from a snapshot saved at most once a week when this page is opened, so it builds up over time.'
      ],
      aiFacts: aiFacts(r, f, cmp, tr, focus)
    };
  }

  // Only numbers and the fixed names of the seven skill areas: no company name,
  // no people. This is the only thing "Explain with AI" ever sends.
  function aiFacts(r, f, cmp, tr, focus) {
    return {
      people: r.people, assessed: r.assessed, learning: r.learning, finished: r.finished, quiet: r.inactive, pendingInvites: f.pending,
      avgOverallPct: r.avgOverall, avgPlanPct: r.avgPlanPct,
      funnel: f.steps.map(s => ({ step: s.label, count: s.count })),
      areas: r.domains.filter(d => d.avg !== null).map(d => {
        const c = cmp.areas.filter(a => a.key === d.key)[0];
        return { area: d.label, teamAvgPct: d.avg, allAvgPct: c ? c.all : null };
      }),
      focusAreas: focus.custom ? focus.areas.slice(0, C.FOCUS_TOP).map(a => a.label) : [],
      trend: tr ? { weeks: tr.weeks, avgPlanFromPct: tr.avgPlan.from, avgPlanToPct: tr.avgPlan.to, startedFrom: tr.started.from, startedTo: tr.started.to } : null
    };
  }

  root.CompanyReport = {
    MIN_COMPARE_PEOPLE, MIN_COMPARE_ALL, COMPARE_GAP, THIN_TEAM, SNAPSHOT_EVERY_DAYS,
    snapshotOf, snapshotDue, trend, trendSeries, funnel, compare, insights, summary, headline, aiFacts, build
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ----- notify-core.js ----- */
/* Email check-ins: the learner's own check-in and the company admin's report.
   Pure logic (no Firebase, no Google services) so it can be tested on its own
   (tests/notify-core.test.mjs) and run unchanged inside Apps Script, where
   apps-script/notify.gs is built from this file, company-core.js and
   company-report.js by tools/build-notify-gs.mjs. It builds on company-core.js
   (and company-report.js for the admin report), which must be loaded first.

   What a person's progress document holds for this:
     notify:    { checkin: 'daily' | 'weekly' | 'monthly' | 'off', orgReport: same }
                (missing means weekly: everyone gets the weekly email until they change it)
     goals:     { weeklyLessons: 1-10, focus: up to 3 skill-area keys }
     lessonLog: { 'YYYY-MM-DD': lessons finished that day }, written by lesson.html

   An email covers the period that has just ended: the daily one (sent in the
   morning) covers yesterday, the weekly one (Monday) last week, the monthly one
   (the 1st) last month. */
(function (root) {
  'use strict';
  const C = root.CompanyCore;
  const DAY = 86400000;

  const FREQS = ['daily', 'weekly', 'monthly', 'off'];
  const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', off: 'Off' };
  const DEFAULT_FREQ = 'weekly';
  const DEFAULT_GOAL = 2;
  const GOAL_MIN = 1;
  const GOAL_MAX = 10;
  const MAX_FOCUS = 3;
  const SEND_HOUR = 8;          // emails go out from 8am, script time
  const LOG_KEEP_DAYS = 400;    // lessonLog entries older than this are dropped

  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const domainKeys = C.DOMAINS.map(d => d[0]);

  /* ------------------------------------------------------------ preferences */
  function normalizeFreq(v) { return FREQS.indexOf(v) > -1 ? v : DEFAULT_FREQ; }

  function normalizeGoals(g) {
    g = g || {};
    const n = Math.round(Number(g.weeklyLessons));
    const focus = [];
    (Array.isArray(g.focus) ? g.focus : []).forEach(k => { if (domainKeys.indexOf(k) > -1 && focus.indexOf(k) === -1 && focus.length < MAX_FOCUS) focus.push(k); });
    return { weeklyLessons: Number.isFinite(n) ? Math.min(GOAL_MAX, Math.max(GOAL_MIN, n)) : DEFAULT_GOAL, focus: focus };
  }

  // The settings in one progress document, with the defaults filled in.
  function prefsOf(progress) {
    const n = (progress && progress.notify) || {};
    return { checkin: normalizeFreq(n.checkin), orgReport: normalizeFreq(n.orgReport), goals: normalizeGoals(progress && progress.goals) };
  }

  /* ------------------------------------------------------------------ dates */
  // Local calendar parts of a moment, for a fixed offset from UTC in minutes
  // (the script's time zone, e.g. -420 for Pacific daylight time).
  function localParts(ms, offsetMin) {
    const d = new Date(ms + (offsetMin || 0) * 60000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay(), hour: d.getUTCHours() };
  }
  const pad = (n) => (n < 10 ? '0' : '') + n;
  function dateKey(ms, offsetMin) { const p = localParts(ms, offsetMin); return p.y + '-' + pad(p.m + 1) + '-' + pad(p.d); }
  // The UTC moment of a local midnight.
  function localMidnight(y, m, d, offsetMin) { return Date.UTC(y, m, d) - (offsetMin || 0) * 60000; }

  // When the current period began: today, this week (Monday) or this month.
  function periodStart(freq, nowMs, offsetMin) {
    const p = localParts(nowMs, offsetMin);
    if (freq === 'daily') return localMidnight(p.y, p.m, p.d, offsetMin);
    if (freq === 'monthly') return localMidnight(p.y, p.m, 1, offsetMin);
    return localMidnight(p.y, p.m, p.d - ((p.dow + 6) % 7), offsetMin);   // weekly: back to Monday
  }

  // The period an email sent now looks back on: [from, to).
  function reportWindow(freq, nowMs, offsetMin) {
    const to = periodStart(freq, nowMs, offsetMin);
    const p = localParts(to, offsetMin);
    let from;
    if (freq === 'daily') from = localMidnight(p.y, p.m, p.d - 1, offsetMin);
    else if (freq === 'monthly') from = localMidnight(p.y, p.m - 1, 1, offsetMin);
    else from = localMidnight(p.y, p.m, p.d - 7, offsetMin);
    return { from: from, to: to, label: freq === 'daily' ? 'yesterday' : freq === 'monthly' ? 'last month' : 'last week',
      next: freq === 'daily' ? 'today' : freq === 'monthly' ? 'this month' : 'this week' };
  }

  // Is an email of this frequency due now? lastMs is when the last one went
  // out, or when the account was made (so a brand-new account waits for the
  // next period instead of getting one straight away).
  function isDue(freq, lastMs, nowMs, offsetMin, sendHour) {
    if (FREQS.indexOf(freq) === -1 || freq === 'off') return false;
    if (localParts(nowMs, offsetMin).hour < (sendHour === undefined ? SEND_HOUR : sendHour)) return false;
    return (Number(lastMs) || 0) < periodStart(freq, nowMs, offsetMin);
  }

  /* ------------------------------------------------------------- lesson log */
  // Adds one finished lesson to the log for the day it happened, dropping old days.
  function logLesson(log, ms, offsetMin) {
    const out = {};
    const oldest = dateKey(ms - LOG_KEEP_DAYS * DAY, offsetMin);
    Object.keys(log || {}).forEach(k => { if (/^\d{4}-\d\d-\d\d$/.test(k) && k >= oldest) out[k] = Number(log[k]) || 0; });
    const key = dateKey(ms, offsetMin);
    out[key] = (out[key] || 0) + 1;
    return out;
  }

  // Lessons finished between two moments (by local day; [fromMs, toMs)).
  function lessonsBetween(log, fromMs, toMs, offsetMin) {
    const a = dateKey(fromMs, offsetMin), b = dateKey(toMs - 1, offsetMin);
    let n = 0;
    Object.keys(log || {}).forEach(k => { if (k >= a && k <= b) n += Number(log[k]) || 0; });
    return n;
  }

  // The goal for one email's period, from the weekly goal.
  function targetFor(freq, weekly) {
    if (freq === 'daily') return Math.max(1, Math.round(weekly / 5));
    if (freq === 'monthly') return weekly * 4;
    return weekly;
  }

  // This week so far, for the dashboard: { done, target, pct }.
  function weekSoFar(progress, nowMs, offsetMin) {
    const goals = normalizeGoals(progress && progress.goals);
    const from = periodStart('weekly', nowMs, offsetMin);
    const done = lessonsBetween(progress && progress.lessonLog, from, nowMs + DAY, offsetMin);
    return { done: done, target: goals.weeklyLessons, pct: Math.min(100, Math.round(done / goals.weeklyLessons * 100)), focus: goals.focus };
  }

  /* ------------------------------------------------------- what to do next */
  // The next lesson: carry on with the course touched most recently, else the
  // first unfinished course in the plan, focus areas first.
  function nextLesson(plan, courses, focus) {
    const open = plan.filter(c => c.lessons > 0 && C.lessonsDone(courses, c.id) < c.lessons);
    if (!open.length) return null;
    const started = open.filter(c => courses && courses[c.id] && courses[c.id].updatedAt)
      .sort((a, b) => String(courses[b.id].updatedAt).localeCompare(String(courses[a.id].updatedAt)));
    const rank = (c) => { const i = focus.indexOf(c.domain); return i === -1 ? focus.length : i; };
    const pick = started[0] || open.slice().sort((a, b) => rank(a) - rank(b) || C.TIER_SLUGS.indexOf(a.tier) - C.TIER_SLUGS.indexOf(b.tier))[0];
    const doneSet = {};
    ((courses && courses[pick.id] && courses[pick.id].completed) || []).forEach(n => { doneSet[n] = true; });
    let lesson = 1;
    while (lesson <= pick.lessons && doneSet[lesson]) lesson++;
    return { courseId: pick.id, lesson: lesson, lessons: pick.lessons, resume: !!started[0], title: C.prettyCourseId(pick.id) };
  }

  /* --------------------------------------------------- the learner check-in */
  /* input: {
       name, progress (the progress document), assessment ({ categoryPct } or null),
       freq, nowMs, offsetMin,
       links: { site, settings, unsubscribe }   (site ends with '/')
     } */
  function checkin(input) {
    const freq = normalizeFreq(input.freq);
    const progress = input.progress || {};
    const courses = progress.courses || {};
    const goals = normalizeGoals(progress.goals);
    const win = reportWindow(freq, input.nowMs, input.offsetMin);
    const done = lessonsBetween(progress.lessonLog, win.from, win.to, input.offsetMin);
    const target = targetFor(freq, goals.weeklyLessons);
    const plan = C.assignedCourses(input.assessment || null);
    let planTotal = 0, planDone = 0;
    plan.forEach(c => { planTotal += c.lessons; planDone += Math.min(C.lessonsDone(courses, c.id), c.lessons); });
    const planPct = planTotal ? Math.round(planDone / planTotal * 100) : null;

    // Focus areas: the ones chosen, else the two weakest in the assessment.
    let focus = goals.focus.slice(), suggested = false;
    if (!focus.length && input.assessment && input.assessment.categoryPct) {
      const cat = input.assessment.categoryPct;
      focus = domainKeys.slice().sort((a, b) => (Number(cat[a]) || 0) - (Number(cat[b]) || 0)).slice(0, 2);
      suggested = true;
    }
    const focusRows = focus.map(k => {
      let t = 0, d = 0;
      plan.filter(c => c.domain === k).forEach(c => { t += c.lessons; d += Math.min(C.lessonsDone(courses, c.id), c.lessons); });
      return { key: k, label: C.domainLabel(k), done: d, total: t, pct: t ? Math.round(d / t * 100) : null };
    });

    const next = nextLesson(plan, courses, focus);
    const site = (input.links && input.links.site) || '';
    const first = String(input.name || '').trim().split(/\s+/)[0] || '';

    let status, headline;
    if (!input.assessment) {
      status = 'not_assessed';
      headline = 'Your plan starts with a 10-minute assessment. It shows where you are strong and picks your courses.';
    } else if (planTotal && planDone >= planTotal) {
      status = 'finished';
      headline = "You've finished every course in your plan. Retake the assessment to see how far you've come and get a new plan.";
    } else if (done >= target) {
      status = 'on_track';
      headline = 'You hit your goal ' + win.label + ': ' + done + ' of ' + plural(target, 'lesson') + '. Keep it going.';
    } else if (done > 0) {
      status = 'behind';
      headline = plural(done, 'lesson') + ' ' + win.label + ', ' + (target - done) + ' short of your goal of ' + target + '. One short lesson ' + win.next + ' closes the gap.';
    } else {
      status = 'idle';
      headline = 'No lessons ' + win.label + '. One 10-minute lesson ' + win.next + ' gets you moving again.';
    }

    const subjectBits = { daily: 'Your daily check-in', weekly: 'Your weekly check-in', monthly: 'Your monthly check-in' };
    const subject = subjectBits[freq] + ': ' + (status === 'not_assessed' ? 'start with the assessment'
      : status === 'finished' ? 'plan complete'
      : done + ' of ' + plural(target, 'lesson') + ' ' + win.label);

    return {
      freq: freq, subject: subject, greeting: first ? 'Hi ' + first + ',' : 'Hi,', headline: headline, status: status,
      window: win, done: done, target: target, goalPct: Math.min(100, Math.round(done / target * 100)),
      planPct: planPct, planDone: planDone, planTotal: planTotal,
      focus: focusRows, focusSuggested: suggested,
      next: next ? Object.assign({}, next, { url: site + 'lesson?course=' + encodeURIComponent(next.courseId) + '&lesson=' + next.lesson }) : null,
      cta: !input.assessment ? { label: 'Take the assessment', url: site } : next ? { label: (next.resume ? 'Pick up where you left off' : 'Start your next lesson'), url: site + 'lesson?course=' + encodeURIComponent(next.courseId) + '&lesson=' + next.lesson } : { label: 'Open my learning', url: site + 'lms-dashboard' },
      links: { dashboard: site + 'lms-dashboard', goals: site + 'profile#goals', settings: (input.links && input.links.settings) || '', unsubscribe: (input.links && input.links.unsubscribe) || '' }
    };
  }

  /* ---------------------------------------------------- the admin's report */
  /* input: {
       org, rows (C.buildTeamRows, active people only), invites, snapshots, platform,
       freq, nowMs, offsetMin, adminName,
       links: { site, settings, unsubscribe }
     } */
  function orgReport(input) {
    const R = root.CompanyReport;
    const freq = normalizeFreq(input.freq);
    const org = input.org || {};
    const rows = input.rows || [];
    const win = reportWindow(freq, input.nowMs, input.offsetMin);
    const report = R.build({ rows: rows, invites: input.invites || [], snapshots: input.snapshots || [], platform: input.platform || null, focusAreas: org.focusAreas || [], nowMs: input.nowMs });
    const r = report.rollup;
    const pending = (input.invites || []).filter(i => C.inviteStatus(i, input.nowMs) === 'open').length;
    const active = rows.length;
    const activeInWindow = rows.filter(x => { const t = Date.parse((x.progress && x.progress.lastActiveAt) || ''); return Number.isFinite(t) && t >= win.from && t < win.to; }).length;
    const focus = C.focusProgress(rows, org.focusAreas || []);
    const site = (input.links && input.links.site) || '';
    const first = String(input.adminName || '').trim().split(/\s+/)[0] || '';

    const tiles = [
      { label: 'People', n: r.people },
      { label: 'Took the assessment', n: r.assessed },
      { label: 'Learning now', n: r.learning },
      { label: 'Finished their plan', n: r.finished },
      { label: 'Active ' + win.label, n: activeInWindow },
      { label: 'Quiet for 30+ days', n: r.inactive, warn: r.inactive > 0 }
    ];
    if (r.avgPlanPct !== null) tiles.push({ label: 'Average plan complete', n: r.avgPlanPct + '%' });

    const name = org.name || 'Your company';
    const word = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[freq];
    return {
      freq: freq, orgName: name, subject: name + ' — ' + word.toLowerCase() + ' learning report: ' + plural(activeInWindow, 'person', 'people') + ' active ' + win.label,
      title: word + ' learning report', greeting: first ? 'Hi ' + first + ',' : 'Hi,',
      headline: report.headline, window: win, tiles: tiles,
      seats: C.seatCounts(org, active, pending),
      highlights: (report.summary.length ? report.summary : report.insights.slice(0, 1)).map(i => ({ severity: i.severity, text: i.text })),
      focus: focus.custom ? focus.areas.slice(0, C.FOCUS_TOP).map(a => ({ label: a.label, pct: a.pct })) : [],
      url: site + 'company?org=' + encodeURIComponent(org.id || '') + '#reportCard',
      links: { settings: (input.links && input.links.settings) || '', unsubscribe: (input.links && input.links.unsubscribe) || '' }
    };
  }

  /* ----------------------------------------------------------------- email */
  const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const NAVY = '#1A4584', DEEP = '#12305e', CYAN = '#35C2E8', INK = '#16213E', SOFT = '#4B5768', MUTED = '#6B7686', LINE = '#E3E9F0', TINT = '#EEF4FB', OK = '#2E8B57', WARN = '#C0622A';
  const FONT = 'font-family:Arial,Helvetica,sans-serif;';

  function bar(pct, color) {
    const w = Math.max(0, Math.min(100, Math.round(pct || 0)));
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>' +
      (w > 0 ? '<td width="' + w + '%" style="background:' + (color || NAVY) + ';height:8px;border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>' : '') +
      (w < 100 ? '<td style="background:' + LINE + ';height:8px;border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>' : '') + '</tr></table>';
  }
  function button(label, url) {
    return '<a href="' + esc(url) + '" style="display:inline-block;padding:12px 22px;border-radius:8px;background:' + NAVY + ';color:#ffffff;text-decoration:none;font-weight:bold;' + FONT + 'font-size:15px;">' + esc(label) + '</a>';
  }
  function shell(inner, footer) {
    return '<div style="background:#F5F8FB;padding:24px 12px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid ' + LINE + ';border-radius:14px;border-collapse:separate;">' +
      '<tr><td style="padding:0;"><div style="height:4px;background:' + NAVY + ';background:linear-gradient(90deg,' + NAVY + ',' + CYAN + ');border-radius:14px 14px 0 0;"></div></td></tr>' +
      '<tr><td style="padding:26px 28px 8px;' + FONT + 'color:' + INK + ';font-size:15px;line-height:1.55;">' +
      '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:' + MUTED + ';font-weight:bold;margin-bottom:14px;">Product Advisory · Learning</div>' + inner + '</td></tr>' +
      '<tr><td style="padding:16px 28px 24px;border-top:1px solid ' + LINE + ';' + FONT + 'font-size:12px;line-height:1.5;color:' + MUTED + ';">' + footer + '</td></tr></table></div>';
  }
  function footerHtml(what, freq, links) {
    return 'You get this ' + esc(what) + ' ' + esc(FREQ_LABELS[freq].toLowerCase()) + '. ' +
      (links.settings ? '<a href="' + esc(links.settings) + '" style="color:' + NAVY + ';">Change how often</a>' : '') +
      (links.settings && links.unsubscribe ? ' · ' : '') +
      (links.unsubscribe ? '<a href="' + esc(links.unsubscribe) + '" style="color:' + NAVY + ';">Unsubscribe</a>' : '') +
      '<br>Product Advisory, LLC · <a href="https://www.productadvisory.co" style="color:' + MUTED + ';">productadvisory.co</a>';
  }
  function footerText(what, freq, links) {
    return '\n--\nYou get this ' + what + ' ' + FREQ_LABELS[freq].toLowerCase() + '.' +
      (links.settings ? '\nChange how often: ' + links.settings : '') + (links.unsubscribe ? '\nUnsubscribe: ' + links.unsubscribe : '') + '\nProduct Advisory, LLC';
  }

  function checkinEmail(m) {
    const statusColor = m.status === 'on_track' || m.status === 'finished' ? OK : m.status === 'idle' ? WARN : NAVY;
    let h = '<p style="margin:0 0 6px;">' + esc(m.greeting) + '</p>' +
      '<h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:' + DEEP + ';">' + esc(m.headline) + '</h1>';
    if (m.status !== 'not_assessed') {
      h += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 18px;"><tr>' +
        '<td width="48%" style="padding:14px 16px;background:' + TINT + ';border-radius:10px;vertical-align:top;">' +
        '<div style="font-size:12px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:.06em;font-weight:bold;">Goal ' + esc(m.window.label) + '</div>' +
        '<div style="font-size:26px;font-weight:bold;color:' + statusColor + ';margin:4px 0 8px;">' + m.done + ' <span style="font-size:15px;color:' + SOFT + ';font-weight:normal;">of ' + m.target + ' lessons</span></div>' + bar(m.goalPct, statusColor) + '</td>' +
        '<td width="4%" style="font-size:0;">&nbsp;</td>' +
        '<td width="48%" style="padding:14px 16px;background:' + TINT + ';border-radius:10px;vertical-align:top;">' +
        '<div style="font-size:12px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:.06em;font-weight:bold;">Your plan</div>' +
        '<div style="font-size:26px;font-weight:bold;color:' + NAVY + ';margin:4px 0 8px;">' + (m.planPct === null ? '—' : m.planPct + '%') + ' <span style="font-size:15px;color:' + SOFT + ';font-weight:normal;">' + m.planDone + ' of ' + m.planTotal + ' lessons</span></div>' + bar(m.planPct, NAVY) + '</td>' +
        '</tr></table>';
    }
    if (m.focus.length) {
      h += '<h2 style="margin:0 0 8px;font-size:15px;color:' + DEEP + ';">' + (m.focusSuggested ? 'Suggested focus areas' : 'Your focus areas') + '</h2>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 6px;">' +
        m.focus.map(f => '<tr><td style="padding:6px 0 2px;font-size:14px;">' + esc(f.label) + '</td><td style="padding:6px 0 2px;font-size:13px;color:' + SOFT + ';text-align:right;white-space:nowrap;">' + (f.total ? f.done + ' of ' + f.total : 'tested out') + '</td></tr>' +
          '<tr><td colspan="2" style="padding:0 0 6px;">' + bar(f.total ? f.pct : 100, CYAN) + '</td></tr>').join('') + '</table>';
      if (m.focusSuggested) h += '<p style="margin:0 0 14px;font-size:13px;color:' + SOFT + ';">These are your two lowest-scoring areas. <a href="' + esc(m.links.goals) + '" style="color:' + NAVY + ';">Choose your own focus areas</a>.</p>';
    }
    if (m.next) {
      h += '<div style="margin:16px 0 6px;padding:14px 16px;border:1px solid ' + LINE + ';border-left:4px solid ' + CYAN + ';border-radius:8px;">' +
        '<div style="font-size:12px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:.06em;font-weight:bold;">' + (m.next.resume ? 'Pick up where you left off' : 'Up next') + '</div>' +
        '<div style="font-size:15px;font-weight:bold;color:' + INK + ';margin-top:3px;">' + esc(m.next.title) + '</div>' +
        '<div style="font-size:13px;color:' + SOFT + ';">Lesson ' + m.next.lesson + ' of ' + m.next.lessons + ' · about 10 minutes</div></div>';
    }
    h += '<p style="margin:18px 0 6px;">' + button(m.cta.label, m.cta.url) + '</p>' +
      '<p style="margin:10px 0 0;font-size:13px;color:' + SOFT + ';"><a href="' + esc(m.links.dashboard) + '" style="color:' + NAVY + ';">Open my learning</a> · <a href="' + esc(m.links.goals) + '" style="color:' + NAVY + ';">Change my goals</a></p>';

    const lines = [m.greeting, '', m.headline, ''];
    if (m.status !== 'not_assessed') {
      lines.push('Goal ' + m.window.label + ': ' + m.done + ' of ' + m.target + ' lessons');
      lines.push('Your plan: ' + (m.planPct === null ? '-' : m.planPct + '%') + ' (' + m.planDone + ' of ' + m.planTotal + ' lessons)');
    }
    if (m.focus.length) { lines.push('', (m.focusSuggested ? 'Suggested focus areas' : 'Your focus areas') + ':'); m.focus.forEach(f => lines.push('- ' + f.label + ': ' + (f.total ? f.done + ' of ' + f.total + ' lessons' : 'tested out'))); }
    if (m.next) lines.push('', (m.next.resume ? 'Pick up where you left off: ' : 'Up next: ') + m.next.title + ', lesson ' + m.next.lesson + ' of ' + m.next.lessons);
    lines.push('', m.cta.label + ': ' + m.cta.url, 'Change my goals: ' + m.links.goals);
    return { subject: m.subject, html: shell(h, footerHtml('check-in', m.freq, m.links)), text: lines.join('\n') + footerText('check-in', m.freq, m.links) };
  }

  function orgEmail(m) {
    const SEV = { good: ['Good news', OK], watch: ['Watch', WARN], info: ['Note', NAVY] };
    let h = '<p style="margin:0 0 6px;">' + esc(m.greeting) + '</p>' +
      '<h1 style="margin:0 0 4px;font-size:21px;line-height:1.3;color:' + DEEP + ';">' + esc(m.orgName) + ': ' + esc(m.title.toLowerCase()) + '</h1>' +
      '<p style="margin:0 0 16px;color:' + SOFT + ';">' + esc(m.headline) + '</p>' +
      '<p style="margin:0 0 14px;font-size:13px;color:' + SOFT + ';">Seats: ' + m.seats.map(s => '<b style="color:' + (s.warn ? WARN : INK) + ';">' + esc(String(s.n)) + '</b> ' + esc(s.label.toLowerCase())).join(' · ') + '</p>';
    const cells = m.tiles.map(t => '<td width="33%" style="padding:10px 12px;background:' + TINT + ';border-radius:10px;vertical-align:top;">' +
      '<div style="font-size:22px;font-weight:bold;color:' + (t.warn ? WARN : NAVY) + ';">' + esc(String(t.n)) + '</div><div style="font-size:12px;color:' + SOFT + ';">' + esc(t.label) + '</div></td>');
    h += '<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate;margin:0 -6px 12px;">';
    for (let i = 0; i < cells.length; i += 3) h += '<tr>' + cells.slice(i, i + 3).join('') + (i + 3 > cells.length ? '<td width="33%"></td>'.repeat(i + 3 - cells.length) : '') + '</tr>';
    h += '</table>';
    if (m.highlights.length) {
      h += '<h2 style="margin:6px 0 8px;font-size:15px;color:' + DEEP + ';">What stands out</h2>' +
        m.highlights.map(x => { const s = SEV[x.severity] || SEV.info; return '<p style="margin:0 0 8px;font-size:14px;"><span style="display:inline-block;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:' + s[1] + ';margin-right:6px;">' + s[0] + '</span>' + esc(x.text) + '</p>'; }).join('');
    }
    if (m.focus.length) {
      h += '<h2 style="margin:14px 0 8px;font-size:15px;color:' + DEEP + ';">Focus areas</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
        m.focus.map(f => '<tr><td style="padding:5px 0 2px;font-size:14px;">' + esc(f.label) + '</td><td style="padding:5px 0 2px;font-size:13px;color:' + SOFT + ';text-align:right;">' + (f.pct === null || f.pct === undefined ? '—' : f.pct + '%') + '</td></tr><tr><td colspan="2" style="padding:0 0 5px;">' + bar(f.pct || 0, CYAN) + '</td></tr>').join('') + '</table>';
    }
    h += '<p style="margin:20px 0 4px;">' + button('See the full report', m.url) + '</p>' +
      '<p style="margin:8px 0 0;font-size:13px;color:' + SOFT + ';">The full report has the adoption funnel, how your team compares, each person\'s progress and "Explain with AI".</p>';

    const lines = [m.greeting, '', m.orgName + ': ' + m.title.toLowerCase(), m.headline, '',
      'Seats: ' + m.seats.map(s => s.n + ' ' + s.label.toLowerCase()).join(', '), ''];
    m.tiles.forEach(t => lines.push(t.label + ': ' + t.n));
    if (m.highlights.length) { lines.push('', 'What stands out:'); m.highlights.forEach(x => lines.push('- ' + x.text)); }
    if (m.focus.length) { lines.push('', 'Focus areas:'); m.focus.forEach(f => lines.push('- ' + f.label + ': ' + (f.pct === null || f.pct === undefined ? '-' : f.pct + '%'))); }
    lines.push('', 'See the full report: ' + m.url);
    return { subject: m.subject, html: shell(h, footerHtml('report', m.freq, m.links)), text: lines.join('\n') + footerText('report', m.freq, m.links) };
  }

  // "j***@acme.com", for the email settings page (opened from a link, without signing in).
  function maskEmail(e) {
    const s = String(e || ''), at = s.indexOf('@');
    if (at < 1) return '';
    return s.charAt(0) + '***' + s.slice(at);
  }

  root.NotifyCore = {
    FREQS, FREQ_LABELS, DEFAULT_FREQ, DEFAULT_GOAL, GOAL_MIN, GOAL_MAX, MAX_FOCUS, SEND_HOUR,
    normalizeFreq, normalizeGoals, prefsOf, localParts, dateKey, periodStart, reportWindow, isDue,
    logLesson, lessonsBetween, targetFor, weekSoFar, nextLesson, checkin, orgReport, checkinEmail, orgEmail, maskEmail
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ----- assessment-history.js ----- */
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
