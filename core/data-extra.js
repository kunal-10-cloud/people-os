/* People OS: shared records layered on top of each company's people (core/data.js).
   Everything here is deterministic, so every screen of a company reads the same records.
   Modules may add their own module-local data with PO.seeded(); anything two modules both show lives here. */
(function () {
  const { DATA } = window.PO;

  /* ---------- deterministic helpers ---------- */
  function seeded(seedText) {
    let h = 2166136261;
    for (const c of String(seedText)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    let s = h >>> 0 || 1;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    return {
      rnd,
      pick: (a) => a[Math.floor(rnd() * a.length)],
      int: (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)),
      chance: (p) => rnd() < p,
      shuffle: (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
    };
  }

  /* Dates are ISO strings (YYYY-MM-DD). "Today" in every company is Tue 6 Oct 2026. */
  const TODAY = '2026-10-06';
  const iso = (d) => d.toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  function parseJoined(text, r) {
    const t = String(text).replace(',', '');
    let m = t.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/); if (m) return iso(new Date(Date.UTC(+m[3], MON[m[2].toLowerCase()], +m[1])));
    m = t.match(/^([A-Za-z]{3}) (\d{1,2}) (\d{4})$/); if (m) return iso(new Date(Date.UTC(+m[3], MON[m[1].toLowerCase()], +m[2])));
    m = t.match(/^([A-Za-z]{3}) (\d{4})$/); if (m) return iso(new Date(Date.UTC(+m[2], MON[m[1].toLowerCase()], r.int(1, 28))));
    return '2023-01-15';
  }
  const monthsBetween = (a, b) => { const x = new Date(a), y = new Date(b); return (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + (y.getUTCMonth() - x.getUTCMonth()); };

  /* ---------- per-country vocabulary ---------- */
  const COUNTRY = {
    in: {
      domain: 'sentinelfs.in', phone: (r) => `+91 9${r.int(100, 999)}${r.int(10, 99)} ${r.int(10000, 99999)}`,
      dept: { guard: 'Security', lady: 'Security', sup: 'Operations', hk: 'Housekeeping', tech: 'Facility services', office: 'Head office' },
      grade: { guard: 'S1', lady: 'S1', hk: 'S1', tech: 'S2', sup: 'M1', office: 'M2' },
      type: (p) => (p.contractor ? 'Contract' : p.role === 'office' ? 'Full-time' : 'Full-time'),
      ids: (p, r) => ({ pan: `${'ABCDEFGHJKLMNPQRSTUVWXYZ'[r.int(0, 23)]}${'ABCDEFGHJKLMNPQRSTUVWXYZ'[r.int(0, 23)]}${'ABCDEFGHJKLMNPQRSTUVWXYZ'[r.int(0, 23)]}P${p.name.split(' ')[1][0]}${r.int(1000, 9999)}${'ABCDEFGHJKLMNPQRSTUVWXYZ'[r.int(0, 23)]}`, aadhaar: `XXXX XXXX ${r.int(1000, 9999)}`, uan: `1012 4471 ${p.id.slice(-4)}`, esic: `31-00-${r.int(100000, 999999)}-000-0001` }),
      bank: (r) => r.pick(['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Bank of Maharashtra', 'Kotak Mahindra Bank', 'Axis Bank']),
      cities: ['Pune', 'Pimpri-Chinchwad', 'Hadapsar', 'Wakad', 'Kharadi', 'Kothrud', 'Hinjewadi'],
      blood: ['B+', 'O+', 'A+', 'AB+', 'O−', 'B−'],
      leaveTypes: [
        { key: 'cl', name: 'Casual leave', short: 'CL', quota: 8, unit: 'days', color: 'blue', accrual: 'Credited 1 Jan', carry: 'Lapses on 31 Dec' },
        { key: 'sl', name: 'Sick leave', short: 'SL', quota: 7, unit: 'days', color: 'rose', accrual: 'Credited 1 Jan', carry: 'Carry forward up to 14' },
        { key: 'el', name: 'Earned leave', short: 'EL', quota: 18, unit: 'days', color: 'green', accrual: '1 day per 20 days worked', carry: 'Carry forward up to 45, encashable' },
        { key: 'co', name: 'Compensatory off', short: 'CO', quota: 0, unit: 'days', color: 'amber', accrual: 'Earned for working a holiday', carry: 'Expires in 60 days' },
        { key: 'lop', name: 'Loss of pay', short: 'LOP', quota: null, unit: 'days', color: 'slate', accrual: 'Unpaid', carry: '—' },
      ],
      holidays: [['2026-01-26', 'Republic Day'], ['2026-03-04', 'Holi'], ['2026-03-19', 'Gudi Padwa'], ['2026-04-03', 'Good Friday'], ['2026-05-01', 'Maharashtra Day'], ['2026-08-15', 'Independence Day'], ['2026-08-27', 'Ganesh Chaturthi'], ['2026-10-02', 'Gandhi Jayanti'], ['2026-10-20', 'Dussehra'], ['2026-11-09', 'Diwali (Lakshmi Puja)'], ['2026-11-10', 'Diwali (Balipratipada)'], ['2026-12-25', 'Christmas']],
      docTypes: ['Appointment letter', 'Aadhaar card', 'PAN card', 'Bank passbook / cancelled cheque', 'Police verification', 'PF nomination (Form 2)', 'ESI declaration', 'Leave policy acknowledgement'],
      assetTypes: { guard: ['Uniform set (2 pairs)', 'ID card', 'Walkie-talkie', 'Torch'], lady: ['Uniform set (2 pairs)', 'ID card', 'Walkie-talkie'], hk: ['Uniform set (2 pairs)', 'ID card'], tech: ['Uniform set (2 pairs)', 'ID card', 'Tool kit', 'Android phone'], sup: ['ID card', 'Android phone', 'Walkie-talkie', 'Bike fuel card'], office: ['ID card', 'Laptop', 'Access card'] },
      expenseCats: ['Travel', 'Fuel', 'Site supplies', 'Mobile recharge', 'Food (night duty)', 'Training'],
      ctcMult: 12, payPeriods: 12,
    },
    us: {
      domain: 'cornerandcrust.com', phone: (r) => `(512) ${r.int(200, 989)}-${r.int(1000, 9999)}`,
      dept: { barista: 'Cafés', lead: 'Cafés', sup: 'Cafés', baker: 'Production', porter: 'Production', driver: 'Logistics', office: 'Head office' },
      grade: { barista: 'H1', porter: 'H1', baker: 'H2', driver: 'H2', lead: 'H3', sup: 'S1', office: 'S2' },
      type: (p) => (p.role === 'driver' || p.role === 'porter' ? 'Part-time' : 'Full-time'),
      ids: (p, r) => ({ ssn: `•••-••-${r.int(1000, 9999)}`, i9: 'Verified', w4: p.joiner ? 'Missing' : '2026 W-4 on file' }),
      bank: (r) => r.pick(['Chase', 'Wells Fargo', 'Bank of America', 'Frost Bank', 'Navy Federal CU', 'Capital One']),
      cities: ['Austin', 'Round Rock', 'Pflugerville', 'Cedar Park', 'Buda', 'Manor'],
      blood: null,
      leaveTypes: [
        { key: 'pto', name: 'Paid time off', short: 'PTO', quota: 80, unit: 'hours', color: 'blue', accrual: '1 h per 30 h worked', carry: 'Carry over up to 40 h' },
        { key: 'sick', name: 'Sick time', short: 'Sick', quota: 40, unit: 'hours', color: 'rose', accrual: 'Front-loaded 1 Jan', carry: 'Resets 1 Jan' },
        { key: 'unpaid', name: 'Unpaid leave', short: 'Unpaid', quota: null, unit: 'hours', color: 'slate', accrual: 'Unpaid', carry: '—' },
        { key: 'jury', name: 'Jury duty', short: 'Jury', quota: 24, unit: 'hours', color: 'amber', accrual: 'As needed', carry: '—' },
      ],
      holidays: [['2026-01-01', 'New Year’s Day'], ['2026-05-25', 'Memorial Day'], ['2026-07-03', 'Independence Day (observed)'], ['2026-09-07', 'Labor Day'], ['2026-11-26', 'Thanksgiving'], ['2026-12-24', 'Christmas Eve (half day)'], ['2026-12-25', 'Christmas Day']],
      docTypes: ['Offer letter', 'Form I-9', 'Form W-4', 'Direct deposit form', 'Food handler card', 'Employee handbook acknowledgement', 'Arbitration agreement'],
      assetTypes: { barista: ['Apron', 'Name badge', 'Door key fob'], lead: ['Apron', 'Name badge', 'Store keys', 'Square POS manager card'], sup: ['Store keys', 'iPad (scheduling)', 'Name badge'], baker: ['Chef coat (2)', 'Non-slip shoes stipend'], porter: ['Chef coat (2)'], driver: ['Van keys', 'Fuel card', 'Phone mount'], office: ['MacBook Air', 'Office keys'] },
      expenseCats: ['Mileage', 'Supplies', 'Meals', 'Training', 'Uniforms', 'Phone'],
      ctcMult: 26, payPeriods: 26,
    },
    uk: {
      domain: 'harbourfield.co.uk', phone: (r) => `07${r.int(100, 999)} ${r.int(100000, 999999)}`,
      dept: { cleaner: 'Cleaning', domestic: 'Healthcare cleaning', spec: 'Specialist services', sup: 'Site supervision', office: 'Head office' },
      grade: { cleaner: 'C1', domestic: 'C1', spec: 'C2', sup: 'C3', office: 'O1' },
      type: (p) => (p.u && p.u.hours && p.u.hours < 120 ? 'Part-time' : 'Full-time'),
      ids: (p, r) => ({ ni: `QQ ${r.int(10, 99)} ${r.int(10, 99)} ${r.int(10, 99)} C`, rtw: p.joiner ? 'Share code checked' : 'Checked', taxCode: p.joiner ? '1257L (starter A)' : '1257L' }),
      bank: (r) => r.pick(['Barclays', 'Lloyds', 'NatWest', 'HSBC UK', 'Monzo', 'Santander UK']),
      cities: ['Manchester', 'Salford', 'Stockport', 'Trafford', 'Oldham', 'Bolton'],
      blood: null,
      leaveTypes: [
        { key: 'hol', name: 'Holiday', short: 'Hol', quota: 28, unit: 'days', color: 'blue', accrual: '5.6 weeks pro rata', carry: 'Carry over up to 5 days' },
        { key: 'sick', name: 'Sickness', short: 'Sick', quota: null, unit: 'days', color: 'rose', accrual: 'SSP from day 4', carry: '—' },
        { key: 'comp', name: 'Compassionate', short: 'Comp', quota: 5, unit: 'days', color: 'amber', accrual: 'As needed', carry: '—' },
        { key: 'unpaid', name: 'Unpaid', short: 'Unpaid', quota: null, unit: 'days', color: 'slate', accrual: 'Unpaid', carry: '—' },
      ],
      holidays: [['2026-01-01', 'New Year’s Day'], ['2026-04-03', 'Good Friday'], ['2026-04-06', 'Easter Monday'], ['2026-05-04', 'Early May bank holiday'], ['2026-05-25', 'Spring bank holiday'], ['2026-08-31', 'Summer bank holiday'], ['2026-12-25', 'Christmas Day'], ['2026-12-28', 'Boxing Day (substitute)']],
      docTypes: ['Contract of employment', 'Right to work check', 'P45 / starter checklist', 'Bank details form', 'DBS certificate', 'COSHH training record', 'Handbook acknowledgement'],
      assetTypes: { cleaner: ['Uniform (polo + fleece)', 'ID badge'], domestic: ['Uniform (tunic)', 'ID badge', 'NHS site pass'], spec: ['Uniform (polo + fleece)', 'ID badge', 'Harness kit'], sup: ['ID badge', 'Android phone', 'Site keys'], office: ['Laptop', 'ID badge'] },
      expenseCats: ['Mileage', 'Parking', 'Supplies', 'Training', 'Subsistence', 'Phone'],
      ctcMult: 13, payPeriods: 13,
    },
  };

  const HUES = [12, 28, 42, 145, 168, 190, 205, 222, 248, 268, 290, 330];

  /* Names quoted in scripted moments (cover candidates, roster fillers, who's out, approvals) become real people:
     an unscripted worker at the right site, of the right gender, takes the name. Pay is untouched. */
  function materialize(P) {
    const fixedIds = new Set(Object.keys(P.fixed));
    const used = new Set();
    const genderOf = (first) => (P.names.f.includes(first) ? 'f' : 'm');
    const siteByWord = (w) => (P.sites.find((s) => s.name.toLowerCase().startsWith(String(w).toLowerCase().split(' ')[0])) || {}).id;
    const make = (name, siteId, prefer) => {
      if (!name || P.people.some((p) => p.name === name)) return;
      const g = genderOf(name.split(' ')[0]);
      const pool = P.people.filter((p) => !fixedIds.has(p.id) && !used.has(p.id) && p.role !== 'office' && p.role !== 'sup' && !p.inCharge && p.g === g && (!siteId || p.site === siteId));
      const p = (prefer && pool.find(prefer)) || pool[0];
      if (!p) return;
      used.add(p.id);
      p.name = name; p.initials = name.split(' ').map((w) => w[0]).join('');
    };
    const coverWho = P.byId[P.cover.who];
    P.cover.cands.forEach((c) => make(c.name, P.cover.site, (p) => p.role === coverWho.role && p.shift !== coverWho.shift));
    P.roster.fillers.forEach((n) => make(n, P.roster.site, (p) => p.shift !== 'C'));
    P.outToday.forEach(([n, why, where]) => { if (!/Last day|Left on|left on/i.test(why)) make(n, siteByWord(where)); });
    P.approvals.forEach((a) => a.whoName && make(a.whoName, null));
    // fix scripted locations that name the wrong site for a real person
    P.outToday.forEach((o) => { const p = P.people.find((q) => q.name === o[0]); if (p) o[2] = P.sites.find((s) => s.id === p.site).name; });
  }

  function enrich(P) {
    const X = COUNTRY[P.id];
    const C = P.company;
    materialize(P);
    P.vocab = X;
    P.today = TODAY;
    const top = P.people.find((p) => /Owner|Operations head|Managing director/.test(p.title)) || P.people[0];
    const hr = P.people.find((p) => /HR|payroll/i.test(p.title) && p.id !== top.id) || top;
    P.topId = top.id; P.hrId = hr.id;

    /* every operational site gets a lead: its supervisor, or its longest-serving worker as site in-charge */
    P.sites.forEach((site) => {
      const here = P.people.filter((p) => p.site === site.id && p.role !== 'office');
      if (!here.length) return;
      let lead = here.find((p) => p.role === 'sup') || (P.id === 'us' ? here.find((p) => p.role === 'lead') : null);
      if (!lead) {
        lead = here.slice().sort((a, b) => parseJoined(a.joined, seeded('j' + a.id)).localeCompare(parseJoined(b.joined, seeded('j' + b.id))))[0];
        lead.title = P.id === 'in' ? 'Site in-charge' : P.id === 'uk' ? 'Team leader' : 'Shift lead';
        lead.inCharge = true;
      }
      site.lead = lead.id;
      here.forEach((p) => { if (p.id !== lead.id) p.supervisor = lead.id; });
      lead.supervisor = null;
    });

    /* reporting lines: staff → site supervisor/lead → ops head/owner; office → owner */
    P.people.forEach((p) => {
      if (p.id === top.id) p.manager = null;
      else if (p.role === 'office') p.manager = top.id;
      else if (p.role === 'sup' || p.inCharge || (P.id === 'us' && p.role === 'lead' && p.supervisor == null)) p.manager = top.id;
      else p.manager = p.supervisor && p.supervisor !== p.id ? p.supervisor : top.id;
    });
    // US leads report to the café supervisor at their site when there is one
    P.people.forEach((p) => {
      if (P.id === 'us' && p.role === 'lead') { const s = P.people.find((q) => q.site === p.site && q.role === 'sup'); p.manager = s ? s.id : top.id; }
      if (P.id === 'us' && p.role === 'sup') p.manager = hr.id === top.id ? top.id : top.id;
    });

    P.people.forEach((p) => {
      const r = seeded(P.id + p.id);
      const [first, ...rest] = p.name.split(' ');
      const last = rest.join(' ');
      p.first = first; p.last = last;
      p.dept = X.dept[p.role] || 'Operations';
      p.grade = X.grade[p.role] || '—';
      p.type = X.type(p);
      p.email = `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z.]/g, '') + '@' + X.domain;
      p.phone = X.phone(r);
      p.joinedIso = parseJoined(p.joined, r);
      p.tenureMonths = Math.max(0, monthsBetween(p.joinedIso, TODAY));
      const age = p.role === 'office' ? r.int(29, 52) : r.int(21, 49);
      p.dob = `${2026 - age}-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}`;
      p.age = age;
      p.city = r.pick(X.cities);
      p.blood = X.blood ? r.pick(X.blood) : null;
      p.ids = X.ids(p, r);
      p.bank = { name: X.bank(r), acct: '•••• ' + r.int(1000, 9999), status: p.joiner && P.id === 'in' ? 'missing' : 'verified' };
      p.emergency = { name: `${r.pick(P.names[p.g === 'f' ? 'm' : 'f'])} ${last}`, rel: r.pick(['Spouse', 'Parent', 'Sibling']), phone: X.phone(r) };
      p.hue = HUES[r.int(0, HUES.length - 1)];
      p.status = p.joiner ? 'Probation' : p.exiting ? 'Notice period' : p.tenureMonths < 6 ? 'Probation' : 'Active';
      // annual cost to company / salary
      p.ctc = Math.round((p.pay.gross + p.pay.erTotal) * X.ctcMult);
      p.annualGross = Math.round(p.pay.gross * X.ctcMult);
      p.workMode = p.role === 'office' ? 'Office' : 'On site';
    });

    P.byManager = {};
    P.people.forEach((p) => { if (p.manager) (P.byManager[p.manager] = P.byManager[p.manager] || []).push(p.id); });
    P.depts = [...new Set(P.people.map((p) => p.dept))].map((d) => ({ name: d, count: P.people.filter((p) => p.dept === d).length, head: (P.people.find((p) => p.dept === d && (p.role === 'sup' || p.role === 'office')) || top).id }));

    /* live board: late people whose arrival time has passed count as on duty (same rule as the live board) */
    const curShift = P.shifts.find((s) => s.key === P.current);
    P.live.forEach((l) => {
      const late = P.people.filter((p) => p.site === l.site && p.shift === P.current && P.lateMap[p.id]);
      l.lateIn = late.filter((p) => curShift.from + P.lateMap[p.id] <= C.nowMin).length;
      l.onDuty = l.in + l.lateIn;
    });

    /* ---------- leave ---------- */
    P.leaveTypes = X.leaveTypes;
    P.holidays = X.holidays.map(([date, name]) => ({ date, name, upcoming: date >= TODAY }));
    P.people.forEach((p) => {
      const r = seeded('lv' + P.id + p.id);
      p.leave = {};
      X.leaveTypes.forEach((t) => {
        if (t.quota == null) { p.leave[t.key] = { taken: t.key === 'lop' || t.key === 'unpaid' ? (p.pay.unpaid || 0) : r.int(0, 3), quota: null, balance: null, pending: 0 }; return; }
        const quota = t.key === 'co' ? r.int(0, 2) : p.tenureMonths < 12 ? Math.round(t.quota * Math.max(1, p.tenureMonths) / 12) : t.quota;
        const taken = Math.min(quota, t.unit === 'hours' ? r.int(0, Math.round(quota * 0.7 / 8)) * 8 : r.int(0, Math.round(quota * 0.7)));
        p.leave[t.key] = { quota, taken, balance: quota - taken, pending: 0 };
      });
    });
    // balances quoted in scripted chats, approvals and assistant answers: keep the data in line with the words
    const PIN = { in: { 'EMP-0142': { cl: 5, sl: 6, el: 11 }, 'EMP-0188': { cl: 4 } }, us: { 'CC-1042': { pto: 22 }, 'CC-1011': { pto: 34 } }, uk: { 'HF-2208': { hol: 9 }, 'HF-2201': { hol: 8 } } }[P.id];
    Object.entries(PIN).forEach(([id, bal]) => Object.entries(bal).forEach(([k, b]) => { const l = P.byId[id] && P.byId[id].leave[k]; if (l) { l.balance = b; l.taken = l.quota - b; } }));

    // leave requests: history + upcoming + pending
    const LR = seeded('requests' + P.id);
    const leaveReqs = [];
    const staff = P.people.filter((p) => !p.joiner);
    const reasons = { in: ['Family function', 'Fever', 'Native place visit', 'Child’s school event', 'Medical appointment', 'Festival travel', 'Personal work'], us: ['Family visit', 'Doctor appointment', 'Kid’s recital', 'Moving apartments', 'Out of town', 'Feeling unwell', 'Personal day'], uk: ['Family wedding', 'GP appointment', 'Holiday abroad', 'School half term', 'Feeling unwell', 'Moving house', 'Personal'] }[P.id];
    for (let i = 0; i < Math.round(P.people.length * 0.55); i++) {
      const p = LR.pick(staff);
      const t = LR.pick(X.leaveTypes.filter((t) => t.key !== 'lop' && t.key !== 'unpaid' && t.key !== 'co'));
      const offset = LR.int(-150, 40);
      const len = t.unit === 'hours' ? LR.pick([1, 1, 1, 2, 3]) : LR.pick([1, 1, 1, 2, 2, 3, 5]);
      const from = addDays(TODAY, offset);
      const status = offset < -2 ? (LR.chance(0.93) ? 'Approved' : 'Rejected') : offset < 0 ? 'Approved' : LR.chance(0.75) ? 'Approved' : 'Pending';
      leaveReqs.push({ id: `LV-${2600 + i}`, who: p.id, type: t.key, from, to: addDays(from, len - 1), days: len, hours: t.unit === 'hours' ? len * 8 : null, reason: LR.pick(reasons), status, applied: addDays(from, -LR.int(1, 14)), approver: p.manager || top.id, channel: LR.pick(['Portal', 'Portal', 'Portal', 'Email', 'HR desk']) });
    }
    leaveReqs.sort((a, b) => b.from.localeCompare(a.from));
    leaveReqs.filter((l) => l.status === 'Pending').forEach((l) => { const b = P.byId[l.who].leave[l.type]; if (b) b.pending += l.days; });
    P.leaveRequests = leaveReqs;

    /* ---------- payroll history: 12 runs ---------- */
    const months = P.id === 'in'
      ? ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026']
      : P.id === 'us'
        ? ['Apr 20 – May 3', 'May 4 – May 17', 'May 18 – May 31', 'Jun 1 – Jun 14', 'Jun 15 – Jun 28', 'Jun 29 – Jul 12', 'Jul 13 – Jul 26', 'Jul 27 – Aug 9', 'Aug 10 – Aug 23', 'Aug 24 – Sep 6', 'Sep 7 – Sep 20', 'Sep 21 – Oct 4']
        : ['3 Nov – 30 Nov', '1 Dec – 28 Dec', '29 Dec – 25 Jan', '26 Jan – 22 Feb', '23 Feb – 22 Mar', '23 Mar – 19 Apr', '20 Apr – 17 May', '18 May – 14 Jun', '15 Jun – 12 Jul', '13 Jul – 9 Aug', '10 Aug – 6 Sep', '7 Sep – 4 Oct'];
    const HR = seeded('hist' + P.id);
    const T = P.totals;
    P.payHistory = months.map((label, i) => {
      const last = i === months.length - 1;
      const growth = 0.86 + 0.14 * (i / (months.length - 1));
      const wobble = last ? 1 : 1 + (HR.rnd() - 0.5) * 0.05 + (P.id === 'in' && (i === 2 || i === 4) ? 0.03 : 0);
      const f = last ? 1 : growth * wobble;
      const heads = last ? P.people.length : Math.round(P.people.length * (0.88 + 0.12 * i / (months.length - 1)));
      return { id: `PR-${2025 + Math.floor((9 + i) / 12)}-${String(i + 1).padStart(2, '0')}`, label, heads, gross: Math.round(T.gross * f), net: Math.round(T.net * f), ded: Math.round(T.dedTotal * f), er: Math.round(T.erTotal * f), cost: Math.round(T.cost * f), ot: Math.round((P.people.reduce((t, p) => t + (p.pay.otPay || 0), 0)) * (last ? 1 : 0.6 + HR.rnd() * 0.6)), status: last ? 'Draft' : 'Paid', paidOn: last ? null : label, lockedBy: last ? null : P.byId[P.hrId].name };
    });

    /* ---------- documents ---------- */
    P.people.forEach((p) => {
      const r = seeded('doc' + P.id + p.id);
      p.docs = X.docTypes.map((name, i) => {
        let status = 'Verified';
        if (p.joiner && i >= 2) status = r.chance(0.5) ? 'Pending review' : 'Missing';
        else if (r.chance(0.04)) status = 'Expiring soon';
        else if (r.chance(0.03)) status = 'Missing';
        if (P.id === 'in' && name === 'Police verification' && r.chance(0.08)) status = 'Expired';
        return { name, status, uploaded: status === 'Missing' ? null : addDays(p.joinedIso, r.int(0, 12)), by: status === 'Missing' ? null : r.pick(['Employee', 'HR', 'Employee']), size: `${r.int(120, 2400)} KB` };
      });
    });
    P.companyDocs = [
      { name: P.id === 'in' ? 'Employee handbook 2026' : 'Employee handbook 2026', folder: 'Policies', updated: '2026-04-01', acks: 0.94 },
      { name: 'Leave policy', folder: 'Policies', updated: '2026-01-01', acks: 0.97 },
      { name: 'Attendance & overtime policy', folder: 'Policies', updated: '2025-11-21', acks: 0.91 },
      { name: 'Code of conduct & anti-harassment (POSH)'.replace(' (POSH)', P.id === 'in' ? ' (POSH)' : ''), folder: 'Policies', updated: '2026-02-12', acks: 0.88 },
      { name: 'Uniform & grooming standards', folder: 'Policies', updated: '2025-08-30', acks: 0.99 },
      { name: P.id === 'in' ? 'Standing orders (certified)' : P.id === 'us' ? 'Food safety SOP' : 'COSHH safety data sheets', folder: 'Compliance', updated: '2026-06-18', acks: null },
      { name: 'Offer letter template', folder: 'Templates', updated: '2026-07-04', acks: null },
      { name: 'Experience / relieving letter template', folder: 'Templates', updated: '2026-03-15', acks: null },
      { name: 'Warning letter template', folder: 'Templates', updated: '2025-12-01', acks: null },
    ];

    /* ---------- assets ---------- */
    let serial = 1000;
    P.assets = [];
    P.people.forEach((p) => {
      const r = seeded('as' + P.id + p.id);
      (X.assetTypes[p.role] || ['ID card']).forEach((name) => {
        const tag = `AST-${serial++}`;
        const cond = r.chance(0.08) ? 'Needs repair' : r.chance(0.2) ? 'Fair' : 'Good';
        P.assets.push({ tag, name, who: p.id, issued: addDays(p.joinedIso, r.int(0, 3)), cond, value: /Laptop|MacBook|iPad|phone|Walkie/i.test(name) ? r.int(8, 60) * (P.id === 'in' ? 1000 : 25) : r.int(2, 30) * (P.id === 'in' ? 100 : 5), returnDue: p.exiting ? 'On last day' : null });
      });
    });
    const spare = seeded('spare' + P.id);
    for (let i = 0; i < 9; i++) P.assets.push({ tag: `AST-${serial++}`, name: spare.pick(Object.values(X.assetTypes).flat()), who: null, issued: null, cond: spare.pick(['Good', 'Good', 'New', 'Fair']), value: spare.int(5, 40) * (P.id === 'in' ? 200 : 10), returnDue: null });

    /* ---------- expenses & advances ---------- */
    const ER = seeded('exp' + P.id);
    P.expenses = [];
    for (let i = 0; i < 46; i++) {
      const p = ER.pick(P.people.filter((q) => q.role !== 'office' || ER.chance(0.3)));
      const cat = ER.pick(X.expenseCats);
      const amt = P.id === 'in' ? ER.int(3, 60) * 50 : ER.int(8, 140) + ER.pick([0, 0.4, 0.5, 0.99]);
      const d = addDays(TODAY, -ER.int(0, 60));
      const status = d > addDays(TODAY, -6) ? ER.pick(['Submitted', 'Submitted', 'Approved']) : ER.pick(['Paid', 'Paid', 'Paid', 'Approved', 'Rejected']);
      P.expenses.push({ id: `EXP-${4100 + i}`, who: p.id, cat, amt, date: d, status, receipt: ER.chance(0.9), policy: amt > (P.id === 'in' ? 2500 : 120) ? 'Over limit' : 'Within policy', note: '' });
    }
    P.expenses.sort((a, b) => b.date.localeCompare(a.date));
    P.advances = P.people.filter((p) => seeded('adv' + P.id + p.id).chance(0.05)).slice(0, 7).map((p, i) => {
      const r = seeded('adv2' + P.id + p.id);
      const amt = P.id === 'in' ? r.int(4, 20) * 1000 : r.int(2, 8) * 100;
      const inst = r.pick([2, 3, 4, 6]);
      const paid = r.int(0, inst - 1);
      return { id: `ADV-${310 + i}`, who: p.id, amt, inst, paid, emi: Math.round(amt / inst), issued: addDays(TODAY, -30 * (paid + 1)), kind: r.pick(['Salary advance', 'Salary advance', 'Personal loan']) };
    });

    /* ---------- onboarding & exits ---------- */
    const tasksOn = P.id === 'in'
      ? ['Offer accepted', 'Documents collected (Aadhaar, PAN)', 'Police verification filed', 'Bank account added', 'UAN linked / PF nomination', 'ESI registration', 'Uniform & ID issued', 'Site induction & post orders', 'Added to roster', 'Policy acknowledgements']
      : P.id === 'us'
        ? ['Offer signed', 'Form I-9 (by day 3)', 'Form W-4', 'Direct deposit', 'Texas new-hire report', 'Food handler card', 'Uniform & keys', 'POS login', 'First shifts scheduled', 'Handbook signed']
        : ['Contract signed', 'Right to work check', 'Starter checklist / P45', 'Bank details', 'DBS check', 'Pension auto-enrolment', 'Uniform & badge', 'COSHH induction', 'First shifts on rota', 'Handbook acknowledged'];
    const joinNames = { in: [['Pooja Waghmare', 'EMP-0249'], ['Rahul Sonawane'], ['Sneha Gore'], ['Amol Thorat']], us: [['Ethan Park', 'CC-1099'], ['Jasmine Mills'], ['Andre Johnson']], uk: [['Chloe Hughes', 'HF-2299'], ['Adebayo Okafor'], ['Holly Kelly']] }[P.id];
    const OR = seeded('onb' + P.id);
    P.onboarding = joinNames.map(([name, id], i) => {
      const p = id ? P.byId[id] : null;
      const done = id ? (P.id === 'in' ? 6 : 7) : i === 1 ? 3 : 1;
      const start = id ? p.joinedIso : addDays(TODAY, [0, 6, 13, 20][i]);
      const site = p ? p.site : OR.pick(P.sites.filter((x) => P.people.some((q) => q.site === x.id && q.role !== 'office'))).id;
      const roleKey = p ? p.role : OR.pick(Object.keys(P.roles).filter((k) => !P.roles[k].salary && k !== 'office'));
      return { id: `ONB-${70 + i}`, name, who: id || null, role: P.roles[roleKey].title, site, start, buddy: (OR.pick(P.people.filter((q) => q.site === site && q.role !== 'office' && q.id !== id)) || P.byId[P.hrId]).id, tasks: tasksOn.map((t, k) => ({ t, done: k < done, owner: k % 3 === 0 ? 'Employee' : k % 3 === 1 ? 'HR' : 'Manager', blocker: id && k === done ? true : false })), stage: id ? 'Joined' : start > TODAY ? 'Pre-boarding' : 'Day 1' };
    });
    const exitNames = { in: [['Akash Londhe', 'Resigned', '2026-10-03', 'Better pay at another agency'], ['Rupesh Jagtap', 'Resigned', '2026-10-15', 'Moving back to Satara'], ['Nilesh Mane', 'Terminated', '2026-09-30', 'Absconding 10+ days']], us: [['Brianna Reyes', 'Resigned', '2026-10-02', 'Going back to school'], ['Diego Ramirez', 'Resigned', '2026-10-16', 'Relocating to Dallas']], uk: [['Joanna Kelly', 'Resigned', '2026-10-02', 'New job closer to home'], ['Marek Hall', 'Resigned', '2026-10-23', 'Returning to Poland']] }[P.id];
    const fnfTasks = P.id === 'in' ? ['Resignation accepted', 'Notice period / shortfall', 'Asset return (uniform, ID)', 'Leave encashment', 'Gratuity check (5 yrs)', 'F&F computed', 'F&F paid (≤ 2 working days)', 'Relieving & experience letter', 'PF exit date updated'] : P.id === 'us' ? ['Resignation received', 'Keys & uniform returned', 'Final hours approved', 'PTO payout (policy)', 'Final pay (Texas Payday Law)', 'COBRA notice', 'Access removed'] : ['Resignation received', 'Notice period agreed', 'Uniform & badge returned', 'Holiday owed / taken', 'Final pay', 'P45 issued', 'Access removed'];
    P.exits = exitNames.map(([name, reason, last, why], i) => ({ id: `EXT-${40 + i}`, name, reason, lastDay: last, why, site: P.sites[i % P.sites.length].id, tasks: fnfTasks.map((t, k) => ({ t, done: last < TODAY ? k < fnfTasks.length - 2 : k < 2 })), settlement: P.id === 'in' ? [16840, 21310, 9120][i] : P.id === 'us' ? [612.4, 1488.2][i] : [514.2, 1702.85][i], status: last < TODAY ? 'F&F due' : 'Serving notice' }));

    /* ---------- performance ---------- */
    const PR = seeded('perf' + P.id);
    P.reviewCycle = { name: P.id === 'in' ? 'H1 FY26-27 review' : 'Fall 2026 check-in', opens: '2026-10-01', closes: '2026-10-31', stage: 'Self review' };
    P.people.forEach((p) => {
      const r = seeded('pf' + P.id + p.id);
      p.rating = r.pick([3, 3, 3, 4, 4, 4, 4, 5, 2, 3]);
      p.reviewStatus = r.pick(['Not started', 'Self review done', 'Self review done', 'Manager review', 'Not started']);
      p.goals = p.role === 'office' || p.role === 'sup' || p.role === 'lead'
        ? [{ t: P.id === 'in' ? 'Zero client escalations at site' : P.id === 'us' ? 'Keep labour cost under 28% of sales' : 'Pass every client audit', pct: r.int(40, 95) }, { t: 'Train two people for backup roles', pct: r.int(20, 100) }, { t: P.id === 'in' ? 'Attendance above 97%' : 'Shift fill rate above 98%', pct: r.int(55, 100) }]
        : [{ t: 'Complete safety refresher', pct: r.pick([0, 50, 100, 100]) }, { t: 'On-time attendance', pct: r.int(70, 100) }];
    });

    /* ---------- hiring ---------- */
    const jobsBy = { in: [['Security guard', 'hjw', 12], ['Lady guard', 'vmn', 4], ['Housekeeping staff', 'mgp', 6], ['Facility technician (electrical)', 'khd', 2], ['Site supervisor', 'bnr', 1], ['Payroll executive', 'hq', 1]], us: [['Barista', 'e6', 3], ['Baker (overnight)', 'ck', 2], ['Shift lead', 'dm', 1], ['Delivery driver', 'ck', 1], ['Pastry cook', 'ck', 1]], uk: [['Cleaner (airport)', 'ma', 6], ['Hospital domestic (nights)', 'sr', 4], ['Window specialist', 'sf', 1], ['Site supervisor', 'mc', 1]] }[P.id];
    const HRG = seeded('hire' + P.id);
    const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
    P.jobs = jobsBy.map(([title, site, openings], i) => ({ id: `JOB-${120 + i}`, title, site, openings, posted: addDays(TODAY, -HRG.int(3, 40)), sources: HRG.pick({ in: [['Apna', 'WorkIndia', 'Referral'], ['Walk-in', 'Apna', 'Referral'], ['Naukri', 'Referral'], ['WorkIndia', 'Walk-in']], us: [['Indeed', 'Referral'], ['Indeed', 'Snagajob'], ['Snagajob', 'Walk-in', 'Referral']], uk: [['Indeed', 'Reed'], ['Reed', 'Referral'], ['Indeed', 'Jobcentre Plus']] }[P.id]), hiringManager: (P.people.find((p) => p.site === site && (p.role === 'sup' || p.role === 'lead')) || P.byId[top.id]).id }));
    P.candidates = [];
    P.jobs.forEach((j) => {
      const n = Math.max(4, j.openings * 3 + HRG.int(2, 8));
      for (let k = 0; k < n; k++) {
        const g = HRG.chance(/Lady/.test(j.title) ? 1 : 0.4) ? 'f' : 'm';
        P.candidates.push({ id: `CAN-${900 + P.candidates.length}`, job: j.id, name: `${HRG.pick(P.names[g])} ${HRG.pick(P.last)}`, stage: stages[Math.min(4, Math.floor(Math.pow(HRG.rnd(), 1.8) * 5))], source: HRG.pick(j.sources), applied: addDays(TODAY, -HRG.int(0, 30)), score: HRG.int(52, 96), exp: HRG.int(0, 9), hue: HUES[HRG.int(0, HUES.length - 1)] });
      }
    });

    /* ---------- notifications, audit, announcements, tickets ---------- */
    const hero = P.hero;
    P.notifications = [
      { id: 'n1', t: '2 missed punches need a decision before payroll', at: '08:02', kind: 'attendance', unread: true, href: 'approvals' },
      { id: 'n2', t: `${P.contractorNeed.t}`, at: '07:40', kind: 'compliance', unread: true, href: 'contractors' },
      { id: 'n3', t: `${P.byId[P.late.id].name} is ${P.late.min} min late at ${P.sites.find((s) => s.id === P.byId[P.late.id].site).name}`, at: P.hhmm(C.nowMin - 2), kind: 'live', unread: true, href: 'live' },
      { id: 'n4', t: `${P.onboarding[0].name} still has blockers in onboarding`, at: 'Yesterday', kind: 'people', unread: true, href: 'onboarding' },
      { id: 'n5', t: `Payroll for ${C.period} is ready to review`, at: 'Yesterday', kind: 'payroll', unread: false, href: 'payroll' },
      { id: 'n6', t: `${P.exits[0].name}: final settlement is due`, at: 'Yesterday', kind: 'people', unread: false, href: 'offboarding' },
      { id: 'n7', t: `${P.reviewCycle.name} opened for ${P.people.length} people`, at: 'Oct 1', kind: 'performance', unread: false, href: 'performance' },
      { id: 'n8', t: `${hero.name} viewed their payslip`, at: 'Oct 1', kind: 'payroll', unread: false, href: 'people/' + hero.id },
    ];
    const AR = seeded('audit' + P.id);
    const actors = [P.byId[P.hrId].name, P.byId[P.topId].name, 'People OS assistant', 'System'];
    const verbs = ['approved leave for', 'updated bank details of', 'changed shift of', 'regularised attendance for', 'added document for', 'edited salary structure of', 'issued asset to', 'exported payroll register', 'invited', 'reset clock-in device for'];
    P.audit = Array.from({ length: 60 }, (_, i) => { const p = AR.pick(P.people); const v = AR.pick(verbs); return { id: `AUD-${8800 - i}`, at: `${addDays(TODAY, -Math.floor(i / 6))} ${String(AR.int(7, 21)).padStart(2, '0')}:${String(AR.int(0, 59)).padStart(2, '0')}`, actor: AR.pick(actors), action: v, target: v === 'exported payroll register' ? C.period : p.name, ip: `10.0.${AR.int(1, 9)}.${AR.int(10, 250)}`, via: AR.pick(['Web', 'Web', 'Web', 'API', 'Kiosk']) }; });
    P.announcements = [
      { id: 'an1', title: P.id === 'in' ? 'Diwali bonus will be paid with October salary' : P.id === 'us' ? 'Holiday pre-order season starts Nov 1' : 'Winter uniform swap from 19 October', body: P.id === 'in' ? 'Bonus at 8.33% of annual wages for everyone eligible under the Payment of Bonus Act.' : P.id === 'us' ? 'Expect extra overnight bake shifts. Pick up open shifts from the Shifts page in the employee portal.' : 'Bring your summer polo to the depot to swap for a fleece.', date: '2026-10-05', reach: 0.82, pinned: true },
      { id: 'an2', title: 'The new employee portal is live', body: 'Apply for leave, download payslips, check your attendance and raise HR requests from any browser. Sign in with your work email or phone number.', date: '2026-09-28', reach: 0.91 },
      { id: 'an3', title: P.reviewCycle.name + ' is open', body: 'Complete your self review by 31 October.', date: '2026-10-01', reach: 0.64 },
    ];
    const TR = seeded('tick' + P.id);
    const ticketSubjects = P.id === 'in' ? ['PF balance not showing in UMANG', 'Salary credited short by ₹600', 'Need salary certificate for bank loan', 'Uniform size exchange', 'ESI card not received', 'Change bank account', 'Form 130 for last year', 'Night allowance missing in Aug'] : P.id === 'us' ? ['Missing tips on last check', 'Need W-2 for 2025', 'Update direct deposit', 'PTO balance looks wrong', 'Employment verification letter', 'Change address'] : ['P60 for last tax year', 'Holiday balance query', 'Pension opt-out', 'Change bank details', 'Payslip missing night premium', 'Reference letter'];
    P.tickets = ticketSubjects.map((s, i) => ({ id: `HD-${1500 + i}`, subject: s, who: TR.pick(P.people).id, opened: addDays(TODAY, -TR.int(0, 12)), status: TR.pick(['Open', 'Open', 'In progress', 'Resolved', 'Waiting on employee']), channel: TR.pick(['Portal', 'Portal', 'Email', 'HR desk']), sla: TR.pick(['On track', 'On track', 'Due today', 'Breached']), assignee: P.byId[P.hrId].name, aiDraft: TR.chance(0.6) }));
    P.survey = { name: 'October pulse', enps: P.id === 'in' ? 31 : P.id === 'us' ? 24 : 18, responses: Math.round(P.people.length * 0.62), drivers: [['Pay on time', 4.6], ['My supervisor', 4.1], ['Shift fairness', 3.4], ['Tools & uniforms', 3.8], ['Growth', 3.1]] };
  }

  /* real site locations: coordinates, street address and geofence radius (metres) */
  const GEO = {
    in: { hjw: [18.5913, 73.7389, 'Infodyne Tech Park, Hinjewadi Phase 2, Pune 411057', 200], mgp: [18.5146, 73.9271, 'Magarpatta City, Hadapsar, Pune 411028', 250], khd: [18.5515, 73.9497, 'EON Free Zone, Kharadi, Pune 411014', 200], bnr: [18.559, 73.7868, 'Baner Road, Baner, Pune 411045', 150], vmn: [18.5622, 73.9167, 'Phoenix Marketcity, Viman Nagar, Pune 411014', 250], hq: [18.5308, 73.8475, 'Shivajinagar, Pune 411005', 100] },
    us: { sl: [30.251, -97.7666, '1601 S Lamar Blvd, Austin, TX 78704', 120], e6: [30.2626, -97.729, '1708 E 6th St, Austin, TX 78702', 100], dm: [30.402, -97.7253, '11410 Century Oaks Terrace, Austin, TX 78758', 150], ck: [30.2135, -97.759, '510 E St Elmo Rd, Austin, TX 78745', 150] },
    uk: { ma: [53.365, -2.2727, 'Terminal 2, Manchester Airport, Manchester M90 1QX', 300], mc: [53.4722, -2.2978, 'MediaCityUK, Salford M50 2EQ', 200], sr: [53.4876, -2.3222, 'Salford Royal Hospital, Stott Lane, Salford M6 8HD', 250], sf: [53.4808, -2.2522, 'Hardman Square, Spinningfields, Manchester M3 3EB', 150], td: [53.466, -2.318, 'Trafford Park, Manchester M17 1AB', 150] },
  };
  Object.values(DATA).forEach((P) => P.sites.forEach((s) => { const g = GEO[P.id][s.id]; if (g) Object.assign(s, { lat: g[0], lng: g[1], address: g[2], radius: g[3] }); }));

  Object.values(DATA).forEach(enrich);
  Object.assign(window.PO, { seeded, TODAY, addDays, iso });
})();
