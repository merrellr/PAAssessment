/* ================================================================
   COURSE CONTENT: Prioritization & Trade-offs, Lots of Experience
   Source article: "The Feature Fallacy: Why Shipping More Isn't
   Helping Your Users (and What To Do Instead)" (Robert Merrell,
   LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["prioritization-experienced"] = {
  sourceUrl: "https://www.linkedin.com/pulse/feature-fallacy-why-shipping-more-isnt-helping-your-do-merrell-mism-ozcbc",
  recap: [
    "Shipping volume is a misleading scoreboard; optimize for value density — outcome created divided by effort required.",
    "Run the OEM loop: define the outcome in observable terms, back it with a falsifiable hypothesis, ship the minimally sufficient intervention.",
    "Replace roadmaps with bet maps — belief, confidence, leading indicators, and kill criteria written in advance.",
    "Five quarterly moves: segment before you scale, default to workflow not widgets, measure the path not the page, design for reversibility, run a weekly Outcomes Review.",
    "Work the denominator too — a quarterly decommission list; removing friction on the existing path often beats adding capability."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: The Feature Fallacy",
      preCheck: {
        label: "Before you read on — predict",
        question: "Two teams ship for a year. Team A ships 40 features; Team B ships 9. Which is more likely to have grown the business?",
        options: [
          "Team A — more features means more value delivered",
          "Team B — fewer, but each on the shortest path to a real outcome",
          "It's impossible to say anything from shipping counts"
        ],
        correct: 1,
        explanation: "Hold that thought. The lesson below is about why raw shipping volume is a misleading scoreboard."
      },
      body: `
        <p>If you measure progress by how many features ship, you'll eventually ship yourself into irrelevance. The teams that win aren't the ones with the longest release notes, they're the ones with the shortest path to a meaningful outcome.</p>
        <p>This isn't anti-shipping. It's pro <strong>value density</strong>: the ratio of outcome created to effort required. When value density goes up, adoption, retention, and trust follow. When it goes down, your backlog grows faster than your business.</p>
        <p>Every feature you add quietly charges three taxes:</p>
        <ul>
          <li><strong>Context-switch tax.</strong> Every new feature branches the mental model, for users and for teams. Users pay with cognitive load; teams pay with QA, docs, analytics events, and support scripts.</li>
          <li><strong>Adoption tax.</strong> Features don't adopt themselves. They need activation points, enablement, and discoverability. Shipping without an adoption path is just inventory.</li>
          <li><strong>Quality tax.</strong> More surface area means more edge cases. In regulated spaces the quality debt compounds with safety and compliance risk. It's quiet, until it isn't.</li>
        </ul>
        <p>Back to Team A and Team B from the prediction above. Drag the slider to see why the team shipping less can still be pulling ahead.</p>
      `,
      chart: {
        unit: "Quarter",
        maxX: 4,
        series: [
          { label: "Team A — features shipped", color: "#9AA3AD", at: (q) => q * 10 },
          { label: "Team B — outcome moved", color: "#1A4584", at: (q) => Math.round(q * q * 3.2) }
        ],
        caption: "Illustrative — value density compounds even when shipped count stays modest"
      },
      checks: [
        {
          question: "What does \"value density\" mean in this lesson?",
          options: [
            "The number of features shipped per quarter",
            "The ratio of outcome created to effort required",
            "How densely packed the UI is with functionality"
          ],
          correct: 1,
          explanation: "Value density is outcome ÷ effort. Prioritizing for it is what keeps adoption, retention, and trust moving instead of just the backlog."
        },
        {
          question: "A team ships a feature and moves on without an activation path, enablement, or discoverability work. Which \"tax\" are they ignoring?",
          options: [
            "The context-switch tax",
            "The adoption tax",
            "The quality tax"
          ],
          correct: 1,
          explanation: "\"Shipping without an adoption path is just inventory.\" Features don't adopt themselves, and the work to make them land is real, budgeted work."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Outcome → Evidence → Minimum",
      body: `
        <p>Here's a simple loop that travels well across domains. Think <strong>OEM</strong>.</p>
        <svg viewBox="0 0 400 172" style="width:100%; height:auto; margin:4px 0 2px;">
          <defs>
            <marker id="oemArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <rect x="14" y="60" width="104" height="52" rx="10" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.5"/>
          <text x="66" y="82" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="12" font-weight="700" fill="#12305e">Outcome</text>
          <text x="66" y="99" text-anchor="middle" font-family="sans-serif" font-size="9.5" fill="#4B5768">observable end state</text>
          <rect x="148" y="60" width="104" height="52" rx="10" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.5"/>
          <text x="200" y="82" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="12" font-weight="700" fill="#12305e">Evidence</text>
          <text x="200" y="99" text-anchor="middle" font-family="sans-serif" font-size="9.5" fill="#4B5768">falsifiable hypothesis</text>
          <rect x="282" y="60" width="104" height="52" rx="10" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.5"/>
          <text x="334" y="82" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="12" font-weight="700" fill="#12305e">Minimum</text>
          <text x="334" y="99" text-anchor="middle" font-family="sans-serif" font-size="9.5" fill="#4B5768">smallest intervention</text>
          <line x1="120" y1="86" x2="146" y2="86" stroke="#9AA3AD" stroke-width="1.6" marker-end="url(#oemArrow)"/>
          <line x1="254" y1="86" x2="280" y2="86" stroke="#9AA3AD" stroke-width="1.6" marker-end="url(#oemArrow)"/>
          <path d="M334 116 C334 150, 66 150, 66 116" fill="none" stroke="#9AA3AD" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#oemArrow)"/>
          <text x="200" y="147" text-anchor="middle" font-family="sans-serif" font-size="9.5" fill="#9AA3AD">measure the path, then scale or kill</text>
        </svg>
        <p><strong>Outcome-first.</strong> Define the end state in observable terms: "reduce median prescription time from 4:30 to 2:00." Not "improve the orders experience."</p>
        <p><strong>Evidence-backed.</strong> Tie the bet to a falsifiable hypothesis and a minimum viable measurement plan. If nothing could prove you wrong, it's not a bet, it's a wish.</p>
        <p><strong>Minimally sufficient.</strong> Ship the smallest intervention that can move the outcome for a narrow segment. Then scale.</p>
      `,
      checks: [
        {
          question: "Which of these is an \"outcome-first\" statement in the sense this lesson means?",
          options: [
            "\"Redesign the orders screen with templates and bulk actions\"",
            "\"Raise orders completion from 38% to 70% and cut median time from 3:10 to 1:45\"",
            "\"Make the orders flow feel more modern and intuitive\""
          ],
          correct: 1,
          explanation: "An outcome is stated in observable, measurable terms. The other two describe a solution or a vibe, neither of which tells you whether you succeeded."
        },
        {
          question: "What makes a bet \"evidence-backed\" here?",
          options: [
            "A senior leader has signed off on it",
            "It's tied to a falsifiable hypothesis and a plan to measure whether it moved the outcome",
            "Several similar companies have shipped something like it"
          ],
          correct: 1,
          explanation: "Falsifiable is the key word: you've said in advance what result would tell you the bet failed, and you've set up the measurement to see it."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: From Roadmaps to Bet Maps",
      body: `
        <p>A roadmap says "we will build these things." A <strong>bet map</strong> says "we believe doing X for Y segment will drive Z outcome," and then holds itself accountable.</p>
        <p>Each entry on a bet map carries four things a feature list never does:</p>
        <ul>
          <li><strong>A confidence level.</strong> How sure are we, and why? Low confidence isn't a reason not to bet, it's a reason to keep the bet small.</li>
          <li><strong>Leading indicators.</strong> What will move first if this is working, well before the outcome metric does?</li>
          <li><strong>Kill criteria.</strong> Written in advance: "if we don't see the leading indicator move by X after Y weeks, we stop." Decided before you're emotionally invested.</li>
          <li><strong>A review cadence.</strong> Monthly. Kill or double down based on signal, not on who argues hardest in the room.</li>
        </ul>
        <svg viewBox="0 0 400 158" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="388" height="146" rx="8" fill="#F7FAFD" stroke="#1A4584" stroke-width="1.3"/>
          <path d="M14 6 h372 a8 8 0 0 1 8 8 v12 h-388 v-12 a8 8 0 0 1 8 -8 z" fill="#EEF3FA"/>
          <text x="16" y="23" font-family="'Space Grotesk',sans-serif" font-size="8.5" font-weight="700" fill="#12305e">Bet: auto-attach patient context for charge nurses at shift change</text>
          <g font-family="sans-serif" font-size="8" fill="#16213E">
            <text x="16" y="48" font-weight="700" fill="#12305e">Belief</text>
            <text x="96" y="48">cuts median Orders time 3:10 &#8594; 1:45</text>
            <text x="16" y="70" font-weight="700" fill="#12305e">Confidence</text>
            <text x="96" y="70">Medium &#8212; replay data is clear, sample is small</text>
            <text x="16" y="92" font-weight="700" fill="#12305e">Leading indicator</text>
            <text x="132" y="92">step-3 (code search) drop-off rate</text>
            <text x="16" y="114" font-weight="700" fill="#C0622A">Kill criteria</text>
            <text x="112" y="114" fill="#7a3d18">drop-off not down 10 pts in 3 weeks &#8594; stop</text>
            <text x="16" y="136" font-weight="700" fill="#12305e">Review</text>
            <text x="96" y="136">monthly &#8212; kill or double down on the signal</text>
          </g>
        </svg>
        <p>The point of writing kill criteria before you start is that you can't negotiate with a number you set when you were still objective.</p>
      `,
      checks: [
        {
          question: "Why does a bet map insist on writing kill criteria before the work starts?",
          options: [
            "To create a paper trail for leadership",
            "Because once the team is invested, it's very hard to set an honest bar for walking away — so you set it while you're still objective",
            "Because kill criteria are required by most planning tools"
          ],
          correct: 1,
          explanation: "Sunk cost is the enemy. A number you committed to up front is much harder to rationalize away than one you're asked to invent after months of effort."
        },
        {
          question: "What's the role of a leading indicator on a bet map?",
          options: [
            "It's the final measure of whether the bet succeeded",
            "It's an early signal that moves before the outcome metric, so you can tell sooner whether the bet is working",
            "It's a vanity metric included to make reviews look good"
          ],
          correct: 1,
          explanation: "The outcome metric is often slow. A leading indicator gives you a read weeks earlier, which is what makes a monthly kill-or-double-down review possible."
        },
        {
          question: "Three weeks in, the leading indicator hasn't moved and the pre-written kill criteria were met at the last review. The team is confident results are \"about to land.\" What does the bet map say?",
          options: [
            "Extend the timeline — conviction from the people closest to the work is a strong signal",
            "Honor the criteria: stop, or make an explicit, visible re-decision — the number was set precisely so it couldn't be argued away later",
            "Quietly drop the kill criteria and keep the bet running until the next review"
          ],
          correct: 1,
          explanation: "\"You can't negotiate with a number you set when you were still objective.\" Meeting the kill criteria triggers a real decision, not a silent extension."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Five Moves for the Quarter",
      body: `
        <p>Concrete ways to raise value density on a real critical path. Step through them.</p>
      `,
      steps: [
        { title: "Segment before you scale", detail: "Design for one high-value workflow first — \"charge nurse during shift change,\" not \"all clinicians.\" Optimize locally, then generalize. You get cleaner UX and a much clearer causal signal about what actually worked." },
        { title: "Default to workflow, not widgets", detail: "Ask \"what steps disappear?\" not \"what screens can we add?\" Inline actions, automation hooks, and smart defaults usually beat net-new features on value density." },
        { title: "Measure the path, not the page", detail: "Instrument end to end: start rate, completion rate, time-to-complete, drop-offs. Report \"time-to-outcome\" the way you report uptime. The latency that matters is the user's time-to-value." },
        { title: "Design for reversibility", detail: "Feature flags, shadow modes, opt-in cohorts. Make wrong bets cheap and reversible; make irreversible bets rare and deliberate." },
        { title: "Run a weekly Outcomes Review", detail: "One standing ritual with Engineering. What did we learn this week? What can we ship next week to learn faster? Product owns problem definition and kill criteria; Engineering owns collapsing time-to-learning." }
      ],
      checks: [
        {
          question: "\"Default to workflow, not widgets\" is mainly a prompt to ask which question?",
          options: [
            "\"What screens or controls can we add to cover this need?\"",
            "\"What steps can we remove, automate, or pre-fill so the user does less?\"",
            "\"Which competitor features are we missing?\""
          ],
          correct: 1,
          explanation: "Removing steps tends to beat adding surface area on value density. Inline actions, automation, and smart defaults do more with less."
        },
        {
          question: "Why optimize a single narrow segment before generalizing?",
          options: [
            "It's the only way to keep the project small enough to staff",
            "You get cleaner UX and a clearer causal signal — you can actually tell what moved the outcome — then you extend from evidence",
            "Narrow segments are the only ones worth serving"
          ],
          correct: 1,
          explanation: "A narrow workflow gives you a clean read on cause and effect. Scale the pattern once you know it works, not before."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: The Courage to Delete",
      body: `
        <p>Value density has a numerator and a denominator. Everything so far has been about the numerator, the outcome. Deletion is how you work the denominator.</p>
        <p>Create a quarterly <strong>decommission list</strong>. Remove underused features, consolidate patterns, redesign flows that require explanation. Celebrate deletion with the same fanfare as launches, because a flow that no longer needs a support script is a real win.</p>
        <p>A quick example, healthcare but universal. Clinicians were abandoning an Orders flow at 38% completion. The instinct was to build "Orders 2.0" with templates and bulk actions.</p>
        <p>The OEM approach instead:</p>
        <ul>
          <li><strong>Outcome:</strong> raise completion to 70%, cut median time from 3:10 to 1:45.</li>
          <li><strong>Evidence:</strong> session replays and path analysis showed friction on patient-context switching and code search.</li>
          <li><strong>Minimum:</strong> auto-attach patient context, pre-populate three likely order codes by unit and shift, add keyboard-first quick search.</li>
        </ul>
        <p>Result after six weeks: 74% completion, 1:41 median time, and zero net-new "features." Massive value density.</p>
      `,
      checks: [
        {
          question: "The Orders example moved completion from 38% to 74% with \"zero net-new features.\" What does that illustrate about prioritization?",
          options: [
            "Rebuilds are usually the fastest path to a better number",
            "The highest-value move is often removing friction on the existing path, not adding capability — and it's found by looking at evidence, not by guessing at a redesign",
            "Completion rate is a vanity metric that shouldn't drive decisions"
          ],
          correct: 1,
          explanation: "The team defined the outcome, looked at where users actually struggled, and shipped the smallest set of changes that addressed it. No \"Orders 2.0\" required."
        },
        {
          label: "Bringing it together",
          question: "You inherit a backlog of 30 requested features and a flat retention curve. Using this course, what's the strongest first move?",
          options: [
            "Rank all 30 by estimated effort and start with the quick wins",
            "Pick one critical path, define its outcome in observable terms, gather minimal evidence on where it breaks, ship the smallest intervention, measure the path — and add a decommission candidate while you're in there",
            "Ship the top 10 by stakeholder request count to build goodwill, then reassess"
          ],
          correct: 1,
          explanation: "That's OEM applied to a real path, plus working the denominator. Effort-ranking and request-counting both optimize for shipping volume, which is the fallacy this course is about."
        }
      ],
      reflection: {
        prompt: "Pick one critical path in your product. Write its outcome as an observable before/after number, name the one leading indicator you'd watch, and name one feature or flow you'd put on a decommission list this quarter."
      }
    }
  ]
};
