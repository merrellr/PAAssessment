/* Pure logic for the shared record, with no Firebase in it so it can be tested
   on its own. See org-share.js for the part that talks to Firestore.

   The shared record is the only thing a person's company can see about them.
   It is built from an explicit list of fields, so anything not named here
   (private reflections, saved templates, phone number, profile details, time
   spent) can never reach it, even by accident. */

const ASSESSMENT_FIELDS = [
  'tier', 'overallPct', 'overallTotal', 'overallMax', 'categoryPct', 'assessmentId',
  'submittedAt', 'firstSubmittedAt', 'firstOverallPct', 'firstTier', 'answers'
];

const ANSWER_FIELDS = ['n', 'cat', 'question', 'answer', 'points'];

function pick(obj, fields){
  const out = {};
  fields.forEach(k => { if (obj && obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

function isoOrNull(v){
  return (typeof v === 'string' && v.length > 0 && v.length <= 40) ? v : null;
}

function latestIso(list){
  let best = null;
  list.forEach(v => {
    const iso = isoOrNull(v);
    if (iso && (best === null || Date.parse(iso) > Date.parse(best))) best = iso;
  });
  return best;
}

/* progress:   the person's own progress/{uid} document (or {})
   user:       the signed-in account ({ displayName, email })
   membership: their memberships/{uid} document */
export function buildShare(progress, user, membership){
  const p = progress || {};

  let assessment = null;
  if (p.assessmentResult && typeof p.assessmentResult === 'object'){
    assessment = pick(p.assessmentResult, ASSESSMENT_FIELDS);
    if (Array.isArray(assessment.answers)){
      assessment.answers = assessment.answers.map(a => pick(a, ANSWER_FIELDS));
    }
  }

  const courses = {};
  const stamps = [];
  const source = (p.courses && typeof p.courses === 'object') ? p.courses : {};
  Object.keys(source).forEach(id => {
    const c = source[id] || {};
    const completed = Array.isArray(c.completed) ? c.completed.filter(n => typeof n === 'number') : [];
    courses[id] = {
      completed: completed,
      lastLesson: typeof c.lastLesson === 'number' ? c.lastLesson : null,
      updatedAt: isoOrNull(c.updatedAt)
    };
    stamps.push(c.updatedAt);
  });
  if (assessment) stamps.push(assessment.submittedAt);

  const m = membership || {};
  const u = user || {};
  return {
    identity: {
      name: String(u.displayName || m.displayName || '').slice(0, 100),
      email: String(u.email || '').toLowerCase()
    },
    assessment: assessment,
    courses: courses,
    lastActiveAt: latestIso(stamps)
  };
}

/* A short fingerprint of a share, used to skip writing when nothing changed. */
export function shareHash(share){
  function canon(v){
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }
  const text = canon(share);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + ':' + text.length;
}

/* Every company this person could have a shared record with: the one on their
   current membership plus any listed in their own progress record. */
export function orgIdsFor(membership, progress){
  const ids = {};
  if (membership && typeof membership.orgId === 'string' && membership.orgId) ids[membership.orgId] = true;
  if (progress && Array.isArray(progress.orgIds)) progress.orgIds.forEach(id => { if (typeof id === 'string' && id) ids[id] = true; });
  return Object.keys(ids);
}
