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

(async function(){
  try {
    await sleep(1500);
    const store = window.__store;
    if (window.__scn === 'photo') await photoTests(store);
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
