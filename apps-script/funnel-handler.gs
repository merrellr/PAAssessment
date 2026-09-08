/**
 * Funnel event handler for the Product Advisory assessment.
 *
 * REFERENCE COPY. The live script lives in the Google Apps Script editor
 * bound to the results spreadsheet, and is served at the URL held in
 * RESULTS_LOG_URL (index.html / lms-dashboard.html / lesson.html). This
 * file version-controls the funnel contract; paste the pieces below into
 * that script and redeploy.
 *
 * ---------------------------------------------------------------------
 * What the client sends
 * ---------------------------------------------------------------------
 * index.html fires anonymous, no-PII drop-off events as text/plain POSTs
 * (text/plain so the browser skips a CORS preflight, which an Apps Script
 * web app can't answer):
 *
 *   { "action": "funnel", "event": "assessmentStarted", "ts": "<ISO>" }
 *   { "action": "funnel", "event": "resultsViewed",     "ts": "<ISO>", "tier": "<band>" }
 *   { "action": "funnel", "event": "accountCreated",    "ts": "<ISO>", "tier": "<band>" }
 *
 * Interpreting the numbers:
 *   - assessmentStarted fires for everyone (logged in or out) on
 *     "Start assessment". Resuming a saved quiz does NOT re-fire it.
 *   - resultsViewed and accountCreated fire ONLY for logged-out visitors
 *     going through the results-screen signup - that is the results-first
 *     conversion funnel by design.
 *   - Mid-quiz drop-off means resultsViewed < assessmentStarted even for
 *     a healthy funnel.
 *
 * ---------------------------------------------------------------------
 * Wire-up
 * ---------------------------------------------------------------------
 * 1. Add the dispatch below to the TOP of the existing doPost(e), before
 *    the code that appends an assessment-result row.
 * 2. Paste handleFunnelEvent_ / jsonOut_ anywhere in the script.
 * 3. Redeploy: Deploy > Manage deployments > edit the active deployment
 *    > New version. The web-app URL does not change, so RESULTS_LOG_URL
 *    in the client stays as-is.
 *
 * doGet (the lookup and companies JSONP endpoints) is untouched - funnel
 * events are POST only.
 */


/* ===================================================================
   1. Dispatch - add to the top of the existing doPost(e)
   =================================================================== */

// function doPost(e) {
//   var data;
//   try {
//     data = JSON.parse(e.postData.contents);
//   } catch (err) {
//     data = {};
//   }
//
//   if (data.action === 'funnel') {
//     return handleFunnelEvent_(data);
//   }
//
//   // ...existing assessment-result row logging continues here, unchanged...
// }


/* ===================================================================
   2. Handler
   =================================================================== */

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


/* ===================================================================
   3. Optional - quick funnel read-out (run from the editor)
   =================================================================== */

function logFunnelSummary() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FUNNEL_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    Logger.log('No funnel events yet.');
    return;
  }

  var events = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
  var c = {};
  events.forEach(function (r) { c[r[0]] = (c[r[0]] || 0) + 1; });

  var started = c['assessmentStarted'] || 0;
  var viewed  = c['resultsViewed']     || 0;
  var created = c['accountCreated']     || 0;
  var pct = function (n, d) { return d ? '  (' + Math.round(n / d * 100) + '%)' : ''; };

  Logger.log('assessmentStarted: ' + started);
  Logger.log('resultsViewed:     ' + viewed  + pct(viewed, started));
  Logger.log('accountCreated:    ' + created + pct(created, viewed));
}
