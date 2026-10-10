/**
 * Scenario grading handler for the Product Advisory assessment.
 *
 * REFERENCE COPY. The live script lives in the Google Apps Script editor
 * bound to the results spreadsheet, and is served at the URL held in
 * RESULTS_LOG_URL (index.html / lms-dashboard.html / lesson.html). This
 * file version-controls the "test it for free before deciding on a paid
 * backend" version of gradeApplicationScenario: same rubric, same
 * calibration examples, same grading logic as functions/index.js, but
 * running on Apps Script's free tier instead of Cloud Functions + Groq
 * via an HTTPS function, so there is no Blaze plan / billing account
 * needed to try this out.
 *
 * ---------------------------------------------------------------------
 * Why this is a GET + JSONP callback, not a POST the client reads
 * ---------------------------------------------------------------------
 * Apps Script web apps don't reliably expose CORS headers on POST
 * responses, so a plain fetch().then(r => r.json()) is not something to
 * bet a whole feature on without a way to test it directly. This project
 * already solved the exact same problem twice (action=lookup,
 * action=companies) with a JSONP <script> tag instead, which sidesteps
 * CORS entirely because script loads are never subject to it. This
 * handler follows that same proven pattern rather than introducing a new,
 * unverified one.
 *
 * That does mean the respondent's answer travels as a URL parameter, so
 * the client caps it (see index.html's SCENARIO_MAX_CHARS) well under
 * safe URL-length limits — "a few sentences" doesn't need more room than
 * that anyway.
 *
 * ---------------------------------------------------------------------
 * One-time setup
 * ---------------------------------------------------------------------
 * In the Apps Script editor: Project Settings > Script Properties > add
 * GROQ_API_KEY = <your Groq key from console.groq.com>. No billing
 * account, no credit card, no npm install.
 *
 * ---------------------------------------------------------------------
 * Wire-up
 * ---------------------------------------------------------------------
 * 1. Add the dispatch below into the existing doGet(e), alongside the
 *    action === 'lookup' / action === 'companies' branches.
 * 2. Paste everything under "2. Handler" anywhere in the script.
 * 3. Re-deploy the web app (Deploy > Manage deployments > edit the
 *    active deployment > New version). The URL doesn't change.
 *
 * Graded answers (including internal_rationale, never sent to the
 * client) land in a new "ScenarioGrading" tab in the same spreadsheet,
 * for manual review.
 */


/* ===================================================================
   1. Dispatch - add to the existing doGet(e)
   =================================================================== */

// function doGet(e) {
//   if (e.parameter.action === 'gradeScenario') {
//     return jsonpOut_(e.parameter.callback, gradeScenarioWithQuota_(e.parameter.answer || '', e.parameter.cid || ''));
//   }
//
//   // ...existing action === 'lookup' / 'companies' branches continue here...
// }


/* ===================================================================
   2. Handler
   =================================================================== */

// Check console.groq.com/docs/models before deploying - Groq's free/dev
// tier model lineup has shifted a few times this year. One-line change,
// no other code to touch.
var GROQ_MODEL_ = 'openai/gpt-oss-120b';

// Matches the client-side gate in index.html - keep the two in sync so a
// too-short answer never even makes it into a Groq call.
var SCENARIO_MIN_WORD_COUNT_ = 12;

function jsonpOut_(callback, data) {
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function looksLikeGibberish_(text) {
  var trimmed = (text || '').trim();
  if (trimmed.length === 0) return true;

  var words = trimmed.split(/\s+/).filter(function (w) { return w; });
  if (words.length < SCENARIO_MIN_WORD_COUNT_) return true;

  var letters = trimmed.replace(/[^a-zA-Z]/g, '').length;
  if (letters / trimmed.length < 0.6) return true;

  var uniqueWords = {};
  words.forEach(function (w) { uniqueWords[w.toLowerCase()] = true; });
  if (Object.keys(uniqueWords).length / words.length < 0.4) return true;

  return false;
}

var GRADING_PROMPT_ = `You are grading a product manager's response to an organizational buy-in scenario as part of a skills assessment. Your job is to evaluate how well they applied product judgment to get buy-in from a skeptical stakeholder, not how well-written the response is.

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

function callGroqAndParse_(answer, apiKey, strict) {
  var promptText = GRADING_PROMPT_.replace('{{answer}}', answer);
  var messages = [{ role: 'system', content: promptText }];
  messages.push(
    strict
      ? { role: 'user', content: 'Return ONLY the JSON object described above. No explanation, no markdown fences, no text before or after it.' }
      : { role: 'user', content: 'Grade the response now.' }
  );

  var response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify({
      model: GROQ_MODEL_,
      messages: messages,
      temperature: 0,
      max_tokens: 600
    }),
    muteHttpExceptions: true
  });

  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('Groq API error ' + status + ': ' + response.getContentText());
  }

  var data = JSON.parse(response.getContentText());
  var raw = data.choices[0].message.content;
  var cleaned = raw.replace(/```json|```/g, '').trim();
  var parsed = JSON.parse(cleaned); // throws on invalid JSON - caller retries once, stricter

  var requiredFields = ['checks', 'total', 'tier', 'internal_rationale', 'user_facing_feedback'];
  for (var i = 0; i < requiredFields.length; i++) {
    if (!(requiredFields[i] in parsed)) throw new Error('Missing field: ' + requiredFields[i]);
  }
  return parsed;
}

/* Best-effort audit log in its own sheet tab, created on first use.
   Never let a logging failure affect the response sent back. */
function logScenarioGrading_(answer, result, note) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('ScenarioGrading');
    if (!sheet) {
      sheet = ss.insertSheet('ScenarioGrading');
      sheet.appendRow(['Timestamp', 'Answer', 'Total', 'Tier', 'Internal Rationale', 'User Feedback', 'Note']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(),
      answer,
      result ? result.total : '',
      result ? result.tier : '',
      result ? result.internal_rationale : '',
      result ? result.user_facing_feedback : '',
      note || ''
    ]);
  } catch (err) {
    // best-effort only
  }
}

/**
 * Grades one scenario answer. Returns exactly the shape the client
 * expects: { tier, total, user_facing_feedback } plus skipped_grading
 * or grading_error when applicable. internal_rationale is deliberately
 * left out of this return value - it only ever reaches the sheet.
 */
function gradeScenario_(answer) {
  if (looksLikeGibberish_(answer)) {
    logScenarioGrading_(answer, null, 'skipped: too short or gibberish');
    return {
      tier: 'no_experience',
      total: 0,
      user_facing_feedback: "We couldn't find enough detail in your response to evaluate it. Try describing specifically what you'd say to the VP and how you'd scope the pilot.",
      skipped_grading: true
    };
  }

  var apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  if (!apiKey) {
    logScenarioGrading_(answer, null, 'missing GROQ_API_KEY script property');
    return {
      tier: 'moderate',
      total: null,
      user_facing_feedback: "We had trouble scoring this response automatically. It's been flagged for manual review.",
      grading_error: true
    };
  }

  var result;
  try {
    result = callGroqAndParse_(answer, apiKey, false);
  } catch (firstErr) {
    try {
      result = callGroqAndParse_(answer, apiKey, true);
    } catch (secondErr) {
      logScenarioGrading_(answer, null, 'grading failed twice: ' + secondErr.message);
      return {
        tier: 'moderate',
        total: null,
        user_facing_feedback: "We had trouble scoring this response automatically. It's been flagged for manual review.",
        grading_error: true
      };
    }
  }

  logScenarioGrading_(answer, result, null);
  return { tier: result.tier, total: result.total, user_facing_feedback: result.user_facing_feedback };
}


/* ===================================================================
   3. Daily limits + usage report
   =================================================================== */

// Two scored responses per respondent per day, plus a global ceiling that
// bounds cost no matter how many ids someone invents. 100 sits under Groq's
// published openai/gpt-oss-120b limits (1K requests but only 200K tokens a
// day; each grading uses roughly 1.5-2K tokens). Confirm your own account's
// limits at console.groq.com before raising it.
var SCENARIO_DAILY_LIMIT_PER_CLIENT_ = 2;
var SCENARIO_DAILY_LIMIT_GLOBAL_ = 100;

function takeScenarioQuota_(clientId) {
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var cid = String(clientId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  var globalKey = 'quota_' + today + '_global';
  var clientKey = 'quota_' + today + '_c_' + cid;

  var lock = null;
  var locked = false;
  try {
    lock = LockService.getScriptLock();
    locked = lock.tryLock(5000);
  } catch (e) { /* proceed unlocked; worst case a rare miscount */ }
  try {
    if (!props.getProperty(globalKey)) {
      // First request of the day: drop yesterday's counters.
      var keys = props.getKeys();
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('quota_') === 0 && keys[i].indexOf('quota_' + today) !== 0) {
          props.deleteProperty(keys[i]);
        }
      }
    }

    var globalCount = Number(props.getProperty(globalKey) || 0);
    if (globalCount >= SCENARIO_DAILY_LIMIT_GLOBAL_) {
      return { ok: false, reason: 'global daily cap reached' };
    }

    // An empty id (old cached page, storage blocked) is held only to the
    // global cap - a shared "anonymous" bucket would lock everyone out.
    if (cid) {
      var clientCount = Number(props.getProperty(clientKey) || 0);
      if (clientCount >= SCENARIO_DAILY_LIMIT_PER_CLIENT_) {
        return { ok: false, reason: 'per-respondent daily limit reached' };
      }
      props.setProperty(clientKey, String(clientCount + 1));
    }
    props.setProperty(globalKey, String(globalCount + 1));
    return { ok: true };
  } finally {
    if (locked) lock.releaseLock();
  }
}

/**
 * What doGet calls for action=gradeScenario. Too-short or gibberish answers
 * never reach Groq, so they don't use up one of the respondent's turns.
 */
function gradeScenarioWithQuota_(answer, clientId) {
  if (looksLikeGibberish_(answer)) return gradeScenario_(answer);

  var quota = takeScenarioQuota_(clientId);
  if (!quota.ok) {
    logScenarioGrading_(answer, null, 'blocked: ' + quota.reason);
    refreshUsageReportIfStale_();
    return {
      tier: 'moderate',
      total: null,
      user_facing_feedback: "You've reached today's limit for scored scenario responses. Your results are based on the multiple-choice questions - try the scenario again tomorrow.",
      skipped_grading: true,
      rate_limited: true
    };
  }

  var result = gradeScenario_(answer);
  refreshUsageReportIfStale_();
  return result;
}

var USAGE_SHEET_NAME_ = 'Usage';
// Tier 0 ceiling from the architecture plan: roughly 1,000 assessments a month.
var USAGE_TIER0_MONTHLY_CEILING_ = 1000;

/**
 * Rebuilds the "Usage" tab from the Funnel and ScenarioGrading tabs: one row
 * per day, plus a last-30-days total and a plain-English tier signal. Runs
 * itself at most once an hour when the grading endpoint is hit, and can also
 * be run by hand from the editor.
 */
function refreshUsageReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = Session.getScriptTimeZone();
  var days = {};
  function day(d) {
    var key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    if (!days[key]) days[key] = { started: 0, graded: 0, blocked: 0, errors: 0 };
    return days[key];
  }

  var funnel = ss.getSheetByName('Funnel');
  if (funnel && funnel.getLastRow() > 1) {
    funnel.getRange(2, 1, funnel.getLastRow() - 1, 3).getValues().forEach(function (r) {
      if (r[2] === 'assessmentStarted' && r[0] instanceof Date) day(r[0]).started++;
    });
  }

  var grading = ss.getSheetByName('ScenarioGrading');
  if (grading && grading.getLastRow() > 1) {
    grading.getRange(2, 1, grading.getLastRow() - 1, 7).getValues().forEach(function (r) {
      if (!(r[0] instanceof Date)) return;
      var note = String(r[6] || '');
      var d = day(r[0]);
      if (note.indexOf('blocked') === 0) d.blocked++;
      else if (note.indexOf('skipped') === 0) return;
      else if (note) d.errors++;
      else d.graded++;
    });
  }

  var dates = Object.keys(days).sort().reverse();
  var rows = dates.map(function (k) {
    var d = days[k];
    return [k, d.started, d.graded, d.blocked, d.errors];
  });

  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  var cutoffKey = Utilities.formatDate(cutoff, tz, 'yyyy-MM-dd');
  var last30 = 0;
  dates.forEach(function (k) { if (k >= cutoffKey) last30 += days[k].started; });

  var todayKey = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var gradedToday = days[todayKey] ? days[todayKey].graded : 0;

  var signal;
  if (last30 >= USAGE_TIER0_MONTHLY_CEILING_) signal = 'Over Tier 0 volume - time to plan the Tier 1 upgrade';
  else if (last30 >= USAGE_TIER0_MONTHLY_CEILING_ * 0.8) signal = 'Approaching the Tier 0 ceiling - start planning Tier 1';
  else signal = 'Comfortably inside Tier 0 (free)';
  if (gradedToday >= SCENARIO_DAILY_LIMIT_GLOBAL_ * 0.8) signal += ' | grading is near its daily cap';

  var sheet = ss.getSheetByName(USAGE_SHEET_NAME_) || ss.insertSheet(USAGE_SHEET_NAME_);
  sheet.clear();
  sheet.getRange(1, 1, 1, 5)
    .setValues([['Date', 'Assessments started', 'Scenario graded', 'Scenario blocked (limit)', 'Grading errors']])
    .setFontWeight('bold');
  if (rows.length) sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  sheet.getRange(1, 7, 3, 2).setValues([
    ['Assessments started, last 30 days', last30],
    ['Tier signal', signal],
    ['Refreshed', new Date()]
  ]);
  sheet.setFrozenRows(1);
}

function refreshUsageReportIfStale_() {
  try {
    var props = PropertiesService.getScriptProperties();
    var last = Number(props.getProperty('usage_refreshed_at') || 0);
    if (Date.now() - last < 60 * 60 * 1000) return;
    props.setProperty('usage_refreshed_at', String(Date.now()));
    refreshUsageReport();
  } catch (err) {
    // best-effort only
  }
}
