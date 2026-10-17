# Company accounts: privacy wording for review

**This is a draft for a qualified lawyer to review. It is not legal advice.** It
describes exactly what the software does today so that the policy and the
product say the same thing. Anything in [brackets] is a decision or detail for
you and your lawyer.

Where to use it: the Privacy Policy and Terms of Use on productadvisory.co, and
(for the "customer" parts) your contract with each company.

---

## A. What the product actually does (facts the wording must match)

- A person's account is **their own**. It is never created under a company, and it
  is not locked to the company.
- A company can invite a person. The person sees, **before joining**, exactly what
  the company will see, and must tick a box to agree.
- While a person is an active member, the company's admins can see:
  - the person's name and email,
  - their latest assessment result **including their individual answers**,
  - their course progress (lessons finished) and when they were last active.
- The company **cannot** see: private course reflections, saved templates, phone
  number, or the rest of the person's profile.
- **Product Advisory** (the platform operator) can also see this information, in
  order to run and support the service.
- **Only the company's admins (or Product Advisory) can end a membership.** A
  person in a company account cannot leave on their own.
- When a membership ends: the person keeps their account, results and course
  access. The company keeps what it had received up to that day and receives
  nothing new.
- If a company's account is archived (for example it stops paying), members stop
  sending it new information, the same as if they had left.
- A person can **delete their account at any time**. Their results and sheet rows
  are deleted from the platform; their **name and email are removed** from any
  company's copy. The company keeps the results **without the name**.
- Companies can set a ranked list of priority skill areas. It is used only to
  break ties when recommending which course to take next. It does not hide
  anyone's other gaps and is not shown to the person as a score.
- A company's admins and Product Advisory can see a recent-activity list of
  administrative actions (invitations, removals, priority changes).

---

## B. Draft text for the Privacy Policy

### Company (employer) accounts

If your employer or another organisation ("your company") invites you to a
company account on Product Advisory Learning, joining is always your choice. Your
account stays yours: it is not created under, or locked to, your company.

**What your company can see.** While you are a member, your company's
administrators can see your name and email address, your latest assessment
results (including your answers to individual questions), your course progress
and when you were last active. They cannot see your private course reflections,
saved templates, phone number or the rest of your profile. We show you this
before you join, and you must agree before you are added.

**Who else sees it.** Product Advisory, which operates the platform, can also
access this information to provide and support the service. [Add: service
providers, e.g. Google (Firebase hosting and database, Google Sheets, Gmail for
invitation emails); [Groq if the written-scenario grading is switched on]. Add
countries where data is processed.]

**How your membership ends.** Only your company's administrators (or Product
Advisory) can end your membership. [Confirm this is acceptable under the laws
that apply to you and your customers.] When it ends you keep your account, your
results and your access to the courses you had. Your company keeps the
information it had already received, and it receives nothing new.

**If you close your account.** You can delete your account at any time from your
profile page. Your results and related records are deleted from our systems, and
your name and email are removed from your company's copy. Your company may keep
the results, without your name or email. [Confirm retention period and wording
about "de-identified" data with counsel; consider whether results without a name
could still identify someone in a small team.]

**If your company's account ends.** If your company stops using the service,
administrators first keep read-only access for a set period [define: __ days],
then their account is archived. From the moment it is archived you stop sending it
new information.

**Your choices and rights.** [Insert the rights that apply: access, correction,
deletion, objection, complaint to a regulator. Explain how to exercise them:
profile page and contact address.]

### Retention
[Define: how long results, shared company copies, activity logs and invitations
are kept; what happens to archived companies.]

### Security
Data is stored with Google Firebase. Access is controlled by security rules that
only allow a person to read their own data, a company's administrators to read
their own company's members, and Product Advisory to read all of it. [Add other
measures: encryption in transit/at rest, access controls, incident process.]

---

## C. Draft points for the customer contract (company side)

These matter as much as the policy. Suggest your lawyer covers:

1. **Roles.** Who is the "controller" and who is the "processor" for employee
   data in company accounts. A data processing agreement may be required.
2. **Purpose limitation.** The company may use members' results **only to support
   their development and learning**. [Consider an explicit clause: not for
   hiring, firing, promotion, pay or disciplinary decisions.]
3. **Confidentiality.** Admins keep individual answers and results confidential,
   and share them only with people who need them.
4. **Admin accounts.** The company is responsible for who it makes an admin, and
   for removing admins who leave.
5. **Access when the contract ends.** Read-only period, export of reports,
   archive, and what is deleted and when.
6. **Employee voluntariness.** Where employees may feel pressure to join, how that
   is handled (consent wording, the ability to decline without penalty).
7. **Individual rights requests.** Who answers them, and how quickly.
8. **Data location and sub-processors.** List them and how changes are notified.

---

## D. Questions to put to your lawyer

1. Is a person's tick-box consent enough for employees, given the power imbalance
   with an employer? Is another legal basis safer?
2. Is it acceptable that a person cannot leave a company account on their own?
   Does it matter if their data keeps flowing to the employer while they are a
   member?
3. After deletion, can the company keep results without a name, in small teams
   where the person might still be identifiable?
4. Do you need a data processing agreement, a records-of-processing entry, or a
   data protection impact assessment (employee data, individual answers)?
5. Which regions' laws apply to your customers (for example the EU/UK GDPR, US
   state laws), and does any of this need a regional addendum?
6. Retention periods for each kind of record.
7. Wording of the consent screen (`join.html`) and the dashboard notices. These
   are intended to match section A exactly.

---

## E. Where the product text lives (so wording stays in step)

| Text | File |
|---|---|
| "What your company can see" consent screen | `join.html` |
| Notice shown to a member of a company | `lms-dashboard.html` (`showCompanyNoticeIfMember`) |
| Notice shown after a membership is ended | `lms-dashboard.html` (same function) |
| What is shared, exactly | `org-share-core.js` (explicit field list; has unit tests) |
| Who can read/write what | `firestore.rules` (has tests) |
