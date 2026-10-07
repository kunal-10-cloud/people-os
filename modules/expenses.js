/* People OS: expenses and advances (route `expenses`).
   Claims with receipts and policy checks, approvals that agree with the inbox ('exp:<id>' in approvals.decided),
   a scripted receipt scan, reimbursement mode, and advances/loans with EMI schedules and the 50% deduction check. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect } = PO;
  const { Button, Card, Badge, Icon, Stat, Callout, DataTable, Drawer, Who, Avatar, Tabs, KV, Field, Select, Segmented, Progress, Timeline } = PO;
  const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const fine = (n) => PO.money(n, { cents: !PO.isIN() });
  const LIMIT = { in: 2500, us: 120, uk: 120 };

  document.head.insertAdjacentHTML('beforeend', `<style>
  .ex-receipt { background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:4px; padding:18px 18px 20px; font-family:var(--mono); font-size:11.5px; line-height:1.55; max-width:300px; margin:0 auto; }
  .ex-receipt .c { text-align:center; } .ex-receipt .b { font-weight:700; }
  .ex-receipt .ln { display:flex; justify-content:space-between; gap:8px; }
  .ex-receipt hr { border:none; border-top:1px dashed var(--border-strong); margin:8px 0; }
  .ex-drop { border:1px dashed var(--border-strong); border-radius:var(--r-lg); padding:24px; text-align:center; cursor:pointer; background:var(--surface-2); }
  .ex-drop:hover { border-color:var(--text-3); }
  .ex-emi { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
  .ex-emi td { padding:7px 0; border-top:1px solid var(--border); }
  .ex-emi tr.done td { color:var(--text-3); }
  .ex-emi tr.now td { font-weight:600; }
  </style>`);

  /* ---------- data ---------- */
  const MERCH = {
    in: { Travel: ['Ola Cabs', 'MSRTC Swargate'], Fuel: ['Indian Oil, Baner Road', 'HP Petrol Pump, Kharadi'], 'Site supplies': ['Shree Electricals', 'Laxmi Hardware Stores'], 'Mobile recharge': ['Jio Prepaid', 'Airtel Prepaid'], 'Food (night duty)': ['Hotel Shreyas', 'Vaishali Restaurant'], Training: ['Fire Safety Academy Pune', 'SkillPro Institute'] },
    us: { Mileage: ['Shell, S Lamar', 'H-E-B Fuel'], Supplies: ['Restaurant Depot', 'Costco Business'], Meals: ['Torchy’s Tacos', 'Whataburger'], Training: ['ServSafe', 'Texas Food Handlers'], Uniforms: ['Chef Works', 'Cintas'], Phone: ['T-Mobile', 'AT&T'] },
    uk: { Mileage: ['Shell, Trafford Park', 'Esso, Salford'], Parking: ['NCP Manchester Airport', 'Q-Park Spinningfields'], Supplies: ['Screwfix Trafford', 'Toolstation Salford'], Training: ['BICSc training', 'St John Ambulance'], Subsistence: ['Greggs', 'Pret A Manger'], Phone: ['Vodafone', 'EE'] },
  };
  const taxOf = (P) => (P.id === 'in' ? ['GST 18%', 0.18] : P.id === 'us' ? ['Sales tax 8.25%', 0.0825] : ['VAT 20%', 0.2]);
  function claimsOf(P) {
    const ap = P.approvals.find((a) => a.id === 'ap7');
    const m = P.money.find((x) => x[0] === 'ap7');
    const extra = ap && m && P.byId[ap.who] ? [{ id: 'EXP-4199', apId: 'ap7', who: ap.who, cat: P.id === 'in' ? 'Site supplies' : P.id === 'us' ? 'Mileage' : 'Parking', amt: m[3], date: '2026-10-05', merchant: SCAN[P.id].merchant, status: 'Submitted', receipt: true, policy: m[3] > LIMIT[P.id] ? 'Over limit' : 'Within policy', note: m[1], channel: 'Portal' }] : [];
    return [...extra, ...P.expenses.map((e) => ({ ...e, channel: PO.seeded('ch' + e.id).pick(['Portal', 'Portal', 'Portal', 'Email', 'HR desk']) }))];
  }
  /** Expense category chips, same mapping as the employee portal. */
  const expIc = (c) => { const k = (c || '').toLowerCase(); return /fuel|mileage/.test(k) ? ['Fuel', 'amber'] : /travel|parking/.test(k) ? ['Bus', 'blue'] : /suppl/.test(k) ? ['Package', 'teal'] : /phone|mobile/.test(k) ? ['Smartphone', 'violet'] : /food|meal|subsist/.test(k) ? ['UtensilsCrossed', 'rose'] : /train/.test(k) ? ['GraduationCap', 'green'] : /uniform/.test(k) ? ['Shirt', 'blue'] : ['Receipt', 'green']; };
  const CatChip = ({ c, size }) => { const [i, a] = expIc(c); return html`<${PO.Chip} icon=${i} accent=${a} size=${size || 14} />`; };
  const ACC_VAR = { amber: 'var(--amber-solid)', blue: 'var(--blue-solid)', teal: 'var(--teal)', violet: 'var(--violet)', rose: 'var(--rose)', green: 'var(--green-solid)' };
  function merchantOf(P, e) { const r = PO.seeded('mer' + P.id + e.id); return e.merchant || r.pick(MERCH[P.id][e.cat] || ['Local vendor']); }

  function useClaims() {
    const P = PO.P();
    const [st, setSt] = PO.useCoState('expenses.status', {});
    const [dec, setDec] = PO.useCoState('approvals.decided', {});
    const [added, setAdded] = PO.useCoState('expenses.added', []);
    const base = useMemo(() => claimsOf(P), [P.id]);
    const statusOf = (e) => (st[e.id] ? st[e.id] : e.apId ? (dec[e.apId] ? (dec[e.apId] === 'approved' ? 'Approved' : 'Rejected') : 'Submitted') : PO.payx.expStatus(e, st, dec));
    const rows = [...added, ...base].map((e) => ({ ...e, s: statusOf(e) }));
    const decide = (e, v) => {
      if (e.added) setSt({ ...st, [e.id]: v === 'approved' ? 'Approved' : 'Rejected' });
      else setDec({ ...(dec || {}), [e.apId || 'exp:' + e.id]: v });
    };
    const undo = (e) => { setSt((x) => { const n = { ...(x || {}) }; delete n[e.id]; return n; }); if (!e.added) setDec((d) => { const n = { ...(d || {}) }; delete n[e.apId || 'exp:' + e.id]; return n; }); };
    const markPaid = (ids) => { const n = { ...st }; ids.forEach((i) => (n[i] = 'Paid')); setSt(n); };
    return { P, rows, st, setSt, dec, decide, undo, markPaid, added, setAdded };
  }

  /* ================= page ================= */
  function Expenses({ query = {} }) {
    const P = PO.P();
    const [tab, setTab] = useState(query.tab === 'advances' ? 'advances' : 'claims');
    const [newClaim, setNewClaim] = useState(query.new === '1' && tab === 'claims');
    const [newAdv, setNewAdv] = useState(query.new === '1' && tab === 'advances');
    const C = useClaims();
    const pend = C.rows.filter((r) => r.s === 'Submitted').length;
    const advN = P.advances.length;
    const sumOf = (a) => r2(a.reduce((t, e) => t + e.amt, 0));
    const sub = C.rows.filter((r) => r.s === 'Submitted'), appr = C.rows.filter((r) => r.s === 'Approved'), paid = C.rows.filter((r) => r.s === 'Paid' && r.date >= '2026-09-01');
    const over = C.rows.filter((r) => r.policy === 'Over limit' && r.s !== 'Rejected');
    const { state } = PO.useStore();
    const mode = PO.coGet(state, 'expenses.mode', 'payroll');
    const advRows = [...PO.coGet(state, 'expenses.advAdded', []), ...P.advances].filter((a) => P.byId[a.who]);
    const advOut = r2(advRows.reduce((t, a) => t + scheduleOf(P, a).filter((x) => x.st !== 'Recovered').reduce((u, x) => u + x.amt, 0), 0));
    const advRec = r2(advRows.reduce((t, a) => t + scheduleOf(P, a).filter((x) => x.st === 'Recovered').reduce((u, x) => u + x.amt, 0), 0));
    return html`<${PO.PageHeader} title="Expenses & advances" sub=${`${PO.plural(sub.length, 'claim')} waiting for a decision and ${PO.plural(advRows.length, 'advance')} being recovered. Approved claims are paid ${mode === 'payroll' ? 'with the ' + P.company.period + ' payroll' : 'instantly'}.`}
        actions=${html`${tab === 'advances' ? html`<${Button} onClick=${() => setNewClaim(true)}>New claim</${Button}><${Button} kind="primary" onClick=${() => setNewAdv(true)}>New advance</${Button}>` : html`<${Button} onClick=${() => setNewAdv(true)}>New advance</${Button}><${Button} kind="primary" onClick=${() => setNewClaim(true)}>New claim</${Button}>`}`} />
      <${PO.KpiStrip} items=${[
        { label: 'Waiting for a decision', icon: 'Hourglass', accent: 'amber', value: PO.num(sub.length), sub: `${fine(sumOf(sub))} in ${PO.plural(sub.length, 'claim')}`, alert: sub.length > 0, onClick: () => setTab('claims') },
        { label: 'Claims since 1 Sep', icon: 'ReceiptText', accent: 'blue', value: fine(sumOf([...sub, ...appr, ...paid])), sub: `${fine(sumOf(paid))} already paid`, bar: [{ v: sumOf(paid), k: 'ok', title: 'Paid' }, { v: sumOf(appr), k: 'mute', title: 'Approved, not paid' }, { v: sumOf(sub), k: 'warn', title: 'Pending' }] },
        { label: 'Over policy', icon: 'ShieldAlert', accent: 'red', value: PO.num(over.length), tone: over.length ? 'red' : '', sub: `Above ${PO.money(LIMIT[P.id])} per claim` },
        { label: 'Advances outstanding', icon: 'HandCoins', accent: 'violet', value: fine(advOut), sub: `${fine(advRec)} recovered so far`, bar: [{ v: advRec, k: 'ok', title: 'Recovered' }, { v: advOut, k: 'mute', title: 'Outstanding' }], onClick: () => setTab('advances') },
      ]} />
      <div style="margin-top:24px"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['claims', 'Claims', pend || null], ['advances', 'Advances & loans', advN]]} /></div>
      <div>${tab === 'claims' ? html`<${Claims} C=${C} open=${query.claim} />` : html`<${Advances} onNew=${() => setNewAdv(true)} />`}</div>
      <${NewClaim} open=${newClaim} onClose=${() => setNewClaim(false)} C=${C} />
      <${NewAdvance} open=${newAdv} onClose=${() => setNewAdv(false)} />`;
  }

  /* ---------- claims ---------- */
  function Claims({ C, open }) {
    const { P, rows } = C;
    const [sel, setSel] = useState(open ? { id: open } : null);
    const [mode, setMode] = PO.useCoState('expenses.mode', 'payroll');
    const sumOf = (a) => r2(a.reduce((t, e) => t + e.amt, 0));
    const sub = rows.filter((r) => r.s === 'Submitted');
    const appr = rows.filter((r) => r.s === 'Approved');
    const paid = rows.filter((r) => r.s === 'Paid' && r.date >= '2026-09-01');
    const over = rows.filter((r) => r.policy === 'Over limit' && r.s !== 'Rejected');
    const cats = [...new Set(rows.map((r) => r.cat))].map((c) => ({ label: c, value: sumOf(rows.filter((r) => r.cat === c && r.s !== 'Rejected')), sub: PO.plural(rows.filter((r) => r.cat === c && r.s !== 'Rejected').length, 'claim') })).sort((a, b) => b.value - a.value);
    const approve = (e) => { C.decide(e, 'approved'); PO.toast(`${e.id} approved: ${fine(e.amt)} ${mode === 'payroll' ? 'added to ' + P.company.period + ' payroll' : 'paid instantly'}`, { action: { label: 'Undo', run: () => undo(e) } }); if (mode === 'instant') C.markPaid([e.id]); };
    const reject = (e) => { C.decide(e, 'rejected'); PO.toast(`${e.id} rejected. ${PO.person(e.who).first} has been told why.`, { action: { label: 'Undo', run: () => undo(e) } }); };
    const undo = (e) => C.undo(e);
    const actions = (e) => html`<span class="row" style="gap:4px;justify-content:flex-end" onClick=${(ev) => ev.stopPropagation()}>${e.s === 'Submitted' ? html`<${Button} size="sm" kind="ghost" onClick=${() => reject(e)}>Reject</${Button}><${Button} size="sm" onClick=${() => approve(e)}>Approve</${Button}>` : e.s === 'Approved' ? html`<${Button} size="sm" kind="ghost" onClick=${() => { C.markPaid([e.id]); PO.toast(`${e.id} marked as paid`); }}>Mark paid</${Button}>` : null}</span>`;
    return html`<div class="col" style="gap:16px">
      <div class="col" style="gap:24px">
        <${DataTable} rows=${rows} pageSize=${12} compact exportName="expense-claims" search=${(e) => e.id + ' ' + PO.person(e.who).name + ' ' + e.cat + ' ' + merchantOf(P, e)} onRow=${setSel} selectable
          initialSort=${{ key: 'date', dir: 'desc' }}
          filters=${[{ key: 's', label: 'Status', options: ['Submitted', 'Approved', 'Paid', 'Rejected'], test: (e, v) => e.s === v }, { key: 'c', label: 'Category', options: P.vocab.expenseCats, test: (e, v) => e.cat === v }, { key: 'p', label: 'Policy', options: ['Within policy', 'Over limit'], test: (e, v) => e.policy === v }]}
          bulk=${(ids, clear) => html`<${Button} size="sm" onClick=${() => { const list = rows.filter((r) => ids.includes(r.id) && r.s === 'Submitted'); list.forEach((e) => C.decide(e, 'approved')); PO.toast(`${PO.plural(list.length, 'claim')} approved`); clear(); }}>Approve</${Button}><${Button} size="sm" onClick=${() => { const list = rows.filter((r) => ids.includes(r.id) && r.s === 'Approved').map((r) => r.id); C.markPaid(list); PO.toast(`${PO.plural(list.length, 'claim')} marked as paid`); clear(); }}>Mark paid</${Button}>`}
          columns=${[
            { key: 'id', label: 'Claim', render: (e) => html`<span class="tnum muted" style="white-space:nowrap">${e.id}</span>`, sort: (e) => e.id },
            { key: 'who', label: 'Employee', render: (e) => html`<${Who} p=${PO.person(e.who)} size="sm" sub=${merchantOf(P, e)} link=${false} />`, sort: (e) => PO.person(e.who).name, csv: (e) => PO.person(e.who).name },
            { key: 'cat', label: 'Category', render: (e) => html`<span class="row" style="gap:8px;white-space:nowrap"><${CatChip} c=${e.cat} size=${13} />${e.cat}</span>`, sort: (e) => e.cat, csv: (e) => e.cat },
            { key: 'date', label: 'Date', render: (e) => html`<span style="white-space:nowrap">${PO.date(e.date, { short: true })}</span>`, sort: (e) => e.date, csv: (e) => e.date },
            { key: 'amt', label: 'Amount', align: 'r', render: (e) => html`<span class="tnum w-500">${fine(e.amt)}</span>`, sort: (e) => e.amt },
            { key: 'flags', label: 'Checks', render: (e) => (e.policy === 'Over limit' ? html`<${Badge} tone="red" dot>Over limit</${Badge}>` : !e.receipt ? html`<${Badge} tone="amber" dot>No receipt</${Badge}>` : html`<span class="t-sm faint">Receipt</span>`), sort: (e) => (e.policy === 'Over limit' ? 0 : e.receipt ? 2 : 1), csv: (e) => `${e.receipt ? 'Receipt' : 'No receipt'}; ${e.policy}` },
            { key: 's', label: 'Status', render: (e) => html`<${PO.Status} s=${e.s} />`, sort: (e) => e.s },
            { key: 'a', label: '', align: 'r', render: actions, sort: false, csv: false },
          ]} />
        <div class="grid g-2" style="align-items:start">
          <${Card} title="Spend by category" icon="ChartBar" accent="blue" sub="Since 1 Sep, excluding rejected">${cats.map((c) => { const mx = cats[0] ? cats[0].value || 1 : 1; const acc = expIc(c.label)[1]; return html`<div class="row" style="gap:10px;padding:6px 0"><${CatChip} c=${c.label} /><div class="grow" style="min-width:0"><div class="row t-sm"><span class="w-500 ellipsis">${c.label}</span><span class="faint" style="margin-left:6px">${c.sub}</span><span class="right tnum w-550">${PO.money(c.value, { compact: !PO.isIN() && c.value > 9999 })}</span></div><div style="height:5px;border-radius:3px;background:var(--surface-3);margin-top:5px;overflow:hidden"><i style=${`display:block;height:100%;width:${(c.value / mx) * 100}%;background:${ACC_VAR[acc]}`}></i></div></div></div>`; })}</${Card}>
          <section class="card" id="ex-settings">
            <div class="card-h"><${PO.Chip} icon="Wallet" accent="green" /><h3>How claims are paid</h3></div>
            <div class="card-b col" style="gap:12px">
              <${Segmented} value=${mode} onChange=${(v) => { setMode(v); PO.toast(v === 'payroll' ? 'Approved claims will be paid with payroll' : `Approved claims will be paid instantly by ${P.id === 'in' ? 'UPI' : P.id === 'us' ? 'same-day ACH' : 'Faster Payments'}`); }} options=${[['payroll', 'With payroll'], ['instant', 'Instantly']]} />
              <div class="muted t-sm">${mode === 'payroll' ? `Approved claims are added to the next payroll as a non-taxable reimbursement. ${PO.plural(appr.length, 'claim')} worth ${fine(sumOf(appr))} will be paid on ${P.company.payBy}.` : `Approved claims are paid within minutes by ${P.id === 'in' ? 'UPI from the HDFC current account' : P.id === 'us' ? 'same-day ACH from Chase' : 'Faster Payments from Barclays'}.`}</div>
              <div class="divider"></div>
              <${KV} items=${[['Per-claim limit', PO.money(LIMIT[P.id])], ['Receipt needed above', PO.money(P.id === 'in' ? 200 : 25)], ['Submit within', '30 days of spend'], ['Approver', 'Manager, then HR']]} />
            </div>
          </section>
        </div>
      </div>
      <${ClaimDrawer} e=${sel && rows.find((r) => r.id === sel.id)} onClose=${() => setSel(null)} approve=${approve} reject=${reject} markPaid=${(e) => { C.markPaid([e.id]); PO.toast(`${e.id} marked as paid`); }} mode=${mode} />
    </div>`;
  }

  function Receipt({ P, e }) {
    const [tl, rate] = taxOf(P);
    const net = r2(e.amt / (1 + rate));
    const tax = r2(e.amt - net);
    const r = PO.seeded('rc' + e.id);
    const items = e.cat === 'Fuel' || e.cat === 'Mileage' ? [[P.id === 'in' ? 'Petrol, 17.2 L' : P.id === 'us' ? 'Regular unleaded, 24.1 gal' : 'Unleaded, 28.4 L', 1]] : e.cat === 'Parking' ? [['Staff parking, 7 days', 1]] : [[e.note && e.note.length < 34 ? e.note.replace(/,.*$/, '') : e.cat, 0.62], ['Sundries', 0.38]];
    let acc = 0;
    const lines = items.map(([n, f], i) => { const v = i === items.length - 1 ? r2(net - acc) : r2(net * f); acc = r2(acc + v); return [n, v]; });
    return html`<div class="ex-receipt">
      <div class="c b" style="font-size:13px">${merchantOf(P, e).toUpperCase()}</div>
      <div class="c">${P.id === 'in' ? 'GSTIN 27AAB' + r.int(1000, 9999) + 'C1Z' + r.int(1, 9) : P.id === 'us' ? 'Austin, TX (512) ' + r.int(200, 899) + '-' + r.int(1000, 9999) : 'VAT reg GB ' + r.int(100, 999) + ' ' + r.int(1000, 9999) + ' ' + r.int(10, 99)}</div>
      <div class="c">${PO.date(e.date)}, ${String(r.int(8, 20)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}</div>
      <hr />${lines.map(([n, v]) => html`<div class="ln"><span>${n}</span><span>${fine(v)}</span></div>`)}
      <hr /><div class="ln"><span>Subtotal</span><span>${fine(net)}</span></div><div class="ln"><span>${tl}</span><span>${fine(tax)}</span></div>
      <div class="ln b" style="font-size:13px"><span>TOTAL</span><span>${fine(e.amt)}</span></div>
      <hr /><div class="c">${P.id === 'in' ? 'Paid by UPI, ref ' + r.int(100000, 999999) + r.int(100000, 999999) : 'Card ····' + r.int(1000, 9999)}</div><div class="c">Thank you, visit again</div>
    </div>`;
  }

  function ClaimDrawer({ e, onClose, approve, reject, markPaid, mode }) {
    const P = PO.P();
    if (!e) return null;
    const p = PO.person(e.who);
    const appr = P.byId[p.manager] || P.byId[P.hrId];
    const steps = [{ icon: 'Upload', tone: 'brand', title: `Submitted by ${p.name}`, sub: `Via ${e.channel === 'Email' ? 'email' : e.channel === 'HR desk' ? 'the HR desk' : 'the employee portal'}, receipt ${e.receipt ? 'attached' : 'missing'}`, right: PO.date(e.date, { short: true }) }];
    if (e.s !== 'Submitted') steps.push({ icon: e.s === 'Rejected' ? 'CircleX' : 'CircleCheck', tone: e.s === 'Rejected' ? 'red' : 'green', title: `${e.s === 'Rejected' ? 'Rejected' : 'Approved'} by ${appr.name}`, sub: e.s === 'Rejected' ? 'Reason: outside the expense policy' : appr.title, right: PO.date(PO.addDays(e.date, 1), { short: true }) });
    if (e.s === 'Paid') steps.push({ icon: 'Banknote', tone: 'green', title: mode === 'payroll' ? 'Paid with payroll' : 'Paid instantly', sub: 'Non-taxable reimbursement', right: PO.date(PO.addDays(e.date, 6) > PO.TODAY ? PO.TODAY : PO.addDays(e.date, 6), { short: true }) });
    return html`<${Drawer} open size="lg" title=${`${e.id}, ${fine(e.amt)}`} sub=${`${e.cat} at ${merchantOf(P, e)} on ${PO.date(e.date)}`} onClose=${onClose}
      footer=${e.s === 'Submitted' ? html`<${Button} onClick=${() => { reject(e); onClose(); }}>Reject</${Button}><${Button} kind="primary" onClick=${() => { approve(e); onClose(); }}>Approve ${fine(e.amt)}</${Button}>` : e.s === 'Approved' ? html`<${Button} kind="primary" onClick=${() => { markPaid(e); onClose(); }}>Mark as paid</${Button}>` : html`<${Button} onClick=${onClose}>Close</${Button}>`}>
      <div class="grid g-2" style="gap:20px;align-items:start">
        <div class="col" style="gap:10px">
          ${e.receipt ? html`<div style="padding:16px 12px;background:var(--surface-2);border-radius:var(--r-lg)"><${Receipt} P=${P} e=${e} /></div>` : html`<${PO.Empty} icon="FileX" title="No receipt attached" text=${`Under ${PO.money(P.id === 'in' ? 200 : 25)} a receipt is optional; above that, ask ${p.first} for one.`} action=${html`<${Button} size="sm" onClick=${() => PO.toast(`Asked ${p.first} by email to upload the receipt in the employee portal`)}>Ask for receipt</${Button}>`} />`}
          ${e.receipt ? html`<${Button} size="sm" icon="Download" onClick=${() => PO.fakeDownload(`${e.id} receipt`)}>Download receipt</${Button}>` : null}
        </div>
        <div class="col" style="gap:14px">
          <div class="row"><${Who} p=${p} sub=${p.title + ', ' + PO.site(p.site).name} /><span class="right"><${PO.Status} s=${e.s} /></span></div>
          <${KV} items=${[['Amount', fine(e.amt)], ['Category', e.cat], ['Merchant', merchantOf(P, e)], ['Spent on', PO.date(e.date)], ['Pays out', e.s === 'Paid' ? 'Paid' : mode === 'payroll' ? `With payroll, ${P.company.payBy}` : 'Instantly on approval'], ['Note', e.note || '—']]} />
          <div class="col" style="gap:6px">
            ${[[e.receipt, e.receipt ? 'Receipt read: amount, date and merchant match' : 'No receipt attached'], [e.policy !== 'Over limit', e.policy !== 'Over limit' ? `Within the ${PO.money(LIMIT[P.id])} per-claim limit` : `Over the ${PO.money(LIMIT[P.id])} limit by ${fine(e.amt - LIMIT[P.id])}`], [true, 'No duplicate in the last 90 days'], [true, `Submitted ${PO.plural(Math.max(0, Math.round((new Date(PO.TODAY) - new Date(e.date)) / 864e5)), 'day')} after spend (limit 30)`]].map(([ok, t]) => html`<div class="row t-sm"><${Badge} tone=${ok ? 'green' : 'amber'} dot></${Badge}><span class=${ok ? 'muted' : ''}>${t}</span></div>`)}
          </div>
          <div><div class="t-sm w-600" style="margin-bottom:8px">Audit trail</div><${Timeline} items=${steps} /></div>
        </div>
      </div>
    </${Drawer}>`;
  }

  /* ---------- new claim with scripted receipt scan ---------- */
  const SCAN = {
    in: { amt: 1850, merchant: 'Shree Electricals', date: '2026-10-03', cat: 'Site supplies', note: 'Torches and batteries for night patrol' },
    us: { amt: 86.4, merchant: 'Shell, S Lamar', date: '2026-10-03', cat: 'Mileage', note: 'Catering van fuel' },
    uk: { amt: 42, merchant: 'NCP Manchester Airport', date: '2026-10-03', cat: 'Parking', note: 'Staff parking, airport night shift' },
  };
  function NewClaim({ open, onClose, C }) {
    const P = PO.P();
    const S = SCAN[P.id];
    const ap = P.approvals.find((a) => a.id === 'ap7');
    const [stage, setStage] = useState('drop');
    const [who, setWho] = useState(ap && ap.who ? ap.who : P.hero.id);
    const [f, setF] = useState({ amt: '', merchant: '', date: '', cat: P.vocab.expenseCats[0], note: '' });
    useEffect(() => { if (!open) { setStage('drop'); setF({ amt: '', merchant: '', date: '', cat: P.vocab.expenseCats[0], note: '' }); } }, [open]);
    if (!open) return null;
    const scan = () => { setStage('scan'); setTimeout(() => { setF({ amt: String(S.amt), merchant: S.merchant, date: S.date, cat: S.cat, note: S.note }); setStage('read'); }, 500); };
    const amt = parseFloat(f.amt) || 0;
    const dup = C.rows.some((r) => r.who === who && Math.abs(r.amt - amt) < 0.01 && r.date === f.date);
    const checks = [[amt > 0 && amt <= LIMIT[P.id], !amt ? 'Enter the amount to check the limit' : amt > LIMIT[P.id] ? `Over the ${PO.money(LIMIT[P.id])} per-claim limit: needs HR approval` : `Within the ${PO.money(LIMIT[P.id])} per-claim limit`], [stage === 'read', stage === 'read' ? 'Receipt is legible and dated' : 'Receipt not scanned yet'], [!dup, dup ? 'Looks like a duplicate of an existing claim' : 'No duplicate found'], [true, `${f.cat} is allowed for ${PO.person(who).title.toLowerCase()}s`]];
    const submit = () => { const id = `EXP-${4300 + C.added.length}`; C.setAdded([{ id, who, cat: f.cat, amt, date: f.date || PO.TODAY, status: 'Submitted', receipt: stage === 'read', policy: amt > LIMIT[P.id] ? 'Over limit' : 'Within policy', note: f.note, merchant: f.merchant, channel: 'Web', added: true }, ...C.added]); PO.toast(`${id} submitted for ${PO.person(who).name}`); onClose(); };
    return html`<${Drawer} open title="New expense claim" sub="Upload a receipt to fill in the amount, merchant and date" onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!amt || !f.merchant} onClick=${submit}>Submit${amt ? ' ' + fine(amt) : ' claim'}</${Button}>`}>
      <div class="col" style="gap:14px">
        <${Field} label="Claim for"><${Select} value=${who} onChange=${setWho} options=${P.people.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => [p.id, `${p.name}, ${p.id}`])} /></${Field}>
        ${stage === 'drop' ? html`<div class="ex-drop" onClick=${scan}><b class="w-600">Drop a receipt or click to upload</b><div class="faint t-sm mt-4">JPG, PNG or PDF. The amount, merchant and date are read from it.</div><div class="mt-12"><${Button} size="sm">Upload receipt_0310.jpg</${Button}></div></div>`
          : stage === 'scan' ? html`<div class="ex-drop"><b class="w-600">receipt_0310.jpg</b><div class="faint t-sm mt-4">Reading the total, merchant and date</div></div>`
            : html`<div class="row" style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--r)"><div class="grow"><b class="w-500">receipt_0310.jpg</b><div class="faint t-sm">Read ${fine(S.amt)} at ${S.merchant} on ${PO.date(S.date, { short: true, noYear: true })}. Check the details below.</div></div><${Button} size="sm" kind="ghost" onClick=${() => setStage('drop')}>Replace</${Button}></div>`}
        <div class="grid g-2" style="gap:12px">
          <${Field} label="Amount"><input class="input tnum" value=${f.amt} placeholder="0" onInput=${(e) => setF({ ...f, amt: e.target.value })} /></${Field}>
          <${Field} label="Date"><input class="input" type="date" value=${f.date} onInput=${(e) => setF({ ...f, date: e.target.value })} /></${Field}>
          <${Field} label="Merchant"><input class="input" value=${f.merchant} onInput=${(e) => setF({ ...f, merchant: e.target.value })} /></${Field}>
          <${Field} label="Category"><${Select} value=${f.cat} onChange=${(v) => setF({ ...f, cat: v })} options=${P.vocab.expenseCats} /></${Field}>
        </div>
        <${Field} label="What was it for?"><input class="input" value=${f.note} onInput=${(e) => setF({ ...f, note: e.target.value })} /></${Field}>
        <div class="col" style="gap:6px"><b class="w-600 t-sm">Policy check</b>${checks.map(([ok, t]) => html`<div class="row t-sm"><${Badge} tone=${ok ? 'green' : 'amber'} dot></${Badge}><span class=${ok ? 'muted' : ''}>${t}</span></div>`)}</div>
      </div>
    </${Drawer}>`;
  }

  /* ---------- advances ---------- */
  function scheduleOf(P, a) {
    const labels = P.id === 'in' ? ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027'] : P.id === 'us' ? ['Jul 31', 'Aug 14', 'Aug 28', 'Sep 11', 'Sep 25', 'Oct 9', 'Oct 23', 'Nov 6', 'Nov 20', 'Dec 4', 'Dec 18', 'Dec 31'] : ['22 May', '19 Jun', '17 Jul', '14 Aug', '11 Sep', '9 Oct', '6 Nov', '4 Dec', '24 Dec', '29 Jan', '26 Feb', '26 Mar'];
    const startIdx = a.fromNext ? 6 : 5 - a.paid;
    return Array.from({ length: a.inst }, (_, i) => { const amt = i === a.inst - 1 ? r2(a.amt - a.emi * (a.inst - 1)) : a.emi; const st = a.fromNext ? 'Upcoming' : i < a.paid ? 'Recovered' : i === a.paid ? 'This run' : 'Upcoming'; return { n: i + 1, label: labels[Math.min(labels.length - 1, Math.max(0, startIdx + i))], amt, st }; });
  }
  function Advances({ onNew }) {
    const P = PO.P();
    const [dec, setDec] = PO.useCoState('approvals.decided', {});
    const [added] = PO.useCoState('expenses.advAdded', []);
    const [sel, setSel] = useState(null);
    const rows = [...added, ...P.advances].filter((a) => P.byId[a.who]);
    const outstanding = (a) => r2(scheduleOf(P, a).filter((s) => s.st !== 'Recovered').reduce((t, s) => t + s.amt, 0));
    const thisRun = rows.reduce((t, a) => t + (scheduleOf(P, a).find((s) => s.st === 'This run')?.amt || 0), 0);
    const req = P.approvals.find((a) => a.id === 'ap6');
    const reqM = P.money.find((x) => x[0] === 'ap6');
    return html`<div class="col" style="gap:16px">

      ${req && reqM && !dec.ap6 ? html`<${Callout} tone="amber" icon="HandCoins" title=${`${reqM[1]}, ${fine(reqM[3])}`}
          action=${html`<span class="row"><${Button} size="sm" kind="ghost" onClick=${() => { setDec({ ...dec, ap6: 'rejected' }); PO.toast('Advance request rejected'); }}>Reject</${Button}><${Button} size="sm" onClick=${() => { setDec({ ...dec, ap6: 'approved' }); PO.toast(`Advance approved and paid by ${P.id === 'in' ? 'UPI' : 'bank transfer'}`); }}>Approve & pay</${Button}></span>`}>${req.detail} ${req.when === 'Mon' ? 'Requested Monday.' : ''}</${Callout}>` : null}
      <${DataTable} rows=${rows} exportName="advances-and-loans" search=${(a) => a.id + ' ' + PO.person(a.who).name} onRow=${setSel} pageSize=${10}
        filters=${[{ key: 'k', label: 'Type', options: ['Salary advance', 'Personal loan'], test: (a, v) => a.kind === v }]}
        columns=${[
          { key: 'id', label: 'Ref', render: (a) => html`<span class="tnum muted">${a.id}</span>`, sort: (a) => a.id },
          { key: 'who', label: 'Employee', render: (a) => html`<${Who} p=${PO.person(a.who)} size="sm" sub=${PO.person(a.who).title} link=${false} />`, sort: (a) => PO.person(a.who).name, csv: (a) => PO.person(a.who).name },
          { key: 'kind', label: 'Type', render: (a) => a.kind, sort: (a) => a.kind },
          { key: 'amt', label: 'Amount', align: 'r', render: (a) => html`<span class="tnum">${fine(a.amt)}</span>`, sort: (a) => a.amt },
          { key: 'emi', label: 'EMI', align: 'r', render: (a) => html`<span class="tnum">${fine(a.emi)}</span>`, sort: (a) => a.emi },
          { key: 'prog', label: 'Repaid', render: (a) => html`<div style="min-width:120px"><${Progress} value=${(a.paid / a.inst) * 100} label=${`${a.paid}/${a.inst}`} /></div>`, sort: (a) => a.paid / a.inst, csv: (a) => `${a.paid}/${a.inst}` },
          { key: 'out', label: 'Outstanding', align: 'r', render: (a) => html`<span class="tnum w-500">${fine(outstanding(a))}</span>`, sort: outstanding },
          { key: 'next', label: 'Next recovery', render: (a) => { const s = scheduleOf(P, a).find((x) => x.st !== 'Recovered'); return s ? html`<span class="t-sm">${s.label}${s.st === 'This run' ? html` <span class="faint">(this run)</span>` : ''}</span>` : '—'; }, sort: false },
        ]} />
      <${AdvDrawer} a=${sel} onClose=${() => setSel(null)} />
    </div>`;
  }
  function deductionCheck(P, p, emi) {
    const wages = p.pay.gross;
    const total = r2(p.pay.dedTotal + emi);
    const pct = wages ? total / wages : 0;
    return { wages, total, pct, ok: pct <= 0.5 };
  }
  function AdvDrawer({ a, onClose }) {
    const P = PO.P();
    if (!a) return null;
    const p = PO.person(a.who);
    const sch = scheduleOf(P, a);
    const cur = sch.find((s) => s.st === 'This run') || sch.find((s) => s.st === 'Upcoming');
    const chk = deductionCheck(P, p, cur ? cur.amt : 0);
    return html`<${Drawer} open title=${`${a.kind} ${a.id}`} sub=${`${p.name}, issued ${PO.date(a.issued)}`} onClose=${onClose}
      footer=${html`<${Button} onClick=${() => PO.fakeDownload(`${a.id} repayment schedule`)}>Schedule PDF</${Button}><${Button} onClick=${() => PO.toast(`Early settlement quote sent to ${p.first}`)}>Settle early</${Button}><${Button} kind="primary" onClick=${onClose}>Done</${Button}>`}>
      <div class="col" style="gap:16px">
        <div class="row"><${Who} p=${p} sub=${p.title + ', ' + PO.site(p.site).name} /><span class="right"><${Badge} tone=${a.paid >= a.inst ? 'green' : 'amber'} dot>${a.paid >= a.inst ? 'Closed' : 'Recovering'}</${Badge}></span></div>
        <${KV} items=${[['Amount', fine(a.amt)], ['EMI', fine(a.emi) + ' × ' + a.inst], ['Interest', a.kind === 'Personal loan' ? '0% (staff scheme)' : 'None']]} />
        <div><div class="t-sm w-600" style="margin-bottom:8px">Repayment schedule</div>
          <table class="ex-emi"><tbody>${sch.map((s) => html`<tr class=${s.st === 'Recovered' ? 'done' : s.st === 'This run' ? 'now' : ''}><td style="width:60px">EMI ${s.n}</td><td>${s.label}</td><td>${s.st}</td><td style="text-align:right">${fine(s.amt)}</td></tr>`)}</tbody></table></div>
        ${P.id === 'in' ? html`<${Callout} tone=${chk.ok ? 'green' : 'red'} icon="Scale" title=${chk.ok ? 'Within the 50% deduction limit' : 'Breaks the 50% deduction limit'}>Total deductions this month are ${PO.money(chk.total)} (PF, ESI, PT and this EMI) against wages of ${PO.money(chk.wages)}: ${(chk.pct * 100).toFixed(1)}%. The Code on Wages caps deductions at 50% of wages.</${Callout}>`
          : P.id === 'uk' ? html`<div class="t-sm muted">Pay stays above the National Living Wage: after the ${fine(cur ? cur.amt : 0)} recovery, ${p.first}’s pay for the period is still above £12.71 an hour. Recoveries are agreed in writing, so they don’t count against NLW.</div>`
            : html`<div class="t-sm muted">Written authorization is on file: ${p.first} signed the repayment agreement. Texas allows the deduction with written consent, and pay stays above $7.25 an hour for the workweek.</div>`}
        <${KV} items=${[['Recovered so far', fine(r2(sch.filter((s) => s.st === 'Recovered').reduce((t, s) => t + s.amt, 0)))], ['Outstanding', fine(r2(sch.filter((s) => s.st !== 'Recovered').reduce((t, s) => t + s.amt, 0)))], ['Recovered through', 'Payroll deduction'], ['Agreement', 'E-signed in the employee portal']]} />
      </div>
    </${Drawer}>`;
  }
  function NewAdvance({ open, onClose }) {
    const P = PO.P();
    const [added, setAdded] = PO.useCoState('expenses.advAdded', []);
    const [who, setWho] = useState(P.hero.id);
    const [amt, setAmt] = useState(P.id === 'in' ? '6000' : '400');
    const [inst, setInst] = useState('3');
    const [kind, setKind] = useState('Salary advance');
    if (!open) return null;
    const p = PO.person(who);
    const v = parseFloat(amt) || 0;
    const n = +inst;
    const emi = P.id === 'in' ? Math.round(v / n) : r2(v / n);
    const chk = deductionCheck(P, p, emi);
    const cap = P.id === 'in' ? Math.round(p.pay.gross) : r2(p.pay.net);
    const tooBig = v > cap;
    const create = () => { const id = `ADV-${330 + added.length}`; setAdded([{ id, who, amt: v, inst: n, paid: 0, emi, issued: PO.TODAY, kind, fromNext: true }, ...added]); PO.toast(`${id}: ${fine(v)} paid to ${p.first}. First EMI in the next payroll.`, { icon: 'HandCoins' }); onClose(); };
    return html`<${Drawer} open title="New advance or loan" sub="Paid now, recovered from payroll" onClose=${onClose}
      footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!v || tooBig || (P.id === 'in' && !chk.ok)} onClick=${create}>Pay ${v ? fine(v) : ''} now</${Button}>`}>
      <div class="col" style="gap:14px">
        <${Field} label="Employee"><${Select} value=${who} onChange=${setWho} options=${P.people.slice().sort((a, b) => a.name.localeCompare(b.name)).map((q) => [q.id, `${q.name}, ${q.id}`])} /></${Field}>
        <${Field} label="Type"><${Segmented} value=${kind} onChange=${setKind} options=${[['Salary advance', 'Salary advance'], ['Personal loan', 'Personal loan']]} /></${Field}>
        <div class="grid g-2" style="gap:12px">
          <${Field} label="Amount" hint=${`Up to ${fine(cap)} (one ${P.id === 'in' ? 'month’s gross' : 'period’s net'})`}><input class="input tnum" value=${amt} onInput=${(e) => setAmt(e.target.value)} /></${Field}>
          <${Field} label="Instalments"><${Segmented} value=${inst} onChange=${setInst} options=${[['2', '2'], ['3', '3'], ['4', '4'], ['6', '6']]} /></${Field}>
        </div>
        <div>
          <div class="row"><span class="muted">EMI</span><b class="right tnum t-lg" style="font-family:var(--num)">${fine(emi)} × ${n}</b></div>
          <div class="row mt-8"><span class="muted">First recovery</span><span class="right">${P.id === 'in' ? 'October 2026 payroll' : P.id === 'us' ? 'Oct 23 check' : '6 Nov payday'}</span></div>
          <div class="row mt-8"><span class="muted">Take-home after EMI</span><span class="right tnum">${fine(r2(p.pay.net - emi))}</span></div>
        </div>
        ${tooBig ? html`<${Callout} tone="red" icon="CircleAlert" title="Above the advance limit">Advances are capped at ${fine(cap)} for ${p.first}.</${Callout}>`
          : P.id === 'in' ? html`<${Callout} tone=${chk.ok ? 'green' : 'red'} icon="Scale" title=${chk.ok ? `${(chk.pct * 100).toFixed(1)}% of wages: within the 50% limit` : `${(chk.pct * 100).toFixed(1)}% of wages: over the 50% limit`}>Deductions with this EMI come to ${PO.money(chk.total)} of ${PO.money(chk.wages)} wages. ${chk.ok ? '' : 'Spread it over more instalments.'}</${Callout}>`
            : html`<div class="t-sm muted">${p.first} gets the repayment agreement to e-sign in the employee portal before the money is sent.</div>`}
      </div>
    </${Drawer}>`;
  }

  PO.route('expenses', Expenses, { title: 'Expenses & advances' });
})();
