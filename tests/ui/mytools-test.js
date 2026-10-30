// Drives the real my-tools.html (My saved tools) against the fake Firebase.
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const vis = (id) => $(id).style.display !== 'none';
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
async function until(cond, ms = 3000){ const s = Date.now(); while (Date.now() - s < ms){ if (cond()) return true; await sleep(30); } return false; }
const cards = () => Array.prototype.slice.call(document.querySelectorAll('#savedList .saved'));
const btn = (root, label) => Array.prototype.find.call((root || document).querySelectorAll('button'), b => b.textContent.trim() === label);
const store = () => window.__store;
function setVal(id, v){ const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
window.confirm = () => true;

(async function run(){
  try {
    await until(() => !/Loading/.test($('savedList').textContent));
    await sleep(150);
    if (scn === 'handoff'){
      t('the work from the tool is kept, and the address no longer carries it', vis('pendingCard') && /Analytics dashboard/.test(txt('pendingCard')) && /Build, Buy, or Partner/.test(txt('pendingCard')) && location.hash === '');
      t('signed out: it asks to log in or create a free account, on the Create account tab', /Log in or create a free account/.test(txt('pendingTitle')) && vis('authCard') && txt('authSubmit') === 'Create account' && /Build, Buy, or Partner Decision Matrix/.test(txt('authText')));
      t('nothing is saved yet', !Object.keys(store()).some(k => k.indexOf('savedTools/') === 0));
      setVal('authName', 'New Person'); setVal('authEmail', 'new@example.com'); setVal('authPassword', 'secret123'); setVal('authPasswordConfirm', 'secret123'); $('agreeTerms').checked = true;
      $('authSubmit').click();
      await until(() => !!btn($('pendingCard'), 'Save'));
      t('after creating the account it offers Save (nothing saved until they choose)', !!btn($('pendingCard'), 'Save') && !vis('authCard') && !Object.keys(store()).some(k => k.indexOf('savedTools/') === 0));
      btn($('pendingCard'), 'Save').click();
      await until(() => cards().length === 1);
      const key = Object.keys(store()).filter(k => k.indexOf('savedTools/') === 0)[0], d = key && store()[key];
      t('Save stores it in their account, with exactly the allowed fields', d && d.uid === 'uCreated' && d.tool === 'bbp' && d.title === 'Analytics dashboard' && d.data === 'eyJ0IjoiQSJ9' && d.createdAt && d.updatedAt && Object.keys(d).sort().join() === 'createdAt,data,summary,title,tool,uid,updatedAt', JSON.stringify(d));
      const id = key.split('/')[1];
      await until(() => vis('detail'));
      t('after saving they stay in Learning, on the saved tool', vis('detail') && !vis('layout') && new URLSearchParams(location.search).get('view') === id && /Saved to your account/.test(txt('notice')) && txt('detailTitle') === 'Analytics dashboard', location.search + ' ' + txt('notice'));
      const edit = Array.prototype.find.call($('detailActs').querySelectorAll('a'), a => /Edit in the tool/.test(a.textContent));
      t('"Edit in the tool" goes back to the tool, remembering this copy', edit && edit.getAttribute('href') === 'https://www.productadvisory.co/build-buy-partner#m=eyJ0IjoiQSJ9&doc=' + id, edit && edit.getAttribute('href'));
      await until(() => /can't be shown here/.test(txt('detailBody')));
      t('when a tool\'s results cannot be drawn here, it says so and links to the tool', /can't be shown here/.test(txt('detailBody')) && !!$('detailBody').querySelector('a[href^="https://www.productadvisory.co/build-buy-partner"]'), txt('detailBody'));
      $('detailBack').click(); await until(() => !vis('detail'));
      t('"All my saved tools" goes back to the list (staying on this page), with the saved tool highlighted and the waiting card gone', !vis('detail') && cards().length === 1 && cards()[0].classList.contains('just-saved') && !vis('pendingCard') && !location.search.includes('view='));
      let kept = null; try { kept = sessionStorage.getItem('pa_pending_save'); } catch (e) {}
      t('the waiting work is cleared from the tab', kept === null);
    }
    if (scn === 'update'){
      t('back from a tool opened here, it offers to update that copy or save a new one', /Update your saved copy/.test(txt('pendingTitle')) && !!btn($('pendingCard'), 'Update my saved copy') && !!btn($('pendingCard'), 'Save as a new copy'));
      btn($('pendingCard'), 'Update my saved copy').click();
      await until(() => store()['savedTools/d1'].data === 'NEWDATA');
      const d = store()['savedTools/d1'];
      t('Update replaces its work and title, keeping when it was first saved', d.data === 'NEWDATA' && d.title === 'Roadmap v2' && d.createdAt.toMillis() < Date.now() - 9 * 864e5 && d.updatedAt.toMillis() > Date.now() - 60000);
      t('and no extra copy is made', Object.keys(store()).filter(k => k.indexOf('savedTools/') === 0 && store()[k].uid === 'uMe').length === 2);
    }
    if (scn === 'list'){
      t('only their own saved tools, newest first', cards().map(c => c.getAttribute('data-id')).join() === 'd2,d1');
      t('an untitled one says which tool it is', /Untitled scorecard/.test(cards()[0].textContent) && /Feature Prioritization Scorecard/.test(cards()[0].textContent));
      t('View opens it here, in Learning', /\?view=d1$/.test(cards()[1].querySelector('a.btn-link').getAttribute('href')) && cards()[1].querySelector('a.btn-link').textContent === 'View');
      t('Edit in the tool goes back to the tool with the work and this copy\'s id', cards()[1].querySelector('a.btn-out').getAttribute('href') === 'https://www.productadvisory.co/impact-score#s=OLDDATA&doc=d1');
      t('with two saved, no filter bar yet', !vis('toolbar'));
      btn(cards()[1], 'Make a copy').click();
      await until(() => cards().length === 3);
      const copyKey = Object.keys(store()).filter(k => /savedTools\/auto/.test(k))[0];
      t('Make a copy saves a second one, named as a copy, with the same work', copyKey && store()[copyKey].title === 'Copy of Roadmap' && store()[copyKey].data === 'OLDDATA' && store()[copyKey].uid === 'uMe');
      const d1 = cards().filter(c => c.getAttribute('data-id') === 'd1')[0];
      btn(d1, 'Rename').click(); await sleep(50);
      const input = d1.querySelector('.rename input'); input.value = 'Annual roadmap';
      btn(d1, 'Save').click();
      await until(() => store()['savedTools/d1'].title === 'Annual roadmap');
      t('Rename changes the name and keeps the work', store()['savedTools/d1'].title === 'Annual roadmap' && store()['savedTools/d1'].data === 'OLDDATA');
      const d2 = cards().filter(c => c.getAttribute('data-id') === 'd2')[0];
      Array.prototype.find.call(d2.querySelectorAll('button'), b => /^Delete/.test(b.textContent)).click();
      await until(() => !store()['savedTools/d2'] && !cards().some(c => c.getAttribute('data-id') === 'd2'));
      t('Delete removes it (after asking)', !store()['savedTools/d2'] && !cards().some(c => c.getAttribute('data-id') === 'd2'), Object.keys(store()).filter(k => /savedTools/.test(k)).join() + ' / cards: ' + cards().map(c => c.getAttribute('data-id')).join());
      t('someone else\'s saved tool is never touched', !!store()['savedTools/x9']);
      t('each tool can be started from here', document.querySelectorAll('#newTools a').length === 4);
    }
    if (scn === 'view'){
      await until(() => !!$('detailBody').querySelector('table'));
      t('opened here: the name, tool, date and summary', vis('detail') && !vis('layout') && txt('detailTitle') === 'Roadmap' && txt('detailTool') === 'Organizational Impact Score' && /^Saved /.test(txt('detailWhen')) && /SSO/.test(txt('detailSummary')));
      const table = $('detailBody').querySelector('table');
      t('the results, drawn by the tool\'s own scoring file, as a table', table && table.querySelectorAll('th').length === 3 && /SSO and audit logs/.test(table.textContent) && /Onboarding, self-serve/.test(table.textContent), table && table.textContent);
      t('numbers line up on the right, and guarded cells show as typed', table.querySelector('td.num') && Array.prototype.some.call(table.querySelectorAll('td'), td => td.textContent === '-5'));
      t('label and value lines are shown as a list; the export\'s own title line is not repeated', /About/.test(txt('detailBody')) && /Note/.test(txt('detailBody')) && !!$('detailBody').querySelector('dl.pairs dd') && !/Organizational Impact Score/.test(txt('detailBody')), txt('detailBody'));
      const dl = btn($('detailActs'), 'Download CSV');
      let got = null; const orig = URL.createObjectURL; URL.createObjectURL = (b) => { got = b; return 'blob:x'; };
      const clickA = HTMLAnchorElement.prototype.click; let name = ''; HTMLAnchorElement.prototype.click = function(){ name = this.getAttribute('download'); };
      dl.click();
      URL.createObjectURL = orig; HTMLAnchorElement.prototype.click = clickA;
      t('Download CSV gives the tool\'s own export, named after it', !dl.disabled && got && got.type.indexOf('text/csv') === 0 && name === 'Roadmap - Organizational Impact Score.csv', name);
      btn($('detailActs'), 'Rename').click(); await sleep(30);
      $('detailTitle').querySelector('input').value = 'Roadmap FY27';
      btn($('detailTitle'), 'Save').click();
      await until(() => store()['savedTools/d1'].title === 'Roadmap FY27' && txt('detailTitle') === 'Roadmap FY27');
      t('Rename here changes the name and keeps the work', store()['savedTools/d1'].title === 'Roadmap FY27' && store()['savedTools/d1'].data === 'OLDDATA' && txt('detailTitle') === 'Roadmap FY27');
      btn($('detailActs'), 'Make a copy').click();
      await until(() => /view=auto/.test(location.search));
      const copyId = new URLSearchParams(location.search).get('view');
      await until(() => txt('detailTitle') === 'Copy of Roadmap FY27');
      t('Make a copy opens the copy', store()['savedTools/' + copyId] && store()['savedTools/' + copyId].data === 'OLDDATA' && txt('detailTitle') === 'Copy of Roadmap FY27', txt('detailTitle'));
      Array.prototype.find.call($('detailActs').querySelectorAll('button'), b => /^Delete/.test(b.textContent)).click();
      await until(() => !store()['savedTools/' + copyId] && !vis('detail'));
      t('Delete removes it and goes back to the list', !store()['savedTools/' + copyId] && !vis('detail') && vis('layout') && !new URLSearchParams(location.search).get('view') && cards().length === 2);
      history.pushState(null, '', location.pathname + '?scn=view&view=x9'); dispatchEvent(new PopStateEvent('popstate')); await sleep(50);
      t('someone else\'s (or a deleted) saved tool is "not found"', vis('detail') && txt('detailTitle') === 'Not found' && !/Not mine/.test(document.body.textContent));
    }
    if (scn === 'filter'){
      t('with more than two saved, filter, search and order appear', vis('toolbar') && txt('listTitle') === 'Saved (5)');
      const chip = (label) => Array.prototype.find.call(document.querySelectorAll('#chips .chip'), b => b.firstChild.textContent === label);
      t('a filter for each tool they have, with counts', document.querySelectorAll('#chips .chip').length === 5 && /2/.test(chip('Impact score').textContent) && chip('All').getAttribute('aria-pressed') === 'true');
      chip('Impact score').click(); await sleep(20);
      t('filter: just the impact scores', cards().map(c => c.getAttribute('data-id')).join() === 'd1,d3' && chip('Impact score').getAttribute('aria-pressed') === 'true');
      chip('All').click(); setVal('searchBox', 'vendor'); await sleep(20);
      t('search: by name or summary', cards().map(c => c.getAttribute('data-id')).join() === 'd4');
      setVal('searchBox', 'zzz'); await sleep(20);
      t('search: nothing matches says so', /Nothing matches/.test(txt('savedList')));
      setVal('searchBox', ''); $('sortBox').value = 'name'; $('sortBox').dispatchEvent(new Event('change')); await sleep(20);
      t('order: by name', cards().map(c => c.getAttribute('data-id')).join() === 'd3,d1,d5,d2,d4', cards().map(c => c.getAttribute('data-id')).join());
      cards()[0].querySelector('h3 a').click(); await sleep(30);
      t('a name opens it here', vis('detail') && txt('detailTitle') === 'Annual plan');
    }
    if (scn === 'empty') t('nothing saved: it says how to save one', /Nothing saved yet/.test(txt('savedList')) && !vis('pendingCard'));
    if (scn === 'bad') t('a # that is not a handoff is ignored', !vis('pendingCard'));
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
})();
