# Tests

None of these touch the live site, your Firebase project, or send real email.

**They run by themselves on GitHub.** `.github/workflows/tests.yml` runs all of them on every pull request and every
push to main: the unit tests, the security rules against the Firestore emulator, and every page (plus the Apps Script
checks) in headless Chromium. A pull request shows a green tick when everything passes, or a red cross with the failing
check named; open **Details** to read it. To run the page tests yourself on any computer:

    npm install --no-save playwright && npx playwright install chromium
    node tests/ui/run-ui-tests.mjs              # or: node tests/ui/run-ui-tests.mjs "feedback"


| What | Where | How to run |
|---|---|---|
| Security rules (who may read or write what) | `firestore-rules.test.mjs` | Needs Node 20 and Java 21. `npm install firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10`, then (from the repo root) `npx firebase emulators:exec --only firestore --project demo-pa "node tests/firestore-rules.test.mjs"` |
| What the company sees about a member (and what it never sees) | `org-share-core.test.mjs` | `node --experimental-default-type=module tests/org-share-core.test.mjs` |
| The team report (statuses, roll-up numbers, CSV exports) and that the lesson counts match `content/` | `company-core.test.mjs` | `node --experimental-default-type=module tests/company-core.test.mjs` |
| Every page's real code: owner console, join page, dashboard, company dashboard, delete account, lessons, shared-record sync | `ui/` | `node tests/ui/run-ui-tests.mjs` (Chromium, any computer; it also runs the two `apps-script/` pages below), or `powershell -ExecutionPolicy Bypass -File tests\ui\run-ui-tests.ps1` (Edge on Windows) |
| The "Request more information" form's logic (screens, answers, what is sent) | `lead-core.test.mjs` | `node --experimental-default-type=module tests/lead-core.test.mjs` |
| The Tool Roadmap's logic | `tool-core.test.mjs` | `node --experimental-default-type=module tests/tool-core.test.mjs` |
| Saving and emailing "Request more information" leads (validation, scoring, spam rules) | `apps-script/lead-test.html` | same as the line below, with `lead-test.html` |
| The Reports numbers, insight sentences, AI privacy guard and weekly email (the server side) | `reports-logic.test.mjs` | `node tests/reports-logic.test.mjs` |
| The company admin's report (sentences, funnel, comparison, trend, what "Explain with AI" may send) | `company-report.test.mjs` | `node --experimental-default-type=module tests/company-report.test.mjs` |
| The sitemap and robots.txt (the sitemap lists exactly the pages that may be indexed) | `sitemap.test.mjs` | `node --experimental-default-type=module tests/sitemap.test.mjs` |
| Google Analytics: where it runs, what it sends, and which pages carry it | `analytics.test.mjs` | `node --experimental-default-type=module tests/analytics.test.mjs` |
| The shared Product Advisory look: theme files on each page, the search index, "Make it yours" and its shared cookie | `theme.test.mjs` | `node --experimental-default-type=module tests/theme.test.mjs` |
| The pilot tracker's logic (stages, run book, goals, baseline, health) | `pilot-core.test.mjs` | `node --experimental-default-type=module tests/pilot-core.test.mjs` |
| Which address each email comes from, the welcome email, and the company "Explain with AI" (the server side) | `mail-and-org-ai.test.mjs` | `node --experimental-default-type=module tests/mail-and-org-ai.test.mjs` |
| The admin welcome and the tool launch emails (who may send, limits, wording, no double sends) | `admin-welcome-and-launch.test.mjs` | `node --experimental-default-type=module tests/admin-welcome-and-launch.test.mjs` |
| Invite emails and the Gmail self-check | `apps-script/mail-test.html` | `msedge --headless --allow-file-access-from-files --virtual-time-budget=5000 --dump-dom file:///<path>/tests/apps-script/mail-test.html` and read the page title (PASS / FAIL lines) |

## How the page tests work

`ui/fake-firebase.js` is a small in-memory stand-in for Firebase. The runner
builds throwaway copies of the real pages with the Firebase web addresses swapped
for that fake, appends a test script, and drives them in headless Edge. The real
pages in the repo are never modified.

## One check done by hand

Finishing a lesson that is **not** the last one moves the browser to the next
lesson straight away, so a script can't read the result afterwards. The page waits
for the company copy to be saved before it moves on (see `markCompleteAndContinue`
in `lesson.html`). To check it: build the lesson test page with the runner, open
`les-test.html?scn=nav&course=discovery-novice&lesson=1` in a browser, wait for the
page to move to lesson 2, then in the console read `sessionStorage.getItem('navlog')`.
It should list `set:progress/...` followed by `set:orgs/.../members/...`.
