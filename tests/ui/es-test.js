const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const checked = (kind) => ((document.querySelector('.seg[data-kind="' + kind + '"] [aria-checked="true"]') || {}).dataset || {}).v;
const saves = () => window.__calls.filter(c => c.kind);
(async function(){
  try {
    await sleep(900);
    const scn = window.__scn;
    if (scn === 'nolink'){
      t('a link without its signature explains itself and sends nothing', !$('stateError').hidden && /doesn't work/.test($('errorTitle').textContent) && window.__calls.length === 0);
    } else if (scn === 'badlink'){
      t('a wrong signature explains itself and points to My profile', !$('stateError').hidden && /doesn't work/.test($('errorTitle').textContent) && $('stateError').querySelector('a').getAttribute('href') === '/profile#goals');
    } else if (scn === 'down'){
      t('if the script cannot be reached, it says to try again', !$('stateError').hidden && /couldn't load/.test($('errorTitle').textContent));
    } else if (scn === 'plain' || scn === 'monthly' || scn === 'savefail'){
      t('shows the saved choice for the check-in, weekly by default', !$('stateReady').hidden && checked('checkin') === (scn === 'monthly' ? 'monthly' : 'weekly') && $('offNotice').hidden);
      t('a learner who is not an admin sees no company report setting', $('orgSetting').hidden);
      t('the link signature is sent with every call', window.__calls.every(c => c.u === 'uLearn' && c.k === 'goodsig'));
      document.querySelector('.seg[data-kind="checkin"] [data-v="daily"]').click(); await sleep(200);
      if (scn === 'savefail'){
        t('a failed save goes back to the old choice and says so', checked('checkin') === 'weekly' && /didn't save/.test($('status').textContent));
      } else {
        t('choosing saves straight away', checked('checkin') === 'daily' && saves().length === 1 && saves()[0].kind === 'checkin' && saves()[0].freq === 'daily' && /check-in emails come daily/.test($('status').textContent), $('status').textContent);
        const seg = document.querySelector('.seg[data-kind="checkin"]');
        seg.querySelector('[data-v="daily"]').focus();
        seg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); await sleep(200);
        t('arrow keys move to the next choice and save it', checked('checkin') === 'off' && saves().length === 2 && /are off/.test($('status').textContent));
      }
    } else if (scn === 'off'){
      t('"Unsubscribe" switches the check-in off on arrival', checked('checkin') === 'off' && saves().length === 1 && saves()[0].kind === 'checkin' && saves()[0].freq === 'off');
      t('and says so, with Undo', !$('offNotice').hidden && /unsubscribed/.test($('offTitle').textContent) && /no more check-in emails/.test($('offText').textContent) && !$('undoBtn').hidden);
      t('the address no longer says to unsubscribe, so a reload does not do it again', !/off=/.test(location.search) && /u=uLearn/.test(location.search));
      $('undoBtn').click(); await sleep(200);
      t('Undo brings back what it was', checked('checkin') === 'weekly' && saves().length === 2 && saves()[1].freq === 'weekly' && $('offNotice').hidden);
    } else if (scn === 'adminoff'){
      t('an admin can unsubscribe from the company report alone', checked('orgReport') === 'off' && checked('checkin') === 'weekly' && saves().length === 1 && saves()[0].kind === 'orgReport' && /company report emails/.test($('offText').textContent));
      t('the company is named', !$('orgSetting').hidden && /TestCo/.test($('orgLabel').textContent));
    } else if (scn === 'notadminoff'){
      t('an unsubscribe link for a report they no longer get changes nothing', saves().length === 0 && $('offNotice').hidden && !$('stateReady').hidden);
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
