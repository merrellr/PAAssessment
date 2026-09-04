/* ================================================================
   COURSE CONTENT: Customer & Market Discovery, Advanced Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 10, "Building User-Centric Products: Balancing Empathy and
   Innovation" (with Chapter 5, Section 4, "Creating a Culture of
   Continuous Improvement")
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["discovery-advanced"] = {
  sourceUrl: "",
  recap: [
    "Empathy is immersing in the user's context — their day, constraints, and emotions — not just recording their stated opinions.",
    "Use empathy maps (says / thinks / does / feels) and personas that stay alive, updated as you learn rather than a one-time slide.",
    "Advanced discovery is a continuous system: KPIs for user success, learning from failures as much as wins, small validated changes.",
    "Make user understanding an org-wide habit — real user stories in meetings, cross-functional research, recognizing empathy-driven work.",
    "In high-stakes work, discovery also de-risks: controlled pilots, continuous expert validation, an ethical check before shipping."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Empathy Beyond Feedback",
      preCheck: {
        label: "Before you read on — predict",
        question: "At an advanced level, what separates real user understanding from a well-run feedback program?",
        options: [
          "Collecting feedback more frequently and from more people",
          "Immersing in the user's actual context — their day, their constraints, their emotions — not just their reported opinions",
          "Using a more sophisticated survey tool"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. This one is about depth, not volume."
      },
      body: `
        <p>Empathy in product work means seeing the world through your users' eyes. It goes past collecting feedback: it's immersing yourself in someone's context to understand their daily experience, their frustrations, and what they're actually trying to achieve.</p>
        <p>And "the user" is usually several people with conflicting realities. In a healthcare product, for instance:</p>
        <ul>
          <li>A <strong>patient</strong> navigating fear, uncertainty, and too much information.</li>
          <li>A <strong>clinician</strong> balancing time pressure, accuracy, and compassion.</li>
          <li>An <strong>administrator</strong> managing workflow, compliance, and limited resources.</li>
          <li>A <strong>payer</strong> focused on cost and risk.</li>
        </ul>
        <p>The same pattern holds in any product with multiple stakeholders. Deep discovery means holding all of those realities at once, not averaging them into a single "user."</p>
      `,
      checks: [
        {
          question: "How does the lesson distinguish empathy from ordinary user feedback?",
          options: [
            "Empathy is just feedback collected more politely",
            "Empathy means immersing in the user's context — their day, emotions, and constraints — rather than only recording their stated opinions",
            "Empathy replaces the need for interviews and analytics"
          ],
          correct: 1,
          explanation: "Feedback tells you what someone says. Empathy is understanding the situation that produced it. Advanced discovery is built on the second."
        },
        {
          question: "What does the lesson say about products with multiple stakeholder types (patient, clinician, administrator, payer)?",
          options: [
            "Pick the most important one and design for them",
            "Hold all of their conflicting realities at once rather than averaging them into a single generic \"user\"",
            "Their needs are similar enough to treat as one group"
          ],
          correct: 1,
          explanation: "Averaging conflicting stakeholders produces a product that half-serves everyone. Deep discovery keeps the tensions visible so they can be designed for deliberately."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Empathy Maps and Living Personas",
      body: `
        <p>An <strong>empathy map</strong> organizes what you learn into four quadrants: what the user <em>says</em>, <em>thinks</em>, <em>does</em>, and <em>feels</em>. The gaps between quadrants are often the most revealing part — what someone says versus what they actually do, or what they do versus how they feel about it.</p>
        <svg viewBox="0 0 400 170" style="width:100%; height:auto; margin:4px 0 2px;">
          <line x1="200" y1="12" x2="200" y2="158" stroke="#E3E9F0" stroke-width="1"/>
          <line x1="14" y1="85" x2="386" y2="85" stroke="#E3E9F0" stroke-width="1"/>
          <g font-family="'Space Grotesk',sans-serif" font-size="12" font-weight="700" fill="#12305e" text-anchor="middle">
            <text x="107" y="42">SAYS</text>
            <text x="293" y="42">THINKS</text>
            <text x="107" y="122">DOES</text>
            <text x="293" y="122">FEELS</text>
          </g>
          <g font-family="sans-serif" font-size="8.5" fill="#4B5768" text-anchor="middle">
            <text x="107" y="58">in interviews and support tickets</text>
            <text x="293" y="58">but doesn't voice</text>
            <text x="107" y="138">the actual observed workflow</text>
            <text x="293" y="138">the emotion underneath it</text>
          </g>
        </svg>
        <p>Here's one filled in for a real person — an operations manager at a mid-market customer:</p>
        <svg viewBox="0 0 400 214" style="width:100%; height:auto; margin:4px 0 2px;">
          <line x1="200" y1="10" x2="200" y2="176" stroke="#E3E9F0" stroke-width="1"/>
          <line x1="12" y1="93" x2="388" y2="93" stroke="#E3E9F0" stroke-width="1"/>
          <g font-family="'Space Grotesk',sans-serif" font-size="10" font-weight="700" fill="#12305e">
            <text x="18" y="26">SAYS</text><text x="214" y="26">THINKS</text>
            <text x="18" y="112">DOES</text><text x="214" y="112">FEELS</text>
          </g>
          <g font-family="sans-serif" font-size="8.5" fill="#4B5768">
            <text x="18" y="42">"The reports are fine —</text><text x="18" y="54">we just export to a sheet."</text>
            <text x="214" y="42">"This wasn't built for a</text><text x="214" y="54">team our size."</text>
            <text x="18" y="128">Exports every Monday and</text><text x="18" y="140">rebuilds the same pivot</text><text x="18" y="152">by hand.</text>
            <text x="214" y="128">Quietly resentful; would</text><text x="214" y="140">not champion the renewal.</text>
          </g>
          <g text-anchor="middle" font-family="sans-serif" font-size="8.5" fill="#C0622A">
            <text x="200" y="196">Says "fine", but does a weekly workaround and feels resentful.</text>
            <text x="200" y="208">That gap — not the stated feedback — is the churn risk.</text>
          </g>
        </svg>
        <p>Build empathy maps from interviews and direct observation, then turn them into <strong>personas that stay alive</strong>: not a one-time slide, but a living description of each group's daily experience, goals, pain points, and technical comfort, updated as you learn more.</p>
      `,
      checks: [
        {
          question: "A customer tells you the reports are \"fine\", but you've watched them rebuild the same pivot by hand every week and they seem quietly frustrated. What does the empathy map tell you to act on?",
          options: [
            "Take the stated feedback at face value — the reports are fine, move on",
            "The gap between what they say, do, and feel — the weekly workaround and the frustration are a churn signal the words are hiding",
            "Nothing yet; wait until they file a formal complaint"
          ],
          correct: 1,
          explanation: "Says / thinks / does / feels exists to surface exactly this contradiction. \"Fine\" plus a hand-built workaround plus resentment is an account you're about to lose."
        },
        {
          question: "Why does the lesson call for personas that \"stay alive\"?",
          options: [
            "So they can be reused across every project unchanged",
            "Because a one-time persona slide goes stale; a living description gets updated as you learn, so it keeps guiding decisions accurately",
            "Because stakeholders like to see them refreshed"
          ],
          correct: 1,
          explanation: "A persona is only useful while it's accurate. Treating it as a living artifact, not a deliverable you finish once, is what keeps discovery grounded over time."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Discovery Systems, Not Discovery Sprints",
      body: `
        <p>At an advanced level, a user-centric product is never "finished." The work shifts from running discovery <em>projects</em> to maintaining a <strong>continuous improvement loop</strong> that refines the product against evolving user needs, without anyone having to schedule it.</p>
        <svg viewBox="0 0 400 132" style="width:100%; height:auto; margin:4px 0 4px;">
          <defs>
            <marker id="daLoop" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="150" y="8" width="100" height="26" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="200" y="25">Watch the KPIs</text>
            <rect x="286" y="53" width="104" height="26" rx="8" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="338" y="70">Study wins + fails</text>
            <rect x="150" y="98" width="100" height="26" rx="8" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="200" y="115">Ship small change</text>
            <rect x="10" y="53" width="104" height="26" rx="8" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="62" y="70">Validate it</text>
          </g>
          <path d="M250 21 Q330 26 336 51" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#daLoop)"/>
          <path d="M336 81 Q330 106 252 111" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#daLoop)"/>
          <path d="M150 111 Q70 106 64 81" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#daLoop)"/>
          <path d="M64 51 Q70 26 148 21" fill="none" stroke="#9AA3AD" stroke-width="1.4" marker-end="url(#daLoop)"/>
        </svg>
        <p>Three things make the loop run on its own:</p>
        <ul>
          <li><strong>KPIs for user success</strong> — time per task, error rates, satisfaction — watched continuously, so drift shows up as a number before it shows up as churn.</li>
          <li><strong>Learning from both wins and failures</strong> — study the cases where users hit their goal <em>and</em> the ones where they didn't, and treat the gap as the backlog.</li>
          <li><strong>Small, validated changes</strong> — incremental adjustments checked with A/B tests or quick feedback sessions, rather than big rewrites justified by intuition.</li>
        </ul>
      `,
      checks: [
        {
          question: "What's the shift this lesson describes for an advanced practitioner?",
          options: [
            "From qualitative research to quantitative research",
            "From running discrete discovery projects to maintaining a continuous improvement loop that runs without being scheduled",
            "From talking to users to relying on analytics alone"
          ],
          correct: 1,
          explanation: "Discovery stops being a phase you enter and exit. It becomes a standing system the product is always inside of."
        },
        {
          question: "The lesson says to study user failures as well as successes. Why?",
          options: [
            "To assign accountability for what went wrong",
            "The gap between where users succeeded and where they didn't is effectively the improvement backlog",
            "Failures are more common than successes, so there's more data"
          ],
          correct: 1,
          explanation: "Success stories confirm what works. Failure cases point directly at what to fix next. Both are inputs to the loop."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Making Discovery the Org's Habit",
      body: `
        <p>The advanced move is getting an entire organization to operate with user understanding by default, so discovery isn't one person's job title. Practical ways to build that culture:</p>
      `,
      steps: [
        { title: "Open meetings with a real user story", detail: "Start team meetings with an actual account of a user's experience — good or bad. It keeps the human impact of the work in the room, not abstracted into a ticket." },
        { title: "Make discovery cross-functional", detail: "Pull product, design, engineering, and domain experts into the same research and synthesis sessions. Empathy that only lives in the PM's head doesn't change what gets built." },
        { title: "Recognize empathy-driven work", detail: "When someone proposes a strong solution rooted in deep user understanding, name it and reward it. What gets recognized gets repeated." },
        { title: "Treat discovery as a competitive advantage", detail: "Frame it internally as an edge, not a checkbox. Teams that consistently understand users better than competitors ship the right things more often — and that compounds." }
      ],
      checks: [
        {
          question: "Why start team meetings with a real user story?",
          options: [
            "To fill time before the agenda begins",
            "It keeps the human impact of the work present in the room, rather than letting it get abstracted into tickets and metrics",
            "To give the research team visibility"
          ],
          correct: 1,
          explanation: "Small ritual, real effect. A concrete user story at the top of a meeting reframes the decisions that follow around actual people."
        },
        {
          question: "What does \"treat discovery as a competitive advantage\" mean in practice here?",
          options: [
            "Keep your research findings secret from competitors",
            "Frame discovery internally as an edge worth investing in — because consistently understanding users better than competitors means shipping the right things more often",
            "Do discovery faster than competitors do"
          ],
          correct: 1,
          explanation: "It's a positioning choice inside the org. \"A phase to get through\" gets underfunded; \"our edge\" gets protected and built on."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Responsible Discovery at Stakes",
      body: `
        <p>In high-stakes domains, discovery also has to <strong>de-risk</strong>. When a feature touches decisions, safety, money, or compliance, understanding the user isn't enough on its own — you validate carefully before it ships.</p>
        <ul>
          <li><strong>Pilot in controlled environments.</strong> Introduce new capability incrementally, to a small representative group, so a wrong assumption fails small.</li>
          <li><strong>Validate continuously with domain experts.</strong> Involve the people who know the real-world consequences throughout design and build, not just at the end.</li>
          <li><strong>Run an ethical check.</strong> Confirm the change prioritizes user well-being over convenience or engagement, especially where the two conflict.</li>
        </ul>
        <p>This is what "discovery as a system" looks like at the top of the scale: not just knowing your users, but building the guardrails that let you move fast without breaking the things that matter.</p>
      `,
      checks: [
        {
          question: "In a high-stakes domain, what extra job does discovery take on?",
          options: [
            "Producing more documentation for auditors",
            "De-risking — validating carefully before a consequential feature ships, so a wrong assumption fails small",
            "Slowing the team down to reduce mistakes"
          ],
          correct: 1,
          explanation: "Understanding users is necessary but not sufficient when the cost of being wrong is high. Controlled pilots and expert validation are how discovery keeps speed and safety together."
        },
        {
          label: "Bringing it together",
          question: "You're the most senior product person on a team that already runs solid user interviews. Based on this course, where's the highest-leverage improvement?",
          options: [
            "Increase the number of interviews per month",
            "Turn discovery into a standing system — continuous KPIs, org-wide user-centric habits, and validation guardrails — so understanding users doesn't depend on any one person doing interviews",
            "Switch from interviews to a large quarterly survey"
          ],
          correct: 1,
          explanation: "More interviews is a linear gain. Making discovery a system the whole org runs on — and that de-risks high-stakes work — is what compounds and what the advanced level is about."
        }
      ],
      reflection: {
        prompt: "Name one user-understanding practice on your team that lives only in one person's head. What would it take to turn it into a system — a KPI, a recurring cross-functional session, a ritual — that runs without them?"
      }
    }
  ]
};
