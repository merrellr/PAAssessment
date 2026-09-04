/* ================================================================
   COURSE CONTENT: Stakeholder Communication & Influence, Moderate Experience
   Source: "The Product Manager's Playbook" by Robert Merrell —
   Chapter 4, "Building and Managing High-Performing Product Teams"
   Generalized from the book's healthcare-SaaS framing to a broad
   SaaS/product audience.
   ================================================================
   This file only needs to be edited if you're changing THIS
   course's content. Adding a new course means creating a new file
   like this one, not editing this file.
   ================================================================ */
window.CONTENT_OVERRIDES = window.CONTENT_OVERRIDES || {};

window.CONTENT_OVERRIDES["stakeholder-moderate"] = {
  sourceUrl: "",
  recap: [
    "Each role on a product team (PM, PO, design, engineering, QA) needs something different from you — know what.",
    "Collaboration doesn't happen by accident: agile ceremonies, shared tools, and deliberate communication channels.",
    "Empower people with real autonomy and trust, not just direction.",
    "Recognize contributions and invest in continuous learning to keep a team high-performing."
  ],
  lessons: [
    {
      id: 1,
      title: "Lesson 1: The Roles on a Product Team, and Why Each One Matters",
      preCheck: {
        label: "Before you read on — predict",
        question: "On a well-functioning product team, whose job is it to prioritize and groom the backlog day to day?",
        options: [
          "The Product Manager, since they own the overall strategy",
          "Often a distinct role (like a Product Owner), separate from whoever sets the broader strategic direction"
        ],
        correct: 1,
        explanation: "See if the breakdown below matches this."
      },
      body: `
        <p>Creating an impactful product isn't just about the product itself, it's about the team behind it. A well-rounded product team requires a diverse set of skills and clearly understood roles. Step through the core roles you'll typically find on a strong product team.</p>
        <svg viewBox="0 0 400 156" style="width:100%; height:auto; margin:4px 0 2px;" xmlns="http://www.w3.org/2000/svg">
          <text x="8" y="14" font-family="'Space Grotesk',sans-serif" font-size="8.5" font-weight="700" fill="#12305e">What each role needs from you (the PM)</text>
          <g font-family="'Space Grotesk',sans-serif" font-size="8" font-weight="700" fill="#12305e" text-anchor="middle">
            <rect x="8" y="24" width="104" height="26" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><text x="60" y="41">Product Owner</text>
            <rect x="8" y="56" width="104" height="26" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><text x="60" y="73">UX / UI Design</text>
            <rect x="8" y="88" width="104" height="26" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><text x="60" y="105">Engineering</text>
            <rect x="8" y="120" width="104" height="26" rx="5" fill="#EEF3FA" stroke="#1A4584" stroke-width="1"/><text x="60" y="137">Quality Assurance</text>
          </g>
          <g font-family="sans-serif" font-size="8" fill="#4B5768">
            <text x="124" y="40">priorities clear enough to turn into stories</text>
            <text x="124" y="72">the user problem and success criteria, early</text>
            <text x="124" y="104">stable scope, the "why", room to shape the how</text>
            <text x="124" y="136">acceptance criteria and a shared definition of done</text>
          </g>
        </svg>
      `,
      steps: [
        { title: "Product Manager", detail: "The linchpin between stakeholders and the development team. Responsible for market research, defining features, prioritizing the roadmap, and aligning the product with business strategy." },
        { title: "Product Owner", detail: "In Agile environments, focuses on managing the backlog and translating high-level goals into actionable user stories. Where the PM sets direction, the PO manages day-to-day implementation." },
        { title: "UX/UI Designers", detail: "Responsible for creating intuitive interfaces. This means user research, wireframes and prototypes, and usability testing to validate design choices before they're built." },
        { title: "Engineering Team", detail: "Brings the product vision to life: refining technical requirements, building scalable and secure solutions, and testing for quality before release." },
        { title: "Quality Assurance", detail: "Especially critical for anything safety- or compliance-sensitive. Writes and executes test cases, identifies and reports issues, and validates that releases meet required standards before they ship." }
      ],
      checks: [
        {
          question: "What's the key difference between a Product Manager and a Product Owner, as described here?",
          options: [
            "There's no real difference, the titles are interchangeable",
            "The PM typically sets strategic direction and aligns with business goals; the PO typically manages the backlog and day-to-day implementation details",
            "The Product Owner outranks the Product Manager"
          ],
          correct: 1,
          explanation: "Different scope, not different seniority: strategy and direction versus the tactical, day-to-day translation of that direction into actionable work."
        },
        {
          question: "Why does QA matter especially for products handling sensitive or regulated data?",
          options: [
            "It doesn't matter more in that context than any other",
            "Because errors in that context carry higher consequences, QA can't be an afterthought when safety, compliance, or data sensitivity is involved",
            "QA is only relevant for consumer mobile apps"
          ],
          correct: 1,
          explanation: "The stakes of a missed bug scale with what's on the line, which is exactly why QA rigor matters even more in sensitive or regulated contexts."
        }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Collaboration Doesn't Happen by Accident",
      body: `
        <p>Building a high-performing product team isn't just about assigning the right roles, it's about fostering effective collaboration between them. Agile methodologies like Scrum or Kanban provide the structure needed for iterative development and cross-functional alignment: regular sprint planning, stand-ups, and retrospectives, plus a shared tool for transparent progress tracking.</p>
        <p>Structure alone isn't enough, though. Cross-functional collaboration also requires genuinely open communication. Weekly touchpoints and collaborative tools help break down silos, but the real work is cultural: setting up regular syncs on key deliverables, encouraging real-time updates in shared documents, and maintaining a culture where all team members actually feel heard, not just invited to the meeting.</p>
      `,
      checks: [
        {
          question: "A team runs every Scrum ceremony on schedule, but retros raise the same complaints month after month and the quieter members never really speak up. What does this lesson say is missing?",
          options: [
            "A stricter facilitator to enforce the Scrum rules",
            "The communication culture underneath the rituals — the meetings exist, but people don't yet feel genuinely heard in them",
            "A switch from Scrum to Kanban"
          ],
          correct: 1,
          explanation: "A framework gives you the meetings and the rituals. Whether those meetings actually produce alignment depends on the communication culture underneath them."
        }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Empowerment, Not Just Direction",
      body: `
        <p>High-performing teams need more than the right skills, they need motivation, autonomy, and support. As a product leader, your role is to provide clear direction while cultivating a culture of ownership.</p>
        <p>Start with clarity: use a framework like OKRs (Objectives and Key Results) to define quarterly objectives and the metrics that track progress against them. From there, empower your team members by giving them real autonomy in their roles, and trusting their expertise enough to let engineers, designers, and product owners experiment with new ideas and make real decisions, not just execute someone else's.</p>
      `,
      checks: [
        {
          question: "You give your team full autonomy but never set clear objectives for the quarter. Decisions start stalling and people keep bringing choices back to you to arbitrate. What does this lesson say went wrong?",
          options: [
            "You gave away too much autonomy and should take decisions back",
            "Autonomy needs clear goals to aim at — without the direction OKRs provide, freedom to decide has no reference point",
            "The team isn't experienced enough to self-direct"
          ],
          correct: 1,
          explanation: "These work together, not against each other: clarity on what matters is what makes it safe to hand over real decision-making authority."
        }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Recognition and Continuous Learning",
      body: `
        <p>Celebrate wins, both big and small, and recognize team members who go above and beyond. This isn't just a nice gesture, it's what fosters a positive team culture and keeps people motivated over the long run: publicly acknowledging contributions in meetings, offering real incentives for exceptional work, and encouraging peer-to-peer recognition.</p>
        <p>The work doesn't stop once a team is performing well, either. Product development is an ever-evolving field, and your team needs to keep learning to stay ahead: invest in training and development, encourage knowledge sharing through things like lunch-and-learns or mentorship, and promote a genuine growth mindset where experimenting and learning from failure gets celebrated instead of punished.</p>
      `,
      checks: [
        {
          question: "Why does this lesson connect recognition directly to team motivation, rather than treating it as a separate nice-to-have?",
          options: [
            "Recognition and motivation are actually unrelated topics",
            "Because celebrating contributions is described as directly fostering the positive culture that keeps people motivated, not just a pleasant extra",
            "Because recognition is only meaningful when tied to a monetary bonus"
          ],
          correct: 1,
          explanation: "Recognition isn't framed as decoration here, it's described as a direct driver of the culture and motivation a high-performing team depends on."
        },
        {
          label: "Bringing it together",
          question: "A team has clear roles, uses Scrum properly, and has well-defined OKRs, but still feels disengaged and stagnant. Based on this whole course, what's most likely missing?",
          options: [
            "Nothing more is needed once roles, process, and goals are in place",
            "The human layer on top of structure: real autonomy, recognition of contributions, and a culture of continuous learning, which structure and goals alone don't guarantee",
            "The team needs a completely different Agile framework"
          ],
          correct: 1,
          explanation: "This ties Lessons 2 through 4 together: process and clarity are necessary but not sufficient. Empowerment, recognition, and a learning culture are what turn a well-structured team into a genuinely high-performing one."
        }
      ],
      reflection: {
        prompt: "Think about your own product team. Which of the five roles from Lesson 1 feels least clearly defined right now, and what's one small step that could clarify it?"
      }
    }
  ]
};
