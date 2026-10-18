/* ==================================================================
   PRODUCT ADVISORY — ASSESSMENT RESULTS BACKEND
   Paste this entire file into the Apps Script editor (Extensions >
   Apps Script from inside your Google Sheet). See the setup steps
   for how to deploy it. You should not need to edit anything below
   unless you rename a category or lead field in the HTML files.
   ================================================================== */

const CATEGORY_KEYS = ["discovery", "strategy", "prioritization", "execution", "stakeholder", "aiIndividual", "aiOrg"];
const QUESTION_COUNT = 14; // matches the number of questions in the assessment
const SHEET_NAME = "Responses";
const PROGRESS_SHEET_NAME = "Progress";
const PROGRESS_HEADER = ["Last Updated", "Email", "Domain", "Tier", "Course ID", "Assignment Status", "Lessons Completed", "Total Lessons", "Percent Complete", "Course Status"];

// Runs when the assessment page submits a completed result, when the LMS
// dashboard syncs someone's course progress (data.action === "syncProgress"),
// or when someone sends the "Request more information" form (data.action === "requestInfo").
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // Anonymous drop-off events from the assessment page. These must be
  // caught here, or they would be saved as blank assessment results.
  if (data.action === "funnel") {
    return handleFunnelEvent_(data);
  }

  if (data.action === "syncProgress") {
    return handleProgressSync(data);
  }

  // A "Request more information" form (request-info.html).
  if (data.action === "requestInfo") {
    return handleLeadRequest_(data);
  }

  const sheet = getOrCreateSheet();

  const row = [
    new Date(),
    data.name || "",
    data.email || "",
    data.company || "",
    data.jobTitle || "",
    data.companySize || "",
    data.industry || "",
    data.overallPct || 0,
    data.tier || ""
  ];
  CATEGORY_KEYS.forEach(function (key) {
    row.push(data[key + "Pct"] || 0);
  });
  for (let i = 1; i <= QUESTION_COUNT; i++) {
    row.push(data["q" + i] || "");
  }
  // Same id the browser saves on the person's Firestore result, so the
  // two records of one assessment can be matched up.
  row.push(data.assessmentId || "");

  sheet.appendRow(row);
  return ContentService.createTextOutput("OK");
}

// Upserts one row per (email, courseId) pair — updates the existing row if
// found, otherwise appends a new one. This keeps the Progress sheet as a
// current snapshot instead of growing forever with duplicate history.
function handleProgressSync(data) {
  const sheet = getOrCreateProgressSheet();
  const values = sheet.getDataRange().getValues();

  data.rows.forEach(function (r) {
    const rowData = [
      new Date(), r.email, r.domain, r.tier, r.courseId,
      r.status, r.lessonsCompleted, r.totalLessons, r.percentComplete, r.courseStatus
    ];

    let foundIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === r.email && values[i][4] === r.courseId) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex > -1) {
      sheet.getRange(foundIndex + 1, 1, 1, rowData.length).setValues([rowData]);
      values[foundIndex] = rowData;
    } else {
      sheet.appendRow(rowData);
      values.push(rowData);
    }
  });

  return ContentService.createTextOutput("OK");
}

function getOrCreateProgressSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PROGRESS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PROGRESS_SHEET_NAME);
    sheet.appendRow(PROGRESS_HEADER);
  }
  return sheet;
}

// Runs when the dashboard page requests aggregate stats, when the
// assessment page requests the list of known company names or a
// scenario grading, or when someone closes their account.
function doGet(e) {
  if (e.parameter.action === "mailCheck") {
    return jsonpOut_(e.parameter.callback, mailCheck_());
  }

  // Owner-only reports (reports.html). Each one re-checks the caller's sign-in token.
  if (e.parameter.action === "reports") {
    return jsonpOut_(e.parameter.callback, reportsEndpoint_(e.parameter.idToken || "", e.parameter.days));
  }

  if (e.parameter.action === "reportsLeads") {
    return jsonpOut_(e.parameter.callback, reportsLeadsEndpoint_(e.parameter.idToken || ""));
  }

  if (e.parameter.action === "reportsAi") {
    return jsonpOut_(e.parameter.callback, reportsAiEndpoint_(e.parameter.idToken || "", e.parameter.section || "", e.parameter.days));
  }

  // The welcome email for a brand-new account (once per account), and the company admin's "Explain with AI".
  if (e.parameter.action === "welcome") {
    return jsonpOut_(e.parameter.callback, welcomeEndpoint_(e.parameter.idToken || ""));
  }

  if (e.parameter.action === "orgReportAi") {
    return jsonpOut_(e.parameter.callback, orgReportAiEndpoint_(e.parameter.idToken || "", e.parameter.org || "", e.parameter.facts || ""));
  }

  if (e.parameter.action === "leadsCheck") {
    return jsonpOut_(e.parameter.callback, leadsCheck_());
  }

  if (e.parameter.action === "leadStatus") {
    return jsonpOut_(e.parameter.callback, leadStatus_(e.parameter.id || ""));
  }

  if (e.parameter.action === "sendInvite") {
    return jsonpOut_(e.parameter.callback, sendInviteEmail_(e.parameter.token || "", e.parameter.idToken || ""));
  }

  if (e.parameter.action === "deleteAccount") {
    return jsonpOut_(e.parameter.callback, deleteAccountData_(e.parameter.token || ""));
  }

  if (e.parameter.action === "gradeScenario") {
    return jsonpOut_(e.parameter.callback, gradeScenarioWithQuota_(e.parameter.answer || "", e.parameter.cid || ""));
  }

  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // drop header row

  if (e.parameter.action === "companies") {
    const names = rows.map(function (r) { return r[3]; }).filter(function (v) { return v; });
    const unique = Array.from(new Set(names)).sort();
    const callback = e.parameter.callback;
    const json = JSON.stringify(unique);
    const output = callback ? (callback + "(" + json + ")") : json;
    const mimeType = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
    return ContentService.createTextOutput(output).setMimeType(mimeType);
  }

  // Runs when the LMS dashboard looks up someone's most recent
  // assessment result (by email) to build their recommendations.
  if (e.parameter.action === "lookup") {
    const email = (e.parameter.email || "").toLowerCase().trim();
    let match = null, firstMatch = null;
    rows.forEach(function (r) {
      if (String(r[2]).toLowerCase().trim() === email) {
        if (!firstMatch) firstMatch = r; // first one encountered is the earliest submission
        match = r; // later rows keep overwriting, so this ends up the most recent
      }
    });

    let result = null;
    if (match) {
      result = {
        overallPct: match[7], tier: match[8], categoryPct: {}, submittedAt: match[0], firstSubmittedAt: firstMatch[0],
        firstOverallPct: firstMatch[7], firstTier: firstMatch[8]
      };
      CATEGORY_KEYS.forEach(function (key, i) {
        result.categoryPct[key] = match[9 + i];
      });
    }

    const callback = e.parameter.callback;
    const json = JSON.stringify(result);
    const output = callback ? (callback + "(" + json + ")") : json;
    const mimeType = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
    return ContentService.createTextOutput(output).setMimeType(mimeType);
  }

  const stats = {
    totalCompletions: rows.length,
    tierCounts: {},
    categoryAverages: {}
  };

  CATEGORY_KEYS.forEach(function (key) { stats.categoryAverages[key] = 0; });

  if (rows.length > 0) {
    rows.forEach(function (r) {
      const tier = r[8];
      stats.tierCounts[tier] = (stats.tierCounts[tier] || 0) + 1;
    });
    CATEGORY_KEYS.forEach(function (key, i) {
      const colIndex = 9 + i; // categories start at column J (index 9)
      const sum = rows.reduce(function (acc, r) { return acc + (Number(r[colIndex]) || 0); }, 0);
      stats.categoryAverages[key] = Math.round(sum / rows.length);
    });
  }

  const callback = e.parameter.callback;
  const json = JSON.stringify(stats);
  const output = callback ? (callback + "(" + json + ")") : json;
  const mimeType = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;

  return ContentService.createTextOutput(output).setMimeType(mimeType);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  const fullHeader = [
    "Timestamp", "Name", "Email", "Company", "Job Title", "Company Size", "Industry",
    "Overall %", "Tier",
    "Discovery %", "Strategy %", "Prioritization %", "Execution %", "Stakeholder %", "AI Individual %", "AI Org %"
  ];
  for (let i = 1; i <= QUESTION_COUNT; i++) fullHeader.push("Q" + i);
  fullHeader.push("Assessment ID");

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(fullHeader);
  } else {
    // If this sheet was created before question-level tracking was
    // added, extend its header row so the new Q1-Q14 columns line
    // up correctly with the data appendRow will add.
    const currentHeaderWidth = sheet.getLastColumn();
    if (currentHeaderWidth < fullHeader.length) {
      sheet.getRange(1, currentHeaderWidth + 1, 1, fullHeader.length - currentHeaderWidth)
        .setValues([fullHeader.slice(currentHeaderWidth)]);
    }
  }
  return sheet;
}

// ================== Scenario grading (added) ==================

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



// ================== Daily limits, usage report, account deletion (added) ==================

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


/* ===================================================================
   4. Account deletion (the "Delete account" card on profile.html)
   ===================================================================
   Wire-up: add this at the top of doGet(e), next to the gradeScenario line:

   if (e.parameter.action === "deleteAccount") {
     return jsonpOut_(e.parameter.callback, deleteAccountData_(e.parameter.token || ""));
   }

   The browser sends the person's Firebase ID token. This asks Google to
   confirm who it belongs to, then removes that email's rows from the
   Responses and Progress tabs. It cannot reach the ScenarioGrading and
   Funnel tabs, which hold no identity. Rows saved under an email address
   the person has since changed are also not matched.
*/

// Public by design: this is the same web API key shipped in every page's
// firebaseConfig. It only identifies the Firebase project.
var FIREBASE_WEB_API_KEY_ = 'AIzaSyAcECtS5c6WeOhKlwRK-LYFE47npbuq_eU';

function verifyFirebaseIdToken_(idToken) {
  if (!idToken) return null;
  var response = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_WEB_API_KEY_,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Referer: 'https://assessment.productadvisory.co/' },
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true
    }
  );
  if (response.getResponseCode() !== 200) return null;
  var users = JSON.parse(response.getContentText()).users;
  if (!users || !users.length || !users[0].email) return null;
  return {
    uid: users[0].localId,
    email: String(users[0].email).toLowerCase().trim(),
    name: String(users[0].displayName || '').slice(0, 80),
    createdAtMs: Number(users[0].createdAt) || 0
  };
}

// Deletes every row whose email column matches, bottom-up so row numbers
// stay valid. emailIndex is zero-based. Returns how many rows were removed.
function deleteRowsByEmail_(sheet, emailIndex, email) {
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var values = sheet.getRange(2, emailIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  var removed = 0;
  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0]).toLowerCase().trim() === email) {
      sheet.deleteRow(i + 2);
      removed++;
    }
  }
  return removed;
}

function deleteAccountData_(idToken) {
  var who = null;
  try { who = verifyFirebaseIdToken_(idToken); } catch (err) { who = null; }
  if (!who) return { ok: false, error: 'not_verified' };

  var lock = null;
  var locked = false;
  try {
    lock = LockService.getScriptLock();
    locked = lock.tryLock(15000);
  } catch (e) { /* proceed unlocked */ }
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return {
      ok: true,
      removed: {
        responses: deleteRowsByEmail_(ss.getSheetByName(SHEET_NAME), 2, who.email),
        progress: deleteRowsByEmail_(ss.getSheetByName(PROGRESS_SHEET_NAME), 1, who.email),
        welcomes: deleteRowsByEmail_(ss.getSheetByName(WELCOME_SHEET_NAME_), 2, who.email)
      }
    };
  } catch (err) {
    return { ok: false, error: 'sheet_error' };
  } finally {
    if (locked) lock.releaseLock();
  }
}


// ================== Funnel events (added) ==================

var FUNNEL_SHEET_NAME = 'Funnel';
var FUNNEL_HEADERS = ['Received', 'Client Timestamp', 'Event', 'Tier', 'Raw'];

/**
 * Appends one anonymous funnel event to the "Funnel" tab (created with
 * headers on first use). Serialised with a script lock because a web app
 * can process requests concurrently.
 */
function handleFunnelEvent_(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(FUNNEL_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(FUNNEL_SHEET_NAME);
      sheet.appendRow(FUNNEL_HEADERS);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),                  // server receive time
      data.ts || '',               // client ISO timestamp
      String(data.event || ''),    // assessmentStarted | resultsViewed | accountCreated
      String(data.tier || ''),     // tier band when the event carries one
      JSON.stringify(data)         // full payload, forward-compatible with new fields
    ]);

    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ================== Invite emails (added) ==================
//
// The owner console's "Send email" button calls this with an invite's secret
// token and the signed-in person's Firebase ID token. The script re-reads the
// invite from Firestore AS THAT PERSON (so the security rules decide what it
// may see), and only sends if that same person created the invite, it is still
// open, and it has not been emailed too often. The recipient and the link
// always come from the stored invite, never from the request, so this cannot
// be used to send arbitrary mail.

var FIRESTORE_PROJECT_ID_ = 'product-advisory-lms';
var SITE_BASE_URL_ = 'https://assessment.productadvisory.co/';
// A Gmail account may send to 100 recipients a day; stay under that so other
// mail from this account keeps working.
var INVITE_EMAIL_DAILY_CAP_ = 80;
var INVITE_EMAIL_MAX_PER_INVITE_ = 3;

function escapeHtml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Reads one invite document over Firestore's REST API using the caller's own
// ID token. Returns null if it cannot be read.
function fetchInviteViaRest_(token, idToken) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT_ID_ +
    '/databases/(default)/documents/invites/' + encodeURIComponent(token);
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + idToken },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) return { error: 'Firestore answered ' + res.getResponseCode() };
  var f = JSON.parse(res.getContentText()).fields || {};
  function str(k) { return f[k] && f[k].stringValue !== undefined ? f[k].stringValue : ''; }
  return {
    orgName: str('orgName'),
    email: str('email'),
    name: str('name'),
    role: str('role'),
    status: str('status'),
    createdBy: str('createdBy'),
    expiresAtMs: f.expiresAt && f.expiresAt.timestampValue ? Date.parse(f.expiresAt.timestampValue) : 0
  };
}

function buildInviteEmail_(inv, inviterEmail, link) {
  var org = inv.orgName;
  var roleText = inv.role === 'admin' ? 'an admin' : 'a member';
  var expires = Utilities.formatDate(new Date(inv.expiresAtMs), Session.getScriptTimeZone(), 'MMMM d, yyyy');
  var greeting = inv.name ? 'Hi ' + inv.name + ',' : 'Hi,';

  var text = greeting + '\n\n' +
    inviterEmail + ' has invited you to join ' + org + ' on Product Advisory Learning as ' + roleText + '.\n\n' +
    'Open your invitation:\n' + link + '\n\n' +
    'The link works once and expires on ' + expires + '. When you open it you can sign in or create an account ' +
    '(any email address works), and you will see exactly what ' + org + ' can see before you agree to join.\n\n' +
    'If you were not expecting this, you can ignore this email.\n';

  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#16213E;max-width:520px;">' +
    '<p>' + escapeHtml_(greeting) + '</p>' +
    '<p>' + escapeHtml_(inviterEmail) + ' has invited you to join <strong>' + escapeHtml_(org) +
    '</strong> on Product Advisory Learning as ' + roleText + '.</p>' +
    '<p style="margin:24px 0;"><a href="' + escapeHtml_(link) + '" style="background:#1A4584;color:#ffffff;text-decoration:none;' +
    'padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block;">Open your invitation</a></p>' +
    '<p>The link works once and expires on ' + escapeHtml_(expires) + '. When you open it you can sign in or create an ' +
    'account (any email address works), and you will see exactly what ' + escapeHtml_(org) + ' can see before you agree to join.</p>' +
    '<p style="color:#6B7686;font-size:13px;">If you were not expecting this, you can ignore this email.</p></div>';

  return {
    subject: "You're invited to join " + org + ' on Product Advisory Learning',
    text: text,
    html: html
  };
}

function sendInviteEmail_(token, idToken) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(String(token || ''))) return { ok: false, error: 'bad_token' };

  var who = null;
  var verifyDetail = '';
  try { who = verifyFirebaseIdToken_(idToken); } catch (err) { who = null; verifyDetail = String(err && err.message || err).slice(0, 200); }
  if (!who) return { ok: false, error: 'not_verified', detail: verifyDetail || 'Google did not accept the sign-in token' };

  var inv = null;
  var readDetail = '';
  try { inv = fetchInviteViaRest_(token, idToken); } catch (err) { inv = null; readDetail = String(err && err.message || err).slice(0, 200); }
  if (!inv || inv.error) return { ok: false, error: 'invite_not_found', detail: readDetail || (inv && inv.error) || 'Could not read the invite' };
  if (inv.createdBy !== who.uid) return { ok: false, error: 'not_your_invite' };
  if (inv.status !== 'open' || inv.expiresAtMs < Date.now()) return { ok: false, error: 'invite_not_open' };
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(inv.email)) return { ok: false, error: 'bad_recipient' };

  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var dayKey = 'mailday_' + today;
  var tokKey = 'mailtok_' + token;

  var lock = null;
  var locked = false;
  try {
    lock = LockService.getScriptLock();
    locked = lock.tryLock(10000);
  } catch (err) { /* proceed unlocked */ }
  try {
    if (!props.getProperty(dayKey)) {
      // First email of the day: drop old daily counters, and per-invite counters older than 120 days.
      var keys = props.getKeys();
      var cutoff = Date.now() - 120 * 86400000;
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('mailday_') === 0 && keys[i] !== dayKey) props.deleteProperty(keys[i]);
        if (keys[i].indexOf('mailtok_') === 0) {
          var parts = String(props.getProperty(keys[i])).split('|');
          if (Number(parts[1]) < cutoff) props.deleteProperty(keys[i]);
        }
      }
    }

    var sentToday = Number(props.getProperty(dayKey) || 0);
    if (sentToday >= INVITE_EMAIL_DAILY_CAP_) return { ok: false, error: 'daily_limit' };

    var prior = String(props.getProperty(tokKey) || '0|0').split('|');
    if (Number(prior[0]) >= INVITE_EMAIL_MAX_PER_INVITE_) return { ok: false, error: 'too_many_for_invite' };

    if (MailApp.getRemainingDailyQuota() < 1) return { ok: false, error: 'quota' };

    var mail = buildInviteEmail_(inv, who.email, SITE_BASE_URL_ + 'join.html?token=' + token);
    try {
      sendMail_({
        to: inv.email,
        subject: mail.subject,
        body: mail.text,
        htmlBody: mail.html,
        name: 'Product Advisory Learning',
        replyTo: who.email
      }, 'assessment');
    } catch (err) {
      return { ok: false, error: 'mail_error', detail: String(err && err.message || err).slice(0, 200) };
    }

    props.setProperty(dayKey, String(sentToday + 1));
    props.setProperty(tokKey, (Number(prior[0]) + 1) + '|' + Date.now());
    return { ok: true, to: inv.email, remainingToday: Math.max(0, INVITE_EMAIL_DAILY_CAP_ - sentToday - 1) };
  } finally {
    if (locked) lock.releaseLock();
  }
}

// Diagnostic: sends one short message to the account that owns this script (never
// to anyone else) and reports exactly what happened, including Gmail's own error
// text. Limited to 5 a day. Safe to leave in; it reveals nothing but a masked address.
function mailCheck_() {
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var key = 'mailcheck_' + today;
  var used = Number(props.getProperty(key) || 0);
  if (used >= 5) return { ok: false, error: 'limit', detail: 'Mail check already run 5 times today' };
  props.setProperty(key, String(used + 1));

  var to = Session.getEffectiveUser().getEmail();
  var masked = to ? to.charAt(0) + '***' + to.slice(to.indexOf('@')) : '(no address)';
  var quota = null;
  try { quota = MailApp.getRemainingDailyQuota(); } catch (err) {
    return { ok: false, step: 'quota', detail: String(err && err.message || err).slice(0, 300), to: masked };
  }
  try {
    MailApp.sendEmail(to, 'Product Advisory mail check', 'If you can read this, the script can send email from your account.');
  } catch (err) {
    return { ok: false, step: 'send', quota: quota, detail: String(err && err.message || err).slice(0, 300), to: masked };
  }
  return { ok: true, quotaBeforeSending: quota, to: masked };
}

// Run this ONCE from the Apps Script editor to give the script permission to
// send email. It sends one test message to the account that owns the script.
function authorizeInviteEmails() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Product Advisory invite emails are set up',
    'This confirms the script can send invite emails. You can delete this message.');
}


/* ==================================================================
   7. REQUEST MORE INFORMATION (request-info.html)
   ------------------------------------------------------------------
   Each completed form is checked, scored, saved as a row on the "Leads"
   tab, and announced to LEAD_NOTIFY_EMAIL_ with the lead's own email as
   the Reply-To, so replying to the notice answers them directly.

   Spam protection (a public form always attracts some): a hidden field
   real people never fill in, a minimum fill time, one request id is only
   ever saved once, at most LEAD_PER_EMAIL_DAILY_ requests per email
   address and LEAD_DAILY_CAP_ in total per day, strict length limits and
   a fixed list of allowed answers. The fit score is worked out HERE, so
   it cannot be changed from the browser, and the person never sees it.
   ================================================================== */

var LEAD_NOTIFY_EMAIL_ = 'rob@productadvisory.co';
var LEAD_SHEET_NAME_ = 'Leads';
// Each saved request sends two emails (one to Rob, one thank-you to the person) and Gmail allows about 100 a
// day for the whole script, so this stays well under half of that.
var LEAD_DAILY_CAP_ = 40;
var LEAD_REPLY_TO_ = 'sales@productadvisory.co';            // where a reply to the thank-you email goes
var LEAD_REPLY_WINDOW_ = 'within two business days';        // keep the same as REPLY_WINDOW in lead-core.js (a test checks)
var LEAD_BOOKING_URL_ = 'https://calendly.com/productadvisory/30min';
var LEAD_PER_EMAIL_DAILY_ = 3;
var LEAD_MIN_FILL_MS_ = 2500;
var LEAD_HEADERS_ = ['Received', 'Lead ID', 'Name', 'Email', 'Company', 'Phone', 'I am', 'Interested in', 'Team size', 'Timeline',
  'Who decides', 'Contact preference', 'Message', 'Fit', 'Score', 'Why', 'Source', 'Assessment level', 'Assessment scores', 'Status', 'Notes'];

// The only answers the form may send. Keep in step with lead-core.js (a test checks).
var LEAD_OPTIONS_ = {
  who: { individual: "I'm exploring this for myself", leader: 'I lead a product team', org: "I'm looking for my organization", other: 'Something else' },
  interests: { discovery: 'Customer & market discovery', strategy: 'Product strategy & roadmapping', prioritization: 'Prioritization & trade-offs',
    execution: 'Execution & delivery', stakeholder: 'Stakeholder communication', aiIndividual: 'AI fluency for me', aiOrg: 'AI fluency for my organization',
    toolkits: 'Toolkits & templates', team_assessment: 'Assessing my whole team', notsure: 'Not sure yet' },
  size: { just_me: 'Just me', s2_10: '2 to 10 people', s11_50: '11 to 50 people', s51_200: '51 to 200 people', s200_plus: 'More than 200' },
  timeline: { this_month: 'This month', this_quarter: 'In the next 3 months', later: 'Later this year', exploring: 'Just exploring' },
  role: { decide: 'I make the decision', influence: 'I influence the decision', approval: 'I need approval from someone else', unsure: 'Not sure yet' },
  contact: { email: 'Email me', call: 'A short call is fine' }
};
var LEAD_FREE_EMAIL_DOMAINS_ = ['gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com',
  'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com'];

// Lets the page check, before showing the form, that this version of the script is deployed.
function leadsCheck_() {
  return { ok: true, leads: true };
}

// The page asks, after sending, whether its request was recorded. The answer is
// kept for ten minutes under the request's random id.
function leadStatus_(id) {
  if (!/^[0-9a-f]{24}$/.test(String(id || ''))) return { ok: false, error: 'bad_id' };
  var raw = CacheService.getScriptCache().get('leadres_' + id);
  if (!raw) return { ok: true, found: false };
  var res = JSON.parse(raw);
  return { ok: res.ok === true, found: true, error: res.error || '' };
}

function leadClean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// A spreadsheet cell that starts with = + - @ can run as a formula when the
// sheet is opened, and every value here comes from a stranger.
function leadSafeCell_(v) {
  if (typeof v !== 'string') return v;               // numbers and dates are safe, and stay numbers and dates
  return /^[=+\-@\t\r]/.test(v) && !/^[+-]?[\d\s().-]+$/.test(v) ? "'" + v : v;
}

// Returns { ok: true, lead } with every field checked and trimmed, or { ok: false, error }.
function leadValidate_(data) {
  var id = String(data.id || '');
  if (!/^[0-9a-f]{24}$/.test(id)) return { ok: false, error: 'bad_id' };

  var lead = {
    id: id,
    name: leadClean_(data.name, 80),
    email: leadClean_(data.email, 120).toLowerCase(),
    company: leadClean_(data.company, 80),
    phone: leadClean_(data.phone, 40),
    message: leadClean_(data.message, 400),
    source: /^[a-z0-9_-]{1,30}$/i.test(String(data.source || '')) ? String(data.source).toLowerCase() : '',
    who: String(data.who || ''),
    size: String(data.size || ''),
    timeline: String(data.timeline || ''),
    role: String(data.role || ''),
    contactPref: data.contactPref === 'call' ? 'call' : 'email',
    interests: []
  };
  if (!lead.name) return { ok: false, error: 'invalid' };
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(lead.email)) return { ok: false, error: 'invalid' };
  if (data.consent !== true) return { ok: false, error: 'no_consent' };
  if (!LEAD_OPTIONS_.who[lead.who]) return { ok: false, error: 'invalid' };
  if (!LEAD_OPTIONS_.timeline[lead.timeline]) return { ok: false, error: 'invalid' };
  if (lead.size && !LEAD_OPTIONS_.size[lead.size]) return { ok: false, error: 'invalid' };
  if (lead.role && !LEAD_OPTIONS_.role[lead.role]) return { ok: false, error: 'invalid' };

  var seen = {};
  (Array.isArray(data.interests) ? data.interests : []).forEach(function (c) {
    c = String(c);
    if (LEAD_OPTIONS_.interests[c] && !seen[c] && lead.interests.length < 3) { seen[c] = true; lead.interests.push(c); }
  });
  if (!lead.interests.length) return { ok: false, error: 'invalid' };

  // The assessment is only present when the person ticked the box to share it.
  lead.assessment = null;
  var a = data.assessment;
  if (a && typeof a === 'object') {
    var scores = {};
    ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder', 'aiIndividual', 'aiOrg'].forEach(function (k) {
      var n = Number(a.categoryPct && a.categoryPct[k]);
      if (isFinite(n)) scores[k] = Math.max(0, Math.min(100, Math.round(n)));
    });
    lead.assessment = { tier: leadClean_(a.tier, 40), overallPct: Math.max(0, Math.min(100, Math.round(Number(a.overallPct) || 0))), scores: scores };
  }
  return { ok: true, lead: lead };
}

// How good a fit this request looks for Rob. Only Rob sees it.
function leadScore_(lead) {
  var pts = 0, why = [];
  function add(n, text) { if (n > 0) { pts += n; why.push(text + ' (+' + n + ')'); } }

  add({ org: 30, leader: 20, individual: 5, other: 5 }[lead.who] || 0, LEAD_OPTIONS_.who[lead.who]);
  add({ s200_plus: 25, s51_200: 22, s11_50: 15, s2_10: 8, just_me: 0 }[lead.size] || 0, lead.size ? LEAD_OPTIONS_.size[lead.size] : '');
  add({ this_month: 25, this_quarter: 15, later: 5, exploring: 0 }[lead.timeline] || 0, 'Timeline: ' + LEAD_OPTIONS_.timeline[lead.timeline]);
  add({ decide: 20, influence: 12, approval: 6, unsure: 0 }[lead.role] || 0, lead.role ? LEAD_OPTIONS_.role[lead.role] : '');
  var domain = lead.email.split('@')[1] || '';
  if (LEAD_FREE_EMAIL_DOMAINS_.indexOf(domain) === -1) add(10, 'Work email address');
  if (lead.company) add(5, 'Gave a company');
  if (lead.message.length >= 30) add(5, 'Wrote a message');
  if (lead.contactPref === 'call') add(5, 'Open to a call');
  if (lead.interests.indexOf('team_assessment') > -1) add(5, 'Wants to assess a team');

  pts = Math.min(100, pts);
  return { score: pts, fit: pts >= 80 ? 'Hot' : pts >= 50 ? 'Warm' : 'Nurture', why: why };
}

function leadAssessmentText_(a) {
  if (!a) return { level: '', scores: '' };
  var names = { discovery: 'Discovery', strategy: 'Strategy', prioritization: 'Prioritization', execution: 'Execution', stakeholder: 'Stakeholder', aiIndividual: 'AI (individual)', aiOrg: 'AI (organization)' };
  var parts = Object.keys(a.scores).map(function (k) { return names[k] + ' ' + a.scores[k] + '%'; });
  return { level: a.tier + ' (' + a.overallPct + '% overall)', scores: parts.join(', ') };
}

// Counts requests per day and per email address, and refuses past the caps.
// Old counters are cleaned up on the first request of each day.
function leadRateOk_(email) {
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var dayKey = 'leadday_' + today;
  var emailKey = 'leademail_' + today + '_' + email;

  if (!props.getProperty(dayKey)) {
    props.getKeys().forEach(function (k) {
      if ((k.indexOf('leadday_') === 0 && k !== dayKey) || (k.indexOf('leademail_') === 0 && k.indexOf('leademail_' + today + '_') !== 0)) props.deleteProperty(k);
    });
  }
  var total = Number(props.getProperty(dayKey) || 0);
  var mine = Number(props.getProperty(emailKey) || 0);
  if (total >= LEAD_DAILY_CAP_ || mine >= LEAD_PER_EMAIL_DAILY_) return false;
  props.setProperty(dayKey, String(total + 1));
  props.setProperty(emailKey, String(mine + 1));
  return true;
}

function leadBuildEmail_(lead, scored, assess, sheetUrl) {
  var labelList = lead.interests.map(function (c) { return LEAD_OPTIONS_.interests[c]; }).join(', ');
  var rows = [
    ['Name', lead.name], ['Email', lead.email], ['Company', lead.company || '—'], ['Phone', lead.phone || '—'],
    ['I am', LEAD_OPTIONS_.who[lead.who]], ['Interested in', labelList],
    ['Team size', lead.size ? LEAD_OPTIONS_.size[lead.size] : '—'], ['Timeline', LEAD_OPTIONS_.timeline[lead.timeline]],
    ['Who decides', lead.role ? LEAD_OPTIONS_.role[lead.role] : '—'], ['Contact preference', LEAD_OPTIONS_.contact[lead.contactPref]],
    ['Message', lead.message || '—'], ['Came from', lead.source || '—']
  ];
  if (lead.assessment) { rows.push(['Assessment level', assess.level]); rows.push(['Assessment scores', assess.scores || '—']); }

  var subject = '[' + scored.fit + '] Info request: ' + lead.name + (lead.company ? ', ' + lead.company : '') + ' (' + lead.who + ', ' + LEAD_OPTIONS_.timeline[lead.timeline].toLowerCase() + ')';
  var text = 'New request for more information\n\nFit: ' + scored.fit + ' (score ' + scored.score + ' of 100)\nWhy: ' + (scored.why.join('; ') || 'nothing notable') + '\n\n' +
    rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') +
    '\n\nJust reply to this email to answer ' + lead.name + ' directly.' + (sheetUrl ? '\nAll leads: ' + sheetUrl : '') + '\n';
  var color = scored.fit === 'Hot' ? '#C0622A' : scored.fit === 'Warm' ? '#8A6410' : '#4B5768';
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#16213E;max-width:600px;">' +
    '<p style="margin:0 0 6px;"><strong style="color:' + color + ';font-size:16px;">' + escapeHtml_(scored.fit) + '</strong> &nbsp;score ' + scored.score + ' of 100</p>' +
    '<p style="margin:0 0 14px;color:#4B5768;font-size:13px;">' + escapeHtml_(scored.why.join('; ') || 'nothing notable') + '</p>' +
    '<table style="border-collapse:collapse;width:100%;">' +
    rows.map(function (r) {
      return '<tr><td style="padding:6px 10px;border-bottom:1px solid #E3E9F0;color:#6B7686;white-space:nowrap;vertical-align:top;">' + escapeHtml_(r[0]) +
        '</td><td style="padding:6px 10px;border-bottom:1px solid #E3E9F0;">' + escapeHtml_(r[1]) + '</td></tr>';
    }).join('') + '</table>' +
    '<p style="margin:14px 0 0;color:#6B7686;font-size:13px;">Reply to this email to answer ' + escapeHtml_(lead.name) + ' directly.' +
    (sheetUrl ? ' <a href="' + escapeHtml_(sheetUrl) + '">All leads</a>' : '') + '</p></div>';
  return { subject: subject, text: text, html: html };
}

// The thank-you the person gets straight after sending the form. It only goes to a request that was
// accepted and saved, never to one that was refused or dropped as spam.
function leadBuildAck_(lead) {
  var first = lead.name.split(' ')[0] || 'there';
  var wantsBooking = lead.who === 'leader' || lead.who === 'org' || lead.contactPref === 'call';
  var interests = lead.interests.map(function (c) { return LEAD_OPTIONS_.interests[c]; }).join(', ');
  var assessUrl = SITE_BASE_URL_ + 'index.html';
  var recap = [
    ['You are', LEAD_OPTIONS_.who[lead.who]],
    ['You are interested in', interests],
    ['When you would like to start', LEAD_OPTIONS_.timeline[lead.timeline]]
  ];
  if (lead.message) recap.push(['Your note', lead.message]);

  var text = 'Hi ' + first + ',\n\n' +
    'Welcome, and thanks for sharing a little about what you need. We have your request and we will get back to you ' + LEAD_REPLY_WINDOW_ + '.\n\n' +
    'What you told us:\n' + recap.map(function (r) { return '- ' + r[0] + ': ' + r[1]; }).join('\n') + '\n\n' +
    'While you wait:\n' +
    (wantsBooking ? '- Pick a time that suits you: ' + LEAD_BOOKING_URL_ + '\n' : '') +
    '- Take the free Product Learning Assessment: ' + assessUrl + '\n\n' +
    'If you did not make this request, you can ignore this email. Nothing more will happen.\n\n' +
    'Product Advisory\n';

  var button = function (href, label, solid) {
    return '<a href="' + escapeHtml_(href) + '" style="display:inline-block;margin:0 10px 10px 0;padding:12px 20px;border-radius:8px;font-weight:bold;text-decoration:none;' +
      (solid ? 'background:#1A4584;color:#ffffff;' : 'background:#ffffff;color:#12305e;border:2px solid #1A4584;') + '">' + escapeHtml_(label) + '</a>';
  };
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#16213E;max-width:540px;">' +
    '<p>Hi ' + escapeHtml_(first) + ',</p>' +
    '<p>Welcome, and thanks for sharing a little about what you need. We have your request and we will get back to you <strong>' + escapeHtml_(LEAD_REPLY_WINDOW_) + '</strong>.</p>' +
    '<p style="margin:18px 0 6px;color:#6B7686;font-size:13px;text-transform:uppercase;letter-spacing:.04em;">What you told us</p>' +
    '<table style="border-collapse:collapse;width:100%;font-size:14px;">' +
    recap.map(function (r) {
      return '<tr><td style="padding:5px 10px 5px 0;color:#6B7686;vertical-align:top;white-space:nowrap;">' + escapeHtml_(r[0]) + '</td><td style="padding:5px 0;">' + escapeHtml_(r[1]) + '</td></tr>';
    }).join('') + '</table>' +
    '<p style="margin:20px 0 10px;">While you wait:</p><p style="margin:0;">' +
    (wantsBooking ? button(LEAD_BOOKING_URL_, 'Pick a time that suits you', true) : '') +
    button(assessUrl, 'Take the free assessment', !wantsBooking) + '</p>' +
    '<p style="color:#6B7686;font-size:13px;margin-top:20px;">If you did not make this request, you can ignore this email. Nothing more will happen.</p>' +
    '<p style="margin-top:18px;">Product Advisory</p></div>';

  return { subject: 'Thanks, ' + first + ' - we have your request', text: text, html: html };
}

// Called by doPost. The browser cannot read a reply to a POST, so the answer is
// left in the cache for leadStatus_ to hand back.
function handleLeadRequest_(data) {
  var cache = CacheService.getScriptCache();
  var id = String(data && data.id || '');
  function remember(res) { if (/^[0-9a-f]{24}$/.test(id)) cache.put('leadres_' + id, JSON.stringify(res), 600); }
  var reply = ContentService.createTextOutput('OK');

  if (!/^[0-9a-f]{24}$/.test(id)) return reply;
  if (cache.get('leadres_' + id)) return reply;                       // the same request sent twice is saved once

  // Robots fill in every box and finish in a blink. Say "ok" so they move on, and save nothing.
  if (leadClean_(data.website, 100) !== '' || !(Number(data.elapsedMs) >= LEAD_MIN_FILL_MS_)) {
    remember({ ok: true, dropped: true });
    return reply;
  }

  var checked = leadValidate_(data);
  if (!checked.ok) { remember({ ok: false, error: checked.error }); return reply; }
  var lead = checked.lead;

  var lock = null, locked = false;
  try { lock = LockService.getScriptLock(); locked = lock.tryLock(10000); } catch (err) { /* carry on without it */ }
  try {
    if (!leadRateOk_(lead.email)) { remember({ ok: false, error: 'rate_limited' }); return reply; }

    var scored = leadScore_(lead);
    var assess = leadAssessmentText_(lead.assessment);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(LEAD_SHEET_NAME_);
    if (!sheet) {
      sheet = ss.insertSheet(LEAD_SHEET_NAME_);
      sheet.appendRow(LEAD_HEADERS_);
      sheet.setFrozenRows(1);
    }
    var row = [new Date(), lead.id, lead.name, lead.email, lead.company, lead.phone, LEAD_OPTIONS_.who[lead.who],
      lead.interests.map(function (c) { return LEAD_OPTIONS_.interests[c]; }).join(', '),
      lead.size ? LEAD_OPTIONS_.size[lead.size] : '', LEAD_OPTIONS_.timeline[lead.timeline], lead.role ? LEAD_OPTIONS_.role[lead.role] : '',
      LEAD_OPTIONS_.contact[lead.contactPref], lead.message, scored.fit, scored.score, scored.why.join('; '), lead.source,
      assess.level, assess.scores, 'New', ''];
    sheet.appendRow(row.map(leadSafeCell_));

    // Tell Rob. If Gmail refuses, the row above is still safe, so the lead is not lost.
    var emailed = false;
    try {
      if (MailApp.getRemainingDailyQuota() >= 1) {
        var mail = leadBuildEmail_(lead, scored, assess, ss.getUrl ? ss.getUrl() : '');
        sendMail_({ to: LEAD_NOTIFY_EMAIL_, replyTo: lead.email, subject: mail.subject, body: mail.text, htmlBody: mail.html, name: 'Product Advisory Learning' }, 'noreply');
        emailed = true;
      }
    } catch (mailErr) { emailed = false; }

    // Then thank the person. If Gmail is running low this is skipped before Rob's notice or the invitation emails are.
    var acked = false;
    try {
      if (MailApp.getRemainingDailyQuota() >= 5) {
        var ack = leadBuildAck_(lead);
        sendMail_({ to: lead.email, replyTo: LEAD_REPLY_TO_, subject: ack.subject, body: ack.text, htmlBody: ack.html, name: 'Product Advisory' }, 'sales');
        acked = true;
      }
    } catch (ackErr) { acked = false; }
    remember({ ok: true, emailed: emailed, acked: acked });
  } catch (err) {
    remember({ ok: false, error: 'server_error' });
  } finally {
    if (locked) lock.releaseLock();
  }
  return reply;
}


/* ==================================================================
   8. REPORTS (reports.html and the Monday email)
   ------------------------------------------------------------------
   Everything the Reports page shows is worked out HERE, from the sheet's
   tabs, so there is one copy of the logic: the page only draws it. Only the
   platform owner can ask for it (the caller's sign-in token is checked
   against the platformAdmins record in Firestore).

   The "insights" are ordinary sentences built from the numbers, so they are
   always accurate and free. Where there is too little data to say anything
   fair, they say so instead of guessing. The optional "Explain with AI"
   button sends a model ONLY these anonymous totals and sentences (never a
   name, an email or an answer) and is limited per day.
   ================================================================== */

var RP_DAY_ = 86400000;
var RP_MIN_SAMPLE_ = 5;                       // fewer events than this and a trend is "too early to read"
var RP_AI_DAILY_LIMIT_ = 30;
var RP_PERIODS_ = [7, 30, 90, 365];
var RP_SKILL_NAMES_ = {
  discovery: 'Customer & Market Discovery', strategy: 'Product Strategy & Roadmapping', prioritization: 'Prioritization & Trade-offs',
  execution: 'Execution & Delivery', stakeholder: 'Stakeholder Communication & Influence', aiIndividual: 'AI Fluency (Individual)', aiOrg: 'AI Fluency (Organizational)'
};

function rpNum_(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function rpMs_(v) { var t = (v instanceof Date) ? v.getTime() : new Date(v).getTime(); return isFinite(t) ? t : 0; }
function rpCap_(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
function rpPlural_(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

function rpCount_(times, from, to) {
  var n = 0;
  for (var i = 0; i < times.length; i++) if (times[i] >= from && times[i] < to) n++;
  return n;
}

// One count per day across the window, oldest first.
function rpDaily_(times, from, days) {
  var out = [];
  for (var i = 0; i < days; i++) out.push(0);
  times.forEach(function (t) {
    var i = Math.floor((t - from) / RP_DAY_);
    if (i >= 0 && i < days) out[i]++;
  });
  return out;
}

function rpCompare_(cur, prev) {
  var delta = cur - prev;
  return { cur: cur, prev: prev, delta: delta, pct: prev > 0 ? Math.round(delta / prev * 100) : null, dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' };
}

function rpCounts_(values) {
  var m = {};
  values.forEach(function (v) { v = String(v == null ? '' : v).trim(); if (v) m[v] = (m[v] || 0) + 1; });
  return Object.keys(m).map(function (k) { return { label: k, count: m[k] }; }).sort(function (a, b) { return (b.count - a.count) || a.label.localeCompare(b.label); });
}

function rpShare_(n, total) { return total > 0 ? Math.round(n / total * 100) : 0; }

// "Assessments completed are up 40% vs the previous 30 days (14 vs 10)." Held back when there is too little to read.
function rpTrendInsight_(noun, cmp, days) {
  if (cmp.cur + cmp.prev < RP_MIN_SAMPLE_) {
    return { severity: 'info', thin: true, text: 'Too few ' + noun + ' to read a trend yet (' + cmp.cur + ' in the last ' + days + ' days).' };
  }
  var vs = 'vs the previous ' + days + ' days (' + cmp.cur + ' vs ' + cmp.prev + ')';
  if (cmp.prev === 0) return { severity: 'good', text: rpCap_(noun) + ': ' + cmp.cur + ' in the last ' + days + ' days, and none in the days before.' };
  if (cmp.pct >= 20) return { severity: 'good', text: rpCap_(noun) + ' are up ' + cmp.pct + '% ' + vs + '.' };
  if (cmp.pct <= -20) return { severity: 'watch', text: rpCap_(noun) + ' are down ' + Math.abs(cmp.pct) + '% ' + vs + '.' };
  return { severity: 'info', text: rpCap_(noun) + ' are steady ' + vs + '.' };
}

// Turns step counts into steps with "% who carried on", and finds the biggest drop.
function rpFunnel_(counts) {
  var steps = counts.map(function (c, i) {
    var prev = i > 0 ? counts[i - 1].count : null;
    return { key: c.key, label: c.label, count: c.count, conv: (prev !== null && prev > 0) ? Math.min(100, Math.round(c.count / prev * 100)) : null };
  });
  var worst = -1;
  for (var i = 1; i < steps.length; i++) {
    if (steps[i].conv !== null && steps[i - 1].count >= RP_MIN_SAMPLE_ && (worst === -1 || steps[i].conv < steps[worst].conv)) worst = i;
  }
  return { steps: steps, worst: worst };
}

function rpFunnelInsights_(f) {
  var out = [], s = f.steps;
  if (!s.length || s[0].count === 0) return [{ severity: 'info', thin: true, text: 'Nobody started the assessment in this period, so there is no funnel to read yet.' }];
  if (f.worst === -1) return [{ severity: 'info', thin: true, text: 'Too few people at each step to say where they drop off (' + s[0].count + ' started).' }];
  var w = s[f.worst], p = s[f.worst - 1];
  out.push({ severity: w.conv < 50 ? 'watch' : 'info', text: 'The biggest drop is from "' + p.label + '" to "' + w.label + '": ' + w.conv + '% carry on (' + w.count + ' of ' + p.count + ').' });
  var last = s[s.length - 1];
  if (s[0].count >= RP_MIN_SAMPLE_) out.push({ severity: 'info', text: 'Of ' + s[0].count + ' who started the assessment, ' + s[2].count + ' created an account (' + Math.min(100, rpShare_(s[2].count, s[0].count)) + '%) and ' + last.count + ' finished a course.' });
  return out;
}

function rpSkills_(responses) {
  var areas = Object.keys(RP_SKILL_NAMES_).map(function (k) {
    var vals = responses.map(function (r) { return r.cats[k]; }).filter(function (v) { return typeof v === 'number'; });
    var sum = vals.reduce(function (a, b) { return a + b; }, 0);
    return { key: k, label: RP_SKILL_NAMES_[k], n: vals.length, avg: vals.length ? Math.round(sum / vals.length) : null };
  });
  return { n: responses.length, tiers: rpCounts_(responses.map(function (r) { return r.tier; })), areas: areas };
}

function rpSkillInsights_(sk) {
  if (sk.n < RP_MIN_SAMPLE_) return [{ severity: 'info', thin: true, text: 'Only ' + rpPlural_(sk.n, 'assessment') + ' in this period, so skill averages would be misleading.' }];
  var scored = sk.areas.filter(function (a) { return a.avg !== null; });
  var lo = scored.reduce(function (m, a) { return a.avg < m.avg ? a : m; }, scored[0]);
  var hi = scored.reduce(function (m, a) { return a.avg > m.avg ? a : m; }, scored[0]);
  var out = [{ severity: 'info', text: 'Across ' + sk.n + ' assessments, the strongest area is ' + hi.label + ' (average ' + hi.avg + '%) and the weakest is ' + lo.label + ' (' + lo.avg + '%).' }];
  if (hi.avg - lo.avg >= 25) out.push({ severity: 'watch', text: 'There is a ' + (hi.avg - lo.avg) + '-point gap between the strongest and weakest areas, so content and messaging about ' + lo.label + ' could meet a real need.' });
  var top = sk.tiers[0];
  if (top) out.push({ severity: 'info', text: 'Most people land at "' + top.label + '" (' + rpShare_(top.count, sk.n) + '%).' });
  return out;
}

function rpLeadStats_(leads, from, to, nowMs) {
  var inWin = leads.filter(function (l) { return l.ms >= from && l.ms < to; });
  var hotWarm = inWin.filter(function (l) { return l.fit === 'Hot' || l.fit === 'Warm'; });
  var waiting = leads.filter(function (l) { return l.fit === 'Hot' && String(l.status || 'New').toLowerCase() === 'new' && (nowMs - l.ms) > 2 * RP_DAY_; });
  return {
    total: inWin.length, hotWarm: hotWarm.length, hot: inWin.filter(function (l) { return l.fit === 'Hot'; }).length,
    byFit: rpCounts_(inWin.map(function (l) { return l.fit; })), bySource: rpCounts_(inWin.map(function (l) { return l.source || '(not tagged)'; })),
    byWho: rpCounts_(inWin.map(function (l) { return l.who; })), byTimeline: rpCounts_(inWin.map(function (l) { return l.timeline; })),
    bySize: rpCounts_(inWin.map(function (l) { return l.size || 'Not asked'; })),
    pipeline: rpCounts_(leads.map(function (l) { return l.status || 'New'; })), hotWaiting: waiting.length
  };
}

function rpLeadInsights_(st, cmp, days) {
  var out = [rpTrendInsight_('requests', cmp, days)];
  if (st.total >= RP_MIN_SAMPLE_) {
    out.push({ severity: 'info', text: st.hotWarm + ' of ' + st.total + ' requests are Hot or Warm (' + rpShare_(st.hotWarm, st.total) + '%).' });
    var src = st.bySource[0];
    if (src && src.count >= 3) out.push({ severity: 'info', text: 'Most requests come from "' + src.label + '" (' + src.count + ', ' + rpShare_(src.count, st.total) + '%).' });
    var soon = st.byTimeline.filter(function (t) { return t.label === 'This month'; })[0];
    if (soon) out.push({ severity: 'good', text: soon.count + ' of ' + st.total + ' want to start this month.' });
  } else if (st.total > 0) {
    out.push({ severity: 'info', thin: true, text: 'Only ' + rpPlural_(st.total, 'request') + ' in this period, so breakdowns would be misleading.' });
  }
  if (st.hotWaiting > 0) out.push({ severity: 'watch', text: rpPlural_(st.hotWaiting, 'Hot request') + ' ' + (st.hotWaiting === 1 ? 'has' : 'have') + ' been waiting more than 2 days with Status "New". Reply to ' + (st.hotWaiting === 1 ? 'it' : 'them') + ' first.' });
  return out;
}

// What changed and what needs attention, most important first, never from thin data.
function rpSummary_(sections) {
  var all = [];
  Object.keys(sections).forEach(function (k) { sections[k].forEach(function (i) { if (!i.thin) all.push(i); }); });
  var rank = { watch: 0, good: 1, info: 2 };
  all.sort(function (a, b) { return rank[a.severity] - rank[b.severity]; });
  if (!all.length) return [{ severity: 'info', text: "There isn't enough activity in this period for reliable conclusions yet. Try a longer period." }];
  return all.slice(0, 5);
}

/* data = { responses, funnel, progress, leads } already tidied by rpLoad_.
   labelFn turns a time into the text shown under a chart. */
function rpBuild_(data, nowMs, days, labelFn) {
  labelFn = labelFn || function (ms) { return new Date(ms).toISOString().slice(0, 10); };
  var cur0 = nowMs - days * RP_DAY_, prev0 = cur0 - days * RP_DAY_;
  var rT = data.responses.map(function (r) { return r.ms; });
  var started = data.funnel.filter(function (f) { return f.event === 'assessmentStarted'; }).map(function (f) { return f.ms; });
  var viewed = data.funnel.filter(function (f) { return f.event === 'resultsViewed'; }).map(function (f) { return f.ms; });
  var accounts = data.funnel.filter(function (f) { return f.event === 'accountCreated'; }).map(function (f) { return f.ms; });
  var leadT = data.leads.map(function (l) { return l.ms; });
  var hotWarmT = data.leads.filter(function (l) { return l.fit === 'Hot' || l.fit === 'Warm'; }).map(function (l) { return l.ms; });

  // Progress rows are a snapshot refreshed whenever someone opens their dashboard, so "active" means "opened it this period".
  function learners(from, to) {
    var seen = {};
    data.progress.forEach(function (p) { if (p.ms >= from && p.ms < to && p.lessons > 0) seen[p.who] = true; });
    return Object.keys(seen).length;
  }
  function completers(from, to) {
    var seen = {};
    data.progress.forEach(function (p) { if (p.ms >= from && p.ms < to && p.completed) seen[p.who] = true; });
    return Object.keys(seen).length;
  }

  function kpi(key, label, curVal, prevVal, note) { var c = rpCompare_(curVal, prevVal); c.key = key; c.label = label; if (note) c.note = note; return c; }
  var kpis = [
    kpi('assessments', 'Assessments completed', rpCount_(rT, cur0, nowMs), rpCount_(rT, prev0, cur0)),
    kpi('started', 'Assessments started', rpCount_(started, cur0, nowMs), rpCount_(started, prev0, cur0)),
    kpi('accounts', 'Accounts created', rpCount_(accounts, cur0, nowMs), rpCount_(accounts, prev0, cur0)),
    kpi('requests', 'Requests for information', rpCount_(leadT, cur0, nowMs), rpCount_(leadT, prev0, cur0)),
    kpi('hotwarm', 'Hot or Warm requests', rpCount_(hotWarmT, cur0, nowMs), rpCount_(hotWarmT, prev0, cur0)),
    kpi('learners', 'Active learners', learners(cur0, nowMs), learners(prev0, cur0), 'People who started a lesson and opened their dashboard in the period.')
  ];
  var byKey = {}; kpis.forEach(function (k) { byKey[k.key] = k; });

  var series = { labels: [], assessments: rpDaily_(rT, cur0, days), requests: rpDaily_(leadT, cur0, days), accounts: rpDaily_(accounts, cur0, days), started: rpDaily_(started, cur0, days) };
  for (var i = 0; i < days; i++) series.labels.push(labelFn(cur0 + i * RP_DAY_));

  var funnel = rpFunnel_([
    { key: 'started', label: 'Started the assessment', count: byKey.started.cur },
    { key: 'viewed', label: 'Saw their results', count: rpCount_(viewed, cur0, nowMs) },
    { key: 'account', label: 'Created an account', count: byKey.accounts.cur },
    { key: 'learning', label: 'Started learning', count: byKey.learners.cur },
    { key: 'course', label: 'Finished a course', count: completers(cur0, nowMs) }
  ]);

  var winResponses = data.responses.filter(function (r) { return r.ms >= cur0 && r.ms < nowMs; });
  var skills = rpSkills_(winResponses);
  var leads = rpLeadStats_(data.leads, cur0, nowMs, nowMs);

  var insights = {
    overview: [
      rpTrendInsight_('assessments completed', byKey.assessments, days),
      rpTrendInsight_('accounts created', byKey.accounts, days),
      rpTrendInsight_('requests for information', byKey.requests, days)
    ],
    funnel: rpFunnelInsights_(funnel),
    leads: rpLeadInsights_(leads, byKey.requests, days),
    skills: rpSkillInsights_(skills)
  };
  if (leads.hotWaiting > 0) insights.overview.push(insights.leads[insights.leads.length - 1]);
  return { generatedAt: nowMs, days: days, kpis: kpis, series: series, funnel: funnel, skills: skills, leads: leads, insights: insights, summary: rpSummary_(insights),
    notes: ['Funnel steps count anonymous events, so each step is a volume, not the same people followed through.', 'Active learners are people who opened their dashboard in the period; completions are not time-stamped.'] };
}

/* ---------- the Google-dependent parts ---------- */

function rpHash_(email) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(email || '').toLowerCase().trim());
  return bytes.slice(0, 5).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function rpRows_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  var v = sheet.getDataRange().getValues();
  return v.slice(1);
}

function rpLoad_() {
  var responses = rpRows_(SHEET_NAME).map(function (r) {
    var cats = {};
    CATEGORY_KEYS.forEach(function (k, i) { var n = Number(r[9 + i]); cats[k] = isFinite(n) && r[9 + i] !== '' ? n : null; });
    return { ms: rpMs_(r[0]), tier: String(r[8] || ''), overall: rpNum_(r[7]), cats: cats, size: String(r[5] || ''), industry: String(r[6] || ''), job: String(r[4] || '') };
  }).filter(function (r) { return r.ms > 0; });
  var funnel = rpRows_(FUNNEL_SHEET_NAME).map(function (r) { return { ms: rpMs_(r[0]), event: String(r[2] || ''), tier: String(r[3] || '') }; }).filter(function (f) { return f.ms > 0; });
  var progress = rpRows_(PROGRESS_SHEET_NAME).map(function (r) {
    return { ms: rpMs_(r[0]), who: rpHash_(r[1]), lessons: rpNum_(r[6]), completed: String(r[9] || '') === 'Completed' };
  }).filter(function (p) { return p.ms > 0; });
  var H = LEAD_HEADERS_;
  var col = function (name) { return H.indexOf(name); };
  var leads = rpRows_(LEAD_SHEET_NAME_).map(function (r) {
    return { ms: rpMs_(r[col('Received')]), id: String(r[col('Lead ID')] || ''), name: String(r[col('Name')] || ''), email: String(r[col('Email')] || ''), company: String(r[col('Company')] || ''),
      who: String(r[col('I am')] || ''), interests: String(r[col('Interested in')] || ''), size: String(r[col('Team size')] || ''), timeline: String(r[col('Timeline')] || ''),
      role: String(r[col('Who decides')] || ''), fit: String(r[col('Fit')] || ''), score: rpNum_(r[col('Score')]), source: String(r[col('Source')] || ''),
      status: String(r[col('Status')] || 'New'), message: String(r[col('Message')] || ''), why: String(r[col('Why')] || '') };
  }).filter(function (l) { return l.ms > 0; });
  return { responses: responses, funnel: funnel, progress: progress, leads: leads };
}

// Only the platform owner may read reports: the caller's own token is used to read
// their platformAdmins record, which the security rules only let the owner's account have.
function rpAuthorize_(idToken) {
  var who = verifyFirebaseIdToken_(idToken);
  if (!who) return { ok: false, error: 'not_verified' };
  var res = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT_ID_ + '/databases/(default)/documents/platformAdmins/' + encodeURIComponent(who.uid),
    { method: 'get', headers: { Authorization: 'Bearer ' + idToken }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return { ok: false, error: 'not_owner' };
  return { ok: true, user: who };
}

function rpDays_(v) { var n = Number(v); return RP_PERIODS_.indexOf(n) > -1 ? n : 30; }

function rpLabel_(ms) { return Utilities.formatDate(new Date(ms), Session.getScriptTimeZone(), 'MMM d'); }

function reportsEndpoint_(idToken, days) {
  var auth = rpAuthorize_(idToken);
  if (!auth.ok) return { ok: false, error: auth.error };
  try {
    return { ok: true, report: rpBuild_(rpLoad_(), Date.now(), rpDays_(days), rpLabel_) };
  } catch (err) {
    return { ok: false, error: 'server_error', detail: String(err && err.message || err).slice(0, 200) };
  }
}

// The detailed list of requests (personal details, owner only), newest first.
function reportsLeadsEndpoint_(idToken) {
  var auth = rpAuthorize_(idToken);
  if (!auth.ok) return { ok: false, error: auth.error };
  try {
    var rows = rpLoad_().leads.sort(function (a, b) { return b.ms - a.ms; }).slice(0, 300);
    return { ok: true, leads: rows };
  } catch (err) {
    return { ok: false, error: 'server_error', detail: String(err && err.message || err).slice(0, 200) };
  }
}

/* ---------- "Explain with AI" ---------- */

// What the model is given: anonymous totals and the sentences above. Nothing else.
function rpAiPrompt_(section, report) {
  var facts = { section: section, periodDays: report.days, kpis: report.kpis.map(function (k) { return { name: k.label, now: k.cur, before: k.prev, changePct: k.pct }; }) };
  if (section === 'funnel') facts.funnel = report.funnel.steps.map(function (s) { return { step: s.label, count: s.count, carriedOnPct: s.conv }; });
  if (section === 'leads') facts.leads = { total: report.leads.total, hotOrWarm: report.leads.hotWarm, byFit: report.leads.byFit, bySource: report.leads.bySource, byTimeline: report.leads.byTimeline, bySize: report.leads.bySize, pipeline: report.leads.pipeline, hotWaiting: report.leads.hotWaiting };
  if (section === 'overview') facts.skills = report.skills.areas.map(function (a) { return { area: a.label, averagePct: a.avg }; });
  facts.automaticInsights = (report.insights[section] || []).map(function (i) { return i.text; });
  var system = "You are a careful business analyst for Product Advisory, a small company that sells product-management assessments, courses and toolkits. " +
    "You are given anonymous totals for one section of the owner's reports. Use ONLY the numbers given; never invent a figure, name or cause. " +
    "If counts are small (under about 10), say plainly that the data is too thin to be sure. Write in plain English for a busy founder, no jargon, no markdown headings. " +
    "Format exactly as: a line 'What it shows:' with 2 or 3 sentences; a line 'What to watch:' with up to 2 short bullets starting with '- '; a line 'Next steps:' with up to 3 short bullets starting with '- '. Keep the whole answer under 900 characters.";
  return { system: system, user: 'Here are the numbers:\n' + JSON.stringify(facts) };
}

function rpAiQuota_() {
  var props = PropertiesService.getScriptProperties();
  var key = 'rpai_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var n = Number(props.getProperty(key) || 0);
  if (n >= RP_AI_DAILY_LIMIT_) return false;
  props.getKeys().forEach(function (k) { if (k.indexOf('rpai_') === 0 && k !== key) props.deleteProperty(k); });
  props.setProperty(key, String(n + 1));
  return true;
}

function reportsAiEndpoint_(idToken, section, days) {
  var auth = rpAuthorize_(idToken);
  if (!auth.ok) return { ok: false, error: auth.error };
  if (['overview', 'funnel', 'leads'].indexOf(section) === -1) return { ok: false, error: 'bad_section' };
  var apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  if (!apiKey) return { ok: false, error: 'no_key' };
  try {
    var prompt = rpAiPrompt_(section, rpBuild_(rpLoad_(), Date.now(), rpDays_(days), rpLabel_));
    // Belt and braces: nothing that looks like an email address is ever sent out.
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(prompt.user)) return { ok: false, error: 'privacy_guard' };
    if (!rpAiQuota_()) return { ok: false, error: 'daily_limit' };
    var response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + apiKey },
      payload: JSON.stringify({ model: GROQ_MODEL_, temperature: 0.3, max_tokens: 700, messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }] }),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) return { ok: false, error: 'ai_error', detail: 'Groq answered ' + response.getResponseCode() };
    var text = String(JSON.parse(response.getContentText()).choices[0].message.content || '').replace(/```/g, '').trim().slice(0, 1500);
    return text ? { ok: true, text: text } : { ok: false, error: 'ai_error', detail: 'empty answer' };
  } catch (err) {
    return { ok: false, error: 'ai_error', detail: String(err && err.message || err).slice(0, 200) };
  }
}

/* ---------- the Monday email ---------- */

function rpWeeklyEmail_(r, reportsUrl) {
  var k = {}; r.kpis.forEach(function (x) { k[x.key] = x; });
  function change(x) { return x.pct === null ? (x.cur > 0 ? 'new' : 'no change') : (x.pct > 0 ? '+' : '') + x.pct + '%'; }
  var subject = 'Weekly report: ' + rpPlural_(k.assessments.cur, 'assessment') + ' (' + change(k.assessments) + '), ' + rpPlural_(k.requests.cur, 'request') + ' (' + k.hotwarm.cur + ' Hot/Warm)';
  var lines = r.kpis.map(function (x) { return x.label + ': ' + x.cur + ' (' + change(x) + ' vs the week before)'; });
  var text = 'Your week at a glance (last 7 days)\n\n' + lines.join('\n') + '\n\nWhat stands out\n' + r.summary.map(function (s) { return '- ' + s.text; }).join('\n') + '\n\nOpen the full reports: ' + reportsUrl + '\n';
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#16213E;max-width:560px;">' +
    '<h2 style="margin:0 0 4px;font-size:18px;color:#12305e;">Your week at a glance</h2><p style="margin:0 0 14px;color:#6B7686;font-size:13px;">The last 7 days compared with the 7 days before</p>' +
    '<table style="border-collapse:collapse;width:100%;">' + r.kpis.map(function (x) {
      var color = x.pct === null ? '#6B7686' : x.pct > 0 ? '#2E8B57' : x.pct < 0 ? '#C0622A' : '#6B7686';
      return '<tr><td style="padding:7px 10px;border-bottom:1px solid #E3E9F0;">' + escapeHtml_(x.label) + '</td><td style="padding:7px 10px;border-bottom:1px solid #E3E9F0;text-align:right;font-weight:bold;">' + x.cur +
        '</td><td style="padding:7px 10px;border-bottom:1px solid #E3E9F0;text-align:right;color:' + color + ';">' + escapeHtml_(change(x)) + '</td></tr>';
    }).join('') + '</table>' +
    '<h3 style="margin:20px 0 6px;font-size:14px;color:#12305e;">What stands out</h3><ul style="margin:0;padding-left:20px;">' +
    r.summary.map(function (s) { return '<li style="margin-bottom:5px;">' + escapeHtml_(s.text) + '</li>'; }).join('') + '</ul>' +
    '<p style="margin:20px 0 0;"><a href="' + escapeHtml_(reportsUrl) + '" style="display:inline-block;padding:11px 20px;border-radius:8px;background:#1A4584;color:#ffffff;text-decoration:none;font-weight:bold;">Open the full reports</a></p></div>';
  return { subject: subject, text: text, html: html };
}

// Run by the Monday trigger (and handy to run by hand to see one now).
function sendWeeklyReport() {
  var r = rpBuild_(rpLoad_(), Date.now(), 7, rpLabel_);
  var mail = rpWeeklyEmail_(r, SITE_BASE_URL_ + 'reports.html');
  if (MailApp.getRemainingDailyQuota() < 1) return;
  sendMail_({ to: LEAD_NOTIFY_EMAIL_, subject: mail.subject, body: mail.text, htmlBody: mail.html, name: 'Product Advisory Learning' }, 'noreply');
}

// Run these once from the editor's function menu. The first run asks you to approve the
// "run on a schedule" permission.
function installWeeklyReport() {
  removeWeeklyReport();
  ScriptApp.newTrigger('sendWeeklyReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  Logger.log('The weekly report will be emailed to ' + LEAD_NOTIFY_EMAIL_ + ' every Monday around 8am (' + Session.getScriptTimeZone() + ').');
}

function removeWeeklyReport() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sendWeeklyReport') ScriptApp.deleteTrigger(t); });
  Logger.log('The weekly report schedule is switched off.');
}


/* ==================================================================
   9. SENDER ADDRESSES (who each kind of email comes from)
   ------------------------------------------------------------------
   Apps Script normally sends every email from the Google account that
   owns this script. To make a message come from one of your other
   addresses (noreply@, sales@ ...), that address has to be added to the
   Gmail account as a "Send mail as" alias (Gmail > Settings > Accounts
   and Import > Send mail as). When it is, sendMail_ uses it. When it is
   not, the email is sent exactly as before and nothing breaks, so this is
   safe to leave switched on either way. The Reply-To of each message is
   set separately and works with or without an alias.
   ================================================================== */

var MAIL_ADDR_ = {
  noreply: 'noreply@productadvisory.co',        // automatic messages nobody needs to answer: welcome, notices to Rob
  assessment: 'assessment@productadvisory.co',  // the assessment, accounts and company invitations
  sales: 'sales@productadvisory.co',            // "Request more information" thank-yous and anything about buying
  info: 'info@productadvisory.co',              // general contact (shown on the site)
  toolkit: 'toolkit@productadvisory.co',        // the Tool Roadmap and toolkit launches
  feedback: 'feedback@productadvisory.co',      // ideas and problems from learners
  legal: 'legal@productadvisory.co',            // privacy and legal questions
  marketing: 'marketing@productadvisory.co'     // newsletters and announcements (not used yet)
};

// True when Gmail says this account may send as the address. Never throws.
function mailAlias_(address) {
  try {
    var list = GmailApp.getAliases() || [];
    for (var i = 0; i < list.length; i++) if (String(list[i]).toLowerCase() === String(address).toLowerCase()) return true;
  } catch (err) { /* no permission yet, or no Gmail: use the normal way */ }
  return false;
}

// Sends one email. msg: { to, subject, body, htmlBody, name, replyTo }. fromKey: a key of MAIL_ADDR_.
// Returns 'alias' when it went out as that address and 'default' when it went out from the script owner's account.
function sendMail_(msg, fromKey) {
  var from = MAIL_ADDR_[fromKey];
  if (from && mailAlias_(from)) {
    try {
      GmailApp.sendEmail(msg.to, msg.subject, msg.body, { htmlBody: msg.htmlBody, name: msg.name, replyTo: msg.replyTo, from: from });
      return 'alias';
    } catch (err) { /* fall through to the normal way */ }
  }
  MailApp.sendEmail(msg);
  return 'default';
}

// Run this ONCE from the editor after adding the addresses in Gmail. It asks for Gmail permission (needed
// to send as an alias), then tells you which of your addresses it can send as.
function authorizeMailAliases() {
  var list = [];
  try { list = GmailApp.getAliases() || []; } catch (err) { Logger.log('Gmail permission was not granted: ' + err); return; }
  var usable = [], missing = [];
  Object.keys(MAIL_ADDR_).forEach(function (k) {
    (list.map(function (a) { return String(a).toLowerCase(); }).indexOf(MAIL_ADDR_[k]) > -1 ? usable : missing).push(MAIL_ADDR_[k]);
  });
  Logger.log('Can send as: ' + (usable.join(', ') || '(none yet)'));
  Logger.log('Not set up in Gmail yet (these still work, they just come from your main address): ' + (missing.join(', ') || '(none)'));
}


/* ==================================================================
   10. WELCOME EMAIL (once, to each new account)
   ------------------------------------------------------------------
   Every page that has the account menu (and the dashboard and invitation
   pages) asks for this when it sees a signed-in account that is only a
   few days old. The sign-in token proves who is asking, the email goes
   ONLY to that token's own address, and the "Welcomes" tab remembers who
   has had one, so it is sent once however many times the page asks.
   ================================================================== */

var WELCOME_SHEET_NAME_ = 'Welcomes';
var WELCOME_HEADERS_ = ['Sent', 'User ID', 'Email'];
var WELCOME_DAILY_CAP_ = 40;                 // each uses one of Gmail's ~100 daily emails
var WELCOME_MAX_AGE_MS_ = 3 * 86400000;      // only accounts created in the last 3 days

function welcomeBuild_(who) {
  var first = String(who.name || '').trim().split(/\s+/)[0] || '';
  var greeting = first ? 'Hi ' + first + ',' : 'Hi there,';
  var dash = SITE_BASE_URL_ + 'lms-dashboard.html', assess = SITE_BASE_URL_ + 'index.html';
  var text = greeting + '\n\n' +
    'Welcome to Product Advisory Learning. Your account is ready.\n\n' +
    'The quickest way to get started:\n' +
    '1. Take the free assessment (about 10 minutes) if you have not already. It shows where you are strongest and where to focus: ' + assess + '\n' +
    '2. Open your dashboard to see the courses chosen for you: ' + dash + '\n' +
    '3. If your company invited you, your dashboard shows exactly what your company can see, and nothing is shared until you agree.\n\n' +
    'Good to know:\n' +
    '- Forgot your password? Use "Forgot password" on the sign-in screen and we will email you a reset link.\n' +
    '- Questions about your assessment or account: reply to this email, or write to ' + MAIL_ADDR_.assessment + '.\n' +
    '- Something not working, or an idea? ' + MAIL_ADDR_.feedback + '.\n' +
    '- Privacy or legal questions: ' + MAIL_ADDR_.legal + '.\n\n' +
    'Product Advisory\n';
  var button = function (href, label, solid) {
    return '<a href="' + escapeHtml_(href) + '" style="display:inline-block;margin:0 10px 10px 0;padding:12px 20px;border-radius:8px;font-weight:bold;text-decoration:none;' +
      (solid ? 'background:#1A4584;color:#ffffff;' : 'background:#ffffff;color:#12305e;border:2px solid #1A4584;') + '">' + escapeHtml_(label) + '</a>';
  };
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#16213E;max-width:540px;">' +
    '<p>' + escapeHtml_(greeting) + '</p>' +
    '<p>Welcome to <strong>Product Advisory Learning</strong>. Your account is ready.</p>' +
    '<p style="margin:0 0 12px;">The quickest way to get started:</p>' +
    '<ol style="margin:0 0 16px;padding-left:20px;">' +
    '<li style="margin-bottom:6px;">Take the free assessment (about 10 minutes) if you have not already. It shows where you are strongest and where to focus.</li>' +
    '<li style="margin-bottom:6px;">Open your dashboard to see the courses chosen for you.</li>' +
    '<li>If your company invited you, your dashboard shows exactly what your company can see, and nothing is shared until you agree.</li></ol>' +
    '<p style="margin:0;">' + button(dash, 'Open your dashboard', true) + button(assess, 'Take the free assessment', false) + '</p>' +
    '<p style="margin:18px 0 6px;color:#6B7686;font-size:13px;text-transform:uppercase;letter-spacing:.04em;">Good to know</p>' +
    '<ul style="margin:0;padding-left:20px;font-size:14px;">' +
    '<li style="margin-bottom:4px;">Forgot your password? Use &ldquo;Forgot password&rdquo; on the sign-in screen and we will email you a reset link.</li>' +
    '<li style="margin-bottom:4px;">Questions about your assessment or account: reply to this email, or write to <a href="mailto:' + MAIL_ADDR_.assessment + '">' + MAIL_ADDR_.assessment + '</a>.</li>' +
    '<li style="margin-bottom:4px;">Something not working, or an idea? <a href="mailto:' + MAIL_ADDR_.feedback + '">' + MAIL_ADDR_.feedback + '</a>.</li>' +
    '<li>Privacy or legal questions: <a href="mailto:' + MAIL_ADDR_.legal + '">' + MAIL_ADDR_.legal + '</a>.</li></ul>' +
    '<p style="margin-top:20px;">Product Advisory</p></div>';
  return { subject: 'Welcome to Product Advisory Learning', text: text, html: html };
}

function welcomeEndpoint_(idToken) {
  var who = null;
  try { who = verifyFirebaseIdToken_(idToken); } catch (err) { who = null; }
  if (!who) return { ok: false, error: 'not_verified' };
  if (!who.createdAtMs || Date.now() - who.createdAtMs > WELCOME_MAX_AGE_MS_) return { ok: true, skipped: 'not_new' };
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(who.email)) return { ok: false, error: 'bad_recipient' };

  var lock = null, locked = false;
  try { lock = LockService.getScriptLock(); locked = lock.tryLock(10000); } catch (err) { /* carry on without it */ }
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(WELCOME_SHEET_NAME_);
    if (!sheet) {
      sheet = ss.insertSheet(WELCOME_SHEET_NAME_);
      sheet.appendRow(WELCOME_HEADERS_);
      sheet.setFrozenRows(1);
    }
    var last = sheet.getLastRow();
    if (last >= 2) {
      var ids = sheet.getRange(2, 2, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === who.uid) return { ok: true, skipped: 'already' };
    }

    var props = PropertiesService.getScriptProperties();
    var dayKey = 'welcomeday_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var sentToday = Number(props.getProperty(dayKey) || 0);
    if (sentToday >= WELCOME_DAILY_CAP_) return { ok: false, error: 'daily_limit' };
    if (MailApp.getRemainingDailyQuota() < 10) return { ok: false, error: 'quota' };   // keep the last few for invitations and leads

    var mail = welcomeBuild_(who);
    try {
      sendMail_({ to: who.email, subject: mail.subject, body: mail.text, htmlBody: mail.html, name: 'Product Advisory Learning', replyTo: MAIL_ADDR_.assessment }, 'noreply');
    } catch (err) {
      return { ok: false, error: 'mail_error', detail: String(err && err.message || err).slice(0, 200) };
    }
    sheet.appendRow([new Date(), who.uid, who.email]);
    props.getKeys().forEach(function (k) { if (k.indexOf('welcomeday_') === 0 && k !== dayKey) props.deleteProperty(k); });
    props.setProperty(dayKey, String(sentToday + 1));
    return { ok: true, sent: true };
  } catch (err) {
    return { ok: false, error: 'server_error' };
  } finally {
    if (locked) lock.releaseLock();
  }
}


/* ==================================================================
   11. COMPANY REPORT: "Explain with AI" for a company's admins
   ------------------------------------------------------------------
   The company dashboard works out its own numbers in the browser. For the
   optional AI explanation it sends them here. Three safeguards:
   1. Only an active admin of THAT company (or the owner) may ask: the
      caller's own token is used to read their membership from Firestore.
   2. The numbers are rebuilt field by field from a fixed list: whole
      numbers, and the fixed names of the skill areas and funnel steps.
      Any other text is dropped, so a name, an email or a company name
      cannot be passed through to the AI.
   3. A small daily limit per company and in total.
   ================================================================== */

var ORG_AREA_LABELS_ = ['Customer & Market Discovery', 'Product Strategy & Roadmapping', 'Prioritization & Trade-offs', 'Execution & Delivery',
  'Stakeholder Communication & Influence', 'AI Fluency — Individual', 'AI Fluency — Organizational'];
var ORG_FUNNEL_STEPS_ = ['Invited or joined', 'Joined', 'Took the assessment', 'Started learning', 'Finished their plan'];
var ORG_AI_PER_ORG_DAILY_ = 5;
var ORG_AI_DAILY_ = 40;

// 'owner', 'admin' or '' for someone who may not ask.
function orgRole_(who, idToken, orgId) {
  var base = 'https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT_ID_ + '/databases/(default)/documents/';
  var headers = { Authorization: 'Bearer ' + idToken };
  var o = UrlFetchApp.fetch(base + 'platformAdmins/' + encodeURIComponent(who.uid), { method: 'get', headers: headers, muteHttpExceptions: true });
  if (o.getResponseCode() === 200) return 'owner';
  var m = UrlFetchApp.fetch(base + 'memberships/' + encodeURIComponent(who.uid), { method: 'get', headers: headers, muteHttpExceptions: true });
  if (m.getResponseCode() !== 200) return '';
  var f = JSON.parse(m.getContentText()).fields || {};
  var s = function (k) { return f[k] && f[k].stringValue !== undefined ? f[k].stringValue : ''; };
  return s('orgId') === orgId && s('role') === 'admin' && s('status') === 'active' ? 'admin' : '';
}

function orgInt_(v, lo, hi, nullOk) {
  if (v === null && nullOk) return null;
  if (typeof v !== 'number' || !isFinite(v) || Math.floor(v) !== v || v < lo || v > hi) throw new Error('bad number');
  return v;
}

// Rebuilds the facts from the allowed pieces only. Throws if anything is off.
function orgFactsClean_(raw) {
  var f = JSON.parse(raw);
  var out = {
    people: orgInt_(f.people, 0, 100000), assessed: orgInt_(f.assessed, 0, 100000), learning: orgInt_(f.learning, 0, 100000),
    finished: orgInt_(f.finished, 0, 100000), quiet: orgInt_(f.quiet, 0, 100000), pendingInvites: orgInt_(f.pendingInvites, 0, 100000),
    avgOverallPct: orgInt_(f.avgOverallPct, 0, 100, true), avgPlanPct: orgInt_(f.avgPlanPct, 0, 100, true),
    funnel: [], areas: [], focusAreas: [], trend: null
  };
  if (!Array.isArray(f.funnel) || f.funnel.length > 5) throw new Error('bad funnel');
  f.funnel.forEach(function (s) {
    if (ORG_FUNNEL_STEPS_.indexOf(s.step) === -1) throw new Error('bad step');
    out.funnel.push({ step: s.step, count: orgInt_(s.count, 0, 100000) });
  });
  if (!Array.isArray(f.areas) || f.areas.length > 7) throw new Error('bad areas');
  f.areas.forEach(function (a) {
    if (ORG_AREA_LABELS_.indexOf(a.area) === -1) throw new Error('bad area');
    out.areas.push({ area: a.area, teamAvgPct: orgInt_(a.teamAvgPct, 0, 100), allAvgPct: orgInt_(a.allAvgPct, 0, 100, true) });
  });
  if (!Array.isArray(f.focusAreas) || f.focusAreas.length > 3) throw new Error('bad focus');
  f.focusAreas.forEach(function (a) {
    if (ORG_AREA_LABELS_.indexOf(a) === -1) throw new Error('bad focus area');
    out.focusAreas.push(a);
  });
  if (f.trend !== null && f.trend !== undefined) {
    out.trend = { weeks: orgInt_(f.trend.weeks, 1, 200), avgPlanFromPct: orgInt_(f.trend.avgPlanFromPct, 0, 100, true), avgPlanToPct: orgInt_(f.trend.avgPlanToPct, 0, 100, true),
      startedFrom: orgInt_(f.trend.startedFrom, 0, 100000), startedTo: orgInt_(f.trend.startedTo, 0, 100000) };
  }
  return out;
}

function orgAiPrompt_(facts) {
  var system = 'You are a careful analyst helping the administrator of a company that uses Product Advisory\'s product-management and AI skills program for its team. ' +
    'You are given anonymous numbers about that team: how many people joined, took the assessment, started learning and finished; their average scores in seven skill areas ' +
    '(and the average of everyone who has taken the assessment, when known); and a trend over weeks when there is one. Use ONLY the numbers given; never invent a figure, a name or a cause. ' +
    'If the team is small (under about 10 people) say plainly that the numbers are a first look. Write in plain English for a busy manager, no jargon, no markdown headings. ' +
    'Format exactly as: a line \'What it shows:\' with 2 or 3 sentences; a line \'What to watch:\' with up to 2 short bullets starting with \'- \'; ' +
    'a line \'Next steps:\' with up to 3 short bullets starting with \'- \' that are concrete things an administrator can do (remind people, set focus areas, schedule time to learn). Keep the whole answer under 900 characters.';
  return { system: system, user: 'Here are the numbers:\n' + JSON.stringify(facts) };
}

function orgAiQuota_(orgId) {
  var props = PropertiesService.getScriptProperties();
  var day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var totalKey = 'orgai_' + day, orgKey = 'orgai_' + day + '_' + orgId;
  var total = Number(props.getProperty(totalKey) || 0), mine = Number(props.getProperty(orgKey) || 0);
  if (total >= ORG_AI_DAILY_ || mine >= ORG_AI_PER_ORG_DAILY_) return false;
  props.getKeys().forEach(function (k) { if (k.indexOf('orgai_') === 0 && k.indexOf('orgai_' + day) !== 0) props.deleteProperty(k); });
  props.setProperty(totalKey, String(total + 1));
  props.setProperty(orgKey, String(mine + 1));
  return true;
}

function orgReportAiEndpoint_(idToken, orgId, factsJson) {
  var who = null;
  try { who = verifyFirebaseIdToken_(idToken); } catch (err) { who = null; }
  if (!who) return { ok: false, error: 'not_verified' };
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(String(orgId || ''))) return { ok: false, error: 'not_admin' };
  var role = '';
  try { role = orgRole_(who, idToken, orgId); } catch (err) { role = ''; }
  if (!role) return { ok: false, error: 'not_admin' };

  var facts;
  try { facts = orgFactsClean_(String(factsJson || '')); } catch (err) { return { ok: false, error: 'bad_facts' }; }
  var apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  if (!apiKey) return { ok: false, error: 'no_key' };
  if (!orgAiQuota_(orgId)) return { ok: false, error: 'daily_limit' };
  try {
    var prompt = orgAiPrompt_(facts);
    var response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + apiKey },
      payload: JSON.stringify({ model: GROQ_MODEL_, temperature: 0.3, max_tokens: 700, messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }] }),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) return { ok: false, error: 'ai_error', detail: 'Groq answered ' + response.getResponseCode() };
    var text = String(JSON.parse(response.getContentText()).choices[0].message.content || '').replace(/```/g, '').trim().slice(0, 1500);
    return text ? { ok: true, text: text } : { ok: false, error: 'ai_error', detail: 'empty answer' };
  } catch (err) {
    return { ok: false, error: 'ai_error', detail: String(err && err.message || err).slice(0, 200) };
  }
}
