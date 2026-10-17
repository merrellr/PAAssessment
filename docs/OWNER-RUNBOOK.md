# Owner runbook: running company accounts

This is written for you, the platform owner. Every step says where to click.
Nothing here needs you to write code. When something needs a code change, ask
Claude.

---

## 1. What lives where (the 60-second map)

| Piece | What it does | Where you manage it |
|---|---|---|
| The website | The assessment, the learner dashboard, the owner console, the company dashboard | GitHub (repo `PAAssessment`). It updates itself about a minute after a change is pushed. |
| Accounts and data | Sign-ins, results, companies, invitations, memberships | Firebase console, project **product-advisory-lms** |
| Security rules | Who is allowed to read or write what | Firebase console → Firestore Database → **Rules** tab |
| Results sheet, invite emails, scenario grading | The Google Sheet and its Apps Script | The Sheet → Extensions → Apps Script |

You are the **platform owner**. You are the only account with a record under
`platformAdmins` in Firestore. Only that account sees **Owner Console** in the
Profile menu.

---

## 2. Set up a new company

1. Sign in on the dashboard. Click your **Profile** menu, then **Owner Console**.
2. If you have no companies yet, the form is already open. Otherwise click **+ Create company**.
3. Fill in:
   - **Company name** and **Plan** (flat price, or per seat with a number of seats).
   - **Notes**. These are private to you. Company admins cannot see them.
   - **Point of contact** and **Billing address**.
   - **Focus areas**. Leave the standard order unless the company told you what matters most. Their admins can change it later.
   - **First admin** (optional): their name and email. Leave **Email the invitation now** ticked.
4. Click **Create company**. You land on the company's page.
5. The admin gets an email with a button. They sign in or create an account (any email address works), read what the company will be able to see, tick the box and click **Accept and join**.

**Check it worked:** on the company page the admin's row changes from *Invited* to *Active*.

### Adding more people
- On the company page click **+ Add users**. Type one person per line (`email, name, phone`) or choose a CSV file. Click **Create invites**.
- Or the company's own admins do this from their **Company dashboard** (Profile → Company dashboard). They do not need you.
- Each invite link works once, for one person, and expires (30 days by default). It is tied to the invite, not the email, so a person can accept with a personal account.

### If an email did not arrive
- On the person's row click **Resend email**. After 3 emails, or after it expires, click **Renew & email** or **New link & email**.
- Or click **Copy link** and send it yourself.
- Check spam first. The email is sent from your Gmail address.

---

## 3. What a company admin can do (and cannot)

They **can**: see their team's results and individual answers, see who is learning and who has gone quiet, download CSVs, invite and remove people, change the company's focus priorities, and read the recent-activity list.

They **cannot**: see your private notes, change the company's name, plan, seats, contacts or billing address, archive the company, or remove themselves.

A member **cannot** leave a company on their own. Only an admin or you can end a membership.

---

## 4. Removing a person

1. Open the company (Owner Console → **View**, or **Team dashboard** for the admin's view).
2. Click **Remove** on the person's row and confirm.

What happens: the person keeps their own account, results and course access. The company keeps what the person had shared up to that day and gets nothing new. The seat is freed. The person sees a notice on their dashboard.

A person who **deleted their account** while still in a company leaves a row with the name removed. Click **Remove** on that row to free the seat.

---

## 5. When a company stops paying

1. Open the company in the Owner Console and click **Archive**.
2. What this does: invitations stop working, admins can still read everything but cannot add people, and **members stop sending new information to the company**. Nobody is deleted.
3. Before you archive (or before you delete anything), open **Team dashboard** and click **Download team report** and **Download answers** so you have a copy.
4. To bring them back: **Restore**.

You decide how long to wait before archiving. There is no automatic timer.

---

## 6. Updating the security rules (do this whenever Claude gives you a new rules file)

1. Open the file Claude sends you (named like `firestore-rules-vN-PASTE-INTO-CONSOLE.txt`). Press **Ctrl+A**, then **Ctrl+C**.
2. Firebase console → **product-advisory-lms** → **Firestore Database** → **Rules** tab.
3. Click in the box, **Ctrl+A**, **Ctrl+V** (replaces everything), then **Publish**.

If something says *"the security rules refused this"*, the latest rules are probably not published yet.

---

## 7. Updating the email script

Only when Claude gives you a new `Code.gs`: open the Google Sheet → Extensions → Apps Script → select all, paste → **Deploy → Manage deployments → pencil → Version: New version → Deploy**.

**Is email working?** In the Apps Script editor choose the function `authorizeInviteEmails`, click **Run**, and approve the Gmail permission once. The owner console can then send. Limits: 80 invite emails a day, 3 emails per invite. Gmail's own limit is about 100 recipients a day.

---

## 8. A person asks you something

| They ask | What to do |
|---|---|
| "Delete my account" | They do it themselves: **Profile → Delete account**. It removes their results, sheet rows and sign-in, and removes their name and email from any company's copy. The company keeps the results without a name. |
| "What does my employer see?" | Their name, email, latest assessment (with individual answers) and course progress with when they were last active. Never reflections, saved templates, phone or profile. The consent screen they accepted says this. |
| "Remove me from my company" | Ask their company admin to click **Remove**, or do it yourself in the Owner Console. |
| "I cannot join / link says used or expired" | Open the company, find them, **Renew & email**. |
| "I lost access to my account" | Use **Forgot password** on the sign-in page. |

---

## 9. Cleaning up test data

Do this once before real customers, and any time you want a fresh start.

**Test accounts:** Firebase console → **Authentication → Users** → click the three dots on the row → **Delete account**.

**Test companies and records:** Firebase console → **Firestore Database → Data**.
- Delete the company document under **orgs**. Deleting it does *not* delete its sub-collections, so also open the company, and for **members** and **audit** use the three dots → **Delete collection**.
- Delete the matching documents under **orgFocus**, **orgPrivate**, and any rows under **invites** and **memberships** that belong to the test company.
- Test votes: open **toolVotes** and delete the test accounts' documents (their names start with the test account's id), then in Owner Console → Tool roadmap click **Recount votes** so the public totals match. Delete test entries in **toolSuggestions** the same way.
- A person's `progress` document is theirs; delete it only for test accounts you are removing.

The Google Sheet: delete test rows from the **Responses** and **Progress** tabs.

---

## 10. When things go wrong

| You see | Likely cause | Fix |
|---|---|---|
| "The security rules refused this" | New rules not published | Section 6 |
| "We couldn't load this company" | Rules not published, or the admin's membership ended | Section 6, or check the person is still Active |
| "The email service isn't set up yet, or didn't answer" | Apps Script not deployed, or Gmail permission missing | Section 7 |
| Admin sees no "Company dashboard" in Profile | They are not an *active admin* | Check their row in the Owner Console |
| Numbers look wrong for someone | They have not opened their dashboard since their last lesson | Their numbers refresh when they open the dashboard or finish a lesson |
| A company's priorities have no effect | They only break ties, and only if different from the standard order | Expected. Ask Claude if you want it stronger |

---

## 11. The Tool Roadmap (people vote for the next toolkit)

**Public page:** `https://assessment.productadvisory.co/tool-requests.html`. This is the link for the "Request a tool" button on the toolkits page (set it to open in a new tab).

**First time:** Owner Console → **Tool roadmap** → **Add the 10 starting tools**. They start with zero votes.

**Day to day**
- **Suggestions:** the page lists what people sent. **Approve…** opens the form with the idea filled in. Tidy the name and description and click **Save tool**. **Reject** keeps it private. Nothing is public until you approve it.
- **Change a tool's status:** click **Edit**. Statuses: Under consideration, Planned, In progress, Released. A Released tool needs the link to it, and stops taking votes.
- **If the numbers look wrong:** click **Recount votes**. It compares each tool's public total with the votes actually recorded and fixes any difference. (The "Check" column shows ✓ when they match.)

**When you release a tool**
1. Edit the tool: set it to **Released** and paste the link. Click **Save tool**.
2. In **Launch emails**, click **Copy emails** beside that tool.
3. Open a new email in Gmail. Put yourself in **To** and paste the addresses into **BCC** (never in To or Cc). Gmail allows about 100 recipients a day, so send in batches if the list is long.
4. Keep the message short: say you are writing because they asked to hear when it launched, link the tool, and thank them. Do not use the addresses for anything else.

**Rules of thumb**
- Start with about 10 tools. Add the best suggestions over time.
- Never add votes yourself. Counts start at zero and stay honest.
- Totals are a signal of interest, not a poll. Someone could make extra accounts.
- People can only vote after verifying their email. If someone says voting does not work, ask them to click the link in the verification email and then press **I've verified my email** on the page.

---

## 12. Requests for more information (the lead form)

**The link** (put it on the "Request more information" button and set it to open in a new tab): `https://assessment.productadvisory.co/request-info.html?src=toolkits`

Change the word after `src=` to match the page the button is on (for example `src=teams`, `src=home`). It shows up in every lead so you can see which page works. For a page aimed at companies add `&who=org` and the form skips its first question.

**What happens when someone sends it**
1. You get an email at rob@productadvisory.co. The subject starts with **[Hot]**, **[Warm]** or **[Nurture]**, then their name and company. Press **Reply** to answer them directly.
2. The same request is added as a row on the **Leads** tab of your results Google Sheet (open the sheet and click the Leads tab at the bottom). Use the **Status** and **Notes** columns to keep track: change `New` to `Contacted`, `Call booked`, `Won`, `Not a fit`, and so on.

**What Hot, Warm and Nurture mean** (only you see this; the person never does)
- **Hot** (80+ out of 100): an organization or team leader, a real team size, wants to start soon, and makes or shapes the decision. Reply today.
- **Warm** (50 to 79): a good fit with a longer timeline or less certainty. Reply within two business days, as the thank-you page promises.
- **Nurture** (under 50): usually an individual exploring. The thank-you page already points them at the free assessment, so no reply is required unless you want to send one.
- The email lists exactly why it scored that way. If someone shared their assessment, you also see their level and skill-area scores, which makes your reply much more specific.

**Limits and safety**
- One email address can send 3 requests a day, and the whole form takes 60 a day. Past that, the person is shown an email link instead.
- Robots are quietly ignored. You will not see them.
- If an email fails to send, the row is still saved on the Leads tab. Check it now and then.
- To delete someone's request (they ask you to), delete their row on the Leads tab.

**If it stops working** the page falls back by itself: people are given an email to info@productadvisory.co with their answers filled in (make sure that mailbox reaches you). To fix the form itself, check that the latest `Code.gs` is deployed (section 7), then open the page in a private window and send a test.

---

## 13. Costs and limits (free plan)

You are on the Firebase free plan (Spark). It is enough for a pilot. You will
want the paid plan (Blaze) when you have paying customers: it removes the daily
caps and allows server-side jobs (for example, automatic archiving after a
grace period). Ask Claude to plan that move when you are ready.

---

## 14. Checking the system still works (for whoever maintains it)

Claude keeps automated tests in `tests/`. `tests/README.md` says how to run
them: the security-rule tests, the report-logic tests, and the page tests.
Re-run them after any change.
