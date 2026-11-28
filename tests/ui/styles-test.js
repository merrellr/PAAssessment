// DISC Work Styles (work-styles.html): most then least for each situation, Back, the draft kept as it goes, the
// result with its map, bars and report, picking up a draft, and a finished result shown straight away.
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const until = async (f, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await sleep(50); } return false; };
const prog = () => window.__store['progress/uWs'];
const pick = (k) => { const b = $('wsOpts').querySelector('.ws-opt[data-k="' + k + '"]'); b.click(); };
(async function(){
  try {
    await until(() => !$('wsIntro').hidden || !$('wsResult').hidden);
    if (window.__scn === 'fresh') {
      t('the intro: how many, how long, most and least, and what it is not', /24 work situations/.test($('wsIntro').textContent) && /8 minutes/.test($('wsIntro').textContent) && /isn’t for hiring/.test($('wsIntro').textContent) && /Marston/.test($('wsIntro').textContent));
      $('wsStart').click(); await sleep(30);
      t('first, which is most like you; four responses', /most like you/.test($('wsStep').textContent) && $('wsOpts').querySelectorAll('.ws-opt').length === 4 && /1 of 24/.test($('wsWhere').textContent));
      pick('d'); await sleep(20);
      t('then least: the first pick is marked and can’t be picked again', /least like you/.test($('wsStep').textContent) && $('wsOpts').querySelector('[data-k="d"]').disabled && /Most like me/.test($('wsOpts').textContent));
      $('wsBack').click(); await sleep(20);
      t('Back undoes the first pick', /most like you/.test($('wsStep').textContent) && !$('wsOpts').querySelector('[disabled]'));
      pick('d'); pick('s'); await sleep(40);
      t('the next situation, and the draft is kept as it goes', /2 of 24/.test($('wsWhere').textContent) && prog().workStyleDraft && prog().workStyleDraft.i === 1 && prog().workStyleDraft.answers.ws1.most === 'd' && prog().workStyleDraft.answers.ws1.least === 's');
      for (let n = 1; n < 24; n++) { pick('d'); pick('s'); await sleep(5); }
      await until(() => !$('wsResult').hidden);
      const ws = prog().workStyle;
      t('finishing saves the result and clears the draft', ws && ws.complete && ws.primary === 'd' && ws.scores.d === 100 && ws.scores.s === 0 && Object.keys(ws.answers).length === 24 && !('workStyleDraft' in prog()), JSON.stringify(ws && ws.scores));
      t('the result: style, map with your dot, four bars', /Dominance/.test($('wsResult').querySelector('.ws-big').textContent) && $('wsResult').querySelector('svg.ws-map .ws-dot') && $('wsResult').querySelectorAll('.ws-bars li').length === 4 && /Dominance: 100 out of 100/.test($('wsResult').innerHTML));
      t('the report: best, drains, working with you, watch out, in product work, the other styles', ['At your best', 'What drains you', 'How others can work with you', 'Watch out for', 'In product work', 'Working with the other styles'].every(h => $('wsResult').textContent.indexOf(h) > -1) && $('wsResult').querySelectorAll('.ws-work li').length === 6);
      t('it says the result is private', /private to you/.test($('wsResult').textContent));
      $('wsAgain').click(); await sleep(30);
      t('Take it again starts at the first situation', !$('wsCard').hidden && /1 of 24/.test($('wsWhere').textContent));
    } else if (window.__scn === 'resume') {
      t('a draft: pick up where you left off', /Pick up at 23 of 24/.test($('wsStart').textContent));
      $('wsStart').click(); await sleep(30);
      pick('c'); pick('i'); await sleep(20); pick('c'); pick('i');
      await until(() => !$('wsResult').hidden);
      t('finishing a resumed check: Conscientiousness', prog().workStyle.primary === 'c' && /Conscientiousness/.test($('wsResult').textContent));
    } else {
      t('a finished result shows straight away, as a blend', !$('wsResult').hidden && /Dominance with Influence/.test($('wsResult').textContent) && $('wsIntro').hidden);
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
