/* Keeps a company member's shared record up to date, and blanks their name on
   it when they delete their account. Imported by the pages that change a
   person's progress. Everything here is best-effort and quiet: a person who is
   not in a company is never touched, and a failure never blocks the page.

   What goes into the record, and what never does, is decided in
   org-share-core.js. Who may write or read it is decided by firestore.rules. */

import {
  doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp, deleteField
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { buildShare, shareHash, orgIdsFor, buildShape } from "./org-share-core.js";

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

  // The record is rewritten whole, so a skills shape already on it (syncOrgShape) is carried over.
  const ref = doc(db, 'orgs', membership.orgId, 'members', user.uid);
  let keep = null;
  try { const cur = await getDoc(ref); if (cur.exists() && cur.data().shape) keep = cur.data().shape; } catch (e){ /* nothing to keep */ }
  await setDoc(ref, Object.assign({}, share, keep ? { shape: keep } : {}, { updatedAt: serverTimestamp() }));
  storageSet(key, hash);
  return { status: 'synced', orgId: membership.orgId };
}

/* The skills shape on the company's shared record (C4). Shared only while the company has
   assigned the person a role (orgRoles/{orgId}/people/{uid}); assigning the role is the
   consent, and the learner is told so on My shape and Profile. With no role it removes any
   shape shared before. levels: ShapeCore.levels(...). Skips the write when nothing changed. */
export async function syncOrgShape(db, user, levels){
  if (!user) return { status: 'no_user' };
  const membershipSnap = await getDoc(doc(db, 'memberships', user.uid));
  if (!membershipSnap.exists() || membershipSnap.data().status !== 'active') return { status: 'not_member' };
  const orgId = membershipSnap.data().orgId;
  let roleId = '';
  try { const r = await getDoc(doc(db, 'orgRoles', orgId, 'people', user.uid)); if (r.exists()) roleId = r.data().roleId || ''; } catch (e){ return { status: 'no_role_access' }; }
  const ref = doc(db, 'orgs', orgId, 'members', user.uid);
  const key = 'pa_shape_' + orgId + '_' + user.uid;
  if (!roleId){
    if (storageGet(key) === 'none') return { status: 'no_role' };
    try {
      const cur = await getDoc(ref);
      if (cur.exists() && cur.data().shape) await updateDoc(ref, { shape: deleteField(), updatedAt: serverTimestamp() });
      storageSet(key, 'none');
    } catch (e){ /* the share isn't there yet: nothing to remove */ }
    return { status: 'no_role', roleId: '' };
  }
  const shape = buildShape(levels, roleId);
  if (!shape) return { status: 'nothing', roleId };
  const hash = shareHash({ roleId: shape.roleId, levels: shape.levels, strength: shape.strength });
  if (storageGet(key) === hash) return { status: 'unchanged', roleId };
  try { await updateDoc(ref, { shape: shape, updatedAt: serverTimestamp() }); }
  catch (e){ return { status: 'no_share_yet', roleId }; }   // the full record is written first (syncOrgShare)
  storageSet(key, hash);
  return { status: 'synced', roleId };
}

/* The role this person's company assigned them, or '' (none, not a member, or no access). */
export async function assignedRole(db, user){
  try {
    const m = await getDoc(doc(db, 'memberships', user.uid));
    if (!m.exists() || m.data().status !== 'active') return '';
    const r = await getDoc(doc(db, 'orgRoles', m.data().orgId, 'people', user.uid));
    return r.exists() ? (r.data().roleId || '') : '';
  } catch (e){ return ''; }
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

/* ---------------------------------------------------------------- DISC Work Styles, shared (W2)
   Needs styles-org-core.js on the page (window.StylesOrgCore). */

/* The person's company and how it shares work styles: { orgId, orgName, isAdmin, settings: { mode, teams },
   teamView } (teamView: the paid team views are switched on), or null when they are not in a company. */
export async function styleContext(db, user){
  try {
    const m = await getDoc(doc(db, 'memberships', user.uid));
    if (!m.exists() || m.data().status !== 'active' || !m.data().orgId) return null;
    const orgId = m.data().orgId, O = window.StylesOrgCore;
    const [st, feat] = await Promise.all([getDoc(doc(db, 'orgStyleSettings', orgId)).catch(() => null), getDoc(doc(db, 'orgFeatures', orgId)).catch(() => null)]);
    return { orgId, orgName: m.data().orgName || 'your company', isAdmin: m.data().role === 'admin',
      settings: O.clean(st && st.exists() ? st.data() : { mode: 'none' }), teamView: !!(feat && feat.exists() && feat.data().styles === true) };
  } catch (e){ return null; }
}

/* Puts the person's work style on the company's copy when the company's mode says so (or they chose to, in
   "optional"), and takes it off where that is theirs to decide. Name and scores only, never answers. */
export async function syncOrgStyle(db, user, ctx, workStyle, optIn){
  const O = window.StylesOrgCore;
  if (!ctx || !O) return { status: 'no_company' };
  const mode = ctx.settings.mode, ref = doc(db, 'orgStyles', ctx.orgId, 'people', user.uid);
  const rec = workStyle && workStyle.complete ? O.shareRecord(workStyle, user.displayName || (user.email || '').split('@')[0]) : null;
  const key = 'pa_style_' + ctx.orgId + '_' + user.uid;
  if (rec && O.shouldShare(mode, optIn)){
    const hash = JSON.stringify([mode, rec]);
    if (storageGet(key) === hash) return { status: 'unchanged', mode };
    try { await setDoc(ref, Object.assign({}, rec, { at: serverTimestamp() })); storageSet(key, hash); return { status: 'shared', mode }; }
    catch (e){ return { status: 'failed', mode }; }
  }
  if (O.canUnshare(mode) && storageGet(key) !== 'none'){
    try { const cur = await getDoc(ref); if (cur.exists()) await deleteDoc(ref); storageSet(key, 'none'); return { status: 'removed', mode }; }
    catch (e){ return { status: 'failed', mode }; }
  }
  return { status: 'nothing', mode };
}

/* The work styles this person may see in their company (not their own): [{ uid, name, scores, primary, secondary }]. */
export async function visibleStyles(db, user, ctx){
  if (!ctx) return [];
  const mode = ctx.settings.mode, out = [];
  if (mode === 'none') return [];
  try {
    if (mode === 'optional' || mode === 'all' || ctx.isAdmin){
      (await getDocs(collection(db, 'orgStyles', ctx.orgId, 'people'))).docs.forEach(d => { if (d.id !== user.uid) out.push(Object.assign({ uid: d.id }, d.data())); });
    } else {
      const v = await getDoc(doc(db, 'orgStyleViews', ctx.orgId, 'viewers', user.uid));
      const uids = v.exists() ? (v.data().uids || []) : [];
      const docs = await Promise.all(uids.slice(0, 200).map(u => getDoc(doc(db, 'orgStyles', ctx.orgId, 'people', u)).catch(() => null)));
      docs.forEach((d, i) => { if (d && d.exists()) out.push(Object.assign({ uid: uids[i] }, d.data())); });
    }
  } catch (e){ return []; }
  return out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}
