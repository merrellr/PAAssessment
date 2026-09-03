/* ================================================================
   COURSE CONTENT: Customer & Market Discovery, No Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 2, "Understanding Market Needs and Validating Product Ideas"
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["discovery-novice"] = {
  sourceUrl: "",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Start With a Problem Statement",
      preCheck: {
        label: "Before you read on — predict",
        question: "You have an idea for a new feature. What's the most useful first thing to write down?",
        options: [
          "A list of the screens and controls the feature will need",
          "A clear statement of the problem: the pain point, who has it, and why today's options fall short",
          "A rough timeline for when it could ship"
        ],
        correct: 1,
        explanation: "See whether the lesson backs this up. The order you do things in matters more than it looks."
      },
      body: `
        <p>Every solid product or feature starts with a clear <strong>problem statement</strong>. Before design, before scoping, before estimates, you write down what pain point or opportunity you're actually addressing.</p>
        <p>A good problem statement answers three questions:</p>
        <ul>
          <li><strong>What specific pain point are we addressing?</strong></li>
          <li><strong>Who is impacted by it?</strong></li>
          <li><strong>What's the current solution, if any, and why is it insufficient?</strong></li>
        </ul>
        <p>An example: <em>"Clinicians spend so long on documentation in their records system that it cuts into patient time and drives up administrative cost."</em> Notice it names the pain, the people, and the cost, without naming a solution.</p>
        <p>Writing this down creates a focused foundation. Every later decision, what to build, what to cut, how to tell if it worked, gets checked against it.</p>
      `,
      checks: [
        {
          question: "Which of these is a usable problem statement in the sense this lesson means?",
          options: [
            "\"Build a faster note-taking screen with templates and shortcuts\"",
            "\"Support staff spend hours each week manually reconciling billing records, which delays invoicing and causes errors\"",
            "\"Make the billing area of the product feel more modern\""
          ],
          correct: 1,
          explanation: "It names the pain, who has it, and the cost — with no solution baked in. The other two describe a solution or a vibe."
        },
        {
          question: "Why does the lesson say to write the problem statement before designing anything?",
          options: [
            "It's a formality that stakeholders expect to see",
            "It becomes the thing every later decision is checked against — what to build, what to cut, how to judge success",
            "It locks the scope so it can't change later"
          ],
          correct: 1,
          explanation: "The statement is a reference point, not a contract. It keeps the work anchored to a real problem instead of drifting toward whatever's easy to build."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Know Who You're Building For",
      body: `
        <p>In most products your "users" are actually several groups with different needs. A person who uses the product daily is often not the person who decides to buy it, and neither is the person who has to approve it.</p>
        <svg viewBox="0 0 400 132" style="width:100%; height:auto; margin:4px 0 2px;">
          <g font-family="'Space Grotesk',sans-serif" font-size="10" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="8" y="34" width="112" height="38" rx="9" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.3"/>
            <text x="64" y="50">Primary users</text><text x="64" y="64" font-size="8" font-weight="400" fill="#4B5768">use it every day</text>
            <rect x="144" y="34" width="112" height="38" rx="9" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.3"/>
            <text x="200" y="50">Decision-makers</text><text x="200" y="64" font-size="8" font-weight="400" fill="#4B5768">approve the spend</text>
            <rect x="280" y="34" width="112" height="38" rx="9" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.3"/>
            <text x="336" y="50">Influencers</text><text x="336" y="64" font-size="8" font-weight="400" fill="#4B5768">shape the choice</text>
          </g>
          <text x="200" y="100" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#9AA3AD">each has different needs, priorities, and constraints — build a persona for each</text>
        </svg>
        <p>For each group, build a simple <strong>persona</strong>: not just demographics, but their daily experience, their goals, their pain points, and how comfortable they are with technology. Then ask which constraints apply to each, budget limits, approval chains, regulations, so you're not surprised later.</p>
      `,
      checks: [
        {
          question: "Why does the lesson separate \"primary users\" from \"decision-makers\"?",
          options: [
            "Decision-makers don't matter for product design",
            "The person who uses the product daily is often not the one who approves buying it — and they have different needs you have to design and pitch for",
            "It's only relevant for enterprise software"
          ],
          correct: 1,
          explanation: "A feature that delights daily users but ignores what the buyer cares about can still fail to get adopted. You need a read on both."
        },
        {
          question: "What should a persona include beyond demographics?",
          options: [
            "Only the person's job title and seniority",
            "Their daily experience, goals, pain points, and how comfortable they are with technology",
            "A detailed list of features they've requested"
          ],
          correct: 1,
          explanation: "Demographics alone don't tell you how to design for someone. The lived detail — what their day is like, what they're trying to achieve — is what makes a persona useful."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Do the Research",
      body: `
        <p>A real market assessment is more than a survey. It's two kinds of research plus a look at the competition.</p>
      `,
      steps: [
        { title: "Primary research", detail: "Talk to people directly — interviews, small focus groups, pilot programs. This is where you learn the workflow frustrations and gaps you'd never guess from the outside. A handful of honest conversations beats a hundred survey responses to a vague question." },
        { title: "Secondary research", detail: "Read what already exists: industry reports, analyst write-ups, competitor documentation, regulatory guidance. It's cheap, it's fast, and it tells you the shape of the landscape before you spend time in it." },
        { title: "Competitive analysis", detail: "For the problem you're targeting, look at how competitors address it: their features and functionality, their user experience and where it frustrates people, and their pricing and value proposition. The gaps you find are your opportunities." }
      ],
      checks: [
        {
          question: "What's the distinction between primary and secondary research here?",
          options: [
            "Primary is more important; secondary is optional",
            "Primary is talking to people directly (interviews, pilots); secondary is reviewing research and material that already exists",
            "Primary is quantitative; secondary is qualitative"
          ],
          correct: 1,
          explanation: "Primary research is you engaging stakeholders first-hand. Secondary research is you reading what others have already published. You want both."
        },
        {
          question: "In a competitive analysis, what are you actually looking for?",
          options: [
            "A feature-by-feature checklist to match everything a competitor has",
            "The gaps — where competitors' features, user experience, or pricing leave the problem poorly solved — because those are your openings",
            "Proof that no competitor exists"
          ],
          correct: 1,
          explanation: "Matching competitors feature-for-feature is a treadmill. The value of the analysis is spotting where they fall short for the users you care about."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Validate Before You Build",
      body: `
        <p>Once you've defined the problem and know who has it, test your assumptions with real users <em>before</em> committing serious engineering effort.</p>
        <p><strong>Build a minimum viable product.</strong> An MVP isn't a half-baked release. It's the smallest thing that delivers real value on the core problem while letting you iterate from feedback. If the core issue is documentation speed, the MVP is a streamlined note-taking flow, not a full redesign.</p>
        <p><strong>Then put it in front of a small, representative group</strong> and watch:</p>
        <ul>
          <li><strong>Usability testing:</strong> watch people use it and note where they hesitate or get confused.</li>
          <li><strong>Surveys and interviews:</strong> after they've used it, ask what worked and what didn't.</li>
          <li><strong>Analytics:</strong> track time-to-complete, error rates, and which features actually get used.</li>
        </ul>
      `,
      checks: [
        {
          question: "What's the lesson's definition of an MVP?",
          options: [
            "A rushed, incomplete version shipped to hit a deadline",
            "The smallest product that delivers real value on the core problem while letting you iterate from feedback",
            "The full product with a few features hidden behind flags"
          ],
          correct: 1,
          explanation: "\"An MVP is not about releasing a half-baked solution.\" It's a focused, genuinely useful slice aimed at the core problem, built to learn from."
        },
        {
          question: "You run a pilot and users say they like the new flow, but analytics show most abandon it halfway. What does this lesson suggest you trust?",
          options: [
            "The survey responses — users know their own experience best",
            "Both signals together — the qualitative \"why\" plus the behavioural data, which is exactly why you gather all three",
            "Neither; run a bigger pilot before concluding anything"
          ],
          correct: 1,
          explanation: "Usability observation, stated feedback, and analytics each catch something the others miss. A gap between what people say and what they do is a finding, not noise."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: The Discipline of Doing It First",
      body: `
        <p>The whole chapter is one sequence: <strong>problem &rarr; market &rarr; validate &rarr; then build</strong>. None of the steps are hard on their own. The discipline is doing them <em>before</em> you've sunk resources into a solution, when it still feels faster to just start building.</p>
        <p>A structured approach up front, defining the problem, segmenting the market, validating with real users, is what lets you make informed decisions instead of expensive guesses. It's also what separates someone who's aware research matters from someone who actually runs discovery.</p>
      `,
      checks: [
        {
          question: "The lesson says the steps aren't hard individually — so where's the difficulty?",
          options: [
            "The tools required are expensive",
            "Doing them before you've invested in a solution, when starting to build feels faster than validating",
            "Getting stakeholders to attend the research sessions"
          ],
          correct: 1,
          explanation: "The sequence only pays off if it happens up front. Once the team is building, discovery becomes a justification exercise rather than a decision input."
        },
        {
          label: "Bringing it together",
          question: "A colleague says: \"We already know what to build — let's not waste two weeks on discovery.\" Based on this course, what's the strongest response?",
          options: [
            "They're right if the team is confident; discovery is mostly for risky bets",
            "Two weeks defining the problem, checking the market, and validating with a few real users is cheap insurance against months spent building the wrong thing",
            "Agree, but do the discovery quietly in parallel after building starts"
          ],
          correct: 1,
          explanation: "The cost of structured discovery is small and known. The cost of skipping it — building a solution to a misunderstood problem — is large and shows up late."
        }
      ],
      reflection: {
        prompt: "Take one thing your team is about to build. Write its problem statement in three sentences (pain / who / why current options fall short), and name one assumption in it you could test with three user conversations this week."
      }
    }
  ]
};
