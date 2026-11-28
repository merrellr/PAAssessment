// styles-core.js: DISC Work Styles (work-styles.html), with no DOM. Based on William Moulton Marston's public DISC
// model (Emotions of Normal People, 1928): four styles along two lines, pace (fast or measured) and focus (tasks or
// people). The situations, scoring, report text and pictures are Product Advisory's own. It describes how someone
// prefers to work, not how good they are, and is not for hiring or selection.
//   24 product-team situations, four responses each (one per style). For each, the person picks the response most
//   like them and the one least like them: +1 and -1 to those styles. Each style's total (-24 to 24) becomes 0-100.
// Tests: tests/styles-core.test.mjs.
(function (root) {
  var KEYS = ['d', 'i', 's', 'c'];
  var STYLES = {
    d: { letter: 'D', name: 'Dominance', short: 'Direct and results-first', pace: 'fast', focus: 'tasks', color: '#d4552f',
      best: 'You set a clear goal, make the call and keep things moving. You are at your best with a hard target, room to decide how to hit it, and problems other people find daunting.',
      drains: 'Slow decisions, long meetings that end without an owner, and being micromanaged.',
      withYou: 'Lead with the point and the decision needed. Bring options, not just problems. Agree the goal, then give room on the how.',
      watch: 'Speed can leave people behind. Pause to check who has not spoken before you close a decision, and say why, not just what.',
      work: [['Standups', 'Done, next, blocked: short and useful. Make room for the person who needs longer.'],
        ['Roadmap debates', 'You push the team to choose. Name the trade-off you are making so it can be revisited.'],
        ['Stakeholders', 'Executives like your clarity. Partners who need context may read it as abrupt: add one line of why.']] },
    i: { letter: 'I', name: 'Influence', short: 'Energising and people-first', pace: 'fast', focus: 'people', color: '#e3a21a',
      best: 'You bring people together, sell the vision and keep energy up. You are at your best meeting new people, starting things and turning a group into a team.',
      drains: 'Working alone for long stretches, heavy detail with no story, and cold, purely transactional settings.',
      withYou: 'Talk it through before you write it down. Share the why and who it helps. Recognise the contribution, out loud.',
      watch: 'Enthusiasm can outrun follow-through. Write down the owner and date before the meeting ends, and check the numbers behind the story.',
      work: [['Standups', 'You lift the room. Keep the update to what changed and what you need.'],
        ['Roadmap debates', 'You paint where an idea could go. Pair it with the evidence the careful people in the room will ask for.'],
        ['Stakeholders', 'You build relationships fast. Follow up in writing so the agreement outlasts the conversation.']] },
    s: { letter: 'S', name: 'Steadiness', short: 'Steady and team-first', pace: 'measured', focus: 'people', color: '#2e9a6a',
      best: 'You keep the team steady, look after people and see work through. You are at your best with a clear plan, a team you trust and time to do things properly.',
      drains: 'Sudden changes without warning, conflict left hanging, and being rushed into commitments.',
      withYou: 'Give notice of change and explain how it affects people. Ask for their view one to one. Agree realistic dates together.',
      watch: 'Keeping the peace can mean saying yes too often. Name your concern early, even when it is uncomfortable.',
      work: [['Standups', 'You notice who is stuck. Say so, and offer help, in the meeting.'],
        ['Roadmap debates', 'You make sure quieter voices are heard. State your own preference too; the team needs it.'],
        ['Stakeholders', 'People trust you. Practise saying "not this quarter" kindly but clearly.']] },
    c: { letter: 'C', name: 'Conscientiousness', short: 'Careful and quality-first', pace: 'measured', focus: 'tasks', color: '#2f7fc4',
      best: 'You get it right: the details, the evidence and the edge cases. You are at your best with a complex problem, time to think and clear standards.',
      drains: 'Vague requests, decisions made on opinion alone, and sloppy work you will have to clean up.',
      withYou: 'Send the detail before the meeting. Be precise about what is decided and what is open. Give time to think before asking for a view.',
      watch: 'Waiting for certainty can slow the team. Say how confident you are, and what would change your mind, so others can move.',
      work: [['Standups', 'Precise and honest. Lead with the one thing that matters most; detail can follow in writing.'],
        ['Roadmap debates', 'You ask for the evidence. Offer your best call too, with how sure you are.'],
        ['Stakeholders', 'Your rigour builds trust. Start with the conclusion, then the reasoning.']] }
  };

  // [situation, D, I, S, C]
  var RAW = [
    ['A launch date is at risk.', 'Decide what to cut and tell everyone today.', 'Get the team together and rally them around a new plan.', 'Check with each person what they can realistically take on.', 'Work out exactly where the time went before changing the plan.'],
    ['A new stakeholder joins your project.', 'Tell them the goal and what you need from them.', 'Get to know them and what excites them about the work.', 'Walk them through how the team works so they feel settled.', 'Send them the background and the decisions made so far.'],
    ['In a roadmap debate, you are most likely to…', 'Push for a decision so the team can move.', 'Describe where this could take the product.', 'Make sure the quieter voices are heard first.', 'Ask what evidence supports each option.'],
    ['Your ideal week has…', 'A hard goal and the freedom to hit it your way.', 'Lots of conversations and new ideas.', 'A steady rhythm with few surprises.', 'Time to go deep on one problem without interruptions.'],
    ['The feedback you would most like to hear is…', '“You got it done.”', '“You brought everyone along.”', '“We could count on you.”', '“That was thorough and right.”'],
    ['A customer complains.', 'Fix it fast and move on.', 'Call them and win them back.', 'Make sure they feel heard and looked after.', 'Find the root cause so it does not happen again.'],
    ['Writing a spec, you…', 'Keep it short: the goal, the must-haves, the date.', 'Lead with the user’s story and why it matters.', 'Write it with the team so everyone owns it.', 'Cover the edge cases, the acceptance criteria and the open questions.'],
    ['A teammate disagrees with you in a meeting.', 'Say plainly where you stand and why.', 'Find the part you both like and build on it.', 'Take it offline so nobody is put on the spot.', 'Compare the facts behind each view.'],
    ['Under pressure, you tend to…', 'Take charge.', 'Talk it through with others.', 'Keep calm and keep things steady.', 'Double-check everything.'],
    ['A reorganisation is announced.', 'Work out what it means for your goals, and act.', 'See a chance to meet new people and ideas.', 'Want to understand how it affects the team first.', 'Want the details and the reasoning before you accept it.'],
    ['Your standup update is usually…', 'What is done and what is blocking you.', 'The highlight, with some energy.', 'How the team is doing and where you can help.', 'Precise status, with numbers.'],
    ['Choosing a new tool for the team, you…', 'Pick one quickly and switch.', 'Pick the one people will enjoy using.', 'Pick the one that disrupts the team least.', 'Compare the options against clear criteria.'],
    ['What frustrates you most?', 'Slow decisions.', 'Being left out of the conversation.', 'Sudden changes without warning.', 'Vague answers and sloppy work.'],
    ['Presenting to executives, you…', 'Lead with the recommendation and the ask.', 'Tell a story they will remember.', 'Make sure the team is aligned and credited first.', 'Bring the data and prepare for every question.'],
    ['Sales brings a new idea from a customer.', 'Decide quickly whether it is worth doing.', 'Get excited about the possibilities and share it.', 'Think about how it lands with current customers and the team.', 'Ask for the data behind it.'],
    ['You feel most at home…', 'Leading a turnaround.', 'Running a kickoff workshop.', 'Supporting a long-standing team.', 'Untangling a complex problem.'],
    ['A deadline is…', 'A challenge to beat.', 'Fine, as long as the work stays enjoyable.', 'Best when it is realistic and agreed together.', 'Set once the work is properly understood.'],
    ['In a retrospective, you…', 'Push for one change and an owner.', 'Keep the energy up and celebrate the wins.', 'Make sure it feels safe to speak up.', 'Look at what the data says happened.'],
    ['Starting a new job, you…', 'Look for a quick win.', 'Meet as many people as you can.', 'Learn how things are done before changing them.', 'Read everything you can find.'],
    ['Risk is…', 'Worth taking when the prize is big.', 'Fine if people are behind it.', 'Best kept small and planned for.', 'Something to measure before deciding.'],
    ['A teammate is struggling.', 'Help them focus on what matters most.', 'Encourage them and lift their spirits.', 'Offer to take something off their plate.', 'Help them break the problem into steps.'],
    ['Your messages tend to be…', 'Short and to the point.', 'Friendly and upbeat.', 'Warm and considerate.', 'Detailed and carefully worded.'],
    ['Success, to you, means…', 'Achieving the result you set out for.', 'Being recognised and enjoying the ride.', 'A team that works well together.', 'Getting it right.'],
    ['Planning a quarter, you…', 'Set ambitious targets.', 'Pull the team’s ideas into a shared vision.', 'Plan around what the team can sustain.', 'Plan from data and capacity estimates.']
  ];
  // a small seeded random number generator (mulberry32), so the order is fixed but well mixed
  function mulberry(a) { return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  // Each question's four responses in a fixed shuffled order (the same for everyone), so D is not always first
  var QUESTIONS = RAW.map(function (r, n) {
    var id = 'ws' + (n + 1), opts = KEYS.map(function (k, j) { return { k: k, t: r[j + 1] }; }), rand = mulberry(hash(id + ':disc'));
    for (var i = opts.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp; }
    return { id: id, q: r[0], o: opts };
  });
  var BY_Q = {}; QUESTIONS.forEach(function (q) { BY_Q[q.id] = q; });

  // answers: { qid: { most: 'd', least: 's' } } → { raw, scores (0-100), primary, secondary, blend, answered, complete }
  function score(answers) {
    var raw = { d: 0, i: 0, s: 0, c: 0 }, n = 0;
    Object.keys(answers || {}).forEach(function (id) {
      var a = answers[id]; if (!BY_Q[id] || !a || KEYS.indexOf(a.most) < 0 || KEYS.indexOf(a.least) < 0 || a.most === a.least) return;
      raw[a.most]++; raw[a.least]--; n++;
    });
    var scores = {}; KEYS.forEach(function (k) { scores[k] = n ? Math.round((raw[k] + n) / (2 * n) * 100) : 0; });
    var order = KEYS.slice().sort(function (a, b) { return scores[b] - scores[a] || KEYS.indexOf(a) - KEYS.indexOf(b); });
    var primary = n ? order[0] : '', second = order[1];
    // a second style counts when it is clearly above the middle and close to the first
    var secondary = n && scores[second] >= 55 && scores[order[0]] - scores[second] <= 15 ? second : '';
    return { raw: raw, scores: scores, primary: primary, secondary: secondary, blend: primary ? STYLES[primary].letter + (secondary ? STYLES[secondary].letter.toLowerCase() : '') : '',
      answered: n, complete: n === QUESTIONS.length };
  }
  // Where the scores sit on the two lines, each -1 to 1: x from tasks (-1) to people (1), y from measured (-1) to fast (1).
  // Only the styles above the middle (50) pull: each towards its own corner, as hard as it is above 50. So one strong
  // style sits deep in its corner, two equal styles sit on the line between them, and an even spread sits in the middle.
  var CORNER = { d: [-1, 1], i: [1, 1], s: [1, -1], c: [-1, -1] };
  function position(scores) {
    var s = scores || {}, w = {}, sum = 0;
    KEYS.forEach(function (k) { w[k] = Math.max(0, (s[k] || 0) - 50); sum += w[k]; });
    if (!sum) return { x: 0, y: 0 };
    var x = 0, y = 0;
    KEYS.forEach(function (k) { x += w[k] * CORNER[k][0]; y += w[k] * CORNER[k][1]; });
    var strength = Math.min(1, sum / 50);
    return { x: Math.max(-1, Math.min(1, x / sum * strength)), y: Math.max(-1, Math.min(1, y / sum * strength)) };
  }
  function label(result) {
    if (!result || !result.primary) return '';
    var p = STYLES[result.primary], s = result.secondary ? STYLES[result.secondary] : null;
    return p.name + (s ? ' with ' + s.name : '');
  }
  // What it means where two styles meet (a blend, or working together)
  var PAIRS = {
    di: 'Fast-moving and persuasive: you set direction and bring people with you.', dc: 'Exacting and decisive: high standards, and you act on them.',
    ds: 'Determined and dependable: you push for results without leaving the team behind.', is: 'Warm and encouraging: people feel included and supported around you.',
    ic: 'Imaginative and precise: ideas with the detail to make them real.', sc: 'Calm and thorough: steady, careful work people can rely on.'
  };
  // Two people with different styles, working together
  var TOGETHER = {
    di: 'You both move fast. Decide who follows up and who checks the numbers.',
    dc: 'You both care about the result: one wants speed, the other certainty. Agree how sure is sure enough.',
    ds: 'One pushes, the other steadies. Give change early notice and agree realistic dates together.',
    ic: 'One brings energy, the other rigour. Share the story and the evidence side by side.',
    is: 'You both care about people. Make sure someone names the hard call.',
    sc: 'You both like to do things properly. Set a decision date so care does not become delay.'
  };
  // What a team may miss when no one in it leans to a style (for the team balance)
  var MISSING = {
    d: 'Decisions may wait for everyone to agree. Name an owner for each call and a date to make it.',
    i: 'Good work may not get sold beyond the team. Plan who tells the story, and to whom.',
    s: 'The pace may outrun the people. Check workload before adding more, and give change some notice.',
    c: 'Details and risks may slip through. Add a review step for anything hard to undo.'
  };
  // A group's balance: how many lean to each style (by main style), the styles no one leans to, and the most common
  function balance(people) {
    var counts = { d: 0, i: 0, s: 0, c: 0 }, n = 0;
    (people || []).forEach(function (p) { if (p && KEYS.indexOf(p.primary) > -1) { counts[p.primary]++; n++; } });
    var missing = KEYS.filter(function (k) { return n >= 3 && !counts[k]; });
    var top = KEYS.slice().sort(function (a, b) { return counts[b] - counts[a]; })[0];
    return { counts: counts, n: n, missing: missing, top: n && counts[top] / n >= 0.5 ? top : '' };
  }
  function pairKey(a, b) { return [a, b].sort(function (x, y) { return KEYS.indexOf(x) - KEYS.indexOf(y); }).join(''); }
  function blendText(result) { return result && result.secondary ? PAIRS[pairKey(result.primary, result.secondary)] : ''; }

  // Clean what is saved on the learner's progress (progress.workStyle)
  function toSave(answers, nowIso) {
    var r = score(answers), clean = {};
    Object.keys(answers || {}).forEach(function (id) { var a = answers[id]; if (BY_Q[id] && a && KEYS.indexOf(a.most) > -1 && KEYS.indexOf(a.least) > -1 && a.most !== a.least) clean[id] = { most: a.most, least: a.least }; });
    return { answers: clean, scores: r.scores, primary: r.primary, secondary: r.secondary, complete: r.complete, at: nowIso || new Date().toISOString() };
  }

  root.StylesCore = { KEYS: KEYS, STYLES: STYLES, QUESTIONS: QUESTIONS, PAIRS: PAIRS, score: score, position: position, label: label,
    blendText: blendText, pairKey: pairKey, TOGETHER: TOGETHER, MISSING: MISSING, balance: balance, toSave: toSave, MINUTES: 8 };
})(typeof window !== 'undefined' ? window : globalThis);
