/* ================================================================
   COURSE CONTENT: AI Fluency — Individual, No Experience
   Source article: "AI Is Not a Project. It's a Practice. Here's How
   to Build One." (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiIndividual-novice"] = {
  sourceUrl: "https://www.linkedin.com/pulse/ai-project-its-practice-heres-how-build-one-robert-merrell-4skoc",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Nobody Is Ready, and That's Okay",
      preCheck: {
        label: "Before you read on — predict",
        question: "Which is closer to how AI adoption actually tends to go for most people and teams?",
        options: [
          "Build a full strategy and get everything figured out before touching a tool",
          "Start small with personal curiosity, then build evidence as you go"
        ],
        correct: 1,
        explanation: "See if the lesson below confirms this."
      },
      body: `
        <p>The same conversation happens constantly: someone brings up AI, heads nod, and then someone says, <em>"We're just not ready for that yet."</em></p>
        <p>Here's the thing worth sitting with: waiting for "ready" is the same as deciding not to go. Nobody is ready. That's okay. You start anyway.</p>
        <p>The biggest misconception is that adopting AI means building something, buying an enterprise platform, retraining everyone, and having a five-year strategy blessed by the board before anyone touches a thing. That framing makes AI feel like a construction project, when it's really more like learning to ride a bike. You don't read every book about cycling before you get on. You get on, you wobble, you adjust.</p>
      `,
      checks: [
        {
          question: "What's the article's core objection to the 'we need a full strategy first' mindset?",
          options: [
            "Strategies are inherently a waste of time",
            "It treats AI adoption like a construction project you plan perfectly in advance, when it's really more like a skill you build by starting and adjusting",
            "Only large companies need a strategy at all"
          ],
          correct: 1,
          explanation: "The bike-riding comparison is the point: you learn by getting on, not by reading everything about cycling first."
        },
        {
          question: "According to this lesson, what do the organizations moving forward with AI right now have in common?",
          options: [
            "They had everything figured out before starting",
            "They gave themselves permission to start small and learn as they went",
            "They hired outside consultants to run the rollout"
          ],
          correct: 1,
          explanation: "This is the thread running through the whole article: momentum comes from small, real starts, not from waiting for a perfect plan."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: The Shape of the Journey",
      image: { src: "images/ai-adoption-journey.png", alt: "The AI Adoption Journey shown as four stages: You (personal curiosity), One use case (one repetitive task automated), Team traction (share wins, peer learning spreads), and Org capability (standardized, tied to business goals)" },
      body: `
        <p>Before getting into the specific steps, it helps to see the whole shape of where this is going. Adoption doesn't jump straight from "nobody's using this" to "the whole org runs on it." It moves through stages, and each one builds the evidence for the next.</p>
        <p>Notice where it starts: with <strong>you</strong>, not a company initiative. Everything else on this path is built on that first stage actually happening.</p>
      `,
      checks: [
        {
          question: "According to this journey, what comes right after personal curiosity and exploration?",
          options: [
            "Org-wide standardization",
            "One repetitive task automated as a single use case",
            "A formal training program for the whole team"
          ],
          correct: 1,
          explanation: "The path is deliberately incremental: one real task, proven, before anything about peer learning or org standards even enters the picture."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: How to Actually Get Started",
      body: `
        <p>Four concrete moves to make, step by step. None of them require permission from anyone but you, until the fourth one.</p>
      `,
      steps: [
        { title: "Start with your own curiosity", detail: "Before rolling AI out to a team, spend a few weeks just using it yourself. Draft emails, summarize a report you've been putting off, think through a problem out loud. Firsthand experience is worth more than any briefing document." },
        { title: "Automate one painful, repetitive task", detail: "Every team has one: the weekly status report, the meeting notes nobody has time to write, the proposal draft that always starts blank. Pick one. Measure the time you get back. That single proof point builds more momentum than any presentation." },
        { title: "Lower the bar for what counts as a win", detail: "A lot of people try AI once, get an imperfect result, and give up. That's like trying a new recipe once without reading the instructions and swearing off cooking. Be specific, give context, iterate, treat it as a conversation, not a one-shot test." },
        { title: "Give your team permission to experiment", detail: "Not a formal program with KPIs and quarterly reviews. Just permission. Tell people you want to hear what they're trying. Celebrate the experiments that didn't work as much as the ones that did, that's where the real learning is." }
      ],
      checks: [
        {
          question: "Someone tries AI once, gets a mediocre first result, and concludes 'it doesn't work for what I do.' What does this lesson say about that conclusion?",
          options: [
            "It's a fair conclusion, if it doesn't work the first time it's not worth pursuing",
            "It's premature, these tools respond to how you interact with them, and one attempt isn't enough to judge",
            "It only applies to certain job types"
          ],
          correct: 1,
          explanation: "Step 3 addresses this directly: treat interactions as a conversation you refine, not a single test with a pass/fail verdict."
        },
        {
          question: "What does 'giving your team permission to experiment' actually mean here?",
          options: [
            "Launching a formal program with tracked KPIs and quarterly reviews",
            "Simply telling people it's okay to try things and want to hear about it, celebrating failed experiments as much as successful ones",
            "Requiring every team member to complete AI training before touching any tool"
          ],
          correct: 1,
          explanation: "The article is explicit that this isn't a formal program, it's permission and genuine curiosity about what people are trying, including what didn't work."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: How to Scale Once You Have Traction",
      body: `
        <p>Once you have a few small wins, scaling gets a lot less scary, you're building on evidence instead of theory. Three things that actually move the needle:</p>
        <ul>
          <li><strong>Share what's working.</strong> A Slack thread, a monthly email, wherever people gather, have team members share prompts, use cases, and results. Peer learning spreads faster and sticks better than formal training.</li>
          <li><strong>Standardize the wins.</strong> When someone finds a great way to use AI for a specific task, document it. Turn it into a template others can pick up without starting from zero. That's how individual experimentation becomes organizational capability.</li>
          <li><strong>Connect AI to outcomes you already care about.</strong> Successful teams don't talk about "AI adoption," they talk about reducing time to first draft, improving response times, cutting repetitive work. Tied to goals people already have, it stops being a tech initiative and becomes a business tool.</li>
        </ul>
      `,
      checks: [
        {
          question: "Why does connecting AI to existing goals (like faster first drafts) matter more than talking about \"AI adoption\" as its own initiative?",
          options: [
            "It's just better marketing language for the same thing",
            "Because it stops being a separate technology initiative and becomes a business tool tied to outcomes people already care about",
            "Because it makes the rollout mandatory instead of optional"
          ],
          correct: 1,
          explanation: "This is the shift the article is pointing at: nobody resists a business outcome they already wanted, framing AI as the tool that gets them there removes the resistance a standalone 'AI initiative' tends to create."
        },
        {
          question: "What turns individual experimentation into organizational capability, according to this lesson?",
          options: [
            "Hiring more people who are already AI experts",
            "Documenting a working approach as a template or workflow others can reuse without starting from zero",
            "Waiting for individual habits to spread on their own without any documentation"
          ],
          correct: 1,
          explanation: "Standardizing the wins is the specific mechanism, capturing what worked so it doesn't stay locked in one person's head."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: The Whole Playbook",
      body: `
        <p>Here's the bottom line: you don't need a perfect strategy. You don't need executive buy-in on day one. You don't need to understand the technology inside and out before you try it.</p>
        <p>You need one use case, one experiment, and one person willing to share what they learned. Everything else grows from there.</p>
        <p>Start small. Stay curious. Share what you find. That's the whole playbook.</p>
      `,
      checks: [
        {
          label: "Bringing it together",
          question: "Someone on your team automates their weekly status report with AI and mentions it worked well in a team chat. Based on the full journey in this course, what's the most valuable next move?",
          options: [
            "Nothing needed, one person's success is the end goal",
            "Document how they did it as a reusable template, and connect it to a goal the team already cares about, so it can spread as peer learning rather than staying with one person",
            "Immediately mandate the same approach for the entire department"
          ],
          correct: 1,
          explanation: "This connects Lesson 2's journey (one use case → team traction) with Lesson 4's scaling advice (share what's working, standardize it, tie it to outcomes) — a single win only becomes capability if it's deliberately shared and documented, not mandated top-down."
        }
      ],
      reflection: {
        prompt: "What's one repetitive, mildly annoying task on your own plate this week that you could try automating with AI, just for yourself, before telling anyone else about it?"
      }
    }
  ]
};
