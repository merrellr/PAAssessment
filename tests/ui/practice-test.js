// Practice (practice.html): a short coached session in one area: questions from the practice bank, "why" after each
// answer, the coach adapting, every answer saved to the learner's answer log, and a recap with what to do next.
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const until = async (f, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await sleep(50); } return false; };
const answer = async (right) => {
  const q = window.CoachBank.questions.find(x => x.q === $('prQuestion').textContent);
  const i = right ? q.a : (q.a + 1) % q.o.length;
  $('prOpts').querySelectorAll('.pr-opt')[i].click(); await sleep(20);
  $('prSubmit').click(); await sleep(80);
  return q;
};

(async function(){
  try {
    await until(() => !$('prCard').hidden);
    if (window.__scn === 'charts') {
      t('a chart question: the chart, its numbers in a table, and a note that the data is fictional', !$('prChart').hidden && $('prChart').querySelector('svg[role="img"]') && $('prChart').querySelectorAll('.ch-data tbody tr').length >= 3 && /Fictional data/.test($('prChart').textContent) && /Reading the evidence/.test($('prTags').textContent));
      t('"How sure are you?" appears once an answer is picked', $('prSure').hidden && ($('prOpts').querySelector('.pr-opt').click(), !$('prSure').hidden));
      $('prSure').querySelector('[data-cf="2"]').click();
      const q = window.CoachBank.questions.find(x => x.q === $('prQuestion').textContent);
      $('prOpts').querySelectorAll('.pr-opt')[(q.a + 1) % q.o.length].click(); $('prSubmit').click(); await sleep(80);
      t('sure but wrong: a gentle flag to look again', /You were sure about this one/.test($('prWhy').textContent));
      await until(() => (window.__store['progress/uPr'].answers || []).length === 1);
      t('how sure is saved with the answer', window.__store['progress/uPr'].answers[0].cf === 2);
      $('prNext').click(); await sleep(60);
      t('the next chart, with "How sure" reset', !$('prChart').hidden && $('prSure').hidden && !$('prSure').querySelector('[aria-checked="true"]'));
      await answer(true); $('prNext').click(); await sleep(120);
      const done = $('prDone');
      t('the recap says how well confidence matched', !done.hidden && /How sure you were/.test(done.textContent) && /sure on 1 answer you missed/.test(done.textContent), done.textContent.slice(0, 300));
      t('Explain it back: the lesson from the miss, a box and a button that waits for a real answer', /Explain it back/.test(done.textContent) && $('prTbText') && $('prTbGo').disabled);
      let sent = null;
      window.PAAccount.backend = async (p) => { sent = p; return { ok: true, text: 'You got the main idea right [1].\n- Add the effort side\n- Give an example' }; };
      $('prTbText').value = 'Quick wins are features with high value and low effort, so you do them first.'; $('prTbText').dispatchEvent(new Event('input'));
      t('the button wakes up once there is enough to read', !$('prTbGo').disabled && /\d+ of 380/.test($('prTbN').textContent));
      $('prTbGo').click(); await until(() => /Compass on your explanation/.test($('prTbOut').textContent), 4000);
      t('it asks Compass with the explanation as the last turn and the lesson as the page', sent && sent.action === 'compass' && /Teach-back/.test(sent.q) && sent.q.length <= 400 && /Quick wins are features/.test(JSON.parse(sent.h)[0].t) && JSON.parse(sent.page).k === 'lesson', sent && JSON.stringify(sent).slice(0, 200));
      t('the feedback shows, without citation marks, with bullets', /You got the main idea right\./.test($('prTbOut').textContent) && !/\[1\]/.test($('prTbOut').textContent) && $('prTbOut').querySelectorAll('li').length === 2);
      window.PAAccount.backend = async () => ({ ok: false, error: 'daily_limit' });
      $('prTbGo').disabled = false; $('prTbGo').click(); await sleep(150);
      t('a daily limit is said plainly', /today’s Compass questions/.test($('prTbOut').textContent));
    }
    else if (window.__scn === 'area') {
      t('the session is in the area asked for, with its goal and progress', $('prTitle').textContent === 'Prioritization & Trade-offs' && !$('prGoal').hidden && /1 of 3/.test($('prPips').textContent), $('prPips').textContent);
      t('the coach says what it picked and why', /Let's work on Prioritization & Trade-offs/.test($('prSayText').textContent) && /3 questions; after each one I'll explain why/.test($('prSayText').textContent), $('prSayText').textContent);
      t('the question shows its kind, level and the lesson it is from', $('prTags').children.length === 3 && /From: Lesson \d+/.test($('prTags').textContent), $('prTags').textContent);
      t('Check my answer waits for a choice', $('prSubmit').disabled);
      const q1 = await answer(false);
      t('a miss is marked, the right answer shown, and why, with the lesson to read', !!$('prOpts').querySelector('.pr-opt.wrong') && !!$('prOpts').querySelector('.pr-opt.right') && /Not quite/.test($('prWhy').textContent) && $('prWhy').querySelector('a').getAttribute('href') === '/lesson?course=' + q1.c + '&lesson=' + q1.l);
      await until(() => (window.__store['progress/uPr'].answers || []).length === 1);
      const saved = window.__store['progress/uPr'].answers;
      t('the answer is saved to the answer log, with its area, question and kind', saved.length === 1 && saved[0].d === 'prioritization' && saved[0].id === q1.id && saved[0].ok === false && saved[0].src === 'practice' && saved[0].t === q1.t, JSON.stringify(saved));
      $('prNext').click(); await sleep(60);
      const q2 = await answer(false);
      t('two misses in a row: the coach offers to slow down or teach the idea first', !$('prOffer').hidden && /two misses in a row/.test($('prOffer').textContent) && $('prTeach').getAttribute('href') === '/lesson?course=' + q2.c + '&lesson=' + q2.l);
      $('prSlow').click(); await sleep(60);
      t('slowing down: noted in How I\'m adapting, and the next question is about the idea itself', /stepping back/.test($('prAdapt').textContent) && /Understanding the idea/.test($('prTags').textContent), $('prTags').textContent);
      t('a question is never repeated in a session', new Set([q1.id, q2.id, window.CoachBank.questions.find(x => x.q === $('prQuestion').textContent).id]).size === 3);
      await answer(true);
      $('prNext').click(); await sleep(80);
      t('after the last question: the recap, the area\'s status now, and what to do next', !$('prDone').hidden && /1 of 3 right/.test($('prDone').textContent) && /Prioritization & Trade-offs is now/.test($('prDone').textContent) && /What I'd do next/.test($('prDone').textContent), $('prDone').textContent.slice(0, 200));
      t('the readiness panel shows every area, this one marked', $('prAreas').querySelectorAll('.pr-area-row').length === 7 && /Prioritization/.test($('prAreas').querySelector('.cur').textContent));
      t('the other areas are links that switch the session to them', $('prAreas').querySelectorAll('a.pr-area-row').length === 6 && /\/practice\?area=/.test($('prAreas').querySelector('a.pr-area-row').getAttribute('href')));
    } else {
      t('with no area asked for, the coach picks the one to work on: Strategy', $('prTitle').textContent === 'Product Strategy & Roadmapping', $('prTitle').textContent);
      t('and leads with the kind of question being missed', /questions that apply it to a situation/.test($('prSayText').textContent) && /Applying it to a situation/.test($('prTags').textContent), $('prSayText').textContent);
      await answer(true); $('prNext').click(); await sleep(60); await answer(true);
      t('two right in a row: harder questions, noted', /moving up/.test($('prAdapt').textContent), $('prAdapt').textContent);
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
