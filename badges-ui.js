/* My Badges on screen: the full collection (My Profile, and the My Badges window on My Learning),
   the summary tile on My Learning, and a badge up close. Needs badges-core.js (and badges.css).
   Pages pass in the list from BadgesCore.evaluate; saving earned dates stays with the page. */
(function (root) {
  'use strict';
  const B = root.BadgesCore;
  const METAL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const when = (iso, long) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: long ? 'long' : 'short', year: 'numeric' });
  const bar = (b) => '<div class="bd-mini" aria-hidden="true"><span style="width:' + b.pct + '%"></span></div>';
  const rank = (b) => B.BADGES.findIndex(x => x.id === b.id);
  /* Where to go to earn a badge not earned yet, by what it counts: [link, what to do there]. */
  const START = {
    assessed: ['/', 'Take the assessment'],
    profile: ['/profile#details', 'Add your company and role'],
    lessons: ['/lms-dashboard#courses', 'Pick your next lesson'],
    notes: ['/lms-dashboard#courses', 'Open a lesson and write a reflection'],
    activeDays: ['/lms-dashboard#courses', 'Do a lesson today'],
    goalWeeks: ['/profile#goals', 'Set your weekly goal'],
    goalStreak: ['/profile#goals', 'Set your weekly goal'],
    courses: ['/lms-dashboard#courses', 'Continue a course'],
    areasDone: ['/lms-dashboard#courses', 'See the courses in your plan'],
    planDone: ['/lms-dashboard#courses', 'See the courses in your plan'],
    areasAdvanced: ['/', 'Retake the assessment'],
    advancedOverall: ['/', 'Retake the assessment']
  };
  const startLink = (b, cls) => {
    const go = !b.have && START[b.metric];
    return go ? '<a class="' + cls + '" href="' + go[0] + '">' + esc(go[1]) + ' <span aria-hidden="true">→</span></a>' : '';
  };

  // The latest earned, newest first (on the same day, the harder badge first).
  function latest(list, n) {
    return list.filter(b => b.have).sort((x, y) => String(y.earnedAt || '').localeCompare(String(x.earnedAt || '')) || (rank(y) - rank(x))).slice(0, n);
  }

  /* The whole collection: summary panel, Up next, the filter and every badge by group.
     Clicking a badge (or Enter) opens it up close. */
  function render(el, list) {
    const sum = B.summary(list);
    const left = sum.total - sum.have;
    const top = latest(list, 3);
    let html = '<div class="bd-hero"><div><span class="bd-eyebrow">Your collection</span>' +
      '<div class="bd-count">' + sum.have + ' <small>of ' + sum.total + ' earned</small></div>' +
      '<div class="bd-bar" role="progressbar" aria-label="Badges earned" aria-valuemin="0" aria-valuemax="' + sum.total + '" aria-valuenow="' + sum.have + '"><span style="width:' + sum.pct + '%"></span></div>' +
      '<p class="bd-left">' + (left ? '<b>' + left + '</b> more to earn. Keep going!' : 'Every badge earned. Amazing!') + '</p></div>';
    if (top.length) {
      html += '<div class="bd-showcase"><div class="bd-stack">' + top.map(b => B.medalSvg(b, 56)).join('') + '</div><small><b>' + esc(top[0].title) + '</b>Your latest badge</small></div>';
    }
    html += '</div>';
    const next = B.upNext(list, 3);
    if (next.length) {
      html += '<div class="bd-next"><span class="bd-eyebrow">Up next</span><ul>' + next.map(b => '<li>' + B.medalSvg(b, 44) + '<div><b>' + esc(b.title) + '</b><p>' + esc(b.text) + '</p>' + bar(b) +
        '<span class="bd-togo">' + b.value + ' of ' + b.goal + ' · ' + (b.goal - b.value) + ' to go</span>' + startLink(b, 'bd-start') + '</div></li>').join('') + '</ul></div>';
    }
    const tabs = [['all', 'All', sum.total], ['have', 'Earned', sum.have], ['todo', 'Still to earn', left]];
    html += '<div class="bd-tabs" role="group" aria-label="Show badges">' + tabs.map(f => '<button type="button" data-f="' + f[0] + '" aria-pressed="' + (f[0] === 'all') + '">' + f[1] + '<em>' + f[2] + '</em></button>').join('') + '</div>';
    B.GROUPS.forEach(g => {
      const items = list.filter(b => b.group === g[0]);
      const got = items.filter(b => b.have).length;
      html += '<section class="bd-group" data-g="' + g[0] + '"><div class="bd-ghead"><h3>' + esc(g[1]) + '</h3><span class="bd-chip' + (got === items.length ? ' done' : '') + '">' + (got === items.length ? '✓ ' : '') + got + ' of ' + items.length + '</span></div><ul class="bd-grid">' +
        items.map(b => '<li class="bd-item' + (b.have ? ' is-on' : '') + '" data-id="' + b.id + '" data-have="' + (b.have ? 1 : 0) + '" tabindex="0" role="button" aria-haspopup="dialog" aria-label="' + esc(b.title + ' (' + METAL[b.metal] + '): ' + b.text + '. ' + (b.have ? (b.earnedAt ? 'Earned ' + when(b.earnedAt) : 'Earned') : 'Not earned yet, ' + b.value + ' of ' + b.goal)) + '">' +
          '<span class="bd-medal-wrap"><span class="bd-tilt">' + B.medalSvg(b, 76) + '</span><span class="bd-metal ' + b.metal + '">' + METAL[b.metal] + '</span></span>' +
          '<span class="bd-title">' + esc(b.title) + '</span><span class="bd-text">' + esc(b.text) + '</span>' +
          '<span class="bd-state">' + (b.have ? '✓ ' + (b.earnedAt ? 'Earned ' + when(b.earnedAt) : 'Earned') : bar(b) + b.value + ' of ' + b.goal) + '</span></li>').join('') + '</ul></section>';
    });
    el.innerHTML = html;
    el.querySelectorAll('.bd-tabs button').forEach(btn => btn.addEventListener('click', () => {
      const f = btn.dataset.f;
      el.querySelectorAll('.bd-tabs button').forEach(x => x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'));
      el.querySelectorAll('.bd-item').forEach(li => { li.hidden = (f === 'have' && li.dataset.have !== '1') || (f === 'todo' && li.dataset.have === '1'); });
      el.querySelectorAll('.bd-group').forEach(g => { g.hidden = !g.querySelector('.bd-item:not([hidden])'); });
    }));
    el.querySelectorAll('.bd-item').forEach(li => {
      const b = list.filter(x => x.id === li.dataset.id)[0];
      li.addEventListener('click', () => openDetail(b, li));
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(b, li); } });
    });
    tiltable(el);
  }

  /* The My Learning tile: the latest medals, "9 of 28 badges", a bar and the nearest next badge. */
  function tile(list) {
    const sum = B.summary(list);
    const top = latest(list, 3);
    const next = B.upNext(list, 1)[0];
    const show = top.length ? top : B.upNext(list, 3);
    return '<div class="bd-tile-medals bd-stack">' + show.map(b => B.medalSvg(b, 52)).join('') + '</div>' +
      '<div class="bd-tile-text"><span class="bd-eyebrow">My Badges</span>' +
      '<div class="bd-tile-count"><b>' + sum.have + '</b> of ' + sum.total + ' badges</div>' +
      '<div class="bd-bar" aria-hidden="true"><span style="width:' + sum.pct + '%"></span></div>' +
      '<p>' + (next ? 'Next: <b>' + esc(next.title) + '</b> · ' + next.value + ' of ' + next.goal : 'Every badge earned. Amazing!') + '</p></div>' +
      '<span class="bd-tile-go">View all <span aria-hidden="true">→</span></span>';
  }

  /* A window over the page holding the whole collection (My Learning). */
  let modalOpener = null;
  function openModal(list, opener) {
    let box = document.getElementById('badgesModal');
    if (!box) {
      box = document.createElement('div');
      box.id = 'badgesModal'; box.className = 'bd-modal'; box.hidden = true;
      box.innerHTML = '<div class="bd-modal-box" role="dialog" aria-modal="true" aria-labelledby="badgesModalTitle">' +
        '<div class="bd-modal-head"><h2 id="badgesModalTitle">My Badges</h2><a href="/profile#badges">Open on My Profile</a><button type="button" class="bd-x" aria-label="Close">×</button></div>' +
        '<div class="bd-modal-body" id="badgesModalBody"></div></div>';
      document.body.appendChild(box);
      box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.bd-modal-head .bd-x')) closeModal(); });
      box.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }
    render(document.getElementById('badgesModalBody'), list);
    box.querySelectorAll('.bd-next .bd-start').forEach(a => a.addEventListener('click', () => closeModal()));
    modalOpener = opener || null;
    box.hidden = false;
    document.documentElement.classList.add('bd-lock');
    box.querySelector('.bd-modal-head .bd-x').focus();
  }
  function closeModal() {
    const box = document.getElementById('badgesModal');
    if (!box || box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove('bd-lock');
    if (modalOpener) modalOpener.focus();
  }

  /* A badge up close: the medal large, what it is for, and when it was earned or how far along. */
  let detailOpener = null;
  function openDetail(b, opener) {
    if (!b) return;
    let box = document.getElementById('badgeDetail');
    if (!box) {
      box = document.createElement('div');
      box.id = 'badgeDetail'; box.className = 'bd-detail'; box.hidden = true;
      box.innerHTML = '<div class="bd-detail-box" role="dialog" aria-modal="true" aria-labelledby="badgeDetailTitle"><button type="button" class="bd-x" aria-label="Close">×</button><div id="badgeDetailBody"></div></div>';
      document.body.appendChild(box);
      box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.bd-x')) closeDetail(); });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); closeDetail(); }
        if (e.key === 'Tab') {   // keep the focus inside: Close, and the start link when there is one
          e.preventDefault();
          const f = Array.from(box.querySelectorAll('.bd-x, .bd-start')), i = f.indexOf(document.activeElement);
          f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
        }
      });
      tiltable(box);
    }
    const group = B.GROUPS.filter(g => g[0] === b.group)[0];
    document.getElementById('badgeDetailBody').innerHTML = '<span class="bd-tilt">' + B.medalSvg(b, 200) + '</span>' +
      '<span class="bd-metal ' + b.metal + '">' + METAL[b.metal] + ' · ' + esc(group ? group[1] : '') + '</span>' +
      '<h2 id="badgeDetailTitle">' + esc(b.title) + '</h2><p>' + esc(b.text) + '.</p>' +
      (b.have ? '<p class="bd-when">✓ Earned' + (b.earnedAt ? ' ' + when(b.earnedAt, true) : '') + '</p>'
        : bar(b) + '<p>' + b.value + ' of ' + b.goal + ' · ' + (b.goal - b.value) + ' to go</p>' + startLink(b, 'bd-start bd-start-btn'));
    // Following a link closes the windows, so a link to this same page (#courses) lands on the page, not behind them.
    document.querySelectorAll('#badgeDetailBody .bd-start').forEach(a => a.addEventListener('click', () => { closeDetail(); closeModal(); }));
    detailOpener = opener || null;
    box.hidden = false;
    box.querySelector('.bd-x').focus();
  }
  function closeDetail() {
    const box = document.getElementById('badgeDetail');
    if (!box || box.hidden) return;
    box.hidden = true;
    if (detailOpener) detailOpener.focus();
  }

  /* Medals lean toward the pointer, like turning a coin in your hand. Each .bd-tilt sets --rx and --ry. */
  function tiltable(el) {
    if (el.dataset.bdTilt || (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    el.dataset.bdTilt = '1';
    el.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.bd-item, .bd-detail-box');
      const t = card && card.querySelector('.bd-tilt');
      if (!t) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      t.classList.add('is-moving');
      t.style.setProperty('--ry', (x * 34).toFixed(1) + 'deg');
      t.style.setProperty('--rx', (-y * 28).toFixed(1) + 'deg');
    });
    el.addEventListener('pointerout', (e) => {
      const card = e.target.closest('.bd-item, .bd-detail-box');
      if (!card || card.contains(e.relatedTarget)) return;
      const t = card.querySelector('.bd-tilt');
      if (t) { t.classList.remove('is-moving'); t.style.removeProperty('--rx'); t.style.removeProperty('--ry'); }
    });
  }

  root.BadgesUI = { render, tile, openModal, closeModal, openDetail, closeDetail };
})(typeof globalThis !== 'undefined' ? globalThis : window);
