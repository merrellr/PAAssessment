/* ================================================================
   COURSE CONTENT: Prioritization & Trade-offs, No Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 5 Section 3.2 ("Prioritizing Features Strategically") and
   Chapter 6 Section 2.2 ("Prioritizing Roadmap Themes"), with the
   value-vs-effort and ICE framing the book references.
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["prioritization-novice"] = {
  sourceUrl: "",
  template: {
    title: "Score sheet",
    intro: "Run one real backlog item through the framework from this course. Use the ICE calculator above for the score.",
    fields: [
      { key: "item", label: "Candidate item", type: "text", placeholder: "e.g. Inline validation on signup" },
      { key: "nonNegotiable", label: "Non-negotiable? (yes/no, and why)", type: "text", placeholder: "No, this is discretionary" },
      { key: "score", label: "ICE score", type: "text", placeholder: "e.g. 2.50" },
      { key: "decision", label: "Decision", type: "text", placeholder: "Do now / plan later / decline" }
    ]
  },
  recap: [
    "Reactive \"loudest voice\" prioritization optimizes for advocacy, not value, and leaves an order you can't defend.",
    "A value-vs-effort view forces the two questions that matter onto the table: quick wins, big bets, fill-ins, money pits.",
    "Score instead of argue: rate impact, reach, confidence, and effort on a simple scale; when a result feels wrong, fix a bad input, not the ranking.",
    "Non-negotiables (compliance, security, contractual) go on top, unscored. Their downside isn't lost value; it's fines and breaches.",
    "The point of the structure is being able to say \"no\" with a reason the requester can inspect."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: The Loudest-Voice Problem",
      preCheck: {
        label: "Before you read on, predict",
        question: "Your backlog order mostly reflects who asked most recently and most insistently. What's the main risk of leaving it that way?",
        options: [
          "None. Responsiveness to stakeholders is a good thing",
          "The work that gets done is whatever was best advocated for, not whatever creates the most value, and you can't defend the order",
          "You'll run out of requests to work on"
        ],
        correct: 1,
        explanation: "Hold that thought. This lesson is about what reactive prioritization actually costs."
      },
      body: `
        <p>The most common early-stage prioritization pattern is <strong>reactive</strong>: the next thing worked on is whatever was requested most recently, or by the person who pushed hardest. It feels responsive, and it has three quiet costs.</p>
        <ul>
          <li><strong>You optimize for advocacy, not value.</strong> The best-connected requester wins, which has little to do with what helps users most.</li>
          <li><strong>You can't defend the order.</strong> "Why is X before Y?" has no answer beyond "someone asked," which invites endless renegotiation.</li>
          <li><strong>Quiet, high-value work never surfaces.</strong> The improvements nobody is lobbying for, the ones that would move a real metric, stay buried.</li>
        </ul>
        <p>The fix isn't ignoring stakeholders. It's having a consistent, explicit way to compare what they ask for, so the decision rests on something other than volume.</p>
      `,
      checks: [
        {
          question: "What does reactive, \"loudest voice\" prioritization actually optimize for?",
          options: [
            "The value delivered to users",
            "How well a request was advocated for, which is largely unrelated to its value",
            "The lowest-effort items"
          ],
          correct: 1,
          explanation: "When order reflects advocacy, the best-connected requester wins. That's a filter on persuasion, not on impact."
        },
        {
          question: "Why is \"you can't defend the order\" a real cost, not just an inconvenience?",
          options: [
            "It looks unprofessional in reviews",
            "An order with no rationale invites endless renegotiation: every stakeholder can re-litigate their item because there's no principle to point to",
            "It slows down the standup"
          ],
          correct: 1,
          explanation: "A defensible order ends the argument. An indefensible one means prioritization is permanently up for grabs by whoever pushes next."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: A Value-vs-Effort View",
      figures: {
        "matrix": {
          "type": "quadrant",
          "title": "A value-vs-effort view",
          "x": "Effort",
          "y": "Value",
          "quads": [
            {
              "label": "Quick wins",
              "text": "Do these first",
              "tone": "teal"
            },
            {
              "label": "Big bets",
              "text": "Plan them carefully",
              "tone": "violet"
            },
            {
              "label": "Fill-ins",
              "text": "If there's time",
              "tone": "sand"
            },
            {
              "label": "Money pits",
              "text": "Avoid",
              "tone": "coral"
            }
          ],
          "points": [
            {
              "label": "Inline validation",
              "x": 0.14,
              "y": 0.68
            },
            {
              "label": "CSV export",
              "x": 0.3,
              "y": 0.57
            },
            {
              "label": "SSO + audit log",
              "x": 0.66,
              "y": 0.64
            },
            {
              "label": "Theme picker",
              "x": 0.16,
              "y": 0.12
            },
            {
              "label": "Rebuild legacy report",
              "x": 0.56,
              "y": 0.1
            }
          ]
        }
      },
      body: `
        <p>The simplest tool for making the comparison explicit is a <strong>value-versus-effort</strong> view: for each candidate, estimate how much value it creates and how much effort it takes, then plot it.</p>
        <div data-fig="matrix"></div>
        <p>Four rough zones fall out of it: <strong>quick wins</strong> (high value, low effort: do these now), <strong>big bets</strong> (high value, high effort: plan them deliberately), <strong>fill-ins</strong> (low value, low effort: only when there's slack), and <strong>money pits</strong> (low value, high effort: decline these). Plotting a handful of real candidates, as above, makes the trades visible: "rebuild legacy report" and "SSO" cost about the same, but only one is worth it. The plot doesn't decide for you, but it forces the two questions that matter onto the table.</p>
      `,
      checks: [
        {
          question: "In a value-vs-effort view, what should you do with a \"money pit\" (low value, high effort)?",
          options: [
            "Schedule it for next quarter",
            "Decline it. It's the worst trade of value for effort on the board",
            "Break it into smaller pieces and do it gradually"
          ],
          correct: 1,
          explanation: "Low value at high cost is exactly the item to say no to. Recognizing it explicitly is half the point of plotting."
        },
        {
          question: "What does the value-vs-effort plot actually do for you?",
          options: [
            "It produces the final backlog order automatically",
            "It forces the two questions that matter (how much value, how much effort) onto the table for every candidate, instead of letting advocacy decide",
            "It removes the need to talk to stakeholders"
          ],
          correct: 1,
          explanation: "The plot is a thinking aid, not an oracle. Its value is making the comparison explicit and consistent."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Score, Don't Argue",
      figures: {
        "score": {
          "type": "equation",
          "title": "Score, don't argue",
          "foot": "Low confidence drags the score down, which is the point.",
          "ops": [
            "÷",
            "="
          ],
          "parts": [
            {
              "title": "Impact + Reach + Confidence",
              "text": "Each rated 1 to 3",
              "tone": "teal"
            },
            {
              "title": "Effort",
              "text": "Rated 1 to 3",
              "tone": "coral"
            },
            {
              "title": "Score",
              "text": "Higher goes first",
              "tone": "navy"
            }
          ]
        }
      },
      body: `
        <p>\"Value\" and \"effort\" are still fuzzy. A lightweight <strong>scoring rubric</strong> breaks them into a few factors you rate quickly, so two people comparing the same item land in roughly the same place.</p>
        <div data-fig="score"></div>
        <p>Try it yourself below. Slide confidence down and watch what happens to the score.</p>
      `,
      calculator: {
        title: "ICE score calculator",
        inputs: [
          { key: "impact", label: "Impact", min: 1, max: 3, step: 1, default: 2 },
          { key: "reach", label: "Reach", min: 1, max: 3, step: 1, default: 2 },
          { key: "confidence", label: "Confidence", min: 1, max: 3, step: 1, default: 2 },
          { key: "effort", label: "Effort", min: 1, max: 3, step: 1, default: 2 }
        ],
        compute: (v) => (v.impact + v.reach + v.confidence) / v.effort,
        resultLabel: "Score",
        format: (n) => n.toFixed(2),
        note: "(Impact + Reach + Confidence) ÷ Effort. Drop confidence to 1 and watch the score fall. That's the discount doing its job."
      },
      steps: [
        { title: "Impact", detail: "If this works, how much does it move the thing we care about: a lot, some, or a little? Rate it 1 to 3." },
        { title: "Reach", detail: "How many users does it affect: most of them, a segment, or a handful? Rate it 1 to 3." },
        { title: "Confidence", detail: "How sure are we about the impact and reach estimates: high, medium, or low? Rate it 1 to 3. Low confidence pulls the score down, which is correct: an uncertain bet should be smaller." },
        { title: "Effort", detail: "Rough size: small, medium, or large. Rate it 1 to 3, and divide the combined impact/reach/confidence by this." },
        { title: "Rank by the number, then sanity-check", detail: "Sort by score. Then look at the top and bottom and ask \"does this feel wrong?\" If it does, usually one of your inputs was off. Fix the input, not the ranking." }
      ],
      checks: [
        {
          question: "Why does low confidence pull an item's score down in this rubric?",
          options: [
            "To punish the person who proposed it",
            "An uncertain bet should be smaller or later. Discounting for confidence keeps you from committing heavily to a guess",
            "Confidence has no effect on value"
          ],
          correct: 1,
          explanation: "Confidence is a real input. A high-impact idea you're unsure about is worth less right now than a solid medium-impact one."
        },
        {
          question: "You sort by score and the result \"feels wrong.\" What does the lesson say to do?",
          options: [
            "Override the score with your gut",
            "Look for the input that was off (usually a bad impact, reach, or confidence estimate) and fix that, rather than fixing the ranking directly",
            "Re-run the scoring with different factors"
          ],
          correct: 1,
          explanation: "The gut check is a signal that a number is wrong upstream. Correcting the input keeps the method honest; overriding the output quietly abandons it."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Non-Negotiables Come First",
      body: `
        <p>A scoring rubric is for the things you have a genuine choice about. Some work isn't a choice, and trying to score it just produces a weird-looking ranking.</p>
        <p><strong>Non-negotiables go straight to the top, unscored:</strong> regulatory or legal requirements, security fixes, contractual commitments, anything where <em>not</em> doing it carries a severe, non-linear cost. You're not comparing these on value-vs-effort, because the downside of skipping them isn't measured in lost value. It's measured in fines, breaches, or broken contracts.</p>
        <p>Everything <em>after</em> the non-negotiables is where the rubric earns its keep. The two-tier structure (mandatory first, then ranked by score) is most of what a working prioritization process needs at this level.</p>
      `,
      checks: [
        {
          question: "A regulator publishes a new data-retention rule with a hard compliance deadline in 90 days. Where does that work go in the two-tier structure, and do you score it?",
          options: [
            "Score it like anything else; if it ranks high, it gets done in time",
            "Straight to the top, unscored. The downside of missing the deadline is fines, not lost value, so the rubric doesn't apply",
            "Leave it in the backlog until closer to the deadline so it doesn't crowd out value work"
          ],
          correct: 1,
          explanation: "The rubric compares discretionary value. Non-negotiables carry a severe, non-linear downside that the rubric isn't built to represent, so they go on top by category."
        },
        {
          question: "What's the two-tier structure this lesson describes?",
          options: [
            "High-priority and low-priority buckets",
            "Non-negotiables first (unscored), then everything else ranked by the scoring rubric",
            "Stakeholder requests first, then internal ideas"
          ],
          correct: 1,
          explanation: "Mandatory work on top by category; discretionary work below it ordered by score. That structure covers most prioritization needs at this level."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Saying No With a Reason",
      body: `
        <p>The point of all this structure isn't the ranking. It's the ability to say <strong>no</strong> without damaging the relationship.</p>
        <p>Reactive prioritization makes every "no" feel personal, because there's no principle behind it, just "we're not doing yours." A scored, defensible order changes the conversation: "here's where your request landed: it scored lower on impact and reach than the items ahead of it, and here's what would move it up." The requester may not love it, but they can see it wasn't arbitrary.</p>
        <p>Put the course together: recognize reactive prioritization, make the comparison explicit with value-vs-effort, score with a simple rubric, put non-negotiables on top, and let the framework carry your "no." That's the shift from "whoever asked loudest" to a process you can stand behind.</p>
      `,
      checks: [
        {
          question: "How does a scored, defensible order change a \"no\" to a stakeholder?",
          options: [
            "It makes the no final and non-negotiable",
            "It moves the conversation from \"we're not doing yours\" to \"here's where it ranked and why, and here's what would move it up.\" It's visibly not arbitrary",
            "It lets you avoid saying no directly"
          ],
          correct: 1,
          explanation: "The framework gives the no a reason the requester can inspect. That's what keeps the relationship intact even when the answer is unwelcome."
        },
        {
          label: "Bringing it together",
          question: "A senior stakeholder pushes hard for their feature to jump the queue. Based on this course, what's the strongest response?",
          options: [
            "Move it up. Senior stakeholders' requests should carry more weight",
            "Score it against the same rubric as everything else, show where it lands and why, and name what would raise its score, so the decision rests on the criteria, not the seniority",
            "Refuse to discuss the order at all"
          ],
          correct: 1,
          explanation: "The whole course is about replacing advocacy with a consistent, explicit method. Applying it evenly, even to a senior push, is what makes it hold."
        }
      ],
      reflection: {
        prompt: "Take the last five things your team worked on. For each, why was it prioritized: a score, a metric, or someone asking? If it's mostly the third, pick one upcoming decision and run it through impact / reach / confidence / effort instead."
      }
    }
  ]
};
