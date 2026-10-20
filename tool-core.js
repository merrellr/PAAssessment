/* Pure logic for the tool roadmap (tool-requests.html for the public, owner-tools.html
   for the owner). No Firebase and no page code, so it can be tested on its own
   (tests/tool-core.test.mjs).

   How voting is stored (see firestore.rules):
     tools/{toolId}        one document per tool, including its public vote count
     toolVotes/{uid_toolId} one document per person per tool they voted for
     toolSuggestions/{uid}  at most one suggestion per person, reviewed by the owner */
(function (root) {
  'use strict';

  const MAX_VOTES = 3;                                   // a person can back up to 3 tools, one vote each
  const STATUSES = ['considering', 'planned', 'in_progress', 'released'];
  const VOTABLE = ['considering', 'planned', 'in_progress'];
  const STATUS_LABELS = { considering: 'Under consideration', planned: 'Planned', in_progress: 'In progress', released: 'Released' };

  // The list the owner can add with one click. The first three are already
  // planned; the other seven cover every area of the framework.
  const STARTER_TOOLS = [
    { id: 'feature-prioritization-scorecard', title: 'Feature Prioritization Scorecard', category: 'Prioritization', status: 'planned',
      description: 'Score and rank features against criteria you choose, so trade-offs are visible and easy to defend.' },
    { id: 'product-strategy-one-pager', title: 'Product Strategy One Pager', category: 'Strategy', status: 'planned',
      description: 'A single page that states who you serve, where you will win, and what you will not do.' },
    { id: 'ai-use-case-prioritization', title: 'AI Use Case Prioritization', category: 'AI Fluency', status: 'planned',
      description: 'Compare AI ideas by value, feasibility and risk to pick the few worth building.' },
    { id: 'customer-interview-guide', title: 'Customer Interview Guide', category: 'Discovery', status: 'considering',
      description: 'Question sets and a note template for discovery interviews that surface real problems.' },
    { id: 'competitive-analysis-matrix', title: 'Competitive Analysis Matrix', category: 'Discovery', status: 'considering',
      description: 'Compare alternatives on the dimensions customers care about and spot open positions.' },
    { id: 'stakeholder-map', title: 'Stakeholder Map', category: 'Stakeholders', status: 'considering',
      description: 'Map who has influence and interest, and plan how to bring each person along.' },
    { id: 'go-to-market-launch-checklist', title: 'Go-to-Market Launch Checklist', category: 'Execution', status: 'considering',
      description: 'A readiness checklist across product, sales, support and marketing before you ship.' },
    { id: 'product-metrics-tree', title: 'Product Metrics Tree', category: 'Execution', status: 'considering',
      description: 'Break one north-star metric into the inputs your team can actually influence.' },
    { id: 'ai-readiness-checklist', title: 'AI Readiness Checklist', category: 'AI Fluency', status: 'considering',
      description: 'Assess whether your team, data and processes are ready for AI work.' },
    { id: 'okr-builder', title: 'OKR Builder', category: 'Strategy', status: 'considering',
      description: 'Draft objectives and measurable key results, and check them against common pitfalls.' }
  ];

  function voteId(uid, toolId) { return uid + '_' + toolId; }

  // Most votes first; ties keep the owner's own order. Released tools go last.
  // { blind: true } ignores the votes (the owner's order only), so the order does not give the totals away
  // to someone who has not voted yet.
  function sortTools(tools, opts) {
    const blind = !!(opts && opts.blind);
    return tools.slice().sort((a, b) => {
      const ra = a.status === 'released' ? 1 : 0, rb = b.status === 'released' ? 1 : 0;
      return (ra - rb) || (blind ? 0 : ((b.voteCount || 0) - (a.voteCount || 0))) || ((a.order || 0) - (b.order || 0)) || String(a.title).localeCompare(String(b.title));
    });
  }

  // myVotes: the toolIds this person has voted for.
  function votesLeft(myVotes) { return Math.max(0, MAX_VOTES - myVotes.length); }

  // Why a person cannot vote for a tool right now, or null if they can.
  function voteBlocker(tool, myVotes, verified) {
    if (!verified) return 'verify';
    if (myVotes.indexOf(tool.id) !== -1) return 'voted';
    if (VOTABLE.indexOf(tool.status) === -1) return 'closed';
    if (myVotes.length >= MAX_VOTES) return 'full';
    return null;
  }

  function buildVote(user, toolId, notify) {
    return { uid: user.uid, toolId: toolId, email: String(user.email || '').toLowerCase(), notify: !!notify };
  }

  function validateTool(f) {
    const errors = {};
    const title = String(f.title || '').trim();
    if (!title) errors.title = 'Enter a name for the tool.';
    else if (title.length > 80) errors.title = 'Keep the name under 80 characters.';
    if (String(f.description || '').trim().length > 240) errors.description = 'Keep the description under 240 characters.';
    if (String(f.category || '').trim().length > 40) errors.category = 'Keep the category under 40 characters.';
    if (STATUSES.indexOf(f.status) === -1) errors.status = 'Choose a status.';
    const url = String(f.launchUrl || '').trim();
    if (url && (!/^https:\/\//i.test(url) || url.length > 300)) errors.launchUrl = 'The link must start with https:// and be under 300 characters.';
    if (f.status === 'released' && !url) errors.launchUrl = 'Add the link to the released tool so voters can find it.';
    const order = Number(f.order);
    if (String(f.order).trim() !== '' && (!Number.isInteger(order) || order < 0 || order > 10000)) errors.order = 'Order must be a whole number from 0 to 10,000.';
    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  function buildToolFields(f) {
    const out = {
      title: String(f.title).trim(),
      description: String(f.description || '').trim(),
      category: String(f.category || '').trim(),
      status: f.status,
      order: String(f.order).trim() === '' ? 0 : Number(f.order)
    };
    const url = String(f.launchUrl || '').trim();
    if (url) out.launchUrl = url;
    return out;
  }

  // A tool id for something the owner types in by hand.
  function slugify(title) {
    const s = String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    return s || 'tool';
  }

  function validateSuggestion(text) {
    const s = String(text || '').trim();
    if (s.length < 5) return { ok: false, error: 'Tell us a little more: at least a few words.' };
    if (s.length > 300) return { ok: false, error: 'Please keep it under 300 characters.' };
    return { ok: true, text: s };
  }

  // People who asked to be emailed when a tool launches. votes are toolVotes documents.
  function notifyList(votes, toolId) {
    const seen = {};
    const out = [];
    votes.forEach(v => {
      if (v.toolId !== toolId || !v.notify || !v.email || seen[v.email]) return;
      seen[v.email] = true;
      out.push(v.email);
    });
    return out.sort();
  }

  function csvCell(v) {
    let s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function buildNotifyCsv(tools, votes) {
    const lines = [['Tool', 'Status', 'Email'].map(csvCell).join(',')];
    tools.forEach(t => notifyList(votes, t.id).forEach(e => lines.push([t.title, STATUS_LABELS[t.status] || t.status, e].map(csvCell).join(','))));
    return lines.join('\r\n');
  }

  // Counts the real votes behind each tool, for the owner's "Recount" repair.
  function countVotes(votes) {
    const counts = {};
    votes.forEach(v => { counts[v.toolId] = (counts[v.toolId] || 0) + 1; });
    return counts;
  }

  root.ToolCore = {
    MAX_VOTES, STATUSES, VOTABLE, STATUS_LABELS, STARTER_TOOLS,
    voteId, sortTools, votesLeft, voteBlocker, buildVote, validateTool, buildToolFields, slugify,
    validateSuggestion, notifyList, buildNotifyCsv, countVotes, csvCell
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
