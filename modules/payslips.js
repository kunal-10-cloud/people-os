/* People OS: payroll history and payslips (routes `payslips`, `payslips/:id`).
   History KPIs, cost trend, runs with a full register per run, the current period's payslips, and a typeset
   country-format payslip with YTD, net pay in words and a "Why did my pay change?" explanation. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;
  const { Button, Card, Badge, Icon, Stat, Callout, DataTable, Drawer, Who, Avatar, Menu, Tabs, KV } = PO;
  const X = () => PO.payx;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .ps-back { display:inline-flex; align-items:center; gap:6px; color:var(--text-2); font-size:12.5px; font-weight:500; margin-bottom:12px; }
  .ps-back:hover { color:var(--text); }
  .ps-paper { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:32px 36px 28px; }
  .ps-top { display:flex; gap:24px; align-items:flex-start; padding-bottom:20px; border-bottom:1px solid var(--border-strong); }
  .ps-emp { display:flex; align-items:center; gap:12px; padding:16px 0 0; }
  .ps-emp .av.lg { width:44px; height:44px; box-shadow:0 0 0 1px var(--border); }
  .ps-emp b { font-size:14px; font-weight:600; display:block; }
  .ps-who { display:flex; align-items:center; gap:8px; min-width:0; }
  .ps-co { font-size:15px; font-weight:650; letter-spacing:-0.01em; }
  .ps-title { margin-left:auto; text-align:right; flex:none; }
  .ps-title .k { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--text-3); font-weight:600; }
  .ps-grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:14px 24px; padding:20px 0; border-bottom:1px solid var(--border); margin:0; }
  .ps-grid dt { color:var(--text-3); font-size:11.5px; }
  .ps-grid dd { margin:2px 0 0; font-weight:500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .ps-att { display:flex; padding:12px 0; border-bottom:1px solid var(--border); margin-bottom:20px; }
  .ps-att div { flex:1; padding:0 16px; border-left:1px solid var(--border); }
  .ps-att div:first-child { padding-left:0; border-left:none; }
  .ps-att small { display:block; color:var(--text-3); font-size:11.5px; }
  .ps-att b { font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
  .ps-cols { display:grid; grid-template-columns:1fr 1fr; gap:32px; }
  .ps-tbl { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
  .ps-tbl th { text-align:left; font-size:11.5px; color:var(--text-3); font-weight:500; padding:0 0 6px; border-bottom:1px solid var(--border-strong); }
  .ps-tbl td { padding:7px 0; border-bottom:1px solid var(--border); }
  .ps-tbl .r { text-align:right; } .ps-tbl .ytd { color:var(--text-3); width:96px; }
  .ps-tbl tr.tot td { border-bottom:none; border-top:1px solid var(--border-strong); font-weight:600; padding-top:9px; }
  .ps-tbl tr.pad td { border-bottom:1px solid transparent; }
  .ps-net { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 24px; align-items:baseline; margin-top:24px; padding:14px 0; border-top:1px solid var(--border-strong); border-bottom:1px solid var(--border-strong); }
  .ps-net .amt { font-size:22px; font-weight:650; letter-spacing:-0.02em; font-variant-numeric:tabular-nums; text-align:right; }
  .ps-words { color:var(--text-2); font-size:12.5px; }
  .ps-sec { margin-top:24px; }
  .ps-sec h4 { font-size:12px; color:var(--text-2); font-weight:600; margin:0 0 6px; }
  .ps-leave { display:grid; gap:0; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
  .ps-leave > div { padding:8px 12px; border-left:1px solid var(--border); }
  .ps-leave > div:first-child { border-left:none; padding-left:0; }
  .ps-cols > table { align-self:start; }
  .ps-mini { display:flex; align-items:flex-end; gap:8px; height:84px; }
  .ps-mini > div { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; min-width:0; }
  .ps-mini i { display:block; width:100%; max-width:26px; border-radius:2px; background:var(--chart-5); opacity:.45; }
  .ps-mini > div.on i { background:var(--chart-1); opacity:1; }
  .ps-mini small { font-size:10.5px; color:var(--text-3); white-space:nowrap; }
  .ps-kv { display:flex; justify-content:space-between; gap:12px; padding:7px 0; border-top:1px solid var(--border); font-size:12.5px; }
  .ps-kv:first-child { border-top:none; }
  .ps-kv > span:first-child { color:var(--text-3); flex:none; }
  .ps-kv > span:last-child { text-align:right; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .ps-foot { margin-top:24px; padding-top:12px; border-top:1px solid var(--border); color:var(--text-3); font-size:11.5px; display:flex; gap:16px; }
  .ps-why { display:flex; justify-content:space-between; gap:12px; padding:7px 0; border-top:1px solid var(--border); font-size:12.5px; }
  .ps-why > span:last-child { font-variant-numeric:tabular-nums; flex:none; }
  .ps-rail .card-b { padding-top:8px; }
  @media print { .side, .topbar, .ps-rail, .ph-actions, .ps-back, .toasts, .ai-fab { display:none !important; } .shell { display:block !important; } .page { padding:0 !important; } .ps-paper { border:none; } .g-main { display:block !important; } }
  </style>`);

  const fine = (n) => PO.money(n, { cents: !PO.isIN() });
  const axis = (v) => (PO.isIN() ? (v ? `₹${Math.round(v / 1e5)}L` : '₹0') : PO.money(v, { compact: true }));
  const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

  /* ---------- number to words ---------- */
  const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));
  const three = (n) => (n >= 100 ? ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : '') : two(n));
  function wordsIN(n) {
    if (!n) return 'Zero';
    const parts = [];
    const cr = Math.floor(n / 1e7), lk = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1e3), rest = n % 1000;
    if (cr) parts.push(wordsIN(cr) + ' Crore'); if (lk) parts.push(two(lk) + ' Lakh'); if (th) parts.push(two(th) + ' Thousand'); if (rest) parts.push(three(rest));
    return parts.join(' ');
  }
  function wordsIntl(n) {
    if (!n) return 'Zero';
    const parts = [];
    const m = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1e3), rest = n % 1000;
    if (m) parts.push(three(m) + ' Million'); if (th) parts.push(three(th) + ' Thousand'); if (rest) parts.push(three(rest));
    return parts.join(' ');
  }
  function inWords(P, amt) {
    const whole = Math.floor(amt + 1e-9), frac = Math.round((amt - whole) * 100);
    if (P.id === 'in') return `Rupees ${wordsIN(whole)}${frac ? ` and ${two(frac)} Paise` : ''} Only`;
    const cur = P.id === 'us' ? ['dollar', 'dollars', 'cents'] : ['pound', 'pounds', 'pence'];
    const w = wordsIntl(whole);
    return `${w.charAt(0) + w.slice(1).toLowerCase()} ${whole === 1 ? cur[0] : cur[1]} and ${String(frac).padStart(2, '0')} ${cur[2]}`;
  }

  /* ---------- pay dates and registers ---------- */
  const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const isoOf = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
  function paidOn(P, h, i) {
    const last = i === P.payHistory.length - 1;
    if (last) return X().PERIOD[P.id].pay;
    if (P.id === 'in') { const [mn, y] = h.label.split(' '); const d = new Date(Date.UTC(+y, MON[mn] + 1, 7)); while ([0, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
    const end = h.label.replace('*', '').split(' – ')[1];
    let y = 2026, m, d;
    if (P.id === 'us') { const [mn, dd] = end.split(' '); m = MON[mn]; d = +dd; } else { const [dd, mn] = end.split(' '); m = MON[mn]; d = +dd; if (i <= 1) y = 2025; }
    const dt = new Date(Date.UTC(y, m, d + 5));
    return dt.toISOString().slice(0, 10);
  }
  const shortLabel = (P, h) => (P.id === 'in' ? h.label.slice(0, 3) + " '" + h.label.slice(-2) : h.label.replace('*', '').split(' – ')[0]);
  const regCache = {};
  /** Per-employee register for a run. The current run is exact (p.pay); past runs scale p.pay deterministically and reconcile to the run totals. */
  function register(P, idx) {
    const key = P.id + ':' + idx;
    if (regCache[key]) return regCache[key];
    const H = P.payHistory, h = H[idx];
    const last = idx === H.length - 1;
    let rows;
    if (last) rows = P.people.map((p) => ({ p, gross: p.pay.gross, ded: p.pay.dedTotal, net: p.pay.net, er: p.pay.erTotal, work: p.pay.work }));
    else {
      const ppl = P.people.filter((p) => !p.joiner).slice().sort((a, b) => a.joinedIso.localeCompare(b.joinedIso) || a.id.localeCompare(b.id)).slice(0, h.heads);
      const raw = ppl.map((p) => { const r = PO.seeded('reg' + P.id + h.id + p.id); const j = 0.95 + r.rnd() * 0.1, k = 0.97 + r.rnd() * 0.06; return { p, g: p.pay.gross * j, n: p.pay.net * j * k }; });
      const rnd = P.id === 'in' ? Math.round : r2;
      const norm = (vals, total) => { const s = vals.reduce((t, v) => t + v, 0) || 1; const out = vals.map((v) => rnd((v / s) * total)); const diff = rnd(total - out.reduce((t, v) => t + v, 0)); out[0] = rnd(out[0] + diff); return out; };
      const gross = norm(raw.map((x) => x.g), h.gross);
      const net = norm(raw.map((x, i) => Math.min(x.n, gross[i])), h.net);
      const er = norm(raw.map((x) => x.p.pay.erTotal * (x.g / x.p.pay.gross)), h.er);
      rows = raw.map((x, i) => ({ p: x.p, gross: gross[i], net: net[i], ded: rnd(gross[i] - net[i]), er: er[i], work: x.p.pay.work }));
    }
    regCache[key] = rows;
    return rows;
  }

  /* ================= payslips list / history ================= */
  function Payslips({ query = {} }) {
    const P = PO.P();
    const { state } = PO.useStore();
    const [tab, setTab] = useState(query.tab === 'slips' ? 'slips' : 'runs');
    const [run, setRun] = useState(query.run != null ? +query.run : null);
    const lock = PO.coGet(state, 'payroll.lock', { status: 'Draft' });
    const H = P.payHistory;
    const T = P.totals;
    const per = X().PERIOD[P.id];
    const ytdIdx = P.id === 'us' ? H.map((_, i) => i) : H.map((h, i) => i).slice(-(P.id === 'in' ? 6 : 6));
    const ytdCost = ytdIdx.reduce((t, i) => t + H[i].cost, 0);
    const otPay = P.people.reduce((t, p) => t + p.pay.otPay, 0);
    const erShare = H.map((h) => (h.er / h.gross) * 100);
    const statusOf = (i) => (i === H.length - 1 ? lock.status || 'Draft' : 'Paid');
    const ytdLabel = P.id === 'in' ? 'Payroll cost, FY 2026-27' : P.id === 'uk' ? 'Payroll cost, tax year' : 'Payroll cost since Apr 27';
    const ytdSub = P.id === 'in' ? 'Apr – Sep 2026, 6 runs' : P.id === 'uk' ? 'Since 6 Apr 2026, 6 runs' : '12 bi-weekly runs';
    const rows = H.map((h, i) => ({ ...h, i, paid: paidOn(P, h, i), status: statusOf(i) })).reverse();
    const avg = T.net / P.people.length, avgPrev = H[H.length - 2].net / H[H.length - 2].heads;
    const draft = !lock.status || lock.status === 'Draft';
    const exportHistory = () => PO.exportCsv('payroll-history', [['Run', 'Period', 'Heads', 'Gross', 'Net', 'Employer contributions', 'Employer cost', 'Status', 'Paid on'], ...H.map((h, i) => [h.id, h.label, h.heads, h.gross, h.net, h.er, h.cost, statusOf(i), paidOn(P, h, i)])]);
    const Row = ({ k, v }) => html`<div class="ps-kv"><span>${k}</span><span>${v}</span></div>`;
    return html`<${PO.PageHeader} title="Payslips & history" sub=${`${P.company.cadence} payroll with ${H.length} runs on record. Last paid ${PO.date(paidOn(P, H[H.length - 2], H.length - 2), { short: true })}; ${PO.plural(P.people.length, 'payslip')} in the current period.`}
        actions=${html`<${Button} onClick=${exportHistory}>Export history</${Button}><${Button} kind="primary" href=${PO.href('payroll')}>${draft ? 'Continue ' + P.company.period : 'Open current run'}</${Button}>`} />
      <${PO.KpiStrip} items=${[
        { label: ytdLabel, icon: 'Building2', accent: 'blue', value: P.id === 'in' ? PO.money(ytdCost, { compact: true }) : PO.money(Math.round(ytdCost)), sub: ytdSub, bar: [{ v: ytdIdx.reduce((t, i) => t + H[i].net, 0), k: 'ok', title: 'Net pay' }, { v: ytdIdx.reduce((t, i) => t + H[i].gross - H[i].net, 0), k: 'mute', title: 'Deductions' }, { v: ytdIdx.reduce((t, i) => t + H[i].er, 0), title: 'Employer contributions' }] },
        { label: 'Average net per head', icon: 'Wallet', accent: 'green', value: PO.money(Math.round(avg)), sub: `${avg >= avgPrev ? '+' : '−'}${(Math.abs(avg / avgPrev - 1) * 100).toFixed(1)}% vs last run` },
        { label: 'Overtime share of gross', icon: 'Timer', accent: 'violet', value: PO.pct(otPay / T.gross, 1), sub: `${PO.money(otPay, { compact: true })} overtime this run` },
        { label: 'Employer contributions', icon: 'PiggyBank', accent: 'teal', value: erShare[erShare.length - 1].toFixed(1) + '%', sub: `of gross, ${PO.money(T.erTotal, { compact: true })} this run` },
      ]} />
      <div class="grid g-main" style="margin-top:24px;align-items:start">
        <${Card} title="Employer cost by run" icon="ChartColumn" accent="blue" sub=${`Last ${H.length} runs`}>
          <${PO.Charts.Bars} height=${212} labels=${H.map((h) => shortLabel(P, h))} series=${[{ name: 'Employer cost', data: H.map((h) => h.cost), color: 'var(--chart-1)' }]} fmt=${(v) => PO.money(v, { compact: true })} yFmt=${axis} highlight=${run != null ? run : H.length - 1} />
        </${Card}>
        <${Card} title="This run" icon="Banknote" accent="green" sub=${P.company.period} actions=${html`<a class="link t-sm" href=${PO.href('payroll')}>Open</a>`}>
          <${Row} k="Status" v=${html`<${PO.Status} s=${lock.status || 'Draft'} />`} />
          <${Row} k="Pay date" v=${PO.date(per.pay, { weekday: true })} />
          <${Row} k="People" v=${PO.num(P.people.length)} />
          <${Row} k="Gross pay" v=${fine(T.gross)} />
          <${Row} k="Deductions" v=${'−' + fine(T.dedTotal)} />
          <${Row} k="Net pay" v=${html`<b class="w-600" style="font-family:var(--num);font-size:15px">${fine(T.net)}</b>`} />
          <${Row} k="Employer contributions" v=${fine(T.erTotal)} />
          <${Row} k="Employer cost" v=${fine(T.cost)} />
        </${Card}>
      </div>
      <div style="margin-top:24px"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['runs', 'Payroll runs', H.length], ['slips', 'Payslips, ' + P.company.period, P.people.length]]} /></div>
      ${tab === 'runs' ? html`<${DataTable} rows=${rows} rowKey=${(r) => r.id} exportName="payroll-runs" search=${(r) => r.label + ' ' + r.id} pageSize=${12}
          filters=${[{ key: 's', label: 'Status', options: ['Paid', 'Draft', 'Locked'], test: (r, v) => r.status === v }]}
          onRow=${(r) => setRun(r.i)}
          columns=${[
            { key: 'label', label: 'Period', render: (r) => html`<span class="row" style="gap:10px"><${PO.Chip} icon=${r.status === 'Paid' ? 'FileCheck2' : r.status === 'Locked' ? 'FileLock2' : 'FilePen'} accent=${r.status === 'Paid' ? (r.label.includes('*') ? 'violet' : 'green') : 'amber'} size=${13} /><span><span class="w-500">${r.label.replace('*', '')}</span>${r.label.includes('*') ? html` <span class="faint t-sm">short period</span>` : null}</span></span>`, sort: (r) => r.i },
            { key: 'id', label: 'Run', render: (r) => html`<span class="faint">${r.id}</span>`, sort: (r) => r.i },
            { key: 'heads', label: 'Heads', align: 'r', render: (r) => html`<span class="tnum">${PO.num(r.heads)}</span>`, sort: (r) => r.heads },
            { key: 'gross', label: 'Gross', align: 'r', render: (r) => html`<span class="tnum">${PO.money(r.gross)}</span>`, sort: (r) => r.gross },
            { key: 'net', label: 'Net', align: 'r', render: (r) => html`<span class="tnum w-500">${PO.money(r.net)}</span>`, sort: (r) => r.net },
            { key: 'cost', label: 'Employer cost', align: 'r', render: (r) => html`<span class="tnum">${PO.money(r.cost)}</span>`, sort: (r) => r.cost },
            { key: 'trend', label: 'Net vs previous', align: 'r', render: (r) => { const p = H[r.i - 1]; if (!p) return html`<span class="faint">–</span>`; const d = (r.net - p.net) / p.net; return html`<span class="tnum muted">${d >= 0 ? '+' : '−'}${(Math.abs(d) * 100).toFixed(1)}%</span>`; }, sort: false, csv: false },
            { key: 'status', label: 'Status', render: (r) => html`<${PO.Status} s=${r.status} />`, sort: (r) => r.status },
            { key: 'paid', label: 'Paid on', render: (r) => (r.status === 'Paid' ? html`<span class="tnum">${r.i === H.length - 1 ? 'Today' : PO.date(r.paid, { short: true })}</span>` : html`<span class="faint tnum">Due ${PO.date(r.paid, { short: true })}</span>`), sort: (r) => r.paid },
          ]} />`
        : html`<${SlipsTable} P=${P} released=${!!lock.released} />`}
      <${RunDrawer} idx=${run} onClose=${() => setRun(null)} status=${run != null ? statusOf(run) : ''} />`;
  }

  function SlipsTable({ P, released }) {
    const rows = useMemo(() => P.people.map((p) => { const q = X().prevPay(P, p); return { p, d: q ? r2(p.pay.net - q.net) : null }; }), [P.id]);
    return html`<${DataTable} rows=${rows} rowKey=${(r) => r.p.id} exportName="payslips" search=${(r) => r.p.name + ' ' + r.p.id + ' ' + r.p.title} pageSize=${15} selectable
      filters=${[{ key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (r, v) => r.p.site === v }, { key: 'ch', label: 'Change', options: [['up', 'Higher than last'], ['down', 'Lower than last'], ['new', 'First payslip']], test: (r, v) => (v === 'new' ? r.d == null : v === 'up' ? r.d > 0 : r.d < 0) }]}
      bulk=${(ids, clear) => html`<${Button} size="sm" onClick=${() => { PO.toast(`${PO.plural(ids.length, 'payslip')} shared to the employee portal, with email alerts`, { icon: 'Send' }); clear(); }}>Send</${Button}><${Button} size="sm" onClick=${() => { PO.fakeDownload(`${PO.plural(ids.length, 'payslip')} (ZIP)`); clear(); }}>Download PDFs</${Button}>`}
      onRow=${(r) => PO.go('payslips/' + r.p.id)}
      columns=${[
        { key: 'name', label: 'Employee', render: (r) => html`<${Who} p=${r.p} size="sm" sub=${r.p.id + ', ' + r.p.title} link=${false} />`, sort: (r) => r.p.name, csv: (r) => r.p.name },
        { key: 'site', label: 'Site', render: (r) => html`<span class="t-sm muted">${PO.site(r.p.site).name}</span>`, sort: (r) => PO.site(r.p.site).name, csv: (r) => PO.site(r.p.site).name },
        { key: 'work', label: P.unitWords.work, align: 'r', render: (r) => html`<span class="tnum">${PO.num(r.p.pay.work)}</span>`, sort: (r) => r.p.pay.work },
        { key: 'gross', label: 'Gross', align: 'r', render: (r) => html`<span class="tnum">${fine(r.p.pay.gross)}</span>`, sort: (r) => r.p.pay.gross },
        { key: 'ded', label: 'Deductions', align: 'r', render: (r) => html`<span class="tnum">${fine(r.p.pay.dedTotal)}</span>`, sort: (r) => r.p.pay.dedTotal },
        { key: 'net', label: 'Net pay', align: 'r', render: (r) => html`<span class="tnum w-500">${fine(r.p.pay.net)}</span>`, sort: (r) => r.p.pay.net },
        { key: 'd', label: 'vs last', align: 'r', render: (r) => (r.d == null ? html`<span class="faint t-sm">First payslip</span>` : Math.abs(r.d) < 0.005 ? html`<span class="faint">–</span>` : html`<span class="tnum muted">${r.d > 0 ? '+' : '−'}${fine(Math.abs(r.d))}</span>`), sort: (r) => r.d ?? 0 },
        { key: 'st', label: 'Status', render: () => html`<${PO.Status} s=${released ? 'Published' : 'Draft'} />`, sort: false, csv: () => (released ? 'Published' : 'Draft') },
      ]}
      foot=${html`<tr><td></td><td>${PO.plural(P.people.length, 'payslip')}</td><td></td><td></td><td class="r tnum">${fine(P.totals.gross)}</td><td class="r tnum">${fine(P.totals.dedTotal)}</td><td class="r tnum">${fine(P.totals.net)}</td><td></td><td></td></tr>`} />`;
  }

  function RunDrawer({ idx, onClose, status }) {
    const P = PO.P();
    if (idx == null) return null;
    const h = P.payHistory[idx];
    const rows = register(P, idx);
    const s = (k) => r2(rows.reduce((t, r) => t + r[k], 0));
    const last = idx === P.payHistory.length - 1;
    return html`<${Drawer} open size="lg" title=${`Payroll register, ${h.label.replace('*', '')}`} sub=${`${h.id}, ${status.toLowerCase()}${status === 'Paid' ? ' on ' + PO.date(paidOn(P, h, idx)) : ''}. Locked by ${h.lockedBy || P.company.user.name}.`} onClose=${onClose}
      footer=${html`<${Button} onClick=${() => PO.fakeDownload(`Payroll register ${h.label} (PDF)`)}>Register PDF</${Button}><${Button} onClick=${() => PO.fakeDownload(`Bank file ${h.label}`)}>Bank file</${Button}><${Button} kind="primary" onClick=${() => PO.fakeDownload(`${PO.plural(rows.length, 'payslip')} for ${h.label} (ZIP)`)}>All payslips</${Button}>`}>
      <div class="col" style="gap:16px">
        <${PO.KpiStrip} items=${[{ label: 'Heads', icon: 'Users', accent: 'blue', value: PO.num(rows.length) }, { label: 'Gross', icon: 'Banknote', accent: 'violet', value: PO.money(s('gross')) }, { label: 'Net pay', icon: 'Wallet', accent: 'green', value: PO.money(s('net')) }, { label: 'Employer contributions', icon: 'PiggyBank', accent: 'teal', value: PO.money(s('er')) }]} />
        ${last ? html`<div class="faint t-sm">Live numbers from the ${P.company.period} run. <a class="link" href=${PO.href('payroll')}>Open the run</a></div>` : null}
        <${DataTable} rows=${rows} rowKey=${(r) => r.p.id} compact pageSize=${12} exportName=${'register-' + h.id.toLowerCase()} search=${(r) => r.p.name + ' ' + r.p.id}
          filters=${[{ key: 'site', label: 'Site', options: P.sites.map((x) => [x.id, x.name]), test: (r, v) => r.p.site === v }]}
          onRow=${(r) => PO.go('payslips/' + r.p.id)}
          columns=${[
            { key: 'name', label: 'Employee', render: (r) => html`<span class="ps-who"><${Avatar} p=${r.p} size="sm" /><span><span class="w-500">${r.p.name}</span> <span class="faint t-sm">${r.p.id}</span></span></span>`, sort: (r) => r.p.name, csv: (r) => r.p.name },
            { key: 'site', label: 'Site', render: (r) => html`<span class="t-sm muted">${PO.site(r.p.site).name}</span>`, sort: (r) => r.p.site, csv: (r) => PO.site(r.p.site).name },
            { key: 'gross', label: 'Gross', align: 'r', render: (r) => html`<span class="tnum">${fine(r.gross)}</span>`, sort: (r) => r.gross },
            { key: 'ded', label: 'Deductions', align: 'r', render: (r) => html`<span class="tnum">${fine(r.ded)}</span>`, sort: (r) => r.ded },
            { key: 'net', label: 'Net', align: 'r', render: (r) => html`<span class="tnum w-500">${fine(r.net)}</span>`, sort: (r) => r.net },
            { key: 'er', label: 'Employer', align: 'r', render: (r) => html`<span class="tnum">${fine(r.er)}</span>`, sort: (r) => r.er },
          ]}
          foot=${html`<tr><td>Total for ${rows.length}</td><td></td><td class="r tnum">${fine(s('gross'))}</td><td class="r tnum">${fine(s('ded'))}</td><td class="r tnum">${fine(s('net'))}</td><td class="r tnum">${fine(s('er'))}</td></tr>`} />
      </div>
    </${Drawer}>`;
  }

  /* ================= single payslip ================= */
  function ytdOf(P, p) {
    const per = X().PERIOD[P.id];
    const fyStart = { in: '2026-04-01', us: '2026-01-01', uk: '2026-04-06' }[P.id];
    const len = { in: 30.4, us: 14, uk: 28 }[P.id];
    const n = p.joinedIso > fyStart ? Math.max(1, Math.min(per.ytdN, Math.ceil((new Date(per.to) - new Date(p.joinedIso)) / 864e5 / len))) : per.ytdN;
    const prev = X().prevPay(P, p);
    const r = PO.seeded('ytd' + P.id + p.id);
    const f = 0.96 + r.rnd() * 0.04;
    const rnd = P.id === 'in' ? Math.round : r2;
    const fixed = ['pt', 'tds', 'sal', 'uni'];
    const line = (list, k, amt) => { if (n === 1) return amt; const pa = prev ? prev[list].find((x) => x.k === k)?.amt ?? 0 : amt; return rnd(amt + pa + (n - 2) * amt * (fixed.includes(k) ? 1 : f)); };
    return { n, line };
  }
  function leaveFoot(P, p) { return P.leaveTypes.filter((t) => t.quota != null).map((t) => ({ t, v: p.leave[t.key] })); }

  function Payslip({ params }) {
    const P = PO.P();
    const { state } = PO.useStore();
    const p = PO.person(params[0]) || P.hero;
    const x = p.pay;
    const C = P.company;
    const per = X().PERIOD[P.id];
    const y = ytdOf(P, p);
    const lock = PO.coGet(state, 'payroll.lock', { status: 'Draft' });
    const actions = PO.coGet(state, 'payroll.actions', {});
    const adj = PO.coGet(state, 'payroll.adj', []).filter((a) => a.who === p.id);
    const rb = X().reimbursements(P, state).filter((a) => a.who === p.id);
    const rc = X().recoveries(P, state).filter((a) => a.who === p.id);
    const adjSum = adj.reduce((t, a) => t + a.amt, 0);
    const credited = r2(x.net + adjSum + rb.reduce((t, a) => t + a.amt, 0) - rc.reduce((t, a) => t + a.amt, 0));
    const b = X().bankOf(P, p);
    const site = PO.site(p.site);
    const ids = P.id === 'in'
      ? [['Employee ID', p.id], ['Designation', p.title], ['Department', p.dept], ['Site', site.name], ['Date of joining', PO.date(p.joinedIso)], ['PAN', p.ids.pan], [C.idLabel, C.idValue(p)], ['PF number', `PUPUN0048213000${p.id.slice(-4)}`], x.ded.some((l) => l.k === 'esi') ? ['ESIC IP', p.ids.esic] : ['ESIC', 'Not covered'], ['Bank', b.missing ? 'Not on file' : `${b.name} ${b.acct}`], ['IFSC', b.missing ? '—' : b.code], ['Pay mode', b.missing ? 'Held' : 'NEFT']]
      : P.id === 'us'
        ? [['Employee ID', p.id], ['Job title', p.title], ['Location', site.name], ['Hire date', PO.date(p.joinedIso)], [C.idLabel, C.idValue(p)], ['Filing status', p.joiner ? 'Single (IRS default, no W-4)' : 'Single, 2026 W-4'], ['Pay rate', P.roles[p.role].rate ? `$${P.roles[p.role].rate.toFixed(2)} an hour` : `${PO.money(P.roles[p.role].salary)} a period`], ['FLSA', P.roles[p.role].rate || p.flag ? 'Non-exempt' : 'Exempt'], ['State', 'Texas (no income tax)'], ['Deposit', p.joiner ? 'Paper check' : `${b.name} ${b.acct}`], ['Pay date', PO.date(per.pay)], ['Check no.', `DD-${20460 + P.people.indexOf(p)}`]]
        : [['Employee ID', p.id], ['Job title', p.title], ['Site', site.name], ['Start date', PO.date(p.joinedIso)], [C.idLabel, C.idValue(p)], ['Tax code', p.ids.taxCode], ['NI category', 'A'], ['Pay period', 'Period 7, four-weekly'], ['Pay rate', P.roles[p.role].rate ? `£${P.roles[p.role].rate.toFixed(2)} an hour` : `${PO.money(P.roles[p.role].salary)} a period`], ['Pension', 'NEST, 5% and 3%'], ['Bank', `${b.name} ${b.acct}`], ['Sort code', b.code]];
    const att = P.id === 'in'
      ? [['Days in month', p.u.days], ['Paid days', x.work], ['Loss of pay', x.unpaid], ['Overtime hours', x.otHours], ['Night shifts', p.u.nights || 0]]
      : P.id === 'us'
        ? (P.roles[p.role].salary ? [['Pay basis', 'Salary'], ['Standard hours', 80], ['Overtime hours', 0], ['PTO used (h)', 0]] : [['Regular hours', p.u.reg], ['PTO hours', p.u.pto || 0], ['Overtime hours', x.otHours], ['Total paid hours', x.work + x.otHours]])
        : (P.roles[p.role].salary ? [['Pay basis', 'Salary'], ['Contracted hours', 160], ['Overtime hours', 0], ['Holiday hours', 0]] : [['Basic hours', p.u.hours], ['Night hours', p.u.nights || 0], ['Overtime hours', x.otHours], ['Holiday hours', p.u.hol || 0]]);
    const ytdEarn = x.earn.map((l) => y.line('earn', l.k, l.amt));
    const ytdDed = x.ded.map((l) => y.line('ded', l.k, l.amt));
    const ytdG = r2(ytdEarn.reduce((t, v) => t + v, 0)), ytdD = r2(ytdDed.reduce((t, v) => t + v, 0));
    const title = P.id === 'us' ? 'Earnings statement' : 'Payslip';
    const act = actions[p.id];
    const why = X().whyLines(P, p);
    const prev = X().prevPay(P, p);
    const send = (ch) => PO.toast(`Payslip sent to ${p.first} ${ch === 'email' ? 'by email (' + p.email + ')' : ch === 'SMS' ? 'as an SMS link' : 'via the employee portal'}`, { icon: 'Send' });
    const status = act === 'void' ? 'Voided' : act === 'hold' ? 'On hold' : lock.released ? 'Published' : 'Draft';
    const pos = adj.filter((a) => a.amt > 0), neg = adj.filter((a) => a.amt < 0);
    const pad = Math.max(0, x.earn.length + pos.length - x.ded.length - neg.length);
    const net = r2(x.net + adjSum);
    return html`<a class="ps-back" href=${PO.href('payslips?tab=slips')}><${Icon} n="ArrowLeft" size=${14} />All payslips</a>
      <header class="ph">
        <div class="row" style="gap:14px;align-items:center">
          <${Avatar} p=${p} size="lg" />
          <div class="ph-title"><div class="row" style="gap:12px"><h1>${p.name}</h1><${Badge} dot tone=${act === 'void' ? 'red' : act === 'hold' ? 'amber' : lock.released ? 'green' : 'amber'}>${status}</${Badge}></div>
            <p>${title} for ${C.period}, paid ${PO.date(per.pay, { weekday: true })}. ${p.title} at ${site.name}, ${p.id}.</p></div>
        </div>
        <div class="ph-actions">
          <${Menu} align="right" width=${220} trigger=${html`<${Button} iconRight="ChevronDown">Send</${Button}>`} items=${[{ label: 'To the employee portal', icon: 'Globe', onClick: () => send('the employee portal') }, { label: 'By email (PDF)', icon: 'Mail', onClick: () => send('email') }, { label: 'SMS alert with link', icon: 'MessageSquare', hint: p.phone, onClick: () => send('SMS') }]} />
          <${Button} onClick=${() => window.print()}>Print</${Button}>
          <${Button} kind="primary" icon="Download" onClick=${() => PO.fakeDownload(`Payslip ${p.name} ${C.period} (PDF)`)}>Download PDF</${Button}>
        </div>
      </header>
      ${act ? html`<div style="margin-bottom:24px"><${Callout} tone=${act === 'void' ? 'red' : 'amber'} icon=${act === 'void' ? 'CircleSlash' : act === 'hold' ? 'PauseCircle' : 'HandCoins'} title=${act === 'void' ? 'Voided in this run' : act === 'hold' ? 'Pay on hold' : 'Paid outside payroll'} action=${html`<a class="link t-sm" href=${PO.href('payroll?step=4')}>Open the run</a>`}>${act === 'void' ? 'This person is not part of the run, so this payslip will not be issued.' : act === 'hold' ? 'The payslip is final but the money is held until it is released in the run.' : 'Paid by cash or cheque and left out of the bank file.'}</${Callout}></div>` : null}
      <div class="grid g-main" style="align-items:start">
        <article class="ps-paper">
          <div class="ps-top">
            <div style="min-width:0"><div class="ps-co">${C.name}${P.id === 'in' ? ' Pvt Ltd' : ''}</div><div class="faint t-sm mt-4" style="max-width:440px">${C.employerLine.replace(/ · /g, ', ')}</div></div>
            <div class="ps-title"><div class="t-sm muted">${title}</div><div class="t-lg w-600 mt-4">${C.period}</div><div class="faint t-sm">Paid ${PO.date(per.pay, { weekday: true })}</div></div>
          </div>
          <div class="ps-emp"><${Avatar} p=${p} size="lg" /><div style="min-width:0"><b>${p.name}</b><div class="faint t-sm">${p.title}, ${site.name}</div></div></div>
          <dl class="ps-grid">${ids.map(([k, v]) => html`<div><dt>${k}</dt><dd title=${v}>${v}</dd></div>`)}</dl>
          <div class="ps-att">${att.map(([k, v]) => html`<div><small>${k}</small><b>${typeof v === 'number' ? PO.num(v) : v}</b></div>`)}</div>
          <div class="ps-cols">
            <table class="ps-tbl"><thead><tr><th>Earnings</th><th class="r">Amount</th><th class="r ytd">Year to date</th></tr></thead>
              <tbody>${x.earn.map((l, i) => html`<tr><td>${l.label}</td><td class="r">${fine(l.amt)}</td><td class="r ytd">${fine(ytdEarn[i])}</td></tr>`)}
              ${pos.map((a) => html`<tr><td>${a.kind}${a.note ? html` <span class="faint t-sm">(${a.note})</span>` : ''}</td><td class="r">${fine(a.amt)}</td><td class="r ytd">${fine(a.amt)}</td></tr>`)}
              <tr class="tot"><td>Gross pay</td><td class="r">${fine(r2(x.gross + pos.reduce((t, a) => t + a.amt, 0)))}</td><td class="r ytd">${fine(ytdG)}</td></tr></tbody></table>
            <table class="ps-tbl"><thead><tr><th>Deductions</th><th class="r">Amount</th><th class="r ytd">Year to date</th></tr></thead>
              <tbody>${x.ded.map((l, i) => html`<tr><td>${l.label}</td><td class="r">${fine(l.amt)}</td><td class="r ytd">${fine(ytdDed[i])}</td></tr>`)}
              ${neg.map((a) => html`<tr><td>${a.kind}${a.note ? html` <span class="faint t-sm">(${a.note})</span>` : ''}</td><td class="r">${fine(-a.amt)}</td><td class="r ytd">${fine(-a.amt)}</td></tr>`)}
              ${Array.from({ length: pad }, () => html`<tr class="pad"><td> </td><td></td><td></td></tr>`)}
              <tr class="tot"><td>Total deductions</td><td class="r">${fine(r2(x.dedTotal + neg.reduce((t, a) => t - a.amt, 0)))}</td><td class="r ytd">${fine(ytdD)}</td></tr></tbody></table>
          </div>
          <div class="ps-net">
            <span class="w-600">Net pay</span><span class="amt" style="font-family:var(--num)">${fine(net)}</span>
            <span class="ps-words">${inWords(P, net)}</span><span class="faint t-sm tnum" style="text-align:right">Year to date ${fine(r2(ytdG - ytdD))}</span>
          </div>
          ${rb.length || rc.length ? html`<div class="ps-sec"><h4>Paid with salary</h4><table class="ps-tbl"><tbody>
            ${rb.map((a) => html`<tr><td>Reimbursement, ${a.label}</td><td class="r">+${fine(a.amt)}</td></tr>`)}
            ${rc.map((a) => html`<tr><td>Recovery, ${a.label}</td><td class="r">−${fine(a.amt)}</td></tr>`)}
            <tr class="tot"><td>Credited to ${b.missing ? 'account (held)' : b.name + ' ' + b.acct}</td><td class="r" style="font-family:var(--num)">${fine(credited)}</td></tr></tbody></table></div>` : null}
          <div class="ps-cols ps-sec">
            <div><h4>Employer contributions, not part of take-home</h4><table class="ps-tbl"><tbody>${x.er.map((l) => html`<tr><td>${l.label}</td><td class="r">${fine(l.amt)}</td></tr>`)}<tr class="tot"><td>Cost to company this period</td><td class="r">${fine(r2(x.gross + x.erTotal))}</td></tr></tbody></table></div>
            <div><h4>${P.id === 'in' ? 'Leave balance' : P.id === 'us' ? 'Time off balances' : 'Holiday balance'}</h4>
              <table class="ps-tbl"><tbody>${leaveFoot(P, p).map(({ t, v }) => html`<tr><td>${t.name}<span class="faint t-sm">${v.taken ? `, ${v.taken} used` : ''}${v.pending ? `, ${v.pending} pending` : ''}</span></td><td class="r">${v.balance} <span class="faint">of ${v.quota} ${t.unit}</span></td></tr>`)}</tbody></table></div>
          </div>
          <div class="ps-foot"><span class="grow">${P.id === 'in' ? 'This is a computer-generated payslip and does not need a signature. Statutory figures follow the Code on Wages, 2019 and the EPF wage ceiling of ₹25,000 from 17 Sep 2026.' : P.id === 'us' ? 'Federal taxes withheld per IRS Publication 15-T. Texas has no state income tax. Keep this statement for your records.' : 'PAYE calculated on a cumulative basis. Pension deductions on qualifying earnings above the four-weekly lower limit of £480.'}</span><span class="tnum">Ref ${p.id}-${P.payHistory[P.payHistory.length - 1].id}</span></div>
        </article>
        <div class="col ps-rail" style="gap:16px;position:sticky;top:72px">
          <${WhyPanel} P=${P} p=${p} why=${why} prev=${prev} />
          <${HistoryCard} P=${P} p=${p} prev=${prev} />
          <${Card} title="Delivery" icon="Send" accent="violet">
            ${[['Employee portal', lock.released ? 'Published, viewed 08:31' : 'Published on release'], ['Email', p.email], ['Run', html`<a class="link" href=${PO.href('payroll')}>${C.period}, ${(lock.status || 'Draft').toLowerCase()}</a>`]].map(([k, v]) => html`<div class="ps-kv"><span>${k}</span><span title=${typeof v === 'string' ? v : ''}>${v}</span></div>`)}
          </${Card}>
        </div>
      </div>`;
  }

  function WhyPanel({ P, p, why, prev }) {
    const word = PO.payx.PERIOD[P.id].prev;
    if (!prev) return html`<${Card} title="Why did my pay change?" icon="ArrowLeftRight" accent="amber"><div class="muted t-sm">First payslip. ${p.first} joined on ${PO.date(p.joinedIso)}, so this period is prorated to ${p.pay.work} ${P.unitWords.work.toLowerCase()}.</div></${Card}>`;
    const d = r2(p.pay.net - prev.net);
    const lines = why.slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
    const sentence = d === 0 ? 'Take-home is the same as last period.' : `${d > 0 ? 'Up' : 'Down'} ${fine(Math.abs(d))} on ${word}, mostly from ${lines.slice(0, 2).map((w) => w.label.toLowerCase().replace(/\s*\(.*\)/, '')).join(' and ')}.`;
    return html`<${Card} title="Why did my pay change?" icon="ArrowLeftRight" accent="amber" sub=${`vs ${word}`}>
      <div class="t-sm" style="margin-bottom:8px">${sentence}</div>
      ${lines.length ? lines.map((w) => html`<div class="ps-why"><span class="ellipsis muted" title=${w.label}>${w.label}</span><span style=${w.v < 0 ? 'color:var(--text)' : ''}>${w.v > 0 ? '+' : '−'}${fine(Math.abs(w.v))}</span></div>`) : html`<div class="faint t-sm">Every line is the same as ${word}.</div>`}
      <div class="ps-why" style="font-weight:600"><span>Change in take-home</span><span style="font-family:var(--num);font-size:14px">${d >= 0 ? '+' : '−'}${fine(Math.abs(d))}</span></div>
      <div class="faint t-xs mt-8">${p.hero ? `${p.first} sees the same explanation in the employee portal under “${P.msg.why}”.` : `${p.first} can raise a query about this from the employee portal.`}</div>
    </${Card}>`;
  }

  function HistoryCard({ P, p, prev }) {
    const H = P.payHistory;
    const pts = [];
    for (let i = H.length - 6; i < H.length; i++) {
      if (i === H.length - 1) pts.push({ l: shortLabel(P, H[i]), v: p.pay.net, i });
      else if (i === H.length - 2) { if (prev) pts.push({ l: shortLabel(P, H[i]), v: prev.net, i }); }
      else { const r = register(P, i).find((x) => x.p.id === p.id); if (r) pts.push({ l: shortLabel(P, H[i]), v: r.net, i }); }
    }
    return html`<${Card} title=${pts.length > 1 ? `Net pay, last ${pts.length} periods` : 'Net pay history'} icon="TrendingUp" accent="blue">
      ${pts.length > 1 ? html`<div class="ps-mini">${pts.map((x, k) => { const mx = Math.max(...pts.map((q) => q.v)); return html`<div class=${k === pts.length - 1 ? 'on' : ''} title=${`${H[x.i].label.replace('*', '')}: ${fine(x.v)}`}><i style=${`height:${Math.max(6, (x.v / mx) * 64)}px`}></i><small>${x.l}</small></div>`; })}</div>` : html`<div class="faint t-sm">History starts next period.</div>`}
      ${pts.length > 1 ? html`<div class="mt-12">${pts.slice().reverse().slice(1, 4).map((x) => html`<div class="ps-kv" style="cursor:pointer" onClick=${() => PO.fakeDownload(`Payslip ${p.name} ${H[x.i].label.replace('*', '')} (PDF)`)}><span class="link">${H[x.i].label.replace('*', '')}</span><span>${fine(x.v)}</span></div>`)}</div>` : null}
    </${Card}>`;
  }

  Object.assign(PO.payx, { paidOn, register, shortLabel, inWords });
  PO.route('payslips', (props) => (props.params && props.params[0] ? html`<${Payslip} ...${props} />` : html`<${Payslips} ...${props} />`), { title: 'Payslips & history' });
  const prevCrumb = PO.crumb;
  PO.crumb = (r) => (r.name === 'payslips' && r.params[0] ? (PO.person(r.params[0]) || {}).name || r.params[0] : prevCrumb ? prevCrumb(r) : null);
})();
