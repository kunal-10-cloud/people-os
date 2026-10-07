/* People OS: unified inbox (route `approvals`).
   One split view for every request that needs a yes or no: leave, missed punches, overtime, shift swaps,
   expenses, advances and the payroll sign-off. Decisions live in useCoState('approvals.decided') so Home,
   Payroll and the assistant all see the same state. Exports PO.pendingApprovals and PO.approvalItems. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect, useRef } = PO;
  /* core/shell.js defines PO.navCount but loads after the modules; queue registrations until it arrives. */
  if (!PO.navCount && !Object.getOwnPropertyDescriptor(PO, 'navCount')) {
    const queue = []; let real = null;
    Object.defineProperty(PO, 'navCount', { configurable: true, get: () => real || ((...a) => queue.push(a)), set: (fn) => { real = fn; queue.splice(0).forEach((a) => fn(...a)); } });
  }

  document.head.insertAdjacentHTML('beforeend', `<style>
  .ap-split { display: grid; grid-template-columns: 400px minmax(0, 1fr); height: calc(100vh - 300px); min-height: 460px; overflow: hidden; }
  .ap-list { border-right: 1px solid var(--border); display: flex; flex-direction: column; min-height: 0; }
  .ap-list-tools { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
  .ap-scroll { overflow-y: auto; flex: 1; min-height: 0; }
  .ap-row { display: grid; grid-template-columns: 16px 38px minmax(0, 1fr); gap: 10px; align-items: start; padding: 10px 14px 10px 12px; border-bottom: 1px solid var(--border); cursor: pointer; position: relative; }
  .ap-row:hover { background: var(--hover); }
  .ap-row.on { background: var(--surface-3); }
  .ap-row.on::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--brand); }
  .ap-row .check { padding-top: 2px; }
  .ap-row-top { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
  .ap-row-top b { font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ap-row-t { margin-top: 2px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; gap: 6px; align-items: center; }
  .ap-row-t .ap-warn { width: 6px; height: 6px; border-radius: 50%; background: var(--signal); flex: none; }
  .ap-sla { font-family: var(--num); font-size: 13px; white-space: nowrap; margin-left: auto; flex: none; color: var(--text-3); font-variant-numeric: tabular-nums; }
  .ap-sla.red { color: var(--red); } .ap-sla.amber { color: var(--amber); }
  .ap-detail { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
  .ap-detail-b { flex: 1; overflow-y: auto; padding: 20px 24px 24px; min-height: 0; }
  .ap-detail-in { max-width: 760px; }
  .ap-detail-f { display: flex; gap: 8px; align-items: center; padding: 12px 24px; border-top: 1px solid var(--border); background: var(--surface); flex-wrap: wrap; }
  .ap-meta { color: var(--text-2); font-size: 12.5px; margin-top: 4px; line-height: 1.5; }
  .ap-ask { margin-top: 8px; padding: 8px 0 16px; border-bottom: 1px solid var(--border); color: var(--text); line-height: 1.55; }
  .ap-facts { display: flex; flex-wrap: wrap; gap: 8px 32px; padding: 16px 0; border-bottom: 1px solid var(--border); }
  .ap-facts small { color: var(--text-3); font-size: 12px; display: block; }
  .ap-facts b { font-family: var(--num); font-size: 17px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ap-h4 { font-size: 12px; font-weight: 600; color: var(--text-2); margin: 24px 0 8px; display: flex; align-items: center; gap: 8px; }
  .ap-check { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 10px; padding: 6px 0; align-items: start; }
  .ap-check svg { margin-top: 1px; }
  .ap-check .ok { color: var(--green); } .ap-check .warn { color: var(--amber); } .ap-check .bad { color: var(--red); } .ap-check .info { color: var(--text-3); }
  .ap-files { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: var(--r); }
  .ap-file { display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 12px; border: none; border-bottom: 1px solid var(--border); background: none; cursor: pointer; text-align: left; color: var(--text); }
  .ap-file:last-child { border-bottom: none; }
  .ap-file:hover { background: var(--hover); }
  .ap-file svg { color: var(--text-3); flex: none; }
  .ap-stamp { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
  .ap-stamp.green { color: var(--green); } .ap-stamp.red { color: var(--red); }
  .ap-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .ap-face { position: relative; width: 36px; height: 36px; }
  .ap-face .av.lg { width: 36px; height: 36px; }
  .ap-face .chip-ic { position: absolute; right: -5px; bottom: -4px; width: 18px; height: 18px; border-radius: 6px; box-shadow: 0 0 0 2px var(--surface); }
  .ap-row.on .ap-face .chip-ic { box-shadow: 0 0 0 2px var(--surface-3); }
  .ap-face > .chip-ic.solo { position: static; width: 36px; height: 36px; border-radius: 10px; box-shadow: none; }
  .ap-who { display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 16px; border: 1px solid var(--border); border-radius: 12px; background: color-mix(in srgb, var(--brand-soft) 35%, var(--surface)); }
  .ap-who .av.lg { width: 44px; height: 44px; }
  .ap-who b { font-weight: 600; display: block; }
  .ap-who small { color: var(--text-2); font-size: 12px; display: block; }
  .ap-type { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-2); font-weight: 550; }
  @media (max-width: 1180px) { .ap-split { grid-template-columns: 330px minmax(0, 1fr); } }
  </style>`);

  /* ---------- helpers ---------- */
  const teamOf = (P, id) => { const acc = new Set(); const walk = (m) => (P.byManager[m] || []).forEach((x) => { if (!acc.has(x)) { acc.add(x); walk(x); } }); walk(id); return acc; };
  const leaveWord = (P) => (P.id === 'us' ? 'PTO' : P.id === 'uk' ? 'Holiday' : 'Leave');
  const chanWord = () => 'SMS';
  const notifyWord = (c) => (c === 'Email' ? 'email' : c === 'HR desk' ? 'email and SMS' : 'the employee portal and email');
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  const byName = (P, n) => P.people.find((p) => p.name === n) || null;
  const sickKey = (P) => (P.leaveTypes.find((t) => t.key === 'sl' || t.key === 'sick') || P.leaveTypes[0]).key;
  const firstKey = (P) => P.leaveTypes[0].key;
  const fmtMoney = (P, n) => { const C = P.company; const cents = C.currency !== 'INR' && !Number.isInteger(n); return new Intl.NumberFormat(C.locale, { style: 'currency', currency: C.currency, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n); };
  const otRate = (P) => { let h = 0, m = 0; P.people.forEach((p) => { if (p.pay.otHours) { h += p.pay.otHours; m += p.pay.otPay; } }); return h ? m / h : 0; };
  const hourly = (P, p) => { if (!p) return 0; const r = P.roles[p.role] || {}; if (r.rate) return r.rate; return p.pay.gross / (P.id === 'in' ? 26 * 8 : 80); };
  const waitText = (h) => (h < 1 ? 'Just now' : h < 24 ? `${Math.round(h)} h` : `${Math.floor(h / 24)} day${h >= 48 ? 's' : ''}`);
  const slaTone = (h) => (h >= 48 ? 'red' : h >= 24 ? 'amber' : 'slate');
  const unitOf = (P, key) => (PO.leaveType(key) || P.leaveTypes[0]).unit;

  const WHEN_H = { '2 days ago': 50, Yesterday: 22, Mon: 30, '3 h ago': 3, '1 h ago': 1 };
  const KIND_TYPE = { 'Missed punch': 'attendance', Overtime: 'overtime', Leave: 'leave', 'Time off': 'leave', Holiday: 'leave', Sickness: 'leave', 'Shift swap': 'swap', Advance: 'advance', Expense: 'expense' };
  const TYPE_ICON = { leave: 'Palmtree', attendance: 'Clock', overtime: 'Timer', swap: 'ArrowLeftRight', expense: 'Receipt', advance: 'HandCoins', payroll: 'Banknote' };
  const TYPE_ACCENT = { leave: 'teal', attendance: 'amber', overtime: 'violet', swap: 'blue', expense: 'rose', advance: 'green', payroll: 'green' };
  const TYPE_LABEL = (P) => ({ leave: leaveWord(P), attendance: 'Missed punch', overtime: 'Overtime', swap: 'Shift swap', expense: 'Expense', advance: 'Advance', payroll: 'Payroll' });

  function leaveChecks(P, p, key, from, to, amount, applied, covered) {
    const lt = PO.leaveType(key) || P.leaveTypes[0];
    const out = [];
    const site = p ? PO.site(p.site) : null;
    const bal = p && p.leave[key] ? p.leave[key].balance : null;
    if (bal != null) {
      const after = bal - amount;
      out.push(after >= 0 ? { tone: 'green', icon: 'Check', t: `Balance after approval: ${PO.num(after)} ${lt.unit}`, s: `${lt.name}: ${PO.num(bal)} ${lt.unit} left today. ${lt.accrual}` } : { tone: 'red', icon: 'X', t: `Not enough balance: ${PO.num(bal)} ${lt.unit} left, ${PO.num(amount)} asked`, s: `The extra ${PO.num(-after)} ${lt.unit} would be ${P.id === 'in' ? 'loss of pay' : 'unpaid'}` });
    } else out.push({ tone: 'blue', icon: 'Info', t: `${lt.name} has no fixed balance`, s: lt.accrual });
    if (site) {
      const others = P.leaveRequests.filter((l) => l.status === 'Approved' && l.who !== (p && p.id) && PO.person(l.who) && PO.person(l.who).site === p.site && l.from <= to && l.to >= from).length + (from === PO.TODAY ? P.outToday.filter((o) => site.name.startsWith(o[2]) || o[2].startsWith(site.name.split(' ')[0])).length : 0);
      const word = site.name.split(' ')[0];
      out.push(others >= 2 ? { tone: 'amber', icon: 'Users', t: `${others} others from ${word} are off that day`, s: `${site.name} needs ${P.live.find((l) => l.site === site.id)?.due || site.staff} people on ${PO.shiftOf(p.shift).label.toLowerCase()} shift` } : others === 1 ? { tone: 'green', icon: 'Users', t: `1 other from ${word} is off that day`, s: 'Within the site’s cover limit of 2' } : { tone: 'green', icon: 'Users', t: `No one else from ${word} is off that day`, s: 'Cover is not affected' });
    }
    if (covered) out.push({ tone: 'green', icon: 'ShieldCheck', t: 'Shift already covered', s: covered });
    else if (/sick|sl/i.test(key)) out.push({ tone: 'blue', icon: 'Stethoscope', t: 'No notice needed for sickness', s: P.id === 'uk' ? 'Self-certify up to 7 days, fit note after that' : P.id === 'us' ? 'Austin paid sick time: no doctor’s note under 3 days' : 'Medical certificate needed for more than 2 days' });
    else {
      const need = P.id === 'in' ? 1 : P.id === 'us' ? 3 : 14;
      const got = Math.max(0, daysBetween(applied > PO.TODAY ? PO.TODAY : applied, from));
      out.push(got >= need ? { tone: 'green', icon: 'CalendarCheck2', t: `${PO.plural(got, 'day')}’ notice`, s: `Policy asks for ${PO.plural(need, 'day')} (${P.id === 'in' ? 'Leave policy §3.2' : P.id === 'us' ? 'Handbook §4.1' : 'Staff handbook §6'})` } : { tone: 'amber', icon: 'CalendarClock', t: `Short notice: ${PO.plural(got, 'day')}`, s: `Policy asks for ${PO.plural(need, 'day')}. You can still approve.` });
    }
    return out;
  }

  /** Every approval item for a company, normalised. Cached per company. */
  const cache = {};
  function approvalItems(P) {
    if (cache[P.id]) return cache[P.id];
    const items = [];
    const T = P.totals;
    const chans = ['Portal', 'Portal', 'Email', 'HR desk', 'Portal', 'Email', 'Portal', 'HR desk'];
    const money = Object.fromEntries(P.money.map((m) => [m[0], m[3]]));
    P.approvals.forEach((a, i) => {
      const type = KIND_TYPE[a.kind] || 'leave';
      const p = a.who ? PO.person(a.who) : byName(P, a.whoName);
      const it = { id: a.id, src: 'planted', type, kind: a.kind, who: p ? p.id : null, whoName: p ? p.name : a.whoName, title: a.title, detail: a.detail, ask: a.ask, when: a.when, waitH: WHEN_H[a.when] ?? 4, channel: chans[i], site: p ? p.site : null, checks: [], files: [], facts: [], impact: [] };
      const siteName = p ? PO.site(p.site).name : '';
      if (type === 'attendance') {
        const daily = p ? (P.id === 'in' ? Math.round(p.pay.gross / 30) : Math.round(hourly(P, p) * 8 * 100) / 100) : 0;
        it.checks = [{ tone: 'green', icon: 'UserCheck', t: 'Supervisor confirmed the time', s: a.detail }, { tone: 'green', icon: 'ScanLine', t: P.id === 'in' ? 'Matches the gate register' : P.id === 'us' ? 'Matches the oven and POS log' : 'Matches the site pass log', s: 'Within 15 minutes of the scheduled shift end' }, { tone: 'blue', icon: 'Banknote', t: `Clears 1 of ${P.checks.punch.title} before payroll`, s: `Pay check for ${P.company.period}` }];
        it.impact = [['Pay protected', fmtMoney(P, daily)], ['Shift', p ? PO.shiftOf(p.shift).label : '—'], ['Hours fixed', P.id === 'in' ? '8 h' : '8 h']];
        it.files = [{ name: P.id === 'in' ? 'Gate register page.jpg' : P.id === 'us' ? 'Oven log.jpg' : 'Pass log export.pdf', size: '412 KB', kind: P.id === 'uk' ? 'pdf' : 'img' }];
        it.facts = [['Correction', a.ask.replace(/^Mark /, 'Mark ')], ['Raised by', p && PO.person(p.supervisor || p.manager) ? PO.person(p.supervisor || p.manager).name : 'Site supervisor']];
      } else if (type === 'overtime') {
        const h = +((a.title.match(/(\d+)\s*h/) || [])[1] || 0);
        const cost = Math.round(h * otRate(P));
        it.amount = cost; it.hours = h;
        it.checks = [{ tone: 'amber', icon: 'TrendingUp', t: P.checks.ot.title, s: P.checks.ot.text }, { tone: 'green', icon: 'Clock', t: 'Hours match clock-in records', s: `${h} h logged by device and supervisor` }, { tone: 'blue', icon: 'Scale', t: P.id === 'in' ? 'Paid at 2× the ordinary rate' : P.id === 'us' ? 'FLSA: 1.5× after 40 h in a workweek' : 'Paid at time and a half under the contract', s: P.id === 'in' ? 'Code on Wages, section 14' : P.id === 'us' ? 'Applies to non-exempt staff' : 'Above National Living Wage at every rate' }];
        it.impact = [['Cost this period', fmtMoney(P, cost)], ['Hours', `${h} h`], ['Billable to client', P.id === 'us' ? 'Catering orders' : 'Yes, per contract']];
        it.files = [{ name: P.id === 'us' ? 'Catering orders Sep 26 & Oct 3.pdf' : 'Client request for extra cover.pdf', size: '188 KB', kind: 'pdf' }, { name: 'Overtime sheet.xlsx', size: '36 KB', kind: 'xls' }];
        it.facts = [['Site', siteName], ['Hours', `${h} h`]];
      } else if (type === 'leave') {
        const sick = /sick/i.test(a.title + a.kind);
        const key = sick ? sickKey(P) : firstKey(P);
        const from = /today/i.test(a.title) ? PO.TODAY : P.id === 'us' ? '2026-10-09' : '2026-10-09';
        const amount = unitOf(P, key) === 'hours' ? 8 : 1;
        it.leave = { key, from, to: from, amount };
        const covered = /covered by ([^.]+)/i.exec(a.detail);
        it.checks = leaveChecks(P, p, key, from, from, amount, PO.addDays(PO.TODAY, -1), covered ? `Covered by ${covered[1]}` : null);
        it.facts = [['Type', (PO.leaveType(key) || {}).name], ['Dates', PO.date(from, { weekday: true })], ['Amount', `${amount} ${unitOf(P, key) === 'hours' ? 'h' : 'day'}`]];
        it.impact = [['Days', unitOf(P, key) === 'hours' ? `${amount} h` : `${amount} day`], ['Balance after', p && p.leave[key] && p.leave[key].balance != null ? `${PO.num(p.leave[key].balance - amount)} ${unitOf(P, key)}` : '—'], ['Pay impact', 'None (paid)']];
      } else if (type === 'swap') {
        const other = (a.title.match(/with (.+)$/) || [])[1];
        it.checks = [{ tone: 'green', icon: 'BadgeCheck', t: 'Both trained for the post', s: a.detail.split('.')[0] }, { tone: 'green', icon: 'Timer', t: 'No overtime either way', s: 'Both stay under 48 h this week' }, { tone: 'green', icon: 'BedDouble', t: P.id === 'uk' ? '11 h rest between shifts kept' : 'Rest gap of 12 h or more kept', s: P.id === 'uk' ? 'Working Time Regulations' : 'Roster rule' }];
        it.impact = [['Cost change', fmtMoney(P, 0)], ['Swap with', other || '—'], ['Shift', p ? PO.shiftOf(p.shift).label : '—']];
        it.facts = [['Swap with', other], ['Day', P.id === 'us' ? 'Thu, Oct 8' : 'Thu 8 Oct']];
      } else if (type === 'advance') {
        const amt = money.ap6 || 0;
        it.amount = amt;
        it.checks = [{ tone: 'green', icon: 'Scale', t: P.id === 'in' ? 'Within the 50% deduction limit' : 'Take-home stays above the minimum wage', s: a.detail }, { tone: 'amber', icon: 'Wallet', t: 'Money leaves today', s: 'Paid by bank transfer once approved, recovered from pay' }, { tone: 'green', icon: 'History', t: 'No open advance for this person', s: `${PO.plural(P.advances.length, 'advance')} open company-wide` }];
        it.impact = [['Amount', fmtMoney(P, amt)], ['Recovery', P.id === 'in' ? '2 months' : P.id === 'us' ? '2 checks' : '2 pay periods'], ['Per instalment', fmtMoney(P, Math.round(amt / 2))]];
        it.facts = [['Amount', fmtMoney(P, amt)], ['Repayment', a.detail]];
      } else if (type === 'expense') {
        const amt = money.ap7 || 0;
        it.amount = amt;
        it.checks = [{ tone: 'green', icon: 'Receipt', t: 'Receipt attached and readable', s: 'Amount, date and merchant match the claim' }, { tone: 'green', icon: 'Scale', t: 'Within policy', s: `Limit ${fmtMoney(P, P.id === 'in' ? 2500 : 120)} per claim` }, { tone: 'blue', icon: 'Banknote', t: `Paid with ${P.company.period} payroll`, s: 'As a non-taxable reimbursement' }];
        it.impact = [['Amount', fmtMoney(P, amt)], ['Category', P.id === 'us' ? 'Fuel' : P.id === 'uk' ? 'Parking' : 'Site supplies'], ['Paid with', 'This payroll']];
        it.files = [{ name: 'Receipt.jpg', size: '640 KB', kind: 'img' }];
      }
      items.push(it);
    });
    /* pending leave requests */
    P.leaveRequests.filter((l) => l.status === 'Pending').forEach((l) => {
      const p = PO.person(l.who); if (!p) return;
      const lt = PO.leaveType(l.type) || P.leaveTypes[0];
      const amount = lt.unit === 'hours' ? l.hours || l.days * 8 : l.days;
      const applied = l.applied > PO.TODAY ? PO.TODAY : l.applied;
      const range = l.from === l.to ? PO.date(l.from, { weekday: true }) : `${PO.date(l.from, { short: true })} – ${PO.date(l.to, { short: true })}`;
      items.push({ id: 'leave:' + l.id, src: 'leave', type: 'leave', kind: lt.name, who: p.id, whoName: p.name, title: `${lt.name}, ${range}`, detail: `${l.reason}. ${PO.plural(amount, lt.unit === 'hours' ? 'hour' : 'day')} requested.`, ask: `Approve ${lt.name.toLowerCase()}`, when: PO.rel(applied), waitH: Math.max(2, daysBetween(applied, PO.TODAY) * 24 + 5), channel: l.channel, site: p.site, leave: { key: l.type, from: l.from, to: l.to, amount }, checks: leaveChecks(P, p, l.type, l.from, l.to, amount, applied, null), files: l.days > 2 && /sick|sl/.test(l.type) ? [{ name: 'Medical certificate.pdf', size: '220 KB', kind: 'pdf' }] : [], facts: [['Type', lt.name], ['Dates', range], ['Reason', l.reason], ['Ref', l.id]], impact: [['Requested', `${PO.num(amount)} ${lt.unit}`], ['Balance after', p.leave[l.type] && p.leave[l.type].balance != null ? `${PO.num(p.leave[l.type].balance - amount)} ${lt.unit}` : '—'], ['Pay impact', lt.quota == null && /lop|unpaid/.test(l.type) ? 'Unpaid' : 'None (paid)']] });
    });
    /* submitted expenses */
    P.expenses.filter((e) => e.status === 'Submitted').forEach((e) => {
      const p = PO.person(e.who); if (!p) return;
      const over = e.policy === 'Over limit';
      items.push({ id: 'exp:' + e.id, src: 'expense', type: 'expense', kind: 'Expense', who: p.id, whoName: p.name, title: `${e.cat}, ${fmtMoney(P, e.amt)}`, detail: `${e.cat} on ${PO.date(e.date, { short: true })}${over ? '. Above the per-claim limit.' : '.'}`, ask: 'Approve expense', when: PO.rel(e.date), waitH: Math.max(3, daysBetween(e.date, PO.TODAY) * 24 + 2), channel: 'Portal', site: p.site, amount: e.amt, checks: [e.receipt ? { tone: 'green', icon: 'Receipt', t: 'Receipt attached', s: 'Amount and date match' } : { tone: 'amber', icon: 'FileX', t: 'No receipt attached', s: 'Ask for one or approve with a note' }, over ? { tone: 'red', icon: 'TriangleAlert', t: 'Over the per-claim limit', s: `Limit is ${fmtMoney(P, P.id === 'in' ? 2500 : 120)}; this claim is ${fmtMoney(P, e.amt)}` } : { tone: 'green', icon: 'Scale', t: 'Within policy', s: `Limit ${fmtMoney(P, P.id === 'in' ? 2500 : 120)} per claim` }, { tone: 'blue', icon: 'Banknote', t: `Paid with ${P.company.period} payroll`, s: 'Non-taxable reimbursement' }], files: e.receipt ? [{ name: `${e.id} receipt.jpg`, size: '510 KB', kind: 'img' }] : [], facts: [['Category', e.cat], ['Spent on', PO.date(e.date)], ['Ref', e.id]], impact: [['Amount', fmtMoney(P, e.amt)], ['Category', e.cat], ['Paid with', 'This payroll']] });
    });
    /* payroll sign-off */
    const last = P.payHistory[P.payHistory.length - 1], prev = P.payHistory[P.payHistory.length - 2];
    const ch = (last.net - prev.net) / prev.net;
    items.push({ id: 'payroll:' + last.id, src: 'payroll', type: 'payroll', kind: 'Payroll', who: null, whoName: 'People OS payroll', title: `Sign off payroll for ${P.company.period}`, detail: `Net ${fmtMoney(P, T.net)} to ${P.people.length} people, pay by ${P.company.payBy}. Drafted by People OS from the muster; your sign-off releases the bank file.`, ask: 'Approve payroll', when: 'Today', waitH: 2, channel: 'Web', site: null, amount: T.net, payroll: true, checks: [], files: [{ name: `Payroll register ${P.company.period}.xlsx`, size: '284 KB', kind: 'xls' }, { name: 'Variance report.pdf', size: '96 KB', kind: 'pdf' }], facts: [['Period', P.company.period], ['Pay date', P.company.payBy], ['Run', last.id]], impact: [['Net pay', PO.compactMoney(T.net)], ['Employer cost', PO.compactMoney(T.cost)], ['vs last run', `${ch >= 0 ? '+' : ''}${(ch * 100).toFixed(1)}%`]] });
    cache[P.id] = items;
    return items;
  }

  /** Items visible to the current viewer (manager: their team and site; admin: everything). */
  function scoped(P, role, viewerId) {
    const all = approvalItems(P);
    if (role !== 'manager') return all.filter((it) => it.who !== viewerId);
    const me = PO.person(viewerId);
    const team = teamOf(P, viewerId);
    return all.filter((it) => it.type !== 'payroll' && it.who !== viewerId && ((it.who && team.has(it.who)) || (me && it.site === me.site && it.who)));
  }
  const viewerIdOf = (state, P) => (state.role === 'manager' ? P.hero.manager || P.hrId : state.role === 'employee' ? P.hero.id : P.hrId);
  /** Payroll check list driven by approvals (shared with Home). */
  function payrollChecks(P, decided, state) {
    if (state && PO.payx && PO.payx.checksOf) return PO.payx.checksOf(state, P);
    const ok = (id) => decided[id] === 'approved';
    const g = (k, d) => (state ? PO.coGet(state, k, d) : d);
    const bank = !!(g('payroll.bankHold', false) || g('payroll.checks', {}).bank);
    const rule = !!(g('compliance.flagFixed', false) || g('compliance.ruleFixed', false) || g('payroll.checks', {}).rule);
    return [{ ...P.checks.punch, key: 'punch', doneText: P.checks.punch.done, done: ok('ap1') && ok('ap2') }, { ...P.checks.ot, key: 'ot', doneText: P.checks.ot.done, done: ok('ap3') }, { ...P.checks.bank, key: 'bank', doneText: P.checks.bank.done, done: bank }, { ...P.checks.rule, key: 'rule', doneText: P.checks.rule.done, done: rule }];
  }
  PO.approvalItems = approvalItems;
  PO.approvalScope = scoped;
  PO.payrollChecks = payrollChecks;
  PO.pendingApprovals = (state, P) => { const d = PO.coGet(state, 'approvals.decided', {}); return scoped(P, state.role, viewerIdOf(state, P)).filter((it) => !d[it.id]).length; };
  PO.navCount('approvals', (state, P) => (state.role === 'employee' ? 0 : PO.pendingApprovals(state, P)), true);

  /* ---------- UI pieces ---------- */
  const safeOf = (it) => it.type !== 'payroll' && !it.checks.some((c) => c.tone === 'amber' || c.tone === 'red');
  const fileIcon = (k) => (k === 'img' ? 'Image' : k === 'xls' ? 'Sheet' : 'FileText');
  const chanText = (c) => (c === 'HR desk' ? 'HR desk' : c === 'Email' ? 'Email' : c === 'Web' ? 'People OS' : 'Employee portal');
  const CHECK_IC = { green: ['CircleCheck', 'ok'], amber: ['CircleAlert', 'warn'], red: ['CircleX', 'bad'], blue: ['Info', 'info'] };

  function Row({ it, on, sel, onSel, onPick, decided, P }) {
    const warn = it.checks.filter((c) => c.tone === 'amber' || c.tone === 'red').length;
    const tone = slaTone(it.waitH);
    const lbl = TYPE_LABEL(P)[it.type];
    return html`<div class=${'ap-row ' + (on ? 'on' : '')} onClick=${onPick}>
      <label class="check" style="padding-top:10px" onClick=${(e) => e.stopPropagation()}><input type="checkbox" checked=${sel} disabled=${!!decided} onChange=${onSel} /></label>
      <span class="ap-face" title=${lbl}>${it.who ? html`<${PO.Avatar} p=${PO.person(it.who)} size="lg" /><${PO.Chip} icon=${TYPE_ICON[it.type] || 'Inbox'} accent=${TYPE_ACCENT[it.type] || 'green'} size=${11} />` : html`<span class=${'chip-ic solo ' + (TYPE_ACCENT[it.type] || 'green')}><${PO.Icon} n=${TYPE_ICON[it.type] || 'Inbox'} size=${17} /></span>`}</span>
      <div style="min-width:0">
        <div class="ap-row-top"><b>${it.whoName}</b><span class="faint t-sm ellipsis">${lbl}</span>
          ${decided ? html`<span class="right"><${PO.Status} s=${decided === 'approved' ? 'Approved' : 'Rejected'} /></span>` : html`<span class=${'ap-sla ' + tone}>${waitText(it.waitH)}</span>`}</div>
        <div class="ap-row-t">${!decided && warn ? html`<span class="ap-warn" title=${PO.plural(warn, 'check') + ' to review'}></span>` : null}<span class="ellipsis">${it.title}</span></div>
      </div>
    </div>`;
  }

  function Detail({ it, P, decided, onDecide, onUndo, onReject, onInfo, onDelegate, info, delegated, state }) {
    if (!it) return html`<div class="ap-detail"><${PO.Empty} icon="Inbox" title="Nothing selected" text="Pick a request on the left." /></div>`;
    const p = it.who ? PO.person(it.who) : null;
    const dec = decided[it.id];
    const tone = slaTone(it.waitH);
    const site = it.site ? PO.site(it.site) : null;
    const checks = it.type === 'payroll' ? payrollChecks(P, decided, state).map((c) => ({ tone: c.done ? 'green' : 'amber', t: c.done ? `${c.title}: resolved` : c.title, s: c.text })) : it.checks;
    const passed = checks.filter((c) => c.tone !== 'amber' && c.tone !== 'red').length;
    const supervisor = p && (PO.person(p.supervisor) || PO.person(p.manager));
    const tl = [
      { icon: 'ArrowDownToLine', title: it.channel === 'HR desk' ? 'Logged at the HR desk' : `Submitted via ${it.channel === 'Email' ? 'email' : it.channel === 'Web' ? 'People OS' : 'the employee portal'}`, sub: `${it.whoName}${it.channel === 'HR desk' ? ', entered by HR on their behalf' : ''}`, right: it.when },
      { icon: 'ListChecks', title: `${checks.length} policy checks run`, sub: `${passed} passed${checks.length - passed ? `, ${checks.length - passed} to review` : ''}`, right: it.when },
      it.waitH >= 24 ? { icon: 'Bell', title: 'Reminder sent to approver', sub: `By ${chanWord(P)} and email after 24 h`, right: 'This morning' } : null,
      info[it.id] ? { icon: 'MessageSquare', title: 'You asked for more information', sub: `“${info[it.id]}”`, right: 'Just now' } : null,
      delegated[it.id] ? { icon: 'Forward', title: `Delegated to ${delegated[it.id]}`, sub: 'They can approve on your behalf', right: 'Just now' } : null,
      dec ? { icon: dec === 'approved' ? 'Check' : 'X', tone: dec === 'approved' ? 'green' : 'red', title: dec === 'approved' ? 'Approved by you' : 'Rejected by you', sub: dec === 'approved' ? `${it.whoName.split(' ')[0]} was notified by ${notifyWord(it.channel)}` : 'The reason was shared with the requester', right: 'Just now' } : null,
    ].filter(Boolean);
    const approver = it.type === 'payroll' ? `You, then ${PO.person(P.topId).name}` : state.role === 'manager' ? 'You' : supervisor && supervisor.id !== P.hrId ? `${supervisor.name}, then HR` : 'You';
    return html`<div class="ap-detail">
      <div class="ap-detail-b"><div class="ap-detail-in">
        <div class="ap-who">
          ${p ? html`<${PO.Avatar} p=${p} size="lg" />` : html`<${PO.Chip} icon=${TYPE_ICON[it.type] || 'Inbox'} accent=${TYPE_ACCENT[it.type] || 'green'} size=${18} />`}
          <div class="grow" style="min-width:0">${p ? html`<b>${p.name}</b><small>${p.title}${site || PO.site(p.site) ? ` at ${(site || PO.site(p.site)).name}` : ''}${supervisor && supervisor.id !== p.id ? `, reports to ${supervisor.name}` : ''}</small>` : html`<b>${it.whoName}</b><small>${P.company.period}</small>`}</div>
          <span class="ap-type"><${PO.Chip} icon=${TYPE_ICON[it.type] || 'Inbox'} accent=${TYPE_ACCENT[it.type] || 'green'} size=${14} />${TYPE_LABEL(P)[it.type]}</span>
        </div>
        <div class="row" style="align-items:flex-start;gap:16px">
          <div class="grow" style="min-width:0">
            <h2 style="font-size:18px;font-weight:600;letter-spacing:-0.015em">${it.title}</h2>
            <div class="ap-meta">${p ? html`From <a class="link" href=${PO.href('people/' + p.id)}>${p.first || p.name.split(' ')[0]}</a>.` : html`${it.whoName}.`} Sent via ${chanText(it.channel).toLowerCase()}${dec ? '.' : html`, <span style=${tone === 'slate' ? '' : `color:var(--${tone === 'amber' ? 'amber' : 'red'})`}>waiting ${waitText(it.waitH)}${tone === 'red' ? ', past the 48 h SLA' : ''}</span>.`}${delegated[it.id] ? ` Delegated to ${delegated[it.id]}.` : info[it.id] && !dec ? ' More information requested.' : ''}</div>
          </div>
          <div class="row" style="flex:none;gap:8px">
            ${dec ? html`<span class=${'ap-stamp t-sm ' + (dec === 'approved' ? 'green' : 'red')}><${PO.Icon} n=${dec === 'approved' ? 'CircleCheck' : 'CircleX'} size=${15} />${dec === 'approved' ? 'Approved' : 'Rejected'} just now</span><${PO.Button} onClick=${() => onUndo(it)}>Reopen</${PO.Button}>` : html`
              <${PO.Menu} align="right" width=${240} trigger=${html`<${PO.IconButton} icon="Ellipsis" title="More actions" bordered />`} items=${[{ label: 'Request info', icon: 'MessageSquare', onClick: () => onInfo(it) }, ...(p ? [{ label: 'Open profile', icon: 'UserRound', onClick: () => PO.go('people/' + p.id) }] : []), '-', { header: 'Delegate to' }, ...delegates(P, it).map((d) => ({ label: d.name, hint: d.title, onClick: () => onDelegate(it, d.name) }))]} />
              <${PO.Button} onClick=${() => onReject(it)}>Reject</${PO.Button}>
              <${PO.Button} kind="primary" onClick=${() => onDecide(it, 'approved')}>${it.ask}</${PO.Button}>`}
          </div>
        </div>
        <div class="ap-ask">${it.detail}</div>
        <div class="ap-facts">${it.impact.map(([k, v]) => html`<div><small>${k}</small><b>${v}</b></div>`)}</div>

        <div class="ap-h4">Policy checks <span class="faint" style="font-weight:400">${passed} of ${checks.length} passed</span></div>
        <div>${checks.map((c) => { const [ic, cls] = CHECK_IC[c.tone] || CHECK_IC.blue; return html`<div class="ap-check"><${PO.Icon} n=${ic} size=${15} cls=${cls} /><div style="min-width:0"><span class="w-500">${c.t}</span>${c.s ? html`<span class="faint">. ${c.s}</span>` : null}</div></div>`; })}</div>
        ${it.type === 'payroll' ? html`<div class="mt-12"><a class="link t-sm" href=${PO.href('payroll')}>Open the payroll run</a></div>` : null}

        <div class="ap-h4">Details</div>
        <${PO.KV} items=${[...(it.facts || []).filter((f) => f[1]), ['Submitted', `${it.when} via ${chanText(it.channel).toLowerCase()}`], ['Approver', approver]]} />

        ${it.files.length ? html`<div class="ap-h4">Attachments</div><div class="ap-files">${it.files.map((f) => html`<button class="ap-file" onClick=${() => PO.toast(`Opened ${f.name}`, { icon: 'FileSearch' })}><${PO.Icon} n=${fileIcon(f.kind)} size=${15} /><span class="grow ellipsis">${f.name}</span><span class="faint t-sm tnum">${f.size}</span></button>`)}</div>` : null}

        <div class="ap-h4">Activity</div>
        <${PO.Timeline} items=${tl} />
      </div></div>
    </div>`;
  }
  const delegates = (P, it) => { const p = it.who && PO.person(it.who); const out = []; const add = (q) => q && !out.some((x) => x.id === q.id) && out.push(q); if (p) { add(PO.person(p.supervisor)); add(PO.person(p.manager)); } add(PO.person(P.topId)); P.people.filter((q) => q.role === 'office').slice(0, 3).forEach(add); return out.filter((q) => q.id !== P.hrId).slice(0, 4); };

  /* ---------- employee view: my requests ---------- */
  function MyRequests() {
    const P = PO.P();
    const me = P.hero;
    const rows = useMemo(() => [...P.leaveRequests.filter((l) => l.who === me.id).map((l) => ({ id: l.id, what: `${(PO.leaveType(l.type) || {}).name}, ${PO.date(l.from, { short: true })}${l.to !== l.from ? ' – ' + PO.date(l.to, { short: true }) : ''}`, status: l.status, on: l.applied, via: l.channel })), ...P.expenses.filter((e) => e.who === me.id).map((e) => ({ id: e.id, what: `${e.cat}, ${PO.money(e.amt)}`, status: e.status, on: e.date, via: 'Portal' }))], [P.id]);
    return html`<${PO.PageHeader} title="My requests" sub=${`${PO.plural(rows.length, 'request')}, ${rows.filter((r) => r.status === 'Pending' || r.status === 'Submitted').length} still open.`} actions=${html`<${PO.Button} kind="primary" href=${PO.href('my-leave')}>New request</${PO.Button}>`} />
      <${PO.DataTable} rows=${rows} columns=${[{ key: 'what', label: 'Request', render: (r) => html`<b class="w-500">${r.what}</b>` }, { key: 'id', label: 'Ref', render: (r) => html`<span class="faint tnum">${r.id}</span>` }, { key: 'on', label: 'Raised', render: (r) => PO.date(r.on, { short: true }) }, { key: 'via', label: 'Via' }, { key: 'status', label: 'Status', render: (r) => html`<${PO.Status} s=${r.status} />` }]} empty=${{ title: 'No requests yet', text: 'Leave and expense requests you raise will show here.' }} />`;
  }

  /* ---------- page ---------- */
  function Approvals({ query }) {
    const P = PO.P();
    const { state } = PO.useStore();
    if (state.role === 'employee') return html`<${MyRequests} />`;
    const viewerId = viewerIdOf(state, P);
    const [decided, setDecided] = PO.useCoState('approvals.decided', {});
    const [info, setInfo] = PO.useCoState('approvals.info', {});
    const [delegated, setDelegated] = PO.useCoState('approvals.delegated', {});
    const [tab, setTab] = useState(query.tab || 'all');
    const [q, setQ] = useState('');
    const [site, setSite] = useState('');
    const [who, setWho] = useState('');
    const [sort, setSort] = useState('oldest');
    const [sel, setSel] = useState(new Set());
    const [cur, setCur] = useState(query.id || null);
    const [reject, setReject] = useState(null);
    const [reason, setReason] = useState('');
    const [ask, setAsk] = useState(null);
    const [askText, setAskText] = useState('');
    const [confirmAsk, confirmEl] = PO.useConfirm();
    const items = useMemo(() => scoped(P, state.role, viewerId), [P.id, state.role]);
    const pending = items.filter((it) => !decided[it.id]);
    const count = (t) => pending.filter((it) => t === 'all' || it.type === t).length;
    const L = TYPE_LABEL(P);
    const tabs = [['all', 'All', count('all')], ['leave', `${leaveWord(P)}`, count('leave')], ['attendance', 'Attendance', count('attendance')], ['overtime', 'Overtime', count('overtime')], ['swap', 'Shift swaps', count('swap')], ['expense', 'Expenses', count('expense')], ['advance', 'Advances', count('advance')], ...(state.role === 'admin' ? [['payroll', 'Payroll', count('payroll')]] : []), ['decided', 'Decided', items.length - pending.length]];
    const shownTabs = tabs.filter(([k, , n]) => k === 'all' || k === 'decided' || k === tab || n > 0);
    let list = tab === 'decided' ? items.filter((it) => decided[it.id]) : pending.filter((it) => tab === 'all' || it.type === tab);
    if (q) { const t = q.toLowerCase(); list = list.filter((it) => (it.title + ' ' + it.whoName + ' ' + it.detail).toLowerCase().includes(t)); }
    if (site) list = list.filter((it) => it.site === site);
    if (who) list = list.filter((it) => it.who === who || it.whoName === who);
    list = list.slice().sort((a, b) => (sort === 'oldest' ? b.waitH - a.waitH : sort === 'newest' ? a.waitH - b.waitH : (b.amount || 0) - (a.amount || 0)));
    const current = list.find((it) => it.id === cur) || list[0] || null;
    const safe = pending.filter(safeOf).filter((it) => tab === 'all' || tab === 'decided' || it.type === tab);
    const requesters = [...new Map(items.map((it) => [it.who || it.whoName, it.whoName])).entries()];
    const sites = P.sites.filter((s) => items.some((it) => it.site === s.id));
    const notify = (it, v) => (v === 'approved' ? `${it.whoName.split(' ')[0]} was told on ${notifyWord(it.channel)}` : 'Reason shared with the requester');

    const decide = (it, v, why) => {
      const idx = list.findIndex((x) => x.id === it.id);
      setDecided((d) => ({ ...d, [it.id]: v }));
      const next = list[idx + 1] || list[idx - 1];
      if (tab !== 'decided' && next) setCur(next.id);
      setSel((s) => { const n = new Set(s); n.delete(it.id); return n; });
      PO.toast(`${v === 'approved' ? 'Approved' : 'Rejected'}: ${it.title}. ${notify(it, v)}${why ? '' : ''}`, { icon: v === 'approved' ? 'CircleCheck' : 'CircleX', action: { label: 'Undo', run: () => setDecided((d) => { const n = { ...d }; delete n[it.id]; return n; }) } });
    };
    const undo = (it) => { setDecided((d) => { const n = { ...d }; delete n[it.id]; return n; }); PO.toast(`Reopened: ${it.title}`, { icon: 'Undo2' }); };
    const bulk = (ids, v) => {
      setDecided((d) => { const n = { ...d }; ids.forEach((id) => (n[id] = v)); return n; });
      setSel(new Set());
      PO.toast(`${v === 'approved' ? 'Approved' : 'Rejected'} ${PO.plural(ids.length, 'request')}. Everyone was notified.`, { icon: 'CheckCheck', action: { label: 'Undo', run: () => setDecided((d) => { const n = { ...d }; ids.forEach((id) => delete n[id]); return n; }) } });
    };

    /* keyboard: j/k to move, a to approve */
    const ref = useRef({});
    ref.current = { list, current, decide, decided };
    useEffect(() => {
      const k = (e) => {
        if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey) return;
        const { list: l, current: c, decide: dec, decided: dd } = ref.current;
        const i = c ? l.findIndex((x) => x.id === c.id) : -1;
        if (e.key === 'j' && l[i + 1]) setCur(l[i + 1].id);
        if (e.key === 'k' && l[i - 1]) setCur(l[i - 1].id);
        if (e.key === 'a' && c && !dd[c.id]) dec(c, 'approved');
      };
      addEventListener('keydown', k); return () => removeEventListener('keydown', k);
    }, []);

    const oldest = pending.reduce((m, it) => Math.max(m, it.waitH), 0);
    const overdue = pending.filter((it) => it.waitH >= 48).length;
    const money = pending.filter((it) => (it.type === 'expense' || it.type === 'advance' || it.type === 'overtime')).reduce((t, it) => t + (it.amount || 0), 0);
    const allSel = list.length && list.filter((it) => !decided[it.id]).every((it) => sel.has(it.id));

    const decidedWeek = items.length - pending.length + 37;
    const under24 = pending.filter((it) => it.waitH < 24).length, mid = pending.filter((it) => it.waitH >= 24 && it.waitH < 48).length;
    const metaLine = `${PO.plural(pending.length, 'request')} waiting for a decision. Updated ${P.hhmm(P.company.nowMin)}.`;
    const moneyN = pending.filter((it) => it.amount && it.type !== 'payroll');
    const kpis = [
      { label: 'Waiting on you', icon: 'Inbox', accent: 'amber', faces: [...new Set(pending.filter((it) => it.who).map((it) => it.who))], value: pending.length, alert: overdue > 0, sub: overdue ? `${overdue} past the 48 h SLA, oldest ${waitText(oldest)}` : 'All within the 48 h SLA',
        bar: pending.length ? [{ v: under24, k: 'ok', title: `${under24} under a day` }, { v: mid, k: 'warn', title: `${mid} 1 to 2 days` }, { v: overdue, k: 'bad', title: `${overdue} over 48 h` }] : null },
      { label: 'Pass every check', icon: 'ShieldCheck', accent: 'green', value: pending.filter(safeOf).length, unit: `/${pending.length}`, sub: 'Safe to approve in one go', bar: pending.length ? [{ v: pending.filter(safeOf).length, k: 'ok', title: 'pass every check' }, { v: pending.length - pending.filter(safeOf).length, k: 'mute', title: 'need a look' }] : null },
      { label: 'Money waiting', icon: 'Wallet', accent: 'violet', value: PO.money(money, { compact: true }), sub: `${PO.plural(moneyN.filter((it) => it.type !== 'leave').length, 'overtime, expense or advance request', 'overtime, expense or advance requests')}` },
      { label: 'Decided this week', icon: 'CheckCheck', accent: 'teal', value: decidedWeek, sub: 'Median 6.2 h to decide' },
    ];
    return html`
      <${PO.PageHeader} title="Inbox" sub=${state.role === 'manager' ? `Requests from your team at ${PO.site(PO.person(viewerId).site).name}. ${metaLine}` : metaLine} actions=${html`
        <${PO.Menu} align="right" trigger=${html`<${PO.IconButton} icon="Ellipsis" title="More" bordered />`} items=${[
          { label: 'Export CSV', icon: 'Download', onClick: () => PO.exportCsv('approvals', [['Ref', 'Type', 'Requested by', 'Title', 'Waiting', 'Channel', 'Status'], ...items.map((it) => [it.id, L[it.type], it.whoName, it.title, waitText(it.waitH), it.channel, decided[it.id] || 'pending'])]) },
          { label: 'Approval rules', icon: 'Settings2', onClick: () => PO.go('settings/notifications') },
        ]} />
        <${PO.Button} kind="primary" disabled=${!safe.length} onClick=${() => confirmAsk({ title: `Approve ${PO.plural(safe.length, 'request')} that pass every check?`, icon: 'ShieldCheck', tone: 'green', body: html`<div>Enough balance, cover in place and within limits.<div class="col mt-12" style="gap:6px">${safe.map((it) => html`<div class="row t-sm"><${PO.Icon} n="Check" size=${13} style="color:var(--green)" /><span class="grow ellipsis"><b class="w-500">${it.whoName}</b>, ${it.title}</span></div>`)}</div></div>`, confirm: `Approve ${safe.length}`, onConfirm: () => bulk(safe.map((it) => it.id), 'approved') })}>Approve ${safe.length} that pass</${PO.Button}>`} />
      <div style="margin-bottom:16px"><${PO.KpiStrip} items=${kpis} /></div>
      <${PO.Tabs} tabs=${shownTabs} value=${tab} onChange=${(t) => { setTab(t); setSel(new Set()); setCur(null); }} />
      <div class="card" style="overflow:hidden">
        <div class="tbl-toolbar">
          <${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search requests" width=${220} />
          <select class="select" style=${`width:auto;min-width:130px;height:30px;${site ? 'border-color:var(--brand);color:var(--brand-text);background-color:var(--brand-soft)' : ''}`} value=${site} onChange=${(e) => setSite(e.target.value)}><option value="">Site: All</option>${sites.map((s) => html`<option value=${s.id}>${s.name}</option>`)}</select>
          <select class="select" style=${`width:auto;min-width:150px;height:30px;${who ? 'border-color:var(--brand);color:var(--brand-text);background-color:var(--brand-soft)' : ''}`} value=${who} onChange=${(e) => setWho(e.target.value)}><option value="">Requester: All</option>${requesters.map(([k, n]) => html`<option value=${k}>${n}</option>`)}</select>
          ${q || site || who ? html`<${PO.Button} kind="ghost" size="sm" onClick=${() => { setQ(''); setSite(''); setWho(''); }}>Clear</${PO.Button}>` : null}
          <span class="right"><select class="select" style="width:auto;height:30px" value=${sort} onChange=${(e) => setSort(e.target.value)}><option value="oldest">Oldest first</option><option value="newest">Newest first</option><option value="amount">Largest amount</option></select></span>
        </div>
        ${sel.size ? html`<div class="bulkbar"><span>${sel.size} selected</span><${PO.Button} size="sm" kind="primary" icon="Check" onClick=${() => bulk([...sel], 'approved')}>Approve ${sel.size}</${PO.Button}><${PO.Button} size="sm" icon="X" onClick=${() => bulk([...sel], 'rejected')}>Reject ${sel.size}</${PO.Button}><button class="btn ghost sm right" onClick=${() => setSel(new Set())}>Deselect</button></div>` : null}
        <div class="ap-split">
          <div class="ap-list">
            <div class="ap-list-tools"><label class="check"><input type="checkbox" checked=${!!allSel} disabled=${tab === 'decided' || !list.length} onChange=${() => setSel(allSel ? new Set() : new Set(list.filter((it) => !decided[it.id]).map((it) => it.id)))} /></label><span class="t-sm muted">${PO.plural(list.length, tab === 'decided' ? 'decision' : 'request')}</span><span class="right faint t-xs">${tab === 'decided' ? 'Most recent first' : html`<kbd>J</kbd> <kbd>K</kbd> to move, <kbd>A</kbd> to approve`}</span></div>
            <div class="ap-scroll">
              ${list.length ? list.map((it) => html`<${Row} it=${it} P=${P} on=${current && current.id === it.id} sel=${sel.has(it.id)} decided=${decided[it.id]} onPick=${() => setCur(it.id)} onSel=${() => setSel((s) => { const n = new Set(s); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n; })} />`) : tab === 'decided' ? html`<${PO.Empty} icon="History" title="Nothing decided yet" text="Approvals and rejections you make show up here, with Undo." />` : html`<${PO.Empty} icon="CheckCheck" title="Nothing waiting" text=${`No ${tab === 'all' ? '' : L[tab].toLowerCase() + ' '}requests${q || site || who ? ' match these filters' : ' need a decision'}.`} />`}
            </div>
          </div>
          <${Detail} it=${current} P=${P} state=${state} decided=${decided} info=${info} delegated=${delegated} onDecide=${decide} onUndo=${undo}
            onReject=${(it) => { setReject(it); setReason(''); }} onInfo=${(it) => { setAsk(it); setAskText(`Hi ${it.whoName.split(' ')[0]}, could you share ${it.type === 'expense' ? 'the itemised bill' : it.type === 'leave' ? 'who can cover your shift' : it.type === 'overtime' ? 'the client’s written request for the extra hours' : 'a little more detail'}?`); }}
            onDelegate=${(it, name) => { setDelegated((d) => ({ ...d, [it.id]: name })); PO.toast(`Delegated to ${name}`, { icon: 'Forward', action: { label: 'Undo', run: () => setDelegated((d) => { const n = { ...d }; delete n[it.id]; return n; }) } }); }} />
        </div>
      </div>
      <${PO.Modal} open=${!!reject} title=${reject ? `Reject: ${reject.title}` : ''} icon="CircleX" tone="red" onClose=${() => setReject(null)} footer=${html`<${PO.Button} onClick=${() => setReject(null)}>Cancel</${PO.Button}><${PO.Button} kind="danger solid" disabled=${!reason.trim()} onClick=${() => { decide(reject, 'rejected', reason); setReject(null); }}>Reject and notify</${PO.Button}>`}>
        <div class="col gap-12">
          <div>${reject ? reject.whoName.split(' ')[0] : ''} will see this reason on ${reject ? notifyWord(reject.channel) : ''}.</div>
          <div class="ap-chips">${['Not enough cover that day', 'Please apply with more notice', 'Over the policy limit', 'Duplicate request'].map((r) => html`<button class="filter-chip ${reason === r ? 'on' : ''}" onClick=${() => setReason(r)}>${r}</button>`)}</div>
          <textarea class="textarea" placeholder="Write a reason" value=${reason} onInput=${(e) => setReason(e.target.value)}></textarea>
        </div>
      </${PO.Modal}>
      <${PO.Modal} open=${!!ask} title="Request more information" icon="MessageSquareMore" tone="blue" onClose=${() => setAsk(null)} footer=${html`<${PO.Button} onClick=${() => setAsk(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" icon="Send" onClick=${() => { setInfo((d) => ({ ...d, [ask.id]: askText })); PO.toast(`Asked ${ask.whoName.split(' ')[0]} on ${ask.channel === 'Web' ? 'email' : ask.channel}. The request stays open.`, { icon: 'Send' }); setAsk(null); }}>Send</${PO.Button}>`}>
        <div class="col gap-12"><div>The request stays in your inbox and the SLA clock pauses until ${ask ? ask.whoName.split(' ')[0] : ''} replies.</div><textarea class="textarea" value=${askText} onInput=${(e) => setAskText(e.target.value)}></textarea></div>
      </${PO.Modal}>
      ${confirmEl}`;
  }

  PO.route('approvals', Approvals, { title: 'Inbox', wide: true });
})();
