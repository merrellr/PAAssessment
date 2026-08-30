/* ================================================================
   COURSE CONTENT: Customer & Market Discovery, Lots of Experience
   Source article: "Overcoming Common Pitfalls in Early Stage Product
   Development for Healthcare SaaS" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["discovery-experienced"] = {
  sourceUrl: "https://www.linkedin.com/pulse/overcoming-common-pitfalls-early-stage-product-saas-robert-merrell-eshlc",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Build Around the Workflow, Not the Vision",
      preCheck: {
        label: "Before you read on — predict",
        question: "A clinician gets excited about a new tool idea in a discovery interview. Is that excitement itself reliable evidence of real product-market fit?",
        options: [
          "Yes, enthusiasm from a real user is the strongest signal you can get",
          "Not on its own, enthusiasm in an interview doesn't guarantee the tool fits how work actually gets done day to day"
        ],
        correct: 1,
        explanation: "Keep this in mind as you read, the lesson below is built around exactly this gap."
      },
      image: { src: "images/workflow-fit.png", alt: "Two workflow diagrams: Founder's Vision shows a product disconnected above the real workflow chain; Real Workflow shows the same product integrated inline within Intake, Care, Docs, and Billing" },
      body: `
        <p>Healthcare professionals operate in highly structured environments: established processes, compliance demands, severe time constraints. A product that seems valuable in theory can create real friction in practice if it asks clinicians, administrators, or billing staff to change too much too quickly.</p>
        <p>Startups often mistake interest during interviews for true product fit, only to discover later that the solution doesn't integrate naturally into the daily rhythm of care delivery or operations. Avoiding this takes more than a few discovery calls. It means direct exposure to real workflows and real constraints, talking to end users, economic buyers, technical stakeholders, and compliance leaders, not relying on one champion to represent everyone.</p>
      `,
      checks: [
        {
          question: "Why isn't strong interest from one enthusiastic clinician enough to validate a healthcare product idea?",
          options: [
            "Clinicians' opinions don't matter in purchasing decisions",
            "One champion doesn't represent the full set of workflows, constraints, and stakeholders the product actually has to fit into",
            "Interviews are an unreliable research method in general"
          ],
          correct: 1,
          explanation: "The pitfall isn't talking to users, it's stopping at one enthusiastic voice instead of exposure to the real range of workflows and stakeholders involved."
        },
        {
          question: "What does 'building around the founder's vision instead of the user's workflow' actually look like in practice?",
          options: [
            "Asking clinicians or billing staff to change too much about their existing process to fit the new tool",
            "Spending too much time on user interviews before building anything",
            "Focusing exclusively on regulatory requirements before writing any code"
          ],
          correct: 0,
          explanation: "This is the core failure mode: a product that looks valuable in theory but demands disruptive change from the people who'd have to use it daily."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Focus Is a Strategic Advantage",
      body: `
        <p>Healthcare startups often feel pressure to appear enterprise-ready from day one, building bloated products packed with features for every use case a prospect mentions. The result is usually complicated, expensive to maintain, and unclear in its core value.</p>
        <p>The strongest healthcare SaaS products begin by solving one painful problem for one clearly defined user group, establishing credibility through depth before expanding through breadth. A narrow scope also eases implementation and gives cleaner signals about what the market actually values.</p>
        <p>This connects directly to another common failure: not proving measurable value quickly enough. Broad promises like "improving care quality" or "enhancing patient engagement" aren't enough, they need to translate into outcomes a buyer can track and defend internally: reduced administrative time, faster patient throughput, lower no-show rates, higher collections.</p>
      `,
      checks: [
        {
          question: "Why does a narrow initial scope actually help with adoption, not just development speed?",
          options: [
            "It's cheaper to build, which is the only real benefit",
            "It reduces implementation risk for the customer and produces clearer signals about what the market actually values",
            "It means the product never needs to expand later"
          ],
          correct: 1,
          explanation: "Focus isn't just an engineering shortcut, it's a strategic bet: prove deep value in one place before spreading thin across many."
        },
        {
          question: "A founder says their product 'improves care quality.' What's missing, according to this lesson?",
          options: [
            "Nothing, that's a sufficient value proposition on its own",
            "A specific, trackable outcome, like reduced administrative time or lower no-show rates, that a buyer can measure and defend internally",
            "A broader claim covering even more use cases"
          ],
          correct: 1,
          explanation: "Vague claims are hard to justify budget around. The fix is connecting product usage to a specific number the buyer already cares about."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Integration and Compliance Aren't Later-Stage Problems",
      body: `
        <p>Standalone healthcare software often struggles to gain traction. Providers and health systems already run on EHRs, billing tools, scheduling systems, and internal reporting. If a new product can't connect to that environment, the integration burden shifts to the customer, and that burden can become a deal breaker. Integration needs to be part of the product strategy from day one, not a "later stage" technical problem.</p>
        <p>The same is true of security and compliance. Some early teams assume they can address HIPAA, data governance, and security controls once traction appears. That's risky. In healthcare, trust isn't a finishing layer added after the product works, it's part of the product itself. Buyers want to know how data is stored and who can access it long before the conversation reaches pricing.</p>
      `,
      checks: [
        {
          question: "Why can postponing integration planning become a viability problem, not just a technical inconvenience?",
          options: [
            "Because integrations always take exactly six months to build",
            "Because if a product can't connect to the systems a customer already relies on, the burden shifts to the customer and can become a reason not to buy",
            "Because regulators require integration before any product can be sold"
          ],
          correct: 1,
          explanation: "This is why the lesson treats integration as a product strategy question from day one: it directly affects adoption, not just engineering scope."
        },
        {
          question: "What does 'trust is part of the product itself' mean in the security and compliance context?",
          options: [
            "Every startup needs full HIPAA certification before writing their first line of code",
            "Compliance-aware habits, like access controls and clear data handling, need to be built in from the start rather than bolted on once traction appears",
            "Security only matters once a company reaches enterprise scale"
          ],
          correct: 1,
          explanation: "The lesson is explicit that this doesn't mean overengineering every policy upfront, it means building with compliance-aware habits early, not treating trust as a finishing touch."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: The Buyer Is Not Always the User",
      image: { src: "images/stakeholder-map.png", alt: "A hub-and-spoke map with Purchase Decision at the center, connected to End user (clinician), Economic buyer, IT, Legal / compliance, Department leadership, and Technical stakeholders" },
      body: `
        <p>In healthcare organizations, the person who loves a product is often not the one who approves the budget, signs the contract, or clears procurement. A clinician may strongly support a tool that improves their workflow, but the final decision can depend on department leadership, finance, IT, legal, or compliance. Startups that build based only on user enthusiasm can end up with a product people want but organizations still won't buy.</p>
        <p>Successful teams map the full buying journey early: who benefits, who influences the decision, who owns the budget, and what objections each stakeholder is likely to raise. That shapes not just the product, but implementation plans, ROI messaging, and security documentation too. In healthcare SaaS, product development and go-to-market are tightly linked.</p>
      `,
      checks: [
        {
          question: "A clinician champions your product enthusiastically, but the deal stalls in procurement. What does this lesson say likely happened?",
          options: [
            "The clinician's opinion doesn't actually matter",
            "User enthusiasm was mistaken for buying intent, and other stakeholders (budget owner, IT, legal) weren't mapped or addressed early",
            "The product must not actually work well"
          ],
          correct: 1,
          explanation: "This is the exact failure mode the lesson describes: a real user's love for the product doesn't guarantee the organization's buying process will clear it."
        },
        {
          question: "Why does the article say product development and go-to-market are 'tightly linked' in healthcare SaaS specifically?",
          options: [
            "Because marketing budgets are unusually large in healthcare",
            "Because understanding the full buying journey shapes real product decisions, like what security documentation or ROI messaging needs to exist, not just how to sell what's already built",
            "Because healthcare buyers only care about price"
          ],
          correct: 1,
          explanation: "Mapping the buying journey isn't a separate sales activity here, it directly feeds back into what the product and its supporting materials actually need to include."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Design Pilots and Implementation With Discipline",
      body: `
        <p>Many healthcare SaaS startups treat pilots as loosely defined trial periods rather than structured validation opportunities. Without clear success criteria, ownership, and timelines, pilots often drag on without producing a real decision, continued engagement gets mistaken for progress. Step through what a disciplined pilot actually requires.</p>
      `,
      steps: [
        { title: "Agree on goals upfront", detail: "Before the pilot starts, agree on what question it's actually meant to answer. A pilot without a defined goal can run indefinitely without ever producing a real decision." },
        { title: "Define the user group", detail: "Decide exactly who will participate and why they represent the broader rollout. This keeps the pilot's results meaningful beyond just one enthusiastic team." },
        { title: "Set a clear duration", detail: "An open-ended pilot invites indefinite delay. A fixed timeline forces both sides toward an actual decision point." },
        { title: "Choose metrics in advance", detail: "Decide what \"success\" looks like numerically before you start, not after you see how things went. This prevents retroactively redefining success to match the outcome." },
        { title: "Minimize setup complexity", detail: "The customer should be able to experience real value quickly. A pilot that requires heavy configuration before anyone sees a benefit undermines its own purpose." }
      ],
      checks: [
        {
          question: "A pilot has been running for four months with no clear end date or decision point. What does this lesson say is the most likely explanation?",
          options: [
            "The product is performing exceptionally well",
            "The pilot probably lacked clear goals, timelines, or decision points from the start, so continued engagement is being mistaken for real progress",
            "Four months is a normal and healthy pilot length"
          ],
          correct: 1,
          explanation: "An undefined pilot can drift indefinitely. Discipline, goals, duration, metrics, decision points, is what turns a pilot into an actual answer rather than an open-ended trial."
        }
      ]
    },
    {
      id: 6,
      title: "Lesson 6: Credibility Is Earned, Not Presented",
      body: `
        <p>Some startups chase credibility signals instead of actual readiness, polished branding, broad feature sets, large vision statements, while neglecting the harder work of validating demand and delivering repeatable results. In healthcare, credibility does matter, but it's earned through trust, consistency, and evidence rather than presentation alone.</p>
        <p>The most resilient healthcare SaaS companies grow from a strong operational foundation. They understand a specific user deeply, solve a painful problem clearly, build trust into the product, and create a path to measurable value. They don't assume healthcare will adapt to the product. They shape the product to fit healthcare as it actually works.</p>
      `,
      checks: [
        {
          question: "What's the difference between 'looking established' and actual readiness, according to this closing lesson?",
          options: [
            "There's no real difference, polish is what earns trust in healthcare",
            "Looking established relies on presentation (branding, broad features, vision statements), while real readiness comes from validated demand and repeatable, evidenced results",
            "Actual readiness only matters for companies past their Series A"
          ],
          correct: 1,
          explanation: "This closes the loop on the whole course: credibility built on presentation alone is fragile, credibility built on evidence and consistency is durable."
        },
        {
          label: "Bringing it together",
          question: "A healthcare startup has: a broad feature set, polished branding, one enthusiastic clinician champion, and an open-ended pilot with no clear metrics. Based on this whole course, what's the most likely underlying problem?",
          options: [
            "Nothing is wrong, this is a strong go-to-market position",
            "Several pitfalls are compounding: unfocused scope (Lesson 2), a stakeholder gap beyond the one champion (Lesson 4), and an undisciplined pilot (Lesson 5), all wrapped in presentation rather than evidence (this lesson)",
            "The branding needs to be even more polished to close the deal"
          ],
          correct: 1,
          explanation: "This is exactly the pattern the course warns about: each individual pitfall compounds the others. Focus, real stakeholder mapping, and pilot discipline are what turn presentation into actual readiness."
        }
      ],
      reflection: {
        prompt: "Think about a product or tool you've helped bring to a healthcare (or other highly regulated) organization. Which of these six pitfalls came closest to tripping up that effort, and what would you do differently now?"
      }
    }
  ]
};
