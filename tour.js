/* The 2-minute tour of Product Advisory Learning: any [data-tour] button opens a dialog with the tour video
   (audio/tours/<id>.mp4, downloaded only when opened) and a Just listen option (the .mp3). Made by the www site's
   src/audio/tours + make_tour.py + video/tour.mjs; see tools/lesson-audio/README.md. Used on the dashboard and
   Listen & watch. */
(function () {
  'use strict';
  const CSS = `
  .tour-btn{ display:inline-flex; align-items:center; gap:12px; margin:10px 0 4px; padding:7px 16px 7px 7px; border-radius:30px; border:1.5px solid var(--line, #e3e9f0); background:var(--surface, #fff); color:var(--ink, #16213e); font:inherit; text-align:left; cursor:pointer; box-shadow:0 6px 18px rgba(18,48,94,.08); }
  .tour-btn:hover{ border-color:var(--cyan, #35c2e8); }
  .tour-btn:focus-visible{ outline:3px solid var(--cyan, #35c2e8); outline-offset:2px; }
  .tour-play{ flex:none; display:grid; place-items:center; width:40px; height:40px; border-radius:50%; background:var(--primary, #1c4587); color:#fff; }
  .tour-play svg{ width:16px; height:16px; fill:currentColor; margin-left:2px; }
  .tour-btn b{ display:block; color:var(--navy, #1a4584); font-size:.9rem; }
  .tour-btn small{ display:block; color:var(--ink-soft, #4b5768); font-size:.75rem; }
  .tour-dialog{ width:min(1100px, calc(100% - 24px)); padding:0; border:0; border-radius:18px; background:#0b1f40; color:#fff; overflow:hidden; }
  .tour-dialog::backdrop{ background:rgba(6,16,34,.72); }
  .tour-bar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; padding:12px 14px 12px 18px; }
  .tour-bar b{ flex:1; color:#fff; }
  .tour-modes{ display:inline-flex; gap:4px; padding:3px; border-radius:20px; background:rgba(255,255,255,.1); }
  .tour-modes button{ min-height:34px; padding:0 14px; border:0; border-radius:17px; background:transparent; color:#c9d7ee; font:inherit; font-size:.85rem; font-weight:700; cursor:pointer; }
  .tour-modes button[aria-pressed="true"]{ background:#fff; color:#12305e; }
  .tour-close{ min-height:36px; padding:0 12px; border:0; border-radius:18px; background:rgba(255,255,255,.12); color:#fff; font:inherit; font-size:.85rem; font-weight:700; cursor:pointer; }
  .tour-dialog button:focus-visible{ outline:3px solid #35c2e8; outline-offset:2px; }
  .tour-dialog video{ display:block; width:100%; aspect-ratio:16/9; background:#000; }
  .tour-audio{ padding:26px 22px 30px; } .tour-audio p{ margin:0 0 14px; color:#c9d7ee; } .tour-audio audio{ width:100%; }`;

  function init() {
    const btns = document.querySelectorAll('[data-tour]');
    if (!btns.length || typeof HTMLDialogElement === 'undefined') return;
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    const dlg = document.createElement('dialog');
    dlg.className = 'tour-dialog';
    dlg.setAttribute('aria-label', 'The 2-minute tour');
    dlg.innerHTML = '<div class="tour-bar"><b>The 2-minute tour</b><span class="tour-modes" role="group" aria-label="Watch or listen">' +
      '<button type="button" data-mode="video" aria-pressed="true">Watch</button><button type="button" data-mode="audio" aria-pressed="false">Just listen</button></span>' +
      '<button type="button" class="tour-close" aria-label="Close">Close <span aria-hidden="true">&times;</span></button></div>' +
      '<video controls playsinline preload="none"></video><div class="tour-audio" hidden><p>Listen while you look around. It keeps playing if you close this.</p><audio controls preload="none"></audio></div>';
    document.body.appendChild(dlg);
    const video = dlg.querySelector('video'), audio = dlg.querySelector('audio'), aBox = dlg.querySelector('.tour-audio');
    let opener = null, tid = '';
    const track = (n) => { if (window.PAAnalytics) window.PAAnalytics.event(n, { tour: tid }); };
    function mode(m) {
      dlg.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)));
      video.hidden = m !== 'video'; aBox.hidden = m !== 'audio';
      if (m === 'audio') { const t = video.currentTime; video.pause(); if (t) audio.currentTime = t; audio.play().catch(() => {}); track('tour_listen'); }
      else { const u = audio.currentTime; audio.pause(); if (u) video.currentTime = u; video.play().catch(() => {}); }
    }
    dlg.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => mode(b.getAttribute('data-mode'))));
    dlg.querySelector('.tour-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { video.pause(); if (opener) opener.focus(); });
    btns.forEach(btn => btn.addEventListener('click', () => {
      opener = btn; tid = btn.getAttribute('data-tour');
      const base = '/audio/tours/' + tid;
      if (!video.src.endsWith(base + '.mp4')) { video.src = base + '.mp4'; video.poster = base + '.webp'; audio.src = base + '.mp3'; }
      dlg.showModal();
      if (aBox.hidden) video.play().catch(() => {});
      track('tour_open');
    }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
