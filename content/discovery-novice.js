/* ================================================================
   COURSE CONTENT: Customer & Market Discovery, Limited Experience
   The flagship course: one story told across five lessons, with the
   richer building blocks from lesson-blocks.js (story, data, practice).
   Grounded in Chapter 2 of "The Product Manager's Playbook" by Robert
   Merrell ("Understanding Market Needs and Validating Product Ideas").

   The company (Ledgerline) and its people are fictional, and so are
   the numbers from their pilot; those are marked as such on the page.
   Every other figure is from the named source.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

(function () {
  // The people in the story (all fictional).
  const CAST = {
    maya: { id: 'maya', name: 'Maya Chen', role: 'Product manager, 3 weeks in' },
    lauren: { id: 'lauren', name: 'Lauren Brooks', role: 'CEO' },
    rosa: { id: 'rosa', name: 'Rosa Alvarez', role: 'Billing specialist at a customer' },
    tom: { id: 'tom', name: 'Tom Okafor', role: 'Controller at the same customer' },
    dev: { id: 'dev', name: 'Dev Patel', role: 'Head of engineering' },
    priya: { id: 'priya', name: 'Priya Shah', role: 'IT lead at the customer' }
  };

  // Nielsen & Landauer (1993): share of usability problems found by n users = 1 - (1 - 0.31)^n.
  const FOUND = [];
  for (let n = 1; n <= 15; n++) FOUND.push([n, Math.round(100 * (1 - Math.pow(0.69, n)))]);

  window.CONTENT_OVERRIDES["discovery-novice"] = {
    sourceUrl: "",
    template: {
      title: "Problem statement worksheet",
      intro: "Turn a vague request into the kind of problem statement Maya wrote in Lesson 1.",
      fields: [
        { key: "who", label: "Who (a specific user or segment, not \"users\")", type: "text", placeholder: "e.g. Billing specialists at 50 to 500 person companies" },
        { key: "problem", label: "The problem, in their words", type: "textarea", placeholder: "What they'd actually say if you asked what's frustrating" },
        { key: "evidence", label: "Evidence it's real", type: "textarea", placeholder: "What you observed or heard, not an assumption" },
        { key: "why", label: "Why it matters now", type: "text", placeholder: "e.g. Costs six hours every month-end and delays invoicing" }
      ]
    },
    recap: [
      "Start from the problem, not the request: write who has the pain, what it costs them, and why today's options fall short, with no solution in it.",
      "Your \"user\" is usually several people: the one who does the work, the one who pays, and the one who can say no. Know what each wants and worries about.",
      "Read before you talk (secondary research), then talk to five or so people about what they actually did last time, then look for where competitors leave the problem unsolved.",
      "Test the riskiest assumption with the cheapest thing that could prove it wrong, and believe what people do over what they say.",
      "None of this is hard. The discipline is doing it before the team has started building."
    ],
    lessons: [
      {
        id: 1,
        title: "Lesson 1: Start With a Problem Statement",
        preCheck: {
          label: "Before you read on — predict",
          question: "Your CEO asks for a redesign of a screen customers call \"clunky\". What's the most useful first thing to write down?",
          options: [
            "A list of the screens and controls the redesign will need",
            "A clear statement of the problem: the pain, who has it, and why today's options fall short",
            "A rough timeline for when it could ship"
          ],
          correct: 1,
          explanation: "Hold on to your answer. Maya is about to face exactly this request."
        },
        blocks: [
          { type: 'story', title: 'Monday, week three', cast: [CAST.maya, CAST.lauren, CAST.rosa], pause: 4, beats: [
            { narration: 'Ledgerline sells invoicing software to companies with small finance teams. Maya joined three weeks ago as its second product manager.' },
            { who: 'lauren', text: 'Customers keep telling sales that billing feels clunky. Can you get a redesign of the billing dashboard on next quarter\'s roadmap?' },
            { who: 'maya', text: 'Yes. Before we scope it, can I spend this week finding out what "clunky" is costing them? I\'d like to get the redesign aimed at the right thing.' },
            { narration: 'Maya books three calls with customers. The first is with Rosa, who runs billing at a 200-person distributor.' },
            { who: 'rosa', text: 'The screen? It\'s fine, honestly. What kills me is month-end. Payments come in from the bank and I match them to invoices by hand. A customer pays three invoices in one transfer, or pays half. It takes me about six hours, every month.' },
            { who: 'maya', text: 'What happens if a match is wrong?' },
            { who: 'rosa', text: 'We chase someone who already paid. That\'s the call I hate making.' },
            { narration: 'The other two calls tell the same story. A redesign would have made a slow, manual job look nicer. The problem was the matching.' }
          ] },
          { type: 'html', html: `
            <p>Lauren's request was a <strong>solution</strong> ("redesign the dashboard"). What Maya needed first was the <strong>problem</strong>. A problem statement answers three questions, and names no solution:</p>
            <ul>
              <li><strong>What is the pain?</strong> Matching payments to invoices by hand at month-end.</li>
              <li><strong>Who has it, and what does it cost them?</strong> Billing specialists; about six hours a month, plus the awkward calls when a match is wrong.</li>
              <li><strong>Why do today's options fall short?</strong> Payments that cover several invoices, or part of one, can't be matched by the current screen at all.</li>
            </ul>` },
          { type: 'compare', items: [
            { tone: 'bad', label: 'A request', text: '"Redesign the billing dashboard so it feels more modern."', why: 'Names a solution and a feeling. No pain, no people, no cost, nothing to test it against.' },
            { tone: 'good', label: 'A problem statement', text: '"Billing specialists spend about six hours each month-end matching bank payments to invoices by hand, because payments that cover several invoices, or part of one, can\'t be matched automatically. Mistakes lead to chasing customers who already paid."', why: 'Pain, people, cost and the gap in today\'s tools. Every later decision can be checked against it.' }
          ] },
          { type: 'stat', value: '80%', label: 'of the features in the average software product are rarely or never used. Building from requests instead of problems is one of the ways that happens.', source: 'Pendo, 2019 Feature Adoption Report (usage data across hundreds of software products)' },
          { type: 'sort', title: 'Problem or solution?', prompt: 'Product requests arrive dressed as solutions. Sort each one.', buckets: [{ id: 'problem', label: 'Problem' }, { id: 'solution', label: 'Solution' }], items: [
            { text: '"Add a bulk-edit button to the invoice list."', bucket: 'solution', why: 'It describes a feature. The problem behind it might be "updating 40 invoices one at a time takes an afternoon", which bulk edit may or may not be the best fix for.' },
            { text: '"New customers give up during setup because they can\'t find their bank details."', bucket: 'problem', why: 'Who (new customers), what happens (they give up) and where. No fix is assumed.' },
            { text: '"We need an AI assistant in the app."', bucket: 'solution', why: 'A technology looking for a use. Ask: an assistant to help whom do what?' },
            { text: '"Finance teams can\'t see which invoices are overdue until the customer complains."', bucket: 'problem', why: 'A pain, the people who have it, and its consequence.' },
            { text: '"Make the dashboard load faster."', bucket: 'solution', why: 'Close to a problem, but it skips who is slowed down, doing what, and what it costs them. "Slow" may matter on one screen and not at all on another.' },
            { text: '"Sales loses deals because prospects can\'t try the product without a call."', bucket: 'problem', why: 'Clear who and cost. A free trial is one possible solution; there are others.' }
          ] },
          { type: 'takeaway', text: 'When a request arrives, thank them, then ask "what happens today, and what does it cost?" The problem is usually one question behind the request.' }
        ],
        checks: [
          {
            question: "Which of these is a usable problem statement in the sense this lesson means?",
            options: [
              "\"Build a faster invoice screen with templates and shortcuts\"",
              "\"Billing specialists spend hours each month-end matching payments to invoices by hand, which delays reporting and causes errors\"",
              "\"Make the billing area of the product feel more modern\""
            ],
            correct: 1,
            explanation: "It names the pain, who has it, and the cost, with no solution baked in. The other two describe a solution or a feeling."
          },
          {
            question: "Why did Maya call customers before scoping the redesign?",
            options: [
              "To collect feature requests for the redesign",
              "To find the problem behind the request, so every later decision could be checked against it",
              "To get customers to approve the new design early"
            ],
            correct: 1,
            explanation: "The request was a solution. Finding the problem changed what was worth building, before any time had been spent building it."
          }
        ]
      },
      {
        id: 2,
        title: "Lesson 2: Know Who You're Building For",
        blocks: [
          { type: 'story', title: 'Three people, one purchase', cast: [CAST.maya, CAST.tom, CAST.priya], beats: [
            { narration: 'Maya asks Rosa who else would care if payment matching changed. Rosa introduces her to two colleagues.' },
            { who: 'tom', text: 'I sign the renewal. If this closes the month two days faster, I\'ll pay more for it. If it just looks better, I won\'t.' },
            { who: 'priya', text: 'Anything that reads our bank feed needs single sign-on and an audit trail. Without those, it doesn\'t get switched on, however much finance wants it.' },
            { narration: 'One customer, three people, three different tests. Rosa does the work, Tom pays, and Priya can say no.' }
          ] },
          { type: 'html', html: `<p>In most products, "the user" is several people. The person who uses it every day is often not the person who decides to buy it, and neither of them may be the one who can block it. Design only for the first and the product never gets bought. Pitch only to the second and it gets bought, then ignored.</p>
            <p>For each group, build a short <strong>persona</strong>: not demographics, but their day, what they are trying to achieve, what worries them, and how comfortable they are with new tools.</p>` },
          { type: 'personas', title: 'Maya\'s personas for payment matching', items: [
            { name: 'Rosa', role: 'Billing specialist', kind: 'Does the work', quote: 'Month-end is six hours of matching I could do in my sleep, if I could sleep.', wants: 'Matches she can trust, and fewer calls to customers who already paid.', worries: 'A tool that guesses wrong and leaves her to find the mistakes.' },
            { name: 'Tom', role: 'Controller', kind: 'Pays', quote: 'Show me the month closing faster.', wants: 'Faster close and cleaner numbers for the auditors.', worries: 'Paying for software the team doesn\'t use.' },
            { name: 'Priya', role: 'IT lead', kind: 'Can say no', quote: 'If it touches the bank, I need to know who did what.', wants: 'Single sign-on, an audit trail, nothing to maintain.', worries: 'Another system with access to bank data.' }
          ] },
          { type: 'sort', title: 'Whose concern is it?', prompt: 'Each comment came up in Maya\'s calls. Who is it really about?', buckets: [{ id: 'user', label: 'Does the work' }, { id: 'buyer', label: 'Pays' }, { id: 'blocker', label: 'Can say no' }], items: [
            { text: '"Can I undo a match if I get it wrong?"', bucket: 'user', why: 'A daily-use worry. It decides whether Rosa trusts the tool enough to use it.' },
            { text: '"What will this cost per year, and when do we see the payback?"', bucket: 'buyer', why: 'Budget and return: Tom\'s questions.' },
            { text: '"Where is the bank data stored, and who can see it?"', bucket: 'blocker', why: 'A security question. Get it wrong and Priya stops the rollout, whatever finance wants.' },
            { text: '"Will it save us time at month-end?"', bucket: 'buyer', why: 'Rosa cares too, but for Tom it\'s the reason to pay. The same benefit has to be told in his terms: days saved, not clicks.' }
          ] },
          { type: 'scenario', title: 'The demo', setup: 'Two weeks later Maya demos a prototype to the customer. Tom loves it: "This is exactly what I need." Rosa, who will use it every month-end, says almost nothing.', question: 'What should Maya do next?', choices: [
            { label: 'Count it as a win. The buyer is sold.', verdict: 'risky', outcome: 'Tom may well buy it. But if Rosa doesn\'t trust it, she\'ll keep matching by hand alongside it, and at renewal Tom will see a tool nobody uses.' },
            { label: 'Book 30 minutes with Rosa alone and ask her to try it on last month\'s payments.', verdict: 'best', outcome: 'Silence from the daily user is a finding. Alone, Rosa admits she doesn\'t trust matches she can\'t see the reasoning for. Maya adds a "why this match" note, the change that later makes the product work.' },
            { label: 'Send everyone a survey about the prototype.', verdict: 'ok', outcome: 'Better than nothing, but a survey won\'t show why Rosa went quiet. Watching her use it on real data will.' }
          ] }
        ],
        checks: [
          {
            question: "Why does the lesson separate the person who does the work from the person who pays?",
            options: [
              "The person who pays doesn't matter for product design",
              "They often aren't the same person, and each has different needs you have to design and sell for",
              "It's only relevant for enterprise software"
            ],
            correct: 1,
            explanation: "A feature that delights daily users but ignores what the buyer cares about may never be bought, and one that wins the buyer but not the user won't be used."
          },
          {
            question: "What should a persona include beyond demographics?",
            options: [
              "Only the person's job title and seniority",
              "Their day, their goals, what worries them, and how comfortable they are with new tools",
              "A detailed list of features they've requested"
            ],
            correct: 1,
            explanation: "Demographics don't tell you how to design for someone. What their day is like and what they're trying to achieve is what makes a persona useful."
          }
        ]
      },
      {
        id: 3,
        title: "Lesson 3: Do the Research",
        blocks: [
          { type: 'story', title: 'Two weeks, three kinds of evidence', cast: [CAST.maya, CAST.dev], beats: [
            { who: 'dev', text: 'Three customer calls is a good story. Is it enough to bet a quarter on?' },
            { who: 'maya', text: 'Not yet. I\'ll spend two days reading what\'s already out there, then talk to five more customers of different sizes, then look at how everyone else handles this.' },
            { narration: 'Primary research tells you how people really work. Secondary research tells you the shape of the market, quickly and cheaply. Competitive analysis tells you where the openings are.' }
          ] },
          { type: 'html', html: `<p><strong>How many conversations is enough?</strong> Fewer than most people think, as long as they're with the right people. Jakob Nielsen and Tom Landauer showed that in usability testing each new person finds a share of the problems the earlier ones missed, so returns fall quickly. Interview research behaves in a similar way: in one well-known study, the main themes had appeared within the first six interviews and nothing new appeared after twelve.</p>` },
          { type: 'curve', title: 'Each conversation finds less that\'s new', subtitle: 'Share of usability problems found as you add test users, using Nielsen and Landauer\'s model (each user finds about 31%).', xLabel: 'People you talk to', sliderLabel: 'People', yLabel: 'Problems found', unit: '%', points: FOUND, start: 4,
            readout: (n, y) => 'With <b>' + n + (n === 1 ? ' person' : ' people') + '</b> you find about <b>' + y + '%</b> of the problems.' + (n <= 2 ? ' Too few: one loud voice can mislead you.' : n <= 6 ? ' The sweet spot: most of what matters, for a few days\' work.' : ' You\'re mostly hearing things you\'ve already heard. Spend the time on a different kind of customer instead.'),
            source: 'Nielsen & Landauer, "A mathematical model of the finding of usability problems" (1993); interview themes: Guest, Bunce & Johnson, Field Methods (2006)' },
          { type: 'compare', items: [
            { tone: 'bad', label: 'Leading question', text: '"Would you use a tool that matched payments for you automatically?"', why: 'Hypothetical and leading. People are kind; almost everyone says yes.' },
            { tone: 'good', label: 'Better question', text: '"Walk me through the last time you closed the month. Where did the time go?"', why: 'About something that already happened. You hear what they actually do, including the workarounds.' }
          ] },
          { type: 'sort', title: 'Good interview question, or not?', prompt: 'Maya drafts her interview guide. Which of these will get her real answers?', buckets: [{ id: 'good', label: 'Keep it' }, { id: 'bad', label: 'Rewrite it' }], items: [
            { text: '"How much would you pay for automatic matching?"', bucket: 'bad', why: 'People are poor at predicting what they\'d pay for something they\'ve never used. Ask what the problem costs them today instead.' },
            { text: '"What did you do the last time a payment didn\'t match any invoice?"', bucket: 'good', why: 'A real, recent event. You learn the workaround and how much it hurts.' },
            { text: '"Don\'t you find month-end frustrating?"', bucket: 'bad', why: 'It tells them the answer you want. Ask "how did last month-end go?"' },
            { text: '"Have you tried anything else to fix this? What happened?"', bucket: 'good', why: 'Shows whether they care enough to have looked for a fix, and what the alternatives get wrong.' }
          ] },
          { type: 'matrix', title: 'How today\'s options handle Rosa\'s problem', subtitle: 'Maya\'s competitive scan (illustrative). The question isn\'t "what do they have that we don\'t?" but "what does nobody do well?"', columns: ['Matches simple payments', 'One payment, several invoices', 'Part-payments', 'Audit trail', 'Fits a 2-person finance team'], gap: 2,
            rows: [
              { label: 'Ledgerline today', cells: ['part', 'no', 'no', 'yes', 'yes'] },
              { label: 'Big accounting suite add-on', cells: ['yes', 'yes', 'part', 'yes', 'no'] },
              { label: 'The bank\'s own portal', cells: ['yes', 'no', 'no', 'part', 'yes'] },
              { label: 'Spreadsheet and macros', cells: ['part', 'part', 'part', 'no', 'yes'] }
            ],
            note: 'Part-payments are handled poorly everywhere, and the suite that comes closest is too heavy for small teams. That gap is Ledgerline\'s opening.' }
        ],
        steps: [
          { title: "Secondary research (days 1 to 2)", detail: "Read what already exists: industry reports, analyst write-ups, competitor documentation and help pages, review sites, regulations. It's cheap and fast, and it means your interviews start from what's known instead of the basics." },
          { title: "Primary research (days 3 to 7)", detail: "Talk to five or six people per type of customer, about what they did last time rather than what they'd like. Watch them do the task if you can. Write up each conversation the same day." },
          { title: "Competitive analysis (day 8)", detail: "For the problem you're targeting, look at how each alternative handles it, including spreadsheets and doing nothing. You're hunting for the gap: the part of the problem nobody solves well for the people you care about." }
        ],
        checks: [
          {
            question: "You have two weeks for discovery in an area you don't know. What's the most efficient first move?",
            options: [
              "Book two full weeks of customer interviews straight away",
              "Spend a day or two on secondary research first, so your interviews start from what's already known",
              "Send a broad survey and wait for the replies"
            ],
            correct: 1,
            explanation: "Secondary research is cheap and quick, and it makes the interviews far sharper because you aren't spending them on the basics."
          },
          {
            question: "In a competitive analysis, what are you actually looking for?",
            options: [
              "A feature checklist so you can match everything competitors have",
              "The gap: the part of the problem nobody solves well for the customers you care about",
              "Proof that no competitor exists"
            ],
            correct: 1,
            explanation: "Matching competitors feature for feature is a treadmill. The value is in spotting where they all fall short, like part-payments in Maya's scan."
          }
        ]
      },
      {
        id: 4,
        title: "Lesson 4: Validate Before You Build",
        blocks: [
          { type: 'story', title: 'Three months, or two weeks?', cast: [CAST.maya, CAST.dev, CAST.rosa], pause: 3, beats: [
            { who: 'dev', text: 'A proper matching engine, with bank feeds, rules and part-payments, is about three months for two engineers.' },
            { who: 'maya', text: 'Before we spend that, I want to know if people will actually change how they work. What if, for two weeks, five customers send us their bank export and we match it for them with a spreadsheet and some rules?' },
            { who: 'dev', text: 'By hand? That doesn\'t scale.' },
            { who: 'maya', text: 'It doesn\'t need to. It needs to tell us if they\'ll use it, and where the matching breaks.' },
            { narration: 'They run the test with ten customers. Nearly all of them say it would help. Fewer keep using it.' },
            { who: 'rosa', text: 'The simple ones were great. But half our payments are part-payments, and those all came back unmatched, so I still had to do them myself.' }
          ] },
          { type: 'flow', title: 'Ways to test an idea, cheapest first', steps: [
            { title: 'Fake door', tag: 'Days', text: 'A button or landing page for a feature that doesn\'t exist yet. Count who clicks.' },
            { title: 'Concierge', tag: '1 to 2 weeks', text: 'Do the job for a few customers by hand, as Maya did. You learn exactly where it\'s hard.' },
            { title: 'Wizard of Oz', tag: '2 to 4 weeks', text: 'It looks automatic to the customer; a person does the work behind the scenes.' },
            { title: 'Smallest real product', tag: 'Weeks', text: 'Build only the part that solves the core problem, for a small group, and learn from it.' }
          ] },
          { type: 'bars', title: 'What customers said, and what they did', subtitle: 'Maya\'s two-week pilot with 10 customers.', unit: '%', valueLabel: 'Share of pilot customers', highlight: 'Asked to keep it after the pilot', items: [
            { label: 'Said it would help', value: 90 },
            { label: 'Sent a bank export in week 1', value: 80 },
            { label: 'Sent one again in week 2', value: 60 },
            { label: 'Asked to keep it after the pilot', value: 50, detail: 'All five of the others had mostly part-payments.' }
          ], note: 'Fictional numbers from the story, showing the usual gap between saying and doing.' },
          { type: 'scenario', title: 'Half kept it, half drifted off', setup: 'Five of ten customers want to keep the service. The other five stopped sending files, and most of their payments were part-payments.', question: 'What should the team do?', choices: [
            { label: 'Start the three-month engine now. Half is a strong result.', verdict: 'risky', outcome: 'The engine would match simple payments well and still fail the customers who need it most. The pilot has just told you where the hard part is; build without it and you\'ve paid three months to learn it again.' },
            { label: 'Spend another week matching part-payments by hand, to learn the rules that make them work.', verdict: 'best', outcome: 'The drop-offs are the most useful data you have. Maya finds that most part-payments carry the invoice number in the bank reference, which a simple rule can catch. The first release does just that, in six weeks.' },
            { label: 'Drop the idea. Only half wanted it.', verdict: 'risky', outcome: 'Half of customers asking to keep a manual service is a strong signal. The ones who left did so for a reason you can fix.' }
          ] },
          { type: 'html', html: `<p>A <strong>minimum viable product</strong> isn't a half-finished release. It's the smallest thing that delivers real value on the core problem and lets you learn. When you test it, watch three things together: <strong>what people do</strong> (usage), <strong>what they say</strong> (interviews and surveys) and <strong>where they struggle</strong> (watching them use it). A gap between saying and doing isn't noise. It's often the finding.</p>` }
        ],
        checks: [
          {
            question: "What's the lesson's definition of a minimum viable product?",
            options: [
              "A rushed, incomplete version shipped to hit a deadline",
              "The smallest thing that delivers real value on the core problem and lets you learn from it",
              "The full product with a few features hidden"
            ],
            correct: 1,
            explanation: "Maya's spreadsheet service delivered real value (matched payments) to real customers in two weeks, and taught the team where the hard part was."
          },
          {
            question: "Users say they like a new feature, but most stop using it after the first week. What should you trust?",
            options: [
              "What they said: users know their own experience best",
              "Both, together: what they do tells you there's a problem, and talking to them tells you why",
              "Neither; run a bigger pilot before concluding anything"
            ],
            correct: 1,
            explanation: "Usage shows what happened, conversations explain it. Maya only understood the drop-off when Rosa explained the part-payments."
          }
        ]
      },
      {
        id: 5,
        title: "Lesson 5: The Discipline of Doing It First",
        blocks: [
          { type: 'story', title: 'Six weeks later', cast: [CAST.maya, CAST.lauren, CAST.rosa], beats: [
            { narration: 'The first release suggests matches, including part-payments with the invoice number in the reference, and shows why it chose each one. Rosa approves them with one click.' },
            { who: 'rosa', text: 'Month-end took me about an hour and a half. And I didn\'t chase anyone who\'d already paid.' },
            { who: 'lauren', text: 'So we never built the redesign?' },
            { who: 'maya', text: 'We built the thing that made people stop asking for it.' },
            { narration: 'At renewal, Tom upgrades. Priya signs off because every match records who approved it. Each of the three people got what they needed.' }
          ] },
          { type: 'html', html: `<p>The whole course is one sequence: <strong>problem, then people, then research, then a cheap test, then build</strong>. None of the steps is hard. The discipline is doing them <em>before</em> the team is building, when building feels faster than finding out. Once work has started, discovery tends to become a search for evidence that the plan was right.</p>` },
          { type: 'bars', title: 'Why startups fail, in their founders\' words', subtitle: 'Share of 111 startup post-mortems citing each reason. Most cite more than one.', unit: '%', valueLabel: 'Share of post-mortems', highlight: 'No market need', items: [
            { label: 'Ran out of cash or couldn\'t raise', value: 38 },
            { label: 'No market need', value: 35, detail: 'They built something nobody needed enough to pay for.' },
            { label: 'Got outcompeted', value: 20 },
            { label: 'Flawed business model', value: 19 },
            { label: 'Regulatory or legal problems', value: 18 },
            { label: 'Pricing or cost issues', value: 15 }
          ], source: 'CB Insights, "The Top 12 Reasons Startups Fail" (2021)', note: 'More than a third built something the market didn\'t need: the problem this course is about.' },
          { type: 'flow', title: 'Your two weeks of discovery', steps: [
            { title: 'Read', tag: 'Days 1 to 2', text: 'Reports, competitor help pages, reviews. Write down what you think you know.' },
            { title: 'Talk', tag: 'Days 3 to 7', text: 'Five or six people per type of customer, about what they did last time. Include the buyer and whoever can say no.' },
            { title: 'Write it down', tag: 'Day 8', text: 'The problem statement, a persona for each group, and the gap in today\'s options.' },
            { title: 'Test the riskiest part', tag: 'Days 9 to 10', text: 'Pick the cheapest test that could prove you wrong, and decide in advance what result would change your plan.' }
          ] },
          { type: 'takeaway', text: 'Two weeks of discovery is small and certain. Months spent building the wrong thing are large, and you find out late.' }
        ],
        checks: [
          {
            question: "The lesson says the steps aren't hard. So where's the difficulty?",
            options: [
              "The research tools are expensive",
              "Doing them before you've started building, when building feels faster than finding out",
              "Getting stakeholders to attend the research sessions"
            ],
            correct: 1,
            explanation: "The sequence only pays off if it happens first. Once the team is building, discovery tends to become a way of justifying the plan."
          },
          {
            label: "Bringing it together",
            question: "A colleague says: \"We already know what to build. Let's not waste two weeks on discovery.\" What's the strongest response?",
            options: [
              "They're right if the team is confident; discovery is for risky bets",
              "Two weeks finding the problem, talking to the right people and testing cheaply is small insurance against months building the wrong thing",
              "Agree, but quietly do discovery in parallel once building starts"
            ],
            correct: 1,
            explanation: "Maya's two weeks turned a three-month redesign into a six-week release that customers paid more for. The cost of skipping discovery is large and shows up late."
          }
        ],
        reflection: {
          prompt: "Take one thing your team is about to build. Write its problem statement in three sentences (the pain, who has it, why today's options fall short), then name the riskiest assumption in it and the cheapest test that could prove it wrong."
        }
      }
    ]
  };
})();
