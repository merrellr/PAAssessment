// Drives the real feedback.html (the Profile menu's "Send feedback") against the fake Firebase and a fake server.
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
async function until(cond, ms = 4000){ const s = Date.now(); while (Date.now() - s < ms){ if (cond()) return true; await sleep(30); } return false; }
const shown = () => ['stateLoading', 'stateSignedOut', 'feedbackForm', 'stateDone'].filter(id => !$(id).hidden).join(',');
const btn = (grp, v) => document.querySelector('[data-group="' + grp + '"] [data-v="' + v + '"]');
const on = (grp, v) => btn(grp, v).getAttribute('aria-checked') === 'true';
function fill(v){ const e = $('message'); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
const submit = () => $('feedbackForm').dispatchEvent(new Event('submit', { cancelable: true }));
function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
}

(async () => {
  try {
    await until(() => shown() !== 'stateLoading');
    if (scn === 'signedout'){
      t('signed out, it asks the person to sign in and sends nothing', shown() === 'stateSignedOut' && window.__calls.length === 0, shown());
      return;
    }
    t('signed in, the form shows with the address replies go to', shown() === 'feedbackForm' && txt('replyTo') === 'pat@acme.com', shown() + ' ' + txt('replyTo'));
    if (scn === 'about'){
      t('a topic can be chosen from the link (?about=idea)', on('topic', 'idea') && !on('topic', 'courses'));
      return;
    }
    fill('The lesson page is blank on my phone.');
    submit(); await sleep(60);
    t('sending without choosing a topic says what to do, and sends nothing', /what it's about/.test(txt('error')) && window.__calls.length === 0, txt('error'));
    btn('topic', 'broken').click(); btn('topic', 'courses').click();
    t('one topic at a time', on('topic', 'courses') && !on('topic', 'broken'));
    btn('rating', 'good').click(); btn('rating', 'good').click();
    t('the rating is optional: tapping it again clears it', !on('rating', 'good'));
    btn('rating', 'needswork').click();
    fill('  ');
    submit(); await sleep(60);
    t('an empty note is caught before sending', /a little more/.test(txt('error')) && window.__calls.length === 0, txt('error'));
    fill('The lesson page is blank on my phone.');
    t('the counter follows the note', txt('count') === '37 / 2000', txt('count'));
    submit();
    await until(() => window.__calls.length > 0 && $('sendBtn').disabled === false);
    await sleep(60);
    const c = window.__calls[0] || {};
    t('it sends the topic, rating, note and sign-in token to the script', c.action === 'feedback' && c.topic === 'courses' && c.rating === 'needswork' && c.message === 'The lesson page is blank on my phone.' && c.idToken === 'tok', JSON.stringify(c));
    if (scn === 'limit'){
      t('the daily limit is explained and the note is kept', shown() === 'feedbackForm' && /tomorrow/.test(txt('error')) && $('message').value.length > 0, txt('error'));
      return;
    }
    t('then it thanks them and says where replies go', shown() === 'stateDone' && txt('doneEmail') === 'pat@acme.com', shown());
    $('againBtn').click(); await sleep(30);
    t('"Send another" brings back an empty form', shown() === 'feedbackForm' && $('message').value === '' && txt('count') === '0 / 2000');
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  } finally {
    done();
  }
})();
