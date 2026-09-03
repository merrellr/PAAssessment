/* ================================================================
   COURSE CONTENT: Stakeholder Communication & Influence, No Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 4 Section 2 ("Establishing Cross-Functional Collaboration")
   and Chapter 6 Section 3 ("Communicating the Roadmap to Stakeholders")
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["stakeholder-novice"] = {
  sourceUrl: "",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Stop Waiting to Be Asked",
      preCheck: {
        label: "Before you read on — predict",
        question: "Your stakeholders get updates from you whenever they come and ask. Is that a communication style that scales?",
        options: [
          "Yes — answering questions as they arrive is efficient",
          "No — it means people only know what's happening if they chase you, and the ones who don't ask are left in the dark",
          "It depends entirely on how many stakeholders there are"
        ],
        correct: 1,
        explanation: "Hold that thought. This lesson is about the difference between reactive and proactive communication."
      },
      body: `
        <p>The most common early-career communication pattern is <strong>reactive</strong>: you share information when someone asks for it. It feels responsive, but it has two quiet failures. People who don't know to ask stay uninformed. And every "quick question" is an interruption that could have been prevented by an update nobody had to request.</p>
        <p><strong>Proactive</strong> communication flips that: you share status, decisions, and changes on a predictable rhythm, before anyone has to come looking. The test is simple, can a stakeholder answer "what's the state of this project?" without messaging you? If not, you're still reactive.</p>
        <p>Communication breakdowns lead to misaligned expectations and, often, product failures. Getting ahead of them is one of the highest-leverage habits an early product person can build.</p>
      `,
      checks: [
        {
          question: "What are the two failures of reactive communication this lesson names?",
          options: [
            "It's slow, and it's expensive",
            "People who don't know to ask stay uninformed, and every question is a preventable interruption",
            "It creates too much documentation, and nobody reads it"
          ],
          correct: 1,
          explanation: "Reactive communication only reaches the people who chase you, and it converts what could be a broadcast into a stream of one-off interruptions."
        },
        {
          question: "What's the practical test for whether your communication is proactive?",
          options: [
            "Whether you respond to messages within an hour",
            "Whether a stakeholder can answer \"what's the state of this project?\" without messaging you",
            "Whether you send a weekly email"
          ],
          correct: 1,
          explanation: "If people still have to come to you for status, the information isn't reaching them on its own yet — that's the line between reactive and proactive."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Build a Rhythm",
      body: `
        <p>Proactive communication runs on <strong>cadence</strong>, a set of recurring touchpoints so predictable that people stop needing to ask.</p>
        <svg viewBox="0 0 400 120" style="width:100%; height:auto; margin:4px 0 2px;">
          <line x1="20" y1="60" x2="380" y2="60" stroke="#E3E9F0" stroke-width="2"/>
          <g font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e" text-anchor="middle">
            <circle cx="70" cy="60" r="5" fill="#1A4584"/><text x="70" y="42">Daily</text>
            <circle cx="170" cy="60" r="5" fill="#35C2E8"/><text x="170" y="42">Weekly</text>
            <circle cx="270" cy="60" r="5" fill="#1A4584"/><text x="270" y="42">Per sprint</text>
            <circle cx="360" cy="60" r="5" fill="#35C2E8"/><text x="360" y="42">Quarterly</text>
          </g>
          <g font-family="sans-serif" font-size="8" fill="#4B5768" text-anchor="middle">
            <text x="70" y="82">standup</text>
            <text x="170" y="82">team sync</text>
            <text x="270" y="82">review + retro</text>
            <text x="356" y="82">roadmap review</text>
          </g>
        </svg>
        <p>The exact structure matters less than the predictability. Regular <strong>standups</strong> keep the team aligned day to day. A weekly <strong>sync</strong> aligns on deliverables and timelines. <strong>Sprint reviews and retrospectives</strong> give stakeholders a scheduled window into progress and a place to raise concerns. Once these exist, most "quick questions" stop happening, the answer was already delivered.</p>
      `,
      checks: [
        {
          question: "According to this lesson, what makes a communication cadence work?",
          options: [
            "Using the exact ceremonies from the Scrum guide",
            "Predictability — recurring touchpoints reliable enough that people stop needing to ask for status",
            "Keeping every meeting under fifteen minutes"
          ],
          correct: 1,
          explanation: "The specific structure is flexible. What matters is that the touchpoints happen on schedule, so information arrives before it's requested."
        },
        {
          question: "What effect does an established cadence have on ad-hoc \"quick questions\"?",
          options: [
            "It has no effect; people ask regardless",
            "Most of them stop, because the answer was already delivered on schedule",
            "It increases them, because people are more engaged"
          ],
          correct: 1,
          explanation: "A reliable rhythm pre-empts the interruptions. The question doesn't get asked because the person already has the answer."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Set Up the Channels",
      body: `
        <p>A cadence needs somewhere for the information to live between meetings. Three basics:</p>
        <ul>
          <li><strong>A shared project tool</strong> (Jira, Linear, Trello, whatever your team uses) where progress is visible without anyone reporting it. If a stakeholder can open the board and see status, that's a question you never have to answer.</li>
          <li><strong>An open communication channel</strong> (Slack, Teams) that breaks down silos, so updates and decisions are visible to everyone who needs them, not trapped in DMs.</li>
          <li><strong>Collaborative documents</strong> for real-time updates and feedback, a single source of truth people can check and comment on.</li>
        </ul>
        <p>The goal is a setup where the default state is "informed," and staying uninformed takes effort.</p>
      `,
      checks: [
        {
          question: "Why does the lesson recommend a shared project tool where progress is visible?",
          options: [
            "So managers can track individual productivity",
            "If a stakeholder can open the board and see status for themselves, that's a status question you never have to field",
            "Because it's required for agile certification"
          ],
          correct: 1,
          explanation: "Visible-by-default progress turns status updates into self-service. The tool answers the question so you don't have to."
        },
        {
          question: "What's the problem with important updates and decisions living in direct messages?",
          options: [
            "DMs are less formal than they should be",
            "They're trapped where only the two people in the thread can see them, which recreates the silos the channel is supposed to break",
            "They can't be searched later"
          ],
          correct: 1,
          explanation: "An open channel exists so information reaches everyone who needs it. A decision made in a DM is invisible to everyone else and has to be re-communicated."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Tailor the Update",
      body: `
        <p>Broadcasting the same update to everyone is better than staying silent, but it still isn't quite right. Different audiences need different cuts of the same information.</p>
      `,
      steps: [
        { title: "For the delivery team", detail: "Detail: what's in progress, what's blocked, what's next, dependencies and timing. Their question is \"what am I working on and what's in my way?\"" },
        { title: "For a sponsor or executive", detail: "Altitude: are we on track against the goal, what's the main risk, what decision (if any) do I need from you? Skip the task-level detail." },
        { title: "For a customer-facing team", detail: "Impact: what's shipping soon, what pain does it address, roughly when. They need to know what to tell customers, not how the sausage is made." },
        { title: "Explain the \"why\" when something changes", detail: "Whatever the audience, when a plan shifts, give the reason. \"We moved X to make room for Y because Z\" prevents the confusion and frustration that a silent change creates." }
      ],
      checks: [
        {
          question: "What does a sponsor or executive most need from a project update?",
          options: [
            "The full task list with owners and dates",
            "Whether it's on track against the goal, the main risk, and any decision they need to make",
            "A live demo of the latest build"
          ],
          correct: 1,
          explanation: "Executives are tracking the bet, not the tasks. On-track / main-risk / decision-needed is the right altitude for them."
        },
        {
          question: "Why explain the reasoning whenever a plan changes?",
          options: [
            "To create a record for performance reviews",
            "A change without a reason breeds confusion and frustration; \"we moved X for Y because Z\" pre-empts both",
            "Because stakeholders will otherwise assume the worst about the team"
          ],
          correct: 1,
          explanation: "People accept changes they understand. A silent shift on the roadmap generates exactly the questions and doubt that proactive communication is meant to avoid."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Transparency Is the Habit",
      body: `
        <p>The through-line of everything so far is <strong>transparency by default</strong>: sharing status, decisions, setbacks, and trade-offs before you're asked, in a place people can see, at an altitude that fits the audience.</p>
        <p>The part that's easy to skip is the setbacks. It's tempting to only broadcast wins and stay quiet when something slips. But a stakeholder who only hears good news stops trusting the channel, and starts asking around. Being straight about what went wrong, and what you're doing about it, is what makes people rely on your updates when it counts.</p>
        <p>Put together: a predictable cadence, open channels, audience-tailored updates, and honesty about the hard parts. That's the whole shift from "communicates when asked" to "keeps everyone informed."</p>
      `,
      checks: [
        {
          question: "Why is it a mistake to only communicate wins and go quiet during setbacks?",
          options: [
            "Setbacks aren't interesting to stakeholders",
            "A stakeholder who only hears good news stops trusting the channel and starts asking around — undoing the proactive communication",
            "It makes the retrospective harder to write"
          ],
          correct: 1,
          explanation: "Trust in an update stream depends on it being honest. Selective good-news reporting trains people to seek information elsewhere."
        },
        {
          label: "Bringing it together",
          question: "A stakeholder pings you: \"Hey, what's the status on the export feature? Haven't heard anything in weeks.\" Based on this course, what does that message tell you?",
          options: [
            "Nothing — occasional status questions are normal",
            "Your communication is still reactive for this person: there's no cadence or visible channel giving them the answer, so they had to come ask",
            "The stakeholder is being needlessly demanding"
          ],
          correct: 1,
          explanation: "The question is the signal. If someone has to ask for status, the proactive setup — rhythm, visible progress, tailored updates — isn't reaching them yet."
        }
      ],
      reflection: {
        prompt: "Think about the last three \"what's the status on X?\" messages you got. For each, what recurring update or visible channel would have meant the person never had to ask?"
      }
    }
  ]
};
