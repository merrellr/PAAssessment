// Drives the real tool-requests.html (the public vote page) against the fake Firebase.
import { Timestamp } from './fake-firebase.js';
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const vis = (id) => $(id).style.display !== 'none';
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
const textOf = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
function setVal(id, v){ const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
async function until(cond, ms = 3000){ const s = Date.now(); while (Date.now() - s < ms){ if (cond()) return true; await sleep(30); } return false; }
const cards = () => Array.prototype.slice.call($('toolList').querySelectorAll('.tool'));
const card = (id) => $('toolList').querySelector('.tool[data-tool="' + id + '"]');
const btn = (c, label) => c && Array.prototype.find.call(c.querySelectorAll('button'), b => b.textContent.trim().indexOf(label) === 0);
const order = () => cards().map(c => c.getAttribute('data-tool')).join();
const count = (id) => Number(card(id).querySelector('.count .num').textContent);
const store = () => window.__store;

function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
}

(async function run(){
  try {
    await until(() => !/Loading the roadmap/.test($('toolList').textContent));
    await sleep(200);

    if (scn === 'anon'){
      t('the roadmap is visible without signing in', cards().length === 5);
      t('voting blind: before voting nobody sees the totals or bars, and the note says why', !document.querySelector('#toolList .count') && !document.querySelector('#toolList .bar') && !$('blindNote').hidden && $('toolList').classList.contains('blind'));
      t('the list follows the roadmap order, released last, so the order gives no totals away', order() === 't1,t2,t3,t4,t5', order());
      t('status and category are shown in plain words', /Under consideration/.test(textOf(card('t2'))) && /Planned/.test(textOf(card('t1'))) && /In progress/.test(textOf(card('t3'))) && /Released/.test(textOf(card('t5'))));
      t('the sign-in card is shown, and the signed-in bar is not', vis('authCard') && !vis('statusBar') && !vis('nextCard'));
      t('the request box is there for everyone, and says sending needs an account', vis('suggestCard') && $('suggestBtn').textContent === 'Sign in to send' && !$('suggestBtn').disabled && !$('suggestHint').hidden);
      try { sessionStorage.removeItem('pa_tool_request_draft'); } catch (e) {}
      setVal('suggestText', 'A churn early-warning checklist');
      const before = Object.keys(window.__store).filter(k => /^toolSuggestions\//.test(k)).length;
      $('suggestBtn').click(); await sleep(80);
      t('"Sign in to send" keeps the request and moves to sign-in, sending nothing yet', sessionStorage.getItem('pa_tool_request_draft') === 'A churn early-warning checklist' && /Saved/.test(txt('suggestStatus')) && document.activeElement === $('authTitle') && Object.keys(window.__store).filter(k => /^toolSuggestions\//.test(k)).length === before, txt('suggestStatus'));
      t('every open tool says "Sign in to vote"', ['t1', 't2', 't3', 't4'].every(id => !!btn(card(id), 'Sign in to vote')));
      t('a released tool links to it and offers no vote', card('t5').querySelector('a').getAttribute('href') === 'https://example.com/epsilon' && !btn(card('t5'), 'Sign in to vote'));
      t('nothing was written by looking at the page', window.__writeLog.length === 0);

      /* creating an account */
      $('tabSignup').click();
      t('Create account reveals name, confirm password and terms', $('authName').style.display === 'block' && $('termsRow').style.display === 'flex');
      {
        const links = Array.prototype.map.call(document.querySelectorAll('#termsRow a'), a => a.textContent + '=' + a.getAttribute('href'));
        t('the sign-up notice says "By creating an account you agree to the Terms of Use and Privacy Policy", both linked', /By creating an account you agree to the Terms of Use and Privacy Policy/.test($('termsRow').textContent.replace(/\s+/g, ' ')) && links.join() === 'Terms of Use=https://www.productadvisory.co/terms-of-use,Privacy Policy=https://www.productadvisory.co/privacy-policy', links.join());
        const g = Array.prototype.find.call(document.querySelectorAll('#authCard .small'), p => /continuing with account creation/.test(p.textContent)); t('the notice under the buttons covers both password and Google sign-up, both linked, and explains why we use the email', !!g && /By continuing with account creation, you agree to the Terms of Use and Privacy Policy\. We use your email address to make sure each person votes once and, only if you tick the box on a tool, to tell you when it launches\./.test(g.textContent.replace(/\s+/g, ' ')) && g.querySelectorAll('a').length === 2);
      }
      setVal('authEmail', 'new@person.com'); setVal('authPassword', 'longenough1');
      $('authSubmit').click(); await sleep(60);
      t('a name is required', /name/i.test(txt('authError')));
      setVal('authName', 'New Person'); setVal('authPasswordConfirm', 'different'); $('authSubmit').click(); await sleep(60);
      t('mismatched passwords are refused', /match/i.test(txt('authError')));
      setVal('authPasswordConfirm', 'longenough1'); $('authSubmit').click(); await sleep(60);
      t('the Terms must be accepted', /Terms/.test(txt('authError')));
      $('agreeTerms').checked = true; $('authSubmit').click(); await sleep(400);
      t('a new account gets its own progress record with the terms date', !!store()['progress/uCreated'] && !!store()['progress/uCreated'].agreedToTermsAt);
      t('and is asked to verify their email before voting', vis('verifyBanner') && !vis('authCard'));
    }

    if (scn === 'draft'){
      t('a request typed before signing in is back in the box, ready to send', $('suggestText').value === 'A churn early-warning checklist' && /ready/.test(txt('suggestStatus')) && $('suggestBtn').textContent === 'Send request' && !sessionStorage.getItem('pa_tool_request_draft'), txt('suggestStatus'));
      $('suggestBtn').click(); await sleep(150);
      t('and sending it saves it for review', !!window.__store['toolSuggestions/uFresh'] && window.__store['toolSuggestions/uFresh'].text === 'A churn early-warning checklist' && /waiting for review/.test(txt('suggestStatus')));
    }

    if (scn === 'fresh'){
      t('signed-in bar shows who they are and their votes', vis('statusBar') && /ufresh@Example\.com/i.test(txt('signedInAs')) && txt('votesLeft') === '3 votes left', txt('votesLeft'));
      t('the sign-in card is hidden and the suggestion box is shown', !vis('authCard') && vis('suggestCard'));
      t('no verify banner for a verified person', !vis('verifyBanner'));
      t('they are pointed at the assessment, because they have not taken it', vis('nextCard') && /take the assessment/i.test(txt('nextTitle')) && $('nextLink').getAttribute('href') === '/', txt('nextTitle'));
      t('open tools offer "Vote for this"', ['t1', 't2', 't3', 't4'].every(id => !!btn(card(id), 'Vote for this')));
      t('signed in but not voted yet: still blind', !document.querySelector('#toolList .count') && !$('blindNote').hidden && order() === 't1,t2,t3,t4,t5', order());

      window.__writeLog.length = 0;
      btn(card('t2'), 'Vote for this').click(); await until(() => !!store()['toolVotes/uFresh_t2']);
      await sleep(80);
      const v = store()['toolVotes/uFresh_t2'];
      t('voting saves one vote record: who, which tool, their lower-case email, no launch email yet, server time', !!v && v.uid === 'uFresh' && v.toolId === 't2' && v.email === 'ufresh@example.com' && v.notify === false && typeof v.createdAt.toMillis === 'function', JSON.stringify(v));
      t('and adds exactly one to the tool\'s count, in the same step', store()['tools/t2'].voteCount === 10 && window.__writeLog.map(w => w.op + ':' + w.path).sort().join() === 'set:toolVotes/uFresh_t2,update:tools/t2', window.__writeLog.map(w => w.op + ':' + w.path).join());
      t('the page shows the new total and that they voted', count('t2') === 10 && /Voted/.test(textOf(card('t2'))) && card('t2').classList.contains('voted'));
      t('having voted, they see every total and bar, ranked by votes', $('blindNote').hidden && count('t1') === 5 && count('t5') === 20 && order() === 't2,t1,t4,t3,t5' && card('t5').querySelector('.bar span').style.width === '100%' && card('t2').querySelector('.bar span').style.width === '50%', order());
      t('2 votes left', txt('votesLeft') === '2 votes left', txt('votesLeft'));
      t('the voter is thanked', /Your vote for Beta Map is in/.test(txt('notice')), txt('notice'));
      t('they can ask for a launch email, and it is off until they ask', !!card('t2').querySelector('input[type="checkbox"]') && card('t2').querySelector('input[type="checkbox"]').checked === false);

      const box = card('t2').querySelector('input[type="checkbox"]');
      box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); await sleep(120);
      t('ticking the box saves the launch-email choice on their vote', store()['toolVotes/uFresh_t2'].notify === true && /email you once when Beta Map launches/.test(txt('notice')), txt('notice'));

      btn(card('t1'), 'Vote for this').click(); await until(() => !!store()['toolVotes/uFresh_t1']);
      btn(card('t4'), 'Vote for this').click(); await until(() => !!store()['toolVotes/uFresh_t4']); await sleep(80);
      t('a third vote uses them all up', txt('votesLeft') === 'All 3 votes used', txt('votesLeft'));
      t('the other open tool now says why they cannot vote, with no button', /used all 3 votes/.test(textOf(card('t3'))) && !btn(card('t3'), 'Vote for this'));
      t('one vote per tool: a voted tool offers no second vote button', !btn(card('t2'), 'Vote for this'));
      t('the order follows the new totals (Beta 10, Alpha 6, Delta 3)', order() === 't2,t1,t4,t3,t5', order());

      btn(card('t4'), '✓ Voted').click(); await until(() => !store()['toolVotes/uFresh_t4']); await sleep(80);
      t('withdrawing deletes the vote and takes one off the count', !store()['toolVotes/uFresh_t4'] && store()['tools/t4'].voteCount === 2 && count('t4') === 2);
      t('which frees a vote for another tool', txt('votesLeft') === '1 vote left' && !!btn(card('t3'), 'Vote for this'), txt('votesLeft'));

      window.__failCommit = 'permission-denied';
      btn(card('t3'), 'Vote for this').click(); await sleep(200);
      t('if the vote is refused, they are told plainly and nothing changes', /didn't go through/.test(txt('errorLine')) && !store()['toolVotes/uFresh_t3'] && store()['tools/t3'].voteCount === 0 && count('t3') === 0, txt('errorLine'));
      t('and the vote button works again afterwards', !!btn(card('t3'), 'Vote for this') && !btn(card('t3'), 'Vote for this').disabled);
      window.__failCommit = null;

      /* suggesting a tool */
      $('suggestBtn').click(); await sleep(40);
      t('an empty suggestion is refused with a hint', /at least a few words/.test(txt('suggestError')), txt('suggestError'));
      setVal('suggestText', 'A pricing and packaging worksheet');
      $('suggestBtn').click(); await sleep(150);
      const s = store()['toolSuggestions/uFresh'];
      t('a suggestion is saved privately under their own id, waiting for review', !!s && s.uid === 'uFresh' && s.email === 'ufresh@example.com' && s.text === 'A pricing and packaging worksheet' && s.status === 'pending', JSON.stringify(s));
      t('and they are told it is waiting for review', /waiting for review/.test(txt('suggestStatus')) && $('suggestText').value === '', txt('suggestStatus'));
      t('it does not appear on the public list', !/pricing and packaging/.test($('toolList').textContent));

      $('signOutBtn').click(); await sleep(200);
      t('signing out brings back the sign-in card, hides their votes and goes back to voting blind', vis('authCard') && !vis('statusBar') && !card('t2').classList.contains('voted') && !document.querySelector('#toolList .count') && !$('blindNote').hidden);
    }

    if (scn === 'unverified'){
      t('a person whose email is not verified sees the banner with their address', vis('verifyBanner') && /unver@Example\.com/i.test(txt('verifyEmail')));
      t('the request box is shown, but sending waits until they verify', vis('suggestCard') && $('suggestBtn').disabled && $('suggestBtn').textContent === 'Verify your email to send');
      t('no tool offers a vote button; each says to verify', ['t1', 't2', 't3', 't4'].every(id => !btn(card(id), 'Vote for this') && /Verify your email to vote/.test(textOf(card(id)))));
      $('verifiedBtn').click(); await sleep(150);
      t('pressing "I\'ve verified" before they have is explained', /can't see the verification yet/.test(txt('verifyMsg')) && vis('verifyBanner'), txt('verifyMsg'));
      window.__fakeUser.__willVerify = true;
      $('verifiedBtn').click(); await sleep(250);
      t('once verified the banner goes and voting opens', !vis('verifyBanner') && ['t1', 't2', 't3', 't4'].every(id => !!btn(card(id), 'Vote for this')) && vis('suggestCard') && !$('suggestBtn').disabled && $('suggestBtn').textContent === 'Send request');
      t('they were asked for a fresh sign-in token so the vote rules see the verified flag', /Email verified/.test(txt('notice')), txt('notice'));
      $('verifiedBtn');
    }

    if (scn === 'voter'){
      t('a returning voter sees their three votes', txt('votesLeft') === 'All 3 votes used' && ['t1', 't2', 't4'].every(id => card(id).classList.contains('voted')));
      t('their launch-email choice is remembered', card('t2').querySelector('input[type="checkbox"]').checked === true && card('t1').querySelector('input[type="checkbox"]').checked === false);
      t('they cannot vote for a fourth tool', !btn(card('t3'), 'Vote for this') && /used all 3 votes/.test(textOf(card('t3'))));
      t('having taken the assessment, they are sent to their dashboard instead', vis('nextCard') && /Keep learning/.test(txt('nextTitle')) && $('nextLink').getAttribute('href') === '/lms-dashboard', txt('nextTitle'));
      btn(card('t1'), '✓ Voted').click(); await sleep(250);
      t('removing one vote lets them vote for another', !!btn(card('t3'), 'Vote for this') && txt('votesLeft') === '1 vote left');
    }

    if (scn === 'suggested' || scn === 'approved'){
      t('a returning suggester sees where their last idea stands', scn === 'suggested' ? /A pricing worksheet.*waiting for review/.test(txt('suggestStatus')) : /added to the roadmap/.test(txt('suggestStatus')), txt('suggestStatus'));
    }

    if (scn === 'deeplink'){
      t('a link with ?tool= highlights that tool (from "Vote for this" on www.productadvisory.co)', !!card('t4') && card('t4').classList.contains('requested'));
      t('and only that one', cards().filter(c => c.classList.contains('requested')).length === 1);
    }

    if (scn === 'empty'){
      t('with no tools yet, a friendly message is shown', /first tools are being added/.test(txt('toolList')), txt('toolList'));
    }

    if (scn === 'loaderror'){
      t('if the list cannot be loaded, the page says so plainly', /couldn't load the roadmap/.test(txt('toolList')), txt('toolList'));
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  done();
})();
