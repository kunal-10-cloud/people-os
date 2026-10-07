/* People OS: salary & compensation (routes `compensation`, `tax`, `benefits`).
   Structures per role with statutory checks, pay bands with compa-ratio, a revision cycle planner with
   take-home preview, country-specific tax & declarations, and benefits enrolment. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;
  const { Button, Card, Badge, Icon, Stat, Callout, DataTable, Drawer, Modal, Who, Avatar, Tabs, KV, Field, Select, Segmented, Progress } = PO;
  const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const fine = (n) => PO.money(n, { cents: !PO.isIN() });
  const sum = (a, f) => r2(a.reduce((t, x) => t + (f ? f(x) : x), 0));

  document.head.insertAdjacentHTML('beforeend', `<style>
  .cp-split { display:flex; height:6px; border-radius:2px; overflow:hidden; background:var(--surface-3); min-width:120px; }
  .cp-split i { display:block; height:100%; }
  .cp-band { position:relative; height:34px; }
  .cp-band .rng { position:absolute; top:12px; height:10px; border-radius:6px; background:color-mix(in srgb, var(--brand) 14%, transparent); border:1px solid color-mix(in srgb, var(--brand) 30%, transparent); }
  .cp-band .mid { position:absolute; top:6px; width:2px; height:22px; background:var(--brand); border-radius:1px; }
  .cp-band .dot { position:absolute; width:9px; height:9px; border-radius:50%; border:1.5px solid var(--surface); transform:translate(-50%, 0); }
  .cp-grade { display:grid; grid-template-columns:150px minmax(0,1fr) 92px 92px 70px; gap:14px; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border); cursor:pointer; }
  .cp-grade:hover { background:var(--hover); }
  .cp-grade:last-child { border-bottom:none; }
  .cp-pct { width:64px; height:28px; text-align:right; }
  .cp-lbl { position:absolute; top:0; font-size:11px; color:var(--text-3); transform:translateX(-50%); white-space:nowrap; }
  .cp-matrix { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
  .cp-matrix > div { padding:10px 12px; border-left:1px solid var(--border); }
  .cp-matrix > div:first-child { border-left:none; padding-left:0; }
  .cp-doc { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:20px 22px; box-shadow:var(--shadow-sm); font-size:12.5px; }
  .cp-doc h4 { text-align:center; font-size:13px; margin-bottom:12px; }
  .cp-line { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed var(--border); }
  .cp-plan { padding:14px; border:1px solid var(--border); border-radius:var(--r-lg); background:var(--surface); }
  </style>`);

  /* ---------- shared pay metrics ---------- */
  const isHourly = (P, p) => !!P.roles[p.role].rate;
  /** Base pay used for bands and revisions: IN monthly fixed; US/UK annualised base. */
  function basePay(P, p) {
    const r = P.roles[p.role];
    if (P.id === 'in') return p.pay.structure.total;
    if (r.rate) return Math.round(r.rate * (P.id === 'us' ? 2080 : 1950));
    return Math.round(r.salary * (P.id === 'us' ? 26 : 13));
  }
  const baseLabel = (P) => (P.id === 'in' ? 'Monthly fixed pay' : 'Annual base pay');
  const annualOf = (P, p) => (P.id === 'in' ? basePay(P, p) * 12 : basePay(P, p));
  function bandsOf(P) {
    const grades = [...new Set(P.people.map((p) => p.grade))].sort();
    return grades.map((g) => {
      const ppl = P.people.filter((p) => p.grade === g);
      const vals = ppl.map((p) => basePay(P, p)).sort((a, b) => a - b);
      const med = vals[Math.floor(vals.length / 2)];
      const step = P.id === 'in' ? 500 : P.id === 'us' ? 500 : 250;
      const mid = Math.round((med * 1.03) / step) * step;
      return { g, ppl, mid, min: Math.round((mid * 0.82) / step) * step, max: Math.round((mid * 1.18) / step) * step, roles: [...new Set(ppl.map((p) => p.title))] };
    });
  }
  /** Pay this period after an increase of pct (exact, through the country pack's pay engine). */
  function payAfter(P, p, pct) {
    if (P.id === 'in') { const inc = Math.round((p.pay.structure.total * pct) / 100 / 100) * 100; return P.pay({ ...p, step: (p.step || 0) + inc }, p.u); }
    const r = P.roles[p.role];
    const tmp = Object.create(P);
    tmp.roles = { ...P.roles, [p.role]: r.rate ? { ...r, rate: r2(r.rate * (1 + pct / 100)) } : { ...r, salary: r2(r.salary * (1 + pct / 100)) } };
    return P.pay.call(tmp, p, p.u);
  }

  /* ================= compensation ================= */
  function Compensation({ query = {} }) {
    const P = PO.P();
    const [tab, setTab] = useState(['structures', 'bands', 'revision'].includes(query.tab) ? query.tab : 'structures');
    const [rev] = PO.useCoState('comp.rev', null);
    const bands = useMemo(() => bandsOf(P), [P.id]);
    const annual = sum(P.people, (p) => annualOf(P, p));
    const compa = P.people.map((p) => basePay(P, p) / bands.find((b) => b.g === p.grade).mid);
    const avgCompa = compa.reduce((t, x) => t + x, 0) / compa.length;
    const flagged = P.people.filter((p) => p.flag);
    const { state } = PO.useStore();
    const fixed = PO.coGet(state, 'compliance.flagFixed', false);
    return html`<${PO.PageHeader} title="Salary & compensation" sub=${`${PO.plural(P.people.length, 'person', 'people')} on ${Object.keys(P.roles).length} salary structures across ${bands.length} grades.`}
        actions=${html`<${Button} onClick=${() => PO.exportCsv('compensation', [['Employee ID', 'Name', 'Grade', 'Role', baseLabel(P), 'Annual', 'Compa-ratio'], ...P.people.map((p, i) => [p.id, p.name, p.grade, p.title, basePay(P, p), annualOf(P, p), compa[i].toFixed(2)])])}>Export</${Button}><${Button} kind="primary" onClick=${() => setTab('revision')}>${rev && rev.status === 'Approved' ? 'View revision cycle' : 'Plan revisions'}</${Button}>`} />
      <${PO.KpiStrip} items=${[
        { label: 'Annual base payroll', icon: 'Banknote', accent: 'green', value: PO.money(annual, { compact: true }), sub: P.id === 'in' ? 'Fixed pay for 12 months, before overtime' : 'Annualised base, before overtime and tips' },
        { label: 'Average compa-ratio', icon: 'Gauge', accent: 'violet', value: avgCompa.toFixed(2), sub: `${compa.filter((c) => c < 0.9).length} below 0.90 and ${compa.filter((c) => c > 1.1).length} above 1.10`, bar: [{ v: compa.filter((c) => c < 0.9).length, k: 'warn', title: 'Below 0.90' }, { v: compa.filter((c) => c >= 0.9 && c <= 1.1).length, k: 'ok', title: '0.90 to 1.10' }, { v: compa.filter((c) => c > 1.1).length, k: 'mute', title: 'Above 1.10' }] },
        { label: P.id === 'in' ? 'Below the 50% wage rule' : P.id === 'us' ? 'Misclassified as exempt' : 'Below NLW after deductions', icon: 'Scale', accent: 'red', value: fixed ? '0' : PO.num(flagged.length), tone: fixed ? '' : 'red', alert: !fixed, sub: fixed ? 'Fixed in the compliance centre' : P.ruleFlag.title.replace(/^\d+ /, ''), href: fixed ? null : PO.href('compliance') },
        { label: 'Revision cycle', icon: 'TrendingUp', accent: 'green', value: rev && rev.status === 'Approved' ? 'Approved' : 'Planning', sub: rev ? `${rev.budget}% budget` : `Effective ${P.id === 'in' ? '1 Apr 2027' : P.id === 'us' ? 'Jan 1, 2027' : '6 Apr 2027'}`, onClick: () => setTab('revision') },
      ]} />
      <div style="margin-top:24px"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['structures', 'Salary structures', Object.keys(P.roles).length], ['bands', 'Pay bands', bands.length], ['revision', 'Revision cycle']]} /></div>
      <div>${tab === 'structures' ? html`<${Structures} P=${P} fixed=${fixed} />` : tab === 'bands' ? html`<${Bands} P=${P} bands=${bands} />` : html`<${Revision} P=${P} bands=${bands} />`}</div>`;
  }

  function Structures({ P, fixed }) {
    const roles = Object.entries(P.roles).map(([k, r]) => ({ k, r, ppl: P.people.filter((p) => p.role === k) })).filter((x) => x.ppl.length);
    const flagged = P.people.filter((p) => p.flag);
    if (P.id === 'in') {
      return html`<div class="col" style="gap:24px">
        ${fixed ? null : html`<${FlagCard} P=${P} flagged=${flagged} fixed=${fixed} cols=${['Basic now', 'Basic % of pay', 'Fixed pay', 'PF now']} row=${(p) => { const s = p.pay.structure; return [PO.money(s.basic), Math.round((s.basic / s.total) * 100) + '%', PO.money(s.total), PO.money(p.pay.ded[0].amt)]; }} />`}
        <${Card} title="Salary templates" icon="LayoutTemplate" accent="green" sub="Basic, HRA and special allowance for each role" flush>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>Role</th><th>Grade</th><th class="r">People</th><th class="r">Basic</th><th class="r">HRA</th><th class="r">Special</th><th class="r">Monthly fixed</th><th>Basic share</th><th class="r">OT / hour</th><th>Code on Wages</th></tr></thead>
            <tbody>${roles.map(({ k, r, ppl }) => { const tot = r.basic + r.hra + r.special; const pct = r.basic / tot; const nf = ppl.filter((p) => p.flag).length; return html`<tr>
              <td class="w-500">${r.title}</td><td class="muted">${ppl[0].grade}</td><td class="r tnum">${ppl.length}</td><td class="r tnum">${PO.money(r.basic)}</td><td class="r tnum">${PO.money(r.hra)}</td><td class="r tnum">${PO.money(r.special)}</td><td class="r tnum w-600">${PO.money(tot)}</td>
              <td><div class="row" style="gap:8px"><div class="cp-split" title=${`Basic ${Math.round(pct * 100)}%`}><i style=${`width:${pct * 100}%;background:var(--chart-1)`}></i></div><span class="tnum t-sm muted" style="width:32px">${Math.round(pct * 100)}%</span></div></td>
              <td class="r tnum">${r.ot ? PO.money(r.ot) : html`<span class="faint">Not eligible</span>`}</td>
              <td>${nf && !fixed ? html`<${Badge} tone="red" dot>${nf} at 40%</${Badge}>` : html`<span class="t-sm muted">Basic ≥ 50%</span>`}</td></tr>`; })}</tbody>
          </table></div>
          <div class="card-f"><span class="faint t-sm">PF is charged on basic up to ₹25,000. ESI applies when fixed pay is ₹21,000 or less.</span></div>
        </${Card}>
      </div>`;
    }
    if (P.id === 'us') {
      return html`<div class="col" style="gap:24px">
        ${fixed ? null : html`<${FlagCard} P=${P} flagged=${flagged} fixed=${fixed} cols=${['Salary a week', 'Threshold', 'Gap', 'Overtime owed']} row=${(p) => ['$640.00', '$684.00', '−$44.00', `${p.u.otOwed} h, $${(p.u.otOwed * 24).toFixed(2)}`]} />`}
        <${Card} title="Pay rates by role" icon="Coins" accent="amber" sub="FLSA status; Texas follows the federal minimum wage" flush>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>Role</th><th>Grade</th><th class="r">People</th><th>Pay type</th><th class="r">Rate</th><th class="r">Weekly equivalent</th><th class="r">Annualised</th><th>FLSA</th><th>Minimum wage</th></tr></thead>
            <tbody>${roles.map(({ r, ppl }) => { const wk = r.rate ? r.rate * 40 : r.salary / 2; const below = !r.rate && wk < 684; return html`<tr>
              <td class="w-500">${r.title}${r.tips ? html` <span class="faint t-sm">tipped</span>` : null}</td><td class="muted">${ppl[0].grade}</td><td class="r tnum">${ppl.length}</td><td>${r.rate ? 'Hourly' : 'Salary, bi-weekly'}</td>
              <td class="r tnum">${r.rate ? `$${r.rate.toFixed(2)}/h` : PO.money(r.salary)}</td><td class="r tnum">${PO.money(wk)}</td><td class="r tnum w-600">${PO.money(r.rate ? r.rate * 2080 : r.salary * 26)}</td>
              <td>${r.rate ? html`<span class="t-sm muted">Non-exempt</span>` : below ? (fixed ? html`<span class="t-sm muted">Moved to hourly</span>` : html`<${Badge} tone="red" dot>Below $684/week</${Badge}>`) : html`<span class="t-sm muted">Exempt</span>`}</td>
              <td>${r.rate ? html`<span class="t-sm tnum">+${PO.money(r.rate - 7.25, { cents: true })} <span class="faint">over $7.25</span></span>` : html`<span class="faint t-sm">Salaried</span>`}</td></tr>`; })}</tbody>
          </table></div>
          <div class="card-f"><span class="faint t-sm">Exempt status needs a salary of at least $684 a week (29 CFR 541). The 2024 increase was vacated, so $684 still applies.</span></div>
        </${Card}>
      </div>`;
    }
    const NLW = 12.71;
    return html`<div class="col" style="gap:24px">
      ${fixed ? null : html`<${FlagCard} P=${P} flagged=${flagged} fixed=${fixed} cols=${['Hours', 'Basic pay', 'Uniform deduction', 'Rate after deduction']} row=${(p) => { const b = p.pay.earn.find((x) => x.k === 'basic').amt; return [`${p.u.hours} h`, fine(b), '£25.00', `£${((b - 25) / p.u.hours).toFixed(2)}`]; }} />`}
      <${Card} title="Pay rates by role" icon="Coins" accent="amber" sub="Against the National Living Wage of £12.71 (from 1 Apr 2026)" flush>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Role</th><th>Grade</th><th class="r">People</th><th>Pay type</th><th class="r">Rate</th><th class="r">Headroom over NLW</th><th class="r">Night premium</th><th class="r">Annualised</th><th>Status</th></tr></thead>
          <tbody>${roles.map(({ r, ppl }) => { const rate = r.rate || r.salary / 160; const head = rate - NLW; return html`<tr>
            <td class="w-500">${r.title}</td><td class="muted">${ppl[0].grade}</td><td class="r tnum">${ppl.length}</td><td>${r.rate ? 'Hourly' : 'Salary, four-weekly'}</td>
            <td class="r tnum">${r.rate ? `£${r.rate.toFixed(2)}/h` : PO.money(r.salary)}</td><td class="r tnum">${head < 0.005 ? html`<span style="color:var(--amber)">£0.00</span>` : `+£${head.toFixed(2)}`}</td><td class="r tnum">${r.rate ? '£1.50/h' : '–'}</td><td class="r tnum w-600">${PO.money(r.rate ? r.rate * 1950 : r.salary * 13)}</td>
            <td>${head < 0.005 ? html`<${Badge} tone="amber" dot>At NLW, no headroom</${Badge}>` : html`<span class="t-sm muted">Compliant</span>`}</td></tr>`; })}</tbody>
        </table></div>
        <div class="card-f"><span class="faint t-sm">Deductions for uniforms or equipment cannot take the hourly rate below the NLW for the pay reference period.</span></div>
      </${Card}>
    </div>`;
  }
  function FlagCard({ P, flagged, fixed, cols, row }) {
    return html`<${Card} title=${P.ruleFlag.title} icon="ShieldAlert" accent="red" sub=${fixed ? 'Resolved' : `${PO.plural(flagged.length, 'person', 'people')}, found while checking ${P.company.period}`} actions=${fixed ? html`<${PO.Status} s="Resolved" />` : html`<${Button} size="sm" href=${PO.href('compliance')}>Fix in Compliance</${Button}>`} flush>
      <div style="padding:0 16px 12px"><span class="muted t-sm">${P.ruleFlag.text}</span></div>
      <div class="table-wrap"><table class="tbl compact"><thead><tr><th>Employee</th>${cols.map((c) => html`<th class="r">${c}</th>`)}</tr></thead>
        <tbody>${flagged.map((p) => html`<tr><td><${Who} p=${p} size="sm" sub=${p.title + ', ' + PO.site(p.site).name} /></td>${row(p).map((v) => html`<td class="r tnum">${v}</td>`)}</tr>`)}</tbody></table></div>
    </${Card}>`;
  }

  function Bands({ P, bands }) {
    const [g, setG] = useState(null);
    const fmt = (v) => (P.id === 'in' ? PO.money(v) : PO.money(v, { compact: true }));
    return html`<div class="col" style="gap:16px">
      <${Card} title="Pay bands by grade" icon="Gauge" accent="violet" sub=${baseLabel(P) + '; each dot is a person'} flush actions=${html`<span class="legend"><span><i style="background:var(--amber-solid)"></i>Below 0.90</span><span><i style="background:var(--brand)"></i>0.90–1.10</span><span><i style="background:var(--text-3)"></i>Above 1.10</span></span>`}>
        <div class="cp-grade" style="cursor:default;background:var(--surface-2);padding-top:8px;padding-bottom:8px"><span class="faint t-sm">Grade</span><span class="faint t-sm">Band, minimum to maximum</span><span class="faint t-sm" style="text-align:right">Midpoint</span><span class="faint t-sm" style="text-align:right">Avg compa</span><span class="faint t-sm" style="text-align:right">People</span></div>
        ${bands.map((b) => { const lo = b.min * 0.85, hi = b.max * 1.15; const x = (v) => Math.max(1, Math.min(99, ((v - lo) / (hi - lo)) * 100)); const cr = b.ppl.map((p) => basePay(P, p) / b.mid); const avg = cr.reduce((t, c) => t + c, 0) / cr.length; return html`<div class="cp-grade" onClick=${() => setG(b)}>
          <div><b class="w-600">${b.g}</b><div class="faint t-xs ellipsis">${b.roles.join(', ')}</div></div>
          <div><div class="cp-band"><span class="rng" style=${`left:${x(b.min)}%;width:${x(b.max) - x(b.min)}%`}></span><span class="mid" style=${`left:${x(b.mid)}%`}></span>${b.ppl.map((p, i) => { const c = cr[i]; const jit = (PO.seeded('j' + p.id).rnd() - 0.5) * 16; return html`<span class="dot" title=${`${p.name}: ${fmt(basePay(P, p))}, compa ${c.toFixed(2)}`} style=${`left:${x(basePay(P, p))}%;top:${12 + jit}px;background:${c < 0.9 ? 'var(--amber-solid)' : c > 1.1 ? 'var(--text-3)' : 'var(--brand)'}`}></span>`; })}</div>
            <div style="position:relative;height:14px"><span class="cp-lbl" style=${`left:${x(b.min)}%`}>${fmt(b.min)}</span><span class="cp-lbl" style=${`left:${x(b.max)}%`}>${fmt(b.max)}</span></div></div>
          <span class="tnum w-600" style="text-align:right">${fmt(b.mid)}</span>
          <span class="tnum" style=${`text-align:right;${avg < 0.9 ? 'color:var(--amber)' : ''}`}>${avg.toFixed(2)}</span>
          <span class="tnum" style="text-align:right">${b.ppl.length}</span></div>`; })}
        <div class="card-f"><span class="faint t-sm">${P.id === 'in' ? 'Midpoints track the Pune facility-services market (Naukri and AmbitionBox, Q2 2026) and the Maharashtra minimum wage for security staff. Compa-ratio is fixed pay ÷ midpoint.' : P.id === 'us' ? 'Midpoints track Austin hospitality pay (BLS OES, May 2025) aged to 2026. Compa-ratio is base pay ÷ midpoint.' : 'Midpoints track Greater Manchester cleaning pay (ONS ASHE 2025) and the Real Living Wage. Compa-ratio is base pay ÷ midpoint.'}</span></div>
      </${Card}>
      <${Drawer} open=${!!g} size="lg" title=${g ? `Grade ${g.g}` : ''} sub=${g ? `${g.roles.join(', ')}, band ${fmt(g.min)} – ${fmt(g.max)}` : ''} onClose=${() => setG(null)}>
        ${g ? html`<${DataTable} rows=${g.ppl} compact pageSize=${12} exportName=${'band-' + g.g} search=${(p) => p.name} initialSort=${{ key: 'cr', dir: 'asc' }}
          columns=${[
            { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} size="sm" sub=${p.title} />`, sort: (p) => p.name },
            { key: 'ten', label: 'Tenure', render: (p) => PO.tenure(p.tenureMonths), sort: (p) => p.tenureMonths },
            { key: 'pay', label: baseLabel(P), align: 'r', render: (p) => html`<span class="tnum">${fmt(basePay(P, p))}</span>`, sort: (p) => basePay(P, p) },
            { key: 'pos', label: 'Position in band', render: (p) => html`<${Progress} value=${((basePay(P, p) - g.min) / (g.max - g.min)) * 100} />`, sort: (p) => basePay(P, p) },
            { key: 'cr', label: 'Compa', align: 'r', render: (p) => { const c = basePay(P, p) / g.mid; return html`<span class="tnum" style=${c < 0.9 ? 'color:var(--amber)' : ''}>${c.toFixed(2)}</span>`; }, sort: (p) => basePay(P, p) / g.mid },
          ]} />` : null}
      </${Drawer}>
    </div>`;
  }

  /* ---------- revision cycle ---------- */
  const DEF = { in: { budget: 7.5, m: { 1: 0, 2: 3, 3: 6, 4: 8, 5: 10 } }, us: { budget: 3.5, m: { 1: 0, 2: 1.5, 3: 3, 4: 4.5, 5: 6 } }, uk: { budget: 4, m: { 1: 0, 2: 2, 3: 3.5, 4: 5, 5: 6.5 } } };
  function Revision({ P, bands }) {
    const [rev, setRev] = PO.useCoState('comp.rev', null);
    const R = rev || { budget: DEF[P.id].budget, m: DEF[P.id].m, over: {}, status: 'Draft' };
    const set = (patch) => setRev({ ...R, ...patch });
    const [preview, setPreview] = useState(false);
    const [ask, setAsk] = useState(false);
    const locked = R.status === 'Approved';
    const elig = useMemo(() => P.people.filter((p) => !p.joiner && p.tenureMonths >= 6), [P.id]);
    const pctOf = (p) => (R.over[p.id] != null ? R.over[p.id] : R.m[p.rating] || 0);
    const pool = sum(elig, (p) => annualOf(P, p));
    const budget = r2((pool * R.budget) / 100);
    const used = sum(elig, (p) => (annualOf(P, p) * pctOf(p)) / 100);
    const usePct = budget ? (used / budget) * 100 : 0;
    const ratings = [5, 4, 3, 2, 1];
    const counts = Object.fromEntries(ratings.map((r) => [r, elig.filter((p) => p.rating === r).length]));
    const fmt = (v) => (P.id === 'in' ? PO.money(v) : PO.money(v, { compact: v > 99999 }));
    const eff = P.id === 'in' ? '1 Apr 2027' : P.id === 'us' ? 'Jan 1, 2027' : '6 Apr 2027';
    return html`<div class="col" style="gap:16px">
      ${locked ? html`<${Callout} tone="green" icon="BadgeCheck" title=${`Revision cycle approved, effective ${eff}`} action=${html`<${Button} size="sm" onClick=${() => { set({ status: 'Draft' }); PO.toast('Revision cycle reopened'); }}>Reopen</${Button}>`}>${PO.plural(elig.length, 'person', 'people')} get an increase worth ${PO.money(used, { compact: true })} a year. Letters are ready to send for e-signature.</${Callout}>` : null}
      <div class="grid g-main" style="align-items:start">
        <${Card} title="Merit matrix" icon="TrendingUp" accent="green" sub="Increase by performance rating">
          <div class="cp-matrix">${ratings.map((r) => html`<div><div class="w-600" style="letter-spacing:1px">${'★'.repeat(r)}<span style="color:var(--border-strong)">${'★'.repeat(5 - r)}</span></div>
            <div class="row mt-8" style="gap:4px"><input class="input tnum cp-pct" type="number" step="0.5" min="0" disabled=${locked} value=${R.m[r]} onInput=${(e) => set({ m: { ...R.m, [r]: Math.max(0, parseFloat(e.target.value) || 0) } })} /><span class="faint">%</span></div>
            <div class="faint t-xs mt-4">${r === 5 ? 'Outstanding' : r === 4 ? 'Exceeds' : r === 3 ? 'Meets' : r === 2 ? 'Partly meets' : 'Below'}, ${PO.plural(counts[r], 'person', 'people')}</div></div>`)}</div>
          <div class="faint t-sm mt-12">Ratings come from the ${P.reviewCycle.name}. Edit any person’s increase in the table below to override the matrix.</div>
        </${Card}>
        <${Card} title="Budget" icon="Wallet" accent="green">
          <div class="row"><span class="muted">Budget</span><span class="right row" style="gap:4px"><input class="input tnum cp-pct" type="number" step="0.5" disabled=${locked} value=${R.budget} onInput=${(e) => set({ budget: Math.max(0, parseFloat(e.target.value) || 0) })} /><span class="faint">% of base</span></span></div>
          <div class="hero-num mt-12" style="font-size:24px">${PO.money(used, { compact: true })} <span class="faint t-md w-500">of ${PO.money(budget, { compact: true })}</span></div>
          <div class="mt-8"><${Progress} value=${usePct} tone=${usePct > 100 ? 'red' : usePct > 92 ? 'amber' : 'green'} label=${Math.round(usePct) + '%'} /></div>
          <div class=${'t-sm mt-8 ' + (usePct > 100 ? '' : 'muted')} style=${usePct > 100 ? 'color:var(--red)' : ''}>${usePct > 100 ? `${PO.money(used - budget, { compact: true })} over budget` : `${PO.money(budget - used, { compact: true })} left to allocate`}</div>
          <div class="divider" style="margin:12px 0"></div>
          <${KV} items=${[['Eligible', `${elig.length} of ${P.people.length}`], ['Base pool', PO.money(pool, { compact: true })], ['Average increase', ((used / pool) * 100).toFixed(2) + '%'], ['Effective', eff]]} />
          <div class="row mt-12" style="gap:8px"><${Button} onClick=${() => setPreview(true)}>Preview take-home</${Button}><${Button} kind="primary" disabled=${locked || usePct > 100} onClick=${() => setAsk(true)}>${locked ? 'Approved' : 'Approve cycle'}</${Button}></div>
        </${Card}>
      </div>
      <${DataTable} rows=${elig} compact pageSize=${12} exportName="revision-proposals" search=${(p) => p.name + ' ' + p.id}
        filters=${[{ key: 'g', label: 'Grade', options: bands.map((b) => b.g), test: (p, v) => p.grade === v }, { key: 'r', label: 'Rating', options: ratings.map((r) => [String(r), `${r} stars`]), test: (p, v) => String(p.rating) === v }, { key: 'o', label: 'Override', options: [['y', 'Overridden']], test: (p) => R.over[p.id] != null }]}
        initialSort=${{ key: 'cost', dir: 'desc' }}
        columns=${[
          { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} size="sm" sub=${p.title + ', grade ' + p.grade} />`, sort: (p) => p.name },
          { key: 'rating', label: 'Rating', render: (p) => html`<span style="letter-spacing:1px">${'★'.repeat(p.rating)}</span><span style="color:var(--border-strong)">${'★'.repeat(5 - p.rating)}</span>`, sort: (p) => p.rating, csv: (p) => p.rating },
          { key: 'cr', label: 'Compa', align: 'r', render: (p) => (basePay(P, p) / bands.find((b) => b.g === p.grade).mid).toFixed(2), sort: (p) => basePay(P, p) / bands.find((b) => b.g === p.grade).mid },
          { key: 'cur', label: P.id === 'in' ? 'Fixed / month' : isHourly(P, P.people[0]) ? 'Current' : 'Current', align: 'r', render: (p) => (P.id !== 'in' && isHourly(P, p) ? `${PO.money(P.roles[p.role].rate, { cents: true })}/h` : fmt(basePay(P, p))), sort: (p) => basePay(P, p) },
          { key: 'pct', label: 'Increase', align: 'r', render: (p) => html`<span class="row" style="justify-content:flex-end;gap:4px" onClick=${(e) => e.stopPropagation()}><input class="input tnum cp-pct" style=${R.over[p.id] != null ? 'border-color:var(--brand)' : ''} type="number" step="0.5" min="0" disabled=${locked} value=${pctOf(p)} onInput=${(e) => set({ over: { ...R.over, [p.id]: Math.max(0, parseFloat(e.target.value) || 0) } })} /><span class="faint">%</span></span>`, sort: pctOf, csv: pctOf },
          { key: 'new', label: 'New', align: 'r', render: (p) => html`<b class="tnum">${P.id !== 'in' && isHourly(P, p) ? `${PO.money(r2(P.roles[p.role].rate * (1 + pctOf(p) / 100)), { cents: true })}/h` : fmt(Math.round(basePay(P, p) * (1 + pctOf(p) / 100)))}</b>`, sort: (p) => basePay(P, p) * (1 + pctOf(p) / 100) },
          { key: 'cost', label: 'Cost a year', align: 'r', render: (p) => PO.money(Math.round((annualOf(P, p) * pctOf(p)) / 100)), sort: (p) => (annualOf(P, p) * pctOf(p)) / 100 },
        ]} />
      <${PreviewDrawer} open=${preview} onClose=${() => setPreview(false)} P=${P} elig=${elig} pctOf=${pctOf} />
      <${Modal} open=${ask} title="Approve the revision cycle?" onClose=${() => setAsk(false)} footer=${html`<${Button} onClick=${() => setAsk(false)}>Cancel</${Button}><${Button} kind="primary" onClick=${() => { set({ status: 'Approved' }); setAsk(false); PO.toast(`Revision cycle approved. ${PO.plural(elig.length, 'letter')} queued for e-signature.`, { icon: 'BadgeCheck', action: { label: 'Undo', run: () => set({ status: 'Draft' }) } }); }}>Approve</${Button}>`}>
        <p>${PO.plural(elig.length, 'person', 'people')} get ${PO.money(used, { compact: true })} a year (${((used / pool) * 100).toFixed(2)}% of base), effective ${eff}. Increases flow into payroll from that run, and revision letters go out for e-signature.</p>
      </${Modal}>
    </div>`;
  }
  function PreviewDrawer({ open, onClose, P, elig, pctOf }) {
    const rows = useMemo(() => (open ? elig.map((p) => { const a = payAfter(P, p, pctOf(p)); return { p, pct: pctOf(p), g0: p.pay.gross, g1: a.gross, n0: p.pay.net, n1: a.net, e0: p.pay.erTotal, e1: a.erTotal, esiOut: P.id === 'in' && p.pay.ded.some((l) => l.k === 'esi') && !a.ded.some((l) => l.k === 'esi') }; }) : []), [open, P.id, elig, pctOf]);
    if (!open) return null;
    const s = (f) => sum(rows, f);
    const esiOut = rows.filter((r) => r.esiOut);
    return html`<${Drawer} open size="lg" title="Impact on take-home" sub=${`Per ${P.id === 'in' ? 'month' : 'pay period'}, using this period’s hours and the pay engine`} onClose=${onClose} footer=${html`<${Button} onClick=${() => PO.exportCsv('revision-take-home', [['Employee', 'Increase %', 'Gross now', 'Gross after', 'Net now', 'Net after', 'Employer cost change'], ...rows.map((r) => [r.p.name, r.pct, r.g0, r.g1, r.n0, r.n1, r2(r.g1 + r.e1 - r.g0 - r.e0)])])}>Export</${Button}><${Button} kind="primary" onClick=${onClose}>Done</${Button}>`}>
      <div class="col" style="gap:14px">
        <${PO.KpiStrip} items=${[['Gross pay', s((r) => r.g1 - r.g0)], ['Take-home', s((r) => r.n1 - r.n0)], ['Employer cost', s((r) => r.g1 + r.e1 - r.g0 - r.e0)]].map(([l, v]) => ({ label: l + ', per period', icon: 'CircleDot', accent: 'green', value: '+' + fine(v) }))} />
        ${esiOut.length ? html`<${Callout} tone="amber" icon="TriangleAlert" title=${`${esiOut.length} people cross the ₹21,000 ESI limit`}>Their ESI cover ends from the next contribution period, so their take-home rises by more than the increase. Consider group medical cover for them.</${Callout}>` : null}
        <${DataTable} rows=${rows} rowKey=${(r) => r.p.id} compact pageSize=${12} search=${(r) => r.p.name} initialSort=${{ key: 'dn', dir: 'desc' }}
          columns=${[
            { key: 'name', label: 'Employee', render: (r) => html`<span class="w-500">${r.p.name}</span>${r.esiOut ? html` <${Badge} tone="amber" dot>Leaves ESI</${Badge}>` : null}`, sort: (r) => r.p.name },
            { key: 'pct', label: '%', align: 'r', render: (r) => r.pct + '%', sort: (r) => r.pct },
            { key: 'n0', label: 'Net now', align: 'r', render: (r) => fine(r.n0), sort: (r) => r.n0 },
            { key: 'n1', label: 'Net after', align: 'r', render: (r) => html`<b class="tnum">${fine(r.n1)}</b>`, sort: (r) => r.n1 },
            { key: 'dn', label: 'Change', align: 'r', render: (r) => html`<span class="tnum">+${fine(r2(r.n1 - r.n0))}</span>`, sort: (r) => r.n1 - r.n0 },
            { key: 'de', label: 'Employer cost', align: 'r', render: (r) => '+' + fine(r2(r.g1 + r.e1 - r.g0 - r.e0)), sort: (r) => r.g1 + r.e1 - r.g0 - r.e0 },
          ]}
          foot=${html`<tr><td>${PO.plural(rows.length, 'person', 'people')}</td><td></td><td class="r tnum">${fine(s((r) => r.n0))}</td><td class="r tnum">${fine(s((r) => r.n1))}</td><td class="r tnum">+${fine(s((r) => r.n1 - r.n0))}</td><td class="r tnum">+${fine(s((r) => r.g1 + r.e1 - r.g0 - r.e0))}</td></tr>`} />
      </div>
    </${Drawer}>`;
  }

  /* ================= tax ================= */
  function Tax({ query = {} }) {
    const P = PO.P();
    return P.id === 'in' ? html`<${TaxIN} P=${P} query=${query} />` : P.id === 'us' ? html`<${TaxUS} P=${P} />` : html`<${TaxUK} P=${P} />`;
  }

  /* ---------- India ---------- */
  function declOf(P) {
    return P.people.map((p) => {
      const r = PO.seeded('decl' + P.id + p.id);
      const hasTds = p.pay.ded.some((l) => l.k === 'tds');
      const regime = hasTds || r.chance(0.16) ? 'Old' : 'New';
      const d = regime === 'Old' ? { c80: r.int(6, 15) * 10000, d80: r.pick([0, 12000, 25000]), rent: r.int(6, 14) * 1000, b24: r.chance(0.25) ? r.int(8, 20) * 10000 : 0 } : { c80: 0, d80: 0, rent: 0, b24: 0 };
      const status = p.joiner ? 'Not submitted' : regime === 'Old' ? r.pick(['Proofs pending', 'Proofs pending', 'Verified', 'Submitted']) : r.pick(['Submitted', 'Submitted', 'Submitted', 'Not submitted']);
      return { p, regime, ...d, status, tds: hasTds ? p.pay.ded.find((l) => l.k === 'tds').amt : 0 };
    });
  }
  function proofsOf(P, decl) {
    const out = [];
    decl.filter((d) => d.regime === 'Old' && d.status === 'Proofs pending').forEach((d, i) => {
      const r = PO.seeded('proof' + d.p.id);
      if (d.c80) out.push({ id: `PRF-${700 + out.length}`, d, sec: '80C', doc: r.pick(['LIC premium receipt', 'PPF passbook', 'ELSS statement', 'Tuition fee receipt']), amt: d.c80, filed: PO.addDays(PO.TODAY, -r.int(1, 14)) });
      if (d.rent) out.push({ id: `PRF-${700 + out.length}`, d, sec: 'HRA', doc: 'Rent receipts, Apr–Sep', amt: d.rent * 6, filed: PO.addDays(PO.TODAY, -r.int(1, 14)), landlord: r.pick(['Shantabai Jagtap', 'Ramesh Kulkarni', 'Vasant Pawar', 'Sushila Deshmukh']) });
      if (d.d80) out.push({ id: `PRF-${700 + out.length}`, d, sec: '80D', doc: 'Health insurance premium', amt: d.d80, filed: PO.addDays(PO.TODAY, -r.int(1, 14)) });
      if (d.b24) out.push({ id: `PRF-${700 + out.length}`, d, sec: '24(b)', doc: 'Home loan interest certificate', amt: d.b24, filed: PO.addDays(PO.TODAY, -r.int(1, 14)) });
    });
    return out;
  }
  function TaxIN({ P, query }) {
    const [tab, setTab] = useState(query.tab || 'decl');
    const [pv, setPv] = PO.useCoState('tax.proofs', {});
    const [forms, setForms] = PO.useCoState('tax.forms', {});
    const [doc, setDoc] = useState(null);
    const [dsel, setDsel] = useState(null);
    const decl = useMemo(() => declOf(P), [P.id]);
    const proofs = useMemo(() => proofsOf(P, decl), [P.id]);
    const pending = proofs.filter((x) => !pv[x.id]);
    const newN = decl.filter((d) => d.regime === 'New').length;
    const submitted = decl.filter((d) => d.status !== 'Not submitted').length;
    const tdsPpl = decl.filter((d) => d.tds);
    const decide = (x, v) => { setPv({ ...pv, [x.id]: v }); PO.toast(`${x.sec} proof for ${x.d.p.name} ${v}`, { action: { label: 'Undo', run: () => { const n = { ...pv }; delete n[x.id]; setPv(n); } } }); };
    return html`<${PO.PageHeader} title="Tax & declarations" sub="Financial year 2026-27 under the Income-tax Act 2025, TAN PNES48213D. Declarations close 31 Oct."
        actions=${html`<${Button} onClick=${() => PO.toast(`Reminder sent by email and SMS to ${P.people.length - submitted} people`)}>Remind ${P.people.length - submitted} people</${Button}><${Button} kind="primary" onClick=${() => setTab('proofs')}>Verify ${PO.plural(pending.length, 'proof')}</${Button}>`} />
      <${PO.KpiStrip} items=${[
        { label: 'Declarations submitted', icon: 'FileCheck2', accent: 'violet', value: PO.num(submitted), unit: '/' + P.people.length, sub: `${Math.round((submitted / P.people.length) * 100)}%, window closes 31 Oct`, bar: [{ v: submitted, k: 'ok', title: 'Submitted' }, { v: P.people.length - submitted, k: 'mute', title: 'Not submitted' }] },
        { label: 'Proofs to verify', icon: 'FileCheck2', accent: 'violet', value: PO.num(pending.length), alert: pending.length > 0, sub: `${proofs.length - pending.length} of ${proofs.length} decided`, bar: [{ v: proofs.length - pending.length, k: 'ok', title: 'Decided' }, { v: pending.length, k: 'warn', title: 'Pending' }], onClick: () => setTab('proofs') },
        { label: 'On the new regime', icon: 'Scale', accent: 'violet', value: PO.pct(newN / decl.length), sub: `${newN} new, ${decl.length - newN} old`, bar: [{ v: newN, k: 'ok', title: 'New regime' }, { v: decl.length - newN, k: 'mute', title: 'Old regime' }] },
        { label: 'TDS this month', icon: 'Landmark', accent: 'blue', value: PO.money(P.totals.tds), sub: `${tdsPpl.length} people, deposit by 7 Oct`, alert: true },
      ]} />
      <div style="margin-top:24px"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['decl', 'Declarations', P.people.length], ['proofs', 'Proof verification', pending.length], ['regime', 'Regime & TDS'], ['forms', 'Forms 130 & 138']]} /></div>
      <div>
      ${tab === 'decl' ? html`<${DataTable} rows=${decl} rowKey=${(d) => d.p.id} onRow=${setDsel} exportName="investment-declarations" search=${(d) => d.p.name + ' ' + d.p.id + ' ' + d.p.ids.pan} pageSize=${15}
          filters=${[{ key: 's', label: 'Status', options: ['Not submitted', 'Submitted', 'Proofs pending', 'Verified'], test: (d, v) => d.status === v }, { key: 'r', label: 'Regime', options: ['New', 'Old'], test: (d, v) => d.regime === v }]}
          columns=${[
            { key: 'name', label: 'Employee', render: (d) => html`<${Who} p=${d.p} size="sm" sub=${d.p.id + ', PAN ' + d.p.ids.pan} />`, sort: (d) => d.p.name },
            { key: 'regime', label: 'Regime', render: (d) => html`<span class="t-sm">${d.regime}</span>`, sort: (d) => d.regime },
            { key: 'c80', label: '80C', align: 'r', render: (d) => (d.c80 ? PO.money(d.c80) : html`<span class="faint">–</span>`), sort: (d) => d.c80 },
            { key: 'd80', label: '80D', align: 'r', render: (d) => (d.d80 ? PO.money(d.d80) : html`<span class="faint">–</span>`), sort: (d) => d.d80 },
            { key: 'rent', label: 'HRA rent / month', align: 'r', render: (d) => (d.rent ? PO.money(d.rent) : html`<span class="faint">–</span>`), sort: (d) => d.rent },
            { key: 'b24', label: '24(b) interest', align: 'r', render: (d) => (d.b24 ? PO.money(d.b24) : html`<span class="faint">–</span>`), sort: (d) => d.b24 },
            { key: 'status', label: 'Status', render: (d) => html`<${PO.Status} s=${d.status} />`, sort: (d) => d.status },
          ]} />`
      : tab === 'proofs' ? html`<${DataTable} rows=${proofs} exportName="proof-verification" search=${(x) => x.d.p.name + ' ' + x.sec + ' ' + x.doc} pageSize=${12} onRow=${setDoc}
          filters=${[{ key: 'sec', label: 'Section', options: ['80C', '80D', 'HRA', '24(b)'], test: (x, v) => x.sec === v }, { key: 's', label: 'Status', options: [['p', 'Pending'], ['Approved', 'Approved'], ['Rejected', 'Rejected']], test: (x, v) => (v === 'p' ? !pv[x.id] : pv[x.id] === v) }]}
          columns=${[
            { key: 'id', label: 'Proof', render: (x) => html`<span class="faint">${x.id}</span>`, sort: (x) => x.id },
            { key: 'name', label: 'Employee', render: (x) => html`<${Who} p=${x.d.p} size="sm" sub=${x.d.p.title} link=${false} />`, sort: (x) => x.d.p.name, csv: (x) => x.d.p.name },
            { key: 'sec', label: 'Section', render: (x) => html`<${SecChip} s=${x.sec} />`, sort: (x) => x.sec },
            { key: 'doc', label: 'Document', render: (x) => x.doc, sort: (x) => x.doc },
            { key: 'amt', label: 'Claimed', align: 'r', render: (x) => html`<span class="tnum w-500">${PO.money(x.amt)}</span>`, sort: (x) => x.amt },
            { key: 'filed', label: 'Uploaded', render: (x) => PO.rel(x.filed), sort: (x) => x.filed },
            { key: 'act', label: '', align: 'r', render: (x) => (pv[x.id] ? html`<${PO.Status} s=${pv[x.id]} />` : html`<span class="row" style="justify-content:flex-end;gap:4px" onClick=${(e) => e.stopPropagation()}><${Button} size="sm" kind="ghost" onClick=${() => decide(x, 'Rejected')}>Reject</${Button}><${Button} size="sm" onClick=${() => decide(x, 'Approved')}>Approve</${Button}></span>`), sort: false, csv: (x) => pv[x.id] || 'Pending' },
          ]} />`
      : tab === 'regime' ? html`<div class="col" style="gap:16px">
          <${Card} title="TDS projection" icon="Landmark" accent="blue" sub="Employees with tax to deduct this year" flush>
            <div class="table-wrap"><table class="tbl compact"><thead><tr><th>Employee</th><th>Regime</th><th class="r">Annual gross</th><th class="r">Deductions claimed</th><th class="r">Projected tax</th><th class="r">Deducted Apr–Sep</th><th class="r">Balance</th><th class="r">Monthly TDS</th></tr></thead>
              <tbody>${tdsPpl.map((d) => html`<tr><td><${Who} p=${d.p} size="sm" sub=${d.p.title} /></td><td class="t-sm">${d.regime}</td><td class="r tnum">${PO.money(d.p.pay.structure.total * 12)}</td><td class="r tnum">${PO.money(50000 + d.c80 + d.d80 + d.b24)}</td><td class="r tnum">${PO.money(d.tds * 12)}</td><td class="r tnum">${PO.money(d.tds * 6)}</td><td class="r tnum">${PO.money(d.tds * 6)}</td><td class="r tnum w-600">${PO.money(d.tds)}</td></tr>`)}</tbody>
              <tfoot><tr><td>${PO.plural(tdsPpl.length, 'person', 'people')}</td><td></td><td></td><td></td><td class="r tnum">${PO.money(sum(tdsPpl, (d) => d.tds * 12))}</td><td class="r tnum">${PO.money(sum(tdsPpl, (d) => d.tds * 6))}</td><td class="r tnum">${PO.money(sum(tdsPpl, (d) => d.tds * 6))}</td><td class="r tnum">${PO.money(P.totals.tds)}</td></tr></tfoot></table></div>
            <div class="card-f"><span class="faint t-sm">Projected tax includes 4% health and education cess. Recomputed every month as proofs are verified.</span></div>
          </${Card}>
          <div class="grid g-2" style="align-items:start"><${Card} title="Regime split" icon="Scale" accent="violet">
            <${PO.Charts.Donut} size=${130} data=${[{ label: 'New regime', value: newN, color: 'var(--chart-1)' }, { label: 'Old regime', value: decl.length - newN, color: 'var(--chart-5)' }]} center=${PO.pct(newN / decl.length)} sub="new regime" />
            <div class="muted t-sm mt-12">The new regime is the default. Most frontline staff earn under ₹12 lakh of taxable income, so the section 87A rebate brings their tax to nil.</div>
          </${Card}>
          <${Card} title="TDS deposits" icon="Landmark" accent="blue" sub="Challan ITNS 281, due by the 7th" flush>
            <div class="list">${['Sep', 'Aug', 'Jul', 'Jun', 'May', 'Apr'].map((m, i) => html`<div class="list-item"><div class="grow"><span class="w-500">${m} 2026 salaries</span><div class="faint t-sm">${i ? `Deposited ${['', '7 Sep', '7 Aug', '7 Jul', '6 Jun', '7 May'][i]}, BSR 0510308` : 'Due Wed 7 Oct'}</div></div><span class="tnum">${PO.money(P.totals.tds)}</span><span style="width:84px">${i ? html`<${PO.Status} s="Paid" />` : html`<${PO.Status} s="Due today" />`}</span></div>`)}</div>
          </${Card}></div>
        </div>`
      : html`<${Card} title="Forms 130 and 138" icon="FileCheck2" accent="violet" sub="TDS returns and annual certificates" flush><table class="tbl"><tbody>
          ${[['f138q1', 'Form 138, Q1 (Apr–Jun)', 'Quarterly TDS return (was 24Q)', 'Filed 29 Jul 2026, token 482130071526', true], ['f138q2', 'Form 138, Q2 (Jul–Sep)', `Due 31 Oct 2026 for ${PO.plural(tdsPpl.length, 'deductee')}`, null, false], ['f130fy25', 'Form 130, FY 2025-26', 'Annual TDS certificate (was Form 16)', `Issued 12 Jun 2026 to ${tdsPpl.length} employees`, true], ['f130fy26', 'Form 130, FY 2026-27', 'Available after the Q4 return in May 2027', null, false]].map(([k, t, sub, doneText, done]) => { const isDone = done || forms[k]; const disabled = k === 'f130fy26'; return html`<tr>
            <td><span class="w-500">${t}</span><div class="faint t-sm">${sub}</div></td>
            <td>${isDone ? html`<${Badge} tone="green" dot>${doneText || 'Generated, ready to file on TRACES'}</${Badge}>` : disabled ? html`<span class="faint t-sm">Not yet available</span>` : html`<${Badge} tone="amber" dot>Not generated</${Badge}>`}</td>
            <td class="r">${isDone ? html`<${Button} size="sm" onClick=${() => PO.fakeDownload(t + (k.startsWith('f130') ? ' (ZIP of PDFs)' : ' (FVU file)'))}>Download</${Button}>` : disabled ? null : html`<${Button} size="sm" onClick=${() => { setForms({ ...forms, [k]: true }); PO.toast(`${t} generated and validated with the FVU utility`); }}>Generate</${Button}>`}</td>
          </tr>`; })}
        </tbody></table></${Card}>`}
      </div>
      <${Drawer} open=${!!dsel} size="sm" title=${dsel ? `Declaration, ${dsel.p.name}` : ''} sub=${dsel ? `FY 2026-27, ${dsel.regime.toLowerCase()} regime` : ''} onClose=${() => setDsel(null)}
        footer=${html`<${Button} onClick=${() => { PO.toast(`Reminder sent to ${dsel.p.first} by email and SMS`); setDsel(null); }}>Remind</${Button}><${Button} kind="primary" href=${dsel ? PO.href('people/' + dsel.p.id) : '#'}>Open profile</${Button}>`}>
        ${dsel ? html`<div class="col" style="gap:14px"><${KV} items=${[['PAN', dsel.p.ids.pan], ['Regime', dsel.regime], ['Status', html`<${PO.Status} s=${dsel.status} />`], ['80C', PO.money(dsel.c80)], ['80D', PO.money(dsel.d80)], ['HRA rent', dsel.rent ? PO.money(dsel.rent) + ' a month' : '–'], ['24(b) interest', PO.money(dsel.b24)], ['Monthly TDS', PO.money(dsel.tds)]]} />
          <div class="faint t-sm">${dsel.regime === 'New' ? 'On the new regime only the standard deduction of ₹75,000 and employer NPS (80CCD(2)) apply, so no proofs are needed.' : 'On the old regime, proofs for every claim are due by 31 Jan 2027. Unproven claims are reversed in the February payroll.'}</div></div>` : null}
      </${Drawer}>
      <${Drawer} open=${!!doc} title=${doc ? `${doc.sec} proof, ${doc.d.p.name}` : ''} sub=${doc ? `${doc.doc}, uploaded ${PO.rel(doc.filed)}` : ''} onClose=${() => setDoc(null)}
        footer=${doc && !pv[doc.id] ? html`<${Button} onClick=${() => { decide(doc, 'Rejected'); setDoc(null); }}>Reject</${Button}><${Button} kind="primary" onClick=${() => { decide(doc, 'Approved'); setDoc(null); }}>Approve ${doc ? PO.money(doc.amt) : ''}</${Button}>` : html`<${Button} onClick=${() => setDoc(null)}>Close</${Button}>`}>
        ${doc ? html`<div class="col" style="gap:14px">
          <div class="cp-doc"><h4>${doc.sec === 'HRA' ? 'Rent receipt' : doc.doc}</h4>
            ${doc.sec === 'HRA' ? html`<div class="muted" style="line-height:1.7">Received from <b>${doc.d.p.name}</b> a sum of <b>${PO.money(doc.d.rent)}</b> per month towards rent of the premises at ${doc.d.p.city}, Pune, for April to September 2026. Total <b>${PO.money(doc.amt)}</b>.</div><div class="row mt-16"><span class="faint t-sm">Landlord</span><b class="right">${doc.landlord}</b></div><div class="row"><span class="faint t-sm">Landlord PAN</span><span class="right tnum">${doc.amt > 50000 ? 'AQXPJ4471K' : 'Not needed (under ₹1 lakh a year)'}</span></div><div class="row"><span class="faint t-sm">Revenue stamp</span><span class="right">Affixed</span></div>`
              : html`<div class="cp-line"><span>Policy / account holder</span><b>${doc.d.p.name}</b></div><div class="cp-line"><span>Reference</span><span class="tnum">${doc.sec === '80C' ? 'LIC 9384 7215 06' : doc.sec === '80D' ? 'STAR-HLTH-2026-55817' : 'HDFC HL 6603 2219'}</span></div><div class="cp-line"><span>Period</span><span>FY 2026-27</span></div><div class="cp-line"><span>Amount</span><b>${PO.money(doc.amt)}</b></div>`}
          </div>
          <${Callout} tone=${doc.sec === '80C' && doc.amt > 150000 ? 'amber' : 'green'} icon="Check" title="Automatic checks">${doc.sec === '80C' ? `Within the ₹1,50,000 limit for section 80C.` : doc.sec === 'HRA' ? 'Rent matches the declaration. HRA exemption is the least of actual HRA, rent minus 10% of basic, and 40% of basic (Pune is non-metro).' : doc.sec === '80D' ? 'Within the ₹25,000 limit for self and family.' : 'Within the ₹2,00,000 limit for a self-occupied home.'} Name on the document matches the employee record.</${Callout}>
          <${KV} items=${[['Employee', doc.d.p.name], ['PAN', doc.d.p.ids.pan], ['Regime', doc.d.regime], ['Status', pv[doc.id] || 'Pending review']]} />
        </div>` : null}
      </${Drawer}>`;
  }

  /* ---------- United States ---------- */
  function TaxUS({ P }) {
    const [tab, setTab] = useState('w4');
    const [w2, setW2] = PO.useCoState('tax.w2', {});
    const [nh, setNh] = PO.useCoState('tax.newhire', false);
    const H = P.payHistory;
    const T = P.totals;
    const q3 = H.map((h, i) => ({ h, i, paid: PO.payx.paidOn(P, h, i) })).filter((x) => x.paid >= '2026-07-01' && x.paid <= '2026-09-30');
    const wages = sum(q3, (x) => x.h.gross);
    const fitW = r2(wages * (T.fit / T.gross)), ss = r2(wages * 0.124), med = r2(wages * 0.029);
    const total = r2(fitW + ss + med);
    const filing = (p) => (p.joiner ? 'Not provided' : PO.seeded('w4' + p.id).pick(['Single', 'Single', 'Married filing jointly', 'Head of household']));
    const sutaRows = P.people.map((p) => { const ytdBefore = p.joiner ? 0 : p.pay.gross * 13; const q = p.pay.gross * q3.length; return { p, q, taxable: Math.max(0, Math.min(q, 9000 - ytdBefore)) }; });
    const sutaTaxable = sum(sutaRows, (r) => r.taxable);
    const w2Items = ['Verify names and SSNs against SSA records', 'Confirm addresses for all 58 employees', 'Reconcile 4 quarterly Forms 941 to payroll', 'Report card tips in box 7', 'Report 401(k) deferrals in box 12, code D', 'Report employer health coverage in box 12, code DD', 'Send W-2s and file W-3 by Feb 1, 2027'];
    const hires = P.people.slice().sort((a, b) => b.joinedIso.localeCompare(a.joinedIso)).slice(0, 3);
    return html`<${PO.PageHeader} title="Tax & filings" sub="Federal and Texas filings for EIN 74-3318205 and Texas TWC account 99-718204-3."
        actions=${html`<${Button} onClick=${() => PO.fakeDownload('Form 941, Q3 2026 (PDF)')}>Form 941, Q3</${Button}><${Button} kind="primary" onClick=${() => { setNh(true); PO.toast('Texas new-hire report filed for Ethan Park'); }} disabled=${nh}>${nh ? 'New-hire report filed' : 'File new-hire report'}</${Button}>`} />
      <${PO.KpiStrip} items=${[
        { label: 'W-4s on file', icon: 'FileCheck2', accent: 'violet', value: PO.num(P.people.length - 1), unit: '/' + P.people.length, sub: '1 new hire on the IRS default', alert: true, bar: [{ v: P.people.length - 1, k: 'ok', title: 'On file' }, { v: 1, k: 'warn', title: 'Missing' }] },
        { label: 'Q3 federal liability', icon: 'Landmark', accent: 'blue', value: PO.money(total, { compact: true }), sub: `${q3.length} paydays, fully deposited`, bar: [{ v: fitW, k: 'ok', title: 'Income tax' }, { v: ss, k: 'mute', title: 'Social Security' }, { v: med, title: 'Medicare' }] },
        { label: 'Texas SUTA rate', icon: 'MapPin', accent: 'amber', value: '2.70%', sub: 'On the first $9,000 of wages' },
        { label: 'Next deposit', icon: 'CalendarClock', accent: 'amber', value: 'Oct 14', sub: `${PO.money(T.fit + T.ss + T.erss + T.med + T.ermed)} via EFTPS`, ticks: { on: 2, of: 10 } },
      ]} />
      <div style="margin-top:24px"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['w4', 'Form W-4', P.people.length], ['941', 'Form 941'], ['w2', 'W-2 prep'], ['state', 'Texas']]} /></div>
      <div>
      ${tab === 'w4' ? html`<${DataTable} rows=${P.people} exportName="w4-status" search=${(p) => p.name + ' ' + p.id} pageSize=${15}
          filters=${[{ key: 's', label: 'W-4', options: [['ok', 'On file'], ['m', 'Missing']], test: (p, v) => (v === 'm' ? p.joiner : !p.joiner) }]}
          columns=${[
            { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} size="sm" sub=${p.id + ', ' + p.title} />`, sort: (p) => p.name },
            { key: 'w4', label: 'Form W-4', render: (p) => (p.joiner ? html`<${Badge} tone="red" dot>Missing</${Badge}>` : html`<span class="t-sm muted">2026 on file</span>`), sort: (p) => p.ids.w4 },
            { key: 'fs', label: 'Filing status', render: filing, sort: filing },
            { key: 'dep', label: 'Dependents (step 3)', align: 'r', render: (p) => { const n = PO.seeded('dep' + p.id).pick([0, 0, 0, 2000, 4000]); return n ? PO.money(n) : html`<span class="faint">–</span>`; }, sort: false },
            { key: 'i9', label: 'Form I-9', render: () => html`<span class="t-sm muted">Verified</span>`, sort: false },
            { key: 'fit', label: 'FIT this check', align: 'r', render: (p) => html`<span class="tnum">${fine(p.pay.ded.find((l) => l.k === 'fit').amt)}</span>`, sort: (p) => p.pay.ded.find((l) => l.k === 'fit').amt },
            { key: 'a', label: '', align: 'r', render: (p) => (p.joiner ? html`<span onClick=${(e) => e.stopPropagation()}><${Button} size="sm" onClick=${() => PO.toast(`W-4 link sent to ${p.first} by text`)}>Request W-4</${Button}></span>` : null), sort: false, csv: false },
          ]} />`
      : tab === '941' ? html`<div class="grid g-main" style="align-items:start">
          <${Card} title="Form 941, Q3 2026" icon="Landmark" accent="blue" sub="Jul 1 – Sep 30, due Nov 2" flush>
            <table class="tbl"><tbody>
              ${[['1', 'Employees who received pay (Sep 12)', PO.num(H[H.length - 3].heads)], ['2', 'Wages, tips and other compensation', fine(wages)], ['3', 'Federal income tax withheld', fine(fitW)], ['5a', 'Taxable Social Security wages × 12.4%', fine(ss)], ['5c', 'Taxable Medicare wages × 2.9%', fine(med)], ['6', 'Total taxes before adjustments', fine(total)], ['12', 'Total taxes after adjustments', fine(total)], ['13', 'Total deposits for the quarter', fine(total)], ['14', 'Balance due', fine(0)]].map(([n, l, v]) => html`<tr><td style="width:48px" class="faint tnum">${n}</td><td>${l}</td><td class="r tnum w-500">${v}</td></tr>`)}
            </tbody></table>
            <div class="card-f"><span class="faint t-sm">Reconciled to ${q3.length} payroll runs</span><span class="right"><${Button} size="sm" onClick=${() => PO.fakeDownload('Form 941 and Schedule B, Q3 2026')}>Download with Schedule B</${Button}></span></div>
          </${Card}>
          <${Card} title="Semi-weekly deposits" icon="CalendarClock" accent="amber" flush>
            <div class="list">${q3.map((x) => { const d = PO.addDays(x.paid, 5); const amt = r2((x.h.gross / wages) * total); return html`<div class="list-item"><div class="grow"><span class="w-500">${PO.date(d, { short: true })}</span><div class="faint t-sm">EFTPS deposit for the ${PO.date(x.paid, { short: true })} payday</div></div><span class="tnum">${fine(amt)}</span><${PO.Status} s="Paid" /></div>`; })}</div>
          </${Card}>
        </div>`
      : tab === 'w2' ? html`<${Card} title="W-2 preparation for 2026" icon="FileCheck2" accent="violet" sub=${`${Object.values(w2).filter(Boolean).length} of ${w2Items.length} done`}>
          <${PO.Checklist} items=${w2Items.map((t, i) => ({ t, done: !!w2[i], meta: i === 6 ? 'Feb 1, 2027' : i === 0 ? 'SSNVS' : '' }))} onToggle=${(i) => setW2({ ...w2, [i]: !w2[i] })} />
          <div class="mt-12"><${Progress} value=${(Object.values(w2).filter(Boolean).length / w2Items.length) * 100} /></div>
        </${Card}>`
      : html`<div class="grid g-2" style="align-items:start">
          <${Card} title="Texas unemployment tax (C-3)" icon="Landmark" accent="blue" sub="Q3 2026, due Nov 2">
            <${KV} items=${[['Total wages paid', fine(wages)], ['Taxable wages (first $9,000)', fine(sutaTaxable)], ['Rate (general + replenishment)', '2.70%'], ['Tax due', fine(r2(sutaTaxable * 0.027))], ['Employees', PO.num(P.people.length)]]} />
            <div class="row mt-12"><${Button} size="sm" onClick=${() => PO.fakeDownload('TWC C-3 wage report, Q3 2026')}>Wage report</${Button}></div>
          </${Card}>
          <${Card} title="State new-hire reports" icon="MapPin" accent="amber" sub="Due within 20 days of hire" flush>
            <div class="list">${hires.map((p) => { const filed = !p.joiner || nh; return html`<div class="list-item"><${Avatar} p=${p} size="sm" /><div class="grow"><b class="w-550">${p.name}</b><div class="faint t-sm">${p.title}, hired ${PO.date(p.joinedIso, { short: true })}</div></div>${filed ? html`<${PO.Status} s="Filed" />` : html`<${Button} size="sm" onClick=${() => { setNh(true); PO.toast('Texas new-hire report filed for ' + p.name); }}>File by Oct 18</${Button}>`}</div>`; })}</div>
          </${Card}>
        </div>`}
      </div>`;
  }

  /* ---------- United Kingdom ---------- */
  function TaxUK({ P }) {
    const [tab, setTab] = useState('codes');
    const [applied, setApplied] = PO.useCoState('tax.p6', {});
    const H = P.payHistory;
    const T = P.totals;
    const notices = useMemo(() => { const r = PO.seeded('p6' + P.id); return r.shuffle(P.people.filter((p) => !p.joiner && P.roles[p.role].rate)).slice(0, 3).map((p, i) => ({ id: 'P6-' + (i + 1), p, code: ['1185L', 'K42', 'BR'][i], form: i === 2 ? 'P9' : 'P6', why: ['Underpaid tax from 2025-26 collected', 'Taxable benefit from a second job', 'Second job, all income taxed at 20%'][i] })); }, [P.id]);
    const codeOf = (p) => { const n = notices.find((x) => x.p.id === p.id); return n && applied[n.id] ? n.code : p.ids.taxCode; };
    const loan = (p) => (PO.seeded('sl' + p.id).chance(0.12) ? 'Plan 2' : '');
    const ty = H.slice(-6).map((h, i) => ({ h, i: H.length - 6 + i }));
    const fps = ty.map(({ h, i }) => ({ h, paid: PO.payx.paidOn(P, h, i), cur: i === H.length - 1 }));
    const months = ['Month 1, 6 Apr – 5 May', 'Month 2, 6 May – 5 Jun', 'Month 3, 6 Jun – 5 Jul', 'Month 4, 6 Jul – 5 Aug', 'Month 5, 6 Aug – 5 Sep', 'Month 6, 6 Sep – 5 Oct'];
    let ea = 10500;
    const p32 = months.map((m, i) => { const f = (H[H.length - 6 + i].gross / T.gross) * (13 / 12); const paye = r2(T.tax * f), eeNi = r2(T.ni * f), erNi = r2(T.erni * f); const off = Math.min(ea, erNi); ea = r2(ea - off); return { m, paye, eeNi, erNi, off: r2(off), due: r2(paye + eeNi + erNi - off), date: ['2026-05-22', '2026-06-22', '2026-07-22', '2026-08-21', '2026-09-22', '2026-10-22'][i], paid: i < 5 }; });
    return html`<${PO.PageHeader} title="Tax & HMRC" sub="Tax year 2026-27 for PAYE reference 961/HF48213 (Accounts Office 961PH00482137)."
        actions=${html`<${Button} onClick=${() => PO.fakeDownload('P32 employer payment record')}>P32 report</${Button}><${Button} kind="primary" onClick=${() => PO.toast('EPS for tax month 6 submitted to HMRC')}>Submit EPS</${Button}>`} />
      <${PO.KpiStrip} items=${[
        { label: 'PAYE this period', icon: 'Landmark', accent: 'blue', value: PO.money(T.tax), sub: `${P.people.length} employees` },
        { label: 'National Insurance', icon: 'Landmark', accent: 'blue', value: PO.money(T.ni + T.erni, { compact: true }), sub: `${PO.money(T.ni, { compact: true })} employee, ${PO.money(T.erni, { compact: true })} employer`, bar: [{ v: T.ni, k: 'ok', title: 'Employee' }, { v: T.erni, k: 'mute', title: 'Employer' }] },
        { label: 'Employment Allowance left', icon: 'Gift', accent: 'amber', value: PO.money(ea), sub: 'Of £10,500 for 2026-27', alert: !ea, bar: [{ v: 10500 - ea, k: 'ok', title: 'Used' }, { v: ea, k: 'mute', title: 'Left' }] },
        { label: 'RTI status', icon: 'History', accent: 'blue', value: 'Up to date', sub: `${fps.length - 1} FPS accepted this tax year` },
      ]} />
      <div style="margin-top:24px"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['codes', 'Tax codes', P.people.length], ['rti', 'RTI submissions'], ['p32', 'P32 payments'], ['year', 'P60, P11D & P45']]} /></div>
      <div>
      ${tab === 'codes' ? html`<div class="col" style="gap:16px">
          <${Card} title="Coding notices from HMRC" icon="Landmark" accent="blue" sub=${`${notices.filter((n) => !applied[n.id]).length} to apply`} flush>
            <div class="list">${notices.map((n) => html`<div class="list-item"><${Avatar} p=${n.p} size="sm" /><div class="grow"><span class="w-500">${n.p.name}</span> <span class="faint t-sm">${n.form}, ${n.p.ids.taxCode} to <b class="w-500" style="color:var(--text)">${n.code}</b></span><div class="faint t-sm">${n.why}. Received ${PO.date(PO.addDays(PO.TODAY, -3 - +n.id.slice(-1)), { short: true })}.</div></div>${applied[n.id] ? html`<span class="t-sm muted">Applied from period 8</span>` : html`<${Button} size="sm" onClick=${() => { setApplied({ ...applied, [n.id]: true }); PO.toast(`${n.p.first}’s tax code changed to ${n.code} from the next period`); }}>Apply</${Button}>`}</div>`)}</div>
          </${Card}>
          <${DataTable} rows=${P.people} exportName="tax-codes" search=${(p) => p.name + ' ' + p.id + ' ' + codeOf(p)} pageSize=${12}
            filters=${[{ key: 'c', label: 'Code', options: [...new Set(P.people.map(codeOf))], test: (p, v) => codeOf(p) === v }]}
            columns=${[
              { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} size="sm" sub=${p.id} />`, sort: (p) => p.name },
              { key: 'ni', label: 'NI number', render: (p) => html`<span class="tnum">${p.ids.ni}</span>`, sort: false, csv: (p) => p.ids.ni },
              { key: 'code', label: 'Tax code', render: (p) => html`<span class="tnum w-500">${codeOf(p)}</span>`, sort: codeOf, csv: codeOf },
              { key: 'basis', label: 'Basis', render: (p) => (p.joiner ? 'Week 1 / Month 1' : 'Cumulative'), sort: false },
              { key: 'cat', label: 'NI category', render: () => 'A', sort: false },
              { key: 'sl', label: 'Student loan', render: (p) => loan(p) || html`<span class="faint">–</span>`, sort: loan },
              { key: 'tax', label: 'PAYE this period', align: 'r', render: (p) => html`<span class="tnum">${fine(p.pay.ded.find((l) => l.k === 'tax').amt)}</span>`, sort: (p) => p.pay.ded.find((l) => l.k === 'tax').amt },
            ]} />
        </div>`
      : tab === 'rti' ? html`<${Card} title="Real Time Information log" icon="FileCheck2" accent="violet" sub="Full Payment and Employer Payment Summaries" flush>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Submission</th><th>Period</th><th>Submitted</th><th class="r">Employees</th><th class="r">Taxable pay</th><th>HMRC reference</th><th>Status</th></tr></thead>
            <tbody>${fps.slice().reverse().map((f, k) => html`<tr><td class="w-500">FPS</td><td>${f.h.label.replace('*', '')}</td><td>${f.cur ? 'Sends on lock' : PO.date(PO.addDays(f.paid, -2), { short: true })}</td><td class="r tnum">${f.h.heads}</td><td class="r tnum">${PO.money(f.h.gross)}</td><td class="faint tnum">${f.cur ? '—' : 'IR-' + (48213000 + k * 7919).toString(16).toUpperCase()}</td><td>${f.cur ? html`<${PO.Status} s="Draft" />` : html`<${PO.Status} s="Accepted" />`}</td></tr>`)}
            ${['Sep', 'Aug', 'Jul'].map((m, k) => html`<tr><td class="w-500">EPS</td><td>Tax month ${5 - k}</td><td>19 ${m}</td><td class="r faint">–</td><td class="r faint">EA claim</td><td class="faint tnum">${'IR-EPS-' + (3317 + k)}</td><td><${PO.Status} s="Accepted" /></td></tr>`)}</tbody></table></div>
        </${Card}>`
      : tab === 'p32' ? html`<${Card} title="P32 employer payment record" icon="Banknote" accent="green" sub="Paid to HMRC by the 22nd" flush>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Tax month</th><th class="r">PAYE</th><th class="r">Employee NI</th><th class="r">Employer NI</th><th class="r">Employment Allowance</th><th class="r">Due to HMRC</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>${p32.map((r) => html`<tr><td>${r.m}</td><td class="r tnum">${fine(r.paye)}</td><td class="r tnum">${fine(r.eeNi)}</td><td class="r tnum">${fine(r.erNi)}</td><td class="r tnum">${r.off ? '−' + fine(r.off) : '–'}</td><td class="r tnum w-600">${fine(r.due)}</td><td>${PO.date(r.date, { short: true })}</td><td>${r.paid ? html`<${PO.Status} s="Paid" />` : html`<${PO.Status} s="Due soon" />`}</td></tr>`)}</tbody>
            <tfoot><tr><td>Tax year to date</td><td class="r tnum">${fine(sum(p32, (r) => r.paye))}</td><td class="r tnum">${fine(sum(p32, (r) => r.eeNi))}</td><td class="r tnum">${fine(sum(p32, (r) => r.erNi))}</td><td class="r tnum">−${fine(sum(p32, (r) => r.off))}</td><td class="r tnum">${fine(sum(p32, (r) => r.due))}</td><td></td><td></td></tr></tfoot></table></div>
        </${Card}>`
      : html`<${Card} title="Year-end forms" icon="FileCheck2" accent="violet" flush><table class="tbl"><tbody>
          ${[['P60', 'P60s for 2025-26', `Issued 28 May 2026 to ${H[H.length - 7].heads} employees`, 'Next due 31 May 2027'], ['P11D', 'P11D(b) for 2025-26', 'No benefits in kind. Nil declaration filed 1 Jul 2026.', 'Next due 6 Jul 2027'], ['P45', 'P45s this tax year', `${P.exits.map((x) => x.name).join(', ')}`, 'Issued with final pay']].map(([k, t, sub, n]) => html`<tr><td><span class="w-500">${t}</span><div class="faint t-sm">${sub}</div></td><td class="t-sm muted">${n}</td><td class="r"><${Button} size="sm" onClick=${() => PO.fakeDownload(t)}>Download</${Button}></td></tr>`)}
        </tbody></table></${Card}>`}
      </div>`;
  }

  /* ================= benefits ================= */
  /** Chips for declaration sections and benefit plans. */
  const SEC_IC = { '80C': ['PiggyBank', 'teal'], '80D': ['HeartPulse', 'rose'], HRA: ['House', 'blue'], '24(b)': ['Landmark', 'violet'] };
  const SecChip = ({ s }) => { const [i, a] = SEC_IC[s] || ['FileText', 'green']; return html`<span class="row" style="gap:8px"><${PO.Chip} icon=${i} accent=${a} size=${13} /><span class="w-500">${s}</span></span>`; };
  const planIc = (t) => /waiv|opted out|not eligible|none/i.test(t) ? ['CircleMinus', 'violet'] : /dental/i.test(t) ? ['Smile', 'teal'] : /vision|eye/i.test(t) ? ['Eye', 'violet'] : /life|term/i.test(t) ? ['Shield', 'blue'] : /401|pension|NEST|PF|provident|retire/i.test(t) ? ['PiggyBank', 'teal'] : /ESI|medical|health|insur|hospital|mediclaim|HMO|PPO|BCBS/i.test(t) ? ['HeartPulse', 'rose'] : /gratuity|bonus/i.test(t) ? ['Gift', 'amber'] : /cycle|travel|commut/i.test(t) ? ['Bike', 'green'] : /EAP|wellbeing|assist/i.test(t) ? ['HeartHandshake', 'violet'] : ['BadgeCheck', 'green'];
  const PlanName = ({ t }) => { const [i, a] = planIc(t); return html`<span class="row" style="gap:10px"><${PO.Chip} icon=${i} accent=${a} size=${13} /><span>${t}</span></span>`; };

  function Benefits() {
    const P = PO.P();
    const [enr, setEnr] = PO.useCoState('benefits.enrolled', {});
    const [sel, setSel] = useState(null);
    const data = useMemo(() => benefitsData(P), [P.id]);
    const rows = data.rows.map((r) => (enr[r.p.id] ? { ...r, ...enr[r.p.id] } : r));
    return html`<${PO.PageHeader} title="Benefits" sub=${data.sub}
        actions=${html`<${Button} onClick=${() => PO.exportCsv('benefits-enrolment', [['Employee', 'Plan', 'Coverage', 'Status', 'Contribution'], ...rows.map((r) => [r.p.name, r.plan, r.cover, r.status, r.contrib])])}>Export</${Button}><${Button} kind="primary" onClick=${() => PO.toast(data.primaryToast, { icon: 'Send' })}>${data.primary}</${Button}>`} />
      <${PO.KpiStrip} items=${data.kpis} />
      ${data.callout ? html`<div style="margin-top:24px"><${Callout} tone=${data.callout.tone} icon=${data.callout.icon} title=${data.callout.title}>${data.callout.text}</${Callout}></div>` : null}
      <div style="margin-top:24px"><${Card} title="Plans" icon="HeartPulse" accent="rose" sub=${data.plansSub} flush foot=${data.note ? html`<span class="faint t-sm">${data.note}</span>` : null}>
        <div class="table-wrap"><table class="tbl"><thead><tr>${data.planCols.map((c, i) => html`<th class=${i > 1 ? 'r' : ''}>${c}</th>`)}</tr></thead>
          <tbody>${data.plans.map((r) => html`<tr>${r.map((v, i) => html`<td class=${i > 1 ? 'r tnum' : i === 0 ? 'w-500' : 'muted'}>${i === 0 && typeof v === 'string' ? html`<${PlanName} t=${v} />` : v}</td>`)}</tr>`)}</tbody></table></div>
      </${Card}></div>
      <div style="margin-top:24px"><${DataTable} rows=${rows} rowKey=${(r) => r.p.id} exportName="benefits-enrolment" search=${(r) => r.p.name + ' ' + r.p.id} pageSize=${12} onRow=${setSel}
        filters=${[{ key: 's', label: 'Status', options: [...new Set(rows.map((r) => r.status))], test: (r, v) => r.status === v }, { key: 'pl', label: 'Plan', options: [...new Set(rows.map((r) => r.plan))], test: (r, v) => r.plan === v }]}
        columns=${[
          { key: 'name', label: 'Employee', render: (r) => html`<${Who} p=${r.p} size="sm" sub=${r.p.title + ', ' + PO.site(r.p.site).name} link=${false} />`, sort: (r) => r.p.name, csv: (r) => r.p.name },
          { key: 'plan', label: 'Plan', render: (r) => html`<${PlanName} t=${r.plan} />`, sort: (r) => r.plan, csv: (r) => r.plan },
          { key: 'cover', label: 'Coverage', render: (r) => r.cover, sort: (r) => r.cover },
          { key: 'contrib', label: data.contribLabel, align: 'r', render: (r) => html`<span class="tnum">${r.contrib}</span>`, sort: (r) => r.contribN || 0 },
          { key: 'status', label: 'Status', render: (r) => (/Enrolled|Covered|Active|Member/.test(r.status) ? html`<span class="t-sm muted">${r.status}</span>` : html`<${Badge} tone=${/Opted out|Waived|Not eligible/.test(r.status) ? 'slate' : 'amber'} dot>${r.status}</${Badge}>`), sort: (r) => r.status },
        ]} /></div>
      <${Drawer} open=${!!sel} title=${sel ? sel.p.name : ''} sub=${sel ? `${sel.p.title}, ${sel.p.id}` : ''} size="sm" onClose=${() => setSel(null)}
        footer=${sel && data.enrolAction && !/Enrolled|Covered|Active|Member/.test(sel.status) && sel.status !== 'Not eligible' ? html`<${Button} kind="primary" onClick=${() => { setEnr({ ...enr, [sel.p.id]: data.enrolAction(sel) }); PO.toast(`${sel.p.first} enrolled`); setSel(null); }}>Enrol ${sel.p.first}</${Button}>` : html`<${Button} onClick=${() => setSel(null)}>Close</${Button}>`}>
        ${sel ? html`<div class="col" style="gap:14px"><${KV} items=${[['Plan', sel.plan], ['Coverage', sel.cover], [data.contribLabel, sel.contrib], ['Status', sel.status], ...(sel.extra || [])]} />
          ${sel.deps && sel.deps.length ? html`<div><div class="t-sm w-600" style="margin-bottom:6px">Dependants</div><div class="card" style="overflow:hidden"><div class="list">${sel.deps.map(([n, rel, age]) => html`<div class="list-item"><${Avatar} name=${n} size="xs" /><span class="grow">${n}</span><span class="faint t-sm">${rel}, ${age}</span></div>`)}</div></div></div>` : null}</div>` : null}
      </${Drawer}>`;
  }
  function benefitsData(P) {
    const T = P.totals;
    if (P.id === 'in') {
      const esi = P.people.filter((p) => p.pay.ded.some((l) => l.k === 'esi'));
      const gmc = P.people.filter((p) => !p.pay.ded.some((l) => l.k === 'esi'));
      const basic = P.people.reduce((t, p) => t + p.pay.earn.find((l) => l.k === 'basic').amt, 0);
      const grat = Math.round(basic * 0.0481);
      const eps = P.people.reduce((t, p) => t + Math.round(Math.min(p.pay.earn.find((l) => l.k === 'basic').amt, 25000) * 0.0833), 0);
      const rows = P.people.map((p) => {
        const r = PO.seeded('ben' + p.id);
        const isEsi = esi.includes(p);
        const nd = isEsi ? 0 : r.int(0, 4);
        const deps = Array.from({ length: nd }, (_, i) => [i === 0 ? `${r.pick(P.names[p.g === 'f' ? 'm' : 'f'])} ${p.last}` : `${r.pick([...P.names.m, ...P.names.f])} ${p.last}`, i === 0 ? 'Spouse' : i === 3 ? 'Parent' : 'Child', i === 0 ? `${p.age - 2} yrs` : i === 3 ? '62 yrs' : `${r.int(2, 14)} yrs`]);
        return isEsi ? { p, plan: 'ESIC', cover: 'Self and family', contrib: PO.money(p.pay.ded.find((l) => l.k === 'esi').amt) + ' / month', contribN: p.pay.ded.find((l) => l.k === 'esi').amt, status: 'Covered', extra: [['ESIC IP number', p.ids.esic], ['Dispensary', 'ESIC Dispensary, Bibwewadi']], deps: [] }
          : { p, plan: 'Group mediclaim', cover: nd ? `Self + ${nd}` : 'Self', contrib: 'Employer paid', contribN: 0, status: p.joiner ? 'Pending' : 'Enrolled', deps, extra: [['Sum insured', '₹3,00,000 family floater'], ['TPA', 'Medi Assist'], ['E-card', 'MA-' + p.id.slice(-4) + '-26']] };
      });
      return { sub: 'Group mediclaim, ESIC, gratuity and provident fund', primary: 'Send e-cards', primaryIcon: 'Send', primaryToast: `GMC e-cards emailed and shared to the employee portal for ${gmc.length} people`, contribLabel: 'Employee share', rows,
        kpis: [{ label: 'Covered by ESIC', icon: 'HeartPulse', accent: 'rose', value: PO.num(esi.length), unit: '/' + P.people.length, sub: `${PO.money(T.esi + T.eresi)} contributions this month`, bar: [{ v: esi.length, k: 'ok', title: 'ESIC' }, { v: gmc.length, k: 'mute', title: 'Group mediclaim' }] }, { label: 'Group mediclaim', icon: 'HeartPulse', accent: 'rose', value: PO.num(gmc.length), sub: `${rows.reduce((t, r) => t + (r.deps ? r.deps.length : 0), 0)} dependants, renews 1 Apr 2027` }, { label: 'Gratuity provision', icon: 'Gift', accent: 'amber', value: PO.money(grat), sub: '4.81% of basic this month' }, { label: 'EPS contributions', icon: 'PiggyBank', accent: 'teal', value: PO.money(eps), sub: '8.33% of employer PF, wages up to ₹25,000' }],
        note: `The EPF wage ceiling rose to ₹25,000 on 17 Sep 2026, so ${P.people.filter((p) => p.pay.structure.total > 15000 && p.pay.structure.total <= 25000).length} people on ₹15,000–₹25,000 now contribute to EPS as well.`,
        plansSub: 'Insurer, cover and cost', planCols: ['Plan', 'Provider', 'Members', 'Dependants', 'Cover', 'Annual premium'],
        plans: [['Group mediclaim (GMC)', 'ICICI Lombard, TPA Medi Assist', PO.num(gmc.length), PO.num(rows.reduce((t, r) => t + (r.deps ? r.deps.length : 0), 0)), '₹3,00,000 floater', PO.money(gmc.length * 7850)], ['Group personal accident', 'ICICI Lombard', PO.num(P.people.length), '–', '₹5,00,000', PO.money(P.people.length * 420)], ['ESIC', 'Employees’ State Insurance Corporation', PO.num(esi.length), 'Family', 'Medical + cash benefits', PO.money((T.esi + T.eresi) * 12)], ['Gratuity', 'LIC group gratuity trust', PO.num(P.people.length), '–', '15 days per year of service', PO.money(grat * 12)]],
        enrolAction: () => ({ status: 'Enrolled' }) };
    }
    if (P.id === 'us') {
      const elig = P.people.filter((p) => p.type === 'Full-time');
      const rows = P.people.map((p) => {
        const r = PO.seeded('ben' + p.id);
        if (p.type !== 'Full-time') return { p, plan: 'Not eligible', cover: '—', contrib: '–', status: 'Not eligible', extra: [['Reason', 'Part-time, under 30 hours a week (ACA)']] };
        const plan = r.pick(['BCBS TX PPO', 'BCBS TX HMO', 'BCBS TX HMO', 'Waived']);
        if (plan === 'Waived') return { p, plan: 'Waived', cover: 'Covered elsewhere', contrib: '$0.00', status: 'Waived', extra: [['401(k)', p.k401 ? '4%, with a 3% match' : 'Not enrolled']] };
        const tier = r.pick(['Employee only', 'Employee only', 'Employee + spouse', 'Family']);
        const c = { 'Employee only': 46, 'Employee + spouse': 148, Family: 212 }[tier] * (plan.includes('PPO') ? 1.35 : 1);
        return { p, plan, cover: tier, contrib: PO.money(c, { cents: true }) + ' / check', contribN: c, status: p.joiner ? 'Waiting period' : 'Enrolled', extra: [['Dental', 'Delta Dental PPO'], ['Vision', 'VSP Choice'], ['401(k)', p.k401 ? '4%, with a 3% match' : 'Not enrolled']] };
      });
      const k = P.people.filter((p) => p.k401);
      return { sub: 'Medical, dental, vision and 401(k). Open enrollment runs Nov 2–20.', primary: 'Open enrollment', primaryIcon: 'CalendarCheck', primaryToast: 'Open enrollment invites scheduled for Nov 2', contribLabel: 'Employee premium', rows,
        kpis: [{ label: 'Medical enrolled', icon: 'HeartPulse', accent: 'rose', value: PO.num(rows.filter((r) => r.status === 'Enrolled').length), unit: '/' + elig.length, sub: 'Eligible full-time staff', bar: [{ v: rows.filter((r) => r.status === 'Enrolled').length, k: 'ok', title: 'Enrolled' }, { v: rows.filter((r) => r.status === 'Waiting period').length, k: 'warn', title: 'Waiting period' }, { v: rows.filter((r) => r.status === 'Waived').length, k: 'mute', title: 'Waived' }] }, { label: '401(k) participation', icon: 'PiggyBank', accent: 'teal', value: PO.pct(k.length / P.people.length), sub: `${k.length} people, ${PO.money(T['401k'])} deferred this check`, bar: [{ v: k.length, k: 'ok', title: 'Participating' }, { v: P.people.length - k.length, k: 'mute', title: 'Not enrolled' }] }, { label: 'Employer match', icon: 'HandCoins', accent: 'green', value: PO.money(T.er401k), sub: '3% of pay, this check' }, { label: 'Open enrollment', icon: 'CalendarClock', accent: 'amber', value: 'Nov 2', sub: 'In 27 days, runs to Nov 20', alert: true }],
        callout: { tone: 'amber', icon: 'CalendarClock', title: 'Open enrollment starts in 27 days', text: 'BCBS renewal came in at +6.8%. Review the employer share before invites go out.' },
        plansSub: 'Plan year 2026', planCols: ['Plan', 'Carrier', 'Enrolled', 'Employee / check', 'Employer / month', 'Deductible'],
        plans: [['Medical PPO', 'Blue Cross Blue Shield of Texas', PO.num(rows.filter((r) => r.plan === 'BCBS TX PPO').length), '$62.10', '$512.00', '$1,500'], ['Medical HMO', 'Blue Cross Blue Shield of Texas', PO.num(rows.filter((r) => r.plan === 'BCBS TX HMO').length), '$46.00', '$441.00', '$2,500'], ['Dental PPO', 'Delta Dental', PO.num(rows.filter((r) => r.status === 'Enrolled').length), '$9.40', '$28.00', '$50'], ['Vision', 'VSP Choice', PO.num(rows.filter((r) => r.status === 'Enrolled').length), '$3.20', '$6.50', '$0'], ['401(k)', 'Guideline, safe harbor 3% match', PO.num(k.length), '4% of pay', PO.money(T.er401k * 26 / 12), '–']],
        enrolAction: () => ({ plan: 'BCBS TX HMO', cover: 'Employee only', contrib: '$46.00 / check', status: 'Enrolled' }) };
    }
    const qe = (p) => p.pay.gross > 480;
    const rows = P.people.map((p) => {
      const r = PO.seeded('ben' + p.id);
      const pen = p.pay.ded.find((l) => l.k === 'pen').amt;
      if (!qe(p)) return { p, plan: 'NEST', cover: 'Entitled worker', contrib: '£0.00', status: 'Not eligible', extra: [['Earnings', 'Below the £480 four-weekly trigger'], ['Right', 'Can ask to join']] };
      const out = r.chance(0.08);
      return { p, plan: 'NEST', cover: 'Eligible jobholder', contrib: out ? '£0.00' : fine(pen) + ' a period', contribN: out ? 0 : pen, status: out ? 'Opted out' : p.joiner ? 'Postponed to 26 Dec' : 'Member', extra: [['Employer 3%', fine(p.pay.er.find((l) => l.k === 'erpen').amt)], ['Cycle to work', r.chance(0.1) ? 'Active, £640 bike over 12 months' : 'Not joined']] };
    });
    const mem = rows.filter((r) => r.status === 'Member');
    const opt = rows.filter((r) => r.status === 'Opted out');
    return { sub: 'Workplace pension (NEST), cycle to work and the employee assistance programme', primary: 'Send pension statements', primaryIcon: 'Send', primaryToast: `Pension statements emailed and shared to the employee portal for ${mem.length} members`, contribLabel: 'Employee 5%', rows,
      kpis: [{ label: 'Pension members', icon: 'PiggyBank', accent: 'teal', value: PO.num(mem.length), unit: '/' + P.people.length, sub: `${PO.money(T.pen + T.erpen)} into NEST this period`, bar: [{ v: mem.length, k: 'ok', title: 'Members' }, { v: rows.filter((r) => /Postponed/.test(r.status)).length, k: 'warn', title: 'Postponed' }, { v: opt.length, k: 'mute', title: 'Opted out' }, { v: rows.filter((r) => r.status === 'Not eligible').length, title: 'Not eligible' }] }, { label: 'Opt-outs', icon: 'CircleMinus', accent: 'violet', value: PO.num(opt.length), sub: 'Re-enrolled automatically on 1 Jun 2027' }, { label: 'Re-enrolment date', icon: 'CalendarClock', accent: 'amber', value: '1 Jun 2027', sub: 'Declaration of compliance due 31 Aug 2027' }, { label: 'Cycle to work', icon: 'Bike', accent: 'green', value: PO.num(rows.filter((r) => r.extra && r.extra.some((e) => /Active/.test(e[1]))).length), sub: 'Salary sacrifice through Cyclescheme' }],
      note: 'Auto-enrolment duties met: every eligible jobholder was enrolled within 6 weeks of starting. Chloe Hughes is in a 3-month postponement and joins on 26 Dec.',
      plansSub: 'Contributions on qualifying earnings', planCols: ['Scheme', 'Provider', 'Members', 'Employee', 'Employer', 'This period'],
      plans: [['Workplace pension', 'NEST, employer ref EMP048213', PO.num(mem.length), '5%', '3%', fine(T.pen + T.erpen)], ['Cycle to work', 'Cyclescheme, salary sacrifice', PO.num(rows.filter((r) => r.extra && r.extra.some((e) => /Active/.test(e[1]))).length), 'Up to £1,000', 'NI saving', '–'], ['Employee assistance', 'Health Assured, 24/7 helpline', PO.num(P.people.length), '–', '£2.10 per head', fine(P.people.length * 2.1)]],
      enrolAction: () => ({ status: 'Member' }) };
  }

  PO.route('compensation', Compensation, { title: 'Salary & comp' });
  PO.route('tax', Tax, { title: 'Tax & declarations' });
  PO.route('benefits', Benefits, { title: 'Benefits' });
})();
