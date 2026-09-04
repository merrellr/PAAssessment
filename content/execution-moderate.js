/* ================================================================
   COURSE CONTENT: Execution & Delivery, Moderate Experience
   Source article: "Improving Accessibility with AI: Tools and
   Innovations Making Life Easier" (Robert Merrell, LinkedIn)
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["execution-moderate"] = {
  sourceUrl: "https://www.linkedin.com/pulse/improving-accessibility-ai-tools-innovations-making-life-merrell-wndmc",
  recap: [
    "Treat accessibility as innovation, not obligation — accessible design is usually better design for everyone.",
    "AI is already changing accessibility: captioning, alt-text, real-time translation, navigation assistance.",
    "AI is an enabler, not a shortcut — it accelerates the work but doesn't remove the need for human judgment and testing with real users.",
    "Roll it out with a playbook: start narrow, measure, expand once it's earned it.",
    "Measure what matters — task completion for users with disabilities, not just a compliance checkbox.",
    "Quick wins you can turn on today: auto alt-text, captions, contrast checks, keyboard-navigation audits."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: Accessibility as Innovation, Not Obligation",
      preCheck: {
        label: "Before you read on — predict",
        question: "Historically, digital accessibility has mostly been treated as which of these?",
        options: [
          "A core part of product design from day one",
          "A compliance requirement or technical afterthought"
        ],
        correct: 1,
        explanation: "See if the lesson below matches this."
      },
      image: { src: "images/accessibility-before-after.png", alt: "A before-and-after comparison: without AI shows manual captioning, static screen readers, and one-size-fits-all content tagged compliance-driven and bolt-on; with AI shows real-time captions, computer vision, and adaptive tools tagged inclusion-driven and built-in by default" },
      body: `
        <p>For years, digital accessibility was treated as a compliance checkbox or a technical afterthought. AI is helping shift that mindset, creating experiences that are more inclusive, more adaptive, and more human-centered from the start.</p>
        <p>This isn't a niche feature set. When products are designed to meet people where they are, they become easier to use for <em>everyone</em>, not just the users a feature was originally built for. The biggest opportunity for product leaders is to approach accessibility as innovation, not obligation.</p>
      `,
      checks: [
        {
          question: "Why does this course frame accessibility as 'innovation' rather than 'obligation'?",
          options: [
            "Because compliance requirements no longer apply to most companies",
            "Because designing for accessibility tends to make products easier to use for everyone, not just the original target group",
            "Because obligation-framed features are always lower quality"
          ],
          correct: 1,
          explanation: "This is the lesson's central reframe: accessibility work has spillover value for the entire user base, not just the people it's explicitly designed for."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Where AI Is Already Changing Accessibility",
      image: { src: "images/accessibility-categories.png", alt: "Four categories of AI accessibility tools: Voice interfaces (dictation, voice assistants, smart device control), Visual assistance (scene description, object ID, navigation guidance), Captioning and transcription (live captions, meeting transcripts, AI summaries), and Adaptive learning (plain language, document summaries, read aloud)" },
      body: `
        <p>Four categories cover most of what's changing right now. <strong>Voice interfaces</strong> let people with mobility or dexterity challenges complete tasks through natural conversation instead of typing or tapping. <strong>Visual assistance</strong> turns a smartphone camera into a real-time guide for people who are blind or have low vision, identifying objects, reading text aloud, describing scenes.</p>
        <p><strong>Captioning and transcription</strong> have become dramatically more accurate for people who are deaf or hard of hearing, live captions and transcripts are now widely available in meetings and video, not just specialized settings. <strong>Adaptive learning and cognitive support</strong> personalizes how information is presented, simplifying language and reading content aloud for people with dyslexia, ADHD, or memory differences.</p>
        <p>What makes this moment different: these capabilities are increasingly built into mainstream products, not siloed into specialized devices. That matters because accessibility scales when it's part of everyday technology, not a separate category.</p>
      `,
      checks: [
        {
          question: "Why does it matter that these capabilities are 'built into mainstream products' rather than specialized devices?",
          options: [
            "Specialized devices are always more effective",
            "Accessibility scales further when it's part of everyday technology everyone already uses, rather than a separate category people have to seek out",
            "Mainstream products are always cheaper"
          ],
          correct: 1,
          explanation: "This is the lesson's point about scale: a feature built into the phone or laptop someone already owns reaches far more people than a standalone specialized tool."
        },
        {
          question: "A tool reads text aloud from a photo and describes what's in a scene. Which category does this belong to?",
          options: [
            "Voice interfaces",
            "Visual assistance",
            "Adaptive learning"
          ],
          correct: 1,
          explanation: "This is a visual assistance use case, computer vision translating visual information into spoken guidance."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: AI Is an Enabler, Not a Shortcut",
      body: `
        <p>AI is not a perfect solution on its own. Voice systems can still struggle with accents or speech patterns. Image recognition can miss context. Captions can introduce errors. Accessibility cannot rely entirely on automation.</p>
        <p>Inclusive products require testing with real users, thoughtful design decisions, and a commitment to improving outcomes over time. Teams should build with transparency and flexibility in mind, users need to understand what the AI is doing and where it may still have limitations. Features like captions, voice commands, and scene descriptions should be easy to turn on, adjust, or correct. Accessibility is strongest when users stay in control of their experience.</p>
      `,
      checks: [
        {
          question: "A team ships an AI captioning feature and considers the accessibility work done. What does this lesson say is missing?",
          options: [
            "Nothing, if the AI works technically the job is complete",
            "Ongoing testing with real users and a way for people to correct errors, since AI captions can still introduce mistakes on their own",
            "A bigger marketing push for the new feature"
          ],
          correct: 1,
          explanation: "The lesson is explicit that automation alone isn't enough. Real user testing and user control over corrections are what keep an imperfect AI feature genuinely useful."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: The Rollout Playbook",
      body: `
        <p>For teams wondering how to get started, the best approach begins with real user needs, not the technology itself. Step through the six-stage path from there.</p>
      `,
      steps: [
        { title: "1. Identify friction", detail: "Look at where users struggle to read, hear, navigate, respond, or understand information. Accessibility gaps often become clear when you observe how people actually use a product in the real world." },
        { title: "2. Pick one or two use cases", detail: "Better voice input, improved captions, image descriptions, simplified content, whatever it is, start small. This helps teams learn faster and build confidence without trying to solve everything at once." },
        { title: "3. Involve the right people", detail: "Product, design, engineering, legal, support, and accessibility specialists should all have a voice. Most importantly, include people with disabilities in research, testing, and feedback loops, they're the ones the solution is meant to support." },
        { title: "4. Define success metrics", detail: "Lower task abandonment, faster completion time, better comprehension, higher satisfaction. Evaluate features not only by technical performance, but by whether they genuinely reduce friction and increase independence." },
        { title: "5. Pilot and refine", detail: "Test with a diverse group of users, gather feedback, and refine quickly before going further." },
        { title: "6. Expand thoughtfully", detail: "Once a feature proves useful, expand it across more workflows and surfaces, building accessibility into the product sustainably rather than treating it as a one-time release." }
      ],
      checks: [
        {
          question: "Why does the playbook recommend picking just one or two use cases at step 2, rather than addressing every friction point found in step 1?",
          options: [
            "Because most friction points aren't actually worth fixing",
            "Because starting narrow helps teams learn faster and build confidence, instead of stalling by trying to solve everything at once",
            "Because step 1 is only meant to be symbolic, not actually used"
          ],
          correct: 1,
          explanation: "This mirrors a pattern worth recognizing: identifying many problems doesn't mean tackling them all at once. Scope discipline is what makes the following steps actually achievable."
        },
        {
          question: "Why does step 3 specifically call out including people with disabilities, not just product and engineering?",
          options: [
            "It's a legal requirement in most jurisdictions",
            "The most effective accessibility solutions come from listening to the people they're meant to support, not just building based on internal assumptions",
            "It's mainly useful for marketing and PR purposes"
          ],
          correct: 1,
          explanation: "This connects back to real user needs being the starting point. Internal stakeholders alone can't validate whether a solution actually works for the people it's meant to help."
        }
      ]
    },
    {
      id: 5,
      title: "Lesson 5: Measure What Actually Matters",
      preCheck: {
        label: "Before you read on — predict",
        question: "Should an AI accessibility feature be judged mainly by its technical performance (like caption accuracy percentage), or by something else?",
        options: [
          "Mainly technical performance, that's the most objective measure",
          "Whether it genuinely reduces friction and increases independence for real users, technical performance is only part of the picture"
        ],
        correct: 1,
        explanation: "Keep this in mind as you read the metrics discussion below."
      },
      body: `
        <p>Define what success looks like before you build: lower task abandonment, faster completion time, better comprehension, higher satisfaction, or improved usability for specific groups. AI accessibility features should be evaluated not only by technical performance, but by whether they genuinely reduce friction and increase independence.</p>
        <p>Transparency matters just as much as the metrics themselves. Users need to understand what the AI is doing and where it may still fall short. Give people the ability to turn features on, adjust them, or correct mistakes, accessibility is strongest when users stay in control of their own experience.</p>
      `,
      checks: [
        {
          question: "A captioning feature hits 95% technical accuracy, but users report they still don't trust it enough to rely on in important meetings. What does this lesson suggest is missing?",
          options: [
            "Nothing, 95% accuracy is a strong result on its own",
            "A way for users to see the AI's limitations and easily correct errors when they happen, technical accuracy alone doesn't guarantee genuine usability or trust",
            "The feature should be turned off until it reaches 100% accuracy"
          ],
          correct: 1,
          explanation: "This is exactly the gap between technical performance and real outcomes the lesson describes. Trust and control matter as much as the raw accuracy number."
        }
      ]
    },
    {
      id: 6,
      title: "Lesson 6: Quick Wins You Can Turn On Today",
      body: `
        <p>Some of the most useful accessibility improvements don't require a long implementation plan at all, you can often just turn them on. Enable live captions by default for meetings and webinars. Turn on meeting transcripts so details are searchable later. Use AI recaps after customer calls so teams stay aligned without repeating information. Add automatic alt text suggestions for shared images and presentations. Use document summarization for long policy updates and briefs. Turn on read-aloud for knowledge articles. Enable translation in chats and documents for multilingual teams.</p>
        <p>The bigger point: accessibility isn't always about building something new. Often it's about being intentional with tools already available, and turning on features that help more people participate fully.</p>
      `,
      checks: [
        {
          question: "What's the point of this lesson's list of 'quick wins'?",
          options: [
            "These are minor features that don't meaningfully affect accessibility",
            "Meaningful accessibility improvement often doesn't require a big build, just intentionally enabling capabilities already available in tools a team already uses",
            "Every team should implement all of these features before doing anything else"
          ],
          correct: 1,
          explanation: "This lesson deliberately contrasts with the six-step rollout playbook: sometimes the highest-leverage move is simply turning something on, not running a full project."
        },
        {
          label: "Bringing it together",
          question: "A team wants to improve accessibility but has no budget for a new initiative this quarter. Based on this whole course, what's the most reasonable next step?",
          options: [
            "Wait until next quarter when a formal budget and rollout plan can be established",
            "Turn on a couple of existing quick wins (like live captions or meeting transcripts) now, while using the six-step playbook to plan a more deliberate initiative for later",
            "Skip accessibility work entirely until legal requires it"
          ],
          correct: 1,
          explanation: "This connects Lesson 4's structured playbook with Lesson 6's quick wins: they're not competing approaches, quick wins deliver value immediately while a fuller rollout gets properly planned, identified, and measured."
        }
      ],
      reflection: {
        prompt: "Look at one tool your team already uses (video calls, chat, documents, a knowledge base). Which quick win from this lesson could you turn on this week, and who would it help most?"
      }
    }
  ]
};
