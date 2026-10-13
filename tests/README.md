# Tests

None of these touch the live site, your Firebase project, or send real email.

| What | Where | How to run |
|---|---|---|
| Security rules (who may read or write what) | `firestore-rules.test.mjs` | Needs Node 20 and Java 21. `npm install firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10`, then `RULES_PATH=../firestore.rules npx firebase emulators:exec --only firestore --project demo-pa "node tests/firestore-rules.test.mjs"` |
| What the company sees about a member (and what it never sees) | `org-share-core.test.mjs` | `node --experimental-default-type=module tests/org-share-core.test.mjs` |
| Every page's real code: owner console, join page, dashboard, delete account, lessons, shared-record sync | `ui/` | `powershell -ExecutionPolicy Bypass -File tests\ui\run-ui-tests.ps1` (needs Microsoft Edge) |
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
