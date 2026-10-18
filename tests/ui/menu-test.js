// Drives the real account-menu.js (the Profile menu on every page but the dashboard) against the fake Firebase.
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const labels = () => Array.prototype.slice.call(document.querySelectorAll('#paAccountMenu .pa-acct-item')).map(a => a.textContent.trim());
const key = (k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

(async function run(){
  try {
    await sleep(400);
    const welcomeCalls = () => window.__calls.filter(c => c.action === 'welcome');
    const stored = () => { try { return localStorage.getItem('pa_welcomed_uNew'); } catch (e) { return null; } };
    const menuOff = /menu-off/.test(location.pathname);
    if (menuOff){
      t('with the menu switched off, no Profile button is drawn', !$('paAccount') && !document.querySelector('.pa-acct-btn'));
      t('but a brand-new account still asks for its welcome email, once', welcomeCalls().length === 1 && welcomeCalls()[0].idToken === 'tok', JSON.stringify(window.__calls));
    } else if (scn === 'newaccount'){
      t('a brand-new account asks for the welcome email, once, with its sign-in token', welcomeCalls().length === 1 && welcomeCalls()[0].idToken === 'tok' && Object.keys(welcomeCalls()[0]).sort().join() === 'action,callback,idToken', JSON.stringify(window.__calls));
      t('and remembers it was done', stored() === '1');
      t('the Profile menu still appears as normal', !!$('paAccountBtn'));
    } else if (scn === 'oldaccount'){
      t('an account made ten days ago does not ask', window.__calls.length === 0);
      t('the menu is unaffected', !!$('paAccountBtn'));
    } else if (scn === 'welcomedone'){
      t('an account already welcomed on this browser does not ask again', window.__calls.length === 0);
    } else if (scn === 'welcomefail'){
      t('if the script reports a problem it is not marked done, so a later page load tries again', welcomeCalls().length === 1 && stored() === null);
      t('and the page is unaffected', !!$('paAccountBtn'));
    } else if (scn === 'welcomedown'){
      t('if the script cannot be reached it is not marked done either', welcomeCalls().length === 1 && stored() === null);
      t('and the page is unaffected', !!$('paAccountBtn'));
    } else if (scn === 'signedout'){
      t('nobody signed in: no Profile button at all', !$('paAccount') && !document.querySelector('.pa-acct-btn'));
    } else {
      const btn = $('paAccountBtn');
      t('a signed-in person sees a Profile button', !!btn && /Profile/.test(btn.textContent));
      t('it sits inside the page column, top right', !!btn && $('paAccount').parentNode.classList.contains('wrap') && $('paAccount').style.right === '16px');
      t('the menu starts closed and the button says so', $('paAccountMenu').hidden && btn.getAttribute('aria-expanded') === 'false' && btn.getAttribute('aria-haspopup') === 'true');
      btn.click();
      t('clicking opens it', !$('paAccountMenu').hidden && btn.getAttribute('aria-expanded') === 'true');
      const name = $('paAccountMenu').querySelector('.pa-acct-name').textContent, email = $('paAccountMenu').querySelector('.pa-acct-email').textContent;
      const L = labels();
      if (scn === 'noname') t('with no display name, the part of the email before the @ is used', name === 'pat.jones' && email === 'pat.jones@x.com', name + ' / ' + email);
      else t('it shows who is signed in', name.length > 0 && /@x\.com$/.test(email), name + ' / ' + email);
      t('everyone gets the dashboard, profile, vote and website links, then Log out last', L[0] === 'My learning dashboard' && L[1] === 'My profile' && L.indexOf('Vote on the next tool') > -1 && L.some(x => /Visit Product Advisory/.test(x)) && L[L.length - 1] === 'Log out', L.join(' | '));
      t('the links go to the right pages', document.querySelector('#paAccountMenu a[href="lms-dashboard.html"]') && document.querySelector('#paAccountMenu a[href="profile.html"]') && document.querySelector('#paAccountMenu a[href="tool-requests.html"]'));
      t('"Send feedback" opens an email to feedback@ with a subject already filled in', (() => { const a = document.querySelector('#paAccountMenu a[href^="mailto:"]'); return !!a && /^mailto:feedback@productadvisory\.co\?subject=Feedback%20on%20Product%20Advisory%20Learning$/.test(a.getAttribute('href')) && a.textContent.trim() === 'Send feedback'; })());
      const site = Array.prototype.slice.call(document.querySelectorAll('#paAccountMenu a')).filter(a => /^https:\/\/www\.productadvisory\.co/.test(a.href))[0];
      t('the website link opens in a new tab safely', site.target === '_blank' && /noopener/.test(site.rel));
      const owner = L.indexOf('Owner console') > -1, reports = L.indexOf('Reports') > -1, company = L.indexOf('Company dashboard') > -1;
      if (scn === 'owner') t('the owner also gets Owner console and Reports', owner && reports && document.querySelector('#paAccountMenu a[href="owner.html"]') && document.querySelector('#paAccountMenu a[href="reports.html"]'), L.join(' | '));
      else t('nobody else sees the owner links', !owner && !reports, L.join(' | '));
      if (scn === 'admin') t('a company admin gets Company dashboard', company && !!document.querySelector('#paAccountMenu a[href="company.html"]'), L.join(' | '));
      else t('only an active company admin sees Company dashboard', !company, L.join(' | '));
      const onProfile = /profile\.html$/.test(location.pathname);
      const marked = Array.prototype.slice.call(document.querySelectorAll('#paAccountMenu [aria-current]')).map(a => a.getAttribute('href'));
      t(onProfile ? 'on profile.html, "My profile" is marked as the current page and nothing else' : 'on a page that is not in the menu, nothing is marked', onProfile ? marked.join() === 'profile.html' : marked.length === 0, marked.join());

      document.body.click();
      t('clicking elsewhere closes it', $('paAccountMenu').hidden && btn.getAttribute('aria-expanded') === 'false');
      btn.click(); key('Escape');
      t('Escape closes it and puts focus back on the button', $('paAccountMenu').hidden && document.activeElement === btn);
      btn.click(); btn.click();
      t('the button toggles it', $('paAccountMenu').hidden);
      t('only one menu exists even after the lookup finished', document.querySelectorAll('#paAccount').length === 1);

      btn.click();
      $('paAccountLogout').click(); await sleep(100);
      t('Log out signs the person out and the button disappears', !$('paAccount') && window.__fakeUser === null);
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  document.body.setAttribute('data-results', all);
})();
