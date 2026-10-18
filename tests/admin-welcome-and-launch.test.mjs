// Tests for sections 12-13 of apps-script/Code.gs: the welcome for a company's admin, and the tool launch emails.
// Run:  node --experimental-default-type=module tests/admin-welcome-and-launch.test.mjs
// The script is loaded into a sandbox with stand-ins for Google's services, so nothing real is touched.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}

/* ------------------------------------------------ stand-ins for Google */
let sheets, props, sentMail, gmailSent, quota, fetchLog, aliases, accounts, memberships, tools, votes, mailThrowsOn, voteQueryStatus;
const HOUR = 3600000;
function reset(){
  sheets = {}; props = {}; sentMail = []; gmailSent = []; quota = 100; fetchLog = []; aliases = []; mailThrowsOn = null; voteQueryStatus = 200;
  accounts = {
    'admin-token': { localId: 'adminA', email: 'Ann.Admin@Acme.com', displayName: 'Ann Admin' },
    'member-token': { localId: 'memberA', email: 'ben@acme.com' },
    'oldadmin-token': { localId: 'oldAdmin', email: 'old@acme.com' },
    'exadmin-token': { localId: 'exAdmin', email: 'ex@acme.com' },
    'otheradmin-token': { localId: 'adminB', email: 'b@beta.com' },
    'noname-token': { localId: 'adminN', email: 'nn@acme.com' },
    'html-token': { localId: 'adminH', email: 'h@acme.com', displayName: '<b>Hal</b>' },
    'owner-token': { localId: 'owner1', email: 'rob@owner.com' },
    'stranger-token': { localId: 'stranger', email: 's@x.com' }
  };
  const m = (role, status, joinedHoursAgo, orgId, orgName) => ({ orgId: orgId || 'orgA', orgName: orgName || 'Acme Health', role, status, joinedAtMs: Date.now() - joinedHoursAgo * HOUR });
  memberships = {
    adminA: m('admin', 'active', 1), memberA: m('member', 'active', 1), oldAdmin: m('admin', 'active', 24 * 10), exAdmin: m('admin', 'removed', 1),
    adminB: m('admin', 'active', 1, 'orgB', 'Beta Co'), adminN: m('admin', 'active', 1), adminH: m('admin', 'active', 1, 'orgA', '<i>Acme</i> & Sons')
  };
  tools = {
    tReleased: { title: 'Pricing Worksheet', description: 'A worksheet for pricing B2B products.', status: 'released', launchUrl: 'https://example.com/pricing' },
    tPlanned: { title: 'Roadmap Canvas', description: 'x', status: 'planned', launchUrl: '' },
    tNoLink: { title: 'Metrics Map', description: 'y', status: 'released', launchUrl: '' },
    tHttp: { title: 'Insecure', description: 'z', status: 'released', launchUrl: 'http://example.com/x' }
  };
  votes = [
    { toolId: 'tReleased', email: 'a@x.com', notify: true }, { toolId: 'tReleased', email: 'B@X.com', notify: true }, { toolId: 'tReleased', email: 'c@x.com', notify: false },
    { toolId: 'tReleased', email: 'a@x.com', notify: true },                        // the same address twice
    { toolId: 'tReleased', email: 'not-an-email', notify: true }, { toolId: 'tPlanned', email: 'p@x.com', notify: true }
  ];
}
reset();

const mkSheet = (name) => {
  const rows = sheets[name];
  return {
    appendRow: (r) => { rows.push(r); }, getLastRow: () => rows.length, setFrozenRows(){},
    getDataRange: () => ({ getValues: () => rows }),
    getRange: (row, col, n, w) => ({ getValues: () => rows.slice(row - 1, row - 1 + n).map(r => r.slice(col - 1, col - 1 + (w || 1))) }),
    deleteRow: (i) => { rows.splice(i - 1, 1); }
  };
};
const sandbox = {
  console, Date, Math, JSON, Object, Array, String, Number, isFinite, parseInt, encodeURIComponent, RegExp, Set, Error,
  Logger: { log(){} },
  Session: { getScriptTimeZone: () => 'UTC' },
  Utilities: { formatDate: (d) => new Date(d).toISOString().slice(0, 10) },
  ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (x) => ({ text: x, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); },
    deleteProperty: (k) => { delete props[k]; }, getKeys: () => Object.keys(props) }) },
  CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {}, waitLock() {} }) },
  MailApp: { getRemainingDailyQuota: () => quota, sendEmail: (m) => { if (mailThrowsOn && (mailThrowsOn === true || m.to === mailThrowsOn)) throw new Error('mail down'); sentMail.push(m); quota--; } },
  GmailApp: { getAliases: () => aliases, sendEmail: (to, subject, body, opts) => { gmailSent.push({ to, subject, body, opts }); quota--; } },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({
    getSheetByName: (n) => (sheets[n] ? mkSheet(n) : null),
    insertSheet: (n) => { sheets[n] = []; return mkSheet(n); } }) },
  UrlFetchApp: { fetch: (url, opts) => {
    fetchLog.push({ url, opts });
    const res = (code, body) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
    if (url.indexOf('identitytoolkit') > -1) {
      const tok = JSON.parse(opts.payload).idToken;
      return accounts[tok] ? res(200, { users: [accounts[tok]] }) : res(400, { error: { message: 'INVALID_ID_TOKEN' } });
    }
    if (url.indexOf('firestore.googleapis.com') > -1) {
      const tok = opts.headers.Authorization.replace('Bearer ', '');
      const uid = accounts[tok] && accounts[tok].localId;
      let m = url.match(/platformAdmins\/([^?]+)$/);
      if (m) return decodeURIComponent(m[1]) === 'owner1' && uid === 'owner1' ? res(200, { fields: {} }) : res(404, {});
      m = url.match(/memberships\/([^?]+)$/);
      if (m) {
        const d = memberships[decodeURIComponent(m[1])];
        return d && decodeURIComponent(m[1]) === uid ? res(200, { fields: { orgId: { stringValue: d.orgId }, orgName: { stringValue: d.orgName }, role: { stringValue: d.role }, status: { stringValue: d.status },
          joinedAt: { timestampValue: new Date(d.joinedAtMs).toISOString() } } }) : res(404, {});
      }
      m = url.match(/\/documents\/tools\/([^?]+)$/);
      if (m) { const d = tools[decodeURIComponent(m[1])]; return d ? res(200, { fields: { title: { stringValue: d.title }, description: { stringValue: d.description }, status: { stringValue: d.status }, launchUrl: { stringValue: d.launchUrl } } }) : res(404, {}); }
      if (/:runQuery$/.test(url)) {
        if (voteQueryStatus !== 200) return res(voteQueryStatus, {});
        if (uid !== 'owner1') return res(403, {});
        const q = JSON.parse(opts.payload).structuredQuery;
        const want = q.where.fieldFilter.value.stringValue;
        const rows = votes.filter(v => v.toolId === want).map(v => ({ document: { fields: { toolId: { stringValue: v.toolId }, email: { stringValue: v.email }, notify: { booleanValue: v.notify } } } }));
        return res(200, rows.length ? rows : [{ readTime: 'x' }]);
      }
    }
    throw new Error('unexpected url ' + url);
  } }
};
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
const G = (name) => ctx[name];
const run = (code) => vm.runInContext(code, ctx);

console.log('--- the welcome for a company\'s admin ---');
{
  reset();
  const aw = G('adminWelcomeEndpoint_');
  t('a token Google does not accept is refused', aw('nope', 'orgA').error === 'not_verified' && sentMail.length === 0);
  t('a company id that is not an id is refused before anything is read', (() => { fetchLog = []; const x = aw('admin-token', '../x'); return x.error === 'not_admin' && !fetchLog.some(f => /firestore/.test(f.url)); })());
  t('a plain member is refused', aw('member-token', 'orgA').error === 'not_admin' && sentMail.length === 0);
  t('an admin whose membership ended is refused', aw('exadmin-token', 'orgA').error === 'not_admin');
  t('an admin of a different company than the one named is refused', aw('otheradmin-token', 'orgA').error === 'not_admin');
  t('a stranger with no membership is refused', aw('stranger-token', 'orgA').error === 'not_admin');
  t('an admin who joined ten days ago gets nothing and nothing is recorded', (() => { const x = aw('oldadmin-token', 'orgA'); return x.ok === true && x.skipped === 'not_new' && sentMail.length === 0 && !sheets.AdminWelcomes; })());

  reset();
  const r = aw('admin-token', 'orgA');
  t('a new admin gets the welcome', r.ok === true && r.sent === true);
  const w = sentMail.filter(m => m.to === 'ann.admin@acme.com')[0];
  t('it goes only to that admin\'s own address', !!w && sentMail.filter(m => m.to !== 'rob@productadvisory.co').length === 1);
  t('the subject names the company', w.subject === 'Your Acme Health dashboard is ready');
  t('replies go to assessment@, and it is sent as Product Advisory Learning', w.replyTo === 'assessment@productadvisory.co' && w.name === 'Product Advisory Learning');
  t('it greets them by first name and names the company', /^Hi Ann,/.test(w.body) && /admin of Acme Health/.test(w.body));
  t('it explains the five steps: dashboard, invite, focus, assessment, report', /company\.html/.test(w.body) && /Add users/.test(w.body) && /Our focus/.test(w.body) && /free assessment first/.test(w.body) && /Print or save as PDF/.test(w.body));
  t('it names the right mailboxes: assessment, sales, legal, feedback', /assessment@productadvisory\.co/.test(w.body) && /sales@productadvisory\.co/.test(w.body) && /legal@productadvisory\.co/.test(w.body) && /feedback@productadvisory\.co/.test(w.body));
  t('the HTML has a button to the dashboard', /href="https:\/\/assessment\.productadvisory\.co\/company\.html"/.test(w.htmlBody));
  const note = sentMail.filter(m => m.to === 'rob@productadvisory.co')[0];
  t('Rob is told, with a link to the pilot tracker for that company', !!note && /Admin joined: Acme Health/.test(note.subject) && /ann\.admin@acme\.com/.test(note.body) && /owner-pilot\.html\?org=orgA/.test(note.body));
  t('the admin was recorded (date, user, company, email)', sheets.AdminWelcomes.length === 2 && sheets.AdminWelcomes[0].join() === 'Sent,User ID,Company ID,Email' && sheets.AdminWelcomes[1][1] === 'adminA' && sheets.AdminWelcomes[1][2] === 'orgA' && sheets.AdminWelcomes[1][3] === 'ann.admin@acme.com');
  const again = aw('admin-token', 'orgA');
  t('asking again sends nothing more', again.skipped === 'already' && sentMail.length === 2);

  reset();
  aw('noname-token', 'orgA');
  t('with no name it says "Hi there,"', /^Hi there,/.test(sentMail[0].body));
  reset();
  aw('html-token', 'orgA');
  const h = sentMail.filter(m => m.to === 'h@acme.com')[0];
  t('markup in a name or a company name is escaped in the HTML', /Hi &lt;b&gt;Hal&lt;\/b&gt;/.test(h.htmlBody) && /&lt;i&gt;Acme&lt;\/i&gt; &amp; Sons/.test(h.htmlBody) && !/<i>Acme/.test(h.htmlBody));

  reset(); props['adminwelcomeday_' + new Date().toISOString().slice(0, 10)] = '20';
  t('after 20 a day it stops and records nothing', aw('admin-token', 'orgA').error === 'daily_limit' && sentMail.length === 0);
  reset(); quota = 9;
  t('when Gmail is nearly out of emails it holds back', aw('admin-token', 'orgA').error === 'quota');
  reset(); mailThrowsOn = 'ann.admin@acme.com';
  t('if Gmail fails the admin is not recorded, so it is retried', aw('admin-token', 'orgA').error === 'mail_error' && (!sheets.AdminWelcomes || sheets.AdminWelcomes.length <= 1));
  mailThrowsOn = null;
  t('and then it works', aw('admin-token', 'orgA').sent === true);
  reset(); mailThrowsOn = 'rob@productadvisory.co';
  t('if only the notice to Rob fails, the admin still gets theirs', aw('admin-token', 'orgA').sent === true && sentMail.length === 1);
  reset(); aliases = ['assessment@productadvisory.co', 'noreply@productadvisory.co'];
  aw('admin-token', 'orgA');
  t('with the aliases set up, the admin welcome really comes from assessment@ and the notice from noreply@', gmailSent.filter(g => g.to === 'ann.admin@acme.com')[0].opts.from === 'assessment@productadvisory.co' && gmailSent.filter(g => g.to === 'rob@productadvisory.co')[0].opts.from === 'noreply@productadvisory.co');
  reset();
  const routed = G('doGet')({ parameter: { action: 'adminWelcome', idToken: 'admin-token', org: 'orgA', callback: 'cb' } });
  t('the web address "?action=adminWelcome" is wired up', /^cb\(\{"ok":true,"sent":true\}\);?$/.test(routed.text), routed.text);
  reset(); aw('admin-token', 'orgA');
  const del = G('deleteAccountData_')('admin-token');
  t('deleting an account removes its row from the AdminWelcomes tab too', del.ok === true && del.removed.welcomes >= 1 && sheets.AdminWelcomes.length === 1, JSON.stringify(del));
}

console.log('--- tool launch emails ---');
{
  reset();
  const tl = G('toolLaunchEndpoint_');
  t('a token Google does not accept is refused', tl('nope', 'tReleased', false).error === 'not_verified' && sentMail.length === 0);
  t('anyone but the owner is refused, and nothing is read', (() => { fetchLog = []; const x = tl('admin-token', 'tReleased', false); return x.error === 'not_owner' && sentMail.length === 0 && !fetchLog.some(f => /runQuery/.test(f.url)); })());
  t('a tool id that is not an id is refused', tl('owner-token', '../x', false).error === 'tool_not_found');
  t('a tool that does not exist is reported', tl('owner-token', 'tGone', false).error === 'tool_not_found');
  t('a tool that is not released yet is refused', tl('owner-token', 'tPlanned', false).error === 'not_released' && sentMail.length === 0);
  t('a released tool with no launch link is refused', tl('owner-token', 'tNoLink', false).error === 'no_link');
  t('a launch link that is not https is refused', tl('owner-token', 'tHttp', false).error === 'no_link');
  t('if the votes cannot be read it says so', (() => { voteQueryStatus = 403; const x = tl('owner-token', 'tReleased', false); voteQueryStatus = 200; return x.error === 'votes_unreadable' && sentMail.length === 0; })());

  reset();
  const r = tl('owner-token', 'tReleased', false);
  t('the owner sends the launch emails, once to each person who asked', r.ok === true && r.sent === 2 && r.remaining === 0 && r.alreadySent === 0 && r.people === 2, JSON.stringify(r));
  t('only people who ticked "email me" are emailed, once each, with bad addresses left out', sentMail.map(m => m.to).sort().join() === 'a@x.com,b@x.com', sentMail.map(m => m.to).join());
  const m = sentMail[0];
  t('it is sent as "Toolkit Notification" with replies to toolkit@', m.name === 'Toolkit Notification' && m.replyTo === 'toolkit@productadvisory.co');
  t('the subject says the tool is here', m.subject === 'Pricing Worksheet is here');
  t('it says why they are getting it, links to the tool and the roadmap, and names toolkit@', /You asked us to tell you when Pricing Worksheet launched/.test(m.body) && /https:\/\/example\.com\/pricing/.test(m.body) && /tool-requests\.html/.test(m.body) && /one email because you ticked/.test(m.body) && /toolkit@productadvisory\.co/.test(m.body));
  t('the HTML has an "Open Pricing Worksheet" button to the right link', /href="https:\/\/example\.com\/pricing"[^>]*>Open Pricing Worksheet</.test(m.htmlBody));
  t('each person was recorded for that tool', sheets.ToolLaunchSent.length === 3 && sheets.ToolLaunchSent[1][1] === 'tReleased' && sheets.ToolLaunchSent.slice(1).map(x => x[2]).sort().join() === 'a@x.com,b@x.com');
  const again = tl('owner-token', 'tReleased', false);
  t('pressing again emails nobody twice', again.ok === true && again.sent === 0 && again.alreadySent === 2 && again.remaining === 0 && sentMail.length === 2);
  votes.push({ toolId: 'tReleased', email: 'late@x.com', notify: true });
  const later = tl('owner-token', 'tReleased', false);
  t('someone who ticks the box later is the only one emailed next time', later.sent === 1 && later.alreadySent === 2 && sentMail[2].to === 'late@x.com');

  reset();
  const pv = tl('owner-token', 'tReleased', true);
  t('a preview goes to the owner only, marked [Preview], and records nothing', pv.ok === true && pv.preview === true && pv.people === 2 && sentMail.length === 1 && sentMail[0].to === 'rob@owner.com' && /^\[Preview\] Pricing Worksheet is here$/.test(sentMail[0].subject) && !sheets.ToolLaunchSent);
  t('a preview does not use up anyone\'s one email', tl('owner-token', 'tReleased', false).sent === 2);

  reset(); votes = []; for (let i = 0; i < 200; i++) votes.push({ toolId: 'tReleased', email: 'p' + i + '@x.com', notify: true });
  const big = tl('owner-token', 'tReleased', false);
  t('a big list goes out in batches of 80, and says how many are left', big.sent === 80 && big.remaining === 120 && big.people === 200 && sentMail.length === 80, JSON.stringify(big));
  const next = tl('owner-token', 'tReleased', false);
  t('the next press carries on where it stopped, limited by what Gmail has left (20 left, 15 kept back)', next.sent === 5 && next.alreadySent === 80 && next.remaining === 115, JSON.stringify(next));
  reset(); votes = []; for (let i = 0; i < 30; i++) votes.push({ toolId: 'tReleased', email: 'q' + i + '@x.com', notify: true }); quota = 25;
  const low = tl('owner-token', 'tReleased', false);
  t('it always leaves 15 emails for invitations and requests', low.sent === 10 && low.remaining === 20 && quota === 15, JSON.stringify(low) + ' quota ' + quota);
  reset(); quota = 15;
  t('with only the reserve left, it sends nothing and says quota', tl('owner-token', 'tReleased', false).error === 'quota' && sentMail.length === 0);
  reset(); mailThrowsOn = 'b@x.com';
  const part = tl('owner-token', 'tReleased', false);
  t('if Gmail fails part-way, those already sent are kept and the rest are retried next time', part.sent === 1 && part.error === 'partial' && part.remaining === 1 && sheets.ToolLaunchSent.length === 2);
  mailThrowsOn = null;
  t('and the next press sends only the one left', tl('owner-token', 'tReleased', false).sent === 1 && sentMail.length === 2);
  reset(); mailThrowsOn = true;
  t('if Gmail is down from the start, it says so and records nothing', tl('owner-token', 'tReleased', false).error === 'mail_error' && (!sheets.ToolLaunchSent || sheets.ToolLaunchSent.length <= 1));
  reset(); aliases = ['toolkit@productadvisory.co'];
  tl('owner-token', 'tReleased', false);
  t('with toolkit@ set up in Gmail the emails really come from it, named Toolkit Notification', gmailSent.length === 2 && gmailSent.every(g => g.opts.from === 'toolkit@productadvisory.co' && g.opts.name === 'Toolkit Notification') && sentMail.length === 0);
  reset();
  const routed = G('doGet')({ parameter: { action: 'toolLaunch', idToken: 'owner-token', tool: 'tReleased', callback: 'cb' } });
  t('the web address "?action=toolLaunch" is wired up', /^cb\(\{"ok":true,"sent":2/.test(routed.text), routed.text);
  reset();
  const pvRoute = G('doGet')({ parameter: { action: 'toolLaunch', idToken: 'owner-token', tool: 'tReleased', preview: '1', callback: 'cb' } });
  t('and "preview=1" sends only a preview', /"preview":true/.test(pvRoute.text) && sentMail.length === 1);
  reset(); tools.tReleased.title = '<script>x</script> & Co'; tools.tReleased.description = '<b>bold</b>';
  tl('owner-token', 'tReleased', false);
  t('markup in a tool name or description is escaped in the HTML', !/<script>x/.test(sentMail[0].htmlBody) && /&lt;script&gt;x&lt;\/script&gt; &amp; Co/.test(sentMail[0].htmlBody) && /&lt;b&gt;bold&lt;\/b&gt;/.test(sentMail[0].htmlBody));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
