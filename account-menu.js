/* The "Profile" menu in the top right corner, for every page except the learning
   dashboard (which has its own). It appears only while someone is signed in, and
   shows the links that person is allowed to use: owner and company links only show
   up for the owner and for company admins. Add it to a page with one line, just
   before </body>:   <script type="module" src="account-menu.js"></script>        */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { hasTwoStep } from "./two-step.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcECtS5c6WeOhKlwRK-LYFE47npbuq_eU",
  authDomain: "auth.productadvisory.co",
  projectId: "product-advisory-lms",
  storageBucket: "product-advisory-lms.firebasestorage.app",
  messagingSenderId: "1081134406437",
  appId: "1:1081134406437:web:72e28604d093219e7698cc"
};

// "account-menu.js?menu=off" does everything except draw the button (for the dashboard, which has its own menu,
// and the invitation page).
const MENU = new URL(import.meta.url).searchParams.get('menu') !== 'off';

// Not inside a frame (for example a page embedded in another site).
if (window.self === window.top) {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  let wrap = null;
  let placer = null;   // the function that keeps the button level with the logo
  let token = 0;   // a newer sign-in or sign-out makes an older, slower lookup stop

  const STYLE = [
    '.pa-acct{position:absolute;z-index:40;font-family:"Space Grotesk","IBM Plex Sans",system-ui,sans-serif;}',
    '.pa-acct-btn{display:flex;align-items:center;gap:7px;padding:7px 14px 7px 10px;border-radius:20px;background:var(--navy,#1A4584);color:var(--btn-ink,#fff);border:none;cursor:pointer;font:600 13px "Space Grotesk","IBM Plex Sans",system-ui,sans-serif;}',
    '.pa-acct-btn:hover{background:var(--primary-strong,#12325F);}',
    '.pa-avatar{width:22px;height:22px;border-radius:50%;object-fit:cover;display:block;margin:-3px 0;box-shadow:0 0 0 1.5px rgba(255,255,255,.85);}',
    '.pa-acct-btn:focus-visible,.pa-acct-item:focus-visible{outline:3px solid var(--cyan,#35C2E8);outline-offset:2px;}',
    '.pa-acct-menu{position:absolute;right:0;top:42px;width:250px;max-width:calc(100vw - 32px);background:var(--surface,#fff);border:1px solid var(--line,#DCE3EE);border-radius:12px;box-shadow:0 8px 24px rgba(22,33,62,0.12);padding:14px;}',
    '.pa-acct-menu[hidden]{display:none;}',
    '.pa-acct-name{font-weight:600;font-size:14.5px;color:var(--ink,#16213E);}',
    '.pa-acct-email{font:400 12.5px "IBM Plex Sans",system-ui,sans-serif;color:var(--ink-soft,#4A5568);word-break:break-all;}',
    '.pa-acct-rule{height:1px;background:var(--line,#DCE3EE);margin:10px 0;}',
    '.pa-acct-item{display:block;width:100%;box-sizing:border-box;text-align:left;padding:8px 4px;font:400 13.5px "IBM Plex Sans",system-ui,sans-serif;color:var(--ink,#16213E);text-decoration:none;cursor:pointer;border:none;background:none;border-radius:6px;}',
    '.pa-acct-item:hover{background:var(--bg,#F7F9FC);}',
    '.pa-acct-item[aria-current="page"]{font-weight:600;color:var(--navy,#1A4584);}',
    '.pa-acct-label{font:700 10.5px "IBM Plex Sans",system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--gray,#8A94A6);margin:2px 4px 2px;}',
    '.pa-acct-badge{display:inline-block;margin-top:7px;padding:2px 9px;border-radius:999px;font:700 10.5px "IBM Plex Sans",system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;background:var(--bg,#F1F4F9);color:var(--ink-soft,#4A5568);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box;}',
    '.pa-acct-badge.is-super{background:var(--navy,#1A4584);color:var(--btn-ink,#fff);}',
    '.pa-acct-badge.is-admin{background:var(--tint,#E8F6FC);color:var(--cyan-ink,#0B6E8C);}',
    '.pa-acct-out{color:var(--warn,#C0622A);}',
    '@media print{.pa-acct{display:none;}}'
  ].join('');

  function el(tag, cls, text){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function link(label, href, here, newTab){
    const a = el('a', 'pa-acct-item', label);
    a.href = href;
    if (newTab){ a.target = '_blank'; a.rel = 'noopener'; }
    if (here) a.setAttribute('aria-current', 'page');
    return a;
  }
  function currentPage(){
    // The file name, whether the address is clean (/company) or not (/company.html).
    const seg = location.pathname.split('/').pop();
    return !seg ? 'index.html' : /\.html$/.test(seg) ? seg : seg + '.html';
  }

  // Who this account is here: Super admin (Product Advisory's own team), a company's admin, or a learner.
  function roleBadge(flags){
    const b = el('span', 'pa-acct-badge');
    b.id = 'paAccountRole';
    if (flags.owner){ b.classList.add('is-super'); b.textContent = 'Super admin'; }
    else if (flags.companyAdmin){ b.classList.add('is-admin'); b.textContent = 'Company admin' + (flags.orgName ? ' · ' + flags.orgName : ''); b.title = b.textContent; }
    else b.textContent = 'Learner';
    return b;
  }

  function remove(){
    if (wrap){ wrap.remove(); wrap = null; }
    if (placer){ window.removeEventListener('resize', placer); window.removeEventListener('load', placer); placer = null; }
  }

  function close(returnFocus){
    if (!wrap) return;
    const menu = wrap.querySelector('.pa-acct-menu');
    const btn = wrap.querySelector('.pa-acct-btn');
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) btn.focus();
  }

  function mount(user, flags){
    remove();
    if (!document.getElementById('pa-acct-style')){
      const s = el('style'); s.id = 'pa-acct-style'; s.textContent = STYLE; document.head.appendChild(s);
    }
    const page = currentPage();
    wrap = el('div', 'pa-acct');
    wrap.id = 'paAccount';

    const btn = el('button', 'pa-acct-btn');
    btn.type = 'button';
    btn.id = 'paAccountBtn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Account menu');
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
    btn.appendChild(document.createTextNode('Profile'));

    const menu = el('div', 'pa-acct-menu');
    menu.id = 'paAccountMenu';
    menu.hidden = true;
    menu.appendChild(el('div', 'pa-acct-name', user.displayName || (user.email || '').split('@')[0] || 'Your account'));
    menu.appendChild(el('div', 'pa-acct-email', user.email || ''));
    menu.appendChild(roleBadge(flags));
    const section = (label) => { menu.appendChild(el('div', 'pa-acct-rule')); if (label) menu.appendChild(el('div', 'pa-acct-label', label)); };

    section('My Learning');
    menu.appendChild(link('My Learning', '/lms-dashboard', page === 'lms-dashboard.html'));
    menu.appendChild(link('My Profile', '/profile', page === 'profile.html'));
    menu.appendChild(link('My Badges', '/profile#badges', false));
    menu.appendChild(link('My toolkit', '/my-tools', page === 'my-tools.html'));
    if (flags.companyAdmin || flags.owner){
      section(flags.owner ? 'Manage' : 'My company');
      if (flags.companyAdmin) menu.appendChild(link('Company dashboard', '/company', page === 'company.html'));
      if (flags.owner){
        menu.appendChild(link('Owner console', '/owner', page === 'owner.html'));
        menu.appendChild(link('Reports', '/reports', page === 'reports.html'));
      }
    }
    section('Product Advisory');
    menu.appendChild(link('Request tools', '/tool-requests#suggest', page === 'tool-requests.html'));
    menu.appendChild(link('Visit Product Advisory ↗', 'https://www.productadvisory.co/', false, true));
    section('Help');
    menu.appendChild(link('Send feedback', '/feedback', page === 'feedback.html'));
    if (window.PAAnalytics && window.PAAnalytics.reopen){
      const cookies = el('button', 'pa-acct-item', 'Cookie settings');
      cookies.type = 'button';
      cookies.id = 'paAccountCookies';
      cookies.addEventListener('click', () => { close(false); window.PAAnalytics.reopen(); });
      menu.appendChild(cookies);
    }
    section('');
    const out = el('button', 'pa-acct-item pa-acct-out', 'Log out');
    out.type = 'button';
    out.id = 'paAccountLogout';
    out.addEventListener('click', () => { close(false); signOut(auth); });
    menu.appendChild(out);

    btn.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    wrap.append(btn, menu);

    // On themed pages the site header has a slot for it (pa-shell.js).
    const slot = document.getElementById('paNavAccount');
    if (slot){ slot.appendChild(wrap); return; }
    // Otherwise sit in the corner of the page's own column, level with the logo, when it has one.
    const col = document.querySelector('.wrap') || document.querySelector('.card') || document.body;
    if (getComputedStyle(col).position === 'static') col.style.position = 'relative';
    const isWrap = col.classList.contains('wrap');
    const padTop = isWrap ? parseFloat(getComputedStyle(col).paddingTop) || 0 : 0;
    wrap.style.top = (isWrap ? padTop + 2 : 12) + 'px';
    wrap.style.right = (isWrap ? 16 : 12) + 'px';
    col.appendChild(wrap);
    // Line the button up with the middle of the page's logo, when there is one.
    const logo = col.querySelector('.brand-header svg, .brand-header-left svg, a[href="/lms-dashboard"] > svg');
    if (logo){
      const place = () => {
        const l = logo.getBoundingClientRect(), c = col.getBoundingClientRect();
        if (l.height > 0) wrap.style.top = Math.max(0, Math.round(l.top - c.top + l.height / 2 - btn.offsetHeight / 2)) + 'px';
      };
      place();
      placer = place;
      window.addEventListener('resize', place);
      window.addEventListener('load', place);
    }
  }

  document.addEventListener('click', (e) => { if (wrap && !wrap.contains(e.target)) close(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wrap && !wrap.querySelector('.pa-acct-menu').hidden) close(true);
  });

  async function lookUp(user){
    const flags = { owner: false, companyAdmin: false };
    await Promise.all([
      getDoc(doc(db, 'platformAdmins', user.uid)).then(s => { flags.owner = s.exists(); }).catch(() => { /* not the owner, or the rules are not published */ }),
      getDoc(doc(db, 'memberships', user.uid)).then(s => {
        const m = s.exists() ? s.data() : null;
        flags.companyAdmin = !!(m && m.status === 'active' && m.role === 'admin');
        flags.orgName = flags.companyAdmin && m.orgName ? String(m.orgName) : '';
      }).catch(() => { /* no company */ })
    ]);
    return flags;
  }

  /* The welcome email. A brand-new account (made in the last two days) asks the email script, once, to send it.
     The script checks the sign-in token, sends only to that account's own address, and remembers who has had one,
     so asking again is harmless. If it fails (script busy, Gmail limit) the page simply asks again next time. */
  const BACKEND = "https://script.google.com/macros/s/AKfycbyMQnshyho2q3igshqZmIm6RyJCYl1WsRJbShHz2blCt81iVmlngeNlYfO0QltR7TjwHg/exec";
  const WELCOME_WITHIN_MS = 2 * 86400000;
  const askedThisPage = {};
  function backend(params){
    return new Promise((resolve) => {
      const cb = 'paWelcomeCb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
      const script = document.createElement('script');
      let settled = false;
      const finish = (v) => { if (settled) return; settled = true; clearTimeout(timer); delete window[cb]; script.remove(); resolve(v); };
      const timer = setTimeout(() => finish(null), 20000);
      window[cb] = (r) => finish(r || null);
      script.onerror = () => finish(null);
      script.src = BACKEND + '?' + new URLSearchParams(Object.assign({}, params, { callback: cb })).toString();
      document.body.appendChild(script);
    });
  }
  // For the search menu's "Ask AI" (pa-shell.js) and the feedback form: the signed-in person's token, and the same
  // JSONP call to the script.
  window.PAAccount = {
    user: null, ready: false,
    idToken: () => (auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null)),
    backend: backend
  };

  async function welcomeIfNew(user){
    try {
      const made = user.metadata && user.metadata.creationTime ? Date.parse(user.metadata.creationTime) : 0;
      if (!made || Date.now() - made > WELCOME_WITHIN_MS || askedThisPage[user.uid]) return;
      const key = 'pa_welcomed_' + user.uid;
      try { if (localStorage.getItem(key) === '1') return; } catch (e) { /* storage blocked: the script still sends only once */ }
      askedThisPage[user.uid] = true;
      const res = await backend({ action: 'welcome', idToken: await user.getIdToken() });
      if (res && res.ok === true){ try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ } }
      else delete askedThisPage[user.uid];
    } catch (e) { /* never get in the way of the page */ }
  }

  /* The welcome for a company's admin: once they are an active admin who joined in the last two days, ask the script
     (once per company) to send it. The script re-reads their membership with their own token, so it cannot be used
     to send anything else. The invitation page announces a new membership with the "pa-membership-changed" event. */
  const askedAdmin = {};
  async function adminWelcomeIfDue(user){
    try {
      const m = await getDoc(doc(db, 'memberships', user.uid));
      if (!m.exists()) return;
      const d = m.data();
      const joined = d.joinedAt && d.joinedAt.toMillis ? d.joinedAt.toMillis() : 0;
      if (d.status !== 'active' || d.role !== 'admin' || !d.orgId || !joined || Date.now() - joined > WELCOME_WITHIN_MS) return;
      const key = 'pa_adminwelcomed_' + user.uid + '_' + d.orgId;
      try { if (localStorage.getItem(key) === '1') return; } catch (e) { /* storage blocked: the script still sends only once */ }
      if (askedAdmin[key]) return;
      askedAdmin[key] = true;
      const res = await backend({ action: 'adminWelcome', idToken: await user.getIdToken(), org: d.orgId });
      if (res && res.ok === true){ try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ } }
      else delete askedAdmin[key];
    } catch (e) { /* never get in the way of the page */ }
  }
  window.addEventListener('pa-membership-changed', () => { if (auth.currentUser) adminWelcomeIfDue(auth.currentUser); });

  /* The profile photo (set on My profile) on the Profile button: this menu's and the dashboard's own. It is a small
     JPEG kept on the person's own progress/{uid}.profile.photo, cached on this browser so it shows straight away. */
  const PHOTO = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
  let photoUid = '', photoUrl = '';
  function paintAvatar(){
    ['.pa-acct-btn', '#profileAvatarBtn'].forEach(sel => {
      const b = document.querySelector(sel);
      if (!b) return;
      const icon = b.querySelector('svg'), img = b.querySelector('img.pa-avatar');
      if (photoUrl){
        if (img) img.src = photoUrl;
        else { const i = document.createElement('img'); i.className = 'pa-avatar'; i.alt = ''; i.src = photoUrl; b.insertBefore(i, b.firstChild); }
        if (icon) icon.style.display = 'none';
      } else {
        if (img) img.remove();
        if (icon) icon.style.display = '';
      }
    });
  }
  function setPhoto(url){
    photoUrl = PHOTO.test(url || '') ? url : '';
    try { if (photoUrl) localStorage.setItem('pa_avatar_' + photoUid, photoUrl); else localStorage.removeItem('pa_avatar_' + photoUid); } catch (e) { /* fine */ }
    paintAvatar();
  }
  async function loadPhoto(user){
    photoUid = user.uid;
    try { photoUrl = localStorage.getItem('pa_avatar_' + user.uid) || ''; } catch (e) { photoUrl = ''; }
    paintAvatar();
    try {
      const snap = await getDoc(doc(db, 'progress', user.uid));
      if (photoUid === user.uid) setPhoto(snap.exists() && snap.data().profile ? snap.data().profile.photo : '');
    } catch (e) { /* keep the cached one */ }
  }
  // My profile announces a new or removed photo, so the button changes at once.
  window.addEventListener('pa-avatar', (e) => { if (photoUid) setPhoto(e.detail || ''); });


  /* Two-step verification (two-step.js): a small card inviting people to turn it on, once their email is verified.
     Only for accounts that sign in with a password: Google already has its own two-step check, so a Google-only
     account (whatever its role) is never asked for a second one. Required for the owner and company admins (they can
     see other people's results): their card comes back on every page until it is on ("Later" hides it for this page
     only). Everyone else can say "Not now", which hides it for 30 days on this device.
     Not on the first visit: that belongs to the welcome, then the "tell us about your team" card (which earns a
     badge). The card waits for a later sign-in (or a week), and while the dashboard is still asking for those
     details it waits for them too (for up to two weeks). Not shown on a page with the setting itself (My Profile,
     #two-step) or the invitation page. "Don't remind me again" turns the card off for good, on every device
     (progress/{uid}.twoStepNudgeOff); the setting stays in My Profile. */
  const TWO_STEP_SNOOZE_MS = 30 * 86400000, HOUR_MS = 3600000, DAY_MS = 86400000;
  async function twoStepNudge(user, flags){
    const page = location.pathname.replace(/\.html$/, '').split('/').pop();
    if (document.getElementById('two-step') || page === 'join' || !user.emailVerified || hasTwoStep(user) || document.getElementById('pa-2s-nudge')) return;
    if (!(user.providerData || []).some(p => p.providerId === 'password')) return;
    const meta = user.metadata || {};
    const made = Date.parse(meta.creationTime || '') || 0, last = Date.parse(meta.lastSignInTime || '') || 0;
    const age = made ? Date.now() - made : Infinity;
    if (made && age < 7 * DAY_MS && !(last - made >= HOUR_MS)) return;   // still the first sign-in
    const required = !!(flags.owner || flags.companyAdmin);
    const key = 'pa_2step_snooze_' + user.uid, offKey = 'pa_2step_off_' + user.uid;
    try { if (localStorage.getItem(offKey)) return; } catch (e) { /* storage off */ }
    try {
      const p = await getDoc(doc(db, 'progress', user.uid));
      const d = p.exists() ? p.data() : {}, prof = d.profile || {};
      if (d.twoStepNudgeOff) return;
      // The welcome and the profile card come first.
      if (age < 14 * DAY_MS && (!d.hasSeenWelcome || (!d.profilePromptDismissed && !(prof.company && prof.jobTitle)))) return;
    } catch (e) { /* can't tell: show it */ }
    if (!auth.currentUser || auth.currentUser.uid !== user.uid || document.getElementById('pa-2s-nudge')) return;
    if (!required){
      try { const t = Number(localStorage.getItem(key)); if (t && Date.now() - t < TWO_STEP_SNOOZE_MS) return; } catch (e) { /* storage off: show it */ }
    }
    if (!document.getElementById('pa-2s-nudge-css')){
      const st = document.createElement('style');
      st.id = 'pa-2s-nudge-css';
      st.textContent = '.pa-2s-nudge{position:fixed;top:76px;right:16px;z-index:900;width:340px;max-width:calc(100vw - 32px);background:var(--surface,#fff);color:var(--ink,#16213E);border:1px solid var(--line,#DCE3EE);border-left:4px solid var(--cyan,#35C2E8);border-radius:12px;box-shadow:0 8px 24px rgba(22,33,62,.16);padding:14px 16px;font:14px/1.45 var(--sans,"IBM Plex Sans",system-ui,sans-serif)}' +
        '.pa-2s-nudge b{display:block;font-size:15px;margin-bottom:4px;color:var(--navy,#1A4584)}.pa-2s-nudge p{margin:0 0 10px}' +
        '.pa-2s-nudge .row{display:flex;gap:8px;flex-wrap:wrap}.pa-2s-nudge a,.pa-2s-nudge button{font:600 13px "Space Grotesk","IBM Plex Sans",system-ui,sans-serif;border-radius:999px;padding:7px 14px;cursor:pointer;text-decoration:none;border:1.5px solid var(--navy,#1A4584)}' +
        '.pa-2s-nudge a{background:var(--navy,#1A4584);color:var(--btn-ink,#fff)}.pa-2s-nudge button{background:transparent;color:var(--navy,#1A4584)}' +
        '.pa-2s-nudge a:focus-visible,.pa-2s-nudge button:focus-visible{outline:3px solid var(--cyan,#35C2E8);outline-offset:2px}' +
        '.pa-2s-nudge button.never{display:block;margin-top:8px;padding:0;border:0;background:none;color:var(--gray,#5f6b7a);font:500 12.5px var(--sans,system-ui,sans-serif);text-decoration:underline}';
      document.head.appendChild(st);
    }
    const card = document.createElement('div');
    card.id = 'pa-2s-nudge'; card.className = 'pa-2s-nudge'; card.setAttribute('role', 'region'); card.setAttribute('aria-label', 'Two-step verification');
    card.innerHTML = '<b></b><p></p><div class="row"><a href="/profile?twostep=setup">Set it up (2 minutes)</a><button type="button" class="later"></button></div>' +
      '<button type="button" class="never">Don\'t remind me again</button>';
    card.querySelector('b').textContent = required ? 'Turn on two-step verification' : 'Protect your account';
    card.querySelector('p').textContent = required
      ? (flags.owner ? 'The platform owner' : 'Company admins') + ' need two-step verification, because you can see other people\'s results. It takes a code from an app on your phone.'
      : 'Add a 6-digit code from an app on your phone when you sign in, so a stolen password isn\'t enough.';
    const later = card.querySelector('button.later');
    later.textContent = required ? 'Later' : 'Not now';
    later.addEventListener('click', () => {
      if (!required) try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* storage off */ }
      card.remove();
    });
    card.querySelector('button.never').addEventListener('click', () => {
      try { localStorage.setItem(offKey, '1'); } catch (e) { /* storage off */ }
      setDoc(doc(db, 'progress', user.uid), { twoStepNudgeOff: true }, { merge: true }).catch(() => { /* this device still remembers */ });
      card.remove();
    });
    document.body.appendChild(card);
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) loadPhoto(user); else { photoUid = ''; photoUrl = ''; }
    // Pages that need to know (feedback.html) read PAAccount.user, or listen for 'pa-auth'.
    window.PAAccount.user = user ? { name: user.displayName || '', email: user.email || '' } : null;
    window.PAAccount.ready = true;
    window.dispatchEvent(new CustomEvent('pa-auth', { detail: window.PAAccount.user }));
    if (user){
      welcomeIfNew(user); adminWelcomeIfDue(user);
      // Having an account means they agreed to the Privacy Policy, so the cookie notice is not shown again
      // (unless they had clicked Decline on this device, which is respected).
      if (window.PAAnalytics && window.PAAnalytics.acceptFromAccount) window.PAAnalytics.acceptFromAccount();
    }
    const flagsP = user ? lookUp(user) : null;
    if (user) flagsP.then(f => { if (auth.currentUser && auth.currentUser.uid === user.uid) twoStepNudge(user, f); });
    else { const n = document.getElementById('pa-2s-nudge'); if (n) n.remove(); }
    if (!MENU) return;
    const mine = ++token;
    if (!user){ remove(); return; }
    mount(user, { owner: false, companyAdmin: false });   // show it straight away, add the extra links when known
    paintAvatar();
    const flags = await flagsP;
    if (mine !== token || !wrap) return;
    const wasOpen = !wrap.querySelector('.pa-acct-menu').hidden;
    mount(user, flags);
    paintAvatar();
    if (wasOpen){ wrap.querySelector('.pa-acct-menu').hidden = false; wrap.querySelector('.pa-acct-btn').setAttribute('aria-expanded', 'true'); }
  });
}
