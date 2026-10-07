/* Reports & analytics: overview tiles, a library of 14 report dashboards, scheduled deliveries and an
   "Ask a question" builder. Every number is derived from the company's shared records (people, pay history,
   leave, documents, hiring); the only module-local data is the seeded history of past leavers. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
    .rpt-filters { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:-4px 0 16px; }
    .rpt-filters .select { width:auto; min-width:150px; height:30px; }
    .rpt-back { display:inline-flex; align-items:center; gap:4px; color:var(--text-2); font-size:12px; margin-bottom:8px; }
    .rpt-back:hover { color:var(--text); }
    .rpt-cat { display:flex; align-items:center; gap:8px; padding:10px 16px 8px; font-size:12.5px; font-weight:600; color:var(--text-2); border-bottom:1px solid var(--border); background:var(--surface-2); }
    .rpt-cat .chip-ic { width:20px; height:20px; border-radius:6px; }
    .rpt-cat .n { color:var(--text-3); font-weight:500; }
    .rpt-row .chip-ic { width:32px; height:32px; border-radius:9px; }
    .rpt-mini .chip-ic { width:24px; height:24px; border-radius:7px; }
    .rpt-row { display:flex; align-items:center; gap:16px; padding:10px 16px; border-bottom:1px solid var(--border); color:inherit; }
    .rpt-row:hover { background:var(--hover); }
    .rpt-row:hover .rpt-name { color:var(--brand-text); }
    .rpt-name { display:block; font-weight:550; }
    .rpt-desc { display:block; color:var(--text-3); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
    .rpt-meta { display:flex; gap:12px; color:var(--text-3); font-size:12px; flex:none; }
    .rpt-when { width:120px; flex:none; text-align:right; color:var(--text-3); font-size:12px; font-variant-numeric:tabular-nums; }
    .rpt-pin { flex:none; opacity:0; transition:opacity .1s; } .rpt-row:hover .rpt-pin { opacity:1; }
    .rpt-notes { margin:0; padding-left:16px; display:flex; flex-direction:column; gap:10px; color:var(--text-2); line-height:1.5; }
    .rpt-notes b { color:var(--text); font-weight:600; }
    .rpt-ask { display:flex; align-items:center; gap:8px; padding:4px 4px 4px 12px; border:1px solid var(--border-strong); border-radius:var(--r-lg); background:var(--surface); }
    .rpt-ask:focus-within { box-shadow:0 0 0 3px var(--ring); border-color:var(--brand); }
    .rpt-ask input { border:none; outline:none; background:transparent; flex:1; height:32px; font-size:13.5px; min-width:0; }
    .rpt-read { margin-top:10px; font-size:12.5px; color:var(--text-2); padding-left:10px; border-left:2px solid var(--border-strong); }
    .rpt-read.low { border-left-color:var(--amber-solid); }
    .rpt-builder { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)) auto; gap:12px; }
    .rpt-chip { display:inline-flex; align-items:center; gap:6px; height:26px; padding:0 6px 0 4px; border-radius:13px; background:var(--surface-3); border:1px solid var(--border); font-size:12px; }
    .rpt-chip button { border:none; background:none; color:var(--text-3); cursor:pointer; display:grid; place-items:center; padding:0; }
    .rpt-mini { display:flex; align-items:center; gap:10px; padding:9px 16px; border-bottom:1px solid var(--border); cursor:pointer; min-height:40px; }
    .rpt-mini:last-child { border-bottom:none; } .rpt-mini:hover { background:var(--hover); }
    .rpt-none { padding:4px 16px 14px; color:var(--text-3); font-size:12.5px; }
    .rpt-chk { display:flex; align-items:center; justify-content:flex-start; text-align:left; gap:8px; padding:8px 10px; background:var(--surface); color:var(--text); font-weight:500; height:36px; border:1px solid var(--border); border-radius:var(--r); cursor:pointer; flex:1; }
    .rpt-chk.on { border-color:var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
  </style>`);

  /* ---------- small helpers ---------- */
  const sum = (a, f) => a.reduce((t, x) => t + (+f(x) || 0), 0);
  const group = (a, f) => { const m = new Map(); a.forEach((x) => { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return m; };
  const shortName = (n, max = 15) => { if (n.length <= max) return n; const two = n.split(' ').slice(0, 2).join(' '); return two.length <= max ? two : n.split(' ')[0]; };
  const siteName = (id) => (PO.site(id) || {}).name || id;
  const m0 = (v) => PO.money(Math.round(v));
  const mc = (v) => PO.money(v, { compact: true });
  const ax = (v) => mc(v).replace(/\.00(?=\s?[A-Za-z])/, '').replace(/(\.\d)0(?=\s?[A-Za-z])/, '$1').replace(/\s(?=[LCr]|Cr)/, '');
  const pc = (v, d = 0) => (isFinite(v) ? (v * 100).toFixed(d) + '%' : '—');
  const PERIOD_DAYS = { in: 30, us: 14, uk: 28 };
  const PER_YEAR = { in: 12, us: 26, uk: 13 };
  const LEAVE_KEY = { in: 'el', us: 'pto', uk: 'hol' };
  const SICK_KEY = { in: 'sl', us: 'sick', uk: 'sick' };
  const periodWord = (P) => (P.id === 'in' ? 'month' : 'pay period');
  const shortLabel = (P, l) => { const s = l.replace('*', '').split(' – ')[0]; return P.id === 'in' ? s.slice(0, 3) : s; };
  const fullName = (P) => P.byId[P.hrId].name;
  /** One hue for charts: ink-blue, two tints of it, then grey for comparison. */
  const RAMP = ['var(--chart-1)', 'color-mix(in srgb, var(--chart-1) 58%, var(--surface))', 'color-mix(in srgb, var(--chart-1) 30%, var(--surface))', 'var(--chart-5)', 'color-mix(in srgb, var(--chart-5) 50%, var(--surface))'];

  /** index (0..11) of the pay period a date falls in, matching P.payHistory */
  function periodIdx(P, iso) {
    if (P.id === 'in') { const y = +iso.slice(0, 4), mo = +iso.slice(5, 7) - 1; return Math.min(11, (y - 2025) * 12 + mo - 9); }
    const end = new Date('2026-10-04T00:00:00Z'), d = new Date(iso + 'T00:00:00Z');
    const k = Math.floor((end - d) / 864e5 / PERIOD_DAYS[P.id]);
    return k < 0 ? 11 : 11 - k;
  }
  function periodEnd(P, i) {
    if (P.id === 'in') { const d = new Date(Date.UTC(2025, 9 + i + 1, 0)); return d.toISOString().slice(0, 10); }
    return PO.addDays('2026-10-04', -(11 - i) * PERIOD_DAYS[P.id]);
  }

  /* Rate used to value one unit of the main paid-leave type (a day in IN/UK, an hour in the US). */
  function leaveRate(P, p) {
    const R = P.roles[p.role] || {};
    if (P.id === 'in') return p.pay.structure.total / 30;
    if (P.id === 'us') return R.salary ? R.salary / 80 : R.rate;
    return R.salary ? R.salary / 20 : R.rate * 8;
  }

  /* Past leavers over the last 12 pay periods (seeded, module-local), plus this period's real exits. */
  function buildLeavers(P) {
    const r = PO.seeded('rpt-leavers' + P.id);
    const rate = { in: 0.29, us: 0.3, uk: 0.33 }[P.id];
    const n = Math.round(P.people.length * rate);
    const R = {
      in: [['Better pay at another agency', 1, 5], ['Moved back to native place', 1, 4], ['Absconding (10+ days)', 0, 2], ['Family reasons', 1, 2], ['Higher studies', 1, 1], ['Client contract ended', 0, 1], ['Misconduct', 0, 1]],
      us: [['Better pay elsewhere', 1, 4], ['Went back to school', 1, 3], ['Schedule didn’t fit', 1, 3], ['Relocated', 1, 2], ['No-call no-show', 0, 2], ['Performance', 0, 1]],
      uk: [['Better hourly rate elsewhere', 1, 4], ['Shift pattern', 1, 3], ['Returning home', 1, 2], ['Health', 1, 1], ['Failed probation', 0, 1], ['Contract lost (client)', 0, 1]],
    }[P.id];
    const bag = R.flatMap((x) => Array(x[2]).fill(x));
    const taken = new Set(P.people.map((p) => p.name));
    const ops = P.people.filter((p) => p.role !== 'office');
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = r.pick(ops);
      const g = r.chance(t.g === 'f' ? 0.75 : 0.25) ? 'f' : 'm';
      let name = `${r.pick(P.names[g])} ${r.pick(P.last)}`, k = 0;
      while (taken.has(name) && k++ < 30) name = `${r.pick(P.names[g])} ${r.pick(P.last)}`;
      taken.add(name);
      const idx = r.int(0, 10);
      const [reason, vol] = r.pick(bag);
      out.push({ id: 'LVR-' + (500 + i), name, g, site: t.site, dept: t.dept, title: t.title, idx, reason, vol: !!vol, tenure: r.int(1, 46), lastDay: PO.addDays(periodEnd(P, idx), -r.int(0, PERIOD_DAYS[P.id] - 2)) });
    }
    P.exits.filter((e) => e.lastDay <= PO.TODAY).forEach((e, i) => out.push({ id: e.id, name: e.name, g: 'm', site: e.site, dept: (P.people.find((p) => p.site === e.site && p.role !== 'office') || {}).dept || 'Operations', title: e.reason + ', ' + (e.reason === 'Resigned' ? 'final pay' : 'separation'), idx: 11, reason: e.why, vol: e.reason === 'Resigned', tenure: 8 + i * 5, lastDay: e.lastDay }));
    return out.sort((a, b) => b.lastDay.localeCompare(a.lastDay));
  }

  /* ---------- report catalogue ---------- */
  const CATS = [['People'], ['Time'], ['Payroll'], ['Compliance'], ['Talent']];
  /** Category accent and icon, used for report rows, the category headings and report pages. */
  const CAT_META = { People: ['Users', 'blue'], Time: ['Clock', 'amber'], Payroll: ['Banknote', 'green'], Compliance: ['ShieldCheck', 'teal'], Talent: ['Trophy', 'violet'] };
  const catAcc = (c) => (CAT_META[c] || ['FileText', 'green'])[1];
  /** Pick a header icon from the chart a card holds. */
  const chartIcon = (el) => { const C = PO.Charts || {}; const t = el && el.type; return t === C.Line ? 'ChartLine' : t === C.Donut ? 'ChartPie' : t === C.HBars ? 'ChartBar' : t === C.Heatmap ? 'Grid3x3' : t === C.Bars ? 'ChartColumn' : 'ChartNoAxesColumn'; };

  function catalogue(P) {
    const leaveName = (P.leaveTypes.find((t) => t.key === LEAVE_KEY[P.id]) || {}).name;
    return [
      { key: 'headcount', cat: 'People', icon: 'Users', name: 'Headcount & movement', desc: 'Headcount trend, joiners and leavers each ' + periodWord(P) + ', and the split by employment type.', f: ['period', 'site', 'dept'] },
      { key: 'attrition', cat: 'People', icon: 'UserMinus', name: 'Attrition & exit reasons', desc: 'Annualised attrition, voluntary vs involuntary exits and the reasons people give.', f: ['period', 'site', 'dept'] },
      { key: 'tenure', cat: 'People', icon: 'Hourglass', name: 'Tenure distribution', desc: 'How long people have been with you, by band and by ' + (P.id === 'us' ? 'location' : 'site') + '.', f: ['site', 'dept'] },
      { key: 'diversity', cat: 'People', icon: 'PersonStanding', name: 'Gender diversity', desc: 'Women and men by department and grade, with average pay for each.', f: ['site', 'dept'] },
      { key: 'overtime', cat: 'Time', icon: 'Timer', name: 'Overtime by ' + (P.id === 'us' ? 'location' : 'site'), desc: 'Overtime hours and pay this period, the trend, and who is working the most.', f: ['period', 'site', 'dept'] },
      { key: 'lateness', cat: 'Time', icon: 'AlarmClock', name: 'Lateness by ' + (P.id === 'us' ? 'location' : 'site'), desc: 'Late arrivals this period, late rate per 100 shifts and who is late right now.', f: ['site'] },
      { key: 'absence', cat: 'Time', icon: 'CalendarX2', name: 'Absenteeism', desc: (P.id === 'uk' ? 'Sickness' : 'Sick') + ' and other absence days by ' + periodWord(P) + ', type and site.', f: ['period', 'site', 'dept'] },
      { key: 'liability', cat: 'Time', icon: 'PiggyBank', name: 'Leave liability', desc: `What unused ${leaveName.toLowerCase()} is worth if it were paid out today.`, f: ['site', 'dept'] },
      { key: 'payroll', cat: 'Payroll', icon: 'TrendingUp', name: 'Payroll cost trend', desc: 'Gross, net and employer cost for the last 12 ' + periodWord(P) + 's, with deductions.', f: ['period', 'site', 'dept'] },
      { key: 'labour', cat: 'Payroll', icon: 'Building2', name: P.id === 'us' ? 'Labor cost by location & department' : 'Labour cost by site & department', desc: 'Where the money goes: cost per ' + (P.id === 'us' ? 'location' : 'site') + ', per department and per head.', f: ['site', 'dept'] },
      { key: 'statutory', cat: 'Payroll', icon: 'Landmark', name: 'Statutory contributions', desc: P.id === 'in' ? 'PF, ESI, PT and TDS this month, employee and employer share.' : P.id === 'us' ? 'Federal income tax, FICA and 401(k), employee and employer share.' : 'PAYE, National Insurance and pension, employee and employer share.', f: ['period', 'site', 'dept'] },
      { key: 'documents', cat: 'Compliance', icon: 'FileCheck2', name: 'Document compliance', desc: 'Verified, missing and expiring documents by type and by site.', f: ['site', 'dept'] },
      { key: 'hiring', cat: 'Talent', icon: 'Filter', name: 'Hiring funnel', desc: 'Candidates at each stage, conversion, and which sources bring hires.', f: ['period', 'site'] },
      { key: 'reviews', cat: 'Talent', icon: 'ClipboardCheck', name: 'Review completion', desc: `${P.reviewCycle.name}: who has started, by department and manager.`, f: ['site', 'dept'] },
    ];
  }

  /* ---------- report builders: (ctx) => { stats, charts, table } ---------- */
  function buildReport(key, ctx) {
    const { P, ps, N, idx, leavers } = ctx;
    const hist = P.payHistory;
    const labels = idx.map((i) => shortLabel(P, hist[i].label));
    const costShare = sum(ps, (p) => p.pay.gross + p.pay.erTotal) / P.totals.cost || 0;
    const headShare = ps.length / P.people.length || 0;
    const sitesIn = [...new Set(ps.map((p) => p.site))];
    const sw = P.id === 'us' ? 'Location' : 'Site';
    const who = (p) => html`<${PO.Who} p=${p} size="sm" sub=${p.title + ', ' + p.id} />`;
    const pcol = { key: 'name', label: 'Employee', render: who, sort: (p) => p.name, csv: (p) => p.name };
    const scol = { key: 'site', label: sw, render: (p) => siteName(p.site), sort: (p) => siteName(p.site) };
    const dcol = { key: 'dept', label: 'Department' };
    const inWin = (i) => i >= 12 - N;
    const lv = leavers.filter((l) => inWin(l.idx) && (!ctx.site || l.site === ctx.site) && (!ctx.dept || l.dept === ctx.dept));
    const winLabel = N === 1 ? 'this ' + periodWord(P) : `last ${N} ${periodWord(P)}s`;

    switch (key) {
      case 'headcount': {
        const headAt = (i) => (i === 11 ? ps.length : i < 0 ? Math.round(hist[0].heads * headShare) - Math.max(1, Math.round(2 * headShare)) : Math.round(hist[i].heads * headShare));
        const heads = idx.map(headAt);
        const start = headAt(idx[0] - 1);
        const leftBy = idx.map((i) => lv.filter((l) => l.idx === i).length);
        const joined = idx.map((i, k) => Math.max(0, headAt(i) - headAt(i - 1) + leftBy[k]));
        const types = [...group(ps, (p) => p.type)].map(([k, v]) => ({ label: k, value: v.length }));
        return {
          notes: [`Headcount moved from <b>${PO.num(start)}</b> to <b>${PO.num(ps.length)}</b> over the ${winLabel}.`, `<b>${PO.num(sum(joined, (x) => x))}</b> people joined and <b>${PO.num(lv.length)}</b> left, so you hired about ${(sum(joined, (x) => x) / (lv.length || 1)).toFixed(1)} people for every leaver.`, `${types.length > 1 ? `<b>${pc((types.find((t) => t.label !== 'Full-time') || { value: 0 }).value / (ps.length || 1))}</b> of the team is ${(types.find((t) => t.label !== 'Full-time') || { label: 'other' }).label.toLowerCase()}.` : 'Everyone in this selection is full-time.'}`],
          stats: [
            { label: 'Headcount today', icon: 'Users', value: PO.num(ps.length), spark: heads, sub: `${PO.num(start)} at start of window` },
            { label: 'Joiners', icon: 'UserPlus', value: PO.num(sum(joined, (x) => x)), sub: winLabel },
            { label: 'Leavers', icon: 'UserMinus', value: PO.num(lv.length), sub: winLabel },
            { label: 'Net change', icon: 'ArrowUpDown', value: (ps.length - start >= 0 ? '+' : '') + PO.num(ps.length - start), delta: { v: pc((ps.length - start) / (start || 1), 1), dir: ps.length >= start ? 'up' : 'down' }, sub: 'over the window' },
          ],
          charts: [
            { span: 2, title: 'Headcount', sub: 'Active people at the end of each ' + periodWord(P), el: html`<${PO.Charts.Line} labels=${labels} series=${[{ name: 'Headcount', data: heads }]} height=${200} />` },
            { title: 'By employment type', el: html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${types} sub="people" />` },
            { span: 2, title: 'Joiners and leavers', el: html`<${PO.Charts.Bars} labels=${labels} series=${[{ name: 'Joiners', data: joined, color: 'var(--chart-1)' }, { name: 'Leavers', data: leftBy, color: 'var(--chart-5)' }]} height=${200} />` },
          ],
          table: { name: 'headcount', rows: ps, search: (p) => p.name + p.id + p.title, columns: [pcol, scol, dcol, { key: 'type', label: 'Type', render: (p) => html`<${PO.Status} s=${p.type} dot=${false} />` }, { key: 'status', label: 'Status', render: (p) => html`<${PO.Status} s=${p.status} />` }, { key: 'joined', label: 'Joined', render: (p) => PO.date(p.joinedIso), sort: (p) => p.joinedIso, csv: (p) => p.joinedIso }] },
        };
      }
      case 'attrition': {
        const avgHeads = sum(idx, (i) => (i === 11 ? ps.length : hist[i].heads * headShare)) / N || 1;
        const annual = (lv.length / avgHeads) * (PER_YEAR[P.id] / N);
        const vol = lv.filter((l) => l.vol).length;
        const reasons = [...group(lv, (l) => l.reason)].map(([k, v]) => ({ label: k, value: v.length })).sort((a, b) => b.value - a.value);
        const bySite = sitesIn.map((s) => { const here = ps.filter((p) => p.site === s).length || 1; const out = lv.filter((l) => l.site === s).length; return { label: siteName(s), value: Math.round((out / here) * (PER_YEAR[P.id] / N) * 100), sub: `${out} left` }; }).sort((a, b) => b.value - a.value);
        return {
          notes: [`Annualised attrition is <b>${pc(annual)}</b>${P.id === 'in' ? '; Pune facility-services peers typically run 30–40%' : P.id === 'us' ? '; US cafés and quick-service food typically run 70–130%' : '; UK contract cleaning typically runs 35–50%'}.`, reasons[0] ? `<b>${reasons[0].label}</b> is the most common reason (${pc(reasons[0].value / lv.length)} of leavers).` : 'Nobody left in this window.', bySite[0] ? `<b>${bySite[0].label}</b> loses people fastest at ${bySite[0].value}% a year.` : ''],
          stats: [
            { label: 'Attrition, annualised', icon: 'TrendingDown', value: pc(annual), tone: annual > 0.35 ? 'red' : annual > 0.2 ? 'amber' : undefined, sub: winLabel },
            { label: 'Leavers', icon: 'UserMinus', value: PO.num(lv.length), sub: `${PO.num(vol)} voluntary, ${PO.num(lv.length - vol)} involuntary` },
            { label: 'Left within 6 months', icon: 'Hourglass', value: pc(lv.filter((l) => l.tenure <= 6).length / (lv.length || 1)), sub: 'early attrition' },
            { label: 'Top reason', icon: 'MessageSquareQuote', value: html`<span class="t-md w-600">${reasons[0] ? reasons[0].label : '—'}</span>`, sub: reasons[0] ? `${reasons[0].value} of ${lv.length} leavers` : '' },
          ],
          charts: [
            { span: 2, title: 'Leavers each ' + periodWord(P), sub: 'Voluntary and involuntary', el: html`<${PO.Charts.Bars} stacked labels=${labels} series=${[{ name: 'Voluntary', data: idx.map((i) => lv.filter((l) => l.idx === i && l.vol).length), color: 'var(--chart-1)' }, { name: 'Involuntary', data: idx.map((i) => lv.filter((l) => l.idx === i && !l.vol).length), color: 'var(--chart-5)' }]} height=${200} />` },
            { title: 'Why people left', el: lv.length ? html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${reasons.slice(0, 6)} center=${lv.length} sub="leavers" />` : html`<${PO.Empty} icon="PartyPopper" title="No leavers" text="Nobody left in this window." />` },
            { span: 2, title: `Annualised attrition by ${sw.toLowerCase()}`, el: html`<${PO.Charts.HBars} data=${bySite} fmt=${(v) => v + '%'} />` },
          ],
          table: { name: 'leavers', rows: lv, search: (l) => l.name + l.reason, columns: [{ key: 'name', label: 'Leaver', render: (l) => html`<span class="who"><${PO.Avatar} name=${l.name} size="sm" /><span class="who-t"><b>${l.name}</b><small>${l.title}</small></span></span>` }, { key: 'site', label: sw, render: (l) => siteName(l.site), sort: (l) => siteName(l.site) }, { key: 'lastDay', label: 'Last day', render: (l) => PO.date(l.lastDay), sort: (l) => l.lastDay }, { key: 'tenure', label: 'Tenure', render: (l) => PO.tenure(l.tenure), align: 'r' }, { key: 'vol', label: 'Type', render: (l) => html`<${PO.Badge} tone=${l.vol ? 'amber' : 'red'}>${l.vol ? 'Voluntary' : 'Involuntary'}<//>`, csv: (l) => (l.vol ? 'Voluntary' : 'Involuntary') }, { key: 'reason', label: 'Reason' }], initialSort: { key: 'lastDay', dir: 'desc' } },
        };
      }
      case 'tenure': {
        const bands = [['Under 6 months', 0, 6], ['6–12 months', 6, 12], ['1–2 years', 12, 24], ['2–3 years', 24, 36], ['3–5 years', 36, 60], ['5 years +', 60, 999]];
        const counts = bands.map(([, a, b]) => ps.filter((p) => p.tenureMonths >= a && p.tenureMonths < b).length);
        const avg = sum(ps, (p) => p.tenureMonths) / (ps.length || 1);
        const sorted = ps.map((p) => p.tenureMonths).sort((a, b) => a - b);
        const bySite = sitesIn.map((s) => { const h = ps.filter((p) => p.site === s); return { label: siteName(s), value: Math.round((sum(h, (p) => p.tenureMonths) / h.length / 12) * 10) / 10, sub: `${h.length} people` }; }).sort((a, b) => b.value - a.value);
        return {
          stats: [
            { label: 'Average tenure', icon: 'Hourglass', value: PO.tenure(Math.round(avg)), sub: `${PO.num(ps.length)} people` },
            { label: 'Median tenure', icon: 'ChartNoAxesColumn', value: PO.tenure(sorted[Math.floor(sorted.length / 2)] || 0), sub: 'half the team has been here longer' },
            { label: 'Under 1 year', icon: 'Sprout', value: pc((counts[0] + counts[1]) / (ps.length || 1)), sub: `${counts[0] + counts[1]} people` },
            { label: '5 years or more', icon: 'Award', value: PO.num(counts[5]), sub: P.id === 'in' ? 'gratuity eligible' : 'long-service award due' },
          ],
          charts: [
            { span: 2, title: 'People by tenure band', el: html`<${PO.Charts.Bars} labels=${bands.map((b) => b[0])} series=${[{ name: 'People', data: counts }]} height=${220} />` },
            { title: `Average tenure by ${sw.toLowerCase()}`, sub: 'years', el: html`<${PO.Charts.HBars} data=${bySite} fmt=${(v) => v.toFixed(1) + ' yrs'} />` },
          ],
          table: { name: 'tenure', rows: ps, search: (p) => p.name + p.id, columns: [pcol, scol, dcol, { key: 'joined', label: 'Joined', render: (p) => PO.date(p.joinedIso), sort: (p) => p.joinedIso, csv: (p) => p.joinedIso }, { key: 'tenureMonths', label: 'Tenure', render: (p) => PO.tenure(p.tenureMonths), align: 'r' }], initialSort: { key: 'tenureMonths', dir: 'desc' } },
        };
      }
      case 'diversity': {
        const w = ps.filter((p) => p.g === 'f'), mm = ps.filter((p) => p.g !== 'f');
        const depts = [...new Set(ps.map((p) => p.dept))];
        const avgG = (a) => sum(a, (p) => p.pay.gross) / (a.length || 1);
        const gap = (avgG(mm) - avgG(w)) / (avgG(mm) || 1);
        const rows = depts.map((d) => { const a = ps.filter((p) => p.dept === d); const f = a.filter((p) => p.g === 'f'); const m = a.filter((p) => p.g !== 'f'); return { id: d, dept: d, total: a.length, women: f.length, men: m.length, share: f.length / a.length, wPay: avgG(f), mPay: avgG(m) }; });
        const grades = [...new Set(ps.map((p) => p.grade))].sort();
        return {
          notes: [`Women are <b>${pc(w.length / (ps.length || 1))}</b> of this selection.`, rows.slice().sort((a, b) => b.share - a.share)[0] ? `<b>${rows.slice().sort((a, b) => b.share - a.share)[0].dept}</b> has the highest share of women (${pc(rows.slice().sort((a, b) => b.share - a.share)[0].share)}).` : '', `Average gross for men is ${Math.abs(gap) < 0.005 ? 'level with' : gap > 0 ? '<b>' + pc(gap, 1) + '</b> higher than' : '<b>' + pc(-gap, 1) + '</b> lower than'} for women, mostly from role mix and overtime.`],
          stats: [
            { label: 'Women', icon: 'PersonStanding', value: pc(w.length / (ps.length || 1)), sub: `${PO.num(w.length)} of ${PO.num(ps.length)} people` },
            { label: 'Women in leadership', icon: 'Crown', value: pc(ps.filter((p) => p.g === 'f' && (p.role === 'sup' || p.role === 'office' || p.inCharge)).length / (ps.filter((p) => p.role === 'sup' || p.role === 'office' || p.inCharge).length || 1)), sub: 'supervisors, leads and office' },
            { label: 'Average gross gap', icon: 'Scale', value: pc(gap, 1), tone: Math.abs(gap) > 0.1 ? 'amber' : undefined, sub: 'men vs women, this period' },
            { label: 'Departments', icon: 'Network', value: PO.num(depts.length), sub: `${rows.filter((r) => r.women === 0).length} with no women` },
          ],
          charts: [
            { span: 2, title: 'By department', el: html`<${PO.Charts.Bars} stacked labels=${depts} series=${[{ name: 'Women', data: rows.map((r) => r.women), color: 'var(--chart-1)' }, { name: 'Men', data: rows.map((r) => r.men), color: 'var(--chart-5)' }]} height=${200} />` },
            { title: 'Overall split', el: html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${[{ label: 'Women', value: w.length, color: 'var(--chart-1)' }, { label: 'Men', value: mm.length, color: 'var(--chart-5)' }]} sub="people" />` },
            { span: 2, title: 'By grade', el: html`<${PO.Charts.Bars} stacked labels=${grades} series=${[{ name: 'Women', data: grades.map((g) => ps.filter((p) => p.grade === g && p.g === 'f').length), color: 'var(--chart-1)' }, { name: 'Men', data: grades.map((g) => ps.filter((p) => p.grade === g && p.g !== 'f').length), color: 'var(--chart-5)' }]} height=${180} />` },
          ],
          table: { name: 'gender-by-department', rows, columns: [{ key: 'dept', label: 'Department', render: (r) => html`<b class="w-550">${r.dept}</b>` }, { key: 'total', label: 'People', align: 'r' }, { key: 'women', label: 'Women', align: 'r' }, { key: 'men', label: 'Men', align: 'r' }, { key: 'share', label: 'Women %', align: 'r', render: (r) => html`<div style="min-width:120px"><${PO.Progress} value=${r.share * 100} label=${pc(r.share)} /></div>`, csv: (r) => pc(r.share) }, { key: 'wPay', label: 'Avg gross, women', align: 'r', render: (r) => (r.women ? m0(r.wPay) : '—'), csv: (r) => Math.round(r.wPay) }, { key: 'mPay', label: 'Avg gross, men', align: 'r', render: (r) => (r.men ? m0(r.mPay) : '—'), csv: (r) => Math.round(r.mPay) }] },
        };
      }
      case 'overtime': {
        const ot = ps.filter((p) => p.pay.otHours > 0);
        const hrs = sum(ps, (p) => p.pay.otHours), pay = sum(ps, (p) => p.pay.otPay);
        const allOtPay = sum(P.people, (p) => p.pay.otPay) || 1;
        const share = pay / allOtPay;
        const trend = idx.map((i) => Math.round(hist[i].ot * share));
        const shifts = P.shifts.map((s) => s.key);
        return {
          notes: [`<b>${PO.num(hrs)} hours</b> of overtime cost <b>${m0(pay)}</b> this period.`, sitesIn.length ? `<b>${siteName(sitesIn.slice().sort((a, b) => sum(ps.filter((p) => p.site === b), (p) => p.pay.otHours) - sum(ps.filter((p) => p.site === a), (p) => p.pay.otHours))[0])}</b> accounts for ${pc(sum(ps.filter((p) => p.site === sitesIn.slice().sort((a, b) => sum(ps.filter((p) => p.site === b), (p) => p.pay.otHours) - sum(ps.filter((p) => p.site === a), (p) => p.pay.otHours))[0]), (p) => p.pay.otHours) / (hrs || 1))} of the hours.` : '', P.id === 'in' ? 'Overtime is paid at 2× under the Code on Wages; the quarterly cap is 125 hours a person.' : P.id === 'us' ? 'FLSA overtime is 1.5× after 40 hours in a workweek; Texas adds no daily overtime.' : 'Overtime counts towards the 48-hour weekly average unless someone has opted out.'],
          stats: [
            { label: 'Overtime hours', icon: 'Timer', value: PO.num(hrs), sub: P.company.period },
            { label: 'Overtime pay', icon: 'Banknote', value: m0(pay), spark: trend, sub: `${pc(pay / (sum(ps, (p) => p.pay.gross) || 1), 1)} of gross` },
            { label: 'People with overtime', icon: 'Users', value: PO.num(ot.length), sub: `${pc(ot.length / (ps.length || 1))} of the team` },
            { label: 'Highest', icon: 'Flame', value: ot.length ? PO.num(Math.max(...ot.map((p) => p.pay.otHours))) + ' h' : '—', sub: ot.length ? ot.slice().sort((a, b) => b.pay.otHours - a.pay.otHours)[0].name : '' },
          ],
          charts: [
            { span: 2, title: `Overtime hours by ${sw.toLowerCase()}`, sub: 'Split by shift', el: html`<${PO.Charts.Bars} stacked labels=${sitesIn.map((x) => shortName(siteName(x)))} series=${shifts.map((k, i) => ({ name: PO.shiftOf(k).label, data: sitesIn.map((s) => sum(ps.filter((p) => p.site === s && p.shift === k), (p) => p.pay.otHours)), color: RAMP[i] }))} height=${220} fmt=${(v) => v + ' h'} />` },
            { title: 'Most overtime', sub: 'Top 8 people', el: html`<${PO.Charts.HBars} data=${ot.slice().sort((a, b) => b.pay.otHours - a.pay.otHours).slice(0, 8).map((p) => ({ label: p.name, value: p.pay.otHours, sub: siteName(p.site).split(' ')[0] }))} fmt=${(v) => v + ' h'} />` },
            { span: 2, title: 'Overtime pay trend', sub: winLabel, el: html`<${PO.Charts.Line} labels=${labels} series=${[{ name: 'Overtime pay', data: trend }]} fmt=${m0} yFmt=${ax} height=${220} />` },
          ],
          table: { name: 'overtime', rows: ot, search: (p) => p.name + p.id, columns: [pcol, scol, { key: 'shift', label: 'Shift', render: (p) => PO.shiftOf(p.shift).label }, { key: 'oth', label: 'OT hours', align: 'r', render: (p) => p.pay.otHours + ' h', sort: (p) => p.pay.otHours }, { key: 'otp', label: 'OT pay', align: 'r', render: (p) => m0(p.pay.otPay), sort: (p) => p.pay.otPay }, { key: 'pct', label: '% of gross', align: 'r', render: (p) => pc(p.pay.otPay / p.pay.gross), sort: (p) => p.pay.otPay / p.pay.gross }], initialSort: { key: 'oth', dir: 'desc' }, empty: { title: 'No overtime', text: 'Nobody in this selection worked overtime this period.' } },
        };
      }
      case 'lateness': {
        const shiftsPer = { in: 26, us: 10, uk: 20 }[P.id];
        const rows = P.lateBySite.map(([name, n]) => { const s = P.sites.find((x) => x.name === name) || {}; const staff = P.people.filter((p) => p.site === s.id).length; const live = P.live.find((l) => l.site === s.id) || {}; return { id: s.id || name, site: s.id, name, n, staff, rate: (n / ((staff || 1) * shiftsPer)) * 100, lateNow: live.late || 0, absentNow: live.absent || 0, due: live.due || 0 }; }).filter((r) => !ctx.site || r.site === ctx.site);
        const total = sum(rows, (r) => r.n);
        const nowLate = Object.keys(P.lateMap).map((id) => P.byId[id]).filter((p) => p && (!ctx.site || p.site === ctx.site));
        return {
          stats: [
            { label: 'Late arrivals', icon: 'AlarmClock', value: PO.num(total), sub: P.company.period },
            { label: 'Late rate', icon: 'Percent', value: (total / (sum(rows, (r) => r.staff) * shiftsPer || 1) * 100).toFixed(1) + '%', sub: 'of scheduled shifts' },
            { label: 'Worst ' + sw.toLowerCase(), icon: 'MapPin', value: html`<span class="t-md w-600">${rows[0] ? rows.slice().sort((a, b) => b.rate - a.rate)[0].name : '—'}</span>`, sub: rows[0] ? rows.slice().sort((a, b) => b.rate - a.rate)[0].rate.toFixed(1) + ' per 100 shifts' : '' },
            { label: 'Late right now', icon: 'Clock', value: PO.num(nowLate.length), tone: nowLate.length ? 'amber' : undefined, sub: `${PO.shiftOf(P.current).label} shift, ${P.hhmm(P.company.nowMin)}` },
          ],
          charts: [
            { span: 2, title: 'Late per 100 shifts', sub: 'Normalised for team size', el: html`<${PO.Charts.Bars} labels=${rows.map((r) => shortName(r.name))} series=${[{ name: 'Per 100 shifts', data: rows.map((r) => Math.round(r.rate * 10) / 10), color: 'var(--chart-1)' }]} fmt=${(v) => v.toFixed(1)} height=${220} />` },
            { title: `Late arrivals by ${sw.toLowerCase()}`, sub: P.company.period, el: html`<${PO.Charts.HBars} data=${rows.map((r) => ({ label: r.name, value: r.n, sub: `${r.staff} staff` }))} />` },
          ],
          table: { name: 'lateness-by-site', rows, columns: [{ key: 'name', label: sw, render: (r) => html`<b class="w-550">${r.name}</b>` }, { key: 'staff', label: 'Staff', align: 'r' }, { key: 'n', label: 'Late arrivals', align: 'r' }, { key: 'rate', label: 'Per 100 shifts', align: 'r', render: (r) => r.rate.toFixed(1), csv: (r) => r.rate.toFixed(1) }, { key: 'lateNow', label: 'Late now', align: 'r', render: (r) => (r.lateNow ? html`<${PO.Badge} tone="amber">${r.lateNow}<//>` : '0') }, { key: 'absentNow', label: 'Absent now', align: 'r', render: (r) => (r.absentNow ? html`<${PO.Badge} tone="red">${r.absentNow}<//>` : '0') }], initialSort: { key: 'n', dir: 'desc' } },
        };
      }
      case 'absence': {
        const ids = new Set(ps.map((p) => p.id));
        const reqs = P.leaveRequests.filter((l) => l.status === 'Approved' && l.from <= PO.TODAY && ids.has(l.who)).map((l) => ({ ...l, pi: periodIdx(P, l.from) })).filter((l) => l.pi >= 12 - N && l.pi >= 0);
        const sk = SICK_KEY[P.id];
        const types = [...new Set(reqs.map((l) => l.type))];
        const byPerson = [...group(reqs, (l) => l.who)].map(([id, a]) => ({ id, p: P.byId[id], sick: sum(a.filter((l) => l.type === sk), (l) => l.days), other: sum(a.filter((l) => l.type !== sk), (l) => l.days), spells: a.filter((l) => l.type === sk).length }));
        byPerson.forEach((r) => { r.total = r.sick + r.other; r.bradford = r.spells * r.spells * r.sick; });
        const sickDays = sum(reqs.filter((l) => l.type === sk), (l) => l.days);
        const workDays = ps.length * N * { in: 26, us: 10, uk: 20 }[P.id];
        const unit = P.id === 'us' ? 'shifts' : 'days';
        return {
          notes: [`<b>${PO.num(sum(reqs, (l) => l.days))} ${unit}</b> of absence ${winLabel}, ${PO.num(sickDays)} of them sick.`, byPerson.length ? `<b>${byPerson.slice().sort((a, b) => b.sick - a.sick)[0].p.name}</b> has the most sick ${unit} (${byPerson.slice().sort((a, b) => b.sick - a.sick)[0].sick}).` : '', P.id === 'uk' ? 'SSP is payable from the fourth qualifying day of sickness.' : P.id === 'us' ? 'Sick time is front-loaded on 1 January and resets each year.' : 'Sick leave carries forward up to 14 days.'],
          stats: [
            { label: 'Absence rate', icon: 'CalendarX2', value: pc(sum(reqs, (l) => l.days) / (workDays || 1), 1), sub: `${PO.num(sum(reqs, (l) => l.days))} ${unit} ${winLabel}` },
            { label: P.id === 'uk' ? 'Sickness' : 'Sick ' + unit, icon: 'Thermometer', value: PO.num(sickDays), sub: `${reqs.filter((l) => l.type === sk).length} spells` },
            { label: 'Absent today', icon: 'UserX', value: PO.num([...P.absent].filter((id) => ids.has(id)).length + P.outToday.length), sub: 'no-shows and approved leave' },
            { label: P.id === 'uk' ? 'Bradford factor 250+' : 'Frequent absence', icon: 'TriangleAlert', value: PO.num(byPerson.filter((r) => r.bradford >= (P.id === 'uk' ? 250 : 8)).length), sub: P.id === 'uk' ? 'trigger for a return-to-work talk' : '2+ sick spells in window' },
          ],
          charts: [
            { span: 2, title: `Absence ${unit} each ${periodWord(P)}`, el: html`<${PO.Charts.Bars} stacked labels=${labels} series=${types.map((t, i) => ({ name: (PO.leaveType(t) || {}).name || t, data: idx.map((i2) => sum(reqs.filter((l) => l.pi === i2 && l.type === t), (l) => l.days)), color: RAMP[i % RAMP.length] }))} height=${200} />` },
            { title: 'By type', el: reqs.length ? html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${types.map((t) => ({ label: (PO.leaveType(t) || {}).name || t, value: sum(reqs.filter((l) => l.type === t), (l) => l.days), color: RAMP[types.indexOf(t) % RAMP.length] }))} sub=${unit} />` : html`<${PO.Empty} icon="CalendarCheck2" title="No absence" text="Nothing recorded in this window." />` },
            { span: 2, title: `Absence ${unit} per head by ${sw.toLowerCase()}`, el: html`<${PO.Charts.HBars} data=${sitesIn.map((s) => { const h = ps.filter((p) => p.site === s); const hs = new Set(h.map((p) => p.id)); return { label: siteName(s), value: Math.round((sum(reqs.filter((l) => hs.has(l.who)), (l) => l.days) / (h.length || 1)) * 100) / 100, sub: `${h.length} people` }; }).sort((a, b) => b.value - a.value)} fmt=${(v) => v.toFixed(2)} />` },
          ],
          table: { name: 'absence', rows: byPerson, search: (r) => r.p.name, columns: [{ key: 'name', label: 'Employee', render: (r) => who(r.p), sort: (r) => r.p.name, csv: (r) => r.p.name }, { key: 'site', label: sw, render: (r) => siteName(r.p.site), sort: (r) => siteName(r.p.site) }, { key: 'sick', label: 'Sick ' + unit, align: 'r' }, { key: 'spells', label: 'Sick spells', align: 'r' }, { key: 'other', label: 'Other leave', align: 'r' }, { key: 'total', label: 'Total', align: 'r' }, P.id === 'uk' ? { key: 'bradford', label: 'Bradford factor', align: 'r', render: (r) => html`<${PO.Badge} tone=${r.bradford >= 250 ? 'red' : r.bradford >= 50 ? 'amber' : 'slate'}>${r.bradford}<//>` } : null].filter(Boolean), initialSort: { key: 'sick', dir: 'desc' } },
        };
      }
      case 'liability': {
        const k = LEAVE_KEY[P.id], lt = PO.leaveType(k);
        const rows = ps.map((p) => { const b = (p.leave[k] || {}).balance || 0; const rate = leaveRate(P, p); return { id: p.id, p, bal: b, rate, value: b * rate }; });
        const total = sum(rows, (r) => r.value);
        const depts = [...group(rows, (r) => r.p.dept)].map(([d, a]) => ({ label: d, value: Math.round(sum(a, (r) => r.value)) }));
        return {
          stats: [
            { label: 'Total liability', icon: 'PiggyBank', value: m0(total), sub: `${lt.name}, if paid out today` },
            { label: 'Unused balance', icon: 'CalendarDays', value: PO.num(sum(rows, (r) => r.bal)) + ' ' + lt.unit, sub: `${PO.num(sum(rows, (r) => r.bal) / (rows.length || 1), 1)} ${lt.unit} per person` },
            { label: 'Average per person', icon: 'User', value: m0(total / (rows.length || 1)), sub: rows.length ? `highest ${m0(Math.max(...rows.map((r) => r.value)))}` : '' },
            { label: 'Carry-over rule', icon: 'Repeat', value: html`<span class="t-md w-600">${lt.carry}</span>`, sub: lt.accrual },
          ],
          charts: [
            { span: 2, title: `Liability by ${sw.toLowerCase()}`, el: html`<${PO.Charts.HBars} data=${sitesIn.map((s) => { const a = rows.filter((r) => r.p.site === s); return { label: siteName(s), value: Math.round(sum(a, (r) => r.value)), sub: `${PO.num(sum(a, (r) => r.bal))} ${lt.unit}` }; }).sort((a, b) => b.value - a.value)} fmt=${mc} />` },
            { title: 'By department', el: html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${depts} fmt=${mc} center=${mc(total)} sub="liability" />` },
          ],
          table: { name: 'leave-liability', rows, search: (r) => r.p.name, columns: [{ key: 'name', label: 'Employee', render: (r) => who(r.p), sort: (r) => r.p.name, csv: (r) => r.p.name }, { key: 'site', label: sw, render: (r) => siteName(r.p.site), sort: (r) => siteName(r.p.site) }, { key: 'bal', label: `Balance (${lt.unit})`, align: 'r' }, { key: 'rate', label: `Rate per ${lt.unit === 'hours' ? 'hour' : 'day'}`, align: 'r', render: (r) => PO.money(Math.round(r.rate * 100) / 100, { cents: P.id !== 'in' }), csv: (r) => r.rate.toFixed(2) }, { key: 'value', label: 'Liability', align: 'r', render: (r) => m0(r.value), csv: (r) => Math.round(r.value) }], initialSort: { key: 'value', dir: 'desc' } },
        };
      }
      case 'payroll': {
        const H = idx.map((i) => hist[i]);
        const sc = (v) => Math.round(v * costShare);
        const rows = H.slice().reverse().map((h) => ({ ...h, gross: sc(h.gross), net: sc(h.net), ded: sc(h.ded), er: sc(h.er), cost: sc(h.cost), ot: sc(h.ot), heads: Math.round(h.heads * headShare) }));
        const cur = rows[0], prev = rows[1];
        const cost = sum(ps, (p) => p.pay.gross + p.pay.erTotal);
        return {
          notes: [`Employer cost this ${periodWord(P)} is <b>${m0(cost)}</b>${prev ? `, ${cur.cost >= prev.cost ? 'up' : 'down'} <b>${pc(Math.abs(cur.cost - prev.cost) / prev.cost, 1)}</b> on the previous ${periodWord(P)}` : ''}.`, `Over the ${winLabel} payroll cost a total of <b>${mc(sum(rows, (r) => r.cost))}</b>.`, `Overtime is <b>${pc(sum(ps, (p) => p.pay.otPay) / (sum(ps, (p) => p.pay.gross) || 1), 1)}</b> of gross pay this ${periodWord(P)}.`],
          stats: [
            { label: 'Employer cost', icon: 'Wallet', value: m0(cost), spark: H.map((h) => sc(h.cost)), delta: prev ? { v: pc((cur.cost - prev.cost) / prev.cost, 1), dir: cur.cost >= prev.cost ? 'up' : 'down' } : null, sub: 'vs previous ' + periodWord(P) },
            { label: 'Gross pay', icon: 'Banknote', value: m0(sum(ps, (p) => p.pay.gross)), sub: P.company.period },
            { label: 'Net pay', icon: 'HandCoins', value: m0(sum(ps, (p) => p.pay.net)), sub: `${PO.num(ps.length)} payslips` },
            { label: 'Cost per head', icon: 'User', value: m0(cost / (ps.length || 1)), sub: `${winLabel} total ${mc(sum(rows, (r) => r.cost))}` },
          ],
          charts: [
            { span: 2, title: 'Payroll cost', sub: 'Gross, net and total employer cost', el: html`<${PO.Charts.Line} labels=${labels} series=${[{ name: 'Employer cost', data: H.map((h) => sc(h.cost)) }, { name: 'Gross', data: H.map((h) => sc(h.gross)) }, { name: 'Net', data: H.map((h) => sc(h.net)), dash: true }]} fmt=${m0} yFmt=${ax} height=${220} />` },
            { title: 'This period, where it goes', el: html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${[{ label: 'Net pay', value: Math.round(sum(ps, (p) => p.pay.net)) }, { label: 'Employee deductions', value: Math.round(sum(ps, (p) => p.pay.dedTotal)), color: RAMP[1] }, { label: 'Employer contributions', value: Math.round(sum(ps, (p) => p.pay.erTotal)), color: 'var(--chart-5)' }]} fmt=${mc} center=${mc(cost)} sub="employer cost" />` },
            { span: 2, title: 'Deductions and employer contributions', el: html`<${PO.Charts.Bars} labels=${labels} series=${[{ name: 'Employee deductions', data: H.map((h) => sc(h.ded)), color: 'var(--chart-1)' }, { name: 'Employer contributions', data: H.map((h) => sc(h.er)), color: 'var(--chart-5)' }]} fmt=${m0} yFmt=${ax} height=${200} />` },
          ],
          table: { name: 'payroll-history', rows, columns: [{ key: 'label', label: 'Period', render: (h) => html`<b class="w-550">${h.label.replace('*', '')}</b>`, sort: (h) => h.id }, { key: 'heads', label: 'Payslips', align: 'r' }, { key: 'gross', label: 'Gross', align: 'r', render: (h) => m0(h.gross) }, { key: 'ded', label: 'Deductions', align: 'r', render: (h) => m0(h.ded) }, { key: 'net', label: 'Net', align: 'r', render: (h) => m0(h.net) }, { key: 'er', label: 'Employer', align: 'r', render: (h) => m0(h.er) }, { key: 'cost', label: 'Total cost', align: 'r', render: (h) => html`<b>${m0(h.cost)}</b>` }, { key: 'status', label: 'Status', render: (h) => html`<${PO.Status} s=${h.status} />` }] },
        };
      }
      case 'labour': {
        const total = sum(ps, (p) => p.pay.gross + p.pay.erTotal);
        const mk = (k, a, label) => ({ id: k, label, heads: a.length, gross: sum(a, (p) => p.pay.gross), er: sum(a, (p) => p.pay.erTotal), ot: sum(a, (p) => p.pay.otPay) });
        const siteRows = sitesIn.map((s) => mk(s, ps.filter((p) => p.site === s), siteName(s)));
        siteRows.forEach((r) => { r.cost = r.gross + r.er; r.share = r.cost / (total || 1); });
        const depts = [...group(ps, (p) => p.dept)].map(([d, a]) => ({ label: d, value: Math.round(sum(a, (p) => p.pay.gross + p.pay.erTotal)) })).sort((a, b) => b.value - a.value);
        const top = siteRows.slice().sort((a, b) => b.cost - a.cost)[0];
        return {
          stats: [
            { label: P.id === 'us' ? 'Labor cost' : 'Labour cost', icon: 'Wallet', value: m0(total), sub: `${P.company.period}${ctx.site || ctx.dept ? '' : ', matches payroll'}` },
            { label: 'Cost per head', icon: 'User', value: m0(total / (ps.length || 1)), sub: `${PO.num(ps.length)} people` },
            { label: 'Employer on-cost', icon: 'Landmark', value: pc(sum(ps, (p) => p.pay.erTotal) / (sum(ps, (p) => p.pay.gross) || 1), 1), sub: 'on top of gross pay' },
            { label: 'Biggest ' + sw.toLowerCase(), icon: 'MapPin', value: html`<span class="t-md w-600">${top ? top.label : '—'}</span>`, sub: top ? `${pc(top.share)} of cost` : '' },
          ],
          charts: [
            { span: 2, title: `Cost by ${sw.toLowerCase()}`, sub: 'Gross pay and employer contributions', el: html`<${PO.Charts.Bars} stacked labels=${siteRows.map((r) => shortName(r.label))} series=${[{ name: 'Gross pay', data: siteRows.map((r) => Math.round(r.gross)) }, { name: 'Employer', data: siteRows.map((r) => Math.round(r.er)), color: 'var(--chart-5)' }]} fmt=${m0} yFmt=${ax} height=${220} />` },
            { title: 'Cost by department', el: html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${depts} fmt=${mc} center=${mc(total)} sub="this period" />` },
          ],
          table: { name: 'labour-cost', rows: siteRows, columns: [{ key: 'label', label: sw, render: (r) => html`<b class="w-550">${r.label}</b>` }, { key: 'heads', label: 'People', align: 'r' }, { key: 'gross', label: 'Gross', align: 'r', render: (r) => m0(r.gross), csv: (r) => Math.round(r.gross) }, { key: 'ot', label: 'of which OT', align: 'r', render: (r) => m0(r.ot), csv: (r) => Math.round(r.ot) }, { key: 'er', label: 'Employer', align: 'r', render: (r) => m0(r.er), csv: (r) => Math.round(r.er) }, { key: 'cost', label: 'Total cost', align: 'r', render: (r) => html`<b>${m0(r.cost)}</b>`, csv: (r) => Math.round(r.cost) }, { key: 'per', label: 'Per head', align: 'r', render: (r) => m0(r.cost / r.heads), sort: (r) => r.cost / r.heads, csv: (r) => Math.round(r.cost / r.heads) }, { key: 'share', label: 'Share', align: 'r', render: (r) => html`<div style="min-width:110px"><${PO.Progress} value=${r.share * 100} label=${pc(r.share)} /></div>`, csv: (r) => pc(r.share) }], initialSort: { key: 'cost', dir: 'desc' }, foot: html`<tr><td><b>Total</b></td><td class="r tnum"><b>${PO.num(ps.length)}</b></td><td class="r tnum"><b>${m0(sum(siteRows, (r) => r.gross))}</b></td><td class="r tnum">${m0(sum(siteRows, (r) => r.ot))}</td><td class="r tnum"><b>${m0(sum(siteRows, (r) => r.er))}</b></td><td class="r tnum"><b>${m0(total)}</b></td><td class="r tnum">${m0(total / (ps.length || 1))}</td><td class="r">100%</td></tr>` },
        };
      }
      case 'statutory': {
        const amt = (k) => (k ? sum(ps, (p) => sum([...p.pay.ded, ...p.pay.er].filter((x) => x.k === k), (x) => x.amt)) : 0);
        const rows = P.statutory.map(([label, ee, er]) => ({ id: ee, label, ee: amt(ee), er: amt(er), people: ps.filter((p) => p.pay.ded.some((x) => x.k === ee && x.amt > 0)).length }));
        rows.forEach((r) => (r.total = r.ee + r.er));
        const total = sum(rows, (r) => r.total);
        const share = total / (sum(P.statutory, ([, ee, er]) => (P.totals[ee] || 0) + (er ? P.totals[er] || 0 : 0)) || 1);
        const H = idx.map((i) => hist[i]);
        const due = P.id === 'in' ? [['PF ECR', '15 Oct'], ['ESI', '15 Oct'], ['TDS', '7 Oct']] : P.id === 'us' ? [['Federal deposit (EFTPS)', 'Oct 14'], ['Form 941, Q3', 'Oct 31']] : [['PAYE & NI to HMRC', '22 Oct'], ['Pension (NEST)', '22 Oct']];
        return {
          notes: [`<b>${m0(total)}</b> goes to statutory bodies this period.`, rows[0] ? `<b>${rows.slice().sort((a, b) => b.total - a.total)[0].label.split(/[,(]/)[0].trim()}</b> is the largest item at ${m0(rows.slice().sort((a, b) => b.total - a.total)[0].total)}.` : '', `Next due: <b>${due.map((d) => d[0] + ' by ' + d[1]).join(', ')}</b>.`],
          stats: [
            { label: 'Total statutory', icon: 'Landmark', value: m0(total), sub: P.company.period },
            { label: 'From employees', icon: 'User', value: m0(sum(rows, (r) => r.ee)), sub: 'withheld from pay' },
            { label: 'From employer', icon: 'Building2', value: m0(sum(rows, (r) => r.er)), sub: 'on top of gross' },
            { label: 'Next deposit', icon: 'CalendarClock', value: html`<span class="t-md w-600">${due[0][0]}</span>`, sub: 'due ' + due[0][1] },
          ],
          charts: [
            { span: 2, title: 'This period by contribution', el: html`<${PO.Charts.Bars} labels=${rows.map((r) => r.label.split(/[,(]/)[0].trim())} series=${[{ name: 'Employee', data: rows.map((r) => Math.round(r.ee)), color: 'var(--chart-1)' }, { name: 'Employer', data: rows.map((r) => Math.round(r.er)), color: 'var(--chart-5)' }]} fmt=${m0} yFmt=${ax} height=${220} />` },
            { title: 'Share of total', el: html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${rows.filter((r) => r.total > 0).map((r) => ({ label: r.label.split(/[,(]/)[0].trim(), value: Math.round(r.total) }))} fmt=${mc} center=${mc(total)} sub="this period" />` },
            { span: 2, title: 'Statutory trend', sub: winLabel, el: html`<${PO.Charts.Line} labels=${labels} series=${[{ name: 'Statutory total', data: H.map((h) => Math.round((h.ded + h.er) / ((P.totals.dedTotal + P.totals.erTotal) || 1) * (sum(P.statutory, ([, ee, er]) => (P.totals[ee] || 0) + (er ? P.totals[er] || 0 : 0))) * share)) }]} fmt=${m0} yFmt=${ax} height=${220} />` },
          ],
          table: { name: 'statutory', rows, columns: [{ key: 'label', label: 'Contribution', render: (r) => html`<b class="w-550">${r.label}</b>` }, { key: 'people', label: 'People', align: 'r' }, { key: 'ee', label: 'Employee', align: 'r', render: (r) => m0(r.ee), csv: (r) => Math.round(r.ee) }, { key: 'er', label: 'Employer', align: 'r', render: (r) => (r.er ? m0(r.er) : '—'), csv: (r) => Math.round(r.er) }, { key: 'total', label: 'Total', align: 'r', render: (r) => html`<b>${m0(r.total)}</b>`, csv: (r) => Math.round(r.total) }], foot: html`<tr><td><b>Total</b></td><td></td><td class="r tnum"><b>${m0(sum(rows, (r) => r.ee))}</b></td><td class="r tnum"><b>${m0(sum(rows, (r) => r.er))}</b></td><td class="r tnum"><b>${m0(total)}</b></td></tr>` },
        };
      }
      case 'documents': {
        const all = ps.flatMap((p) => p.docs.map((d) => ({ ...d, p })));
        const bad = (s) => s === 'Missing' || s === 'Expired';
        const types = [...new Set(all.map((d) => d.name))];
        const issues = all.filter((d) => d.status !== 'Verified').map((d, i) => ({ id: d.p.id + i, ...d }));
        const verified = all.filter((d) => d.status === 'Verified').length;
        return {
          notes: [`<b>${pc(verified / (all.length || 1), 1)}</b> of ${PO.num(all.length)} documents are verified.`, issues.length ? `<b>${types.map((t) => ({ t, n: issues.filter((d) => d.name === t).length })).sort((a, b) => b.n - a.n)[0].t}</b> has the most open items.` : 'Nothing is outstanding.', P.id === 'in' ? 'Police verification must be renewed every 3 years for guards (PSARA).' : P.id === 'us' ? 'Form I-9 must be complete by day 3; keep it 3 years after hire or 1 year after exit.' : 'Right-to-work checks must be done before the first shift; follow-ups for time-limited permission.'],
          stats: [
            { label: 'Document compliance', icon: 'FileCheck2', value: pc(verified / (all.length || 1), 1), tone: verified / all.length < 0.95 ? 'amber' : undefined, sub: `${PO.num(verified)} of ${PO.num(all.length)} verified` },
            { label: 'Missing or expired', icon: 'FileX2', value: PO.num(all.filter((d) => bad(d.status)).length), tone: 'red', sub: `${new Set(all.filter((d) => bad(d.status)).map((d) => d.p.id)).size} people affected` },
            { label: 'Awaiting review', icon: 'FileClock', value: PO.num(all.filter((d) => d.status === 'Pending review').length), sub: 'uploaded, not yet checked' },
            { label: 'Expiring soon', icon: 'CalendarClock', value: PO.num(all.filter((d) => d.status === 'Expiring soon').length), sub: 'in the next 60 days' },
          ],
          charts: [
            { span: 2, title: 'By document type', el: html`<${PO.Charts.Bars} stacked labels=${types.map((t) => shortName(t.replace(/ \(.*\)| \/.*$/, ''), 12))} series=${[{ name: 'Verified', data: types.map((t) => all.filter((d) => d.name === t && d.status === 'Verified').length), color: 'var(--chart-1)' }, { name: 'Pending or expiring', data: types.map((t) => all.filter((d) => d.name === t && (d.status === 'Pending review' || d.status === 'Expiring soon')).length), color: 'var(--amber-solid)' }, { name: 'Missing or expired', data: types.map((t) => all.filter((d) => d.name === t && bad(d.status)).length), color: 'var(--red-solid)' }]} height=${210} />` },
            { title: `Compliance by ${sw.toLowerCase()}`, el: html`<${PO.Charts.HBars} data=${sitesIn.map((s) => { const a = all.filter((d) => d.p.site === s); return { label: siteName(s), value: Math.round((a.filter((d) => d.status === 'Verified').length / (a.length || 1)) * 1000) / 10, sub: `${a.filter((d) => d.status !== 'Verified').length} open` }; }).sort((a, b) => a.value - b.value)} fmt=${(v) => v.toFixed(1) + '%'} max=${100} />` },
            { title: 'Open items by type', el: issues.length ? html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${types.map((t) => ({ label: t, value: issues.filter((d) => d.name === t).length })).filter((x) => x.value).sort((a, b) => b.value - a.value)} sub="open items" />` : html`<${PO.Empty} icon="BadgeCheck" title="All verified" />` },
          ],
          table: { name: 'document-issues', rows: issues, search: (d) => d.p.name + d.name, filters: [{ key: 'st', label: 'Status', options: ['Missing', 'Expired', 'Pending review', 'Expiring soon'], test: (d, v) => d.status === v }], columns: [{ key: 'who', label: 'Employee', render: (d) => who(d.p), sort: (d) => d.p.name, csv: (d) => d.p.name }, { key: 'site', label: sw, render: (d) => siteName(d.p.site), sort: (d) => siteName(d.p.site) }, { key: 'name', label: 'Document' }, { key: 'status', label: 'Status', render: (d) => html`<${PO.Status} s=${d.status} />` }, { key: 'uploaded', label: 'Uploaded', render: (d) => (d.uploaded ? PO.date(d.uploaded) : '—'), sort: (d) => d.uploaded || '' }], empty: { title: 'Nothing outstanding', text: 'Every document in this selection is verified.' } },
        };
      }
      case 'hiring': {
        const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
        const jobs = P.jobs.filter((j) => !ctx.site || j.site === ctx.site);
        const jids = new Set(jobs.map((j) => j.id));
        const since = PO.addDays(PO.TODAY, -N * PERIOD_DAYS[P.id]);
        const cs = P.candidates.filter((c) => jids.has(c.job) && c.applied >= since);
        const reached = stages.map((s, i) => cs.filter((c) => stages.indexOf(c.stage) >= i).length);
        const sources = [...group(cs, (c) => c.source)].map(([k, a]) => ({ label: k, value: a.length, hired: a.filter((c) => c.stage === 'Hired').length })).sort((a, b) => b.value - a.value);
        const rows = jobs.map((j) => { const a = cs.filter((c) => c.job === j.id); const r = { id: j.id, j, total: a.length, hired: a.filter((c) => c.stage === 'Hired').length }; stages.forEach((s) => (r[s] = a.filter((c) => c.stage === s).length)); return r; });
        return {
          notes: [`<b>${PO.num(cs.length)}</b> candidates for <b>${PO.num(sum(jobs, (j) => j.openings))}</b> open positions.`, sources[0] ? `<b>${sources[0].label}</b> brings the most candidates (${pc(sources[0].value / (cs.length || 1))}); <b>${sources.slice().sort((a, b) => b.hired / (b.value || 1) - a.hired / (a.value || 1))[0].label}</b> converts best.` : '', `${pc(reached[4] / (cs.length || 1), 1)} of applicants are hired; interview to offer is ${pc(reached[3] / (reached[2] || 1))}.`],
          stats: [
            { label: 'Candidates', icon: 'Users', value: PO.num(cs.length), sub: `applied ${N === 1 ? 'this ' + periodWord(P) : winLabel}` },
            { label: 'Open positions', icon: 'Briefcase', value: PO.num(sum(jobs, (j) => j.openings)), sub: `${jobs.length} job openings` },
            { label: 'Hired', icon: 'BadgeCheck', value: PO.num(reached[4]), sub: `${pc(reached[4] / (cs.length || 1), 1)} of applicants` },
            { label: 'Interview to offer', icon: 'ArrowRightLeft', value: pc(reached[3] / (reached[2] || 1)), sub: `${reached[3]} offers from ${reached[2]} interviews` },
          ],
          charts: [
            { span: 2, title: 'Hires by source', el: html`<${PO.Charts.Bars} labels=${sources.map((s) => s.label)} series=${[{ name: 'Applied', data: sources.map((s) => s.value), color: 'var(--chart-5)' }, { name: 'Hired', data: sources.map((s) => s.hired), color: 'var(--chart-1)' }]} height=${180} />` },
            { title: 'Funnel', sub: 'Candidates who reached each stage', el: html`<${PO.Charts.HBars} data=${stages.map((s, i) => ({ label: s, value: reached[i], sub: i ? pc(reached[i] / (reached[i - 1] || 1)) + ' from previous' : '' }))} />` },
            { title: 'By source', el: cs.length ? html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${sources} sub="candidates" />` : html`<${PO.Empty} icon="Inbox" title="No candidates" />` },
          ],
          table: { name: 'hiring-funnel', rows, columns: [{ key: 'title', label: 'Job', render: (r) => html`<div><b class="w-550">${r.j.title}</b><div class="faint t-xs">${siteName(r.j.site)}, ${r.j.openings} open, posted ${PO.date(r.j.posted, { short: true })}</div></div>`, sort: (r) => r.j.title, csv: (r) => r.j.title }, ...stages.map((s) => ({ key: s, label: s, align: 'r' })), { key: 'total', label: 'Total', align: 'r', render: (r) => html`<b>${r.total}</b>` }] },
        };
      }
      case 'reviews': {
        const st = ['Not started', 'Self review done', 'Manager review'];
        const depts = [...new Set(ps.map((p) => p.dept))];
        const started = ps.filter((p) => p.reviewStatus !== 'Not started').length;
        const mgrs = [...group(ps.filter((p) => p.manager), (p) => p.manager)].map(([id, a]) => ({ id, p: P.byId[id], team: a.length, ns: a.filter((p) => p.reviewStatus === 'Not started').length, self: a.filter((p) => p.reviewStatus === 'Self review done').length, mgr: a.filter((p) => p.reviewStatus === 'Manager review').length }));
        mgrs.forEach((m) => (m.pct = (m.team - m.ns) / m.team));
        const daysLeft = Math.round((new Date(P.reviewCycle.closes) - new Date(PO.TODAY)) / 864e5);
        return {
          stats: [
            { label: 'Started', icon: 'ClipboardCheck', value: pc(started / (ps.length || 1)), sub: `${PO.num(started)} of ${PO.num(ps.length)} people` },
            { label: 'With managers', icon: 'UserCheck', value: PO.num(ps.filter((p) => p.reviewStatus === 'Manager review').length), sub: 'self review submitted, manager reviewing' },
            { label: 'Not started', icon: 'CircleDashed', value: PO.num(ps.length - started), tone: 'amber', sub: 'nudge by email and SMS' },
            { label: 'Cycle closes', icon: 'CalendarClock', value: PO.date(P.reviewCycle.closes, { short: true }), sub: `${daysLeft} days left, ${P.reviewCycle.name}` },
          ],
          charts: [
            { span: 2, title: 'Progress by department', el: html`<${PO.Charts.Bars} stacked labels=${depts} series=${st.map((s, i) => ({ name: s, data: depts.map((d) => ps.filter((p) => p.dept === d && p.reviewStatus === s).length), color: [RAMP[3], RAMP[1], RAMP[0]][i] }))} height=${220} />` },
            { title: 'Overall', el: html`<${PO.Charts.Donut} size=${128} thickness=${16} data=${st.map((s, i) => ({ label: s, value: ps.filter((p) => p.reviewStatus === s).length, color: [RAMP[3], RAMP[1], RAMP[0]][i] }))} center=${pc(started / (ps.length || 1))} sub="started" />` },
          ],
          table: { name: 'review-completion-by-manager', rows: mgrs, search: (m) => m.p.name, columns: [{ key: 'name', label: 'Manager', render: (m) => who(m.p), sort: (m) => m.p.name, csv: (m) => m.p.name }, { key: 'team', label: 'Reviewees', align: 'r' }, { key: 'ns', label: 'Not started', align: 'r' }, { key: 'self', label: 'Self review done', align: 'r' }, { key: 'mgr', label: 'Manager review', align: 'r' }, { key: 'pct', label: 'Started', render: (m) => html`<div style="min-width:130px"><${PO.Progress} value=${m.pct * 100} tone=${m.pct < 0.5 ? 'amber' : ''} label=${pc(m.pct)} /></div>`, csv: (m) => pc(m.pct) }], initialSort: { key: 'pct', dir: 'asc' } },
        };
      }
    }
    return null;
  }

  /* ---------- shared bits ---------- */
  function useLeavers() { const P = PO.P(); return useMemo(() => buildLeavers(P), [P.id]); }
  const lastRun = (P, key, i) => { const r = PO.seeded('rpt-run' + P.id + key); const d = r.int(0, 9); return { when: d === 0 ? 'Today, ' + P.hhmm(r.int(6 * 60, P.company.nowMin)) : PO.rel(PO.addDays(PO.TODAY, -d)), by: r.pick([P.byId[P.hrId].first, P.byId[P.topId].first, 'scheduled']), views: r.int(4, 60) }; };
  const schedText = (s) => `${s.freq}${s.freq === 'Weekly' ? ', ' + s.day : s.freq === 'Monthly' ? ', ' + s.dom : ''} at ${s.time}, ${s.channels.join(' + ')}`;

  function ScheduleDrawer({ rep, open, onClose }) {
    const P = PO.P();
    const [scheds, setScheds] = PO.useCoState('reports.schedules', {});
    const cur = scheds[rep.key];
    const [s, setS] = useState(cur || { freq: 'Weekly', day: 'Monday', dom: '1st', time: '08:00', channels: ['Email'], who: [P.hrId, P.topId].filter((x, i, a) => a.indexOf(x) === i), format: 'PDF', paused: false });
    const [q, setQ] = useState('');
    const pool = P.people.filter((p) => p.role === 'office' || p.role === 'sup' || p.role === 'lead' || p.inCharge);
    const matches = q ? pool.filter((p) => !s.who.includes(p.id) && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];
    const tog = (c) => setS({ ...s, channels: s.channels.includes(c) ? s.channels.filter((x) => x !== c) : [...s.channels, c] });
    const save = () => { if (!s.channels.length || !s.who.length) return PO.toast('Pick at least one channel and one recipient', { icon: 'TriangleAlert' }); setScheds({ ...scheds, [rep.key]: { ...s, paused: false, since: PO.TODAY } }); PO.toast(`${rep.name} scheduled: ${schedText(s)}`, { icon: 'CalendarClock' }); onClose(); };
    const stop = () => { const n = { ...scheds }; delete n[rep.key]; setScheds(n); PO.toast('Schedule removed', { action: { label: 'Undo', run: () => setScheds({ ...n, [rep.key]: cur }) } }); onClose(); };
    const channels = [['Email', 'Mail'], ['Slack', 'Hash'], ['Microsoft Teams', 'Users']];
    return html`<${PO.Drawer} open=${open} onClose=${onClose} title=${'Schedule, ' + rep.name} sub="Delivered as a snapshot with the filters you have applied" footer=${html`${cur ? html`<${PO.Button} kind="ghost" icon="Trash2" onClick=${stop}>Remove schedule</${PO.Button}>` : null}<span class="grow"></span><${PO.Button} onClick=${onClose}>Cancel</${PO.Button}><${PO.Button} kind="primary" icon="CalendarCheck2" onClick=${save}>${cur ? 'Update schedule' : 'Schedule report'}</${PO.Button}>`}>
      <div class="col gap-16">
        <${PO.Field} label="How often"><${PO.Segmented} options=${[['Daily', 'Daily'], ['Weekly', 'Weekly'], ['Monthly', 'Monthly'], ['After payroll', 'After each payroll']]} value=${s.freq} onChange=${(v) => setS({ ...s, freq: v })} /></${PO.Field}>
        <div class="grid g-2">
          ${s.freq === 'Weekly' ? html`<${PO.Field} label="Day"><${PO.Select} value=${s.day} onChange=${(v) => setS({ ...s, day: v })} options=${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']} /></${PO.Field}>` : s.freq === 'Monthly' ? html`<${PO.Field} label="Day of month"><${PO.Select} value=${s.dom} onChange=${(v) => setS({ ...s, dom: v })} options=${['1st', '5th', '15th', 'Last working day']} /></${PO.Field}>` : html`<${PO.Field} label="When" hint=${s.freq === 'Daily' ? 'Monday to Saturday' : 'Sent once payroll is locked'}><input class="input" disabled value=${s.freq === 'Daily' ? 'Every working day' : 'When ' + P.company.cadence.toLowerCase() + ' payroll locks'} /></${PO.Field}>`}
          <${PO.Field} label="Time" hint=${P.company.city + ' time'}><${PO.Select} value=${s.time} onChange=${(v) => setS({ ...s, time: v })} options=${['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00']} /></${PO.Field}>
        </div>
        <${PO.Field} label="Send by"><div class="row">${channels.map(([c, ic]) => html`<button type="button" class=${'rpt-chk ' + (s.channels.includes(c) ? 'on' : '')} onClick=${() => tog(c)}><${PO.Icon} n=${ic} size=${15} /><span class="grow">${c}</span>${s.channels.includes(c) ? html`<${PO.Icon} n="Check" size=${14} />` : null}</button>`)}</div></${PO.Field}>
        <${PO.Field} label="Recipients" hint="Recipients also see it under Reports in their portal">
          <div class="row wrap" style="gap:6px;margin-bottom:8px">${s.who.map((id) => { const p = P.byId[id]; return html`<span class="rpt-chip"><${PO.Avatar} p=${p} size="xs" />${p.name}<button title="Remove" onClick=${() => setS({ ...s, who: s.who.filter((x) => x !== id) })}><${PO.Icon} n="X" size=${12} /></button></span>`; })}</div>
          <div style="position:relative"><${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Add a manager, supervisor or office user" width=${'100%'} />
            ${matches.length ? html`<div class="menu" style="top:calc(100% + 4px);left:0;right:0">${matches.map((p) => html`<button class="menu-item" onClick=${() => { setS({ ...s, who: [...s.who, p.id] }); setQ(''); }}><${PO.Avatar} p=${p} size="xs" /><span class="grow">${p.name}</span><span class="faint t-xs">${p.title}</span></button>`)}</div>` : null}
          </div>
        </${PO.Field}>
        <${PO.Field} label="Format"><${PO.Segmented} options=${[['PDF', 'PDF summary'], ['XLSX', 'Excel with data'], ['Link', 'Link only']]} value=${s.format} onChange=${(v) => setS({ ...s, format: v })} /></${PO.Field}>
        <div class="faint t-sm">${`${rep.name} will go to ${PO.plural(s.who.length, 'person', 'people')} ${s.freq === 'After payroll' ? 'after each payroll' : s.freq.toLowerCase()}${s.freq === 'Weekly' ? ' on ' + s.day : s.freq === 'Monthly' ? ' on the ' + s.dom : ''} at ${s.time}${s.channels.length ? ' by ' + s.channels.join(' and ') : ''}.`}</div>
      </div>
    </${PO.Drawer}>`;
  }

  /* ---------- report dashboard view ---------- */
  const toKpi = (s, acc, icon) => ({ label: s.label, value: s.value, icon: s.icon || icon, accent: s.tone === 'red' ? 'red' : s.tone === 'amber' ? 'amber' : acc, faces: s.faces, tone: s.tone === 'red' ? 'red' : undefined, alert: s.tone === 'amber' || s.tone === 'red', sub: s.delta ? `${s.delta.dir === 'up' ? '↑' : s.delta.dir === 'down' ? '↓' : ''}${s.delta.v}${s.sub ? ', ' + s.sub : ''}` : s.sub, onClick: s.onClick });
  function ReportView({ rep, all, query = {} }) {
    const P = PO.P();
    const leavers = useLeavers();
    const defP = rep.key === 'hiring' ? '3' : rep.key === 'absence' ? '6' : '12';
    const [period, setPeriod] = useState(defP);
    const [site, setSite] = useState('');
    const [dept, setDept] = useState('');
    const [sched, setSched] = useState(!!query.schedule);
    const [pinned, setPinned] = PO.useCoState('reports.pinned', []);
    const [scheds] = PO.useCoState('reports.schedules', {});
    const ps = useMemo(() => P.people.filter((p) => (!site || p.site === site) && (!dept || p.dept === dept)), [P.id, site, dept]);
    const N = +period;
    const idx = Array.from({ length: N }, (_, i) => 12 - N + i);
    const R = useMemo(() => buildReport(rep.key, { P, ps, N, idx, leavers, site, dept }), [P.id, rep.key, site, dept, period]);
    const isPin = pinned.includes(rep.key);
    const pin = () => { setPinned(isPin ? pinned.filter((k) => k !== rep.key) : [...pinned, rep.key]); PO.toast(isPin ? `${rep.name} removed from Home` : `${rep.name} pinned to Home`, { icon: 'Pin', action: { label: 'Undo', run: () => setPinned(pinned) } }); };
    const has = (f) => rep.f.includes(f);
    const tbl = R.table;
    const pw = periodWord(P);
    const sw = P.id === 'us' ? 'location' : 'site';
    const sc = scheds[rep.key];
    const idxOf = all.findIndex((r) => r.key === rep.key);
    const next = all[(idxOf + 1) % all.length];
    const charts = R.charts;
    const rem = (3 - (sum(charts, (c) => c.span || 1) % 3)) % 3;
    const { dispatch } = PO.useStore();
    const notes = (R.notes || []).filter(Boolean);
    return html`
      <a class="rpt-back" href=${PO.href('reports')}><${PO.Icon} n="ArrowLeft" size=${13} />Reports</a>
      <${PO.PageHeader} title=${html`<span class="row" style="gap:12px"><${PO.Chip} icon=${rep.icon} accent=${catAcc(rep.cat)} size=${17} />${rep.name}</span>`} sub=${html`${rep.cat} report on ${PO.plural(ps.length, 'person', 'people')}, live data as of ${P.hhmm(P.company.nowMin)}.${sc ? html` Sent <span class="link" onClick=${() => setSched(true)}>${sc.freq.toLowerCase()}${sc.paused ? ' (paused)' : ''}</span>.` : null}`} actions=${html`
        <${PO.Button} icon="CalendarClock" onClick=${() => setSched(true)}>${sc ? 'Edit schedule' : 'Schedule'}</${PO.Button}>
        <${PO.Menu} align="right" width=${200} trigger=${html`<${PO.Button} kind="primary" icon="Download" iconRight="ChevronDown">Export</${PO.Button}>`} items=${[
          { label: 'PDF report', icon: 'FileText', onClick: () => PO.fakeDownload(`${rep.name} (PDF)`) },
          { label: 'Excel workbook', icon: 'FileSpreadsheet', onClick: () => PO.fakeDownload(`${rep.name} (XLSX)`) },
          { label: 'CSV of the table', icon: 'Table', onClick: () => exportTable(tbl) },
        ]} />
        <${PO.Menu} align="right" width=${220} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: isPin ? 'Unpin from Home' : 'Pin to Home', icon: isPin ? 'PinOff' : 'Pin', onClick: pin },
          { label: 'Copy share link', icon: 'Link', onClick: () => PO.toast('Link copied. Anyone with Reports access can open it.', { icon: 'Link' }) },
          { label: 'Explain this report', icon: 'MessageSquareText', onClick: () => dispatch({ type: 'set', patch: { assistant: { prompt: 'Explain the ' + rep.name.toLowerCase() + ' report' } } }) },
          '-',
          { label: 'Next: ' + next.name, icon: 'ArrowRight', onClick: () => PO.go('reports?r=' + next.key) },
        ]} />`} />
      <div class="rpt-filters">
        ${has('period') ? html`<${PO.Select} value=${period} onChange=${setPeriod} options=${[['1', 'This ' + pw + ', ' + shortLabel(P, P.payHistory[11].label)], ['3', `Last 3 ${pw}s`], ['6', `Last 6 ${pw}s`], ['12', `Last 12 ${pw}s`]]} />` : html`<span class="faint t-sm">Snapshot as of ${PO.date(PO.TODAY)}</span>`}
        ${has('site') ? html`<${PO.Select} value=${site} onChange=${setSite} options=${[['', 'All ' + sw + 's'], ...P.sites.map((s) => [s.id, s.name])]} />` : null}
        ${has('dept') ? html`<${PO.Select} value=${dept} onChange=${setDept} options=${[['', 'All departments'], ...P.depts.map((d) => [d.name, d.name])]} />` : null}
        ${site || dept || period !== defP ? html`<${PO.Button} kind="ghost" size="sm" onClick=${() => { setSite(''); setDept(''); setPeriod(defP); }}>Reset</${PO.Button}>` : null}
      </div>
      <${PO.KpiStrip} items=${R.stats.map((x) => toKpi(x, catAcc(rep.cat), rep.icon))} />
      <div class="grid g-3 mt-24">${charts.map((c) => html`<${PO.Card} icon=${chartIcon(c.el)} accent=${catAcc(rep.cat)} title=${c.title} sub=${c.sub} cls=${c.span === 2 ? 'span-2' : ''}>${c.el}</${PO.Card}>`)}
        ${rem && notes.length ? html`<${PO.Card} icon="Lightbulb" accent="amber" title="Summary" cls=${rem === 2 ? 'span-2' : ''}><ul class="rpt-notes">${notes.map((n) => html`<li dangerouslySetInnerHTML=${{ __html: n }}></li>`)}</ul></${PO.Card}>` : null}</div>
      <div class="section-h" style="margin-top:24px"><h2 class="row" style="gap:8px"><${PO.Chip} icon="Table" accent=${catAcc(rep.cat)} />Detail</h2><span class="faint t-sm tnum">${PO.plural(tbl.rows.length, 'row')}</span></div>
      <${PO.DataTable} rows=${tbl.rows} columns=${tbl.columns} search=${tbl.search} filters=${tbl.filters || []} exportName=${tbl.name} pageSize=${12} initialSort=${tbl.initialSort} empty=${tbl.empty} foot=${tbl.foot} compact
        onRow=${(r) => { if (r.j) return PO.go('hiring'); const p = r.p || (r.id && P.byId[r.id]) || (r.who && P.byId[r.who]); if (p && p.id) PO.go('people/' + p.id); else if (r.site && P.sites.find((s) => s.id === r.site)) setSite(r.site); else if (r.dept && has('dept')) setDept(r.dept); }} />
      <div class="row mt-16 faint t-sm">Source: payroll, attendance and people records for ${P.company.name}.${rep.key === 'attrition' ? ' Leavers include everyone whose last day fell in the window.' : ''}<a class="right link row" style="gap:4px" href=${PO.href('reports?r=' + next.key)}>Next: ${next.name}</a></div>
      ${sched ? html`<${ScheduleDrawer} rep=${rep} open=${sched} onClose=${() => setSched(false)} />` : null}`;
  }
  function exportTable(tbl) {
    const cols = tbl.columns.filter((c) => c.label && c.csv !== false);
    PO.exportCsv(tbl.name, [cols.map((c) => c.label), ...tbl.rows.map((r) => cols.map((c) => (c.csv ? c.csv(r) : c.sort ? c.sort(r) : r[c.key])))]);
  }

  /* ---------- library: one list of report links, grouped by category ---------- */
  function Library({ all }) {
    const P = PO.P();
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('');
    const [pinned, setPinned] = PO.useCoState('reports.pinned', []);
    const [scheds] = PO.useCoState('reports.schedules', {});
    const list = all.filter((r) => (!cat || r.cat === cat) && (!q || (r.name + r.desc).toLowerCase().includes(q.toLowerCase())));
    const pin = (r) => { const on = pinned.includes(r.key); setPinned(on ? pinned.filter((k) => k !== r.key) : [...pinned, r.key]); PO.toast(on ? `${r.name} unpinned` : `${r.name} pinned to Home`, { icon: 'Pin' }); };
    return html`<div class="card" style="overflow:hidden">
      <div class="tbl-toolbar"><${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search reports" width=${240} />
        <${PO.Select} width=${170} value=${cat} onChange=${setCat} options=${[['', 'All categories'], ...CATS.map(([c]) => [c, c])]} />
        <span class="right faint t-sm">${PO.plural(list.length, 'report')}</span></div>
      ${list.length ? CATS.filter(([c]) => list.some((r) => r.cat === c)).map(([c]) => html`<div class="rpt-cat"><${PO.Chip} icon=${CAT_META[c][0]} accent=${CAT_META[c][1]} size=${12} />${c}<span class="n">${list.filter((r) => r.cat === c).length}</span></div>
        ${list.filter((r) => r.cat === c).map((r) => { const lr = lastRun(P, r.key); const s = scheds[r.key]; const on = pinned.includes(r.key); return html`<a class="rpt-row" href=${PO.href('reports?r=' + r.key)}>
          <${PO.Chip} icon=${r.icon} accent=${catAcc(r.cat)} size=${16} />
          <span class="grow" style="min-width:0"><span class="rpt-name">${r.name}</span><span class="rpt-desc">${r.desc}</span></span>
          <span class="rpt-meta">${s ? html`<span class="row" style="gap:5px"><${PO.Icon} n="CalendarClock" size=${12} />${s.freq}</span>` : null}${on ? html`<span class="row" style="gap:5px"><${PO.Icon} n="Pin" size=${12} />Pinned</span>` : null}</span>
          <span class="rpt-when">Run ${/^(Today|Yesterday)/.test(lr.when) ? lr.when.charAt(0).toLowerCase() + lr.when.slice(1) : lr.when}</span>
          <span class="rpt-pin" onClick=${(e) => { e.preventDefault(); e.stopPropagation(); }}><${PO.IconButton} icon=${on ? 'PinOff' : 'Pin'} size="sm" title=${on ? 'Unpin from Home' : 'Pin to Home'} onClick=${() => pin(r)} /></span>
        </a>`; })}`) : html`<${PO.Empty} icon="SearchX" title="No reports match" text="Try another word, or build your own." action=${html`<${PO.Button} onClick=${() => { setQ(''); setCat(''); }}>Clear search</${PO.Button}>`} />`}
    </div>`;
  }

  /* ---------- ask a question ---------- */
  function metricsFor(P) {
    const lk = LEAVE_KEY[P.id], lt = PO.leaveType(lk);
    return [
      ['headcount', 'Headcount', (a) => a.length, (v) => PO.num(v)],
      ['cost', 'Employer cost', (a) => sum(a, (p) => p.pay.gross + p.pay.erTotal), m0],
      ['gross', 'Gross pay', (a) => sum(a, (p) => p.pay.gross), m0],
      ['net', 'Net pay', (a) => sum(a, (p) => p.pay.net), m0],
      ['avgGross', 'Average gross pay', (a) => sum(a, (p) => p.pay.gross) / (a.length || 1), m0],
      ['otHours', 'Overtime hours', (a) => sum(a, (p) => p.pay.otHours), (v) => PO.num(v) + ' h'],
      ['otPay', 'Overtime pay', (a) => sum(a, (p) => p.pay.otPay), m0],
      ['tenure', 'Average tenure (years)', (a) => sum(a, (p) => p.tenureMonths) / 12 / (a.length || 1), (v) => v.toFixed(1) + ' yrs'],
      ['leave', `${lt.name} balance (${lt.unit})`, (a) => sum(a, (p) => (p.leave[lk] || {}).balance || 0), (v) => PO.num(v) + ' ' + lt.unit],
      ['docs', 'Missing or expired documents', (a) => sum(a, (p) => p.docs.filter((d) => d.status === 'Missing' || d.status === 'Expired').length), (v) => PO.num(v)],
      ['late', 'Late right now', (a) => a.filter((p) => P.lateMap[p.id]).length, (v) => PO.num(v)],
      ['rating', 'Average performance rating', (a) => sum(a, (p) => p.rating) / (a.length || 1), (v) => v.toFixed(2)],
    ];
  }
  const TBANDS = [['Under 1 year', 0, 12], ['1–3 years', 12, 36], ['3–5 years', 36, 60], ['5 years +', 60, 999]];
  function groupsFor(P) {
    return [
      ['site', P.id === 'us' ? 'Location' : 'Site', (p) => siteName(p.site)],
      ['dept', 'Department', (p) => p.dept],
      ['title', 'Role', (p) => p.title],
      ['type', 'Employment type', (p) => p.type],
      ['shift', 'Shift', (p) => PO.shiftOf(p.shift).label],
      ['grade', 'Grade', (p) => p.grade],
      ['gender', 'Gender', (p) => (p.g === 'f' ? 'Women' : 'Men')],
      ['status', 'Status', (p) => p.status],
      ['tband', 'Tenure band', (p) => (TBANDS.find(([, a, b]) => p.tenureMonths >= a && p.tenureMonths < b) || TBANDS[0])[0]],
    ];
  }
  function filtersFor(P) {
    return [['all', 'Everyone'], ...P.sites.map((s) => ['site:' + s.id, s.name]), ...P.depts.map((d) => ['dept:' + d.name, d.name]), ...[...new Set(P.people.map((p) => p.type))].map((t) => ['type:' + t, t + ' only']), ['g:f', 'Women only'], ['g:m', 'Men only']];
  }
  const applyFilter = (ps, f) => { if (!f || f === 'all') return ps; const [k, v] = [f.slice(0, f.indexOf(':')), f.slice(f.indexOf(':') + 1)]; return ps.filter((p) => (k === 'g' ? p.g === v : k === 'site' ? p.site === v : p[k] === v)); };
  function examples(P) {
    const w = P.id === 'us' ? 'location' : 'site';
    return {
      in: [['Which site ran the most overtime this month?', { m: 'otHours', g: 'site', f: 'all', c: 'hbars' }], ['What does each department cost us?', { m: 'cost', g: 'dept', f: 'all', c: 'donut' }], ['How many women work in each department?', { m: 'headcount', g: 'dept', f: 'g:f', c: 'bars' }]],
      us: [['Which location runs the most overtime?', { m: 'otHours', g: 'site', f: 'all', c: 'hbars' }], ['What does each department cost us this period?', { m: 'cost', g: 'dept', f: 'all', c: 'donut' }], ['How long have people stayed, by role?', { m: 'tenure', g: 'title', f: 'all', c: 'hbars' }]],
      uk: [['Which site has the most overtime?', { m: 'otHours', g: 'site', f: 'all', c: 'hbars' }], ['How many part-timers do we have at each site?', { m: 'headcount', g: 'site', f: 'type:Part-time', c: 'bars' }], ['What is our holiday balance by department?', { m: 'leave', g: 'dept', f: 'all', c: 'donut' }]],
    }[P.id].map(([q, cfg]) => [q.replace('{w}', w), cfg]);
  }
  function parseQuestion(P, text) {
    const t = text.toLowerCase();
    const m = /overtime|\bot\b/.test(t) ? (/pay|cost|spend|\$|£|₹/.test(t) ? 'otPay' : 'otHours') : /cost|spend|expensive/.test(t) ? 'cost' : /net/.test(t) ? 'net' : /average pay|avg pay|average salary/.test(t) ? 'avgGross' : /pay|salary|wage|gross/.test(t) ? 'gross' : /tenure|how long|stayed|years/.test(t) ? 'tenure' : /leave|pto|holiday|balance/.test(t) ? 'leave' : /document|doc|paperwork|missing/.test(t) ? 'docs' : /late/.test(t) ? 'late' : /rating|perform/.test(t) ? 'rating' : /how many|headcount|people|staff|count|number/.test(t) ? 'headcount' : null;
    const g = /department|dept|team/.test(t) ? 'dept' : /site|location|store|branch|café|cafe/.test(t) ? 'site' : /shift/.test(t) ? 'shift' : /grade/.test(t) ? 'grade' : /gender|women|men|female|male/.test(t) && !/women only|only women/.test(t) ? 'gender' : /type|part-time|full-time|contract/.test(t) ? 'type' : /role|job|title|position/.test(t) ? 'title' : /tenure band/.test(t) ? 'tband' : /status|probation|notice/.test(t) ? 'status' : null;
    let f = 'all';
    if (/women|female/.test(t) && g !== 'gender') f = 'g:f';
    if (/part-time|part time|part-timer/.test(t) && g !== 'type') f = 'type:Part-time';
    P.sites.forEach((s) => { if (t.includes(s.name.toLowerCase().split(' ')[0]) && g !== 'site') f = 'site:' + s.id; });
    return { m, g, f };
  }
  function Ask({ initial }) {
    const P = PO.P();
    const M = metricsFor(P), G = groupsFor(P), F = filtersFor(P);
    const [cfg, setCfg] = PO.useCoState('reports.ask', { m: 'headcount', g: 'site', f: 'all', c: 'bars' });
    const [q, setQ] = useState('');
    const [read, setRead] = useState(null);
    const [saved, setSaved] = PO.useCoState('reports.saved', []);
    const met = M.find((x) => x[0] === cfg.m) || M[0], grp = G.find((x) => x[0] === cfg.g) || G[0];
    const ps = applyFilter(P.people, cfg.f);
    const rows = useMemo(() => { const r = [...group(ps, grp[2])].map(([k, a]) => ({ id: k, label: k, n: a.length, value: met[2](a) })); return cfg.g === 'tband' ? TBANDS.map(([b]) => r.find((x) => x.label === b)).filter(Boolean) : cfg.g === 'shift' ? r : r.sort((a, b) => b.value - a.value); }, [P.id, cfg.m, cfg.g, cfg.f]);
    const total = ['avgGross', 'tenure', 'rating'].includes(cfg.m) ? met[2](ps) : sum(rows, (r) => r.value);
    const top = rows.slice().sort((a, b) => b.value - a.value)[0];
    const fl = (F.find((x) => x[0] === cfg.f) || F[0])[1];
    const title = `${met[1]} by ${grp[1].toLowerCase()}${cfg.f !== 'all' ? ', ' + fl : ''}`;
    const isMoney = ['cost', 'gross', 'net', 'avgGross', 'otPay'].includes(cfg.m);
    const yF = isMoney ? ax : undefined;
    const r1 = (v) => (Number.isInteger(v) ? v : Math.round(v * 100) / 100);
    const run = (text) => {
      const ex = examples(P).find(([qq]) => qq === text);
      if (ex) { setCfg({ ...ex[1] }); setRead({ text, sure: 'high' }); setQ(text); return; }
      const p = parseQuestion(P, text);
      const next = { m: p.m || cfg.m, g: p.g || cfg.g, f: p.f, c: cfg.c };
      setCfg(next);
      setRead({ text, sure: p.m && p.g ? 'medium' : 'low', missing: [!p.m && 'what to measure', !p.g && 'how to group it'].filter(Boolean) });
    };
    PO.useEffect(() => { if (initial) { setQ(initial); run(initial); } }, []);
    const save = () => { const name = read ? read.text : title; setSaved([{ id: 'SQ-' + Date.now(), name, cfg }, ...saved.filter((s) => s.name !== name)].slice(0, 8)); PO.toast('Saved to your questions', { icon: 'Bookmark' }); };
    const chart = !rows.length ? html`<${PO.Empty} icon="SearchX" title="No people match" text="Change the filter to see results." />`
      : cfg.c === 'bars' ? html`<${PO.Charts.Bars} labels=${rows.slice(0, 14).map((r) => shortName(r.label))} series=${[{ name: met[1], data: rows.slice(0, 14).map((r) => r1(r.value)) }]} fmt=${met[3]} yFmt=${yF} height=${260} />`
      : cfg.c === 'hbars' ? html`<${PO.Charts.HBars} data=${rows.slice(0, 12).map((r) => ({ label: r.label, value: r1(r.value), sub: PO.plural(r.n, 'person', 'people') }))} fmt=${met[3]} />`
      : cfg.c === 'donut' ? html`<${PO.Charts.Donut} size=${190} thickness=${22} data=${rows.slice(0, 8).map((r) => ({ label: r.label, value: r1(r.value) }))} fmt=${met[3]} center=${isMoney ? mc(total) : met[3](total)} sub=${['avgGross', 'tenure', 'rating'].includes(cfg.m) ? 'overall' : 'total'} />`
      : html`<${PO.DataTable} bare compact rows=${rows} pageSize=${15} columns=${[{ key: 'label', label: grp[1] }, { key: 'n', label: 'People', align: 'r' }, { key: 'value', label: met[1], align: 'r', render: (r) => met[3](r.value), csv: (r) => r1(r.value) }]} />`;
    const sel = (k, opts, w) => html`<select class="select" value=${cfg[k]} onChange=${(e) => { setCfg({ ...cfg, [k]: e.target.value }); setRead(null); }}>${opts.map((o) => html`<option value=${o[0]}>${o[1]}</option>`)}</select>`;
    return html`<div class="grid g-main">
      <div class="col gap-16" style="min-width:0">
        <div class="card" style="padding:16px">
          <form class="rpt-ask" onSubmit=${(e) => { e.preventDefault(); if (q.trim()) run(q.trim()); }}>
            <${PO.Icon} n="Search" size=${15} cls="faint" />
            <input value=${q} onInput=${(e) => setQ(e.target.value)} placeholder=${'Ask a question, e.g. ' + examples(P)[0][0]} />
            <${PO.Button} kind="primary" type="submit">Run</${PO.Button}>
          </form>
          ${read ? html`<div class="rpt-read ${read.sure === 'low' ? 'low' : ''}">
            ${`Read as ${met[1].toLowerCase()}, grouped by ${grp[1].toLowerCase()}${cfg.f !== 'all' ? ', for ' + fl.toLowerCase() : ''}. `}${read.sure === 'high' ? (top ? `${top.label} is highest at ${met[3](top.value)}.` : '') : read.sure === 'medium' ? 'Adjust the fields below if that is not what you meant.' : `Couldn’t tell ${read.missing.join(' or ')}, so your current choice is kept. Pick it below.`}
          </div>` : null}
          <div class="rpt-builder mt-16">
          <${PO.Field} label="Measure">${sel('m', M)}</${PO.Field}>
          <${PO.Field} label="Group by">${sel('g', G)}</${PO.Field}>
          <${PO.Field} label="Filter">${sel('f', F)}</${PO.Field}>
          <${PO.Field} label="Show as"><${PO.Segmented} options=${[['bars', 'Bars'], ['hbars', 'Ranked'], ['donut', 'Donut'], ['table', 'Table']]} value=${cfg.c} onChange=${(v) => setCfg({ ...cfg, c: v })} /></${PO.Field}>
          </div>
        </div>
        <${PO.Card} title=${title} sub=${`${PO.plural(ps.length, 'person', 'people')}, ${P.company.period}`} actions=${html`<${PO.Button} size="sm" kind="ghost" icon="Bookmark" onClick=${save}>Save</${PO.Button}><${PO.Menu} align="right" trigger=${html`<${PO.IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: 'Export CSV', icon: 'Download', onClick: () => PO.exportCsv('question', [[grp[1], 'People', met[1]], ...rows.map((r) => [r.label, r.n, r1(r.value)])]) }]} />`}>
          <div class="row" style="margin-bottom:14px;gap:20px">
            <div><div class="faint t-xs">${['avgGross', 'tenure', 'rating'].includes(cfg.m) ? 'Overall' : 'Total'}</div><div class="t-xl w-600 tnum">${met[3](total)}</div></div>
            ${top ? html`<div><div class="faint t-xs">Highest</div><div class="t-md w-600">${top.label} <span class="muted tnum w-500">${met[3](top.value)}</span></div></div>` : null}
            <div><div class="faint t-xs">Groups</div><div class="t-md w-600 tnum">${rows.length}</div></div>
          </div>
          ${chart}
        </${PO.Card}>
      </div>
      <div class="col gap-16">
        <${PO.Card} title="Saved" flush sub=${saved.length ? String(saved.length) : ''}>
          ${saved.length ? saved.map((s) => html`<div class="rpt-mini" onClick=${() => { setCfg(s.cfg); setRead(null); }}><${PO.Icon} n="Bookmark" size=${14} cls="faint" /><span class="grow ellipsis">${s.name}</span><span onClick=${(e) => e.stopPropagation()}><${PO.IconButton} icon="X" size="sm" title="Remove" onClick=${() => setSaved(saved.filter((x) => x.id !== s.id))} /></span></div>`) : html`<div class="rpt-none">Save a report to rerun it with fresh numbers any time.</div>`}
        </${PO.Card}>
        <${PO.Card} title="Examples" flush>
          ${[...examples(P).map(([t]) => t), P.id === 'us' ? 'Average pay by shift' : 'Average pay by grade', 'Missing documents by ' + (P.id === 'us' ? 'location' : 'site')].map((t) => html`<div class="rpt-mini" onClick=${() => { setQ(t); run(t); }}><span class="grow ellipsis">${t}</span></div>`)}
        </${PO.Card}>
        <div class="faint t-sm" style="padding:0 4px">Managers only see their own team in answers. Pay figures need the Payroll or Owner role.</div>
      </div>
    </div>`;
  }

  /* ---------- headline numbers + right rail ---------- */
  function Headline() {
    const P = PO.P();
    const leavers = useLeavers();
    const H = P.payHistory;
    const avgHeads = sum(H, (h) => h.heads) / H.length;
    const attr = leavers.length / avgHeads;
    const docs = P.people.flatMap((p) => p.docs);
    const ver = docs.filter((d) => d.status === 'Verified').length;
    const bad = docs.filter((d) => d.status === 'Missing' || d.status === 'Expired').length;
    const otH = sum(P.people, (p) => p.pay.otHours);
    const prev = H[10];
    const ch = (P.totals.cost - prev.cost) / prev.cost;
    const go = (k) => PO.href('reports?r=' + k);
    return html`<${PO.KpiStrip} items=${[
      { label: 'Headcount', icon: 'Users', accent: 'blue', value: PO.num(P.people.length), sub: `+${PO.num(P.people.length - H[0].heads)} in 12 ${periodWord(P)}s`, href: go('headcount') },
      { label: 'Attrition, annualised', icon: 'UserMinus', accent: 'red', value: pc(attr * (P.id === 'us' ? 26 / 12 : P.id === 'uk' ? 13 / 12 : 1)), sub: `${leavers.length} leavers in 12 ${periodWord(P)}s`, href: go('attrition'), alert: attr * (P.id === 'us' ? 26 / 12 : P.id === 'uk' ? 13 / 12 : 1) > 0.35 },
      { label: 'Employer cost, ' + P.company.period, icon: 'Banknote', accent: 'green', value: mc(P.totals.cost), sub: `${ch >= 0 ? '↑' : '↓'}${pc(Math.abs(ch), 1)} on last ${periodWord(P)}`, href: go('payroll') },
      { label: 'Overtime hours', icon: 'Timer', accent: 'amber', faces: P.people.filter((p) => p.pay.otHours).sort((a, b) => b.pay.otHours - a.pay.otHours).slice(0, 8).map((p) => p.id), value: PO.num(otH), sub: `${mc(sum(P.people, (p) => p.pay.otPay))} overtime pay`, href: go('overtime') },
      { label: 'Document compliance', icon: 'FileCheck2', accent: 'teal', value: pc(ver / docs.length, 1), sub: `${PO.num(bad)} missing or expired`, href: go('documents'), alert: bad > 0, bar: [{ v: ver, k: 'ok', title: `${ver} verified` }, { v: docs.length - ver - bad, k: 'warn', title: `${docs.length - ver - bad} pending or expiring` }, { v: bad, k: 'bad', title: `${bad} missing or expired` }] },
    ]} />`;
  }
  function Rail({ all }) {
    const P = PO.P();
    const [pinned] = PO.useCoState('reports.pinned', []);
    const [scheds] = PO.useCoState('reports.schedules', {});
    const go = (k) => PO.go('reports?r=' + k);
    const popular = all.map((r) => ({ r, v: lastRun(P, r.key).views })).sort((a, b) => b.v - a.v).slice(0, 5);
    const pins = all.filter((r) => pinned.includes(r.key));
    const sch = all.filter((r) => scheds[r.key]);
    return html`<div class="col gap-16" style="min-width:0">
      <${PO.Card} icon="Pin" accent="green" title="Pinned to Home" flush sub=${pins.length ? String(pins.length) : ''}>
        ${pins.length ? pins.slice(0, 7).map((r) => html`<div class="rpt-mini" onClick=${() => go(r.key)}><${PO.Chip} icon=${r.icon} accent=${catAcc(r.cat)} size=${13} /><span class="grow ellipsis w-500">${r.name}</span><span class="faint t-sm">${r.cat}</span></div>`) : html`<div class="rpt-none">Pin a report and its headline numbers show on Home.</div>`}
      </${PO.Card}>
      <${PO.Card} icon="CalendarClock" accent="blue" title="Scheduled" flush sub=${sch.length ? String(sch.length) : ''} actions=${sch.length ? html`<${PO.Button} size="sm" kind="ghost" href=${PO.href('reports?tab=scheduled')}>View all</${PO.Button}>` : null}>
        ${sch.length ? sch.slice(0, 7).map((r) => html`<div class="rpt-mini" onClick=${() => go(r.key)}><${PO.Chip} icon=${r.icon} accent=${catAcc(r.cat)} size=${13} /><span class="grow" style="min-width:0"><span class="ellipsis w-500" style="display:block">${r.name}</span><small class="faint">${schedText(scheds[r.key])}</small></span><${PO.AvatarStack} ids=${scheds[r.key].who} max=${3} size="xs" /></div>`) : html`<div class="rpt-none">Nothing scheduled. Open a report and choose Schedule to send it by email, Slack or Teams.</div>`}
      </${PO.Card}>
      <${PO.Card} icon="Eye" accent="violet" title="Most viewed this month" flush>
        ${popular.map(({ r, v }) => html`<div class="rpt-mini" onClick=${() => go(r.key)}><${PO.Chip} icon=${r.icon} accent=${catAcc(r.cat)} size=${13} /><span class="grow ellipsis w-500">${r.name}</span><span class="faint t-sm tnum">${v}</span></div>`)}
      </${PO.Card}>
    </div>`;
  }

  /* ---------- scheduled tab ---------- */
  function Scheduled({ all }) {
    const P = PO.P();
    const [scheds, setScheds] = PO.useCoState('reports.schedules', {});
    const [edit, setEdit] = useState(null);
    const rows = all.filter((r) => scheds[r.key]).map((r) => ({ id: r.key, r, s: scheds[r.key] }));
    const pause = (row) => { setScheds({ ...scheds, [row.id]: { ...row.s, paused: !row.s.paused } }); PO.toast(row.s.paused ? `${row.r.name} resumed` : `${row.r.name} paused`); };
    return html`${rows.length ? html`<${PO.DataTable} rows=${rows} exportName="scheduled-reports" columns=${[
      { key: 'name', label: 'Report', render: (x) => html`<span class="row" style="gap:10px"><${PO.Chip} icon=${x.r.icon} accent=${catAcc(x.r.cat)} /><b class="w-550">${x.r.name}</b></span>`, sort: (x) => x.r.name, csv: (x) => x.r.name },
      { key: 'when', label: 'Schedule', render: (x) => schedText(x.s), sort: (x) => x.s.freq, csv: (x) => schedText(x.s) },
      { key: 'who', label: 'Recipients', render: (x) => html`<span class="row"><${PO.AvatarStack} ids=${x.s.who} max=${4} size="xs" /><span class="faint t-sm">${x.s.who.length}</span></span>`, csv: (x) => x.s.who.map((id) => P.byId[id].name).join('; '), sort: (x) => x.s.who.length },
      { key: 'format', label: 'Format', render: (x) => x.s.format, csv: (x) => x.s.format },
      { key: 'st', label: 'Status', render: (x) => html`<${PO.Status} s=${x.s.paused ? 'Inactive' : 'Active'} />`, csv: (x) => (x.s.paused ? 'Paused' : 'Active') },
      { key: 'act', label: '', sort: false, csv: false, render: (x) => html`<span class="row" style="justify-content:flex-end" onClick=${(e) => e.stopPropagation()}><${PO.Button} size="sm" kind="ghost" onClick=${() => PO.toast(`${x.r.name} sent to ${PO.plural(x.s.who.length, 'recipient')}`, { icon: 'Send' })}>Send now</${PO.Button}><${PO.Menu} align="right" trigger=${html`<${PO.IconButton} size="sm" icon="Ellipsis" title="More" />`} items=${[{ label: x.s.paused ? 'Resume' : 'Pause', icon: x.s.paused ? 'Play' : 'Pause', onClick: () => pause(x) }, { label: 'Edit schedule', icon: 'Pencil', onClick: () => setEdit(x.r) }]} /></span>` },
    ]} onRow=${(x) => PO.go('reports?r=' + x.id)} />` : html`<div class="card"><${PO.Empty} icon="CalendarClock" title="No scheduled reports" text="Open any report and choose Schedule to send it by email, Slack or Microsoft Teams." action=${html`<${PO.Button} href=${PO.href('reports')}>Browse reports</${PO.Button}>`} /></div>`}
    ${edit ? html`<${ScheduleDrawer} rep=${edit} open onClose=${() => setEdit(null)} />` : null}`;
  }

  /* ---------- page ---------- */
  function Reports({ query }) {
    const P = PO.P();
    const all = useMemo(() => catalogue(P), [P.id]);
    const [scheds] = PO.useCoState('reports.schedules', {});
    const [tab, setTabState] = useState(query.tab || 'library');
    const rep = query.r && all.find((r) => r.key === query.r);
    if (rep) return html`<${ReportView} key=${rep.key} rep=${rep} all=${all} query=${query} />`;
    const t0 = query.tab || tab;
    const t = t0 === 'overview' ? 'library' : t0;
    const setTab = (k) => { setTabState(k); PO.go('reports?tab=' + k); };
    const nSched = Object.keys(scheds).length;
    const pack = () => PO.fakeDownload(`${P.company.short} people pack, ${shortLabel(P, P.payHistory[11].label)} (PDF)`);
    return html`
      <${PO.PageHeader} title="Reports" sub=${`${all.length} reports on live data for ${P.company.period}${nSched ? `, ${nSched} sent on a schedule` : ''}. Updated ${P.hhmm(P.company.nowMin)}.`} actions=${html`
        <${PO.Button} icon="Download" onClick=${pack}>People pack</${PO.Button}>
        <${PO.Button} kind="primary" icon="Plus" onClick=${() => setTab('ask')}>New report</${PO.Button}>
        <${PO.Menu} align="right" width=${230} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'Scheduled deliveries', icon: 'CalendarClock', onClick: () => setTab('scheduled') },
          { label: 'Export report catalogue', icon: 'Download', onClick: () => PO.exportCsv('report-catalogue', [['Report', 'Category', 'Description'], ...all.map((r) => [r.name, r.cat, r.desc])]) },
        ]} />`} />
      <${Headline} />
      <div class="mt-24"><${PO.Tabs} tabs=${[['library', 'All reports', all.length], ['ask', 'Build a report'], ['scheduled', 'Scheduled', nSched || null]]} value=${t} onChange=${setTab} /></div>
      ${t === 'ask' ? html`<${Ask} initial=${query.q} />` : t === 'scheduled' ? html`<${Scheduled} all=${all} />` : html`<div class="grid g-main" style="align-items:start"><${Library} all=${all} /><${Rail} all=${all} /></div>`}`;
  }

  PO.route('reports', Reports, { title: 'Reports' });
})();
