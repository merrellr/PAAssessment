// Tests for sitemap.xml and robots.txt: the sitemap lists exactly the pages that are meant to appear in Google.
// Run:  node --experimental-default-type=module tests/sitemap.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

const host = fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim();
const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const noindex = (f) => /<meta name="robots" content="[^"]*noindex/.test(fs.readFileSync(path.join(root, f), 'utf8'));
const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
const fileOf = (u) => { const p = new URL(u).pathname; return p === '/' ? 'index.html' : p.slice(1); };

console.log('--- the sitemap ---');
t('it is a sitemap in the standard format', /^<\?xml version="1.0" encoding="UTF-8"\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(xml) && /<\/urlset>\s*$/.test(xml));
t('it lists at least the home page', locs.length >= 1);
t('every address is on this site\'s own domain, over https', locs.every(u => new URL(u).protocol === 'https:' && new URL(u).host === host), host);
t('no address is listed twice', new Set(locs).size === locs.length);
t('the home page is listed as the bare domain, matching the page\'s own canonical link', locs.indexOf('https://' + host + '/') > -1 && /rel="canonical" href="https:\/\/assessment\.productadvisory\.co\/"/.test(fs.readFileSync(path.join(root, 'index.html'), 'utf8')));
t('every address is a real page in the site', locs.every(u => pages.indexOf(fileOf(u)) > -1), locs.filter(u => pages.indexOf(fileOf(u)) === -1).join());
t('no listed page tells Google not to index it (the two would contradict each other)', locs.every(u => !noindex(fileOf(u))), locs.filter(u => noindex(fileOf(u))).join());
const indexable = pages.filter(f => !noindex(f));
t('every page that may be indexed is listed, and nothing else', JSON.stringify(indexable.sort()) === JSON.stringify(locs.map(fileOf).sort()), 'indexable: ' + indexable.join() + ' | listed: ' + locs.map(fileOf).join());
t('every entry has a date in year-month-day form that is not in the future', Array.from(xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)).length === locs.length && Array.from(xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)).every(m => /^\d{4}-\d{2}-\d{2}$/.test(m[1]) && m[1] <= new Date().toISOString().slice(0, 10)));
t('the private and account pages carry "noindex" themselves', ['owner', 'owner-tools', 'owner-pilot', 'reports', 'company', 'join', 'request-info', 'lesson', 'profile', 'lms-dashboard', 'assessment-dashboard'].every(p => noindex(p + '.html')));

console.log('--- robots.txt ---');
t('it welcomes search engines', /^User-agent: \*\s*\nAllow: \//m.test(robots));
t('it points to the sitemap', robots.indexOf('Sitemap: https://' + host + '/sitemap.xml') > -1);
t('it does not block any page (a blocked page cannot show Google its "noindex")', !/^\s*Disallow:\s*\S/m.test(robots));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
