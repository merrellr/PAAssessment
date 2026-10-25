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
  const ab = $('assessBody'), rows = ab.querySelectorAll('.as-list details');
  t('My assessments lists every assessment, newest first, with the newest open', rows.length === 2 && /Advanced Experience/.test(rows[0].querySelector('summary').textContent) && rows[0].open && !rows[1].open && /Latest/.test(rows[0].textContent), ab.textContent);
  t('it shows how much each one changed, overall and in each area', /\+22 points/.test(rows[0].querySelector('summary').textContent) && /Customer & Market Discovery90%\+20Product Strategy/.test(rows[0].querySelector('.as-areas').textContent) && /Since your first assessment \(.*\): \+22 points, from Moderate Experience to Advanced Experience/.test(ab.textContent), ab.textContent);
  t('and offers to take it again', !!ab.querySelector('a.btn[href="/"]'));
  t('the Profile menu has a My Badges link', !!document.querySelector('.pa-acct-menu a[href="/profile#badges"]'));
}

// Ways to sign in: add a Google account or another email to the same account, and remove one.
async function signinTests(store){
  const list = () => Array.prototype.map.call($('signinList').querySelectorAll('li'), li => li.querySelector('.si-main').textContent + (li.querySelector('.si-tag') ? '|main' : '') + (li.querySelector('.linkbtn') ? '|remove' : ''));
  if (window.__scn === 'signin'){
    t('an email-and-password account lists its sign-in, marked as the main email, with no Remove', list().join() === 'Email and passworddel@acme.com|main', list().join());
    window.__linkError = 'auth/credential-already-in-use';
    $('linkGoogleBtn').click(); await sleep(60);
    t('a Google account that already has its own learning account opens "combine", and is not added', !$('mergePanel').hidden && /already has its own learning account/.test($('mergeIntro').textContent) && window.__fakeUser.providerData.length === 1);
    $('mergeCancel').click(); await sleep(30);
    t('Cancel closes it', $('mergePanel').hidden);
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
  if (window.__scn === 'signingoogle'){
    t('when our own email is not working, Firebase sends its email instead', window.__brandAsk && window.__brandAsk.email === 'me@home.net' && window.__brandAsk.idToken === 'tok');
  }
  if (window.__scn === 'signinbrand'){
    $('linkEmailBtn').click(); await sleep(30);
    $('linkEmailInput').value = 'Me@Home.net'; $('linkEmailSend').click(); await sleep(80);
    t('our own email is sent, with the sign-in, and Firebase sends nothing', window.__brandAsk && window.__brandAsk.email === 'me@home.net' && window.__brandAsk.idToken === 'tok' && !window.__linkSent && /Check me@home\.net/.test($('signinSuccess').textContent) && localStorage.getItem('pa_link_email') === 'me@home.net');
    $('linkEmailInput').value = 'busy@x.com'; $('linkEmailSend').click(); await sleep(80);
    t('past the hourly limit it says to wait, and does not fall back to Firebase', /wait an hour/.test($('signinError').textContent) && !window.__linkSent && !$('linkEmailSend').disabled);
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

// Combine two accounts. mergekeep: this account is in a company, so it stays the main one and the other is
// combined into it. mergeother: the other account is chosen as the main one; this one is combined into it,
// closed, and the page switches.
async function mergeTests(store){
  const cards = () => Array.prototype.slice.call($('mergeCards').querySelectorAll('.merge-card'));
  const card = (w) => cards().filter(c => c.dataset.which === w)[0];
  const result = () => $('mergeResult').textContent;
  if (window.__scn === 'mergekeep'){
    window.__linkError = 'auth/credential-already-in-use';
    $('linkGoogleBtn').click(); await sleep(120);
    t('the panel offers to combine and, for Google, signs in to the other account without asking again', !$('mergePanel').hidden && /Combine/.test($('mergeTitle').textContent) && /me\.personal@gmail\.com already has its own learning account\. You can combine the two/.test($('mergeIntro').textContent) && !$('mergeStepCompare').hidden && window.__otherSignedIn && window.__otherSignedIn.uid === 'uHome');
    t('both accounts are shown side by side, with what each holds and when it was last active', /del@acme\.com/.test(card('me').textContent) && /Company: Acme/.test(card('me').textContent) && /5 lessons finished/.test(card('other').textContent) && /Assessment: Lots of Experience/.test(card('other').textContent) && /Last active Oct 2, 2026/.test(card('other').textContent), cards().map(c => c.textContent).join(' / '));
    t('the combined account is previewed: lessons, badges and the assessment from both, and both emails sign in', /Assessment: Lots of Experience/.test(result()) && /5 lessons finished, 1 course complete/.test(result()) && /Sign in with del@acme\.com or me\.personal@gmail\.com/.test(result()), result());
    t('an account in a company stays the main email: it says why, and the other choice is off', /In Acme, so it stays the main email/.test(card('me').textContent) && card('other').disabled && card('me').getAttribute('aria-checked') === 'true');
    t('one button combines them', !$('mergeGo').disabled && /Combine accounts/.test($('mergeGo').textContent) && $('mergeMyPw').hidden);
    $('mergeGo').click(); await sleep(500);
    const mine = store['progress/uDel'] || {};
    t('this account now holds the other\'s lessons and assessment as well as its own', JSON.stringify(((mine.courses || {})['discovery-novice'] || {}).completed) === '[1,2,3,4,5,6]' && mine.assessmentResult && mine.assessmentResult.tier === 'Lots of Experience' && mine.profile.phone === '555', JSON.stringify(mine));
    t('it remembers what it was combined with, so trying again never counts twice', JSON.stringify(mine.mergedFrom) === '["uHome"]');
    t('a vote only the other account cast moves across, and the tool total stays the same', !!store['toolVotes/uDel_t3'] && store['toolVotes/uDel_t3'].notify === true && !store['toolVotes/uHome_t3'] && store['tools/t3'].voteCount === 1, JSON.stringify(store['tools/t3']));
    t('a vote both cast is counted once', !store['toolVotes/uHome_t1'] && !!store['toolVotes/uDel_t1'] && store['tools/t1'].voteCount === 3);
    t('the other account is closed after its records are combined', !store['progress/uHome'] && window.__otherDeleted === true && window.__fakeUser.uid === 'uDel' && !window.__deleted);
    t('My assessments now shows the other account\'s assessment too', /Lots of Experience/.test($('assessBody').textContent) && (mine.assessmentHistory || []).length === 1);
    t('its Google sign-in now opens this account, so both emails sign in', window.__fakeUser.providerData.some(p => p.providerId === 'google.com' && p.email === 'me.personal@gmail.com') && /Combined\. Everything from me\.personal@gmail\.com is now in this account, and me\.personal@gmail\.com signs in here too/.test($('signinSuccess').textContent) && $('mergePanel').hidden, $('signinSuccess').textContent);
  }
  if (window.__scn === 'mergeother'){
    t('back from an email link to an address with its own account, the panel asks to sign in to it', !$('mergePanel').hidden && /me@home\.net already has its own learning account/.test($('mergeIntro').textContent) && $('mergeWho').textContent === 'me@home.net' && !$('mergeStepSignIn').hidden && $('mergeStepCompare').hidden);
    $('mergePw').value = 'wrong'; $('mergePwBtn').click(); await sleep(60);
    t('a wrong password is explained', /password is not right/.test($('mergeError').textContent) && $('mergeStepCompare').hidden);
    const real = window.__otherUser;
    window.__otherUser = { uid: 'uX', email: 'someone@else.com', providerData: [], getIdToken: async () => 't' };
    $('mergePw').value = 'right'; $('mergePwBtn').click(); await sleep(60);
    t('signing in to a different account is refused', /different account \(someone@else\.com\)/.test($('mergeError').textContent) && !window.__otherSignedIn && $('mergeStepCompare').hidden);
    window.__otherUser = real;
    $('mergePw').value = 'right'; $('mergePwBtn').click(); await sleep(120);
    t('this account is the main email to start with, and either can be chosen', !$('mergeStepCompare').hidden && card('me').getAttribute('aria-checked') === 'true' && !card('other').disabled && !card('me').disabled);
    card('other').click(); await sleep(20);
    t('choosing the other marks it as the main email; a Google account needs no password box', card('other').getAttribute('aria-checked') === 'true' && getComputedStyle(card('other').querySelector('.mc-main')).display !== 'none' && $('mergeMyPw').hidden);
    $('mergeGo').click(); await sleep(700);
    const log = window.__writeLog.map(w => w.op + ':' + w.path);
    const kept = store['progress/uHome'] || {};
    t('the main account now holds this one\'s records too', kept.profile && kept.profile.phone === '555' && kept.profile.company === 'Home' && JSON.stringify(kept.mergedFrom) === '["uDel"]', JSON.stringify(kept));
    t('this account\'s votes move across where the main one had not voted', !!store['toolVotes/uHome_t2'] && !store['toolVotes/uDel_t2'] && store['tools/t2'].voteCount === 0 && store['tools/t1'].voteCount === 3, JSON.stringify(store['tools/t2']));
    t('then this account is closed: its records, then its sign-in', !store['progress/uDel'] && !store['toolSuggestions/uDel'] && log.indexOf('deleteUser:uDel') > log.indexOf('delete:progress/uDel'), log.join(' | '));
    t('the page switches to the main account, with no trip back to sign in', window.__fakeUser && window.__fakeUser.uid === 'uHome' && window.__switchedWith && window.__switchedWith.email === 'me@home.net' && $('profileEmail').textContent === 'me@home.net' && /del-test/.test(location.pathname));
    t('this account\'s Google sign-in now opens the main one, so both emails sign in', window.__fakeUser.providerData.some(p => p.providerId === 'google.com' && p.email === 'del@acme.com') && /Combined\. You are now in me@home\.net, your main email, with everything from both\. del@acme\.com signs in here too/.test($('signinSuccess').textContent), $('signinSuccess').textContent);
  }
}

// Two-step verification (two-step.js), on My Profile: set up with a QR code and a code from the app, turn off, the
// confirm-it's-you step Firebase asks for, and who it is required for.
const dlg = () => document.querySelector('.pa-2s');
const dlgInput = () => dlg() && dlg().querySelector('input');
async function dlgSubmit(value){ const i = dlgInput(); if (i) i.value = value; dlg().querySelector('.go').click(); await sleep(80); }
async function twoStepTests(store){
  const scn = window.__scn;
  if (scn === 'twostep'){
    t('it starts off, with a button to set it up and none to turn it off', /^Off\./.test($('twoStepStatus').textContent) && !$('twoStepOn').hidden && !$('twoStepOn').disabled && $('twoStepOff').hidden, $('twoStepStatus').textContent);
    t('no "Protect your account" card on My Profile itself (the setting is right here)', !document.getElementById('pa-2s-nudge'));
    $('twoStepOn').click(); await sleep(400);
    t('set-up opens a window with a QR code and the key to type instead', !!dlg() && !!dlg().querySelector('.pa-2s-qr svg') && /JBSW Y3DP EHPK 3PXP/.test(dlg().querySelector('.pa-2s-key').textContent));
    const uri = dlg().querySelector('.pa-2s-fine a').getAttribute('href');
    t('on a phone, a link adds it straight to the authenticator app, named Product Advisory and the email, with no raw spaces', uri === 'otpauth://totp/Product%20Advisory:del%40acme.com?secret=JBSWY3DPEHPK3PXP&issuer=Product%20Advisory&algorithm=SHA1&digits=6&period=30&image=' + encodeURIComponent('https://www.productadvisory.co/assets/img/favicon-192.png'), uri);
    t('the code box is ready to type into, and is a one-time-code field', document.activeElement === dlgInput() && dlgInput().autocomplete === 'one-time-code' && dlgInput().inputMode === 'numeric');
    await dlgSubmit('12');
    t('a code that is not 6 digits is caught before asking', /6 digits/.test(dlg().querySelector('.pa-2s-err').textContent) && !window.__enrolled);
    await dlgSubmit('000000');
    t('a wrong code says so, and the window stays open', !!dlg() && /didn't match/.test(dlg().querySelector('.pa-2s-err').textContent) && !window.__enrolled);
    await dlgSubmit('123456');
    t('the right code turns it on, named "Authenticator app"', !dlg() && window.__enrolled === 'Authenticator app');
    t('the page says it is on, and offers Turn off instead', /^On\./.test($('twoStepStatus').textContent) && $('twoStepOn').hidden && !$('twoStepOff').hidden && /is on/.test($('twoStepOk').textContent), $('twoStepStatus').textContent);
    $('twoStepOff').click(); await sleep(80);
    t('turning off asks first', !!dlg() && /Turn off two-step/.test(dlg().textContent));
    dlg().querySelector('.no').click(); await sleep(60);
    t('"Keep it on" keeps it on', !dlg() && /^On\./.test($('twoStepStatus').textContent) && !window.__unenrolled);
    $('twoStepOff').click(); await sleep(80); await dlgSubmit(''); await sleep(80);
    t('confirming turns it off', !dlg() && window.__unenrolled === 1 && /^Off\./.test($('twoStepStatus').textContent) && !$('twoStepOn').hidden);
    $('twoStepOn').click(); await sleep(300);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(60);
    t('Escape closes the set-up without changing anything', !dlg() && /^Off\./.test($('twoStepStatus').textContent) && $('twoStepError').textContent === '');
  }
  if (scn === 'twostepauto'){
    await sleep(300);
    t('arriving from "Set it up", it asks to confirm it\'s you first (Firebase wants a recent sign-in)', !!dlg() && /Confirm it's you/.test(dlg().textContent) && dlgInput().type === 'password');
    t('the address bar is tidied to #two-step', !/twostep=setup/.test(location.search) && location.hash === '#two-step');
    await dlgSubmit('wrong');
    t('a wrong password says so', !!dlg() && /password isn't right/.test(dlg().querySelector('.pa-2s-err').textContent));
    await dlgSubmit('secret'); await sleep(300);
    t('the right password carries straight on to the QR code', !!dlg() && !!dlg().querySelector('.pa-2s-qr svg'));
    dlg().querySelector('.no').click(); await sleep(60);
    t('cancelling leaves it off, with no error', !dlg() && /^Off\./.test($('twoStepStatus').textContent) && $('twoStepError').textContent === '' && !window.__enrolled);
  }
  if (scn === 'twostepgoogle' || scn === 'twostepgoogleblocked'){
    $('twoStepOn').click(); await sleep(150);
    t('a Google account asked to confirm it\'s you gets a "Continue with Google" button (the window opens from that click, so it isn\'t blocked)', !!dlg() && /Confirm it's you/.test(dlg().textContent) && !dlgInput() && dlg().querySelector('.go').textContent === 'Continue with Google');
    dlg().querySelector('.go').click(); await sleep(400);
    if (scn === 'twostepgoogle') t('after Google confirms, it carries on to the QR code', !!dlg() && !!dlg().querySelector('.pa-2s-qr svg'));
    else {
      t('if the browser blocks the Google window it says how to fix it, and stays open to try again', !!dlg() && /blocked the Google window/.test(dlg().querySelector('.pa-2s-err').textContent));
      dlg().querySelector('.no').click(); await sleep(60);
      t('and cancelling then leaves no error behind', !dlg() && $('twoStepError').textContent === '');
    }
  }
  if (scn === 'twostepcode'){
    $('twoStepOn').click(); await sleep(300);
    t('an error with no plain wording shows its code, so it can be traced', /Something went wrong.*\(auth\/odd-thing\)/.test($('twoStepError').textContent), $('twoStepError').textContent);
  }
  if (scn === 'twostepunverified'){
    t('before the email is confirmed, the button is off and the page says why', $('twoStepOn').disabled && !$('twoStepNote').hidden && /Confirm your email address first/.test($('twoStepNote').textContent));
  }
  if (scn === 'twostepadmin'){
    t('company admins are told it is required, and why', !$('twoStepNote').hidden && /Required for company admins/.test($('twoStepNote').textContent), $('twoStepNote').textContent);
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
    else if (/^merge/.test(window.__scn)) await mergeTests(store);
    else if (/^twostep/.test(window.__scn)) await twoStepTests(store);
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
