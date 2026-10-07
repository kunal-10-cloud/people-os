/* People OS: Roster (route `roster`). Week grid per site with staggered weekly offs, rotated nights, leave and
   unavailability, open shifts, coverage vs requirement, live labour cost vs budget, AI auto-fill with undo,
   swaps, templates and publish. Edits persist per company with useCoState. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;

  const WEEK = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'];
  const TODAY_I = 1;
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SH = ['A', 'B', 'C'];
  const SHC = { A: 'var(--green-solid)', B: 'var(--blue-solid)', C: 'var(--violet)' };

  document.head.insertAdjacentHTML('beforeend', `<style>
  .ro-wrap { overflow: auto; max-height: max(420px, calc(100vh - 384px)); }
  table.ro-grid { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 1020px; table-layout: fixed; }
  .ro-grid th, .ro-grid td { border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); padding: 4px; vertical-align: middle; background: var(--surface); }
  .ro-grid th:last-child, .ro-grid td:last-child { border-right: 0; }
  .ro-grid thead th { position: sticky; top: 0; z-index: 2; background: var(--surface-2); font-weight: 550; font-size: 12px; color: var(--text-2); text-align: left; padding: 8px 10px; height: 38px; }
  .ro-grid thead th .d { font-family: var(--num); font-size: 14px; color: var(--text); margin-left: 4px; }
  .ro-grid thead th.today { box-shadow: inset 0 -2px 0 var(--signal); color: var(--text); }
  .ro-grid td.today { background: var(--surface-2); }
  .ro-grid .nm { position: sticky; left: 0; z-index: 1; min-width: 210px; width: 210px; padding: 6px 12px; }
  .ro-grid thead .nm { z-index: 3; }
  .ro-grid .hc { width: 80px; min-width: 80px; text-align: right; padding-right: 12px; font-family: var(--num); font-size: 14px; font-variant-numeric: tabular-nums; }
  .ro-grid td.cell { cursor: pointer; overflow: hidden; }
  .ro-grid td.cell:hover .ro-chip, .ro-grid td.cell:hover .ro-empty { box-shadow: inset 0 0 0 1px var(--border-strong); }
  .ro-chip { --bar: var(--border-strong); display: flex; flex-direction: column; gap: 1px; padding: 4px 8px 4px 10px; border-radius: 6px; font-size: 12px; line-height: 1.25; min-height: 40px; justify-content: center; background: color-mix(in srgb, var(--bar) 14%, var(--surface)); border: 1px solid color-mix(in srgb, var(--bar) 22%, transparent); box-shadow: inset 3px 0 0 var(--bar); color: var(--text); }
  .ro-chip b { font-family: var(--num); font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px; }
  .ro-chip small { color: color-mix(in srgb, var(--bar) 70%, var(--text)); font-size: 11px; font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px; }
  .ro-chip.A { --bar: var(--green-solid); } .ro-chip.B { --bar: var(--blue-solid); } .ro-chip.C { --bar: var(--violet); }
  .ro-chip.L { --bar: var(--teal); }
  .ro-chip.L b { font-family: var(--font); font-size: 12px; }
  .ro-chip.L.pend { border-style: dashed; border-color: color-mix(in srgb, var(--teal) 55%, transparent); background: color-mix(in srgb, var(--teal) 7%, var(--surface)); }
  .ro-chip.L.pend small { color: var(--amber); }
  .ro-chip.new { border-color: var(--brand); border-style: solid; }
  .ro-chip.ot small { color: var(--amber); }
  .ro-chip .chip-ic { width: 16px; height: 16px; border-radius: 4px; background: none; color: inherit; }
  .ro-key { display: inline-flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-2); white-space: nowrap; }
  .ro-key i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 5px; vertical-align: -2px; background: color-mix(in srgb, var(--k) 18%, var(--surface)); box-shadow: inset 3px 0 0 var(--k); }
  .ro-empty { min-height: 40px; border-radius: 5px; display: grid; place-items: center; color: var(--text-3); font-size: 11.5px; }
  .ro-empty.un { border: 1px dashed var(--border-strong); color: var(--text-2); }
  .ro-open { min-height: 40px; border-radius: 6px; border: 1.5px dashed var(--amber-solid); background: color-mix(in srgb, var(--amber-solid) 8%, var(--surface)); display: flex; align-items: center; gap: 6px; padding: 4px 8px; font-size: 12px; }
  .ro-open .grow small { display: block; color: var(--text-3); font-size: 11px; font-family: var(--num); }
  .ro-open b { font-weight: 550; color: var(--amber); }
  .ro-open .go { font-weight: 600; color: var(--brand-text); font-size: 12px; }
  .ro-grid tfoot td { position: sticky; z-index: 1; background: var(--surface-2); font-size: 12px; border-bottom: 0; }
  .ro-grid tfoot tr.c1 td { bottom: 38px; border-top: 1px solid var(--border); height: 46px; }
  .ro-grid tfoot tr.c2 td { bottom: 0; height: 38px; }
  .ro-grid tfoot td.nm { z-index: 3; }
  .ro-cov { display: flex; align-items: center; gap: 6px; font-family: var(--num); font-size: 13px; font-variant-numeric: tabular-nums; }
  .ro-cov i { flex: 1; height: 4px; border-radius: 2px; background: var(--surface-3); overflow: hidden; }
  .ro-cov i > s { display: block; height: 100%; background: var(--brand); }
  .ro-cov.short i > s { background: var(--red-solid); }
  .ro-budget { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-2); white-space: nowrap; }
  .ro-budget b { font-family: var(--num); font-size: 14px; color: var(--text); font-weight: 600; }
  .ro-meter { position: relative; width: 140px; height: 6px; border-radius: 3px; background: var(--surface-3); }
  .ro-meter > i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; }
  .ro-meter > s { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--text); }
  .ro-tl { position: relative; height: 30px; border-radius: 5px; background: var(--surface-2); }
  .ro-tl i { position: absolute; top: 4px; bottom: 4px; border-radius: 5px; font-size: 11px; padding: 0 8px; display: flex; align-items: center; font-style: normal; font-weight: 550; font-family: var(--num); white-space: nowrap; overflow: hidden; background: color-mix(in srgb, var(--bar) 14%, var(--surface)); border: 1px solid color-mix(in srgb, var(--bar) 22%, transparent); box-shadow: inset 3px 0 0 var(--bar); color: var(--text); }
  .ro-av { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .ro-av:last-child { border-bottom: 0; }
  .ro-note { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--surface-2); font-size: 12.5px; }
  </style>`);

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

  const otLimit = (P) => (P.id === 'in' ? 48 : 40);
  const otMult = (P) => (P.id === 'in' ? 2 : 1.5);
  const isSal = (P, p) => !!P.roles[p.role].salary || (P.id === 'in' && (p.role === 'sup' || p.role === 'office'));

  /* ---------- base schedule (pure) ---------- */
  function buildBase(P, siteId) {
    const people = P.people.filter((p) => p.site === siteId && p.role !== 'office');
    const r = PO.seeded('roster' + P.id + siteId);
    const plan = {};
    const groups = { A: [], B: [], C: [] };
    people.forEach((p) => groups[p.shift].push(p));
    const IN = P.id === 'in';
    // staggered weekly offs, round-robin inside each shift group so coverage stays level
    SH.forEach((k) => {
      groups[k].forEach((p, i) => {
        const days = Array(7).fill(k);
        const offs = [];
        const pool = k === P.current ? [0, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
        const part = p.type === 'Part-time' || (P.id === 'uk' && p.u && p.u.hours && p.u.hours < 150);
        const nOff = IN ? 1 : part ? (p.u && (p.u.hours || p.u.reg) <= 96 ? 3 + (i % 2) : 3) : 2;
        const start = (i * 3 + (k === 'B' ? 1 : k === 'C' ? 2 : 0)) % pool.length;
        for (let j = 0; j < nOff; j++) offs.push(pool[(start + j) % pool.length]);
        if (isSal(P, p)) { offs.length = 0; offs.push(5, 6); if (IN) { offs.length = 0; offs.push(6); } }
        offs.forEach((d) => (days[d] = 'OFF'));
        plan[p.id] = days;
      });
    });
    // rotate nights: a few night workers swap their second half-week with evening workers
    const nRot = Math.min(Math.floor(groups.C.length / 3), groups.B.length);
    for (let j = 0; j < nRot; j++) {
      const c = groups.C[groups.C.length - 1 - j], b = groups.B[groups.B.length - 1 - j];
      if (!c || !b || c.id === P.cover.who) continue;
      for (let d = 4; d < 7; d++) { const x = plan[c.id][d], y = plan[b.id][d]; plan[c.id][d] = x === 'OFF' ? 'OFF' : 'B'; plan[b.id][d] = y === 'OFF' ? 'OFF' : 'C'; }
      plan[c.id].rot = true; plan[b.id].rot = true;
    }
    // a few people pick up an extra shift on their day off (overtime) — never more than ~8% of the site
    const nOT = Math.max(1, Math.round(people.length * (IN ? 0.07 : 0.06)));
    r.shuffle(people.filter((p) => !isSal(P, p) && p.type !== 'Part-time' && p.id !== P.cover.who)).slice(0, nOT).forEach((p) => { const d = plan[p.id].indexOf('OFF'); if (d >= 0) plan[p.id][d] = p.shift; });
    // unavailability on some days off (college, second job, childcare)
    const reasons = { in: ['Native place visit', 'Second job', 'College exam', 'Family function'], us: ['Class at ACC', 'Second job', 'Childcare', 'Not available Sundays'], uk: ['School run', 'Second job', 'College', 'Caring responsibilities'] }[P.id];
    const unavail = {};
    people.forEach((p) => { const rr = PO.seeded('un' + P.id + p.id); if (rr.chance(0.16)) { const offs = plan[p.id].map((x, d) => [x, d]).filter(([x]) => x === 'OFF'); if (offs.length) { const [, d] = rr.pick(offs); unavail[p.id + '|' + d] = rr.pick(reasons); } } });
    // requirement per day per shift = what the template staffs, plus the open shifts
    const opens = siteId === P.roster.site ? P.roster.opens.map((o, i) => ({ ...o, id: 'open' + i, filler: P.roster.fillers[i] })) : [];
    const req = WEEK.map((_, d) => Object.fromEntries(SH.map((k) => [k, people.filter((p) => plan[p.id][d] === k).length])));
    opens.forEach((o) => (req[o.day][o.shift] += 1));
    return { people, plan, opens, req, unavail };
  }

  function leaveFor(P, ids, decided) {
    const out = {};
    P.leaveRequests.filter((l) => ids.has(l.who) && l.to >= WEEK[0] && l.from <= WEEK[6] && l.status !== 'Rejected').forEach((l) => {
      const st = decided['leave:' + l.id] ? (decided['leave:' + l.id] === 'approved' ? 'Approved' : 'Rejected') : l.status;
      if (st === 'Rejected') return;
      WEEK.forEach((iso, d) => { if (iso >= l.from && iso <= l.to) out[l.who + '|' + d] = { type: l.type, pend: st === 'Pending', id: l.id }; });
    });
    // planted inbox approvals: leave on Fri 9 Oct
    P.approvals.filter((a) => a.who && ids.has(a.who) && /Leave|Time off|Holiday/.test(a.kind) && /9 Oct|Oct 9/.test(a.title)).forEach((a) => {
      if (decided[a.id] === 'rejected') return;
      out[a.who + '|4'] = { type: P.leaveTypes[0].key === 'cl' ? 'cl' : P.leaveTypes[0].key, pend: decided[a.id] !== 'approved', ap: a.id };
    });
    return out;
  }

  /* ---------- page ---------- */
  function RosterPage({ query }) {
    const P = PO.P();
    const { state, dispatch } = PO.useStore();
    const scope = useScope();
    const decided = PO.coGet(state, 'approvals.decided', {});
    const sitesAll = P.sites.filter((s) => P.people.some((p) => p.site === s.id && p.role !== 'office'));
    const sites = sitesAll.filter((s) => !scope || P.people.some((p) => p.site === s.id && scope.has(p.id)));
    const [siteSel, setSite] = PO.useCoState('roster.site', query.site || (sites.find((s) => s.id === P.roster.site) ? P.roster.site : sites[0].id));
    const siteId = sites.find((s) => s.id === siteSel) ? siteSel : sites[0].id;
    const site = PO.site(siteId);
    const [view, setView] = useState(query.view || 'week');
    const [dayI, setDayI] = useState(TODAY_I);
    const [edits, setEdits] = PO.useCoState('roster.edits', {});
    const [filled, setFilled] = PO.useCoState('roster.filled', {});
    const [status, setStatus] = PO.useCoState('roster.status', {});
    const [swaps, setSwaps] = PO.useCoState('roster.swaps', {});
    const [shiftF, setShiftF] = useState('all');
    const [open, setOpen] = useState(query.cell ? { pid: query.cell.split(':')[0], d: +query.cell.split(':')[1] } : null);
    const [aiNote, setAiNote] = useState(null);
    const [bottom, setBottom] = useState(query.tab || 'swaps');
    const [ask, confirmEl] = PO.useConfirm();

    const base = useMemo(() => buildBase(P, siteId), [P.id, siteId]);
    const ids = useMemo(() => new Set(base.people.map((p) => p.id)), [base]);
    const lv = leaveFor(P, ids, decided);
    const ap5 = P.approvals.find((a) => a.kind === 'Shift swap');
    const swapMate = ap5 ? P.people.find((p) => ap5.title.includes(p.name)) : null;

    const cellOf = (p, d) => {
      const key = siteId + '|' + p.id + '|' + d;
      if (edits[key] != null) return { code: edits[key], edited: true };
      if (lv[p.id + '|' + d]) return { code: 'L', ...lv[p.id + '|' + d] };
      let code = base.plan[p.id][d];
      if (ap5 && decided[ap5.id] === 'approved' && d === 3 && swapMate && (p.id === ap5.who || p.id === swapMate.id)) code = p.id === ap5.who ? 'OFF' : 'A';
      const un = code === 'OFF' ? base.unavail[p.id + '|' + d] : null;
      return { code, un, rot: base.plan[p.id].rot && code !== p.shift && code !== 'OFF' };
    };
    const fillers = base.opens.map((o) => ({ ...o, name: o.filler, person: P.people.find((q) => q.name === o.filler) }));
    const fm = filled[siteId] || {};
    const isF = (f) => fm === true || !!fm[f.id];
    const isFilled = fillers.length > 0 && fillers.every(isF);
    const fillCells = fillers.filter(isF);
    const people = base.people.filter((p) => !scope || scope.has(p.id) || true);

    const hoursOf = (p) => WEEK.reduce((t, _, d) => t + (SH.includes(cellOf(p, d).code) ? 8 : 0), 0);
    const rows = people.map((p) => ({ p, cells: WEEK.map((_, d) => cellOf(p, d)), h: hoursOf(p) }));
    const limit = otLimit(P);
    const sal = (p) => isSal(P, p);
    const counted = rows.filter((x) => !x.p.contractor && !sal(x.p));
    const hrs = counted.reduce((t, x) => t + x.h, 0) + fillCells.length * 8;
    const otHrs = counted.reduce((t, x) => t + Math.max(0, x.h - limit), 0);
    const cost = hrs * P.roster.hourCost + otHrs * P.roster.hourCost * (otMult(P) - 1);
    const baseCostAt = (sid) => { const b = sid === siteId ? base : buildBase(P, sid); return b.people.filter((p) => !p.contractor && !sal(p)).reduce((t, p) => t + b.plan[p.id].filter((x) => SH.includes(x)).length * 8, 0) * P.roster.hourCost; };
    // P.roster.budget is the roster site's weekly budget; when it doesn't fit the site's staffing, plan at 4% headroom
    const ratio = P.roster.budget / baseCostAt(P.roster.site);
    const sane = ratio > 0.95 && ratio < 1.4 ? ratio : 1.04;
    const budget = siteId === P.roster.site && ratio === sane ? P.roster.budget : Math.round((baseCostAt(siteId) * sane) / 100) * 100;
    const dayCost = WEEK.map((_, d) => (counted.filter((x) => SH.includes(x.cells[d].code)).length + fillCells.filter((f) => f.day === d).length) * 8 * P.roster.hourCost);
    const cov = WEEK.map((_, d) => { const have = rows.filter((x) => SH.includes(x.cells[d].code)).length + fillCells.filter((f) => f.day === d).length; const need = SH.reduce((t, k) => t + base.req[d][k], 0); return { have, need }; });
    const otPeople = rows.filter((x) => x.h > limit);
    const st = status[siteId] || (siteId === P.roster.site ? 'draft' : 'published');
    const changed = Object.keys(edits).filter((k) => k.startsWith(siteId + '|')).length + fillCells.length;
    const agency = rows.filter((x) => x.p.contractor);
    const money = (n) => PO.money(Math.round(n));

    const setCell = (p, d, code, why, more) => {
      const key = siteId + '|' + p.id + '|' + d;
      const prev = edits;
      const extra = more ? Object.fromEntries(more.map(([q, dd, cc]) => [siteId + '|' + q.id + '|' + dd, cc])) : {};
      setEdits({ ...edits, [key]: code, ...extra });
      if (st === 'published') setStatus({ ...status, [siteId]: 'draft' });
      PO.toast(why || `${p.first}: ${DOW[d]} ${code === 'OFF' ? 'off' : PO.shiftOf(code).label}`, { action: { label: 'Undo', run: () => setEdits(prev) } });
    };
    const autoFill = () => {
      if (!fillers.length) { PO.toast('No open shifts at this site this week', { icon: 'CircleCheck' }); return; }
      setFilled({ ...filled, [siteId]: true });
      setStatus({ ...status, [siteId]: 'draft' });
      setAiNote(fillers.filter((f) => !isF(f)).map((f) => ({ f, why: `${f.name} is in the ${f.person ? PO.site(f.person.site).name + ' team' : 'relief pool'}, trained for ${site.name}, ${f.person ? 32 : 24 + f.day * 2} h this week, so ${PO.shiftOf(f.shift).label.toLowerCase()} on ${DOW[f.day]} adds no overtime.` })));
      PO.toast(`Filled ${PO.plural(fillers.length, 'open shift')} with no overtime`, { icon: 'CircleCheck', action: { label: 'Undo', run: () => { setFilled({ ...filled, [siteId]: false }); setAiNote(null); } } });
    };
    const publish = () => ask({
      title: `Publish week of ${PO.date(WEEK[0], { short: true })} for ${site.name}?`, icon: 'Send', confirm: `Publish and notify ${rows.length + fillCells.length}`,
      body: html`<div class="col gap-12"><p>${PO.plural(rows.length + fillCells.length, 'person', 'people')} get their shifts for ${PO.date(WEEK[0], { short: true })}–${PO.date(WEEK[6], { short: true })} in the employee portal, with an email and SMS alert. ${changed ? `${PO.plural(changed, 'change')} since the last version are highlighted for them.` : ''}</p>
        ${cov.some((c) => c.have < c.need) ? html`<${PO.Callout} tone="amber" icon="TriangleAlert" title="Some days are short-staffed">${cov.map((c, d) => (c.have < c.need ? `${DOW[d]} ${c.have}/${c.need}` : null)).filter(Boolean).join(', ')}. Open shifts are offered to qualified people first.</${PO.Callout}>` : null}
        ${otPeople.length ? html`<${PO.Callout} tone="amber" icon="Timer" title=${`${PO.plural(otPeople.length, 'person', 'people')} over ${limit} h`}>${otPeople.map((x) => `${x.p.name} (${x.h} h)`).join(', ')}. Overtime is paid at ${otMult(P)}×.</${PO.Callout}>` : null}</div>`,
      onConfirm: () => { setStatus({ ...status, [siteId]: 'published' }); PO.toast(`Sent to ${rows.length + fillCells.length} people by email and SMS`, { icon: 'Send' }); },
    });
    const copyLast = () => { const prev = edits; const n = Object.fromEntries(Object.entries(edits).filter(([k]) => !k.startsWith(siteId + '|'))); setEdits(n); setFilled({ ...filled, [siteId]: false }); setAiNote(null); PO.toast(`Copied last week’s pattern (${PO.date('2026-09-28', { short: true })} – ${PO.date('2026-10-04', { short: true })}) to ${site.name}`, { icon: 'Copy', action: { label: 'Undo', run: () => setEdits(prev) } }); };
    const exportCsv = () => PO.exportCsv(`roster-${site.name.toLowerCase().replace(/\W+/g, '-')}-wk-5-oct`, [['Employee', 'ID', ...WEEK.map((iso, d) => `${DOW[d]} ${iso}`), 'Hours'], ...rows.map((x) => [x.p.name, x.p.id, ...x.cells.map((c) => (SH.includes(c.code) ? `${PO.shiftOf(c.code).label} ${PO.shiftOf(c.code).time}` : c.code === 'L' ? 'Leave' : 'Off')), x.h]), ...fillCells.map((f) => [f.name, 'Relief', ...WEEK.map((_, d) => (d === f.day ? PO.shiftOf(f.shift).label : '')), 8])]);
    const budPct = budget ? cost / budget : 0;
    const shown = rows.filter((x) => shiftF === 'all' || x.p.shift === shiftF || x.cells.some((c) => c.code === shiftF));
    const swapList = useMemo(() => {
      const r = PO.seeded('swap' + P.id + siteId);
      const list = [];
      const mateName = ap5 ? (ap5.title.match(/with (.+)$/) || [, 'a colleague'])[1] : '';
      if (ap5 && ids.has(ap5.who)) list.push({ id: ap5.id, from: PO.person(ap5.who), to: swapMate || { id: null, first: mateName.split(' ')[0], name: mateName }, day: 3, shift: base.plan[ap5.who][3] === 'OFF' ? 'A' : base.plan[ap5.who][3], why: ap5.detail, inbox: true });
      const pool = base.people.filter((p) => !isSal(P, p));
      for (let i = 0; i < 2 && pool.length > 3; i++) { const a = r.pick(pool), b = r.pick(pool.filter((x) => x.id !== a.id)); const d = r.int(2, 6); list.push({ id: `sw-${siteId}-${i}`, from: a, to: b, day: d, shift: a.shift, why: r.pick(['Doctor’s appointment', 'Family function', 'Exam at college', 'Child’s school event']) + `, ${b.first} agreed`, inbox: false }); }
      return list;
    }, [P.id, siteId]);
    const swapState = (s) => (s.inbox ? decided[s.id] : swaps[s.id]);
    const decideSwap = (s, v) => {
      if (s.inbox) dispatch({ type: 'coState', key: 'approvals.decided', value: { ...decided, [s.id]: v }, init: {} });
      else setSwaps({ ...swaps, [s.id]: v });
      if (v === 'approved' && !s.inbox && s.to.id) { const k1 = siteId + '|' + s.from.id + '|' + s.day, k2 = siteId + '|' + s.to.id + '|' + s.day; setEdits({ ...edits, [k1]: 'OFF', [k2]: s.shift }); }
      PO.toast(v === 'approved' ? `Swap approved: ${s.to.first} works ${DOW[s.day]} ${PO.shiftOf(s.shift).label.toLowerCase()} for ${s.from.first}` : 'Swap declined; both were told');
    };

    const short = cov.map((c, d) => (c.have < c.need ? DOW[d] : null)).filter(Boolean);
    const covHave = cov.reduce((t, c) => t + Math.min(c.have, c.need), 0), covNeed = cov.reduce((t, c) => t + c.need, 0);
    const openLeft = fillers.length - fillCells.length;
    const offs = rows.flatMap((x) => x.cells.map((c, d) => [x, c, d]).filter(([, c]) => c.code === 'L' || c.un));
    const pendSwaps = swapList.filter((sw) => !swapState(sw)).length;
    const ruleList = [
      [otPeople.length === 0, otPeople.length ? `${PO.plural(otPeople.length, 'person', 'people')} over ${limit} h a week: ${otPeople.map((x) => `${x.p.name} (${x.h} h)`).join(', ')}` : `Nobody over ${limit} h a week`],
      [true, P.id === 'in' ? 'At least one weekly off for everyone (Shops & Establishments Act)' : P.id === 'us' ? 'No clopens under 10 h rest' : '11 h rest between shifts (Working Time Regulations)'],
      [true, 'Night shifts rotated; nobody on nights more than 6 in a row'],
      [!short.length, short.length ? `Short-staffed on ${short.join(', ')}` : 'Every shift meets its requirement'],
      [true, P.id === 'in' ? 'Women on night shift only with consent and transport (OSH Code)' : 'Only trained people on specialist posts'],
    ];
    const ruleIssues = ruleList.filter(([ok]) => !ok).length;
    const budTone = budPct > 1 ? 'red' : budPct > 0.95 ? 'amber' : 'brand';

    return html`
      <${PO.PageHeader} title="Roster" sub=${html`Week of ${PO.date(WEEK[0], { short: true })} to ${PO.date(WEEK[6], { short: true })} for ${site.name}, ${PO.plural(rows.length, 'person', 'people')}. ${st === 'published' ? html`Published to the team${changed ? `, with ${PO.plural(changed, 'change')} since` : ''}.` : html`<span style="color:var(--signal);font-weight:550">Draft</span>${changed ? `, ${PO.plural(changed, 'unpublished change')}` : ''}.`}`}
        actions=${html`
          <${PO.Button} onClick=${autoFill} disabled=${isFilled || !fillers.length}>${isFilled ? 'Open shifts filled' : 'Auto-fill open shifts'}</${PO.Button}>
          <${PO.Button} kind="primary" icon="Send" onClick=${publish}>${st === 'published' && !changed ? 'Republish' : 'Publish'}</${PO.Button}>
          <${PO.Menu} align="right" width=${250} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More actions" />`} items=${[{ header: 'Templates' }, { label: 'Copy last week', icon: 'Copy', hint: '28 Sep', onClick: copyLast }, { label: P.id === 'in' ? '6 on, 1 off (rotating)' : '5 on, 2 off (rotating)', icon: 'Repeat', onClick: copyLast }, { label: 'Save this week as a template', icon: 'BookmarkPlus', onClick: () => PO.toast(`Saved “${site.name} standard week”`) }, '-', { label: 'Print (A3 landscape)', icon: 'Printer', onClick: () => PO.fakeDownload(`Roster ${site.name} PDF`) }, { label: 'Export CSV', icon: 'FileSpreadsheet', onClick: exportCsv }, { label: 'Copy read-only link', icon: 'Link', onClick: () => PO.toast('Read-only roster link copied') }]} />`} />

      <${PO.KpiStrip} items=${[
        { label: 'Coverage', icon: 'CalendarRange', accent: 'green', value: covHave, unit: '/' + covNeed, bar: [{ v: covHave, k: 'ok', title: `${covHave} shifts staffed` }, { v: covNeed - covHave, k: 'bad', title: `${covNeed - covHave} short` }], sub: short.length ? `Short on ${short.join(', ')}` : 'Every shift is covered' },
        { label: 'Open shifts', icon: 'CalendarPlus', accent: 'amber', faces: fillers.filter((f) => !isF(f) && f.person).map((f) => f.person.id), value: openLeft, unit: fillers.length ? '/' + fillers.length : '', alert: openLeft > 0, bar: fillers.length ? [{ v: fillCells.length, k: 'ok', title: 'Filled' }, { v: openLeft, k: 'warn', title: 'Open' }] : null, sub: openLeft ? 'Still to fill this week' : fillers.length ? 'All filled' : 'None this week' },
        { label: `Over ${limit} h`, icon: 'Timer', accent: otPeople.length ? 'red' : 'blue', faces: otPeople.map((x) => x.p.id), value: otPeople.length, sub: otPeople.length ? `${otPeople.slice(0, 2).map((x) => x.p.first).join(' and ')}${otPeople.length > 2 ? ' and others' : ''}, paid at ${otMult(P)}×` : 'No overtime scheduled' },
        { label: 'Swap requests', icon: 'ArrowLeftRight', accent: 'violet', faces: swapList.filter((sw) => !swapState(sw)).flatMap((sw) => [sw.from.id, sw.to.id]).filter(Boolean), value: pendSwaps, sub: pendSwaps ? 'Waiting for your decision' : 'All decided', onClick: () => setBottom('swaps') },
      ]} />

      <div class="card mt-24" style="overflow:hidden">
        <div class="tbl-toolbar">
          <select class="select" style="width:auto;min-width:190px;height:30px" value=${siteId} onChange=${(e) => { setSite(e.target.value); setAiNote(null); }}>${sites.map((s) => html`<option value=${s.id}>${s.name}</option>`)}</select>
          <${PO.Segmented} value=${view} onChange=${setView} options=${[['week', 'Week'], ['day', 'Day']]} />
          ${view === 'week' ? html`<select class="select" style="width:auto;height:30px" value=${shiftF} onChange=${(e) => setShiftF(e.target.value)}><option value="all">All shifts</option>${P.shifts.map((s) => html`<option value=${s.key}>${s.label} ${s.time}</option>`)}</select>` : html`<div class="row" style="gap:4px">${WEEK.map((iso, d) => html`<button class=${'btn sm ' + (d === dayI ? 'primary' : 'ghost')} onClick=${() => setDayI(d)}>${DOW[d]} ${+iso.slice(8)}</button>`)}</div>`}
          <div class="right ro-budget" title=${`${PO.num(hrs)} h at ${PO.money(P.roster.hourCost)}${otHrs ? `, ${otHrs} h overtime at ${otMult(P)}×` : ''}${agency.length ? `. ${agency.length} agency staff are billed by the agency.` : ''}`}>
            <span>Labour <b>${money(cost)}</b> of ${money(budget)}</span>
            <span class="ro-meter"><i style=${`width:${Math.min(100, budPct * 100)}%;background:var(--${budTone === 'brand' ? 'brand' : budTone + '-solid'})`}></i><s style=${`left:${Math.min(99, 100 / Math.max(1, budPct))}%`}></s></span>
            <span style=${`color:var(--${budTone === 'brand' ? 'text-2' : budTone});font-weight:600`}>${budPct > 1 ? `${money(cost - budget)} over` : `${money(budget - cost)} left`}</span>
          </div>
        </div>
        ${aiNote ? html`<div class="ro-note"><${PO.Icon} n="CircleCheck" size=${15} style="color:var(--green);flex:none" /><span class="grow">Filled ${PO.plural(aiNote.length, 'open shift')} with no overtime: ${aiNote.map((x) => `${x.f.name} on ${DOW[x.f.day]}`).join(' and ')}. Labour cost rises by ${money(aiNote.length * 8 * P.roster.hourCost)}.</span><${PO.Button} size="sm" kind="ghost" onClick=${() => { setFilled({ ...filled, [siteId]: false }); setAiNote(null); PO.toast('Auto-fill undone'); }}>Undo</${PO.Button}><${PO.IconButton} icon="X" size="sm" title="Dismiss" onClick=${() => setAiNote(null)} /></div>` : null}
        ${view === 'week' ? html`<div class="ro-wrap"><table class="ro-grid">
          <thead><tr><th class="nm">Employee</th>${WEEK.map((iso, d) => html`<th class=${d === TODAY_I ? 'today' : ''}>${DOW[d]}<span class="d">${+iso.slice(8)}</span>${d === TODAY_I ? html`<span class="faint t-xs" style="margin-left:6px;font-weight:500">today</span>` : null}</th>`)}<th class="hc" style="font-family:var(--font);font-size:12px">Hours</th></tr></thead>
          <tbody>
            ${fillers.length ? html`<tr><td class="nm"><div class="row" style="gap:10px"><${PO.Chip} icon="CalendarPlus" accent="amber" /><div><b class="w-550">Open shifts</b><div class="faint t-xs">${isFilled ? 'All filled' : `${openLeft} to fill`}</div></div></div></td>
              ${WEEK.map((_, d) => { const o = fillers.filter((f) => f.day === d); return html`<td class=${'cell ' + (d === TODAY_I ? 'today' : '')} onClick=${() => o.length && setOpen({ open: o[0], d })}>${o.map((f) => isF(f) ? html`<div class=${'ro-chip new ' + f.shift}><b>${PO.shiftOf(f.shift).time}</b><small><${PO.Avatar} p=${f.person} name=${f.name} size="xs" />${f.name}</small></div>` : html`<div class="ro-open" title="Assign someone to this open shift"><div class="grow" style="min-width:0"><div class="row" style="gap:4px"><b class="ellipsis">${PO.shiftOf(f.shift).label}</b><span class="go right">Assign</span></div><small class="ellipsis">${PO.shiftOf(f.shift).time}</small></div></div>`)}</td>`; })}<td class="hc faint">${fillCells.length ? fillCells.length * 8 + ' h' : '–'}</td></tr>` : null}
            ${shown.map((x) => html`<tr>
              <td class="nm"><div class="row" style="gap:10px"><${PO.Avatar} p=${x.p} /><div style="min-width:0"><a class="w-550 ellipsis" style="display:block;max-width:150px" href=${PO.href('people/' + x.p.id)}>${x.p.name}</a><div class="faint t-xs ellipsis" style="max-width:160px">${x.p.title}${x.p.contractor ? ', agency' : ''}${sal(x.p) ? ', salaried' : ''}</div></div></div></td>
              ${x.cells.map((c, d) => html`<td class=${'cell ' + (d === TODAY_I ? 'today' : '')} onClick=${() => setOpen({ pid: x.p.id, d })}><${Chip} P=${P} c=${c} ot=${x.h > limit && SH.includes(c.code) && d === x.cells.map((y) => SH.includes(y.code)).lastIndexOf(true)} /></td>`)}
              <td class="hc"><span style=${x.h > limit ? 'color:var(--amber);font-weight:600' : ''}>${x.h} h</span>${x.h > limit ? html`<div class="t-xs" style="color:var(--amber);font-family:var(--font)">+${x.h - limit} OT</div>` : x.h < (P.id === 'in' ? 40 : 24) && !x.cells.some((c) => c.code === 'L') ? html`<div class="faint t-xs" style="font-family:var(--font)">Part week</div>` : null}</td></tr>`)}
          </tbody>
          <tfoot>
            <tr class="c1"><td class="nm"><b class="w-550">Coverage</b><div class="faint t-xs">Scheduled against required</div></td>${cov.map((c) => html`<td><div class=${'ro-cov ' + (c.have < c.need ? 'short' : '')}><b style=${c.have < c.need ? 'color:var(--red)' : ''}>${c.have}/${c.need}</b><i><s style=${`width:${Math.min(100, (c.have / (c.need || 1)) * 100)}%`}></s></i></div></td>`)}<td class="hc"></td></tr>
            <tr class="c2"><td class="nm"><b class="w-550">Labour cost</b></td>${dayCost.map((c) => html`<td class="tnum" style="font-family:var(--num);font-size:13px;text-align:right;padding-right:10px">${money(c)}</td>`)}<td class="hc"><b>${money(dayCost.reduce((a, b) => a + b, 0))}</b></td></tr>
          </tfoot>
        </table></div>
        <div class="tbl-foot"><span class="ro-key">${['A', 'B', 'C'].map((k) => html`<span><i style=${`--k:${SHC[k]}`}></i>${PO.shiftOf(k).label} ${PO.shiftOf(k).time}</span>`)}<span><i style="--k:var(--teal)"></i>Leave</span><span><i style="--k:var(--amber-solid);box-shadow:none;border:1.5px dashed var(--amber-solid)"></i>Open shift</span></span><span class="right faint">Click any cell to change it</span></div>` : html`<${DayView} P=${P} rows=${rows} d=${dayI} fill=${fillCells} setOpen=${setOpen} />`}
      </div>

      <div class="mt-24"><${PO.Tabs} value=${bottom} onChange=${setBottom} tabs=${[['swaps', 'Swap requests', pendSwaps || null], ['off', 'Who’s off', offs.length || null], ['rules', 'Rules checked', ruleIssues || null]]} /></div>
      ${bottom === 'swaps' ? html`<${PO.Card} flush icon="ArrowLeftRight" accent="violet" title=${`Swap requests at ${site.name}`} sub="From the employee portal">
          ${swapList.length ? swapList.map((sw) => { const v = swapState(sw); return html`<div class="list-item"><span class="av-stack"><${PO.Avatar} p=${sw.from} /><${PO.Avatar} p=${sw.to.id ? sw.to : null} name=${sw.to.name} /></span><div class="grow" style="min-width:0"><b class="w-550">${sw.from.name} wants ${sw.to.first} to cover ${DOW[sw.day]} ${+WEEK[sw.day].slice(8)}, ${PO.shiftOf(sw.shift).label.toLowerCase()}</b><div class="faint t-xs ellipsis">${sw.why}${sw.inbox ? '. Also in the inbox.' : ''}</div></div>${v ? html`<${PO.Status} s=${v === 'approved' ? 'Approved' : 'Rejected'} />` : html`<div class="row" style="gap:6px"><${PO.Button} size="sm" kind="ghost" onClick=${() => decideSwap(sw, 'rejected')}>Decline</${PO.Button}><${PO.Button} size="sm" onClick=${() => decideSwap(sw, 'approved')}>Approve</${PO.Button}></div>`}</div>`; }) : html`<${PO.Empty} icon="ArrowLeftRight" title="No swap requests" text="Swap requests from the employee portal show up here." />`}
        </${PO.Card}>` : null}
      ${bottom === 'off' ? html`<${PO.Card} flush icon="Palmtree" accent="teal" title="Who’s off this week" sub=${site.name}>
          ${offs.length ? offs.map(([x, c, d]) => html`<div class="list-item"><${PO.Avatar} p=${x.p} /><div class="grow" style="min-width:0"><b class="w-550">${x.p.name}</b><div class="faint t-xs">${DOW[d]} ${+WEEK[d].slice(8)} Oct</div></div><span class="t-sm muted">${c.code === 'L' ? (PO.leaveType(c.type)?.name || 'Leave') : 'Unavailable: ' + c.un.toLowerCase()}</span>${c.code === 'L' && c.pend ? html`<${PO.Badge} tone="amber" dot>Pending</${PO.Badge}>` : null}</div>`) : html`<${PO.Empty} icon="Palmtree" title="Nobody is off" text="No leave or unavailability this week." />`}
        </${PO.Card}>` : null}
      ${bottom === 'rules' ? html`<${PO.Card} flush icon="ShieldCheck" accent="green" title="Rules checked before publishing">
          ${ruleList.map(([ok, t]) => html`<div class="list-item t-sm"><${PO.Icon} n=${ok ? 'Check' : 'TriangleAlert'} size=${15} style=${`color:var(--${ok ? 'text-3' : 'amber'});flex:none`} /><span class=${ok ? 'muted' : ''}>${t}</span></div>`)}
        </${PO.Card}>` : null}
      <${CellDrawer} P=${P} open=${open} onClose=${() => setOpen(null)} rows=${rows} cellOf=${cellOf} setCell=${setCell} site=${site} limit=${limit} fillers=${fillers} isFilled=${isFilled} isF=${isF} fill=${(f) => { setFilled({ ...filled, [siteId]: { ...(fm === true ? {} : fm), [f.id]: true } }); setStatus({ ...status, [siteId]: 'draft' }); PO.toast(`${f.name} assigned to ${DOW[f.day]} ${PO.shiftOf(f.shift).label.toLowerCase()}`, { action: { label: 'Undo', run: () => setFilled({ ...filled }) } }); }} />
      ${confirmEl}`;
  }

  function Chip({ P, c, ot }) {
    if (SH.includes(c.code)) { const s = PO.shiftOf(c.code); return html`<div class=${`ro-chip ${c.code} ${c.edited ? 'new' : ''} ${ot ? 'ot' : ''}`} title=${`${s.label} ${s.time}${c.rot ? ', rotated from another shift this week' : ''}`}><b>${s.time}</b><small>${s.label}${c.rot ? html`<${PO.Icon} n="RefreshCw" size=${10} />` : ''}${ot ? ', overtime' : ''}</small></div>`; }
    if (c.code === 'L') { const t = PO.leaveType(c.type); return html`<div class=${'ro-chip L ' + (c.pend ? 'pend' : '')} title=${t ? t.name : 'Leave'}><b><${PO.Icon} n="Palmtree" size=${12} />${t ? t.name : 'Leave'}</b><small>${c.pend ? 'Pending approval' : 'Approved'}</small></div>`; }
    if (c.un) return html`<div class="ro-empty un" title=${c.un}>Unavailable</div>`;
    return html`<div class="ro-empty">${c.edited ? 'Off' : P.id === 'in' ? 'Weekly off' : 'Off'}</div>`;
  }

  function DayView({ P, rows, d, fill, setOpen }) {
    const on = rows.filter((x) => SH.includes(x.cells[d].code)).sort((a, b) => PO.shiftOf(a.cells[d].code).from - PO.shiftOf(b.cells[d].code).from);
    const extra = fill.filter((f) => f.day === d);
    const seg = (code) => { const s = PO.shiftOf(code); const a = s.from / 60, b = s.to <= s.from ? 24 : s.to / 60; const segs = [[a, b]]; if (s.to < s.from && s.to > 0) segs.push([0, s.to / 60]); return segs; };
    const color = SHC;
    const bar = (code, label) => seg(code).map(([a, b]) => html`<i style=${`left:${(a / 24) * 100}%;width:${((b - a) / 24) * 100}%;--bar:${color[code]}`}>${label}</i>`);
    const nowPct = d === TODAY_I ? (P.company.nowMin / 1440) * 100 : null;
    return html`<div style="padding:12px 16px">
      <div class="row" style="gap:12px"><div style="width:224px;flex:none"></div><div class="grow" style="position:relative;height:16px;font-size:10.5px;color:var(--text-3)">${Array.from({ length: 13 }, (_, i) => html`<span style=${`position:absolute;left:${(i / 12) * 100}%;transform:translateX(${i === 0 ? '0' : i === 12 ? '-100%' : '-50%'})`}>${P.hhmm((i * 120) % 1440)}</span>`)}</div></div>
      <div class="col mt-8" style="gap:6px;max-height:560px;overflow:auto">
        ${[...on.map((x) => ({ x })), ...extra.map((f) => ({ f }))].map(({ x, f }) => html`<div class="row" style="gap:12px">
          <div style="width:224px;flex:none" class="row">${x ? html`<${PO.Avatar} p=${x.p} /><div style="min-width:0"><b class="w-550 ellipsis" style="display:block">${x.p.name}</b><div class="faint t-xs">${x.h} h this week</div></div>` : html`<${PO.Avatar} name=${f.name} size="sm" /><div><b class="w-550">${f.name}</b><div class="faint t-xs">Relief, auto-filled</div></div>`}</div>
          <div class="ro-tl grow" style="cursor:pointer" onClick=${() => x && setOpen({ pid: x.p.id, d })}>${bar(x ? x.cells[d].code : f.shift, `${PO.shiftOf(x ? x.cells[d].code : f.shift).label} ${PO.shiftOf(x ? x.cells[d].code : f.shift).time}`)}${nowPct != null ? html`<span style=${`position:absolute;top:-2px;bottom:-2px;left:${nowPct}%;width:2px;background:var(--signal)`}></span>` : null}</div></div>`)}
        ${!on.length ? html`<${PO.Empty} icon="CalendarX2" title="Nobody scheduled" text="Pick another day." />` : null}
      </div>
      <div class="row faint t-xs mt-12"><span>${PO.plural(on.length + extra.length, 'person', 'people')} on ${DOW[d]} ${+WEEK[d].slice(8)}</span>${nowPct != null ? html`<span class="row" style="gap:4px"><i style="width:10px;height:2px;background:var(--signal);display:inline-block"></i>Now, ${P.hhmm(P.company.nowMin)}</span>` : null}</div>
    </div>`;
  }

  function CellDrawer({ P, open, onClose, rows, cellOf, setCell, site, limit, fillers, isF, fill }) {
    if (!open) return html`<${PO.Drawer} open=${false} />`;
    const d = open.d;
    const deep = open.pid === 'open' ? fillers.find((x) => x.day === d) : null;
    if (open.open || deep) {
      const f = open.open || deep;
      const avail = rows.filter((x) => !SH.includes(x.cells[d].code) && x.cells[d].code !== 'L' && !x.cells[d].un).sort((a, b) => a.h - b.h).slice(0, 6);
      return html`<${PO.Drawer} open onClose=${onClose} title=${`Open shift, ${DOW[d]} ${+WEEK[d].slice(8)} Oct`} sub=${`${site.name}, ${PO.shiftOf(f.shift).label.toLowerCase()} ${PO.shiftOf(f.shift).time}`} footer=${html`<${PO.Button} onClick=${onClose}>Close</${PO.Button}><${PO.Button} icon="Megaphone" onClick=${() => { PO.toast(`Open shift offered to ${avail.length + 1} qualified people by SMS, with a link to accept in the employee portal`); onClose(); }}>Offer to everyone qualified</${PO.Button}>`}>
        ${isF(f) ? html`<${PO.Callout} tone="green" icon="CircleCheck" title=${`Filled by ${f.name}`}>Assigned and accepted in the employee portal.</${PO.Callout}>` : html`<div class="col gap-12">
          <div class="card" style="padding:12px"><div class="row"><div class="grow"><b class="w-600">Best match: ${f.name}</b><div class="t-sm muted mt-4">${f.person ? `From ${PO.site(f.person.site).name}` : 'From the relief pool'}, trained for ${site.name}, and no overtime.</div></div><${PO.Button} size="sm" kind="primary" onClick=${() => { fill(f); onClose(); }}>Assign</${PO.Button}></div></div>
          <div class="t-sm w-600">Also available at ${site.name}</div>
          <div>${avail.map((x) => { const risk = x.h + 8 > limit; return html`<div class="ro-av"><${PO.Avatar} p=${x.p} size="sm" /><div class="grow"><b class="w-550">${x.p.name}</b><div class="faint t-xs">${x.h} h this week${risk ? `, ${x.h + 8} h with this shift` : ''}</div></div>${risk ? html`<${PO.Badge} tone="amber" dot>Overtime</${PO.Badge}>` : null}<${PO.Button} size="sm" onClick=${() => { setCell(x.p, d, f.shift, `${x.p.first} takes the open ${PO.shiftOf(f.shift).label.toLowerCase()} shift on ${DOW[d]}`); onClose(); }}>Assign</${PO.Button}></div>`; })}</div></div>`}
      </${PO.Drawer}>`;
    }
    const x = rows.find((r) => r.p.id === open.pid);
    if (!x) return html`<${PO.Drawer} open=${false} />`;
    const p = x.p;
    const c = cellOf(p, d);
    const working = SH.includes(c.code);
    const others = rows.filter((r) => r.p.id !== p.id);
    const free = others.filter((r) => !SH.includes(r.cells[d].code) && r.cells[d].code !== 'L').map((r) => ({ ...r, risk: r.h + 8 > limit, trained: r.p.post === p.post || r.p.role === p.role, un: r.cells[d].un })).sort((a, b) => (a.un ? 1 : 0) - (b.un ? 1 : 0) || a.risk - b.risk || b.trained - a.trained || a.h - b.h).slice(0, 7);
    const swapWith = others.filter((r) => SH.includes(r.cells[d].code) && r.cells[d].code !== c.code).slice(0, 5);
    return html`<${PO.Drawer} open onClose=${onClose} title=${`${p.name}, ${DOW[d]} ${+WEEK[d].slice(8)} Oct`} sub=${`${p.post} at ${site.name}, ${x.h} h this week`} footer=${html`<${PO.Button} onClick=${onClose}>Done</${PO.Button}>`}>
      <div class="col gap-16">
        <div class="row" style="gap:12px"><${PO.Avatar} p=${p} size="lg" /><div class="grow"><b class="t-md w-600">${p.name}</b><div class="faint t-sm">${p.title}${p.contractor ? ', ' + p.contractor : ''}</div></div><div style="width:150px"><${Chip} P=${P} c=${c} /></div></div>
        <div><div class="t-sm w-600" style="margin-bottom:8px">Assign shift</div>
          <div class="row wrap" style="gap:6px">${P.shifts.map((s) => html`<${PO.Button} size="sm" kind=${c.code === s.key ? 'primary' : ''} onClick=${() => { setCell(p, d, s.key); onClose(); }}>${s.label}, ${s.time}</${PO.Button}>`)}<${PO.Button} size="sm" kind=${c.code === 'OFF' ? 'primary' : ''} onClick=${() => { setCell(p, d, 'OFF'); onClose(); }}>Off</${PO.Button}></div>
          ${x.h + (working ? 0 : 8) > limit && !working ? html`<div class="mt-8"><${PO.Callout} tone="amber" icon="Timer">Adding a shift takes ${p.first} to ${x.h + 8} h, ${x.h + 8 - limit} h of overtime at ${otMult(P)}×.</${PO.Callout}></div>` : null}
          ${c.code === 'L' ? html`<div class="mt-8"><${PO.Callout} tone="" icon="Palmtree" title=${c.pend ? 'Leave request pending' : 'On approved leave'} action=${html`<${PO.Button} size="sm" href=${PO.href('leave')}>Open</${PO.Button}>`}>${PO.leaveType(c.type)?.name || 'Leave'}. Assigning a shift here overrides it.</${PO.Callout}></div>` : null}
          ${c.un ? html`<div class="mt-8"><${PO.Callout} tone="" icon="Ban" title="Marked unavailable">${c.un}. ${p.first} set this in the employee portal.</${PO.Callout}></div>` : null}</div>
        ${working ? html`<div><div class="t-sm w-600" style="margin-bottom:4px">Give this shift to someone else</div><div class="faint t-xs" style="margin-bottom:6px">Free on ${DOW[d]}, sorted by overtime risk and training</div>
          ${free.map((r) => html`<div class="ro-av"><${PO.Avatar} p=${r.p} size="sm" /><div class="grow" style="min-width:0"><b class="w-550">${r.p.name}</b><div class="faint t-xs">${r.h} h this week, ${r.trained ? `trained for ${p.post}` : 'not trained for this post'}</div></div>${r.un ? html`<span class="faint t-sm">Unavailable</span>` : r.risk ? html`<${PO.Badge} tone="amber" dot>Overtime</${PO.Badge}>` : html`<span class="faint t-sm tnum">${r.h + 8} h</span>`}<${PO.Button} size="sm" disabled=${!!r.un} onClick=${() => { setCell(p, d, 'OFF', `${r.p.first} covers ${p.first}’s ${PO.shiftOf(c.code).label.toLowerCase()} shift on ${DOW[d]}`, [[r.p, d, c.code]]); onClose(); }}>Assign</${PO.Button}></div>`)}</div>
        <div><div class="t-sm w-600" style="margin-bottom:6px">Swap with</div><div class="row wrap" style="gap:6px">${swapWith.map((r) => html`<button class="tag" style="cursor:pointer;height:28px" onClick=${() => { setCell(p, d, r.cells[d].code, `Swapped ${DOW[d]}: ${p.first} ↔ ${r.p.first}`, [[r.p, d, c.code]]); onClose(); }}><${PO.Avatar} p=${r.p} size="xs" />${r.p.first}, ${PO.shiftOf(r.cells[d].code).label}</button>`)}</div></div>` : null}
      </div>
    </${PO.Drawer}>`;
  }

  PO.route('roster', RosterPage, { title: 'Roster', wide: true });
})();
