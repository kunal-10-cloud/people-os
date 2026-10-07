/* People OS: Contractors. Agencies whose people work at your sites, their monthly statutory proofs,
   licences and insurance, plus the country-specific duties of the principal employer / hirer:
   IN CLRA registers and obligations, US certificates of insurance and W-9s, UK Agency Workers Regulations.
   State (per company): contractors.received, contractors.held, contractors.reminded, contractors.awr,
   contractors.added, contractors.registers, contractors.obligations, contractors.requested, contractors.tab */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
    .ctr-logo { width: 40px; height: 40px; border-radius: 8px; display: grid; place-items: center; font-weight: 600; font-size: 14px; flex: none; background: var(--surface-3); color: var(--text-2); border: 1px solid var(--border); }
    .ctr-logo.chip-ic { border: none; font-weight: 650; letter-spacing: .01em; }
    .ctr-logo.sm { width: 34px; height: 34px; border-radius: 9px; font-size: 12px; }
    .ctr-stack { display: inline-flex; align-items: center; } .ctr-stack .av { box-shadow: 0 0 0 2px var(--surface); } .ctr-stack .av + .av { margin-left: -6px; }
    .ctr-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .ctr-name b { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ctr-name small { display: block; color: var(--text-3); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ctr-grid { width: 100%; border-collapse: separate; border-spacing: 6px; margin: -6px; }
    .ctr-grid th { font-size: 11.5px; font-weight: 550; color: var(--text-3); text-align: center; padding: 0 0 2px; }
    .ctr-grid th.l, .ctr-grid td.l { text-align: left; white-space: nowrap; font-weight: 500; color: var(--text-2); font-size: 12px; padding-right: 6px; }
    .ctr-cell { width: 100%; min-width: 64px; height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border-radius: 6px;
      border: 1px solid var(--border); cursor: pointer; font-size: 11.5px; font-weight: 500; line-height: 1.15; background: var(--surface); color: var(--text-3); }
    .ctr-cell small { font-weight: 400; font-size: 10.5px; color: var(--text-3); }
    .ctr-cell:hover { border-color: var(--border-strong); }
    .ctr-cell.ok { color: var(--text-2); border-color: transparent; background: var(--surface-2); }
    .ctr-cell.up { color: var(--text); border-color: var(--border-strong); font-weight: 600; }
    .ctr-cell.late { color: var(--amber); }
    .ctr-cell.miss { background: var(--red-soft); color: var(--red); border-color: color-mix(in srgb, var(--red) 40%, transparent); font-weight: 600; }
    .ctr-legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--text-2); }
    .ctr-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; border: 1px solid var(--border); }
    .ctr-mini { padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface-2); min-width: 0; }
    .ctr-mini .l { font-size: 11.5px; color: var(--text-3); font-weight: 500; }
    .ctr-mini .v { font-size: 18px; font-weight: 600; letter-spacing: -.02em; margin-top: 2px; font-variant-numeric: tabular-nums; }
    .ctr-mini .s { font-size: 11.5px; color: var(--text-3); margin-top: 1px; }
    .ctr-doc { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .ctr-doc:last-child { border-bottom: none; }
    .ctr-wa { background: var(--surface-3); border-radius: 12px; padding: 14px; }
    .ctr-bubble { background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; white-space: pre-line; font-size: 13px; line-height: 1.55; }
    .ctr-weeks { display: flex; gap: 2px; }
    .ctr-weeks i { width: 7px; height: 14px; border-radius: 2px; background: var(--surface-3); }
    .ctr-weeks i.on { background: var(--chart-1); }
    .ctr-weeks i.q { background: var(--brand); }
    .ctr-head { display: flex; gap: 12px; align-items: center; min-width: 0; flex: 1; }
    .ctr-head h3 { font-size: 16px; }
  </style>`);

  /* ---------- helpers ---------- */
  const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
  const LAST = MONTHS[MONTHS.length - 1];
  const mLabel = (ym) => PO.MONS[+ym.slice(5) - 1];
  const mLong = (ym) => `${mLabel(ym)} ${ym.slice(0, 4)}`;
  const nextYm = (ym) => { const y = +ym.slice(0, 4), m = +ym.slice(5); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; };
  const pad = (n) => String(n).padStart(2, '0');
  const daysTo = (iso) => Math.round((new Date(iso) - new Date(PO.TODAY)) / 864e5);
  const hueOf = (s) => PO.hueOf(s);
  const abbr = (name) => name.split(/[\s&]+/).filter((w) => w && /[A-Z]/.test(w[0])).map((w) => w[0]).slice(0, 2).join('');
  const LOGO_ACC = ['teal', 'blue', 'violet', 'amber', 'rose', 'green'];
  const Logo = ({ name, lg }) => html`<span class=${`ctr-logo chip-ic ${LOGO_ACC[PO.hueOf(name) % LOGO_ACC.length]} ${lg ? '' : 'sm'}`}>${abbr(name)}</span>`;
  /** Worker faces for an agency: employees on your payroll show their portrait, agency staff a portrait from their name. */
  const Crew = ({ ws, max = 4 }) => html`<span class="ctr-stack">${ws.slice(0, max).map((w) => html`<${PO.Avatar} p=${w.p} name=${w.name} size="xs" />`)}${ws.length > max ? html`<span class="faint t-xs" style="margin-left:6px">+${ws.length - max}</span>` : null}</span>`;

  const PROOFS = {
    in: [['pf', 'PF challan (ECR)'], ['esi', 'ESI challan'], ['wage', 'Wage sheet'], ['att', 'Attendance']],
    us: [['ts', 'Timesheets'], ['pay', 'Payroll register'], ['coi', 'Insurance (COI)'], ['inv', 'Invoice']],
    uk: [['ts', 'Timesheets'], ['slip', 'Agency payslips'], ['hol', 'Holiday accrual'], ['inv', 'Invoice']],
  };
  const CELL = { Verified: ['ok', 'Check'], Uploaded: ['up', 'Upload'], Late: ['late', 'Clock'], Missing: ['miss', 'X'] };

  /* ---------- agency specs (first two mirror P.contractors so every screen agrees) ---------- */
  function specs(P) {
    const c = P.contractors;
    if (P.id === 'in') return [
      { name: c[0].name, services: 'Security guards and housekeeping', contact: ['Rajesh Kulkarni', '+91 98220 41736'], since: '2021-06-01', licence: { label: 'CLRA licence (Form VI)', no: 'PUN/CLRA/LIC/2024/1187', expiry: '2027-03-31', limit: 50 }, invoice: 984000, workers: 'people', lateRate: 0.22, special: { [LAST]: { pf: ['Missing'], esi: ['Uploaded', '2026-10-04'], wage: ['Uploaded', '2026-10-03'], att: ['Verified', '2026-10-02'] } }, codes: { pf: 'PUPUN0048213000', esi: '33000412870001099' } },
      { name: c[1].name, services: 'Deep cleaning and facade crew, on call', contact: ['Anita Pawar', '+91 99700 18245'], since: '2023-02-15', licence: { label: 'CLRA licence (Form VI)', no: 'PUN/CLRA/LIC/2023/0942', expiry: '2027-11-30', limit: 20 }, invoice: 112500, workers: { n: 6, role: 'Deep-cleaning technician', sites: ['mgp', 'hjw', 'vmn'] }, lateRate: 0.04, special: { [LAST]: { pf: ['Verified', '2026-10-03'], esi: ['Verified', '2026-10-03'] } }, codes: { pf: 'PUPUN0061174000', esi: '33000588120001001' } },
      { name: 'Deccan Pest & Hygiene Services', services: 'Monthly pest control at every site', contact: ['Sameer Inamdar', '+91 98505 66120'], since: '2022-08-01', licence: { label: 'CLRA licence (Form VI)', no: 'PUN/CLRA/LIC/2022/0310', expiry: '2026-10-28', limit: 10 }, invoice: 38400, workers: { n: 3, role: 'Pest control technician', sites: ['hjw', 'khd', 'bnr'] }, lateRate: 0.12, codes: { pf: 'PUPUN0039902000', esi: '33000301440001002' } },
      { name: 'Annapurna Canteen Services', services: 'Staff canteen at head office and Hinjewadi', contact: ['Sunanda Kale', '+91 97640 22871'], since: '2024-01-10', licence: { label: 'CLRA licence (Form VI)', no: 'PUN/CLRA/LIC/2024/0076', expiry: '2027-06-30', limit: 15 }, invoice: 64000, workers: { n: 5, role: 'Canteen staff', sites: ['hq', 'hjw'] }, lateRate: 0.06, codes: { pf: 'PUPUN0072290000', esi: '33000699310001003' } },
    ];
    if (P.id === 'us') return [
      { name: c[0].name, services: 'Event servers for catering orders', contact: ['Brenda Alvarez', '(512) 555-0148'], since: '2024-03-01', licence: { label: 'Certificate of insurance', no: 'Hiscox GL-P-4471902', expiry: '2026-09-30' }, coi: { carrier: 'Hiscox', policy: 'GL-P-4471902', gl: '$1M / $2M', wc: 'Texas Mutual WC-118204' }, w9: { status: 'On file', tin: '••-•••4419', got: '2025-03-02', entity: 'LLC' }, invoice: 4820, workers: { n: 8, role: 'Event server', sites: ['dm', 'ck'] }, lateRate: 0.18, special: { [LAST]: { coi: ['Missing'], ts: ['Uploaded', '2026-10-05'], inv: ['Uploaded', '2026-10-05'] } } },
      { name: c[1].name, services: 'Night deep clean, 3 nights a week', contact: ['Tom Whitaker', '(512) 555-0193'], since: '2022-11-14', licence: { label: 'Certificate of insurance', no: 'Travelers GL-6620193', expiry: '2027-03-31' }, coi: { carrier: 'Travelers', policy: 'GL-6620193', gl: '$1M / $2M', wc: 'Travelers WC-6620194' }, w9: { status: 'On file', tin: '••-•••0372', got: '2024-01-08', entity: 'LLC' }, invoice: 2640, workers: { n: 3, role: 'Night cleaner', sites: ['sl', 'e6', 'dm'] }, lateRate: 0.04 },
      { name: 'Capitol Courier Collective', services: 'Catering deliveries on busy weekends', contact: ['Andre Simmons', '(737) 555-0122'], since: '2026-07-18', licence: { label: 'Certificate of insurance', no: 'Progressive CA-30914', expiry: '2027-01-15' }, coi: { carrier: 'Progressive Commercial', policy: 'CA-30914', gl: '$1M auto liability', wc: 'Exempt (sole drivers)' }, w9: { status: 'Missing', tin: '—', got: null, entity: 'Partnership' }, invoice: 1980, workers: { n: 2, role: 'Courier driver', sites: ['ck'] }, lateRate: 0.15, startAt: '2026-07' },
    ];
    return [
      { name: c[0].name, services: 'Agency cleaners for the airport contract', contact: ['Leanne Fraser', '0161 555 0184'], since: '2025-11-03', licence: { label: 'Employment agency registration', no: 'EAS 0418827', expiry: '2027-05-31' }, ins: 'Public liability £5M, Aviva', invoice: 9860, workers: { n: 7, role: 'Agency cleaner', sites: ['ma'], starts: ['2026-05-11', '2026-06-01', '2026-07-20', '2026-07-20', '2026-07-20', '2026-08-10', '2026-09-07'] }, awr: true, lateRate: 0.15 },
      { name: c[1].name, services: 'High-level windows, monthly', contact: ['Gareth Lloyd', '0161 555 0127'], since: '2021-04-19', licence: { label: 'Public liability insurance', no: 'Zurich PL-2290417, £10M', expiry: '2027-02-28' }, ins: 'Public liability £10M, Zurich', invoice: 1450, workers: { n: 2, role: 'Rope-access window technician', sites: ['mc', 'sf'], starts: ['2023-03-06', '2024-09-02'] }, lateRate: 0.04 },
      { name: 'Mancunian Facilities Recruitment', services: 'Cover cleaners for office towers', contact: ['Priya Chauhan', '0161 555 0163'], since: '2026-04-13', licence: { label: 'Employment agency registration', no: 'EAS 0533190', expiry: '2027-08-31' }, ins: 'Public liability £5M, Hiscox', invoice: 3920, workers: { n: 4, role: 'Agency cleaner', sites: ['mc', 'sf'], starts: ['2026-04-13', '2026-08-24', '2026-09-14', '2026-09-21'] }, awr: true, lateRate: 0.06 },
    ];
  }

  const CACHE = {};
  function build(P) {
    if (CACHE[P.id]) return CACHE[P.id];
    return (CACHE[P.id] = specs(P).map((s, ai) => {
      const r = PO.seeded('ctr' + P.id + s.name);
      let workers;
      if (s.workers === 'people') {
        workers = P.people.filter((p) => p.contractor === s.name).map((p) => ({ id: p.id, p, name: p.name, role: p.title, site: p.site, start: p.joinedIso, shift: p.shift, gate: `GP-${p.id.slice(-3)}` }));
      } else {
        workers = Array.from({ length: s.workers.n }, (_, i) => {
          const g = /Canteen/.test(s.workers.role) ? (r.chance(0.6) ? 'f' : 'm') : r.chance(0.35) ? 'f' : 'm';
          const name = `${r.pick(P.names[g])} ${r.pick(P.last)}`;
          const start = s.workers.starts ? s.workers.starts[i] : PO.addDays(s.since, r.int(0, Math.max(30, daysTo(s.since) * -1 - 20)));
          return { id: `AGW-${ai}${pad(i + 1)}`, name, role: s.workers.role, site: s.workers.sites[i % s.workers.sites.length], start, shift: r.pick(P.shifts).key, gate: `${P.id === 'in' ? 'GP' : 'TP'}-${r.int(200, 899)}`, nights: r.pick([0, 0, 64, 96]) };
        });
      }
      const proofs = {};
      MONTHS.forEach((m) => {
        proofs[m] = {};
        PROOFS[P.id].forEach(([k]) => {
          const sp = s.special && s.special[m] && s.special[m][k];
          if (s.startAt && m < s.startAt) { proofs[m][k] = { status: 'n/a' }; return; }
          if (sp) { proofs[m][k] = { status: sp[0], date: sp[1] || null }; return; }
          const nm = nextYm(m);
          if (m === LAST) { const st = r.chance(0.55) ? 'Verified' : 'Uploaded'; proofs[m][k] = { status: st, date: `${nm}-${pad(r.int(1, 5))}` }; return; }
          if (r.chance(s.lateRate)) proofs[m][k] = { status: 'Late', date: `${nm}-${pad(r.int(14, 26))}` };
          else proofs[m][k] = { status: 'Verified', date: `${nm}-${pad(r.int(2, 7))}` };
        });
      });
      const spend = MONTHS.map((m, i) => (s.startAt && m < s.startAt ? 0 : Math.round(s.invoice * (0.9 + 0.1 * (i / 5) + (r.rnd() - 0.5) * 0.06))));
      spend[spend.length - 1] = s.invoice;
      return { ...s, idx: ai, workers, proofs, spend };
    }));
  }

  /* Live view of an agency given the user's actions (received proofs, AWR confirmations). */
  function view(P, a, received, awr) {
    const proofs = {};
    MONTHS.forEach((m) => { proofs[m] = {}; PROOFS[P.id].forEach(([k]) => { const key = `${a.name}|${m}|${k}`; const c0 = a.proofs[m][k]; proofs[m][k] = received[key] === 'v' && c0.status === 'Uploaded' ? { ...c0, status: 'Verified' } : received[key] && c0.status === 'Missing' ? { status: 'Uploaded', date: PO.TODAY, byYou: true } : c0; }); });
    const licence = { ...a.licence };
    if (P.id === 'us' && received[`${a.name}|${LAST}|coi`]) licence.expiry = '2027-09-30';
    const cells = MONTHS.flatMap((m) => Object.values(proofs[m])).filter((c) => c.status !== 'n/a');
    const W = { Verified: 1, Uploaded: 0.92, Late: 0.7, Missing: 0 };
    const exp = daysTo(licence.expiry);
    let score = cells.length ? Math.round((cells.reduce((t, c) => t + W[c.status], 0) / cells.length) * 100) : 100;
    const missingNow = PROOFS[P.id].filter(([k]) => proofs[LAST][k].status === 'Missing');
    const w9missing = a.w9 && a.w9.status === 'Missing';
    const awrSoon = a.awr ? a.workers.filter((w) => { const d = daysTo(PO.addDays(w.start, 84)); return d >= 0 && d <= 14 && !awr[w.id]; }) : [];
    if (exp < 0) score -= 20; else if (exp <= 30) score -= 8;
    if (w9missing) score -= 10;
    if (missingNow.length) score -= 6 * missingNow.length;
    score = Math.max(0, Math.min(100, score));
    const issues = [];
    if (exp < 0) issues.push({ tone: 'red', short: P.id === 'us' ? 'Insurance expired' : 'Licence expired', text: `${licence.label} expired on ${PO.date(licence.expiry)}` });
    missingNow.forEach(([k, l]) => issues.push({ tone: 'red', short: 'Proof missing', text: `${mLong(LAST)} ${l} not uploaded` }));
    if (exp >= 0 && exp <= 30) issues.push({ tone: 'amber', short: 'Licence expiring', text: `${licence.label} expires ${PO.date(licence.expiry)}, in ${exp} days` });
    if (w9missing) issues.push({ tone: 'amber', short: 'W-9 missing', text: 'No W-9 on file, so you can’t file their 1099-NEC' });
    if (awrSoon.length) issues.push({ tone: 'amber', short: '12-week rule soon', text: `${PO.plural(awrSoon.length, 'worker')} reach 12 weeks on ${PO.date(PO.addDays(awrSoon[0].start, 84))}` });
    const tone = issues.some((i) => i.tone === 'red') ? 'red' : issues.length ? 'amber' : 'green';
    return { ...a, proofs, licence, score, issues, tone, statusText: issues.length ? issues[0].short : 'All clear', missing: cells.filter((c) => c.status === 'Missing').length, exp };
  }

  const axisFmt = (v) => (PO.P().id === 'in' ? (v >= 1e5 ? `₹${+(v / 1e5).toFixed(1)}L` : `₹${Math.round(v / 1e3)}k`) : PO.money(v, { compact: true }));
  const ScoreBar = ({ v }) => html`<div style="min-width:110px"><${PO.Progress} value=${v} tone=${v >= 90 ? '' : v >= 75 ? 'amber' : 'red'} label=${v} /></div>`;

  /* ---------- proof grid ---------- */
  function ProofGrid({ P, a, onCell, months = MONTHS }) {
    return html`<div class="scroll-x"><table class="ctr-grid"><thead><tr><th class="l"></th>${months.map((m) => html`<th>${mLabel(m)}${m === LAST ? html` <span class="faint">(latest)</span>` : null}</th>`)}</tr></thead>
      <tbody>${PROOFS[P.id].map(([k, l]) => html`<tr><td class="l">${l}</td>${months.map((m) => { const c = a.proofs[m][k]; if (c.status === 'n/a') return html`<td><div class="ctr-cell" style="cursor:default" title="Not engaged yet">—</div></td>`; const [cls, ic] = CELL[c.status]; return html`<td><button class=${'ctr-cell ' + cls} title=${`${l}, ${mLong(m)}: ${c.status}`} onClick=${() => onCell(a, m, k)}><span>${c.status === 'Missing' ? 'Missing' : c.status === 'Late' ? 'Late' : c.status === 'Uploaded' ? 'To check' : 'OK'}</span>${c.date ? html`<small>${PO.date(c.date, { short: true, noYear: true })}</small>` : null}</button></td>`; })}</tr>`)}</tbody></table></div>`;
  }
  const Legend = () => html`<div class="ctr-legend"><span><i style="background:var(--surface-2);border-color:transparent"></i>OK, verified</span><span><i style="border-color:var(--border-strong)"></i>Uploaded, to check</span><span><i style="border-color:var(--amber-solid)"></i>Uploaded late</span><span><i style="background:var(--red-soft);border-color:var(--red)"></i>Missing</span></div>`;

  /* ---------- documents per agency ---------- */
  function docsOf(P, a) {
    const n = a.workers.length;
    const lic = { name: a.licence.label, meta: `${a.licence.no}, valid until ${PO.date(a.licence.expiry)}`, status: a.exp < 0 ? 'Expired' : a.exp <= 30 ? 'Expiring soon' : 'Verified', icon: 'BadgeCheck' };
    if (P.id === 'in') return [lic,
      { name: 'Service agreement', meta: `Signed ${PO.date(a.since)}, renews every April`, status: 'Signed', icon: 'FileSignature' },
      { name: 'PF establishment code', meta: a.codes.pf, status: 'Verified', icon: 'Landmark' },
      { name: 'ESI employer code', meta: a.codes.esi, status: 'Verified', icon: 'HeartPulse' },
      { name: 'Labour welfare fund registration', meta: 'Maharashtra LWF, June and December', status: 'Verified', icon: 'Building2' },
      /Shield/.test(a.name) ? { name: 'Police verification of guards', meta: `${n - 3} of ${n} verified, 3 renewals due in November`, status: 'Partial', icon: 'ShieldCheck' } : { name: 'Employee compensation policy', meta: 'New India Assurance, valid until 31 Mar 2027', status: 'Verified', icon: 'Umbrella' },
    ];
    if (P.id === 'us') return [
      { ...lic, meta: `${a.coi.carrier}, ${a.coi.gl}, ${a.exp < 0 ? 'expired' : 'valid until'} ${PO.date(a.licence.expiry)}`, status: a.exp < 0 ? 'Insurance expired' : 'Verified' },
      { name: 'Form W-9', meta: a.w9.got ? `TIN ${a.w9.tin}, ${a.w9.entity}, received ${PO.date(a.w9.got)}` : 'Not received', status: a.w9.status === 'Missing' ? 'Missing' : 'Verified', icon: 'FileText' },
      { name: 'Master services agreement', meta: `Signed ${PO.date(a.since)}, 30-day termination`, status: 'Signed', icon: 'FileSignature' },
      { name: 'Workers’ compensation', meta: a.coi.wc, status: /Exempt/.test(a.coi.wc) ? 'Needs review' : 'Verified', icon: 'HardHat' },
      { name: /server|cook/i.test(a.workers[0].role) ? 'Food handler cards' : 'Driver records (MVR)', meta: `${n} of ${n} on file`, status: 'Verified', icon: 'IdCard' },
    ];
    return [lic,
      { name: 'Insurance', meta: a.ins, status: 'Verified', icon: 'Umbrella' },
      { name: 'Contract for services', meta: `Signed ${PO.date(a.since)}, 4-week invoicing`, status: 'Signed', icon: 'FileSignature' },
      a.awr ? { name: 'AWR information sheet', meta: 'Comparator pay and holiday for week 12', status: 'Verified', icon: 'Scale' } : { name: 'RAMS for rope access', meta: 'Risk assessment and method statement, IRATA', status: 'Verified', icon: 'ClipboardCheck' },
      { name: 'Right to work confirmations', meta: `Agency confirmed ${n} of ${n} workers`, status: 'Verified', icon: 'IdCard' },
    ];
  }

  /* ---------- proof details modal ---------- */
  function proofRef(P, a, m, k) {
    const r = PO.seeded('ref' + a.name + m + k);
    const n = a.workers.length;
    const wage = P.id === 'in' ? (a.workers[0].p ? a.workers.reduce((t, w) => t + w.p.pay.gross, 0) : n * 17500) : 0;
    if (P.id === 'in') {
      if (k === 'pf') return [['TRRN', `${r.int(1000000000, 1999999999)}${r.int(100, 999)}`], ['Members in ECR', n], ['Amount (EE + ER)', PO.money(Math.round(Math.min(wage * 0.6, n * 25000) * 0.24))]];
      if (k === 'esi') return [['Challan number', `${r.int(100000000, 999999999)}${r.int(10, 99)}`], ['IPs covered', n], ['Amount (0.75% + 3.25%)', PO.money(Math.ceil(wage * 0.04))]];
      if (k === 'wage') return [['Workers', n], ['Gross wages', PO.money(wage)], ['Paid by', 'Bank transfer, 7th of the month']];
      return [['Workers', n], ['Man-days', PO.num(n * 26 + r.int(0, 20))], ['Source', 'Biometric at site gates']];
    }
    if (k === 'coi') return [['Carrier', a.coi.carrier], ['Policy', a.coi.policy], ['Limits', a.coi.gl]];
    if (k === 'inv') return [['Invoice', `${abbr(a.name)}-${m.replace('-', '')}-${r.int(10, 99)}`], ['Amount', PO.money(a.spend[MONTHS.indexOf(m)])], ['Terms', 'Net 15']];
    if (k === 'ts' ) return [['Workers', n], ['Hours', PO.num(n * (P.id === 'uk' ? 148 : 64) + r.int(0, 30))], ['Approved by', P.byId[P.sites.find((s) => s.id === a.workers[0].site).lead]?.name || '—']];
    if (k === 'hol') return [['Workers', n], ['Holiday accrued', `${PO.num(n * 19.3, 1)} h`], ['Method', '12.07% of hours worked']];
    return [['Workers', n], ['Pay date', `${mLabel(nextYm(m))} 5`], ['Format', 'PDF, one per worker']];
  }

  /* ---------- the page ---------- */
  function Contractors({ query }) {
    const P = PO.P();
    const isIN = P.id === 'in', isUS = P.id === 'us', isUK = P.id === 'uk';
    const base = useMemo(() => build(P), [P.id]);
    const [received, setReceived] = PO.useCoState('contractors.received', {});
    const [held, setHeld] = PO.useCoState('contractors.held', {});
    const [reminded, setReminded] = PO.useCoState('contractors.reminded', {});
    const [awr, setAwr] = PO.useCoState('contractors.awr', {});
    const [added, setAdded] = PO.useCoState('contractors.added', []);
    const [tabRaw, setTab] = PO.useCoState('contractors.tab', (query && query.tab) || 'agencies');
    const [open, setOpen] = useState(query && query.agency != null ? +query.agency : null);
    const [cell, setCell] = useState(null);
    const [remindFor, setRemindFor] = useState(null);
    const [adding, setAdding] = useState(false);
    const [month, setMonth] = useState(LAST);

    const ags = useMemo(() => {
      const extra = added.map((x, i) => {
        const proofs = {}; MONTHS.forEach((m) => { proofs[m] = {}; PROOFS[P.id].forEach(([k]) => (proofs[m][k] = { status: 'n/a' })); });
        return { name: x.name, services: x.services, contact: [x.contact, x.phone], since: PO.TODAY, licence: { label: isUS ? 'Certificate of insurance' : isIN ? 'CLRA licence (Form VI)' : 'Employment agency registration', no: x.licenceNo || 'To be uploaded', expiry: x.expiry, limit: +x.workers || 0 }, coi: { carrier: 'To be uploaded', policy: '—', gl: '—', wc: '—' }, w9: { status: 'Missing', tin: '—', got: null, entity: '—' }, ins: 'To be uploaded', codes: { pf: '—', esi: '—' }, invoice: +x.invoice || 0, workers: [], proofs, spend: MONTHS.map(() => 0), idx: base.length + i, isNew: true, headcount: +x.workers || 0 };
      });
      return [...base, ...extra].map((a) => view(P, a, received, awr));
    }, [base, received, awr, added]);

    const allWorkers = useMemo(() => ags.flatMap((a) => a.workers.map((w) => ({ ...w, agency: a.name, ag: a }))), [ags]);
    const nWorkers = ags.reduce((t, a) => t + (a.isNew ? a.headcount : a.workers.length), 0);
    const missingTotal = ags.reduce((t, a) => t + a.missing, 0);
    const heldList = ags.filter((a) => held[a.name]);
    const spendNow = ags.reduce((t, a) => t + a.invoice, 0);
    const externals = allWorkers.filter((w) => !w.p).length;
    const need = ags[0];

    const act = {
      remind: (a) => setRemindFor(a),
      hold: (a) => {
        const on = !held[a.name];
        setHeld({ ...held, [a.name]: on });
        PO.toast(on ? `${a.name}: ${PO.money(a.invoice)} invoice on hold until proofs are in` : `${a.name}: invoice released for payment`, { icon: on ? 'PauseCircle' : 'PlayCircle', action: { label: 'Undo', run: () => setHeld({ ...held, [a.name]: !on }) } });
      },
      cell: (a, m, k) => setCell({ name: a.name, m, k }),
      verify: (a, m, k) => { const key = `${a.name}|${m}|${k}`; setReceived({ ...received, [key]: 'v' }); PO.toast(`${PROOFS[P.id].find((x) => x[0] === k)[1]} for ${mLong(m)} verified`); setCell(null); },
      receive: (a, m, k) => {
        const key = `${a.name}|${m}|${k}`;
        setReceived({ ...received, [key]: true });
        PO.toast(`${PROOFS[P.id].find((x) => x[0] === k)[1]} for ${mLong(m)} marked as received`, { action: { label: 'Undo', run: () => setReceived({ ...received, [key]: false }) } });
        setCell(null);
      },
    };
    const sendRemind = (a) => {
      const t = P.hhmm(P.company.nowMin);
      setReminded({ ...reminded, [a.name]: t });
      PO.toast(`Reminder emailed to ${a.contact[0]}, with an SMS heads-up`, { icon: 'Mail', action: { label: 'Undo', run: () => { const x = { ...reminded }; delete x[a.name]; setReminded(x); } } });
      setRemindFor(null);
    };

    const tabs = [['agencies', 'Agencies', ags.length], ['workers', 'Workers', nWorkers], ['proofs', 'Monthly proofs', missingTotal || null]];
    if (isIN) tabs.push(['clra', 'CLRA registers & duties']);
    if (isUS) tabs.push(['coi', 'Insurance & W-9']);
    if (isUK) tabs.push(['awr', '12-week tracker']);

    const tab = tabs.some((x) => x[0] === tabRaw) ? tabRaw : 'agencies';
    const openAg = open != null ? ags[open] : null;
    const cellAg = cell ? ags.find((a) => a.name === cell.name) : null;

    return html`
      <${PO.PageHeader} title="Contractors" sub=${`${PO.plural(ags.length, 'agency', 'agencies')} with ${PO.plural(nWorkers, 'worker')} at your ${isUS ? 'locations' : 'sites'}. As the ${isIN ? 'principal employer' : isUK ? 'hirer' : 'client'}, their compliance is your risk.`}
        actions=${html`<${PO.Button} onClick=${() => PO.fakeDownload(`Contractor proof pack, ${mLong(LAST)} (ZIP)`)}>Proof pack</${PO.Button}>
          <${PO.Button} kind="primary" onClick=${() => setAdding(true)}>Add agency</${PO.Button}>
          <${PO.Menu} align="right" width=${220} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More actions" />`} items=${[{ label: 'Export agencies (CSV)', icon: 'Download', onClick: () => PO.exportCsv('contractor-agencies', [['Agency', 'Services', 'Status', 'Licence / insurance expiry', 'Workers', 'Monthly invoice', 'Compliance score', 'Invoice held'], ...ags.map((a) => [a.name, a.services, a.statusText, a.licence.expiry, a.isNew ? a.headcount : a.workers.length, a.invoice, a.score, held[a.name] ? 'Yes' : 'No'])]) }, { label: 'Compliance centre', icon: 'ShieldCheck', onClick: () => PO.go('compliance') }]} />`} />

      ${need.tone !== 'green' ? html`<div style="margin-bottom:24px"><${PO.Callout} tone=${need.tone === 'red' ? 'red' : 'amber'} icon=${isUK ? 'CalendarClock' : 'TriangleAlert'} title=${P.contractorNeed.t}
        action=${html`<div class="row">${reminded[need.name] ? html`<span class="t-sm muted">Reminded at ${reminded[need.name]}</span>` : html`<${PO.Button} size="sm" onClick=${() => act.remind(need)}>${P.contractors[0].ask}</${PO.Button}>`}<${PO.Button} size="sm" onClick=${() => act.hold(need)}>${held[need.name] ? 'Release invoice' : P.contractors[0].hold}</${PO.Button}><${PO.Button} size="sm" kind="ghost" onClick=${() => setOpen(0)}>Open agency</${PO.Button}></div>`}>${P.contractorNeed.d}. ${need.issues.filter((i) => i.short !== '12-week rule soon').map((i) => i.text).join('. ')}</${PO.Callout}></div>` : null}

      <${PO.KpiStrip} items=${[
        { label: 'Agencies', icon: 'HardHat', accent: 'amber', value: PO.num(ags.length), sub: `${ags.filter((a) => a.tone !== 'green').length} need attention`, bar: [{ v: ags.filter((a) => a.tone === 'green').length, k: 'ok', title: 'All clear' }, { v: ags.filter((a) => a.tone === 'amber').length, k: 'warn', title: 'Warning' }, { v: ags.filter((a) => a.tone === 'red').length, k: 'bad', title: 'Action needed' }], onClick: () => setTab('agencies') },
        { label: 'Contract workers', icon: 'Users', accent: 'blue', value: PO.num(nWorkers), sub: isIN ? `${PO.pct(nWorkers / (P.people.length + externals))} of everyone at your sites` : `Alongside ${P.people.length} employees`, bar: [{ v: nWorkers, k: 'ok', title: 'Contract workers' }, { v: P.people.length, k: 'mute', title: 'Employees' }], onClick: () => setTab('workers') },
        { label: 'Proofs missing', icon: 'FileWarning', accent: 'red', value: PO.num(missingTotal), tone: missingTotal ? 'red' : '', alert: missingTotal > 0, sub: 'Last 6 months', onClick: () => setTab('proofs') },
        { label: 'Invoices on hold', icon: 'PauseCircle', accent: 'amber', value: PO.num(heldList.length), sub: heldList.length ? PO.money(heldList.reduce((t, a) => t + a.invoice, 0)) + ' held' : 'Nothing held' },
        { label: isIN ? 'Monthly contract spend' : 'Contract spend this period', icon: 'Banknote', accent: 'green', value: PO.money(spendNow, { compact: true }), sub: `${PO.pct(spendNow / Math.max(1, ags.reduce((t, a) => t + a.spend[0], 0)) - 1)} more than ${mLabel(MONTHS[0])}` },
      ]} />

      <div style="margin-top:24px"><${PO.Tabs} tabs=${tabs} value=${tab} onChange=${setTab} /></div>
      <div>
        ${tab === 'agencies' ? html`<${AgenciesTab} P=${P} ags=${ags} held=${held} reminded=${reminded} act=${act} onOpen=${(a) => setOpen(a.idx)} />` : null}
        ${tab === 'workers' ? html`<${WorkersTab} P=${P} rows=${allWorkers} onOpen=${(a) => setOpen(a.idx)} />` : null}
        ${tab === 'proofs' ? html`<${ProofsTab} P=${P} ags=${ags} month=${month} setMonth=${setMonth} act=${act} reminded=${reminded} onOpen=${(a) => setOpen(a.idx)} />` : null}
        ${tab === 'clra' ? html`<${ClraTab} P=${P} ags=${ags} />` : null}
        ${tab === 'coi' ? html`<${CoiTab} P=${P} ags=${ags} onOpen=${(a) => setOpen(a.idx)} />` : null}
        ${tab === 'awr' ? html`<${AwrTab} P=${P} ags=${ags} awr=${awr} setAwr=${setAwr} />` : null}
      </div>

      ${openAg ? html`<${AgencyDrawer} P=${P} a=${openAg} held=${!!held[openAg.name]} reminded=${reminded[openAg.name]} act=${act} awr=${awr} onClose=${() => setOpen(null)} />` : null}
      ${cell && cellAg ? html`<${ProofModal} P=${P} a=${cellAg} m=${cell.m} k=${cell.k} act=${act} onClose=${() => setCell(null)} />` : null}
      ${remindFor ? html`<${RemindModal} P=${P} a=${ags.find((x) => x.name === remindFor.name)} onSend=${sendRemind} onClose=${() => setRemindFor(null)} />` : null}
      <${AddAgency} P=${P} open=${adding} onClose=${() => setAdding(false)} onSave=${(x) => { setAdded([...added, x]); setAdding(false); PO.toast(`${x.name} added. We’ve emailed them a link to upload their documents.`, { icon: 'Building2' }); }} />`;
  }

  /* ---------- tabs ---------- */
  function AgenciesTab({ P, ags, held, reminded, act, onOpen }) {
    const isUS = P.id === 'us';
    const expiries = ags.filter((a) => !a.isNew).map((a) => ({ a, d: a.exp })).sort((x, y) => x.d - y.d);
    return html`<${PO.DataTable} rows=${ags} rowKey=${(a) => a.name} onRow=${onOpen} exportName="agencies" search=${(a) => a.name + ' ' + a.services + ' ' + a.contact[0]} searchPlaceholder="Search agencies"
        filters=${[{ key: 'tone', label: 'Status', options: [['red', 'Action needed'], ['amber', 'Warning'], ['green', 'All clear']], test: (a, v) => a.tone === v }]}
        columns=${[
          { key: 'name', label: 'Agency', sort: (a) => a.name, csv: (a) => a.name, render: (a) => html`<div class="ctr-name"><${Logo} name=${a.name} /><span style="min-width:0"><b>${a.name}</b><small>${a.services}</small></span></div>` },
          { key: 'status', label: 'Status', sort: (a) => a.tone, csv: (a) => a.statusText, render: (a) => html`<div class="col" style="gap:4px;align-items:flex-start">${a.isNew ? html`<span class="t-sm muted">Onboarding</span>` : a.tone === 'green' ? html`<span class="t-sm muted">${a.statusText}</span>` : html`<${PO.Badge} tone=${a.tone} dot>${a.statusText}</${PO.Badge}>`}${reminded[a.name] ? html`<small class="faint">Reminded ${reminded[a.name]}</small>` : null}</div>` },
          { key: 'exp', label: isUS ? 'Insurance until' : 'Licence until', sort: (a) => a.licence.expiry, csv: (a) => a.licence.expiry, render: (a) => html`<div><div class=${a.exp < 0 ? 'w-500' : ''} style=${a.exp < 0 ? 'color:var(--red)' : a.exp <= 30 ? 'color:var(--amber)' : ''}>${PO.date(a.licence.expiry)}</div><small class="faint">${a.exp < 0 ? `Expired ${-a.exp} days ago` : a.exp <= 60 ? `In ${a.exp} days` : a.licence.label}</small></div>` },
          { key: 'workers', label: 'Workers', align: 'r', sort: (a) => (a.isNew ? a.headcount : a.workers.length), render: (a) => html`${a.workers.length ? html`<${Crew} ws=${a.workers} /> ` : null}<span class="tnum" style="margin-left:6px">${a.isNew ? a.headcount : a.workers.length}</span>${a.licence.limit ? html`<small class="faint"> / ${a.licence.limit}</small>` : null}` },
          { key: 'invoice', label: P.id === 'in' ? 'Monthly invoice' : 'Invoice this period', align: 'r', sort: (a) => a.invoice, render: (a) => html`<div class="tnum">${PO.money(a.invoice)}</div>${held[a.name] ? html`<${PO.Badge} tone="amber" dot>On hold</${PO.Badge}>` : null}` },
          { key: 'score', label: 'Compliance', sort: (a) => a.score, render: (a) => (a.isNew ? html`<span class="faint">Awaiting documents</span>` : html`<${ScoreBar} v=${a.score} />`) },
          { key: 'act', label: '', sort: false, csv: false, width: 44, render: (a) => html`<span onClick=${(e) => e.stopPropagation()}><${PO.Menu} align="right" width=${220} trigger=${html`<${PO.IconButton} icon="Ellipsis" title="Actions" size="sm" />`} items=${[
            { label: 'Open agency', icon: 'PanelRightOpen', onClick: () => onOpen(a) },
            { label: 'Send reminder', icon: 'Mail', onClick: () => act.remind(a) },
            { label: held[a.name] ? 'Release invoice' : 'Hold invoice', icon: held[a.name] ? 'PlayCircle' : 'PauseCircle', onClick: () => act.hold(a) },
            '-',
            { label: 'Download proof pack', icon: 'Download', onClick: () => PO.fakeDownload(`${a.name} proof pack`) },
          ]} /></span>` },
        ]} />
      <div class="grid g-main" style="margin-top:24px">
        <${PO.Card} title="Contract spend" icon="Banknote" accent="green" sub=${`${mLabel(MONTHS[0])}–${mLabel(LAST)} ${LAST.slice(0, 4)}`}>
          <${PO.Charts.Bars} labels=${MONTHS.map(mLabel)} series=${[{ name: 'Contract spend', data: MONTHS.map((_, i) => ags.filter((a) => !a.isNew).reduce((t, a) => t + a.spend[i], 0)), color: 'var(--chart-1)' }]} highlight=${MONTHS.length - 1} fmt=${(v) => PO.money(v)} yFmt=${axisFmt} height=${210} />
        </${PO.Card}>
        <${PO.Card} title=${isUS ? 'Insurance renewals' : 'Licence renewals'} icon="BadgeCheck" accent="amber" flush>
          ${expiries.map(({ a, d }) => html`<div class="list-item clickable" onClick=${() => onOpen(a)}><${Logo} name=${a.name} /><div class="grow" style="min-width:0"><div class="w-500 ellipsis">${a.name}</div><small class="faint">${a.licence.label}</small></div><div style="text-align:right"><div class="t-sm tnum">${PO.date(a.licence.expiry, { short: true })}</div><small class="tnum" style=${d < 0 ? 'color:var(--red)' : d <= 30 ? 'color:var(--amber)' : 'color:var(--text-3)'}>${d < 0 ? 'Expired' : d <= 30 ? `In ${d} days` : `In ${Math.round(d / 30)} months`}</small></div></div>`)}
        </${PO.Card}>
      </div>`;
  }

  function WorkersTab({ P, rows, onOpen }) {
    const agNames = [...new Set(rows.map((w) => w.agency))];
    const isUK = P.id === 'uk';
    return html`<${PO.DataTable} rows=${rows} exportName="contract-workers" search=${(w) => w.name + ' ' + w.agency + ' ' + w.role} searchPlaceholder="Search workers" pageSize=${15}
      filters=${[{ key: 'agency', label: 'Agency', options: agNames, test: (w, v) => w.agency === v }, { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (w, v) => w.site === v }]}
      onRow=${(w) => (w.p ? PO.go('people/' + w.id) : onOpen(w.ag))}
      columns=${[
        { key: 'name', label: 'Worker', sort: (w) => w.name, render: (w) => (w.p ? html`<${PO.Who} p=${w.p} sub=${w.id} />` : html`<${PO.Who} name=${w.name} sub=${'Agency worker, ' + w.id} link=${false} />`) },
        { key: 'agency', label: 'Agency', render: (w) => html`<span class="ellipsis" style="display:block;max-width:220px">${w.agency}</span>` },
        { key: 'role', label: 'Role' },
        { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', sort: (w) => PO.site(w.site).name, render: (w) => PO.site(w.site).name, csv: (w) => PO.site(w.site).name },
        { key: 'shift', label: 'Shift', render: (w) => html`<span class="tag">${PO.shiftOf(w.shift).label}</span>`, csv: (w) => PO.shiftOf(w.shift).label },
        { key: 'start', label: 'With you since', sort: (w) => w.start, render: (w) => PO.date(w.start) },
        isUK ? { key: 'weeks', label: 'Weeks on assignment', align: 'r', sort: (w) => -daysTo(w.start), render: (w) => html`<span class="tnum">${Math.floor(-daysTo(w.start) / 7)}</span>`, csv: (w) => Math.floor(-daysTo(w.start) / 7) } : { key: 'gate', label: P.id === 'in' ? 'Gate pass' : 'Badge', render: (w) => html`<span class="tnum t-sm">${w.gate}</span>` },
        { key: 'payroll', label: 'Paid through', render: (w) => html`<span class="t-sm muted">${w.p ? 'Your payroll' : 'Agency payroll'}</span>`, csv: (w) => (w.p ? 'People OS payroll' : 'Agency payroll') },
      ]} />`;
  }

  function ProofsTab({ P, ags, month, setMonth, act, reminded, onOpen }) {
    const list = ags.filter((a) => !a.isNew);
    const cells = list.flatMap((a) => Object.values(a.proofs[month])).filter((c) => c.status !== 'n/a');
    const got = cells.filter((c) => c.status !== 'Missing').length;
    const missingAgs = list.filter((a) => Object.values(a.proofs[month]).some((c) => c.status === 'Missing'));
    return html`<div class="card">
      <div class="card-h"><h3>Proofs for ${mLong(month)}</h3><span class="sub">${got} of ${cells.length} received</span><div class="right row">
        <${PO.Segmented} options=${MONTHS.map((m) => [m, mLabel(m)])} value=${month} onChange=${setMonth} />
        ${missingAgs.length ? html`<${PO.Button} size="sm" onClick=${() => act.remind(missingAgs[0])}>Remind ${missingAgs.length === 1 ? missingAgs[0].name.split(' ').slice(0, 2).join(' ') : missingAgs.length + ' agencies'}</${PO.Button}>` : null}
      </div></div>
      <div class="card-b">
        <${PO.Progress} value=${(got / Math.max(1, cells.length)) * 100} tone=${got === cells.length ? '' : 'amber'} label=${PO.pct(got / Math.max(1, cells.length))} />
        <div class="scroll-x mt-16"><table class="ctr-grid"><thead><tr><th class="l">Agency</th>${PROOFS[P.id].map(([, l]) => html`<th>${l}</th>`)}<th class="l">Reminder</th></tr></thead><tbody>
          ${list.map((a) => html`<tr><td class="l"><a class="ctr-name" href="javascript:void 0" onClick=${() => onOpen(a)}><${Logo} name=${a.name} /><span style="min-width:0"><b style="color:var(--text)">${a.name}</b><small class="row" style="gap:6px"><${Crew} ws=${a.workers} max=${3} />${a.workers.length} workers</small></span></a></td>
            ${PROOFS[P.id].map(([k]) => { const c = a.proofs[month][k]; if (c.status === 'n/a') return html`<td><div class="ctr-cell" style="cursor:default;border-style:dashed">Not engaged</div></td>`; const [cls, ic] = CELL[c.status]; return html`<td><button class=${'ctr-cell ' + cls} onClick=${() => act.cell(a, month, k)}><span class="row" style="gap:3px"><${PO.Icon} n=${ic} size=${11} stroke=${2.4} />${c.status === 'Uploaded' ? 'To check' : c.status}</span>${c.date ? html`<small>${PO.date(c.date, { short: true, noYear: true })}</small>` : null}</button></td>`; })}
            <td class="l">${reminded[a.name] ? html`<span class="t-sm">Today ${reminded[a.name]}</span>` : html`<span class="faint t-sm">—</span>`}</td></tr>`)}
        </tbody></table></div>
        <div class="row mt-16"><${Legend} /><span class="right faint t-sm">${P.id === 'in' ? 'Agencies upload by the 5th. PF and ESI must be deposited by the 15th.' : P.id === 'us' ? 'Agencies upload with each invoice. Insurance must be current before any shift.' : 'Agencies upload with each four-weekly invoice.'}</span></div>
      </div></div>`;
  }

  function ClraTab({ P, ags }) {
    const [gen, setGen] = PO.useCoState('contractors.registers', {});
    const live = ags.filter((a) => !a.isNew);
    const n = live.reduce((t, a) => t + a.workers.length, 0);
    const pfMissing = live.some((a) => a.proofs[LAST].pf.status === 'Missing');
    const anyExpired = live.some((a) => a.exp < 0);
    const REG = [
      ['XII', 'Register of contractors', 'Principal employer', `${live.length} contractors`, 'ok'],
      ['XIII', 'Register of workmen employed by contractor', 'Contractor', `${n} workmen`, 'ok'],
      ['XIV', 'Employment cards', 'Contractor', `Issued to ${n} workmen`, 'ok'],
      ['XVI', 'Muster roll', 'Contractor', mLong(LAST), 'ok'],
      ['XVII', 'Register of wages', 'Contractor', mLong(LAST), 'ok'],
      ['XIX', 'Wage slips', 'Contractor', mLong(LAST), 'ok'],
      ['XX', 'Register of deductions for damage or loss', 'Contractor', '2 entries this year', 'ok'],
      ['XXI', 'Register of fines', 'Contractor', 'Nil', 'ok'],
      ['XXII', 'Register of advances', 'Contractor', '4 entries this year', 'ok'],
      ['XXIII', 'Register of overtime', 'Contractor', mLong(LAST), pfMissing ? 'wait' : 'ok'],
      ['XXIV', 'Half-yearly return by contractor', 'Contractor', 'Apr–Sep 2026, due 30 Oct', 'due'],
      ['XXV', 'Annual return of principal employer', 'Principal employer', '2026, due 15 Feb 2027', 'later'],
    ];
    const tone = { ok: ['green', 'Up to date'], wait: ['amber', 'Waiting on contractor'], due: ['amber', 'Due 30 Oct'], later: ['slate', 'Not due yet'] };
    const OBL = [
      { t: 'Registration certificate (Form II) displayed at every site', meta: 'Reg. PUN/CLRA/PE/2019/0412' },
      { t: 'Every contractor holds a valid licence (Form VI)', meta: anyExpired ? 'One has expired' : 'Deccan renews by 28 Oct' },
      { t: 'PF and ESI challans checked before paying invoices', meta: pfMissing ? 'Shield PF for Sep pending' : 'All in for Sep' },
      { t: 'Wages disbursed in front of our representative (Sec 21)', meta: 'Supervisor signs Form XVII' },
      { t: 'Canteen, rest rooms, drinking water and first aid at sites', meta: 'Checked in Sep site audits' },
      { t: 'Same pay as permanent staff for the same work', meta: 'Guards S1 grade parity' },
      { t: 'Half-yearly return (Form XXIV) collected', meta: 'Due 30 Oct' },
      { t: 'Annual return (Form XXV) filed', meta: 'Due 15 Feb 2027' },
    ];
    const init = { 0: true, 1: !anyExpired, 2: !pfMissing, 3: true, 4: true, 5: true, 6: false, 7: false };
    const [ob, setOb] = PO.useCoState('contractors.obligations', init);
    const cap = 120;
    return html`<div class="grid g-main">
      <div class="col" style="gap:16px">
        <div class="t-sm muted">Registers are built from the attendance, wages and overtime of every contract worker. They stay in the CLRA formats until Maharashtra notifies its OSH Code forms.</div>
        <${PO.DataTable} rows=${REG.map(([f, name, by, period, st]) => ({ id: f, f, name, by, period, st }))} exportName="clra-registers" compact
          columns=${[
            { key: 'f', label: 'Form', width: 70, render: (r) => html`<span class="tnum muted">${r.f}</span>` },
            { key: 'name', label: 'Register', render: (r) => html`<div><div class="w-500">${r.name}</div><small class="faint">Kept by ${r.by.toLowerCase()}, ${r.period}</small></div>` },
            { key: 'st', label: 'Status', render: (r) => (r.st === 'ok' || r.st === 'later' ? html`<span class="t-sm muted">${tone[r.st][1]}</span>` : html`<${PO.Badge} tone=${tone[r.st][0]} dot>${tone[r.st][1]}</${PO.Badge}>`), csv: (r) => tone[r.st][1] },
            { key: 'gen', label: 'Generated', render: (r) => (gen[r.f] ? html`<span class="t-sm">Today</span>` : html`<span class="faint t-sm">${r.st === 'later' ? '—' : PO.date('2026-10-01', { short: true })}</span>`), csv: (r) => (gen[r.f] ? PO.TODAY : '2026-10-01') },
            { key: 'a', label: '', sort: false, csv: false, align: 'r', render: (r) => html`<div class="row" style="justify-content:flex-end;gap:4px"><${PO.Button} size="sm" kind="ghost" onClick=${() => { setGen({ ...gen, [r.f]: true }); PO.toast(`Form ${r.f} generated for ${r.period}`); }}>Generate</${PO.Button}><${PO.IconButton} icon="Download" size="sm" title="Download PDF" onClick=${() => PO.fakeDownload(`Form ${r.f}, ${r.name} (PDF)`)} /></div>` },
          ]} />
      </div>
      <div class="col" style="gap:16px">
        <${PO.Card} title="Contract labour vs licence" icon="ShieldCheck" accent="green" sub="Form VI limits">
          <div class="col" style="gap:14px">
            ${live.map((a) => html`<div><div class="row t-sm" style="margin-bottom:4px"><span class="grow ellipsis">${a.name}</span><b class="tnum">${a.workers.length} / ${a.licence.limit}</b></div><${PO.Progress} value=${(a.workers.length / a.licence.limit) * 100} tone=${a.workers.length / a.licence.limit > 0.9 ? 'red' : a.workers.length / a.licence.limit > 0.75 ? 'amber' : ''} /></div>`)}
            <div class="divider" style="margin:2px 0"></div>
            <div><div class="row t-sm" style="margin-bottom:4px"><b class="grow">Principal employer registration</b><b class="tnum">${n} / ${cap}</b></div><${PO.Progress} value=${(n / cap) * 100} tone=${n / cap > 0.9 ? 'red' : ''} /><small class="faint">Room for ${cap - n} more contract workers before you amend the registration.</small></div>
          </div>
        </${PO.Card}>
        <${PO.Card} title="Principal employer duties" icon="ClipboardCheck" accent="green" sub=${`${Object.values(ob).filter(Boolean).length} of ${OBL.length} done`}>
          <div class="col" style="gap:0">${OBL.map((o, i) => html`<div class="row" style="padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start;gap:10px"><label class="check" style="margin-top:2px"><input type="checkbox" checked=${!!ob[i]} onChange=${() => { setOb({ ...ob, [i]: !ob[i] }); PO.toast(ob[i] ? 'Marked as not done' : 'Marked as done'); }} /></label><div class="grow"><div class=${ob[i] ? 'muted' : 'w-500'}>${o.t}</div><small class=${ob[i] ? 'faint' : ''} style=${ob[i] ? '' : 'color:var(--amber)'}>${o.meta}</small></div></div>`)}</div>
        </${PO.Card}>
      </div>
    </div>`;
  }

  function CoiTab({ P, ags, onOpen }) {
    const [req, setReq] = PO.useCoState('contractors.requested', {});
    const live = ags.filter((a) => !a.isNew);
    const ytd = (a) => a.spend.reduce((t, v) => t + v, 0) * 1.6;
    const ask = (a, what) => { setReq({ ...req, [a.name + what]: true }); PO.toast(`${what} requested from ${a.contact[0]} by text and email`, { icon: 'Send' }); };
    return html`<div class="col" style="gap:16px">
      <div class="t-sm muted">No certificate, no shift: your catering clients require $1M general liability from anyone serving at their events, so agency workers can’t be scheduled while their agency’s certificate has lapsed.</div>
      <${PO.DataTable} rows=${live} rowKey=${(a) => a.name} onRow=${onOpen} exportName="certificates-of-insurance"
        columns=${[
          { key: 'name', label: 'Vendor', sort: (a) => a.name, render: (a) => html`<div class="ctr-name"><${Logo} name=${a.name} /><span><b>${a.name}</b><small>${a.contact[0]}</small></span></div>` },
          { key: 'carrier', label: 'Carrier and policy', render: (a) => html`<div><div>${a.coi.carrier}</div><small class="faint tnum">${a.coi.policy}</small></div>`, csv: (a) => `${a.coi.carrier} ${a.coi.policy}` },
          { key: 'gl', label: 'Liability limits', render: (a) => a.coi.gl, csv: (a) => a.coi.gl },
          { key: 'wc', label: 'Workers’ comp', render: (a) => html`<span class="t-sm">${a.coi.wc}</span>`, csv: (a) => a.coi.wc },
          { key: 'exp', label: 'COI expiry', sort: (a) => a.licence.expiry, render: (a) => html`<div class="col" style="gap:3px;align-items:flex-start"><span>${PO.date(a.licence.expiry)}</span><${PO.Status} s=${a.exp < 0 ? 'Expired' : a.exp <= 30 ? 'Expiring soon' : 'Verified'} /></div>`, csv: (a) => a.licence.expiry },
          { key: 'w9', label: 'W-9', render: (a) => html`<div class="col" style="gap:3px;align-items:flex-start"><${PO.Status} s=${a.w9.status === 'Missing' ? 'Missing' : 'Verified'} /><small class="faint tnum">${a.w9.tin}</small></div>`, csv: (a) => a.w9.status },
          { key: 'a', label: '', sort: false, csv: false, align: 'r', render: (a) => html`<span onClick=${(e) => e.stopPropagation()} class="row" style="justify-content:flex-end;gap:4px">
            ${a.exp < 0 ? (req[a.name + 'New COI'] ? html`<span class="t-sm muted">COI requested</span>` : html`<${PO.Button} size="sm" onClick=${() => ask(a, 'New COI')}>Request COI</${PO.Button}>`) : null}
            ${a.w9.status === 'Missing' ? (req[a.name + 'W-9'] ? html`<span class="t-sm muted">W-9 requested</span>` : html`<${PO.Button} size="sm" onClick=${() => ask(a, 'W-9')}>Request W-9</${PO.Button}>`) : null}
            ${a.exp >= 0 && a.w9.status !== 'Missing' ? html`<${PO.IconButton} icon="Download" size="sm" title="Download COI" onClick=${() => PO.fakeDownload(`${a.name} certificate of insurance (PDF)`)} />` : null}</span>` },
        ]} />
      <div class="grid g-2">
        <${PO.Card} title="1099-NEC for 2026" icon="FileCheck2" accent="violet" sub="Due to vendors and the IRS by Feb 1, 2027">
          ${live.map((a) => html`<div class="row" style="padding:8px 0;border-bottom:1px solid var(--border)"><div class="grow"><div class="w-500">${a.name}</div><small class="faint">${a.w9.entity}, paid ${PO.money(ytd(a), { compact: true })} this year</small></div>${a.w9.status === 'Missing' ? html`<${PO.Badge} tone="amber" dot>Needs W-9</${PO.Badge}>` : html`<span class="t-sm muted">Ready</span>`}</div>`)}
          <p class="faint t-sm mt-12">Vendors paid $600 or more get a 1099-NEC. People OS files them through IRIS in January.</p>
        </${PO.Card}>
        <${PO.Card} title="Worker classification check" icon="HardHat" accent="amber" sub="Texas Workforce Commission test">
          <${PO.Checklist} items=${[
            { t: 'Agency sets pay, schedules its own workers', done: true, meta: 'All 3' },
            { t: 'Agency supplies uniforms and equipment', done: true, meta: 'Lone Star, Hill Country' },
            { t: 'No agency worker supervised like an employee', done: false, meta: 'Review couriers' },
            { t: 'Invoices, not timesheets, drive payment', done: true, meta: 'Net 15' },
          ]} />
        </${PO.Card}>
      </div>
    </div>`;
  }

  function AwrTab({ P, ags, awr, setAwr }) {
    const rows = ags.filter((a) => a.awr).flatMap((a) => a.workers.map((w) => {
      const q = PO.addDays(w.start, 84);
      const weeks = Math.min(12, Math.floor(-daysTo(w.start) / 7));
      const d = daysTo(q);
      const extra = Math.round((w.nights * 1.5 + 160 * 12.71 * 0.0125) * 100) / 100;
      const state = d <= 0 ? (awr[w.id] || d < -21 ? 'parity' : 'qualified') : d <= 14 ? (awr[w.id] ? 'ready' : 'soon') : 'building';
      return { ...w, agency: a.name, q, weeks, d, extra, state };
    })).sort((x, y) => x.d - y.d);
    const ST = { parity: ['green', 'Equal pay applied'], qualified: ['red', 'Qualified, not on parity'], ready: ['green', 'Parity confirmed'], soon: ['amber', 'Reaches 12 weeks soon'], building: ['slate', 'Building weeks'] };
    const soon = rows.filter((r) => r.state === 'soon');
    const confirm = (ids) => { const x = { ...awr }; ids.forEach((id) => (x[id] = true)); setAwr(x); PO.toast(`Equal pay confirmed with the agency for ${PO.plural(ids.length, 'worker')} from week 12`, { icon: 'Scale', action: { label: 'Undo', run: () => setAwr(awr) } }); };
    return html`<div class="col" style="gap:16px">
      <${PO.KpiStrip} items=${[
        { label: 'Agency workers', icon: 'HardHat', accent: 'amber', value: PO.num(rows.length), sub: 'Covered by AWR', bar: [{ v: rows.filter((r) => r.state === 'parity' || r.state === 'ready').length, k: 'ok', title: 'On equal pay' }, { v: soon.length + rows.filter((r) => r.state === 'qualified').length, k: 'warn', title: 'Due or overdue' }, { v: rows.filter((r) => r.state === 'building').length, k: 'mute', title: 'Building weeks' }] },
        { label: 'On equal pay', icon: 'Banknote', accent: 'green', value: PO.num(rows.filter((r) => r.state === 'parity' || r.state === 'ready').length), sub: 'Week 12 passed or confirmed' },
        { label: 'Reach 12 weeks in 14 days', icon: 'CalendarClock', accent: 'amber', value: PO.num(soon.length), alert: soon.length > 0, sub: soon.length ? `First on ${PO.date(soon[0].q)}` : 'None pending' },
        { label: 'Extra cost from week 12', icon: 'Banknote', accent: 'green', value: PO.money(rows.filter((r) => r.state !== 'building').reduce((t, r) => t + r.extra, 0)), sub: 'Per four-week period' },
      ]} />
      <div class="row" style="align-items:flex-start;gap:16px"><div class="t-sm muted grow">Agency Workers Regulations 2010: after 12 weeks in the same role with you, agency workers get the same basic pay, night premium, overtime rates and holiday as your own cleaners. Holiday rises to 28 days. Breaks of up to 6 weeks don’t reset the clock. Access to the canteen and your vacancies applies from day one.</div>${soon.length ? html`<${PO.Button} size="sm" onClick=${() => confirm(soon.map((r) => r.id))}>Confirm parity for ${soon.length}</${PO.Button}>` : null}</div>
      <${PO.DataTable} rows=${rows} exportName="awr-12-week-tracker" search=${(r) => r.name + ' ' + r.agency}
        filters=${[{ key: 'state', label: 'Status', options: Object.entries(ST).map(([k, v]) => [k, v[1]]), test: (r, v) => r.state === v }]}
        columns=${[
          { key: 'name', label: 'Agency worker', sort: (r) => r.name, render: (r) => html`<${PO.Who} name=${r.name} sub=${r.agency} link=${false} />` },
          { key: 'site', label: 'Site', render: (r) => html`<span class="ellipsis" style="display:block;max-width:150px">${PO.site(r.site).name}</span>`, csv: (r) => PO.site(r.site).name },
          { key: 'start', label: 'Started', sort: (r) => r.start, render: (r) => html`<span style="white-space:nowrap">${PO.date(r.start, { short: true })}</span>` },
          { key: 'weeks', label: 'Weeks', sort: (r) => r.weeks, render: (r) => html`<div class="row" style="gap:8px"><span class="ctr-weeks">${Array.from({ length: 12 }, (_, i) => html`<i class=${i < r.weeks ? (r.weeks >= 12 ? 'q' : 'on') : ''}></i>`)}</span><span class="tnum t-sm">${r.weeks}/12</span></div>` },
          { key: 'q', label: 'Qualifies', sort: (r) => r.q, render: (r) => html`<div style="white-space:nowrap"><div>${PO.date(r.q, { short: true })}</div><small class="faint">${r.d > 0 ? `in ${r.d} days` : r.d === 0 ? 'today' : `${-r.d} days ago`}</small></div>` },
          { key: 'pay', label: 'Pay from week 12', render: (r) => html`<span class="t-sm" style="white-space:nowrap">£12.71 + ${r.nights ? '£1.50 nights' : 'OT 1.5×'}</span>`, csv: () => '£12.71 + premiums' },
          { key: 'extra', label: 'Extra a period', align: 'r', sort: (r) => r.extra, render: (r) => html`<span class="tnum">${PO.money(r.extra)}</span>` },
          { key: 'state', label: 'Status', render: (r) => (ST[r.state][0] === 'green' || ST[r.state][0] === 'slate' ? html`<span class="t-sm muted">${ST[r.state][1]}</span>` : html`<${PO.Badge} tone=${ST[r.state][0]} dot>${ST[r.state][1]}</${PO.Badge}>`), csv: (r) => ST[r.state][1] },
          { key: 'a', label: '', sort: false, csv: false, align: 'r', render: (r) => (r.state === 'soon' || r.state === 'qualified' ? html`<${PO.Button} size="sm" onClick=${() => confirm([r.id])}>Confirm</${PO.Button}>` : null) },
        ]} />
    </div>`;
  }

  /* ---------- drawer ---------- */
  function AgencyDrawer({ P, a, held, reminded, act, awr, onClose }) {
    const [t, setT] = useState('overview');
    const isUS = P.id === 'us';
    const docs = docsOf(P, a);
    const uploads = MONTHS.flatMap((m) => PROOFS[P.id].map(([k, l]) => ({ m, k, l, ...a.proofs[m][k] }))).filter((c) => c.date).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 6);
    const activity = [
      reminded ? { icon: 'Mail', tone: 'green', title: `Reminder sent to ${a.contact[0]}`, sub: 'By email, with an SMS heads-up', right: `Today ${reminded}` } : null,
      held ? { icon: 'PauseCircle', tone: 'amber', title: `Invoice of ${PO.money(a.invoice)} put on hold`, sub: 'Skipped in the next payment run', right: 'Today' } : null,
      ...uploads.map((u) => ({ icon: u.status === 'Late' ? 'Clock' : 'Upload', tone: u.status === 'Late' ? 'amber' : u.status === 'Verified' ? 'green' : 'blue', title: `${u.l} for ${mLong(u.m)} ${u.byYou ? 'marked received by you' : 'uploaded'}`, sub: u.status === 'Verified' ? 'Checked by People OS' : u.status === 'Late' ? 'After the 5th' : 'Waiting for a check', right: PO.date(u.date, { short: true }) })),
      { icon: 'FileSignature', title: 'Agreement signed', sub: a.services, right: PO.date(a.since, { short: true }) },
    ].filter(Boolean);
    const workers = a.isNew ? a.headcount : a.workers.length;
    return html`<${PO.Drawer} open size="lg" onClose=${onClose}
      head=${html`<div class="ctr-head"><${Logo} name=${a.name} lg /><div style="min-width:0"><h3 class="ellipsis">${a.name}</h3><div class="row t-sm faint" style="gap:8px"><${PO.Badge} tone=${a.isNew ? 'slate' : a.tone} dot>${a.isNew ? 'Onboarding' : a.statusText}</${PO.Badge}>${held ? html`<${PO.Badge} tone="amber" dot>Invoice on hold</${PO.Badge}>` : null}<span class="ellipsis">${a.services}</span></div></div></div>`}
      footer=${html`<${PO.Button} onClick=${() => PO.fakeDownload(`${a.name} proof pack`)}>Proof pack</${PO.Button}><span class="grow"></span>
        <${PO.Button} onClick=${() => act.hold(a)}>${held ? 'Release invoice' : 'Hold invoice'}</${PO.Button}>
        <${PO.Button} kind="primary" onClick=${() => act.remind(a)}>${reminded ? 'Remind again' : 'Send reminder'}</${PO.Button}>`}>
      ${a.issues.length ? html`<div class="col" style="gap:6px;margin-bottom:16px">${a.issues.map((i) => html`<div class="row t-sm"><${PO.Badge} tone=${i.tone} dot></${PO.Badge}><span class="w-500">${i.text}</span></div>`)}</div>` : a.isNew ? html`<div class="t-sm muted" style="margin-bottom:16px">Waiting for their documents. ${a.contact[0]} has a secure link to upload the licence, agreement and first month’s proofs.</div>` : null}
      <${PO.KpiStrip} items=${[
        { label: 'Workers with you', icon: 'HardHat', accent: 'amber', value: PO.num(workers), unit: a.licence.limit ? '/' + a.licence.limit : '', sub: a.licence.limit ? 'Licence limit' : 'On site this month' },
        { label: P.id === 'in' ? 'Monthly invoice' : 'Invoice this period', icon: 'FileText', accent: 'blue', value: PO.money(a.invoice, { compact: true }), sub: held ? 'On hold' : 'Due in 15 days', alert: !!held },
        { label: 'Compliance score', icon: 'ShieldCheck', accent: 'green', value: a.isNew ? '—' : String(a.score), tone: a.isNew ? '' : a.score >= 75 ? '' : 'red', sub: 'Proofs, licence, insurance' },
        { label: isUS ? 'Insurance until' : 'Licence until', icon: 'BadgeCheck', accent: 'amber', value: PO.date(a.licence.expiry, { short: true }), tone: a.exp < 0 ? 'red' : '', sub: a.exp < 0 ? `Expired ${-a.exp} days ago` : `${a.exp} days left` },
      ]} />
      <div class="mt-16"><${PO.Tabs} tabs=${[['overview', 'Proofs'], ['workers', 'Workers', workers], ['docs', 'Licences & documents', docs.length], ['activity', 'Activity']]} value=${t} onChange=${setT} /></div>
      <div class="mt-16">
        ${t === 'overview' ? html`<div class="col" style="gap:16px">
          <div class="row"><b class="w-600">Monthly proofs</b><span class="faint t-sm">Last 6 months; select a cell for details</span></div>
          <${ProofGrid} P=${P} a=${a} onCell=${act.cell} />
          <${Legend} />
          <div class="divider"></div>
          <${PO.KV} items=${[['Contact', a.contact[0]], ['Phone', html`<span class="tnum">${a.contact[1]}</span>`], ['Services', a.services], [P.id === 'us' ? 'Locations' : 'Sites', [...new Set(a.workers.map((w) => PO.site(w.site).name))].join(', ') || '—'], ['With you since', PO.date(a.since)], [a.licence.label, a.licence.no], P.id === 'in' ? ['PF / ESI codes', html`<span class="tnum">${a.codes.pf}, ${a.codes.esi}</span>`] : null]} />
        </div>` : null}
        ${t === 'workers' ? (a.workers.length ? html`<${PO.DataTable} bare rows=${a.workers} compact pageSize=${12} search=${(w) => w.name} exportName=${'workers-' + abbr(a.name).toLowerCase()} onRow=${(w) => w.p && PO.go('people/' + w.id)}
            columns=${[
              { key: 'name', label: 'Worker', sort: (w) => w.name, render: (w) => (w.p ? html`<${PO.Who} p=${w.p} size="sm" sub=${w.id} />` : html`<${PO.Who} name=${w.name} size="sm" sub=${w.id} link=${false} />`) },
              { key: 'site', label: 'Site', render: (w) => PO.site(w.site).name, csv: (w) => PO.site(w.site).name },
              { key: 'shift', label: 'Shift', render: (w) => PO.shiftOf(w.shift).label, csv: (w) => PO.shiftOf(w.shift).label },
              { key: 'start', label: 'Since', sort: (w) => w.start, render: (w) => PO.date(w.start, { short: true }) },
              a.awr ? { key: 'wk', label: 'Weeks', align: 'r', render: (w) => html`<span class="tnum">${Math.min(99, Math.floor(-daysTo(w.start) / 7))}</span>` } : { key: 'gate', label: P.id === 'in' ? 'Gate pass' : 'Badge', render: (w) => html`<span class="tnum">${w.gate}</span>` },
            ]} />` : html`<${PO.Empty} icon="Users" title="No workers listed yet" text="Workers appear here once the agency shares its deployment list." />`) : null}
        ${t === 'docs' ? html`<div>${docs.map((d) => html`<div class="ctr-doc"><div class="grow" style="min-width:0"><div class="w-500">${d.name}</div><small class="faint ellipsis" style="display:block">${d.meta}</small></div><${PO.Status} s=${d.status} /><${PO.IconButton} icon="Eye" size="sm" title="Preview" onClick=${() => PO.toast(`${d.name} opened in preview`, { icon: 'Eye' })} /><${PO.IconButton} icon="Download" size="sm" title="Download" onClick=${() => PO.fakeDownload(`${a.name}: ${d.name}`)} /></div>`)}</div>` : null}
        ${t === 'activity' ? html`<${PO.Timeline} items=${activity} />` : null}
      </div>
    </${PO.Drawer}>`;
  }

  function ProofModal({ P, a, m, k, act, onClose }) {
    const c = a.proofs[m][k];
    const label = PROOFS[P.id].find((x) => x[0] === k)[1];
    const missing = c.status === 'Missing';
    return html`<${PO.Modal} open icon=${missing ? 'FileX2' : 'FileCheck2'} tone=${missing ? 'red' : 'green'} title=${`${label}, ${mLong(m)}`} onClose=${onClose}
      footer=${missing ? html`<${PO.Button} onClick=${() => { onClose(); act.remind(a); }}>Remind ${a.contact[0].split(' ')[0]}</${PO.Button}><${PO.Button} kind="primary" onClick=${() => act.receive(a, m, k)}>Mark as received</${PO.Button}>` : html`<${PO.Button} icon="Download" onClick=${() => PO.fakeDownload(`${a.name} ${label}, ${mLong(m)} (PDF)`)}>Download</${PO.Button}><${PO.Button} kind="primary" onClick=${() => (c.status === 'Uploaded' && !c.byYou ? act.verify(a, m, k) : onClose())}>${c.status === 'Uploaded' && !c.byYou ? 'Mark verified' : 'Done'}</${PO.Button}>`}>
      ${missing ? html`<p class="muted">${a.name} hasn’t uploaded this yet. ${P.id === 'in' ? 'Without the challan you can’t prove PF was deposited for their workers, and as principal employer you would owe it.' : P.id === 'us' ? 'Without a current certificate their workers aren’t insured at your events.' : 'Without it you can’t check pay and holiday for their workers.'}</p>
        <div class="mt-12"><${PO.KV} items=${[['Agency', a.name], ['Workers covered', a.workers.length], ['Due', `5 ${mLabel(nextYm(m))}`], ['Invoice at stake', PO.money(a.invoice)]]} /></div>` :
      html`<${PO.KV} items=${[['Agency', a.name], ['Status', html`<${PO.Badge} tone=${CELL[c.status][0] === 'ok' ? 'green' : CELL[c.status][0] === 'late' ? 'amber' : 'slate'} dot>${c.status === 'Uploaded' ? 'Uploaded, to check' : c.status === 'Late' ? 'Uploaded late' : 'Verified'}</${PO.Badge}>`], ['Uploaded', `${PO.date(c.date)} ${c.byYou ? 'by you' : `by ${a.contact[0]}`}`], ...proofRef(P, a, m, k)]} />`}
    </${PO.Modal}>`;
  }

  function RemindModal({ P, a, onSend, onClose }) {
    const me = P.byId[P.hrId];
    const miss = a.issues.map((i) => '• ' + i.text).join('\n');
    const greet = P.id === 'in' ? 'Dear' : 'Hi';
    const text = `${greet} ${a.contact[0].split(' ')[0]}, this is ${me.first} from ${P.company.short}.\n\n${miss ? `We’re still waiting on:\n${miss}\n\n` : `Please upload your ${mLabel(nextYm(LAST))} proofs by the 5th.\n\n`}You can upload straight from this link: people.os/u/${abbr(a.name).toLowerCase()}${P.id}-${a.idx + 7}k2\n${a.issues.length ? 'We’ll release your invoice as soon as they’re in.' : 'Thank you!'}`;
    const [msg, setMsg] = useState(text);
    return html`<${PO.Modal} open title=${`Remind ${a.contact[0]}`} onClose=${onClose} footer=${html`<span class="faint t-sm" style="margin-right:auto">An SMS heads-up goes to ${a.contact[1]}</span><${PO.Button} onClick=${onClose}>Cancel</${PO.Button}><${PO.Button} kind="primary" onClick=${() => onSend(a)}>Send email</${PO.Button}>`}>
      <div class="ctr-wa"><div class="row t-sm faint" style="margin-bottom:8px;flex-wrap:wrap;gap:6px">To <b class="w-500" style="color:var(--text)">${a.contact[0]}</b> at ${a.name}. Subject <b class="w-600" style="color:var(--text)">${a.issues.length ? 'Documents pending for your invoice' : `${mLabel(nextYm(LAST))} compliance proofs`}</b></div><div class="ctr-bubble">${msg}</div></div>
      <div class="field mt-12"><label>Edit message</label><textarea class="textarea" rows="6" value=${msg} onInput=${(e) => setMsg(e.target.value)}></textarea></div>
    </${PO.Modal}>`;
  }

  function AddAgency({ P, open, onClose, onSave }) {
    const blank = { name: '', services: '', contact: '', phone: '', workers: '', invoice: '', licenceNo: '', expiry: '2027-03-31' };
    const [f, setF] = useState(blank);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const ok = f.name.trim() && f.contact.trim();
    return html`<${PO.Drawer} open=${open} title="Add an agency" sub="They get an email with a secure link to upload their documents" onClose=${onClose}
      footer=${html`<${PO.Button} onClick=${onClose}>Cancel</${PO.Button}><${PO.Button} kind="primary" disabled=${!ok} onClick=${() => { onSave(f); setF(blank); }}>Add agency</${PO.Button}>`}>
      <div class="col" style="gap:14px">
        <${PO.Field} label="Agency name"><input class="input" value=${f.name} onInput=${set('name')} placeholder=${P.id === 'in' ? 'e.g. Pune Guard Force Pvt Ltd' : P.id === 'us' ? 'e.g. Austin Event Pros LLC' : 'e.g. Salford Staffing Ltd'} /></${PO.Field}>
        <${PO.Field} label="What they do for you"><input class="input" value=${f.services} onInput=${set('services')} placeholder="e.g. Weekend event staff" /></${PO.Field}>
        <div class="grid g-2"><${PO.Field} label="Contact person"><input class="input" value=${f.contact} onInput=${set('contact')} /></${PO.Field}><${PO.Field} label="Mobile"><input class="input" value=${f.phone} onInput=${set('phone')} /></${PO.Field}></div>
        <div class="grid g-2"><${PO.Field} label="Workers with you"><input class="input" type="number" value=${f.workers} onInput=${set('workers')} /></${PO.Field}><${PO.Field} label=${`Monthly invoice (${P.company.currency})`}><input class="input" type="number" value=${f.invoice} onInput=${set('invoice')} /></${PO.Field}></div>
        <div class="grid g-2"><${PO.Field} label=${P.id === 'in' ? 'CLRA licence number' : P.id === 'us' ? 'Insurance policy' : 'Agency registration'}><input class="input" value=${f.licenceNo} onInput=${set('licenceNo')} /></${PO.Field}><${PO.Field} label="Valid until"><input class="input" type="date" value=${f.expiry} onInput=${set('expiry')} /></${PO.Field}></div>
        <div class="t-sm muted"><b class="w-600" style="color:var(--text)">They’ll be asked for</b> ${P.id === 'in' ? 'CLRA licence (Form VI), PF and ESI codes, service agreement and each month’s PF/ESI challans, wage sheet and attendance.' : P.id === 'us' ? 'A certificate of insurance naming you as additional insured, a W-9 and a signed services agreement.' : 'Agency registration, insurance, right to work confirmations and four-weekly timesheets and payslips.'}</div>
      </div>
    </${PO.Drawer}>`;
  }

  PO.route('contractors', Contractors, { title: 'Contractors' });
  PO.navCount('contractors', (state, P) => {
    const rec = PO.coGet(state, 'contractors.received', {});
    return build(P).filter((a) => MONTHS.some((m) => Object.entries(a.proofs[m]).some(([k, c]) => c.status === 'Missing' && !rec[`${a.name}|${m}|${k}`]))).length;
  }, true);
})();
