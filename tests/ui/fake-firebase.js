// A tiny in-memory stand-in for the Firebase pieces the pages use, so their
// real code can be exercised in a plain browser with no network.
const store = { 'platformAdmins/owner1': { note: 'owner' } };
let counter = 0;
export class Timestamp {
  constructor(ms){ this.ms = ms; }
  toMillis(){ return this.ms; }
  toDate(){ return new Date(this.ms); }
  static fromMillis(ms){ return new Timestamp(ms); }
  static now(){ return new Timestamp(Date.now()); }
}
const SERVER = { __server: true };
export const serverTimestamp = () => SERVER;
export const arrayUnion = (...items) => ({ __arrayUnion: items });
function resolve(v){
  if (v === SERVER) return Timestamp.now();
  if (v instanceof Timestamp) return v;
  if (v && typeof v === 'object' && (v.__arrayUnion || v.__increment !== undefined)) return v;
  if (Array.isArray(v)) return v.map(resolve);
  if (v && typeof v === 'object'){ const o = {}; Object.keys(v).forEach(k => { o[k] = resolve(v[k]); }); return o; }
  return v;
}
function clone(v){
  if (v instanceof Timestamp) return v;
  if (Array.isArray(v)) return v.map(clone);
  if (v && typeof v === 'object'){ const o = {}; Object.keys(v).forEach(k => { o[k] = clone(v[k]); }); return o; }
  return v;
}
// Applies a resolved update onto an existing document, expanding arrayUnion markers.
function applyUpdate(existing, data){
  const target = existing || {};
  Object.keys(data).forEach(k => {
    const v = data[k];
    if (v && typeof v === 'object' && v.__increment !== undefined){ target[k] = (Number(target[k]) || 0) + v.__increment; return; }
    if (v && typeof v === 'object' && v.__arrayUnion){
      const cur = Array.isArray(target[k]) ? target[k] : [];
      v.__arrayUnion.forEach(item => { if (cur.indexOf(item) === -1) cur.push(item); });
      target[k] = cur;
    } else {
      target[k] = v;
    }
  });
  return target;
}
function stripMarkers(v){
  // a plain set() of a value containing an arrayUnion marker starts a fresh array
  if (v && typeof v === 'object' && v.__arrayUnion) return v.__arrayUnion.slice();
  if (Array.isArray(v)) return v.map(stripMarkers);
  if (v && typeof v === 'object' && !(v instanceof Timestamp)){ const o = {}; Object.keys(v).forEach(k => { o[k] = stripMarkers(v[k]); }); return o; }
  return v;
}
export const __store = store;
window.__store = store;
window.__writeLog = [];
if (window.__seed) window.__seed(store, Timestamp);

const authCbs = [];   // like the real SDK, every listener hears about every sign-in and sign-out
function fireAuth(u){ authCbs.slice().forEach(cb => cb(u)); }
export function initializeApp(cfg, name){ return { name: name || '[DEFAULT]' }; }
// A second app (My Profile's "two accounts: keep one") has its own sign-in: window.__otherUser is the account
// it can sign in to, and window.__otherSignedIn is who it is signed in as. Its sign-ins tell no listener.
const otherAuth = { other: true, get currentUser(){ return window.__otherSignedIn || null; } };
const isOther = (auth) => !!(auth && auth.other);
function otherSignIn(){
  if (!window.__otherUser) throw Object.assign(new Error('no user'), { code: 'auth/user-not-found' });
  window.__otherSignedIn = window.__otherUser; return { user: window.__otherUser };
}
export function getAuth(app){
  if (app && app.name === 'pa-other') return otherAuth;
  return { get currentUser(){ return window.__fakeUser || null; } };   // like the real thing, the signed-in person
}
export function onAuthStateChanged(auth, cb){
  authCbs.push(cb);
  setTimeout(() => cb(window.__fakeUser === undefined ? { uid: 'owner1', email: 'owner@x.com', getIdToken: async () => 'fake-id-token' } : window.__fakeUser), 0);
}
export async function signOut(auth){ if (isOther(auth)) { window.__otherSignedIn = null; return; } window.__fakeUser = null; fireAuth(null); }
export async function createUserWithEmailAndPassword(auth, email){ window.__fakeUser = { uid: 'uCreated', email, displayName: null }; fireAuth(window.__fakeUser); return { user: window.__fakeUser }; }
export async function signInWithEmailAndPassword(auth, email, pw){
  if (pw === 'wrong') throw Object.assign(new Error('bad'), { code: 'auth/invalid-credential' });
  if (isOther(auth)) { window.__otherPw = pw; return otherSignIn(); }
  twoStepGate(email);
  window.__fakeUser = { uid: 'uSignedIn', email, displayName: 'Signed In' }; fireAuth(window.__fakeUser);
}
export async function updateProfile(user, p){ Object.assign(user, p); }
export async function sendEmailVerification(){}
export class GoogleAuthProvider {
  static credentialFromError(err){ return err && err.customData ? { providerId: 'google.com', email: err.customData.email } : null; }
  static credentialFromResult(r){ return r && r.user ? { providerId: 'google.com', email: r.user.email } : null; }
}
// Signing in with a sign-in that belongs to an account: on the second app, the other account; on the page's
// own, switching to the other account (window.__failSwitch makes that fail).
export async function signInWithCredential(auth, cred){
  if (isOther(auth)) return otherSignIn();
  if (window.__failSwitch) throw Object.assign(new Error('fail'), { code: 'auth/network-request-failed' });
  window.__switchedWith = cred; window.__fakeUser = window.__otherUser; fireAuth(window.__fakeUser); return { user: window.__fakeUser };
}
export async function signInWithPopup(auth){
  if (isOther(auth)) return otherSignIn(); twoStepGate('g@x.com'); window.__fakeUser = { uid: 'uGoogle', email: 'g@x.com', displayName: 'G User' }; fireAuth(window.__fakeUser); return { user: window.__fakeUser }; }
export function getAdditionalUserInfo(){ return { isNewUser: false }; }
export function getFirestore(){ return {}; }
export function doc(db, ...segs){
  // doc(collectionRef) makes a new document id, as in the real SDK
  if (db && db.col && segs.length === 0){ const id = 'auto' + (++counter); return { path: db.col + '/' + id, id }; }
  const path = segs.join('/'); return { path, id: segs[segs.length - 1] }; }
export function collection(db, ...segs){ return { col: segs.join('/') }; }
export function where(f, op, v){ return { kind: 'where', f, op, v }; }
export function orderBy(f, dir){ return { kind: 'orderBy', f, dir: dir || 'asc' }; }
export function limit(n){ return { kind: 'limit', n }; }
export function query(c, ...parts){
  return { col: c.col, wheres: parts.filter(p => p.kind === 'where'), orders: parts.filter(p => p.kind === 'orderBy'), limit: (parts.find(p => p.kind === 'limit') || {}).n };
}
export async function getDoc(ref){
  const d = store[ref.path];
  return { id: ref.id, exists: () => d !== undefined, data: () => (d === undefined ? undefined : clone(d)) };
}
export async function getDocs(q){
  if (window.__failList && window.__failList.test(q.col)) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
  const wheres = q.wheres || [];
  const prefix = q.col + '/';
  const docs = Object.keys(store).filter(p => p.indexOf(prefix) === 0 && p.slice(prefix.length).indexOf('/') === -1)
    .map(p => ({ id: p.slice(prefix.length), data: () => clone(store[p]) }))
    .filter(d => wheres.every(w => d.data()[w.f] === w.v));
  const keyOf = (d, f) => { const v = d.data()[f]; return v && v.toMillis ? v.toMillis() : v; };
  (q.orders || []).slice().reverse().forEach(o => {
    docs.sort((a, b) => { const x = keyOf(a, o.f), y = keyOf(b, o.f); return (x < y ? -1 : x > y ? 1 : 0) * (o.dir === 'desc' ? -1 : 1); });
  });
  if (q.limit) docs.length = Math.min(docs.length, q.limit);
  return { docs, empty: docs.length === 0 };
}
export async function getCountFromServer(q){ const s = await getDocs(q); return { data: () => ({ count: s.docs.length }) }; }
export async function addDoc(c, data){
  const id = 'auto' + (++counter);
  const path = c.col + '/' + id;
  if (window.__failWrite && window.__failWrite.test(path)) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
  window.__writeLog.push({ op: 'add', path });
  store[path] = resolve(data);
  return { id };
}
export async function setDoc(ref, data, opts){
  if (window.__failWrite && window.__failWrite.test(ref.path)) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
  window.__writeLog.push({ op: 'set', path: ref.path });
  const r = resolve(data);
  store[ref.path] = opts && opts.merge ? applyUpdate(store[ref.path] || {}, r) : stripMarkers(r);
}
export async function updateDoc(ref, data){
  if (window.__failWrite && window.__failWrite.test(ref.path)) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
  if (!store[ref.path]) throw Object.assign(new Error('not found'), { code: 'not-found' });
  window.__writeLog.push({ op: 'update', path: ref.path });
  applyUpdate(store[ref.path], resolve(data));
}
export async function deleteDoc(ref){ window.__writeLog.push({ op: 'delete', path: ref.path }); delete store[ref.path]; }
export function writeBatch(){
  const ops = [];
  const add = (path, run) => { ops.push({ path, run }); };
  return {
    set(ref, data){ add(ref.path, () => { window.__writeLog.push({ op: 'set', path: ref.path }); store[ref.path] = stripMarkers(resolve(data)); }); },
    update(ref, data){ add(ref.path, () => { window.__writeLog.push({ op: 'update', path: ref.path }); applyUpdate(store[ref.path], resolve(data)); }); },
    delete(ref){ add(ref.path, () => { window.__writeLog.push({ op: 'delete', path: ref.path }); delete store[ref.path]; }); },
    async commit(){
      if (window.__failCommit) throw Object.assign(new Error('fail'), { code: window.__failCommit });
      // like the real thing, one refused write refuses the whole batch
      if (window.__failWrite && ops.some(o => window.__failWrite.test(o.path))) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
      ops.forEach(o => o.run());
    }
  };
}

export async function sendPasswordResetEmail(){}
export async function updatePassword(){}
export async function reauthenticateWithCredential(user, cred){ if (cred && cred.password === 'wrong') throw Object.assign(new Error('bad'), { code: 'auth/wrong-password' }); }
export const EmailAuthProvider = { credential: (email, password) => ({ providerId: 'password', email, password }), credentialWithLink: (email, link) => ({ email, link }) };
// Linking a second way to sign in (My Profile → Ways to sign in). window.__linkError makes the next link fail with that code.
function linkFail(){ const c = window.__linkError; window.__linkError = null; if (c) { const e = new Error(c); e.code = c; e.customData = { email: window.__linkErrorEmail }; throw e; } }
export async function linkWithPopup(user){ linkFail(); user.providerData.push({ providerId: 'google.com', email: 'me.personal@gmail.com' }); return { user }; }
export async function linkWithCredential(user, cred){
  linkFail();
  const pid = cred.providerId || 'password';
  if (user.providerData.some(p => p.providerId === pid)) throw Object.assign(new Error('linked'), { code: 'auth/provider-already-linked' });
  window.__linked = cred; (window.__linkedAll = window.__linkedAll || []).push(user.uid + ':' + pid + ':' + cred.email);
  user.providerData.push({ providerId: pid, email: cred.email }); return { user };
}
export async function unlink(user, providerId){ user.providerData = user.providerData.filter(p => p.providerId !== providerId); return user; }
export async function sendSignInLinkToEmail(auth, email, settings){ window.__linkSent = { email, settings }; }
export function isSignInWithEmailLink(auth, href){ return /[?&]oobCode=/.test(href); }
export const increment = (n) => ({ __increment: n });
export async function verifyBeforeUpdateEmail(){}
export async function reauthenticateWithPopup(user){ if (window.__popupBlocked) throw Object.assign(new Error('blocked'), { code: 'auth/popup-blocked' }); return { user }; }
export async function deleteUser(user){
  if (user === window.__otherSignedIn){
    window.__otherDeleted = true; window.__otherSignedIn = null; window.__otherUser = null;
    window.__writeLog.push({ op: 'deleteUser', path: user.uid }); return;
  }
  window.__deleted = true;
  window.__fakeUser = null;
  window.__writeLog.push({ op: 'deleteUser', path: user.uid });
  fireAuth(null);
}
// Two-step verification (two-step.js). window.__mfaAccounts = { 'me@x.com': true } makes signing in to that address
// stop for a code (Google sign-in uses g@x.com); 123456 is the only code that works. window.__mfaNeedRecent makes the
// next set-up or turn-off ask for a recent sign-in first, as Firebase does.
const CODE_OK = '123456';
const codeErr = () => Object.assign(new Error('bad code'), { code: 'auth/invalid-verification-code' });
function twoStepGate(email){
  if (!(window.__mfaAccounts && window.__mfaAccounts[email])) return;
  const pending = { uid: 'uMfa', email, displayName: 'Two Step', emailVerified: true, providerData: [{ providerId: 'password', email }], __factors: [{ uid: 'f1', factorId: 'totp', displayName: 'Authenticator app' }], getIdToken: async () => 'tok' };
  window.__mfaAsked = (window.__mfaAsked || 0) + 1;
  throw Object.assign(new Error('second factor'), { code: 'auth/multi-factor-auth-required', __pending: pending });
}
function needRecent(){ if (window.__mfaOddError) throw Object.assign(new Error('odd'), { code: window.__mfaOddError }); if (window.__mfaNeedRecent){ window.__mfaNeedRecent = false; throw Object.assign(new Error('recent'), { code: 'auth/requires-recent-login' }); } }
export const TotpMultiFactorGenerator = {
  FACTOR_ID: 'totp',
  generateSecret: async () => { needRecent(); return { secretKey: 'JBSWY3DPEHPK3PXP', generateQrCodeUrl: (account, issuer) => 'otpauth://totp/' + encodeURIComponent(issuer + ':' + account) + '?secret=JBSWY3DPEHPK3PXP&issuer=' + encodeURIComponent(issuer) }; },
  assertionForEnrollment: (secret, code) => ({ code }),
  assertionForSignIn: (uid, code) => ({ uid, code })
};
export function multiFactor(user){
  if (!user.__factors) user.__factors = [];
  return {
    get enrolledFactors(){ return user.__factors; },
    getSession: async () => ({ session: true }),
    enroll: async (a, name) => { if (a.code !== CODE_OK) throw codeErr(); user.__factors = user.__factors.concat([{ uid: 'f' + (user.__factors.length + 1), factorId: 'totp', displayName: name }]); window.__enrolled = name; },
    unenroll: async (f) => { needRecent(); user.__factors = user.__factors.filter(x => x !== f); window.__unenrolled = (window.__unenrolled || 0) + 1; }
  };
}
export function getMultiFactorResolver(auth, e){
  return {
    hints: [{ uid: 'f1', factorId: 'totp', displayName: 'Authenticator app' }],
    resolveSignIn: async (a) => {
      if (a.code !== CODE_OK) throw codeErr();
      window.__fakeUser = e.__pending; fireAuth(e.__pending); return { user: e.__pending };
    }
  };
}
