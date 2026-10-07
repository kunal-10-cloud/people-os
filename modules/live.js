/* People OS: Live board (route `live`). A real Google map of client sites, who is on shift right now,
   a live punch feed with clock-in methods (all through the web portal, site QR, kiosk/biometric terminal or
   supervisor entry) and an exceptions queue. Numbers derive from P.live / P.lateMap / P.absent so they agree
   with Home and the notification bell. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useRef, useEffect } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .lv-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--green-solid); margin-right: 6px; vertical-align: 1px; }
  .lv-board { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
  .lv-board > .lv-map { border-right: 1px solid var(--border); min-width: 0; }
  .lv-board .gm { border: 0; border-radius: 0; }
  .lv-side { display: flex; flex-direction: column; min-width: 0; }
  .lv-side-h { display: grid; grid-template-columns: minmax(0,1fr) 92px 64px 48px; gap: 12px; padding: 0 16px; height: 34px; align-items: center; font-size: 12px; color: var(--text-3); border-bottom: 1px solid var(--border); background: var(--surface-2); }
  .lv-side-h > :last-child { text-align: right; }
  .lv-site-row { display: grid; grid-template-columns: minmax(0,1fr) 92px 64px 48px; gap: 12px; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border); cursor: pointer; }
  .lv-site-row:hover { background: var(--hover); }
  .lv-site-row .nm { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .lv-site-row .nm i { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  .lv-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: var(--surface-3); }
  .lv-bar i { display: block; height: 100%; }
  .lv-foot { display: flex; align-items: center; gap: 16px; padding: 10px 16px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-2); }
  .lv-key { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  .lv-key i { width: 7px; height: 7px; border-radius: 50%; }
  .lv-prog { position: relative; height: 4px; border-radius: 2px; background: var(--surface-3); width: 160px; flex: none; }
  .lv-prog i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: var(--signal); }
  .lv-scroll { overflow-y: auto; }
  .lv-row { display: grid; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--border); min-width: 0; }
  .lv-row:last-child { border-bottom: 0; }
  .lv-exc { grid-template-columns: 32px 190px minmax(0, 1fr) auto; }
  .lv-exc .lv-why { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .lv-tag { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 8px 0 4px; border-radius: 6px; font-size: 12px; font-weight: 550; width: max-content; }
  .lv-tag .chip-ic { width: 16px; height: 16px; border-radius: 4px; background: none; }
  .lv-tag.red { background: var(--red-soft); color: var(--red); } .lv-tag.amber { background: var(--amber-soft); color: var(--amber); } .lv-tag.slate { background: var(--surface-3); color: var(--text-2); }
  .lv-tag.red .chip-ic { color: var(--red); } .lv-tag.amber .chip-ic { color: var(--amber); } .lv-tag.slate .chip-ic { color: var(--text-2); }
  .lv-stack { display: flex; align-items: center; min-width: 0; } .lv-stack .av { box-shadow: 0 0 0 2px var(--surface); } .lv-stack .av + .av, .lv-stack .av + .lv-more { margin-left: -6px; }
  .lv-more { height: 20px; min-width: 20px; padding: 0 4px; border-radius: 10px; background: var(--surface-3); color: var(--text-2); font-size: 10px; font-weight: 600; display: grid; place-items: center; box-shadow: 0 0 0 2px var(--surface); }
  .lv-punch { grid-template-columns: 32px 44px 180px minmax(0, 1fr) 140px 130px; }
  .lv-punch .t, .lv-row .t { font-family: var(--num); font-size: 14px; font-variant-numeric: tabular-nums; color: var(--text-2); }
  .lv-kind { display: inline-flex; align-items: center; gap: 7px; font-weight: 550; white-space: nowrap; }
  .lv-kind i { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  .lv-m { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-2); white-space: nowrap; }
  .lv-m svg { color: var(--text-3); }
  .lv-people .list-item { padding: 8px 16px; }
  .lv-inl { display: flex; gap: 16px; font-size: 12px; color: var(--text-2); }
  .lv-inl b { font-size: 15px; font-weight: 600; color: var(--text); font-variant-numeric: tabular-nums; margin-right: 4px; }
  .lv-sd { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 24px; }
  .lv-sd-k { display: grid; grid-template-columns: 112px minmax(0,1fr); gap: 8px 12px; font-size: 13px; }
  .lv-sd-k > span { color: var(--text-3); }
  .lv-sd-k > div { min-width: 0; }
  .lv-me-key { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--blue-solid); margin-right: 6px; vertical-align: -1px; }
  .lv-fence-key { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 2px dashed var(--brand); margin-right: 6px; vertical-align: -2px; }
  @media (max-width: 1180px) { .lv-sd, .lv-board { grid-template-columns: 1fr; } .lv-board > .lv-map { border-right: 0; border-bottom: 1px solid var(--border); } .lv-punch { grid-template-columns: 32px 44px 160px minmax(0,1fr); } .lv-punch > :nth-child(n+5) { display: none; } .lv-exc { grid-template-columns: 32px minmax(0,1fr); } .lv-exc > :nth-child(n+3) { grid-column: 2; } }
  </style>`);

  /* ---------- clock-in methods (portal only: no employee app) ---------- */
  const METHOD = {
    web: { label: 'Web portal, location verified', short: 'Web portal', icon: 'Globe' },
    qr: { label: 'Site QR', short: 'Site QR', icon: 'QrCode' },
    kiosk: { label: 'Kiosk / biometric terminal', short: 'Kiosk', icon: 'Fingerprint' },
    sup: { label: 'Supervisor entry', short: 'Supervisor', icon: 'UserCheck' },
  };
  const MIX = {
    in: { hjw: ['kiosk', 'kiosk', 'web', 'qr', 'kiosk'], khd: ['kiosk', 'web', 'web', 'qr'], mgp: ['web', 'web', 'qr', 'kiosk'], bnr: ['web', 'qr', 'web', 'sup'], vmn: ['qr', 'web', 'kiosk', 'web'], hq: ['kiosk', 'kiosk', 'web'] },
    us: { sl: ['kiosk', 'kiosk', 'web', 'qr'], e6: ['kiosk', 'web', 'kiosk', 'qr'], dm: ['kiosk', 'kiosk', 'web'], ck: ['kiosk', 'kiosk', 'qr', 'sup'] },
    uk: { ma: ['qr', 'web', 'kiosk', 'qr'], mc: ['web', 'qr', 'kiosk'], sr: ['web', 'qr', 'sup', 'qr'], sf: ['web', 'qr', 'kiosk'], td: ['kiosk', 'web', 'sup'] },
  };
  const GATES = { hjw: 'Tower B gate', khd: 'Basement P2 entry', mgp: 'Gate 2', bnr: 'Main lobby', vmn: 'Service gate 4', hq: 'Office door', sl: 'Back door', e6: 'Back door', dm: 'Staff entrance', ck: 'Loading dock', ma: 'Staff entrance B', mc: 'Dock House goods-in', sr: 'Estates entrance', sf: 'Tower 3 goods-in', td: 'Depot door' };
  const devName = (P, s) => (P.id === 'in' ? (s.id === 'hq' ? 'ZKTeco K40 fingerprint terminal' : `eSSL X990 biometric terminal, ${GATES[s.id]}`) : P.id === 'us' ? `Back-of-house kiosk, ${s.name}` : `Site kiosk, ${GATES[s.id]}`);
  const dm = (P, m) => (P.id === 'us' ? `${PO.num(Math.round((m * 3.281) / 10) * 10)} ft` : `${PO.num(m)} m`);
  const portalHost = (P) => 'people.' + (((P.people[0] || {}).email || '').split('@')[1] || 'company.com');

  function methodDetail(P, p, m, r) {
    const s = PO.site(p.site);
    if (m === 'web') return `Browser location ±${dm(P, r.int(8, 40))}, ${dm(P, r.int(6, Math.max(20, Math.round((s.radius || 150) * 0.6))))} from ${GATES[s.id] || 'site'}`;
    if (m === 'qr') return `Scanned the site QR at ${GATES[s.id]}, clocked in on the portal`;
    if (m === 'kiosk') return P.id === 'in' ? `Fingerprint, ${devName(P, s)}` : `Badge + PIN, ${devName(P, s)}`;
    const lead = P.byId[s.lead];
    return `Entered by ${lead ? lead.name : 'the site lead'}, on the duty sheet`;
  }

  /* ---------- map label decluttering ----------
     Mirrors core/maps.js fit() to know the zoom the map opens at, then keeps the full label only on pins whose
     label box clears its neighbours and the map controls; the rest show just their count bubble. */
  const gwx = (lng, z) => ((lng + 180) / 360) * 256 * Math.pow(2, z);
  const gwy = (lat, z) => { const s = Math.sin((lat * Math.PI) / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * Math.pow(2, z); };
  function gFit(pins, w, h, pad) {
    let z = 17;
    for (; z > 2; z--) { const xs = pins.map((p) => gwx(p.lng, z)), ys = pins.map((p) => gwy(p.lat, z)); if (Math.max(...xs) - Math.min(...xs) <= w - pad * 2 && Math.max(...ys) - Math.min(...ys) <= h - pad * 2 - 30) break; }
    const xs = pins.map((p) => gwx(p.lng, z)), ys = pins.map((p) => gwy(p.lat, z));
    return { z, cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2 - 14 };
  }
  const shortName = (n) => { const w = n.split(' '); return w[0].length >= 4 ? w[0] : w.slice(0, 2).join(' '); };
  function declutter(pins, w, h, pad, selected, legendW) {
    if (!w || pins.length < 2) return pins;
    const { z, cx, cy } = gFit(pins, w, h, pad);
    const box = (p, v) => { const x = w / 2 + gwx(p.lng, z) - cx, y = h / 2 + gwy(p.lat, z) - cy; const W = 13 + 22 + 6 + (v.label ? v.label.length * 6.9 : 0) + (v.sub ? 6 + v.sub.length * 5.9 : 0); return { x0: x - W / 2 - 3, x1: x + W / 2 + 3, y0: y - 42, y1: y - 10 }; };
    const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    const fixed = [{ x0: 0, x1: Math.max(150, legendW || 0), y0: 0, y1: 52 }, { x0: w - 54, x1: w, y0: 0, y1: 130 }, { x0: 0, x1: 160, y0: h - 64, y1: h }, { x0: w - 190, x1: w, y0: h - 64, y1: h }];
    const inside = (b) => b.x0 >= 0 && b.x1 <= w && b.y0 >= 0;
    const bare = { label: '', sub: undefined };
    const boxes = pins.map((p) => box(p, bare));
    const pick = pins.map(() => bare);
    pins.map((p, i) => i).sort((a, b) => (pins[b].id === selected) - (pins[a].id === selected) || (pins[b].rank || 0) - (pins[a].rank || 0)).forEach((i) => {
      const p = pins[i], sel = p.id === selected;
      const opts = [{ label: p.label, sub: p.sub }, { label: p.label }, ...(shortName(p.label) !== p.label ? [{ label: shortName(p.label) }] : [])];
      const ok = opts.find((v) => { const b = box(p, v); return inside(b) && (sel || (!fixed.some((f) => hit(b, f)) && boxes.every((o, j) => j === i || !hit(b, o)))); }) || (sel ? opts[opts.length - 1] : null);
      if (ok) { pick[i] = ok; boxes[i] = box(p, ok); }
    });
    const out = pins.map((p, i) => ({ ...p, label: pick[i].label || '', sub: pick[i].sub }));
    return [...out.filter((p) => !p.label), ...out.filter((p) => p.label)];
  }
  function useWidth() {
    const ref = useRef(); const [w, setW] = useState(0);
    useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth - 2)); ro.observe(el); setW(el.clientWidth - 2); return () => ro.disconnect(); }, []);
    return [ref, w];
  }

  /* ---------- live model (pure, memoised per company) ---------- */
  function buildLive(P) {
    const now = P.company.nowMin;
    const cur = PO.shiftOf(P.current), prv = PO.shiftOf(P.previous), nxt = PO.shiftOf(P.next);
    const rows = [];
    const geoOut = new Set();
    const curPeople = P.people.filter((p) => p.shift === P.current);
    // one plausible "outside geofence" portal punch at a site that has web-portal punches
    curPeople.forEach((p) => {
      const r = PO.seeded('live' + P.id + p.id);
      const mix = MIX[P.id][p.site] || ['web'];
      let m = r.pick(mix);
      const row = { p, shift: P.current, r };
      if (P.absent.has(p.id)) { row.st = 'absent'; }
      else if (P.lateMap[p.id]) {
        const t = cur.from + P.lateMap[p.id];
        if (t <= now) { row.st = 'late'; row.at = t; } else { row.st = 'running'; row.eta = t; }
      } else { row.st = 'in'; row.at = cur.from - r.int(0, 16) + (r.chance(0.18) ? r.int(1, 4) : 0); }
      if (p.id === P.late.id) { m = 'qr'; row.weak = true; }
      row.m = m;
      row.detail = row.weak ? `Browser location weak (${P.phone.gps}), verified by the site QR at ${GATES[p.site]}` : methodDetail(P, p, m, r);
      rows.push(row);
    });
    const gpsIn = rows.filter((x) => x.st === 'in' && x.m === 'web' && x.p.site !== 'hq' && !x.weak);
    if (gpsIn.length) { const g = gpsIn[Math.floor(gpsIn.length * 0.37)]; g.geo = 380 + (g.p.id.charCodeAt(g.p.id.length - 1) % 9) * 20; g.acc = 18 + (g.p.id.charCodeAt(g.p.id.length - 1) % 5) * 6; g.detail = `${dm(P, g.geo)} from the site, outside the ${dm(P, PO.site(g.p.site).radius)} geofence, browser location ±${dm(P, g.acc)}`; geoOut.add(g.p.id); }
    // previous shift: finished, with a couple of loose ends
    const prev = P.people.filter((p) => p.shift === P.previous && p.role !== 'office').map((p, i) => {
      const r = PO.seeded('prev' + P.id + p.id);
      const m = r.pick(MIX[P.id][p.site] || ['web']);
      const out = (prv.to + r.int(0, 14)) % 1440;
      return { p, shift: P.previous, m, r, at: (prv.from - r.int(0, 12) + 1440) % 1440, out, st: i % 11 === 4 ? 'noout' : i % 9 === 2 ? 'nobreak' : 'done', detail: methodDetail(P, p, m, r) };
    });
    // next shift: scheduled; people confirm the shift in the employee portal
    const next = P.people.filter((p) => p.shift === P.next && p.role !== 'office').map((p) => {
      const r = PO.seeded('next' + P.id + p.id);
      return { p, shift: P.next, m: null, r, st: r.chance(0.78) ? 'confirmed' : 'scheduled' };
    });
    return { cur, prv, nxt, now, rows, prev, next, geoOut };
  }

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

  /* ---------- status helpers ---------- */
  function siteStats(rows, siteId) {
    const here = rows.filter((x) => x.p.site === siteId);
    const due = here.length;
    const inn = here.filter((x) => x.st === 'in').length;
    const late = here.filter((x) => x.st === 'late' || x.st === 'running').length;
    const lateIn = here.filter((x) => x.st === 'late').length;
    const absent = here.filter((x) => x.st === 'absent').length;
    return { due, in: inn, late, lateIn, absent, onDuty: inn + lateIn };
  }
  const toneOfStats = (s, mode) => (mode !== 'cur' ? (s.issues ? 'amber' : 'green') : !s.due ? 'slate' : s.absent ? 'red' : s.late ? 'amber' : 'green');

  /* ---------- crew faces in the site list ---------- */
  const EXC_IC = { 'No-show': 'UserX', 'Outside geofence': 'MapPinOff', 'Running late': 'Clock', 'Late arrival': 'Clock', 'Missed break': 'Coffee', 'No clock-out': 'LogOut' };
  const Crew = ({ ids }) => html`<span class="lv-stack" title=${ids.map((p) => p.name).join(', ')}>${ids.slice(0, 3).map((p) => html`<${PO.Avatar} p=${p} size="xs" />`)}${ids.length > 3 ? html`<span class="lv-more">+${ids.length - 3}</span>` : null}${!ids.length ? html`<span class="faint t-xs">Nobody</span>` : null}</span>`;

  /* ---------- page ---------- */
  const TONE_VAR = { green: 'var(--green-solid)', amber: 'var(--amber-solid)', red: 'var(--red-solid)', slate: 'var(--text-3)' };
  function LivePage({ query }) {
    const P = PO.P();
    const { state, dispatch } = PO.useStore();
    const radii = PO.coGet(state, 'sites.radius', {});
    const scope = useScope();
    const L = useMemo(() => buildLive(P), [P.id]);
    const [mode, setMode] = PO.useCoState('live.shift', 'cur');
    const [siteSel, setSiteSel] = useState(query.site || null);
    const [resolved, setResolved] = PO.useCoState('live.resolved', {});
    const [feedFilter, setFeedFilter] = useState('all');
    const [tab, setTab] = useState(query.tab || 'exc');
    const [punchSel, setPunchSel] = useState(null);
    const [excAll, setExcAll] = useState(false);
    const [msg, setMsg] = useState(null);
    const inScope = (p) => !scope || scope.has(p.id);

    const rows = L.rows.filter((x) => inScope(x.p));
    const sites = P.sites.filter((s) => !scope || P.people.some((p) => p.site === s.id && scope.has(p.id)));
    const sel = siteSel && sites.find((s) => s.id === siteSel) ? siteSel : null;
    const list = mode === 'cur' ? rows : mode === 'prev' ? L.prev.filter((x) => inScope(x.p)) : L.next.filter((x) => inScope(x.p));
    const shiftObj = mode === 'cur' ? L.cur : mode === 'prev' ? L.prv : L.nxt;

    const stat = (siteId) => {
      if (mode === 'cur') return siteStats(rows, siteId);
      const here = list.filter((x) => x.p.site === siteId);
      return { due: here.length, onDuty: mode === 'prev' ? here.filter((x) => x.st !== 'noout').length : here.filter((x) => x.st === 'confirmed').length, issues: here.filter((x) => x.st === 'noout' || x.st === 'nobreak' || x.st === 'scheduled').length, in: 0, late: 0, absent: 0 };
    };
    const tot = siteStats(rows, null);
    ['due', 'in', 'late', 'lateIn', 'absent', 'onDuty'].forEach((k) => (tot[k] = sites.reduce((t, s) => t + siteStats(rows, s.id)[k], 0)));
    const running = rows.filter((x) => x.st === 'running').length;
    const methods = Object.entries(rows.filter((x) => x.st === 'in' || x.st === 'late').reduce((a, x) => ((a[x.m] = (a[x.m] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
    const methodLabel = (m) => METHOD[m].label;
    const pctAtt = tot.due ? (tot.due - tot.absent) / tot.due : 1;
    const avg14 = useMemo(() => { const r = PO.seeded('trend' + P.id); const a = Array.from({ length: 13 }, () => 0.9 + r.rnd() * 0.07); return a.reduce((t, v) => t + v, 0) / a.length; }, [P.id]);

    const askCover = () => dispatch({ type: 'set', patch: { assistant: { prompt: P.ai.cover } } });
    const lateP = P.byId[P.late.id];
    const toTabs = (t) => { setTab(t); setTimeout(() => { const el = document.getElementById('lv-tabs'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); };

    /* exceptions for the selected shift */
    const exc = [];
    if (mode === 'cur') {
      rows.filter((x) => x.st === 'absent').forEach((x) => exc.push({ key: 'abs:' + x.p.id, kind: 'No-show', tone: 'red', x, text: `No clock-in for ${L.cur.label.toLowerCase()} (${L.cur.time}) and no leave booked`, acts: [['Find cover', 'cover'], ['Call', 'call'], ['Mark absent', 'absent']] }));
      rows.filter((x) => x.geo).forEach((x) => exc.push({ key: 'geo:' + x.p.id, kind: 'Outside geofence', tone: 'red', x, text: `Web portal punch ${dm(P, x.geo)} from ${PO.site(x.p.site).name} at ${P.hhmm(x.at)}, accuracy ±${dm(P, x.acc)}`, acts: [['Approve', 'approve'], ['Ask for site QR', 'reject'], ['Map', 'map']] }));
      rows.filter((x) => x.st === 'running').forEach((x) => exc.push({ key: 'run:' + x.p.id, kind: 'Running late', tone: 'amber', x, text: `Not in yet, ${L.now - L.cur.from} min after start, replied “on the way” to the SMS reminder`, acts: [['Message', 'msg'], ['Call', 'call']] }));
      rows.filter((x) => x.st === 'late').forEach((x) => exc.push({ key: 'late:' + x.p.id, kind: 'Late arrival', tone: 'amber', x, text: `In at ${P.hhmm(x.at)}, ${P.lateMap[x.p.id]} min late${x.weak ? ', browser location weak, verified by the site QR' : ''}`, acts: [['Excuse', 'excuse'], ['Note on record', 'note']] }));
    }
    L.prev.filter((x) => inScope(x.p) && (x.st === 'nobreak' || x.st === 'noout')).forEach((x) => exc.push({ key: 'prev:' + x.p.id, kind: x.st === 'nobreak' ? 'Missed break' : 'No clock-out', tone: 'slate', x, text: x.st === 'nobreak' ? `${L.prv.label} shift (${L.prv.time}), no break punched in 8 h` : `${L.prv.label} shift ended ${P.hhmm(L.prv.to)}, no clock-out yet`, acts: x.st === 'nobreak' ? [['Deduct 30 min', 'deduct'], ['Excuse', 'excuse']] : [['Mark out at ' + P.hhmm(L.prv.to + 5), 'out'], ['Ask supervisor', 'msg']] }));
    const openAll = exc.filter((e) => !resolved[e.key]);
    const openExc = openAll.filter((e) => !sel || e.x.p.site === sel);

    const act = (e, a) => {
      const first = e.x.p.first;
      if (a === 'cover') { askCover(); return; }
      if (a === 'map') { setSiteSel(e.x.p.site); setPunchSel(e.x.p.id); toTabs('site'); return; }
      if (a === 'call') { PO.toast(`Calling ${first} on ${e.x.p.phone}`, { icon: 'Phone' }); return; }
      if (a === 'msg') { setMsg({ to: [e.x.p], text: e.kind === 'Running late' ? `Hi ${first}, your ${L.cur.label.toLowerCase()} shift started at ${P.hhmm(L.cur.from)}. Are you on the way?` : `Hi ${first}, please confirm when you left after your ${L.prv.label.toLowerCase()} shift.` }); return; }
      const label = { absent: 'Marked absent (unpaid) and supervisor told', excuse: 'Excused, no deduction', note: 'Added to attendance record', approve: 'Punch approved, reason saved', reject: 'Punch rejected; asked to scan the site QR at the gate', deduct: '30 min break deducted', out: `Clock-out set to ${P.hhmm(L.prv.to + 5)}` }[a];
      setResolved({ ...resolved, [e.key]: a });
      PO.toast(`${e.x.p.name}: ${label}`, { action: { label: 'Undo', run: () => setResolved((r) => { const n = { ...r }; delete n[e.key]; return n; }) } });
    };

    /* feed */
    const feed = useMemo(() => {
      const ev = [];
      L.rows.forEach((x) => { if (x.at != null) ev.push({ t: x.at, kind: 'in', x }); });
      L.prev.forEach((x) => { if (x.st !== 'noout') ev.push({ t: x.out < 600 ? x.out : x.out - 1440, kind: 'out', x }); });
      return ev.sort((a, b) => b.t - a.t);
    }, [P.id]);
    const feedView = feed.filter((e) => inScope(e.x.p) && (!sel || e.x.p.site === sel) && (feedFilter === 'all' || (feedFilter === 'in' && e.kind === 'in') || (feedFilter === 'out' && e.kind === 'out') || (feedFilter === 'flag' && (e.x.weak || e.x.geo || e.x.st === 'late'))));

    const siteName = (id) => PO.site(id).name;
    const selSite = sel ? PO.site(sel) : null;
    const [mref, mw] = useWidth();
    const MAPH = 400, MAPPAD = 44;
    const pins = sites.map((s) => {
      const st = stat(s.id);
      const tone = toneOfStats(st, mode);
      if (mode === 'cur') { const out = st.due - st.onDuty; return { id: s.id, lat: s.lat, lng: s.lng, address: s.address, label: s.name, sub: `${st.onDuty}/${st.due} in`, tone, rank: st.due, ...(out ? { count: out } : { icon: st.due ? 'Check' : 'Moon' }) }; }
      if (mode === 'prev') return { id: s.id, lat: s.lat, lng: s.lng, address: s.address, label: s.name, sub: `${st.onDuty}/${st.due} out`, tone, rank: st.due, ...(st.issues ? { count: st.issues } : { icon: 'Check' }) };
      return { id: s.id, lat: s.lat, lng: s.lng, address: s.address, label: s.name, sub: `${st.onDuty} confirmed`, tone: st.issues ? 'slate' : 'green', rank: st.due, count: st.due };
    });
    const legend = mode === 'cur' ? [['green', 'All in'], ['amber', 'Someone late'], ['red', 'Someone absent']] : mode === 'prev' ? [['green', 'All clocked out'], ['amber', 'Needs a check']] : [['green', 'All confirmed'], ['slate', 'Waiting on replies']];
    const shownPins = useMemo(() => declutter(pins, mw, MAPH, MAPPAD, sel, 0), [JSON.stringify(pins), mw, sel]);
    const len = ((L.cur.to - L.cur.from + 1440) % 1440) || 1440;
    const done = Math.max(0, Math.min(1, (L.now - L.cur.from) / len));
    const punchesToday = rows.filter((x) => x.at != null).length + L.prev.filter((x) => inScope(x.p) && x.st !== 'noout').length;
    const kioskLink = () => PO.toast(`Kiosk mode link copied for ${sel ? siteName(sel) : 'all sites'}. Open it on the site tablet at the gate.`, { icon: 'Link' });
    const tabs = [['exc', 'Exceptions', openExc.length], ['feed', 'Punch feed'], ['methods', 'Clock-in methods'], ...(selSite ? [['site', `Geofence, ${selSite.name}`]] : [])];
    const curTab = tab === 'site' && !selSite ? 'exc' : tab;

    return html`
      <${PO.PageHeader} title="Live board" sub=${html`<span class="lv-dot"></span>${L.cur.label} shift, ${L.cur.time}. It is ${P.hhmm(L.now)} in ${P.company.city}; ${PO.num(punchesToday)} punches so far across ${PO.plural(sites.length, 'site')}${scope ? ' in your team' : ''}.`}
        actions=${html`<${PO.Button} icon="MessageSquareText" onClick=${() => setMsg({ to: rows.filter((x) => !sel || x.p.site === sel).map((x) => x.p), text: `Reminder: please clock in on the employee portal as soon as you arrive at ${sel ? siteName(sel) : 'your site'}. If your browser location is slow, scan the site QR at the ${sel ? GATES[sel] : 'gate'}.` })}>Message shift</${PO.Button}>
          <${PO.Button} kind="primary" onClick=${askCover}>Find cover</${PO.Button}>
          <${PO.Menu} align="right" width=${230} trigger=${html`<${PO.IconButton} icon="Ellipsis" bordered title="More actions" />`} items=${[{ label: 'Copy kiosk mode link', icon: 'MonitorSmartphone', onClick: kioskLink }, { label: 'Export today’s punches', icon: 'Download', onClick: () => PO.exportCsv('punches-' + PO.TODAY, [['Time', 'Employee', 'Site', 'Event', 'Method'], ...feed.filter((e) => inScope(e.x.p)).map((e) => [P.hhmm((e.t + 1440) % 1440), e.x.p.name, siteName(e.x.p.site), e.kind === 'in' ? 'Clock in' : 'Clock out', METHOD[e.x.m].label])]) }, '-', { label: 'Clock-in setup', icon: 'Settings2', onClick: () => PO.go('attendance?tab=setup') }]} />`} />

      <${PO.KpiStrip} items=${[
        { label: 'On duty now', icon: 'UserCheck', accent: 'green', value: PO.num(tot.onDuty), unit: '/' + tot.due, bar: [{ v: tot.in, k: 'ok', title: `${tot.in} on time` }, { v: tot.late, k: 'warn', title: `${tot.late} late` }, { v: tot.absent, k: 'bad', title: `${tot.absent} absent` }], sub: `${tot.in} on time, ${tot.late} late, ${tot.absent} absent` },
        { label: 'Late', icon: 'Clock', accent: 'amber', faces: rows.filter((x) => x.st === 'late' || x.st === 'running').map((x) => x.p.id), value: tot.late, bar: [{ v: tot.lateIn, k: 'warn', title: `${tot.lateIn} arrived late` }, { v: running, k: 'mute', title: `${running} not in yet` }], sub: `${tot.lateIn} arrived late, ${running} not in yet`, onClick: () => { setFeedFilter('flag'); toTabs('feed'); } },
        { label: 'Absent', icon: 'UserX', accent: 'red', faces: rows.filter((x) => x.st === 'absent').map((x) => x.p.id), value: tot.absent, tone: tot.absent ? 'red' : '', sub: 'No clock-in and no leave booked', onClick: () => toTabs('exc') },
        { label: 'Open exceptions', icon: 'TriangleAlert', accent: 'amber', faces: [...new Set(openAll.map((e) => e.x.p.id))], value: openAll.length, alert: openAll.length > 0, bar: [{ v: openAll.filter((e) => e.tone === 'red').length, k: 'bad', title: 'No-shows and geofence' }, { v: openAll.filter((e) => e.tone === 'amber').length, k: 'warn', title: 'Late' }, { v: openAll.filter((e) => e.tone === 'slate').length, k: 'mute', title: 'Last shift' }], sub: openAll.length ? 'No-shows and odd punches first' : 'All handled', onClick: () => toTabs('exc') },
        { label: 'Attendance', icon: 'Activity', accent: 'blue', value: PO.num(pctAtt * 100, 1), unit: '%', sub: `14-day average is ${PO.pct(avg14, 1)}` },
      ]} />

      <section class="card mt-24" style="overflow:hidden">
        <div class="card-h" style="padding-bottom:12px;border-bottom:1px solid var(--border)"><h3>${{ prev: 'Previous', cur: 'Current', next: 'Next' }[mode]} shift: ${shiftObj.label.toLowerCase()}, <span style="font-family:var(--num)">${shiftObj.time}</span></h3>
          <div class="right"><${PO.Segmented} value=${mode} onChange=${setMode} options=${[['prev', 'Previous'], ['cur', 'Now'], ['next', 'Next']]} /></div></div>
        <div class="lv-board">
          <div class="lv-map" ref=${mref}><${PO.GMap} pins=${shownPins} selected=${sel} onPick=${(id) => setSiteSel(sel === id ? null : id)} height=${MAPH} pad=${MAPPAD} title=${`${P.company.name} sites`} /></div>
          <div class="lv-side" style=${`height:${MAPH}px`}>
            ${selSite ? html`<${SitePanel} P=${P} L=${L} site=${selSite} mode=${mode} list=${list.filter((x) => x.p.site === selSite.id)} st=${stat(selSite.id)} shiftObj=${shiftObj} onClose=${() => setSiteSel(null)} askCover=${askCover} setMsg=${setMsg} onGeo=${() => toTabs('site')} />`
              : html`<div class="lv-side-h"><span>Site</span><span>${mode === 'next' ? 'Crew' : 'On shift'}</span><span>Status</span><span>${mode === 'next' ? 'Due' : 'On duty'}</span></div>
              <div class="lv-scroll grow">${sites.map((s) => { const st = stat(s.id); const tone = toneOfStats(st, mode); return html`<div class="lv-site-row" onClick=${() => setSiteSel(s.id)}>
                <div style="min-width:0"><div class="nm"><i style=${'background:' + TONE_VAR[tone]}></i><b class="w-550 ellipsis">${s.name}</b></div><div class="t-xs ellipsis faint" style="margin-left:15px">${mode === 'cur' && (st.absent || st.late) ? [st.absent ? `${st.absent} absent` : '', st.late ? `${st.late} late` : ''].filter(Boolean).join(', ') : s.client}</div></div>
                <${Crew} ids=${list.filter((x) => x.p.site === s.id && (mode !== 'cur' || x.st === 'in' || x.st === 'late')).map((x) => x.p)} />
                <div class="lv-bar" title=${`${st.onDuty} of ${st.due}`}>${mode === 'cur' ? html`<i style=${`width:${(st.in / (st.due || 1)) * 100}%;background:var(--brand)`}></i><i style=${`width:${(st.late / (st.due || 1)) * 100}%;background:var(--amber-solid)`}></i><i style=${`width:${(st.absent / (st.due || 1)) * 100}%;background:var(--red-solid)`}></i>` : html`<i style=${`width:${(st.onDuty / (st.due || 1)) * 100}%;background:var(--text-3)`}></i>`}</div>
                <div class="tnum t-sm" style="text-align:right"><b>${st.onDuty}</b><span class="faint">/${st.due}</span></div></div>`; })}</div>
              <div class="lv-site-row" style="cursor:default;background:var(--surface-2);border-bottom:0;border-top:1px solid var(--border)"><div><b class="w-550">Total</b>${mode === 'cur' ? html`<div class="faint t-xs">${tot.in} on time, ${tot.late} late, ${tot.absent} absent</div>` : null}</div><div></div><div></div><div class="tnum t-sm" style="text-align:right"><b>${sites.reduce((t, s) => t + stat(s.id).onDuty, 0)}</b><span class="faint">/${sites.reduce((t, s) => t + stat(s.id).due, 0)}</span></div></div>`}
          </div>
        </div>
        <div class="lv-foot">
          ${legend.map(([t, l]) => html`<span class="lv-key"><i style=${'background:' + TONE_VAR[t]}></i>${l}</span>`)}
          <span class="right tnum">${L.cur.label} ${P.hhmm(L.cur.from)}</span><span class="lv-prog" title=${`${Math.round(done * 100)}% through the shift`}><i style=${`width:${Math.max(2, done * 100)}%`}></i></span><span class="tnum">Handover ${P.hhmm(L.nxt.from)}</span>
          <span class="tnum">${L.next.filter((x) => inScope(x.p)).length} due next shift</span>
        </div>
      </section>

      <div class="mt-24" id="lv-tabs" style="scroll-margin-top:72px"><${PO.Tabs} tabs=${tabs} value=${curTab} onChange=${setTab} /></div>

      ${curTab === 'exc' ? html`<${PO.Card} flush icon="TriangleAlert" accent="amber" title=${sel ? `Exceptions at ${siteName(sel)}` : 'Exceptions'} sub=${openExc.length ? `${openExc.length} open, no-shows first` : 'All handled'} actions=${Object.keys(resolved).length ? html`<${PO.Button} size="sm" kind="ghost" onClick=${() => setResolved({})}>Reset demo</${PO.Button}>` : null}>
        ${openExc.length ? (excAll ? openExc : openExc.slice(0, 8)).map((e) => html`<div class="lv-row lv-exc">
          <${PO.Avatar} p=${e.x.p} />
          <div style="min-width:0"><a class="w-550 ellipsis" style="display:block" href=${PO.href('people/' + e.x.p.id)}>${e.x.p.name}</a><div class="faint t-xs ellipsis">${siteName(e.x.p.site)}, ${e.x.p.post}</div></div>
          <div class="lv-why"><span class=${'lv-tag ' + e.tone}><${PO.Chip} icon=${EXC_IC[e.kind] || 'CircleAlert'} accent=${e.tone} size=${12} />${e.kind}</span><div class="muted t-sm">${e.text}</div></div>
          <div class="row" style="gap:6px;justify-content:flex-end">${e.acts.map(([l, a], i) => html`<${PO.Button} size="sm" kind=${i === 0 ? '' : 'ghost'} onClick=${() => act(e, a)}>${l}</${PO.Button}>`)}</div>
        </div>`) : html`<${PO.Empty} icon="CircleCheck" title="No open exceptions" text=${sel ? `Nothing needs you at ${siteName(sel)} right now.` : 'Every late arrival, no-show and odd punch has been handled.'} />`}
        ${openExc.length > 8 ? html`<div class="tbl-foot"><button class="btn ghost sm" onClick=${() => setExcAll(!excAll)}>${excAll ? 'Show fewer' : `Show all ${openExc.length}`}</button></div>` : null}
      </${PO.Card}>` : null}

      ${curTab === 'feed' ? html`<${PO.Card} flush icon="Radio" accent="green" title="Punch feed" sub=${`${sel ? siteName(sel) : 'All sites'}, newest first`} actions=${html`<${PO.Segmented} value=${feedFilter} onChange=${setFeedFilter} options=${[['all', 'All'], ['in', 'In'], ['out', 'Out'], ['flag', 'Flagged']]} />`}>
        <div class="lv-scroll" style="max-height:560px">${feedView.length ? feedView.slice(0, 60).map((e) => { const x = e.x; const s = PO.site(x.p.site); const flag = e.kind === 'in' && x.st === 'late' ? html`<span style="color:var(--amber)">${P.lateMap[x.p.id]} min late</span>` : x.geo ? html`<span style="color:var(--red)">Outside geofence</span>` : x.weak && e.kind === 'in' ? html`<span class="muted">QR fallback</span>` : html`<span class="faint">${e.kind === 'in' ? 'Clocked in' : 'Clocked out'}</span>`; return html`<div class="lv-row lv-punch">
          <${PO.Avatar} p=${x.p} presence=${e.kind === 'in' ? (x.st === 'late' ? 'late' : 'on') : 'off'} />
          <span class="t">${P.hhmm((e.t + 1440) % 1440)}</span>
          <a class="w-550 ellipsis" href=${PO.href('people/' + x.p.id)}>${x.p.name}</a>
          <div class="faint t-sm ellipsis" title=${e.kind === 'in' ? x.detail : ''}>${s.name}, ${x.p.post}. ${e.kind === 'in' ? x.detail : `Shift ${PO.shiftOf(x.shift).time}`}</div>
          <span class="lv-m"><${PO.Icon} n=${x.weak ? 'QrCode' : METHOD[x.m].icon} size=${13} />${x.weak ? 'Site QR' : METHOD[x.m].short}</span>
          <span class="t-sm" style="text-align:right">${flag}</span>
        </div>`; }) : html`<${PO.Empty} icon="Radio" title="No punches match" text="Try another filter or site." />`}</div>
      </${PO.Card}>` : null}

      ${curTab === 'methods' ? html`<div class="grid g-2">
        <${PO.Card} icon="Fingerprint" accent="blue" title="Clock-ins by method" sub="Current shift">
          <div class="col" style="gap:12px">${methods.map(([m, v]) => html`<div class="row t-sm" style="gap:12px"><span class="lv-m" style="width:210px;font-size:13px;color:var(--text)"><${PO.Icon} n=${METHOD[m].icon} size=${14} />${methodLabel(m)}</span><div class="prog grow" style="height:6px"><i style=${`width:${(v / Math.max(1, tot.onDuty)) * 100}%;background:var(--chart-1)`}></i></div><b class="tnum" style="width:28px;text-align:right">${v}</b><span class="faint tnum" style="width:36px;text-align:right">${Math.round((v / Math.max(1, tot.onDuty)) * 100)}%</span></div>`)}</div>
          <p class="faint t-sm mt-16">Fallbacks run in order: web portal location, site QR, ${P.id === 'in' ? 'biometric terminal' : 'kiosk'}, supervisor entry. ${lateP.name}’s browser location was weak (${P.phone.gps}), so the site QR at the gate confirmed the punch.</p>
        </${PO.Card}>
        <${PO.Card} icon="Clock" accent="amber" title="Late arrivals by site" sub=${P.company.period}><${PO.Charts.HBars} data=${P.lateBySite.filter(([n]) => !scope || sites.some((s) => s.name === n)).map(([label, value]) => ({ label, value }))} /></${PO.Card}>
      </div>` : null}

      ${curTab === 'site' && selSite ? html`<${SiteDetail} P=${P} L=${L} site=${{ ...selSite, radius: radii[selSite.id] || selSite.radius }} rows=${rows} punchSel=${punchSel} setPunchSel=${setPunchSel} />` : null}

      <${MessageDrawer} msg=${msg} onClose=${() => setMsg(null)} P=${P} />`;
  }

  /* ---------- selected site: real map with geofence and out-of-fence punches ---------- */
  const accM = (t) => { const n = parseFloat(String(t).replace(/[^\d.]/g, '')) || 100; return /ft/.test(t) ? Math.round(n * 0.3048) : n; };
  function SiteDetail({ P, L, site, rows, punchSel, setPunchSel }) {
    const here = rows.filter((x) => x.p.site === site.id);
    const cands = here.filter((x) => x.weak || x.geo);
    const cur = cands.find((x) => x.p.id === punchSel) || (punchSel === '' ? null : cands[0]) || null;
    const meOf = (x) => {
      if (!x) return null;
      if (x.weak) return { dx: Math.round(site.radius * 0.72), dy: -Math.round(site.radius * 0.32), acc: accM(P.phone.gps) };
      const a = ((x.p.id.charCodeAt(x.p.id.length - 1) % 8) / 8) * Math.PI * 2 + 0.6;
      return { dx: Math.round(Math.cos(a) * x.geo), dy: Math.round(Math.sin(a) * x.geo), acc: x.acc };
    };
    const me = meOf(cur);
    const H = 300;
    const reach = Math.max(site.radius, me ? Math.hypot(me.dx, me.dy) + me.acc * 0.7 : 0);
    const zoom = Math.max(13, Math.min(17, Math.floor(Math.log2((156543.03 * Math.cos((site.lat * Math.PI) / 180) * H * 0.42) / reach))));
    const counts = Object.keys(METHOD).map((m) => [m, here.filter((x) => x.at != null && x.m === m).length]).filter(([, n]) => n);
    const lead = P.byId[site.lead];
    const url = `https://${portalHost(P)}/clock-in/${site.id}`;
    const ft = P.id === 'us' ? ` (${PO.num(Math.round(site.radius * 3.281))} ft)` : '';
    const dist = me ? Math.round(Math.hypot(me.dx, me.dy)) : 0;
    return html`<${PO.Card} title=${`Site location, ${site.name}`} sub=${site.client} actions=${html`<${PO.Button} size="sm" icon="Link" onClick=${() => PO.toast(`Copied ${url}`, { icon: 'Link' })}>Copy clock-in link</${PO.Button}><${PO.Button} size="sm" kind="ghost" onClick=${() => PO.go('attendance?tab=setup')}>Clock-in setup</${PO.Button}>`}>
      <div class="lv-sd">
        <div class="col" style="gap:10px">
          <${PO.GMapPlace} lat=${site.lat} lng=${site.lng} zoom=${zoom} height=${H} radius=${site.radius} label=${site.name} address=${site.address} me=${me} />
          <div class="row wrap t-xs muted" style="gap:14px"><span><i class="lv-fence-key"></i>Geofence, ${site.radius} m${ft}</span>${me ? html`<span><i class="lv-me-key"></i>${cur.p.first}’s browser location, ±${dm(P, me.acc)}</span>` : null}<span class="right faint tnum">${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}</span></div>
        </div>
        <div class="col" style="gap:16px;min-width:0">
          ${cands.length ? html`<div><div class="t-xs faint w-500" style="margin-bottom:6px">Show on map</div><${PO.Segmented} value=${cur ? cur.p.id : ''} onChange=${setPunchSel} options=${[['', 'Geofence only'], ...cands.map((x) => [x.p.id, `${x.p.first}’s punch`])]} /></div>` : null}
          ${cur ? (cur.weak ? html`<div><b class="w-600">${cur.p.name}: on site, verified by site QR</b><p class="muted t-sm mt-4">Clocked in at ${P.hhmm(cur.at)}. The browser reported a location ±${dm(P, me.acc)} wide that reached outside the ${dm(P, site.radius)} fence, so the portal asked for the QR code at the ${GATES[site.id]}. The scan matched this site, so the punch was accepted.</p></div>`
            : html`<${PO.Callout} tone="amber" icon="MapPinOff" title=${`${cur.p.name}: ${dm(P, dist)} from the site`}>Clocked in on the web portal at ${P.hhmm(cur.at)} with location accuracy ±${dm(P, me.acc)}, about ${dm(P, dist - site.radius)} beyond the fence. The punch is waiting in Exceptions for approval.</${PO.Callout}>`)
            : html`<p class="muted t-sm">No out-of-fence or weak-location punches at ${site.name} on this shift.</p>`}
          <div class="lv-sd-k">
            <span>Address</span><div>${site.address}</div>
            <span>Geofence</span><div>${site.radius} m${ft} radius around the site pin</div>
            <span>Portal clock-in</span><div class="ellipsis t-sm" title=${url}>${url.replace('https://', '')}</div>
            <span>${P.id === 'in' ? 'Terminal' : 'Kiosk'}</span><div class="ellipsis">${devName(P, site)}</div>
            <span>Site lead</span><div>${lead ? html`<a href=${PO.href('people/' + lead.id)}>${lead.name}</a>` : 'Head office team'}${lead ? html`<span class="faint">, supervisor entry</span>` : null}</div>
            <span>Methods today</span><div>${counts.length ? counts.map(([m, n]) => `${METHOD[m].short} ${n}`).join(', ') : html`<span class="faint">No punches yet</span>`}</div>
          </div>
        </div>
      </div>
    </${PO.Card}>`;
  }

  function SitePanel({ P, L, site, mode, list, st, shiftObj, onClose, askCover, setMsg, onGeo }) {
    const lead = P.byId[site.lead];
    const order = { absent: 0, running: 1, late: 2, noout: 0, nobreak: 1, scheduled: 0, in: 3, done: 3, confirmed: 2 };
    const sorted = list.slice().sort((a, b) => (order[a.st] - order[b.st]) || ((a.at || 0) - (b.at || 0)));
    const label = (x) => {
      if (x.st === 'absent') return html`<${PO.Badge} tone="red" dot>Absent</${PO.Badge}>`;
      if (x.st === 'running') return html`<${PO.Badge} tone="amber" dot>Not in yet</${PO.Badge}>`;
      if (x.st === 'late') return html`<${PO.Badge} tone="amber" dot>${P.lateMap[x.p.id]} min late</${PO.Badge}>`;
      if (x.st === 'noout') return html`<${PO.Badge} tone="amber" dot>No clock-out</${PO.Badge}>`;
      if (x.st === 'nobreak') return html`<span class="faint t-sm">No break</span>`;
      if (x.st === 'scheduled') return html`<span class="faint t-sm">No reply yet</span>`;
      if (x.st === 'done') return html`<span class="faint t-sm tnum">Out ${P.hhmm(x.out)}</span>`;
      if (x.st === 'confirmed') return html`<span class="faint t-sm">Confirmed</span>`;
      return html`<span class="faint t-sm tnum">In ${P.hhmm(x.at)}</span>`;
    };
    const sub = (x) => {
      if (x.st === 'absent') return `${x.p.post}, no punch, no leave`;
      if (x.st === 'running') return `${x.p.post}, expected ${P.hhmm(shiftObj.from)}`;
      if (mode === 'next') return `${x.p.post}, starts ${P.hhmm(shiftObj.from)}`;
      if (mode === 'prev') return `${x.p.post}, in ${P.hhmm(x.at)}`;
      return `${x.p.post}, ${x.weak ? 'Site QR' : METHOD[x.m].short}`;
    };
    const nums = mode === 'cur' ? [[st.due, 'due'], [st.in, 'on time'], [st.late, 'late'], [st.absent, 'absent']] : mode === 'prev' ? [[st.due, 'worked'], [st.onDuty, 'clocked out'], [st.issues, 'to check']] : [[st.due, 'due'], [st.onDuty, 'confirmed'], [st.issues, 'no reply']];
    return html`<div class="row" style="padding:10px 12px 10px 16px;border-bottom:1px solid var(--border);gap:8px"><div class="grow" style="min-width:0"><b class="w-600 ellipsis" style="display:block">${site.name}</b><div class="faint t-xs ellipsis">${site.client}${lead ? `, lead ${lead.name}` : ''}</div></div>
        <${PO.Menu} align="right" width=${210} trigger=${html`<${PO.IconButton} icon="Ellipsis" size="sm" title="Site actions" />`} items=${[{ label: 'Message this site', icon: 'MessageSquareText', onClick: () => setMsg({ to: list.map((x) => x.p), text: `Hi team at ${site.name}, quick reminder: clock in on the employee portal when you arrive. If your browser location is slow, scan the site QR at the ${GATES[site.id]}.` }) }, lead ? { label: `Call ${lead.first}`, icon: 'Phone', onClick: () => PO.toast(`Calling ${lead.name} (${lead.title}) on ${lead.phone}`, { icon: 'Phone' }) } : null, { label: 'Find cover', icon: 'UserPlus', onClick: askCover }, { label: 'Geofence and punches', icon: 'MapPin', onClick: onGeo }]} />
        <${PO.IconButton} icon="X" size="sm" title="Back to all sites" onClick=${onClose} /></div>
      <div class="lv-inl" style="padding:10px 16px;border-bottom:1px solid var(--border)">${nums.map(([n, l], i) => html`<span><b style=${i && n && (l === 'late' || l === 'to check' || l === 'no reply') ? 'color:var(--amber)' : i && n && l === 'absent' ? 'color:var(--red)' : ''}>${n}</b>${l}</span>`)}</div>
      <div class="lv-scroll lv-people grow">${sorted.length ? sorted.map((x) => html`<div class="list-item">
        <${PO.Avatar} p=${x.p} size="sm" />
        <div class="grow" style="min-width:0"><a class="w-550 ellipsis" style="display:block" href=${PO.href('people/' + x.p.id)}>${x.p.name}</a><div class="faint t-xs ellipsis">${sub(x)}</div></div>
        ${label(x)}</div>`) : html`<${PO.Empty} icon="Moon" title="Nobody on this shift" text="This site doesn’t run this shift." />`}</div>`;
  }

  function MessageDrawer({ msg, onClose, P }) {
    const [text, setText] = useState('');
    const [chan, setChan] = useState('sms');
    const open = !!msg;
    const val = text || (msg ? msg.text : '');
    const CH = [['sms', 'Send SMS'], ['email', 'Email'], ['wa', 'WhatsApp message']];
    const chanWord = { sms: 'by SMS', email: 'by email', wa: 'as a WhatsApp message' };
    return html`<${PO.Drawer} open=${open} onClose=${() => { setText(''); onClose(); }} size="sm" title="Send a message" sub=${msg ? PO.plural(msg.to.length, 'recipient') : ''}
      footer=${html`<${PO.Button} onClick=${() => { setText(''); onClose(); }}>Cancel</${PO.Button}><${PO.Button} kind="primary" icon="Send" onClick=${() => { PO.toast(`Sent to ${PO.plural(msg.to.length, 'person', 'people')} ${chanWord[chan]}`, { icon: 'Send' }); setText(''); onClose(); }}>Send</${PO.Button}>`}>
      ${msg ? html`<div class="col gap-16">
        <${PO.Field} label="To"><div class="row wrap" style="gap:6px">${msg.to.slice(0, 8).map((p) => html`<span class="tag"><${PO.Avatar} p=${p} size="xs" />${p.name}</span>`)}${msg.to.length > 8 ? html`<span class="tag">+${msg.to.length - 8} more</span>` : null}</div></${PO.Field}>
        <${PO.Field} label="Send as"><${PO.Segmented} value=${chan} onChange=${setChan} options=${CH} /></${PO.Field}>
        <${PO.Field} label="Message" hint=${`One-way notification from ${P.msg.name}. It ends with a link to the clock-in page on ${portalHost(P)}.`}><textarea class="textarea" rows="5" value=${val} onInput=${(e) => setText(e.target.value)}></textarea></${PO.Field}>
      </div>` : null}
    </${PO.Drawer}>`;
  }

  PO.route('live', LivePage, { title: 'Live board', wide: false });
})();
