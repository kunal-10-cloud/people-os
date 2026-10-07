/* People OS: employee self-service. Everything here is about the viewer (PO.viewer()): their clock-in, pay,
   leave, attendance, documents, expenses and goals. Built for the person who gets paid, not the HR admin. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect, useRef } = PO;
  const { Icon, Avatar, Who, Badge, Status, Button, IconButton, Menu, Tabs, Switch, PageHeader, Card, Stat, Empty, Callout, Progress, KV, Timeline, Field, Select, Drawer, Modal, DataTable, MonthCal } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .ss-today{display:grid;grid-template-columns:minmax(0,1fr) 300px;min-height:200px}
  .ss-today-l{padding:16px 20px;display:flex;flex-direction:column;gap:12px;min-width:0}
  .ss-today-r{padding:16px 20px;border-left:1px solid var(--border);display:flex;flex-direction:column;gap:10px;min-width:0}
  .ss-today-map{padding:12px;min-width:0}
  .ss-eyebrow{font-size:12px;color:var(--text-3);font-weight:500}
  .ss-shiftname{font-size:18px;font-weight:600;letter-spacing:-.01em}
  .ss-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;border-top:1px solid var(--border);padding-top:12px;margin-top:auto}
  .ss-facts div{min-width:0} .ss-facts small{display:block;font-size:12px;color:var(--text-3)} .ss-facts b{display:block;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ss-time{font-family:var(--num);font-size:38px;font-weight:600;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1}
  .ss-punch{height:40px;width:100%;font-size:14px}
  .ss-state{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--text-2);line-height:1.4}
  .ss-state b{color:var(--text);font-weight:550;display:block}
  .ss-row3{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr);gap:16px;align-items:stretch}
  .ss-row3 > .card{display:flex;flex-direction:column}
  .ss-row3 > .card > .card-b{flex:1}
  .ss-kv{display:flex;align-items:baseline;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;min-width:0}
  .ss-kv:last-child{border-bottom:none}
  .ss-kv > span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ss-kv > :last-child{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:550;white-space:nowrap}
  .ss-net{font-family:var(--num);font-size:30px;font-weight:600;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.1}
  .ss-up{color:var(--green)} .ss-down{color:var(--red)}
  .ss-task{display:flex;align-items:flex-start;gap:10px;padding:9px 16px;border-bottom:1px solid var(--border)}
  .ss-task:last-child{border-bottom:none}
  .ss-task a{font-weight:500} .ss-task a:hover{color:var(--brand-text)}
  .ss-box{flex:none;width:16px;height:16px;margin-top:1px;border-radius:4px;border:1.5px solid var(--border-strong);background:var(--surface);display:grid;place-items:center;cursor:pointer;padding:0;color:var(--ink-text)}
  .ss-box.on{background:var(--ink);border-color:var(--ink)}
  .ss-rail-row{display:flex;align-items:baseline;gap:10px;padding:8px 16px;border-bottom:1px solid var(--border);min-width:0}
  .ss-rail-row:last-child{border-bottom:none}
  a.ss-rail-row:hover{background:var(--hover)}
  .ss-date{flex:none;width:52px;color:var(--text-3);font-size:12px;font-variant-numeric:tabular-nums}
  .ss-links{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:12.5px}
  .ss-links a{color:var(--brand-text);cursor:pointer} .ss-links a:hover{text-decoration:underline}
  .cal-ev.ss-plain{background:none;color:var(--text-2);padding:0 2px;font-variant-numeric:tabular-nums}
  .ss-chip{display:inline-flex;align-items:center;height:28px;padding:0 10px;border-radius:var(--r);border:1px solid var(--border);background:var(--surface);cursor:pointer;font:inherit;font-size:12.5px;color:var(--text-2)}
  .ss-chip[aria-pressed='true']{border-color:var(--ink);color:var(--text);font-weight:550;box-shadow:inset 0 0 0 1px var(--ink)}
  .ss-star{background:none;border:none;padding:2px;cursor:pointer;color:var(--border-strong)} .ss-star.on{color:var(--amber-solid)}
  .ss-otp{display:flex;gap:8px;justify-content:center} .ss-otp input{width:42px;height:48px;text-align:center;font-size:20px;font-weight:600;border-radius:var(--r);border:1px solid var(--border-strong);background:var(--surface);color:var(--text)}
  .ss-drop{border:1.5px dashed var(--border-strong);border-radius:var(--r-lg);padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;cursor:pointer;background:var(--surface-2)}
  .ss-drop:hover{border-color:var(--text-3)}
  .ss-letter{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:24px 26px;font-size:12.5px;line-height:1.65}
  .ss-slipv{font-size:13px}
  .ss-cap{font-size:12px;color:var(--text-3);font-weight:550;margin-bottom:2px}
  .ss-line{display:flex;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px} .ss-line:last-child{border-bottom:none} .ss-line span:last-child{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:550}
  .ss-why{display:flex;align-items:baseline;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)} .ss-why:last-child{border-bottom:none}
  .ss-why > b{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
  .ss-perm{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);box-shadow:var(--shadow-md);padding:12px 14px;display:flex;flex-direction:column;gap:10px}
  .ss-perm-h{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.4}
  .ss-perm-b{display:flex;gap:8px;justify-content:flex-end}
  .ss-alt{background:none;border:none;padding:0;color:var(--brand-text);font:inherit;font-size:12px;font-weight:500;cursor:pointer;text-align:left}
  .ss-alt:hover{text-decoration:underline}
  .ss-spin{animation:ss-spin 1s linear infinite}@keyframes ss-spin{to{transform:rotate(360deg)}}
  .ss-week{display:flex;align-items:center;gap:10px;padding:0 16px;height:34px;border-bottom:1px solid var(--border);font-size:12.5px}
  .ss-week:last-child{border-bottom:none} .ss-week.today{background:var(--surface-2)}
  .ss-week > span:first-child{width:56px;flex:none;color:var(--text-2)} .ss-week.today > span:first-child{color:var(--text);font-weight:600}
  .ss-week > span:last-child{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--text-2)}
  .ss-form{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px}
  .ss-checks{border-left:1px solid var(--border);padding-left:20px;display:flex;flex-direction:column;gap:10px}
  .ss-hello{display:flex;align-items:center;gap:16px;margin-bottom:20px}
  .ss-hello .av.xl{width:72px;height:72px;font-size:24px;box-shadow:0 0 0 3px var(--surface),0 0 0 4px var(--border)}
  .ss-hello h1{font-size:24px;font-weight:650;letter-spacing:-.015em}
  .ss-hello p{color:var(--text-2);margin-top:2px}
  .ss-hello .ph-actions{margin-left:auto;display:flex;gap:8px;align-items:center}
  .ss-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}
  .ss-tile{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:inherit;text-align:left;font:inherit;cursor:pointer;min-width:0}
  .ss-tile:hover{border-color:var(--border-strong)}
  .ss-tile .chip-ic{width:34px;height:34px;border-radius:10px}
  .ss-tile b{font-weight:600;font-size:13.5px;display:block}
  .ss-tile small{display:block;color:var(--text-3);font-size:12px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ss-mapwrap{grid-column:1 / -1;padding:0 12px 12px}
  .ss-lv{display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
  .ss-lv:last-of-type{border-bottom:none}
  .ss-lv .nm{font-size:13px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ss-lv .n{font-family:var(--num);font-size:18px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
  .ss-lv .n small{font-family:var(--font);font-size:11.5px;color:var(--text-3);font-weight:400;margin-left:3px}
  .ss-lv .bar{grid-column:2 / 4;display:flex;height:5px;border-radius:3px;overflow:hidden;background:var(--surface-3)}
  .ss-lv .bar i{display:block;height:100%}
  .ss-split{display:flex;height:8px;border-radius:4px;overflow:hidden;gap:2px;margin-top:12px}
  .ss-split i{display:block;height:100%;border-radius:2px}
  .ss-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;font-size:12px;color:var(--text-2)}
  .ss-legend span{display:inline-flex;align-items:center;gap:5px} .ss-legend i{width:8px;height:8px;border-radius:2px;display:inline-block}
  .ss-crew{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 6px;padding:12px 14px}
  .ss-crew a{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;color:inherit;font-size:12px;text-align:center}
  .ss-crew a span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ss-crew .av.lg{width:44px;height:44px}
  .ss-dtile{flex:none;width:38px;height:40px;border-radius:8px;border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;background:var(--surface)}
  .ss-dtile b{font-family:var(--num);font-size:16px;font-weight:600} .ss-dtile small{font-size:10.5px;color:var(--text-3);margin-top:2px}
  .ss-li{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);min-width:0}
  .ss-li:last-child{border-bottom:none}
  a.ss-li:hover,button.ss-li:hover{background:var(--hover)}
  @media (max-width:1180px){.ss-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media (max-width:1180px){.ss-row3{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.ss-today{grid-template-columns:minmax(0,1fr)}.ss-today-r{border-left:none;border-top:1px solid var(--border)}.ss-form{grid-template-columns:minmax(0,1fr)}.ss-checks{border-left:none;padding-left:0}}
    .me-today { display: grid; grid-template-columns: minmax(0, 1fr) 380px; overflow: hidden; margin-bottom: 16px; }
  .me-map { position: relative; min-width: 0; display: flex; }
  .me-map .gm { border: none; border-radius: 0; border-right: 1px solid var(--border); flex: 1; height: auto !important; min-height: 452px; }
  .me-place { position: absolute; left: 12px; top: 12px; z-index: 5; display: flex; align-items: center; gap: 10px; max-width: 70%; padding: 8px 12px 8px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 4px 14px -8px rgba(20,40,30,.35); }
  .me-place b { display: block; font-weight: 600; } .me-place small { display: block; color: var(--text-3); font-size: 12px; }
  .me-side { display: flex; flex-direction: column; min-width: 0; }
  .me-side > div { padding: 16px 18px; border-top: 1px solid var(--border); } .me-side > div:first-child { border-top: none; }
  .me-k { font-size: 12.5px; color: var(--text-2); font-weight: 550; }
  .me-time { font-family: var(--num); font-size: 44px; font-weight: 600; line-height: 1.05; margin: 4px 0 10px; font-variant-numeric: tabular-nums; }
  .me-shift { display: flex; flex-direction: column; gap: 8px; }
  .me-shiftname { font-size: 15px; font-weight: 600; }
  .me-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
  .me-facts small { display: block; font-size: 12px; color: var(--text-3); } .me-facts b { font-weight: 550; }
  .me-crew { flex: 1; }
  .me-faces { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; align-items: center; }
  .me-more { font-size: 12px; font-weight: 600; color: var(--text-2); margin-left: 4px; }
  .me-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; padding: 12px 16px 16px; }
  .me-day { border: 1px solid var(--border); border-radius: 10px; padding: 10px 10px 12px; display: flex; flex-direction: column; gap: 2px; min-width: 0; background: color-mix(in srgb, var(--brand-soft) 45%, var(--surface)); border-left: 3px solid var(--brand); }
  .me-day .dn { font-size: 12px; color: var(--text-2); font-weight: 550; } .me-day b { font-family: var(--num); font-size: 22px; font-weight: 600; line-height: 1.1; }
  .me-day .sh { font-size: 12px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
  .me-day.off { background: var(--surface-2); border-left-color: var(--border-strong); } .me-day.off b, .me-day.off .sh { color: var(--text-3); }
  .me-day.today { box-shadow: 0 0 0 2px var(--brand) inset; }
  @media (max-width: 1100px) { .me-today { grid-template-columns: 1fr; } .me-map .gm { border-right: none; border-bottom: 1px solid var(--border); } .me-days { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  </style>`);

  /* ---------- helpers ---------- */
  const r2 = (x) => Math.round(x * 100) / 100;
  const rnd = (P, x) => (P.id === 'in' ? Math.round(x) : r2(x));
  const mod = (m) => ((m % 1440) + 1440) % 1440;
  /** Where the employee is standing when they allow location: a little inside the fence, near the gate. */
  const ME_OFF = { dx: 40, dy: 25, acc: 35 };
  const fmtDist = (P, m) => (P.id === 'us' ? `${Math.round(m * 3.281)} ft` : `${Math.round(m)} m`);
  function myFix(site) {
    const lat = site.lat + ME_OFF.dy / 111320, lng = site.lng + ME_OFF.dx / (111320 * Math.cos((site.lat * Math.PI) / 180));
    const d = PO.geo && PO.geo.distance ? PO.geo.distance({ lat, lng }, { lat: site.lat, lng: site.lng }) : Math.hypot(ME_OFF.dx, ME_OFF.dy);
    return { lat, lng, d: Math.round(d), inside: d <= (site.radius || 200) };
  }
  const lvWord = (P) => (P.id === 'us' ? 'Time off' : P.id === 'uk' ? 'Holiday' : 'Leave');
  const unitOf = (t) => (t.unit === 'hours' ? 'h' : 'd');
  const fmtU = (n, t) => (t.unit === 'hours' ? `${PO.num(n)} h` : PO.plural(n, 'day'));
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  const dow = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay();

  /** Leave type chip: icon and accent keyed to the type, consistent across the portal. */
  const LV_IC = { cl: 'Coffee', sl: 'Thermometer', sick: 'Thermometer', el: 'Palmtree', pto: 'Palmtree', hol: 'Palmtree', co: 'RefreshCcw', lop: 'CircleMinus', unpaid: 'CircleMinus', jury: 'Scale', comp: 'HeartHandshake' };
  const lvAccent = (t) => ({ blue: 'blue', rose: 'rose', green: 'green', amber: 'amber' })[t.color] || 'violet';
  const LvChip = ({ t, size }) => html`<${PO.Chip} icon=${LV_IC[t.key] || 'CalendarDays'} accent=${lvAccent(t)} size=${size || 14} />`;
  const lvTone = (t) => ({ blue: 'var(--blue-solid)', rose: 'var(--rose)', green: 'var(--green-solid)', amber: 'var(--amber-solid)' })[t.color] || 'var(--violet)';
  /** Expense category chip. */
  const expIc = (c) => { const k = (c || '').toLowerCase(); return /fuel|mileage/.test(k) ? ['Fuel', 'amber'] : /travel|parking/.test(k) ? ['Bus', 'blue'] : /suppl/.test(k) ? ['Package', 'teal'] : /phone|mobile/.test(k) ? ['Smartphone', 'violet'] : /food|meal|subsist/.test(k) ? ['UtensilsCrossed', 'rose'] : /train/.test(k) ? ['GraduationCap', 'green'] : /uniform/.test(k) ? ['Shirt', 'blue'] : ['Receipt', 'green']; };
  const ExpChip = ({ c }) => { const [i, a] = expIc(c); return html`<${PO.Chip} icon=${i} accent=${a} />`; };
  const DTile = ({ iso }) => html`<span class="ss-dtile"><b>${+iso.slice(8)}</b><small>${PO.MONS[+iso.slice(5, 7) - 1]}</small></span>`;

  /** Pay rows for a person, oldest first. The current period is p.pay exactly; the hero's previous period is P.prevPay. */
  function payRows(P, p) {
    const H = P.payHistory, cur = H[H.length - 1], n = H.length;
    const r = PO.seeded('mypay' + P.id + p.id);
    const isHero = p.id === P.hero.id;
    return H.map((h, i) => {
      let pay;
      if (i === n - 1) pay = p.pay;
      else if (isHero && i === n - 2) pay = P.prevPay;
      else {
        const f = (h.gross / cur.gross) * (1 + (r.rnd() - 0.5) * 0.06);
        const earn = p.pay.earn.map((x) => ({ ...x, amt: rnd(P, x.amt * f) }));
        const ded = p.pay.ded.map((x) => ({ ...x, amt: rnd(P, x.amt * f) }));
        const er = p.pay.er.map((x) => ({ ...x, amt: rnd(P, x.amt * f) }));
        const gross = rnd(P, earn.reduce((t, x) => t + x.amt, 0)), dedTotal = rnd(P, ded.reduce((t, x) => t + x.amt, 0));
        pay = { earn, ded, er, gross, dedTotal, net: rnd(P, gross - dedTotal), erTotal: rnd(P, er.reduce((t, x) => t + x.amt, 0)) };
      }
      return { id: h.id, label: h.label.replace('*', ''), offCycle: h.label.includes('*'), pay, paidOn: paidOn(P, h.label, i === n - 1), current: i === n - 1, i };
    });
  }
  function paidOn(P, label, last) {
    const M = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    if (P.id === 'in') { const [m, y] = label.split(' '); const d = new Date(Date.UTC(+y, M[m] + 1, 7)); return d.toISOString().slice(0, 10); }
    const end = label.replace('*', '').split('–')[1].trim();
    const parts = end.split(' ');
    const mon = M[parts.find((x) => M[x] !== undefined)], day = +parts.find((x) => /^\d+$/.test(x));
    const y = mon >= 9 && !last ? 2025 : 2026;
    const d = new Date(Date.UTC(y, mon, day + 5));
    return d.toISOString().slice(0, 10);
  }
  function whyLines(P, p, rows) {
    if (p.id === P.hero.id) return P.why.map((w) => ({ label: w.label, v: w.v }));
    const cur = rows[rows.length - 1].pay, prev = rows[rows.length - 2].pay;
    const out = [];
    cur.earn.forEach((x) => { const o = prev.earn.find((y) => y.k === x.k); const d = x.amt - (o ? o.amt : 0); if (Math.abs(d) >= 0.5) out.push({ label: P.whyWords[x.k] || x.label, v: d }); });
    cur.ded.forEach((x) => { const o = prev.ded.find((y) => y.k === x.k); const d = (o ? o.amt : 0) - x.amt; if (Math.abs(d) >= 0.5) out.push({ label: P.whyWords[x.k] || x.label, v: d }); });
    return out;
  }
  function clockInit(P, v) {
    const sh = PO.shiftOf(v.shift), now = P.company.nowMin;
    const wrap = sh.to <= sh.from;
    const inShift = wrap ? now >= sh.from || now < sh.to : now >= sh.from && now < sh.to;
    const justEnded = now >= sh.to && now < sh.to + 90;
    if (justEnded) return { in: mod(sh.from - 8), how: 'Site QR', out: null };
    return inShift ? null : null;
  }
  function nextShift(P, v) {
    const sh = PO.shiftOf(v.shift), now = P.company.nowMin;
    const wrap = sh.to <= sh.from;
    const inShift = wrap ? now >= sh.from || now < sh.to : now >= sh.from && now < sh.to;
    if (inShift) return { when: 'Now', sh };
    if (sh.from === 0) return { when: 'Tonight', sh };
    return { when: sh.from > now ? (sh.from >= 18 * 60 ? 'Tonight' : 'Today') : 'Tomorrow', sh };
  }
  function weekPlan(P, v) {
    const r = PO.seeded('wk' + P.id + v.id);
    const off = (v.role === 'office' ? [5, 6] : v.id === P.hero.id && P.id === 'in' ? [6] : [r.int(0, 6)]).map((i) => (i === 1 && v.role !== 'office' ? 6 : i)); // never "week off" on the day they're working
    return ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'].map((d, i) => ({ d, off: off.includes(i), sh: PO.shiftOf(v.shift) }));
  }
  /** Attendance for a day (deterministic), consistent with the period's paid days, OT and LOP. */
  function attDay(P, v, iso, leaves) {
    if (iso > PO.TODAY) return { kind: 'future' };
    if (iso === PO.TODAY) return { kind: 'today' };
    const hol = P.holidays.find((h) => h.date === iso);
    const lv = leaves.find((l) => l.status !== 'Rejected' && iso >= l.from && iso <= l.to);
    const r = PO.seeded('att' + P.id + v.id + iso);
    const sh = PO.shiftOf(v.shift);
    const weekOff = v.role === 'office' ? dow(iso) === 0 || dow(iso) === 6 : P.id === 'in' ? (v.id === P.hero.id ? false : dow(iso) === (PO.hueOf(v.id) % 7)) : dow(iso) === (PO.hueOf(v.id) % 7) || dow(iso) === ((PO.hueOf(v.id) + 3) % 7);
    if (hol && !(P.id === 'in' && v.role !== 'office')) return { kind: 'holiday', label: hol.name };
    if (lv) return { kind: 'leave', label: PO.leaveType(lv.type)?.short || 'Leave' };
    if (weekOff) return { kind: 'off' };
    const lop = v.id === P.hero.id && P.id === 'in' ? iso === '2026-09-17' : false;
    if (lop || (v.id !== P.hero.id && r.chance(0.02) && iso < '2026-10-01')) return { kind: 'absent' };
    const late = r.chance(0.08) ? r.int(4, 18) : 0;
    const inM = mod(sh.from - r.int(2, 12) + late + (late ? 10 : 0));
    const otH = v.id === P.hero.id && P.id === 'in' ? (['2026-09-03', '2026-09-10', '2026-09-19', '2026-09-26'].includes(iso) ? 4 : 0) : r.chance(0.08) ? r.int(1, 3) : 0;
    const outM = mod(sh.to + r.int(0, 9) + otH * 60);
    const hrs = ((outM - inM + 1440) % 1440) / 60;
    return { kind: late ? 'late' : 'present', inM, outM, late, ot: otH, hrs, how: r.pick(['Site QR', 'Portal', 'Portal', 'Portal', P.id === 'in' ? 'Biometric' : 'Kiosk']) };
  }

  function useMine() {
    const P = PO.P();
    const v = PO.viewer();
    const [extraLeave] = PO.useCoState('me.leave.' + v.id, []);
    const leaves = useMemo(() => [...extraLeave, ...P.leaveRequests.filter((l) => l.who === v.id)], [P.id, v.id, extraLeave]);
    return { P, v, leaves, rows: useMemo(() => payRows(P, v), [P.id, v.id]) };
  }

  /* =====================================================================
     ME (home)
     ===================================================================== */
  const signed = (P, n) => `${n >= 0 ? '+' : '−'}${PO.money(Math.abs(rnd(P, n)))}`;
  const dur = (m) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;

  function Me({ query = {} }) {
    if (query.profile === '1') return html`<${MyProfile} />`;
    return html`<${MeHome} />`;
  }
  function MeHome() {
    const { P, v, rows, leaves } = useMine();
    const C = P.company;
    const [clock, setClock] = PO.useCoState('me.clock.' + v.id, clockInit(P, v));
    const [stage, setStage] = useState(null);
    const [dir, setDir] = useState('in');
    const [whyOpen, setWhyOpen] = useState(false);
    const [done, setDone] = PO.useCoState('me.tasks.' + v.id, {});
    const site = PO.site(v.site);
    const ns = nextShift(P, v);
    const cur = rows[rows.length - 1], prev = rows[rows.length - 2];
    const diff = cur.pay.net - prev.pay.net;
    const now = P.company.nowMin;
    const fix = myFix(site);
    const gate = v.post || 'the site entrance';
    const sup = PO.person(v.supervisor || v.manager);
    const allow = () => { setStage('locating'); setTimeout(() => setStage('located'), 1100); };
    const punchIn = () => { if (dir === 'out') return clockOut('Portal'); setClock({ in: now, how: 'Portal', dist: fix.d, out: null }); setStage(null); PO.toast(`Clocked in at ${P.hhmm(now)}, location verified at ${site.name}`, { icon: 'CircleCheck' }); };
    const scan = () => { setStage('scanning'); setTimeout(() => { if (dir === 'out') return clockOut('Site QR'); setClock({ in: now, how: 'Site QR', out: null }); setStage(null); PO.toast(`Clocked in at ${P.hhmm(now)}, verified by the ${site.name} site QR`, { icon: 'CircleCheck' }); }, 1300); };
    const askSup = () => { setStage(null); PO.toast(`Sent to ${sup ? sup.name : 'your supervisor'}. They’ll record your ${dir === 'out' ? 'end' : 'start'} time from the manager portal.`, { icon: 'Send' }); };
    const clockOut = (how) => { setClock({ ...clock, out: now, outHow: how }); setStage(null); setDir('in'); PO.toast(`Clocked out at ${P.hhmm(now)}${how === 'Portal' ? ', location verified' : how === 'Site QR' ? ', verified by the site QR' : ''}`, { icon: 'LogOut' }); };
    const begin = (d) => { setDir(d); setStage('perm'); };
    const onClock = clock && clock.out == null;
    const worked = clock && clock.out != null ? (clock.out - clock.in + 1440) % 1440 : clock ? (now - clock.in + 1440) % 1440 : 0;
    const team = useMemo(() => P.people.filter((p) => p.site === v.site && p.shift === v.shift && p.id !== v.id && p.role !== 'office'), [P.id, v.id]);
    const types = P.leaveTypes.filter((t) => t.quota != null && (v.leave[t.key].quota > 0 || v.leave[t.key].balance > 0)).slice(0, 4);
    const pendingLeave = leaves.filter((l) => l.status === 'Pending');
    const tasks = [
      ...v.docs.filter((d) => d.status === 'Missing' || d.status === 'Expiring soon' || d.status === 'Expired').map((d) => ({ id: 'doc' + d.name, t: `${d.status === 'Missing' ? 'Upload' : 'Renew'} your ${d.name.toLowerCase()}`, meta: d.status, go: 'my-docs' })),
      v.reviewStatus === 'Not started' ? { id: 'rev', t: `Complete your self review for ${P.reviewCycle.name}`, meta: 'Due ' + PO.date(P.reviewCycle.closes, { short: true }), go: 'my-goals' } : null,
      { id: 'pol', t: `Acknowledge the ${P.companyDocs[2].name.toLowerCase()}`, meta: 'Updated ' + PO.date(P.companyDocs[2].updated, { short: true }), go: 'my-docs' },
      P.id === 'in' ? { id: 'nom', t: 'Confirm your PF nominee (Form 2)', meta: 'Takes 1 minute', go: 'my-docs' } : P.id === 'us' ? { id: 'oe', t: 'Pick your 2027 benefits', meta: 'Open enrollment ends Nov 15', go: 'my-docs' } : { id: 'uni', t: 'Confirm your winter fleece size', meta: 'By 16 Oct', go: 'my-docs' },
    ].filter(Boolean);
    const open = tasks.filter((t) => !done[t.id]).length;
    const hols = P.holidays.filter((h) => h.date >= PO.TODAY).slice(0, 4);
    const week = weekPlan(P, v);
    const greet = now < 12 * 60 ? 'Good morning' : now < 17 * 60 ? 'Good afternoon' : 'Good evening';
    const shiftStart = ns.sh.from, shiftEnd = ns.sh.to;
    const shiftLen = ((shiftEnd - shiftStart + 1440) % 1440) || 480;
    const intoShift = ns.when === 'Now' ? ((now - shiftStart + 1440) % 1440) : 0;
    const untilShift = ns.when === 'Now' ? 0 : (shiftStart - now + 1440) % 1440;
    const sinceEnd = (now - shiftEnd + 1440) % 1440;
    const ended = onClock && ns.when !== 'Now' && sinceEnd < 120;
    const shiftLine = ns.when === 'Now' ? `${dur(shiftLen - intoShift)} left in your shift` : ended ? `Ended ${sinceEnd} min ago. Clock out when you leave.` : `Starts in ${dur(untilShift)}`;

    const panel = stage === 'perm' ? html`<div class="ss-perm" role="dialog" aria-label="Location permission">
          <div class="ss-perm-h"><${Icon} n="MapPin" size=${16} style="color:var(--text-2);flex:none;margin-top:1px" /><div><b>${P.vocab.domain.split('.')[0]}.peopleos.app wants to</b><div class="muted">Know your location, to check you’re at ${site.name} when you clock ${dir}</div></div></div>
          <div class="ss-perm-b"><${Button} size="sm" onClick=${() => setStage('alt')}>Block</${Button}><${Button} size="sm" kind="primary" onClick=${allow}>Allow</${Button}></div></div>`
      : stage === 'locating' ? html`<div class="row t-sm muted" style="height:40px"><${Icon} n="LoaderCircle" size=${16} cls="ss-spin" /> Finding your location…</div>`
      : stage === 'located' ? html`<div class="ss-state"><${Icon} n=${fix.inside ? 'CircleCheck' : 'CircleAlert'} size=${15} style=${`flex:none;margin-top:1px;color:var(--${fix.inside ? 'green' : 'amber'})`} /><div><b>${fix.inside ? 'You’re inside the site fence' : 'You’re outside the site fence'}</b>${fmtDist(P, fix.d)} from ${gate}, accurate to ±${fmtDist(P, ME_OFF.acc)}</div></div>
          <${Button} kind="primary" size="lg" cls="ss-punch" icon=${dir === 'out' ? 'LogOut' : 'LogIn'} onClick=${punchIn}>Clock ${dir} at ${P.hhmm(now)}</${Button}>
          <button class="ss-alt" onClick=${() => setStage(null)}>Cancel</button>`
      : stage === 'alt' || stage === 'scanning' ? html`<div class="ss-state"><${Icon} n="MapPinOff" size=${15} style="flex:none;margin-top:1px;color:var(--amber)" /><div><b>${stage === 'scanning' ? 'Scanning the site QR…' : 'Location not available'}</b>${stage === 'scanning' ? `Point your camera at the QR code at ${site.name}.` : `Scan the QR code at ${site.name}, or ask ${sup ? sup.first : 'your supervisor'} to record your ${dir === 'out' ? 'end' : 'start'} time.`}</div></div>
          <${Button} kind="primary" size="lg" cls="ss-punch" icon=${stage === 'scanning' ? 'LoaderCircle' : 'QrCode'} disabled=${stage === 'scanning'} onClick=${scan}>${stage === 'scanning' ? 'Reading code…' : 'Scan site QR'}</${Button}>
          <div class="row"><button class="ss-alt" onClick=${askSup}>Ask ${sup ? sup.first : 'my supervisor'} instead</button><button class="ss-alt right" style="color:var(--text-3)" onClick=${() => setStage(null)}>Back</button></div>`
      : onClock ? html`<div class="ss-state"><${Icon} n="CircleCheck" size=${15} style="flex:none;margin-top:1px;color:var(--green)" /><div><b>In since ${P.hhmm(clock.in)}${clock.in > now ? ' yesterday' : ''}, ${dur(worked)}</b>${clock.how === 'Portal' ? `Location verified, ${fmtDist(P, clock.dist || fix.d)} from ${gate}` : clock.how === 'Site QR' ? `Verified by the ${site.name} site QR` : `Recorded by ${clock.how.toLowerCase()}`}</div></div>
          <${Button} size="lg" cls="ss-punch" icon="LogOut" onClick=${() => begin('out')}>Clock out</${Button}>`
      : html`${clock && clock.out != null ? html`<div class="ss-state"><${Icon} n="CircleCheck" size=${15} style="flex:none;margin-top:1px;color:var(--text-3)" /><div><b>Clocked out at ${P.hhmm(clock.out)}</b>In ${P.hhmm(clock.in)}, ${dur(worked)} on the clock</div></div>` : html`<div class="ss-state"><span class="badge dot amber" style="margin-top:1px"></span><div><b>Not clocked in</b>Your browser location checks you’re at ${site.name}.</div></div>`}
          <${Button} kind="primary" size="lg" cls="ss-punch" icon="LogIn" onClick=${() => begin('in')}>${clock && clock.out != null ? 'Clock in again' : 'Clock in'}</${Button}>
          <button class="ss-alt" onClick=${() => { setDir('in'); setStage('alt'); }}>Can’t share location? Use the site QR</button>`;

    const tiles = [
      { icon: 'Palmtree', accent: 'teal', t: `Request ${lvWord(P).toLowerCase()}`, h: types[0] ? `${fmtU(v.leave[types[0].key].balance, types[0])} of ${types[0].name.toLowerCase()} left` : 'Goes to your supervisor', go: () => PO.go('my-leave?apply=1') },
      { icon: 'FileDown', accent: 'green', t: 'Download payslip', h: `${C.period}, ${PO.money(cur.pay.net)}`, go: () => PO.fakeDownload(`Payslip ${C.period}.pdf`) },
      { icon: 'ClockAlert', accent: 'amber', t: 'Fix a missed punch', h: 'Your supervisor approves it', go: () => PO.go('my-time?reg=1') },
      { icon: 'ReceiptText', accent: 'blue', t: 'Submit an expense', h: 'Snap the receipt', go: () => PO.go('my-expenses?new=1') },
      { icon: 'LifeBuoy', accent: 'violet', t: 'Ask HR', h: `${P.byId[P.hrId].first} usually replies in an hour`, go: () => PO.go('helpdesk') },
    ];
    const TASK_IC = { doc: ['FileWarning', 'amber'], rev: ['Target', 'blue'], pol: ['ScrollText', 'violet'], nom: ['ShieldCheck', 'green'], oe: ['HeartPulse', 'rose'], uni: ['Shirt', 'teal'] };
    const showMe = stage === 'located' || (onClock && clock.how === 'Portal');
    const split = [{ v: cur.pay.net, c: 'var(--brand)', l: 'Take-home' }, { v: cur.pay.dedTotal, c: 'var(--amber-solid)', l: 'Deductions' }];
    return html`
      <div class="ss-hello"><${Avatar} p=${v} size="xl" /><div style="min-width:0"><h1>${greet}, ${v.first}</h1><p>${C.today}. ${v.title} at ${site.name}.</p></div>
        <div class="ph-actions"><${Menu} align="right" width=${220} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'My profile', icon: 'CircleUser', onClick: () => PO.go('me?profile=1') },
          { label: 'Get a letter', icon: 'FileText', onClick: () => PO.go('my-docs') },
          { label: 'Attendance history', icon: 'CalendarCheck2', onClick: () => PO.go('my-time') },
        ]} /></div></div>
      <div class="ss-tiles">${tiles.map((x) => html`<button class="ss-tile" onClick=${x.go}><${PO.Chip} icon=${x.icon} accent=${x.accent} size=${17} /><span style="min-width:0"><b>${x.t}</b><small>${x.h}</small></span></button>`)}</div>
      <section class="card me-today">
        <div class="me-map">
          <${PO.GMapPlace} lat=${site.lat} lng=${site.lng} zoom=${17} height=${452} radius=${site.radius} label=${site.name} address=${site.address} me=${showMe ? ME_OFF : null} />
          <div class="me-place"><${PO.Chip} icon="MapPin" accent="green" /><div style="min-width:0"><b>${site.name}</b><small class="ellipsis">${site.address}</small></div></div>
        </div>
        <div class="me-side">
          <div class="me-clock">
            <div class="row"><span class="me-k">Time clock</span><span class="right"><${Status} s=${onClock ? 'Clocked in' : clock && clock.out != null ? 'Off' : 'Not started'} /></span></div>
            <div class="me-time">${P.hhmm(now)}</div>
            ${panel}
          </div>
          <div class="me-shift">
            <div class="row" style="align-items:baseline;gap:8px"><b class="me-shiftname">${ns.sh.label} shift</b><span class="muted tnum">${ns.sh.time}</span><span class="right faint t-xs">${ns.when === 'Now' ? 'On now' : ended ? 'Today' : ns.when}</span></div>
            <${Progress} value=${ns.when === 'Now' ? (intoShift / shiftLen) * 100 : ended ? 100 : 0} />
            <div class="faint t-sm">${shiftLine}</div>
            <div class="me-facts">
              <div><small>Post</small><b class="ellipsis">${v.post || site.name}</b></div>
              <div><small>Supervisor</small>${sup ? html`<a class="row" style="gap:6px;min-width:0" href=${PO.href('people/' + sup.id)}><${Avatar} p=${sup} size="xs" /><b class="ellipsis">${sup.name}</b></a>` : html`<b>—</b>`}</div>
            </div>
          </div>
          <div class="me-crew">
            <div class="row"><span class="me-k">On shift with you</span><span class="right faint t-xs">${PO.plural(team.length, 'person', 'people')}</span></div>
            <div class="me-faces">${team.slice(0, 9).map((p) => html`<a href=${PO.href('people/' + p.id)} title=${`${p.name}, ${p.post || p.title}`}><${Avatar} p=${p} size="lg" presence=${P.absent && P.absent.has(p.id) ? 'off' : P.lateMap && P.lateMap[p.id] ? 'late' : 'on'} /></a>`)}${team.length > 9 ? html`<span class="me-more">+${team.length - 9}</span>` : null}</div>
          </div>
        </div>
      </section>

      <section class="card me-week">
        <div class="card-h"><${PO.Chip} icon="CalendarRange" accent="green" /><h3>Your week</h3><span class="sub">${ns.sh.label} shift, ${ns.sh.time}</span><div class="right"><a class="link t-sm" href=${PO.href('my-time')}>Attendance</a></div></div>
        <div class="me-days">${week.map((d) => { const hol = P.holidays.find((h) => h.date === d.d); return html`<div class=${'me-day' + (d.d === PO.TODAY ? ' today' : '') + (d.off ? ' off' : '')}><span class="dn">${PO.DAYS[dow(d.d)]}</span><b>${+d.d.slice(8)}</b><span class="sh">${hol ? hol.name : d.off ? 'Week off' : d.sh.time}</span></div>`; })}</div>
      </section>

      <div class="grid g-2 mt-16" style="align-items:start">
        <${Card} title="Announcements" icon="Megaphone" accent="rose" flush actions=${html`<a class="link t-sm" href=${PO.href('engagement')}>All</a>`}>
          ${P.announcements.slice(0, 3).map((a, i) => { const [ic, ac] = [['Gift', 'rose'], ['MonitorSmartphone', 'blue'], ['Target', 'violet']][i] || ['Megaphone', 'rose']; return html`<a class="ss-li" href=${PO.href('engagement')} style="align-items:flex-start"><${PO.Chip} icon=${ic} accent=${ac} /><div style="min-width:0" class="grow"><div class="row" style="gap:6px"><b class="w-550 ellipsis grow">${a.title}</b><span class="faint t-xs tnum" style="flex:none">${PO.date(a.date, { short: true, noYear: true })}</span></div><div class="faint t-sm ellipsis">${a.body}</div></div></a>`; })}
        </${Card}>
        <${Card} title="Upcoming holidays" icon="CalendarHeart" accent="teal" flush actions=${html`<a class="link t-sm" href=${PO.href('my-leave')}>Calendar</a>`}>
          ${hols.slice(0, 3).map((h) => html`<div class="ss-li"><${DTile} iso=${h.date} /><span class="grow ellipsis w-500">${h.name}</span><span class="faint t-xs">${PO.DAYS[dow(h.date)]}, in ${PO.plural(days(PO.TODAY, h.date), 'day')}</span></div>`)}
        </${Card}>
      </div>
      <${WhyModal} open=${whyOpen} onClose=${() => setWhyOpen(false)} P=${P} v=${v} rows=${rows} />`;
  }

  /** The employee's own profile (opened from the profile menu: me?profile=1). */
  function MyProfile() {
    const { P, v } = useMine();
    const [bankEdit] = PO.useCoState('me.bank.' + v.id, null);
    const bank = bankEdit || v.bank;
    const mgr = PO.person(v.manager), site = PO.site(v.site), sh = PO.shiftOf(v.shift);
    const sup = PO.person(v.supervisor || v.manager);
    const team = P.people.filter((p) => p.site === v.site && p.shift === v.shift && p.id !== v.id && p.role !== 'office');
    const ID = { pan: 'PAN', aadhaar: 'Aadhaar', uan: 'UAN (PF)', esic: 'ESIC', ssn: 'SSN', i9: 'Form I-9', w4: 'Form W-4', ni: 'NI number', rtw: 'Right to work', taxCode: 'Tax code' };
    const req = () => PO.toast(`Change request sent to ${P.byId[P.hrId].name} in HR`, { icon: 'Send' });
    return html`
      <a class="link t-sm" href=${PO.href('me')} style="display:inline-flex;align-items:center;gap:4px;margin-bottom:12px"><${Icon} n="ChevronLeft" size=${14} />Home</a>
      <${PO.ProfileHero} p=${v} sub=${`${v.title}, ${v.dept}. Employee ${v.id}.`}
        badges=${html`<${Status} s=${v.status || 'Active'} />`}
        meta=${html`<span><${Icon} n="MapPin" size=${14} />${site.name}${v.post ? ', ' + v.post : ''}</span><span><${Icon} n="Clock" size=${14} />${sh.label} shift, ${sh.time}</span><span><${Icon} n="CalendarDays" size=${14} />Joined ${PO.date(v.joinedIso)}, ${PO.tenure(v.tenureMonths)}</span>`}
        actions=${html`<${Button} icon="Download" onClick=${() => PO.fakeDownload('Employment certificate.pdf')}>Employment letter</${Button}><${Button} kind="primary" onClick=${req}>Request a change</${Button}>`} />
      <div class="grid g-main" style="align-items:start">
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="Job" icon="BriefcaseBusiness" accent="green"><${KV} cols2 items=${[['Department', v.dept], ['Site', `${site.name}${v.post ? ', ' + v.post : ''}`], ['Shift', `${sh.label}, ${sh.time}`], ['Manager', mgr ? html`<${Who} p=${mgr} size="xs" sub="" />` : '—'], ['Employment', `${v.type}, joined ${PO.date(v.joinedIso)}`], ['Tenure', PO.tenure(v.tenureMonths)]]} /></${Card}>
          <${Card} title="Personal" icon="UserRound" accent="blue"><${KV} cols2 items=${[['Work email', v.email], ['Phone', v.phone], ['Date of birth', PO.date(v.dob)], ['City', v.city], ['Blood group', v.blood]]} /></${Card}>
          <${Card} title="Bank" icon="Landmark" accent="teal" actions=${html`<${Button} size="sm" kind="ghost" href=${PO.href('my-pay')}>Change in Pay</${Button}>`}><${KV} cols2 items=${[['Bank', bank.name], ['Account', html`<span class="tnum">${bank.acct}</span>`], ['Status', html`<${Status} s=${bank.status === 'verified' ? 'Verified' : bank.status === 'missing' ? 'Missing' : 'Pending'} />`]]} /></${Card}>
          <${Card} title="IDs" icon="IdCard" accent="violet"><${KV} cols2 items=${Object.entries(v.ids).map(([k, x]) => [ID[k] || k, x])} /></${Card}>
          <div class="faint t-xs">Name, bank and ID changes are checked by HR before they apply. To change your bank account, use Pay.</div>
        </div>
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="Emergency contact" icon="Siren" accent="rose"><div class="row" style="gap:10px"><${Avatar} name=${v.emergency.name} size="lg" /><div><b class="w-550">${v.emergency.name}</b><div class="faint t-sm">${v.emergency.rel}, ${v.emergency.phone}</div></div></div></${Card}>
          <${Card} title="Reports to" icon="Network" accent="blue" flush>${[mgr, sup && sup !== mgr ? sup : null].filter(Boolean).map((m) => html`<div class="ss-li"><${Who} p=${m} /></div>`)}</${Card}>
          <${Card} title="Your crew" icon="Users" accent="amber" sub=${PO.plural(team.length, 'person', 'people')} flush><div class="ss-crew">${team.slice(0, 8).map((p) => html`<a href=${PO.href('people/' + p.id)} title=${p.name}><${Avatar} p=${p} size="lg" /><span>${p.first}</span></a>`)}</div></${Card}>
        </div>
      </div>`;
  }

  function WhyModal({ open, onClose, P, v, rows }) {
    if (!open) return null;
    const lines = whyLines(P, v, rows);
    const cur = rows[rows.length - 1].pay, prev = rows[rows.length - 2].pay;
    const diff = cur.net - prev.net;
    const u = v.id === P.hero.id ? v.u : null;
    return html`<${Modal} open title="Why did my pay change?" onClose=${onClose} footer=${html`<${Button} onClick=${() => { onClose(); PO.go('helpdesk'); }}>Raise a query</${Button}><${Button} kind="primary" onClick=${onClose}>Done</${Button}>`}>
      <div class="row" style="align-items:baseline;gap:8px"><span class=${'ss-net ' + (diff >= 0 ? 'ss-up' : 'ss-down')}>${signed(P, diff)}</span><span class="muted">vs ${rows[rows.length - 2].label}</span></div>
      <p class="muted mt-4">${PO.money(prev.net)} → <b style="color:var(--text)">${PO.money(cur.net)}</b> take-home.${u && P.id === 'in' ? ` You worked ${u.paid} of ${u.days} days, did ${u.ot} h overtime and ${u.nights} night shifts.` : u && P.id === 'us' ? ` You worked ${u.reg} regular hours, took ${u.pto} h PTO and did ${u.ot} h overtime.` : u ? ` You worked ${u.hours} hours, ${u.nights} of them at night, plus ${u.ot} h overtime.` : ''}</p>
      <div class="mt-12">${lines.map((w) => html`<div class="ss-why"><span>${w.label}</span><b class=${w.v >= 0 ? 'ss-up' : 'ss-down'}>${signed(P, w.v)}</b></div>`)}</div>
      <div class="faint t-xs mt-12">Positive amounts added to your take-home; deductions that went up show as negative.</div>
    </${Modal}>`;
  }

  /* =====================================================================
     MY PAY
     ===================================================================== */
  function PaySlipView({ P, v, row, framed }) {
    const pay = row.pay;
    const line = (x, neg) => html`<div class="ss-line"><span class="muted">${x.label}</span><span>${neg ? '−' : ''}${PO.money(x.amt)}</span></div>`;
    return html`<div class=${framed ? 'ss-letter' : 'ss-slipv'} style=${framed ? 'padding:20px 22px' : ''}>
      ${framed ? html`<div class="row" style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border)"><div><b class="t-md">${P.company.name}</b><div class="faint t-xs">${P.company.employerLine || P.company.city}</div></div><div class="right row" style="gap:10px;text-align:right"><div><b class="w-550">${v.name}</b><div class="faint t-xs">${v.title}, ${v.id}</div></div><${Avatar} p=${v} size="lg" /></div></div>` : null}
      <div class="row t-sm" style="gap:24px;flex-wrap:wrap"><span><span class="faint">Period</span> ${row.label}</span><span><span class="faint">${row.current ? 'Pays' : 'Paid'}</span> ${row.current ? P.company.payBy : PO.date(row.paidOn, { short: true })}</span><span><span class="faint">Site</span> ${PO.site(v.site).name}</span><span><span class="faint">Paid to</span> ${v.bank.name} ${v.bank.acct}</span></div>
      <div class="grid g-2 mt-16" style="gap:32px"><div><div class="ss-cap">Earnings</div>${pay.earn.map((x) => line(x))}<div class="ss-line"><b>Gross</b><span><b>${PO.money(pay.gross)}</b></span></div></div>
        <div><div class="ss-cap">Deductions</div>${pay.ded.map((x) => line(x, true))}<div class="ss-line"><b>Total deductions</b><span><b>−${PO.money(pay.dedTotal)}</b></span></div></div></div>
      <div class="row mt-16" style="padding-top:12px;border-top:1px solid var(--border-strong)"><b>Net pay</b><span class="right ss-net" style="font-size:22px">${PO.money(pay.net)}</span></div>
      ${pay.er ? html`<div class="faint t-xs mt-8">Your employer also paid ${pay.er.map((x) => `${x.label} ${PO.money(x.amt)}`).join(', ')} on top of your pay.</div>` : null}
    </div>`;
  }

  function MyPay() {
    const { P, v, rows } = useMine();
    const { dispatch } = PO.useStore();
    const [open, setOpen] = useState(null);
    const [whyOpen, setWhyOpen] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);
    const [bankEdit] = PO.useCoState('me.bank.' + v.id, null);
    const bank = bankEdit || v.bank;
    const cur = rows[rows.length - 1];
    const ytdRows = rows.filter((r) => !r.current && (P.id === 'in' ? r.paidOn >= '2026-04-01' : P.id === 'uk' ? r.paidOn >= '2026-04-06' : r.paidOn >= '2026-01-01'));
    const extraUS = P.id === 'us' ? 8 : 0; // bi-weekly periods paid Jan–Apr, before this history starts
    const avg = (k) => ytdRows.reduce((t, r) => t + r.pay[k], 0) / (ytdRows.length || 1);
    const ytd = (k) => rnd(P, ytdRows.reduce((t, r) => t + r.pay[k], 0) + avg(k) * extraUS);
    const ytdLine = (key) => rnd(P, ytdRows.reduce((t, r) => t + (r.pay.ded.find((x) => x.k === key)?.amt || 0), 0) * (1 + extraUS / (ytdRows.length || 1)));
    const ytdLabel = P.id === 'in' ? 'FY 2026-27 to date' : P.id === 'uk' ? 'Tax year 2026/27 to date' : '2026 to date';
    const openRow = open != null ? rows.find((r) => r.id === open) : null;
    const list = rows.slice().reverse();
    return html`
      <${PageHeader} title="Pay" sub=${`Next pay day ${P.company.payBy}, paid to ${bank.name} ${bank.acct}.`} actions=${html`
        <${Button} onClick=${() => setWhyOpen(true)}>Why did my pay change?</${Button}>
        <${Button} kind="primary" icon="Download" onClick=${() => PO.fakeDownload(`Payslip ${cur.label}.pdf`)}>Download payslip</${Button}>
        <${Menu} align="right" width=${220} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'Email me this payslip', icon: 'Mail', onClick: () => PO.toast(`Payslip emailed to ${v.email}`, { icon: 'Mail' }) },
          { label: `Download all (${ytdLabel})`, icon: 'FolderDown', onClick: () => PO.fakeDownload(`All payslips ${ytdLabel} (ZIP)`) },
          '-',
          { label: 'Change bank account', icon: 'Landmark', onClick: () => setBankOpen(true) },
        ]} />`} />
      <${PO.KpiStrip} items=${[
        { label: 'Take-home, ' + cur.label, icon: 'Wallet', accent: 'green', value: PO.money(cur.pay.net), sub: `pays ${P.company.payBy}` },
        { label: 'Gross pay', icon: 'Banknote', accent: 'blue', value: PO.money(cur.pay.gross), bar: [{ v: cur.pay.net, k: 'ok', title: 'Take-home' }, { v: cur.pay.dedTotal, k: 'mute', title: 'Deductions' }], sub: `${PO.money(cur.pay.dedTotal)} in deductions` },
        { label: 'Earned ' + (P.id === 'us' ? 'in 2026' : 'this tax year'), icon: 'TrendingUp', accent: 'violet', value: PO.money(ytd('gross'), { compact: P.id === 'in' }), sub: ytdLabel },
        { label: P.id === 'in' ? 'PF saved this year' : P.id === 'us' ? '401(k) this year' : 'Pension this year', icon: 'PiggyBank', accent: 'teal', value: PO.money(ytdLine(P.id === 'in' ? 'epf' : P.id === 'us' ? '401k' : 'pen')), sub: P.id === 'in' ? '+ the same from your employer' : P.id === 'us' ? '+ 3% employer match' : '+ 3% from your employer' },
      ]} />
      <div class="grid g-main mt-24" style="align-items:start">
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title=${'Payslip for ' + cur.label} icon="FileText" accent="green" actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => setOpen(cur.id)}>Open</${Button}>`}><${PaySlipView} P=${P} v=${v} row=${cur} /></${Card}>
          <${DataTable} rows=${list} exportName="my-payslips" pageSize=${12} onRow=${(r) => setOpen(r.id)} compact
            columns=${[
              { key: 'label', label: 'Period', render: (r) => html`<span class="row" style="gap:10px"><${PO.Chip} icon=${r.offCycle ? 'Zap' : 'FileText'} accent=${r.current ? 'amber' : r.offCycle ? 'violet' : 'green'} size=${13} /><span><span class="w-550">${r.label}</span>${r.offCycle ? html` <span class="faint t-xs">off-cycle</span>` : null}</span></span>`, sort: (r) => r.i },
              { key: 'paid', label: 'Paid on', render: (r) => (r.current ? html`<span style="color:var(--signal)">Pays ${P.company.payBy}</span>` : PO.date(r.paidOn, { short: true })), sort: (r) => r.paidOn, csv: (r) => r.paidOn },
              { key: 'gross', label: 'Gross', align: 'r', render: (r) => html`<span class="tnum">${PO.money(r.pay.gross)}</span>`, sort: (r) => r.pay.gross, csv: (r) => r.pay.gross },
              { key: 'ded', label: 'Deductions', align: 'r', render: (r) => html`<span class="tnum muted">−${PO.money(r.pay.dedTotal)}</span>`, sort: (r) => r.pay.dedTotal, csv: (r) => r.pay.dedTotal },
              { key: 'net', label: 'Take-home', align: 'r', render: (r) => html`<b class="tnum w-600">${PO.money(r.pay.net)}</b>`, sort: (r) => r.pay.net, csv: (r) => r.pay.net },
              { key: 'dl', label: '', sort: false, csv: false, width: 44, render: (r) => html`<${IconButton} icon="Download" size="sm" title="Download PDF" onClick=${(e) => { e.stopPropagation(); PO.fakeDownload(`Payslip ${r.label}.pdf`); }} />` },
            ]} />
        </div>
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="What changed" icon="ArrowLeftRight" accent="amber" sub=${`vs ${rows[rows.length - 2].label}`} actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => setWhyOpen(true)}>Details</${Button}>`}>
            ${whyLines(P, v, rows).slice(0, 6).map((w) => html`<div class="ss-why t-sm"><span>${w.label}</span><b class=${w.v >= 0 ? 'ss-up' : 'ss-down'}>${signed(P, w.v)}</b></div>`)}
          </${Card}>
          <${TaxCard} P=${P} v=${v} ytd=${ytd} ytdLine=${ytdLine} ytdLabel=${ytdLabel} />
          <${Card} title="Bank account" icon="Building2" accent="teal" actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => setBankOpen(true)}>Change</${Button}>`}>
            <div class="row"><div class="grow" style="min-width:0"><b class="w-600">${bank.name}</b><div class="faint t-sm tnum">${bank.acct}, ${P.id === 'in' ? 'IFSC ' + ifsc(bank.name) : P.id === 'us' ? 'Checking, routing •••• 0021' : 'Sort code ••-••-' + String(PO.hueOf(v.id) % 90 + 10)}</div></div><${Status} s=${bank.status === 'verified' ? 'Verified' : bank.status === 'missing' ? 'Missing' : 'Pending'} /></div>
            <div class="faint t-xs mt-8">${bank.status === 'pending' ? `Change submitted today. ${P.id === 'in' ? 'A ₹1 penny-drop confirms the name on the account' : 'A small test deposit confirms the account'}; your next pay goes here once it clears.` : 'Changing your bank account needs a one-time code sent to your registered mobile.'}</div>
          </${Card}>
        </div>
      </div>
      ${openRow ? html`<${Drawer} open size="lg" title=${`Payslip, ${openRow.label}`} sub=${openRow.current ? 'Pays ' + P.company.payBy : 'Paid ' + PO.date(openRow.paidOn)} onClose=${() => setOpen(null)} footer=${html`<${Button} icon="Mail" onClick=${() => PO.toast(`Payslip emailed to ${v.email}`, { icon: 'Mail' })}>Email me a copy</${Button}><${Button} kind="primary" icon="Download" onClick=${() => PO.fakeDownload(`Payslip ${openRow.label}.pdf`)}>Download PDF</${Button}>`}><${PaySlipView} P=${P} v=${v} row=${openRow} framed /></${Drawer}>` : null}
      <${WhyModal} open=${whyOpen} onClose=${() => setWhyOpen(false)} P=${P} v=${v} rows=${rows} />
      <${BankModal} open=${bankOpen} onClose=${() => setBankOpen(false)} P=${P} v=${v} />`;
  }
  const ifsc = (bank) => ({ 'HDFC Bank': 'HDFC0001864', 'State Bank of India': 'SBIN0011371', 'ICICI Bank': 'ICIC0002163', 'Bank of Maharashtra': 'MAHB0001502', 'Kotak Mahindra Bank': 'KKBK0001773', 'Axis Bank': 'UTIB0003047' })[bank] || 'HDFC0001864';

  function TaxCard({ P, v, ytd, ytdLine, ytdLabel }) {
    const [regime, setRegime] = PO.useCoState('me.regime.' + v.id, 'new');
    if (P.id === 'in') {
      const taxable = Math.max(0, v.annualGross - (regime === 'new' ? 75000 : 50000) - (regime === 'old' ? Math.min(150000, (v.pay.ded.find((x) => x.k === 'epf')?.amt || 0) * 12) : 0));
      return html`<${Card} title="Income tax" icon="Landmark" accent="blue" actions=${html`<${PO.Segmented} options=${[['new', 'New regime'], ['old', 'Old regime']]} value=${regime} onChange=${(x) => { setRegime(x); PO.toast(x === 'new' ? 'Switched to the new regime for this year' : 'Old regime selected; submit proofs by January'); }} />`}>
        <div class="ss-line"><span class="muted">Annual gross (FY 2026-27, projected)</span><span>${PO.money(v.annualGross)}</span></div>
        <div class="ss-line"><span class="muted">Standard deduction${regime === 'old' ? ' + 80C (PF)' : ''}</span><span>−${PO.money(v.annualGross - taxable)}</span></div>
        <div class="ss-line"><span class="muted">Taxable income</span><span>${PO.money(taxable)}</span></div>
        <div class="ss-line"><span class="muted">TDS deducted so far</span><span>${PO.money(0)}</span></div>
        <div class="ss-line"><span class="muted">Tax payable</span><span>${PO.money(0)}</span></div>
        <div class="faint t-xs mt-8">${regime === 'new' ? 'Below ₹12 lakh, so the section 87A rebate makes your tax zero.' : 'Below ₹5 lakh, so the 87A rebate makes your tax zero.'} PF this year: ${PO.money(ytdLine('epf'))}.</div>
        <div class="row mt-12" style="gap:8px"><${Button} size="sm" icon="Download" onClick=${() => PO.fakeDownload('Form 16 FY 2025-26.pdf')}>Form 16 (FY 25-26)</${Button}><${Button} size="sm" kind="ghost" icon="ExternalLink" onClick=${() => PO.toast('UAN passbook opened (EPFO)')}>PF passbook</${Button}></div>
      </${Card}>`;
    }
    if (P.id === 'us') return html`<${Card} title="Taxes" icon="Landmark" accent="blue" sub=${ytdLabel}>
      <div class="ss-line"><span class="muted">Federal income tax</span><span>${PO.money(ytdLine('fit'))}</span></div>
      <div class="ss-line"><span class="muted">Social Security (6.2%)</span><span>${PO.money(ytdLine('ss'))}</span></div>
      <div class="ss-line"><span class="muted">Medicare (1.45%)</span><span>${PO.money(ytdLine('med'))}</span></div>
      <div class="ss-line"><span class="muted">Texas state income tax</span><span>${PO.money(0)}</span></div>
      <div class="faint t-xs mt-8">W-4: 2026 form on file, Single, no extra withholding.</div>
      <div class="row mt-12" style="gap:8px"><${Button} size="sm" icon="Download" onClick=${() => PO.fakeDownload('W-2 2025.pdf')}>W-2 (2025)</${Button}><${Button} size="sm" kind="ghost" icon="Pencil" onClick=${() => PO.toast('W-4 editor opened. Changes apply from your next check.')}>Update W-4</${Button}></div>
    </${Card}>`;
    return html`<${Card} title="Tax & NI" icon="Landmark" accent="blue" sub=${ytdLabel}>
      <div class="ss-line"><span class="muted">Tax code</span><span>${v.ids.taxCode}, cumulative</span></div>
      <div class="ss-line"><span class="muted">Income tax (PAYE)</span><span>${PO.money(ytdLine('tax'))}</span></div>
      <div class="ss-line"><span class="muted">National Insurance (category A)</span><span>${PO.money(ytdLine('ni'))}</span></div>
      <div class="ss-line"><span class="muted">Pension (5%)</span><span>${PO.money(ytdLine('pen'))}</span></div>
      <div class="faint t-xs mt-8">NI number ${v.ids.ni}. HMRC is updated every pay day through RTI.</div>
      <div class="row mt-12" style="gap:8px"><${Button} size="sm" icon="Download" onClick=${() => PO.fakeDownload('P60 2025-26.pdf')}>P60 (2025/26)</${Button}></div>
    </${Card}>`;
  }

  function BankModal({ open, onClose, P, v }) {
    const [, setBank] = PO.useCoState('me.bank.' + v.id, null);
    const [step, setStep] = useState(0);
    const [acct, setAcct] = useState('');
    const [code, setCode] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    useEffect(() => { if (open) { setStep(0); setAcct(''); setCode(''); setOtp(['', '', '', '', '', '']); } }, [open]);
    useEffect(() => { if (step === 1) { const t = setTimeout(() => setOtp('482913'.split('')), 1400); return () => clearTimeout(t); } }, [step]);
    if (!open) return null;
    const bankName = P.id === 'in' ? (code.toUpperCase().startsWith('SBIN') ? 'State Bank of India' : code.toUpperCase().startsWith('ICIC') ? 'ICICI Bank' : code.toUpperCase().startsWith('HDFC') ? 'HDFC Bank' : code.length >= 4 ? 'Bank of Maharashtra' : '') : P.id === 'us' ? (code.length >= 9 ? 'Chase' : '') : code.length >= 6 ? 'NatWest' : '';
    const valid = acct.replace(/\D/g, '').length >= (P.id === 'uk' ? 8 : 9) && (P.id === 'in' ? code.length === 11 : P.id === 'us' ? code.length === 9 : code.replace(/\D/g, '').length === 6);
    const phone = v.phone.replace(/\d(?=\d{2})/g, '•');
    return html`<${Modal} open title=${step === 2 ? 'Bank change submitted' : 'Change bank account'} onClose=${onClose}
      footer=${step === 0 ? html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!valid} onClick=${() => setStep(1)}>Continue</${Button}>` : step === 1 ? html`<${Button} onClick=${() => setStep(0)}>Back</${Button}><${Button} kind="primary" disabled=${otp.join('').length < 6} onClick=${() => { setBank({ name: bankName || 'New bank', acct: '•••• ' + acct.replace(/\D/g, '').slice(-4), status: 'pending' }); setStep(2); PO.toast('Bank change submitted. HR has been notified.', { icon: 'ShieldCheck' }); }}>Verify & submit</${Button}>` : html`<${Button} kind="primary" onClick=${onClose}>Done</${Button}>`}>
      ${step === 0 ? html`<div class="col" style="gap:12px">
        <p class="muted">We’ll text a one-time code to confirm it’s you. The new account is used from the next ${P.id === 'in' ? 'salary' : 'pay day'} once verified.</p>
        <${Field} label=${P.id === 'in' ? 'IFSC code' : P.id === 'us' ? 'Routing number' : 'Sort code'} hint=${bankName ? html`<span style="color:var(--green)"><${Icon} n="Check" size=${11} /> ${bankName}${P.id === 'in' ? ', Hinjewadi branch' : ''}</span>` : P.id === 'in' ? '11 characters, e.g. SBIN0011371' : P.id === 'us' ? '9 digits' : '6 digits'}><input class="input tnum" value=${code} maxLength=${P.id === 'in' ? 11 : P.id === 'us' ? 9 : 8} onInput=${(e) => setCode(e.target.value.toUpperCase())} placeholder=${P.id === 'in' ? 'SBIN0011371' : P.id === 'us' ? '111000614' : '60-16-13'} /></${Field}>
        <${Field} label="Account number"><input class="input tnum" value=${acct} onInput=${(e) => setAcct(e.target.value)} placeholder=${P.id === 'uk' ? '8 digits' : 'Account number'} /></${Field}>
        <${Field} label="Name on account" hint="Must match your name in People OS"><input class="input" value=${v.name} readOnly /></${Field}>
      </div>` : step === 1 ? html`<div class="col" style="gap:14px;align-items:center;text-align:center">
        <${Icon} n="MessageSquareLock" size=${24} cls="faint" />
        <div><b class="t-md">Enter the code we sent</b><div class="muted t-sm">Sent by ${P.id === 'us' ? 'text' : 'SMS'} to ${phone}</div></div>
        <div class="ss-otp">${otp.map((d, i) => html`<input value=${d} maxLength="1" onInput=${(e) => { const o = otp.slice(); o[i] = e.target.value.slice(-1); setOtp(o); }} />`)}</div>
        <div class="faint t-xs">${otp.join('').length === 6 ? html`<span style="color:var(--green)"><${Icon} n="Check" size=${11} /> Code filled in from your messages</span>` : 'Waiting for the code… resend in 0:28'}</div>
      </div>` : html`<${Timeline} items=${[{ icon: 'Check', tone: 'green', title: 'Code verified', sub: 'Just now' }, { icon: 'Landmark', tone: 'brand', title: P.id === 'in' ? '₹1 penny-drop to confirm the name' : 'Test deposit to confirm the account', sub: 'Usually within an hour' }, { icon: 'UserCheck', title: `${P.byId[P.hrId].name} approves`, sub: 'HR is notified automatically' }, { icon: 'Banknote', title: 'Your next pay goes to the new account', sub: P.company.payBy }]} />`}
    </${Modal}>`;
  }

  /* =====================================================================
     MY LEAVE
     ===================================================================== */
  function MyLeave({ query }) {
    const { P, v, leaves } = useMine();
    const [extra, setExtra] = PO.useCoState('me.leave.' + v.id, []);
    const [cancelled, setCancelled] = PO.useCoState('me.leaveCancelled.' + v.id, {});
    const types = P.leaveTypes.filter((t) => t.key !== 'co' || v.leave.co.quota > 0);
    const applyable = types.filter((t) => t.key !== 'lop');
    const [type, setType] = useState(applyable[0].key);
    const [from, setFrom] = useState(PO.addDays(PO.TODAY, 6));
    const [to, setTo] = useState(PO.addDays(PO.TODAY, 6));
    const [half, setHalf] = useState(false);
    const [reason, setReason] = useState('');
    const [ask, confirmEl] = PO.useConfirm();
    const [tab, setTab] = useState('requests');
    const formRef = useRef();
    useEffect(() => { if (query.apply === '1' && formRef.current) formRef.current.scrollIntoView({ block: 'center' }); }, []);
    const t = PO.leaveType(type);
    const pendingExtra = (k) => extra.filter((l) => l.type === k && l.status === 'Pending' && !cancelled[l.id]).reduce((s, l) => s + (l.hours || l.days), 0);
    const bal = (k) => { const b = v.leave[k]; return b.balance == null ? null : b.balance - pendingExtra(k); };
    const span = [];
    for (let d = from; d <= to && span.length < 40; d = PO.addDays(d, 1)) span.push(d);
    const holidaysIn = span.filter((d) => P.holidays.some((h) => h.date === d));
    const offIn = span.filter((d) => v.role === 'office' ? dow(d) === 0 || dow(d) === 6 : P.id !== 'in' && dow(d) === 0);
    const workDays = Math.max(0, span.length - holidaysIn.length - offIn.length) * (half ? 0.5 : 1);
    const amount = t.unit === 'hours' ? workDays * 8 : workDays;
    const after = bal(type) == null ? null : bal(type) - amount;
    const notice = days(PO.TODAY, from);
    const needNotice = P.id === 'in' ? (type === 'el' ? 7 : type === 'cl' ? 1 : 0) : P.id === 'us' ? (type === 'pto' ? 3 : 0) : type === 'hol' ? Math.max(2 * Math.ceil(workDays), 2) : 0;
    const overlap = P.leaveRequests.filter((l) => l.who !== v.id && P.byId[l.who].site === v.site && P.byId[l.who].shift === v.shift && l.status !== 'Rejected' && !(l.to < from || l.from > to));
    const checks = [
      { ok: after == null || after >= 0, t: after == null ? `${t.name} has no fixed balance` : `Balance after: ${fmtU(after, t)}`, d: after != null && after < 0 ? `You only have ${fmtU(bal(type), t)}. The rest would be ${P.id === 'in' ? 'loss of pay' : 'unpaid'}.` : `${fmtU(bal(type) ?? 0, t)} available now` },
      { ok: notice >= needNotice, t: needNotice ? `${needNotice} day${needNotice > 1 ? 's' : ''}’ notice needed` : 'No notice needed', d: notice >= needNotice ? `You're giving ${PO.plural(Math.max(0, notice), 'day')}` : `Only ${PO.plural(Math.max(0, notice), 'day')} away; your supervisor can still approve it` },
      { ok: overlap.length < 2, t: overlap.length ? `${PO.plural(overlap.length, 'colleague')} on your shift also off` : 'Nobody else on your shift is off', d: overlap.length ? overlap.slice(0, 2).map((l) => P.byId[l.who].name).join(', ') : 'Cover should be easy' },
      holidaysIn.length ? { ok: true, t: `${PO.plural(holidaysIn.length, 'holiday')} in this range not counted`, d: holidaysIn.map((d) => P.holidays.find((h) => h.date === d).name).join(', ') } : null,
    ].filter(Boolean);
    const approver = PO.person(v.supervisor || v.manager) || P.byId[P.hrId];
    const submit = () => {
      const id = 'MYLV-' + (extra.length + 1);
      setExtra([{ id, who: v.id, type, from, to, days: workDays, hours: t.unit === 'hours' ? amount : null, reason: reason || 'Personal', status: 'Pending', applied: PO.TODAY, approver: approver.id, channel: 'Web' }, ...extra]);
      PO.toast(`${t.name} request sent to ${approver.name}. You'll get an email when they decide.`, { icon: 'Send' });
      setReason('');
    };
    const hist = leaves.map((l) => (cancelled[l.id] ? { ...l, status: 'Cancelled' } : l));
    const teamOff = {};
    P.leaveRequests.filter((l) => P.byId[l.who].site === v.site && l.status !== 'Rejected' && l.from.slice(0, 7) === '2026-10').forEach((l) => { for (let d = l.from; d <= l.to; d = PO.addDays(d, 1)) (teamOff[d] = teamOff[d] || []).push({ label: (l.who === v.id ? 'You' : P.byId[l.who].first) + ', ' + PO.leaveType(l.type).short, tone: l.who === v.id ? 'green' : l.status === 'Pending' ? 'amber' : 'slate' }); });
    extra.filter((l) => !cancelled[l.id]).forEach((l) => { for (let d = l.from; d <= l.to; d = PO.addDays(d, 1)) (teamOff[d] = teamOff[d] || []).push({ label: 'You, ' + PO.leaveType(l.type).short, tone: 'green' }); });
    P.holidays.forEach((h) => (teamOff[h.date] = [{ label: h.name, tone: 'slate' }, ...(teamOff[h.date] || [])]));
    return html`
      <${PageHeader} title=${lvWord(P)} sub=${`${hist.filter((l) => l.status === 'Pending').length ? PO.plural(hist.filter((l) => l.status === 'Pending').length, 'request') + ' waiting' : 'Nothing waiting for approval'}. Requests go to ${approver.name}.`} actions=${html`<${Menu} align="right" width=${200} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[{ label: 'Leave policy', icon: 'FileText', onClick: () => PO.toast(`${lvWord(P)} policy opened`) }, { label: 'Download my history', icon: 'Download', onClick: () => PO.exportCsv('my-leave', [['Type', 'From', 'To', 'Status'], ...hist.map((l) => [PO.leaveType(l.type).name, l.from, l.to, l.status])]) }]} />`} />
      <${PO.KpiStrip} items=${types.slice(0, 5).map((x) => { const b = v.leave[x.key]; const bb = bal(x.key); const n = bb ?? b.taken; const u = x.unit === 'hours' ? 'h' : n === 1 ? 'day' : 'days'; if (bb == null) return { label: x.name, icon: LV_IC[x.key] || 'CalendarDays', accent: lvAccent(x), value: PO.num(b.taken), unit: u, sub: 'taken this year' }; const pend = Math.max(0, b.quota - b.taken - bb); return { label: x.name + ' left', icon: LV_IC[x.key] || 'CalendarDays', accent: lvAccent(x), value: PO.num(bb), unit: u, alert: !!b.quota && bb / b.quota < 0.15, bar: [{ v: b.taken, k: 'mute', title: `${PO.num(b.taken)} used` }, { v: pend, k: 'warn', title: 'pending' }, { v: Math.max(0, bb), k: 'ok', title: `${PO.num(bb)} left` }], sub: `${PO.num(b.taken)} used of ${PO.num(b.quota)}${pend > 0 ? ', ' + PO.num(pend) + ' pending' : ''}` }; })} />
      <div class="grid g-main mt-24" style="align-items:start">
        <div class="col" style="gap:16px;min-width:0">
          <div ref=${formRef}><${Card} title=${'Apply for ' + lvWord(P).toLowerCase()} icon="CalendarPlus" accent="teal" sub=${'Approver: ' + approver.name}>
            <div class="ss-form">
              <div class="col" style="gap:12px">
                <${Field} label="Type"><div class="row wrap" style="gap:6px">${applyable.map((x) => html`<button class="ss-chip" aria-pressed=${type === x.key} onClick=${() => setType(x.key)} style="gap:6px;padding-left:5px;height:32px"><${LvChip} t=${x} size=${12} />${x.name}</button>`)}</div></${Field}>
                <div class="grid g-2" style="gap:12px"><${Field} label="From"><input class="input" type="date" value=${from} min=${PO.TODAY} onInput=${(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(e.target.value); }} /></${Field}><${Field} label="To"><input class="input" type="date" value=${to} min=${from} onInput=${(e) => setTo(e.target.value)} /></${Field}></div>
                <${Switch} on=${half} onChange=${setHalf} label=${t.unit === 'hours' ? 'Half shift (4 h)' : 'Half day'} />
                <${Field} label="Reason" hint="Only your supervisor and HR see this."><input class="input" value=${reason} onInput=${(e) => setReason(e.target.value)} placeholder=${P.id === 'in' ? 'Native place visit' : P.id === 'us' ? 'Family visit' : 'Family wedding'} /></${Field}>
                <div class="row"><span class="muted t-sm">You're asking for <b class="tnum" style="color:var(--text)">${fmtU(amount, t)}</b></span><${Button} kind="primary" icon="Send" cls="right" disabled=${amount <= 0} onClick=${submit}>Send request</${Button}></div>
              </div>
              <div class="ss-checks"><span class="ss-cap">Policy check</span>
                <div class="col" style="gap:10px">${checks.map((c) => html`<div class="row" style="align-items:flex-start;gap:8px"><${Icon} n=${c.ok ? 'CircleCheck' : 'TriangleAlert'} size=${15} style=${`flex:none;margin-top:1px;color:var(--${c.ok ? 'green' : 'amber'})`} /><div><div class="t-sm w-550">${c.t}</div><div class="faint t-xs">${c.d}</div></div></div>`)}</div></div>
            </div>
          </${Card}></div>
          <div><${Tabs} tabs=${[['requests', 'My requests', hist.length], ['calendar', `Who’s off at ${PO.site(v.site).name}`]]} value=${tab} onChange=${setTab} />
          ${tab === 'requests' ? html`<${DataTable} rows=${hist} pageSize=${8} compact empty=${{ title: 'No requests yet', text: 'Your leave requests and their status show up here.' }}
            columns=${[
              { key: 'type', label: 'Type', render: (l) => html`<span class="row" style="gap:10px"><${LvChip} t=${PO.leaveType(l.type)} size=${13} /><span><b class="w-550">${PO.leaveType(l.type).name}</b><div class="faint t-xs">${l.reason}</div></span></span>`, sort: (l) => l.type, csv: (l) => PO.leaveType(l.type).name },
              { key: 'from', label: 'Dates', render: (l) => (l.from === l.to ? PO.date(l.from, { weekday: true, short: true }) : `${PO.date(l.from, { short: true })} – ${PO.date(l.to, { short: true })}`) },
              { key: 'days', label: 'Amount', align: 'r', render: (l) => (l.hours ? `${l.hours} h` : PO.plural(l.days, 'day')) },
              { key: 'approver', label: 'Approver', render: (l) => { const a = PO.person(l.approver); return a ? html`<span class="row" style="gap:6px"><${Avatar} p=${a} size="xs" /><span class="muted">${a.first}</span></span>` : html`<span class="faint">—</span>`; }, sort: (l) => l.approver || '' },
              { key: 'channel', label: 'Asked via', render: (l) => html`<span class="muted">${l.channel}</span>` },
              { key: 'status', label: 'Status', render: (l) => html`<${Status} s=${l.status} />` },
              { key: 'act', label: '', sort: false, csv: false, render: (l) => (l.status === 'Pending' || (l.status === 'Approved' && l.from > PO.TODAY) ? html`<${Button} size="sm" kind="ghost" onClick=${() => ask({ title: 'Cancel this request?', body: html`<p>${PO.leaveType(l.type).name}, ${PO.date(l.from)}. ${PO.person(l.approver)?.name || 'Your supervisor'} will be told.</p>`, confirm: 'Cancel request', danger: true, onConfirm: () => { setCancelled({ ...cancelled, [l.id]: true }); PO.toast('Request cancelled. Your balance is back.'); } })}>Cancel</${Button}>` : null) },
            ]} />` : html`<${Card}><${MonthCal} year=${2026} month=${9} events=${teamOff} maxEv=${2} /></${Card}>`}</div>
        </div>
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="Upcoming holidays" icon="CalendarHeart" accent="teal" sub=${`${P.holidays.filter((h) => h.date >= PO.TODAY).length} of ${P.holidays.length} left in 2026`} flush>${P.holidays.filter((h) => h.date >= PO.TODAY).map((h) => html`<div class="ss-li"><${DTile} iso=${h.date} /><span class="grow ellipsis w-500">${h.name}</span><span class="faint t-xs">${PO.DAYS[dow(h.date)]}</span></div>`)}</${Card}>
          <${Card} title="Rules" icon="BookOpen" accent="violet" flush><div style="padding:4px 0">${(P.id === 'in' ? ['Casual leave needs 1 day’s notice; earned leave needs 7.', 'Sick leave over 2 days needs a doctor’s note.', 'Unused earned leave carries forward up to 45 days and can be encashed.', 'Working on a holiday earns a compensatory off.'] : P.id === 'us' ? ['PTO requests need 3 days’ notice (Handbook 4.1).', 'You earn 1 hour of PTO for every 30 hours worked.', 'Sick time can be used the same day; just text your lead.', 'Up to 40 hours of PTO carry over to next year.'] : ['Book holiday 2 weeks ahead in peak periods.', 'Holiday is 5.6 weeks a year, pro rata for part-time.', 'Off sick? Message your supervisor before your shift.', 'Up to 5 days carry over into next year.']).map((x) => html`<div class="ss-rail-row t-sm muted">${x}</div>`)}</div></${Card}>
        </div>
      </div>${confirmEl}`;
  }

  /* =====================================================================
     MY TIME
     ===================================================================== */
  function MyTime({ query }) {
    const { P, v, leaves } = useMine();
    const [month, setMonth] = useState(8);
    const [clock] = PO.useCoState('me.clock.' + v.id, clockInit(P, v));
    const [day, setDay] = useState(null);
    const [regOpen, setRegOpen] = useState(query.reg === '1' ? PO.addDays(PO.TODAY, -1) : null);
    const [regs, setRegs] = PO.useCoState('me.regs.' + v.id, []);
    const ev = {};
    const first = `2026-${String(month + 1).padStart(2, '0')}-01`;
    const dim = month === 8 ? 30 : 31;
    const stats = { present: 0, late: 0, absent: 0, ot: 0, hrs: 0, leave: 0 };
    for (let i = 0; i < dim; i++) {
      const d = PO.addDays(first, i);
      const a = attDay(P, v, d, leaves);
      const fixed = regs.find((r) => r.date === d);
      if (a.kind === 'present' || a.kind === 'late') { stats.present++; stats.hrs += a.hrs; stats.ot += a.ot; if (a.kind === 'late') stats.late++; ev[d] = [{ label: `${P.hhmm(a.inM)}–${P.hhmm(a.outM)}`, tone: a.kind === 'late' ? 'amber' : 'ss-plain' }, ...(a.ot ? [{ label: `+${a.ot} h overtime`, tone: 'slate' }] : [])]; }
      else if (a.kind === 'absent') { stats.absent++; ev[d] = [{ label: fixed ? 'Fix sent' : P.id === 'in' ? 'Absent, LOP' : 'Absent', tone: fixed ? 'amber' : 'rose' }]; }
      else if (a.kind === 'leave') { stats.leave++; ev[d] = [{ label: a.label, tone: 'slate' }]; }
      else if (a.kind === 'holiday') ev[d] = [{ label: a.label, tone: 'slate' }];
      else if (a.kind === 'off') ev[d] = [];
      else if (a.kind === 'today') ev[d] = [{ label: clock ? `In ${P.hhmm(clock.in)}${clock.out != null ? '–' + P.hhmm(clock.out) : ', on shift'}` : 'Not clocked in', tone: clock ? 'ss-plain' : 'amber' }];
      else ev[d] = [];
    }

    const week = weekPlan(P, v);
    const last7 = Array.from({ length: 7 }, (_, i) => PO.addDays(PO.TODAY, -i - 1)).map((d) => ({ d, a: attDay(P, v, d, leaves) }));
    const dayA = day ? attDay(P, v, day, leaves) : null;
    const u = v.u || {};
    return html`
      <${PageHeader} title="Attendance" sub=${`${PO.shiftOf(v.shift).label} shift, ${PO.shiftOf(v.shift).time}, at ${PO.site(v.site).name}. ${regs.length ? PO.plural(regs.length, 'fix', 'fixes') + ' waiting for approval.' : 'No open requests.'}`} actions=${html`<${Button} kind="primary" onClick=${() => setRegOpen(PO.addDays(PO.TODAY, -1))}>Fix a missed punch</${Button}><${Menu} align="right" width=${220} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[{ label: `Download ${PO.MONS[month]} attendance`, icon: 'Download', onClick: () => PO.fakeDownload(`Attendance ${PO.MONS[month]} 2026.pdf`) }]} />`} />
      <${PO.KpiStrip} items=${[
        { label: P.id === 'in' ? 'Paid days (Sep)' : 'Paid hours this period', icon: 'CalendarCheck2', accent: 'green', value: P.id === 'in' ? v.pay.work : PO.num(v.pay.work), unit: P.id === 'in' ? '/' + P.unitWords.days : 'h', bar: v.pay.unpaid ? [{ v: v.pay.work, k: 'ok', title: 'paid' }, { v: v.pay.unpaid, k: 'bad', title: 'unpaid' }] : null, sub: v.pay.unpaid ? `${v.pay.unpaid} ${P.id === 'in' ? 'loss-of-pay day' : 'unpaid h'}` : 'no unpaid time' },
        { label: 'Overtime', icon: 'Timer', accent: 'violet', value: v.pay.otHours || 0, unit: 'h', sub: v.pay.otPay ? PO.money(v.pay.otPay) + ' extra' : 'none this period' },
        { label: `Late arrivals (${PO.MONS[month]})`, icon: 'AlarmClock', accent: 'amber', value: stats.late, unit: '/' + stats.present, bar: [{ v: stats.present - stats.late, k: 'ok', title: 'on time' }, { v: stats.late, k: 'warn', title: 'late' }], sub: 'shifts started late; grace is 10 min', alert: stats.late > 2 },
        { label: `Hours (${PO.MONS[month]})`, icon: 'Clock', accent: 'blue', value: PO.num(stats.hrs, 0), unit: 'h', sub: `${stats.present} shifts, average ${stats.present ? (stats.hrs / stats.present).toFixed(1) : 0} h` },
      ]} />
      <div class="grid g-main mt-24" style="align-items:start">
        <${Card} title=${`${month === 8 ? 'September' : 'October'} 2026`} icon="CalendarDays" accent="green" actions=${html`<${PO.Segmented} options=${[['8', 'Sep'], ['9', 'Oct']]} value=${String(month)} onChange=${(x) => setMonth(+x)} />`}>
          <${MonthCal} year=${2026} month=${month} events=${ev} onDay=${(d) => d < PO.TODAY && setDay(d)} />
          <div class="legend mt-12"><span><i style="background:var(--amber-solid)"></i>Late start</span><span><i style="background:var(--rose)"></i>Absent</span><span><i style="background:var(--slate-soft);border:1px solid var(--border-strong)"></i>Leave, holiday or overtime</span><span class="faint">Times show your punches. Blank days are week offs; click a day for details.</span></div>
        </${Card}>
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="Today" icon="Clock" accent="blue" actions=${html`<${Button} size="sm" kind="ghost" href=${PO.href('me')}>Time clock</${Button}>`}>${clock ? html`<div class="ss-state"><${Icon} n="CircleCheck" size=${15} style="flex:none;margin-top:1px;color:var(--green)" /><div><b>In at ${P.hhmm(clock.in)}${clock.out != null ? `, out at ${P.hhmm(clock.out)}` : ''}</b>Verified by ${clock.how.toLowerCase() === 'portal' ? 'browser location' : clock.how} at ${PO.site(v.site).name}</div></div>` : html`<div class="ss-state"><span class="badge dot amber" style="margin-top:1px"></span><div><b>Not clocked in for your ${PO.shiftOf(v.shift).label.toLowerCase()} shift, ${PO.shiftOf(v.shift).time}</b>Clock in from Home with your browser location, or scan the site QR.</div></div>`}</${Card}>
          <${Card} title="This week" icon="CalendarRange" accent="green" sub=${PO.shiftOf(v.shift).label + ' shift'} flush>${week.map((d) => html`<div class=${'ss-week' + (d.d === PO.TODAY ? ' today' : '')}><span>${PO.DAYS[dow(d.d)]} ${+d.d.slice(8)}</span><span class=${d.off ? 'faint' : 'tnum'}>${d.off ? 'Week off' : d.sh.time}</span>${d.d === PO.TODAY ? html`<span class="t-xs">Today</span>` : !d.off && d.d > PO.TODAY ? html`<span style="margin-left:auto"><${Menu} align="right" trigger=${html`<${IconButton} icon="ArrowLeftRight" size="sm" title="Swap shift" />`} items=${[{ header: 'Ask to swap with' }, ...P.people.filter((p) => p.site === v.site && p.id !== v.id && p.role === v.role).slice(0, 4).map((p) => ({ label: p.name, onClick: () => PO.toast(`Swap request sent to ${p.first} and your supervisor`) }))]} /></span>` : html`<span></span>`}</div>`)}</${Card}>
          <${Card} title="My requests" icon="ClockAlert" accent="amber" flush>${regs.length ? regs.map((r) => html`<div class="list-item"><${PO.Chip} icon="ClockAlert" accent="amber" size=${13} /><div class="grow"><b class="w-550">${r.what}</b><div class="faint t-xs">${PO.date(r.date, { weekday: true, short: true })}, ${r.time}</div></div><${Status} s="Pending" /></div>`) : html`<${Empty} icon="CircleCheck" title="No open requests" text="Missed a punch? Fix it here and your supervisor approves it." />`}</${Card}>
        </div>
      </div>
      <div class="mt-24"><${Card} title="Last 7 days" icon="History" accent="blue" flush><div class="table-wrap"><table class="tbl"><thead><tr><th>Date</th><th>In</th><th>Out</th><th class="r">Hours</th><th>Verified by</th><th>Status</th><th></th></tr></thead><tbody>${last7.map(({ d, a }) => html`<tr><td class="w-550">${PO.date(d, { weekday: true, short: true })}</td><td class="tnum">${a.inM != null ? P.hhmm(a.inM) : '—'}</td><td class="tnum">${a.outM != null ? P.hhmm(a.outM) : '—'}</td><td class="r tnum">${a.hrs ? a.hrs.toFixed(1) : '—'}</td><td class="muted">${a.how || '—'}</td><td><${Status} s=${a.kind === 'present' ? 'Present' : a.kind === 'late' ? 'Late' : a.kind === 'absent' ? 'Absent' : a.kind === 'leave' ? 'On leave' : a.kind === 'holiday' ? 'Holiday' : 'Week off'} /></td><td class="r">${a.kind === 'absent' || a.kind === 'late' ? html`<${Button} size="sm" onClick=${() => setRegOpen(d)}>Regularise</${Button}>` : null}</td></tr>`)}</tbody></table></div></${Card}></div>
      ${day ? html`<${Drawer} open size="sm" title=${PO.date(day, { weekday: true })} sub=${PO.site(v.site).name} onClose=${() => setDay(null)} footer=${html`<${Button} kind="primary" icon="ClockAlert" onClick=${() => { setRegOpen(day); setDay(null); }}>Regularise this day</${Button}>`}>
        ${dayA.inM != null ? html`<${Timeline} items=${[{ icon: 'LogIn', tone: 'green', title: `Clocked in ${P.hhmm(dayA.inM)}`, sub: `Verified by ${dayA.how}${dayA.late ? `, ${dayA.late} min late` : ''}` }, ...(dayA.ot ? [{ icon: 'Timer', tone: 'brand', title: `${dayA.ot} h overtime`, sub: 'Approved by your supervisor' }] : []), { icon: 'LogOut', title: `Clocked out ${P.hhmm(dayA.outM)}`, sub: `${dayA.hrs.toFixed(1)} h on the clock` }]} />` : html`<${Empty} icon="CalendarX2" title=${dayA.kind === 'absent' ? 'No punches this day' : dayA.kind === 'off' ? 'Week off' : dayA.label || 'No shift'} text=${dayA.kind === 'absent' ? (P.id === 'in' ? 'Counted as loss of pay unless you regularise it.' : 'Counted as unpaid unless you regularise it.') : ''} />`}
      </${Drawer}>` : null}
      <${RegDrawer} date=${regOpen} onClose=${() => setRegOpen(null)} P=${P} v=${v} onSubmit=${(r) => setRegs([r, ...regs])} />`;
  }

  function RegDrawer({ date, onClose, P, v, onSubmit }) {
    const [d, setD] = useState(date);
    const [what, setWhat] = useState('Missed clock-out');
    const [time, setTime] = useState(P.hhmm(PO.shiftOf(v.shift).to));
    const [why, setWhy] = useState('');
    useEffect(() => { if (date) setD(date); }, [date]);
    const sup = PO.person(v.supervisor || v.manager) || P.byId[P.hrId];
    return html`<${Drawer} open=${!!date} onClose=${onClose} title="Fix a missed punch" sub=${`Goes to ${sup.name} for approval`} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" icon="Send" onClick=${() => { onSubmit({ date: d, what, time, why }); PO.toast(`Sent to ${sup.name}. If approved, it fixes your pay automatically.`, { icon: 'Send' }); onClose(); }}>Send request</${Button}>`}>
      <div class="col" style="gap:14px">
        <${Field} label="Date"><input class="input" type="date" value=${d} max=${PO.TODAY} onInput=${(e) => setD(e.target.value)} /></${Field}>
        <${Field} label="What happened"><div class="row wrap" style="gap:6px">${['Missed clock-in', 'Missed clock-out', 'Wrong time recorded', 'Worked at another site'].map((x) => html`<button class="ss-chip" aria-pressed=${what === x} onClick=${() => setWhat(x)}>${x}</button>`)}</div></${Field}>
        <${Field} label="Actual time"><input class="input" type="time" value=${time} onInput=${(e) => setTime(e.target.value)} /></${Field}>
        <${Field} label="Reason" hint="Your supervisor sees this."><textarea class="textarea" rows="3" style="height:auto;padding:8px 10px" value=${why} onInput=${(e) => setWhy(e.target.value)} placeholder=${P.id === 'in' ? 'Biometric terminal was down at the end of the shift' : 'Forgot to clock out at the end of my shift'}></textarea></${Field}>
        <div class="faint t-sm">Proof helps: the ${P.id === 'in' ? 'gate register' : P.id === 'us' ? 'POS log' : 'site sign-in sheet'} entry or a photo. Approved fixes flow into ${P.company.period} pay.</div>
      </div></${Drawer}>`;
  }

  /* =====================================================================
     MY DOCS
     ===================================================================== */
  function MyDocs() {
    const { P, v } = useMine();
    const [up, setUp] = PO.useCoState('me.docs.' + v.id, {});
    const [acks, setAcks] = PO.useCoState('me.acks.' + v.id, {});
    const [upload, setUpload] = useState(null);
    const [letter, setLetter] = useState(null);
    const docs = v.docs.map((d) => (up[d.name] ? { ...d, status: 'Pending review', uploaded: PO.TODAY, by: 'Employee' } : d));
    const LETTERS = P.id === 'in' ? [['Salary certificate', 'For a bank loan or rented house', 'Landmark'], ['Employment certificate', 'Confirms your job and joining date', 'BadgeCheck'], ['Address proof letter', 'For a new SIM card or gas connection', 'House'], ['Form 16 (FY 2025-26)', 'Income tax certificate', 'FileText']]
      : P.id === 'us' ? [['Employment verification letter', 'For a landlord or lender', 'BadgeCheck'], ['Pay verification', 'Shows your rate and average hours', 'Banknote'], ['W-2 (2025)', 'For your tax return', 'FileText'], ['Food handler card copy', 'Your current card', 'IdCard']]
        : [['Employment reference', 'For a landlord or new employer', 'BadgeCheck'], ['Proof of income letter', 'For a mortgage or tenancy', 'Banknote'], ['P60 (2025/26)', 'End of tax year certificate', 'FileText'], ['DBS certificate copy', 'Your current check', 'ShieldCheck']];
    const policies = P.companyDocs.filter((d) => d.folder === 'Policies');
    return html`
      <${PageHeader} title="Documents" sub=${(() => { const fix = docs.filter((d) => d.status === 'Missing' || d.status === 'Expired' || d.status === 'Expiring soon').length; const pol = policies.length - policies.filter((p, i) => acks[p.name] || i === 1).length; return `${docs.filter((d) => d.status === 'Verified').length} of ${docs.length} verified. ${fix ? PO.plural(fix, 'document') + ' to update' : 'Nothing to update'}${pol ? ', ' + PO.plural(pol, 'policy', 'policies') + ' to acknowledge' : ''}.`; })()} actions=${html`<${Button} kind="primary" icon="Upload" onClick=${() => setUpload(docs.find((d) => d.status !== 'Verified')?.name || docs[0].name)}>Upload a document</${Button}>`} />
      <div class="grid g-main" style="align-items:start">
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="My documents" icon="FolderOpen" accent="green" flush>
            ${docs.map((d) => html`<div class="list-item"><${PO.Chip} icon=${d.status === 'Missing' ? 'FileX2' : d.status === 'Expired' || d.status === 'Expiring soon' ? 'FileWarning' : /photo|card|id|aadhaar|pan|licen|passport|ssn|i-9|dbs|rtw|right/i.test(d.name) ? 'IdCard' : 'FileText'} accent=${d.status === 'Missing' || d.status === 'Expired' ? 'red' : d.status === 'Expiring soon' || d.status === 'Pending review' ? 'amber' : 'green'} />
              <div class="grow" style="min-width:0"><b class="w-550">${d.name}</b><div class="faint t-xs">${d.uploaded ? `Added ${PO.date(d.uploaded, { short: true })} by ${d.by === 'Employee' ? 'you' : 'HR'}, ${d.size || '1 page'}` : 'Not uploaded yet'}</div></div>
              <${Status} s=${d.status} />
              ${d.status === 'Missing' || d.status === 'Expired' || d.status === 'Expiring soon' ? html`<${Button} size="sm" onClick=${() => setUpload(d.name)}>Upload</${Button}>` : html`<${Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: 'View', icon: 'Eye', onClick: () => PO.toast(`Opened ${d.name}`) }, { label: 'Download', icon: 'Download', onClick: () => PO.fakeDownload(d.name + '.pdf') }, { label: 'Replace', icon: 'RefreshCw', onClick: () => setUpload(d.name) }]} />`}</div>`)}
          </${Card}>
          <${Card} title="Policies" icon="ScrollText" accent="violet" sub=${`${policies.filter((p) => acks[p.name]).length + 1} of ${policies.length} acknowledged`} flush>
            ${policies.map((p, i) => { const ok = acks[p.name] || i === 1; return html`<div class="list-item"><${PO.Chip} icon="ScrollText" accent="violet" /><div class="grow"><b class="w-550">${p.name}</b><div class="faint t-xs">Updated ${PO.date(p.updated, { short: true })}</div></div>${ok ? html`<span class="faint t-sm">Acknowledged</span>` : html`<${Button} size="sm" onClick=${() => { setAcks({ ...acks, [p.name]: true }); PO.toast(`Thanks, ${v.first}. ${p.name} acknowledged.`); }}>Read & acknowledge</${Button}>`}</div>`; })}
          </${Card}>
        </div>
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="Get a letter" icon="Mail" accent="blue" sub="Signed by HR" flush>
            ${LETTERS.map(([n, d, ic]) => html`<button class="list-item clickable" style="width:100%;background:none;border:none;border-bottom:1px solid var(--border);text-align:left;font:inherit;color:inherit" onClick=${() => setLetter(n)}><${PO.Chip} icon=${ic} accent=${['blue', 'green', 'teal', 'violet'][LETTERS.findIndex((x) => x[0] === n) % 4]} /><div class="grow"><b class="w-550">${n}</b><div class="faint t-xs">${d}</div></div><${Icon} n="ChevronRight" size=${15} cls="faint" /></button>`)}
          </${Card}>
          <${Card} title="My IDs" icon="IdCard" accent="violet"><${KV} items=${Object.entries(v.ids).map(([k, x]) => [{ pan: 'PAN', aadhaar: 'Aadhaar', uan: 'UAN (PF)', esic: 'ESIC', ssn: 'SSN', i9: 'Form I-9', w4: 'Form W-4', ni: 'NI number', rtw: 'Right to work', taxCode: 'Tax code' }[k] || k, x])} /></${Card}>
        </div>
      </div>
      <${UploadModal} name=${upload} onClose=${() => setUpload(null)} onDone=${(n) => { setUp({ ...up, [n]: true }); PO.toast(`${n} uploaded. HR will verify it within a day.`, { icon: 'Upload' }); }} />
      ${letter ? html`<${LetterModal} P=${P} v=${v} name=${letter} onClose=${() => setLetter(null)} />` : null}`;
  }

  function UploadModal({ name, onClose, onDone }) {
    const [st, setSt] = useState(0);
    useEffect(() => setSt(0), [name]);
    if (!name) return null;
    return html`<${Modal} open title=${`Upload ${name.toLowerCase()}`} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${st < 2} onClick=${() => { onDone(name); onClose(); }}>Submit</${Button}>`}>
      ${st === 0 ? html`<div class="ss-drop" onClick=${() => setSt(2)}><${Icon} n="Upload" size=${20} cls="faint" /><b>Take a photo or choose a file</b><span class="faint t-sm">PDF, JPG or PNG up to 10 MB. Photos are straightened automatically.</span></div>`
        : st === 1 ? html`<div class="ss-drop"><${Icon} n="ScanLine" size=${22} /><b>Uploading…</b></div>`
          : html`<div class="card inset row" style="padding:12px 14px"><${Icon} n="FileCheck2" size=${16} style="color:var(--green)" /><div class="grow"><b>${name.replace(/ \/.*/, '')}.jpg</b><div class="faint t-xs">1.2 MB, clear, all four corners visible</div></div><${IconButton} icon="X" size="sm" title="Remove" onClick=${() => setSt(0)} /></div>`}
    </${Modal}>`;
  }

  function LetterModal({ P, v, name, onClose }) {
    const C = P.company, hr = P.byId[P.hrId];
    const isTax = /Form 16|W-2|P60|card copy|DBS/.test(name);
    return html`<${Modal} open size="lg" title=${name} onClose=${onClose} footer=${html`<${Button} icon="Mail" onClick=${() => { PO.toast(`${name} emailed to ${v.email}`, { icon: 'Mail' }); onClose(); }}>Email me a copy</${Button}><${Button} kind="primary" icon="Download" onClick=${() => { PO.fakeDownload(name + '.pdf'); onClose(); }}>Download PDF</${Button}>`}>
      ${isTax ? html`<div class="ss-letter"><b>${name}</b><div class="muted mt-4">Issued ${PO.date(P.id === 'in' ? '2026-06-12' : P.id === 'us' ? '2026-01-28' : '2026-05-20')} for ${v.name} (${v.id}). This is the official copy; download it or email yourself a copy.</div></div>` : html`<div class="ss-letter">
        <div class="row"><div><b class="t-md">${C.name}</b><div class="faint t-xs">${C.employerLine || C.city}</div></div><span class="right faint t-xs">${PO.date(PO.TODAY)}</span></div>
        <div style="border-top:1px solid var(--border);margin:12px 0"></div>
        <b>To whom it may concern</b>
        <p>This is to certify that <b>${v.name}</b> (employee ID ${v.id}) has been employed with ${C.name} since <b>${PO.date(v.joinedIso)}</b> as a <b>${v.title}</b>, currently posted at ${PO.site(v.site).name}, ${C.city}. ${v.first} is a ${v.type.toLowerCase()} employee in good standing.</p>
        ${/Salary|income|Pay/i.test(name) ? html`<p>${P.id === 'in' ? html`Their gross monthly salary is <b>${PO.money(v.pay.structure ? v.pay.structure.total : v.pay.gross)}</b> and annual CTC is <b>${PO.money(v.ctc)}</b>.` : P.id === 'us' ? html`Their pay rate is <b>${PO.money(P.roles[v.role].rate || 0, { cents: true })} per hour</b>, averaging ${Math.round(v.pay.work / 2)} hours a week, with annual gross earnings of about <b>${PO.money(v.annualGross)}</b>.` : html`Their gross pay over the last 52 weeks was about <b>${PO.money(v.annualGross)}</b>, paid four-weekly.`}</p>` : null}
        ${/Address/.test(name) ? html`<p>As per our records, their residential address is in ${v.city}, ${C.city === 'Pune' ? 'Maharashtra' : C.city}.</p>` : null}
        <p>This letter is issued at the employee's request${/reference/i.test(name) ? ' and may be verified by contacting HR' : ''}.</p>
        <p class="mt-12">For ${C.name},<br /><b>${hr.name}</b><br /><span class="faint">${hr.title}, ${hr.email}</span></p>
        <div class="faint t-xs mt-12">Verify at verify.${P.vocab.domain}, code ${v.id.replace(/\D/g, '')}-${PO.hueOf(name) % 9000 + 1000}</div>
      </div>`}
    </${Modal}>`;
  }

  /* =====================================================================
     MY EXPENSES
     ===================================================================== */
  function MyExpenses({ query }) {
    const { P, v } = useMine();
    const [added, setAdded] = PO.useCoState('me.exp.' + v.id, []);
    const [open, setOpen] = useState(query.new === '1');
    const rows = [...added, ...P.expenses.filter((e) => e.who === v.id)];
    const sum = (f) => rows.filter(f).reduce((t, e) => t + e.amt, 0);
    const adv = P.advances.find((a) => a.who === v.id);
    const limit = P.id === 'in' ? 2500 : P.id === 'us' ? 120 : 100;
    return html`
      <${PageHeader} title="Expenses" sub=${`${rows.length ? PO.plural(rows.length, 'claim') : 'No claims'} this year. Approved claims are paid with your pay on ${P.company.payBy}.`} actions=${html`<${Button} kind="primary" icon="Plus" onClick=${() => setOpen(true)}>New claim</${Button}>`} />
      ${rows.length ? html`<${PO.KpiStrip} items=${[
        { label: 'Waiting for approval', icon: 'Hourglass', accent: 'amber', value: PO.money(sum((e) => e.status === 'Submitted')), sub: PO.plural(rows.filter((e) => e.status === 'Submitted').length, 'claim') },
        { label: 'Approved, to be paid', icon: 'BadgeCheck', accent: 'green', value: PO.money(sum((e) => e.status === 'Approved')), sub: 'with pay on ' + P.company.payBy },
        { label: 'Paid this year', icon: 'Wallet', accent: 'blue', value: PO.money(sum((e) => e.status === 'Paid')), sub: PO.plural(rows.filter((e) => e.status === 'Paid').length, 'claim') },
        { label: adv ? adv.kind + ' left' : 'Advances', icon: 'HandCoins', accent: 'violet', value: adv ? PO.money(adv.amt - adv.emi * adv.paid) : PO.money(0), sub: adv ? `${adv.inst - adv.paid} instalments of ${PO.money(adv.emi)}` : 'nothing to repay' },
      ]} />` : null}
      <div class=${'grid g-main' + (rows.length ? ' mt-24' : '')} style="align-items:start">
        ${!rows.length ? html`<div class="card" style="padding:8px 0"><${Empty} icon="ReceiptText" title="No claims yet" text=${`Spent your own money on ${P.vocab.expenseCats.slice(0, 2).join(' or ').toLowerCase()} for work? Upload the receipt and get it back with your pay.`} action=${html`<${Button} onClick=${() => setOpen(true)}>Upload a receipt</${Button}>`} />
          <div class="row t-sm muted" style="justify-content:center;gap:24px;padding:0 16px 24px">${['1. Upload the receipt', '2. Your supervisor approves', `3. Paid with your pay on ${P.company.payBy}`].map((t) => html`<span>${t}</span>`)}</div></div>` : html`<${DataTable} rows=${rows} exportName="my-expenses" pageSize=${10} compact empty=${{ title: 'No claims yet', text: `Spent your own money on ${P.vocab.expenseCats.slice(0, 2).join(' or ').toLowerCase()} for work? Upload the receipt and claim it.` }}
          columns=${[
            { key: 'date', label: 'Date', render: (e) => PO.date(e.date, { short: true }) },
            { key: 'cat', label: 'Category', render: (e) => html`<span class="row" style="gap:10px"><${ExpChip} c=${e.cat} /><span><b class="w-550">${e.cat}</b>${e.merchant ? html`<div class="faint t-xs">${e.merchant}</div>` : null}</span></span>` },
            { key: 'amt', label: 'Amount', align: 'r', render: (e) => html`<span class="tnum w-550">${PO.money(e.amt)}</span>`, sort: (e) => e.amt, csv: (e) => e.amt },
            { key: 'receipt', label: 'Receipt', render: (e) => (e.receipt ? html`<span class="muted">Attached</span>` : html`<${Status} s="Missing" />`) },
            { key: 'policy', label: 'Policy', render: (e) => (e.policy === 'Within policy' ? html`<span class="muted">Within policy</span>` : html`<${Status} s=${e.policy} />`) },
            { key: 'status', label: 'Status', render: (e) => html`<${Status} s=${e.status} />` },
          ]} />`}
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="What you can claim" icon="ReceiptText" accent="blue" foot=${html`<span class="faint t-xs">Forward e-receipts to expenses@${P.vocab.domain}</span>`}>${RULES[P.id].map(([c, r]) => html`<div class="ss-line t-sm" style="align-items:center;gap:10px"><${ExpChip} c=${c} /><span>${c}</span><span class="muted" style="font-weight:400">${r}</span></div>`)}</${Card}>
        </div>
      </div>
      <${ClaimDrawer} open=${open} onClose=${() => setOpen(false)} P=${P} v=${v} limit=${limit} onSubmit=${(e) => setAdded([e, ...added])} />`;
  }

  const RULES = {
    in: [['Travel', 'Bus or auto fare, actuals'], ['Fuel', '₹3.5 per km on patrol bike'], ['Site supplies', 'Up to ₹500 without approval'], ['Mobile recharge', '₹199 a month'], ['Food (night duty)', '₹100 per night shift'], ['Training', 'Pre-approved only']],
    us: [['Mileage', '$0.70 per mile (IRS rate)'], ['Supplies', 'Up to $50 without approval'], ['Meals', 'Catering events only'], ['Training', 'Pre-approved only'], ['Uniforms', 'Non-slip shoes, $60 a year'], ['Phone', '$20 a month for leads']],
    uk: [['Mileage', '45p per mile (HMRC rate)'], ['Parking', 'Actuals at client sites'], ['Supplies', 'Up to £30 without approval'], ['Training', 'Pre-approved only'], ['Subsistence', '£7.50 on 10 h+ shifts'], ['Phone', '£10 a month for supervisors']],
  };
  function ClaimDrawer({ open, onClose, P, v, limit, onSubmit }) {
    const [st, setSt] = useState(0);
    const [f, setF] = useState(null);
    useEffect(() => { if (open) { setSt(0); setF(null); } }, [open]);
    const scanned = P.id === 'in' ? { merchant: 'Indian Oil, Hinjewadi Phase 2', cat: 'Fuel', amt: 450, date: PO.addDays(PO.TODAY, -1), note: 'Patrol bike fuel, night round' } : P.id === 'us' ? { merchant: 'H-E-B #482, S Congress', cat: 'Supplies', amt: 23.18, date: PO.addDays(PO.TODAY, -1), note: 'Oat milk run during rush' } : { merchant: 'NCP Manchester Airport', cat: 'Parking', amt: 8.5, date: PO.addDays(PO.TODAY, -1), note: 'Staff car park, night shift' };
    const scan = () => { setF({ ...scanned }); setSt(2); };
    const blank = () => { setF({ merchant: '', cat: P.vocab.expenseCats[0], amt: 0, date: PO.TODAY, note: '' }); setSt(2); };
    return html`<${Drawer} open=${open} onClose=${onClose} title="New expense claim" sub=${'Goes to ' + (PO.person(v.supervisor || v.manager) || P.byId[P.hrId]).name} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" icon="Send" disabled=${!f || !f.amt} onClick=${() => { onSubmit({ id: 'MYEXP-' + Date.now(), who: v.id, cat: f.cat, merchant: f.merchant, amt: +f.amt, date: f.date, status: 'Submitted', receipt: st === 2 && f.merchant !== '', policy: +f.amt > limit ? 'Over limit' : 'Within policy' }); PO.toast(`Claim for ${PO.money(+f.amt)} sent to ${(PO.person(v.supervisor || v.manager) || P.byId[P.hrId]).name}`, { icon: 'Send' }); onClose(); }}>Submit claim</${Button}>`}>
      ${st === 0 ? html`<div class="col" style="gap:12px"><div class="ss-drop" onClick=${scan}><${Icon} n="Upload" size=${20} cls="faint" /><b>Upload a receipt</b><span class="faint t-sm">Photo or PDF. The shop, date and amount are filled in for you.</span></div><${Button} kind="ghost" onClick=${blank}>Enter it by hand instead</${Button}></div>`
        : st === 1 ? html`<div class="ss-drop" style="cursor:default"><${Icon} n="ScanText" size=${24} /><b>Reading your receipt…</b><span class="faint t-sm">Finding the shop, date, amount and tax</span></div>`
          : html`<div class="col" style="gap:12px">
            ${f.merchant ? html`<div class="faint t-sm">Filled in from your receipt. Check the details, then submit.</div>` : null}
            <${Field} label="Shop or vendor"><input class="input" value=${f.merchant} onInput=${(e) => setF({ ...f, merchant: e.target.value })} /></${Field}>
            <div class="grid g-2" style="gap:12px"><${Field} label="Amount"><input class="input tnum" type="number" step="0.01" value=${f.amt} onInput=${(e) => setF({ ...f, amt: e.target.value })} /></${Field}><${Field} label="Date"><input class="input" type="date" value=${f.date} onInput=${(e) => setF({ ...f, date: e.target.value })} /></${Field}></div>
            <${Field} label="Category"><${Select} value=${f.cat} onChange=${(x) => setF({ ...f, cat: x })} options=${P.vocab.expenseCats} /></${Field}>
            <${Field} label="What was it for?"><input class="input" value=${f.note} onInput=${(e) => setF({ ...f, note: e.target.value })} /></${Field}>
            ${+f.amt > limit ? html`<${Callout} tone="amber" icon="TriangleAlert" title="Over the usual limit">Claims over ${PO.money(limit)} need a short note and go to HR as well.</${Callout}>` : html`<div class="faint t-sm">Within policy. Paid with your next pay if approved.</div>`}
          </div>`}
    </${Drawer}>`;
  }

  /* =====================================================================
     MY GOALS
     ===================================================================== */
  function MyGoals() {
    const { P, v } = useMine();
    const { dispatch } = PO.useStore();
    const [prog, setProg] = PO.useCoState('perf.goalProg', {});
    const [reviews, setReviews] = PO.useCoState('perf.reviews', {});
    const [notes, setNotes] = PO.useCoState('me.goalNotes.' + v.id, {});
    const [ans, setAns] = useState(['', '', '']);
    const [self, setSelf] = useState(0);
    const status = (reviews[v.id] || {}).status || v.reviewStatus;
    const submitted = status !== 'Not started';
    const kudos = useMemo(() => (PO.talentKudos ? PO.talentKudos(P) : []), [P.id]);
    const [added] = PO.useCoState('eng.kudos', []);
    const mine = [...added, ...kudos].filter((k) => k.to === v.id);
    const mgr = PO.person(v.manager);
    const QS = ['What went well this period?', 'What do you want to get better at, or try next?', 'What would help you do your job better?'];
    const hint = P.id === 'in' ? ['e.g. Did not miss a single night shift in September', 'e.g. Become a site supervisor', 'e.g. Raincoats issued on time in the monsoon'] : P.id === 'us' ? ['e.g. Trained two new baristas', 'e.g. Learn ordering and inventory', 'e.g. Schedules a week earlier'] : ['e.g. Passed the ward audit', 'e.g. Train as a team leader', 'e.g. Rotas out earlier'];
    return html`
      <${PageHeader} title="Goals & reviews" sub=${`${P.reviewCycle.name}: self review ${submitted ? 'submitted' : 'due ' + PO.date(P.reviewCycle.closes)}. ${v.goals.filter((g) => (prog[v.id + g.t] ?? g.pct) >= 100).length} of ${v.goals.length} goals done.`} actions=${html`<${Menu} align="right" width=${200} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[{ label: 'Self review guide', icon: 'Download', onClick: () => PO.fakeDownload('Self review guide.pdf') }]} />`} />
      <div class="grid g-main" style="align-items:start">
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="My goals" icon="Target" accent="blue" sub=${`${v.goals.filter((g) => (prog[v.id + g.t] ?? g.pct) >= 100).length} of ${v.goals.length} done`}>
            <div class="col" style="gap:16px">${v.goals.map((g) => { const val = prog[v.id + g.t] ?? g.pct; return html`<div><div class="row" style="gap:10px"><${PO.Chip} icon=${val >= 100 ? 'CircleCheck' : 'Target'} accent=${val >= 100 ? 'green' : val >= 60 ? 'blue' : 'amber'} /><b class="w-550 grow">${g.t}</b><${Badge} tone=${val >= 100 ? 'green' : val >= 60 ? 'slate' : 'amber'} dot>${val >= 100 ? 'Done' : val >= 60 ? 'On track' : 'Behind'}</${Badge}></div>
              <div class="row mt-8" style="gap:10px"><input type="range" min="0" max="100" step="5" value=${val} style="flex:1;accent-color:var(--ink)" onChange=${(e) => { setProg({ ...prog, [v.id + g.t]: +e.target.value }); PO.toast('Progress saved. Your supervisor can see it.'); }} /><b class="tnum" style="width:40px;text-align:right">${val}%</b></div>
              <div class="row mt-8" style="gap:8px"><input class="input" style="height:30px" placeholder="Add a quick update" value=${notes[g.t] || ''} onInput=${(e) => setNotes({ ...notes, [g.t]: e.target.value })} /><${Button} size="sm" disabled=${!notes[g.t]} onClick=${() => { PO.toast('Update posted to your goal'); setNotes({ ...notes, [g.t]: '' }); }}>Post</${Button}></div></div>`; })}</div>
          </${Card}>
          <${Card} title="Self review" icon="PenLine" accent="violet" sub=${P.reviewCycle.name} actions=${html`<${Status} s=${status} />`}>
            ${submitted ? html`<div class="ss-state"><${Icon} n="CircleCheck" size=${15} style="flex:none;margin-top:1px;color:var(--green)" /><div><b>Submitted</b>${mgr ? mgr.name : 'Your manager'} writes their review next (by ${P.id === 'us' ? 'Oct 24' : '24 Oct'}). You'll see both after calibration.</div></div>` : html`<div class="col" style="gap:12px">
              ${QS.map((q, i) => html`<${Field} label=${q}><textarea class="textarea" rows="2" style="height:auto;padding:8px 10px" placeholder=${hint[i]} value=${ans[i]} onInput=${(e) => { const a = ans.slice(); a[i] = e.target.value; setAns(a); }}></textarea></${Field}>`)}
              <${Field} label="How would you rate this period?"><div class="row" style="gap:2px">${[1, 2, 3, 4, 5].map((i) => html`<button class=${'ss-star ' + (i <= self ? 'on' : '')} onClick=${() => setSelf(i)} title=${['Tough', 'Okay', 'Good', 'Very good', 'Great'][i - 1]}><${Icon} n="Star" size=${22} style=${i <= self ? 'fill:var(--amber-solid)' : ''} /></button>`)}<span class="muted t-sm" style="margin-left:8px">${self ? ['Tough', 'Okay', 'Good', 'Very good', 'Great'][self - 1] : ''}</span></div></${Field}>
              <div class="row"><span class="faint t-xs">Short answers are fine. Your manager sees this when you submit.</span><${Button} kind="primary" icon="Send" cls="right" disabled=${!ans[0].trim() || !self} onClick=${() => { setReviews({ ...reviews, [v.id]: { ...(reviews[v.id] || {}), status: 'Self review done' } }); PO.toast(`Self review sent to ${mgr ? mgr.name : 'your manager'}`, { icon: 'Send' }); }}>Submit self review</${Button}></div></div>`}
          </${Card}>
        </div>
        <div class="col" style="gap:16px;min-width:0">
          <${Card} title="Feedback for you" icon="Heart" accent="rose" sub=${PO.plural(mine.length + 1, 'note')} flush>
            ${mine.map((k) => html`<div class="list-item" style="align-items:flex-start"><${Avatar} p=${PO.person(k.from)} size="sm" /><div class="grow"><div class="t-sm"><b class="w-550">${PO.person(k.from).name}</b> <span class="faint">${PO.rel(k.at)}</span></div><div class="mt-4">${k.text}</div><div class="faint t-xs mt-4">${k.value}</div></div></div>`)}
            ${mgr ? html`<div class="list-item" style="align-items:flex-start"><${Avatar} p=${mgr} size="sm" /><div class="grow"><div class="t-sm"><b class="w-550">${mgr.name}</b> <span class="faint">last review</span></div><div class="mt-4">${v.rating >= 4 ? 'Dependable on every shift and good with the client. Next step: help train new joiners.' : 'Solid work. Let’s focus on being on time at shift start.'}</div></div></div>` : null}
          </${Card}>
          <${Card} title="Next 1:1" icon="MessagesSquare" accent="teal">${mgr ? html`<div class="row"><${Who} p=${mgr} size="sm" sub=${`${PO.date(PO.addDays(PO.TODAY, 3), { weekday: true, short: true })}, ${P.hhmm(PO.shiftOf(v.shift).to)} at shift handover`} /></div><div class="col mt-12" style="gap:6px"><span class="ss-cap">Agenda</span>${['How the night rotation is going', 'Training for the next role', 'Anything blocking you'].map((t) => html`<div class="t-sm muted">${t}</div>`)}</div>` : html`<span class="muted">No 1:1 scheduled.</span>`}</${Card}>
          <${Card} title="My training" icon="GraduationCap" accent="green" actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => PO.toast('Course opened. It works in any browser, on a phone or a computer.')}>Continue</${Button}>`}>${myCourses(P, v).map((e) => html`<div class="row" style="padding:6px 0;gap:10px"><span class="grow t-sm ellipsis">${e.title}</span><span style="width:130px;flex:none"><${Progress} value=${e.pct} tone=${e.pct === 100 ? 'green' : ''} label=${e.pct + '%'} /></span></div>`)}</${Card}>
        </div>
      </div>`;
  }

  function myCourses(P, v) {
    const L = PO.talentLearning;
    if (!L) return [];
    const C = L.courses(P);
    return L.enrolments(P).filter((e) => e.p === v.id).map((e) => ({ ...e, title: C.find((c) => c.key === e.c).title }));
  }
  PO.route('me', Me, { title: 'Home' });
  PO.route('my-pay', MyPay, { title: 'Payslips' });
  PO.route('my-leave', MyLeave, { title: 'Leave' });
  PO.route('my-time', MyTime, { title: 'Attendance' });
  PO.route('my-docs', MyDocs, { title: 'Documents' });
  PO.route('my-expenses', MyExpenses, { title: 'Expenses' });
  PO.route('my-goals', MyGoals, { title: 'Goals & reviews' });
})();
