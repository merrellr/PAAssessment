/* ================================================================
   COURSE CONTENT: AI Fluency — Individual, Moderate Experience
   Source article: "From Roadmaps to Rituals: How Agentic AI Is
   Rewriting the Product Manager's Job" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiIndividual-moderate"] = {
  sourceUrl: "https://www.linkedin.com/pulse/from-roadmaps-rituals-how-agentic-ai-rewriting-job-merrell-mism-r8pnc",
  recap: [
    "Stop asking 'what can I prompt for' and start asking 'which recurring ritual can an agent support or partly own'.",
    "Hand the first pass of backlog grooming to an agent — clustering, dedup, draft problem statements — and spend your time on trade-offs and the 'why'.",
    "Run research and experiments as always-on engines: the agent collects and summarizes; you tell weak signal from hype and own the learning agenda.",
    "Turn KPI reviews from a reporting readout into a decision meeting by reading the agent's summary before the meeting.",
    "Become a conductor — pick one ritual, define a 'good enough' first agent, and protect the recovered time for sense-making."
  ],
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
        <svg viewBox="0 0 400 104" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="aiMEng" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="7.5" font-weight="700" fill="#12305e">
            <rect x="6" y="30" width="92" height="30" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="52" y="42">Agent watches</text><text x="52" y="52">continuously</text>
            <rect x="112" y="30" width="80" height="30" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="152" y="48">Weekly digest</text>
            <rect x="206" y="30" width="96" height="30" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="254" y="42">Your 30 min:</text><text x="254" y="52">"so what?"</text>
            <rect x="316" y="30" width="78" height="30" rx="5" fill="#EEF9F1" stroke="#2E8B57" stroke-width="1.1"/><text x="355" y="42">React / watch</text><text x="355" y="52">/ ignore</text>
          </g>
          <g stroke="#9AA3AD" stroke-width="1.2">
            <line x1="98" y1="45" x2="110" y2="45" marker-end="url(#aiMEng)"/>
            <line x1="192" y1="45" x2="204" y2="45" marker-end="url(#aiMEng)"/>
            <line x1="302" y1="45" x2="314" y2="45" marker-end="url(#aiMEng)"/>
          </g>
          <text x="200" y="86" text-anchor="middle" font-family="sans-serif" font-size="7.5" fill="#4B5768">The agent collects and summarizes; the "so what?" call stays yours.</text>
        </svg>
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
      title: "Lesson 5: The PM as Conductor",
      body: `
        <p>When these rituals have agents built into them, the job itself starts to look different:</p>
        <ul>
          <li>Less time creating artifacts, more time aligning people.</li>
          <li>Less energy chasing status, more energy shaping strategy.</li>
          <li>Fewer one-off tasks, more reusable systems and playbooks.</li>
        </ul>
        <p>Your calendar shifts toward regular review rituals with AI-prepared inputs, deep-dive sessions with design, engineering, and stakeholders, and protected focus time for thinking, writing, and deciding. You become less of a project manager and more of a <strong>conductor</strong>, not because you work less, but because more of your effort points at the parts of the job that are uniquely yours: framing problems, telling the story, making hard choices under uncertainty.</p>
        <p>You don't need an "AI transformation" to get there. Three practical steps:</p>
      `,
      steps: [
        { title: "Pick one ritual", detail: "Choose a single workflow that already happens on a regular cadence — weekly backlog grooming, monthly KPI reviews. One is enough to start." },
        { title: "Define a \"good enough\" first agent", detail: "Be explicit about what it should do: gather inputs, summarize, group, or propose options. Accept that version one will be imperfect and improve it through your feedback, the same way you'd coach a new team member." },
        { title: "Protect your judgment time", detail: "Use the hours you get back to deepen your strategic work. Don't immediately fill the gap with more meetings or busywork. Treat that recovered time as a protected sense-making block." }
      ],
      checks: [
        {
          question: "The lesson calls the shift \"from project manager to conductor.\" What does that mean in practice?",
          options: [
            "The PM stops doing hands-on work and only reviews others' output",
            "More of the PM's effort points at the uniquely human parts — framing problems, telling the story, hard choices — while agents absorb the repeatable production work",
            "The PM manages the AI agents the way they used to manage engineers"
          ],
          correct: 1,
          explanation: "\"Not because you work less, but because more of your effort is directed at the uniquely human parts of product management.\" The volume work moves to agents; the judgment and alignment work stays, and grows."
        },
        {
          question: "Why does the lesson say to accept that \"version one will be imperfect\" for a first agent?",
          options: [
            "Because AI output can't be improved once it's set up",
            "Because you improve it through feedback over time — treating it like coaching a new team member, not like buying a finished tool",
            "Because imperfect agents are cheaper to run"
          ],
          correct: 1,
          explanation: "\"Treat agents as team members and invest in training them.\" A rough first version you refine beats waiting for a perfect one that never ships."
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
          explanation: "The entire point of moving from roadmaps to rituals is to redirect effort toward the uniquely human parts of the job. Refilling the time with volume defeats the purpose. The real question isn't \"will AI take my job?\" — it's \"how quickly can I redesign my job around the things only I can do?\""
        }
      ],
      reflection: {
        prompt: "Pick one ritual you run on a cadence (grooming, insights review, KPI review). Describe the \"good enough\" first agent you'd build for it — what it gathers or summarizes — and the judgment call you'd keep for yourself."
      }
    }
  ]
};
