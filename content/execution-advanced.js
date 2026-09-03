/* ================================================================
   COURSE CONTENT: Execution & Delivery, Advanced Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 12 Section 2.2, Chapter 15 Sections 3.2 & 5.1, and
   Chapter 4 Section 4 (continuous improvement, learning, mentorship)
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["execution-advanced"] = {
  sourceUrl: "",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: From Running Launches to Building the Machine",
      preCheck: {
        label: "Before you read on — predict",
        question: "You personally run complex launches reliably. What's the advanced move beyond that?",
        options: [
          "Run even bigger launches personally",
          "Turn your delivery approach into a system other teams can adopt, and coach others through their own high-stakes launches",
          "Move fully into an engineering management role"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. Advanced execution is about the system, not the individual run."
      },
      body: `
        <p>At an experienced level, you deliver complex work reliably yourself. At an advanced level, the deliverable changes: you <strong>design delivery systems and rhythms that other teams adopt</strong>, and you <strong>coach other people through complex, high-stakes launches</strong>.</p>
        <p>The test: if two other teams in the organization are running the delivery cadence you designed, without you in the room, and a less experienced PM just navigated a hard launch because you coached them through it rather than doing it for them, you've made the shift. If reliable delivery still only happens where you personally are, you haven't.</p>
        <p>This is execution as an organizational capability, not a personal one.</p>
      `,
      checks: [
        {
          question: "What's the deliverable at the advanced level of execution?",
          options: [
            "Personally shipping larger and more complex projects",
            "Delivery systems and rhythms that other teams adopt, plus coaching others through their own high-stakes launches",
            "A detailed runbook for your own projects"
          ],
          correct: 1,
          explanation: "The output is a repeatable capability other teams use — not another well-run project with your name on it."
        },
        {
          question: "What's the \"test\" the lesson offers for whether you've made the shift?",
          options: [
            "You're invited to review every launch in the company",
            "Other teams run your delivery cadence without you, and a PM you coached just navigated a hard launch themselves",
            "Your projects have the lowest defect rate in the org"
          ],
          correct: 1,
          explanation: "If reliable delivery travels to other teams and people, it's a system. If it only happens where you are, it's still personal."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Delivery Rhythms Worth Copying",
      body: `
        <p>A delivery system other teams adopt is a small set of rhythms and defaults, documented well enough to lift wholesale.</p>
        <svg viewBox="0 0 400 150" style="width:100%; height:auto; margin:4px 0 2px;">
          <defs>
            <marker id="exLoop" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="150" y="10" width="100" height="26" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="200" y="27">plan increment</text>
            <rect x="288" y="62" width="100" height="26" rx="8" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="338" y="79">build + auto-test</text>
            <rect x="150" y="114" width="100" height="26" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="200" y="131">ship via CI/CD</text>
            <rect x="12" y="62" width="100" height="26" rx="8" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="62" y="79">read the metrics</text>
          </g>
          <path d="M250 23 Q330 30 338 60" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#exLoop)"/>
          <path d="M338 90 Q330 120 252 127" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#exLoop)"/>
          <path d="M150 127 Q70 120 62 90" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#exLoop)"/>
          <path d="M62 60 Q70 30 150 23" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#exLoop)"/>
        </svg>
        <p>The pieces worth standardizing: an <strong>iterative roadmap</strong> format that flexes between fixes, enhancements, and new work; <strong>CI/CD and automated testing as the default</strong>, not a per-team choice; a shared <strong>quality-metrics view</strong> (defect rate, downtime, cycle time) every team reads the same way; and a fixed <strong>review cadence</strong>. When these are the house standard, a new team is productive and reliable in weeks, not quarters.</p>
      `,
      checks: [
        {
          question: "What makes a delivery rhythm \"worth copying\" in this lesson's sense?",
          options: [
            "It's the most sophisticated process available",
            "It's a small set of rhythms and defaults, documented well enough that another team can adopt it wholesale and be reliable in weeks",
            "It was designed by the most senior person"
          ],
          correct: 1,
          explanation: "Adoptability is the property that matters: few pieces, clear defaults, good documentation. Complexity that only its author can run doesn't spread."
        },
        {
          question: "Why standardize CI/CD and a shared quality-metrics view across teams rather than leaving each team to choose?",
          options: [
            "To centralize control over the teams",
            "So reliability doesn't depend on each team independently reinventing it, and so metrics mean the same thing everywhere",
            "Because tooling contracts are cheaper at scale"
          ],
          correct: 1,
          explanation: "A house standard means a new team inherits reliable delivery instead of building it from scratch, and cross-team comparison actually works."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Coaching Through a High-Stakes Launch",
      body: `
        <p>The other half of the advanced role is walking a less experienced team through a launch that matters, in a way that builds their capability rather than just getting this one out the door.</p>
      `,
      steps: [
        { title: "Run a pre-mortem with them", detail: "Before the launch, have the team imagine it has failed and work backward through why. You're teaching them to surface risks proactively — and the exercise itself catches things their plan missed." },
        { title: "Walk the launch-readiness review", detail: "Go through readiness together against a checklist: monitoring in place, rollback tested, support briefed, comms drafted, load headroom confirmed. Let them run it; you ask the questions a veteran would ask." },
        { title: "Insist on a staged rollout and a tested rollback", detail: "Not because you'd do it differently, but because these are the habits that make high-stakes launches survivable. Make them non-negotiable and explain why each time until the team asks for them unprompted." },
        { title: "Debrief for the lesson, not the blame", detail: "After the launch, run the retro focused on what the team learned about launching — what they'd do earlier, what they'd check, what surprised them. That's the capability transferring." }
      ],
      checks: [
        {
          question: "Why run a pre-mortem with a team before a high-stakes launch?",
          options: [
            "To document accountability if it fails",
            "It teaches them to surface risks proactively, and the exercise itself catches things their plan missed",
            "It's a formality that reassures stakeholders"
          ],
          correct: 1,
          explanation: "A pre-mortem is both a risk-finding tool and a coaching tool: the team practices anticipating failure, which is the skill you're transferring."
        },
        {
          question: "When coaching, why let the less experienced team run the launch-readiness review while you ask questions?",
          options: [
            "It saves you time",
            "They build the capability by doing it, with you modelling the questions a veteran asks — versus you running it and them watching",
            "It spreads responsibility if something is missed"
          ],
          correct: 1,
          explanation: "Doing it with guidance transfers the skill. Doing it for them gets this launch out but leaves the team no more capable than before."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Data-Driven Optimization as Standard Practice",
      body: `
        <p>At earlier levels, "look at the data after a release" is a good habit. At an advanced level, it's a <strong>standard practice</strong> every team runs by default, not a special project someone champions.</p>
        <p>That means, as a normal part of the delivery loop:</p>
        <ul>
          <li><strong>Analyze user behaviour</strong> after each meaningful release, feature adoption, engagement, where people drop off.</li>
          <li><strong>Track whether the product is still landing</strong> — retention, satisfaction, the core outcome metric — so a slow decline is noticed early.</li>
          <li><strong>Feed the findings into the next round of prioritization</strong>, so the roadmap is continuously adjusted from evidence rather than re-argued from opinion.</li>
        </ul>
        <p>Your job is to make this the water the teams swim in: the tooling is there, the cadence includes it, and shipping without looking at what happened feels wrong.</p>
      `,
      checks: [
        {
          question: "What's the difference between data-driven optimization as a \"habit\" and as a \"standard practice\"?",
          options: [
            "A standard practice uses more advanced analytics tools",
            "A habit depends on someone remembering or championing it; a standard practice is built into every team's delivery loop by default",
            "There is no meaningful difference"
          ],
          correct: 1,
          explanation: "The advanced move is making it structural — tooling, cadence, expectation — so it happens whether or not a particular person pushes for it."
        },
        {
          question: "Why feed post-release findings directly into the next prioritization round?",
          options: [
            "To create more work for the roadmap",
            "So the roadmap is continuously adjusted from evidence, rather than being re-argued from opinion each planning cycle",
            "To justify the analytics investment"
          ],
          correct: 1,
          explanation: "Closing that loop is what makes the delivery system self-correcting: what actually happened last release shapes what's prioritized next."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Make It Outlast You",
      body: `
        <p>A delivery system is only advanced if it survives you leaving. The last job is durability.</p>
        <ul>
          <li><strong>A continuous-improvement culture.</strong> Teams regularly analyze what shipped, refine the process, and are recognized for incremental gains, not just big launches. The system improves itself.</li>
          <li><strong>Knowledge sharing built in.</strong> Delivery playbooks, launch retros shared org-wide, mentorship pairings. The patterns that work are written down and taught, not held in one person's head.</li>
          <li><strong>More than one person who can coach it.</strong> If you're the only one who can walk a team through a hard launch, the capability is still centralized. Deliberately grow two or three others who can.</li>
        </ul>
        <p>Put the course together: a documented delivery rhythm other teams run, coaching that builds capability instead of consuming it, data-driven optimization as the default, and a culture that maintains and spreads all of it. That's execution as something the organization owns.</p>
      `,
      checks: [
        {
          question: "What's the sign that a delivery system is genuinely durable?",
          options: [
            "It's documented in a comprehensive wiki",
            "It survives you leaving — improved by a continuous-improvement culture, taught through shared playbooks, and coachable by more than one person",
            "It has never had a failed launch"
          ],
          correct: 1,
          explanation: "Documentation helps, but durability is about the system improving and teaching itself, and not depending on any single person to run or coach it."
        },
        {
          label: "Bringing it together",
          question: "You're moving to a new part of the organization. Based on this course, what best indicates your old area will keep delivering reliably?",
          options: [
            "You left a detailed handover document and are available for questions",
            "Two teams already run the delivery cadence independently, post-release data review is just how they work, two other people can coach a hard launch, and retros feed the next roadmap",
            "The team has strong engineers and a good manager"
          ],
          correct: 1,
          explanation: "A handover doc and good people re-centralize the capability on whoever's there next. An adopted cadence, embedded data practice, distributed coaching, and a self-correcting loop are what make it outlast you."
        }
      ],
      reflection: {
        prompt: "Name one part of how your team delivers that only works because you're there — a launch review you always run, a judgment call teams bring to you. What would it take to make it a documented default other teams could adopt, and to have someone else able to coach it?"
      }
    }
  ]
};
