/* Role targets on the page (needs roles-core.js): the editor on My Profile and the tile on My Learning. */
(function (root) {
  'use strict';
  const R = root.RolesCore;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STATUS = { above: ['Above target', 'rt-above'], met: ['On target', 'rt-met'], below: ['Not there yet', 'rt-below'], unknown: ['Take the assessment', 'rt-unknown'] };

  // The tile on My Learning: role, how many targets are met, one segment per area.
  function tile(res) {
    if (!res) return '<div class="rt-tile-body"><b>Set your role targets</b><span>Pick your role and see the level it calls for in each skill area.</span></div><span class="rt-tile-go" aria-hidden="true">→</span>';
    const segs = res.rows.map(r => '<i class="' + STATUS[r.status][1] + '" title="' + esc(r.label + ': ' + STATUS[r.status][0]) + '"></i>').join('');
    return '<div class="rt-tile-body"><span class="rt-eyebrow">Role targets</span><b>' + esc(res.role ? res.role.title : 'Your own targets') + '</b>' +
      '<span>' + res.met + ' of ' + res.total + ' on target' + (res.above ? ' · ' + res.above + ' above' : '') + '</span><span class="rt-segs" aria-hidden="true">' + segs + '</span></div>' +
      '<span class="rt-tile-go" aria-hidden="true">→</span>';
  }

  /* The editor. opts: { roles, roleId, lockedTitle (a company assigned the role), personal, assessment, courses,
     onSave: async ({ roleId, personal }) } */
  function editor(el, opts) {
    const state = { roleId: opts.roleId || '', personal: R.cleanTargets(opts.personal) };
    const groups = {};
    (opts.roles || []).forEach(r => { (groups[r.group] = groups[r.group] || []).push(r); });
    function paint(msg, ok) {
      const role = R.roleById(opts.roles, state.roleId);
      const res = R.evaluate(R.targetsFor(role, state.personal), R.levels(opts.assessment, opts.courses));
      const rowsByArea = {}; res.rows.forEach(r => { rowsByArea[r.area] = r; });
      const lv = R.levels(opts.assessment, opts.courses);
      let h = '<div class="rt-role">';
      if (opts.lockedTitle) h += '<span class="profile-field-label">Your role</span><p class="rt-locked"><b>' + esc(opts.lockedTitle) + '</b> <span>Set by your company admin</span></p>';
      else h += '<label class="profile-field-label" for="rtRole">Your role</label><select id="rtRole" class="text-input"><option value="">No role yet: only my own targets</option>' +
        Object.keys(groups).map(g => '<optgroup label="' + esc(g) + '">' + groups[g].map(r => '<option value="' + esc(r.id) + '"' + (r.id === state.roleId ? ' selected' : '') + '>' + esc(r.title) + '</option>').join('') + '</optgroup>').join('') + '</select>';
      h += '</div>';
      h += '<p class="rt-sum" aria-live="polite">' + (res.total ? '<b>' + res.met + ' of ' + res.total + '</b> on target' + (res.above ? ', <b>' + res.above + '</b> above' : '') : 'Pick a role, or raise a target below, to set your targets.') + '</p>';
      h += '<div class="rt-table" role="table" aria-label="Your targets by skill area"><div class="rt-row rt-head" role="row"><span role="columnheader">Skill area</span><span role="columnheader">Your target</span><span role="columnheader">Where you are</span></div>';
      R.AREAS.forEach(k => {
        const row = rowsByArea[k], roleT = role ? role.targets[k] || 0 : 0, mine = state.personal[k] || 0;
        const cur = lv[k];
        const opt = (n) => '<option value="' + n + '"' + ((Math.max(roleT, mine) || 0) === n ? ' selected' : '') + (n < roleT ? ' disabled' : '') + '>' + (n ? R.LEVELS[n - 1] + (n === roleT ? ' (role)' : '') : 'No target') + '</option>';
        const st = row ? STATUS[row.status] : null;
        h += '<div class="rt-row" role="row"><span role="cell" class="rt-area">' + esc(R.AREA_LABELS[k]) + '</span>' +
          '<span role="cell"><select class="text-input rt-pick" data-area="' + k + '" aria-label="Target for ' + esc(R.AREA_LABELS[k]) + '">' + (roleT ? '' : opt(0)) + [1, 2, 3, 4].map(opt).join('') + '</select>' +
          (row && row.source === 'personal' && roleT ? '<small class="rt-raised">Raised by you</small>' : '') + '</span>' +
          '<span role="cell">' + (st ? '<span class="rt-chip ' + st[1] + '">' + st[0] + '</span>' : '') +
          '<small>' + (cur.level ? esc(R.LEVELS[cur.level - 1]) + (cur.by === 'course' ? ' · course finished' : ' · assessment') : 'Not yet known') + '</small>' +
          (row && row.status === 'below' ? '<a class="rt-next" href="/lesson?course=' + esc(row.course) + '">Course for this level →</a>' : '') + '</span></div>';
      });
      h += '</div><p class="setting-hint">A target is reached by the assessment placing you at that level, or by finishing that level\'s course. You can raise a target above your role\'s, never lower it.</p>' +
        '<div class="field-error" id="rtMsg"' + (ok ? ' style="color:var(--ok);"' : '') + '>' + esc(msg || '') + '</div><button type="button" class="btn btn-primary" id="rtSave">Save targets</button>';
      el.innerHTML = h;
      const sel = el.querySelector('#rtRole');
      if (sel) sel.addEventListener('change', () => { state.roleId = sel.value; paint(); });
      el.querySelectorAll('.rt-pick').forEach(s => s.addEventListener('change', () => {
        const k = s.getAttribute('data-area'), n = Number(s.value), roleT = role ? role.targets[k] || 0 : 0;
        if (n > roleT) state.personal[k] = n; else delete state.personal[k];
        paint();
        const again = el.querySelector('.rt-pick[data-area="' + k + '"]'); if (again) again.focus();
      }));
      el.querySelector('#rtSave').addEventListener('click', async (e) => {
        e.currentTarget.disabled = true;
        try { await opts.onSave({ roleId: opts.lockedTitle ? opts.roleId : state.roleId, personal: Object.assign({}, state.personal) }); paint('Saved. Your badges and My Learning use these targets now.', true); }
        catch (err) { paint("Your targets couldn't be saved just now. Please try again."); }
      });
    }
    paint();
    return state;
  }

  root.RolesUI = { tile, editor };
})(typeof window !== 'undefined' ? window : globalThis);
