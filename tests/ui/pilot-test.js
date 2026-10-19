// Drives the real owner-pilot.html (the pilot and customer tracker) against the fake Firebase.
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
const textOf = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const q = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
const shown = () => ['stateLoading', 'stateSignedOut', 'stateNotOwner', 'stateNoOrg', 'page'].filter(id => !$(id).hidden).join(',');
async function until(cond, ms = 4000){ const s = Date.now(); while (Date.now() - s < ms){ if (cond()) return true; await sleep(30); } return false; }
const store = () => window.__store;
const pilotDoc = () => store()['orgPilot/orgA'];
const logDocs = () => Object.keys(store()).filter(k => /^orgPilot\/orgA\/log\//.test(k)).map(k => Object.assign({ key: k }, store()[k]));
const todayStr = () => new Date().toISOString().slice(0, 10);
const setVal = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
const item = (id) => document.getElementById('chk_' + id);
const phaseCount = (ph) => textOf(document.querySelector('details.phase[data-phase="' + ph + '"] .count'));
let confirmAnswer = true;
window.confirm = () => confirmAnswer;
let printed = 0; window.print = () => { printed++; };

function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
}

(async function run(){
  try {
    await until(() => shown() !== 'stateLoading', 4000);
    await sleep(350);

    if (scn === 'signedout'){ t('a signed-out visitor is asked to sign in', shown() === 'stateSignedOut'); }
    else if (scn === 'notowner'){ t('anyone but the owner is turned away and sees no company data', shown() === 'stateNotOwner' && !/Acme/.test(document.body.textContent)); }
    else if (scn === 'noorg'){ t('with no company chosen, the owner is sent to the console', shown() === 'stateNoOrg' && /Choose a company/.test(txt('noOrgTitle'))); }
    else if (scn === 'notfound'){ t('a company that does not exist is reported plainly', shown() === 'stateNoOrg' && /Company not found/.test(txt('noOrgTitle'))); }
    else if (scn === 'fresh'){
      t('the page opens for a company with no pilot record yet', shown() === 'page' && txt('orgName') === 'Acme Health');
      t('it starts as a prospect', $('stageSelect').value === 'prospect' && q('#stageStrip .step.current').map(textOf).join() === 'Prospect');
      t('nothing is saved just by looking', !pilotDoc());
      t('it suggests adding goals and a start date', /goals/.test(txt('nextList')) && /start date/.test(txt('nextList')) && q('#nextList li').length === 2, txt('nextList'));
      t('no health check yet, and it says when one appears', /once the company becomes a customer/.test(txt('healthReasons')) && $('healthPill').children.length === 0);
      t('"Before and after" asks for a baseline', /No baseline yet/.test(txt('beforeAfter')));
      $('defaultGoalsBtn').click(); await sleep(20);
      t('"Use the standard three" fills in assessed 90, started 60, plan 25', q('#goalsList .goal').map(g => g.getAttribute('data-goal')).join() === 'assessed_pct,started_pct,plan_pct' && q('#goalsList input[type=number]').map(i => i.value).join() === '90,60,25');
      $('saveDetailsBtn').click(); await sleep(150);
      t('saving creates the record with those goals', !!pilotDoc() && pilotDoc().stage === 'prospect' && pilotDoc().goals.length === 3 && pilotDoc().goals[0].target === 90 && !!pilotDoc().updatedAt, JSON.stringify(pilotDoc()));
    }
    else if (scn === 'customer'){
      t('the page opens for a customer', shown() === 'page' && $('stageSelect').value === 'active');
      t('a health check is shown, with a label and reasons', $('healthPill').textContent.trim() !== '' && q('#healthReasons li').length >= 2, txt('healthReasons'));
      t('it says no next check-in is set', /No next check-in is set/.test(txt('healthReasons')));
      t('and that few seats are in use', /Only 5 of 20 seats are in use/.test(txt('healthReasons')), txt('healthReasons'));
      t('the problems become the next steps (at most three)', q('#nextList li').length > 0 && q('#nextList li').length <= 3 && /check-in/.test(txt('nextList')), txt('nextList'));
      t('the customer run book is the one that is open', document.querySelector('details.phase[open]').getAttribute('data-phase') === 'grow');
    }
    else if (scn === 'saverefused'){
      t('the page opens', shown() === 'page');
      item('check1').click(); await sleep(200);
      t('if the security rules refuse the save, it says so and puts the box back', /could not be saved/.test(txt('errorLine')) && item('check1').checked === false && pilotDoc().done.indexOf('check1') === -1, txt('errorLine'));
    }
    else if (scn === 'snapfail'){
      t('if the weekly snapshot cannot be saved, the page works as normal', shown() === 'page' && txt('errorLine') === '' && /Pilot running/.test(q('#stageStrip .step.current').map(textOf).join()));
    }
    else if (scn === 'deniedpilot'){
      t('if the timeline cannot be read, the rest of the page still works', shown() === 'page' && /Nothing yet/.test(txt('logList')));
    }
    else if (scn === 'main'){
      t('the page opens for the owner', shown() === 'page' && txt('orgName') === 'Acme Health' && /20 seats/.test(txt('orgSub')) && /Pat Sponsor/.test(txt('orgSub')), txt('orgSub'));
      t('there are links back to the console and across to the team dashboard', $('ownerBackLink').getAttribute('href') === '/owner' && $('teamLink').getAttribute('href') === '/company?org=orgA');
      t('the Profile menu is there too', !!$('paAccountBtn'));
      const steps = q('#stageStrip .step');
      t('seven stages are shown, the current one marked, earlier ones ticked', steps.length === 7 && steps[2].classList.contains('current') && steps[2].getAttribute('aria-current') === 'step' && steps[0].classList.contains('done') && steps[1].classList.contains('done') && !steps[3].classList.contains('done'));
      t('the stage selector shows the same and its hint explains the stage', $('stageSelect').value === 'pilot_running' && /taking the assessment and learning/.test(txt('stageHint')));
      t('the next check-in date is shown', $('checkinInput').value === pilotDoc().nextCheckin && $('checkinInput').value !== '');
      t('the next steps are the three that matter: invitation waiting, one not assessed, one quiet', q('#nextList li').length === 3 && /1 invitation is still waiting/.test(textOf(q('#nextList li')[0])) && /1 person has not taken the assessment yet/.test(textOf(q('#nextList li')[1])) && /1 person is quiet/.test(textOf(q('#nextList li')[2])), txt('nextList'));

      const phases = q('details.phase');
      t('the run book has six phases, with the current one open and the others closed', phases.length === 6 && phases.filter(d => d.hasAttribute('open')).map(d => d.getAttribute('data-phase')).join() === 'run');
      t('while the pilot runs, 4 of 9 are already done by the numbers', phaseCount('run') === '4 of 9', phaseCount('run'));
      t('and before the pilot, 4 of 8 (two ticked by hand, two automatic)', phaseCount('plan') === '4 of 8', phaseCount('plan'));
      t('automatic items are ticked for you and cannot be changed by hand', item('invited').checked && item('invited').disabled && item('baseline').checked && item('joined').checked && !item('assessed').checked && item('assessed').disabled && item('started').checked);
      t('items you tick yourself can be changed', !item('check1').disabled && !item('check1').checked && item('goals').checked);
      const goals = q('#goalsList .goal');
      t('two goals, each judged against the live numbers', goals.length === 2 && /Not yet · 80% \(target 90%\)/.test(textOf(goals[0])) && /✔ Met · 60% \(target 60%\)/.test(textOf(goals[1])), goals.map(textOf).join(' | '));
      t('the details form shows what was saved', $('sponsorInput').value === 'Pat Sponsor' && $('sizeInput').value === '6' && $('startInput').value === pilotDoc().pilotStart && $('summaryNote').value === 'Going well so far.');
      t('the baseline is picked automatically and the page says which', /Using \d{4}-\d{2}-\d{2}\./.test(txt('baselineHint')) && $('baselineSelect').value === '');

      const ba = q('#beforeAfter tbody tr');
      t('before and after has a line per measure and per skill area', ba.length === 13 && /People in the company\s*4\s*5/.test(textOf(ba[0])) && /▲ \+1/.test(textOf(ba[0])), ba.length + ' ' + textOf(ba[0]));
      t('a rise in a score is shown as good, in points', /Average overall score/.test(textOf(ba[4])) && /▲ \+\d+ pts/.test(textOf(ba[4])) && ba[4].querySelector('.up'), textOf(ba[4]));
      t('average plan complete has a figure for today as well as the baseline', /Average plan complete\s*5%\s*\d+%/.test(textOf(ba[5])), textOf(ba[5]));
      t('the progress chart is drawn from the snapshots (baseline, a week ago, today)', !!$('trendChart').querySelector('svg') && $('trendChart').querySelectorAll('polyline').length === 3 && /Took the assessment/.test(txt('trendChart')), txt('trendChart'));
      const snaps = Object.keys(store()).filter(k => /^orgs\/orgA\/snapshots\//.test(k));
      t('opening the page saved this week\'s snapshot, because the last one was a week old', snaps.length === 3 && !!store()['orgs/orgA/snapshots/' + todayStr()] && store()['orgs/orgA/snapshots/' + todayStr()].people === 5 && store()['orgs/orgA/snapshots/' + todayStr()].assessed === 4);

      const logs = q('#logList .log-entry');
      t('the timeline lists notes newest first, with their kind', logs.length === 2 && /Two people stuck on sign-in/.test(textOf(logs[0])) && /call/i.test(textOf(logs[1])) && /Kickoff call/.test(textOf(logs[1])));

      /* ---- ticking a box ---- */
      item('check1').click(); await sleep(150);
      t('ticking an item saves it, and the count goes up', pilotDoc().done.indexOf('check1') > -1 && pilotDoc().done.indexOf('goals') > -1 && phaseCount('run') === '5 of 9' && /Saved/.test(txt('saveNotice')), phaseCount('run'));
      t('and it remembers it is the stage it was, with a new update time', pilotDoc().stage === 'pilot_running' && !!pilotDoc().updatedAt);
      item('check1').click(); await sleep(150);
      t('unticking removes it', pilotDoc().done.indexOf('check1') === -1 && phaseCount('run') === '4 of 9');

      /* ---- unsaved edits survive other actions ---- */
      setVal('sponsorInput', 'New Sponsor'); setVal('summaryNote', 'Edited note');
      item('remind').click(); await sleep(150);
      t('ticking a box while typing in the details form does not wipe out what was typed', $('sponsorInput').value === 'New Sponsor' && $('summaryNote').value === 'Edited note' && pilotDoc().done.indexOf('remind') > -1 && pilotDoc().sponsor === 'Pat Sponsor');
      const g0 = q('#goalsList input[type=number]')[0];
      g0.value = '80'; g0.dispatchEvent(new Event('input', { bubbles: true }));
      setVal('endInput', '2020-01-01');
      $('saveDetailsBtn').click(); await sleep(100);
      t('an end date before the start date is refused, nothing is saved', /cannot end before it starts/.test(txt('errorLine')) && pilotDoc().sponsor === 'Pat Sponsor' && pilotDoc().pilotEnd !== '2020-01-01');
      setVal('endInput', pilotDoc().pilotEnd);
      g0.value = '150'; g0.dispatchEvent(new Event('input', { bubbles: true }));
      $('saveDetailsBtn').click(); await sleep(100);
      t('a goal over 100 is refused', /between 0 and 100/.test(txt('errorLine')) && pilotDoc().goals[0].target === 90);
      g0.value = '80'; g0.dispatchEvent(new Event('input', { bubbles: true }));
      $('saveDetailsBtn').click(); await sleep(200);
      t('saving keeps the edits: sponsor, note and the new goal target', pilotDoc().sponsor === 'New Sponsor' && pilotDoc().summaryNote === 'Edited note' && pilotDoc().goals[0].target === 80 && pilotDoc().goals[0].metric === 'assessed_pct' && /Saved/.test(txt('saveNotice')));
      t('the goal is now met, because 80% reaches the new target', /✔ Met · 80% \(target 80%\)/.test(textOf(q('#goalsList .goal')[0])));
      t('the saved record has only the fields the rules allow', Object.keys(pilotDoc()).sort().join() === 'baselineDay,done,goals,nextCheckin,pilotEnd,pilotSize,pilotStart,renewalDate,sponsor,stage,summaryNote,updatedAt', Object.keys(pilotDoc()).join());

      /* ---- goals ---- */
      $('addGoalBtn').click(); await sleep(20);
      t('adding a goal picks a measure not already used, with its usual target', q('#goalsList .goal').length === 3 && q('#goalsList .goal')[2].getAttribute('data-goal') === 'joined_pct' && q('#goalsList input[type=number]')[2].value === '80', q('#goalsList .goal').map(g => g.getAttribute('data-goal')).join());
      q('#goalsList .goal button')[2].click(); await sleep(20);
      t('a goal can be removed', q('#goalsList .goal').length === 2);
      for (let i = 0; i < 6; i++) { $('addGoalBtn').click(); }
      t('each measure can be used once, so there are at most seven goals', q('#goalsList .goal').length === 7, String(q('#goalsList .goal').length));
      $('defaultGoalsBtn').click(); await sleep(20);
      t('"Use the standard three" resets them', q('#goalsList .goal').length === 3);
      $('saveDetailsBtn').click(); await sleep(200);
      t('and saving stores them', pilotDoc().goals.length === 3 && pilotDoc().goals[2].metric === 'plan_pct' && pilotDoc().goals[0].target === 90);

      /* ---- stage ---- */
      setVal('stageSelect', 'pilot_review'); await sleep(250);
      t('moving to the review stage saves it, adds a timeline entry and says so', pilotDoc().stage === 'pilot_review' && logDocs().some(l => l.kind === 'stage' && /Moved to Pilot review/.test(l.text)) && /Moved to Pilot review/.test(txt('saveNotice')), txt('saveNotice'));
      t('the strip, hint and run book follow the stage', q('#stageStrip .step.current').map(textOf).join() === 'Pilot review' && /Reading out the results/.test(txt('stageHint')) && document.querySelector('details.phase[open]').getAttribute('data-phase') === 'review');
      t('the timeline shows the move at the top', /Moved to Pilot review/.test(textOf(q('#logList .log-entry')[0])));
      setVal('stageSelect', 'onboarding'); await sleep(250);
      t('moving to onboarding switches on the health check', pilotDoc().stage === 'onboarding' && $('healthPill').textContent.trim() !== '' && q('#healthReasons li').length >= 1, $('healthPill').textContent);
      t('and the customer run book opens', document.querySelector('details.phase[open]').getAttribute('data-phase') === 'onboard');
      setVal('stageSelect', 'pilot_running'); await sleep(250);

      /* ---- check-in, baseline ---- */
      setVal('checkinInput', '2027-01-15'); await sleep(200);
      t('changing the next check-in saves it straight away', pilotDoc().nextCheckin === '2027-01-15' && /check-in saved/i.test(txt('saveNotice')));
      const snapsBefore = Object.keys(store()).filter(k => /^orgs\/orgA\/snapshots\//.test(k)).length;
      $('baselineBtn').click(); await sleep(250);
      t('"Save a baseline today" uses today\'s snapshot (already saved), sets it as the baseline and logs it', pilotDoc().baselineDay === todayStr() && Object.keys(store()).filter(k => /^orgs\/orgA\/snapshots\//.test(k)).length === snapsBefore && logDocs().some(l => /Saved a baseline/.test(l.text)) && /Using /.test(txt('baselineHint')), txt('baselineHint'));
      t('and the before-and-after now compares with today', /saved on \d{4}-\d{2}-\d{2}/.test(txt('baSub')) && $('baselineSelect').value === todayStr());

      /* ---- timeline ---- */
      $('logAddBtn').click(); await sleep(20);
      const logsBefore = logDocs().length;
      t('an empty entry is refused with a hint, and nothing is saved', /Write what happened first/.test(txt('logError')) && logDocs().length === logsBefore);
      setVal('logKind', 'meeting'); setVal('logText', 'Mid-point meeting: sponsor happy, wants the report printed.');
      $('logAddBtn').click(); await sleep(150);
      const added = logDocs().filter(l => l.kind === 'meeting')[0];
      t('an entry is saved with its kind and shown at the top', !!added && added.text.indexOf('Mid-point meeting') === 0 && !!added.at && logDocs().length === logsBefore + 1 && /Mid-point meeting/.test(textOf(q('#logList .log-entry')[0])) && $('logText').value === '');
      confirmAnswer = false;
      q('#logList .log-entry button')[0].click(); await sleep(80);
      t('deleting asks first, and "cancel" keeps it', logDocs().length === logsBefore + 1);
      confirmAnswer = true;
      q('#logList .log-entry button')[0].click(); await sleep(120);
      t('confirming deletes it', logDocs().length === logsBefore && !logDocs().some(l => l.kind === 'meeting'));

      /* ---- the printed summary ---- */
      $('printBtn').click();
      const area = $('printArea');
      t('the pilot summary is built and printed', printed === 1 && document.body.classList.contains('printing-summary') && /Pilot summary: Acme Health/.test(textOf(area.querySelector('h1'))));
      t('it has the plain sentences, the goals and the before-and-after', /took part/.test(textOf(area)) && /Goals/.test(textOf(area)) && /Met|Not yet/.test(textOf(area)) && /People in the company/.test(textOf(area)));
      t('it never includes the private timeline or the health check', !/Kickoff call|stuck on sign-in|Needs attention|Healthy|At risk|Next steps/.test(textOf(area)));
      t('it carries the owner\'s summary note and names the sponsor', /Edited note/.test(textOf(area)) && /New Sponsor/.test(textOf(area)));
      window.dispatchEvent(new Event('afterprint'));
      t('and the page returns to normal afterwards', !document.body.classList.contains('printing-summary'));
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  done();
})();
