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

console.log('\n==============================');
console.log(passes + ' passed, ' + failures + ' failed');
await env.cleanup();
process.exit(failures ? 1 : 0);
