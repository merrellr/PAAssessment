// Lesson audio, step 1: turn every lesson into a listening script.
// Opens each lesson in the UI test harness (headless Chromium, fake Firebase) and reads what a learner reads,
// so the narration always matches the page. Interactive practice is not read out: the narrator says its title and
// asks the listener to try it on the page.
//
// Needs the UI test site built (node tests/ui/run-ui-tests.mjs builds it into <tmp>/pa-ui-site) and served:
//   node tools/lesson-audio/extract-scripts.mjs [http://127.0.0.1:8812]   (serves <tmp>/pa-ui-site itself if no URL is given)
// Writes tools/lesson-audio/scripts.json: { "<course>": { "title": "...", "lessons": [{ "n", "title", "lines": [...] }] } }
// Step 2 (tools/lesson-audio/narrate.py) turns the scripts into audio/lessons/<course>-<n>.mp3.
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');

let base = process.argv[2], server = null;
if (!base) {
  const root = path.join(os.tmpdir(), 'pa-ui-site');
  if (!fs.existsSync(path.join(root, 'les-test.html'))) { console.error('Build the UI test site first: node tests/ui/run-ui-tests.mjs'); process.exit(1); }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
  server = http.createServer((req, res) => {
    const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(8813);
  base = 'http://127.0.0.1:8813';
}

// Runs in the page: the lesson as a list of lines to read.
function readLesson() {
  const body = document.querySelector('#lessonBody');
  const PRACTICE = ['lb-sort', 'lb-scenario', 'lb-quiz', 'lb-reflect', 'lb-check'];
  const SKIP = '.lb-cast, .lb-choices, .lb-outcome, .lb-score, .lb-eyebrow, button, svg, textarea, input, select, [aria-hidden="true"], .sr-only';
  const PICK = 'h2, h3, h4, p, li, figcaption, blockquote, dl, .lb-persona, .lb-bar[aria-label]';
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const stop = (s) => { s = clean(s); return s && !/[.!?:"”’)]$/.test(s) ? s + '.' : s; };
  const sentence = (s) => { s = clean(s); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s; };
  const lines = [];
  const add = (s) => {
    // a label styled in capitals ("KEY IDEA The agents ...") becomes "Key idea: The agents ..."
    s = clean(s).replace(/^([A-Z]{2,}(?: [A-Z]{2,})*) (?=[A-Z][a-z])/, (m, w) => sentence(w) + ': ');
    if (s && lines[lines.length - 1] !== s) lines.push(s);
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
      add('Practice: ' + stop(title ? title.textContent : 'try it yourself') + ' Pause here, and try it on the lesson page.');
      return;
    }
    if (block.matches(PICK)) { add(say(block)); return; }
    const picked = Array.from(block.querySelectorAll(PICK))
      .filter(el => !el.closest(SKIP) && !(el.parentElement && el.parentElement.closest(PICK)));
    if (!picked.length && /pf|lb-/.test(cls)) {
      const label = block.getAttribute('aria-label') || (block.querySelector('[role="img"][aria-label]') || {}).getAttribute?.('aria-label');
      if (label) add(label);
      return;
    }
    picked.forEach(el => add(say(el)));
  });
  return { course: clean(document.querySelector('#courseTitle').textContent), title: clean(document.querySelector('#lessonTitle').textContent), lines };
}

const courses = fs.readdirSync(path.join(repo, 'content')).filter(f => /-(novice|moderate|experienced|advanced)\.js$/.test(f)).map(f => f.replace('.js', '')).sort();
const browser = await chromium.launch();
const page = await browser.newPage();
const out = {};
for (const c of courses) {
  for (let n = 1; n <= 12; n++) {
    await page.goto(`${base}/les-test.html?scn=blocks&course=${c}&lesson=${n}`);
    try { await page.waitForFunction(() => !/Loading/.test(document.querySelector('#lessonBody').textContent), null, { timeout: 8000 }); } catch (e) { break; }
    await page.waitForTimeout(150);
    const r = await page.evaluate(readLesson);
    if (!r.title || !r.lines.length || (out[c] && out[c].lessons.some(x => x.title === r.title))) break;
    out[c] = out[c] || { title: r.course, lessons: [] };
    out[c].lessons.push({ n, title: r.title, lines: r.lines });
  }
  console.log(c, out[c] ? out[c].lessons.length + ' lessons' : 'none');
}
await browser.close();
if (server) server.close();
fs.writeFileSync(path.join(here, 'scripts.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote tools/lesson-audio/scripts.json');
