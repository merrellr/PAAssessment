/* ================================================================
   COURSE CONTENT: AI Fluency — Organizational, Lots of Experience
   Source article: "Agentic AI as an Internal Product: Building PM
   Copilots for Your Own Organization" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiOrg-experienced"] = {
  sourceUrl: "https://www.linkedin.com/pulse/agentic-ai-internal-product-building-pm-copilots-your-robert-merrell-jlepc",
  recap: [
    "Build an internal AI copilot with product rigor, not IT rigor — discovery, pilot, feedback, iteration, adoption.",
    "Discovery — find the work that's genuinely worth automating.",
    "Pilot small, real, and closely watched.",
    "In feedback, listen for corrections, not compliments — the corrections tell you what to fix.",
    "Iterate to earn the next stage of rollout; scale doesn't fix an unearned tool, it multiplies the frustration.",
    "Measure adoption like the product metric it is."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Product Rigor, Not IT Rigor",
      preCheck: {
        label: "Before you read on — predict",
        question: "An ops team asks an engineer to \"build a bot that summarizes tickets.\" It ships in a sprint and lands in a Slack channel. What's the most likely outcome three months later?",
        options: [
          "Everyone loves it and uses it daily",
          "Almost nobody's using it, and nobody can quite explain why",
          "It gets replaced with a better bot within a month"
        ],
        correct: 1,
        explanation: "Keep that prediction in mind, this is exactly the pattern the article opens with."
      },
      image: { src: "images/copilot-org-map.png", alt: "A grid of departments — Sales, Customer Success, Operations, Product, Support, Finance — with a teal path connecting them and a copilot marker placed in Finance" },
      body: `
        <p>Most agentic AI conversations point outward: agents for customers, AI features to compete on. But some of the highest-leverage AI work never touches a customer at all, it shows up inside the company, changing how sales reps prep for calls or how support triages tickets. Call these <strong>PM Copilots</strong>.</p>
        <p>Here's the trap: building a copilot for your own team is still product work. It just gets treated like IT work, which is exactly why so many stall out after a promising demo. Someone builds it in a sprint, drops it in Slack, and everyone moves on. Nobody validated the problem, involved the users early, or built in a way to learn and adjust.</p>
        <p>Internal stakeholders are still users. They have workflows, trust issues, and opinions about tools getting shoved into their day. Treat them as an afterthought and the project fails quietly, no dramatic collapse, just quiet non-use.</p>
      `,
      checks: [
        {
          question: "Why do so many internal AI tools quietly fail, according to this lesson?",
          options: [
            "The underlying AI models aren't powerful enough yet",
            "They're treated as IT projects instead of products, so nobody validates the problem or involves real users early",
            "Employees are generally resistant to any new technology"
          ],
          correct: 1,
          explanation: "The failure mode isn't the technology, it's skipping the discovery, involvement, and iteration that any real product needs."
        },
        {
          question: "A support agent quietly stops using an internal AI tool and goes back to doing the task by hand. What does this represent?",
          options: [
            "A minor, unimportant preference",
            "The same kind of quiet product failure signal you'd see in an external product, just without a formal complaint",
            "Proof that AI tools don't belong in support workflows"
          ],
          correct: 1,
          explanation: "This is the article's core point: internal users behave like real users. Quiet abandonment is real churn, it just doesn't file a ticket."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Discovery — Find the Work Worth Automating",
      image: { src: "images/copilot-lifecycle.png", alt: "The PM Copilot Product Lifecycle shown as five connected stages: Discovery, Pilot, Feedback, Iteration, and Adoption" },
      body: `
        <p>This is the first of five stages you'll walk through in this course. The instinct with agentic AI is to reach for the most ambitious use case, a copilot that handles an entire renewal end to end sounds impressive in a slide. It's also a terrible place to start.</p>
        <p>Good discovery here looks like good discovery anywhere else: sit in on real calls, read a week's worth of support tickets, shadow someone doing the task you assume is automatable. You're looking for work that's <strong>repetitive, high-volume, and low-risk if the agent gets something wrong early on</strong>. Drafting a first-pass follow-up email is a good candidate. Deciding whether to escalate a churn risk is not, at least not yet.</p>
        <p>Ask the team what they'd actually want help with, not what leadership assumes they need. That gap is where most failed pilots come from.</p>
      `,
      checks: [
        {
          question: "Which of these is the better first PM Copilot use case, based on this lesson's criteria?",
          options: [
            "A copilot that decides whether to escalate a churn-risk account",
            "A copilot that drafts a first-pass follow-up email after a sales call",
            "A copilot that handles an entire customer renewal end to end"
          ],
          correct: 1,
          explanation: "It's repetitive, high-volume, and low-risk if it gets something wrong, exactly the profile of a good starting point. The other two involve consequential judgment calls, the wrong place to start."
        },
        {
          question: "Why does the article say to ask the team what they want help with, rather than relying on leadership's assumptions?",
          options: [
            "Because leadership is usually wrong about everything",
            "Because the gap between what leadership assumes and what the team actually needs is where most failed pilots come from",
            "Because it's a formality that doesn't really change the outcome"
          ],
          correct: 1,
          explanation: "This is discovery 101 applied internally: the people doing the work every day know where the real friction is, and that's rarely identical to what looks like the obvious pain point from the outside."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Pilot — Small, Real, and Closely Watched",
      preCheck: {
        label: "Before you read on — predict",
        question: "For a first copilot pilot, is it better to launch company-wide with an announcement, or start with 5-10 people doing real work?",
        options: [
          "Company-wide, to generate momentum and buy-in quickly",
          "5-10 people doing real work, watched closely"
        ],
        correct: 1,
        explanation: "See if the reasoning below matches your instinct."
      },
      body: `
        <p>Once you've picked a use case, resist the urge to roll it out broadly. A pilot with five to ten people doing <strong>real work</strong> is worth more than a company-wide launch with a flashy announcement.</p>
        <p>Pick people who represent a range of comfort with new tools, not just your most enthusiastic early adopters. Give them real tasks, not sandboxed test cases, people behave differently when the stakes are real. And watch what's actually happening, not just what people say afterward: session logs, transcripts, and time on task tell you more than a survey ever will.</p>
        <p>This is also where you learn the difference between a demo and a product. A demo works when you control the inputs. A product has to survive a rep pasting in a half-finished email thread, or someone asking the copilot something it was never trained to answer.</p>
      `,
      checks: [
        {
          question: "Why does the article recommend real tasks over sandboxed test cases during a pilot?",
          options: [
            "Sandboxed tests are technically harder to set up",
            "People behave differently when the stakes are real, so sandboxed tests hide the actual edge cases a real product has to survive",
            "Real tasks are faster to complete"
          ],
          correct: 1,
          explanation: "A demo only has to survive inputs you control. A real pilot surfaces the messy, unpredictable inputs a real product will actually face, while the blast radius is still small."
        },
        {
          question: "What should you rely on most to understand what's really happening during a pilot?",
          options: [
            "A survey sent out after the pilot ends",
            "Session logs, transcripts, and time on task, watching actual behavior rather than only asking about it afterward",
            "Whether the enthusiastic early adopters report satisfaction"
          ],
          correct: 1,
          explanation: "What people say afterward and what they actually did during the pilot are often different things. Direct observation catches what a survey would miss entirely."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Feedback — Listening for Corrections, Not Compliments",
      body: `
        <p>Feedback on an internal AI tool rarely shows up as a formal ticket. It shows up as someone quietly editing every draft the copilot produces, or going back to doing the task by hand because it's faster than fixing what the agent got wrong. If you're only listening for complaints in a feedback channel, you'll miss almost everything useful.</p>
        <p>Step through the three signals worth watching for instead.</p>
      `,
      steps: [
        { title: "Correction patterns", detail: "What does the copilot consistently get wrong in the same way? A repeated mistake is a pattern worth fixing at the source, not a one-off to ignore." },
        { title: "Abandonment", detail: "Where in a workflow do people stop trusting the output and take over themselves? That's the exact point where the tool is failing to earn trust." },
        { title: "Workarounds", detail: "What are people doing instead of using the tool? Whatever that is tells you precisely what the tool is missing." }
      ],
      checks: [
        {
          question: "Someone stops using the copilot halfway through a workflow and finishes the task manually every time. Which signal is this?",
          options: [
            "A correction pattern",
            "Abandonment",
            "A workaround"
          ],
          correct: 1,
          explanation: "Abandonment specifically: the exact point where trust in the output breaks down and a person takes back over."
        },
        {
          question: "Why does the article say churn on an internal tool is 'quiet'?",
          options: [
            "Because internal tools don't have enough users to notice churn",
            "Because nobody files a formal complaint when they simply go back to the old way of doing things",
            "Because internal tools are usually retired on a fixed schedule regardless of use"
          ],
          correct: 1,
          explanation: "This is why watching behavior (the three signals) matters more than watching a feedback channel, quiet churn never generates a ticket."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Iteration — Earn the Next Stage of Rollout",
      body: `
        <p>Every round of pilot feedback should change something concrete: adjusting the prompt or guardrails, changing what the agent can do without a human checking its work, or narrowing scope because you tried to solve too much at once.</p>
        <p>Here's the rule worth internalizing: <strong>don't expand the rollout until the current version has earned it.</strong> If a copilot is getting corrected on the same kind of task every week, more users won't fix that, they'll just multiply the frustration. Iteration is where you build the trust that adoption actually depends on.</p>
      `,
      checks: [
        {
          question: "A copilot is still getting corrected on the same type of task every week. What should happen next?",
          options: [
            "Roll it out to more users so it gets more training data",
            "Fix the underlying issue before expanding, since more users would only multiply the same frustration",
            "Retire the project immediately"
          ],
          correct: 1,
          explanation: "Scale doesn't fix an unearned rollout, it amplifies the problem. Iteration has to close the gap before rollout expands."
        }
      ]
    },
    {
      id: 6,
      title: "Lesson 6: Adoption — Measure It Like the Product It Is",
      image: { src: "images/copilot-adoption-metrics.png", alt: "Four metric cards — Weekly Active Users 68%, Task Success Rate 84%, Time Saved per Task 11 minutes, Voluntary Return Rate 76% — above a bar chart showing weekly active users climbing over eight weeks" },
      body: `
        <p>This is the stage most internal AI efforts skip entirely, and it's the one that determines whether the tool survives past its first quarter. If you can't point to numbers showing the copilot is actually helping, it gets quietly deprioritized the moment budget gets tight.</p>
        <p><strong>Weekly active users</strong> among the eligible group tells you whether the tool has staying power beyond initial curiosity. <strong>Task success rate</strong>, the share completed without a human stepping in, tells you if the agent is actually reliable. <strong>Time saved per task</strong> is the number your VP or CFO will care about most, measure it honestly, not optimistically. And <strong>voluntary return rate</strong>, people coming back without being reminded, is maybe the most honest signal of all. People don't return to tools that waste their time.</p>
      `,
      checks: [
        {
          question: "Why is voluntary return rate described as 'maybe the most honest signal of all'?",
          options: [
            "It's the easiest metric to calculate",
            "It reflects real behavior with no prompting or reminders involved, people don't come back to tools that waste their time",
            "It's the only metric leadership actually looks at"
          ],
          correct: 1,
          explanation: "Every other metric can be nudged by reminders or requirements. Voluntary return is what people choose to do on their own, which makes it hard to fake."
        },
        {
          label: "Bringing it together",
          question: "A copilot pilot shows high weekly active users but a low voluntary return rate, people only use it when reminded. Based on the whole lifecycle in this course, what's the most likely explanation?",
          options: [
            "The tool is working well and just needs more marketing",
            "Something is probably still being corrected or worked around (Lesson 4's signals), and the tool hasn't yet earned expanded trust (Lesson 5) — it's being used, not chosen",
            "Weekly active users is the only metric that actually matters here"
          ],
          correct: 1,
          explanation: "This ties the course together: a metric-level red flag (low voluntary return) is exactly what the earlier stages, feedback signals and earned iteration, are designed to catch before a tool gets fully rolled out."
        }
      ],
      reflection: {
        prompt: "Think of a repetitive, high-volume, low-risk task on your own team that could be a good first PM Copilot pilot. What would you watch for in the first two weeks?"
      }
    }
  ]
};
