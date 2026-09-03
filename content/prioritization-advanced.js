/* ================================================================
   COURSE CONTENT: Prioritization & Trade-offs, Advanced Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 15 Section 4 ("Driving Financial Performance and Managing
   the Portfolio"), Chapter 8 Sections 1 & 5 (data-driven culture,
   integrating financial with user and market data).
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["prioritization-advanced"] = {
  sourceUrl: "",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: From Your Backlog to the System",
      preCheck: {
        label: "Before you read on — predict",
        question: "You prioritize your own product's backlog well and consistently. What's the advanced move beyond that?",
        options: [
          "Prioritize a larger backlog",
          "Design a prioritization method other teams adopt, and be the person who resolves prioritization conflicts across teams",
          "Hand prioritization to a committee"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. Advanced prioritization is about the method and the org, not one backlog."
      },
      body: `
        <p>At earlier levels, prioritization skill is about ordering your own work well. At an advanced level, the deliverable changes: you <strong>design prioritization systems that other teams adopt</strong>, and you <strong>navigate prioritization conflicts at an organizational level</strong>, the ones where two teams' top priorities compete for the same capacity or the same customers.</p>
        <p>The test: other teams run the prioritization method you designed, using shared definitions and a shared data source, and when their priorities collide, the resolution comes from the method rather than from whoever escalates hardest.</p>
        <p>Two things make that possible: a method that's <strong>legible</strong> across teams, and a common language, financial impact, that leadership can actually decide in.</p>
      `,
      checks: [
        {
          question: "What's the deliverable at the advanced level of prioritization?",
          options: [
            "A perfectly ordered backlog for your own product",
            "A prioritization method other teams adopt, plus the ability to resolve cross-team prioritization conflicts through that method",
            "A prioritization committee that meets weekly"
          ],
          correct: 1,
          explanation: "The output is a shared system and conflict resolution at the org level — not another well-ordered single backlog."
        },
        {
          question: "What's the \"test\" for whether you've made the shift?",
          options: [
            "You personally review every team's backlog",
            "Other teams run your method with shared definitions and data, and priority collisions get resolved by the method rather than by whoever escalates hardest",
            "Your product ships more features per quarter than the others"
          ],
          correct: 1,
          explanation: "If cross-team conflicts still resolve by escalation, there's no system. A legible shared method is what changes that."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: A Shared, Legible Method",
      body: `
        <p>A prioritization method other teams will actually adopt has three properties.</p>
        <svg viewBox="0 0 400 150" style="width:100%; height:auto; margin:4px 0 2px;">
          <g font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="20" y="18" width="80" height="26" rx="7" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="60" y="35">Team A</text>
            <rect x="20" y="62" width="80" height="26" rx="7" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="60" y="79">Team B</text>
            <rect x="20" y="106" width="80" height="26" rx="7" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="60" y="123">Team C</text>
            <rect x="160" y="52" width="110" height="46" rx="10" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.4"/><text x="215" y="72">one method</text><text x="215" y="86" font-size="7.5" font-weight="400" fill="#4B5768">shared defs + data</text>
            <rect x="322" y="52" width="66" height="46" rx="10" fill="#EEF9F1" stroke="#2E8B57" stroke-width="1.3"/><text x="355" y="72">ranked</text><text x="355" y="85" font-size="7.5" font-weight="400" fill="#4B5768">comparable</text>
          </g>
          <g stroke="#9AA3AD" stroke-width="1.4">
            <line x1="100" y1="31" x2="158" y2="62"/><line x1="100" y1="75" x2="158" y2="75"/><line x1="100" y1="119" x2="158" y2="88"/>
            <line x1="270" y1="75" x2="320" y2="75"/>
          </g>
        </svg>
        <p><strong>Shared criteria and definitions</strong>, so "impact" and "value" mean the same thing on Team A and Team C. <strong>A common data source</strong>, one place everyone pulls the metrics from, so nobody's arguing from a different number. And <strong>defensible outputs</strong>, each item's rank traceable to its inputs, so the order survives scrutiny from any direction. When all three hold, two teams' priority lists are actually comparable, which is the precondition for resolving a conflict between them.</p>
      `,
      checks: [
        {
          question: "Why does a cross-team prioritization method need a single common data source?",
          options: [
            "To reduce the cost of analytics tooling",
            "So teams aren't arguing from different numbers — a shared source is what makes their priority lists actually comparable",
            "So leadership can audit each team's usage"
          ],
          correct: 1,
          explanation: "If Team A's \"value\" is computed from one dataset and Team B's from another, their rankings can't be compared, and a conflict between them has no factual basis to resolve on."
        },
        {
          question: "What makes a prioritization output \"defensible\" in this lesson's sense?",
          options: [
            "A senior leader signed off on it",
            "Each item's rank is traceable to its inputs, so the order holds up under scrutiny from any direction",
            "It hasn't been challenged yet"
          ],
          correct: 1,
          explanation: "Defensible means \"you can show your work.\" That traceability is what lets the method, rather than escalation, settle disagreements."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Tie It to the P&L",
      body: `
        <p>At the organizational level, the language decisions get made in is <strong>financial</strong>. An advanced prioritization system connects the ranking to profit-and-loss data so the trade-offs speak that language.</p>
        <ul>
          <li><strong>Prioritize by expected ROI.</strong> Use P&L data to rank initiatives by their potential for revenue growth or cost savings, not just by a felt value score.</li>
          <li><strong>Link revenue goals to value-driven features.</strong> If a core value proposition is reducing customers' administrative time, tie revenue targets to the features that deliver that, so the prioritization and the financial plan point the same way.</li>
          <li><strong>Track the financial impact of what shipped.</strong> Measure how releases actually moved revenue, margin, and acquisition cost, and feed that back into the next round's ROI estimates.</li>
        </ul>
        <p>This isn't about turning every decision into a spreadsheet. It's about being able to express a prioritization trade-off in terms leadership can weigh against every other investment the company is making.</p>
      `,
      checks: [
        {
          question: "Why connect the prioritization system to P&L data at the organizational level?",
          options: [
            "Finance requires it for budgeting",
            "Financial impact is the language leadership decides in — expressing trade-offs that way lets a prioritization call be weighed against every other company investment",
            "It makes the rankings harder to challenge"
          ],
          correct: 1,
          explanation: "At the org level you're competing for resources with everything else the company could do. A trade-off stated in ROI terms is one leadership can actually evaluate."
        },
        {
          question: "What's the purpose of tracking the actual financial impact of shipped releases?",
          options: [
            "To report results to the board",
            "To feed real outcomes back into the next round's ROI estimates, so the system's financial predictions get more accurate over time",
            "To decide which team gets more headcount"
          ],
          correct: 1,
          explanation: "Same calibration loop as the moderate level, one tier up: measured financial impact corrects the ROI estimates the system runs on."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Portfolio Thinking",
      body: `
        <p>With multiple products or teams, prioritization isn't only <em>within</em> a backlog, it's allocating capacity <em>across</em> them. That's portfolio management.</p>
      `,
      steps: [
        { title: "Classify products by stage", detail: "Growth-stage products that need investment to capture a market, and mature products that generate cash but need less. The right prioritization pressure is different for each." },
        { title: "Set stage-appropriate goals", detail: "Growth products get milestones that balance investment against returns; mature products get profitability targets. A growth product judged on this quarter's margin gets starved; a mature one given a blank cheque gets wasteful." },
        { title: "Allocate capacity at the portfolio level", detail: "Decide how much total engineering and product capacity goes to each product before each team prioritizes within its slice. Otherwise the loudest team, not the strategy, sets the split." },
        { title: "Rebalance on a cadence", detail: "As products move between stages and markets shift, the allocation should move too. A portfolio split set once and frozen drifts out of line with where the opportunity actually is." }
      ],
      checks: [
        {
          question: "Why judge a growth-stage product and a mature product by different goals?",
          options: [
            "Mature products are more important to the company",
            "A growth product judged on near-term margin gets starved of the investment it needs; a mature one given unlimited investment gets wasteful — the right pressure differs by stage",
            "Growth products are harder to measure"
          ],
          correct: 1,
          explanation: "Applying one standard across stages mis-allocates. Growth needs investment room; mature needs profitability discipline."
        },
        {
          question: "Why allocate capacity across products at the portfolio level before each team prioritizes within its own backlog?",
          options: [
            "To reduce the number of prioritization meetings",
            "Otherwise the split between products is set by which team advocates hardest, rather than by the portfolio strategy",
            "Because teams can't be trusted to prioritize their own work"
          ],
          correct: 1,
          explanation: "It's the loudest-voice problem one level up. Setting the cross-product split deliberately is what keeps strategy, not internal politics, in control of where capacity goes."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Navigating the Conflict",
      body: `
        <p>The moment the whole system exists to handle: two teams' top priorities collide, competing for the same capacity, the same customers, or the same launch window.</p>
        <p>Without a shared method, this resolves by escalation, whoever gets to the executive first, or argues most forcefully, wins. With one, the conversation changes: both items are scored against the same criteria, from the same data, in the same financial terms. The question becomes "which scores higher against what we agreed matters?", and the answer is inspectable by everyone in the room.</p>
        <p>Your job in that moment is to <strong>run the method, not pick a side</strong>, and to make the reasoning visible so the losing team can see it wasn't political. And the longer-term job is <strong>mentoring</strong>: growing other people who can facilitate that conversation, so cross-team prioritization doesn't depend on you being in every room.</p>
        <p>Put the course together: a legible shared method, tied to the P&L, applied across a portfolio, used to resolve conflicts by criteria rather than volume, and taught to others. That's prioritization as something the organization runs on, not something one PM does well.</p>
      `,
      checks: [
        {
          question: "When two teams' priorities collide, what's the PM's role in an advanced prioritization system?",
          options: [
            "Decide which team's priority wins, based on their own judgment",
            "Run the shared method — same criteria, same data, same financial terms — and make the reasoning visible, rather than picking a side",
            "Escalate the conflict to an executive to settle"
          ],
          correct: 1,
          explanation: "The system's whole point is that the method settles the conflict. The PM facilitates that and shows the work; they don't substitute their own call for it."
        },
        {
          label: "Bringing it together",
          question: "You're the most senior product person across three teams that constantly clash over roadmap priority. Based on this course, what's the highest-leverage move?",
          options: [
            "Personally arbitrate each conflict as it comes up",
            "Stand up one legible method — shared criteria and data, ROI-linked, portfolio-level capacity allocation — use it to resolve conflicts by score, and train facilitators on each team so it runs without you",
            "Give each team a fixed roadmap for the year so there's nothing to clash over"
          ],
          correct: 1,
          explanation: "Personal arbitration keeps the capability centralized on you; fixed roadmaps ignore that priorities change. A shared, taught, ROI-linked method is what makes cross-team prioritization an organizational function."
        }
      ],
      reflection: {
        prompt: "Think of the last cross-team prioritization conflict you saw. Was it resolved by a shared method, or by escalation? If the latter, what shared criteria and data source would have let it be resolved on the merits instead?"
      }
    }
  ]
};
