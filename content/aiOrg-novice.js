/* ================================================================
   COURSE CONTENT: AI Fluency — Organizational, No Experience
   Source article: "Your First AI Product Team: Designing a Squad of
   Agents, Not Just One Chatbot" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiOrg-novice"] = {
  sourceUrl: "https://www.linkedin.com/pulse/your-first-ai-product-team-designing-squad-agents-just-robert-merrell-vudmc",
  recap: [
    "One general-purpose chatbot doing every job produces context overload, mixed quality, and no clear ownership.",
    "Design agents like roles on a team — a starting squad of Researcher, Analyst, Experiment Designer, Copywriter, with handoffs so outputs become inputs.",
    "Start from a costly recurring workflow, not a model; its pain points become the agents' responsibilities.",
    "Scope an MVP squad (useful weekly, small, evaluable) and prioritize which agent to build first on frequency, time cost, risk, and leverage.",
    "Plug it into the tools your team already uses and evaluate each agent like a product — if you can't evaluate it, it will drift."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Why One Chatbot Fails at Real Product Work",
      preCheck: {
        label: "Before you read on — predict",
        question: "A team's first AI move is one general-purpose assistant everyone asks to do everything. What tends to go wrong?",
        options: [
          "Nothing — a single assistant is the simplest place to start and scales fine",
          "Inconsistent quality, unclear ownership, and a product experience that demos well but is unreliable in daily work",
          "It works, but only if you pay for the most expensive model"
        ],
        correct: 1,
        explanation: "Hold that prediction. This lesson is about why one assistant doing many jobs breaks down."
      },
      body: `
        <p>Most teams start their AI journey by adding a chatbot. Natural first step, common trap: treating AI as a single general-purpose assistant you ask to do everything.</p>
        <p>One assistant gets asked to research a market, summarize feedback, propose features, draft PRDs, write launch messaging, analyze experiments, and answer stakeholder questions. Each of those needs different context, different tools, different tone, and different evaluation. When it all goes through one assistant, you get:</p>
        <ul>
          <li><strong>Context overload.</strong> The assistant doesn't know which sources to trust or which priorities matter today.</li>
          <li><strong>Mixed quality.</strong> A response can be strong in one area and weak in another, and nobody knows why.</li>
          <li><strong>No clear ownership.</strong> When something's wrong, it's unclear which part of the system failed or how to fix it.</li>
        </ul>
        <p>The fix is the same one a growing team reaches for: <strong>specialization</strong>. Design an "AI product team" — a virtual squad of specialized agents with clear roles, clear inputs, and clear success criteria.</p>
      `,
      checks: [
        {
          question: "Why does routing every job through one assistant produce \"mixed quality\"?",
          options: [
            "The model runs out of memory partway through the day",
            "Different jobs need different context, tools, tone, and evaluation — one assistant handling all of them can't be set up well for any single one",
            "Quality only drops when too many people use the assistant at once"
          ],
          correct: 1,
          explanation: "Research, PRD drafting, and experiment analysis are genuinely different jobs. Specializing lets each one have the right context and its own bar for \"good.\""
        },
        {
          question: "What's the core move the lesson proposes instead of one general assistant?",
          options: [
            "Buy an enterprise AI platform with every feature enabled",
            "Design a squad of specialized agents, each with a defined role, inputs, outputs, and success criteria",
            "Wait until the models improve enough to handle everything reliably"
          ],
          correct: 1,
          explanation: "Specialization, structured like a real product team. Each agent has a job, boundaries, and a way to tell whether it's doing that job well."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Design Agents Like Roles on a Team",
      body: `
        <p>Instead of "an AI," think "a squad." Each agent has a role description, a clear scope and boundaries, specific inputs it can use, outputs it's expected to produce, and evaluation metrics tied to that role.</p>
        <p>A practical starting squad for product teams:</p>
        <svg viewBox="0 0 400 150" style="width:100%; height:auto; margin:4px 0 2px;">
          <defs>
            <marker id="sqArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g font-family="'Space Grotesk',sans-serif" font-size="10" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="6" y="50" width="86" height="40" rx="9" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.3"/>
            <text x="49" y="68">Researcher</text><text x="49" y="82" font-size="8" font-weight="400" fill="#4B5768">themes + evidence</text>
            <rect x="104" y="50" width="86" height="40" rx="9" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.3"/>
            <text x="147" y="68">Analyst</text><text x="147" y="82" font-size="8" font-weight="400" fill="#4B5768">impact + segments</text>
            <rect x="202" y="50" width="94" height="40" rx="9" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.3"/>
            <text x="249" y="65">Experiment</text><text x="249" y="76">Designer</text><text x="249" y="86" font-size="8" font-weight="400" fill="#4B5768">how to test it</text>
            <rect x="308" y="50" width="86" height="40" rx="9" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.3"/>
            <text x="351" y="68">Copywriter</text><text x="351" y="82" font-size="8" font-weight="400" fill="#4B5768">the messaging</text>
          </g>
          <line x1="92" y1="70" x2="102" y2="70" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#sqArrow)"/>
          <line x1="190" y1="70" x2="200" y2="70" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#sqArrow)"/>
          <line x1="296" y1="70" x2="306" y2="70" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#sqArrow)"/>
          <text x="200" y="118" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#9AA3AD">outputs become inputs — a repeatable system, not four disconnected tools</text>
        </svg>
        <p>Each agent gets real boundaries too. The Researcher doesn't make product decisions or invent sources and flags uncertainty clearly. The Analyst doesn't declare causality without experimental support. The Copywriter doesn't make up capabilities and calls out where legal review is needed. The Experiment Designer proposes options and trade-offs, not a single answer.</p>
      `,
      checks: [
        {
          question: "What turns four separate agents into an actual \"squad\"?",
          options: [
            "Running them all on the same AI model",
            "Designing handoffs so one agent's output becomes the next agent's input — Researcher → Analyst → Experiment Designer → Copywriter",
            "Having them all report their results into the same Slack channel"
          ],
          correct: 1,
          explanation: "A squad works when outputs chain into inputs. That's what makes it a repeatable system rather than four tools you happen to own."
        },
        {
          question: "The Analyst Agent's boundaries say it \"does not declare causality without experimental support.\" Why build in a boundary like that?",
          options: [
            "To slow the agent down so humans stay in the loop",
            "Because a defined boundary is what keeps a specialized agent trustworthy — it separates observation from hypothesis instead of overreaching",
            "Because analysts aren't allowed to discuss causes at all"
          ],
          correct: 1,
          explanation: "Clear boundaries are part of the role definition. They're what let you rely on the agent's output and know where its responsibility stops."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Start With Workflows, Not Models",
      body: `
        <p>The biggest mistake is starting with the technology. Start with a <strong>workflow</strong> you want to improve, a recurring product ritual that's expensive in time and attention: weekly backlog grooming, monthly insights review, quarterly planning, experiment review and writeups.</p>
        <p>Then ask three questions about it: where do we lose time, where do mistakes happen, and where do we lack consistency? Those pain points become your first agent responsibilities.</p>
        <p>Take discovery and validation for a new initiative. Common pain points: feedback scattered across tools, competitive research outdated, insights not consistently synthesized, hypotheses and experiments varying in quality, messaging rushed at launch. Every one of those is a job you can hand to a specific agent, which is exactly why that workflow is a good place for a squad.</p>
      `,
      checks: [
        {
          question: "According to this lesson, what should you pick first when designing your first agents?",
          options: [
            "The most capable model your budget allows",
            "A recurring workflow that's expensive in time and attention, then its specific pain points",
            "The workflow your leadership is most curious about"
          ],
          correct: 1,
          explanation: "\"Start with a workflow, not a model.\" The recurring, costly ritual is where an agent earns its keep, and its pain points define what the agent should do."
        },
        {
          question: "How do a workflow's pain points map to agent design?",
          options: [
            "They're logged as risks and reviewed later",
            "Each pain point — lost time, common mistakes, inconsistency — becomes a specific responsibility you assign to an agent",
            "They're averaged into a single \"automation score\" for the workflow"
          ],
          correct: 1,
          explanation: "The pain points are the spec. \"Feedback is scattered\" becomes a Researcher responsibility; \"experiments vary in quality\" becomes an Experiment Designer responsibility."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Scope a Minimum Squad, Then Prioritize It",
      body: `
        <p>You don't need to automate everything. Design an MVP squad that's useful weekly, small enough to maintain, and easy to evaluate. For example: a Researcher that produces a weekly top-5 customer pain points with source links, an Analyst that writes a weekly KPI narrative for 3 to 5 core metrics, an Experiment Designer that fills in a one-page brief template, a Copywriter that gives three microcopy options per feature.</p>
        <p>To decide which agent to build first, score each candidate on four factors:</p>
      `,
      steps: [
        { title: "Frequency", detail: "How often does this workflow actually happen? Weekly beats quarterly for a first agent — you get feedback fast and the time savings compound." },
        { title: "Time cost", detail: "How much PM and team time does it consume today? A Copywriter agent might score high here if your team ships weekly." },
        { title: "Risk", detail: "What's the downside if it goes wrong? An Experiment Designer agent might score high on risk reduction by catching missing instrumentation before launch." },
        { title: "Leverage", detail: "Does it unblock multiple teams or create compounding improvements? An Analyst agent often scores high on both frequency and leverage." },
        { title: "Pick the highest weekly value at manageable risk", detail: "Start with the one agent that clears that bar. Build it, run it for two weeks, refine based on what actually got used, then add the next." }
      ],
      checks: [
        {
          question: "What are the three properties of a well-scoped MVP squad?",
          options: [
            "Fully automated, self-improving, and model-agnostic",
            "Useful weekly, small enough to maintain, and easy to evaluate",
            "Cheap to run, owned by engineering, and invisible to users"
          ],
          correct: 1,
          explanation: "Weekly usefulness gives you a feedback loop; small scope keeps it maintainable; evaluability is what stops it drifting."
        },
        {
          question: "Two candidate agents look useful. One supports a weekly ritual, the other a quarterly one. All else equal, which do you build first, and why?",
          options: [
            "The quarterly one — quarterly rituals are higher stakes",
            "The weekly one — higher frequency means faster feedback and time savings that compound sooner",
            "Neither — build both at once so the squad is complete"
          ],
          correct: 1,
          explanation: "Frequency is the first scoring factor for a reason. A weekly agent teaches you more, sooner, and its value adds up while you're still learning."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Plug It In, and Evaluate It Like a Product",
      body: `
        <p>The squad should fit the tools and rituals your team already uses, Slack or Teams for digests, Jira or Linear for turning insights into tickets, Notion or Google Docs for living briefs, your analytics platform for KPI monitoring. The pattern: agents produce outputs on a cadence, humans review in a short ritual, approved outputs become artifacts and actions in your normal tools. The goal isn't "another tool," it's less friction inside the system your team already lives in.</p>
        <p>Then treat each agent like a mini product with its own success metrics. The Researcher: coverage, traceability back to sources, whether people cite it in decisions. The Analyst: accuracy, time saved in KPI reviews, decisions triggered. The Experiment Designer: brief consistency, fewer failed launches from missing instrumentation. The Copywriter: fewer editing cycles, alignment to voice and compliance. If you can't evaluate it, it will drift.</p>
        <p>What changes for the PM: you're defining roles, not writing prompts; designing workflows and handoffs, not asking for one-off answers; managing quality through evaluation, not vibes.</p>
      `,
      checks: [
        {
          question: "Why does the lesson insist on evaluation metrics for each agent?",
          options: [
            "To justify the cost of the agents to finance",
            "\"If you cannot evaluate it, it will drift\" — without a success measure, quality slowly degrades and nobody notices",
            "Because evaluation metrics are required before you can deploy to Slack"
          ],
          correct: 1,
          explanation: "Each agent is a mini product. A defined success metric per role is what keeps it honest over time and tells you when it needs a refresh."
        },
        {
          label: "Bringing it together",
          question: "Your team has scattered feedback, outdated competitive research, and rushed launch messaging. Using this course, what's the right first step toward an AI product team?",
          options: [
            "Stand up all four agents at once so the discovery-to-launch workflow is fully covered",
            "Pick that one workflow, score its pain points on frequency/time/risk/leverage, build the single highest-value agent, run it for two weeks, then expand",
            "Buy a general assistant and prompt it well for each of the three problems"
          ],
          correct: 1,
          explanation: "Start from the workflow, scope a minimum, prioritize with the rubric, ship one agent, evaluate, then grow the squad. That's the whole arc of this course."
        }
      ],
      reflection: {
        prompt: "Name one recurring workflow on your team that's costly in time and inconsistent in quality. Which single agent would you build first for it, and how would you know in two weeks whether it's working?"
      }
    }
  ]
};
