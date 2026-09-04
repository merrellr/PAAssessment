/* ================================================================
   COURSE CONTENT: Product Strategy & Roadmapping, Advanced Experience
   Source article: "How to Build Product-Focused AI Agents That
   Actually Make Better Decisions" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["strategy-advanced"] = {
  sourceUrl: "https://www.linkedin.com/pulse/how-build-product-focused-ai-agents-actually-make-merrell-mism-rmu8c",
  recap: [
    "Treat a product agent as a decision participant, not a tool — define the decisions it influences, the context it holds, and the trade-offs it weighs in one sentence.",
    "Ground it persistently in four context categories: product truths, strategic constraints, customer signals, product philosophy.",
    "Make it usefully opinionated — bake in strategy-aligned bias; the goal is aligned judgment, not neutrality.",
    "Embed it at each lifecycle decision point (discovery, PRDs, roadmapping, launch readiness, post-launch) by assigning it a role, not asking it for answers.",
    "Maintain it as a living system — refresh context quarterly; the payoff is consistent senior-level judgment applied everywhere."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Agents as Decision Participants",
      preCheck: {
        label: "Before you read on — predict",
        question: "A team wants AI to improve its product decisions. Which starting question leads somewhere useful?",
        options: [
          "\"How do we add an agent to our workflow?\"",
          "\"How do we shape an agent so it thinks like our strongest product leader?\"",
          "\"Which model has the largest context window?\""
        ],
        correct: 1,
        explanation: "See whether the lesson backs this up. Most teams experimenting with agents start in the wrong place."
      },
      body: `
        <p>Large language models are powerful, but without direction they behave like highly articulate generalists. Real leverage comes from intentionally shaping an agent's product judgment so it understands your customers, your constraints, and your definition of success.</p>
        <p>A product-focused agent is not a chatbot or a feature. It is a <strong>decision participant</strong>. The most effective teams define agents the same way they define human roles, and they're clear on three things:</p>
        <ul>
          <li>What decisions the agent influences.</li>
          <li>What context the agent must always understand.</li>
          <li>What trade-offs the agent should prioritize.</li>
        </ul>
        <p>Before designing any prompts or workflows, write a one-sentence role definition. For example: <em>"This agent exists to challenge product assumptions, surface risk, and improve decision quality before engineering effort is committed."</em> If you can't describe the agent's purpose that clearly, it will not deliver consistent value.</p>
      `,
      checks: [
        {
          question: "Team A prompts its agent ad hoc: \"summarize this PRD.\" Team B gives it a standing role: \"you review PRDs as a skeptical product leader; flag assumptions, risks, and gaps.\" Which is the \"decision participant\" setup this lesson argues for?",
          options: [
            "Team A, since keeping it flexible avoids over-constraining the model",
            "Team B, because a scoped role with defined influence, context, and priorities is what makes the agent's contribution reliable",
            "Neither, an agent is just a tool either way"
          ],
          correct: 1,
          explanation: "A tool responds to requests. A decision participant is scoped like a teammate: clear influence, clear context, clear priorities. That's what makes its contribution reliable."
        },
        {
          question: "Why write a one-sentence role definition before any prompt or workflow design?",
          options: [
            "It's required by most agent-building platforms",
            "If you can't state the agent's purpose clearly in one sentence, it won't deliver consistent value — the role is what focuses everything downstream",
            "It replaces the need to give the agent product context"
          ],
          correct: 1,
          explanation: "Vague purpose is the root cause of agents that demo well and disappoint in daily use. The role definition is the anchor for scope, context, and evaluation."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Ground the Agent in Product Reality",
      body: `
        <p>LLMs have broad knowledge but no inherent understanding of your product. High-performing product agents are grounded in four categories of context, and that context should be <strong>persistently available</strong>, not re-introduced in every interaction.</p>
        <svg viewBox="0 0 400 190" style="width:100%; height:auto; margin:4px 0 2px;">
          <line x1="200" y1="10" x2="200" y2="180" stroke="#E3E9F0" stroke-width="1"/>
          <line x1="14" y1="95" x2="386" y2="95" stroke="#E3E9F0" stroke-width="1"/>
          <g font-family="'Space Grotesk',sans-serif" font-size="10.5" font-weight="700" fill="#12305e">
            <text x="24" y="30">Product truths</text>
            <text x="214" y="30">Strategic constraints</text>
            <text x="24" y="118">Customer signals</text>
            <text x="214" y="118">Product philosophy</text>
          </g>
          <g font-family="sans-serif" font-size="9" fill="#4B5768">
            <text x="24" y="46">the real problem you solve</text>
            <text x="24" y="60">primary and secondary users</text>
            <text x="24" y="74">what success means today</text>
            <text x="214" y="46">business-model realities</text>
            <text x="214" y="60">regulatory / compliance limits</text>
            <text x="214" y="74">engineering / architecture limits</text>
            <text x="24" y="134">common objections</text>
            <text x="24" y="148">why deals are lost</text>
            <text x="24" y="162">patterns from support + research</text>
            <text x="214" y="134">speed vs. quality bias</text>
            <text x="214" y="148">opinionated vs. flexible stance</text>
            <text x="214" y="162">long-term vision vs. short-term</text>
          </g>
        </svg>
        <p>The difference this makes: an agent that has to be told your regulatory boundaries every time will eventually be asked something without them and answer confidently anyway. Standing context is what keeps its judgment inside your actual constraints.</p>
      `,
      checks: [
        {
          question: "\"Why deals are lost\" and \"common objections\" belong to which grounding category?",
          options: [
            "Product truths",
            "Customer signals",
            "Strategic constraints"
          ],
          correct: 1,
          explanation: "Customer signals cover objections, lost-deal reasons, and patterns from support and research — the accumulated evidence of how customers actually react to the product."
        },
        {
          question: "Why does the lesson insist grounding context be \"persistently available\" rather than pasted into each prompt?",
          options: [
            "To reduce the number of tokens each request uses",
            "Because context that has to be re-supplied will eventually be left out — and the agent will answer confidently outside your real constraints",
            "Because prompts have a strict length limit"
          ],
          correct: 1,
          explanation: "Standing context is what makes the agent's judgment consistently bounded by your product reality. Per-prompt context is one forgotten paste away from a confident wrong answer."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Intentionally Opinionated",
      body: `
        <p>Generic system prompts produce generic output. High-quality product agents are intentionally opinionated in the same way strong product leaders are.</p>
        <p>Examples of productive bias:</p>
        <ul>
          <li>Question feature requests unless they tie to a clear user outcome.</li>
          <li>Surface second-order effects before recommending solutions.</li>
          <li>Prioritize long-term customer trust over short-term engagement.</li>
        </ul>
        <p>The goal is not neutrality. The goal is <strong>aligned judgment</strong>. When an agent's bias reflects your product strategy, it becomes an advantage rather than a risk, the agent starts catching the things your best product leader would catch, consistently, on every review.</p>
      `,
      checks: [
        {
          question: "The lesson argues a product agent should be opinionated, not neutral. What's the reasoning?",
          options: [
            "Opinionated agents are faster and cheaper to run",
            "A neutral agent gives generic output; one whose bias reflects your strategy delivers aligned judgment — it flags what your strongest product leader would flag",
            "Neutrality isn't technically possible with current models"
          ],
          correct: 1,
          explanation: "\"The goal is not neutrality. The goal is aligned judgment.\" Bias that encodes your strategy is a feature: it makes the agent's review consistent with how you want decisions made."
        },
        {
          question: "Which of these is an example of the \"productive bias\" the lesson recommends building in?",
          options: [
            "Always recommend the option that ships fastest",
            "Surface second-order effects before recommending a solution",
            "Defer to whichever stakeholder raised the request"
          ],
          correct: 1,
          explanation: "Questioning outcome-free requests, surfacing second-order effects, and weighting long-term trust are all biases that reflect mature product judgment rather than defaulting to speed or politics."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Embed the Agent in Real Product Moments",
      body: `
        <p>Agents fail when they exist outside the product lifecycle. They succeed when they're embedded into the moments where judgment matters most. Instead of asking the agent for answers, assign it a role in each moment.</p>
        <svg viewBox="0 0 400 118" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="saLife" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g font-family="'Space Grotesk',sans-serif" font-size="7.5" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="6" y="12" width="70" height="30" rx="4" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/>
            <rect x="88" y="12" width="70" height="30" rx="4" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/>
            <rect x="170" y="12" width="70" height="30" rx="4" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/>
            <rect x="252" y="12" width="70" height="30" rx="4" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/>
            <rect x="334" y="12" width="60" height="30" rx="4" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/>
            <text x="41" y="30">Discovery</text>
            <text x="123" y="30">PRDs</text>
            <text x="205" y="30">Roadmap</text>
            <text x="287" y="30">Launch</text>
            <text x="364" y="27">Post-</text>
            <text x="364" y="37">launch</text>
          </g>
          <line x1="76" y1="27" x2="87" y2="27" stroke="#9AA3AD" stroke-width="1" marker-end="url(#saLife)"/>
          <line x1="158" y1="27" x2="169" y2="27" stroke="#9AA3AD" stroke-width="1" marker-end="url(#saLife)"/>
          <line x1="240" y1="27" x2="251" y2="27" stroke="#9AA3AD" stroke-width="1" marker-end="url(#saLife)"/>
          <line x1="322" y1="27" x2="333" y2="27" stroke="#9AA3AD" stroke-width="1" marker-end="url(#saLife)"/>
          <rect x="6" y="58" width="388" height="26" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/>
          <text x="200" y="75" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="8" font-weight="700" fill="#12305e">Same agent, same skeptic's role, at every stage</text>
          <g stroke="#35C2E8" stroke-width="1" stroke-dasharray="2 2">
            <line x1="41" y1="42" x2="41" y2="58"/>
            <line x1="123" y1="42" x2="123" y2="58"/>
            <line x1="205" y1="42" x2="205" y2="58"/>
            <line x1="287" y1="42" x2="287" y2="58"/>
            <line x1="364" y1="42" x2="364" y2="58"/>
          </g>
          <text x="200" y="104" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#4B5768">Assign it a role at each point &#8212; don't wait for a single stage to ask it for answers.</text>
        </svg>
      `,
      steps: [
        { title: "Discovery and problem framing", detail: "\"Pressure-test this problem statement. What assumptions is it resting on? Whose perspective is missing?\" The agent widens the frame before the team narrows on a solution." },
        { title: "PRDs and scope definition", detail: "\"Review this PRD as a skeptical product leader and identify assumptions, risks, and gaps.\" This shifts the agent from generating ideas to improving decision quality on ideas you already have." },
        { title: "Roadmapping and prioritization", detail: "\"For each item, name the user outcome it's tied to and the second-order effects of shipping it.\" The agent enforces the discipline consistently, even when the room is tired." },
        { title: "Launch readiness and risk assessment", detail: "\"What could go wrong in the first 72 hours? What would we wish we'd instrumented?\" A structured skeptic right before a launch is worth more than one after." },
        { title: "Post-launch evaluation", detail: "\"Given the original hypothesis and these results, what did we actually learn, and what did we not confirm?\" The agent keeps the retro honest about the difference between the two." }
      ],
      checks: [
        {
          question: "The lesson says to \"assign it a role\" rather than \"ask it for answers.\" What's the difference in a PRD review?",
          options: [
            "Asking for a role produces a longer response",
            "\"Review this as a skeptical product leader and find assumptions, risks, and gaps\" improves the quality of a decision you own — versus \"write me a PRD,\" which just generates a draft",
            "A role prompt lets the agent approve the PRD on your behalf"
          ],
          correct: 1,
          explanation: "Role-assignment points the agent at decision quality on your work. Answer-seeking points it at production. The first is where the leverage is for an experienced team."
        },
        {
          question: "Why embed the agent across discovery, PRDs, roadmapping, launch, and post-launch rather than at a single stage?",
          options: [
            "More touchpoints justify the cost of building the agent",
            "Judgment matters at every one of those moments — a consistent skeptic at each stage catches assumptions and second-order effects the team would otherwise carry forward",
            "The agent needs the full lifecycle as context to function at all"
          ],
          correct: 1,
          explanation: "\"Agents fail when they exist outside the product lifecycle.\" Value comes from being present at each decision point, applying the same aligned judgment every time."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Maintain It as a Living System",
      body: `
        <p>Products evolve, and agents must evolve with them. Strong teams refresh agent context quarterly: remove outdated assumptions, add new customer insights, adjust the built-in bias as strategy changes. An outdated agent quietly reinforces old thinking and introduces risk, it's a confident voice arguing from last year's constraints.</p>
        <p>The real advantage isn't automation. It's <strong>better product judgment at scale</strong>. Well-designed agents reduce cognitive load on senior leaders, increase consistency in decision quality, surface blind spots early, and enable speed without sacrificing thinking.</p>
        <p>AI agents don't replace product leadership, they amplify it. The teams succeeding with agents aren't focused on automation. They're focused on improving judgment, which has always been the core of great product management. The future of product isn't just AI-powered. It's judgment-driven.</p>
      `,
      checks: [
        {
          question: "Why does the lesson call an un-maintained agent a source of risk?",
          options: [
            "It slows down as its context file grows",
            "It keeps arguing confidently from outdated assumptions and old constraints, reinforcing thinking the strategy has already moved past",
            "It gradually forgets its role definition"
          ],
          correct: 1,
          explanation: "\"An outdated agent reinforces old thinking and introduces risk.\" If continuous learning matters for your team, it has to matter for your agents — hence the quarterly refresh."
        },
        {
          label: "Bringing it together",
          question: "A senior PM wants agents to raise decision quality across their org, not just save time. Based on this course, what's the advanced move?",
          options: [
            "Deploy one general assistant everyone can query, and measure hours saved",
            "Define scoped agents with one-sentence roles, ground them persistently in the four context categories, bake in strategy-aligned bias, embed them at each lifecycle decision point, and refresh them quarterly",
            "Wait for models capable enough to run the whole product process autonomously"
          ],
          correct: 1,
          explanation: "That's the full arc: role, grounding, aligned bias, embedded moments, living maintenance. The output is consistent senior-level judgment applied everywhere, which is what \"judgment at scale\" means."
        }
      ],
      reflection: {
        prompt: "Pick one recurring decision point in your product process (PRD review, prioritization, launch readiness). Write the one-sentence role you'd give an agent there, and name one piece of standing context it would need to hold to be useful."
      }
    }
  ]
};
