import { Timestamp, serverTimestamp } from './fake-firebase.js';
import { syncOrgShare, recordOrgMembership, anonymizeOrgShares } from './org-share.js';

const out = [];
const t = (label, ok, extra) => out.push((ok ? 'PASS ' : 'FAIL ') + label + (ok || !extra ? '' : '   [' + extra + ']'));
const store = window.__store;
const db = {};
const user = { uid: 'u1', displayName: 'Jane Smith', email: 'Jane@Acme.com' };
const writesTo = (path) => window.__writeLog.filter(w => w.path === path).length;
const SHARE = 'orgs/orgA/members/u1';

function member(over){ return Object.assign({ orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active', inviteToken: 't', joinedAt: Timestamp.now(), endedAt: null, email: 'jane@acme.com', displayName: 'Jane Smith', phone: '555-0100' }, over || {}); }
function progressDoc(){
  return {
    profile: { phone: '555-0199', jobTitle: 'PM' }, totalActiveMs: 5000, agreedToTermsAt: '2026-01-01T00:00:00.000Z',
    assessmentResult: { tier: 'Moderate Experience', overallPct: 55, categoryPct: { discovery: 50 }, assessmentId: 'a1', submittedAt: '2026-10-05T10:00:00.000Z',
      answers: [{ n: 1, cat: 'discovery', question: 'Q1', answer: 'A1', points: 1 }] },
    courses: { 'discovery-novice': { completed: [1], lastLesson: 1, updatedAt: '2026-10-06T10:00:00.000Z', reflections: { l1: 'PRIVATE' }, template: { x: 'SECRET' } } }
  };
}
const jsonOf = (p) => JSON.stringify(store[p]);

(async function(){
  try {
    localStorage.clear();

    /* ---- not in a company ---- */
    store['progress/u1'] = progressDoc();
    let r = await syncOrgShare(db, user);
    t('a person who is not in a company: nothing is shared or written', r.status === 'not_member' && window.__writeLog.length === 0, JSON.stringify(r));
    t('no user at all is harmless', (await syncOrgShare(db, null)).status === 'no_user');

    /* ---- active member ---- */
    store['memberships/u1'] = member();
    r = await syncOrgShare(db, user);
    t('an active member\'s record is written to their own company', r.status === 'synced' && r.orgId === 'orgA' && !!store[SHARE], JSON.stringify(r));
    const s = store[SHARE];
    t('it holds identity, assessment, courses and last-active only', JSON.stringify(Object.keys(s).sort()) === JSON.stringify(['assessment', 'courses', 'identity', 'lastActiveAt', 'updatedAt']), Object.keys(s).join());
    t('identity is the account name and a lower-case email', s.identity.name === 'Jane Smith' && s.identity.email === 'jane@acme.com');
    t('the assessment and answers came across', s.assessment.tier === 'Moderate Experience' && s.assessment.answers.length === 1 && s.assessment.answers[0].answer === 'A1');
    t('private reflections, templates, phone and profile did NOT come across', !/PRIVATE|SECRET|555-0|jobTitle|totalActiveMs|agreedToTermsAt/.test(jsonOf(SHARE)));
    t('last active is the newest activity', s.lastActiveAt === '2026-10-06T10:00:00.000Z', s.lastActiveAt);
    t('the update time was set by the server', s.updatedAt instanceof Timestamp);
    t('the person\'s own progress record was not changed', JSON.stringify(store['progress/u1']) === JSON.stringify(progressDoc()));

    /* ---- change detection ---- */
    window.__writeLog.length = 0;
    r = await syncOrgShare(db, user);
    t('syncing again with nothing new writes nothing', r.status === 'unchanged' && writesTo(SHARE) === 0, JSON.stringify(r));
    store['progress/u1'].courses['discovery-novice'].completed = [1, 2];
    store['progress/u1'].courses['discovery-novice'].updatedAt = '2026-10-08T10:00:00.000Z';
    r = await syncOrgShare(db, user);
    t('finishing another lesson updates the shared record', r.status === 'synced' && JSON.stringify(store[SHARE].courses['discovery-novice'].completed) === '[1,2]' && store[SHARE].lastActiveAt === '2026-10-08T10:00:00.000Z');
    window.__writeLog.length = 0;
    r = await syncOrgShare(db, user, { force: true });
    t('force writes even when nothing changed', r.status === 'synced' && writesTo(SHARE) === 1);

    /* ---- a retaken assessment replaces the old one ---- */
    store['progress/u1'].assessmentResult = Object.assign({}, store['progress/u1'].assessmentResult, { tier: 'Lots of Experience', overallPct: 80, assessmentId: 'a2', submittedAt: '2026-10-09T10:00:00.000Z' });
    await syncOrgShare(db, user);
    t('a retaken assessment replaces the earlier result and moves last-active forward', store[SHARE].assessment.tier === 'Lots of Experience' && store[SHARE].assessment.assessmentId === 'a2' && store[SHARE].lastActiveAt === '2026-10-09T10:00:00.000Z');

    /* ---- membership has ended ---- */
    const frozen = jsonOf(SHARE);
    store['memberships/u1'] = member({ status: 'removed', endedAt: Timestamp.now() });
    store['progress/u1'].courses['discovery-novice'].completed = [1, 2, 3];
    window.__writeLog.length = 0;
    r = await syncOrgShare(db, user, { force: true });
    t('once the membership has ended nothing more is shared', r.status === 'inactive' && window.__writeLog.length === 0 && jsonOf(SHARE) === frozen, JSON.stringify(r));

    /* ---- joining a new company later uses a separate record ---- */
    store['memberships/u1'] = member({ orgId: 'orgB', orgName: 'Beta' });
    r = await syncOrgShare(db, user);
    t('in a new company, a separate record is made there and the old one stays frozen', r.status === 'synced' && r.orgId === 'orgB' && !!store['orgs/orgB/members/u1'] && jsonOf(SHARE) === frozen);

    /* ---- failures do not escape as silent success ---- */
    window.__failWrite = /orgs\/orgB\/members\/u1/;
    localStorage.clear();
    let threw = false;
    try { await syncOrgShare(db, user, { force: true }); } catch (e) { threw = true; }
    t('a refused write is reported to the caller (the pages catch it and carry on)', threw === true);
    window.__failWrite = null;

    /* ---- remembering which companies a person has been in ---- */
    await recordOrgMembership(db, 'u1', 'orgA');
    await recordOrgMembership(db, 'u1', 'orgB');
    await recordOrgMembership(db, 'u1', 'orgA');
    t('company history is kept without duplicates', JSON.stringify(store['progress/u1'].orgIds) === JSON.stringify(['orgA', 'orgB']), JSON.stringify(store['progress/u1'].orgIds));
    t('and the rest of the progress record is untouched', store['progress/u1'].assessmentResult.assessmentId === 'a2' && store['progress/u1'].profile.jobTitle === 'PM');

    /* ---- account deletion: blank the name on every copy ---- */
    store['memberships/u1'] = member({ orgId: 'orgB', orgName: 'Beta' });
    window.__writeLog.length = 0;
    r = await anonymizeOrgShares(db, user);
    t('the name and email are blanked on the current AND the former company\'s copy', store[SHARE].identity === null && store['orgs/orgB/members/u1'].identity === null && r.blanked === 2 && r.companies === 2, JSON.stringify(r));
    t('their results stay with each company', store[SHARE].assessment.assessmentId === 'a2' && store['orgs/orgB/members/u1'].assessment.assessmentId === 'a2');
    t('the membership record loses name, email and phone', store['memberships/u1'].email === '' && store['memberships/u1'].displayName === '' && store['memberships/u1'].phone === '' && store['memberships/u1'].orgId === 'orgB' && store['memberships/u1'].role === 'member');
    window.__writeLog.length = 0;
    r = await anonymizeOrgShares(db, user);
    t('running it twice changes nothing further', r.blanked === 0 && window.__writeLog.length === 0, JSON.stringify(r));

    delete store['memberships/u2'];
    store['progress/u2'] = {};
    r = await anonymizeOrgShares(db, { uid: 'u2' });
    t('a person who was never in a company: nothing to do', r.companies === 0 && r.blanked === 0);

    store['memberships/u3'] = member({ orgId: 'orgC' });
    store['orgs/orgC/members/u3'] = { identity: { name: 'N', email: 'n@x.com' }, assessment: null, courses: {}, lastActiveAt: null, updatedAt: Timestamp.now() };
    window.__failWrite = /orgs\/orgC\/members\/u3/;
    threw = false;
    try { await anonymizeOrgShares(db, { uid: 'u3' }); } catch (e) { threw = true; }
    t('if blanking fails it throws, so the page can stop the deletion', threw === true && store['orgs/orgC/members/u3'].identity !== null);
    window.__failWrite = null;
  } catch (e) {
    out.push('FAIL crashed: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e));
  }
  (window.__errs || []).forEach(e => out.push('PAGE-ERROR ' + e));
  document.title = out.join(' || ');
})();
