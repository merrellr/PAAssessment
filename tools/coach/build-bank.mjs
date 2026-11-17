// The coach's practice bank: every lesson check (and "before you read on" question) in content/, with the lesson it
// comes from, the course level, and the kind of question it is. Also each lesson's title and reading time, so the
// coach can say "Ready if you need it: Lesson 2: Know Who You're Building For · 5 min".
//
//   node tools/coach/build-bank.mjs          writes coach-bank.js (commit it with the content change)
//   node tools/coach/build-bank.mjs --check  exits 1 when coach-bank.js is out of date (tests/coach-core.test.mjs runs this)
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of fs.readdirSync(path.join(repo, 'content')).filter(f => /-(novice|moderate|experienced|advanced)\.js$/.test(f)).sort())
  vm.runInContext(fs.readFileSync(path.join(repo, 'content', f), 'utf8'), sandbox, { filename: f });
const C = sandbox.window.CONTENT_OVERRIDES;
// the same rules the coach uses at answer time (coach-core.js), so the bank and the answer log agree
sandbox.window = {};
const core = fs.readFileSync(path.join(repo, 'coach-core.js'), 'utf8');
const ctx = { window: {}, globalThis: {} }; vm.createContext(ctx); vm.runInContext(core, ctx);
const Core = ctx.globalThis.CoachCore || ctx.window.CoachCore;

// reading time: the same rule the lesson page shows (lesson-blocks.js)
const bctx = { globalThis: {}, window: {} }; bctx.globalThis = bctx; vm.createContext(bctx);
vm.runInContext(fs.readFileSync(path.join(repo, 'lesson-blocks.js'), 'utf8'), bctx);
const minutes = (l) => bctx.LessonBlocks.minutes(l);
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const bank = { questions: [], lessons: {} };
for (const cid of Object.keys(C).sort()) {
  const [d, tier] = cid.split('-');
  bank.lessons[cid] = C[cid].lessons.map(l => ({ id: l.id, title: strip(l.title), min: minutes(l) }));
  C[cid].lessons.forEach(l => {
    const qs = (l.preCheck ? [['p', l.preCheck]] : []).concat((l.checks || []).map((q, i) => [String(i), q]));
    qs.forEach(([n, q]) => {
      if (!q || !q.question || !Array.isArray(q.options) || typeof q.correct !== 'number') return;
      bank.questions.push({ id: cid + ':' + l.id + ':' + n, d, tier, c: cid, l: l.id, t: Core.qType(q.question),
        q: strip(q.question), o: q.options.map(strip), a: q.correct, x: strip(q.explanation || '') });
    });
  });
}
const out = '/* Made by tools/coach/build-bank.mjs from content/: do not edit by hand. The coach\'s practice questions and\n   lesson titles (coach-core.js, practice.html, lms-dashboard.html). */\nwindow.CoachBank = ' + JSON.stringify(bank) + ';\n';
const file = path.join(repo, 'coach-bank.js');
if (process.argv.includes('--check')) {
  const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === out;
  console.log(same ? 'coach-bank.js is up to date' : 'coach-bank.js is out of date: run node tools/coach/build-bank.mjs');
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(file, out);
console.log('wrote coach-bank.js:', bank.questions.length, 'questions,', Object.keys(bank.lessons).length, 'courses,', Math.round(out.length / 1024), 'KB');
