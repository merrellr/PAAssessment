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
    } else if (scn === 'launch'){
      const row = (id) => $('notifyWrap').querySelector('tr[data-notify="' + id + '"]');
      const sendBtn = (id) => $('notifyWrap').querySelector('button[data-send="' + id + '"]');
      const prevBtn = (id) => $('notifyWrap').querySelector('button[data-preview="' + id + '"]');
      const calls = [];
      let mode = 'ok';
      const srcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      Object.defineProperty(HTMLScriptElement.prototype, 'src', { configurable: true, get(){ return srcDesc.get.call(this); }, set(v){
        if (String(v).indexOf('script.google.com') === -1) { srcDesc.set.call(this, v); return; }
        const p = Object.fromEntries(new URL(v).searchParams);
        calls.push(p);
        setTimeout(() => {
          const cb = window[p.callback]; if (!cb) return;
          if (mode === 'down') return cb(null);
          if (mode === 'old') return cb({ totalCompletions: 3 });
          if (p.preview === '1') return cb({ ok: true, preview: true, to: 'rob@owner.com', people: 2 });
          if (mode === 'ok') return cb({ ok: true, sent: 2, alreadySent: 0, remaining: 0, people: 2 });
          if (mode === 'rest') return cb({ ok: true, sent: 1, alreadySent: 2, remaining: 4, people: 7 });
          if (mode === 'none') return cb({ ok: true, sent: 0, alreadySent: 2, remaining: 0, people: 2 });
          if (mode === 'partial') return cb({ ok: true, error: 'partial', sent: 1, remaining: 1, people: 2, detail: 'mail down' });
          cb({ ok: false, error: mode });
        }, 15);
      } });
      const messages = [];
      window.confirm = (m) => { messages.push(m); return confirmAnswer; };

      t('the launch list shows the tools that have people waiting', !!row('tC') && !!row('tD') && !!row('tA'));
      t('a released tool with its launch link can be sent, and a preview sent to the owner', !!sendBtn('tC') && !sendBtn('tC').disabled && !prevBtn('tC').disabled);
      t('a released tool with no launch link yet cannot, and says why', sendBtn('tD').disabled && /Add the launch link first/.test(sendBtn('tD').title) && prevBtn('tD').disabled);
      t('a tool that is not released cannot, and says why', sendBtn('tA').disabled && /Released first/.test(sendBtn('tA').title));
      t('the hint explains the emails, the preview and the daily limit', /Send launch emails/.test(document.body.textContent) && /Toolkit Notification/.test(document.body.textContent) && /about 100 emails a day/.test(document.body.textContent));

      prevBtn('tC').click(); await until(() => /preview of/.test(txt('notice')), 2500);
      t('"Send me a preview" asks the server for a preview of that tool, as the owner, and reports where it went', calls.length === 1 && calls[0].action === 'toolLaunch' && calls[0].tool === 'tC' && calls[0].preview === '1' && calls[0].idToken === 'tok' && /A preview of "Gamma Released" was sent to rob@owner\.com/.test(txt('notice')), txt('notice') + ' ' + JSON.stringify(calls[0]));
      t('a preview does not ask for confirmation', messages.length === 0);

      confirmAnswer = false;
      sendBtn('tC').click(); await sleep(60);
      t('"Send launch emails" asks first, naming the tool and how many people; "Cancel" sends nothing', messages.length === 1 && /Gamma Released/.test(messages[0]) && /2 people/.test(messages[0]) && /already emailed.*skipped/.test(messages[0]) && calls.length === 1);
      confirmAnswer = true;
      sendBtn('tC').click(); await sleep(5);
      t('while sending, every send button is switched off, so it cannot be pressed twice', Array.prototype.every.call($('notifyWrap').querySelectorAll('button[data-send], button[data-preview]'), b => b.disabled) && /Sending/.test(txt('notice')));
      await until(() => /Sent to/.test(txt('notice')), 2500);
      const send = calls[calls.length - 1];
      t('confirming sends it, with no preview flag', send.action === 'toolLaunch' && send.tool === 'tC' && (send.preview === '' || send.preview === undefined) && send.idToken === 'tok');
      t('the result is reported in plain words', /^Sent to 2 people\.$/.test(txt('notice')), txt('notice'));
      t('and the buttons come back', !sendBtn('tC').disabled);

      mode = 'rest'; sendBtn('tC').click(); await until(() => /still to send/.test(txt('notice')), 2500);
      t('a long list says how many were already emailed and how many are left for tomorrow', /Sent to 1 person\. 2 people were already emailed before\. 4 still to send: press the button again tomorrow\./.test(txt('notice')), txt('notice'));
      mode = 'none'; sendBtn('tC').click(); await until(() => /Nobody new/.test(txt('notice')), 2500);
      t('pressing it again when everyone has had it says nobody new', /Nobody new to email\. 2 people were already emailed before\./.test(txt('notice')), txt('notice'));
      mode = 'partial'; sendBtn('tC').click(); await until(() => /Sent to 1 person/.test(txt('notice')), 2500);
      t('if Gmail stops part-way, it says what was sent and to press again later', /Sent to 1 person/.test(txt('notice')) && /press the button again later/.test(txt('errorLine')), txt('notice') + ' / ' + txt('errorLine'));
      for (const [m, re] of [['quota', /daily limit has been reached/], ['not_released', /Mark the tool as Released first/], ['no_link', /launch link/], ['not_owner', /isn't the platform owner/], ['votes_unreadable', /security rules/], ['mail_error', /Nothing was recorded/], ['old', /Paste the latest Apps Script/], ['down', /couldn't reach the email service/]]) {
        mode = m; sendBtn('tC').click(); await sleep(5); await until(() => !sendBtn('tC').disabled, 2500); await sleep(30);
        t('error "' + m + '" is explained plainly', re.test(txt('errorLine')), txt('errorLine'));
      }
      t('the copy-emails fallback is still there', !!btn(row('tC'), 'Copy emails'));
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
