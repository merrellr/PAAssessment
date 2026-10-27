// What Google may index on assessment.productadvisory.co. Each page loads at two addresses (/framework and
// /framework.html), so a public page names its one address with a canonical link; pages behind sign-in, and the
// forms they lead to, say noindex. Every page in the sitemap is a public page with a canonical matching its entry.
// Run:  node --experimental-default-type=module tests/seo.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

const pages = fs.readdirSync(repo).filter(f => f.endsWith('.html'));
const read = (f) => fs.readFileSync(path.join(repo, f), 'utf8');
const canonical = (s) => (s.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
const noindex = (s) => /<meta name="robots" content="noindex[^"]*">/.test(s);
const neither = pages.filter(f => !canonical(read(f)) && !noindex(read(f)));
t('every page either names its address (canonical) or says noindex', neither.length === 0, neither.join(', '));
const both = pages.filter(f => canonical(read(f)) && noindex(read(f)));
t('no page does both', both.length === 0, both.join(', '));
const wrong = pages.filter(f => { const c = canonical(read(f)); return c && c !== 'https://assessment.productadvisory.co/' + (f === 'index.html' ? '' : f.replace(/\.html$/, '')); });
t('each canonical is the page\'s own clean address', wrong.length === 0, wrong.join(', '));
const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const missing = locs.filter(u => !pages.some(f => canonical(read(f)) === u));
t('every sitemap entry (' + locs.length + ') is a page with that canonical', locs.length >= 3 && missing.length === 0, missing.join(', '));
const noIcon = pages.filter(f => !/<link rel="icon" href="\/images\/icons\/favicon\.svg"/.test(read(f)) || !/<link rel="apple-touch-icon"/.test(read(f)));
t('every page has the Product Advisory icon, for the browser tab and for iPhone link previews', noIcon.length === 0, noIcon.join(', '));
for (const f of ['index.html', 'framework.html', 'tool-requests.html']) {
  const s = read(f), img = (s.match(/<meta property="og:image" content="([^"]+)">/) || [])[1];
  t(f + ' has a sharing image that exists, and a large preview card', !!img && fs.existsSync(path.join(repo, img.replace('https://assessment.productadvisory.co/', ''))) && /<meta name="twitter:card" content="summary_large_image">/.test(s) && (s.match(/<meta property="og:url" content="([^"]+)">/) || [])[1] === canonical(s), img);
}
for (const icon of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) t('images/icons/' + icon + ' exists', fs.existsSync(path.join(repo, 'images/icons', icon)));
for (const f of ['lms-dashboard.html', 'profile.html', 'lesson.html', 'owner.html'])
  t(f + ' (behind sign-in) says noindex', noindex(read(f)));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
