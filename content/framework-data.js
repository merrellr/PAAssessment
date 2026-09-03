/* ================================================================
   TRAINING FRAMEWORK DATA
   Shared by lms-dashboard.html (info popovers) and framework.html
   (the full reference page), so the actual competency descriptions
   only need to be edited in one place.
   ================================================================ */
window.FRAMEWORK_DATA = {
  discovery: {
    label: "Customer & Market Discovery",
    description: "The practice of understanding real user needs, market dynamics, and problem validation before committing real resources to build something. It's what keeps a product grounded in reality instead of assumptions.",
    tiers: {
      novice: "Aware that customer research matters, but hasn't yet run a structured discovery conversation or validated a problem before starting to build.",
      moderate: "Can conduct basic user interviews and gather feedback, but discovery often happens informally, or after a solution is already underway rather than before.",
      experienced: "Runs a structured discovery process, validates problems before committing resources, and can reliably separate real signal from noise in user feedback.",
      advanced: "Builds and teaches repeatable discovery systems across teams, and treats discovery as a genuine competitive advantage rather than a phase to get through."
    }
  },
  strategy: {
    label: "Product Strategy & Roadmapping",
    description: "Translating market understanding and business goals into a coherent product direction, and a roadmap that credibly connects today's work to that direction rather than just a list of features.",
    tiers: {
      novice: "Roadmaps, when they exist, are mostly lists of requested features rather than a connected strategy.",
      moderate: "Can build a roadmap with clear near-term priorities, but struggles to tie it clearly to broader business strategy or defend trade-offs under pressure.",
      experienced: "Builds and communicates a roadmap that's genuinely tied to strategy, and can adapt it credibly as new information arrives without losing the thread.",
      advanced: "Shapes strategy at the company level, not just the product level, and mentors others in strategic thinking."
    }
  },
  prioritization: {
    label: "Prioritization & Trade-offs",
    description: "The discipline of deciding what to work on next, and just as importantly, what not to, given limited time and resources, in a way that holds up under real pressure.",
    tiers: {
      novice: "Prioritization is largely reactive, driven by whoever asked loudest or most recently.",
      moderate: "Uses a basic prioritization framework, like a value-versus-effort view, but applies it inconsistently from one decision to the next.",
      experienced: "Applies a prioritization framework consistently, and can clearly explain trade-offs to stakeholders who disagree with the call.",
      advanced: "Designs prioritization systems that other teams adopt, and navigates prioritization conflicts at an organizational level."
    }
  },
  execution: {
    label: "Execution & Delivery",
    description: "Turning decisions into shipped, working product, reliably and without unnecessary drama, from an idea all the way through launch and the iteration that follows.",
    tiers: {
      novice: "Execution happens, but timelines and scope are unpredictable, and surprises tend to show up late in the process.",
      moderate: "Can run a team through a delivery cycle with reasonable predictability using a defined process.",
      experienced: "Delivers complex, cross-team initiatives reliably, and builds in real contingency for the unexpected rather than hoping nothing goes wrong.",
      advanced: "Designs delivery systems and rhythms that other teams adopt, and coaches others through complex, high-stakes launches."
    }
  },
  stakeholder: {
    label: "Stakeholder Communication & Influence",
    description: "Building genuine alignment and trust across the many different people, teams, and functions a product touches, especially the ones that don't report to you.",
    tiers: {
      novice: "Communication is mostly reactive, updates happen when someone asks, rather than being shared proactively.",
      moderate: "Keeps key stakeholders reasonably informed and can navigate straightforward disagreements as they come up.",
      experienced: "Proactively builds alignment across functions before conflicts arise, and can influence outcomes without relying on formal authority.",
      advanced: "Shapes how the organization communicates and collaborates cross-functionally, and mentors others in stakeholder management."
    }
  },
  aiIndividual: {
    label: "AI Fluency — Individual",
    description: "How effectively someone personally uses AI tools to remove friction from their own work, and how well they've developed judgment about where to trust AI output and where to double-check it.",
    tiers: {
      novice: "Hasn't yet built a regular personal practice with AI tools, or is just starting to experiment.",
      moderate: "Uses AI tools casually for specific tasks, but hasn't yet developed strong judgment about where it genuinely helps most.",
      experienced: "Has a real, integrated personal practice with AI tools, and knows specifically where to trust the output and where it still needs a second look.",
      advanced: "Has fully integrated multiple AI tools into a sophisticated daily workflow, and helps other people build that same judgment."
    }
  },
  aiOrg: {
    label: "AI Fluency — Organizational",
    description: "The ability to bring real AI capability into an organization in a way that's durable and governed, and that survives beyond any one enthusiastic individual who happens to be good at it.",
    tiers: {
      novice: "AI use across the organization, where it exists at all, is scattered and individual, with no shared capability behind it.",
      moderate: "Has helped build at least one shared, working AI tool or process that a whole team relies on, not just one person.",
      experienced: "Has led an AI initiative from discovery through a real pilot to genuine adoption, with real metrics behind it.",
      advanced: "Has built organization-wide AI capability and governance that scales cleanly across multiple teams and use cases."
    }
  }
};
