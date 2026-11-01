const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const all = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

// The flagship course's richer blocks and the course outline, lesson by lesson.
async function blockTests(){
  const lesson = Number(new URLSearchParams(location.search).get('lesson'));
  const types = all('#lessonBody [data-block]').map(b => b.dataset.block);
  const rail = $('lessonRail');
  t('the course outline lists every lesson, with this one marked', all('.rail-list a', rail).length === 5 && rail.querySelector('[aria-current="page"]').getAttribute('href').endsWith('&lesson=' + lesson));
  if (lesson === 2){
    // the quick check: a wrong pick gets a red cross, the right answer a green tick
    const box = $('checkContainer').querySelector('.check-box');
    const opts = all('.check-option', box);
    t('quick-check answers start with an empty ring', opts.length > 1 && opts.every(o => o.querySelector('.check-mark') && !o.classList.contains('correct')));
    const right = opts.findIndex((o, i) => i === (window.CONTENT_OVERRIDES['discovery-novice'].lessons[1].checks || [window.CONTENT_OVERRIDES['discovery-novice'].lessons[1].check])[0].correct);
    const wrong = opts.findIndex((o, i) => i !== right);
    opts[wrong].click(); await sleep(30);
    t('a wrong pick shows a red cross, the right answer a green tick, and the feedback says "Not quite"', opts[wrong].classList.contains('incorrect') && /M7 7l10 10/.test(opts[wrong].querySelector('.check-mark').innerHTML) && opts[right].classList.contains('correct') && !!box.querySelector('.check-verdict.bad') && /Not quite/.test(box.querySelector('.check-feedback').textContent) && /your answer, incorrect/.test(opts[wrong].textContent));
  }
  if (lesson === 1){
    const layout = $('lessonLayout'), close = rail.querySelector('[data-rail="close"]');
    try { localStorage.removeItem('pa_rail_collapsed'); } catch (e) {}
    close.click(); await sleep(30);
    const mini = rail.querySelector('.rail-mini');
    t('the outline collapses to a slim strip: progress, and a dot per lesson linking to it', layout.classList.contains('rail-collapsed') && localStorage.getItem('pa_rail_collapsed') === '1' && all('.mini-list a', mini).length === 5 && /\/5$/.test(mini.querySelector('.mini-count').textContent) && mini.querySelector('[aria-current="page"]') && document.activeElement === rail.querySelector('[data-rail="open"]'));
    rail.querySelector('[data-rail="open"]').click(); await sleep(30);
    t('and opens again (remembered on this browser)', !layout.classList.contains('rail-collapsed') && localStorage.getItem('pa_rail_collapsed') === null && document.activeElement === rail.querySelector('[data-rail="close"]'));
  }
  t('the lesson line says where you are and how long it takes', new RegExp('Lesson ' + lesson + ' of 5').test($('lessonMeta').textContent) && /About \d+ min/.test($('lessonMeta').textContent), $('lessonMeta').textContent);
  t('the course name uses the dashboard\'s level names', /Limited Experience/.test($('courseTitle').textContent), $('courseTitle').textContent);
  t('every lesson opens with its story', types[0] === 'story');
  if (lesson === 1){
    const story = document.querySelector('[data-block="story"]');
    const hidden = () => all('.lb-beat', story).filter(b => b.hidden).length;
    t('the story pauses part-way, with a button to continue', hidden() > 0 && !!story.querySelector('.lb-more'));
    story.querySelector('.lb-more').click(); await sleep(30);
    t('"What happens next?" shows the rest and moves focus to it', hidden() === 0 && !story.querySelector('.lb-more') && story.contains(document.activeElement));
    t('lesson 1 has the comparison, the statistic with its source and the sorting exercise', types.indexOf('compare') > -1 && /Pendo/.test(document.querySelector('[data-block="stat"]').textContent) && types.indexOf('sort') > -1);
    const sort = document.querySelector('[data-block="sort"]');
    const items = all('.lb-sort-item', sort);
    items[0].querySelector('[data-bucket="problem"]').click();   // wrong: bulk edit is a solution
    t('a wrong pick is marked, shows the right answer and explains why', items[0].classList.contains('is-wrong') && !!items[0].querySelector('.is-answer[data-bucket="solution"]') && /Not quite/.test(items[0].querySelector('.lb-sort-fb').textContent));
    t('an answered item cannot be changed', all('button', items[0]).every(b => b.disabled));
    items[1].querySelector('[data-bucket="problem"]').click();
    t('a right pick says so', items[1].classList.contains('is-right') && /^Right/.test(items[1].querySelector('.lb-sort-fb').textContent));
    items.slice(2).forEach(li => li.querySelector('.lb-chip').click());
    t('when every item is answered, the score appears', /^You got \d of 6\./.test(sort.querySelector('.lb-score').textContent), sort.querySelector('.lb-score').textContent);
  }
  if (lesson === 2){
    t('lesson 2 has personas for the user, the buyer and the one who can say no', all('.lb-persona').length === 3 && /Does the work/.test(document.querySelector('[data-block="personas"]').textContent));
    const sc = document.querySelector('[data-block="scenario"]');
    const choices = all('.lb-choice', sc);
    choices[1].click();
    t('a scenario choice shows its outcome', choices[1].getAttribute('aria-pressed') === 'true' && sc.querySelector('.lb-outcome').classList.contains('is-good') && /Strong move/.test(sc.querySelector('.lb-outcome').textContent));
    choices[0].click();
    t('other choices can be tried, and say why they are risky', choices[0].getAttribute('aria-pressed') === 'true' && choices[1].getAttribute('aria-pressed') === 'false' && sc.querySelector('.lb-outcome').classList.contains('is-bad'));
  }
  if (lesson === 3){
    const cv = document.querySelector('[data-block="curve"]');
    const input = cv.querySelector('input[type=range]');
    t('the curve starts at five people with the sweet-spot readout', input.value === '4' && /5 people.*84%/.test(cv.querySelector('.lb-readout').textContent), cv.querySelector('.lb-readout').textContent);
    input.value = '0'; input.dispatchEvent(new Event('input'));
    t('moving the slider moves the marker and changes the advice', /1 person.*31%/.test(cv.querySelector('.lb-readout').textContent) && /Too few/.test(cv.querySelector('.lb-readout').textContent));
    t('the chart has a data table for screen readers', cv.querySelectorAll('table.lb-sr tbody tr').length === 15);
    const mx = document.querySelector('[data-block="matrix"]');
    t('the competitor grid highlights the gap column and spells out each mark', mx.querySelectorAll('thead .is-gap').length === 1 && /Part-payments/.test(mx.querySelector('thead .is-gap').textContent) && /Does not/.test(mx.querySelector('tbody td').textContent + mx.textContent));
    t('the page does not scroll sideways', document.documentElement.scrollWidth <= innerWidth);
  }
  if (lesson === 4){
    const bars = document.querySelector('[data-block="bars"]');
    const rows = all('.lb-bar', bars);
    t('the pilot chart has four bars, the one that matters highlighted', rows.length === 4 && rows.filter(r => r.classList.contains('is-on')).length === 1 && rows[3].classList.contains('is-on'));
    t('fictional numbers are labelled as such', /Fictional numbers/.test(bars.textContent));
    rows[3].focus(); await sleep(20);
    const tip = document.querySelector('.lb-tip');
    t('a bar shows its value and detail on hover or focus', !!tip && !tip.hidden && /50%/.test(tip.textContent) && /part-payments/.test(tip.textContent));
    rows[3].blur();
    t('lesson 4 shows the ways to test an idea in order', all('.lb-step', document.querySelector('[data-block="flow"]')).length === 4);
  }
  if (lesson === 5){
    t('the failure reasons chart cites its source', /CB Insights/.test(document.querySelector('[data-block="bars"]').textContent));
    t('the reflection is still there at the end', !!document.querySelector('#reflectionContainer textarea'));
  }
}

async function lessonFlow(store){
  await window.markCompleteAndContinue();
  await sleep(600);
  const share = store['orgs/orgA/members/uLes'];
  const prog = store['progress/uLes'];
  t('the lesson is saved on the person\'s own progress as before', prog.courses['discovery-novice'] && prog.courses['discovery-novice'].completed.indexOf(5) > -1);
  const today = window.NotifyCore.dateKey(Date.now(), -new Date().getTimezoneOffset());
  t('the finished lesson is counted for today, for the weekly goal', prog.lessonLog && prog.lessonLog[today] === 1, JSON.stringify(prog.lessonLog));
  t('finishing the course shows the outline with every lesson done', all('#lessonRail .rail-list a.done').length === 5 && /5 of 5 lessons/.test($('lessonRail').textContent));
  await window.markCompleteAndContinue();
  await sleep(400);
  t('finishing the same lesson again does not count twice', store['progress/uLes'].lessonLog[today] === 1, JSON.stringify(store['progress/uLes'].lessonLog));
  if (window.__scn === 'member'){
    t('finishing the last lesson refreshes the company copy with all five lessons', !!share && share.courses['discovery-novice'] && share.courses['discovery-novice'].completed.length === 5 && share.courses['discovery-novice'].lastLesson === 5, JSON.stringify(share));
    t('last active moved forward to the lesson time', !!share && typeof share.lastActiveAt === 'string' && Date.parse(share.lastActiveAt) > Date.parse('2026-10-06T10:00:00.000Z'));
    t('the company copy never carries reflections or the phone number', !!share && !/PRIVATE|reflection|template|555-0100|profile/.test(JSON.stringify(share)), JSON.stringify(share));
  } else {
    t('a person with no company: finishing a lesson writes nothing for any company', Object.keys(store).filter(p => p.indexOf('orgs/') === 0).length === 0);
  }
}

// The article-style figures (lesson-figures.js): every slot in the lesson becomes a drawn figure.
async function figTests(){
  const figs = all('#lessonBody figure.pf');
  t('every figure slot in the lesson is drawn, none left empty', figs.length >= 1 && all('#lessonBody [data-fig]').length === 0, figs.length + ' figures');
  const title = figs[0] && figs[0].querySelector('.pf-title');
  t('a figure has a visible serif title, like the articles', !!title && title.offsetHeight > 0 && /Fraunces/.test(getComputedStyle(title).fontFamily), title && getComputedStyle(title).fontFamily);
  t('a figure sits on the cream card in light mode', getComputedStyle(figs[0]).backgroundColor === 'rgb(244, 242, 238)', getComputedStyle(figs[0]).backgroundColor);
  t('figures are text, not pictures: their words are in the page for readers and screen readers', figs.every(f => f.textContent.trim().length > 20));
  const course = new URLSearchParams(location.search).get('course');
  if (course === 'aiOrg-experienced'){
    t('the copilot metrics: four number tiles and eight weeks of columns', all('.pf-stat', figs[0]).length === 4 && all('.pf-colbar', figs[0]).length === 8 && /68%/.test(figs[0].textContent));
  }
  if (course === 'prioritization-novice'){
    t('the matrix: four labelled quadrants with the five example items plotted', all('.pf-quad').length === 4 && all('.pf-pt').length === 5 && /Money pits/.test($('lessonBody').textContent));
  }
  if (course === 'discovery-experienced'){
    const fig = figs[0], para = all('#lessonBody > p')[0], check = $('checkContainer'), r = (el) => el.getBoundingClientRect();
    t('the workflow is drawn: the product as a detour off one line, and as a step on the other', !!fig.querySelector('.pf-cl-detour .pf-detour') && !!fig.querySelector('.pf-cn-hl') && all('.pf-lane', fig).length === 2);
    t('one reading column: the figure, the text and the quick checks share the same left and right edges',
      Math.abs(r(fig).left - r(para).left) < 2 && Math.abs(r(fig).right - r(para).right) < 2 && Math.abs(r(check).left - r(para).left) < 2 && Math.abs(r(check).right - r(para).right) < 2,
      [r(fig).left, r(fig).right, r(para).left, r(para).right, r(check).left, r(check).right].map(Math.round).join(','));
    t('figure text keeps its own size, not the lesson paragraph size', getComputedStyle(fig.querySelector('.pf-foot')).fontSize !== getComputedStyle(para).fontSize);
  }
  if (course === 'aiIndividual-moderate'){
    const col = document.querySelector('.pf-col.pf-veiled'), btn = col && col.querySelector('.pf-reveal-btn');
    t('the "after" side waits behind a question, hidden from screen readers', !!btn && col.querySelector('.pf-veil').getAttribute('aria-hidden') === 'true' && /what changes/i.test(btn.textContent));
    btn.click(); await sleep(30);
    t('choosing Show me reveals it, for screen readers too, and moves focus there', !col.classList.contains('pf-veiled') && !col.querySelector('.pf-reveal-btn') && !col.querySelector('.pf-veil').hasAttribute('aria-hidden') && document.activeElement === col);
  }
  document.documentElement.setAttribute('data-theme', 'dark'); await sleep(50);
  t('in dark mode the figure turns dark too', getComputedStyle(figs[0]).backgroundColor === 'rgb(27, 33, 48)', getComputedStyle(figs[0]).backgroundColor);
}

(async function(){
  try {
    await sleep(2500);
    const store = window.__store;
    t('the lesson page loads without errors under the new import', typeof window.markCompleteAndContinue === 'function' && (window.__errs || []).length === 0, (window.__errs || []).join(' ; '));
    t('opening a lesson alone does not touch any company record', !store['orgs/orgA/members/uLes']);
    if (window.__scn === 'nav'){
      sessionStorage.removeItem('navlog');
      window.markCompleteAndContinue();   // this one changes the page; the browser tool reads the result afterwards
      return;
    }
    if (window.__scn === 'blocks') await blockTests();
    else if (window.__scn === 'figs') await figTests();
    else await lessonFlow(store);
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
