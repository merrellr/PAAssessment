// Listen & watch (listen.html): the episode list, the area filter, playing, speed, video and a link to one episode.
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function tourCheck(id, first){
  // the quick tour on this page: a click-through guide (tour.js), opening on its first step and closing with Esc
  const b = document.querySelector('[data-tour="' + id + '"]');
  t('a quick tour button (' + id + ')', !!b && !!b.getAttribute('data-guide'));
  if (!b) return;
  b.click(); await sleep(80);
  const pop = document.querySelector('.guide-pop');
  t('the tour opens on its first step: ' + first, !!pop && pop.querySelector('h2').textContent === first, pop ? pop.querySelector('h2').textContent : 'none');
  pop && pop.querySelector('.g-n').click(); await sleep(40);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(20);
  t('Esc closes the tour and focus returns to its button', !document.querySelector('.guide-pop, .guide-hole') && document.activeElement === b);
}
const $ = (id) => document.getElementById(id);
const all = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
const until = async (f, ms = 4000) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await sleep(50); } return false; };

(async function(){
  try {
    if (window.__scn === 'fail'){
      await until(() => /Couldn't load/.test($('episodes').textContent));
      t('if the episodes cannot be loaded, the page says so', /Couldn't load the episodes/.test($('episodes').textContent));
    } else {
      await until(() => all('.ep').length > 0);
      const cards = () => all('.ep');
      t('every episode is listed, newest first as published', cards().map(c => c.dataset.slug).join() === 'five-second-test,pm-copilots,feature-fallacy', cards().map(c => c.dataset.slug).join());
      t('each shows its topic, date and length', /Pricing · Nov 10, 2026 · 12 min/.test(cards()[0].textContent), cards()[0].querySelector('.ep-meta').textContent);
      t('and the skill areas it goes deeper on', /Product Strategy & Roadmapping/.test(cards()[0].querySelector('.ep-areas').textContent));
      const chips = all('#areaChips .chip');
      t('the filter offers All plus only the areas that have episodes', chips.map(c => c.textContent).join('|') === 'All|Customer & Market Discovery|Product Strategy & Roadmapping|AI Fluency — Organizational', chips.map(c => c.textContent).join('|'));
      chips[3].click(); await sleep(50);
      t('filtering by an area shows only its episodes', cards().map(c => c.dataset.slug).join() === 'pm-copilots' && /1 episode about AI Fluency/.test($('listStatus').textContent), $('listStatus').textContent);
      all('#areaChips .chip')[0].click(); await sleep(50);
      t('All brings everything back', cards().length === 3);

      if (window.__scn === 'hash'){
        await tourCheck('listen', 'Pick a topic');
        const c = $('feature-fallacy');
        t('a link to one episode highlights it', c.classList.contains('target'));
      } else {
        t('nothing plays until someone presses play', $('nowPlaying').hidden && $('audio').getAttribute('preload') === 'none');
        cards()[1].querySelector('.ep-play').click(); await sleep(100);
        t('Play opens the player at the bottom with that episode', !$('nowPlaying').hidden && $('nowTitle').textContent === 'PM Copilots' && /ep\.mp3$/.test($('audio').src) && $('nowLen').textContent === '6:40');
        try { localStorage.removeItem('pa-listen-speed'); } catch (e) {}
        $('nowSpeed').click();
        t('the speed button steps up and is remembered', $('nowSpeed').textContent === '1.25x' && $('audio').playbackRate === 1.25 && localStorage.getItem('pa-listen-speed') === '1.25');
        const watch = cards()[0].querySelector('.ep-watch');
        t('an episode with a video offers Watch; one without does not', !!watch && !cards()[1].querySelector('.ep-watch'));
        watch.click(); await sleep(50);
        const f = cards()[0].querySelector('.ep-video iframe');
        t('Watch shows the video in place, from YouTube without tracking cookies', !!f && /^https:\/\/www\.youtube-nocookie\.com\/embed\/abc123XYZ_-/.test(f.src) && $('audio').paused);
        cards()[2].querySelector('summary').click(); await sleep(30);
        t('chapters are listed with their start times', all('.ep-ch button', cards()[2]).map(b => b.textContent).join('|') === '0:00Introduction|1:00Next');
      }
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
