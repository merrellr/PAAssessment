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
      t('My Badges is no longer in the Profile menu (the tile on Home opens it)', !document.getElementById('badgesMenuItem') && !/My Badges/.test(document.getElementById('profileDropdown').textContent));
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
    {
      const home = document.getElementById('assignedHome'), learn = document.getElementById('assignedLearning');
      if (window.__scn === 'assigned'){
        for (let i = 0; i < 100 && home.hidden; i++) await sleep(30);
        const rows = Array.prototype.map.call(home.querySelectorAll('.assign-row'), r => r.textContent.replace(/\s+/g, ' ').trim());
        t('a team member sees what their company assigned, at the top of Home and of My Learning', !home.hidden && /From your company/.test(home.textContent) && learn.innerHTML === home.innerHTML);
        t('only real courses are listed, the one due soonest first', rows.length === 2 && /Discovery/i.test(rows[0]) && /Strateg/i.test(rows[1]), rows.join(' | '));
        t('it counts what is left', /2 to go/.test(home.textContent));
        t('progress and the due date are shown, with due-soon highlighted', /2 of 5 lessons done/.test(rows[0]) && /Due tomorrow/.test(rows[0]) && !!home.querySelector('.assign-due.soon'), rows[0]);
        t('the company\'s note is shown as text, never as markup', /Before <b>planning<\/b>/.test(home.textContent) && !home.querySelector('.assign-note b'));
        const go = home.querySelector('.assign-row a');
        t('Continue opens the next lesson not done', go && /Continue/.test(go.textContent) && /course=discovery-novice&lesson=3/.test(go.getAttribute('href')), go && go.getAttribute('href'));
        t('a course with no lessons done says Start', /Start/.test(home.querySelectorAll('.assign-row a')[1].textContent));
      }
      if (window.__scn === 'member' || window.__scn === 'removed' || window.__scn === 'plain'){
        await sleep(100);
        t('with nothing assigned, or no active company, there is no assignments card', home.hidden && learn.hidden);
      }
    }
    {
      const gp = document.getElementById('growthPanel');
      if (window.__scn === 'growth'){
        const rows = Array.prototype.map.call(gp.querySelectorAll('.growth-row'), r => r.textContent.replace(/\s+/g, ' ').trim());
        t('with two assessments, My growth compares them, on Then vs now by default', !gp.hidden && /My growth/.test(gp.textContent) && /Overall 38 → 55/.test(gp.textContent) && gp.querySelector('[data-gview="then"]').getAttribute('aria-pressed') === 'true', gp.textContent.slice(0, 200));
        t('one row per skill area, the biggest gain first, with a fall shown honestly', rows.length === 7 && /Customer & Market Discovery\+25/.test(rows[0]) && /Stakeholder.*-3$/.test(rows[6]), rows.join(' | '));
        t('it names the biggest jump and the remaining gap', /Your biggest jump:.*Customer & Market Discovery \(\+25\)/.test(gp.textContent) && /Still your gap:.*AI Fluency — Organizational, at 35/.test(gp.textContent));
        gp.querySelector('[data-gview="trend"]').click(); await sleep(50);
        t('Over time shows a small line per area', gp.querySelectorAll('.growth-spark polyline').length === 7 && document.getElementById('growthPanel').querySelector('[data-gview="trend"]').getAttribute('aria-pressed') === 'true');
        // the quick tour: a click-through guide on the page (tour.js), no media, beside the greeting
        const gb = document.querySelector('.guide-btn[data-guide]');
        const shown = (el) => !!el && el.getClientRects().length > 0;
        t('a "New here? Take the 1-minute tour" button beside the greeting, with a × to hide it', !!gb && /Take the 1-minute tour/.test(gb.textContent) && !!gb.closest('.home-hi') && !!gb.parentNode.querySelector('.guide-x') && !document.querySelector('video, .tour-dialog'));
        const hiR = document.getElementById('homeHello').getBoundingClientRect(), gbR = gb.getBoundingClientRect();
        t('on a wide screen it sits on the greeting\'s row, to the right', window.innerWidth < 900 || (gbR.left > hiR.right && gbR.top < hiR.bottom + 40), JSON.stringify([hiR.right, hiR.bottom, gbR.left, gbR.top]));
        gb.click(); await sleep(80);
        const pop = () => document.querySelector('.guide-pop');
        t('it opens on step 1 with the welcome, highlighting the greeting', !!pop() && /1 of 9/.test(pop().querySelector('.g-c').textContent) && /Welcome to Product Advisory Learning/.test(pop().textContent) && !!document.querySelector('.guide-hole') && document.activeElement === pop().querySelector('.g-n'));
        const seen = [pop().querySelector('h2').textContent];
        for (let k = 0; k < 12 && pop(); k++) { pop().querySelector('.g-n').click(); await sleep(40); if (pop()) seen.push(pop().querySelector('h2').textContent); }
        t('Next walks the steps (skipping any not on the page) and Done closes it', !pop() && !document.querySelector('.guide-hole, .guide-shield') && seen.indexOf('Your next best step') > -1 && seen.indexOf('My growth') > -1 && seen[seen.length - 1] === 'Your profile', seen.join(' > '));
        const help = document.querySelector('[data-help-anchor]');
        await sleep(400);
        t('once taken, the button leaves the page; focus goes to Help, with a note that the tour lives there now', !shown(gb) && !shown(gb.parentNode) && document.activeElement === help && /again any time from Help/.test((document.querySelector('.guide-tip') || {}).textContent || ''), [shown(gb), document.activeElement && document.activeElement.outerHTML.slice(0, 60), !!document.querySelector('.guide-tip')].join(' | '));
        await sleep(300);
        t('taking it is saved to the account too, so it stays gone on their other devices', JSON.stringify((store['progress/uDash'] || {}).toursTaken) === '["learning"]', JSON.stringify((store['progress/uDash'] || {}).toursTaken));
        help.click(); await sleep(80);
        const ht = document.querySelector('.pa-help-tour');
        t('Help offers this page\'s tour', !!ht && !ht.hidden && document.querySelector('.pa-help-new').hidden);
        ht.click(); await sleep(120);
        t('and it starts the whole tour again', !!pop() && /1 of 9/.test(pop().querySelector('.g-c').textContent));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(20);
        t('Esc closes it; the button stays gone and no second note appears', !pop() && !shown(gb) && document.querySelectorAll('.guide-tip').length <= 1);
        // a new feature: the tour gets a version 2 with a new step, so the button comes back as "New on this page"
        const cfg = JSON.parse(gb.getAttribute('data-guide'));
        cfg.steps[2].v = 2; gb.setAttribute('data-guide', JSON.stringify(cfg)); gb.setAttribute('data-tour-v', '2');
        window.PATour.merge([]); await sleep(30);
        t('when the tour changes, its button comes back marked New, counting the new steps', shown(gb) && gb.classList.contains('guide-new') && /New/.test(gb.querySelector('.guide-tag').textContent) && /See what.s new/.test(gb.textContent) && /1 new step/.test(gb.textContent + ' ' + gb.title), gb.textContent);
        help.click(); await sleep(60);
        t('and Help marks this page\'s tour New too', !document.querySelector('.pa-help-new').hidden && /what\u2019s new/.test(document.querySelector('.pa-help-tour small').textContent));
        document.querySelector('.pa-help-back [data-pa="close"]').click(); await sleep(30);
        gb.click(); await sleep(80);
        t('it walks just the new step, as "What\'s new"', !!pop() && /What's new · 1 of 1/.test(pop().querySelector('.g-c').textContent) && pop().querySelector('h2').textContent === 'Your next best step', pop() && pop().textContent);
        pop().querySelector('.g-n').click(); await sleep(300);
        t('then it leaves again, saved as version 2', !pop() && !shown(gb) && /learning@2/.test(localStorage.getItem('pa-tours-taken')) && JSON.stringify(store['progress/uDash'].toursTaken) === '["learning@2"]', localStorage.getItem('pa-tours-taken'));
        window.scrollTo(0, 0);
        t('a retake is offered once 90 days have passed since the last one', /Retake the assessment/.test(gp.textContent) || (Date.now() - Date.parse('2026-10-05T10:00:00.000Z')) < 90 * 864e5);
      }
      if (window.__scn === 'member'){
        t('with one assessment, it shows the starting point (no comparison yet)', !gp.hidden && /Your starting point/.test(gp.textContent) && !gp.querySelector('[data-gview]') && gp.querySelectorAll('.growth-row').length === 7 && /Your biggest opportunity:.*AI Fluency — Organizational/.test(gp.textContent), gp.textContent.slice(0, 200));
      }
    }
    if (window.__scn === 'tourstaken'){
      // taken on another device: the account remembers, so the button never shows here; × on the My Learning tour hides it
      const gb = document.querySelector('[data-tour="learning"]'), shown = (el) => !!el && el.getClientRects().length > 0;
      t('a tour taken on another device stays gone here (from the account)', !!gb && !shown(gb) && /learning/.test(localStorage.getItem('pa-tours-taken') || ''));
      window.showView('learning'); window.setLearnTab('coach');
      await sleep(150);
      const mb = document.querySelector('[data-tour="my-learning"]'), x = mb && mb.parentNode.querySelector('.guide-x');
      t('My Learning\'s tour shows (not taken yet), with a × to hide it', shown(mb) && !!x);
      x.click(); await sleep(300);
      t('× hides it without starting it, and remembers', !shown(mb) && !document.querySelector('.guide-pop') && JSON.parse(localStorage.getItem('pa-tours-taken')).indexOf('my-learning') > -1 && store['progress/uDash'].toursTaken.indexOf('my-learning') > -1 && store['progress/uDash'].toursTaken.indexOf('learning') > -1, JSON.stringify(store['progress/uDash'].toursTaken));
    }
    if (window.__scn === 'tourlink'){
      // Help's "Take the tour" from another page opens /lms-dashboard?tour=1: the Home tour starts once the page shows
      const pop = document.querySelector('.guide-pop');
      t('?tour=1 starts the Home tour by itself, from step 1', !!pop && /Quick tour · 1 of 9/.test(pop.querySelector('.g-c').textContent) && !/tour=/.test(location.search), pop ? pop.textContent : location.search);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(20);
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
      t('a course finished over a week ago brings up the Quick refresher, explained', reviewCard.style.display === 'block' && /Quick refresher/.test(reviewCard.textContent) && /helps it stick/.test(reviewCard.textContent));
      t('it names the course and how long ago', /Customer & Market Discovery — Moderate Experience · finished \d+ days ago/.test(document.getElementById('spacedReviewMeta').textContent), document.getElementById('spacedReviewMeta').textContent);
      t('the question is a real one from that course\'s lessons', checks.length > 0 && checks.some(c => c.question === shownQ), String(shownQ));
      t('and it links back to the course', /^\/lesson\?course=discovery-moderate/.test(document.getElementById('spacedReviewLink').getAttribute('href')));
      const q = checks.find(c => c.question === shownQ);
      const opts = Array.prototype.slice.call(document.querySelectorAll('#spacedReviewCheckContainer .check-option'));
      t('every answer option is shown', !!q && opts.length === q.options.length);
      if (q && opts.length){
        opts[q.correct].click(); await sleep(60);
        t('choosing the right answer marks it correct and explains why', opts[q.correct].classList.contains('correct') && /Correct\./.test(document.querySelector('#spacedReviewCheckContainer .check-feedback').textContent));
        t('the right answer shows a green tick, in the answer and in the feedback', !!opts[q.correct].querySelector('.check-mark svg') && !!document.querySelector('#spacedReviewCheckContainer .check-verdict.ok .check-mark') && /correct answer/.test(opts[q.correct].textContent));
        const more = document.getElementById('refresherMore');
        t('after answering: another question, or done for today', !more.hidden && !document.getElementById('refresherNext').hidden && /more today/.test(more.textContent));
        const before = document.querySelector('#spacedReviewCheckContainer .check-q').textContent;
        document.getElementById('refresherNext').click(); await sleep(40);
        t('"Another question" brings a fresh, unanswered one', more.hidden && !document.querySelector('#spacedReviewCheckContainer .check-option.correct') && (checks.length < 2 || document.querySelector('#spacedReviewCheckContainer .check-q').textContent !== before));
        document.getElementById('refresherDone').click(); await sleep(20);
        let doneSaved = false; try { doneSaved = Object.keys(localStorage).some(k => /^pa_refresher_done_/.test(k)); } catch (e) {}
        t('"Done for today" puts it away until tomorrow', reviewCard.style.display === 'none' && doneSaved);
      }
      /* saved notes show the question they answer */
      const last = lessonsOf('discovery-moderate').find(l => l.id === 5);
      const notesCard = document.getElementById('myNotesCard');
      t('a saved reflection appears under Your notes', notesCard.style.display === 'block' && /My own answer to the final question/.test(notesCard.textContent));
      t('together with the question it answers (taken from the lesson text)', !!last && !!last.reflection && notesCard.textContent.indexOf(last.reflection.prompt.slice(0, 40)) > -1, notesCard.textContent.slice(0, 200));
    }
    if (window.__scn === 'demo' || window.__scn === 'demonotowner'){
      const before = JSON.stringify(store['progress/uDash']);
      if (window.__scn === 'demonotowner'){
        t('demo mode asked for by someone who isn\'t the owner: their own dashboard, no banner', !document.querySelector('.demo-bar') && !window.__paDemo && !/Alex/.test(document.querySelector('.home-hello') ? document.querySelector('.home-hello').textContent : ''));
      } else {
        const bar = document.querySelector('.demo-bar'), sc = document.querySelector('.demo-script');
        t('demo mode (owner): the banner says it is a fictional learner and nothing is saved', bar && /Alex Rivera/.test(bar.textContent) && /Nothing here is saved/.test(bar.textContent) && window.__paDemo === true);
        t('it greets Alex, not the owner', /Alex/.test(document.body.textContent) && !/Hi, Dash|Dash User/.test((document.querySelector('.home-hello') || document.body).textContent));
        t('Alex\'s data: the plan is in week 2, practice history shows', /Week 2 of 4/.test(document.getElementById('planPanel').textContent) && document.querySelectorAll('#readinessPanel .cc-act li').length >= 3);
        t('the demo script: seven steps, each with Show me', sc && sc.querySelectorAll('li').length === 7 && sc.querySelectorAll('[data-step]').length === 7);
        t('the script starts closed, so it does not cover the page', !sc.querySelector('details').open);
        sc.querySelector('details').open = true;
        sc.querySelector('[data-step="2"]').click(); await sleep(80);
        t('Show me on "A study plan" opens My Learning on the plan', document.body.dataset.view === 'learning' && document.body.dataset.ltab === 'plan', document.body.dataset.view + '/' + document.body.dataset.ltab);
        const a = document.querySelector('#readinessPanel .cc-act a'), stop = e => e.preventDefault(); document.addEventListener('click', stop); a.click(); document.removeEventListener('click', stop);
        t('links to practice stay in the demo', /demo=1/.test(a.getAttribute('href')), a.getAttribute('href'));
        document.querySelector('#planPanel [data-pl-act="remove"]') && (window.confirm = () => true, document.querySelector('#planPanel [data-pl-act="remove"]').click()); await sleep(150);
        t('the owner\'s own record is never read for display, and nothing is written', JSON.stringify(store['progress/uDash']) === before && !/PRIVATE THOUGHTS/.test(document.body.textContent));
      }
    }
    if (window.__scn === 'library'){
      const lp = document.getElementById('libraryPanel');
      window.showView('learning'); document.getElementById('ltab-library').click(); await sleep(40);
      t('Library tab: Worth your time right now, three picks each with why', document.body.dataset.ltab === 'library' && /Worth your time right now/.test(lp.textContent) && lp.querySelectorAll('.lb-pick').length === 3 && [...lp.querySelectorAll('.lb-why')].every(w => w.textContent.length > 20), [...lp.querySelectorAll('.lb-pick')].map(p => p.textContent).join(' | '));
      t('a read pick, a listen pick (from the audio index) and a toolkit', /Lesson/.test(lp.querySelectorAll('.lb-pk')[0].textContent) && /Listen/.test(lp.querySelectorAll('.lb-pk')[1].textContent) && /listen=1/.test(lp.querySelectorAll('.lb-pick')[1].getAttribute('href')) && lp.querySelectorAll('.lb-pick')[2].getAttribute('href') === '/my-tools');
      t('an Ask Compass box with examples', lp.querySelector('form[data-coach-ask] input') && lp.querySelectorAll('.cc-try-q').length === 3);
      const det = lp.querySelector('.lb-browse');
      t('Browse everything starts closed, with the counts', !det.open && /lessons · 3 to listen to · \d+ articles · 5 toolkits/.test(det.querySelector('summary').textContent), det.querySelector('summary').textContent);
      det.querySelector('summary').click(); await sleep(60);
      const count = () => +((lp.querySelector('.lb-count').textContent.match(/\d+/) || [0])[0]);
      t('opened: the first 40 of everything, and a Show more', det.open && lp.querySelectorAll('.lb-row').length === 40 && lp.querySelector('[data-lib-more]') && count() > 150, count());
      lp.querySelector('[data-lib-kind="tool"]').click(); await sleep(30);
      t('Toolkits only: the five toolkits, the chip pressed', lp.querySelectorAll('.lb-row').length === 5 && lp.querySelector('[data-lib-kind="tool"]').getAttribute('aria-pressed') === 'true');
      lp.querySelector('[data-lib-kind="all"]').click(); await sleep(30);
      const sel = document.getElementById('lbArea'); sel.value = 'prioritization'; sel.dispatchEvent(new Event('change')); await sleep(30);
      t('a skill area: its lessons, practice and its toolkit', [...lp.querySelectorAll('.lb-row')].every(r => /Prioritization|Scorecard/.test(r.textContent)) && /Feature Prioritization Scorecard/.test(lp.textContent));
      const q = document.getElementById('lbQ'); q.value = 'zzqx'; q.dispatchEvent(new Event('input')); await sleep(30);
      t('search with no match says so and keeps focus in the box', /Nothing matches/.test(lp.textContent) && document.activeElement === document.getElementById('lbQ'));
    }
    if (window.__scn === 'plan'){
      const pp = document.getElementById('planPanel'), home = document.getElementById('homePlan');
      t('Home: with no plan, an offer to build one', !home.hidden && /Want a plan\?/.test(home.textContent) && home.querySelector('a[href="/my-learning#plan"]'));
      t('My plan tab: three questions, Build disabled until each is answered', document.getElementById('ltab-plan') && pp.querySelectorAll('.pl-q').length === 3 && pp.querySelector('[data-pl-act="build"]').disabled);
      const pick = (k, v) => pp.querySelector('[data-pl="' + k + '"][data-v="' + v + '"]').click();
      pick('aim', 'promoted'); pick('weeks', '4'); pick('hours', '2');
      t('answers show as chosen (radio buttons)', pp.querySelector('[data-pl="aim"][data-v="promoted"]').getAttribute('aria-checked') === 'true' && !pp.querySelector('[data-pl-act="build"]').disabled);
      pp.querySelector('[data-pl-act="build"]').click(); await sleep(30);
      t('the preview: 4 weeks, lessons and practice, before it is saved', /Get promoted: 4 weeks/.test(pp.textContent) && pp.querySelectorAll('.pl-week').length === 4 && /lessons and \d+ practice sessions/.test(pp.textContent) && !store['progress/uDash'].studyPlan, pp.querySelector('.pl-sum') && pp.querySelector('.pl-sum').textContent);
      t('it starts with the aim: Strategy for Get promoted', /Product Strategy/.test(pp.querySelector('.pl-week b').textContent), pp.querySelector('.pl-week b').textContent);
      pp.querySelector('[data-pl-act="edit"]').click(); await sleep(20);
      t('Change my answers goes back with the answers kept', pp.querySelector('[data-pl="weeks"][data-v="4"]').getAttribute('aria-checked') === 'true');
      pp.querySelector('[data-pl-act="build"]').click(); await sleep(20);
      pp.querySelector('[data-pl-act="save"]').click(); await sleep(150);
      const sp = store['progress/uDash'].studyPlan;
      t('Use this plan saves it on progress.studyPlan', sp && sp.v === 1 && sp.aim === 'promoted' && sp.list.length === 4 && sp.hours === 2, JSON.stringify(sp || {}).slice(0, 120));
      t('then the plan: week 1 of 4, the next item, this week open and the rest closed', /Week 1 of 4/.test(pp.querySelector('h2').textContent) && pp.querySelector('.pl-next') && pp.querySelector('.pl-week.s-now[open]') && pp.querySelectorAll('.pl-week[open]').length === 1);
      t('Home: this week in your plan, with what is left', /This week in your plan/.test(home.textContent) && home.querySelectorAll('.pl-item').length >= 1 && /Week 1 of 4/.test(home.textContent), home.textContent.slice(0, 160));
      window.confirm = () => true;
      pp.querySelector('[data-pl-act="remove"]').click(); await sleep(150);
      t('Remove my plan clears it and shows the questions again', store['progress/uDash'].studyPlan === null && pp.querySelectorAll('.pl-q').length === 3);
    }
    if (window.__scn === 'activity'){
      const rp = document.getElementById('readinessPanel'), cp = document.getElementById('coachPanel'), gp = document.getElementById('gapsPanel');
      const rows = [...rp.querySelectorAll('.cc-act li')].map(li => li.textContent);
      t('My readiness: recent activity, newest first, with the session that needs review flagged', rows.length === 4 && /Practised Product Strategy/.test(rows[0]) && /4 of 4 right/.test(rows[0]) && rows.some(r => /1 of 4 right/.test(r) && /Needs review/.test(r) && /Yesterday/.test(r)) && rows.some(r => /Lesson check in/.test(r)) && rows.some(r => /Finished 1 lesson/.test(r)), rows.join(' | '));
      t('My readiness: what changed today, with the area that moved up', /Today: 5 answers, 5 right/.test(rp.querySelector('.cc-chg').textContent) && /Needs attention → Developing/.test((rp.querySelector('.cc-chg-list') || {}).textContent || ''), rp.querySelector('.cc-chg').textContent);
      t('Compass Coach: recent activity too', cp.querySelectorAll('.cc-act li').length === 4);
      t('My gaps: the observed pattern column', /Observed pattern/.test(gp.textContent));
      t('Home: the readiness card says what changed today', /Today: 5 answers/.test((document.querySelector('#homeReadiness .hr-today') || {}).textContent || ''));
      t('an activity row links to practising that area', /\/practice\?area=strategy/.test(rp.querySelector('.cc-act a').getAttribute('href')));
    }
    if (window.__scn === 'threelessons' || window.__scn === 'recentdone' || window.__scn === 'plain'){
      t('no review card when nothing was finished a week ago (an unfinished course, a very recent one, or none)', reviewCard.style.display === 'none');
    }
    if (window.__scn === 'plain'){
      t('no list of companion articles on the dashboard: a link to them on the framework page instead, beside the framework link', !document.getElementById('articlesCard') && !!document.querySelector('a[href="/framework#articles"]') && !!document.querySelector('a[href="/framework"]'));
      const ico = document.querySelector('#courseCatalog .dom-ico');
      t('the skill-area icons stand on their own (no tile behind them)', !!ico && !document.querySelector('#courseCatalog .pa-dom-badge') && getComputedStyle(ico).backgroundColor === 'rgba(0, 0, 0, 0)');
    }
    const doneStat = document.getElementById('statAssignedCompleted').textContent.trim();
    if (window.__scn === 'threelessons') t('3 of a course\'s 5 lessons does NOT count as a finished course', doneStat === '0', doneStat);
    if (window.__scn === 'threelessons') t('a lesson finished today counts toward this week, older ones do not', /This week: 1 of 2 lessons/.test(document.getElementById('weekGoal').textContent) && /Change goal/.test(document.getElementById('weekGoal').textContent) && !document.getElementById('weekGoal').classList.contains('met'), document.getElementById('weekGoal').textContent);
    if (window.__scn === 'allfive') t('all 5 of its 5 lessons does', doneStat === '1', doneStat);
    // Pick up where you left off (the top of the page)
    const hb = document.getElementById('homeBand'), resumeCard = document.getElementById('homeResume'), nextCard = document.getElementById('homeNext'), toolsCard = document.getElementById('homeTools');
    if (window.__scn !== 'demo') t('the top of the page greets them by first name', !hb.hidden && /, Dash$/.test(document.getElementById('homeHello').textContent), document.getElementById('homeHello').textContent);
    const goA = resumeCard.querySelector('a.btn');
    if (window.__scn !== 'demo') t('"Your next best step": the course in progress, with the next lesson to open', /Your next best step/.test(resumeCard.textContent) && resumeCard.classList.contains('wide') && /Customer & Market Discovery/.test(resumeCard.textContent) && (window.__scn === 'threelessons' ? /3 of 5 lessons done/.test(resumeCard.textContent) && goA && /course=discovery-moderate&lesson=4/.test(goA.getAttribute('href')) && /lesson 4/.test(goA.textContent)
      : /2 of 5 lessons done/.test(resumeCard.textContent) && goA && /course=discovery-novice&lesson=3/.test(goA.getAttribute('href')) && /lesson 3/.test(goA.textContent)), resumeCard.textContent + ' ' + (goA && goA.getAttribute('href')));
    const side = resumeCard.querySelector('.step-side');
    t('with a course in progress, "After that" still shows what comes next, and says why', !!side && /After that/.test(side.textContent) && (window.__scn === 'assigned' ? /Product Strategy/.test(side.textContent) && /company asked/.test(side.textContent) : /lesson 1/.test(side.textContent) && /assessment/.test(side.textContent)), side && side.textContent);
    t('the separate "Up next" card makes way for the wide card', nextCard.hidden);
    if (window.__scn === 'assigned') t('a company course due tomorrow is the next best step, ahead of the plan', /company assigned it/.test(resumeCard.textContent) && /due tomorrow/.test(resumeCard.textContent));
    if (window.__scn === 'member'){
      await (async () => { const s0 = Date.now(); while (Date.now() - s0 < 3000 && !toolsCard.querySelector('.home-saved')) await sleep(30); })();
      const links = Array.prototype.map.call(toolsCard.querySelectorAll('.home-saved a'), a => a.getAttribute('href'));
      t('their newest saved tools, opening in Learning, never someone else\'s', links.join() === '/my-tools?open=t2,/my-tools?open=t1' && /Untitled build, buy, or partner/.test(toolsCard.textContent) && !/Not mine/.test(toolsCard.textContent) && /All your work \(2\)/.test(toolsCard.textContent), links.join() + ' ' + toolsCard.textContent);
      t('the header links to My toolkit', !!document.querySelector('.pa-links a[href="/my-tools"]'));
    } else if (window.__scn === 'plain'){
      t('nothing saved: it opens My Toolkit, in Learning (never the public site)', /Open My Toolkit/.test(toolsCard.textContent) && !!toolsCard.querySelector('a[href="/my-tools"]') && !toolsCard.querySelector('a[href*="productadvisory.co"]'), toolsCard.textContent);
    }
    const companyLink = document.getElementById('companyDashMenuItem');
    const roleBadge = document.getElementById('profileRoleBadge').textContent;
    t('the Profile menu shows a role badge', window.__scn === 'owner' || window.__scn === 'demo' ? roleBadge === 'Super admin' : window.__scn === 'admin' ? /^Company admin/.test(roleBadge) : roleBadge === 'Learner', roleBadge);
    const dd = document.getElementById('profileDropdown');
    t('the Profile menu: their picture and who they are at the top, then Account and Learning; no progress, tour, feedback or cookie settings', !/Your details|Your progress|Replay the tour|Send feedback|Cookie settings/.test(dd.textContent) && /^[A-Z?]{1,2}$/.test(document.getElementById('profileFace').textContent) && /^Account,Learning/.test(Array.prototype.map.call(dd.querySelectorAll('.profile-progress-label'), x => x.textContent).join()), dd.textContent.replace(/\s+/g, ' '));
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
      const hide = document.getElementById('orgBannerDismiss'), forever = document.getElementById('orgBannerForeverBox');
      t('an active member\'s notice can be hidden, with "Don\'t show again"', banner.style.display === 'block' && hide.style.display === 'inline' && hide.textContent === 'Hide' && !document.getElementById('orgBannerForever').hidden);
      if (window.__scn === 'admin'){
        forever.checked = true; hide.click(); await sleep(20);
        let kept = false; try { kept = Object.keys(localStorage).some(k => /^pa_org_notice_hidden_/.test(k)); } catch (e) {}
        t('ticking it and hiding keeps it away for good (this company)', banner.style.display === 'none' && kept);
      }
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