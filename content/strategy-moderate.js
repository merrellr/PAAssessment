/* ================================================================
   COURSE CONTENT: Product Strategy & Roadmapping, Moderate Experience
   Source: "The Product Manager's Playbook: A Strategic Guide to
   Building, Scaling, and Optimizing Products" by Robert Merrell —
   Chapter 3, "Crafting an Effective Go-to-Market Strategy"
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience per Rob's request.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["strategy-moderate"] = {
  sourceUrl: "",
  recap: [
    "One product needs several pitches — tailor positioning to each segment rather than a single generic message.",
    "A value proposition lands when it names a specific outcome for a specific user, not a list of features.",
    "A launch plan coordinates product, marketing, and sales against a shared timeline and a shared definition of 'launched'.",
    "Enable sales with real material — playbooks, demo scripts, objection handling — and align the rest of the company on the story.",
    "The launch isn't the finish line; post-launch monitoring and iteration is where the value actually gets realized."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: One Product, Several Different Pitches",
      preCheck: {
        label: "Before you read on — predict",
        question: "Should your product's messaging be the same for every type of buyer, or different depending on who's reading it?",
        options: [
          "The same, consistency matters more than tailoring",
          "Different, each type of buyer cares about different things"
        ],
        correct: 1,
        explanation: "Keep this in mind as you read, this lesson is built entirely around that distinction."
      },
      image: { src: "images/gtm-personas.png", alt: "Three buyer persona cards: End User (cares about ease of use), Economic Buyer (cares about cost and ROI), and Technical Evaluator (cares about integration, security, and reliability), each with a representative quote" },
      body: `
        <p>Launching a product involves more than releasing a feature, it's about connecting with your audience, understanding the landscape, and positioning your product effectively. The first and most crucial step in any go-to-market strategy is defining your audience and positioning your product in a way that resonates with each part of it.</p>
        <p>Most products are bought, not by one person, but by a small group of different people, each with a different stake in the decision. A user who loves your product's workflow is not the same person who approves the budget, who is not the same person who checks whether it integrates safely with what the company already runs. If your messaging only speaks to one of these people, the other two go unconvinced, and unconvinced people don't sign off.</p>
      `,
      checks: [
        {
          question: "Why can't one generic pitch work for every buyer involved in a purchase decision?",
          options: [
            "It can, simplicity beats customization every time",
            "Different people in the decision (the user, the budget owner, the technical reviewer) care about fundamentally different things, and a generic pitch fails to address any of them well",
            "Because pricing is the only thing that actually matters to any buyer"
          ],
          correct: 1,
          explanation: "This is the core idea the rest of the lesson builds on: messaging has to be tailored to what each specific persona actually cares about, not a one-size-fits-all pitch."
        },
        {
          question: "A user loves your product's daily workflow, but the deal still doesn't close. What does this lesson suggest might be missing?",
          options: [
            "Nothing, user enthusiasm should be enough on its own",
            "Messaging or proof points aimed at the other stakeholders in the decision, like the economic buyer or technical evaluator, who care about different things",
            "The product itself must not actually be good"
          ],
          correct: 1,
          explanation: "One convinced persona doesn't close a deal that requires buy-in from several. This is exactly the gap the rest of this course addresses."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Value Propositions That Actually Land",
      body: `
        <p>Once you know who's in the room, the next step is saying something that actually matters to each of them. A value proposition needs to communicate how your product solves the specific problem faced by that specific persona, in language they'd actually use themselves.</p>
        <p>For the end user, that's usually about time and friction: <em>"Streamline your work so you can focus on what matters."</em> For the economic buyer, it's about cost and measurable return: <em>"Lower costs and improve efficiency with a fully integrated solution."</em> For a technical evaluator, it's about risk: does this fit into what we already run, and can we trust it?</p>
        <p>The mistake many teams make is writing one value proposition and repeating it to everyone. It sounds efficient, but it usually lands with nobody, because it's specific to no one.</p>
      `,
      checks: [
        {
          question: "What makes a value proposition actually effective for a specific persona?",
          options: [
            "Using the most impressive-sounding language possible",
            "Speaking to the specific problem that persona faces, in terms they'd use themselves",
            "Including as many features as possible in the description"
          ],
          correct: 1,
          explanation: "A value proposition works when it's specific to what the listener actually cares about, not a broad, generic claim aimed at no one in particular."
        },
        {
          question: "A single value proposition, 'the most powerful platform on the market,' is used for every persona in a sales pitch. What's the likely problem here?",
          options: [
            "Nothing, powerful, broad claims work universally",
            "It's specific to no one, an economic buyer wants ROI language, a technical evaluator wants integration and risk language, and this claim speaks to neither",
            "It's too short to be taken seriously"
          ],
          correct: 1,
          explanation: "This is exactly the trap the lesson warns about: a message built to work for everyone often ends up compelling to no one."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Building the Launch Plan",
      body: `
        <p>Once your target market and messaging are defined, it's time to build the actual launch plan, covering communication, pricing, and how you'll actually reach people.</p>
        <p>A communication plan outlines how you'll generate awareness: the marketing channels you'll use, a content strategy (case studies, whitepapers, real examples), and social proof like testimonials or pilot results that build trust before someone even talks to sales.</p>
        <p>Pricing strategy needs just as much intention. A subscription model with tiered plans is the SaaS default for a reason, it aligns naturally with different customer segments. Usage-based pricing makes sense when your product's value scales directly with how much someone uses it. The wrong model doesn't just cost revenue, it can make a genuinely good product feel like a bad fit.</p>
      `,
      checks: [
        {
          question: "Why does the lesson recommend including case studies and pilot results as part of the communication plan?",
          options: [
            "They're required by most marketing departments",
            "They function as social proof, building trust with prospective buyers before a sales conversation even starts",
            "They're primarily useful for internal team morale"
          ],
          correct: 1,
          explanation: "Social proof does real work before a single sales call happens, real examples reduce the perceived risk of trying something new."
        },
        {
          question: "When does usage-based pricing make more sense than a flat subscription tier?",
          options: [
            "Always, it's a superior model in every case",
            "When the product's value scales directly with how much a customer actually uses it",
            "Only for products that don't have real competitors"
          ],
          correct: 1,
          explanation: "Pricing model should reflect how value actually shows up for the customer, tying price to usage makes sense specifically when usage and value move together."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Enabling Sales, Aligning the Rest of the Company",
      body: `
        <p>A go-to-market strategy is only as strong as the team executing it, and that extends past marketing into sales enablement and cross-functional alignment. Your sales team needs more than a pitch deck, they need product demos highlighting real differentiators, scripts and FAQs for handling common objections, and regular training to stay current as the product evolves.</p>
        <p>But this can't stop at sales. Establish regular touchpoints between product, marketing, and sales so that messaging, positioning, and customer feedback all stay aligned. Without this, marketing ends up promising something sales can't sell, and sales ends up hearing about product changes from customers instead of from the product team.</p>
      `,
      checks: [
        {
          question: "Why does cross-functional alignment between product, marketing, and sales matter for a launch?",
          options: [
            "It's mostly a formality that doesn't affect outcomes",
            "Without it, messaging and product reality can drift apart, leaving sales promising things the product doesn't do, or missing changes customers already know about",
            "It only matters for very large companies"
          ],
          correct: 1,
          explanation: "Alignment isn't a nice-to-have here, it's what keeps what's promised in the market consistent with what the product and team can actually deliver."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: The Launch Isn't the Finish Line",
      body: `
        <p>Launching a product isn't the end, it's the beginning of the part that actually determines whether the strategy worked. Post-launch, track the metrics that matter: customer acquisition cost (what it costs to win a customer), customer lifetime value (what they're worth over time), and something like a Net Promoter Score to gauge whether people would actually recommend you.</p>
        <p>From there, gather feedback through surveys, usability testing, and direct interviews, and use it to refine the product and the go-to-market approach together. Iteration should stay aligned with your original strategic goals, not just react to the loudest recent feedback.</p>
      `,
      checks: [
        {
          question: "Why track customer lifetime value alongside customer acquisition cost, rather than acquisition cost alone?",
          options: [
            "Acquisition cost alone tells the whole story",
            "A low acquisition cost means little if those customers don't stick around or generate much value over time, the two numbers only mean something together",
            "Lifetime value is only relevant for subscription businesses"
          ],
          correct: 1,
          explanation: "Cost to acquire a customer only tells you half the story. Comparing it against what that customer is worth over time tells you whether the acquisition was actually a good trade."
        },
        {
          label: "Bringing it together",
          question: "Your product has strong early usage, but sales says prospects keep asking about integration and security before they'll move forward, and closed deals keep stalling with the budget approver. Based on this whole course, what's the most likely gap?",
          options: [
            "The product itself is fundamentally flawed and should be rebuilt",
            "The go-to-market strategy is likely under-serving two personas, the technical evaluator (security, integration) and the economic buyer (budget justification), even though the end-user pitch is landing fine",
            "Sales just needs more general product training"
          ],
          correct: 1,
          explanation: "This ties Lessons 1 and 2 directly to a real symptom: strong end-user interest with stalled deals is a classic sign that the technical and economic personas aren't getting the tailored value proposition and proof points they specifically need."
        }
      ],
      reflection: {
        prompt: "Think about your own product's last launch or your next one. Who are the 2-3 distinct personas involved in the buying decision, and does your current messaging actually speak to each of them separately, or is it one message aimed at all of them?"
      }
    }
  ]
};
