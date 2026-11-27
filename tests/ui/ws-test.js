// The Team Knowledge Workspace (workspace.html): the company's shared items, adding and editing with links, deleting
// (own items; an admin any), CSV import, admin settings, and the fictional sample for anyone without a company.
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const until = async (f, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await sleep(50); } return false; };
const store = () => window.__store;
const items = () => Object.keys(store()).filter(k => k.indexOf('workspaces/orgA/items/') === 0);
const row = (title) => [...document.querySelectorAll('#wsList .ws-row')].find(b => b.querySelector('.t').textContent === title);

(async function(){
  try {
    await until(() => !/Loading/.test($('wsSub').textContent) && document.querySelector('#wsList .ws-row, #wsList .empty'));
    if (window.__scn === 'solo') {
      t('no company: the fictional sample, said plainly, read-only', !$('wsSample').hidden && /Tidewater/.test($('wsSample').textContent) && /made-up/.test($('wsSample').textContent) && $('wsAdd').disabled);
      t('it links to asking about company accounts (in Learning)', $('wsSample').querySelector('a[href="/request-info"]'));
      t('all five kinds, with counts', $('wsChips').querySelectorAll('.chip').length === 6 && /Accounts\s*6/.test($('wsChips').textContent));
      row('Plan routes by drive time').click(); await sleep(40);
      t('opening an item shows it, read-only, with its links ticked', !$('wsEditor').hidden && $('edT').readOnly && !$('edSave') && $('wsEditor').querySelectorAll('input[name=lk]:checked').length === 4);
      $('edCancel').click(); await sleep(20);
      t('no Settings tab without a company', $('tabSettings').hidden);
      // the views
      $('tabValue').click(); await sleep(30);
      const vv = [...document.querySelectorAll('#vvBody .vv li')];
      t('value view: every idea, ranked by account value', vv.length === 7 && /Plan routes by drive time/.test(vv[0].textContent) && /3 accounts/.test(vv[0].textContent), vv[0] && vv[0].textContent);
      const loud = vv.find(li => /Let customers book online/.test(li.textContent));
      t('value view: the most-voted idea shows where votes and value disagree', loud && /#1 by votes/.test(loud.textContent) && /↓ 5 places below its votes/.test(loud.textContent), loud && loud.textContent);
      t('value view: bars scale to the top idea', parseFloat(vv[0].querySelector('.bar i').style.width) === 100 && parseFloat(loud.querySelector('.bar i').style.width) < 5);
      $('vvWeight').click(); await sleep(20);
      t('value view: weighting off re-ranks by plain value', document.querySelectorAll('#vvBody .vv li').length === 7 && parseFloat(document.querySelector('#vvBody .vv li .bar i').style.width) === 100);
      $('tabRel').click(); await sleep(30);
      const heads = [...document.querySelectorAll('#rmBody thead th')].map(th => th.textContent);
      t('release map: releases by date, then No release', heads.length === 5 && /^Spring release/.test(heads[1]) && /^Summer/.test(heads[2]) && /^Autumn/.test(heads[3]) && /^No release/.test(heads[4]), heads.join(' | '));
      const onb = [...document.querySelectorAll('#rmBody tbody tr')].find(tr => tr.querySelector('th').textContent === 'Onboarding');
      t('release map: a feature sits in its area and release, with the ideas it answers', onb && /Guided setup/.test(onb.children[1].textContent) && /Plan routes by drive time/.test([...document.querySelectorAll('#rmBody tbody tr')].find(tr => tr.querySelector('th').textContent === 'Scheduling').children[2].textContent));
      $('tabGoals').click(); await sleep(30);
      const gts = [...document.querySelectorAll('#gtBody .gt')];
      t('goal timeline: every goal, by target date', gts.length === 3 && /^Cut time to first job/.test(gts[0].textContent));
      const grow = gts.find(g => /Grow mid-market/.test(g.textContent)), halve = gts.find(g => /Halve missed/.test(g.textContent));
      t('goal timeline: the goal’s features on the track, by date', grow.querySelectorAll('.track .dot').length === 3 && /Route optimisation/.test(grow.querySelector('ul').textContent) && /0 of 3 features done/.test(grow.textContent));
      t('goal timeline: a feature with no release is listed as not scheduled', /Not scheduled: Customer self-booking page/.test(halve.textContent));
      grow.querySelector('[data-open]').click(); await sleep(30);
      t('a title in a view opens the item', $('tabItems').getAttribute('aria-selected') === 'true' && !$('wsEditor').hidden && $('edT').value === 'Grow mid-market revenue 30%');
      $('edCancel').click(); await sleep(20);
      t('nothing was written', !Object.keys(store()).some(k => k.indexOf('workspaces/') === 0));
    } else if (window.__scn === 'member') {
      t('the company’s workspace, shared, with the count', /Shared with everyone in\s*Acme/.test($('wsSub').textContent) && /4 of 500 items/.test($('wsSub').textContent) && $('wsSample').hidden);
      t('grouped by kind, each with what it’s linked to', document.querySelectorAll('#wsList .group').length === 4 && /1 linked/.test(row('Route planning').textContent));
      t('bands only: the account shows its band, not the figure', /\$250k\+/.test(row('Harbor Plumbing').textContent) && !/380/.test(row('Harbor Plumbing').textContent));
      t('a member has no Settings tab', $('tabSettings').hidden);
      $('wsQ').value = 'harbor'; $('wsQ').dispatchEvent(new Event('input'));
      t('search', document.querySelectorAll('#wsList .ws-row').length === 1); $('wsQ').value = ''; $('wsQ').dispatchEvent(new Event('input'));
      // add a feature, linked to the release and the goal
      $('wsAddType').value = 'feature'; $('wsAdd').click(); await sleep(30);
      t('adding a feature: release and goal pickers, no value fields', !!$('edA') && !$('edB') && $('wsEditor').querySelectorAll('fieldset legend').length === 2 && /Releases it’s linked to/.test($('wsEditor').textContent));
      $('edSave').click(); await sleep(30);
      t('a title is needed', !$('edErr').hidden && /title/.test($('edErr').textContent));
      $('edT').value = 'Route optimisation'; $('edA').value = 'Scheduling'; $('edS').value = 'in_progress';
      $('wsEditor').querySelectorAll('input[name=lk]').forEach(x => { x.checked = true; });
      $('edSave').click(); await until(() => items().length === 5);
      const k = items().find(p => store()[p].title === 'Route optimisation'), d = k && store()[k];
      t('saved for the company, with who and when, and its links', d && d.type === 'feature' && d.createdBy === 'uMem' && d.updatedBy === 'uMem' && d.createdAt && d.updatedAt && d.links.length === 2 && d.status === 'in_progress' && d.area === 'Scheduling', JSON.stringify(d));
      t('only the saved fields are written', d && Object.keys(d).sort().join() === 'area,band,createdAt,createdBy,date,links,note,status,tier,title,type,updatedAt,updatedBy,value,votes');
      t('back on the list, the count moves', !$('wsListView').hidden && /5 of 500/.test($('wsSub').textContent));
      // the goal now shows it as linked from
      row('Grow mid-market').click(); await sleep(30);
      t('a goal lists what links to it', /Linked from/.test($('wsEditor').textContent) && /Feature: Route optimisation/.test($('wsEditor').textContent) && /Release: Summer release/.test($('wsEditor').textContent));
      t('a member cannot delete someone else’s item', !$('edDel'));
      $('edCancel').click(); await sleep(20);
      row('Route planning').click(); await sleep(30);
      $('edV').value = '15'; $('edSave').click(); await until(() => store()['workspaces/orgA/items/idea000001'].votes === 15);
      t('editing saves with the editor as updatedBy, and keeps who added it', store()['workspaces/orgA/items/idea000001'].votes === 15 && store()['workspaces/orgA/items/idea000001'].createdBy === 'uMem');
      row('Route planning').click(); await sleep(30);
      t('their own item can be deleted', !!$('edDel'));
      $('edDel').click(); await until(() => !store()['workspaces/orgA/items/idea000001']);
      t('deleted', !store()['workspaces/orgA/items/idea000001'] && !row('Route planning'));
      $('tabValue').click(); await sleep(30);
      t('value view with no ideas left: says what to add', /No ideas yet/.test($('vvBody').textContent));
      $('tabGoals').click(); await sleep(30);
      t('goal timeline on company data: the new feature, at its release date', /Route optimisation/.test($('gtBody').textContent) && /1 of 1 feature|0 of 1 feature/.test($('gtBody').textContent), $('gtBody').textContent.slice(0, 300));
      // import
      $('tabImport').click();
      $('imText').value = 'Name,Type,Status,ARR,Linked to\nNorthgate,Customer,,$300k,\nBook online,Request,open,,Northgate; Nowhere\n,idea,,,';
      $('imRead').click(); await sleep(30);
      t('import: columns guessed, a preview with what is skipped', /2 to import/.test($('imPrev').textContent) && /1 skipped/.test($('imPrev').textContent) && /row 4 \(no title\)/.test($('imPrev').textContent) && $('imMap').querySelector('[data-map="value"]').value === '3');
      $('imGo').click(); await until(() => items().length === 6);
      const ng = items().map(p => store()[p]).find(x => x.title === 'Northgate'), bo = items().map(p => store()[p]).find(x => x.title === 'Book online');
      t('imported, linked by title', ng && bo && ng.type === 'account' && bo.type === 'idea' && bo.status === 'new' && bo.links.length === 1, JSON.stringify(bo));
      t('bands only: the exact figure is not kept, only its band', ng && ng.value === null && ng.band === 'b4');
      t('the import is said', /Imported 2 items/.test($('imMsg').textContent));
      $('tabValue').click(); await sleep(30);
      t('value view on imported data: bands mode shows an approximate value', /Book online/.test($('vvBody').textContent) && /≈ \$400k a year from 1 account/.test($('vvBody').textContent) && /approximate/.test($('vvBody').textContent), $('vvBody').textContent.slice(0, 200));
      window.__failWrite = /workspaces\/orgA\/items/;
      $('tabItems').click(); $('wsAddType').value = 'goal'; $('wsAdd').click(); await sleep(20);
      $('edT').value = 'Refused'; $('edSave').click(); await sleep(80);
      t('a refused write is said plainly', !$('wsErr').hidden && /no longer be in this company/.test($('wsErr').textContent));
      window.__failWrite = null;
    } else if (window.__scn === 'admin') {
      t('an admin has the Settings tab', !$('tabSettings').hidden);
      t('either mode: the exact figure shows', /\$380k/.test(row('Harbor Plumbing').textContent));
      row('Harbor Plumbing').click(); await sleep(30);
      t('an admin can delete anyone’s item', !!$('edDel'));
      $('edX').value = '45k'; $('edX').dispatchEvent(new Event('input'));
      t('an exact value sets the band to match', $('edB').value === 'b2');
      $('edSave').click(); await until(() => store()['workspaces/orgA/items/acct000001'].value === 45000);
      t('saved', store()['workspaces/orgA/items/acct000001'].band === 'b2' && store()['workspaces/orgA/items/acct000001'].updatedBy === 'uAdm');
      $('tabSettings').click();
      $('setForm').querySelector('input[value="bands"]').checked = true; $('setAreas').value = 'Onboarding\nScheduling\nOnboarding\n';
      $('setForm').requestSubmit(); await until(() => store()['workspaces/orgA'].valueMode === 'bands');
      const s = store()['workspaces/orgA'];
      t('settings saved: value mode, areas de-duplicated', s.valueMode === 'bands' && s.areas.join() === 'Onboarding,Scheduling' && s.updatedBy === 'uAdm' && Object.keys(s).sort().join() === 'areas,updatedAt,updatedBy,valueMode', JSON.stringify(s));
      t('and the list now shows bands', /\$10k–\$50k/.test(row('Harbor Plumbing').textContent));
      row('Harbor Plumbing').click(); await sleep(30);
      t('in bands mode there is no exact-value field', !$('edX') && !!$('edB'));
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
