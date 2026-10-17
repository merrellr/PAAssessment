/* Pure logic for the "Request more information" form (request-info.html). No
   Firebase and no page code, so it can be tested on its own
   (tests/lead-core.test.mjs).

   The form is a short run of one-question screens. The answers decide how a
   request is scored for Rob (that happens on the server, in apps-script/Code.gs,
   so it cannot be tampered with): the codes below are the ONLY values the server
   accepts, and tests/apps-script/lead-test.html checks the two lists stay equal. */
(function (root) {
  'use strict';

  const NOTIFY_EMAIL = 'rob@productadvisory.co';
  const REPLY_WINDOW = 'within two business days';

  // The online booking page. People who lead a team, represent an organization, or asked for
  // a call are offered "Pick a time" on the thank-you screen. It must start with https://
  // (set it to '' to switch the button off).
  const BOOKING_URL = 'https://calendly.com/productadvisory/30min';

  const OPTIONS = {
    who: [
      { code: 'individual', label: "I'm exploring this for myself", desc: 'A product manager, or on the way to becoming one' },
      { code: 'leader', label: 'I lead a product team', desc: 'Head of product, director or manager' },
      { code: 'org', label: "I'm looking for my organization", desc: 'Assessment, training or tools for several people' },
      { code: 'other', label: 'Something else', desc: 'Coach, consultant, educator, student, press' }
    ],
    interests: [
      { code: 'discovery', label: 'Customer & market discovery' },
      { code: 'strategy', label: 'Product strategy & roadmapping' },
      { code: 'prioritization', label: 'Prioritization & trade-offs' },
      { code: 'execution', label: 'Execution & delivery' },
      { code: 'stakeholder', label: 'Stakeholder communication' },
      { code: 'aiIndividual', label: 'AI fluency for me' },
      { code: 'aiOrg', label: 'AI fluency for my organization' },
      { code: 'toolkits', label: 'Toolkits & templates' },
      { code: 'team_assessment', label: 'Assessing my whole team' },
      { code: 'notsure', label: 'Not sure yet' }
    ],
    size: [
      { code: 'just_me', label: 'Just me' },
      { code: 's2_10', label: '2 to 10 people' },
      { code: 's11_50', label: '11 to 50 people' },
      { code: 's51_200', label: '51 to 200 people' },
      { code: 's200_plus', label: 'More than 200' }
    ],
    timeline: [
      { code: 'this_month', label: 'This month', desc: 'I have a need right now' },
      { code: 'this_quarter', label: 'In the next 3 months' },
      { code: 'later', label: 'Later this year' },
      { code: 'exploring', label: 'Just exploring', desc: 'No deadline' }
    ],
    role: [
      { code: 'decide', label: 'I make the decision' },
      { code: 'influence', label: 'I influence the decision' },
      { code: 'approval', label: 'I need approval from someone else' },
      { code: 'unsure', label: 'Not sure yet' }
    ],
    contact: [
      { code: 'email', label: 'Email me' },
      { code: 'call', label: 'A short call is fine' }
    ]
  };

  const MAX_INTERESTS = 3;
  const LIMITS = { name: 80, email: 120, company: 80, phone: 40, message: 400 };
  const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

  const codesOf = (key) => OPTIONS[key].map(o => o.code);
  const labelOf = (key, code) => { const o = OPTIONS[key].find(x => x.code === code); return o ? o.label : ''; };

  function emptyState() {
    return { who: '', interests: [], size: '', timeline: '', role: '', message: '', contactPref: 'email',
      name: '', email: '', company: '', phone: '', shareAssessment: false, consent: false };
  }

  // Which screens this person sees, in order. A person exploring for themselves
  // is not asked about team size or who decides.
  function stepsFor(state) {
    const steps = ['who', 'interests'];
    if (state.who !== 'individual') steps.push('size');
    steps.push('timeline');
    if (state.who === 'leader' || state.who === 'org') steps.push('role');
    steps.push('message', 'contact');
    return steps;
  }

  // Up to 3 choices. "Not sure yet" stands alone: picking it clears the rest,
  // and picking anything else clears it.
  function toggleInterest(state, code) {
    if (codesOf('interests').indexOf(code) === -1) return state;
    let next;
    if (state.interests.indexOf(code) > -1) {
      next = state.interests.filter(c => c !== code);
    } else if (code === 'notsure') {
      next = ['notsure'];
    } else {
      next = state.interests.filter(c => c !== 'notsure');
      if (next.length >= MAX_INTERESTS) return state;
      next.push(code);
    }
    return Object.assign({}, state, { interests: next });
  }

  function clean(s, max) {
    return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  // Returns the problem to show for a screen, or '' when it can move on.
  function validateStep(id, state) {
    switch (id) {
      case 'who': return state.who ? '' : 'Choose the one that fits best.';
      case 'interests': return state.interests.length ? '' : 'Pick at least one, or choose "Not sure yet".';
      case 'size': return state.size ? '' : 'Choose a size, even a rough one.';
      case 'timeline': return state.timeline ? '' : 'Choose when you would like to start.';
      case 'role': return state.role ? '' : 'Choose the one that fits best.';
      case 'message': return clean(state.message, 2000).length > LIMITS.message ? 'Please keep it under ' + LIMITS.message + ' characters.' : '';
      case 'contact': {
        if (!clean(state.name, LIMITS.name)) return 'Enter your name.';
        const email = clean(state.email, LIMITS.email);
        if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
        if ((state.who === 'leader' || state.who === 'org') && !clean(state.company, LIMITS.company)) return 'Enter your company or organization.';
        if (clean(state.phone, 100).length > LIMITS.phone) return 'Keep the phone number under ' + LIMITS.phone + ' characters.';
        if (!state.consent) return 'Please tick the box so we can reply to you.';
        return '';
      }
      default: return '';
    }
  }

  function newLeadId() {
    const bytes = new Uint8Array(12);
    (root.crypto || root.msCrypto).getRandomValues(bytes);
    return Array.prototype.map.call(bytes, b => ('0' + b.toString(16)).slice(-2)).join('');
  }

  function readSource(search) {
    const v = new URLSearchParams(search || '').get('src') || '';
    return /^[a-z0-9_-]{1,30}$/i.test(v) ? v.toLowerCase() : '';
  }

  // ?call=1 (the "Schedule a call" button) starts the form with "a short call is fine" chosen.
  function readCall(search) {
    return new URLSearchParams(search || '').get('call') === '1';
  }

  function readWho(search) {
    const v = new URLSearchParams(search || '').get('who') || '';
    return codesOf('who').indexOf(v) > -1 ? v : '';
  }

  // What is sent to the server. assessment is only passed when the person ticked
  // the box to share it.
  function buildPayload(state, meta) {
    const p = {
      action: 'requestInfo',
      id: meta.id,
      elapsedMs: Math.max(0, Math.round(meta.elapsedMs || 0)),
      website: '',                                   // a hidden field real people never fill in
      source: meta.source || '',
      who: state.who,
      interests: state.interests.slice(0, MAX_INTERESTS),
      size: state.who === 'individual' ? '' : state.size,
      timeline: state.timeline,
      role: (state.who === 'leader' || state.who === 'org') ? state.role : '',
      message: clean(state.message, LIMITS.message),
      contactPref: state.contactPref === 'call' ? 'call' : 'email',
      name: clean(state.name, LIMITS.name),
      email: clean(state.email, LIMITS.email).toLowerCase(),
      company: clean(state.company, LIMITS.company),
      phone: clean(state.phone, LIMITS.phone),
      consent: state.consent === true
    };
    if (meta.assessment && typeof meta.assessment === 'object') {
      const a = meta.assessment;
      p.assessment = { tier: clean(a.tier, 40), overallPct: Number(a.overallPct) || 0, categoryPct: {} };
      Object.keys(a.categoryPct || {}).forEach(k => {
        if (codesOf('interests').indexOf(k) > -1 && k !== 'toolkits' && k !== 'team_assessment' && k !== 'notsure') p.assessment.categoryPct[k] = Math.round(Number(a.categoryPct[k]) || 0);
      });
    }
    return p;
  }

  // The same answers as plain text, for the "email us instead" fallback.
  function summaryText(state) {
    const lines = [];
    lines.push('Name: ' + clean(state.name, LIMITS.name));
    lines.push('Email: ' + clean(state.email, LIMITS.email));
    if (clean(state.company, LIMITS.company)) lines.push('Company: ' + clean(state.company, LIMITS.company));
    lines.push('I am: ' + labelOf('who', state.who));
    lines.push('Interested in: ' + state.interests.map(c => labelOf('interests', c)).join(', '));
    if (state.size && state.who !== 'individual') lines.push('Team size: ' + labelOf('size', state.size));
    lines.push('Timeline: ' + labelOf('timeline', state.timeline));
    if (state.role && (state.who === 'leader' || state.who === 'org')) lines.push('Decision: ' + labelOf('role', state.role));
    if (clean(state.message, LIMITS.message)) lines.push('Message: ' + clean(state.message, LIMITS.message));
    return lines.join('\n');
  }

  function mailtoFallback(state) {
    const subject = 'Request for more information' + (clean(state.company, LIMITS.company) ? ' - ' + clean(state.company, LIMITS.company) : '');
    return 'mailto:' + NOTIFY_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summaryText(state)).slice(0, 1500);
  }

  // The screen shown after a successful send.
  function thankYou(state, bookingUrl) {
    const first = clean(state.name, LIMITS.name).split(' ')[0] || 'there';
    const email = clean(state.email, LIMITS.email).toLowerCase();
    const url = bookingUrl === undefined ? BOOKING_URL : bookingUrl;
    const book = /^https:\/\//.test(url || '') && (state.who === 'leader' || state.who === 'org' || state.contactPref === 'call')
      ? { label: 'Pick a time that suits you', href: url } : null;
    if (state.who === 'leader' || state.who === 'org') {
      return {
        book: book,
        title: 'Thanks, ' + first + '. We have your request.',
        text: 'Rob will reply to ' + email + ' ' + REPLY_WINDOW + '. While you wait, taking the free assessment yourself is the quickest way to see what your team would experience.',
        cta: { label: 'Take the free assessment', href: 'index.html' },
        second: { label: 'Vote on the next toolkit', href: 'tool-requests.html' }
      };
    }
    return {
      book: book,
      title: 'Thanks, ' + first + '. We have your note.',
      text: 'We will reply to ' + email + ' ' + REPLY_WINDOW + '. In the meantime, the free assessment shows your level across seven product skill areas and gives you a course plan to match.',
      cta: { label: 'Take the free assessment', href: 'index.html' },
      second: { label: 'Vote on the next toolkit', href: 'tool-requests.html' }
    };
  }

  root.LeadCore = {
    NOTIFY_EMAIL, REPLY_WINDOW, BOOKING_URL, OPTIONS, MAX_INTERESTS, LIMITS, EMAIL_RE,
    codesOf, labelOf, emptyState, stepsFor, toggleInterest, clean, validateStep, newLeadId, readSource, readWho, readCall,
    buildPayload, summaryText, mailtoFallback, thankYou
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
