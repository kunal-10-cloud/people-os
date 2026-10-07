/* People OS: Settings. Routes `settings` (overview) and `settings/:section`.
   Every form persists per company with PO.useCoState('settings.*') and toasts "Saved". */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .set-layout { display: grid; grid-template-columns: 196px minmax(0, 1fr); gap: 40px; align-items: start; }
  .set-nav { position: sticky; top: 76px; display: flex; flex-direction: column; gap: 1px; }
  .set-nav .set-nav-h { font-size: 12px; font-weight: 500; color: var(--text-3); padding: 16px 10px 4px; }
  .set-nav a { display: flex; align-items: center; height: 30px; padding: 0 10px; border-radius: var(--r); color: var(--text-2); font-weight: 500; white-space: nowrap; }
  .set-nav a:hover { background: var(--hover); color: var(--text); }
  .set-nav a[aria-current='page'] { background: var(--surface-3); color: var(--text); font-weight: 550; }
  .set-main { min-width: 0; max-width: 720px; display: flex; flex-direction: column; gap: 24px; }
  .set-main.wide { max-width: 1040px; }
  .set-head h1 { font-size: 20px; font-weight: 650; letter-spacing: -0.02em; }
  .set-head p { color: var(--text-2); margin-top: 4px; }
  .set-main > .card:not(.flush) { background: none; border: 0; border-top: 1px solid var(--border); border-radius: 0; box-shadow: none; }
  .set-main > .card:not(.flush) > .card-h { padding: 20px 0 0; min-height: 0; }
  .set-main > .card:not(.flush) > .card-h h3 { font-size: 14px; }
  .set-main > .card:not(.flush) > .card-b { padding: 14px 0 0; }
  .set-main > .tabs { margin-bottom: -8px; }
  .set-main .card.flush > .card-h { padding-bottom: 10px; border-bottom: 1px solid var(--border); }
  .set-logo { display: inline-grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 8px; font-weight: 650; font-size: 13px; letter-spacing: -.02em; background: var(--surface-3); color: var(--text-2); border: 1px solid var(--border); }
  .set-logo.chip-ic { border: none; }
  .set-nav a .ic { color: var(--text-3); margin-right: 8px; flex: none; } .set-nav a[aria-current='page'] .ic { color: var(--brand-text); }
  .set-index-row .chip-ic { margin-right: 12px; }
  .set-logo.lg { width: 56px; height: 56px; font-size: 19px; border-radius: 12px; }
  .set-logo.sm { width: 30px; height: 30px; font-size: 11px; border-radius: 7px; }
  .set-ic { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; background: var(--surface-3); color: var(--text-2); flex: none; }
  .set-form { display: flex; flex-direction: column; gap: 12px; }
  .set-form .field { display: grid; grid-template-columns: 200px minmax(0, 1fr); column-gap: 24px; row-gap: 4px; align-items: center; }
  .set-form .field > label { grid-row: 1 / span 2; align-self: start; padding-top: 8px; font-size: 13px; font-weight: 500; color: var(--text-2); }
  .set-form .field > :not(label) { grid-column: 2; }
  .set-row { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .set-row:last-child { border-bottom: none; padding-bottom: 0; }
  .set-row:first-child { padding-top: 0; }
  .set-row .set-row-t { flex: 1; min-width: 0; }
  .set-row .set-row-t b { display: block; font-weight: 550; }
  .set-row .set-row-t small { color: var(--text-3); font-size: 12px; }
  .set-savebar { position: sticky; bottom: 16px; z-index: 5; display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 16px; border-radius: var(--r-lg); background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .set-savebar.dirty { border-color: var(--border-strong); box-shadow: var(--shadow-lg); }
  .set-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--amber-solid); flex: none; }
  .set-lvl { border: 1px solid transparent; background: none; border-radius: 5px; height: 24px; min-width: 72px; padding: 0 8px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--text-3); }
  .set-lvl:hover { border-color: var(--border-strong); }
  .set-lvl.l1 { color: var(--text-2); }
  .set-lvl.l2 { color: var(--text); background: var(--surface-3); }
  .set-lvl.l3 { color: var(--brand-text); background: var(--brand-soft); font-weight: 600; }
  .set-lvl[disabled] { cursor: not-allowed; opacity: .8; }
  .set-drop { border: 1.5px dashed var(--border-strong); border-radius: var(--r-lg); padding: 24px 20px; text-align: center; background: var(--surface-2); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: border-color .12s, background .12s; }
  .set-drop:hover { border-color: var(--text-3); }
  .set-drop.done { border-style: solid; border-color: var(--border); background: var(--surface); cursor: default; }
  .set-code { margin: 0; font-family: var(--mono); font-size: 12px; line-height: 1.6; background: var(--surface-3); border: 1px solid var(--border); border-radius: var(--r); padding: 12px 14px; overflow-x: auto; color: var(--text); white-space: pre; }
  .set-range { width: 100%; accent-color: var(--ink); }
  .set-sites-map .gm { border: 0; border-radius: var(--r-lg) var(--r-lg) 0 0; border-bottom: 1px solid var(--border); }
  .set-chain { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .set-chip { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border-radius: 5px; background: var(--surface-3); font-size: 12px; font-weight: 500; white-space: nowrap; color: var(--text-2); }
  .set-matrix th, .set-matrix td { text-align: center; }
  .set-matrix th:first-child, .set-matrix td:first-child { text-align: left; }
  .set-index-h { padding: 10px 16px 8px; font-size: 12px; font-weight: 600; color: var(--text-3); background: var(--surface-2); border-bottom: 1px solid var(--border); }
  .set-index-h:first-child { border-radius: var(--r-lg) var(--r-lg) 0 0; }
  .set-index-row { display: flex; align-items: center; gap: 16px; padding: 11px 16px; border-bottom: 1px solid var(--border); color: inherit; }
  .set-index-row:last-child { border-bottom: none; }
  .set-index-row:hover { background: var(--hover); }
  .set-index-row b { display: block; font-weight: 550; }
  .set-index-row small { display: block; color: var(--text-3); font-size: 12px; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  @media (max-width: 1180px) { .set-layout { grid-template-columns: 1fr; gap: 16px; } .set-nav { position: static; flex-direction: row; flex-wrap: wrap; } .set-nav .set-nav-h { display: none; } }
  </style>`);

  const SECTIONS = [
    { group: 'Company' },
    ['company', 'Company profile', 'Building2', 'Legal entity, address, statutory registrations and fiscal year'],
    ['sites', 'Sites & geofences', 'MapPin', 'Locations, clock-in radius, clients and shift times'],
    ['org', 'Departments & grades', 'Network', 'Departments, grades and job titles'],
    ['pay', 'Pay schedules', 'CalendarClock', 'Pay frequency, cutoffs and the bank that pays salaries'],
    ['countries', 'Country packs', 'Globe', 'Statutory rules, filings and payslip formats per country'],
    ['portal', 'Employee portal', 'AppWindow', 'Portal address, how employees sign in, clock-in and branding'],
    { group: 'Access' },
    ['roles', 'Roles & permissions', 'KeyRound', 'Who can view, edit and approve in each module'],
    ['security', 'Security', 'ShieldCheck', 'SSO, two-factor, sessions, IP allowlist and data retention'],
    ['audit', 'Audit log', 'History', 'Every change, who made it and from where'],
    { group: 'Automation' },
    ['workflows', 'Approval workflows', 'Workflow', 'Approval chains for leave, overtime, expenses and payroll'],
    ['notifications', 'Notifications', 'BellRing', 'Which events reach which people, on which channel'],
    ['integrations', 'Integrations & API', 'Plug', 'Accounting, banks, messaging, biometrics, API keys and MCP'],
    ['import', 'Switch in a day', 'FileSpreadsheet', 'Import last month’s payroll register and attendance'],
  ];
  const SEC = SECTIONS.filter(Array.isArray);
  const SEC_ACC = { company: 'green', sites: 'blue', org: 'violet', pay: 'amber', countries: 'teal', portal: 'blue', roles: 'violet', security: 'green', audit: 'blue', workflows: 'teal', notifications: 'amber', integrations: 'rose', import: 'green' };
  const hueAcc = (h) => (h == null ? null : h < 20 || h >= 330 ? 'rose' : h < 60 ? 'amber' : h < 165 ? 'green' : h < 200 ? 'teal' : h < 260 ? 'blue' : 'violet');

  /* ---------- small helpers ---------- */
  function useDraft(key, init) {
    const [saved, setSaved] = PO.useCoState(key, init);
    const [d, setD] = useState(saved);
    const dirty = JSON.stringify(d) !== JSON.stringify(saved);
    return { d, set: (k, v) => setD((x) => ({ ...x, [k]: v })), setAll: setD, save: (msg) => { setSaved(d); PO.toast(msg || 'Saved'); }, reset: () => setD(saved), dirty };
  }
  const Inp = ({ v, on, ph, type = 'text', mono, disabled, width }) => html`<input class=${'input ' + (mono ? 'mono' : '')} type=${type} value=${v ?? ''} placeholder=${ph} disabled=${disabled} style=${width ? `width:${width}px` : ''} onInput=${(e) => on(e.target.value)} />`;
  /** Sticky save bar at the bottom of every settings form; Save is enabled only when something changed. */
  const SaveBar = ({ draft, label }) => html`<div class=${'set-savebar ' + (draft.dirty ? 'dirty' : '')}>${draft.dirty ? html`<span class="set-dot"></span><span class="w-500">Unsaved changes</span>` : html`<span class="faint">All changes saved</span>`}<span class="right row"><${PO.Button} kind="ghost" disabled=${!draft.dirty} onClick=${draft.reset}>Discard</${PO.Button}><${PO.Button} kind="primary" disabled=${!draft.dirty} onClick=${() => draft.save(label)}>Save changes</${PO.Button}></span></div>`;
  const SaveBtn = () => null;
  const Row = ({ t, s, children }) => html`<div class="set-row"><div class="set-row-t"><b>${t}</b>${s ? html`<small>${s}</small>` : null}</div><div class="row" style="flex:none">${children}</div></div>`;
  const Logo = ({ txt, size = '', hue }) => html`<span class=${'set-logo ' + size + (hue != null ? ' chip-ic ' + hueAcc(hue) : '')}>${txt}</span>`;
  const coInitials = (P) => P.company.short.split(/[\s&]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('');
  const unit = () => (PO.isUS() ? 'ft' : 'm');
  const leaveWord = () => (PO.isIN() ? 'Leave' : PO.isUS() ? 'Time off' : 'Holiday');

  /* ---------- per-country company defaults ---------- */
  function companyDefaults(P) {
    if (P.id === 'in') return {
      legalName: 'Sentinel Facility Services Private Limited', tradeName: 'Sentinel Facility Services', entity: 'Private limited company', incorporated: '2014-06-12', industry: 'Security and facility management',
      line1: 'Office 402, Pride Purple Square, Kalewadi Phata', line2: 'Wakad', city: 'Pune', state: 'Maharashtra', postcode: '411057', phone: '+91 20 6720 4410', email: 'hr@sentinelfs.in', website: 'sentinelfs.in',
      fiscal: 'April – March', weekStart: 'Monday', dateFmt: 'DD MMM YYYY', tz: 'Asia/Kolkata (IST, UTC+5:30)',
      regs: [['PF establishment code', 'PUPUN0048213000', 'EPFO', 'Verified'], ['ESI employer code', '33000412870001099', 'ESIC', 'Verified'], ['Professional tax RC', '27561234890P', 'Maharashtra PT', 'Verified'], ['Professional tax EC', '99561234890P', 'Maharashtra PT', 'Verified'], ['TAN', 'PNES12345F', 'Income Tax Department', 'Verified'], ['PAN', 'AAKCS4821M', 'Income Tax Department', 'Verified'], ['CLRA licence (principal employer)', 'LC/PUNE/CLRA/2024/1187', 'Labour Commissioner, Pune, valid to 31 Mar 2027', 'Verified'], ['LWF registration', 'MHLWF/PN/22841', 'Maharashtra Labour Welfare Board', 'Verified'], ['Shops & Establishments', 'PMC/SE/II/0412873', 'Pune Municipal Corporation', 'Expiring soon']],
    };
    if (P.id === 'us') return {
      legalName: 'Corner & Crust Bakeries LLC', tradeName: 'Corner & Crust', entity: 'Limited liability company', incorporated: '2019-08-21', industry: 'Bakeries and cafés',
      line1: '1601 S Lamar Blvd', line2: 'Suite 110', city: 'Austin', state: 'Texas', postcode: '78704', phone: '(512) 555-0142', email: 'people@cornerandcrust.com', website: 'cornerandcrust.com',
      fiscal: 'January – December', weekStart: 'Sunday', dateFmt: 'MMM D, YYYY', tz: 'America/Chicago (CT)',
      regs: [['Federal EIN', '74-3318205', 'IRS', 'Verified'], ['Texas TWC account', '99-887766-5', 'Texas Workforce Commission, SUTA 2.7%', 'Verified'], ['Texas SOS file number', '0803412291', 'Texas Secretary of State', 'Verified'], ['Texas taxpayer number', '32071234567', 'Texas Comptroller', 'Verified'], ['EFTPS enrollment', 'PIN on file', 'US Treasury', 'Verified'], ['E-Verify company ID', '1847213', 'USCIS', 'Verified'], ['Food establishment permit', 'AUS-FE-2026-0412', 'Austin Public Health', 'Expiring soon']],
    };
    return {
      legalName: 'Harbour & Field Cleaning Ltd', tradeName: 'Harbour & Field', entity: 'Private limited company', incorporated: '2015-06-03', industry: 'Commercial and healthcare cleaning',
      line1: 'Unit 4, Westinghouse Road', line2: 'Trafford Park', city: 'Manchester', state: 'Greater Manchester', postcode: 'M17 1AB', phone: '0161 555 0148', email: 'people@harbourfield.co.uk', website: 'harbourfield.co.uk',
      fiscal: 'April – March (tax year from 6 April)', weekStart: 'Monday', dateFmt: 'D MMM YYYY', tz: 'Europe/London (BST)',
      regs: [['Employer PAYE reference', '961/HF48213', 'HMRC', 'Verified'], ['Accounts Office reference', '961PX00482139', 'HMRC', 'Verified'], ['Companies House number', '09876543', 'Companies House', 'Verified'], ['Pension scheme employer ID', 'EMP004821739', 'NEST', 'Verified'], ['VAT number', 'GB 293 4471 82', 'HMRC', 'Verified'], ['ICO registration', 'ZA482193', 'Information Commissioner’s Office', 'Expiring soon'], ['Employment Allowance', 'Claimed for 2026-27', 'HMRC', 'Verified']],
    };
  }

  /* ---------- overview ---------- */
  function Overview() {
    const P = PO.P();
    const { state } = PO.useStore();
    const integ = PO.coGet(state, 'settings.integrations', null);
    const connected = integ ? Object.values(integ).filter(Boolean).length : INTEGRATIONS(P).filter((i) => i.on).length;
    const imp = PO.coGet(state, 'settings.import', { step: 0 });
    const meta = {
      company: `${companyDefaults(P).regs.length} registrations on file`, sites: PO.plural(P.sites.length, 'site'), org: `${P.depts.length} departments, ${new Set(P.people.map((p) => p.grade)).size} grades`,
      pay: `${P.company.cadence}, next pay ${P.company.payBy}`, countries: `3 live, ${PO.PACKS.length - 3} available`, roles: '6 roles', security: 'SSO and 2FA on for admins', audit: `${P.audit.length} events in 10 days`,
      workflows: '8 approval chains', notifications: `${notifEvents().length} events, 4 channels`, integrations: `${connected} connected`, portal: `people.${(((P.people[0] || {}).email || '').split('@')[1] || '')}`, import: imp.live ? 'Live since import' : imp.step ? `Step ${imp.step + 1} of 5` : 'Not started',
    };
    const done = 9 + (imp.live ? 1 : 0);
    return html`<${Head} title="Settings" sub=${`${P.company.name}, ${P.company.country}. Setup is ${done} of 10 steps done.`} actions=${html`<${PO.Button} icon="History" href=${PO.href('settings/audit')}>Audit log</${PO.Button}>`} />
      ${done < 10 ? html`<${PO.Callout} icon="ListChecks" title="One setup step left" action=${html`<${PO.Button} kind="primary" href=${PO.href('settings/import')}>Finish setup</${PO.Button}>`}>Run one payroll in parallel with last month’s register before you switch off the old system.</${PO.Callout}>` : null}
      <div class="card">${['Company', 'Access', 'Automation'].map((g) => {
        const idx = SECTIONS.findIndex((s) => s.group === g);
        const items = []; for (let i = idx + 1; i < SECTIONS.length && Array.isArray(SECTIONS[i]); i++) items.push(SECTIONS[i]);
        return html`<div class="set-index-h">${g}</div>${items.map(([k, l, ic, d]) => html`<a class="set-index-row" href=${PO.href('settings/' + k)}><${PO.Chip} icon=${ic} accent=${SEC_ACC[k] || 'green'} /><span class="grow" style="min-width:0"><b>${l}</b><small>${d}</small></span><span class="faint t-sm" style="flex:none">${meta[k]}</span><${PO.Icon} n="ChevronRight" size=${14} cls="faint" /></a>`)}`;
      })}</div>`;
  }

  /* ---------- company ---------- */
  function Company() {
    const P = PO.P();
    const draft = useDraft('settings.company', companyDefaults(P));
    const { d, set } = draft;
    const setReg = (i, v) => set('regs', d.regs.map((r, j) => (j === i ? [r[0], v, r[2], r[3]] : r)));
    const hue = { in: 22, us: 28, uk: 220 }[P.id];
    return html`<${Head} title="Company profile" sub=${`${d.legalName}, with ${d.regs.length} statutory registrations on file${d.regs.some((r) => r[3] === 'Expiring soon') ? ` and ${d.regs.filter((r) => r[3] === 'Expiring soon').length} expiring soon` : ''}.`} />
      <${PO.Card} title="Legal entity" icon="Building2" accent="green" sub="As registered">
        <div class="row gap-16" style="margin-bottom:18px;align-items:center">
          <${Logo} txt=${coInitials(P)} size="lg" />
          <div class="grow"><b class="w-600">Company logo</b><div class="faint t-sm">Shown on payslips, letters and the employee portal. PNG or SVG, at least 256 px.</div></div>
          <${PO.Button} size="sm" onClick=${() => PO.toast('Logo uploaded: logo-2026.svg (18 KB)', { icon: 'Image' })}>Upload</${PO.Button}><${PO.Button} size="sm" kind="ghost" onClick=${() => PO.toast('Using initials until a logo is uploaded')}>Remove</${PO.Button}>
        </div>
        <div class="set-form">
          <${PO.Field} label="Legal name"><${Inp} v=${d.legalName} on=${(v) => set('legalName', v)} /></${PO.Field}>
          <${PO.Field} label="Trading name"><${Inp} v=${d.tradeName} on=${(v) => set('tradeName', v)} /></${PO.Field}>
          <${PO.Field} label="Entity type"><${PO.Select} value=${d.entity} onChange=${(v) => set('entity', v)} options=${PO.isUS() ? ['Limited liability company', 'S corporation', 'C corporation', 'Sole proprietorship'] : PO.isIN() ? ['Private limited company', 'Limited liability partnership', 'Partnership firm', 'Proprietorship'] : ['Private limited company', 'Limited liability partnership', 'Sole trader']} /></${PO.Field}>
          <${PO.Field} label="Incorporated on"><${Inp} type="date" v=${d.incorporated} on=${(v) => set('incorporated', v)} /></${PO.Field}>
          <${PO.Field} label="Industry" hint="Used to pick the right minimum wage schedule and templates"><${Inp} v=${d.industry} on=${(v) => set('industry', v)} /></${PO.Field}>
          <${PO.Field} label="Website"><${Inp} v=${d.website} on=${(v) => set('website', v)} /></${PO.Field}>
        </div>
      </${PO.Card}>
      <${PO.Card} title="Registered address" icon="MapPin" accent="blue">
        <div class="set-form">
          <div class="span-2"><${PO.Field} label="Address line 1"><${Inp} v=${d.line1} on=${(v) => set('line1', v)} /></${PO.Field}></div>
          <${PO.Field} label="Address line 2"><${Inp} v=${d.line2} on=${(v) => set('line2', v)} /></${PO.Field}>
          <${PO.Field} label="City"><${Inp} v=${d.city} on=${(v) => set('city', v)} /></${PO.Field}>
          <${PO.Field} label=${PO.isUS() ? 'State' : PO.isIN() ? 'State' : 'County'}><${Inp} v=${d.state} on=${(v) => set('state', v)} /></${PO.Field}>
          <${PO.Field} label=${PO.isUS() ? 'ZIP code' : PO.isIN() ? 'PIN code' : 'Postcode'}><${Inp} v=${d.postcode} on=${(v) => set('postcode', v)} /></${PO.Field}>
          <${PO.Field} label="Country"><${Inp} v=${`${P.flag} ${P.company.country}`} disabled /></${PO.Field}>
          <${PO.Field} label="HR contact email" hint="Replies from employees land in the helpdesk"><${Inp} v=${d.email} on=${(v) => set('email', v)} /></${PO.Field}>
        </div>
      </${PO.Card}>
      <${PO.Card} flush title="Statutory registrations" sub=${`${d.regs.length} on file, used on every filing`} actions=${html`<${PO.Button} size="sm" kind="ghost" icon="Plus" onClick=${() => set('regs', [...d.regs, ['New registration', '', 'Authority', 'Pending review']])}>Add</${PO.Button}>`}>
        <div class="table-wrap"><table class="tbl"><thead><tr><th style="width:210px">Registration</th><th>Number</th><th>Authority</th><th>Status</th><th></th></tr></thead><tbody>
          ${d.regs.map((r, i) => html`<tr><td class="w-500">${r[0]}</td><td style="width:200px"><${Inp} mono v=${r[1]} on=${(v) => setReg(i, v)} /></td><td class="muted t-sm">${r[2]}</td><td><${PO.Status} s=${r[3]} /></td><td class="r"><${PO.IconButton} icon="FileDown" size="sm" title="Download certificate" onClick=${() => PO.fakeDownload(`${r[0]} certificate.pdf`)} /></td></tr>`)}
        </tbody></table></div>
      </${PO.Card}>
      <${PO.Card} title="Fiscal year and formats" icon="FileCheck2" accent="violet">
        <div class="set-form">
          <${PO.Field} label="Fiscal year" hint=${PO.isIN() ? 'Matches the income-tax year for Form 130 and Form 138' : PO.isUK() ? 'P60s are produced at the end of each tax year' : 'W-2s are produced for each calendar year'}><${PO.Select} value=${d.fiscal} onChange=${(v) => set('fiscal', v)} options=${['April – March', 'January – December', 'July – June', 'April – March (tax year from 6 April)', 'October – September']} /></${PO.Field}>
          <${PO.Field} label="Week starts on"><${PO.Select} value=${d.weekStart} onChange=${(v) => set('weekStart', v)} options=${['Monday', 'Sunday', 'Saturday']} /></${PO.Field}>
          <${PO.Field} label="Date format"><${PO.Select} value=${d.dateFmt} onChange=${(v) => set('dateFmt', v)} options=${['DD MMM YYYY', 'D MMM YYYY', 'MMM D, YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY']} /></${PO.Field}>
          <${PO.Field} label="Time zone"><${Inp} v=${d.tz} on=${(v) => set('tz', v)} /></${PO.Field}>
          <${PO.Field} label="Currency"><${Inp} v=${P.company.currency} disabled /></${PO.Field}>
          <${PO.Field} label="Payslip delivery" hint="Payslips are always available in the employee portal"><${PO.Select} value=${d.slipTo || 'Employee portal + email'} onChange=${(v) => set('slipTo', v)} options=${['Employee portal + email', 'Employee portal only']} /></${PO.Field}>
        </div>
      </${PO.Card}>
      <${SaveBar} draft=${draft} />`;
  }

  /* ---------- sites ---------- */
  /* Geofence radii are stored in metres under the shared 'sites.radius' key (also used by Attendance › Clock-in
     setup and the Live board); US screens show feet. */
  const toUnit = (m) => (PO.isUS() ? Math.round((m * 3.281) / 10) * 10 : m);
  const fenceZoom = (lat, radius, H) => Math.max(14, Math.min(18, Math.floor(Math.log2((156543.03 * Math.cos((lat * Math.PI) / 180) * H * 0.4) / radius))));
  const METHODS = () => [['portal', 'Web portal + site QR'], ['terminal', PO.isIN() ? 'Portal, QR + biometric' : 'Portal, QR + kiosk'], ['terminalOnly', PO.isIN() ? 'Biometric terminal only' : 'Kiosk only']];
  const methodLabel = (k) => (METHODS().find((m) => m[0] === k) || METHODS()[0])[1];
  function Sites() {
    const P = PO.P();
    const TERM = { in: ['hjw', 'khd', 'hq', 'mgp', 'vmn'], us: ['sl', 'e6', 'dm', 'ck'], uk: ['ma', 'mc', 'sf', 'td'] }[P.id] || [];
    const base = useMemo(() => Object.fromEntries(P.sites.map((s) => [s.id, { method: TERM.includes(s.id) ? 'terminal' : 'portal', client: s.client, address: s.address, shifts: Object.fromEntries(P.shifts.map((x) => [x.key, x.time])), active: true }])), [P.id]);
    const [over, setOver] = PO.useCoState('settings.sites', {});
    const [radii, setRadii] = PO.useCoState('sites.radius', {});
    const [added, setAdded] = PO.useCoState('settings.sites.added', []);
    const [open, setOpen] = useState(null);
    const [form, setForm] = useState(null);
    const [q, setQ] = useState('');
    const [sel, setSel] = useState(null);
    const get = (id) => ({ ...(base[id] || {}), ...(over[id] || {}) });
    const radiusOf = (s) => radii[s.id] || s.radius || 150;
    const all = [...P.sites, ...added].map((s) => ({ ...s, cfg: get(s.id), r: radiusOf(s), staffNow: P.people.filter((p) => p.site === s.id).length, shiftKeys: [...new Set(P.people.filter((p) => p.site === s.id).map((p) => p.shift))].sort() }));
    const rows = all.filter((s) => !q || (s.name + ' ' + (s.cfg.client || '') + ' ' + (s.cfg.address || s.address || '')).toLowerCase().includes(q.toLowerCase()));
    const openSite = (s) => { setOpen(s); setForm(s.id !== 'new' ? { ...s.cfg, name: s.name, radius: s.r } : { name: '', address: '', radius: 150, method: 'portal', client: '', shifts: Object.fromEntries(P.shifts.map((x) => [x.key, x.time])), active: true }); };
    const save = () => {
      const { radius, ...cfg } = form;
      if (open.id === 'new') { const id = 'x' + (added.length + 1); setAdded([...added, { id, name: form.name || 'New site', client: form.client, address: form.address, staff: 0, lead: null }]); setOver({ ...over, [id]: cfg }); setRadii({ ...radii, [id]: radius }); PO.toast(`${form.name || 'New site'} added. Drop the pin on the map to finish the geofence.`); }
      else { setOver({ ...over, [open.id]: cfg }); setRadii({ ...radii, [open.id]: radius }); PO.toast(`Saved ${open.name}`); }
      setOpen(null);
    };
    const setR = (s, v) => setRadii({ ...radii, [s.id]: v });
    const avg = Math.round(all.reduce((t, r) => t + r.r, 0) / all.length);
    return html`<${Head} title="Sites & geofences" sub=${`${PO.num(P.people.length)} people across ${PO.plural(all.length, 'site')}. Geofences average ${PO.num(toUnit(avg))} ${unit()}.`} actions=${html`<${PO.Button} icon="Download" onClick=${() => PO.exportCsv('sites', [['Site', 'Client', 'Address', 'Latitude', 'Longitude', `Geofence (${unit()})`, 'Clock-in', 'People'], ...all.map((s) => [s.name, s.cfg.client || '', s.cfg.address || s.address || '', s.lat || '', s.lng || '', toUnit(s.r), methodLabel(s.cfg.method), s.staffNow])])}>Export</${PO.Button}><${PO.Button} kind="primary" icon="Plus" onClick=${() => openSite({ id: 'new', name: 'New site' })}>Add site</${PO.Button}>`} />
      <div class="card" style="overflow:hidden">
        <div class="set-sites-map"><${PO.GMap} pins=${all.filter((s) => s.lat).map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.name, count: s.staffNow, tone: s.cfg.active === false ? 'slate' : 'green', address: s.address }))} selected=${sel} onPick=${setSel} height=${300} pad=${60} title="Sites" /></div>
        <div class="tbl-toolbar"><${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search sites or addresses" width=${260} /><span class="faint t-sm right">${PO.plural(rows.length, 'site')}</span></div>
        ${rows.length ? html`<div class="table-wrap"><table class="tbl"><thead><tr><th>Site</th><th>Client</th><th class="r">People</th><th style="width:210px">Geofence</th><th>Clock-in</th><th></th></tr></thead><tbody>
          ${rows.map((s) => html`<tr class=${'clickable ' + (sel === s.id ? 'selected' : '')} onClick=${() => setSel(s.id)}>
            <td style="max-width:260px"><b class="w-550">${s.name}</b>${s.cfg.active === false ? html` <span class="faint t-sm">Inactive</span>` : null}<div class="faint t-sm ellipsis" title=${s.cfg.address || s.address}>${s.lat ? (s.cfg.address || s.address) : 'Pin not placed yet'}</div></td>
            <td style="max-width:200px"><div class="ellipsis">${s.cfg.client || '—'}</div>${s.lead ? html`<div class="faint t-sm ellipsis">Lead: ${PO.person(s.lead).name}</div>` : null}</td>
            <td class="r tnum">${s.staffNow}</td>
            <td onClick=${(e) => e.stopPropagation()}><div class="row" style="gap:10px"><input type="range" class="set-range" style="width:120px" min="50" max="500" step="10" value=${s.r} aria-label=${`Geofence radius for ${s.name}`} onInput=${(e) => setR(s, +e.target.value)} onChange=${(e) => PO.toast(`Geofence for ${s.name}: ${PO.num(toUnit(+e.target.value))} ${unit()}`)} /><span class="tnum t-sm" style="width:56px;text-align:right">${PO.num(toUnit(s.r))} ${unit()}</span></div></td>
            <td class="muted t-sm" style="white-space:nowrap">${methodLabel(s.cfg.method)}</td>
            <td class="r" onClick=${(e) => e.stopPropagation()}><${PO.IconButton} icon="Pencil" size="sm" title=${`Edit ${s.name}`} onClick=${() => openSite(s)} /></td>
          </tr>`)}
        </tbody></table></div>` : html`<${PO.Empty} icon="MapPinOff" title="No sites match" text="Try another name or address." />`}
      </div>
      <${PO.Drawer} open=${!!open} title=${open && open.id === 'new' ? 'Add a site' : open && open.name} sub=${open && open.id !== 'new' ? `${open.staffNow} people, ${open.id.toUpperCase()}` : 'A client location or office'} onClose=${() => setOpen(null)} footer=${html`<${PO.Button} onClick=${() => setOpen(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" icon="Check" onClick=${save}>${open && open.id === 'new' ? 'Add site' : 'Save site'}</${PO.Button}>`}>
        ${form ? html`<div class="col gap-16">
          ${open.id === 'new' ? html`<${PO.Field} label="Site name"><${Inp} v=${form.name} ph=${PO.isIN() ? 'e.g. Amanora Mall, Hadapsar' : PO.isUS() ? 'e.g. Mueller' : 'e.g. Etihad Campus'} on=${(v) => setForm({ ...form, name: v })} /></${PO.Field}>` : null}
          <${PO.Field} label="Address" hint="Used for the map pin and the site QR poster"><${Inp} v=${form.address} ph=${PO.isIN() ? 'e.g. Amanora Park Town, Hadapsar, Pune 411028' : PO.isUS() ? 'e.g. 1801 Aldrich St, Austin, TX 78723' : 'e.g. Etihad Campus, Manchester M11 3FF'} on=${(v) => setForm({ ...form, address: v })} /></${PO.Field}>
          <${PO.Field} label="Client / description"><${Inp} v=${form.client} on=${(v) => setForm({ ...form, client: v })} /></${PO.Field}>
          <div class="card inset" style="padding:14px">
            ${open.lat ? html`<div style="margin-bottom:12px"><${PO.GMapPlace} lat=${open.lat} lng=${open.lng} zoom=${fenceZoom(open.lat, form.radius, 220)} height=${220} radius=${form.radius} label=${open.name} address=${form.address} /></div>` : null}
            <div class="row"><b class="w-600">Geofence radius</b><b class="right tnum t-md">${PO.num(toUnit(form.radius))} ${unit()}</b></div>
            <input type="range" class="set-range mt-8" min="50" max="500" step="10" value=${form.radius} onInput=${(e) => setForm({ ...form, radius: +e.target.value })} />
            <div class="faint t-sm">Portal clock-ins further than this from the site pin ask for the site QR. Browser location indoors is often ${PO.isUS() ? '±150–650 ft' : '±50–200 m'}.</div>
          </div>
          <${PO.Field} label="Clock-in methods"><${PO.Select} value=${form.method} onChange=${(v) => setForm({ ...form, method: v })} options=${METHODS()} /></${PO.Field}>
          <div><div class="w-600" style="margin-bottom:8px">Shift times at this site</div>
            ${P.shifts.map((s) => html`<div class="row" style="margin-bottom:8px"><span class="w-500" style="width:140px">${s.label} <span class="faint">(${s.key})</span></span><${Inp} v=${form.shifts[s.key]} on=${(v) => setForm({ ...form, shifts: { ...form.shifts, [s.key]: v } })} /></div>`)}
          </div>
          <${Row} t="Site is active" s="Inactive sites are hidden from the roster and the portal’s clock-in page"><${PO.Switch} on=${form.active !== false} onChange=${(v) => setForm({ ...form, active: v })} /></${Row}>
        </div>` : null}
      </${PO.Drawer}>`;
  }

  /* ---------- employee portal ---------- */
  function Portal() {
    const P = PO.P();
    const host = 'people.' + (((P.people[0] || {}).email || '').split('@')[1] || 'company.com');
    const draft = useDraft('settings.portal', { email: true, otp: true, sso: !PO.isUS(), magic: true, color: { in: '#d9480f', us: '#8a5a2b', uk: '#1d4ed8' }[P.id], welcome: `Welcome to ${P.company.short}. Clock in, see your shifts and pay, and ask HR here.`, geo: true, qr: true, kiosk: true, self: true });
    const { d, set } = draft;
    const hue = { in: 22, us: 28, uk: 220 }[P.id];
    const active = Math.round(P.people.length * 0.94);
    return html`<${Head} title="Employee portal" sub=${`${PO.num(active)} of ${P.people.length} employees signed in this month; ${PO.pct(0.41)} of clock-ins came through the portal.`} />
      <${PO.Card} title="Portal address" icon="Globe" accent="blue">
        <${Row} t="Portal URL" s="Share it in offer letters, on site QR posters and in the welcome SMS"><span class="mono t-sm">https://${host}</span><${PO.IconButton} icon="Copy" size="sm" title="Copy portal URL" onClick=${() => PO.toast(`Copied https://${host}`, { icon: 'Link' })} /></${Row}>
        <${Row} t="Clock-in page" s="Opened by each site’s QR code; the site is part of the link"><span class="mono t-sm">${host}/clock-in/‹site›</span></${Row}>
        <${Row} t="Kiosk mode" s="A locked, shared-tablet view of the clock-in page for a site entrance"><${PO.Button} size="sm" icon="Link" onClick=${() => PO.toast('Kiosk mode link copied. Open it on the site tablet.', { icon: 'Link' })}>Copy kiosk link</${PO.Button}></${Row}>
      </${PO.Card}>
      <${PO.Card} title="How employees sign in" icon="Users" accent="blue">
        <${Row} t="Work email and password" s="For office staff with a company mailbox"><${PO.Switch} on=${d.email} onChange=${(v) => set('email', v)} /></${Row}>
        <${Row} t="Phone number with one-time code" s="For frontline staff. A 6-digit code arrives by SMS; no password to forget"><${PO.Switch} on=${d.otp} onChange=${(v) => set('otp', v)} /></${Row}>
        <${Row} t="Single sign-on" s=${PO.isUK() ? 'Microsoft Entra ID, for office and supervisor accounts' : 'Google Workspace, for office and supervisor accounts'}><${PO.Switch} on=${d.sso} onChange=${(v) => set('sso', v)} /></${Row}>
        <${Row} t="Sign-in link by email" s="A one-click link for people who rarely sign in"><${PO.Switch} on=${d.magic} onChange=${(v) => set('magic', v)} /></${Row}>
      </${PO.Card}>
      <${PO.Card} title="Clock-in from the portal" icon="MapPinned" accent="teal" actions=${html`<${PO.Button} size="sm" kind="ghost" href=${PO.href('attendance?tab=setup')}>Clock-in setup</${PO.Button}>`}>
        <${Row} t="Browser location (geofence)" s="The portal asks the browser for location and checks it against the site’s geofence"><${PO.Switch} on=${d.geo} onChange=${(v) => set('geo', v)} /></${Row}>
        <${Row} t="Site QR" s="Scanning the poster at the entrance opens the clock-in page and proves the person is on site"><${PO.Switch} on=${d.qr} onChange=${(v) => set('qr', v)} /></${Row}>
        <${Row} t=${PO.isIN() ? 'Kiosks and biometric terminals' : 'Kiosks'} s="Shared devices at the site entrance"><${PO.Switch} on=${d.kiosk} onChange=${(v) => set('kiosk', v)} /></${Row}>
        <${Row} t="Self-service requests" s=${`Employees apply for ${leaveWord().toLowerCase()}, claim expenses, download payslips and raise helpdesk tickets in the portal`}><${PO.Switch} on=${d.self} onChange=${(v) => set('self', v)} /></${Row}>
      </${PO.Card}>
      <${PO.Card} title="Branding" icon="Palette" accent="rose">
        <div class="row gap-16" style="align-items:center;margin-bottom:14px"><${Logo} txt=${coInitials(P)} size="lg" /><div class="grow"><b class="w-600">${P.company.short}</b><div class="faint t-sm">Logo and colour on the sign-in page, the portal header and site QR posters</div></div><${PO.Button} size="sm" onClick=${() => PO.toast('Logo uploaded: logo-2026.svg (18 KB)', { icon: 'Image' })}>Upload logo</${PO.Button}></div>
        <div class="set-form">
          <${PO.Field} label="Brand colour"><div class="row" style="gap:8px"><input type="color" value=${d.color} onInput=${(e) => set('color', e.target.value)} style="width:40px;height:34px;border:1px solid var(--border);border-radius:8px;background:none;padding:2px;flex:none" /><${Inp} mono v=${d.color} on=${(v) => set('color', v)} /></div></${PO.Field}>
          <${PO.Field} label="Language"><${Inp} v="English" disabled /></${PO.Field}>
          <div class="span-2"><${PO.Field} label="Welcome message" hint="Shown on the sign-in page"><textarea class="textarea" rows="2" value=${d.welcome} onInput=${(e) => set('welcome', e.target.value)}></textarea></${PO.Field}></div>
        </div>
      </${PO.Card}>
      <${SaveBar} draft=${draft} label="Employee portal settings saved" />`;
  }

  /* ---------- org: departments, grades, titles ---------- */
  function Org() {
    const P = PO.P();
    const [tab, setTab] = useState((location.hash.match(/[?&]tab=(\w+)/) || [])[1] || 'depts');
    const [custom, setCustom] = PO.useCoState('settings.depts.custom', []);
    const [adding, setAdding] = useState(null);
    const grades = useMemo(() => {
      const m = {};
      P.people.forEach((p) => { const g = (m[p.grade] = m[p.grade] || { grade: p.grade, people: [], titles: new Set() }); g.people.push(p); g.titles.add(p.title); });
      return Object.values(m).map((g) => ({ id: g.grade, grade: g.grade, count: g.people.length, titles: [...g.titles], min: Math.min(...g.people.map((p) => p.pay.gross)), max: Math.max(...g.people.map((p) => p.pay.gross)) })).sort((a, b) => a.grade.localeCompare(b.grade));
    }, [P.id]);
    const titles = useMemo(() => {
      const m = {};
      P.people.forEach((p) => { const t = (m[p.title] = m[p.title] || { id: p.title, title: p.title, dept: p.dept, grade: p.grade, count: 0, sites: new Set() }); t.count++; t.sites.add(p.site); });
      return Object.values(m).sort((a, b) => b.count - a.count);
    }, [P.id]);
    const depts = [...P.depts.map((d) => ({ ...d, id: d.name, sites: [...new Set(P.people.filter((p) => p.dept === d.name).map((p) => p.site))].length, cost: P.people.filter((p) => p.dept === d.name).reduce((t, p) => t + p.pay.gross + p.pay.erTotal, 0) })), ...custom.map((d) => ({ ...d, id: d.name, count: 0, sites: 0, cost: 0 }))];
    return html`<${Head} title="Departments & grades" sub=${`${PO.plural(depts.length, 'department')}, ${PO.plural(grades.length, 'grade')} and ${PO.plural(titles.length, 'job title')}.`} actions=${html`<${PO.Button} kind="primary" icon="Plus" onClick=${() => setAdding({ name: '', head: P.topId, code: '' })}>Add department</${PO.Button}>`} />
      <${PO.Tabs} tabs=${[['depts', 'Departments', depts.length], ['grades', 'Grades', grades.length], ['titles', 'Job titles', titles.length]]} value=${tab} onChange=${setTab} />
      ${tab === 'depts' ? html`<${PO.DataTable} rows=${depts} exportName="departments" search=${(d) => d.name}
        columns=${[
          { key: 'name', label: 'Department', render: (d) => html`<b class="w-550">${d.name}</b>${d.isNew ? html` <span class="faint t-sm">new</span>` : null}` },
          { key: 'head', label: 'Head', render: (d) => html`<${PO.Who} id=${d.head} size="sm" />`, sort: (d) => PO.person(d.head).name, csv: (d) => PO.person(d.head).name },
          { key: 'count', label: 'People', align: 'r', render: (d) => html`<span class="tnum">${d.count}</span>` },
          { key: 'sites', label: 'Sites', align: 'r', render: (d) => html`<span class="tnum">${d.sites}</span>` },
          { key: 'cost', label: `Cost this ${PO.isIN() ? 'month' : 'period'}`, align: 'r', render: (d) => html`<span class="tnum">${PO.money(d.cost, { compact: true })}</span>`, csv: (d) => Math.round(d.cost) },
          { key: 'x', label: '', sort: false, render: (d) => html`<${PO.Menu} align="right" trigger=${html`<${PO.IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: 'View people', icon: 'Users', onClick: () => PO.go('people') }, { label: 'Rename', icon: 'Pencil', onClick: () => PO.toast(`Renaming is logged in the audit trail`) }, '-', { label: 'Archive', icon: 'Archive', danger: true, onClick: () => d.isNew ? (setCustom(custom.filter((c) => c.name !== d.name)), PO.toast(`${d.name} archived`)) : PO.toast(`Move ${d.count} people out of ${d.name} before archiving it`, { icon: 'TriangleAlert' }) }]} />` },
        ]} />` : null}
      ${tab === 'grades' ? html`<${PO.DataTable} rows=${grades} exportName="grades"
        columns=${[
          { key: 'grade', label: 'Grade', render: (g) => html`<b class="w-600">${g.grade}</b>` },
          { key: 'titles', label: 'Job titles', render: (g) => html`<span class="muted">${g.titles.join(', ')}</span>`, sort: false, csv: (g) => g.titles.join('; ') },
          { key: 'count', label: 'People', align: 'r' },
          { key: 'min', label: `Gross pay range (${PO.isIN() ? 'monthly' : 'per period'})`, align: 'r', render: (g) => html`<span class="tnum">${PO.money(g.min)} – ${PO.money(g.max)}</span>`, csv: (g) => `${Math.round(g.min)}-${Math.round(g.max)}` },
          { key: 'ot', label: 'Overtime', render: (g) => { const no = (PO.isIN() && /^M/.test(g.grade)) || (PO.isUS() && /^S/.test(g.grade)) || (PO.isUK() && /^O/.test(g.grade)); return html`<span class=${no ? 'faint' : ''}>${no ? 'Not eligible' : 'Eligible'}</span>`; }, sort: false, csv: () => '' },
        ]} />` : null}
      ${tab === 'titles' ? html`<${PO.DataTable} rows=${titles} exportName="job-titles" search=${(t) => t.title + ' ' + t.dept}
        columns=${[
          { key: 'title', label: 'Job title', render: (t) => html`<b class="w-550">${t.title}</b>` },
          { key: 'dept', label: 'Department' },
          { key: 'grade', label: 'Grade', render: (t) => html`${t.grade}` },
          { key: 'count', label: 'People', align: 'r' },
          { key: 'sites', label: 'Sites', align: 'r', render: (t) => t.sites.size, sort: (t) => t.sites.size, csv: (t) => t.sites.size },
        ]} />` : null}
      <${PO.Drawer} open=${!!adding} size="sm" title="Add department" onClose=${() => setAdding(null)} footer=${html`<${PO.Button} onClick=${() => setAdding(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" disabled=${!(adding && adding.name.trim())} onClick=${() => { setCustom([...custom, { name: adding.name.trim(), head: adding.head, isNew: true }]); PO.toast(`${adding.name.trim()} added`); setAdding(null); }}>Add department</${PO.Button}>`}>
        ${adding ? html`<div class="col gap-16">
          <${PO.Field} label="Name"><${Inp} v=${adding.name} ph=${PO.isIN() ? 'e.g. Pest control' : PO.isUS() ? 'e.g. Catering' : 'e.g. Washroom services'} on=${(v) => setAdding({ ...adding, name: v })} /></${PO.Field}>
          <${PO.Field} label="Cost centre code"><${Inp} mono v=${adding.code} ph="CC-140" on=${(v) => setAdding({ ...adding, code: v })} /></${PO.Field}>
          <${PO.Field} label="Head"><${PO.Select} value=${adding.head} onChange=${(v) => setAdding({ ...adding, head: v })} options=${P.people.filter((p) => p.role === 'office' || p.role === 'sup').map((p) => [p.id, `${p.name}, ${p.title}`])} /></${PO.Field}>
        </div>` : null}
      </${PO.Drawer}>`;
  }

  /* ---------- roles & permissions ---------- */
  const MODULES = ['Employees', 'Attendance & roster', 'Leave', 'Payroll', 'Expenses', 'Compliance', 'Contractors', 'Reports', 'Hiring & performance', 'Settings'];
  const BASE_ROLES = [
    ['owner', 'Owner', [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], 'All company'],
    ['hr', 'HR admin', [3, 3, 3, 3, 3, 3, 3, 3, 3, 2], 'All company'],
    ['payroll', 'Payroll', [1, 1, 1, 3, 3, 2, 2, 2, 0, 0], 'All company'],
    ['manager', 'Manager', [1, 3, 3, 0, 3, 0, 0, 1, 2, 0], 'Their team'],
    ['sup', 'Site supervisor', [1, 3, 3, 0, 2, 0, 1, 1, 1, 0], 'Their site'],
    ['emp', 'Employee', [1, 1, 2, 1, 2, 0, 0, 0, 0, 0], 'Only themselves'],
  ];
  const LVL = ['No access', 'View', 'Edit', 'Approve'];
  function Roles() {
    const P = PO.P();
    const init = Object.fromEntries(BASE_ROLES.map((r) => [r[0], r[2]]));
    const draft = useDraft('settings.roles', { matrix: init, custom: [] });
    const { d } = draft;
    const [adding, setAdding] = useState(null);
    const roles = [...BASE_ROLES.map(([k, l, , scope]) => ({ k, l, scope })), ...d.custom.map((c) => ({ k: c.k, l: c.l, scope: c.scope, custom: true }))];
    const members = { owner: [P.topId], hr: [P.hrId], payroll: [P.hrId], manager: Object.keys(P.byManager), sup: P.sites.map((s) => s.lead).filter(Boolean), emp: P.people.map((p) => p.id) };
    const cycle = (rk, mi) => { const m = d.matrix[rk].slice(); m[mi] = (m[mi] + 1) % 4; draft.setAll({ ...d, matrix: { ...d.matrix, [rk]: m } }); };
    return html`<${Head} title="Roles & permissions" sub=${`${roles.length} roles across ${MODULES.length} modules. Click a cell to change access; it applies on next sign-in.`} actions=${html`<${PO.Button} icon="Plus" onClick=${() => setAdding({ l: '', base: 'manager', scope: 'Their site' })}>Custom role</${PO.Button}>`} />
      <${PO.Card} flush title="Permission matrix" sub=${`${MODULES.length} modules × ${roles.length} roles`} actions=${html`<div class="row t-sm faint" style="gap:10px">${LVL.slice(1).map((l, i) => html`<span class="row" style="gap:4px"><span class=${'set-lvl l' + (i + 1)} style="min-width:0;height:18px;padding:0 6px;font-size:11px">${l}</span></span>`)}</div>`}>
        <div class="table-wrap"><table class="tbl set-matrix"><thead><tr><th style="width:200px">Module</th>${roles.map((r) => html`<th>${r.l}<div class="faint t-xs" style="font-weight:500;text-transform:none;letter-spacing:0">${r.custom ? 'Custom' : PO.plural(members[r.k] ? members[r.k].length : 0, 'person', 'people')}</div></th>`)}</tr></thead><tbody>
          ${MODULES.map((m, mi) => html`<tr><td class="w-500">${m}</td>${roles.map((r) => { const v = d.matrix[r.k][mi]; return html`<td><button class=${'set-lvl l' + v} disabled=${r.k === 'owner'} title=${r.k === 'owner' ? 'The owner always has full access' : `${r.l}: ${LVL[v]} — click to change`} onClick=${() => cycle(r.k, mi)}>${LVL[v]}</button></td>`; })}</tr>`)}
          <tr><td class="w-500 faint">Data scope</td>${roles.map((r) => html`<td class="faint t-sm">${r.scope}</td>`)}</tr>
        </tbody></table></div>
      </${PO.Card}>
      <p class="faint t-sm" style="margin-top:-12px">${PO.isIN() ? 'Aadhaar, PAN and bank account numbers' : PO.isUS() ? 'SSNs and bank account numbers' : 'NI numbers and bank details'} are masked for everyone except Owner and HR admin, even with Edit access. Every reveal is written to the audit log.</p>
      <${SaveBar} draft=${draft} label="Permissions saved" />
      <${PO.Drawer} open=${!!adding} size="sm" title="Create a custom role" onClose=${() => setAdding(null)} footer=${html`<${PO.Button} onClick=${() => setAdding(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" disabled=${!(adding && adding.l.trim())} onClick=${() => { const k = 'c' + Date.now(); const next = { matrix: { ...d.matrix, [k]: d.matrix[adding.base].slice() }, custom: [...d.custom, { k, l: adding.l.trim(), scope: adding.scope }] }; draft.setAll(next); PO.toast(`${adding.l.trim()} created. Adjust its permissions, then save.`); setAdding(null); }}>Create role</${PO.Button}>`}>
        ${adding ? html`<div class="col gap-16">
          <${PO.Field} label="Role name"><${Inp} v=${adding.l} ph=${PO.isIN() ? 'e.g. Area manager' : PO.isUS() ? 'e.g. Catering manager' : 'e.g. Contract manager'} on=${(v) => setAdding({ ...adding, l: v })} /></${PO.Field}>
          <${PO.Field} label="Start from"><${PO.Select} value=${adding.base} onChange=${(v) => setAdding({ ...adding, base: v })} options=${BASE_ROLES.map((r) => [r[0], r[1]])} /></${PO.Field}>
          <${PO.Field} label="Data scope"><${PO.Select} value=${adding.scope} onChange=${(v) => setAdding({ ...adding, scope: v })} options=${['All company', 'Selected sites', 'Their site', 'Their team', 'Only themselves']} /></${PO.Field}>
        </div>` : null}
      </${PO.Drawer}>`;
  }

  /* ---------- workflows ---------- */
  function chains(P) {
    const lw = leaveWord().toLowerCase();
    return [
      { id: 'w1', name: `${leaveWord()} up to 3 days`, when: `Any ${lw} request of 3 days or less`, steps: ['Supervisor'], sla: '24 h', used: 41 },
      { id: 'w2', name: `${leaveWord()} over 3 days`, when: `${leaveWord()} longer than 3 days, or overlapping a public holiday`, steps: ['Supervisor', 'HR', 'Owner'], sla: '48 h', used: 9 },
      { id: 'w3', name: 'Overtime', when: PO.isIN() ? 'More than 10 hours in a week at a site' : 'Any overtime before it is paid', steps: ['Site supervisor', 'Operations head'], sla: '24 h', used: 17 },
      { id: 'w4', name: 'Expenses', when: `Above ${PO.money(PO.isIN() ? 2500 : 120)} or without a receipt`, steps: ['Manager', 'Payroll'], sla: '72 h', used: 23 },
      { id: 'w5', name: 'Salary advance', when: `Any advance, max ${PO.isIN() ? '50% of monthly net' : 'one pay period’s net'}`, steps: ['HR', 'Owner'], sla: '48 h', used: 4 },
      { id: 'w6', name: 'Payroll run', when: `Every ${P.company.cadence.toLowerCase()} run before payment`, steps: ['Payroll', 'HR', 'Owner'], sla: `Before ${P.company.payBy}`, used: 12 },
    ];
  }
  function Workflows() {
    const P = PO.P();
    const AF = PO.approvalFlows;
    const [flows] = PO.useCoState('rules.workflows', AF ? AF.defaults(P) : null);
    const list = flows ? flows.flatMap((f) => f.lanes.map((l, li) => ({ id: f.id + li, icon: f.icon, name: f.lanes.length > 1 ? `${f.name}: ${l.cond.charAt(0).toLowerCase() + l.cond.slice(1)}` : f.name, when: l.cond, steps: l.steps.length ? l.steps.map((k) => AF.roles.find((r) => r[0] === k)[1]) : ['Auto-approved'], sla: f.sla + ' h', used: PO.seeded('wf' + P.id + f.id + li).int(3, 44) }))) : chains(P);
    const [off, setOff] = PO.useCoState('settings.workflows.off', {});
    const [esc, setEsc] = PO.useCoState('settings.workflows.esc', { on: true, hours: '24', delegate: true });
    return html`<${Head} title="Approval workflows" sub=${`${list.filter((w) => !off[w.id]).length} of ${list.length} chains on. ${list.reduce((t, w) => t + w.used, 0)} approvals in the last 30 days, median 5.2 h.`} actions=${html`<${PO.Button} kind="primary" href=${PO.href('rules?tab=workflows')}>Open chain builder</${PO.Button}>`} />
      <${PO.Card} flush title="Approval chains">
        <div class="list">${list.map((w) => html`<div class="list-item" style="align-items:center">
          <div class="grow" style="min-width:0"><b class="w-550">${w.name}</b><div class="faint t-sm ellipsis">${w.when}, SLA ${w.sla}, used ${w.used} times in 30 days</div></div>
          <div class="set-chain" style="flex:none">${w.steps.map((s, i) => html`${i ? html`<${PO.Icon} n="ArrowRight" size=${12} cls="faint" />` : null}<span class="set-chip">${s}</span>`)}</div>
          <${PO.Switch} on=${!off[w.id]} onChange=${(v) => { setOff({ ...off, [w.id]: !v }); PO.toast(`${w.name} ${v ? 'turned on' : 'paused'}`); }} />
          <${PO.IconButton} icon="Pencil" size="sm" title="Edit in chain builder" onClick=${() => PO.go('rules?tab=workflows')} />
        </div>`)}</div>
      </${PO.Card}>
      <${PO.Card} title="Escalation and delegation" icon="GitBranch" accent="violet">
        <${Row} t="Escalate when an approver doesn’t respond" s=${`After ${esc.hours} hours the request moves to the next step and the approver gets a reminder`}><${PO.Select} width=${110} value=${esc.hours} onChange=${(v) => { setEsc({ ...esc, hours: v }); PO.toast('Saved'); }} options=${[['12', '12 hours'], ['24', '24 hours'], ['48', '48 hours']]} /><${PO.Switch} on=${esc.on} onChange=${(v) => { setEsc({ ...esc, on: v }); PO.toast('Saved'); }} /></${Row}>
        <${Row} t="Auto-delegate when an approver is on leave" s="Their approvals go to their own manager until they’re back"><${PO.Switch} on=${esc.delegate} onChange=${(v) => { setEsc({ ...esc, delegate: v }); PO.toast('Saved'); }} /></${Row}>
        <${Row} t="Approve from email" s="Approvers get a signed link and can approve or reject without signing in to the portal. Each click is logged with the device."><${PO.Switch} on=${esc.wa !== false} onChange=${(v) => { setEsc({ ...esc, wa: v }); PO.toast('Saved'); }} /></${Row}>
      </${PO.Card}>`;
  }

  /* ---------- pay ---------- */
  function Pay() {
    const P = PO.P();
    const init = PO.isIN()
      ? { cadence: 'Monthly', payDay: '7th of next month', period: '1st – end of month', cutoff: '25', lock: '5', bank: 'HDFC Bank', acct: '50200041827713', branch: 'HDFC0000418, Wakad, Pune', fmt: 'HDFC bulk upload (XLSX)', approve2: true, ytd: true, ctc: true, holdNoBank: true }
      : PO.isUS()
        ? { cadence: 'Bi-weekly', payDay: 'Friday after period end', period: 'Sun – Sat, 2 weeks', cutoff: 'Monday 10:00', lock: 'Tuesday 17:00', bank: 'Chase Business Complete', acct: '000003927418', branch: 'Routing 111000614', fmt: 'NACHA ACH (CCD+)', approve2: true, ytd: true, ctc: false, holdNoBank: false }
        : { cadence: 'Four-weekly', payDay: 'Friday after period end', period: 'Monday – Sunday, 4 weeks', cutoff: 'Monday 12:00', lock: 'Tuesday 17:00', bank: 'Barclays Business', acct: '43918722', branch: 'Sort code 20-55-41', fmt: 'Bacs Standard 18', approve2: true, ytd: true, ctc: false, holdNoBank: false };
    const draft = useDraft('settings.pay', init);
    const { d, set } = draft;
    const last = P.payHistory[P.payHistory.length - 2];
    const upcoming = PO.isIN() ? [['September 2026', '25 Sep', '5 Oct', '7 Oct'], ['October 2026', '25 Oct', '4 Nov', '7 Nov'], ['November 2026', '25 Nov', '4 Dec', '7 Dec']]
      : PO.isUS() ? [['Sep 21 – Oct 4', 'Oct 5', 'Oct 6', 'Oct 9'], ['Oct 5 – Oct 18', 'Oct 19', 'Oct 20', 'Oct 23'], ['Oct 19 – Nov 1', 'Nov 2', 'Nov 3', 'Nov 6']]
        : [['7 Sep – 4 Oct', '5 Oct', '6 Oct', '9 Oct'], ['5 Oct – 1 Nov', '2 Nov', '3 Nov', '6 Nov'], ['2 Nov – 29 Nov', '30 Nov', '1 Dec', '4 Dec']];
    return html`<${Head} title="Pay schedules" sub=${`${P.company.cadence} payroll for ${P.people.length} people. Next pay date is ${P.company.payBy}.`} />
      <${PO.Card} title="Pay schedule" icon="Banknote" accent="green">
          <div class="set-form">
            <${PO.Field} label="Frequency"><${PO.Select} value=${d.cadence} onChange=${(v) => set('cadence', v)} options=${['Weekly', 'Bi-weekly', 'Semi-monthly', 'Four-weekly', 'Monthly']} /></${PO.Field}>
            <${PO.Field} label="Pay period"><${Inp} v=${d.period} on=${(v) => set('period', v)} /></${PO.Field}>
            <${PO.Field} label="Pay day"><${PO.Select} value=${d.payDay} onChange=${(v) => set('payDay', v)} options=${['Last working day', '1st of next month', '7th of next month', 'Friday after period end', 'Thursday after period end']} /></${PO.Field}>
            <${PO.Field} label="Applies to"><${Inp} v=${`All ${P.people.length} people`} disabled /></${PO.Field}>
          </div>
        </${PO.Card}>
        <${PO.Card} title="Cutoffs" icon="Scissors" accent="amber" sub="Changes after these go to the next run">
          <div class="set-form">
            <${PO.Field} label="Attendance cutoff" hint=${PO.isIN() ? 'Day of the month' : 'After the period ends'}><${Inp} v=${d.cutoff} on=${(v) => set('cutoff', v)} /></${PO.Field}>
            <${PO.Field} label="Payroll lock" hint="Inputs freeze for review"><${Inp} v=${d.lock} on=${(v) => set('lock', v)} /></${PO.Field}>
            <div class="span-2"><${Row} t="Two-step approval before payment" s="Payroll prepares, HR and the owner approve"><${PO.Switch} on=${d.approve2} onChange=${(v) => set('approve2', v)} /></${Row}></div>
          </div>
        </${PO.Card}>
      <${PO.Card} flush title="Upcoming runs">
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Period</th><th>Attendance cutoff</th><th>Lock</th><th>Pay date</th><th>Status</th></tr></thead><tbody>
          ${upcoming.map((u, i) => html`<tr><td class="w-500">${u[0]}</td><td>${u[1]}</td><td>${u[2]}</td><td>${u[3]}</td><td><${PO.Status} s=${i === 0 ? 'In progress' : 'Scheduled'} /></td></tr>`)}
        </tbody></table></div>
      </${PO.Card}>
      <${PO.Card} title="Payment bank" icon="Banknote" accent="green" sub="Salaries are paid from this account" actions=${html`<${PO.Status} s="Verified" />`}>
        <div class="row gap-16" style="margin-bottom:16px"><${Logo} txt=${PO.isIN() ? 'HD' : PO.isUS() ? 'JP' : 'BA'} />
          <div class="grow"><b class="w-600">${d.bank}</b><div class="faint t-sm">Last payment file: ${last.label.replace('*', '')}, ${PO.money(last.net)} to ${PO.plural(last.heads, 'person', 'people')}</div></div>
          <${PO.Button} size="sm" onClick=${() => PO.fakeDownload(`${d.fmt} sample file`)}>Sample file</${PO.Button}></div>
        <div class="set-form">
          <${PO.Field} label="Bank"><${Inp} v=${d.bank} on=${(v) => set('bank', v)} /></${PO.Field}>
          <${PO.Field} label="Account number"><${Inp} mono v=${'•••• ' + d.acct.slice(-4)} disabled /></${PO.Field}>
          <${PO.Field} label=${PO.isIN() ? 'IFSC and branch' : PO.isUS() ? 'Routing' : 'Sort code'}><${Inp} v=${d.branch} on=${(v) => set('branch', v)} /></${PO.Field}>
          <${PO.Field} label="Payment file format"><${PO.Select} value=${d.fmt} onChange=${(v) => set('fmt', v)} options=${PO.isIN() ? ['HDFC bulk upload (XLSX)', 'ICICI CIB (TXT)', 'NEFT/RTGS (generic CSV)'] : PO.isUS() ? ['NACHA ACH (CCD+)', 'Positive pay (CSV)'] : ['Bacs Standard 18', 'Faster Payments (CSV)']} /></${PO.Field}>
        </div>
      </${PO.Card}>
      <${PO.Card} title="Payslips" icon="Banknote" accent="green">
        <${Row} t="Show year-to-date totals" s=${PO.isIN() ? 'Gross, PF and TDS year to date (April onwards)' : PO.isUS() ? 'YTD gross, taxes and 401(k) on every pay stub' : 'Taxable pay and tax to date for the tax year'}><${PO.Switch} on=${d.ytd} onChange=${(v) => set('ytd', v)} /></${Row}>
        ${PO.isIN() ? html`<${Row} t="Show CTC breakup" s="Employer PF and ESI listed under the payslip"><${PO.Switch} on=${d.ctc} onChange=${(v) => set('ctc', v)} /></${Row}>` : null}
        <${Row} t=${PO.isIN() ? 'Hold payout when bank details are missing' : 'Pay by paper check when there is no direct deposit'} s=${PO.isIN() ? 'The person is still processed; only the transfer waits' : 'A printed check is ready on payday'}><${PO.Switch} on=${PO.isIN() ? d.holdNoBank : !d.holdNoBank} onChange=${(v) => set('holdNoBank', PO.isIN() ? v : !v)} /></${Row}>
        <${Row} t="Send payslips on ${P.msg.channel}" s=${`Employees get a message with net pay and a link when payroll is approved`}><${PO.Switch} on=${d.msg !== false} onChange=${(v) => set('msg', v)} /></${Row}>
      </${PO.Card}>
      <${SaveBar} draft=${draft} />`;
  }

  /* ---------- integrations ---------- */
  function INTEGRATIONS(P) {
    const c = P.id;
    const all = [
      ['tally', 'Tally Prime', 'TP', 210, 'Accounting', 'Post payroll journals and statutory liabilities to Tally ledgers.', ['Payroll journal by cost centre', 'PF, ESI and PT liabilities', 'Expense reimbursements'], c === 'in', ['in']],
      ['qbo', 'QuickBooks Online', 'QB', 140, 'Accounting', 'Sync payroll journals, tax liabilities and reimbursements to QuickBooks.', ['Payroll journal by class', 'Tax liabilities', 'Reimbursements as bills'], c === 'us'],
      ['xero', 'Xero', 'X', 195, 'Accounting', 'Post pay runs and HMRC liabilities to Xero with tracking categories.', ['Pay run journal', 'PAYE and NI liability', 'Pension liability'], c === 'uk'],
      ['hdfc', 'HDFC Bank', 'HD', 220, 'Banking', 'Pay salaries straight from your HDFC current account with maker-checker approval.', ['Bulk salary transfers', 'Payment status back to People OS', 'Bank account verification (penny drop)'], c === 'in', ['in']],
      ['chase', 'Chase', 'CH', 212, 'Banking', 'Send ACH payroll files to Chase and get settlement status back.', ['NACHA ACH files', 'Settlement status', 'Positive pay'], c === 'us', ['us']],
      ['barclays', 'Barclays', 'BA', 196, 'Banking', 'Submit Bacs payment files and confirm salaries landed.', ['Bacs payment files', 'Payment confirmation', 'Bank detail validation'], c === 'uk', ['uk']],
      ['wa', 'WhatsApp Business', 'WA', 142, 'Messaging', 'Send shift reminders, payslip-ready alerts and approval updates as WhatsApp messages. Notifications only; requests stay in the employee portal.', ['Shift reminders and cover requests', 'Payslip ready alerts', 'Leave and approval updates'], c !== 'us'],
      ['twilio', 'SMS (Twilio)', 'SM', 350, 'Messaging', 'Text-message notifications and one-time sign-in codes for the employee portal.', ['Shift reminders', 'Payslip ready alerts', 'Portal sign-in codes'], c === 'us'],
      ['slack', 'Slack', 'SL', 300, 'Productivity', 'Approval requests and daily attendance digests in Slack channels.', ['Approvals in DMs', 'Daily no-show digest', 'New joiner announcements'], true],
      ['google', 'Google Workspace', 'G', 4, 'Productivity', 'Single sign-on, calendar sync for leave, and accounts for new joiners.', ['SSO', 'Leave on calendars', 'Create and suspend accounts'], c !== 'uk'],
      ['ms365', 'Microsoft 365', 'MS', 205, 'Productivity', 'Entra ID sign-in, Outlook calendar sync and Teams approvals.', ['Entra ID SSO', 'Outlook calendars', 'Teams approvals'], c === 'uk'],
      ['essl', 'eSSL / ZKTeco biometric', 'ZK', 28, 'Time clocks', 'Pull punches from fingerprint and face devices at your sites every 5 minutes.', ['Punches every 5 minutes', 'Device health', 'Enrol new joiners remotely'], c === 'in'],
      ['apna', 'Apna', 'AP', 265, 'Hiring', 'Post openings to Apna and pull applicants into the hiring pipeline.', ['Job posts', 'Applicants and resumes', 'Interview scheduling'], c === 'in', ['in']],
      ['indeed', 'Indeed', 'IN', 228, 'Hiring', 'Post jobs to Indeed and sync applicants both ways.', ['Job posts', 'Applicants', 'Disposition sync'], c !== 'in'],
      ['digilocker', 'DigiLocker', 'DL', 235, 'Verification', 'Collect verified Aadhaar, PAN and education documents with consent.', ['Aadhaar e-KYC', 'PAN verification', 'Education certificates'], c === 'in', ['in']],
      ['checkr', 'Checkr', 'CK', 160, 'Verification', 'Background checks and MVR checks for drivers, ordered from the hiring pipeline.', ['Background checks', 'Motor vehicle records', 'Adjudication status'], false, ['us']],
      ['zapier', 'Zapier', 'Z', 18, 'Automation', 'Connect People OS events to 6,000+ apps without code.', ['New employee', 'Leave approved', 'Payroll approved'], false],
    ];
    return all.filter((x) => !x[8] || x[8].includes(c)).map(([key, name, ini, hue, cat, desc, syncs, on]) => ({ key, name, ini, hue, cat, desc, syncs, on }));
  }
  function Integrations() {
    const P = PO.P();
    const list = useMemo(() => INTEGRATIONS(P), [P.id]);
    const [on, setOn] = PO.useCoState('settings.integrations', Object.fromEntries(list.map((i) => [i.key, i.on])));
    const [tab, setTab] = useState((location.hash.match(/[?&]tab=(\w+)/) || [])[1] || 'apps');
    const [cat, setCat] = useState('All');
    const [open, setOpen] = useState(null);
    const [busy, setBusy] = useState(false);
    const cats = ['All', ...new Set(list.map((i) => i.cat))];
    const shown = list.filter((i) => cat === 'All' || i.cat === cat);
    const n = list.filter((i) => on[i.key]).length;
    const toggle = (it) => {
      if (on[it.key]) { setOn({ ...on, [it.key]: false }); PO.toast(`${it.name} disconnected`, { action: { label: 'Undo', run: () => setOn((x) => ({ ...x, [it.key]: true })) } }); setOpen(null); return; }
      setBusy(true); setTimeout(() => { setBusy(false); setOn((x) => ({ ...x, [it.key]: true })); PO.toast(`${it.name} connected`, { icon: 'Plug' }); }, 900);
    };
    return html`<${Head} title="Integrations & API" sub=${`${n} of ${list.length} apps connected, plus API keys, webhooks and MCP for your own tools.`} actions=${html`<${PO.Button} icon="BookOpen" onClick=${() => PO.toast('API reference opened in a new tab', { icon: 'ExternalLink' })}>API docs</${PO.Button}>`} />
      <${PO.Tabs} tabs=${[['apps', 'Apps', list.length], ['keys', 'API keys'], ['hooks', 'Webhooks'], ['mcp', 'MCP server']]} value=${tab} onChange=${setTab} />
      ${tab === 'apps' ? html`
        <${PO.Card} flush title=${cat === 'All' ? 'Apps' : cat} sub=${`${n} connected`} actions=${html`<${PO.Select} width=${160} value=${cat} onChange=${setCat} options=${cats.map((c) => [c, c === 'All' ? 'All categories' : c])} />`}>
          <div class="list">${shown.map((it) => html`<div class="list-item">
            <${Logo} txt=${it.ini} hue=${it.hue} />
            <div class="grow" style="min-width:0"><b class="w-550">${it.name}</b> <span class="faint t-sm">${it.cat}${on[it.key] ? `, synced ${PO.seeded(it.key + P.id).int(2, 55)} min ago` : ''}</span><div class="faint t-sm ellipsis">${it.desc}</div></div>
            <span style="flex:none;width:110px">${on[it.key] ? html`<${PO.Status} s="Connected" />` : html`<span class="faint t-sm">Not connected</span>`}</span>
            <${PO.Button} size="sm" onClick=${() => setOpen(it)}>${on[it.key] ? 'Manage' : 'Connect'}</${PO.Button}>
          </div>`)}</div>
        </${PO.Card}>` : null}
      ${tab === 'keys' ? html`<${ApiKeys} />` : null}
      ${tab === 'hooks' ? html`<${Webhooks} />` : null}
      ${tab === 'mcp' ? html`<${Mcp} />` : null}
      <${PO.Drawer} open=${!!open} title=${open && open.name} sub=${open && open.cat} onClose=${() => setOpen(null)} footer=${open ? html`${on[open.key] ? html`<${PO.Button} kind="danger" icon="Unplug" onClick=${() => toggle(open)}>Disconnect</${PO.Button}><${PO.Button} icon="RefreshCw" onClick=${() => PO.toast(`${open.name}: sync started`)}>Sync now</${PO.Button}><${PO.Button} kind="primary" onClick=${() => { PO.toast('Saved'); setOpen(null); }}>Done</${PO.Button}>` : html`<${PO.Button} onClick=${() => setOpen(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" icon=${busy ? 'Loader' : 'Plug'} disabled=${busy} onClick=${() => toggle(open)}>${busy ? 'Connecting…' : `Connect ${open.name}`}</${PO.Button}>`}` : null}>
        ${open ? html`<div class="col gap-16">
          <div class="row gap-16"><${Logo} txt=${open.ini} hue=${open.hue} size="lg" /><div class="grow"><b class="t-lg w-600">${open.name}</b><div class="muted mt-4">${open.desc}</div></div></div>
          ${on[open.key] ? html`<div class="row t-sm"><${PO.Status} s="Connected" /><span class="faint">by ${PO.person(P.hrId).name}, last sync ${PO.seeded(open.key + P.id).int(2, 55)} min ago, no errors</span></div>` : html`<p class="faint t-sm">People OS only reads and writes the data listed below. Disconnecting revokes the token immediately.</p>`}
          <div><div class="w-600" style="margin-bottom:8px">What syncs</div><${PO.Checklist} items=${open.syncs.map((s) => ({ t: s, done: true }))} /></div>
          ${on[open.key] ? html`<div class="card inset" style="padding:4px 14px 14px">
            <${Row} t="Sync frequency"><${PO.Select} width=${150} value="Every 15 minutes" onChange=${() => PO.toast('Saved')} options=${['Every 5 minutes', 'Every 15 minutes', 'Hourly', 'Daily at 02:00']} /></${Row}>
            <${Row} t="Email me if a sync fails"><${PO.Switch} on=${true} onChange=${() => PO.toast('Saved')} /></${Row}>
          </div>` : null}
        </div>` : null}
      </${PO.Drawer}>`;
  }
  function ApiKeys() {
    const P = PO.P();
    const acct = INTEGRATIONS(P).find((i) => i.cat === 'Accounting').name;
    const [keys, setKeys] = PO.useCoState('settings.apikeys', [
      { id: 'k1', name: `${acct} sync`, prefix: 'pos_live_8Kq2', created: '2026-04-02', last: 'Today, 05:40', scopes: 'payroll:read' },
      { id: 'k2', name: 'Client site dashboard', prefix: 'pos_live_tR7m', created: '2026-06-18', last: 'Yesterday', scopes: 'attendance:read' },
      { id: 'k3', name: 'Zapier', prefix: 'pos_live_Zp41', created: '2026-08-30', last: '3 days ago', scopes: 'people:read, leave:read' },
    ]);
    const [mk, setMk] = useState(null);
    const [shown, setShown] = useState(null);
    const create = () => { const tail = Math.random().toString(36).slice(2, 6); const full = `pos_live_${tail}${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 10)}`; setKeys([{ id: 'k' + Date.now(), name: mk.name || 'Untitled key', prefix: 'pos_live_' + tail, created: PO.TODAY, last: 'Never', scopes: mk.scopes.join(', ') || 'people:read' }, ...keys]); setShown(full); setMk(null); };
    return html`<${PO.Card} flush title="API keys" sub="Keys act as the company, not a person. Treat them like passwords." actions=${html`<${PO.Button} size="sm" icon="Plus" onClick=${() => setMk({ name: '', scopes: ['people:read'] })}>Create key</${PO.Button}>`}>
        ${shown ? html`<div style="padding:14px 16px;border-bottom:1px solid var(--border)"><${PO.Callout} tone="amber" icon="KeyRound" title="Copy this key now. You won’t see it again." action=${html`<${PO.Button} size="sm" icon="Copy" onClick=${() => { try { navigator.clipboard.writeText(shown); } catch (e) {} PO.toast('Key copied'); setShown(null); }}>Copy and close</${PO.Button}>`}><span class="mono">${shown}</span></${PO.Callout}></div>` : null}
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Key</th><th>Scopes</th><th>Created</th><th>Last used</th><th></th></tr></thead><tbody>
          ${keys.map((k) => html`<tr><td class="w-500">${k.name}</td><td class="mono">${k.prefix}••••••••</td><td class="muted">${k.scopes}</td><td>${PO.date(k.created, { short: true })}</td><td class="muted">${k.last}</td><td class="r"><${PO.Button} size="sm" kind="ghost" onClick=${() => { setKeys(keys.filter((x) => x.id !== k.id)); PO.toast(`${k.name} key revoked`, { action: { label: 'Undo', run: () => setKeys(keys) } }); }}>Revoke</${PO.Button}></td></tr>`)}
        </tbody></table></div>
        ${!keys.length ? html`<${PO.Empty} icon="KeyRound" title="No API keys" text="Create a key to connect your own tools to People OS." />` : null}
      </${PO.Card}>
      <${PO.Modal} open=${!!mk} title="Create API key" icon="KeyRound" onClose=${() => setMk(null)} footer=${html`<${PO.Button} onClick=${() => setMk(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" onClick=${create}>Create key</${PO.Button}>`}>
        ${mk ? html`<div class="col gap-16"><${PO.Field} label="Name"><${Inp} v=${mk.name} ph="e.g. Power BI refresh" on=${(v) => setMk({ ...mk, name: v })} /></${PO.Field}>
          <${PO.Field} label="Scopes"><div class="col" style="gap:6px">${['people:read', 'attendance:read', 'leave:read', 'leave:write', 'payroll:read', 'reports:read'].map((s) => html`<label class="row t-sm" style="cursor:pointer"><input type="checkbox" checked=${mk.scopes.includes(s)} onChange=${() => setMk({ ...mk, scopes: mk.scopes.includes(s) ? mk.scopes.filter((x) => x !== s) : [...mk.scopes, s] })} /><span class="mono">${s}</span></label>`)}</div></${PO.Field}></div>` : null}
      </${PO.Modal}>`;
  }
  const EVENTS = ['employee.created', 'employee.updated', 'employee.exited', 'leave.requested', 'leave.approved', 'attendance.missed_punch', 'payroll.approved', 'payslip.published', 'expense.approved'];
  function Webhooks() {
    const [hooks, setHooks] = PO.useCoState('settings.webhooks', [
      { id: 'h1', url: 'https://hooks.zapier.com/hooks/catch/1184392/b7xq2/', events: ['employee.created', 'leave.approved'], on: true, last: '200 OK, 4 min ago' },
      { id: 'h2', url: 'https://ops.internal/api/peopleos/attendance', events: ['attendance.missed_punch'], on: true, last: '200 OK, 31 min ago' },
      { id: 'h3', url: 'https://erp.internal/webhooks/payroll', events: ['payroll.approved', 'payslip.published'], on: false, last: '503, 2 days ago' },
    ]);
    const [add, setAdd] = useState(null);
    return html`<${PO.Card} flush title="Webhooks" sub="People OS POSTs a signed JSON payload to each endpoint" actions=${html`<${PO.Button} size="sm" icon="Plus" onClick=${() => setAdd({ url: '', events: ['employee.created'] })}>Add endpoint</${PO.Button}>`}>
        <div class="list">${hooks.map((h) => html`<div class="list-item">
          <div class="grow" style="min-width:0"><div class="mono ellipsis">${h.url}</div><div class="row mt-4 wrap" style="gap:4px">${h.events.map((e) => html`<span class="tag mono" style="font-size:11px">${e}</span>`)}</div></div>
          <span class=${'t-sm ' + (/^2/.test(h.last) ? 'faint' : '')} style=${/^2/.test(h.last) ? '' : 'color:var(--red)'}>${h.last}</span>
          <${PO.Switch} on=${h.on} onChange=${(v) => { setHooks(hooks.map((x) => (x.id === h.id ? { ...x, on: v } : x))); PO.toast(v ? 'Endpoint enabled' : 'Endpoint paused'); }} />
          <${PO.Menu} align="right" trigger=${html`<${PO.IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: 'Send test event', icon: 'Send', onClick: () => PO.toast('Test event sent, 200 OK in 182 ms') }, { label: 'Copy signing secret', icon: 'Copy', onClick: () => PO.toast('Signing secret copied') }, '-', { label: 'Delete', icon: 'Trash2', danger: true, onClick: () => { setHooks(hooks.filter((x) => x.id !== h.id)); PO.toast('Endpoint deleted', { action: { label: 'Undo', run: () => setHooks(hooks) } }); } }]} />
        </div>`)}</div>
      </${PO.Card}>
      <${PO.Drawer} open=${!!add} size="sm" title="Add webhook endpoint" onClose=${() => setAdd(null)} footer=${html`<${PO.Button} onClick=${() => setAdd(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" disabled=${!(add && /^https:\/\//.test(add.url))} onClick=${() => { setHooks([...hooks, { id: 'h' + Date.now(), url: add.url, events: add.events, on: true, last: 'No deliveries yet' }]); PO.toast('Endpoint added'); setAdd(null); }}>Add endpoint</${PO.Button}>`}>
        ${add ? html`<div class="col gap-16"><${PO.Field} label="Endpoint URL" hint="Must be HTTPS"><${Inp} v=${add.url} ph="https://" on=${(v) => setAdd({ ...add, url: v })} /></${PO.Field}>
          <${PO.Field} label="Events"><div class="col" style="gap:6px">${EVENTS.map((s) => html`<label class="row t-sm" style="cursor:pointer"><input type="checkbox" checked=${add.events.includes(s)} onChange=${() => setAdd({ ...add, events: add.events.includes(s) ? add.events.filter((x) => x !== s) : [...add.events, s] })} /><span class="mono">${s}</span></label>`)}</div></${PO.Field}></div>` : null}
      </${PO.Drawer}>`;
  }
  function Mcp() {
    const P = PO.P();
    const [on, setOn] = PO.useCoState('settings.mcp', true);
    const [write, setWrite] = PO.useCoState('settings.mcp.write', false);
    const url = `https://mcp.peopleos.app/${P.company.short.toLowerCase().replace(/[^a-z]+/g, '-')}/sse`;
    const cfg = `{\n  "mcpServers": {\n    "people-os": {\n      "url": "${url}",\n      "headers": { "Authorization": "Bearer pos_live_••••••••" }\n    }\n  }\n}`;
    const tools = [['search_people', 'Find employees by name, site, role or status', 'read'], ['get_attendance', 'Muster, late arrivals and missed punches for a period', 'read'], ['get_leave_balance', `${leaveWord()} balances and pending requests`, 'read'], ['get_payroll_summary', 'Totals, statutory dues and the draft run', 'read'], ['list_compliance_flags', 'Open rule flags and filings due', 'read'], ['request_leave', `Create a ${leaveWord().toLowerCase()} request on someone’s behalf`, 'write'], ['approve_request', 'Approve or reject an item in the inbox', 'write'], ['find_shift_cover', 'Rank people free to cover a shift', 'read']];
    return html`<div class="col gap-16">
      <${PO.Card} title="People OS MCP server" icon="Users" accent="blue" sub="For Claude, ChatGPT or your own agents" actions=${html`<${PO.Switch} on=${on} onChange=${(v) => { setOn(v); PO.toast(v ? 'MCP server enabled' : 'MCP server disabled'); }} />`}>
        <div class="col gap-12">
          <${PO.Field} label="Server URL"><div class="row"><input class="input mono" value=${url} readonly /><${PO.Button} icon="Copy" onClick=${() => { try { navigator.clipboard.writeText(url); } catch (e) {} PO.toast('URL copied'); }}>Copy</${PO.Button}></div></${PO.Field}>
          <div><div class="row" style="margin-bottom:6px"><b class="w-600">Client config</b><${PO.Button} size="sm" kind="ghost" icon="Copy" cls="right" onClick=${() => { try { navigator.clipboard.writeText(cfg); } catch (e) {} PO.toast('Config copied'); }}>Copy config</${PO.Button}></div><pre class="set-code">${cfg}</pre></div>
          <${Row} t="Allow write tools" s="Agents can create requests and approve items. Every action waits for a human tap and is logged."><${PO.Switch} on=${write} onChange=${(v) => { setWrite(v); PO.toast('Saved'); }} /></${Row}>
        </div>
      </${PO.Card}>
      <${PO.Card} flush title="Tools exposed" sub=${`${tools.filter((t) => write || t[2] === 'read').length} of ${tools.length}`}>
        <div class="list">${tools.map(([n, d, k]) => html`<div class="list-item" style=${!write && k === 'write' ? 'opacity:.5' : ''}><div class="grow" style="min-width:0"><div class="mono w-500">${n}</div><div class="faint t-sm ellipsis">${d}</div></div><span class=${'t-sm ' + (k === 'write' ? 'w-550' : 'faint')}>${k}</span></div>`)}</div>
      </${PO.Card}>
    </div>`;
  }

  /* ---------- notifications ---------- */
  const CH = [['email', 'Email', 'Mail'], ['wa', 'WhatsApp', 'MessageCircle'], ['sms', 'SMS', 'MessageSquareText'], ['app', 'Portal', 'Bell']];
  function notifEvents() {
    const lw = leaveWord();
    return [
      ['Time', `${lw} requested`, 'admin manager'], ['Time', `${lw} approved or rejected`, 'employee'], ['Time', 'Missed punch', 'admin manager employee'], ['Time', 'Late arrival (over 10 min)', 'manager'], ['Time', 'No-show on shift', 'admin manager'], ['Time', 'Open shift needs cover', 'manager employee'],
      ['Pay', 'Payroll ready for review', 'admin'], ['Pay', 'Payslip published', 'employee'], ['Pay', 'Expense submitted', 'admin manager'], ['Pay', 'Expense reimbursed', 'employee'],
      ['Compliance', 'Compliance flag raised', 'admin'], ['Compliance', 'Filing due in 3 days', 'admin'], ['Compliance', 'Contractor proof missing', 'admin'], ['Compliance', 'Document expiring', 'admin employee'],
      ['People', 'New joiner starts', 'admin manager'], ['People', PO.isIN() ? 'Exit: F&F due' : 'Exit: final pay due', 'admin'], ['People', 'Birthday or work anniversary', 'manager'], ['People', 'Helpdesk ticket update', 'admin employee'],
    ];
  }
  function Notifications() {
    const P = PO.P();
    const [aud, setAud] = useState('admin');
    const events = notifEvents();
    const def = (a, e, ch, i) => { const ev = events[i]; if (!ev[2].includes(a)) return ch === 'app' ? false : false; if (ch === 'app') return true; if (ch === 'email') return a !== 'employee' || /Payslip|expiring/i.test(e); if (ch === 'wa') return a === 'employee' || /No-show|cover|Missed/.test(e); if (ch === 'sms') return /No-show/.test(e); return false; };
    const init = useMemo(() => { const m = {}; ['admin', 'manager', 'employee'].forEach((a) => events.forEach(([, e], i) => CH.forEach(([ch]) => (m[`${a}|${e}|${ch}`] = def(a, e, ch, i))))); return m; }, [P.id]);
    const draft = useDraft('settings.notif', { m: init, quiet: true, digest: '08:00' });
    const { d } = draft;
    const tog = (k) => draft.setAll({ ...d, m: { ...d.m, [k]: !d.m[k] } });
    let lastGroup = '';
    const relevant = (ev) => ev[2].includes(aud);
    return html`<${Head} title="Notifications" sub=${`${Object.values(d.m).filter(Boolean).length} rules on across ${events.length} events and ${CH.length} channels.`} />
      <div class="row"><${PO.Segmented} options=${[['admin', 'HR & admins'], ['manager', 'Managers & supervisors'], ['employee', 'Employees']]} value=${aud} onChange=${setAud} /><span class="faint t-sm right">${aud === 'employee' ? `${P.people.length} people` : aud === 'manager' ? `${Object.keys(P.byManager).length} people` : '2 people'}, ${Object.keys(d.m).filter((k) => k.startsWith(aud + '|') && d.m[k]).length} rules on</span></div>
      <${PO.Card} flush>
        <div class="table-wrap"><table class="tbl set-matrix"><thead><tr><th>Event</th>${CH.map(([, l, ic]) => html`<th style="width:96px">${l}</th>`)}</tr></thead><tbody>
          ${events.map((ev) => { const [g, e] = ev; const head = g !== lastGroup ? html`<tr><td colspan="5" class="faint t-sm w-600" style="background:var(--surface-2)">${g}</td></tr>` : null; lastGroup = g; const rel = relevant(ev); return html`${head}<tr><td><span class=${rel ? 'w-500' : 'faint'}>${e}</span>${rel ? null : html` <span class="faint t-xs">not sent to this group</span>`}</td>${CH.map(([ch]) => { const k = `${aud}|${e}|${ch}`; return html`<td><label class="check" style="justify-content:center;display:inline-flex"><input type="checkbox" disabled=${!rel} checked=${!!d.m[k]} onChange=${() => tog(k)} /></label></td>`; })}</tr>`; })}
        </tbody></table></div>
      </${PO.Card}>
      <${PO.Card} title="Delivery" icon="Send" accent="violet">
        <${Row} t="Quiet hours" s="No WhatsApp or SMS between 22:00 and 07:00 except no-shows and shift cover"><${PO.Switch} on=${d.quiet} onChange=${(v) => draft.setAll({ ...d, quiet: v })} /></${Row}>
        <${Row} t="Daily digest for managers" s="One message with approvals waiting, late arrivals and no-shows"><${PO.Select} width=${110} value=${d.digest} onChange=${(v) => draft.setAll({ ...d, digest: v })} options=${['07:00', '08:00', '09:00', 'Off']} /></${Row}>
        <${Row} t="Link back to the portal" s="Every email, SMS and WhatsApp message ends with a link to the right page in the employee portal"><${PO.Switch} on=${d.link !== false} onChange=${(v) => draft.setAll({ ...d, link: v })} /></${Row}>
      </${PO.Card}>
      <${SaveBar} draft=${draft} label="Notification preferences saved" />`;
  }

  /* ---------- security ---------- */
  function Security() {
    const P = PO.P();
    const hr = PO.person(P.hrId), top = PO.person(P.topId);
    const city = P.company.city;
    const init = { sso: true, ssoProvider: PO.isUK() ? 'Microsoft Entra ID' : 'Google Workspace', ssoEnforce: true, twofa: 'admins', twofaMethod: 'Authenticator app', timeout: '12 hours', ipOn: false, ips: PO.isIN() ? ['103.21.164.0/24, Head office, Wakad', '49.248.12.18, Hinjewadi site office'] : PO.isUS() ? ['98.97.112.0/24, Central kitchen', '72.182.40.19, South Lamar office'] : ['82.68.140.0/24, Trafford depot', '195.194.21.7, Airport T2 office'], retainEx: PO.isIN() ? '8 years' : PO.isUS() ? '4 years' : '6 years', retainPhotos: '90 days', retainAudit: '7 years', retainCand: '12 months' };
    const draft = useDraft('settings.security', init);
    const { d, set } = draft;
    const [ip, setIp] = useState('');
    const [sessions, setSessions] = PO.useCoState('settings.sessions', [
      { id: 's1', who: hr.id, dev: 'MacBook Pro, Chrome 129', where: city, ip: '10.0.4.18', at: 'Active now', current: true },
      { id: 's2', who: hr.id, dev: 'iPhone 15, Safari (HR admin portal)', where: city, ip: '10.0.7.112', at: '2 h ago' },
      { id: 's3', who: top.id, dev: 'Windows 11, Edge 129', where: city, ip: '10.0.2.41', at: 'Yesterday' },
      { id: 's4', who: top.id, dev: 'iPad Air, Safari', where: PO.isIN() ? 'Mumbai' : PO.isUS() ? 'Dallas' : 'London', ip: '10.0.9.230', at: '3 days ago' },
    ]);
    return html`<${Head} title="Security" sub=${`SSO is ${d.sso ? 'on with ' + d.ssoProvider : 'off'} and two-factor is required for ${d.twofa === 'admins' ? 'admins' : d.twofa === 'managers' ? 'admins and managers' : 'everyone'}. ${PO.plural(sessions.length, 'active session')}.`} />
      <${PO.KpiStrip} items=${[
          { label: 'Admins with 2FA', icon: 'ShieldCheck', accent: 'green', value: '2 / 2', sub: '100%' },
          { label: 'Employees signed in to the portal', icon: 'Users', accent: 'blue', value: PO.pct(0.94), sub: 'most with phone number + one-time code' },
          { label: 'Active sessions', icon: 'MonitorSmartphone', accent: 'blue', value: sessions.length, sub: 'admin and owner' },
          { label: 'Failed sign-ins (7 days)', icon: 'ShieldAlert', accent: 'amber', value: '3', sub: 'all from known devices' },
        ]} />
      <${PO.Card} title="Single sign-on" icon="KeyRound" accent="blue">
        <${Row} t="Sign in with your identity provider" s="Admins and managers use company accounts; frontline staff keep phone OTP"><${PO.Select} width=${190} value=${d.ssoProvider} onChange=${(v) => set('ssoProvider', v)} options=${['Google Workspace', 'Microsoft Entra ID', 'Okta (SAML)']} /><${PO.Switch} on=${d.sso} onChange=${(v) => set('sso', v)} /></${Row}>
        <${Row} t="Require SSO for admins" s="Password sign-in is turned off for Owner and HR admin roles"><${PO.Switch} on=${d.ssoEnforce} onChange=${(v) => set('ssoEnforce', v)} /></${Row}>
      </${PO.Card}>
      <${PO.Card} title="Two-factor authentication" icon="ShieldCheck" accent="green">
        <${Row} t="Require two-factor for"><${PO.Segmented} options=${[['admins', 'Admins'], ['managers', 'Admins & managers'], ['all', 'Everyone']]} value=${d.twofa} onChange=${(v) => set('twofa', v)} /></${Row}>
        <${Row} t="Method"><${PO.Select} width=${190} value=${d.twofaMethod} onChange=${(v) => set('twofaMethod', v)} options=${['Authenticator app', 'SMS code', 'Passkey']} /></${Row}>
        <${Row} t="Sign out after inactivity"><${PO.Select} width=${140} value=${d.timeout} onChange=${(v) => set('timeout', v)} options=${['1 hour', '4 hours', '12 hours', '7 days']} /></${Row}>
      </${PO.Card}>
      <${PO.Card} flush title="Active sessions" actions=${html`<${PO.Button} size="sm" kind="ghost" onClick=${() => { setSessions(sessions.filter((s) => s.current)); PO.toast('Signed out of all other sessions'); }}>Sign out all others</${PO.Button}>`}>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Device</th><th>Location</th><th>IP</th><th>Last active</th><th></th></tr></thead><tbody>
          ${sessions.map((s) => html`<tr><td><${PO.Who} id=${s.who} size="sm" /></td><td>${s.dev}</td><td>${s.where}</td><td class="mono">${s.ip}</td><td>${s.current ? html`<${PO.Badge} tone="green" dot>This device</${PO.Badge}>` : s.at}</td><td class="r">${s.current ? null : html`<${PO.Button} size="sm" kind="ghost" onClick=${() => { setSessions(sessions.filter((x) => x.id !== s.id)); PO.toast('Session revoked'); }}>Revoke</${PO.Button}>`}</td></tr>`)}
        </tbody></table></div>
      </${PO.Card}>
      <${PO.Card} title="IP allowlist" icon="Network" accent="violet" sub="Admin sign-in only from these networks" actions=${html`<${PO.Switch} on=${d.ipOn} onChange=${(v) => set('ipOn', v)} label=${d.ipOn ? 'Enforced' : 'Off'} />`}>
        <div class="col" style="gap:6px">${d.ips.map((x, i) => html`<div class="row" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="mono grow">${x.split(/, | · /)[0]}</span><span class="faint t-sm">${x.split(/, | · /).slice(1).join(', ')}</span><${PO.IconButton} icon="X" size="sm" title="Remove" onClick=${() => set('ips', d.ips.filter((_, j) => j !== i))} /></div>`)}</div>
        <div class="row mt-12"><${Inp} v=${ip} ph="e.g. 203.0.113.0/24, Branch office" on=${setIp} /><${PO.Button} icon="Plus" disabled=${!ip.trim()} onClick=${() => { set('ips', [...d.ips, ip.trim()]); setIp(''); }}>Add</${PO.Button}></div>
      </${PO.Card}>
      <${PO.Card} title="Data retention" icon="Archive" accent="teal" sub=${PO.isIN() ? 'Defaults follow the Labour Codes and DPDP Act' : PO.isUS() ? 'Defaults follow FLSA, IRS and I-9 rules' : 'Defaults follow HMRC and UK GDPR guidance'}>
        <${Row} t="Former employees’ records" s="Payroll, contracts and statutory registers"><${PO.Select} width=${140} value=${d.retainEx} onChange=${(v) => set('retainEx', v)} options=${['3 years', '4 years', '6 years', '8 years', '10 years']} /></${Row}>
        <${Row} t="Clock-in locations and QR scans"><${PO.Select} width=${140} value=${d.retainPhotos} onChange=${(v) => set('retainPhotos', v)} options=${['30 days', '90 days', '1 year']} /></${Row}>
        <${Row} t="Unsuccessful candidates"><${PO.Select} width=${140} value=${d.retainCand} onChange=${(v) => set('retainCand', v)} options=${['6 months', '12 months', '24 months']} /></${Row}>
        <${Row} t="Audit log"><${PO.Select} width=${140} value=${d.retainAudit} onChange=${(v) => set('retainAudit', v)} options=${['1 year', '3 years', '7 years', 'Forever']} /></${Row}>
      </${PO.Card}>
      <${SaveBar} draft=${draft} label="Security settings saved" />`;
  }

  /* ---------- audit ---------- */
  function Audit() {
    const P = PO.P();
    const rows = P.audit;
    const actors = [...new Set(rows.map((r) => r.actor))];
    const verbs = [...new Set(rows.map((r) => r.action))];
    const week = rows.filter((r) => r.at.slice(0, 10) > PO.addDays(PO.TODAY, -7));
    const [open, setOpen] = useState(null);
    const actorP = (name) => P.people.find((p) => p.name === name);
    const ic = (a) => /leave/.test(a) ? 'Palmtree' : /bank/.test(a) ? 'Landmark' : /shift/.test(a) ? 'CalendarRange' : /attendance/.test(a) ? 'CalendarCheck2' : /document/.test(a) ? 'FileText' : /salary/.test(a) ? 'Wallet' : /asset/.test(a) ? 'Package' : /export/.test(a) ? 'Download' : /invite/.test(a) ? 'UserPlus' : 'Fingerprint';
    return html`<${Head} title="Audit log" sub=${`${rows.length} events by ${actors.length} actors in the last 10 days, kept for 7 years.`} actions=${html`<${PO.Button} icon="Download" onClick=${() => PO.exportCsv('audit-log', [['When', 'Actor', 'Action', 'Target', 'Via', 'IP'], ...rows.map((r) => [r.at, r.actor, r.action, r.target, r.via, r.ip])])}>Export</${PO.Button}>`} />
      <${PO.KpiStrip} items=${[
          { label: 'Events, last 7 days', icon: 'History', accent: 'blue', value: week.length, sub: `by ${actors.length} actors` },
          { label: 'By the assistant', icon: 'Bot', accent: 'violet', value: rows.filter((r) => r.actor === 'People OS assistant').length, sub: 'each approved by a person' },
          { label: 'Sensitive changes', icon: 'ShieldAlert', accent: 'amber', value: rows.filter((r) => /bank|salary/.test(r.action)).length, sub: 'bank and salary edits' },
          { label: 'Exports', icon: 'Download', accent: 'teal', value: rows.filter((r) => /export/.test(r.action)).length, sub: 'payroll registers' },
        ]} />
      <${PO.DataTable} rows=${rows} exportName="audit-log" onRow=${setOpen} search=${(r) => `${r.actor} ${r.action} ${r.target} ${r.ip}`} searchPlaceholder="Search the log"
        filters=${[{ key: 'actor', label: 'Actor', options: actors, test: (r, v) => r.actor === v }, { key: 'action', label: 'Action', options: verbs, test: (r, v) => r.action === v }, { key: 'via', label: 'Via', options: [...new Set(rows.map((r) => r.via))], test: (r, v) => r.via === v }]}
        initialSort=${{ key: 'at', dir: 'desc' }} columns=${[
          { key: 'at', label: 'When', render: (r) => html`<span class="tnum" style="white-space:nowrap">${PO.date(r.at, { short: true })} <span class="faint">${r.at.slice(11)}</span></span>`, width: 150 },
          { key: 'actor', label: 'Actor', render: (r) => actorP(r.actor) ? html`<${PO.Who} p=${actorP(r.actor)} size="sm" sub="" />` : html`<span class="row"><${PO.Avatar} name=${r.actor} size="sm" />${r.actor}</span>` },
          { key: 'action', label: 'Action', render: (r) => r.action[0].toUpperCase() + r.action.slice(1) },
          { key: 'target', label: 'Target', render: (r) => html`<span class="w-500">${r.target}</span>` },
          { key: 'via', label: 'Via', render: (r) => html`<span class="muted">${r.via}</span>` },
          { key: 'ip', label: 'IP address', render: (r) => html`<span class="mono faint">${r.ip}</span>` },
        ]} pageSize=${15} />
      <${PO.Drawer} open=${!!open} title=${open && open.id} sub=${open && `${PO.date(open.at)}, ${open.at.slice(11)}`} onClose=${() => setOpen(null)} footer=${html`<${PO.Button} icon="Copy" onClick=${() => PO.toast('Event JSON copied')}>Copy JSON</${PO.Button}>`}>
        ${open ? html`<div class="col gap-16"><${PO.KV} items=${[['Actor', open.actor], ['Action', open.action], ['Target', open.target], ['Channel', open.via], ['IP address', open.ip], ['Device', open.via === 'Mobile' || open.via === 'WhatsApp' ? 'Chrome 129 on Android (employee portal)' : 'Chrome 129 on macOS'], ['Approved by', open.actor === 'People OS assistant' ? PO.person(P.hrId).name : '—']]} />
          <div><div class="w-600" style="margin-bottom:6px">Change</div><pre class="set-code">${JSON.stringify({ event: open.action.replace(/ /g, '_'), target: open.target, at: open.at.replace(' ', 'T') + ':00', actor: open.actor, ip: open.ip }, null, 2)}</pre></div></div>` : null}
      </${PO.Drawer}>`;
  }

  /* ---------- import: switch in a day ---------- */
  function importSetup(P) {
    const r = PO.seeded('imp' + P.id);
    const pool = P.people.filter((p) => !p.joiner && p.role !== 'office');
    const issues = PO.isIN()
      ? ['Basic is 38% of gross in the old file; the Code on Wages needs 50%', 'HRA is higher than basic; check before restructuring', '“Washing allow.” has no matching component']
      : PO.isUS() ? ['Two pay rates on one row ($14.50 and $15.00)', 'Tip credit applied in the old system, not configured here', '401(k) deferral % missing from the register']
        : ['Tax code 0T in the file; HMRC record says 1257L', 'Pension opt-out date not in the register', 'Hourly rate below the National Living Wage in the old file'];
    const look = r.shuffle(pool).slice(0, 3).map((p, i) => ({ p, issue: issues[i], delta: (PO.isUK() ? [-1, 1, -1] : [1, -1, 1])[i] * r.int(PO.isIN() ? 400 : 12, PO.isIN() ? 1800 : 60) }));
    const rounding = r.shuffle(pool.filter((p) => !look.some((l) => l.p.id === p.id))).slice(0, 6).map((p) => ({ p, issue: PO.isIN() ? 'ESI rounded up in People OS (ESIC rule)' : 'Rounding to the cent on overtime', delta: PO.isIN() ? r.int(1, 2) : -r.int(1, 3) / 100 }));
    const cols = PO.isIN()
      ? [['Emp Code', 'Employee ID'], ['Employee Name', 'Full name'], ['UAN No', 'UAN'], ['ESIC IP No', 'ESI number'], ['Days Paid', 'Paid days'], ['Basic', 'Basic'], ['HRA', 'House rent allowance'], ['Spl Allow', 'Special allowance'], ['OT Amt', 'Overtime'], ['Washing Allow.', null], ['PF (Emp)', 'Provident fund'], ['ESIC (Emp)', 'ESI'], ['P.Tax', 'Professional tax'], ['Net Pay', 'Net pay']]
      : PO.isUS() ? [['Employee #', 'Employee ID'], ['Name', 'Full name'], ['SSN Last4', 'SSN (last 4)'], ['Pay Rate', 'Hourly rate'], ['Reg Hrs', 'Regular hours'], ['OT Hrs', 'Overtime hours'], ['CC Tips', 'Card tips'], ['Gross', 'Gross pay'], ['Fed WH', 'Federal income tax'], ['SS EE', 'Social Security'], ['Med EE', 'Medicare'], ['401k %', null], ['Net', 'Net pay']]
        : [['Works No', 'Employee ID'], ['Surname, Forename', 'Full name'], ['NI Number', 'NI number'], ['Tax Code', 'Tax code'], ['Rate', 'Hourly rate'], ['Basic Hrs', 'Basic hours'], ['Night Prem', 'Night premium'], ['Gross Pay', 'Gross pay'], ['PAYE', 'Income tax (PAYE)'], ['EE NI', 'National Insurance'], ['Pension EE', 'Pension'], ['Opt-out Date', null], ['Net Pay', 'Net pay']];
    return { look, rounding, cols };
  }
  function sampleFor(P, col, field) {
    const p = P.hero, pay = p.pay, dp = PO.isIN() ? 0 : 2;
    const line = (k) => { const x = [...pay.earn, ...pay.ded].find((y) => y.k === k); return x ? PO.num(x.amt, dp) : PO.num(0, dp); };
    const keyOf = { Basic: 'basic', 'House rent allowance': 'hra', 'Special allowance': 'special', Overtime: 'ot', 'Provident fund': 'epf', ESI: 'esi', 'Professional tax': 'pt', 'Card tips': 'tips', 'Federal income tax': 'fit', 'Social Security': 'ss', Medicare: 'med', 'Night premium': 'night', 'Income tax (PAYE)': 'tax', 'National Insurance': 'ni', Pension: 'pen' };
    if (!field) return /Washing/.test(col) ? '150' : /401k/.test(col) ? (p.k401 ? '4' : '') : '';
    if (keyOf[field]) return line(keyOf[field]);
    return ({ 'Employee ID': p.id, 'Full name': PO.isUK() ? `${p.last}, ${p.first}` : p.name, UAN: p.ids.uan, 'ESI number': p.ids.esic, 'SSN (last 4)': (p.ids.ssn || '').slice(-4), 'NI number': p.ids.ni, 'Tax code': p.ids.taxCode, 'Paid days': pay.work, 'Hourly rate': PO.num(P.roles[p.role].rate || 0, 2), 'Regular hours': p.u.reg, 'Basic hours': p.u.hours, 'Overtime hours': p.u.ot, 'Gross pay': PO.num(pay.gross, dp), 'Net pay': PO.num(pay.net, dp) })[field] ?? '';
  }
  function Import() {
    const P = PO.P();
    const S = useMemo(() => importSetup(P), [P.id]);
    const [st, setSt] = PO.useCoState('settings.import', { step: 0, files: {}, map: {}, resolved: {}, live: false });
    const up = (patch) => setSt({ ...st, ...patch });
    const [ask, confirmEl] = PO.useConfirm();
    const [all, setAll] = useState(false);
    const per = PO.isIN() ? 'Sep2026' : PO.isUS() ? '2026-09-20_to_10-04' : 'P07_2026-27';
    const oldSys = PO.isIN() ? 'Excel + Saral' : PO.isUS() ? 'Gusto export' : 'Sage 50 Payroll';
    const files = { payroll: [`Payroll_Register_${per}.xlsx`, `${P.people.length} rows, ${S.cols.length} columns, ${PO.isIN() ? '284' : PO.isUS() ? '96' : '118'} KB`], attendance: [`Attendance_${per}.xlsx`, `${P.people.length} rows, ${PO.isIN() ? '30 day columns, P/A/WO/L codes' : 'clock-in/out per shift'}`] };
    const unmapped = S.cols.filter(([c, f]) => !f && !st.map[c]).length;
    const nLeave = P.people.length * P.leaveTypes.filter((t) => t.quota != null).length;
    const resolvedN = S.look.filter((l) => st.resolved[l.p.id]).length;
    const diffs = [...S.look.map((l) => ({ ...l, kind: 'look' })), ...S.rounding.map((l) => ({ ...l, kind: 'round' }))];
    const totalOld = P.totals.net + diffs.reduce((t, x) => t + x.delta, 0);
    const rowsAll = all ? P.people.map((p) => diffs.find((x) => x.p.id === p.id) || { p, delta: 0, kind: 'match', issue: 'Matches to the ' + (PO.isIN() ? 'rupee' : 'cent') }) : diffs;
    const steps = [['Upload files', 'Payroll + attendance'], ['Map columns', `${S.cols.length} columns`], ['Review matches', `${P.people.length} people`], ['Parallel payroll', P.company.period], ['Go live', st.live ? 'Done' : 'Switch over']];
    return html`<${Head} title="Switch in a day" sub=${`Moving ${P.people.length} people from ${oldSys}. ${st.live ? 'Live since the import.' : `Step ${Math.min(st.step + 1, 5)} of 5.`}`} actions=${st.step > 0 && !st.live ? html`<${PO.Button} kind="ghost" icon="RotateCcw" onClick=${() => ask({ title: 'Start the import again?', body: 'Uploaded files and column mappings will be cleared. Nothing in People OS has changed yet.', confirm: 'Start again', danger: true, onConfirm: () => setSt({ step: 0, files: {}, map: {}, resolved: {}, live: false }) })}>Start again</${PO.Button}>` : null} />
      <${PO.Steps} steps=${steps} current=${st.live ? 5 : st.step} done=${st.live ? 5 : st.step} onPick=${(i) => i <= st.step && !st.live && up({ step: i })} />
      ${st.step === 0 ? html`<${PO.Card} title="1. Upload last ${PO.isIN() ? 'month' : 'period'}’s files" icon="FileText" accent="violet" sub="XLSX, XLS or CSV straight from your old system">
        <div class="grid g-2">${['payroll', 'attendance'].map((k) => { const f = st.files[k]; return html`<div class=${'set-drop ' + (f ? 'done' : '')} onClick=${() => !f && (up({ files: { ...st.files, [k]: true } }), PO.toast(`${files[k][0]} uploaded`, { icon: 'FileSpreadsheet' }))}>
          <${PO.Icon} n=${f ? 'FileCheck2' : 'Upload'} size=${20} style=${f ? 'color:var(--green)' : 'color:var(--text-3)'} />
          ${f ? html`<b class="w-600">${files[k][0]}</b><span class="muted t-sm">${files[k][1]}</span><button class="btn ghost sm" onClick=${(e) => { e.stopPropagation(); const nf = { ...st.files }; delete nf[k]; up({ files: nf }); }}>Remove</button>` : html`<b class="w-600">${k === 'payroll' ? 'Payroll register' : 'Attendance sheet'}</b><span class="muted t-sm">Drop the file here or click to browse</span><span class="faint t-xs">${k === 'payroll' ? 'One row per person with earnings, deductions and net pay' : 'Days or hours per person for the same period'}</span>`}
        </div>`; })}</div>
        <div class="row mt-16"><span class="faint t-sm"><${PO.Icon} n="Lock" size=${12} /> Files are encrypted and deleted after 30 days.</span><span class="right"><${PO.Button} kind="primary" disabled=${!(st.files.payroll && st.files.attendance)} onClick=${() => up({ step: 1 })}>Continue to mapping</${PO.Button}></span></div>
      </${PO.Card}>` : null}
      ${st.step === 1 ? html`<${PO.Card} flush title="2. Map columns" sub=${`${files.payroll[0]}, ${S.cols.length - S.cols.filter(([, f]) => !f).length} matched automatically`} actions=${unmapped ? html`<${PO.Badge} tone="amber" dot>${unmapped} needs a decision</${PO.Badge}>` : html`<${PO.Badge} tone="green" dot>All mapped</${PO.Badge}>`}>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Column in your file</th><th>Sample value</th><th></th><th>People OS field</th><th>Confidence</th></tr></thead><tbody>
          ${S.cols.map(([c, f], i) => { const v = st.map[c] || f; const sample = sampleFor(P, c, f);
            return html`<tr><td class="mono">${c}</td><td class="muted tnum">${sample || html`<span class="faint">blank</span>`}</td><td><${PO.Icon} n="ArrowRight" size=${14} cls="faint" /></td><td style="width:280px"><${PO.Select} value=${v || ''} onChange=${(x) => up({ map: { ...st.map, [c]: x } })} options=${[['', 'Choose a field…'], ...[...new Set(S.cols.map(([, x]) => x).filter(Boolean))].map((x) => [x, x]), ['__custom', 'Create a new earning'], ['__ignore', 'Ignore this column']]} /></td><td>${v ? html`<span class="tnum muted">${f ? (i % 4 === 3 ? '94%' : '100%') : 'You chose'}</span>` : html`<${PO.Badge} tone="amber" dot>Needs a decision</${PO.Badge}>`}</td></tr>`; })}
        </tbody></table></div>
        <div class="row" style="padding:12px 16px;border-top:1px solid var(--border)"><span class="faint t-sm">Attendance: ${files.attendance[1]} — mapped automatically</span><span class="right row"><${PO.Button} onClick=${() => up({ step: 0 })}>Back</${PO.Button}><${PO.Button} kind="primary" disabled=${unmapped > 0} onClick=${() => up({ step: 2 })}>Match employees</${PO.Button}></span></div>
      </${PO.Card}>` : null}
      ${st.step === 2 ? html`
        <div><div class="row gap-16"><div class="grow"><div class="t-lg w-600">${P.people.length} employees matched, 3 structures need a look</div><div class="muted mt-4">Matched on ${PO.isIN() ? 'employee code and UAN' : PO.isUS() ? 'employee number and SSN' : 'works number and NI number'}. Nobody in the file is missing from People OS, and nobody in People OS is missing from the file.</div></div></div></div>
        <${PO.KpiStrip} items=${[
          { label: 'Salary structures rebuilt', icon: 'LayoutTemplate', accent: 'green', value: P.people.length - 3, sub: '3 waiting on you' },
          { label: `${leaveWord()} balances imported`, icon: 'Palmtree', accent: 'teal', value: PO.num(nLeave), sub: `${P.leaveTypes.filter((t) => t.quota != null).length} types per person` },
          { label: 'Year-to-date figures', icon: 'CalendarRange', accent: 'blue', value: PO.num(P.people.length * (PO.isIN() ? 6 : PO.isUS() ? 9 : 5)), sub: PO.isIN() ? 'Gross, PF, ESI, PT, TDS since April' : PO.isUS() ? 'Wages and taxes since Jan 1' : 'Pay and tax since 6 April' },
          { label: 'Attendance days', icon: 'Clock', accent: 'blue', value: PO.num(P.people.reduce((t, p) => t + (PO.isIN() ? p.u.days : 1), 0) * (PO.isIN() ? 1 : PO.isUS() ? 10 : 20)), sub: 'loaded for the period' },
        ]} />
        <${PO.Card} flush title="Structures that need a look" sub=${`${resolvedN} of 3 resolved`}>
          <div class="list">${S.look.map((l) => html`<div class="list-item"><${PO.Who} p=${l.p} sub=${`${l.p.title}, ${PO.site(l.p.site).name}`} /><span class="grow muted t-sm" style="padding-left:12px">${l.issue}</span>${st.resolved[l.p.id] ? html`<${PO.Status} s="Resolved" />` : html`<${PO.Button} size="sm" onClick=${() => { up({ resolved: { ...st.resolved, [l.p.id]: true } }); PO.toast(`${l.p.name}: kept People OS calculation`); }}>Use People OS calculation</${PO.Button}>`}</div>`)}</div>
          <div class="row" style="padding:12px 16px;border-top:1px solid var(--border)"><span class="right row"><${PO.Button} onClick=${() => up({ step: 1 })}>Back</${PO.Button}><${PO.Button} kind="primary" onClick=${() => up({ step: 3 })}>Run parallel payroll</${PO.Button}></span></div>
        </${PO.Card}>` : null}
      ${st.step >= 3 ? html`
        ${st.live ? html`<${PO.Callout} tone="green" icon="CircleCheck" title=${`${P.company.short} is live on People OS`} action=${html`<${PO.Button} kind="primary" href=${PO.href('payroll')}>Open payroll</${PO.Button}>`}>Payroll for ${P.company.period} and every run after it is calculated here. ${oldSys} can be switched off; a read-only copy of the import is kept for 8 years.</${PO.Callout}>` : null}
        <${PO.KpiStrip} items=${[
          { label: `Net pay in ${oldSys}`, icon: 'Banknote', accent: 'green', value: PO.money(totalOld, { compact: true }), sub: P.company.period },
          { label: 'Net pay in People OS', icon: 'Banknote', accent: 'green', value: PO.money(P.totals.net, { compact: true }), sub: 'same period, same inputs' },
          { label: PO.isIN() ? 'Identical to the rupee' : 'Identical to the cent', icon: 'CircleCheck', accent: 'green', value: `${P.people.length - diffs.length} / ${P.people.length}`, sub: PO.pct((P.people.length - diffs.length) / P.people.length, 1) },
          { label: 'Differences', icon: 'GitCompareArrows', accent: 'amber', value: diffs.length, sub: `${S.rounding.length} rounding, ${S.look.length} structure` },
        ]} />
        <${PO.DataTable} rows=${rowsAll} rowKey=${(r) => r.p.id} exportName="parallel-payroll" search=${(r) => r.p.name} pageSize=${12}
          toolbar=${html`<${PO.Switch} on=${all} onChange=${setAll} label=${`Show all ${P.people.length}`} />`}
          columns=${[
            { key: 'who', label: 'Employee', render: (r) => html`<${PO.Who} p=${r.p} size="sm" sub=${r.p.id} />`, sort: (r) => r.p.name, csv: (r) => r.p.name },
            { key: 'old', label: oldSys, align: 'r', render: (r) => html`<span class="tnum">${PO.money(r.p.pay.net + r.delta)}</span>`, sort: (r) => r.p.pay.net + r.delta, csv: (r) => (r.p.pay.net + r.delta).toFixed(2) },
            { key: 'new', label: 'People OS', align: 'r', render: (r) => html`<span class="tnum w-500">${PO.money(r.p.pay.net)}</span>`, sort: (r) => r.p.pay.net, csv: (r) => r.p.pay.net.toFixed(2) },
            { key: 'diff', label: 'Difference', align: 'r', render: (r) => html`<span class="tnum" style=${r.delta ? `color:var(--${Math.abs(r.delta) > (PO.isIN() ? 5 : 0.05) ? 'red' : 'text-3'})` : 'color:var(--text-3)'}>${r.delta ? (r.delta > 0 ? '−' : '+') + PO.money(Math.abs(r.delta)) : '—'}</span>`, sort: (r) => Math.abs(r.delta), csv: (r) => (-r.delta).toFixed(2) },
            { key: 'issue', label: 'Why', render: (r) => html`<span class="muted t-sm">${r.issue}</span>` },
            { key: 'st', label: 'Status', render: (r) => html`<${PO.Status} s=${r.kind === 'look' ? (st.resolved[r.p.id] ? 'Resolved' : 'Needs review') : r.kind === 'round' ? 'Within policy' : 'Done'} />`, sort: (r) => r.kind },
          ]} />
        ${st.live ? null : html`<div class="card" style="padding:14px 16px"><div class="row"><div class="grow"><b class="w-600">${resolvedN === 3 ? 'Everything is explained. Ready to go live.' : `${3 - resolvedN} structure${3 - resolvedN === 1 ? '' : 's'} still need a decision`}</b><div class="faint t-sm">Going live makes People OS your payroll of record from the next run. You can roll back within 7 days.</div></div>
          <${PO.Button} onClick=${() => up({ step: 2 })}>Back</${PO.Button}>
          <${PO.Button} kind="primary" onClick=${() => ask({ title: `Go live with ${P.company.short}?`, icon: 'CircleCheck', body: html`<p class="muted">${resolvedN === 3 ? '' : `${3 - resolvedN} structure${3 - resolvedN === 1 ? '' : 's'} will use the People OS calculation. `}From the next run, payroll, ${leaveWord().toLowerCase()} and attendance run in People OS. ${P.people.length} employees get an invite on ${P.msg.channel}.</p>`, confirm: 'Go live', onConfirm: () => { up({ live: true, step: 4, resolved: Object.fromEntries(S.look.map((l) => [l.p.id, true])) }); PO.toast(`${P.company.short} is live on People OS`, { icon: 'CircleCheck' }); } })}>Go live</${PO.Button}>
        </div></div>`}` : null}
      ${confirmEl}`;
  }

  /* ---------- country packs ---------- */
  function Countries() {
    const P = PO.P();
    const [req, setReq] = PO.useCoState('settings.packs.requested', {});
    const mine = { 'United States': 'us', 'United Kingdom': 'uk', India: 'in' };
    const live = PO.PACKS.filter((x) => x[3] === 'live');
    const avail = PO.PACKS.filter((x) => x[3] !== 'live');
    const row = ([, n, d, s]) => { const co = mine[n]; const here = co === P.id; return html`<div class="list-item">
      <div class="grow" style="min-width:0"><b class="w-550">${n}</b>${here ? html` <span class="faint t-sm">this company</span>` : s === 'live' ? html` <span class="faint t-sm">used by ${PO.DATA[co].company.short}</span>` : null}<div class="faint t-sm ellipsis">${d}</div></div>
      <span style="flex:none;width:96px">${s === 'live' ? html`<${PO.Status} s="Live" />` : req[n] ? html`<${PO.Status} s="Pending" />` : html`<span class="faint t-sm">Ready in 2 days</span>`}</span>
      <span style="flex:none;width:104px;text-align:right">${s === 'live' ? html`<${PO.Button} size="sm" kind="ghost" onClick=${() => (here ? PO.go('compliance') : PO.toast(`Switch to ${PO.DATA[co].company.name} from the company menu to see its rules`))}>${here ? 'View rules' : 'Details'}</${PO.Button}>` : req[n] ? html`<${PO.Button} size="sm" kind="ghost" onClick=${() => { const x = { ...req }; delete x[n]; setReq(x); PO.toast('Request withdrawn'); }}>Withdraw</${PO.Button}>` : html`<${PO.Button} size="sm" onClick=${() => { setReq({ ...req, [n]: true }); PO.toast(`${n} pack requested. We’ll set it up within 2 working days.`); }}>Add country</${PO.Button}>`}</span>
    </div>`; };
    return html`<${Head} title="Country packs" sub=${`${live.length} countries live and ${avail.length} more available. Rules update automatically.`} actions=${html`<${PO.Button} kind="primary" href=${PO.href('settings/import')}>Add a company</${PO.Button}>`} />
      <${PO.Card} flush title="Live in this workspace" sub=${`${live.length} countries, ${PO.order.length} companies`}><div class="list">${live.map(row)}</div></${PO.Card}>
      <${PO.Card} flush title="Available" sub=${`${avail.length} more`}><div class="list">${avail.map(row)}</div></${PO.Card}>
      <p class="faint t-sm">${PO.isIN() ? 'The EPF wage ceiling moved to ₹25,000 from 17 Sep 2026; every Indian company picked it up the same day.' : PO.isUS() ? 'Federal and state tax tables, FLSA thresholds and new-hire reporting rules update without a release on your side.' : 'National Living Wage, NI thresholds and tax codes update at the start of each tax year without a release on your side.'} Each change shows in the Compliance centre with its effective date.</p>`;
  }

  /* ---------- shell ---------- */
  const Head = ({ title, sub, actions }) => html`<div class="row set-head" style="align-items:flex-end;gap:16px"><div class="grow" style="min-width:0"><h1>${title}</h1>${sub ? html`<p>${sub}</p>` : null}</div>${actions ? html`<div class="row" style="flex:none">${actions}</div>` : null}</div>`;
  const WIDE = { roles: 1, audit: 1, import: 1, sites: 1 };
  const VIEWS = { company: Company, sites: Sites, portal: Portal, org: Org, roles: Roles, workflows: Workflows, pay: Pay, integrations: Integrations, notifications: Notifications, security: Security, audit: Audit, import: Import, countries: Countries };

  function Settings({ params }) {
    const sec = params && params[0];
    const View = VIEWS[sec] || Overview;
    return html`<div class="set-layout">
      <nav class="set-nav">
        <a href=${PO.href('settings')} aria-current=${!VIEWS[sec] ? 'page' : undefined}><${PO.Icon} n="LayoutGrid" size=${15} />Overview</a>
        ${SECTIONS.map((s) => s.group ? html`<div class="set-nav-h">${s.group}</div>` : html`<a href=${PO.href('settings/' + s[0])} aria-current=${s[0] === sec ? 'page' : undefined}><${PO.Icon} n=${s[2]} size=${15} /><span class="ellipsis">${s[1]}</span></a>`)}
      </nav>
      <div class=${'set-main ' + (WIDE[sec] ? 'wide' : '')}><${View} /></div>
    </div>`;
  }
  PO.route('settings', Settings, { title: 'Settings' });
})();
