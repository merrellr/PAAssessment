// Tests for firestore.rules, run against the local Firestore emulator.
//
// How to run (needs Node 20 and Java 21; none of this runs on the live site):
//   npm install firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
//   RULES_PATH=../firestore.rules npx firebase emulators:exec --only firestore \
//     --project demo-pa "node tests/firestore-rules.test.mjs"
//
// Each line is "can X do Y?". assertSucceeds means the rules must allow it,
// assertFails means they must refuse it. Failing lines print FAIL and the
// script exits with a non-zero code.
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where,
  writeBatch, serverTimestamp, Timestamp
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
await deny('a company admin cannot remove a member yet (planned for a later step)',
  () => updateDoc(doc(adminA, 'memberships/memberA'), { status: 'removed', endedAt: serverTimestamp() }));
await allow('a removed member can join a NEW company with a new invite',
  () => join(asUser('removedR', 'r@a.com'), 'removedR', 'r@a.com', 'tokB', { orgId: 'orgB', orgName: 'Beta' }, {}, true));

console.log('\n==============================');
console.log(passes + ' passed, ' + failures + ' failed');
await env.cleanup();
process.exit(failures ? 1 : 0);
