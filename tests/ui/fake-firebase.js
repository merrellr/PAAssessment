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

let authCb = null;
export function initializeApp(){ return {}; }
export function getAuth(){ return {}; }
export function onAuthStateChanged(auth, cb){
  authCb = cb;
  setTimeout(() => cb(window.__fakeUser === undefined ? { uid: 'owner1', email: 'owner@x.com', getIdToken: async () => 'fake-id-token' } : window.__fakeUser), 0);
}
export async function signOut(){ window.__fakeUser = null; if (authCb) authCb(null); }
export async function createUserWithEmailAndPassword(auth, email){ window.__fakeUser = { uid: 'uCreated', email, displayName: null }; if (authCb) authCb(window.__fakeUser); return { user: window.__fakeUser }; }
export async function signInWithEmailAndPassword(auth, email, pw){
  if (pw === 'wrong') throw Object.assign(new Error('bad'), { code: 'auth/invalid-credential' });
  window.__fakeUser = { uid: 'uSignedIn', email, displayName: 'Signed In' }; if (authCb) authCb(window.__fakeUser);
}
export async function updateProfile(user, p){ Object.assign(user, p); }
export async function sendEmailVerification(){}
export class GoogleAuthProvider {}
export async function signInWithPopup(){ window.__fakeUser = { uid: 'uGoogle', email: 'g@x.com', displayName: 'G User' }; if (authCb) authCb(window.__fakeUser); return { user: window.__fakeUser }; }
export function getAdditionalUserInfo(){ return { isNewUser: false }; }
export function getFirestore(){ return {}; }
export function doc(db, ...segs){
  // doc(collectionRef) makes a new document id, as in the real SDK
  if (db && db.col && segs.length === 0){ const id = 'auto' + (++counter); return { path: db.col + '/' + id, id }; }
  const path = segs.join('/'); return { path, id: segs[segs.length - 1] }; }
export function collection(db, ...segs){ return { col: segs.join('/') }; }
export function where(f, op, v){ return { f, op, v }; }
export function query(c, ...wheres){ return { col: c.col, wheres }; }
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
  return { docs, empty: docs.length === 0 };
}
export async function getCountFromServer(q){ const s = await getDocs(q); return { data: () => ({ count: s.docs.length }) }; }
export async function addDoc(c, data){ const id = 'auto' + (++counter); store[c.col + '/' + id] = resolve(data); return { id }; }
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
  return {
    set(ref, data){ ops.push(() => { window.__writeLog.push({ op: 'set', path: ref.path }); store[ref.path] = stripMarkers(resolve(data)); }); },
    update(ref, data){ ops.push(() => { window.__writeLog.push({ op: 'update', path: ref.path }); applyUpdate(store[ref.path], resolve(data)); }); },
    async commit(){
      if (window.__failCommit) throw Object.assign(new Error('fail'), { code: window.__failCommit });
      ops.forEach(f => f());
    }
  };
}

export async function sendPasswordResetEmail(){}
export async function updatePassword(){}
export async function reauthenticateWithCredential(){}
export const EmailAuthProvider = { credential: () => ({}) };
export const increment = (n) => ({ __increment: n });
export async function verifyBeforeUpdateEmail(){}
export async function reauthenticateWithPopup(){}
export async function deleteUser(user){
  window.__deleted = true;
  window.__fakeUser = null;
  window.__writeLog.push({ op: 'deleteUser', path: user.uid });
  if (authCb) authCb(null);
}