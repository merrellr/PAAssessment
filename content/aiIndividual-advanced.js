/* ================================================================
   COURSE CONTENT: AI Fluency — Individual, Advanced Experience
   Source article: "A Day in the Life of a Product Manager Working
   with AI Agents (2026 Edition)" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiIndividual-advanced"] = {
  sourceUrl: "https://www.linkedin.com/pulse/day-life-product-manager-working-ai-agents-2026-edition-merrell-uwsic",
  lessons: [
    {
      id: 1,
      title: "Lesson 1: The Shift Nobody Announced",
      image: { src: "images/day-map-header.png", alt: "A day mapped as a curved timeline from 7 AM to 6 PM, with colored dots marking key moments across the day" },
      body: `
        <p>Jordan's alarm goes off at 6:45. By the time coffee is brewing, the first decision of the day has already been made without them, and that's exactly the point of this lesson.</p>
        <p>This isn't a story about AI replacing a product manager. It's a story about what happens to a PM's day once a handful of specialized agents take over the <strong>watching</strong>: reading every email, scanning every dashboard, tracking every ticket, so a person only has to step in for the moments that actually need a human judgment call.</p>
        <p>Over the next few lessons, we'll walk through Jordan's day hour by hour. Watch for the pattern: the agents surface facts. Jordan decides what the facts mean.</p>
      `,
      check: {
        question: "What is this lesson's central claim about AI agents in this scenario?",
        options: [
          "Agents are making the actual product decisions now",
          "Agents handle the constant watching and summarizing; the person still makes every meaningful judgment call",
          "Agents mostly just save typing time"
        ],
        correct: 1,
        explanation: "The whole arc of the day is built around this distinction: agents absorb the reading, watching, and drafting. Every real decision still comes from Jordan weighing context an agent doesn't have."
      }
    },
    {
      id: 2,
      title: "Lesson 2: Morning — Agents Doing the Watching",
      image: { src: "images/day-timeline-full.png", alt: "Timeline titled Jordan's Day, Mapped Against the Agents Doing the Watching, showing 7:10 AM Inbox digest, 8:05 AM Meeting brief, and later touchpoints through 5:45 PM" },
      body: `
        <p>Five years ago, opening an inbox with 62 new emails meant forty minutes of scrolling before the real workday even started. Step through what Jordan's morning looks like instead.</p>
      `,
      steps: [
        { title: "7:10 AM — Inbox digest", detail: "Overnight, an inbox agent read 62 emails and several Slack threads, then wrote a two-paragraph digest: one urgent item, one worth knowing, everything else filed as \"nothing needs you today.\" Ninety seconds of reading replaces forty minutes of triage." },
        { title: "8:05 AM — Meeting brief", detail: "Before a 9:30 with engineering, a meeting-prep agent pulls together sprint status and flags that one ticket has sat untouched for four days with no comment. The delay isn't the real story, the silence is, and that's a judgment only Jordan makes." },
        { title: "9:30 AM — Standup, shortened", detail: "Nobody recites status anymore, the brief already covered that. The team spends the time on the one thing that actually needed discussion: an engineer stuck on an ambiguous requirement, resolved in ninety seconds instead of costing three more days." }
      ],
      check: {
        question: "What did the meeting-prep agent actually contribute at 8:05 AM?",
        options: [
          "It decided how to resolve the blocked ticket",
          "It surfaced a fact (four days of silence) — Jordan still had to decide what that fact meant and how to handle it",
          "It rescheduled the 9:30 meeting"
        ],
        correct: 1,
        explanation: "The agent noticed a pattern (silence on a ticket) that a person would likely miss buried in a status list. Deciding it was worth a private conversation, not a public callout, was Jordan's judgment call entirely."
      }
    },
    {
      id: 3,
      title: "Lesson 3: Midday — Catching What Would Have Slipped Through",
      body: `
        <p>The most valuable thing an agent can do isn't answering questions, it's noticing something a person wasn't even looking for.</p>
        <p>Before an 11:00 AM renewal call, an account-context agent pulls together usage trends, support tickets, and repeat feature requests, then flags something easy to miss: usage of a core feature dropped sharply right after last month's release. That single flag changes the whole call. Instead of a routine check-in, Jordan opens by asking about the drop directly, and learns the account quietly worked around a broken workflow instead of filing a ticket, exactly the kind of silent churn risk that used to go undetected for months.</p>
        <p>An hour later, an analytics agent flags something similar at a wider scale: a specific onboarding step is seeing completion rates drop across <em>several</em> accounts, not just the one from the morning's call. Not urgent enough for an alert, but a pattern worth attention. Jordan still has to decide if it's worth fixing now or noting for next quarter, that call is entirely theirs.</p>
      `,
      check: {
        question: "Why does the analytics agent's onboarding flag matter more than a single alert would?",
        options: [
          "Because it's louder and more urgent than a normal alert",
          "Because it connects a pattern across multiple accounts that no single dashboard view would have made obvious",
          "Because it automatically fixes the onboarding step"
        ],
        correct: 1,
        explanation: "The value here is connection, not volume. One dropped account might be noise. The same pattern showing up across several accounts is a signal, and only a system constantly watching in the background would have caught it."
      }
    },
    {
      id: 4,
      title: "Lesson 4: Afternoon — Editing, Not Authoring",
      body: `
        <p>At 2:30, Jordan talks through a rough PRD idea with a writing agent and gets back a first draft: problem statement, proposed approach, open questions. It's not right, the framing is too narrow, focused on the mechanics of the drop-off rather than the real user confusion behind it. Jordan rewrites the problem statement almost entirely, keeps most of the proposed approach, and tightens the open questions down to the two that matter. Twenty minutes of real editing turns a rough draft into something worth sharing, instead of two hours of staring at a blank page.</p>
        <p>At 4:00, a task-management agent proposes a backlog reorder based on the week's signals, the account risk, the onboarding drop, engineering estimates that came in high, and explains its reasoning in plain language. Jordan agrees with most of it, but overrides one recommendation because of an upcoming exec review the agent has no way of knowing about. The team sees the reasoning behind the new order, not just the new order itself.</p>
      `,
      check: {
        question: "What does the backlog override at 4:00 PM illustrate?",
        options: [
          "The agent's prioritization logic was wrong and unreliable",
          "Even a well-reasoned agent recommendation can miss context only a person has, and a good workflow makes it easy to override with a clear reason",
          "Jordan doesn't trust AI-generated backlogs at all"
        ],
        correct: 1,
        explanation: "The agent's reasoning was sound given what it could see. It simply couldn't see the exec review. That gap, not a flaw in the agent, is exactly why a human stays in the loop on real prioritization calls."
      }
    },
    {
      id: 5,
      title: "Lesson 5: What's Actually Different",
      body: `
        <p>By 5:45, an end-of-day digest arrives before Jordan even closes the laptop: what happened, what's still open, three things flagged for tomorrow, and an honest note about what it couldn't confirm, since one conversation from standup happened outside any tool it can see.</p>
        <p>None of this is about agents making decisions instead of Jordan. Every meaningful call that day, the account risk worth escalating, the PRD framing, the backlog override, came from a person weighing context an agent didn't have. What changed is everything sitting underneath those decisions: the reading, the summarizing, the watching, the first draft, the constant low-grade vigilance that used to eat most of a PM's day now happens quietly in the background.</p>
        <p>The job hasn't gotten smaller. It's gotten more concentrated.</p>
      `,
      check: {
        question: "What's the article's core argument about how the PM role changes?",
        options: [
          "PMs will need to learn to code to keep up with AI agents",
          "The role shrinks as agents take over more responsibilities",
          "The routine watching and drafting work moves to agents, concentrating the role around judgment calls only a person can make",
          "Agents mostly help with formatting documents faster"
        ],
        correct: 2,
        explanation: "The whole day illustrates this: agents absorb everything that used to be constant background work. What's left, and what actually matters most, is the judgment a person brings to the handful of calls that genuinely need it."
      },
      reflection: {
        prompt: "Think about your own day. What's one recurring task, watching a dashboard, triaging an inbox, drafting a first version of something, that an agent could take off your plate so you can spend more time on judgment calls?"
      }
    }
  ]
};
