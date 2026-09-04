/* ================================================================
   COURSE CONTENT: AI Fluency — Individual, Lots of Experience
   Source article: "How to Run Product Discovery with AI Agents
   Without Losing the Voice of the Customer" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiIndividual-experienced"] = {
  sourceUrl: "https://www.linkedin.com/pulse/how-run-product-discovery-ai-agents-without-losing-voice-merrell-mvrdc",
  recap: [
    "AI earned a seat at discovery, not the head of the table — it supports the work, it doesn't own the customer relationship.",
    "Start with human-led conversations; the agent doesn't replace talking to users.",
    "Use agents to synthesize, not interpret — they cluster and summarize; the meaning is yours to assign.",
    "Let humans do the sense-making — deciding what a pattern means and what to do about it.",
    "Use AI to generate and challenge hypotheses, widening the space rather than picking the answer.",
    "Close the loop, and watch the most common failure mode: treating the agent's synthesis as the finding."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: AI Earned a Seat, Not the Head of the Table",
      preCheck: {
        label: "Before you read on — predict",
        question: "A team uses AI to summarize interviews, cluster feedback, and surface themes at scale, all genuinely faster than before. Does that guarantee better product decisions?",
        options: [
          "Yes, faster and more thorough analysis naturally leads to better decisions",
          "Not necessarily, something important can get lost even while the process looks more efficient"
        ],
        correct: 1,
        explanation: "Keep this in mind, the lesson below is built around exactly this gap between looking efficient and actually understanding customers."
      },
      body: `
        <p>AI has earned a real seat at the product discovery table. The problem is that many teams are letting it sit at the head. Discovery is faster now, interviews get summarized automatically, feedback gets analyzed at scale. All of that is true, and yet many teams are making <em>worse</em> decisions than before.</p>
        <p>The issue isn't AI itself. It's where teams place it in the process. When AI becomes the proxy for customer understanding rather than the amplifier of it, discovery quietly breaks. You still get themes. You still get charts. What you lose is voice, emotion, and context, and those losses compound downstream.</p>
        <p>The rule that matters most: <strong>humans talk to customers, agents synthesize and augment what humans heard.</strong> Once you anchor on that, everything else falls into place.</p>
      `,
      checks: [
        {
          question: "According to this lesson, what's actually breaking when teams over-rely on AI in discovery?",
          options: [
            "The AI's accuracy at clustering and summarizing feedback",
            "The presence of voice, emotion, and context, the parts that don't survive being reduced to themes and charts",
            "The speed of the discovery process"
          ],
          correct: 1,
          explanation: "Speed and polish aren't the problem, they're often genuine wins. The loss is in what clean summaries and clusters can't capture."
        },
        {
          question: "What's the core rule this whole course is built around?",
          options: [
            "AI should never be used in product discovery",
            "Humans talk to customers; agents synthesize and augment what humans heard",
            "Agents should conduct the interviews so humans can focus on strategy"
          ],
          correct: 1,
          explanation: "This single rule is the anchor for every lesson that follows, it's the line between where AI helps and where it quietly does damage."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Start With Human-Led Conversations",
      image: { src: "images/discovery-loop.png", alt: "The Discovery Loop: five stages arranged in a circle, alternating human-led (Customer Conversations, Sense Making, Validation and Testing) and agent-assisted (Synthesis and Clustering, Hypothesis Expansion), all built around the center message: Humans Own the Insight, AI accelerates the loop" },
      body: `
        <p>No AI workflow can compensate for skipping real conversations. Product discovery still begins the way it always has: someone on the product team talks directly to a customer and listens without trying to sell, validate, or steer toward a predetermined outcome.</p>
        <p>Customers rarely describe their problems cleanly. They circle around them, contradict themselves, use language that doesn't map to your roadmap. They reveal priorities through frustration and workarounds rather than tidy feature requests. Those signals are easy to miss if discovery is reduced to text analysis alone, a transcript doesn't capture tone, a summary doesn't capture tension, a cluster doesn't capture why something feels urgent.</p>
        <p>This is why the people building the product need to hear customers themselves, not just researchers, not just summaries. Direct exposure builds intuition, and intuition is still a core product skill. AI belongs later in the process, not here.</p>
      `,
      checks: [
        {
          question: "Why can't a transcript or AI summary fully replace being in the actual conversation?",
          options: [
            "Transcripts are usually inaccurate",
            "They can't capture tone, tension, or the sense of urgency behind what a customer is saying, only the words themselves",
            "AI tools aren't fast enough to summarize in real time"
          ],
          correct: 1,
          explanation: "The gap isn't accuracy, it's completeness. Emotion and hesitation carry real signal that flattens out the moment it becomes text."
        },
        {
          question: "Where does this lesson say AI belongs in the discovery process?",
          options: [
            "At the very beginning, to prepare better interview questions",
            "Later, after real human conversations have already happened",
            "It doesn't belong anywhere in discovery"
          ],
          correct: 1,
          explanation: "This lesson draws a clear line: real conversations come first, and AI's role starts only once humans have actually listened."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Use Agents to Synthesize, Not Interpret",
      body: `
        <p>Once you have real conversations, this is where agents earn their keep. Most teams drown in qualitative data, interview notes, support tickets, sales call notes scattered across half a dozen tools. AI agents are excellent at organizing that chaos: grouping feedback by recurring themes, surfacing common phrases, spotting patterns across more data than any human could reasonably process alone.</p>
        <p>What they shouldn't do is interpret meaning on your behalf. When agents label clusters, those labels need to be reviewed, and often rewritten, by humans. Customers rarely talk in product taxonomy, they talk in lived experience, and preserving their actual language matters because it carries intent and emotion that a tidy label erases.</p>
        <svg viewBox="0 0 400 138" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <line x1="200" y1="10" x2="200" y2="128" stroke="#E3E9F0" stroke-width="1.5"/>
          <text x="200" y="122" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="7.5" font-weight="700" fill="#9AA3AD">the line</text>
          <text x="100" y="20" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#35C2E8">Agent: synthesize</text>
          <text x="300" y="20" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#1A4584">Human: interpret</text>
          <g font-family="sans-serif" font-size="8" fill="#4B5768">
            <text x="14" y="42">group feedback by recurring theme</text>
            <text x="14" y="62">surface the common phrases</text>
            <text x="14" y="82">spot patterns across more data</text>
            <text x="14" y="102">than a person could read</text>
            <text x="212" y="42">say what a cluster actually means</text>
            <text x="212" y="62">decide what's worth acting on</text>
            <text x="212" y="82">rewrite labels in the customer's</text>
            <text x="212" y="102">own words, not product taxonomy</text>
          </g>
        </svg>
        <p>A good test: if a synthesized insight sounds like internal jargon rather than something a customer would actually say, that's your signal to intervene.</p>
      `,
      checks: [
        {
          question: "An agent labels a cluster of feedback as 'Suboptimal Onboarding Flow Friction.' What does this lesson say to do?",
          options: [
            "Accept it, since the agent processed far more data than a person could",
            "Rewrite it in the customer's own words, since this label sounds like internal jargon rather than something a customer would actually say",
            "Delete the whole cluster since the label is clearly wrong"
          ],
          correct: 1,
          explanation: "This is exactly the test the lesson describes. A jargon-y label is a signal the human review step needs to happen, not proof the underlying cluster is bad."
        },
        {
          question: "What's the real boundary between what agents should and shouldn't do at the synthesis stage?",
          options: [
            "Agents can organize and surface patterns, but shouldn't decide what those patterns mean",
            "Agents should decide what matters most so humans can move faster",
            "Agents shouldn't touch qualitative data at all, only survey numbers"
          ],
          correct: 0,
          explanation: "Organizing chaos is exactly what agents are good at. Assigning meaning to what they found is where the lesson draws the line."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Let Humans Do the Sense-Making",
      preCheck: {
        label: "Before you read on — predict",
        question: "Once feedback has been organized into clear themes, is deciding what to prioritize mostly a data problem or a judgment problem?",
        options: [
          "A data problem, more organized data should make the answer obvious",
          "A judgment problem, requiring context that no amount of organized data supplies on its own"
        ],
        correct: 1,
        explanation: "See if the lesson below confirms this distinction."
      },
      body: `
        <p>Synthesis is not the same thing as understanding, and this is where many teams blur the line. Once feedback has been organized, the hard work begins. Deciding what matters isn't a data problem, it's a judgment problem, one that requires context about company strategy, market dynamics, technical constraints, and long-term vision.</p>
        <p>Humans are responsible for asking which problems are frequent versus which are consequential, which pain points customers have simply learned to live with versus which ones cause churn, and which insights align with where the business is actually going. AI can show you patterns. It cannot tell you which tradeoffs are worth making, that accountability belongs to the product team.</p>
        <p>This step often feels slower than teams want. That slowness isn't inefficiency. It's thinking.</p>
      `,
      checks: [
        {
          question: "Two problems show up equally often in the data. One is a minor annoyance customers shrug off; the other quietly causes churn. What does an AI-generated frequency count alone fail to capture here?",
          options: [
            "Nothing, frequency is the only thing that matters",
            "Consequence, how much a problem actually costs the business, which requires judgment the raw frequency data doesn't supply",
            "The exact wording customers used"
          ],
          correct: 1,
          explanation: "This is the lesson's central distinction: patterns tell you what's common, not what's consequential. That gap is exactly where human judgment has to step in."
        },
        {
          question: "Why does this lesson say a slow sense-making phase isn't necessarily a problem?",
          options: [
            "Because slowness always signals a well-run process",
            "Because that time is spent applying context and judgment that can't be rushed or automated away",
            "Because AI tools are usually too slow to help at this stage"
          ],
          correct: 1,
          explanation: "The framing here is deliberate: what looks like inefficiency is often the actual thinking work that separates real prioritization from a plausible-looking automated answer."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Use AI to Generate and Challenge Hypotheses",
      body: `
        <p>This is one of the most underutilized, high-leverage uses of AI in discovery. Instead of asking agents what to build, ask them to help you think better. Step through how that actually works.</p>
      `,
      steps: [
        { title: "Feed it your synthesized insights", detail: "Give the agent what you've already learned from real conversations and synthesis, not a blank prompt. The value here comes from building on real signal, not generating ideas from nothing." },
        { title: "Ask for multiple possible explanations", detail: "Don't settle for the first plausible story. Ask what else could explain the same pattern, good agents are surprisingly effective at surfacing interpretations a team might dismiss too quickly." },
        { title: "Ask what assumptions you might be making", detail: "This is where agents can challenge groupthink directly, surfacing the assumptions a team has stopped noticing it's even making." },
        { title: "Ask what evidence would disconfirm your narrative", detail: "This is the step most teams skip entirely. Knowing what would prove you wrong is what keeps a hypothesis a hypothesis, instead of quietly becoming a conclusion." }
      ],
      checks: [
        {
          question: "What's the key difference between asking an agent 'what should we build' versus 'what assumptions am I making'?",
          options: [
            "There's no real difference, both produce a recommendation",
            "The second treats the agent's output as a hypothesis to test, while the first risks treating it as a conclusion to act on",
            "The first question is always more efficient"
          ],
          correct: 1,
          explanation: "This is the whole point of this lesson: use AI to expand the problem space and question your thinking, not to hand it the final call."
        }
      ]
    },
    {
      id: 6,
      title: "Lesson 6: Close the Loop, and the Most Common Failure Mode",
      body: `
        <p>Discovery doesn't end when insights get written down. It ends when understanding is validated through further conversation. Take your hypotheses back to customers, share prototypes or problem statements, and watch how customers react, not just what they say. Watch for shifts in language. Listen for corrections. Those moments are often more informative than agreement. If a customer describes the problem differently than your synthesis suggested, trust them, discovery is a loop, not a funnel.</p>
        <p>The most common failure mode across all of this: replacing messy conversations with clean outputs. AI makes discovery feel professional and efficient, summaries look polished, themes feel authoritative. But clarity without contact is dangerous. If your insights feel generic, obvious, or interchangeable with a competitor's, you're likely missing the actual voice of the customer.</p>
        <p>AI will not kill product discovery. Thoughtless use of it might. Humans earn the insight. Agents help us see it more clearly.</p>
      `,
      checks: [
        {
          question: "A customer reacts to your prototype by describing the problem in noticeably different terms than your synthesized insight used. What should you do?",
          options: [
            "Trust your synthesis, since it was built from a larger, more thorough dataset",
            "Trust the customer, a shift in their language is often more informative than simple agreement",
            "Run the correction back through the clustering agent to see if it changes the theme"
          ],
          correct: 1,
          explanation: "This is exactly the signal the lesson says to watch for. A correction from a real customer outweighs a synthesis built from data that came before it."
        },
        {
          label: "Bringing it together",
          question: "A team's discovery output looks polished, clear themes, confident hypotheses, clean prioritization, but every insight sounds like it could describe any competitor's product too. Based on this whole course, what most likely went wrong?",
          options: [
            "The team used AI too little in the process",
            "Somewhere along the loop, AI-generated polish likely replaced real customer contact, most probably by skipping deep human-led conversations or letting agent-written labels stand in for the customer's real language",
            "Nothing went wrong, generic-sounding insights are just a normal result of good synthesis"
          ],
          correct: 1,
          explanation: "This ties together Lesson 2 (real conversations can't be skipped) and Lesson 3 (agent labels need to preserve customer language), the most common failure mode this course describes is exactly this: professional-looking output with the actual voice of the customer missing underneath it."
        }
      ],
      reflection: {
        prompt: "Think about a recent discovery effort you were part of. At which of the five stages in this course's loop did AI genuinely help, and at which stage, if any, did it start to replace something that needed a human?"
      }
    }
  ]
};
