/* ================================================================
   COURSE CONTENT: Execution & Delivery, Lots of Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 12 Sections 1 & 3 ("Scalable Infrastructure",
   "Navigating Compliance") and Chapter 9 Section 5 ("Navigating
   Regulatory Change Management")
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["execution-experienced"] = {
  sourceUrl: "",
  recap: [
    "Reliable complex delivery comes from building contingency for the unexpected, not hoping it won't happen.",
    "Design for failure: redundancy and load balancing, proactive monitoring that beats your users to the problem, an incident plan written before you need it.",
    "Rehearse the peak — load-test past expected traffic to find the specific bottlenecks while it's cheap to fix them.",
    "Build compliance and quality checkpoints into the process — involve constrained partners at planning time, not the pre-launch review.",
    "Handle changing requirements with a standing change-management framework: named assessors, an impact process, update protocols, risk categorization."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Contingency vs. Hope",
      preCheck: {
        label: "Before you read on — predict",
        question: "Two teams run complex, cross-team launches. One consistently delivers reliably; one gets burned by \"unforeseeable\" problems. What most often separates them?",
        options: [
          "The reliable team has more talented engineers",
          "The reliable team builds in real contingency for the unexpected instead of assuming things will go smoothly",
          "The reliable team has smaller projects"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. This is about the difference between planning for failure and hoping it doesn't happen."
      },
      body: `
        <p>At an experienced level, the job is delivering complex, cross-team initiatives <strong>reliably</strong>. The thing that makes delivery reliable isn't better luck, it's building in contingency for the unexpected rather than hoping nothing goes wrong.</p>
        <p>"Hope" as an execution strategy looks like: a single path with no fallback, monitoring that tells you a system is down after users do, a launch plan with no rollback, a regulatory or security requirement discovered late. Every one of those is a place where a normal, expectable problem turns into a crisis.</p>
        <p>Contingency is the practice of assuming those problems <em>will</em> occur and deciding in advance how the system and the plan absorb them. This course is four applications of that idea.</p>
      `,
      checks: [
        {
          question: "What does the lesson mean by \"hope as an execution strategy\"?",
          options: [
            "Being optimistic in team communications",
            "A single path with no fallback, monitoring that lags users, launches with no rollback, requirements found late — normal problems left to become crises",
            "Not tracking project risks in a document"
          ],
          correct: 1,
          explanation: "Hope is when an expectable failure has no planned absorption. Contingency is deciding in advance how the system and plan handle it."
        },
        {
          question: "What actually makes complex delivery reliable, according to this lesson?",
          options: [
            "Assigning the strongest engineers to every project",
            "Assuming problems will occur and building in advance how the system and the plan absorb them",
            "Keeping projects small enough that little can go wrong"
          ],
          correct: 1,
          explanation: "Reliability at scale comes from designed contingency, not from talent or from avoiding complexity."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Design for Failure",
      body: `
        <p>A reliable system assumes its own components will fail and keeps working anyway.</p>
        <svg viewBox="0 0 400 130" style="width:100%; height:auto; margin:4px 0 2px;">
          <rect x="24" y="50" width="70" height="30" rx="6" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/>
          <text x="59" y="69" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">traffic</text>
          <path d="M94 65 L134 65" stroke="#9AA3AD" stroke-width="1.5"/>
          <rect x="134" y="50" width="70" height="30" rx="6" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/>
          <text x="169" y="69" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">balancer</text>
          <path d="M204 60 L250 30" stroke="#9AA3AD" stroke-width="1.5"/>
          <path d="M204 65 L250 65" stroke="#9AA3AD" stroke-width="1.5"/>
          <path d="M204 70 L250 100" stroke="#9AA3AD" stroke-width="1.5"/>
          <rect x="250" y="16" width="60" height="26" rx="5" fill="#F7F9FC" stroke="#1A4584" stroke-width="1"/><text x="280" y="33" text-anchor="middle" font-family="sans-serif" font-size="8.5" fill="#4B5768">node A</text>
          <rect x="250" y="52" width="60" height="26" rx="5" fill="#F7F9FC" stroke="#1A4584" stroke-width="1"/><text x="280" y="69" text-anchor="middle" font-family="sans-serif" font-size="8.5" fill="#4B5768">node B</text>
          <rect x="250" y="88" width="60" height="26" rx="5" fill="#F7F9FC" stroke="#9AA3AD" stroke-width="1" stroke-dasharray="3 2"/><text x="280" y="105" text-anchor="middle" font-family="sans-serif" font-size="8.5" fill="#9AA3AD">node C down</text>
          <text x="340" y="69" font-family="sans-serif" font-size="8" fill="#9AA3AD" text-anchor="middle">still up</text>
        </svg>
        <p>The building blocks: <strong>redundancy and load balancing</strong> so one failed component doesn't take the product down; <strong>proactive monitoring and alerting</strong> so you detect a degradation before users report it; and an <strong>incident response plan written before you need it</strong>, who's on call, how you communicate, how you roll back, so a 2 a.m. outage runs on a script instead of improvisation.</p>
      `,
      checks: [
        {
          question: "Why is \"proactive monitoring and alerting\" a contingency measure and not just an ops nicety?",
          options: [
            "It produces dashboards for status meetings",
            "It's the difference between detecting a degradation yourself and finding out from an angry user — which determines how much time you have to respond",
            "It replaces the need for redundancy"
          ],
          correct: 1,
          explanation: "Contingency is about response time. Monitoring that beats your users to the problem is what turns an incident into a controlled fix rather than a public one."
        },
        {
          question: "What's the value of writing the incident response plan before an incident?",
          options: [
            "It's required for compliance audits",
            "A 2 a.m. outage then runs on a prepared script — who's on call, how to communicate, how to roll back — instead of being improvised under pressure",
            "It lets you skip the post-mortem"
          ],
          correct: 1,
          explanation: "Decisions made calmly in advance are far better than decisions made at 2 a.m. mid-outage. The plan is the contingency."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Rehearse the Peak",
      body: `
        <p>The failures that hurt most are the ones that only appear under load, a launch spike, a seasonal surge, a big new customer going live. Hoping the system holds is not a plan; rehearsing is.</p>
        <p><strong>Performance testing and load simulation</strong> mean deliberately pushing the system to and past its expected peak in a controlled setting, so you find the bottleneck, the query that falls over, the queue that backs up, the memory that leaks, before real traffic finds it for you.</p>
        <p>The output isn't just "it passed." It's a known ceiling ("we're solid to 3x current load, degraded past that") and a list of the specific things that break first, which becomes your pre-launch fix list and your scaling roadmap.</p>
      `,
      checks: [
        {
          question: "What's the goal of deliberately load-testing past your expected peak?",
          options: [
            "To prove the system can handle anything",
            "To find the specific bottlenecks that break first — under controlled conditions, before real traffic finds them",
            "To generate a performance benchmark for marketing"
          ],
          correct: 1,
          explanation: "You're not trying to pass; you're trying to locate the failure points while it's cheap to fix them and nobody's watching."
        },
        {
          question: "Beyond \"it passed,\" what should load testing produce?",
          options: [
            "A single throughput number",
            "A known ceiling (solid to X, degraded past that) and a ranked list of what breaks first — feeding the pre-launch fix list and the scaling roadmap",
            "A recommendation to buy more servers"
          ],
          correct: 1,
          explanation: "The useful artifacts are the known safe range and the ordered list of first failures. Those turn a vague worry into a concrete plan."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Build Checkpoints Into the Process",
      body: `
        <p>The other source of late crises is a constraint discovered late, a security requirement, a legal review, a compliance rule that should have shaped the design and instead forces a rebuild. The fix is structural: put the checkpoints in the process, not at the end of it.</p>
      `,
      steps: [
        { title: "Involve constrained partners at planning time", detail: "Bring security, legal, and compliance into the planning phase of a new initiative, not the review before launch. They identify the requirements that shape the design while the design is still cheap to change." },
        { title: "Set checkpoints at key stages", detail: "Define explicit review points in the development process — after design, before build, before release — where adherence to the relevant requirements is checked. A gate you pass through beats a surprise you hit." },
        { title: "Document the checks", detail: "Keep records of the risk assessments, reviews, and decisions. When a question comes up later — internal or external — the answer is a document, not a scramble." },
        { title: "Treat the constraint as an input, not a blocker", detail: "The teams that do this well collaborate with the constrained function to find a compliant way to do the thing, rather than treating the requirement as the enemy of shipping." }
      ],
      checks: [
        {
          question: "Why involve security, legal, or compliance at planning time rather than pre-launch review?",
          options: [
            "To share the blame if something goes wrong",
            "They surface the requirements that shape the design while the design is still cheap to change — avoiding a late rebuild",
            "Because pre-launch review is optional if planning review happened"
          ],
          correct: 1,
          explanation: "A constraint found at planning is a design input. The same constraint found at launch is a rework order. Moving the checkpoint earlier is the contingency."
        },
        {
          question: "What's the purpose of documenting risk assessments and reviews as you go?",
          options: [
            "To create busywork that slows the team down",
            "So that when a question comes up later — internal or external — the answer is an existing record rather than a scramble to reconstruct it",
            "To satisfy the project management tool's fields"
          ],
          correct: 1,
          explanation: "Documented-as-you-go is itself a contingency: it means a future audit or incident review is a lookup, not an emergency archaeology project."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: A Framework for Change",
      body: `
        <p>The last unexpected thing to plan for is the requirements changing mid-flight, a new regulation, a platform policy shift, a contractual obligation. Experienced teams handle this with a standing <strong>change management framework</strong> rather than treating each change as a one-off fire.</p>
        <p>The framework defines, in advance:</p>
        <ul>
          <li><strong>Who assesses a change</strong> — the named people (product, engineering, and whichever constrained function applies) who evaluate it.</li>
          <li><strong>An impact assessment process</strong> — a repeatable way to work out what a change affects: which features, which workflows, which commitments.</li>
          <li><strong>Update protocols</strong> — how a change gets rolled out, including testing and user communication.</li>
          <li><strong>Risk categorization</strong> — high / medium / low, with high-risk changes folded into the next roadmap planning cycle rather than bolted on.</li>
        </ul>
        <p>Put together with the earlier lessons: design for failure, rehearse the peak, checkpoint the constraints, and framework the changes. That's contingency instead of hope, across the whole delivery.</p>
      `,
      checks: [
        {
          question: "What does a change management framework give you that handling each change ad hoc doesn't?",
          options: [
            "A way to reject changes you don't want to make",
            "A predefined process — who assesses, how impact is measured, how it rolls out, how it's prioritized — so a mid-flight requirement change is absorbed rather than becoming a fire drill",
            "Fewer changes overall"
          ],
          correct: 1,
          explanation: "The framework turns \"a new rule just landed\" from a scramble into a known procedure. That's the same contingency principle applied to changing requirements."
        },
        {
          label: "Bringing it together",
          question: "You're planning a complex launch across three teams with a hard external deadline. Based on this course, which combination best reduces the odds of a crisis?",
          options: [
            "Add a two-week buffer and assign your best people to the riskiest team",
            "Redundancy and monitoring with a written incident plan, a load test past expected peak, security/compliance reviewed at planning with staged checkpoints, and a change process ready if requirements shift",
            "Freeze scope, forbid changes, and escalate hard if anything slips"
          ],
          correct: 1,
          explanation: "That's the four contingencies together. Buffers and scope freezes are hope with extra steps; designed absorption of failure, load, constraints, and change is what makes the launch reliable."
        }
      ],
      reflection: {
        prompt: "Take a launch or delivery you're responsible for. For each of the four — component failure, load spike, a late-discovered constraint, a mid-flight requirement change — write down what currently happens if it occurs. Which one has no plan at all?"
      }
    }
  ]
};
