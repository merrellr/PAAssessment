/* Keeps a company member's shared record up to date, and blanks their name on
   it when they delete their account. Imported by the pages that change a
   person's progress. Everything here is best-effort and quiet: a person who is
   not in a company is never touched, and a failure never blocks the page.

   What goes into the record, and what never does, is decided in
   org-share-core.js. Who may write or read it is decided by firestore.rules. */

import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { buildShare, shareHash, orgIdsFor } from "./org-share-core.js";

function storageGet(key){ try { return localStorage.getItem(key); } catch (e){ return null; } }
function storageSet(key, value){ try { localStorage.setItem(key, value); } catch (e){ /* storage unavailable */ } }

/* Copies the person's current results and course progress into their
   company's shared record, if (and only if) they are an active member.
   Skips the write when nothing has changed since the last one. */
export async function syncOrgShare(db, user, options){
  if (!user) return { status: 'no_user' };

  const membershipSnap = await getDoc(doc(db, 'memberships', user.uid));
  if (!membershipSnap.exists()) return { status: 'not_member' };
  const membership = membershipSnap.data();
  if (membership.status !== 'active') return { status: 'inactive' };

  const progressSnap = await getDoc(doc(db, 'progress', user.uid));
  const share = buildShare(progressSnap.exists() ? progressSnap.data() : {}, user, membership);

  const hash = shareHash(share);
  const key = 'pa_share_' + membership.orgId + '_' + user.uid;
  if (!(options && options.force) && storageGet(key) === hash) return { status: 'unchanged' };

  await setDoc(doc(db, 'orgs', membership.orgId, 'members', user.uid),
    Object.assign({}, share, { updatedAt: serverTimestamp() }));
  storageSet(key, hash);
  return { status: 'synced', orgId: membership.orgId };
}

/* Remembers which companies this person has been in, on their own progress
   record, so their name can be blanked on every company's copy if they ever
   delete their account. */
export async function recordOrgMembership(db, uid, orgId){
  await setDoc(doc(db, 'progress', uid), { orgIds: arrayUnion(orgId) }, { merge: true });
}

/* Run BEFORE deleting an account. Blanks the person's name and email on each
   company's copy (the results stay with the company) and on their membership
   record. Throws if any step fails, so the caller can stop and nothing is lost. */
export async function anonymizeOrgShares(db, user){
  const membershipRef = doc(db, 'memberships', user.uid);
  const membershipSnap = await getDoc(membershipRef);
  const membership = membershipSnap.exists() ? membershipSnap.data() : null;
  const progressSnap = await getDoc(doc(db, 'progress', user.uid));
  const orgIds = orgIdsFor(membership, progressSnap.exists() ? progressSnap.data() : null);

  let blanked = 0;
  for (const orgId of orgIds){
    const ref = doc(db, 'orgs', orgId, 'members', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().identity !== null){
      await updateDoc(ref, { identity: null, updatedAt: serverTimestamp() });
      blanked++;
    }
  }

  if (membership && (membership.email || membership.displayName || membership.phone)){
    await updateDoc(membershipRef, { email: '', displayName: '', phone: '' });
  }
  return { companies: orgIds.length, blanked: blanked };
}
