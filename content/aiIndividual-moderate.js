/* ================================================================
   COURSE CONTENT: AI Fluency — Individual, Moderate Experience
   Source articles: "From Roadmaps to Rituals: How Agentic AI Is
   Rewriting the Product Manager's Job" and "How to Build
   Product-Focused AI Agents That Actually Make Better Decisions"
   (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiIndividual-moderate"] = {
  sourceUrl: "",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: From Tasks to Rituals",
      preCheck: {
        label: "Before you read on — predict",
        question: "You already use AI for the odd task. What's the higher-leverage question to start asking instead?",
        options: [
          "\"What's the single best prompt for this one-off request?\"",
          "\"Which recurring ritual in my practice could an agent support or partly own?\"",
          "\"Which AI tool has the most features?\""
        ],
        correct: 1,
        explanation: "See whether the lesson below backs this up."
      },
      body: `
        <p>Most product managers didn't sign up to be professional plate spinners, yet the days fill up with writing PRDs, chasing status, pulling data for reviews, and answering the same question in slightly different formats. The strategic work gets squeezed into the margins.</p>
        <p>The mindset shift that changes this: stop asking <em>"what can I ask an AI model for?"</em> and start asking <em>"which recurring ritual in my product practice can be supported or partly owned by an agent?"</em></p>
        <p>A <strong>ritual</strong> is anything you do on a predictable cadence with a clear purpose, weekly grooming, monthly KPI reviews, quarterly strategy updates. Your work splits into two buckets:</p>
        <ul>
          <li><strong>High volume, repeatable tasks.</strong> Agents are very good at these.</li>
          <li><strong>High judgment, high context decisions.</strong> Used well, agents amplify you here, they don't replace you.</li>
        </ul>
        <p>The goal isn't a smarter autocomplete. It's moving from <strong>task execution</strong> to <strong>orchestration and sense-making</strong>.</p>
      `,
      checks: [
        {
          question: "What distinguishes a \"ritual\" from a one-off task in this lesson?",
          options: [
            "A ritual is any task that takes more than an hour",
            "A ritual happens on a predictable cadence with a clear purpose — which is exactly what makes it a good place to embed an agent",
            "A ritual is any task a PM dislikes doing"
          ],
          correct: 1,
          explanation: "Predictable cadence plus clear purpose is what lets you design a repeatable agent-supported process, rather than re-inventing a prompt every time."
        },
        {
          question: "Which split does the lesson use to decide where agents help most?",
          options: [
            "Urgent vs. non-urgent work",
            "High-volume repeatable tasks vs. high-judgment high-context decisions",
            "Internal-facing vs. customer-facing work"
          ],
          correct: 1,
          explanation: "Agents own the first bucket outright and amplify you on the second. Knowing which bucket a piece of work is in tells you how much to hand over."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Backlog Grooming, Before and After",
      body: `
        <p>Grooming is the classic ritual to hand a first pass to an agent.</p>
        <svg viewBox="0 0 400 190" style="width:100%; height:auto; margin:4px 0 2px;">
          <text x="100" y="18" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="11" font-weight="700" fill="#9AA3AD">BEFORE</text>
          <text x="300" y="18" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="11" font-weight="700" fill="#1A4584">AFTER</text>
          <line x1="200" y1="26" x2="200" y2="180" stroke="#E3E9F0" stroke-width="1"/>
          <g font-family="sans-serif" font-size="9.5" fill="#4B5768">
            <text x="16" y="44">Collect tickets, Slack, requests</text>
            <text x="16" y="66">De-duplicate and clarify by hand</text>
            <text x="16" y="88">Rewrite titles for engineering</text>
            <text x="16" y="110">Re-prioritize on gut feel</text>
            <text x="16" y="140" fill="#9AA3AD">slow, noisy, inconsistent</text>
          </g>
          <g font-family="sans-serif" font-size="9.5" fill="#4B5768">
            <text x="214" y="44">Agent clusters incoming items by theme</text>
            <text x="214" y="66">Agent flags duplicates</text>
            <text x="214" y="88">Agent drafts problem statements</text>
            <text x="214" y="110">Agent proposes priority from your rules</text>
            <text x="214" y="132" fill="#12305e" font-weight="700">You review, adjust, approve</text>
            <text x="214" y="150" fill="#9AA3AD">time shifts to trade-offs and the "why"</text>
          </g>
        </svg>
        <p>Your new grooming ritual: review the agent's proposed clusters and priorities, adjust for strategy and context, approve or merge or close with one click. Your time moves from rewriting and sorting to making trade-offs and explaining priorities.</p>
        <p><strong>What still needs you:</strong> connecting work to strategy and OKRs, partnering with engineering on feasibility and sequencing, and saying "no" with a clear narrative.</p>
      `,
      checks: [
        {
          question: "After an intake-and-grooming agent owns the first pass, what does the PM's grooming time shift toward?",
          options: [
            "Rewriting ticket titles so they're consistent",
            "Making trade-offs and explaining the \"why\" behind priorities",
            "Manually de-duplicating the backlog more carefully"
          ],
          correct: 1,
          explanation: "The agent makes the backlog more coherent; the human decides what matters and communicates it. The mechanical clean-up is what moves off your plate."
        },
        {
          question: "Which grooming responsibility does the lesson say still clearly needs a person?",
          options: [
            "Clustering incoming tickets by product area",
            "Drafting acceptance criteria from a template",
            "Saying \"no\" to a request with a clear narrative for stakeholders"
          ],
          correct: 2,
          explanation: "Clustering and first-draft acceptance criteria are exactly what the agent handles. The judgment call and the stakeholder narrative stay with you."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Research and Experiments as Always-On Engines",
      body: `
        <p>Two more rituals follow the same shape: the agent runs continuously in the background, you turn its output into decisions.</p>
        <p><strong>Market research.</strong> Instead of scrambling when a competitor appears or leadership asks about a space, an "Insights" agent tracks competitor release notes, pricing pages, job postings, and analyst reports, and produces a weekly digest. Your ritual becomes a 30-minute session where you annotate implications and write "so what does this mean for our strategy?"</p>
        <p><strong>Experiment design.</strong> An "Experiment Designer" agent generates ideas from feedback and prior tests, turns them into clear hypotheses and success metrics, proposes sample size and duration, and writes consistent briefs. Your ritual becomes idea-harvesting on a cadence, a weekly review to choose which experiments to run, and a simple debrief after each one.</p>
        <p>In both cases the agent collects and summarizes. You do the part it can't: telling weak signal from hype, deciding whether to react, watch, or ignore, and owning the learning agenda across quarters.</p>
      `,
      checks: [
        {
          question: "In the always-on research ritual, what's the specifically human contribution?",
          options: [
            "Reading every competitor blog post in full",
            "Interpreting weak signals versus hype and deciding whether to react, watch, or ignore",
            "Formatting the weekly digest for the leadership deck"
          ],
          correct: 1,
          explanation: "\"The agent collects and summarizes. You turn noise into narrative.\" Judgment about what a signal means, and what to do about it, is the part that stays yours."
        },
        {
          question: "With an Experiment Designer agent in place, what does the PM still own?",
          options: [
            "Calculating the required sample size for each test",
            "Choosing which experiments align with strategy and constraints, and balancing exploration against exploitation across quarters",
            "Writing the experiment brief in a consistent format"
          ],
          correct: 1,
          explanation: "Sample size and consistent briefs are the agent's job. Which bets to make, and how the portfolio of experiments adds up over time, is strategy work."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: KPI Reviews — From Reporting Meeting to Decision Meeting",
      body: `
        <p>Most PMs have too many dashboards and too little insight. KPI reviews turn into a meeting where everyone reads numbers out loud.</p>
        <p>A "Metrics" agent monitors your core metrics, alerts you to anomalies, writes a weekly or monthly "state of the product" summary, highlights cohorts or flows that changed meaningfully, and suggests follow-up questions and possible root causes.</p>
        <p>Your KPI ritual becomes:</p>
        <ul>
          <li>Read the agent's summary <em>before</em> the meeting.</li>
          <li>Spend the meeting itself discussing implications and decisions.</li>
          <li>Capture next steps so the agent can track their impact next time.</li>
        </ul>
        <p>The agent describes what's happening. You choose which metrics truly matter versus noise, connect changes to product and business context, and make the call when two metrics move in opposite directions.</p>
      `,
      checks: [
        {
          question: "What's the intended change to the KPI review meeting itself once a Metrics agent prepares the summary?",
          options: [
            "The meeting gets longer so every dashboard can be walked through",
            "The meeting stops being a reporting readout and becomes a discussion of implications and decisions",
            "The meeting is replaced entirely by the agent's written summary"
          ],
          correct: 1,
          explanation: "Reading numbers aloud moves to pre-read. The scarce synchronous time is spent on \"what do we do about this,\" which is the part that needs people."
        },
        {
          question: "Two core metrics move in opposite directions this month. Whose job is it to resolve that, per the lesson?",
          options: [
            "The Metrics agent, which should recommend the single correct trade-off",
            "The PM, who connects the change to business context and makes the trade-off call",
            "Whoever owns the dashboard where the conflict appeared"
          ],
          correct: 1,
          explanation: "The agent surfaces the conflict and suggests root causes. Deciding which metric wins, and why, is a judgment call the agent isn't positioned to make."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Shape the Agent, Protect Your Judgment",
      body: `
        <p>Two habits make the difference between an agent that helps and one that adds noise.</p>
      `,
      steps: [
        { title: "Write a one-sentence role for each agent", detail: "Not \"an AI assistant.\" Something like: \"This agent exists to challenge product assumptions, surface risk, and improve decision quality before engineering effort is committed.\" If you can't state the purpose clearly, it won't deliver consistent value." },
        { title: "Ground it in product reality, persistently", detail: "Give the agent standing context it doesn't have to be re-told each time: the real problem you solve and who for, your strategic and regulatory constraints, common customer objections and lost-deal reasons, and your product philosophy (speed vs. quality bias, opinionated vs. flexible)." },
        { title: "Make it usefully opinionated", detail: "Generic system prompts produce generic output. Bake in productive bias that reflects your strategy: question feature requests that don't tie to a user outcome, surface second-order effects before recommending, prioritize long-term trust over short-term engagement." },
        { title: "Assign it a role in real product moments", detail: "Instead of asking for answers, say: \"Review this PRD as a skeptical product leader and identify assumptions, risks, and gaps.\" That shifts the agent from idea generation to decision-quality improvement." },
        { title: "Protect your judgment time", detail: "Use the hours the agents give back for deeper strategic work. Don't immediately refill the gap with more meetings. Treat that time as a \"sense-making\" block." }
      ],
      checks: [
        {
          question: "Why write a one-sentence role definition before designing prompts or workflows for an agent?",
          options: [
            "It's a documentation requirement for most AI tools",
            "If you can't describe the agent's purpose clearly, it won't deliver consistent value — the role is what keeps its output focused",
            "It lets you skip giving the agent any other context"
          ],
          correct: 1,
          explanation: "A clear, narrow purpose is what makes an agent reliable. Vague scope is the main reason agent output feels impressive in a demo and unreliable in daily work."
        },
        {
          question: "The lesson says a product agent should be \"usefully opinionated\" rather than neutral. Why?",
          options: [
            "Neutral agents are slower to respond",
            "When the agent's bias reflects your product strategy — question outcome-free requests, weigh long-term trust — that aligned judgment is an advantage, not a risk",
            "Opinionated agents need less grounding context"
          ],
          correct: 1,
          explanation: "\"The goal is not neutrality. The goal is aligned judgment.\" A generic assistant gives generic answers; one shaped by your strategy gives answers you can act on."
        },
        {
          label: "Bringing it together",
          question: "You free up six hours a week by handing grooming and KPI prep to agents. Based on this whole course, what's the best use of that time?",
          options: [
            "Take on two more product areas, since capacity opened up",
            "Fill it with the standing meetings you'd been declining",
            "Protect it as sense-making time — strategy, stakeholder alignment, the framing and hard-choice work agents can't do"
          ],
          correct: 2,
          explanation: "The entire point of moving from roadmaps to rituals is to redirect effort toward the uniquely human parts of the job. Refilling the time with volume defeats the purpose."
        }
      ],
      reflection: {
        prompt: "Pick one ritual you run on a cadence (grooming, insights review, KPI review). Write the one-sentence role you'd give an agent to take its first pass, and name the judgment call you'd keep for yourself."
      }
    }
  ]
};
