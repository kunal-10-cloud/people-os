/* People OS: Compliance centre (route `compliance`) and Rules & policies (route `rules`).
   Compliance: health score, the planted rule flag with before/after per person, filing calendar and history,
   rule library with the law-change timeline, statutory registers and an alerts feed.
   Rules: "rules in plain language" composer with an impact preview, active rules with versions,
   policies (attendance, overtime, leave, expenses) and approval chains.
   Shared state written here: 'compliance.flagFixed' (bool, payroll/home may read it), 'rules.custom' (array). */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;
  const { Icon, Button, Card, Badge, Status, Stat, Tabs, DataTable, Drawer, Modal, Who, AvatarStack, Callout, Switch, Field, Select, Timeline, KV, Segmented, Progress, Empty, PageHeader, MonthCal } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .cmp-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(4, minmax(0, 1fr)); gap: 16px; }
  .cmp-score { display: flex; gap: 18px; align-items: center; padding: 16px 18px; }
  .cmp-score .ring span { font-size: 22px; letter-spacing: -0.02em; }
  .cmp-score small { color: var(--text-3); font-size: 12px; }
  .cmp-flag { }
  .cmp-auth { width: auto !important; min-width: 40px; padding: 0 6px; height: 26px; font-size: 10.5px; font-weight: 700; letter-spacing: .01em; }
  .cmp-by { display: inline-flex; align-items: center; gap: 6px; }
  .cmp-date { width: 40px; flex: none; text-align: center; line-height: 1.1; }
  .cmp-date b { display: block; font-family: var(--num); font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .cmp-date i { display: block; font-style: normal; font-size: 11px; color: var(--text-3); }
  .cmp-date.soon b { color: var(--signal); }
  .cmp-date.done b { color: var(--text-3); }
  .cmp-hrow { display: grid; grid-template-columns: 160px minmax(0, 1fr) 48px; gap: 12px; align-items: center; padding: 8px 16px; border-top: 1px solid var(--border); }
  .cmp-hrow:first-child { border-top: none; }
  .cmp-alert { display: flex; gap: 10px; align-items: flex-start; padding: 10px 16px; border-top: 1px solid var(--border); cursor: pointer; }
  .cmp-alert:first-child { border-top: none; }
  .cmp-alert:hover { background: var(--hover); }
  .cmp-alert .dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 6px; flex: none; background: var(--text-3); }
  .cmp-alert .dot.red { background: var(--red-solid); } .cmp-alert .dot.amber { background: var(--amber-solid); } .cmp-alert .dot.signal { background: var(--signal); }
  .cmp-breakdown { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
  .cmp-tile { border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px 14px; background: var(--surface-2); min-width: 0; }
  .cmp-tile .lbl { font-size: 12px; font-weight: 500; color: var(--text-3); display: flex; align-items: center; gap: 6px; }
  .cmp-tile .val { margin-top: 6px; font-weight: 550; font-size: 13.5px; line-height: 1.45; }
  .cmp-composer { border-radius: var(--r-lg); padding: 16px; border: 1px solid var(--border); background: var(--surface); }
  .cmp-composer textarea { font-size: 15px; min-height: 64px; background: var(--surface); }
  .cmp-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 12px; font-weight: 500; cursor: pointer; }
  .cmp-chip:hover { border-color: var(--border-strong); color: var(--text); }
  .cmp-chain { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
  .cmp-node { display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px 5px 6px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); font-size: 12.5px; white-space: nowrap; }
  .cmp-node.start { background: var(--surface-3); padding-left: 10px; color: var(--text-2); }
  .cmp-node.end { background: var(--surface); color: var(--text); padding-left: 10px; }
  .cmp-node .nic { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-3); color: var(--text-2); }
  .cmp-node small { color: var(--text-3); font-size: 11px; display: block; line-height: 1.1; }
  .cmp-arrow { color: var(--text-3); display: inline-flex; }
  .cmp-lane { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 12px; align-items: center; padding: 10px 0; border-top: 1px dashed var(--border); }
  .cmp-lane:first-child { border-top: none; }
  .cmp-cond { font-size: 12px; color: var(--text-2); display: flex; align-items: center; gap: 6px; }
  .cmp-letter { border: 1px solid var(--border); border-radius: var(--r); padding: 22px 26px; background: var(--surface); font-size: 13px; line-height: 1.65; }
  .cmp-letter h4 { font-size: 14px; margin: 14px 0 10px; }
  .cmp-letter p { margin: 0 0 10px; }
  .cmp-rule-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; }
  .cmp-rule-row:hover { background: var(--hover); }
  .cmp-rule-row:last-child { border-bottom: none; }
  .cmp-rule-ic { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; flex: none; background: var(--surface-3); color: var(--text-2); }
  .cmp-rule-ic.custom { background: var(--brand-soft); color: var(--brand-text); }
  .cmp-rule-row.off { opacity: .55; }
  .cmp-impact { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 20px; align-items: center; }
  .cmp-step-row { display: grid; grid-template-columns: 26px minmax(0, 1fr) 110px 32px; gap: 8px; align-items: center; margin-bottom: 8px; }
  .cmp-step-n { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-3); color: var(--text-2); font-size: 12px; font-weight: 600; }
  @media (max-width: 1280px) { .cmp-top { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cmp-top > :first-child { grid-column: span 2; } .cmp-breakdown { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  </style>`);

  /* ---------- small helpers ---------- */
  const D = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const daysTo = (iso) => Math.round((new Date(iso + 'T00:00:00Z') - new Date(PO.TODAY + 'T00:00:00Z')) / 864e5);
  const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dow = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay();
  const digits = (r, n) => Array.from({ length: n }, (_, i) => (i === 0 ? r.int(1, 9) : r.int(0, 9))).join('');
  const code = (r, n) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ234567'[r.int(0, 29)]).join('');
  const nextBiz = (iso) => { let d = iso; while (dow(d) === 0 || dow(d) === 6) d = PO.addDays(d, 1); return d; };
  const hourlyOf = (P, p) => { const r = P.roles[p.role] || {}; if (P.id === 'in') return (r.ot || 0) / 2; return r.rate || 0; };
  const flagged = (P) => P.people.filter((p) => p.flag);
  const relL = (iso) => { const r = PO.rel(iso); return /^(Today|Tomorrow|Yesterday|In )/.test(r) ? r.toLowerCase() : r; };
  const toNum = (s) => { const m = String(s).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/); return m ? +m[1] : 0; };

  /* ---------- filings: one deterministic list per company ---------- */
  function buildFilings(P) {
    const T = P.totals, H = P.payHistory, out = [];
    const r = PO.seeded('filings' + P.id);
    const hr = P.byId[P.hrId].name;
    const heads = P.people.length;
    const k = (i) => (H[i] ? H[i].gross / T.gross : 1);
    const add = (o) => out.push(o);
    if (P.id === 'in') {
      const pfAll = T.epf + T.erepf, pfWages = T.epf / 0.12;
      for (let m = 1; m <= 12; m++) {
        const hi = m + 2, f = hi <= 11 ? k(hi) : 1, est = hi > 11;
        const per = `${PO.MONS[m - 1]} 2026`;
        const [ny, nm] = m === 12 ? [2027, 1] : [2026, m + 1];
        add({ id: `pf-${m}`, type: 'PF ECR', name: 'PF ECR and challan', form: 'Electronic challan cum return', authority: 'EPFO', period: per, due: D(ny, nm, 15), amount: (pfAll + pfWages * 0.005) * f, est, ackPrefix: 'TRRN', lines: [['Employee share, 12%', T.epf * f], ['Employer EPF, 3.67%', T.erepf * f * 0.3058], ['Employer EPS, 8.33%', T.erepf * f * 0.6942], ['Admin charges, 0.5%', pfWages * 0.005 * f]] });
        add({ id: `esi-${m}`, type: 'ESI', name: 'ESI contribution', form: 'Monthly contribution challan', authority: 'ESIC', period: per, due: D(ny, nm, 15), amount: (T.esi + T.eresi) * f, est, ackPrefix: 'Challan', lines: [['Employee share, 0.75%', T.esi * f], ['Employer share, 3.25%', T.eresi * f]] });
        add({ id: `tds-${m}`, type: 'TDS deposit', name: 'TDS on salary deposit', form: 'Challan ITNS 281', authority: 'Income Tax Department', period: per, due: m === 3 ? D(2026, 4, 30) : D(ny, nm, 7), amount: (T.tds || 0) * f, est, ackPrefix: 'CIN', lines: [['TDS deducted from salaries', (T.tds || 0) * f]] });
        add({ id: `pt-${m}`, type: 'PT Maharashtra', name: 'Professional tax, Maharashtra', form: 'Form III return + challan (MTR-6)', authority: 'Maharashtra GST Dept', period: per, due: D(ny, nm, lastDay(ny, nm)), amount: T.pt * (m === 2 ? 1.5 : 1) * f, est, ackPrefix: 'GRN', lines: [['PT deducted', T.pt * (m === 2 ? 1.5 : 1) * f]] });
      }
      [['Q4 FY 2025-26', D(2026, 5, 31), 'Form 24Q (old Act)'], ['Q1 FY 2026-27', D(2026, 7, 31), 'Form 138'], ['Q2 FY 2026-27', D(2026, 10, 31), 'Form 138'], ['Q3 FY 2026-27', D(2027, 1, 31), 'Form 138']].forEach(([q, due, form], i) =>
        add({ id: `f138-${i}`, type: 'Form 138', name: `Quarterly TDS return, ${q}`, form, authority: 'Income Tax Department (TRACES)', period: q, due, amount: (T.tds || 0) * 3, ackPrefix: 'Token', lines: [['TDS reported for the quarter', (T.tds || 0) * 3]], qtr: true }));
      add({ id: 'f130', type: 'Form 130', name: 'Form 130 to employees (was Form 16)', form: 'Form 130, Part A and B', authority: 'Employees', period: 'FY 2025-26', due: D(2026, 6, 15), amount: null, ackPrefix: 'Issued' });
      [['Jan–Jun 2026', D(2026, 7, 15)], ['Jul–Dec 2026', D(2027, 1, 15)]].forEach(([h, due], i) => add({ id: `lwf-${i}`, type: 'LWF', name: `Labour welfare fund, ${h}`, form: 'Form A-1 + challan', authority: 'Maharashtra Labour Welfare Board', period: h, due, amount: heads * 100, ackPrefix: 'MLWB', lines: [[`Employee ₹25 × ${heads}`, heads * 25], [`Employer ₹75 × ${heads}`, heads * 75]] }));
      const eligible = P.people.filter((p) => p.pay.structure && p.pay.structure.total <= 21000).length;
      add({ id: 'bonus', type: 'Bonus Act', name: 'Statutory bonus payout, FY 2025-26', form: 'Payment of Bonus Act, 8.33%', authority: 'Employees', period: 'FY 2025-26', due: D(2026, 11, 30), amount: eligible * Math.round(7000 * 12 * 0.0833), ackPrefix: 'Paid', lines: [[`${eligible} eligible employees × ₹6,997`, eligible * 6997]] });
      add({ id: 'bonusD', type: 'Bonus Act', name: 'Bonus annual return', form: 'Form D', authority: 'Labour Commissioner', period: 'FY 2025-26', due: D(2027, 2, 1), amount: null, ackPrefix: 'Shram' });
      add({ id: 'clra', type: 'CLRA', name: 'CLRA annual return (principal employer)', form: 'Form XXV', authority: 'Labour Commissioner', period: '2026', due: D(2027, 2, 15), amount: null, ackPrefix: 'Shram' });
    }
    if (P.id === 'us') {
      const dep = T.fit + T.ss + T.erss + T.med + T.ermed;
      for (let i = -10; i <= 12; i++) {
        let pay = PO.addDays('2026-10-09', 14 * i);
        if (pay === '2027-01-01') pay = '2026-12-31';
        const w = dow(pay);
        const due = PO.addDays(pay, w >= 3 && w <= 5 ? (10 - w) % 7 || 7 : (5 - w + 7) % 7 || 7);
        const hi = 11 + i, f = hi >= 0 && hi <= 11 ? k(hi) : 1;
        add({ id: `ftd-${i}`, type: 'Federal deposit', name: 'Federal tax deposit (semiweekly)', form: 'EFTPS: withholding, Social Security, Medicare', authority: 'IRS', period: `Payday ${PO.date(pay, { short: true })}`, due, amount: dep * f, est: hi > 11, ackPrefix: 'EFT', lines: [['Federal income tax withheld', T.fit * f], ['Social Security, 6.2% + 6.2%', (T.ss + T.erss) * f], ['Medicare, 1.45% + 1.45%', (T.med + T.ermed) * f]] });
      }
      const qWages = T.gross * 6.5;
      const suta = (q) => P.people.reduce((t, p) => { const qw = p.pay.gross * 6.5; const before = Math.min(9000, qw * (q - 1)); return t + Math.max(0, Math.min(9000 - before, qw)) * 0.027; }, 0);
      [['Q1 2026', D(2026, 4, 30), 1], ['Q2 2026', D(2026, 7, 31), 2], ['Q3 2026', D(2026, 11, 2), 3], ['Q4 2026', D(2027, 2, 1), 4]].forEach(([q, due, n]) => {
        add({ id: `941-${n}`, type: 'Form 941', name: `Form 941, ${q}`, form: 'Employer’s quarterly federal tax return', authority: 'IRS', period: q, due, amount: dep * 6.5, ackPrefix: 'IRS ack', note: n === 3 ? 'Oct 31 falls on a Saturday, so the deadline moves to Monday.' : '', lines: [['Wages, tips and compensation', qWages], ['Total taxes reported', dep * 6.5]], qtr: true });
        add({ id: `twc-${n}`, type: 'Texas SUTA', name: `Texas unemployment tax (TWC), ${q}`, form: 'Form C-3 wage report', authority: 'Texas Workforce Commission', period: q, due, amount: suta(n), ackPrefix: 'TWC', lines: [['Taxable wages (first $9,000 each)', suta(n) / 0.027], ['Rate 2.7% (new employer)', suta(n)]], qtr: true });
      });
      add({ id: 'w2-25', type: 'W-2', name: 'W-2s to employees and SSA, 2025', form: 'Form W-2 / W-3', authority: 'SSA', period: '2025', due: D(2026, 2, 2), amount: null, ackPrefix: 'WFID' });
      add({ id: 'w2-26', type: 'W-2', name: 'W-2s to employees and SSA, 2026', form: 'Form W-2 / W-3', authority: 'SSA', period: '2026', due: D(2027, 2, 1), amount: null, ackPrefix: 'WFID', note: 'Jan 31 falls on a Sunday, so the deadline moves to Monday.' });
      add({ id: '940-26', type: 'FUTA', name: 'Form 940 (FUTA), 2026', form: 'Annual federal unemployment return', authority: 'IRS', period: '2026', due: D(2027, 2, 1), amount: heads * 42, ackPrefix: 'IRS ack', lines: [[`0.6% on first $7,000 × ${heads}`, heads * 42]] });
      const hires = P.people.filter((p) => p.joinedIso >= '2026-01-01').map((p) => ({ name: p.name, start: p.joinedIso }));
      P.onboarding.filter((o) => !o.who).forEach((o) => hires.push({ name: o.name, start: o.start }));
      hires.forEach((h, i) => add({ id: `nh-${i}`, type: 'New-hire report', name: `New-hire report: ${h.name}`, form: 'Texas Employer New Hire Reporting', authority: 'Texas OAG', period: `Started ${PO.date(h.start, { short: true })}`, due: PO.addDays(h.start, 20), amount: null, ackPrefix: 'TX NH' }));
    }
    if (P.id === 'uk') {
      const paye = T.tax + T.ni + T.erni;
      for (let i = -9; i <= 6; i++) {
        let pay = PO.addDays('2026-10-09', 28 * i);
        if (pay === '2027-01-01') pay = '2026-12-31';
        const hi = 11 + i, f = hi >= 0 && hi <= 11 ? k(hi) : 1;
        add({ id: `fps-${i}`, type: 'RTI FPS', name: 'Full Payment Submission', form: 'RTI FPS', authority: 'HMRC', period: `Payday ${PO.date(pay, { short: true })}`, due: pay, amount: paye * f, est: hi > 11, ackPrefix: 'IRmark', lines: [['PAYE income tax', T.tax * f], ['Employee NI', T.ni * f], ['Employer NI', T.erni * f]] });
      }
      for (let m = 1; m <= 15; m++) {
        const y = m > 12 ? 2027 : 2026, mm = ((m - 1) % 12) + 1;
        const tm = ((mm + 7) % 12) + 1;
        const f = m <= 10 ? k(Math.min(10, m + 1)) : 1;
        const label = `Tax month ${tm} (to 5 ${PO.MONS[mm - 1]})`;
        add({ id: `p32-${m}`, type: 'P32 payment', name: 'PAYE and NI payment to HMRC', form: 'Employer payment record (P32)', authority: 'HMRC', period: label, due: nextBiz(D(y, mm, 22)), amount: paye * f, est: m > 10, ackPrefix: 'Ref 961PH', lines: [['PAYE income tax', T.tax * f], ['Employee and employer NI', (T.ni + T.erni) * f]] });
        add({ id: `eps-${m}`, type: 'RTI EPS', name: 'Employer Payment Summary', form: 'RTI EPS: Employment Allowance, recoveries', authority: 'HMRC', period: label, due: D(y, mm, 19), amount: null, ackPrefix: 'IRmark' });
        add({ id: `pen-${m}`, type: 'Pension', name: 'Workplace pension contributions', form: 'NEST contribution schedule', authority: 'NEST', period: `${PO.MONS[(mm + 10) % 12]} deductions`, due: D(y, mm, 22), amount: (T.pen + T.erpen) * f, est: m > 10, ackPrefix: 'NEST', lines: [['Employee, 5%', T.pen * f], ['Employer, 3%', T.erpen * f]] });
      }
      add({ id: 'p60-26', type: 'P60', name: 'P60s to employees, 2025-26', form: 'P60 end of year certificate', authority: 'Employees', period: '2025-26', due: D(2026, 5, 31), amount: null, ackPrefix: 'Issued' });
      add({ id: 'p11d-26', type: 'P11D', name: 'P11D and P11D(b), 2025-26', form: 'Expenses and benefits', authority: 'HMRC', period: '2025-26', due: D(2026, 7, 6), amount: null, ackPrefix: 'Submission' });
      add({ id: 'c1a-26', type: 'P11D', name: 'Class 1A NIC payment, 2025-26', form: 'P11D(b) payment', authority: 'HMRC', period: '2025-26', due: D(2026, 7, 22), amount: 1184.4, ackPrefix: 'Ref 961PX' });
      add({ id: 'p60-27', type: 'P60', name: 'P60s to employees, 2026-27', form: 'P60 end of year certificate', authority: 'Employees', period: '2026-27', due: D(2027, 5, 31), amount: null, ackPrefix: 'Issued' });
      add({ id: 'p11d-27', type: 'P11D', name: 'P11D and P11D(b), 2026-27', form: 'Expenses and benefits', authority: 'HMRC', period: '2026-27', due: D(2027, 7, 6), amount: null, ackPrefix: 'Submission' });
    }
    const all = out.filter((x) => x.due >= '2026-01-01' && !(x.amount === 0));
    all.sort((a, b) => a.due.localeCompare(b.due));
    all.forEach((x) => {
      if (x.due < PO.TODAY) {
        x.filed = true;
        x.filedOn = PO.addDays(x.due, -r.int(0, 4));
        x.by = r.chance(0.82) ? hr : 'People OS (auto-filed)';
        const p = x.ackPrefix;
        x.ack = p === 'TRRN' ? `TRRN ${digits(r, 13)}` : p === 'Challan' ? `Challan ${digits(r, 14)}` : p === 'CIN' ? `CIN 0510308 ${x.filedOn.slice(8, 10)}${x.filedOn.slice(5, 7)}${x.filedOn.slice(2, 4)} ${digits(r, 5)}` : p === 'GRN' ? `GRN MH${digits(r, 9)}2627` : p === 'Token' ? `Token ${digits(r, 15)}` : p === 'MLWB' ? `MLWB/PN/${digits(r, 6)}` : p === 'EFT' ? `EFT ${digits(r, 15)}` : p === 'IRS ack' ? `Ack ${digits(r, 14)}` : p === 'TWC' ? `TWC ${digits(r, 10)}` : p === 'TX NH' ? `TXNH-${digits(r, 8)}` : p === 'WFID' ? `WFID ${digits(r, 9)}` : p === 'IRmark' ? `IRmark ${code(r, 8)}…${code(r, 4)}` : p === 'Ref 961PH' ? `961PH${digits(r, 8)}` : p === 'NEST' ? `NEST ${digits(r, 9)}` : p === 'Issued' ? `Issued to ${heads} employees` : p === 'Submission' ? `HMRC ${digits(r, 12)}` : p === 'Paid' ? 'Paid with salary' : `${p} ${digits(r, 10)}`;
      }
    });
    return all;
  }
  function filingStatus(x, filedMap) {
    if (x.filed || filedMap[x.id]) return 'Filed';
    const d = daysTo(x.due);
    if (d < 0) return 'Overdue';
    if (d <= 7) return 'Due soon';
    return 'Upcoming';
  }

  /* ---------- law-change timeline ---------- */
  function lawTimeline(P) {
    if (P.id === 'in') return [
      { d: '2027-04-01', t: 'Maharashtra rules under the OSH Code', s: 'Draft rules published; comments closed 30 Sep 2026. Expected to replace Shops & Establishments registers.', tone: 'slate', icon: 'Eye', up: true },
      { d: '2026-09-17', t: 'EPF wage ceiling raised to ₹25,000', s: 'Was ₹15,000. Employees earning up to ₹25,000 must now join EPS. People OS updated PF for every payroll from September.', tone: 'brand', icon: 'TrendingUp' },
      { d: '2026-04-01', t: 'Income-tax Act 2025 in force', s: 'Form 16 becomes Form 130 and Form 24Q becomes Form 138. Tax tables and payslip labels updated.', tone: 'blue', icon: 'Landmark' },
      { d: '2025-11-21', t: 'Four Labour Codes notified', s: 'Code on Wages, Industrial Relations, Social Security and OSH. Wages at least 50% of pay, overtime at 2×, full & final within 2 working days.', tone: 'amber', icon: 'Scale' },
      { d: '2023-04-01', t: 'Maharashtra professional tax slabs', s: '₹200 a month, ₹300 in February. Women earning up to ₹25,000 exempt.', tone: 'slate', icon: 'MapPin' },
      { d: '2019-07-01', t: 'ESI rates cut to 0.75% / 3.25%', s: 'From 1.75% / 4.75%. Coverage up to ₹21,000 a month.', tone: 'slate', icon: 'HeartPulse' },
    ];
    if (P.id === 'us') return [
      { d: '2027-01-01', t: 'Social Security wage base for 2027', s: 'SSA announces the new base in October. People OS stops the 6.2% when each person reaches it.', tone: 'slate', icon: 'Eye', up: true },
      { d: '2026-01-01', t: 'Social Security wage base $184,500', s: 'Up from $176,100 in 2025. 2026 Form W-4 and Publication 15-T withholding tables applied.', tone: 'brand', icon: 'TrendingUp' },
      { d: '2025-01-20', t: 'New Form I-9 edition (01/20/25)', s: 'Older editions no longer accepted for new hires. Remote document review via E-Verify still allowed.', tone: 'blue', icon: 'IdCard' },
      { d: '2024-11-15', t: 'DOL salary threshold rule vacated', s: 'A Texas federal court struck down the $844 and $1,128 thresholds. The exemption stays at $684 a week.', tone: 'amber', icon: 'Gavel' },
      { d: '2020-01-01', t: 'FLSA exemption threshold $684 a week', s: 'Salaried staff below it are non-exempt and owed overtime.', tone: 'slate', icon: 'Scale' },
      { d: '2009-07-24', t: 'Federal minimum wage $7.25', s: 'Texas follows the federal rate. Tipped wage $2.13 with tip credit.', tone: 'slate', icon: 'DollarSign' },
    ];
    return [
      { d: '2027-04-01', t: 'National Living Wage review', s: 'The Low Pay Commission recommends the April 2027 rate in the autumn. People OS will flag anyone who would fall below it.', tone: 'slate', icon: 'Eye', up: true },
      { d: '2026-04-06', t: 'Fair Work Agency starts enforcing', s: 'One body for holiday pay, minimum wage and agency workers. Holiday records must be kept for 6 years.', tone: 'brand', icon: 'Building2' },
      { d: '2026-04-01', t: 'National Living Wage £12.71', s: 'Was £12.21. Uniform and equipment deductions can’t take pay below it.', tone: 'amber', icon: 'TrendingUp' },
      { d: '2025-04-06', t: 'Employer NI 15% above £5,000', s: 'Was 13.8% above £9,100. Employment Allowance rose to £10,500.', tone: 'blue', icon: 'Landmark' },
      { d: '2024-04-06', t: 'Employee NI cut to 8%', s: 'Main rate between £12,570 and £50,270.', tone: 'slate', icon: 'Percent' },
      { d: '2024-04-01', t: 'Holiday for irregular-hours workers', s: '12.07% of hours worked, with rolled-up holiday pay allowed.', tone: 'slate', icon: 'Palmtree' },
    ];
  }

  /* ---------- statutory registers ---------- */
  function buildRegisters(P) {
    const ppl = P.people;
    const site = (p) => PO.site(p.site).name;
    const T = (s) => s;
    const contract = ppl.filter((p) => p.contractor);
    const night = ppl.filter((p) => p.shift === 'C');
    const ot = ppl.filter((p) => p.pay.otHours > 0);
    const m = PO.money;
    if (P.id === 'in') return [
      { id: 'wage', name: 'Register of wages', form: 'Form XVII style (Code on Wages)', period: 'September 2026', count: ppl.length, last: '2026-09-02', status: 'Pending', note: 'Generates when September payroll is locked', cols: ['Employee', 'Days paid', 'Basic', 'HRA', 'OT', 'Gross', 'PF', 'ESI', 'PT', 'Net'], row: (p) => [p.pay.work, m(p.pay.earn[0].amt), m(p.pay.earn[1].amt), m(p.pay.otPay), m(p.pay.gross), m(p.pay.ded.find((x) => x.k === 'epf')?.amt || 0), m(p.pay.ded.find((x) => x.k === 'esi')?.amt || 0), m(p.pay.ded.find((x) => x.k === 'pt')?.amt || 0), m(p.pay.net)] },
      { id: 'muster', name: 'Muster roll', form: 'Form XVI style attendance', period: 'September 2026', count: ppl.length, last: '2026-10-01', status: 'Up to date', cols: ['Employee', 'Site', 'Shift', 'Days present', 'Loss of pay', 'Night shifts'], row: (p) => [site(p), p.shift, p.pay.work, p.pay.unpaid, p.u.nights || 0] },
      { id: 'ot', name: 'Overtime register', form: 'Form XIX style (2× rate)', period: 'September 2026', count: ot.length, last: '2026-10-01', status: 'Up to date', people: ot, cols: ['Employee', 'Site', 'OT hours', 'Rate', 'OT paid'], row: (p) => [site(p), p.pay.otHours, m(P.roles[p.role].ot) + '/h', m(p.pay.otPay)] },
      { id: 'adv', name: 'Register of deductions and advances', form: 'Form XX / XXII style', period: 'September 2026', count: P.advances.length, last: '2026-10-01', status: 'Up to date', people: P.advances.map((a) => P.byId[a.who]), cols: ['Employee', 'Advance', 'Instalments', 'Recovered', 'Balance'], row: (p) => { const a = P.advances.find((x) => x.who === p.id); return [m(a.amt), a.inst, `${a.paid} of ${a.inst}`, m(a.amt - a.paid * a.emi)]; } },
      { id: 'fines', name: 'Register of fines', form: 'Form I style', period: 'September 2026', count: 0, last: '2026-10-01', status: 'Up to date', note: 'Nil register: no fines this month', cols: ['Employee', 'Act or omission', 'Fine'], row: () => [] },
      { id: 'leave', name: 'Leave register', form: 'Maharashtra S&E Form O', period: '2026', count: ppl.length, last: '2026-10-01', status: 'Up to date', cols: ['Employee', 'CL left', 'SL left', 'EL left', 'LOP taken'], row: (p) => [p.leave.cl.balance, p.leave.sl.balance, p.leave.el.balance, p.leave.lop.taken] },
      { id: 'clra12', name: 'Register of contractors', form: 'CLRA Form XII', period: '2026', count: P.contractors.length, last: '2026-09-30', status: 'Up to date', people: [], cols: ['Contractor', 'Nature of work', 'Workers', 'Licence'], rowsRaw: P.contractors.map((c) => [c.name, /Swachh/.test(c.name) ? 'Deep cleaning' : 'Security and housekeeping', /Swachh/.test(c.name) ? '6' : String(contract.length), c.rows.find((x) => /Licence/.test(x[0]))?.[1] || '—']) },
      { id: 'clra13', name: 'Register of workmen employed by contractor', form: 'CLRA Form XIII', period: 'September 2026', count: contract.length, last: '2026-09-04', status: 'Needs review', note: 'Shield Manpower’s September PF proof is missing', people: contract, cols: ['Workman', 'Contractor', 'Site', 'UAN', 'Joined'], row: (p) => [p.contractor.split(' ')[0], site(p), p.ids.uan, PO.date(p.joinedIso)] },
    ];
    if (P.id === 'us') {
      const tipped = ppl.filter((p) => p.pay.extra > 0);
      return [
        { id: 'i9', name: 'Form I-9 audit', form: 'IRCA, 8 CFR 274a.2', period: 'All current employees', count: ppl.length, last: '2026-09-15', status: 'Up to date', cols: ['Employee', 'Hire date', 'Section 2 by', 'Status', 'Keep until'], row: (p) => [PO.date(p.joinedIso), PO.date(PO.addDays(p.joinedIso, 3)), p.ids.i9, 'Employment + 1 yr'] },
        { id: 'flsa', name: 'FLSA payroll records', form: '29 CFR Part 516', period: 'Sep 21 – Oct 4', count: ppl.length, last: '2026-10-05', status: 'Up to date', cols: ['Employee', 'Hours', 'Rate', 'OT hours', 'Gross'], row: (p) => [p.pay.work, P.roles[p.role].rate ? m(P.roles[p.role].rate, { cents: true }) : 'Salaried', p.pay.otHours, m(p.pay.gross, { cents: true })] },
        { id: 'exempt', name: 'Exempt status review', form: 'FLSA §13(a)(1) salary test', period: '2026', count: ppl.filter((p) => P.roles[p.role].salary).length, last: '2026-10-05', status: 'Action needed', note: '2 supervisors below $684 a week', people: ppl.filter((p) => P.roles[p.role].salary), cols: ['Employee', 'Weekly salary', 'Test', 'Status'], row: (p) => [m(P.roles[p.role].salary / 2), '$684 a week', p.flag ? 'Below threshold' : 'Exempt'] },
        { id: 'tips', name: 'Tip records', form: 'IRS Form 4070 / tip credit', period: 'Sep 21 – Oct 4', count: tipped.length, last: '2026-10-05', status: 'Up to date', people: tipped, cols: ['Employee', 'Location', 'Card tips', 'Hours'], row: (p) => [site(p), m(p.pay.extra, { cents: true }), p.pay.work] },
        { id: 'osha', name: 'OSHA 300 injury log', form: 'OSHA Forms 300, 300A, 301', period: '2026', count: 0, last: '2026-02-01', status: 'Up to date', note: 'No recordable injuries this year. 300A was posted Feb 1 – Apr 30.', cols: ['Case', 'Employee', 'Injury'], row: () => [] },
        { id: 'nh', name: 'New-hire reporting log', form: 'Texas Family Code §234.101', period: '2026', count: ppl.filter((p) => p.joinedIso >= '2026-01-01').length, last: '2026-09-29', status: 'Due soon', note: 'Ethan Park due Oct 18', people: ppl.filter((p) => p.joinedIso >= '2026-01-01'), cols: ['Employee', 'Started', 'Report due', 'Status'], row: (p) => [PO.date(p.joinedIso), PO.date(PO.addDays(p.joinedIso, 20)), p.joiner ? 'Not yet reported' : 'Reported'] },
      ];
    }
    const timeLimited = ppl.filter((p, i) => i % 9 === 4);
    const optOut = ppl.filter((p) => (p.u.ot || 0) >= 12);
    const irregular = ppl.filter((p) => p.type === 'Part-time');
    return [
      { id: 'rtw', name: 'Right to work records', form: 'Immigration, Asylum and Nationality Act 2006', period: 'All current employees', count: ppl.length, last: '2026-09-28', status: 'Due soon', note: `${Math.min(3, timeLimited.length)} follow-up checks in the next 60 days`, cols: ['Employee', 'Check', 'Checked on', 'Follow-up'], row: (p) => [timeLimited.includes(p) ? 'Share code (time-limited)' : p.joiner ? 'Share code' : 'Passport / BRP', PO.date(p.joinedIso), timeLimited.includes(p) ? PO.date(PO.addDays(PO.TODAY, 20 + (p.id.charCodeAt(4) % 40))) : 'None needed'] },
      { id: 'wto', name: 'Working time opt-outs', form: 'Working Time Regulations 1998, reg 5', period: '2026', count: optOut.length, last: '2026-09-07', status: 'Up to date', people: optOut, cols: ['Employee', 'Site', 'Avg weekly hours', 'Opt-out signed'], row: (p) => [site(p), ((p.u.hours + (p.u.ot || 0)) / 4).toFixed(1), PO.date(PO.addDays(p.joinedIso, 2))] },
      { id: 'night', name: 'Night worker health assessments', form: 'Working Time Regulations 1998, reg 7', period: '2026', count: night.length, last: '2026-08-14', status: 'Needs review', note: '4 annual assessments due this month', people: night, cols: ['Employee', 'Site', 'Night hours', 'Next assessment'], row: (p, i) => [site(p), p.u.nights, PO.date(PO.addDays('2026-10-08', i * 23))] },
      { id: 'hol', name: 'Holiday records', form: 'Working Time Regulations, 12.07% accrual', period: '2026-27', count: ppl.length, last: '2026-10-05', status: 'Up to date', cols: ['Employee', 'Type', 'Entitlement', 'Taken', 'Left'], row: (p) => [p.type, p.leave.hol.quota, p.leave.hol.taken, p.leave.hol.balance] },
      { id: 'pen', name: 'Auto-enrolment records', form: 'Pensions Act 2008', period: '2026-27', count: ppl.filter((p) => p.pay.ded.some((x) => x.k === 'pen' && x.amt > 0)).length, last: '2026-10-05', status: 'Up to date', people: ppl.filter((p) => p.pay.ded.some((x) => x.k === 'pen' && x.amt > 0)), cols: ['Employee', 'Enrolled', 'Employee 5%', 'Employer 3%'], row: (p) => [PO.date(PO.addDays(p.joinedIso, 30)), m(p.pay.ded.find((x) => x.k === 'pen').amt, { cents: true }), m(p.pay.er.find((x) => x.k === 'erpen').amt, { cents: true })] },
      { id: 'nlw', name: 'National Living Wage check', form: 'National Minimum Wage Regulations 2015', period: '7 Sep – 4 Oct', count: ppl.length, last: '2026-10-05', status: 'Action needed', note: '6 cleaners below £12.71 after uniform deduction', people: [...ppl.filter((p) => p.flag), ...ppl.filter((p) => !p.flag)], cols: ['Employee', 'Hours', 'Pay for NLW', 'Effective rate'], row: (p) => { const b = p.pay.earn[0].amt - (p.flag ? 25 : 0); const h = p.u.hours || 160; return [h, m(b, { cents: true }), m(b / h, { cents: true })]; } },
    ];
  }

  /* ---------- alerts + health ---------- */
  function useCompliance() {
    const P = PO.P();
    const [fixed] = PO.useCoState('compliance.flagFixed', false);
    const [filedMap] = PO.useCoState('compliance.filed', {});
    const [regGen] = PO.useCoState('compliance.registers', {});
    const [custom] = PO.useCoState('rules.custom', []);
    const filings = useMemo(() => buildFilings(P), [P.id]);
    const registers = useMemo(() => buildRegisters(P), [P.id]);
    const regs = registers.map((g) => {
      let status = regGen[g.id] ? 'Up to date' : g.status;
      if (g.status === 'Action needed' && fixed && (g.id === 'exempt' || g.id === 'nlw')) status = 'Up to date';
      return { ...g, status, last: regGen[g.id] || g.last, note: status === 'Up to date' && g.status !== 'Up to date' ? '' : g.note };
    });
    const docs = P.people.flatMap((p) => p.docs.map((d) => ({ ...d, who: p.id })));
    const docBad = docs.filter((d) => d.status === 'Expired' || d.status === 'Missing');
    const fl = flagged(P);
    const open = [];
    if (!fixed) open.push({ id: 'flag', sev: 'high', icon: 'Scale', title: P.ruleFlag.title, sub: `Found while checking ${P.company.period} payroll`, href: 'compliance', tone: 'amber' });
    open.push({ id: 'ctr', sev: 'high', icon: 'HardHat', title: P.contractorNeed.t, sub: P.contractorNeed.d, href: 'contractors', tone: 'red' });
    if (docBad.length) open.push({ id: 'docs', sev: 'med', icon: 'FileWarning', title: `${PO.plural(docBad.length, 'employee document')} missing or expired`, sub: [...new Set(docBad.map((d) => d.name))].slice(0, 3).join(', '), href: 'documents', tone: 'amber' });
    const withStatus = filings.map((x) => ({ ...x, status: filingStatus(x, filedMap), ack: x.ack || (filedMap[x.id] && filedMap[x.id].ack), filedOn: x.filedOn || (filedMap[x.id] && filedMap[x.id].at), by: x.by || (filedMap[x.id] && filedMap[x.id].by) }));
    const due30 = withStatus.filter((x) => x.status !== 'Filed' && daysTo(x.due) <= 30);
    const regOk = regs.filter((g) => g.status === 'Up to date').length;
    const timeline = lawTimeline(P);
    const changesThisYear = timeline.filter((t) => t.d.startsWith('2026') && !t.up).length + custom.length;
    const hist = withStatus.filter((x) => x.status === 'Filed');
    const parts = [
      { k: 'Filings on time', v: hist.length ? hist.filter((x) => !x.filedOn || x.filedOn <= x.due).length / hist.length : 1, icon: 'CalendarCheck2', sub: `${hist.length} filed this year` },
      { k: 'Pay structures', v: fixed ? 1 : 1 - fl.length / P.people.length, icon: 'Scale', sub: fixed ? 'All within the rules' : `${fl.length} need a fix` },
      { k: 'Registers', v: regOk / regs.length, icon: 'BookOpenCheck', sub: `${regOk} of ${regs.length} up to date` },
      { k: 'Contractors', v: P.contractors.reduce((t, c) => t + (c.status === 'ok' ? 1 : c.status === 'warn' ? 0.6 : 0.3), 0) / P.contractors.length, icon: 'HardHat', sub: `${P.contractors.filter((c) => c.status !== 'ok').length} need attention` },
      { k: 'Documents', v: 1 - docBad.length / docs.length, icon: 'FileCheck2', sub: `${PO.num(docs.length - docBad.length)} of ${PO.num(docs.length)} on file` },
    ];
    const score = Math.round((parts.reduce((t, x) => t + x.v, 0) / parts.length) * 100);
    return { P, fixed, filings: withStatus, registers: regs, open, due30, regOk, changesThisYear, timeline, parts, score, docBad, custom };
  }

  /* ---------- flag card ---------- */
  function FlagCard({ initLetters }) {
    const P = PO.P();
    const F = P.ruleFlag;
    const [fixed, setFixed] = PO.useCoState('compliance.flagFixed', false);
    const [letters, setLetters] = useState(!!initLetters);
    const [all, setAll] = useState(false);
    const people = flagged(P);
    if (fixed) return html`<${Callout} tone="green" icon="CircleCheck" title="Fixed and applied to this payroll" action=${html`<${Button} size="sm" onClick=${() => { setFixed(false); PO.toast('Change undone. The flag is open again.', { icon: 'Undo2' }); }}>Undo</${Button}>`}>${F.done}</${Callout}>`;
    const impactCol = F.cols.length - 1;
    const total = people.reduce((t, p) => t + toNum(F.row(p, p.pay)[impactCol - 1]), 0);
    const cur = P.company.currency === 'INR' ? '₹' : P.company.currency === 'USD' ? '$' : '£';
    const totalTxt = P.id === 'in' ? `−${cur}${PO.num(total)} a month across ${people.length} people` : `${cur}${total.toFixed(2)} to pay this period`;
    return html`<section class="card cmp-flag">
      <div class="card-h"><${PO.Chip} icon="Scale" accent="red" /><h3>${F.title}</h3><span class="sub">Found ${PO.date(PO.addDays(PO.TODAY, -1), { short: true })} while checking ${P.company.period}</span><span class="right"><${Badge} tone="amber" dot>Action needed</${Badge}></span></div>
      <div class="card-b">
        <p class="muted" style="max-width:86ch;margin-bottom:12px">${F.text}</p>
        <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--r)"><table class="tbl compact">
          <thead><tr>${F.cols.map((c, i) => html`<th class=${i ? 'r' : ''}>${c}</th>`)}</tr></thead>
          <tbody>${(all ? people : people.slice(0, 5)).map((p) => html`<tr><td><${Who} p=${p} size="sm" sub=${`${p.title}, ${PO.site(p.site).name}`} /></td>${F.row(p, p.pay).map((c, i, arr) => html`<td class=${'r tnum ' + (i === arr.length - 1 ? 'w-500' : '')}>${String(c).replace(' · ', ', ')}</td>`)}</tr>`)}</tbody>
          <tfoot><tr><td class="w-600">${PO.plural(people.length, 'person', 'people')}${people.length > 5 ? html` <a class="link t-sm w-500" style="margin-left:8px" onClick=${() => setAll(!all)}>${all ? 'Show fewer' : `Show all ${people.length}`}</a>` : null}</td>${F.cols.slice(1).map((_, i, arr) => html`<td class="r tnum w-600">${i === arr.length - 1 ? (P.id === 'in' ? `−${cur}${PO.num(total)}` : `${cur}${total.toFixed(2)}`) : ''}</td>`)}</tr></tfoot>
        </table></div>
      </div>
      <div class="card-f row wrap">
        <${Button} kind="primary" onClick=${() => { setFixed(true); PO.toast(F.done.split('.')[0] + '.', { action: { label: 'Undo', run: () => setFixed(false) } }); }}>${F.apply}</${Button}>
        <${Button} onClick=${() => setLetters(true)}>${F.letters}</${Button}>
        <${Button} kind="ghost" href=${PO.href('payroll')}>Open payroll</${Button}>
        <span class="right t-sm muted">Impact <b class="tnum" style="font-family:var(--num);font-size:14px;color:var(--text)">${totalTxt}</b></span>
      </div>
      <${LetterModal} open=${letters} onClose=${() => setLetters(false)} people=${people} />
    </section>`;
  }

  function LetterModal({ open, onClose, people }) {
    const P = PO.P();
    const F = P.ruleFlag;
    const [who, setWho] = useState(people[0] && people[0].id);
    const [sent, setSent] = PO.useCoState('compliance.lettersSent', false);
    if (!open) return null;
    const p = P.byId[who] || people[0];
    const c = F.row(p, p.pay);
    const hr = P.byId[P.hrId];
    const C = P.company;
    const body = P.id === 'in'
      ? html`<h4>Revision of your salary structure under the Code on Wages, 2019</h4><p>Dear ${p.first},</p><p>From 1 October 2026 the Code on Wages requires that basic pay is at least half of total pay. To comply, we are revising your salary structure. Your total monthly pay of ${'₹' + p.pay.structure.total.toLocaleString('en-IN')} does not change.</p><p>Your basic pay changes from <b>${c[0].split(' ·')[0]}</b> to <b>${c[1].split(' ·')[0]}</b>. Because provident fund is 12% of basic, your PF contribution rises from <b>${c[2]}</b> to <b>${c[3]}</b> and the company’s matching contribution rises by the same amount. Your monthly take-home changes by <b>${c[4]}</b>, and that amount is saved in your PF account.</p><p>Your revised salary slip will show this from the October 2026 payroll. If you have any questions, raise a query in the employee portal or speak to your site supervisor.</p>`
      : P.id === 'us'
        ? html`<h4>Change to your pay classification</h4><p>Hi ${p.first},</p><p>We reviewed salaried roles against the Fair Labor Standards Act. Your salary of ${c[0]} a week is below the $684 threshold for exempt employees, so from this pay period you are classified as non-exempt and paid hourly at a regular rate of <b>${c[1]}</b>.</p><p>That means you are owed overtime at 1.5× for every hour over 40 in a workweek. For ${C.period} that is <b>${c[2]}</b> of overtime, so <b>${c[3]}</b> is added to your check on ${C.payBy}.</p><p>Please clock in and out in the employee portal or at the store kiosk for every shift from now on. Raise a query in the portal or talk to me if you have questions.</p>`
        : html`<h4>Refund of your uniform deduction</h4><p>Dear ${p.first},</p><p>We checked your pay for ${C.period} against the National Living Wage of £12.71 an hour. The £25 uniform deduction took your pay for ${c[0]} below that rate, to <b>${c[2]}</b> an hour, which the law does not allow.</p><p>We have stopped the deduction and will refund <b>${c[3]}</b> in your pay on ${C.payBy}. Nothing else in your pay changes, and you keep your uniform.</p><p>Sorry for the mistake. If you have any questions, raise a query in the employee portal.</p>`;
    return html`<${Modal} open title=${F.letters} size="lg" onClose=${onClose} footer=${html`
      <span class="faint t-sm" style="margin-right:auto">${sent ? `Sent to ${PO.plural(people.length, 'person', 'people')}` : `One letter per person, ${people.length} in total`}</span>
      <${Button} icon="Download" onClick=${() => PO.fakeDownload(`${people.length} letters (PDF)`)}>Download all</${Button}>
      <${Button} kind="primary" onClick=${() => { setSent(true); onClose(); PO.toast(`${people.length} letters shared to the employee portal and emailed`, { icon: 'Send' }); }}>Send to ${people.length} people</${Button}>`}>
      <div class="row mb-12" style="margin-bottom:12px"><span class="t-sm muted">Preview for</span><${Select} width=${280} value=${p.id} onChange=${setWho} options=${people.map((x) => [x.id, `${x.name}, ${x.title}`])} /><span class="right faint t-sm">Drafted by People OS</span></div>
      <div class="cmp-letter">
        <div class="row"><b>${C.name}</b><span class="right faint t-sm">${PO.date(PO.TODAY)}</span></div>
        <div class="faint t-sm">${C.employerLine || C.city}</div>
        <div class="mt-12">${p.name}<br /><span class="faint">${p.id}, ${p.title}, ${PO.site(p.site).name}</span></div>
        ${body}
        <p class="mt-12">Regards,<br /><b>${hr.name}</b><br /><span class="faint">${hr.title}, ${C.name}</span></p>
      </div>
    </${Modal}>`;
  }

  /* ---------- filing drawer ---------- */
  function FilingDrawer({ f, onClose }) {
    const P = PO.P();
    const [filedMap, setFiled] = PO.useCoState('compliance.filed', {});
    const [ack, setAck] = useState('');
    if (!f) return null;
    const done = f.status === 'Filed';
    const step = done ? 4 : f.est ? 0 : daysTo(f.due) <= 9 ? 2 : 1;
    const r = PO.seeded('ack' + f.id);
    return html`<${Drawer} open title=${f.name} sub=${`${f.authority}, ${f.period}`} onClose=${onClose} footer=${done
      ? html`<${Button} icon="Download" onClick=${() => PO.fakeDownload(`${f.type} acknowledgement`)}>Acknowledgement</${Button}><${Button} kind="primary" onClick=${onClose}>Done</${Button}>`
      : html`<${Button} icon="Download" onClick=${() => PO.fakeDownload(`${f.type} file for ${f.period}`)}>Download file</${Button}><${Button} kind="primary" onClick=${() => { const a = ack.trim() || `${f.ackPrefix} ${digits(r, 12)}`; setFiled({ ...filedMap, [f.id]: { ack: a, at: PO.TODAY, by: P.byId[P.hrId].name } }); PO.toast(`${f.type} marked as filed`, { action: { label: 'Undo', run: () => { const n = { ...filedMap }; delete n[f.id]; setFiled(n); } } }); onClose(); }}>Mark as filed</${Button}>`}>
      <div class="row" style="margin-bottom:14px"><${Status} s=${f.status} /><span class="t-sm muted">${done ? `Filed ${PO.date(f.filedOn)}` : `Due ${PO.date(f.due, { weekday: true })}, ${daysTo(f.due) === 0 ? 'today' : `in ${PO.plural(daysTo(f.due), 'day')}`}`}</span>${f.amount != null ? html`<span class="right t-xl w-600 tnum" style="font-family:var(--num)">${PO.money(Math.round(f.amount * 100) / 100)}</span>` : null}</div>
      ${f.note ? html`<div class="t-sm muted" style="margin-bottom:12px">${f.note}</div>` : null}
      ${f.est ? html`<div class="t-sm muted" style="margin-bottom:12px">Amount is estimated from ${P.company.period}. It updates when that payroll is locked.</div>` : null}
      <${PO.Steps} steps=${[['Prepared', 'From payroll'], ['Reviewed', 'HR'], ['Paid / filed', f.authority.split(' ')[0]], ['Acknowledged', 'Receipt saved']]} current=${Math.min(step, 3)} done=${step} />
      <div class="mt-16"><${KV} items=${[['Form', f.form], ['Filed with', f.authority], ['Period', f.period], ['Due date', PO.date(f.due, { weekday: true })], done ? ['Acknowledgement', html`<span class="tnum">${f.ack}</span>`] : null, done ? ['Filed by', f.by] : ['Owner', P.byId[P.hrId].name]]} /></div>
      ${f.lines ? html`<div class="mt-16"><div class="t-sm w-600" style="margin-bottom:8px">How it’s worked out</div><div class="card flush"><div class="card-b">${f.lines.map(([k, v]) => html`<div class="list-item"><span class="grow muted">${k}</span><span class="tnum w-500">${PO.money(Math.round(v * 100) / 100)}</span></div>`)}</div></div></div>` : null}
      ${done ? null : html`<div class="mt-16"><${Field} label="Acknowledgement or challan number" hint="Leave blank and People OS will read it from the portal receipt."><input class="input tnum" value=${ack} onInput=${(e) => setAck(e.target.value)} placeholder=${`${f.ackPrefix} …`} /></${Field}></div>`}
    </${Drawer}>`;
  }

  /** Authority chip: a short text mark in the authority's accent (PF, ESI, PT, TDS; IRS, TWC; HMRC, NEST). */
  const authOf = (x) => { const t = `${x.type} ${x.authority} ${x.name}`;
    return /PF|EPFO/.test(t) ? ['PF', 'teal'] : /ESI/.test(t) ? ['ESI', 'rose'] : /PT |Professional tax/.test(t) ? ['PT', 'violet'] : /TDS|Form 1[33]0|Form 138|Income Tax/.test(t) ? ['TDS', 'blue'] : /LWF|welfare/i.test(t) ? ['LWF', 'amber'] : /CLRA|Labour|Bonus/.test(t) ? ['LAB', 'amber']
      : /TWC|Texas|C-3/.test(t) ? ['TWC', 'amber'] : /SSA|W-2/.test(t) ? ['SSA', 'teal'] : /IRS|941|940|FUTA|Federal/.test(t) ? ['IRS', 'blue'] : /401/.test(t) ? ['401k', 'teal']
        : /NEST|Pension/.test(t) ? ['NEST', 'teal'] : /HMRC|RTI|P60|P11D|P32|PAYE/.test(t) ? ['HMRC', 'blue'] : ['Due', 'green']; };
  const Auth = ({ x }) => { const [t, a] = authOf(x); return html`<span class=${'chip-ic cmp-auth ' + a} title=${x.authority}>${t}</span>`; };

  function DateBlock({ iso, status }) {
    return html`<span class=${'cmp-date ' + (status === 'Filed' ? 'done' : status === 'Due soon' || status === 'Overdue' ? 'soon' : '')}><b>${+iso.slice(8)}</b><i>${PO.MONS[+iso.slice(5, 7) - 1]}</i></span>`;
  }

  /* ---------- tabs ---------- */
  function Overview({ C, openFiling, setTab }) {
    const P = C.P;
    const next = C.filings.filter((x) => x.status !== 'Filed').slice(0, 7);
    const alerts = [
      ...C.open,
      ...C.due30.filter((x) => daysTo(x.due) <= 10).slice(0, 3).map((x) => ({ id: x.id, icon: 'CalendarClock', tone: 'blue', title: `${x.name} due ${relL(x.due)}`, sub: `${x.authority}${x.amount != null ? ', ' + PO.money(Math.round(x.amount)) : ''}`, filing: x })),
      { id: 'law', icon: 'ScrollText', tone: 'brand', title: C.timeline.find((t) => !t.up).t, sub: `In force from ${PO.date(C.timeline.find((t) => !t.up).d)} and already applied to payroll`, tab: 'library' },
      ...C.registers.filter((g) => g.status !== 'Up to date').slice(0, 2).map((g) => ({ id: g.id, icon: 'BookOpenCheck', tone: 'amber', title: `${g.name}: ${g.status.toLowerCase()}`, sub: g.note || g.form, tab: 'registers' })),
    ];
    const at = ['07:40', '07:12', '06:30', '06:00', 'Yesterday', 'Mon', 'Sun', 'Sat', 'Fri'];
    return html`
      <${FlagCard} initLetters=${C.q.letters} />
      <div class="grid g-main" style="margin-top:24px;align-items:start">
        <${Card} title="Filing agenda" icon="CalendarClock" accent="amber" sub=${`Next ${next.length} deadlines`} flush actions=${html`<a class="link t-sm" onClick=${() => setTab('calendar')}>Calendar</a>`}>
          ${next.map((x) => html`<div class="list-item clickable" onClick=${() => openFiling(x)}><${DateBlock} iso=${x.due} status=${x.status} /><${Auth} x=${x} /><div class="grow" style="min-width:0"><div class="w-500 ellipsis">${x.name}</div><div class="faint t-sm ellipsis">${x.authority}, ${x.period}${x.est ? ', estimated' : ''}</div></div>${x.amount != null ? html`<span class="tnum w-500">${PO.money(Math.round(x.amount))}</span>` : null}<span style="width:96px;text-align:right">${x.status === 'Due soon' || x.status === 'Overdue' ? html`<${Badge} tone=${x.status === 'Overdue' ? 'red' : 'amber'} dot>${x.status}</${Badge}>` : html`<span class="faint t-sm">in ${PO.plural(daysTo(x.due), 'day')}</span>`}</span></div>`)}
        </${Card}>
        <div class="col" style="gap:16px">
          <${Card} title="Alerts" icon="ShieldAlert" accent="red" sub=${PO.plural(alerts.length, 'item')} flush>
            ${alerts.map((a, i) => html`<div class="cmp-alert" onClick=${() => a.filing ? openFiling(a.filing) : a.tab ? setTab(a.tab) : a.id === 'flag' ? window.scrollTo(0, 260) : PO.go(a.href)}>
              <span class=${'dot ' + (a.tone === 'red' ? 'red' : a.tone === 'amber' ? 'amber' : a.filing ? 'signal' : '')}></span>
              <span class="grow" style="min-width:0"><span class="w-500 ellipsis" style="display:block">${a.title}</span><small class="faint ellipsis" style="display:block">${a.sub}</small></span><span class="faint t-xs" style="white-space:nowrap">${at[i] || 'Last week'}</span></div>`)}
          </${Card}>
          <${Card} title="Health breakdown" icon="HeartPulse" accent="rose" sub=${`Score ${C.score} of 100`} flush>
            ${C.parts.map((x) => html`<div class="cmp-hrow"><span class="t-sm">${x.k}<small class="faint" style="display:block;font-size:11.5px">${x.sub}</small></span><${Progress} value=${x.v * 100} tone=${x.v >= 0.9 ? '' : x.v >= 0.7 ? 'amber' : 'red'} /><span class="tnum t-sm" style="text-align:right">${Math.round(x.v * 100)}%</span></div>`)}
          </${Card}>
        </div>
      </div>`;
  }

  function CalendarTab({ C, openFiling }) {
    const months = [[2026, 9], [2026, 10], [2026, 11], [2027, 0], [2027, 1], [2027, 2]];
    const [mi, setMi] = useState(0);
    const [y, m] = months[mi];
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const inMonth = C.filings.filter((x) => x.due.startsWith(key));
    const events = {};
    inMonth.forEach((x) => (events[x.due] = events[x.due] || []).push({ label: x.type, tone: x.status === 'Filed' ? 'slate' : x.status === 'Due soon' || x.status === 'Overdue' ? 'amber' : 'brand' }));
    const total = inMonth.reduce((t, x) => t + (x.amount || 0), 0);
    const yearEnd = C.filings.filter((x) => x.due > '2027-03-31' || ['W-2', 'P60', 'P11D', 'FUTA', 'Form 130', 'Bonus Act', 'CLRA'].includes(x.type)).filter((x) => x.status !== 'Filed');
    return html`<div class="grid g-main">
      <div class="card"><div class="card-h"><h3>${PO.MONS[m]} ${y}</h3><span class="sub">${PO.plural(inMonth.length, 'deadline')}, ${PO.money(Math.round(total), { compact: true })} to pay</span><div class="right"><${Segmented} value=${mi} onChange=${setMi} options=${months.map(([yy, mm], i) => [i, `${PO.MONS[mm]}${yy === 2027 ? ' ’27' : ''}`])} /></div></div>
        <div class="card-b"><${MonthCal} year=${y} month=${m} events=${events} maxEv=${3} onDay=${(d) => { const f = inMonth.find((x) => x.due === d); if (f) openFiling(f); }} />
        <div class="legend mt-12"><span><i style="background:var(--brand)"></i>Upcoming</span><span><i style="background:var(--amber-solid)"></i>Due within 7 days</span><span><i style="background:var(--border-strong)"></i>Filed</span></div></div></div>
      <div class="col" style="gap:16px">
        <${Card} title="Agenda" icon="CalendarDays" accent="green" sub=${`${PO.MONS[m]} ${y}`} flush>
          ${inMonth.length ? inMonth.map((x) => html`<div class="list-item clickable" onClick=${() => openFiling(x)}><${DateBlock} iso=${x.due} status=${x.status} /><${Auth} x=${x} /><div class="grow" style="min-width:0"><div class="w-550 ellipsis">${x.name}</div><div class="faint t-sm ellipsis">${x.authority}${x.amount != null ? ', ' + PO.money(Math.round(x.amount)) : ''}</div></div>${x.status === 'Due soon' || x.status === 'Overdue' ? html`<${Badge} tone=${x.status === 'Overdue' ? 'red' : 'amber'} dot>${x.status}</${Badge}>` : x.status === 'Filed' ? html`<span class="faint t-sm">Filed</span>` : html`<span class="faint t-sm">in ${PO.plural(daysTo(x.due), 'day')}</span>`}</div>`) : html`<${Empty} icon="CalendarCheck" title="Nothing due" text="No statutory deadlines this month." />`}
        </${Card}>
        <${Card} title="Annual deadlines" icon="CalendarClock" accent="amber" flush>${yearEnd.slice(0, 6).map((x) => html`<div class="list-item clickable" onClick=${() => openFiling(x)}><${Auth} x=${x} /><span class="grow ellipsis">${x.name}</span><span class="faint t-sm tnum">${PO.date(x.due, { short: true })}</span></div>`)}</${Card}>
      </div>
    </div>`;
  }

  function HistoryTab({ C, openFiling }) {
    const rows = C.filings.filter((x) => x.status === 'Filed').slice().reverse();
    const types = [...new Set(rows.map((x) => x.type))];
    return html`<${DataTable} rows=${rows} exportName="filings-history" search=${(x) => `${x.name} ${x.period} ${x.ack} ${x.type}`} searchPlaceholder="Search filings or challan numbers" onRow=${openFiling} pageSize=${15}
      filters=${[{ key: 'type', label: 'Filing', options: types, test: (x, v) => x.type === v }, { key: 'by', label: 'Filed by', options: [...new Set(rows.map((x) => x.by))], test: (x, v) => x.by === v }]}
      columns=${[
        { key: 'name', label: 'Filing', render: (x) => html`<span class="row" style="gap:10px"><${Auth} x=${x} /><span><div class="w-550">${x.name}</div><div class="faint t-sm">${x.authority}, ${x.form}</div></span></span>`, sort: (x) => x.name },
        { key: 'period', label: 'Period', render: (x) => x.period },
        { key: 'due', label: 'Due', render: (x) => html`<span class="tnum">${PO.date(x.due, { short: true })}</span>`, sort: (x) => x.due },
        { key: 'filedOn', label: 'Filed', render: (x) => html`<span class="tnum">${PO.date(x.filedOn, { short: true })}</span>`, sort: (x) => x.filedOn },
        { key: 'amount', label: 'Amount', align: 'r', render: (x) => x.amount != null ? html`<span class="tnum">${PO.money(Math.round(x.amount))}</span>` : html`<span class="faint">—</span>`, sort: (x) => x.amount || 0, csv: (x) => (x.amount != null ? Math.round(x.amount) : '') },
        { key: 'ack', label: 'Challan / acknowledgement', render: (x) => html`<span class="tnum t-sm">${x.ack}</span>` },
        { key: 'by', label: 'Filed by', render: (x) => { const q = C.P.people.find((p) => p.name === x.by); return html`<span class="cmp-by t-sm">${q ? html`<${PO.Avatar} p=${q} size="xs" />` : html`<${PO.Chip} icon="Bot" accent="violet" size=${12} />`}${x.by}</span>`; } },
        { key: 'status', label: 'Status', render: () => html`<${Status} s="Filed" />`, csv: () => 'Filed on time' },
        { key: 'dl', label: '', sort: false, csv: false, render: (x) => html`<span onClick=${(e) => e.stopPropagation()}><${PO.IconButton} icon="Download" size="sm" title="Download receipt" onClick=${() => PO.fakeDownload(`${x.type} receipt, ${x.period}`)} /></span>` },
      ]} />`;
  }

  function LibraryTab({ C }) {
    const P = C.P;
    const [open, setOpen] = useState(null);
    const rows = [...C.custom.filter((r) => r && r.on !== false).map((r, i) => ({ id: 'c' + i, name: r.name || r.ruleName || 'Custom rule', value: r.value || r.ruleValue || r.text || '', from: r.from || PO.date(r.at || PO.TODAY), note: r.text || '', custom: true })), ...P.rules.map((r, i) => ({ id: 'r' + i, ...r }))];
    return html`<div class="grid g-main">
      <${DataTable} rows=${rows} search=${(r) => `${r.name} ${r.value} ${r.note}`} searchPlaceholder="Search rules" exportName="rule-library" onRow=${setOpen} pageSize=${20}
        filters=${[{ key: 'src', label: 'Source', options: [['law', 'Statutory'], ['custom', 'Your rules']], test: (r, v) => (v === 'custom' ? r.custom : !r.custom) }]}
        columns=${[
          { key: 'name', label: 'Rule', render: (r) => html`<div class="row"><b class="w-550">${r.name}</b>${r.custom ? html`<span class="faint t-sm">your rule</span>` : r.was ? html`<span class="faint t-sm">changed</span>` : null}</div>${r.note ? html`<div class="faint t-sm" style="max-width:48ch">${r.note}</div>` : null}`, sort: (r) => r.name },
          { key: 'value', label: 'What applies', render: (r) => html`<div>${r.value}</div>${r.was ? html`<div class="faint t-sm">Was ${r.was}</div>` : null}` },
          { key: 'from', label: 'Effective from', render: (r) => html`<span class="tnum" style="white-space:nowrap">${r.from}</span>` },
          { key: 'st', label: 'In payroll', render: () => html`<span class="t-sm muted">Live</span>`, csv: () => 'Live' },
        ]} />
      <${Card} title="Law changes" icon="Gavel" accent="violet" sub=${`${P.company.country}${P.company.region ? ', ' + P.company.region : ''}`}>
        <${Timeline} items=${C.timeline.map((t) => ({ icon: t.icon, tone: t.up ? '' : t.tone, title: t.t, right: t.up ? 'Watching' : PO.date(t.d, { short: true }), sub: t.s }))} />
      </${Card}>
      <${Drawer} open=${!!open} title=${open && open.name} sub=${open && (open.custom ? 'Rule you added' : `${P.company.country} statutory rule`)} onClose=${() => setOpen(null)} footer=${html`<${Button} onClick=${() => setOpen(null)}>Close</${Button}>${open && open.custom ? html`<${Button} kind="primary" href=${PO.href('rules')}>Edit in Rules</${Button}>` : null}`}>
        ${open ? html`<${KV} items=${[['What applies', open.value], open.was ? ['Previously', open.was] : null, ['Effective from', open.from], ['Notes', open.note || '—'], ['Applied in', 'Payroll run, payslips, compliance checks']]} />
        <div class="mt-16 t-sm muted">Every payroll is checked against this rule before you can lock it. If anyone breaks it, you get a flag with the people affected and a one-click fix, like the one on the Overview tab.</div>` : null}
      </${Drawer}>
    </div>`;
  }

  function RegistersTab({ C }) {
    const init = C.q.reg ? C.registers.find((g) => g.id === C.q.reg) : null;
    const P = C.P;
    const [gen, setGen] = PO.useCoState('compliance.registers', {});
    const [open, setOpen] = useState(init);
    const preview = (g) => {
      if (g.rowsRaw) return g.rowsRaw;
      const ppl = (g.people || P.people).slice(0, 14);
      return ppl.map((p, i) => [html`<${Who} p=${p} size="xs" sub=${p.id} />`, ...g.row(p, i)]);
    };
    const generate = (g) => { setGen({ ...gen, [g.id]: PO.TODAY }); PO.toast(`${g.name} generated for ${g.period}`, { icon: 'FileCheck2' }); };
    return html`<${DataTable} rows=${C.registers} onRow=${setOpen} exportName="statutory-registers" search=${(g) => g.name + ' ' + g.form}
      filters=${[{ key: 'status', label: 'Status', options: [...new Set(C.registers.map((g) => g.status))], test: (g, v) => g.status === v }]}
      columns=${[
        { key: 'name', label: 'Register', render: (g) => html`<div class="w-500">${g.name}</div><div class="faint t-sm">${g.form}</div>`, sort: (g) => g.name },
        { key: 'period', label: 'Period', render: (g) => g.period },
        { key: 'count', label: 'Records', align: 'r', render: (g) => html`<span class="tnum">${PO.num(g.count)}</span>` },
        { key: 'last', label: 'Last generated', render: (g) => html`<span class="tnum">${PO.date(g.last, { short: true })}</span>`, sort: (g) => g.last },
        { key: 'status', label: 'Status', render: (g) => html`<${Status} s=${g.status} />${g.note ? html`<div class="faint t-xs mt-4">${g.note}</div>` : null}` },
        { key: 'act', label: '', sort: false, csv: false, render: (g) => html`<div class="row" style="justify-content:flex-end" onClick=${(e) => e.stopPropagation()}><${Button} size="sm" kind="ghost" onClick=${() => generate(g)}>Generate</${Button}><${PO.IconButton} icon="Download" size="sm" bordered title="Download PDF" onClick=${() => PO.fakeDownload(`${g.name} (${g.period}) PDF`)} /></div>` },
      ]} />
    <${Drawer} open=${!!open} size="lg" title=${open && open.name} sub=${open && `${open.form}, ${open.period}`} onClose=${() => setOpen(null)} footer=${open && html`<${Button} onClick=${() => PO.fakeDownload(`${open.name} XLSX`)}>Excel</${Button}><${Button} onClick=${() => PO.fakeDownload(`${open.name} PDF`)}>PDF</${Button}><${Button} kind="primary" onClick=${() => { generate(open); setOpen(null); }}>Generate now</${Button}>`}>
      ${open ? html`<div class="row" style="margin-bottom:12px"><${Status} s=${open.status} /><span class="t-sm muted">${PO.num(open.count)} records, last generated ${PO.date(open.last)}</span></div>
        ${open.note ? html`<div class="t-sm muted" style="margin-bottom:12px">${open.note}</div>` : null}
        ${open.count === 0 && !open.rowsRaw ? html`<div class="card inset"><${Empty} icon="FileCheck2" title="Nil register" text=${`No entries for ${open.period}. People OS still generates the signed nil register for inspections.`} /></div>`
          : html`<div class="card flush" style="overflow:hidden"><div class="table-wrap"><table class="tbl compact"><thead><tr>${open.cols.map((c, i) => html`<th class=${i ? 'r' : ''}>${c}</th>`)}</tr></thead><tbody>${preview(open).map((row) => html`<tr>${row.map((c, i) => html`<td class=${i ? 'r tnum' : ''}>${c}</td>`)}</tr>`)}</tbody></table></div>
          ${open.count > 14 ? html`<div class="tbl-foot">Showing 14 of ${PO.num(open.count)}. The full register is in the PDF.</div>` : null}</div>`}
        <div class="faint t-sm mt-12">Signed digitally by ${P.byId[P.hrId].name} for ${P.company.name}. Kept for ${P.id === 'in' ? '3 years under the Code on Wages' : P.id === 'us' ? '3 years under FLSA recordkeeping' : '6 years for HMRC and the Fair Work Agency'}.</div>` : null}
    </${Drawer}>`;
  }

  function CompliancePage({ query }) {
    const C = useCompliance();
    const P = C.P;
    const [tab, setTab] = useState(query.tab || 'overview');
    const [filing, setFiling] = useState(query.filing ? C.filings.find((x) => x.id === query.filing) : null);
    C.q = query;
    const nextDue = C.filings.find((x) => x.status !== 'Filed');
    return html`
      <${PageHeader} title="Compliance centre" sub=${`${P.company.country}${P.company.region ? ', ' + P.company.region : ''}. Every payroll is checked against ${PO.plural(P.rules.length + C.custom.length, 'rule')}; ${PO.plural(C.open.length, 'flag')} open and ${C.due30.length} filings due in the next 30 days.`} actions=${html`
        <${Button} onClick=${() => PO.fakeDownload(`Compliance pack, ${P.company.period} (ZIP)`)}>Inspection pack</${Button}>
        <${Button} kind=${C.fixed ? 'primary' : ''} onClick=${() => setFiling(nextDue)}>File ${nextDue.type}</${Button}>`} />
      <${PO.KpiStrip} items=${[
        { label: 'Compliance health', icon: 'HeartPulse', accent: 'rose', value: String(C.score), unit: '/100', sub: C.open.length ? `Fix ${C.open.length === 1 ? 'the open flag' : `${C.open.length} open flags`} to reach ${Math.min(99, C.score + C.open.length * 3)}` : 'Nothing open', bar: [{ v: C.score, k: C.score >= 90 ? 'ok' : 'warn', title: 'Score' }, { v: 100 - C.score, k: 'mute', title: 'Gap' }] },
        { label: 'Open flags', icon: 'ShieldAlert', accent: 'red', value: PO.num(C.open.length), alert: C.open.length > 0, sub: `${C.open.filter((o) => o.sev === 'high').length} high priority`, bar: [{ v: C.open.filter((o) => o.sev === 'high').length, k: 'bad', title: 'High' }, { v: C.open.filter((o) => o.sev !== 'high').length, k: 'warn', title: 'Medium' }] },
        { label: 'Filings due in 30 days', icon: 'CalendarClock', accent: 'amber', value: PO.num(C.due30.length), sub: C.due30[0] ? `Next: ${C.due30[0].type}, ${relL(C.due30[0].due)}` : 'All filed', bar: [{ v: C.due30.filter((x) => daysTo(x.due) <= 7).length, k: 'warn', title: 'Within 7 days' }, { v: C.due30.filter((x) => daysTo(x.due) > 7).length, k: 'mute', title: 'Later' }], onClick: () => setTab('calendar') },
        { label: 'Registers up to date', icon: 'BookOpenCheck', accent: 'green', value: PO.num(C.regOk), unit: '/' + C.registers.length, sub: C.regOk === C.registers.length ? 'Inspection ready' : `${C.registers.length - C.regOk} need attention`, bar: [{ v: C.regOk, k: 'ok', title: 'Up to date' }, { v: C.registers.length - C.regOk, k: 'warn', title: 'Need attention' }], onClick: () => setTab('registers') },
        { label: 'Rule changes this year', icon: 'Gavel', accent: 'violet', value: PO.num(C.changesThisYear), sub: 'All applied automatically', onClick: () => setTab('library') },
      ]} />
      <div style="margin-top:24px"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['overview', 'Overview'], ['calendar', 'Filing calendar', C.due30.length], ['history', 'Filings history'], ['library', 'Rule library'], ['registers', 'Registers', C.registers.length - C.regOk || null]]} /></div>
      <div>
        ${tab === 'overview' ? html`<${Overview} C=${C} openFiling=${setFiling} setTab=${setTab} />` : null}
        ${tab === 'calendar' ? html`<${CalendarTab} C=${C} openFiling=${setFiling} />` : null}
        ${tab === 'history' ? html`<${HistoryTab} C=${C} openFiling=${setFiling} />` : null}
        ${tab === 'library' ? html`<${LibraryTab} C=${C} />` : null}
        ${tab === 'registers' ? html`<${RegistersTab} C=${C} />` : null}
      </div>
      <${FilingDrawer} f=${filing && C.filings.find((x) => x.id === filing.id)} onClose=${() => setFiling(null)} />`;
  }

  PO.route('compliance', CompliancePage, { title: 'Compliance centre' });
  PO.navCount('compliance', (state, P) => (PO.coGet(state, 'compliance.flagFixed', false) ? 0 : 1) + 1, true);

  /* =====================================================================================
     Rules & policies
     ===================================================================================== */
  const EXAMPLES = {
    in: ['Night shift allowance ₹75 at Magarpatta', 'Casual leave needs 2 days’ notice', 'Late more than 3 times a month is a half day', 'Overtime above 20 hours a month needs Vikram to approve'],
    us: ['Shift leads get $1.50 more an hour on the overnight bake', 'PTO requests need 5 days notice', 'Overtime over 6 hours a period needs Marcus to approve', 'Late more than 3 times a month is a written warning'],
    uk: ['Night premium is £2 an hour at Salford Royal', 'Holiday needs 4 weeks notice in December', 'Overtime over 10 hours a period needs Daniel to approve', 'Late more than 3 times a month triggers a review'],
  };
  const SCRIPT = {
    in: { when: 'A shift at EON Kharadi goes past 9 hours in a day', then: 'Hours after the 9th are paid at 2× the hourly wage', applies: (P) => `Guards and housekeeping at EON Kharadi (${P.people.filter((p) => p.site === 'khd' && p.role !== 'sup').length} people)`, from: '1 October 2026 (October payroll)', scope: (P) => P.people.filter((p) => p.site === 'khd' && p.pay.otHours > 0) },
    us: { when: 'Any hours worked on Thanksgiving (Nov 26) or Christmas Day (Dec 25)', then: 'Paid at 2× the regular rate instead of 1×. Overtime on those days stacks to 3×.', applies: (P) => `All hourly staff at 4 locations (${P.people.filter((p) => !P.roles[p.role].salary).length} people)`, from: 'Pay period Nov 16 – Nov 29', scope: (P) => P.people.filter((p) => !P.roles[p.role].salary) },
    uk: { when: 'Any shift worked on a bank holiday in England and Wales', then: 'Paid at 1.5× the hourly rate. Holiday entitlement is unchanged.', applies: (P) => `All hourly cleaners and domestics (${P.people.filter((p) => !P.roles[p.role].salary).length} people)`, from: 'Next bank holiday: Christmas Day, 25 Dec', scope: (P) => P.people.filter((p) => !P.roles[p.role].salary) },
  };
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9.×₹$£]+/g, ' ').trim();

  /** Read a rule typed in plain language. Scripted example gets the exact answer; anything else gets a careful best guess. */
  function readRule(P, text) {
    const A = P.ai;
    const t = text.toLowerCase();
    if (norm(text) === norm(A.rule) || (norm(text).includes(norm(A.rule).slice(0, 18)))) {
      const S = SCRIPT[P.id];
      const n = +(A.ruleCost.match(/across (\d+)/) || [])[1] || 0;
      const ids = S.scope(P).slice(0, n || 12).map((p) => p.id);
      return { scripted: true, name: A.ruleName, value: A.ruleValue, text: A.ruleText, when: S.when, then: S.then, applies: S.applies(P), from: S.from, confidence: 'High', impact: { hero: (A.ruleCost.match(/[₹$£][\d,.]+/) || [''])[0], text: A.ruleCost, ids, n }, checks: [P.id === 'in' ? 'Matches the Code on Wages minimum of 2× for overtime' : P.id === 'us' ? 'Above the FLSA minimum; holiday premium is your choice in Texas' : 'Above the statutory minimum; bank holiday premium is contractual', 'No conflict with your other rules'] };
    }
    const cur = P.company.currency === 'INR' ? '₹' : P.company.currency === 'USD' ? '$' : '£';
    const site = P.sites.find((s) => s.name.split(/\s+/).some((w) => w.length > 3 && !/phase|plaza|corporate|residency|south|east/i.test(w) && t.includes(w.toLowerCase())));
    const roleKey = Object.keys(P.roles).find((k) => { const ti = P.roles[k].title.toLowerCase(); return t.includes(ti) || t.includes(ti + 's') || (k === 'lead' && /leads?\b/.test(t)) || t.includes(k + 's'); });
    const mult = (t.match(/(\d+(?:\.\d+)?)\s*[x×]/) || [])[1] || (/double/.test(t) ? 2 : /time and a half/.test(t) ? 1.5 : /triple/.test(t) ? 3 : null);
    const amt = (t.match(/[₹$£]\s?(\d+(?:\.\d+)?)/) || [])[1];
    const after = (t.match(/(?:after|above|over|more than)\s+(\d+)\s*(?:hours?|h)\b/) || [])[1];
    const notice = t.match(/(\d+)\s*(day|week)s?[’']?s?\s+notice/);
    const timesM = (t.match(/(\d+)\s*times/) || [])[1];
    const approver = P.people.find((p) => p.role === 'office' && new RegExp('\\b' + p.first.toLowerCase() + '\\b').test(t)) || (/owner|director/.test(t) ? P.byId[P.topId] : null);
    const nightish = /night|overnight|shift c/.test(t);
    const scopeLabel = `${roleKey ? P.roles[roleKey].title + 's' : 'Everyone'}${nightish ? ' on night shifts' : ''}${site ? ' at ' + site.name : ''}`;
    let scope = P.people.filter((p) => (!site || p.site === site.id) && (!roleKey || p.role === roleKey) && (!nightish || p.shift === 'C') && p.role !== 'office');
    const fromNext = P.id === 'in' ? '1 November 2026 (next payroll)' : P.id === 'us' ? 'Next pay period, Oct 5' : 'Next pay period, 5 Oct';
    const base = { scripted: false, from: fromNext, applies: `${scopeLabel} (${PO.plural(scope.length, 'person', 'people')})`, text };
    const chain = /needs?\b/.test(t) && /\b(hr|owner|director|payroll)\b/.test(t) && /leave|pto|time off|holiday|expense|advance|overtime/.test(t);
    if (chain) {
      const steps = ['sup'];
      if (/\bhr\b/.test(t)) steps.push('hr');
      if (/payroll/.test(t)) steps.push('pay');
      if (/owner|director/.test(t)) steps.push('owner');
      const days = (t.match(/(\d+)\s*days?/) || [])[1];
      const flowId = /expense/.test(t) ? 'exp' : /advance/.test(t) ? 'adv' : /overtime/.test(t) ? 'ot' : 'leave';
      const what = { exp: 'Expense claims', adv: 'Advances', ot: 'Overtime', leave: P.id === 'us' ? 'Time off' : P.id === 'uk' ? 'Holiday' : 'Leave' }[flowId];
      const cond = days ? `More than ${days} days` : 'Every request';
      const reqs = flowId === 'leave' ? P.leaveRequests.filter((l) => l.from >= PO.addDays(PO.TODAY, -180) && (!days || l.days > +days)) : [];
      const label = steps.map((k) => ROLE_OPTS.find((r) => r[0] === k)[1]).join(', then ');
      return { ...base, kind: 'approval', flow: { id: flowId, cond, steps }, name: `${what} approval chain`, value: `${cond}: ${label}`, when: `${what} request${days ? ` longer than ${days} days` : ''}`, then: `Approved in order by ${label}. Anyone can send it back with a note.`, applies: `Everyone (${PO.plural(P.people.length, 'person', 'people')})`, from: 'Immediately, for new requests', confidence: 'High', impact: { hero: String(reqs.length), unit: 'requests in the last 6 months', text: flowId !== 'leave' ? 'Updates the approval chain; nothing changes in pay.' : reqs.length ? `${PO.plural(reqs.length, 'request')} in the last 6 months would have gone through this chain. Their approval time would rise from about 4 hours to about 1 day.` : `No request in the last 6 months was longer than ${days} days, so day-to-day approvals stay with supervisors. The chain only kicks in for long breaks.`, ids: [...new Set(reqs.map((l) => l.who))] }, checks: [`Replaces the “${cond}” step in the ${what.toLowerCase()} chain`, 'Shorter requests keep going to the supervisor only'] };
    }
    if (/approv/.test(t) && (approver || /overtime|ot\b|expense|advance|leave|pto|holiday/.test(t))) {
      const what = /expense/.test(t) ? 'Expense claims' : /advance/.test(t) ? 'Advances' : /leave|pto|holiday/.test(t) ? P.leaveTypes[0].name + ' requests' : 'Overtime';
      const affected = what === 'Overtime' ? P.people.filter((p) => p.pay.otHours > (+after || 0)) : scope;
      return { ...base, kind: 'approval', name: `${what} approval`, value: `${after ? `Over ${after} h: ` : ''}add ${approver ? approver.name : 'the owner'} as an approver`, when: `${what}${after ? ` above ${after} hours ${/month/.test(t) ? 'in a month' : 'in a pay period'}` : ''} ${site ? 'at ' + site.name : ''}`.trim(), then: `Needs ${approver ? approver.name + ' (' + approver.title + ')' : 'the owner'} to approve after the supervisor`, applies: `${PO.plural(affected.length, 'person', 'people')} would have needed it last period`, confidence: approver ? 'High' : 'Medium', impact: { hero: String(affected.length), unit: 'requests rerouted', text: `On ${P.company.period} data, ${PO.plural(affected.length, 'request')} would have gone to ${approver ? approver.first : 'the owner'} after the supervisor approved. Nothing changes in pay.`, ids: affected.map((p) => p.id) }, checks: ['Adds a step to the overtime approval chain', approver ? `${approver.first} gets an email and an SMS for each one` : 'Tell me who should approve, by name'] };
    }
    if (notice) {
      const n = +notice[1] * (notice[2] === 'week' ? 7 : 1);
      const lt = P.leaveTypes.find((x) => t.includes(x.name.toLowerCase()) || t.includes(x.short.toLowerCase())) || P.leaveTypes[0];
      const recent = P.leaveRequests.filter((l) => l.type === lt.key && l.from >= PO.addDays(PO.TODAY, -120) && l.from <= PO.TODAY);
      const short = recent.filter((l) => daysTo(l.from) - daysTo(l.applied) < n);
      const dec = /december/.test(t);
      return { ...base, kind: 'leave', name: `${lt.name} notice`, value: `${notice[1]} ${notice[2]}${+notice[1] > 1 ? 's' : ''}’ notice${dec ? ' in December' : ''}`, when: `Someone asks for ${lt.name.toLowerCase()}${dec ? ' for dates in December' : ''}`, then: `The request needs to be made at least ${PO.plural(n, 'day')} before the first day off, or it goes to HR as an exception`, applies: `Everyone on ${lt.name.toLowerCase()} (${PO.plural(P.people.length, 'person', 'people')})`, confidence: 'High', impact: { hero: `${short.length} of ${recent.length}`, unit: 'requests', text: `In the last 4 months ${short.length} of ${recent.length} ${lt.name.toLowerCase()} requests were made with less notice. Those would have been flagged as exceptions. Sick leave is never affected.`, ids: [...new Set(short.map((l) => l.who))] }, checks: ['Emergency and sick leave are exempt by default', 'Shown on the leave form in the employee portal'] };
    }
    if (/late/.test(t)) {
      const r = PO.seeded('late' + P.id);
      const counts = {};
      P.lateBySite.forEach(([name, n]) => { const s = P.sites.find((x) => x.name === name); const ppl = P.people.filter((p) => s && p.site === s.id && p.role !== 'office'); const rep = r.shuffle(ppl).slice(0, Math.max(2, Math.round(ppl.length * 0.12))); for (let i = 0; i < n && ppl.length; i++) { const p = r.chance(0.7) ? r.pick(rep) : r.pick(ppl); counts[p.id] = (counts[p.id] || 0) + 1; } });
      const k = +timesM || 3;
      const hit = Object.keys(counts).filter((id) => counts[id] > k);
      const action = /half/.test(t) ? 'Mark a half day (loss of pay) from the next late mark' : /warning/.test(t) ? 'Send a written warning, drafted for the supervisor to approve' : 'Open a review with their supervisor';
      return { ...base, kind: 'attendance', name: 'Repeated late marks', value: `More than ${k} late marks a month: ${/half/.test(t) ? 'half day' : /warning/.test(t) ? 'written warning' : 'review'}`, when: `Someone is late more than ${k} times in a calendar month, after the grace period`, then: action, applies: `${scopeLabel} (${PO.plural(scope.length, 'person', 'people')})`, confidence: 'Medium', impact: { hero: String(hit.length), unit: 'people', text: `Last month ${PO.plural(hit.length, 'person', 'people')} were late more than ${k} times (from ${PO.num(P.lateBySite.reduce((a, x) => a + x[1], 0))} late marks).${/half/.test(t) && P.id === 'in' ? ' The Code on Wages allows the deduction if it is in your standing orders.' : ''}`, ids: hit }, checks: ['I assumed the existing grace period still applies', /half/.test(t) ? 'Needs to be in your standing orders before it can cut pay' : 'Nothing changes in pay'] };
    }
    if (mult || amt) {
      let extra = 0, units = 0;
      if (mult) {
        const curMult = P.id === 'in' ? 2 : 1.5;
        scope = scope.filter((p) => p.pay.otHours > 0);
        scope.forEach((p) => { const h = after && P.id === 'in' ? Math.max(0, p.pay.otHours - (+after - 8) * 4) : p.pay.otHours; units += h; extra += h * hourlyOf(P, p) * Math.max(0, +mult - curMult); });
      } else {
        scope.forEach((p) => { const u = P.id === 'in' ? (p.u.nights || 0) : P.id === 'uk' ? (nightish ? p.u.nights || 0 : p.pay.work) : p.pay.work; units += u; extra += u * (+amt - (P.id === 'in' && nightish ? 50 : P.id === 'uk' && nightish ? 1.5 : 0)); });
      }
      extra = Math.max(0, extra);
      const per = /night/.test(t) && P.id === 'in' ? 'a night' : /hour|\/h/.test(t) ? 'an hour' : /day/.test(t) ? 'a day' : P.id === 'in' ? 'a night' : 'an hour';
      return { ...base, kind: 'pay', name: mult ? `Overtime${site ? ' at ' + site.name : ''}` : `${nightish ? 'Night' : 'Shift'} allowance${site ? ' at ' + site.name : ''}`, value: mult ? `${mult}×${after ? ` after ${after} hours` : ''}` : `${cur}${amt} ${per}`, when: mult ? `${after ? `Someone works more than ${after} hours${/week/.test(t) ? ' in a week' : ' in a day'}` : 'Someone works overtime'}${site ? ' at ' + site.name : ''}` : `${roleKey ? P.roles[roleKey].title + 's work' : 'Someone works'} ${nightish ? 'a night shift' : 'a shift'}${site ? ' at ' + site.name : ''}`, then: mult ? `Those hours are paid at ${mult}× the hourly ${P.id === 'in' ? 'wage' : 'rate'}` : `Add ${cur}${amt} ${per} to their pay as a separate payslip line`, confidence: site || roleKey ? 'Medium' : 'Low', impact: { hero: PO.money(Math.round(extra)), unit: '', text: extra ? `On ${P.company.period} data this adds ${PO.money(Math.round(extra))} across ${PO.plural(scope.length, 'person', 'people')} (${PO.num(units)} ${mult ? 'overtime hours' : per === 'a night' ? 'nights' : 'hours'}).` : `On ${P.company.period} data this adds nothing: everyone in scope already gets at least this.`, ids: scope.map((p) => p.id) }, checks: [mult && P.id === 'in' && +mult < 2 ? 'Below the Code on Wages minimum of 2×. I can’t apply it as written.' : 'Above the legal minimum', site ? `Only ${site.name}; other sites keep their current rule` : 'I assumed it applies at every site. Name a site to narrow it.'] };
    }
    return { ...base, kind: 'unknown', name: 'Unrecognised rule', value: text, when: 'I couldn’t tell when this should apply', then: 'I couldn’t map this to a pay, leave, attendance or approval setting', applies: scopeLabel, confidence: 'Low', impact: null, checks: ['Try naming a rate (2×, ₹50), a threshold (after 9 hours), a notice period or an approver'] };
  }

  const BUILTIN = {
    in: [
      { id: 'b1', name: 'Night shift allowance', value: '₹50 a night on shift C', applies: 'All sites, night shift', from: '1 Apr 2024', icon: 'Moon', hist: [['v2', '1 Apr 2024', 'Raised from ₹40 to ₹50', 'Vikram Joshi'], ['v1', '1 Apr 2021', 'Created: ₹40 a night', 'Vikram Joshi']] },
      { id: 'b2', name: 'Grace period', value: '10 minutes, then a late mark', applies: 'Everyone on shifts', from: '1 Jan 2025', icon: 'Timer', hist: [['v2', '1 Jan 2025', 'Cut from 15 to 10 minutes', 'Meera Deshpande'], ['v1', '1 Apr 2022', 'Created: 15 minutes', 'Meera Deshpande']] },
      { id: 'b3', name: 'Weekly off', value: '1 day in 7, rotating', applies: 'All operational staff', from: '1 Apr 2021', icon: 'CalendarRange', hist: [['v1', '1 Apr 2021', 'Created', 'Vikram Joshi']] },
      { id: 'b4', name: 'Overtime approval', value: 'Supervisor approves before payroll', applies: 'All sites', from: '21 Nov 2025', icon: 'BadgeCheck', hist: [['v2', '21 Nov 2025', 'Rate set to 2× under the Code on Wages', 'People OS'], ['v1', '1 Apr 2021', 'Created', 'Meera Deshpande']] },
    ],
    us: [
      { id: 'b1', name: 'Card tips', value: 'Paid out on each check, by hours on shift', applies: 'Baristas at 3 cafés', from: 'Mar 1, 2023', icon: 'Coins', hist: [['v2', 'Mar 1, 2023', 'Switched from daily cash-out to payroll', 'Marcus Coleman'], ['v1', 'Sep 1, 2019', 'Created', 'Marcus Coleman']] },
      { id: 'b2', name: 'Grace period', value: '5 minutes, rounded to the nearest 5', applies: 'All hourly staff', from: 'Jan 1, 2024', icon: 'Timer', hist: [['v1', 'Jan 1, 2024', 'Created', 'Dana Whitfield']] },
      { id: 'b3', name: 'Overnight bake differential', value: '$1.00 more an hour, 10pm–6am', applies: 'Central kitchen', from: 'Jun 1, 2025', icon: 'Moon', hist: [['v2', 'Jun 1, 2025', 'Raised from $0.75', 'Marcus Coleman'], ['v1', 'Jan 1, 2023', 'Created', 'Marcus Coleman']] },
      { id: 'b4', name: 'Meal break', value: '30 min unpaid after 6 hours', applies: 'All hourly staff', from: 'Sep 1, 2019', icon: 'Coffee', hist: [['v1', 'Sep 1, 2019', 'Created', 'Marcus Coleman']] },
    ],
    uk: [
      { id: 'b1', name: 'Night premium', value: '£1.50 an hour, 22:00–06:00', applies: 'All sites', from: '6 Apr 2025', icon: 'Moon', hist: [['v2', '6 Apr 2025', 'Raised from £1.25', 'Daniel Shaw'], ['v1', '1 Jun 2021', 'Created', 'Daniel Shaw']] },
      { id: 'b2', name: 'Grace period', value: '5 minutes, then a late mark', applies: 'Everyone on shifts', from: '1 Jan 2024', icon: 'Timer', hist: [['v1', '1 Jan 2024', 'Created', 'Gemma Clarke']] },
      { id: 'b3', name: 'Uniform deduction', value: '£25 one-off for a replacement set', applies: 'Cleaners', from: '1 Apr 2026', icon: 'Shirt', hist: [['v2', '1 Apr 2026', 'Must not take pay below NLW', 'People OS'], ['v1', '1 Sep 2022', 'Created', 'Gemma Clarke']] },
      { id: 'b4', name: 'Overtime', value: '1.5× above contracted hours', applies: 'All hourly staff', from: '1 Jun 2021', icon: 'Clock', hist: [['v1', '1 Jun 2021', 'Created', 'Daniel Shaw']] },
    ],
  };

  function RuleComposer({ init }) {
    const P = PO.P();
    const [text, setText] = useState('');
    const [res, setRes] = useState(null);
    const [thinking, setThinking] = useState(false);
    const [custom, setCustom] = PO.useCoState('rules.custom', []);
    const [flows, setFlows] = PO.useCoState('rules.workflows', defaultFlows(P));
    const viewer = PO.viewer();
    const read = (t) => { const v = (t ?? text).trim(); if (!v) return; setText(v); setThinking(true); setRes(null); setTimeout(() => { setRes(readRule(P, v)); setThinking(false); }, 650); };
    const apply = () => {
      const rule = { id: 'cr' + Date.now(), name: res.name, value: res.value, text: res.text, when: res.when, then: res.then, applies: res.applies, from: res.from, at: PO.TODAY, by: viewer.name, on: true, version: 1, history: [{ v: 1, at: PO.TODAY, by: viewer.name, text: res.text }] };
      setCustom([rule, ...custom]);
      if (res.flow) { const f = res.flow; setFlows(flows.map((w) => (w.id === f.id ? { ...w, lanes: [...w.lanes.filter((l) => l.cond !== f.cond && !/More than/.test(l.cond)).map((l) => (/^Up to \d+ days/.test(l.cond) && /\d/.test(f.cond) ? { ...l, cond: `Up to ${f.cond.match(/\d+/)[0]} days` } : l)), { cond: f.cond, steps: f.steps }] } : w))); }
      setRes(null); setText('');
      PO.toast(`“${rule.name}” is live from ${rule.from.split(' (')[0]}`, { action: { label: 'Undo', run: () => setCustom(custom) } });
    };
    const examples = [P.ai.rule, ...EXAMPLES[P.id]];
    PO.useEffect(() => { if (init) read(init); }, []);
    return html`<div class="cmp-composer">
      <div><div class="w-600" style="font-size:13.5px">New rule</div><div class="faint t-sm">Write it the way you would say it. You see what was understood and what it would have cost last period before anything changes.</div></div>
      <div class="mt-12" style="position:relative"><textarea class="textarea" placeholder=${`e.g. “${P.ai.rule}”`} value=${text} onInput=${(e) => setText(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); read(); } }}></textarea></div>
      <div class="row wrap mt-12">${examples.map((x) => html`<button class="cmp-chip" onClick=${() => read(x)}>${x}</button>`)}<span class="right"><${Button} kind="primary" disabled=${!text.trim() || thinking} onClick=${() => read()}>${thinking ? 'Reading…' : 'Read rule'}</${Button}></span></div>
      ${thinking ? html`<div class="faint t-sm mt-12">Replaying ${P.company.period} payroll with this rule</div>` : null}
      ${res ? html`<${RuleResult} res=${res} onApply=${apply} onEdit=${() => setRes(null)} />` : null}
    </div>`;
  }

  function RuleResult({ res, onApply, onEdit }) {
    const P = PO.P();
    const tone = res.confidence === 'High' ? 'green' : res.confidence === 'Medium' ? 'amber' : 'red';
    const blocked = res.kind === 'unknown' || (res.checks || []).some((c) => /can’t apply/.test(c));
    return html`<div class="card mt-16">
      <div class="card-h"><h3>${res.scripted ? 'Here’s the rule I understood' : 'Here’s how I’d read it'}</h3><${Badge} tone=${tone} dot>${res.confidence} confidence</${Badge}><span class="right faint t-sm">“${res.text}”</span></div>
      <div class="card-b">
        <div class="grid g-4">${[['When', res.when], ['Then', res.then], ['Applies to', res.applies], ['From', res.from]].map(([k, v]) => html`<div class="cmp-tile"><div class="lbl">${k}</div><div class="val">${v}</div></div>`)}</div>
        ${res.impact ? html`<div class="divider" style="margin:16px 0"></div><div class="cmp-impact"><div><div class="faint t-sm">Impact on last period</div><div class="hero-num mt-4">${res.impact.hero || '—'}</div>${res.impact.unit ? html`<div class="faint t-sm">${res.impact.unit}</div>` : null}</div>
          <div><p class="muted">${res.impact.text}</p>${res.impact.ids && res.impact.ids.length ? html`<div class="row mt-8"><${AvatarStack} ids=${res.impact.ids} max=${8} /><span class="faint t-sm">${PO.plural(res.impact.n || res.impact.ids.length, 'person', 'people')} affected</span></div>` : null}</div></div>` : null}
        <div class="col mt-16" style="gap:6px">${(res.checks || []).map((c) => html`<div class="row t-sm"><${Icon} n=${/can’t|couldn’t|Try|Tell me|Needs to be/.test(c) ? 'TriangleAlert' : /assumed/.test(c) ? 'Info' : 'Check'} size=${14} cls=${/can’t|couldn’t|Try|Tell me|Needs to be/.test(c) ? '' : /assumed/.test(c) ? 'faint' : 'up'} style=${/can’t|couldn’t|Try|Tell me|Needs to be/.test(c) ? 'color:var(--amber)' : ''} /><span class="muted">${c}</span></div>`)}</div>
        ${!res.scripted && res.kind !== 'unknown' ? html`<div class="mt-12 faint t-sm">This is a best reading. Check the four boxes above; if anything is off, edit the wording and read it again.</div>` : null}
      </div>
      <div class="card-f row"><${Button} kind="primary" disabled=${blocked} onClick=${onApply}>Apply rule</${Button}><${Button} onClick=${onEdit}>Edit wording</${Button}><span class="right faint t-sm">Applied rules are versioned and can be switched off any time</span></div>
    </div>`;
  }

  function ActiveRules() {
    const P = PO.P();
    const [custom, setCustom] = PO.useCoState('rules.custom', []);
    const [disabled, setDisabled] = PO.useCoState('rules.disabled', {});
    const [open, setOpen] = useState(null);
    const builtins = BUILTIN[P.id];
    const list = [
      ...custom.filter(Boolean).map((r, i) => ({ id: r.id || 'c' + i, idx: i, custom: true, name: r.name || r.ruleName || 'Custom rule', value: r.value || r.ruleValue || r.text || '', applies: r.applies || 'As described', from: r.from || PO.date(r.at || PO.TODAY), on: r.on !== false, icon: 'Sparkles', hist: (r.history || [{ v: 1, at: r.at || PO.TODAY, by: r.by || 'People OS assistant', text: r.text || r.value }]).map((h) => [`v${h.v}`, PO.date(h.at), h.text || 'Created', h.by]) })),
      ...builtins.map((b) => ({ ...b, on: !disabled[b.id] })),
    ];
    const toggle = (r) => {
      if (r.custom) setCustom(custom.map((c, i) => (i === r.idx ? { ...c, on: !r.on } : c)));
      else setDisabled({ ...disabled, [r.id]: r.on });
      PO.toast(`${r.name} ${r.on ? 'switched off' : 'switched on'} from the next payroll`, { icon: r.on ? 'PowerOff' : 'Power' });
    };
    const live = list.filter((r) => r.on).length;
    return html`<${Card} flush title="Active rules" sub=${`${live} live, ${custom.length} added in plain language`} actions=${html`<a class="link t-sm" href=${PO.href('compliance?tab=library')}>${P.rules.length} statutory rules</a>`}>
      ${list.map((r) => html`<div class=${'cmp-rule-row ' + (r.on ? '' : 'off')} onClick=${() => setOpen(r)}>
        <div class="grow" style="min-width:0"><div class="row"><span class="w-500 ellipsis">${r.name}</span><span class="faint t-sm" style="white-space:nowrap">${r.custom ? 'plain language' : 'company rule'}, ${r.hist[0][0]}</span></div><div class="muted t-sm ellipsis">${r.value}. ${r.applies}.</div></div>
        <span class="faint t-sm" style="white-space:nowrap">From ${r.from.split(' (')[0]}</span>
        <span onClick=${(e) => e.stopPropagation()}><${Switch} on=${r.on} onChange=${() => toggle(r)} /></span>
      </div>`)}
      <${Drawer} open=${!!open} title=${open && open.name} sub=${open && (open.custom ? 'Added in plain language' : 'Company rule')} onClose=${() => setOpen(null)} footer=${open && html`<${Button} onClick=${() => { toggle(open); setOpen(null); }}>${open.on ? 'Switch off' : 'Switch on'}</${Button}>${open.custom ? html`<${Button} kind="danger" onClick=${() => { const prev = custom; setCustom(custom.filter((_, i) => i !== open.idx)); setOpen(null); PO.toast('Rule deleted', { action: { label: 'Undo', run: () => setCustom(prev) } }); }}>Delete</${Button}>` : null}<${Button} kind="primary" onClick=${() => setOpen(null)}>Done</${Button}>`}>
        ${open ? html`<${KV} items=${[['Rule', open.value], ['Applies to', open.applies], ['Effective from', open.from], ['Status', html`<${Status} s=${open.on ? 'Live' : 'Inactive'} />`], ['Current version', open.hist[0][0]]]} />
          <div class="t-sm w-600 mt-24" style="margin-bottom:10px">Version history</div>
          <${Timeline} items=${open.hist.map(([v, at, what, by], i) => ({ icon: i === 0 ? 'GitCommitHorizontal' : 'History', tone: i === 0 ? 'brand' : '', title: `${v}: ${what}`, sub: `${by}, ${at}` }))} />` : null}
      </${Drawer}>
    </${Card}>`;
  }

  /* ---------- policies ---------- */
  function PolicyCard({ title, icon, sub, children, onSave, updated }) {
    return html`<${Card} title=${title} icon=${icon || "ShieldCheck"} accent=${({ CalendarCheck2: "blue", Clock: "violet", Palmtree: "teal", Receipt: "amber" })[icon] || "green"} sub=${sub} foot=${html`<span class="faint t-sm">${updated}</span><span class="right"><${Button} size="sm" onClick=${onSave}>Save</${Button}></span>`}>${children}</${Card}>`;
  }
  const SwitchRow = ({ label, hint, on, onChange }) => html`<div class="row" style="padding:8px 0;border-top:1px solid var(--border)"><div class="grow"><div class="w-500">${label}</div>${hint ? html`<div class="faint t-sm">${hint}</div>` : null}</div><${Switch} on=${on} onChange=${onChange} /></div>`;

  function Policies() {
    const P = PO.P();
    const cur = P.company.currency === 'INR' ? '₹' : P.company.currency === 'USD' ? '$' : '£';
    const defaults = {
      grace: P.id === 'in' ? 10 : 5, halfDay: 3, radius: P.id === 'us' ? 150 : 200, webGeo: true, autoOut: 12, regWindow: 7, gateQr: true,
      otRate: P.id === 'in' ? '2' : '1.5', otDaily: P.id === 'in' ? 9 : P.id === 'us' ? 0 : 0, otWeekly: P.id === 'in' ? 48 : 40, otApprove: true, otCap: P.id === 'in' ? 50 : P.id === 'us' ? 20 : 30, compOff: P.id === 'in',
      receipt: P.id === 'in' ? 500 : 25, expApprove: true, perDiem: P.id === 'in' ? 300 : P.id === 'us' ? 35 : 25,
      limits: Object.fromEntries(P.vocab.expenseCats.map((c, i) => [c, P.id === 'in' ? [2500, 2000, 3000, 500, 300, 5000][i] : [150, 120, 60, 500, 100, 50][i]])),
      leave: Object.fromEntries(P.leaveTypes.map((l) => [l.key, { quota: l.quota, accrual: l.accrual, carry: l.carry, on: true }])),
    };
    const [pol, setPol] = PO.useCoState('rules.policies', defaults);
    const [draft, setDraft] = useState(pol);
    const [lt, setLt] = useState(null);
    const set = (k, v) => setDraft({ ...draft, [k]: v });
    const save = (what) => { setPol(draft); PO.toast(`${what} policy saved`, { icon: 'CircleCheck' }); };
    const hr = P.byId[P.hrId].name;
    const num = (k, unit, w = 90) => html`<div class="row" style="gap:6px"><input class="input tnum" style=${`width:${w}px`} type="number" value=${draft[k]} onInput=${(e) => set(k, +e.target.value)} />${unit ? html`<span class="faint t-sm">${unit}</span>` : null}</div>`;
    return html`<div class="grid g-2">
      <${PolicyCard} title="Attendance" icon="CalendarCheck2" sub="Clock-in, late marks and corrections" updated=${`Updated 1 Jan 2025 by ${hr}`} onSave=${() => save('Attendance')}>
        <div class="grid g-3"><${Field} label="Grace period">${num('grace', 'min', 80)}</${Field}><${Field} label="Late marks before half day">${num('halfDay', 'a month', 80)}</${Field}><${Field} label="Geofence radius">${num('radius', P.id === 'us' ? 'ft' : 'm', 80)}</${Field}></div>
        <div class="grid g-2 mt-12"><${Field} label="Auto clock-out after">${num('autoOut', 'hours', 80)}</${Field}><${Field} label="Regularise missed punches within">${num('regWindow', 'days', 80)}</${Field}></div>
        <div class="mt-12"><${SwitchRow} label="Portal clock-in needs browser location" hint="Must be inside the site geofence" on=${draft.webGeo !== false} onChange=${(v) => set('webGeo', v)} /><${SwitchRow} label="Site QR code at clock-in" hint="Opens the portal’s clock-in page for that site" on=${draft.gateQr} onChange=${(v) => set('gateQr', v)} /></div>
      </${PolicyCard}>
      <${PolicyCard} title="Overtime" icon="Clock" sub=${P.id === 'in' ? 'Code on Wages: at least 2×' : P.id === 'us' ? 'FLSA: 1.5× after 40 h a week' : 'Contractual; must keep pay above NLW'} updated=${`Updated ${P.id === 'in' ? '21 Nov 2025' : '6 Apr 2025'} by ${hr}`} onSave=${() => save('Overtime')}>
        <div class="grid g-3"><${Field} label="Rate"><${Select} value=${draft.otRate} onChange=${(v) => set('otRate', v)} options=${(P.id === 'in' ? ['2', '2.5', '3'] : ['1.5', '2']).map((x) => [x, x + '×'])} /></${Field}><${Field} label="Daily threshold" hint=${draft.otDaily ? '' : 'Off'}>${num('otDaily', 'h', 70)}</${Field}><${Field} label="Weekly threshold">${num('otWeekly', 'h', 70)}</${Field}></div>
        <div class="grid g-2 mt-12"><${Field} label="Cap per person" hint="Above this, the owner approves">${num('otCap', P.id === 'in' ? 'h a month' : 'h a period', 70)}</${Field}><div></div></div>
        <div class="mt-12"><${SwitchRow} label="Overtime needs approval before payroll" hint="Goes to the site supervisor" on=${draft.otApprove} onChange=${(v) => set('otApprove', v)} />${P.id === 'in' ? html`<${SwitchRow} label="Offer comp-off instead of pay" hint="Employee chooses; expires in 60 days" on=${draft.compOff} onChange=${(v) => set('compOff', v)} />` : null}</div>
      </${PolicyCard}>
      <${PolicyCard} title=${P.leaveTypes[0].name.includes('Paid') ? 'Time off' : P.id === 'uk' ? 'Holiday and absence' : 'Leave'} icon="Palmtree" sub=${`${P.leaveTypes.length} types and ${P.holidays.length} holidays`} updated=${`Updated 1 Jan 2026 by ${hr}`} onSave=${() => save('Leave')}>
        <div class="table-wrap" style="margin:-4px -16px"><table class="tbl compact"><thead><tr><th>Type</th><th class="r">Quota</th><th>Accrual</th><th>Carry over</th><th></th></tr></thead><tbody>
          ${P.leaveTypes.map((l) => { const v = draft.leave[l.key] || {}; return html`<tr class="clickable" onClick=${() => setLt(l)}><td><span class="row"><span class=${'cal-ev ' + l.color} style="width:8px;height:8px;padding:0;border-radius:2px"></span><b class="w-550">${l.name}</b></span></td><td class="r tnum">${v.quota == null ? '—' : `${v.quota} ${l.unit === 'hours' ? 'h' : 'd'}`}</td><td class="t-sm muted">${v.accrual}</td><td class="t-sm muted">${v.carry}</td><td class="r"><${Icon} n="ChevronRight" size=${14} cls="faint" /></td></tr>`; })}
        </tbody></table></div>
      </${PolicyCard}>
      <${PolicyCard} title="Expenses" icon="Receipt" sub="Limits per claim and receipts" updated=${`Updated 4 Jul 2026 by ${hr}`} onSave=${() => save('Expense')}>
        <div class="grid g-3">${P.vocab.expenseCats.map((c) => html`<${Field} label=${c}><div class="input-wrap"><span class="faint" style="position:absolute;left:10px;top:7px">${cur}</span><input class="input tnum" style="padding-left:22px" type="number" value=${draft.limits[c]} onInput=${(e) => set('limits', { ...draft.limits, [c]: +e.target.value })} /></div></${Field}>`)}</div>
        <div class="grid g-2 mt-12"><${Field} label="Receipt required above">${num('receipt', cur, 90)}</${Field}><${Field} label=${P.id === 'in' ? 'Night duty food allowance' : 'Daily meal allowance'}>${num('perDiem', cur, 90)}</${Field}></div>
        <div class="mt-12"><${SwitchRow} label="Over-limit claims go to HR" hint="Within limit: supervisor only" on=${draft.expApprove} onChange=${(v) => set('expApprove', v)} /></div>
      </${PolicyCard}>
      <${Drawer} open=${!!lt} size="sm" title=${lt && lt.name} sub="Leave type" onClose=${() => setLt(null)} footer=${html`<${Button} onClick=${() => setLt(null)}>Cancel</${Button}><${Button} kind="primary" onClick=${() => { setPol(draft); setLt(null); PO.toast(`${lt.name} saved`); }}>Save</${Button}>`}>
        ${lt ? html`<div class="col gap-12">
          <${Field} label=${`Quota (${lt.unit})`} hint=${lt.quota == null ? 'Unlimited / unpaid' : ''}><input class="input tnum" type="number" value=${draft.leave[lt.key].quota ?? ''} disabled=${lt.quota == null} onInput=${(e) => set('leave', { ...draft.leave, [lt.key]: { ...draft.leave[lt.key], quota: +e.target.value } })} /></${Field}>
          <${Field} label="Accrual"><input class="input" value=${draft.leave[lt.key].accrual} onInput=${(e) => set('leave', { ...draft.leave, [lt.key]: { ...draft.leave[lt.key], accrual: e.target.value } })} /></${Field}>
          <${Field} label="Carry over"><input class="input" value=${draft.leave[lt.key].carry} onInput=${(e) => set('leave', { ...draft.leave, [lt.key]: { ...draft.leave[lt.key], carry: e.target.value } })} /></${Field}>
          <${SwitchRow} label="Can be requested in the employee portal" hint="Off: HR records it on the employee’s behalf" on=${draft.leave[lt.key].on} onChange=${(v) => set('leave', { ...draft.leave, [lt.key]: { ...draft.leave[lt.key], on: v } })} />
          <div class="faint t-sm">${PO.plural(P.people.filter((p) => p.leave[lt.key]).length, 'person', 'people')} have this leave type. Changes apply from the next accrual.</div>
        </div>` : null}
      </${Drawer}>
    </div>`;
  }

  /* ---------- approval workflows ---------- */
  const ROLE_OPTS = [['sup', 'Site supervisor'], ['mgr', 'Reporting manager'], ['hr', 'HR'], ['pay', 'Payroll'], ['owner', 'Owner']];
  function defaultFlows(P) {
    const lv = P.id === 'us' ? 'Time off' : P.id === 'uk' ? 'Holiday' : 'Leave';
    return [
      { id: 'leave', name: lv, icon: 'Palmtree', sla: 24, auto: false, lanes: [{ cond: 'Up to 3 days', steps: ['sup'] }, { cond: 'More than 3 days', steps: ['sup', 'hr', 'owner'] }] },
      { id: 'ot', name: 'Overtime', icon: 'Clock', sla: 24, auto: false, lanes: [{ cond: P.id === 'in' ? 'Up to 10 h a month' : 'Up to 5 h a period', steps: ['sup'] }, { cond: P.id === 'in' ? 'More than 10 h a month' : 'More than 5 h a period', steps: ['sup', 'pay'] }] },
      { id: 'exp', name: 'Expense claim', icon: 'Receipt', sla: 48, auto: false, lanes: [{ cond: 'Within policy limit', steps: ['sup'] }, { cond: 'Over limit or no receipt', steps: ['sup', 'hr'] }] },
      { id: 'adv', name: P.id === 'us' ? 'Pay advance' : 'Salary advance', icon: 'HandCoins', sla: 48, auto: false, lanes: [{ cond: 'Any amount', steps: ['hr', 'owner'] }] },
      { id: 'reg', name: 'Missed punch', icon: 'Fingerprint', sla: 12, auto: true, lanes: [{ cond: 'Gate or device log matches', steps: [] }, { cond: 'No log to match', steps: ['sup'] }] },
      { id: 'swap', name: 'Shift swap', icon: 'ArrowLeftRight', sla: 12, auto: true, lanes: [{ cond: 'Both trained, no overtime', steps: [] }, { cond: 'Causes overtime', steps: ['sup'] }] },
      { id: 'rev', name: 'Salary revision', icon: 'TrendingUp', sla: 72, auto: false, lanes: [{ cond: 'Any change', steps: ['mgr', 'hr', 'owner'] }] },
      { id: 'exit', name: P.id === 'in' ? 'Exit and F&F' : 'Exit and final pay', icon: 'UserMinus', sla: 24, auto: false, lanes: [{ cond: P.id === 'in' ? 'Settle within 2 working days' : 'Every exit', steps: ['hr', 'pay', 'owner'] }] },
    ];
  }
  function stepPerson(P, k) {
    if (k === 'hr') return P.byId[P.hrId];
    if (k === 'owner') return P.byId[P.topId];
    if (k === 'pay') return P.byId[P.hrId];
    if (k === 'sup') return P.byId[P.hero.supervisor] || P.byId[P.hero.manager];
    return P.byId[P.hero.manager];
  }
  function Chain({ steps, P }) {
    return html`<div class="cmp-chain"><span class="cmp-node start"><${Icon} n="Send" size=${12} />Request</span>
      ${steps.length ? steps.map((k) => { const p = stepPerson(P, k); const label = ROLE_OPTS.find((r) => r[0] === k)[1]; return html`<span class="cmp-arrow"><${Icon} n="ChevronRight" size=${14} /></span><span class="cmp-node">${k === 'sup' || k === 'mgr' ? html`<span class="nic"><${Icon} n=${k === 'sup' ? 'HardHat' : 'UserRound'} size=${12} /></span>` : html`<${PO.Avatar} p=${p} size="xs" />`}<span><b class="w-550">${label}</b><small>${k === 'sup' ? 'of the employee’s site' : k === 'mgr' ? 'of the employee' : p.name}</small></span></span>`; })
        : html`<span class="cmp-arrow"><${Icon} n="ChevronRight" size=${14} /></span><span class="cmp-node" style="padding-left:10px"><${Icon} n="Zap" size=${13} /><b class="w-550">Auto-approved</b></span>`}
      <span class="cmp-arrow"><${Icon} n="ChevronRight" size=${14} /></span><span class="cmp-node end"><${Icon} n="Check" size=${12} />Approved</span></div>`;
  }
  const FLOW_EX = (P) => `${P.id === 'us' ? 'Time off' : P.id === 'uk' ? 'Holiday' : 'Leave'} over 5 days needs HR and the owner`;
  function Workflows({ onTry }) {
    const P = PO.P();
    const [flows, setFlows] = PO.useCoState('rules.workflows', defaultFlows(P));
    const [edit, setEdit] = useState(null);
    const save = () => { setFlows(flows.map((f) => (f.id === edit.id ? edit : f))); setEdit(null); PO.toast(`${edit.name} approvals saved`, { icon: 'GitBranch' }); };
    const setLane = (li, patch) => setEdit({ ...edit, lanes: edit.lanes.map((l, i) => (i === li ? { ...l, ...patch } : l)) });
    return html`<div class="col" style="gap:16px">
      <div class="row t-sm muted">You can also describe a chain in plain language, for example “${FLOW_EX(P)}”.<a class="link" style="margin-left:4px" onClick=${onTry}>Try it</a></div>
      ${flows.map((f) => html`<div class="card"><div class="card-h"><h3>${f.name}</h3><span class="sub">Respond within ${f.sla} h, then escalate to ${P.byId[P.topId].first}${f.auto ? '. Auto-approval on.' : ''}</span><div class="right"><${Button} size="sm" kind="ghost" onClick=${() => setEdit(JSON.parse(JSON.stringify(f)))}>Edit</${Button}></div></div>
        <div class="card-b" style="padding-top:6px;padding-bottom:6px">${f.lanes.map((l) => html`<div class="cmp-lane"><div class="cmp-cond"><span>${l.cond}</span></div><${Chain} steps=${l.steps} P=${P} /></div>`)}</div></div>`)}
      <${Drawer} open=${!!edit} size="lg" title=${edit && `${edit.name} approvals`} sub="Conditions are checked top to bottom; the first match wins" onClose=${() => setEdit(null)} footer=${html`<${Button} onClick=${() => setEdit(null)}>Cancel</${Button}><${Button} kind="primary" onClick=${save}>Save chain</${Button}>`}>
        ${edit ? html`<div class="grid g-2"><${Field} label="Respond within (SLA)"><div class="row" style="gap:6px"><input class="input tnum" type="number" style="width:90px" value=${edit.sla} onInput=${(e) => setEdit({ ...edit, sla: +e.target.value })} /><span class="faint t-sm">hours, then escalate to ${P.byId[P.topId].name}</span></div></${Field}><${Field} label="Auto-approval"><${Switch} on=${edit.auto} onChange=${(v) => setEdit({ ...edit, auto: v })} label="Approve automatically when every check passes" /></${Field}></div>
          ${edit.lanes.map((l, li) => html`<div class="card inset mt-16"><div class="card-b">
            <div class="row" style="margin-bottom:12px"><span class="t-sm w-600" style="white-space:nowrap">Condition ${li + 1}</span><input class="input" style="max-width:320px" value=${l.cond} onInput=${(e) => setLane(li, { cond: e.target.value })} />${edit.lanes.length > 1 ? html`<span class="right"><${PO.IconButton} icon="Trash2" size="sm" title="Remove condition" onClick=${() => setEdit({ ...edit, lanes: edit.lanes.filter((_, i) => i !== li) })} /></span>` : null}</div>
            ${l.steps.map((s, si) => html`<div class="cmp-step-row"><span class="cmp-step-n">${si + 1}</span><${Select} value=${s} onChange=${(v) => setLane(li, { steps: l.steps.map((x, i) => (i === si ? v : x)) })} options=${ROLE_OPTS} /><span class="faint t-sm ellipsis">${s === 'sup' || s === 'mgr' ? 'Depends on employee' : stepPerson(P, s).name}</span><${PO.IconButton} icon="X" size="sm" title="Remove step" onClick=${() => setLane(li, { steps: l.steps.filter((_, i) => i !== si) })} /></div>`)}
            ${l.steps.length ? null : html`<div class="faint t-sm" style="margin-bottom:8px">No approvers: requests that match are approved automatically.</div>`}
            <${Button} size="sm" kind="ghost" icon="Plus" onClick=${() => setLane(li, { steps: [...l.steps, l.steps.includes('hr') ? 'owner' : 'hr'] })}>Add approver</${Button}>
            <div class="mt-12"><${Chain} steps=${l.steps} P=${P} /></div>
          </div></div>`)}
          <div class="mt-12"><${Button} icon="Plus" onClick=${() => setEdit({ ...edit, lanes: [...edit.lanes, { cond: 'Otherwise', steps: ['sup'] }] })}>Add condition</${Button}></div>` : null}
      </${Drawer}>
    </div>`;
  }

  function RulesPage({ query }) {
    const P = PO.P();
    const [tab, setTab] = useState(query.tab || 'rules');
    const [custom] = PO.useCoState('rules.custom', []);
    const [tryText, setTry] = useState(query.try || '');
    return html`
      <${PageHeader} title="Rules & policies" sub=${`${PO.plural(BUILTIN[P.id].length + custom.length, 'company rule')}, 4 policies and 8 approval chains, on top of ${PO.plural(P.rules.length, 'statutory rule')} for ${P.company.country}.`} actions=${html`<${Button} onClick=${() => PO.fakeDownload('Policy handbook (PDF)')}>Export handbook</${Button}><${Button} kind="primary" onClick=${() => { setTab('rules'); setTimeout(() => { const el = document.querySelector('.cmp-composer textarea'); el && el.focus(); }); }}>New rule</${Button}>`} />
      <${Tabs} value=${tab} onChange=${setTab} tabs=${[['rules', 'Rules', BUILTIN[P.id].length + custom.length], ['policies', 'Policies'], ['workflows', 'Approval workflows']]} />
      <div>
        ${tab === 'rules' ? html`<${ActiveRules} /><div style="margin-top:24px"><${RuleComposer} key=${tryText} init=${tryText} /></div>` : null}
        ${tab === 'policies' ? html`<${Policies} />` : null}
        ${tab === 'workflows' ? html`<${Workflows} onTry=${() => { setTry(FLOW_EX(P)); setTab('rules'); }} />` : null}
      </div>`;
  }
  PO.route('rules', RulesPage, { title: 'Rules & policies' });
  /* shared with settings.js (Settings → Approval workflows reads the same chains) */
  PO.approvalFlows = { defaults: defaultFlows, roles: ROLE_OPTS };
})();
