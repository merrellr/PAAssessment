/* ================================================================
   COURSE CONTENT: Product Strategy & Roadmapping, No Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 6, "Managing Product Roadmaps", Sections 1-2
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["strategy-novice"] = {
  sourceUrl: "",
  recap: [
    "A roadmap bridges vision and execution — not a prioritized request list; if the reason an item exists is 'someone asked', it's a backlog with a layout.",
    "Keep strategic and tactical separate: themes and milestones belong on the roadmap; epics, features, and tasks belong in the backlog.",
    "Map every theme to a specific business objective (revenue, expansion, retention); if you can't draw that line, it probably isn't a theme.",
    "Prioritize themes systematically: non-negotiables first (compliance, security), then by impact on mapped goals, reassessed quarterly.",
    "Give each theme a realistic, time-bound milestone — a dated checkpoint is what catches strategy-versus-execution drift early."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: A Roadmap Is Not a Feature List",
      preCheck: {
        label: "Before you read on — predict",
        question: "Your team's \"roadmap\" is a prioritized list of the features customers and stakeholders have asked for. What's missing?",
        options: [
          "Nothing — a prioritized request list is what a roadmap is",
          "The connection to strategy: which direction the product is heading and why these items serve it",
          "More detail on each feature's implementation"
        ],
        correct: 1,
        explanation: "Hold that thought. This lesson is about what turns a list into a roadmap."
      },
      body: `
        <p>A roadmap is a <strong>strategic communication tool</strong>. Its job is to bridge the gap between where the product is going (the vision) and what the team does next (execution). A prioritized pile of requests doesn't do that job, it tells you what's next, but not why, or where it all adds up to.</p>
        <p>The difference shows up in how you'd answer a simple question: <em>"Why is this on the roadmap?"</em></p>
        <ul>
          <li>Feature list answer: <em>"Three customers asked for it and it's not too hard."</em></li>
          <li>Roadmap answer: <em>"It moves us toward [a specific direction the product is committed to], and here's the milestone it belongs to."</em></li>
        </ul>
        <p>If you can't give the second kind of answer for most items, you have a backlog with a nice layout, not a roadmap.</p>
      `,
      checks: [
        {
          question: "What is a roadmap's core job, according to this lesson?",
          options: [
            "To list every committed feature with delivery dates",
            "To bridge the product's vision and the team's execution — to show where the work is heading and why",
            "To record which stakeholders requested which features"
          ],
          correct: 1,
          explanation: "A roadmap connects direction to action. Without that connection it's just a schedule of tasks."
        },
        {
          question: "How can you tell a feature list from a real roadmap?",
          options: [
            "A roadmap has more items on it",
            "For most roadmap items you can explain which direction they move the product toward; for a feature list, the answer is usually \"someone asked\"",
            "A roadmap uses a timeline view instead of a table"
          ],
          correct: 1,
          explanation: "The test is the \"why.\" If the reason an item exists is a request count rather than a direction, it's a backlog with a layout."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Strategic vs. Tactical",
      body: `
        <p>Roadmap work operates on two levels, and confusing them is where a lot of roadmaps go wrong.</p>
        <svg viewBox="0 0 400 160" style="width:100%; height:auto; margin:4px 0 2px;">
          <polygon points="200,14 320,58 80,58" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.3"/>
          <polygon points="80,62 320,62 350,106 50,106" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.3"/>
          <polygon points="50,110 350,110 380,150 20,150" fill="#F7F9FC" stroke="#9AA3AD" stroke-width="1.3"/>
          <g font-family="'Space Grotesk',sans-serif" text-anchor="middle" fill="#12305e">
            <text x="200" y="46" font-size="11" font-weight="700">Themes / milestones</text>
            <text x="200" y="90" font-size="11" font-weight="700">Epics / features</text>
            <text x="200" y="134" font-size="11" font-weight="700">Tasks</text>
          </g>
        </svg>
        <p><strong>Strategic planning</strong> defines the high-level themes and milestones that support the vision, "improve onboarding completion," "reach enterprise readiness," "cut time-to-value in half." That's what belongs on the roadmap.</p>
        <p><strong>Tactical planning</strong> breaks those themes into epics, features, and tasks for the development team. That's what belongs in the backlog and sprint plan.</p>
        <p>A roadmap crowded with individual tasks has stopped being strategic. A roadmap of themes with no tactical breakdown underneath is untethered. You need both levels, kept in their own places.</p>
      `,
      checks: [
        {
          question: "Which of these belongs on the roadmap itself, rather than in the backlog?",
          options: [
            "\"Add a 'resend invite' button to the team-settings page\"",
            "\"Reach enterprise readiness this year\" as a theme, with milestones under it",
            "\"Fix the pagination bug on the audit-log screen\""
          ],
          correct: 1,
          explanation: "Themes and milestones are strategic and belong on the roadmap. Individual buttons and bug fixes are tactical — they live in the backlog."
        },
        {
          question: "What's wrong with a roadmap that's a long list of individual features and tasks?",
          options: [
            "It's too detailed to fit on one screen",
            "It has stopped being strategic — it shows activity, not direction",
            "Nothing, as long as the tasks are prioritized"
          ],
          correct: 1,
          explanation: "When the roadmap operates at task level, it can't answer \"where are we heading?\" It's a work queue wearing a roadmap's name."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Link Every Theme to a Business Objective",
      body: `
        <p>A roadmap that reflects strategy is one where each theme maps to a specific business goal, revenue growth, market expansion, retention, adoption. If you can't draw that line for a theme, it probably shouldn't be a theme.</p>
        <svg viewBox="0 0 400 156" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="snMap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g font-family="'Space Grotesk',sans-serif" font-size="8" font-weight="700" text-anchor="middle" fill="#12305e">
            <text x="86" y="12">Theme</text>
            <text x="314" y="12">Business objective</text>
          </g>
          <rect x="10" y="20" width="152" height="30" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.1"/>
          <rect x="10" y="62" width="152" height="30" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.1"/>
          <rect x="10" y="104" width="152" height="30" rx="5" fill="#F7F9FC" stroke="#9AA3AD" stroke-width="1.1" stroke-dasharray="3 2"/>
          <rect x="238" y="20" width="152" height="30" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.1"/>
          <rect x="238" y="62" width="152" height="30" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.1"/>
          <rect x="238" y="104" width="152" height="30" rx="5" fill="#FBF0E9" stroke="#C0622A" stroke-width="1.1"/>
          <g font-family="sans-serif" font-size="8" text-anchor="middle">
            <text x="86" y="39" fill="#12305e">Cut onboarding drop-off</text>
            <text x="86" y="81" fill="#12305e">Ship SSO + audit log</text>
            <text x="86" y="123" fill="#6b7480">Refresh the settings screen</text>
            <text x="314" y="39" fill="#12305e">Retention</text>
            <text x="314" y="81" fill="#12305e">Enterprise expansion</text>
            <text x="314" y="123" fill="#7a3d18">? &#8212; no objective</text>
          </g>
          <line x1="164" y1="35" x2="236" y2="35" stroke="#9AA3AD" stroke-width="1.2" marker-end="url(#snMap)"/>
          <line x1="164" y1="77" x2="236" y2="77" stroke="#9AA3AD" stroke-width="1.2" marker-end="url(#snMap)"/>
          <line x1="164" y1="119" x2="236" y2="119" stroke="#C0622A" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#snMap)"/>
          <text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="8.5" fill="#4B5768">If a theme's arrow lands on "?", it belongs in the backlog, not the roadmap.</text>
        </svg>
        <p>Two moves make this real:</p>
        <ul>
          <li><strong>Map themes to objectives explicitly.</strong> Not "improve the dashboard" but "improve the dashboard <em>to reduce the support volume that's capping our margin.</em>" The objective is part of the theme's definition.</li>
          <li><strong>Get leadership buy-in on the mapping.</strong> Walk the leadership team through how each theme supports a strategic goal. Their agreement is what lets the roadmap survive the next reprioritization argument, because the priorities are already tied to goals everyone signed off on.</li>
        </ul>
      `,
      checks: [
        {
          question: "The lesson says each roadmap theme should map to a business objective. What follows if you can't draw that line for a theme?",
          options: [
            "Add it anyway and find a justification later",
            "It probably shouldn't be a theme — the mapping to a goal is part of what makes something roadmap-worthy",
            "Move it to the top of the roadmap so it gets attention"
          ],
          correct: 1,
          explanation: "A theme with no connection to a strategic goal is just a preference. The link to an objective is the qualifier."
        },
        {
          question: "Why get leadership to agree on the theme-to-objective mapping up front?",
          options: [
            "It's a required approval step in most companies",
            "When priorities are already tied to goals leadership signed off on, the roadmap holds up better under the next reprioritization pressure",
            "It shifts responsibility for the roadmap to leadership"
          ],
          correct: 1,
          explanation: "Pre-agreed mapping turns a future \"why are we doing this?\" into \"we agreed this serves goal X.\" That's what makes a roadmap defensible."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Prioritizing the Themes",
      body: `
        <p>Even a strategy-linked roadmap has more themes than capacity. Prioritizing them is a systematic process, not a vibe.</p>
      `,
      steps: [
        { title: "Non-negotiables first", detail: "Some things aren't optional — regulatory mandates, security requirements, contractual commitments. These go to the top regardless of their appeal, because the cost of skipping them is severe and non-linear." },
        { title: "Then prioritize by impact", detail: "For everything else, use impact analysis: estimate each theme's expected contribution to the business goals you mapped it to — revenue, adoption, retention — and rank on that. Effort is a tiebreaker, not the primary axis." },
        { title: "Reassess on a cadence", detail: "Re-evaluate the theme order quarterly, or whenever market conditions shift. A roadmap that's prioritized once and then frozen goes stale; one that's re-ranked every quarter stays honest." }
      ],
      checks: [
        {
          question: "You're ranking five optional themes. One is a two-day change three customers asked for; another is a six-week rebuild the revenue model depends on. How does this lesson say to order them?",
          options: [
            "Quick win first, small effort and fast value, then tackle the big rebuild",
            "The revenue-model rebuild ranks higher: impact on the mapped goal leads, and effort is only a tiebreaker",
            "Whichever has more customer requests attached goes first"
          ],
          correct: 1,
          explanation: "Impact on mapped goals leads; effort is a tiebreaker. Ranking primarily by ease is how you end up busy but not moving."
        },
        {
          question: "Why does the lesson call for quarterly reassessment of theme priority?",
          options: [
            "To give the impression of activity to stakeholders",
            "A roadmap prioritized once and frozen goes stale as the market moves — periodic re-ranking keeps it honest",
            "Because quarterly is when budgets are set"
          ],
          correct: 1,
          explanation: "Priorities are a snapshot of what mattered when you made them. Revisiting them on a cadence keeps the roadmap aligned with current reality."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Realistic, Time-Bound Milestones",
      body: `
        <p>The last piece is milestones that are both <strong>realistic</strong> and <strong>time-bound</strong>. Milestones are how a theme stops being an aspiration and becomes something you can track, "onboarding completion at 70% by end of Q2," not "make onboarding better, ongoing."</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin:2px 0 14px;">
          <div style="border-top:3px solid #C0622A; background:#FBF3EF; border-radius:6px; padding:10px 12px;">
            <strong style="font-size:12px; color:#7a3d18;">Can't catch drift</strong>
            <p style="margin:6px 0 0; font-size:13px;">"Make onboarding better &mdash; ongoing."</p>
          </div>
          <div style="border-top:3px solid #2E8B57; background:#EEF7F1; border-radius:6px; padding:10px 12px;">
            <strong style="font-size:12px; color:#256b45;">A milestone you can track</strong>
            <p style="margin:6px 0 0; font-size:13px;">"Onboarding completion at 70% by the end of Q2."</p>
          </div>
        </div>
        <p>When milestones are vague or fantasy-dated, strategy and execution drift apart: the roadmap says one thing, the team is doing another, and nobody notices for a quarter. A realistic, dated milestone is the checkpoint that catches the drift early.</p>
        <p>Putting the whole chapter together: a real roadmap is <em>themes tied to business objectives, prioritized systematically, broken into realistic time-bound milestones,</em> and communicated as direction rather than a task list. That's the difference between "we have a roadmap" and "we have a prioritized backlog."</p>
      `,
      checks: [
        {
          question: "What makes a milestone useful, per this lesson?",
          options: [
            "It's ambitious enough to motivate the team",
            "It's realistic and time-bound — a specific, dated checkpoint you can actually track against",
            "It's broad enough to stay relevant all year"
          ],
          correct: 1,
          explanation: "\"Improve onboarding, ongoing\" can't catch drift. \"Onboarding completion at 70% by end of Q2\" can."
        },
        {
          label: "Bringing it together",
          question: "You inherit a \"roadmap\" that's a ranked list of 25 requested features. Based on this course, what's the first thing to do?",
          options: [
            "Re-rank the 25 features by effort so the team can start on quick wins",
            "Group them into a handful of themes, map each theme to a business objective (dropping any that don't map), and set a realistic dated milestone per theme",
            "Add delivery dates to all 25 so stakeholders know what to expect"
          ],
          correct: 1,
          explanation: "That's the transformation the course describes: from feature list to themes-tied-to-objectives with milestones. Re-ranking or dating the existing list keeps it a backlog."
        }
      ],
      reflection: {
        prompt: "Take your current roadmap or backlog. Pick three items. For each, write the business objective it serves in one sentence. If you can't, that tells you something — note which ones."
      }
    }
  ]
};
