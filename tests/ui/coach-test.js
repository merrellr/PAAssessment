// The coach chat (coach.html): the suggestion up top, sending a question with the lesson passages and the learner's
// summary, the reply with citations and a practice button, the free-chat count, the upgrade card and "Request access".
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + window.__scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const until = async (f, ms = 6000) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await sleep(50); } return false; };
const ask = async (q) => { $('chInput').value = q; $('chForm').dispatchEvent(new Event('submit', { cancelable: true })); await until(() => !/Thinking it through/.test($('chThread').textContent)); await sleep(50); };

(async function(){
  try {
    await until(() => $('chThread').children.length > 0 && $('chAccess').textContent);
    if (window.__scn === 'free') {
      t('the coach opens with what it would do next, and suggested questions', /Hi Casey/.test($('chThread').textContent) && /Targeted Prioritization & Trade-offs session/.test($('chThread').textContent) && $('chThread').querySelectorAll('.cc-sg').length === 5);
      t('a free account sees how many messages are left', /Free chat · 10 messages left/.test($('chAccess').textContent), $('chAccess').textContent);
      t('the side panel shows what the coach is using: areas and recent answers', $('chUsing').children.length === 7 && /Missed/.test($('chRecent').textContent));
      await ask('How do I prioritize requests?');
      const sent = window.__sent.find(x => x.action === 'coachChat');
      const me = JSON.parse(sent.me), ctx = JSON.parse(sent.ctx);
      t('the question goes with the matching lesson passages and a conversation id', sent.q === 'How do I prioritize requests?' && ctx.length >= 1 && /lesson\.html\?course=prioritization-novice/.test(ctx[0].u) && /^c[a-z0-9]{8,}/.test(sent.conv), sent.ctx);
      t('and a summary of how the learner is doing (areas, the kind of question missed)', me.areas.length === 7 && me.areas.find(a => a.k === 'prioritization').s === 'attention' && me.weak === 'scenario', sent.me);
      const reply = $('chThread').querySelector('.msg.coach:last-child .bubble');
      t('the reply shows citations linked to the lessons, bullets, and the lessons it used', reply.querySelectorAll('a.cite').length === 2 && reply.querySelectorAll('li').length === 2 && /From your lessons: Lesson 2/.test(reply.textContent));
      t('a [[practice:...]] tag becomes a Practise button', !!reply.querySelector('a[href="/practice?area=prioritization"]') && !/\[\[/.test(reply.textContent));
      t('the free count goes down', /9 messages left/.test($('chAccess').textContent), $('chAccess').textContent);
      await ask('And how do I say no?');
      const s2 = window.__sent.filter(x => x.action === 'coachChat')[1];
      t('the conversation so far goes with the next question', JSON.parse(s2.h).length === 2 && JSON.parse(s2.h)[0].t === 'How do I prioritize requests?' && s2.conv === sent.conv);
      t('it is kept in this browser', JSON.parse(localStorage.getItem('pa_coach_chat')).msgs.length === 4);
      await ask('One more question');
      t('when the free chat runs out: the upgrade card, and no more typing', !$('chUpgrade').hidden && $('chForm').hidden && /used your free Compass Coach conversation/.test($('chUpgrade').textContent));
      await until(() => $('chRequest'));
      $('chRequest').click();
      await until(() => /your request is in/.test($('chUpgrade').textContent));
      const req = window.__store['coachRequests/uCo'];
      t('"Request access" sends a request the owner sees, and says so', !!req && req.uid === 'uCo' && req.email === 'co@acme.com' && /your request is in/.test($('chUpgrade').textContent), JSON.stringify(req));
    } else if (window.__scn === 'used') {
      t('someone whose free chat is used sees the upgrade card straight away', !$('chUpgrade').hidden && $('chForm').hidden && /Free chat used/.test($('chAccess').textContent));
      t('and can still practise for free', !!$('chUpgrade').querySelector('a[href="/practice"]'));
    } else {
      t('a company member: "Included with your company", no count', /Included with your company/.test($('chAccess').textContent));
      await ask('Hi coach');
      t('and the chat works', $('chThread').querySelectorAll('.msg.coach').length === 2 && /Included with your company/.test($('chAccess').textContent));
    }
  } catch (e) { out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' / ') : e)); }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + window.__scn + '] ' + e));
  document.documentElement.setAttribute('data-results', out.join(' || '));
})();
