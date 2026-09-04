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
  recap: [
    "Start every feature with a written problem statement — the pain, who has it, and why current options fall short — before any design.",
    "Your 'users' are usually several groups (daily users, buyers, influencers); build a simple persona for each, covering their day, goals, and constraints.",
    "Real research is primary (interviews, pilots) plus secondary (existing reports, competitor docs), and a competitive analysis that hunts for the gaps.",
    "Validate before you build: ship a focused MVP to a small representative group and watch usability, stated feedback, and analytics together.",
    "The sequence — problem, market, validate, then build — isn't hard; the discipline is doing it before you've sunk resources into a solution."
  ],
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
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin:0 0 16px;">
          <div style="border-top:3px solid #C0622A; background:#FCEFE9; border-radius:8px; padding:12px 14px;">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#C0622A; margin-bottom:6px;">Not a problem statement</div>
            <div style="font-size:13px; line-height:1.5;">"Redesign the billing screen so it feels more modern."<br><span style="color:var(--gray);">Names a solution and a vibe — no pain, no people, no cost.</span></div>
          </div>
          <div style="border-top:3px solid #2E8B57; background:#EEF9F1; border-radius:8px; padding:12px 14px;">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#2E8B57; margin-bottom:6px;">A problem statement</div>
            <div style="font-size:13px; line-height:1.5;">"Support staff spend about six hours a week reconciling billing by hand, which delays invoicing and introduces errors."<br><span style="color:var(--gray);">Pain, who, and the cost — with no solution baked in.</span></div>
          </div>
        </div>
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
        <p>A real market assessment is more than a survey. It's two kinds of research plus a look at the competition — and they all feed one question.</p>
        <svg viewBox="0 0 400 138" style="width:100%; height:auto; margin:4px 0 2px;">
          <defs>
            <marker id="dnResArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g font-family="'Space Grotesk',sans-serif" font-size="9.5" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="8" y="14" width="120" height="30" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="68" y="27">Primary</text><text x="68" y="39" font-size="7.5" font-weight="400" fill="#4B5768">interviews, pilots</text>
            <rect x="8" y="54" width="120" height="30" rx="8" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="68" y="67">Secondary</text><text x="68" y="79" font-size="7.5" font-weight="400" fill="#4B5768">reports, competitor docs</text>
            <rect x="8" y="94" width="120" height="30" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="68" y="107">Competitive</text><text x="68" y="119" font-size="7.5" font-weight="400" fill="#4B5768">features, UX, pricing</text>
            <rect x="250" y="52" width="140" height="34" rx="10" fill="#F7F9FC" stroke="#9AA3AD" stroke-width="1.3"/><text x="320" y="66">Where's the gap?</text><text x="320" y="78" font-size="7.5" font-weight="400" fill="#4B5768">that's your opening</text>
          </g>
          <line x1="128" y1="29" x2="248" y2="62" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#dnResArrow)"/>
          <line x1="128" y1="69" x2="248" y2="69" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#dnResArrow)"/>
          <line x1="128" y1="109" x2="248" y2="76" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#dnResArrow)"/>
        </svg>
      `,
      steps: [
        { title: "Primary research", detail: "Talk to people directly — interviews, small focus groups, pilot programs. This is where you learn the workflow frustrations and gaps you'd never guess from the outside. A handful of honest conversations beats a hundred survey responses to a vague question." },
        { title: "Secondary research", detail: "Read what already exists: industry reports, analyst write-ups, competitor documentation, regulatory guidance. It's cheap, it's fast, and it tells you the shape of the landscape before you spend time in it." },
        { title: "Competitive analysis", detail: "For the problem you're targeting, look at how competitors address it: their features and functionality, their user experience and where it frustrates people, and their pricing and value proposition. The gaps you find are your opportunities." }
      ],
      checks: [
        {
          question: "You have two weeks for discovery on a product area you don't know well. What's the most efficient first move?",
          options: [
            "Book a full two weeks of user interviews right away",
            "Spend the first day or two on secondary research — reports, competitor docs, analyst write-ups — to map the landscape before you talk to anyone",
            "Send a broad survey and wait for the responses to come in"
          ],
          correct: 1,
          explanation: "Secondary research is cheap and fast and tells you the shape of the space. Going in with that context makes the primary research (the interviews) far sharper."
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
        <p><strong>Then put it in front of a small, representative group</strong> and watch three things at once:</p>
        <svg viewBox="0 0 400 118" style="width:100%; height:auto; margin:4px 0 2px;">
          <g font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="10" y="18" width="118" height="34" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="69" y="32">Usability test</text><text x="69" y="44" font-size="7.5" font-weight="400" fill="#4B5768">where they hesitate</text>
            <rect x="141" y="18" width="118" height="34" rx="8" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="200" y="32">Survey / interview</text><text x="200" y="44" font-size="7.5" font-weight="400" fill="#4B5768">what they say</text>
            <rect x="272" y="18" width="118" height="34" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="331" y="32">Analytics</text><text x="331" y="44" font-size="7.5" font-weight="400" fill="#4B5768">what they do</text>
          </g>
          <text x="200" y="82" text-anchor="middle" font-family="sans-serif" font-size="9.5" fill="#4B5768">A gap between what they <tspan font-style="italic">say</tspan> and what they <tspan font-style="italic">do</tspan> is a finding, not noise.</text>
        </svg>
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
