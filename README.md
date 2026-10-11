# PAAssessment
This is a Product Advisory Repository Assessment

## The Apps Script backend

`apps-script/Code.gs` is the complete script that runs behind
`RESULTS_LOG_URL`: results logging, course-progress sync, funnel events,
scenario grading with daily limits, the `Usage` report, and account deletion.
To change the live script, edit this file, select-all and paste it into the
Apps Script editor, then Deploy → Manage deployments → pencil → New version.
`grade-scenario.gs` and `funnel-handler.gs` are older partial copies kept for
the explanations in their header comments; `Code.gs` is the one that matches
what is deployed.

Every finished assessment gets an `assessmentId`, saved on the person's
Firestore result (`progress/{uid}.assessmentResult.assessmentId`) and in the
last column of the `Responses` tab, so the two records can be matched.

## Scenario grading (the "VP buy-in" free-text question)

**Currently live:** `apps-script/grade-scenario.gs` — grades it via the
same Apps Script backend that already handles results logging
(`RESULTS_LOG_URL` in index.html), so trying this out needs no new
accounts, no billing plan, and no local Node install. See the setup
notes at the top of that file (a Script Property for `GROQ_API_KEY`,
then redeploy the web app). `index.html`'s `gradeScenario()` calls it via
the same JSONP pattern already used for `action=lookup`.

**Currently switched off.** The question is hidden from everyone by
`SCENARIO_ENABLED = false` in `index.html`. Set it to `true` and push to bring
it back; no other code needs to change.

**Daily limits and usage report.** `gradeScenarioWithQuota_` in the same
file allows 2 scored responses per respondent per day (keyed to the
Firebase uid when signed in, otherwise a random id in localStorage) and 100
in total per day, which sits under Groq's published 200K-tokens/day limit
for `openai/gpt-oss-120b`. Over the limit, the client keeps the
multiple-choice score. The same handler maintains a `Usage` tab (assessments
started, graded, blocked and errored per day, plus a plain-English signal for
when volume outgrows the free tier) and writes `blocked:` rows to the
`ScenarioGrading` tab.

## Company accounts (in progress)

- `owner.html` is the platform owner's console (linked from the Profile menu on
  the dashboard, owner only): a searchable list of companies, and a page per
  company with point of contact, billing address, notes, seats, ranked focus
  areas, admins and users. Admins and users join through single-use invite
  links created there.
- `join.html?token=…` is the page an invited person opens. It shows exactly
  what the company can see, and only joins them after they agree.
- `firestore.rules` holds the rules for all of this. They are tested against
  the local Firestore emulator by `tests/firestore-rules.test.mjs`; the header
  of that file says how to run it. Publish the rules by pasting the whole file
  into Firebase console > Firestore Database > Rules.
- `vendor/Sortable.min.js` (MIT, v1.15.2) powers the drag-and-drop ranking. It
  is kept in the repo so the page does not depend on a third-party host.
- Not built yet: the shared record that keeps each member's results visible to
  their company, the company admin dashboard, focus areas shaping
  recommendations, and removing members. Until the shared record exists, joining
  a company shares nothing yet, so use test accounts only.

## Closing an account

`profile.html` has a "Delete account" card. It re-checks the person's
password (or Google sign-in), then in this order: asks the Apps Script
(`action=deleteAccount`, section 4 of `apps-script/grade-scenario.gs`) to remove
their rows from the `Responses` and `Progress` tabs, deletes their
`progress/{uid}` Firestore document, and finally deletes the Firebase sign-in.
Each step is safe to repeat, and a failure stops everything after it. The
Apps Script verifies the Firebase ID token with Google before deleting
anything, so it can't be used to delete someone else's rows.

Not removed, because it holds no identity: the `ScenarioGrading` and `Funnel`
tabs. Also not matched: rows saved under an email address the person has
since changed.

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
