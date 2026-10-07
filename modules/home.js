/* People OS: Home (route `home`). The morning dashboard for HR admins and managers:
   today's shift band, KPIs, the planted "needs your attention" moments, payroll, live attendance,
   who's out, celebrations, announcements and an "Ask People OS" box. Managers see only their team. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;
  /* core/shell.js defines PO.navCount but loads after the modules; queue registrations until it arrives. */
  if (!PO.navCount && !Object.getOwnPropertyDescriptor(PO, 'navCount')) {
    const queue = []; let real = null;
    Object.defineProperty(PO, 'navCount', { configurable: true, get: () => real || ((...a) => queue.push(a)), set: (fn) => { real = fn; queue.splice(0).forEach((a) => fn(...a)); } });
  }

  document.head.insertAdjacentHTML('beforeend', `<style>
  .hm-task { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 16px; border-top: 1px solid var(--border); }
  .hm-task:first-child { border-top: none; }
  .hm-task .hm-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); }
  .hm-task .hm-dot { flex: none; display: block; } .hm-task .hm-dot.red { background: var(--red-solid); } .hm-task .hm-dot.amber { background: var(--amber-solid); } .hm-task .hm-dot.blue, .hm-task .hm-dot.brand { background: var(--brand); } .hm-task .hm-dot.green { background: var(--green-solid); }
  .hm-task b { font-weight: 550; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hm-task small { color: var(--text-3); font-size: 12px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
  .hm-task.done b { color: var(--text-3); font-weight: 500; }
  .hm-task .acts { display: flex; gap: 4px; align-items: center; }
  .hm-more { display: flex; align-items: center; gap: 6px; width: 100%; padding: 9px 16px; border: none; border-top: 1px solid var(--border); background: none; color: var(--text-2); font-size: 12px; font-weight: 550; cursor: pointer; text-align: left; }
  .hm-more:hover { color: var(--text); background: var(--hover); }
  .hm-figs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--border); margin: 14px -16px 0; }
  .hm-figs > div { padding: 10px 16px; border-left: 1px solid var(--border); } .hm-figs > div:first-child { border-left: none; }
  .hm-figs small { display: block; color: var(--text-3); font-size: 12px; }
  .hm-figs b { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .hm-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--border); min-width: 0; }
  .hm-row:first-child { border-top: none; }
  .hm-when { width: 64px; flex: none; color: var(--text-3); font-size: 12px; font-variant-numeric: tabular-nums; }
  .hm-sitebar { display: flex; height: 4px; border-radius: 2px; overflow: hidden; background: var(--surface-3); width: 72px; }
  .hm-sitebar i { display: block; height: 100%; }
  .hm-label { font-size: 12px; font-weight: 600; color: var(--text-2); margin: 2px 0 2px; }
  .hm-hero { display: grid; grid-template-columns: 208px minmax(0, 1fr); gap: 24px; padding: 18px 20px; align-items: center; }
  .hm-dial text { font-family: var(--num); font-size: 10px; fill: var(--text-3); }
  .hm-dial .big { font-size: 30px; font-weight: 600; fill: var(--text); }
  .hm-dial .small { font-family: var(--font); font-size: 10.5px; fill: var(--text-2); }
  .hm-hero h3 { font-size: 16px; font-weight: 600; }
  .hm-hero .lead { color: var(--text-2); margin-top: 2px; }
  .hm-lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
  .hm-lane { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; min-width: 0; }
  .hm-lane .t { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-2); font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hm-lane .t i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .hm-lane .n { font-family: var(--num); font-size: 22px; font-weight: 600; margin: 2px 0 6px; }
  .hm-faces { display: flex; align-items: center; min-height: 24px; } .hm-faces .av { box-shadow: 0 0 0 2px var(--surface); } .hm-faces .av + .av { margin-left: -6px; }
  .hm-faces small { margin-left: 8px; color: var(--text-3); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hm-board { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 10px; }
  .hm-task.compact { grid-template-columns: 26px minmax(0, 1fr) auto; align-items: start; }
  .hm-task.compact b, .hm-task.compact small { white-space: normal; }
  .hm-task.compact .acts { padding-top: 2px; }
  .hm-mate { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3px; padding: 12px 8px 10px; border: 1px solid var(--border); border-radius: 10px; min-width: 0; transition: border-color .12s; }
  .hm-mate:hover { border-color: var(--border-strong); }
  .hm-mate b { font-weight: 550; max-width: 100%; margin-top: 4px; }
  .hm-mate.absent { background: color-mix(in srgb, var(--red-soft) 55%, var(--surface)); } .hm-mate.late { background: color-mix(in srgb, var(--amber-soft) 55%, var(--surface)); }
  .hm-mate.off .av, .hm-mate.next .av { opacity: .75; }
  .hm-st { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-2); max-width: 100%; }
  .hm-st i { width: 7px; height: 7px; border-radius: 50%; flex: none; } .hm-st i.green { background: var(--green-solid); } .hm-st i.amber { background: var(--amber-solid); } .hm-st i.red { background: var(--red-solid); } .hm-st i.teal { background: #2f9488; } .hm-st i.blue { background: var(--blue-solid); } .hm-st i.slate { background: var(--text-3); }
  .hm-req { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--border); }
  .hm-req:first-child { border-top: none; }
  .hm-req-av { position: relative; flex: none; } .hm-req-ic { position: absolute; right: -6px; bottom: -4px; } .hm-req-ic .chip-ic { width: 20px; height: 20px; border-radius: 6px; box-shadow: 0 0 0 2px var(--surface); }
  </style>`);

  /* ---------- helpers ---------- */
  const teamOf = (P, id) => { const acc = new Set(); const walk = (m) => (P.byManager[m] || []).forEach((x) => { if (!acc.has(x)) { acc.add(x); walk(x); } }); walk(id); return acc; };
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const payIso = (C) => { const m = C.payBy.match(/(\d{1,2})/), mo = C.payBy.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/); return m && mo ? `2026-${String(MON[mo[1]] + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}` : PO.TODAY; };
  const durText = (min) => { const h = Math.floor(min / 60), m = min % 60; return h ? `${h} h ${m ? m + ' min' : ''}`.trim() : `${m} min`; };
  const runLabel = (P, h) => (P.id === 'in' ? h.label.slice(0, 3) : h.label.replace('*', '').split('–').pop().trim());
  const leaveWord = (P) => (P.id === 'us' ? 'PTO' : P.id === 'uk' ? 'holiday' : 'leave');

  /* ---------- today: a 24-hour shift dial with the people behind the numbers ---------- */
  function ShiftDial({ P, inNow, due }) {
    const R = 76, C0 = 104, now = P.company.nowMin;
    const pt = (min, r) => { const a = (min / 1440) * 2 * Math.PI - Math.PI / 2; return [C0 + r * Math.cos(a), C0 + r * Math.sin(a)]; };
    const arc = (a, b, r) => { const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r); const large = (b - a + 1440) % 1440 > 720 ? 1 : 0; return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
    const tone = (k) => (k === P.current ? 'var(--brand)' : k === P.next ? 'color-mix(in srgb, var(--brand) 35%, var(--surface-3))' : 'var(--border-strong)');
    const cur = PO.shiftOf(P.current);
    const [hx, hy] = pt(now, R + 9);
    return html`<svg class="hm-dial" viewBox="0 0 208 208" width="208" height="208" role="img" aria-label=${`${cur.label} shift: ${inNow} of ${due} on duty at ${P.hhmm(now)}`}>
      <circle cx=${C0} cy=${C0} r=${R} fill="none" stroke="var(--surface-3)" stroke-width="14" />
      ${P.shifts.map((s) => html`<path d=${arc(s.from + 6, (s.to || 1440) - 6, R)} fill="none" stroke=${tone(s.key)} stroke-width="14" stroke-linecap="butt" />`)}
      <path d=${arc(cur.from, now, R - 11)} fill="none" stroke="var(--signal)" stroke-width="3" stroke-linecap="round" />
      ${[0, 6, 12, 18].map((h) => { const [x, y] = pt(h * 60, R + 18); return html`<text x=${x} y=${y + 3.5} text-anchor="middle">${String(h).padStart(2, '0')}</text>`; })}
      <line x1=${C0} y1=${C0} x2=${hx} y2=${hy} stroke="var(--text)" stroke-width="2" stroke-linecap="round" opacity=".18" />
      <circle cx=${hx} cy=${hy} r="5" fill="var(--signal)" stroke="var(--surface)" stroke-width="2" />
      <circle cx=${C0} cy=${C0} r=${R - 22} fill="var(--surface)" />
      <text class="big" x=${C0} y=${C0 + 4} text-anchor="middle">${inNow}<tspan font-size="16" fill="var(--text-3)">/${due}</tspan></text>
      <text class="small" x=${C0} y=${C0 + 22} text-anchor="middle">on duty at ${P.hhmm(now)}</text>
    </svg>`;
  }
  function TodayHero({ P, live, team, mgr }) {
    const cur = PO.shiftOf(P.current), nxt = PO.shiftOf(P.next);
    const now = P.company.nowMin;
    const due = live.reduce((t, l) => t + l.due, 0), inNow = live.reduce((t, l) => t + (l.onDuty ?? l.in), 0);
    const curPeople = P.people.filter((p) => p.shift === P.current && (!team || team.has(p.id)));
    const late = curPeople.filter((p) => P.lateMap[p.id]).sort((a, b) => P.lateMap[b.id] - P.lateMap[a.id]);
    const absent = curPeople.filter((p) => P.absent.has(p.id));
    const nextCrew = P.people.filter((p) => p.shift === P.next && (!team || team.has(p.id)));
    const toNext = ((nxt.from - now) + 1440) % 1440;
    const elapsed = ((now - cur.from) + 1440) % 1440;
    const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim() : `${m} min`);
    const lane = (dot, title, n, ids, note, href) => html`<a class="hm-lane" href=${href}><div class="t"><i style=${`background:${dot}`}></i>${title}</div><div class="n">${n}</div><div class="hm-faces">${ids.slice(0, 5).map((p) => html`<${PO.Avatar} p=${p} size="sm" />`)}${ids.length > 5 ? html`<small>+${ids.length - 5}</small>` : null}${note ? html`<small>${note}</small>` : null}</div></a>`;
    return html`<div class="card"><div class="hm-hero">
      <${ShiftDial} P=${P} inNow=${inNow} due=${due} />
      <div style="min-width:0">
        <div class="row"><h3>${cur.label} shift, ${cur.time}</h3><span class="right row" style="gap:6px"><${PO.Button} size="sm" href=${PO.href('roster')}>Roster</${PO.Button}><${PO.Button} size="sm" href=${PO.href('live')}>Live board</${PO.Button}></span></div>
        <p class="lead">Started ${dur(elapsed)} ago. ${nxt.label} shift takes over in ${dur(toNext)}${mgr ? '' : `, across ${P.sites.length} sites`}.</p>
        <div class="hm-lanes">
          ${lane('var(--amber-solid)', late[0] ? `Late, up to ${P.lateMap[late[0].id]} min` : 'Late', late.length, late, late.length ? '' : 'Nobody', PO.href('live'))}
          ${lane('var(--red-solid)', 'Absent', absent.length, absent, absent.length ? '' : 'Nobody', PO.href('live'))}
          ${lane('var(--brand)', `${nxt.label} crew at ${P.hhmm(nxt.from)}`, nextCrew.length, nextCrew, '', PO.href('roster'))}
        </div>
      </div>
    </div></div>`;
  }

  /* ---------- manager: the team as faces with live status ---------- */
  function teamStatus(P, p) {
    const onLeave = P.leaveRequests.find((l) => l.who === p.id && l.status === 'Approved' && l.from <= PO.TODAY && l.to >= PO.TODAY);
    if (onLeave) return { k: 'leave', o: 3, tone: 'teal', t: (PO.leaveType(onLeave.type) || {}).name || 'On leave' };
    if (p.shift === P.current) {
      if (P.absent.has(p.id)) return { k: 'absent', o: 0, tone: 'red', t: 'Absent, no leave' };
      if (P.lateMap[p.id]) return { k: 'late', o: 1, tone: 'amber', t: `Late ${P.lateMap[p.id]} min` };
      return { k: 'on', o: 2, tone: 'green', t: `On duty, ${p.post || 'site'}` };
    }
    const sh = PO.shiftOf(p.shift);
    if (p.shift === P.next) return { k: 'next', o: 4, tone: 'blue', t: `Starts ${P.hhmm(sh.from)}` };
    return { k: 'off', o: 5, tone: 'slate', t: `${sh.label} shift done` };
  }
  function TeamBoard({ P, team }) {
    const [f, setF] = useState('all');
    const rows = useMemo(() => [...team].map(PO.person).filter(Boolean).map((p) => ({ p, s: teamStatus(P, p) })).sort((a, b) => a.s.o - b.s.o || a.p.name.localeCompare(b.p.name)), [P.id, team.size]);
    const count = (k) => rows.filter((r) => r.s.k === k).length;
    const shown = rows.filter((r) => f === 'all' || r.s.k === f || (f === 'issues' && (r.s.k === 'absent' || r.s.k === 'late')));
    return html`<div class="card">
      <div class="card-h"><${PO.Chip} icon="UsersRound" accent="blue" /><h3>Your team today</h3><span class="sub">${PO.plural(rows.length, 'person', 'people')}</span>
        <div class="right"><${PO.Segmented} value=${f} onChange=${setF} options=${[['all', 'Everyone'], ['issues', `Late or absent ${count('late') + count('absent')}`], ['on', `On duty ${count('on')}`], ['leave', `On leave ${count('leave')}`]]} /></div></div>
      <div class="card-b"><div class="hm-board">${shown.slice(0, 12).map(({ p, s }) => html`<a class=${'hm-mate ' + s.k} href=${PO.href('people/' + p.id)}><${PO.Avatar} p=${p} size="lg" /><b class="ellipsis">${p.name}</b><span class="hm-st"><i class=${s.tone}></i><span class="ellipsis">${s.t}</span></span></a>`)}</div>
        ${shown.length > 12 ? html`<a class="link t-sm" href=${PO.href('people')} style="display:inline-block;margin-top:10px">See all ${shown.length}</a>` : null}
        ${!shown.length ? html`<${PO.Empty} icon="UsersRound" title="Nobody in this view" text="Pick another filter to see the rest of your team." />` : null}</div>
    </div>`;
  }
  function TeamRequests({ P, items }) {
    const [decided, setDecided] = PO.useCoState('approvals.decided', {});
    const open = items.filter((it) => !decided[it.id]);
    const act = (it, v) => { setDecided({ ...decided, [it.id]: v }); PO.toast(`${v === 'approved' ? 'Approved' : 'Rejected'}: ${it.title}`, { action: { label: 'Undo', run: () => { const n = { ...decided }; delete n[it.id]; setDecided(n); } } }); };
    const ic = { leave: ['Palmtree', 'teal'], attendance: ['ClockAlert', 'amber'], overtime: ['Timer', 'amber'], swap: ['ArrowLeftRight', 'blue'], expense: ['Receipt', 'violet'], advance: ['HandCoins', 'rose'], payroll: ['Banknote', 'green'] };
    return html`<div class="card">
      <div class="card-h"><${PO.Chip} icon="Inbox" accent="amber" /><h3>Team requests</h3><span class="sub">${open.length ? `${open.length} waiting` : 'All decided'}</span><div class="right"><a class="link t-sm" href=${PO.href('approvals')}>Inbox</a></div></div>
      <div class="card-b" style="padding-top:4px">
        ${open.length ? open.slice(0, 5).map((it) => { const p = it.who ? PO.person(it.who) : null; const [i, a] = ic[it.type] || ['Inbox', 'green']; return html`<div class="hm-req">
          <span class="hm-req-av">${p ? html`<${PO.Avatar} p=${p} size="lg" />` : html`<${PO.Avatar} name=${it.whoName || '?'} size="lg" />`}<span class="hm-req-ic"><${PO.Chip} icon=${i} accent=${a} size=${11} /></span></span>
          <div style="min-width:0" class="grow"><b class="ellipsis" style="display:block">${it.whoName || (p && p.name)}</b><span class="faint t-sm ellipsis" style="display:block">${it.title}</span></div>
          <div class="row" style="gap:4px;flex:none"><${PO.IconButton} icon="X" size="sm" bordered title="Reject" onClick=${() => act(it, 'rejected')} /><${PO.IconButton} icon="Check" size="sm" bordered title="Approve" onClick=${() => act(it, 'approved')} /></div>
        </div>`; }) : html`<${PO.Empty} icon="CircleCheck" title="Nothing waiting" text="Requests from your team land here first." />`}
      </div>
    </div>`;
  }

  /* ---------- needs your attention ---------- */
  function Attention({ items, done, setDone, compact }) {
    const [all, setAll] = useState(false);
    const openItems = items.filter((t) => !t.done && !done[t.key]);
    const doneItems = items.filter((t) => t.done || done[t.key]);
    const shown = all ? openItems : openItems.slice(0, 7);
    const reopen = (t) => { const n = { ...done }; delete n[t.key]; setDone(n); };
    return html`<div class="card">
      <div class="card-h"><${PO.Chip} icon="ListChecks" accent="amber" /><h3>Needs your attention</h3><span class="sub">${openItems.length ? `${openItems.length} open` : 'All clear'}${doneItems.length ? `, ${doneItems.length} done today` : ''}</span></div>
      <div class="card-b" style="padding:6px 0 0">
        ${openItems.length ? shown.map((t) => html`<div class=${'hm-task' + (compact ? ' compact' : '')}>
          <${PO.Chip} icon=${t.icon || 'Circle'} accent=${t.tone === 'brand' ? 'blue' : t.tone} />
          <div style="min-width:0"><b>${t.title}</b><small>${t.sub}</small></div>
          <div class="acts">
            ${t.second && !compact ? html`<${PO.Button} size="sm" kind="ghost" onClick=${t.second.run}>${t.second.label}</${PO.Button}>` : null}
            <${PO.Button} size="sm" onClick=${t.run}>${t.action}</${PO.Button}>
            <${PO.Menu} align="right" trigger=${html`<${PO.IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: 'Mark as done', icon: 'Check', onClick: () => { setDone({ ...done, [t.key]: true }); PO.toast(`Marked done: ${t.title}`, { action: { label: 'Undo', run: () => reopen(t) } }); } }, { label: 'Snooze until tomorrow', icon: 'AlarmClock', onClick: () => { setDone({ ...done, [t.key]: true }); PO.toast('Snoozed until 08:00 tomorrow', { icon: 'AlarmClock' }); } }, { label: 'Assign to someone', icon: 'UserPlus', onClick: () => PO.toast('Assigned. They got an email.', { icon: 'Send' }) }]} />
          </div>
        </div>`) : html`<${PO.Empty} icon="CircleCheck" title="Nothing needs you right now" text="New requests, checks and alerts will show here." />`}
        ${openItems.length > 7 ? html`<button class="hm-more" onClick=${() => setAll(!all)}><${PO.Icon} n=${all ? 'ChevronUp' : 'ChevronDown'} size=${14} />${all ? 'Show fewer' : `Show ${openItems.length - 7} more`}</button>` : null}
        ${doneItems.length ? html`<details class="hm-done"><summary class="hm-more" style="list-style:none"><${PO.Icon} n="Check" size=${14} />${PO.plural(doneItems.length, 'item')} done today</summary>${doneItems.map((t) => html`<div class="hm-task done"><${PO.Chip} icon="Check" accent="green" /><div style="min-width:0"><b>${t.title}</b><small>${t.doneText || 'Resolved'}</small></div><div class="acts">${done[t.key] ? html`<${PO.Button} size="sm" kind="ghost" onClick=${() => reopen(t)}>Reopen</${PO.Button}>` : null}</div></div>`)}</details>` : null}
      </div>
    </div>`;
  }

  /* ---------- payroll card ---------- */
  function PayrollCard({ P, checks, locked }) {
    const T = P.totals, C = P.company;
    const H = P.payHistory, last = H[H.length - 1], prev = H[H.length - 2];
    const ch = (last.net - prev.net) / prev.net;
    const open = checks.filter((c) => !c.done).length;
    const daysLeft = daysBetween(PO.TODAY, payIso(C));
    return html`<div class="card">
      <div class="card-h"><${PO.Chip} icon="Banknote" accent="green" /><h3>Payroll</h3><span class="sub">${C.period}</span><div class="right"><${PO.Status} s=${locked ? 'Locked' : 'Draft'} /></div></div>
      <div class="card-b">
        <div class="faint t-sm">Net pay to ${PO.plural(P.people.length, 'person', 'people')}, paid ${C.payBy}</div>
        <div class="row" style="align-items:baseline;gap:10px;margin-top:2px"><span class="hero-num" style="font-size:30px">${PO.money(T.net)}</span><span class=${'delta ' + (ch >= 0 ? 'up' : 'down')}>${ch >= 0 ? '+' : '−'}${(Math.abs(ch) * 100).toFixed(1)}% vs last run</span></div>
        <div class="hm-figs">
          <div><small>Gross</small><b>${PO.compactMoney(T.gross)}</b></div>
          <div><small>Employer cost</small><b>${PO.compactMoney(T.cost)}</b></div>
          <div><small>Overtime</small><b>${PO.compactMoney(last.ot)}</b></div>
        </div>
        <div class="hm-label mt-12">Filings due</div>
        ${filings(P).slice(0, 3).map(([n, d, amt]) => { const k = daysBetween(PO.TODAY, d); return html`<div class="hm-row t-sm"><span class="grow ellipsis">${n}</span><span class="faint tnum">${amt != null ? PO.compactMoney(amt) : ''}</span><span class="tnum" style=${`width:52px;text-align:right;${k <= 3 ? 'color:var(--amber);font-weight:600' : 'color:var(--text-2)'}`}>${PO.date(d, { short: true, noYear: true })}</span></div>`; })}
      </div>
      <div class="card-f"><span class="t-sm muted">${locked ? 'Bank file and payslips ready' : open ? `${PO.plural(open, 'check')} to clear before paying` : 'All checks clear'}</span><span class="right"><${PO.Button} href=${PO.href('payroll')}>${locked ? 'View run' : 'Review run'}</${PO.Button}></span></div>
    </div>`;
  }

  /** Statutory deposits and returns due after this run (amounts from P.totals). */
  function filings(P) {
    const T = P.totals;
    if (P.id === 'in') return [['TDS deposit (Sep)', '2026-10-07', T.tds], ['PF ECR & challan', '2026-10-15', T.epf + T.erepf], ['ESI contribution', '2026-10-15', T.esi + T.eresi]];
    if (P.id === 'us') return [['Form 941 deposit (semi-weekly)', '2026-10-14', T.fit + T.ss + T.erss + T.med + T.ermed], ['401(k) remittance', '2026-10-13', T['401k'] + T.er401k], ['Texas TWC wage report (Q3)', '2026-10-31', null]];
    return [['RTI Full Payment Submission', '2026-10-09', null], ['PAYE & NI to HMRC', '2026-10-22', T.tax + T.ni + T.erni], ['Pension contributions', '2026-10-22', T.pen + T.erpen]];
  }

  /* ---------- manager: team cost card ---------- */
  function TeamCard({ P, team }) {
    const ppl = [...team].map(PO.person).filter(Boolean);
    const gross = ppl.reduce((t, p) => t + p.pay.gross, 0), ot = ppl.reduce((t, p) => t + (p.pay.otHours || 0), 0), otPay = ppl.reduce((t, p) => t + (p.pay.otPay || 0), 0);
    const top = ppl.filter((p) => p.pay.otHours).sort((a, b) => b.pay.otHours - a.pay.otHours).slice(0, 6);
    return html`<div class="card">
      <div class="card-h"><h3>Team hours · ${P.company.period}</h3><span class="sub">${PO.plural(ppl.length, 'person', 'people')}</span></div>
      <div class="card-b">
        <div class="hm-figs"><div class="hm-fig-main"><small>Team gross</small><b>${PO.compactMoney(gross)}</b></div><div><small>Overtime</small><b>${PO.num(ot)} h</b></div><div><small>Overtime pay</small><b>${PO.money(Math.round(otPay))}</b></div></div>
        <div class="faint t-sm mt-12" style="margin-bottom:8px">Most overtime this period</div>
        ${top.length ? html`<${PO.Charts.HBars} data=${top.map((p) => ({ label: p.name, value: p.pay.otHours, sub: PO.site(p.site).name }))} fmt=${(v) => v + ' h'} />` : html`<${PO.Empty} icon="Timer" title="No overtime" text="Nobody on your team worked overtime this period." />`}
      </div>
      <div class="card-f"><span class="t-sm muted">Payroll is run by ${PO.person(P.hrId).name}</span><span class="right"><${PO.Button} icon="CalendarCheck2" href=${PO.href('attendance')}>Timesheets</${PO.Button}></span></div>
    </div>`;
  }

  /* ---------- live attendance by site ---------- */
  function LiveCard({ P, live }) {
    const tot = live.reduce((t, l) => ({ in: t.in + (l.onDuty ?? l.in), late: t.late + l.late, absent: t.absent + l.absent, due: t.due + l.due }), { in: 0, late: 0, absent: 0, due: 0 });
    const cur = PO.shiftOf(P.current), nxt = PO.shiftOf(P.next);
    return html`<div class="card flush">
      <div class="card-h" style="padding-bottom:10px"><${PO.Chip} icon="MapPin" accent="blue" /><h3>Attendance by site</h3><span class="sub">${cur.label} shift ${cur.time} · next: ${nxt.label.toLowerCase()} at ${P.hhmm(nxt.from)}</span><div class="right"><a class="link t-sm" href=${PO.href('live')}>Live board</a></div></div>
      <div class="card-b"><div class="table-wrap"><table class="tbl compact">
        <thead><tr><th>Site</th><th class="r">Due</th><th class="r">In</th><th class="r">Late</th><th class="r">Absent</th><th style="width:96px"></th></tr></thead>
        <tbody>${live.map((l) => { const s = PO.site(l.site); const inn = l.onDuty ?? l.in; return html`<tr class="clickable" onClick=${() => PO.go('live?site=' + l.site)}><td><span class="w-500">${s.name}</span><span class="faint t-sm"> · ${s.client}</span></td><td class="r tnum">${l.due}</td><td class="r tnum">${inn}</td><td class="r tnum" style=${l.late ? 'color:var(--amber);font-weight:600' : 'color:var(--text-3)'}>${l.late || '–'}</td><td class="r tnum" style=${l.absent ? 'color:var(--red);font-weight:600' : 'color:var(--text-3)'}>${l.absent || '–'}</td><td><div class="hm-sitebar"><i style=${`width:${(inn / (l.due || 1)) * 100}%;background:var(--green-solid)`}></i><i style=${`width:${(l.absent / (l.due || 1)) * 100}%;background:var(--red-solid)`}></i></div></td></tr>`; })}</tbody>
        <tfoot><tr><td>All sites</td><td class="r tnum">${tot.due}</td><td class="r tnum">${tot.in}</td><td class="r tnum">${tot.late}</td><td class="r tnum">${tot.absent}</td><td class="t-sm tnum">${Math.round((tot.in / (tot.due || 1)) * 100)}% in</td></tr></tfoot>
      </table></div></div>
    </div>`;
  }

  /* ---------- who's out ---------- */
  function OutCard({ P, team }) {
    const rows = useMemo(() => {
      const today = [];
      P.outToday.forEach(([n, why, site]) => { const p = P.people.find((q) => q.name === n); if (team && (!p || !team.has(p.id))) return; if (/last day|left/i.test(why)) return; today.push({ p, name: n, why, site }); });
      P.leaveRequests.filter((l) => l.status === 'Approved' && l.from <= PO.TODAY && l.to >= PO.TODAY).forEach((l) => { const p = PO.person(l.who); if (!p || (team && !team.has(p.id)) || today.some((t) => t.name === p.name)) return; today.push({ p, name: p.name, why: `${(PO.leaveType(l.type) || {}).name}${l.to > PO.TODAY ? ` until ${PO.date(l.to, { short: true })}` : ''}`, site: PO.site(p.site).name }); });
      const end = PO.addDays(PO.TODAY, 6);
      const week = P.leaveRequests.filter((l) => l.status === 'Approved' && l.from > PO.TODAY && l.from <= end).filter((l) => { const p = PO.person(l.who); return p && (!team || team.has(p.id)); }).length;
      return { today, week };
    }, [P.id, team ? team.size : 0]);
    return html`<div class="card">
      <div class="card-h"><${PO.Chip} icon="Palmtree" accent="teal" /><h3>Out today</h3><span class="sub">${PO.plural(rows.today.length, 'person', 'people')} today, ${rows.week} more this week</span><div class="right"><a class="link t-sm" href=${PO.href('leave')}>Calendar</a></div></div>
      <div class="card-b" style="padding-top:6px">
        ${rows.today.length ? rows.today.slice(0, 5).map((r) => html`<div class="hm-row">${r.p ? html`<${PO.Avatar} p=${r.p} size="sm" />` : html`<${PO.Avatar} name=${r.name} size="sm" />`}<div class="grow" style="min-width:0"><div class="w-500 ellipsis">${r.p ? html`<a href=${PO.href('people/' + r.p.id)}>${r.name}</a>` : r.name}</div><div class="faint t-xs ellipsis">${r.why}, ${r.site}</div></div></div>`) : html`<div class="faint t-sm" style="padding:6px 0">Everyone is in today.</div>`}
        ${rows.today.length > 5 ? html`<a class="link t-sm" href=${PO.href('leave')}>+${rows.today.length - 5} more</a>` : null}
      </div>
    </div>`;
  }

  /* ---------- coming up: holidays, birthdays, anniversaries, announcements in one list ---------- */
  function ComingUp({ P, team }) {
    const list = useMemo(() => {
      const out = [];
      const pool = P.people.filter((p) => !team || team.has(p.id));
      for (let i = 0; i < 21; i++) {
        const d = PO.addDays(PO.TODAY, i), md = d.slice(5);
        pool.forEach((p) => {
          if (p.dob.slice(5) === md) out.push({ d, kind: 'Birthday', text: p.name, p });
          const yrs = 2026 - +p.joinedIso.slice(0, 4);
          if (p.joinedIso.slice(5) === md && yrs >= 1) out.push({ d, kind: 'Work anniversary', text: `${p.name} · ${PO.plural(yrs, 'year')}`, p });
        });
      }
      P.holidays.filter((h) => h.date >= PO.TODAY && h.date <= PO.addDays(PO.TODAY, 45)).forEach((h) => out.push({ d: h.date, kind: 'Holiday', text: h.name }));
      return out.sort((a, b) => a.d.localeCompare(b.d)).slice(0, 7);
    }, [P.id, team ? team.size : 0]);
    const ann = P.announcements[0];
    return html`<div class="card">
      <div class="card-h"><${PO.Chip} icon="CalendarHeart" accent="rose" /><h3>Coming up</h3><span class="sub">Next 3 weeks</span><div class="right"><a class="link t-sm" href=${PO.href('engagement')}>Announcements</a></div></div>
      <div class="card-b" style="padding-top:6px">
        ${list.map((x) => html`<div class="hm-row t-sm"><span class="hm-when">${PO.date(x.d, { short: true, noYear: true })}</span><span class="grow ellipsis">${x.p ? html`<a href=${PO.href('people/' + x.p.id)}>${x.text}</a>` : html`<span class="w-500">${x.text}</span>`}</span><span class="faint t-xs">${x.kind}</span></div>`)}
        ${ann ? html`<div class="hm-row t-sm" style="align-items:flex-start;cursor:pointer" onClick=${() => PO.go('engagement')}><span class="hm-when">Pinned</span><span class="grow"><span class="w-500">${ann.title}</span><span class="faint t-xs" style="display:block">Read by ${Math.round(ann.reach * 100)}% · ${PO.date(ann.date, { short: true, noYear: true })}</span></span></div>` : null}
      </div>
    </div>`;
  }

  /* ---------- page ---------- */
  function Home({ query = {} }) {
    const P = PO.P();
    const C = P.company, T = P.totals;
    const { state, dispatch } = PO.useStore();
    /* deep link: #/home?ask=<prompt> opens the assistant (ask=agents|history opens that tab) */
    PO.useEffect(() => {
      if (!query.ask) return;
      if (query.ask === 'agents' || query.ask === 'history') { PO.setCo('assistant.tab', query.ask); dispatch({ type: 'set', patch: { assistant: {} } }); }
      else dispatch({ type: 'set', patch: { assistant: query.ask === '1' ? {} : { prompt: query.ask } } });
    }, []);
    PO.useEffect(() => { if (state.role === 'employee') PO.go('me'); }, [state.role]);
    const viewer = PO.viewer();
    const mgr = state.role === 'manager';
    const team = useMemo(() => (mgr ? teamOf(P, viewer.id) : null), [P.id, mgr]);
    const [done, setDone] = PO.useCoState('home.done', {});
    const decided = PO.coGet(state, 'approvals.decided', {});
    const liveRes = PO.coGet(state, 'live.resolved', {}) || {};
    const lateIn = !!PO.coGet(state, 'live.lateIn', false) || !!liveRes['late:' + P.late.id] || !!liveRes['run:' + P.late.id];
    const cover = PO.coGet(state, 'assistant.cover', null);
    const locked = (PO.coGet(state, 'payroll.lock', { status: 'Draft' }) || {}).status !== 'Draft' || !!PO.coGet(state, 'payroll.locked', false);
    const pinned = PO.coGet(state, 'reports.pinned', []) || [];
    const checks = PO.payrollChecks ? PO.payrollChecks(P, decided, state) : [];
    const pending = PO.pendingApprovals ? PO.pendingApprovals(state, P) : 0;
    const items = PO.approvalScope ? PO.approvalScope(P, state.role, viewer.id).filter((it) => !decided[it.id]) : [];
    const ask = (prompt) => dispatch({ type: 'set', patch: { assistant: { prompt } } });
    const lp = PO.person(P.late.id);

    /* live numbers: company figures for admin, computed from the team for managers */
    const live = useMemo(() => {
      if (!mgr) return P.live;
      const by = {};
      [...team].map(PO.person).filter((p) => p && p.shift === P.current).forEach((p) => { const r = (by[p.site] = by[p.site] || { site: p.site, due: 0, in: 0, late: 0, absent: 0 }); r.due++; if (P.lateMap[p.id]) r.late++; else if (P.absent.has(p.id)) r.absent++; else r.in++; });
      return Object.values(by);
    }, [P.id, mgr]);
    const liveAdj = live.map((l) => (lateIn && lp && l.site === lp.site && (!team || team.has(lp.id)) ? { ...l, in: l.in + 1, late: Math.max(0, l.late - 1) } : l));
    const due = liveAdj.reduce((t, l) => t + l.due, 0), inNow = liveAdj.reduce((t, l) => t + (l.onDuty ?? l.in), 0), late = liveAdj.reduce((t, l) => t + l.late, 0), absent = liveAdj.reduce((t, l) => t + l.absent, 0);

    const openChecks = checks.filter((c) => !c.done).length;
    const daysLeft = daysBetween(PO.TODAY, payIso(C));
    const H = P.payHistory;
    const openings = P.jobs.filter((j) => !mgr || j.hiringManager === viewer.id || team.has(j.hiringManager) || (viewer.site && j.site === viewer.site)).reduce((t, j) => t + j.openings, 0);
    const jobsN = P.jobs.filter((j) => !mgr || j.hiringManager === viewer.id || team.has(j.hiringManager) || (viewer.site && j.site === viewer.site)).length;
    const scopedJobs = new Set(P.jobs.filter((j) => !mgr || j.hiringManager === viewer.id || team.has(j.hiringManager) || (viewer.site && j.site === viewer.site)).map((j) => j.id));
    const cands = P.candidates.filter((c) => c.stage !== 'Hired' && scopedJobs.has(c.job)).length;
    const oldest = items.reduce((m, it) => Math.max(m, it.waitH), 0);
    const chan = 'SMS';

    /* the planted moments */
    const coverP = PO.person(P.cover.who);
    const blocker = P.onboarding.find((o) => o.tasks.some((t) => t.blocker));
    const blockTask = blocker && blocker.tasks.find((t) => t.blocker);
    const fnf = P.exits.filter((e) => e.status === 'F&F due');
    const docsExp = useMemo(() => { let n = 0, ex = 0; P.people.forEach((p) => { if (team && !team.has(p.id)) return; p.docs.forEach((d) => { if (d.status === 'Expiring soon') n++; if (d.status === 'Expired') ex++; }); }); return { n, ex }; }, [P.id, mgr]);
    const reviews = mgr ? [...team].map(PO.person).filter((p) => p && p.reviewStatus === 'Self review done').length : 0;
    const lateInTeam = lp && (!team || team.has(lp.id));
    const tasks = [
      !mgr && { key: 'payroll', icon: 'Banknote', tone: openChecks ? 'amber' : 'green', title: locked ? `Payroll for ${C.period} is locked` : `Payroll for ${C.period}: ${openChecks ? PO.plural(openChecks, 'check') + ' before you pay' : 'ready to lock'}`, sub: `Pay by ${C.payBy}, ${PO.plural(Math.max(0, daysLeft), 'day')} left, net ${PO.compactMoney(T.net)}`, action: 'Review & run', primary: true, run: () => PO.go('payroll'), done: locked, doneText: 'Locked. Bank file and payslips are ready.' },
      { key: 'approvals', icon: 'Inbox', tone: oldest >= 48 ? 'red' : 'brand', title: pending ? `${PO.plural(pending, 'approval')} waiting${mgr ? ' from your team' : ''}` : 'No approvals waiting', sub: pending ? `${[...new Set(items.map((it) => ({ leave: P.id === 'us' ? 'PTO' : P.id === 'uk' ? 'holiday' : 'leave', attendance: 'missed punches', overtime: 'overtime', swap: 'a shift swap', expense: 'expenses', advance: 'an advance', payroll: 'payroll sign-off' }[it.type])))].slice(0, 4).join(', ')}${oldest >= 48 ? `, oldest ${Math.floor(oldest / 24)} days` : ''}` : 'Everything has a decision', action: 'Open inbox', run: () => PO.go('approvals'), done: !pending, doneText: 'Every request has a decision' },
      lateInTeam && { key: 'late', icon: 'Clock', tone: 'amber', title: `${lp.name} is ${P.late.min} min late`, sub: `${PO.site(lp.site).name}, ${lp.post || lp.title}, ${P.lateWord}`, action: 'Live board', run: () => PO.go('live?site=' + lp.site), second: { label: 'Message', icon: 'MessageCircle', run: () => PO.toast(`Message sent to ${lp.first} on ${chan}: “Are you on the way?”`, { icon: 'Send' }) }, done: lateIn, doneText: `${lp.first} clocked in, verified by site QR` },
      coverP && (!team || team.has(coverP.id) || (viewer.site && viewer.site === P.cover.site)) && { key: 'cover', icon: 'Thermometer', tone: 'red', title: `${coverP.name} called in sick for tonight`, sub: `${PO.shiftOf(coverP.shift).label} shift, ${PO.site(P.cover.site).name}, no cover yet`, action: 'Find cover', primary: !!mgr, run: () => ask(P.ai.cover), done: !!cover, doneText: cover ? `${cover.name} covers tonight` : '' },
      !mgr && { key: 'rule', icon: 'ShieldAlert', tone: 'red', title: P.ruleFlag.title, sub: 'Compliance, fix before you lock payroll', action: 'Fix it', run: () => PO.go('compliance'), done: checks.some((c) => c.key === 'rule' && c.done), doneText: 'Restructured. Letters drafted.' },
      !mgr && { key: 'contractor', icon: 'HardHat', tone: 'amber', title: P.contractorNeed.t, sub: P.contractorNeed.d, action: 'Check', run: () => PO.go('contractors'), done: Object.keys(PO.coGet(state, 'contractors.held', {}) || {}).length > 0 || !!PO.coGet(state, 'contractors.resolved', false), doneText: 'Invoice held until the proof arrives' },
      !mgr && blocker && { key: 'onboarding', icon: 'UserPlus', tone: 'amber', title: `${blocker.name}: “${blockTask.t}” is blocking onboarding`, sub: `${blocker.role}, ${PO.site(blocker.site).name}, joined ${PO.date(blocker.start, { short: true })}`, action: 'Open', run: () => PO.go('onboarding') },
      !mgr && fnf.length && { key: 'fnf', icon: 'UserMinus', tone: 'red', title: `${P.id === 'in' ? 'F&F' : 'Final pay'} due for ${fnf.map((e) => e.name).join(' and ')}`, sub: `${P.id === 'in' ? 'Within 2 working days of the last day (Code on Wages)' : P.id === 'us' ? 'Texas Payday Law: by the next regular payday' : 'With the next pay run, P45 to follow'}, ${PO.money(fnf.reduce((t, e) => t + e.settlement, 0))}`, action: 'Settle', run: () => PO.go('offboarding'), done: fnf.every((e) => (PO.coGet(state, 'payroll.fnfPaid', {}) || {})[e.id]), doneText: 'Paid off-cycle' },
      (docsExp.n || docsExp.ex) && { key: 'docs', icon: 'FileWarning', tone: 'amber', title: `${PO.plural(docsExp.n + docsExp.ex, 'document')} ${docsExp.ex ? `expired or expiring` : 'expiring soon'}`, sub: P.id === 'in' ? `${docsExp.ex} police verifications expired, ${docsExp.n} expiring in 30 days` : P.id === 'us' ? 'Food handler cards and I-9 re-verifications' : 'DBS checks and right-to-work share codes', action: 'Review', run: () => PO.go('documents'), second: { label: `Chase on ${chan}`, icon: 'Send', run: () => { setDone({ ...done, docs: true }); PO.toast(`Document chaser messaged ${PO.plural(docsExp.n + docsExp.ex, 'person', 'people')} on ${chan}`, { icon: 'Send' }); } } },
      mgr && { key: 'opens', icon: 'CalendarPlus', tone: 'amber', title: `${PO.plural(P.roster.opens.length, 'open shift')} at ${PO.site(viewer.site).name} this week`, sub: P.roster.opens.map((o) => `${P.roster.week[o.day]} ${PO.shiftOf(o.shift).label.toLowerCase()}`).join(', ') + `, ${P.roster.fillers.join(' and ')} have offered`, action: 'Fill', run: () => PO.go('roster'), second: { label: 'Ask agent', icon: 'Sparkles', run: () => ask(`Fill the open shifts at ${PO.site(viewer.site).name} this week`) } },
      mgr && { key: 'timesheets', icon: 'CalendarCheck2', tone: 'blue', title: `Sign off this week’s timesheets for ${PO.plural(team.size, 'person', 'people')}`, sub: `Due ${P.id === 'us' ? 'Monday 10am' : 'Monday 10:00'} so payroll can pick them up`, action: 'Review', run: () => PO.go('attendance') },
      mgr && { key: 'probation', icon: 'BadgeCheck', tone: 'brand', title: `${PO.plural(Math.max(1, [...team].map(PO.person).filter((p) => p && p.status === 'Probation').length), 'probation review')} due this month`, sub: 'Confirm, extend or end probation before the date passes', action: 'Open', run: () => PO.go('performance') },
      mgr && reviews && { key: 'reviews', icon: 'Target', tone: 'blue', title: `${PO.plural(reviews, 'manager review')} to write`, sub: `${P.reviewCycle.name}, closes ${PO.date(P.reviewCycle.closes, { short: true })}`, action: 'Start', run: () => PO.go('performance') },
    ].filter(Boolean);

    const scopeText = mgr ? `Your team of ${team.size} at ${PO.site(viewer.site).name}` : `${PO.num(P.people.length)} people across ${P.sites.length} sites`;
    const more = mgr
      ? [{ label: 'Approve requests', icon: 'Inbox', onClick: () => PO.go('approvals') }, { label: 'Find cover for a shift', icon: 'UserRoundSearch', onClick: () => ask(P.ai.cover) }, { label: 'Message the team', icon: 'Send', onClick: () => PO.toast(`Message drafted for ${team.size} people by SMS and email`, { icon: 'Send' }) }, { label: 'Timesheets', icon: 'CalendarCheck2', onClick: () => PO.go('attendance') }]
      : [{ label: 'Add employee', icon: 'UserPlus', onClick: () => PO.go('people?new=1') }, { label: `Record ${leaveWord(P)}`, icon: 'Palmtree', onClick: () => PO.go('leave?new=1') }, { label: 'Fill open shifts', icon: 'CalendarRange', onClick: () => PO.go('roster') }, { label: 'Post an announcement', icon: 'Megaphone', onClick: () => PO.go('engagement?new=1') }, '-', { label: 'Import from spreadsheet', icon: 'FileSpreadsheet', onClick: () => PO.go('settings/import') }];
    const teamOt = mgr ? [...team].map(PO.person).reduce((t, p) => t + (p ? p.pay.otHours || 0 : 0), 0) : 0;
    const payWindow = 5;
    const outToday = (() => { const ids = new Set(); P.outToday.forEach(([n, why]) => { const q = P.people.find((x) => x.name === n); if (q && !/last day|left/i.test(why) && (!team || team.has(q.id))) ids.add(q.id); }); P.leaveRequests.filter((l) => l.status === 'Approved' && l.from <= PO.TODAY && l.to >= PO.TODAY).forEach((l) => { if (!team || team.has(l.who)) ids.add(l.who); }); return [...ids]; })();
    const requesters = [...new Set(items.map((it) => it.who || (it.p && it.p.id)).filter(Boolean))];
    const kpis = [
      mgr ? { label: 'Team overtime', icon: 'Timer', accent: 'amber', value: PO.num(teamOt), unit: 'h', sub: `This pay period, ${C.period}`, href: PO.href('attendance'), bar: [{ v: teamOt, k: 'warn' }, { v: Math.max(0, team.size * 4 - teamOt), k: 'mute' }] }
          : { label: `Payroll due ${C.payBy}`, icon: 'Banknote', accent: 'green', value: PO.compactMoney(T.net), href: PO.href('payroll'), alert: daysLeft <= 1 && !locked,
              ticks: { on: Math.max(0, Math.min(payWindow, daysLeft)), of: payWindow },
              sub: html`${daysLeft <= 0 ? 'Due today' : `${PO.plural(daysLeft, 'day')} left`}, ${openChecks ? html`<span style="color:var(--amber)">${PO.plural(openChecks, 'check')} open</span>` : 'checks clear'}` },
      { label: 'Waiting for approval', icon: 'Inbox', accent: oldest >= 48 && pending ? 'red' : 'amber', value: String(pending), href: PO.href('approvals'), alert: oldest >= 48 && pending > 0,
        faces: requesters, sub: pending ? `Oldest waiting ${oldest >= 24 ? PO.plural(Math.floor(oldest / 24), 'day') : Math.round(oldest) + ' h'}` : 'Nothing waiting' },
      { label: 'Out today', icon: 'Palmtree', accent: 'teal', value: String(outToday.length), faces: outToday, sub: outToday.length ? 'On leave or off sick' : 'Everyone is in', href: PO.href('leave') },
      { label: mgr ? 'Team size' : 'Headcount', icon: 'Users', accent: 'blue', value: mgr ? String(team.size) : PO.num(P.people.length), href: PO.href('people'),
        bar: mgr ? null : [{ v: P.people.filter((p) => !p.contractor).length, k: 'ok', title: 'employees' }, { v: P.people.filter((p) => p.contractor).length, k: 'mute', title: 'contract workers' }],
        sub: mgr ? `${[...team].map(PO.person).filter((p) => p && p.status === 'Probation').length} on probation` : `${P.people.filter((p) => p.contractor).length ? P.people.filter((p) => p.contractor).length + ' via agency, ' : ''}up ${H[H.length - 1].heads - H[0].heads} this year` },
      { label: 'Open roles', icon: 'Briefcase', accent: 'violet', value: String(openings), href: PO.href('hiring'), sub: `${PO.plural(cands, 'candidate')} across ${PO.plural(jobsN, 'job')}`,
        bar: (() => { const c = P.candidates.filter((x) => scopedJobs.has(x.job)); const n = (st) => c.filter((x) => x.stage === st).length; return [{ v: n('Applied') + n('Screening'), k: 'mute', title: 'applied or screening' }, { v: n('Interview'), k: 'ok', title: 'interviewing' }, { v: n('Offer'), k: 'warn', title: 'offer out' }]; })() },
    ];

    return html`
      <${PO.PageHeader} title=${html`<span class="row" style="gap:12px"><${PO.Avatar} p=${viewer} size="lg" />${mgr ? `Good morning, ${viewer.first}` : C.greeting}</span>`} sub=${html`${C.today}, <span class="tnum">${P.hhmm(C.nowMin)}</span> in ${C.city}. ${scopeText}.`} actions=${html`
        <${PO.Menu} align="right" width=${230} trigger=${html`<${PO.Button} iconRight="ChevronDown">Quick actions</${PO.Button}>`} items=${more} />
        ${mgr ? html`<${PO.Button} kind="primary" href=${PO.href('roster')}>Open roster</${PO.Button}>` : html`<${PO.Button} kind="primary" href=${PO.href('payroll')}>Run payroll</${PO.Button}>`}`} />

      <${PO.KpiStrip} items=${kpis} />

      ${mgr ? html`<div class="grid g-main" style="margin-top:20px;align-items:start">
        <div class="col" style="gap:16px">
          <${TodayHero} P=${P} live=${liveAdj} team=${team} mgr=${mgr} />
          <${TeamBoard} P=${P} team=${team} />
        </div>
        <div class="col" style="gap:16px">
          <${TeamRequests} P=${P} items=${items} />
          <${Attention} compact items=${tasks.filter((t) => t.key !== 'approvals')} done=${done} setDone=${setDone} />
          <${ComingUp} P=${P} team=${team} />
        </div>
      </div>` : html`<div class="grid g-main" style="margin-top:20px;align-items:start">
        <div class="col" style="gap:16px">
          <${TodayHero} P=${P} live=${liveAdj} team=${team} mgr=${mgr} />
          <${Attention} items=${tasks} done=${done} setDone=${setDone} />
          <${LiveCard} P=${P} live=${liveAdj} />
        </div>
        <div class="col" style="gap:16px">
          ${mgr ? html`<${TeamCard} P=${P} team=${team} />` : html`<${PayrollCard} P=${P} checks=${checks} locked=${locked} />`}
          <${ComingUp} P=${P} team=${team} />
          ${pinned.length ? html`<div class="card"><div class="card-h"><h3>Pinned reports</h3><div class="right"><a class="link t-sm" href=${PO.href('reports')}>All reports</a></div></div><div class="card-b" style="padding-top:6px">${pinned.map((r) => { const name = typeof r === 'string' ? r : r.name || r.title || r.id; return html`<div class="hm-row t-sm"><a class="link" href=${PO.href('reports')}>${name}</a></div>`; })}</div></div>` : null}
        </div>
      </div>`}`;
  }

  PO.route('home', Home, { title: 'Home' });
})();
