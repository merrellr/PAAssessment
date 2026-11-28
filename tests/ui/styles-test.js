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
    } else if (window.__scn === 'team') {
      t('told before they start: their team, the teams that can see it, and that the company chose', !$('wsNotice').hidden && /your team \(Product\)/.test($('wsNotice').textContent) && /company chose this/.test($('wsNotice').textContent), $('wsNotice').textContent);
      $('wsStart').click(); await sleep(20);
      for (let n = 0; n < 24; n++) { pick('c'); pick('i'); await sleep(5); }
      await until(() => window.__store['orgStyles/orgA/people/uWs']);
      const mine = window.__store['orgStyles/orgA/people/uWs'];
      t('finishing shares name and scores with the company (never the answers)', mine && mine.name === 'Wren Style' && mine.primary === 'c' && mine.scores.c === 100 && !mine.answers && mine.at, JSON.stringify(mine));
      await until(() => /Ed Eng/.test($('wsResult').textContent));
      t('the sharing box says who sees it, with no opt-out', /Shared within teams at Acme/.test($('wsResult').textContent) && !$('wsOptIn'));
      t('the styles they may see: their teammate and the team their team can see', /Mo Team/.test($('wsTeam').textContent) && /Influence with Steadiness/.test($('wsTeam').textContent) && /Ed Eng/.test($('wsTeam').textContent) && document.querySelectorAll('#wsTeam .ws-people li').length === 2);
      t('the team map: your dot and theirs', !!document.querySelector('#wsTeam svg.ws-map .ws-dot') && document.querySelectorAll('#wsTeam svg.ws-map .ws-other').length === 2);
      t('the balance: counts by style, and what the group may miss', /The balance of 3 people/.test($('wsTeam').textContent) && /No one leans Dominance/.test($('wsTeam').textContent) && /No one leans Steadiness/.test($('wsTeam').textContent), $('wsTeam').textContent.slice(0, 300));
      const mo = [...document.querySelectorAll('#wsTeam .ws-person')].find(b => /Mo Team/.test(b.textContent));
      mo.click(); await sleep(30);
      t('working with someone: how to work with them, and you together', mo.getAttribute('aria-expanded') === 'true' && /Working with Mo/.test(mo.nextElementSibling.textContent) && /Talk it through/.test(mo.nextElementSibling.textContent) && /You and Mo together: One brings energy, the other rigour/.test(mo.nextElementSibling.textContent));
      await until(() => $('wsReqForm'));
      const opts = [...$('wsReqWho').options].map(o => o.textContent);
      t('asking to see more: only teams and people they can\'t see yet', opts.join() === 'Team: Design,Zoe Zee', opts.join());
      $('wsReqWho').value = 'person:uZoe'; $('wsReqWhy').value = 'pls'; $('wsReqForm').requestSubmit(); await sleep(30);
      t('a request needs a reason', /Say briefly why/.test($('wsReqMsg').textContent));
      $('wsReqWhy').value = 'We are pairing on the onboarding redesign.'; $('wsReqForm').requestSubmit();
      await until(() => Object.keys(window.__store).some(k => k.indexOf('orgStyleRequests/orgA/items/') === 0));
      const rq = Object.keys(window.__store).filter(k => k.indexOf('orgStyleRequests/orgA/items/') === 0).map(k => window.__store[k])[0];
      t('the request is sent for an admin, pending, with the reason', rq.requester === 'uWs' && rq.kind === 'person' && rq.targetId === 'uZoe' && rq.targetName === 'Zoe Zee' && rq.status === 'pending' && /pairing/.test(rq.reason) && rq.createdAt, JSON.stringify(rq));
      await until(() => /Waiting for an admin/.test($('wsAskAccess').textContent));
      t('and shows as waiting, with a way to withdraw it', /Waiting for an admin/.test($('wsAskAccess').textContent) && !!$('wsAskAccess').querySelector('[data-withdraw]'));
      await until(() => /shared on request/.test($('wsToldMe').textContent));
      t('they are told when their own style was shared on request, with the reason', /With Zoe Zee/.test($('wsToldMe').textContent) && /Pairing on onboarding/.test($('wsToldMe').textContent));
    } else if (window.__scn === 'optional') {
      t('"by choice": a box to share, unticked, and nothing shared yet', $('wsOptIn') && !$('wsOptIn').checked && !window.__store['orgStyles/orgA/people/uWs']);
      $('wsOptIn').click(); await until(() => window.__store['orgStyles/orgA/people/uWs']);
      t('ticking it shares, and remembers the choice', window.__store['orgStyles/orgA/people/uWs'].primary === 'd' && prog().workStyleShare === true);
      $('wsOptIn').click(); await until(() => !window.__store['orgStyles/orgA/people/uWs']);
      t('unticking takes it back off', !window.__store['orgStyles/orgA/people/uWs'] && prog().workStyleShare === false);
    } else if (window.__scn === 'unpaid') {
      await until(() => /paid add-on/.test($('wsTeam').textContent));
      t('"everyone" without the paid team view: shared, but teammates\' styles are a paid add-on', /Shared with everyone at Acme/.test($('wsResult').textContent) && /paid add-on/.test($('wsTeam').textContent) && !document.querySelector('#wsTeam .ws-people'));
      await until(() => window.__store['orgStyles/orgA/people/uWs']);
      t('their style is shared all the same (the company decided)', !!window.__store['orgStyles/orgA/people/uWs']);
    } else {
      t('a finished result shows straight away, as a blend', !$('wsResult').hidden && /Dominance with Influence/.test($('wsResult').textContent) && $('wsIntro').hidden);
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
