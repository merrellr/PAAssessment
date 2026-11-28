// Tests for firestore.rules, run against the local Firestore emulator.
//
// How to run (needs Node 20 and Java 21; none of this runs on the live site):
//   npm install firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
//   (from the repo root)
//   npx firebase emulators:exec --only firestore \
//     --project demo-pa "node tests/firestore-rules.test.mjs"
//
// Each line is "can X do Y?". assertSucceeds means the rules must allow it,
// assertFails means they must refuse it. Failing lines print FAIL and the
// script exits with a non-zero code.
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where,
  writeBatch, serverTimestamp, Timestamp, increment
} from 'firebase/firestore';

const rulesPath = process.env.RULES_PATH || './firestore.rules';
const env = await initializeTestEnvironment({
  projectId: 'demo-pa',
  firestore: { rules: fs.readFileSync(rulesPath, 'utf8') }
});

const day = 24 * 60 * 60 * 1000;
const inDays = (n) => Timestamp.fromDate(new Date(Date.now() + n * day));
const now = () => Timestamp.now();

/* ---------------------------------------------------------------- seed data */
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const org = (name, status = 'active') => ({
    name, plan: 'seat', seatLimit: 5, focusAreas: [], notes: '', status,
    createdAt: now(), createdBy: 'owner1', updatedAt: now()
  });
  await setDoc(doc(db, 'platformAdmins/owner1'), { note: 'owner' });
  await setDoc(doc(db, 'orgs/orgA'), org('Acme'));
  await setDoc(doc(db, 'orgs/orgB'), org('Beta'));
  await setDoc(doc(db, 'orgs/orgOld'), org('Old Co', 'archived'));
  await setDoc(doc(db, 'memberships/oldMember'), { orgId: 'orgOld', orgName: 'Old Co', role: 'member', status: 'active', inviteToken: 'seed', joinedAt: now(), endedAt: null, email: 'old@x.com', displayName: 'Old' });
  const tool = (status, count) => ({ title: 'Tool', description: 'd', category: 'c', status: status, order: 1, voteCount: count, createdAt: now(), updatedAt: now() });
  await setDoc(doc(db, 'tools/tA'), tool('planned', 0));
  await setDoc(doc(db, 'tools/tB'), tool('considering', 0));
  await setDoc(doc(db, 'tools/tC'), tool('in_progress', 0));
  await setDoc(doc(db, 'tools/tR'), tool('released', 3));
  await setDoc(doc(db, 'tools/tW'), tool('planned', 3));
  await setDoc(doc(db, 'tools/tZ'), tool('planned', 0));
  await setDoc(doc(db, 'toolVotes/vZero_tZ'), { uid: 'vZero', toolId: 'tZ', email: 'vZero@x.com', notify: false, createdAt: now() });   // count drifted to 0
  await setDoc(doc(db, 'toolVotes/vOrph_tGone'), { uid: 'vOrph', toolId: 'tGone', email: 'vOrph@x.com', notify: false, createdAt: now() }); // the tool was deleted
  for (const u of ['v7', 'v8', 'v9']) await setDoc(doc(db, 'toolVotes/' + u + '_tW'), { uid: u, toolId: 'tW', email: u + '@x.com', notify: false, createdAt: now() });
  await setDoc(doc(db, 'orgs/orgEdit'), org('Edit Me')); // edited by tests, so no invite may depend on its name

  const member = (orgId, orgName, role, status = 'active') => ({
    orgId, orgName, role, status, inviteToken: 'seed', joinedAt: now(),
    endedAt: status === 'removed' ? now() : null, email: 'x@x.com', displayName: 'X'
  });
  await setDoc(doc(db, 'memberships/adminA'), member('orgA', 'Acme', 'admin'));
  await setDoc(doc(db, 'memberships/memberA'), member('orgA', 'Acme', 'member'));
  await setDoc(doc(db, 'memberships/adminB'), member('orgB', 'Beta', 'admin'));
  await setDoc(doc(db, 'memberships/removedR'), member('orgA', 'Acme', 'member', 'removed'));
  // an admin whose own membership has ended must lose admin powers
  await setDoc(doc(db, 'memberships/exAdminA'), member('orgA', 'Acme', 'admin', 'removed'));

  const invite = (orgId, orgName, role, status, expires) => ({
    orgId, orgName, email: 'new@a.com', role, status, createdAt: now(),
    createdBy: 'adminA', expiresAt: expires, usedBy: status === 'used' ? 'someone' : null,
    usedAt: status === 'used' ? now() : null
  });
  await setDoc(doc(db, 'invites/tokOpen'), invite('orgA', 'Acme', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokOpen2'), invite('orgA', 'Acme', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokOpen3'), invite('orgA', 'Acme', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokOpen4'), invite('orgA', 'Acme', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokAdmin'), invite('orgA', 'Acme', 'admin', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokB'), invite('orgB', 'Beta', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokExpired'), invite('orgA', 'Acme', 'member', 'open', inDays(-1)));
  await setDoc(doc(db, 'invites/tokUsed'), invite('orgA', 'Acme', 'member', 'used', inDays(10)));
  await setDoc(doc(db, 'invites/tokRevoked'), invite('orgA', 'Acme', 'member', 'revoked', inDays(10)));
  await setDoc(doc(db, 'invites/tokOld'), invite('orgOld', 'Old Co', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokPhone2'), Object.assign(invite('orgA', 'Acme', 'member', 'open', inDays(10)), { phone: '555-0102' }));
  await setDoc(doc(db, 'invites/tokPhone'), Object.assign(invite('orgA', 'Acme', 'admin', 'open', inDays(10)), { name: 'Sam Admin', phone: '555-0101' }));
  await setDoc(doc(db, 'invites/tokRevokeMe'), invite('orgA', 'Acme', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'invites/tokRevokeMe2'), invite('orgA', 'Acme', 'member', 'open', inDays(10)));
  await setDoc(doc(db, 'progress/memberA'), { courses: {}, profile: { phone: '555' } });
  await setDoc(doc(db, 'memberships/scrubMe'), member('orgA', 'Acme', 'member'));
  for (const id of ['rm1', 'rm2', 'rm3', 'rm4', 'rm5', 'rm6', 'rm7']) await setDoc(doc(db, 'memberships/' + id), member('orgA', 'Acme', 'member'));
  await setDoc(doc(db, 'memberships/rmAdmin'), member('orgA', 'Acme', 'admin'));
  await setDoc(doc(db, 'memberships/rmOtherCo'), member('orgB', 'Beta', 'member'));
  for (const id of ['stA', 'stB']) await setDoc(doc(db, 'memberships/' + id), member('orgA', 'Acme', 'member'));   // DISC Work Styles sharing
  await setDoc(doc(db, 'orgs/orgA/members/rm1'), { identity: { name: 'Seed', email: 'rm1@a.com' }, assessment: null, courses: {}, lastActiveAt: null, updatedAt: now() });
  await setDoc(doc(db, 'memberships/scrubMe2'), member('orgA', 'Acme', 'member'));
  const share = (email) => ({ identity: { name: 'Seed', email }, assessment: { tier: 'Moderate Experience', overallPct: 50 },
    courses: {}, lastActiveAt: '2026-10-01T00:00:00.000Z', updatedAt: now() });
  await setDoc(doc(db, 'orgs/orgA/members/memberA'), share('member@a.com'));
  await setDoc(doc(db, 'orgs/orgA/members/removedR'), share('r@a.com'));
  await setDoc(doc(db, 'orgs/orgA/members/scrubMe'), share('scrub@a.com'));
  await setDoc(doc(db, 'orgs/orgA/members/scrubMe2'), share('scrub2@a.com'));
  await setDoc(doc(db, 'orgs/orgB/members/adminB'), share('admin@b.com'));
});

const owner = env.authenticatedContext('owner1', { email: 'owner@x.com' }).firestore();
const adminA = env.authenticatedContext('adminA', { email: 'admin@a.com' }).firestore();
const memberA = env.authenticatedContext('memberA', { email: 'member@a.com' }).firestore();
const adminB = env.authenticatedContext('adminB', { email: 'admin@b.com' }).firestore();
const exAdminA = env.authenticatedContext('exAdminA', { email: 'ex@a.com' }).firestore();
const stranger = env.authenticatedContext('stranger', { email: 'stranger@x.com' }).firestore();
const anon = env.unauthenticatedContext().firestore();
const asUser = (uid, email) => env.authenticatedContext(uid, { email }).firestore();

let failures = 0;
let passes = 0;
async function check(label, expectation, action) {
  try {
    await (expectation === 'allow' ? assertSucceeds(action()) : assertFails(action()));
    passes++;
    console.log('PASS  ' + label);
  } catch (e) {
    failures++;
    console.log('FAIL  ' + label + '   (' + String(e.message).split('\n')[0].slice(0, 120) + ')');
  }
}
const allow = (label, fn) => check(label, 'allow', fn);
const deny = (label, fn) => check(label, 'deny', fn);

/* ------------------------------------------------------------- org helpers */
const goodOrg = (over = {}) => Object.assign({
  name: 'New Co', plan: 'flat', seatLimit: null, focusAreas: ['aiOrg'], notes: 'hello',
  status: 'active', createdAt: serverTimestamp(), createdBy: 'owner1', updatedAt: serverTimestamp()
}, over);

const goodInvite = (uid, over = {}) => Object.assign({
  orgId: 'orgA', orgName: 'Acme', email: 'p@a.com', role: 'member', status: 'open',
  createdAt: serverTimestamp(), createdBy: uid, expiresAt: inDays(30), usedBy: null, usedAt: null
}, over);

// Accept an invite: create/rewrite the membership and mark the invite used,
// in one batch, exactly as join.html does.
function join(db, uid, email, token, over = {}, inviteOver = {}, rejoin = false) {
  const batch = writeBatch(db);
  const m = Object.assign({
    orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active', inviteToken: token,
    joinedAt: serverTimestamp(), endedAt: null, email: email, displayName: 'New Person'
  }, over);
  // join.html always uses a plain write, even when rewriting a removed
  // member's record, so the tests do the same. `rejoin` only documents intent.
  batch.set(doc(db, 'memberships/' + uid), m);
  batch.update(doc(db, 'invites/' + token), Object.assign(
    { status: 'used', usedBy: uid, usedAt: serverTimestamp() }, inviteOver));
  return batch.commit();
}

/* ============================================================== progress */
console.log('\n--- progress (existing behaviour must not change) ---');
await allow('person reads their own progress', () => getDoc(doc(memberA, 'progress/memberA')));
await allow('person writes their own progress', () => setDoc(doc(stranger, 'progress/stranger'), { courses: {} }));
await allow('person deletes their own progress', () => deleteDoc(doc(stranger, 'progress/stranger')));
await deny('company admin CANNOT read a member\'s personal progress', () => getDoc(doc(adminA, 'progress/memberA')));
await deny('platform owner cannot read a person\'s progress', () => getDoc(doc(owner, 'progress/memberA')));
await deny('signed-out visitor cannot read progress', () => getDoc(doc(anon, 'progress/memberA')));

/* ======================================================= platformAdmins */
console.log('\n--- platformAdmins ---');
await allow('owner can check their own owner record', () => getDoc(doc(owner, 'platformAdmins/owner1')));
await allow('anyone can check their own record (finds nothing)', () => getDoc(doc(stranger, 'platformAdmins/stranger')));
await deny('nobody can read someone else\'s owner record', () => getDoc(doc(stranger, 'platformAdmins/owner1')));
await deny('nobody can list owner records', () => getDocs(collection(owner, 'platformAdmins')));
await deny('nobody can make themselves owner', () => setDoc(doc(stranger, 'platformAdmins/stranger'), { note: 'me' }));
await deny('even the owner cannot write owner records from the app', () => setDoc(doc(owner, 'platformAdmins/x'), { note: 'x' }));

/* ================================================================== orgs */
console.log('\n--- orgs ---');
await allow('owner creates a valid company', () => setDoc(doc(owner, 'orgs/new1'), goodOrg()));
await allow('owner creates a company with a per-seat plan', () => setDoc(doc(owner, 'orgs/new2'), goodOrg({ plan: 'seat', seatLimit: 25 })));
await deny('company with an unknown plan is refused', () => setDoc(doc(owner, 'orgs/bad1'), goodOrg({ plan: 'free' })));
await deny('company with an extra field is refused', () => setDoc(doc(owner, 'orgs/bad2'), goodOrg({ extra: 1 })));
await deny('company with 0 seats is refused', () => setDoc(doc(owner, 'orgs/bad3'), goodOrg({ plan: 'seat', seatLimit: 0 })));
await deny('company with duplicate focus areas is refused', () => setDoc(doc(owner, 'orgs/bad4'), goodOrg({ focusAreas: ['aiOrg', 'aiOrg'] })));
await deny('company with an unknown focus area is refused', () => setDoc(doc(owner, 'orgs/bad5'), goodOrg({ focusAreas: ['nope'] })));
await deny('company with notes over 2000 characters is refused', () => setDoc(doc(owner, 'orgs/bad6'), goodOrg({ notes: 'x'.repeat(2001) })));
await allow('company with point of contact and billing address', () => setDoc(doc(owner, 'orgs/new3'), goodOrg({
  contactName: 'Pat Jones', contactEmail: 'pat@acme.com', contactPhone: '555-0100', billingAddress: '1 Main St\nSpringfield' })));
await deny('contact phone over 40 characters is refused', () => setDoc(doc(owner, 'orgs/bad10'), goodOrg({ contactPhone: '5'.repeat(41) })));
await deny('billing address over 500 characters is refused', () => setDoc(doc(owner, 'orgs/bad11'), goodOrg({ billingAddress: 'x'.repeat(501) })));
await deny('contact name that is not text is refused', () => setDoc(doc(owner, 'orgs/bad12'), goodOrg({ contactName: 42 })));
await deny('company created in someone else\'s name is refused', () => setDoc(doc(owner, 'orgs/bad7'), goodOrg({ createdBy: 'someone' })));
await deny('a stranger cannot create a company', () => setDoc(doc(stranger, 'orgs/bad8'), goodOrg({ createdBy: 'stranger' })));
await deny('a company admin cannot create a company', () => setDoc(doc(adminA, 'orgs/bad9'), goodOrg({ createdBy: 'adminA' })));
await allow('owner edits a company', () => updateDoc(doc(owner, 'orgs/orgEdit'), { name: 'Edited Co', notes: 'vip', updatedAt: serverTimestamp() }));
await deny('owner cannot change who created a company', () => updateDoc(doc(owner, 'orgs/orgEdit'), { createdBy: 'x', updatedAt: serverTimestamp() }));
await deny('nobody can delete a company, not even the owner', () => deleteDoc(doc(owner, 'orgs/orgEdit')));
await allow('owner reads any company', () => getDoc(doc(owner, 'orgs/orgB')));
await allow('owner lists companies', () => getDocs(collection(owner, 'orgs')));
await allow('company admin reads their own company', () => getDoc(doc(adminA, 'orgs/orgA')));
await deny('company admin cannot read another company', () => getDoc(doc(adminA, 'orgs/orgB')));
await deny('company admin cannot list all companies', () => getDocs(collection(adminA, 'orgs')));
await deny('plain member cannot read the company record', () => getDoc(doc(memberA, 'orgs/orgA')));
await deny('a removed admin cannot read the company', () => getDoc(doc(exAdminA, 'orgs/orgA')));
await deny('a stranger cannot read a company', () => getDoc(doc(stranger, 'orgs/orgA')));
await allow('company admin changes ONLY the focus areas', () => updateDoc(doc(adminA, 'orgs/orgA'), { focusAreas: ['aiOrg', 'discovery'], updatedAt: serverTimestamp() }));
await deny('company admin cannot rename the company', () => updateDoc(doc(adminA, 'orgs/orgA'), { name: 'Hacked', updatedAt: serverTimestamp() }));
await deny('company admin cannot change the seat count', () => updateDoc(doc(adminA, 'orgs/orgA'), { seatLimit: 999, updatedAt: serverTimestamp() }));
await deny('company admin cannot change the contact or billing details', () => updateDoc(doc(adminA, 'orgs/orgA'), { billingAddress: 'Elsewhere', updatedAt: serverTimestamp() }));
await deny('company admin cannot archive the company', () => updateDoc(doc(adminA, 'orgs/orgA'), { status: 'archived', updatedAt: serverTimestamp() }));
await deny('company admin cannot change another company\'s focus areas', () => updateDoc(doc(adminA, 'orgs/orgB'), { focusAreas: ['aiOrg'], updatedAt: serverTimestamp() }));
await deny('plain member cannot change focus areas', () => updateDoc(doc(memberA, 'orgs/orgA'), { focusAreas: ['aiOrg'], updatedAt: serverTimestamp() }));
await deny('a removed admin cannot change focus areas', () => updateDoc(doc(exAdminA, 'orgs/orgA'), { focusAreas: ['aiOrg'], updatedAt: serverTimestamp() }));

/* ============================================================== invites */
console.log('\n--- invites: creating ---');
await allow('owner creates an invite', () => setDoc(doc(owner, 'invites/n1'), goodInvite('owner1')));
await allow('owner creates an admin invite', () => setDoc(doc(owner, 'invites/n2'), goodInvite('owner1', { role: 'admin' })));
await allow('company admin invites to their own company', () => setDoc(doc(adminA, 'invites/n3'), goodInvite('adminA')));
await deny('company admin cannot invite to another company', () => setDoc(doc(adminA, 'invites/n4'), goodInvite('adminA', { orgId: 'orgB', orgName: 'Beta' })));
await deny('invite showing the wrong company name is refused', () => setDoc(doc(adminA, 'invites/n5'), goodInvite('adminA', { orgName: 'Totally Real Bank' })));
await allow('invite carrying a name and phone number', () => setDoc(doc(owner, 'invites/n18'), goodInvite('owner1', { name: 'Sam Admin', phone: '555-0101' })));
await deny('invite with a phone number over 40 characters is refused', () => setDoc(doc(owner, 'invites/n19'), goodInvite('owner1', { phone: '5'.repeat(41) })));
await deny('invite with a name over 100 characters is refused', () => setDoc(doc(owner, 'invites/n20'), goodInvite('owner1', { name: 'n'.repeat(101) })));
await deny('invite with an unknown role is refused', () => setDoc(doc(owner, 'invites/n6'), goodInvite('owner1', { role: 'owner' })));
await deny('invite expiring more than 120 days out is refused', () => setDoc(doc(owner, 'invites/n7'), goodInvite('owner1', { expiresAt: inDays(200) })));
await deny('invite already expired is refused', () => setDoc(doc(owner, 'invites/n8'), goodInvite('owner1', { expiresAt: inDays(-2) })));
await deny('invite created as already "used" is refused', () => setDoc(doc(owner, 'invites/n9'), goodInvite('owner1', { status: 'used' })));
await deny('invite with a pre-filled usedBy is refused', () => setDoc(doc(owner, 'invites/n10'), goodInvite('owner1', { usedBy: 'x' })));
await deny('invite created in someone else\'s name is refused', () => setDoc(doc(owner, 'invites/n11'), goodInvite('someone')));
await deny('invite with an extra field is refused', () => setDoc(doc(owner, 'invites/n12'), goodInvite('owner1', { admin: true })));
await deny('invite to an archived company is refused', () => setDoc(doc(owner, 'invites/n13'), goodInvite('owner1', { orgId: 'orgOld', orgName: 'Old Co' })));
await deny('plain member cannot create invites', () => setDoc(doc(memberA, 'invites/n14'), goodInvite('memberA')));
await deny('stranger cannot create invites', () => setDoc(doc(stranger, 'invites/n15'), goodInvite('stranger')));
await deny('a removed admin cannot create invites', () => setDoc(doc(exAdminA, 'invites/n16'), goodInvite('exAdminA')));
await deny('signed-out visitor cannot create invites', () => setDoc(doc(anon, 'invites/n17'), goodInvite('x')));

console.log('\n--- invites: reading and listing ---');
await allow('anyone signed in who knows a link can read that invite', () => getDoc(doc(stranger, 'invites/tokOpen')));
await deny('signed-out visitor cannot read an invite', () => getDoc(doc(anon, 'invites/tokOpen')));
await allow('owner lists a company\'s invites', () => getDocs(query(collection(owner, 'invites'), where('orgId', '==', 'orgA'))));
await allow('company admin lists their company\'s invites', () => getDocs(query(collection(adminA, 'invites'), where('orgId', '==', 'orgA'))));
await deny('company admin cannot list another company\'s invites', () => getDocs(query(collection(adminA, 'invites'), where('orgId', '==', 'orgB'))));
await deny('company admin cannot list ALL invites', () => getDocs(collection(adminA, 'invites')));
await deny('stranger cannot list invites', () => getDocs(query(collection(stranger, 'invites'), where('orgId', '==', 'orgA'))));
await deny('plain member cannot list invites', () => getDocs(query(collection(memberA, 'invites'), where('orgId', '==', 'orgA'))));

console.log('\n--- invites: revoking and deleting ---');
await allow('owner revokes an open invite', () => updateDoc(doc(owner, 'invites/tokRevokeMe'), { status: 'revoked' }));
await allow('company admin revokes their company\'s invite', () => updateDoc(doc(adminA, 'invites/tokRevokeMe2'), { status: 'revoked' }));
await deny('company admin cannot revoke another company\'s invite', () => updateDoc(doc(adminA, 'invites/tokB'), { status: 'revoked' }));
await deny('revoking cannot also change the role', () => updateDoc(doc(owner, 'invites/tokOpen'), { status: 'revoked', role: 'admin' }));
await deny('a used invite cannot be revoked', () => updateDoc(doc(owner, 'invites/tokUsed'), { status: 'revoked' }));
await deny('a revoked invite cannot be re-opened', () => updateDoc(doc(owner, 'invites/tokRevoked'), { status: 'open' }));
await deny('stranger cannot revoke an invite', () => updateDoc(doc(stranger, 'invites/tokOpen'), { status: 'revoked' }));
await deny('plain member cannot revoke an invite', () => updateDoc(doc(memberA, 'invites/tokOpen'), { status: 'revoked' }));
await deny('nobody can delete an invite', () => deleteDoc(doc(owner, 'invites/tokOpen')));
await deny('someone cannot mark an invite used without joining', () =>
  updateDoc(doc(stranger, 'invites/tokOpen4'), { status: 'used', usedBy: 'stranger', usedAt: serverTimestamp() }));

/* ========================================================== memberships */
console.log('\n--- memberships: reading ---');
await allow('person reads their own membership', () => getDoc(doc(memberA, 'memberships/memberA')));
await allow('person with no membership reads their own (finds nothing)', () => getDoc(doc(stranger, 'memberships/stranger')));
await deny('person cannot read another person\'s membership', () => getDoc(doc(memberA, 'memberships/adminA')));
await allow('company admin reads a member of their company', () => getDoc(doc(adminA, 'memberships/memberA')));
await allow('company admin reads a former member of their company', () => getDoc(doc(adminA, 'memberships/removedR')));
await deny('company admin cannot read another company\'s member', () => getDoc(doc(adminA, 'memberships/adminB')));
await allow('owner reads any membership', () => getDoc(doc(owner, 'memberships/adminB')));
await allow('owner lists a company\'s memberships', () => getDocs(query(collection(owner, 'memberships'), where('orgId', '==', 'orgA'))));
await allow('company admin lists their company\'s memberships', () => getDocs(query(collection(adminA, 'memberships'), where('orgId', '==', 'orgA'))));
await deny('company admin cannot list another company\'s memberships', () => getDocs(query(collection(adminA, 'memberships'), where('orgId', '==', 'orgB'))));
await deny('company admin cannot list ALL memberships', () => getDocs(collection(adminA, 'memberships')));
await deny('plain member cannot list memberships', () => getDocs(query(collection(memberA, 'memberships'), where('orgId', '==', 'orgA'))));
await deny('a removed admin cannot read members', () => getDoc(doc(exAdminA, 'memberships/memberA')));

console.log('\n--- shared record: who can write it ---');
const goodShare = (email, over = {}) => Object.assign({
  identity: { name: 'Member Name', email },
  assessment: { tier: 'Lots of Experience', overallPct: 72, categoryPct: { discovery: 80 }, answers: [{ n: 1, question: 'q', answer: 'a', points: 2 }] },
  courses: { 'discovery-novice': { completed: [1, 2], lastLesson: 2, updatedAt: '2026-10-01T12:00:00.000Z' } },
  lastActiveAt: '2026-10-01T12:00:00.000Z',
  updatedAt: serverTimestamp()
}, over);
await allow('an active member writes their own shared record for their company',
  () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com')));
await allow('a record with no assessment yet is fine',
  () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { assessment: null, courses: {}, lastActiveAt: null })));
await allow('an active company ADMIN also writes their own shared record (admins are members too)',
  () => setDoc(doc(adminA, 'orgs/orgA/members/adminA'), goodShare('admin@a.com')));
await deny('a member cannot write someone else\'s shared record', () => setDoc(doc(memberA, 'orgs/orgA/members/adminA'), goodShare('member@a.com')));
await deny('a member cannot write into a company they do not belong to', () => setDoc(doc(memberA, 'orgs/orgB/members/memberA'), goodShare('member@a.com')));
await deny('a REMOVED member can no longer update their shared record (it stays frozen)',
  () => setDoc(doc(asUser('removedR', 'r@a.com'), 'orgs/orgA/members/removedR'), goodShare('r@a.com')));
await deny('someone who never joined cannot write one', () => setDoc(doc(stranger, 'orgs/orgA/members/stranger'), goodShare('stranger@x.com')));
await deny('a removed admin cannot write one', () => setDoc(doc(exAdminA, 'orgs/orgA/members/exAdminA'), goodShare('ex@a.com')));
await deny('a company admin cannot write a member\'s record', () => setDoc(doc(adminA, 'orgs/orgA/members/memberA'), goodShare('member@a.com')));
await deny('the platform owner cannot write a member\'s record', () => setDoc(doc(owner, 'orgs/orgA/members/memberA'), goodShare('member@a.com')));
await deny('the identity must be the signed-in account\'s own email', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('someone.else@a.com')));
await deny('private reflections cannot be added to the shared record', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { reflections: { c: 'private' } })));
await deny('a profile or phone number cannot be added', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { profile: { phone: '555' } })));
await deny('a phone number cannot ride along inside the identity', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { identity: { name: 'N', email: 'member@a.com', phone: '555' } })));
await deny('courses must be a map', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { courses: ['x'] })));
await deny('last-active must be text or empty', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { lastActiveAt: 12345 })));
await deny('the update time must be the server\'s', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { updatedAt: inDays(-30) })));
await deny('the identity cannot be left out of a normal update', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), (() => { const g = goodShare('member@a.com'); delete g.identity; return g; })()));
await deny('a name over 100 characters is refused', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { identity: { name: 'n'.repeat(101), email: 'member@a.com' } })));
await deny('nobody can delete a shared record, even the member', () => deleteDoc(doc(memberA, 'orgs/orgA/members/memberA')));
await deny('nobody can delete a shared record, even the owner', () => deleteDoc(doc(owner, 'orgs/orgA/members/memberA')));
await deny('signed-out visitor cannot write one', () => setDoc(doc(anon, 'orgs/orgA/members/memberA'), goodShare('member@a.com')));

console.log('\n--- shared record: who can read it ---');
await allow('a company admin reads a member\'s shared record', () => getDoc(doc(adminA, 'orgs/orgA/members/memberA')));
await allow('a company admin reads a FORMER member\'s record (the company keeps it)', () => getDoc(doc(adminA, 'orgs/orgA/members/removedR')));
await allow('a company admin lists all of their company\'s shared records', () => getDocs(collection(adminA, 'orgs/orgA/members')));
await deny('a company admin cannot read another company\'s shared records', () => getDoc(doc(adminA, 'orgs/orgB/members/adminB')));
await deny('a company admin cannot list another company\'s shared records', () => getDocs(collection(adminA, 'orgs/orgB/members')));
await deny('another company\'s admin cannot read this company\'s records', () => getDoc(doc(adminB, 'orgs/orgA/members/memberA')));
await allow('the platform owner reads shared records', () => getDoc(doc(owner, 'orgs/orgA/members/memberA')));
await allow('the platform owner lists a company\'s shared records', () => getDocs(collection(owner, 'orgs/orgA/members')));
await allow('a member can read their OWN shared record (to see what their company sees)', () => getDoc(doc(memberA, 'orgs/orgA/members/memberA')));
await deny('a member cannot read a colleague\'s record', () => getDoc(doc(memberA, 'orgs/orgA/members/removedR')));
await deny('a member cannot list the company\'s records', () => getDocs(collection(memberA, 'orgs/orgA/members')));
await deny('a removed admin cannot read records', () => getDoc(doc(exAdminA, 'orgs/orgA/members/memberA')));
await deny('a stranger cannot read records', () => getDoc(doc(stranger, 'orgs/orgA/members/memberA')));
await deny('a signed-out visitor cannot read records', () => getDoc(doc(anon, 'orgs/orgA/members/memberA')));

console.log('\n--- shared record: removing a name after account deletion ---');
const scrub = asUser('scrubMe', 'scrub@a.com');
await deny('blanking the identity must not also change anything else',
  () => updateDoc(doc(scrub, 'orgs/orgA/members/scrubMe'), { identity: null, assessment: null, updatedAt: serverTimestamp() }));
await deny('blanking the identity needs a server update time',
  () => updateDoc(doc(scrub, 'orgs/orgA/members/scrubMe'), { identity: null, updatedAt: inDays(-3) }));
await deny('a member cannot blank someone else\'s identity',
  () => updateDoc(doc(memberA, 'orgs/orgA/members/scrubMe'), { identity: null, updatedAt: serverTimestamp() }));
await deny('a company admin cannot blank a member\'s identity',
  () => updateDoc(doc(adminA, 'orgs/orgA/members/scrubMe'), { identity: null, updatedAt: serverTimestamp() }));
await allow('a person blanks THEIR OWN name and email on the company\'s copy (account deletion)',
  () => updateDoc(doc(scrub, 'orgs/orgA/members/scrubMe'), { identity: null, updatedAt: serverTimestamp() }));
await allow('the company still reads the record, now without a name',
  async () => { const s = await getDoc(doc(adminA, 'orgs/orgA/members/scrubMe')); if (s.data().identity !== null || s.data().assessment.tier !== 'Moderate Experience') throw new Error('unexpected content'); });
const scrubRemoved = asUser('removedR', 'r@a.com');
await allow('a REMOVED member can still blank their name on the frozen copy when they delete their account',
  () => updateDoc(doc(scrubRemoved, 'orgs/orgA/members/removedR'), { identity: null, updatedAt: serverTimestamp() }));

console.log('\n--- membership: blanking identity on account deletion ---');
const scrub2 = asUser('scrubMe2', 'scrub2@a.com');
await allow('a person blanks the name, email and phone on their own membership',
  () => updateDoc(doc(scrub2, 'memberships/scrubMe2'), { email: '', displayName: '', phone: '' }));
await deny('blanking cannot also promote them to admin',
  () => updateDoc(doc(scrub, 'memberships/scrubMe'), { email: '', displayName: '', phone: '', role: 'admin' }));
await deny('blanking cannot also end or restart the membership',
  () => updateDoc(doc(scrub, 'memberships/scrubMe'), { email: '', displayName: '', phone: '', status: 'removed' }));
await deny('it cannot be used to put a different email in place',
  () => updateDoc(doc(scrub, 'memberships/scrubMe'), { email: 'new@evil.com', displayName: '', phone: '' }));
await deny('it cannot blank only the email and keep the name',
  () => updateDoc(doc(scrub, 'memberships/scrubMe'), { email: '', displayName: 'Still Here' }));
await deny('another person cannot blank someone else\'s membership',
  () => updateDoc(doc(memberA, 'memberships/scrubMe'), { email: '', displayName: '', phone: '' }));
await deny('a company admin cannot blank a member\'s identity on the membership',
  () => updateDoc(doc(adminA, 'memberships/scrubMe'), { email: '', displayName: '', phone: '' }));

console.log('\n--- memberships: joining with an invite ---');
await allow('person joins as a member with a valid invite',
  () => join(asUser('p1', 'new@a.com'), 'p1', 'new@a.com', 'tokOpen'));
await allow('person joins as an admin with an admin invite',
  () => join(asUser('p2', 'boss@a.com'), 'p2', 'boss@a.com', 'tokAdmin', { role: 'admin' }));
await allow('joining copies the phone number the invite carried',
  () => join(asUser('p21', 'sam@a.com'), 'p21', 'sam@a.com', 'tokPhone', { role: 'admin', phone: '555-0101' }));
await deny('cannot join with a different phone number than the invite carried',
  () => join(asUser('p22', 'sam2@a.com'), 'p22', 'sam2@a.com', 'tokOpen3', { phone: '999' }));
await deny('cannot drop the phone number the invite carried',
  () => join(asUser('p23', 'sam3@a.com'), 'p23', 'sam3@a.com', 'tokPhone2'));
await deny('the same invite cannot be used twice',
  () => join(asUser('p3', 'again@a.com'), 'p3', 'again@a.com', 'tokOpen'));
await deny('expired invite cannot be used',
  () => join(asUser('p4', 'a@a.com'), 'p4', 'a@a.com', 'tokExpired'));
await deny('already-used invite cannot be used',
  () => join(asUser('p5', 'a@a.com'), 'p5', 'a@a.com', 'tokUsed'));
await deny('revoked invite cannot be used',
  () => join(asUser('p6', 'a@a.com'), 'p6', 'a@a.com', 'tokRevoked'));
await deny('invite to an archived company cannot be used',
  () => join(asUser('p7', 'a@a.com'), 'p7', 'a@a.com', 'tokOld', { orgId: 'orgOld', orgName: 'Old Co' }));
await deny('cannot join as an admin with a member invite',
  () => join(asUser('p8', 'a@a.com'), 'p8', 'a@a.com', 'tokOpen2', { role: 'admin' }));
await deny('cannot join a different company than the invite names',
  () => join(asUser('p9', 'a@a.com'), 'p9', 'a@a.com', 'tokOpen2', { orgId: 'orgB', orgName: 'Beta' }));
await deny('cannot change the company name shown on the membership',
  () => join(asUser('p10', 'a@a.com'), 'p10', 'a@a.com', 'tokOpen2', { orgName: 'Fake Bank' }));
await deny('cannot join with a different person\'s email',
  () => join(asUser('p11', 'real@a.com'), 'p11', 'someone.else@a.com', 'tokOpen2'));
await deny('cannot back-date the join time',
  () => join(asUser('p12', 'a@a.com'), 'p12', 'a@a.com', 'tokOpen2', { joinedAt: inDays(-30) }));
await deny('cannot add extra fields to a membership',
  () => join(asUser('p13', 'a@a.com'), 'p13', 'a@a.com', 'tokOpen2', { superuser: true }));
await deny('cannot join as already "removed"',
  () => join(asUser('p14', 'a@a.com'), 'p14', 'a@a.com', 'tokOpen2', { status: 'removed' }));
await deny('cannot join with an end date already set',
  () => join(asUser('p15', 'a@a.com'), 'p15', 'a@a.com', 'tokOpen2', { endedAt: now() }));
await deny('cannot create a membership for someone else',
  () => join(asUser('p16', 'a@a.com'), 'victim', 'a@a.com', 'tokOpen2'));
await deny('cannot create a membership without using up an invite',
  () => setDoc(doc(asUser('p17', 'a@a.com'), 'memberships/p17'), {
    orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active', inviteToken: 'tokOpen2',
    joinedAt: serverTimestamp(), endedAt: null, email: 'a@a.com', displayName: 'X' }));
await deny('cannot use up an invite for a different person',
  () => join(asUser('p18', 'a@a.com'), 'p18', 'a@a.com', 'tokOpen2', {}, { usedBy: 'someone-else' }));
await deny('cannot join using a different invite than the one consumed',
  () => {
    const db = asUser('p19', 'a@a.com');
    const batch = writeBatch(db);
    batch.set(doc(db, 'memberships/p19'), {
      orgId: 'orgA', orgName: 'Acme', role: 'member', status: 'active', inviteToken: 'tokOpen2',
      joinedAt: serverTimestamp(), endedAt: null, email: 'a@a.com', displayName: 'X' });
    batch.update(doc(db, 'invites/tokOpen3'), { status: 'used', usedBy: 'p19', usedAt: serverTimestamp() });
    return batch.commit();
  });
await deny('signed-out visitor cannot join',
  () => join(anon, 'p20', 'a@a.com', 'tokOpen2'));

console.log('\n--- memberships: people already in a company ---');
await deny('an active member cannot join a second company',
  () => join(memberA, 'memberA', 'member@a.com', 'tokB', { orgId: 'orgB', orgName: 'Beta' }, {}, true));
await deny('an active member cannot promote themselves to admin',
  () => updateDoc(doc(memberA, 'memberships/memberA'), { role: 'admin' }));
await deny('an active member cannot rewrite their membership',
  () => setDoc(doc(memberA, 'memberships/memberA'), {
    orgId: 'orgB', orgName: 'Beta', role: 'admin', status: 'active', inviteToken: 'tokB',
    joinedAt: serverTimestamp(), endedAt: null, email: 'member@a.com', displayName: 'X' }));
await deny('an active member cannot leave on their own (admin controls membership)',
  () => updateDoc(doc(memberA, 'memberships/memberA'), { status: 'removed', endedAt: serverTimestamp() }));
await deny('a member cannot delete their membership',
  () => deleteDoc(doc(memberA, 'memberships/memberA')));
console.log('\n--- ending a membership (only the company or the owner can) ---');
const endIt = (db, uid, over = {}) => updateDoc(doc(db, 'memberships/' + uid), Object.assign({ status: 'removed', endedAt: serverTimestamp() }, over));
await allow('a company admin ends a member\'s membership', () => endIt(adminA, 'rm1'));
await allow('a company admin can end another admin\'s membership', () => endIt(adminA, 'rmAdmin'));
await allow('the platform owner can end a membership', () => endIt(owner, 'rm2'));
await deny('an admin cannot end their own membership', () => endIt(adminA, 'adminA'));
await deny('a member cannot end their own membership (only the company can)', () => endIt(memberA, 'memberA'));
await deny('a member cannot end a colleague\'s', () => endIt(memberA, 'rm3'));
await deny('an admin of another company cannot end it', () => endIt(adminB, 'rm3'));
await deny('an admin cannot end a membership in another company', () => endIt(adminA, 'rmOtherCo'));
await deny('a removed admin cannot end one', () => endIt(exAdminA, 'rm3'));
await deny('a stranger cannot end one', () => endIt(stranger, 'rm3'));
await deny('a signed-out visitor cannot end one', () => endIt(anon, 'rm3'));
await deny('an already-ended membership cannot be ended again', () => endIt(adminA, 'rm1'));
await deny('ending cannot also change the role', () => endIt(adminA, 'rm4', { role: 'admin' }));
await deny('ending cannot also change the email', () => endIt(adminA, 'rm4', { email: 'z@z.com' }));
await deny('ending cannot also change the company', () => endIt(adminA, 'rm4', { orgId: 'orgB', orgName: 'Beta' }));
await deny('the end date must be the server\'s time, not one the client picks', () => endIt(adminA, 'rm4', { endedAt: Timestamp.fromDate(new Date(2020, 1, 1)) }));
await deny('the new status must be exactly "removed"', () => endIt(adminA, 'rm4', { status: 'banned' }));
await deny('an ended membership cannot be switched back on by the company', () => updateDoc(doc(adminA, 'memberships/rm1'), { status: 'active', endedAt: null }));
await deny('an ended membership cannot be switched back on by the person', () => updateDoc(doc(asUser('rm1', 'rm1@a.com'), 'memberships/rm1'), { status: 'active', endedAt: null }));
await deny('a membership cannot be deleted, even by the company', () => deleteDoc(doc(adminA, 'memberships/rm5')));
await allow('a company admin still reads the person after they leave', () => getDoc(doc(adminA, 'memberships/rm1')));
await allow('the person still reads their own membership after leaving', () => getDoc(doc(asUser('rm1', 'rm1@a.com'), 'memberships/rm1')));
await deny('after leaving, the person can no longer add to the company\'s copy of their results', () => setDoc(doc(asUser('rm1', 'rm1@a.com'), 'orgs/orgA/members/rm1'), goodShare('rm1@a.com')));
await allow('but can still read that copy', () => getDoc(doc(asUser('rm1', 'rm1@a.com'), 'orgs/orgA/members/rm1')));
await allow('and can still blank their own name on it when they delete their account', () => updateDoc(doc(asUser('rm1', 'rm1@a.com'), 'orgs/orgA/members/rm1'), { identity: null, updatedAt: serverTimestamp() }));
await allow('and blank their name, email and phone on the membership', () => updateDoc(doc(asUser('rm1', 'rm1@a.com'), 'memberships/rm1'), { email: '', displayName: '', phone: '' }));
await deny('after leaving, they can no longer read the company\'s focus list', () => getDoc(doc(asUser('rm1', 'rm1@a.com'), 'orgFocus/orgA')));
await allow('after leaving, they still use their own progress as always', () => getDoc(doc(asUser('rm1', 'rm1@a.com'), 'progress/rm1')));
await allow('a removed member can join a NEW company with a new invite',
  () => join(asUser('removedR', 'r@a.com'), 'removedR', 'r@a.com', 'tokB', { orgId: 'orgB', orgName: 'Beta' }, {}, true));

console.log('\n--- company focus list (orgFocus) ---');
const saveFocus = (db, orgId, list, over = {}) => {
  const b = writeBatch(db);
  b.update(doc(db, 'orgs/' + orgId), { focusAreas: list, updatedAt: serverTimestamp() });
  b.set(doc(db, 'orgFocus/' + orgId), Object.assign({ focusAreas: list, updatedAt: serverTimestamp() }, over));
  return b.commit();
};
await allow('the owner saves a company\'s focus list together with the copy', () => saveFocus(owner, 'orgEdit', ['aiOrg', 'strategy']));
await allow('a company admin saves their own company\'s focus list together with the copy', () => saveFocus(adminA, 'orgA', ['stakeholder', 'discovery', 'aiOrg']));
await allow('an admin can reorder again (update of the copy)', () => saveFocus(adminA, 'orgA', ['discovery', 'stakeholder']));
await allow('an empty list is allowed (no priorities)', () => saveFocus(adminA, 'orgA', []));
await allow('and a full list', () => saveFocus(adminA, 'orgA', ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg']));
await deny('a copy that does not match the company\'s own list is refused', () => setDoc(doc(adminA, 'orgFocus/orgA'), { focusAreas: ['aiOrg'], updatedAt: serverTimestamp() }));
await deny('even the owner cannot write a mismatching copy', () => setDoc(doc(owner, 'orgFocus/orgEdit'), { focusAreas: ['discovery'], updatedAt: serverTimestamp() }));
await deny('an admin cannot save another company\'s focus list', () => saveFocus(adminA, 'orgB', ['aiOrg']));
await deny('an admin of another company cannot write this company\'s copy', () => saveFocus(adminB, 'orgA', ['aiOrg']));
await deny('a plain member cannot write the copy', () => setDoc(doc(memberA, 'orgFocus/orgA'), { focusAreas: [], updatedAt: serverTimestamp() }));
await deny('a removed admin cannot write the copy', () => setDoc(doc(exAdminA, 'orgFocus/orgA'), { focusAreas: [], updatedAt: serverTimestamp() }));
await deny('a stranger cannot write the copy', () => setDoc(doc(stranger, 'orgFocus/orgA'), { focusAreas: [], updatedAt: serverTimestamp() }));
await deny('duplicates are refused', () => saveFocus(adminA, 'orgA', ['aiOrg', 'aiOrg']));
await deny('unknown areas are refused', () => saveFocus(adminA, 'orgA', ['nope']));
await deny('extra fields on the copy are refused', () => saveFocus(adminA, 'orgA', ['aiOrg'], { notes: 'hi' }));
await deny('a client-chosen timestamp on the copy is refused', () => saveFocus(adminA, 'orgA', ['aiOrg'], { updatedAt: Timestamp.fromDate(new Date(2020, 1, 1)) }));
await deny('the copy cannot be deleted', () => deleteDoc(doc(adminA, 'orgFocus/orgA')));
await deny('not even by the owner', () => deleteDoc(doc(owner, 'orgFocus/orgA')));
await allow('an active member reads their company\'s focus list', () => getDoc(doc(memberA, 'orgFocus/orgA')));
await allow('a company admin reads it', () => getDoc(doc(adminA, 'orgFocus/orgA')));
await allow('the owner reads it', () => getDoc(doc(owner, 'orgFocus/orgA')));
await deny('a member of one company cannot read another\'s', () => getDoc(doc(memberA, 'orgFocus/orgB')));
await deny('an admin of another company cannot read it', () => getDoc(doc(adminB, 'orgFocus/orgA')));
await deny('a former member cannot read it', () => getDoc(doc(asUser('removedR', 'r@a.com'), 'orgFocus/orgA')));
await deny('a removed admin cannot read it', () => getDoc(doc(exAdminA, 'orgFocus/orgA')));
await deny('a stranger cannot read it', () => getDoc(doc(stranger, 'orgFocus/orgA')));

console.log('\n--- the skills shape on the shared record ---');
const goodShape = (over = {}) => Object.assign({ roleId: 'spm', levels: { 'd.framing': 2.5, 's.vision': 3 }, strength: { 'd.framing': 's', 's.vision': 't' }, at: '2026-11-27T10:00:00Z' }, over);
await allow('a member can share their skills shape with the record', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { shape: goodShape() })));
await allow('and leave it out (no role assigned)', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com')));
await deny('the shape cannot carry answers or anything else', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { shape: goodShape({ answers: [1] }) })));
await deny('more than 28 competency levels are refused', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { shape: goodShape({ levels: Object.fromEntries(Array.from({ length: 29 }, (_, i) => ['k' + i, 1])) }) })));
await deny('a role id must be a plain id', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { shape: goodShape({ roleId: 'Bad Role!' }) })));
await deny('the shape must be a map', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com', { shape: 'all of it' })));

console.log('\n--- assigned job roles (orgRoles) ---');
await allow('a company admin assigns a role to a member', () => setDoc(doc(adminA, 'orgRoles/orgA/people/memberA'), { roleId: 'spm', assignedAt: serverTimestamp(), assignedBy: 'adminA' }));
await allow('and changes it', () => setDoc(doc(adminA, 'orgRoles/orgA/people/memberA'), { roleId: 'gpm', assignedAt: serverTimestamp(), assignedBy: 'adminA' }));
await allow('a company\'s own role id is fine', () => setDoc(doc(adminA, 'orgRoles/orgA/people/memberA'), { roleId: 'acme-lead', assignedAt: serverTimestamp(), assignedBy: 'adminA' }));
await allow('the owner can assign too', () => setDoc(doc(owner, 'orgRoles/orgEdit/people/someone'), { roleId: 'pm', assignedAt: serverTimestamp(), assignedBy: 'owner1' }));
await deny('assignedBy must be the admin themselves', () => setDoc(doc(adminA, 'orgRoles/orgA/people/memberA'), { roleId: 'pm', assignedAt: serverTimestamp(), assignedBy: 'someoneElse' }));
await deny('a client-chosen time is refused', () => setDoc(doc(adminA, 'orgRoles/orgA/people/memberA'), { roleId: 'pm', assignedAt: Timestamp.fromDate(new Date(2020, 1, 1)), assignedBy: 'adminA' }));
await deny('extra fields are refused', () => setDoc(doc(adminA, 'orgRoles/orgA/people/memberA'), { roleId: 'pm', assignedAt: serverTimestamp(), assignedBy: 'adminA', note: 'x' }));
await deny('a role id must be a plain id', () => setDoc(doc(adminA, 'orgRoles/orgA/people/memberA'), { roleId: 'Head of Product', assignedAt: serverTimestamp(), assignedBy: 'adminA' }));
await deny('a member cannot assign their own role', () => setDoc(doc(memberA, 'orgRoles/orgA/people/memberA'), { roleId: 'head', assignedAt: serverTimestamp(), assignedBy: 'memberA' }));
await deny('an admin of another company cannot assign roles here', () => setDoc(doc(adminB, 'orgRoles/orgA/people/memberA'), { roleId: 'pm', assignedAt: serverTimestamp(), assignedBy: 'adminB' }));
await deny('a removed admin cannot assign roles', () => setDoc(doc(exAdminA, 'orgRoles/orgA/people/memberA'), { roleId: 'pm', assignedAt: serverTimestamp(), assignedBy: 'exAdminA' }));
await deny('an archived company gets no new role assignments', () => setDoc(doc(owner, 'orgRoles/orgOld/people/oldMember'), { roleId: 'pm', assignedAt: serverTimestamp(), assignedBy: 'owner1' }));
await allow('the member reads their own role', () => getDoc(doc(memberA, 'orgRoles/orgA/people/memberA')));
await deny('a member cannot read someone else\'s role', () => getDoc(doc(memberA, 'orgRoles/orgA/people/adminA')));
await deny('a member cannot list the team\'s roles', () => getDocs(collection(memberA, 'orgRoles/orgA/people')));
await allow('a company admin lists the team\'s roles', () => getDocs(collection(adminA, 'orgRoles/orgA/people')));
await deny('an admin of another company cannot list them', () => getDocs(collection(adminB, 'orgRoles/orgA/people')));
await deny('a former member cannot read their old role', () => getDoc(doc(asUser('removedR', 'r@a.com'), 'orgRoles/orgA/people/removedR')));
await deny('a member cannot un-assign their role', () => deleteDoc(doc(memberA, 'orgRoles/orgA/people/memberA')));
await allow('a company admin un-assigns it', () => deleteDoc(doc(adminA, 'orgRoles/orgA/people/memberA')));

console.log('\n--- Team Knowledge Workspace (workspaces) ---');
const wsItem = (by, over = {}) => Object.assign({ type: 'idea', title: 'Route planning', note: 'n', area: 'Scheduling', status: 'new', date: '', links: [], band: '', value: null, tier: 0, votes: 3,
  createdBy: by, createdAt: serverTimestamp(), updatedBy: by, updatedAt: serverTimestamp() }, over);
const WS = 'workspaces/orgA/items/';
await allow('a member adds an item', () => setDoc(doc(memberA, WS + 'itemMember1'), wsItem('memberA')));
await allow('an admin adds an account with an exact value and a band', () => setDoc(doc(adminA, WS + 'itemAdmin01'), wsItem('adminA', { type: 'account', title: 'Harbor', area: '', status: '', band: 'b4', value: 380000, tier: 3, votes: 0 })));
await allow('a release with a date', () => setDoc(doc(memberA, WS + 'itemRelease'), wsItem('memberA', { type: 'release', title: 'Spring', status: 'planned', date: '2027-03-15', links: ['itemAdmin01'] })));
await allow('another member (the admin) edits a member\'s item', () => setDoc(doc(adminA, WS + 'itemMember1'), wsItem('memberA', { title: 'Route planning v2', updatedBy: 'adminA' }), { mergeFields: ['title', 'updatedBy', 'updatedAt'] }));
await allow('members read the workspace', () => getDocs(collection(memberA, 'workspaces/orgA/items')));
await deny('another company cannot read it', () => getDocs(collection(adminB, 'workspaces/orgA/items')));
await deny('nor can the platform owner (it is the company\'s data)', () => getDocs(collection(owner, 'workspaces/orgA/items')));
await deny('nor a former member', () => getDoc(doc(asUser('removedR', 'r@a.com'), WS + 'itemMember1')));
await deny('a stranger cannot add an item', () => setDoc(doc(stranger, WS + 'itemStranger'), wsItem('stranger')));
await deny('another company\'s admin cannot add one', () => setDoc(doc(adminB, WS + 'itemOtherCo'), wsItem('adminB')));
await deny('createdBy must be the person adding it', () => setDoc(doc(memberA, WS + 'itemFake001'), wsItem('adminA', { updatedBy: 'memberA' })));
await deny('updatedBy must be the person saving', () => setDoc(doc(memberA, WS + 'itemFake002'), wsItem('memberA', { updatedBy: 'adminA' })));
await deny('a client-chosen time is refused', () => setDoc(doc(memberA, WS + 'itemFake003'), wsItem('memberA', { createdAt: Timestamp.fromDate(new Date(2020, 1, 1)) })));
await deny('extra fields are refused', () => setDoc(doc(memberA, WS + 'itemFake004'), wsItem('memberA', { secret: 1 })));
await deny('an unknown type is refused', () => setDoc(doc(memberA, WS + 'itemFake005'), wsItem('memberA', { type: 'epic' })));
await deny('an empty title is refused', () => setDoc(doc(memberA, WS + 'itemFake006'), wsItem('memberA', { title: '' })));
await deny('a long title is refused', () => setDoc(doc(memberA, WS + 'itemFake007'), wsItem('memberA', { title: 'x'.repeat(121) })));
await deny('a long note is refused', () => setDoc(doc(memberA, WS + 'itemFake008'), wsItem('memberA', { note: 'x'.repeat(2001) })));
await deny('more than 40 links are refused', () => setDoc(doc(memberA, WS + 'itemFake009'), wsItem('memberA', { links: Array.from({ length: 41 }, (_, i) => 'link' + i + 'xx') })));
await deny('a bad date is refused', () => setDoc(doc(memberA, WS + 'itemFake010'), wsItem('memberA', { date: 'next spring' })));
await deny('an unknown band is refused', () => setDoc(doc(memberA, WS + 'itemFake011'), wsItem('memberA', { band: 'b9' })));
await deny('a negative value is refused', () => setDoc(doc(memberA, WS + 'itemFake012'), wsItem('memberA', { value: -5 })));
await deny('a tier above 3 is refused', () => setDoc(doc(memberA, WS + 'itemFake013'), wsItem('memberA', { tier: 4 })));
await deny('an odd item id is refused', () => setDoc(doc(memberA, WS + 'bad id!'), wsItem('memberA')));
await deny('an item cannot change type', () => updateDoc(doc(memberA, WS + 'itemMember1'), { type: 'goal', updatedBy: 'memberA', updatedAt: serverTimestamp() }));
await deny('nor who added it', () => updateDoc(doc(adminA, WS + 'itemMember1'), { createdBy: 'adminA', updatedBy: 'adminA', updatedAt: serverTimestamp() }));
await allow('a member edits an item with updateDoc', () => updateDoc(doc(memberA, WS + 'itemAdmin01'), { note: 'Three regions', updatedBy: 'memberA', updatedAt: serverTimestamp() }));
await deny('a member cannot delete someone else\'s item', () => deleteDoc(doc(memberA, WS + 'itemAdmin01')));
await allow('a member deletes their own item', () => deleteDoc(doc(memberA, WS + 'itemRelease')));
await allow('an admin deletes anyone\'s item', () => deleteDoc(doc(adminA, WS + 'itemMember1')));
await deny('an archived company\'s workspace takes no new items', () => setDoc(doc(asUser('oldMember', 'old@x.com'), 'workspaces/orgOld/items/itemOldCo01'), wsItem('oldMember')));
const wsSettings = (by, over = {}) => Object.assign({ valueMode: 'either', areas: ['Scheduling', 'Mobile'], updatedBy: by, updatedAt: serverTimestamp() }, over);
await allow('an admin sets the workspace settings', () => setDoc(doc(adminA, 'workspaces/orgA'), wsSettings('adminA')));
await allow('members read them', () => getDoc(doc(memberA, 'workspaces/orgA')));
await deny('a member cannot change them', () => setDoc(doc(memberA, 'workspaces/orgA'), wsSettings('memberA', { valueMode: 'exact' })));
await deny('an unknown value mode is refused', () => setDoc(doc(adminA, 'workspaces/orgA'), wsSettings('adminA', { valueMode: 'secret' })));
await deny('more than 20 areas are refused', () => setDoc(doc(adminA, 'workspaces/orgA'), wsSettings('adminA', { areas: Array.from({ length: 21 }, (_, i) => 'A' + i) })));
await deny('another company cannot read the settings', () => getDoc(doc(adminB, 'workspaces/orgA')));
await deny('nobody deletes the settings', () => deleteDoc(doc(adminA, 'workspaces/orgA')));

console.log('\n--- workspace notes and updates ---');
const wsNote = (by, over = {}) => Object.assign({ kind: 'note', title: 'Sprint review', body: 'Route planning slips to autumn.', links: [], source: 'Review, 12 Mar', authorId: by, authorName: 'Pat',
  createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, over);
const WN = 'workspaces/orgA/notes/';
await allow('a member adds a note', () => setDoc(doc(memberA, WN + 'noteMember1'), wsNote('memberA')));
await allow('and posts a short update (no title needed)', () => setDoc(doc(memberA, WN + 'updMember01'), wsNote('memberA', { kind: 'update', title: '', body: 'Shipped guided setup.', source: '' })));
await allow('members read them', () => getDocs(collection(adminA, 'workspaces/orgA/notes')));
await deny('another company cannot', () => getDocs(collection(adminB, 'workspaces/orgA/notes')));
await deny('nor the platform owner', () => getDocs(collection(owner, 'workspaces/orgA/notes')));
await deny('a note needs a title', () => setDoc(doc(memberA, WN + 'noteFake01'), wsNote('memberA', { title: '' })));
await deny('an update is short', () => setDoc(doc(memberA, WN + 'noteFake02'), wsNote('memberA', { kind: 'update', title: '', body: 'x'.repeat(601) })));
await deny('a note is under 4,000 characters', () => setDoc(doc(memberA, WN + 'noteFake03'), wsNote('memberA', { body: 'x'.repeat(4001) })));
await deny('an empty body is refused', () => setDoc(doc(memberA, WN + 'noteFake04'), wsNote('memberA', { body: '' })));
await deny('the author must be the person writing', () => setDoc(doc(memberA, WN + 'noteFake05'), wsNote('adminA')));
await deny('an unknown kind is refused', () => setDoc(doc(memberA, WN + 'noteFake06'), wsNote('memberA', { kind: 'secret' })));
await deny('extra fields are refused', () => setDoc(doc(memberA, WN + 'noteFake07'), wsNote('memberA', { pinned: true })));
await deny('more than 20 links are refused', () => setDoc(doc(memberA, WN + 'noteFake08'), wsNote('memberA', { links: Array.from({ length: 21 }, (_, i) => 'lnk' + i + 'xxx') })));
await allow('the author edits their note', () => updateDoc(doc(memberA, WN + 'noteMember1'), { body: 'Slips to October.', updatedAt: serverTimestamp() }));
await deny('someone else (even an admin) cannot edit it', () => updateDoc(doc(adminA, WN + 'noteMember1'), { body: 'Changed', updatedAt: serverTimestamp() }));
await deny('a note cannot become an update', () => updateDoc(doc(memberA, WN + 'noteMember1'), { kind: 'update', updatedAt: serverTimestamp() }));
await deny('another member cannot delete it', () => deleteDoc(doc(asUser('rm1', 'rm1@a.com'), WN + 'noteMember1')));
await allow('an admin deletes it', () => deleteDoc(doc(adminA, WN + 'noteMember1')));
await allow('the author deletes their update', () => deleteDoc(doc(memberA, WN + 'updMember01')));
await deny('an archived company takes no new notes', () => setDoc(doc(asUser('oldMember', 'old@x.com'), 'workspaces/orgOld/notes/noteOldCo1'), wsNote('oldMember')));
await allow('an item may carry the editor\'s name, for the updates feed', () => setDoc(doc(memberA, WS + 'itemNamed01'), wsItem('memberA', { updatedByName: 'Pat Member' })));
await deny('a long name is refused', () => setDoc(doc(memberA, WS + 'itemNamed02'), wsItem('memberA', { updatedByName: 'x'.repeat(81) })));

console.log('\n--- paid features (orgFeatures) ---');
await allow('the owner switches Ask on for a company', () => setDoc(doc(owner, 'orgFeatures/orgA'), { wsAsk: true, updatedAt: serverTimestamp() }));
await allow('its members can see that it is on', () => getDoc(doc(memberA, 'orgFeatures/orgA')));
await deny('a company admin cannot switch it on themselves', () => setDoc(doc(adminA, 'orgFeatures/orgA'), { wsAsk: true, updatedAt: serverTimestamp() }));
await deny('another company cannot read it', () => getDoc(doc(adminB, 'orgFeatures/orgA')));
await deny('a stranger cannot read it', () => getDoc(doc(stranger, 'orgFeatures/orgA')));
await deny('only known switches', () => setDoc(doc(owner, 'orgFeatures/orgA'), { wsAsk: true, unlimited: true, updatedAt: serverTimestamp() }));
await deny('a switch is true or false', () => setDoc(doc(owner, 'orgFeatures/orgA'), { wsAsk: 'yes', updatedAt: serverTimestamp() }));
await allow('the owner switches it off', () => setDoc(doc(owner, 'orgFeatures/orgA'), { wsAsk: false, updatedAt: serverTimestamp() }));
await deny('nobody deletes it', () => deleteDoc(doc(owner, 'orgFeatures/orgA')));

console.log('\n--- DISC Work Styles, shared (orgStyleSettings, orgStyles, orgStyleViews) ---');
const stRec = (name, over = {}) => Object.assign({ name, scores: { d: 75, i: 75, s: 50, c: 0 }, primary: 'd', secondary: 'i', at: serverTimestamp() }, over);
const stSet = (mode, by = 'adminA') => ({ mode, teams: { tprod: { name: 'Product', members: ['memberA', 'stA'], sees: [] } }, updatedBy: by, updatedAt: serverTimestamp() });
const SP = 'orgStyles/orgA/people/';
await deny('no settings yet ("not shared"): a member cannot share', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A')));
await deny('a member cannot set the sharing mode', () => setDoc(doc(memberA, 'orgStyleSettings/orgA'), stSet('all', 'memberA')));
await deny('another company\'s admin cannot either', () => setDoc(doc(adminB, 'orgStyleSettings/orgA'), stSet('all', 'adminB')));
await deny('an unknown mode is refused', () => setDoc(doc(adminA, 'orgStyleSettings/orgA'), stSet('everyone')));
await allow('an admin sets "shared by choice"', () => setDoc(doc(adminA, 'orgStyleSettings/orgA'), stSet('optional')));
await allow('members read the setting', () => getDoc(doc(memberA, 'orgStyleSettings/orgA')));
await deny('another company cannot', () => getDoc(doc(adminB, 'orgStyleSettings/orgA')));
await allow('a member shares their own style', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A')));
await deny('not someone else\'s', () => setDoc(doc(memberA, SP + 'stA'), stRec('Someone')));
await deny('answers are never on the copy', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A', { answers: { ws1: 'd' } })));
await deny('scores stay 0 to 100', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A', { scores: { d: 101, i: 0, s: 0, c: 0 } })));
await deny('all four scores are needed', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A', { scores: { d: 50, i: 50, s: 50 } })));
await deny('a client-chosen time is refused', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A', { at: Timestamp.fromDate(new Date(2020, 1, 1)) })));
await allow('"by choice": another member reads what was shared', () => getDoc(doc(asUser('stA', 'stA@a.com'), SP + 'memberA')));
await allow('and lists it', () => getDocs(collection(asUser('stA', 'stA@a.com'), 'orgStyles/orgA/people')));
await allow('the admin reads it', () => getDoc(doc(adminA, SP + 'memberA')));
await deny('another company cannot', () => getDoc(doc(adminB, SP + 'memberA')));
await deny('nor a former member', () => getDoc(doc(asUser('removedR', 'r@a.com'), SP + 'memberA')));
await allow('"by choice": they can stop sharing', () => deleteDoc(doc(memberA, SP + 'memberA')));
await allow('the admin sets "within teams", with who may see whom', () => setDoc(doc(adminA, 'orgStyleSettings/orgA'), stSet('team')));
await allow('the admin writes a person\'s view list', () => setDoc(doc(adminA, 'orgStyleViews/orgA/viewers/stA'), { uids: ['memberA'], updatedAt: serverTimestamp() }));
await deny('a member cannot write their own view list', () => setDoc(doc(memberA, 'orgStyleViews/orgA/viewers/memberA'), { uids: ['adminA', 'stB'], updatedAt: serverTimestamp() }));
await allow('a member reads their own view list', () => getDoc(doc(asUser('stA', 'stA@a.com'), 'orgStyleViews/orgA/viewers/stA')));
await deny('but not someone else\'s', () => getDoc(doc(memberA, 'orgStyleViews/orgA/viewers/stA')));
await allow('"within teams": the member shares (the company decided)', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A')));
await deny('"within teams": they cannot remove it themselves', () => deleteDoc(doc(memberA, SP + 'memberA')));
await allow('a teammate on their view list reads it', () => getDoc(doc(asUser('stA', 'stA@a.com'), SP + 'memberA')));
await deny('someone not on a view list cannot', () => getDoc(doc(asUser('stB', 'stB@a.com'), SP + 'memberA')));
await deny('"within teams": members cannot list everyone', () => getDocs(collection(asUser('stA', 'stA@a.com'), 'orgStyles/orgA/people')));
await allow('the admin still sees everyone', () => getDocs(collection(adminA, 'orgStyles/orgA/people')));
await allow('the person sees their own', () => getDoc(doc(memberA, SP + 'memberA')));
await allow('the admin sets "everyone"', () => setDoc(doc(adminA, 'orgStyleSettings/orgA'), stSet('all')));
await allow('"everyone": any member reads it', () => getDoc(doc(asUser('stB', 'stB@a.com'), SP + 'memberA')));
await allow('the admin sets "not shared"', () => setDoc(doc(adminA, 'orgStyleSettings/orgA'), stSet('none')));
await deny('"not shared": other members can no longer read it', () => getDoc(doc(asUser('stA', 'stA@a.com'), SP + 'memberA')));
await deny('nor the admin', () => getDoc(doc(adminA, SP + 'memberA')));
await allow('the person still sees their own', () => getDoc(doc(memberA, SP + 'memberA')));
await deny('"not shared": no new shares', () => setDoc(doc(memberA, SP + 'memberA'), stRec('Member A again')));
await allow('"not shared": they can remove the old copy', () => deleteDoc(doc(memberA, SP + 'memberA')));
await deny('nobody deletes the settings', () => deleteDoc(doc(adminA, 'orgStyleSettings/orgA')));
await allow('the owner switches on the paid team views', () => setDoc(doc(owner, 'orgFeatures/orgA'), { wsAsk: false, styles: true, updatedAt: serverTimestamp() }));
await deny('a company admin cannot', () => setDoc(doc(adminA, 'orgFeatures/orgA'), { styles: true, updatedAt: serverTimestamp() }));

console.log('\n--- DISC Work Styles access requests and grants (W3) ---');
const stReq = (by, over = {}) => Object.assign({ requester: by, requesterName: 'Asker', kind: 'team', targetId: 'tprod', targetName: 'Product', reason: 'We start a joint project next week', status: 'pending', createdAt: serverTimestamp() }, over);
const RQ = 'orgStyleRequests/orgA/items/';
await allow('settings may carry team member names', () => setDoc(doc(adminA, 'orgStyleSettings/orgA'), Object.assign(stSet('team'), { names: { memberA: 'Member A', stA: 'St A' } })));
await allow('a member asks to see a team, with a reason', () => setDoc(doc(asUser('stB', 'stB@a.com'), RQ + 'reqStB0001'), stReq('stB')));
await deny('a request needs a real reason', () => setDoc(doc(asUser('stB', 'stB@a.com'), RQ + 'reqStB0002'), stReq('stB', { reason: 'pls' })));
await deny('it must be their own', () => setDoc(doc(asUser('stB', 'stB@a.com'), RQ + 'reqStB0003'), stReq('stA')));
await deny('it starts pending', () => setDoc(doc(asUser('stB', 'stB@a.com'), RQ + 'reqStB0004'), stReq('stB', { status: 'approved' })));
await deny('another company cannot ask here', () => setDoc(doc(adminB, RQ + 'reqAdmB001'), stReq('adminB')));
await allow('the asker reads their request', () => getDoc(doc(asUser('stB', 'stB@a.com'), RQ + 'reqStB0001')));
await deny('another member cannot', () => getDoc(doc(asUser('stA', 'stA@a.com'), RQ + 'reqStB0001')));
await allow('admins list requests', () => getDocs(collection(adminA, 'orgStyleRequests/orgA/items')));
await deny('the asker cannot approve it', () => updateDoc(doc(asUser('stB', 'stB@a.com'), RQ + 'reqStB0001'), { status: 'approved', decidedBy: 'stB', decidedAt: serverTimestamp() }));
await deny('an admin cannot change the reason', () => updateDoc(doc(adminA, RQ + 'reqStB0001'), { reason: 'Something else entirely', status: 'approved', decidedBy: 'adminA', decidedAt: serverTimestamp() }));
await allow('an admin approves it', () => updateDoc(doc(adminA, RQ + 'reqStB0001'), { status: 'approved', decidedBy: 'adminA', decidedAt: serverTimestamp() }));
const stGrant = { viewer: 'stB', viewerName: 'St B', subjects: ['memberA', 'stA'], targetName: 'Product', reason: 'We start a joint project next week', approvedBy: 'adminA', at: serverTimestamp() };
await allow('the admin records the grant', () => setDoc(doc(adminA, 'orgStyleGrants/orgA/items/reqStB0001'), stGrant));
await deny('a member cannot grant themselves access', () => setDoc(doc(asUser('stB', 'stB@a.com'), 'orgStyleGrants/orgA/items/selfGrant01'), Object.assign({}, stGrant, { approvedBy: 'stB' })));
await allow('the person whose style was shared is told (reads the grant)', () => getDoc(doc(asUser('stA', 'stA@a.com'), 'orgStyleGrants/orgA/items/reqStB0001')));
await allow('the viewer reads it', () => getDoc(doc(asUser('stB', 'stB@a.com'), 'orgStyleGrants/orgA/items/reqStB0001')));
await deny('someone else cannot', () => getDoc(doc(asUser('rm7', 'rm7@a.com'), 'orgStyleGrants/orgA/items/reqStB0001')));
await deny('a grant cannot be edited, only removed', () => updateDoc(doc(adminA, 'orgStyleGrants/orgA/items/reqStB0001'), { subjects: ['adminA'] }));
await allow('the admin removes it', () => deleteDoc(doc(adminA, 'orgStyleGrants/orgA/items/reqStB0001')));
await allow('the asker withdraws a request', () => deleteDoc(doc(asUser('stB', 'stB@a.com'), RQ + 'reqStB0001')));

console.log('\n--- team assignments (orgAssignments) ---');
const assignItem = { id: 'abc1234567', course: 'discovery-novice', due: '2026-12-15', note: 'Before planning', assignedAt: '2026-11-16' };
const saveAssign = (db, orgId, items, over = {}) => setDoc(doc(db, 'orgAssignments/' + orgId), Object.assign({ items: items, updatedAt: serverTimestamp() }, over));
await allow('a company admin sets their team\'s assignments', () => saveAssign(adminA, 'orgA', [assignItem]));
await allow('and changes them (update)', () => saveAssign(adminA, 'orgA', [assignItem, Object.assign({}, assignItem, { id: 'def1234567', course: 'strategy-novice', due: '' })]));
await allow('an empty list is allowed (nothing assigned)', () => saveAssign(adminA, 'orgA', []));
await allow('the owner can set them too', () => saveAssign(owner, 'orgEdit', [assignItem]));
await deny('more than 20 items are refused', () => saveAssign(adminA, 'orgA', Array.from({ length: 21 }, (_, i) => Object.assign({}, assignItem, { id: 'id' + i + 'xxxxxx' }))));
await deny('extra fields are refused', () => saveAssign(adminA, 'orgA', [], { notes: 'hi' }));
await deny('items must be a list', () => saveAssign(adminA, 'orgA', { a: 1 }));
await deny('a client-chosen timestamp is refused', () => saveAssign(adminA, 'orgA', [], { updatedAt: Timestamp.fromDate(new Date(2020, 1, 1)) }));
await deny('an admin cannot set another company\'s assignments', () => saveAssign(adminA, 'orgB', [assignItem]));
await deny('an admin of another company cannot set this company\'s', () => saveAssign(adminB, 'orgA', [assignItem]));
await deny('a plain member cannot set them', () => saveAssign(memberA, 'orgA', [assignItem]));
await deny('a removed admin cannot set them', () => saveAssign(exAdminA, 'orgA', [assignItem]));
await deny('a stranger cannot set them', () => saveAssign(stranger, 'orgA', [assignItem]));
await deny('an archived company receives no new assignments', () => saveAssign(owner, 'orgOld', [assignItem]));
await deny('assignments cannot be deleted', () => deleteDoc(doc(adminA, 'orgAssignments/orgA')));
await allow('an active member reads their team\'s assignments', () => getDoc(doc(memberA, 'orgAssignments/orgA')));
await allow('a company admin reads them', () => getDoc(doc(adminA, 'orgAssignments/orgA')));
await allow('the owner reads them', () => getDoc(doc(owner, 'orgAssignments/orgA')));
await deny('a member of one company cannot read another\'s', () => getDoc(doc(memberA, 'orgAssignments/orgB')));
await deny('an admin of another company cannot read them', () => getDoc(doc(adminB, 'orgAssignments/orgA')));
await deny('a former member cannot read them', () => getDoc(doc(asUser('removedR', 'r@a.com'), 'orgAssignments/orgA')));
await deny('a stranger cannot read them', () => getDoc(doc(stranger, 'orgAssignments/orgA')));
await deny('nobody can list every company\'s assignments', () => getDocs(collection(memberA, 'orgAssignments')));
await deny('a signed-out visitor cannot read it', () => getDoc(doc(anon, 'orgFocus/orgA')));
await deny('nobody can list the copies', () => getDocs(collection(memberA, 'orgFocus')));
await deny('a plain member still cannot read the company record itself (contacts, billing, notes stay private)', () => getDoc(doc(memberA, 'orgs/orgA')));

console.log('\n--- activity log (orgs/{id}/audit) ---');
const entry = (uid, email, over = {}) => Object.assign({
  action: 'member.removed', actorUid: uid, actorEmail: email, targetEmail: 'x@x.com', detail: 'test', at: serverTimestamp()
}, over);
await allow('a company admin writes an entry about their own action', () => setDoc(doc(adminA, 'orgs/orgA/audit/e1'), entry('adminA', 'admin@a.com')));
await allow('the owner writes an entry too', () => setDoc(doc(owner, 'orgs/orgA/audit/e2'), entry('owner1', 'owner@x.com', { action: 'company.edited' })));
await allow('an entry may leave out the target and detail', () => setDoc(doc(adminA, 'orgs/orgA/audit/e3'), { action: 'focus.changed', actorUid: 'adminA', actorEmail: 'admin@a.com', at: serverTimestamp() }));
await deny('an admin cannot sign an entry as somebody else', () => setDoc(doc(adminA, 'orgs/orgA/audit/e4'), entry('owner1', 'admin@a.com')));
await deny('nor use somebody else\'s email', () => setDoc(doc(adminA, 'orgs/orgA/audit/e5'), entry('adminA', 'someone@else.com')));
await deny('an entry must carry the server\'s time', () => setDoc(doc(adminA, 'orgs/orgA/audit/e6'), entry('adminA', 'admin@a.com', { at: Timestamp.fromDate(new Date(2020, 1, 1)) })));
await deny('an unknown kind of action is refused', () => setDoc(doc(adminA, 'orgs/orgA/audit/e7'), entry('adminA', 'admin@a.com', { action: 'something.else' })));
await deny('extra fields are refused', () => setDoc(doc(adminA, 'orgs/orgA/audit/e8'), entry('adminA', 'admin@a.com', { secret: 'x' })));
await deny('an over-long detail is refused', () => setDoc(doc(adminA, 'orgs/orgA/audit/e9'), entry('adminA', 'admin@a.com', { detail: 'x'.repeat(301) })));
await deny('an admin cannot write to another company\'s log', () => setDoc(doc(adminA, 'orgs/orgB/audit/e10'), entry('adminA', 'admin@a.com')));
await deny('a plain member cannot write to the log', () => setDoc(doc(memberA, 'orgs/orgA/audit/e11'), entry('memberA', 'member@a.com')));
await deny('a removed admin cannot write to the log', () => setDoc(doc(exAdminA, 'orgs/orgA/audit/e12'), entry('exAdminA', 'ex@a.com')));
await deny('a stranger cannot write to the log', () => setDoc(doc(stranger, 'orgs/orgA/audit/e13'), entry('stranger', 'stranger@x.com')));
await deny('an entry can never be changed', () => updateDoc(doc(adminA, 'orgs/orgA/audit/e1'), { detail: 'edited' }));
await deny('an entry can never be deleted', () => deleteDoc(doc(adminA, 'orgs/orgA/audit/e1')));
await deny('not even by the owner', () => deleteDoc(doc(owner, 'orgs/orgA/audit/e1')));
await allow('a company admin reads their log', () => getDocs(collection(adminA, 'orgs/orgA/audit')));
await allow('the owner reads any log', () => getDocs(collection(owner, 'orgs/orgA/audit')));
await deny('an admin of another company cannot read it', () => getDocs(collection(adminB, 'orgs/orgA/audit')));
await deny('a plain member cannot read it', () => getDocs(collection(memberA, 'orgs/orgA/audit')));
await deny('a stranger cannot read it', () => getDocs(collection(stranger, 'orgs/orgA/audit')));
await deny('a signed-out visitor cannot read it', () => getDocs(collection(anon, 'orgs/orgA/audit')));

console.log('\n--- weekly snapshots (orgs/{id}/snapshots) ---');
const snapshot = (day, over = {}) => Object.assign({
  day: day, at: serverTimestamp(), people: 6, assessed: 5, learning: 2, finished: 1, inactive: 1,
  avgOverall: 42, avgPlan: 12, lessons: 30, areas: { discovery: 50, aiOrg: 20 }
}, over);
await allow('a company admin saves a snapshot', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-13'), snapshot('2026-10-13')));
await allow('the owner saves one too', () => setDoc(doc(owner, 'orgs/orgA/snapshots/2026-10-06'), snapshot('2026-10-06')));
await allow('an empty company can have a snapshot with no scores', () => setDoc(doc(owner, 'orgs/orgB/snapshots/2026-10-13'), snapshot('2026-10-13', { people: 0, assessed: 0, learning: 0, finished: 0, inactive: 0, avgOverall: null, avgPlan: null, lessons: 0, areas: {} })));
await deny('the id must be the day it records', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-14'), snapshot('2026-10-13')));
await deny('the id must look like a day', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/today'), snapshot('today')));
await deny('a snapshot must carry the server\'s time', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-15'), snapshot('2026-10-15', { at: Timestamp.fromDate(new Date(2020, 1, 1)) })));
await deny('extra fields (such as a name) are refused', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-16'), snapshot('2026-10-16', { names: 'Ann' })));
await deny('more people assessed than there are people is refused', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-17'), snapshot('2026-10-17', { assessed: 7 })));
await deny('a score above 100 is refused', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-18'), snapshot('2026-10-18', { avgPlan: 120 })));
await deny('a skill score above 100 is refused', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-19'), snapshot('2026-10-19', { areas: { discovery: 150 } })));
await deny('an unknown skill area is refused', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-20'), snapshot('2026-10-20', { areas: { secret: 5 } })));
await deny('text where a number belongs is refused', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-21'), snapshot('2026-10-21', { people: 'six' })));
await deny('an admin cannot save one for another company', () => setDoc(doc(adminA, 'orgs/orgB/snapshots/2026-10-22'), snapshot('2026-10-22')));
await deny('a plain member cannot save one', () => setDoc(doc(memberA, 'orgs/orgA/snapshots/2026-10-23'), snapshot('2026-10-23')));
await deny('a removed admin cannot save one', () => setDoc(doc(exAdminA, 'orgs/orgA/snapshots/2026-10-24'), snapshot('2026-10-24')));
await deny('a stranger cannot save one', () => setDoc(doc(stranger, 'orgs/orgA/snapshots/2026-10-25'), snapshot('2026-10-25')));
await deny('a signed-out visitor cannot save one', () => setDoc(doc(anon, 'orgs/orgA/snapshots/2026-10-26'), snapshot('2026-10-26')));
await deny('a day can only be written once (no overwrite)', () => setDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-13'), snapshot('2026-10-13', { people: 7 })));
await deny('a snapshot can never be changed', () => updateDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-13'), { people: 9 }));
await deny('a snapshot can never be deleted', () => deleteDoc(doc(adminA, 'orgs/orgA/snapshots/2026-10-13')));
await deny('not even by the owner', () => deleteDoc(doc(owner, 'orgs/orgA/snapshots/2026-10-13')));
await allow('a company admin reads their snapshots', () => getDocs(collection(adminA, 'orgs/orgA/snapshots')));
await allow('the owner reads any company\'s snapshots', () => getDocs(collection(owner, 'orgs/orgA/snapshots')));
await deny('an admin of another company cannot read them', () => getDocs(collection(adminB, 'orgs/orgA/snapshots')));
await deny('a plain member cannot read them', () => getDocs(collection(memberA, 'orgs/orgA/snapshots')));
await deny('a stranger cannot read them', () => getDocs(collection(stranger, 'orgs/orgA/snapshots')));
await deny('a signed-out visitor cannot read them', () => getDocs(collection(anon, 'orgs/orgA/snapshots')));

console.log('\n--- owner-only pilot tracker (orgPilot) ---');
const pilot = (over = {}) => Object.assign({
  stage: 'pilot_running', pilotStart: '2026-10-01', pilotEnd: '2026-11-12', nextCheckin: '2026-10-20', renewalDate: '', baselineDay: '2026-10-06',
  sponsor: 'Pat Sponsor', pilotSize: 25, goals: [{ metric: 'assessed_pct', target: 90 }, { metric: 'plan_pct', target: 25 }], done: ['goals', 'dates'],
  summaryNote: 'Going well', updatedAt: serverTimestamp()
}, over);
await allow('the owner creates a pilot record', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot()));
await allow('and changes it', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ stage: 'pilot_review', done: ['goals', 'dates', 'summary'] })));
await allow('a record with no goals and no dates is fine', () => setDoc(doc(owner, 'orgPilot/orgB'), pilot({ stage: 'prospect', pilotStart: '', pilotEnd: '', nextCheckin: '', baselineDay: '', goals: [], done: [], summaryNote: '', sponsor: '', pilotSize: 0 })));
await deny('an unknown stage is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ stage: 'won' })));
await deny('a date that is not a date is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ pilotStart: 'next week' })));
await deny('a goal measuring something unknown is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ goals: [{ metric: 'revenue', target: 10 }] })));
await deny('a goal target above 100 is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ goals: [{ metric: 'assessed_pct', target: 150 }] })));
await deny('a goal with a name in it is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ goals: [{ metric: 'assessed_pct', target: 50, owner: 'Ann' }] })));
await deny('the eighth goal is checked too', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ goals: [1, 2, 3, 4, 5, 6, 7].map(() => ({ metric: 'assessed_pct', target: 1 })).concat([{ metric: 'bogus', target: 1 }]) })));
await deny('more than eight goals is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ goals: Array(9).fill({ metric: 'assessed_pct', target: 1 }) })));
await deny('an over-long summary note is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ summaryNote: 'x'.repeat(1001) })));
await deny('extra fields are refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ price: 5 })));
await deny('a pilot size that is not a whole number is refused', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ pilotSize: 2.5 })));
await deny('it must carry the server\'s time', () => setDoc(doc(owner, 'orgPilot/orgA'), pilot({ updatedAt: Timestamp.fromDate(new Date(2020, 1, 1)) })));
await deny('nobody can delete one, not even the owner', () => deleteDoc(doc(owner, 'orgPilot/orgA')));
await deny('a company admin cannot read their own company\'s pilot record', () => getDoc(doc(adminA, 'orgPilot/orgA')));
await deny('a company admin cannot write one', () => setDoc(doc(adminA, 'orgPilot/orgA'), pilot()));
await deny('a plain member cannot read one', () => getDoc(doc(memberA, 'orgPilot/orgA')));
await deny('a stranger cannot read one', () => getDoc(doc(stranger, 'orgPilot/orgA')));
await deny('a signed-out visitor cannot read one', () => getDoc(doc(anon, 'orgPilot/orgA')));
await allow('the owner reads one', () => getDoc(doc(owner, 'orgPilot/orgA')));
await allow('and lists them all', () => getDocs(collection(owner, 'orgPilot')));
await deny('an admin cannot list them', () => getDocs(collection(adminA, 'orgPilot')));
const logEntry = (over = {}) => Object.assign({ at: serverTimestamp(), kind: 'note', text: 'Kickoff call went well. Sponsor wants a mid-point update.' }, over);
await allow('the owner adds a timeline entry', () => setDoc(doc(owner, 'orgPilot/orgA/log/n1'), logEntry()));
await allow('of any of the six kinds', () => setDoc(doc(owner, 'orgPilot/orgA/log/n2'), logEntry({ kind: 'decision' })));
await deny('an unknown kind is refused', () => setDoc(doc(owner, 'orgPilot/orgA/log/n3'), logEntry({ kind: 'gossip' })));
await deny('an empty entry is refused', () => setDoc(doc(owner, 'orgPilot/orgA/log/n4'), logEntry({ text: '' })));
await deny('an over-long entry is refused', () => setDoc(doc(owner, 'orgPilot/orgA/log/n5'), logEntry({ text: 'x'.repeat(1001) })));
await deny('an entry must carry the server\'s time', () => setDoc(doc(owner, 'orgPilot/orgA/log/n6'), logEntry({ at: Timestamp.fromDate(new Date(2020, 1, 1)) })));
await deny('extra fields are refused', () => setDoc(doc(owner, 'orgPilot/orgA/log/n7'), logEntry({ by: 'rob' })));
await deny('an entry can never be edited', () => updateDoc(doc(owner, 'orgPilot/orgA/log/n1'), { text: 'changed' }));
await allow('but the owner can delete one added by mistake', () => deleteDoc(doc(owner, 'orgPilot/orgA/log/n2')));
await deny('a company admin cannot add an entry', () => setDoc(doc(adminA, 'orgPilot/orgA/log/n8'), logEntry()));
await deny('a company admin cannot read the timeline', () => getDocs(collection(adminA, 'orgPilot/orgA/log')));
await deny('a stranger cannot read the timeline', () => getDocs(collection(stranger, 'orgPilot/orgA/log')));
await allow('the owner reads the timeline', () => getDocs(collection(owner, 'orgPilot/orgA/log')));

console.log('\n--- private owner notes (orgPrivate) ---');
await allow('the owner writes private notes', () => setDoc(doc(owner, 'orgPrivate/orgA'), { notes: 'Pilot customer, pays on net 30', updatedAt: serverTimestamp() }));
await allow('the owner reads them', () => getDoc(doc(owner, 'orgPrivate/orgA')));
await allow('and lists them', () => getDocs(collection(owner, 'orgPrivate')));
await deny('a company admin cannot read their own company\'s private notes', () => getDoc(doc(adminA, 'orgPrivate/orgA')));
await deny('a company admin cannot write them', () => setDoc(doc(adminA, 'orgPrivate/orgA'), { notes: 'x', updatedAt: serverTimestamp() }));
await deny('a plain member cannot read them', () => getDoc(doc(memberA, 'orgPrivate/orgA')));
await deny('a stranger cannot read them', () => getDoc(doc(stranger, 'orgPrivate/orgA')));
await deny('nobody can list them but the owner', () => getDocs(collection(adminA, 'orgPrivate')));
await deny('notes over 2,000 characters are refused', () => setDoc(doc(owner, 'orgPrivate/orgB'), { notes: 'x'.repeat(2001), updatedAt: serverTimestamp() }));
await deny('extra fields are refused', () => setDoc(doc(owner, 'orgPrivate/orgB'), { notes: 'x', extra: 1, updatedAt: serverTimestamp() }));
await deny('the notes cannot be deleted', () => deleteDoc(doc(owner, 'orgPrivate/orgA')));

console.log('\n--- an archived company receives nothing new ---');
await deny('a member of an archived company cannot add to its copy of their results', () => setDoc(doc(asUser('oldMember', 'old@x.com'), 'orgs/orgOld/members/oldMember'), goodShare('old@x.com')));
await allow('but they can still blank their own name on it (account deletion)', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'orgs/orgOld/members/oldMember'), { identity: { name: 'Old', email: 'old@x.com' }, assessment: null, courses: {}, lastActiveAt: null, updatedAt: now() }); });
  return updateDoc(doc(asUser('oldMember', 'old@x.com'), 'orgs/orgOld/members/oldMember'), { identity: null, updatedAt: serverTimestamp() });
});
await allow('while an active company still receives updates as before', () => setDoc(doc(memberA, 'orgs/orgA/members/memberA'), goodShare('member@a.com')));

console.log('\n--- tool roadmap: reading the list ---');
const verified = (uid) => env.authenticatedContext(uid, { email: uid + '@x.com', email_verified: true }).firestore();
const unverified = (uid) => env.authenticatedContext(uid, { email: uid + '@x.com', email_verified: false }).firestore();
await allow('anyone, even signed out, can read a tool', () => getDoc(doc(anon, 'tools/tA')));
await allow('and list the tools with their vote counts', () => getDocs(collection(anon, 'tools')));

console.log('\n--- tool roadmap: voting ---');
const castVote = (db, uid, toolId, over = {}, opts = {}) => {
  const b = writeBatch(db);
  b.set(doc(db, 'toolVotes/' + (opts.id || uid + '_' + toolId)), Object.assign({ uid: uid, toolId: toolId, email: uid + '@x.com', notify: false, createdAt: serverTimestamp() }, over));
  if (!opts.noCount) b.update(doc(db, 'tools/' + toolId), { voteCount: increment(opts.delta === undefined ? 1 : opts.delta) });
  return b.commit();
};
const withdraw = (db, uid, toolId, opts = {}) => {
  const b = writeBatch(db);
  b.delete(doc(db, 'toolVotes/' + uid + '_' + toolId));
  if (!opts.noCount) b.update(doc(db, 'tools/' + toolId), { voteCount: increment(-1) });
  return b.commit();
};
await allow('a verified person votes: their vote and +1 on the tool, together', () => castVote(verified('v1'), 'v1', 'tA'));
await allow('they can back a second tool', () => castVote(verified('v1'), 'v1', 'tB'));
await allow('and a third', () => castVote(verified('v1'), 'v1', 'tC'));
await allow('the vote can ask to be emailed at launch', () => castVote(verified('v2'), 'v2', 'tA', { notify: true }));
await deny('the same person cannot vote for the same tool twice', () => castVote(verified('v1'), 'v1', 'tA'));
await deny('nor by replacing their vote document (to count again)', () => castVote(verified('v1'), 'v1', 'tA', { notify: true }));
await deny('a vote document with no +1 on the tool is refused', () => castVote(verified('v3'), 'v3', 'tA', {}, { noCount: true }));
await deny('a +1 on the tool with no vote document is refused', () => updateDoc(doc(verified('v3'), 'tools/tA'), { voteCount: increment(1) }));
await deny('a +2 is refused', () => castVote(verified('v3'), 'v3', 'tA', {}, { delta: 2 }));
await deny('a -1 together with a new vote is refused', () => castVote(verified('v3'), 'v3', 'tA', {}, { delta: -1 }));
await deny('voting on a released tool is refused', () => castVote(verified('v3'), 'v3', 'tR'));
await deny('a person whose email is not verified cannot vote', () => castVote(unverified('u1'), 'u1', 'tA'));
await deny('a signed-out visitor cannot vote', () => castVote(anon, 'anon', 'tA'));
await deny('nobody can vote as somebody else (wrong uid inside)', () => castVote(verified('v3'), 'v3', 'tA', { uid: 'v4' }));
await deny('nor under somebody else\'s document id', () => castVote(verified('v3'), 'v3', 'tA', {}, { id: 'v4_tA' }));
await deny('nor with somebody else\'s email', () => castVote(verified('v3'), 'v3', 'tA', { email: 'other@x.com' }));
await deny('extra fields on a vote are refused', () => castVote(verified('v3'), 'v3', 'tA', { bonus: 1 }));
await deny('notify must be true or false', () => castVote(verified('v3'), 'v3', 'tA', { notify: 'yes' }));
await deny('the vote time must be the server\'s', () => castVote(verified('v3'), 'v3', 'tA', { createdAt: Timestamp.fromDate(new Date(2020, 1, 1)) }));
await deny('a vote for a tool that does not exist is refused', () => castVote(verified('v3'), 'v3', 'nope'));
const v3 = verified('v3');
await deny('a voter cannot also change a tool\'s title in the same update', () => {
  const bb = writeBatch(v3);
  bb.set(doc(v3, 'toolVotes/v3_tB'), { uid: 'v3', toolId: 'tB', email: 'v3@x.com', notify: false, createdAt: serverTimestamp() });
  bb.update(doc(v3, 'tools/tB'), { voteCount: increment(1), title: 'Hacked' });
  return bb.commit();
});
await deny('a -1 with no vote document to delete is refused', () => updateDoc(doc(verified('v3'), 'tools/tA'), { voteCount: increment(-1) }));

console.log('\n--- tool roadmap: withdrawing a vote ---');
await allow('a person withdraws their vote: vote deleted and -1 together', () => withdraw(verified('v9'), 'v9', 'tW'));
await deny('withdrawing the same vote again is refused', () => withdraw(verified('v9'), 'v9', 'tW'));
await deny('deleting a vote without the -1 is refused (the count would drift)', () => withdraw(verified('v8'), 'v8', 'tW', { noCount: true }));
await deny('a -1 without deleting the vote is refused', () => updateDoc(doc(verified('v8'), 'tools/tW'), { voteCount: increment(-1) }));
await deny('nobody can delete somebody else\'s vote', () => withdraw(verified('v3'), 'v8', 'tW'));
await allow('they can vote for that tool again afterwards', () => castVote(verified('v9'), 'v9', 'tW'));
await allow('someone can withdraw even if their email is no longer verified', () => withdraw(unverified('v7'), 'v7', 'tW'));
await allow('a vote for a tool the owner has since deleted can still be removed (no count to change)', () => deleteDoc(doc(verified('vOrph'), 'toolVotes/vOrph_tGone')));
await allow('a vote can be removed when the tool\'s count has drifted to zero', () => withdraw(verified('vZero'), 'vZero', 'tZ', { noCount: true }));
await deny('but not by pushing the count below zero', () => updateDoc(doc(verified('v8'), 'tools/tZ'), { voteCount: increment(-1) }));

console.log('\n--- tool roadmap: the launch-email choice ---');
await allow('a voter changes their launch-email choice', () => updateDoc(doc(verified('v2'), 'toolVotes/v2_tA'), { notify: false }));
await deny('they cannot change anything else on the vote (the tool)', () => updateDoc(doc(verified('v2'), 'toolVotes/v2_tA'), { toolId: 'tB' }));
await deny('or the email', () => updateDoc(doc(verified('v2'), 'toolVotes/v2_tA'), { email: 'new@x.com' }));
await deny('somebody else cannot change it', () => updateDoc(doc(verified('v3'), 'toolVotes/v2_tA'), { notify: true }));

console.log('\n--- tool roadmap: who can read the votes ---');
await allow('a voter reads their own votes', () => getDocs(query(collection(verified('v1'), 'toolVotes'), where('uid', '==', 'v1'))));
await allow('and a single one', () => getDoc(doc(verified('v1'), 'toolVotes/v1_tA')));
await deny('a voter cannot read somebody else\'s vote', () => getDoc(doc(verified('v3'), 'toolVotes/v1_tA')));
await deny('nor list everybody\'s', () => getDocs(collection(verified('v3'), 'toolVotes')));
await deny('a company admin has no special access to votes', () => getDocs(collection(adminA, 'toolVotes')));
await deny('a signed-out visitor cannot read votes', () => getDocs(collection(anon, 'toolVotes')));
await allow('the owner reads every vote (to email the people who asked)', () => getDocs(collection(owner, 'toolVotes')));
await allow('and can filter to one tool\'s launch-email list', () => getDocs(query(collection(owner, 'toolVotes'), where('toolId', '==', 'tA'), where('notify', '==', true))));

console.log('\n--- tool roadmap: managing the tools ---');
const goodTool = (over = {}) => Object.assign({ title: 'New tool', description: 'What it does', category: 'Strategy', status: 'considering', order: 3, voteCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, over);
await allow('the owner adds a tool', () => setDoc(doc(owner, 'tools/new1'), goodTool()));
await deny('a new tool cannot start with votes', () => setDoc(doc(owner, 'tools/new2'), goodTool({ voteCount: 5 })));
await deny('a plain voter cannot add a tool', () => setDoc(doc(verified('v1'), 'tools/new3'), goodTool()));
await deny('a company admin cannot add a tool', () => setDoc(doc(adminA, 'tools/new4'), goodTool()));
await deny('a tool needs a title', () => setDoc(doc(owner, 'tools/new5'), goodTool({ title: '' })));
await deny('an unknown status is refused', () => setDoc(doc(owner, 'tools/new6'), goodTool({ status: 'soonish' })));
await deny('extra fields are refused', () => setDoc(doc(owner, 'tools/new7'), goodTool({ secret: 1 })));
await deny('a launch link must be https', () => setDoc(doc(owner, 'tools/new8'), goodTool({ status: 'released', launchUrl: 'http://example.com' })));
await allow('an https launch link is fine', () => setDoc(doc(owner, 'tools/new9'), goodTool({ status: 'released', launchUrl: 'https://example.com/tool' })));
await allow('the owner edits a tool', () => updateDoc(doc(owner, 'tools/tA'), { title: 'Renamed', updatedAt: serverTimestamp() }));
await allow('the owner can mark a tool in progress', () => updateDoc(doc(owner, 'tools/tB'), { status: 'in_progress', updatedAt: serverTimestamp() }));
await allow('the owner can repair a vote count (recount)', () => updateDoc(doc(owner, 'tools/tA'), { voteCount: 2, updatedAt: serverTimestamp() }));
await deny('a voter cannot edit a tool', () => updateDoc(doc(verified('v1'), 'tools/tA'), { title: 'Hacked' }));
await deny('a voter cannot set a vote count directly', () => updateDoc(doc(verified('v1'), 'tools/tA'), { voteCount: 99 }));
await deny('a voter cannot change a tool\'s status', () => updateDoc(doc(verified('v1'), 'tools/tA'), { status: 'released' }));
await allow('the owner can delete a tool', () => deleteDoc(doc(owner, 'tools/new1')));
await deny('a voter cannot delete a tool', () => deleteDoc(doc(verified('v1'), 'tools/tA')));

console.log('\n--- tool roadmap: suggestions ---');
const goodSuggestion = (uid, over = {}) => Object.assign({ uid: uid, email: uid + '@x.com', text: 'A pricing and packaging worksheet', status: 'pending', createdAt: serverTimestamp() }, over);
await allow('a verified person suggests a tool', () => setDoc(doc(verified('s1'), 'toolSuggestions/s1'), goodSuggestion('s1')));
await allow('and can reword it while it is pending', () => setDoc(doc(verified('s1'), 'toolSuggestions/s1'), goodSuggestion('s1', { text: 'A pricing worksheet for B2B products' })));
await deny('not under somebody else\'s id', () => setDoc(doc(verified('s2'), 'toolSuggestions/s3'), goodSuggestion('s2')));
await deny('an unverified person cannot suggest', () => setDoc(doc(unverified('s4'), 'toolSuggestions/s4'), goodSuggestion('s4')));
await deny('a signed-out visitor cannot suggest', () => setDoc(doc(anon, 'toolSuggestions/s5'), goodSuggestion('s5')));
await deny('a suggestion cannot arrive already approved', () => setDoc(doc(verified('s6'), 'toolSuggestions/s6'), goodSuggestion('s6', { status: 'approved' })));
await deny('too short is refused', () => setDoc(doc(verified('s7'), 'toolSuggestions/s7'), goodSuggestion('s7', { text: 'hi' })));
await deny('too long is refused', () => setDoc(doc(verified('s8'), 'toolSuggestions/s8'), goodSuggestion('s8', { text: 'x'.repeat(301) })));
await deny('extra fields are refused', () => setDoc(doc(verified('s9'), 'toolSuggestions/s9'), goodSuggestion('s9', { admin: true })));
await deny('somebody else\'s email is refused', () => setDoc(doc(verified('s10'), 'toolSuggestions/s10'), goodSuggestion('s10', { email: 'other@x.com' })));
await deny('a person cannot approve their own suggestion', () => updateDoc(doc(verified('s1'), 'toolSuggestions/s1'), { status: 'approved', reviewedAt: serverTimestamp() }));
await allow('the person can read their own suggestion', () => getDoc(doc(verified('s1'), 'toolSuggestions/s1')));
await deny('and not anyone else\'s', () => getDoc(doc(verified('s2'), 'toolSuggestions/s1')));
await deny('nobody but the owner can list suggestions', () => getDocs(collection(verified('s1'), 'toolSuggestions')));
await allow('the owner lists all suggestions', () => getDocs(collection(owner, 'toolSuggestions')));
await allow('the owner approves one', () => updateDoc(doc(owner, 'toolSuggestions/s1'), { status: 'approved', reviewedAt: serverTimestamp() }));
await deny('the owner cannot edit the text while reviewing', () => updateDoc(doc(owner, 'toolSuggestions/s1'), { status: 'rejected', reviewedAt: serverTimestamp(), text: 'changed' }));
await deny('the review must be approved or rejected', () => updateDoc(doc(owner, 'toolSuggestions/s1'), { status: 'maybe', reviewedAt: serverTimestamp() }));
await allow('after a review the person can suggest something new', () => setDoc(doc(verified('s1'), 'toolSuggestions/s1'), goodSuggestion('s1', { text: 'A vendor evaluation scorecard' })));
await deny('nobody can delete somebody else\'s suggestion', () => deleteDoc(doc(verified('s2'), 'toolSuggestions/s1')));
await allow('a person can delete their own suggestion (for example when they delete their account)', () => deleteDoc(doc(verified('s1'), 'toolSuggestions/s1')));
await allow('deleting when there is none is harmless', () => deleteDoc(doc(verified('s11'), 'toolSuggestions/s11')));
await allow('the owner can delete one', async () => { await setDoc(doc(verified('s12'), 'toolSuggestions/s12'), goodSuggestion('s12')); return deleteDoc(doc(owner, 'toolSuggestions/s12')); });


/* ------------------------------------------------------------ the coach (coach.html) */
console.log('\n--- the coach: access and requests ---');
const grant = (over = {}) => Object.assign({ plan: 'pro', email: 'c1@x.com', grantedAt: serverTimestamp() }, over);
await allow('the owner gives someone the coach', () => setDoc(doc(owner, 'coachAccess/c1'), grant()));
await allow('the person reads their own access', () => getDoc(doc(verified('c1'), 'coachAccess/c1')));
await deny('and not anyone else\'s', () => getDoc(doc(verified('c2'), 'coachAccess/c1')));
await deny('nobody can give themselves the coach', () => setDoc(doc(verified('c2'), 'coachAccess/c2'), grant({ email: 'c2@x.com' })));
await deny('nor change their access', () => updateDoc(doc(verified('c1'), 'coachAccess/c1'), { plan: 'pro', email: 'c1@x.com', grantedAt: serverTimestamp() }));
await deny('a plan other than pro or none is refused', () => setDoc(doc(owner, 'coachAccess/c3'), grant({ plan: 'gold' })));
await deny('extra fields are refused', () => setDoc(doc(owner, 'coachAccess/c3'), grant({ unlimited: true })));
await deny('only the owner lists who has access', () => getDocs(collection(verified('c1'), 'coachAccess')));
await allow('the owner lists it', () => getDocs(collection(owner, 'coachAccess')));
await allow('the owner can take it away', () => deleteDoc(doc(owner, 'coachAccess/c1')));
const coachReq = (uid, over = {}) => Object.assign({ uid, email: uid + '@x.com', name: 'Cee', note: '', createdAt: serverTimestamp() }, over);
await allow('a verified person asks for access', () => setDoc(doc(verified('c4'), 'coachRequests/c4'), coachReq('c4')));
await deny('not for somebody else', () => setDoc(doc(verified('c5'), 'coachRequests/c6'), coachReq('c5')));
await deny('not with somebody else\'s email', () => setDoc(doc(verified('c5'), 'coachRequests/c5'), coachReq('c5', { email: 'boss@x.com' })));
await deny('an unverified person cannot ask', () => setDoc(doc(unverified('c7'), 'coachRequests/c7'), coachReq('c7')));
await deny('extra fields are refused', () => setDoc(doc(verified('c8'), 'coachRequests/c8'), coachReq('c8', { plan: 'pro' })));
await deny('only the owner lists requests', () => getDocs(collection(verified('c4'), 'coachRequests')));
await allow('the owner lists them, and clears one', async () => { await getDocs(collection(owner, 'coachRequests')); return deleteDoc(doc(owner, 'coachRequests/c4')); });


/* ------------------------------------------------------------ saved tools (my-tools.html) */
console.log('\n--- saved tools ---');
const goodSaved = (uid, over = {}) => Object.assign({
  uid, tool: 'bbp', title: 'Analytics dashboard', summary: 'Leading: Partner', data: 'eyJ0IjoiQSJ9',
  createdAt: serverTimestamp(), updatedAt: serverTimestamp()
}, over);
const ann = asUser('ann', 'ann@x.com'), bob = asUser('bob', 'bob@x.com');
await allow('a signed-in person saves a tool to their account', () => setDoc(doc(ann, 'savedTools/t1'), goodSaved('ann')));
await deny('not under somebody else\'s name', () => setDoc(doc(ann, 'savedTools/t2'), goodSaved('bob')));
await deny('a signed-out visitor cannot save', () => setDoc(doc(anon, 'savedTools/t3'), goodSaved('ann')));
await allow('the AI Readiness Checklist can be saved too', () => setDoc(doc(ann, 'savedTools/t5'), goodSaved('ann', { tool: 'ready' })));
await deny('only the five tools', () => setDoc(doc(ann, 'savedTools/t4'), goodSaved('ann', { tool: 'other' })));
await deny('the data must be a share-link encoding', () => setDoc(doc(ann, 'savedTools/t5'), goodSaved('ann', { data: '<script>' })));
await deny('and not too large', () => setDoc(doc(ann, 'savedTools/t6'), goodSaved('ann', { data: 'a'.repeat(20001) })));
await deny('a title over 100 characters is refused', () => setDoc(doc(ann, 'savedTools/t7'), goodSaved('ann', { title: 'x'.repeat(101) })));
await deny('extra fields are refused', () => setDoc(doc(ann, 'savedTools/t8'), goodSaved('ann', { shared: true })));
await allow('the owner reads their saved tool', () => getDoc(doc(ann, 'savedTools/t1')));
await deny('nobody else can read it', () => getDoc(doc(bob, 'savedTools/t1')));
await deny('not even the platform owner', () => getDoc(doc(owner, 'savedTools/t1')));
await allow('the owner lists their own saved tools', () => getDocs(query(collection(ann, 'savedTools'), where('uid', '==', 'ann'))));
await deny('nobody can list everyone\'s', () => getDocs(collection(ann, 'savedTools')));
await deny('or list somebody else\'s', () => getDocs(query(collection(bob, 'savedTools'), where('uid', '==', 'ann'))));
await allow('the owner updates it, keeping when it was created', async () => {
  const snap = await getDoc(doc(ann, 'savedTools/t1'));
  return setDoc(doc(ann, 'savedTools/t1'), goodSaved('ann', { title: 'Renamed', createdAt: snap.data().createdAt }));
});
await deny('an update cannot change when it was created', () => setDoc(doc(ann, 'savedTools/t1'), goodSaved('ann')));
await allow('the toolkit workspace saves each change (just the work, its name and summary, and the time)', () => updateDoc(doc(ann, 'savedTools/t1'), { title: 'Autosaved', summary: '1. A', data: 'abc_DEF-1', updatedAt: serverTimestamp() }));
await deny('but not without the time', () => updateDoc(doc(ann, 'savedTools/t1'), { data: 'abc' }));
await deny('or with anything that is not the tool\'s encoding', () => updateDoc(doc(ann, 'savedTools/t1'), { data: '<b>', updatedAt: serverTimestamp() }));
await deny('or by anyone else', () => updateDoc(doc(bob, 'savedTools/t1'), { data: 'abc', updatedAt: serverTimestamp() }));
await deny('nobody else can overwrite it', () => setDoc(doc(bob, 'savedTools/t1'), goodSaved('bob')));
await deny('nobody else can delete it', () => deleteDoc(doc(bob, 'savedTools/t1')));
await allow('the owner deletes it', () => deleteDoc(doc(ann, 'savedTools/t1')));

console.log('\n--- My notes (readerNotes) ---');
{
  const goodNote = (over = {}) => Object.assign({
    url: '/insights/five-second-test', title: 'The five-second test', kind: 'article', color: 'g', quote: 'Customers glance',
    prefix: 'Real ', suffix: ' at pricing', pos: 120, note: 'Use in onboarding', tags: ['pricing'], created: 1000, updated: 2000,
    deleted: false, savedAt: serverTimestamp()
  }, over);
  const cat = asUser('cat', 'cat@x.com'), dan = asUser('dan', 'dan@x.com');
  const P = 'readerNotes/cat/items/';
  await allow('a reader saves a highlight to their own account', () => setDoc(doc(cat, P + 'abc123'), goodNote()));
  await allow('a book highlight with a different colour', () => setDoc(doc(cat, P + 'abc124'), goodNote({ kind: 'book', color: 'p', url: '/books/playbook/the-integrated-playbook' })));
  await deny('not into somebody else\'s notes', () => setDoc(doc(dan, P + 'abc125'), goodNote()));
  await deny('a signed-out visitor cannot save', () => setDoc(doc(anon, P + 'abc126'), goodNote()));
  await deny('only our own kind of id', () => setDoc(doc(cat, P + 'ABC_1'), goodNote()));
  await deny('only a page on www', () => setDoc(doc(cat, P + 'abc127'), goodNote({ url: 'https://evil.com/x' })));
  await deny('only the four colours', () => setDoc(doc(cat, P + 'abc127'), goodNote({ color: 'red' })));
  await deny('a quote over 3,000 characters is refused', () => setDoc(doc(cat, P + 'abc127'), goodNote({ quote: 'q'.repeat(3001) })));
  await deny('a note over 2,000 characters is refused', () => setDoc(doc(cat, P + 'abc127'), goodNote({ note: 'n'.repeat(2001) })));
  await deny('no more than ten tags', () => setDoc(doc(cat, P + 'abc127'), goodNote({ tags: Array.from({ length: 11 }, (_, i) => 't' + i) })));
  await deny('extra fields are refused', () => setDoc(doc(cat, P + 'abc127'), goodNote({ shared: true })));
  await deny('the save time must be the server\'s', () => setDoc(doc(cat, P + 'abc127'), goodNote({ savedAt: Timestamp.fromMillis(5) })));
  await deny('a deletion marker cannot keep its words', () => setDoc(doc(cat, P + 'abc127'), goodNote({ deleted: true })));
  await allow('a deletion marker with its words cleared', () => setDoc(doc(cat, P + 'abc124'), goodNote({ deleted: true, quote: '', note: '', tags: [], prefix: '', suffix: '', pos: 0, updated: 3000 })));
  await allow('the reader reads and lists their notes', async () => { await getDoc(doc(cat, P + 'abc123')); return getDocs(collection(cat, 'readerNotes/cat/items')); });
  await deny('nobody else can read them', () => getDoc(doc(dan, P + 'abc123')));
  await deny('or list them', () => getDocs(collection(dan, 'readerNotes/cat/items')));
  await deny('not even the platform owner', () => getDocs(collection(owner, 'readerNotes/cat/items')));
  await allow('the reader edits a note', () => setDoc(doc(cat, P + 'abc123'), goodNote({ note: 'changed', updated: 2500 })));
  await deny('nobody else can change it', () => updateDoc(doc(dan, P + 'abc123'), { note: 'x', savedAt: serverTimestamp() }));
  await deny('nobody else can delete it', () => deleteDoc(doc(dan, P + 'abc123')));
  await allow('the reader deletes it (when they delete their account)', () => deleteDoc(doc(cat, P + 'abc123')));
  await allow('a lesson highlight, with its course and lesson in the address', () => setDoc(doc(cat, P + 'lesson1'), goodNote({ kind: 'lesson', url: '/lesson?course=aiOrg-moderate&lesson=3' })));
  await allow('a note on saved toolkit work, with no quote', () => setDoc(doc(cat, P + 'toolnt1'), goodNote({ kind: 'tool', url: '/my-tools?open=AbC123xyz', quote: '', prefix: '', suffix: '', pos: 0 })));
  await deny('only the four kinds', () => setDoc(doc(cat, P + 'kind01'), goodNote({ kind: 'other' })));
  await deny('an address with anything odd in it', () => setDoc(doc(cat, P + 'addr01'), goodNote({ url: '/lesson?course=<b>' })));
  await deny('or a part after #', () => setDoc(doc(cat, P + 'addr02'), goodNote({ url: '/lesson?course=a#x' })));
}

console.log('\n--- team mode (teamSessions) ---');
{
  const fac = asUser('fac', 'fac@x.com'), pri = asUser('pri', 'pri@x.com'), mar = asUser('mar', 'mar@x.com'), nosy = asUser('nosy', 'nosy@x.com');
  const anon = env.unauthenticatedContext().firestore();
  const session = (over = {}) => Object.assign({ owner: 'fac', ownerName: 'Fran', tool: 'scorecard', title: 'Q1 roadmap',
    criteria: [{ name: 'Value', weight: 5, cost: false }, { name: 'Effort', weight: 3, cost: true }],
    features: ['Mobile app', 'SSO'], status: 'scoring', members: { fac: 'Fran' }, submitted: {}, agreed: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, over);
  const S = 'teamSessions/s1';
  const scores = (name, rows) => ({ name, scores: rows || ['52', '33'], updatedAt: serverTimestamp() });

  await allow('a signed-in person starts a team session', () => setDoc(doc(fac, S), session()));
  await deny('not for someone else', () => setDoc(doc(pri, 'teamSessions/s2'), session()));
  await deny('not already revealed', () => setDoc(doc(fac, 'teamSessions/s3'), session({ status: 'revealed' })));
  await deny('not with other people already in it', () => setDoc(doc(fac, 'teamSessions/s4'), session({ members: { fac: 'Fran', pri: 'Priya' } })));
  await deny('not with fewer than two features', () => setDoc(doc(fac, 'teamSessions/s5'), session({ features: ['One'] })));
  await deny('not with extra fields', () => setDoc(doc(fac, 'teamSessions/s6'), session({ secret: 1 })));
  await deny('signed-out visitors cannot open a session', () => getDoc(doc(anon, S)));
  await allow('anyone signed in with the link can open it', () => getDoc(doc(pri, S)));
  await allow('the facilitator lists their own sessions', () => getDocs(query(collection(fac, 'teamSessions'), where('owner', '==', 'fac'))));
  await deny('nobody can list other people\'s sessions', () => getDocs(collection(pri, 'teamSessions')));

  await allow('someone joins by adding their own name', () => updateDoc(doc(pri, S), { 'members.pri': 'Priya', updatedAt: serverTimestamp() }));
  await allow('a second person joins', () => updateDoc(doc(mar, S), { 'members.mar': 'Marcus', updatedAt: serverTimestamp() }));
  await deny('nobody can add someone else', () => updateDoc(doc(pri, S), { 'members.nosy': 'Nosy', updatedAt: serverTimestamp() }));
  await deny('a member cannot reveal the scores', () => updateDoc(doc(pri, S), { status: 'revealed', updatedAt: serverTimestamp() }));
  await deny('or change the features', () => updateDoc(doc(pri, S), { features: ['A', 'B'], updatedAt: serverTimestamp() }));

  await allow('a member saves their own scores', () => setDoc(doc(pri, S + '/scores/pri'), scores('Priya')));
  await deny('not someone else\'s', () => setDoc(doc(pri, S + '/scores/mar'), scores('Priya')));
  await deny('not without joining first', () => setDoc(doc(nosy, S + '/scores/nosy'), scores('Nosy')));
  await deny('not with the wrong number of features', () => setDoc(doc(pri, S + '/scores/pri'), scores('Priya', ['52'])));
  await deny('not with anything but digits 0 to 5', () => setDoc(doc(pri, S + '/scores/pri'), scores('Priya', ['5x', '33'])));
  await allow('and marks them done', () => updateDoc(doc(pri, S), { 'submitted.pri': true, updatedAt: serverTimestamp() }));
  await allow('the facilitator scores too', () => setDoc(doc(fac, S + '/scores/fac'), scores('Fran', ['33', '42'])));
  await allow('and marks their own done', () => updateDoc(doc(fac, S), { 'submitted.fac': true, updatedAt: serverTimestamp() }));
  await allow('a member reads their own scores while scoring', () => getDoc(doc(pri, S + '/scores/pri')));
  await deny('but nobody sees anyone else\'s before the reveal', () => getDoc(doc(mar, S + '/scores/pri')));
  await deny('not even the facilitator', () => getDoc(doc(fac, S + '/scores/pri')));
  await deny('nor can they list them', () => getDocs(collection(fac, S + '/scores')));

  await allow('the facilitator reveals the scores', () => updateDoc(doc(fac, S), { status: 'revealed', updatedAt: serverTimestamp() }));
  await allow('now members see everyone\'s scores', () => getDocs(collection(mar, S + '/scores')));
  await allow('and the facilitator does too', () => getDoc(doc(fac, S + '/scores/pri')));
  await deny('someone who never joined still cannot', () => getDocs(collection(nosy, S + '/scores')));
  await deny('scores cannot change once revealed', () => setDoc(doc(pri, S + '/scores/pri'), scores('Priya', ['11', '11'])));
  await deny('nor be marked done', () => updateDoc(doc(mar, S), { 'submitted.mar': true, updatedAt: serverTimestamp() }));
  await allow('the facilitator agrees the team\'s scores', () => updateDoc(doc(fac, S), { status: 'agreed', agreed: ['42', '33'], updatedAt: serverTimestamp() }));
  await deny('the agreed scores must cover every feature', () => updateDoc(doc(fac, S), { agreed: ['42'], updatedAt: serverTimestamp() }));
  await deny('the facilitator cannot change who is in it', () => updateDoc(doc(fac, S), { 'members.nosy': 'Nosy', updatedAt: serverTimestamp() }));
  await deny('a member cannot delete the session', () => deleteDoc(doc(pri, S)));
  await allow('a member removes their own scores', () => deleteDoc(doc(pri, S + '/scores/pri')));
  await allow('the facilitator deletes the session', () => deleteDoc(doc(fac, S)));
}

console.log('\n==============================');
console.log(passes + ' passed, ' + failures + ' failed');
await env.cleanup();
process.exit(failures ? 1 : 0);
