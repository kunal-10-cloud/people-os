/* People OS: Attendance (route `attendance`). Muster grid that feeds payroll, exceptions with regularisation,
   timesheets, overtime, clock-in setup (geofences on real maps, site QR, kiosks/terminals, supervisor entry) and attendance policies.
   The muster is derived from each person's pay units (p.u) and approved leave, so paid days / hours, LOP and
   OT here equal what payroll pays. PO.musterOf(P) is exported so other modules can read the same grid. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;

  /* ================= model ================= */
  const MONS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function periodOf(P) {
    const start = P.id === 'in' ? '2026-09-01' : P.id === 'us' ? '2026-09-21' : '2026-09-07';
    const n = P.id === 'in' ? 30 : P.id === 'us' ? 14 : 28;
    const days = Array.from({ length: n }, (_, i) => { const iso = PO.addDays(start, i); const d = new Date(iso + 'T00:00:00Z'); return { i, iso, dn: d.getUTCDate(), wd: d.getUTCDay(), mon: d.getUTCMonth() }; });
    return { start, n, days, end: days[n - 1].iso, hours: P.id !== 'in' };
  }
  const missedIdx = (days, txt) => {
    if (!txt) return -1;
    const t = txt.toLowerCase(); const dn = +(t.match(/\d+/) || [0])[0]; const mi = MONS.findIndex((m) => t.includes(m));
    return days.findIndex((d) => d.dn === dn && d.mon === mi);
  };

  function buildMuster(P) {
    const per = periodOf(P);
    const { days, n } = per;
    const hol = new Map(P.holidays.map((h) => [h.date, h.name]));
    const reqs = P.leaveRequests.filter((l) => l.status === 'Approved' && l.to >= days[0].iso && l.from <= per.end);
    const reqBy = {}; reqs.forEach((l) => (reqBy[l.who] = reqBy[l.who] || []).push(l));
    const rows = P.people.map((p, pi) => {
      const r = PO.seeded('mus' + P.id + p.id);
      const cells = days.map(() => ({ c: per.hours ? 'WO' : 'P', h: 0, ot: 0 }));
      const emp = days.map((d) => d.iso >= p.joinedIso);
      emp.forEach((e, k) => { if (!e) cells[k].c = '-'; });
      const mi = missedIdx(days, p.missed);
      const myReqs = (reqBy[p.id] || []).flatMap((l) => days.filter((d) => d.iso >= l.from && d.iso <= l.to && emp[d.i]).map((d) => ({ k: d.i, l })));
      const reqIdx = new Set(myReqs.map((x) => x.k));
      const isSal = !!P.roles[p.role].salary;
      const free = (k) => emp[k] && !reqIdx.has(k) && !hol.has(days[k].iso);
      if (!per.hours) {
        /* India: daily codes. Paid days = employed days − LOP; WO, L and H are paid. */
        const woWd = p.role === 'office' ? 0 : r.int(0, 6);
        days.forEach((d, k) => { if (!emp[k]) return; if (d.wd === woWd) cells[k].c = 'WO'; if (hol.has(d.iso)) { cells[k].c = 'H'; cells[k].note = hol.get(d.iso); } });
        myReqs.forEach(({ k, l }) => { cells[k] = { c: 'L', lt: l.type, req: l.id, h: 0, ot: 0 }; });
        if (mi >= 0) { if (cells[mi].c === 'WO') { const sw = mi + 1 < n ? mi + 1 : mi - 1; cells[sw].c = 'WO'; } cells[mi] = { c: 'P', missed: true, h: 0, ot: 0 }; }
        const employed = emp.filter(Boolean).length;
        let lop = Math.max(0, employed - p.u.paid);
        const cand = r.shuffle(days.map((d) => d.i).filter((k) => cells[k].c === 'P' && !cells[k].missed && k >= 2));
        const halfDay = lop >= 2 && r.chance(0.55);
        for (let j = 0; j < lop && cand.length; j++) cells[cand.shift()].c = 'A';
        if (halfDay) { const a = cells.findIndex((c) => c.c === 'A'); if (a >= 0 && cand.length) { cells[a].c = 'HD'; cells[cand.shift()].c = 'HD'; } }
        let ot = p.u.ot || 0;
        const pIdx = r.shuffle(days.map((d) => d.i).filter((k) => cells[k].c === 'P'));
        for (let j = 0; ot > 0 && pIdx.length; j++) { const k = pIdx[j % pIdx.length]; const ch = Math.min(ot, r.pick([2, 2, 3, 4])); cells[k].ot += ch; ot -= ch; }
        let nights = p.u.nights || 0;
        r.shuffle(days.map((d) => d.i).filter((k) => cells[k].c === 'P')).slice(0, nights).forEach((k) => (cells[k].night = true));
        cells.forEach((c) => { if (c.c === 'P') c.h = 8 + c.ot; if (c.c === 'HD') c.h = 4; });
      } else {
        /* US / UK: hours. Worked days = paid regular hours / 8, leave from p.u, OT spread over full weeks. */
        const u = p.u || {};
        const reg = isSal ? 80 * (n / 14) : (P.id === 'us' ? u.reg : u.hours) || 0;
        let leaveBudget = (P.id === 'us' ? u.pto : u.hol) || 0;
        const weeks = [];
        for (let w = 0; w < n / 7; w++) weeks.push(days.slice(w * 7, w * 7 + 7).map((d) => d.i));
        if (isSal) {
          days.forEach((d, k) => { if (emp[k] && d.wd >= 1 && d.wd <= 5 && !hol.has(d.iso)) cells[k] = { c: 'W', h: 8, ot: 0 }; });
          let owed = u.otOwed || 0;
          const wk = r.shuffle(days.map((d) => d.i).filter((k) => cells[k].c === 'W'));
          for (let j = 0; owed > 0; j++) { const k = wk[j % wk.length]; const ch = Math.min(owed, r.pick([1, 2, 2, 3])); cells[k].owed = (cells[k].owed || 0) + ch; cells[k].h += ch; owed -= ch; }
        } else {
          let regDays = Math.round(reg / 8);
          const empW = weeks.map((w) => w.filter((k) => emp[k]).length);
          const totE = empW.reduce((a, b) => a + b, 0) || 1;
          const target = empW.map((e) => Math.min(e, Math.floor((regDays * e) / totE)));
          let left = regDays - target.reduce((a, b) => a + b, 0);
          for (let w = 0; left > 0 && w < 40; w++) { const ix = w % weeks.length; if (target[ix] < Math.min(empW[ix], 6)) { target[ix]++; left--; } }
          const startWd = r.int(0, 6);
          weeks.forEach((w, wi) => {
            let need = target[wi];
            for (let s = 0; s < 7 && need > 0; s++) { const k = w[(startWd + s) % 7]; if (k != null && free(k)) { cells[k] = { c: 'W', h: 8, ot: 0 }; need--; } }
          });
          let short = regDays - cells.filter((c) => c.c === 'W').length;
          for (let k = 0; short > 0 && k < n; k++) { const kk = (k + startWd) % n; if (cells[kk].c === 'WO' && free(kk)) { cells[kk] = { c: 'W', h: 8, ot: 0 }; short--; } }
          myReqs.forEach(({ k, l }) => { const paid = leaveBudget >= 8; if (paid) leaveBudget -= 8; cells[k] = { c: 'L', lt: l.type, req: l.id, paid, h: paid ? 8 : 0, ot: 0 }; });
          const ptoKey = P.id === 'us' ? 'pto' : 'hol';
          const offIdx = r.shuffle(days.map((d) => d.i).filter((k) => cells[k].c === 'WO' && emp[k] && days[k].wd >= 1 && days[k].wd <= 5));
          while (leaveBudget >= 8 && offIdx.length) { const k = offIdx.shift(); cells[k] = { c: 'L', lt: ptoKey, paid: true, h: 8, ot: 0 }; leaveBudget -= 8; }
          if (mi >= 0 && cells[mi].c !== 'W') {
            const wk = weeks.find((w) => w.includes(mi));
            const drop = wk.find((k) => k !== mi && cells[k].c === 'W');
            if (drop != null) cells[drop] = { c: 'WO', h: 0, ot: 0 };
            cells[mi] = { c: 'W', h: 8, ot: 0 };
          }
          if (mi >= 0) cells[mi].missed = true;
          let ot = u.ot || 0;
          const full = weeks.filter((w) => w.filter((k) => cells[k].c === 'W').length >= 5);
          const pool = r.shuffle((full.length ? full : weeks).flat().filter((k) => cells[k].c === 'W' && !cells[k].missed));
          const spread = Math.max(1, Math.min(pool.length, Math.ceil((u.ot || 0) / 2.5)));
          for (let j = 0; ot > 0 && pool.length; j++) { const k = pool[j % spread]; const ch = Math.min(ot, r.pick([1, 2, 2, 3, 4])); cells[k].ot += ch; cells[k].h += ch; ot -= ch; }
          // an occasional no-show on a scheduled shift (unpaid, so pay is unaffected)
          if (!p.hero && r.chance(0.14) && reg < 80 * (n / 14)) { const k = r.shuffle(days.map((d) => d.i).filter((k2) => cells[k2].c === 'WO' && emp[k2] && days[k2].wd >= 1 && days[k2].wd <= 5))[0]; if (k != null) cells[k] = { c: 'A', h: 0, ot: 0 }; }
        }
      }
      return { p, cells, idx: pi };
    });
    return { per, rows, hol };
  }

  /** Totals for a row, honouring cell edits. */
  function totalsOf(P, row, cellsIn) {
    const cells = cellsIn || row.cells;
    const t = { P: 0, A: 0, L: 0, WO: 0, H: 0, HD: 0, miss: 0, ot: 0, reg: 0, leaveH: 0, unpaidL: 0, owed: 0, employed: 0 };
    cells.forEach((c) => {
      if (c.c !== '-') t.employed++;
      if (c.missed) t.miss++;
      t.ot += c.ot || 0;
      t.owed += c.owed || 0;
      if (c.c === 'P' || c.c === 'W') { t.P++; t.reg += (c.h || 8) - (c.ot || 0) - (c.owed || 0); }
      else if (c.c === 'L') { t.L++; if (c.paid === false) t.unpaidL++; else t.leaveH += c.h || 0; }
      else if (c.c === 'HD') { t.HD++; t.reg += 4; }
      else if (t[c.c] != null) t[c.c]++;
    });
    t.lop = t.A + t.HD / 2;
    t.paid = t.employed - t.lop;
    t.paidH = t.reg + t.leaveH;
    return t;
  }
  PO.musterOf = (P) => { if (!P._muster) P._muster = buildMuster(P); return P._muster; };

  /* late arrivals, early exits and missed breaks over the period, consistent with P.lateBySite */
  function buildExceptions(P, M) {
    const r = PO.seeded('exc' + P.id);
    const out = [];
    const worked = (row) => row.cells.map((c, k) => [c, k]).filter(([c]) => (c.c === 'P' || c.c === 'W') && !c.missed);
    P.people.filter((p) => p.missed).forEach((p) => {
      const row = M.rows.find((x) => x.p.id === p.id);
      const k = row.cells.findIndex((c) => c.missed);
      const ap = P.approvals.find((a) => a.who === p.id && a.kind === 'Missed punch');
      const inMiss = ap && /Clock-in missing/.test(ap.title);
      out.push({ id: 'mp-' + p.id, type: 'Missed punch', p, k, ap, detail: ap ? ap.title : 'Clock-out missing', evidence: ap ? ap.detail : '', proposal: ap ? (ap.ask.match(/\d{1,2}[:.]\d{2}\s*(am|pm)?/i) || [''])[0] : '', inMiss });
    });
    P.lateBySite.forEach(([name, count]) => {
      const s = P.sites.find((x) => x.name === name); if (!s) return;
      const rows = M.rows.filter((x) => x.p.site === s.id && x.p.role !== 'office');
      if (!rows.length) return;
      for (let j = 0; j < count; j++) {
        const row = r.pick(rows); const w = worked(row); if (!w.length) continue;
        const [, k] = r.pick(w);
        out.push({ id: `lt-${s.id}-${j}`, type: 'Late arrival', p: row.p, k, min: r.pick([3, 4, 6, 8, 9, 11, 12, 14, 17, 22, 31]) });
      }
    });
    const all = M.rows.filter((x) => x.p.role !== 'office');
    const nEarly = Math.round(out.length * 0.18), nBreak = Math.round(out.length * 0.14);
    for (let j = 0; j < nEarly; j++) { const row = r.pick(all); const w = worked(row); if (!w.length) continue; out.push({ id: 'ee-' + j, type: 'Early exit', p: row.p, k: r.pick(w)[1], min: r.pick([10, 15, 20, 25, 35, 45, 60]) }); }
    for (let j = 0; j < nBreak; j++) { const row = r.pick(all); const w = worked(row); if (!w.length) continue; out.push({ id: 'mb-' + j, type: 'Missed break', p: row.p, k: r.pick(w)[1] }); }
    return out.sort((a, b) => (a.type === 'Missed punch' ? 0 : 1) - (b.type === 'Missed punch' ? 0 : 1) || b.k - a.k);
  }

  /* ================= styles ================= */
  document.head.insertAdjacentHTML('beforeend', `<style>
  .at-grid-wrap { overflow: auto; max-height: max(420px, calc(100vh - 318px)); position: relative; }
  table.at-grid { border-collapse: separate; border-spacing: 0; font-size: 11.5px; }
  .at-grid th, .at-grid td { height: 36px; padding: 0; border-bottom: 1px solid var(--border); text-align: center; white-space: nowrap; background: var(--surface); }
  .at-grid thead th { position: sticky; top: 0; z-index: 2; background: var(--surface-2); font-weight: 550; color: var(--text-2); height: 40px; }
  .at-grid thead th .wd { display: block; font-size: 9.5px; color: var(--text-3); font-weight: 500; }
  .at-grid th.we, .at-grid td.we { background: var(--surface-2); }
  .at-grid thead th.we { background: var(--surface-3); }
  .at-grid tfoot td { position: sticky; bottom: 0; z-index: 1; background: var(--surface-2); border-top: 1px solid var(--border); border-bottom: 0; }
  .at-grid tfoot td.nm, .at-grid tfoot td.tc { z-index: 3; }
  .at-grid .nm { position: sticky; left: 0; z-index: 1; text-align: left; padding: 0 10px 0 12px; min-width: 232px; max-width: 232px; border-right: 1px solid var(--border); }
  .at-grid thead .nm { z-index: 3; }
  .at-grid .tc { position: sticky; z-index: 1; min-width: 58px; max-width: 58px; font-family: var(--num); font-size: 13px; font-variant-numeric: tabular-nums; font-weight: 550; background: var(--surface); text-align: right; padding-right: 12px; }
  .at-grid thead .tc { z-index: 3; font-size: 11px; line-height: 1.15; white-space: normal; background: var(--surface-2); }
  .at-grid .tc.first { border-left: 1px solid var(--border-strong); }
  .at-grid tbody tr:hover td { background: var(--hover); }
  .at-grid tbody tr:hover td.tc { background: var(--hover); }
  .at-c { display: inline-grid; place-items: center; width: 26px; height: 22px; border-radius: 4px; font-weight: 500; font-size: 11.5px; font-family: var(--num); position: relative; cursor: pointer; font-variant-numeric: tabular-nums; color: var(--text-3); }
  .at-c:hover { box-shadow: inset 0 0 0 1px var(--border-strong); }
  .at-c.W { color: var(--text-2); }
  .at-c.A { background: var(--red-soft); color: var(--red); font-weight: 650; }
  .at-c.L { color: var(--teal); background: color-mix(in srgb, var(--teal) 15%, var(--surface)); font-size: 10px; font-weight: 600; }
  .at-c.WO { color: var(--text-3); font-size: 9.5px; opacity: .7; }
  .at-c.H { color: var(--text-2); font-weight: 600; font-size: 10px; }
  .at-c.HD { background: var(--amber-soft); color: var(--amber); font-weight: 650; font-size: 10px; }
  .at-c.X { background: var(--surface); color: var(--red); font-weight: 700; box-shadow: inset 0 0 0 1.5px var(--red-solid); }
  .at-c.dash { color: var(--text-3); cursor: default; }
  .at-c.ed { box-shadow: inset 0 0 0 1.5px var(--brand); }
  .at-c .o { position: absolute; top: -3px; right: -5px; color: var(--amber); font-size: 9px; font-weight: 700; line-height: 1; }
  .at-c .n { position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%); width: 3px; height: 3px; border-radius: 50%; background: var(--text-3); }
  .at-legend { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; font-size: 11.5px; color: var(--text-3); }
  .at-legend > span { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
  .at-legend .at-c { width: auto; min-width: 18px; padding: 0 3px; height: 18px; cursor: default; }
  .at-legend .at-c:hover { box-shadow: none; }
  .at-legend .at-c.X:hover { box-shadow: inset 0 0 0 1.5px var(--red-solid); }
  .at-kind { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
  .at-kind i { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  .at-kind .chip-ic { width: 24px; height: 24px; }
  .at-types { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 0 0 16px; }
  .at-type { border: 1px solid var(--border); border-top: 2px solid var(--acc); border-radius: 8px; background: var(--surface); padding: 12px 14px; min-width: 0; }
  .at-type.red { --acc: var(--red-solid); } .at-type.amber { --acc: var(--amber-solid); } .at-type.slate { --acc: var(--blue-solid); }
  .at-type-n { font-family: var(--num); font-size: 24px; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
  @media (max-width: 900px) { .at-types { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .at-qr { flex: none; display: block; border-radius: 8px; border: 1px solid var(--border); background: #fff; }
  .at-setup { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 16px; }
  .at-site { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 14px; border: 0; border-bottom: 1px solid var(--border); background: none; cursor: pointer; color: var(--text); font: inherit; }
  .at-site:last-child { border-bottom: 0; }
  .at-site:hover { background: var(--hover); }
  .at-site.on { background: var(--surface-3); box-shadow: inset 2px 0 0 var(--ink); }
  .at-inl .seg { align-self: flex-start; }
  .at-geo-ctl { display: flex; gap: 16px; align-items: center; }
  @media (max-width: 1100px) { .at-setup { grid-template-columns: 1fr; } }
  .at-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .at-dev { display: flex; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .at-dev:last-child { border-bottom: 0; }
  .at-dev > svg { color: var(--text-3); flex: none; }
  .at-pol { display: grid; grid-template-columns: 220px 1fr auto; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--border); align-items: center; }
  .at-pol:last-child { border-bottom: 0; }
  .at-punch { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
  .at-bar { position: relative; height: 26px; border-radius: 6px; background: var(--surface-3); overflow: hidden; }
  .at-bar i { position: absolute; top: 4px; bottom: 4px; border-radius: 4px; }
  </style>`);

  /* ================= shared bits ================= */
  function useScope() {
    const { state } = PO.useStore();
    const P = PO.P();
    const v = PO.viewer();
    return useMemo(() => {
      if (state.role !== 'manager') return null;
      const s = new Set([v.id]);
      const walk = (id) => (P.byManager[id] || []).forEach((c) => { if (!s.has(c)) { s.add(c); walk(c); } });
      walk(v.id);
      return s;
    }, [P.id, state.role, v.id]);
  }
  const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const WDL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ltShort = (P, key) => { const t = PO.leaveType(key); return t ? t.short : key; };
  const ltColor = (P, key) => { const t = PO.leaveType(key); return t ? t.color : 'blue'; };
  const codeName = { P: 'Present', W: 'Worked', A: 'Absent (unpaid)', L: 'Leave', WO: 'Weekly off', H: 'Holiday', HD: 'Half day', '-': 'Not joined yet' };
  const isWE = (P, d) => (P.id === 'in' ? d.wd === 0 : d.wd === 0 || d.wd === 6);

  /** effective cell: applies edits and approved regularisations */
  function effCell(c, key, edits, regOk) {
    let x = c;
    if (edits[key]) x = { ...c, ...edits[key], ed: true };
    if (x.missed && regOk) x = { ...x, missed: false, fixed: true };
    return x;
  }

  function Cell({ P, c, onClick }) {
    if (c.c === '-') return html`<span class="at-c dash">·</span>`;
    const hours = P.id !== 'in';
    if (c.missed) return html`<span class="at-c X" onClick=${onClick} title="Missed punch, needs regularising">!</span>`;
    let cls = c.c, txt = c.c;
    if (c.c === 'L') { cls = 'L ' + ltColor(P, c.lt); txt = ltShort(P, c.lt).slice(0, 3); if (hours) txt = c.paid === false ? '0' : ltShort(P, c.lt).slice(0, 3); }
    if ((c.c === 'P' || c.c === 'W') && hours) txt = String(c.h);
    if (c.c === 'P' && !hours) txt = 'P';
    if (c.c === 'WO') txt = hours ? '–' : 'WO';
    if (c.c === 'HD') txt = 'HD';
    return html`<span class=${`at-c ${cls} ${c.ed ? 'ed' : ''}`} onClick=${onClick}>${txt}${c.ot ? html`<span class="o">${c.ot}</span>` : null}${c.night ? html`<span class="n"></span>` : null}</span>`;
  }

  /* ================= page ================= */
  function AttendancePage({ query }) {
    const P = PO.P();
    const { state } = PO.useStore();
    const scope = useScope();
    const M = PO.musterOf(P);
    const EX = useMemo(() => buildExceptions(P, M), [P.id]);
    const [tab, setTab] = PO.useCoState('attendance.tab', query.tab || 'muster');
    const [edits, setEdits] = PO.useCoState('attendance.edits', {});
    const [reg, setReg] = PO.useCoState('attendance.reg', {});
    const [locked, setLocked] = PO.useCoState('attendance.locked', null);
    const decided = PO.coGet(state, 'approvals.decided', {});
    const [ask, confirmEl] = PO.useConfirm();
    const regOk = (e) => reg[e.id] === 'approved' || (e.ap && decided[e.ap.id] === 'approved');
    const missRegOk = (p) => { const e = EX.find((x) => x.type === 'Missed punch' && x.p.id === p.id); return e ? regOk(e) : false; };

    const rows = M.rows.filter((x) => !scope || scope.has(x.p.id));
    const cellsOf = (row) => row.cells.map((c, k) => effCell(c, row.p.id + '|' + k, edits, c.missed && missRegOk(row.p)));
    const tots = rows.map((row) => totalsOf(P, row, cellsOf(row)));
    const sum = (f) => tots.reduce((t, x) => t + f(x), 0);
    const sched = sum((t) => t.P + t.A + t.HD + (P.id === 'in' ? t.L : 0));
    const attPct = sched ? 1 - sum((t) => t.A + t.HD / 2) / sched : 1;
    const exScoped = EX.filter((e) => !scope || scope.has(e.p.id));
    const openMiss = exScoped.filter((e) => e.type === 'Missed punch' && !regOk(e)).length;
    const lateN = exScoped.filter((e) => e.type === 'Late arrival').length;
    const otH = sum((t) => t.ot);
    const lop = sum((t) => t.lop);
    const leaveH = sum((t) => t.leaveH);
    const T = { query, rows, tots, cellsOf, edits, setEdits, locked, setLocked, reg, setReg, regOk, decided, EX: exScoped, M, scope, ask };

    const doLock = () => {
      const paidDays = sum((t) => t.paid);
      ask({
        title: `Lock ${P.id === 'in' ? 'the muster' : 'timesheets'} for ${P.company.period}?`, icon: 'Lock', confirm: 'Lock for payroll',
        body: html`<div class="col gap-12"><p>Payroll will read ${P.id === 'in' ? html`<b>${PO.num(paidDays, 1).replace(/\.0$/, '')} paid days</b>, <b>${PO.num(lop, 1).replace(/\.0$/, '')} LOP days</b>` : html`<b>${PO.num(sum((t) => t.paidH))} paid hours</b>`} and <b>${PO.num(otH)} h overtime</b> for ${PO.plural(rows.length, 'person', 'people')}. Edits are blocked until you unlock.</p>
          ${openMiss ? html`<${PO.Callout} tone="amber" icon="TriangleAlert" title=${`${openMiss} missed ${openMiss === 1 ? 'punch is' : 'punches are'} still open`}>They will be paid as rostered. You can still regularise them before payroll is approved.</${PO.Callout}>` : html`<${PO.Callout} tone="green" icon="CircleCheck" title="All exceptions are resolved">Every missed punch has a decision.</${PO.Callout}>`}</div>`,
        onConfirm: () => { setLocked({ at: P.hhmm(P.company.nowMin), by: PO.viewer ? P.byId[P.hrId].name : '' }); PO.toast(`${P.id === 'in' ? 'Muster' : 'Timesheets'} locked for ${P.company.period}. Payroll can now read it.`, { icon: 'Lock', action: { label: 'Undo', run: () => setLocked(null) } }); },
      });
    };

    const tabs = [['muster', P.id === 'in' ? 'Muster' : 'Hours grid'], ['exceptions', 'Exceptions', exScoped.filter((e) => !regOk(e) && e.type === 'Missed punch').length + exScoped.filter((e) => e.type === 'Missed break' && !reg[e.id]).length], ['timesheets', P.id === 'in' ? 'Daily log' : 'Timesheets'], ['overtime', 'Overtime'], ['setup', 'Clock-in setup'], ['policies', 'Policies']];
    const exportMuster = () => PO.exportCsv(P.id === 'in' ? 'muster-sep-2026' : 'timesheet-' + P.company.period.replace(/\W+/g, '-').toLowerCase(), [['Employee ID', 'Name', 'Site', ...M.per.days.map((d) => d.iso), ...(P.id === 'in' ? ['Paid days', 'LOP', 'OT h'] : ['Regular h', 'Leave h', 'OT h', 'Paid h'])], ...rows.map((row, i) => { const cs = cellsOf(row); const t = tots[i]; return [row.p.id, row.p.name, PO.site(row.p.site).name, ...cs.map((c) => (c.missed ? '!' : c.c === 'L' ? ltShort(P, c.lt) : (c.c === 'W' || (c.c === 'P' && P.id !== 'in')) ? c.h : c.c) + (c.ot ? `+${c.ot}` : '')), ...(P.id === 'in' ? [t.paid, t.lop, t.ot] : [t.reg, t.leaveH, t.ot, t.paidH])]; })]);

    const IN = P.id === 'in';
    const word = IN ? 'muster' : 'timesheets';
    return html`
      <${PO.PageHeader} title="Attendance" sub=${html`${IN ? 'Muster for ' + P.company.period : 'Pay period ' + P.company.period}, ${PO.plural(rows.length, 'person', 'people')}${scope ? ' in your team' : ''}. ${locked ? html`<span class="badge dot green" style="height:auto;vertical-align:-1px">Locked for payroll at ${locked.at}</span>` : 'Open for edits until you lock it for payroll.'}`}
        actions=${html`${locked ? html`<${PO.Button} icon="LockOpen" onClick=${() => { setLocked(null); PO.toast('Unlocked. Edits are allowed again.'); }}>Unlock</${PO.Button}><${PO.Button} kind="primary" href=${PO.href('payroll')}>Go to payroll</${PO.Button}>` : html`<${PO.Button} kind="primary" icon="Lock" onClick=${doLock}>Lock ${word} for payroll</${PO.Button}>`}
          <${PO.Menu} align="right" width=${230} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More actions" />`} items=${[{ label: `Export ${IN ? 'muster' : 'hours'} (CSV)`, icon: 'Download', onClick: exportMuster }, { label: IN ? 'Print Form D register (PDF)' : 'Print timesheets (PDF)', icon: 'Printer', onClick: () => PO.fakeDownload(IN ? `Register of attendance, ${P.company.period} (PDF)` : `Timesheets, ${P.company.period} (PDF)`) }, '-', { label: 'Clock-in setup', icon: 'MapPin', onClick: () => setTab('setup') }, { label: 'Attendance policies', icon: 'BookOpen', onClick: () => setTab('policies') }]} />`} />
      <${PO.KpiStrip} items=${[
        { label: 'Attendance', icon: 'CalendarCheck2', accent: 'green', value: PO.num(attPct * 100, 1), unit: '%', bar: [{ v: sched - sum((t) => t.A + t.HD / 2), k: 'ok', title: 'Worked' }, { v: sum((t) => t.HD / 2), k: 'warn', title: 'Half days' }, { v: sum((t) => t.A), k: 'bad', title: IN ? 'Absent (LOP)' : 'No-shows' }], sub: IN ? 'Present of scheduled days' : 'Shifts worked of scheduled' },
        { label: 'Missed punches', icon: 'Fingerprint', accent: 'red', faces: exScoped.filter((e) => e.type === 'Missed punch' && !regOk(e)).map((e) => e.p.id), value: openMiss, tone: openMiss ? 'red' : '', alert: openMiss > 0, sub: openMiss ? 'Regularise before you lock' : 'All regularised', onClick: () => setTab('exceptions') },
        { label: 'Late arrivals', icon: 'Clock', accent: 'amber', faces: [...new Set(exScoped.filter((e) => e.type === 'Late arrival').map((e) => e.p.id))], value: lateN, sub: 'Recorded this period', onClick: () => setTab('exceptions') },
        { label: 'Overtime', icon: 'Timer', accent: 'blue', value: PO.num(otH), unit: 'h', sub: IN ? 'Paid at 2×' : P.id === 'us' ? 'FLSA 1.5× after 40 h' : '1.5× after 40 h (contract)', onClick: () => setTab('overtime') },
        IN ? { label: 'Loss of pay', icon: 'Wallet', accent: 'red', faces: rows.filter((r, i) => tots[i].lop > 0).map((r) => r.p.id), value: PO.num(lop, 1).replace(/\.0$/, ''), unit: 'days', bar: [{ v: tots.filter((t) => t.lop > 0).length, k: 'bad', title: 'People with LOP' }, { v: tots.filter((t) => !t.lop).length, k: 'mute', title: 'Fully paid' }], sub: `${PO.plural(tots.filter((t) => t.lop > 0).length, 'person', 'people')} lose pay this month` }
          : { label: P.id === 'us' ? 'Paid time off' : 'Holiday taken', icon: 'Palmtree', accent: 'teal', faces: rows.filter((r, i) => tots[i].leaveH > 0).map((r) => r.p.id), value: PO.num(leaveH), unit: 'h', sub: `${PO.plural(tots.filter((t) => t.leaveH > 0).length, 'person', 'people')} this period` },
      ]} />
      <div class="mt-24"><${PO.Tabs} tabs=${tabs} value=${tab} onChange=${setTab} /></div>
      <div>
        ${tab === 'muster' ? html`<${Muster} P=${P} T=${T} />` : null}
        ${tab === 'exceptions' ? html`<${Exceptions} P=${P} T=${T} />` : null}
        ${tab === 'timesheets' ? html`<${Timesheets} P=${P} T=${T} />` : null}
        ${tab === 'overtime' ? html`<${Overtime} P=${P} T=${T} />` : null}
        ${tab === 'setup' ? html`<${Setup} P=${P} />` : null}
        ${tab === 'policies' ? html`<${Policies} P=${P} />` : null}
      </div>
      ${confirmEl}`;
  }

  /* ================= Muster ================= */
  function Muster({ P, T }) {
    const { M, rows, tots, cellsOf, locked, edits, setEdits } = T;
    const days = M.per.days;
    const [q, setQ] = useState('');
    const [site, setSite] = useState('');
    const [dept, setDept] = useState('');
    const [only, setOnly] = useState('all');
    const [open, setOpen] = useState(() => { const q = T.query.day; if (!q) return null; const [pid, k] = q.split(':'); const row = rows.find((r) => r.p.id === pid); return row ? { row, k: +k } : null; });
    const hours = P.id !== 'in';
    const list = rows.map((row, i) => ({ row, t: tots[i], cs: cellsOf(row) })).filter(({ row, t, cs }) =>
      (!q || (row.p.name + ' ' + row.p.id).toLowerCase().includes(q.toLowerCase())) && (!site || row.p.site === site) && (!dept || row.p.dept === dept) &&
      (only === 'all' || (only === 'exc' && (t.A || t.HD || cs.some((c) => c.missed) || t.unpaidL)) || (only === 'ot' && t.ot > 0) || (only === 'leave' && t.L > 0)));
    const sites = P.sites.filter((s) => rows.some((r) => r.p.site === s.id));
    const depts = [...new Set(rows.map((r) => r.p.dept))];
    const totCols = hours ? [['Reg h', (t) => t.reg], ['Leave h', (t) => t.leaveH || '–'], ['OT h', (t) => t.ot || '–'], ['Paid h', (t) => t.paidH]] : [['Paid days', (t) => fmt1(t.paid)], ['LOP', (t) => (t.lop ? fmt1(t.lop) : '–')], ['OT h', (t) => t.ot || '–'], ['Leave', (t) => t.L || '–']];
    const W = 58;
    const colSum = (f) => list.reduce((s, x) => s + (typeof f(x.t) === 'number' ? f(x.t) : 0), 0);
    const editCount = Object.keys(edits).length;
    const legend = hours ? [['W', '8', 'Hours'], ['L', P.leaveTypes[0].short, P.id === 'us' ? 'PTO' : 'Holiday'], ['A', 'A', 'No-show'], ['X', '!', 'Missed punch']] : [['A', 'A', 'LOP'], ['HD', 'HD', 'Half day'], ['L', 'CL', 'Leave'], ['WO', 'WO', 'Off'], ['H', 'H', 'Holiday'], ['X', '!', 'Missed punch']];
    const selSt = (v) => `width:auto;height:30px;${v ? 'border-color:var(--brand);color:var(--brand-text)' : ''}`;
    return html`<div class="card" style="overflow:hidden">
      <div class="tbl-toolbar">
        <${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search name or ID" width=${180} />
        <select class="select" style=${selSt(site)} value=${site} onChange=${(e) => setSite(e.target.value)}><option value="">Site: All</option>${sites.map((s) => html`<option value=${s.id}>${s.name}</option>`)}</select>
        <select class="select" style=${selSt(dept)} value=${dept} onChange=${(e) => setDept(e.target.value)}><option value="">Department: All</option>${depts.map((d) => html`<option value=${d}>${d}</option>`)}</select>
        <select class="select" style=${selSt(only !== 'all')} value=${only} onChange=${(e) => setOnly(e.target.value)}><option value="all">Everyone</option><option value="exc">Exceptions only</option><option value="ot">Overtime</option><option value="leave">On leave</option></select>
        ${editCount ? html`<${PO.Button} size="sm" kind="ghost" disabled=${!!locked} onClick=${() => { const prev = edits; setEdits({}); PO.toast('Edits cleared', { action: { label: 'Undo', run: () => setEdits(prev) } }); }}>Reset ${PO.plural(editCount, 'edit')}</${PO.Button}>` : null}
        <div class="right at-legend" title="Click any day to see punches or correct it">${legend.map(([c, t, l]) => html`<span><span class=${'at-c ' + c}>${t}</span>${l}</span>`)}
          <span><span class="at-c ${hours ? 'W' : 'P'}">${hours ? '10' : 'P'}<span class="o">${hours ? 2 : 4}</span></span>OT</span></div>
      </div>
      <div class="at-grid-wrap">
        <table class="at-grid">
          <thead><tr><th class="nm">Employee</th>${days.map((d) => html`<th class=${isWE(P, d) || M.hol.has(d.iso) ? 'we' : ''} style=${`min-width:${days.length <= 14 ? 52 : 32}px`} title=${M.hol.get(d.iso) || ''}><span class="wd">${WD[d.wd]}</span>${d.dn}</th>`)}
            ${totCols.map(([l], i) => html`<th class=${'tc ' + (i === 0 ? 'first' : '')} style=${`right:${(totCols.length - 1 - i) * W}px`}>${l}</th>`)}</tr></thead>
          <tbody>${list.length ? list.map(({ row, t, cs }) => html`<tr>
            <td class="nm"><div class="row" style="gap:8px"><${PO.Avatar} p=${row.p} size="sm" presence=${row.cells.some((c) => c.missed) ? 'late' : undefined} /><div style="min-width:0"><a class="w-550 ellipsis" style="display:block;max-width:170px" href=${PO.href('people/' + row.p.id)}>${row.p.name}</a><div class="faint ellipsis" style="font-size:10.5px;max-width:170px">${PO.site(row.p.site).name}, ${PO.shiftOf(row.p.shift).label.toLowerCase()}</div></div></div></td>
            ${cs.map((c, k) => html`<td class=${isWE(P, days[k]) || M.hol.has(days[k].iso) ? 'we' : ''}><${Cell} P=${P} c=${c} onClick=${() => c.c !== '-' && setOpen({ row, k })} /></td>`)}
            ${totCols.map(([, f], i) => html`<td class=${'tc ' + (i === 0 ? 'first' : '')} style=${`right:${(totCols.length - 1 - i) * W}px;${i === 1 && !hours && t.lop ? 'color:var(--red)' : ''}`}>${f(t)}</td>`)}
          </tr>`) : html`<tr><td class="nm" colspan=${days.length + 1} style="height:120px;text-align:center;position:static"><span class="faint">No one matches these filters.</span></td></tr>`}</tbody>
          ${list.length ? html`<tfoot><tr><td class="nm w-600" style="background:var(--surface-2)">Total, ${PO.plural(list.length, 'person', 'people')}</td>${days.map((d) => { const pres = list.filter((x) => { const c = x.cs[d.i]; return c.c === 'P' || c.c === 'W' || c.c === 'HD'; }).length; return html`<td class=${isWE(P, d) ? 'we' : ''} style="background:var(--surface-2);font-size:10.5px;color:var(--text-2)" title=${`${pres} present`}>${pres}</td>`; })}
            ${totCols.map(([, f], i) => html`<td class=${'tc ' + (i === 0 ? 'first' : '')} style=${`right:${(totCols.length - 1 - i) * W}px;background:var(--surface-3)`}>${fmt1(colSum(f))}</td>`)}</tr></tfoot>` : null}
        </table>
      </div>
      <div class="tbl-foot"><span class="faint">${P.id === 'in' ? 'Paid days = days in month − loss of pay. Weekly offs, holidays and paid leave are paid.' : P.id === 'us' ? 'Overtime is paid at 1.5× for hours over 40 in a workweek (FLSA). Leave hours are paid PTO or sick time.' : 'Overtime is 1.5× for hours over 40 in a week (contract). Holiday hours are paid at the normal rate.'}</span><span class="right">${PO.plural(list.length, 'row')}</span></div>
      <${DayDrawer} P=${P} T=${T} open=${open} onClose=${() => setOpen(null)} />
    </div>`;
  }
  const fmt1 = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? PO.num(v) : PO.num(v, 1)) : v);

  /* punches for a day, deterministic */
  function punchesFor(P, p, c, k) {
    const r = PO.seeded('pun' + P.id + p.id + k);
    const s = PO.shiftOf(p.shift);
    const from = s.from - r.int(0, 12);
    const len = (c.h || 8) * 60;
    const to = s.from + len + r.int(0, 9);
    const m = P.id === 'in' ? (p.site === 'hq' ? 'Biometric terminal (ZKTeco)' : r.pick(['Biometric terminal (eSSL)', 'Web portal, location verified', 'Site QR'])) : P.id === 'us' ? r.pick(['Kiosk', 'Web portal, location verified', 'Site QR']) : r.pick(['Site QR', 'Web portal, location verified', 'Kiosk']);
    return { from: (from + 1440) % 1440, to: to % 1440, bOut: (s.from + 240 + r.int(-20, 20)) % 1440, bIn: (s.from + 270 + r.int(-20, 25)) % 1440, m };
  }

  function DayDrawer({ P, T, open, onClose }) {
    const { M, edits, setEdits, locked, cellsOf } = T;
    if (!open) return html`<${PO.Drawer} open=${false} />`;
    const { row, k } = open;
    const d = M.per.days[k];
    const c = cellsOf(row)[k];
    const p = row.p;
    const key = p.id + '|' + k;
    const pu = punchesFor(P, p, c, k);
    const hours = P.id !== 'in';
    const set = (patch, label) => {
      if (locked) { PO.toast('Muster is locked. Unlock it to make changes.', { icon: 'Lock' }); return; }
      const prev = edits;
      setEdits({ ...edits, [key]: patch });
      PO.toast(`${p.first}, ${PO.date(d.iso, { short: true })}: ${label}`, { action: { label: 'Undo', run: () => setEdits(prev) } });
      onClose();
    };
    const worked = c.c === 'P' || c.c === 'W' || c.c === 'HD';
    const s = PO.shiftOf(p.shift);
    const win = Math.max(12, (c.h || 8) + 4) * 60;
    const pct = (m) => Math.min(100, (((m - s.from + 1440 + 120) % 1440) / win) * 100);
    return html`<${PO.Drawer} open onClose=${onClose} title=${`${p.name}, ${PO.date(d.iso, { weekday: true })}`} sub=${`${PO.site(p.site).name}, ${s.label} shift ${s.time}`}
      footer=${html`<${PO.Button} onClick=${onClose}>Close</${PO.Button}>${edits[key] ? html`<${PO.Button} kind="ghost" onClick=${() => { const n = { ...edits }; delete n[key]; setEdits(n); onClose(); PO.toast('Correction removed'); }}>Remove correction</${PO.Button}>` : null}`}>
      <div class="col gap-16">
        <div class="row" style="gap:12px"><${Cell} P=${P} c=${c} /><div><b class="w-600">${c.missed ? 'Missed punch' : c.c === 'L' ? PO.leaveType(c.lt)?.name + (c.paid === false ? ' (unpaid)' : '') : codeName[c.c]}</b><div class="faint t-sm">${worked ? `${hours ? c.h + ' h' : c.c === 'HD' ? '4 h, half day' : (c.h || 8) + ' h'}${c.ot ? `, ${c.ot} h overtime` : ''}${c.night ? ', night allowance' : ''}${c.owed ? `, ${c.owed} h over 40, unpaid (exempt status under review)` : ''}` : c.c === 'H' ? c.note : c.c === 'A' ? 'No punch and no approved leave' : c.c === 'WO' ? 'Not rostered' : ''}</div></div>${c.ed ? html`<span class="right"><${PO.Badge} tone="brand">Corrected</${PO.Badge}></span>` : null}</div>
        ${worked || c.missed ? html`<${PO.Card} icon="Fingerprint" accent="blue" title="Punches">
          <div class="at-bar"><i style=${`left:${pct(pu.from)}%;width:${Math.max(4, pct(c.missed ? pu.from + 30 : pu.to) - pct(pu.from))}%;background:var(--green-soft);border:1px solid var(--green)`}></i>${!c.missed ? html`<i style=${`left:${pct(pu.bOut)}%;width:${pct(pu.bIn) - pct(pu.bOut)}%;background:var(--surface);border:1px dashed var(--border-strong)`}></i>` : null}</div>
          <div class="row faint t-xs mt-4"><span>${P.hhmm((s.from - 120 + 1440) % 1440)}</span><span class="right">${P.hhmm((s.from - 120 + win + 1440) % 1440)}</span></div>
          <div class="mt-8">${[[pu.from, 'Clock in', pu.m, 'LogIn'], ...(c.missed ? [] : [[pu.bOut, 'Break start', 'Web portal', 'Coffee'], [pu.bIn, 'Break end', 'Web portal', 'Coffee'], [pu.to, 'Clock out', pu.m, 'LogOut']])].map(([t, l, m, ic]) => html`<div class="at-punch"><span class="tl-dot" style="width:26px;height:26px"><${PO.Icon} n=${ic} size=${13} /></span><b class="tnum" style="width:46px">${P.hhmm(t)}</b><span class="grow">${l}</span><span class="faint t-sm">${m}</span></div>`)}
          ${c.missed ? html`<div class="at-punch"><span class="tl-dot red" style="width:26px;height:26px"><${PO.Icon} n="CircleAlert" size=${13} /></span><b class="tnum" style="width:46px">—</b><span class="grow" style="color:var(--red)">Clock-out missing</span><${PO.Button} size="sm" onClick=${() => { onClose(); PO.go('attendance'); PO.toast('Open the Exceptions tab to regularise this punch'); }}>Regularise</${PO.Button}></div>` : null}</div>
        </${PO.Card}>` : null}
        <div><div class="t-sm w-600" style="margin-bottom:8px">Correct this day</div>
          <div class="row wrap" style="gap:6px">
            ${hours ? html`<${PO.Button} size="sm" icon="Check" onClick=${() => set({ c: 'W', h: 8, ot: 0 }, 'marked 8 h worked')}>Worked 8 h</${PO.Button}>` : html`<${PO.Button} size="sm" icon="Check" onClick=${() => set({ c: 'P', h: 8, ot: 0 }, 'marked present')}>Present</${PO.Button}>`}
            <${PO.Button} size="sm" icon="CircleSlash" onClick=${() => set({ c: 'A', h: 0, ot: 0 }, hours ? 'marked no-show' : 'marked absent (LOP)')}>${hours ? 'No-show' : 'Absent (LOP)'}</${PO.Button}>
            ${!hours ? html`<${PO.Button} size="sm" icon="SplitSquareHorizontal" onClick=${() => set({ c: 'HD', h: 4, ot: 0 }, 'marked half day')}>Half day</${PO.Button}>` : null}
            <${PO.Button} size="sm" icon="Palmtree" onClick=${() => set({ c: 'L', lt: P.leaveTypes[0].key, paid: true, h: hours ? 8 : 0, ot: 0 }, `marked ${P.leaveTypes[0].name.toLowerCase()}`)}>${P.leaveTypes[0].name}</${PO.Button}>
            <${PO.Button} size="sm" icon="Moon" onClick=${() => set({ c: 'WO', h: 0, ot: 0 }, 'marked weekly off')}>${hours ? 'Not scheduled' : 'Weekly off'}</${PO.Button}>
            ${worked ? html`<${PO.Button} size="sm" icon="Timer" onClick=${() => set({ ...c, ot: (c.ot || 0) + 2, h: (c.h || 8) + 2, ed: undefined }, 'added 2 h overtime')}>+2 h overtime</${PO.Button}>` : null}
          </div>
          <div class="faint t-xs mt-8">${locked ? 'Locked for payroll. Unlock the muster to correct days.' : 'Corrections are logged in the audit trail with your name and the time.'}</div></div>
        <${PO.KV} items=${[['Employee ID', p.id], ['Supervisor', p.supervisor ? PO.person(p.supervisor)?.name : '—'], ['Post', p.post], [P.id === 'in' ? 'Month so far' : 'Period so far', P.id === 'in' ? `${totalsOf(P, row, T.cellsOf(row)).paid} paid days` : `${totalsOf(P, row, T.cellsOf(row)).paidH} paid hours`]]} />
      </div>
    </${PO.Drawer}>`;
  }

  /* ================= Exceptions ================= */
  function Exceptions({ P, T }) {
    const { EX, M, reg, setReg, regOk, decided, locked } = T;
    const { dispatch, state } = PO.useStore();
    const [open, setOpen] = useState(() => (T.query.reg ? EX.find((e) => e.id === T.query.reg || e.p.id === T.query.reg) || null : null));
    const statusOf = (e) => (e.type === 'Missed punch' ? (regOk(e) ? 'Approved' : 'Open') : reg[e.id] === 'excused' ? 'Excused' : reg[e.id] === 'noted' ? 'Noted' : reg[e.id] === 'approved' ? 'Approved' : reg[e.id] === 'deducted' ? 'Deducted' : e.type === 'Missed break' ? 'Open' : 'Recorded');
    const shown = (e) => (statusOf(e) === 'Open' ? 'Needs review' : statusOf(e) === 'Recorded' ? 'Recorded' : statusOf(e));
    const fmtDay = (k) => PO.date(M.per.days[k].iso, { short: true, weekday: true });
    const desc = (e) => e.type === 'Missed punch' ? e.detail : e.type === 'Late arrival' ? `In ${e.min} min after ${P.hhmm(PO.shiftOf(e.p.shift).from)}` : e.type === 'Early exit' ? `Left ${e.min} min before ${P.hhmm(PO.shiftOf(e.p.shift).to)}` : 'No break punched on an 8 h shift';
    const typeIcon = { 'Missed punch': ['Fingerprint', 'red'], 'Late arrival': ['Clock', 'amber'], 'Early exit': ['LogOut', 'amber'], 'Missed break': ['Coffee', 'slate'] };
    const counts = ['Missed punch', 'Late arrival', 'Early exit', 'Missed break'].map((t) => [t, EX.filter((e) => e.type === t).length, EX.filter((e) => e.type === t && statusOf(e) === 'Open').length]);
    const bulkExcuse = (ids, clear) => { const n = { ...reg }; ids.forEach((id) => { if (!id.startsWith('mp-')) n[id] = 'excused'; }); setReg(n); clear(); PO.toast(`${PO.plural(ids.length, 'exception')} excused`, { action: { label: 'Undo', run: () => setReg(reg) } }); };
    return html`<div class="at-types">${counts.map(([t, n, o]) => { const [ic, ac] = typeIcon[t]; const ppl = [...new Set(EX.filter((e) => e.type === t).map((e) => e.p.id))]; return html`<div class=${'at-type ' + ac}><div class="row" style="gap:8px"><${PO.Chip} icon=${ic} accent=${ac === 'slate' ? 'blue' : ac} /><span class="t-sm w-550">${t === 'Missed punch' ? 'Missed punches' : t + 's'}</span><span class="right"><${PO.AvatarStack} ids=${ppl} max=${3} size="xs" /></span></div><div class="row" style="align-items:baseline;gap:8px;margin-top:8px"><span class="at-type-n">${n}</span><span class=${'t-xs ' + (o ? '' : 'faint')} style=${o ? `color:var(--${ac === 'slate' ? 'text-2' : ac});font-weight:550` : ''}>${o ? `${o} open` : t === 'Missed punch' || t === 'Missed break' ? 'All decided' : 'No pay impact'}</span></div></div>`; })}</div>
      <div><${PO.DataTable} rows=${EX} exportName="attendance-exceptions" selectable bulk=${(ids, clear) => html`<${PO.Button} size="sm" icon="Check" onClick=${() => bulkExcuse(ids, clear)}>Excuse selected</${PO.Button}>`}
        search=${(e) => e.p.name + ' ' + e.type + ' ' + PO.site(e.p.site).name}
        filters=${[{ key: 'type', label: 'Type', options: counts.map(([t]) => t), test: (e, v) => e.type === v }, { key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (e, v) => e.p.site === v }, { key: 'st', label: 'Status', options: [['Open', 'Needs review'], 'Recorded', 'Approved', 'Excused', 'Noted', 'Deducted'], test: (e, v) => statusOf(e) === v }]}
        onRow=${(e) => setOpen(e)} pageSize=${12}
        columns=${[
          { key: 'who', label: 'Employee', sort: (e) => e.p.name, render: (e) => html`<${PO.Who} p=${e.p} sub=${PO.site(e.p.site).name} />`, csv: (e) => e.p.name },
          { key: 'type', label: 'Exception', sort: (e) => e.type, render: (e) => html`<span class="at-kind"><${PO.Chip} icon=${typeIcon[e.type][0]} accent=${typeIcon[e.type][1] === 'slate' ? 'blue' : typeIcon[e.type][1]} size=${13} />${e.type}</span>`, csv: (e) => e.type },
          { key: 'day', label: 'Day', sort: (e) => e.k, render: (e) => html`<span class="tnum">${fmtDay(e.k)}</span>`, csv: (e) => M.per.days[e.k].iso },
          { key: 'd', label: 'Detail', sort: false, render: (e) => html`<span class="muted ellipsis" style="display:block;max-width:300px">${desc(e)}</span>`, csv: (e) => desc(e) },
          { key: 'st', label: 'Status', sort: (e) => statusOf(e), render: (e) => shown(e) === 'Recorded' ? html`<${PO.Badge} tone="slate" dot>Recorded</${PO.Badge}>` : html`<${PO.Status} s=${shown(e)} />`, csv: (e) => shown(e) },
          { key: 'a', label: '', sort: false, align: 'r', csv: false, render: (e) => statusOf(e) === 'Open' || statusOf(e) === 'Recorded' ? html`<${PO.Button} size="sm" kind=${e.type === 'Missed punch' ? '' : 'ghost'} onClick=${(ev) => { ev.stopPropagation(); setOpen(e); }}>${e.type === 'Missed punch' ? 'Regularise' : 'Review'}</${PO.Button}>` : html`<span class="faint t-sm">Done</span>` },
        ]} /></div>
      <${RegDrawer} P=${P} T=${T} e=${open} onClose=${() => setOpen(null)} statusOf=${statusOf} desc=${desc} fmtDay=${fmtDay} />`;
  }

  function RegDrawer({ P, T, e, onClose, statusOf, desc, fmtDay }) {
    const { reg, setReg, M } = T;
    const { state, dispatch } = PO.useStore();
    const [time, setTime] = useState('');
    const [ev, setEv] = useState('');
    const [note, setNote] = useState('');
    if (!e) return html`<${PO.Drawer} open=${false} />`;
    const s = PO.shiftOf(e.p.shift);
    const isMiss = e.type === 'Missed punch';
    const proposed = time || (isMiss ? toHHMM(e.proposal) || P.hhmm((e.inMiss ? s.from - 8 : s.to + 5) % 1440) : e.type === 'Late arrival' ? P.hhmm(s.from + e.min) : e.type === 'Early exit' ? P.hhmm(s.to - e.min) : '30 min');
    const evidence = ev || (isMiss ? (/register|log|pass/i.test(e.evidence) ? (/Gate register/i.test(e.evidence) ? 'Gate register' : /Oven log/i.test(e.evidence) ? 'Oven / production log' : 'Access pass log') : 'Supervisor confirmation') : 'Supervisor confirmation');
    const lead = P.byId[PO.site(e.p.site).lead];
    const decided = PO.coGet(state, 'approvals.decided', {});
    const decide = (val) => {
      const prev = reg;
      setReg({ ...reg, [e.id]: val });
      if (isMiss && e.ap) dispatch({ type: 'coState', key: 'approvals.decided', value: { ...decided, [e.ap.id]: val === 'approved' ? 'approved' : 'rejected' }, init: {} });
      PO.toast(`${e.p.name}: ${isMiss ? (val === 'approved' ? `${e.inMiss ? 'clock-in' : 'clock-out'} set to ${proposed}` : 'regularisation rejected, day stays unpaid until fixed') : val === 'excused' ? 'excused' : val === 'deducted' ? '30 min break deducted' : 'noted on record'}`, { action: { label: 'Undo', run: () => { setReg(prev); if (isMiss && e.ap) dispatch({ type: 'coState', key: 'approvals.decided', value: decided, init: {} }); } } });
      onClose();
    };
    const st = statusOf(e) === 'Recorded' ? 'Open' : statusOf(e);
    return html`<${PO.Drawer} open onClose=${onClose} title=${isMiss ? 'Regularise attendance' : e.type} sub=${`${e.p.name}, ${fmtDay(e.k)}, ${PO.site(e.p.site).name}`}
      footer=${st !== 'Open' ? html`<${PO.Button} onClick=${onClose}>Close</${PO.Button}>` : isMiss ? html`<${PO.Button} kind="danger" onClick=${() => decide('rejected')}>Reject</${PO.Button}><${PO.Button} kind="primary" icon="Check" onClick=${() => decide('approved')}>Approve ${proposed}</${PO.Button}>`
        : e.type === 'Missed break' ? html`<${PO.Button} onClick=${() => decide('excused')}>Excuse</${PO.Button}><${PO.Button} kind="primary" onClick=${() => decide('deducted')}>Deduct 30 min break</${PO.Button}>` : html`<${PO.Button} onClick=${() => decide('noted')}>Note on record</${PO.Button}><${PO.Button} kind="primary" icon="Check" onClick=${() => decide('excused')}>Excuse</${PO.Button}>`}>
      <div class="col gap-16">
        <div class="row" style="gap:12px"><${PO.Avatar} p=${e.p} size="lg" /><div class="grow"><b class="t-md w-600">${e.p.name}</b><div class="faint t-sm">${e.p.title}, ${e.p.id}, ${s.label} ${s.time}</div></div><${PO.Status} s=${st === 'Open' ? 'Needs review' : st} /></div>
        <${PO.Callout} tone=${isMiss ? 'amber' : ''} icon=${isMiss ? 'Fingerprint' : 'Info'} title=${desc(e)}>${isMiss ? (e.evidence || 'No matching punch on the terminal or in the portal.') : e.type === 'Late arrival' ? `${e.p.first} has ${1 + (e.p.id.charCodeAt(e.p.id.length - 1) % 3)} late marks this period. ${P.id === 'in' ? '3 late marks in a month count as a half-day LOP.' : 'Late marks are recorded, not deducted.'}` : e.type === 'Early exit' ? 'Left before the end of the shift without an approved early release.' : P.id === 'in' ? 'Shifts of 8 h need a 30 min break under the Shops & Establishments Act.' : P.id === 'us' ? 'Unpaid meal breaks are auto-deducted only when punched.' : 'Workers on 6 h+ shifts are entitled to a 20 min rest break (Working Time Regulations).'}</${PO.Callout}>
        ${isMiss ? html`<div class="grid g-2">
          <${PO.Field} label=${e.inMiss ? 'Proposed clock-in' : 'Proposed clock-out'}><input class="input" type="time" value=${proposed} onInput=${(x) => setTime(x.target.value)} /></${PO.Field}>
          <${PO.Field} label="Evidence"><select class="select" value=${evidence} onChange=${(x) => setEv(x.target.value)}>${['Gate register', 'Supervisor confirmation', 'Access pass log', 'Oven / production log', 'CCTV check', 'Biometric device log', 'Employee declaration'].map((o) => html`<option value=${o} selected=${o === evidence}>${o}</option>`)}</select></${PO.Field}>
        </div>
        <${PO.Field} label="Reason"><textarea class="textarea" rows="3" placeholder="Add a note for the audit log" value=${note} onInput=${(x) => setNote(x.target.value)}></textarea></${PO.Field}>
        <div class="card inset" style="padding:12px"><div class="row t-sm"><${PO.Icon} n="Paperclip" size=${14} /><b class="w-550">${evidence === 'Gate register' ? 'Gate register, page 112 (photo)' : evidence === 'Supervisor confirmation' ? `${((e.evidence || '').match(/([A-Z][a-z]+) confirms/) || [])[1] && !/Supervisor/.test(e.evidence) ? (e.evidence.match(/([A-Z][a-z]+) confirms/))[1] : lead ? lead.name : 'Supervisor'} confirmed on ${P.msg.channel}` : evidence}</b><span class="right faint t-xs">${evidence === 'Supervisor confirmation' ? 'Message' : 'JPG, 412 KB'}</span></div></div>
        <${PO.Timeline} items=${[{ icon: 'LogIn', tone: 'green', title: e.inMiss ? 'No clock-in recorded' : `Clocked in ${P.hhmm((s.from - 6 + 1440) % 1440)}`, sub: e.inMiss ? 'No punch on the terminal or in the portal' : 'Terminal or portal punch' }, { icon: 'CircleAlert', tone: 'amber', title: e.inMiss ? `Clocked out ${P.hhmm((s.to + 4) % 1440)}` : 'No clock-out recorded', sub: 'Flagged automatically at the end of the shift' }, { icon: 'MessageSquare', tone: 'blue', title: `Asked ${e.p.first} on ${P.msg.channel}`, sub: 'Reply received the same day' }, { icon: 'UserCheck', tone: '', title: `Approver: ${lead ? lead.name : 'Site supervisor'}`, sub: 'Then HR, if the change affects pay' }]} />`
        : html`<${PO.KV} items=${[['Shift', `${s.label}, ${s.time}`], ['Actual', e.type === 'Late arrival' ? `In at ${proposed}` : e.type === 'Early exit' ? `Out at ${proposed}` : 'No break punch'], ['Supervisor', lead ? lead.name : '—'], ['Pay impact', e.type === 'Missed break' ? (P.id === 'in' ? '30 min deducted from worked hours' : 'Break auto-deducted if confirmed') : P.id === 'in' && e.type === 'Late arrival' ? 'Counts toward the 3-late-marks rule' : 'None']]} />`}
      </div>
    </${PO.Drawer}>`;
  }
  const toHHMM = (txt) => {
    if (!txt) return '';
    const m = txt.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/i); if (!m) return '';
    let h = +m[1]; if (m[3] && m[3].toLowerCase() === 'pm' && h < 12) h += 12; if (m[3] && m[3].toLowerCase() === 'am' && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':' + m[2];
  };

  /* ================= Timesheets / daily log ================= */
  function Timesheets({ P, T }) {
    return P.id === 'in' ? html`<${DailyLog} P=${P} T=${T} />` : html`<${WeekSheets} P=${P} T=${T} />`;
  }

  function WeekSheets({ P, T }) {
    const { M, rows, cellsOf, locked } = T;
    const weeks = M.per.n / 7;
    const [w, setW] = useState(weeks - 1);
    const [appr, setAppr] = PO.useCoState('attendance.tsApproved', {});
    const wdays = M.per.days.slice(w * 7, w * 7 + 7);
    const data = rows.map((row) => {
      const cs = cellsOf(row).slice(w * 7, w * 7 + 7);
      const worked = cs.reduce((t, c) => t + (c.c === 'W' || c.c === 'P' ? c.h : c.c === 'HD' ? 4 : 0), 0);
      const leave = cs.reduce((t, c) => t + (c.c === 'L' && c.paid !== false ? c.h : 0), 0);
      const ot = cs.reduce((t, c) => t + (c.ot || 0), 0);
      const miss = cs.some((c) => c.missed);
      const sal = !!P.roles[row.p.role].salary;
      return { id: row.p.id, p: row.p, cs, worked, leave, ot, reg: worked - ot - cs.reduce((t, c) => t + (c.owed || 0), 0), owed: cs.reduce((t, c) => t + (c.owed || 0), 0), miss, sal };
    }).filter((x) => x.cs.some((c) => c.c !== '-'));
    const key = (x) => `${w}|${x.id}`;
    const stat = (x) => (appr[key(x)] ? 'Approved' : x.miss ? 'Needs review' : x.ot > 0 || x.owed ? 'Submitted' : 'Submitted');
    const approve = (ids) => { const n = { ...appr }; ids.forEach((id) => (n[`${w}|${id}`] = true)); setAppr(n); PO.toast(`${PO.plural(ids.length, 'timesheet')} approved`, { action: { label: 'Undo', run: () => setAppr(appr) } }); };
    const totals = { worked: data.reduce((t, x) => t + x.worked, 0), ot: data.reduce((t, x) => t + x.ot, 0), leave: data.reduce((t, x) => t + x.leave, 0) };
    const label = `${PO.date(wdays[0].iso, { short: true })} – ${PO.date(wdays[6].iso, { short: true })}`;
    const pending = data.filter((x) => !appr[key(x)] && !x.miss).map((x) => x.id);
    return html`<div class="row wrap" style="gap:10px;margin-bottom:12px">
        <${PO.Segmented} value=${String(w)} onChange=${(v) => setW(+v)} options=${Array.from({ length: weeks }, (_, i) => [String(i), `Week ${i + 1}, ${PO.date(M.per.days[i * 7].iso, { short: true })}`])} />
        <span class="faint t-sm">${label}, ${PO.num(totals.worked)} h worked, ${PO.num(totals.ot)} h overtime, ${PO.num(totals.leave)} h ${P.id === 'us' ? 'PTO' : 'holiday'}</span>
        <div class="right"><${PO.Button} icon="CheckCheck" disabled=${!pending.length || !!locked} onClick=${() => approve(pending)}>Approve ${pending.length} ready</${PO.Button}></div></div>
      <${PO.DataTable} rows=${data} exportName=${'timesheets-week-' + (w + 1)} selectable bulk=${(ids, clear) => html`<${PO.Button} size="sm" kind="primary" icon="Check" onClick=${() => { approve(ids); clear(); }}>Approve selected</${PO.Button}>`} pageSize=${15} compact
        search=${(x) => x.p.name + ' ' + PO.site(x.p.site).name}
        filters=${[{ key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (x, v) => x.p.site === v }, { key: 'st', label: 'Status', options: ['Submitted', 'Needs review', 'Approved'], test: (x, v) => stat(x) === v }, { key: 'ot', label: 'Overtime', options: [['y', 'Has overtime']], test: (x) => x.ot > 0 }]}
        initialSort=${{ key: 'ot', dir: 'desc' }}
        columns=${[
          { key: 'name', label: 'Employee', sort: (x) => x.p.name, render: (x) => html`<${PO.Who} p=${x.p} size="sm" sub=${`${PO.site(x.p.site).name}${x.sal ? ', salaried' : ''}`} />`, csv: (x) => x.p.name },
          ...wdays.map((d, i) => ({ key: 'd' + i, label: `${WDL[d.wd]} ${d.dn}`, align: 'c', sort: (x) => x.cs[i].h || 0, csv: (x) => x.cs[i].h || 0, render: (x) => { const c = x.cs[i]; return c.c === '-' ? html`<span class="faint">·</span>` : c.missed ? html`<span class="at-c X" style="cursor:default">!</span>` : c.c === 'W' ? html`<span class="tnum" style=${c.ot ? 'color:var(--amber);font-weight:600' : ''}>${c.h}</span>` : c.c === 'L' ? html`<span class=${'at-c L ' + ltColor(P, c.lt)} style="cursor:default;width:auto;padding:0 5px">${ltShort(P, c.lt)}</span>` : c.c === 'A' ? html`<span class="at-c A" style="cursor:default">A</span>` : html`<span class="faint">–</span>`; } })),
          { key: 'reg', label: 'Regular', align: 'r', sort: (x) => x.reg, render: (x) => html`<b class="tnum">${x.reg}</b>`, csv: (x) => x.reg },
          { key: 'ot', label: 'OT', align: 'r', sort: (x) => x.ot + x.owed, render: (x) => x.ot ? html`<span class="tnum" style="color:var(--amber);font-weight:600">${x.ot}</span>` : x.owed ? html`<span title="Worked over 40 h; currently classed exempt" class="tnum" style="color:var(--red);font-weight:600">${x.owed}*</span>` : html`<span class="faint">–</span>`, csv: (x) => x.ot },
          { key: 'lv', label: P.id === 'us' ? 'PTO' : 'Holiday', align: 'r', sort: (x) => x.leave, render: (x) => x.leave ? html`<span class="tnum">${x.leave}</span>` : html`<span class="faint">–</span>`, csv: (x) => x.leave },
          { key: 'st', label: 'Status', sort: (x) => stat(x), render: (x) => html`<${PO.Status} s=${stat(x)} />`, csv: (x) => stat(x) },
          { key: 'a', label: '', sort: false, align: 'r', csv: false, render: (x) => appr[key(x)] ? html`<${PO.IconButton} icon="Undo2" size="sm" title="Reopen" onClick=${(e) => { e.stopPropagation(); const n = { ...appr }; delete n[key(x)]; setAppr(n); }} />` : x.miss ? html`<${PO.Button} size="sm" onClick=${() => PO.toast('Regularise the missed punch in Exceptions first')}>Fix punch</${PO.Button}>` : html`<${PO.Button} size="sm" onClick=${(e) => { e.stopPropagation(); approve([x.id]); }}>Approve</${PO.Button}>` },
        ]} />
      ${P.id === 'us' ? html`<div class="mt-12"><${PO.Callout} tone="red" icon="Scale" title="* Salaried supervisors under the FLSA threshold" action=${html`<${PO.Button} size="sm" href=${PO.href('compliance')}>Review in Compliance</${PO.Button}>`}>${P.ruleFlag.text.split('.')[0]}. Their hours over 40 are shown in red.</${PO.Callout}></div>` : null}`;
  }

  function DailyLog({ P, T }) {
    const { M, rows, cellsOf } = T;
    const [k, setK] = useState(M.per.n - 1);
    const d = M.per.days[k];
    const data = rows.map((row) => ({ id: row.p.id, p: row.p, c: cellsOf(row)[k] })).filter((x) => x.c.c !== '-');
    const summary = ['P', 'A', 'L', 'WO', 'HD'].map((c) => [c, data.filter((x) => x.c.c === c && !x.c.missed).length]);
    return html`<div class="row wrap" style="gap:10px;margin-bottom:12px">
        <div class="row" style="gap:4px"><${PO.IconButton} icon="ChevronLeft" bordered title="Previous day" onClick=${() => setK(Math.max(0, k - 1))} /><select class="select" style="width:200px" value=${k} onChange=${(e) => setK(+e.target.value)}>${M.per.days.map((x) => html`<option value=${x.i}>${PO.date(x.iso, { weekday: true })}</option>`)}</select><${PO.IconButton} icon="ChevronRight" bordered title="Next day" onClick=${() => setK(Math.min(M.per.n - 1, k + 1))} /></div>
        <div class="row" style="gap:6px">${summary.map(([c, n]) => html`<span class="tag"><span class=${'at-c ' + c} style="width:22px;height:16px;font-size:9.5px;cursor:default">${c}</span>${n}</span>`)}</div>
      </div>
      <${PO.DataTable} rows=${data} exportName=${'daily-log-' + d.iso} pageSize=${15} compact
        search=${(x) => x.p.name + ' ' + x.p.id}
        filters=${[{ key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (x, v) => x.p.site === v }, { key: 'shift', label: 'Shift', options: P.shifts.map((s) => [s.key, s.label]), test: (x, v) => x.p.shift === v }, { key: 'code', label: 'Status', options: [['P', 'Present'], ['A', 'Absent'], ['L', 'Leave'], ['WO', 'Weekly off'], ['HD', 'Half day']], test: (x, v) => x.c.c === v }]}
        columns=${[
          { key: 'name', label: 'Employee', sort: (x) => x.p.name, render: (x) => html`<${PO.Who} p=${x.p} size="sm" sub=${PO.site(x.p.site).name} />`, csv: (x) => x.p.name },
          { key: 'shift', label: 'Shift', sort: (x) => x.p.shift, render: (x) => `${PO.shiftOf(x.p.shift).label}, ${PO.shiftOf(x.p.shift).time}`, csv: (x) => PO.shiftOf(x.p.shift).time },
          { key: 'in', label: 'In', align: 'c', sort: (x) => (x.c.c === 'P' || x.c.c === 'HD' ? punchesFor(P, x.p, x.c, k).from : 9999), render: (x) => (x.c.c === 'P' || x.c.c === 'HD') ? html`<span class="tnum">${P.hhmm(punchesFor(P, x.p, x.c, k).from)}</span>` : html`<span class="faint">—</span>`, csv: (x) => (x.c.c === 'P' ? P.hhmm(punchesFor(P, x.p, x.c, k).from) : '') },
          { key: 'out', label: 'Out', align: 'c', sort: false, render: (x) => x.c.missed ? html`<span class="at-c X" style="cursor:default">!</span>` : (x.c.c === 'P' || x.c.c === 'HD') ? html`<span class="tnum">${P.hhmm((punchesFor(P, x.p, x.c, k).from + (x.c.c === 'HD' ? 240 : (8 + (x.c.ot || 0)) * 60) + 8) % 1440)}</span>` : html`<span class="faint">—</span>`, csv: (x) => '' },
          { key: 'h', label: 'Hours', align: 'r', sort: (x) => x.c.h || 0, render: (x) => x.c.h ? html`<span class="tnum">${x.c.h}</span>` : html`<span class="faint">–</span>`, csv: (x) => x.c.h || 0 },
          { key: 'ot', label: 'OT', align: 'r', sort: (x) => x.c.ot || 0, render: (x) => x.c.ot ? html`<span class="tnum" style="color:var(--amber);font-weight:600">${x.c.ot}</span>` : html`<span class="faint">–</span>`, csv: (x) => x.c.ot || 0 },
          { key: 'm', label: 'Method', sort: false, render: (x) => (x.c.c === 'P' || x.c.c === 'HD') ? html`<span class="faint t-sm">${punchesFor(P, x.p, x.c, k).m}</span>` : '', csv: (x) => '' },
          { key: 'st', label: 'Status', sort: (x) => x.c.c, render: (x) => html`<${Cell} P=${P} c=${x.c} />`, csv: (x) => x.c.c },
        ]} />`;
  }

  /* ================= Overtime ================= */
  function Overtime({ P, T }) {
    const { rows, tots, decided } = T;
    const { state, dispatch } = PO.useStore();
    const [otAppr, setOtAppr] = PO.useCoState('attendance.otApproved', {});
    const otSiteId = PO.person(P.approvals.find((a) => a.id === 'ap3').who).site;
    const sites = P.sites.filter((s) => rows.some((r) => r.p.site === s.id));
    const bySite = sites.map((s) => {
      const ix = rows.map((r, i) => [r, i]).filter(([r]) => r.p.site === s.id);
      const h = ix.reduce((t, [, i]) => t + tots[i].ot, 0);
      const pay = ix.reduce((t, [r]) => t + (r.p.pay.otPay || 0), 0);
      const spike = { in: 1.64, us: 1.58, uk: 1.41 }[P.id];
      const rr = PO.seeded('otp' + P.id + s.id);
      const last = s.id === otSiteId ? Math.round(h / spike) : Math.round(h * (0.86 + rr.rnd() * 0.3));
      return { s, h, pay, last, people: ix.filter(([, i]) => tots[i].ot > 0).length };
    });
    const ap3 = P.approvals.find((a) => a.id === 'ap3');
    const ap3State = decided.ap3;
    const decideAp3 = (v) => { dispatch({ type: 'coState', key: 'approvals.decided', value: { ...decided, ap3: v }, init: {} }); PO.toast(v === 'approved' ? `Approved: ${ap3.title}` : `Declined: ${ap3.title}`, { action: { label: 'Undo', run: () => { const n = { ...decided }; delete n.ap3; dispatch({ type: 'coState', key: 'approvals.decided', value: n, init: {} }); } } }); };
    const top = rows.map((r, i) => ({ id: r.p.id, p: r.p, h: tots[i].ot, pay: r.p.pay.otPay || 0 })).filter((x) => x.h > 0).sort((a, b) => b.h - a.h);
    const rule = P.id === 'in' ? { title: '2× the ordinary wage', body: 'Code on Wages, 2019 (in force 21 Nov 2025). Overtime is work beyond 9 hours a day or 48 hours a week. Total overtime is capped at 125 hours a quarter under the OSH Code; overtime needs the worker’s consent.', cap: 125, capLabel: 'Quarter cap (OSH Code)' }
      : P.id === 'us' ? { title: '1.5× after 40 hours in a workweek', body: 'Fair Labor Standards Act. Texas adds no daily overtime. The workweek runs Monday to Sunday. Salaried staff earning under $684 a week are non-exempt and owed overtime too.', cap: 60, capLabel: 'Period hours over 40/wk' }
      : { title: '1.5× after 40 hours a week (contract)', body: 'There is no statutory overtime premium in the UK; this is the Harbour & Field contract rate. Average weekly hours must stay under 48 over 17 weeks unless the worker has opted out (Working Time Regulations).', cap: 48, capLabel: '48 h average (WTR)' };
    return html`<div class="grid g-main">
      <div class="col gap-16">
        <${PO.Card} icon="ChartColumn" accent="blue" title="Overtime by site" sub=${`${P.company.period} vs last period`}>
          <${PO.Charts.Bars} labels=${bySite.map((x) => { const w = x.s.name.split(' '); return w[0].length <= 4 ? w.slice(0, 2).join(' ') : w[0]; })} series=${[{ name: 'Last period', data: bySite.map((x) => x.last), color: 'var(--chart-5)' }, { name: 'This period', data: bySite.map((x) => x.h), color: 'var(--chart-1)' }]} fmt=${(v) => v + ' h'} height=${230} />
        </${PO.Card}>
        <div class="card" style="overflow:hidden"><table class="tbl"><thead><tr><th>Site</th><th class="r">People</th><th class="r">OT hours</th><th class="r">Change</th><th class="r">OT pay</th></tr></thead><tbody>
          ${bySite.map((x) => { const ch = x.last ? (x.h - x.last) / x.last : 0; return html`<tr><td><b class="w-550">${x.s.name}</b>${x.s.id === otSiteId ? html` <span class="t-xs" style="color:var(--amber);font-weight:550;margin-left:6px">Spike</span>` : null}</td><td class="r tnum">${x.people}</td><td class="r tnum">${PO.num(x.h)}</td><td class="r tnum" style=${`color:var(--${ch > 0.25 ? 'red' : ch < 0 ? 'green' : 'text-2'})`}>${ch >= 0 ? '+' : ''}${Math.round(ch * 100)}%</td><td class="r tnum">${PO.money(x.pay)}</td></tr>`; })}
        </tbody><tfoot><tr><td>Total</td><td class="r">${bySite.reduce((t, x) => t + x.people, 0)}</td><td class="r">${PO.num(bySite.reduce((t, x) => t + x.h, 0))}</td><td></td><td class="r">${PO.money(bySite.reduce((t, x) => t + x.pay, 0))}</td></tr></tfoot></table></div>
        <${PO.DataTable} rows=${top} exportName="overtime-by-person" pageSize=${8} compact search=${(x) => x.p.name}
          columns=${[{ key: 'n', label: 'Employee', sort: (x) => x.p.name, render: (x) => html`<${PO.Who} p=${x.p} size="sm" sub=${PO.site(x.p.site).name} />`, csv: (x) => x.p.name }, { key: 'h', label: 'OT hours', align: 'r', sort: (x) => x.h, render: (x) => html`<b class="tnum">${x.h}</b>`, csv: (x) => x.h }, { key: 'cap', label: rule.capLabel, sort: (x) => x.h, render: (x) => { const used = P.id === 'in' ? x.h * 3 : x.h; return html`<div style="width:160px"><${PO.Progress} value=${(used / rule.cap) * 100} tone=${used / rule.cap > 0.8 ? 'red' : used / rule.cap > 0.5 ? 'amber' : ''} label=${P.id === 'in' ? `${used}/${rule.cap}` : ''} /></div>`; }, csv: false }, { key: 'pay', label: 'OT pay', align: 'r', sort: (x) => x.pay, render: (x) => html`<span class="tnum">${PO.money(x.pay)}</span>`, csv: (x) => x.pay }, { key: 'a', label: '', sort: false, csv: false, align: 'r', render: (x) => otAppr[x.id] ? html`<${PO.Badge} tone="green" dot>Approved</${PO.Badge}>` : html`<${PO.Button} size="sm" onClick=${() => { setOtAppr({ ...otAppr, [x.id]: true }); PO.toast(`${x.h} h overtime approved for ${x.p.name}`); }}>Approve</${PO.Button}>` }]} />
      </div>
      <div class="col gap-16">
        <${PO.Card} icon="Scale" accent="green" title="Overtime rule" actions=${html`<${PO.Button} size="sm" kind="ghost" href=${PO.href('rules')}>Rules</${PO.Button}>`}>
          <div class="w-600" style="font-size:18px;letter-spacing:-.01em">${rule.title}</div><p class="muted mt-8">${rule.body}</p>
          <div class="divider" style="margin:14px 0;border-top:1px solid var(--border)"></div>
          <${PO.KV} items=${[['Pre-approval', P.id === 'in' ? 'Supervisor, then HR' : 'Manager'], ['Rounding', 'Nearest 15 minutes'], ['Night premium', P.id === 'in' ? '₹50 a night (allowance)' : P.id === 'uk' ? '£1.50 an hour, 22:00–06:00' : 'None'], ['Paid with', P.company.period]]} />
        </${PO.Card}>
        <${PO.Card} icon="Inbox" accent="amber" title="Waiting for approval" sub="From the inbox">
          <div class="row" style="gap:10px;align-items:flex-start"><${PO.Avatar} p=${PO.person(ap3.who)} /><div class="grow"><b class="w-550">${ap3.title}</b><div class="faint t-sm mt-4">${ap3.detail}</div><div class="faint t-xs mt-4">${PO.person(ap3.who).name}, ${ap3.when}</div></div></div>
          <div class="row mt-12" style="gap:6px">${ap3State ? html`<${PO.Status} s=${ap3State === 'approved' ? 'Approved' : 'Rejected'} /><span class="faint t-sm">Synced with the inbox</span>` : html`<${PO.Button} size="sm" icon="Check" onClick=${() => decideAp3('approved')}>${ap3.ask}</${PO.Button}><${PO.Button} size="sm" onClick=${() => decideAp3('rejected')}>Decline</${PO.Button}>`}</div>
        </${PO.Card}>
        <${PO.Callout} tone="amber" icon="TrendingUp" title=${P.checks.ot.title}>${P.checks.ot.text}</${PO.Callout}>
      </div></div>`;
  }

  /* ================= Clock-in setup ================= */
  /* Clock-in happens only through the web portals: the employee portal with browser location (geofence), the
     site QR (opens the portal's clock-in page), a kiosk or biometric terminal at site, or supervisor entry.
     Geofence radii live under the shared 'sites.radius' key so Settings › Sites and the Live board agree. */
  function QR({ seed, size = 104 }) {
    const r = PO.seeded('qr' + seed);
    const N = 25;
    const fin = (x, y) => { const f = (a, b) => { const dx = x - a, dy = y - b; if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null; return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4); }; return f(0, 0) ?? f(N - 7, 0) ?? f(0, N - 7); };
    const align = (x, y) => (x >= 16 && x <= 20 && y >= 16 && y <= 20 ? (x === 16 || x === 20 || y === 16 || y === 20 || (x === 18 && y === 18)) : null);
    const cells = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fv = fin(x, y); const av = align(x, y);
      const sep = (x <= 7 && y <= 7) || (x >= N - 8 && y <= 7) || (x <= 7 && y >= N - 8);
      const timing = (x === 6 || y === 6) && !sep;
      cells.push(fv != null ? fv : av != null ? av : sep ? false : timing ? (x + y) % 2 === 0 : r.chance(0.5));
    }
    return html`<svg class="at-qr" viewBox=${`-2 -2 ${N + 4} ${N + 4}`} width=${size} height=${size} shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="-2" y="-2" width=${N + 4} height=${N + 4} fill="#fff" />${cells.map((on, i) => (on ? html`<rect x=${i % N} y=${Math.floor(i / N)} width="1" height="1" fill="#111" />` : null))}</svg>`;
  }
  const portalHost = (P) => 'people.' + (((P.people[0] || {}).email || '').split('@')[1] || 'company.com');
  const clockUrl = (P, sid) => `https://${portalHost(P)}/clock-in/${sid}`;
  const dist = (P, m) => (P.id === 'us' ? `${PO.num(Math.round((m * 3.281) / 10) * 10)} ft` : `${PO.num(m)} m`);
  const fenceZoom = (lat, radius, H) => Math.max(14, Math.min(18, Math.floor(Math.log2((156543.03 * Math.cos((lat * Math.PI) / 180) * H * 0.4) / radius))));
  const GATE = { hjw: 'Tower B gate', khd: 'Basement P2 entry', mgp: 'Gate 2', bnr: 'Main lobby', vmn: 'Service gate 4', hq: 'Office door', sl: 'Back door', e6: 'Back door', dm: 'Staff entrance', ck: 'Loading dock', ma: 'Staff entrance B', mc: 'Dock House goods-in', sr: 'Estates entrance', sf: 'Tower 3 goods-in', td: 'Depot door' };
  function devicesOf(P) {
    return P.id === 'in'
      ? [['eSSL X990 biometric terminal', 'hjw', 'Tower B gate', true, '08:13'], ['eSSL X990 biometric terminal', 'hjw', 'Main gate', true, '08:14'], ['eSSL MB160 biometric terminal', 'khd', 'Basement P2 entry', true, '08:12'], ['ZKTeco K40 fingerprint terminal', 'hq', 'Office door', true, '08:10'], ['ZKTeco SpeedFace V5L terminal', 'vmn', 'Service gate 4', false, 'Yesterday 23:52'], ['eSSL MB160 biometric terminal', 'mgp', 'Gate 2', true, '08:09']]
      : P.id === 'us' ? [['Kiosk tablet (badge + PIN)', 'sl', 'Back of house', true, '6:11am'], ['Kiosk tablet (badge + PIN)', 'e6', 'Back of house', true, '6:12am'], ['Kiosk tablet (badge + PIN)', 'dm', 'Staff room', true, '6:08am'], ['Kiosk tablet (badge + PIN)', 'ck', 'Loading dock', false, 'Mon 9:40pm']]
        : [['Site kiosk (badge + PIN)', 'ma', 'Staff entrance B', true, '06:09'], ['NFC badge reader', 'mc', 'Dock House', true, '06:04'], ['Site kiosk (badge + PIN)', 'sf', 'Tower 3', true, '06:06'], ['Site kiosk (badge + PIN)', 'td', 'Depot', true, '06:01']];
  }

  function Setup({ P }) {
    const [cfg, setCfg] = PO.useCoState('attendance.setup', {});
    const [radii, setRadii] = PO.useCoState('sites.radius', {});
    const [sec, setSec] = useState('sites');
    const [cur, setCur] = useState(P.sites[0].id);
    const get = (k, d) => (cfg[k] === undefined ? d : cfg[k]);
    const put = (k, v, msg) => { setCfg({ ...cfg, [k]: v }); if (msg) PO.toast(msg); };
    const sites = P.sites.map((s) => ({ ...s, radius: radii[s.id] || s.radius }));
    const devices = devicesOf(P);
    const term = P.id === 'in' ? 'Biometric terminals' : 'Kiosks';
    const secs = [['sites', 'Sites & geofences'], ['qr', 'Site QR codes'], ['dev', term], ['sup', 'Supervisor entry'], ['off', 'Offline punches']];
    const methodsOf = (s) => ['Web portal', 'Site QR', ...(devices.some((d) => d[1] === s.id) ? [P.id === 'in' ? 'Biometric' : 'Kiosk'] : []), ...(s.lead ? ['Supervisor'] : [])];
    const outside = (s) => get('out.' + s.id, P.id === 'uk' && s.id === 'sr' ? 'qr' : 'flag');
    const outLabel = { block: 'Block the punch', qr: 'Ask for the site QR', flag: 'Allow and flag' };
    const site = sites.find((s) => s.id === cur) || sites[0];
    const H = 360;
    return html`<div class="row wrap" style="gap:10px;margin-bottom:14px"><${PO.Segmented} value=${sec} onChange=${setSec} options=${secs} /><span class="right faint t-sm">Fallback order: web portal location, then site QR, then ${P.id === 'in' ? 'biometric terminal' : 'kiosk'}, then supervisor entry</span></div>
      ${sec === 'sites' ? html`<div class="at-setup">
        <div class="card" style="overflow:hidden;align-self:start">${sites.map((s) => html`<button class=${'at-site ' + (s.id === site.id ? 'on' : '')} onClick=${() => setCur(s.id)}>
            <span class="grow" style="min-width:0;text-align:left"><b class="w-550 ellipsis" style="display:block">${s.name}</b><span class="faint t-xs ellipsis" style="display:block">${s.address}</span></span>
            <span class="tnum t-sm w-550" style="flex:none">${dist(P, s.radius)}</span></button>`)}</div>
        <div class="col gap-16" style="min-width:0">
          <${PO.Card} icon="MapPin" accent="blue" title=${site.name} sub=${site.client} actions=${html`<span class="faint t-sm">Outside the fence: ${outLabel[outside(site)].toLowerCase()}</span>`}>
            <${PO.GMapPlace} lat=${site.lat} lng=${site.lng} zoom=${fenceZoom(site.lat, site.radius, H)} height=${H} radius=${site.radius} label=${site.name} address=${site.address} />
            <div class="at-geo-ctl mt-16">
              <div class="grow"><div class="row"><b class="w-600">Geofence radius</b><b class="right tnum t-md">${dist(P, site.radius)}</b></div>
                <input type="range" min="50" max="500" step="10" value=${site.radius} onInput=${(e) => setRadii({ ...radii, [site.id]: +e.target.value })} onChange=${(e) => PO.toast(`Geofence for ${site.name} saved: ${dist(P, +e.target.value)}`, { action: { label: 'Undo', run: () => setRadii({ ...radii }) } })} style="width:100%;margin-top:8px;accent-color:var(--brand)" />
                <div class="row faint t-xs"><span>${dist(P, 50)}</span><span class="right">${dist(P, 500)}</span></div></div>
            </div>
            <div class="faint t-sm mt-8">Browser location indoors is often ±${dist(P, 50)} to ±${dist(P, 200)}. A tighter fence means more people fall back to the site QR.</div>
            <div class="divider" style="margin:14px 0;border-top:1px solid var(--border)"></div>
            <${PO.KV} items=${[['Address', site.address], ['Coordinates', `${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}`], ['Clock-in page', html`<span class="t-sm" style="white-space:nowrap">${clockUrl(P, site.id).replace('https://', '')}</span>`], ['Methods allowed', html`<span class="row wrap" style="gap:4px">${methodsOf(site).map((m) => html`<span class="tag" style="height:20px;font-size:11px">${m}</span>`)}</span>`]]} />
            <div class="mt-16 at-inl"><${PO.Field} label="If someone clocks in outside the fence"><${PO.Segmented} value=${outside(site)} onChange=${(v) => put('out.' + site.id, v, `${site.name}: ${outLabel[v].toLowerCase()} for out-of-fence punches`)} options=${Object.entries(outLabel)} /></${PO.Field}></div>
          </${PO.Card}>
          <div class="grid g-2">
            <${PO.Card} icon="QrCode" accent="green" title="Site QR" sub=${GATE[site.id] || 'Main entrance'}>
              <div class="row" style="gap:14px;align-items:flex-start"><${QR} seed=${P.id + site.id + get('rot.' + site.id, 0)} size=${112} />
                <div class="grow" style="min-width:0"><div class="t-sm muted">Opens the portal’s clock-in page for this site. It works only with the employee’s portal sign-in.</div>
                  <div class="faint t-xs mt-8 ellipsis" title=${clockUrl(P, site.id)}>${clockUrl(P, site.id).replace('https://', '')}</div>
                  <div class="mt-8 faint t-xs">Code v${1 + get('rot.' + site.id, 0)}</div></div></div>
              <div class="row mt-12" style="gap:6px"><${PO.Button} size="sm" icon="Printer" onClick=${() => PO.fakeDownload(`QR poster, ${site.name}, ${GATE[site.id] || 'entrance'} (A4 PDF)`)}>Print poster</${PO.Button}><${PO.Button} size="sm" icon="RefreshCw" onClick=${() => put('rot.' + site.id, get('rot.' + site.id, 0) + 1, `New QR issued for ${site.name}. Old posters stop working now.`)}>Rotate</${PO.Button}></div>
            </${PO.Card}>
            <${PO.Card} icon="Fingerprint" accent="violet" title=${P.id === 'in' ? 'Terminals and supervisor entry' : 'Kiosks and supervisor entry'}>
              <div class="col" style="gap:10px">${devices.filter((d) => d[1] === site.id).map(([name, , where, online], i) => { const idx = devices.findIndex((d) => d[1] === site.id && d[2] === where); const on = get('dev.' + idx, online); return html`<div class="row" style="gap:10px"><${PO.Icon} n=${P.id === 'in' ? 'Fingerprint' : 'Tablet'} size=${16} style="color:var(--text-3)" /><div class="grow" style="min-width:0"><b class="w-550 ellipsis" style="display:block">${name}</b><div class="faint t-xs">${where}</div></div>${on ? html`<${PO.Badge} tone="green" dot>Online</${PO.Badge}>` : html`<${PO.Badge} tone="red" dot>Offline</${PO.Badge}>`}</div>`; })}
                ${devices.some((d) => d[1] === site.id) ? null : html`<div class="row" style="gap:10px"><${PO.Icon} n="MonitorSmartphone" size=${16} style="color:var(--text-3)" /><div class="grow"><b class="w-550">No ${P.id === 'in' ? 'terminal' : 'kiosk'} here</b><div class="faint t-xs">Staff use the web portal or the site QR</div></div><${PO.Button} size="sm" onClick=${() => PO.toast(`Kiosk mode link for ${site.name} copied. Open it on a tablet at the entrance.`, { icon: 'Link' })}>Kiosk mode</${PO.Button}></div>`}
                <div class="divider" style="border-top:1px solid var(--border)"></div>
                <div class="row" style="gap:10px"><${PO.Icon} n="UserCheck" size=${16} style="color:var(--text-3)" /><div class="grow" style="min-width:0"><b class="w-550">Supervisor entry</b><div class="faint t-xs ellipsis">${site.lead ? `${P.byId[site.lead].name} can enter punches for this site` : 'HR enters punches for this site'}</div></div><${PO.Switch} on=${get('sup.' + site.id, true)} onChange=${(v) => put('sup.' + site.id, v, `Supervisor entry ${v ? 'on' : 'off'} at ${site.name}`)} /></div>
              </div>
            </${PO.Card}>
          </div>
        </div>
      </div>` : null}
      ${sec === 'qr' ? html`<div class="grid g-3">${sites.map((s) => html`<div class="card" style="padding:14px"><div class="row" style="gap:14px;align-items:flex-start"><${QR} seed=${P.id + s.id + get('rot.' + s.id, 0)} /><div class="grow" style="min-width:0"><b class="w-600">${s.name}</b><div class="faint t-sm">${GATE[s.id] || 'Main entrance'}</div><div class="faint t-xs mt-8 ellipsis" title=${clockUrl(P, s.id)}>/clock-in/${s.id}</div><div class="mt-8 faint t-xs">${2 + ((s.id.charCodeAt(0) * 7) % 9)} scans today, code v${1 + get('rot.' + s.id, 0)}</div></div></div>
        <div class="row mt-12" style="gap:6px"><${PO.Button} size="sm" icon="Printer" onClick=${() => PO.fakeDownload(`QR poster, ${s.name} (A4 PDF)`)}>Print</${PO.Button}><${PO.Button} size="sm" icon="RefreshCw" onClick=${() => put('rot.' + s.id, get('rot.' + s.id, 0) + 1, `New QR issued for ${s.name}. Old posters stop working now.`)}>Rotate code</${PO.Button}></div></div>`)}
        <${PO.Card} icon="ScanLine" accent="teal" title="How the site QR works"><div class="col gap-12 t-sm muted"><div>1. The employee scans the poster at the entrance with any phone camera.</div><div>2. It opens <span>${portalHost(P)}/clock-in</span> in the browser, signed in to the employee portal.</div><div>3. The scan proves they are at the site, even when browser location is weak.</div></div></${PO.Card}></div>` : null}
      ${sec === 'dev' ? html`<div class="card">${devices.map(([name, sid, where, online, last], i) => { const on = get('dev.' + i, online); return html`<div class="at-dev"><${PO.Icon} n=${P.id === 'in' ? 'Fingerprint' : 'Tablet'} size=${18} /><div class="grow" style="min-width:0"><b class="w-550">${name}</b><div class="faint t-sm ellipsis">${PO.site(sid).name}, ${where}, S/N ${P.id === 'in' ? 'ESL' : 'KSK'}${4410 + i * 37}</div></div>
          <div style="width:150px" class="t-sm"><div class="faint t-xs">Last sync</div>${last}</div><div style="width:120px" class="t-sm"><div class="faint t-xs">Punches today</div><b class="tnum">${on ? 6 + ((i * 7) % 19) : 0}</b>${!on ? html` <span class="faint">(${3 + i} queued)</span>` : ''}</div>
          ${on ? html`<${PO.Badge} tone="green" dot>Online</${PO.Badge}>` : html`<${PO.Badge} tone="red" dot>Offline</${PO.Badge}>`}
          <${PO.Menu} align="right" trigger=${html`<${PO.IconButton} icon="Ellipsis" title="Device actions" />`} items=${[{ label: 'Sync now', icon: 'RefreshCw', onClick: () => { put('dev.' + i, true); PO.toast(`${name} at ${where}: synced ${on ? 'just now' : 3 + i + ' queued punches'}`); } }, { label: 'Restart device', icon: 'Power', onClick: () => PO.toast(`Restart sent to ${where}`) }, { label: 'Push employee list', icon: 'Users', onClick: () => PO.toast(`${P.people.filter((p) => p.site === sid).length} employees pushed to the device`) }]} /></div>`; })}
        <div class="card-f row"><span class="faint t-sm">${P.id === 'in' ? 'eSSL and ZKTeco terminals push punches over ADMS every 60 s. Consent for fingerprint templates is captured at onboarding under the DPDP Act 2023.' : P.id === 'uk' ? 'Kiosks run the portal in kiosk mode on a locked tablet and keep working offline.' : 'Kiosks run the portal in kiosk mode on a locked tablet and keep working offline.'}</span><${PO.Button} size="sm" icon="Plus" cls="right" onClick=${() => PO.toast(P.id === 'in' ? 'Enter the terminal serial number to pair it' : 'Open kiosk mode on the tablet and enter the pairing code')}>${P.id === 'in' ? 'Add terminal' : 'Add kiosk'}</${PO.Button}></div></div>` : null}
      ${sec === 'sup' ? html`<div class="grid g-main"><${PO.Card} icon="UserCheck" accent="green" title="Supervisor entry" sub="For people who couldn’t clock in themselves">
          <div class="col gap-16" style="max-width:640px">
            <${PO.Field} label="Who can enter punches"><${PO.Select} value=${get('sup.who', 'leads')} onChange=${(v) => put('sup.who', v, 'Saved')} options=${[['leads', 'Site leads, for their own site'], ['mgrs', 'Site leads and managers'], ['hr', 'HR only']]} /></${PO.Field}>
            <${PO.Switch} on=${get('sup.reason', true)} onChange=${(v) => put('sup.reason', v)} label="Require a reason (forgot, terminal offline, no signal, other)" />
            <${PO.Switch} on=${get('sup.notify', true)} onChange=${(v) => put('sup.notify', v)} label="Email the employee when someone enters a punch for them" />
            <${PO.Switch} on=${get('sup.flag', true)} onChange=${(v) => put('sup.flag', v)} label="Flag anyone with more than 3 supervisor entries in a week" />
          </div></${PO.Card}>
        <${PO.Card} icon="CalendarDays" accent="blue" title="This week" sub="Supervisor entries">
          <div class="col gap-12">${sites.filter((s) => s.lead).slice(0, 4).map((s, i) => html`<div class="row" style="gap:10px"><${PO.Avatar} p=${P.byId[s.lead]} size="sm" /><div class="grow" style="min-width:0"><b class="w-550 ellipsis" style="display:block">${P.byId[s.lead].name}</b><div class="faint t-xs ellipsis">${s.name}</div></div><b class="tnum">${1 + ((i * 5 + 2) % 6)}</b></div>`)}</div>
        </${PO.Card}></div>` : null}
      ${sec === 'off' ? html`<${PO.Card} icon="WifiOff" accent="amber" title="Offline punches" sub="For kiosks and terminals in basements, hospital wards and sites with no signal">
        <div class="col gap-16" style="max-width:640px">
          <${PO.Switch} on=${get('off.on', true)} onChange=${(v) => put('off.on', v)} label="Let kiosks and terminals store punches while offline" />
          <${PO.Field} label="Accept offline punches synced within"><${PO.Select} value=${get('off.win', '72')} onChange=${(v) => put('off.win', v, `Offline window set to ${v} hours`)} options=${[['12', '12 hours'], ['24', '24 hours'], ['72', '72 hours'], ['168', '7 days']]} /></${PO.Field}>
          <${PO.Switch} on=${get('off.flag', true)} onChange=${(v) => put('off.flag', v)} label="Flag offline punches older than 12 hours for review" />
          <${PO.Switch} on=${get('off.time', true)} onChange=${(v) => put('off.time', v)} label="Use the terminal’s trusted clock, not the tablet’s time setting" />
          <${PO.Callout} tone="green" icon="CloudUpload" title="38 offline punches synced this week">Most came from ${P.id === 'in' ? 'the EON Kharadi basement terminal' : P.id === 'us' ? 'the Central kitchen kiosk by the walk-in cooler' : 'the Salford Royal estates entrance'}. None were rejected.</${PO.Callout}>
        </div></${PO.Card}>` : null}`;
  }

  /* ================= Policies ================= */
  function Policies({ P }) {
    const [pol, setPol] = PO.useCoState('attendance.policies', {});
    const [edit, setEdit] = useState(null);
    const IN = P.id === 'in';
    const defs = [
      ['grace', 'Grace period', IN ? '10 minutes' : '5 minutes', 'Punches within the grace period count as on time.', ['5 minutes', '7 minutes', '10 minutes', '15 minutes']],
      ['late', 'Late marks', IN ? '3 late marks in a month = half-day LOP' : 'Recorded only, no deduction', 'Applied when the muster is locked.', IN ? ['Recorded only, no deduction', '3 late marks in a month = half-day LOP', '4 late marks in a month = half-day LOP'] : ['Recorded only, no deduction', 'Written warning after 4 in a period']],
      ['half', 'Half day', IN ? 'Under 6 h worked = half day; under 4 h = absent' : 'Not used (hours are paid as worked)', 'Based on first in and last out.', IN ? ['Under 6 h worked = half day; under 4 h = absent', 'Under 5 h worked = half day; under 3 h = absent'] : ['Not used (hours are paid as worked)']],
      ['brk', 'Break deduction', IN ? '30 min auto-deducted on 8 h shifts if not punched' : P.id === 'us' ? '30 min unpaid meal, only when punched' : '20 min unpaid rest break on 6 h+ shifts', 'Applies to hourly staff.', ['None', '30 min auto-deducted on 8 h shifts if not punched', '30 min unpaid meal, only when punched', '20 min unpaid rest break on 6 h+ shifts']],
      ['round', 'Rounding', 'Nearest 15 minutes, neutral', P.id === 'us' ? 'Neutral rounding is allowed by the DOL (29 CFR 785.48).' : 'Applied to overtime only.', ['None (exact minutes)', 'Nearest 5 minutes, neutral', 'Nearest 15 minutes, neutral']],
      ['ot', 'Overtime', IN ? '2× after 9 h a day or 48 h a week' : P.id === 'us' ? '1.5× after 40 h in a workweek' : '1.5× after 40 h a week', 'Needs pre-approval by the site supervisor.', [IN ? '2× after 9 h a day or 48 h a week' : P.id === 'us' ? '1.5× after 40 h in a workweek' : '1.5× after 40 h a week']],
      ['auto', 'Missing clock-out', 'Close at shift end and flag for regularisation', 'The person and supervisor get a message the same day.', ['Close at shift end and flag for regularisation', 'Leave open until fixed (unpaid)']],
      ['wo', IN ? 'Weekly off' : 'Workweek', IN ? '1 rotating weekly off; working it earns a comp-off' : 'Monday to Sunday', IN ? 'Comp-offs expire after 60 days.' : 'Used for overtime and scheduling.', IN ? ['1 rotating weekly off; working it earns a comp-off', 'Fixed Sunday off'] : ['Monday to Sunday', 'Sunday to Saturday']],
    ];
    const val = (k, d) => pol[k] || d;
    return html`<div class="grid g-main">
      <div class="col gap-16">
        <${PO.Card} icon="Clock" accent="green" title="Shift timings" flush actions=${html`<${PO.Button} size="sm" href=${PO.href('roster')}>Roster</${PO.Button}>`}>
          <table class="tbl"><thead><tr><th>Shift</th><th>Time</th><th>Break</th><th>Grace</th><th>Allowance</th><th class="r">People</th></tr></thead><tbody>
            ${P.shifts.map((s) => html`<tr><td><b class="w-550">${s.label}</b></td><td class="tnum">${s.time}</td><td>${P.id === 'uk' ? '20 min unpaid' : '30 min'}</td><td>${val('grace', IN ? '10 minutes' : '5 minutes').replace(' minutes', ' min')}</td><td>${s.key === 'C' ? (IN ? '₹50 night allowance' : P.id === 'uk' ? '£1.50/h night premium' : 'None') : '—'}</td><td class="r tnum">${P.people.filter((p) => p.shift === s.key).length}</td></tr>`)}
          </tbody></table></${PO.Card}>
        <${PO.Card} icon="BookOpen" accent="blue" title="Attendance rules" flush sub="Applied to everyone unless a site overrides">
          ${defs.map(([k, l, d, hint]) => html`<div class="at-pol"><div><b class="w-550">${l}</b></div><div><div>${val(k, d)}</div><div class="faint t-xs mt-4">${hint}</div></div><${PO.Button} size="sm" icon="PencilLine" onClick=${() => setEdit({ k, l, d, opts: defs.find((x) => x[0] === k)[4], v: val(k, d) })}>Edit</${PO.Button}></div>`)}
        </${PO.Card}>
      </div>
      <div class="col gap-16">
        <${PO.Card} icon="MapPin" accent="teal" title="Site overrides">
          <div class="col gap-12">${(IN ? [['khd', 'Overtime 2× after 9 h in a day (client rule from 1 Oct)'], ['vmn', 'Mall closes 23:00; evening shift ends 23:30'], ['hq', 'Fixed Sunday off; 9:30–18:00']] : P.id === 'us' ? [['ck', 'Overnight bake: 10 min paid rest every 4 h'], ['dm', 'Catering pickups: split shifts allowed']] : [['sr', 'NHS site: browser location is weak on wards; site QR at the estates entrance'], ['ma', 'Airside: badge check before clock-in']]).map(([sid, t]) => html`<div><b class="w-550">${PO.site(sid).name}</b><div class="muted t-sm">${t}</div></div>`)}</div>
        </${PO.Card}>
        <${PO.Card} icon="SlidersHorizontal" accent="violet" title="Custom rules" actions=${html`<${PO.Button} size="sm" kind="ghost" href=${PO.href('rules')}>Rules</${PO.Button}>`}>
          <p class="muted t-sm">Rules written in plain words are previewed on last period’s data before they apply. Example:</p>
          <p class="t-sm mt-8" style="padding-left:10px;border-left:2px solid var(--border-strong)">${P.ai.rule}</p>
        </${PO.Card}>
      </div>
      <${PO.Drawer} open=${!!edit} onClose=${() => setEdit(null)} size="sm" title=${edit ? edit.l : ''} sub="Applies from the next pay period" footer=${html`<${PO.Button} onClick=${() => setEdit(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" onClick=${() => { setPol({ ...pol, [edit.k]: edit.v }); PO.toast(`${edit.l} updated: ${edit.v}`); setEdit(null); }}>Save rule</${PO.Button}>`}>
        ${edit ? html`<div class="col gap-12">${edit.opts.map((o) => html`<label class="row card" style="padding:12px;cursor:pointer;gap:10px;${edit.v === o ? 'border-color:var(--brand);background:var(--brand-soft)' : ''}"><input type="radio" checked=${edit.v === o} onChange=${() => setEdit({ ...edit, v: o })} /><span>${o}</span></label>`)}
          <p class="faint t-sm">Changes are versioned. Last edited by ${P.byId[P.hrId].name} on ${PO.date('2026-04-01')}.</p></div>` : null}
      </${PO.Drawer}>
    </div>`;
  }

  PO.route('attendance', AttendancePage, { title: 'Attendance', wide: true });
})();
