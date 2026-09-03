/* ================================================================
   COURSE CONTENT: Customer & Market Discovery, Moderate Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 5, "Integrating User Feedback and Market Insights into
   Product Development"
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["discovery-moderate"] = {
  sourceUrl: "",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Feedback Isn't a Box to Check",
      preCheck: {
        label: "Before you read on — predict",
        question: "You gather user feedback regularly, but it happens informally and often after a solution's already in motion. What's the main thing that needs to change?",
        options: [
          "Collect more feedback, from more people",
          "Make feedback a structured input to decisions — from the right stakeholders, on a cadence, before direction is set",
          "Replace interviews with larger surveys"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. Volume isn't usually the problem."
      },
      body: `
        <p>Feedback is a critical ingredient for user-centered products, not a formality. But gathering it well means reaching the <strong>right stakeholders</strong>, and in most products that's more than the end user: there are the people who use it, the people who administer it, the people who pay for it, and sometimes the people who have to approve it.</p>
        <p>Three habits make feedback systematic instead of incidental:</p>
        <ul>
          <li><strong>Create personas per stakeholder group</strong> so you know whose feedback you're missing.</li>
          <li><strong>Establish regular touchpoints</strong> — recurring check-ins or an advisory group — instead of only talking to users when something's on fire.</li>
          <li><strong>Shadow real users</strong> when you can. Watching someone work reveals friction they'd never think to report.</li>
        </ul>
      `,
      checks: [
        {
          question: "The lesson says feedback should come from more than the end user. Who else?",
          options: [
            "Only the end user matters; other groups are a distraction",
            "The people who administer the product, pay for it, and approve it — each has a different perspective and set of needs",
            "Just the product team's own opinions"
          ],
          correct: 1,
          explanation: "Different stakeholders bring different priorities. Missing one group's perspective is how a product ends up loved by daily users but blocked by whoever controls the budget."
        },
        {
          question: "Why does the lesson recommend shadowing users rather than only asking them for feedback?",
          options: [
            "It's faster than scheduling interviews",
            "Watching someone work reveals friction and workarounds they'd never think to mention in a survey or interview",
            "It removes the need to talk to them at all"
          ],
          correct: 1,
          explanation: "People adapt to bad workflows until they stop noticing them. Direct observation surfaces the problems that self-reported feedback misses."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Collecting Feedback That's Actually Actionable",
      body: `
        <p>Data alone doesn't tell the whole story; anecdotes alone give a skewed one. Good feedback collection blends the two.</p>
        <ul>
          <li><strong>Surveys and polls</strong> quantify sentiment, but only if the questions are tailored to each stakeholder group and specific enough to act on. A vague question yields a vague answer.</li>
          <li><strong>One-on-one interviews</strong> capture the "why" behind a behaviour. This is where you learn what a number can't tell you.</li>
          <li><strong>Support and success teams</strong> are often the first to hear complaints and feature requests. That channel is free and continuous — use it.</li>
        </ul>
        <p>The pattern: use the quantitative sources to see <em>what</em> is happening and how widely, and the qualitative ones to understand <em>why</em>.</p>
      `,
      checks: [
        {
          question: "What's the role of a one-on-one interview in this mix?",
          options: [
            "To quantify how many users feel a certain way",
            "To capture the \"why\" behind user behaviour — the reasoning a survey number can't reveal",
            "To replace the need for analytics"
          ],
          correct: 1,
          explanation: "Surveys and analytics tell you what and how much. Interviews tell you why. You need both to know what to actually do."
        },
        {
          question: "Why does the lesson call out feedback from support and success teams specifically?",
          options: [
            "Because their feedback is more reliable than users' own",
            "Because they hear complaints and requests first and continuously — a free, always-on feedback channel teams often ignore",
            "Because they should own the product roadmap"
          ],
          correct: 1,
          explanation: "Support conversations are a running stream of unfiltered user pain. Not tapping that is leaving the easiest feedback source on the table."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Close the Loop",
      body: `
        <p>Gathering feedback isn't enough. If users don't see that their input went anywhere, they stop giving it. Closing the loop is how you keep the channel alive.</p>
        <svg viewBox="0 0 400 150" style="width:100%; height:auto; margin:4px 0 2px;">
          <defs>
            <marker id="flArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g font-family="'Space Grotesk',sans-serif" font-size="9.5" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="30" y="16" width="120" height="32" rx="9" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="90" y="36">Users give feedback</text>
            <rect x="250" y="16" width="120" height="32" rx="9" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="310" y="36">Team decides + acts</text>
            <rect x="250" y="102" width="120" height="32" rx="9" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.2"/><text x="310" y="122">Ship or explain why not</text>
            <rect x="30" y="102" width="120" height="32" rx="9" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="90" y="118">Users see it landed</text>
          </g>
          <line x1="150" y1="32" x2="248" y2="32" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#flArrow)"/>
          <line x1="310" y1="48" x2="310" y2="100" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#flArrow)"/>
          <line x1="250" y1="118" x2="152" y2="118" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#flArrow)"/>
          <line x1="90" y1="100" x2="90" y2="50" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#flArrow)"/>
        </svg>
        <p>Three practices that close it: <strong>be transparent about decisions</strong> — including when feedback can't be acted on and why; <strong>keep a roadmap visible</strong> to key stakeholders so they can see their input in the plan; and <strong>run pilot groups</strong> so users test changes before wide release and feel part of the process.</p>
      `,
      checks: [
        {
          question: "What happens if a team collects feedback but never closes the loop?",
          options: [
            "Nothing — the feedback was still recorded and useful",
            "Users stop giving feedback, because they've seen it go nowhere",
            "The roadmap becomes more accurate over time anyway"
          ],
          correct: 1,
          explanation: "A feedback channel runs on evidence that it matters. Silence trains people to stop contributing."
        },
        {
          question: "According to the lesson, what should you do when specific feedback can't be acted on?",
          options: [
            "Say nothing to avoid disappointing the user",
            "Be transparent about the decision and the reason, so the user knows they were heard even though the answer was no",
            "Promise to revisit it next quarter regardless"
          ],
          correct: 1,
          explanation: "\"Heard and declined, here's why\" keeps trust. \"Heard and ignored\" breaks it. Transparency is part of closing the loop, not just shipping is."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Feedback vs. Market Signal",
      body: `
        <p>Not all user feedback reflects a broader market need. Some of it is one person's individual pain point; some of it points at a trend showing up across the industry. A big part of doing discovery well is telling those apart.</p>
        <p>Two techniques:</p>
        <ul>
          <li><strong>Cross-functional reviews.</strong> Sit down regularly with sales, marketing, and support to discuss which feedback lines up with broader market movement and which doesn't.</li>
          <li><strong>Segment the feedback.</strong> Break it down by role, region, or company size. If the same theme shows up across multiple segments, it's a signal. If it's isolated to one, treat it as a data point, not a mandate.</li>
        </ul>
        <p>The features worth prioritizing sit at the intersection: a real user need <em>and</em> a market opportunity.</p>
      `,
      checks: [
        {
          question: "How does the lesson suggest telling an individual pain point from a real market signal?",
          options: [
            "Whichever the loudest customer is asking for",
            "Segment the feedback by role, region, or size — a theme across multiple segments is a signal; one confined to a single segment is just a data point",
            "Wait until at least ten customers ask for the same thing"
          ],
          correct: 1,
          explanation: "Segmentation is the test. Repetition across different kinds of users points at a market need; a single cluster points at a local one."
        },
        {
          question: "Which features does the lesson say are worth prioritizing?",
          options: [
            "The ones with the most feedback volume, regardless of source",
            "The ones sitting at the intersection of a real user need and a market opportunity",
            "The lowest-effort ones, so you can ship quickly"
          ],
          correct: 1,
          explanation: "User need alone can be niche; market opportunity alone can be a solution nobody wants. The overlap is where prioritization should focus."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Make It a Cycle, Not an Event",
      body: `
        <p>The reason discovery slips to "after the solution's already moving" is that it's treated as a phase you pass through once. The fix is to make it a <strong>cycle</strong> that runs continuously alongside delivery.</p>
      `,
      steps: [
        { title: "Break work into smaller increments", detail: "Large initiatives split into small pieces give you more chances to gather feedback and adjust — before a wrong assumption is baked into three months of build." },
        { title: "Run a short review every iteration", detail: "End-of-sprint demos, a standing feedback session, a monthly stakeholder check-in. The cadence is what keeps discovery from falling off the calendar." },
        { title: "Feed what you learn back into direction", detail: "Discovery output isn't just minor feature tweaks. It should be allowed to change the roadmap and, occasionally, the strategy. If it never does, it's decoration." }
      ],
      checks: [
        {
          question: "Why does the lesson push for smaller work increments?",
          options: [
            "Smaller pieces are easier to estimate",
            "More increments mean more chances to gather feedback and correct course before a wrong assumption is built deep into the product",
            "It makes the team look more productive"
          ],
          correct: 1,
          explanation: "The cost of a bad assumption grows the longer it goes unchecked. Frequent, small releases keep that window short."
        },
        {
          label: "Bringing it together",
          question: "Your discovery consistently produces small UI tweaks but never changes the roadmap. Based on this course, what does that suggest?",
          options: [
            "The discovery process is working well and staying focused",
            "It's probably running too late or too shallow — real discovery should sometimes reshape direction, not just polish what's already decided",
            "The roadmap is simply very accurate"
          ],
          correct: 1,
          explanation: "If discovery never influences direction, it's happening after the decisions are made. Moving it earlier is what lets it do its actual job."
        }
      ],
      reflection: {
        prompt: "Look at your last two months of user feedback. Pick one theme. Was it an individual pain point or did it show up across segments? And did anything about your roadmap change because of it?"
      }
    }
  ]
};
