/* ================================================================
   COURSE CONTENT: AI Fluency — Organizational, Advanced Experience
   Source article: "The New Competitive Edge: How AI Supercharges the
   Human Factor for Lifelong Customers" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["aiOrg-advanced"] = {
  sourceUrl: "https://www.linkedin.com/pulse/beyond-automation-win-customers-life-robert-merrell-bxltc",
  recap: [
    "Where you point mature AI capability — out of the customer relationship or into freeing people for it — is a strategic choice, not a tooling one.",
    "Be honest about the division of labor: AI handles the 'what' (24/7, personalization, summarizing); people deliver the 'how' (empathy, judgment, rapport).",
    "Engineer the quick win — AI spots the moment, a person delivers the outreach or the escalation.",
    "Going the extra mile: clearing volume off the team buys the time to genuinely understand a customer's world — loyalty a competitor can't easily break.",
    "AI's direction is set by strategy — make the human-plus-AI operating model explicit and consistent across teams."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Beyond Automation",
      preCheck: {
        label: "Before you read on — predict",
        question: "An organization with mature AI capability is deciding where to point it next. Which use is more likely to build durable competitive advantage?",
        options: [
          "Automating as many customer interactions end to end as possible",
          "Using AI to clear volume so people have time for the high-empathy, high-judgment moments",
          "Both are equivalent — it's just a cost decision"
        ],
        correct: 1,
        explanation: "Keep that in mind. This lesson is about what the race to automate quietly gives away."
      },
      body: `
        <p>The business world is buzzing about AI as the ultimate driver of efficiency, personalization, and growth. That's true, and many organizations are still missing the point. In the race to automate, they risk sacrificing the one thing that builds lasting loyalty: the human factor.</p>
        <p>Technology on its own is cold. It can be efficient without being empathetic, and personal without being personable. The real edge shows up when AI isn't a replacement but an <strong>amplifier</strong> for your team, enabling the small, quick wins that build a customer relationship for life.</p>
        <p>At an advanced level, this is a strategic choice about your operating model, not a tooling decision. Where you point mature AI capability, toward removing humans from the relationship or toward freeing them for the parts of it that matter most, is what separates a cost story from a loyalty story.</p>
      `,
      checks: [
        {
          question: "What's the risk the lesson associates with \"the race to automate\"?",
          options: [
            "Models becoming too expensive to run at scale",
            "Sacrificing the human factor — the empathy and relationship work that actually drives lasting loyalty",
            "Customers noticing that responses are AI-generated"
          ],
          correct: 1,
          explanation: "Efficiency without empathy is the failure mode. The article's frame is AI as amplifier of people, not replacement for them."
        },
        {
          question: "Why does the lesson call this a strategic choice rather than a tooling decision?",
          options: [
            "Because AI tools are expensive and need executive sign-off",
            "Because where you aim mature AI capability — out of the customer relationship or into freeing people for it — determines whether you get a cost story or a loyalty story",
            "Because strategy teams, not product teams, own AI budgets"
          ],
          correct: 1,
          explanation: "Same capability, two very different outcomes depending on intent. That direction-setting is the advanced organizational skill."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: What AI Does Well, What Only People Do",
      body: `
        <p>Blending the two starts with being honest about each one's strengths.</p>
        <svg viewBox="0 0 400 170" style="width:100%; height:auto; margin:4px 0 2px;">
          <rect x="6" y="8" width="188" height="154" rx="10" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.3"/>
          <rect x="206" y="8" width="188" height="154" rx="10" fill="#EEF3FA" stroke="#1A4584" stroke-width="1.3"/>
          <text x="100" y="28" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="11" font-weight="700" fill="#12305e">AI handles the "what"</text>
          <text x="300" y="28" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="11" font-weight="700" fill="#12305e">People deliver the "how"</text>
          <g font-family="sans-serif" font-size="9.5" fill="#4B5768">
            <text x="18" y="52">24/7 availability on common issues</text>
            <text x="18" y="74">Data-driven personalization</text>
            <text x="18" y="96">Routing, summarizing history</text>
            <text x="18" y="118">Scaled, instant, consistent</text>
            <text x="18" y="148" fill="#9AA3AD">efficient, not empathetic</text>
          </g>
          <g font-family="sans-serif" font-size="9.5" fill="#4B5768">
            <text x="218" y="52">Empathy for charged moments</text>
            <text x="218" y="74">Creative, off-script problem-solving</text>
            <text x="218" y="96">Bending rules when it's right</text>
            <text x="218" y="118">Building rapport and trust</text>
            <text x="218" y="148" fill="#9AA3AD">turns satisfied into loyal</text>
          </g>
        </svg>
        <p>AI analyzes history and behavior to anticipate needs, automates routine inquiries around the clock, and summarizes long threads so an agent is up to speed in seconds. A person reads between the lines, responds to frustration or delight with genuine care, thinks creatively when a problem falls outside the script, and builds the trust that turns a satisfied customer into an advocate.</p>
      `,
      checks: [
        {
          question: "In the division of labor this lesson describes, AI owns the \"what\" and people own the \"how.\" What does the \"how\" refer to?",
          options: [
            "The technical implementation of the chatbot",
            "The warmth, empathy, and creative problem-solving that build a real relationship",
            "The reporting on service metrics"
          ],
          correct: 1,
          explanation: "AI delivers the answer or the routing; the person delivers the care, judgment, and rapport around it. That's the part that compounds into loyalty."
        },
        {
          question: "Which task belongs on the AI side of the split?",
          options: [
            "Taking personal ownership of an emotionally charged complaint",
            "Summarizing a long conversation history so an agent gets up to speed in seconds",
            "Deciding when to bend a policy to keep a customer"
          ],
          correct: 1,
          explanation: "Summarizing, routing, and 24/7 first response are AI strengths. Ownership of a charged situation and rule-bending judgment stay with people."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Engineering the Quick Win",
      body: `
        <p>The forward-thinking model isn't AI <em>or</em> people, it's <strong>collaborative intelligence</strong>: AI as a co-pilot that identifies the perfect moment for a human to step in and deliver a "quick win" that builds loyalty.</p>
        <p><strong>Proactive, personal outreach.</strong> AI flags an account that keeps failing to use a new feature correctly. Instead of firing off a generic help article, it alerts a specialist, who sends a short personal note: "I noticed you were working with the new dashboard, would a quick five-minute walkthrough help? How about tomorrow at 10?" The customer feels seen, learns the feature, and gets more invested in the product.</p>
        <p><strong>Empathetic escalation.</strong> Sentiment analysis detects a frustrated tone in a chat and hands it to a senior agent with the note "high frustration detected." The agent opens with "I'm sorry you're having a hard time, I've read the history and I'm taking personal ownership of this." A negative moment becomes a trust-building one.</p>
        <svg viewBox="0 0 400 108" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="aoaQw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#9AA3AD"/>
            </marker>
          </defs>
          <g text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="7.5" font-weight="700" fill="#12305e">
            <rect x="6" y="30" width="86" height="32" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="49" y="43">AI watches</text><text x="49" y="53" font-size="7" font-weight="400" fill="#4B5768">usage, sentiment</text>
            <rect x="106" y="30" width="86" height="32" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="149" y="43">Spots the</text><text x="149" y="53">moment</text>
            <rect x="206" y="30" width="86" height="32" rx="5" fill="#E7F7FC" stroke="#35C2E8" stroke-width="1.2"/><text x="249" y="43">Routes to the</text><text x="249" y="53">right person</text>
            <rect x="306" y="30" width="88" height="32" rx="5" fill="#EEF9F1" stroke="#2E8B57" stroke-width="1.2"/><text x="350" y="43">Person delivers</text><text x="350" y="53">the quick win</text>
          </g>
          <g stroke="#9AA3AD" stroke-width="1.2">
            <line x1="92" y1="46" x2="104" y2="46" marker-end="url(#aoaQw)"/>
            <line x1="192" y1="46" x2="204" y2="46" marker-end="url(#aoaQw)"/>
            <line x1="292" y1="46" x2="304" y2="46" marker-end="url(#aoaQw)"/>
          </g>
          <text x="200" y="84" text-anchor="middle" font-family="sans-serif" font-size="7.5" fill="#4B5768">AI does the legwork; the human delivers the part that creates loyalty.</text>
        </svg>
        <p>In both cases the AI does the legwork, watching for the moment. The human delivers the part that creates loyalty.</p>
      `,
      checks: [
        {
          question: "In \"collaborative intelligence,\" what is the AI's specific job in the quick-win examples?",
          options: [
            "To send the personalized outreach message itself",
            "To do the legwork — spot the moment (a failed feature attempt, a frustrated tone) and route it to the right person",
            "To decide whether the customer deserves special treatment"
          ],
          correct: 1,
          explanation: "AI identifies and routes the moment. A person then delivers the outreach or the escalation, which is where the trust is actually built."
        },
        {
          question: "What makes \"empathetic escalation\" a trust-building moment rather than just a faster handoff?",
          options: [
            "The senior agent resolves it more quickly than a junior one would",
            "The customer's frustration is met by a person with authority who has read the history and takes personal ownership",
            "The AI apologizes on the company's behalf before handing off"
          ],
          correct: 1,
          explanation: "Speed helps, but the trust comes from a human acknowledging the experience and owning the outcome. AI created the opening; the person made it count."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Going the Extra Mile",
      body: `
        <p>Beyond quick wins, clearing volume off your team frees the most valuable resource of all: time to genuinely understand a customer's world.</p>
        <p>A customer in a specialized field, say renewable-energy logistics, is struggling to adapt a standard project-management tool to their needs. An AI logs the ticket. A human agent could hand over a standard workaround and close it.</p>
        <p>The empowered agent goes further. They spend an hour learning the customer's domain, compliance standards, supply-chain complexity for turbine parts, regulatory reporting, then reconnect: "I looked into your issue, and I also took time to understand how energy projects usually run. Here's a way to configure the tool to track your milestones, and a custom report template for your quarterly compliance filings."</p>
        <p>That transforms a support request into a consulting engagement. The customer isn't just satisfied, they're astonished that a partner invested time to understand their business. That single act builds loyalty no competitor can easily break.</p>
      `,
      checks: [
        {
          question: "What makes the \"extra mile\" possible in the renewable-energy example?",
          options: [
            "A more powerful AI model that already knew the domain",
            "AI handling the high-volume, low-complexity work gave the agent the time to research the customer's world",
            "The customer paying for a premium support tier"
          ],
          correct: 1,
          explanation: "Time is the reclaimed resource. When AI absorbs the routine load, people can reinvest that time into deep, proactive understanding."
        },
        {
          question: "Why does the lesson frame this as durable competitive advantage?",
          options: [
            "Because custom report templates are hard for competitors to build",
            "Because a partner who invests time to understand a customer's business earns a level of trust and loyalty a competitor can't easily replicate",
            "Because it lets the company charge more for support"
          ],
          correct: 1,
          explanation: "The moat is the relationship. Efficiency can be copied; a customer who feels genuinely understood is much harder to win away."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: The Direction Is Set by Strategy",
      body: `
        <p>AI is a powerful force, but its direction is guided by your strategy. Two organizations can deploy the same capability and get opposite results, one hollows out its customer relationships, the other deepens them.</p>
        <p>The advanced organizational skill is making that direction explicit and consistent across teams: defining where AI absorbs volume, where humans are deliberately inserted, and how reclaimed time gets reinvested rather than simply cut. By focusing AI on empowering your team, you're not just investing in technology, you're investing in better human relationships at scale.</p>
        <p>Don't let the "artificial" in AI fool you. Its greatest potential is helping your organization be more consistently and genuinely human, delivering the moments that create customers for life.</p>
      `,
      checks: [
        {
          question: "The lesson says two organizations can deploy \"the same capability and get opposite results.\" What determines which result you get?",
          options: [
            "The size of the AI budget",
            "The strategy that sets AI's direction — whether it's aimed at removing people from relationships or freeing them for the parts that matter",
            "How advanced the underlying models are"
          ],
          correct: 1,
          explanation: "Capability is neutral. Intent, made explicit and consistent across teams, is what turns it into either a cost story or a loyalty story."
        },
        {
          label: "Bringing it together",
          question: "Your organization has mature AI capability across support and success teams. Using this course, what's the advanced move?",
          options: [
            "Push automation coverage as high as possible and measure success by deflection rate",
            "Make an explicit, cross-team operating model: AI absorbs volume, humans are deliberately placed at the high-empathy and high-judgment moments, and reclaimed time is reinvested in understanding customers — not cut",
            "Let each team decide independently how much to automate"
          ],
          correct: 1,
          explanation: "Deflection-rate maximization is the cost story. The loyalty story is a deliberate, consistent division of labor that treats reclaimed human time as an asset to reinvest."
        }
      ],
      reflection: {
        prompt: "In your organization, name one customer-facing moment where AI currently removes a person from the loop. If you instead used AI to surface that moment for a person, what \"quick win\" could they deliver — and what would you have to stop cutting to give them the time?"
      }
    }
  ]
};
