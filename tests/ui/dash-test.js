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
    if (window.__scn === 'removed'){
      t('a former member: nothing is written for their old company any more', !share);
      t('and no company notice is shown', banner.style.display !== 'block');
    }
    if (window.__scn === 'owner'){
      t('the platform owner sees the Owner Console link under Profile', ownerLink.style.display === 'block');
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.title = out.join(' || ');
})();