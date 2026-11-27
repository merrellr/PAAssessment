// The competency check (check.html): one question per competency, "why" after each, every answer on the answer log
// (src "check"), where they are kept on progress.check so they can pick up later, and a summary by domain at the end.
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const until = async (f, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await sleep(50); } return false; };
const Q = window.CompetencyCheck.questions;
const answer = async (right) => {
  const q = Q.find(x => x.q === $('ckQuestion').textContent);
  const i = right ? q.a : (q.a + 1) % q.o.length;
  $('ckOpts').querySelectorAll('.pr-opt')[i].click(); await sleep(20);
  $('ckSubmit').click(); await sleep(60);
  return q;
};
const prog = () => window.__store['progress/uCk'];

(async function(){
  try {
    await until(() => !$('ckIntro').hidden);
    if (window.__scn === 'resume') {
      t('picking up: the start button says where', /Pick up at question 31/.test($('ckStart').textContent), $('ckStart').textContent);
      $('ckStart').click(); await sleep(40);
      t('it starts at question 31 of 32', /Question 31 of 32/.test($('ckWhere').textContent) && $('ckQuestion').textContent === Q[30].q);
      await answer(true); $('ckNext').click(); await sleep(40);
      await answer(false);
      t('the last question offers the summary', /See how it went/.test($('ckNext').textContent));
      $('ckNext').click(); await sleep(60);
      t('the summary counts the whole check', !$('ckDone').hidden && /21 of 32 right/.test($('ckDone').textContent), $('ckDone').textContent.slice(0, 120));
      t('each of the seven domains has its line, the last two counted in', $('ckDone').querySelectorAll('.ck-areas li').length === 7 && /AI Fluency — Organizational\s*3 of 6 right/.test($('ckDone').textContent), $('ckDone').textContent.slice(0, 400));
      await until(() => prog().checkDoneAt);
      t('finishing is saved', !!prog().checkDoneAt && prog().check.i === 32);
      $('ckAgain').click(); await sleep(40);
      t('Take it again starts from question 1', /Question 1 of 32/.test($('ckWhere').textContent) && prog().check.i === 0);
    } else {
      t('the intro says how long and how many', /32<\/span> questions|32 questions/.test($('ckIntro').innerHTML.replace(/<span id="ckCount">/, '')) && /ten minutes/.test($('ckIntro').textContent) && /Start the check/.test($('ckStart').textContent));
      $('ckStart').click(); await sleep(40);
      t('question 1 of 32, with its competency and domain', /Question 1 of 32/.test($('ckWhere').textContent) && $('ckArea').textContent.indexOf(window.CompetencyCore.BY[Q[0].k].name) === 0, $('ckArea').textContent);
      t('Check my answer waits for a choice', $('ckSubmit').disabled);
      const q1 = await answer(false);
      t('a miss is marked, the right answer shown, and why', !!$('ckOpts').querySelector('.pr-opt.wrong') && !!$('ckOpts').querySelector('.pr-opt.right') && /Not quite/.test($('ckWhy').textContent) && $('ckWhy').textContent.indexOf(q1.x) > -1);
      await until(() => prog().answers.length === 2);
      const a = prog().answers[1];
      t('the answer goes on the answer log as a check answer (the earlier one kept)', prog().answers[0].src === 'lesson' && a.id === q1.id && a.src === 'check' && a.ok === false && a.d === q1.d, JSON.stringify(a));
      t('where they are is kept', prog().check.i === 1 && prog().check.done[0] === q1.id);
      $('ckNext').click(); await sleep(40);
      const q2 = await answer(true);
      t('question 2, right this time', /Question 2 of 32/.test($('ckWhere').textContent) && /Right/.test($('ckWhy').textContent) && q2.id === Q[1].id);
      t('check answers count towards My shape, for their own competency', JSON.stringify(window.CompetencyCore.forQuestion(q1)) === JSON.stringify([q1.k]));
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
