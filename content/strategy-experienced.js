/* ================================================================
   COURSE CONTENT: Product Strategy & Roadmapping, Lots of Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 6, "Managing Product Roadmaps", Sections 3-5
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["strategy-experienced"] = {
  sourceUrl: "",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: The Roadmap Is Only as Good as Its Communication",
      preCheck: {
        label: "Before you read on — predict",
        question: "You have a well-built, strategy-linked roadmap. You present the same version of it to engineers, executives, and customers. What's likely to go wrong?",
        options: [
          "Nothing — one clear roadmap should serve everyone",
          "Each audience needs a different cut: engineers want epics and timing, executives want themes and risks, customers want the improvements that affect them",
          "Customers shouldn't see the roadmap at all"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. A good roadmap communicated badly still fails."
      },
      body: `
        <p>A roadmap is only as effective as the communication plan around it. The same underlying roadmap has to be presented differently to different audiences, because they're each trying to answer a different question.</p>
        <ul>
          <li><strong>Engineers</strong> need the detailed view: epics, tasks, dependencies, and timing. Their question is "what am I building and when?"</li>
          <li><strong>Executives</strong> need the high-level view: themes, how each aligns to business goals, and the key risks with mitigations. Their question is "is this the right bet and what could derail it?"</li>
          <li><strong>Customers</strong> need the improvements view: what's coming that addresses their pain points or streamlines their workflow. Their question is "what's in it for me and roughly when?"</li>
        </ul>
        <p>One roadmap, three presentations. Skipping the translation is how a solid roadmap still leaves everyone confused.</p>
      `,
      checks: [
        {
          question: "What does an executive audience most need from a roadmap presentation?",
          options: [
            "The full list of epics and tasks with dates",
            "High-level themes, how they align to business goals, and the key risks plus mitigations",
            "A demo of each upcoming feature"
          ],
          correct: 1,
          explanation: "Executives are evaluating the bet and its risks. Task-level detail buries that; themes-plus-risks surfaces it."
        },
        {
          question: "Why tailor the roadmap presentation per audience instead of sharing one version?",
          options: [
            "To keep sensitive details from some groups",
            "Each audience is answering a different question — what am I building, is this the right bet, what's in it for me — and one format can't serve all three well",
            "Because different tools are used by different teams"
          ],
          correct: 1,
          explanation: "Same roadmap, different cuts. The translation is what makes the roadmap usable rather than just visible."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Transparency Builds Trust",
      body: `
        <p>Roadmaps change. Features get deprioritized, timelines slip, bets get abandoned. How you communicate those changes determines whether stakeholders keep trusting the roadmap at all.</p>
        <p>Two practices:</p>
        <ul>
          <li><strong>Share changes proactively.</strong> Public roadmap updates through town halls, an advisory group, or a dedicated channel, so people hear about a shift from you, not through the grapevine.</li>
          <li><strong>Always explain the why.</strong> When you deprioritize something, give the rationale: what changed, what it's making room for, what trade-off you made. "We're pushing X to fund Y because of Z" preserves trust; a silent disappearance destroys it.</li>
        </ul>
        <p>Being honest about setbacks and trade-offs, rather than only announcing wins, is what lets people rely on the roadmap when it matters.</p>
      `,
      checks: [
        {
          question: "According to this lesson, what should always accompany a deprioritization?",
          options: [
            "A new estimated date for when it will be picked back up",
            "The rationale — what changed, what it makes room for, the trade-off made",
            "An apology to the stakeholders who requested it"
          ],
          correct: 1,
          explanation: "\"We're pushing X to fund Y because of Z\" keeps trust. A feature quietly vanishing from the roadmap erodes it."
        },
        {
          question: "Why communicate roadmap changes proactively rather than when asked?",
          options: [
            "It reduces the number of stakeholder meetings",
            "So people hear about a shift from you directly, which keeps the roadmap credible, instead of learning it second-hand",
            "Proactive updates are required for public companies"
          ],
          correct: 1,
          explanation: "A roadmap people find out is wrong on their own is a roadmap they stop trusting. Getting ahead of changes is part of maintaining it."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Holding Short-Term and Long-Term Together",
      body: `
        <p>The hardest part of managing a roadmap is balancing immediate demands, urgent user needs, a competitor move, a compliance deadline, against long-term strategic initiatives that only pay off later.</p>
        <svg viewBox="0 0 400 150" style="width:100%; height:auto; margin:4px 0 2px;">
          <path d="M20 118 Q200 20 380 40" fill="none" stroke="#1A4584" stroke-width="2"/>
          <text x="332" y="34" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">long-term arc</text>
          <g fill="#35C2E8">
            <rect x="40" y="104" width="26" height="20" rx="3"/>
            <rect x="96" y="96" width="26" height="28" rx="3"/>
            <rect x="152" y="90" width="26" height="34" rx="3"/>
            <rect x="208" y="84" width="26" height="40" rx="3"/>
            <rect x="264" y="76" width="26" height="48" rx="3"/>
            <rect x="320" y="66" width="26" height="58" rx="3"/>
          </g>
          <text x="60" y="140" font-family="sans-serif" font-size="8.5" fill="#4B5768">quarterly increments deliver now…</text>
          <text x="235" y="140" font-family="sans-serif" font-size="8.5" fill="#4B5768">…each checked against the arc</text>
        </svg>
        <p>Two mechanisms keep the two in balance:</p>
        <ul>
          <li><strong>Time-box long-term planning.</strong> Dedicated quarterly sessions to revisit long-term objectives and check whether the last quarter's short-term work actually moved toward them.</li>
          <li><strong>Run a quarterly roadmap review cadence.</strong> A standing rhythm for reviewing progress against long-term goals and adjusting based on results and feedback.</li>
        </ul>
      `,
      checks: [
        {
          question: "What's the risk this lesson is guarding against?",
          options: [
            "Spending too much time in planning meetings",
            "Immediate demands crowding out long-term initiatives quarter after quarter, so the strategy never actually advances",
            "Long-term planning making the team inflexible"
          ],
          correct: 1,
          explanation: "Urgent work always feels more pressing. Without a mechanism to protect long-term progress, it gets deferred indefinitely."
        },
        {
          question: "How does a time-boxed quarterly long-term planning session help?",
          options: [
            "It replaces the need for sprint planning",
            "It forces a regular check on whether the quarter's short-term work actually moved toward the long-term objectives, catching drift before it compounds",
            "It lets the team pause delivery for a week each quarter"
          ],
          correct: 1,
          explanation: "The dedicated session is where you notice \"we shipped a lot but didn't advance the strategy\" — while there's still time to correct."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Building Resilience In",
      body: `
        <p>An experienced roadmap owner assumes the landscape will shift, regulations, competitors, technology, priorities, and builds the roadmap so it can absorb that without being torn up. This is what "adapting without losing the thread" looks like in practice.</p>
      `,
      steps: [
        { title: "Scenario planning", detail: "Develop a few concrete scenarios for likely disruptions — a new regulation, a competitor launch, a platform change — and rough out how the roadmap would respond to each. When one happens, you're adjusting a plan, not inventing one under pressure." },
        { title: "Keep prioritization flexible", detail: "Structure the roadmap so you can shift focus quickly when something unexpected arrives, without the whole plan collapsing. Themes tied to objectives (not a rigid feature sequence) are what make this possible." },
        { title: "Protect the through-line", detail: "When you do adjust, re-anchor to the long-term objectives out loud. The change is \"we're taking a different path to the same goal,\" not \"the goal changed.\" That's how the roadmap stays coherent through turbulence." }
      ],
      checks: [
        {
          question: "What's the point of scenario planning for a roadmap?",
          options: [
            "To predict exactly which disruption will happen",
            "So that when a likely disruption hits, you're adjusting a pre-thought-through plan rather than improvising under pressure",
            "To justify a larger planning budget"
          ],
          correct: 1,
          explanation: "You can't know which scenario will play out, but having roughed out responses to the likely few means you react from preparation, not panic."
        },
        {
          question: "\"Adapting without losing the thread\" means what, per this lesson?",
          options: [
            "Never changing the roadmap once it's set",
            "When you change the path, re-anchoring to the same long-term objectives — the route changed, not the destination",
            "Changing the goals whenever the market shifts"
          ],
          correct: 1,
          explanation: "Credible adaptation keeps the destination fixed and explains the new route toward it. Changing the destination every quarter is what \"losing the thread\" is."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Measure and Iterate",
      body: `
        <p>A roadmap isn't static, it evolves based on feedback, market shifts, and outcomes. To iterate it well, you need to actually measure whether it's working.</p>
        <p><strong>Roadmap KPIs</strong> that tell you something:</p>
        <ul>
          <li><strong>Time-to-market</strong> — how fast a theme moves from conception to release.</li>
          <li><strong>User satisfaction</strong> — the change in satisfaction after a significant roadmap initiative ships.</li>
          <li><strong>Revenue or cost impact</strong> — how a theme actually contributed to the financial goal it was mapped to.</li>
        </ul>
        <p>Then close the loop: <strong>quarterly roadmap reviews</strong> to reassess priorities against progress, and <strong>retrospectives after major releases</strong> to capture what worked and what to change. A roadmap you measure and revise on a cadence is one you can adapt credibly, because the adjustments are evidence-based, not reactive.</p>
      `,
      checks: [
        {
          question: "Why measure something like \"user satisfaction change after a major initiative ships\"?",
          options: [
            "It's a vanity metric for stakeholder decks",
            "It tells you whether the theme actually delivered the outcome it was mapped to — which is the input to iterating the roadmap",
            "It's the only KPI that matters for a roadmap"
          ],
          correct: 1,
          explanation: "Roadmap KPIs exist to answer \"did this theme do what we said it would?\" That answer is what makes the next round of prioritization evidence-based."
        },
        {
          label: "Bringing it together",
          question: "New information arrives mid-quarter that changes the priority of a major theme. Based on this course, how do you adjust the roadmap credibly?",
          options: [
            "Quietly re-order the roadmap and mention it at the next all-hands if asked",
            "Re-rank against the mapped objectives, communicate the change and its rationale per audience, re-anchor to the unchanged long-term goal, and note it for the quarterly review",
            "Hold the roadmap steady until the quarterly review so it doesn't look reactive"
          ],
          correct: 1,
          explanation: "Credible adaptation = evidence-based re-ranking + transparent, audience-specific communication + re-anchoring to the through-line. That's every lesson in this course applied at once."
        }
      ],
      reflection: {
        prompt: "Pick one theme you shipped in the last two quarters. What KPI would have told you whether it worked? Do you have that number — and if not, what would it take to get it next time?"
      }
    }
  ]
};
