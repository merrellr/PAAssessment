/* ================================================================
   COURSE CONTENT: Prioritization & Trade-offs, Moderate Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 8 Sections 2-4 ("Identifying Key Metrics", "Analyzing Data
   to Inform Decisions", "Measuring the Success of Product
   Initiatives") and Chapter 5 Section 3 ("Aligning User Feedback and
   Market Insights").
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["prioritization-moderate"] = {
  sourceUrl: "",
  recap: [
    "A value-vs-effort framework slips because the inputs are soft — 'value' is a guess that shifts with the room.",
    "Ground 'value' in a named metric and a rough size of the change, so it can be debated with evidence instead of vibes.",
    "Validate the big estimates cheaply — an A/B test or small pilot — before committing high effort, and check the demand shows up beyond one loud segment.",
    "Apply the same rubric the same way every time, on a cadence, with the criteria and their definitions written down.",
    "Close the loop — compare the result to the baseline you predicted; a consistent miss is a bias to calibrate out next round."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Why the Framework Slips",
      preCheck: {
        label: "Before you read on — predict",
        question: "You have a value-vs-effort framework, but you apply it inconsistently and the results feel arbitrary. What's usually the real problem?",
        options: [
          "The framework itself is flawed and needs replacing",
          "The inputs — especially \"value\" — are guesses that shift with who's in the room, so the same item scores differently each time",
          "You're not using enough factors in the score"
        ],
        correct: 1,
        explanation: "See whether the lesson agrees. The framework is rarely the issue."
      },
      body: `
        <p>At this level you already have a prioritization framework, a value-vs-effort view, maybe a scoring rubric. The problem is it doesn't hold up: the same feature scores "high value" in one meeting and "medium" in the next, and the rankings feel like they could have gone either way.</p>
        <p>The framework isn't broken. The <strong>inputs</strong> are soft. "Value" is being estimated by feel, so it moves with the mood of the room, the last customer call, who's advocating. A framework built on gut-feel inputs produces gut-feel outputs with a spreadsheet wrapped around them.</p>
        <p>Making it consistent means grounding the inputs, especially "value", in something that doesn't change between Tuesday and Thursday: <strong>data</strong>.</p>
      `,
      checks: [
        {
          question: "According to this lesson, why does a value-vs-effort framework produce inconsistent rankings?",
          options: [
            "It's the wrong framework for most teams",
            "The \"value\" input is estimated by feel, so it shifts with the room — and soft inputs produce soft outputs",
            "The effort estimates from engineering are unreliable"
          ],
          correct: 1,
          explanation: "\"A framework built on gut-feel inputs produces gut-feel outputs with a spreadsheet wrapped around them.\" The fix is grounding the inputs, not changing the framework."
        },
        {
          question: "What's the proposed way to make the framework consistent?",
          options: [
            "Add more scoring factors so small errors average out",
            "Ground the inputs — especially \"value\" — in data, so the same item gets the same estimate regardless of who's in the room",
            "Have a more senior person make the final call"
          ],
          correct: 1,
          explanation: "Consistency comes from stable inputs. Data-backed value estimates don't drift with the mood of a meeting the way felt estimates do."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Put Numbers Behind \"Value\"",
      body: `
        <p>To ground the value estimate, tie every candidate to a <strong>specific metric it should move</strong> and a rough size of that movement.</p>
        <ul>
          <li>Not "this improves onboarding" but "this should raise onboarding completion from 58% to ~68%."</li>
          <li>Not "this helps power users" but "this should lift the retention of the accounts using feature X, currently ~1,200 accounts."</li>
          <li>Not "this reduces support load" but "this should cut tickets in category Y, currently ~200/month, by roughly a third."</li>
        </ul>
        <p>Now "value" is an estimated effect on a named number, which two people can debate with evidence instead of vibes. The candidates worth doing are usually the ones where you can name the metric <em>and</em> the mechanism by which the change moves it. If you can't name either, that's a signal the value is imagined.</p>
      `,
      checks: [
        {
          question: "What does it mean to \"put numbers behind value\" here?",
          options: [
            "Assign each item a value score from 1 to 10",
            "Tie each candidate to a specific metric it should move and a rough estimate of how much",
            "Calculate the exact revenue each feature will generate"
          ],
          correct: 1,
          explanation: "Value becomes \"estimated effect on a named metric.\" That's something you can argue about with evidence, unlike a felt 1-to-10 score."
        },
        {
          question: "You can't name a metric a candidate would move, or the mechanism by which it would. What does the lesson say that indicates?",
          options: [
            "The metric tracking isn't set up yet",
            "The value may be imagined — an inability to name the number or the mechanism is a signal the case is weak",
            "It should still be prioritized on the strength of the idea"
          ],
          correct: 1,
          explanation: "If you can't say what improves and how, \"high value\" is an assertion. Being able to name both is a basic quality bar for the value estimate."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Validate the Estimate",
      body: `
        <p>A metric-backed value estimate is still an estimate. Before committing heavily to a high-effort item, check the guess cheaply.</p>
        <svg viewBox="0 0 400 120" style="width:100%; height:auto; margin:4px 0 2px;">
          <defs>
            <marker id="prArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <rect x="14" y="46" width="96" height="34" rx="9" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.3"/>
          <text x="62" y="60" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">estimate</text>
          <text x="62" y="73" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#4B5768">metric + size</text>
          <rect x="152" y="46" width="96" height="34" rx="9" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.3"/>
          <text x="200" y="60" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">cheap test</text>
          <text x="200" y="73" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#4B5768">A/B, prototype, pilot</text>
          <rect x="290" y="26" width="96" height="30" rx="9" fill="#EEF9F1" stroke="#2E8B57" stroke-width="1.3"/>
          <text x="338" y="45" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">commit</text>
          <rect x="290" y="70" width="96" height="30" rx="9" fill="#FCEFE9" stroke="#C0622A" stroke-width="1.3"/>
          <text x="338" y="89" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#12305e">drop / rethink</text>
          <line x1="110" y1="63" x2="150" y2="63" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#prArrow)"/>
          <line x1="248" y1="58" x2="288" y2="43" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#prArrow)"/>
          <line x1="248" y1="68" x2="288" y2="83" stroke="#9AA3AD" stroke-width="1.5" marker-end="url(#prArrow)"/>
        </svg>
        <p>A controlled <strong>A/B test</strong>, a prototype in front of a few users, or a small pilot tells you whether the metric actually moves in the direction and roughly the size you predicted. If it does, commit with confidence. If it doesn't, you've spent a little to avoid a large mistake. Also cross-check the value against market signal, if the feedback driving it is one loud segment and no broader trend, the value estimate may be local.</p>
      `,
      checks: [
        {
          question: "Why validate a value estimate with a cheap test before committing to a high-effort item?",
          options: [
            "To generate data for the quarterly report",
            "A small test confirms whether the metric moves as predicted; if it doesn't, you've spent a little to avoid a large mistake",
            "Because A/B tests are required before any release"
          ],
          correct: 1,
          explanation: "The test is calibration insurance. It's the difference between finding out your estimate was wrong for the price of a prototype versus the price of a full build."
        },
        {
          question: "The feedback behind a high-value candidate comes from one vocal customer segment with no broader market trend. What does the lesson suggest?",
          options: [
            "That's enough signal — vocal customers represent the market",
            "The value estimate may be local — cross-check against market data before treating it as a broad win",
            "Ignore it entirely; single-segment feedback is worthless"
          ],
          correct: 1,
          explanation: "Not all feedback reflects a market need. Validating the estimate includes checking whether the demand shows up beyond one loud segment."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Same Rubric, Every Time",
      body: `
        <p>The last source of inconsistency is applying the method differently from one decision to the next, different factors, different weightings, different people's interpretation of "impact." Fixing that is about discipline, not sophistication.</p>
      `,
      steps: [
        { title: "Write down the criteria and what each means", detail: "One page: the factors you score on, and a sentence defining each (\"impact = estimated effect on the item's named metric\"). Shared definitions are what stop two people scoring the same thing differently." },
        { title: "Score every candidate the same way", detail: "Same factors, same scale, same evidence bar — for the small requests and the big bets alike. Exceptions are where consistency leaks out." },
        { title: "Run prioritization on a set cadence", detail: "A regular session — monthly, or per planning cycle — where the whole set is re-scored with current data, rather than items being slotted in ad hoc between sessions." },
        { title: "Keep the scores visible", detail: "A shared board with each item's score and the metric behind it. When the inputs are in the open, a bad estimate gets challenged early instead of silently skewing the order." }
      ],
      checks: [
        {
          question: "Why write down a one-page definition of each scoring criterion?",
          options: [
            "For onboarding documentation",
            "Shared definitions stop two people scoring the same item differently — that ambiguity is a main source of inconsistency",
            "To make the framework look more rigorous"
          ],
          correct: 1,
          explanation: "\"Impact\" means different things to different people until you pin it down. A written definition is what makes scores comparable across people and time."
        },
        {
          question: "What's the risk of slotting items into the backlog ad hoc between prioritization sessions?",
          options: [
            "It makes the backlog too long",
            "Ad-hoc additions bypass the consistent scoring, so the order quietly drifts back toward whoever asked most recently",
            "Nothing, as long as they're scored eventually"
          ],
          correct: 1,
          explanation: "A set cadence where everything is re-scored with current data is what keeps the reactive pattern from creeping back in through the side door."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Close the Loop",
      body: `
        <p>The thing that makes a prioritization framework <em>trustworthy</em> over time is checking whether it was right.</p>
        <p>After a prioritized item ships, compare the result against the value estimate you made: did onboarding completion actually go from 58% to 68%, or did it barely move? Compare to the baseline you recorded before, not to a vague memory.</p>
        <p>A wrong estimate isn't a failure, it's <strong>calibration data</strong>. If your team consistently overestimates the value of UI polish and underestimates the value of reliability work, that's a bias you can correct in the next round of scoring. Over a few cycles, a framework with a feedback loop gets noticeably better at predicting value, which is exactly what makes people stop second-guessing it.</p>
        <p>Put the course together: ground "value" in a named metric, validate the estimate cheaply, apply the same rubric every time on a cadence, and check the outcomes to calibrate. That's the difference between having a framework and having one that actually holds.</p>
      `,
      checks: [
        {
          question: "How should you treat a value estimate that turned out to be badly wrong after the item shipped?",
          options: [
            "As a failure to account for in the retrospective",
            "As calibration data — a signal about a systematic bias in your estimates that you can correct next round",
            "As a reason to stop making estimates"
          ],
          correct: 1,
          explanation: "Individual misses are expected. The pattern in the misses — always over on X, always under on Y — is what you use to make the next round of scoring more accurate."
        },
        {
          label: "Bringing it together",
          question: "Your team has a value-vs-effort framework but people keep re-arguing the rankings. Based on this course, what's the highest-leverage fix?",
          options: [
            "Replace it with a more advanced framework like weighted shortest job first",
            "Ground each item's value in a named metric with a size estimate, validate the big ones with cheap tests, score everything the same way on a cadence, and check outcomes against the baseline to calibrate",
            "Give the PM final say so the arguments stop"
          ],
          correct: 1,
          explanation: "The framework isn't the problem — the soft inputs and inconsistent application are. Grounding, validating, standardizing, and calibrating is what stops the re-arguing."
        }
      ],
      reflection: {
        prompt: "Pick one item you prioritized and shipped in the last quarter. What metric did you expect it to move, and by how much? Do you know the actual number — and if not, what would it take to check?"
      }
    }
  ]
};
