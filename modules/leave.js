/* People OS: Leave / Time off / Holiday & absence (route `leave`, `?new=1` opens a request).
   Requests (with inline approve that writes approvals.decided['leave:<id>'] so the inbox agrees), team calendar,
   balances with adjustments and encashment, policies per leave type, and holiday calendars per site. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .lv-type { --c: var(--text-3); display: inline-flex; align-items: center; gap: 6px; font-weight: 550; font-size: 12px; white-space: nowrap; height: 22px; padding: 0 8px; border-radius: 11px; background: color-mix(in srgb, var(--c) 14%, var(--surface)); color: color-mix(in srgb, var(--c) 72%, var(--text)); }
  .lv-type i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
  .lv-type.bare { background: none; padding: 0; height: auto; }
  .lt-wrap { overflow: auto; max-height: max(420px, calc(100vh - 360px)); }
  .lt { min-width: 980px; }
  .lt-row { display: grid; grid-template-columns: 220px minmax(0, 1fr); border-bottom: 1px solid var(--border); }
  .lt-row.h { position: sticky; top: 0; z-index: 3; }
  .lt-row.h > * { background: var(--surface-2); }
  .lt-row.f { position: sticky; bottom: 0; z-index: 3; border-bottom: 0; border-top: 1px solid var(--border); }
  .lt-row.f > * { background: var(--surface-2); }
  .lt-nm { position: sticky; left: 0; z-index: 2; background: var(--surface); display: flex; align-items: center; gap: 10px; padding: 7px 12px 7px 16px; border-right: 1px solid var(--border); min-width: 0; }
  .lt-nm b { display: block; font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lt-nm small { display: block; color: var(--text-3); font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lt-days { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); position: relative; min-height: 46px; }
  .lt-days > span { border-left: 1px solid color-mix(in srgb, var(--border) 60%, transparent); }
  .lt-days > span:first-child { border-left: 0; }
  .lt-days > span.we { background: var(--surface-2); }
  .lt-days > span.hol { background: color-mix(in srgb, var(--rose) 9%, var(--surface-2)); }
  .lt-row.h .lt-days { min-height: 40px; }
  .lt-row.h .lt-days > span { display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: var(--text-3); line-height: 1.15; }
  .lt-row.h .lt-days > span b { font-family: var(--num); font-size: 13px; font-weight: 600; color: var(--text-2); }
  .lt-row.h .lt-days > span.hol b { color: var(--rose); }
  .lt-row.h .lt-days > span.today b { background: var(--signal); color: #fff; border-radius: 9px; padding: 0 5px; }
  .lt-now { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: var(--signal); opacity: .55; pointer-events: none; }
  .lt-bar { --c: var(--blue-solid); position: absolute; top: 9px; bottom: 9px; margin: 0 2px; border-radius: 999px; display: flex; align-items: center; gap: 5px; padding: 0 8px; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; cursor: pointer; background: color-mix(in srgb, var(--c) 86%, var(--text)); border: 1px solid transparent; color: var(--surface); }
  .lt-bar:hover { background: color-mix(in srgb, var(--c) 72%, var(--text)); }
  .lt-bar.pend { background: color-mix(in srgb, var(--c) 12%, var(--surface)); border: 1.5px dashed color-mix(in srgb, var(--c) 70%, transparent); color: color-mix(in srgb, var(--c) 60%, var(--text)); }
  .lt-bar:empty { padding: 0; }
  .lt-bar.hol { --c: var(--rose); cursor: default; border-radius: 6px; }
  .lt-hl { position: absolute; top: 50%; transform: translateY(-50%); font-size: 11.5px; font-weight: 550; color: var(--rose); white-space: nowrap; pointer-events: none; }
  .lt-cnt { display: flex; align-items: center; justify-content: center; font-family: var(--num); font-size: 12px; color: var(--text-3); }
  .lt-cnt.hi { color: var(--amber); font-weight: 650; }
  .lt-key { display: inline-flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 12px; color: var(--text-2); }
  .lt-key > span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  .lt-key i { width: 18px; height: 9px; border-radius: 5px; background: color-mix(in srgb, var(--c) 86%, var(--text)); border: 1px solid transparent; }
  .lv-mc .cal-d { min-height: 104px; }
  .lv-mc .cal-d.hol { background: color-mix(in srgb, var(--rose) 6%, var(--surface)); }
  .lv-chip { --c: var(--blue-solid); display: flex; align-items: center; gap: 5px; padding: 2px 6px 2px 2px; border-radius: 11px; font-size: 11px; font-weight: 550; white-space: nowrap; overflow: hidden; cursor: pointer; background: color-mix(in srgb, var(--c) 18%, var(--surface)); color: color-mix(in srgb, var(--c) 60%, var(--text)); }
  .lv-chip .av { box-shadow: none; }
  .lv-chip span { overflow: hidden; text-overflow: ellipsis; }
  .lv-chip.pend { background: var(--surface); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent); }
  .lv-chip.holc { --c: var(--rose); padding-left: 6px; cursor: default; }
  .lv-bal { display: flex; flex-direction: column; gap: 4px; min-width: 92px; }
  .lv-bal .prog { flex: none; height: 3px; width: 100%; max-width: 100px; }
  .lv-bal .prog > i { background: var(--border-strong); }
  .lv-bal .prog.red > i { background: var(--red-solid); }
  .lv-chk { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .lv-chk:last-child { border-bottom: 0; }
  .lv-hol { display: flex; align-items: center; gap: 14px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
  .lv-hol:last-child { border-bottom: 0; }
  .lv-hol .dt { width: 44px; text-align: center; flex: none; }
  .lv-hol .dt small { display: block; font-size: 11px; color: var(--text-3); }
  .lv-hol .dt b { display: block; font-family: var(--num); font-size: 20px; font-weight: 600; line-height: 1.1; }
  .lv-hol.past { color: var(--text-3); }
  .lv-hol.past b { color: var(--text-3); }
  .lv-sitecal { display: grid; grid-template-columns: 200px repeat(var(--n), minmax(56px, 1fr)); font-size: 12px; }
  .lv-sitecal > div { padding: 8px 6px; border-bottom: 1px solid var(--border); text-align: center; }
  .lv-sitecal > div.h { font-weight: 550; color: var(--text-2); background: var(--surface-2); font-size: 11px; }
  .lv-sitecal > div.l { text-align: left; padding-left: 16px; }
  .lv-cal .cal-ev { background: var(--surface-2); color: var(--text); border-radius: 3px; box-shadow: inset 2px 0 0 var(--evc, var(--border-strong)); padding-left: 6px; font-weight: 500; }
  .lv-cal .cal-ev.pend { background: transparent; box-shadow: inset 0 0 0 1px var(--border-strong); color: var(--text-2); }
  .lv-cal .cal-ev.hol { background: transparent; box-shadow: none; color: var(--text-3); padding-left: 0; }
  .lv-pt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 16px; border: 0; border-bottom: 1px solid var(--border); background: none; cursor: pointer; text-align: left; color: var(--text); font: inherit; }
  .lv-pt:last-child { border-bottom: 0; }
  .lv-pt:hover { background: var(--hover); }
  .lv-pt.on { background: var(--surface-3); box-shadow: inset 2px 0 0 var(--ink); }
  </style>`);

  const CH = { Portal: ['Globe', 'the employee portal'], Email: ['Mail', 'email'], 'HR desk': ['Building2', 'the HR desk'] };
  const chOf = (c) => CH[c] || CH.Portal;
  const word = (P) => (P.id === 'in' ? { page: 'Leave & holidays', one: 'leave', req: 'Leave request', bal: 'Leave balances' } : P.id === 'us' ? { page: 'Time off & PTO', one: 'time off', req: 'Time-off request', bal: 'PTO & sick balances' } : { page: 'Holiday & absence', one: 'holiday', req: 'Holiday or absence request', bal: 'Holiday balances' });
  const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dow = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay();

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

  /* planted inbox approvals that are leave → request rows */
  function plantedRows(P) {
    return P.approvals.filter((a) => /Leave|Time off|Holiday|Sickness/.test(a.kind)).map((a) => {
      const sick = /sick/i.test(a.title);
      const type = P.id === 'in' ? (sick ? 'sl' : /Casual/.test(a.title) ? 'cl' : 'el') : P.id === 'us' ? (sick ? 'sick' : 'pto') : sick ? 'sick' : 'hol';
      const from = /today/i.test(a.title) ? PO.TODAY : '2026-10-09';
      const t = PO.leaveType(type) || P.leaveTypes.find((x) => x.key === type);
      const byName = !a.who && a.whoName ? P.people.find((q) => q.name === a.whoName) : null;
      const first = a.detail.split('.')[0];
      const reason = sick ? 'Unwell, called in before the shift' : /left|Balance/i.test(first) ? 'Family time' : first;
      return { id: a.id, ap: a.id, who: a.who || (byName ? byName.id : null), whoName: a.whoName || null, type, from, to: from, days: 1, hours: t && t.unit === 'hours' ? 8 : null, reason, status: 'Pending', applied: from === PO.TODAY ? PO.TODAY : '2026-10-05', approver: a.who ? (P.byId[a.who].manager || P.topId) : byName ? (byName.manager || P.topId) : P.topId, channel: /email/i.test(a.detail) ? 'Email' : /desk|in person|paper/i.test(a.detail) ? 'HR desk' : 'Portal', planted: true };
    });
  }

  function dayCount(P, from, to, half) {
    if (!from || !to || to < from) return { days: 0, hols: [], offs: 0 };
    let days = 0, offs = 0; const hols = [];
    for (let d = from; d <= to; d = PO.addDays(d, 1)) {
      const h = P.holidays.find((x) => x.date === d);
      const w = dow(d);
      const off = P.id === 'in' ? w === 0 : w === 0 || w === 6;
      if (h) hols.push(h); else if (off) offs++; else days++;
    }
    return { days: half ? Math.max(0.5, days - 0.5) : days, hols, offs };
  }
  const noticeDays = (P, type) => ({ cl: 1, el: 7, sl: 0, co: 1, lop: 3, pto: 3, sick: 0, unpaid: 7, jury: 0, hol: 14, comp: 0 }[type] ?? 1);
  const approvalChain = (P, type) => (P.id === 'in' ? (type === 'el' ? 'Site supervisor, then HR' : type === 'lop' ? 'Site supervisor, then Operations head' : 'Site supervisor') : P.id === 'us' ? (type === 'unpaid' ? 'Shift lead, then Operations' : 'Shift lead') : type === 'hol' ? 'Site supervisor (2 weeks’ notice in peak)' : 'Site supervisor, then HR');
  const dailyRate = (P, p) => {
    if (P.id === 'in') return (p.pay.structure ? p.pay.structure.basic : p.pay.gross) / 26;
    const r = P.roles[p.role];
    if (P.id === 'us') return r.salary ? r.salary / 10 : r.rate * 8;
    return r.salary ? r.salary / 20 : r.rate * 8;
  };
  const balKey = (P) => (P.id === 'in' ? 'el' : P.id === 'us' ? 'pto' : 'hol');

  /* ---------- page ---------- */
  function LeavePage({ query }) {
    const P = PO.P();
    const W = word(P);
    const { state, dispatch } = PO.useStore();
    const scope = useScope();
    const decided = PO.coGet(state, 'approvals.decided', {});
    const [tab, setTab] = PO.useCoState('leave.tab', query.tab || 'requests');
    const [added, setAdded] = PO.useCoState('leave.added', []);
    const [adj, setAdj] = PO.useCoState('leave.adj', {});
    const [newOpen, setNewOpen] = useState(query.new === '1');
    const [view, setView] = useState(null);
    const planted = useMemo(() => plantedRows(P), [P.id]);
    const all = [...added, ...planted, ...P.leaveRequests];
    const inScope = (r) => !scope || (r.who ? scope.has(r.who) : false);
    const statusOf = (r) => { const k = r.planted ? decided[r.ap] : decided['leave:' + r.id]; return k === 'approved' ? 'Approved' : k === 'rejected' ? 'Rejected' : k === 'cancelled' ? 'Cancelled' : r.status; };
    const rows = all.filter(inScope).map((r) => ({ ...r, st: statusOf(r), person: r.who ? P.byId[r.who] : null }));
    const decide = (r, v) => {
      const key = r.planted ? r.ap : 'leave:' + r.id;
      const prev = decided;
      dispatch({ type: 'coState', key: 'approvals.decided', value: { ...decided, [key]: v }, init: {} });
      const nm = r.person ? r.person.name : r.whoName;
      PO.toast(`${v === 'approved' ? 'Approved' : 'Declined'}: ${nm}, ${(PO.leaveType(r.type) || {}).name || 'leave'} ${fmtRange(r)}${v === 'approved' ? `, ${nm.split(' ')[0]} told by email and in the employee portal` : ''}`, { action: { label: 'Undo', run: () => dispatch({ type: 'coState', key: 'approvals.decided', value: prev, init: {} }) } });
    };
    const fmtRange = (r) => (r.from === r.to ? PO.date(r.from, { short: true }) : `${PO.date(r.from, { short: true })} – ${PO.date(r.to, { short: true })}`);

    const today = PO.TODAY;
    const offToday = rows.filter((r) => (r.st === 'Approved' || r.st === 'Pending') && r.from <= today && r.to >= today);
    const extraToday = P.outToday.filter(([n, why]) => !/Last day|Left on/i.test(why) && !offToday.some((r) => (r.person ? r.person.name : r.whoName) === n));
    const pending = rows.filter((r) => r.st === 'Pending');
    const weekEnd = PO.addDays(today, 5);
    const upcoming = rows.filter((r) => (r.st === 'Approved' || r.st === 'Pending') && r.from > today && r.from <= weekEnd);
    const people = P.people.filter((p) => !scope || scope.has(p.id));
    const bk = balKey(P);
    const liability = people.reduce((t, p) => { const b = p.leave[bk]; if (!b || b.balance == null) return t; const bal = b.balance + ((adj[p.id] || {})[bk] || 0); const units = PO.leaveType(bk).unit === 'hours' ? bal / 8 : bal; return t + units * dailyRate(P, p); }, 0);
    const ctx = { query, P, W, rows, decide, statusOf, fmtRange, setView, adj, setAdj, scope, people, added, setAdded };

    const offNames = [...offToday.map((r) => (r.person ? r.person.first : r.whoName.split(' ')[0])), ...extraToday.map(([n]) => n.split(' ')[0])];
    const exportReg = () => PO.exportCsv('leave-register-2026', [['Request', 'Employee ID', 'Name', 'Type', 'From', 'To', 'Days', 'Status', 'Channel'], ...rows.map((r) => [r.id, r.who || '', r.person ? r.person.name : r.whoName, (PO.leaveType(r.type) || {}).name, r.from, r.to, r.hours ? r.hours + ' h' : r.days, r.st, r.channel])]);
    const oldest = pending.length ? pending.map((r) => r.applied).sort()[0] : null;
    return html`
      <${PO.PageHeader} title=${W.page} sub=${`${PO.plural(people.length, 'person', 'people')}${scope ? ' in your team' : ''} on ${P.leaveTypes.filter((t) => t.quota != null).length} leave types. Policy year runs January to December 2026.`}
        actions=${html`<${PO.Button} kind="primary" icon="Plus" onClick=${() => setNewOpen(true)}>New ${W.one} request</${PO.Button}>
          <${PO.Menu} align="right" width=${230} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More actions" />`} items=${[{ label: P.id === 'in' ? 'Download leave register (CSV)' : 'Export requests (CSV)', icon: 'Download', onClick: exportReg }, { label: 'Holiday calendar (.ics)', icon: 'CalendarPlus', onClick: () => PO.fakeDownload('Holiday calendar (.ics)') }, '-', { label: 'Leave policies', icon: 'BookOpen', onClick: () => setTab('policies') }]} />`} />
      <${PO.KpiStrip} items=${[
        { label: 'Pending requests', icon: 'Inbox', accent: 'amber', faces: [...new Set(pending.map((r) => r.who).filter(Boolean))], value: pending.length, alert: pending.length > 0, sub: oldest ? `Oldest was sent ${PO.rel(oldest).toLowerCase()}` : 'Nothing waiting', onClick: () => setTab('requests') },
        { label: P.id === 'uk' ? 'Off today' : 'On leave today', icon: 'Palmtree', accent: 'teal', faces: [...new Set([...offToday.map((r) => r.who), ...extraToday.map(([n]) => (P.people.find((q) => q.name === n) || {}).id)].filter(Boolean))], value: offToday.length + extraToday.length, bar: [{ v: offToday.filter((r) => r.st === 'Approved').length + extraToday.length, k: 'ok', title: 'Approved' }, { v: offToday.filter((r) => r.st === 'Pending').length, k: 'warn', title: 'Pending' }], sub: offNames.length ? offNames.slice(0, 3).join(', ') + (offNames.length > 3 ? ` and ${offNames.length - 3} more` : '') : 'Everyone is in', onClick: () => setTab('calendar') },
        { label: 'Starting this week', icon: 'CalendarClock', accent: 'blue', faces: [...new Set(upcoming.map((r) => r.who).filter(Boolean))], value: upcoming.length, bar: [{ v: upcoming.filter((r) => r.st === 'Approved').length, k: 'ok', title: 'Approved' }, { v: upcoming.filter((r) => r.st === 'Pending').length, k: 'warn', title: 'Pending' }], sub: `${PO.date(PO.addDays(today, 1), { short: true })} to ${PO.date(weekEnd, { short: true })}, ${upcoming.filter((r) => r.st === 'Pending').length} still pending`, onClick: () => setTab('calendar') },
        { label: `${PO.leaveType(bk).short} liability`, icon: 'Wallet', accent: 'green', value: PO.money(liability, { compact: true }), sub: P.id === 'in' ? 'EL balance at basic ÷ 26, encashable' : P.id === 'us' ? 'PTO hours at pay rate, paid on exit' : 'Holiday days at daily rate, paid on leaving' },
      ]} />
      <div class="mt-24"><${PO.Tabs} value=${tab} onChange=${setTab} tabs=${[['requests', 'Requests', pending.length], ['calendar', 'Who’s off'], ['balances', 'Balances'], ['policies', 'Policies'], ['holidays', P.id === 'uk' ? 'Bank holidays' : 'Holidays']]} /></div>
      <div class="mt-16">
        ${tab === 'requests' ? html`<${Requests} ctx=${ctx} />` : null}
        ${tab === 'calendar' ? html`<${Calendar} ctx=${ctx} />` : null}
        ${tab === 'balances' ? html`<${Balances} ctx=${ctx} />` : null}
        ${tab === 'policies' ? html`<${Policies} ctx=${ctx} />` : null}
        ${tab === 'holidays' ? html`<${Holidays} ctx=${ctx} />` : null}
      </div>
      <${RequestDrawer} ctx=${ctx} r=${view} onClose=${() => setView(null)} />
      <${NewRequest} ctx=${ctx} open=${newOpen} onClose=${() => { setNewOpen(false); if (query.new) PO.go('leave'); }} />`;
  }

  const TYPE_VAR = { blue: 'var(--blue-solid)', green: 'var(--green-solid)', teal: 'var(--teal)', amber: 'var(--amber-solid)', rose: 'var(--rose)', red: 'var(--red-solid)', slate: 'var(--text-3)', violet: 'var(--violet)' };
  const typeVar = (k) => TYPE_VAR[(PO.leaveType(k) || {}).color] || 'var(--text-3)';
  const TypeTag = ({ P, type, bare }) => { const t = PO.leaveType(type) || { short: type, color: 'slate', name: type }; return html`<span class=${'lv-type ' + (bare ? 'bare' : '')} style=${`--c:${typeVar(type)}`} title=${t.name}><i></i>${t.name}</span>`; };

  /* ---------- Requests ---------- */
  function Requests({ ctx }) {
    const { P, rows, decide, fmtRange, setView } = ctx;
    const [seg, setSeg] = useState('pending');
    const today = PO.TODAY;
    const list = rows.filter((r) => seg === 'all' || (seg === 'pending' && r.st === 'Pending') || (seg === 'upcoming' && r.st === 'Approved' && r.to >= today) || (seg === 'past' && r.to < today));
    const sorted = list.slice().sort((a, b) => (a.st === 'Pending' ? 0 : 1) - (b.st === 'Pending' ? 0 : 1) || (seg === 'upcoming' ? a.from.localeCompare(b.from) : b.from.localeCompare(a.from)));
    const nm = (r) => (r.person ? r.person.name : r.whoName);
    return html`<${PO.DataTable} key=${seg} toolbar=${html`<${PO.Segmented} value=${seg} onChange=${setSeg} options=${[['pending', `Pending (${rows.filter((r) => r.st === 'Pending').length})`], ['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']]} />`} rows=${sorted} exportName=${'leave-requests-' + seg} pageSize=${12} onRow=${(r) => setView(r)}
        selectable bulk=${(ids, clear) => html`<${PO.Button} size="sm" kind="primary" icon="Check" onClick=${() => { const sel = sorted.filter((r) => ids.includes(r.id) && r.st === 'Pending'); sel.forEach((r) => decide(r, 'approved')); clear(); }}>Approve selected</${PO.Button}>`}
        search=${(r) => nm(r) + ' ' + r.reason + ' ' + r.id}
        searchPlaceholder="Search name, reason or ID"
        filters=${[{ key: 'type', label: 'Type', options: P.leaveTypes.map((t) => [t.key, t.name]), test: (r, v) => r.type === v }, { key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (r, v) => r.person && r.person.site === v }, { key: 'st', label: 'Status', options: ['Pending', 'Approved', 'Rejected'], test: (r, v) => r.st === v }]}
        empty=${{ title: seg === 'pending' ? 'No pending requests' : 'Nothing here', text: seg === 'pending' ? 'You’re all caught up. New requests from the employee portal, email and the HR desk land here.' : 'Try another filter.' }}
        columns=${[
          { key: 'who', label: 'Employee', sort: (r) => nm(r), csv: (r) => nm(r), render: (r) => r.person ? html`<${PO.Who} p=${r.person} sub=${PO.site(r.person.site).name} />` : html`<${PO.Who} name=${r.whoName} sub="Contract staff" link=${false} />` },
          { key: 'type', label: 'Type', sort: (r) => r.type, csv: (r) => (PO.leaveType(r.type) || {}).name, render: (r) => html`<${TypeTag} P=${P} type=${r.type} />` },
          { key: 'from', label: 'Dates', sort: (r) => r.from, csv: (r) => `${r.from} to ${r.to}`, render: (r) => html`<div><span class="tnum">${fmtRange(r)}</span><div class="faint t-xs">${r.from <= PO.TODAY && r.to >= PO.TODAY ? 'Today' : PO.rel(r.from)}</div></div>` },
          { key: 'd', label: 'Duration', align: 'r', sort: (r) => r.hours || r.days, csv: (r) => (r.hours ? r.hours + ' h' : r.days), render: (r) => html`<span class="tnum">${r.hours ? r.hours + ' h' : PO.plural(r.days, 'day')}</span>` },
          { key: 'reason', label: 'Reason', sort: false, csv: (r) => r.reason, render: (r) => html`<span class="muted ellipsis" style="display:block;max-width:200px">${r.reason}</span>` },
          { key: 'ch', label: 'Via', sort: (r) => r.channel, csv: (r) => r.channel, render: (r) => html`<span class="faint t-sm" title=${chOf(r.channel)[1]}>${r.channel}</span>` },
          { key: 'st', label: 'Status', sort: (r) => r.st, csv: (r) => r.st, render: (r) => html`<${PO.Status} s=${r.st} />` },
          { key: 'a', label: '', sort: false, csv: false, align: 'r', render: (r) => r.st === 'Pending' ? html`<div class="row" style="gap:4px;justify-content:flex-end" onClick=${(e) => e.stopPropagation()}><${PO.IconButton} icon="X" size="sm" bordered title="Decline" onClick=${() => decide(r, 'rejected')} /><${PO.Button} size="sm" icon="Check" onClick=${() => decide(r, 'approved')}>Approve</${PO.Button}></div>` : html`<${PO.IconButton} icon="ChevronRight" size="sm" title="Open" onClick=${() => setView(r)} />` },
        ]} />`;
  }

  /* overlap + policy checks shared by the request drawer and the new-request drawer */
  function checks(P, rows, req) {
    const p = req.who ? P.byId[req.who] : null;
    const t = PO.leaveType(req.type);
    const out = [];
    if (!t) return out;
    const bal = p && p.leave[req.type] ? p.leave[req.type] : null;
    const units = t.unit === 'hours' ? (req.hours || req.days * 8) : req.days;
    if (bal && bal.balance != null) {
      const after = bal.balance - (req.status === 'Pending' || req.isNew ? units : 0) - (req.isNew ? bal.pending : 0);
      out.push({ tone: after < 0 ? 'bad' : after <= (t.unit === 'hours' ? 8 : 1) ? 'warn' : 'ok', icon: 'Wallet', t: `Balance after: ${PO.num(after, after % 1 ? 1 : 0)} ${t.unit}`, d: `${t.short} balance ${bal.balance} ${t.unit}${bal.pending ? `, ${bal.pending} pending` : ''}. ${after < 0 ? (P.id === 'in' ? 'The shortfall becomes loss of pay.' : 'The shortfall would be unpaid.') : ''}` });
    } else out.push({ tone: 'ok', icon: 'Wallet', t: t.quota == null ? `${t.name} has no balance` : 'No balance on file', d: t.accrual });
    if (p) {
      const mates = rows.filter((r) => r.who && r.who !== p.id && (r.st === 'Approved' || r.st === 'Pending') && r.from <= req.to && r.to >= req.from && P.byId[r.who] && P.byId[r.who].site === p.site);
      const siteN = P.people.filter((q) => q.site === p.site).length;
      out.push({ tone: mates.length >= 3 ? 'bad' : mates.length ? 'warn' : 'ok', icon: 'Users', t: mates.length ? `${PO.plural(mates.length, 'teammate')} off at ${PO.site(p.site).name}` : `No overlap at ${PO.site(p.site).name}`, d: mates.length ? mates.slice(0, 3).map((r) => `${P.byId[r.who].name} (${PO.date(r.from, { short: true })})`).join(', ') + `, ${Math.round(((mates.length + 1) / siteN) * 100)}% of the site` : `${siteN} people at this site; cover isn’t needed.` });
    }
    const need = noticeDays(P, req.type);
    const lead = Math.round((new Date(req.from) - new Date(req.applied || PO.TODAY)) / 864e5);
    out.push({ tone: need === 0 || lead >= need ? 'ok' : 'warn', icon: 'CalendarClock', t: need === 0 ? 'No notice needed' : lead >= need ? `Notice met: ${PO.plural(lead, 'day')} (needs ${need})` : `Short notice: ${PO.plural(Math.max(0, lead), 'day')} (policy says ${need})`, d: P.id === 'in' ? 'Leave policy, section 3.2' : P.id === 'us' ? 'Employee handbook, section 4.1' : 'Staff handbook, section 6' });
    const dc = dayCount(P, req.from, req.to);
    if (dc.hols.length) out.push({ tone: 'warn', icon: 'CalendarDays', t: `${dc.hols.map((h) => h.name).join(', ')} falls in this range`, d: P.id === 'in' && req.type === 'el' ? 'Sandwich rule: holidays between EL days are counted as leave.' : 'Holidays aren’t deducted from the balance.' });
    else if (P.id === 'in' && dc.offs && req.type === 'el') out.push({ tone: 'warn', icon: 'Layers', t: 'Sandwich rule applies', d: 'The weekly off between leave days is counted as EL.' });
    return out;
  }
  const Check = ({ c }) => html`<div class="lv-chk"><${PO.Icon} n=${c.tone === 'ok' ? 'CircleCheck' : c.tone === 'warn' ? 'TriangleAlert' : 'CircleX'} size=${16} style=${`color:var(--${c.tone === 'ok' ? 'green' : c.tone === 'warn' ? 'amber' : 'red'});flex:none;margin-top:1px`} /><div><b class="w-550">${c.t}</b><div class="t-sm muted">${c.d}</div></div></div>`;

  function RequestDrawer({ ctx, r, onClose }) {
    const { P, rows, decide, fmtRange } = ctx;
    if (!r) return html`<${PO.Drawer} open=${false} />`;
    const cur = rows.find((x) => x.id === r.id) || r;
    const p = cur.person;
    const t = PO.leaveType(cur.type) || {};
    const approver = P.byId[cur.approver];
    return html`<${PO.Drawer} open onClose=${onClose} title=${`${t.name || 'Leave'}, ${fmtRange(cur)}`} sub=${`${cur.id}, applied ${PO.date(cur.applied, { short: true })} via ${cur.channel}`}
      footer=${cur.st === 'Pending' ? html`<${PO.Button} kind="danger" onClick=${() => { decide(cur, 'rejected'); onClose(); }}>Decline</${PO.Button}><${PO.Button} kind="primary" icon="Check" onClick=${() => { decide(cur, 'approved'); onClose(); }}>Approve</${PO.Button}>` : html`${cur.st === 'Approved' && cur.from > PO.TODAY ? html`<${PO.Button} kind="ghost" onClick=${() => { decide(cur, 'cancelled'); onClose(); }}>Cancel leave</${PO.Button}>` : null}<${PO.Button} onClick=${onClose}>Close</${PO.Button}>`}>
      <div class="col gap-16">
        <div class="row" style="gap:12px">${p ? html`<${PO.Avatar} p=${p} size="lg" />` : html`<${PO.Avatar} name=${cur.whoName} size="lg" />`}<div class="grow"><b class="t-md w-600">${p ? p.name : cur.whoName}</b><div class="faint t-sm">${p ? `${p.title}, ${PO.site(p.site).name}, ${PO.shiftOf(p.shift).label} shift` : 'Contract staff'}</div></div><${PO.Status} s=${cur.st} /></div>
        <${PO.KV} items=${[['Type', html`<${TypeTag} P=${P} type=${cur.type} />`], ['Dates', `${PO.date(cur.from, { weekday: true })}${cur.to !== cur.from ? ' – ' + PO.date(cur.to, { weekday: true }) : ''}`], ['Duration', cur.hours ? `${cur.hours} hours` : PO.plural(cur.days, 'day')], ['Reason', cur.reason], ['Approver', approver ? `${approver.name}, ${approvalChain(P, cur.type)}` : approvalChain(P, cur.type)], ['Channel', html`<span class="row" style="gap:6px"><${PO.Icon} n=${CH[cur.channel][0]} size=${14} />${CH[cur.channel][1]}</span>`]]} />
        ${p ? html`<div class="col gap-8"><b class="t-sm w-600">Policy checks</b>${checks(P, rows, cur).map((c) => html`<${Check} c=${c} />`)}</div>` : null}
        ${p ? html`<div><b class="t-sm w-600">Balances</b><div class="grid g-3 mt-8">${P.leaveTypes.filter((x) => p.leave[x.key] && p.leave[x.key].balance != null).slice(0, 3).map((x) => html`<div class="card inset" style="padding:10px 12px"><div class="faint t-xs">${x.name}</div><b class="t-lg tnum">${p.leave[x.key].balance}</b> <span class="faint t-xs">of ${p.leave[x.key].quota} ${x.unit}</span></div>`)}</div></div>` : null}
        <${PO.Timeline} items=${[{ icon: chOf(cur.channel)[0], tone: '', title: `Requested via ${chOf(cur.channel)[1]}`, right: PO.date(cur.applied, { short: true }), sub: cur.channel === 'Email' ? `Email: “${cur.reason}”` : cur.reason }, { icon: 'ShieldCheck', tone: 'green', title: 'Policy checks ran automatically', sub: 'Balance, overlap and notice' }, cur.st === 'Pending' ? { icon: 'Hourglass', tone: 'amber', title: `Waiting for ${approver ? approver.first : 'approver'}`, sub: 'Reminder goes out after 24 h' } : { icon: cur.st === 'Approved' ? 'Check' : 'X', tone: cur.st === 'Approved' ? 'green' : 'red', title: `${cur.st} by ${approver ? approver.name : 'manager'}`, sub: `${p ? p.first : 'They'} got a message` }]} />
      </div>
    </${PO.Drawer}>`;
  }

  /* ---------- Who's off: a people × days timeline (default) and a month calendar ---------- */
  function Calendar({ ctx }) {
    const { P, rows, setView, scope } = ctx;
    const [m, setM] = useState(9);
    const [site, setSite] = useState('');
    const [type, setType] = useState('');
    const [day, setDay] = useState(null);
    const [mode, setMode] = PO.useCoState('leave.calView', ctx.query && ctx.query.view === 'month' ? 'month' : 'timeline');
    const vis = rows.filter((r) => (r.st === 'Approved' || r.st === 'Pending') && (!site || (r.person && r.person.site === site)) && (!type || r.type === type));
    const mm = String(m + 1).padStart(2, '0');
    const first = `2026-${mm}-01`;
    const last = PO.addDays(`2026-${String(m + 2).padStart(2, '0')}-01`.replace('2026-13', '2027-01'), -1);
    const dayRows = day ? vis.filter((r) => r.from <= day && r.to >= day) : [];
    const mon = PO.MONS[m];
    const monthCount = vis.filter((r) => r.to >= first && r.from <= last);
    const sites = P.sites.filter((s) => !scope || ctx.people.some((p) => p.site === s.id));
    const typesUsed = P.leaveTypes.filter((t) => monthCount.some((r) => r.type === t.key));
    return html`<div class="card" style="overflow:hidden">
        <div class="tbl-toolbar">
          <${PO.Segmented} value=${mode} onChange=${setMode} options=${[['timeline', 'Timeline'], ['month', 'Month']]} />
          <div class="row" style="gap:4px"><${PO.IconButton} icon="ChevronLeft" bordered title="Previous month" onClick=${() => { setM(Math.max(0, m - 1)); setDay(null); }} /><b class="w-600" style="width:96px;text-align:center">${mon} 2026</b><${PO.IconButton} icon="ChevronRight" bordered title="Next month" onClick=${() => { setM(Math.min(11, m + 1)); setDay(null); }} /></div>
          <${PO.Button} size="sm" kind="ghost" onClick=${() => setM(9)}>Today</${PO.Button}>
          <select class="select" style="width:auto;height:30px" value=${site} onChange=${(e) => setSite(e.target.value)}><option value="">Site: All</option>${sites.map((s) => html`<option value=${s.id}>${s.name}</option>`)}</select>
          <select class="select" style="width:auto;height:30px" value=${type} onChange=${(e) => setType(e.target.value)}><option value="">Type: All</option>${P.leaveTypes.map((t) => html`<option value=${t.key}>${t.name}</option>`)}</select>
          <span class="right faint t-sm">${PO.plural(monthCount.length, 'request')}, ${PO.plural(new Set(monthCount.map((r) => r.who || r.whoName)).size, 'person', 'people')} off in ${mon}</span>
        </div>
        ${mode === 'timeline' ? html`<${Timeline} P=${P} vis=${vis} first=${first} last=${last} setView=${setView} />` : html`<div class="grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:0">
          <div class="lv-mc" style="border-right:1px solid var(--border)"><${LeaveMonth} P=${P} m=${m} vis=${vis} day=${day} setDay=${setDay} setView=${setView} /></div>
          <div>
            <div class="card-h" style="border-bottom:1px solid var(--border);padding-bottom:12px">${day ? null : html`<${PO.Chip} icon="CalendarDays" accent="teal" />`}<h3>${day ? PO.date(day, { weekday: true }) : `${mon} at a glance`}</h3>${day ? html`<span class="sub">${PO.plural(dayRows.length, 'person', 'people')} off</span>` : null}<div class="right">${day ? html`<${PO.IconButton} icon="X" size="sm" title="Clear" onClick=${() => setDay(null)} />` : null}</div></div>
            ${day ? (dayRows.length || P.holidays.some((h) => h.date === day) ? html`${P.holidays.filter((h) => h.date === day).map((h) => html`<div class="list-item"><${PO.Chip} icon="CalendarHeart" accent="rose" /><b class="w-550 grow">${h.name}</b><span class="faint t-sm">Holiday</span></div>`)}${dayRows.map((r) => html`<div class="list-item clickable" onClick=${() => setView(r)}>${r.person ? html`<${PO.Avatar} p=${r.person} />` : html`<${PO.Avatar} name=${r.whoName} />`}<div class="grow" style="min-width:0"><b class="w-550">${r.person ? r.person.name : r.whoName}</b><div class="faint t-xs">${r.person ? PO.site(r.person.site).name : 'Contract staff'}</div></div><${TypeTag} P=${P} type=${r.type} /></div>`)}` : html`<${PO.Empty} icon="CalendarCheck2" title="Nobody off" text="Full attendance expected." />`)
              : html`<div style="padding:14px 16px" class="col gap-12"><${PO.KV} items=${[['Requests', monthCount.length], ['Days off booked', PO.num(monthCount.reduce((t, r) => t + r.days, 0))], ['Pending', monthCount.filter((r) => r.st === 'Pending').length], ['Holidays', P.holidays.filter((h) => h.date.slice(5, 7) === mm).map((h) => h.name).join(', ') || 'None']]} /><div class="faint t-xs">Select a day to see who is off.</div></div>`}
          </div></div>`}
        <div class="tbl-foot"><span class="lt-key">${(typesUsed.length ? typesUsed : P.leaveTypes.slice(0, 3)).map((t) => html`<span><i style=${`--c:${typeVar(t.key)}`}></i>${t.name}</span>`)}<span><i style="--c:var(--text-3);background:var(--surface);border:1.5px dashed var(--text-3)"></i>Pending</span><span><i style="--c:var(--rose);border-radius:3px"></i>${P.id === 'uk' ? 'Bank holiday' : 'Holiday'}</span></span><span class="right faint">Click a bar to open the request</span></div>
      </div>`;
  }

  function Timeline({ P, vis, first, last, setView }) {
    const days = []; for (let d = first; d <= last; d = PO.addDays(d, 1)) days.push(d);
    const n = days.length;
    const idx = (d) => Math.round((new Date(d) - new Date(first)) / 864e5);
    const hol = new Map(P.holidays.filter((h) => h.date >= first && h.date <= last).map((h) => [h.date, h.name]));
    const we = (d) => { const w = dow(d); return P.id === 'in' ? w === 0 : w === 0 || w === 6; };
    const inMonth = vis.filter((r) => r.to >= first && r.from <= last);
    const byP = {};
    inMonth.forEach((r) => { const k = r.who || r.whoName; (byP[k] = byP[k] || { p: r.person, name: r.person ? r.person.name : r.whoName, reqs: [] }).reqs.push(r); });
    const people = Object.values(byP).sort((a, b) => a.reqs.map((r) => r.from).sort()[0].localeCompare(b.reqs.map((r) => r.from).sort()[0]) || a.name.localeCompare(b.name));
    const todayI = PO.TODAY >= first && PO.TODAY <= last ? idx(PO.TODAY) : -1;
    const cols = (row) => days.map((d) => html`<span class=${`${we(d) ? 'we' : ''} ${hol.has(d) ? 'hol' : ''} ${row && d === PO.TODAY ? 'today' : ''}`} title=${hol.get(d) || ''}>${row ? html`${PO.DAYS ? PO.DAYS[dow(d)].slice(0, 1) : DOWS[dow(d)].slice(0, 1)}<b>${+d.slice(8)}</b>` : null}</span>`);
    const now = todayI >= 0 ? html`<i class="lt-now" style=${`left:${((todayI + 0.5) / n) * 100}%`}></i>` : null;
    const bar = (r) => {
      const a = Math.max(0, idx(r.from)), b = Math.min(n - 1, idx(r.to));
      const t = PO.leaveType(r.type) || {};
      const len = b - a + 1;
      return html`<span class=${'lt-bar ' + (r.st === 'Pending' ? 'pend' : '')} style=${`--c:${typeVar(r.type)};left:${(a / n) * 100}%;width:calc(${(len / n) * 100}% - 4px)`} title=${`${r.person ? r.person.name : r.whoName}: ${t.name}, ${r.from === r.to ? PO.date(r.from, { short: true }) : PO.date(r.from, { short: true }) + ' to ' + PO.date(r.to, { short: true })}${r.st === 'Pending' ? ', waiting for approval' : ''}`} onClick=${() => setView(r)}>${len >= 2 ? (r.hours ? `${t.short} ${r.hours} h` : `${t.short}, ${PO.plural(r.days, 'day')}`) : ''}</span>`;
    };
    const counts = days.map((d) => inMonth.filter((r) => r.from <= d && r.to >= d).length);
    return html`<div class="lt-wrap"><div class="lt" style=${`--n:${n}`}>
      <div class="lt-row h"><div class="lt-nm"><span class="t-sm w-550" style="color:var(--text-2)">${PO.plural(people.length, 'person', 'people')}</span></div><div class="lt-days">${cols(true)}</div></div>
      ${hol.size ? html`<div class="lt-row"><div class="lt-nm"><${PO.Chip} icon="CalendarHeart" accent="rose" /><div style="min-width:0"><b>${P.id === 'uk' ? 'Bank holidays' : 'Holidays'}</b><small>Everyone off unless rostered</small></div></div><div class="lt-days">${cols(false)}${[...hol].map(([d, nm]) => html`<span class="lt-bar hol" style=${`left:${(idx(d) / n) * 100}%;width:calc(${100 / n}% - 4px)`} title=${nm}></span><span class="lt-hl" style=${`left:calc(${((idx(d) + 1) / n) * 100}% + 4px)`}>${nm}</span>`)}${now}</div></div>` : null}
      ${people.length ? people.map((x) => html`<div class="lt-row"><div class="lt-nm">${x.p ? html`<${PO.Avatar} p=${x.p} />` : html`<${PO.Avatar} name=${x.name} />`}<div style="min-width:0">${x.p ? html`<a href=${PO.href('people/' + x.p.id)}><b>${x.name}</b></a>` : html`<b>${x.name}</b>`}<small>${x.p ? `${x.p.post || x.p.title}, ${PO.site(x.p.site).name}` : 'Contract staff'}</small></div></div><div class="lt-days">${cols(false)}${x.reqs.map(bar)}${now}</div></div>`)
        : html`<${PO.Empty} icon="Palmtree" title="Nobody off this month" text="Approved and pending requests show here as bars." />`}
      <div class="lt-row f"><div class="lt-nm"><span class="t-sm w-550" style="color:var(--text-2)">Off that day</span></div><div class="lt-days" style="min-height:32px">${counts.map((c) => html`<span class=${'lt-cnt ' + (c >= 3 ? 'hi' : '')}>${c || ''}</span>`)}</div></div>
    </div></div>`;
  }

  function LeaveMonth({ P, m, vis, day, setDay, setView }) {
    const first = new Date(Date.UTC(2026, m, 1));
    const start = new Date(first); start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
    const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setUTCDate(start.getUTCDate() + i); return d.toISOString().slice(0, 10); });
    const hol = new Map(P.holidays.map((h) => [h.date, h.name]));
    const max = 3;
    return html`<div class="cal" style="border-top:0;border-left:0">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => html`<div class="cal-h">${d}</div>`)}${days.map((d) => {
      const ev = vis.filter((r) => r.from <= d && r.to >= d);
      const h = hol.get(d);
      return html`<div class=${`cal-d ${+d.slice(5, 7) - 1 !== m ? 'out' : ''} ${d === PO.TODAY ? 'today' : ''} ${h ? 'hol' : ''}`} style=${`cursor:pointer;${d === day ? 'box-shadow:inset 0 0 0 2px var(--brand)' : ''}`} onClick=${() => setDay(d)}><span class="dn">${+d.slice(8)}</span>
        ${h ? html`<span class="lv-chip holc" title=${h}><span>${h}</span></span>` : null}
        ${ev.slice(0, h ? max - 1 : max).map((r) => html`<span class=${'lv-chip ' + (r.st === 'Pending' ? 'pend' : '')} style=${`--c:${typeVar(r.type)}`} title=${`${r.person ? r.person.name : r.whoName}: ${(PO.leaveType(r.type) || {}).name}${r.st === 'Pending' ? ', pending' : ''}`} onClick=${(e) => { e.stopPropagation(); setView(r); }}>${r.person ? html`<${PO.Avatar} p=${r.person} size="xs" />` : html`<${PO.Avatar} name=${r.whoName} size="xs" />`}<span>${r.person ? r.person.first : r.whoName.split(' ')[0]}</span></span>`)}
        ${ev.length > (h ? max - 1 : max) ? html`<span class="faint t-xs">+${ev.length - (h ? max - 1 : max)} more</span>` : null}</div>`;
    })}</div>`;
  }

  /* ---------- Balances ---------- */
  function Balances({ ctx }) {
    const { P, people, adj, setAdj } = ctx;
    const [edit, setEdit] = useState(null);
    const types = P.leaveTypes.filter((t) => t.quota != null);
    const bal = (p, k) => { const b = p.leave[k]; if (!b || b.balance == null) return null; return { ...b, balance: b.balance + ((adj[p.id] || {})[k] || 0) }; };
    const bk = balKey(P);
    const enc = P.id === 'in' ? 'Encash EL' : P.id === 'us' ? 'Pay out PTO' : 'Pay in lieu';
    return html`<${PO.DataTable} rows=${people} exportName="leave-balances" pageSize=${15} compact onRow=${(p) => setEdit({ p, type: bk, delta: 0, reason: '' })}
        search=${(p) => p.name + ' ' + p.id} filters=${[{ key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (p, v) => p.site === v }, { key: 'dept', label: 'Department', options: [...new Set(people.map((p) => p.dept))], test: (p, v) => p.dept === v }, { key: 'low', label: 'Balance', options: [['low', `Low ${PO.leaveType(bk).short}`], ['high', `High ${PO.leaveType(bk).short} (liability)`]], test: (p, v) => { const b = bal(p, bk); if (!b) return false; const f = b.balance / (b.quota || 1); return v === 'low' ? f <= 0.25 : f >= 0.8; } }]}
        columns=${[
          { key: 'n', label: 'Employee', sort: (p) => p.name, csv: (p) => p.name, render: (p) => html`<${PO.Who} p=${p} size="sm" sub=${`${PO.site(p.site).name}, joined ${PO.date(p.joinedIso, { short: true })}`} />` },
          ...types.map((t) => ({ key: t.key, label: `${t.short} (${t.unit === 'hours' ? 'h' : 'd'})`, sort: (p) => (bal(p, t.key) || { balance: -1 }).balance, csv: (p) => (bal(p, t.key) || {}).balance, render: (p) => { const b = bal(p, t.key); if (!b) return html`<span class="faint">—</span>`; const f = b.quota ? b.balance / b.quota : 0; return html`<div class="lv-bal"><span class="tnum"><b>${b.balance}</b><span class="faint"> / ${b.quota}</span>${b.pending ? html` <span class="t-xs" style="color:var(--amber)">−${b.pending} pending</span>` : null}${(adj[p.id] || {})[t.key] ? html` <span class="t-xs faint">adjusted</span>` : null}</span><div class=${'prog ' + (f <= 0.2 ? 'red' : '')}><i style=${`width:${Math.max(0, Math.min(100, f * 100))}%`}></i></div></div>`; } })),
          { key: 'taken', label: 'Taken YTD', align: 'r', sort: (p) => types.reduce((s, t) => s + ((p.leave[t.key] || {}).taken || 0), 0), csv: (p) => types.reduce((s, t) => s + ((p.leave[t.key] || {}).taken || 0), 0), render: (p) => html`<span class="tnum">${types.reduce((s, t) => s + ((p.leave[t.key] || {}).taken || 0), 0)}</span>` },
          { key: 'a', label: '', sort: false, csv: false, align: 'r', render: (p) => html`<${PO.Button} size="sm" onClick=${(e) => { e.stopPropagation(); setEdit({ p, type: bk, delta: 0, reason: '' }); }}>Adjust</${PO.Button}>` },
        ]} />
      <${PO.Drawer} open=${!!edit} onClose=${() => setEdit(null)} title=${edit ? `Adjust balance, ${edit.p.name}` : ''} sub=${edit ? `${edit.p.id}, ${PO.site(edit.p.site).name}` : ''}
        footer=${edit ? html`<${PO.Button} onClick=${() => setEdit(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" disabled=${!edit.delta || !edit.reason} onClick=${() => { const cur = adj[edit.p.id] || {}; const prev = adj; setAdj({ ...adj, [edit.p.id]: { ...cur, [edit.type]: (cur[edit.type] || 0) + edit.delta } }); PO.toast(`${edit.p.first}: ${edit.delta > 0 ? '+' : ''}${edit.delta} ${PO.leaveType(edit.type).unit} ${PO.leaveType(edit.type).short}, ${edit.reason}`, { action: { label: 'Undo', run: () => setAdj(prev) } }); setEdit(null); }}>Save adjustment</${PO.Button}>` : null}>
        ${edit ? (() => { const t = PO.leaveType(edit.type); const b = bal(edit.p, edit.type); const rate = dailyRate(P, edit.p); const encUnits = b ? Math.max(0, P.id === 'in' ? b.balance - 15 : b.balance) : 0; const encAmt = (t.unit === 'hours' ? encUnits / 8 : encUnits) * rate; return html`<div class="col gap-16">
          <div class="grid g-3">${types.map((x) => { const bb = bal(edit.p, x.key); return html`<button class="card" style=${`padding:10px 12px;text-align:left;cursor:pointer;${x.key === edit.type ? 'border-color:var(--brand);background:var(--brand-soft)' : ''}`} onClick=${() => setEdit({ ...edit, type: x.key })}><div class="faint t-xs">${x.name}</div><b class="t-lg tnum">${bb ? bb.balance : '—'}</b> <span class="faint t-xs">${x.unit}</span></button>`; })}</div>
          <${PO.Field} label=${`Change ${t.name.toLowerCase()} by (${t.unit})`}><div class="row" style="gap:6px">${(t.unit === 'hours' ? [-8, -4, 4, 8] : [-1, -0.5, 0.5, 1, 2]).map((v) => html`<${PO.Button} size="sm" kind=${edit.delta === v ? 'primary' : ''} onClick=${() => setEdit({ ...edit, delta: v })}>${v > 0 ? '+' : ''}${v}</${PO.Button}>`)}<input class="input" type="number" step=${t.unit === 'hours' ? 1 : 0.5} style="width:90px" value=${edit.delta} onInput=${(e) => setEdit({ ...edit, delta: +e.target.value })} /></div></${PO.Field}>
          <${PO.Field} label="Reason" hint="Recorded in the audit log and shown on the employee’s leave statement."><select class="select" value=${edit.reason} onChange=${(e) => setEdit({ ...edit, reason: e.target.value })}><option value="">Choose a reason</option>${['Opening balance correction', 'Comp-off for working a holiday', 'Carry forward from 2025', 'Manager discretion', 'Data import fix', 'Leave taken offline (paper form)'].map((o) => html`<option>${o}</option>`)}</select></${PO.Field}>
          ${b ? html`<div class="card inset" style="padding:12px 14px"><b class="w-600">New balance: ${b.balance + (edit.delta || 0)} ${t.unit}</b><div class="muted t-sm">Was ${b.balance}. Quota is ${b.quota} a year, ${t.accrual.toLowerCase()}.</div></div>` : null}
          <div class="card inset" style="padding:14px"><div class="row"><div class="grow"><b class="w-600">${enc}</b><div class="faint t-sm">${P.id === 'in' ? `EL above the 15-day minimum is encashable at basic ÷ 26 (${PO.money(Math.round(rate))}/day). Taxable; paid with the next salary.` : P.id === 'us' ? `PTO pays out at ${PO.money(rate / 8)}/h. Texas doesn’t require it, your handbook allows up to 40 h a year.` : 'Holiday can only be paid instead of taken when someone leaves (Working Time Regulations).'}</div></div><div style="text-align:right"><div class="t-lg w-600 tnum">${PO.money(Math.round(encAmt))}</div><div class="faint t-xs">${encUnits} ${t.unit}</div></div></div>
            <div class="row mt-12"><${PO.Button} size="sm" icon="Banknote" disabled=${!encUnits || P.id === 'uk'} onClick=${() => { PO.toast(`${enc}: ${PO.money(Math.round(encAmt))} for ${edit.p.first} added to ${P.id === 'in' ? 'October payroll' : 'the next pay run'}`, { icon: 'Banknote' }); const cur = adj[edit.p.id] || {}; setAdj({ ...adj, [edit.p.id]: { ...cur, [edit.type]: (cur[edit.type] || 0) - encUnits } }); setEdit(null); }}>${enc}</${PO.Button}></div></div>
        </div>`; })() : null}
      </${PO.Drawer}>`;
  }

  /* ---------- Policies ---------- */
  function Policies({ ctx }) {
    const { P } = ctx;
    const [pol, setPol] = PO.useCoState('leave.policies', {});
    const [edit, setEdit] = useState(null);
    const [cur, setCur] = useState(P.leaveTypes[0].key);
    const IN = P.id === 'in';
    const base = (t) => ({
      quota: t.quota == null ? 'No fixed quota' : `${t.quota} ${t.unit} a year`,
      accrual: t.accrual, carry: t.carry,
      notice: noticeDays(P, t.key) ? `${PO.plural(noticeDays(P, t.key), 'day')} before` : 'Same day (inform before shift)',
      chain: approvalChain(P, t.key),
      applies: t.key === 'el' ? 'After 240 days worked (pro rata in year one)' : t.key === 'co' ? 'Anyone who works a holiday or weekly off' : t.key === 'jury' ? 'All employees with a summons' : t.key === 'comp' ? 'Death of a close family member' : t.key === 'sick' && P.id === 'uk' ? 'Everyone; SSP from day 4 if earning £125+/week' : 'All employees, including contract staff',
      sandwich: IN ? (t.key === 'el' ? 'Applies: weekly offs and holidays between EL days count' : 'Does not apply') : null,
      proof: t.key === 'sl' ? 'Medical certificate for more than 2 days' : t.key === 'sick' ? (P.id === 'uk' ? 'Fit note after 7 calendar days' : 'Doctor’s note after 3 days') : t.key === 'jury' ? 'Copy of the summons' : 'None',
      half: t.unit === 'hours' ? 'Hourly' : t.key === 'lop' || t.key === 'unpaid' ? 'Yes' : 'Yes, half days allowed',
    });
    const val = (t) => ({ ...base(t), ...(pol[t.key] || {}) });
    const fields = [['quota', 'Quota'], ['accrual', 'Accrual'], ['carry', 'Carry forward'], ['notice', 'Notice'], ['chain', 'Approval'], ['applies', 'Who gets it'], ...(IN ? [['sandwich', 'Sandwich rule']] : []), ['proof', 'Proof needed'], ['half', 'Half day']];
    const t = P.leaveTypes.find((x) => x.key === cur) || P.leaveTypes[0];
    const v = val(t);
    const used = (k) => P.people.filter((p) => p.leave[k] && (p.leave[k].taken || 0) > 0).length;
    return html`<div class="grid g-main-l" style="align-items:start">
        <div class="card" style="overflow:hidden">${P.leaveTypes.map((x) => html`<button class=${'lv-pt ' + (x.key === t.key ? 'on' : '')} onClick=${() => setCur(x.key)}><span class="lv-type bare" style=${`--c:${typeVar(x.key)}`}><i></i></span><span class="grow" style="min-width:0"><b class="w-550 ellipsis" style="display:block">${x.name}</b><span class="faint t-xs">${x.quota == null ? 'No fixed quota' : `${x.quota} ${x.unit} a year`}</span></span>${pol[x.key] ? html`<span class="faint t-xs">Edited</span>` : null}</button>`)}</div>
        <div class="col" style="gap:16px;min-width:0">
          <${PO.Card} icon="BookOpen" accent="green" title=${t.name} sub=${`${t.quota == null ? 'Unpaid or statutory' : 'Paid'}, used by ${PO.plural(used(t.key), 'person', 'people')} this year`} actions=${html`<${PO.Button} size="sm" icon="PencilLine" onClick=${() => setEdit({ t, v: { ...v } })}>Edit</${PO.Button}>`}>
            <${PO.KV} items=${fields.map(([k, l]) => [l, v[k]])} />
          </${PO.Card}>
          <p class="faint t-sm" style="max-width:760px"><b class="w-550" style="color:var(--text-2)">${IN ? 'Statutory minimums: Shops & Establishments Act (Maharashtra) and the OSH Code.' : P.id === 'us' ? 'No federal paid-leave mandate, and Texas has none either.' : 'Statutory minimum is 5.6 weeks a year (28 days for a 5-day week).'}</b> ${IN ? '8 casual, 8 sick and 18 earned days meet the Maharashtra minimums. EL accrues at 1 day for every 20 days worked and is encashable on exit.' : P.id === 'us' ? 'Your PTO and sick time are company policy. Austin’s paid sick leave ordinance is not enforced, so the handbook rules apply.' : 'Holiday is pro rata for part-timers and includes bank holidays. Irregular-hours staff accrue 12.07% of hours worked.'}</p>
        </div>
      </div>
      <${PO.Drawer} open=${!!edit} onClose=${() => setEdit(null)} title=${edit ? `Edit ${edit.t.name}` : ''} sub="Changes apply from 1 November and are versioned" footer=${edit ? html`<${PO.Button} onClick=${() => setEdit(null)}>Cancel</${PO.Button}><${PO.Button} kind="primary" onClick=${() => { setPol({ ...pol, [edit.t.key]: edit.v }); PO.toast(`${edit.t.name} policy saved. ${PO.plural(P.people.length, 'person', 'people')} will be notified.`); setEdit(null); }}>Save policy</${PO.Button}>` : null}>
        ${edit ? html`<div class="col gap-12">${fields.map(([k, l]) => html`<${PO.Field} label=${l}><input class="input" value=${edit.v[k]} onInput=${(e) => setEdit({ ...edit, v: { ...edit.v, [k]: e.target.value } })} /></${PO.Field}>`)}
          <${PO.Switch} on=${edit.v.negative === true} onChange=${(x) => setEdit({ ...edit, v: { ...edit.v, negative: x } })} label="Allow negative balance (up to 2 days)" />
          <${PO.Switch} on=${edit.v.wa !== false} onChange=${(x) => setEdit({ ...edit, v: { ...edit.v, wa: x } })} label="Accept requests emailed to the HR inbox" /></div>` : null}
      </${PO.Drawer}>`;
  }

  /* ---------- Holidays ---------- */
  function Holidays({ ctx }) {
    const { P } = ctx;
    const [opt, setOpt] = PO.useCoState('leave.optional', {});
    const optional = P.id === 'in' ? [['2026-08-28', 'Raksha Bandhan'], ['2026-03-21', 'Eid-ul-Fitr'], ['2026-05-27', 'Bakri Eid'], ['2026-11-11', 'Bhai Dooj'], ['2026-11-24', 'Guru Nanak Jayanti']] : P.id === 'us' ? [['2026-01-19', 'Martin Luther King Jr. Day'], ['2026-06-19', 'Juneteenth'], ['2026-11-11', 'Veterans Day'], ['2026-11-27', 'Day after Thanksgiving']] : [['2026-12-24', 'Christmas Eve (afternoon)'], ['2026-12-31', 'New Year’s Eve (afternoon)'], ['2026-03-17', 'St Patrick’s Day']];
    const pick = P.id === 'in' ? 2 : 1;
    const chosen = Object.values(opt).filter(Boolean).length;
    const siteRule = (s) => { const always = { in: ['vmn', 'hjw', 'khd', 'mgp'], us: ['sl', 'e6', 'dm'], uk: ['ma', 'sr'] }[P.id]; return always.includes(s.id); };
    const up = P.holidays.filter((h) => h.upcoming);
    const [showPast, setShowPast] = useState(false);
    const list = [...up, ...(showPast ? P.holidays.filter((h) => !h.upcoming).reverse() : [])];
    const inDays = up[0] ? Math.round((new Date(up[0].date) - new Date(PO.TODAY)) / 864e5) : 0;
    return html`<div class="grid g-main">
      <div class="col gap-16">
        <${PO.Card} icon="CalendarHeart" accent="rose" title=${up[0] ? `Next: ${up[0].name}, ${PO.date(up[0].date, { weekday: true, noYear: true })}` : `${P.id === 'uk' ? 'Bank holidays' : 'Holidays'} 2026`} sub=${`${P.holidays.length} days, ${up.length} still to come`} flush actions=${html`<${PO.Button} size="sm" kind="ghost" icon="CalendarPlus" onClick=${() => PO.fakeDownload('Holiday calendar (.ics)')}>Add to calendar</${PO.Button}>`}>
          ${list.map((h) => html`<div class=${'lv-hol ' + (h.upcoming ? '' : 'past')}><span class="dt"><small>${PO.MONS[+h.date.slice(5, 7) - 1]}</small><b>${+h.date.slice(8)}</b></span><div class="grow"><b class="w-550">${h.name}</b><div class="faint t-xs">${DOWS[dow(h.date)]}${h.date === up[0]?.date ? ', next holiday' : ''}</div></div>${h.upcoming ? html`<span class=${'t-sm ' + (h.date === up[0]?.date ? '' : 'faint')} style=${h.date === up[0]?.date ? 'color:var(--signal);font-weight:550' : ''}>${PO.rel(h.date)}</span>` : html`<span class="faint t-sm">Past</span>`}</div>`)}
          <button class="lv-hol" style="width:100%;background:none;border:0;cursor:pointer;color:var(--brand-text);font-weight:550" onClick=${() => setShowPast(!showPast)}><${PO.Icon} n=${showPast ? 'ChevronUp' : 'ChevronDown'} size=${14} />${showPast ? 'Hide past holidays' : `Show ${P.holidays.length - up.length} earlier this year`}</button>
        </${PO.Card}>
        <${PO.Card} icon="MapPin" accent="blue" title="Per-site calendars" sub="Client sites that stay open on holidays" flush>
          <div style="overflow-x:auto"><div class="lv-sitecal" style=${`--n:${up.length}`}><div class="h l">Site</div>${up.map((h) => html`<div class="h" title=${h.name}>${PO.date(h.date, { short: true })}</div>`)}
            ${P.sites.map((s) => html`<div class="l"><b class="w-550">${s.name}</b><div class="faint t-xs">${siteRule(s) ? 'Open 365 days' : 'Closed on holidays'}</div></div>${up.map(() => siteRule(s) ? html`<div class="w-550">${P.id === 'in' ? '2× or CO' : P.id === 'us' ? '1.5×' : 'Premium'}</div>` : html`<div class="faint">Closed</div>`)}`)}
          </div></div>
          <div class="tbl-foot">${P.id === 'in' ? 'Guards who work a national or festival holiday get double wages or a compensatory off within 60 days (Maharashtra Shops & Establishments Act).' : P.id === 'us' ? 'Cafés open on holidays pay 1.5× (company policy); the Thanksgiving and Christmas 2× rule is in Rules.' : 'Airport and NHS sites run every day; staff get a bank holiday premium or a day in lieu.'}</div>
        </${PO.Card}>
      </div>
      <div class="col gap-16">
        <${PO.Card} icon="CalendarCheck" accent="teal" title=${P.id === 'in' ? 'Restricted holidays' : P.id === 'us' ? 'Floating holiday' : 'Optional half days'} sub=${`Each person picks ${pick}${chosen ? `, ${chosen} pre-selected` : ''}`} flush>
          <div>${optional.map(([d, n]) => html`<label class="list-item check" style="cursor:pointer"><input type="checkbox" checked=${!!opt[d]} onChange=${() => { if (!opt[d] && chosen >= pick) { PO.toast(`Only ${pick} can be picked. Untick one first.`); return; } setOpt({ ...opt, [d]: !opt[d] }); }} /><div class="grow"><b class="w-550">${n}</b><div class="faint t-xs">${PO.date(d, { weekday: true })}</div></div>${d < PO.TODAY ? html`<span class="faint t-xs">Past</span>` : null}</label>`)}</div>
          <div class="faint t-xs" style="padding:10px 16px;border-top:1px solid var(--border)">${P.id === 'in' ? 'Staff choose their own in the employee portal; supervisors see them on the roster.' : 'Staff can swap the default for another listed day in the employee portal.'}</div>
        </${PO.Card}>

      </div></div>`;
  }

  /* ---------- New request ---------- */
  function NewRequest({ ctx, open, onClose }) {
    const { P, W, rows, people, added, setAdded } = ctx;
    const def = P.hero && people.some((p) => p.id === P.hero.id) ? P.hero.id : people[0].id;
    const firstType = P.leaveTypes[0].key;
    const [f, setF] = useState({ who: def, type: firstType, from: '2026-10-12', to: '2026-10-12', half: false, hours: 8, reason: '' });
    const [q, setQ] = useState('');
    if (!open) return html`<${PO.Drawer} open=${false} />`;
    const p = P.byId[f.who];
    const t = PO.leaveType(f.type);
    const dc = dayCount(P, f.from, f.to, f.half);
    const days = dc.days + (P.id === 'in' && f.type === 'el' ? dc.offs + dc.hols.length : 0);
    const req = { who: f.who, type: f.type, from: f.from, to: f.to < f.from ? f.from : f.to, days, hours: t.unit === 'hours' ? (f.from === f.to ? f.hours : days * 8) : null, applied: PO.TODAY, status: 'Pending', isNew: true };
    const cks = checks(P, rows, req);
    const bad = cks.some((c) => c.tone === 'bad' && /Balance/.test(c.t)) && t.key !== 'lop' && t.key !== 'unpaid';
    const opts = people.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase())).slice(0, 60);
    const submit = () => {
      const id = 'LV-' + (2800 + added.length);
      setAdded([{ id, who: f.who, type: f.type, from: req.from, to: req.to, days, hours: req.hours, reason: f.reason || 'Personal', status: 'Pending', applied: PO.TODAY, approver: p.manager || P.topId, channel: 'HR desk' }, ...added]);
      PO.toast(`${id} sent to ${P.byId[p.manager || P.topId].name} for approval`, { icon: 'Send' });
      onClose();
    };
    return html`<${PO.Drawer} open onClose=${onClose} size="lg" title=${`New ${W.one} request`} sub="Policy checks run as you type" footer=${html`<${PO.Button} onClick=${onClose}>Cancel</${PO.Button}><${PO.Button} kind="primary" icon="Send" disabled=${!days || bad} onClick=${submit}>Submit for approval</${PO.Button}>`}>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:20px">
        <div class="col gap-16">
          <${PO.Field} label="Employee"><div class="row" style="gap:8px"><input class="input" placeholder="Filter people" style="width:150px" value=${q} onInput=${(e) => setQ(e.target.value)} /><select class="select grow" value=${f.who} onChange=${(e) => setF({ ...f, who: e.target.value })}>${opts.some((x) => x.id === f.who) ? null : html`<option value=${f.who}>${p.name}</option>`}${opts.map((x) => html`<option value=${x.id}>${x.name}, ${PO.site(x.site).name}</option>`)}</select></div></${PO.Field}>
          <${PO.Field} label="Type"><div class="row wrap" style="gap:6px">${P.leaveTypes.map((x) => html`<${PO.Button} size="sm" kind=${f.type === x.key ? 'primary' : ''} onClick=${() => setF({ ...f, type: x.key })}>${x.name}</${PO.Button}>`)}</div></${PO.Field}>
          <div class="grid g-2"><${PO.Field} label="From"><input class="input" type="date" value=${f.from} onInput=${(e) => setF({ ...f, from: e.target.value, to: f.to < e.target.value ? e.target.value : f.to })} /></${PO.Field}><${PO.Field} label="To"><input class="input" type="date" value=${f.to} min=${f.from} onInput=${(e) => setF({ ...f, to: e.target.value })} /></${PO.Field}></div>
          ${t.unit === 'hours' ? (f.from === f.to ? html`<${PO.Field} label="Hours" hint="Partial days are fine, e.g. 4 h for an appointment."><div class="row" style="gap:6px">${[2, 4, 6, 8].map((h) => html`<${PO.Button} size="sm" kind=${f.hours === h ? 'primary' : ''} onClick=${() => setF({ ...f, hours: h })}>${h} h</${PO.Button}>`)}</div></${PO.Field}>` : null) : html`<${PO.Switch} on=${f.half} onChange=${(v) => setF({ ...f, half: v })} label="Half day (first or last day)" />`}
          <${PO.Field} label="Reason"><textarea class="textarea" rows="3" placeholder=${P.id === 'in' ? 'e.g. Native place visit for a family function' : 'e.g. Family visit'} value=${f.reason} onInput=${(e) => setF({ ...f, reason: e.target.value })}></textarea></${PO.Field}>
          <div class="card inset" style="padding:12px"><div class="row t-sm"><${PO.Icon} n="Info" size=${14} /><span>${t.name}: ${t.accrual}. ${t.carry}. Approver: ${P.byId[p.manager || P.topId].name}.</span></div></div>
        </div>
        <div class="col gap-12">
          <div class="card" style="padding:14px"><div class="faint t-xs">Requesting</div><div class="hero-num" style="font-size:28px">${req.hours ? req.hours + ' h' : PO.num(days, days % 1 ? 1 : 0) + (days === 1 ? ' day' : ' days')}</div><div class="faint t-sm">${PO.date(req.from, { weekday: true })}${req.to !== req.from ? ' – ' + PO.date(req.to, { weekday: true }) : ''}${dc.offs ? `, ${dc.offs} weekly off${dc.offs > 1 ? 's' : ''} ${P.id === 'in' && f.type === 'el' ? 'counted (sandwich)' : 'not counted'}` : ''}</div></div>
          ${cks.map((c) => html`<${Check} c=${c} />`)}
        </div>
      </div>
    </${PO.Drawer}>`;
  }

  PO.navCount('leave', (state, P) => {
    const d = (state.by[state.co] || {})['approvals.decided'] || {};
    const base = P.leaveRequests.filter((l) => l.status === 'Pending' && !d['leave:' + l.id]).length;
    const planted = P.approvals.filter((a) => /Leave|Time off|Holiday|Sickness/.test(a.kind) && !d[a.id]).length;
    const add = ((state.by[state.co] || {})['leave.added'] || []).filter((l) => !d['leave:' + l.id]).length;
    return base + planted + add;
  });
  PO.route('leave', LeavePage, { title: 'Leave & holidays' });
})();
