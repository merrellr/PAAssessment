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
      t('opening the dashboard as a company member writes their shared record', !!share);
      t('it has their name, lower-case email, assessment, answers and course progress', share && share.identity.name === 'Dash User' && share.identity.email === 'dash@acme.com' && share.assessment.tier === 'Moderate Experience' && share.assessment.answers.length === 1 && share.courses['discovery-novice'].completed.length === 2);
      t('last active comes from their most recent activity', share && share.lastActiveAt === '2026-10-07T09:00:00.000Z', share && share.lastActiveAt);
      t('private reflections and phone number are not in it', share && !/PRIVATE|555-0100|profile|Acme"/.test(JSON.stringify(share).replace('Acme Health', '')));
      t('the member sees the "member of company" notice', banner.style.display === 'block' && /member of Acme Health/.test(banner.textContent));
      t('the Owner Console link stays hidden for a normal member', ownerLink.style.display === 'none');
      const writes = window.__writeLog.filter(w => w.path === 'orgs/orgA/members/uDash').length;
      t('exactly one write for the shared record on this visit', writes === 1, String(writes));
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
      t('and it links back to the course', /lesson\.html\?course=discovery-moderate/.test(document.getElementById('spacedReviewLink').getAttribute('href')));
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
    if (window.__scn === 'allfive') t('all 5 of its 5 lessons does', doneStat === '1', doneStat);
    const companyLink = document.getElementById('companyDashMenuItem');
    if (window.__scn === 'admin'){
      t('a company admin sees "Company dashboard" under Profile, pointing at company.html', companyLink.style.display === 'block' && companyLink.getAttribute('href') === 'company.html');
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