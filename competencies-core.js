// competencies-core.js: the competency model under the seven skill areas. 28 competencies (four per area), each with
// what it looks like at the four levels (Limited, Moderate, Lots of and Advanced Experience, the same levels as the
// courses and role targets), and which lessons build it. A practice question counts toward its lesson's
// competencies. No DOM. Reviewed as docs/competency-model.md (tools/build-competency-doc.mjs writes it from here);
// tests/competencies-core.test.mjs checks every lesson is tagged and every competency has enough behind it.
(function (root) {
  // [key, area, name, what it is, [Limited, Moderate, Lots of, Advanced]]
  var C = [
    // ---------------------------------------------------------------- Customer & Market Discovery
    ['d.framing', 'discovery', 'Problem framing', 'Turning a vague request or idea into a clear problem worth solving, for a specific person.',
      ['Writes a problem statement when asked; it still leans toward a solution.', 'Frames problems around a specific user and outcome before discussing solutions.', 'Reframes requests from leaders and customers into the underlying problem, and gets agreement on it.', 'Sets how the organization frames problems, including the ethical stakes, and coaches others to do it.']],
    ['d.research', 'discovery', 'Customer research', 'Learning from customers directly: interviews, observation and feedback that changes decisions.',
      ['Joins customer conversations and takes good notes.', 'Plans and runs interviews and turns feedback into themes the team acts on.', 'Runs ongoing research and closes the loop with customers; feedback visibly shapes the roadmap.', 'Builds research into the organization’s habits (systems, not sprints) and raises the team’s empathy.']],
    ['d.validate', 'discovery', 'Validation & experiments', 'Testing the riskiest assumptions cheaply before committing to build.',
      ['Knows an idea should be tested; tests happen after building.', 'Runs simple tests (prototypes, fake doors, pilots) before building.', 'Designs pilots with clear success criteria, including integration and compliance realities.', 'Makes evidence the norm before investment, across teams, and knows when the stakes call for more.']],
    ['d.market', 'discovery', 'Market & competitive insight', 'Reading the market: segments, buyers versus users, competitors and the signals that matter.',
      ['Knows the main competitors and customer segments.', 'Tells individual feedback apart from market signal.', 'Understands buyers, users and influencers, and focuses on where the product can win.', 'Shapes the company’s view of the market and where it chooses to play.']],
    // ---------------------------------------------------------------- Product Strategy & Roadmapping
    ['s.vision', 'strategy', 'Vision & narrative', 'A clear story of where the product is going and why, told well enough that others repeat it.',
      ['Can explain the product’s purpose in their own words.', 'Separates strategic from tactical work and explains the difference.', 'Writes the product narrative leaders use; holds short- and long-term together.', 'Sets the vision across products and keeps it opinionated as conditions change.']],
    ['s.roadmap', 'strategy', 'Roadmaps tied to objectives', 'A roadmap of themes linked to business goals, with realistic milestones, communicated openly.',
      ['Maintains a roadmap; it reads like a feature list.', 'Organizes the roadmap into themes, each linked to an objective, with realistic dates.', 'Uses the roadmap to build trust: transparent, resilient to change, measured and iterated.', 'Runs roadmapping as a living system across teams, including where AI helps make decisions.']],
    ['s.business', 'strategy', 'Business & commercial sense', 'Connecting product decisions to revenue, cost and the business model.',
      ['Knows the product’s main business goals.', 'Links themes and features to business objectives.', 'Measures the business impact of what ships and adjusts.', 'Shapes the business model and makes product trade-offs at P&L level.']],
    ['s.gtm', 'strategy', 'Go-to-market', 'Positioning, value propositions and launches that land with each audience.',
      ['Contributes to launches run by others.', 'Writes value propositions for different audiences and builds a launch plan.', 'Leads launches end to end, enabling sales and aligning the company, and keeps going after launch day.', 'Designs how the company goes to market across products and segments.']],
    // ---------------------------------------------------------------- Prioritization & Trade-offs
    ['p.tradeoff', 'prioritization', 'Trade-off judgment', 'Choosing between good options with a consistent method, not the loudest voice.',
      ['Follows the team’s priorities; the loudest request often wins.', 'Uses a consistent rubric and scores options instead of arguing.', 'Thinks in bets and portfolios; makes hard calls each quarter.', 'Builds a shared, legible prioritization system across the organization.']],
    ['p.estimate', 'prioritization', 'Value & effort estimation', 'Putting numbers behind value and effort, and checking the estimates later.',
      ['Gives rough value and effort guesses when asked.', 'Puts numbers behind value and effort and validates the estimates.', 'Ties value to outcomes and revenue, not feature counts.', 'Connects prioritization to the P&L across the portfolio.']],
    ['p.sayno', 'prioritization', 'Saying no with a reason', 'Declining or deferring requests in a way people accept, and stopping work that no longer pays.',
      ['Finds it hard to say no; adds to the backlog instead.', 'Says no with a clear reason tied to priorities, and handles non-negotiables first.', 'Deletes work that no longer earns its place, and explains why.', 'Navigates conflict between senior leaders over priorities.']],
    ['p.evidence', 'prioritization', 'Decisions from evidence', 'Starting from outcomes and evidence, then doing the minimum that proves it.',
      ['Uses data when it is handed to them.', 'Closes the loop: checks whether past priorities delivered.', 'Works outcome → evidence → minimum, and avoids the feature fallacy.', 'Makes evidence-based prioritization the standard everywhere.']],
    // ---------------------------------------------------------------- Execution & Delivery
    ['e.plan', 'execution', 'Delivery planning', 'Predictable delivery: small increments, early feedback, contingency and checkpoints.',
      ['Tracks the team’s work; surprises show up late.', 'Plans in increments with early feedback; aims for predictability.', 'Plans for failure: contingency, rehearsals and checkpoints built in.', 'Builds the delivery machine and rhythms that outlast them.']],
    ['e.quality', 'execution', 'Quality & risk', 'Building quality and accessibility in, with checks and a few numbers that warn early.',
      ['Relies on testing at the end.', 'Automates checks, tracks a few quality numbers and treats accessibility as part of the job.', 'Designs for failure and rehearses peak moments.', 'Sets quality and risk standards across teams.']],
    ['e.partner', 'execution', 'Working with engineering & design', 'Partnering closely with engineers and designers rather than handing work over.',
      ['Hands requirements to engineering and design.', 'Works with engineering and design throughout, sharing context and trade-offs.', 'Is a trusted partner; coaches the team through high-stakes moments.', 'Builds strong product–engineering–design partnerships across the organization.']],
    ['e.outcomes', 'execution', 'Measuring outcomes', 'Measuring what actually matters after shipping, and using it to improve.',
      ['Reports what shipped.', 'Tracks a few outcome numbers for what ships.', 'Optimizes with data as standard practice.', 'Makes outcome measurement part of how the organization runs.']],
    // ---------------------------------------------------------------- Stakeholder Communication & Influence
    ['k.updates', 'stakeholder', 'Updates people use', 'A regular rhythm of clear updates, tailored to each audience, without being asked.',
      ['Shares updates when asked.', 'Sends updates on a rhythm through set channels, tailored to each audience.', 'Is known for transparency; updates are used to make decisions.', 'Sets the communication standards for the product organization.']],
    ['k.influence', 'stakeholder', 'Influence without authority', 'Getting people who don’t report to you to act: empowering, persuading and bridging functions.',
      ['Relies on their manager to get others on board.', 'Empowers teammates and earns support through clarity.', 'Bridges product with risk, legal and compliance, and other functions with different goals.', 'Shapes the system: mentors others in stakeholder skill.']],
    ['k.exec', 'stakeholder', 'Executive presence', 'Communicating with senior leaders: concise, confident and anchored in a shared vision.',
      ['Presents to their manager.', 'Presents clearly to senior leaders with a recommendation.', 'Aligns leaders around a shared vision.', 'Shapes executive decisions and how leadership works with product.']],
    ['k.align', 'stakeholder', 'Cross-team alignment', 'Getting product, design, engineering, marketing and sales working as one.',
      ['Knows the roles on the product team.', 'Makes collaboration deliberate: roles, recognition and continuous learning.', 'Builds a customer-centric, aligned culture across teams.', 'Makes product, marketing and sales one motion, and makes it stick.']],
    // ---------------------------------------------------------------- AI Fluency: Individual
    ['ai.tools', 'aiIndividual', 'Everyday AI tools', 'Using AI tools in daily product work: getting started and building the habit.',
      ['Has tried AI tools occasionally.', 'Uses AI for everyday tasks and knows where to start.', 'Uses AI throughout the day, with agents watching for what matters.', 'Works alongside agents as a matter of course, and helps others do the same.']],
    ['ai.research', 'aiIndividual', 'AI for research & analysis', 'Using AI to synthesize research, run experiments and generate hypotheses.',
      ['Uses AI to summarize documents.', 'Runs research and experiments with AI as an always-on engine.', 'Uses AI to synthesize and challenge hypotheses while people do the sense-making.', 'Designs research systems where AI and people each do what they do best.']],
    ['ai.check', 'aiIndividual', 'Checking AI’s work', 'Judging and verifying AI output: editing instead of trusting.',
      ['Takes AI output mostly as given.', 'Checks AI output for facts and tone before using it.', 'Knows where AI fails, and keeps humans on interpretation and the final call.', 'Sets the review standards for AI-assisted work.']],
    ['ai.workflow', 'aiIndividual', 'Designing your AI workflow', 'Turning one-off AI tasks into rituals and a way of working.',
      ['Uses AI task by task.', 'Turns tasks into repeatable rituals (backlog grooming, KPI reviews).', 'Conducts a set of AI helpers across their work.', 'Has redesigned their role around AI and can show what is different.']],
    // ---------------------------------------------------------------- AI Fluency: Organizational
    ['ao.find', 'aiOrg', 'Finding AI opportunities', 'Spotting where AI creates real value: the work worth automating, beyond automation.',
      ['Knows AI could help the organization.', 'Assesses where the organization stands and where AI fits.', 'Uses discovery to find the work worth automating.', 'Sets AI direction from strategy, beyond automation.']],
    ['ao.design', 'aiOrg', 'Agent & workflow design', 'Designing agents and workflows like a team: roles, a minimum squad, workflows before models.',
      ['Thinks of AI as a single chatbot.', 'Designs agents like roles on a team, starting with workflows.', 'Applies product rigor to AI systems, not IT rigor.', 'Designs how people and agents divide the work across the organization.']],
    ['ao.govern', 'aiOrg', 'Governance & risk', 'Keeping AI safe and accountable: evaluation, governance and the case for change management.',
      ['Is aware of AI risks.', 'Evaluates AI like a product before trusting it.', 'Makes the governance and change-management case, and runs it.', 'Sets AI governance for the organization.']],
    ['ao.adopt', 'aiOrg', 'Adoption & change', 'Getting AI into everyday use: small pilots, real feedback and staged rollout.',
      ['Joins AI pilots run by others.', 'Runs a small, real pilot and listens for corrections.', 'Earns each stage of rollout and measures adoption like a product.', 'Turns pilots into compounding growth across the organization.']]
  ];

  // Which competencies each lesson builds, by course, in lesson order.
  var LESSONS = {
    'discovery-novice': [['d.framing'], ['d.research'], ['d.research'], ['d.validate'], ['d.validate']],
    'discovery-moderate': [['d.research'], ['d.research'], ['d.research', 'd.validate'], ['d.market'], ['d.research']],
    'discovery-experienced': [['d.framing'], ['d.framing', 'd.market'], ['d.validate'], ['d.market'], ['d.validate'], ['d.validate', 'k.exec']],
    'discovery-advanced': [['d.research'], ['d.research'], ['d.research'], ['d.research'], ['d.framing']],
    'strategy-novice': [['s.roadmap'], ['s.vision'], ['s.roadmap', 's.business'], ['s.roadmap', 'p.tradeoff'], ['s.roadmap']],
    'strategy-moderate': [['s.gtm'], ['s.gtm', 's.vision'], ['s.gtm'], ['s.gtm', 'k.align'], ['s.gtm', 's.business']],
    'strategy-experienced': [['s.roadmap', 'k.updates'], ['s.roadmap', 's.vision'], ['s.vision'], ['s.roadmap'], ['s.business', 'e.outcomes']],
    'strategy-advanced': [['s.vision', 'ao.design'], ['s.roadmap', 'ao.design'], ['s.vision'], ['s.roadmap', 'ao.adopt'], ['s.roadmap']],
    'prioritization-novice': [['p.tradeoff'], ['p.estimate'], ['p.tradeoff'], ['p.tradeoff', 'p.sayno'], ['p.sayno']],
    'prioritization-moderate': [['p.tradeoff'], ['p.estimate'], ['p.estimate', 'p.evidence'], ['p.tradeoff'], ['p.evidence']],
    'prioritization-experienced': [['p.evidence'], ['p.evidence'], ['p.tradeoff'], ['p.tradeoff'], ['p.sayno']],
    'prioritization-advanced': [['p.tradeoff'], ['p.tradeoff'], ['p.estimate', 's.business'], ['p.tradeoff'], ['p.sayno', 'k.exec']],
    'execution-novice': [['e.plan'], ['e.plan'], ['e.quality'], ['e.quality', 'e.outcomes'], ['e.plan']],
    'execution-moderate': [['e.quality'], ['e.quality', 'ai.tools'], ['e.quality'], ['e.plan'], ['e.outcomes'], ['e.quality']],
    'execution-experienced': [['e.plan'], ['e.quality'], ['e.quality', 'e.plan'], ['e.plan'], ['e.plan']],
    'execution-advanced': [['e.plan'], ['e.plan'], ['e.partner'], ['e.outcomes'], ['e.partner', 'e.plan']],
    'stakeholder-novice': [['k.updates'], ['k.updates'], ['k.updates'], ['k.updates'], ['k.updates', 'k.influence']],
    'stakeholder-moderate': [['k.align', 'e.partner'], ['k.align'], ['k.influence'], ['k.align']],
    'stakeholder-experienced': [['k.align', 'k.exec'], ['e.partner', 'k.align'], ['k.influence'], ['k.align']],
    'stakeholder-advanced': [['k.influence', 'k.exec'], ['k.align'], ['k.align', 's.gtm'], ['k.influence'], ['k.exec', 'k.align']],
    'aiIndividual-novice': [['ai.tools'], ['ai.workflow'], ['ai.tools'], ['ai.workflow'], ['ai.workflow']],
    'aiIndividual-moderate': [['ai.workflow'], ['ai.workflow'], ['ai.research'], ['ai.research', 'p.evidence'], ['ai.workflow']],
    'aiIndividual-experienced': [['ai.check'], ['ai.research', 'd.research'], ['ai.research', 'ai.check'], ['ai.check'], ['ai.research'], ['ai.check']],
    'aiIndividual-advanced': [['ai.workflow'], ['ai.tools'], ['ai.check'], ['ai.check'], ['ai.workflow']],
    'aiOrg-novice': [['ao.design'], ['ao.design'], ['ao.find', 'ao.design'], ['ao.design'], ['ao.govern']],
    'aiOrg-moderate': [['ao.find'], ['ao.adopt'], ['ao.govern'], ['ao.adopt'], ['ao.find']],
    'aiOrg-experienced': [['ao.govern', 'ao.design'], ['ao.find'], ['ao.adopt'], ['ao.adopt'], ['ao.adopt'], ['ao.adopt']],
    'aiOrg-advanced': [['ao.find'], ['ao.design'], ['ao.find'], ['ao.adopt'], ['ao.find']]
  };

  // Role benchmarks: where a standard role (roles-core.js) asks for more or less than its area target in a
  // competency. Everything not listed takes the role's area target. Levels 1 to 4.
  var ROLE_SPIKES = {
    apm: { 'd.market': 1, 'p.sayno': 1, 'k.exec': 1, 'ai.tools': 3 },
    pm: { 'd.market': 2, 's.business': 2, 'p.sayno': 2, 'k.exec': 1, 'e.partner': 3, 'ai.tools': 3, 'ai.check': 3 },
    spm: { 'd.market': 3, 'p.evidence': 3, 'e.partner': 4, 'k.exec': 2, 'ao.find': 3 },
    gpm: { 'e.plan': 3, 'e.quality': 2, 's.vision': 4, 's.business': 4, 'k.exec': 4, 'k.updates': 3, 'ai.tools': 3, 'ao.design': 3 },
    head: { 'd.framing': 4, 'd.research': 2, 'e.plan': 2, 'e.quality': 2, 'e.partner': 3, 's.vision': 4, 's.business': 4, 'k.exec': 4, 'k.align': 4, 'k.updates': 3, 'p.tradeoff': 4, 'ai.tools': 2, 'ao.find': 4, 'ao.govern': 4 },
    po: { 'd.market': 1, 's.vision': 1, 's.gtm': 1, 'p.sayno': 3, 'e.plan': 3, 'e.quality': 3, 'k.exec': 1, 'k.updates': 3 },
    partner: { 'd.research': 3, 'd.validate': 3, 'd.market': 1, 's.gtm': 1, 'e.partner': 3, 'e.quality': 3, 'k.exec': 1 },
    exec: { 'd.framing': 3, 'd.research': 1, 'd.validate': 1, 's.vision': 4, 's.business': 4, 'e.plan': 1, 'e.partner': 1, 'k.exec': 4, 'ai.check': 2, 'ao.find': 4, 'ao.govern': 4 }
  };

  var LEVELS = ['Limited Experience', 'Moderate Experience', 'Lots of Experience', 'Advanced Experience'];
  var LIST = C.map(function (c) { return { key: c[0], area: c[1], name: c[2], about: c[3], levels: c[4] }; });
  var BY = {}; LIST.forEach(function (c) { BY[c.key] = c; });

  function forLesson(courseId, lessonId) { var ls = LESSONS[courseId]; return (ls && ls[lessonId - 1]) || []; }
  // a competency check question (competency-check.js) names its competency; a bank question goes by its lesson's tags
  function forQuestion(q) { return !q ? [] : q.k ? (BY[q.k] ? [q.k] : []) : forLesson(q.c, q.l); }
  function inArea(area) { return LIST.filter(function (c) { return c.area === area; }); }

  root.CompetencyCore = { LIST: LIST, BY: BY, LESSONS: LESSONS, LEVELS: LEVELS, ROLE_SPIKES: ROLE_SPIKES, forLesson: forLesson, forQuestion: forQuestion, inArea: inArea };
})(typeof window !== 'undefined' ? window : globalThis);
