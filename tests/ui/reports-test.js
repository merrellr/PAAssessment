// Drives the real reports.html (the owner's Reports page) against the fake Firebase and a fake server.
import { Timestamp } from './fake-firebase.js';
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
const textOf = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
async function until(cond, ms = 4000){ const s = Date.now(); while (Date.now() - s < ms){ if (cond()) return true; await sleep(30); } return false; }
const shown = () => ['stateLoading', 'stateSignedOut', 'stateNotOwner', 'page'].filter(id => !$(id).hidden).join(',');
const q = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
const downloads = [];
const realCreate = URL.createObjectURL.bind(URL);
URL.createObjectURL = (blob) => { downloads.push(blob); return realCreate(blob); };
HTMLAnchorElement.prototype.click = function(){ /* captured above */ };

function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
}

(async function run(){
  try {
    await until(() => shown() !== 'stateLoading', 4000);
    await sleep(300);

    if (scn === 'signedout'){ t('a signed-out visitor is asked to sign in', shown() === 'stateSignedOut'); }
    else if (scn === 'notowner'){ t('anyone but the owner is turned away and sees no numbers', shown() === 'stateNotOwner' && q('.tile').length === 0); }
    else if (scn === 'oldscript'){
      t('if the Apps Script has not been updated, the page says exactly what to do', shown() === 'page' && /isn't switched on yet.*latest Apps Script \(v6\).*new version/.test(txt('errorLine')), txt('errorLine'));
      t('and shows no made-up numbers', q('.tile').length === 0);
    }
    else if (scn === 'unreachable'){ t('if the server cannot be reached, it says so plainly', /couldn't reach the reports service/.test(txt('errorLine')), txt('errorLine')); }
    else if (scn === 'serverrefuses'){ t('if the server refuses, the reason is shown', /isn't the platform owner/.test(txt('errorLine')), txt('errorLine')); }
    else {
      t('the owner sees the page', shown() === 'page');
      t('the Profile menu is there, top right, with the owner links', !!$('paAccountBtn') && !!document.querySelector('#paAccountMenu a[href="/reports"]') && !!document.querySelector('#paAccountMenu a[href="/owner"]'));
      t('it asked the server for 30 days, with the owner\'s sign-in token', window.__calls[0].action === 'reports' && window.__calls[0].days === '30' && window.__calls[0].idToken === 'tok', JSON.stringify(window.__calls[0]));
      t('the 30-day button is pressed and the Overview tab is open', document.querySelector('.period-btn[data-days="30"]').getAttribute('aria-pressed') === 'true' && $('tab-overview').getAttribute('aria-selected') === 'true' && !$('panel-overview').hidden && $('panel-funnel').hidden && $('panel-leads').hidden);
      t('it says how the periods are compared', /last 30 days compared with the 30 before/.test(txt('generated')), txt('generated'));

      /* ---- overview ---- */
      const sum = q('#summaryList .insight');
      t('"What stands out" lists the top items, problems first, with a label on each', sum.length === 3 && /Watch/.test(textOf(sum[0])) && /Good news/.test(textOf(sum[2])) && sum[0].classList.contains('sev-watch'), sum.map(textOf).join(' | '));
      const tiles = q('#kpiTiles .tile');
      t('six headline tiles', tiles.length === 6);
      t('each shows the number, the label, the change and what it is compared with', /12/.test(textOf(tiles[0])) && /Assessments completed/.test(textOf(tiles[0])) && /▲ \+140%/.test(textOf(tiles[0])) && /vs 5 before/.test(textOf(tiles[0])), textOf(tiles[0]));
      t('a fall is shown as down and in the warning colour', /▼ −33%/.test(textOf(tiles[2])) && !!tiles[2].querySelector('.delta.down'), textOf(tiles[2]));
      t('a first-ever number is "new this period", not an infinite percentage', /new this period/.test(textOf(tiles[3])));
      t('the tile hint explains what "Active learners" means', /opened their dashboard/.test(tiles[5].getAttribute('title')));
      const svg = $('chartActivity').querySelector('svg');
      t('the activity chart is drawn with three lines and a legend', !!svg && svg.querySelectorAll('polyline').length === 3 && q('#chartActivity .legend-item').length === 3, String(svg && svg.querySelectorAll('polyline').length));
      t('and has a text description for screen readers, with the totals', svg.getAttribute('role') === 'img' && /Assessments completed: \d+/.test(svg.getAttribute('aria-label')));
      t('the level mix bars list each level with its count', q('#chartTiers .bar-row').length === 2 && /Moderate Experience/.test(txt('chartTiers')) && /8/.test(textOf(q('#chartTiers .bar-val')[0])));
      const skills = q('#chartSkills .bar-row');
      t('seven skill areas with their averages as percentages; an area with no scores shows a dash', skills.length === 7 && /70%/.test(textOf(skills[4])) && /—/.test(textOf(skills[6])), skills.map(textOf).join(' | '));
      t('insights sit under the charts, with the thin-data notice kept out of the headline list', q('#insightsOverview .insight').length === 3 && q('#insightsSkills .insight').length === 1 && !/Too few/.test(txt('summaryList')));

      /* ---- AI ---- */
      $('aiBtnOverview').click(); await sleep(3);
      t('while the AI works, the button says so and cannot be pressed twice', $('aiBtnOverview').disabled && /Thinking/.test($('aiBtnOverview').textContent));
      await until(() => !$('aiBtnOverview').disabled);
      t('the explanation appears with a note that it came from anonymous totals', /What it shows: Requests are up/.test(txt('aiOutOverview')) && /anonymous totals only/.test(txt('aiOutOverview')), txt('aiOutOverview'));
      const aiCall = window.__calls.filter(c => c.action === 'reportsAi')[0];
      t('the request names only the section and period (the server works out the numbers itself)', aiCall.section === 'overview' && aiCall.days === '30' && Object.keys(aiCall).sort().join() === 'action,callback,days,idToken,section', Object.keys(aiCall).join());
      window.__aiMode = 'no_key'; $('aiBtnOverview').click(); await until(() => !$('aiBtnOverview').disabled); await sleep(60);
      t('with no AI key set, it says so in plain words and the insights remain', /not switched on yet/.test(txt('aiOutOverview')) && q('#insightsOverview .insight').length === 3, txt('aiOutOverview'));
      window.__aiMode = 'daily_limit'; $('aiBtnOverview').click(); await until(() => !$('aiBtnOverview').disabled); await sleep(60);
      t('at the daily limit, it says to try tomorrow', /Try again tomorrow/.test(txt('aiOutOverview')));
      window.__aiMode = 'privacy_guard'; $('aiBtnOverview').click(); await until(() => !$('aiBtnOverview').disabled); await sleep(60);
      t('if the privacy guard stops a request, it says nothing was sent', /Nothing was sent/.test(txt('aiOutOverview')));
      window.__aiMode = 'ok';

      /* ---- period ---- */
      window.__calls.length = 0;
      document.querySelector('.period-btn[data-days="7"]').click(); await until(() => window.__calls.some(c => c.action === 'reports'));
      await sleep(150);
      t('choosing 7 days asks the server for 7 days again and redraws', window.__calls[0].days === '7' && /last 7 days compared with the 7 before/.test(txt('generated')) && /^7/.test(textOf(q('#kpiTiles .tile')[0])) && q('#chartActivity polyline').length === 3, txt('generated'));
      t('the 7-day button is now the pressed one, and the choice is remembered', document.querySelector('.period-btn[data-days="7"]').getAttribute('aria-pressed') === 'true' && document.querySelector('.period-btn[data-days="30"]').getAttribute('aria-pressed') === 'false' && JSON.parse(localStorage.getItem('pa_reports_view')).period === 7);
      t('an AI explanation from the old period is cleared', txt('aiOutOverview') === '');

      /* ---- funnel ---- */
      $('tab-funnel').click(); await sleep(60);
      t('the Funnel tab opens and the others close', !$('panel-funnel').hidden && $('panel-overview').hidden && $('tab-funnel').getAttribute('aria-selected') === 'true');
      const rows = q('#funnelChart .funnel-row');
      t('five steps from started to finished a course, with counts', rows.length === 5 && /Started the assessment/.test(textOf(rows[0])) && /20/.test(textOf(rows[0])) && /Finished a course/.test(textOf(rows[4])));
      t('each step shows the share that carried on', /60% carried on/.test(textOf(rows[1])) && /33% carried on/.test(textOf(rows[2])));
      t('the biggest drop is marked', rows[2].classList.contains('worst') && !!rows[2].querySelector('.funnel-conv.bad') && !rows[1].classList.contains('worst'));
      t('the funnel insight names the drop with real counts', /from "Saw their results" to "Created an account": 33% carry on \(4 of 12\)/.test(txt('insightsFunnel')));
      t('the honest caveats are shown', /anonymous events/.test(txt('funnelNotes')) && /completions are not time-stamped/.test(txt('funnelNotes')));
      $('aiBtnFunnel').click(); await until(() => !$('aiBtnFunnel').disabled); await sleep(60);
      t('the funnel has its own AI explanation', /What it shows/.test(txt('aiOutFunnel')) && window.__calls.filter(c => c.action === 'reportsAi').pop().section === 'funnel');

      /* ---- leads ---- */
      window.__calls.length = 0;
      $('tab-leads').click(); await until(() => q('#leadsTableWrap tbody tr').length > 0); await sleep(60);
      t('the Leads tab opens and loads the list of requests', !$('panel-leads').hidden && window.__calls.some(c => c.action === 'reportsLeads' && c.idToken === 'tok'));
      const lt = q('#leadKpis .tile');
      t('three tiles: requests, Hot or Warm, and Hot requests waiting', lt.length === 3 && /Requests for information/.test(textOf(lt[0])) && /Hot or Warm/.test(textOf(lt[1])) && /Hot requests waiting 2\+ days/.test(textOf(lt[2])) && /^2/.test(textOf(lt[2])), lt.map(textOf).join(' | '));
      t('the waiting tile does not pretend to compare with a previous period', !/vs 0 before/.test(textOf(lt[2])) && !lt[2].querySelector('.delta') && /not compared/.test(textOf(lt[2])), textOf(lt[2]));
      t('breakdowns by fit, source, who, timeline, size and pipeline are drawn', ['barsFit', 'barsSource', 'barsWho', 'barsTimeline', 'barsSize', 'barsPipeline'].every(id => q('#' + id + ' .bar-row').length > 0) && /toolkits/.test(txt('barsSource')) && /Contacted/.test(txt('barsPipeline')));
      t('the requests-per-day chart is drawn', q('#chartLeads polyline').length === 1);
      t('lead insights appear, including the waiting-Hot warning', /waiting more than 2 days/.test(txt('insightsLeads')) && q('#insightsLeads .sev-watch').length === 1);
      let trs = q('#leadsTableWrap tbody tr:not(.expand)');
      t('the table lists every request with name, company, fit and status', trs.length === 3 && /Jane Smith/.test(textOf(trs[0])) && /Acme Health/.test(textOf(trs[0])) && /Hot/.test(textOf(trs[0])) && /New/.test(textOf(trs[0])));
      t('details are hidden until asked for', q('#leadsTableWrap tr.expand').every(r => r.hidden));
      trs[0].querySelector('button').click(); await sleep(30);
      t('Details shows the email, interest, why it scored that way, and the message', !q('#leadsTableWrap tr.expand')[0].hidden && /jane@acme\.com/.test(textOf(q('#leadsTableWrap tr.expand')[0])) && /Timeline: This month \(\+25\)/.test(textOf(q('#leadsTableWrap tr.expand')[0])) && /Assess all 60 PMs/.test(textOf(q('#leadsTableWrap tr.expand')[0])));
      $('leadSearch').value = 'globex'; $('leadSearch').dispatchEvent(new Event('input')); await sleep(30);
      t('searching narrows the list by name, company or email', q('#leadsTableWrap tbody tr:not(.expand)').length === 1 && /Sam Lee/.test(textOf(q('#leadsTableWrap tbody tr:not(.expand)')[0])));
      $('leadSearch').value = ''; $('leadSearch').dispatchEvent(new Event('input'));
      $('leadFit').value = 'Hot'; $('leadFit').dispatchEvent(new Event('change')); await sleep(30);
      t('filtering by fit works', q('#leadsTableWrap tbody tr:not(.expand)').length === 1 && /Jane/.test(textOf(q('#leadsTableWrap tbody tr:not(.expand)')[0])));
      $('leadFit').value = ''; $('leadFit').dispatchEvent(new Event('change'));
      $('leadCsvBtn').click(); await sleep(100);
      const csv = downloads.length ? await downloads[downloads.length - 1].text() : '';
      t('the download has a header and one line per request', csv.split('\r\n')[0].indexOf('Received,Name,Email,Company') === 0 && csv.split('\r\n').length === 4, csv.split('\r\n').length + '');
      t('a name that would run as a formula in a spreadsheet is neutralised', csv.indexOf("'=HYPERLINK") > -1 && !/(^|,)=HYPERLINK/.test(csv));
      $('aiBtnLeads').click(); await until(() => !$('aiBtnLeads').disabled); await sleep(60);
      t('the leads section has its own AI explanation', /What it shows/.test(txt('aiOutLeads')) && window.__calls.filter(c => c.action === 'reportsAi').pop().section === 'leads');
      t('the list is fetched once, not every time the tab is opened', (() => { $('tab-overview').click(); $('tab-leads').click(); return window.__calls.filter(c => c.action === 'reportsLeads').length === 1; })());
      t('the tab choice is remembered', JSON.parse(localStorage.getItem('pa_reports_view')).tab === 'leads');
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  done();
})();
