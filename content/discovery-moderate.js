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
  recap: [
    "Make feedback systematic: reach every stakeholder group, keep regular touchpoints, and shadow real work when you can.",
    "Blend quantitative and qualitative: surveys for \"what and how many,\" interviews for \"why,\" and the support team as a free, always-on channel.",
    "Close the loop: be transparent about decisions (including a \"no\" and its reason), keep a visible roadmap, run pilot groups.",
    "Not all feedback is a market signal. Segment it by role, region, or size: a theme across segments is a signal, one confined to a segment is a data point.",
    "Discovery is a cycle, not a phase: small increments, a short review each iteration, and findings that are allowed to change the roadmap."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Feedback Isn't a Box to Check",
      preCheck: {
        label: "Before you read on, predict",
        question: "You gather user feedback regularly, but it happens informally and often after a solution's already in motion. What's the main thing that needs to change?",
        options: [
          "Collect more feedback, from more people",
          "Make feedback a structured input to decisions: from the right stakeholders, on a cadence, before direction is set",
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
          <li><strong>Establish regular touchpoints</strong>, like recurring check-ins or an advisory group, instead of only talking to users when something's on fire.</li>
          <li><strong>Shadow real users</strong> when you can. Watching someone work reveals friction they'd never think to report.</li>
        </ul>
      `,
      checks: [
        {
          question: "The lesson says feedback should come from more than the end user. Who else?",
          options: [
            "Only the end user matters; other groups are a distraction",
            "The people who administer the product, pay for it, and approve it. Each has a different perspective and set of needs",
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
      figures: {
        "mix": {
          "type": "compare",
          "title": "Two kinds of feedback, two questions",
          "columns": [
            {
              "label": "Quantitative",
              "title": "What, and how widely",
              "tone": "sky",
              "icon": "chart",
              "items": [
                "Surveys",
                "Analytics"
              ]
            },
            {
              "label": "Qualitative",
              "title": "Why",
              "tone": "teal",
              "icon": "chat",
              "items": [
                "Interviews",
                "Support calls"
              ]
            }
          ]
        }
      },
      body: `
        <p>Data alone doesn't tell the whole story; anecdotes alone give a skewed one. Good feedback collection blends the two.</p>
        <ul>
          <li><strong>Surveys and polls</strong> quantify sentiment, but only if the questions are tailored to each stakeholder group and specific enough to act on. A vague question yields a vague answer.</li>
          <li><strong>One-on-one interviews</strong> capture the "why" behind a behavior. This is where you learn what a number can't tell you.</li>
          <li><strong>Support and success teams</strong> are often the first to hear complaints and feature requests. That channel is free and continuous, so use it.</li>
        </ul>
        <p>The pattern:</p>
        <div data-fig="mix"></div>
      `,
      checks: [
        {
          question: "What's the role of a one-on-one interview in this mix?",
          options: [
            "To quantify how many users feel a certain way",
            "To capture the \"why\" behind user behavior: the reasoning a survey number can't reveal",
            "To replace the need for analytics"
          ],
          correct: 1,
          explanation: "Surveys and analytics tell you what and how much. Interviews tell you why. You need both to know what to actually do."
        },
        {
          question: "Why does the lesson call out feedback from support and success teams specifically?",
          options: [
            "Because their feedback is more reliable than users' own",
            "Because they hear complaints and requests first and continuously: a free, always-on feedback channel teams often ignore",
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
      figures: {
        "loop": {
          "type": "loop",
          "title": "Closing the feedback loop",
          "center": "When users see it landed, they keep telling you",
          "items": [
            {
              "title": "Users give feedback"
            },
            {
              "title": "The team decides and acts",
              "tone": "amber"
            },
            {
              "title": "Ship it, or explain why not",
              "tone": "violet"
            },
            {
              "title": "Users see it landed",
              "tone": "mint"
            }
          ]
        }
      },
      body: `
        <p>Gathering feedback isn't enough. If users don't see that their input went anywhere, they stop giving it. Closing the loop is how you keep the channel alive.</p>
        <div data-fig="loop"></div>
        <p>Three practices that close it: <strong>be transparent about decisions</strong>, including when feedback can't be acted on and why; <strong>keep a roadmap visible</strong> to key stakeholders so they can see their input in the plan; and <strong>run pilot groups</strong> so users test changes before wide release and feel part of the process.</p>
      `,
      checks: [
        {
          question: "What happens if a team collects feedback but never closes the loop?",
          options: [
            "Nothing. The feedback was still recorded and useful",
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
          explanation: "\"Heard and declined, here's why\" keeps trust. \"Heard and ignored\" breaks it. Closing the loop takes transparency, not just shipping."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Feedback vs. Market Signal",
      figures: {
        "venn": {
          "type": "venn",
          "title": "Feedback vs market signal",
          "foot": "Need alone can be niche. Opportunity alone can be a solution nobody wants.",
          "left": {
            "title": "Real user need",
            "text": "What people struggle with"
          },
          "right": {
            "title": "Market opportunity",
            "text": "Where the business can win"
          },
          "overlap": {
            "title": "Prioritize here"
          }
        }
      },
      body: `
        <p>Not all user feedback reflects a broader market need. Some of it is one person's individual pain point; some of it points at a trend showing up across the industry. A big part of doing discovery well is telling those apart.</p>
        <p>Two techniques:</p>
        <ul>
          <li><strong>Cross-functional reviews.</strong> Sit down regularly with sales, marketing, and support to discuss which feedback lines up with broader market movement and which doesn't.</li>
          <li><strong>Segment the feedback.</strong> Break it down by role, region, or company size. If the same theme shows up across multiple segments, it's a signal. If it's isolated to one, treat it as a data point, not a mandate.</li>
        </ul>
        <div data-fig="venn"></div>
      `,
      checks: [
        {
          question: "How does the lesson suggest telling an individual pain point from a real market signal?",
          options: [
            "Whichever the loudest customer is asking for",
            "Segment the feedback by role, region, or size: a theme across multiple segments is a signal; one confined to a single segment is just a data point",
            "Wait until at least ten customers ask for the same thing"
          ],
          correct: 1,
          explanation: "Segmentation is the test. Repetition across different kinds of users points at a market need; a single cluster points at a local one."
        },
        {
          question: "Feature A is requested loudly by your three largest enterprise accounts and nobody else. Feature B is requested moderately across SMB, mid-market, and enterprise. Which does this course lean toward?",
          options: [
            "Feature A, because the biggest accounts carry the most weight",
            "Feature B, because a theme that shows up across segments is a market signal, while A's is confined to one",
            "Whichever is lower effort to build"
          ],
          correct: 1,
          explanation: "The segmentation test: repetition across different kinds of customers points at a market need. A single loud cluster, even a valuable one, is a data point to weigh, not a mandate."
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
        { title: "Break work into smaller increments", detail: "Large initiatives split into small pieces give you more chances to gather feedback and adjust before a wrong assumption is baked into three months of build." },
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
            "It's probably running too late or too shallow. Real discovery should sometimes reshape direction, not just polish what's already decided",
            "The roadmap is simply very accurate"
          ],
          correct: 1,
          explanation: "If discovery never influences direction, it's happening after the decisions are made. Moving it earlier is what lets it do its actual job."
        }
      ],
      reflection: {
        prompt: "Look at your last two months of user feedback. Pick one theme. Was it an individual pain point, or did it show up across segments? And did anything about your roadmap change because of it?"
      }
    }
  ]
};
