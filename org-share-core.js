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

/* The skills shape a company sees once it has assigned the person a role (firestore.rules
   validShapeShare): the role, each competency's level and how much evidence is behind it
   (s strong, m some, t thin), and when. Nothing else: no answers, no lesson history.
   levels: ShapeCore.levels(...) ([{ key, level, strength }]). null when there is nothing to share. */
const STRENGTH_CODE = { strong: 's', some: 'm', thin: 't' };
export function buildShape(levels, roleId, nowIso){
  if (!Array.isArray(levels) || typeof roleId !== 'string' || !/^[a-z0-9-]{1,40}$/.test(roleId)) return null;
  const lv = {}, st = {};
  levels.slice(0, 28).forEach(c => {
    if (!c || typeof c.key !== 'string' || !(c.level > 0)) return;
    lv[c.key] = Math.round(Math.min(4, c.level) * 10) / 10;
    st[c.key] = STRENGTH_CODE[c.strength] || 't';
  });
  if (!Object.keys(lv).length) return null;
  return { roleId: roleId, levels: lv, strength: st, at: String(nowIso || new Date().toISOString()).slice(0, 40) };
}
// Back from the shared record: [{ key, level, strength }] for ShapeCore.compare.
export function shapeLevels(shape){
  const back = { s: 'strong', m: 'some', t: 'thin' };
  if (!shape || !shape.levels) return [];
  return Object.keys(shape.levels).map(k => ({ key: k, level: Number(shape.levels[k]) || 0, strength: back[(shape.strength || {})[k]] || 'thin' }));
}
