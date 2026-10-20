// Runs the UI tests in headless Chromium, on any computer (run-ui-tests.ps1 does the same with Edge on Windows).
// It reads run-ui-tests.ps1 for what to copy, which pages to build and which scenarios to run, so that file stays
// the one list. Used by CI (.github/workflows/tests.yml).
//
//   npm install --no-save playwright && npx playwright install chromium
//   node tests/ui/run-ui-tests.mjs              every scenario
//   node tests/ui/run-ui-tests.mjs "feedback"    only scenarios whose label contains "feedback"
//
// Exits with 1 when any check fails or a page produces no results.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { console.error('Playwright is needed: npm install --no-save playwright && npx playwright install chromium'); process.exit(2); }

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const only = process.argv[2] || '';
const ui = path.join(repo, 'tests', 'ui');
const ps = fs.readFileSync(path.join(ui, 'run-ui-tests.ps1'), 'utf8');
const site = path.join(os.tmpdir(), 'pa-ui-site');
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });
const FB = /https:\/\/www\.gstatic\.com\/firebasejs\/10\.13\.0\/firebase-(app|auth|firestore)\.js/g;
const errHook = (ps.match(/\$errHook = '(.*)'/) || [])[1] || '';

// copies
for (const f of fs.readdirSync(ui).filter(f => f.endsWith('.js'))) fs.copyFileSync(path.join(ui, f), path.join(site, f));
for (const m of ps.matchAll(/Copy-Item "\$repo\\([^"]+)" (?:\$site|"\$site\\([^"]+)")( -Recurse)?/g)) {
  const src = path.join(repo, m[1].replace(/\\/g, '/'));
  const dst = path.join(site, (m[2] || path.basename(m[1])).replace(/\\/g, '/'));
  fs.cpSync(src, dst, { recursive: true });
}
for (const f of ['org-share.js', 'account-menu.js']) fs.writeFileSync(path.join(site, f), fs.readFileSync(path.join(repo, f), 'utf8').replace(FB, './fake-firebase.js'));
// pages
for (const m of ps.matchAll(/Build-Page '([^']+)' '([^']+)' (\$null|'[^']+') '([^']+)'/g)) {
  let html = fs.readFileSync(path.join(repo, m[1]), 'utf8').replace(FB, './fake-firebase.js');
  const head = m[3] === '$null' ? errHook : '<script src="' + m[3].slice(1, -1) + '"></script>';
  const i = html.indexOf('<head>') + 6;
  html = html.slice(0, i) + head + html.slice(i);
  const j = html.lastIndexOf('</body>');
  html = html.slice(0, j) + '<script type="module" src="' + m[4] + '"></script>' + html.slice(j);
  fs.writeFileSync(path.join(site, m[2]), html);
}
const menuPage = '<!doctype html><html><head><script src="menu-seed.js"></script></head><body><div class="wrap"><p>A page</p></div><script type="module" src="account-menu.js"></script><script type="module" src="menu-test.js"></script></body></html>';
fs.writeFileSync(path.join(site, 'menu-test.html'), menuPage);
fs.writeFileSync(path.join(site, 'consent-test.html'), '<!doctype html><html><head><script src="consent-seed.js"></script><script src="analytics.js"></script></head><body><div class="wrap"><p>A page</p></div><script type="module" src="account-menu.js"></script><script type="module" src="consent-test.js"></script></body></html>');
fs.writeFileSync(path.join(site, 'menu-off-test.html'), menuPage.replace('src="account-menu.js"', 'src="account-menu.js?menu=off"'));
fs.writeFileSync(path.join(site, 'profile.html'), menuPage);
fs.writeFileSync(path.join(site, 'share-test.html'), '<!doctype html><html><head>' + errHook + '</head><body><script type="module" src="share-test.js"></script></body></html>');

// the run list
const body = ps.slice(ps.indexOf('$results = @()'), ps.indexOf('} finally'));
const runs = [];
const tok = '0123456789abcdef0123456789abcdef';
const sub = (s, vars) => s.replace(/\$(\w+)/g, (m, k) => (k in vars ? vars[k] : m));
const lines = body.split('\n');
for (let i = 0; i < lines.length; i++) {
  const fe = lines[i].match(/foreach \(\$s in (.*?)\) \{(.*)$/);
  if (fe) {
    const list = [...fe[1].matchAll(/'([^']*)'/g)].map(x => x[1]);
    let block = fe[2];
    let depth = (block.match(/\{/g) || []).length - (block.match(/\}/g) || []).length + 1;
    while (depth > 0 && i + 1 < lines.length) { i++; block += '\n' + lines[i]; depth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length; }
    for (const s of list) {
      const vars = { s, base: 'http://127.0.0.1:8799', tok };
      const org = block.match(/\$org = if \(\$s -eq '([^']+)'\) \{ '([^']*)' \} else \{ '([^']*)' \}/);
      if (org) vars.org = s === org[1] ? org[2] : org[3];
      for (const r of block.matchAll(/Run-Page "([^"]+)" "([^"]+)" (\d+)/g)) runs.push({ label: sub(r[1], vars), url: sub(r[2], vars), budget: +r[3] });
    }
    continue;
  }
  const r = lines[i].match(/Run-Page (?:'([^']+)'|"([^"]+)") "([^"]+)" (\d+)/);
  if (r) runs.push({ label: r[1] || r[2], url: sub(r[3], { base: 'http://127.0.0.1:8799', tok }), budget: +r[4] });
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  let p = path.join(site, rel);
  if (!(fs.existsSync(p) && fs.statSync(p).isFile()) && fs.existsSync(p + '.html')) p += '.html';   // like GitHub Pages
  if (p.startsWith(site) && fs.existsSync(p) && fs.statSync(p).isFile()) {
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(p));
  } else { res.writeHead(404); res.end(); }
}).listen(8799);

{
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const list = runs.filter(r => !only || r.label.indexOf(only) > -1);
  let pass = 0, fail = 0; const bad = [];
  const queue = list.slice();
  async function worker() {
    while (queue.length) {
      const r = queue.shift();
      const ctx = await b.newContext({ timezoneId: 'America/Chicago' });
      const p = await ctx.newPage();
      let text = '';
      try {
        await p.goto(r.url, { waitUntil: 'load', timeout: 30000 });
        await p.waitForFunction(() => document.documentElement.getAttribute('data-results') || (document.body && document.body.getAttribute('data-results')), null, { timeout: Math.min(90000, Math.max(30000, r.budget)) });
        text = await p.evaluate(() => document.documentElement.getAttribute('data-results') || document.body.getAttribute('data-results'));   // like the PowerShell runner, which searches the whole page
      } catch (e) { text = (await p.title().catch(() => '')) || ''; }
      const ls = text ? text.split(' || ') : [];
      const ok = ls.filter(l => l.startsWith('PASS')).length;
      let ko = ls.filter(l => l.startsWith('FAIL') || l.startsWith('PAGE-ERROR'));
      if (!ok && !ko.length) ko = ['FAIL ' + r.label + ' produced no results'];
      pass += ok; fail += ko.length;
      if (ko.length) bad.push(r.label + ':\n   ' + ko.join('\n   '));
      console.log((ko.length ? 'FAIL ' : 'ok   ') + r.label.padEnd(40) + ' pass ' + ok + '  fail ' + ko.length);
      await ctx.close();
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  // The Apps Script checks in tests/apps-script/*-test.html run from the file itself and put their results in the title.
  const asDir = path.join(repo, 'tests', 'apps-script');
  for (const f of fs.readdirSync(asDir).filter(f => /-test\.html$/.test(f) && (!only || ('apps script: ' + f).indexOf(only) > -1))) {
    list.push({ label: 'apps script: ' + f });
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    let text = '';
    try {
      await p.goto('file://' + path.join(asDir, f));
      await p.waitForFunction(() => /PASS|FAIL|LOAD ERROR/.test(document.title), null, { timeout: 30000 });
      text = await p.title();
    } catch (e) { text = ''; }
    const ls = text ? text.split(' || ') : [];
    const ok = ls.filter(l => l.startsWith('PASS')).length;
    let ko = ls.filter(l => !l.startsWith('PASS'));
    if (!ok && !ko.length) ko = ['FAIL apps script: ' + f + ' produced no results'];
    pass += ok; fail += ko.length;
    if (ko.length) bad.push('apps script: ' + f + ':\n   ' + ko.join('\n   '));
    console.log((ko.length ? 'FAIL ' : 'ok   ') + ('apps script: ' + f).padEnd(40) + ' pass ' + ok + '  fail ' + ko.length);
    await ctx.close();
  }
  console.log('---\n' + bad.join('\n') + '\nTOTAL pass ' + pass + '   fail ' + fail + '   (' + list.length + ' pages)');
  await b.close(); server.close();
  process.exit(fail || !list.length ? 1 : 0);
}
