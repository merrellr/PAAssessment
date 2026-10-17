// Tests for lead-core.js (the "Request more information" form's logic).
// Run:  node --experimental-default-type=module tests/lead-core.test.mjs
import '../lead-core.js';

const L = globalThis.LeadCore;
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const withState = (over) => Object.assign(L.emptyState(), over);

console.log('--- the contact address ---');
t('people are told to email info@ when the form cannot send', L.CONTACT_EMAIL === 'info@productadvisory.co');

console.log('--- the screens each person sees ---');
t('someone exploring for themselves skips team size and who-decides', same(L.stepsFor(withState({ who: 'individual' })), ['who', 'interests', 'timeline', 'message', 'contact']));
t('a team leader sees both', same(L.stepsFor(withState({ who: 'leader' })), ['who', 'interests', 'size', 'timeline', 'role', 'message', 'contact']));
t('an organization sees both', same(L.stepsFor(withState({ who: 'org' })), ['who', 'interests', 'size', 'timeline', 'role', 'message', 'contact']));
t('"something else" sees size but not who-decides', same(L.stepsFor(withState({ who: 'other' })), ['who', 'interests', 'size', 'timeline', 'message', 'contact']));
t('before they answer, the first screen is "who"', L.stepsFor(L.emptyState())[0] === 'who');

console.log('--- picking interests ---');
{
  let s = L.emptyState();
  s = L.toggleInterest(s, 'discovery'); s = L.toggleInterest(s, 'strategy'); s = L.toggleInterest(s, 'aiOrg');
  t('up to three', same(s.interests, ['discovery', 'strategy', 'aiOrg']));
  t('a fourth is ignored', same(L.toggleInterest(s, 'execution').interests, ['discovery', 'strategy', 'aiOrg']));
  t('picking again removes it', same(L.toggleInterest(s, 'strategy').interests, ['discovery', 'aiOrg']));
  t('"Not sure yet" replaces the rest', same(L.toggleInterest(s, 'notsure').interests, ['notsure']));
  t('and a specific choice replaces "Not sure yet"', same(L.toggleInterest(L.toggleInterest(L.emptyState(), 'notsure'), 'toolkits').interests, ['toolkits']));
  t('an unknown choice is ignored', same(L.toggleInterest(L.emptyState(), 'hacker').interests, []));
  t('the original state is never changed', same(s.interests, ['discovery', 'strategy', 'aiOrg']));
}

console.log('--- checking each screen ---');
{
  t('who is required', L.validateStep('who', L.emptyState()) !== '' && L.validateStep('who', withState({ who: 'org' })) === '');
  t('at least one interest', L.validateStep('interests', L.emptyState()) !== '' && L.validateStep('interests', withState({ interests: ['notsure'] })) === '');
  t('size, timeline and role are required when asked', L.validateStep('size', L.emptyState()) !== '' && L.validateStep('timeline', L.emptyState()) !== '' && L.validateStep('role', L.emptyState()) !== '');
  t('the message is optional but capped', L.validateStep('message', L.emptyState()) === '' && L.validateStep('message', withState({ message: 'x'.repeat(401) })) !== '');
  const good = withState({ who: 'org', name: 'Jane Smith', email: 'jane@acme.com', company: 'Acme', consent: true });
  t('a complete contact screen passes', L.validateStep('contact', good) === '');
  t('a name is required', L.validateStep('contact', Object.assign({}, good, { name: ' ' })) !== '');
  t('a valid email is required', ['', 'jane', 'jane@', 'jane@acme', 'a b@c.com'].every(e => L.validateStep('contact', Object.assign({}, good, { email: e })) !== ''));
  t('a company is required for leaders and organizations only', L.validateStep('contact', Object.assign({}, good, { company: '' })) !== '' && L.validateStep('contact', Object.assign({}, good, { who: 'individual', company: '' })) === '');
  t('the consent box must be ticked', L.validateStep('contact', Object.assign({}, good, { consent: false })) !== '');
}

console.log('--- what is sent ---');
{
  const s = withState({ who: 'individual', interests: ['discovery'], size: 's51_200', timeline: 'this_month', role: 'decide', message: '  Hello\n\tthere  ', contactPref: 'call',
    name: ' Pat  Lee ', email: ' Pat@Example.COM ', company: 'Acme', phone: '555', consent: true });
  const p = L.buildPayload(s, { id: 'abc123', elapsedMs: 12345.6, source: 'toolkits' });
  t('it names the action and carries the id and source', p.action === 'requestInfo' && p.id === 'abc123' && p.source === 'toolkits');
  t('the hidden trap field is always empty', p.website === '');
  t('the email is lower-cased and the text is tidied', p.email === 'pat@example.com' && p.name === 'Pat Lee' && p.message === 'Hello there');
  t('an individual sends no team size or decision role, even if the state still holds old ones', p.size === '' && p.role === '');
  t('an organization does send them', (() => { const q = L.buildPayload(withState({ who: 'org', size: 's11_50', role: 'influence', interests: ['aiOrg'], timeline: 'later', name: 'A', email: 'a@b.co', consent: true }), { id: 'x' }); return q.size === 's11_50' && q.role === 'influence'; })());
  t('the time taken is a whole number', p.elapsedMs === 12346);
  t('consent is sent as a real true', p.consent === true && L.buildPayload(withState({ consent: 'yes' }), { id: 'x' }).consent === false);
  t('no assessment is sent unless one is passed in', !('assessment' in p));
  const withA = L.buildPayload(s, { id: 'x', assessment: { tier: 'Moderate Experience', overallPct: 41.6, categoryPct: { discovery: 80.4, strategy: 20, evil: 99, toolkits: 5 } } });
  t('an assessment keeps its level and only the seven real skill areas', withA.assessment.tier === 'Moderate Experience' && withA.assessment.overallPct === 41.6 && same(withA.assessment.categoryPct, { discovery: 80, strategy: 20 }), JSON.stringify(withA.assessment));
  t('very long text is cut to the limits the server enforces', L.buildPayload(withState({ name: 'n'.repeat(500), message: 'm'.repeat(900) }), { id: 'x' }).name.length === 80 && L.buildPayload(withState({ message: 'm'.repeat(900) }), { id: 'x' }).message.length === 400);
  t('at most three interests are sent', L.buildPayload(withState({ interests: ['discovery', 'strategy', 'aiOrg', 'execution'] }), { id: 'x' }).interests.length === 3);
}

console.log('--- phone numbers ---');
{
  const f = L.formatPhone;
  t('ten digits become (222) 123-1234', f('2221231234') === '(222) 123-1234');
  t('it is laid out step by step while typing', f('2') === '(2' && f('222') === '(222' && f('2221') === '(222) 1' && f('222123') === '(222) 123' && f('2221231') === '(222) 123-1');
  t('already-formatted numbers stay the same', f('(222) 123-1234') === '(222) 123-1234');
  t('dashes, dots and spaces are tidied', f('222-123-1234') === '(222) 123-1234' && f('222.123.1234') === '(222) 123-1234' && f('222 123 1234') === '(222) 123-1234');
  t('a leading 1 is dropped when it makes 11 digits', f('1 222 123 1234') === '(222) 123-1234' && f('+1 (222) 123-1234').indexOf('+1') === 0);
  t('extra digits past ten are ignored', f('222123123499') === '(222) 123-1234');
  t('letters are ignored', f('abc222def') === '(222');
  t('an extension is kept', f('2221231234 x55') === '(222) 123-1234 x55' && f('(222) 123-1234 ext. 7') === '(222) 123-1234 x7');
  t('an extension is not added to an unfinished number', f('222 x5') === '(222');
  t('an international number is only tidied, not forced into the US layout', f('+44 20 7946 0958') === '+44 20 7946 0958' && f('+44  20   7946') === '+44 20 7946');
  t('empty stays empty', f('') === '' && f(null) === '' && f(undefined) === '');
  t('the number that is sent is formatted', L.buildPayload(withState({ phone: '2221231234' }), { id: 'x' }).phone === '(222) 123-1234');
  t('and stays within the 40-character limit', L.formatPhone('+' + '1'.repeat(100)).length <= 40);
}

console.log('--- ids and links from the address ---');
{
  const a = L.newLeadId(), b = L.newLeadId();
  t('an id is 24 hex characters and each is different', /^[0-9a-f]{24}$/.test(a) && a !== b);
  t('the source label comes from ?src= and is cleaned', L.readSource('?src=Toolkits') === 'toolkits' && L.readSource('?src=a b') === '' && L.readSource('?src=<script>') === '' && L.readSource('') === '');
  t('?who= can start someone past the first question, only for real answers', L.readWho('?who=org') === 'org' && L.readWho('?who=hacker') === '' && L.readWho('') === '');
}

console.log('--- the fallback and the thank-you ---');
{
  const s = withState({ who: 'org', interests: ['aiOrg', 'toolkits'], size: 's11_50', timeline: 'later', role: 'influence', message: 'Need help', name: 'Jane Smith', email: 'jane@acme.com', company: 'Acme' });
  const m = L.mailtoFallback(s);
  t('the email-us link goes to info@ with the answers filled in', m.indexOf('mailto:info@productadvisory.co?subject=') === 0 && decodeURIComponent(m).indexOf('Acme') > -1 && decodeURIComponent(m).indexOf('AI fluency for my organization') > -1 && decodeURIComponent(m).indexOf('Need help') > -1);
  t('the text summary reads in plain words', /I am: I'm looking for my organization/.test(L.summaryText(s)) && /Team size: 11 to 50 people/.test(L.summaryText(s)));
  const ty = L.thankYou(s);
  t('a company contact is told Rob will reply, and is offered the assessment', /Thanks, Jane/.test(ty.title) && /Rob will reply to jane@acme\.com within two business days/.test(ty.text) && ty.cta.href === 'index.html');
  const ti = L.thankYou(withState({ who: 'individual', name: 'Pat', email: 'pat@x.com' }));
  t('an individual is pointed to the free assessment', /Thanks, Pat/.test(ti.title) && /We will reply to pat@x\.com/.test(ti.text) && ti.cta.href === 'index.html');
  t('both get a second link to the Tool Roadmap', ty.second.href === 'tool-requests.html' && ti.second.href === 'tool-requests.html');
}

console.log('--- the booking link and the call button ---');
{
  const org = withState({ who: 'org', name: 'Jane', email: 'Jane@Acme.com' });
  t('the booking page is Rob\'s Calendly 30-minute call', L.BOOKING_URL === 'https://calendly.com/productadvisory/30min');
  t('an organization is offered it on the thank-you screen', L.thankYou(org).book.href === L.BOOKING_URL && /Pick a time/.test(L.thankYou(org).book.label));
  t('setting the link to nothing switches the button off', L.thankYou(org, '').book === null);
  t('an individual who did not ask for a call is not offered it', L.thankYou(withState({ who: 'individual', name: 'A', email: 'a@b.co' })).book === null);
  t('a link is offered to an organization once set', L.thankYou(org, 'https://calendar.example.com/rob').book.href === 'https://calendar.example.com/rob');
  t('and to a team leader', !!L.thankYou(withState({ who: 'leader', name: 'A', email: 'a@b.co' }), 'https://calendar.example.com/rob').book);
  t('and to an individual who asked for a call', !!L.thankYou(withState({ who: 'individual', contactPref: 'call', name: 'A', email: 'a@b.co' }), 'https://calendar.example.com/rob').book);
  t('but not to an individual who did not', L.thankYou(withState({ who: 'individual', name: 'A', email: 'a@b.co' }), 'https://calendar.example.com/rob').book === null);
  t('a link that is not https is never offered', L.thankYou(org, 'http://insecure.example.com').book === null && L.thankYou(org, 'javascript:alert(1)').book === null);
  t('?call=1 is the only thing that starts the form on a call', L.readCall('?call=1') === true && L.readCall('?call=yes') === false && L.readCall('') === false);
  t('the thank-you shows the email in lower case, as it was sent', /jane@acme\.com/.test(L.thankYou(org).text));
}

console.log('--- every list has distinct, web-safe codes ---');
Object.keys(L.OPTIONS).forEach(k => t(k + ' options are distinct and plain', new Set(L.codesOf(k)).size === L.OPTIONS[k].length && L.codesOf(k).every(c => /^[a-zA-Z0-9_]+$/.test(c))));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
