// Drives the real request-info.html (the "Request more information" form) against the fake Firebase and a fake server.
import { Timestamp } from './fake-firebase.js';
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
async function until(cond, ms = 4000){ const s = Date.now(); while (Date.now() - s < ms){ if (cond()) return true; await sleep(30); } return false; }
const title = () => txt('stepTitle');
const opt = (code) => document.querySelector('.opt[data-code="' + code + '"]');
const pressed = (code) => opt(code) && opt(code).getAttribute('aria-pressed') === 'true';
async function pick(code){ opt(code).click(); await sleep(330); }       // single choices move on by themselves
function fill(id, v){ const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
const shown = () => ['formCard', 'sendingCard', 'doneCard', 'fallbackCard'].filter(id => !$(id).hidden).join(',');
const posted = () => window.__posts[window.__posts.length - 1];

function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
}

async function walkOrg(){
  t('it starts on the first question, with no Back button and no progress yet', /Who is this for/.test(title()) && $('backBtn').hidden && txt('stepCount') === 'Step 1' && $('progressFill').style.width === '0%', title() + ' ' + txt('stepCount'));
  t('the four kinds of visitor are offered', ['individual', 'leader', 'org', 'other'].every(c => !!opt(c)));
  await pick('org');
  t('one tap on an answer moves on (an organization sees 7 screens)', /What would you like help with/.test(title()) && /Step 2 of 7/.test(txt('stepCount')), title());
  t('Back is now available', !$('backBtn').hidden);

  $('continueBtn').click();
  t('continuing without choosing says what to do', /at least one/i.test(txt('stepError')), txt('stepError'));
  opt('aiOrg').click(); opt('team_assessment').click(); opt('toolkits').click(); opt('strategy').click(); await sleep(60);
  t('up to three interests can be chosen; a fourth is explained and not added', pressed('aiOrg') && pressed('team_assessment') && pressed('toolkits') && !pressed('strategy') && /up to 3/.test(txt('stepError')), txt('stepError'));
  opt('toolkits').click(); opt('strategy').click(); await sleep(40);
  t('tapping one removes it, which makes room for another', !pressed('toolkits') && pressed('strategy'));
  $('continueBtn').click(); await sleep(60);

  t('team size comes next (organizations are asked)', /How big is the team/.test(title()));
  await pick('s51_200');
  t('then timing', /When would you like to get started/.test(title()));
  await pick('this_month');
  t('then who decides (organizations are asked)', /Who decides/.test(title()));
  await pick('decide');
  t('then an optional message and how to reach them', /Anything else/.test(title()) && !!$('message') && !!opt('call') && pressed('email'));
  fill('message', 'We want to assess all 60 of our product managers before planning.');
  t('the message shows how much room is left', /65 \/ 400/.test(txt('messageCount')), txt('messageCount'));
  opt('call').click(); await sleep(40);
  t('"a short call is fine" can be chosen instead', pressed('call') && !pressed('email'));
  $('continueBtn').click(); await sleep(60);

  t('the last screen asks for contact details, with the progress nearly full', /Where should we send the answer/.test(title()) && /Step 7 of 7/.test(txt('stepCount')) && $('progressFill').style.width === '86%', $('progressFill').style.width);
  t('the trap field for robots is there but off-screen and not reachable by keyboard', !!$('f-website') && $('f-website').getAttribute('tabindex') === '-1' && $('f-website').closest('.trap').getAttribute('aria-hidden') === 'true');
  t('organizations are asked for a work email and must give a company', /Work email/.test($('stage').textContent) && /Company or organization(?! \(optional\))/.test($('stage').textContent));
  $('sendBtn').click(); await sleep(40);
  t('sending with nothing filled in is stopped, in plain words', /Enter your name/.test(txt('stepError')) && window.__posts.length === 0, txt('stepError'));
  fill('f-name', 'Jane Smith'); fill('f-email', 'jane@acme'); $('sendBtn').click(); await sleep(40);
  t('a half-finished email address is caught', /valid email/.test(txt('stepError')));
  fill('f-email', 'Jane@Acme-Health.com'); $('sendBtn').click(); await sleep(40);
  t('a company is required for an organization', /company or organization/i.test(txt('stepError')));
  fill('f-company', 'Acme Health'); fill('f-phone', '555-0100'); $('sendBtn').click(); await sleep(40);
  t('the consent box must be ticked, and nothing has been sent yet', /tick the box/.test(txt('stepError')) && window.__posts.length === 0, txt('stepError'));
  $('f-consent').checked = true; $('f-consent').dispatchEvent(new Event('change'));
  $('sendBtn').click();
  await sleep(100);
  t('while it sends, a "sending" screen replaces the form', shown() === 'sendingCard', shown());
}

(async function run(){
  try {
    await sleep(300);

    if (scn === 'org'){
      await walkOrg();
      await until(() => !$('doneCard').hidden, 12000);
      const p = posted();
      t('exactly one request was sent, as a plain POST to the Apps Script address', window.__posts.length === 1 && p.opts.method === 'POST' && /script\.google\.com/.test(p.url) && p.opts.mode === 'no-cors');
      const b = p.body;
      t('it carries the action, a 24-character id, and the answers', b.action === 'requestInfo' && /^[0-9a-f]{24}$/.test(b.id) && b.who === 'org' && b.size === 's51_200' && b.timeline === 'this_month' && b.role === 'decide' && b.contactPref === 'call' && b.interests.join() === 'aiOrg,team_assessment,strategy', JSON.stringify(b));
      t('and the contact details, tidied (email lower-cased) with consent true', b.name === 'Jane Smith' && b.email === 'jane@acme-health.com' && b.company === 'Acme Health' && b.phone === '555-0100' && b.consent === true && /assess all 60/.test(b.message));
      t('the robot trap is empty, and the time taken is a number', b.website === '' && typeof b.elapsedMs === 'number');
      t('no assessment is attached for someone who is not signed in', !('assessment' in b));
      t('the page asked the server to confirm it arrived, using the id (not the person\'s details)', window.__calls.filter(c => c === 'leadStatus').length >= 2 && !/jane/i.test(JSON.stringify(window.__calls)));
      t('it checked at the start that this version of the server is live', window.__calls[0] === 'leadsCheck' && $('backendNote').hidden);
      t('success replaces the form with a thank-you naming the person and the email', shown() === 'doneCard' && /Thanks, Jane/.test(txt('doneTitle')) && /Rob will reply to jane@acme-health\.com within two business days/.test(txt('doneText')), txt('doneText'));
      t('it points on to the free assessment and the Tool Roadmap', $('doneCta').getAttribute('href') === 'index.html' && $('doneSecond').getAttribute('href') === 'tool-requests.html');
      t('an organization is offered the booking page as well', !$('doneBook').hidden && $('doneBook').getAttribute('href') === 'https://calendly.com/productadvisory/30min');
      t('it shows a short reference', /^Reference: [0-9A-F]{8}$/.test(txt('doneRef')), txt('doneRef'));
      t('the saved draft is cleared once it has been sent', sessionStorage.getItem('pa_lead_form') === null);
    }

    if (scn === 'individual'){
      t('first screen', /Who is this for/.test(title()));
      await pick('individual');
      t('someone exploring for themselves sees a shorter form (5 screens)', /Step 2 of 5/.test(txt('stepCount')), txt('stepCount'));
      opt('notsure').click(); await sleep(40);
      t('"Not sure yet" can stand alone', pressed('notsure'));
      opt('discovery').click(); await sleep(40);
      t('choosing something specific replaces it', pressed('discovery') && !pressed('notsure'));
      $('continueBtn').click(); await sleep(60);
      t('team size is skipped; timing comes next', /When would you like to get started/.test(title()), title());
      await pick('exploring');
      t('who-decides is skipped; the message comes next', /Anything else/.test(title()), title());
      $('continueBtn').click(); await sleep(60);
      t('the company is optional for an individual', /Company or organization \(optional\)/.test($('stage').textContent) && /Step 5 of 5/.test(txt('stepCount')));
      fill('f-name', 'Pat Lee'); fill('f-email', 'pat@gmail.com');
      $('f-consent').checked = true; $('f-consent').dispatchEvent(new Event('change'));
      $('sendBtn').click();
      await until(() => !$('doneCard').hidden, 12000);
      const b = posted().body;
      t('no team size or decision role is sent for an individual', b.who === 'individual' && b.size === '' && b.role === '' && b.company === '');
      t('an individual who did not ask for a call is not shown the booking button', $('doneBook').hidden);
      t('an individual is thanked and pointed to the free assessment', /Thanks, Pat/.test(txt('doneTitle')) && /We will reply to pat@gmail\.com/.test(txt('doneText')) && $('doneCta').getAttribute('href') === 'index.html', txt('doneText'));
    }

    if (scn === 'back'){
      await pick('leader'); opt('execution').click(); $('continueBtn').click(); await sleep(60);
      await pick('s11_50');
      t('now on the timing screen', /When would you like to get started/.test(title()));
      $('backBtn').click(); await sleep(60);
      t('Back returns to the previous screen with the answer still chosen', /How big is the team/.test(title()) && pressed('s11_50'), title());
      $('backBtn').click(); await sleep(60);
      t('and again, keeping the interests', /What would you like help with/.test(title()) && pressed('execution'));
      $('backBtn').click(); await sleep(60);
      t('back to the very first question, which has no Back button', /Who is this for/.test(title()) && pressed('leader') && $('backBtn').hidden);
      await pick('individual');
      t('changing the answer changes the screens that follow (an individual skips size)', /Step 2 of 5/.test(txt('stepCount')));
      // a half-finished form survives a reload
      opt('toolkits').click(); await sleep(40);
      t('the draft is kept in this tab in case of an accidental reload, without consent', (() => { const s = JSON.parse(sessionStorage.getItem('pa_lead_form')); return s.state.who === 'individual' && s.state.interests.indexOf('toolkits') > -1 && s.state.consent === false; })());
    }

    if (scn === 'call'){
      await pick('org');
      opt('aiOrg').click(); $('continueBtn').click(); await sleep(60);
      await pick('s11_50'); await pick('this_quarter'); await pick('decide');
      t('a "Schedule a call" link starts the form with "a short call is fine" already chosen', pressed('call') && !pressed('email'));
      $('continueBtn').click(); await sleep(60);
      fill('f-name', 'Jane Smith'); fill('f-email', 'jane@acme.com'); fill('f-company', 'Acme');
      $('f-consent').checked = true; $('f-consent').dispatchEvent(new Event('change'));
      $('sendBtn').click();
      await until(() => !$('doneCard').hidden, 12000);
      t('and the request says so', posted().body.contactPref === 'call');
      t('the thank-you offers a button to pick a time on the booking page, opening in a new tab', !$('doneBook').hidden && $('doneBook').getAttribute('href') === 'https://calendly.com/productadvisory/30min' && $('doneBook').getAttribute('target') === '_blank' && /Pick a time/.test($('doneBook').textContent), $('doneBook').getAttribute('href'));
      t('the free-assessment button becomes the second choice', $('doneCta').className.indexOf('btn-ghost') > -1);
    }

    if (scn === 'preset'){
      t('a link with ?who=org starts at the second screen', /What would you like help with/.test(title()) && /Step 2 of 7/.test(txt('stepCount')), title());
      t('with Back available to change that answer', !$('backBtn').hidden);
      $('backBtn').click(); await sleep(60);
      t('Back shows the first question with that choice already made', /Who is this for/.test(title()) && pressed('org'));
      await pick('org');
      opt('aiOrg').click(); $('continueBtn').click(); await sleep(60);
      await pick('s11_50'); await pick('this_quarter'); await pick('influence');
      $('continueBtn').click(); await sleep(60);
      fill('f-name', 'Jane Smith'); fill('f-email', 'jane@acme-health.com'); fill('f-company', 'Acme');
      $('f-consent').checked = true; $('f-consent').dispatchEvent(new Event('change'));
      $('sendBtn').click();
      await until(() => !$('doneCard').hidden, 12000);
      t('the ?src= label from the link is sent along, so Rob knows where they came from', posted().body.source === 'toolkits', JSON.stringify(posted().body.source));
    }

    if (scn === 'signedin'){
      for (const c of ['leader']) await pick(c);
      opt('toolkits').click(); $('continueBtn').click(); await sleep(60);
      await pick('s2_10'); await pick('later'); await pick('unsure');
      $('continueBtn').click(); await sleep(60);
      await until(() => !!$('f-name') && $('f-name').value !== '', 2000);
      t('a signed-in person\'s name and email are filled in for them', $('f-name').value === 'Pat Lee' && $('f-email').value === 'Pat@Acme-Health.com', $('f-name').value + ' / ' + $('f-email').value);
      t('they are offered the choice to share their assessment, naming what would be shared', !!$('f-share') && /Moderate Experience, 41% overall/.test(txt('stage')), txt('stage').slice(0, 300));
      t('it is NOT ticked unless they choose', $('f-share').checked === false);
      fill('f-company', 'Acme Health');
      $('f-consent').checked = true; $('f-consent').dispatchEvent(new Event('change'));
      $('f-share').checked = true; $('f-share').dispatchEvent(new Event('change'));
      $('sendBtn').click();
      await until(() => !$('doneCard').hidden, 12000);
      const b = posted().body;
      t('when they agree, only the level, overall score and skill-area scores are sent', b.assessment && b.assessment.tier === 'Moderate Experience' && b.assessment.overallPct === 41.4 && JSON.stringify(b.assessment.categoryPct) === JSON.stringify({ discovery: 80, strategy: 20, aiOrg: 55 }), JSON.stringify(b.assessment));
      t('never their individual answers', JSON.stringify(b).indexOf('private answer') === -1 && !('answers' in (b.assessment || {})));
    }

    if (scn === 'nobackend'){
      t('if this version of the server is not live, a note at the top says what will happen', !$('backendNote').hidden && /rob@productadvisory\.co/.test(txt('backendNote')));
      await pick('individual'); opt('notsure').click(); $('continueBtn').click(); await sleep(60); await pick('exploring'); $('continueBtn').click(); await sleep(60);
      fill('f-name', 'Pat Lee'); fill('f-email', 'pat@x.com'); fill('f-company', 'Acme');
      $('f-consent').checked = true; $('f-consent').dispatchEvent(new Event('change'));
      $('sendBtn').click(); await sleep(150);
      t('nothing is sent to a server that cannot take it; they go straight to an email with their answers', window.__posts.length === 0 && shown() === 'fallbackCard' && /isn't switched on/.test(txt('fallbackText')), shown());
      const href = $('fallbackMail').getAttribute('href');
      t('the email is addressed to Rob and already filled in', /^mailto:rob@productadvisory\.co\?subject=/.test(href) && decodeURIComponent(href).indexOf('Pat Lee') > -1 && decodeURIComponent(href).indexOf('pat@x.com') > -1 && decodeURIComponent(href).indexOf('Acme') > -1, href.slice(0, 200));
    }

    if (scn === 'fail' || scn === 'unconfirmed' || scn === 'ratelimit' || scn === 'rejected'){
      await pick('org'); opt('aiOrg').click(); $('continueBtn').click(); await sleep(60);
      await pick('s11_50'); await pick('later'); await pick('approval'); $('continueBtn').click(); await sleep(60);
      fill('f-name', 'Jane Smith'); fill('f-email', 'jane@acme.com'); fill('f-company', 'Acme');
      $('f-consent').checked = true; $('f-consent').dispatchEvent(new Event('change'));
      $('sendBtn').click();
      await until(() => !$('fallbackCard').hidden, 25000);
      const want = { fail: /couldn't reach our server/, unconfirmed: /couldn't confirm/, ratelimit: /already sent a few requests/, rejected: /couldn't accept/ }[scn];
      t('the person is told plainly what happened', shown() === 'fallbackCard' && want.test(txt('fallbackText')), txt('fallbackText'));
      t('and offered an email to Rob with their answers filled in, so nothing is lost', /^mailto:rob@productadvisory\.co/.test($('fallbackMail').getAttribute('href')) && decodeURIComponent($('fallbackMail').getAttribute('href')).indexOf('Acme') > -1);
      $('fallbackRetry').click(); await sleep(60);
      t('"Try again" brings back the form with their answers intact', shown() === 'formCard' && $('f-name').value === 'Jane Smith' && $('f-company').value === 'Acme');
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  done();
})();
