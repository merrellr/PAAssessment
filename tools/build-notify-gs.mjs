// Builds apps-script/notify.gs: the pure logic the email check-ins need (company-core.js,
// company-report.js and notify-core.js, unchanged), as one file to paste into Apps Script
// next to Code.gs. Run after changing any of those three files:
//   node tools/build-notify-gs.mjs
// tests/notify-core.test.mjs fails if apps-script/notify.gs is out of date.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCES = ['company-core.js', 'company-report.js', 'notify-core.js'];

export function renderNotifyGs() {
  const head = '/* ==================================================================\n' +
    '   notify.gs: GENERATED, do not edit here.\n' +
    '   ------------------------------------------------------------------\n' +
    '   The check-in and company-report logic, shared with the website:\n' +
    '   ' + SOURCES.join(', ') + '.\n' +
    '   Rebuild with: node tools/build-notify-gs.mjs\n' +
    '   In the Apps Script editor this is a second file next to Code.gs\n' +
    '   (Files > + > Script, name it "notify"). Paste the whole file.\n' +
    '   ================================================================== */\n';
  return head + SOURCES.map(f => '\n/* ----- ' + f + ' ----- */\n' + fs.readFileSync(path.join(root, f), 'utf8').replace(/\s+$/, '') + '\n').join('');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(root, 'apps-script', 'notify.gs'), renderNotifyGs());
  console.log('Wrote apps-script/notify.gs');
}
