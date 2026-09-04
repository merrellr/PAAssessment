/* ================================================================
   COURSE CONTENT: Stakeholder Communication & Influence, Advanced Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 7 ("Collaborating with Cross-Functional Teams"), Sections
   1, 4 and 5.2, with Chapter 4 Sections 3-4 (culture, mentorship)
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["stakeholder-advanced"] = {
  sourceUrl: "",
  recap: [
    "Advanced stakeholder work is shifting from managing your own relationships to designing how the whole org aligns — and mentoring others to run it.",
    "Build an aligned cross-functional culture: a shared vision, org-wide comms channels, and syncs that are institutions with owners, not favors.",
    "Run product, marketing, and sales as one motion — joint buyer personas, messaging aligned to real value props, sales enablement kept current.",
    "Mentor stakeholder skill deliberately — knowledge sharing, modeling empowerment and recognition, coaching through real situations, designing yourself out of the critical path.",
    "Make the system durable and measurable — feedback loops as standing institutions, action plans communicated org-wide, watching whether decisions get made without escalation."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: From Managing Relationships to Shaping the System",
      preCheck: {
        label: "Before you read on — predict",
        question: "You're already excellent at cross-functional relationships personally. What's the next level?",
        options: [
          "Have those strong relationships with even more people",
          "Design how the whole organization aligns and collaborates — so it doesn't depend on your personal relationships — and teach others to do the same",
          "Move into a formal management role"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. Advanced stakeholder work is a shift in scope."
      },
      body: `
        <p>At earlier levels, stakeholder skill is personal: you build trust with engineering, you keep your sponsor informed, you navigate a disagreement well. At an advanced level, the job changes. You're now responsible for <strong>how the organization communicates and collaborates cross-functionally</strong>, as a system, and for <strong>mentoring other people</strong> to operate it.</p>
        <p>The tell that you've made this shift: cross-functional alignment keeps working when you're on vacation. It's built into the rhythms, the shared artifacts, and the people you've coached, not held together by your individual relationships.</p>
        <p>A strong product culture isn't built overnight. It takes an intentional approach to align teams toward a shared mission, and that intentional design is the work.</p>
      `,
      checks: [
        {
          question: "What distinguishes advanced stakeholder work from earlier levels, per this lesson?",
          options: [
            "Having strong relationships with a larger number of people",
            "Shifting from managing your own cross-functional relationships to designing how the whole organization aligns — and mentoring others to run it",
            "Getting formal authority over the other functions"
          ],
          correct: 1,
          explanation: "The scope moves from personal to systemic: you're building the collaboration model itself, not just working it well yourself."
        },
        {
          question: "What's the \"tell\" that you've made this shift?",
          options: [
            "You're invited to more meetings",
            "Cross-functional alignment keeps working when you're away, because it's built into rhythms, artifacts, and coached people",
            "Other teams start reporting to you"
          ],
          correct: 1,
          explanation: "If alignment collapses without you in the room, it was your relationships holding it together. If it holds, you've built a system."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Building an Aligned Cross-Functional Culture",
      body: `
        <p>Aligning an organization is deliberate work with a few load-bearing pieces.</p>
        <svg viewBox="0 0 400 170" style="width:100%; height:auto; margin:4px 0 2px;">
          <circle cx="200" cy="85" r="26" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.5"/>
          <text x="200" y="82" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">Product</text>
          <text x="200" y="94" text-anchor="middle" font-family="sans-serif" font-size="7" fill="#4B5768">shared vision</text>
          <g font-family="'Space Grotesk',sans-serif" font-size="8.5" font-weight="700" fill="#12305e" text-anchor="middle">
            <circle cx="200" cy="22" r="16" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="200" y="25">Eng</text>
            <circle cx="330" cy="55" r="16" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="330" y="58">Design</text>
            <circle cx="340" cy="120" r="16" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="340" y="123">Sales</text>
            <circle cx="200" cy="150" r="16" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="200" y="153">Mktg</text>
            <circle cx="60" cy="120" r="16" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="60" y="123">Support</text>
            <circle cx="70" cy="55" r="16" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="70" y="58">Risk</text>
          </g>
          <g stroke="#9AA3AD" stroke-width="1">
            <line x1="200" y1="59" x2="200" y2="38"/><line x1="223" y1="72" x2="315" y2="60"/><line x1="224" y1="96" x2="325" y2="112"/>
            <line x1="200" y1="111" x2="200" y2="134"/><line x1="177" y1="96" x2="75" y2="112"/><line x1="178" y1="72" x2="85" y2="60"/>
          </g>
        </svg>
        <p><strong>A shared vision</strong>, set with key stakeholders involved early, so every function can see why the product exists and what it's for. <strong>Org-wide communication channels</strong> — regular cross-functional syncs and a genuine single source of truth (a shared board, a shared wiki) — established as institutions, not favors you do. When those exist, alignment stops being something you personally broker at every turn.</p>
      `,
      checks: [
        {
          question: "Why involve key stakeholders early in setting the shared vision?",
          options: [
            "To slow the process down for thoroughness",
            "So every function can see why the product exists and what it's for — which is what lets them align without constant brokering",
            "Because vision statements need many authors to sound credible"
          ],
          correct: 1,
          explanation: "A vision the functions helped shape is one they'll navigate by on their own. One handed down is one you'll spend your time re-explaining."
        },
        {
          question: "What does it mean to establish cross-functional syncs \"as institutions, not favors\"?",
          options: [
            "Making attendance mandatory with HR enforcement",
            "They're standing, expected parts of how the org runs — not something that happens because you personally organize it each time",
            "Holding them in a dedicated room"
          ],
          correct: 1,
          explanation: "A favor stops when you stop doing it. An institution persists. The advanced move is making the alignment mechanism part of the org's default operation."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Product, Marketing, and Sales as One Motion",
      body: `
        <p>Advanced cross-functional work means the go-to-market functions operate as one motion with product, not a handoff.</p>
        <ul>
          <li><strong>Build buyer personas <em>with</em> marketing</strong>, from shared user research and segmentation, so the people you're designing for and the people they're messaging to are the same people.</li>
          <li><strong>Align messaging to real value propositions.</strong> Marketing's claims and the product's actual differentiators should be the same list. Gaps there show up as churn when reality doesn't match the pitch.</li>
          <li><strong>Equip sales properly.</strong> Sales is often the customer's first contact. Give them playbooks, demo scripts, and objection-handling guides, and keep them trained as the product changes, so they can articulate value accurately.</li>
        </ul>
        <svg viewBox="0 0 400 106" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="saMotion" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="8" font-weight="700" fill="#12305e">
            <rect x="8" y="12" width="112" height="26" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.1"/><text x="64" y="28">Marketing touch</text>
            <rect x="144" y="12" width="112" height="26" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.1"/><text x="200" y="28">Sales conversation</text>
            <rect x="280" y="12" width="112" height="26" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.1"/><text x="336" y="28">The product</text>
          </g>
          <line x1="120" y1="25" x2="142" y2="25" stroke="#9AA3AD" stroke-width="1.2" marker-end="url(#saMotion)"/>
          <line x1="256" y1="25" x2="278" y2="25" stroke="#9AA3AD" stroke-width="1.2" marker-end="url(#saMotion)"/>
          <rect x="8" y="52" width="384" height="22" rx="5" fill="#EEF9F1" stroke="#2E8B57" stroke-width="1.2"/>
          <text x="200" y="66" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#256b45">one shared set: personas &#183; value propositions &#183; claims</text>
          <text x="200" y="92" text-anchor="middle" font-family="sans-serif" font-size="7.5" fill="#4B5768">The customer's experience stays consistent from first touch to the product itself.</text>
        </svg>
        <p>When this works, a customer's experience is consistent from the first marketing touch through the sales conversation to the product itself.</p>
      `,
      checks: [
        {
          question: "Marketing built its buyer personas from campaign data; product built different ones from user interviews. Six months on, the roadmap and the ad targeting are aimed at noticeably different people. What does this lesson say went wrong?",
          options: [
            "Product should have deferred to marketing's personas",
            "Separate persona work drifts — the fix is one shared body of research both functions build from",
            "The personas were revisited too often and lost coherence"
          ],
          correct: 1,
          explanation: "Separate persona work drifts. A shared persona built from shared research keeps product design and market messaging pointed at the same audience."
        },
        {
          question: "What's the risk when marketing's messaging and the product's actual differentiators aren't the same list?",
          options: [
            "The marketing team looks less competent",
            "Customers arrive expecting something the product doesn't deliver, which shows up as churn",
            "Sales has more material to memorize"
          ],
          correct: 1,
          explanation: "A pitch that outruns the product creates a gap the customer discovers after buying. Keeping the claims and the differentiators aligned is a retention issue, not just a marketing one."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Mentoring Stakeholder Skill",
      body: `
        <p>A system that only you can run isn't finished. The advanced level includes deliberately growing stakeholder skill in the people around you.</p>
      `,
      steps: [
        { title: "Make knowledge sharing routine", detail: "Lunch-and-learns, internal write-ups, mentorship pairings. The cross-functional patterns that work should be documented and taught, not rediscovered by each new PM." },
        { title: "Model empowerment and recognition", detail: "Give people real autonomy in their stakeholder relationships and trust their judgment. Recognize good cross-functional work publicly. What you reward, others repeat." },
        { title: "Coach through real situations", detail: "When a less experienced PM hits a hard stakeholder moment — a tense engineering disagreement, a sponsor pushing an off-strategy request — walk through it with them rather than taking it over. The judgment transfers by doing." },
        { title: "Design yourself out of the critical path", detail: "The goal is that alignment holds without you brokering it. If every cross-functional decision still routes through you, the mentoring hasn't landed yet." }
      ],
      checks: [
        {
          question: "When a less experienced PM hits a hard stakeholder moment, what does this lesson recommend?",
          options: [
            "Step in and handle it yourself so it's resolved cleanly",
            "Walk through it with them so the judgment transfers — coaching, not taking over",
            "Send them the relevant chapter to read"
          ],
          correct: 1,
          explanation: "Taking it over solves today's problem and teaches nothing. Coaching through it is how stakeholder judgment actually gets built in someone else."
        },
        {
          question: "What's the sign that mentoring has worked, per this lesson?",
          options: [
            "The people you mentored cite you as a reference",
            "Cross-functional alignment holds without every decision routing through you",
            "Your team's satisfaction scores go up"
          ],
          correct: 1,
          explanation: "\"Design yourself out of the critical path.\" If alignment still depends on you personally, the capability hasn't transferred."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Making It Stick",
      body: `
        <p>The last job is making the collaboration system durable, and knowing whether it's actually working.</p>
        <p><strong>Turn feedback loops into standing institutions.</strong> Customer advisory groups, beta programs, and cross-functional reviews should be permanent fixtures with owners, not things that happen when someone remembers.</p>
        <p><strong>Close loops org-wide.</strong> When recurring feedback themes emerge, build an action plan and communicate it to <em>both</em> internal teams and customers. That's what keeps every function pointed at the same reality.</p>
        <p><strong>Measure the collaboration, not just the product.</strong> Watch whether decisions are getting made cross-functionally without escalation, whether the same misalignments keep recurring, whether the syncs still produce decisions or have become status theater. Track sentiment (NPS, CSAT) as one signal that the internal alignment is reaching customers.</p>
        <p>Put together: an aligned culture with a shared vision, GTM as one motion with product, stakeholder skill deliberately grown in others, and durable feedback institutions you measure. That's shaping how an organization collaborates, rather than just collaborating well within it.</p>
      `,
      checks: [
        {
          question: "What does \"measure the collaboration, not just the product\" mean here?",
          options: [
            "Run an annual engagement survey",
            "Watch whether cross-functional decisions get made without escalation, whether the same misalignments recur, and whether syncs still produce decisions",
            "Count the number of cross-functional meetings held"
          ],
          correct: 1,
          explanation: "Meeting counts are activity. The real signals are whether the system is producing aligned decisions and whether the same friction keeps coming back."
        },
        {
          label: "Bringing it together",
          question: "You're handing your team to a successor. Based on this course, what's the best evidence that your cross-functional system will survive the transition?",
          options: [
            "A thorough handover document listing all your stakeholder contacts",
            "The alignment rhythms are institutions with owners, GTM already runs as one motion, and two people on the team can already coach the cross-functional patterns themselves",
            "Your successor has a strong personal network across the functions"
          ],
          correct: 1,
          explanation: "A contact list and a well-connected successor both re-personalize the system. Durable alignment lives in owned institutions and coached people — that's what a transition tests."
        }
      ],
      reflection: {
        prompt: "Name one piece of cross-functional alignment on your team that currently depends on you personally. What would it take — a standing ritual with an owner, a shared artifact, a coached teammate — to make it hold without you?"
      }
    }
  ]
};
