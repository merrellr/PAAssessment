/* The "Profile" menu in the top right corner, for every page except the learning
   dashboard (which has its own). It appears only while someone is signed in, and
   shows the links that person is allowed to use: owner and company links only show
   up for the owner and for company admins. Add it to a page with one line, just
   before </body>:   <script type="module" src="account-menu.js"></script>        */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcECtS5c6WeOhKlwRK-LYFE47npbuq_eU",
  authDomain: "product-advisory-lms.firebaseapp.com",
  projectId: "product-advisory-lms",
  storageBucket: "product-advisory-lms.firebasestorage.app",
  messagingSenderId: "1081134406437",
  appId: "1:1081134406437:web:72e28604d093219e7698cc"
};

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
    '.pa-acct-btn{display:flex;align-items:center;gap:7px;padding:7px 14px 7px 10px;border-radius:20px;background:var(--navy,#1A4584);color:#fff;border:none;cursor:pointer;font:600 13px "Space Grotesk","IBM Plex Sans",system-ui,sans-serif;}',
    '.pa-acct-btn:hover{background:var(--navy-deep,#12325F);}',
    '.pa-acct-btn:focus-visible,.pa-acct-item:focus-visible{outline:3px solid var(--cyan,#35C2E8);outline-offset:2px;}',
    '.pa-acct-menu{position:absolute;right:0;top:42px;width:250px;max-width:calc(100vw - 32px);background:#fff;border:1px solid var(--line,#DCE3EE);border-radius:12px;box-shadow:0 8px 24px rgba(22,33,62,0.12);padding:14px;}',
    '.pa-acct-menu[hidden]{display:none;}',
    '.pa-acct-name{font-weight:600;font-size:14.5px;color:var(--ink,#16213E);}',
    '.pa-acct-email{font:400 12.5px "IBM Plex Sans",system-ui,sans-serif;color:var(--ink-soft,#4A5568);word-break:break-all;}',
    '.pa-acct-rule{height:1px;background:var(--line,#DCE3EE);margin:10px 0;}',
    '.pa-acct-item{display:block;width:100%;box-sizing:border-box;text-align:left;padding:8px 4px;font:400 13.5px "IBM Plex Sans",system-ui,sans-serif;color:var(--ink,#16213E);text-decoration:none;cursor:pointer;border:none;background:none;border-radius:6px;}',
    '.pa-acct-item:hover{background:#F7F9FC;}',
    '.pa-acct-item[aria-current="page"]{font-weight:600;color:var(--navy,#1A4584);}',
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
    const seg = location.pathname.split('/').pop();
    return seg || 'index.html';
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
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
    btn.appendChild(document.createTextNode('Profile'));

    const menu = el('div', 'pa-acct-menu');
    menu.id = 'paAccountMenu';
    menu.hidden = true;
    menu.appendChild(el('div', 'pa-acct-name', user.displayName || (user.email || '').split('@')[0] || 'Your account'));
    menu.appendChild(el('div', 'pa-acct-email', user.email || ''));
    menu.appendChild(el('div', 'pa-acct-rule'));
    menu.appendChild(link('My learning dashboard', 'lms-dashboard.html', page === 'lms-dashboard.html'));
    menu.appendChild(link('My profile', 'profile.html', page === 'profile.html'));
    if (flags.companyAdmin) menu.appendChild(link('Company dashboard', 'company.html', page === 'company.html'));
    if (flags.owner){
      menu.appendChild(link('Owner console', 'owner.html', page === 'owner.html'));
      menu.appendChild(link('Reports', 'reports.html', page === 'reports.html'));
    }
    menu.appendChild(link('Vote on the next tool', 'tool-requests.html', page === 'tool-requests.html'));
    menu.appendChild(link('Visit Product Advisory ↗', 'https://www.productadvisory.co/', false, true));
    menu.appendChild(el('div', 'pa-acct-rule'));
    const out = el('button', 'pa-acct-item', 'Log out');
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

    // Sit in the corner of the page's own column, level with the logo, when it has one.
    const col = document.querySelector('.wrap') || document.querySelector('.card') || document.body;
    if (getComputedStyle(col).position === 'static') col.style.position = 'relative';
    const isWrap = col.classList.contains('wrap');
    const padTop = isWrap ? parseFloat(getComputedStyle(col).paddingTop) || 0 : 0;
    wrap.style.top = (isWrap ? padTop + 2 : 12) + 'px';
    wrap.style.right = (isWrap ? 16 : 12) + 'px';
    col.appendChild(wrap);
    // Line the button up with the middle of the page's logo, when there is one.
    const logo = col.querySelector('.brand-header svg, .brand-header-left svg, a[href="lms-dashboard.html"] > svg');
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
      }).catch(() => { /* no company */ })
    ]);
    return flags;
  }

  onAuthStateChanged(auth, async (user) => {
    const mine = ++token;
    if (!user){ remove(); return; }
    mount(user, { owner: false, companyAdmin: false });   // show it straight away, add the extra links when known
    const flags = await lookUp(user);
    if (mine !== token || !wrap) return;
    const wasOpen = !wrap.querySelector('.pa-acct-menu').hidden;
    mount(user, flags);
    if (wasOpen){ wrap.querySelector('.pa-acct-menu').hidden = false; wrap.querySelector('.pa-acct-btn').setAttribute('aria-expanded', 'true'); }
  });
}
