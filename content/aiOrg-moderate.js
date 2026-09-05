/* ================================================================
   COURSE CONTENT: AI Fluency — Organizational, Moderate Experience
   Source article: "Stop enabling individuals. Start enabling the
   organization." (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.

   Interactive pattern used throughout this course (the template for
   future courses too):
   - "preCheck": one question shown BEFORE the lesson's body text,
     framed as a prediction. The body right below then reveals the
     real answer, so reading becomes checking a guess rather than
     passively absorbing information.
   - "checks": an array (not just one) of quick-check questions per
     lesson, so each idea in a lesson gets its own retrieval check
     instead of one question trying to cover everything.
   - The final lesson's last check is a "capstone" — labeled
     differently and requiring ideas from more than one earlier
     lesson to answer, since that's what actually distinguishes
     "read five lessons" from "understood the course."
   None of these block progress — every one is answerable and
   skippable, same as before.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiOrg-moderate"] = {
  sourceUrl: "https://www.linkedin.com/pulse/stop-enabling-individuals-start-organization-robert-merrell-uoboc/",
  recap: [
    "Know where your organization actually stands — scattered individual use is not organizational capability.",
    "Contained growth is one person's habit; compounding growth is a shared capability a whole team relies on.",
    "The governance and change-management case: durable AI needs shared processes, not just enthusiastic individuals.",
    "A practical five-step path takes you from individual experimentation to organizational capability.",
    "The bigger picture — build the capability that survives beyond any one person."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Where Your Organization Actually Stands",
      preCheck: {
        label: "Before you read on — predict",
        question: "If your company's best AI user quit tomorrow, what would happen to the team's AI capability?",
        options: [
          "Nothing changes — the knowledge stays with the team",
          "Most of it leaves with them",
          "The company automatically has documentation of everything they did"
        ],
        correct: 1,
        explanation: "That's exactly the fragility this lesson is about. Keep that prediction in mind as you read."
      },
      image: { src: "images/enablement-stages.png", alt: "Three stages of growth: Novice just breaking the surface, Individual enablement with shallow contained roots, Organizational enablement with a wide shared root system" },
      body: `
        <p>Most organizations sit in one of three stages. In the first, <strong>novice</strong>, AI adoption hasn't really started yet, it's just breaking the surface. In the second, <strong>individual enablement</strong>, a handful of curious employees have taught themselves to use AI tools well: clever prompts, real time saved, but contained to that one person.</p>
        <p>This second stage is where the majority of companies are stuck right now. It feels like progress, someone on the team is clearly getting value. But look closely at the roots: they're shallow and contained. If that person leaves, the knowledge leaves with them. If a new hire joins, they start from zero.</p>
        <p>The third stage, <strong>organizational enablement</strong>, has a wide, shared root system instead. The organization itself, not just a few power users, has durable capability that survives turnover and gets inherited by every new hire on day one.</p>
      `,
      checks: [
        {
          question: "Priya on the marketing team has become the go-to person for AI-written first drafts, but nobody else on the team really uses these tools yet. What stage is this?",
          options: [
            "Novice",
            "Individual enablement",
            "Organizational enablement"
          ],
          correct: 1,
          explanation: "This is individual enablement exactly: real value, but contained to Priya. If she's out sick or leaves, that capability goes with her."
        },
        {
          question: "What's the key difference between individual and organizational enablement?",
          options: [
            "Organizational enablement uses more expensive tools",
            "Individual enablement is contained to one person and disappears if they leave; organizational enablement survives turnover",
            "There's no real difference, just scale"
          ],
          correct: 1,
          explanation: "The root-system metaphor captures it well: individual enablement has shallow, contained roots. Organizational enablement has a wide, shared root system that doesn't depend on any one person."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Contained Growth vs. Compounding Growth",
      image: { src: "images/individual-vs-organizational.png", alt: "Building for the individual shown as a single contained potted plant; building for the organization shown as three connected trees sharing a root system" },
      body: `
        <p>When you build an AI habit or workflow for one person, you're optimizing that person's time. That's real value, but it's <strong>contained, isolated</strong>, like a plant in a pot. It scales only as far as their workload and only as long as they keep using it.</p>
        <p>When you build for a process instead, the value becomes <strong>connected and compounding</strong>. Drag the slider below to see how the gap between the two grows over time.</p>
      `,
      chart: {
        unit: "Month",
        maxX: 12,
        series: [
          { label: "Individual habit", color: "#9AA3AD", at: (m) => Math.min(m * 8, 40) },
          { label: "Organizational process", color: "#1A4584", at: (m) => Math.round(m * m * 1.2) }
        ]
      },
      checks: [
        {
          question: "Why does organizational value 'compound' in a way individual value doesn't?",
          options: [
            "Because more people are using the same AI subscription",
            "Because improvements to a shared process benefit everyone who touches it going forward, not just the original builder",
            "It doesn't actually compound, that's just a marketing term"
          ],
          correct: 1,
          explanation: "A shared process keeps paying off. Every fix or improvement made once benefits every future person who runs into that same workflow."
        },
        {
          question: "If Priya's drafting habit were rebuilt as a shared, monitored tool the whole team used, what would that shift represent?",
          options: [
            "No real shift, she'd still be doing the same work",
            "A move from individual to organizational enablement, from contained value to compounding value",
            "A downgrade, since fewer people would need to learn prompting"
          ],
          correct: 1,
          explanation: "This is the whole point of the shift: the same underlying skill, rebuilt as shared infrastructure, stops being capped by one person's time and starts compounding."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: The Governance and Change-Management Case",
      body: `
        <p>There's a governance angle that's easy to miss. Individual AI use is invisible to the organization, nobody knows what prompts are being run or what decisions are being informed by an ungoverned tool. Organizational tools live inside managed systems, where they can be monitored, versioned, and improved like any other piece of software.</p>
        <p>There's also a change-management angle. When AI capability lives in individual habits, adoption is fragile and uneven, some people embrace it, some ignore it, and leadership has little visibility into which is happening. When it lives in shared tools, adoption becomes something you can roll out, measure, and support, the same way you'd roll out any other piece of enterprise software.</p>
        <p>None of this means individual enablement doesn't matter, people still need to build comfort with these tools, and that comfort often generates the ideas that eventually become organizational tools. But if individual enablement is where you stop, you're leaving most of the value on the table.</p>
      `,
      checks: [
        {
          question: "Why is individual-only AI use a governance concern, specifically?",
          options: [
            "Because individual tools are always less accurate",
            "Because nobody in the organization can see what prompts are run or what decisions an ungoverned tool is quietly informing",
            "Because it costs more per person than a shared license"
          ],
          correct: 1,
          explanation: "Visibility is the issue. A shared, managed tool can be monitored and improved. Individual habits are invisible by default, good or bad, nobody else can see them."
        },
        {
          question: "Does individual AI enablement still matter once an organization starts building shared tools?",
          options: [
            "No, it becomes pointless and should be discouraged",
            "Yes, individual comfort with AI tools often generates the ideas that become organizational tools",
            "Only for employees who don't work with data"
          ],
          correct: 1,
          explanation: "Individual enablement is a starting point, not a dead end. The people experimenting on their own are often the ones who spot the first process worth automating for everyone."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: A Practical Five-Step Path",
      preCheck: {
        label: "Before you read on — predict",
        question: "When picking your organization's first AI-powered process to build, should you start with something ambitious and high-visibility, or something narrow and boring?",
        options: [
          "Ambitious and high-visibility, to prove it's worth the investment",
          "Narrow and boring, to maximize the odds of an actual first win"
        ],
        correct: 1,
        explanation: "See if the five steps below confirm this."
      },
      image: { src: "images/five-steps.png", alt: "Five growth stages labeled: Start narrow, Map the process, Ground in real data, Test with real users, Assign an owner" },
      body: `
        <p>You don't need a full transformation program to make this shift. You need one real process, one working tool, and proof that it works. Step through the five steps below.</p>
      `,
      steps: [
        { title: "Start narrow", detail: "Pick one process that's well understood, has a clear start and end point, and causes real friction today. Your first win should be boring and useful, not impressive." },
        { title: "Map the process", detail: "Write out the actual steps a human takes today, including the exceptions. Most first attempts fail because nobody wrote down what \"handling it\" really meant." },
        { title: "Ground it in real data", detail: "Connect it to your actual source of truth, rather than relying on generic knowledge. This is what makes the result dramatically more useful than a generic chatbot answer." },
        { title: "Test with real users", detail: "Test with the people who live in the process every day, not just your own team. They'll find the gaps in an afternoon that you'd miss after weeks of solo testing." },
        { title: "Assign an owner", detail: "Someone needs to own this the way they'd own any piece of software: monitoring it, updating it as the process changes, retiring it if it stops earning its keep." }
      ],
      checks: [
        {
          question: "A team wants their first AI project to connect to a live internal database instead of relying on general AI knowledge. Which step does this match?",
          options: [
            "Start narrow",
            "Ground it in real data",
            "Assign an owner"
          ],
          correct: 1,
          explanation: "Grounding in real data (your actual source of truth) is what separates a genuinely useful internal tool from a generic chatbot answer."
        },
        {
          question: "Why does the article recommend starting with a 'boring' process rather than an ambitious one?",
          options: [
            "Ambitious processes are technically impossible to automate",
            "A narrow, well-understood process is more likely to actually succeed and prove the concept",
            "Boring processes are the only ones leadership will approve"
          ],
          correct: 1,
          explanation: "The goal of a first attempt is to prove the pattern works, not to impress anyone. A narrow scope means fewer edge cases and a much higher chance of a real win."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: The Bigger Picture",
      image: { src: "images/one-agent-seeds-many.png", alt: "One proven tree at the center with dashed outlines of future trees around it, connected by shared roots, captioned: one proven agent seeds the ones that follow" },
      body: `
        <p>Treat your first success as a proof point, not the finish line. The real payoff isn't the single automation, it's what that first win teaches your organization about what's possible, and the credibility it builds for the next one.</p>
        <p>The organizations that separate themselves over the next few years won't be the ones with the most individual AI enthusiasts. They'll be the ones that turned individual enthusiasm into organizational capability, governed, durable, and built on real business processes rather than good intentions.</p>
        <p>If your company is still stuck in the individual stage, the good news is that the jump doesn't require a massive program. It requires picking one real process, building one real solution, and proving it out. Everything else follows from there.</p>
      `,
      checks: [
        {
          question: "What's the real value of your first successful organizational AI win?",
          options: [
            "It's mainly about the time saved on that one process",
            "It proves the model works and builds the credibility to seed further organizational capability",
            "It guarantees every future project will be easier"
          ],
          correct: 1,
          explanation: "One proven win is a seed, not a finish line. Its biggest value is the credibility and know-how it creates for everything that follows."
        },
        {
          label: "Bringing it together",
          question: "Your team just successfully piloted one narrow, well-owned AI tool for routing support tickets. Based on everything in this course, what should happen next?",
          options: [
            "Nothing — one successful process means the mission is accomplished",
            "Use this proof point to build credibility and deliberately expand to a second and third process, since durable capability compounds rather than being a single event",
            "Hand it off to whoever built it and consider AI enablement complete"
          ],
          correct: 1,
          explanation: "This ties the course together: individual wins are contained (Lesson 2), organizational capability needs to survive beyond one person (Lesson 1) and be actively governed (Lesson 3), and a first win is a seed for what comes next, not a finish line (this lesson)."
        }
      ],
      reflection: {
        prompt: "What's one process at your organization that fits this pattern, something well understood, causes real friction, and could be a strong first win?"
      }
    }
  ]
};
