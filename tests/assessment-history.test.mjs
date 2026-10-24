// Tests for assessment-history.js (every assessment a learner has taken).
// Run:  node --experimental-default-type=module tests/assessment-history.test.mjs
import '../assessment-history.js';

const H = globalThis.AssessHistory;
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const J = (v) => JSON.stringify(v);
const cat = (v) => ({ discovery: v, strategy: v });
const r = (id, at, pct, tier) => ({ assessmentId: id, submittedAt: at, overallPct: pct, tier: tier || 'T' + pct, categoryPct: cat(pct), answers: [{ n: 1 }] });

t('no assessments: an empty list', J(H.list({})) === '[]' && J(H.list(null)) === '[]');
const old = { assessmentResult: Object.assign(r('a2', '2026-03-01T00:00:00Z', 60), { firstSubmittedAt: '2026-01-01T00:00:00Z', firstOverallPct: 40, firstTier: 'Little' }) };
const l = H.list(old);
t('an older account shows its first attempt and its latest', l.length === 2 && l[0].overallPct === 40 && l[0].tier === 'Little' && l[0].partial === true && l[1].overallPct === 60, J(l));
t('history entries leave the answers out', !('answers' in l[1]) && J(l[1].categoryPct) === J(cat(60)));
const one = { assessmentResult: Object.assign(r('a1', '2026-01-01T00:00:00Z', 40), { firstSubmittedAt: '2026-01-01T00:00:00Z', firstOverallPct: 40 }) };
t('one attempt only: listed once', H.list(one).length === 1 && !H.list(one)[0].partial);

const h = H.add(old, r('a3', '2026-05-01T00:00:00Z', 75));
t('a retake is added, and the earlier ones are kept, oldest first', J(h.map(e => e.overallPct)) === '[40,60,75]', J(h));
const doc2 = { assessmentHistory: h, assessmentResult: r('a3', '2026-05-01T00:00:00Z', 75) };
t('saving the same attempt twice counts it once', H.add(doc2, r('a3', '2026-05-01T00:00:09Z', 75)).length === 3);
t('the list of a saved document is its history', J(H.list(doc2).map(e => e.overallPct)) === '[40,60,75]');

const other = { assessmentHistory: [r('b1', '2026-02-01T00:00:00Z', 50)], assessmentResult: r('b2', '2026-06-01T00:00:00Z', 80) };
const c = H.combine(doc2, other);
t('combining two accounts keeps every assessment from both, in date order', J(c.map(e => e.overallPct)) === '[40,50,60,75,80]', J(c));
t('combining the same account with itself adds nothing', H.combine(doc2, doc2).length === 3);
const full = H.combine({ assessmentHistory: [{ submittedAt: '2026-01-01T00:00:00Z', overallPct: 40, tier: 'Little', partial: true }] }, { assessmentHistory: [r('a1', '2026-01-01T00:00:00Z', 40)] });
t('a full record replaces the partial one for the same attempt', full.length === 1 && !full[0].partial && !!full[0].categoryPct, J(full));

const many = { assessmentHistory: Array.from({ length: 60 }, (_, i) => r('m' + i, new Date(Date.UTC(2025, 0, 1 + i)).toISOString(), i)) };
const capped = H.list(many);
t('at most ' + H.MAX + ' are kept: the newest', capped.length === H.MAX && capped[capped.length - 1].overallPct === 59 && capped[0].overallPct === 10);
t('junk is ignored', H.list({ assessmentHistory: [null, 'x', { tier: 'no score' }] }).length === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
