/* ================================================================
   COURSE CONTENT: Execution & Delivery, No Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 15 Section 3 ("Executing with Agility") and Chapter 12
   Section 2 ("Balancing Quality with Growth")
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["execution-novice"] = {
  sourceUrl: "",
  recap: [
    "End-of-project surprises are a structure problem: one large batch means the first real test comes when there's no time to react.",
    "Work in tested increments — a focused MVP scope, an agile cadence, a beta to a select group — so problem signals arrive continuously.",
    "Automate the checks: tests on every change catch a break in isolation the day it's introduced; CI/CD removes the manual steps where error and delay creep in.",
    "Track a few quality numbers — defect rate, downtime, cycle time — reviewed every sprint so a bad trend is caught while it's small.",
    "Small scope, cadence, automated checks, and metrics all move the moment you learn about a problem earlier; that's what makes timelines predictable."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Why Surprises Show Up Late",
      preCheck: {
        label: "Before you read on — predict",
        question: "Your projects tend to look fine until the last week, then problems appear all at once. What's the most common structural cause?",
        options: [
          "The team isn't working hard enough in the early weeks",
          "Work is done in one large batch, so there's no early signal — the first real test of whether it works comes at the end",
          "Estimates are always too optimistic and can't be fixed"
        ],
        correct: 1,
        explanation: "Hold that thought. This lesson is about why late surprises happen and how the shape of the work causes them."
      },
      body: `
        <p>Unpredictable timelines and end-of-project surprises usually aren't a discipline problem. They're a <strong>structure</strong> problem. When a piece of work is built as one large batch and only integrated and tested near the end, the first honest signal about whether it works, whether it fits together, whether the estimate held, arrives when there's no time left to react.</p>
        <p>The fix isn't working harder early. It's changing the shape of the work so that signal arrives continuously:</p>
        <ul>
          <li>Smaller increments that each get integrated and tested.</li>
          <li>A regular cadence for gathering feedback.</li>
          <li>Automated checks that flag problems the day they appear, not the week before launch.</li>
        </ul>
      `,
      checks: [
        {
          question: "According to this lesson, what's the structural cause of end-of-project surprises?",
          options: [
            "The team not putting in enough effort early on",
            "Work built as one large batch, so the first real test of whether it works comes at the end when there's no time to react",
            "Stakeholders changing requirements mid-project"
          ],
          correct: 1,
          explanation: "One big batch means one late moment of truth. Breaking the work up moves that moment of truth earlier and repeats it."
        },
        {
          question: "What's the proposed fix?",
          options: [
            "Add a buffer week to every estimate",
            "Change the shape of the work — smaller integrated-and-tested increments, a feedback cadence, automated checks — so problem signals arrive continuously",
            "Freeze scope at the start and refuse all changes"
          ],
          correct: 1,
          explanation: "The goal is continuous signal. Buffers and scope freezes don't tell you sooner whether the work is on track; smaller increments do."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Work in Increments, Get Feedback Early",
      body: `
        <p>The core practice is delivering value <strong>incrementally and iteratively</strong> instead of all at once.</p>
        <svg viewBox="0 0 400 140" style="width:100%; height:auto; margin:4px 0 2px;">
          <text x="70" y="18" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="10" font-weight="700" fill="#9AA3AD">BIG BATCH</text>
          <rect x="24" y="28" width="92" height="30" rx="4" fill="#F7F9FC" stroke="#9AA3AD" stroke-width="1.2"/>
          <text x="70" y="47" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#4B5768">build build build</text>
          <circle cx="128" cy="43" r="6" fill="#C0622A"/>
          <text x="128" y="70" text-anchor="middle" font-family="sans-serif" font-size="7.5" fill="#9AA3AD">first test, no time left</text>
          <text x="70" y="96" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="10" font-weight="700" fill="#1A4584">INCREMENTS</text>
          <g>
            <rect x="24" y="104" width="26" height="20" rx="3" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><circle cx="54" cy="114" r="4" fill="#2E8B57"/>
            <rect x="66" y="104" width="26" height="20" rx="3" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><circle cx="96" cy="114" r="4" fill="#2E8B57"/>
            <rect x="108" y="104" width="26" height="20" rx="3" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><circle cx="138" cy="114" r="4" fill="#2E8B57"/>
            <rect x="150" y="104" width="26" height="20" rx="3" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><circle cx="180" cy="114" r="4" fill="#2E8B57"/>
          </g>
          <text x="230" y="118" font-family="sans-serif" font-size="7.5" fill="#9AA3AD">tested every step</text>
        </svg>
        <p>Three habits make this concrete: <strong>define a small MVP scope</strong>, the essential features that address the core need without overextending; <strong>adopt an agile cadence</strong> (Scrum or Kanban) so you iterate, gather feedback, and adjust on a rhythm; and <strong>run a beta</strong>, release early to a select group of users to measure performance and find rough edges before a full launch.</p>
      `,
      checks: [
        {
          question: "What's the point of defining a small MVP scope?",
          options: [
            "To ship something quickly so stakeholders stop asking",
            "To deliver the essential features that address the core need and validate assumptions, without overextending resources on a big batch",
            "To avoid having to write a spec"
          ],
          correct: 1,
          explanation: "A tight MVP scope is the smallest increment that tests the core assumption. It's the first place a late surprise would otherwise hide."
        },
        {
          question: "Why release a beta to a select group before the full launch?",
          options: [
            "To generate marketing buzz",
            "To measure real performance and surface rough edges while there's still time to fix them, rather than discovering them at launch",
            "Because a beta label lowers user expectations"
          ],
          correct: 1,
          explanation: "A beta is a controlled early test with real users. It converts \"we hope this works\" into evidence, before the stakes are highest."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Automate the Checks",
      body: `
        <p>Increments only give you early signal if something is actually checking each one. Manual testing at the end of a project is exactly the late-signal problem again.</p>
        <ul>
          <li><strong>Automated tests</strong>, regression, functional, and security, run on every change, so a break is caught the day it's introduced by whoever introduced it, not weeks later by a user.</li>
          <li><strong>Continuous integration / continuous deployment (CI/CD)</strong> automates the build-and-release path. It removes the manual steps where human error creeps in and slows delivery, and it makes shipping a small change routine instead of an event.</li>
        </ul>
        <p>The combined effect: problems surface immediately and in isolation (this change broke this test), which is the opposite of a pile of unexplained failures in the final week.</p>
      `,
      checks: [
        {
          question: "How do automated tests running on every change reduce late surprises?",
          options: [
            "They replace the need for a QA team entirely",
            "A break is caught the day it's introduced, in isolation, rather than weeks later as one of many unexplained failures",
            "They make the code run faster"
          ],
          correct: 1,
          explanation: "Immediate, isolated failure signals (\"this change broke this test\") are far easier to fix than a batch of end-of-project failures with no obvious cause."
        },
        {
          question: "What does CI/CD contribute to predictable delivery?",
          options: [
            "It lets you skip testing before release",
            "It automates the build-and-release path, removing manual steps where human error and delay creep in, and makes shipping a small change routine",
            "It guarantees zero bugs in production"
          ],
          correct: 1,
          explanation: "When releasing is automated and low-drama, small increments can ship continuously — which is what keeps the feedback loop tight."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Track a Few Quality Numbers",
      body: `
        <p>You can't tell whether execution is actually improving without measuring it. Pick a small set of quality metrics and watch them.</p>
      `,
      steps: [
        { title: "Defect rate", detail: "How many bugs are found per release, or per feature. A rising defect rate as you add scope is an early warning that quality is slipping under the pace." },
        { title: "Downtime / reliability", detail: "How often the product is unavailable or degraded. This is the metric users feel most directly, and the one that turns into an angry escalation if you're not watching it." },
        { title: "Cycle time", detail: "How long a change takes to go from started to shipped. Lengthening cycle time means the delivery path is getting clogged — worth catching before it becomes \"why is everything late?\"" },
        { title: "Review the numbers on a cadence", detail: "Look at these every sprint or every release, not once a quarter. The point is to see a trend turning bad while it's still small." }
      ],
      checks: [
        {
          question: "Why watch defect rate as you add scope to a product?",
          options: [
            "To decide who to blame for bugs",
            "A rising defect rate is an early warning that quality is slipping under the delivery pace — before it turns into a visible failure",
            "Because low defect counts look good in reports"
          ],
          correct: 1,
          explanation: "The metric is a smoke detector. A trend you can see this sprint is a problem you can address; one you notice at launch is a fire."
        },
        {
          question: "What does lengthening cycle time usually indicate?",
          options: [
            "The team is being more careful, which is good",
            "The delivery path is getting clogged — a signal to catch before it becomes \"why is everything late?\"",
            "Nothing actionable; cycle time naturally drifts"
          ],
          correct: 1,
          explanation: "Cycle time is a health check on the pipeline itself. Rising cycle time is the quiet version of the unpredictable-timeline problem this course is about."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Predictability Is the Goal",
      body: `
        <p>Put the pieces together and the picture is simple: <strong>small scope</strong>, an <strong>agile cadence</strong>, <strong>automated checks</strong> on every change, and a <strong>few quality metrics</strong> reviewed regularly. Each one moves the moment you learn about a problem earlier.</p>
        <p>That's the whole difference between execution that "happens" with unpredictable timelines and execution you can forecast. You're not eliminating surprises, you're arranging the work so surprises are small and early instead of large and late.</p>
      `,
      checks: [
        {
          question: "What's the unifying idea across all four practices in this course?",
          options: [
            "They make the team work faster",
            "Each one moves the moment you learn about a problem earlier — so surprises are small and early rather than large and late",
            "They reduce the amount of documentation required"
          ],
          correct: 1,
          explanation: "Small increments, cadence, automated checks, and metrics are all mechanisms for earlier signal. Earlier signal is what makes timelines predictable."
        },
        {
          label: "Bringing it together",
          question: "A teammate proposes: \"Let's build the whole feature over six weeks, then spend the last week testing and fixing.\" Based on this course, what's the concern?",
          options: [
            "Six weeks is too long for any feature",
            "The plan concentrates all the risk into one late testing week — no early signal, so any integration or scope problem is discovered when it's hardest to fix",
            "The team should test for two weeks, not one"
          ],
          correct: 1,
          explanation: "That plan is the exact structure this course warns about. Splitting into tested increments with automated checks spreads the risk across the six weeks instead of stacking it at the end."
        }
      ],
      reflection: {
        prompt: "Think about your last project that ran late. Where was the first real signal that it would? Which of the four practices — smaller increments, feedback cadence, automated checks, quality metrics — would have surfaced that signal sooner?"
      }
    }
  ]
};
