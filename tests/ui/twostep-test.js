const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const dlg = () => document.querySelector('.pa-2s');
async function dlgSubmit(value){ dlg().querySelector('input').value = value; dlg().querySelector('.go').click(); await sleep(80); }
const nudge = () => document.getElementById('pa-2s-nudge');
(async function(){
  try {
    await sleep(2000);
    const scn = window.__scn;
    if (scn === 'signin'){
      $('authEmail').value = 'mfa@x.com'; $('authPassword').value = 'pw-123456';
      window.handleAuthSubmit(); await sleep(150);
      t('an account with two-step verification asks for the 6-digit code after the password', !!dlg() && /Enter your 6-digit code/.test(dlg().textContent) && !window.__fakeUser && window.__mfaAsked === 1);
      await dlgSubmit('111111');
      t('a wrong code is refused, and it can be tried again', !!dlg() && /didn't match/.test(dlg().querySelector('.pa-2s-err').textContent) && !window.__fakeUser);
      await dlgSubmit('123456'); await sleep(200);
      t('the right code signs them in', !dlg() && window.__fakeUser && window.__fakeUser.uid === 'uMfa' && $('authError').textContent === '');
      await window.handleSignOut(); await sleep(150);
      window.handleAuthSubmit(); await sleep(150);
      dlg().querySelector('.no').click(); await sleep(100);
      t('Cancel stops the sign-in and says so', !dlg() && !window.__fakeUser && /Sign-in cancelled/.test($('authError').textContent), $('authError').textContent);
      window.handleGoogleSignIn(); await sleep(150);
      t('Google sign-in asks for the code too', !!dlg() && /6-digit code/.test(dlg().textContent));
      await dlgSubmit('123456'); await sleep(200);
      t('and signs in with it', !dlg() && window.__fakeUser && window.__fakeUser.uid === 'uMfa');
    }
    if (scn === 'nudge'){
      t('a learner without two-step sees a card inviting them to protect their account', !!nudge() && /Protect your account/.test(nudge().textContent));
      t('it links to My Profile, which opens the set-up', nudge().querySelector('a').getAttribute('href') === '/profile?twostep=setup');
      const later = nudge().querySelector('button');
      t('it can be put off with "Not now"', later.textContent === 'Not now');
      later.click(); await sleep(30);
      const snoozed = Number(localStorage.getItem('pa_2step_snooze_uTwo'));
      t('"Not now" hides it and remembers that for 30 days on this device', !nudge() && snoozed > Date.now() - 60000);
    }
    if (scn === 'owner'){
      t('for the platform owner it says it is required, and why', !!nudge() && /Turn on two-step verification/.test(nudge().textContent) && /platform owner need two-step/.test(nudge().textContent), nudge() && nudge().textContent);
      const later = nudge().querySelector('button');
      t('it can only be put off for now ("Later"), not for 30 days', later.textContent === 'Later');
      later.click(); await sleep(30);
      t('"Later" hides it without remembering it', !nudge() && !localStorage.getItem('pa_2step_snooze_uTwo'));
    }
    if (scn === 'ownernever'){
      const never = nudge() && nudge().querySelector('button.never');
      t('the card offers "Don\'t remind me again"', !!never && /Don't remind me again/.test(never.textContent));
      never.click(); await sleep(80);
      t('it hides the card and remembers it on the account, for every device, and on this one', !nudge() && window.__store['progress/uTwo'].twoStepNudgeOff === true && localStorage.getItem('pa_2step_off_uTwo') === '1');
    }
    if (scn === 'turnedoff') t('turned off on another device: no card here either', !nudge());
    if (scn === 'on') t('with two-step already on, there is no card', !nudge());
    if (scn === 'google') t('a learner who signs in only with Google gets no card (Google already guards the sign-in)', !nudge());
    if (scn === 'googleowner') t('the owner signing in only with Google gets no card either (no double check)', !nudge());
    if (scn === 'firstlogin') t('on the first sign-in of a new account there is no card yet', !nudge());
    if (scn === 'profilefirst') t('signed in again, but the "tell us about your team" card comes first', !nudge());
    if (scn === 'secondlogin') t('signed in again with their details given, the card appears', !!nudge() && /Protect your account/.test(nudge().textContent));
    if (scn === 'unverified') t('before the email is confirmed there is no card yet (Firebase needs a verified email)', !nudge());
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.title = out.join(' || ');
})();
