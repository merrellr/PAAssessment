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

// The reading rules are in lesson-script.js (shared with the lesson page's read-along).
const courses = fs.readdirSync(path.join(repo, 'content')).filter(f => /-(novice|moderate|experienced|advanced)\.js$/.test(f)).map(f => f.replace('.js', '')).sort();
const browser = await chromium.launch();
const page = await browser.newPage();
const out = {};
for (const c of courses) {
  for (let n = 1; n <= 12; n++) {
    await page.goto(`${base}/les-test.html?scn=blocks&course=${c}&lesson=${n}`);
    try { await page.waitForFunction(() => !/Loading/.test(document.querySelector('#lessonBody').textContent), null, { timeout: 8000 }); } catch (e) { break; }
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
      return { course: clean(document.querySelector('#courseTitle').textContent), title: clean(document.querySelector('#lessonTitle').textContent),
        lines: window.PALessonScript.read(document.querySelector('#lessonBody')).lines };
    });
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
