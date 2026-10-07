# People OS: product requirements (as built)

**Status:** working template, October 2026. Everything below is built and clickable in this repo.
**What it is:** a complete HR, payroll and workforce product for businesses that run on shifts. It has three portals (HR admin, Manager, Employee) and three demo companies (India, US, UK), and the numbers agree across every screen.

---

## 1. Who it's for

**Primary buyer:** owners, HR heads and payroll managers at **10–500 person businesses with deskless, shift-based staff**. That covers security and facility services, cleaning, hospitality and food, retail, logistics, healthcare support and staffing agencies.

**Why this segment:**
- They run payroll monthly or bi-weekly with overtime, night allowances and loss of pay.
- Their people are spread across client sites, and a supervisor is often the only one with a laptop.
- They juggle contract labour from agencies.
- Statutory compliance (PF/ESI/PT in India, FLSA/FICA in the US, PAYE/NI/NLW in the UK) is a real risk.
- Most HR suites are built for office teams and feel heavy for this segment. Point tools (a scheduler here, a payroll bureau there) leave them retyping data.

**Who uses it every day:**

| Portal | User | Their job |
|---|---|---|
| HR admin portal | HR / payroll lead (e.g. Meera, HR & payroll at Sentinel) | Run payroll, stay compliant, manage people records |
| Manager portal | Site supervisor or ops manager (e.g. Dattatray, site supervisor, 45 people) | Keep shifts covered, approve requests, look after the team |
| Employee portal | Guard, baker, cleaner (e.g. Sunil, night-shift guard) | Clock in, see the roster, get the payslip, ask for leave |

---

## 2. The three demo companies

Each company has its own statutory rules, currency, pay cycle, language of pay, sites and people. Switch companies from the sidebar or with `?co=in|us|uk`.

| | Sentinel Facility Services | Corner & Crust Bakeries | Harbour & Field Cleaning |
|---|---|---|---|
| Country | India (Pune) | US (Austin, Texas) | UK (Manchester) |
| People | 182 (40 via a contract agency) | 58 | 76 |
| Sites | 6 client sites (Hinjewadi, Magarpatta, EON Kharadi, Baner, Phoenix Viman Nagar, head office) | 3 cafés and a central kitchen | Airport T2, MediaCityUK, Salford Royal hospital, Spinningfields, depot |
| Pay cycle | Monthly (September 2026) | Bi-weekly (Sep 21 – Oct 4) | Four-weekly (7 Sep – 4 Oct) |
| Net payroll this run | ₹38.64 L | $73.1k | £125.5k |
| Statutory | PF (₹25,000 ceiling), ESI, Maharashtra PT, TDS, Labour Codes | Federal tax, FICA, 401(k), FLSA overtime, Texas rules | PAYE, NI, auto-enrolment pension, National Living Wage, RTI |

Every person has a full record: job, manager, site, shift, pay, leave balances, documents, assets, goals and history. Payroll totals, leave balances, attendance and approvals agree across home, payroll, reports, profiles and the employee portal.

**Demo "planted moments"**, each with a one-click resolution:
- Two missed punches before payroll.
- An overtime spike at one site.
- A new joiner without bank details.
- 11 salary structures breaking the 50% wage rule (India), supervisors under the FLSA threshold (US), and cleaners below the National Living Wage (UK).
- An agency with a missing PF challan.
- A sick call needing cover tonight.
- A full and final settlement due within 2 working days.

---

## 3. HR admin portal

### 3.1 Home
- **Greeting and quick actions:** add employee, record leave, fill open shifts, post an announcement, import.
- **Duty-board KPI strip:**
  - payroll due date and amount, with a countdown and open checks;
  - requests waiting, with the requesters' faces and the age of the oldest;
  - who's out today (faces);
  - headcount split employee vs agency;
  - open roles with pipeline stages.
- **Today:** a 24-hour shift dial showing the current shift and who is on duty (82/88), with late, absent and next-shift crews as faces.
- **Needs your attention:** every planted moment ranked, each with its own action, plus snooze, assign and mark-done.
- **Payroll summary:** net pay, change against the last run, gross, employer cost, overtime, and filings due with amounts.
- **Attendance by site, out today, coming up** (birthdays, work anniversaries, holidays, the pinned announcement).

### 3.2 Inbox (approvals)
- One inbox for leave, missed punches, overtime, shift swaps, expenses, advances and payroll sign-off, with counts per type.
- A split view: the request list on the left, the full context on the right.
  - Context: requester, channel (portal, email, HR desk) and waiting time against a 48-hour SLA.
  - Policy checks: balance after approval, overlap with teammates at the same site, notice period, receipt present, per-claim limit.
  - Impact (amount, balance after, pay impact) and attachments.
- Actions: approve, reject with reason, request info, delegate, bulk approve, and "Approve all that pass every check". Every decision can be undone.
- Keyboard: J/K to move, A to approve.
- Decisions flow everywhere. Approving the missed punches clears the matching payroll check, and approving leave updates the balance.

### 3.3 People
**Employees:**
- KPIs and saved views: all, new joiners, contract workers, on probation, missing documents, night shift.
- Table and photo-card views, filters by site, department, type, status and shift, and bulk actions (message, assign shift, change manager, export).
- **Add employee**, a 5-step wizard:
  - basics → job → pay → documents → review;
  - country-aware pay: India CTC auto-split to meet the 50% wage rule, US hourly vs salaried, UK rate checked against the National Living Wage;
  - creates a pre-boarding record and starts onboarding.

**Employee profile:**
- A cover-and-portrait header with contact details, tenure and ID, and actions: message, assign asset, generate letter, change shift, start exit.
- Tabs:
  - **Overview:** about, reporting line, activity.
  - **Personal:** with masked IDs (PAN/Aadhaar/UAN, SSN, NI number) and bank details.
  - **Job:** with a career timeline.
  - **Pay:** this period's earnings, deductions and employer contributions, CTC and the payslip list.
  - **Attendance:** month calendar consistent with payroll.
  - **Leave:** balances and requests.
  - **Documents**, **Assets**, **Performance** and **Activity**.

**Org chart:**
- A real reporting tree with portraits, expand and collapse, zoom and pan, and search-to-focus.
- Group by reporting line, site or department.
- Open roles appear as "Hiring" nodes.
- Departments and Sites tabs, with a map of sites.

**Onboarding:**
- A stage board (pre-boarding, day 1, first week, joined) with progress and blockers.
- Per-case checklists grouped by owner (employee, HR, manager, IT), plus buddy, first shift and reminders.
- Country checklist templates: police verification, UAN and ESI in India; I-9, W-4 and the Texas new-hire report in the US; right to work, P45 and DBS in the UK.

**Exits and full & final:**
- Exit cases with deadline countdowns.
- Settlement worked out line by line:
  - **India:** pending salary, leave encashment, notice shortfall, gratuity eligibility and asset deductions, paid **within 2 working days** under the Labour Codes;
  - **US:** final pay and the PTO payout under the Texas Payday Law;
  - **UK:** holiday owed, final pay and the P45.
- Asset return checklist, exit interview, and relieving or experience letters.

**Documents:**
- Company library with acknowledgement tracking and e-sign requests.
- An employee document compliance matrix (people × required documents).
- An expiring and missing queue with bulk chase.
- A letter generator: templates, merged preview, issue.

**Assets:** a register of uniforms, ID cards, radios, phones and laptops, with assign and return, condition, value, by-type totals, and returns linked to exits.

### 3.4 Time and attendance
**Live board:**
- A **real Google map** of every site with status pins (all in, someone late, someone absent).
- A per-site list with crews and the shift switcher.
- Punch feed and exceptions queue: late, no-show, outside the geofence. Actions: message, find cover, call supervisor.
- Clock-in method mix, and a site detail with the geofence.

**Attendance:**
- **Muster** (India) or **hours grid** (US/UK): people × days, with codes for present, absent/LOP, leave type, week off, holiday, half day, overtime and missed punch. Totals feed payroll, and the muster is locked for payroll.
- Exceptions with a regularise drawer (proposed time, evidence, approve).
- Timesheets or daily log, and overtime by site against the country rule (India 2×, US FLSA 1.5× after 40 h, UK by contract).
- **Clock-in setup:** per-site geofence on a real map with editable radius, site QR code, kiosk and biometric terminals, supervisor entry. Also attendance policies.

**Roster:**
- A week grid per site with soft-coloured shift blocks, open shifts, leave and unavailability, coverage against requirement per day, and a labour cost vs budget bar.
- Over-hours warnings (India 48 h, US/UK 40 h).
- Click any cell to assign or change a shift, see who is available, their hours, overtime risk and site training.
- **Auto-fill open shifts** with a reason for each pick, plus Undo.
- **Publish** notifies everyone, with swap requests, templates (copy last week), day view and export.

**Leave and holidays** (country words: Leave / Time off / Holiday):
- Requests with inline approval and a policy-checked new-request drawer: balance after, team overlap, notice, holidays in range.
- **Who's off**: a people × days timeline with bars per leave type, plus a month calendar.
- Balances with an adjustment drawer and encashment.
- Policies per leave type (accrual, carry forward, notice, approval chain, sandwich rule in India).
- Holiday calendars.

### 3.5 Payroll
**Run payroll**, a six-step staged run:
1. Attendance and LOP (or hours and time off).
2. Joiners and exits.
3. Overtime and allowances (or tips and night premium).
4. Reimbursements and advances.
5. Holds and arrears.
6. Statutory and lock.

Around the steps:
- Per-employee pay actions (**Process, Hold, Void, Paid outside**) that change the totals live.
- A **"Before you pay"** rail: pre-run checks, each with a one-click fix, which also respond to decisions made in the inbox and the compliance centre. It shows variance against the last run, with top movers, and gross / deductions / net / employer cost.
- **Lock & approve** with a confirmation, then the generated files:
  - India: bank transfer file, PF ECR, ESI, PT challan;
  - US: NACHA/ACH, Form 941 deposit, 401(k), Texas new-hire report;
  - UK: BACS, RTI FPS, pension, P45.
- After locking: bank file preview, release payslips, statutory due dates, mark as paid, and an audit trail. Unlocking requires a reason.
- A payroll calendar and off-cycle runs.

**Payslips and history:** 12 runs with a cost trend, a per-run register for every employee, and a searchable payslip list.

**Payslip:**
- Country formats with YTD, net pay in words (Indian numbering for India) and leave balances.
- Print, PDF and send.
- **"Why did my pay change?"**: every line against last period in plain language.

**Salary and compensation:**
- Salary structures per role, flagging the 50% wage rule, the FLSA exempt threshold and the National Living Wage.
- Pay bands per grade with people plotted (compa-ratio).
- A revision cycle with budget, merit matrix and a take-home impact preview.

**Tax and declarations:**
- **India:** investment declarations (80C, 80D, HRA, 24b), a proof verification queue, old vs new regime, TDS projection, Form 130 and Form 138.
- **US:** W-4 status, Form 941, W-2 prep, Texas SUTA.
- **UK:** tax codes, RTI submissions, P32, P60 / P11D / P45.

**Benefits:**
- **India:** group medical cover, ESIC, gratuity, PF/EPS.
- **US:** medical, dental and vision, 401(k) participation and match, enrolment window.
- **UK:** auto-enrolment pension (NEST), opt-outs, re-enrolment, cycle to work.

**Expenses and advances:**
- Claims with receipts and policy flags, approve, reject and mark paid, and a receipt scan that reads the amount and vendor.
- Paid via payroll or instantly.
- Advances and loans with EMI schedules, recovery through payroll, and the 50% deduction limit check in India.

### 3.6 Compliance
**Compliance centre:**
- A health score and the open flag with a before/after impact per person, e.g. "11 salary structures break the 50% wage rule": basic and PF before and after, and the change in take-home. Apply the fix with one click and draft letters.
- A **filing calendar** of PF, ESI, PT, TDS, Form 138 and LWF (India), federal deposits, Form 941, Texas TWC and W-2 (US), or RTI, P32, P60 and P11D (UK).
- Filings history with challan and acknowledgement numbers.
- A **dated rule library** showing what changed and when, e.g. the EPF ceiling of ₹25,000 from 17 Sep 2026 and the Labour Codes from 21 Nov 2025.
- Statutory registers to generate.

**Rules and policies:**
- **Rules in plain language:** type "Overtime is 2× after 9 hours at Kharadi". The system shows the rule it understood and its cost on last month's data ("adds ₹18,420 across 23 guards") before you apply it.
- Active rules with versions and on/off, attendance, overtime, leave and expense policies, and a visual **approval workflow** builder.

**Contractors (contract labour):**
- Agencies with licence or insurance expiry, workers on site, monthly invoice and a compliance score.
- A month × proof grid (PF challan, ESI challan, wage sheet, attendance), with remind and hold-invoice actions.
- **India:** CLRA registers and the licence headcount limit.
- **US:** certificates of insurance and W-9s.
- **UK:** the Agency Workers Regulations 12-week tracker.

### 3.7 Talent
**Hiring:**
- Jobs with pipeline counts and a kanban (applied, screening, interview, offer, hired) with candidate score rings.
- A candidate drawer with scorecards, offer letter preview and interview invites, plus country job boards.
- Funnel and source analytics. A hire hands off to onboarding.

**Performance:** review cycle progress, rating distribution, a 9-box grid with faces, goals and OKRs, 1:1s, feedback and calibration.

**Learning:** country-specific courses (guard safety refresher, POSH, food handler, COSHH, induction), completion by site, expiring certifications, and assignment.

**Engagement:** announcements with reach and a composer, a pulse survey with eNPS and drivers, recognition, and a celebrations calendar.

### 3.8 Insights, help and settings
**Reports:**
- 14 ready-made reports: headcount and movement, attrition, tenure, gender diversity, overtime by site, lateness by site, absenteeism, leave liability, payroll cost, labour cost by site, statutory contributions, document compliance, hiring funnel and review completion.
- Each has filters, charts, a detail table and export. Reports can be scheduled and pinned to home.
- A **report builder** (metric × group by × filter × chart).

**Helpdesk:**
- A ticket queue with SLA, channel and category, and an AI-drafted reply to review before sending.
- A knowledge base and insights.

**Settings:**
- Company profile and statutory registrations (PF, ESI, PT, TAN / EIN, TWC / PAYE ref).
- Sites and geofences on real maps.
- Departments, grades and job titles; pay schedules; country packs.
- **Employee portal settings:** address, sign-in methods, kiosk link, branding.
- Roles and permissions matrix, security (SSO, 2FA, sessions, IP allowlist, retention), audit log and approval workflows.
- Notification preferences: event × channel (email, SMS, WhatsApp message, in-app).
- Integrations: accounting, banks, biometric devices, job boards, messaging, API keys, webhooks and an **MCP server** for AI tools.
- **Switch in a day:** import last month's payroll register and attendance, match people ("182 employees matched, 3 structures need a look"), and run a parallel payroll with differences shown, then go live.

### 3.9 AI assistant ("Ask AI", bottom right, ⌘J)
Answers come from the company's own records, with the sources listed. The scripted flows:
- **Find cover for a sick call:** ranked replacements (available, no overtime breach, trained for the site), then confirm and notify, with Undo.
- **Late arrivals by site:** a chart with a one-line insight.
- **A rule in plain language:** parsed, costed on last month and applied.
- **Leave balance questions:** answered with a handbook citation.
- **"Why is payroll up this period?"** and **headcount and attrition:** answered with real figures and a chart.

There's always a hand-off to a named person.

**Agents** run in the background. They draft the work and a human approves it:
- missed-punch fixer;
- approval chaser;
- F&F drafter;
- document chaser;
- roster gap filler.

Each has an activity log and Undo.

---

## 4. Manager portal
Same product, scoped to the manager's team.

- **Home**, built around "how is my team today":
  - the shift dial with late, absent and next-crew faces;
  - **Team requests** with one-click approve and reject;
  - **Your team today**: a photo board of the team with live status (on duty at Gate, late 14 min, absent, on leave, starts 16:00) and filters;
  - needs attention: open shifts, timesheets to sign off, probation reviews, manager reviews.
- Team members, org chart, live board, roster, attendance, leave, performance and hiring, all filtered to the team.
- "My space" and "My payslips": the manager is also an employee.

---

## 5. Employee portal
A separate, simpler web portal in the **employer's own colour**, with top navigation (Home, Pay, Leave/Time off, Attendance, Documents, Expenses, Goals, Help). It runs in the browser, so there's **no app to install**.

- **Home:**
  - a greeting with the employee's portrait;
  - quick actions (request leave, download payslip, fix a missed punch, submit an expense, ask HR), each showing the useful number (e.g. "5 days of casual leave left");
  - **Today**: a large real map of the site with the geofence, and the time clock beside it;
  - **clock in/out with browser location**: allow location, show "inside the 200 m site fence", clock in. The fallback is the site QR code or the supervisor;
  - shift progress, post, supervisor and faces of who's on shift with you, then "Your week" as seven day tiles, announcements and upcoming holidays.
- **Pay:** payslips, year to date, tax summary, "why did my pay change", and bank details (changes need an OTP).
- **Leave:** balances, apply with live policy checks, history, and who's off at my site.
- **Attendance:** my month, regularise a day, my shifts.
- **Documents:** my documents, upload, and download letters (salary certificate, employment verification).
- **Expenses:** submit with a receipt scan, track claims.
- **Goals and reviews:** update progress and write the self review.
- **Help:** search the knowledge base, raise and track HR requests, and "Ask HR" (assistant).
- **My profile:** a cover-and-portrait profile page.

---

## 6. Across the product
- **Portal sign-in** (`#/portals`): choose HR admin, Manager or Employee, with the demo user shown for each.
- **Country packs:** India, US and UK are live. Canada, Australia, UAE, Singapore, Philippines, Germany, Brazil, Mexico and South Africa are listed as packs.
- **⌘K search** across people, pages and actions; notifications; light and dark mode. Layouts adapt to smaller screens; designed and tested for laptop and desktop.
- **Real Google Maps** for every location: sites, geofences, live board, employee clock-in.
- **Consistent data:** one source of truth, so the same number appears on every screen that shows it.
- **Audit log** of every change: who made it, when and from where.
- **No build step:** a static site that runs anywhere.

---

## 7. Why it sells

| What buyers in this segment complain about | What People OS shows instead |
|---|---|
| Payroll errors and penalties | A staged run with pre-run checks that compare against last period, one-click fixes, a lock step, and a "why did my pay change" explanation on every payslip |
| Clock-in that fails in the field ("not at site" when they are) | Browser location with a visible geofence, a site QR fallback, kiosk or biometric terminals and supervisor entry, so the worker is never blocked |
| Compliance anxiety when rules change | A dated rule library, flags with a before/after impact per person, one-click restructuring and a filing calendar |
| Rigid rules that need a consultant | Rules typed in plain language, previewed on last month's data before applying |
| Too complex for small teams, and the tools don't talk | One product for people, time, pay and compliance; a new hire flows into payroll, leave, roster and onboarding in one action |
| Contract labour risk (India) | Agency proof tracking, CLRA registers, hold-invoice actions |
| Employees can't get answers | An employee portal with payslips, balances, leave and HR requests in any browser, with no app to install |
| Months to implement | Switch in a day: import last month's register and attendance, then a parallel run |
| AI that deflects | An assistant that finishes tasks (finding cover, fixing punches, drafting F&F) and asks a human before acting |

---

## 8. Suggested demo (8 minutes)
1. **Portal sign-in** (`#/portals`) shows three portals, one product.
2. **HR home** (India): 182 people, payroll due tomorrow, 4 checks open; the shift dial shows 82 of 88 on duty with the late faces.
3. **Inbox:** approve the two missed punches, and the payroll check turns green.
4. **Live board:** the real map of Pune, Suresh late at Hinjewadi, the punch verified by site QR.
5. **Ask AI:** "Ravi is sick tonight, find cover", then confirm and notify.
6. **Compliance:** 11 structures break the 50% wage rule; preview take-home, fix in one click.
7. **Run payroll:** six steps, resolve the checks, lock, then the bank file and ECR are ready.
8. **Payslip:** Sunil's ₹22,023 gross becomes ₹20,033 net, with "why did my pay change".
9. **Employee portal** (Sunil): the site map, clock out, his week, his payslip.
10. **Manager portal** (Dattatray): the team board, approve a leave request in one click.
11. **Switch company to the US:** the same product in dollars, with PTO, FLSA overtime and Form 941.

---

## 9. What's simulated in the template
- **No real money movement or filings.** Bank files, ECR, challans, RTI and IRS filings are generated as realistic documents but never submitted.
- **Clock-in, QR, kiosks and biometric devices** are simulated flows. Browser location is mocked to a point inside the geofence.
- **The AI assistant and agents are scripted.** Free text gets a graceful "here's what I can do" answer.
- **Data is deterministic demo data.** Past payslips are derived from the current period. A few dashboard figures, such as helpdesk monthly totals, are illustrative.
- **Maps** use the public Google Maps embed. Place names in India show both English and the local script (Google's own map data). A Maps API key would allow custom map styling.

---

## 10. Questions for review
1. Which modules would lead a sales conversation for this segment, and which would you hide in a first demo?
2. Is India-first right, or does the US story (FLSA, multi-state, PTO) sell better for this template?
3. What's missing that a buyer would ask about in the first call (e.g. EWA / instant pay, background checks, multi-entity, union rules)?
4. Does the employee portal need anything else before it replaces an app for deskless staff?
5. How should the modules be packaged (core HR + payroll, then time & attendance, compliance, talent as add-ons)?
