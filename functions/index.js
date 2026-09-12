/**
 * Cloud Function: gradeApplicationScenario
 *
 * Grades a respondent's answer to the "VP of Engineering buy-in" scenario
 * on the assessment. Uses Groq's free tier so this runs at effectively $0
 * marginal cost within Groq's daily request limits (the Firebase project
 * itself still needs to be on the Blaze plan for Cloud Functions to run
 * at all — see the repo README for the one-time setup).
 *
 * This function is intentionally "pure": it grades and returns JSON, and
 * writes nothing to the respondent's own Firestore data. The client folds
 * the result into the same progress/{uid} write path everything else in
 * the app already uses (see index.html's saveAssessmentResult /
 * applyScenarioGradeWhenReady) — this function has no reliable uid to
 * write against anyway, since the assessment is results-first and a
 * respondent may not have an account yet when they answer this question.
 *
 * The one write this function does make is a best-effort audit log
 * (scenarioGradingLog/{autoId}) containing the full grading result,
 * including internal_rationale, which never reaches the browser. That
 * collection is for your own review only — it is not read by anything in
 * the app and holds no uid, so it can't be traced back to a respondent by
 * design.
 *
 * Setup:
 *   cd functions && npm install
 *   firebase functions:secrets:set GROQ_API_KEY
 *
 * Deploy:
 *   firebase deploy --only functions:gradeApplicationScenario
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const cors = require("cors")({ origin: "https://assessment.productadvisory.co" });
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const GROQ_API_KEY = defineSecret("GROQ_API_KEY");

// Change this in functions/.env (GROQ_MODEL=...) and redeploy if Groq
// retires the current free-tier model, the way it did with
// llama-3.3-70b-versatile in mid-2026 — no code edit needed. Check
// console.groq.com/docs/models before assuming the default below is
// still current.
const GROQ_MODEL = defineString("GROQ_MODEL", { default: "openai/gpt-oss-120b" });

// Below this word count, or if the text looks like gibberish/keyboard mash,
// we skip the API call entirely and return a default result. This is a
// cost gate, not a fairness gate, so if legitimate short answers start
// getting caught, loosen MIN_WORD_COUNT rather than the other checks.
const MIN_WORD_COUNT = 12;

function looksLikeGibberish(text) {
  const trimmed = (text || "").trim();
  if (trimmed.length === 0) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORD_COUNT) return true;

  // Catches symbol spam / keyboard mashing.
  const letters = trimmed.replace(/[^a-zA-Z]/g, "").length;
  if (letters / trimmed.length < 0.6) return true;

  // Catches repeated filler like "test test test test test".
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (uniqueWords.size / words.length < 0.4) return true;

  return false;
}

const GRADING_PROMPT = `You are grading a product manager's response to an organizational buy-in scenario as part of a skills assessment. Your job is to evaluate how well they applied product judgment to get buy-in from a skeptical stakeholder, not how well-written the response is.

SCENARIO GIVEN TO THE RESPONDENT:
You're a product manager at a mid-size company. Leadership has asked teams to bring forward AI opportunities, but six months ago a different team's AI pilot (an automated customer-support triage tool) was quietly shut down after costing more than expected and never showing clear results. Your VP of Engineering, who has to allocate a team to build anything you propose, was burned by that project and is now wary of "AI" pitches in general.

You believe there's a real opportunity to use AI to reduce manual work in customer onboarding, and you have two engineers' worth of time available for one quarter, no more.

In a few sentences, write what you'd actually say to this VP to get a pilot approved. Be specific about how you'd address their skepticism and what you'd propose doing with that limited time.

RESPONDENT'S ANSWER:
{{answer}}

Evaluate the answer against these four checks. For each, assign a score of 0 (absent), 1 (partially present), or 2 (clearly and specifically present).

1. names_objection: Does the response directly address the VP's specific skepticism, that a prior AI pilot cost more than expected and showed unclear results, rather than making a generic case for AI?
2. respects_constraint: Does the response propose something that plausibly fits within two engineers and one quarter, or explicitly acknowledge scoping down to fit that limit? A proposal that ignores the constraint or clearly exceeds it scores 0.
3. business_outcome: Does the response anchor the pitch to something the VP could defend upward (time saved, cost avoided, a metric leadership tracks) rather than describing the technology itself?
4. concrete_next_step: Does the response propose a specific, scoped pilot with a way to measure success, rather than vague language like "start small and iterate"?

CALIBRATION EXAMPLES:

Weak (total 1/8):
"AI is really important right now and I think we should invest in it. I'd tell the VP that if we don't move fast on AI we'll fall behind competitors, and ask for the team to explore options."
Scores: names_objection=0, respects_constraint=0, business_outcome=0, concrete_next_step=1
Why: never engages with the VP's actual concern, no scope, no outcome tied to the business, "explore options" isn't a concrete step.

Middling (total 4/8):
"I'd tell the VP I know the last pilot was frustrating, but this is different because we're targeting something smaller. I want to build an AI tool that helps with onboarding, and I think it could save the support team real time once it's live."
Scores: names_objection=1, respects_constraint=0, business_outcome=1, concrete_next_step=1
Why: acknowledges the prior pilot but doesn't address the cost/ROI concern specifically, doesn't mention the two-engineer/one-quarter limit, gestures at a benefit without a metric, "once it's live" isn't a scoped pilot.

Strong (total 7/8):
"I'd start by acknowledging the last pilot went over budget without a clear result, and tell the VP this is scoped very differently: two engineers, four weeks, one narrow use case, automating manual data entry in customer onboarding. I'd propose measuring success by hours of manual work removed per week, with a hard checkpoint at four weeks to decide whether to continue, not an open-ended commitment."
Scores: names_objection=2, respects_constraint=2, business_outcome=2, concrete_next_step=1
Why: directly names the cost/ROI concern, explicitly respects the constraint, ties to a measurable outcome, proposes a checkpoint, though the metric isn't tied to a dollar figure or something leadership already tracks, hence 1 rather than 2 on the last check.

TIER MAPPING (based on total):
0-2: no_experience
3-5: moderate
6-7: lots
8: advanced

Return only a JSON object in this exact shape. No markdown fences, no text outside the object.

{
  "checks": {
    "names_objection": 0-2,
    "respects_constraint": 0-2,
    "business_outcome": 0-2,
    "concrete_next_step": 0-2
  },
  "total": <sum of the four checks>,
  "tier": "no_experience" | "moderate" | "lots" | "advanced",
  "internal_rationale": "One to two sentences per check explaining the score. Reference the checks by name. For internal review only, never shown to the respondent.",
  "user_facing_feedback": "Two to three warm, specific sentences written like a mentor's comment. Reference something concrete from their actual answer. Do not name or imply the criteria being measured, avoid words like constraint, objection, business outcome, or checks. Note one thing that came through well and one thing that would make the pitch land better with a skeptical stakeholder."
}`;

async function callGroq(answer, apiKey, model, strict) {
  const promptText = GRADING_PROMPT.replace("{{answer}}", answer);

  const messages = [{ role: "system", content: promptText }];
  messages.push(
    strict
      ? {
          role: "user",
          content:
            "Return ONLY the JSON object described above. No explanation, no markdown fences, no text before or after it.",
        }
      : { role: "user", content: "Grade the response now." }
  );

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseGradingResult(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned); // throws on invalid JSON, caller handles retry

  const requiredFields = ["checks", "total", "tier", "internal_rationale", "user_facing_feedback"];
  for (const field of requiredFields) {
    if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
  }
  return parsed;
}

/* Best-effort audit log. internal_rationale (and everything else in the
   grading result) lands here for your own review — this collection is
   never read by the app and carries no uid, so a logging failure here
   must never affect the response sent back to the respondent. */
async function logToAuditTrail(answer, result, model, note) {
  try {
    await db.collection("scenarioGradingLog").add({
      ts: FieldValue.serverTimestamp(),
      model,
      answer,
      result: result || null,
      note: note || null,
    });
  } catch (err) {
    console.error("Audit log write failed (non-fatal):", err.message);
  }
}

exports.gradeApplicationScenario = onRequest({ secrets: [GROQ_API_KEY] }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const answer = (req.body && req.body.answer) || "";
    const model = GROQ_MODEL.value();

    if (looksLikeGibberish(answer)) {
      const skippedResult = {
        tier: "no_experience",
        total: 0,
        user_facing_feedback:
          "We couldn't find enough detail in your response to evaluate it. Try describing specifically what you'd say to the VP and how you'd scope the pilot.",
        skipped_grading: true,
      };
      await logToAuditTrail(answer, null, model, "skipped: too short or gibberish");
      res.status(200).json(skippedResult);
      return;
    }

    const apiKey = GROQ_API_KEY.value();
    let result;

    try {
      const firstAttempt = await callGroq(answer, apiKey, model, false);
      result = parseGradingResult(firstAttempt);
    } catch (firstError) {
      console.warn("First grading attempt failed to parse, retrying with stricter instruction:", firstError.message);
      try {
        const secondAttempt = await callGroq(answer, apiKey, model, true);
        result = parseGradingResult(secondAttempt);
      } catch (secondError) {
        console.error("Second grading attempt also failed:", secondError.message);
        await logToAuditTrail(answer, null, model, `grading failed twice: ${secondError.message}`);
        res.status(200).json({
          tier: "moderate",
          total: null,
          user_facing_feedback:
            "We had trouble scoring this response automatically. It's been flagged for manual review.",
          grading_error: true,
        });
        return;
      }
    }

    await logToAuditTrail(answer, result, model, null);

    // Only the fields the front end needs — internal_rationale never
    // leaves the server.
    res.status(200).json({
      tier: result.tier,
      total: result.total,
      user_facing_feedback: result.user_facing_feedback,
    });
  });
});
