// Every page signs in through the same address: auth.productadvisory.co (Firebase Hosting, connected in
// Firebase console → Hosting; a CNAME at Domain.com points it to product-advisory-lms.web.app). Google's sign-in
// window shows this address, so a page left on the old product-advisory-lms.firebaseapp.com would look different.
// Run:  node --experimental-default-type=module tests/auth-domain.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

const files = fs.readdirSync(repo).filter(f => /\.(html|js)$/.test(f));
const withConfig = files.filter(f => /authDomain\s*:/.test(fs.readFileSync(path.join(repo, f), 'utf8')));
const wrong = withConfig.filter(f => !/authDomain\s*:\s*"auth\.productadvisory\.co"/.test(fs.readFileSync(path.join(repo, f), 'utf8')));
t('the pages that sign people in were found (' + withConfig.length + ')', withConfig.length >= 14, withConfig.join(', '));
t('every one of them signs in through auth.productadvisory.co', wrong.length === 0, wrong.join(', '));
const old = files.filter(f => /product-advisory-lms\.firebaseapp\.com/.test(fs.readFileSync(path.join(repo, f), 'utf8')));
t('no page still points at the old firebaseapp.com address', old.length === 0, old.join(', '));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
