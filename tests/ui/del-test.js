const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
// The profile photo: choose an image, size it, save; it shows on the page and the Profile button, survives saving
// the form, and can be removed. The image is drawn in the page, so the test needs no file.
async function photoTests(store){
  const c = document.createElement('canvas'); c.width = 600; c.height = 400;
  const g = c.getContext('2d'); g.fillStyle = '#1a4584'; g.fillRect(0, 0, 600, 400); g.fillStyle = '#35c2e8'; g.beginPath(); g.arc(300, 200, 90, 0, 7); g.fill();
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const pick = (file) => { const dt = new DataTransfer(); dt.items.add(file); $('photoFile').files = dt.files; $('photoFile').dispatchEvent(new Event('change')); };
  t('with no photo the circle shows their initial and there is an "Upload photo" button', $('avatarCircle').textContent === 'D' && $('photoUploadBtn').textContent === 'Upload photo' && $('photoRemoveBtn').hidden);
  pick(new File(['not an image'], 'notes.txt', { type: 'text/plain' })); await sleep(50);
  t('a file that is not an image is refused, with a reason', /not an image/.test($('photoMsg').textContent) && $('cropBack').hidden);
  pick(new File([blob], 'me.png', { type: 'image/png' })); await sleep(300);
  t('an image opens the sizing window, ready to drag', !$('cropBack').hidden && document.activeElement === $('cropStage'));
  $('cropZoom').value = '2'; $('cropZoom').dispatchEvent(new Event('input'));
  $('cropStage').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  $('cropStage').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(30);
  t('Escape closes it without saving', $('cropBack').hidden && !((store['progress/uDel'].profile || {}).photo));
  pick(new File([blob], 'me.png', { type: 'image/png' })); await sleep(300);
  let heard = '';
  window.addEventListener('pa-avatar', (e) => { heard = e.detail; }, { once: true });
  $('cropSave').click(); await sleep(400);
  const photo = (store['progress/uDel'].profile || {}).photo || '';
  t('saving keeps a small JPEG on their own record, next to their other details', /^data:image\/jpeg;base64,/.test(photo) && photo.length < 60000 && store['progress/uDel'].profile.phone === '555', photo.length);
  t('the circle shows the photo, and the Profile button is told about it', !!$('avatarCircle').querySelector('img') && heard === photo && !$('photoRemoveBtn').hidden && $('photoUploadBtn').textContent === 'Change photo');
  t('the Profile button shows it too', !!document.querySelector('.pa-acct-btn img.pa-avatar'));
  await window.handleSaveProfile(); await sleep(200);
  t('saving the profile form keeps the photo', store['progress/uDel'].profile.photo === photo);
  $('photoRemoveBtn').click(); await sleep(300);
  t('"Remove photo" clears it and brings back the initial, here and on the button', store['progress/uDel'].profile.photo === '' && $('avatarCircle').textContent === 'D' && !document.querySelector('.pa-acct-btn img.pa-avatar'));
}

// Goals and check-in emails: the saved choices show, the controls keep to their limits, and saving writes
// only the goals and email settings, next to everything else on the person's record.
async function goalsTests(store){
  const pressed = () => Array.from($('focusChips').querySelectorAll('button[aria-pressed="true"]')).map(b => b.dataset.k).join();
  const checked = (kind) => (document.querySelector('.seg[data-kind="' + kind + '"] [aria-checked="true"]') || {}).dataset;
  if (window.__scn === 'goalsadmin'){
    t('with nothing saved: a 2-lesson goal, no focus areas, weekly emails', $('goalValue').textContent === '2' && pressed() === '' && checked('checkin').v === 'weekly' && /Every Monday morning/.test($('checkinHint').textContent));
    t('a company admin also chooses how often the company report comes (weekly by default)', !$('orgReportSetting').hidden && checked('orgReport').v === 'weekly');
    document.querySelector('.seg[data-kind="orgReport"] [data-v="daily"]').click();
    $('goalsSaveBtn').click(); await sleep(300);
    t('the report choice is saved', store['progress/uDel'].notify.orgReport === 'daily' && store['progress/uDel'].notify.checkin === 'weekly');
    return;
  }
  t('the saved goal, focus area and frequency show', $('goalValue').textContent === '3' && pressed() === 'aiOrg' && checked('checkin').v === 'monthly' && /On the 1st/.test($('checkinHint').textContent));
  t('a member who is not an admin sees no company report setting', $('orgReportSetting').hidden);
  t('the weekly default is labelled', /Weekly \(default\)/.test(document.querySelector('.seg[data-kind="checkin"] [data-v="weekly"]').textContent));
  for (let i = 0; i < 12; i++) $('goalPlus').click();
  t('the goal stops at 10 lessons a week', $('goalValue').textContent === '10' && $('goalPlus').disabled && /about 100 minutes/.test($('goalUnit').textContent));
  for (let i = 0; i < 12; i++) $('goalMinus').click();
  t('and at 1', $('goalValue').textContent === '1' && $('goalMinus').disabled && /^lesson a week/.test($('goalUnit').textContent));
  $('goalPlus').click();
  const chip = (k) => $('focusChips').querySelector('[data-k="' + k + '"]');
  chip('discovery').click(); chip('strategy').click();
  t('three focus areas can be chosen, then the rest are unavailable', pressed() === 'discovery,strategy,aiOrg' && chip('execution').disabled && /3 of 3 chosen/.test($('focusCount').textContent));
  chip('aiOrg').click();
  t('choosing one again takes it off', pressed() === 'discovery,strategy' && !chip('execution').disabled);
  const seg = document.querySelector('.seg[data-kind="checkin"]');
  seg.querySelector('[aria-checked="true"]').focus();
  seg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  t('arrow keys move along the email choices', checked('checkin').v === 'off' && document.activeElement === seg.querySelector('[data-v="off"]') && /No check-in emails/.test($('checkinHint').textContent));
  seg.querySelector('[data-v="daily"]').click();
  $('goalsSaveBtn').click(); await sleep(300);
  const d = store['progress/uDel'];
  t('saving writes the goal, the focus areas and the choice', d.goals.weeklyLessons === 2 && d.goals.focus.join() === 'discovery,strategy' && d.notify.checkin === 'daily' && d.notify.orgReport === 'weekly' && /^Saved/.test($('goalsSuccess').textContent), JSON.stringify(d.goals) + JSON.stringify(d.notify));
  t('and keeps everything else on the record', d.profile.phone === '555' && d.lessonLog['2026-10-01'] === 2 && Array.isArray(d.orgIds));
  await window.handleSaveProfile(); await sleep(200);
  t('saving the profile form afterwards keeps the goals', store['progress/uDel'].goals.weeklyLessons === 2 && store['progress/uDel'].notify.checkin === 'daily');
}

// My badges: what they have, how many are left, what is next, and the dates kept on their record.
async function badgesTests(store){
  const card = $('badges'), items = card.querySelectorAll('.bd-item');
  const on = Array.prototype.filter.call(items, li => li.classList.contains('is-on')).map(li => li.querySelector('.bd-title').textContent);
  const total = window.BadgesCore.BADGES.length;
  t('every badge is listed, in its group', items.length === total && card.querySelectorAll('.bd-group').length === window.BadgesCore.GROUPS.length);
  t('the earned ones are marked, the others are not', on.indexOf('Welcome aboard') > -1 && on.indexOf('Graduated to Advanced') > -1 && on.indexOf('First course') > -1 && on.indexOf('5 courses') === -1, on.join(' | '));
  t('a badge kept on their record stays earned', on.indexOf('7 days') > -1);
  t('the count says how many are earned and how many more to go', new RegExp('^' + on.length + ' of ' + total + ' earned').test(card.querySelector('.bd-count').textContent) && card.textContent.indexOf((total - on.length) + ' more to earn') > -1, card.querySelector('.bd-hero').textContent);
  t('a stored badge shows the date it was earned', /Earned 5 Jan 2026|Earned Jan 5, 2026/.test(Array.prototype.filter.call(items, li => /Welcome aboard/.test(li.textContent))[0].textContent));
  t('a locked badge shows how far along they are', /1 of 5/.test(Array.prototype.filter.call(items, li => /^5 courses/.test(li.querySelector('.bd-title').textContent))[0].textContent));
  t('"Up next" lists three badges still to earn, with how many to go', card.querySelectorAll('.bd-next li').length === 3 && / to go$/.test(card.querySelector('.bd-togo').textContent));
  t('the latest badge is shown in the summary', !!card.querySelector('.bd-showcase .bd-medal.is-on'));
  const b = store['progress/uDel'].badges;
  t('newly earned badges are saved with a date, and the stored dates are left alone', b.account === '2026-01-05T12:00:00.000Z' && /^\d{4}-\d\d-\d\dT/.test(b.graduate || '') && /^\d{4}-\d\d-\d\dT/.test(b.course1 || '') && !b.course5, JSON.stringify(b));
  t('the profile details are left alone', store['progress/uDel'].profile.jobTitle === 'PM');
  card.querySelector('[data-f="todo"]').click();
  const shown = Array.prototype.filter.call(items, li => !li.hidden);
  t('"Still to earn" hides the earned ones', shown.length === total - on.length && shown.every(li => !li.classList.contains('is-on')));
  card.querySelector('[data-f="have"]').click();
  t('"Earned" shows only those, and drops empty groups', Array.prototype.filter.call(items, li => !li.hidden).length === on.length && Array.prototype.some.call(card.querySelectorAll('.bd-group'), g => g.hidden));
  const grad = card.querySelector('.bd-item[data-id="graduate"]');
  grad.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await sleep(50);
  const dlg = $('badgeDetail');
  t('Enter on a badge opens it up close, with its date, and focus on Close', dlg && !dlg.hidden && /Graduated to Advanced/.test(dlg.textContent) && /Earned/.test(dlg.textContent) && document.activeElement === dlg.querySelector('.bd-x'));
  dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(30);
  t('Escape closes it and returns to the badge', dlg.hidden && document.activeElement === grad);
  card.querySelector('[data-f="all"]').click();
  card.querySelector('.bd-item[data-id="lessons50"]').click(); await sleep(50);
  t('a badge not yet earned shows how far along, in its own shape and number', !dlg.hidden && /5 of 50 · 45 to go/.test(dlg.textContent) && !!dlg.querySelector('.bd-shape-square'));
  dlg.click(); await sleep(30);
  t('clicking outside closes it', dlg.hidden);
  t('the back link and the card use the same names as the menu', /Back to My Learning/.test(document.querySelector('.back-link').textContent) && /My Badges/.test(card.querySelector('h2').textContent));
  $('editCompany').value = 'Acme Hlth'; window.handleCompanyInput(); await sleep(900);
  const chip = $('companySuggest');
  t('a company suggestion is shown as plain text, so a booby-trapped name cannot run', chip.style.display !== 'none' && /Did you mean <img/.test(chip.textContent) && !chip.querySelector('img') && !window.__pwned, chip.innerHTML);
  t('the suggestion asks the backend with the sign-in, never for the whole list', window.__calls.some(c => /^companyMatch@/.test(c)) && !window.__calls.some(c => /^companies@/.test(c)), window.__calls.join());
  t('the Profile menu has a My Badges link', !!document.querySelector('.pa-acct-menu a[href="/profile#badges"]'));
}

// Ways to sign in: add a Google account or another email to the same account, and remove one.
async function signinTests(store){
  const list = () => Array.prototype.map.call($('signinList').querySelectorAll('li'), li => li.querySelector('.si-main').textContent + (li.querySelector('.si-tag') ? '|main' : '') + (li.querySelector('.linkbtn') ? '|remove' : ''));
  if (window.__scn === 'signin'){
    t('an email-and-password account lists its sign-in, marked as the main email, with no Remove', list().join() === 'Email and passworddel@acme.com|main', list().join());
    window.__linkError = 'auth/credential-already-in-use';
    $('linkGoogleBtn').click(); await sleep(60);
    t('a Google account that already has its own learning account is explained, not added', /already has its own learning account/.test($('signinError').textContent) && window.__fakeUser.providerData.length === 1);
    $('linkGoogleBtn').click(); await sleep(60);
    t('adding Google sign-in lists it, with Remove on both', /Google sign-in added/.test($('signinSuccess').textContent) && list().join() === 'Email and passworddel@acme.com|main|remove,Googleme.personal@gmail.com|remove' && $('linkGoogleBtn').hidden, list().join());
    $('linkEmailBtn').click(); await sleep(30);
    t('another email cannot be added to an account that already has an email and password, and it says why', $('linkEmailForm').hidden && !$('linkEmailNote').hidden);
    window.confirm = () => true;
    $('signinList').querySelectorAll('.linkbtn')[1].click(); await sleep(60);
    t('a sign-in can be removed, and the last one cannot', list().join() === 'Email and passworddel@acme.com|main' && /Removed Google sign-in/.test($('signinSuccess').textContent));
  }
  if (window.__scn === 'signingoogle'){
    $('linkEmailBtn').click(); await sleep(30);
    t('a Google account can add another email', !$('linkEmailForm').hidden && $('linkEmailNote').hidden);
    $('linkEmailInput').value = 'not an email'; $('linkEmailSend').click(); await sleep(30);
    t('a bad address is caught', /full email address/.test($('signinError').textContent) && !window.__linkSent);
    $('linkEmailInput').value = 'Me@Home.net'; $('linkEmailSend').click(); await sleep(60);
    t('a link is sent to the other address, to come back to this page', window.__linkSent && window.__linkSent.email === 'me@home.net' && /\/profile\?linkEmail=1#signin$/.test(window.__linkSent.settings.url) && window.__linkSent.settings.handleCodeInApp === true && /Check me@home\.net/.test($('signinSuccess').textContent));
  }
  if (window.__scn === 'signinlink'){
    t('back from the link, the address is added to this account', window.__linked && window.__linked.email === 'me@home.net' && /oobCode=abc/.test(window.__linked.link) && list().join() === 'Googledel@acme.com|main|remove,Email and passwordme@home.net|remove', list().join());
    t('the link is cleared from the address bar', !/oobCode/.test(location.href));
    t('it asks for a password for the new address', !$('linkPwForm').hidden && $('linkPwEmail').textContent === 'me@home.net');
    $('linkPwInput').value = 'short'; $('linkPwSave').click(); await sleep(30);
    t('a short password is refused', /at least 8/.test($('signinError').textContent));
    $('linkPwInput').value = 'a-long-password'; $('linkPwSave').click(); await sleep(60);
    t('the password is saved', $('linkPwForm').hidden && /Password saved/.test($('signinSuccess').textContent));
  }
}

(async function(){
  try {
    await sleep(1500);
    const store = window.__store;
    if (window.__scn === 'photo') await photoTests(store);
    else if (/^goals/.test(window.__scn)) await goalsTests(store);
    else if (window.__scn === 'badges') await badgesTests(store);
    else if (/^signin/.test(window.__scn)) await signinTests(store);
    else {
      $('deleteConfirmText').value = 'DELETE';
      $('deletePassword').value = 'secret';
      $('deleteBtn').click();
      await sleep(1500);
      const log = window.__writeLog.map(w => w.op + ':' + w.path);
      const scn = window.__scn;
      if (scn === 'member'){
        t('the account is deleted and the confirmation is shown', window.__deleted === true && $('deletedNotice').style.display === 'block');
        t('the name and email are blanked on the CURRENT company\'s copy', store['orgs/orgA/members/uDel'].identity === null);
        t('and on the FORMER company\'s copy', store['orgs/orgOld/members/uDel'].identity === null);
        t('their results stay with each company', store['orgs/orgA/members/uDel'].assessment.tier === 'Lots of Experience' && store['orgs/orgOld/members/uDel'].assessment.overallPct === 80);
        t('the membership record loses name, email and phone but keeps the company, role and status',
          store['memberships/uDel'].email === '' && store['memberships/uDel'].displayName === '' && store['memberships/uDel'].phone === '' && store['memberships/uDel'].orgId === 'orgA' && store['memberships/uDel'].status === 'active');
        t('their own progress record is deleted', store['progress/uDel'] === undefined);
        const firstBlank = log.findIndex(x => /update:orgs\/orgA\/members\/uDel/.test(x));
        const delProgress = log.findIndex(x => x === 'delete:progress/uDel');
        const delUser = log.findIndex(x => x === 'deleteUser:uDel');
        const sheetAt = window.__calls.find(c => /^deleteAccount@/.test(c));
        t('order: blank the company copies first, then the spreadsheet, then the progress record, then the sign-in',
          firstBlank > -1 && firstBlank < delProgress && delProgress < delUser && !!sheetAt && Number(sheetAt.split('@')[1]) >= 3, log.join(' | ') + ' / ' + window.__calls.join(','));
      }
      if (scn === 'member' || scn === 'nonmember'){
        t('their Tool Roadmap votes are deleted', !store['toolVotes/uDel_t1'] && !store['toolVotes/uDel_t2'] && !store['toolVotes/uDel_tGone']);
        t('each vote is taken off its tool\'s public total (4 becomes 3)', store['tools/t1'].voteCount === 3, String(store['tools/t1'].voteCount));
        t('a total that was already 0 is left at 0, never negative', store['tools/t2'].voteCount === 0);
        t('somebody else\'s vote is untouched', !!store['toolVotes/uOther_t1']);
        t('their tool suggestion is deleted', !store['toolSuggestions/uDel']);
        const firstVoteDelete = log.findIndex(x => /delete:toolVotes\//.test(x));
        const delProg = log.findIndex(x => x === 'delete:progress/uDel');
        t('the votes go before the progress record and the sign-in', firstVoteDelete > -1 && firstVoteDelete < delProg, log.join(' | '));
      }
      if (scn === 'votefail'){
        t('if the votes cannot be removed, NOTHING is deleted', store['progress/uDel'] !== undefined && window.__deleted !== true && $('deletedNotice').style.display !== 'block');
        t('the person is told what happened and can try again', /couldn't remove your Tool Roadmap votes/.test($('deleteError').textContent) && $('deleteBtn').disabled === false, $('deleteError').textContent);
        t('the spreadsheet clean-up was not attempted', !window.__calls.some(c => /^deleteAccount@/.test(c)));
      }
      if (scn === 'blocked'){
        t('the votes are untouched when an earlier step fails', !!store['toolVotes/uDel_t1'] && store['tools/t1'].voteCount === 4 && !!store['toolSuggestions/uDel']);
      }
      if (scn === 'nonmember'){
        t('a person who was never in a company deletes normally', window.__deleted === true && $('deletedNotice').style.display === 'block');
        t('and nothing is written for any company', log.filter(x => /orgs\//.test(x) || /memberships\//.test(x)).length === 0, log.join(' | '));
      }
      if (scn === 'blocked'){
        t('if blanking the company copy fails, NOTHING is deleted', store['progress/uDel'] !== undefined && window.__deleted !== true && $('deletedNotice').style.display !== 'block');
        t('the person is told what happened and can try again', /couldn't remove your name from the copy your company holds/.test($('deleteError').textContent) && $('deleteBtn').disabled === false, $('deleteError').textContent);
        t('the spreadsheet clean-up was not even attempted', !window.__calls.some(c => /^deleteAccount@/.test(c)));
        t('their membership and company copies are left as they were', store['memberships/uDel'].email === 'del@acme.com' && store['orgs/orgA/members/uDel'].identity !== null);
      }
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.title = out.join(' || ');
})();
