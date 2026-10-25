/* Two-step verification (2FA) with an authenticator app: Google Authenticator, Microsoft Authenticator, 1Password and
   the like. Firebase calls it TOTP multi-factor authentication. It is switched on for the project in Identity
   Platform (see docs/OWNER-RUNBOOK.md, "Two-step verification"); this file is everything the pages need:

     withTwoStep(auth, run)       runs a sign-in (or a "confirm it's you"); if the account has two-step verification,
                                  asks for the 6-digit code and finishes the sign-in. Cancelling throws
                                  { code: 'auth/two-step-cancelled' }.
     hasTwoStep(user)             true when the account has an authenticator app set up
     setUpTwoStep(auth, user)     the set-up: a QR code to scan, then a code to confirm. Resolves true when done,
                                  false when cancelled.
     turnOffTwoStep(auth, user)   removes it (after confirming it's you). Resolves true when done.
     twoStepError(code)           a sentence for the errors these can throw, or ''

   Firebase needs a verified email before it adds a second step ('auth/unverified-email'), and a recent sign-in
   ('auth/requires-recent-login'): setting up and turning off ask the person to confirm it's them, then carry on.
   The QR code is drawn by vendor/qrcode.js (qrcode-generator, MIT), loaded the first time it is needed. */
import {
  multiFactor, TotpMultiFactorGenerator, getMultiFactorResolver,
  reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider, GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const ISSUER = 'Product Advisory';
const LOGO = 'https://www.productadvisory.co/assets/img/favicon-192.png';   // shown by apps that read it (FreeOTP, 2FAS, Aegis)

// The link the QR code holds (otpauth://, the "Key URI" format authenticator apps read). Built here, not with
// Firebase's generateQrCodeUrl, which leaves the issuer unencoded: "Product Advisory" then has a raw space, and apps
// misread the name (and guess a wrong logo).
function keyUri(secret, account){
  const enc = encodeURIComponent;
  return 'otpauth://totp/' + enc(ISSUER) + ':' + enc(account) + '?secret=' + enc(secret.secretKey) + '&issuer=' + enc(ISSUER) +
    '&algorithm=' + enc(secret.hashingAlgorithm || 'SHA1') + '&digits=' + enc(String(secret.codeLength || 6)) +
    '&period=' + enc(String(secret.codeIntervalSeconds || 30)) + '&image=' + enc(LOGO);
}

/* ---------- the dialog: one at a time, a title, some content, an optional input and two buttons ---------- */
const CSS = `
.pa-2s-back{position:fixed;inset:0;z-index:1000;background:rgba(10,21,38,.55);display:flex;align-items:center;justify-content:center;padding:16px}
.pa-2s{background:var(--surface,#fff);color:var(--ink,#16233a);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);width:100%;max-width:440px;max-height:calc(100vh - 32px);overflow:auto;padding:24px 24px 20px;font-family:inherit}
.pa-2s h2{margin:0 0 8px;font-size:1.25rem;color:var(--navy,#1c4587)}
.pa-2s p{margin:0 0 12px;line-height:1.5;font-size:.95rem}
.pa-2s ol{margin:0 0 12px;padding-left:20px;font-size:.95rem;line-height:1.5}
.pa-2s .pa-2s-qr{display:flex;justify-content:center;margin:4px 0 10px}
.pa-2s .pa-2s-qr svg{width:180px;height:180px;background:#fff;padding:6px;border-radius:8px;border:1px solid var(--line,#d9dee7)}
.pa-2s .pa-2s-key{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.95rem;letter-spacing:.06em;background:var(--tint,#eef3fb);border-radius:8px;padding:8px 10px;word-break:break-all;margin:0 0 12px;user-select:all}
.pa-2s label{display:block;font-weight:700;font-size:.9rem;margin:4px 0 6px}
.pa-2s input{width:100%;box-sizing:border-box;font:inherit;font-size:1.1rem;padding:10px 12px;border:1.5px solid var(--line,#d9dee7);border-radius:10px;background:var(--surface,#fff);color:var(--ink,#16233a)}
.pa-2s input.code{letter-spacing:.3em;font-variant-numeric:tabular-nums}
.pa-2s input:focus{outline:3px solid var(--cyan,#35c2e8);outline-offset:1px}
.pa-2s .pa-2s-err{color:var(--warn,#b3261e);font-size:.9rem;min-height:1.2em;margin:8px 0 0}
.pa-2s .pa-2s-btns{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}
.pa-2s button{font:inherit;font-weight:700;border-radius:999px;padding:9px 18px;cursor:pointer;border:1.5px solid var(--navy,#1c4587)}
.pa-2s button.go{background:var(--navy,#1c4587);color:var(--btn-ink,#fff)}
.pa-2s button.no{background:transparent;color:var(--navy,#1c4587)}
.pa-2s button:disabled{opacity:.55;cursor:default}
.pa-2s .pa-2s-fine{font-size:.82rem;color:var(--gray,#5f6b7a)}
.pa-2s .pa-2s-fine a{color:var(--navy,#1c4587);font-weight:600}`;

function ensureCss(){
  if (document.getElementById('pa-2s-css')) return;
  const s = document.createElement('style');
  s.id = 'pa-2s-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

let open = null;   // only one dialog at a time
/* o: { title, body (HTML string, trusted: built here), input: { label, type, autocomplete, inputmode, code }, submit, cancel,
   onSubmit(value) → resolves the dialog's result, or throws an Error whose .message is shown } → the result, or null if cancelled */
function dialog(o){
  ensureCss();
  if (open) open.cancel();
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'pa-2s-back';
    const id = 'pa2s' + Date.now();
    back.innerHTML = '<div class="pa-2s" role="dialog" aria-modal="true" aria-labelledby="' + id + '"><h2 id="' + id + '"></h2><div class="pa-2s-body"></div>' +
      (o.input ? '<label for="' + id + 'i"></label><input id="' + id + 'i">' : '') +
      '<p class="pa-2s-err" role="alert"></p><div class="pa-2s-btns"><button type="button" class="no"></button><button type="button" class="go"></button></div></div>';
    const box = back.firstChild, go = box.querySelector('.go'), no = box.querySelector('.no'), err = box.querySelector('.pa-2s-err');
    box.querySelector('h2').textContent = o.title;
    box.querySelector('.pa-2s-body').innerHTML = o.body || '';
    go.textContent = o.submit || 'Continue';
    no.textContent = o.cancel || 'Cancel';
    const input = box.querySelector('input');
    if (input){
      box.querySelector('label').textContent = o.input.label;
      input.type = o.input.type || 'text';
      if (o.input.autocomplete) input.autocomplete = o.input.autocomplete;
      if (o.input.code){ input.className = 'code'; input.inputMode = 'numeric'; input.autocomplete = 'one-time-code'; input.maxLength = 6; input.placeholder = '123456'; }
    }
    const before = document.activeElement;
    let busy = false;
    const close = (result) => {
      back.remove(); open = null;
      document.removeEventListener('keydown', onKey, true);
      if (before && before.focus) try { before.focus(); } catch (e) { /* gone */ }
      resolve(result);
    };
    const submit = async () => {
      if (busy) return;
      const value = input ? input.value.replace(/\s+/g, o.input.code ? '' : ' ').trim() : '';
      if (input && !value){ err.textContent = o.input.code ? 'Enter the 6-digit code.' : 'Enter it to continue.'; input.focus(); return; }
      if (o.input && o.input.code && !/^\d{6}$/.test(value)){ err.textContent = 'The code is 6 digits.'; input.focus(); return; }
      busy = true; go.disabled = true; err.textContent = '';
      try { close(await o.onSubmit(value)); }
      catch (e){ busy = false; go.disabled = false; err.textContent = e.message || 'That didn\'t work. Try again.'; if (input){ input.select(); input.focus(); } }
    };
    const onKey = (e) => {
      if (e.key === 'Escape'){ e.preventDefault(); if (!busy) close(null); }
      if (e.key === 'Enter' && input && document.activeElement === input){ e.preventDefault(); submit(); }
      if (e.key === 'Tab'){   // keep focus inside the dialog
        const f = Array.from(box.querySelectorAll('input,button:not(:disabled),a[href]'));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    };
    go.addEventListener('click', submit);
    no.addEventListener('click', () => { if (!busy) close(null); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(back);
    open = { cancel: () => close(null) };
    (input || go).focus();
  });
}

/* ---------- what the errors mean ---------- */
const CODE_WRONG = new Set(['auth/invalid-verification-code', 'auth/invalid-totp-code', 'auth/missing-code']);
export function twoStepError(code){
  if (CODE_WRONG.has(code)) return 'That code didn\'t match. Check the code for Product Advisory in your app and try again: they change every 30 seconds.';
  return {
    'auth/two-step-cancelled': 'Sign-in cancelled.',
    'auth/unverified-email': 'Confirm your email address first: open the link we emailed you (or send a new one from My Profile), then set this up.',
    'auth/requires-recent-login': 'For your security, sign out and back in, then try again.',
    'auth/operation-not-allowed': 'Two-step verification isn\'t available right now. Please try again later.',
    'auth/maximum-second-factor-count-exceeded': 'This account already has the most authenticator apps it can have.',
    'auth/second-factor-already-in-use': 'This authenticator is already set up on your account.',
    'auth/too-many-requests': 'Too many tries. Wait a few minutes, then try again.',
    'auth/unsupported-first-factor': 'Two-step verification can\'t be added to this kind of sign-in.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site, then try again.',
    'auth/network-request-failed': 'We couldn\'t reach the sign-in service. Check your connection, then try again.'
  }[code] || '';
}
function shown(e){ return new Error(twoStepError(e && e.code) || 'That didn\'t work. Try again.'); }

/* ---------- signing in ---------- */
export async function withTwoStep(auth, run){
  try { return await run(); }
  catch (e){
    if (!e || e.code !== 'auth/multi-factor-auth-required') throw e;
    const resolver = getMultiFactorResolver(auth, e);
    const hint = resolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!hint) throw Object.assign(new Error('unsupported'), { code: 'auth/operation-not-allowed' });
    const cred = await dialog({
      title: 'Enter your 6-digit code',
      body: '<p>Open your authenticator app and enter the current code for <b>Product Advisory</b>.</p>',
      input: { label: 'Code', code: true }, submit: 'Verify',
      onSubmit: async (code) => {
        try { return await resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code)); }
        catch (x){ throw shown(x); }
      }
    });
    if (!cred) throw Object.assign(new Error('cancelled'), { code: 'auth/two-step-cancelled' });
    return cred;
  }
}

export function hasTwoStep(user){
  try { return !!(user && multiFactor(user).enrolledFactors.length); } catch (e) { return false; }
}

/* ---------- confirm it's you (Firebase asks for a recent sign-in before changing the second step) ---------- */
async function confirmItsYou(auth, user){
  const pw = user.providerData.some(p => p.providerId === 'password');
  if (!pw){
    // The Google window opens from the button in this dialog: browsers block one that opens on its own after a wait.
    const ok = await dialog({
      title: 'Confirm it\'s you',
      body: '<p>For your security, confirm with your Google account to continue.</p>', submit: 'Continue with Google',
      onSubmit: async () => {
        try { await withTwoStep(auth, () => reauthenticateWithPopup(user, new GoogleAuthProvider())); return true; }
        catch (x){
          if (x && /two-step-cancelled|popup-closed-by-user|cancelled-popup-request/.test(x.code)) return false;
          throw new Error(twoStepError(x && x.code) || 'That didn\'t work' + (x && x.code ? ' (' + x.code + ')' : '') + '. Try again.');
        }
      }
    });
    return !!ok;
  }
  const ok = await dialog({
    title: 'Confirm it\'s you',
    body: '<p>For your security, enter your password to continue.</p>',
    input: { label: 'Password', type: 'password', autocomplete: 'current-password' }, submit: 'Continue',
    onSubmit: async (password) => {
      try { await withTwoStep(auth, () => reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))); return true; }
      catch (x){
        if (x && x.code === 'auth/two-step-cancelled') return false;
        throw new Error(/wrong-password|invalid-credential|invalid-login/.test(x && x.code) ? 'That password isn\'t right.' : (twoStepError(x && x.code) || 'That didn\'t work. Try again.'));
      }
    }
  });
  return !!ok;
}
// Runs a change; when Firebase wants a recent sign-in, confirms it's them and runs it once more. A passing hiccup
// (network, or Firebase's own internal error) gets one quiet retry first.
const PASSING = new Set(['auth/network-request-failed', 'auth/internal-error', 'auth/timeout']);
async function fresh(auth, user, change){
  try {
    try { return await change(); }
    catch (e){ if (!e || !PASSING.has(e.code)) throw e; await new Promise(r => setTimeout(r, 700)); return await change(); }
  }
  catch (e){
    if (!e || e.code !== 'auth/requires-recent-login') throw e;
    if (!(await confirmItsYou(auth, user))) return null;
    return change();
  }
}

/* ---------- setting up ---------- */
let qrLoading = null;
function loadQr(){
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (!qrLoading){
    qrLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/qrcode.js', import.meta.url).href;
      s.onload = () => resolve(window.qrcode);
      s.onerror = () => { qrLoading = null; reject(new Error('qr')); };
      document.head.appendChild(s);
    });
  }
  return qrLoading;
}
function qrSvg(text, make){
  const q = make(0, 'M'); q.addData(text); q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: 'QR code to scan with your authenticator app' });
}
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function setUpTwoStep(auth, user){
  const secret = await fresh(auth, user, async () => TotpMultiFactorGenerator.generateSecret(await multiFactor(user).getSession()));
  if (!secret) return false;
  const uri = keyUri(secret, user.email || 'account');
  let qr = '';
  try { qr = qrSvg(uri, await loadQr()); } catch (e) { qr = ''; }   // no QR: the key below still works
  const key = String(secret.secretKey || '').replace(/(.{4})/g, '$1 ').trim();
  const done = await dialog({
    title: 'Set up two-step verification',
    body: '<ol><li>Open an authenticator app on your phone, such as Google Authenticator or Microsoft Authenticator.</li>' +
      '<li>' + (qr ? 'Scan this QR code' : 'Add an account') + ', or enter the key below.</li><li>Type the 6-digit code it shows.</li></ol>' +
      (qr ? '<div class="pa-2s-qr">' + qr + '</div>' : '') +
      '<p class="pa-2s-fine"><a href="' + esc(uri) + '">On this phone? Tap here to add it to your authenticator app.</a></p>' +
      '<p class="pa-2s-fine">Key (if you can\'t scan):</p><p class="pa-2s-key">' + esc(key) + '</p>',
    input: { label: '6-digit code from the app', code: true }, submit: 'Turn on',
    onSubmit: async (code) => {
      try { await multiFactor(user).enroll(TotpMultiFactorGenerator.assertionForEnrollment(secret, code), 'Authenticator app'); return true; }
      catch (x){ throw shown(x); }
    }
  });
  return !!done;
}

export async function turnOffTwoStep(auth, user){
  const ok = await dialog({
    title: 'Turn off two-step verification?',
    body: '<p>Signing in will only need your password or Google account again. You can turn it back on any time.</p>',
    submit: 'Turn off', cancel: 'Keep it on', onSubmit: async () => true
  });
  if (!ok) return false;
  const done = await fresh(auth, user, async () => {
    for (const f of multiFactor(user).enrolledFactors.slice()) await multiFactor(user).unenroll(f);
    return true;
  });
  return !!done;
}
