# People OS — UX and layout brief

The first build proved the breadth. This brief is about **hierarchy, positioning and restraint**. The user's words: "all the things which are necessary should be present at one single frame and any other fluff or of less priority should be minimised", and "most important this shouldn't look AI generated".

The reference products are Linear, Stripe Dashboard, Rippling, Gusto and Deel. They're calm, dense and typographic, and colour is rare and meaningful.

## 0. Visual identity (set in core; don't override)

People OS runs the working day for deskless workforces: guards, bakers and cleaners on shifts. Its visual language comes from the **duty register, muster roll and time-clock card**: precise, tabular, time-based.

- **Colour:**
  - **Register green** `--brand`/`--ink` (#1F4D3D) is for primary actions, selection, the active tab and step, and the main data series.
  - Ink text #1D2321 on surface #FFFFFF, against a cool canvas #F2F4F3, with lines in #DCE1DE.
  - **Signal amber** `--signal` is for "now", deadlines and needs-you.
  - Red is for breaches only.
  - No blue accents, purple or gradients.
- **Type:** IBM Plex Sans for the UI and **IBM Plex Sans Condensed** (`var(--num)`) for figures, clock times and KPI numerals. Use condensed for any large number, time or money figure that is the point of its block (`.hero-num`, `.kpi-v` and `.stat-v` already use it).
- **The signature element** is the `KpiStrip` duty-board readout. Each figure should carry the structure behind it:
  - `bar: [{v, k:'ok'|'warn'|'bad'|'mute', title}]` for a composition, such as present/late/absent, on-time/overdue or pipeline stages;
  - `ticks: {on, of}` for a countdown;
  - `unit` for "/88" or "h";
  - `alert: true` for a signal-amber top rule when the figure needs attention.
  A KPI without a meaningful bar is fine, but don't invent bars.
- **Template tells to avoid** (from the design review):
  - "A · B · C" middle-dot metadata strings. Write a short phrase or sentence instead ("Tuesday 6 October, 08:14 in Pune. 182 people across 6 sites.").
  - ALL-CAPS labels and eyebrows above headings.
  - "→" appended to links and buttons.
  - Monospace for small data labels.
  - One word in a headline accented in another colour or weight.
  - Numbered markers (01/02) unless the content is a real sequence.
  - Fade-up entrance animations on every section, and hover effects on every card.

## 0b. Visual richness: references from Mobbin (Deel, Workable, Aboard, Remote, Deputy, 7shifts, Employment Hero, Slack, Gusto, Jobber)

The user's verdict on the restrained pass was "it just feels plain, too basic, a flat template". Warmth comes from **people, place and time made visible**, not from more charts. Apply these patterns. All the components exist in core.

1. **Faces wherever people appear.** `PO.Avatar` now renders an illustrated portrait. Use avatars in every list of people: approvals, requests, tickets, candidates, rosters, leave, exits and onboarding. Show **avatar stacks** for groups, e.g. `<${PO.AvatarStack} ids=${[...]} />`, crews or `faces` in `KpiStrip`.
2. **Profile hero.** Detail pages for a person (the admin profile and the employee's own profile) open with `<${PO.ProfileHero} p=${p} sub badges meta actions />`, a soft cover band in the person's tint with a large portrait over it (Workable/Deputy).
3. **Photo-card grid.** Directory "Cards" view, teams and crews use `<${PO.PeopleGrid} people=${[...]} sub=${p=>…} foot=${p=>…} />` (Slack/Workable).
4. **Icon chips.** Card headers get `<${PO.Card} icon="Palmtree" accent="teal" …>` (or `<${PO.Chip} icon accent />` inline). List rows that represent different kinds of things (approval types, ticket categories, filing types, document kinds) get a chip keyed to the kind. The accents are green, amber, red, blue, violet, teal and rose; keep each module's mapping consistent.
5. **Draw time.** Leave is a **people × days timeline with coloured bars** (Employment Hero/7shifts), and the month calendar shows names inside bars. Shifts are **soft-coloured blocks by shift** (7shifts/Deputy), using `color-mix` of a shift accent with the surface, not saturated fills.
6. **Illustrated empty states.** `PO.Empty` now draws a small spot illustration automatically. Use it for every empty list with a helpful action.
7. **Personal greetings.** Employee and manager homes greet with the person's avatar. Quick actions on the employee portal can be **icon tiles** (Remote: chip, label and one-line hint) in a single row of 4–5.
8. **Category colour on summary cards** (Jobber): when a page has 3–4 parallel summaries (e.g. onboarding stages, pipeline stages), give each its accent chip and a matching 2px top rule.

The exception to "no gradients": the soft cover band in `ProfileHero`/`PeopleGrid` is allowed. Still no gradient buttons, text or backgrounds elsewhere.

## 1. Every page answers three questions above the fold (1440×900)

1. **What is this and what's its state?** A title, plus one line of factual metadata: counts, period, last updated. Never a tagline.
2. **What needs me?** The exceptions or actions, ranked.
3. **What do I do next?** One primary button (ink black). Secondary actions are plain buttons or live in a "⋯" menu.

Anything that doesn't serve those three goes lower down, into a tab, a drawer, or a "⋯" menu, or is deleted.

## 2. Page templates (pick one; don't invent layouts)

| Type | Structure |
|---|---|
| **Dashboard** (home, module overviews) | Header → `KpiStrip` (3–5 numbers, no icons) → a 2-column grid of 8/4 (`g-main`): the left column holds the main work surface (a task list, table or chart), the right rail holds at most 3 compact lists. Nothing decorative. |
| **List** (employees, requests, documents) | Header with primary action → optional `KpiStrip` (only if the numbers drive action) → filter bar plus `DataTable` in one card. Rows open a drawer or detail page. |
| **Detail** (profile, payslip, case) | Back link → identity header (name, status, key facts inline) → tabs → a 2-column grid of 8/4: content on the left, a facts/actions rail on the right. |
| **Workflow** (payroll run, onboarding case, import) | Header with status → `Steps` → the current step's content on the left, a sticky summary and checks rail on the right → a footer with Back / Continue. |
| **Settings** | Left sub-nav, then a form in one column (max 720px) with section headings and a sticky save bar. |

## 3. Positioning rules

- 8px spacing grid. Use **24px between page sections**, 16px between cards in a grid and 12px inside cards. The page header sits 20px above the content.
- Prefer **one card with rows/dividers** over many small cards. Don't put a card grid where a list would do.
- Card headers are all 40px high: title on the left, at most one action on the right (a link button or a "⋯" menu).
- Right rails are 360px. Never use three equal columns of different content types.
- Align numbers right and use tabular figures. Align text left. Never centre body text except in empty states.
- Tables beat cards for anything that's a list of records with more than 3 attributes.
- Show at most 7 rows in a dashboard list, with "View all" as a text link in the card header.

## 4. Colour and type

- **Ink** (`var(--ink)`) is for primary buttons, selected tabs and steps. **Brand blue** (`var(--brand)`) is for links, focus and selection only. **Status colours** (green/amber/red) are for status only, never decoration.
- Charts use one colour (`--chart-1`), plus at most one comparison colour (`--chart-5` grey). Use categorical colours only when categories really need to be told apart.
- Status in tables: `<Status s="Approved" />` renders as a coloured dot plus text, with no filled pill.
- Type: page title 20px/650; card title 13.5px/600; body 13px; meta 12px `--text-3`.

## 5. "Looks AI-generated" — remove on sight

- ❌ Gradients of any kind (backgrounds, text, buttons, logos). ❌ Purple or indigo. ❌ `ai-grad`, `shimmer-text`.
- ❌ The sparkle icon anywhere except the Ask AI launcher, and inline banners like "Ask People OS…" (the launcher bottom-right replaces them).
- ❌ An icon in every KPI label, list row, card title or button. Icons only where they carry meaning: navigation, status, file type, a few toolbar actions.
- ❌ Coloured rounded icon tiles in lists ("icon in a pastel square" next to every row).
- ❌ Sparklines in every stat. Keep at most one trend per page, where trend is the point.
- ❌ Five or more equal stat cards in a row. Use `KpiStrip` instead.
- ❌ Taglines and marketing sub-copy ("Every request that needs a yes or no, with the context to decide in one look"). Use factual metadata ("14 waiting · oldest 5 days").
- ❌ Words like "seamless", "effortless", "magic" and "smart", plus emoji and exclamation marks.
- ❌ Filled pastel badges on every row. Use dot status, or plain text when there's nothing wrong.
- ❌ Decorative callouts. A callout appears only when something needs action, and there's at most one per page.
- ❌ "Thinking…" theatre, fake typing indicators and confetti.
- ❌ Symmetric mosaics of same-size cards with different content.
- ❌ Buttons whose label repeats the page title ("Run payroll" on the Run payroll page, beside "Review & run").

## 6. Interaction

- **Progressive disclosure:** summary → drawer → full page. Bulk actions appear only after selection.
- Secondary and rare actions (export, print, templates, settings) go in a "⋯" `Menu` at the right of the header.
- Toasts confirm and offer Undo. Destructive actions confirm in a modal.
- Keyboard: `⌘K` opens search, `⌘J` opens Ask AI, and `Esc` closes overlays.

## 7. Components to use

`PageHeader`, `KpiStrip`, `Card`, `DataTable`, `Tabs`, `Steps`, `Drawer`, `Menu`, `Status`, `Who`, `Callout` (rarely), `Empty`, and the `PO.Charts.*` charts in single colour. `Stat` still exists, but prefer `KpiStrip`.
