// Drives the real index.html (the free assessment): the locked "Enterprise" scenario question.
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const textOf = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const active = () => Array.prototype.map.call(document.querySelectorAll('[data-screen].active'), e => e.getAttribute('data-screen')).join(',');
const events = () => window.__posts.filter(p => p.action === 'funnel').map(p => p.event);

function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
}

(async function run(){
  try {
    await sleep(400);
    t('the analytics script is on the page but does nothing on a local test server', !!document.querySelector('script[src="analytics.js"]') && window.dataLayer === undefined && !document.querySelector('script[src*="googletagmanager"]'));
    t('the intro screen is showing', active() === 'intro' || /intro|start/.test(active()), active());
    document.querySelector('button[onclick="startQuiz()"]').click();
    await sleep(60);
    t('starting the assessment shows the questions', active() === 'quiz', active());

    // answer every question: the best option for the "high" scenario, the weakest for "low"
    const total = QUESTIONS.length;
    for (let i = 0; i < total; i++) {
      const opts = QUESTIONS[i].options.map(o => o.points);
      const want = scn === 'high' ? Math.max.apply(null, opts) : Math.min.apply(null, opts);
      document.querySelectorAll('#optionsWrap .option')[opts.indexOf(want)].click();
      await sleep(5);
      $('nextBtn').click();
      await sleep(30);
    }
    await sleep(150);

    if (scn === 'high') {
      t('someone who scored well on the AI questions sees the scenario question, locked', active() === 'scenarioLocked', active());
      const screen = document.querySelector('[data-screen="scenarioLocked"]');
      t('it shows the real question', /Your VP of Engineering/.test(textOf(screen)) && /write what you'd actually say to this VP/.test(textOf(screen)));
      t('it carries an Enterprise badge', /Enterprise/.test(textOf(screen.querySelector('.lock-badge'))));
      const ta = screen.querySelector('textarea');
      t('the answer box cannot be used', ta.disabled === true && ta.value === '');
      t('it says why, in plain words, and that the result is complete without it', /part of our Enterprise assessment/.test(textOf($('lockedScenarioNote'))) && /switched off in the free assessment/.test(textOf($('lockedScenarioNote'))) && /complete without it/.test(textOf($('lockedScenarioNote'))));
      const a = $('enterpriseContactLink');
      t('"Contact us about Enterprise" opens the request form for organizations in a new tab', a.getAttribute('href') === '/request-info?src=assessment-enterprise&who=org' && a.target === '_blank' && /noopener/.test(a.rel));
      t('the lock was noted as a drop-off signal', events().indexOf('scenarioLockedShown') > -1, events().join());
      a.addEventListener('click', e => e.preventDefault());
      a.click();
      t('clicking the contact link records that someone was interested', events().indexOf('enterpriseInterest') > -1, events().join());
      t('there is one obvious way on', $('lockedScenarioContinueBtn').textContent.trim() === 'See my results →' && !$('lockedScenarioContinueBtn').disabled);
      $('lockedScenarioContinueBtn').click();
      await sleep(400);
      t('it carries on to the results', active() === 'results', active());
      t('the result is saved to the sheet as a normal assessment (not as a funnel event)', window.__posts.some(p => p.action !== 'funnel' && p.tier) || events().indexOf('resultsViewed') > -1, JSON.stringify(window.__posts.map(p => p.action || 'row')));
      t('and the results were counted as viewed', events().indexOf('resultsViewed') > -1, events().join());
      t('no written answer was ever sent for grading', !document.querySelector('script[src*="gradeScenario"]'));
    } else {
      t('someone who did not score on the AI questions goes straight to their results, with no locked question', active() === 'results', active());
      t('and nothing about it was recorded', events().indexOf('scenarioLockedShown') === -1);
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  done();
})();
