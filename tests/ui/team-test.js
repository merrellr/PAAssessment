// Team mode (team-session.html): start a session, join, score alone, the reveal, agree, save.
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const all = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
const vis = (id) => { const e = $(id); return !!e && !e.hidden && e.offsetParent !== null; };
const until = async (f, ms = 4000) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await sleep(40); } return false; };
const txt = (id) => ($(id) ? $(id).textContent.replace(/\s+/g, ' ').trim() : '');
const S = () => window.__store['teamSessions/s1'];

(async function(){
  try {
    await until(() => !vis('stateLoading'));
    const scn = window.__scn;
    if (scn === 'signedout'){
      t('signed out: asked to sign in first', vis('stateSignedOut'));
    } else if (scn === 'missing'){
      t('a session that does not exist says so', vis('stateMissing') && /isn't available/.test(txt('stateMissing')));
    } else if (scn === 'create'){
      await until(() => vis('stateCreate'));
      t('starting from a saved scorecard shows its name and what will be scored', $('createTitle').value === 'Q1 roadmap' && /3 features, scored on 2 criteria: Customer value, Effort \(lower is better\)/.test(txt('createWhat')), txt('createWhat'));
      $('createTitle').value = 'Q1 roadmap: team';
      $('createBtn').click();
      await until(() => !!window.__navTo);
      const id = (window.__navTo || '').split('s=')[1] || '';
      const made = window.__store['teamSessions/' + id];
      t('Start creates the session and opens it', /^[A-Za-z0-9]{20}$/.test(id) && !!made, window.__navTo);
      t('with the scorecard\'s features and criteria, scoring open, the facilitator in it', made && made.title === 'Q1 roadmap: team' && made.features.join() === 'Mobile app,SSO,Bulk export' &&
        made.criteria[1].cost === true && made.status === 'scoring' && made.members.uFac === 'Fran' && made.owner === 'uFac' && made.agreed === null);
    } else if (scn === 'join'){
      await until(() => vis('stateSession'));
      t('someone new sees what it is and a Join button', vis('joinPanel') && !vis('scorePanel') && /Q1 roadmap/.test(txt('sTitle')) && /Run by Fran/.test(txt('sWho')));
      t('they cannot see the facilitator\'s controls', !vis('facPanel'));
      $('joinBtn').click(); await until(() => vis('scorePanel'));
      t('Join adds their own name and opens their scorecard', S().members.uNew === 'Nia' && vis('scorePanel'));
      const segs = all('#scoreGrid .seg');
      t('a 1 to 5 choice for every feature and criterion', segs.length === 6 && segs.every(s => all('button', s).length === 5));
      t('a cost criterion says lower is better', /lower is better/.test(txt('scoreGrid')));
      t('they cannot finish until every one is scored', $('submitBtn').disabled && /0 of 6 scored/.test(txt('scoreProgress')));
      segs.forEach((s, k) => all('button', s)[k % 5].click());
      await sleep(600);
      t('each choice is shown and saved as they go', /6 of 6 scored/.test(txt('scoreProgress')) && (window.__store['teamSessions/s1/scores/uNew'] || {}).scores.join() === '12,34,51', JSON.stringify(window.__store['teamSessions/s1/scores/uNew']));
      $('submitBtn').click(); await until(() => vis('waitPanel'));
      t('Done marks them as finished and says who else has', S().submitted.uNew === true && /4 of 5 people have finished/.test(txt('waitText')) && /when Fran reveals them/.test(txt('waitText')), txt('waitText'));
      t('they still cannot see anyone else\'s scores', !vis('revealPanel'));
      $('editBtn').click(); await until(() => vis('scorePanel'));
      t('they can change their scores until the reveal', vis('scorePanel') && all('#scoreGrid [aria-pressed="true"]').length === 6);
    } else if (scn === 'blind'){
      await until(() => vis('stateSession'));
      t('before the reveal a member scores alone, seeing only their own card', vis('scorePanel') && !vis('revealPanel'));
      t('their saved scores are loaded back', all('#scoreGrid [aria-pressed="true"]').map(b => b.textContent).join('') === '243322');
    } else if (scn === 'waiting'){
      await until(() => vis('stateSession'));
      t('the facilitator sees the link to send', vis('facPanel') && /\/team-session\?s=s1$/.test($('shareLink').value));
      t('and who has finished (3 of 4), without anyone\'s scores', /3 of 4 have scored/.test(txt('peopleHead')) && all('#people li.in').length === 3 && !vis('revealPanel'));
      t('they score too', vis('waitPanel') || vis('scorePanel'));
      t('Reveal is ready once two or more have finished', $('revealBtn') && !$('revealBtn').disabled);
      $('revealBtn').click(); await until(() => vis('revealPanel'));
      t('Reveal shows everyone\'s scores', S().status === 'revealed' && all('#rows .frow:not(.axis-row)').length === 3);
    } else if (scn === 'reveal' || scn === 'member'){
      await until(() => vis('revealPanel'));
      const rows = all('#rows .frow:not(.axis-row)');
      t('each feature shows a dot per person who finished (Dana did not)', rows.length === 3 && rows.every(r => all('.dot', r).length === 3) && !/Dana/.test(txt('legend')), txt('legend'));
      t('the biggest gap comes first, marked Discuss', /Mobile app/.test(rows[0].textContent) && /Discuss · 66/.test(rows[0].textContent), rows[0].textContent);
      t('the discussion list says who disagreed, and on what', /Mobile app: 66 points apart\. Fran and Marcus scored Customer value 5, Priya 2/.test(txt('discussList')), txt('discussList'));
      t('features everyone is close on are called out', /SSO/.test(txt('agreedText')) || /Bulk export/.test(txt('agreedText')), txt('agreedText'));
      t('each row is described for screen readers', /Fran \d+, Priya \d+, Marcus \d+\. Spread \d+ points/.test(rows[0].querySelector('.track').getAttribute('aria-label')));
      if (scn === 'member') t('a member cannot run the session', !vis('facPanel'));
      else {
        t('the facilitator can hide them again', !!$('hideBtn'));
        $('hideBtn').click(); await until(() => S().status === 'scoring' && !vis('revealPanel'));
        t('Hide returns to scoring', S().status === 'scoring' && !vis('revealPanel'));
      }
    } else if (scn === 'agree'){
      await until(() => vis('revealPanel'));
      $('agreeBtn').click(); await until(() => vis('agreePanel'));
      const sel = all('#agreeTable select');
      t('agreeing starts from the team\'s average on each criterion', sel.length === 6 && sel.map(s => s.value).join('') === '433321', sel.map(s => s.value).join(''));
      const firstBefore = txt('agreeRank');
      sel[2].value = '5'; sel[2].dispatchEvent(new Event('change'));
      sel[3].value = '1'; sel[3].dispatchEvent(new Event('change'));
      t('changing a score updates the ranking', all('#agreeRank li')[0].textContent.includes('SSO') && txt('agreeRank') !== firstBefore, txt('agreeRank'));
      $('saveAgreed').click(); await until(() => vis('resultPanel'));
      t('Save stores the team\'s scores and shows the ranking to everyone', S().status === 'agreed' && S().agreed.join() === '43,51,21' && /SSO/.test(all('#resultRank li')[0].textContent), JSON.stringify(S().agreed));
    } else if (scn === 'agreed'){
      await until(() => vis('resultPanel'));
      t('everyone sees the team\'s ranking', all('#resultRank li').length === 3 && /^1\s*Mobile app/.test(all('#resultRank li')[0].textContent), txt('resultRank'));
      $('saveToToolkit').click(); await until(() => /Saved to My Toolkits/.test(txt('notice')));
      const saved = Object.keys(window.__store).filter(k => /^savedTools\//.test(k) && k !== 'savedTools/sc1').map(k => window.__store[k])[0];
      t('Save to My Toolkits saves it as their own scorecard', saved && saved.uid === 'uPri' && saved.tool === 'scorecard' && saved.title === 'Q1 roadmap (team)' && saved.data === 'ENC3' && /^1\. Mobile app/.test(saved.summary), JSON.stringify(saved));
      t('with the agreed scores', window.__encoded && window.__encoded.features[0].scores.join() === '4,3');
      $('showScores').click(); await until(() => vis('revealPanel'));
      t('the scores behind it can be shown again', vis('revealPanel'));
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
