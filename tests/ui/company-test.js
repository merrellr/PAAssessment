// Drives the real company.html (the company admin dashboard) against the fake Firebase.
import { Timestamp } from './fake-firebase.js';
const out = [];
const scn = window.__scn;
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + '[' + scn + '] ' + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const vis = (id) => $(id).style.display !== 'none';
const txt = (id) => $(id).textContent.replace(/\s+/g, ' ').trim();
const textOf = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const shown = () => ['stateLoading', 'stateSignedOut', 'stateNoAccess', 'page'].filter(s => vis(s)).join(',');
async function until(cond, ms = 3000){
  const start = Date.now();
  while (Date.now() - start < ms){ if (cond()) return true; await sleep(30); }
  return false;
}
function setVal(id, v){ const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
const rowsIn = (wrapId) => Array.prototype.slice.call($(wrapId).querySelectorAll('tbody tr:not(.detail-row)'));
const btn = (row, label) => Array.prototype.find.call(row.querySelectorAll('button'), b => b.textContent.trim() === label);
const rowFor = (wrapId, needle) => rowsIn(wrapId).find(r => r.textContent.indexOf(needle) !== -1);
const tileNum = (label) => {
  const tl = Array.prototype.find.call($('tiles').querySelectorAll('.tile'), x => x.textContent.indexOf(label) !== -1);
  return tl ? tl.querySelector('.num').textContent : null;
};

/* The email service is an Apps Script web app reached by a <script> tag. Here
   the tag is intercepted and answered by a fake. */
let backendMode = 'ok';
const backendCalls = [];
const srcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
Object.defineProperty(HTMLScriptElement.prototype, 'src', {
  configurable: true,
  get(){ return srcDesc.get.call(this); },
  set(v){
    if (String(v).indexOf('script.google.com') === -1) { srcDesc.set.call(this, v); return; }
    const p = Object.fromEntries(new URL(v).searchParams);
    backendCalls.push(p);
    setTimeout(() => {
      const cb = window[p.callback];
      if (!cb) return;
      if (backendMode === 'ok') cb({ ok: true, to: 'x', remainingToday: 70 });
      else if (backendMode === 'notyours') cb({ ok: false, error: 'not_your_invite' });
      else cb(null);
    }, 15);
  }
});

/* Downloads: capture the file instead of saving it. */
const downloads = [];
const realCreate = URL.createObjectURL.bind(URL);
URL.createObjectURL = (blob) => { const url = realCreate(blob); downloads.push({ url, blob }); return url; };
HTMLAnchorElement.prototype.click = function(){ if (this.hasAttribute('download')) downloads[downloads.length - 1].name = this.getAttribute('download'); };

let confirmAnswer = true;
const confirmMessages = [];
window.confirm = (m) => { confirmMessages.push(m); return confirmAnswer; };

function done(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR [' + scn + '] ' + e));
  const all = out.join(' || ');
  document.title = all;
  // the page renames the tab after loading a company, so the runner reads this instead
  document.body.setAttribute('data-results', all);
}

async function readBlob(d){ return await d.blob.text(); }

(async function run(){
  try {
    await until(() => !vis('stateLoading'));
    await sleep(200);

    if (scn === 'signedout'){
      t('a signed-out visitor is asked to sign in', shown() === 'stateSignedOut', shown());
    } else if (scn === 'plain'){
      t('someone with no company sees the "admins only" page', shown() === 'stateNoAccess' && /for company admins/.test(txt('noAccessTitle')), shown() + ' ' + txt('noAccessTitle'));
      t('no data was shown', !vis('page'));
    } else if (scn === 'member'){
      t('a plain member is told they are not an admin, naming their company', shown() === 'stateNoAccess' && /member of Acme Health, but not one of its admins/.test(txt('noAccessMessage')), txt('noAccessMessage'));
    } else if (scn === 'removedadmin'){
      t('an admin whose membership ended gets no access', shown() === 'stateNoAccess' && !/member of Acme/.test(txt('noAccessMessage')), shown() + ' ' + txt('noAccessMessage'));
    } else if (scn === 'ownernoorg'){
      t('the owner without a company chosen is sent to the owner console', shown() === 'stateNoAccess' && $('noAccessLink').getAttribute('href') === 'owner.html' && /Choose a company/.test(txt('noAccessTitle')), shown());
    } else if (scn === 'denied'){
      t('if the company cannot be read, a plain explanation is shown instead of an empty page', shown() === 'stateNoAccess' && /couldn't load this company/.test(txt('noAccessTitle')), shown() + ' ' + txt('noAccessTitle'));
    } else if (scn === 'empty'){
      t('the page opens for an admin', shown() === 'page', shown());
      t('only the admin is in the company', rowsIn('teamWrap').length === 1);
      t('they have not shared anything yet and the page says so', /Nothing shared yet/.test(textOf(rowsIn('teamWrap')[0])), textOf(rowsIn('teamWrap')[0]));
      t('roll-up counts one person who has not taken the assessment', tileNum('People') === '1' && /1 have not/.test($('tiles').textContent), $('tiles').textContent);
      t('charts say there are no assessments yet instead of drawing empty bars', /No assessments yet/.test($('rollupCharts').textContent) && !$('rollupCharts').querySelector('.stackbar'));
      t('no former members card', !vis('formerCard'));
      t('with nobody assessed, the focus card shows no percentage yet and says why', /Progress on our focus: —/.test(txt('focusSummary')) && /once people have taken the assessment/.test(txt('focusSummary')), txt('focusSummary'));
      t('both download buttons: team report enabled, answers disabled (no answers)', $('csvTeamBtn').disabled === false && $('csvAnswersBtn').disabled === true);
      t('invitations list is empty with a friendly message', /No invitations waiting/.test($('inviteWrap').textContent));
    } else if (scn === 'archived'){
      t('the page opens, read-only, with a banner', shown() === 'page' && vis('archivedBanner'));
      t('adding people is switched off', $('addUsersBtn').disabled && $('addAdminBtn').disabled);
      const r = rowFor('inviteWrap', 'newone@acme.com');
      t('pending invitations can be seen but not acted on', !!r && r.querySelectorAll('button').length === 0, r && textOf(r));
      t('people and results are still readable', rowsIn('teamWrap').length === 6);
      t('priorities can be seen but not edited', $('focusEditBtn').style.display === 'none' && /Progress on our focus/.test(txt('focusSummary')));
    } else if (scn === 'owner'){
      t('the owner can open a company by its id', shown() === 'page' && txt('orgName') === 'Acme Health', shown());
      t('with a banner saying they are viewing as the owner and a way back', vis('ownerBanner') && $('ownerBackLink').style.display !== 'none');
      $('addUsersBtn').click();
      setVal('usersText', 'owneradded@x.com');
      $('usersCreateBtn').click();
      const find = () => Object.keys(window.__store).map(k => window.__store[k]).find(v => v && v.email === 'owneradded@x.com');
      await until(() => !!find());
      const mine = find();
      t('invites made by the owner here are made as the owner, for this company', !!mine && mine.createdBy === 'owner1' && mine.orgId === 'orgA' && mine.status === 'open', JSON.stringify(mine));
    } else if (scn === 'admin') {
      /* ---------------- a normal company admin ---------------- */
      t('the page opens for the admin', shown() === 'page', shown());
      t('no owner banner for a real admin', !vis('ownerBanner') && $('ownerBackLink').style.display === 'none');
      t('company name and plan', txt('orgName') === 'Acme Health' && /10 seats/.test(txt('orgPills')), txt('orgPills'));
      t('seat use counts every active person including admins, and waiting invitations', /6 of 10 seats in use, 2 invitations waiting/.test(txt('orgSummary')), txt('orgSummary'));
      t('the focus ranking is shown in order, read-only', /1\. AI Fluency — Organizational/.test(txt('orgSummary')) && /2\. Customer & Market Discovery/.test(txt('orgSummary')));
      t('internal owner notes and billing address are NOT shown to company admins', !/secret owner notes/.test(document.body.textContent) && !/1 Main St/.test(document.body.textContent));

      t('roll-up: 6 people', tileNum('People') === '6', tileNum('People'));
      t('roll-up: 5 took the assessment, 1 has not', tileNum('Took the assessment') === '5' && /1 have not/.test($('tiles').textContent));
      t('roll-up: 2 learning, 1 finished', tileNum('Learning now') === '2' && tileNum('Finished their plan') === '1');
      t('roll-up: 1 quiet for 30+ days, highlighted as needing attention', tileNum('Quiet for 30+ days') === '1' && $('tiles').querySelector('.tile.attn'));
      const bar = $('rollupCharts').querySelector('.stackbar');
      t('level bar splits 5 assessed people 1 / 1 / 2 / 1 (limited / moderate / lots / advanced → 2,1,1,1)', !!bar && /Limited Experience: 2/.test(bar.getAttribute('aria-label')) && /Moderate Experience: 1/.test(bar.getAttribute('aria-label')) && /Lots of Experience: 1/.test(bar.getAttribute('aria-label')) && /Advanced Experience: 1/.test(bar.getAttribute('aria-label')), bar && bar.getAttribute('aria-label'));
      t('average overall score', /Average overall score: 48%/.test($('rollupCharts').textContent), $('rollupCharts').textContent.slice(0, 200));
      const bars = Array.prototype.slice.call($('rollupCharts').querySelectorAll('.barrow'));
      t('seven skill-area bars', bars.length === 7);
      t('highest and lowest areas are labelled', /Customer & Market Discovery.*Highest on average/.test(textOf(bars[0])) && /AI Fluency — Organizational.*Lowest on average/.test(textOf(bars[6])), textOf(bars[0]) + ' | ' + textOf(bars[6]));

      let rows = rowsIn('teamWrap');
      t('six active people in the table (the former member is not in it)', rows.length === 6 && !/Old Timer/.test($('teamWrap').textContent), String(rows.length));
      t('the admin is labelled', /Ann Admin\s*Admin/.test(textOf(rows[0])), textOf(rows[0]));
      t('level and overall score shown', /Lots of Experience/.test(textOf(rows[0])) && /70% overall/.test(textOf(rows[0])));
      const cy = rowFor('teamWrap', 'Cy C');
      t('someone who joined but has nothing shared is shown plainly', /Not assessed yet/.test(textOf(cy)) && /Nothing shared yet/.test(textOf(cy)), textOf(cy));
      const dee = rowFor('teamWrap', 'Dee D');
      t('finished plan: 35 of 35 lessons, 7 of 7 courses', /35 of 35 lessons/.test(textOf(dee)) && /7 of 7 courses/.test(textOf(dee)) && /Finished their plan/.test(textOf(dee)) && !/Quiet/.test(textOf(dee)), textOf(dee));
      const eli = rowFor('teamWrap', 'Eli E');
      t('assessed but not started and quiet for 45 days is flagged', /Assessed, not started/.test(textOf(eli)) && /Quiet 30\+ days/.test(textOf(eli)), textOf(eli));
      const ben = rowFor('teamWrap', 'Ben B');
      t('learning: 2 lessons done against the whole plan (28 courses, 142 lessons)', /Learning/.test(textOf(ben)) && /2 of 142 lessons/.test(textOf(ben)) && /0 of 28 courses/.test(textOf(ben)), textOf(ben));
      const fay = rowFor('teamWrap', 'Name and email removed');
      t('a person who deleted their account shows as removed identity, results kept', !!fay && /Assessed, not started/.test(textOf(fay)), fay && textOf(fay));

      /* search and filters */
      setVal('teamSearch', 'ben');
      t('search narrows by name', rowsIn('teamWrap').length === 1 && /Ben B/.test(textOf(rowsIn('teamWrap')[0])));
      setVal('teamSearch', 'zzz');
      t('search with no match says so', /No one matches that/.test($('teamWrap').textContent));
      setVal('teamSearch', '');
      setVal('teamFilter', 'inactive');
      t('"quiet for 30+ days" filter finds Eli only', rowsIn('teamWrap').length === 1 && /Eli E/.test(textOf(rowsIn('teamWrap')[0])));
      setVal('teamFilter', 'learning');
      t('"learning" filter finds the two learners', rowsIn('teamWrap').length === 2);
      setVal('teamFilter', 'finished');
      t('"finished" filter finds Dee', rowsIn('teamWrap').length === 1 && /Dee D/.test(textOf(rowsIn('teamWrap')[0])));
      setVal('teamFilter', 'not_assessed');
      t('"not assessed" filter finds Cy', rowsIn('teamWrap').length === 1 && /Cy C/.test(textOf(rowsIn('teamWrap')[0])));
      setVal('teamFilter', 'all');
      t('"everyone" restores the list', rowsIn('teamWrap').length === 6);

      /* details */
      btn(rowFor('teamWrap', 'Ann Admin'), 'Details').click(); await sleep(60);
      const detail = $('teamWrap').querySelector('tr.detail-row');
      t('Details opens a panel under that person', !!detail);
      const dt = textOf(detail);
      t('it shows the assessment with all seven areas', /Lots of Experience · 70% overall/.test(dt) && /AI Fluency — Organizational 20%/.test(dt), dt.slice(0, 300));
      t('it shows the individual answers', /How do you validate a problem\?/.test(dt) && /Quarterly/.test(dt) && /\(3 pts\)/.test(dt));
      t('answer text is shown as plain text, never as markup', !detail.querySelector('a[href*="evil"]') && /HYPERLINK/.test(dt));
      t('it shows course progress against real lesson counts', /Customer & Market Discovery · Advanced Experience — 5 of 5 lessons ✓ finished/.test(dt), dt);
      t('and the size of their plan', /Their plan: 5 of 85 lessons across 17 courses/.test(dt), dt.slice(-200));
      btn(rowFor('teamWrap', 'Ann Admin'), 'Hide details').click(); await sleep(40);
      t('Hide details closes it', !$('teamWrap').querySelector('tr.detail-row'));

      /* former members */
      t('former members get their own section', vis('formerCard') && /Old Timer/.test($('formerWrap').textContent) && /Left/.test($('formerWrap').textContent));
      btn(rowsIn('formerWrap')[0], 'Details').click(); await sleep(40);
      t('and their kept results can still be opened', /Old question\?/.test($('formerWrap').textContent) && /Old answer/.test($('formerWrap').textContent));

      /* downloads */
      $('csvTeamBtn').click(); await sleep(60);
      const teamCsv = await readBlob(downloads[downloads.length - 1]);
      t('team report downloads under a company-based name', /acme-health-team-report-\d{4}-\d{2}-\d{2}\.csv/.test(downloads[downloads.length - 1].name || ''), downloads[downloads.length - 1].name);
      t('it has one line per person including the former member', teamCsv.replace(/^﻿/, '').split('\r\n').length === 8, String(teamCsv.split('\r\n').length));
      t('and marks the former member and the admin', /Former member/.test(teamCsv) && /Ann Admin,ann@acme\.com,Admin/.test(teamCsv));
      $('csvAnswersBtn').click(); await sleep(60);
      const ansCsv = await readBlob(downloads[downloads.length - 1]);
      t('answers export has every answer, and a formula in an answer cannot run when opened', ansCsv.split('\r\n').length === 4 && /'=HYPERLINK/.test(ansCsv) && !/(^|,)=HYPERLINK/.test(ansCsv), ansCsv.slice(0, 300));

      /* invitations */
      const inviteRows = rowsIn('inviteWrap');
      t('three invitations waiting (used, revoked and other companies\' invites are not listed)', inviteRows.length === 3 && !/othercompany|x@z\.com/.test($('inviteWrap').textContent), String(inviteRows.length));
      const mineRow = rowFor('inviteWrap', 'newone@acme.com');
      const bossRow = rowFor('inviteWrap', 'bossone@acme.com');
      const staleRow = rowFor('inviteWrap', 'stale@acme.com');
      t('an invite I created can be emailed, copied or revoked', !!btn(mineRow, 'Send email') && !!btn(mineRow, 'Copy link') && !!btn(mineRow, 'Revoke'));
      t('an invite the platform owner created offers a new link instead of a doomed resend', !btn(bossRow, 'Send email') && !!btn(bossRow, 'New link & email'));
      t('an expired invite offers "Renew & email"', /Invite expired/.test(textOf(staleRow)) && !!btn(staleRow, 'Renew & email'));

      backendCalls.length = 0;
      btn(mineRow, 'Send email').click(); await until(() => backendCalls.length === 1);
      await sleep(80);
      t('sending asks the email service for exactly that invite, with the admin\'s sign-in', backendCalls.length === 1 && backendCalls[0].action === 'sendInvite' && backendCalls[0].token === 'newone' && backendCalls[0].idToken === 'tok', JSON.stringify(backendCalls));
      t('the row then says Emailed and offers Resend', /Emailed ✓/.test(textOf(rowFor('inviteWrap', 'newone@acme.com'))) && !!btn(rowFor('inviteWrap', 'newone@acme.com'), 'Resend email') && /Email sent to newone@acme\.com/.test(txt('notice')), txt('notice'));

      /* add users: one active member, one already invited, two new, one junk line */
      $('addUsersBtn').click();
      setVal('usersText', 'ben@acme.com\nnewone@acme.com\nfresh1@acme.com, Fresh One, 555-1111\nfresh2@acme.com\nnot an email');
      t('the preview explains what will happen', /2 ready to invite/.test(txt('usersPreview')) && /2 skipped/.test(txt('usersPreview')) && /1 line not understood/.test(txt('usersPreview')), txt('usersPreview'));
      backendCalls.length = 0;
      confirmMessages.length = 0;
      $('usersCreateBtn').click();
      await until(() => Object.keys(window.__store).filter(k => /^invites\/[0-9a-f]{32}$/.test(k)).length === 2);
      await until(() => backendCalls.length === 2);
      await sleep(150);
      const created = Object.keys(window.__store).filter(k => /^invites\/[0-9a-f]{32}$/.test(k)).map(k => window.__store[k]);
      t('two new invites exist for this company, made by the admin, open, role member', created.length === 2 && created.every(v => v.orgId === 'orgA' && v.orgName === 'Acme Health' && v.createdBy === 'uAdmin' && v.status === 'open' && v.role === 'member'), JSON.stringify(created));
      const f1 = created.find(v => v.email === 'fresh1@acme.com');
      t('name and phone are kept', f1 && f1.name === 'Fresh One' && f1.phone === '555-1111');
      t('expiry is about 30 days out', f1 && Math.abs(f1.expiresAt.toMillis() - (Date.now() + 30 * 864e5)) < 60000);
      t('they were emailed straight away (box ticked by default)', backendCalls.length === 2 && backendCalls.every(c => c.action === 'sendInvite'), String(backendCalls.length));
      t('the new-links box lists them with a copy of each link', vis('linksCard') && /fresh1@acme\.com/.test($('linksTable').textContent) && /join\.html\?token=[0-9a-f]{32}/.test($('linksTable').textContent));
      t('invitations list now shows five', rowsIn('inviteWrap').length === 5, String(rowsIn('inviteWrap').length));
      t('6 in use + 2 waiting + 2 new is exactly 10 seats, so no over-the-limit warning', confirmMessages.length === 0, confirmMessages.join(' | '));

      /* a refused seat warning creates nothing */
      confirmAnswer = false;
      $('addUsersBtn').click();
      setVal('usersText', 'toomany@acme.com');
      const before = Object.keys(window.__store).filter(k => k.indexOf('invites/') === 0).length;
      $('usersCreateBtn').click(); await sleep(150);
      t('one more would pass the 10 seats, so the admin is warned (with the numbers) first', confirmMessages.length === 1 && /10 seats, and 6 are in use with 4 invitations waiting/.test(confirmMessages[0]), confirmMessages.join(' | '));
      t('saying no to the over-the-limit warning creates nothing', Object.keys(window.__store).filter(k => k.indexOf('invites/') === 0).length === before);
      confirmAnswer = true;
      $('usersCancelBtn').click();

      /* add admin */
      $('addAdminBtn').click();
      setVal('adminEmail', 'not-an-email'); $('adminCreateBtn').click(); await sleep(60);
      t('an invalid admin email is refused with a message', /valid email/.test(txt('adminError')));
      setVal('adminEmail', 'ben@acme.com'); $('adminCreateBtn').click(); await sleep(80);
      t('inviting someone who is already in the company as an admin is refused', /Already a member of this company/.test(txt('adminError')), txt('adminError'));
      setVal('adminEmail', 'newadmin@acme.com'); setVal('adminName', 'New Admin'); $('adminCreateBtn').click(); await sleep(150);
      const adminInv = Object.keys(window.__store).map(k => window.__store[k]).find(v => v && v.email === 'newadmin@acme.com' && v.orgId === 'orgA' && v.status === 'open' && v.role === 'admin');
      t('a new admin invite is created and emailed', !!adminInv && adminInv.createdBy === 'uAdmin' && backendCalls.some(c => c.action === 'sendInvite'), JSON.stringify(adminInv));

      /* renew expired */
      backendCalls.length = 0;
      btn(rowFor('inviteWrap', 'stale@acme.com'), 'Renew & email').click();
      await until(() => backendCalls.length >= 1); await sleep(150);
      t('renewing retires the old link', window.__store['invites/stale'].status === 'revoked');
      const renewed = Object.keys(window.__store).map(k => window.__store[k]).filter(v => v && v.email === 'stale@acme.com' && v.status === 'open');
      t('and creates a fresh one for the same person, emailed', renewed.length === 1 && renewed[0].createdBy === 'uAdmin' && backendCalls.length >= 1);

      /* new link for an invite someone else created */
      btn(rowFor('inviteWrap', 'bossone@acme.com'), 'New link & email').click();
      await sleep(250);
      t('an owner-created invite is replaced by one the admin owns, and the old one is revoked', window.__store['invites/bossone'].status === 'revoked' && Object.keys(window.__store).map(k => window.__store[k]).some(v => v && v.email === 'bossone@acme.com' && v.status === 'open' && v.createdBy === 'uAdmin' && v.role === 'admin'));

      /* revoke */
      confirmAnswer = false;
      btn(rowFor('inviteWrap', 'fresh2@acme.com'), 'Revoke').click(); await sleep(60);
      const freshKey = Object.keys(window.__store).find(k => window.__store[k].email === 'fresh2@acme.com');
      t('cancelling the revoke prompt changes nothing', window.__store[freshKey].status === 'open');
      confirmAnswer = true;
      btn(rowFor('inviteWrap', 'fresh2@acme.com'), 'Revoke').click(); await sleep(150);
      t('revoking closes the invite and removes it from the list', window.__store[freshKey].status === 'revoked' && !rowFor('inviteWrap', 'fresh2@acme.com'));

      /* a bad email service never breaks the page */
      backendMode = 'down';
      const resend = Array.prototype.find.call(rowFor('inviteWrap', 'fresh1@acme.com').querySelectorAll('button'), b => /send email/i.test(b.textContent));
      resend.click();
      await sleep(250);
      t('if the email service does not answer, the admin is told to copy the link', /email service isn't set up yet, or didn't answer/.test(txt('errorLine')) || /email service/i.test(txt('errorLine')), txt('errorLine'));
      backendMode = 'ok';

      /* admins can only touch invitations */
      const paths = window.__writeLog.map(w => w.path);
      t('the admin wrote only invitation documents (never the company, memberships or anyone\'s results)', paths.length > 0 && paths.every(p => /^invites\//.test(p)), paths.filter(p => !/^invites\//.test(p)).join());
      t('the company record itself is unchanged', window.__store['orgs/orgA'].notes === 'secret owner notes' && window.__store['orgs/orgA'].seatLimit === 10);

      /* refresh picks up changes made elsewhere */
      window.__store['memberships/uCy'].status = 'removed';
      $('refreshBtn').click(); await sleep(200);
      t('Refresh re-reads everything: Cy moves to former members', !rowFor('teamWrap', 'Cy C') && /Cy C/.test($('formerWrap').textContent) && /Updated/.test(txt('notice')), txt('notice'));

      /* ---------------- our focus ---------------- */
      const focusText = txt('focusSummary');
      t('"Progress on our focus" counts the top three ranked areas: 22 of 222 assigned lessons is 10%',
        /Progress on our focus: 10%/.test(focusText) && /22 of 222 assigned lessons done in the top 3 areas \(AI Fluency — Organizational, Customer & Market Discovery, Product Strategy & Roadmapping\)/.test(focusText), focusText);
      const fbars = Array.prototype.slice.call($('focusSummary').querySelectorAll('.barrow'));
      t('every ranked area has a row in the company\'s order, with its own percentage', fbars.length === 7 && /1\. AI Fluency — Organizational/.test(textOf(fbars[0])) && /6%/.test(textOf(fbars[0])) && /2\. Customer & Market Discovery/.test(textOf(fbars[1])) && /18%/.test(textOf(fbars[1])) && /3\. Product Strategy/.test(textOf(fbars[2])) && /7%/.test(textOf(fbars[2])), fbars.map(textOf).join(' | '));
      t('only the top three are marked as counting towards the focus', fbars.slice(0, 3).every(b => /Counts towards our focus/.test(textOf(b))) && fbars.slice(3).every(b => !/Counts towards/.test(textOf(b))));
      t('the hint explains that the priorities are in use', /shape what each person is recommended/.test(txt('focusHint')), txt('focusHint'));
      t('the editor starts closed', $('focusEditor').style.display === 'none' && $('focusEditBtn').style.display !== 'none');

      const rankedKeys = () => Array.prototype.map.call($('focusRanked').querySelectorAll('.focus-item'), li => li.dataset.key);
      const bucketKeys = () => Array.prototype.map.call($('focusBucket').querySelectorAll('.focus-item'), li => li.dataset.key);
      $('focusEditBtn').click(); await sleep(80);
      t('Edit priorities opens the board with the saved order', $('focusEditor').style.display === 'block' && rankedKeys().join() === 'aiOrg,discovery,strategy,prioritization,execution,stakeholder,aiIndividual', rankedKeys().join());
      $('focusRanked').querySelectorAll('.focus-item')[1].querySelector('.icon-btn[title="Move up"]').click(); await sleep(60);
      t('moving an area up reorders the board', rankedKeys()[0] === 'discovery' && rankedKeys()[1] === 'aiOrg', rankedKeys().join());
      $('focusCancelBtn').click(); await sleep(40);
      t('Cancel closes the editor and saves nothing', $('focusEditor').style.display === 'none' && window.__store['orgs/orgA'].focusAreas[0] === 'aiOrg' && window.__store['orgFocus/orgA'].focusAreas[0] === 'aiOrg');

      $('focusEditBtn').click(); await sleep(60);
      t('reopening starts again from the saved order, not the abandoned edit', rankedKeys()[0] === 'aiOrg', rankedKeys().join());
      $('focusRanked').querySelectorAll('.focus-item')[1].querySelector('.icon-btn[title="Move up"]').click(); await sleep(60);
      const lastItem = Array.prototype.slice.call($('focusRanked').querySelectorAll('.focus-item')).pop();
      lastItem.querySelector('.icon-btn[title="Remove from priorities"]').click(); await sleep(60);
      t('removing an area moves it to "Not a priority"', bucketKeys().join() === 'aiIndividual' && rankedKeys().length === 6, bucketKeys().join());
      const orgBefore = JSON.parse(JSON.stringify(window.__store['orgs/orgA']));
      window.__writeLog.length = 0;
      $('focusSaveBtn').click(); await until(() => $('focusEditor').style.display === 'none'); await sleep(80);
      const savedOrg = window.__store['orgs/orgA'], savedCopy = window.__store['orgFocus/orgA'];
      t('saving updates the company record and the member-readable copy to the new order', savedOrg.focusAreas.join() === 'discovery,aiOrg,strategy,prioritization,execution,stakeholder' && savedCopy.focusAreas.join() === savedOrg.focusAreas.join(), savedOrg.focusAreas.join());
      t('nothing else on the company record changed (name, plan, seats, notes, contacts, billing)', ['name', 'plan', 'seatLimit', 'notes', 'contactName', 'contactEmail', 'contactPhone', 'billingAddress', 'status'].every(k => savedOrg[k] === orgBefore[k]));
      t('only those two documents were written', window.__writeLog.map(w => w.op + ':' + w.path).sort().join() === 'set:orgFocus/orgA,update:orgs/orgA', window.__writeLog.map(w => w.op + ':' + w.path).join());
      t('the page confirms, and the header and progress rows follow the new order', /Priorities saved/.test(txt('notice')) && /1\. Customer & Market Discovery/.test(txt('orgSummary')) && /1\. Customer & Market Discovery/.test(textOf($('focusSummary').querySelector('.barrow'))) && $('focusSummary').querySelectorAll('.barrow').length === 6, txt('notice'));

      $('focusEditBtn').click(); await sleep(60);
      $('focusResetBtn').click(); await sleep(60);
      t('"Reset to default order" restores the standard ranking of all seven', rankedKeys().join() === 'discovery,strategy,prioritization,execution,stakeholder,aiIndividual,aiOrg' && bucketKeys().length === 0, rankedKeys().join());
      $('focusSaveBtn').click(); await until(() => $('focusEditor').style.display === 'none'); await sleep(80);
      t('saving the standard order stores it, and the page says it changes nothing yet', window.__store['orgFocus/orgA'].focusAreas.join() === 'discovery,strategy,prioritization,execution,stakeholder,aiIndividual,aiOrg' && /standard order, so recommendations are not tilted/.test(txt('focusHint')), txt('focusHint'));

      $('focusEditBtn').click(); await sleep(60);
      $('focusRanked').querySelectorAll('.focus-item')[1].querySelector('.icon-btn[title="Move up"]').click(); await sleep(60);
      window.__failCommit = 'permission-denied';
      $('focusSaveBtn').click(); await sleep(150);
      t('a refusal by the security rules shows a plain message and keeps the editor open', /security rules refused/.test(txt('focusError')) && $('focusEditor').style.display === 'block', txt('focusError'));
      t('and nothing was saved', window.__store['orgFocus/orgA'].focusAreas[0] === 'discovery' && window.__store['orgs/orgA'].focusAreas[0] === 'discovery');
      window.__failCommit = null;
      $('focusCancelBtn').click();
    } else if (scn === 'nocopy'){
      t('the page opens', shown() === 'page');
      await sleep(150);
      const copy = window.__store['orgFocus/orgA'];
      t('a company made before the member-readable copy existed gets one when its admin opens the page', !!copy && copy.focusAreas.join() === window.__store['orgs/orgA'].focusAreas.join() && !!copy.updatedAt, JSON.stringify(copy));
    } else if (scn === 'sharesdenied'){
      t('if shared records cannot be read, the people list still shows', shown() === 'page' && rowsIn('teamWrap').length === 6);
      t('and each person simply shows nothing shared yet', /Nothing shared yet/.test(textOf(rowFor('teamWrap', 'Ben B'))));
    }
  } catch (e) {
    out.push('FAIL [' + scn + '] test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  done();
})();
