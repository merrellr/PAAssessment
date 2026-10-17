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
  return { uid: users[0].localId, email: String(users[0].email).toLowerCase().trim() };
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
        progress: deleteRowsByEmail_(ss.getSheetByName(PROGRESS_SHEET_NAME), 1, who.email)
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
      MailApp.sendEmail({
        to: inv.email,
        subject: mail.subject,
        body: mail.text,
        htmlBody: mail.html,
        name: 'Product Advisory Learning',
        replyTo: who.email
      });
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
var LEAD_DAILY_CAP_ = 60;
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
        MailApp.sendEmail({ to: LEAD_NOTIFY_EMAIL_, replyTo: lead.email, subject: mail.subject, body: mail.text, htmlBody: mail.html, name: 'Product Advisory Learning' });
        emailed = true;
      }
    } catch (mailErr) { emailed = false; }
    remember({ ok: true, emailed: emailed });
  } catch (err) {
    remember({ ok: false, error: 'server_error' });
  } finally {
    if (locked) lock.releaseLock();
  }
  return reply;
}
