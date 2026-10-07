/* People OS: staged payroll run (route `payroll`).
   Six steps from P.steps, a "Before you pay" rail with one-click fixes, lock & approve, then files, bank file,
   payslip release, statutory due dates, mark as paid, audit trail and unlock.
   Also defines PO.payx, the payroll maths shared by payslips.js, compensation.js and expenses.js. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;
  const { Button, Card, Badge, Icon, Stat, Callout, DataTable, Drawer, Modal, Who, Avatar, Menu, KV, Timeline, Field, Select, Segmented } = PO;

  /* ================= shared payroll maths (PO.payx) ================= */
  const c2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const sum = (arr, f) => c2(arr.reduce((t, x) => t + (f ? f(x) : x), 0));
  const PERIOD = {
    in: { from: '2026-09-01', to: '2026-09-30', pay: '2026-10-07', prev: 'August', prevShort: 'Aug', unit: 'days', ytdN: 6, ytdLabel: 'FY 2026-27 to date' },
    us: { from: '2026-09-21', to: '2026-10-04', pay: '2026-10-09', prev: 'last period', prevShort: 'Sep 14 – 20', unit: 'hours', ytdN: 20, ytdLabel: '2026 to date' },
    uk: { from: '2026-09-07', to: '2026-10-04', pay: '2026-10-09', prev: 'last period', prevShort: '27 Jul – 23 Aug', unit: 'hours', ytdN: 7, ytdLabel: 'Tax year to date' },
  };
  const prevCache = {};
  /** The overtime-spike site named in P.checks.ot, and its rise vs last period. */
  const SPIKE = { in: 'khd', us: 'ck', uk: 'ma' };
  const spikeOf = (P) => ({ site: SPIKE[P.id], pct: +((P.checks.ot.title.match(/(\d+)%/) || [0, 0])[1]) / 100 });
  function prevUnits(P, p) {
    if (p.joiner) return null;
    const r = PO.seeded('prev' + P.id + p.id);
    const u = p.u || {};
    const role = P.roles[p.role];
    const sp = spikeOf(P);
    const prevOt = (j, extra) => (p.site === sp.site && u.ot ? Math.round(u.ot / (1 + sp.pct)) : u.ot ? Math.max(0, u.ot + r.int(-j, j)) : r.chance(0.1) ? r.int(2, extra) : 0);
    if (P.id === 'in') {
      const otOk = role.ot > 0;
      return { days: 31, paid: r.chance(0.8) ? 31 : r.int(28, 30), ot: otOk ? prevOt(2, 4) : 0, nights: u.nights ? r.int(6, 12) : 0 };
    }
    if (role.salary) return { ...u };
    if (P.id === 'us') return { reg: r.chance(0.75) ? u.reg : r.pick([56, 64, 72, 80]), pto: r.chance(0.12) ? 8 : 0, ot: prevOt(1, 3), tips: u.tips ? Math.round(u.tips * (0.85 + r.rnd() * 0.25)) : 0 };
    return { hours: Math.min(168, Math.max(40, u.hours + r.pick([0, 0, 0, -8, 8, -16]))), nights: u.nights ? Math.max(0, Math.min(160, u.nights + r.int(-24, 16))) : 0, ot: prevOt(2, 4), hol: r.chance(0.2) ? 16 : 0 };
  }
  function prevPay(P, p) {
    const k = P.id + p.id;
    if (k in prevCache) return prevCache[k];
    let v = null;
    if (p.hero) v = P.prevPay;
    else { const u = prevUnits(P, p); v = u ? P.pay(p, u) : null; }
    prevCache[k] = v;
    return v;
  }
  /** Line-by-line change vs previous period: [{k,label,v}] (positive = more take-home). */
  function whyLines(P, p) {
    if (p.hero) return P.why;
    const prev = prevPay(P, p);
    if (!prev) return [];
    const amt = (pay, list, k) => pay[list].find((x) => x.k === k)?.amt ?? 0;
    const ek = [...new Set([...p.pay.earn, ...prev.earn].map((x) => x.k))];
    const dk = [...new Set([...p.pay.ded, ...prev.ded].map((x) => x.k))];
    return [...ek.map((k) => ({ k, v: c2(amt(p.pay, 'earn', k) - amt(prev, 'earn', k)) })), ...dk.map((k) => ({ k, v: c2(amt(prev, 'ded', k) - amt(p.pay, 'ded', k)) }))]
      .filter((x) => Math.abs(x.v) >= 0.005)
      .map((x) => ({ ...x, label: P.whyWords[x.k] || [...p.pay.earn, ...p.pay.ded, ...prev.earn, ...prev.ded].find((l) => l.k === x.k)?.label || x.k }));
  }
  /** Effective claim status: local override, then the inbox decision ('exp:<id>'), then the seeded status. */
  const expStatus = (e, st, dec) => st[e.id] || (e.status === 'Submitted' && dec['exp:' + e.id] ? (dec['exp:' + e.id] === 'approved' ? 'Approved' : 'Rejected') : e.status);
  /** Approved expenses reimbursed through this run, by person. */
  function reimbursements(P, state) {
    const st = PO.coGet(state, 'expenses.status', {});
    const mode = PO.coGet(state, 'expenses.mode', 'payroll');
    const dec = PO.coGet(state, 'approvals.decided', {});
    const out = [];
    if (mode === 'payroll') P.expenses.forEach((e) => { if (expStatus(e, st, dec) === 'Approved') out.push({ id: e.id, who: e.who, label: `${e.cat} claim ${e.id}`, amt: e.amt }); });
    const ap = P.approvals.find((a) => a.id === 'ap7');
    const m = P.money.find((x) => x[0] === 'ap7');
    if (ap && m && dec.ap7 === 'approved' && P.byId[ap.who]) out.push({ id: 'ap7', who: ap.who, label: m[1], amt: m[3] });
    return out;
  }
  /** Advance EMIs recovered in this run. */
  function recoveries(P, state) {
    const added = PO.coGet(state, 'expenses.advAdded', []);
    return [...P.advances, ...added].filter((a) => a.paid < a.inst && !a.fromNext && P.byId[a.who]).map((a) => ({ id: a.id, who: a.who, label: `${a.kind} ${a.id}, EMI ${a.paid + 1} of ${a.inst}`, amt: a.paid + 1 === a.inst ? c2(a.amt - a.emi * (a.inst - 1)) : a.emi }));
  }
  /** Live run totals for the current period, honouring pay actions and adjustments. */
  function runTotals(P, actions = {}, adj = [], state) {
    const t = { gross: 0, dedTotal: 0, net: 0, erTotal: 0, heads: 0, bank: 0, bankN: 0, held: 0, heldN: 0, outside: 0, outsideN: 0, voidN: 0, voidNet: 0, keys: {}, reimb: 0, recov: 0, payout: 0 };
    const rb = state ? reimbursements(P, state) : [];
    const rc = state ? recoveries(P, state) : [];
    const extra = {};
    rb.forEach((x) => (extra[x.who] = (extra[x.who] || 0) + x.amt));
    rc.forEach((x) => (extra[x.who] = (extra[x.who] || 0) - x.amt));
    const adjBy = {};
    adj.forEach((a) => (adjBy[a.who] = (adjBy[a.who] || 0) + a.amt));
    P.people.forEach((p) => {
      const a = actions[p.id] || 'process';
      const x = p.pay;
      if (a === 'void') { t.voidN++; t.voidNet += x.net; return; }
      const ad = adjBy[p.id] || 0;
      t.heads++;
      t.gross += x.gross + Math.max(0, ad); t.dedTotal += x.dedTotal + Math.max(0, -ad); t.net += x.net + ad; t.erTotal += x.erTotal;
      [...x.ded, ...x.er].forEach((l) => (t.keys[l.k] = (t.keys[l.k] || 0) + l.amt));
      const net = x.net + ad;
      const payout = net + (extra[p.id] || 0);
      if (a === 'process') { t.bank += payout; t.bankN++; } else if (a === 'hold') { t.held += payout; t.heldN++; } else { t.outside += payout; t.outsideN++; }
    });
    rb.forEach((x) => { if ((actions[x.who] || 'process') !== 'void') t.reimb += x.amt; });
    rc.forEach((x) => { if ((actions[x.who] || 'process') !== 'void') t.recov += x.amt; });
    ['gross', 'dedTotal', 'net', 'erTotal', 'bank', 'held', 'outside', 'voidNet', 'reimb', 'recov'].forEach((k) => (t[k] = c2(t[k])));
    Object.keys(t.keys).forEach((k) => (t.keys[k] = c2(t.keys[k])));
    t.cost = c2(t.gross + t.erTotal);
    t.payout = c2(t.bank + t.held + t.outside);
    t.extra = extra;
    return t;
  }
  /** Bank details for display: [bank, account, branch code]. */
  function bankOf(P, p) {
    const r = PO.seeded('bk' + P.id + p.id);
    const code = P.id === 'in' ? ({ 'HDFC Bank': 'HDFC', 'State Bank of India': 'SBIN', 'ICICI Bank': 'ICIC', 'Bank of Maharashtra': 'MAHB', 'Kotak Mahindra Bank': 'KKBK', 'Axis Bank': 'UTIB' }[p.bank.name] || 'HDFC') + '000' + r.int(1000, 9999)
      : P.id === 'us' ? '•••••' + r.int(1000, 9999) : `${r.int(20, 40)}-${r.int(10, 99)}-${r.int(10, 99)}`;
    return { name: p.bank.name, acct: p.bank.acct, code, codeLabel: P.id === 'in' ? 'IFSC' : P.id === 'us' ? 'Routing' : 'Sort code', missing: p.bank.status === 'missing' };
  }
  /** Pre-run checks. Approving in the inbox resolves them (approvals.decided). */
  function checksOf(state, P) {
    const dec = PO.coGet(state, 'approvals.decided', {});
    const pc = PO.coGet(state, 'payroll.checks', {});
    const ruleFixed = PO.coGet(state, 'compliance.flagFixed', false) === true;
    const c = P.checks;
    return [
      { key: 'punch', ...c.punch, icon: 'Fingerprint', step: 0, ids: ['ap1', 'ap2'], done: !!dec.ap1 && !!dec.ap2, partial: (dec.ap1 ? 1 : 0) + (dec.ap2 ? 1 : 0), doneText: `Both decided in the inbox${dec.ap1 === 'rejected' || dec.ap2 === 'rejected' ? ' (one marked unpaid)' : ''}` },
      { key: 'ot', ...c.ot, icon: 'Timer', step: 2, ids: ['ap3'], done: !!dec.ap3, doneText: dec.ap3 === 'rejected' ? 'Overtime rejected, capped at last period' : 'Overtime approved for this run' },
      { key: 'bank', ...c.bank, icon: 'Landmark', step: 1, done: !!pc.bank, doneText: c.bank.done },
      { key: 'rule', ...c.rule, icon: 'Scale', step: 5, done: ruleFixed || !!pc.rule, doneText: ruleFixed ? 'Fixed in the compliance centre' : 'Paid as-is this period; fix scheduled from next run' },
    ];
  }
  const joinerOf = (P) => P.people.find((p) => p.joiner);
  const calendar = {
    in: { runs: [['October 2026', '1–31 Oct', '2026-10-28', '2026-11-06'], ['November 2026', '1–30 Nov', '2026-11-27', '2026-12-07'], ['December 2026', '1–31 Dec', '2026-12-28', '2027-01-07'], ['January 2027', '1–31 Jan', '2027-01-27', '2027-02-05'], ['February 2027', '1–28 Feb', '2027-02-24', '2027-03-05'], ['March 2027', '1–31 Mar', '2027-03-26', '2027-04-07']],
      due: [['2026-10-07', 'TDS on September salaries', 'Challan ITNS 281', 'tds'], ['2026-10-15', 'PF ECR and payment', 'EPFO unified portal', 'epf'], ['2026-10-15', 'ESI contribution', 'ESIC portal', 'esi'], ['2026-10-31', 'Professional tax, Maharashtra', 'MahaGST PTRC', 'pt'], ['2026-10-31', 'Form 138, Q2 (Jul–Sep)', 'TDS return (was 24Q)', 'tds'], ['2027-01-15', 'Labour welfare fund, Dec half', 'MLWB, ₹12 + ₹36 per employee', null], ['2027-06-15', 'Form 130 to employees', 'Annual TDS certificate (was Form 16)', 'tds']] },
    us: { runs: [['Oct 5 – Oct 18', 'Bi-weekly', '2026-10-19', '2026-10-23'], ['Oct 19 – Nov 1', 'Bi-weekly', '2026-11-02', '2026-11-06'], ['Nov 2 – Nov 15', 'Bi-weekly', '2026-11-16', '2026-11-20'], ['Nov 16 – Nov 29', 'Bi-weekly', '2026-11-30', '2026-12-04'], ['Nov 30 – Dec 13', 'Bi-weekly', '2026-12-14', '2026-12-18'], ['Dec 14 – Dec 27', 'Paid early for New Year’s Day', '2026-12-28', '2026-12-31']],
      due: [['2026-10-14', 'Federal tax deposit (semi-weekly)', 'EFTPS: FIT, Social Security, Medicare', 'fit'], ['2026-10-18', 'Texas new-hire report', 'Ethan Park, within 20 days of hire', null], ['2026-11-02', 'Form 941, Q3', 'Quarterly federal return', 'fit'], ['2026-11-02', 'Texas unemployment (C-3), Q3', 'Texas Workforce Commission', null], ['2027-02-01', 'Forms W-2 and W-3', 'To employees and the SSA', null], ['2027-02-01', 'Form 940', 'Annual FUTA return', null]] },
    uk: { runs: [['5 Oct – 1 Nov', 'Period 8', '2026-11-02', '2026-11-06'], ['2 Nov – 29 Nov', 'Period 9', '2026-11-30', '2026-12-04'], ['30 Nov – 27 Dec', 'Period 10, paid early for Christmas', '2026-12-18', '2026-12-24'], ['28 Dec – 24 Jan', 'Period 11', '2027-01-25', '2027-01-29'], ['25 Jan – 21 Feb', 'Period 12', '2027-02-22', '2027-02-26'], ['22 Feb – 21 Mar', 'Period 13', '2027-03-22', '2027-03-26']],
      due: [['2026-10-09', 'Full Payment Submission', 'On or before payday', 'tax'], ['2026-10-19', 'Employer Payment Summary', 'Employment Allowance claim', null], ['2026-10-22', 'PAYE and NI, tax month 6', 'Pay HMRC electronically', 'tax'], ['2026-10-22', 'NEST pension contributions', 'Due by the 22nd', 'pen'], ['2027-05-31', 'P60s to employees', 'Tax year 2026-27', null], ['2027-07-06', 'P11D(b)', 'Benefits in kind, if any', null]] },
  };
  PO.payx = { expStatus, spikeOf, c2, sum, PERIOD, prevUnits, prevPay, whyLines, runTotals, bankOf, checksOf, reimbursements, recoveries, joinerOf, calendar };


  /* ================= module styles ================= */
  document.head.insertAdjacentHTML('beforeend', `<style>
  .kpi-ic.rose { background:var(--rose-soft); color:var(--rose); }
  .pr-title { display:flex; align-items:center; gap:12px; }
  .pr-sec { padding:16px; border-top:1px solid var(--border); }
  .pr-sec:first-child { border-top:none; }
  .pr-sec.flush { padding:0; }
  .pr-sec-h { display:flex; align-items:center; gap:8px; min-height:24px; margin-bottom:12px; }
  .pr-sec.flush > .pr-sec-h { padding:16px 16px 0; }
  .pr-sec-h h4 { font-size:13px; font-weight:600; margin:0; }
  .pr-sec-h .meta { color:var(--text-3); font-size:12px; }
  .pr-sec-h .right { display:flex; gap:6px; align-items:center; }
  .pr-sec .tbl th:first-child, .pr-sec .tbl td:first-child { padding-left:16px; }
  .pr-sec .tbl th:last-child, .pr-sec .tbl td:last-child { padding-right:16px; }
  .pr-note { color:var(--text-3); font-size:12px; padding:12px 16px; border-top:1px solid var(--border); }
  .pr-ask { display:flex; gap:12px; align-items:center; padding:10px 12px; border:1px solid var(--border); border-radius:var(--r); background:var(--surface-2); }
  .pr-ask .dot { width:7px; height:7px; border-radius:50%; background:var(--amber-solid); flex:none; }
  .pr-foot { display:flex; gap:8px; align-items:center; padding:12px 16px; border-top:1px solid var(--border); }
  .pr-rail { position:sticky; top:72px; }
  .pr-ck { display:flex; gap:10px; align-items:center; padding:9px 16px; border-top:1px solid var(--border); }
  .pr-ck .dot { width:7px; height:7px; border-radius:50%; flex:none; background:var(--amber-solid); align-self:flex-start; margin-top:6px; }
  .pr-ck.done .dot { background:var(--green-solid); }
  .pr-ck .t { display:block; font-weight:550; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pr-ck .t:hover { color:var(--brand-text); }
  .pr-ck.done .t { color:var(--text-2); font-weight:500; }
  .pr-ck small { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; color:var(--text-3); font-size:12px; margin-top:1px; }
  .pr-ck .btn { flex:none; }
  .pr-tot { padding:12px 16px 16px; border-top:1px solid var(--border); }
  .pr-tr { display:grid; grid-template-columns:minmax(0,1fr) auto 56px; gap:8px; align-items:baseline; padding:5px 0; }
  .pr-tr > :nth-child(2) { text-align:right; font-variant-numeric:tabular-nums; }
  .pr-tr > :nth-child(3) { text-align:right; font-size:11.5px; font-variant-numeric:tabular-nums; color:var(--text-3); }
  .pr-tr.net { border-top:1px solid var(--border); border-bottom:1px solid var(--border); margin:4px 0; padding:9px 0; }
  .pr-tr.net > :nth-child(2) { font-family:var(--num); font-size:20px; font-weight:600; letter-spacing:-0.01em; }
  .pr-sumrow { display:flex; justify-content:space-between; align-items:baseline; padding:6px 0; }
  .pr-sumrow + .pr-sumrow { border-top:1px solid var(--border); }
  .pr-sumrow.big { font-weight:600; } .pr-sumrow.big .tnum { font-family:var(--num); font-size:15px; }
  .pr-act { display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 8px; border-radius:var(--r-sm); border:1px solid var(--border); background:var(--surface); font-size:12px; font-weight:500; color:var(--text-2); cursor:pointer; white-space:nowrap; }
  .pr-act:hover { border-color:var(--border-strong); color:var(--text); }
  .pr-act::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--text-3); }
  .pr-act.process::before { background:var(--green-solid); }
  .pr-act.hold::before { background:var(--amber-solid); }
  .pr-act.void::before { background:var(--red-solid); }
  .pr-act.outside::before { background:var(--text-3); }
  .pr-file { display:flex; gap:12px; align-items:center; padding:10px 16px; border-top:1px solid var(--border); cursor:pointer; }
  .pr-file:first-child { border-top:none; }
  .pr-file:hover { background:var(--hover); }
  .pr-ext { width:40px; flex:none; font-size:11.5px; font-weight:500; color:var(--text-3); }
  .pr-site-row.on td { background:var(--surface-2); }
  .pr-site-row.on td:first-child { box-shadow:inset 2px 0 0 var(--ink); }
  .pr-due { display:grid; grid-template-columns:56px minmax(0,1fr) auto; gap:12px; align-items:center; padding:9px 16px; border-top:1px solid var(--border); }
  .pr-due:first-child { border-top:none; }
  .pr-full { width:100%; justify-content:center; }
  .pr-ck .chip-ic { align-self:flex-start; margin-top:1px; }
  .pr-ck.done .chip-ic { opacity:.75; }
  .pr-split { display:flex; height:8px; gap:2px; margin:4px 0 6px; }
  .pr-split i { display:block; height:100%; border-radius:2px; }
  .pr-legend { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:11.5px; color:var(--text-2); margin-bottom:8px; }
  .pr-legend span { display:inline-flex; align-items:center; gap:5px; } .pr-legend i { width:8px; height:8px; border-radius:2px; display:inline-block; }
  .pr-file .chip-ic { width:34px; height:34px; border-radius:10px; }
  .pr-ftype { font-size:10.5px; font-weight:600; color:var(--text-3); border:1px solid var(--border); border-radius:4px; padding:0 4px; line-height:16px; flex:none; }
  .pr-auth { width:auto !important; min-width:30px; padding:0 6px; font-size:10.5px; font-weight:700; letter-spacing:.01em; }
  .pr-who { display:flex; align-items:center; gap:8px; min-width:0; }
  </style>`);

  /* ================= helpers ================= */
  const fine = (n) => PO.money(n, { cents: !PO.isIN() });
  const nowAt = (P, plus = 0) => `Today, ${P.hhmm(P.company.nowMin + plus)}`;
  const actLabel = { process: 'Process', hold: 'Hold', void: 'Void', outside: 'Paid outside' };
  const actIcon = { process: 'CircleCheck', hold: 'PauseCircle', void: 'CircleSlash', outside: 'HandCoins' };
  const pctChange = (a, b) => (b ? (a - b) / b : 0);
  const pctTxt = (v) => (!v || Math.abs(v) < 0.0005 ? '0.0%' : (v > 0 ? '+' : '−') + (Math.abs(v) * 100).toFixed(1) + '%');
  /** Section inside a card: hairline divider, 13px title, optional meta and one action. */
  const Sec = ({ title, meta, actions, flush, children }) => html`<div class=${'pr-sec ' + (flush ? 'flush' : '')}>${title ? html`<div class="pr-sec-h"><h4>${title}</h4>${meta ? html`<span class="meta">${meta}</span>` : null}<span class="right">${actions}</span></div>` : null}${children}</div>`;
  const Dash = () => html`<span class="faint">–</span>`;

  /** Check chips by type, shared by the rail and the last step. */
  const CK_ACC = { punch: 'blue', ot: 'violet', bank: 'teal', rule: 'red' };
  const CkChip = ({ c }) => html`<${PO.Chip} icon=${c.done ? 'CircleCheck' : c.icon} accent=${c.done ? 'green' : CK_ACC[c.key] || 'amber'} />`;
  /** File-type chips for generated files. */
  const FILE_IC = { PDF: ['FileText', 'rose'], CSV: ['FileSpreadsheet', 'green'], XLSX: ['FileSpreadsheet', 'green'], TXT: ['FileCode', 'blue'], ACH: ['Landmark', 'teal'], BACS: ['Landmark', 'teal'], RTI: ['Send', 'violet'] };
  /** Authority chips for statutory dues: a short text mark in the authority's accent. */
  const authOf = (l) => {
    const co = PO.P().id;
    if (co === 'in') return /PF|EPFO|ECR|Provident/.test(l) ? ['PF', 'teal'] : /ESI/.test(l) ? ['ESI', 'rose'] : /Professional tax|PTRC|PT challan/.test(l) ? ['PT', 'violet'] : /welfare/i.test(l) ? ['LWF', 'amber'] : /TDS|Form 1[36][08]|Income tax/.test(l) ? ['TDS', 'blue'] : ['Other', 'green'];
    if (co === 'us') return /Texas|TWC|C-3/.test(l) ? ['TWC', 'amber'] : /401/.test(l) ? ['401k', 'teal'] : /Federal|EFTPS|W-2|94[01]|FUTA|Social Security|Medicare/.test(l) ? ['IRS', 'blue'] : ['Other', 'green'];
    return /NEST|[Pp]ension/.test(l) ? ['NEST', 'teal'] : /HMRC|PAYE|Payment Submission|Payment Summary|P60|P11D|RTI|National Insurance|Income tax/.test(l) ? ['HMRC', 'blue'] : ['Other', 'green'];
  };
  const Auth = ({ l }) => { const [t, a] = authOf(l); return html`<span class=${'chip-ic pr-auth ' + a}>${t}</span>`; };
  const PersonCell = ({ id, name, sub }) => { const p = id ? PO.person(id) : null; return html`<span class="pr-who"><${Avatar} p=${p} name=${p ? p.name : name} size="sm" /><span style="min-width:0"><span class="w-500">${p ? p.name : name}</span>${sub ? html` <span class="faint t-sm">${sub}</span>` : null}</span></span>`; };
  const STEP_IC = [['CalendarCheck2', 'blue'], ['UserPlus', 'teal'], ['Timer', 'violet'], ['HandCoins', 'amber'], ['PauseCircle', 'rose'], ['Landmark', 'green']];

  function useRun() {
    const { state } = PO.useStore();
    const P = PO.P();
    const [actions, setActions] = PO.useCoState('payroll.actions', {});
    const [reasons, setReasons] = PO.useCoState('payroll.reasons', {});
    const [adj, setAdj] = PO.useCoState('payroll.adj', []);
    const [log, setLog] = PO.useCoState('payroll.log', []);
    const [pc, setPc] = PO.useCoState('payroll.checks', {});
    const [dec, setDec] = PO.useCoState('approvals.decided', {});
    const [lock, setLock] = PO.useCoState('payroll.lock', { status: 'Draft' });
    const t = useMemo(() => PO.payx.runTotals(P, actions, adj, state), [P.id, actions, adj, state.by[state.co]]);
    const checks = PO.payx.checksOf(state, P);
    const addLog = (title, icon = 'Pencil', tone = '') => setLog((l) => [{ title, icon, tone, at: nowAt(P, (l || []).length + 1), by: P.company.user.name }, ...(l || [])]);
    const setAction = (id, a, reason) => {
      setActions((x) => { const n = { ...(x || {}) }; if (a === 'process') delete n[id]; else n[id] = a; return n; });
      if (reason !== undefined) setReasons((x) => ({ ...(x || {}), [id]: reason }));
      addLog(`${PO.person(id).name}: ${actLabel[a].toLowerCase()}${reason ? ` (${reason})` : ''}`, actIcon[a], a === 'void' ? 'red' : a === 'hold' ? 'amber' : '');
    };
    const decide = (ids, v = 'approved') => { setDec((d) => { const n = { ...(d || {}) }; ids.forEach((i) => (n[i] = v)); return n; }); };
    const fix = (c) => {
      if (c.key === 'punch') { decide(['ap1', 'ap2']); addLog('Approved 2 missed punches', 'Fingerprint', 'green'); PO.toast('Both missed punches approved. The inbox is updated too.', { icon: 'CircleCheck' }); }
      if (c.key === 'ot') { decide(['ap3']); addLog('Approved overtime spike at ' + topOtSite(P).name, 'Timer', 'green'); PO.toast('Overtime approved for this run'); }
      if (c.key === 'bank') {
        const j = joinerOf(P);
        setPc((x) => ({ ...(x || {}), bank: true }));
        if (P.id === 'in' && j) setAction(j.id, 'hold', 'Bank details missing');
        else if (P.id === 'us' && j) setAction(j.id, 'outside', 'Paper check, IRS default withholding');
        else addLog(P.checks.bank.done, 'Landmark', 'green');
        PO.toast(P.checks.bank.done, { action: { label: 'Undo', run: () => { setPc((x) => ({ ...(x || {}), bank: false })); if (j) setActions((x) => { const n = { ...(x || {}) }; delete n[j.id]; return n; }); } } });
      }
      if (c.key === 'rule') PO.go('compliance');
    };
    const ackRule = () => { setPc((x) => ({ ...(x || {}), rule: true })); addLog('Compliance flag acknowledged: paying as-is this period', 'Scale', 'amber'); PO.toast('Noted. The fix is scheduled from the next run and logged in the audit trail.'); };
    return { P, state, actions, reasons, setAction, adj, setAdj, log, addLog, pc, setPc, dec, decide, lock, setLock, t, checks, fix, ackRule };
  }
  const topOtSite = (P) => PO.site(SPIKE[P.id]);

  /* ================= page ================= */
  function Payroll({ query = {} }) {
    const R = useRun();
    const { P, lock, t } = R;
    const [step, setStep] = PO.useCoState('payroll.step', 0);
    const [seen, setSeen] = PO.useCoState('payroll.seen', 0);
    const [cal, setCal] = useState(query.open === 'calendar');
    const [off, setOff] = useState(query.open === 'offcycle');
    const [lockOpen, setLockOpen] = useState(query.open === 'lock');
    const [paidAsk, setPaidAsk] = useState(false);
    const [unlock, setUnlock] = useState(false);
    PO.useEffect(() => { if (query.step != null && +query.step >= 0 && +query.step < 6) { setStep(+query.step); setSeen(Math.max(seen, +query.step)); } }, []);
    const go = (i) => { setStep(i); setSeen(Math.max(seen, i)); window.scrollTo(0, 0); };
    const open = R.checks.filter((c) => !c.done);
    const C = P.company;
    const per = PO.payx.PERIOD[P.id];
    const status = lock.status || 'Draft';
    const runId = P.payHistory[P.payHistory.length - 1].id;
    const release = () => { R.setLock({ ...lock, released: true }); R.addLog(`Released payslips to ${t.heads} people in the employee portal, with email and SMS alerts`, 'Send', 'green'); PO.toast('Payslips published to the employee portal. Email and SMS alerts sent.', { icon: 'Send' }); };
    const more = html`<${Menu} align="right" width=${240} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More actions" />`} items=${[
      { label: 'Payroll calendar', icon: 'CalendarRange', onClick: () => setCal(true) },
      status === 'Draft' ? null : { label: 'Off-cycle run', icon: 'Zap', onClick: () => setOff(true) },
      { label: 'Preview a payslip', icon: 'ReceiptText', onClick: () => PO.go('payslips/' + P.hero.id) },
      { label: 'Export payroll register', icon: 'FileSpreadsheet', onClick: () => exportRegister(P, R.actions) },
      { label: 'Variance report vs last run', icon: 'GitCompareArrows', onClick: () => PO.fakeDownload('Variance report (PDF)') },
      status === 'Locked' ? '-' : null,
      status === 'Locked' ? { label: 'Unlock payroll', icon: 'LockOpen', danger: true, onClick: () => setUnlock(true) } : null,
      '-',
      { label: 'Payroll history', icon: 'History', onClick: () => PO.go('payslips') },
      { label: 'Payroll settings', icon: 'Settings2', onClick: () => PO.go('settings/payroll') },
    ]} />`;
    const actions = status === 'Draft'
      ? html`<${Button} onClick=${() => setOff(true)}>Off-cycle run</${Button}>${more}`
      : status === 'Locked'
        ? html`<${Button} icon="Download" onClick=${() => PO.fakeDownload(`All ${P.files.length} files (ZIP)`)}>Download files</${Button}>${lock.released ? html`<${Button} kind="primary" onClick=${() => setPaidAsk(true)}>Mark as paid</${Button}>` : html`<${Button} kind="primary" icon="Send" onClick=${release}>Release payslips</${Button}>`}${more}`
        : html`<${Button} icon="Download" onClick=${() => PO.fakeDownload(`All ${P.files.length} files (ZIP)`)}>Download files</${Button}>${more}`;
    const head = html`<header class="ph"><div class="ph-title">
        <div class="pr-title"><h1>${P.id === 'in' ? C.period + ' payroll' : 'Payroll, ' + C.period}</h1><${PO.Status} s=${status} /></div>
        <p class="tnum">${C.cadence} run ${runId} for ${PO.date(per.from, { short: true })} – ${PO.date(per.to)}, paid by ${C.payBy}. ${PO.plural(t.heads, 'person', 'people')}${t.voidN ? `, ${t.voidN} voided` : ''}.</p>
      </div><div class="ph-actions">${actions}</div></header>`;
    const steps = P.steps.map(([s, sub], i) => [s, i === 5 && open.length ? `${open.length} check${open.length > 1 ? 's' : ''} open` : sub]);
    return html`${head}
      ${status === 'Draft' ? html`
        <${PO.Steps} steps=${steps} current=${step} done=${Math.max(seen, step)} onPick=${go} />
        <div class="grid g-main" style="align-items:start;margin-top:24px">
          <section class="card" style="overflow:hidden">
            <div class="card-h" style="padding-bottom:12px;border-bottom:1px solid var(--border)"><${PO.Chip} icon=${STEP_IC[step][0]} accent=${STEP_IC[step][1]} /><h3>${P.steps[step][0]}</h3><span class="sub">Step ${step + 1} of 6: ${P.steps[step][1]}</span></div>
            <${StepBody} step=${step} R=${R} go=${go} />
            <div class="pr-foot">
              ${step > 0 ? html`<${Button} icon="ArrowLeft" onClick=${() => go(step - 1)}>Back</${Button}>` : null}
              <span class="faint t-sm">Autosaved ${P.hhmm(C.nowMin)}</span>
              <span class="right row">
                ${step < 5 ? html`<${Button} iconRight="ArrowRight" onClick=${() => go(step + 1)}>Continue to ${P.steps[step + 1][0].toLowerCase()}</${Button}>`
                  : html`<${Button} kind="primary" icon="Lock" disabled=${open.length > 0} onClick=${() => setLockOpen(true)}>${open.length ? `Resolve ${open.length} check${open.length > 1 ? 's' : ''} to lock` : 'Lock & approve'}</${Button}>`}
              </span>
            </div>
          </section>
          <${Rail} R=${R} go=${go} step=${step} onLock=${() => setLockOpen(true)} />
        </div>` : html`<${Locked} R=${R} />`}
      <${LockModal} open=${lockOpen} R=${R} onClose=${() => setLockOpen(false)} />
      <${UnlockModal} open=${unlock} R=${R} onClose=${() => setUnlock(false)} />
      <${PaidModal} open=${paidAsk} R=${R} onClose=${() => setPaidAsk(false)} />
      <${CalendarDrawer} open=${cal} onClose=${() => setCal(false)} P=${P} />
      <${OffCycleDrawer} open=${off} onClose=${() => setOff(false)} R=${R} />`;
  }

  function exportRegister(P, actions = {}) {
    const lines = [...new Set(P.people.flatMap((p) => [...p.pay.earn, ...p.pay.ded].map((l) => l.k)))];
    const label = (k) => (P.people.flatMap((p) => [...p.pay.earn, ...p.pay.ded]).find((l) => l.k === k).label || k).replace(/\s*\(.*\)/, '');
    PO.exportCsv('payroll-register-' + P.company.period.replace(/\W+/g, '-').toLowerCase(), [
      ['Employee ID', 'Name', 'Site', 'Action', P.unitWords.work, ...lines.map(label), 'Gross', 'Deductions', 'Net', 'Employer contributions'],
      ...P.people.map((p) => [p.id, p.name, PO.site(p.site).name, actLabel[actions[p.id] || 'process'], p.pay.work, ...lines.map((k) => ([...p.pay.earn, ...p.pay.ded].find((l) => l.k === k) || {}).amt || 0), p.pay.gross, p.pay.dedTotal, p.pay.net, p.pay.erTotal]),
    ]);
  }

  function StepBody({ step, R, go }) {
    const B = [StepAttendance, StepJoiners, StepOT, StepMoney, StepHolds, StepStatutory][step];
    return html`<${B} R=${R} go=${go} />`;
  }

  /* ---------- step 1: attendance ---------- */
  function StepAttendance({ R }) {
    const { P, dec } = R;
    const [site, setSite] = useState('');
    const W = P.unitWords;
    const bySite = useMemo(() => P.sites.map((s) => { const ps = P.people.filter((p) => p.site === s.id); return { s, n: ps.length, work: sum(ps, (p) => p.pay.work), unpaid: sum(ps, (p) => p.pay.unpaid), lop: ps.filter((p) => p.pay.unpaid > 0).length, ot: sum(ps, (p) => p.pay.otHours), missed: ps.filter((p) => p.missed).length }; }), [P.id]);
    const offH = (p) => (P.id === 'us' ? p.u.pto || 0 : P.id === 'uk' ? p.u.hol || 0 : 0);
    const missedAp = (p) => P.approvals.find((a) => a.kind === 'Missed punch' && a.who === p.id);
    const rows = site ? P.people.filter((p) => p.site === site) : P.people;
    const pend = P.approvals.filter((a) => a.kind === 'Missed punch' && !dec[a.id]);
    return html`
      <${Sec} flush title="By site" meta=${site ? html`Filtered to ${PO.site(site).name}. <a class="link" onClick=${() => setSite('')}>Show all</a>` : 'Select a site to filter the people below'}>
        <div class="table-wrap"><table class="tbl compact">
          <thead><tr><th>Site</th><th class="r">People</th><th class="r">${W.work}</th><th class="r">${P.id === 'in' ? 'LOP days' : 'People with LOP'}</th><th class="r">OT hours</th><th class="r">Missed punches</th></tr></thead>
          <tbody>${bySite.map((r) => html`<tr class=${'clickable pr-site-row ' + (site === r.s.id ? 'on' : '')} onClick=${() => setSite(site === r.s.id ? '' : r.s.id)}>
            <td class="w-500">${r.s.name}</td><td class="r tnum">${r.n}</td><td class="r tnum">${PO.num(r.work)}</td><td class="r tnum">${P.id === 'in' ? (r.unpaid || html`<${Dash} />`) : r.lop || html`<${Dash} />`}</td><td class="r tnum">${r.ot ? PO.num(r.ot) : html`<${Dash} />`}</td>
            <td class="r">${r.missed ? html`<${PO.Badge} tone="amber" dot>${r.missed}</${PO.Badge}>` : html`<${Dash} />`}</td></tr>`)}</tbody>
          <tfoot><tr><td>All sites</td><td class="r tnum">${P.people.length}</td><td class="r tnum">${PO.num(sum(bySite, (r) => r.work))}</td><td class="r tnum">${P.id === 'in' ? PO.num(sum(bySite, (r) => r.unpaid)) : bySite.reduce((x, r) => x + r.lop, 0)}</td><td class="r tnum">${PO.num(sum(bySite, (r) => r.ot))}</td><td class="r tnum">${pend.length ? pend.length + ' open' : 'None open'}</td></tr></tfoot>
        </table></div>
      </${Sec}>
      <${Sec} flush>
        <${DataTable} bare rows=${rows} compact pageSize=${10} exportName="attendance-for-payroll" search=${(p) => p.name + ' ' + p.id}
          filters=${[{ key: 'f', label: 'Show', options: [['lop', P.id === 'in' ? 'Loss of pay' : 'Short hours'], ['missed', 'Missed punch'], ['ot', 'Has overtime']], test: (p, v) => (v === 'lop' ? (P.id === 'in' ? p.pay.unpaid > 0 : p.pay.work < (P.id === 'us' ? 80 : 160)) : v === 'missed' ? !!p.missed : p.pay.otHours > 0) }]}
          columns=${[
            { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} sub=${p.id + ', ' + PO.site(p.site).name} size="sm" />`, sort: (p) => p.name },
            P.id === 'in' ? { key: 'days', label: 'Days', align: 'r', render: () => html`<span class="faint tnum">${W.days}</span>`, sort: () => W.days, csv: () => W.days } : null,
            { key: 'work', label: W.work, align: 'r', render: (p) => html`<span class="tnum w-500">${PO.num(p.pay.work)}</span>`, sort: (p) => p.pay.work },
            P.id === 'in' ? { key: 'unpaid', label: 'LOP', align: 'r', render: (p) => (p.pay.unpaid ? html`<span class="tnum" style="color:var(--amber)">${p.pay.unpaid}</span>` : html`<${Dash} />`), sort: (p) => p.pay.unpaid }
              : { key: 'off', label: P.id === 'us' ? 'PTO h' : 'Holiday h', align: 'r', render: (p) => (offH(p) ? html`<span class="tnum">${offH(p)}</span>` : html`<${Dash} />`), sort: offH },
            { key: 'ot', label: 'OT h', align: 'r', render: (p) => (p.pay.otHours ? html`<span class="tnum">${p.pay.otHours}</span>` : html`<${Dash} />`), sort: (p) => p.pay.otHours },
            { key: 'flag', label: 'Flags', render: (p) => { const ap = missedAp(p); return html`<span class="row" style="gap:6px">${ap ? (dec[ap.id] ? html`<${PO.Status} s=${dec[ap.id] === 'approved' ? 'Approved' : 'Rejected'} />` : html`<${Badge} tone="amber" dot>Missed ${p.missed}</${Badge}><span onClick=${(e) => e.stopPropagation()}><${Button} size="sm" onClick=${() => { R.decide([ap.id]); R.addLog(`Approved missed punch for ${p.name}`, 'Fingerprint', 'green'); PO.toast(`${ap.ask} for ${p.first}`); }}>Approve</${Button}></span>`) : null}${p.joiner ? html`<span class="faint t-sm">Joined ${PO.date(p.joinedIso, { short: true })}</span>` : null}</span>`; }, sort: (p) => (p.missed ? 0 : 1), csv: (p) => p.missed || '' },
            { key: 'gross', label: 'Gross', align: 'r', render: (p) => html`<span class="tnum">${fine(p.pay.gross)}</span>`, sort: (p) => p.pay.gross },
          ].filter(Boolean)}
          onRow=${(p) => PO.go('payslips/' + p.id)} />
      </${Sec}>
      <div class="pr-note">${P.id === 'in' ? 'Paid days come from the muster: biometric, kiosk and portal punches, approved leave and holidays. Loss of pay is deducted pro rata from basic, HRA and special allowance.' : 'Hours come from clock-ins and approved time off. Missed punches must be decided before this step is final.'}</div>`;
  }

  /* ---------- step 2: joiners & exits ---------- */
  function StepJoiners({ R }) {
    const { P, pc } = R;
    const [fnf, setFnf] = useState(null);
    const [paidFnf, setPaidFnf] = PO.useCoState('payroll.fnfPaid', {});
    const joiners = P.people.filter((p) => p.joiner);
    const j0 = P.joiners[0], j1 = P.joiners[1];
    const regLabel = P.id === 'in' ? ['UAN', 'ESIC IP', 'Bank'] : P.id === 'us' ? ['Form I-9', 'Form W-4', 'Direct deposit'] : ['Right to work', 'Starter checklist', 'P45'];
    const regVal = (p) => P.id === 'in' ? [['Generated', 'green'], [p.pay.ded.some((l) => l.k === 'esi') ? 'Registered' : 'Not eligible', p.pay.ded.some((l) => l.k === 'esi') ? 'green' : 'slate'], p.bank.status === 'missing' ? ['Missing', 'red'] : ['Verified', 'green']]
      : P.id === 'us' ? [['Verified', 'green'], ['Missing', 'red'], ['Missing', 'red']] : [['Share code checked', 'green'], ['Statement A', 'green'], ['Missing', 'amber']];
    return html`
      <${Sec} flush title=${`New ${P.id === 'uk' ? 'starters' : P.id === 'us' ? 'hires' : 'joiners'}`} meta=${`${joiners.length}, prorated from their start date`}>
        <table class="tbl"><thead><tr><th>Person</th>${regLabel.map((l) => html`<th>${l}</th>`)}<th class="r">Gross</th><th class="r"></th></tr></thead>
        <tbody>${joiners.map((p) => html`<tr>
          <td><${Who} p=${p} size="sm" sub=${`Started ${PO.date(p.joinedIso, { short: true })}, ${p.pay.work} ${P.unitWords.work.toLowerCase()}`} /></td>
          ${regVal(p).map(([v, tone]) => html`<td>${tone === 'green' ? html`<span class="t-sm muted">${v}</span>` : html`<${Badge} tone=${tone} dot>${v}</${Badge}>`}</td>`)}
          <td class="r tnum">${fine(p.pay.gross)}</td>
          <td class="r">${pc.bank ? html`<span class="t-sm muted">${j0.hold}</span>` : html`<${Button} size="sm" onClick=${() => R.fix(R.checks[2])}>${P.checks.bank.fix}</${Button}>`}</td>
        </tr>`)}</tbody></table>
      </${Sec}>
      <${Sec} flush title=${P.id === 'in' ? 'Exits and full & final' : P.id === 'us' ? 'Terminations and final pay' : 'Leavers and final pay'} meta=${`${P.exits.length}, ${P.id === 'in' ? 'Code on Wages: F&F within 2 working days' : P.id === 'us' ? 'Texas Payday Law' : 'P45 issued with final pay'}`}>
        <table class="tbl"><thead><tr><th>Person</th><th>Reason</th><th>Last day</th><th class="r">Settlement</th><th>Status</th></tr></thead>
        <tbody>${P.exits.map((x) => { const paid = paidFnf[x.id]; return html`<tr class="clickable" onClick=${() => setFnf(x)}>
          <td><${Who} name=${x.name} size="sm" sub=${x.why} link=${false} /></td>
          <td class="t-sm">${x.reason}</td>
          <td class="tnum t-sm">${PO.date(x.lastDay, { short: true })}</td>
          <td class="r tnum w-500">${fine(x.settlement)}</td>
          <td>${paid ? html`<${PO.Status} s="Paid" />` : x.lastDay < PO.TODAY ? html`<${Badge} tone="red" dot>${P.id === 'in' ? 'F&F due' : 'Final pay due'}</${Badge}>` : html`<${PO.Status} s="Serving notice" />`}</td>
        </tr>`; })}</tbody></table>
      </${Sec}>
      <div class="pr-note">${j1.text}. Final settlements are paid as off-cycle runs so they don’t wait for payday.</div>
      <${FnfDrawer} x=${fnf} onClose=${() => setFnf(null)} paid=${fnf && paidFnf[fnf.id]} onPay=${(x) => { setPaidFnf({ ...paidFnf, [x.id]: true }); R.addLog(`Paid ${P.id === 'in' ? 'full & final' : 'final pay'} to ${x.name} off-cycle`, 'Zap', 'green'); PO.toast(`${x.name}: ${fine(x.settlement)} sent as an off-cycle payment`); setFnf(null); }} />`;
  }
  function fnfLines(P, x) {
    const s = x.settlement;
    const parts = P.id === 'in'
      ? [['Salary for days worked', 0.31], ['Earned leave encashment', 0.38], ['Statutory bonus, pro rata', 0.22], ['Overtime arrears', 0.14], ['Notice shortfall recovery', -0.03], ['Uniform not returned', -0.02]]
      : P.id === 'us' ? [['Final hours', 0.82], ['Card tips owed', 0.12], ['Accrued PTO payout (policy)', 0.18], ['Federal tax and FICA', -0.12]]
        : [['Final hours', 0.86], ['Holiday owed, 2.5 days', 0.26], ['PAYE and NI', -0.1], ['Pension', -0.02]];
    let acc = 0;
    return parts.map(([l, f], i) => { const v = i === parts.length - 1 ? c2(s - acc) : P.id === 'in' ? Math.round(s * f) : c2(s * f); acc = c2(acc + v); return [l, v]; });
  }
  function FnfDrawer({ x, onClose, onPay, paid }) {
    const P = PO.P();
    if (!x) return null;
    const lines = fnfLines(P, x);
    return html`<${Drawer} open title=${`${P.id === 'in' ? 'Full & final' : 'Final pay'}: ${x.name}`} sub=${`${x.reason}, last day ${PO.date(x.lastDay)}`} onClose=${onClose}
      footer=${html`<${Button} icon="Download" onClick=${() => PO.fakeDownload(`${P.id === 'in' ? 'F&F statement' : 'Final pay statement'}, ${x.name}`)}>Statement</${Button}>${paid ? html`<${PO.Status} s="Paid" />` : html`<${Button} kind="primary" onClick=${() => onPay(x)}>Pay ${fine(x.settlement)} now</${Button}>`}`}>
      <div class="col" style="gap:16px">
        <div><div class="faint t-sm">Settlement amount</div><div class="hero-num">${fine(x.settlement)}</div><div class="faint t-sm mt-4">${P.id === 'in' ? 'Due within 2 working days of the last day (Code on Wages, 2025)' : P.id === 'us' ? 'Resigned: due by the next regular payday under the Texas Payday Law' : 'Paid on the next payday with a P45 parts 1A, 2 and 3'}</div></div>
        <div class="card" style="overflow:hidden"><table class="tbl compact"><tbody>${lines.map(([l, v]) => html`<tr><td>${l}</td><td class="r tnum">${v < 0 ? '−' : ''}${fine(Math.abs(v))}</td></tr>`)}</tbody><tfoot><tr><td>Net settlement</td><td class="r tnum">${fine(x.settlement)}</td></tr></tfoot></table></div>
        <div><div class="t-sm w-600" style="margin-bottom:4px">Exit checklist</div><${PO.Checklist} items=${x.tasks.map((t) => ({ t: t.t, done: t.done }))} /></div>
      </div>
    </${Drawer}>`;
  }

  /* ---------- step 3: overtime & allowances ---------- */
  function StepOT({ R }) {
    const { P, dec } = R;
    const spike = topOtSite(P);
    const W = P.unitWords;
    const rows = useMemo(() => P.sites.map((s) => {
      const ps = P.people.filter((p) => p.site === s.id);
      const prev = ps.reduce((t, p) => { const q = PO.payx.prevPay(P, p); return t + (q ? q.otPay : 0); }, 0);
      return { s, ot: sum(ps, (p) => p.pay.otHours), otPay: sum(ps, (p) => p.pay.otPay), extra: sum(ps, (p) => p.pay.extra), n: ps.filter((p) => p.pay.otHours).length, prev: c2(prev) };
    }), [P.id]);
    const people = P.people.filter((p) => p.pay.otHours || p.pay.extra);
    const rate = (p) => (P.id === 'in' ? P.roles[p.role].ot : c2(P.roles[p.role].rate * 1.5));
    const approved = dec.ap3;
    return html`
      ${!approved ? html`<div class="pr-sec"><div class="pr-ask"><span class="dot"></span><div class="grow"><b class="w-550">${P.checks.ot.title}</b><div class="faint t-sm">${P.checks.ot.text}</div></div>
        <${Button} size="sm" onClick=${() => { R.decide(['ap3'], 'rejected'); R.addLog('Rejected overtime spike, capped at last period', 'Timer', 'red'); }}>Reject</${Button}><${Button} size="sm" onClick=${() => R.fix(R.checks[1])}>Approve</${Button}></div></div>` : null}
      <${Sec} flush title="By site" meta=${approved ? (approved === 'approved' ? `Spike at ${spike.name} approved, paid at the statutory rate` : 'Spike rejected: hours above last period are excluded') : `Compared with ${PO.payx.PERIOD[P.id].prev}`}>
        <div class="table-wrap"><table class="tbl compact">
          <thead><tr><th>Site</th><th class="r">People with OT</th><th class="r">OT hours</th><th class="r">OT pay</th><th class="r">Last period</th><th class="r">Change</th><th class="r">${W.extra}</th></tr></thead>
          <tbody>${rows.map((r) => { const ch = pctChange(r.otPay, r.prev); const hot = r.s.id === spike.id; return html`<tr><td><span class="row" style="gap:6px">${r.s.name}${hot && !approved ? html`<${Badge} tone="amber" dot>Spike</${Badge}>` : null}</span></td><td class="r tnum">${r.n}</td><td class="r tnum">${PO.num(r.ot)}</td><td class="r tnum">${fine(r.otPay)}</td><td class="r tnum faint">${fine(r.prev)}</td><td class="r tnum" style=${hot && ch > 0.2 ? 'color:var(--amber)' : 'color:var(--text-2)'}>${r.prev ? pctTxt(ch) : 'New'}</td><td class="r tnum">${fine(r.extra)}</td></tr>`; })}</tbody>
          <tfoot><tr><td>Total</td><td class="r tnum">${rows.reduce((t, r) => t + r.n, 0)}</td><td class="r tnum">${PO.num(sum(rows, (r) => r.ot))}</td><td class="r tnum">${fine(sum(rows, (r) => r.otPay))}</td><td class="r tnum">${fine(sum(rows, (r) => r.prev))}</td><td></td><td class="r tnum">${fine(sum(rows, (r) => r.extra))}</td></tr></tfoot>
        </table></div>
      </${Sec}>
      <${Sec} flush title="People" meta=${`${people.length} with overtime or ${W.extra.toLowerCase()}`}>
        <${DataTable} bare rows=${people} compact pageSize=${8} exportName="overtime-and-allowances" search=${(p) => p.name}
          filters=${[{ key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (p, v) => p.site === v }]}
          initialSort=${{ key: 'otPay', dir: 'desc' }}
          columns=${[
            { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} size="sm" sub=${PO.site(p.site).name} />`, sort: (p) => p.name },
            { key: 'ot', label: 'OT hours', align: 'r', render: (p) => html`<span class="tnum">${PO.num(p.pay.otHours)}</span>`, sort: (p) => p.pay.otHours },
            { key: 'rate', label: P.id === 'in' ? 'Rate (2× hourly)' : 'Rate (1.5×)', align: 'r', render: (p) => html`<span class="tnum">${p.pay.otHours ? fine(rate(p)) : '–'}</span>`, sort: rate },
            { key: 'otPay', label: 'OT pay', align: 'r', render: (p) => html`<span class="tnum w-500">${fine(p.pay.otPay)}</span>`, sort: (p) => p.pay.otPay },
            { key: 'extra', label: W.extra, align: 'r', render: (p) => (p.pay.extra ? html`<span class="tnum">${fine(p.pay.extra)}</span>` : html`<${Dash} />`), sort: (p) => p.pay.extra },
            { key: 'st', label: 'Approval', render: (p) => (p.site === spike.id && p.pay.otHours ? html`<${PO.Status} s=${approved === 'approved' ? 'Approved' : approved ? 'Rejected' : 'Pending'} />` : p.pay.otHours ? html`<span class="t-sm muted">Approved</span>` : html`<span class="faint t-sm">Allowance</span>`), sort: false },
          ]} onRow=${(p) => PO.go('payslips/' + p.id)} />
      </${Sec}>`;
  }

  /* ---------- step 4: reimbursements & advances ---------- */
  function StepMoney({ R }) {
    const { P, state, dec } = R;
    const rb = PO.payx.reimbursements(P, state);
    const rc = PO.payx.recoveries(P, state);
    const mode = PO.coGet(state, 'expenses.mode', 'payroll');
    const pendingMoney = P.money.filter(([id]) => !dec[id]);
    const List = ({ items, sign }) => html`<div style="max-height:264px;overflow:auto"><table class="tbl compact"><tbody>${items.map((x) => html`<tr><td><${PersonCell} id=${x.who} sub=${x.label} /></td><td class="r tnum">${sign}${fine(x.amt)}</td></tr>`)}</tbody></table></div>`;
    return html`
      ${pendingMoney.length ? html`<${Sec} flush title="Waiting for a decision" meta=${PO.plural(pendingMoney.length, 'request')}>
        <table class="tbl"><tbody>${P.money.map(([id, t, d, a]) => html`<tr><td><b class="w-550">${t}</b><div class="faint t-sm">${d}</div></td><td class="r tnum w-500">${fine(a)}</td>
          <td class="r" style="width:180px">${dec[id] ? html`<${PO.Status} s=${dec[id] === 'approved' ? 'Approved' : 'Rejected'} />` : html`<span class="row" style="gap:6px;justify-content:flex-end"><${Button} size="sm" kind="ghost" onClick=${() => { R.decide([id], 'rejected'); R.addLog(`Rejected ${t}`, 'CircleX', 'red'); }}>Reject</${Button}><${Button} size="sm" onClick=${() => { R.decide([id]); R.addLog(`Approved ${t}`, 'CircleCheck', 'green'); PO.toast(`${t} approved${id === 'ap7' ? ' and added to this run' : ''}`); }}>Approve</${Button}></span>`}</td></tr>`)}</tbody></table>
      </${Sec}>` : null}
      <${Sec} flush title="Reimbursements" meta=${`${PO.plural(rb.length, 'claim')}, ${mode === 'payroll' ? 'with salary, not taxed' : 'paid instantly, not in this run'}`} actions=${html`<a class="link t-sm" href=${PO.href('expenses')}>Open expenses</a>`}>
        ${rb.length ? html`<${List} items=${rb} sign="+" />` : html`<div class="faint t-sm" style="padding:0 16px 16px">${mode === 'payroll' ? 'Nothing to reimburse. Approved claims appear here.' : 'Claims are paid as soon as they are approved.'}</div>`}
      </${Sec}>
      <${Sec} flush title="Advance recoveries" meta=${`${PO.plural(rc.length, 'instalment')} this run`} actions=${html`<a class="link t-sm" href=${PO.href('expenses?tab=advances')}>Open advances</a>`}>
        ${rc.length ? html`<${List} items=${rc} sign="−" />` : html`<div class="faint t-sm" style="padding:0 16px 16px">No advance is being repaid this period.</div>`}
      </${Sec}>
      <${Sec}>
        <div style="max-width:420px;margin-left:auto">
          <div class="pr-sumrow"><span class="muted">Net pay</span><span class="tnum">${fine(R.t.net)}</span></div>
          <div class="pr-sumrow"><span class="muted">Plus reimbursements</span><span class="tnum">+${fine(R.t.reimb)}</span></div>
          <div class="pr-sumrow"><span class="muted">Less advance recoveries</span><span class="tnum">−${fine(R.t.recov)}</span></div>
          <div class="pr-sumrow big"><span>Total payout</span><span class="tnum">${fine(R.t.payout)}</span></div>
        </div>
      </${Sec}>`;
  }

  /* ---------- step 5: holds & arrears ---------- */
  function StepHolds({ R }) {
    const { P, actions, reasons } = R;
    const [ask, setAsk] = useState(null); // {ids, a}
    const [reason, setReason] = useState('');
    const [adjOpen, setAdjOpen] = useState(false);
    const held = P.people.filter((p) => actions[p.id] && actions[p.id] !== 'process');
    const apply = (ids, a, why) => { ids.forEach((id) => R.setAction(id, a, why)); PO.toast(`${PO.plural(ids.length, 'person', 'people')} set to ${actLabel[a].toLowerCase()}`, { icon: actIcon[a] }); };
    const choose = (ids, a) => (a === 'process' ? apply(ids, a, '') : (setAsk({ ids, a }), setReason(a === 'hold' ? 'Bank details pending' : a === 'void' ? 'Duplicate record' : P.id === 'us' ? 'Paid by paper check' : 'Paid in cash at site')));
    const ActBtn = ({ p }) => { const a = actions[p.id] || 'process'; return html`<span onClick=${(e) => e.stopPropagation()}><${Menu} align="right" width=${200} trigger=${html`<button class=${'pr-act ' + a}>${actLabel[a]}<${Icon} n="ChevronDown" size=${11} /></button>`} items=${Object.keys(actLabel).map((k) => ({ label: actLabel[k], checked: a === k, hint: k === 'hold' ? 'Pay later' : k === 'void' ? 'Not in run' : k === 'outside' ? 'Cash / cheque' : '', onClick: () => choose([p.id], k) }))} /></span>`; };
    return html`
      <div class="pr-sec"><${PO.KpiStrip} items=${[
        { label: 'Process by bank', icon: 'Landmark', accent: 'green', value: PO.num(R.t.bankN), unit: '/' + P.people.length, sub: fine(R.t.bank), bar: [{ v: R.t.bankN, k: 'ok', title: 'By bank' }, { v: R.t.heldN, k: 'warn', title: 'On hold' }, { v: R.t.outsideN, k: 'mute', title: 'Paid outside' }, { v: R.t.voidN, k: 'bad', title: 'Voided' }] },
        { label: 'On hold', icon: 'PauseCircle', accent: 'amber', value: PO.num(R.t.heldN), sub: fine(R.t.held), alert: R.t.heldN > 0 },
        { label: 'Paid outside', icon: 'HandCoins', accent: 'blue', value: PO.num(R.t.outsideN), sub: fine(R.t.outside) },
        { label: 'Voided', icon: 'CircleSlash', accent: 'rose', value: PO.num(R.t.voidN), sub: R.t.voidN ? fine(R.t.voidNet) + ' removed' : 'None' },
      ]} /></div>
      ${held.length ? html`<${Sec} flush title="Not paid by bank this run" meta=${PO.plural(held.length, 'person', 'people')}>
        <table class="tbl compact"><tbody>${held.map((p) => html`<tr><td><${PersonCell} id=${p.id} sub=${reasons[p.id] || ''} /></td><td><span class=${'pr-act ' + actions[p.id]} style="cursor:default">${actLabel[actions[p.id]]}</span></td><td class="r tnum">${fine(p.pay.net)}</td><td class="r" style="width:90px"><a class="link t-sm" onClick=${() => apply([p.id], 'process')}>Release</a></td></tr>`)}</tbody></table>
      </${Sec}>` : null}
      <${Sec} flush title="Pay actions" meta="Hold, void or mark as paid outside the bank file">
        <${DataTable} bare rows=${P.people} compact pageSize=${10} selectable exportName="pay-actions" search=${(p) => p.name + ' ' + p.id}
          filters=${[{ key: 'a', label: 'Action', options: Object.entries(actLabel), test: (p, v) => (actions[p.id] || 'process') === v }, { key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (p, v) => p.site === v }]}
          bulk=${(ids, clear) => html`<${Button} size="sm" onClick=${() => { choose(ids, 'hold'); clear(); }}>Hold</${Button}><${Button} size="sm" onClick=${() => { choose(ids, 'outside'); clear(); }}>Paid outside</${Button}><${Button} size="sm" onClick=${() => { apply(ids, 'process'); clear(); }}>Process</${Button}>`}
          columns=${[
            { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} size="sm" sub=${p.id + ', ' + PO.site(p.site).name} />`, sort: (p) => p.name },
            { key: 'bank', label: 'Pays into', render: (p) => (p.bank.status === 'missing' ? html`<${Badge} tone="red" dot>No bank account</${Badge}>` : html`<span class="t-sm muted">${p.bank.name} ${p.bank.acct}</span>`), sort: (p) => p.bank.name },
            { key: 'gross', label: 'Gross', align: 'r', render: (p) => html`<span class="tnum">${fine(p.pay.gross)}</span>`, sort: (p) => p.pay.gross },
            { key: 'net', label: 'Net', align: 'r', render: (p) => html`<span class="tnum w-500">${fine(p.pay.net)}</span>`, sort: (p) => p.pay.net },
            { key: 'act', label: 'Pay action', align: 'r', render: (p) => html`<${ActBtn} p=${p} />`, sort: (p) => actions[p.id] || 'process', csv: (p) => actLabel[actions[p.id] || 'process'] },
          ]} />
      </${Sec}>
      <${Sec} flush title=${P.id === 'in' ? 'Arrears & one-time adjustments' : 'One-time adjustments'} meta=${R.adj.length ? PO.plural(R.adj.length, 'adjustment') : 'None this period'} actions=${html`<${Button} size="sm" icon="Plus" onClick=${() => setAdjOpen(true)}>Add adjustment</${Button}>`}>
        ${R.adj.length ? html`<table class="tbl compact"><tbody>${R.adj.map((a, i) => html`<tr><td><${PersonCell} id=${a.who} sub=${`${a.kind}${a.note ? ', ' + a.note : ''}`} /></td><td class="r tnum">${a.amt < 0 ? '−' : '+'}${fine(Math.abs(a.amt))}</td><td class="r" style="width:48px"><${PO.IconButton} icon="Trash2" size="sm" title="Remove" onClick=${() => { R.setAdj(R.adj.filter((_, k) => k !== i)); R.addLog(`Removed ${a.kind.toLowerCase()} for ${PO.person(a.who).name}`, 'Trash2'); }} /></td></tr>`)}</tbody></table>`
          : html`<div class="faint t-sm" style="padding:0 16px 16px">${P.id === 'in' ? 'Back pay, a one-time bonus or a recovery is added to this run and shows on the payslip.' : 'Back pay, a bonus or a recovery is added to this run and shows on the pay stub.'}</div>`}
      </${Sec}>
      <${Modal} open=${!!ask} title=${ask ? `${actLabel[ask.a]} ${ask.ids.length === 1 ? PO.person(ask.ids[0]).name : PO.plural(ask.ids.length, 'person', 'people')}` : ''} onClose=${() => setAsk(null)}
        footer=${html`<${Button} onClick=${() => setAsk(null)}>Cancel</${Button}><${Button} kind=${ask && ask.a === 'void' ? 'danger solid' : 'primary'} disabled=${!reason.trim()} onClick=${() => { apply(ask.ids, ask.a, reason.trim()); setAsk(null); }}>${ask ? actLabel[ask.a] : ''}</${Button}>`}>
        ${ask ? html`<p style="margin-bottom:12px">${ask.a === 'hold' ? 'Pay is calculated and statutory deductions are filed, but the money is not sent until you release it.' : ask.a === 'void' ? 'This removes them from the run: no payslip, no statutory deductions, no bank transfer.' : 'They get a payslip and deductions are filed, but they are left out of the bank file.'}</p>
          <${Field} label="Reason (kept in the audit trail)"><input class="input" value=${reason} onInput=${(e) => setReason(e.target.value)} /></${Field}>` : null}
      </${Modal}>
      <${AdjDrawer} open=${adjOpen} onClose=${() => setAdjOpen(false)} onAdd=${(a) => { R.setAdj([...R.adj, a]); R.addLog(`${a.kind} of ${fine(Math.abs(a.amt))} for ${PO.person(a.who).name}`, 'FilePlus2'); PO.toast(`${a.kind} added to this run`); setAdjOpen(false); }} />`;
  }
  function AdjDrawer({ open, onClose, onAdd }) {
    const P = PO.P();
    const [who, setWho] = useState(P.hero.id);
    const [kind, setKind] = useState('Arrears');
    const [amt, setAmt] = useState(P.id === 'in' ? '1200' : '45.00');
    const [note, setNote] = useState(P.id === 'in' ? 'August night allowance missed' : 'Missed shift premium, last period');
    const v = Math.abs(parseFloat(amt) || 0);
    return html`<${Drawer} open=${open} title="Add an adjustment" sub=${'Applies to ' + P.company.period} size="sm" onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!v} onClick=${() => onAdd({ who, kind, amt: kind === 'Recovery' ? -v : v, note })}>Add to run</${Button}>`}>
      <div class="col" style="gap:16px">
        <${Field} label="Employee"><${Select} value=${who} onChange=${setWho} options=${P.people.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => [p.id, `${p.name}, ${p.id}`])} /></${Field}>
        <${Field} label="Type"><${Segmented} value=${kind} onChange=${setKind} options=${[['Arrears', 'Arrears'], ['Bonus', 'Bonus'], ['Recovery', 'Recovery']]} /></${Field}>
        <${Field} label="Amount" hint=${kind === 'Recovery' ? 'Deducted from net pay' : 'Added to gross and net pay'}><input class="input tnum" value=${amt} onInput=${(e) => setAmt(e.target.value)} /></${Field}>
        <${Field} label="Note on the payslip" hint=${P.id === 'in' ? 'Arrears are taxed in the month paid. PF applies to basic arrears only.' : P.id === 'us' ? 'Bonuses use the 22% federal supplemental rate when paid separately.' : 'Bonuses are taxed through PAYE on the normal tax code.'}><input class="input" value=${note} onInput=${(e) => setNote(e.target.value)} /></${Field}>
      </div>
    </${Drawer}>`;
  }

  /* ---------- step 6: statutory & approve ---------- */
  function statRows(P, t) {
    const rows = P.statutory.map(([l, e, r]) => ({ label: l, ee: t.keys[e] || 0, er: r ? t.keys[r] || 0 : 0, hasEr: !!r, k: e }));
    const eeStat = sum(rows, (r) => r.ee), erStat = sum(rows, (r) => r.er);
    const otherEe = c2(t.dedTotal - eeStat), otherEr = c2(t.erTotal - erStat);
    if (Math.abs(otherEe) >= 0.01 || Math.abs(otherEr) >= 0.01) rows.push({ label: P.id === 'uk' ? 'Other deductions (uniform, recoveries)' : 'Other deductions and recoveries', ee: otherEe, er: otherEr, hasEr: Math.abs(otherEr) >= 0.01, k: null });
    return rows;
  }
  function StepStatutory({ R }) {
    const { P, t, checks } = R;
    const rows = statRows(P, t);
    const due = PO.payx.calendar[P.id].due;
    const dueOf = (k) => due.find((d) => d[3] === k);
    const open = checks.filter((c) => !c.done);
    const approver = P.byId[P.topId];
    const H = P.payHistory, prev = H[H.length - 2];
    const movers = useMemo(() => P.people.map((p) => { const q = PO.payx.prevPay(P, p); return { p, d: q ? c2(p.pay.net - q.net) : p.pay.net, isNew: !q }; }).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5), [P.id]);
    const why = (p) => { const w = PO.payx.whyLines(P, p).slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0]; return w ? w.label : 'No change'; };
    return html`
      <${Sec} flush title="Statutory deductions and contributions" meta=${`Filed from ${P.company.period}`}>
        <div class="table-wrap"><table class="tbl compact">
          <thead><tr><th>Item</th><th class="r">Employee</th><th class="r">Employer</th><th class="r">Total</th><th>Due</th></tr></thead>
          <tbody>${rows.map((r) => { const d = r.k ? dueOf(r.k) : null; return html`<tr><td><span class="row" style="gap:10px"><${Auth} l=${(d ? d[1] + ' ' + d[2] + ' ' : '') + r.label} />${r.label}</span></td><td class="r tnum">${fine(r.ee)}</td><td class="r tnum">${r.hasEr ? fine(r.er) : html`<${Dash} />`}</td><td class="r tnum w-500">${fine(c2(r.ee + r.er))}</td><td class="t-sm">${d ? html`<span class="tnum">${PO.date(d[0], { short: true })}</span> <span class="faint">${d[2]}</span>` : html`<span class="faint">With payroll</span>`}</td></tr>`; })}</tbody>
          <tfoot><tr><td>Total</td><td class="r tnum">${fine(t.dedTotal)}</td><td class="r tnum">${fine(t.erTotal)}</td><td class="r tnum">${fine(c2(t.dedTotal + t.erTotal))}</td><td></td></tr></tfoot>
        </table></div>
      </${Sec}>
      <${Sec} flush title="Before you lock" meta=${open.length ? `${open.length} open` : 'All checks resolved'}>
        <table class="tbl compact"><tbody>
          ${checks.map((c) => html`<tr><td style="width:40px"><${CkChip} c=${c} /></td><td><span class=${c.done ? 'muted' : 'w-500'}>${c.title}</span>${c.done ? html` <span class="faint t-sm">${c.doneText}</span>` : null}</td>
            <td class="r" style="white-space:nowrap">${c.done ? null : html`${c.key === 'rule' ? html`<a class="link t-sm" style="margin-right:12px" onClick=${R.ackRule}>Pay as-is this period</a>` : null}<a class="link t-sm" onClick=${() => R.fix(c)}>${c.fix}</a>`}</td></tr>`)}
        </tbody></table>
      </${Sec}>
      <${Sec} title="Approval">
        <div class="t-sm" style="display:grid;grid-template-columns:120px 1fr;gap:6px 16px">
          <span class="faint">Prepared by</span><span class="row" style="gap:6px"><${Avatar} name=${P.company.user.name} p=${P.people.find((x) => x.name === P.company.user.name)} size="xs" />${P.company.user.name} <span class="faint">${P.company.user.role}</span></span>
          <span class="faint">Approver</span><span class="row" style="gap:6px"><${Avatar} p=${approver} size="xs" />${approver.name} <span class="faint">${approver.title}, notified when you lock</span></span>
          <span class="faint">On lock</span><span>${P.id === 'in' ? 'Bank file to HDFC, ECR to EPFO' : P.id === 'us' ? 'ACH to Chase, deposit via EFTPS' : 'Bacs to Barclays, FPS to HMRC'}</span>
        </div>
      </${Sec}>
      <${Sec} flush title="Biggest changes in take-home" meta=${`vs ${prev.label}`}>
        <table class="tbl compact"><tbody>${movers.map((m) => html`<tr class="clickable" onClick=${() => PO.go('payslips/' + m.p.id)}><td><${PersonCell} id=${m.p.id} sub=${m.isNew ? 'First payslip' : why(m.p)} /></td><td class="r tnum" style=${m.d < 0 ? 'color:var(--red)' : ''}>${m.d < 0 ? '−' : '+'}${PO.money(Math.abs(m.d), { cents: false })}</td></tr>`)}</tbody></table>
      </${Sec}>`;
  }

  /* ---------- right rail: checks + totals, one card ---------- */
  function Rail({ R, go, onLock, step }) {
    const { P, t, checks } = R;
    const open = checks.filter((c) => !c.done);
    const H = P.payHistory, prev = H[H.length - 2];
    const Tr = ({ l, v, d, cls = '' }) => html`<div class=${'pr-tr ' + cls}><span class=${cls === 'net' ? 'w-600' : 'muted'}>${l}</span><span>${v}</span><span>${d}</span></div>`;
    return html`<aside class="pr-rail"><section class="card">
      <div class="card-h" style="padding-bottom:12px"><${PO.Chip} icon="ListChecks" accent="amber" /><h3>Before you pay</h3><span class="right">${open.length ? html`<${Badge} tone="amber" dot>${open.length} open</${Badge}>` : html`<${Badge} tone="green" dot>All clear</${Badge}>`}</span></div>
      ${checks.map((c) => html`<div class=${'pr-ck ' + (c.done ? 'done' : '')}>
        <${CkChip} c=${c} />
        <div class="grow" style="min-width:0"><a class="t" title=${c.title} onClick=${() => go(c.step)}>${c.title}</a><small>${c.done ? c.doneText : c.text}</small></div>
        ${c.done ? null : html`<${Button} size="sm" onClick=${() => R.fix(c)}>${c.key === 'rule' ? 'Fix' : c.fix}</${Button}>`}
      </div>`)}
      <div class="pr-tot">
        <div class="pr-split" title=${`Employer cost ${fine(t.cost)}`}>${[[t.net, 'var(--brand)'], [t.dedTotal, 'var(--amber-solid)'], [t.erTotal, 'var(--blue-solid)']].map(([v, c]) => html`<i style=${`flex:${v};background:${c}`}></i>`)}</div>
        <div class="pr-legend"><span><i style="background:var(--brand)"></i>Net ${Math.round((t.net / (t.cost || 1)) * 100)}%</span><span><i style="background:var(--amber-solid)"></i>Deductions ${Math.round((t.dedTotal / (t.cost || 1)) * 100)}%</span><span><i style="background:var(--blue-solid)"></i>Employer ${Math.round((t.erTotal / (t.cost || 1)) * 100)}%</span></div>
        <div class="pr-tr" style="padding-top:0"><span class="faint t-xs">This run</span><span></span><span class="faint t-xs" style="font-size:11px">vs ${P.id === 'in' ? PO.payx.PERIOD[P.id].prevShort : 'last'}</span></div>
        <${Tr} l="Gross pay" v=${fine(t.gross)} d=${pctTxt(pctChange(t.gross, prev.gross))} />
        <${Tr} l="Deductions" v=${'−' + fine(t.dedTotal)} d=${pctTxt(pctChange(t.dedTotal, prev.ded))} />
        <${Tr} cls="net" l="Net pay" v=${fine(t.net)} d=${pctTxt(pctChange(t.net, prev.net))} />
        <${Tr} l="Employer contributions" v=${'+' + fine(t.erTotal)} d="" />
        <${Tr} l="Employer cost" v=${html`<span class="w-600">${fine(t.cost)}</span>`} d=${pctTxt(pctChange(t.cost, prev.cost))} />
        ${t.heldN || t.outsideN || t.reimb || t.recov ? html`<${Tr} l=${`Bank transfer to ${t.bankN}`} v=${fine(t.bank)} d="" />` : null}
        ${step < 5 ? html`<${Button} kind="primary" cls="mt-12 pr-full" icon="Lock" disabled=${open.length > 0} onClick=${onLock}>${open.length ? `Resolve ${open.length} check${open.length > 1 ? 's' : ''} to lock` : 'Lock & approve'}</${Button}>`
          : html`<div class="faint t-sm mt-12">${open.length ? 'Resolve the open checks, then lock from the footer.' : 'Ready to lock from the footer.'}</div>`}
      </div>
    </section></aside>`;
  }

  /* ---------- lock modal ---------- */
  function LockModal({ open, onClose, R }) {
    const { P, t } = R;
    const [ok2, setOk2] = useState(true);
    if (!open) return null;
    const figs = P.lockFigs({ ...t.keys, ...t });
    const approver = P.byId[P.topId];
    return html`<${Modal} open title=${`Lock ${P.company.period} payroll?`} onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" icon="Lock" onClick=${() => { R.setLock({ status: 'Locked', lockedAt: nowAt(P, 30), approvedBy: ok2 ? approver.name : null }); R.addLog(`Locked payroll: ${fine(t.net)} net to ${t.heads} people`, 'Lock', 'brand'); if (ok2) R.addLog(`${approver.name} approved`, 'ShieldCheck', 'green'); onClose(); window.scrollTo(0, 0); PO.toast('Payroll locked. Bank and statutory files are ready.', { icon: 'Lock' }); }}>Lock & approve</${Button}>`}>
      <div class="col" style="gap:16px">
        <div>
          <div class="faint t-sm">Net pay</div>
          <div class="hero-num" style="color:var(--text)">${fine(t.net)}</div>
          <div class="muted t-sm mt-4">to ${PO.plural(t.heads, 'person', 'people')}, paid by ${P.company.payBy}</div>
        </div>
        <div>
          <div class="pr-sumrow"><span>Bank transfer to ${t.bankN} people</span><span class="tnum">${fine(t.bank)}</span></div>
          ${t.heldN ? html`<div class="pr-sumrow"><span>Held for ${t.heldN}</span><span class="tnum">${fine(t.held)}</span></div>` : null}
          ${t.outsideN ? html`<div class="pr-sumrow"><span>Paid outside for ${t.outsideN}</span><span class="tnum">${fine(t.outside)}</span></div>` : null}
          <div class="pr-sumrow"><span>Employer cost</span><span class="tnum">${fine(t.cost)}</span></div>
          ${figs.map(([l, v]) => html`<div class="pr-sumrow"><span>${l}</span><span class="tnum">${fine(v)}</span></div>`)}
        </div>
        <label class="check t-sm"><input type="checkbox" checked=${ok2} onChange=${() => setOk2(!ok2)} />Ask ${approver.name} (${approver.title}) to approve</label>
      </div>
    </${Modal}>`;
  }
  function UnlockModal({ open, onClose, R }) {
    const { P, lock, setLock } = R;
    const [why, setWhy] = useState('');
    return html`<${Modal} open=${open} title="Unlock this payroll?" onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="danger solid" disabled=${why.trim().length < 5} onClick=${() => { setLock({ status: 'Draft' }); R.addLog(`Unlocked: ${why.trim()}`, 'LockOpen', 'amber'); onClose(); setWhy(''); PO.toast('Payroll unlocked. Generated files were withdrawn.', { icon: 'LockOpen' }); }}>Unlock</${Button}>`}>
      <p style="margin-bottom:12px">Generated files are withdrawn and ${P.byId[P.topId].first} will need to approve again. ${lock.released ? 'Payslips already sent will be replaced by corrected ones.' : ''}</p>
      <${Field} label="Reason" hint="Required. Saved in the audit trail."><textarea class="textarea" rows="3" placeholder=${P.id === 'in' ? 'e.g. Correct LOP for 2 guards at Kharadi' : 'e.g. Correct overtime hours for 2 people'} value=${why} onInput=${(e) => setWhy(e.target.value)}></textarea></${Field}>
    </${Modal}>`;
  }
  function PaidModal({ open, onClose, R }) {
    const { P, t, lock, setLock } = R;
    return html`<${Modal} open=${open} title="Mark payroll as paid?" onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" onClick=${() => { setLock({ ...lock, status: 'Paid', paidAt: nowAt(P, 40) }); R.addLog(`Marked as paid: bank debited ${fine(t.bank)}`, 'BadgeCheck', 'green'); onClose(); PO.toast('Payroll marked as paid'); }}>Mark as paid</${Button}>`}>
      <p>Confirm that ${P.id === 'in' ? 'HDFC Bank' : P.id === 'us' ? 'Chase' : 'Barclays'} debited <b class="tnum">${fine(t.bank)}</b> for ${t.bankN} transfers. ${t.heldN ? `${t.heldN} held ${t.heldN > 1 ? 'payments stay' : 'payment stays'} on hold.` : ''}</p>
    </${Modal}>`;
  }

  /* ---------- after lock ---------- */
  function Locked({ R }) {
    const { P, t, lock, log } = R;
    const status = lock.status;
    const figs = P.lockFigs({ ...t.keys, ...t });
    const C = P.company;
    const due = PO.payx.calendar[P.id].due;
    const bankRows = useMemo(() => P.people.filter((p) => (R.actions[p.id] || 'process') !== 'void').map((p, i) => ({ p, i: i + 1, a: R.actions[p.id] || 'process', amt: c2(p.pay.net + (t.extra[p.id] || 0)), b: PO.payx.bankOf(P, p) })), [P.id, R.actions]);
    const seedLog = [
      { title: 'Draft created from timesheets and the muster', icon: 'FilePlus2', at: PO.date('2026-10-01', { short: true }) + ', 06:00', by: 'People OS' },
      { title: `Attendance synced for ${P.people.length} people`, icon: 'RefreshCw', at: PO.date('2026-10-05', { short: true }) + ', 18:40', by: 'People OS' },
      { title: 'Recalculated after leave and timesheet approvals', icon: 'Calculator', at: PO.date('2026-10-05', { short: true }) + ', 19:02', by: 'People OS' },
      { title: 'Variance report reviewed', icon: 'GitCompareArrows', at: nowAt(P, -20), by: P.company.user.name },
    ].reverse();
    const mode = P.id === 'in' ? 'NEFT' : P.id === 'us' ? 'ACH' : 'Bacs';
    const done = status === 'Paid' ? 3 : lock.released ? 2 : 1;
    return html`<div class="col" style="gap:24px">
      <${PO.KpiStrip} items=${[
        { label: status === 'Paid' ? 'Net pay, paid' : 'Net pay, locked', icon: 'Wallet', accent: 'green', value: fine(t.net), sub: `To ${PO.plural(t.heads, 'person', 'people')}`, bar: [{ v: t.net, k: 'ok', title: 'Net pay' }, { v: t.dedTotal, k: 'mute', title: 'Deductions' }, { v: t.erTotal, title: 'Employer contributions' }] },
        { label: `Bank transfer, ${mode}`, icon: 'Landmark', accent: 'teal', value: fine(t.bank), sub: `${PO.plural(t.bankN, 'account')}${t.heldN ? `, ${t.heldN} held` : ''}`, bar: [{ v: t.bankN, k: 'ok', title: 'By bank' }, { v: t.heldN, k: 'warn', title: 'Held' }, { v: t.outsideN, k: 'mute', title: 'Paid outside' }] },
        { label: 'Employer cost', icon: 'Building2', accent: 'blue', value: fine(t.cost), sub: `Including ${fine(t.erTotal)} contributions` },
        ...figs.map(([l, v]) => { const days = Math.round((new Date({ in: '2026-10-15', us: '2026-10-14', uk: '2026-10-22' }[P.id]) - new Date(PO.TODAY)) / 864e5); return { label: l, icon: 'CalendarClock', accent: 'amber', value: fine(v), sub: `Due in ${PO.plural(days, 'day')}`, alert: days <= 10 }; }),
      ]} />
      <${PO.Steps} steps=${[['Locked', `${lock.lockedAt || ''}${lock.approvedBy ? ', approved by ' + lock.approvedBy : ''}`], ['Payslips released', lock.released ? 'Portal, email and SMS' : 'Not sent yet'], ['Paid', status === 'Paid' ? lock.paidAt : `Pay by ${C.payBy}`]]} current=${Math.min(done, 2)} done=${done} />
      <div class="grid g-main" style="align-items:start">
        <div class="col" style="gap:24px;min-width:0">
          <${Card} title="Bank file preview" icon="Landmark" accent="teal" sub=${`${fine(t.bank)} by ${mode} to ${PO.plural(t.bankN, 'account')}`} flush>
            <${DataTable} bare rows=${bankRows} rowKey=${(r) => r.p.id} compact pageSize=${8} exportName="bank-file-preview" search=${(r) => r.p.name + ' ' + r.p.id}
              filters=${[{ key: 'a', label: 'Mode', options: [['process', mode], ['hold', 'Held'], ['outside', P.id === 'us' ? 'Paper check' : 'Cash / cheque']], test: (r, v) => r.a === v }]}
              columns=${[
                { key: 'i', label: '#', render: (r) => html`<span class="faint tnum">${r.i}</span>`, sort: (r) => r.i, width: 40 },
                { key: 'name', label: 'Beneficiary', render: (r) => html`<${PersonCell} id=${r.p.id} sub=${r.p.id} />`, sort: (r) => r.p.name, csv: (r) => r.p.name },
                { key: 'bank', label: 'Bank', render: (r) => (r.b.missing ? html`<${Badge} tone="red" dot>No account</${Badge}>` : html`<span class="t-sm">${r.b.name}</span>`), sort: (r) => r.b.name, csv: (r) => r.b.name },
                { key: 'acct', label: 'Account', render: (r) => html`<span class="tnum">${r.b.missing ? "—" : r.b.acct}</span>`, sort: false, csv: (r) => r.b.acct },
                { key: 'code', label: bankRows[0] ? bankRows[0].b.codeLabel : 'Code', render: (r) => html`<span class="tnum">${r.b.missing ? "—" : r.b.code}</span>`, sort: false, csv: (r) => r.b.code },
                { key: 'amt', label: 'Amount', align: 'r', render: (r) => html`<span class="tnum w-500">${fine(r.amt)}</span>`, sort: (r) => r.amt },
                { key: 'a', label: 'Mode', render: (r) => (r.a === 'process' ? html`<span class="t-sm muted">${mode}</span>` : r.a === 'hold' ? html`<${Badge} tone="amber" dot>Held</${Badge}>` : html`<${Badge} tone="blue" dot>${P.id === 'us' ? 'Paper check' : 'Cash / cheque'}</${Badge}>`), sort: (r) => r.a, csv: (r) => actLabel[r.a] },
              ]} />
          </${Card}>
          <${Card} title="Audit trail" icon="History" accent="violet" sub="Every change to this run">
            <${Timeline} items=${[...log, ...seedLog].map((l) => ({ icon: l.icon, title: l.title, sub: l.by, right: l.at }))} />
          </${Card}>
        </div>
        <div class="col" style="gap:16px">
          <${Card} title="Generated files" icon="FolderDown" accent="green" sub=${PO.plural(P.files.length, 'file')} flush>
            ${P.files.map(([e, n, d]) => html`<div class="pr-file" onClick=${() => { PO.fakeDownload(n); R.addLog(`Downloaded ${n}`, 'Download'); }}><${PO.Chip} icon=${(FILE_IC[e] || ['File'])[0]} accent=${(FILE_IC[e] || [0, 'blue'])[1]} size=${16} /><span class="grow" style="min-width:0"><span class="row" style="gap:6px;min-width:0"><span class="w-500 ellipsis">${n}</span><span class="pr-ftype">${e}</span></span><span class="faint t-sm ellipsis" style="display:block">${d}</span></span><${Icon} n="Download" size=${14} cls="faint" /></div>`)}
          </${Card}>
          <${Card} title="Payslips" icon="ReceiptText" accent="blue" sub=${lock.released ? 'Released' : 'Not released'} actions=${html`<a class="link t-sm" href=${PO.href('payslips/' + P.hero.id)}>Preview</a>`}>
            ${lock.released ? html`<${KV} items=${[['Employee portal', `${Math.round(t.heads * 0.58)} of ${t.heads} viewed`], ['Email', `${Math.round(t.heads * 0.34)} opened`], ['SMS alert', `${Math.round(t.heads * 0.86)} delivered`]]} />`
              : html`<div class="muted t-sm">Each payslip is published to the employee portal with a “Why did my pay change?” explanation, then announced by email and SMS.</div>`}
          </${Card}>
          <${Card} title="Statutory due dates" icon="CalendarClock" accent="amber" flush foot=${html`<span class="faint t-sm">${P.id === 'in' ? 'Upload the bank file to HDFC NetBanking and the ECR to EPFO. Reminders go out 3 days before each date.' : P.id === 'us' ? 'The ACH file debits on Oct 8 for Oct 9 deposits. Federal taxes go through EFTPS by Oct 14.' : 'Send the Bacs file by 6 Oct for Friday payment. The FPS was filed to HMRC on lock.'}</span>`}>
            ${due.slice(0, 6).map(([d, l, s]) => { const days = Math.round((new Date(d) - new Date(PO.TODAY)) / 864e5); return html`<div class="pr-due" style="grid-template-columns:auto minmax(0,1fr) auto"><${Auth} l=${l + ' ' + s} /><span style="min-width:0"><span class="w-500 ellipsis" style="display:block">${l}</span><span class="faint t-sm ellipsis" style="display:block">${PO.date(d, { short: true, noYear: true })}, ${s}</span></span><span class="t-sm tnum" style=${days <= 3 ? 'color:var(--red)' : 'color:var(--text-3)'}>${days <= 0 ? 'Today' : `${days} d`}</span></div>`; })}
          </${Card}>
        </div>
      </div>
    </div>`;
  }

  /* ---------- calendar & off-cycle ---------- */
  function CalendarDrawer({ open, onClose, P }) {
    const cal = PO.payx.calendar[P.id];
    return html`<${Drawer} open=${open} title="Payroll calendar" sub=${`${P.company.cadence} runs in ${P.company.country}`} size="lg" onClose=${onClose} footer=${html`<${Button} onClick=${() => PO.toast('Calendar subscription link copied')}>Add to Google Calendar</${Button}><${Button} kind="primary" onClick=${onClose}>Done</${Button}>`}>
      <div class="col" style="gap:24px">
        <div><div class="t-sm w-600" style="margin-bottom:8px">Next 6 runs</div>
          <div class="card" style="overflow:hidden"><table class="tbl compact"><thead><tr><th>Run</th><th></th><th>Inputs close</th><th>Pay date</th><th>Status</th></tr></thead>
          <tbody><tr><td class="w-600">${P.company.period}</td><td class="faint">Current</td><td class="tnum">${PO.date('2026-10-05', { short: true })}</td><td class="w-500">${P.company.payBy}</td><td><${PO.Status} s="In progress" /></td></tr>
          ${cal.runs.map(([r, n, c, d]) => html`<tr><td class="w-500">${r}</td><td class="faint t-sm">${n}</td><td class="tnum">${PO.date(c, { weekday: true, short: true })}</td><td class="tnum">${PO.date(d, { weekday: true })}</td><td><span class="t-sm muted">Scheduled</span></td></tr>`)}</tbody></table></div>
        </div>
        <div><div class="row" style="margin-bottom:8px"><span class="t-sm w-600">Statutory due dates</span><span class="faint t-sm right">Reminders 3 days before</span></div>
          <div class="card" style="overflow:hidden">${cal.due.map(([d, l, s]) => html`<div class="pr-due" style="grid-template-columns:auto 64px minmax(0,1fr)"><${Auth} l=${l + ' ' + s} /><span class="tnum t-sm">${PO.date(d, { short: true })}</span><span><span class="w-500">${l}</span><span class="faint t-sm" style="display:block">${s}</span></span></div>`)}</div>
        </div>
      </div>
    </${Drawer}>`;
  }
  function OffCycleDrawer({ open, onClose, R }) {
    const P = R.P;
    const [runs, setRuns] = PO.useCoState('payroll.offcycle', []);
    const [type, setType] = useState('fnf');
    const [who, setWho] = useState(P.hero.id);
    const [amt, setAmt] = useState(P.id === 'in' ? '2500' : '150.00');
    const [date, setDate] = useState('2026-10-08');
    const types = [['fnf', P.id === 'in' ? 'Full & final' : 'Final pay'], ['bonus', 'Bonus'], ['correction', 'Correction']];
    const ex = P.exits[0];
    const v = type === 'fnf' ? ex.settlement : Math.abs(parseFloat(amt) || 0);
    const create = () => { const r = { id: `OC-${31 + runs.length}`, type: types.find((x) => x[0] === type)[1], who: type === 'fnf' ? ex.name : PO.person(who).name, amt: v, date }; setRuns([r, ...runs]); R.addLog(`Off-cycle run ${r.id}: ${r.type.toLowerCase()} for ${r.who}, ${fine(v)}`, 'Zap'); PO.toast(`Off-cycle run ${r.id} created for ${PO.date(date, { short: true })}`, { icon: 'Zap' }); onClose(); };
    return html`<${Drawer} open=${open} title="Off-cycle run" sub="Paid outside the regular schedule" onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!v} onClick=${create}>Create run for ${fine(v)}</${Button}>`}>
      <div class="col" style="gap:16px">
        <${Field} label="Type"><${Segmented} value=${type} onChange=${setType} options=${types} /></${Field}>
        ${type === 'fnf' ? html`<${Field} label="Leaver"><${Select} value=${ex.id} onChange=${() => {}} options=${P.exits.map((x) => [x.id, `${x.name}, last day ${PO.date(x.lastDay, { short: true })}`])} /></${Field}>
          <div>${fnfLines(P, ex).map(([l, a]) => html`<div class="pr-sumrow"><span class="muted">${l}</span><span class="tnum">${a < 0 ? '−' : ''}${fine(Math.abs(a))}</span></div>`)}<div class="pr-sumrow big"><span>Net</span><span class="tnum">${fine(ex.settlement)}</span></div></div>`
          : html`<${Field} label="Employee"><${Select} value=${who} onChange=${setWho} options=${P.people.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => [p.id, `${p.name}, ${p.id}`])} /></${Field}>
          <${Field} label="Gross amount"><input class="input tnum" value=${amt} onInput=${(e) => setAmt(e.target.value)} /></${Field}>`}
        <${Field} label="Pay date"><input class="input" type="date" value=${date} onInput=${(e) => setDate(e.target.value)} /></${Field}>
        ${runs.length ? html`<div><div class="t-sm w-600" style="margin-bottom:6px">Recent off-cycle runs</div><div class="card" style="overflow:hidden"><table class="tbl compact"><tbody>${runs.map((r) => html`<tr><td class="tnum muted">${r.id}</td><td><span class="w-500">${r.who}</span> <span class="faint t-sm">${r.type}, ${PO.date(r.date, { short: true })}</span></td><td class="r tnum">${fine(r.amt)}</td><td><span class="t-sm muted">Scheduled</span></td></tr>`)}</tbody></table></div></div>` : null}
      </div>
    </${Drawer}>`;
  }

  PO.route('payroll', Payroll, { title: 'Run payroll' });
  PO.navCount('payroll', (state, P) => { const l = PO.coGet(state, 'payroll.lock', { status: 'Draft' }); if (l.status !== 'Draft') return 0; return PO.payx.checksOf(state, P).filter((c) => !c.done).length; });
})();
