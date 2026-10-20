// Drives the real owner.html through a realistic session using the fake Firebase.
import { Timestamp } from './fake-firebase.js';
const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + label + (ok || !extra ? '' : '   [' + extra + ']'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);
const vis = (id) => $(id).style.display !== 'none';
const params = new URLSearchParams(location.search);
const stopAt = Number(params.get('stop') || 99);
window.confirm = () => true;

/* The email service is an Apps Script web app reached by a <script> tag. Here
   the tag is intercepted and answered by a fake whose behaviour the test picks. */
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
      else if (backendMode === 'daily') cb({ ok: false, error: 'daily_limit' });
      else if (backendMode === 'notyours') cb({ ok: false, error: 'not_your_invite' });
      else if (backendMode === 'toomany') cb({ ok: false, error: 'too_many_for_invite' });
      else if (backendMode === 'mailerr') cb({ ok: false, error: 'mail_error', detail: 'You do not have permission to call MailApp.sendEmail' });
      else cb(null);
    }, 15);
  }
});

async function until(cond, ms = 3000){
  const start = Date.now();
  while (Date.now() - start < ms){ if (cond()) return true; await sleep(30); }
  return false;
}
function setVal(id, v){ const e = $(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
function click(id){ $(id).click(); }
const rowsIn = (wrapId) => Array.prototype.slice.call($(wrapId).querySelectorAll('tbody tr'));
const textOf = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');

function finish(){
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR ' + e));
  document.title = out.join(' || ');
  document.body.setAttribute('data-done', '1');
}

(async function run(){
  try {
    await until(() => vis('console'));
    await sleep(150);

    /* ---- 1. empty state: Create form first ---- */
    t('console opens for the owner', vis('console'));
    t('with no companies the create form is shown', vis('formCard'));
    t('create form sits ABOVE the (empty) list', $('formCard').style.order === '0' && $('listCard').style.order === '1');
    t('"+ Create company" button is hidden when there are none', $('newCompanyBtn').style.display === 'none');
    t('empty list says so', /No companies yet/.test($('orgTableWrap').textContent));
    const ranked = Array.prototype.map.call($('focusRanked').querySelectorAll('.focus-item'), li => li.dataset.key);
    t('focus board starts in the default order, all 7 ranked', ranked.join() === 'discovery,strategy,prioritization,execution,stakeholder,aiIndividual,aiOrg', ranked.join());
    t('"Not a priority" starts empty', $('focusBucket').querySelectorAll('.focus-item').length === 0);
    t('first-admin block is visible when creating', $('firstAdminBlock').style.display !== 'none');
    if (params.get('drag')) { await dragTest(); return finish(); }
    if (stopAt === 1) return finish();

    /* ---- validation ---- */
    click('saveBtn'); await sleep(60);
    t('saving with no name shows an error', /company name/i.test($('orgNameError').textContent));
    setVal('orgName', 'Acme Health'); setVal('orgPlan', 'seat'); click('saveBtn'); await sleep(60);
    t('per-seat plan with no seats shows an error', /seats/i.test($('orgSeatsError').textContent));
    t('seat box appears for per-seat plans', $('seatWrap').style.display === 'block');
    setVal('orgSeats', '3'); setVal('contactEmail', 'not-an-email'); click('saveBtn'); await sleep(60);
    t('bad contact email is rejected', /invalid/i.test($('contactEmailError').textContent));

    /* ---- 2. create a company with contacts and a first admin ---- */
    setVal('orgSeats', '3');
    setVal('orgNotes', 'Pilot customer, renewal in March');
    setVal('contactName', 'Pat Jones'); setVal('contactEmail', 'pat@acme.com'); setVal('contactPhone', '555-0100');
    setVal('billingAddress', '1 Main St\nSpringfield, IL 62701');
    setVal('firstAdminName', 'Sam Admin'); setVal('firstAdminEmail', 'Sam@Acme.com'); setVal('firstAdminPhone', '555-0101');
    click('saveBtn');
    const gotDetail = await until(() => vis('viewDetail'));
    t('creating a company opens its page', gotDetail);
    await sleep(200);
    const orgPath = Object.keys(window.__store).find(p => p.indexOf('orgs/') === 0);
    const org = window.__store[orgPath];
    t('company saved with contact, billing, notes, seats and default focus order',
      org && org.name === 'Acme Health' && org.plan === 'seat' && org.seatLimit === 3 && org.contactName === 'Pat Jones' &&
      org.contactEmail === 'pat@acme.com' && org.billingAddress.indexOf('Springfield') > -1 && org.notes === '' &&
      org.focusAreas.length === 7 && org.status === 'active' && org.createdBy === 'owner1');
    const focusCopy = window.__store['orgFocus/' + orgPath.split('/')[1]];
    t('creating a company also saves the member-readable copy of its focus list, identical to the company\'s', !!focusCopy && focusCopy.focusAreas.join() === org.focusAreas.join() && focusCopy.updatedAt && typeof focusCopy.updatedAt.toMillis === 'function', JSON.stringify(focusCopy));
    const privNotes = window.__store['orgPrivate/' + orgPath.split('/')[1]];
    t('the private notes are saved in the owner-only place, not on the company record that its admins can read', !!privNotes && privNotes.notes.indexOf('Pilot customer') === 0 && org.notes === '', JSON.stringify(privNotes));
    const created = Object.keys(window.__store).filter(k => k.indexOf(orgPath + '/audit/') === 0).map(k => window.__store[k]);
    t('creating the company is recorded in its activity log by the owner', created.some(e => e.action === 'company.created' && e.actorUid === 'owner1' && e.actorEmail === 'owner@x.com' && e.at && e.at.toMillis), JSON.stringify(created));
    const summaryText = textOf($('detailSummary'));
    t('company page shows point of contact and billing address', /Pat Jones/.test(summaryText) && /pat@acme\.com/.test(summaryText) && /Springfield/.test(summaryText));
    t('company card shows the seat counts up front and folds the rest', $('detailSeats').querySelectorAll('.pa-seat').length === 3 && /Active/.test(textOf($('detailSeats'))) && /Available of 3/.test(textOf($('detailSeats'))) && $('detailMore').contains($('detailSummary')) && !$('detailMore').open, textOf($('detailSeats')));
    t('company page shows seats, notes and created / last modified', /of 3 seats in use/.test(summaryText) && /Pilot customer/.test(summaryText) && /Created/.test(summaryText) && /Last modified/.test(summaryText));
    const invPath = Object.keys(window.__store).find(p => p.indexOf('invites/') === 0);
    const inv = window.__store[invPath];
    t('first admin invite created with role, name, phone and lower-cased email',
      inv && inv.role === 'admin' && inv.name === 'Sam Admin' && inv.phone === '555-0101' && inv.email === 'sam@acme.com' &&
      inv.orgName === 'Acme Health' && inv.status === 'open' && inv.usedBy === null);
    t('invite expires in about 30 days', inv && Math.abs(inv.expiresAt.toMillis() - (Date.now() + 30 * 864e5)) < 60000);
    t('invite token is a long random string', invPath.split('/')[1].length === 32 && /^[0-9a-f]+$/.test(invPath.split('/')[1]));
    t('new-links card shows the admin link', vis('linksCard') && /\/join\?token=/.test($('linksTable').textContent));
    const adminRows = rowsIn('adminTableWrap');
    t('admin table lists the invited admin with name, email, phone and Invited status',
      adminRows.length === 1 && /Sam Admin/.test(textOf(adminRows[0])) && /sam@acme\.com/.test(textOf(adminRows[0])) && /555-0101/.test(textOf(adminRows[0])) && /Invited/.test(textOf(adminRows[0])));
    t('detail page has its own back link and edit button', vis('backBtn') && vis('editBtn'));
    await until(() => /Emailed/.test(textOf(rowsIn('adminTableWrap')[0] || null)));
    t('creating a company with a first admin emails that admin straight away (box ticked by default)', backendCalls.filter(c => c.action === 'sendInvite').length === 1 && /Emailed/.test(textOf(rowsIn('adminTableWrap')[0])), String(backendCalls.length));
    if (stopAt === 2) return finish();

    /* ---- 3. add users in bulk ---- */
    click('addUsersBtn'); await sleep(50);
    t('add-users panel opens', vis('usersForm'));
    setVal('usersText', 'email,name,phone\njane@acme.com, Jane Smith, 555-0111\nLee Park, lee@acme.com\nsam@acme.com, Dupe Of Admin\nnot-an-email\njane@acme.com, Listed twice\nbob@acme.com');
    await sleep(60);
    const prev = $('usersPreview').textContent;
    t('preview counts ready, skipped and not-understood lines', /3 ready/.test(prev) && /1 skipped/.test(prev) && /2 line/.test(prev), prev);
    click('usersCreateBtn');
    await until(() => rowsIn('userTableWrap').length === 3);
    await sleep(150);
    const userRows = rowsIn('userTableWrap');
    await until(() => /3 of 3 emails sent/.test($('sendStatus').textContent));
    t('adding users emails them straight away (box ticked by default): 1 admin + 3 users = 4 requests', backendCalls.filter(c => c.action === 'sendInvite').length === 4, String(backendCalls.length));
    t('three users invited (the admin\'s email and the duplicate were skipped)', userRows.length === 3, String(userRows.length));
    t('users show name and phone when given', userRows.some(r => /Jane Smith/.test(textOf(r)) && /555-0111/.test(textOf(r))) && userRows.some(r => /Lee Park/.test(textOf(r))));
    t('links card now lists 3 new links and offers copy and CSV', /3 invite links/.test($('linksResult').textContent) && vis('copyAllBtn') && vis('downloadCsvBtn'));
    t('seat summary warns about pending invites', /invites? pending/.test(textOf($('detailSummary'))));
    const userInvites = Object.keys(window.__store).filter(p => p.indexOf('invites/') === 0).map(p => window.__store[p]).filter(i => i.role === 'member');
    t('user invites are role member with the right company', userInvites.length === 3 && userInvites.every(i => i.orgName === 'Acme Health' && i.status === 'open'));
    /* ---- invite emails ---- */
    const emailBtnsBefore = Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).filter(b => b.textContent === 'Resend email');
    t('every emailed invite offers Resend email', emailBtnsBefore.length === 3, String(emailBtnsBefore.length));
    backendCalls.length = 0;
    t('"Send emails to everyone" is offered with the new links', vis('sendAllBtn'));
    click('sendAllBtn');
    await until(() => /3 of 3 emails sent/.test($('sendStatus').textContent));
    const sentCalls = backendCalls.filter(c => c.action === 'sendInvite');
    t('one request per invite went to the email service', sentCalls.length === 3, String(sentCalls.length));
    t('each request carries the invite token and the owner\'s sign-in token, nothing else about the recipient',
      sentCalls.every(c => /^[0-9a-f]{32}$/.test(c.token) && c.idToken === 'fake-id-token' && !c.email && !c.to && !c.link));
    t('progress line reports 3 of 3 sent', /3 of 3 emails sent/.test($('sendStatus').textContent), $('sendStatus').textContent);
    t('links table marks each as emailed', $('linksTable').querySelectorAll('td').length > 0 && Array.prototype.every.call($('linksTable').querySelectorAll('tbody tr'), r => /Emailed/.test(r.textContent)));
    t('people list shows "Emailed" and the button now says Resend', rowsIn('userTableWrap').every(r => /Emailed/.test(textOf(r)) && /Resend email/.test(textOf(r))));
    t('Send-all button is usable again afterwards', $('sendAllBtn').disabled === false);

    backendMode = 'daily';
    Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => b.textContent === 'Resend email').click();
    await until(() => /limit/i.test($('detailError').textContent));
    t('a daily limit is explained in plain words', /Today's email limit/.test($('detailError').textContent), $('detailError').textContent);
    backendMode = 'down';
    Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => b.textContent === 'Resend email').click();
    await until(() => /isn't set up/.test($('detailError').textContent));
    t('if the email service does not answer, the page says it isn\'t set up and suggests copying the link', /isn't set up yet/.test($('detailError').textContent) && /Copy the link/.test($('detailError').textContent));
    backendMode = 'notyours';
    Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => b.textContent === 'Resend email').click();
    await until(() => /Only the person who created/.test($('detailError').textContent));
    t('trying to email someone else\'s invite is explained', /Only the person who created/.test($('detailError').textContent));
    backendMode = 'ok';
    const resendBtn = Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => b.textContent === 'Resend email');
    resendBtn.click();
    await until(() => /Email sent to/.test($('detailNotice').textContent));
    t('a successful single send clears the error and confirms', /Email sent to/.test($('detailNotice').textContent) && $('detailError').textContent === '');

    // send-all stops early when the daily limit is hit, and says why
    backendMode = 'daily';
    backendCalls.length = 0;
    click('sendAllBtn');
    await until(() => !$('sendAllBtn').disabled);
    await sleep(100);
    t('send-all stops once the daily limit is reached instead of hammering the service', backendCalls.length <= 3 && /Today's email limit/.test($('sendStatus').textContent), backendCalls.length + ' ' + $('sendStatus').textContent);
    backendMode = 'ok';

    // an expired invite has no Send email button
    window.__store['invites/expiredOne'] = { orgId: orgPath.split('/')[1], orgName: 'Acme Health', email: 'old@acme.com', role: 'member', status: 'open',
      createdAt: Timestamp.now(), createdBy: 'owner1', expiresAt: Timestamp.fromMillis(Date.now() - 864e5), usedBy: null, usedAt: null };
    location.hash = ''; await sleep(80); location.hash = '#company=' + orgPath.split('/')[1]; await sleep(300);
    const expiredRow = rowsIn('userTableWrap').find(r => /old@acme\.com/.test(textOf(r)));
    t('an expired invite shows "Invite expired" and offers no Send email', expiredRow && /Invite expired/.test(textOf(expiredRow)) && !/Send email|Resend email/.test(textOf(expiredRow)));
    if (stopAt === 3) return finish();

    /* ---- search and revoke ---- */
    setVal('userSearch', 'jane'); await sleep(60);
    t('searching users filters the table', rowsIn('userTableWrap').length === 1);
    setVal('userSearch', 'zzz'); await sleep(60);
    t('search with no match says so', /No users match/.test($('userTableWrap').textContent));
    setVal('userSearch', ''); await sleep(60);
    const revokeBtn = Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => b.textContent === 'Revoke');
    revokeBtn.click(); await sleep(250);
    t('revoking an invite removes it from the list (two pending and the expired one remain)', rowsIn('userTableWrap').length === 3, String(rowsIn('userTableWrap').length));
    t('and marks it revoked in the database', Object.keys(window.__store).filter(p => p.indexOf('invites/') === 0).some(p => window.__store[p].status === 'revoked'));

    /* ---- a person joins (simulated) ---- */
    window.__store['memberships/uJane'] = { orgId: orgPath.split('/')[1], orgName: 'Acme Health', role: 'member', status: 'active',
      inviteToken: 'x', joinedAt: Timestamp.now(), endedAt: null, email: 'jane@acme.com', displayName: 'Jane Smith', phone: '555-0111' };
    window.__store['memberships/uSam'] = Object.assign({}, window.__store['memberships/uJane'], { role: 'admin', email: 'sam@acme.com', displayName: 'Sam Admin', phone: '555-0101' });
    const orgIdForShares = orgPath.split('/')[1];
    window.__store['orgs/' + orgIdForShares + '/members/uJane'] = {
      identity: { name: 'Jane Smith', email: 'jane@acme.com' },
      assessment: { tier: 'Lots of Experience', overallPct: 72, categoryPct: { discovery: 80, aiOrg: 55 }, submittedAt: '2026-10-05T10:00:00.000Z',
        answers: [{ n: 1, question: 'How do you validate a new idea?', answer: 'Structured discovery', points: 2 }, { n: 2, question: 'Second question?', answer: 'Second answer', points: 1 }] },
      courses: { 'discovery-novice': { completed: [1, 2], lastLesson: 2, updatedAt: '2026-10-07T09:00:00.000Z' }, 'aiOrg-moderate': { completed: [1], lastLesson: 1, updatedAt: '2026-10-06T09:00:00.000Z' } },
      lastActiveAt: '2026-10-07T09:00:00.000Z', updatedAt: Timestamp.now() };
    window.__store['memberships/uGone'] = Object.assign({}, window.__store['memberships/uJane'], { email: '', displayName: '', phone: '' });
    window.__store['orgs/' + orgIdForShares + '/members/uGone'] = { identity: null, assessment: { tier: 'Moderate Experience', overallPct: 48, categoryPct: { discovery: 40 } }, courses: {}, lastActiveAt: null, updatedAt: Timestamp.now() };
    location.hash = ''; await sleep(100);

    /* ---- 4. all-companies list ---- */
    t('back arrow returns to the list', vis('viewList') && !vis('viewDetail'));
    t('with one company the LIST is on top and the form is closed', $('listCard').style.order === '0' && !vis('formCard'));
    t('"+ Create company" button is available again', $('newCompanyBtn').style.display !== 'none');
    const cellsOf = () => { const r = $('orgTableWrap').querySelector('tbody tr'); return r ? Array.prototype.map.call(r.querySelectorAll('td'), textOf) : []; };
    await until(() => cellsOf()[2] === '3');
    const headers = Array.prototype.map.call($('orgTableWrap').querySelectorAll('th'), th => th.textContent.trim());
    t('list columns: company, seats, active users, stage, created, last modified, notes, status',
      ['Company', 'Seats', 'Active users', 'Stage', 'Created', 'Last modified', 'Notes', 'Status'].every(h => headers.indexOf(h) > -1), headers.join('|'));
    const listText = textOf($('orgTableWrap'));
    const c = cellsOf();
    t('list row shows company, seats, active user count, created, last modified, notes and a View button',
      /Acme Health/.test(c[0]) && c[1] === '3' && c[2] === '3' && c[3] === '—' && /2026/.test(c[4]) && /2026/.test(c[5]) && /Pilot customer/.test(c[6]) && /Active/.test(c[7]) && /View/.test(c[8]), c.join(' | '));
    t('the list no longer shows the priority areas', !/Customer & Market|Priority|Discovery/.test(listText));
    if (stopAt === 4) return finish();

    /* ---- second company, search, sort ---- */
    // a pilot record for the first company, so the list can show its stage (see owner-pilot.html)
    window.__store['orgPilot/' + orgPath.split('/')[1]] = { stage: 'pilot_running', nextCheckin: '2020-01-01', pilotStart: '', pilotEnd: '', renewalDate: '', baselineDay: '', sponsor: '', pilotSize: 0, goals: [], done: [], summaryNote: '', updatedAt: Timestamp.now() };
    click('newCompanyBtn'); await sleep(80);
    t('create form opens BELOW the list when companies exist', vis('formCard') && $('formCard').style.order === '1' && $('listCard').style.order === '0');
    setVal('orgName', 'Zenith Clinics'); setVal('orgPlan', 'flat'); setVal('contactName', 'Zed');
    click('saveBtn');
    await until(() => vis('viewDetail')); await sleep(150);
    t('flat company created, no invites when no admin given', Object.keys(window.__store).filter(p => p.indexOf('invites/') === 0).length === 5 && !vis('linksCard'));
    t('flat company shows "active users (flat price)"', /flat price/.test(textOf($('detailSummary'))));
    location.hash = ''; await sleep(120);
    await until(() => !/…/.test(textOf($('orgTableWrap'))));
    t('both companies listed', $('orgTableWrap').querySelectorAll('tbody tr').length === 2);
    const acmeRow = Array.prototype.find.call($('orgTableWrap').querySelectorAll('tbody tr'), r => /Acme/.test(r.textContent));
    const zenRow = Array.prototype.find.call($('orgTableWrap').querySelectorAll('tbody tr'), r => /Zenith/.test(r.textContent));
    t('a company with a pilot record shows its stage, and flags an overdue check-in', /Pilot running/.test(textOf(acmeRow)) && /Check-in overdue/.test(textOf(acmeRow)), textOf(acmeRow));
    t('a company with none shows a dash', zenRow.querySelector('td[data-stage]').textContent.trim() === '—');
    setVal('orgSearch', 'zen'); await sleep(50);
    t('search narrows the list by company name', $('orgTableWrap').querySelectorAll('tbody tr').length === 1 && /Zenith/.test($('orgTableWrap').textContent));
    setVal('orgSearch', 'qqq'); await sleep(50);
    t('no matches says so', /No companies match/.test($('orgTableWrap').textContent));
    setVal('orgSearch', ''); setVal('orgSort', 'newest'); await sleep(50);
    t('sort by newest puts the newest first', /Zenith/.test(textOf($('orgTableWrap').querySelector('tbody tr'))));
    setVal('orgSort', 'name'); await sleep(50);
    t('sort by name puts Acme first', /Acme/.test(textOf($('orgTableWrap').querySelector('tbody tr'))));

    /* ---- 5. view, edit, archive ---- */
    const view = Array.prototype.slice.call($('orgTableWrap').querySelectorAll('button')).find(b => b.textContent === 'View');
    view.click(); await until(() => vis('viewDetail')); await sleep(200);
    t('View opens that company', /Acme Health/.test($('detailName').textContent));
    t('the company page links to its pilot tracker and its team dashboard', /^\/owner-pilot\?org=[^&]+$/.test($('pilotLink').getAttribute('href')) && /^\/company\?org=[^&]+$/.test($('teamDashLink').getAttribute('href')) && $('pilotLink').getAttribute('href').split('=')[1] === $('teamDashLink').getAttribute('href').split('=')[1]);
    t('the company page links to that company\'s team dashboard', /^\/company\?org=/.test($('teamDashLink').getAttribute('href')), $('teamDashLink').getAttribute('href'));
    t('people counts appear on the page: 1 admin and 1 user active',
      rowsIn('adminTableWrap').some(r => /Active/.test(textOf(r)) && /Sam Admin/.test(textOf(r))) && rowsIn('userTableWrap').some(r => /Active/.test(textOf(r)) && /Jane Smith/.test(textOf(r))));
    /* ---- what the company sees about each member (checkpoint 3) ---- */
    const janeRow = rowsIn('userTableWrap').find(r => /Jane Smith/.test(textOf(r)));
    const samRow = rowsIn('adminTableWrap').find(r => /Sam Admin/.test(textOf(r)));
    t('an active member shows a one-line summary: tier and score, courses and lessons, last active',
      /Lots of Experience \(72%\)/.test(textOf(janeRow)) && /2 courses, 3 lessons done/.test(textOf(janeRow)) && /Last active Oct 7, 2026/.test(textOf(janeRow)), textOf(janeRow));
    t('a member with nothing shared yet says so', samRow && /Nothing shared yet/.test(textOf(samRow)), textOf(samRow));
    t('a person who deleted their account still shows their results, with no name', (() => { const g = rowsIn('userTableWrap').find(r => /Moderate Experience \(48%\)/.test(textOf(r))); return !!g; })());
    t('invited people (not yet joined) show no shared-data line', rowsIn('userTableWrap').filter(r => /Invited/.test(textOf(r))).every(r => !/Nothing shared yet|Last active/.test(textOf(r))));
    Array.prototype.slice.call(janeRow.querySelectorAll('button')).find(b => b.textContent === 'Details').click();
    await sleep(60);
    const panel = $('userTableWrap').querySelector('.share-box');
    const panelText = textOf(panel);
    t('Details opens the full shared record', !!panel && /Jane Smith · jane@acme\.com/.test(panelText));
    t('it lists the assessment with each skill area and the date', /Lots of Experience · 72% overall · taken Oct 5, 2026/.test(panelText) && /Customer & Market Discovery 80%/.test(panelText) && /AI Fluency — Organizational 55%/.test(panelText), panelText.slice(0, 300));
    t('it lists the individual answers', /Individual answers/.test(panelText) && /How do you validate a new idea\?/.test(panelText) && /Structured discovery  \(2 pts\)|Structured discovery \(2 pts\)/.test(panelText));
    t('it lists courses with readable names, lessons done and last lesson', /Customer & Market Discovery · Limited Experience — 2 lessons done, last lesson 2/.test(panelText) && /AI Fluency — Organizational · Moderate Experience — 1 lesson done/.test(panelText), panelText);
    t('it shows when they were last active', /Last active: Oct 7, 2026/.test(panelText));
    t('nothing private appears (no reflections, templates, phone)', !/reflection|template|555-/i.test(panelText));
    Array.prototype.slice.call(janeRow.querySelectorAll('button')).find(b => b.textContent === 'Hide details') ;
    const hideBtn = Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => b.textContent === 'Hide details');
    hideBtn.click(); await sleep(60);
    t('Hide details closes it', !$('userTableWrap').querySelector('.share-box'));
    const goneRow = rowsIn('userTableWrap').find(r => /Moderate Experience \(48%\)/.test(textOf(r)));
    Array.prototype.slice.call(goneRow.querySelectorAll('button')).find(b => b.textContent === 'Details').click(); await sleep(60);
    t('a deleted account shows "Name and email removed" and no answers note when none were saved',
      /Name and email removed/.test(textOf($('userTableWrap').querySelector('.share-box'))) && /No individual answers recorded/.test(textOf($('userTableWrap').querySelector('.share-box'))));
    Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => b.textContent === 'Hide details').click(); await sleep(40);
    window.__failList = /^orgs\/[^/]+\/members$/;
    location.hash = ''; await sleep(80); location.hash = '#company=' + orgPath.split('/')[1]; await sleep(400);
    const janeRow2 = rowsIn('userTableWrap').find(r => /Jane Smith/.test(textOf(r)));
    t('if the shared records cannot be read, the people list still works and says why', !!janeRow2 && /Shared data unavailable/.test(textOf(janeRow2)), janeRow2 ? textOf(janeRow2) : 'row missing');
    window.__failList = null;
    location.hash = ''; await sleep(80); location.hash = '#company=' + orgPath.split('/')[1]; await sleep(400);
    click('editBtn'); await sleep(100);
    t('Edit opens the form filled in', vis('formCard') && $('orgName').value === 'Acme Health' && $('orgSeats').value === '3' && $('contactName').value === 'Pat Jones' && $('billingAddress').value.indexOf('Springfield') > -1);
    t('edit form hides the first-admin block', $('firstAdminBlock').style.display === 'none');
    t('edit form shows the saved focus order', $('focusRanked').querySelectorAll('.focus-item').length === 7);
    setVal('orgName', 'Acme Health Systems'); setVal('orgSeats', '10');
    $('focusRanked').querySelector('.icon-btn[title="Move down"]').click(); await sleep(60);
    const before = window.__store[orgPath].updatedAt.toMillis();
    await sleep(20);
    click('saveBtn'); await until(() => vis('viewDetail')); await sleep(200);
    t('saving an edit returns to the company page with the new name', /Acme Health Systems/.test($('detailName').textContent) && /of 10 seats/.test(textOf($('detailSummary'))));
    t('last modified time moved forward', window.__store[orgPath].updatedAt.toMillis() > before);
    const editedCopy = window.__store['orgFocus/' + orgPath.split('/')[1]];
    t('editing the focus order updates the company AND the member-readable copy together', window.__store[orgPath].focusAreas[0] === 'strategy' && editedCopy && editedCopy.focusAreas.join() === window.__store[orgPath].focusAreas.join(), JSON.stringify(editedCopy));
    delete window.__store['orgFocus/' + orgPath.split('/')[1]];
    location.hash = ''; await sleep(80); location.hash = '#company=' + orgPath.split('/')[1]; await sleep(400);
    t('a company with no member-readable copy (made before this existed) gets one when the owner opens it', !!window.__store['orgFocus/' + orgPath.split('/')[1]] && window.__store['orgFocus/' + orgPath.split('/')[1]].focusAreas.join() === window.__store[orgPath].focusAreas.join());
    click('archiveBtn'); await sleep(250);
    t('archiving marks the company archived', window.__store[orgPath].status === 'archived' && /Archived/.test($('detailPills').textContent) && $('archiveBtn').textContent === 'Restore');
    click('addUsersBtn'); setVal('usersText', 'late@acme.com'); click('usersCreateBtn'); await sleep(120);
    t('cannot invite people to an archived company', /archived/i.test($('usersError').textContent) && !window.__store['invites/late']);
    click('archiveBtn'); await sleep(250);
    t('restore brings it back', window.__store[orgPath].status === 'active' && $('archiveBtn').textContent === 'Archive');
    await sleep(100);
    const actions = Object.keys(window.__store).filter(k => k.indexOf(orgPath + '/audit/') === 0).map(k => window.__store[k].action);
    t('editing, archiving and restoring were each recorded in the activity log', ['company.created', 'company.edited', 'company.archived', 'company.restored'].every(a => actions.indexOf(a) > -1), actions.join());
    t('the company record still keeps no notes after the edit, and the private copy has the latest', window.__store[orgPath].notes === '' && /Pilot customer/.test(window.__store['orgPrivate/' + orgPath.split('/')[1]].notes));
    if (stopAt === 5) return finish();

    /* ---- add a second admin ---- */
    click('addAdminBtn'); await sleep(50);
    setVal('adminName', 'Riley'); setVal('adminEmail', 'riley@acme.com'); setVal('adminPhone', '555-0199');
    click('adminCreateBtn'); await sleep(250);
    t('a second admin can be invited (multiple admins)', rowsIn('adminTableWrap').length === 3 || rowsIn('adminTableWrap').length === 2);
    setVal('adminEmail', 'sam@acme.com'); click('addAdminBtn'); click('adminCreateBtn'); await sleep(120);
    t('inviting someone who is already an active admin is refused', /Already/.test($('adminError').textContent));

    /* ---- seat limit warning uses confirm ---- */
    let asked = 0; window.confirm = () => { asked++; return false; };
    click('addUsersBtn'); setVal('usersText', Array.from({ length: 12 }, (_, i) => 'x' + i + '@acme.com').join('\n')); click('usersCreateBtn'); await sleep(120);
    t('going over the seat limit asks first, and "Cancel" creates nothing', asked === 1 && !Object.keys(window.__store).some(p => /x3@/.test(JSON.stringify(window.__store[p]))));
    window.confirm = () => true;

    /* ---- the "email now" box, bigger batches, and clear error reasons ---- */
    window.confirm = () => true;
    click('addUsersBtn'); $('usersSendEmail').checked = false;
    setVal('usersText', 'quiet1@acme.com\nquiet2@acme.com'); backendCalls.length = 0; click('usersCreateBtn');
    await until(() => rowsIn('userTableWrap').some(r => /quiet2@acme\.com/.test(textOf(r))));
    await sleep(250);
    t('with "Email the invitations now" unticked, nothing is emailed', backendCalls.length === 0 && rowsIn('userTableWrap').some(r => /quiet1@acme\.com/.test(textOf(r))), String(backendCalls.length));

    $('usersSendEmail').checked = true; click('addUsersBtn');
    setVal('usersText', Array.from({ length: 10 }, (_, i) => 'bulk' + i + '@acme.com').join('\n')); backendCalls.length = 0; click('usersCreateBtn');
    await until(() => /10 of 10 emails sent/.test($('sendStatus').textContent), 6000);
    t('a batch of ten is emailed in full (it must not stop after the first three)', /10 of 10 emails sent/.test($('sendStatus').textContent) && backendCalls.length === 10, backendCalls.length + ' ' + $('sendStatus').textContent);
    t('each of the ten requests used a different invite token', new Set(backendCalls.map(c => c.token)).size === 10);

    backendMode = 'down'; $('usersSendEmail').checked = true; click('addUsersBtn');
    setVal('usersText', Array.from({ length: 6 }, (_, i) => 'down' + i + '@acme.com').join('\n')); backendCalls.length = 0; click('usersCreateBtn');
    await until(() => /emails sent/.test($('sendStatus').textContent) && !$('sendAllBtn').disabled, 6000);
    await sleep(100);
    t('if the email service is not answering, sending stops quickly instead of trying all six', backendCalls.length <= 3 && /0 of 6 emails sent/.test($('sendStatus').textContent) && /isn't set up/.test($('sendStatus').textContent), backendCalls.length + ' ' + $('sendStatus').textContent);
    t('the invites still exist and their links are still shown, so nothing is lost', $('linksTable').querySelectorAll('tbody tr').length === 6);

    backendMode = 'mailerr';
    Array.prototype.slice.call($('userTableWrap').querySelectorAll('button')).find(b => /Send email|Resend email/.test(b.textContent)).click();
    await until(() => /MailApp/.test($('detailError').textContent));
    t('a Gmail permission problem shows the real reason', /Gmail could not send/.test($('detailError').textContent) && /You do not have permission to call MailApp\.sendEmail/.test($('detailError').textContent), $('detailError').textContent);
    backendMode = 'ok';
    /* ---- renew and resend without revoking by hand ---- */
    const orgId = orgPath.split('/')[1];
    const invitesFor = (email) => Object.keys(window.__store).filter(p => p.indexOf('invites/') === 0).map(p => ({ id: p.split('/')[1], d: window.__store[p] })).filter(x => x.d.email === email);
    const rowFor = (wrap, email) => rowsIn(wrap).find(r => new RegExp(email.replace('.', '\\.')).test(textOf(r)));
    const btnIn = (row, label) => Array.prototype.slice.call(row.querySelectorAll('button')).find(b => b.textContent === label);

    // 1. an expired invite: one click renews it and emails the new link
    location.hash = ''; await sleep(80); location.hash = '#company=' + orgId; await sleep(300);
    let row = rowFor('userTableWrap', 'old@acme.com');
    t('an expired invite offers "Renew & email" (and no Send email or Copy link)', row && !!btnIn(row, 'Renew & email') && !btnIn(row, 'Send email') && !btnIn(row, 'Copy link'));
    backendCalls.length = 0;
    btnIn(row, 'Renew & email').click();
    await until(() => invitesFor('old@acme.com').length === 2 && /1 email sent/.test($('detailNotice').textContent), 4000);
    const oldInv = window.__store['invites/expiredOne'];
    const fresh = invitesFor('old@acme.com').find(x => x.id !== 'expiredOne');
    t('renewing creates a NEW invite for the same person, role and company', fresh && fresh.d.role === 'member' && fresh.d.orgId === orgId && fresh.d.status === 'open' && fresh.d.orgName === 'Acme Health Systems', fresh && fresh.d.orgName);
    t('the new invite lasts about 30 days and has its own secret token', fresh && Math.abs(fresh.d.expiresAt.toMillis() - (Date.now() + 30 * 864e5)) < 60000 && fresh.id !== 'expiredOne' && /^[0-9a-f]{32}$/.test(fresh.id));
    t('the old invite is retired (revoked)', oldInv.status === 'revoked');
    t('the new link was emailed, using the NEW token', backendCalls.length === 1 && backendCalls[0].token === (fresh && fresh.id), JSON.stringify(backendCalls.map(c => c.token)));
    row = rowFor('userTableWrap', 'old@acme.com');
    t('the list now shows them as Invited and Emailed, with no expired leftover', row && /Invited/.test(textOf(row)) && /Emailed/.test(textOf(row)) && rowsIn('userTableWrap').filter(r => /old@acme\.com/.test(textOf(r))).length === 1);
    t('a renewed row can be resent again like any other', row && !!btnIn(row, 'Resend email'));

    // 2. an expired ADMIN invite keeps its admin role
    window.__store['invites/expiredAdmin'] = { orgId: orgId, orgName: 'Acme Health', email: 'oldadmin@acme.com', name: 'Old Admin', phone: '555-0199', role: 'admin', status: 'open',
      createdAt: Timestamp.now(), createdBy: 'owner1', expiresAt: Timestamp.fromMillis(Date.now() - 2 * 864e5), usedBy: null, usedAt: null };
    location.hash = ''; await sleep(80); location.hash = '#company=' + orgId; await sleep(300);
    row = rowFor('adminTableWrap', 'oldadmin@acme.com');
    btnIn(row, 'Renew & email').click();
    await until(() => invitesFor('oldadmin@acme.com').length === 2 && /email sent/.test($('detailNotice').textContent), 4000);
    const freshAdmin = invitesFor('oldadmin@acme.com').find(x => x.id !== 'expiredAdmin');
    t('renewing an admin invite keeps the admin role, name and phone', freshAdmin && freshAdmin.d.role === 'admin' && freshAdmin.d.name === 'Old Admin' && freshAdmin.d.phone === '555-0199');

    // 3. an invite emailed three times already: offer a new link instead
    backendMode = 'toomany';
    row = rowFor('userTableWrap', 'quiet1@acme.com');
    btnIn(row, 'Send email').click();
    await until(() => !!btnIn(rowFor('userTableWrap', 'quiet1@acme.com'), 'New link & email'));
    row = rowFor('userTableWrap', 'quiet1@acme.com');
    t('after the 3-email limit the row offers "New link & email" instead of Resend', !!btnIn(row, 'New link & email') && !btnIn(row, 'Resend email') && !btnIn(row, 'Send email'));
    backendMode = 'ok';
    const quietBefore = invitesFor('quiet1@acme.com').length;
    btnIn(row, 'New link & email').click();
    await until(() => invitesFor('quiet1@acme.com').length === quietBefore + 1 && /email sent/.test($('detailNotice').textContent), 4000);
    t('that creates a fresh invite and retires the stale one', invitesFor('quiet1@acme.com').filter(x => x.d.status === 'open').length === 1 && invitesFor('quiet1@acme.com').some(x => x.d.status === 'revoked'));

    // 4. resend to everyone who has not joined yet
    const pendingUsers = rowsIn('userTableWrap').filter(r => /Invited/.test(textOf(r))).length;
    t('"Resend to everyone pending" is offered when people are pending', $('resendUsersBtn').style.display !== 'none' && $('resendAdminsBtn').style.display !== 'none');
    backendCalls.length = 0;
    click('resendUsersBtn');
    await until(() => /emails? sent/.test($('detailNotice').textContent) && backendCalls.length >= pendingUsers, 6000);
    await sleep(150);
    t('it emails every pending user (and only them)', backendCalls.length === pendingUsers && pendingUsers > 5, backendCalls.length + ' vs ' + pendingUsers);
    t('and reports the result under the company name even though the new-links box is closed', new RegExp(pendingUsers + ' emails sent').test($('detailNotice').textContent), $('detailNotice').textContent);

    /* ---- removing a member ---- */
    const janeBeforeRemove = rowsIn('userTableWrap').find(r => /Jane Smith/.test(textOf(r)));
    const removeJane = janeBeforeRemove && Array.prototype.find.call(janeBeforeRemove.querySelectorAll('button'), b => b.textContent.trim() === 'Remove');
    t('an active person has a Remove button; invited people do not', !!removeJane && !rowsIn('userTableWrap').filter(r => /Invited/.test(textOf(r))).some(r => Array.prototype.some.call(r.querySelectorAll('button'), b => b.textContent.trim() === 'Remove')));
    removeJane.click(); await sleep(300);
    const janeDoc = window.__store['memberships/uJane'];
    t('removing ends the membership (status removed, server end date), changing nothing else', janeDoc.status === 'removed' && janeDoc.endedAt && typeof janeDoc.endedAt.toMillis === 'function' && janeDoc.role === 'member' && janeDoc.email === 'jane@acme.com', JSON.stringify(janeDoc));
    const janeAfterRemove = rowsIn('userTableWrap').find(r => /Jane Smith/.test(textOf(r)) && /Left/.test(textOf(r)));
    t('the list shows them as Left, with no Remove button, and their shared data still there', !!janeAfterRemove && /Left/.test(textOf(janeAfterRemove)) && !Array.prototype.some.call(janeAfterRemove.querySelectorAll('button'), b => b.textContent.trim() === 'Remove') && !!window.__store['orgs/' + orgIdForShares + '/members/uJane'], janeAfterRemove && textOf(janeAfterRemove));
    t('and the page confirms', /was removed/.test($('detailNotice').textContent), $('detailNotice').textContent);
    await sleep(100);
    const auditAll = Object.keys(window.__store).filter(k => k.indexOf(orgPath + '/audit/') === 0).map(k => window.__store[k]);
    t('the removal and the invitations made along the way are in the activity log', auditAll.some(e => e.action === 'member.removed' && e.targetEmail === 'jane@acme.com') && auditAll.filter(e => e.action === 'invite.created').length >= 4 && auditAll.some(e => e.action === 'invite.revoked'), auditAll.map(e => e.action).join());

    /* ---- a company saved before private notes existed ---- */
    window.__store['orgs/legacy1'] = { name: 'Legacy Co', plan: 'flat', seatLimit: null, focusAreas: [], notes: 'old private note about pricing', status: 'active', createdAt: Timestamp.now(), createdBy: 'owner1', updatedAt: Timestamp.now() };
    location.hash = ''; await sleep(80); location.hash = '#company=' + orgPath.split('/')[1]; await sleep(80); location.hash = ''; await sleep(500);
    t('notes found on a company record are moved to the owner-only place and cleared from the record', window.__store['orgs/legacy1'].notes === '' && window.__store['orgPrivate/legacy1'] && window.__store['orgPrivate/legacy1'].notes === 'old private note about pricing', JSON.stringify(window.__store['orgs/legacy1']));
    t('and the owner still sees that note in the list', /old private note/.test($('orgTableWrap').textContent));

  } catch (e) {
    out.push('FAIL test script crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  finish();
})();

async function dragTest(){
  const rankedKeys = () => Array.prototype.map.call($('focusRanked').querySelectorAll('.focus-item'), li => li.dataset.key);
  const bucketKeys = () => Array.prototype.map.call($('focusBucket').querySelectorAll('.focus-item'), li => li.dataset.key);
  const center = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2 - 20, y: r.top + r.height / 2 }; };
  async function drag(item, to){
    const from = center(item);
    const base = { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0 };
    item.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ clientX: from.x, clientY: from.y, buttons: 1 }, base)));
    const steps = 8;
    for (let i = 1; i <= steps; i++){
      const x = from.x + (to.x - from.x) * i / steps, y = from.y + (to.y - from.y) * i / steps;
      document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: x, clientY: y, buttons: 1 }, base)));
      await sleep(70);
    }
    await sleep(120);
    document.dispatchEvent(new PointerEvent('pointerup', Object.assign({ clientX: to.x, clientY: to.y, buttons: 0 }, base)));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: to.x, clientY: to.y, button: 0 }));
    await sleep(400);
  }
  $('focusRanked').scrollIntoView({ block: 'center' });
  await sleep(100);
  let first = $('focusRanked').querySelector('.focus-item');
  const lastItem = $('focusRanked').querySelector('.focus-item[data-key="aiOrg"]');
  const top = first.getBoundingClientRect();
  await drag(lastItem, { x: top.left + top.width / 2 - 20, y: top.top + 3 });
  t('dragging the last item to the top ranks it first', rankedKeys()[0] === 'aiOrg' && rankedKeys().length === 7, rankedKeys().join());
  out.push('DEBUG after drag1: ranked=' + rankedKeys().join() + ' ranks=' + Array.prototype.map.call($('focusRanked').querySelectorAll('.focus-rank'), e => e.textContent).join('') + ' bucket=' + bucketKeys().join() + ' ghostLeft=' + Array.prototype.map.call(document.querySelectorAll('.focus-drag,.focus-ghost,.focus-chosen'), e => e.className + '@' + (e.dataset.key||'')).join(';') + ' active=' + !!Sortable.active + ' bodyKids=' + document.body.children.length);
  t('numbers update after the drag', $('focusRanked').querySelector('.focus-rank').textContent === '1');

  const disc = $('focusRanked').querySelector('.focus-item[data-key="discovery"]');
  out.push('DEBUG before drag2: disc found=' + !!disc + ' rect=' + (disc ? JSON.stringify(disc.getBoundingClientRect()) : ''));
  const bucket = $('focusBucket').getBoundingClientRect();
  await drag(disc, { x: bucket.left + bucket.width / 2, y: bucket.top + 40 });
  t('dragging an item into "Not a priority" removes it from the ranking', bucketKeys().indexOf('discovery') > -1 && rankedKeys().indexOf('discovery') === -1, 'ranked=' + rankedKeys().join() + ' bucket=' + bucketKeys().join());
  t('the bucket item shows no rank number', !$('focusBucket').querySelector('.focus-item[data-key="discovery"] .focus-rank'));

  const back = $('focusBucket').querySelector('.focus-item[data-key="discovery"]');
  const rk = $('focusRanked').querySelectorAll('.focus-item'); const mid = rk[2].getBoundingClientRect();
  await drag(back, { x: mid.left + mid.width / 2 - 20, y: mid.top + 3 });
  t('dragging it back into the ranking puts it where it was dropped', rankedKeys().indexOf('discovery') === 2, rankedKeys().join());

  const firstBtn = $('focusRanked').querySelector('.focus-item .icon-btn[title="Move down"]');
  const before = rankedKeys().slice();
  firstBtn.click(); await sleep(60);
  t('the arrow buttons still work', rankedKeys()[0] === before[1] && rankedKeys()[1] === before[0], rankedKeys().join());
  click('focusResetBtn'); await sleep(60);
  t('"Reset to default order" restores the standard ranking', rankedKeys().join() === 'discovery,strategy,prioritization,execution,stakeholder,aiIndividual,aiOrg' && bucketKeys().length === 0);
}