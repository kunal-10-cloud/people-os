/* People OS: employee directory, add-employee wizard and the full employee profile.
   Also defines PO.PX, a small set of people helpers shared by org.js, lifecycle.js and documents.js. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect } = PO;
  const { Icon, Avatar, Who, Badge, Status, Button, IconButton, Menu, Tabs, Segmented, Switch, PageHeader, Card, Stat, Empty, Callout, Progress, KV, Timeline, Steps, Field, Drawer, Modal, DataTable, MonthCal } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .ppl-pf { display:flex; flex-basis:100%; justify-content:center; align-items:center; gap:4px; max-width:100%; color:var(--text-2); min-width:0; }
  .pcard-foot .ppl-pf-st { flex-basis:100%; display:flex; justify-content:center; }
  .ppl-av-peek { display:inline-flex; margin-left:6px; } .ppl-av-peek .av-stack .av { box-shadow:0 0 0 2px var(--surface-2, var(--surface)); }
  .ppl-top { background:var(--surface); border:1px solid var(--border); border-radius:12px; margin-bottom:24px; }
  .ppl-top .phero { border:none; margin:0; border-radius:12px 12px 0 0; overflow:visible; }
  .ppl-top .phero-cover { border-radius:12px 12px 0 0; }
  .ppl-top .ppl-meta { margin:0; font-size:13.5px; }
  .ppl-hero { display:flex; gap:16px; align-items:center; padding:16px 20px; }
  .ppl-hero h1 { font-size:20px; letter-spacing:-0.015em; font-weight:650; }
  .ppl-meta { color:var(--text-2); margin-top:4px; font-size:13px; line-height:1.5; }
  .ppl-meta a { color:var(--text); text-decoration:underline; text-decoration-color:var(--border-strong); text-underline-offset:2px; }
  .ppl-meta a:hover { color:var(--brand-text); }
  .ppl-facts { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); border-top:1px solid var(--border); }
  .ppl-facts > div { padding:12px 20px; border-right:1px solid var(--border); min-width:0; }
  .ppl-facts > div:last-child { border-right:none; }
  .ppl-facts small { display:block; color:var(--text-3); font-size:11.5px; font-weight:500; }
  .ppl-facts b { display:block; font-family:var(--num); font-size:19px; font-weight:600; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ppl-facts span { color:var(--text-3); font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
  .ppl-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:12px; }
  .ppl-pcard { padding:16px; display:flex; flex-direction:column; gap:10px; cursor:pointer; transition:border-color .12s, box-shadow .12s; }
  .ppl-pcard:hover { border-color:var(--border-strong); }
  .ppl-pcard .ppl-line { display:flex; align-items:center; gap:7px; color:var(--text-2); font-size:12px; min-width:0; }
  .ppl-pcard .ppl-line span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ppl-shift { display:inline-flex; align-items:center; gap:5px; font-size:12px; color:var(--text-2); white-space:nowrap; }
  .ppl-shift i { width:18px; height:18px; border-radius:4px; display:inline-grid; place-items:center; font-style:normal; font-weight:600; font-size:11px; font-family:var(--num); border:1px solid var(--border-strong); color:var(--text-2); }
  .ppl-chips { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .ppl-views .seg button span.faint { margin-left:5px; font-family:var(--num); }
  .ppl-up { display:grid; grid-template-columns:72px minmax(0,1fr) auto; gap:10px; align-items:center; padding:7px 0; border-bottom:1px solid var(--border); font-size:12.5px; }
  .ppl-up:last-child { border-bottom:none; }
  .ppl-chips .filter-chip b { font-weight:600; color:var(--text-3); }
  .ppl-chips .filter-chip.on b { color:var(--brand-text); }
  .ppl-opt { border:1px solid var(--border); border-radius:var(--r-lg); padding:10px 12px; display:flex; gap:10px; align-items:center; cursor:pointer; background:var(--surface); text-align:left; width:100%; }
  .ppl-opt:hover { border-color:var(--border-strong); }
  .ppl-opt.on { border-color:var(--brand); background:var(--brand-soft); box-shadow:0 0 0 1px var(--brand) inset; }
  .ppl-split { width:100%; border-collapse:collapse; }
  .ppl-split td { padding:7px 0; border-bottom:1px solid var(--border); }
  .ppl-split tr:last-child td { border-bottom:none; }
  .ppl-split td.r { text-align:right; font-variant-numeric:tabular-nums; font-weight:550; }
  .ppl-split tr.tot td { border-top:1px solid var(--border-strong); border-bottom:none; font-weight:650; padding-top:9px; }
  .ppl-bal { padding:14px 16px; display:flex; flex-direction:column; gap:8px; }
  .ppl-bal .big { font-family:var(--num); font-size:26px; font-weight:650; letter-spacing:-0.02em; font-variant-numeric:tabular-nums; }
  .ppl-doc { display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid var(--border); }
  .ppl-doc:last-child { border-bottom:none; }
  .ppl-file { width:34px; height:40px; border-radius:6px; border:1px solid var(--border); background:var(--surface-2); display:grid; place-items:center; color:var(--text-3); flex:none; font-size:9px; font-weight:700; letter-spacing:.04em; }
  .ppl-legend { display:flex; gap:12px; flex-wrap:wrap; font-size:12px; color:var(--text-2); }
  .ppl-legend span { display:inline-flex; gap:6px; align-items:center; }
  .ppl-legend i { width:10px; height:10px; border-radius:3px; display:inline-block; }
  .ppl-reveal { font-variant-numeric:tabular-nums; letter-spacing:.02em; }
  .ppl-rl { display:flex; flex-direction:column; align-items:flex-start; gap:0; }
  .ppl-rl .ppl-rl-n { display:flex; align-items:center; gap:10px; padding:8px 10px; border:1px solid var(--border); border-radius:var(--r); background:var(--surface); width:100%; }
  .ppl-rl .ppl-rl-v { width:1px; height:14px; background:var(--border-strong); margin-left:24px; }
  .ppl-rl .ppl-rl-n.me { border-color:var(--border-strong); background:var(--surface-2); }
  .ppl-bubble { background:var(--surface); border-radius:10px; padding:12px 14px; color:var(--text); font-size:12.5px; line-height:1.55; white-space:pre-wrap; border:1px solid var(--border); }
  .ppl-star { color:var(--amber-solid); fill:var(--amber-solid); }
  .ppl-star.off { color:var(--border-strong); fill:var(--surface-3); }
  .ppl-sum { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:0; border:1px solid var(--border); border-radius:var(--r-lg); overflow:hidden; }
  .ppl-sum > div { padding:10px 12px; border-right:1px solid var(--border); background:var(--surface-2); }
  .ppl-sum > div:last-child { border-right:none; }
  .ppl-sum small { color:var(--text-3); font-size:11.5px; display:block; } .ppl-sum b { font-size:17px; font-weight:650; font-variant-numeric:tabular-nums; }
  @media (max-width:1180px) { .ppl-facts { grid-template-columns:repeat(3,minmax(0,1fr)); } .ppl-sum { grid-template-columns:repeat(3,minmax(0,1fr)); } }
  </style>`);

  /* =====================================================================
     Shared people helpers (PO.PX) — used by org.js, lifecycle.js, documents.js
     ===================================================================== */
  const PX = (PO.PX = PO.PX || {});
  const addDays = (s, n) => PO.addDays(s, n);
  const TODAY = PO.TODAY;
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  /** Everyone below a manager, recursively. */
  PX.teamIds = (P, root) => { const out = []; const walk = (id, d) => { if (d > 8) return; (P.byManager[id] || []).forEach((c) => { out.push(c); walk(c, d + 1); }); }; walk(root, 0); return out; };
  /** Chain of managers from a person up to the top. */
  PX.chain = (P, id) => { const out = []; let cur = typeof id === 'string' ? P.byId[id] : id; let guard = 0; while (cur && cur.manager && guard++ < 10) { cur = P.byId[cur.manager]; if (cur) out.unshift(cur); } return out; };
  /** "Sep 24" or "18 Sep" → "2026-09-24". */
  PX.parseDay = (t) => { if (!t) return null; const m = String(t).match(/(\d{1,2})\s+([A-Za-z]{3})|([A-Za-z]{3})\s+(\d{1,2})/); if (!m) return null; const day = +(m[1] || m[4]); const mon = MONTHS[(m[2] || m[3]).toLowerCase()]; return `2026-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; };
  PX.dow = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay();
  PX.daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5);
  /** Add n working days (skips Sundays and public holidays; Saturdays also skipped outside India). */
  PX.addWorkingDays = (P, iso, n) => { const hol = new Set(P.holidays.map((h) => h.date)); let d = iso, k = 0; while (k < n) { d = addDays(d, 1); const w = PX.dow(d); if (w === 0 || (P.id !== 'in' && w === 6) || hol.has(d)) continue; k++; } return d; };
  PX.unitLabel = (P) => (P.id === 'us' ? 'PTO' : P.id === 'uk' ? 'Holiday' : 'Leave');
  PX.mainLeave = (P) => (P.id === 'in' ? 'el' : P.id === 'us' ? 'pto' : 'hol');
  PX.fmtLeave = (P, key, v) => { const t = PO.leaveType(key); return v == null ? '—' : `${PO.num(v, v % 1 ? 1 : 0)} ${t && t.unit === 'hours' ? 'h' : v === 1 ? 'day' : 'days'}`; };
  PX.managers = (P) => P.people.filter((p) => p.role === 'sup' || p.role === 'lead' || p.role === 'office' || p.inCharge || (P.byManager[p.id] || []).length);

  /** Merge a person's documents with any status changes made in the UI. */
  PX.docsOf = (p, st = {}) => (p.docs || []).map((d) => (st[p.id + '|' + d.name] ? { ...d, ...st[p.id + '|' + d.name] } : d));
  PX.docGap = (d) => d.status === 'Missing' || d.status === 'Expired' || d.status === 'Requested' || d.status === 'Not started';

  /** Asset register merged with UI changes and additions. */
  PX.assets = (P, st = {}, added = []) => [...P.assets, ...added].map((a) => (st[a.tag] ? { ...a, ...st[a.tag] } : a));

  /** Person-like record for someone added through the wizard. */
  PX.fromAdded = (P, a) => {
    const site = PO.site(a.site) || P.sites[0];
    const role = P.roles[a.role] || {};
    return {
      ...a, added: true, name: `${a.first} ${a.last}`, title: role.title || a.role, dept: P.vocab.dept[a.role] || 'Operations', grade: P.vocab.grade[a.role] || '—',
      status: a.status || 'Pre-boarding', joinedIso: a.start, joined: PO.date(a.start), tenureMonths: 0, hue: PO.hueOf(a.first + a.last), initials: PO.initials(`${a.first} ${a.last}`),
      email: `${a.first}.${a.last}`.toLowerCase().replace(/[^a-z.]/g, '') + '@' + P.vocab.domain, post: a.post || 'To be assigned', site: site.id,
      docs: P.vocab.docTypes.map((name) => ({ name, status: a.docs && a.docs.includes(name) ? 'Requested' : 'Not started', uploaded: null, by: null, size: '—' })),
      leave: {}, goals: [], ids: {}, bank: { name: '—', acct: '—', status: 'missing' }, emergency: null, rating: null, reviewStatus: 'Not started', pay: null, u: {},
    };
  };
  /** All people as the UI should see them: seeded + added, with edits applied. */
  PX.people = (P, added = [], edits = {}) => [...P.people, ...added.map((a) => PX.fromAdded(P, a))].map((p) => (edits[p.id] ? { ...p, ...edits[p.id] } : p));
  PX.find = (P, id, added = [], edits = {}) => { const base = P.byId[id] || (added.find((a) => a.id === id) ? PX.fromAdded(P, added.find((a) => a.id === id)) : null); return base && edits[id] ? { ...base, ...edits[id] } : base; };
  PX.nextId = (P, added = []) => {
    const ids = [...P.people.map((p) => p.id), ...added.map((a) => a.id)];
    const prefix = P.id === 'us' ? 'CC-' : P.id === 'uk' ? 'HF-' : 'EMP-';
    const nums = ids.filter((x) => x.startsWith(prefix)).map((x) => +x.slice(prefix.length)).filter((n) => !isNaN(n));
    const n = Math.max(...nums) + 1;
    return prefix + (P.id === 'in' ? String(n).padStart(4, '0') : n);
  };

  /** An exit case's person: the real employee when they are on file, otherwise a deterministic former-employee record. */
  PX.exitPerson = (P, e) => {
    if (e.who && P.byId[e.who]) return P.byId[e.who];
    const real = P.people.find((p) => p.name === e.name);
    if (real) return real;
    const i = P.exits.findIndex((x) => x.id === e.id);
    const r = PO.seeded('exitp' + P.id + e.id);
    const roleKey = P.id === 'in' ? ['guard', 'guard', 'hk'][i % 3] : P.id === 'uk' ? ['cleaner', 'cleaner'][i % 2] : 'barista';
    const tenure = P.id === 'in' ? [26, 74, 14][i % 3] : P.id === 'uk' ? [19, 41][i % 2] : 20;
    const joinedIso = addDays(e.lastDay, -Math.round(tenure * 30.44));
    const [first, ...rest] = e.name.split(' ');
    const site = e.site;
    const lead = PO.site(site) && PO.site(site).lead;
    return {
      id: P.id === 'in' ? `EMP-0${118 + i * 3}` : P.id === 'uk' ? `HF-22${60 + i}` : `CC-10${80 + i}`,
      name: e.name, first, last: rest.join(' '), role: roleKey, title: P.roles[roleKey].title, site, dept: P.vocab.dept[roleKey], shift: r.pick(['A', 'B', 'C']),
      joinedIso, tenureMonths: tenure, hue: PO.hueOf(e.name), initials: PO.initials(e.name), manager: lead || P.topId, former: true,
      phone: P.vocab.phone(r), type: P.id === 'in' && i === 0 ? 'Contract' : 'Full-time',
    };
  };
  /** Assets an exiting person must hand back (register entries for real people, issue log for former staff). */
  PX.exitAssets = (P, e) => {
    const p = PX.exitPerson(P, e);
    if (!p.former) return P.assets.filter((a) => a.who === p.id);
    const r = PO.seeded('exa' + P.id + e.id);
    const names = P.vocab.assetTypes[p.role] || ['ID card'];
    return names.map((name, k) => ({ tag: `AST-${880 + P.exits.findIndex((x) => x.id === e.id) * 6 + k}`, name, who: p.id, whoName: p.name, issued: addDays(p.joinedIso, r.int(0, 3)), cond: r.chance(0.2) ? 'Fair' : 'Good', value: /phone|Walkie|Laptop|iPad|MacBook/i.test(name) ? r.int(8, 30) * (P.id === 'in' ? 500 : 20) : r.int(3, 18) * (P.id === 'in' ? 100 : 5), former: true }));
  };

  /* ---------- attendance: a month view consistent with p.u and the pay period ---------- */
  PX.period = (P) => (P.id === 'in' ? ['2026-09-01', '2026-09-30'] : P.id === 'us' ? ['2026-09-21', '2026-10-04'] : ['2026-09-07', '2026-10-04']);
  PX.attendance = (P, p) => {
    const r = PO.seeded('att' + P.id + p.id);
    const [ps, pe] = PX.period(P);
    const hol = new Map(P.holidays.map((h) => [h.date, h.name]));
    const u = p.u || {};
    const salaried = P.id === 'us' ? u.reg == null : P.id === 'uk' ? u.hours == null : p.role === 'office';
    const offs = salaried ? [0, 6] : P.id === 'in' ? [r.pick([0, 0, 0, 1, 2, 3, 4, 5, 6])] : (() => { const a = r.int(0, 6); return [a, (a + r.pick([1, 3])) % 7]; })();
    const start = p.joinedIso > '2026-09-01' ? p.joinedIso : '2026-09-01';
    const day = {};
    const all = []; for (let d = '2026-09-01'; d <= TODAY; d = addDays(d, 1)) all.push(d);
    const approved = P.leaveRequests.filter((l) => l.who === p.id && l.status === 'Approved');
    const leaveOn = {}; approved.forEach((l) => { for (let d = l.from; d <= l.to; d = addDays(d, 1)) leaveOn[d] = l.type; });
    const inPeriod = all.filter((d) => d >= ps && d <= pe && d >= start);
    // 1. period: hit the units exactly
    if (!salaried) {
      const slots = inPeriod.slice();
      let leaveDays = 0, absent = 0, work = null;
      if (P.id === 'in') { absent = p.joiner ? 0 : Math.max(0, (u.days || 30) - (u.paid || 30)); }
      else if (P.id === 'us') { work = Math.round((u.reg || 0) / 8); leaveDays = Math.round((u.pto || 0) / 8); }
      else { work = Math.round((u.hours || 0) / 8); leaveDays = Math.round((u.hol || 0) / 8); }
      const mainKey = P.id === 'us' ? 'pto' : P.id === 'uk' ? 'hol' : null;
      // leave first, on real request dates where possible
      let free = slots.filter((d) => !hol.has(d));
      if (P.id === 'in') free.filter((d) => leaveOn[d]).forEach((d) => { day[d] = { s: 'L', type: leaveOn[d] }; });
      else {
        const onReq = free.filter((d) => leaveOn[d]).slice(0, leaveDays);
        onReq.forEach((d) => (day[d] = { s: 'L', type: leaveOn[d] }));
        r.shuffle(free.filter((d) => !day[d] && !offs.includes(PX.dow(d)))).slice(0, leaveDays - onReq.length).forEach((d) => (day[d] = { s: 'L', type: mainKey }));
      }
      slots.filter((d) => hol.has(d)).forEach((d) => (day[d] = { s: 'H', name: hol.get(d) }));
      free = slots.filter((d) => !day[d]);
      if (work == null) {
        free.filter((d) => offs.includes(PX.dow(d))).forEach((d) => (day[d] = { s: 'WO' }));
        const rest = r.shuffle(slots.filter((d) => !day[d]));
        rest.slice(0, absent).forEach((d) => (day[d] = { s: 'A' }));
        slots.filter((d) => !day[d]).forEach((d) => (day[d] = { s: 'P' }));
      } else {
        const ordered = [...free.filter((d) => !offs.includes(PX.dow(d))), ...r.shuffle(free.filter((d) => offs.includes(PX.dow(d))))];
        ordered.forEach((d, i) => (day[d] = { s: i < work ? 'P' : 'WO' }));
      }
    } else inPeriod.forEach((d) => (day[d] = hol.has(d) ? { s: 'H', name: hol.get(d) } : offs.includes(PX.dow(d)) ? { s: 'WO' } : leaveOn[d] ? { s: 'L', type: leaveOn[d] } : { s: 'P' }));
    // 2. outside the period: usual pattern
    all.filter((d) => d >= start && !day[d]).forEach((d) => (day[d] = hol.has(d) ? { s: 'H', name: hol.get(d) } : offs.includes(PX.dow(d)) ? { s: 'WO' } : leaveOn[d] ? { s: 'L', type: leaveOn[d] } : { s: 'P' }));
    // 3. today and the missed punch
    if (day[TODAY] && day[TODAY].s === 'P') {
      const sh = PO.shiftOf(p.shift);
      if (P.absent.has(p.id)) day[TODAY] = { s: 'A', today: true };
      else if (P.lateMap[p.id]) day[TODAY] = { s: 'P', late: P.lateMap[p.id] };
      else if (sh && p.shift !== P.current && sh.from > P.company.nowMin) day[TODAY] = { s: 'S', at: sh.from };
    }
    const missed = PX.parseDay(p.missed);
    if (missed && day[missed]) day[missed] = { s: 'P', missed: true };
    // 4. overtime spread over worked period days
    let ot = u.ot || 0;
    const worked = inPeriod.filter((d) => day[d] && day[d].s === 'P');
    if (ot && worked.length) { const picks = r.shuffle(worked); let i = 0; while (ot > 0 && i < 200) { const d = picks[i % picks.length]; const h = Math.min(ot, P.id === 'in' ? r.pick([2, 4, 4]) : r.pick([1, 2, 2, 3])); day[d].ot = (day[d].ot || 0) + h; ot -= h; i++; } }
    const cnt = (f) => inPeriod.filter((d) => day[d] && f(day[d])).length;
    const summary = { present: cnt((x) => x.s === 'P'), absent: cnt((x) => x.s === 'A'), leave: cnt((x) => x.s === 'L'), off: cnt((x) => x.s === 'WO'), hol: cnt((x) => x.s === 'H'), ot: u.ot || 0, missed: missed && missed >= ps && missed <= pe ? 1 : 0 };
    summary.rate = summary.present + summary.absent ? summary.present / (summary.present + summary.absent) : 1;
    return { day, summary, offs, period: [ps, pe], salaried };
  };
  PX.calEvents = (P, att) => {
    const ev = {};
    Object.entries(att.day).forEach(([d, x]) => {
      const list = [];
      if (x.s === 'P') list.push(x.missed ? { label: 'Missed punch', tone: 'amber' } : x.late ? { label: `Late ${x.late} min`, tone: 'amber' } : { label: d === TODAY ? 'Clocked in' : 'Present', tone: 'green' });
      if (x.s === 'S') list.push({ label: `Shift ${P.hhmm(x.at)}`, tone: '' });
      if (x.s === 'A') list.push({ label: P.id === 'in' ? 'Absent, LOP' : 'Absent', tone: 'rose' });
      if (x.s === 'L') { const t = PO.leaveType(x.type); list.push({ label: `${t ? t.short : 'Leave'}${P.id === 'in' ? ' leave' : ''}`, tone: '' }); }
      if (x.s === 'WO') list.push({ label: 'Week off', tone: 'slate' });
      if (x.s === 'H') list.push({ label: x.name, tone: 'amber' });
      if (x.ot) list.push({ label: `OT +${x.ot} h`, tone: 'brand' });
      ev[d] = list;
    });
    return ev;
  };

  /* ---------- activity feed for a person ---------- */
  PX.activity = (P, p) => {
    const items = [];
    const push = (date, icon, tone, title, sub) => date && items.push({ date, icon, tone, title, sub });
    const C = P.company;
    push(p.joinedIso, 'UserPlus', 'brand', `Joined ${C.short} as ${p.title}`, `${PO.site(p.site) ? PO.site(p.site).name : ''}, added by ${P.byId[P.hrId].name}`);
    if (p.tenureMonths >= 6 && !p.added) push(addDays(p.joinedIso, 182), 'BadgeCheck', 'green', 'Probation confirmed', `Confirmed by ${p.manager && P.byId[p.manager] ? P.byId[p.manager].name : P.byId[P.topId].name}`);
    (p.docs || []).filter((d) => d.uploaded).forEach((d) => push(d.uploaded, 'FileCheck2', d.status === 'Verified' ? 'green' : 'amber', `${d.name} ${d.status === 'Verified' ? 'verified' : 'uploaded'}`, `Uploaded by ${d.by === 'HR' ? P.byId[P.hrId].name : p.first}, ${d.size}`));
    P.assets.filter((a) => a.who === p.id && a.issued).forEach((a) => push(a.issued, 'Package', '', `${a.name} issued`, `${a.tag}, condition ${a.cond.toLowerCase()}`));
    P.leaveRequests.filter((l) => l.who === p.id).slice(0, 8).forEach((l) => { const t = PO.leaveType(l.type); push(l.applied, 'Palmtree', l.status === 'Approved' ? 'green' : l.status === 'Rejected' ? 'red' : 'amber', `${t ? t.name : 'Leave'} ${l.status === 'Pending' ? 'requested' : l.status.toLowerCase()}`, `${PO.date(l.from, { short: true })}${l.days > 1 ? ' – ' + PO.date(l.to, { short: true }) : ''}, via ${l.channel}${l.status !== 'Pending' && P.byId[l.approver] ? ', by ' + P.byId[l.approver].name : ''}`); });
    P.audit.filter((a) => a.target === p.name).forEach((a) => push(a.at.slice(0, 10), 'History', '', `${a.actor} ${a.action} ${p.first}`, `${a.at.slice(11)} via ${a.via}, from ${a.ip}`));
    (P.tickets || []).filter((t) => t.who === p.id).forEach((t) => push(t.opened, 'LifeBuoy', 'blue', `Raised “${t.subject}”`, `${t.id} via ${t.channel}, ${t.status.toLowerCase()}`));
    (P.expenses || []).filter((x) => x.who === p.id).forEach((x) => push(x.date, 'Receipt', '', `${x.cat} expense ${PO.money(x.amt)}`, `${x.id}, ${x.status.toLowerCase()}`));
    const mp = PX.parseDay(p.missed); if (mp) push(mp, 'Clock', 'amber', 'Missed punch flagged', 'No clock-out recorded. Waiting for supervisor to regularise.');
    if (p.pay && !p.added) push(P.id === 'in' ? '2026-09-07' : P.id === 'us' ? '2026-09-25' : '2026-09-04', 'ReceiptText', 'green', `Payslip for ${P.payHistory[P.payHistory.length - 2].label} published`, 'Viewed in the employee portal');
    if (!p.added && p.reviewStatus !== 'Not started') push('2026-10-03', 'Target', 'brand', `${p.reviewStatus === 'Manager review' ? 'Self review submitted' : 'Self review submitted'} for ${P.reviewCycle.name}`, p.reviewStatus);
    if (p.added) push(TODAY, 'Send', 'green', 'Welcome email and SMS sent', `Employee portal invite and document upload link to ${p.phone || 'mobile'}`);
    return items.filter((x) => x.date <= TODAY).sort((a, b) => b.date.localeCompare(a.date));
  };

  /* ---------- message composer (profile, bulk actions, lifecycle) ---------- */
  PX.MessageModal = function MessageModal({ open, onClose, people = [], preset }) {
    const P = PO.P();
    const ch = 'SMS';
    const first = people[0];
    const tpl = {
      shift: `Hi {first}, reminder: your shift tomorrow is ${PO.shiftOf(first ? first.shift : 'A')?.time || ''} at {site}. See your full roster in the employee portal.`,
      docs: `Hi {first}, please upload your pending documents in the ${P.company.short} employee portal: My documents. It takes 2 minutes.`,
      slip: `Hi {first}, your payslip for ${P.payHistory[P.payHistory.length - 2].label} is ready. View or download it in the employee portal under My pay.`,
      custom: '',
    };
    const [k, setK] = useState(preset || 'shift');
    const [text, setText] = useState(tpl[preset || 'shift']);
    const [via, setVia] = useState(ch);
    if (!open) return null;
    const sample = (first ? text.replace(/\{first\}/g, first.first).replace(/\{site\}/g, PO.site(first.site) ? PO.site(first.site).name : '') : text);
    return html`<${Modal} open title=${people.length === 1 ? `Message ${first.name}` : `Message ${PO.plural(people.length, 'person', 'people')}`} icon="MessageCircle" onClose=${onClose} size="lg" footer=${html`<span class="faint t-sm" style="margin-right:auto">${via !== 'Email' ? `Sent from ${P.msg.name}. One-way; delivery receipts appear in Activity.` : 'Sent from hr@' + P.vocab.domain}</span><${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" icon="Send" disabled=${!text.trim()} onClick=${() => { onClose(); PO.toast(`Sent to ${people.length === 1 ? first.first : PO.plural(people.length, 'person', 'people')} by ${via === 'WhatsApp' ? 'WhatsApp message' : via}`, { icon: 'Send' }); }}>Send</${Button}>`}>
      <div class="grid g-2" style="gap:16px">
        <div class="col gap-12">
          <${Field} label="Channel"><${Segmented} options=${[['SMS', 'SMS'], ['Email', 'Email'], ['WhatsApp', 'WhatsApp message']]} value=${via} onChange=${setVia} /></${Field}>
          <${Field} label="Template"><${PO.Select} value=${k} onChange=${(v) => { setK(v); setText(tpl[v]); }} options=${[['shift', 'Shift reminder'], ['docs', 'Document request'], ['slip', 'Payslip ready'], ['custom', 'Write your own']]} /></${Field}>
          <${Field} label="Message" hint="{first} and {site} are filled in for each person."><textarea class="textarea" style="height:120px;padding:8px 10px" value=${text} onInput=${(e) => setText(e.target.value)}></textarea></${Field}>
          ${people.length > 1 ? html`<div class="row t-sm muted"><${PO.AvatarStack} ids=${people.filter((p) => P.byId[p.id]).map((p) => p.id)} max=${6} /><span>${people.slice(0, 2).map((p) => p.first).join(', ')}${people.length > 2 ? ` and ${people.length - 2} more` : ''}</span></div>` : null}
        </div>
        <div class="col"><span class="t-sm w-500 muted">${via === 'Email' ? 'Email' : via === 'WhatsApp' ? 'WhatsApp message' : 'SMS'} preview${first ? ` for ${first.first}` : ''}</span>
          <div class="card" style="padding:14px;background:var(--surface-2)"><div class="ppl-bubble">${sample || 'Write a message to see the preview.'}</div><div class="faint t-xs mt-8">${P.msg.name}, ${P.hhmm(P.company.nowMin)}</div></div>
        </div>
      </div>
    </${Modal}>`;
  };

  /* small shared bits */
  const ShiftChip = ({ k }) => { const s = PO.shiftOf(k); return s ? html`<span class="ppl-shift" title=${s.time}><i class=${k}>${k}</i>${s.label}</span>` : null; };
  PX.ShiftChip = ShiftChip;
  const Stars = ({ n }) => html`<span class="row gap-4" title=${`${n} of 5`}>${[1, 2, 3, 4, 5].map((i) => html`<${Icon} n="Star" size=${14} cls=${'ppl-star ' + (i <= n ? '' : 'off')} />`)}</span>`;
  const siteName = (id) => (PO.site(id) ? PO.site(id).name : '—');
  const nameCache = {};

  /* =====================================================================
     Directory
     ===================================================================== */
  function useScope() {
    const { state } = PO.useStore();
    const P = PO.P();
    const v = PO.viewer();
    return useMemo(() => (state.role === 'manager' ? new Set(PX.teamIds(P, v.id)) : null), [P.id, state.role, v.id]);
  }

  function Directory({ query }) {
    const P = PO.P();
    const IN = PO.isIN();
    const v = PO.viewer();
    const scope = useScope();
    const [added] = PO.useCoState('people.added', []);
    const [edits, setEdits] = PO.useCoState('people.edits', {});
    const [docSt] = PO.useCoState('docs.state', {});
    const [view, setView] = PO.useCoState('people.view', 'table');
    const [saved, setSaved] = useState(query.view || 'all');
    const [siteF, setSiteF] = useState(query.site || '');
    const [wizard, setWizard] = useState(query.new === '1');
    const [bulk, setBulk] = useState(null);
    const [msg, setMsg] = useState(null);
    useEffect(() => { if (query.new === '1') setWizard(true); }, [query.new]);
    useEffect(() => { if (query.layout === 'cards' || query.layout === 'table') setView(query.layout); }, [query.layout]);

    added.forEach((a) => (nameCache[a.id] = `${a.first} ${a.last}`));
    const all = useMemo(() => PX.people(P, added, edits).filter((p) => !scope || scope.has(p.id) || (p.added && p.manager === v.id)), [P.id, added, edits, scope]);
    const VIEWS = useMemo(() => [
      ['all', 'All', () => true, 'Users'],
      ['new', 'New joiners', (p) => p.added || p.tenureMonths < 3, 'UserPlus'],
      IN ? ['contract', 'Contract workers', (p) => p.type === 'Contract', 'HardHat'] : ['contract', 'Part-time', (p) => p.type === 'Part-time', 'Clock4'],
      ['probation', 'On probation', (p) => p.status === 'Probation' || p.status === 'Pre-boarding', 'Hourglass'],
      ['missing', 'Missing documents', (p) => PX.docsOf(p, docSt).some(PX.docGap), 'FileWarning'],
      ['night', 'Night shift', (p) => p.shift === 'C', 'Moon'],
    ], [P.id, docSt]);
    const viewFn = (VIEWS.find((x) => x[0] === saved) || VIEWS[0])[2];
    const rows = useMemo(() => all.filter((p) => viewFn(p) && (!siteF || p.site === siteF)), [all, saved, siteF, docSt]);

    const active = all.filter((p) => p.status !== 'Inactive' && !p.added);
    const joiners = all.filter((p) => p.added || p.joinedIso >= addDays(TODAY, -30));
    const exitsN = P.exits.length + (PO.coGet(PO.useStore().state, 'offboarding.added', []).length);
    const contract = IN ? all.filter((p) => p.type === 'Contract').length : all.filter((p) => p.type === 'Part-time').length;
    const avgTen = active.length ? active.reduce((t, p) => t + p.tenureMonths, 0) / active.length : 0;
    const hc = P.payHistory.map((h) => h.heads);

    const columns = [
      { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} sub=${p.title} />`, sort: (p) => p.name, csv: (p) => p.name, width: 230 },
      { key: 'id', label: 'ID', render: (p) => html`<span class="faint tnum" style="white-space:nowrap">${p.id}</span>` },
      { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', render: (p) => html`<span class="ellipsis" style="display:block;max-width:150px">${siteName(p.site)}</span>`, sort: (p) => siteName(p.site), csv: (p) => siteName(p.site) },
      { key: 'shift', label: 'Shift', render: (p) => html`<${ShiftChip} k=${p.shift} />` },
      { key: 'type', label: 'Type', render: (p) => html`<span style="white-space:nowrap" title=${p.contractor || ''}>${p.type}${p.contractor ? html`<div class="faint t-xs ellipsis" style="max-width:120px">${p.contractor}</div>` : null}</span>` },
      { key: 'status', label: 'Status', render: (p) => html`<${Status} s=${p.status} />` },
      { key: 'manager', label: 'Manager', render: (p) => (p.manager && P.byId[p.manager] ? html`<span style="white-space:nowrap">${P.byId[p.manager].name}</span>` : html`<span class="faint">—</span>`), sort: (p) => (P.byId[p.manager] || {}).name || '', csv: (p) => (P.byId[p.manager] || {}).name || '' },
      { key: 'joined', label: 'Joined', align: 'r', render: (p) => html`<div class="tnum" style="white-space:nowrap">${PO.date(p.joinedIso, { short: true })}</div><div class="faint t-xs tnum" style="white-space:nowrap">${p.added ? 'Starts ' + PO.rel(p.joinedIso).toLowerCase() : PO.tenure(p.tenureMonths)}</div>`, sort: (p) => p.joinedIso, csv: (p) => p.joinedIso },
    ];
    const opts = (f) => [...new Set(all.map(f))].sort().map((x) => [x, x]);
    const filters = [
      { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (p, val) => p.site === val },
      { key: 'dept', label: 'Department', options: opts((p) => p.dept), test: (p, val) => p.dept === val },
      { key: 'type', label: 'Type', options: opts((p) => p.type), test: (p, val) => p.type === val },
      { key: 'status', label: 'Status', options: opts((p) => p.status), test: (p, val) => p.status === val },
      { key: 'shift', label: 'Shift', options: P.shifts.map((s) => [s.key, `${s.label} (${s.key})`]), test: (p, val) => p.shift === val },
    ];
    const exportAll = (withPay) => PO.exportCsv(withPay ? 'employees-with-pay' : 'employees', [
      ['Employee ID', 'Name', 'Title', 'Department', 'Site', 'Shift', 'Type', 'Status', 'Manager', 'Joined', 'Email', 'Phone', ...(withPay ? [P.id === 'in' ? 'Annual CTC' : 'Annual gross', 'Net pay this period'] : [])],
      ...all.map((p) => [p.id, p.name, p.title, p.dept, siteName(p.site), p.shift, p.type, p.status, (P.byId[p.manager] || {}).name || '', p.joinedIso, p.email, p.phone || '', ...(withPay ? [p.ctc || '', p.pay ? p.pay.net : ''] : [])]),
    ]);
    const register = IN ? 'Register of employees (Form A, Labour Codes)' : P.id === 'us' ? 'I-9 audit list' : 'Right to work register';
    const title = scope ? 'Team members' : 'Employees';
    const sub = scope ? `${PO.plural(all.length, 'person', 'people')} report to you, directly or through your leads.` : `${PO.plural(all.length, 'person', 'people')} across ${PO.plural(P.sites.length, P.id === 'us' ? 'location' : 'site')}, run from ${P.company.city}.`;

    return html`
      <${PageHeader} title=${title} sub=${sub} actions=${html`
        <${Menu} align="right" width=${280} trigger=${html`<${IconButton} icon="Ellipsis" title="Import and export" bordered />`} items=${[
          ...(scope ? [] : [{ label: 'Import employees', icon: 'Upload', onClick: () => PO.go('settings/import') }, '-']),
          { header: `Export ${PO.plural(all.length, 'record')}` },
          { label: 'Employee list (CSV)', icon: 'FileSpreadsheet', onClick: () => exportAll(false) },
          ...(scope ? [] : [{ label: 'With pay details (CSV)', icon: 'Banknote', onClick: () => exportAll(true) }]),
          { label: 'Headcount report (PDF)', icon: 'FileText', onClick: () => PO.fakeDownload('Headcount report, ' + PO.date(TODAY)) },
          ...(scope ? [] : [{ label: register, icon: 'ScrollText', onClick: () => PO.fakeDownload(register) }]),
          { label: 'Emergency contact sheet', icon: 'Siren', onClick: () => PO.fakeDownload('Emergency contact sheet') },
        ]} />
        ${scope ? null : html`<${Button} kind="primary" onClick=${() => setWizard(true)}>Add employee</${Button}>`}
      `} />
      <div style="margin-bottom:24px"><${PO.KpiStrip} items=${(() => {
        const ft = active.filter((p) => p.type === 'Full-time').length, pt = active.filter((p) => p.type === 'Part-time').length, ct = active.filter((p) => p.type === 'Contract').length;
        const dHc = hc[hc.length - 1] - hc[hc.length - 2];
        const missingN = all.filter((p) => PX.docsOf(p, docSt).some(PX.docGap)).length;
        const notice = scope ? all.filter((p) => p.status === 'Notice period').length : exitsN;
        const fnf = P.exits.filter((e) => e.status === 'F&F due').length;
        return [
          { label: scope ? 'Team size' : 'Headcount', icon: 'Users', accent: 'green', value: PO.num(active.length), onClick: () => setSaved('all'), sub: scope ? `${ft} full-time` : `${dHc >= 0 ? 'Up' : 'Down'} ${Math.abs(dHc)} on last period, ${ft} full-time`, bar: [{ v: ft, k: 'ok', title: `${ft} full-time` }, { v: pt, k: 'mute', title: `${pt} part-time` }, { v: ct, k: 'mute', title: `${ct} contract` }] },
          { label: 'New joiners', icon: 'UserPlus', accent: 'teal', faces: joiners.slice().sort((a, b) => (b.joinedIso || '').localeCompare(a.joinedIso || '')).map((p) => p.id), value: PO.num(joiners.length), onClick: () => setSaved('new'), sub: added.length ? `${added.length} still in pre-boarding` : 'Joined in the last 30 days' },
          { label: scope ? 'Serving notice' : 'Leaving', icon: 'DoorOpen', accent: 'amber', faces: all.filter((p) => p.status === 'Notice period' || p.status === 'Serving notice').map((p) => p.id), value: PO.num(notice), alert: !scope && fnf > 0, href: PO.href('offboarding'), sub: scope ? 'In your team' : fnf ? `${PO.plural(fnf, 'final settlement')} due` : 'No settlements due' },
          { label: 'Missing documents', icon: 'FileWarning', accent: 'red', value: PO.num(missingN), unit: `/${all.length}`, alert: missingN > 0, onClick: () => setSaved('missing'), sub: 'People with a gap in their file', bar: [{ v: all.length - missingN, k: 'ok', title: 'complete' }, { v: missingN, k: 'warn', title: 'missing something' }] },
        ];
      })()} /></div>
      <div class="row wrap ppl-views" style="margin-bottom:12px;gap:10px">
        <${Segmented} options=${VIEWS.map(([k, label, fn]) => [k, html`${label}<span class="faint">${all.filter(fn).length}</span>`])} value=${saved} onChange=${setSaved} />
        ${siteF ? html`<button class="filter-chip on" onClick=${() => setSiteF('')}>${siteName(siteF)}<${Icon} n="X" size=${12} /></button>` : null}
        <div class="right row"><${Segmented} options=${[['table', html`<span class="row" style="gap:6px"><${Icon} n="Rows3" size=${14} />Table</span>`], ['cards', html`<span class="row" style="gap:6px;flex-wrap:nowrap;white-space:nowrap"><${Icon} n="LayoutGrid" size=${14} />Cards<span class="ppl-av-peek"><${PO.AvatarStack} ids=${rows.slice(0, 3).map((p) => p.id)} max=${3} size="xs" /></span></span>`]]} value=${view} onChange=${setView} /></div>
      </div>
      ${view === 'table' ? html`<${DataTable} key=${saved + siteF} rows=${rows} columns=${columns} filters=${filters} search=${(p) => `${p.name} ${p.id} ${p.title} ${p.phone || ''} ${p.email}`} searchPlaceholder="Search name, ID, phone" selectable exportName="employees" onRow=${(p) => PO.go('people/' + p.id)} pageSize=${25} initialSort=${{ key: 'name', dir: 'asc' }}
          bulk=${(ids, clear) => { const sel = all.filter((p) => ids.includes(p.id)); return html`
            <${Button} size="sm" icon="MessageCircle" onClick=${() => setMsg(sel)}>Send message</${Button}>
            <${Button} size="sm" icon="CalendarClock" onClick=${() => setBulk({ kind: 'shift', people: sel, clear })}>Assign shift</${Button}>
            ${scope ? null : html`<${Button} size="sm" icon="UserCog" onClick=${() => setBulk({ kind: 'manager', people: sel, clear })}>Change manager</${Button}>`}
            <${Button} size="sm" icon="Download" onClick=${() => PO.exportCsv('selected-employees', [['Employee ID', 'Name', 'Title', 'Site', 'Shift', 'Phone'], ...sel.map((p) => [p.id, p.name, p.title, siteName(p.site), p.shift, p.phone || ''])])}>Export</${Button}>`; }}
          empty=${{ title: 'No one matches', text: 'Try another saved view, or clear the search and filters.' }} />`
        : html`<${CardGrid} rows=${rows} onMsg=${(p) => setMsg([p])} />`}
      <${AddEmployee} open=${wizard} onClose=${() => { setWizard(false); if (query.new) PO.go('people'); }} />
      ${msg ? html`<${PX.MessageModal} open people=${msg} onClose=${() => setMsg(null)} />` : null}
      ${bulk ? html`<${BulkDrawer} bulk=${bulk} edits=${edits} setEdits=${setEdits} onClose=${() => setBulk(null)} />` : null}
    `;
  }

  function CardGrid({ rows, onMsg }) {
    const P = PO.P();
    const [q, setQ] = useState('');
    const [n, setN] = useState(24);
    const list = rows.filter((p) => !q || `${p.name} ${p.id} ${p.title}`.toLowerCase().includes(q.toLowerCase()));
    return html`<div class="card" style="padding:12px;margin-bottom:12px"><div class="row"><${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search name, ID or role" width=${280} /><span class="right faint t-sm">${PO.plural(list.length, 'person', 'people')}</span></div></div>
      ${list.length ? html`<${PO.PeopleGrid} people=${list.slice(0, n)}
        sub=${(p) => p.title}
        foot=${(p) => html`<span class="ppl-pf"><${Icon} n="MapPin" size=${12} /><span class="ellipsis">${siteName(p.site)}</span></span><${ShiftChip} k=${p.shift} />${p.status !== 'Active' ? html`<span class="ppl-pf-st"><${Status} s=${p.status} /></span>` : null}`} />`
      : null}
      ${list.length > n ? html`<div class="row mt-16" style="justify-content:center"><${Button} onClick=${() => setN(n + 24)}>Show ${Math.min(24, list.length - n)} more</${Button}></div>` : null}
      ${list.length ? null : html`<div class="card"><${Empty} icon="SearchX" title="No one matches" text="Try another saved view or search." /></div>`}`;
  }

  function BulkDrawer({ bulk, edits, setEdits, onClose }) {
    const P = PO.P();
    const { kind, people, clear } = bulk;
    const [shift, setShift] = useState('A');
    const [mgr, setMgr] = useState('');
    const [from, setFrom] = useState(addDays(TODAY, 1));
    const mgrs = PX.managers(P).filter((m) => !people.some((p) => p.id === m.id));
    const apply = () => {
      const prev = edits;
      const next = { ...edits };
      people.forEach((p) => { next[p.id] = { ...(next[p.id] || {}), ...(kind === 'shift' ? { shift } : { manager: mgr }) }; });
      setEdits(next); clear(); onClose();
      PO.toast(kind === 'shift' ? `${PO.plural(people.length, 'person', 'people')} moved to shift ${shift} from ${PO.date(from, { short: true })}` : `${PO.plural(people.length, 'person', 'people')} now report to ${P.byId[mgr].name}`, { action: { label: 'Undo', run: () => setEdits(prev) } });
    };
    return html`<${Drawer} open title=${kind === 'shift' ? 'Assign shift' : 'Change manager'} sub=${PO.plural(people.length, 'person', 'people') + ' selected'} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${kind === 'manager' && !mgr} onClick=${apply}>${kind === 'shift' ? 'Assign shift' : 'Change manager'}</${Button}>`}>
      <div class="col gap-16">
        <div class="row"><${PO.AvatarStack} ids=${people.filter((p) => P.byId[p.id]).map((p) => p.id)} max=${8} /><span class="t-sm muted">${people.slice(0, 3).map((p) => p.first).join(', ')}${people.length > 3 ? ` +${people.length - 3}` : ''}</span></div>
        ${kind === 'shift' ? html`<${Field} label="New shift">${P.shifts.map((s) => html`<button class=${'ppl-opt mt-4 ' + (shift === s.key ? 'on' : '')} onClick=${() => setShift(s.key)}><${ShiftChip} k=${s.key} /><span class="grow"></span><span class="faint t-sm">${s.time}</span></button>`)}</${Field}>
          <p class="faint t-sm">${people.filter((p) => p.shift !== shift).length} of ${people.length} change shift. The roster updates, and any clash with leave or an open shift is flagged there.</p>`
        : html`<${Field} label="New manager" hint="Approvals, leave and timesheets will route to this person."><select class="select" value=${mgr} onChange=${(e) => setMgr(e.target.value)}><option value="">Choose a manager</option>${mgrs.map((m) => html`<option value=${m.id}>${m.name}, ${m.title}, ${siteName(m.site)}</option>`)}</select></${Field}>
          ${mgr ? html`<p class="faint t-sm">${P.byId[mgr].name} will manage ${PO.plural(people.length + (P.byManager[mgr] || []).length, 'person', 'people')}. Pending approvals move to ${P.byId[mgr].first} from the effective date.</p>` : null}`}
        <${Field} label="Effective from"><input class="input" type="date" value=${from} onInput=${(e) => setFrom(e.target.value)} /></${Field}>
        <label class="check t-sm"><input type="checkbox" checked /> Notify ${people.length === 1 ? people[0].first : 'everyone'} by email and SMS</label>
      </div>
    </${Drawer}>`;
  }

  /* =====================================================================
     Add employee wizard
     ===================================================================== */
  const NLW = 12.71, FLSA = 35568;
  function inSplit(ctc, pct) {
    const m = ctc / 12; let G = m;
    for (let i = 0; i < 40; i++) { const b = pct * G; const er = 0.12 * Math.min(b, 25000) + (G <= 21000 ? 0.0325 * G : 0); G = m - er; }
    const basic = Math.round(pct * G), hra = Math.round(basic * 0.4), gross = Math.round(G), special = gross - basic - hra;
    const erPf = Math.round(0.12 * Math.min(basic, 25000)), esiOn = gross <= 21000, erEsi = esiOn ? Math.ceil(gross * 0.0325) : 0;
    const pf = erPf, esi = esiOn ? Math.ceil(gross * 0.0075) : 0, pt = gross > 10000 ? 200 : gross > 7500 ? 175 : 0;
    return { basic, hra, special, gross, erPf, erEsi, esiOn, pf, esi, pt, net: gross - pf - esi - pt, monthlyCtc: gross + erPf + erEsi };
  }
  function defaultPay(P, roleKey) {
    const r = P.roles[roleKey] || {};
    if (P.id === 'in') { const g = (r.basic || 14000) + (r.hra || 4000) + (r.special || 2000); const er = 0.12 * Math.min(g * 0.5, 25000) + (g <= 21000 ? 0.0325 * g : 0); return { ctc: Math.round(((g + er) * 12) / 1000) * 1000, pct: 0.5 }; }
    if (P.id === 'us') return r.salary ? { mode: 'salary', salary: r.salary * 26, rate: 0 } : { mode: 'hourly', rate: r.rate, salary: 0, hours: 32 };
    return r.salary ? { mode: 'salary', salary: Math.round(r.salary * 13), rate: 0 } : { mode: 'hourly', rate: r.rate, hours: 37.5 };
  }

  function AddEmployee({ open, onClose }) {
    const P = PO.P();
    const IN = PO.isIN(), US = PO.isUS();
    const [added, setAdded] = PO.useCoState('people.added', []);
    const [, setOnb] = PO.useCoState('onboarding.added', []);
    const roleKeys = Object.keys(P.roles);
    const firstRole = roleKeys[0];
    const opsSites = P.sites.filter((s) => s.lead);
    const init = () => ({ first: '', last: '', g: 'f', phone: '', email: '', dob: '1998-05-14', city: P.vocab.cities[0], site: opsSites[0].id, role: firstRole, shift: 'A', manager: opsSites[0].lead, start: addDays(TODAY, 6), type: 'Full-time', post: '', pay: defaultPay(P, firstRole), docs: P.vocab.docTypes.slice(), wa: true });
    const [f, setF] = useState(init);
    const [step, setStep] = useState(0);
    const [tried, setTried] = useState(false);
    useEffect(() => { if (open) { setF(init()); setStep(0); setTried(false); } }, [open, P.id]);
    if (!open) return null;
    const set = (patch) => setF((cur) => ({ ...cur, ...patch }));
    const STEPS = [['Basics', 'Name and contact'], ['Job', 'Site, role, shift'], ['Pay', IN ? 'CTC and structure' : 'Rate and hours'], ['Documents', 'What to collect'], ['Review', 'Check and start']];
    const errs = { first: !f.first.trim(), last: !f.last.trim(), phone: f.phone.replace(/\D/g, '').length < 10 };
    const blocked = step === 0 && (errs.first || errs.last || errs.phone);
    const next = () => { if (blocked) { setTried(true); return; } setTried(false); setStep(step + 1); };
    const lead = (sid) => (PO.site(sid) || {}).lead || P.topId;
    const mgrs = PX.managers(P);

    const finish = () => {
      const id = PX.nextId(P, added);
      const rec = { id, first: f.first.trim(), last: f.last.trim(), g: f.g, phone: f.phone, personalEmail: f.email, dob: f.dob, city: f.city, site: f.site, role: f.role, shift: f.shift, manager: f.manager, start: f.start, type: f.type, post: f.post || 'To be assigned', offer: f.pay, docs: f.docs, contractor: IN && f.type === 'Contract' ? 'Shield Manpower Services' : undefined };
      setAdded([...added, rec]);
      nameCache[id] = `${rec.first} ${rec.last}`;
      const tasks = (P.onboarding[0] ? P.onboarding[0].tasks : []).map((t, k) => ({ t: t.t, owner: t.owner, done: k === 0 }));
      const caseId = 'ONB-' + (90 + added.length);
      setOnb((prev) => [...prev, { id: caseId, name: `${rec.first} ${rec.last}`, who: id, role: P.roles[f.role].title, site: f.site, start: f.start, buddy: lead(f.site), tasks, stage: 'Pre-boarding', added: true }]);
      onClose();
      PO.toast(`Onboarding started for ${rec.first} ${rec.last}`, { icon: 'UserPlus', action: { label: 'View case', run: () => PO.go('onboarding?case=' + caseId) }, ms: 6000 });
    };

    const payBody = () => {
      const p = f.pay;
      const setPay = (patch) => set({ pay: { ...p, ...patch } });
      if (IN) {
        const s = inSplit(p.ctc, p.pct);
        const ok = p.pct >= 0.5;
        return html`<div class="col gap-16">
          <div class="grid g-2"><${Field} label="Annual CTC" hint="Cost to company, including employer PF and ESI"><div class="input-wrap"><span style="position:absolute;left:10px;color:var(--text-3)">₹</span><input class="input tnum" style="padding-left:24px" type="number" step="1000" value=${p.ctc} onInput=${(e) => setPay({ ctc: +e.target.value || 0 })} /></div></${Field}>
            <${Field} label=${`Basic as % of wages: ${Math.round(p.pct * 100)}%`} hint="Labour Codes: basic + DA must be at least 50% of wages"><input type="range" min="30" max="70" step="5" value=${p.pct * 100} onInput=${(e) => setPay({ pct: +e.target.value / 100 })} style="accent-color:var(--brand);margin-top:8px" /></${Field}></div>
          <div class="card" style="padding:4px 16px"><table class="ppl-split"><tbody>
            <tr><td>Basic</td><td class="faint t-sm">${Math.round(p.pct * 100)}% of gross</td><td class="r">${PO.money(s.basic)}</td></tr>
            <tr><td>House rent allowance</td><td class="faint t-sm">40% of basic</td><td class="r">${PO.money(s.hra)}</td></tr>
            <tr><td>Special allowance</td><td class="faint t-sm">balancing figure</td><td class="r">${PO.money(s.special)}</td></tr>
            <tr class="tot"><td>Gross monthly wages</td><td></td><td class="r">${PO.money(s.gross)}</td></tr>
            <tr><td class="muted">Employer PF</td><td class="faint t-sm">12% of basic</td><td class="r muted">${PO.money(s.erPf)}</td></tr>
            <tr><td class="muted">Employer ESI</td><td class="faint t-sm">${s.esiOn ? '3.25%, wages ≤ ₹21,000' : 'Not applicable above ₹21,000'}</td><td class="r muted">${PO.money(s.erEsi)}</td></tr>
            <tr class="tot"><td>Monthly CTC</td><td></td><td class="r">${PO.money(s.monthlyCtc)}</td></tr>
            <tr><td class="muted">Estimated take-home</td><td class="faint t-sm">after PF ${PO.money(s.pf)}${s.esi ? `, ESI ${PO.money(s.esi)}` : ''}, PT ${PO.money(s.pt)}</td><td class="r up">${PO.money(s.net)}</td></tr>
          </tbody></table></div>
          ${ok ? html`<${Callout} tone="green" icon="ShieldCheck" title="Meets the 50% wage rule">Basic is ${Math.round(p.pct * 100)}% of wages, so PF, gratuity and bonus are calculated on the full ${PO.money(s.basic)}. Code on Wages, in force from 21 Nov 2025.</${Callout}>`
          : html`<${Callout} tone="red" icon="TriangleAlert" title="Below the 50% wage rule" action=${html`<${Button} size="sm" onClick=${() => setPay({ pct: 0.5 })}>Fix to 50%</${Button}>`}>Allowances above 50% are added back to wages for PF and gratuity. Raise basic to at least ${PO.money(Math.round(s.gross * 0.5))}.</${Callout}>`}
        </div>`;
      }
      if (US) {
        const annual = p.mode === 'hourly' ? p.rate * (p.hours || 0) * 52 : p.salary;
        return html`<div class="col gap-16">
          <${Segmented} options=${[['hourly', 'Hourly (non-exempt)'], ['salary', 'Salaried']]} value=${p.mode} onChange=${(m) => setPay(m === 'hourly' ? { mode: m, rate: p.rate || 15, hours: p.hours || 32 } : { mode: m, salary: p.salary || 45000 })} />
          ${p.mode === 'hourly' ? html`<div class="grid g-2"><${Field} label="Hourly rate" hint="Texas minimum wage is $7.25"><div class="input-wrap"><span style="position:absolute;left:10px;color:var(--text-3)">$</span><input class="input tnum" style="padding-left:22px" type="number" step="0.25" value=${p.rate} onInput=${(e) => setPay({ rate: +e.target.value || 0 })} /></div></${Field}><${Field} label="Expected hours a week"><input class="input tnum" type="number" value=${p.hours} onInput=${(e) => setPay({ hours: +e.target.value || 0 })} /></${Field}></div>`
          : html`<${Field} label="Annual salary"><div class="input-wrap"><span style="position:absolute;left:10px;color:var(--text-3)">$</span><input class="input tnum" style="padding-left:22px" type="number" step="500" value=${p.salary} onInput=${(e) => setPay({ salary: +e.target.value || 0 })} /></div></${Field}>`}
          <${KV} items=${[['Per bi-weekly check', PO.money(annual / 26, { cents: true })], ['Annualized', PO.money(annual)], ['Overtime', p.mode === 'hourly' ? '1.5× after 40 hours in a workweek (FLSA)' : annual < FLSA ? '1.5× after 40 hours (non-exempt)' : 'Exempt'], ['401(k)', 'Eligible after 90 days, 3% company match'], ['Tips', f.role === 'barista' ? 'Card tips paid through payroll' : '—']]} />
          ${p.mode === 'hourly' && p.rate < 7.25 ? html`<${Callout} tone="red" icon="TriangleAlert" title="Below the federal minimum wage">Texas follows the federal minimum of $7.25 an hour.</${Callout}>` : null}
          ${p.mode === 'salary' && annual < FLSA ? html`<${Callout} tone="amber" icon="TriangleAlert" title="Below the FLSA salary threshold">${PO.money(annual)} is under $684 a week, so this role can’t be exempt. Track hours and pay overtime.</${Callout}>` : html`<${Callout} tone="blue" icon="FileText" title="W-4 and I-9 go out with the offer">Section 1 of Form I-9 is due on day 1. Section 2 is due within 3 business days.</${Callout}>`}
        </div>`;
      }
      const four = p.mode === 'hourly' ? p.rate * (p.hours || 0) * 4 : p.salary / 13;
      const annualUk = p.mode === 'hourly' ? p.rate * (p.hours || 0) * 52 : p.salary;
      return html`<div class="col gap-16">
        <${Segmented} options=${[['hourly', 'Hourly'], ['salary', 'Salaried']]} value=${p.mode} onChange=${(m) => setPay(m === 'hourly' ? { mode: m, rate: p.rate || NLW, hours: p.hours || 37.5 } : { mode: m, salary: p.salary || 29400 })} />
        ${p.mode === 'hourly' ? html`<div class="grid g-2"><${Field} label="Hourly rate" hint=${`National Living Wage (21+) is £${NLW.toFixed(2)} from April 2026`}><div class="input-wrap"><span style="position:absolute;left:10px;color:var(--text-3)">£</span><input class="input tnum" style=${`padding-left:22px;${p.rate < NLW ? 'border-color:var(--red)' : ''}`} type="number" step="0.01" value=${p.rate} onInput=${(e) => setPay({ rate: +e.target.value || 0 })} /></div></${Field}><${Field} label="Contracted hours a week"><input class="input tnum" type="number" step="0.5" value=${p.hours} onInput=${(e) => setPay({ hours: +e.target.value || 0 })} /></${Field}></div>`
        : html`<${Field} label="Annual salary"><div class="input-wrap"><span style="position:absolute;left:10px;color:var(--text-3)">£</span><input class="input tnum" style="padding-left:22px" type="number" step="100" value=${p.salary} onInput=${(e) => setPay({ salary: +e.target.value || 0 })} /></div></${Field}>`}
        <${KV} items=${[['Four-weekly gross', PO.money(four, { cents: true })], ['Annual', PO.money(annualUk)], ['Holiday', `5.6 weeks (${PO.num(Math.min(28, 5.6 * Math.min(5, (p.hours || 37.5) / 7.5)), 1)} days) pro rata`], ['Pension', annualUk > 10000 ? 'Auto-enrolled into NEST, 5% and 3%' : 'Below £10,000, can opt in'], ['Tax code', '1257L until a P45 or starter checklist arrives']]} />
        ${p.mode === 'hourly' && p.rate < NLW ? html`<${Callout} tone="red" icon="TriangleAlert" title=${`£${(+p.rate || 0).toFixed(2)} is below the National Living Wage`} action=${html`<${Button} size="sm" onClick=${() => setPay({ rate: NLW })}>Use £${NLW.toFixed(2)}</${Button}>`}>Workers aged 21 and over must get at least £${NLW.toFixed(2)} an hour. Uniform or other deductions can’t take pay below it either.</${Callout}>` : html`<${Callout} tone="green" icon="ShieldCheck" title="At or above the National Living Wage">Right to work must be checked before day 1. Use the share code from the candidate.</${Callout}>`}
      </div>`;
    };

    const payLine = () => { const p = f.pay; if (IN) { const s = inSplit(p.ctc, p.pct); return `${PO.money(p.ctc)} CTC, ${PO.money(s.gross)} a month gross`; } if (p.mode === 'hourly') return `${PO.money(p.rate, { cents: true })} an hour, ${p.hours} h a week`; return `${PO.money(p.salary)} a year`; };
    const name = `${f.first || 'New'} ${f.last || 'employee'}`.trim();
    const body = [
      html`<div class="col gap-16">
        <div class="grid g-2"><${Field} label="First name" hint=${tried && errs.first ? html`<span style="color:var(--red)">Required</span>` : null}><input class="input" value=${f.first} placeholder=${IN ? 'Rahul' : P.id === 'us' ? 'Jordan' : 'Sophie'} onInput=${(e) => set({ first: e.target.value })} /></${Field}>
          <${Field} label="Last name" hint=${tried && errs.last ? html`<span style="color:var(--red)">Required</span>` : null}><input class="input" value=${f.last} placeholder=${IN ? 'Sonawane' : P.id === 'us' ? 'Mills' : 'Turner'} onInput=${(e) => set({ last: e.target.value })} /></${Field}></div>
        <div class="grid g-2"><${Field} label="Mobile" hint=${tried && errs.phone ? html`<span style="color:var(--red)">Enter a 10-digit number</span>` : 'Used for SMS alerts and the employee portal sign-in code'}><input class="input tnum" value=${f.phone} placeholder=${IN ? '+91 98220 41567' : P.id === 'us' ? '(512) 555-0142' : '07700 900142'} onInput=${(e) => set({ phone: e.target.value })} /></${Field}>
          <${Field} label="Personal email" hint="Optional"><input class="input" value=${f.email} placeholder="name@gmail.com" onInput=${(e) => set({ email: e.target.value })} /></${Field}></div>
        <div class="grid g-3"><${Field} label="Gender"><${PO.Select} value=${f.g} onChange=${(g) => set({ g })} options=${[['f', 'Female'], ['m', 'Male'], ['x', 'Prefer not to say']]} /></${Field}>
          <${Field} label="Date of birth"><input class="input" type="date" value=${f.dob} onInput=${(e) => set({ dob: e.target.value })} /></${Field}>
          <${Field} label="City"><${PO.Select} value=${f.city} onChange=${(city) => set({ city })} options=${P.vocab.cities} /></${Field}></div>
        <p class="faint t-sm">Or email a self-onboarding link to the employee portal instead. ${IN ? 'They upload Aadhaar and PAN, and the details are read from the scans.' : 'They fill in their own details and bank account.'}</p>
      </div>`,
      html`<div class="col gap-16">
        <div class="grid g-2"><${Field} label=${P.id === 'us' ? 'Location' : 'Site'}><select class="select" value=${f.site} onChange=${(e) => set({ site: e.target.value, manager: lead(e.target.value) })}>${P.sites.map((s) => html`<option value=${s.id}>${s.name}${s.client && s.client !== P.company.short ? ', ' + s.client : ''}</option>`)}</select></${Field}>
          <${Field} label="Role"><select class="select" value=${f.role} onChange=${(e) => set({ role: e.target.value, pay: defaultPay(P, e.target.value) })}>${roleKeys.map((k) => html`<option value=${k}>${P.roles[k].title}</option>`)}</select></${Field}></div>
        <${Field} label="Shift"><div class="grid g-3" style="gap:8px">${P.shifts.map((s) => html`<button class=${'ppl-opt ' + (f.shift === s.key ? 'on' : '')} onClick=${() => set({ shift: s.key })}><${ShiftChip} k=${s.key} /><span class="right faint t-xs">${s.time}</span></button>`)}</div></${Field}>
        <div class="grid g-2"><${Field} label="Reports to" hint="Defaults to the site lead"><select class="select" value=${f.manager} onChange=${(e) => set({ manager: e.target.value })}>${mgrs.map((m) => html`<option value=${m.id}>${m.name}, ${m.title}</option>`)}</select></${Field}>
          <${Field} label="Start date"><input class="input" type="date" value=${f.start} onInput=${(e) => set({ start: e.target.value })} /></${Field}></div>
        <div class="grid g-2"><${Field} label="Employment type"><${PO.Select} value=${f.type} onChange=${(type) => set({ type })} options=${IN ? ['Full-time', 'Contract'] : ['Full-time', 'Part-time']} /></${Field}>
          <${Field} label="Post / station" hint="Optional"><input class="input" value=${f.post} placeholder=${IN ? 'Main gate' : P.id === 'us' ? 'Front counter' : 'Departures'} onInput=${(e) => set({ post: e.target.value })} /></${Field}></div>
        ${IN && f.type === 'Contract' ? html`<${Callout} tone="amber" icon="HardHat" title="Hired through Shield Manpower Services">The agency pays wages and PF. You remain the principal employer and must check their challans every month.</${Callout}>` : null}
      </div>`,
      payBody(),
      html`<div class="col gap-12">
        <div class="row"><b class="w-600">Collect from ${f.first || 'the new hire'}</b><span class="right faint t-sm">${f.docs.length} of ${P.vocab.docTypes.length}</span></div>
        <div class="card" style="padding:4px 14px">${P.vocab.docTypes.map((d) => html`<label class="check" style="padding:9px 0;border-bottom:1px dashed var(--border);display:flex"><input type="checkbox" checked=${f.docs.includes(d)} onChange=${() => set({ docs: f.docs.includes(d) ? f.docs.filter((x) => x !== d) : [...f.docs, d] })} /><span class="grow">${d}</span><span class="faint t-xs">${/letter|contract|handbook|acknowledg|agreement|policy/i.test(d) ? 'E-sign' : 'Upload'}</span></label>`)}</div>
        <div class="row"><${Switch} on=${f.wa} onChange=${(wa) => set({ wa })} label="Send the welcome email with an employee portal invite and upload link"  /></div>
        ${f.wa ? html`<div class="ppl-bubble"><div class="faint t-xs" style="padding-bottom:6px;margin-bottom:8px;border-bottom:1px solid var(--border);white-space:normal">From <b class="w-500" style="color:var(--text)">${P.msg.name}</b>. Subject: <b class="w-600" style="color:var(--text)">Welcome to ${P.company.short}</b></div>${`${IN ? 'Dear' : 'Hi'} ${f.first || 'there'},\n\nWelcome to ${P.company.short}. You start on ${PO.date(f.start, { weekday: true })} at ${siteName(f.site)}, shift ${f.shift}.\n\nPlease activate your employee portal account, upload ${IN ? 'your Aadhaar, PAN and bank passbook' : 'your documents'} and sign your ${P.id === 'us' ? 'offer letter' : IN ? 'appointment letter' : 'contract'} before your first day.`}</div>` : null}
      </div>`,
      html`<div class="col gap-16">
        <div class="row gap-12"><${Avatar} name=${name} size="xl" /><div><div class="t-lg w-600">${name}</div><div class="muted">${P.roles[f.role].title} at ${siteName(f.site)}</div></div></div>
        <${Card} title="Summary"><${KV} items=${[['Start date', PO.date(f.start, { weekday: true })], ['Shift', `${PO.shiftOf(f.shift).label} (${f.shift}), ${PO.shiftOf(f.shift).time}`], ['Reports to', P.byId[f.manager] ? P.byId[f.manager].name : '—'], ['Employment', f.type + (IN && f.type === 'Contract' ? ' (Shield Manpower)' : '')], ['Pay', payLine()], ['Mobile', f.phone], ['Documents', `${f.docs.length} to collect`]]} /></${Card}>
        <${Card} title="What happens when you click Start onboarding"><div class="col" style="gap:10px">${[
          ['ListChecks', `Onboarding checklist with ${P.onboarding[0] ? P.onboarding[0].tasks.length : 10} tasks for HR, ${P.byId[f.manager] ? P.byId[f.manager].first : 'the manager'} and ${f.first || 'the new hire'}`],
          ['Mail', f.wa ? 'Welcome email with the employee portal invite, plus an SMS with the link' : 'No welcome email sent. You can send it later from the case.'],
          ['CalendarRange', `Added to the ${siteName(f.site)} roster from ${PO.date(f.start, { short: true })}`],
          ['Banknote', `Included in payroll from ${IN ? PO.date(f.start).split(' ').slice(1).join(' ') : 'the next period'}${IN ? ', with UAN and ESI registration queued' : P.id === 'us' ? ', with the Texas new-hire report' : ', with a starter checklist for HMRC'}`],
        ].map(([ic, t]) => html`<div class="row t-sm" style="align-items:flex-start"><${Icon} n="Check" size=${14} style="color:var(--brand);margin-top:2px;flex:none" /><span>${t}</span></div>`)}</div></${Card}>
      </div>`,
    ];
    return html`<${Drawer} open size="lg" title="Add employee" sub=${`Step ${step + 1} of ${STEPS.length}`} onClose=${onClose} footer=${html`
      ${step > 0 ? html`<${Button} onClick=${() => setStep(step - 1)}>Back</${Button}>` : html`<${Button} onClick=${onClose}>Cancel</${Button}>`}
      <span class="grow"></span>
      ${step < STEPS.length - 1 ? html`<${Button} kind="primary" onClick=${next}>Continue</${Button}>` : html`<${Button} kind="primary" onClick=${finish}>Start onboarding</${Button}>`}`}>
      <div style="margin-bottom:18px"><${Steps} steps=${STEPS} current=${step} done=${step} onPick=${(i) => { if (i < step || !(errs.first || errs.last || errs.phone)) setStep(i); else setTried(true); }} /></div>
      ${body[step]}
    </${Drawer}>`;
  }

  /* =====================================================================
     Profile
     ===================================================================== */
  function Profile({ params, query }) {
    const P = PO.P();
    const id = params[0];
    const [added] = PO.useCoState('people.added', []);
    const [edits, setEdits] = PO.useCoState('people.edits', {});
    const [docSt, setDocSt] = PO.useCoState('docs.state', {});
    const [assetSt, setAssetSt] = PO.useCoState('assets.state', {});
    const [addedAssets] = PO.useCoState('assets.added', []);
    const p = PX.find(P, id, added, edits);
    const [tab, setTab] = useState(query.tab || 'overview');
    const [drawer, setDrawer] = useState(query.open || null);
    const [ask, confirmEl] = PO.useConfirm();
    useEffect(() => { if (query.tab) setTab(query.tab); }, [query.tab]);
    const att = useMemo(() => (!p || p.added ? null : PX.attendance(P, p)), [P.id, p && p.id, p && p.shift]);
    if (!p) return html`<${PageHeader} title="Employee not found" /><div class="card"><${Empty} icon="UserX" title=${`No one with ID ${id} at ${P.company.short}`} text="They may belong to another company. Switch company from the top left, or search the directory." action=${html`<${Button} href=${PO.href('people')} icon="ArrowLeft">Back to employees</${Button}>`} /></div>`;

    const IN = PO.isIN();
    const site = PO.site(p.site) || {};
    const mgr = p.manager ? P.byId[p.manager] : null;
    const reports = P.byManager[p.id] || [];
    const docs = PX.docsOf(p, docSt);
    const assets = PX.assets(P, assetSt, addedAssets).filter((a) => a.who === p.id);
    nameCache[p.id] = p.name;
    const mainKey = PX.mainLeave(P);
    const mainBal = p.leave && p.leave[mainKey];
    const sh = PO.shiftOf(p.shift);
    const nextShift = (() => {
      if (!sh) return ['—', ''];
      if (p.added) return [PO.date(p.joinedIso, { short: true, weekday: true }), `First shift, ${sh.time}`];
      const offToday = att && att.day[TODAY] && att.day[TODAY].s === 'WO';
      const later = sh.from > P.company.nowMin && !offToday;
      let d = later ? TODAY : addDays(TODAY, 1);
      if (att) { let k = 0; while (att.offs.includes(PX.dow(d)) && k++ < 7) d = addDays(d, 1); }
      return [d === TODAY ? `Today ${P.hhmm(sh.from)}` : d === addDays(TODAY, 1) ? (sh.from === 0 ? 'Tonight 00:00' : `Tomorrow ${P.hhmm(sh.from)}`) : `${PO.date(d, { short: true, weekday: true })} ${P.hhmm(sh.from)}`, `${sh.label} shift at ${p.post || site.name}`];
    })();
    const inactive = p.status === 'Inactive';
    const setEdit = (patch, msg) => { const prev = edits; setEdits({ ...edits, [p.id]: { ...(edits[p.id] || {}), ...patch } }); PO.toast(msg, { action: { label: 'Undo', run: () => setEdits(prev) } }); };

    const actions = [
      { label: `Call ${p.phone || ''}`, icon: 'Phone', onClick: () => PO.toast(`Calling ${p.first} on ${p.phone}`, { icon: 'Phone' }) },
      { label: 'Email', icon: 'Mail', hint: p.email, onClick: () => PO.toast(`Email draft opened for ${p.email}`, { icon: 'Mail' }) },
      '-',
      { label: 'Assign asset', icon: 'Package', onClick: () => setDrawer('asset') },
      { label: 'Generate letter', icon: 'FileSignature', onClick: () => setDrawer('letter') },
      { label: 'Change shift', icon: 'CalendarClock', onClick: () => setDrawer('shift') },
      '-',
      { label: 'Initiate exit', icon: 'DoorOpen', onClick: () => PO.go('offboarding?new=' + p.id) },
      { label: inactive ? 'Reactivate' : 'Deactivate', icon: inactive ? 'UserCheck' : 'UserX', danger: !inactive, onClick: () => inactive ? setEdit({ status: 'Active' }, `${p.name} reactivated`) : ask({ title: `Deactivate ${p.name}?`, danger: true, icon: 'UserX', tone: 'red', confirm: 'Deactivate', body: html`<p>${p.first} loses employee portal and clock-in access straight away and is left out of the next roster. Payroll history and documents are kept.</p><p class="mt-8">To pay a final settlement, use <b>Initiate exit</b> instead.</p>`, onConfirm: () => setEdit({ status: 'Inactive' }, `${p.name} deactivated`) }) },
    ];

    const TABS = p.added
      ? [['overview', 'Overview'], ['personal', 'Personal'], ['job', 'Job'], ['pay', 'Offer & pay'], ['docs', 'Documents', docs.filter(PX.docGap).length || null], ['activity', 'Activity']]
      : [['overview', 'Overview'], ['personal', 'Personal'], ['job', 'Job'], ['pay', 'Pay'], ['time', P.id === 'us' ? 'Time' : 'Attendance'], ['leave', P.id === 'us' ? 'Time off' : P.id === 'uk' ? 'Holiday' : 'Leave'], ['docs', 'Documents', docs.filter(PX.docGap).length || null], ['assets', 'Assets', assets.length], ['perf', 'Performance'], ['activity', 'Activity']];

    const facts = p.added
      ? [['Starts', PO.rel(p.joinedIso), PO.date(p.joinedIso, { weekday: true })], ['Onboarding', `${docs.filter((d) => !PX.docGap(d)).length} of ${docs.length} docs`, 'collected so far'], ['Pay', p.offer ? (IN ? PO.compactMoney(p.offer.ctc) + ' CTC' : p.offer.mode === 'hourly' ? PO.money(p.offer.rate, { cents: true }) + '/h' : PO.compactMoney(p.offer.salary) + '/yr') : '—', 'as offered'], ['Reports to', mgr ? mgr.name : '—', mgr ? mgr.title : ''], ['First shift', nextShift[0], nextShift[1]]]
      : [['Tenure', PO.tenure(p.tenureMonths), `since ${PO.date(p.joinedIso, { short: false })}`], ['Attendance', att ? PO.pct(att.summary.rate) : '—', `${att ? att.summary.present : 0} days present in ${P.company.period}`], [PO.leaveType(mainKey).name + ' left', mainBal ? PX.fmtLeave(P, mainKey, mainBal.balance) : '—', mainBal ? `of ${PX.fmtLeave(P, mainKey, mainBal.quota)}, ${mainBal.taken} taken` : ''], ['Net pay, draft', p.pay ? PO.money(p.pay.net) : '—', P.company.period], ['Next shift', nextShift[0], nextShift[1]]];

    return html`
      <div class="row" style="margin-bottom:8px;margin-left:-8px"><${Button} kind="ghost" size="sm" icon="ArrowLeft" href=${PO.href('people')}>Employees</${Button}></div>
      <div class="ppl-top">
        <${PO.ProfileHero} p=${p}
          badges=${html`<${Status} s=${p.status} />${p.flag && IN ? html`<${Badge} tone="red" dot>Below 50% wage rule</${Badge}>` : null}`}
          sub=${html`<span class="ppl-meta">${p.title}${p.grade && p.grade !== '—' ? `, grade ${p.grade}` : ''}, at <a href=${PO.href('org?tab=sites')}>${site.name}</a>${site.client && site.client !== P.company.short && site.client !== 'Sentinel' ? ` for ${site.client}` : ''}${p.contractor ? `, employed through ${p.contractor}` : ''}. ${mgr ? html`Reports to <a href=${PO.href('people/' + mgr.id)}>${mgr.name}</a>${reports.length ? html`, manages <a href=${PO.href('org')}>${PO.plural(reports.length, 'person', 'people')}</a>` : ''}.` : 'Top of the org.'}</span>`}
          meta=${html`<span><${Icon} n="Mail" size=${14} />${p.email}</span>${p.phone ? html`<span><${Icon} n="Phone" size=${14} /><span class="tnum">${p.phone}</span></span>` : null}<span><${Icon} n=${p.added ? 'CalendarClock' : 'Award'} size=${14} />${p.added ? 'Starts ' + PO.rel(p.joinedIso).toLowerCase() : PO.tenure(p.tenureMonths) + ' with ' + P.company.short}</span><span><${Icon} n="MapPin" size=${14} />${p.city || site.name}</span><span class="faint tnum"><${Icon} n="Hash" size=${14} />${p.id}</span>`}
          actions=${html`<${Menu} align="right" width=${240} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More actions" />`} items=${actions} />
            <${Button} icon="MessageCircle" onClick=${() => setDrawer('msg')}>Message</${Button}>
            <${Button} kind="primary" onClick=${() => setDrawer('edit')}>Edit details</${Button}>`} />
        <div class="ppl-facts">${facts.map(([l, v, s]) => html`<div><small>${l}</small><b>${v}</b><span>${s}</span></div>`)}</div>
      </div>
      ${inactive ? html`<div style="margin-bottom:24px"><${Callout} tone="red" icon="UserX" title="Deactivated" action=${html`<${Button} size="sm" onClick=${() => setEdit({ status: 'Active' }, `${p.name} reactivated`)}>Reactivate</${Button}>`}>${p.first} can’t clock in or sign in to the employee portal. Records are kept for ${IN ? '8 years under the Labour Codes' : P.id === 'us' ? '3 years under the FLSA' : '6 years for HMRC'}.</${Callout}></div>` : null}
      ${p.added ? html`<div style="margin-bottom:16px"><${Callout} tone="amber" icon="CalendarClock" title=${`Pre-boarding, starts ${PO.date(p.joinedIso, { weekday: true })}`} action=${html`<${Button} size="sm" href=${PO.href('onboarding')}>Open onboarding</${Button}>`}>${p.first} has the welcome message and document link. Payroll, roster and leave start on day 1.</${Callout}></div>` : null}
      <${Tabs} tabs=${TABS} value=${tab} onChange=${setTab} />
      ${tab === 'overview' ? html`<${OverviewTab} p=${p} docs=${docs} assets=${assets} att=${att} setTab=${setTab} />` : null}
      ${tab === 'personal' ? html`<${PersonalTab} p=${p} />` : null}
      ${tab === 'job' ? html`<${JobTab} p=${p} />` : null}
      ${tab === 'pay' ? html`<${PayTab} p=${p} />` : null}
      ${tab === 'time' && att ? html`<${TimeTab} p=${p} att=${att} />` : null}
      ${tab === 'leave' ? html`<${LeaveTab} p=${p} />` : null}
      ${tab === 'docs' ? html`<${DocsTab} p=${p} docs=${docs} docSt=${docSt} setDocSt=${setDocSt} />` : null}
      ${tab === 'assets' ? html`<${AssetsTab} p=${p} assets=${assets} assetSt=${assetSt} setAssetSt=${setAssetSt} onAssign=${() => setDrawer('asset')} />` : null}
      ${tab === 'perf' ? html`<${PerfTab} p=${p} />` : null}
      ${tab === 'activity' ? html`<${ActivityTab} p=${p} />` : null}
      ${drawer === 'msg' ? html`<${PX.MessageModal} open people=${[p]} onClose=${() => setDrawer(null)} />` : null}
      ${drawer === 'edit' ? html`<${EditDrawer} p=${p} onClose=${() => setDrawer(null)} onSave=${(patch) => { setEdit(patch, `${p.first}’s details updated`); setDrawer(null); }} />` : null}
      ${drawer === 'shift' ? html`<${BulkDrawer} bulk=${{ kind: 'shift', people: [p], clear: () => {} }} edits=${edits} setEdits=${setEdits} onClose=${() => setDrawer(null)} />` : null}
      ${drawer === 'asset' && PO.DocKit ? html`<${PO.DocKit.AssignAssetDrawer} personId=${p.id} onClose=${() => setDrawer(null)} />` : null}
      ${drawer === 'letter' && PO.DocKit ? html`<${PO.DocKit.LetterDrawer} personId=${p.id} onClose=${() => setDrawer(null)} />` : null}
      ${confirmEl}
    `;
  }

  function EditDrawer({ p, onClose, onSave }) {
    const P = PO.P();
    const [f, setF] = useState({ title: p.title, phone: p.phone || '', email: p.email, city: p.city || P.vocab.cities[0], post: p.post || '', site: p.site, manager: p.manager || '' });
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    return html`<${Drawer} open title=${`Edit ${p.name}`} sub="Changes are logged in the audit trail" onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" onClick=${() => onSave(f)}>Save changes</${Button}>`}>
      <div class="col gap-16">
        <${Field} label="Job title"><input class="input" value=${f.title} onInput=${set('title')} /></${Field}>
        <div class="grid g-2"><${Field} label="Mobile"><input class="input" value=${f.phone} onInput=${set('phone')} /></${Field}><${Field} label="Work email"><input class="input" value=${f.email} onInput=${set('email')} /></${Field}></div>
        <div class="grid g-2"><${Field} label=${P.id === 'us' ? 'Location' : 'Site'}><select class="select" value=${f.site} onChange=${set('site')}>${P.sites.map((s) => html`<option value=${s.id}>${s.name}</option>`)}</select></${Field}><${Field} label="Post / station"><input class="input" value=${f.post} onInput=${set('post')} /></${Field}></div>
        <${Field} label="Reports to"><select class="select" value=${f.manager} onChange=${set('manager')}>${PX.managers(P).filter((m) => m.id !== p.id).map((m) => html`<option value=${m.id}>${m.name}, ${m.title}</option>`)}</select></${Field}>
        <${Field} label="City"><${PO.Select} value=${f.city} onChange=${(city) => setF({ ...f, city })} options=${P.vocab.cities} /></${Field}>
        ${f.site !== p.site ? html`<${Callout} tone="amber" icon="ArrowRightLeft" title="This is a transfer">${p.first} moves to ${siteName(f.site)}. The roster, geofence and site allowance update from tomorrow.</${Callout}>` : null}
      </div>
    </${Drawer}>`;
  }

  /* ---------- Overview ---------- */
  function OverviewTab({ p, docs, assets, att, setTab }) {
    const P = PO.P();
    const chain = PX.chain(P, p);
    const reports = (P.byManager[p.id] || []).map((id) => P.byId[id]);
    const act = PX.activity(P, p).slice(0, 6);
    const site = PO.site(p.site) || {};
    const yrs = Math.floor(p.tenureMonths / 12);
    const about = p.added
      ? `${p.first} joins ${P.company.short} as ${/^[aeiou]/i.test(p.title) ? 'an' : 'a'} ${p.title.toLowerCase()} at ${site.name} on ${PO.date(p.joinedIso)}, on shift ${p.shift} (${PO.shiftOf(p.shift).time}).`
      : `${p.first} has been with ${P.company.short} for ${yrs ? PO.plural(yrs, 'year') + (p.tenureMonths % 12 ? ` and ${PO.plural(p.tenureMonths % 12, 'month')}` : '') : PO.plural(p.tenureMonths, 'month')}, working as ${/^[aeiou]/i.test(p.title) ? 'an' : 'a'} ${p.title.toLowerCase()} at ${site.name}${site.client && site.client !== P.company.short && site.client !== 'Sentinel' ? ` for ${site.client}` : ''}. Usually on shift ${p.shift} (${PO.shiftOf(p.shift).label.toLowerCase()}, ${PO.shiftOf(p.shift).time})${p.post ? `, posted at ${p.post.toLowerCase()}` : ''}. Based in ${p.city}.`;
    const totLeaveTaken = Object.entries(p.leave || {}).filter(([k]) => !['lop', 'unpaid'].includes(k)).reduce((t, [, v]) => t + (v.taken || 0), 0);
    const docPct = docs.length ? docs.filter((d) => d.status === 'Verified').length / docs.length : 0;
    const stats = p.added ? [] : [
      ['Overtime', `${p.pay.otHours} h`, p.pay.otPay ? PO.money(p.pay.otPay) : 'this period', 'Timer'],
      [`${PX.unitLabel(P)} taken`, PX.fmtLeave(P, PX.mainLeave(P), totLeaveTaken), 'this year', 'Palmtree'],
      ['Documents', PO.pct(docPct), 'verified', 'FileCheck2'],
      ['Assets', String(assets.length), `worth ${PO.money(assets.reduce((t, a) => t + a.value, 0))}`, 'Package'],
    ];
    const missedIso = PX.parseDay(p.missed);
    const missingDocs = docs.filter((d) => d.status === 'Missing' || d.status === 'Expired');
    const todo = [
      p.missed && !p.added ? { tone: 'amber', t: `Missed punch on ${PO.date(missedIso, { short: true, weekday: true })}`, s: `No clock-out recorded. Approve the regularisation before payroll locks, or ${P.id === 'in' ? 'the day counts as half a day' : 'the hours are left out of this check'}.`, a: html`<${Button} size="sm" href=${PO.href('approvals')}>Review</${Button}>` } : null,
      missingDocs.length ? { tone: 'red', t: `${missingDocs.map((d) => d.name).join(', ')} ${missingDocs.length > 1 ? 'are' : 'is'} missing or expired`, s: `Request by email and SMS; ${p.first} uploads in the employee portal.`, a: html`<${Button} size="sm" onClick=${() => setTab('docs')}>Open documents</${Button}>` } : null,
    ].filter(Boolean);
    const up = p.added ? [] : [
      ...P.leaveRequests.filter((l) => l.who === p.id && l.from >= TODAY && l.status !== 'Rejected').slice(0, 2).map((l) => [l.from, `${PO.leaveType(l.type).name}${l.days > 1 ? `, ${l.days} days` : ''}`, html`<${Status} s=${l.status} />`]),
      ...P.holidays.filter((h) => h.upcoming).slice(0, 1).map((h) => [h.date, h.name, html`<span class="faint t-xs">Holiday</span>`]),
      (() => { const b26 = '2026' + p.dob.slice(4); const next = b26 >= TODAY ? b26 : '2027' + p.dob.slice(4); return [next, 'Birthday', html`<span class="faint t-xs">${PO.rel(next)}</span>`]; })(),
      (() => { const a26 = '2026' + p.joinedIso.slice(4); const next = a26 >= TODAY ? a26 : '2027' + p.joinedIso.slice(4); return [next, `Work anniversary, ${+next.slice(0, 4) - +p.joinedIso.slice(0, 4)} years`, null]; })(),
    ].sort((x, y) => x[0].localeCompare(y[0]));
    return html`<div class="grid g-main" style="align-items:start">
      <div class="col" style="gap:16px">
        ${todo.length ? html`<${Card} icon="CircleAlert" accent="amber" title="Needs attention" sub=${PO.plural(todo.length, 'item')} flush><div class="list">${todo.map((x) => html`<div class="list-item"><span style=${`width:7px;height:7px;border-radius:50%;flex:none;background:var(--${x.tone === 'red' ? 'red-solid' : 'signal'})`}></span><div class="grow" style="min-width:0"><div class="w-550">${x.t}</div><div class="faint t-sm">${x.s}</div></div>${x.a}</div>`)}</div></${Card}>` : null}
        <${Card} icon="UserRound" accent="green" title="About"><p class="muted" style="line-height:1.6">${about}</p>
          <div class="mt-12"><${KV} items=${[['Work email', p.email], ['Mobile', p.phone || '—'], ['Joined', p.joinedIso ? PO.date(p.joinedIso) : p.joined || '—']]} /></div>
        </${Card}>
        <${Card} icon="History" accent="blue" title="Recent activity" actions=${html`<${Button} kind="ghost" size="sm" onClick=${() => setTab('activity')}>View all</${Button}>`}>
          ${act.length ? html`<${Timeline} items=${act.map((a) => ({ icon: a.icon, tone: '', title: a.title, sub: a.sub, right: PO.rel(a.date) }))} />` : html`<${Empty} icon="History" title="Nothing yet" text="Activity shows up here once they start." />`}
        </${Card}>
      </div>
      <div class="col" style="gap:16px">
        <${Card} icon="Briefcase" accent="teal" title="Work">
          <${KV} items=${[[P.id === 'us' ? 'Location' : 'Site', site.name], ['Shift', html`<${ShiftChip} k=${p.shift} />`], ['Post', p.post || '—'], ['Type', p.type], ...stats.map(([l, v, sub]) => [l, html`<span class="tnum">${v}</span> <span class="faint t-sm">${sub}</span>`])]} />
        </${Card}>
        <${Card} icon="Network" accent="violet" title="Reporting line">
          <div class="ppl-rl">
            ${chain.map((m) => html`<a class="ppl-rl-n" href=${PO.href('people/' + m.id)}><${Avatar} p=${m} /><span class="grow" style="min-width:0"><b class="w-550 ellipsis" style="display:block">${m.name}</b><small class="faint ellipsis" style="display:block">${m.title}</small></span></a><div class="ppl-rl-v"></div>`)}
            <div class="ppl-rl-n me"><${Avatar} p=${p} size="lg" /><span class="grow"><b class="w-600">${p.name}</b><small class="faint" style="display:block">${p.title}</small></span></div>
          </div>
          ${reports.length ? html`<div class="divider"></div><div class="row" style="margin-bottom:8px"><b class="t-sm w-600">Direct reports</b><span class="right faint t-sm tnum">${reports.length}</span></div>
            <div class="col" style="gap:6px">${reports.slice(0, 5).map((r) => html`<${Who} p=${r} sub=${`${r.title}, shift ${r.shift}`} />`)}</div>
            ${reports.length > 5 ? html`<a class="link t-sm mt-8" style="display:block" href=${PO.href('org')}>${reports.length - 5} more in the org chart</a>` : null}` : null}
        </${Card}>
        ${up.length ? html`<${Card} icon="CalendarHeart" accent="rose" title="Coming up">${up.map(([d, t, r]) => html`<div class="ppl-up"><span class="faint tnum">${PO.date(d, { short: true, noYear: true })}</span><span class="ellipsis">${t}</span>${r || html`<span></span>`}</div>`)}</${Card}>` : null}
      </div>
    </div>`;
  }

  /* ---------- Personal ---------- */
  function Masked({ v }) {
    const [show, setShow] = useState(false);
    if (!v) return '—';
    const masked = String(v).replace(/[A-Za-z0-9](?=[A-Za-z0-9 ]{4})/g, '•');
    return html`<span class="row" style="gap:6px"><span class="ppl-reveal">${show ? v : masked}</span><${IconButton} size="sm" icon=${show ? 'EyeOff' : 'Eye'} title=${show ? 'Hide' : 'Reveal (logged)'} onClick=${() => { setShow(!show); if (!show) PO.toast('Viewing sensitive data is recorded in the audit log', { icon: 'ShieldCheck' }); }} /></span>`;
  }
  function PersonalTab({ p }) {
    const P = PO.P();
    const IN = PO.isIN();
    const idRows = IN ? [['PAN', p.ids.pan], ['Aadhaar', p.ids.aadhaar, 'Stored masked as UIDAI requires'], ['UAN (PF)', p.ids.uan], ['ESIC IP number', p.ids.esic]]
      : P.id === 'us' ? [['SSN', p.ids.ssn], ['Form I-9', p.ids.i9], ['Form W-4', p.ids.w4]]
        : [['National Insurance', p.ids.ni], ['Right to work', p.ids.rtw], ['Tax code', p.ids.taxCode]];
    const noMask = (k) => /I-9|W-4|Right to work|Tax code/.test(k);
    const age = p.dob ? 2026 - +p.dob.slice(0, 4) - (p.dob.slice(5) > TODAY.slice(5) ? 1 : 0) : null;
    return html`<div class="grid g-2">
      <${Card} icon="IdCard" accent="green" title="Personal details" actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => PO.toast(`Change request sent to ${p.first} to confirm by email and SMS`)}>Request update</${Button}>`}>
        <${KV} items=${[['Full name', p.name], ['Date of birth', p.dob ? `${PO.date(p.dob)} (${age})` : '—'], ['Gender', p.g === 'f' ? 'Female' : p.g === 'm' ? 'Male' : '—'], IN ? ['Blood group', p.blood || '—'] : null, ['City', p.city || '—'], ['Mobile', p.phone || '—'], ['Work email', p.email], ['Marital status', p.age > 28 ? 'Married' : 'Single']]} />
      </${Card}>
      <${Card} icon="Siren" accent="red" title="Emergency contact">
        ${p.emergency ? html`<div class="row gap-12"><${Avatar} name=${p.emergency.name} /><div class="grow"><b class="w-600">${p.emergency.name}</b><div class="faint t-sm">${p.emergency.rel}, ${p.emergency.phone}</div></div><${Button} size="sm" onClick=${() => PO.toast(`Calling ${p.emergency.name}`, { icon: 'Phone' })}>Call</${Button}></div>
          <div class="divider"></div><p class="faint t-sm">Shown to site supervisors on the live board during a shift incident.</p>` : html`<${Empty} icon="Siren" title="Not added yet" text="Collected during onboarding." />`}
      </${Card}>
      <${Card} icon="ShieldCheck" accent="violet" title=${IN ? 'Statutory IDs' : P.id === 'us' ? 'Tax and eligibility' : 'Tax and right to work'} sub="Encrypted, and every view is logged">
        ${p.added ? html`<${Empty} icon="IdCard" title="Collected during onboarding" text=${'Requested in the welcome email; uploaded through the employee portal.'} />` : html`<${KV} items=${idRows.map(([k, v, hint]) => [k, noMask(k) ? html`<${Status} s=${/Missing/.test(v) ? 'Missing' : /starter|Share/.test(v) ? 'Pending' : 'Verified'} dot=${false} /> <span class="t-sm muted">${v}</span>` : html`<span>${html`<${Masked} v=${v} />`}${hint ? html`<small class="faint" style="display:block;font-weight:400">${hint}</small>` : null}</span>`])} />`}
      </${Card}>
      <${Card} icon="Landmark" accent="teal" title="Bank account" sub=${P.id === 'in' ? 'Salary credited by NEFT' : P.id === 'us' ? 'Direct deposit' : 'Paid by BACS'}>
        ${p.bank && p.bank.status !== 'missing' ? html`<div class="row gap-12"><div class="grow"><b class="w-600">${p.bank.name}</b><div class="faint tnum">${p.bank.acct}${IN ? ', IFSC ' + p.bank.name.slice(0, 4).toUpperCase().replace(/\s/g, 'X') + '0001' + p.id.slice(-3) : P.id === 'us' ? ', routing •••• 1140' : ', sort code ••-••-' + p.id.slice(-2)}</div></div><${Badge} tone="green" dot>Verified</${Badge}></div>
          <p class="faint t-sm mt-12">${IN ? 'Verified with a ₹1 penny drop' : P.id === 'us' ? 'Verified with two micro-deposits' : 'Verified with Confirmation of Payee'} on ${PO.date(addDays(p.joinedIso, 2))}.</p>`
        : html`<${Callout} tone="red" icon="Landmark" title="No bank account yet" action=${html`<${Button} size="sm" onClick=${() => PO.toast(`Bank details requested from ${p.first} by email and SMS`, { icon: 'Send' })}>Request</${Button}>`}>${p.first} will be paid by ${IN ? 'cash voucher' : 'paper check'} until this is added.</${Callout}>`}
      </${Card}>
    </div>`;
  }

  /* ---------- Job ---------- */
  function careerEvents(P, p) {
    const r = PO.seeded('career' + P.id + p.id);
    const ev = [];
    const site = PO.site(p.site) || {};
    const isLead = p.role === 'sup' || p.role === 'lead' || p.inCharge;
    const startTitle = isLead && p.tenureMonths > 24 ? (P.id === 'in' ? 'Security guard' : P.id === 'us' ? 'Barista' : 'Cleaner') : p.title;
    const otherSites = P.sites.filter((s) => s.id !== p.site && s.lead);
    const transfer = !p.added && p.role !== 'office' && p.tenureMonths > 20 && r.chance(0.45) && otherSites.length;
    const startSite = transfer ? r.pick(otherSites) : site;
    ev.push({ date: p.joinedIso, icon: 'UserPlus', tone: 'brand', title: `Joined as ${startTitle}`, sub: `${startSite.name}, ${p.type.toLowerCase()}${p.contractor ? ' via ' + p.contractor : ''}` });
    if (p.tenureMonths >= 6) ev.push({ date: addDays(p.joinedIso, 182), icon: 'BadgeCheck', tone: 'green', title: 'Confirmed after probation', sub: '6-month review, met expectations' });
    if (transfer) ev.push({ date: addDays(p.joinedIso, r.int(220, Math.max(240, p.tenureMonths * 30 - 120))), icon: 'ArrowRightLeft', tone: 'blue', title: `Transferred to ${site.name}`, sub: `From ${startSite.name}, ${site.client && site.client !== 'Sentinel' ? 'client requested more ' + (P.id === 'in' ? 'experienced guards' : 'cover') : 'staffing rebalance'}` });
    if (startTitle !== p.title) ev.push({ date: addDays(p.joinedIso, Math.min(p.tenureMonths * 30 - 60, r.int(480, 900))), icon: 'TrendingUp', tone: 'green', title: `Promoted to ${p.title}`, sub: `Recommended by ${P.byId[P.topId].name}` });
    // pay revisions
    const y0 = +p.joinedIso.slice(0, 4);
    for (let y = y0 + 1; y <= 2026; y++) {
      const d = P.id === 'in' ? `${y}-04-01` : P.id === 'uk' ? `${y}-04-01` : `${y}${p.joinedIso.slice(4)}`;
      if (d <= p.joinedIso || d > TODAY) continue;
      if (P.id === 'in') ev.push({ date: d, icon: 'IndianRupee', tone: '', title: `Annual increment, ${r.int(5, 9)}%`, sub: 'Includes the April VDA revision for Maharashtra' });
      else if (P.id === 'uk') { const nlw = { 2022: 9.5, 2023: 10.42, 2024: 11.44, 2025: 12.21, 2026: 12.71 }[y]; if (nlw) ev.push({ date: d, icon: 'PoundSterling', tone: '', title: p.role === 'office' ? `Annual pay review, ${r.int(3, 5)}%` : `Rate raised with the National Living Wage`, sub: p.role === 'office' ? 'Approved by the managing director' : `Floor moved to £${nlw.toFixed(2)} an hour` }); }
      else ev.push({ date: d, icon: 'DollarSign', tone: '', title: P.roles[p.role] && P.roles[p.role].rate ? `Raise of $${(r.int(2, 6) * 0.25).toFixed(2)} an hour` : `Annual raise, ${r.int(3, 6)}%`, sub: 'Anniversary review' });
    }
    if (p.shift === 'C' && !p.added) ev.push({ date: addDays(p.joinedIso, r.int(30, 200)), icon: 'Moon', tone: '', title: 'Moved to the night shift', sub: P.id === 'in' ? 'Night allowance ₹50 a night' : P.id === 'uk' ? 'Night premium £1.50 an hour' : 'Overnight bake team' });
    return ev.filter((e) => e.date <= TODAY).sort((a, b) => b.date.localeCompare(a.date));
  }
  function JobTab({ p }) {
    const P = PO.P();
    const site = PO.site(p.site) || {};
    const IN = PO.isIN();
    const sup = p.supervisor ? P.byId[p.supervisor] : null;
    const probationEnd = addDays(p.joinedIso, 182);
    const notice = IN ? (p.role === 'office' || p.role === 'sup' ? '60 days' : '30 days') : P.id === 'us' ? 'At-will, 2 weeks requested' : `${Math.max(1, Math.min(12, Math.floor(p.tenureMonths / 12)))} week${Math.floor(p.tenureMonths / 12) > 1 ? 's' : ''} (statutory)`;
    const ev = careerEvents(P, p);
    return html`<div class="grid g-main">
      <div class="col gap-16">
        <${Card} icon="Briefcase" accent="green" title="Employment">
          <${KV} cols2 items=${[['Employee ID', html`<span class="tnum">${p.id}</span>`], ['Job title', p.title], ['Department', p.dept], ['Grade', p.grade], ['Employment type', p.type], ['Status', html`<${Status} s=${p.status} />`], ['Date of joining', PO.date(p.joinedIso)], [p.tenureMonths >= 6 ? 'Confirmed on' : 'Probation ends', PO.date(probationEnd)], ['Notice period', notice], ['Work mode', p.workMode || 'On site'], IN ? ['Principal employer', p.contractor ? `${P.company.name} (agency: ${p.contractor})` : P.company.name] : P.id === 'us' ? ['FLSA status', P.roles[p.role] && P.roles[p.role].rate ? 'Non-exempt (hourly)' : p.flag ? 'Non-exempt (below salary threshold)' : 'Exempt'] : ['Contract', p.type === 'Part-time' ? 'Part-time, variable hours' : 'Permanent, full-time'], ['Cost centre', `${site.id ? site.id.toUpperCase() : '—'}-${p.dept.slice(0, 3).toUpperCase()}`]]} />
        </${Card}>
        <${Card} icon="TrendingUp" accent="violet" title="Career timeline" sub=${p.added ? 'Starts on day 1' : PO.plural(ev.length, 'event')}>
          ${ev.length ? html`<${Timeline} items=${ev.map((e) => ({ icon: e.icon, tone: e.tone, title: e.title, sub: e.sub, right: PO.date(e.date, { short: true }) }))} />` : html`<${Empty} icon="Milestone" title="Their story starts on day 1" text=${`${p.first} starts on ${PO.date(p.joinedIso)}.`} />`}
        </${Card}>
      </div>
      <div class="col gap-16">
        <${Card} icon="MapPin" accent="teal" title="Place of work">
          ${site.lat ? html`<div style="margin-bottom:12px"><${PO.GMapPlace} lat=${site.lat} lng=${site.lng} zoom=${16} height=${160} radius=${site.radius} label=${site.name} address=${site.address} /></div>` : null}
          <${KV} items=${[[P.id === 'us' ? 'Location' : 'Site', site.name], ['Client', site.client || '—'], ['Post', p.post || '—'], ['Geofence', `${site.radius || (P.id === 'in' ? 150 : 100)} m radius${P.id === 'in' ? ', QR at the gate' : ''}`], ['Site lead', site.lead && P.byId[site.lead] ? html`<a class="link" href=${PO.href('people/' + site.lead)}>${P.byId[site.lead].name}</a>` : '—']]} />
        </${Card}>
        <${Card} icon="CalendarClock" accent="blue" title="Schedule">
          <${KV} items=${[['Usual shift', html`<${ShiftChip} k=${p.shift} />`], ['Hours', PO.shiftOf(p.shift).time], ['Supervisor', sup ? html`<a class="link" href=${PO.href('people/' + sup.id)}>${sup.name}</a>` : '—'], ['Weekly off', p.added ? 'Set on the roster' : PX.attendance(P, p).offs.map((d) => PO.DAYS[d]).join(', ')]]} />
          <div class="mt-12"><${Button} size="sm" onClick=${() => PO.go('roster')}>Open roster</${Button}></div>
        </${Card}>
      </div>
    </div>`;
  }

  /* ---------- Pay ---------- */
  function PayTab({ p }) {
    const P = PO.P();
    const IN = PO.isIN(), US = PO.isUS();
    const role = P.roles[p.role] || {};
    if (p.added) {
      const o = p.offer || {};
      const s = IN && o.ctc ? inSplit(o.ctc, o.pct || 0.5) : null;
      return html`<div class="grid g-2"><${Card} icon="Banknote" accent="green" title="Offered pay" sub="Starts with the first payroll after day 1">
        ${IN && s ? html`<table class="ppl-split"><tbody><tr><td>Basic</td><td class="r">${PO.money(s.basic)}</td></tr><tr><td>House rent allowance</td><td class="r">${PO.money(s.hra)}</td></tr><tr><td>Special allowance</td><td class="r">${PO.money(s.special)}</td></tr><tr class="tot"><td>Gross a month</td><td class="r">${PO.money(s.gross)}</td></tr><tr><td class="muted">Annual CTC</td><td class="r">${PO.money(o.ctc)}</td></tr></tbody></table>`
        : html`<${KV} items=${[['Pay type', o.mode === 'hourly' ? 'Hourly' : 'Salaried'], ['Rate', o.mode === 'hourly' ? `${PO.money(o.rate, { cents: true })} an hour` : `${PO.money(o.salary)} a year`], ['Hours', o.hours ? `${o.hours} a week` : '—']]} />`}
      </${Card}><${Card} icon="ListChecks" accent="amber" title="Before the first payroll"><${PO.Checklist} items=${[{ t: 'Bank account verified', done: false }, { t: IN ? 'UAN generated or linked' : US ? 'Form W-4 submitted' : 'Starter checklist or P45', done: false }, { t: IN ? 'ESI registration' : US ? 'Form I-9 section 2' : 'Pension auto-enrolment letter', done: false }]} /></${Card}></div>`;
    }
    const pay = p.pay;
    const hist = P.payHistory;
    const ym = (l) => { const [m, y] = l.split(' '); return y + '-' + String(PO.MONS.indexOf(m) + 1).padStart(2, '0'); };
    const scale = (h) => (p.hero && h === hist[hist.length - 2] ? P.prevPay.net : (pay.net * h.net) / P.totals.net);
    const nPer = IN ? null : Math.min(hist.length, Math.ceil((p.tenureMonths * 30.4) / (P.id === 'us' ? 14 : 28)) + 1);
    const shown = IN ? hist.filter((h) => ym(h.label) >= p.joinedIso.slice(0, 7)) : hist.slice(hist.length - nPer);
    const short = (l) => (IN ? l.slice(0, 3) : l.split(' – ')[0].replace('*', ''));
    const rateLine = IN ? `${PO.money(pay.structure.total)} a month` : role.rate ? `${PO.money(role.rate, { cents: true })} an hour` : `${PO.money(role.salary)} a ${US ? 'bi-weekly' : 'four-weekly'} period`;
    const list = (rows, total, label, tone) => html`<table class="ppl-split"><tbody>${rows.map((x) => html`<tr><td>${x.label}</td><td class="r">${PO.money(x.amt)}</td></tr>`)}<tr class="tot"><td>${label}</td><td class=${'r ' + (tone || '')}>${PO.money(total)}</td></tr></tbody></table>`;
    const s = pay.structure;
    return html`<div class="col gap-16">
      <${PO.KpiStrip} items=${[
        { label: IN ? 'Annual CTC' : 'Annual pay', value: PO.money(IN ? p.ctc : p.annualGross), sub: IN ? `${PO.money(Math.round(p.ctc / 12))} a month` : rateLine },
        { label: 'Gross this period', value: PO.money(pay.gross), sub: P.company.period },
        { label: 'Net pay, draft', value: PO.money(pay.net), sub: `${PO.money(pay.dedTotal)} deducted. Paid ${P.company.payBy}.`, bar: [{ v: pay.net, k: 'ok', title: 'net pay' }, { v: pay.dedTotal, k: 'mute', title: 'deductions' }] },
        { label: 'Employer cost', value: PO.money(pay.gross + pay.erTotal), sub: `Includes ${PO.money(pay.erTotal)} employer contributions` },
      ]} />
      <div class="grid g-3">
        <${Card} icon="Banknote" accent="green" title="Earnings" sub=${P.company.period}>${list(pay.earn, pay.gross, 'Gross pay')}</${Card}>
        <${Card} icon="Receipt" accent="amber" title="Deductions">${list(pay.ded, pay.dedTotal, 'Total deductions')}<div class="row mt-12" style="padding-top:10px;border-top:1px solid var(--border)"><b class="w-600">Net pay</b><b class="right t-lg tnum" style="font-family:var(--num)">${PO.money(pay.net)}</b></div></${Card}>
        <${Card} icon="Building2" accent="teal" title="Employer contributions" sub="Not deducted from pay">${list(pay.er, pay.erTotal, 'Total employer')}</${Card}>
      </div>
      <div class="grid g-main">
        <${Card} icon="ChartColumn" accent="green" title="Net pay history" sub=${`${shown.length} ${IN ? 'months' : 'periods'}`}>
          <${PO.Charts.Line} labels=${shown.map((h) => short(h.label))} series=${[{ name: 'Net pay', data: shown.map((h, i) => Math.round(i === shown.length - 1 ? pay.net : scale(h))) }]} height=${180} fmt=${(v) => PO.money(v)} yFmt=${(v) => PO.compactMoney(v)} />
        </${Card}>
        <${Card} icon="Layers" accent="violet" title=${IN ? 'Salary structure' : 'Pay setup'}>
          ${IN ? html`<${KV} items=${[['Basic', html`${PO.money(s.basic)} <span class="faint">(${Math.round((s.basic / s.total) * 100)}%)</span>`], ['HRA', PO.money(s.hra)], ['Special allowance', PO.money(s.special)], ['Monthly wages', PO.money(s.total)], ['OT rate', role.ot ? `${PO.money(role.ot)} an hour` : 'Not eligible'], ['PF / ESI', `PF yes, ESI ${s.total <= 21000 ? 'yes' : 'no'}`]]} />
            ${p.flag ? html`<div class="mt-12"><${Callout} tone="red" icon="TriangleAlert" title="Basic is under 50% of wages" action=${html`<${Button} size="sm" onClick=${() => PO.go('compliance')}>Fix</${Button}>`}>Under the Labour Codes, allowances above 50% count as wages for PF and gratuity.</${Callout}></div>` : html`<div class="mt-12"><${Status} s="Compliant" /> <span class="faint t-sm">Meets the 50% wage rule</span></div>`}`
          : US ? html`<${KV} items=${[['Pay', rateLine], ['Overtime', role.rate || p.flag ? '1.5× after 40 h a week' : 'Exempt'], ['Tips', role.tips ? 'Card tips through payroll' : '—'], ['401(k)', p.k401 ? '4%, with 3% company match' : 'Not enrolled'], ['W-4', p.ids.w4], ['State tax', 'None (Texas)']]} />`
          : html`<${KV} items=${[['Pay', rateLine], ['Tax code', p.ids.taxCode], ['NI category', 'A'], ['Pension', 'NEST, 5% plus 3% employer'], ['Night premium', p.shift === 'C' ? '£1.50 an hour' : '—'], ['NLW check', role.rate && role.rate >= NLW ? 'Compliant' : '—']]} />`}
        </${Card}>
      </div>
      <div class="grid g-main">
        <${Card} icon="FileText" accent="blue" title="Payslips" flush actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => PO.fakeDownload(`${p.name} payslips (${IN ? 'FY 2026-27' : '2026'}).zip`)}>Download all</${Button}>`}>
          <div class="list">${shown.slice().reverse().slice(0, 6).map((h, i) => html`<a class="list-item clickable" href=${PO.href(`payslips/${p.id}?run=${h.id}`)}><span class="grow"><b class="w-550">${h.label.replace('*', '')}</b><small class="faint" style="display:block">${h.id}</small></span><span class="tnum w-600">${PO.money(i === 0 ? pay.net : Math.round(scale(h)))}</span><${Status} s=${h.status} /><${Icon} n="ChevronRight" size=${14} cls="faint" /></a>`)}</div>
        </${Card}>
        <${Card} icon="Landmark" accent="teal" title="Bank">
          ${p.bank && p.bank.status !== 'missing' ? html`<div class="row"><b class="w-600">${p.bank.name}</b><span class="right"><${Status} s="Verified" /></span></div><div class="faint tnum mt-4">${p.bank.acct}</div>` : html`<${Badge} tone="red" dot>Missing</${Badge}>`}
          <div class="divider"></div>
          <${KV} items=${[['Paid by', IN ? `NEFT from ${P.company.short}’s HDFC account` : US ? 'Direct deposit (ACH)' : 'BACS'], ['Next pay date', P.company.payBy], [P.id === 'in' ? 'Advance / loan' : 'Advances', (P.advances || []).find((a) => a.who === p.id) ? PO.money((P.advances || []).find((a) => a.who === p.id).emi) + ' a period' : 'None']]} />
        </${Card}>
      </div>
    </div>`;
  }

  /* ---------- Time ---------- */
  function TimeTab({ p, att }) {
    const P = PO.P();
    const [mon, setMon] = useState(P.id === 'in' ? 8 : 9);
    const ev = useMemo(() => PX.calEvents(P, att), [att]);
    const s = att.summary;
    const sh = PO.shiftOf(p.shift);
    const site = PO.site(p.site) || {};
    const unit = P.id === 'in' ? 'days' : 'shifts';
    return html`<div class="col gap-16">
      <div class="ppl-sum">${[['Present', `${s.present}`, unit], ['Absent', `${s.absent}`, P.id === 'in' ? 'loss of pay' : 'unpaid'], [PX.unitLabel(P), `${s.leave}`, 'days'], ['Week offs', `${s.off}`, 'days'], ['Overtime', `${s.ot} h`, p.pay.otPay ? PO.money(p.pay.otPay) : '—'], [P.unitWords.work, `${PO.num(p.pay.work)}`, P.id === 'in' ? `of ${P.unitWords.days}` : 'hours']].map(([l, v, sub]) => html`<div><small>${l}</small><b>${v}</b> <span class="faint t-xs">${sub}</span></div>`)}</div>
      <div class="grid g-main">
        <${Card} title=${`${PO.MONS[mon]} 2026`} sub=${`Pay period ${P.company.period}`} actions=${html`<${Segmented} options=${[[8, 'Sep'], [9, 'Oct']]} value=${mon} onChange=${setMon} />`}>
          <${MonthCal} year=${2026} month=${mon} events=${ev} maxEv=${2} onDay=${(d) => { const x = att.day[d]; if (x) PO.toast(`${PO.date(d, { weekday: true })}: ${x.s === 'P' ? (x.missed ? 'missed punch' : 'present') + (x.ot ? `, ${x.ot} h overtime` : '') : x.s === 'A' ? 'absent' : x.s === 'L' ? 'on leave' : x.s === 'H' ? x.name : x.s === 'S' ? 'shift not started' : 'week off'}`, { icon: 'CalendarDays' }); }} />
          <div class="ppl-legend mt-12">${[['var(--green-soft)', 'Present'], ['var(--rose-soft)', 'Absent'], ['var(--blue-soft)', PX.unitLabel(P)], ['var(--slate-soft)', 'Week off'], ['var(--amber-soft)', 'Holiday / exception'], ['var(--brand-soft)', 'Overtime']].map(([c, l]) => html`<span><i style=${`background:${c}`}></i>${l}</span>`)}</div>
        </${Card}>
        <div class="col gap-16">
          <${Card} icon="Clock" accent="blue" title="Shift and post">
            <${KV} items=${[['Shift', html`<${ShiftChip} k=${p.shift} />`], ['Hours', sh.time], [P.id === 'us' ? 'Location' : 'Site', site.name], ['Post', p.post || '—'], ['Week off', att.offs.map((d) => PO.DAYS[d]).join(', ')], ['Clock-in', P.id === 'in' ? 'Site QR at the gate, or the portal with location' : P.id === 'us' ? 'Store kiosk, or the portal with location' : 'Employee portal with geofence']]} />
          </${Card}>
          <${Card} icon="TriangleAlert" accent="amber" title="Exceptions this period">
            ${s.missed || s.absent ? html`<div class="col" style="gap:10px">
              ${p.missed ? html`<div class="row t-sm"><${Badge} tone="amber" dot>Missed punch</${Badge}><span class="grow">${PO.date(PX.parseDay(p.missed), { short: true, weekday: true })}</span><${Button} size="sm" onClick=${() => PO.go('approvals')}>Review</${Button}></div>` : null}
              ${Object.entries(att.day).filter(([d, x]) => x.s === 'A' && d >= att.period[0] && d <= att.period[1]).map(([d]) => html`<div class="row t-sm"><${Badge} tone="red" dot>${P.id === 'in' ? 'LOP' : 'Absent'}</${Badge}><span class="grow">${PO.date(d, { short: true, weekday: true })}</span><${Button} size="sm" kind="ghost" onClick=${() => PO.toast(`Regularisation request sent to ${p.first}`, { icon: 'Send' })}>Regularise</${Button}></div>`)}
            </div>` : html`<${Empty} icon="CircleCheck" title="All clear" text="No missed punches or unplanned absences this period." />`}
          </${Card}>
        </div>
      </div>
    </div>`;
  }

  /* ---------- Leave ---------- */
  function LeaveTab({ p }) {
    const P = PO.P();
    const reqs = P.leaveRequests.filter((l) => l.who === p.id);
    const tone = { blue: 'var(--blue-solid)', rose: 'var(--rose)', green: 'var(--green-solid)', amber: 'var(--amber-solid)', slate: 'var(--slate)' };
    return html`<div class="col gap-16">
      <div class="row"><span class="muted">${PO.leaveType(PX.mainLeave(P)).accrual}. Balances as of ${PO.date(TODAY)}.</span><span class="right row"><${Button} onClick=${() => PO.toast('Balance adjustment logged. Add a reason in the audit log.', { icon: 'SlidersHorizontal' })}>Adjust balance</${Button}><${Button} kind="primary" onClick=${() => PO.go(`leave?new=1&who=${p.id}`)}>Apply on behalf</${Button}></span></div>
      <div class=${'grid g-' + Math.min(5, P.leaveTypes.length)}>${P.leaveTypes.map((t) => { const b = (p.leave || {})[t.key] || { taken: 0 }; const quota = b.quota; return html`<div class="card ppl-bal">
        <div class="row"><i style=${`width:8px;height:8px;border-radius:50%;background:${tone[t.color] || 'var(--brand)'}`}></i><b class="w-600 t-sm">${t.name}</b><span class="right faint t-xs">${t.short}</span></div>
        ${quota == null ? html`<div><span class="big">${PX.fmtLeave(P, t.key, b.taken)}</span> <span class="faint t-sm">taken</span></div><div class="faint t-xs">${t.accrual}</div>`
        : html`<div><span class="big">${PO.num(b.balance)}</span> <span class="faint t-sm">of ${PX.fmtLeave(P, t.key, quota)} left</span></div><${Progress} value=${quota ? (b.taken / quota) * 100 : 0} tone=${b.balance === 0 ? 'amber' : ''} /><div class="row faint t-xs"><span>${PX.fmtLeave(P, t.key, b.taken)} taken${b.pending ? `, ${b.pending} pending` : ''}</span><span class="right">${t.carry}</span></div>`}
      </div>`; })}</div>
      ${reqs.length ? html`<${DataTable} rows=${reqs} compact pageSize=${10} exportName=${`leave-${p.id}`} columns=${[
        { key: 'type', label: 'Type', render: (l) => PO.leaveType(l.type).name, sort: (l) => l.type },
        { key: 'from', label: 'Dates', render: (l) => `${PO.date(l.from, { short: true })}${l.days > 1 ? ' – ' + PO.date(l.to, { short: true }) : ''}`, sort: (l) => l.from },
        { key: 'days', label: P.id === 'us' ? 'Hours' : 'Days', align: 'r', render: (l) => html`<span class="tnum">${l.hours || l.days}</span>` },
        { key: 'reason', label: 'Reason' },
        { key: 'channel', label: 'Via' },
        { key: 'approver', label: 'Approver', render: (l) => (P.byId[l.approver] ? P.byId[l.approver].name : '—') },
        { key: 'status', label: 'Status', render: (l) => html`<${Status} s=${l.status} />` },
      ]} initialSort=${{ key: 'from', dir: 'desc' }} />` : html`<div class="card"><${Empty} icon="Palmtree" title="No requests this year" text=${`${p.first} hasn’t applied for any ${PX.unitLabel(P).toLowerCase()} yet.`} /></div>`}
    </div>`;
  }

  /* ---------- Documents ---------- */
  function DocPreviewModal({ p, d, onClose }) {
    const P = PO.P();
    return html`<${Modal} open size="lg" title=${d.name} icon="FileText" onClose=${onClose} footer=${html`<span class="faint t-sm" style="margin-right:auto">${d.size}, uploaded ${d.uploaded ? PO.date(d.uploaded) : '—'} by ${d.by || '—'}</span><${Button} icon="Download" onClick=${() => PO.fakeDownload(`${d.name} – ${p.name}.pdf`)}>Download</${Button}><${Button} kind="primary" onClick=${onClose}>Close</${Button}>`}>
      <div style="background:var(--surface-3);border-radius:var(--r-lg);padding:22px;display:grid;place-items:center">
        <div class="card" style="width:min(460px,100%);padding:24px 26px;box-shadow:var(--shadow-md)">
          <div class="row" style="border-bottom:2px solid var(--brand);padding-bottom:10px;margin-bottom:14px"><b class="w-600">${/card|Aadhaar|PAN|I-9|passbook|cheque|DBS|Right/i.test(d.name) ? d.name : P.company.name}</b><span class="right faint t-xs mono">${p.id}</span></div>
          <div class="col" style="gap:8px">${[['Name', p.name], ['Document', d.name], ['Issued', d.uploaded ? PO.date(d.uploaded) : '—'], ['Reference', `${d.name.split(' ')[0].toUpperCase().slice(0, 4)}-${p.id.slice(-4)}-${(d.size || '').replace(/\D/g, '').slice(0, 3)}`]].map(([k, v]) => html`<div class="row t-sm"><span class="faint" style="width:90px">${k}</span><b class="w-500">${v}</b></div>`)}</div>
          <div class="skel" style="height:10px;margin-top:18px;width:92%"></div><div class="skel" style="height:10px;margin-top:8px;width:78%"></div><div class="skel" style="height:10px;margin-top:8px;width:85%"></div>
          <div class="row" style="margin-top:20px"><${Badge} tone=${PO.toneOf(d.status)} dot>${d.status}</${Badge}><span class="right faint t-xs">Watermarked for ${P.company.short} HR</span></div>
        </div>
      </div>
    </${Modal}>`;
  }
  function DocsTab({ p, docs, docSt, setDocSt }) {
    const P = PO.P();
    const [prev, setPrev] = useState(null);
    const set = (d, status, msg) => { const before = docSt; setDocSt({ ...docSt, [p.id + '|' + d.name]: { status, uploaded: status === 'Pending review' || status === 'Verified' ? (d.uploaded || TODAY) : d.uploaded, by: status === 'Pending review' ? 'HR' : d.by, size: d.size === '—' || !d.size ? '412 KB' : d.size } }); PO.toast(msg, { action: { label: 'Undo', run: () => setDocSt(before) } }); };
    const done = docs.filter((d) => d.status === 'Verified').length;
    const gaps = docs.filter(PX.docGap);
    return html`<div class="grid g-main">
      <${Card} icon="FolderOpen" accent="blue" title="Documents" sub=${`${done} of ${docs.length} verified`} flush actions=${html`${gaps.length ? html`<${Button} size="sm" onClick=${() => { const before = docSt; const n = { ...docSt }; gaps.forEach((d) => (n[p.id + '|' + d.name] = { status: 'Requested' })); setDocSt(n); PO.toast(`${PO.plural(gaps.length, 'document')} requested from ${p.first} by email and SMS`, { icon: 'Send', action: { label: 'Undo', run: () => setDocSt(before) } }); }}>Request all missing</${Button}>` : null}<${Button} size="sm" kind="ghost" onClick=${() => PO.toast('Choose a file to upload. It is checked for blur and expiry.', { icon: 'Upload' })}>Upload</${Button}>`}>
        <div style="padding:12px 16px;border-bottom:1px solid var(--border)"><${Progress} value=${(done / Math.max(1, docs.length)) * 100} tone=${done === docs.length ? 'green' : ''} label=${`${Math.round((done / Math.max(1, docs.length)) * 100)}%`} /></div>
        ${docs.map((d) => html`<div class="ppl-doc">
          <span class="ppl-file">${d.uploaded ? 'PDF' : html`<${Icon} n="FilePlus2" size=${15} />`}</span>
          <div class="grow" style="min-width:0"><b class="w-550 ellipsis" style="display:block">${d.name}</b><small class="faint">${d.uploaded ? `${d.size}, uploaded ${PO.date(d.uploaded, { short: true })} by ${d.by === 'HR' ? P.byId[P.hrId].name : d.by === 'Employee' ? p.first : d.by || '—'}` : d.status === 'Requested' ? `Requested by email, waiting for ${p.first}` : 'Not uploaded'}</small></div>
          <${Status} s=${d.status} />
          <div class="row" style="gap:4px;flex:none">
            ${d.uploaded ? html`<${IconButton} size="sm" icon="Eye" title="Preview" onClick=${() => setPrev(d)} />` : null}
            ${d.status === 'Pending review' ? html`<${Button} size="sm" kind="primary" onClick=${() => set(d, 'Verified', `${d.name} verified`)}>Verify</${Button}>` : null}
            ${PX.docGap(d) || d.status === 'Expiring soon' ? html`<${Button} size="sm" onClick=${() => set(d, 'Requested', `${d.status === 'Requested' ? 'Reminder sent' : 'Requested'}: ${d.name} from ${p.first} by email and SMS`)}>${d.status === 'Requested' ? 'Remind' : 'Request'}</${Button}>` : null}
            ${PX.docGap(d) ? html`<${IconButton} size="sm" icon="Upload" title="Upload for them" onClick=${() => set(d, 'Pending review', `${d.name} uploaded. Verify it to complete.`)} />` : null}
          </div>
        </div>`)}
      </${Card}>
      <div class="col gap-16">
        <${Card} icon="ShieldCheck" accent="teal" title="Compliance">
          <div><div><b class="w-600">${gaps.length ? `${PO.plural(gaps.length, 'document')} outstanding` : 'File complete'}</b><div class="faint t-sm mt-4">${PO.isIN() ? 'Police verification is required under PSARA for guards.' : P.id === 'us' ? 'Form I-9 must be retained for 3 years after hire.' : 'Right to work must be checked before employment starts.'}</div></div></div>
        </${Card}>
        <${Card} icon="FileSignature" accent="violet" title="Generate a letter">
          <div class="col" style="gap:6px">${(P.id === 'in' ? ['Salary certificate', 'Address proof letter', 'Experience letter'] : P.id === 'us' ? ['Employment verification', 'Pay verification', 'Reference letter'] : ['Employment reference', 'Proof of earnings', 'Mortgage reference']).map((t) => html`<button class="ppl-opt" onClick=${() => PO.go(`documents?tab=letters&who=${p.id}`)}><span class="grow">${t}</span><${Icon} n="ChevronRight" size=${14} cls="faint" /></button>`)}</div>
        </${Card}>
      </div>
      ${prev ? html`<${DocPreviewModal} p=${p} d=${prev} onClose=${() => setPrev(null)} />` : null}
    </div>`;
  }
  PX.DocPreviewModal = DocPreviewModal;

  /* ---------- Assets ---------- */
  function AssetsTab({ p, assets, assetSt, setAssetSt, onAssign }) {
    const P = PO.P();
    const upd = (a, patch, msg) => { const before = assetSt; setAssetSt({ ...assetSt, [a.tag]: { ...(assetSt[a.tag] || {}), ...patch } }); PO.toast(msg, { action: { label: 'Undo', run: () => setAssetSt(before) } }); };
    return html`<div class="col gap-16">
      <div class="row"><span class="muted">${PO.plural(assets.length, 'item')} worth ${PO.money(assets.reduce((t, a) => t + a.value, 0))} issued to ${p.first}.</span><span class="right row"><${Button} kind="primary" onClick=${onAssign}>Assign asset</${Button}></span></div>
      ${assets.length ? html`<${DataTable} rows=${assets} rowKey=${(a) => a.tag} compact columns=${[
        { key: 'tag', label: 'Tag', render: (a) => html`<span class="tnum faint">${a.tag}</span>` },
        { key: 'name', label: 'Item', render: (a) => html`<b class="w-550">${a.name}</b>` },
        { key: 'issued', label: 'Issued', render: (a) => PO.date(a.issued, { short: true }), sort: (a) => a.issued },
        { key: 'cond', label: 'Condition', render: (a) => html`<${Status} s=${a.cond} />` },
        { key: 'value', label: 'Value', align: 'r', render: (a) => html`<span class="tnum">${PO.money(a.value)}</span>` },
        { key: 'act', label: '', sort: false, csv: false, render: (a) => html`<span class="row" style="gap:4px;justify-content:flex-end" onClick=${(e) => e.stopPropagation()}><${Button} size="sm" onClick=${() => upd(a, { who: null, returnedOn: TODAY }, `${a.name} returned to store`)}>Return</${Button}><${Menu} align="right" trigger=${html`<${IconButton} size="sm" icon="Ellipsis" title="More" />`} items=${[{ label: 'Report damage', icon: 'Wrench', onClick: () => upd(a, { cond: 'Needs repair' }, `${a.tag} marked as needs repair`) }, { label: 'Mark as lost', icon: 'CircleAlert', danger: true, onClick: () => upd(a, { cond: 'Lost', who: null }, `${a.tag} marked lost. Recovery of ${PO.money(a.value)} can be added to payroll.`) }, { label: 'Print handover form', icon: 'Printer', onClick: () => PO.fakeDownload(`Asset handover ${a.tag}`) }]} /></span>` },
      ]} exportName=${`assets-${p.id}`} />` : html`<div class="card"><${Empty} icon="Package" title="No assets issued" text=${`Issue ${P.vocab.assetTypes[p.role] ? P.vocab.assetTypes[p.role].slice(0, 2).join(' and ').toLowerCase() : 'items'} from the store.`} action=${html`<${Button} kind="primary" icon="Plus" onClick=${onAssign}>Assign asset</${Button}>`} /></div>`}
      <p class="faint t-sm">Standard kit for this role: ${(P.vocab.assetTypes[p.role] || []).join(', ').toLowerCase()}. Unreturned items are deducted in the final settlement.</p>
    </div>`;
  }

  /* ---------- Performance ---------- */
  function PerfTab({ p }) {
    const P = PO.P();
    const r = PO.seeded('perfnote' + P.id + p.id);
    const mgr = P.byId[p.manager] || P.byId[P.topId];
    const notes = [
      [mgr, P.id === 'in' ? `${p.first} handled the gate during the client audit without a single gap in the visitor log.` : P.id === 'us' ? `${p.first} kept the line moving during the Saturday rush and trained a new hire on the bar.` : `${p.first}'s ward passed the infection-control audit with no actions.`, addDays(TODAY, -r.int(10, 40))],
      [P.byId[P.hrId], `Completed the ${P.id === 'in' ? 'fire safety and first aid' : P.id === 'us' ? 'food handler refresher' : 'COSHH refresher'} training ahead of schedule.`, addDays(TODAY, -r.int(50, 120))],
    ];
    const label = ['', 'Needs improvement', 'Below expectations', 'Meets expectations', 'Exceeds expectations', 'Outstanding'][p.rating] || '—';
    return html`<div class="grid g-main">
      <div class="col gap-16">
        <${Card} icon="Target" accent="violet" title=${P.reviewCycle.name} sub=${`${P.reviewCycle.stage}, closes ${PO.date(P.reviewCycle.closes, { short: true })}`} actions=${html`${p.reviewStatus === 'Not started' ? html`<${Button} size="sm" onClick=${() => PO.toast(`Nudge sent to ${p.first} by email and SMS`, { icon: 'Send' })}>Nudge</${Button}>` : null}<${Button} size="sm" onClick=${() => PO.go('performance')}>Open cycle</${Button}>`}>
          <${Steps} steps=${[['Self review', p.reviewStatus === 'Not started' ? 'Not started' : 'Submitted'], ['Manager review', p.reviewStatus === 'Manager review' ? 'In progress' : 'Waiting'], ['Calibration', 'Nov'], ['Shared', 'Dec']]} current=${p.reviewStatus === 'Not started' ? 0 : 1} done=${p.reviewStatus === 'Not started' ? 0 : 1} />
        </${Card}>
        <${Card} icon="Flag" accent="green" title="Goals" sub=${PO.plural((p.goals || []).length, 'goal')}>
          ${(p.goals || []).length ? html`<div class="col gap-16">${p.goals.map((g) => html`<div><div class="row t-sm" style="margin-bottom:6px"><b class="w-550 grow">${g.t}</b><${Status} s=${g.pct >= 100 ? 'Done' : g.pct >= 60 ? 'On track' : g.pct >= 30 ? 'In progress' : 'Not started'} /></div><${Progress} value=${g.pct} tone=${g.pct >= 100 ? 'green' : g.pct < 40 ? 'amber' : ''} label=${g.pct + '%'} /></div>`)}</div>` : html`<${Empty} icon="Target" title="No goals yet" />`}
        </${Card}>
        <${Card} icon="MessagesSquare" accent="blue" title="Feedback">
          <${Timeline} items=${notes.map(([who, t, d]) => ({ icon: 'MessageSquare', tone: '', title: who.name, sub: who.title, right: PO.date(d, { short: true }), body: html`<p class="muted">${t}</p>` }))} />
        </${Card}>
      </div>
      <div class="col gap-16">
        <${Card} icon="Star" accent="amber" title="Last rating">
          ${p.rating ? html`<div class="row gap-12"><span class="hero-num">${p.rating}.0</span><div><${Stars} n=${p.rating} /><div class="faint t-sm mt-4">${label}</div></div></div>` : html`<span class="faint">Not rated yet</span>`}
          <div class="divider"></div>
          <${KV} items=${[['Review status', html`<${Status} s=${p.reviewStatus} />`], ['Reviewer', mgr.name], ['Last cycle', P.id === 'in' ? 'H2 FY25-26' : 'Spring 2026']]} />
        </${Card}>
        <${Card} icon="GraduationCap" accent="teal" title="Skills and training">
          <div class="row wrap" style="gap:6px">${(P.id === 'in' ? ['Access control', 'Fire safety', 'First aid', 'Visitor management', 'CCTV basics'] : P.id === 'us' ? ['Espresso', 'Food safety', 'Cash handling', 'Latte art', 'Opening checklist'] : ['COSHH', 'Infection control', 'Floor care', 'Manual handling', 'Lone working']).slice(0, 3 + (p.rating || 3) % 3).map((s) => html`<span class="tag">${s}</span>`)}</div>
        </${Card}>
      </div>
    </div>`;
  }

  /* ---------- Activity ---------- */
  function ActivityTab({ p }) {
    const P = PO.P();
    const [f, setF] = useState('all');
    const all = PX.activity(P, p);
    const kinds = [['all', 'All'], ['Palmtree', PX.unitLabel(P)], ['FileCheck2', 'Documents'], ['History', 'Changes'], ['Package', 'Assets']];
    const list = f === 'all' ? all : all.filter((a) => a.icon === f);
    return html`<${Card} icon="History" accent="blue" title="Activity" sub="Audit trail of changes, requests and documents" actions=${html`<${Segmented} options=${kinds} value=${f} onChange=${setF} />`}>
      ${list.length ? html`<${Timeline} items=${list.slice(0, 40).map((a) => ({ icon: a.icon, tone: a.tone, title: a.title, sub: a.sub, right: PO.date(a.date, { short: true }) }))} />` : html`<${Empty} icon="History" title="Nothing here" text="No activity of this kind yet." />`}
    </${Card}>`;
  }

  /* =====================================================================
     Routes
     ===================================================================== */
  function PeopleRoute({ params, query }) {
    return params[0] ? html`<${Profile} params=${params} query=${query} />` : html`<${Directory} query=${query} />`;
  }
  PO.route('people', PeopleRoute, { title: 'Employees' });

  const prev = PO.crumb;
  PO.crumb = (r) => {
    if (r.name === 'people' && r.params[0]) { const p = PO.P().byId[r.params[0]]; return p ? p.name : nameCache[r.params[0]] || r.params[0]; }
    return prev ? prev(r) : null;
  };
})();
