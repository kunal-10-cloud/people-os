/* People OS: interactive org chart (reporting line / site / department), with department and site summaries. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect, useRef } = PO;
  const { Icon, Avatar, Who, Badge, Status, Button, IconButton, Tabs, Segmented, PageHeader, Card, Stat, Empty, KV, Drawer, Progress } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .org-vp { position:relative; overflow:hidden; height:calc(100vh - 262px); min-height:500px; border-radius:var(--r-lg); border:1px solid var(--border); cursor:grab; touch-action:none; user-select:none; background-color:color-mix(in srgb, var(--brand-soft) 55%, var(--surface-2)); }
  .org-node { box-shadow:0 1px 2px rgba(20,40,30,.06); }
  .org-node .av.lg { box-shadow:0 0 0 2px var(--surface), 0 0 0 3px var(--border); }
  .org-node.group .chip-ic { width:30px; height:30px; }
  .org-vp.drag { cursor:grabbing; }
  .org-canvas { position:absolute; left:0; top:0; transform-origin:0 0; will-change:transform; }
  .org-canvas.anim { transition:transform .35s cubic-bezier(.2,.8,.2,1); }
  .org-lines { position:absolute; left:0; top:0; overflow:visible; pointer-events:none; }
  .org-lines path { fill:none; stroke:var(--border-strong); stroke-width:1.4; }
  .org-node { position:absolute; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:10px 12px; display:flex; gap:10px; align-items:flex-start; cursor:pointer; transition:box-shadow .15s, border-color .15s; text-align:left; }
  .org-node:hover { border-color:var(--border-strong); }
  .org-node.top { border-top:2px solid var(--brand); }
  .org-node.hl { border-color:var(--signal); box-shadow:0 0 0 3px color-mix(in srgb, var(--signal) 25%, transparent); }
  .org-node.me { border-color:var(--brand); }
  .org-node b { display:block; font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .org-node small { display:block; color:var(--text-3); font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .org-node .org-tm { position:absolute; right:10px; top:10px; font-family:var(--num); font-size:13px; font-weight:600; color:var(--text-2); }
  .org-node.leaf { align-items:center; padding:8px 10px; border-radius:6px; }
  .org-node.group { background:var(--surface); }
  .org-node.job { border:1px dashed var(--border-strong); background:transparent; align-items:center; }
  .org-node.job:hover { border-color:var(--brand); }
  .org-node.job .ji { width:28px; height:28px; border-radius:50%; border:1.5px dashed var(--text-3); display:grid; place-items:center; color:var(--text-3); flex:none; }
  .org-tog { position:absolute; transform:translateX(-50%); height:22px; padding:0 9px; border-radius:6px; border:1px solid var(--border-strong); background:var(--surface); font-size:11px; font-weight:600; color:var(--text-2); display:inline-flex; align-items:center; gap:4px; cursor:pointer; box-shadow:var(--shadow-xs); white-space:nowrap; z-index:2; }
  .org-tog:hover { color:var(--brand-text); border-color:var(--brand); }
  .org-tog.more { color:var(--text); }
  .org-tools { position:absolute; right:12px; top:12px; display:flex; flex-direction:column; gap:6px; z-index:5; }
  .org-tools .grp { display:flex; flex-direction:column; background:var(--surface); border:1px solid var(--border); border-radius:10px; box-shadow:var(--shadow-sm); overflow:hidden; }
  .org-tools .grp .icon-btn { border-radius:0; }
  .org-tools .grp .icon-btn + .icon-btn { border-top:1px solid var(--border); }
  .org-zoom { position:absolute; left:12px; bottom:12px; z-index:5; font-size:11.5px; color:var(--text-2); background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:4px 8px; box-shadow:var(--shadow-xs); display:flex; gap:10px; align-items:center; }
  .org-search { position:relative; }
  .org-results { position:absolute; top:calc(100% + 4px); left:0; width:320px; z-index:40; }
  .org-legend { position:absolute; right:12px; bottom:12px; z-index:5; display:flex; gap:12px; font-size:11.5px; color:var(--text-2); background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:5px 10px; box-shadow:var(--shadow-xs); }
  .org-legend i { display:inline-block; width:12px; height:10px; border-radius:3px; margin-right:5px; vertical-align:-1px; }
  .org-dc { display:flex; flex-direction:column; }
  .org-dc .org-dc-h { display:flex; gap:12px; align-items:center; padding:14px 16px; border-bottom:1px solid var(--border); }
  .org-dc .org-dc-h .gi { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; background:var(--brand-soft); color:var(--brand-text); flex:none; }
  .org-dc .org-dc-s { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-bottom:1px solid var(--border); }
  .org-dc .org-dc-s > div { padding:10px 16px; border-right:1px solid var(--border); min-width:0; }
  .org-dc .org-dc-s > div:last-child { border-right:none; }
  .org-dc .org-dc-s small { color:var(--text-3); font-size:11.5px; display:block; } .org-dc .org-dc-s b { font-size:15px; font-weight:650; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .org-maplg { display:flex; gap:10px; background:var(--surface); color:var(--text-2); border-radius:6px; padding:5px 10px; font-size:11.5px; font-weight:500; box-shadow:var(--shadow-sm); }
  .org-maplg i { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:5px; }
  .org-mix { display:flex; height:8px; border-radius:4px; overflow:hidden; background:var(--surface-3); }
  .org-mix i { display:block; height:100%; }
  </style>`);

  const NW = 232, NH = 70, LW = 214, LH = 50, LG = 8, HG = 22, VG = 54, INDENT = 22, ROWS = 8;
  const PX = () => PO.PX;

  /* ---------- tree building ---------- */
  function buildTree(P, mode) {
    const people = P.people;
    const jobsBySite = {};
    P.jobs.forEach((j) => (jobsBySite[j.site] = jobsBySite[j.site] || []).push(j));
    const jobNode = (j) => ({ key: 'job:' + j.id, kind: 'job', job: j, children: [] });
    if (mode === 'line') {
      const jobsBy = {};
      P.jobs.forEach((j) => { const s = PO.site(j.site); const office = /payroll|HR|account|office|admin/i.test(j.title); const owner = office ? P.hrId : s && s.lead && P.byId[s.lead] ? s.lead : P.topId; (jobsBy[owner] = jobsBy[owner] || []).push(j); });
      const mk = (id, depth) => {
        const kids = (P.byManager[id] || []).map((c) => mk(c, depth + 1));
        const jobs = (jobsBy[id] || []).map(jobNode);
        kids.sort((a, b) => (b.children.length - a.children.length) || a.p.name.localeCompare(b.p.name));
        return { key: id, kind: 'p', p: P.byId[id], children: kids, jobs };
      };
      return mk(P.topId, 0);
    }
    const C = P.company;
    const root = { key: 'co', kind: 'g', label: C.name, sub: `${P.people.length} people in ${C.city}`, icon: 'Building2', children: [], jobs: [] };
    const groups = mode === 'site'
      ? P.sites.map((s) => ({ key: 'site:' + s.id, label: s.name, sub: s.client && s.client !== C.short && s.client !== 'Sentinel' ? s.client : 'Head office', icon: 'MapPin', members: people.filter((p) => p.site === s.id), lead: s.lead, jobs: jobsBySite[s.id] || [] }))
      : P.depts.map((d) => ({ key: 'dept:' + d.name, label: d.name, sub: `Head: ${P.byId[d.head].name}`, icon: 'Building', members: people.filter((p) => p.dept === d.name), lead: d.head, jobs: P.jobs.filter((j) => { const roleDept = Object.entries(P.vocab.dept).find(([k]) => (P.roles[k] || {}).title && j.title.toLowerCase().includes(P.roles[k].title.toLowerCase().split(' ')[0])); return roleDept && roleDept[1] === d.name; }) }));
    root.children = groups.filter((g) => g.members.length).map((g) => {
      const ordered = g.members.slice().sort((a, b) => (a.id === P.topId ? -1 : b.id === P.topId ? 1 : a.id === g.lead ? -1 : b.id === g.lead ? 1 : a.role === 'sup' || a.inCharge ? -1 : b.role === 'sup' || b.inCharge ? 1 : a.name.localeCompare(b.name)));
      return { key: g.key, kind: 'g', label: g.label, sub: g.sub, icon: g.icon, count: g.members.length, children: ordered.map((p) => ({ key: g.key + '/' + p.id, pid: p.id, kind: 'p', p, children: [], jobs: [] })), jobs: g.jobs.map(jobNode) };
    });
    return root;
  }
  const sizeOf = (n) => n.children.reduce((t, c) => t + (c.kind === 'p' ? 1 : 0) + sizeOf(c), 0);
  function index(root) {
    const parent = {}, all = {};
    const walk = (n, par) => { all[n.key] = n; if (par) parent[n.key] = par.key; n.size = sizeOf(n); n.children.forEach((c) => walk(c, n)); };
    walk(root, null);
    return { parent, all };
  }
  function defaultOpen(root) {
    const open = new Set([root.key]);
    root.children.forEach((c) => { if (c.size && c.size <= 6) open.add(c.key); });
    return open;
  }

  /* ---------- layout ---------- */
  function layout(root, open) {
    const nodes = [], lines = [], togs = [];
    const isLeaf = (n) => n.kind === 'job' || !n.children.length;
    const kidsOf = (n) => [...(open.has(n.key) ? n.children : []), ...(n.jobs || [])];
    function measure(n) {
      const kids = kidsOf(n);
      if (!kids.length) { n.w = NW; n.h = NH; return; }
      const branches = kids.filter((c) => !isLeaf(c));
      const leaves = kids.filter(isLeaf);
      branches.forEach(measure);
      const rows = Math.min(ROWS, Math.max(1, Math.ceil(leaves.length / Math.max(1, Math.ceil(leaves.length / ROWS)))));
      const cols = [];
      for (let i = 0; i < leaves.length; i += rows) cols.push(leaves.slice(i, i + rows));
      n.slots = [...branches.map((b) => ({ b, w: b.w, h: b.h })), ...cols.map((c) => ({ col: c, w: LW + INDENT, h: c.length * (LH + LG) - LG }))];
      const tw = n.slots.reduce((t, s) => t + s.w, 0) + HG * (n.slots.length - 1);
      n.w = Math.max(NW, tw); n.h = NH + VG + Math.max(...n.slots.map((s) => s.h));
    }
    function place(n, x, y, depth) {
      n.x = x + (n.w - NW) / 2; n.y = y;
      nodes.push({ n, x: n.x, y, w: NW, h: NH, depth });
      if (n.children.length) togs.push({ n, x: n.x + NW / 2, y: y + NH - 11 });
      if (!n.slots || !kidsOf(n).length) return;
      const tw = n.slots.reduce((t, s) => t + s.w, 0) + HG * (n.slots.length - 1);
      let cx = x + (n.w - tw) / 2;
      const cy = y + NH + VG, my = y + NH + VG / 2, px = n.x + NW / 2;
      const tops = [];
      n.slots.forEach((s) => {
        if (s.b) { place(s.b, cx, cy, depth + 1); tops.push(s.b.x + NW / 2); lines.push(`M${s.b.x + NW / 2} ${my}V${cy}`); }
        else {
          const sx = cx + 10; tops.push(sx);
          s.col.forEach((c, k) => { const ly = cy + k * (LH + LG); nodes.push({ n: c, x: cx + INDENT, y: ly, w: LW, h: LH, leaf: true, depth: depth + 1 }); lines.push(`M${sx} ${ly + LH / 2}H${cx + INDENT}`); });
          lines.push(`M${sx} ${my}V${cy + (s.col.length - 1) * (LH + LG) + LH / 2}`);
        }
        cx += s.w + HG;
      });
      lines.push(`M${px} ${y + NH}V${my}`);
      const lo = Math.min(px, ...tops), hi = Math.max(px, ...tops);
      if (hi > lo) lines.push(`M${lo} ${my}H${hi}`);
    }
    measure(root);
    place(root, 0, 0, 0);
    return { nodes, lines, togs, W: root.w, H: root.h + 30 };
  }

  /* ---------- chart ---------- */
  function OrgChart({ mode, setMode, focus }) {
    const P = PO.P();
    const v = PO.viewer();
    const { state } = PO.useStore();
    const tree = useMemo(() => buildTree(P, mode), [P.id, mode]);
    const idx = useMemo(() => index(tree), [tree]);
    const [open, setOpen] = useState(() => defaultOpen(tree));
    const [hl, setHl] = useState(null);
    const [sel, setSel] = useState(null);
    const [q, setQ] = useState('');
    const [view, setView] = useState({ s: 0.8, x: 0, y: 0, anim: false });
    const vp = useRef();
    const drag = useRef(null);
    const pending = useRef(null);
    useEffect(() => { setOpen(defaultOpen(tree)); setHl(null); }, [tree]);
    const L = useMemo(() => layout(tree, open), [tree, open]);

    const fit = (anim = true) => {
      const el = vp.current; if (!el) return;
      const vw = el.clientWidth, vh = el.clientHeight;
      const s = Math.max(0.3, Math.min(1, (vw - 60) / L.W, (vh - 60) / L.H));
      setView({ s, x: (vw - L.W * s) / 2, y: 28, anim });
    };
    const center = (key, s0) => {
      const el = vp.current; if (!el) return;
      const nd = L.nodes.find((x) => x.n.key === key); if (!nd) return;
      const s = s0 || Math.max(view.s, 0.85);
      setView({ s, x: el.clientWidth / 2 - (nd.x + nd.w / 2) * s, y: el.clientHeight / 3 - (nd.y + nd.h / 2) * s, anim: true });
    };
    // first paint: fit if readable, else show the top of the tree at a readable zoom
    const first = useRef(true);
    useEffect(() => {
      const el = vp.current; if (!el) return;
      const vw = el.clientWidth;
      const s = Math.min(1, (vw - 60) / L.W);
      if (first.current || pending.current === 'fit') {
        first.current = false; pending.current = null;
        if (s >= 0.85) fit(false); else { const ss = 0.9; const root = L.nodes[0]; setView({ s: ss, x: vw / 2 - (root.x + NW / 2) * ss, y: 28, anim: false }); }
      } else if (pending.current) { const k = pending.current; pending.current = null; center(k); }
    }, [L]);
    useEffect(() => { if (focus) { const k = mode === 'line' ? focus : null; if (k && idx.all[k]) reveal(k); } }, [focus]);

    const reveal = (key) => {
      const o = new Set(open);
      let k = idx.parent[key];
      while (k) { o.add(k); k = idx.parent[k]; }
      pending.current = key;
      setHl(key);
      setOpen(o);
      if ([...o].every((x) => open.has(x)) && o.size === open.size) { pending.current = null; setTimeout(() => center(key), 0); }
    };
    const toggle = (n) => { const o = new Set(open); if (o.has(n.key)) { const close = (m) => { o.delete(m.key); m.children.forEach(close); }; close(n); } else o.add(n.key); setOpen(o); };
    const expandAll = () => { pending.current = 'fit'; setOpen(new Set(Object.keys(idx.all))); };
    const collapseAll = () => { pending.current = 'fit'; setOpen(defaultOpen(tree)); };
    const zoom = (f) => { const el = vp.current; const cx = el.clientWidth / 2, cy = el.clientHeight / 2; const s = Math.max(0.25, Math.min(1.6, view.s * f)); setView({ s, x: cx - ((cx - view.x) / view.s) * s, y: cy - ((cy - view.y) / view.s) * s, anim: true }); };

    const onDown = (e) => { if (e.target.closest('.org-node,.org-tog,.org-tools,button,input')) return; drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; vp.current.setPointerCapture(e.pointerId); vp.current.classList.add('drag'); };
    const onMove = (e) => { const d = drag.current; if (!d) return; setView({ ...view, x: d.vx + e.clientX - d.x, y: d.vy + e.clientY - d.y, anim: false }); };
    const onUp = () => { drag.current = null; vp.current && vp.current.classList.remove('drag'); };
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) { const r = vp.current.getBoundingClientRect(); const cx = e.clientX - r.left, cy = e.clientY - r.top; const s = Math.max(0.25, Math.min(1.6, view.s * (e.deltaY < 0 ? 1.08 : 0.92))); setView({ s, x: cx - ((cx - view.x) / view.s) * s, y: cy - ((cy - view.y) / view.s) * s, anim: false }); }
      else setView({ ...view, x: view.x - e.deltaX, y: view.y - e.deltaY, anim: false });
    };
    useEffect(() => { const el = vp.current; if (!el) return; el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel); });

    const results = q.trim().length > 1 ? P.people.filter((p) => `${p.name} ${p.id} ${p.title}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
    const keyFor = (pid) => (mode === 'line' ? pid : Object.keys(idx.all).find((k) => idx.all[k].pid === pid));
    const pick = (p) => { setQ(''); reveal(keyFor(p.id)); };

    const card = (nd) => {
      const n = nd.n;
      const style = `left:${nd.x}px;top:${nd.y}px;width:${nd.w}px;height:${nd.h}px`;
      if (n.kind === 'job') { const site = PO.site(n.job.site); return html`<div class=${'org-node job leaf'} style=${style} onClick=${() => setSel({ job: n.job })} title="Open role"><span class="ji"><${Icon} n="Plus" size=${14} /></span><span style="min-width:0;flex:1"><b>${n.job.title}</b><small>Hiring ${n.job.openings}${site ? ' at ' + site.name : ''}</small></span></div>`; }
      if (n.kind === 'g') return html`<div class=${'org-node group ' + (nd.depth === 0 ? 'top' : '') + (hl === n.key ? ' hl' : '')} style=${style} onClick=${() => toggle(n)}>${n.icon ? html`<${PO.Chip} icon=${n.icon} accent=${nd.depth === 0 ? 'green' : n.icon === 'MapPin' ? 'teal' : 'violet'} />` : null}<span style="min-width:0;flex:1;padding-right:34px"><b>${n.label}</b><small>${n.sub}</small>${n.jobs && n.jobs.length ? html`<small style="margin-top:2px">${n.jobs.reduce((t, j) => t + j.job.openings, 0)} open roles</small>` : null}</span>${n.size ? html`<span class="org-tm" title=${`${n.size} people`}>${n.size}</span>` : null}</div>`;
      const p = n.p;
      const me = p.id === v.id && state.role !== 'admin';
      if (nd.leaf) return html`<div class=${'org-node leaf' + (hl === n.key ? ' hl' : '') + (me ? ' me' : '')} style=${style} onClick=${() => setSel({ p })}><${Avatar} p=${p} /><span style="min-width:0;flex:1"><b>${p.name}${me ? ' (you)' : ''}</b><small>${p.title}${mode !== 'site' ? ', ' + (PO.site(p.site) || {}).name : ', shift ' + p.shift}</small></span>${p.status !== 'Active' ? html`<span title=${p.status} style="width:7px;height:7px;border-radius:50%;background:var(--amber-solid);flex:none"></span>` : null}</div>`;
      const direct = (P.byManager[p.id] || []).length;
      return html`<div class=${'org-node ' + (nd.depth === 0 ? 'top' : '') + (hl === n.key ? ' hl' : '') + (me ? ' me' : '')} style=${style} onClick=${() => setSel({ p })}><${Avatar} p=${p} size="lg" /><span style="min-width:0;flex:1;padding-right:${n.size ? 30 : 0}px"><b>${p.name}${me ? ' (you)' : ''}</b><small>${p.title}</small><small style="margin-top:2px">${(PO.site(p.site) || {}).name}${direct ? `, ${direct} direct` : ''}</small></span>${n.size ? html`<span class="org-tm" title=${`${n.size} people in this team`}>${n.size}</span>` : null}</div>`;
    };

    const hiring = P.jobs.reduce((t, j) => t + j.openings, 0);
    return html`<div class="col gap-12">
      <div class="row wrap" style="gap:10px">
        <div class="org-search"><${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Find a person in the chart" width=${280} />
          ${results.length ? html`<div class="menu org-results">${results.map((p) => html`<button class="menu-item" style="height:42px" onClick=${() => pick(p)}><${Avatar} p=${p} size="sm" /><span class="grow" style="min-width:0"><b class="w-550" style="display:block">${p.name}</b><small class="faint ellipsis" style="display:block">${p.title}, ${(PO.site(p.site) || {}).name}</small></span></button>`)}</div>` : q.trim().length > 1 ? html`<div class="menu org-results"><div class="menu-h">No one matches “${q}”</div></div>` : null}
        </div>
        <${Segmented} options=${[['line', 'Reporting line'], ['site', P.id === 'us' ? 'Location' : 'Site'], ['dept', 'Department']]} value=${mode} onChange=${setMode} />
        ${hl ? html`<button class="filter-chip on" onClick=${() => setHl(null)}>${(idx.all[hl] && (idx.all[hl].p ? idx.all[hl].p.name : idx.all[hl].label)) || ''}<${Icon} n="X" size=${12} /></button>` : null}
        <span class="right row">
          ${state.role !== 'admin' ? html`<${Button} size="sm" onClick=${() => reveal(keyFor(v.id))}>Find me</${Button}>` : null}
          <${Button} size="sm" kind="ghost" onClick=${expandAll}>Expand all</${Button}>
          <${Button} size="sm" kind="ghost" onClick=${collapseAll}>Collapse</${Button}>
        </span>
      </div>
      <div class="org-vp" ref=${vp} onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onPointerCancel=${onUp}>
        <div class=${'org-canvas ' + (view.anim ? 'anim' : '')} style=${`width:${L.W}px;height:${L.H}px;transform:translate(${view.x}px,${view.y}px) scale(${view.s})`}>
          <svg class="org-lines" width=${L.W} height=${L.H}><path d=${L.lines.join('')} /></svg>
          ${L.nodes.map(card)}
          ${L.togs.map((t) => { const isOpen = open.has(t.n.key); return html`<button class=${'org-tog ' + (isOpen ? '' : 'more')} style=${`left:${t.x}px;top:${t.y + 11 + 2}px`} onClick=${(e) => { e.stopPropagation(); toggle(t.n); }} title=${isOpen ? 'Collapse team' : 'Expand team'}>${isOpen ? html`<${Icon} n="ChevronUp" size=${12} />` : html`+${PO.plural(t.n.size, 'person', 'people')}`}</button>`; })}
        </div>
        <div class="org-tools">
          <div class="grp"><${IconButton} icon="Plus" title="Zoom in" onClick=${() => zoom(1.2)} /><${IconButton} icon="Minus" title="Zoom out" onClick=${() => zoom(1 / 1.2)} /></div>
          <div class="grp"><${IconButton} icon="Maximize" title="Fit to screen" onClick=${() => fit()} /><${IconButton} icon="House" title="Back to the top" onClick=${() => center(tree.key, 0.9)} /></div>
        </div>
        <div class="org-zoom"><span class="tnum">${Math.round(view.s * 100)}%</span><span class="faint">Drag to pan, ⌘ and scroll to zoom</span></div>
        <div class="org-legend"><span><i style="background:var(--surface);border:1px solid var(--border-strong)"></i>Employee</span><span><i style="border:1px dashed var(--text-3)"></i>Open role (${hiring})</span><span><i style="background:var(--amber-solid);width:7px;height:7px;border-radius:50%"></i>Probation</span></div>
      </div>
      ${sel ? html`<${MiniProfile} sel=${sel} onClose=${() => setSel(null)} onTeam=${(p) => { setSel(null); if (mode !== 'line') setMode('line'); else { const o = new Set(open); o.add(p.id); let k = idx.parent[p.id]; while (k) { o.add(k); k = idx.parent[k]; } pending.current = p.id; setHl(p.id); setOpen(o); } }} />` : null}
    </div>`;
  }

  function MiniProfile({ sel, onClose, onTeam }) {
    const P = PO.P();
    if (sel.job) {
      const j = sel.job; const site = PO.site(j.site) || {}; const cands = P.candidates.filter((c) => c.job === j.id);
      const by = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((s) => [s, cands.filter((c) => c.stage === s).length]);
      return html`<${Drawer} open size="sm" title=${j.title} sub=${`${j.id}, ${site.name}`} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Close</${Button}><${Button} kind="primary" onClick=${() => PO.go('hiring')}>Open in hiring</${Button}>`}>
        <div class="col gap-16">
          <div class="muted t-sm">${PO.plural(j.openings, 'opening')}, posted ${PO.rel(j.posted).toLowerCase()}.</div>
          <${KV} items=${[['Reports to', P.byId[j.hiringManager] ? P.byId[j.hiringManager].name : '—'], [P.id === 'us' ? 'Location' : 'Site', site.name], ['Sources', j.sources.join(', ')], ['Candidates', String(cands.length)]]} />
          <${Card} title="Pipeline">${by.map(([s, n]) => html`<div class="row t-sm" style="margin-bottom:8px"><span style="width:80px" class="muted">${s}</span><div class="grow"><${Progress} value=${cands.length ? (n / cands.length) * 100 : 0} label=${String(n)} /></div></div>`)}</${Card}>
        </div>
      </${Drawer}>`;
    }
    const p = sel.p;
    const mgr = p.manager ? P.byId[p.manager] : null;
    const reports = (P.byManager[p.id] || []).map((id) => P.byId[id]);
    const team = PX().teamIds(P, p.id).length;
    return html`<${Drawer} open size="sm" title="" head=${html`<div class="grow row gap-12"><${Avatar} p=${p} size="lg" /><div style="min-width:0"><b class="w-600 t-md">${p.name}</b><div class="faint t-sm ellipsis">${p.title}</div></div></div>`} onClose=${onClose} footer=${html`${reports.length ? html`<${Button} onClick=${() => onTeam(p)}>Show team</${Button}>` : null}<span class="grow"></span><${Button} kind="primary" onClick=${() => PO.go('people/' + p.id)}>View profile</${Button}>`}>
      <div class="col gap-16">
        <div class="row"><${Status} s=${p.status} /><span class="faint t-sm tnum">${p.id}</span><span class="right row" style="gap:4px"><${IconButton} icon="Phone" bordered size="sm" title=${p.phone} onClick=${() => PO.toast(`Calling ${p.first} on ${p.phone}`, { icon: 'Phone' })} /><${IconButton} icon="MessageCircle" bordered size="sm" title=${'Message on ' + P.msg.channel} onClick=${() => PO.toast(`${P.msg.channel} chat with ${p.first} opened`, { icon: 'MessageCircle' })} /><${IconButton} icon="Mail" bordered size="sm" title=${p.email} onClick=${() => PO.toast(`Email draft opened for ${p.email}`, { icon: 'Mail' })} /></span></div>
        <${KV} items=${[[P.id === 'us' ? 'Location' : 'Site', (PO.site(p.site) || {}).name], ['Department', p.dept], ['Shift', html`<${PX().ShiftChip} k=${p.shift} />`], ['Reports to', mgr ? html`<a class="link" href=${PO.href('people/' + mgr.id)}>${mgr.name}</a>` : 'Top of the org'], ['Tenure', PO.tenure(p.tenureMonths)], ['Team', team ? `${PO.plural(reports.length, 'direct report')}, ${team} in total` : 'No reports']]} />
        ${reports.length ? html`<div><div class="row" style="margin-bottom:8px"><b class="t-sm w-600">Direct reports</b><span class="right faint t-sm">${reports.length}</span></div><div class="col" style="gap:6px">${reports.slice(0, 6).map((r) => html`<${Who} p=${r} size="sm" sub=${r.title} />`)}${reports.length > 6 ? html`<span class="faint t-sm">and ${reports.length - 6} more</span>` : null}</div></div>` : null}
      </div>
    </${Drawer}>`;
  }

  /* Map label decluttering: mirrors core/maps.js fit() to find the zoom the map will open at, then keeps the
     full label only on pins whose label box doesn't collide with a neighbour (others show just their count). */
  const gwx = (lng, z) => ((lng + 180) / 360) * 256 * Math.pow(2, z);
  const gwy = (lat, z) => { const s = Math.sin((lat * Math.PI) / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * Math.pow(2, z); };
  function gFitZ(pins, w, h, pad) { if (pins.length < 2) return 15; let z = 17; for (; z > 2; z--) { const xs = pins.map((p) => gwx(p.lng, z)), ys = pins.map((p) => gwy(p.lat, z)); if (Math.max(...xs) - Math.min(...xs) <= w - pad * 2 && Math.max(...ys) - Math.min(...ys) <= h - pad * 2 - 30) break; } return z; }
  function declutter(pins, w, h, pad, selected) {
    if (!w || pins.length < 2) return pins;
    const z = gFitZ(pins, w, h, pad);
    const box = (p, full) => { const x = gwx(p.lng, z), y = gwy(p.lat, z); const W = full ? 44 + p.label.length * 6.9 + (p.sub ? 6 + p.sub.length * 5.9 : 0) : 42; return { x0: x - W / 2 - 2, x1: x + W / 2 + 2, y0: y - 42, y1: y - 10 }; };
    const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    const boxes = pins.map((p) => box(p, false));
    const full = new Set();
    pins.map((p, i) => i).sort((a, b) => (pins[b].id === selected) - (pins[a].id === selected) || (pins[b].count || 0) - (pins[a].count || 0)).forEach((i) => {
      const fb = box(pins[i], true);
      if (pins[i].id === selected || boxes.every((b, j) => j === i || !hit(fb, b))) { boxes[i] = fb; full.add(i); }
    });
    return [...pins.map((p, i) => (full.has(i) ? null : { ...p, label: '', sub: undefined })).filter(Boolean), ...pins.filter((p, i) => full.has(i))];
  }
  function useWidth() {
    const ref = useRef(); const [w, setW] = useState(0);
    useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth - 2)); ro.observe(el); setW(el.clientWidth - 2); return () => ro.disconnect(); }, []);
    return [ref, w];
  }

  /* ---------- departments & sites ---------- */
  function groupStats(P, members) {
    const cost = members.reduce((t, p) => t + p.pay.gross + p.pay.erTotal, 0);
    const due = members.filter((p) => p.shift === P.current && p.role !== 'office');
    const present = due.filter((p) => !P.absent.has(p.id)).length;
    const ten = members.length ? members.reduce((t, p) => t + p.tenureMonths, 0) / members.length : 0;
    const types = ['Full-time', 'Part-time', 'Contract'].map((t) => [t, members.filter((p) => p.type === t).length]).filter(([, n]) => n);
    return { cost, due: due.length, present, att: due.length ? present / due.length : 1, ten, types, late: due.filter((p) => P.lateMap[p.id]).length };
  }
  const typeColor = { 'Full-time': 'var(--chart-1)', 'Part-time': 'var(--chart-2)', Contract: 'var(--chart-3)' };
  const per = (P) => (P.id === 'in' ? 'a month' : P.id === 'us' ? 'per 2 weeks' : 'per 4 weeks');
  const costL = (P) => (P.id === 'in' ? 'Monthly cost' : P.id === 'us' ? 'Cost / 2 wks' : 'Cost / 4 wks');

  const DEPT_IC = (n) => (/secur|guard/i.test(n) ? 'ShieldCheck' : /health/i.test(n) ? 'HeartPulse' : /clean|house/i.test(n) ? 'Sparkles' : /facility|mainten|tech|specialist/i.test(n) ? 'Wrench' : /kitchen|bak|prod/i.test(n) ? 'ChefHat' : /caf|retail|store/i.test(n) ? 'Coffee' : /logist|deliver|driv/i.test(n) ? 'Truck' : /supervis|operat/i.test(n) ? 'ClipboardCheck' : /office|hr|admin/i.test(n) ? 'Building2' : 'Users');
  const DEPT_AC = (n) => ({ ShieldCheck: 'green', HeartPulse: 'rose', Sparkles: 'teal', Wrench: 'blue', ChefHat: 'amber', Coffee: 'rose', Truck: 'blue', ClipboardCheck: 'violet', Building2: 'violet', Users: 'green' })[DEPT_IC(n)];
  function Departments({ onChart }) {
    const P = PO.P();
    const depts = useMemo(() => P.depts.map((d) => ({ ...d, members: P.people.filter((p) => p.dept === d.name) })).map((d) => ({ ...d, s: groupStats(P, d.members) })).sort((a, b) => b.count - a.count), [P.id]);
    const total = depts.reduce((t, d) => t + d.s.cost, 0);
    return html`<div class="grid g-main" style="align-items:start">
      <${PO.DataTable} rows=${depts} rowKey=${(d) => d.name} onRow=${() => onChart('dept')} columns=${[
        { key: 'name', label: 'Department', render: (d) => html`<span class="row" style="gap:10px"><${PO.Chip} icon=${DEPT_IC(d.name)} accent=${DEPT_AC(d.name)} /><b class="w-550" style="white-space:nowrap">${d.name}</b></span>`, sort: (d) => d.name },
        { key: 'head', label: 'Head', render: (d) => html`<${Who} id=${d.head} sub=${P.byId[d.head].title} />`, sort: (d) => P.byId[d.head].name, csv: (d) => P.byId[d.head].name },
        { key: 'count', label: 'People', align: 'r', render: (d) => html`<span class="row" style="gap:10px;justify-content:flex-end"><${PO.AvatarStack} ids=${d.members.filter((m) => m.id !== d.head).map((m) => m.id)} max=${3} size="xs" /><span class="tnum" style="min-width:24px">${d.count}</span></span>`, sort: (d) => d.count },
        { key: 'mix', label: 'Employment mix', sort: false, csv: false, render: (d) => html`<div style="width:120px"><div class="org-mix">${d.s.types.map(([t, n]) => html`<i style=${`width:${(n / d.count) * 100}%;background:${t === 'Full-time' ? 'var(--brand)' : 'var(--border-strong)'}`} title=${`${t}: ${n}`}></i>`)}</div><div class="faint t-xs mt-4">${d.s.types.map(([t, n]) => `${n} ${t.toLowerCase()}`).join(', ')}</div></div>` },
        { key: 'att', label: 'Present now', align: 'r', render: (d) => html`<span class="tnum" style=${d.s.due && d.s.att < 0.92 ? 'color:var(--amber)' : ''}>${d.s.due ? PO.pct(d.s.att) : '—'}</span>`, sort: (d) => d.s.att },
        { key: 'ten', label: 'Avg tenure', align: 'r', render: (d) => html`<span class="tnum" style="white-space:nowrap">${PO.tenure(Math.round(d.s.ten))}</span>`, sort: (d) => d.s.ten },
        { key: 'cost', label: costL(P), align: 'r', render: (d) => html`<span class="tnum">${PO.compactMoney(d.s.cost)}</span>`, sort: (d) => d.s.cost },
      ]} />
      <div class="col gap-16">
        <${Card} title="Payroll cost share" sub=${`${PO.compactMoney(total)} ${per(P)}`}><${PO.Charts.HBars} data=${depts.map((d) => ({ label: d.name, value: Math.round(d.s.cost), sub: PO.pct(d.s.cost / total) }))} fmt=${(v) => PO.compactMoney(v)} /></${Card}>
      </div>
    </div>`;
  }

  function Sites({ onChart }) {
    const P = PO.P();
    const sites = useMemo(() => P.sites.map((s) => { const members = P.people.filter((p) => p.site === s.id); const live = P.live.find((l) => l.site === s.id) || { due: 0, in: 0, late: 0, absent: 0 }; return { ...s, members, live, st: groupStats(P, members), jobs: P.jobs.filter((j) => j.site === s.id) }; }), [P.id]);
    const [pick, setPick] = useState(null);
    const isHQ = (s) => s.id === 'hq' || s.client === 'Head office';
    const pins = useMemo(() => sites.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.name, count: s.members.length, tone: isHQ(s) ? 'brand' : s.live.absent ? 'amber' : 'green', address: s.address })), [P.id]);
    const [mref, mw] = useWidth();
    const shown = useMemo(() => declutter(pins, mw, 380, 50, pick), [pins, mw, pick]);
    const ps = pick ? sites.find((s) => s.id === pick) : null;
    const choose = (id) => { setPick(pick === id ? null : id); const el = document.getElementById('org-site-' + id); if (el && pick !== id) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    return html`<div class="card" style="padding:12px;margin-bottom:24px">
      <div class="row" style="margin:2px 4px 10px;gap:10px"><b class="w-600">${PO.plural(sites.length, P.id === 'us' ? 'location' : 'site')} in ${P.company.city}</b><span class="faint t-sm ellipsis">${ps ? ps.address : 'Pins show headcount. Pick one to highlight its row.'}</span>${ps ? html`<span class="right"><${Button} size="sm" kind="ghost" onClick=${() => setPick(null)}>Clear</${Button}></span>` : null}</div>
      <div ref=${mref}><${PO.GMap} pins=${shown} selected=${pick} onPick=${choose} height=${380} pad=${50} title=${P.company.name + ' sites'}>
        <div class="org-maplg"><span><i style="background:var(--green-solid)"></i>Fully staffed now</span><span><i style="background:var(--amber-solid)"></i>Someone absent</span><span><i style="background:var(--brand)"></i>Head office</span></div>
      </${PO.GMap}></div>
    </div>
    <${PO.DataTable} rows=${sites} rowClass=${(x) => (pick === x.id ? 'selected' : '')} onRow=${(x) => choose(x.id)} columns=${[
      { key: 'name', label: P.id === 'us' ? 'Location' : 'Site', render: (x) => html`<div class="row" style="gap:10px;min-width:0"><${PO.Chip} icon=${isHQ(x) ? 'Building2' : 'MapPin'} accent=${isHQ(x) ? 'green' : x.live.absent ? 'amber' : 'teal'} /><div id=${'org-site-' + x.id} style="min-width:0;max-width:240px"><b class="w-550 ellipsis" style="display:block">${x.name}</b><div class="faint t-xs ellipsis" title=${x.address}>${x.address}</div></div></div>`, sort: (x) => x.name },
      { key: 'client', label: 'Client', render: (x) => html`<span class="t-sm">${x.client && x.client !== P.company.short && x.client !== 'Sentinel' ? x.client : 'Head office'}</span>` },
      { key: 'lead', label: 'Lead', render: (x) => (x.lead ? html`<${Who} id=${x.lead} sub=${P.byId[x.lead].title} />` : html`<span class="faint t-sm">Head office</span>`), sort: (x) => (x.lead ? P.byId[x.lead].name : ''), csv: (x) => (x.lead ? P.byId[x.lead].name : '') },
      { key: 'hc', label: 'People', align: 'r', render: (x) => html`<span class="row" style="gap:10px;justify-content:flex-end"><${PO.AvatarStack} ids=${x.members.filter((m) => m.id !== x.lead).map((m) => m.id)} max=${4} size="sm" /><span class="tnum" style="min-width:24px">${x.members.length}</span></span>`, sort: (x) => x.members.length },
      { key: 'now', label: 'On shift now', align: 'r', render: (x) => (x.live.due ? html`<span class="tnum" style=${x.live.absent ? 'color:var(--amber)' : ''}>${x.live.in + x.live.late}/${x.live.due}</span>${x.live.absent ? html`<div class="faint t-xs">${x.live.absent} absent</div>` : null}` : html`<span class="faint">—</span>`), sort: (x) => (x.live.due ? (x.live.in + x.live.late) / x.live.due : 2) },
      { key: 'cost', label: costL(P), align: 'r', render: (x) => html`<span class="tnum">${PO.compactMoney(x.st.cost)}</span>`, sort: (x) => x.st.cost },
      { key: 'jobs', label: 'Hiring', align: 'r', render: (x) => html`<span class="tnum">${x.jobs.reduce((t, j) => t + j.openings, 0) || '—'}</span>`, sort: (x) => x.jobs.length },
      { key: 'act', label: '', sort: false, csv: false, render: (x) => html`<span class="row" style="gap:4px;justify-content:flex-end" onClick=${(e) => e.stopPropagation()}><${Button} size="sm" kind="ghost" onClick=${() => PO.go('people?site=' + x.id)}>People</${Button}><${Button} size="sm" kind="ghost" onClick=${() => PO.go('live?site=' + x.id)}>Live board</${Button}></span>` },
    ]} />`;
  }

  /* ---------- page ---------- */
  function OrgPage({ query }) {
    const P = PO.P();
    const [tab, setTab] = useState(query.tab || 'chart');
    const [mode, setMode] = useState(query.group || 'line');
    const levels = useMemo(() => { const d = (id, k) => Math.max(k, ...(P.byManager[id] || []).map((c) => d(c, k + 1))); return d(P.topId, 1); }, [P.id]);
    const mgrs = Object.keys(P.byManager).length;
    const span = Math.round(P.people.filter((p) => p.manager).length / Math.max(1, mgrs));
    const hiring = P.jobs.reduce((t, j) => t + j.openings, 0);
    const toChart = (m) => { setMode(m); setTab('chart'); };
    return html`
      <${PageHeader} title="Org chart" sub=${`${PO.plural(P.people.length, 'person', 'people')} in ${levels} reporting levels under ${P.byId[P.topId].name}. ${PO.plural(mgrs, 'manager')} with an average of ${span} reports each, and ${hiring} open roles.`} actions=${html`
        <${PO.Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" title="More" bordered />`} items=${[
          { label: 'Export chart (PDF)', icon: 'Download', onClick: () => PO.fakeDownload(`Org chart (${mode === 'line' ? 'reporting line' : mode}) PDF`) },
          { label: `Open roles (${hiring})`, icon: 'Briefcase', onClick: () => PO.go('hiring') },
        ]} />
        <${Button} kind="primary" onClick=${() => PO.go('people?new=1')}>Add employee</${Button}>`} />
      <${Tabs} tabs=${[['chart', 'Chart'], ['depts', 'Departments', P.depts.length], ['sites', P.id === 'us' ? 'Locations' : 'Sites', P.sites.length]]} value=${tab} onChange=${setTab} />
      ${tab === 'chart' ? html`<${OrgChart} mode=${mode} setMode=${setMode} focus=${query.focus} />` : tab === 'depts' ? html`<${Departments} onChart=${toChart} />` : html`<${Sites} onChart=${toChart} />`}
    `;
  }
  PO.route('org', OrgPage, { title: 'Org chart', wide: true });
})();
