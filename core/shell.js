/* People OS shell: sidebar, top bar, command palette, notifications and the router outlet.
   Loaded last. Modules register routes (PO.route), nav badge counts (PO.navCount) and overlay panels (PO.panels). */
(function () {
  const PO = window.PO;
  const { html, render, useState, useEffect, useRef, useMemo, Icon, Avatar, Button, IconButton, Menu } = PO;

  /* ---------- navigation ---------- */
  const NAV = {
    admin: [
      { items: [['home', 'Home', 'LayoutDashboard'], ['approvals', 'Inbox', 'Inbox']] },
      { title: 'People', items: [['people', 'Employees', 'Users'], ['org', 'Org chart', 'Network'], ['onboarding', 'Onboarding', 'UserPlus'], ['offboarding', 'Exits & F&F', 'UserMinus'], ['documents', 'Documents', 'FolderOpen'], ['assets', 'Assets', 'Package']] },
      { title: 'Time & attendance', items: [['live', 'Live board', 'MapPin'], ['attendance', 'Attendance', 'CalendarCheck2'], ['roster', 'Roster', 'CalendarRange'], ['leave', 'Leave & holidays', 'Palmtree']] },
      { title: 'Payroll', items: [['payroll', 'Run payroll', 'Banknote'], ['payslips', 'Payslips & history', 'ReceiptText'], ['compensation', 'Salary & comp', 'Wallet'], ['expenses', 'Expenses & advances', 'Receipt'], ['tax', 'Tax & declarations', 'Landmark'], ['benefits', 'Benefits', 'HeartPulse']] },
      { title: 'Compliance', items: [['compliance', 'Compliance centre', 'ShieldCheck'], ['contractors', 'Contractors', 'HardHat'], ['rules', 'Rules & policies', 'ScrollText']] },
      { title: 'Talent', items: [['hiring', 'Hiring', 'Briefcase'], ['performance', 'Performance', 'Target'], ['learning', 'Learning', 'GraduationCap'], ['engagement', 'Engagement', 'HeartHandshake']] },
      { title: 'Insights', items: [['reports', 'Reports', 'ChartColumnBig'], ['helpdesk', 'Helpdesk', 'LifeBuoy']] },
    ],
    manager: [
      { items: [['home', 'Home', 'LayoutDashboard'], ['approvals', 'Inbox', 'Inbox']] },
      { title: 'My team', items: [['people', 'Team members', 'Users'], ['org', 'Org chart', 'Network'], ['live', 'Live board', 'MapPin'], ['roster', 'Roster', 'CalendarRange'], ['attendance', 'Attendance', 'CalendarCheck2'], ['leave', 'Leave', 'Palmtree']] },
      { title: 'Talent', items: [['performance', 'Performance', 'Target'], ['hiring', 'Hiring', 'Briefcase']] },
      { title: 'Me', items: [['me', 'My space', 'CircleUserRound'], ['my-pay', 'My payslips', 'ReceiptText']] },
    ],
    employee: [
      { items: [['me', 'Home', 'House'], ['my-pay', 'Payslips', 'ReceiptText'], ['my-leave', 'Leave', 'Palmtree'], ['my-time', 'Attendance', 'CalendarCheck2'], ['my-docs', 'Documents', 'FolderOpen'], ['my-expenses', 'Expenses', 'Receipt'], ['my-goals', 'Goals & reviews', 'Target']] },
      { title: 'Company', items: [['org', 'People directory', 'Network'], ['engagement', 'Announcements', 'Megaphone'], ['helpdesk', 'Ask HR', 'LifeBuoy']] },
    ],
  };
  const FOOT = [['settings', 'Settings', 'Settings']];
  const counts = PO._navCounts; // filled by PO.navCount (core/lib.js)
  PO.panels = PO.panels || {};
  const titleOf = (name) => { for (const g of [...NAV.admin, ...NAV.employee, ...NAV.manager, { items: FOOT }]) for (const [k, l] of g.items) if (k === name) return [g.title || '', l]; return ['', PO.routes[name]?.title || '']; };
  PO.NAV = NAV;

  const coColor = { in: '#b4532a', us: '#7a5a3a', uk: '#2d5c8a' };

  function CompanySwitch({ collapsed }) {
    const { state, dispatch } = PO.useStore();
    const [open, setOpen] = useState(false);
    const ref = useRef();
    PO.useOutside(ref, () => setOpen(false), open);
    const P = PO.DATA[state.co], C = P.company;
    return html`<div ref=${ref} style="position:relative">
      <button class="co-switch" onClick=${() => setOpen(!open)} title=${C.name}>
        <span class="co-logo" style=${`background:${coColor[P.id]}`}>${C.short.split(/[\s&]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('')}</span>
        ${collapsed ? null : html`<span class="co-meta"><b>${C.name}</b><small>${P.flag} ${C.city} · ${PO.num(P.people.length)} people</small></span><${Icon} n="ChevronsUpDown" size=${14} cls="faint" />`}
      </button>
      ${open ? html`<div class="menu" style="top:calc(100% + 6px);left:0;width:300px">
        <div class="menu-h">Companies</div>
        ${PO.order.map((k) => { const Q = PO.DATA[k]; return html`<button class=${'menu-item ' + (k === state.co ? 'active' : '')} style="height:44px" onClick=${() => { dispatch({ type: 'co', co: k }); setOpen(false); PO.toast(`Switched to ${Q.company.name}`); }}><span class="co-logo" style=${`background:${coColor[k]};width:26px;height:26px;font-size:11px`}>${Q.company.short.split(/[\s&]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('')}</span><span class="grow" style="min-width:0"><b class="w-550" style="display:block">${Q.company.name}</b><small class="faint">${Q.flag} ${Q.company.country} · ${Q.people.length} people · ${Q.company.currency}</small></span>${k === state.co ? html`<${Icon} n="Check" size=${15} />` : null}</button>`; })}
        <div class="menu-sep"></div>
        <button class="menu-item" onClick=${() => { setOpen(false); PO.go('settings/countries'); }}><${Icon} n="Globe" size=${15} /><span class="grow">Country packs</span><span class="faint t-xs">${PO.PACKS.length}</span></button>
        <button class="menu-item" onClick=${() => { setOpen(false); PO.go('settings/import'); }}><${Icon} n="Plus" size=${15} /><span class="grow">Add a company</span></button>
      </div>` : null}
    </div>`;
  }

  /* the three portals of the demo: one product, three audiences */
  const PORTALS = [['admin', 'HR admin portal', 'ShieldCheck', 'Payroll, compliance, people and settings'], ['manager', 'Manager portal', 'UsersRound', 'Approvals, rosters and the team'], ['employee', 'Employee portal', 'CircleUserRound', 'Payslips, leave, attendance and requests']];
  PO.PORTALS = PORTALS;
  function PortalSwitch() {
    const { state, dispatch } = PO.useStore();
    const pick = (k) => { if (k === state.role) return; dispatch({ type: 'set', patch: { role: k } }); PO.go(k === 'employee' ? 'me' : 'home'); PO.toast(`Opened the ${PORTALS.find((p) => p[0] === k)[1].toLowerCase()}`); };
    return html`<div class="portal-switch" role="tablist" aria-label="Portal">${PORTALS.map(([k, l, ic, d]) => html`<button role="tab" aria-selected=${state.role === k} title=${`${l}: ${d}`} onClick=${() => pick(k)}>${l.replace(' portal', '').replace('HR admin', 'HR admin')}</button>`)}</div>`;
  }

  function Sidebar({ route }) {
    const { state, dispatch } = PO.useStore();
    const P = PO.DATA[state.co];
    const [closed, setClosed] = PO.useCoState('nav.closed', {});
    const groups = NAV[state.role];
    const item = ([k, label, icon]) => {
      const c = counts[k] ? counts[k].fn(state, P) : 0;
      const current = route.name === k || (k === 'me' && route.name === 'me');
      return html`<a class="nav-item" href=${PO.href(k)} aria-current=${current ? 'page' : undefined} title=${state.collapsed ? label : undefined}><${Icon} n=${icon} size=${16} /><span>${label}</span>${c ? html`<span class=${'nav-count ' + (counts[k].hot ? 'hot' : '')}>${c}</span>` : null}</a>`;
    };
    return html`<aside class="side">
      <div class="side-top">
        <div class="brand"><span class="brand-mark">P</span><span class="brand-name">People OS <span class="portal-tag">${state.role === 'manager' ? 'Manager' : 'HR admin'}</span></span>${state.collapsed ? null : html`<span class="right"><${IconButton} icon="PanelLeftClose" size="sm" title="Collapse sidebar" onClick=${() => dispatch({ type: 'set', patch: { collapsed: true } })} /></span>`}</div>
        <${CompanySwitch} collapsed=${state.collapsed} />
      </div>
      <nav class="side-scroll">
        ${groups.map((g, gi) => html`<div class="nav-group" style=${gi === 0 ? 'margin-top:4px' : ''}>
          ${g.title ? html`<div class="nav-group-h" onClick=${() => setClosed({ ...closed, [g.title]: !closed[g.title] })}><span>${g.title}</span><${Icon} n=${closed[g.title] ? 'ChevronRight' : 'ChevronDown'} size=${12} /></div>` : null}
          ${closed[g.title] && !g.items.some(([k]) => k === route.name) ? null : g.items.map(item)}
        </div>`)}
      </nav>
      <div class="side-foot">
        ${state.role === 'admin' ? FOOT.map(item) : null}
        ${state.collapsed ? html`<${IconButton} icon="PanelLeftOpen" title="Expand sidebar" onClick=${() => dispatch({ type: 'set', patch: { collapsed: false } })} />` : null}
      </div>
    </aside>`;
  }

  /* ---------- top bar ---------- */
  function viewer(state) {
    const P = PO.DATA[state.co];
    if (state.role === 'employee') return P.hero;
    if (state.role === 'manager') return P.byId[P.hero.manager] || P.byId[P.hrId];
    return P.byId[P.hrId];
  }
  PO.viewer = () => viewer(PO.useStore().state);

  function Notifications() {
    const { state, dispatch } = PO.useStore();
    const P = PO.DATA[state.co];
    const [read, setRead] = PO.useCoState('notif.read', {});
    const ref = useRef();
    PO.useOutside(ref, () => dispatch({ type: 'set', patch: { notif: false } }), state.notif);
    const unread = P.notifications.filter((n) => n.unread && !read[n.id]).length;
    const icon = { attendance: 'Clock', compliance: 'ShieldAlert', live: 'MapPin', people: 'UserRound', payroll: 'Banknote', performance: 'Target' };
    return html`<div ref=${ref} style="position:relative">
      <${IconButton} icon="Bell" title="Notifications" badge=${unread > 0} onClick=${() => dispatch({ type: 'set', patch: { notif: !state.notif } })} />
      ${state.notif ? html`<div class="popover" style="right:0;top:calc(100% + 6px);width:380px">
        <div class="row" style="padding:12px 14px;border-bottom:1px solid var(--border)"><b class="w-600">Notifications</b>${unread ? html`<span class="badge brand">${unread} new</span>` : null}<button class="btn ghost sm right" onClick=${() => setRead(Object.fromEntries(P.notifications.map((n) => [n.id, true])))}>Mark all read</button></div>
        <div style="max-height:420px;overflow:auto">${P.notifications.map((n) => { const isNew = n.unread && !read[n.id]; return html`<a class="list-item clickable" href=${PO.href(n.href)} onClick=${() => { setRead({ ...read, [n.id]: true }); dispatch({ type: 'set', patch: { notif: false } }); }} style="align-items:flex-start"><span class="tl-dot ${isNew ? 'brand' : ''}" style="width:30px;height:30px;flex:none"><${Icon} n=${icon[n.kind] || 'Bell'} size=${14} /></span><span class="grow"><span style=${isNew ? 'font-weight:550' : 'color:var(--text-2)'}>${n.t}</span><small class="faint" style="display:block;margin-top:2px">${n.at}</small></span>${isNew ? html`<span style="width:7px;height:7px;border-radius:50%;background:var(--brand);margin-top:6px;flex:none"></span>` : null}</a>`; })}</div>
        <a class="row" href=${PO.href('settings/notifications')} onClick=${() => dispatch({ type: 'set', patch: { notif: false } })} style="padding:10px 14px;border-top:1px solid var(--border);color:var(--text-2);font-size:12px"><${Icon} n="Settings2" size=${13} />Notification settings</a>
      </div>` : null}
    </div>`;
  }

  function UserMenu() {
    const { state, dispatch } = PO.useStore();
    const v = viewer(state);
    const roles = [['admin', 'HR admin', 'ShieldCheck'], ['manager', 'Manager', 'UsersRound'], ['employee', 'Employee', 'UserRound']];
    return html`<${Menu} align="right" width=${260} trigger=${html`<button class="btn ghost" style="padding:0 4px 0 4px;gap:8px"><${Avatar} p=${v} size="sm" /><span class="t-sm w-550" style="max-width:120px" class="ellipsis">${v.first}</span><${Icon} n="ChevronDown" size=${13} /></button>`} items=${[
      { header: `${v.name} · ${v.title}` },
      { header: 'Switch portal (demo)' },
      ...PORTALS.map(([k, l, ic]) => ({ label: l, icon: ic, checked: state.role === k, onClick: () => { dispatch({ type: 'set', patch: { role: k } }); PO.go(k === 'employee' ? 'me' : 'home'); } })),
      '-',
      { label: state.theme === 'dark' ? 'Light mode' : 'Dark mode', icon: state.theme === 'dark' ? 'Sun' : 'Moon', onClick: () => dispatch({ type: 'set', patch: { theme: state.theme === 'dark' ? 'light' : 'dark' } }) },
      { label: 'Keyboard shortcuts', icon: 'Keyboard', hint: '?', onClick: () => dispatch({ type: 'set', patch: { cmdk: true } }) },
      { label: 'Settings', icon: 'Settings', onClick: () => PO.go('settings') },
      '-',
      { label: 'Sign out', icon: 'LogOut', onClick: () => dispatch({ type: 'set', patch: { signedOut: true } }) },
    ]} />`;
  }

  function Topbar({ route }) {
    const { state, dispatch } = PO.useStore();
    const [group, title] = titleOf(route.name);
    const extra = PO.crumb ? PO.crumb(route) : null;
    return html`<header class="topbar">
      <div class="crumbs">${state.collapsed ? null : null}${group ? html`<span>${group}</span><${Icon} n="ChevronRight" size=${13} />` : null}${extra ? html`<a href=${PO.href(route.name)}>${title}</a><${Icon} n="ChevronRight" size=${13} /><b>${extra}</b>` : html`<b>${title}</b>`}</div>
      <div class="right row" style="gap:6px">
        <button class="search-btn" onClick=${() => dispatch({ type: 'set', patch: { cmdk: true } })}><${Icon} n="Search" size=${14} /><span>Search people, pages, actions</span><kbd>⌘K</kbd></button>
        ${state.role !== 'employee' ? html`<${Menu} align="right" width=${230} trigger=${html`<${Button} icon="Plus" kind="">New</${Button}>`} items=${[
          { label: 'Add employee', icon: 'UserPlus', onClick: () => PO.go('people?new=1') },
          { label: 'Run payroll', icon: 'Banknote', onClick: () => PO.go('payroll') },
          { label: 'Leave request', icon: 'Palmtree', onClick: () => PO.go('leave?new=1') },
          { label: 'Shift / roster', icon: 'CalendarRange', onClick: () => PO.go('roster') },
          { label: 'Job opening', icon: 'Briefcase', onClick: () => PO.go('hiring?new=1') },
          { label: 'Announcement', icon: 'Megaphone', onClick: () => PO.go('engagement?new=1') },
          '-',
          { label: 'Import from spreadsheet', icon: 'FileSpreadsheet', onClick: () => PO.go('settings/import') },
        ]} />` : null}
        <${Notifications} />
        <${IconButton} icon="CircleHelp" title="Help centre" onClick=${() => PO.go('helpdesk')} />
        <${UserMenu} />
      </div>
    </header>`;
  }

  /* ---------- command palette ---------- */
  function CommandPalette() {
    const { state, dispatch } = PO.useStore();
    const P = PO.DATA[state.co];
    const [q, setQ] = useState('');
    const [i, setI] = useState(0);
    const close = () => { dispatch({ type: 'set', patch: { cmdk: false } }); setQ(''); };
    const pages = [...NAV[state.role], { items: state.role === 'admin' ? FOOT : [] }].flatMap((g) => g.items.map(([k, l, ic]) => ({ group: 'Pages', label: l, icon: ic, sub: g.title || '', run: () => PO.go(k) })));
    const actions = [
      { label: 'Run payroll for ' + P.company.period, icon: 'Banknote', run: () => PO.go('payroll') },
      { label: 'Approve pending requests', icon: 'CheckCheck', run: () => PO.go('approvals') },
      { label: 'Find cover for a sick call', icon: 'Sparkles', run: () => dispatch({ type: 'set', patch: { assistant: { prompt: P.ai.cover } } }) },
      { label: 'Add an employee', icon: 'UserPlus', run: () => PO.go('people?new=1') },
      ...PORTALS.filter(([k]) => k !== state.role).map(([k, l, ic]) => ({ label: `Switch to the ${l.toLowerCase()}`, icon: ic, run: () => { dispatch({ type: 'set', patch: { role: k } }); PO.go(k === 'employee' ? 'me' : 'home'); } })),
      { label: state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', icon: 'Moon', run: () => dispatch({ type: 'set', patch: { theme: state.theme === 'dark' ? 'light' : 'dark' } }) },
      ...PO.order.filter((k) => k !== state.co).map((k) => ({ label: `Switch to ${PO.DATA[k].company.name}`, icon: 'Building2', run: () => dispatch({ type: 'co', co: k }) })),
    ].map((a) => ({ ...a, group: 'Actions' }));
    const people = P.people.map((p) => ({ group: 'People', label: p.name, person: p, sub: `${p.title} · ${PO.site(p.site).name} · ${p.id}`, run: () => PO.go('people/' + p.id) }));
    const t = q.trim().toLowerCase();
    const res = t ? [...pages, ...actions, ...people].filter((x) => (x.label + ' ' + (x.sub || '')).toLowerCase().includes(t)).slice(0, 14) : [...actions.slice(0, 5), ...pages.slice(0, 8)];
    useEffect(() => setI(0), [q]);
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(res.length - 1, i + 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(0, i - 1)); }
      if (e.key === 'Enter' && res[i]) { res[i].run(); close(); }
      if (e.key === 'Escape') close();
    };
    if (!state.cmdk) return null;
    let last = '';
    return html`<div class="scrim" onClick=${close}></div><div class="cmdk" role="dialog">
      <div class="cmdk-in"><${Icon} n="Search" size=${17} cls="faint" /><input autoFocus placeholder="Search people, pages and actions…" value=${q} onInput=${(e) => setQ(e.target.value)} onKeyDown=${onKey} ref=${(el) => el && setTimeout(() => el.focus())} /><kbd>esc</kbd></div>
      <div class="cmdk-list">${res.length ? res.map((r, k) => { const head = r.group !== last ? html`<div class="cmdk-group">${r.group}</div>` : null; last = r.group; return html`${head}<div class=${'cmdk-item ' + (k === i ? 'active' : '')} onMouseEnter=${() => setI(k)} onClick=${() => { r.run(); close(); }}>${r.person ? html`<${Avatar} p=${r.person} size="sm" />` : html`<${Icon} n=${r.icon} size=${16} cls="faint" />`}<span>${r.label}</span>${r.sub ? html`<small>${r.sub}</small>` : null}</div>`; }) : html`<${PO.Empty} icon="SearchX" title="No results" text=${`Nothing matches “${q}”. Try a name, an employee ID or a page.`} />`}</div>
      <div class="cmdk-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span class="right">${PO.num(P.people.length)} people in ${P.company.short}</span></div>
    </div>`;
  }

  function Toasts() {
    const { state, dispatch } = PO.useStore();
    return html`<div class="toasts">${state.toasts.map((t) => html`<div class="toast"><${Icon} n=${t.icon || 'CircleCheck'} size=${16} cls="t-ic" /><span>${t.text}</span>${t.action ? html`<button onClick=${() => { t.action.run(); dispatch({ type: 'untoast', id: t.id }); }}>${t.action.label}</button>` : null}</div>`)}</div>`;
  }

  function Missing({ route }) {
    return html`<${PO.PageHeader} title=${titleOf(route.name)[1] || 'Not found'} /><div class="card"><${PO.Empty} icon="Construction" title="This page isn’t available" text="Pick another page from the sidebar." action=${html`<${Button} href=${PO.href('home')}>Go home</${Button}>`} /></div>`;
  }

  /* ---------- Employee portal frame: top navigation, company branding, centred content ---------- */
  const EP_NAV = [['me', 'Home'], ['my-pay', 'Pay'], ['my-leave', 'Time off'], ['my-time', 'Attendance'], ['my-docs', 'Documents'], ['my-expenses', 'Expenses'], ['my-goals', 'Goals'], ['helpdesk', 'Help']];
  function EmployeeBar({ route }) {
    const { state, dispatch } = PO.useStore();
    const P = PO.DATA[state.co], C = P.company, me = P.hero;
    const [read, setRead] = PO.useCoState('ep.notif.read', false);
    const leaveWord = P.id === 'us' ? 'PTO' : P.id === 'uk' ? 'holiday' : 'leave';
    const notes = [['Your payslip for ' + C.period + ' is ready', 'my-pay', 'Today'], [`Your ${leaveWord} request was approved`, 'my-leave', 'Yesterday'], ['New policy to acknowledge: attendance & overtime', 'me', 'Oct 2'], [`${P.reviewCycle.name}: self review due ${PO.date(P.reviewCycle.closes, { short: true })}`, 'my-goals', 'Oct 1']];
    const t = ({ in: 'Leave', us: 'PTO', uk: 'Holiday' })[P.id];
    const label = (k, l) => (k === 'my-leave' ? (P.id === 'us' ? 'Time off' : P.id === 'uk' ? 'Holiday' : 'Leave') : l);
    return html`<header class="ep-bar" style=${`--co:${coColor[P.id]}`}>
      <div class="ep-in">
        <a class="ep-co" href=${PO.href('me')}><span class="co-logo" style=${`background:${coColor[P.id]};width:28px;height:28px;font-size:11px`}>${C.short.split(/[\s&]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('')}</span><span><b>${C.short}</b><small>Employee portal</small></span></a>
        <nav class="ep-nav">${EP_NAV.map(([k, l]) => html`<a href=${PO.href(k)} aria-current=${route.name === k ? 'page' : undefined}>${label(k, l)}</a>`)}</nav>
        <div class="right row" style="gap:4px">
          <${Menu} align="right" width=${330} trigger=${html`<span><${IconButton} icon="Bell" title="Notifications" badge=${!read} /></span>`} items=${[{ header: 'Notifications' }, ...notes.map(([txt, href, when]) => ({ label: txt, hint: when, onClick: () => { setRead(true); PO.go(href); } })), '-', { label: 'Mark all as read', icon: 'CheckCheck', onClick: () => setRead(true) }]} />
          <${Menu} align="right" width=${250} trigger=${html`<button class="btn ghost" style="padding:0 4px;gap:8px"><${Avatar} p=${me} size="sm" /><span class="t-sm w-550">${me.first}</span><${Icon} n="ChevronDown" size=${13} /></button>`} items=${[
            { header: `${me.name} · ${me.id}` },
            { label: 'My profile', icon: 'CircleUserRound', onClick: () => PO.go('me?profile=1') },
            { label: 'Bank & tax details', icon: 'Landmark', onClick: () => PO.go('my-pay') },
            { label: state.theme === 'dark' ? 'Light mode' : 'Dark mode', icon: state.theme === 'dark' ? 'Sun' : 'Moon', onClick: () => dispatch({ type: 'set', patch: { theme: state.theme === 'dark' ? 'light' : 'dark' } }) },
            '-',
            { header: 'Switch portal (demo)' },
            ...PORTALS.map(([k, l, ic]) => ({ label: l, icon: ic, checked: state.role === k, onClick: () => { dispatch({ type: 'set', patch: { role: k } }); PO.go(k === 'employee' ? 'me' : 'home'); } })),
            '-',
            { label: 'Sign out', icon: 'LogOut', onClick: () => dispatch({ type: 'set', patch: { signedOut: true } }) },
          ]} />
        </div>
      </div>
    </header>`;
  }

  /* ---------- Portal sign-in (demo launcher) ---------- */
  function PortalLogin() {
    const { state, dispatch } = PO.useStore();
    const P = PO.DATA[state.co], C = P.company;
    const who = { admin: P.byId[P.hrId], manager: P.byId[P.hero.manager] || P.byId[P.hrId], employee: P.hero };
    const enter = (k) => { dispatch({ type: 'set', patch: { role: k, signedOut: false } }); PO.go(k === 'employee' ? 'me' : 'home'); };
    return html`<div class="pl-wrap">
      <div class="pl-card">
        <div class="row" style="gap:10px;margin-bottom:22px"><span class="brand-mark">P</span><b class="t-lg" style="letter-spacing:-0.02em">People OS</b></div>
        <h1 class="t-xl w-600" style="letter-spacing:-0.02em">Sign in to ${C.name}</h1>
        <p class="muted mt-4">Choose a portal. In a live account, people only see the portal their role allows.</p>
        <div class="col mt-24" style="gap:10px">${PORTALS.map(([k, l, ic, d]) => { const p = who[k]; return html`<button class="pl-opt" onClick=${() => enter(k)}><span class="pl-ic"><${Icon} n=${ic} size=${18} /></span><span class="grow" style="text-align:left;min-width:0"><b>${l}</b><small>${d}</small></span><span class="row" style="gap:8px;flex:none"><${Avatar} p=${p} size="sm" /><span class="t-sm muted">${p.name}</span></span><${Icon} n="ChevronRight" size=${16} cls="faint" /></button>`; })}</div>
        <div class="row mt-24 t-sm faint" style="gap:6px">Company<select class="select" style="width:auto;height:28px" value=${state.co} onChange=${(e) => dispatch({ type: 'co', co: e.target.value })}>${PO.order.map((k) => html`<option value=${k}>${PO.DATA[k].company.name}</option>`)}</select></div>
      </div>
    </div>`;
  }

  function App() {
    const { state, dispatch } = PO.useStore();
    const route = PO.useRoute();
    useEffect(() => {
      const k = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dispatch({ type: 'set', patch: { cmdk: !state.cmdk } }); }
        if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); dispatch({ type: 'set', patch: { cmdk: true } }); }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); dispatch({ type: 'set', patch: { assistant: state.assistant ? null : {} } }); }
      };
      addEventListener('keydown', k); return () => removeEventListener('keydown', k);
    }, [state.cmdk, state.assistant]);
    const r = PO.routes[route.name];
    const Page = r ? r.component : Missing;
    const Assistant = PO.panels.assistant;
    if (state.signedOut || route.name === 'portals') return html`<${PortalLogin} /><${Toasts} />`;
    const fab = state.assistant ? null : html`<button class="ai-fab" title="Ask AI (⌘J)" onClick=${() => dispatch({ type: 'set', patch: { assistant: {} } })}><${Icon} n="Sparkles" size=${15} />${state.role === 'employee' ? 'Ask HR' : 'Ask AI'}<kbd>⌘J</kbd></button>`;
    if (state.role === 'employee') return html`<div class="ep-shell">
      <${EmployeeBar} route=${route} />
      <main class="ep-main" key=${state.co + route.name + route.params.join('/')}><${Page} params=${route.params} query=${route.query} route=${route} /></main>
      <footer class="ep-foot"><span>${PO.DATA[state.co].company.name}</span><span class="dotsep"></span><span>Powered by People OS</span><span class="right"><a class="link" href=${PO.href('helpdesk')}>Contact HR</a></span></footer>
      <${CommandPalette} />${fab}${state.assistant && Assistant ? html`<${Assistant} />` : null}<${Toasts} />
    </div>`;
    return html`<div class=${'shell ' + (state.collapsed ? 'collapsed' : '')}>
      <${Sidebar} route=${route} />
      <main class="main"><${Topbar} route=${route} /><div class=${'page ' + (r && r.wide ? 'wide' : '')} key=${state.co + state.role + route.name + route.params.join('/')}><${Page} params=${route.params} query=${route.query} route=${route} /></div></main>
      <${CommandPalette} />
      ${fab}
      ${state.assistant && Assistant ? html`<${Assistant} />` : null}
      <${Toasts} />
    </div>`;
  }

  render(html`<${PO.StoreProvider}><${App} /><//>`, document.getElementById('app'));
})();
