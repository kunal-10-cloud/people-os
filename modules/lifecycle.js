/* People OS: onboarding (board, case checklists, templates) and offboarding (exits, country-aware F&F settlement). */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect } = PO;
  const { Icon, Avatar, Who, Badge, Status, Button, IconButton, Menu, Tabs, Segmented, Switch, PageHeader, Card, Stat, Empty, Callout, Progress, KV, Timeline, Checklist, Field, Drawer, Modal, DataTable } = PO;
  const PX = () => PO.PX;
  const TODAY = PO.TODAY;
  const addDays = (s, n) => PO.addDays(s, n);

  document.head.insertAdjacentHTML('beforeend', `<style>
  .lc-board { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; overflow-x:auto; padding-bottom:6px; align-items:start; }
  .lc-col { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r-lg); padding:8px; display:flex; flex-direction:column; gap:10px; min-height:200px; }
  .lc-col-h { display:flex; align-items:center; gap:8px; padding:2px 4px 4px; font-weight:600; font-size:12.5px; }
  .lc-col-h .dot { width:8px; height:8px; border-radius:50%; }
  .lc-col { border-top:2px solid var(--lc-ac, var(--border)); }
  .lc-col-h .chip-ic { width:24px; height:24px; }
  .lc-ring { position:relative; width:52px; height:52px; flex:none; display:grid; place-items:center; }
  .lc-ring svg { position:absolute; inset:0; transform:rotate(-90deg); }
  .lc-ring .av.lg { width:42px; height:42px; }
  .lc-ring-n { position:absolute; right:-10px; bottom:-3px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:0 5px; font-family:var(--num); font-size:10.5px; font-weight:600; line-height:16px; color:var(--text-2); }
  .lc-buddy { display:flex; align-items:center; gap:6px; min-width:0; color:var(--text-2); font-size:12px; }
  .lc-buddy span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lc-grp-h .av, .lc-grp-h .chip-ic { flex:none; }
  .lc-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:12px; display:flex; flex-direction:column; gap:10px; cursor:pointer; }
  .lc-card:hover { border-color:var(--border-strong); }
  .lc-card.risk { box-shadow:inset 2px 0 0 var(--red-solid); }
  .lc-card.cand { border-style:dashed; }
  .lc-empty { border:1px dashed var(--border-strong); border-radius:6px; padding:18px 12px; text-align:center; color:var(--text-3); font-size:12px; }
  .lc-grp { border:1px solid var(--border); border-radius:var(--r-lg); padding:4px 14px 6px; background:var(--surface); }
  .lc-grp-h { display:flex; align-items:center; gap:8px; padding:10px 0 4px; font-weight:600; font-size:12.5px; }
  .lc-tbl { width:100%; border-collapse:collapse; }
  .lc-tbl td { padding:9px 0; border-bottom:1px solid var(--border); vertical-align:top; }
  .lc-tbl td.r { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; font-weight:550; padding-left:12px; }
  .lc-tbl td small { display:block; color:var(--text-3); font-size:11.5px; font-weight:400; margin-top:1px; }
  .lc-tbl tr.sec td { border-bottom:none; padding-top:16px; font-size:12px; font-weight:600; color:var(--text-2); }
  .lc-tbl tr.muted td { color:var(--text-3); }
  .lc-tbl tr.tot td { border-top:1px solid var(--border-strong); border-bottom:none; font-weight:650; padding-top:11px; }
  .lc-tbl tr.net td { border-top:2px solid var(--text); border-bottom:none; font-weight:700; font-size:18px; padding-top:12px; font-family:var(--num); }
  .lc-dl { display:flex; gap:12px; align-items:center; padding:12px 14px; border-radius:var(--r-lg); border:1px solid var(--border); background:var(--surface-2); }
  .lc-dl.alert { box-shadow:inset 3px 0 0 var(--signal); } .lc-dl.late { box-shadow:inset 3px 0 0 var(--red-solid); } .lc-dl.ok { box-shadow:inset 3px 0 0 var(--green-solid); }
  .lc-dl .big { font-family:var(--num); font-size:26px; font-weight:600; font-variant-numeric:tabular-nums; line-height:1; }
  .lc-qa { padding:12px 0; border-bottom:1px solid var(--border); }
  .lc-qa:last-child { border-bottom:none; }
  .lc-qa small { color:var(--text-3); font-size:12px; display:block; margin-bottom:4px; }
  .lc-bubble { background:var(--surface); border-radius:var(--r-lg, 10px); padding:12px 14px; font-size:12.5px; line-height:1.55; white-space:pre-wrap; border:1px solid var(--border); }
  .lc-mailh { display:grid; grid-template-columns:56px minmax(0,1fr); gap:2px 8px; font-size:12px; padding-bottom:8px; margin-bottom:8px; border-bottom:1px solid var(--border); white-space:normal; }
  .lc-mailh span { color:var(--text-3); }
  .lc-basis .kv { grid-template-columns:84px minmax(0,1fr); gap:8px 10px; }
  .lc-basis .kv dd { text-align:right; }
  .lc-tpl { display:flex; flex-direction:column; }
  .lc-tpl .lc-tpl-b { padding:14px 16px; display:flex; flex-direction:column; gap:10px; flex:1; }
  </style>`);

  /* =====================================================================
     Onboarding
     ===================================================================== */
  const OWNERS = [['Employee', 'UserRound', 'blue'], ['HR', 'Briefcase', 'violet'], ['Manager', 'UsersRound', 'teal'], ['IT', 'Laptop', 'amber']];
  const ownerOf = (t) => (/\bPOS\b/.test(t.t) || /login|Uniform|keys|badge|ID issued|laptop|access card/i.test(t.t) ? 'IT' : t.owner);
  const STAGES = [['offer', 'Offer accepted', 'var(--violet)', 'Handshake', 'violet'], ['Pre-boarding', 'Pre-boarding', 'var(--amber-solid)', 'FileClock', 'amber'], ['Day 1', 'Day 1', 'var(--rose)', 'Sunrise', 'rose'], ['First week', 'First week', 'var(--blue-solid)', 'CalendarDays', 'blue'], ['Joined', 'Joined', 'var(--green-solid)', 'BadgeCheck', 'green']];
  /* progress ring around a portrait */
  const Ring = ({ pct, tone, children, n }) => { const r = 24, C = 2 * Math.PI * r; return html`<span class="lc-ring"><svg viewBox="0 0 52 52" width="52" height="52"><circle cx="26" cy="26" r=${r} fill="none" stroke="var(--surface-3)" stroke-width="3" /><circle cx="26" cy="26" r=${r} fill="none" stroke=${tone} stroke-width="3" stroke-linecap="round" stroke-dasharray=${`${(C * pct) / 100} ${C}`} /></svg>${children}${n ? html`<span class="lc-ring-n">${n}</span>` : null}</span>`; };
  const workingDaysSince = (P, from) => { let n = 0; for (let d = from; d <= TODAY; d = addDays(d, 1)) { const w = PX().dow(d); if (w !== 0 && (P.id === 'in' || w !== 6) && !P.holidays.some((h) => h.date === d)) n++; } return n; };

  function useCases() {
    const P = PO.P();
    const [added] = PO.useCoState('onboarding.added', []);
    const [tasks, setTasks] = PO.useCoState('onboarding.tasks', {});
    const [meta, setMeta] = PO.useCoState('onboarding.meta', {});
    const [padded] = PO.useCoState('people.added', []);
    const cases = useMemo(() => [...P.onboarding, ...added].map((c) => {
      const t = c.tasks.map((x, i) => ({ ...x, owner: ownerOf(x), done: tasks[c.id] && tasks[c.id][i] != null ? tasks[c.id][i] : x.done }));
      const done = t.filter((x) => x.done).length;
      const m = meta[c.id] || {};
      const blockers = t.filter((x) => x.blocker && !x.done);
      let stage = m.stage || (done === t.length ? 'Joined' : c.start > TODAY ? 'Pre-boarding' : c.start === TODAY ? 'Day 1' : workingDaysSince(P, c.start) <= 7 ? 'First week' : 'Joined');
      const daysTo = PX().daysBetween(TODAY, c.start);
      const risk = blockers.length > 0 || (stage === 'Pre-boarding' && daysTo <= 7 && t.filter((x) => !x.done && x.owner === 'Employee').length > 1);
      const p = c.who ? PX().find(P, c.who, padded) : null;
      return { ...c, tasks: t, done, pct: Math.round((done / t.length) * 100), blockers, stage, risk, daysTo, buddy: m.buddy || c.buddy, p };
    }), [P.id, added, tasks, meta, padded]);
    return { cases, tasks, setTasks, meta, setMeta, added };
  }

  function caseDocs(P, c, docSt) {
    if (c.p && c.p.docs) return PX().docsOf(c.p, docSt);
    const docTask = c.tasks.find((t) => /Documents|I-9|Right to work/i.test(t.t));
    return P.vocab.docTypes.map((name, i) => ({ name, status: i < 2 ? (docTask && docTask.done ? 'Verified' : 'Requested') : i < 4 && c.done > 2 ? 'Pending review' : 'Requested' }));
  }

  function CaseCard({ c, onOpen }) {
    const P = PO.P();
    const site = PO.site(c.site) || {};
    const buddy = P.byId[c.buddy];
    const tone = c.pct === 100 ? 'var(--green-solid)' : c.risk ? 'var(--red-solid)' : 'var(--brand)';
    return html`<div class=${'lc-card ' + (c.risk ? 'risk' : '')} onClick=${() => onOpen(c.id)}>
      <div class="row" style="align-items:center;gap:12px"><${Ring} pct=${c.pct} tone=${tone} n=${`${c.done}/${c.tasks.length}`}>${c.p ? html`<${Avatar} p=${c.p} size="lg" />` : html`<${Avatar} name=${c.name} size="lg" />`}</${Ring}><div class="grow" style="min-width:0"><b class="w-600 ellipsis" style="display:block">${c.name}</b><small class="faint ellipsis" style="display:block">${c.role}, ${site.name}</small></div></div>
      <div class="row t-sm"><span class="muted">${c.start > TODAY ? 'Starts ' : 'Started '}${PO.date(c.start, { short: true, weekday: true })}</span><span class="right faint t-xs">${c.daysTo > 0 ? `in ${c.daysTo} d` : c.daysTo === 0 ? 'today' : `${-c.daysTo} d ago`}</span></div>
      <div class="row t-xs">
        ${c.blockers.length ? html`<${Badge} tone="red" dot>${c.blockers[0].t}</${Badge}>` : c.risk ? html`<${Badge} tone="amber" dot>Docs pending</${Badge}>` : c.pct === 100 ? html`<${Badge} tone="green" dot>Complete</${Badge}>` : html`<span class="faint">${PO.plural(c.tasks.length - c.done, 'task')} left</span>`}
      </div>
      ${buddy ? html`<div class="lc-buddy" style="border-top:1px solid var(--border);padding-top:8px" title=${'Buddy: ' + buddy.name}><${Avatar} p=${buddy} size="xs" /><span>Buddy ${buddy.first || buddy.name.split(' ')[0]}</span></div>` : null}
    </div>`;
  }

  function Onboarding({ query }) {
    const P = PO.P();
    const { cases, tasks, setTasks, meta, setMeta } = useCases();
    const [tab, setTab] = useState(query.tab || 'board');
    const [open, setOpen] = useState(query.case || null);
    const [converted, setConverted] = PO.useCoState('onboarding.converted', {});
    const [, setAdded] = PO.useCoState('onboarding.added', []);
    useEffect(() => { if (query.case) setOpen(query.case); }, [query.case]);
    const names = new Set([...cases.map((c) => c.name), ...P.people.map((p) => p.name)]);
    const offers = P.candidates.filter((c) => c.stage === 'Hired' && !names.has(c.name) && !converted[c.id]);
    const inProg = cases.filter((c) => c.pct < 100);
    const week = cases.filter((c) => c.start >= TODAY && c.start <= addDays(TODAY, 7));
    const blockers = cases.reduce((t, c) => t + c.blockers.length, 0);
    const recent = P.people.filter((p) => p.joinedIso >= addDays(TODAY, -90)).length + cases.length;
    const avg = { in: 9.4, us: 4.2, uk: 6.8 }[P.id];
    const startCase = (cand) => {
      const job = P.jobs.find((j) => j.id === cand.job) || {};
      const site = PO.site(job.site) || P.sites[0];
      const roleTitle = job.title || 'New hire';
      const id = 'ONB-' + (80 + Object.keys(converted).length);
      const start = addDays(TODAY, 7);
      setConverted({ ...converted, [cand.id]: id });
      setAdded((prev) => [...prev, { id, name: cand.name, who: null, role: roleTitle.replace(/ \(.*\)/, ''), site: site.id, start, buddy: site.lead || P.hrId, tasks: P.onboarding[0].tasks.map((t, k) => ({ t: t.t, owner: t.owner, done: k === 0 })), stage: 'Pre-boarding', fromCand: cand.id }]);
      PO.toast(`Onboarding started for ${cand.name}, starting ${PO.date(start, { short: true, weekday: true })}`, { icon: 'UserPlus', action: { label: 'Open', run: () => setOpen(id) } });
    };
    const byStage = (k) => cases.filter((c) => c.stage === k).sort((a, b) => a.start.localeCompare(b.start));
    const sel = cases.find((c) => c.id === open);
    const next = cases.filter((c) => c.start > TODAY).sort((a, b) => a.start.localeCompare(b.start))[0];

    return html`
      <${PageHeader} title="Onboarding" sub=${`${PO.plural(inProg.length, 'new hire')} between offer and the end of their first week, and ${PO.plural(offers.length, 'accepted offer')} waiting to start.`} actions=${html`<${Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" title="More" bordered />`} items=${[{ label: 'Checklist templates', icon: 'ListChecks', onClick: () => setTab('templates') }, { label: 'Export cases (CSV)', icon: 'Download', onClick: () => PO.exportCsv('onboarding-cases', [['Case', 'Name', 'Role', 'Start', 'Stage', 'Progress'], ...cases.map((c) => [c.id, c.name, c.role, c.start, c.stage, c.pct + '%'])]) }]} /><${Button} kind="primary" onClick=${() => PO.go('people?new=1')}>Add new hire</${Button}>`} />
      <div style="margin-bottom:24px"><${PO.KpiStrip} items=${[
        { label: 'In progress', icon: 'UserPlus', accent: 'green', faces: inProg.filter((c) => c.p).map((c) => c.p.id), value: inProg.length, sub: `${byStage('Pre-boarding').length} pre-boarding, ${byStage('First week').length + byStage('Day 1').length} in their first week`, bar: [{ v: byStage('Pre-boarding').length, k: 'mute', title: 'pre-boarding' }, { v: byStage('Day 1').length + byStage('First week').length, k: 'ok', title: 'day 1 or first week' }] },
        { label: 'Starting this week', icon: 'CalendarDays', accent: 'blue', faces: week.filter((c) => c.p).map((c) => c.p.id), value: week.length, sub: next ? `Next is ${next.name.split(' ')[0]} on ${PO.date(next.start, { short: true, weekday: true })}` : 'No one scheduled' },
        { label: 'Blocked tasks', icon: 'OctagonAlert', accent: 'red', value: blockers, alert: blockers > 0, sub: blockers ? `Holding up ${cases.filter((c) => c.blockers.length).map((c) => c.name.split(' ')[0]).join(', ')}` : 'Nothing blocking' },
        { label: 'Average time to complete', icon: 'Timer', accent: 'teal', value: avg, unit: 'days', sub: `Target ${P.id === 'in' ? 10 : 7} days, from ${recent} hires in 90 days` },
      ]} /></div>
      <${Tabs} tabs=${[['board', 'Board', cases.length + offers.length], ['list', 'All cases'], ['templates', 'Checklist templates']]} value=${tab} onChange=${setTab} />
      ${tab === 'board' ? html`<div class="lc-board">${STAGES.map(([k, label, color, ic, ac]) => {
        const list = k === 'offer' ? offers : byStage(k);
        return html`<div class="lc-col" style=${`--lc-ac:${color}`}><div class="lc-col-h"><${PO.Chip} icon=${ic} accent=${ac} size=${13} />${label}<span class="nav-count" style="margin-left:auto">${list.length}</span></div>
          ${k === 'offer' ? html`${list.slice(0, 4).map((cand) => { const job = P.jobs.find((j) => j.id === cand.job) || {}; return html`<div class="lc-card cand" onClick=${() => startCase(cand)}><div class="row" style="gap:12px"><${Avatar} name=${cand.name} hue=${cand.hue} size="lg" /><div class="grow"><b class="w-600 ellipsis" style="display:block">${cand.name}</b><small class="faint ellipsis" style="display:block">${job.title}, ${(PO.site(job.site) || {}).name}</small></div></div><div class="row t-xs faint"><span>Score ${cand.score}, via ${cand.source}</span><span class="right">${PO.rel(cand.applied)}</span></div><${Button} size="sm">Start onboarding</${Button}></div>`; })}
            ${list.length > 4 ? html`<a class="link t-sm" style="text-align:center" href=${PO.href('hiring')}>${list.length - 4} more in hiring</a>` : null}
            ${!list.length ? html`<div class="lc-empty">No accepted offers waiting.<br />New hires from hiring land here.</div>` : null}`
          : list.length ? list.map((c) => html`<${CaseCard} c=${c} onOpen=${setOpen} />`) : html`<div class="lc-empty">${k === 'Day 1' ? html`No one starts today.${next ? html`<br />Next: <b>${next.name}</b>, ${PO.date(next.start, { short: true, weekday: true })}` : ''}` : k === 'First week' ? 'No one in their first week.' : k === 'Joined' ? 'Completed cases show here for 30 days.' : 'No one in pre-boarding.'}</div>`}
        </div>`;
      })}</div>` : null}
      ${tab === 'list' ? html`<${DataTable} rows=${cases} onRow=${(c) => setOpen(c.id)} exportName="onboarding-cases" search=${(c) => c.name + ' ' + c.role} columns=${[
        { key: 'name', label: 'New hire', render: (c) => html`<span class="row">${c.p ? html`<${Avatar} p=${c.p} />` : html`<${Avatar} name=${c.name} />`}<span><b class="w-550">${c.name}</b><small class="faint" style="display:block">${c.id}</small></span></span>`, sort: (c) => c.name, csv: (c) => c.name },
        { key: 'role', label: 'Role' },
        { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', render: (c) => (PO.site(c.site) || {}).name, sort: (c) => (PO.site(c.site) || {}).name },
        { key: 'start', label: 'Start date', render: (c) => PO.date(c.start, { short: true, weekday: true }), sort: (c) => c.start },
        { key: 'stage', label: 'Stage', render: (c) => html`<${Status} s=${c.stage} />` },
        { key: 'pct', label: 'Progress', render: (c) => html`<div style="width:140px"><${Progress} value=${c.pct} tone=${c.pct === 100 ? 'green' : c.risk ? 'red' : ''} label=${c.pct + '%'} /></div>`, sort: (c) => c.pct, csv: (c) => c.pct },
        { key: 'buddy', label: 'Buddy', render: (c) => (P.byId[c.buddy] ? html`<${Who} id=${c.buddy} size="sm" sub="" />` : '—'), csv: (c) => (P.byId[c.buddy] || {}).name || '', sort: (c) => (P.byId[c.buddy] || {}).name || '' },
        { key: 'blk', label: 'Blockers', render: (c) => (c.blockers.length ? html`<${Badge} tone="red" dot>${c.blockers.map((b) => b.t).join(', ')}</${Badge}>` : html`<span class="faint">—</span>`), sort: (c) => c.blockers.length, csv: (c) => c.blockers.map((b) => b.t).join('; ') },
      ]} />` : null}
      ${tab === 'templates' ? html`<${Templates} />` : null}
      ${sel ? html`<${CaseDrawer} c=${sel} tasks=${tasks} setTasks=${setTasks} meta=${meta} setMeta=${setMeta} onClose=${() => { setOpen(null); if (query.case) PO.go('onboarding'); }} />` : null}
    `;
  }

  function CaseDrawer({ c, tasks, setTasks, meta, setMeta, onClose }) {
    const P = PO.P();
    const site = PO.site(c.site) || {};
    const [docSt] = PO.useCoState('docs.state', {});
    const docs = caseDocs(P, c, docSt);
    const sh = c.p ? PO.shiftOf(c.p.shift) : PO.shiftOf(P.current);
    const m = meta[c.id] || {};
    const toggle = (i) => { const arr = c.tasks.map((t) => t.done); arr[i] = !arr[i]; setTasks({ ...tasks, [c.id]: arr }); if (arr[i]) PO.toast(`${c.tasks[i].t}: done`, { action: { label: 'Undo', run: () => { const b = arr.slice(); b[i] = false; setTasks({ ...tasks, [c.id]: b }); } } }); };
    const setM = (patch) => setMeta({ ...meta, [c.id]: { ...m, ...patch } });
    const pendingEmp = c.tasks.filter((t) => !t.done && t.owner === 'Employee');
    const first = c.name.split(' ')[0];
    const welcome = `${P.id === 'in' ? 'Dear' : 'Hi'} ${first},\n\nWelcome to ${P.company.short}. You start on ${PO.date(c.start, { weekday: true })} at ${site.name}, shift ${sh.key} (${sh.time}). Your buddy is ${(P.byId[c.buddy] || {}).name}.\n\nBefore your first day, please sign in to the employee portal and upload ${P.id === 'in' ? 'your Aadhaar, PAN and bank passbook' : P.id === 'us' ? 'your I-9 documents and W-4' : 'your right-to-work documents and P45'}.\n\n${P.company.short} People team`;
    const buddies = P.people.filter((p) => p.site === c.site && p.role !== 'office' && p.tenureMonths >= 12).slice(0, 20);
    const kit = P.vocab.assetTypes[Object.keys(P.roles).find((k) => P.roles[k].title === c.role) || 'office'] || [];
    const kitDone = c.tasks.some((t) => /Uniform/i.test(t.t) && t.done);
    return html`<${Drawer} open size="lg" onClose=${onClose} head=${html`<div class="grow row gap-12">${c.p ? html`<${Avatar} p=${c.p} size="lg" />` : html`<${Avatar} name=${c.name} size="lg" />`}<div style="min-width:0"><div class="row"><b class="w-600 t-md">${c.name}</b><${Status} s=${c.stage} /></div><div class="faint t-sm">${c.role} at ${site.name}, ${c.start > TODAY ? 'starts' : 'started'} ${PO.date(c.start, { weekday: true })}</div></div></div>`}
      footer=${html`${c.who ? html`<${Button} kind="ghost" onClick=${() => PO.go('people/' + c.who)}>Profile</${Button}>` : null}<span class="grow"></span><${Button} onClick=${() => { setM({ reminded: TODAY }); PO.toast(pendingEmp.length ? `Reminder sent to ${first} by email and SMS: ${PO.plural(pendingEmp.length, 'task')} pending` : `Reminder sent to ${(P.byId[c.buddy] || {}).first || 'the buddy'} and HR`, { icon: 'Send' }); }}>Send reminder</${Button}>${c.stage !== 'Joined' ? html`<${Button} kind="primary" onClick=${() => { setM({ stage: 'Joined' }); setTasks({ ...tasks, [c.id]: c.tasks.map(() => true) }); PO.toast(`${first}'s onboarding marked complete`); }}>Mark complete</${Button}>` : null}`}>
      <div class="col gap-16">
        <div class="row gap-12"><div class="grow"><${Progress} value=${c.pct} tone=${c.pct === 100 ? 'green' : ''} label=${`${c.done} of ${c.tasks.length}`} /></div>${m.reminded ? html`<span class="faint t-xs">Reminded ${PO.rel(m.reminded).toLowerCase()}</span>` : null}</div>
        ${c.blockers.length ? html`<${Callout} tone="red" icon="OctagonAlert" title=${`Blocked: ${c.blockers.map((b) => b.t).join(', ')}`} action=${html`<${Button} size="sm" onClick=${() => toggle(c.tasks.indexOf(c.blockers[0]))}>Resolve</${Button}>`}>${/Uniform|ID/.test(c.blockers[0].t) ? `Stores haven't issued the kit. ${first} can't be posted at ${site.name} without an ID card.` : /POS/.test(c.blockers[0].t) ? `IT hasn't created the Square POS login, so ${first} can't ring up orders on the floor.` : `${first} can't work unsupervised until this is done.`}</${Callout}>` : null}
        <div class="grid g-2" style="align-items:start">
          <div class="col gap-12">${OWNERS.map(([o, ic, tone]) => { const list = c.tasks.map((t, i) => ({ ...t, i })).filter((t) => t.owner === o); if (!list.length) return null; const d = list.filter((t) => t.done).length; const who = o === 'Employee' ? (c.p || { name: c.name }) : o === 'HR' ? P.byId[P.hrId] : o === 'Manager' ? (site.lead && P.byId[site.lead]) || P.byId[c.buddy] : null; return html`<div class="lc-grp"><div class="lc-grp-h">${who ? html`<${Avatar} p=${who.id ? who : null} name=${who.name} size="sm" />` : html`<${PO.Chip} icon=${ic} accent=${tone} size=${13} />`}<span>${o === 'IT' ? 'IT & facilities' : o === 'Employee' ? first : o === 'HR' ? `HR, ${who.name.split(' ')[0]}` : o === 'Manager' && who ? `Manager, ${who.name.split(' ')[0]}` : o}</span><span class="right faint t-xs w-500">${d}/${list.length}</span></div>
            <${Checklist} items=${list.map((t) => ({ t: t.t, done: t.done, meta: t.done ? null : o === 'Employee' ? (c.start > TODAY ? `due ${PO.date(addDays(c.start, -1), { short: true })}` : 'overdue') : o === 'HR' ? 'Meera' : null, right: t.blocker && !t.done ? html`<${Badge} tone="red">Blocked</${Badge}>` : null }))} onToggle=${(k) => toggle(list[k].i)} /></div>`; })}</div>
          <div class="col gap-12">
            <${Card} icon="FolderOpen" accent="teal" title="Documents" sub=${`${docs.filter((d) => d.status === 'Verified').length}/${docs.length} verified`}>
              <div class="col" style="gap:8px">${docs.map((d) => html`<div class="row t-sm"><span class="grow ellipsis">${d.name}</span><${Status} s=${d.status} /></div>`)}</div>
            </${Card}>
            <${Card} icon="Mail" accent="blue" title="Welcome email" sub="Sent with an SMS link to the employee portal" actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => { setM({ resent: TODAY }); PO.toast(`Welcome email resent to ${first}`, { icon: 'Send' }); }}>Resend</${Button}>`}>
              <div class="lc-bubble"><div class="lc-mailh"><span>From</span><b class="w-500">${P.msg.name}</b><span>To</span><span class="ellipsis" style="color:var(--text)">${c.p && c.p.email ? c.p.email : first.toLowerCase() + ' (personal email)'}</span><span>Subject</span><b class="w-600">Welcome to ${P.company.short}: your first day</b></div>${welcome}</div>
              <div class="row t-xs faint mt-8">${m.resent ? `Resent ${PO.rel(m.resent).toLowerCase()}` : `Opened ${PO.date(addDays(c.start, -Math.min(6, Math.max(1, c.daysTo + 6))), { short: true })} 09:14`}</div>
            </${Card}>
            <${Card} icon="HeartHandshake" accent="rose" title="Buddy and first shift">
              <div class="col gap-12">
                <div class="row"><${Who} id=${c.buddy} /><span class="right"><select class="select" style="width:150px;height:28px" value=${c.buddy} onChange=${(e) => { setM({ buddy: e.target.value }); PO.toast(`${P.byId[e.target.value].name} is now ${first}'s buddy`, { icon: 'HeartHandshake' }); }}>${[P.byId[c.buddy], ...buddies.filter((b) => b.id !== c.buddy)].filter(Boolean).map((b) => html`<option value=${b.id}>${b.name}</option>`)}</select></span></div>
                <${KV} items=${[['First shift', `${PO.date(c.start, { short: true, weekday: true })}, ${sh.time}`], [P.id === 'us' ? 'Location' : 'Site', site.name], ['Report to', site.lead && P.byId[site.lead] ? P.byId[site.lead].name : P.byId[P.hrId].name], ['Kit', kit.length ? html`<span>${kit.join(', ')} ${kitDone ? html`<${Status} s="Done" />` : html`<${Status} s="Pending" />`}</span>` : '—']]} />
                <div class="row">${m.roster || c.stage === 'Joined' || c.stage === 'First week' ? html`<${Status} s="Scheduled" />` : html`<${Button} size="sm" onClick=${() => { setM({ roster: true }); PO.toast(`${first} added to the ${site.name} roster from ${PO.date(c.start, { short: true })}`, { icon: 'CalendarRange' }); }}>Add to roster</${Button}>`}<${Button} size="sm" kind="ghost" onClick=${() => PO.go('assets')}>Issue kit</${Button}></div>
              </div>
            </${Card}>
          </div>
        </div>
      </div>
    </${Drawer}>`;
  }

  function Templates() {
    const P = PO.P();
    const [edits, setEdits] = PO.useCoState('onboarding.templates', {});
    const [open, setOpen] = useState(null);
    const base = P.onboarding[0].tasks.map((t) => t.t);
    const extra = {
      guard: ['PSARA training certificate', 'Post orders signed'], lady: ['PSARA training certificate', 'POSH awareness session'], hk: ['Housekeeping SOP walkthrough'], tech: ['Electrical safety induction', 'Tool kit issued'], sup: ['Client introduction at site', 'Manager portal training'], office: ['Laptop and email account', 'Payroll system access'],
      barista: ['Espresso bar training (2 shifts)'], baker: ['Allergen and food safety walkthrough'], lead: ['Cash handling sign-off', 'Opening and closing checklist'], porter: ['Dish machine safety'], driver: ['Driving record (MVR) check', 'Vehicle inspection walkthrough'],
      cleaner: ['Site induction with supervisor'], domestic: ['NHS infection control module', 'Ward induction'], spec: ['Working at height certificate', 'Harness inspection'],
    };
    const roleKeys = Object.keys(P.roles);
    const tpls = roleKeys.map((k) => {
      const list = (edits[k] && edits[k].tasks) || [...base, ...(extra[k] || [])];
      const baseOwner = Object.fromEntries(P.onboarding[0].tasks.map((t) => [t.t, ownerOf(t)]));
      const owners = list.map((x) => baseOwner[x] || (/kit|laptop|login|access|issued/i.test(x) ? 'IT' : 'Manager'));
      const used = P.people.filter((p) => p.role === k && p.tenureMonths <= 12).length + P.onboarding.filter((c) => c.role === P.roles[k].title).length;
      return { k, name: P.roles[k].title, tasks: list, owners, used, auto: ['Send welcome email', P.id === 'in' ? 'Generate UAN & ESI IP' : P.id === 'us' ? 'File Texas new-hire report' : 'Send starter checklist', 'Add to roster', 'Create employee portal login'] };
    });
    const sel = tpls.find((t) => t.k === open);
    return html`<div class="col gap-12">
      <p class="muted">${PO.plural(tpls.length, 'template')} for ${P.company.country}, one per role. Tasks are split between ${OWNERS.map((o) => o[0]).join(', ')}, with due dates relative to the start date.</p>
      <${DataTable} rows=${tpls} rowKey=${(t) => t.k} onRow=${(t) => setOpen(t.k)} columns=${[
        { key: 'name', label: 'Role', render: (t) => html`<b class="w-550">${t.name}</b><div class="faint t-xs ellipsis" style="max-width:360px">${t.tasks.slice(0, 3).join(', ')}${t.tasks.length > 3 ? ` and ${t.tasks.length - 3} more` : ''}</div>`, sort: (t) => t.name },
        { key: 'tasks', label: 'Tasks', align: 'r', render: (t) => html`<span class="tnum">${t.tasks.length}</span>`, sort: (t) => t.tasks.length, csv: (t) => t.tasks.length },
        { key: 'split', label: 'Owners', sort: false, render: (t) => html`<span class="t-sm muted">${OWNERS.map(([o]) => [o, t.owners.filter((x) => x === o).length]).filter(([, n]) => n).map(([o, n]) => `${o} ${n}`).join(', ')}</span>`, csv: false },
        { key: 'auto', label: 'Automations', align: 'r', render: (t) => html`<span class="tnum">${t.auto.length}</span>`, sort: (t) => t.auto.length },
        { key: 'used', label: 'Hires this year', align: 'r', render: (t) => html`<span class="tnum">${t.used}</span>`, sort: (t) => t.used },
        { key: 'act', label: '', sort: false, csv: false, render: (t) => html`<span class="row" style="gap:4px;justify-content:flex-end" onClick=${(e) => e.stopPropagation()}><${Button} size="sm" kind="ghost" onClick=${() => PO.toast(`“${t.name}” duplicated as a draft`)}>Duplicate</${Button}><${Button} size="sm" onClick=${() => setOpen(t.k)}>Edit</${Button}></span>` },
      ]} />
      ${sel ? html`<${TemplateDrawer} t=${sel} onClose=${() => setOpen(null)} onSave=${(tasks) => { setEdits({ ...edits, [sel.k]: { tasks } }); setOpen(null); PO.toast(`${sel.name} template saved. It applies to new hires from today.`); }} />` : null}
    </div>`;
  }
  function TemplateDrawer({ t, onClose, onSave }) {
    const P = PO.P();
    const [list, setList] = useState(t.tasks);
    const [nt, setNt] = useState('');
    return html`<${Drawer} open title=${`${t.name} onboarding`} sub=${`${P.company.country} template`} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" onClick=${() => onSave(list)}>Save template</${Button}>`}>
      <div class="col gap-12">
        ${list.map((x, i) => html`<div class="row" style="padding:8px 10px;border:1px solid var(--border);border-radius:var(--r)"><${Icon} n="GripVertical" size=${14} cls="faint" /><span class="grow">${x}</span><span class="faint t-xs">${i < 3 ? 'Before day 1' : i < 7 ? 'Day 1' : 'First week'}</span><${IconButton} size="sm" icon="Trash2" title="Remove task" onClick=${() => setList(list.filter((_, k) => k !== i))} /></div>`)}
        <div class="row"><input class="input" placeholder="Add a task, e.g. Fire drill briefing" value=${nt} onInput=${(e) => setNt(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && nt.trim()) { setList([...list, nt.trim()]); setNt(''); } }} /><${Button} disabled=${!nt.trim()} onClick=${() => { setList([...list, nt.trim()]); setNt(''); }}>Add</${Button}></div>
        <${Card} title="Automations"><div class="col" style="gap:8px">${t.auto.map((a) => html`<div class="row t-sm"><${Switch} on=${true} onChange=${() => PO.toast('Automation settings are in Settings → Notifications')} /><span>${a}</span></div>`)}</div></${Card}>
      </div>
    </${Drawer}>`;
  }

  /* =====================================================================
     Offboarding: settlement engine
     ===================================================================== */
  const NOTICE = { in: 30, us: 14, uk: 7 };
  const r0 = Math.round, r2 = (x) => Math.round(x * 100) / 100;
  function nextPayday(P, from) { const base = P.id === 'us' ? '2026-10-09' : P.id === 'uk' ? '2026-10-09' : '2026-10-07'; const step = P.id === 'us' ? 14 : P.id === 'uk' ? 28 : null; if (!step) { let d = base; while (d < from) d = `${+d.slice(0, 4) + (d.slice(5, 7) === '12' ? 1 : 0)}-${String((+d.slice(5, 7) % 12) + 1).padStart(2, '0')}-07`; return d; } let d = base; while (d < from) d = addDays(d, step); return d; }
  function deadlineOf(P, e) {
    if (P.id === 'in') return { date: PX().addWorkingDays(P, e.lastDay, 2), rule: 'Code on Wages, s.17(2): full and final settlement within 2 working days of the last working day. In force from 21 Nov 2025.' };
    if (P.id === 'us') return e.reason === 'Terminated' ? { date: addDays(e.lastDay, 6), rule: 'Texas Payday Law: an employee who is fired must be paid in full within 6 calendar days of discharge.' } : { date: nextPayday(P, e.lastDay), rule: 'Texas Payday Law: an employee who quits must be paid in full by the next regularly scheduled payday.' };
    return { date: nextPayday(P, e.lastDay), rule: 'Final pay goes on the next normal payday with the P45, reported to HMRC through RTI (Full Payment Submission with a leaving date).' };
  }
  function countdown(P, date) {
    const wd = (a, b) => { let n = 0; let d = a; while (d < b) { d = addDays(d, 1); const w = PX().dow(d); if (w !== 0 && (P.id === 'in' || w !== 6) && !P.holidays.some((h) => h.date === d)) n++; } return n; };
    if (date === TODAY) return { n: 0, label: 'Due today', tone: 'amber' };
    if (date < TODAY) { const n = PX().daysBetween(date, TODAY); return { n: -n, label: `Overdue by ${PO.plural(n, 'day')}`, tone: 'red' }; }
    const n = P.id === 'in' ? wd(TODAY, date) : PX().daysBetween(TODAY, date);
    return { n, label: `${PO.plural(n, P.id === 'in' ? 'working day' : 'day')} left`, tone: n <= 2 ? 'amber' : 'blue' };
  }

  /** Builds the settlement lines. ctx.base is the free wage parameter (IN monthly gross, US/UK final hours). */
  function lines(P, e, p, ctx) {
    const L = [];
    const earn = (label, sub, amt, muted) => L.push({ label, sub, amt, kind: 'earn', muted });
    const ded = (label, sub, amt) => amt > 0 && L.push({ label, sub, amt, kind: 'ded' });
    const ld = e.lastDay;
    const mon = (iso) => PO.MONS[+iso.slice(5, 7) - 1];
    if (P.id === 'in') {
      const G = ctx.G, B = ctx.B;
      const sal = [];
      if (ctx.sepHeld) sal.push({ label: `September 2026 (held for F&F)`, days: ctx.sepDays, of: 30 });
      if (ld >= '2026-10-01') sal.push({ label: `1–${+ld.slice(8)} October 2026`, days: +ld.slice(8), of: 31 });
      sal.forEach((s) => earn(`Salary, ${s.label}`, `${s.days} of ${s.of} days`, r0((G * s.days) / s.of)));
      const daily = B / 26;
      earn('Leave encashment', `${ctx.el} days earned leave × ${PO.money(r0(daily))} (basic ÷ 26)`, r0(ctx.el * daily));
      const yrs = p.tenureMonths / 12, completed = Math.floor(yrs) + (p.tenureMonths % 12 >= 6 ? 1 : 0);
      earn('Gratuity', yrs >= 5 ? `15/26 × ${PO.money(B)} × ${completed} years, Payment of Gratuity Act` : `Not eligible: ${PO.tenure(p.tenureMonths)} of service, 5 years needed`, yrs >= 5 ? r0((15 / 26) * B * completed) : 0, yrs < 5);
      const fy = Math.max(1, +ld.slice(5, 7) - 3);
      earn('Statutory bonus, pro rata', `8.33% × ${PO.money(Math.min(B, 7000))} × ${fy} months (Apr–${mon(ld)}), Payment of Bonus Act`, r0(0.0833 * Math.min(B, 7000) * fy));
      const salTotal = sal.reduce((t, s) => t + (G * s.days) / s.of, 0);
      const basicEarned = sal.reduce((t, s) => t + (Math.min(B, 25000) * s.days) / s.of, 0);
      ded('Provident fund', '12% of basic earned', r0(basicEarned * 0.12));
      if (G <= 21000) ded('ESI', '0.75% of wages', Math.ceil(salTotal * 0.0075));
      ded('Professional tax', `Maharashtra, ${PO.plural(sal.length, 'month')}`, 200 * sal.length);
      if (ctx.shortfall) ded('Notice shortfall recovery', `${ctx.shortfall} of ${NOTICE.in} days not served × ${PO.money(r0(G / 30))}`, r0((G / 30) * ctx.shortfall));
      if (ctx.assetDed) ded('Unreturned assets', ctx.assetNames, ctx.assetDed);
      if (ctx.advance) ded('Salary advance outstanding', 'Recovered in full on exit', ctx.advance);
    } else if (P.id === 'us') {
      const rate = ctx.rate, H = ctx.base;
      earn('Final hours', `${PO.num(H, 2)} h × ${PO.money(rate, { cents: true })}, ${PO.date(ctx.from, { short: true })} – ${PO.date(ld, { short: true })}`, r2(H * rate));
      if (ctx.tips) earn('Card tips owed', 'Final period tips through payroll', ctx.tips);
      earn('PTO payout', ctx.ptoPay ? `${ctx.pto} h × ${PO.money(rate, { cents: true })}. Policy pays up to 40 h with 2 weeks' notice` : `Not paid: ${e.reason === 'Terminated' ? 'policy excludes terminations' : 'no accrued balance'}`, ctx.ptoPay ? r2(ctx.pto * rate) : 0, !ctx.ptoPay);
      const gross = L.reduce((t, x) => t + x.amt, 0);
      const k = ctx.k401 ? r2(gross * 0.04) : 0;
      if (k) ded('401(k), 4%', 'Pre-tax', k);
      ded('Federal income tax', 'Per W-4 on file', r2((gross - k) * 0.07));
      ded('Social Security, 6.2%', 'FICA', r2(gross * 0.062));
      ded('Medicare, 1.45%', 'FICA', r2(gross * 0.0145));
      if (ctx.assetDed) ded('Unreturned items', `${ctx.assetNames}; signed deduction authorization on file`, ctx.assetDed);
    } else {
      const rate = ctx.rate, H = ctx.base;
      earn('Final pay', `${PO.num(H, 2)} h × ${PO.money(rate, { cents: true })}, ${PO.date(ctx.from, { short: true })} – ${PO.date(ld, { short: true })}`, r2(H * rate));
      earn('Holiday owed', `${ctx.holDays} days accrued, not taken × ${PO.money(r2(7.5 * rate), { cents: true })} (7.5 h)`, r2(ctx.holDays * 7.5 * rate));
      const gross = L.reduce((t, x) => t + x.amt, 0);
      const pen = r2(Math.max(0, gross - 480) * 0.05);
      ded('Income tax (PAYE)', 'Tax code 1257L, week 1/month 1 on the P45', r2(Math.max(0, gross - pen - 966.92) * 0.2));
      ded('National Insurance', 'Category A, 8%', r2(Math.max(0, gross - 967) * 0.08));
      ded('Pension, 5%', 'NEST, qualifying earnings', pen);
      if (ctx.assetDed) ded('Unreturned uniform', `${ctx.assetNames}; can't take pay below the NLW`, ctx.assetDed);
    }
    const g = L.filter((x) => x.kind === 'earn').reduce((t, x) => t + x.amt, 0);
    const d = L.filter((x) => x.kind === 'ded').reduce((t, x) => t + x.amt, 0);
    return { L, gross: P.id === 'in' ? g : r2(g), ded: P.id === 'in' ? d : r2(d), net: P.id === 'in' ? g - d : r2(g - d) };
  }

  function settlement(P, e, st) {
    const p = PX().exitPerson(P, e);
    const r = PO.seeded('fnf' + P.id + e.id);
    const assets = PX().exitAssets(P, e);
    const defReturned = (a, i) => e.lastDay < TODAY ? !(i === assets.length - 1 && assets.length > 2) : false;
    const returned = (a, i) => (st.assets && st.assets[a.tag] != null ? st.assets[a.tag] : defReturned(a, i));
    const due = e.lastDay <= TODAY;
    const missing = assets.filter((a, i) => !returned(a, i));
    const assetDed = due ? missing.reduce((t, a) => t + a.value, 0) : 0;
    const defMissing = assets.filter((a, i) => !defReturned(a, i));
    const defDed = due ? defMissing.reduce((t, a) => t + a.value, 0) : 0;
    const ctx = { assetDed, assetNames: missing.map((a) => a.name).join(', ') };
    const from = P.id === 'us' ? (e.lastDay <= '2026-10-04' ? '2026-09-21' : '2026-10-05') : P.id === 'uk' ? (e.lastDay <= '2026-10-04' ? '2026-09-07' : '2026-10-05') : null;
    if (P.id === 'in') {
      const s = p.pay && p.pay.structure;
      ctx.sepHeld = p.former; ctx.sepDays = e.reason === 'Terminated' ? 18 : 30;
      ctx.el = p.leave && p.leave.el ? p.leave.el.balance : r.int(5, 14);
      ctx.defShort = e.shortfall != null ? e.shortfall : P.exits.indexOf(e) === 0 ? 15 : 0;
      ctx.shortfall = st.shortfall != null ? st.shortfall : ctx.defShort;
      ctx.advance = ((P.advances || []).find((a) => a.who === p.id) || {}).amt || 0;
      if (s) { ctx.G = s.total; ctx.B = s.basic; }
    } else {
      ctx.rate = (P.roles[p.role] || {}).rate || 15; ctx.from = from;
      if (P.id === 'us') { ctx.k401 = !!p.k401; ctx.pto = Math.min(40, p.leave && p.leave.pto ? p.leave.pto.balance : r.int(8, 40)); ctx.ptoPay = e.reason !== 'Terminated' && ctx.pto > 0; ctx.tips = p.role === 'barista' ? r2(r.int(40, 120) + 0.5) : 0; }
      else { const accrued = Math.round(28 * (PX().daysBetween('2026-01-01', e.lastDay) / 365)); ctx.holDays = p.leave && p.leave.hol ? Math.max(0, accrued - p.leave.hol.taken) : r.int(1, 3); }
    }
    // Seeded exits carry an agreed settlement amount: solve the free wage parameter so the default state reproduces it.
    let adjust = 0;
    const target = e.settlement;
    if (target != null && !e.added) {
      const run = (b) => { const c = { ...ctx, shortfall: ctx.defShort || 0, assetDed: defDed, assetNames: defMissing.map((a) => a.name).join(', ') }; if (P.id === 'in') { c.G = b; c.B = Math.round(b * 0.5); } else c.base = b; return lines(P, e, p, c).net; };
      if (P.id !== 'in' || !ctx.G) {
        let lo = 0, hi = P.id === 'in' ? 200000 : 400;
        for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (run(mid) < target) lo = mid; else hi = mid; }
        const b = P.id === 'in' ? Math.round(lo / 50) * 50 : Math.round(lo * 100) / 100;
        if (P.id === 'in') { ctx.G = b; ctx.B = Math.round(b * 0.5); } else ctx.base = b;
        adjust = P.id === 'in' ? target - run(b) : r2(target - run(b));
      } else adjust = target - run(ctx.G);
    } else if (P.id !== 'in') {
      const days = Math.max(0, PX().daysBetween(from, e.lastDay) + 1);
      ctx.base = Math.round((days * 5) / 7) * 8;
    }
    if (P.id === 'in' && !ctx.G) { ctx.G = 18000; ctx.B = 9000; }
    const res = lines(P, e, p, ctx);
    if (adjust) { const first = res.L.find((x) => x.kind === 'earn'); first.amt = P.id === 'in' ? first.amt + adjust : r2(first.amt + adjust); res.gross += adjust; res.net = P.id === 'in' ? res.net + adjust : r2(res.net + adjust); }
    return { ...res, p, ctx, assets, returned, missing, due };
  }

  /* exit history for KPIs and charts (module-local, deterministic) */
  function history(P) {
    const r = PO.seeded('exhist' + P.id);
    const per = { in: [5, 9], us: [2, 4], uk: [2, 4] }[P.id];
    const reasons = P.id === 'in' ? [['Better pay elsewhere', 31], ['Moved back to native place', 22], ['Absconding', 14], ['Night shifts', 12], ['Higher studies', 8], ['Health', 7], ['Other', 6]] : P.id === 'us' ? [['Back to school', 28], ['Better pay elsewhere', 24], ['Schedule / hours', 18], ['Relocation', 14], ['Terminated', 9], ['Other', 7]] : [['New job closer to home', 26], ['Better pay elsewhere', 22], ['Returning abroad', 17], ['Hours reduced', 14], ['Health', 11], ['Other', 10]];
    const labels = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const counts = labels.map((_, i) => (i === labels.length - 1 ? P.exits.filter((e) => e.lastDay >= '2026-10-01').length : r.int(per[0], per[1])));
    const invol = counts.map((n, i) => (P.id === 'in' ? Math.round(n * 0.18) : n > 1 && i % 3 === 1 ? 1 : 0));
    const vol = counts.map((n, i) => n - invol[i]);
    return { labels, counts, vol, invol, reasons, total: counts.reduce((t, n) => t + n, 0) };
  }

  function useExits() {
    const P = PO.P();
    const [added] = PO.useCoState('offboarding.added', []);
    const [st, setSt] = PO.useCoState('offboarding.state', {});
    const exits = useMemo(() => [...P.exits, ...added].map((e) => {
      const s = st[e.id] || {};
      const S = settlement(P, e, s);
      const paid = !!s.paid;
      const status = paid ? 'Paid' : e.lastDay <= TODAY ? 'F&F due' : 'Serving notice';
      const dl = deadlineOf(P, e);
      return { ...e, S, st: s, paid, status, dl, cd: countdown(P, dl.date), p: S.p };
    }), [P.id, added, st]);
    return { exits, st, setSt };
  }

  /* =====================================================================
     Offboarding page
     ===================================================================== */
  function Offboarding({ query }) {
    const P = PO.P();
    const { exits, st, setSt } = useExits();
    const [added, setAdded] = PO.useCoState('offboarding.added', []);
    const [open, setOpen] = useState(query.case || null);
    const [startFor, setStartFor] = useState(query.new || null);
    useEffect(() => { if (query.new) setStartFor(query.new); }, [query.new]);
    const H = useMemo(() => history(P), [P.id]);
    const avgHead = P.payHistory.reduce((t, h) => t + h.heads, 0) / P.payHistory.length;
    const attr = H.total / avgHead;
    const month = exits.filter((e) => e.lastDay >= '2026-10-01' && e.lastDay <= '2026-10-31');
    const due = exits.filter((e) => e.status === 'F&F due');
    const sel = exits.find((e) => e.id === open);
    const unret = exits.reduce((t, e) => t + (e.S.due ? e.S.missing.length : 0), 0);
    return html`
      <${PageHeader} title="Exits & F&F" sub=${`${PO.plural(exits.filter((e) => !e.paid).length, 'open exit')}. ${P.id === 'in' ? 'Full and final settlement is due within 2 working days of the last day.' : P.id === 'us' ? 'Final pay follows the Texas Payday Law.' : 'Final pay and the P45 go out on the next payday.'}`} actions=${html`<${Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" title="More" bordered />`} items=${[{ label: 'Export exits (CSV)', icon: 'Download', onClick: () => PO.exportCsv('exits', [['Exit ID', 'Name', 'Reason', 'Last day', 'Settlement', 'Deadline', 'Status'], ...exits.map((e) => [e.id, e.name, e.reason, e.lastDay, e.S.net, e.dl.date, e.status])]) }, { label: 'Assets to recover', icon: 'PackageX', onClick: () => PO.go('assets?tab=overdue') }]} /><${Button} kind="primary" onClick=${() => setStartFor('pick')}>Start an exit</${Button}>`} />
      ${due.some((e) => e.cd.n <= 0) ? html`<div style="margin-bottom:16px"><${Callout} tone=${due.some((e) => e.cd.n < 0) ? 'red' : 'amber'} icon="AlarmClock" title=${(() => { const l = due.filter((e) => e.cd.n <= 0).map((e) => `${e.name} is ${e.cd.label.toLowerCase()}`); return l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l[0]; })()} action=${html`<${Button} size="sm" onClick=${() => setOpen(due.sort((a, b) => a.cd.n - b.cd.n)[0].id)}>Review settlement</${Button}>`}>${P.id === 'in' ? 'Under the Labour Codes, F&F must be paid within 2 working days of the last working day. Late payment can attract a penalty of up to ₹50,000 for a first offence.' : P.id === 'us' ? 'Late final pay under the Texas Payday Law can lead to a wage claim with the Texas Workforce Commission.' : 'Pay the final salary and issue the P45 on the next payday.'}</${Callout}></div>` : null}
      <div style="margin-bottom:24px"><${PO.KpiStrip} items=${[
        { label: P.id === 'in' ? 'F&F due' : 'Final pay due', icon: 'Wallet', accent: 'amber', value: due.length, alert: due.some((e) => e.cd.n <= 0), sub: due.length ? `${PO.money(due.reduce((t, e) => t + e.S.net, 0))} to pay` : 'All settled', bar: due.length ? [{ v: due.filter((e) => e.cd.n > 0).length, k: 'ok', title: 'on time' }, { v: due.filter((e) => e.cd.n === 0).length, k: 'warn', title: 'due today' }, { v: due.filter((e) => e.cd.n < 0).length, k: 'bad', title: 'overdue' }] : null },
        { label: 'Serving notice', icon: 'DoorOpen', accent: 'blue', faces: exits.filter((e) => e.status === 'Serving notice' && e.p && P.byId[e.p.id]).map((e) => e.p.id), value: exits.filter((e) => e.status === 'Serving notice').length, sub: `${month.length} leaving this month` },
        { label: 'Attrition, 12 months', icon: 'TrendingDown', accent: 'violet', value: PO.pct(attr, 1), sub: `${H.total} exits, against ${P.id === 'in' ? 'about 45% for the industry' : P.id === 'us' ? 'about 75% in food service' : 'about 50% in cleaning'}` },
        { label: 'Assets to recover', icon: 'PackageX', accent: 'teal', value: unret, href: PO.href('assets?tab=overdue'), sub: unret ? 'Deducted from the settlement' : 'All returned' },
      ]} /></div>
      <${DataTable} rows=${exits} onRow=${(e) => setOpen(e.id)} search=${(e) => e.name + ' ' + e.why} initialSort=${{ key: 'last', dir: 'desc' }} columns=${[
        { key: 'name', label: 'Employee', render: (e) => html`<${Who} p=${e.p} link=${!e.p.former} sub=${`${e.p.title}, ${(PO.site(e.p.site) || {}).name}`} />`, sort: (e) => e.name, csv: (e) => e.name },
        { key: 'reason', label: 'Type', render: (e) => html`<span class="row" style="gap:8px"><${PO.Chip} icon=${e.reason === 'Resigned' ? 'LogOut' : e.reason === 'Terminated' ? 'Ban' : 'CalendarX'} accent=${e.reason === 'Terminated' ? 'red' : e.reason === 'Resigned' ? 'blue' : 'amber'} size=${13} /><span style=${e.reason === 'Terminated' ? 'color:var(--red)' : ''}>${e.reason}</span></span>`, csv: (e) => e.reason },
        { key: 'why', label: 'Reason', render: (e) => html`<span class="ellipsis muted" style="display:block;max-width:200px">${e.why}</span>` },
        { key: 'last', label: 'Last day', render: (e) => html`<div style="white-space:nowrap">${PO.date(e.lastDay, { short: true, weekday: true })}</div><div class="faint t-xs">${PO.tenure(e.p.tenureMonths)} service</div>`, sort: (e) => e.lastDay, csv: (e) => e.lastDay },
        { key: 'fnf', label: P.id === 'in' ? 'F&F amount' : 'Final pay', align: 'r', render: (e) => html`<b class="tnum w-600">${PO.money(e.S.net)}</b>`, sort: (e) => e.S.net, csv: (e) => e.S.net },
        { key: 'dl', label: 'Deadline', render: (e) => (e.paid ? html`<span class="faint t-sm">Paid ${PO.date(e.st.paidOn, { short: true })}</span>` : html`<div style="white-space:nowrap">${PO.date(e.dl.date, { short: true })}</div><div class="t-xs" style=${e.cd.tone === 'red' ? 'color:var(--red)' : e.cd.tone === 'amber' ? 'color:var(--amber)' : 'color:var(--text-3)'}>${e.cd.label}</div>`), sort: (e) => e.dl.date, csv: (e) => e.dl.date },
        { key: 'status', label: 'Status', render: (e) => html`<${Status} s=${e.status} />` },
      ]} />
      <div class="grid g-main" style="margin-top:24px">
        <${Card} icon="ChartColumn" accent="blue" title="Exits by month" sub="Last 12 months"><${PO.Charts.Bars} labels=${H.labels} series=${[{ name: 'Resigned', data: H.vol }, { name: P.id === 'in' ? 'Terminated or absconded' : 'Terminated', data: H.invol, color: 'var(--chart-5)' }]} stacked height=${190} /></${Card}>
        <${Card} icon="MessageSquareQuote" accent="violet" title="Top reasons" sub="Exit interviews, 12 months"><${PO.Charts.HBars} data=${H.reasons.slice(0, 5).map(([l, v]) => ({ label: l, value: v, sub: '' }))} fmt=${(v) => v + '%'} /></${Card}>
      </div>
      ${sel ? html`<${ExitDrawer} e=${sel} st=${st} setSt=${setSt} onClose=${() => setOpen(null)} />` : null}
      ${startFor ? html`<${StartExit} pid=${startFor === 'pick' ? null : startFor} added=${added} onClose=${() => { setStartFor(null); if (query.new) PO.go('offboarding'); }} onCreate=${(rec) => { setAdded([...added, rec]); setStartFor(null); setOpen(rec.id); PO.toast(`Exit started for ${rec.name}. Last day ${PO.date(rec.lastDay, { short: true })}.`, { icon: 'DoorOpen' }); }} />` : null}
    `;
  }

  function StartExit({ pid, added, onClose, onCreate }) {
    const P = PO.P();
    const [who, setWho] = useState(pid || '');
    const [padded] = PO.useCoState('people.added', []);
    const p = who ? PX().find(P, who, padded) : null;
    const notice = P.id === 'in' ? (p && (p.role === 'office' || p.role === 'sup') ? 60 : 30) : P.id === 'us' ? 14 : Math.max(7, Math.min(84, Math.floor(((p && p.tenureMonths) || 12) / 12) * 7));
    const [type, setType] = useState('Resigned');
    const [resigned, setResigned] = useState(TODAY);
    const [last, setLast] = useState(addDays(TODAY, notice));
    const [why, setWhy] = useState(P.id === 'in' ? 'Better pay elsewhere' : P.id === 'us' ? 'Back to school' : 'New job closer to home');
    const [rehire, setRehire] = useState(true);
    useEffect(() => setLast(addDays(resigned, type === 'Resigned' ? notice : 0)), [who, type, resigned]);
    const served = Math.max(0, PX().daysBetween(resigned, last));
    const short = type === 'Resigned' ? Math.max(0, notice - served) : 0;
    const exists = (pid) => P.exits.some((e) => e.who === pid) || added.some((e) => e.who === pid);
    const reasons = P.id === 'in' ? ['Better pay elsewhere', 'Moving back to native place', 'Night shifts', 'Higher studies', 'Health', 'Absconding', 'Misconduct', 'Other'] : P.id === 'us' ? ['Back to school', 'Better pay elsewhere', 'Schedule / hours', 'Relocation', 'Performance', 'Other'] : ['New job closer to home', 'Better pay elsewhere', 'Returning abroad', 'Hours reduced', 'Health', 'Other'];
    const create = () => {
      const id = 'EXT-' + (60 + added.length);
      const tasks = P.exits[0].tasks.map((t, k) => ({ t: t.t, done: k === 0 }));
      onCreate({ id, name: p.name, who: p.id, reason: type, lastDay: last, resigned, why, site: p.site, tasks, settlement: null, added: true, shortfall: short, rehire });
    };
    return html`<${Drawer} open title="Start an exit" sub=${p ? `${p.name}, ${p.title}` : 'Choose the employee who is leaving'} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!p || exists(p.id)} onClick=${create}>Start exit</${Button}>`}>
      <div class="col gap-16">
        ${pid && p ? html`<div class="row gap-12 card" style="padding:12px"><${Avatar} p=${p} /><div class="grow"><b class="w-600">${p.name}</b><div class="faint t-sm">${p.title} at ${(PO.site(p.site) || {}).name}, ${PO.tenure(p.tenureMonths)} service</div></div><${Status} s=${p.status} /></div>` : html`<${Field} label="Employee"><select class="select" value=${who} onChange=${(e) => setWho(e.target.value)}><option value="">Choose a person</option>${P.people.filter((x) => x.id !== P.topId).map((x) => html`<option value=${x.id}>${x.name}, ${x.title}, ${(PO.site(x.site) || {}).name}</option>`)}</select></${Field}>`}
        ${p && exists(p.id) ? html`<${Callout} tone="amber" icon="Info" title="An exit is already open">Open it from the exits list.</${Callout}>` : null}
        <${Field} label="Exit type"><${Segmented} options=${(P.id === 'in' ? ['Resigned', 'Terminated', 'Retired', 'Absconding'] : ['Resigned', 'Terminated', 'End of contract']).map((x) => [x, x])} value=${type} onChange=${setType} /></${Field}>
        <div class="grid g-2"><${Field} label=${type === 'Resigned' ? 'Resignation date' : 'Notice date'}><input class="input" type="date" value=${resigned} onInput=${(e) => setResigned(e.target.value)} /></${Field}><${Field} label="Last working day" hint=${type === 'Resigned' ? `Notice period: ${notice} days` : ''}><input class="input" type="date" value=${last} onInput=${(e) => setLast(e.target.value)} /></${Field}></div>
        ${short ? html`<${Callout} tone="amber" icon="Hourglass" title=${`${short} days of notice not served`}>${P.id === 'in' ? 'Recover the shortfall from F&F, or waive it in the settlement.' : P.id === 'uk' ? 'Contractual notice is short. You can agree a shorter period in writing.' : 'Texas is at-will, so no recovery applies. PTO payout may be lost under your policy.'}</${Callout}>` : null}
        <${Field} label="Main reason"><${PO.Select} value=${why} onChange=${setWhy} options=${reasons} /></${Field}>
        <${Switch} on=${rehire} onChange=${setRehire} label="Eligible for rehire" />
        ${p ? html`<${Card} title="What happens next"><div class="col" style="gap:8px">${[['Package', `Asset return list: ${P.assets.filter((a) => a.who === p.id).map((a) => a.name).join(', ') || 'nothing issued'}`], ['MessageCircle', 'Exit interview form shared to the employee portal 3 days before the last day'], ['Banknote', P.id === 'in' ? 'F&F computed and due within 2 working days of the last day' : P.id === 'us' ? 'Final pay scheduled under the Texas Payday Law' : 'Final pay and P45 on the next payday'], ['CalendarX', 'Removed from the roster after the last day']].map(([ic, t]) => html`<div class="row t-sm" style="align-items:flex-start"><${Icon} n="Check" size=${14} style="color:var(--brand);margin-top:2px;flex:none" /><span>${t}</span></div>`)}</div></${Card}>` : null}
      </div>
    </${Drawer}>`;
  }

  function ExitDrawer({ e, st, setSt, onClose }) {
    const P = PO.P();
    const [tab, setTab] = useState('settle');
    const [letter, setLetter] = useState(null);
    const [ask, confirmEl] = PO.useConfirm();
    const s = st[e.id] || {};
    const set = (patch) => setSt({ ...st, [e.id]: { ...s, ...patch } });
    const S = e.S;
    const p = S.p;
    const first = e.name.split(' ')[0];
    const payTask = (t) => /F&F paid|Final pay|Final hours/i.test(t.t);
    const tasks = e.tasks.map((t, i) => ({ ...t, done: s.tasks && s.tasks[i] != null ? s.tasks[i] : payTask(t) ? (e.paid || (t.done && !(e.status === 'F&F due'))) : t.done }));
    const toggleTask = (i) => { const arr = tasks.map((t) => t.done); arr[i] = !arr[i]; set({ tasks: arr }); };
    const lettersList = P.id === 'in' ? [['relieving', 'Relieving letter'], ['experience', 'Experience letter']] : P.id === 'us' ? [['separation', 'Separation letter'], ['verification', 'Employment verification']] : [['p45', 'P45 cover letter'], ['reference', 'Reference letter']];
    const pay = () => ask({ title: `Approve and pay ${PO.money(S.net)} to ${e.name}?`, icon: 'Banknote', tone: 'green', confirm: 'Approve & pay', body: html`<p>${P.id === 'in' ? `Paid by NEFT to ${p.bank ? p.bank.name : 'the bank account on file'} today. The PF exit date is set to ${PO.date(e.lastDay)}.` : P.id === 'us' ? `Paid by direct deposit${p.bank ? ' to ' + p.bank.name : ''} with an off-cycle run today.` : `Paid by Faster Payments today. The leaving date goes to HMRC on the next FPS and the P45 is issued.`}</p>`, onConfirm: () => { set({ paid: true, paidOn: TODAY, tasks: tasks.map((t) => (payTask(t) || /computed|encash|Gratuity|Holiday owed|PTO payout/i.test(t.t) ? true : t.done)) }); PO.toast(`${P.id === 'in' ? 'F&F' : 'Final pay'} of ${PO.money(S.net)} paid to ${e.name}`, { icon: 'BadgeCheck' }); } });
    const qa = useMemo(() => { const r = PO.seeded('xi' + P.id + e.id); const sup = P.byId[p.manager] || P.byId[P.topId]; return [
      ['Main reason for leaving', e.why],
      ['How was your relationship with your supervisor?', `${r.pick(['4', '4', '5', '3'])}/5. “${sup.first} ${r.pick(['was fair with shifts and leave.', 'always helped with relievers at night.', 'listened when there was a problem.'])}”`],
      ['Were you paid correctly and on time?', r.pick(['Yes, always on time.', 'Yes. Overtime sometimes came a month late.', 'Yes, the payslip in the portal was easy to check.'])],
      ['What would have made you stay?', P.id === 'in' ? r.pick(['₹1,500 more a month or fewer night shifts.', 'A posting closer to home.', 'Fixed weekly off.']) : r.pick(['More consistent hours.', 'A small raise after a year.', 'Fewer closing shifts.'])],
      ['Would you recommend us to a friend?', r.pick(['Yes', 'Yes', 'Maybe'])],
    ]; }, [e.id]);
    const sent = s.interview || e.lastDay < TODAY || !e.added;
    const LP = PO.DocKit && PO.DocKit.LetterPreview;
    return html`<${Drawer} open size="lg" onClose=${onClose} head=${html`<div class="grow row gap-12"><${Avatar} p=${p} size="lg" /><div style="min-width:0"><div class="row"><b class="w-600 t-md">${e.name}</b><${Status} s=${e.status} /></div><div class="faint t-sm">${p.title} at ${(PO.site(p.site) || {}).name}. ${e.reason}, last day ${PO.date(e.lastDay, { weekday: true })}.</div></div></div>`}
      footer=${html`<${Button} onClick=${() => PO.fakeDownload(`${P.id === 'in' ? 'F&F statement' : 'Final pay statement'} – ${e.name}.pdf`)}>Statement PDF</${Button}><span class="grow"></span>${e.paid ? html`<${Status} s="Paid" /><span class="faint t-sm">${PO.date(s.paidOn, { short: true })}</span>` : html`<${Button} kind="primary" disabled=${!S.due} title=${S.due ? '' : 'Available from the last working day'} onClick=${pay}>Approve & pay ${PO.money(S.net)}</${Button}>`}`}>
      <${Tabs} tabs=${[['settle', P.id === 'in' ? 'Settlement' : 'Final pay'], ['steps', 'Steps', tasks.filter((t) => !t.done).length || null], ['assets', 'Assets', S.missing.length || null], ['interview', 'Exit interview'], ['letters', 'Letters']]} value=${tab} onChange=${setTab} />
      ${tab === 'settle' ? html`<div class="col gap-16">
        <div class=${'lc-dl ' + (e.paid ? 'ok' : e.cd.n < 0 ? 'late' : e.cd.n <= 2 ? 'alert' : '')}>
          <div class="grow"><b class="w-600">${e.paid ? `Paid on ${PO.date(s.paidOn, { weekday: true })}` : `${P.id === 'in' ? 'Pay F&F' : 'Pay final wages'} by ${PO.date(e.dl.date, { weekday: true })}`}</b><div class="t-sm muted">${e.dl.rule}</div></div>
          ${e.paid ? null : html`<div style="text-align:right"><div class="lc-dl big" style="padding:0;border:none">${e.cd.n < 0 ? `${-e.cd.n}d late` : e.cd.n === 0 ? 'Today' : `${e.cd.n}${P.id === 'in' ? ' wd' : 'd'}`}</div><small class="faint">${e.cd.label}</small></div>`}
        </div>
        <div class="grid g-main" style="grid-template-columns:minmax(0,1fr) 220px;align-items:start">
          <table class="lc-tbl"><tbody>
            <tr class="sec"><td colspan="2">Earnings</td></tr>
            ${S.L.filter((x) => x.kind === 'earn').map((x) => html`<tr class=${x.muted ? 'muted' : ''}><td>${x.label}<small>${x.sub}</small></td><td class="r">${x.muted ? '—' : PO.money(x.amt)}</td></tr>`)}
            <tr class="tot"><td>Total earnings</td><td class="r">${PO.money(S.gross)}</td></tr>
            <tr class="sec"><td colspan="2">Deductions</td></tr>
            ${S.L.filter((x) => x.kind === 'ded').map((x) => html`<tr><td>${x.label}<small>${x.sub}</small></td><td class="r">− ${PO.money(x.amt)}</td></tr>`)}
            <tr class="tot"><td>Total deductions</td><td class="r">− ${PO.money(S.ded)}</td></tr>
            <tr class="net"><td>Net ${P.id === 'in' ? 'settlement' : 'final pay'}</td><td class="r">${PO.money(S.net)}</td></tr>
          </tbody></table>
          <div class="col gap-12">
            <${Card} title="Basis" cls="lc-basis"><${KV} items=${[['Joined', PO.date(p.joinedIso, { short: true })], ['Service', PO.tenure(p.tenureMonths)], P.id === 'in' ? ['Monthly gross', PO.money(S.ctx.G)] : ['Hourly rate', PO.money(S.ctx.rate, { cents: true })], P.id === 'in' ? ['Basic', PO.money(S.ctx.B)] : P.id === 'us' ? ['PTO balance', `${S.ctx.pto} h`] : ['Holiday owed', `${S.ctx.holDays} days`], ['Notice', e.reason === 'Resigned' ? `${NOTICE[P.id] === 7 ? 'Statutory' : NOTICE[P.id] + ' days'}${S.ctx.shortfall ? `, ${S.ctx.shortfall} short` : ', served'}` : 'Not applicable']]} /></${Card}>
            ${P.id === 'in' && e.reason === 'Resigned' ? html`<${Card} title="Notice shortfall"><div class="col gap-8"><${Switch} on=${!!S.ctx.shortfall} onChange=${(on) => set({ shortfall: on ? S.ctx.defShort || 7 : 0 })} label=${S.ctx.shortfall ? `Recover ${S.ctx.shortfall} days` : S.ctx.defShort ? `Waived (${S.ctx.defShort} days short)` : 'Full notice served'} /><small class="faint">Recovery is optional. Waiving is recorded in the audit log.</small></div></${Card}>` : null}
            ${P.id === 'uk' ? html`<${Card} title="P45"><div class="col gap-8"><div class="row t-sm">Leaving date ${PO.date(e.lastDay, { short: true })}</div><${Button} size="sm" onClick=${() => PO.fakeDownload(`P45 parts 1A, 2 and 3 – ${e.name}`)}>Download P45</${Button}></div></${Card}>` : null}
            ${P.id === 'us' ? html`<${Card} title="Benefits"><div class="col gap-8 t-sm"><span>COBRA election notice within 44 days</span><${Button} size="sm" onClick=${() => PO.toast(`COBRA notice mailed to ${first}`)}>Send COBRA notice</${Button}></div></${Card}>` : null}
          </div>
        </div>
      </div>` : null}
      ${tab === 'steps' ? html`<div class="grid g-2" style="align-items:start"><div class="lc-grp"><div class="lc-grp-h">Exit checklist<span class="right faint t-xs w-500">${tasks.filter((t) => t.done).length}/${tasks.length}</span></div><${Checklist} items=${tasks.map((t) => ({ t: t.t, done: t.done }))} onToggle=${toggleTask} /></div>
        <${Card} title="Timeline"><${Timeline} items=${[
          { icon: 'FileSignature', tone: 'brand', title: e.reason === 'Resigned' ? 'Resignation received' : e.reason === 'Terminated' ? 'Termination issued' : e.reason, sub: `${e.why}, via the employee portal`, right: PO.date(e.resigned || addDays(e.lastDay, -NOTICE[P.id]), { short: true }) },
          { icon: 'Hourglass', tone: '', title: 'Notice period', sub: e.reason === 'Resigned' ? `${NOTICE[P.id]} days` : 'Not applicable', right: '' },
          { icon: 'DoorOpen', tone: e.lastDay <= TODAY ? 'green' : '', title: 'Last working day', sub: (PO.site(p.site) || {}).name, right: PO.date(e.lastDay, { short: true }) },
          { icon: 'Banknote', tone: e.paid ? 'green' : e.cd.tone, title: e.paid ? 'Settlement paid' : 'Settlement due', sub: PO.money(S.net), right: PO.date(e.paid ? s.paidOn : e.dl.date, { short: true }) },
          ...(s.letters ? Object.entries(s.letters).map(([k, d]) => ({ icon: 'FileCheck2', tone: 'green', title: `${(lettersList.find((l) => l[0] === k) || [k, k])[1]} issued`, sub: 'Shared to the employee portal and emailed', right: PO.date(d, { short: true }) })) : []),
        ]} /></${Card}></div>` : null}
      ${tab === 'assets' ? html`<div class="col gap-12">
        ${S.assets.length ? html`<div class="lc-grp"><div class="lc-grp-h">Items to return<span class="right faint t-xs w-500">${S.assets.length - S.missing.length}/${S.assets.length} returned</span></div>
          <${Checklist} items=${S.assets.map((a, i) => ({ t: `${a.name}`, done: S.returned(a, i), meta: `${a.tag}, ${PO.money(a.value)}`, right: !S.returned(a, i) && S.due ? html`<span class="t-xs" style="color:var(--red)">Deducted</span>` : null }))} onToggle=${(i) => { const a = S.assets[i]; const cur = S.returned(a, i); set({ assets: { ...(s.assets || {}), [a.tag]: !cur } }); PO.toast(cur ? `${a.name} marked not returned. ${PO.money(a.value)} deducted.` : `${a.name} returned. Settlement updated.`); }} /></div>` : html`<${Empty} icon="Package" title="Nothing issued" />`}
        ${S.due && S.missing.length ? html`<${Callout} tone="amber" icon="PackageX" title=${`${PO.money(S.missing.reduce((t, a) => t + a.value, 0))} deducted for unreturned items`}>${P.id === 'uk' ? 'Deductions can’t take final pay below the National Living Wage for the hours worked.' : P.id === 'us' ? 'Texas requires a written authorization for this deduction. One is on file from onboarding.' : 'Deductions are capped at 50% of wages under the Code on Wages.'}</${Callout}>` : html`<p class="faint t-sm">${S.due ? 'Everything is back. Nothing will be deducted from the settlement.' : `${first} hands items to the site lead on ${PO.date(e.lastDay, { short: true })}.`}</p>`}
      </div>` : null}
      ${tab === 'interview' ? (sent ? html`<${Card} title="Exit interview" sub="Answered in the employee portal" >${qa.map(([q, a]) => html`<div class="lc-qa"><small>${q}</small><div class="w-500">${a}</div></div>`)}<div class="row mt-12"><span class="t-sm muted">${e.reason === 'Terminated' || e.st.rehire === false ? 'Not eligible for rehire.' : 'Eligible for rehire.'}</span></div></${Card}>`
        : html`<div class="card"><${Empty} icon="MessageSquareQuote" title="Not sent yet" text=${`Five questions, shared to ${first}’s employee portal with an email reminder. Takes about 4 minutes.`} action=${html`<${Button} kind="primary" onClick=${() => { set({ interview: TODAY }); PO.toast(`Exit interview shared to ${first}’s employee portal`, { icon: 'Send' }); }}>Send exit interview</${Button}>`} /></div>`) : null}
      ${tab === 'letters' ? html`<div class="col gap-12">${lettersList.map(([k, label]) => { const issued = s.letters && s.letters[k]; return html`<div class="card" style="padding:12px 14px"><div class="row"><div class="grow"><b class="w-600">${label}</b><div class="faint t-sm">${issued ? `Issued ${PO.date(issued, { short: true })} and shared to the portal` : e.paid || k === 'verification' || k === 'reference' ? 'Ready to issue' : 'Usually issued after the settlement is paid'}</div></div><${Button} size="sm" kind="ghost" onClick=${() => setLetter(k)}>Preview</${Button}>${issued ? html`<${Status} s="Done" />` : html`<${Button} size="sm" kind="primary" onClick=${() => { set({ letters: { ...(s.letters || {}), [k]: TODAY } }); PO.toast(`${label} issued to ${e.name} and e-signed by ${P.byId[P.hrId].name}`, { icon: 'FileCheck2' }); }}>Issue</${Button}>`}</div></div>`; })}
        ${letter && LP ? html`<div class="card" style="padding:0;overflow:hidden"><div class="row" style="padding:10px 14px;border-bottom:1px solid var(--border)"><b class="w-600 t-sm">Preview</b><span class="right"><${Button} size="sm" kind="ghost" onClick=${() => setLetter(null)}>Close</${Button}></span></div><div style="padding:16px;background:var(--surface-3)"><${LP} tpl=${letter} p=${p} extra=${{ lastDay: e.lastDay, why: e.why, net: S.net }} /></div></div>` : null}
      </div>` : null}
      ${confirmEl}
    </${Drawer}>`;
  }

  PO.route('onboarding', Onboarding, { title: 'Onboarding' });
  PO.route('offboarding', Offboarding, { title: 'Exits & F&F' });
  PO.LC = { settlement, deadlineOf, countdown };
})();
