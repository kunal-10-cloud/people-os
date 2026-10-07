# People OS — building a module

People OS is a **hardcoded HRMS template** that must feel like a real, production-grade product (think Rippling, Keka, BambooHR, Deel, Deputy). Nothing talks to a server. Every number comes from the seeded data, and every button does something believable: it changes state, opens a drawer, shows a toast, or produces a "document". There are no dead buttons and no lorem ipsum.

The PRD is in `../hrms-prd.html`. The old build is in `legacy/` (`legacy/app.js`, `legacy/data.js`), so you can reuse its copy, scripted AI answers and flows.

## Stack (no build step)

- Preact + htm via `htmPreact` (UMD), with classic `<script>` tags and **no ES modules**. Everything hangs off the global `window.PO`.
- Each module file is an IIFE that registers routes:

```js
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;
  function MyPage({ params, query }) { const P = PO.P(); return html`…`; }
  PO.route('my-route', MyPage, { title: 'My page', wide: false });
})();
```

- htm syntax: components are `<${PO.Button} kind="primary">Save</${PO.Button}>`, or self-closing `<${PO.Who} p=${p} />`. Use `class=`, not `className`. Event handlers are `onClick`, `onInput` (for text inputs) and `onChange` (for selects and checkboxes).
- Hooks are available as `PO.useState`, `PO.useEffect`, `PO.useMemo` and `PO.useRef`.
- **Never** call a component that uses hooks as a function. Render it as `<${Comp} />`.

## Files and ownership

You own only the files listed in your task. Don't edit `core/*` or other agents' modules. If you need a core change, put a minimal local helper in your own file and mention it in your report.

Route names are fixed by the sidebar (`core/shell.js`, `NAV`). Register exactly these:

| Route | Owner file | Page |
|---|---|---|
| `home` | home.js | Admin and manager dashboard |
| `approvals` | approvals.js | Unified inbox / approvals |
| (panel) `PO.panels.assistant` | assistant.js | "Ask People OS" side panel |
| `helpdesk` | helpdesk.js | HR helpdesk tickets |
| `people`, `people/:id` | people.js | Directory, add employee, and the full profile |
| `org` | org.js | Org chart |
| `onboarding`, `offboarding` | lifecycle.js | Onboarding, exits and F&F |
| `documents`, `assets` | documents.js | Company and employee documents; asset register |
| `live` | live.js | Live board |
| `attendance` | attendance.js | Muster, exceptions, regularisation, timesheets |
| `roster` | roster.js | Shift scheduling |
| `leave` | leave.js | Leave requests, balances, calendar, policies, holidays |
| `payroll` | payroll.js | Staged payroll run |
| `payslips`, `payslips/:id` | payslips.js | Payroll history, payslip view, "why did my pay change" |
| `compensation` | compensation.js | Salary structures, bands, revisions |
| `expenses` | expenses.js | Expenses and advances/loans |
| `tax`, `benefits` | compensation.js | Tax and declarations; benefits |
| `compliance`, `rules` | compliance.js | Compliance centre; rules in plain language and policies |
| `contractors` | contractors.js | Contract labour / agencies |
| `reports` | reports.js | Reports and analytics |
| `settings`, `settings/:section` | settings.js | Settings, integrations, roles, audit log, import, country packs, notifications |
| `hiring`, `performance`, `learning`, `engagement` | talent.js | Talent modules |
| `me`, `my-pay`, `my-leave`, `my-time`, `my-docs`, `my-expenses`, `my-goals` | self-service.js | Employee self-service |

Nav badge counts: `PO.navCount('approvals', (state, P) => n, true)`, where `true` makes the badge "hot" (brand-coloured). Register at most one count per route, and only where a real number exists.

Breadcrumb detail: set `PO.crumb = (route) => …` **only** in people.js and payslips.js. Instead of overriding it, chain to the previous one:
`const prev = PO.crumb; PO.crumb = (r) => r.name === 'people' && r.params[0] ? PO.person(r.params[0])?.name : prev ? prev(r) : null;`

## The data (read-only, deterministic)

- `PO.P()` returns the current company. There are three: India **Sentinel Facility Services** (182 people, INR, monthly payroll), US **Corner & Crust Bakeries** (58, USD, bi-weekly), and UK **Harbour & Field Cleaning** (76, GBP, four-weekly). Every screen must work for all three; use `PO.isIN()`, `PO.isUS()` and `PO.isUK()` for country-specific copy and rules.
- "Today" is `PO.TODAY` = `'2026-10-06'` (Tuesday). The current time is `P.company.nowMin` (minutes since midnight). Format it with `P.hhmm(min)`.
- `P.company`: `name`, `short`, `city`, `country`, `currency`, `locale`, `today`, `period`, `payBy`, `cadence`, `greeting`, `user`.
- `P.people[]`, where each person `p` has:
  - identity: `id`, `name`, `first`, `last`, `g`, `role`, `title`, `dept`, `grade`, `type` (Full-time/Part-time/Contract), `status` (Active/Probation/Notice period)
  - place and work: `site` (id), `shift` ('A'|'B'|'C'), `post`, `manager` (id or null), `supervisor`, `contractor` (agency name or undefined)
  - joining: `joined` (text), `joinedIso`, `tenureMonths`
  - contact and personal: `email`, `phone`, `dob`, `age`, `city`, `blood`, `emergency{name,rel,phone}`
  - ids and bank: `ids` (IN: pan/aadhaar/uan/esic; US: ssn/i9/w4; UK: ni/rtw/taxCode), `bank{name,acct,status}`
  - display: `hue` (avatar colour), `initials`
  - pay: `pay` (this period: `earn[]`, `ded[]`, `er[]`, `gross`, `dedTotal`, `net`, `erTotal`, `work`, `unpaid`, `otHours`, `otPay`, `extra`, IN also `structure`), `ctc`, `annualGross`, `u` (units)
  - leave: `leave` = `{ [typeKey]: {quota,taken,balance,pending} }`
  - documents: `docs[]` = `{name,status,uploaded,by,size}`
  - talent: `rating`, `reviewStatus`, `goals[]`
  - flags: `hero`, `joiner`, `missed`, `flag`, `k401`, `inCharge`
- `P.byId[id]`, `P.byManager[id] → [ids]`, `P.hero` (the demo employee), `P.topId` (owner/head), `P.hrId` (the HR user, i.e. the admin viewer).
- `P.sites[]` = `{id,name,client,staff,x,y,lead}`; `P.shifts[]` = `{key,label,from,to,time}`; `P.roles[key]`; `P.depts[]` = `{name,count,head}`.
- Payroll: `P.totals` (gross, dedTotal, net, erTotal, cost, plus each statutory key), `P.payHistory[12]` = `{id,label,heads,gross,net,ded,er,cost,ot,status}` with the last entry being the current draft, `P.steps`, `P.checks`, `P.files`, `P.joiners`, `P.money`, `P.statutory`, `P.unitWords`, `P.whyWords`, `P.why` and `P.prevPay` (the hero's pay-change explanation), and `P.lockFigs`.
- Time: `P.live[]` (per site: due/in/late/absent), `P.lateMap`, `P.absent` (Set), `P.late`, `P.current`, `P.roster`, `P.cover`, `P.lateBySite`, `P.outToday`.
- Leave: `P.leaveTypes[]` = `{key,name,short,quota,unit,color,accrual,carry}`, `P.leaveRequests[]` = `{id,who,type,from,to,days,hours,reason,status,applied,approver,channel}`, `P.holidays[]`.
- Approvals: `P.approvals[]` (the 8 planted requests).
- Compliance: `P.rules[]`, `P.ruleFlag`, `P.contractors[]`, `P.contractorNeed`, `PO.PACKS`.
- AI scripts: `P.ai` = `{cover, late, rule, ruleText, ruleCost, ruleName, ruleValue, leaveQ, leave}`. Notification copy: `P.msg` (English).
- Sites carry real locations: `site.lat`, `site.lng`, `site.address`, `site.radius` (geofence, metres).
- Records: `P.companyDocs[]`, `P.assets[]` = `{tag,name,who,issued,cond,value}`, `P.expenses[]`, `P.advances[]`, `P.onboarding[]`, `P.exits[]`, `P.reviewCycle`, `P.jobs[]`, `P.candidates[]`, `P.notifications[]`, `P.audit[]`, `P.announcements[]`, `P.tickets[]`, `P.survey`.
- If you need more module-local seeded data, use `const r = PO.seeded('mykey' + P.id)`, which gives `r.rnd()`, `r.pick(arr)`, `r.int(lo,hi)`, `r.chance(p)` and `r.shuffle(arr)`. Derive it from the real people and sites so names and numbers agree with other screens. Wrap it in `useMemo` keyed on `P.id`.

**Numbers must agree across screens.** For example, payroll net equals `P.totals.net` (the payroll run, home, reports and payslips must match), and a person's leave balance on their profile equals the one on the leave page.

## State

- `const [v, setV] = PO.useCoState('module.key', init)` stores UI state **per company** in the global store. It survives navigation, and each company keeps its own progress. Use it for anything that should stick, such as approvals decided, payroll step, rules applied or records added.
- To read another module's state, call `PO.coGet(state, 'key', init)` with `const { state } = PO.useStore()`. Approvals decisions are shared under key `'approvals.decided'`, an object `{ [approvalId]: 'approved'|'rejected' }` owned by approvals.js. Read it in home.js and payroll.js.
- `PO.toast('Text', { action: { label: 'Undo', run: () => … }, icon: 'Lucide name' })`.
- `PO.go('people/EMP-0142')` navigates and `PO.href('leave')` gives a link href.
- Open the assistant with `dispatch({ type:'set', patch:{ assistant:{ prompt:'…' } } })`.
- The viewing role is `state.role`: `'admin' | 'manager' | 'employee'`. `PO.viewer()` is the person you're "signed in as" (call it inside components). Managers only see their team (`P.byManager[viewer.id]`, including reports' reports).

## Components (core/ui.js) — use them; don't hand-roll

`Icon {n, size}` takes [Lucide](https://lucide.dev/icons) names in PascalCase, e.g. `'Users'`, `'CalendarCheck2'` or `'Banknote'`. The rest:

- **People and status:** `Avatar {p|name, size:'xs'|'sm'|''|'lg'|'xl', presence:'on'|'off'|'late'}`, `Who {p|id, sub, size, link}`, `AvatarStack {ids}`, `Badge {tone:'green'|'amber'|'red'|'blue'|'brand'|'rose'|'teal'|'violet'|'slate', dot}`, `Status {s}` (auto colour by word).
- **Buttons and menus:** `Button {kind:''|'primary'|'ghost'|'danger'|'success', size:'sm'|''|'lg', icon, iconRight, href, onClick, disabled}`, `IconButton {icon, title, size, bordered}`, `Menu {trigger, items:[{label,icon,onClick,danger,hint,checked}|'-'|{header}], align}`.
- **Navigation and inputs:** `Tabs {tabs:[[key,label,count?]], value, onChange}`, `Segmented {options:[[key,label]], value, onChange}`, `Switch {on, onChange, label}`, `Field {label, hint}`, `SearchInput`, `Select {value,onChange,options}`, plus raw `<input class="input">`, `<select class="select">` and `<textarea class="textarea">`.
- **Layout and content:** `PageHeader {title, sub, actions}`, `Card {title, sub, actions, flush, foot}`, `Section {title, actions}`, `Stat {label, value, sub, delta:{v,dir:'up'|'down'|'flat'}, icon, spark:[n]}`, `Empty {icon,title,text,action}`, `Callout {tone:'amber'|'red'|'green'|'brand'|'blue', icon, title, action}`, `Progress {value 0-100, tone, label}`, `KV {items:[[k,v]], cols2}`, `Timeline {items:[{icon,tone,title,sub,right,body}]}`, `Steps {steps:[[t,s]], current, done, onPick}`, `Checklist {items:[{t,done,meta}], onToggle}`.
- **Overlays:** `Drawer {open,title,sub,onClose,footer,size:'sm'|''|'lg'}`, `Modal {open,title,onClose,footer,icon,tone,size}`, `const [ask, confirmEl] = PO.useConfirm()`, which gives `ask({title, body, confirm, danger, onConfirm})` and renders `${confirmEl}`.
- **Data:** `DataTable {rows, columns:[{key,label,render,sort,align:'r'|'c',width,csv}], search, filters:[{key,label,options,test}], selectable, bulk:(ids,clear)=>html, onRow, pageSize, exportName, toolbar, empty, compact, initialSort, foot}`. It provides search, filter selects, sorting, selection with a bulk bar, pagination and CSV export.
- **Calendar:** `MonthCal {year, month(0-based), events:{iso:[{label,tone}]}, onDay}`.
- **Charts** (`PO.Charts`): `Sparkline` (may be called as a function), plus `Bars {labels, series:[{name,data,color?}], stacked, fmt, yFmt, height}`, `Line {labels, series, area, fmt, yFmt, height}`, `Donut {data:[{label,value,color?}], center, sub, fmt}`, `HBars {data:[{label,value,sub}], fmt}`, `Heatmap {rows, cols, value(ri,ci)}` and `Ring {value 0..1, label}`. Use `yFmt=${(v) => PO.money(v, { compact: true })}` for money axes.
- **Formatting:** `PO.money(n, {compact, cents})`, `PO.compactMoney`, `PO.num(n, d)`, `PO.pct(x)`, `PO.date(iso, {short, weekday, noYear})`, `PO.rel(iso)`, `PO.tenure(months)` and `PO.plural(n, 'word')`.
- **Data helpers:** `PO.person(id)`, `PO.site(id)`, `PO.shiftOf(key)`, `PO.leaveType(key)`, `PO.exportCsv(name, rows)` and `PO.fakeDownload(label)`.
- **CSS utilities** (core/app.css): `row`, `col`, `grow`, `right`, `wrap`, `gap-12`/`gap-16`/`gap-24`, `mt-8`/`mt-12`/`mt-16`/`mt-24`, `grid g-2`/`g-3`/`g-4`/`g-5`/`g-6`/`g-main` (main and 360px rail)/`g-main-l`, `span-2`/`span-all`, `muted`, `faint`, `tnum`, `t-xs`/`t-sm`/`t-md`/`t-lg`/`t-xl`/`t-2xl`, `w-500`/`w-600`, `ellipsis`, `list`/`list-item`, `hero-num`, `card`/`card-h`/`card-b`/`card-f`, `tag`, `kbd`, `divider`, `cal-ev` tones, `phone`/`phone-screen`/`phone-notch`/`phone-status`, `ai-grad` and `shimmer-text`. You may add a small `<style>` block via a module-scoped stylesheet: `document.head.insertAdjacentHTML('beforeend', '<style>…</style>')`. Prefix your classes with the module name (e.g. `.roster-cell`) and use tokens (`var(--brand)` etc.), never raw hex colours, so dark mode works.

## Product rules (from the user, non-negotiable)

1. **English only.** No Hindi, Marathi, Spanish, Polish or any other script or language anywhere in the UI, including sample messages, course languages, or "sent in their language" copy. India stays professional English.
2. **Portals, not an app.** People OS has three web portals: the **HR admin portal** (`role: 'admin'`), the **Manager portal** (`'manager'`) and the **Employee portal** (`'employee'`). There is **no employee mobile app** and no chat bot. Employees use the portal in a browser. Don't mention "the app", "app users", "download the app", phone mock-ups or a WhatsApp/SMS HR bot. Requests arrive via the employee portal, email or the HR desk. Clock-in methods are: web portal with browser location (geofence), site QR code (which opens the portal's clock-in page), kiosk or biometric terminal at site, and supervisor entry. Notifications may still go out by email, SMS or WhatsApp *as messages*, but nobody "chats with" People OS on WhatsApp.
3. **Real maps.** Any place that shows a location uses real Google Maps via `PO.GMap` (multi-site with pins) or `PO.GMapPlace` (a single site with a geofence ring). Never use drawn or fake SVG maps.

## Maps (core/maps.js)

- `<${PO.GMap} pins=${[{id, lat, lng, label, sub, tone:'green'|'amber'|'red'|'slate'|'brand', count, icon, address}]} selected=${id} onPick=${(id)=>…} height=${460} pad=${70} zoomBias=${0}>${optionalLegend}</${PO.GMap}>` renders a real Google map that auto-fits the pins, with our pins (count bubble plus label), zoom, recentre, map/satellite and "Open in Google Maps".
- `<${PO.GMapPlace} lat lng zoom=${16} height=${240} radius=${site.radius} label="Hinjewadi Phase 2" address=${site.address} me=${{dx, dy, acc}} />` shows a single site with a geofence ring and an optional blue "you are here" dot (`dx`/`dy` in metres east/north of the site; `acc` is accuracy in metres).
- `PO.geo.distance(a, b)` returns metres between two `{lat, lng}` points.

## Product and design bar

1. **Production density and polish.** Use a page header with a clear primary action, then a row of 3–5 KPI stats where meaningful, then the main content (tables, boards, calendars). Use tabs for sub-areas. Every list should have search, filters, sorting and export where a real product would.
2. **Every row opens something.** That might be a profile, a drawer with details and actions, or a document preview. Every action produces visible feedback: a state change, a toast with Undo where sensible, an updated count.
3. **Realistic, specific copy** in sentence case. Use real-sounding names, dates, amounts and statutory terms (PF, ESI, PT, LWF, TDS, Form 130/138, ECR; W-4, I-9, FICA, FLSA, 941; PAYE, NI, RTI, P45/P60, auto-enrolment). No "Lorem", no "Sample", no "TODO", and no placeholder data.
4. **Country-aware.** Show the right currency, date style, statutory items and terminology per company (e.g. "Leave" vs "PTO" vs "Holiday", "Loss of pay" vs "Unpaid").
5. **Empty, warning and success states** must all look designed.
6. **No layout bugs.** Nothing should overflow at 1280–1600px widths, tables scroll inside their cards, and text truncates with ellipsis.
7. **Performance.** Memoise derived lists with `useMemo` keyed on `P.id`.
8. **Accessibility basics:** buttons are `<button>`, icon buttons have a `title`, and focus states come from the CSS.

## Checking your work

A static server runs at `http://localhost:8765/` (serving this folder). Screenshot any route with:

```
/private/tmp/claude-501/-Users-kunal-emergent-dump-expo-tickets/b0230204-6ae6-43b7-91aa-d2a4594eaf84/scratchpad/shot.sh <name> '<route>' [width] [height]
```

The screenshot is written to `…/scratchpad/hr/<name>.png`; view it with the Read tool. To check another company, the app reads `localStorage['po-ui']`, but headless runs start fresh (India). To screenshot US or UK, add a dev hook in your own testing only. The shell supports `?co=us` in the URL: for example, `shot.sh x 'payroll?co=us'` switches company on load. To view as another role, use `?role=employee`.

Check for JS errors with `node --check modules/yourfile.js` (syntax only). Then screenshot every route you own **in all three companies** and fix anything that looks broken, empty or cramped. Your report should list routes, features and any issues you couldn't fix.
