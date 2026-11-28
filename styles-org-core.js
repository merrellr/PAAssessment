// styles-org-core.js: how DISC Work Styles are shared inside a company (W2), with no DOM or Firebase.
//   orgStyleSettings/{orgId}: { mode, teams: { teamId: { name, members: [uid], sees: [teamId] } } }, set by admins.
//   Modes:
//     none      private to each person (admins see nothing)
//     optional  each person chooses; what is shared, everyone in the company and its admins see
//     team      shared with your own team(s), the teams allowed to see them, and admins
//     all       shared with everyone in the company
//   In team and all modes the company decides: people are told before they start, and their result is shared.
//   For team mode, who may see whom is written out per person (orgStyleViews/{orgId}/viewers/{uid}: { uids }),
//   because security rules can't look through the teams; viewers() works it out.
// Tests: tests/styles-org-core.test.mjs.
(function (root) {
  var MODES = {
    none: { label: 'Not shared', about: 'Each person’s work style is private to them. Nobody else, admins included, sees it.' },
    optional: { label: 'Shared by choice', about: 'Each person chooses whether to share. What they share, everyone in the company and its admins can see.' },
    team: { label: 'Shared within teams', about: 'Everyone’s style is shared with their own team, any team you let see it, and admins. People are told before they start.' },
    all: { label: 'Shared with everyone', about: 'Everyone’s style is shared with the whole company. People are told before they start.' }
  };
  var ORDER = ['none', 'optional', 'team', 'all'];
  var MAX_TEAMS = 30, MAX_MEMBERS = 500, MAX_NAME = 60;
  function isId(s) { return typeof s === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(s); }
  function newTeamId() { var c = 'abcdefghijkmnpqrstuvwxyz23456789', s = 't'; for (var i = 0; i < 9; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }

  // Settings as saved: a known mode; teams with a name, members who are in the company (memberUids, when given) and
  // teams they may also see (existing teams, never themselves)
  function clean(raw, memberUids) {
    raw = raw || {};
    var mode = MODES[raw.mode] ? raw.mode : 'none', teams = {}, ids = Object.keys(raw.teams || {}).filter(isId).slice(0, MAX_TEAMS);
    var inCo = memberUids ? {} : null; (memberUids || []).forEach(function (u) { inCo[u] = 1; });
    ids.forEach(function (id) {
      var t = raw.teams[id] || {}, name = String(t.name || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
      if (!name) return;
      var seen = {}, members = (Array.isArray(t.members) ? t.members : []).filter(function (u) { if (!isId(u) || seen[u] || (inCo && !inCo[u])) return false; seen[u] = 1; return true; }).slice(0, MAX_MEMBERS);
      teams[id] = { name: name, members: members, sees: [] };
    });
    Object.keys(teams).forEach(function (id) {
      var s = (raw.teams[id] && Array.isArray(raw.teams[id].sees)) ? raw.teams[id].sees : [];
      teams[id].sees = s.filter(function (x, i) { return x !== id && teams[x] && s.indexOf(x) === i; });
    });
    return { mode: mode, teams: teams };
  }
  function teamsOf(settings, uid) { var t = (settings && settings.teams) || {}; return Object.keys(t).filter(function (id) { return t[id].members.indexOf(uid) > -1; }); }

  // Team mode: { uid: [uids they may see] } for everyone in a team. Your own team(s), and the teams your team(s) may see.
  function viewers(settings) {
    var t = (settings && settings.teams) || {}, out = {};
    Object.keys(t).forEach(function (id) {
      var see = {};
      [id].concat(t[id].sees || []).forEach(function (x) { (t[x] ? t[x].members : []).forEach(function (u) { see[u] = 1; }); });
      t[id].members.forEach(function (u) {
        var cur = out[u] || (out[u] = {});
        Object.keys(see).forEach(function (v) { if (v !== u) cur[v] = 1; });
      });
    });
    var res = {}; Object.keys(out).forEach(function (u) { res[u] = Object.keys(out[u]).sort(); });
    return res;
  }
  // Who can see this person's style, in words, for the notice they get
  function audience(settings, uid, orgName) {
    var mode = settings ? settings.mode : 'none', org = orgName || 'your company';
    if (mode === 'none') return 'Your work style is private to you. ' + org + ' keeps work styles unshared.';
    if (mode === 'all') return 'Everyone in ' + org + ' can see your work style. Your company chose this, so it is shared when you finish.';
    if (mode === 'optional') return 'You choose whether to share your work style with ' + org + '. If you do, everyone there and its admins can see it.';
    var t = settings.teams || {}, mine = teamsOf(settings, uid), also = [];
    Object.keys(t).forEach(function (id) { if (mine.indexOf(id) < 0 && t[id].sees.some(function (x) { return mine.indexOf(x) > -1; })) also.push(t[id].name); });
    if (!mine.length) return org + ' shares work styles within teams. You are not in a team yet, so only its admins can see yours.';
    return org + ' shares work styles within teams: your team (' + mine.map(function (id) { return t[id].name; }).join(', ') + ')' +
      (also.length ? ', ' + also.join(', ') : '') + ' and its admins can see yours. Your company chose this, so it is shared when you finish.';
  }
  // Should this person's style be on the company's copy?
  function shouldShare(mode, optIn) { return mode === 'team' || mode === 'all' || (mode === 'optional' && optIn === true); }
  // May they remove it themselves? Only where sharing is their choice (or nothing is shared).
  function canUnshare(mode) { return mode === 'none' || mode === 'optional'; }
  // The company's copy: name and scores only, never the answers
  function shareRecord(workStyle, name) {
    var s = workStyle && workStyle.scores || {}, k = ['d', 'i', 's', 'c'], scores = {};
    k.forEach(function (x) { var v = Math.round(+s[x] || 0); scores[x] = Math.max(0, Math.min(100, v)); });
    if (!workStyle || k.indexOf(workStyle.primary) < 0) return null;
    return { name: String(name || '').slice(0, 80), scores: scores, primary: workStyle.primary, secondary: k.indexOf(workStyle.secondary) > -1 ? workStyle.secondary : '' };
  }

  root.StylesOrgCore = { MODES: MODES, ORDER: ORDER, MAX_TEAMS: MAX_TEAMS, MAX_MEMBERS: MAX_MEMBERS, MAX_NAME: MAX_NAME, newTeamId: newTeamId,
    clean: clean, teamsOf: teamsOf, viewers: viewers, audience: audience, shouldShare: shouldShare, canUnshare: canUnshare, shareRecord: shareRecord };
})(typeof window !== 'undefined' ? window : globalThis);
