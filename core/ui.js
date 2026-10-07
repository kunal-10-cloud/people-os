/* People OS component library. Every module builds from these so the product feels like one app.
   See CONTRIBUTING.md for usage. All components are Preact + htm and read tokens from core/app.css. */
(function () {
  const PO = window.PO;
  const { html, useState, useEffect, useMemo, useRef } = PO;

  /* ---------- Icon (Lucide) ---------- */
  const cache = {};
  function Icon({ n, size = 16, stroke = 1.75, cls = '', style = '' }) {
    const node = window.lucide && window.lucide.icons[n];
    if (!node) return html`<span style=${`display:inline-block;width:${size}px;height:${size}px`}></span>`;
    const children = node[0] === 'svg' ? node[2] : node;
    if (!cache[n]) cache[n] = children.map(([tag, attrs]) => '<' + tag + ' ' + Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ') + '/>').join('');
    return html`<svg class=${'ic ' + cls} style=${style} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: cache[n] }}></svg>`;
  }

  /* ---------- Avatar / Who ---------- */
  /* illustrated portraits (DiceBear "notionists") on a soft tint; initials stay underneath as the fallback */
  const tintHex = (h) => { const l = 0.88, sat = 0.32, a = sat * Math.min(l, 1 - l); const f = (n) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); }; return f(0) + f(8) + f(4); };
  /* portraits are generated in the browser once the DiceBear modules load (one download, works offline after);
     until then the hosted API serves them. */
  const avCache = new Map();
  let localAvatar = null;
  Promise.all([import('https://cdn.jsdelivr.net/npm/@dicebear/core@9.2.2/+esm'), import('https://cdn.jsdelivr.net/npm/@dicebear/notionists@9.2.2/+esm')])
    .then(([core, style]) => { localAvatar = (seed, bg) => core.createAvatar(style, { seed, backgroundColor: [bg], radius: 50 }).toDataUri(); PO.dispatch && PO.dispatch({ type: 'set', patch: { tick: Date.now() } }); })
    .catch(() => {});
  const portrait = (seed, h) => {
    const bg = tintHex(h), k = seed + bg;
    if (localAvatar) { if (!avCache.has(k)) avCache.set(k, localAvatar(seed, bg)); return avCache.get(k); }
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50`;
  };
  function Avatar({ p, name, size = '', hue, presence, sq, plain }) {
    const nm = p ? p.name : name || '?';
    const h = hue ?? (p ? p.hue : PO.hueOf(nm));
    const photo = !plain && PO.photos !== false;
    return html`<span class=${`av ${size} ${sq ? 'sq' : ''} ${photo ? 'photo' : ''} ${presence ? 'presence ' + (presence === 'on' ? '' : presence) : ''}`} style=${`--h:${h}`} title=${nm}>${PO.initials(nm)}${photo ? html`<img src=${portrait(p ? p.id + nm : nm, h)} alt="" loading="lazy" onError=${(e) => { e.currentTarget.remove(); }} />` : null}</span>`;
  }
  /** Person chip: avatar + name + subtitle; links to the profile unless link=false. */
  function Who({ p, id, sub, size = '', link = true, name, presence, onClick }) {
    const person = p || (id ? PO.person(id) : null);
    const nm = person ? person.name : name;
    const subtitle = sub !== undefined ? sub : person ? person.title : '';
    const inner = html`<${Avatar} p=${person} name=${nm} size=${size} presence=${presence} /><span class="who-t"><b>${nm}</b>${subtitle ? html`<small>${subtitle}</small>` : null}</span>`;
    if (onClick) return html`<a class="who" href="javascript:void 0" onClick=${onClick}>${inner}</a>`;
    return person && link ? html`<a class="who" href=${PO.href('people/' + person.id)} onClick=${(e) => e.stopPropagation()}>${inner}</a>` : html`<span class="who">${inner}</span>`;
  }
  const AvatarStack = ({ ids = [], max = 4, size = 'sm' }) => html`<span class="av-stack">${ids.slice(0, max).map((id) => html`<${Avatar} p=${PO.person(id)} size=${size} />`)}${ids.length > max ? html`<span class=${'av ' + size} style="--h:230">+${ids.length - max}</span>` : null}</span>`;

  /* ---------- Badges ---------- */
  const STATUS = {
    green: ['Active', 'Approved', 'Paid', 'Verified', 'Done', 'Completed', 'Present', 'On time', 'Good', 'New', 'Resolved', 'Hired', 'Live', 'Compliant', 'Published', 'On track', 'Signed', 'Within policy', 'Connected', 'Clocked in', 'All clear', 'Filed'],
    amber: ['Pending', 'Submitted', 'Pending review', 'Probation', 'Expiring soon', 'Late', 'Draft', 'In progress', 'Serving notice', 'Notice period', 'Due today', 'Fair', 'Waiting on employee', 'Self review done', 'Manager review', 'Screening', 'Interview', 'Needs review', 'Due soon', 'Partial', 'Warning', 'Pre-boarding'],
    red: ['Rejected', 'Missing', 'Expired', 'Absent', 'Overdue', 'Breached', 'Needs repair', 'Over limit', 'Terminated', 'F&F due', 'Failed', 'Blocked', 'Action needed', 'Proof missing', 'Insurance expired'],
    blue: ['Open', 'Scheduled', 'On leave', 'Offer', 'Applied', 'Upcoming', 'Day 1', 'Joined', 'Contract', 'Part-time'],
    slate: ['Not started', 'Inactive', 'Archived', 'Unpaid', 'Full-time', 'Off', 'Week off', 'Available', 'Disconnected'],
  };
  const toneOf = (s) => Object.keys(STATUS).find((k) => STATUS[k].includes(s)) || 'slate';
  const Badge = ({ tone = 'slate', dot, children, cls = '' }) => html`<span class=${`badge ${tone} ${dot ? 'dot' : ''} ${cls}`}>${children}</span>`;
  const Status = ({ s, dot = true }) => html`<${Badge} tone=${toneOf(s)} dot=${dot}>${s}<//>`;

  /* ---------- Buttons ---------- */
  function Button({ kind = '', size = '', icon, iconRight, children, onClick, href, disabled, title, type = 'button', cls = '' }) {
    const c = `btn ${kind} ${size} ${cls}`;
    const body = html`${icon ? html`<${Icon} n=${icon} size=${size === 'sm' ? 14 : 15} />` : null}${children}${iconRight ? html`<${Icon} n=${iconRight} size=${14} />` : null}`;
    return href ? html`<a class=${c} href=${href} title=${title}>${body}</a>` : html`<button type=${type} class=${c} onClick=${onClick} disabled=${disabled} title=${title}>${body}</button>`;
  }
  const IconButton = ({ icon, onClick, title, size, bordered, badge, cls = '' }) => html`<button type="button" class=${`icon-btn ${size || ''} ${bordered ? 'bordered' : ''} ${cls}`} onClick=${onClick} title=${title} aria-label=${title}><${Icon} n=${icon} size=${size === 'sm' ? 14 : 16} />${badge ? html`<span class="dot-badge"></span>` : null}</button>`;

  /* ---------- Menu (dropdown) ---------- */
  /** <Menu trigger=${html`<Button>…</Button>`} items=${[{label, icon, onClick, danger}, '-', {header:'…'}]} align="right" /> */
  function Menu({ trigger, items, align = 'left', width }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();
    PO.useOutside(ref, () => setOpen(false), open);
    return html`<span ref=${ref} style="position:relative;display:inline-flex">
      <span onClick=${(e) => { e.stopPropagation(); setOpen(!open); }} style="display:inline-flex">${trigger}</span>
      ${open ? html`<div class="menu" style=${`top:calc(100% + 4px);${align === 'right' ? 'right:0' : 'left:0'};${width ? 'min-width:' + width + 'px' : ''}`}>
        ${items.filter(Boolean).map((it) => it === '-' ? html`<div class="menu-sep"></div>` : it.header ? html`<div class="menu-h">${it.header}</div>` : html`<button class=${'menu-item ' + (it.danger ? 'danger' : '')} onClick=${(e) => { e.stopPropagation(); setOpen(false); it.onClick && it.onClick(); }}>${it.icon ? html`<${Icon} n=${it.icon} size=${15} />` : null}<span class="grow">${it.label}</span>${it.hint ? html`<span class="faint t-xs">${it.hint}</span>` : null}${it.checked ? html`<${Icon} n="Check" size=${14} />` : null}</button>`)}
      </div>` : null}
    </span>`;
  }

  /* ---------- Tabs / Segmented ---------- */
  /** <Tabs tabs=${[['overview','Overview', count?]]} value=${tab} onChange=${setTab} /> */
  const Tabs = ({ tabs, value, onChange }) => html`<div class="tabs" role="tablist">${tabs.map(([k, label, count]) => html`<button class="tab" role="tab" aria-selected=${value === k} onClick=${() => onChange(k)}>${label}${count != null ? html`<span class="nav-count">${count}</span>` : null}</button>`)}</div>`;
  const Segmented = ({ options, value, onChange }) => html`<div class="seg">${options.map(([k, label]) => html`<button aria-pressed=${value === k} onClick=${() => onChange(k)}>${label}</button>`)}</div>`;
  const Switch = ({ on, onChange, label }) => html`<span class="row"><button type="button" class="switch" role="switch" aria-checked=${!!on} onClick=${() => onChange(!on)}></button>${label ? html`<span>${label}</span>` : null}</span>`;

  /* ---------- Layout pieces ---------- */
  const PageHeader = ({ title, sub, actions, children }) => html`<header class="ph"><div class="ph-title"><h1>${title}</h1>${sub ? html`<p>${sub}</p>` : null}</div><div class="ph-actions">${actions}</div>${children}</header>`;
  const Card = ({ title, sub, actions, children, flush, cls = '', foot, style = '', icon, accent = 'green' }) => html`<section class=${`card ${flush ? 'flush' : ''} ${cls}`} style=${style}>${title ? html`<div class="card-h">${icon ? html`<span class=${'chip-ic ' + accent}><${Icon} n=${icon} size=${14} /></span>` : null}<h3>${title}</h3>${sub ? html`<span class="sub">${sub}</span>` : null}<div class="right">${actions}</div></div>` : null}<div class="card-b">${children}</div>${foot ? html`<div class="card-f">${foot}</div>` : null}</section>`;
  const Section = ({ title, actions, children }) => html`<div class="section-h"><h2>${title}</h2><div class="right">${actions}</div></div>${children}`;
  /** <Stat label="Headcount" value="182" delta={{v:'+4', dir:'up'}} sub="vs last month" icon="Users" spark=${[...]} /> */
  const Stat = ({ label, value, sub, delta, icon, spark, onClick, tone }) => html`<div class="card stat" onClick=${onClick} style=${onClick ? 'cursor:pointer' : ''}>
    <div class="stat-l">${icon ? html`<${Icon} n=${icon} size=${14} />` : null}${label}</div>
    <div class="row" style="align-items:flex-end"><div class="stat-v" style=${tone ? `color:var(--${tone})` : ''}>${value}</div>${spark ? html`<div class="right">${PO.Charts.Sparkline({ data: spark, w: 84, h: 28 })}</div>` : null}</div>
    ${sub || delta ? html`<div class="stat-d">${delta ? html`<span class=${'delta ' + (delta.dir || 'flat')}>${delta.dir === 'up' ? '↑' : delta.dir === 'down' ? '↓' : ''} ${delta.v}</span>` : null}${sub}</div>` : null}
  </div>`;
  /**
   * Duty-board readout: <KpiStrip items=${[{ label, value, unit, sub, tone, href|onClick, alert,
   *   bar: [{ v, k:'ok'|'warn'|'bad'|'mute' }],   // composition, e.g. present / late / absent
   *   ticks: { on, of } }]} />                     // countdown, e.g. 1 of 5 days left
   */
  const KpiStrip = ({ items }) => html`<div class="kpis">${items.filter(Boolean).map((k) => {
    const total = k.bar ? k.bar.reduce((t, b) => t + b.v, 0) || 1 : 0;
    const inner = html`<span class="kpi-top"><span class="kpi-l">${k.label}</span>${k.icon ? html`<span class=${'kpi-ic ' + (k.accent || 'green')}><${Icon} n=${k.icon} size=${15} /></span>` : null}</span>
      <span class="kpi-v" style=${k.tone ? `color:var(--${k.tone})` : ''}>${k.value}${k.unit ? html`<small>${k.unit}</small>` : null}</span>
      ${k.bar ? html`<span class="kpi-bar" title=${k.bar.map((b) => b.title || '').filter(Boolean).join(', ')}>${k.bar.filter((b) => b.v > 0).map((b) => html`<i class=${b.k || 'mute'} style=${`flex:${b.v / total}`}></i>`)}</span>` : null}
      ${k.ticks ? html`<span class="kpi-ticks">${Array.from({ length: k.ticks.of }, (_, i) => html`<i class=${i < k.ticks.on ? 'on' : ''}></i>`)}</span>` : null}
      ${k.faces && k.faces.length ? html`<span class="kpi-faces">${k.faces.slice(0, 5).map((id) => html`<${Avatar} p=${PO.person(id)} size="xs" />`)}${k.faces.length > 5 ? html`<span class="kpi-more">+${k.faces.length - 5}</span>` : null}</span>` : null}
      ${k.sub ? html`<span class="kpi-s">${k.sub}</span>` : null}`;
    const cls = `kpi ${k.alert ? 'alert' : ''} ${k.href || k.onClick ? 'link-kpi' : ''}`;
    return k.href ? html`<a class=${cls} href=${k.href}>${inner}</a>` : html`<div class=${cls} onClick=${k.onClick}>${inner}</div>`;
  })}</div>`;
  const Empty = ({ icon = 'Inbox', title, text, action }) => html`<div class="empty"><div class="spot"><span class="spot-a"></span><span class="spot-b"></span><span class="spot-ic"><${Icon} n=${icon} size=${22} /></span></div><b>${title}</b>${text ? html`<div>${text}</div>` : null}${action ? html`<div class="mt-8">${action}</div>` : null}</div>`;
  const Callout = ({ tone = '', icon = 'Info', title, children, action }) => html`<div class=${'callout ' + tone}><div class="ic"><${Icon} n=${icon} size=${15} /></div><div class="grow">${title ? html`<b>${title}</b>` : null}${children ? html`<div class="callout-body">${children}</div>` : null}</div>${action ? html`<div style="flex:none">${action}</div>` : null}</div>`;
  const Progress = ({ value, tone = '', label }) => html`<div class="row" style="gap:8px"><div class=${'prog ' + tone}><i style=${`width:${Math.max(0, Math.min(100, value))}%`}></i></div>${label !== undefined ? html`<span class="t-sm muted tnum" style="min-width:34px;text-align:right">${label}</span>` : null}</div>`;
  const KV = ({ items, cols2 }) => html`<dl class=${'kv ' + (cols2 ? 'cols-2' : '')}>${items.filter(Boolean).map(([k, v]) => html`<dt>${k}</dt><dd>${v ?? '—'}</dd>`)}</dl>`;
  /** <Timeline items=${[{icon:'Check', tone:'green', title, sub, body}]} /> */
  const Timeline = ({ items }) => html`<div class="timeline">${items.map((it) => html`<div class="tl-item"><div class=${'tl-dot ' + (it.tone || '')}><${Icon} n=${it.icon || 'Circle'} size=${13} /></div><div class="tl-b"><div class="row"><b class="w-550">${it.title}</b>${it.right ? html`<span class="right faint t-sm">${it.right}</span>` : null}</div>${it.sub ? html`<small>${it.sub}</small>` : null}${it.body ? html`<div class="mt-4">${it.body}</div>` : null}</div></div>`)}</div>`;
  /** <Steps steps=${[['Title','sub']]} current=${i} done=${n} onPick=${i=>…} /> */
  const Steps = ({ steps, current, done = current, onPick }) => html`<div class="steps">${steps.map(([t, s], i) => html`<div class=${`step ${i < done ? 'done' : ''} ${i === current ? 'current' : ''}`} onClick=${() => onPick && onPick(i)}><span class="n">${i < done ? html`<${Icon} n="Check" size=${13} stroke=${2.5} />` : i + 1}</span><div style="min-width:0"><b>${t}</b>${s ? html`<small>${s}</small>` : null}</div></div>`)}</div>`;
  const Checklist = ({ items, onToggle }) => html`<div class="checklist">${items.map((it, i) => html`<div class=${'ck ' + (it.done ? 'done' : '')}><span class="box" onClick=${() => onToggle && onToggle(i)}>${it.done ? html`<${Icon} n="Check" size=${12} stroke=${3} />` : null}</span><span class="ck-t grow">${it.t}</span>${it.meta ? html`<span class="faint t-sm">${it.meta}</span>` : null}${it.right || null}</div>`)}</div>`;
  const Field = ({ label, hint, children }) => html`<div class="field">${label ? html`<label>${label}</label>` : null}${children}${hint ? html`<span class="hint">${hint}</span>` : null}</div>`;
  const SearchInput = ({ value, onInput, placeholder = 'Search', width = 240 }) => html`<div class="input-wrap" style=${`width:${width}px`}><${Icon} n="Search" size=${14} /><input class="input" placeholder=${placeholder} value=${value} onInput=${(e) => onInput(e.target.value)} /></div>`;
  const Select = ({ value, onChange, options, width }) => html`<select class="select" style=${width ? `width:${width}px` : ''} value=${value} onChange=${(e) => onChange(e.target.value)}>${options.map((o) => Array.isArray(o) ? html`<option value=${o[0]}>${o[1]}</option>` : html`<option value=${o}>${o}</option>`)}</select>`;

  /* ---------- Overlays ---------- */
  function useEsc(onClose, on = true) { useEffect(() => { if (!on) return; const k = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [on]); }
  /** <Drawer open title onClose footer size="lg">…</Drawer> */
  function Drawer({ open, title, sub, onClose, children, footer, size = '', head }) {
    useEsc(onClose, open);
    if (!open) return null;
    return html`<div class="scrim" onClick=${onClose}></div><aside class=${'drawer ' + size} role="dialog" aria-label=${title}><div class="drawer-h">${head || html`<div class="grow"><h3>${title}</h3>${sub ? html`<div class="faint t-sm">${sub}</div>` : null}</div>`}<${IconButton} icon="X" title="Close" onClick=${onClose} /></div><div class="drawer-b">${children}</div>${footer ? html`<div class="drawer-f">${footer}</div>` : null}</aside>`;
  }
  function Modal({ open, title, onClose, children, footer, size = '', icon, tone }) {
    useEsc(onClose, open);
    if (!open) return null;
    return html`<div class="scrim" onClick=${onClose}></div><div class=${'modal ' + size} role="dialog"><div class="modal-h">${icon ? html`<div class=${'callout ' + (tone || 'brand')} style="padding:0;border:none;background:none"><div class="ic"><${Icon} n=${icon} size=${16} /></div></div>` : null}<h3 class="grow" style="padding-top:4px">${title}</h3><${IconButton} icon="X" size="sm" title="Close" onClick=${onClose} /></div><div class="modal-b">${children}</div>${footer ? html`<div class="modal-f">${footer}</div>` : null}</div>`;
  }

  /* ---------- DataTable ---------- */
  /**
   * <DataTable
   *   rows=${array} rowKey=${r => r.id}
   *   columns=${[{ key:'name', label:'Name', render:(r)=>…, sort:(r)=>r.name, align:'r', width:200, csv:(r)=>… }]}
   *   search=${r => r.name + ' ' + r.title}      // enables the search box
   *   filters=${[{ key:'site', label:'Site', options:[[v,label]], test:(r,v)=>r.site===v }]}
   *   selectable bulk=${(ids, clear) => html`…buttons…`}
   *   onRow=${r => …} pageSize=${25} exportName="employees" toolbar=${extra} empty=${{title,text}} compact initialSort=${{key, dir}}
   * />
   */
  function DataTable({ rows, columns, rowKey = (r) => r.id, search, filters = [], selectable, bulk, onRow, pageSize = 25, exportName, toolbar, empty, compact, initialSort, foot, rowClass, searchPlaceholder = 'Search', bare }) {
    const [q, setQ] = useState('');
    const [fv, setFv] = useState({});
    const [sort, setSort] = useState(initialSort || null);
    const [sel, setSel] = useState(new Set());
    const [page, setPage] = useState(0);
    const filtered = useMemo(() => {
      let r = rows;
      if (q && search) { const t = q.toLowerCase(); r = r.filter((x) => search(x).toLowerCase().includes(t)); }
      filters.forEach((f) => { if (fv[f.key] != null && fv[f.key] !== '') r = r.filter((x) => f.test(x, fv[f.key])); });
      if (sort) { const col = columns.find((c) => c.key === sort.key); const acc = col && (col.sort || ((x) => x[col.key])); if (acc) r = r.slice().sort((a, b) => { const A = acc(a), B = acc(b); return (A > B ? 1 : A < B ? -1 : 0) * (sort.dir === 'desc' ? -1 : 1); }); }
      return r;
    }, [rows, q, fv, sort]);
    useEffect(() => setPage(0), [q, fv]);
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const view = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const allOn = view.length && view.every((r) => sel.has(rowKey(r)));
    const toggleAll = () => { const s = new Set(sel); view.forEach((r) => (allOn ? s.delete(rowKey(r)) : s.add(rowKey(r)))); setSel(s); };
    const toggle = (k) => { const s = new Set(sel); s.has(k) ? s.delete(k) : s.add(k); setSel(s); };
    const doExport = () => PO.exportCsv(exportName, [columns.filter((c) => c.label && c.csv !== false).map((c) => c.label), ...filtered.map((r) => columns.filter((c) => c.label && c.csv !== false).map((c) => (c.csv ? c.csv(r) : c.sort ? c.sort(r) : r[c.key])))]);
    const hasTools = search || filters.length || exportName || toolbar;
    return html`<div class=${bare ? '' : 'card'} style="overflow:hidden">
      ${hasTools ? html`<div class="tbl-toolbar">
        ${search ? html`<${SearchInput} value=${q} onInput=${setQ} placeholder=${searchPlaceholder} />` : null}
        ${filters.map((f) => html`<${FilterSelect} f=${f} value=${fv[f.key]} onChange=${(v) => setFv({ ...fv, [f.key]: v })} />`)}
        ${Object.values(fv).some((v) => v) || q ? html`<${Button} kind="ghost" size="sm" onClick=${() => { setFv({}); setQ(''); }}>Clear</${Button}>` : null}
        <div class="right row">${toolbar}${exportName ? html`<${Button} size="sm" icon="Download" onClick=${doExport}>Export</${Button}>` : null}</div>
      </div>` : null}
      ${selectable && sel.size ? html`<div class="bulkbar"><span>${sel.size} selected</span>${bulk ? bulk([...sel], () => setSel(new Set())) : null}<button class="btn ghost sm right" onClick=${() => setSel(new Set())}>Deselect</button></div>` : null}
      <div class="table-wrap"><table class=${'tbl ' + (compact ? 'compact' : '')}>
        <thead><tr>
          ${selectable ? html`<th class="check-cell"><label class="check"><input type="checkbox" checked=${!!allOn} onChange=${toggleAll} /></label></th>` : null}
          ${columns.map((c) => html`<th class=${`${c.align || ''} ${c.sort !== false && c.label ? 'sortable' : ''}`} style=${c.width ? `width:${c.width}px` : ''} onClick=${() => c.sort !== false && c.label && setSort(sort && sort.key === c.key ? { key: c.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'asc' })}>${c.label}${sort && sort.key === c.key ? html` <${Icon} n=${sort.dir === 'asc' ? 'ArrowUp' : 'ArrowDown'} size=${11} />` : null}</th>`)}
        </tr></thead>
        <tbody>${view.map((r) => { const k = rowKey(r); return html`<tr class=${`${onRow ? 'clickable' : ''} ${sel.has(k) ? 'selected' : ''} ${rowClass ? rowClass(r) : ''}`} onClick=${() => onRow && onRow(r)}>
          ${selectable ? html`<td class="check-cell" onClick=${(e) => e.stopPropagation()}><label class="check"><input type="checkbox" checked=${sel.has(k)} onChange=${() => toggle(k)} /></label></td>` : null}
          ${columns.map((c) => html`<td class=${c.align || ''}>${c.render ? c.render(r) : r[c.key]}</td>`)}
        </tr>`; })}</tbody>
        ${foot ? html`<tfoot>${foot}</tfoot>` : null}
      </table></div>
      ${!filtered.length ? html`<${Empty} icon="SearchX" title=${(empty && empty.title) || 'Nothing matches'} text=${(empty && empty.text) || 'Try a different search or clear the filters.'} />` : null}
      ${filtered.length > pageSize ? html`<div class="tbl-foot"><span>${PO.num(page * pageSize + 1)}–${PO.num(Math.min(filtered.length, (page + 1) * pageSize))} of ${PO.num(filtered.length)}</span><span class="right row"><${IconButton} icon="ChevronLeft" size="sm" title="Previous" onClick=${() => setPage(Math.max(0, page - 1))} /><span class="tnum">Page ${page + 1} of ${pages}</span><${IconButton} icon="ChevronRight" size="sm" title="Next" onClick=${() => setPage(Math.min(pages - 1, page + 1))} /></span></div>` : filtered.length ? html`<div class="tbl-foot">${PO.plural(filtered.length, 'row')}</div>` : null}
    </div>`;
  }
  const FilterSelect = ({ f, value, onChange }) => html`<select class=${'select'} style=${`width:auto;min-width:120px;height:30px;${value ? 'border-color:var(--brand);color:var(--brand-text);background-color:var(--brand-soft)' : ''}`} value=${value || ''} onChange=${(e) => onChange(e.target.value)}><option value="">${f.label}: All</option>${f.options.map((o) => Array.isArray(o) ? html`<option value=${o[0]}>${o[1]}</option>` : html`<option value=${o}>${o}</option>`)}</select>`;

  /* ---------- Month calendar ---------- */
  /** <MonthCal year=${2026} month=${9} events=${{'2026-10-06':[{label, tone}]}} onDay=${iso=>…} /> (month is 0-based) */
  function MonthCal({ year, month, events = {}, onDay, maxEv = 3 }) {
    const first = new Date(Date.UTC(year, month, 1));
    const start = new Date(first); start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
    const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setUTCDate(start.getUTCDate() + i); return d.toISOString().slice(0, 10); });
    return html`<div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => html`<div class="cal-h">${d}</div>`)}${days.map((d) => { const ev = events[d] || []; return html`<div class=${`cal-d ${+d.slice(5, 7) - 1 !== month ? 'out' : ''} ${d === PO.TODAY ? 'today' : ''}`} onClick=${() => onDay && onDay(d)} style=${onDay ? 'cursor:pointer' : ''}><span class="dn">${+d.slice(8)}</span>${ev.slice(0, maxEv).map((e) => html`<span class=${'cal-ev ' + (e.tone || '')} title=${e.label}>${e.label}</span>`)}${ev.length > maxEv ? html`<span class="faint t-xs">+${ev.length - maxEv} more</span>` : null}</div>`; })}</div>`;
  }

  /* ---------- Confirm helper ---------- */
  function useConfirm() {
    const [st, setSt] = useState(null);
    const ask = (opts) => setSt(opts);
    const el = st ? html`<${Modal} open title=${st.title} icon=${st.icon || 'CircleHelp'} tone=${st.tone} onClose=${() => setSt(null)} footer=${html`<${Button} onClick=${() => setSt(null)}>Cancel</${Button}><${Button} kind=${st.danger ? 'danger solid' : 'primary'} onClick=${() => { const f = st.onConfirm; setSt(null); f && f(); }}>${st.confirm || 'Confirm'}</${Button}>`}>${st.body}</${Modal}>` : null;
    return [ask, el];
  }

  /** Profile hero: soft cover band in the person's tint, large portrait overlapping it, name block and actions. */
  const ProfileHero = ({ p, sub, meta, actions, badges, cover }) => html`<div class="phero">
    <div class="phero-cover" style=${`--h:${p.hue}${cover ? ';background:' + cover : ''}`}></div>
    <div class="phero-body">
      <span class="phero-av"><${Avatar} p=${p} size="xl" /></span>
      <div class="phero-t"><div class="row wrap" style="gap:8px"><h1>${p.name}</h1>${badges}</div><div class="phero-sub">${sub}</div>${meta ? html`<div class="phero-meta">${meta}</div>` : null}</div>
      <div class="phero-act">${actions}</div>
    </div>
  </div>`;
  /** Photo-card grid of people (directory "cards" view, teams, crews). */
  const PeopleGrid = ({ people, sub = (p) => p.title, foot, onPick }) => html`<div class="pgrid">${people.map((p) => html`<a class="pcard" href=${onPick ? 'javascript:void 0' : PO.href('people/' + p.id)} onClick=${onPick ? () => onPick(p) : undefined}>
    <span class="pcard-cover" style=${`--h:${p.hue}`}></span><${Avatar} p=${p} size="xl" /><b>${p.name}</b><small>${sub(p)}</small>${foot ? html`<span class="pcard-foot">${foot(p)}</span>` : null}</a>`)}</div>`;
  /** Small icon chip for list rows and section headers. accent: green|amber|red|blue|violet|teal */
  const Chip = ({ icon, accent = 'green', size = 14 }) => html`<span class=${'chip-ic ' + accent}><${Icon} n=${icon} size=${size} /></span>`;

  Object.assign(PO, { ProfileHero, PeopleGrid, Chip, Icon, Avatar, Who, AvatarStack, Badge, Status, toneOf, Button, IconButton, Menu, Tabs, Segmented, Switch, PageHeader, Card, Section, Stat, KpiStrip, Empty, Callout, Progress, KV, Timeline, Steps, Checklist, Field, SearchInput, Select, Drawer, Modal, DataTable, MonthCal, useConfirm });
})();
