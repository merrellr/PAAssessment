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

**Currently locked.** Two switches near the top of the scenario code in `index.html`:
`SCENARIO_ENABLED = false` (the question is not answerable) and `SCENARIO_LOCKED = true`.
While locked, people who scored above 25% on the AI Fluency (Organizational) questions see the
question on a locked screen (an Enterprise badge, the answer box greyed out, a note that the step is
part of the Enterprise assessment and that their result is complete without it, and a "Contact us about
Enterprise" link to `request-info.html?src=assessment-enterprise&who=org`) with one button to carry on to
their results. Two anonymous events are recorded on the Funnel tab: `scenarioLockedShown` and
`enterpriseInterest` (the link was clicked); leads who came through the link show `assessment-enterprise` as
their Source. To switch the real question on, set `SCENARIO_ENABLED = true` (the locked screen then never
shows). To hide it altogether, set both to false. Tested in `tests/ui/index-test.js`.

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
- The shared record: while someone is an active member, `org-share.js` keeps
  `orgs/{orgId}/members/{uid}` up to date (their name and email, latest
  assessment including individual answers, per-course lesson progress, and when
  they were last active). `org-share-core.js` builds it from an explicit list of
  fields, so private reflections, saved templates, phone number and profile
  details can never reach it. It refreshes when the member joins, opens their
  dashboard, or finishes a lesson. When the membership ends it stops updating, so
  the company keeps what it had. On account deletion the person's name and email
  are blanked on every company's copy (the results stay) before anything else is
  deleted. The owner console shows each member's shared data under **Details**.
- `company.html` is the company admin dashboard. A company admin reaches it from
  Profile > Company dashboard (or the link after joining as an admin); the
  platform owner reaches it with the **Team dashboard** button on a company's
  page in the owner console (`company.html?org=<id>`). It shows a roll-up (how
  many have taken the assessment, are learning, finished their plan, or have been
  quiet for 30+ days; level spread; average score per skill area), the team
  table with each person's level, plan progress and status, a **Details** panel
  per person (scores, individual answers, course progress), CSV downloads (team
  report, individual answers), and adding/resending/renewing/revoking
  invitations for admins and users. Former members are listed separately.
- `company-core.js` holds the logic both `owner.html` and `company.html` share:
  invite helpers, and the team report (what "assessed", "learning" and "finished"
  mean, and the numbers). Progress is counted against each course's real lesson
  count, in `LESSON_COUNTS`; `tests/company-core.test.mjs` fails if a course in
  `content/` gains or loses a lesson without that table being updated.
- Company focus: the company's ranked list of skill areas (`orgs/{id}.focusAreas`,
  default = the framework's order). Company admins and the owner edit it by
  dragging (`focus-board.js` / `.css`, shared with the owner console) on the
  **Our focus** card of `company.html`, which also shows the team's progress on
  the top three ranked areas. Members cannot read the company record (it holds
  contacts and billing), so every save also writes a copy to `orgFocus/{id}`,
  which active members can read; the rules refuse a copy that does not match the
  company's list. On the learner dashboard the list only **breaks ties** between
  skill areas that have equally many courses left, and only once a company has
  chosen something other than the standard order; the lowest score still decides
  last, and nobody's other gaps are hidden. Companies made before the copy existed
  get it the first time their admin or the owner opens them.
- Leaving a company: only the company's admins or the platform owner can end a
  membership (a **Remove** button beside each person on `company.html` and in the
  owner console; nobody can remove themselves, and admins cannot remove their own
  membership). It only sets the membership's status to `removed` with an end date.
  The person keeps their account, results and course access; from then on they
  cannot add to the company's copy (`orgs/{id}/members/{uid}`), so the company
  keeps exactly what it had and gets nothing new; their seat is freed; they appear
  under **Former members**; and their own dashboard tells them once that they are no
  longer a member. They can join a company again only with a new invite. Someone who
  deletes their account while still a member leaves an active row with their name
  and email removed; the admin removes that row to free the seat.
- Activity log: what admins and the owner do (invitations, removals, priority
  changes, company edits) is written to `orgs/{id}/audit` and shown on the company
  dashboard as **Recent activity**. Entries are signed with the real signed-in
  account and carry the server's time, and can never be changed or deleted. It is
  written by the app on a best-effort basis, so it is an accountability aid, not a
  tamper-proof legal record.
- Private owner notes: the owner's notes about a company are kept in
  `orgPrivate/{id}`, readable only by the platform owner, because the company
  record itself can be read by that company's admins. Notes saved on the company
  record before this existed are moved across automatically the first time the
  owner console loads.
- An **archived** company receives no new member data: members' copies stop
  updating, exactly as if they had left.
- `docs/OWNER-RUNBOOK.md` is the click-by-click guide for running all of this;
  `docs/PRIVACY-WORDING-FOR-REVIEW.md` is draft policy wording for a lawyer, written
  to match what the software does.
- Tests: see `tests/README.md`.

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

## Tool Roadmap (vote for the next toolkit)

- `tool-requests.html` is the public page (link it from the toolkits page on
  productadvisory.co as `https://assessment.productadvisory.co/tool-requests.html`).
  Anyone can see each tool and its vote total. To vote you sign in (email and
  password, or Google) with a **verified** email address. You can back up to three
  tools, one vote each, and change your mind. A box on each voted tool asks for a
  one-off email when it launches. Signed-in people can also suggest a tool.
- `owner-tools.html` (button **Tool roadmap** in the Owner Console) is where the
  owner adds the 10 starting tools with one click, adds and edits tools, marks them
  released (with a link), reviews suggestions (approve opens the form pre-filled),
  repairs vote counts (**Recount votes**), and copies or downloads the launch-email
  lists.
- `tool-core.js` holds the shared logic and the starting list (tested in
  `tests/tool-core.test.mjs`).
- How the count stays honest without a server (free plan): each vote is its own
  document `toolVotes/{uid}_{toolId}` (so one vote per person per tool), and the
  tool's public `voteCount` can only change by exactly one, in the same step as that
  person's own vote document is created or deleted. The security rules enforce
  both (see the tool roadmap section of `firestore.rules`, tested in
  `tests/firestore-rules.test.mjs`). The limit of three tools is applied by the
  page, not the rules, and someone creating many accounts could still stuff the
  vote, so treat totals as a signal, not a poll.
- Deleting an account (Profile > Delete account) withdraws the person's votes
  (taking each off the public total) and deletes their suggestion, before anything
  else is deleted.

## Request more information (lead form)

- `request-info.html` is a short, one-question-at-a-time form (about 60 seconds) for people who want to talk to Product Advisory. Link to it from productadvisory.co as `https://assessment.productadvisory.co/request-info.html?src=toolkits` (change `src=` to say which page the link is on, and add `&who=org` to skip the first question for pages aimed at teams). Open it in a new tab.
- It asks who the request is for, what they want help with (up to 3), team size, timing, who decides, and an optional message, then contact details with a consent tick. Someone exploring for themselves gets a shorter form. Signed-in people have their name and email filled in and can choose to include their assessment level and scores (never their individual answers).
- When it is sent, `apps-script/Code.gs` (section 7) validates it, scores it, adds a row to the **Leads** tab of the results sheet, and emails **rob@productadvisory.co** with the lead's own address as the Reply-To (so replying answers them). The person also gets an automatic thank-you email ("Welcome, and thanks for sharing... we will get back to you within two business days"), with the booking page for team leaders, organizations and anyone who asked for a call, and the free assessment for everyone; it is sent from, and replies go to, sales@productadvisory.co. The fit score (Hot / Warm / Nurture) is worked out on the server and is never shown to the person. See `docs/OWNER-RUNBOOK.md` for how to use it.
- Spam protection: a hidden field robots fill in, a minimum fill time, one request id is only saved once, 3 requests per email address and 40 in total per day (two emails each), strict length limits and a fixed list of allowed answers.
- If the server isn't switched on or can't be reached, the person gets an email to info@productadvisory.co (`CONTACT_EMAIL` in `lead-core.js`) with their answers already filled in, so nothing is lost. Requests that do arrive are announced to rob@productadvisory.co (`LEAD_NOTIFY_EMAIL_` in `Code.gs`).
- `lead-core.js` holds the form's logic (tested in `tests/lead-core.test.mjs`); `tests/apps-script/lead-test.html` tests the server side and checks the page and the script accept exactly the same answers. The two addresses are separate on purpose: `LEAD_NOTIFY_EMAIL_` in `Code.gs` is who is told about each request (changing it needs a new Apps Script deployment), and `CONTACT_EMAIL` in `lead-core.js` is the address shown to people if the form can't send. A test checks both.

## Reports (owner only)

- `reports.html` (button **Reports** in the Owner Console) shows the platform owner three tabs: **Overview** (what stands out, six headline numbers compared with the previous period, an activity chart, assessment levels, average score per skill area), **Funnel** (started the assessment → saw results → created an account → started learning → finished a course, with the biggest drop marked) and **Leads** (breakdowns of the "Request more information" requests, the pipeline, a searchable table and a CSV download). Periods: 7 days, 30 days, 90 days, 1 year.
- Everything is worked out on the server, in `apps-script/Code.gs` (section 8). The page only draws it (`charts.js`). The same numbers feed a **Monday 8am summary email** to `LEAD_NOTIFY_EMAIL_`. Only the owner can read it: the script checks the caller's Firebase sign-in token and then looks for their `platformAdmins/{uid}` document.
- Each insight is a plain sentence written by fixed rules with a minimum sample (`RP_MIN_SAMPLE_`, 5): below that it says "too few to read a trend". **Explain with AI** (optional, per tab) sends only anonymous totals to Groq (never names, emails, companies or message text; a guard refuses anything that looks like an email address) and is limited to 30 a day. It needs the `GROQ_API_KEY` script property, the same one scenario grading uses.
- Honest limits: the funnel counts anonymous events, so each step is a volume and not the same people followed through. "Active learners" are people who opened their dashboard in the period, because lesson completions are not time-stamped.
- Tests: `tests/reports-logic.test.mjs` (the server's numbers and sentences, the privacy guard, the weekly email) and the `reports:` pages in `tests/ui/run-ui-tests.ps1`.

## The Profile menu on every page

- `account-menu.js` puts the same **Profile** button in the top right corner of every page except the learning dashboard (which has its own) and the invitation page (`join.html`). It appears only while someone is signed in. Add it to a new page with one line before `</body>`: `<script type="module" src="account-menu.js"></script>`.
- It lists My learning dashboard, My profile, Vote on the next tool, Visit Product Advisory and Log out for everyone; Company dashboard only for an active company admin; Owner console and Reports only for the platform owner. The page you are on is shown in bold.
- It finds the owner and the admin by reading `platformAdmins/{uid}` and `memberships/{uid}`, the same two records the dashboard menu uses, so no new security rules are needed. It is tested in `tests/ui/menu-test.js` ("profile menu" pages in the runner).

## Company reports (company admins)

- The top of `company.html` has a **Report**: a one-line headline, "What stands out" (at most four sentences, problems first), an adoption funnel (invited, joined, took the assessment, started learning, finished), the team's average score in each skill area next to the average of everyone who has taken the assessment, and a trend over time. **Print or save as PDF** gives a one-page summary; **Explain with AI** is optional.
- The logic is `company-report.js` (pure, tested in `tests/company-report.test.mjs`). Sentences are written by fixed rules and use counts instead of percentages for small teams. The comparison with everyone uses the public totals from the Apps Script and only appears when the team has at least 3 assessed people and at least 10 assessments exist overall.
- **Weekly snapshots.** When an admin (or the owner) opens the dashboard and the last snapshot is a week old, the page saves a numbers-only record to `orgs/{orgId}/snapshots/{day}` (people, assessed, learning, finished, quiet, average scores; never a name or email). That builds the trend. The rule is in `firestore.rules` and must be published; snapshots can never be changed or deleted.
- **Explain with AI** asks `orgReportAi` in the Apps Script (section 11). Only an active admin of that company, or the owner, is allowed. The server rebuilds the numbers from a fixed list (whole numbers, the seven skill-area names, the five funnel step names), so a name or email cannot be passed on, and limits each company to 5 a day (40 in total).

## Emails: who sends what

- `apps-script/Code.gs` section 9 holds the list of addresses (`MAIL_ADDR_`). `sendMail_` sends from the chosen address when Gmail lists it as one this account may send as, and otherwise sends from the account that owns the script, so adding an address later needs no code change.
- noreply@: the welcome email and the notices to Rob. assessment@: replies to welcome and invitation emails. sales@: the "Request more information" thank-you and its replies. info@: the public contact shown on the site. toolkit@: the Tool Roadmap contact. feedback@: the "Send feedback" item in the Profile menus. legal@: privacy and legal questions in the welcome email. marketing@: reserved for newsletters.
- **Welcome email** (section 10): `account-menu.js` (on every page, including the dashboard and invitation page with `?menu=off`) asks for it when it sees a signed-in account made in the last two days. The script checks the sign-in token, sends only to that account's own address, records the account on the **Welcomes** tab so it is sent once, and stops at 40 a day. Deleting an account removes its row. Tests: `tests/mail-and-org-ai.test.mjs` and the "profile menu" pages in the UI runner.

## Pilot and customer tracker (owner only)

- `owner-pilot.html?org=<id>` (button **Pilot tracker** on each company in the Owner Console, and a **Stage** column in the company list) tracks a company from prospect to customer: seven stages, a run book of things to do at each stage (some tick themselves from the data), goals with targets judged against live numbers, a before-and-after table against a saved baseline, a progress chart from the weekly snapshots, a health check once someone is a customer, and a private timeline of notes. **Print the pilot summary** gives a one-page summary that leaves out the private notes and the health check.
- Data: `orgPilot/{orgId}` (stage, dates, goals, ticked run-book items, a summary note) and `orgPilot/{orgId}/log/{id}` (the timeline). Both are readable and writable by the platform owner only; company admins can never see them (see `firestore.rules`, tested in `tests/firestore-rules.test.mjs`).
- The logic is `pilot-core.js` (pure, tested in `tests/pilot-core.test.mjs`); the page uses `company-core.js` and `company-report.js` for the live numbers and snapshots. The wording of the run book, goals and health thresholds is in `pilot-core.js`. `docs/PILOT-PLAYBOOK.md` is the human version, with email wording to copy.
