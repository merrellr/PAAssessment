# PAAssessment
This is a Product Advisory Repository Assessment

## Scenario grading (the "VP buy-in" free-text question)

**Currently live:** `apps-script/grade-scenario.gs` — grades it via the
same Apps Script backend that already handles results logging
(`RESULTS_LOG_URL` in index.html), so trying this out needs no new
accounts, no billing plan, and no local Node install. See the setup
notes at the top of that file (a Script Property for `GROQ_API_KEY`,
then redeploy the web app). `index.html`'s `gradeScenario()` calls it via
the same JSONP pattern already used for `action=lookup`.

**Not currently wired up — a later upgrade path, not dead code:**
`functions/gradeApplicationScenario` (Cloud Functions v2) does the same
grading with a cleaner architecture (real secrets, a queryable Firestore
audit log instead of a sheet tab). If the Apps Script version proves the
feature's worth keeping, this is what to switch `SCENARIO_GRADE_URL`
back to. One-time setup on a machine with Node 20+ and the Firebase CLI:

```bash
npm install -g firebase-tools   # if not already installed
firebase login
cd functions && npm install
firebase functions:secrets:set GROQ_API_KEY   # paste your Groq key when prompted
```

The Firebase project (`product-advisory-lms`) must be on the **Blaze**
(pay-as-you-go) plan for Cloud Functions to deploy at all — do this once
in the Firebase console (Project Settings → Usage and billing). The
function itself runs on Groq's $0 tier; Blaze's own free quota should
cover this volume comfortably, but it does require a payment method on
the account.

Deploy or redeploy after any change to `functions/`:

```bash
firebase deploy --only functions:gradeApplicationScenario
```

To change the Groq model (e.g. if the current one is deprecated on the
free tier), edit `GROQ_MODEL` in `functions/.env` and redeploy — no code
change needed. Check console.groq.com/docs/models first.

Graded answers (including the internal rationale never shown to
respondents) land in the `scenarioGradingLog` Firestore collection for
manual review — it holds no uid and isn't read by the app.
