/* People OS demo data. One engine, one country pack per company. Each pack brings its sites, roles, shifts,
   pay rules, compliance rules and the language its staff message in. Everything is generated deterministically,
   so every screen of a company reads the same numbers. */
(function () {
  let seed = 1;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const r2 = (x) => Math.round(x * 100) / 100;
  const r0 = (x) => Math.round(x);
  const hhmm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  /* ---------------- United States: Corner & Crust Bakeries, Austin TX ---------------- */
  const US = {
    id: 'us', flag: '🇺🇸', seed: 7041,
    company: { name: 'Corner & Crust Bakeries', short: 'Corner & Crust', city: 'Austin', region: 'Texas', country: 'United States', locale: 'en-US', currency: 'USD',
      today: 'Tuesday, October 6', nowMin: 6 * 60 + 12, period: 'Sep 21 – Oct 4', periodLong: 'pay period Sep 21 – Oct 4', payBy: 'Fri, Oct 9', cadence: 'Bi-weekly',
      user: { name: 'Dana Whitfield', role: 'Operations & payroll', initials: 'DW' }, greeting: 'Good morning, Dana',
      employerLine: 'Corner & Crust Bakeries LLC · 1601 S Lamar Blvd, Austin TX 78704 · EIN 74-3318205', idLabel: 'SSN', idValue: (p) => '···-··-' + p.id.slice(-4) },
    shifts: [
      { key: 'C', label: 'Overnight bake', from: 22 * 60, to: 6 * 60, time: '10pm–6am' },
      { key: 'A', label: 'Open', from: 6 * 60, to: 14 * 60, time: '6am–2pm' },
      { key: 'B', label: 'Close', from: 14 * 60, to: 22 * 60, time: '2pm–10pm' },
    ],
    current: 'A', previous: 'C', next: 'B',
    sites: [
      { id: 'sl', name: 'South Lamar', client: 'Café and retail counter', staff: 16, x: 34, y: 64 },
      { id: 'e6', name: 'East 6th', client: 'Café', staff: 14, x: 62, y: 44 },
      { id: 'dm', name: 'The Domain', client: 'Café and catering pickup', staff: 12, x: 54, y: 16 },
      { id: 'ck', name: 'Central kitchen', client: 'Bakery production and catering', staff: 16, x: 22, y: 30 },
    ],
    roles: {
      barista: { title: 'Barista', rate: 14.5, tips: true },
      baker: { title: 'Baker', rate: 19 },
      lead: { title: 'Shift lead', rate: 21 },
      porter: { title: 'Kitchen porter', rate: 15 },
      driver: { title: 'Delivery driver', rate: 17 },
      sup: { title: 'Café supervisor', salary: 1280 },
      office: { title: 'Office', salary: 2500 },
    },
    names: { m: ['Jamal', 'Tyler', 'Derek', 'Marcus', 'Ethan', 'Luis', 'Carlos', 'Kevin', 'Andre', 'Josh', 'Brandon', 'Diego', 'Ryan', 'Omar', 'Caleb', 'Mateo'], f: ['Rosa', 'Hannah', 'Maria', 'Ashley', 'Jasmine', 'Emily', 'Sofia', 'Taylor', 'Brianna', 'Lauren', 'Valeria', 'Megan', 'Kayla', 'Camila'] },
    last: ['Hernández', 'Carter', 'Brooks', 'Mills', 'Ward', 'Park', 'Nguyen', 'Garcia', 'Johnson', 'Martinez', 'Lopez', 'Williams', 'Robinson', 'Patel', 'Reyes', 'Coleman', 'Turner', 'Ramirez'],
    fixed: {
      'CC-1042': { name: 'Rosa Hernández', g: 'f', role: 'barista', site: 'sl', shift: 'A', post: 'Espresso bar', joined: 'Mar 2023', u: { reg: 72, pto: 8, ot: 6, tips: 412.5 }, prev: { reg: 80, pto: 0, ot: 0, tips: 365 }, k401: true, hero: true },
      'CC-1057': { name: 'Jamal Carter', g: 'm', role: 'barista', site: 'e6', shift: 'A', post: 'Front counter', joined: 'Jun 2024', u: { reg: 80, pto: 0, ot: 0, tips: 298 }, missed: 'Sep 24' },
      'CC-1063': { name: 'Tyler Brooks', g: 'm', role: 'baker', site: 'ck', shift: 'C', post: 'Bread line', joined: 'Jan 2023', u: { reg: 80, pto: 0, ot: 7, tips: 0 } },
      'CC-1071': { name: 'Hannah Ward', g: 'f', role: 'baker', site: 'ck', shift: 'A', post: 'Pastry', joined: 'Aug 2022', u: { reg: 80, pto: 0, ot: 12, tips: 0 }, missed: 'Sep 29' },
      'CC-1011': { name: 'Maria Lopez', g: 'f', role: 'lead', site: 'sl', shift: 'A', post: 'Shift lead', joined: 'Feb 2021', u: { reg: 80, pto: 0, ot: 4, tips: 0 }, k401: true },
      'CC-1012': { name: 'Kevin Nguyen', g: 'm', role: 'sup', site: 'e6', shift: 'A', post: 'Café supervisor', joined: 'Oct 2022', u: { otOwed: 6 }, flag: true },
      'CC-1013': { name: 'Ashley Patel', g: 'f', role: 'sup', site: 'dm', shift: 'A', post: 'Café supervisor', joined: 'May 2023', u: { otOwed: 9 }, flag: true },
      'CC-1002': { name: 'Dana Whitfield', g: 'f', role: 'office', site: 'ck', shift: 'A', post: 'Operations & payroll', joined: 'Sep 2019', u: {}, k401: true, title: 'Operations & payroll' },
      'CC-1001': { name: 'Marcus Coleman', g: 'm', role: 'office', site: 'ck', shift: 'A', post: 'Owner', joined: 'Sep 2019', u: {}, title: 'Owner' },
      'CC-1099': { name: 'Ethan Park', g: 'm', role: 'porter', site: 'ck', shift: 'B', post: 'Dish and prep', joined: 'Sep 28, 2026', u: { reg: 40, pto: 0, ot: 0, tips: 0 }, joiner: true },
    },
    mix: (site) => { const r = rnd(); return site === 'ck' ? (r < 0.6 ? 'baker' : r < 0.85 ? 'porter' : 'driver') : r < 0.7 ? 'barista' : r < 0.85 ? 'lead' : 'porter'; },
    genUnits: (p) => { const reg = rnd() < 0.7 ? 80 : pick([48, 56, 64, 72]); return { reg, pto: rnd() < 0.15 ? 8 : 0, ot: p.site === 'ck' ? int(4, 12) : rnd() < 0.3 ? int(1, 5) : 0, tips: p.role === 'barista' ? int(220, 440) : 0 }; },
    pay(p, u = p.u) {
      const r = this.roles[p.role];
      const earn = [], ded = [], er = [];
      if (r.salary) {
        earn.push({ k: 'sal', label: 'Salary', amt: r.salary });
      } else {
        earn.push({ k: 'reg', label: `Regular (${u.reg} h × $${r.rate.toFixed(2)})`, amt: r2(u.reg * r.rate) });
        if (u.pto) earn.push({ k: 'pto', label: `Paid time off (${u.pto} h)`, amt: r2(u.pto * r.rate) });
        if (u.ot) earn.push({ k: 'ot', label: `Overtime (${u.ot} h × 1.5)`, amt: r2(u.ot * r.rate * 1.5) });
        if (u.tips) earn.push({ k: 'tips', label: 'Card tips', amt: r2(u.tips) });
      }
      const gross = r2(earn.reduce((t, x) => t + x.amt, 0));
      const k401 = p.k401 ? r2(gross * 0.04) : 0;
      if (k401) ded.push({ k: '401k', label: '401(k), 4%', amt: k401 });
      ded.push({ k: 'fit', label: 'Federal income tax', amt: r2((gross - k401) * 0.07) });
      ded.push({ k: 'ss', label: 'Social Security, 6.2%', amt: r2(gross * 0.062) });
      ded.push({ k: 'med', label: 'Medicare, 1.45%', amt: r2(gross * 0.0145) });
      er.push({ k: 'erss', label: 'Social Security', amt: r2(gross * 0.062) }, { k: 'ermed', label: 'Medicare', amt: r2(gross * 0.0145) });
      if (p.k401) er.push({ k: 'er401k', label: '401(k) match, 3%', amt: r2(gross * 0.03) });
      const d = r2(ded.reduce((t, x) => t + x.amt, 0));
      return { earn, ded, er, gross, dedTotal: d, net: r2(gross - d), erTotal: r2(er.reduce((t, x) => t + x.amt, 0)), work: r.salary ? 80 : u.reg + (u.pto || 0), unpaid: 0, otHours: u.ot || 0, otPay: earn.find((x) => x.k === 'ot')?.amt ?? 0, extra: earn.find((x) => x.k === 'tips')?.amt ?? 0 };
    },
    unitWords: { work: 'Paid hours', unpaid: 'Unpaid absence (h)', extra: 'Card tips', days: 14 },
    whyWords: { reg: 'Regular hours', pto: 'Paid time off', ot: 'Overtime', tips: 'Card tips', '401k': '401(k) (4% of a bigger check)', fit: 'Federal income tax', ss: 'Social Security', med: 'Medicare' },
    statutory: [['Federal income tax', 'fit', null], ['Social Security, 6.2% each', 'ss', 'erss'], ['Medicare, 1.45% each', 'med', 'ermed'], ['401(k)', '401k', 'er401k']],
    steps: [['Hours & time off', 'From timesheets'], ['New hires & exits', 'W-4, final pay'], ['Overtime & tips', 'FLSA, card tips'], ['Reimbursements', 'Expenses, advances'], ['Holds & adjustments', 'Paused pay'], ['Taxes & approve', 'Federal, FICA, 401(k)']],
    checks: {
      punch: { title: '2 missed punches', text: 'Jamal Carter (Sep 24) and Hannah Ward (Sep 29) each have a day without a clock-out.', fix: 'Approve' },
      ot: { title: 'Overtime 58% above last period at Central kitchen', text: '62 extra hours across 6 bakers for UT home-game catering orders.', fix: 'Approve' },
      bank: { title: 'New hire without a W-4 or direct deposit', text: 'Ethan Park started Sep 28. Without a W-4 the IRS default applies: single, no adjustments.', fix: 'Use IRS default', done: 'Ethan Park: IRS default withholding, paid by paper check' },
      rule: { title: '2 salaried supervisors are owed overtime', text: 'Kevin Nguyen and Ashley Patel earn $640 a week, under the $684 FLSA exemption threshold, so they are non-exempt.', fix: 'Fix in Compliance' },
    },
    joiners: [{ initials: 'EP', name: 'Ethan Park', text: 'Kitchen porter, Central kitchen · started Sep 28 · 40 h', missing: 'No W-4, no bank account', hold: 'IRS default withholding · paper check' }, { initials: 'BR', name: 'Brianna Reyes', text: 'Barista, East 6th · last day Oct 2 · final pay due by next regular payday (Texas)', ready: 'Final pay ready · $612.40' }],
    money: [['ap7', 'Catering van fuel, Central kitchen', 'Hannah Ward · expense', 86.4], ['ap6', 'Pay advance, Luis Martinez', 'Paid now, repaid over 2 checks', 300]],
    lockFigs: (T) => [['Federal taxes to deposit by Wed, Oct 14', T.fit + T.ss + T.erss + T.med + T.ermed]],
    files: [['ACH', 'Direct deposit file', 'NACHA, Chase business'], ['PDF', 'Form 941 deposit', 'EFTPS, due Wed Oct 14'], ['CSV', '401(k) contributions', 'Guideline upload'], ['PDF', 'Payroll register', 'All employees'], ['PDF', 'Paper checks', '1 check: Ethan Park'], ['CSV', 'Texas new-hire report', 'Ethan Park, due within 20 days']],
    rules: [
      { name: 'Overtime', value: '1.5× regular rate after 40 hours in a workweek', from: 'FLSA', note: 'Texas adds no daily overtime.' },
      { name: 'Minimum wage', value: '$7.25 an hour · tipped $2.13 with tip credit', from: 'Jul 24, 2009', note: 'Texas follows the federal rate.' },
      { name: 'Salary threshold for exemption', value: '$684 a week', from: 'Jan 1, 2020', note: 'Salaried staff earning less are owed overtime. The 2024 increase was vacated.' },
      { name: 'Social Security and Medicare', value: '6.2% and 1.45%, employee and employer', from: 'FICA', note: 'Social Security stops at the annual wage base.' },
      { name: 'State income tax', value: 'None in Texas', from: '—', note: 'Unemployment tax (SUTA) is employer-paid.' },
      { name: 'Form I-9', value: 'Complete by the employee’s third business day', from: 'IRCA', note: 'Keep 3 years after hire or 1 year after leaving.' },
      { name: 'Final pay, Texas', value: 'Fired: within 6 days. Quit: next regular payday', from: 'Texas Payday Law', note: '' },
    ],
    ruleFlag: {
      title: '2 salaried supervisors are owed overtime',
      text: 'The FLSA exempts salaried staff only if they earn at least $684 a week. Kevin and Ashley earn $640, so they are non-exempt and owed time and a half for hours over 40. Here is what moving them to hourly pay costs for this period.',
      cols: ['Person', 'Salary a week', 'Regular rate', 'Overtime hours', 'Owed this period'],
      row: (p) => [`$640`, '$16.00', `${p.u.otOwed} h`, `$${(p.u.otOwed * 24).toFixed(2)}`],
      apply: 'Move to hourly and pay overtime', done: 'Kevin Nguyen and Ashley Patel are now hourly (non-exempt). $360.00 of overtime added to this period.', letters: 'Draft a note to them',
    },
    contractors: [
      { name: 'Lone Star Event Staffing', status: 'bad', statusText: 'Insurance expired', rows: [['Workers with you', '8 event servers for catering'], ['Certificate of insurance', 'Expired Sep 30'], ['W-9', 'On file'], ['This month', '$4,820 invoiced']], ask: 'Ask for a new certificate', hold: 'Hold their invoice', reminded: 'Asked by text at 6:20am' },
      { name: 'Hill Country Cleaning', status: 'ok', statusText: 'All clear', rows: [['Workers with you', 'Night deep clean, 3 nights a week'], ['Certificate of insurance', 'Valid until Mar 2027'], ['W-9', 'On file']] },
    ],
    contractorNeed: { t: 'Lone Star Event Staffing’s insurance expired', d: '8 of their servers work your catering events' },
    approvals: [
      { id: 'ap1', kind: 'Missed punch', who: 'CC-1057', when: '2 days ago', title: 'Clock-out missing on Thu Sep 24', detail: 'Close shift ended 2pm. Maria confirms he left at 2:05pm.', ask: 'Mark out at 2:05pm' },
      { id: 'ap2', kind: 'Missed punch', who: 'CC-1071', when: '2 days ago', title: 'Clock-out missing on Tue Sep 29', detail: 'Oven log shows her last batch out at 2:20pm.', ask: 'Mark out at 2:20pm' },
      { id: 'ap3', kind: 'Overtime', who: 'CC-1071', when: 'Yesterday', title: 'Central kitchen overtime: 6 bakers, 62 h', detail: 'UT home-game catering orders on Sep 26 and Oct 3.', ask: 'Approve 62 h overtime' },
      { id: 'ap4', kind: 'Time off', who: 'CC-1011', when: 'Yesterday', title: 'PTO, Fri Oct 9', detail: 'Family visit. 34 h of PTO left.', ask: 'Approve PTO' },
      { id: 'ap5', kind: 'Shift swap', who: 'CC-1057', when: '3 h ago', title: 'Swap Thu Oct 8 Open with Sofia Ramirez', detail: 'Both trained on espresso. No overtime either way.', ask: 'Approve swap' },
      { id: 'ap6', kind: 'Advance', whoName: 'Luis Martinez', when: 'Mon', title: 'Pay advance, $300', detail: 'Repaid over the next 2 checks.', ask: 'Approve advance' },
      { id: 'ap7', kind: 'Expense', who: 'CC-1071', when: 'Mon', title: 'Catering van fuel, $86.40', detail: 'Receipt attached.', ask: 'Approve expense' },
      { id: 'ap8', kind: 'Time off', whoName: 'Caleb Turner', when: '1 h ago', title: 'Sick time, today', detail: 'Open shift at South Lamar, covered by Valeria Reyes.', ask: 'Approve sick time' },
    ],
    late: { id: 'CC-1057', min: 12 }, lateWord: 'Open shift',
    outToday: [['Caleb Turner', 'Sick time', 'The Domain'], ['Brianna Reyes', 'Last day was Oct 2', 'East 6th']],
    roster: { site: 'ck', week: ['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10', 'Sun 11'], hourCost: 18.5, budget: 6800, opens: [{ day: 3, shift: 'C' }, { day: 5, shift: 'A' }], fillers: ['Diego Garcia', 'Omar Williams'] },
    cover: { who: 'CC-1063', site: 'ck', day: 1, text: 'Tyler Brooks is on the overnight bake at Central kitchen tonight. These bakers are free and trained on the bread line:', cands: [{ name: 'Diego Garcia', initials: 'DG', why: 'Off tonight · 32 h this week · bread line trained' }, { name: 'Omar Williams', initials: 'OW', why: 'Off tonight · 36 h this week' }, { name: 'Luis Martinez', initials: 'LM', why: 'Off tonight · 40 h, would go into overtime' }], done: (c) => `${c.name} covers tonight. Tyler’s shift is marked as sick time and both got a text.` },
    lateBySite: [['Central kitchen', 14], ['East 6th', 11], ['South Lamar', 7], ['The Domain', 5]],
    ai: { cover: 'Tyler is sick tonight, find cover', late: 'Late arrivals by location this period', rule: 'Pay double time on Thanksgiving and Christmas', ruleText: 'Thanksgiving and Christmas Day: all hours are paid at 2× the regular rate.', ruleCost: 'Last year this would have added $2,940 across 31 people.', ruleName: 'Holiday double time', ruleValue: '2× on Thanksgiving and Christmas Day', leaveQ: 'How much PTO does Rosa have?', leave: 'Rosa Hernández has 22 hours of PTO left and accrues 1 hour for every 30 worked. PTO requests need 3 days’ notice (Handbook, section 4.1).' },
    phone: { clock: 'CC-1057', clockSite: 'e6', gate: 'the back-door QR code', gps: '±220 ft' },
    msg: { channel: 'Email & SMS', app: 'portal', name: 'Corner & Crust HR', hero: 'CC-1042', lang: 'en',
      hello: 'Hi Rosa, welcome to the Corner & Crust employee portal. Request time off, view pay stubs and check your hours here.',
      ask: 'Can I take Friday, October 9 off?', confirm: 'PTO on Friday, October 9? You have 22 hours left. Send to Maria Lopez for approval?', yes: 'Send request', no: 'Cancel',
      sent: 'Request sent. You will get an email when it is approved.', approved: 'Maria Lopez approved your PTO for Friday, October 9.', why: 'Why did my pay change?', fallback: 'I can help with time off, pay stubs and your hours.',
      slip: (net, diff) => `Your pay stub for Sep 21 – Oct 4 is ready. Net pay ${net}, ${diff} more than last period.`,
      whyIntro: 'You are paid more this period because of:', words: { reg: 'regular hours', pto: 'paid time off', ot: 'overtime', tips: 'card tips', '401k': '401(k)', fit: 'federal income tax', ss: 'Social Security', med: 'Medicare' },
      leaveTitle: 'PTO, Fri Oct 9', leaveDetail: 'Requested on the employee portal. 22 h of PTO left.', approver: 'Maria Lopez' },
  };

  /* ---------------- United Kingdom: Harbour & Field Cleaning, Manchester ---------------- */
  const UK = {
    id: 'uk', flag: '🇬🇧', seed: 4417,
    company: { name: 'Harbour & Field Cleaning', short: 'Harbour & Field', city: 'Manchester', region: 'England', country: 'United Kingdom', locale: 'en-GB', currency: 'GBP',
      today: 'Tuesday, 6 October', nowMin: 6 * 60 + 9, period: '7 Sep – 4 Oct', periodLong: 'four weeks to 4 October', payBy: 'Fri, 9 Oct', cadence: 'Four-weekly',
      user: { name: 'Gemma Clarke', role: 'HR & payroll', initials: 'GC' }, greeting: 'Good morning, Gemma',
      employerLine: 'Harbour & Field Cleaning Ltd · Trafford Park, Manchester M17 1AB · PAYE ref 961/HF48213', idLabel: 'NI number', idValue: (p) => 'QQ ·· ·· ' + p.id.slice(-2) + ' C' },
    shifts: [
      { key: 'C', label: 'Night', from: 22 * 60, to: 6 * 60, time: '22:00–06:00' },
      { key: 'A', label: 'Early', from: 6 * 60, to: 14 * 60, time: '06:00–14:00' },
      { key: 'B', label: 'Late', from: 14 * 60, to: 22 * 60, time: '14:00–22:00' },
    ],
    current: 'A', previous: 'C', next: 'B',
    sites: [
      { id: 'ma', name: 'Manchester Airport T2', client: 'Airport terminal contract', staff: 22, x: 52, y: 82 },
      { id: 'mc', name: 'MediaCityUK', client: 'Office towers, Salford Quays', staff: 18, x: 26, y: 40 },
      { id: 'sr', name: 'Salford Royal', client: 'NHS hospital wards', staff: 16, x: 18, y: 22 },
      { id: 'sf', name: 'Spinningfields', client: 'Office towers', staff: 14, x: 56, y: 34 },
      { id: 'td', name: 'Trafford depot', client: 'Head office', staff: 6, x: 34, y: 60 },
    ],
    roles: {
      cleaner: { title: 'Cleaner', rate: 12.71 },
      domestic: { title: 'Hospital domestic', rate: 12.95 },
      spec: { title: 'Specialist cleaner', rate: 13.4 },
      sup: { title: 'Supervisor', rate: 14.2 },
      office: { title: 'Office', salary: 2261.54 },
    },
    names: { m: ['Liam', 'Kofi', 'Tomasz', 'Daniel', 'James', 'Mohammed', 'Ryan', 'Piotr', 'Callum', 'Adebayo', 'Jack', 'Marek'], f: ['Agnieszka', 'Chloe', 'Sarah', 'Fatima', 'Emma', 'Joanna', 'Aisha', 'Lucy', 'Grace', 'Katarzyna', 'Holly', 'Priya'] },
    last: ['Nowak', 'Doyle', 'Mensah', 'Hughes', 'Whitworth', 'Kowalski', 'Ahmed', 'Taylor', 'Wood', 'Okafor', 'Shaw', 'Begum', 'Lewandowski', 'Kelly', 'Hall', 'Patel'],
    fixed: {
      'HF-2208': { name: 'Agnieszka Nowak', g: 'f', role: 'domestic', site: 'sr', shift: 'C', post: 'Ward 7', joined: 'Apr 2022', u: { hours: 152, nights: 96, ot: 8, hol: 0 }, prev: { hours: 144, nights: 72, ot: 0, hol: 0 }, hero: true },
      'HF-2231': { name: 'Liam Doyle', g: 'm', role: 'cleaner', site: 'ma', shift: 'A', post: 'Departures', joined: 'Jan 2025', u: { hours: 160, nights: 0, ot: 6, hol: 0 }, missed: '15 Sep' },
      'HF-2240': { name: 'Kofi Mensah', g: 'm', role: 'domestic', site: 'sr', shift: 'C', post: 'Ward 3', joined: 'Jul 2023', u: { hours: 152, nights: 152, ot: 0, hol: 0 } },
      'HF-2244': { name: 'Tomasz Kowalski', g: 'm', role: 'cleaner', site: 'ma', shift: 'B', post: 'Arrivals', joined: 'Mar 2024', u: { hours: 160, nights: 0, ot: 14, hol: 0 }, missed: '22 Sep' },
      'HF-2201': { name: 'Sarah Whitworth', g: 'f', role: 'sup', site: 'sr', shift: 'A', post: 'Site supervisor', joined: 'Sep 2019', u: { hours: 160, nights: 0, ot: 0, hol: 0 } },
      'HF-2202': { name: 'Gemma Clarke', g: 'f', role: 'office', site: 'td', shift: 'A', post: 'HR & payroll', joined: 'Feb 2020', u: {}, title: 'HR & payroll' },
      'HF-2200': { name: 'Daniel Shaw', g: 'm', role: 'office', site: 'td', shift: 'A', post: 'Managing director', joined: 'Jun 2015', u: {}, title: 'Managing director' },
      'HF-2299': { name: 'Chloe Hughes', g: 'f', role: 'cleaner', site: 'sf', shift: 'B', post: 'Tower 3', joined: '28 Sep 2026', u: { hours: 40, nights: 0, ot: 0, hol: 0 }, joiner: true },
    },
    mix: (site) => { const r = rnd(); return site === 'sr' ? (r < 0.8 ? 'domestic' : 'sup') : site === 'td' ? 'office' : r < 0.75 ? 'cleaner' : r < 0.9 ? 'spec' : 'sup'; },
    genUnits: (p) => ({ hours: rnd() < 0.6 ? 160 : pick([96, 112, 128, 144]), nights: p.shift === 'C' ? int(80, 152) : 0, ot: p.site === 'ma' ? int(4, 16) : rnd() < 0.25 ? int(2, 8) : 0, hol: rnd() < 0.2 ? 16 : 0 }),
    pay(p, u = p.u) {
      const r = this.roles[p.role];
      const earn = [], ded = [], er = [];
      if (r.salary) earn.push({ k: 'sal', label: 'Salary', amt: r.salary });
      else {
        earn.push({ k: 'basic', label: `Basic (${u.hours} h × £${r.rate.toFixed(2)})`, amt: r2(u.hours * r.rate) });
        if (u.nights) earn.push({ k: 'night', label: `Night premium (${u.nights} h × £1.50)`, amt: r2(u.nights * 1.5) });
        if (u.ot) earn.push({ k: 'ot', label: `Overtime (${u.ot} h × 1.5)`, amt: r2(u.ot * r.rate * 1.5) });
        if (u.hol) earn.push({ k: 'hol', label: `Holiday pay (${u.hol} h)`, amt: r2(u.hol * r.rate) });
      }
      const gross = r2(earn.reduce((t, x) => t + x.amt, 0));
      const pen = r2(Math.max(0, gross - 480) * 0.05);
      ded.push({ k: 'tax', label: 'Income tax (PAYE)', amt: r2(Math.max(0, gross - pen - 966.92) * 0.2) });
      ded.push({ k: 'ni', label: 'National Insurance', amt: r2(Math.max(0, gross - 967) * 0.08) });
      ded.push({ k: 'pen', label: 'Pension, 5%', amt: pen });
      if (p.flag) ded.push({ k: 'uni', label: 'Uniform', amt: 25 });
      er.push({ k: 'erni', label: 'Employer NI', amt: r2(Math.max(0, gross - 384.62) * 0.15) }, { k: 'erpen', label: 'Employer pension, 3%', amt: r2(Math.max(0, gross - 480) * 0.03) });
      const d = r2(ded.reduce((t, x) => t + x.amt, 0));
      return { earn, ded, er, gross, dedTotal: d, net: r2(gross - d), erTotal: r2(er.reduce((t, x) => t + x.amt, 0)), work: r.salary ? 160 : u.hours + (u.hol || 0), unpaid: 0, otHours: u.ot || 0, otPay: earn.find((x) => x.k === 'ot')?.amt ?? 0, extra: earn.find((x) => x.k === 'night')?.amt ?? 0 };
    },
    unitWords: { work: 'Paid hours', unpaid: 'Unpaid absence (h)', extra: 'Night premium', days: 28 },
    whyWords: { basic: 'More basic hours', night: 'Night premium', ot: 'Overtime', hol: 'Holiday pay', tax: 'Income tax', ni: 'National Insurance', pen: 'Pension (5% of a bigger payslip)' },
    statutory: [['Income tax (PAYE)', 'tax', null], ['National Insurance, 8% / 15%', 'ni', 'erni'], ['Workplace pension, 5% / 3%', 'pen', 'erpen']],
    steps: [['Hours & absence', 'From timesheets'], ['Starters & leavers', 'Tax codes, P45s'], ['Overtime & premiums', 'Nights, overtime'], ['Expenses', 'Claims, advances'], ['Holds & adjustments', 'Paused pay'], ['Tax, NI & approve', 'PAYE, NI, pension']],
    checks: {
      punch: { title: '2 missed punches', text: 'Liam Doyle (15 Sep) and Tomasz Kowalski (22 Sep) each have a shift without a clock-out.', fix: 'Approve' },
      ot: { title: 'Overtime 41% above last period at Manchester Airport', text: '58 extra hours across 9 cleaners for the airport’s autumn peak and extra security cleans.', fix: 'Approve' },
      bank: { title: 'New starter without a P45 or NI number', text: 'Chloe Hughes started on 28 Sep. Her starter checklist says statement A, so tax code 1257L applies.', fix: 'Use starter checklist', done: 'Chloe Hughes: tax code 1257L from her starter checklist' },
      rule: { title: '6 cleaners fall below the National Living Wage', text: 'The £25 uniform deduction takes 6 cleaners on £12.71 an hour below the legal minimum for the period.', fix: 'Fix in Compliance' },
    },
    joiners: [{ initials: 'CH', name: 'Chloe Hughes', text: 'Cleaner, Spinningfields · started 28 Sep · 40 h', missing: 'No P45, no NI number yet', hold: 'Tax code 1257L from starter checklist' }, { initials: 'JK', name: 'Joanna Kelly', text: 'Cleaner, MediaCityUK · left 2 Oct · P45 issued with final pay', ready: 'Final pay ready · £514.20' }],
    money: [['ap7', 'Parking at Manchester Airport', 'Sarah Whitworth · expense', 42], ['ap6', 'Advance, Piotr Lewandowski', 'Recovered over 2 pay periods', 150]],
    lockFigs: (T) => [['PAYE and NI to HMRC by 22 Oct', T.tax + T.ni + T.erni]],
    files: [['BACS', 'Payment file', 'Bacs, Barclays'], ['RTI', 'Full Payment Submission', 'To HMRC on or before payday'], ['CSV', 'Pension contributions', 'NEST upload'], ['PDF', 'Payroll summary', 'All employees'], ['PDF', 'P45', 'Joanna Kelly'], ['PDF', 'Payslips', 'All employees']],
    rules: [
      { name: 'National Living Wage (21 and over)', value: '£12.71 an hour', from: '1 Apr 2026', was: '£12.21', note: 'Deductions for uniforms and equipment can’t take pay below it.' },
      { name: 'Employer National Insurance', value: '15% above £5,000 a year', from: '6 Apr 2025', was: '13.8% above £9,100', note: '' },
      { name: 'Employee National Insurance', value: '8% between £12,570 and £50,270', from: '6 Apr 2024', note: '' },
      { name: 'Workplace pension', value: '5% employee · 3% employer on qualifying earnings', from: 'Auto-enrolment', note: 'Qualifying earnings start at £6,240 a year.' },
      { name: 'Holiday', value: '5.6 weeks a year; 12.07% of hours for irregular workers', from: '1 Apr 2024', note: 'Rolled-up holiday pay allowed for irregular hours.' },
      { name: 'Real Time Information', value: 'Full Payment Submission on or before payday', from: 'HMRC', note: '' },
      { name: 'Right to work', value: 'Checked before the first shift', from: 'Immigration Act', note: 'Share codes for most non-UK workers.' },
    ],
    ruleFlag: {
      title: '6 cleaners fall below the National Living Wage',
      text: 'A £25 uniform deduction is legal only if pay stays at or above £12.71 an hour after it. For these 6 cleaners on exactly £12.71, it doesn’t. Here is the refund to put it right.',
      cols: ['Person', 'Hours', 'Pay before deduction', 'Rate after deduction', 'Refund'],
      row: (p, pay) => { const b = pay.earn.find((x) => x.k === 'basic').amt; return [`${p.u.hours} h`, '£' + b.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), `£${((b - 25) / p.u.hours).toFixed(2)}`, '£25.00']; },
      apply: 'Stop the deduction and refund £150', done: 'Uniform deductions stopped for 6 cleaners and £150.00 refunded in this period.', letters: 'Draft a note to them',
    },
    contractors: [
      { name: 'Prime Agency Staffing', status: 'warn', statusText: '12-week rule soon', rows: [['Workers with you', '7 agency cleaners at the airport'], ['12 weeks reached', '3 workers on 12 Oct: equal pay and holiday from then'], ['Agency licence', 'Valid'], ['This period', '£9,860 invoiced']], ask: 'Tell the agency', hold: 'Hold their invoice', reminded: 'Agency told at 06:20' },
      { name: 'Northern Window Services', status: 'ok', statusText: 'All clear', rows: [['Workers with you', 'High-level windows, monthly'], ['Insurance', 'Valid until Feb 2027'], ['Method statement', 'On file']] },
    ],
    contractorNeed: { t: '3 agency workers reach 12 weeks on 12 Oct', d: 'Equal pay and holiday apply from then (Agency Workers Regulations)' },
    approvals: [
      { id: 'ap1', kind: 'Missed punch', who: 'HF-2231', when: '2 days ago', title: 'Clock-out missing on Tue 15 Sep', detail: 'Early shift ended 14:00. Supervisor confirms he left at 14:05.', ask: 'Mark out at 14:05' },
      { id: 'ap2', kind: 'Missed punch', who: 'HF-2244', when: '2 days ago', title: 'Clock-out missing on Tue 22 Sep', detail: 'Airport pass log shows him out at 22:12.', ask: 'Mark out at 22:12' },
      { id: 'ap3', kind: 'Overtime', who: 'HF-2201', when: 'Yesterday', title: 'Airport overtime: 9 cleaners, 58 h', detail: 'Autumn passenger peak and extra security cleans requested by the airport.', ask: 'Approve 58 h overtime' },
      { id: 'ap4', kind: 'Holiday', who: 'HF-2201', when: 'Yesterday', title: 'Holiday, Fri 9 Oct', detail: '8 days of holiday left this year.', ask: 'Approve holiday' },
      { id: 'ap5', kind: 'Shift swap', who: 'HF-2231', when: '3 h ago', title: 'Swap Thu 8 Oct Early with Fatima Ahmed', detail: 'Both airside-cleared. No overtime either way.', ask: 'Approve swap' },
      { id: 'ap6', kind: 'Advance', whoName: 'Piotr Lewandowski', when: 'Mon', title: 'Advance, £150', detail: 'Recovered over the next 2 pay periods, staying above the minimum wage.', ask: 'Approve advance' },
      { id: 'ap7', kind: 'Expense', who: 'HF-2201', when: 'Mon', title: 'Airport staff parking, £42', detail: 'Receipt attached.', ask: 'Approve expense' },
      { id: 'ap8', kind: 'Sickness', whoName: 'Callum Hall', when: '1 h ago', title: 'Off sick, today', detail: 'Early at MediaCityUK, covered by Grace Wood.', ask: 'Record sickness' },
    ],
    late: { id: 'HF-2231', min: 9 }, lateWord: 'Early shift',
    outToday: [['Callum Hall', 'Off sick', 'MediaCityUK'], ['Joanna Kelly', 'Left on 2 Oct', 'MediaCityUK']],
    roster: { site: 'ma', week: ['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10', 'Sun 11'], hourCost: 14.9, budget: 15800, opens: [{ day: 3, shift: 'C' }, { day: 5, shift: 'B' }], fillers: ['Marek Wood', 'Holly Begum'] },
    cover: { who: 'HF-2240', site: 'sr', day: 1, text: 'Kofi Mensah is on nights at Salford Royal tonight, Ward 3. These domestics are free and have done ward induction:', cands: [{ name: 'Katarzyna Shaw', initials: 'KS', why: 'Off tonight · 30 h this week · ward induction done' }, { name: 'Aisha Okafor', initials: 'AO', why: 'Off tonight · 36 h this week' }, { name: 'Mohammed Begum', initials: 'MB', why: 'Off tonight · 48 h, would go into overtime' }], done: (c) => `${c.name} covers tonight. Kofi is recorded as off sick and both got a WhatsApp message.` },
    lateBySite: [['Manchester Airport T2', 19], ['MediaCityUK', 9], ['Spinningfields', 7], ['Salford Royal', 4], ['Trafford depot', 1]],
    ai: { cover: 'Kofi is off sick tonight, find cover', late: 'Late arrivals by site this period', rule: 'Pay time and a half on bank holidays', ruleText: 'Bank holidays: all hours are paid at 1.5× the hourly rate.', ruleCost: 'On last year’s 8 bank holidays this would have added £3,410 across 44 people.', ruleName: 'Bank holiday premium', ruleValue: '1.5× on bank holidays', leaveQ: 'How much holiday does Agnieszka have left?', leave: 'Agnieszka Nowak has 9 days of holiday left this year. Holiday needs 2 weeks’ notice in peak periods (Staff handbook, section 6).' },
    phone: { clock: 'HF-2231', clockSite: 'ma', gate: 'the QR code at staff entrance B', gps: '±160 m' },
    msg: { channel: 'Email & SMS', app: 'portal', name: 'Harbour & Field HR', hero: 'HF-2208', lang: 'en',
      hello: 'Hi Agnieszka, welcome to the Harbour & Field employee portal. Book holiday, view payslips and check your hours here.',
      ask: 'Can I take Friday 9 October off?', confirm: 'Holiday on Friday 9 October? You have 9 days left. Send to Sarah Whitworth for approval?', yes: 'Send request', no: 'Cancel',
      sent: 'Request sent. You will get an email when it is approved.', approved: 'Sarah Whitworth approved your holiday on Friday 9 October.', why: 'Why did my pay change?', fallback: 'I can help with holiday, payslips and your hours.',
      slip: (net, diff) => `Your payslip for 7 Sep – 4 Oct is ready. Take-home pay ${net}, ${diff} more than last period.`,
      whyIntro: 'You are paid more this period because of:', words: { basic: 'more basic hours', night: 'night premium', ot: 'overtime', hol: 'holiday pay', tax: 'income tax', ni: 'National Insurance', pen: 'pension' },
      leaveTitle: 'Holiday, Fri 9 Oct', leaveDetail: 'Requested on the employee portal. 9 days of holiday left.', approver: 'Sarah Whitworth' },
  };

  /* ---------------- India: Sentinel Facility Services, Pune ---------------- */
  const IN = {
    id: 'in', flag: '🇮🇳', seed: 20261006,
    company: { name: 'Sentinel Facility Services', short: 'Sentinel', city: 'Pune', region: 'Maharashtra', country: 'India', locale: 'en-IN', currency: 'INR',
      today: 'Tuesday, 6 October', nowMin: 8 * 60 + 14, period: 'September 2026', periodLong: 'September 2026', payBy: 'Wed, 7 Oct', cadence: 'Monthly',
      user: { name: 'Meera Deshpande', role: 'HR & payroll', initials: 'MD' }, greeting: 'Good morning, Meera',
      employerLine: 'Shivajinagar, Pune 411005 · PF PUPUN0048213000', idLabel: 'UAN', idValue: (p) => '1012 4471 ' + p.id.slice(-4) },
    shifts: [
      { key: 'C', label: 'Night', from: 0, to: 8 * 60, time: '00:00–08:00' },
      { key: 'A', label: 'Morning', from: 8 * 60, to: 16 * 60, time: '08:00–16:00' },
      { key: 'B', label: 'Evening', from: 16 * 60, to: 24 * 60, time: '16:00–24:00' },
    ],
    current: 'A', previous: 'C', next: 'B',
    sites: [
      { id: 'hjw', name: 'Hinjewadi Phase 2', client: 'Infodyne Technologies', staff: 46, x: 18, y: 34 },
      { id: 'mgp', name: 'Magarpatta Residency', client: 'Magarpatta Residency CHS', staff: 38, x: 74, y: 70 },
      { id: 'khd', name: 'EON Kharadi', client: 'Northgate Analytics', staff: 34, x: 80, y: 38 },
      { id: 'bnr', name: 'Baner Corporate Plaza', client: 'Baner Plaza Owners', staff: 26, x: 30, y: 24 },
      { id: 'vmn', name: 'Phoenix Viman Nagar', client: 'Phoenix Mall Pune', staff: 24, x: 70, y: 24 },
      { id: 'hq', name: 'Head office', client: 'Sentinel', staff: 14, x: 46, y: 50 },
    ],
    roles: {
      guard: { title: 'Security guard', basic: 14000, hra: 4000, special: 2000, ot: 140 },
      lady: { title: 'Lady guard', basic: 14500, hra: 4000, special: 2000, ot: 145 },
      sup: { title: 'Site supervisor', basic: 20000, hra: 6000, special: 4000, ot: 0 },
      hk: { title: 'Housekeeping', basic: 11000, hra: 3000, special: 1500, ot: 110 },
      tech: { title: 'Facility technician', basic: 16000, hra: 5000, special: 3000, ot: 160 },
      office: { title: 'Office staff', basic: 25000, hra: 10000, special: 8000, ot: 0 },
    },
    names: { m: ['Sunil', 'Suresh', 'Ravi', 'Anil', 'Santosh', 'Ganesh', 'Mahesh', 'Rahul', 'Vijay', 'Prakash', 'Sachin', 'Rohit', 'Amol', 'Nitin', 'Sandeep', 'Balaji', 'Kiran', 'Yogesh', 'Ramesh', 'Ajay', 'Tushar', 'Vikas', 'Sagar', 'Manoj', 'Dinesh', 'Akash', 'Pravin', 'Umesh'], f: ['Anita', 'Kavita', 'Sunita', 'Pooja', 'Priyanka', 'Swati', 'Rupali', 'Vaishali', 'Jyoti', 'Manisha', 'Sneha', 'Ashwini'] },
    last: ['Jadhav', 'Pawar', 'Kamble', 'Gaikwad', 'Shinde', 'More', 'Patil', 'Deshmukh', 'Kale', 'Bhosale', 'Salunkhe', 'Waghmare', 'Chavan', 'Mane', 'Kadam', 'Thorat', 'Londhe', 'Sawant', 'Jagtap', 'Mhaske', 'Nikam', 'Shelke', 'Gore', 'Sonawane'],
    fixed: {
      'EMP-0142': { name: 'Sunil Jadhav', g: 'm', role: 'guard', site: 'hjw', shift: 'C', post: 'Main gate', joined: '14 Mar 2022', u: { days: 30, paid: 29, ot: 16, nights: 9 }, prev: { days: 31, paid: 31, ot: 4, nights: 3 }, hero: true },
      'EMP-0157': { name: 'Suresh Pawar', g: 'm', role: 'guard', site: 'hjw', shift: 'A', post: 'Tower B lobby', joined: '2 Aug 2022', u: { days: 30, paid: 30, ot: 6, nights: 0 }, missed: '18 Sep' },
      'EMP-0163': { name: 'Ravi Kamble', g: 'm', role: 'guard', site: 'mgp', shift: 'C', post: 'Gate 2', joined: '19 Nov 2022', u: { days: 30, paid: 30, ot: 8, nights: 10 } },
      'EMP-0171': { name: 'Anil Gaikwad', g: 'm', role: 'guard', site: 'khd', shift: 'B', post: 'Basement parking', joined: '7 Jan 2023', u: { days: 30, paid: 30, ot: 22, nights: 0 }, missed: '22 Sep' },
      'EMP-0188': { name: 'Anita Shinde', g: 'f', role: 'lady', site: 'hjw', shift: 'A', post: 'Reception', joined: '1 Jun 2023', u: { days: 30, paid: 30, ot: 4, nights: 0 } },
      'EMP-0011': { name: 'Dattatray More', g: 'm', role: 'sup', site: 'hjw', shift: 'A', post: 'Site office', joined: '12 Apr 2019', u: { days: 30, paid: 30, ot: 0, nights: 0 } },
      'EMP-0012': { name: 'Balaji Deshmukh', g: 'm', role: 'sup', site: 'mgp', shift: 'A', post: 'Site office', joined: '9 Sep 2019', u: { days: 30, paid: 30, ot: 0, nights: 0 } },
      'EMP-0013': { name: 'Kiran Bhosale', g: 'm', role: 'sup', site: 'khd', shift: 'A', post: 'Site office', joined: '23 Jan 2020', u: { days: 30, paid: 30, ot: 0, nights: 0 } },
      'EMP-0002': { name: 'Vikram Joshi', g: 'm', role: 'office', site: 'hq', shift: 'A', post: 'Operations head', joined: '1 Apr 2016', u: { days: 30, paid: 30, ot: 0, nights: 0 }, title: 'Operations head' },
      'EMP-0003': { name: 'Meera Deshpande', g: 'f', role: 'office', site: 'hq', shift: 'A', post: 'HR', joined: '5 Jul 2018', u: { days: 30, paid: 30, ot: 0, nights: 0 }, title: 'HR & payroll' },
      'EMP-0249': { name: 'Pooja Waghmare', g: 'f', role: 'hk', site: 'vmn', shift: 'A', post: 'Food court', joined: '21 Sep 2026', u: { days: 30, paid: 10, ot: 0, nights: 0 }, joiner: true },
    },
    mix: (site) => { const r = rnd(); return site === 'hq' ? (r < 0.7 ? 'office' : 'tech') : r < 0.55 ? 'guard' : r < 0.68 ? 'lady' : r < 0.86 ? 'hk' : 'tech'; },
    genUnits: (p) => ({ days: 30, paid: rnd() < 0.82 ? 30 : int(27, 29), ot: p.role === 'sup' || p.role === 'office' ? 0 : p.site === 'khd' ? int(10, 26) : rnd() < 0.5 ? int(0, 12) : 0, nights: p.shift === 'C' ? int(6, 12) : 0 }),
    structure(p) {
      const r = this.roles[p.role];
      const step = p.step || 0;
      const total = r.basic + r.hra + r.special + step;
      if (!p.flag) return { basic: r.basic + step, hra: r.hra, special: r.special, total };
      const basic = Math.round(total * 0.4 / 100) * 100;
      const hra = Math.round(basic * 0.4 / 100) * 100;
      return { basic, hra, special: total - basic - hra, total };
    },
    /* EPF 12% of earned basic (ceiling ₹25,000), ESI 0.75% / 3.25% when fixed pay ≤ ₹21,000 (rounded up),
       Maharashtra PT ₹200 (women earning up to ₹25,000 pay none). */
    pay(p, u = p.u) {
      const s = this.structure(p);
      const f = u.paid / u.days;
      const basic = r0(s.basic * f), hra = r0(s.hra * f), special = r0(s.special * f);
      const otRate = this.roles[p.role].ot;
      const earn = [{ k: 'basic', label: 'Basic', amt: basic }, { k: 'hra', label: 'House rent allowance', amt: hra }, { k: 'special', label: 'Special allowance', amt: special }];
      if (u.ot) earn.push({ k: 'ot', label: `Overtime (${u.ot} h)`, amt: u.ot * otRate });
      if (u.nights) earn.push({ k: 'night', label: `Night allowance (${u.nights} nights)`, amt: u.nights * 50 });
      const gross = earn.reduce((t, x) => t + x.amt, 0);
      const esiOn = s.total <= 21000;
      const ded = [{ k: 'epf', label: 'Provident fund', amt: r0(Math.min(basic, 25000) * 0.12) }];
      if (esiOn) ded.push({ k: 'esi', label: 'ESI', amt: Math.ceil(gross * 0.0075) });
      const pt = p.g === 'f' && gross <= 25000 ? 0 : gross > 10000 ? 200 : gross > 7500 ? 175 : 0;
      if (pt) ded.push({ k: 'pt', label: 'Professional tax', amt: pt });
      if (s.total >= 43000) ded.push({ k: 'tds', label: 'TDS', amt: 1150 });
      const er = [{ k: 'erepf', label: 'Employer PF', amt: ded[0].amt }];
      if (esiOn) er.push({ k: 'eresi', label: 'Employer ESI', amt: Math.ceil(gross * 0.0325) });
      const d = ded.reduce((t, x) => t + x.amt, 0);
      return { earn, ded, er, gross, dedTotal: d, net: gross - d, erTotal: er.reduce((t, x) => t + x.amt, 0), work: u.paid, unpaid: p.joiner ? 0 : u.days - u.paid, otHours: u.ot || 0, otPay: earn.find((x) => x.k === 'ot')?.amt ?? 0, extra: earn.find((x) => x.k === 'night')?.amt ?? 0, structure: s };
    },
    unitWords: { work: 'Paid days', unpaid: 'Loss-of-pay days', extra: 'Night allowance', days: 30 },
    whyWords: { basic: 'Basic (days paid)', hra: 'House rent allowance (days paid)', special: 'Special allowance (days paid)', ot: 'Overtime', night: 'Night allowance', epf: 'Provident fund', esi: 'ESI' },
    statutory: [['Provident fund (12% of wages, ceiling ₹25,000)', 'epf', 'erepf'], ['ESI (0.75% / 3.25%, wages up to ₹21,000)', 'esi', 'eresi'], ['Professional tax, Maharashtra', 'pt', null], ['TDS on salary', 'tds', null]],
    steps: [['Attendance & loss of pay', 'From the muster'], ['Joiners & exits', 'New people, F&F'], ['Overtime & allowances', 'OT, night, shift'], ['Reimbursements', 'Expenses, advances'], ['Holds & arrears', 'Paused pay'], ['Statutory & lock', 'PF, ESI, PT, TDS']],
    checks: {
      punch: { title: '2 missed punches', text: 'Suresh Pawar (18 Sep) and Anil Gaikwad (22 Sep) have a day without a clock-in or clock-out.', fix: 'Approve' },
      ot: { title: 'Overtime 64% above August at EON Kharadi', text: '61 extra hours across 3 guards during the client’s data-centre move. Approve before paying it.', fix: 'Approve' },
      bank: { title: 'New joiner without bank details', text: 'Pooja Waghmare joined on 21 Sep and has no bank account on file.', fix: 'Hold payout', done: 'Pooja Waghmare: salary processed, payout held until bank details arrive' },
      rule: { title: '11 salary structures break the 50% wage rule', text: 'Basic is 40% of pay for 11 technicians and office staff. The Code on Wages needs at least 50%.', fix: 'Fix in Compliance' },
    },
    joiners: [{ initials: 'PW', name: 'Pooja Waghmare', text: 'Housekeeping, Phoenix Viman Nagar · joined 21 Sep · 10 paid days', missing: 'No bank account', hold: 'Payout on hold' }, { initials: 'AL', name: 'Akash Londhe', text: 'Security guard, EON Kharadi · last day 3 Oct · full & final due Wed 7 Oct (2 working days)', ready: 'F&F ready · ₹16,840' }],
    money: [['ap7', 'Torches and batteries, Magarpatta', 'Balaji Deshmukh · expense', 1850], ['ap6', 'Salary advance, Ramesh Thorat', 'Paid now, recovered over 2 months from October', 5000]],
    lockFigs: (T) => [['PF to deposit by 15 Oct', T.epf + T.erepf]],
    files: [['XLSX', 'Bank transfer file', 'HDFC bulk upload'], ['TXT', 'PF ECR', 'For the EPFO portal'], ['XLSX', 'ESI contributions', 'For the ESIC portal'], ['PDF', 'PT challan, Maharashtra', 'Due 31 Oct'], ['PDF', 'Payroll register', 'All employees'], ['PDF', 'Cash and cheque list', '1 held payout']],
    rules: [
      { name: 'EPF wage ceiling', value: '₹25,000 a month', from: '17 Sep 2026', was: '₹15,000', note: 'Employees earning up to ₹25,000 must now join EPS.' },
      { name: 'Wages are at least 50% of pay', value: 'Basic + DA ≥ 50% of total pay', from: '21 Nov 2025', note: 'Code on Wages. Allowances above 50% count as wages for PF and gratuity.' },
      { name: 'Overtime rate', value: '2× the normal hourly wage', from: '21 Nov 2025', note: 'Code on Wages.' },
      { name: 'Full & final settlement', value: 'Within 2 working days', from: '21 Nov 2025', note: 'Resignation, termination and retrenchment.' },
      { name: 'ESI', value: '0.75% employee · 3.25% employer', from: '1 Jul 2019', note: 'Covers wages up to ₹21,000 a month.' },
      { name: 'Professional tax, Maharashtra', value: '₹200 a month, ₹300 in February', from: '1 Apr 2023', note: 'Women earning up to ₹25,000 are exempt.' },
      { name: 'Salary TDS forms', value: 'Form 130 (was 16) · Form 138 (was 24Q)', from: '1 Apr 2026', note: 'Income-tax Act 2025.' },
    ],
    ruleFlag: {
      title: '11 salary structures break the 50% wage rule',
      text: 'Under the Code on Wages, basic pay must be at least half of total pay. Raising basic raises PF, so take-home falls a little. Here is the change for each person before you apply it.',
      cols: ['Person', 'Basic now', 'Basic after', 'PF now', 'PF after', 'Take-home change'],
      row: (p, pay) => { const s = pay.structure; const nb = Math.round(s.total * 0.5 / 100) * 100; const a = Math.round(s.basic * 0.12), b = Math.round(Math.min(nb, 25000) * 0.12); const f = (n) => '₹' + n.toLocaleString('en-IN'); return [`${f(s.basic)} · 40%`, `${f(nb)} · 50%`, f(a), f(b), `−${f(b - a)}`]; },
      apply: 'Restructure 11 people', done: 'Restructured 11 people from October. Their take-home changes by a few hundred rupees a month because more of their pay now counts for PF.', letters: 'Draft letters to them',
    },
    contractors: [
      { name: 'Shield Manpower Services', status: 'bad', statusText: 'Proof missing', rows: [['Workers with you', '40 guards and housekeeping staff'], ['Licence', 'Valid until 31 Mar 2027'], ['September PF proof', 'Not uploaded'], ['September ESI proof', 'Uploaded 4 Oct'], ['Monthly invoice', '₹9,84,000']], ask: 'Ask for PF proof', hold: 'Hold their invoice', reminded: 'Asked on WhatsApp at 08:20' },
      { name: 'Swachh Facility Partners', status: 'ok', statusText: 'All clear', rows: [['Workers with you', 'Deep-cleaning crew, on call'], ['Licence', 'Valid until 30 Nov 2027'], ['September proofs', 'PF and ESI uploaded 3 Oct']] },
    ],
    contractorNeed: { t: 'Shield Manpower has not uploaded September PF proof', d: '40 of your guards are on their rolls' },
    approvals: [
      { id: 'ap1', kind: 'Missed punch', who: 'EMP-0157', when: '2 days ago', title: 'Clock-out missing on Fri 18 Sep', detail: 'Shift A ended 16:00. Supervisor confirms he left at 16:05.', ask: 'Mark out at 16:05' },
      { id: 'ap2', kind: 'Missed punch', who: 'EMP-0171', when: '2 days ago', title: 'Clock-in missing on Tue 22 Sep', detail: 'Gate register shows him in at 15:52 for shift B.', ask: 'Mark in at 15:52' },
      { id: 'ap3', kind: 'Overtime', who: 'EMP-0013', when: 'Yesterday', title: 'September overtime at EON Kharadi: 3 guards, 61 h', detail: 'Client asked for extra night patrol during the data-centre move (18–27 Sep).', ask: 'Approve 61 h overtime' },
      { id: 'ap4', kind: 'Leave', who: 'EMP-0188', when: 'Yesterday', title: 'Casual leave, Fri 9 Oct', detail: 'Family function. Balance 4 casual leaves.', ask: 'Approve leave' },
      { id: 'ap5', kind: 'Shift swap', who: 'EMP-0188', when: '3 h ago', title: 'Swap Thu 8 Oct shift A with Kavita Patil', detail: 'Both cleared for Reception post. No overtime either way.', ask: 'Approve swap' },
      { id: 'ap6', kind: 'Advance', whoName: 'Ramesh Thorat', when: 'Mon', title: 'Salary advance ₹5,000', detail: 'Recover over 2 months from October. Within the 50% deduction limit.', ask: 'Approve advance' },
      { id: 'ap7', kind: 'Expense', who: 'EMP-0012', when: 'Mon', title: 'Torches and batteries for night patrol, ₹1,850', detail: 'Bill attached. Magarpatta night team.', ask: 'Approve expense' },
      { id: 'ap8', kind: 'Leave', whoName: 'Sachin Mane', when: '1 h ago', title: 'Sick leave, today', detail: 'Fever. Shift A Baner, already covered by Rohit Kale.', ask: 'Approve leave' },
    ],
    late: { id: 'EMP-0157', min: 14 }, lateWord: 'shift A',
    outToday: [['Sachin Mane', 'Sick leave', 'Baner'], ['Rupali Kadam', 'Casual leave', 'Magarpatta'], ['Akash Londhe', 'Last day was 3 Oct', 'Kharadi']],
    roster: { site: 'hjw', week: ['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10', 'Sun 11'], hourCost: 118, budget: 82000, opens: [{ day: 3, shift: 'C' }, { day: 5, shift: 'B' }], fillers: ['Rohit Kale', 'Amol Nikam'] },
    cover: { who: 'EMP-0163', site: 'mgp', day: 1, text: 'Ravi Kamble is on night shift (C) at Magarpatta Residency tonight, Gate 2. These guards are free and trained for that site:', cands: [{ name: 'Kiran Shelke', initials: 'KS', why: 'Off tonight · 40 h this week · knows Gate 2' }, { name: 'Ganesh Mhaske', initials: 'GM', why: 'Off tonight · 44 h this week' }, { name: 'Vijay Sawant', initials: 'VS', why: 'Off tonight · 48 h, would go into overtime' }], done: (c) => `${c.name} covers tonight. Ravi’s shift is marked as sick leave and both got a WhatsApp message.` },
    lateBySite: [['Hinjewadi Phase 2', 31], ['EON Kharadi', 24], ['Magarpatta Residency', 17], ['Phoenix Viman Nagar', 12], ['Baner Corporate Plaza', 9], ['Head office', 2]],
    ai: { cover: 'Ravi is sick tonight, find cover', late: 'Late arrivals by site this month', rule: 'Overtime is 2× after 9 hours at Kharadi', ruleText: 'EON Kharadi: overtime after 9 hours in a day is paid at 2× the hourly wage.', ruleCost: 'On September data this adds ₹18,420 across 23 guards. Starts from 1 October.', ruleName: 'Overtime at EON Kharadi', ruleValue: '2× after 9 hours in a day', leaveQ: 'How many leaves does Sunil have?', leave: 'Sunil Jadhav has 5 casual, 6 sick and 11 earned leaves left. Casual leave needs 1 day’s notice to his supervisor (Leave policy, section 3.2).' },
    phone: { clock: 'EMP-0157', clockSite: 'hjw', gate: 'the QR code at the Tower B gate', gps: '±180 m' },
    msg: { channel: 'Email & SMS', app: 'portal', name: 'Sentinel HR', hero: 'EMP-0142', lang: 'en',
      hello: 'Hello Sunil, welcome to the Sentinel employee portal. Apply for leave, download payslips and check your attendance here.',
      ask: 'I need leave on the 12th to visit my village.', confirm: 'Casual leave on Monday, 12 October? You have 5 casual leaves left. Send to Dattatray More for approval?', yes: 'Send request', no: 'Cancel',
      sent: 'Request sent. You will get an SMS when it is approved.', approved: 'Dattatray More approved your casual leave for Monday, 12 October.', why: 'Why did my pay change?', fallback: 'I can help with leave, payslips and attendance.',
      slip: (net, diff) => `Your payslip for September 2026 is ready. Net pay ${net}, ${diff} more than last month.`,
      whyIntro: 'Your pay changed this month because of:', words: { basic: 'basic (1 day loss of pay)', hra: 'HRA', special: 'special allowance', ot: 'overtime', night: 'night allowance', epf: 'PF', esi: 'ESI' },
      leaveTitle: 'Casual leave, Mon 12 Oct', leaveDetail: 'Requested on the employee portal. Balance 5 casual leaves.', approver: 'Dattatray More' },
  };

  /* ---------------- engine ---------------- */
  function build(cfg) {
    seed = cfg.seed;
    const people = [];
    Object.entries(cfg.fixed).forEach(([id, p]) => people.push({ id, ...p }));
    const taken = new Set(people.map((p) => p.name));
    const prefix = cfg.id === 'us' ? 'CC-' : cfg.id === 'uk' ? 'HF-' : 'EMP-0';
    let n = 300;
    cfg.sites.forEach((s) => {
      let have = people.filter((p) => p.site === s.id).length;
      while (have < s.staff) {
        const role = cfg.mix(s.id);
        const g = /lady/.test(role) || rnd() < (role === 'guard' ? 0 : 0.45) ? 'f' : 'm';
        let name = `${pick(cfg.names[g])} ${pick(cfg.last)}`, tries = 0;
        while (taken.has(name) && tries++ < 60) name = `${pick(cfg.names[g])} ${pick(cfg.last)}`;
        taken.add(name);
        const p = { id: `${prefix}${n++}`, name, g, role, site: s.id, shift: cfg.roles[role].salary || role === 'office' ? 'A' : pick(['A', 'A', 'B', 'C']), post: pick(['Front', 'Lobby', 'Floor 2', 'Back of house', 'Gate', 'Patrol', 'Ward', 'Line']), joined: `${pick(['Jan', 'Mar', 'Jun', 'Aug', 'Nov'])} ${int(2019, 2025)}` };
        p.u = cfg.genUnits(p);
        people.push(p); have++;
      }
    });
    const sups = (site) => people.find((q) => q.site === site && (q.role === 'sup' || q.role === 'lead'));
    people.forEach((p) => { p.supervisor = p.supervisor ?? (p.role === 'office' ? null : sups(p.site)?.id ?? null); if (p.supervisor === p.id) p.supervisor = null; });
    // Contract workers, and the group the compliance flag is about.
    if (cfg.id === 'in') {
      people.filter((p) => (p.role === 'guard' || p.role === 'hk') && !cfg.fixed[p.id]).slice(0, 40).forEach((p) => (p.contractor = 'Shield Manpower Services'));
      [...people.filter((p) => p.role === 'tech').slice(0, 7), ...people.filter((p) => p.role === 'office' && !cfg.fixed[p.id]).slice(0, 4)].forEach((p) => (p.flag = true));
      people.forEach((p) => { p.step = cfg.fixed[p.id] ? 0 : int(0, 6) * 500; });
    }
    if (cfg.id === 'uk') people.filter((p) => p.role === 'cleaner' && !cfg.fixed[p.id] && p.u.hours === 160).slice(0, 6).forEach((p) => (p.flag = true));
    if (cfg.id === 'us') people.filter((p) => !cfg.fixed[p.id] && ['barista', 'baker', 'lead'].includes(p.role) && rnd() < 0.6).forEach((p) => (p.k401 = true));
    people.forEach((p) => { p.title = p.title ?? cfg.roles[p.role].title; p.initials = p.name.split(' ').map((w) => w[0]).join(''); p.pay = cfg.pay(p); });
    const byId = Object.fromEntries(people.map((p) => [p.id, p]));

    // Totals by line key, plus gross, deductions, net, employer cost.
    const totals = { gross: 0, dedTotal: 0, net: 0, erTotal: 0, unpaid: 0 };
    people.forEach((p) => {
      totals.gross += p.pay.gross; totals.dedTotal += p.pay.dedTotal; totals.net += p.pay.net; totals.erTotal += p.pay.erTotal; totals.unpaid += p.pay.unpaid;
      [...p.pay.ded, ...p.pay.er].forEach((x) => (totals[x.k] = (totals[x.k] || 0) + x.amt));
    });
    totals.cost = totals.gross + totals.erTotal;
    totals.prevNet = totals.net / 1.019;

    // Who is on the current shift and who isn't in yet.
    const lateMap = { [cfg.late.id]: cfg.late.min };
    const absent = new Set();
    people.filter((p) => p.shift === cfg.current && !cfg.fixed[p.id] && p.role !== 'office').forEach((p, i) => { if (i % 17 === 5) absent.add(p.id); else if (i % 13 === 3) lateMap[p.id] = int(4, 22); });
    const live = cfg.sites.map((s) => { const due = people.filter((p) => p.site === s.id && p.shift === cfg.current); return { site: s.id, due: due.length, in: due.filter((p) => !absent.has(p.id) && !lateMap[p.id]).length, late: due.filter((p) => lateMap[p.id]).length, absent: due.filter((p) => absent.has(p.id)).length }; });

    // "Why did my pay change": every line of this period against last period, for the hero.
    const hero = people.find((p) => p.hero);
    const prevPay = cfg.pay(hero, hero.prev);
    const keys = [...new Set([...hero.pay.earn, ...prevPay.earn].map((x) => x.k))];
    const dkeys = [...new Set([...hero.pay.ded, ...prevPay.ded].map((x) => x.k))];
    const amt = (pay, list, k) => pay[list].find((x) => x.k === k)?.amt ?? 0;
    const why = [...keys.map((k) => ({ k, v: amt(hero.pay, 'earn', k) - amt(prevPay, 'earn', k) })), ...dkeys.map((k) => ({ k, v: amt(prevPay, 'ded', k) - amt(hero.pay, 'ded', k) }))].filter((x) => Math.abs(x.v) >= 0.005).map((x) => ({ ...x, label: cfg.whyWords[x.k] ?? x.k }));

    return { ...cfg, people, byId, totals, live, lateMap, absent, hero, prevPay, why, hhmm };
  }

  const DATA = { us: build(US), uk: build(UK), in: build(IN) };
  /* Other country packs, listed so it's clear the product isn't tied to three countries. */
  const PACKS = [
    ['🇺🇸', 'United States', 'Federal, all 50 states, FLSA, I-9', 'live'], ['🇬🇧', 'United Kingdom', 'PAYE, RTI, NI, auto-enrolment', 'live'], ['🇮🇳', 'India', 'PF, ESI, PT, TDS, Labour Codes', 'live'],
    ['🇨🇦', 'Canada', 'CPP, EI, provincial tax, ROE', 'pack'], ['🇦🇺', 'Australia', 'PAYG, Single Touch Payroll, super', 'pack'], ['🇦🇪', 'UAE', 'WPS salary files, gratuity, MOHRE', 'pack'],
    ['🇸🇬', 'Singapore', 'CPF, IR8A, SDL', 'pack'], ['🇵🇭', 'Philippines', 'SSS, PhilHealth, Pag-IBIG, 13th month', 'pack'], ['🇩🇪', 'Germany', 'Lohnsteuer, social insurance, Minijobs', 'pack'],
    ['🇧🇷', 'Brazil', 'eSocial, FGTS, INSS, 13º salário', 'pack'], ['🇲🇽', 'Mexico', 'IMSS, ISR, CFDI payroll receipts', 'pack'], ['🇿🇦', 'South Africa', 'PAYE, UIF, SDL, IRP5', 'pack'],
  ];
  window.PO = Object.assign(window.PO || {}, { DATA, PACKS, order: ['in', 'us', 'uk'] });
})();
