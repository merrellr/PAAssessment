const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async function(){
  try {
    await sleep(2500);
    const store = window.__store;
    const share = store['orgs/orgA/members/uDash'];
    const banner = document.getElementById('orgBanner');
    const ownerLink = document.getElementById('ownerConsoleMenuItem');
    if (window.__scn === 'member'){
      // Help (pa-shell.js): on every page; checked here on the dashboard
      const helpBtn = document.querySelector('.pa-tools [data-pa="help"]');
      const wg = document.getElementById('weekGoal');
      t('the weekly goal shows next to Your Courses, with a way to set it', !wg.hidden && /This week: 0 of 2 lessons/.test(wg.textContent) && /Set a goal/.test(wg.textContent) && wg.getAttribute('href') === '/profile#goals', wg.textContent);
      const tile = document.getElementById('badgeTile'), toast = document.getElementById('badgeToast');
      t('the My Badges tile shows the count, a bar and the next badge', !tile.hidden && /My Badges/.test(tile.textContent) && /4 of \d+ badges/.test(tile.textContent) && /Next:/.test(tile.textContent) && tile.querySelectorAll('.bd-medal').length === 3, tile.textContent);
      t('newly earned badges pop up', !!toast && !toast.hidden && /4 new badges!/.test(toast.textContent) && /First step/.test(toast.textContent), toast && toast.textContent);
      const me = store['progress/uDash'];
      t('they are saved with a date, and today counts as a day of learning', Object.keys(me.badges || {}).sort().join() === 'account,assessed,lesson1,note1' && Object.keys(me.activeLog || {}).length === 1, JSON.stringify(me.badges) + JSON.stringify(me.activeLog));
      toast.querySelector('.bd-t-open').click(); await sleep(60);
      const win = document.getElementById('badgesModal');
      t('"See My Badges" in the pop-up opens the My Badges window and closes the pop-up', toast.hidden && win && !win.hidden && /My Badges/.test(win.querySelector('h2').textContent) && win.querySelectorAll('.bd-item').length === window.BadgesCore.BADGES.length && document.activeElement === win.querySelector('.bd-modal-head .bd-x'));
      win.querySelector('.bd-item[data-id="lesson1"]').click(); await sleep(40);
      const det = document.getElementById('badgeDetail');
      t('a badge in the window opens up close, with the date it was earned', !det.hidden && /First step/.test(det.textContent) && /Earned \w+/.test(det.querySelector('.bd-when').textContent), det.textContent);
      t('an earned badge has no "start here" link', !det.querySelector('.bd-start'));
      det.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(30);
      t('Escape closes the close-up only, the window stays open', det.hidden && !win.hidden);
      win.querySelector('.bd-item[data-id="profile"]').click(); await sleep(40);
      const go = det.querySelector('.bd-start');
      t('a badge still to earn says where to start: All about you goes to the profile details', !!go && go.getAttribute('href') === '/profile#details' && /Add your company and role/.test(go.textContent), go && go.outerHTML);
      det.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })); await sleep(10);
      t('Tab reaches the link inside the close-up', document.activeElement === go);
      det.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(30);
      win.querySelector('.bd-item[data-id="lessons10"]').click(); await sleep(40);
      const go2 = det.querySelector('.bd-start');
      t('lesson badges go to Your Courses on My Learning', !!go2 && go2.getAttribute('href') === '/lms-dashboard#courses', go2 && go2.outerHTML);
      t('"Up next" has start links too', win.querySelectorAll('.bd-next .bd-start').length === 3);
      const stay = (e) => e.preventDefault();
      document.addEventListener('click', stay);
      go2.click(); await sleep(30);
      document.removeEventListener('click', stay);
      t('following the link closes the close-up and the window, so the page shows', det.hidden && win.hidden && !document.documentElement.classList.contains('bd-lock'));
      tile.click(); await sleep(40);   // open the window again for the checks below
      win.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(30);
      t('Escape again closes the window and returns to the tile', win.hidden && document.activeElement === tile);
      tile.click(); await sleep(40);
      t('the tile opens the window too', !win.hidden);
      win.querySelector('.bd-modal-head .bd-x').click(); await sleep(30);
      const mi = document.getElementById('badgesMenuItem');
      t('the dropdown has a My Badges item that opens the window here', /My Badges/.test(mi.textContent) && (mi.click(), !win.hidden));
      win.querySelector('.bd-modal-head .bd-x').click();
      t('the header has a Help button', !!helpBtn);
      helpBtn.click(); await sleep(60);
      const panel = document.querySelector('.pa-help-back');
      t('Help opens a panel with the search box ready', !!panel && panel.classList.contains('open') && document.activeElement === panel.querySelector('.pa-help-q'));
      const q = panel.querySelector('.pa-help-q');
      q.value = 'how do I retake the assessment'; q.dispatchEvent(new Event('input')); await sleep(30);
      const shown = Array.prototype.filter.call(panel.querySelectorAll('.pa-help-item'), d => !d.hidden).map(d => d.querySelector('summary').textContent);
      t('searching shows the matching answer, opened, and offers to ask the lessons', shown.join() === 'Can I take it again?' && panel.querySelector('.pa-help-item:not([hidden])').open && !panel.querySelector('.pa-help-ask').hidden, shown.join(' | '));
      t('it links to the feedback form', !!panel.querySelector('a[href="/feedback"]'));
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(30);
      t('Escape closes it', !panel.classList.contains('open'));
      t('opening the dashboard as a company member writes their shared record', !!share);
      t('it has their name, lower-case email, assessment, answers and course progress', share && share.identity.name === 'Dash User' && share.identity.email === 'dash@acme.com' && share.assessment.tier === 'Moderate Experience' && share.assessment.answers.length === 1 && share.courses['discovery-novice'].completed.length === 2);
      t('last active comes from their most recent activity', share && share.lastActiveAt === '2026-10-07T09:00:00.000Z', share && share.lastActiveAt);
      t('private reflections and phone number are not in it', share && !/PRIVATE|555-0100|profile|Acme"/.test(JSON.stringify(share).replace('Acme Health', '')));
      t('the member sees the "member of company" notice', banner.style.display === 'block' && /member of Acme Health/.test(banner.textContent));
      t('the Owner Console link stays hidden for a normal member', ownerLink.style.display === 'none');
      const writes = window.__writeLog.filter(w => w.path === 'orgs/orgA/members/uDash').length;
      t('exactly one write for the shared record on this visit', writes === 1, String(writes));
    }
    if (window.__scn === 'profilecard'){
      const card = document.getElementById('profilePromptCard');
      t('on a later visit, the "tell us about your team" card asks for their details, and says it earns a badge', card.style.display === 'block' && /earns you a badge/.test(card.textContent));
      document.getElementById('profilePromptJobTitle').value = 'Product Manager';
      await window.saveProfilePrompt(); await sleep(100);
      const toast = document.getElementById('badgeToast');
      t('saving company and role pops up the "All about you" badge straight away', !!toast && !toast.hidden && /New badge!/.test(toast.textContent) && /All about you/.test(toast.textContent), toast && toast.textContent);
      t('and it is saved with a date', /^\d{4}-\d\d-\d\dT/.test((store['progress/uDash'].badges || {}).profile || ''), JSON.stringify(store['progress/uDash'].badges));
    }
    const chips = Array.prototype.map.call(document.querySelectorAll('#recChips .rec-chip'), c => c.textContent.trim());
    // Four areas are tied for the most work left (3 courses each): AI Org (35%), Discovery (40%), AI Individual (45%), Strategy (50%).
    // Without a ranking the lowest scores win; with a customised company ranking the ranking breaks the tie.
    if (window.__scn === 'member' || window.__scn === 'focusdefault'){
      t('with no company ranking (or just the untouched standard order) the two lowest scores are recommended, as before',
        chips.length === 2 && /Organizational/.test(chips[0]) && /Customer & Market Discovery/.test(chips[1]) && chips.every(c => !/company priority/.test(c)), chips.join(' | '));
    }
    if (window.__scn === 'focus'){
      t('a customised company ranking breaks the tie: its top areas are recommended first',
        chips.length === 2 && /Product Strategy/.test(chips[0]) && /AI Fluency — Individual/.test(chips[1]), chips.join(' | '));
      t('and each is marked as a company priority', chips.every(c => /company priority/.test(c)), chips.join(' | '));
    }
    if (window.__scn === 'admin' || window.__scn === 'plain' || window.__scn === 'removed' || window.__scn === 'owner'){
      t('people with no (active) company ranking get the normal recommendations', chips.length === 2 && /Organizational/.test(chips[0]) && chips.every(c => !/company priority/.test(c)), chips.join(' | '));
    }
    /* ---- the pieces that need the lesson text: spaced review, notes, article links ---- */
    const reviewCard = document.getElementById('spacedReviewCard');
    const lessonsOf = (cid) => ((window.CONTENT_OVERRIDES && window.CONTENT_OVERRIDES[cid] && window.CONTENT_OVERRIDES[cid].lessons) || []);
    if (window.__scn === 'allfive'){
      const checks = []; lessonsOf('discovery-moderate').forEach(l => (l.checks || []).forEach(c => checks.push(c)));
      const shownQ = (document.querySelector('#spacedReviewCheckContainer .check-q') || {}).textContent;
      t('a course finished over a week ago brings up the spaced-review card', reviewCard.style.display === 'block');
      t('it names the course and how long ago', /Customer & Market Discovery — Moderate Experience — completed \d+ days ago/.test(document.getElementById('spacedReviewMeta').textContent), document.getElementById('spacedReviewMeta').textContent);
      t('the question is a real one from that course\'s lessons', checks.length > 0 && checks.some(c => c.question === shownQ), String(shownQ));
      t('and it links back to the course', /^\/lesson\?course=discovery-moderate/.test(document.getElementById('spacedReviewLink').getAttribute('href')));
      const q = checks.find(c => c.question === shownQ);
      const opts = Array.prototype.slice.call(document.querySelectorAll('#spacedReviewCheckContainer .check-option'));
      t('every answer option is shown', !!q && opts.length === q.options.length);
      if (q && opts.length){
        opts[q.correct].click(); await sleep(60);
        t('choosing the right answer marks it correct and explains why', opts[q.correct].classList.contains('correct') && /Correct\./.test(document.querySelector('#spacedReviewCheckContainer .check-feedback').textContent));
      }
      /* saved notes show the question they answer */
      const last = lessonsOf('discovery-moderate').find(l => l.id === 5);
      const notesCard = document.getElementById('myNotesCard');
      t('a saved reflection appears under Your notes', notesCard.style.display === 'block' && /My own answer to the final question/.test(notesCard.textContent));
      t('together with the question it answers (taken from the lesson text)', !!last && !!last.reflection && notesCard.textContent.indexOf(last.reflection.prompt.slice(0, 40)) > -1, notesCard.textContent.slice(0, 200));
    }
    if (window.__scn === 'threelessons' || window.__scn === 'recentdone' || window.__scn === 'plain'){
      t('no review card when nothing was finished a week ago (an unfinished course, a very recent one, or none)', reviewCard.style.display === 'none');
    }
    if (window.__scn === 'plain'){
      const articles = Array.prototype.slice.call(document.querySelectorAll('#articlesList .article-item'));
      t('every course that has a companion article is listed under Notes and articles (12)', document.getElementById('articlesCard').style.display === 'block' && articles.length === 12, String(articles.length));
      t('each links to its article', articles.every(a => /^https:\/\/www\.linkedin\.com\/pulse\//.test(a.querySelector('a').getAttribute('href'))));
    }
    const doneStat = document.getElementById('statAssignedCompleted').textContent.trim();
    if (window.__scn === 'threelessons') t('3 of a course\'s 5 lessons does NOT count as a finished course', doneStat === '0', doneStat);
    if (window.__scn === 'threelessons') t('a lesson finished today counts toward this week, older ones do not', /This week: 1 of 2 lessons/.test(document.getElementById('weekGoal').textContent) && /Change goal/.test(document.getElementById('weekGoal').textContent) && !document.getElementById('weekGoal').classList.contains('met'), document.getElementById('weekGoal').textContent);
    if (window.__scn === 'allfive') t('all 5 of its 5 lessons does', doneStat === '1', doneStat);
    const companyLink = document.getElementById('companyDashMenuItem');
    const roleBadge = document.getElementById('profileRoleBadge').textContent;
    t('the Profile menu shows a role badge', window.__scn === 'owner' ? roleBadge === 'Super admin' : window.__scn === 'admin' ? /^Company admin/.test(roleBadge) : roleBadge === 'Learner', roleBadge);
    t('"Your details" is gone from the menu; "Your progress" stays', !/Your details/.test(document.getElementById('profileDropdown').textContent) && /Your progress/.test(document.getElementById('profileDropdown').textContent));
    if (window.__scn === 'admin'){
      t('a company admin sees "Company dashboard" under Profile, pointing at the company dashboard', companyLink.style.display === 'block' && companyLink.getAttribute('href') === '/company');
      t('and still gets their own shared record like any member', !!share);
      t('but not the Owner Console link', ownerLink.style.display === 'none');
    } else {
      t('everyone else (member, no company, former member, owner) does not see "Company dashboard"', companyLink.style.display === 'none');
    }
    if (window.__scn === 'plain'){
      t('a person with no company: no shared record is made anywhere', Object.keys(store).filter(p => p.indexOf('orgs/') === 0).length === 0);
      t('and no company notice is shown', banner.style.display !== 'block');
    }
    if (window.__scn === 'removedold'){
      t('someone who left more than 60 days ago is not shown the notice', banner.style.display !== 'block');
    }
    if (window.__scn === 'member' || window.__scn === 'admin'){
      t('an active member\'s notice has no Dismiss link', document.getElementById('orgBannerDismiss').style.display === 'none');
    }
    if (window.__scn === 'removed'){
      t('a former member: nothing is written for their old company any more', !share);
      t('they are told plainly that they are no longer a member, and that the account and results stay theirs',
        banner.style.display === 'block' && /no longer a member of Acme Health/.test(banner.textContent) && /still yours/.test(banner.textContent) && /receives nothing new/.test(banner.textContent), banner.textContent);
      const dismiss = document.getElementById('orgBannerDismiss');
      t('the notice can be dismissed', dismiss.style.display !== 'none');
      dismiss.click(); await sleep(50);
      t('dismissing hides it and remembers that', banner.style.display === 'none' && Object.keys(localStorage).some(k => k.indexOf('pa_left_notice_uDash_') === 0));
    }
    if (window.__scn === 'owner'){
      t('the platform owner sees the Owner Console link under Profile', ownerLink.style.display === 'block');
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.title = out.join(' || ');
})();