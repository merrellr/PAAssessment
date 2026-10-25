const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const shown = () => ['stateLoading', 'stateAuth', 'stateProblem', 'stateConsent', 'stateDone'].filter(s => $(s).style.display !== 'none').join(',');
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
const scn = window.__scn;
const TOKEN = window.__TOKEN;
async function settle(){ for (let i = 0; i < 80 && $('stateLoading').style.display !== 'none'; i++) await sleep(30); await sleep(60); }

(async function(){
  try {
    await settle();
    if (['ready', 'admin', 'nophone', 'rejoin', 'denied', 'flaky', 'sharefail'].indexOf(scn) > -1){
      t('shows only the consent screen', shown() === 'stateConsent', shown());
      t('title names the company and the role', new RegExp('Join Acme Health as ' + (scn === 'admin' ? 'an admin' : 'a member')).test(txt('consentTitle')), txt('consentTitle'));
      const consent = $('stateConsent').textContent;
      t('states what the company can see, including individual answers', /individual answers/.test(consent) && /course progress/.test(consent));
      t('states what they cannot see', /reflections/.test(consent) && /phone number/.test(consent));
      t('says the platform operator can also see it', /Product Advisory, which runs this platform/.test(consent));
      t('explains the account stays theirs and what happens on leaving', /account stays yours/.test(consent) && /keep the information/.test(consent));
      t('says plainly that only the company can end the membership, and what the person keeps', /Only Acme Health's admins can end your membership/.test(consent.replace(/\s+/g, ' ')) && /can't leave it on your own/.test(consent) && /You keep your account, your results and your course access/.test(consent), consent.replace(/\s+/g, ' ').slice(0, 400));
      t('says what happens to their name if they delete their account', /Your name and email are then removed from their copy/.test(consent.replace(/\s+/g, ' ')) && /without your name/.test(consent));
      t('company name appears in the consent checkbox', /Acme Health/.test($('stateConsent').querySelector('.check-row').textContent));
      t('shows which account they are signed in as', /New@A\.com/.test(txt('consentEmail')));
      t('accept button is disabled until they agree', $('acceptBtn').disabled === true);
      $('agreeShare').checked = true; $('agreeShare').dispatchEvent(new Event('change'));
      t('ticking the box enables it', $('acceptBtn').disabled === false);
      $('acceptBtn').click(); await sleep(250);
      const m = window.__store['memberships/uNew'];
      const inv = window.__store['invites/' + TOKEN];
      if (scn === 'denied'){
        t('a refusal by the security rules shows a friendly "can\'t be accepted" message', shown() === 'stateProblem' && /can't be accepted right now/.test(txt('problemTitle')), shown() + ' ' + txt('problemTitle'));
        t('nothing was saved', inv.status !== 'used' && !m);
      } else if (scn === 'flaky'){
        t('a temporary failure keeps them on the page with an error and a working button', shown() === 'stateConsent' && /try again/i.test(txt('consentError')) && $('acceptBtn').disabled === false && $('acceptBtn').textContent === 'Accept and join', shown() + ' ' + txt('consentError'));
      } else {
        t('joining moves to the welcome screen', shown() === 'stateDone' && /Welcome to Acme Health/.test(txt('doneTitle')), shown() + ' ' + txt('doneTitle'));
        t('only a new admin is offered a link to the company dashboard', ($('doneAdminLink').style.display !== 'none') === (scn === 'admin'), $('doneAdminLink').style.display);
        t('membership saved: company, role, active, no end date, link back to the invite',
          m && m.orgId === 'orgA' && m.orgName === 'Acme Health' && m.role === (scn === 'admin' ? 'admin' : 'member') && m.status === 'active' && m.endedAt === null && m.inviteToken === TOKEN, JSON.stringify(m));
        t('email stored lower-case from the signed-in account, name from their account', m && m.email === 'new@a.com' && m.displayName === 'New Person');
        t('join time was set by the server', m && m.joinedAt && typeof m.joinedAt.toMillis === 'function');
        t('the invite was marked used by this person', inv.status === 'used' && inv.usedBy === 'uNew' && inv.usedAt && typeof inv.usedAt.toMillis === 'function');
        if (scn === 'nophone') t('no phone is stored when the invite had none', !('phone' in m));
        else t('the phone from the invite was copied onto the membership', m.phone === '555-0100');
        if (scn === 'rejoin') t('rejoining replaces the old membership completely (old company and old phone gone)', m.orgName === 'Acme Health' && m.endedAt === null && m.phone === '555-0100');
        const prog = window.__store['progress/uNew'];
        t('their own progress record keeps everything it had, and only gains a list of companies they have joined',
          JSON.stringify(prog.courses) === '{}' && prog.profile.phone === '555' && JSON.stringify(prog.orgIds) === '["orgA"]', JSON.stringify(prog));
        const share = window.__store['orgs/orgA/members/uNew'];
        if (scn === 'sharefail') {
          t('if the shared record cannot be started, joining still succeeds (the dashboard retries on the next visit)', !share && shown() === 'stateDone');
        } else {
          t('joining starts the shared record straight away, under their own company', !!share && share.identity.email === 'new@a.com' && share.identity.name === 'New Person', JSON.stringify(share));
          t('it has no assessment or courses yet, because they have none', share.assessment === null && JSON.stringify(share.courses) === '{}' && share.lastActiveAt === null);
          // (the phone numbers are matched as text: a bare 555 can turn up inside a timestamp)
          t('and nothing private or contact-related is in it (no phone, no profile)', !/"555"|555-0100|profile|phone|reflection/.test(JSON.stringify(share)));
        }
      }
    } else if (scn === 'signedout'){
      t('signed-out visitor sees the sign-in card', shown() === 'stateAuth', shown());
      t('it starts on Log in', $('tabLogin').classList.contains('active') && $('authName').style.display === 'none' && $('termsRow').style.display === 'none');
      $('tabSignup').click();
      t('Create account reveals name, confirm password and the terms box', $('authName').style.display === 'block' && $('authPasswordConfirm').style.display === 'block' && $('termsRow').style.display === 'flex' && $('authSubmit').textContent === 'Create account');
      {
        const links = Array.prototype.map.call(document.querySelectorAll('#termsRow a'), a => a.textContent + '=' + a.getAttribute('href'));
        t('the sign-up notice says "By creating an account you agree to the Terms of Use and Privacy Policy", both linked', /By creating an account you agree to the Terms of Use and Privacy Policy/.test($('termsRow').textContent.replace(/\s+/g, ' ')) && links.join() === 'Terms of Use=https://www.productadvisory.co/terms-of-use,Privacy Policy=https://www.productadvisory.co/privacy-policy', links.join());
        const g = document.querySelector('#stateAuth .small'); t('the Google button has the same notice, both linked', !!g && /By continuing with Google, you agree to the Terms of Use and Privacy Policy/.test(g.textContent.replace(/\s+/g, ' ')) && g.querySelectorAll('a').length === 2);
      }
      $('authEmail').value = 'x@y.com'; $('authPassword').value = 'longenough1'; $('authSubmit').click(); await sleep(60);
      t('creating an account without a name is refused', /name/i.test(txt('authError')));
      $('authName').value = 'Pat'; $('authPasswordConfirm').value = 'different'; $('authSubmit').click(); await sleep(60);
      t('mismatched passwords are refused', /match/i.test(txt('authError')));
      $('authPasswordConfirm').value = 'longenough1'; $('authSubmit').click(); await sleep(60);
      t('accepting the terms is required', /Terms/.test(txt('authError')));
      $('agreeTerms').checked = true; $('authSubmit').click(); await settle();
      t('creating an account carries straight on to the invitation', shown() === 'stateProblem' || shown() === 'stateConsent', shown());
      t('a new account gets its own progress record with the terms date', window.__store['progress/uCreated'] && !!window.__store['progress/uCreated'].agreedToTermsAt);
      t('they are not joined until they accept', !window.__store['memberships/uCreated']);
    } else if (scn === 'badtoken'){
      t('a malformed link says the invite isn\'t valid', shown() === 'stateProblem' && /isn't valid/.test(txt('problemTitle')), shown() + ' ' + txt('problemTitle'));
    } else {
      const expect = { notfound: /isn't valid/, expired: /expired/, revoked: /withdrawn/, used: /already been used/, elsewhere: /already a member of Beta Corp/ };
      if (expect[scn]){
        t('shows the right message', shown() === 'stateProblem' && expect[scn].test(txt('problemTitle')), shown() + ' ' + txt('problemTitle'));
        t('does not offer to join', $('stateConsent').style.display === 'none');
        if (scn !== 'elsewhere') t('nothing was changed', !window.__store['memberships/uNew']);
        if (scn === 'elsewhere') t('explains how to move companies and names the current one', /Beta Corp/.test(txt('problemText')) && /end your membership/.test(txt('problemText')) && $('problemSwitch').style.display !== 'none');
        if (scn === 'elsewhere') t('their existing membership is untouched', window.__store['memberships/uNew'].orgName === 'Beta Corp');
      } else if (scn === 'herealready' || scn === 'joinedbefore'){
        t('says they are already part of the company', shown() === 'stateDone' && /already part of Acme Health/.test(txt('doneTitle')), shown() + ' ' + txt('doneTitle'));
      }
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e));
  }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  document.title = out.join(' || ');
})();
