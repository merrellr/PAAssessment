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
  recap: [
    "Build around the customer's actual workflow, not the founding vision. The workflow is where adoption is won or lost.",
    "Narrow focus is a strategic advantage: solve one painful problem for one clearly defined group before expanding.",
    "Integration and compliance are discovery inputs, not later-stage cleanup. Surface them while the design is still cheap to change.",
    "The buyer is often not the user; you have to understand and sell to both, with different messages.",
    "Design pilots and implementations with discipline: clear success criteria, a representative cohort, a defined end.",
    "Credibility is earned through depth on a real problem, not presented in a pitch."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Build Around the Workflow, Not the Vision",
      preCheck: {
        label: "Before you read on, predict",
        question: "A clinician gets excited about a new tool idea in a discovery interview. Is that excitement itself reliable evidence of real product-market fit?",
        options: [
          "Yes. Enthusiasm from a real user is the strongest signal you can get",
          "Not on its own. Enthusiasm in an interview doesn't guarantee the tool fits how work actually gets done day to day"
        ],
        correct: 1,
        explanation: "Keep this in mind as you read: the lesson below is built around exactly this gap."
      },
      figures: {
        "fit": {
          "type": "chain",
          "title": "Build around the workflow, not the vision",
          "sub": "Same product, same team. The only difference is where it sits in the working day.",
          "lanes": [
            {
              "label": "Founder's vision",
              "tone": "coral",
              "nodes": [
                {
                  "title": "Intake",
                  "icon": "doc"
                },
                {
                  "title": "Care",
                  "icon": "heart"
                },
                {
                  "title": "Documentation",
                  "icon": "book"
                },
                {
                  "title": "Billing",
                  "icon": "dollar"
                }
              ],
              "detour": {
                "at": 1,
                "title": "The product",
                "text": "One more place to go",
                "icon": "box"
              },
              "result": "Extra step, extra friction: easy for a busy team to ignore",
              "mark": "x"
            },
            {
              "label": "Real workflow",
              "tone": "teal",
              "nodes": [
                {
                  "title": "Intake",
                  "icon": "doc"
                },
                {
                  "title": "Care",
                  "icon": "heart"
                },
                {
                  "title": "The product",
                  "text": "Part of the step",
                  "icon": "box",
                  "state": "hl"
                },
                {
                  "title": "Documentation",
                  "icon": "book"
                },
                {
                  "title": "Billing",
                  "icon": "dollar"
                }
              ],
              "result": "Feels like the job, not an add-on: nothing new to remember",
              "mark": "check"
            }
          ],
          "foot": "Interest in an interview is not fit. Fit is when the product disappears into work people already do."
        }
      },
      body: `
        <div data-fig="fit"></div>
        <p>Healthcare professionals operate in highly structured environments, with established processes, compliance demands, and severe time constraints. A product that seems valuable in theory can create real friction in practice if it asks clinicians, administrators, or billing staff to change too much too quickly.</p>
        <p>Startups often mistake interest during interviews for true product fit, only to discover later that the solution doesn't integrate naturally into the daily rhythm of care delivery or operations. Avoiding this takes more than a few discovery calls. It means direct exposure to real workflows and real constraints: talking to end users, economic buyers, technical stakeholders, and compliance leaders, not relying on one champion to represent everyone.</p>
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
          explanation: "The pitfall isn't talking to users. It's stopping at one enthusiastic voice instead of seeking out the real range of workflows and stakeholders involved."
        },
        {
          question: "What does \"building around the founder's vision instead of the user's workflow\" actually look like in practice?",
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
        <p>This connects directly to another common failure: not proving measurable value quickly enough. Broad promises like "improving care quality" or "enhancing patient engagement" aren't enough. They need to translate into outcomes a buyer can track and defend internally: reduced administrative time, faster patient throughput, lower no-show rates, higher collections.</p>
      `,
      checks: [
        {
          question: "Two teams pitch the same buyer. Team A leads with one workflow it handles end to end for a single role. Team B leads with a broad platform spanning six use cases, \"so you're covered as you grow.\" Which is the stronger opening, per this lesson?",
          options: [
            "Team B, since covering more use cases lowers the buyer's risk",
            "Team A, because depth in one place lowers the buyer's implementation risk and gives a cleaner read on what the market actually values",
            "Neither. The decision comes down to price"
          ],
          correct: 1,
          explanation: "Focus isn't just an engineering shortcut. It's a strategic bet: prove deep value in one place before spreading thin across many."
        },
        {
          question: "A founder says their product \"improves care quality.\" What's missing, according to this lesson?",
          options: [
            "Nothing. That's a sufficient value proposition on its own",
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
      figures: {
        "integration": {
          "type": "track",
          "title": "Who absorbs the integration work, and when",
          "sub": "Same product, same integration work.",
          "x": "Time →",
          "kinds": {
            "build": "Product work",
            "risk": "Integration left to the customer",
            "good": "Integration built in"
          },
          "rows": [
            {
              "label": "Integration deferred",
              "tone": "coral",
              "segments": [
                {
                  "len": 3,
                  "kind": "build",
                  "label": "Ship standalone"
                },
                {
                  "len": 2,
                  "kind": "build",
                  "label": "Traction"
                },
                {
                  "len": 4,
                  "kind": "risk",
                  "label": "Customer carries it"
                }
              ],
              "result": "Deal risk: the burden lands on the customer, late",
              "mark": "x"
            },
            {
              "label": "In the strategy from day one",
              "tone": "teal",
              "segments": [
                {
                  "len": 3,
                  "kind": "good",
                  "label": "Connect to their systems"
                },
                {
                  "len": 2,
                  "kind": "build",
                  "label": "Low switching cost"
                },
                {
                  "len": 4,
                  "kind": "build",
                  "label": "Adoption"
                }
              ],
              "result": "The product fits the systems it has to live with",
              "mark": "check"
            }
          ],
          "foot": "The difference is who absorbs the integration work, and when."
        }
      },
      body: `
        <p>Standalone healthcare software often struggles to gain traction. Providers and health systems already run on EHRs, billing tools, scheduling systems, and internal reporting. If a new product can't connect to that environment, the integration burden shifts to the customer, and that burden can become a deal breaker. Integration needs to be part of the product strategy from day one, not a "later stage" technical problem.</p>
        <div data-fig="integration"></div>
        <p>The same is true of security and compliance. Some early teams assume they can address HIPAA, data governance, and security controls once traction appears. That's risky. In healthcare, trust isn't a finishing layer added after the product works. It's part of the product itself. Buyers want to know how data is stored and who can access it long before the conversation reaches pricing.</p>
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
          question: "What does \"trust is part of the product itself\" mean in the security and compliance context?",
          options: [
            "Every startup needs full HIPAA certification before writing their first line of code",
            "Compliance-aware habits, like access controls and clear data handling, need to be built in from the start rather than bolted on once traction appears",
            "Security only matters once a company reaches enterprise scale"
          ],
          correct: 1,
          explanation: "The lesson is explicit that this doesn't mean over-engineering every policy up front. It means building with compliance-aware habits early, not treating trust as a finishing touch."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: The Buyer Is Not Always the User",
      figures: {
        "buyers": {
          "type": "hub",
          "title": "The buyer is not always the user",
          "sub": "Everyone with a say in the purchase decision.",
          "center": {
            "title": "Purchase decision"
          },
          "items": [
            {
              "title": "End user",
              "text": "The clinician",
              "tone": "teal"
            },
            {
              "title": "Economic buyer",
              "text": "Owns the budget",
              "tone": "amber"
            },
            {
              "title": "IT",
              "text": "Integration and security",
              "tone": "sky"
            },
            {
              "title": "Legal and compliance",
              "text": "Risk and contracts",
              "tone": "coral"
            },
            {
              "title": "Department leadership",
              "text": "Priorities and change",
              "tone": "violet"
            },
            {
              "title": "Technical stakeholders",
              "text": "Architecture fit",
              "tone": "navy"
            }
          ]
        }
      },
      body: `
        <div data-fig="buyers"></div>
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
          question: "Why does the lesson say product development and go-to-market are \"tightly linked\" in healthcare SaaS specifically?",
          options: [
            "Because marketing budgets are unusually large in healthcare",
            "Because understanding the full buying journey shapes real product decisions, like what security documentation or ROI messaging needs to exist, not just how to sell what's already built",
            "Because healthcare buyers only care about price"
          ],
          correct: 1,
          explanation: "Mapping the buying journey isn't a separate sales activity here. It feeds directly back into what the product and its supporting materials actually need to include."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Design Pilots and Implementation With Discipline",
      body: `
        <p>Many healthcare SaaS startups treat pilots as loosely defined trial periods rather than structured validation opportunities. Without clear success criteria, ownership, and timelines, pilots often drag on without producing a real decision, and continued engagement gets mistaken for progress. Step through what a disciplined pilot actually requires.</p>
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
          explanation: "An undefined pilot can drift indefinitely. Discipline (goals, duration, metrics, decision points) is what turns a pilot into an actual answer rather than an open-ended trial."
        }
      ]
    },
    {
      id: 6,
      title: "Lesson 6: Credibility Is Earned, Not Presented",
      body: `
        <p>Some startups chase credibility signals instead of actual readiness (polished branding, broad feature sets, large vision statements) while neglecting the harder work of validating demand and delivering repeatable results. In healthcare, credibility does matter, but it's earned through trust, consistency, and evidence rather than presentation alone.</p>
        <p>The most resilient healthcare SaaS companies grow from a strong operational foundation. They understand a specific user deeply, solve a painful problem clearly, build trust into the product, and create a path to measurable value. They don't assume healthcare will adapt to the product. They shape the product to fit healthcare as it actually works.</p>
      `,
      checks: [
        {
          question: "What's the difference between \"looking established\" and actual readiness, according to this closing lesson?",
          options: [
            "There's no real difference. Polish is what earns trust in healthcare",
            "Looking established relies on presentation (branding, broad features, vision statements), while real readiness comes from validated demand and repeatable, evidenced results",
            "Actual readiness only matters for companies past their Series A"
          ],
          correct: 1,
          explanation: "This closes the loop on the whole course: credibility built on presentation alone is fragile; credibility built on evidence and consistency is durable."
        },
        {
          label: "Bringing it together",
          question: "A healthcare startup has a broad feature set, polished branding, one enthusiastic clinician champion, and an open-ended pilot with no clear metrics. Based on this whole course, what's the most likely underlying problem?",
          options: [
            "Nothing is wrong. This is a strong go-to-market position",
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
