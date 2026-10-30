// Drives the real my-tools.html (My toolkit) against the fake Firebase, with tests/ui/fake-tool.html standing in for
// the www tools that run inside its workspace.
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const shown = (id) => !$(id).hidden && $(id).offsetParent !== null;
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
async function until(cond, ms = 4000){ const s = Date.now(); while (Date.now() - s < ms){ try { if (cond()) return true; } catch (e) { /* not yet */ } await sleep(30); } return false; }
const cards = () => Array.prototype.slice.call(document.querySelectorAll('#savedList .saved'));
const ids = () => cards().map(c => c.getAttribute('data-id')).join();
const btn = (root, label) => Array.prototype.find.call((root || document).querySelectorAll('button'), b => b.textContent.trim() === label);
const store = () => window.__store;
const mine = () => Object.keys(store()).filter(k => k.indexOf('savedTools/') === 0 && store()[k].uid === (window.__fakeUser && window.__fakeUser.uid));
const frame = () => document.querySelector('#wsFrame iframe');
const tool = () => frame() && frame().contentWindow;
const param = (k) => new URLSearchParams(location.search).get(k);
function setVal(id, v){ const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
function menuItem(root, label){
  const d = root.querySelector('details.menu'); d.open = true;
  return Array.prototype.find.call(d.querySelectorAll('.menu-pop button'), b => b.textContent.trim() === label);
}
window.confirm = () => true;

(async function run(){
  try {
    await until(() => !/Loading/.test($('savedList').textContent) || shown('ws'));
    await sleep(150);

    if (scn === 'handoff'){
      t('the work from the tool is kept, and the address no longer carries it', shown('pendingCard') && /Analytics dashboard/.test(txt('pendingCard')) && /Build, Buy, or Partner/.test(txt('pendingCard')) && location.hash === '');
      t('signed out: it asks to log in or create a free account, on the Create account tab', /Log in or create a free account/.test(txt('pendingTitle')) && shown('authCard') && txt('authSubmit') === 'Create account' && /Build, Buy, or Partner Decision Matrix/.test(txt('authText')));
      t('nothing is saved yet', !Object.keys(store()).some(k => k.indexOf('savedTools/') === 0));
      setVal('authName', 'New Person'); setVal('authEmail', 'new@example.com'); setVal('authPassword', 'secret123'); setVal('authPasswordConfirm', 'secret123'); $('agreeTerms').checked = true;
      $('authSubmit').click();
      await until(() => !!btn($('pendingCard'), 'Save'));
      t('after creating the account it offers Save (nothing saved until they choose)', !!btn($('pendingCard'), 'Save') && !shown('authCard') && !Object.keys(store()).some(k => k.indexOf('savedTools/') === 0));
      btn($('pendingCard'), 'Save').click();
      await until(() => shown('ws') && !!frame());
      const key = Object.keys(store()).filter(k => k.indexOf('savedTools/') === 0)[0], d = key && store()[key], id = key && key.split('/')[1];
      t('Save stores it in their account, with exactly the allowed fields', d && d.uid === 'uCreated' && d.tool === 'bbp' && d.title === 'Analytics dashboard' && d.data === 'eyJ0IjoiQSJ9' && d.createdAt && d.updatedAt && Object.keys(d).sort().join() === 'createdAt,data,summary,title,tool,uid,updatedAt', JSON.stringify(d));
      t('and they stay in Learning: the tool opens in the toolkit\'s workspace with their work', param('open') === id && /\/faketool-build-buy-partner\?embed=1#m=eyJ0IjoiQSJ9$/.test(frame().src) && txt('wsTitle') === 'Analytics dashboard' && /Saved to your toolkit/.test(txt('notice')), frame() && frame().src);
      let kept = null; try { kept = sessionStorage.getItem('pa_pending_save'); } catch (e) {}
      t('the waiting work is cleared from the tab', kept === null);
      $('wsBack').click();
      await until(() => shown('hub') && cards().length === 1);
      t('"My toolkit" goes back to the list, the saved work highlighted', shown('hub') && !shown('ws') && cards()[0].classList.contains('just-saved') && !param('open') && !frame());
    }

    if (scn === 'update'){
      t('back from a public tool opened from here, it offers to update that copy or save a new one', /Update your saved copy/.test(txt('pendingTitle')) && !!btn($('pendingCard'), 'Update my saved copy') && !!btn($('pendingCard'), 'Save as a new copy'));
      btn($('pendingCard'), 'Update my saved copy').click();
      await until(() => store()['savedTools/d1'].data === 'NEWDATA' && shown('ws'));
      const d = store()['savedTools/d1'];
      t('Update replaces its work and title, keeping when it was first saved', d.data === 'NEWDATA' && d.title === 'Roadmap v2' && d.createdAt.toMillis() < Date.now() - 9 * 864e5 && d.updatedAt.toMillis() > Date.now() - 60000);
      t('and no extra copy is made; it opens in the workspace', mine().length === 2 && param('open') === 'd1');
    }

    if (scn === 'list'){
      t('only their own work, most recently edited first', ids() === 'd2,d1');
      t('an untitled one says which tool it is, and when it was edited', /Untitled scorecard/.test(cards()[0].textContent) && /Scorecard/.test(cards()[0].textContent) && /Edited yesterday/.test(cards()[0].textContent) && /Edited 5 days ago/.test(cards()[1].textContent), cards()[0].textContent);
      t('a card opens in the workspace, in Learning (never the public site)', cards()[1].querySelector('h3 a').getAttribute('href') === '/my-tools?open=d1' || /\?open=d1$/.test(cards()[1].querySelector('h3 a').getAttribute('href')));
      t('nothing on the page sends them to productadvisory.co except the footer\'s policies', Array.prototype.every.call(document.querySelectorAll('#hub a[href*="productadvisory.co"]'), a => /terms-of-use|privacy-policy/.test(a.href)));
      const starts = document.querySelectorAll('#startGrid .start');
      t('four tools to start, new or from the example, here', starts.length === 4 && /\?new=scorecard$/.test(starts[0].querySelector('a.new').getAttribute('href')) && /\?new=scorecard&start=example$/.test(starts[0].querySelector('a.ex').getAttribute('href')));
      menuItem(cards()[1], 'Make a copy').click();
      await until(() => cards().length === 3);
      const copyKey = Object.keys(store()).filter(k => /savedTools\/auto/.test(k))[0];
      t('Make a copy saves a second one, named as a copy, with the same work', copyKey && store()[copyKey].title === 'Copy of Roadmap' && store()[copyKey].data === 'OLDDATA' && store()[copyKey].uid === 'uMe');
      const d1 = cards().filter(c => c.getAttribute('data-id') === 'd1')[0];
      menuItem(d1, 'Rename').click(); await sleep(50);
      const input = d1.querySelector('.rename input'); input.value = 'Annual roadmap';
      btn(d1, 'Save').click();
      await until(() => store()['savedTools/d1'].title === 'Annual roadmap');
      t('Rename changes the name and keeps the work and when it was made', store()['savedTools/d1'].title === 'Annual roadmap' && store()['savedTools/d1'].data === 'OLDDATA' && store()['savedTools/d1'].createdAt.toMillis() < Date.now() - 9 * 864e5);
      const d2 = cards().filter(c => c.getAttribute('data-id') === 'd2')[0];
      menuItem(d2, 'Share a copy…').click(); await sleep(50);
      t('Share gives a link to the public tool with a copy of the work, never the saved original', $('shareDlg').open && $('shareUrl').value === 'https://www.productadvisory.co/scorecard#s=SCDATA' && /their own copy/.test(txt('shareDlg')) && /mailto:/.test($('shareEmail').getAttribute('href')));
      $('shareX').click();
      menuItem(cards().filter(c => c.getAttribute('data-id') === 'd2')[0], 'Delete').click();
      await until(() => !store()['savedTools/d2'] && !cards().some(c => c.getAttribute('data-id') === 'd2'));
      t('Delete removes it (after asking)', !store()['savedTools/d2'] && !cards().some(c => c.getAttribute('data-id') === 'd2'));
      t('someone else\'s work is never touched', !!store()['savedTools/x9']);
    }

    if (scn === 'open' || scn === 'legacy'){
      await until(() => shown('ws') && !!frame() && tool().__got);
      t('the saved work opens in the workspace, the tool running inside Learning', shown('ws') && !shown('hub') && txt('wsTitle') === 'Roadmap' && /Organizational Impact Score/.test(txt('wsKind')) && /\/faketool-impact-score\?embed=1#s=OLDDATA$/.test(frame().src), frame() && frame().src);
      if (scn === 'legacy') t('an older ?view= link opens it the same way', param('view') === 'd1');
    }
    if (scn === 'open'){
      await until(() => $('wsLoading').hidden && tool().__got.some(m => m.type === 'pa-title'));
      t('when the tool is ready: the loading shimmer goes, the frame fits the tool, and it gets the saved name', $('wsLoading').hidden && frame().style.height === '1234px' && tool().__got.some(m => m.type === 'pa-title' && m.title === 'Roadmap') && tool().__got.some(m => m.type === 'pa-theme'));
      t('a first-time hint says it saves as you go', shown('wsTip') && /saves to your toolkit automatically/.test(txt('wsTip')));
      $('wsTipX').click();
      t('and goes once dismissed, for good', !shown('wsTip') && localStorage.getItem('pa_ws_tip') === '1');
      const created = store()['savedTools/d1'].createdAt.toMillis();
      tool().__change('NEWDATA', 'Roadmap FY27', '1. Billing (Do now)');
      await sleep(80);
      t('a change shows as saving, and the name follows the tool', $('wsStatus').getAttribute('data-s') === 'saving' && txt('wsTitle') === 'Roadmap FY27');
      await until(() => store()['savedTools/d1'].data === 'NEWDATA');
      await until(() => $('wsStatus').getAttribute('data-s') === 'saved');
      const d = store()['savedTools/d1'];
      t('…then it is saved to their account a moment later, keeping when it was made', d.data === 'NEWDATA' && d.title === 'Roadmap FY27' && d.summary === '1. Billing (Do now)' && d.createdAt.toMillis() === created && /Saved just now/.test(txt('wsStatus')), JSON.stringify(d) + ' ' + txt('wsStatus'));
      tool().__change('<b>bad</b>', 'x', 'y'); await sleep(1300);
      t('anything that is not the tool\'s own encoding is ignored', store()['savedTools/d1'].data === 'NEWDATA');
      // a message from anywhere but the tool's frame is ignored
      window.postMessage({ type: 'pa-tool-change', tool: 'impact', data: 'FORGED', title: 'Forged', summary: '' }, location.origin); await sleep(1300);
      t('messages from anywhere but the tool are ignored', store()['savedTools/d1'].data === 'NEWDATA' && txt('wsTitle') === 'Roadmap FY27');
      $('wsShare').click(); await sleep(30);
      t('Share: a link to a copy, with the latest work', $('shareDlg').open && $('shareUrl').value === 'https://www.productadvisory.co/impact-score#s=NEWDATA' && txt('shareTitle') === 'Roadmap FY27');
      $('shareX').click();
      let got = null; const orig = URL.createObjectURL; URL.createObjectURL = (b) => { got = b; return 'blob:x'; };
      const clickA = HTMLAnchorElement.prototype.click; let name = ''; HTMLAnchorElement.prototype.click = function(){ name = this.getAttribute('download'); };
      $('wsMore').open = true; btn($('wsMenu'), 'Download CSV').click();
      await until(() => !!got);
      URL.createObjectURL = orig; HTMLAnchorElement.prototype.click = clickA;
      t('More › Download CSV gives the tool\'s own export of the latest work', got && got.type.indexOf('text/csv') === 0 && name === 'Roadmap FY27 - Organizational Impact Score.csv', name);
      tool().__change('NEWER', 'Roadmap FY27', '1. Billing (Do now)');
      await sleep(50);
      tool().__open(location.origin + '/faketool-scorecard');
      await until(() => param('new') === 'scorecard' && /faketool-scorecard\?embed=1$/.test(frame().src));
      t('a link to another tool opens it here, after saving what was waiting', param('new') === 'scorecard' && store()['savedTools/d1'].data === 'NEWER' && /Feature Prioritization Scorecard/.test(txt('wsKind')), frame() && frame().src);
      t('a new piece of work isn\'t saved until something changes', mine().length === 2 && /Saves when you start/.test(txt('wsStatus')));
      history.back();
      await until(() => param('open') === 'd1' && shown('ws') && txt('wsTitle') === 'Roadmap FY27');
      t('Back returns to the saved work', param('open') === 'd1' && /#s=NEWER$/.test(frame().src), frame() && frame().src);
      $('wsMore').open = true; btn($('wsMenu'), 'Delete').click();
      await until(() => !store()['savedTools/d1'] && shown('hub'));
      t('More › Delete removes it and goes back to the toolkit', !store()['savedTools/d1'] && shown('hub') && !param('open') && ids() === 'd2');
    }

    if (scn === 'new'){
      await until(() => shown('ws') && !!frame() && tool().__got);
      t('a new piece of work, from the example: the tool opens here with start=example', shown('ws') && /faketool-build-buy-partner\?embed=1&start=example$/.test(frame().src) && txt('wsTitle') === 'Untitled build, buy, or partner' && mine().length === 0, frame() && frame().src);
      tool().__change('EX1', 'Customer analytics (example)', 'Leading: Partner');
      await until(() => mine().length === 1 && /^auto/.test(param('open') || ''));
      const id = param('open');
      t('its first change creates it in their account, and the address becomes its own', store()['savedTools/' + id].data === 'EX1' && store()['savedTools/' + id].tool === 'bbp' && store()['savedTools/' + id].uid === 'uMe');
      tool().__change('EX2', 'Customer analytics', 'Leading: Buy');
      await until(() => store()['savedTools/' + id].data === 'EX2');
      t('later changes update that one (no copies)', mine().length === 1 && store()['savedTools/' + id].title === 'Customer analytics');
      $('wsMore').open = true; btn($('wsMenu'), 'Make a copy').click();
      await until(() => mine().length === 2 && param('open') !== id);
      t('More › Make a copy opens the copy, and says so', store()['savedTools/' + param('open')].title === 'Copy of Customer analytics' && store()['savedTools/' + param('open')].data === 'EX2' && /your copy/.test(txt('notice')));
    }

    if (scn === 'filter'){
      t('with more than two saved, filter, search and order appear', !$('toolbar').hidden && txt('listTitle') === 'Your work (5)');
      const chip = (label) => Array.prototype.find.call(document.querySelectorAll('#chips .chip'), b => b.firstChild.textContent === label);
      t('a filter for each tool they have, with counts', document.querySelectorAll('#chips .chip').length === 5 && /2/.test(chip('Impact score').textContent) && chip('All').getAttribute('aria-pressed') === 'true');
      chip('Impact score').click(); await sleep(20);
      t('filter: just the impact scores', ids() === 'd1,d3' && chip('Impact score').getAttribute('aria-pressed') === 'true');
      chip('All').click(); setVal('searchBox', 'vendor'); await sleep(20);
      t('search: by name or summary', ids() === 'd4');
      setVal('searchBox', 'zzz'); await sleep(20);
      t('search: nothing matches says so', /Nothing matches/.test(txt('savedList')));
      setVal('searchBox', ''); $('sortBox').value = 'name'; $('sortBox').dispatchEvent(new Event('change')); await sleep(20);
      t('order: by name', ids() === 'd3,d1,d5,d2,d4', ids());
      cards()[0].querySelector('h3 a').click();
      await until(() => shown('ws'));
      t('a card opens its work in the workspace', shown('ws') && param('open') === 'd3' && txt('wsTitle') === 'Annual plan');
    }

    if (scn === 'signedout'){
      t('signed out, a link to saved work asks them to log in first', shown('hub') && !shown('ws') && shown('authCard') && /Log in or create a free account/.test(txt('authTitle')) && !frame());
      setVal('authEmail', 'me@example.com'); setVal('authPassword', 'pw');
      $('authSubmit').click();
      await until(() => shown('ws'));
      t('and after logging in, it opens', shown('ws') && txt('wsTitle') === 'Roadmap', txt('errorLine'));
    }

    if (scn === 'empty') t('nothing saved: it says how to start', /Nothing here yet/.test(txt('savedList')) && $('pendingCard').hidden && document.querySelectorAll('#startGrid .start').length === 4);
    if (scn === 'bad') t('a # that is not a handoff is ignored', $('pendingCard').hidden);
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
})();
