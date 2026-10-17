// Drives the real owner-tools.html (the owner's tool roadmap admin) against the fake Firebase.
import { Timestamp } from './fake-firebase.js';
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const vis = (id) => $(id).style.display !== 'none';
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
const textOf = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
function setVal(id, v){ const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
async function until(cond, ms = 3000){ const s = Date.now(); while (Date.now() - s < ms){ if (cond()) return true; await sleep(30); } return false; }
const store = () => window.__store;
const toolRow = (id) => $('toolsWrap').querySelector('tr[data-tool="' + id + '"]');
const btn = (row, label) => row && Array.prototype.find.call(row.querySelectorAll('button'), b => b.textContent.trim().indexOf(label) === 0);
const toolKeys = () => Object.keys(store()).filter(k => /^tools\//.test(k));
let confirmAnswer = true;
window.confirm = () => confirmAnswer;
const downloads = [];
const realCreate = URL.createObjectURL.bind(URL);
URL.createObjectURL = (blob) => { downloads.push(blob); return realCreate(blob); };
HTMLAnchorElement.prototype.click = function(){ /* captured above; do not navigate */ };

function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
}

(async function run(){
  try {
    await until(() => vis('page') || vis('stateNotOwner') || vis('stateSignedOut'));
    await sleep(250);

    if (scn === 'signedout'){
      t('a signed-out visitor is asked to sign in', vis('stateSignedOut') && !vis('page'));
    } else if (scn === 'notowner'){
      t('anyone but the owner is turned away and sees nothing', vis('stateNotOwner') && !vis('page'));
    } else if (scn === 'empty'){
      t('with no tools yet, the page offers the ten starting tools', vis('page') && /Add the 10 starting tools/.test($('starterBtn').textContent) && /No tools yet/.test(txt('toolsWrap')));
    } else {
      t('the owner sees the page', vis('page'));
      const tiles = Array.prototype.map.call($('tiles').querySelectorAll('.tile'), x => textOf(x));
      t('the numbers at the top: 3 tools, 5 votes, 4 people, 3 asked for a launch email, 2 suggestions to review',
        tiles.length === 5 && /^3\s*Tools/.test(tiles[0]) && /^5\s*Votes cast/.test(tiles[1]) && /^4\s*People who voted/.test(tiles[2]) && /^3\s*Asked/.test(tiles[3]) && /^2\s*Suggestions/.test(tiles[4]), tiles.join(' | '));
      t('tools are listed with status and vote totals', /Alpha Scorecard/.test(textOf(toolRow('tA'))) && /Planned/.test(textOf(toolRow('tA'))) && /Released/.test(textOf(toolRow('tC'))));
      t('a count that matches the recorded votes is ticked; one that does not says what was recorded', /✓/.test(textOf(toolRow('tA'))) && /counted 3/.test(textOf(toolRow('tB'))), textOf(toolRow('tB')));

      /* the starting tools */
      t('the starting-tools button offers all ten', /Add the missing starting tools \(10\)/.test($('starterBtn').textContent), $('starterBtn').textContent);
      window.__writeLog.length = 0;
      $('starterBtn').click(); await until(() => toolKeys().length === 13); await sleep(100);
      const starter = store()['tools/feature-prioritization-scorecard'];
      t('ten tools are added, each starting at zero votes, with the right status and order', toolKeys().length === 13 && !!starter && starter.voteCount === 0 && starter.status === 'planned' && starter.order === 0 && store()['tools/okr-builder'].status === 'considering' && store()['tools/okr-builder'].order === 90, JSON.stringify(starter));
      t('they were saved in one step, and the button is gone', window.__writeLog.filter(w => w.op === 'set').length === 10 && !vis('starterBtn'));

      /* adding a tool by hand */
      $('addToolBtn').click(); await sleep(50);
      $('saveToolBtn').click(); await sleep(50);
      t('a tool needs a name', /Enter a name/.test(txt('fTitleError')), txt('fTitleError'));
      setVal('fTitle', 'Stakeholder Map'); setVal('fStatus', 'released');
      $('saveToolBtn').click(); await sleep(50);
      t('a released tool needs its link', /Add the link/.test(txt('fLaunchUrlError')), txt('fLaunchUrlError'));
      setVal('fStatus', 'considering'); setVal('fCategory', 'Stakeholders'); setVal('fDescription', 'A second map');
      $('saveToolBtn').click(); await until(() => !!store()['tools/stakeholder-map-2']); await sleep(80);
      const added = store()['tools/stakeholder-map-2'];
      t('a name that already exists gets its own id (stakeholder-map-2), with zero votes and server times', !!added && added.voteCount === 0 && added.title === 'Stakeholder Map' && added.category === 'Stakeholders' && typeof added.createdAt.toMillis === 'function', JSON.stringify(added));
      t('the form closes and the page confirms', !vis('toolForm') && /Added Stakeholder Map/.test(txt('notice')), txt('notice'));

      /* editing */
      btn(toolRow('stakeholder-map-2'), 'Edit').click(); await sleep(60);
      t('Edit opens the form filled in', vis('toolForm') && $('fTitle').value === 'Stakeholder Map' && $('fStatus').value === 'considering');
      setVal('fStatus', 'released'); setVal('fLaunchUrl', 'http://insecure.example.com');
      $('saveToolBtn').click(); await sleep(50);
      t('a launch link must be https', /https/.test(txt('fLaunchUrlError')), txt('fLaunchUrlError'));
      setVal('fLaunchUrl', 'https://example.com/stakeholder-map');
      $('saveToolBtn').click(); await sleep(150);
      t('releasing a tool saves its link and keeps its votes', store()['tools/stakeholder-map-2'].status === 'released' && store()['tools/stakeholder-map-2'].launchUrl === 'https://example.com/stakeholder-map' && store()['tools/stakeholder-map-2'].voteCount === 0);
      btn(toolRow('stakeholder-map-2'), 'Edit').click(); await sleep(60);
      setVal('fStatus', 'planned'); setVal('fLaunchUrl', '');
      $('saveToolBtn').click(); await sleep(150);
      t('taking the link away clears it', store()['tools/stakeholder-map-2'].status === 'planned' && store()['tools/stakeholder-map-2'].launchUrl === '');
      btn(toolRow('tA'), 'Edit').click(); await sleep(60);
      $('saveToolBtn').click(); await sleep(150);
      t('saving an edit never changes the vote count', store()['tools/tA'].voteCount === 2);

      /* recounting */
      $('recountBtn').click(); await sleep(400);
      t('Recount corrects only the wrong count to the votes actually recorded', store()['tools/tB'].voteCount === 3 && store()['tools/tA'].voteCount === 2 && /Corrected 1 count: Beta Map/.test(txt('notice')), txt('notice'));
      $('recountBtn').click(); await sleep(300);
      t('and says so when everything already matches', /Every count matches/.test(txt('notice')), txt('notice'));

      /* suggestions */
      const sugRows = Array.prototype.slice.call($('suggestionsWrap').querySelectorAll('tbody tr'));
      t('only pending suggestions are listed, with who sent them', sugRows.length === 2 && /s1@x\.com/.test(textOf(sugRows[0]) + textOf(sugRows[1])) && !/Already handled/.test($('suggestionsWrap').textContent));
      const s2row = $('suggestionsWrap').querySelector('tr[data-suggestion="s2"]');
      btn(s2row, 'Reject').click(); await sleep(250);
      t('rejecting marks it rejected with a review time, and it leaves the list', store()['toolSuggestions/s2'].status === 'rejected' && typeof store()['toolSuggestions/s2'].reviewedAt.toMillis === 'function' && !$('suggestionsWrap').querySelector('tr[data-suggestion="s2"]'));
      const s1row = $('suggestionsWrap').querySelector('tr[data-suggestion="s1"]');
      btn(s1row, 'Approve').click(); await sleep(80);
      t('approving opens the form with the idea filled in', vis('toolForm') && $('fTitle').value === 'Pricing worksheet for B2B products' && /Add the suggested tool/.test(txt('formTitle')), $('fTitle').value);
      setVal('fTitle', 'Pricing Worksheet'); setVal('fCategory', 'Strategy');
      $('saveToolBtn').click(); await until(() => !!store()['tools/pricing-worksheet']); await sleep(120);
      t('saving adds the tool and marks the suggestion approved, together', !!store()['tools/pricing-worksheet'] && store()['toolSuggestions/s1'].status === 'approved' && /marked the suggestion approved/.test(txt('notice')), txt('notice'));
      t('the suggestions list is now empty', /Nothing waiting/.test(txt('suggestionsWrap')));

      /* launch emails */
      const nrows = Array.prototype.slice.call($('notifyWrap').querySelectorAll('tbody tr'));
      t('launch-email lists are shown per tool with how many people', nrows.length === 2 && /Alpha Scorecard.*1/.test(textOf(nrows[0]) + textOf(nrows[1])) && /Beta Map.*2/.test(textOf(nrows[0]) + textOf(nrows[1])), nrows.map(textOf).join(' | '));
      btn($('notifyWrap').querySelector('tr[data-notify="tB"]'), 'Copy emails').click(); await until(() => /Copied/.test($('notice').textContent), 2500);
      t('copying says how many addresses were copied, for which tool', /Copied 2 addresses for Beta Map/.test(txt('notice')), txt('notice'));
      $('csvBtn').click(); await sleep(150);
      const csv = downloads.length ? await downloads[downloads.length - 1].text() : '';
      t('the CSV lists tool, status and email for everyone who asked', csv.split('\r\n')[0] === 'Tool,Status,Email' && /Beta Map,Under consideration,a@x\.com/.test(csv) && /Beta Map,Under consideration,c@x\.com/.test(csv) && /Alpha Scorecard,Planned,a@x\.com/.test(csv) && !/b@x\.com|d@x\.com/.test(csv), csv);

      /* deleting */
      confirmAnswer = false;
      btn(toolRow('tC'), 'Delete').click(); await sleep(80);
      t('saying no to the delete prompt keeps the tool', !!store()['tools/tC'] && !!toolRow('tC'));
      confirmAnswer = true;
      btn(toolRow('tC'), 'Delete').click(); await sleep(250);
      t('saying yes deletes it', !store()['tools/tC'] && !toolRow('tC') && /Deleted Gamma Released/.test(txt('notice')), txt('notice'));
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  done();
})();
