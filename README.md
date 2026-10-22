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
  The top card has **Request a tool** (goes to the request form, or to sign-in first) and **See the live toolkits**
  (the toolkits page on www.productadvisory.co). `tool-requests.html#suggest` opens straight on the request form.
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
- It lists My learning dashboard, My profile, Toolkits (the toolkits page on www.productadvisory.co, new tab), Request tools (`tool-requests.html#suggest`), Send feedback (`feedback.html`), Visit Product Advisory and Log out for everyone; the dashboard's own menu has the same links; Company dashboard only for an active company admin; Owner console and Reports only for the platform owner. The page you are on is shown in bold.
- It finds the owner and the admin by reading `platformAdmins/{uid}` and `memberships/{uid}`, the same two records the dashboard menu uses, so no new security rules are needed. It is tested in `tests/ui/menu-test.js` ("profile menu" pages in the runner).

## Send feedback (feedback.html)

- The Profile menus' **Send feedback** opens `feedback.html` instead of an email. A signed-in person picks what it is
  about (courses and lessons, the assessment, something not working, an idea or request, something else), optionally
  how it's going, and writes up to 2000 characters. `feedback.html?about=idea` chooses the topic in advance.
- It is sent to the Apps Script (`?action=feedback`, section 15 of `Code.gs`), which checks the sign-in, saves it on a
  **Feedback** tab and emails it to feedback@ with a reply-to of the person, so replying is one click. Each person can
  send 10 a day and everyone together 200. Redeploy the script after changing it.
- Tests: `tests/mail-and-org-ai.test.mjs` (the script) and `tests/ui/feedback-test.js` ("feedback form" in the runner).

## Company reports (company admins)

- The top of `company.html` has a **Report**: a one-line headline, "What stands out" (at most four sentences, problems first), an adoption funnel (invited, joined, took the assessment, started learning, finished), the team's average score in each skill area next to the average of everyone who has taken the assessment, and a trend over time. **Print or save as PDF** gives a one-page summary; **Explain with AI** is optional.
- The logic is `company-report.js` (pure, tested in `tests/company-report.test.mjs`). Sentences are written by fixed rules and use counts instead of percentages for small teams. The comparison with everyone uses the public totals from the Apps Script and only appears when the team has at least 3 assessed people and at least 10 assessments exist overall.
- **Weekly snapshots.** When an admin (or the owner) opens the dashboard and the last snapshot is a week old, the page saves a numbers-only record to `orgs/{orgId}/snapshots/{day}` (people, assessed, learning, finished, quiet, average scores; never a name or email). That builds the trend. The rule is in `firestore.rules` and must be published; snapshots can never be changed or deleted.
- **Explain with AI** asks `orgReportAi` in the Apps Script (section 11). Only an active admin of that company, or the owner, is allowed. The server rebuilds the numbers from a fixed list (whole numbers, the seven skill-area names, the five funnel step names), so a name or email cannot be passed on, and limits each company to 5 a day (40 in total).

## Goals, check-in emails and company report emails

- **Goals.** On My profile (`profile.html#goals`) a learner sets a weekly goal (1 to 10 lessons, 2 by default) and up
  to three focus areas. They are saved on `progress/{uid}` as `goals` and `notify` (`checkin`, `orgReport`: `daily`,
  `weekly`, `monthly` or `off`; missing means weekly, so everyone, including existing accounts, gets the weekly email).
  `lesson.html` adds each newly finished lesson to `lessonLog` (`{ 'YYYY-MM-DD': count }`, the learner's own calendar,
  last 400 days), and the dashboard shows "This week: 1 of 2 lessons" next to Your Courses.
- **The emails.** The learner's check-in: how they did against their goal over the period that just ended, their plan,
  their focus areas (or their two weakest, suggested) and a button to the next lesson. A company admin's report: seats
  (active, pending, available), the team's numbers, "What stands out" from the dashboard's own report rules, the focus
  areas and a button to the full report. Admins choose the report frequency on My profile too. The daily email covers
  yesterday, the weekly one (Mondays) last week and the monthly one (the 1st) last month. Nothing goes out before 8am.
- **Unsubscribe and change.** Every email links to `email-settings.html?u=…&k=…`, signed for that account (an HMAC
  with the `NOTIFY_SECRET` script property, made on first use), so it works without signing in and cannot be used for
  anyone else. The Unsubscribe link adds `&off=checkin` (or `orgReport`): the page switches that email off as it opens
  and offers Undo. The page does not load analytics.
- **How it runs.** `notify-core.js` holds the logic (what is due, what each email says), shared with the website.
  `apps-script/notify.gs` is built from it, `company-core.js` and `company-report.js` (`node tools/build-notify-gs.mjs`;
  a test fails when it is out of date) and goes into Apps Script as a second file next to `Code.gs`. Section 16 of
  `Code.gs` reads Firestore and the account list with a service account (a scheduled run has no signed-in person),
  runs every hour, keeps 60 emails of the daily allowance for invites, welcomes and feedback, stops after 4.5
  minutes, and records each send on a **Notifications** tab, so anything left over goes out on the next run.
- **Setup:** the steps are at the top of section 16 in `Code.gs` (add `notify.gs`, add the `FIREBASE_SERVICE_ACCOUNT`
  key, run `checkNotificationsSetup`, `sendMyCheckinPreview`, then `installNotifications`, and deploy a new version).
- Tests: `tests/notify-core.test.mjs`, `tests/notify-server.test.mjs`, and "profile goals", "email settings", "last
  lesson" and "dashboard" in the UI runner.

## My badges

My Profile → **My Badges** (`/profile#badges`, also in both Profile menus) shows every badge, how many are
earned out of how many, the three closest to being earned ("Up next"), and a filter for earned / still to
earn. The dashboard shows a "New badge!" pop-up when one is newly earned.

- On **My Learning**, a My Badges tile ("4 of 28 badges", the latest medals and the next badge) opens the whole
  collection in a window over the page; so do the pop-up's "See My Badges" and the dropdown's My Badges.
- The collection, the tile, the window and the close-up are drawn by `badges-ui.js`, shared by both pages.
- The list and all the counting live in `badges-core.js` (tested by `tests/badges-core.test.mjs`); styles in
  `badges.css`. To add a badge, add a line to `BADGES` with a `metric` that `stats()` already counts (or add one).
- Groups: Getting started, Showing up (7/14/30/60/100 days), Weekly goal, Lessons (10/25/50/100),
  Courses (1/5/10/20/all 28), Mastery (area or plan complete, Advanced in an area, Graduated to Advanced overall).
- The look borrows from a smartwatch's awards: each group has its own shape (coin, hexagon, shield,
  rounded square, octagon, star), each badge its own enamel colour (`hue`) and, for counting badges, an
  embossed number (`num`, `unit`). The rim is the metal (bronze → platinum). Badges not yet earned show the
  same shape, flat and pale. On My badges, medals tilt toward the pointer, and clicking a badge opens it up
  close (with its date, or how far along). All drawn as SVG by `medalSvg`, no images.
- Everything comes from the learner's own `progress/{uid}` document, so no new rules are needed. Two new fields:
  `activeLog` (`{ 'YYYY-MM-DD': 1 }`, written once a day by the dashboard and lesson pages, about a year kept)
  and `badges` (`{ id: 'ISO date first earned' }`). A badge once earned stays earned, even if a retake scores lower.
- Days before this release count only where a lesson was finished (`lessonLog`), so "Showing up" starts
  counting visits from the day it goes live.

## Security notes

- **No secrets in this repository.** Keys live in Apps Script script properties (GROQ_API_KEY,
  FIREBASE_SERVICE_ACCOUNT, NOTIFY_SECRET, BLOCKED_SENDERS). The Firebase web API key in the pages is public by
  design; restrict it in Google Cloud (APIs & Services → Credentials) to the site's addresses.
- **Who sees what** is enforced by `firestore.rules` (tested in `tests/firestore-rules.test.mjs`).
- **The Apps Script backend** answers anyone on the internet, so:
  - anything about a person (their result lookup, progress sync, welcome, feedback, Ask AI) needs their Firebase
    sign-in token, and the email always comes from that token, never from the request;
  - the list of companies people entered is never sent out; My Profile asks for one close spelling (`companyMatch`);
  - text from visitors is written to the sheets with `leadSafeCell_`, so it can never run as a formula;
  - JSONP callback names are checked (`safeCallback_`).
- **Pages** show other people's text with `textContent` or an escape function, never as raw HTML.

## Emails: who sends what

- `apps-script/Code.gs` section 9 holds the list of addresses (`MAIL_ADDR_`). `sendMail_` sends from the chosen address when Gmail lists it as one this account may send as, and otherwise sends from the account that owns the script, so adding an address later needs no code change.
- noreply@: the welcome email and the notices to Rob. assessment@: replies to welcome and invitation emails. sales@: the "Request more information" thank-you and its replies. info@: the public contact shown on the site. toolkit@: the Tool Roadmap contact. feedback@: the "Send feedback" item in the Profile menus. legal@: privacy and legal questions in the welcome email. marketing@: reserved for newsletters.
- **Welcome email** (section 10): `account-menu.js` (on every page, including the dashboard and invitation page with `?menu=off`) asks for it when it sees a signed-in account made in the last two days. The script checks the sign-in token, sends only to that account's own address, records the account on the **Welcomes** tab so it is sent once, and stops at 40 a day. Deleting an account removes its row. Tests: `tests/mail-and-org-ai.test.mjs` and the "profile menu" pages in the UI runner.

## Pilot and customer tracker (owner only)

- `owner-pilot.html?org=<id>` (button **Pilot tracker** on each company in the Owner Console, and a **Stage** column in the company list) tracks a company from prospect to customer: seven stages, a run book of things to do at each stage (some tick themselves from the data), goals with targets judged against live numbers, a before-and-after table against a saved baseline, a progress chart from the weekly snapshots, a health check once someone is a customer, and a private timeline of notes. **Print the pilot summary** gives a one-page summary that leaves out the private notes and the health check.
- Data: `orgPilot/{orgId}` (stage, dates, goals, ticked run-book items, a summary note) and `orgPilot/{orgId}/log/{id}` (the timeline). Both are readable and writable by the platform owner only; company admins can never see them (see `firestore.rules`, tested in `tests/firestore-rules.test.mjs`).
- The logic is `pilot-core.js` (pure, tested in `tests/pilot-core.test.mjs`); the page uses `company-core.js` and `company-report.js` for the live numbers and snapshots. The wording of the run book, goals and health thresholds is in `pilot-core.js`. `docs/PILOT-PLAYBOOK.md` is the human version, with email wording to copy.

- **Admin welcome** (section 12): when someone joins a company as an admin (`join.html` announces the new membership with a `pa-membership-changed` event, and `account-menu.js` also checks on every page load for an admin who joined in the last two days), the script re-reads their own membership with their token and sends "Your [company] dashboard is ready" from assessment@, once per admin per company (the **AdminWelcomes** tab), plus a short notice to Rob linking the pilot tracker. Tests: `tests/admin-welcome-and-launch.test.mjs` and the "adminjoin" pages in the UI runner.
- **Tool launch emails** (section 13): on `owner-tools.html`, **Send launch emails** (and **Send me a preview**) next to a Released tool with a launch link asks the script to email everyone who ticked "Email me when this launches" for that tool, from the name "Toolkit Notification" with replies to toolkit@. Only the owner can send; the addresses are read from the vote records with the owner's token; each person is emailed once per tool (the **ToolLaunchSent** tab); at most 80 a press, always leaving 15 of Gmail's ~100 daily emails in reserve. Tests: `tests/admin-welcome-and-launch.test.mjs` and the "tool roadmap admin: launch" page.

## The Product Advisory look (header, search, "Make it yours", light and dark)

Every page shares the look of www.productadvisory.co: the learner pages, the company dashboard, and the owner pages
(owner console, reports, Toolkits Roadmap admin, pilot tracker, aggregate results). Three files do it:

- `pa-prefs.js` (in the `<head>`, before the page's `<style>`): applies the visitor's look before anything is drawn:
  style (Classic, Editorial, Boardroom, Lab), accent, text size, density, motion and light/dark. The look is kept in a
  preference cookie on `.productadvisory.co` (`pa_look`) shared with www.productadvisory.co and the portfolio, so a
  choice made on one site opens the others the same way.
- `pa-theme.css` (straight after the page's `</style>`): the brand tokens copied from the main site (with a `--pa-`
  prefix), in light and dark, plus the four styles and the accents. It re-points the names every page already uses
  (`--navy` fills buttons, `--navy-deep` is heading ink, `--surface`, `--bg`, `--ink`, `--ink-soft`, `--line`, `--gray`,
  `--ok`, `--warn`, `--note-*`) so each page gets dark mode without being rewritten. Use those names, never a hex
  colour, in new page styles.
- `pa-shell.js` (straight after `<body>`): draws the site header (logo, My learning, search, Make it yours,
  light/dark, and the Profile button from `account-menu.js`). It is kept short on purpose: the assessment is reached
  from the dashboard (first launch or Retake), and the Toolkits Roadmap from www.productadvisory.co or the Profile menu, the Make it yours panel and the search menu (⌘K / Ctrl+K or /). Search covers every course,
  lesson and skill area from `search-index.js`, which is generated: **after adding or editing a course in `content/`,
  run `node tools/build-search-index.mjs`** (the theme test fails until you do).

Shared stylesheets that predate the look (`charts.css`, `focus-board.css`) keep their light colours; `pa-theme.css`
re-points them on themed pages. The framework's seven skill-area icons are line icons in the main site's style
(`DOMAIN_ICON_PATHS` in `framework.html`).

Fonts are Lato for text and Comfortaa for the logo. Font sizes are in `rem`, so "Text size" scales the whole page.
`tests/theme.test.mjs` lists which pages are converted (`THEMED`).

## Lessons: layout and building blocks

- **Layout.** On screens 1080px and wider, `lesson.html` shows the course outline on the left: progress ring, every
  lesson with its reading time and a tick when done, and the course's key takeaways. The lesson fills the rest.
  Narrower screens keep one column with the lesson pills on top. A thin bar along the top of the window shows how far
  you've read, and the line under the title shows "Lesson 2 of 5 · About 5 min · 12 min left in this course".
- **Building blocks.** Besides `body`, a lesson in `content/` may list `blocks`, in reading order. They are drawn by
  `lesson-blocks.js` (styles in `lesson-blocks.css`). Each type is described at the top of that file:
  - story: a short scene with a cast, optionally pausing at "What happens next?";
  - stat: one number with its source;
  - bars: a horizontal bar chart, one series, with one bar highlighted, hover and focus tooltips, and a data table for
    screen readers;
  - curve: a line with a slider and a sentence that changes as you move it;
  - matrix: a competitor grid with the gap column highlighted;
  - compare: weaker vs better;
  - sort: classify each item, with feedback and a score;
  - scenario: choose what to do and see what happens;
  - flow: steps in order;
  - personas;
  - takeaway;
  - quote.
- The words in blocks go into search and "Ask AI" (`LessonBlocks.text`, used by `tools/build-search-index.mjs`).
  Rebuild the indexes after editing a course.
- **The flagship course** is `content/discovery-novice.js` (Customer & Market Discovery, Limited Experience): one story
  across five lessons, with every block type in use. The company and people in the story, and the numbers from their
  pilot, are fictional and marked so on the page. Every other figure names its source.
- Tests: "lesson blocks" and "last lesson" in the UI runner; `tests/company-core.test.mjs` checks each course's lesson
  count by loading its file.

## "Ask AI": answers from the lessons

Typing a question in the search menu (three or more words, or ending in "?") adds an **Ask the lessons** row at the top.
Choosing it:

1. loads `ask-index.js` (every lesson's text in passages of up to 800 characters, generated with `search-index.js` by
   `node tools/build-search-index.mjs`) and picks the four passages that best match the question, at most two per lesson;
2. sends the question, those passages and the person's sign-in token to the Apps Script (`?action=askLessons`,
   section 14 of `Code.gs`);
3. shows the answer with numbered citations that link to the lessons, and the lessons it drew from.

The script checks the sign-in, keeps only passages that link to a lesson or skill area on this site, tells the AI to
answer only from them (and to ignore instructions inside them), and allows 20 answers per person and 400 in total a
day. It uses the same `GROQ_API_KEY` script property and model as scenario grading. Signed-out visitors are asked to
sign in; a question the lessons do not cover is pointed to the Ask on www.productadvisory.co. After changing
`Code.gs`, redeploy it (Deploy → Manage deployments → pencil → New version) so the live address has the new action.
Tests: `tests/mail-and-org-ai.test.mjs` (the script) and `tests/theme.test.mjs` (the passages).

## Clean addresses

Pages are files (`lms-dashboard.html`), but links use the clean address: `/lms-dashboard`, `/lesson?course=…`, and `/`
for the assessment. GitHub Pages serves `lms-dashboard.html` for `/lms-dashboard`, so old links (in emails, bookmarks
and Google) keep working, and `pa-prefs.js` shows them as the clean address in the address bar. Write new links the
same way (`href="/feedback"`). Where code needs the page's file name it normalises it (`currentPage()` in
`account-menu.js`, `page()` in `pa-shell.js`). The search and Ask indexes keep file names (`lesson.html?course=…`,
which is what the Apps Script checks) and `clean()` in `pa-shell.js` turns them into links. The UI test servers
serve `/page` from `page.html` too. The Apps Script's emails still link to `.html` addresses, which work and tidy
themselves; they can be switched at the next redeploy.

## Google Analytics and the cookie notice

- `analytics.js` loads Google Analytics 4 (measurement id `G-4XFS1QWS9H`, set once at the top of that file) on the public and learner pages only: the assessment, framework, request form, Tool Roadmap, dashboard, lessons and profile. It is deliberately **not** on the owner and admin pages (owner, owner-tools, owner-pilot, reports, company), the invitation page (its address holds a secret link) or the aggregate results page. A new page must be added to one of the two lists in `tests/analytics.test.mjs`, which fails until it has been decided.
- **By location, the same as www.productadvisory.co.** Visitors whose device time zone is in Europe see a notice first (Accept and Decline, equal weight, linking the Privacy Policy) and nothing from Google loads until they accept. Everywhere else Google Analytics starts with no notice; as a safety net, Consent Mode keeps analytics cookies off for anyone Google places in the EEA, UK or Switzerland by IP address until they accept. The answer is kept in the browser (`localStorage` keys `pa_cookie_consent` and `pa_cookie_consent_at`), so nobody is asked again. Accepted: Google runs with cookies. Declined: it never loads.
- **Signed in counts as accepted.** `account-menu.js` calls `PAAnalytics.acceptFromAccount()` for every signed-in person (it is on every page, including the dashboard and invitation page), because creating an account means agreeing to the Terms and Privacy Policy. Someone who clicked Decline on that device before signing in stays declined.
- **Changing the choice:** "Cookie settings" in the footers (assessment, lessons, profile), in the Profile menu and in the dashboard's Profile menu reopens the notice. Any link with a `data-cookie-settings` attribute does the same.
- Also: nothing runs on a local test server (the notice still shows, so it can be tested), nothing for visitors who send Do Not Track or Global Privacy Control (they see no notice either), advertising features and Google signals are off, and only the parameters `course`, `lesson`, `src`, `who` and `call` are sent with a page view (tokens, company ids and the #part are dropped in the browser).
- Add it to a new public page with `<script src="analytics.js"></script>` in the head. Tests: `tests/analytics.test.mjs` and the "cookie notice" pages in the UI runner. The paragraph to paste into the Privacy Policy, and the Google Analytics settings to match it, are in `docs/PRIVACY-POLICY-ANALYTICS.md`.

## Google Search Console: sitemap and robots

- `sitemap.xml` lists the pages meant to appear in Google: the assessment (the bare domain), `framework.html` and `tool-requests.html`. Submit `https://assessment.productadvisory.co/sitemap.xml` in Search Console under **Sitemaps**. `robots.txt` welcomes search engines and points to it.
- Every other page carries `<meta name="robots" content="noindex, nofollow">` (owner and admin pages, the invitation page, the request form, sign-in, lessons, profile, the aggregate results page), and `robots.txt` deliberately blocks nothing, because a page Google is not allowed to open cannot show Google its "noindex".
- When you add a public page, add it to `sitemap.xml` (with today's date as `lastmod`); when you add a private one, give it the noindex tag. `tests/sitemap.test.mjs` fails if the two ever disagree. Update a page's `lastmod` when you change it.
