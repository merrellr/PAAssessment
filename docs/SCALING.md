# Scaling and paid upgrades

What Product Advisory runs on today, what it costs, and the signal that says it's time to upgrade each piece.
Prices are approximate (October 2026); check the provider's pricing page before you buy. Rule of thumb: upgrade
when a signal below fires, not before.

## Do these now (free, about 15 minutes)

- [ ] **Firebase plan.** Firebase console → Usage and billing. Two-step verification (Identity Platform) needs the
      Blaze (pay-as-you-go) plan. If it says Blaze: Google Cloud console → Billing → Budgets & alerts → a $20 monthly
      budget for all projects, alerts at 25%, 50%, 90% and 100%. If it says Spark, nothing can be charged.
- [ ] **Groq.** On the free tier nothing can be charged; the AI helpers just stop for the day if they hit the limit.
      If you ever add a card, set a monthly spend limit (about $10) at the same time.

## What it runs on

| Piece | Used for | Today | Free limit (roughly) | Upgrade when | Next step and cost |
|---|---|---|---|---|---|
| GitHub | Code for all three sites | Free, public repos | Unlimited public and private repos; 2,000 Actions minutes a month for private | Lessons become paid content, or a client asks for private code | GitHub Pro, $4/month (Pages from a private repo). Team, about $4 per user/month, if Amanda needs private repos |
| GitHub Pages | www, portfolio and assessment sites | Free | About 100 GB of traffic a month | Tens of thousands of visitors a month | Firebase Hosting or Cloudflare Pages; free at this size |
| Firebase Auth / Identity Platform | Sign-in, two-step verification | Free tier | 50,000 monthly active users | Past 50,000 monthly users | About half a cent per user per month above that |
| Firestore | Accounts, progress, badges, votes, companies | Free daily allowance | About 50,000 reads and 20,000 writes a day, 1 GB stored | Usage page shows you near the daily limits | Blaze: cents per 100,000 reads and writes. A few hundred active learners is typically under $5/month |
| Firestore backups | Restore after a mistake | Not set up | | The first paying client, or data you'd hate to lose | Scheduled exports to Cloud Storage: pennies a month |
| Google Sheets + Apps Script | Contact form, newsletter sign-ups, AI question logs, emails | Free with Workspace | 10 million cells per spreadsheet; about 1,500 emails a day; 6 minutes per run | See "Sheets to a database" below | Firestore (already used) |
| Groq | The AI helpers (Ask, contact drafts, finders) | Free tier | Requests per minute and per day | The helpers start saying they're busy | Paid tier, pay per use: at your volume, cents to a few dollars a month. Add per-visitor limits before promoting the AI features widely |
| Google Workspace | rob@, info@, assessment@ email | Paid | | | About $7–14 per user per month |
| Domains | productadvisory.co | Paid | | | About $15–40 a year each |
| Email sending | Learning check-ins, receipts | Apps Script | About 1,500 emails a day | Close to 1,000 emails a day | Postmark or SendGrid, about $15/month |
| Text messages (backlog) | Notifications by SMS | Not built | | When you build it | Twilio: about $20 one-time registration, then a few dollars a month plus about a cent per text |
| Payments (later) | Paid courses or tools | Not built | | First paid product | Stripe: about 2.9% + 30¢ per payment, no monthly fee |

## Sheets to a database

**Move to Firestore, not Postgres.** The app already runs on Firestore, with security rules that are tested on
every pull request. Postgres would mean a second database to run, pay for and secure:
Cloud SQL from about $10–30/month even when idle; Supabase Pro about $25/month (the free tier pauses when idle);
Neon about $19/month.

Move one sheet at a time, when any of these happens:
- a tab passes about 50,000 rows, or Sheets gets slow;
- hundreds to 1,000+ form or AI requests a day, or quota errors in Apps Script's Executions log;
- the app needs to read the data (for example, showing learners their own past questions);
- rows go missing or double up when several people submit at once;
- a client asks how their data is stored.

The AI question log is likely to move first. Consider Postgres (or BigQuery for reporting) only with thousands of
monthly users and real reporting needs.

## Later idea: save tool work in Product Advisory Learning

Today the free tools (scorecard, AI use cases, build/buy/partner, impact score) keep work in the visitor's
browser, with a share link and export to PDF, Excel or Google Sheets. A "Save to Product Advisory Learning" button
would let signed-in learners keep, copy and share their work across devices.

- **How:** the same sign-in as the assessment; each saved tool is one Firestore document per person
  (`toolDocs/{uid}/{id}`), with rules so only its owner can read it. The tools already turn their state into a
  compact form for share links, so saving is the same data.
- **Cost:** negligible. A save is one write; thousands of saves a month stay inside the free allowance.
- **Work:** a few days, including tests.
- **When:** when the tools get steady traffic, or people ask to keep their work. It also gives visitors a reason to
  create an account, which feeds the learning platform.

## Scaling checklist by stage

| Stage | Do this |
|---|---|
| Now | Budget alerts (above); repos stay public |
| First paid course or client | Lesson content to a private repo (GitHub Pro); Firestore backups; review the privacy policy |
| About 100 active learners, or the app needs Sheet data | Move the question log and other app-facing Sheets to Firestore |
| About 1,000 sign-ups or submissions a day, or quota errors | Move the remaining high-volume Sheets; an email sending service; Groq paid tier with limits |
| Thousands of monthly users, or real reporting needs | Then consider Postgres or BigQuery for analytics |
