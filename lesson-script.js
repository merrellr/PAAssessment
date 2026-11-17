/* What a lesson's narration reads, and which element each line comes from. Shared by the narration
   (tools/lesson-audio/extract-scripts.mjs reads every lesson with it) and the lesson page (lesson.html highlights
   the element being read), so the two always agree. Interactive practice is not read out: the narrator says its
   title and asks the listener to try it on the page.
   PALessonScript.read(lessonBody) -> { lines: [text, ...], els: [element, ...] } */
(function () {
  "use strict";
  function read(body) {
    const PRACTICE = ['lb-sort', 'lb-scenario', 'lb-quiz', 'lb-reflect', 'lb-check'];
    const SKIP = '.lb-cast, .lb-choices, .lb-outcome, .lb-score, .lb-eyebrow, button, svg, textarea, input, select, [aria-hidden="true"], .sr-only';
    const PICK = 'h2, h3, h4, p, li, figcaption, blockquote, dl, .lb-persona, .lb-bar[aria-label]';
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const stop = (s) => { s = clean(s); return s && !/[.!?:"”’)]$/.test(s) ? s + '.' : s; };
    const sentence = (s) => { s = clean(s); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s; };
    const lines = [], els = [];
    const add = (s, el) => {
      // a label styled in capitals ("KEY IDEA The agents ...") becomes "Key idea: The agents ..."
      s = clean(s).replace(/^([A-Z]{2,}(?: [A-Z]{2,})*) (?=[A-Z][a-z])/, (m, w) => sentence(w) + ': ');
      if (s && lines[lines.length - 1] !== s) { lines.push(s); els.push(el); }
    };
    // a definition list as "Wants: ...", "Worries: ..."
    const dlText = (dl) => Array.from(dl.querySelectorAll('dt')).map(dt => {
      const dd = dt.nextElementSibling; return stop(sentence(dt.innerText) + ': ' + clean(dd ? dd.innerText : ''));
    }).join(' ');
    const say = (el) => {
      if (el.matches('dl')) return dlText(el);
      if (el.matches('.lb-bar')) return stop(el.getAttribute('aria-label'));
      if (el.matches('li.lb-step')) {   // "Step 1, days: Fake door. A button or ..."
        const n = el.querySelector('.lb-step-n'), tag = el.querySelector('.lb-step-tag'), name = el.querySelector('b'), p = el.querySelector('p');
        return stop((n ? 'Step ' + clean(n.innerText) : '') + (tag ? ', ' + clean(tag.innerText).toLowerCase() : '') + (name ? ': ' + clean(name.innerText) : '')) + ' ' + clean(p ? p.innerText : '');
      }
      if (el.matches('.lb-persona')) {   // "Rosa, billing specialist, does the work. “...” Wants: ... Worries: ..."
        const who = el.querySelector('header b'), role = el.querySelector('header small'), kind = el.querySelector('.lb-kind');
        return [stop([who, role, kind].filter(Boolean).map((x, i) => i ? clean(x.textContent).replace(/\b([A-Z])([a-z]+)/g, (m, a, b) => a.toLowerCase() + b) : clean(x.textContent)).join(', ')),
          clean((el.querySelector('blockquote') || {}).innerText), el.querySelector('dl') ? dlText(el.querySelector('dl')) : ''].filter(Boolean).join(' ');
      }
      if (el.matches('li') && el.querySelector('.lb-bubble > b')) {   // a story line spoken by one of the cast
        const b = el.querySelector('.lb-bubble > b'), p = el.querySelector('.lb-bubble p');
        return clean(b.innerText) + ' says: ' + clean(p ? p.innerText : '');
      }
      return el.innerText;
    };
    Array.from(body.children).forEach(block => {
      const cls = String(block.className);
      const title = block.querySelector('.lb-title, h3');
      if (PRACTICE.some(c => cls.includes(c))) {
        add('Practice: ' + stop(title ? title.textContent : 'try it yourself') + ' Pause here, and try it on the lesson page.', block);
        return;
      }
      if (block.matches(PICK)) { add(say(block), block); return; }
      const picked = Array.from(block.querySelectorAll(PICK))
        .filter(el => !el.closest(SKIP) && !(el.parentElement && el.parentElement.closest(PICK)));
      if (!picked.length && /pf|lb-/.test(cls)) {
        const label = block.getAttribute('aria-label') || (block.querySelector('[role="img"][aria-label]') || {}).getAttribute?.('aria-label');
        if (label) add(label, block);
        return;
      }
      picked.forEach(el => add(say(el), el));
    });
    return { lines, els };
  }
  window.PALessonScript = { read: read };
})();
