/* ================================================================
   COURSE CONTENT: Stakeholder Communication & Influence, Lots of Experience
   Source: "The Product Manager's Playbook" by Robert Merrell —
   Chapter 7, "Collaborating with Cross-Functional Teams to Drive
   Product Success"
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["stakeholder-experienced"] = {
  sourceUrl: "",
  recap: [
    "A shared vision, set with stakeholders involved early, is the starting point for cross-functional alignment.",
    "Working well with engineering and design means respecting technical constraints and enabling bi-directional feedback.",
    "Bring risk, legal, and compliance in early — as collaborators who shape the design, not a gate at the end.",
    "Build a customer-centric culture across teams with standing feedback loops and shared sentiment metrics."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: A Shared Vision Is the Starting Point",
      preCheck: {
        label: "Before you read on — predict",
        question: "When engineering, design, and compliance all seem to want different things from a project, what's usually the root cause?",
        options: [
          "One team is simply wrong and needs to be overruled",
          "There's often no genuinely shared vision that all teams were actually involved in shaping"
        ],
        correct: 1,
        explanation: "Keep this in mind as you read, it's the foundation the rest of this lesson builds from."
      },
      body: `
        <p>Success in product work hinges on collective collaboration between engineering, design, marketing, sales, compliance, and support. That collaboration isn't automatic, it requires an intentional approach to align teams toward a shared mission, especially given how different each function's priorities and incentives naturally are.</p>
        <p>A shared vision acts as the guiding light for all of these teams. It clarifies why the product exists and what it's trying to achieve. Building it starts with involving key stakeholders early, engineers, compliance officers, technical experts, so all voices are genuinely heard rather than informed after the fact, and ensuring that vision reflects real user needs, not just what's easiest to build.</p>
        <p>None of this works without real communication channels. Regular cross-functional syncs and shared tools that create a single source of truth are what keep a vision from quietly drifting apart as each team interprets it their own way.</p>
      `,
      checks: [
        {
          question: "Why does involving stakeholders early in vision-setting matter more than just informing them once a plan is decided?",
          options: [
            "It doesn't really matter, informing people later is just as effective",
            "Early involvement means the vision reflects what different functions actually need and can commit to, rather than being handed a plan they had no hand in shaping",
            "It's mainly a courtesy with no real effect on outcomes"
          ],
          correct: 1,
          explanation: "This is the difference between genuine alignment and simply being told what was already decided, only the former tends to hold up under pressure."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Working Well With Engineering and Design",
      body: `
        <p>Maintaining strong relationships with engineering and design is critical to turning vision into reality, and each requires a different kind of care.</p>
        <p>With engineering, act as a liaison between user needs and technical capability. Respect the real technical constraints your engineers are navigating, especially around sensitive data or complex integrations, and create room for genuine bi-directional feedback, where engineers can push back on an idea or suggest a better approach based on what they know that you don't.</p>
        <p>With design, remember that good design is more than aesthetics, it's about reducing cognitive load and fitting how people actually work. Share user personas, interview notes, and workflow context directly with designers rather than just a list of requirements, and make accessibility a real priority, not an afterthought, since it directly determines who can actually use what you build.</p>
      `,
      checks: [
        {
          question: "What does 'bi-directional feedback' with engineering actually mean in practice?",
          options: [
            "Engineers implement whatever the product team decides, without pushback",
            "Engineers can surface technical concerns or better approaches, and that feedback genuinely shapes the plan, not just execution details",
            "Engineers set the product roadmap independently"
          ],
          correct: 1,
          explanation: "This is a real two-way relationship: technical expertise feeding back into product decisions, not just decisions flowing one direction into implementation."
        },
        {
          question: "Why does this lesson say design is 'more than aesthetics'?",
          options: [
            "Because visual polish doesn't matter at all",
            "Because good design also reduces cognitive load and fits real workflows, which requires real context from the product team, not just a features list",
            "Because designers should focus exclusively on branding"
          ],
          correct: 1,
          explanation: "Effective design depends on understanding the actual people and workflows involved, information the product team is positioned to share directly."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Bridging Product and Risk, Legal, or Compliance",
      body: `
        <p>In any regulated or risk-sensitive space, product managers have to navigate a complex landscape of rules and standards, and that means collaborating closely with legal, security, or compliance functions rather than treating them as a late-stage checkpoint.</p>
        <p>Engage these functions early in the development cycle. Waiting until a feature is nearly finished to ask "is this okay?" is exactly what creates expensive last-minute rework and blown timelines. Run workshops to educate the broader team on the regulations or standards that actually apply, and embed compliance-related tasks directly into the roadmap so they get proper prioritization instead of being squeezed in at the end.</p>
        <p>The real reframe here: seek compliance as an enabler, not a barrier. The goal isn't choosing between innovation and safety, it's finding creative ways to innovate that still meet the standards that actually matter, and validating those innovations thoroughly before they ship.</p>
      `,
      checks: [
        {
          question: "Why does engaging compliance or legal early in development matter more than involving them right before launch?",
          options: [
            "It doesn't matter when they're involved, as long as it happens eventually",
            "Late involvement tends to surface problems only after significant work is already done, creating expensive rework, early involvement catches issues while they're still cheap to fix",
            "Compliance teams prefer to be involved as late as possible"
          ],
          correct: 1,
          explanation: "The cost of a compliance issue found in week one versus week twelve is completely different, this is the practical reason early engagement matters."
        },
        {
          question: "What does it mean to treat compliance as 'an enabler, not a barrier'?",
          options: [
            "Ignoring compliance requirements in favor of speed",
            "Looking for ways to innovate that still genuinely meet required standards, rather than treating compliance and innovation as always opposed",
            "Letting compliance teams make all final product decisions"
          ],
          correct: 1,
          explanation: "This reframe doesn't lower the bar, it changes the posture: working with compliance to find a path that satisfies both innovation and the real requirements, rather than assuming they're incompatible."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Building a Customer-Centric Culture Across Teams",
      body: `
        <p>Product success doesn't depend only on internal teams working well together, it also depends on building a genuinely customer-centric culture that continuously incorporates real feedback.</p>
        <p>Establish real feedback loops: customer advisory groups with key users, and user testing or beta programs that validate new features before a full rollout. Collecting feedback is only half the job, though. Use metrics like Net Promoter Score and Customer Satisfaction Score to track sentiment over time, and build real action plans around recurring themes, then actually communicate those plans back to both internal teams and customers.</p>
      `,
      checks: [
        {
          question: "Why does this lesson emphasize communicating action plans back to customers, not just collecting their feedback?",
          options: [
            "It's a purely symbolic gesture with no real function",
            "Closing the loop shows customers their input actually leads somewhere, which is what makes people keep giving useful feedback instead of tuning out",
            "Customers are legally entitled to updates on every feature request"
          ],
          correct: 1,
          explanation: "A feedback loop that only takes input and never shows what happened with it tends to quietly dry up, people stop bothering once it feels like shouting into a void."
        },
        {
          label: "Bringing it together",
          question: "A new feature clears legal review at the very end of development and has to be significantly reworked as a result, delaying launch by six weeks. Based on this whole course, what earlier step would most likely have prevented this?",
          options: [
            "Skipping legal review entirely to save time",
            "Involving legal/compliance early in the development cycle (Lesson 3) as part of the same shared-vision, cross-functional alignment described in Lesson 1, rather than treating it as a final gate",
            "Only involving engineering and design, since legal isn't really a product concern"
          ],
          correct: 1,
          explanation: "This connects Lesson 1's shared-vision principle directly to Lesson 3's specific compliance guidance: functions brought in early, as genuine stakeholders in the vision, catch problems while they're still cheap to fix instead of at the worst possible moment."
        }
      ],
      reflection: {
        prompt: "Think about a recent project where a function outside product and engineering (legal, compliance, support, finance) got involved later than ideal. What would engaging them one stage earlier have actually looked like?"
      }
    }
  ]
};
