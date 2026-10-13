// Tests for org-share-core.js (the shared record's contents).
// Run:  node --experimental-default-type=module tests/org-share-core.test.mjs
import { buildShare, shareHash, orgIdsFor } from '../org-share-core.js';

let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const user = { displayName: 'Jane Smith', email: 'Jane@Acme.com', uid: 'u1' };
const membership = { orgId: 'orgA', displayName: 'Jane From Membership', status: 'active', phone: '555-0100' };

const progress = {
  agreedToTermsAt: '2026-01-01T00:00:00.000Z',
  hasSeenWelcome: true,
  totalActiveMs: 987654,
  catalogView: 'grid',
  profile: { company: 'Acme', phone: '555-0199', jobTitle: 'PM', companySize: '11-50', industry: 'Software' },
  orgIds: ['orgA'],
  assessmentResult: {
    tier: 'Lots of Experience', overallPct: 72, overallTotal: 30, overallMax: 42,
    categoryPct: { discovery: 80, strategy: 60 }, assessmentId: 'abc-123',
    submittedAt: '2026-10-05T10:00:00.000Z', firstSubmittedAt: '2026-09-01T10:00:00.000Z', firstOverallPct: 50, firstTier: 'Moderate Experience',
    answers: [{ n: 1, cat: 'discovery', question: 'How do you validate?', answer: 'Interviews', points: 2, secretNote: 'x' }],
    resultCardExpanded: true, somethingElse: 'nope'
  },
  courses: {
    'discovery-novice': {
      completed: [1, 2, 'bad', 3], lastLesson: 3, updatedAt: '2026-10-07T09:00:00.000Z',
      reflections: { l1: 'My private thoughts about my manager' }, template: { field: 'my confidential roadmap' }
    },
    'aiOrg-moderate': { completed: [1], lastLesson: 1, updatedAt: '2026-10-02T09:00:00.000Z' }
  }
};

const s = buildShare(progress, user, membership);
const json = JSON.stringify(s);

console.log('--- privacy: what must never be shared ---');
t('the record has exactly the agreed top-level parts', same(Object.keys(s).sort(), ['assessment', 'courses', 'identity', 'lastActiveAt']), Object.keys(s).join());
t('private course reflections are not in it', json.indexOf('private thoughts') === -1 && json.indexOf('reflections') === -1);
t('saved course templates are not in it', json.indexOf('confidential roadmap') === -1 && json.indexOf('template') === -1);
t('the person\'s phone number is not in it (profile or membership)', json.indexOf('555-0199') === -1 && json.indexOf('555-0100') === -1 && json.indexOf('phone') === -1);
t('profile details (company, job title, size, industry) are not in it', json.indexOf('jobTitle') === -1 && json.indexOf('Software') === -1 && json.indexOf('profile') === -1);
t('time spent, welcome flags and terms date are not in it', json.indexOf('987654') === -1 && json.indexOf('hasSeenWelcome') === -1 && json.indexOf('agreedToTermsAt') === -1 && json.indexOf('catalogView') === -1);
t('unknown extra fields on the assessment or answers are dropped', json.indexOf('somethingElse') === -1 && json.indexOf('resultCardExpanded') === -1 && json.indexOf('secretNote') === -1);
t('a field added to progress in future is NOT shared by default', json.indexOf('orgIds') === -1);

console.log('--- what is shared ---');
t('identity is name and email, email lower-cased', same(s.identity, { name: 'Jane Smith', email: 'jane@acme.com' }), JSON.stringify(s.identity));
t('assessment carries tier, scores, ids and dates', s.assessment.tier === 'Lots of Experience' && s.assessment.overallPct === 72 && s.assessment.overallTotal === 30 &&
  s.assessment.overallMax === 42 && s.assessment.assessmentId === 'abc-123' && s.assessment.firstTier === 'Moderate Experience' && s.assessment.categoryPct.strategy === 60);
t('individual answers are included, with only the agreed fields', same(s.assessment.answers, [{ n: 1, cat: 'discovery', question: 'How do you validate?', answer: 'Interviews', points: 2 }]), JSON.stringify(s.assessment.answers));
t('each course keeps only completed lessons, last lesson and when it was updated',
  same(Object.keys(s.courses['discovery-novice']).sort(), ['completed', 'lastLesson', 'updatedAt']) && same(s.courses['discovery-novice'].completed, [1, 2, 3]) && s.courses['discovery-novice'].lastLesson === 3);
t('both courses are present', Object.keys(s.courses).length === 2 && s.courses['aiOrg-moderate'].completed.length === 1);
t('last active is the most recent of every course update and the assessment date', s.lastActiveAt === '2026-10-07T09:00:00.000Z', s.lastActiveAt);

console.log('--- edge cases ---');
const empty = buildShare({}, { displayName: '', email: 'A@B.com' }, { displayName: 'Fallback' });
t('a brand-new person: no assessment, no courses, no last-active date', empty.assessment === null && same(empty.courses, {}) && empty.lastActiveAt === null);
t('the name falls back to the membership when the account has none', empty.identity.name === 'Fallback' && empty.identity.email === 'a@b.com');
t('null progress and missing membership do not crash', (() => { const x = buildShare(null, { email: 'x@y.com' }, null); return x.identity.name === '' && x.assessment === null; })());
const sparse = buildShare({ courses: { c1: { completed: 'nope' }, c2: null }, assessmentResult: { tier: 'T' } }, user, membership);
t('malformed course data is cleaned, not copied', same(sparse.courses.c1, { completed: [], lastLesson: null, updatedAt: null }) && same(sparse.courses.c2, { completed: [], lastLesson: null, updatedAt: null }));
t('an assessment with only some fields shares only those', same(sparse.assessment, { tier: 'T' }));
t('nothing in a record is undefined (Firestore rejects undefined)', same(JSON.parse(JSON.stringify(sparse)), sparse) && same(JSON.parse(JSON.stringify(s)), s));
t('a very long name is cut to 100 characters', buildShare({}, { displayName: 'n'.repeat(300), email: 'a@b.com' }, null).identity.name.length === 100);
t('an overlong or non-text last-update stamp is ignored', buildShare({ courses: { c: { completed: [1], updatedAt: 12345 } } }, user, membership).courses.c.updatedAt === null);

console.log('--- change detection ---');
t('the same content hashes the same, whatever the key order', shareHash({ a: 1, b: { c: 2, d: 3 } }) === shareHash({ b: { d: 3, c: 2 }, a: 1 }));
t('different content hashes differently', shareHash(s) !== shareHash(buildShare({ ...progress, courses: { ...progress.courses, 'aiOrg-moderate': { completed: [1, 2], lastLesson: 2, updatedAt: '2026-10-08T00:00:00.000Z' } } }, user, membership)));
t('rebuilding from unchanged data gives an identical hash', shareHash(buildShare(progress, user, membership)) === shareHash(s));

console.log('--- which companies to blank on deletion ---');
t('current membership and history are combined without duplicates', same(orgIdsFor({ orgId: 'orgA' }, { orgIds: ['orgB', 'orgA', 'orgC'] }).sort(), ['orgA', 'orgB', 'orgC']));
t('no membership and no history means none', same(orgIdsFor(null, null), []) && same(orgIdsFor({}, {}), []));
t('junk entries are ignored', same(orgIdsFor({ orgId: 5 }, { orgIds: [null, '', 7, 'orgZ'] }), ['orgZ']));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
