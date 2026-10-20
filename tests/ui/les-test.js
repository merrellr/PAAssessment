const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
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
    await window.markCompleteAndContinue();
    await sleep(600);
    const share = store['orgs/orgA/members/uLes'];
    const prog = store['progress/uLes'];
    t('the lesson is saved on the person\'s own progress as before', prog.courses['discovery-novice'] && prog.courses['discovery-novice'].completed.indexOf(5) > -1);
    const today = window.NotifyCore.dateKey(Date.now(), -new Date().getTimezoneOffset());
    t('the finished lesson is counted for today, for the weekly goal', prog.lessonLog && prog.lessonLog[today] === 1, JSON.stringify(prog.lessonLog));
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
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
