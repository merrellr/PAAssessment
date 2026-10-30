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
      const back = $('notice').querySelector('a');
      t('it says so, with a link back to the tool that remembers this copy', back && back.getAttribute('href') === 'https://www.productadvisory.co/build-buy-partner#m=eyJ0IjoiQSJ9&doc=' + key.split('/')[1], back && back.getAttribute('href'));
      t('the saved tool is listed and highlighted, and the waiting card is gone', cards()[0].classList.contains('just-saved') && !vis('pendingCard'));
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
      t('Open goes back to the tool with the work and this copy\'s id', cards()[1].querySelector('a.btn-link').getAttribute('href') === 'https://www.productadvisory.co/impact-score#s=OLDDATA&doc=d1');
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
    if (scn === 'empty') t('nothing saved: it says how to save one', /Nothing saved yet/.test(txt('savedList')) && !vis('pendingCard'));
    if (scn === 'bad') t('a # that is not a handoff is ignored', !vis('pendingCard'));
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
})();
