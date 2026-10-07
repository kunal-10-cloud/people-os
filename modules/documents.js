/* People OS: company and employee documents, HR letters, and the asset register.
   Exposes PO.DocKit = { LetterPreview, LetterDrawer, AssignAssetDrawer } for the profile and exits screens. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect } = PO;
  const { Icon, Avatar, Who, Badge, Status, Button, IconButton, Menu, Tabs, Segmented, Switch, PageHeader, Card, Stat, Empty, Callout, Progress, KV, Timeline, Field, Drawer, Modal, DataTable } = PO;
  const PX = () => PO.PX;
  const TODAY = PO.TODAY;
  const addDays = (s, n) => PO.addDays(s, n);

  document.head.insertAdjacentHTML('beforeend', `<style>
  .dk-folders { display:flex; flex-direction:column; gap:2px; }
  .dk-folder { display:flex; align-items:center; gap:10px; height:40px; padding:0 10px; border-radius:var(--r); border:none; background:none; cursor:pointer; color:var(--text-2); font-weight:500; text-align:left; width:100%; }
  .dk-folder:hover { background:var(--hover); color:var(--text); }
  .dk-folder.on { background:var(--surface-3); color:var(--text); font-weight:600; }
  .dk-mx { border-collapse:separate; border-spacing:0; width:100%; }
  .dk-mx th { position:sticky; top:0; background:var(--surface-2); font-size:11.5px; font-weight:550; color:var(--text-2); padding:8px 6px; border-bottom:1px solid var(--border); white-space:nowrap; text-align:center; z-index:2; }
  .dk-mx th:first-child { text-align:left; padding-left:14px; left:0; z-index:3; }
  .dk-mx td { border-bottom:1px solid var(--border); padding:6px; text-align:center; height:44px; }
  .dk-mx td:first-child { text-align:left; padding-left:14px; position:sticky; left:0; background:var(--surface); z-index:1; min-width:220px; }
  .dk-mx tr:hover td { background:var(--hover); }
  .dk-dot { width:22px; height:22px; border-radius:5px; display:inline-grid; place-items:center; border:none; background:none; cursor:pointer; padding:0; }
  .dk-dot:hover { background:var(--surface-3); }
  .dk-dot::before { content:''; width:9px; height:9px; border-radius:50%; background:var(--border-strong); }
  .dk-dot.Verified::before { background:var(--brand); }
  .dk-dot.Missing::before, .dk-dot.Expired::before { background:var(--red-solid); }
  .dk-dot.Pending::before, .dk-dot.Expiring::before { background:var(--amber-solid); }
  .dk-dot.Requested::before { background:transparent; border:1.5px solid var(--text-3); width:8px; height:8px; }
  .dk-dot.Not::before { background:transparent; border:1.5px dashed var(--border-strong); width:8px; height:8px; }
  .dk-file { width:28px; height:32px; border-radius:4px; border:1px solid var(--border); background:var(--surface-2); display:grid; place-items:center; font-size:9px; font-weight:700; color:var(--text-3); flex:none; }
  .dk-paper { background:var(--surface); color:var(--text); border-radius:6px; box-shadow:var(--shadow-md); padding:32px 36px; max-width:640px; margin:0 auto; font-size:12.5px; line-height:1.65; border:1px solid var(--border); }
  .dk-paper .dk-lh { display:flex; align-items:center; gap:12px; border-bottom:2px solid var(--brand); padding-bottom:12px; margin-bottom:18px; }
  .dk-paper .dk-logo { width:36px; height:36px; border-radius:6px; background:var(--brand); color:var(--ink-text); display:grid; place-items:center; font-weight:700; font-size:13px; }
  .dk-paper p { margin:0 0 10px; }
  .dk-paper h4 { font-size:14px; margin:14px 0 10px; text-align:center; letter-spacing:.02em; }
  .dk-mf { background:var(--brand-soft); color:var(--brand-text); border-radius:4px; padding:0 3px; font-weight:550; }
  .dk-sig { margin-top:22px; display:flex; justify-content:space-between; align-items:flex-end; }
  .dk-sig .dk-sign { font-family:'Brush Script MT', cursive; font-size:22px; color:var(--brand-text); line-height:1; }
  .dk-tpl { padding:10px 12px; display:flex; gap:12px; align-items:flex-start; cursor:pointer; border:none; border-bottom:1px solid var(--border); background:var(--surface); text-align:left; width:100%; }
  .dk-tpl:last-child { border-bottom:none; }
  .dk-tpl:hover { background:var(--hover); }
  .dk-tpl.on { background:var(--surface-2); box-shadow:inset 2px 0 0 var(--brand); }
  .dk-tpl .dk-ti { width:34px; height:34px; border-radius:9px; display:grid; place-items:center; background:var(--surface-3); color:var(--text-2); flex:none; }
  .dk-tpl.on .dk-ti { background:var(--surface); color:var(--brand-text); }
  .dk-stock { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  </style>`);

  /* =====================================================================
     Letters
     ===================================================================== */
  function templates(P) {
    if (P.id === 'in') return [
      ['offer', 'Offer letter', 'FileSignature', 'CTC, joining date, site'], ['appointment', 'Appointment letter', 'BadgeCheck', 'Terms under the Labour Codes'], ['confirmation', 'Confirmation letter', 'CircleCheck', 'After 6-month probation'],
      ['salary', 'Salary certificate', 'IndianRupee', 'For bank loans and visas'], ['address', 'Address proof letter', 'House', 'For Aadhaar or bank KYC'], ['increment', 'Increment letter', 'TrendingUp', 'Annual revision'],
      ['experience', 'Experience letter', 'Award', 'Service record'], ['relieving', 'Relieving letter', 'DoorOpen', 'After F&F is paid'], ['warning', 'Warning letter', 'TriangleAlert', 'Conduct or attendance'],
    ];
    if (P.id === 'us') return [
      ['offer', 'Offer letter', 'FileSignature', 'Rate, schedule, start date'], ['verification', 'Employment verification', 'BadgeCheck', 'For landlords and lenders'], ['pay', 'Pay verification', 'DollarSign', 'Rate and average hours'],
      ['raise', 'Pay increase letter', 'TrendingUp', 'New hourly rate'], ['reference', 'Reference letter', 'Award', 'On request'], ['separation', 'Separation letter', 'DoorOpen', 'Last day and final pay'], ['warning', 'Written warning', 'TriangleAlert', 'Attendance or conduct'],
    ];
    return [
      ['offer', 'Offer letter', 'FileSignature', 'Rate, hours, start date'], ['contract', 'Statement of particulars', 'ScrollText', 'Required from day 1'], ['earnings', 'Proof of earnings', 'PoundSterling', 'For landlords and lenders'],
      ['reference', 'Employment reference', 'Award', 'Dates and job title'], ['payrise', 'Pay rise letter', 'TrendingUp', 'New hourly rate'], ['p45', 'P45 cover letter', 'DoorOpen', 'Sent with the P45'], ['warning', 'Written warning', 'TriangleAlert', 'Under the ACAS code'],
    ];
  }
  const refNo = (P, tpl, p) => `${P.company.short.split(/[\s&]+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase()}/${tpl.slice(0, 3).toUpperCase()}/${p.id.replace(/\D/g, '').slice(-4)}/2026`;

  function LetterPreview({ tpl, p, extra = {} }) {
    const P = PO.P();
    const C = P.company;
    const IN = P.id === 'in', US = P.id === 'us';
    const M = ({ children }) => html`<span class="dk-mf">${children}</span>`;
    const site = PO.site(p.site) || {};
    const hr = P.byId[P.hrId];
    const pay = p.pay;
    const role = P.roles[p.role] || {};
    const rate = role.rate ? `${PO.money(role.rate, { cents: true })} an hour` : role.salary ? `${PO.money(role.salary)} a ${US ? 'bi-weekly' : 'four-weekly'} period` : '';
    const monthly = pay && pay.structure ? PO.money(pay.structure.total) : pay ? PO.money(pay.gross) : '—';
    const annual = p.ctc ? PO.money(p.ctc) : '—';
    const he = p.g === 'f' ? 'She' : 'He', his = p.g === 'f' ? 'her' : 'his';
    const title = (templates(P).find((t) => t[0] === tpl) || [tpl, 'Letter'])[1];
    const last = extra.lastDay || TODAY;
    const sal = p.g === 'f' ? (IN ? 'Ms.' : 'Ms') : IN ? 'Mr.' : 'Mr';
    const body = {
      offer: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>We are pleased to offer you the position of <${M}>${p.title}</${M}> at <${M}>${site.name}</${M}>, starting <${M}>${PO.date(p.joinedIso)}</${M}>, on shift ${p.shift} (${(PO.shiftOf(p.shift) || {}).time}).</p><p>${IN ? html`Your annual cost to company is <${M}>${annual}</${M}>, with a monthly gross of <${M}>${monthly}</${M}>. Basic pay is at least 50% of wages, as the Code on Wages requires.` : html`Your pay is <${M}>${rate}</${M}>${US ? ', paid bi-weekly by direct deposit. Overtime is paid at 1.5× after 40 hours in a workweek.' : ', paid every four weeks by BACS. You will be auto-enrolled into our workplace pension.'}`}</p><p>Please sign and return this letter by ${PO.date(addDays(TODAY, 3))}.</p>`,
      appointment: html`<p>Dear <${M}>${p.name}</${M}>,</p><p>Further to your offer, you are appointed as <${M}>${p.title}</${M}> (grade ${p.grade}) with effect from <${M}>${PO.date(p.joinedIso)}</${M}>, posted at <${M}>${site.name}</${M}>${site.client && site.client !== 'Sentinel' ? html` for our client <${M}>${site.client}</${M}>` : ''}.</p><p>You will be on probation for six months. Either side may end employment with 30 days' notice. Provident fund, ESI and gratuity apply as per the Labour Codes. Your UAN is <${M}>${p.ids ? p.ids.uan : '—'}</${M}>.</p>`,
      confirmation: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>We are happy to confirm your employment as <${M}>${p.title}</${M}> with effect from <${M}>${PO.date(addDays(p.joinedIso, 182))}</${M}>, on completion of your probation. All other terms of your appointment remain unchanged.</p>`,
      salary: html`<p>This is to certify that <${M}>${sal} ${p.name}</${M}> (employee ID <${M}>${p.id}</${M}>) has been employed with ${C.name} since <${M}>${PO.date(p.joinedIso)}</${M}> as <${M}>${p.title}</${M}>.</p><p>${his[0].toUpperCase() + his.slice(1)} current gross monthly salary is <${M}>${monthly}</${M}> and annual CTC is <${M}>${annual}</${M}>. Salary is credited to ${his} account with <${M}>${p.bank ? p.bank.name : '—'}</${M}>.</p><p>This certificate is issued at ${his} request for submission to a bank.</p>`,
      address: html`<p>This is to certify that <${M}>${sal} ${p.name}</${M}> is employed with us as <${M}>${p.title}</${M}> since <${M}>${PO.date(p.joinedIso)}</${M}> and resides in <${M}>${p.city}</${M}>, Pune, as per our records.</p><p>This letter is issued for address verification purposes.</p>`,
      increment: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>In recognition of your work at <${M}>${site.name}</${M}>, your monthly wages are revised to <${M}>${pay && pay.structure ? PO.money(Math.round(pay.structure.total * 1.07)) : monthly}</${M}> with effect from <${M}>1 April 2026</${M}>, including the Maharashtra VDA revision.</p>`,
      experience: html`<p>This is to certify that <${M}>${sal} ${p.name}</${M}> worked with ${C.name} as <${M}>${p.title}</${M}> from <${M}>${PO.date(p.joinedIso)}</${M}> to <${M}>${PO.date(last)}</${M}>.</p><p>During this period ${he.toLowerCase()} was posted at <${M}>${site.name}</${M}>. We found ${his} conduct good and wish ${p.g === 'f' ? 'her' : 'him'} well.</p>`,
      relieving: html`<p>Dear <${M}>${p.name}</${M}>,</p><p>With reference to your resignation, you are relieved from your duties as <${M}>${p.title}</${M}> at the close of business on <${M}>${PO.date(last)}</${M}>.</p><p>Your full and final settlement of <${M}>${extra.net != null ? PO.money(extra.net) : '—'}</${M}> has been processed. Your PF exit date has been updated on the EPFO portal.</p>`,
      warning: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>This letter is a formal ${IN ? 'warning' : 'written warning'} about <${M}>${p.missed ? `a missed punch on ${p.missed} without regularisation` : 'repeated late arrivals at your post'}</${M}>. ${P.id === 'uk' ? 'You have the right to appeal within 5 working days, in line with the ACAS Code of Practice.' : 'Further instances may lead to disciplinary action.'}</p><p>Please acknowledge receipt in the employee portal under My documents.</p>`,
      verification: html`<p>To whom it may concern,</p><p>This letter confirms that <${M}>${p.name}</${M}> ${extra.lastDay ? html`was employed` : 'is employed'} by ${C.name} as a <${M}>${p.title}</${M}> since <${M}>${PO.date(p.joinedIso)}</${M}>${extra.lastDay ? html` until <${M}>${PO.date(last)}</${M}>` : ''}, working at our <${M}>${site.name}</${M}> location.</p><p>Employment status: <${M}>${extra.lastDay ? 'Former employee' : p.type}</${M}>.</p>`,
      pay: html`<p>To whom it may concern,</p><p><${M}>${p.name}</${M}> is employed as a <${M}>${p.title}</${M}> at <${M}>${rate}</${M}>, averaging <${M}>${p.u && p.u.reg ? Math.round(p.u.reg / 2) : 40} hours</${M}> a week. Gross pay for the last period was <${M}>${pay ? PO.money(pay.gross) : '—'}</${M}>.</p>`,
      raise: html`<p>Hi <${M}>${p.first}</${M}>,</p><p>Thanks for your work at <${M}>${site.name}</${M}>. Your pay goes up to <${M}>${role.rate ? PO.money(role.rate + 0.75, { cents: true }) + ' an hour' : rate}</${M}> starting with the pay period that begins <${M}>${PO.date('2026-10-05')}</${M}>.</p>`,
      reference: html`<p>To whom it may concern,</p><p>I confirm that <${M}>${p.name}</${M}> was employed by ${C.name} as <${M}>${p.title}</${M}> from <${M}>${PO.date(p.joinedIso)}</${M}>${extra.lastDay ? html` to <${M}>${PO.date(last)}</${M}>` : ' to date'}. ${p.first} was reliable and worked well with the team at <${M}>${site.name}</${M}>.</p>`,
      separation: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>This confirms that your employment with ${C.name} ends on <${M}>${PO.date(last)}</${M}>. Your final pay of <${M}>${extra.net != null ? PO.money(extra.net) : '—'}</${M}>, including any PTO payout under our policy, will be paid by <${M}>${PO.date(PO.LC ? PO.LC.deadlineOf(P, { lastDay: last, reason: 'Resigned' }).date : last)}</${M}> under the Texas Payday Law.</p><p>Information about continuing health coverage under COBRA will be mailed to you.</p>`,
      contract: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>This written statement sets out the main terms of your employment as <${M}>${p.title}</${M}>, starting <${M}>${PO.date(p.joinedIso)}</${M}>, at <${M}>${site.name}</${M}>. Pay: <${M}>${rate}</${M}>. Holiday: 5.6 weeks a year, pro rata. Pension: auto-enrolment into NEST.</p>`,
      earnings: html`<p>To whom it may concern,</p><p><${M}>${p.name}</${M}> is employed as <${M}>${p.title}</${M}> at <${M}>${rate}</${M}>. Gross pay for the four weeks to 4 October was <${M}>${pay ? PO.money(pay.gross) : '—'}</${M}>, about <${M}>${p.annualGross ? PO.money(p.annualGross) : '—'}</${M}> a year.</p>`,
      payrise: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>Your hourly rate rises to <${M}>${role.rate ? PO.money(role.rate + 0.4, { cents: true }) : rate}</${M}> from the pay period starting <${M}>5 October 2026</${M}>, keeping you above the National Living Wage.</p>`,
      p45: html`<p>Dear <${M}>${p.first}</${M}>,</p><p>Please find your P45 enclosed. Your leaving date is <${M}>${PO.date(last)}</${M}> and your final pay of <${M}>${extra.net != null ? PO.money(extra.net) : '—'}</${M}> is paid on the next payday. Give parts 2 and 3 to your new employer.</p>`,
    }[tpl] || html`<p>Letter body.</p>`;
    const plain = ['salary', 'address', 'experience', 'verification', 'pay', 'reference', 'earnings'].includes(tpl);
    return html`<div class="dk-paper">
      <div class="dk-lh"><span class="dk-logo">${C.short.split(/[\s&]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('')}</span><div class="grow"><b class="w-600 t-md">${C.name}</b><div class="faint t-xs">${C.employerLine || C.city + ', ' + C.country}</div></div><div style="text-align:right" class="t-xs faint">Ref ${refNo(P, tpl, p)}<br />${PO.date(TODAY)}</div></div>
      ${plain ? null : html`<p class="t-sm">${p.name}<br />${p.city || site.name}${p.id ? html`<br /><span class="faint">${p.id}</span>` : ''}</p>`}
      <h4>${title.toUpperCase()}</h4>
      ${body}
      <div class="dk-sig"><div><div class="dk-sign">${hr.name.split(' ')[0]} ${hr.name.split(' ')[1][0]}.</div><b class="w-600">${hr.name}</b><div class="faint t-xs">${hr.title}, ${C.name}</div></div><div class="faint t-xs" style="text-align:right">E-signed on ${PO.date(TODAY)}<br />Verify at ${P.vocab.domain}/verify</div></div>
    </div>`;
  }

  function LetterDrawer({ personId, tpl: tpl0, onClose }) {
    const P = PO.P();
    const p = P.byId[personId];
    const list = templates(P);
    const [tpl, setTpl] = useState(tpl0 || (P.id === 'in' ? 'salary' : P.id === 'us' ? 'verification' : 'reference'));
    const [issued, setIssued] = PO.useCoState('letters.issued', []);
    const issue = () => { setIssued([{ id: 'LTR-' + (5300 + issued.length), tpl, who: p.id, at: TODAY, by: P.byId[P.hrId].name, via: 'Employee portal' }, ...issued]); onClose(); PO.toast(`${list.find((t) => t[0] === tpl)[1]} issued to ${p.name} and shared to the employee portal`, { icon: 'FileCheck2' }); };
    return html`<${Drawer} open size="lg" title="Generate letter" sub=${`${p.name}, ${p.title}`} onClose=${onClose} footer=${html`<${Button} onClick=${() => PO.fakeDownload(`${list.find((t) => t[0] === tpl)[1]} – ${p.name}.pdf`)}>Download PDF</${Button}><span class="grow"></span><${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" onClick=${issue}>Issue & send</${Button}>`}>
      <div class="col gap-16">
        <${Field} label="Template"><${PO.Select} value=${tpl} onChange=${setTpl} options=${list.map((t) => [t[0], t[1]])} /></${Field}>
        <div style="background:var(--surface-3);padding:16px;border-radius:var(--r-lg)"><${LetterPreview} tpl=${tpl} p=${p} /></div>
      </div>
    </${Drawer}>`;
  }

  /* =====================================================================
     Documents page
     ===================================================================== */
  const SHORT = { 'Appointment letter': 'Appointment', 'Aadhaar card': 'Aadhaar', 'PAN card': 'PAN', 'Bank passbook / cancelled cheque': 'Bank', 'Police verification': 'Police', 'PF nomination (Form 2)': 'Form 2', 'ESI declaration': 'ESI', 'Leave policy acknowledgement': 'Leave ack', 'Offer letter': 'Offer', 'Form I-9': 'I-9', 'Form W-4': 'W-4', 'Direct deposit form': 'Deposit', 'Food handler card': 'Food card', 'Employee handbook acknowledgement': 'Handbook', 'Arbitration agreement': 'Arbitration', 'Contract of employment': 'Contract', 'Right to work check': 'RTW', 'P45 / starter checklist': 'P45', 'Bank details form': 'Bank', 'DBS certificate': 'DBS', 'COSHH training record': 'COSHH', 'Handbook acknowledgement': 'Handbook' };
  const dotCls = (s) => (s === 'Pending review' ? 'Pending' : s === 'Expiring soon' ? 'Expiring' : s === 'Not started' ? 'Not' : s);
  const dotIc = (s) => (s === 'Verified' ? 'Check' : s === 'Missing' ? 'X' : s === 'Expired' ? 'CalendarX' : s === 'Pending review' ? 'Eye' : s === 'Expiring soon' ? 'Clock' : s === 'Requested' ? 'Send' : 'Minus');
  const expiryOf = (P, p, d) => (d.status === 'Expiring soon' ? addDays(TODAY, PO.seeded('exp' + P.id + p.id + d.name).int(3, 29)) : d.status === 'Expired' ? addDays(TODAY, -PO.seeded('exp' + P.id + p.id + d.name).int(4, 90)) : null);

  function useScoped() {
    const P = PO.P();
    const { state } = PO.useStore();
    const v = PO.viewer();
    const [added] = PO.useCoState('people.added', []);
    return useMemo(() => { const all = PX().people(P, added); if (state.role !== 'manager') return all; const t = new Set(PX().teamIds(P, v.id)); return all.filter((p) => t.has(p.id)); }, [P.id, state.role, added]);
  }

  /* one chip per document kind, used in every list of documents */
  const docKind = (n) => /aadhaar|pan card|\bid\b|i-9|right to work|police|dbs|food handler|passport|licen/i.test(n) ? ['IdCard', 'teal']
    : /appointment|offer letter|contract|arbitration|agreement/i.test(n) ? ['FileSignature', 'violet']
    : /policy|handbook|acknowledg|conduct|sop|safety|posh|guide/i.test(n) ? ['BookOpen', 'blue']
    : /bank|cheque|deposit|w-4|p45|starter|pf |pf\b|esi|form|tax/i.test(n) ? ['Landmark', 'amber']
    : /training|coshh|certificate|record/i.test(n) ? ['GraduationCap', 'green']
    : ['FileText', 'green'];
  const DocChip = ({ n, folder }) => { const [ic, ac] = folder ? ({ Policies: ['BookOpen', 'blue'], Compliance: ['ShieldCheck', 'teal'], Templates: ['LayoutTemplate', 'violet'] }[folder] || docKind(n)) : docKind(n); return html`<${PO.Chip} icon=${ic} accent=${ac} size=${15} />`; };
  const assetKind = (n) => /uniform|apron|coat|tunic|polo|shoe/i.test(n) ? ['Shirt', 'teal'] : /id card|badge|pass|access card/i.test(n) ? ['IdCard', 'blue'] : /key|fob/i.test(n) ? ['KeyRound', 'amber'] : /phone|ipad|laptop|macbook|walkie|pos/i.test(n) ? ['Smartphone', 'violet'] : /fuel|card/i.test(n) ? ['CreditCard', 'rose'] : /torch|tool|harness|mount/i.test(n) ? ['Wrench', 'green'] : ['Package', 'green'];
  const AssetChip = ({ n }) => { const [ic, ac] = assetKind(n); return html`<${PO.Chip} icon=${ic} accent=${ac} size=${14} />`; };
  PO.DocKind = { docKind, assetKind };

  function Documents({ query }) {
    const P = PO.P();
    const people = useScoped();
    const [docSt, setDocSt] = PO.useCoState('docs.state', {});
    const [tab, setTab] = useState(query.tab || 'library');
    const rows = useMemo(() => people.flatMap((p) => PX().docsOf(p, docSt).map((d) => ({ ...d, p, key: p.id + '|' + d.name, expiry: expiryOf(P, p, d) }))), [people, docSt]);
    const total = rows.length;
    const verified = rows.filter((r) => r.status === 'Verified').length;
    const missing = rows.filter((r) => r.status === 'Missing' || r.status === 'Expired');
    const expiring = rows.filter((r) => r.status === 'Expiring soon');
    const pending = rows.filter((r) => r.status === 'Pending review');
    const queueN = rows.filter((r) => r.status !== 'Verified').length;
    return html`
      <${PageHeader} title="Documents" sub=${`Company policies and the files of ${PO.plural(people.length, 'person', 'people')}. ${PO.pct(verified / Math.max(1, total), 1)} of employee documents are verified.`} actions=${html`<${Button} onClick=${() => PO.toast('Drop files anywhere on this page. Names are matched to employees automatically.', { icon: 'Upload' })}>Upload</${Button}><${Button} kind="primary" onClick=${() => setTab('letters')}>Generate letter</${Button}>`} />
      <div style="margin-bottom:24px"><${PO.KpiStrip} items=${[
        { label: 'Files complete', icon: 'FileCheck2', accent: 'green', value: PO.pct(verified / Math.max(1, total), 1), sub: `${PO.num(verified)} of ${PO.num(total)} documents verified`, bar: [{ v: verified, k: 'ok', title: 'verified' }, { v: pending.length + expiring.length, k: 'warn', title: 'to verify or expiring' }, { v: missing.length, k: 'bad', title: 'missing or expired' }, { v: total - verified - pending.length - expiring.length - missing.length, k: 'mute', title: 'requested' }] },
        { label: 'Missing or expired', icon: 'FileWarning', accent: 'red', faces: [...new Set(missing.map((r) => r.p.id))].filter((id) => P.byId[id]), value: PO.num(missing.length), alert: missing.length > 0, sub: `Across ${PO.plural(new Set(missing.map((r) => r.p.id)).size, 'person', 'people')}`, onClick: () => setTab('queue') },
        { label: 'Expiring in 30 days', icon: 'CalendarClock', accent: 'amber', faces: [...new Set(expiring.map((r) => r.p.id))].filter((id) => P.byId[id]), value: PO.num(expiring.length), sub: P.id === 'in' ? 'Mostly police verification and IDs' : P.id === 'us' ? 'Mostly food handler cards' : 'Mostly DBS and right to work checks', onClick: () => setTab('queue') },
        { label: 'Waiting for you to verify', icon: 'ScanEye', accent: 'blue', faces: [...new Set(pending.map((r) => r.p.id))].filter((id) => P.byId[id]), value: PO.num(pending.length), sub: 'Uploaded by employees', onClick: () => setTab('queue') },
      ]} /></div>
      <${Tabs} tabs=${[['library', 'Company library', P.companyDocs.length], ['employees', 'Employee documents'], ['queue', 'Expiring & missing', queueN], ['letters', 'Letters']]} value=${tab} onChange=${setTab} />
      ${tab === 'library' ? html`<${Library} people=${people} />` : null}
      ${tab === 'employees' ? html`<${Matrix} people=${people} docSt=${docSt} setDocSt=${setDocSt} />` : null}
      ${tab === 'queue' ? html`<${Queue} rows=${rows.filter((r) => r.status !== 'Verified')} docSt=${docSt} setDocSt=${setDocSt} />` : null}
      ${tab === 'letters' ? html`<${Letters} who=${query.who} tpl0=${query.tpl} people=${people} />` : null}
    `;
  }

  function Library({ people }) {
    const P = PO.P();
    const [folder, setFolder] = useState('All');
    const [lib, setLib] = PO.useCoState('docs.library', {});
    const [send, setSend] = useState(null);
    const [prev, setPrev] = useState(null);
    const docs = P.companyDocs.map((d, i) => { const s = lib[d.name] || {}; const r = PO.seeded('lib' + P.id + d.name); return { ...d, version: s.version || `v${r.int(1, 4)}.${r.int(0, 9)}`, acks: s.acks != null ? s.acks : d.acks, sent: s.sent, owner: i < 5 ? P.byId[P.hrId].name : P.byId[P.topId].name, ownerP: i < 5 ? P.byId[P.hrId] : P.byId[P.topId], size: `${r.int(80, 2400)} KB`, pages: r.int(2, 34) }; });
    const folders = ['All', ...new Set(P.companyDocs.map((d) => d.folder))];
    const list = docs.filter((d) => folder === 'All' || d.folder === folder);
    const ic = { Policies: 'BookOpen', Compliance: 'ShieldCheck', Templates: 'LayoutTemplate', All: 'Folder' };
    return html`<div class="grid g-main-l">
      <div class="col gap-16">
        <${Card} icon="FolderOpen" accent="green" title="Folders"><div class="dk-folders">${folders.map((f) => html`<button class=${'dk-folder ' + (folder === f ? 'on' : '')} onClick=${() => setFolder(f)}><${PO.Chip} icon=${ic[f] || 'Folder'} accent=${{ Policies: 'blue', Compliance: 'teal', Templates: 'violet' }[f] || 'green'} size=${13} /><span class="grow">${f === 'All' ? 'All documents' : f}</span><span class="faint t-xs">${f === 'All' ? docs.length : docs.filter((d) => d.folder === f).length}</span></button>`)}<button class="dk-folder" onClick=${() => PO.toast('New folder created: Site SOPs')}><span class="chip-ic" style="background:none;border:1px dashed var(--border-strong);color:var(--text-3)"><${Icon} n="Plus" size=${13} /></span><span class="grow">New folder</span></button></div></${Card}>
      </div>
      <${DataTable} rows=${list} rowKey=${(d) => d.name} onRow=${(d) => setPrev(d)} search=${(d) => d.name} exportName="company-documents" columns=${[
        { key: 'name', label: 'Document', render: (d) => html`<span class="row" style="gap:12px"><${DocChip} n=${d.name} folder=${d.folder} /><span style="min-width:0"><b class="w-550 ellipsis" style="display:block;max-width:250px">${d.name}</b><small class="faint">${d.pages} pages, ${d.size}</small></span></span>`, csv: (d) => d.name },
        { key: 'owner', label: 'Owner', render: (d) => html`<span class="row" style="gap:6px;white-space:nowrap"><${Avatar} p=${d.ownerP} size="sm" /><span class="t-sm">${d.owner.split(' ')[0]}</span></span>`, sort: (d) => d.owner, csv: (d) => d.owner },
        { key: 'folder', label: 'Folder', render: (d) => html`<span class="muted">${d.folder}</span>` },
        { key: 'updated', label: 'Updated', render: (d) => html`<div style="white-space:nowrap">${PO.date(d.updated, { short: true })}</div><div class="faint t-xs tnum">${d.version}</div>`, sort: (d) => d.updated, csv: (d) => d.updated },
        { key: 'acks', label: 'Acknowledged', render: (d) => (d.acks == null ? html`<span class="faint t-sm">${d.folder === 'Templates' ? 'Template' : 'Reference only'}</span>` : html`<div style="width:118px"><${Progress} value=${d.acks * 100} tone=${d.acks < 0.9 ? 'amber' : ''} label=${`${Math.round(d.acks * people.length)}/${people.length}`} /></div>`), sort: (d) => d.acks ?? -1, csv: (d) => d.acks ?? '' },
        { key: 'act', label: '', sort: false, csv: false, render: (d) => html`<span class="row" style="gap:4px;justify-content:flex-end" onClick=${(e) => e.stopPropagation()}>${d.acks != null ? html`<${IconButton} size="sm" bordered icon=${d.sent ? 'BellRing' : 'Send'} title=${d.sent ? 'Send a reminder' : 'Send for acknowledgement'} onClick=${() => setSend(d)} />` : d.folder === 'Templates' ? html`<${IconButton} size="sm" bordered icon="FileSignature" title="Use template" onClick=${() => PO.go('documents?tab=letters')} />` : null}<${Menu} align="right" trigger=${html`<${IconButton} size="sm" icon="Ellipsis" title="More" />`} items=${[{ label: 'Preview', icon: 'Eye', onClick: () => setPrev(d) }, { label: 'Upload new version', icon: 'Upload', onClick: () => { const [maj, min] = d.version.slice(1).split('.').map(Number); setLib({ ...lib, [d.name]: { ...(lib[d.name] || {}), version: `v${maj}.${min + 1}`, acks: d.acks != null ? 0 : null } }); PO.toast(`${d.name} updated to v${maj}.${min + 1}. Acknowledgements reset.`); } }, { label: 'Download', icon: 'Download', onClick: () => PO.fakeDownload(d.name + '.pdf') }, '-', { label: 'Archive', icon: 'Archive', danger: true, onClick: () => PO.toast(`${d.name} archived`) }]} /></span>` },
      ]} />
      ${send ? html`<${SendAck} d=${send} people=${people} onClose=${() => setSend(null)} onSent=${(n) => { setLib({ ...lib, [send.name]: { ...(lib[send.name] || {}), sent: TODAY } }); setSend(null); PO.toast(`Sent to ${PO.plural(n, 'person', 'people')} by email and SMS. Reminders go out every 2 days.`, { icon: 'Send' }); }} />` : null}
      ${prev ? html`<${Modal} open size="lg" title=${prev.name} icon="FileText" onClose=${() => setPrev(null)} footer=${html`<span class="faint t-sm" style="margin-right:auto">${prev.version}, updated ${PO.date(prev.updated)}, ${prev.pages} pages</span><${Button} onClick=${() => PO.fakeDownload(prev.name + '.pdf')}>Download</${Button}>${prev.acks != null ? html`<${Button} kind="primary" onClick=${() => { setSend(prev); setPrev(null); }}>Send for acknowledgement</${Button}>` : null}`}>
        <div style="background:var(--surface-3);padding:18px;border-radius:var(--r-lg)"><div class="dk-paper"><div class="dk-lh"><span class="dk-logo">${P.company.short.slice(0, 2).toUpperCase()}</span><div class="grow"><b class="w-600 t-md">${prev.name}</b><div class="faint t-xs">${P.company.name}, ${prev.version}</div></div></div>
          ${['1. Purpose and scope', '2. Who this applies to', '3. ' + (/Leave/.test(prev.name) ? 'Types of leave and balances' : /Attendance/.test(prev.name) ? 'Clocking in, lateness and overtime' : /conduct/i.test(prev.name) ? 'Expected behaviour and how to raise a complaint' : /Uniform/.test(prev.name) ? 'Uniform issue, care and return' : 'Your rights and responsibilities'), '4. Contacts'].map((h, i) => html`<p class="w-600" style="margin-top:${i ? 12 : 0}px">${h}</p><div class="skel" style="height:9px;width:94%;margin-bottom:6px"></div><div class="skel" style="height:9px;width:${70 + i * 6}%"></div>`)}
        </div></div>
      </${Modal}>` : null}
    </div>`;
  }

  function SendAck({ d, people, onClose, onSent }) {
    const P = PO.P();
    const [aud, setAud] = useState('pending');
    const [site, setSite] = useState(P.sites[0].id);
    const [sign, setSign] = useState(/conduct|handbook/i.test(d.name));
    const [due, setDue] = useState(addDays(TODAY, 7));
    const pendingN = Math.round(people.length * (1 - (d.acks || 0)));
    const n = aud === 'all' ? people.length : aud === 'site' ? people.filter((p) => p.site === site).length : pendingN;
    return html`<${Drawer} open title=${sign ? 'Send for e-signature' : 'Send for acknowledgement'} sub=${d.name} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!n} onClick=${() => onSent(n)}>Send to ${PO.plural(n, 'person', 'people')}</${Button}>`}>
      <div class="col gap-16">
        <${Field} label="Who"><${Segmented} options=${[['pending', `Not yet acknowledged (${pendingN})`], ['all', 'Everyone'], ['site', P.id === 'us' ? 'One location' : 'One site']]} value=${aud} onChange=${setAud} /></${Field}>
        ${aud === 'site' ? html`<${Field} label=${P.id === 'us' ? 'Location' : 'Site'}><${PO.Select} value=${site} onChange=${setSite} options=${P.sites.map((s) => [s.id, s.name])} /></${Field}>` : null}
        <${Switch} on=${sign} onChange=${setSign} label=${`Require an e-signature (${P.id === 'in' ? 'Aadhaar OTP or drawn signature' : 'drawn signature with audit trail'})`} />
        <${Field} label="Due by"><input class="input" type="date" value=${due} onInput=${(e) => setDue(e.target.value)} /></${Field}>
        <${Card} title="Email preview"><div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;font-size:12.5px;line-height:1.55;background:var(--surface)"><div class="faint t-xs" style="padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid var(--border)">From <b class="w-500" style="color:var(--text)">${P.msg.name}</b>. Subject: <b class="w-600" style="color:var(--text)">Action needed: ${sign ? 'sign' : 'acknowledge'} ${d.name.replace(/ \(.*\)/, '')}</b></div>${P.id === 'in' ? 'Dear colleague' : 'Hi'},<br /><br />Please read “${d.name}” and ${sign ? 'sign it' : 'click “I have read this”'} in the employee portal by ${PO.date(due, { short: true })}.<br /><br /><span style="display:inline-block;padding:5px 12px;border-radius:6px;background:var(--brand);color:var(--ink-text);font-weight:600">Open in the employee portal</span></div><p class="faint t-sm mt-8">An SMS reminder with the same link goes to people who haven’t opened it after 2 days.</p></${Card}>
      </div>
    </${Drawer}>`;
  }

  function Matrix({ people, docSt, setDocSt }) {
    const P = PO.P();
    const types = P.vocab.docTypes;
    const [site, setSite] = useState('');
    const [q, setQ] = useState('');
    const [gaps, setGaps] = useState(false);
    const [page, setPage] = useState(0);
    const list = useMemo(() => people.filter((p) => (!site || p.site === site) && (!q || (p.name + p.id).toLowerCase().includes(q.toLowerCase()))).map((p) => ({ p, docs: PX().docsOf(p, docSt) })).filter((r) => !gaps || r.docs.some((d) => d.status !== 'Verified')), [people, site, q, gaps, docSt]);
    useEffect(() => setPage(0), [site, q, gaps]);
    const per = 20, pages = Math.max(1, Math.ceil(list.length / per));
    const view = list.slice(page * per, page * per + per);
    const missingCells = list.flatMap((r) => r.docs.filter((d) => PX().docGap(d) && d.status !== 'Requested').map((d) => r.p.id + '|' + d.name));
    const act = (p, d) => {
      const k = p.id + '|' + d.name; const before = docSt;
      if (d.status === 'Pending review') { setDocSt({ ...docSt, [k]: { status: 'Verified' } }); PO.toast(`${d.name} verified for ${p.name}`, { action: { label: 'Undo', run: () => setDocSt(before) } }); }
      else if (d.status !== 'Verified') { setDocSt({ ...docSt, [k]: { status: 'Requested' } }); PO.toast(`${d.name} requested from ${p.first} by email and SMS`, { icon: 'Send', action: { label: 'Undo', run: () => setDocSt(before) } }); }
      else PO.toast(`${d.name}: verified ${d.uploaded ? 'on ' + PO.date(d.uploaded, { short: true }) : ''}`, { icon: 'FileCheck2' });
    };
    const reqAll = () => { const before = docSt; const n = { ...docSt }; missingCells.forEach((k) => (n[k] = { status: 'Requested' })); setDocSt(n); PO.toast(`Requested ${PO.plural(missingCells.length, 'document')} from ${new Set(missingCells.map((k) => k.split('|')[0])).size} people by email and SMS`, { icon: 'Send', action: { label: 'Undo', run: () => setDocSt(before) } }); };
    return html`<div class="card" style="overflow:hidden">
      <div class="tbl-toolbar">
        <${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search people" width=${220} />
        <select class="select" style="width:auto;min-width:160px;height:30px" value=${site} onChange=${(e) => setSite(e.target.value)}><option value="">${P.id === 'us' ? 'All locations' : 'All sites'}</option>${P.sites.map((s) => html`<option value=${s.id}>${s.name}</option>`)}</select>
        <${Switch} on=${gaps} onChange=${setGaps} label="Only people with gaps" />
        <div class="right row"><span class="faint t-sm">${PO.plural(missingCells.length, 'gap')} to request</span><${Button} size="sm" disabled=${!missingCells.length} onClick=${reqAll}>Request missing</${Button}><${Button} size="sm" kind="ghost" onClick=${() => PO.exportCsv('document-matrix', [['ID', 'Name', ...types], ...list.map((r) => [r.p.id, r.p.name, ...r.docs.map((d) => d.status)])])}>Export</${Button}></div>
      </div>
      <div class="table-wrap"><table class="dk-mx"><thead><tr><th>Employee</th>${types.map((t) => html`<th title=${t}>${SHORT[t] || t}</th>`)}<th style="text-align:right;padding-right:14px">Complete</th></tr></thead>
        <tbody>${view.map(({ p, docs }) => { const v = docs.filter((d) => d.status === 'Verified').length; return html`<tr><td><${Who} p=${p} link=${!p.added} sub=${(PO.site(p.site) || {}).name} /></td>${docs.map((d) => html`<td><button class=${'dk-dot ' + dotCls(d.status)} title=${`${d.name}: ${d.status}${d.status === 'Verified' ? '' : d.status === 'Pending review' ? '. Click to verify.' : '. Click to request.'}`} onClick=${() => act(p, d)}></button></td>`)}<td style="text-align:right;padding-right:14px;width:120px"><${Progress} value=${(v / docs.length) * 100} tone=${v / docs.length < 0.6 ? 'amber' : ''} label=${`${v}/${docs.length}`} /></td></tr>`; })}</tbody></table></div>
      ${!list.length ? html`<${Empty} icon="FileCheck2" title="Every file is complete" text="No one here has a missing or unverified document." />` : null}
      <div class="tbl-foot"><span class="row" style="gap:12px">${[['Verified', 'Verified'], ['Pending review', 'To verify'], ['Requested', 'Requested'], ['Expiring soon', 'Expiring'], ['Missing', 'Missing / expired']].map(([s, l]) => html`<span class="row gap-4"><span class=${'dk-dot ' + dotCls(s)} style="width:14px;height:14px;cursor:default"></span>${l}</span>`)}</span><span class="right row">${PO.num(page * per + 1)}–${PO.num(Math.min(list.length, page * per + per))} of ${PO.num(list.length)}<${IconButton} icon="ChevronLeft" size="sm" title="Previous" onClick=${() => setPage(Math.max(0, page - 1))} /><${IconButton} icon="ChevronRight" size="sm" title="Next" onClick=${() => setPage(Math.min(pages - 1, page + 1))} /></span></div>
    </div>`;
  }

  function Queue({ rows, docSt, setDocSt }) {
    const P = PO.P();
    const [prev, setPrev] = useState(null);
    const upd = (keys, status, msg) => { const before = docSt; const n = { ...docSt }; keys.forEach((k) => (n[k] = { status })); setDocSt(n); PO.toast(msg, { icon: status === 'Requested' ? 'Send' : 'FileCheck2', action: { label: 'Undo', run: () => setDocSt(before) } }); };
    const order = { 'Pending review': 0, Expired: 1, Missing: 2, 'Expiring soon': 3, Requested: 4, 'Not started': 5 };
    return html`<div class="col gap-12">
      ${rows.some((r) => r.status === 'Expired' && /Police/.test(r.name)) ? html`<${Callout} tone="red" icon="ShieldAlert" title=${`${PO.plural(rows.filter((r) => r.status === 'Expired' && /Police/.test(r.name)).length, 'person', 'people')} on site with an expired police verification`}>PSARA requires a valid police verification for every guard on duty. Re-file on the Maharashtra Police portal before the client audit.</${Callout}>` : null}
      ${!rows.length ? html`<div class="card"><${Empty} icon="FileCheck2" title="Nothing waiting" text="Every document is verified and in date. New uploads from the employee portal land here for you to check." action=${html`<${Button} size="sm" onClick=${() => PO.go('documents?tab=employees')}>Open employee files</${Button}>`} /></div>` : null}
      ${rows.length ? html`<${DataTable} rows=${rows} rowKey=${(r) => r.key} selectable search=${(r) => r.p.name + ' ' + r.name} exportName="documents-queue" initialSort=${{ key: 'status', dir: 'asc' }}
        bulk=${(ids, clear) => html`<${Button} size="sm" onClick=${() => { upd(ids, 'Requested', `Requested ${PO.plural(ids.length, 'document')} by email and SMS`); clear(); }}>Request by email</${Button}><${Button} size="sm" onClick=${() => { const ok = ids.filter((k) => (rows.find((r) => r.key === k) || {}).status === 'Pending review'); upd(ok, 'Verified', `${PO.plural(ok.length, 'document')} verified`); clear(); }}>Verify uploaded</${Button}>`}
        filters=${[
          { key: 'status', label: 'Status', options: Object.keys(order).filter((s) => rows.some((r) => r.status === s)), test: (r, v) => r.status === v },
          { key: 'doc', label: 'Document', options: P.vocab.docTypes, test: (r, v) => r.name === v },
          { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (r, v) => r.p.site === v },
        ]}
        columns=${[
          { key: 'who', label: 'Employee', render: (r) => html`<${Who} p=${r.p} link=${!r.p.added} sub=${(PO.site(r.p.site) || {}).name} />`, sort: (r) => r.p.name, csv: (r) => r.p.name },
          { key: 'name', label: 'Document', render: (r) => html`<span class="row" style="gap:10px"><${DocChip} n=${r.name} /><span>${r.name}</span></span>`, sort: (r) => r.name, csv: (r) => r.name },
          { key: 'status', label: 'Status', render: (r) => html`<${Status} s=${r.status} />`, sort: (r) => order[r.status] ?? 9 },
          { key: 'date', label: 'Date', render: (r) => html`<span class="t-sm">${r.expiry ? html`${r.status === 'Expired' ? 'Expired' : 'Expires'} ${PO.date(r.expiry, { short: true })}${PO.rel(r.expiry) !== PO.date(r.expiry, { short: true }) ? html`<div class="faint t-xs">${PO.rel(r.expiry)}</div>` : html`<div class="faint t-xs">${Math.abs(PX().daysBetween(TODAY, r.expiry))} days ${r.expiry < TODAY ? 'ago' : 'left'}</div>`}` : r.uploaded ? `Uploaded ${PO.date(r.uploaded, { short: true })}` : html`<span class="faint">Never uploaded</span>`}</span>`, sort: (r) => r.expiry || r.uploaded || '', csv: (r) => r.expiry || r.uploaded || '' },
          { key: 'act', label: '', sort: false, csv: false, render: (r) => html`<span class="row" style="gap:4px;justify-content:flex-end" onClick=${(e) => e.stopPropagation()}>${r.status === 'Pending review' ? html`<${IconButton} size="sm" icon="Eye" title="Preview" onClick=${() => setPrev(r)} /><${Button} size="sm" onClick=${() => upd([r.key], 'Verified', `${r.name} verified for ${r.p.name}`)}>Verify</${Button}><${Button} size="sm" kind="ghost" onClick=${() => upd([r.key], 'Requested', `${r.name} rejected. ${r.p.first} was asked for a clearer photo.`)}>Reject</${Button}>` : html`<${Button} size="sm" onClick=${() => upd([r.key], 'Requested', `${r.status === 'Requested' ? 'Reminder sent' : 'Requested'}: ${r.name} from ${r.p.first}`)}>${r.status === 'Requested' ? 'Remind' : r.status === 'Expiring soon' || r.status === 'Expired' ? 'Request renewal' : 'Request'}</${Button}>`}</span>` },
        ]} empty=${{ title: 'Nothing waiting', text: 'Every document is verified and in date.' }} />` : null}
      ${prev && PX().DocPreviewModal ? html`<${PX().DocPreviewModal} p=${prev.p} d=${prev} onClose=${() => setPrev(null)} />` : null}
    </div>`;
  }

  function Letters({ who, tpl0, people }) {
    const P = PO.P();
    const list = templates(P);
    const [tpl, setTpl] = useState(tpl0 || list[0][0]);
    const [pid, setPid] = useState(who || P.hero.id);
    const [issued, setIssued] = PO.useCoState('letters.issued', []);
    const p = people.find((x) => x.id === pid) || P.hero;
    const seededLog = useMemo(() => { const r = PO.seeded('letters' + P.id); return Array.from({ length: 7 }, (_, i) => { const t = r.pick(list); const q = r.pick(P.people); return { id: 'LTR-' + (5290 - i), tpl: t[0], who: q.id, at: addDays(TODAY, -r.int(1, 40)), by: P.byId[P.hrId].name, via: r.pick(['Employee portal', 'Email', 'Employee portal']) }; }).sort((a, b) => b.at.localeCompare(a.at)); }, [P.id]);
    const log = [...issued, ...seededLog];
    const name = (k) => (list.find((t) => t[0] === k) || [k, k])[1];
    const issue = () => { setIssued([{ id: 'LTR-' + (5300 + issued.length), tpl, who: p.id, at: TODAY, by: P.byId[P.hrId].name, via: 'Employee portal' }, ...issued]); PO.toast(`${name(tpl)} issued to ${p.name} and shared to the employee portal`, { icon: 'FileCheck2' }); };
    return html`<div class="col gap-16">
      <div class="grid" style="grid-template-columns:340px minmax(0,1fr);align-items:start">
        <div class="col gap-12">
          <${Card} icon="LayoutTemplate" accent="violet" title="Choose a template" flush><div class="col" style="gap:0">${list.map(([k, label, ic, sub]) => html`<button class=${'dk-tpl ' + (tpl === k ? 'on' : '')} onClick=${() => setTpl(k)}><${PO.Chip} icon=${ic} accent=${/DoorOpen|TriangleAlert/.test(ic) ? 'amber' : /TrendingUp|Award/.test(ic) ? 'green' : /BadgeCheck|ScrollText/.test(ic) ? 'teal' : /FileSignature/.test(ic) ? 'violet' : 'blue'} size=${15} /><span class="grow" style="min-width:0"><b class="w-550" style="display:block">${label}</b><small class="faint">${sub}</small></span><span class="faint t-xs tnum">${PO.seeded('u' + P.id + k).int(3, 60)} issued</span></button>`)}</div></${Card}>
        </div>
        <div class="col gap-12">
          <div class="card" style="padding:12px 14px"><div class="row wrap" style="gap:10px"><b class="w-600 t-sm">Employee</b><select class="select" style="width:300px" value=${p.id} onChange=${(e) => setPid(e.target.value)}>${people.filter((x) => !x.added).map((x) => html`<option value=${x.id}>${x.name} (${x.id})</option>`)}</select><span class="faint t-sm"><span class="dk-mf">Highlighted</span> fields come from ${p.first}'s record</span>
            <span class="right row"><${Button} onClick=${() => PO.fakeDownload(`${name(tpl)} – ${p.name}.pdf`)}>Download PDF</${Button}><${Button} kind="primary" onClick=${issue}>Issue & send</${Button}></span></div></div>
          <div style="background:var(--surface-3);padding:22px;border-radius:var(--r-lg);border:1px solid var(--border)"><${LetterPreview} tpl=${tpl} p=${p} /></div>
        </div>
      </div>
      <${Card} icon="Send" accent="blue" title="Issued letters" sub=${PO.plural(log.length, 'letter')} flush>
        <div class="list">${log.slice(0, 10).map((l) => { const q = people.find((x) => x.id === l.who) || P.byId[l.who]; return q ? html`<div class="list-item"><${Avatar} p=${q} /><span class="grow" style="min-width:0"><b class="w-550">${name(l.tpl)}</b> <span class="muted">for ${q.name}</span><small class="faint" style="display:block">${l.id}, issued by ${l.by}</small></span><span class="faint t-sm">${l.via}</span><span class="faint t-sm" style="width:90px;text-align:right">${PO.rel(l.at)}</span><${IconButton} icon="Download" size="sm" title="Download" onClick=${() => PO.fakeDownload(`${name(l.tpl)} – ${q.name}.pdf`)} /></div>` : null; })}</div>
      </${Card}>
    </div>`;
  }

  /* =====================================================================
     Assets
     ===================================================================== */
  function AssignAssetDrawer({ personId, tag, onClose }) {
    const P = PO.P();
    const [st, setSt] = PO.useCoState('assets.state', {});
    const [added, setAdded] = PO.useCoState('assets.added', []);
    const all = PX().assets(P, st, added);
    const store = all.filter((a) => !a.who && a.cond !== 'Lost' && a.cond !== 'Retired');
    const [who, setWho] = useState(personId || '');
    const p = who ? P.byId[who] : null;
    const [pick, setPick] = useState(tag || (store[0] && store[0].tag) || 'new');
    const kit = p ? P.vocab.assetTypes[p.role] || [] : [];
    const [newName, setNewName] = useState(kit[0] || Object.values(P.vocab.assetTypes).flat()[0]);
    const [ack, setAck] = useState(true);
    const held = p ? all.filter((a) => a.who === p.id) : [];
    const missingKit = kit.filter((k) => !held.some((a) => a.name === k));
    const save = () => {
      let t = pick;
      if (pick === 'new') { const n = Math.max(...all.map((a) => +a.tag.slice(4))) + 1; t = 'AST-' + n; setAdded([...added, { tag: t, name: newName, who: null, issued: null, cond: 'New', value: /Laptop|MacBook|iPad|phone|Walkie/i.test(newName) ? (P.id === 'in' ? 18000 : 450) : P.id === 'in' ? 900 : 35, returnDue: null }]); }
      setSt({ ...st, [t]: { ...(st[t] || {}), who: p.id, issued: TODAY } });
      onClose();
      PO.toast(`${pick === 'new' ? newName : (all.find((a) => a.tag === t) || {}).name} (${t}) issued to ${p.name}${ack ? `. Handover receipt shared to the employee portal for sign-off.` : ''}`, { icon: 'Package' });
    };
    return html`<${Drawer} open title="Assign asset" sub=${p ? `${p.name}, ${p.title}` : 'Issue an item from the store'} onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" disabled=${!p} onClick=${save}>Assign</${Button}>`}>
      <div class="col gap-16">
        ${personId ? null : html`<${Field} label="Employee"><select class="select" value=${who} onChange=${(e) => setWho(e.target.value)}><option value="">Choose a person</option>${P.people.map((x) => html`<option value=${x.id}>${x.name}, ${x.title}</option>`)}</select></${Field}>`}
        ${p ? (missingKit.length ? html`<${Callout} tone="amber" icon="Package" title=${`Standard kit still to issue: ${missingKit.join(', ')}`}>${PO.plural(held.length, 'item')} held now${held.length ? ': ' + held.map((a) => a.name).join(', ') : ''}.</${Callout}>` : html`<p class="faint t-sm">Standard kit complete. ${PO.plural(held.length, 'item')} held now.</p>`) : null}
        <${Field} label=${`From the store (${store.length} available)`}>
          <div class="col" style="gap:0;max-height:280px;overflow:auto;border:1px solid var(--border);border-radius:var(--r)">${store.map((a) => html`<button class=${'dk-tpl ' + (pick === a.tag ? 'on' : '')} style="align-items:center" onClick=${() => setPick(a.tag)}><span class="grow" style="min-width:0"><b class="w-550">${a.name}</b><small class="faint" style="display:block">${a.tag}, ${a.cond.toLowerCase()}</small></span><span class="tnum t-sm">${PO.money(a.value)}</span></button>`)}
            <button class=${'dk-tpl ' + (pick === 'new' ? 'on' : '')} style="align-items:center" onClick=${() => setPick('new')}><span class="grow"><b class="w-550">Issue new stock</b><small class="faint" style="display:block">Creates a new tag in the register</small></span></button></div>
        </${Field}>
        ${pick === 'new' ? html`<${Field} label="Item"><${PO.Select} value=${newName} onChange=${setNewName} options=${[...new Set(Object.values(P.vocab.assetTypes).flat())]} /></${Field}>` : null}
        <${Switch} on=${ack} onChange=${setAck} label=${`Ask ${p ? p.first : 'them'} to confirm receipt in the employee portal`} />
      </div>
    </${Drawer}>`;
  }

  function AssetDrawer({ a, onClose, onAssign, upd }) {
    const P = PO.P();
    const p = a.who ? P.byId[a.who] : null;
    const r = PO.seeded('ah' + P.id + a.tag);
    const bought = addDays(a.issued || TODAY, -r.int(5, 60));
    const hist = [
      { icon: 'ShoppingCart', tone: '', title: 'Purchased', sub: `${PO.money(a.value)} from ${P.id === 'in' ? r.pick(['Uniform Mart, Pune', 'Motorola dealer, Shivajinagar', 'Croma Business']) : P.id === 'us' ? r.pick(['Cintas', 'Amazon Business', 'Apple Business']) : r.pick(['Alsco', 'Cromwell', 'Currys Business'])}`, right: PO.date(bought, { short: true }) },
      a.issued ? { icon: 'PackageCheck', tone: 'brand', title: `Issued to ${a.whoName || (p ? p.name : 'employee')}`, sub: 'Receipt confirmed in the employee portal', right: PO.date(a.issued, { short: true }) } : null,
      a.issued && PX().daysBetween(a.issued, TODAY) > 45 ? { icon: 'ClipboardCheck', tone: a.cond === 'Needs repair' ? 'amber' : 'green', title: 'Condition check', sub: `${a.cond}, quarterly site audit`, right: PO.date(addDays(TODAY, -r.int(5, 40)), { short: true }) } : null,
      a.returnedOn ? { icon: 'Undo2', tone: 'green', title: 'Returned to store', sub: 'Checked in by HR', right: PO.date(a.returnedOn, { short: true }) } : null,
    ].filter(Boolean);
    return html`<${Drawer} open title=${a.name} sub=${`${a.tag}, ${PO.money(a.value)}`} onClose=${onClose} footer=${html`<${Button} kind="ghost" onClick=${() => PO.fakeDownload(`Asset label ${a.tag}`)}>Print label</${Button}><span class="grow"></span>${a.who ? html`<${Button} onClick=${() => { upd(a, { who: null, returnedOn: TODAY }, `${a.name} returned to store`); onClose(); }}>Return to store</${Button}>` : html`<${Button} kind="primary" onClick=${() => onAssign(a.tag)}>Assign</${Button}>`}`}>
      <div class="col gap-16">
        <div class="row"><${Status} s=${a.cond} /><span class="faint t-sm">${a.who ? 'Assigned' : 'In store'}</span></div>
        <${KV} items=${[['Tag', html`<span class="tnum">${a.tag}</span>`], ['Assigned to', p ? html`<${Who} p=${p} size="sm" />` : a.whoName || 'In store'], [P.id === 'us' ? 'Location' : 'Site', p ? (PO.site(p.site) || {}).name : 'Store, ' + (P.id === 'in' ? 'Head office' : P.id === 'us' ? 'Central kitchen' : 'Trafford depot')], ['Issued', a.issued ? PO.date(a.issued) : '—'], ['Value', PO.money(a.value)], ['Depreciation', /Laptop|MacBook|iPad|phone|Walkie/i.test(a.name) ? '3 years, straight line' : 'Expensed']]} />
        <div class="row" style="gap:6px">${['Good', 'Fair', 'Needs repair'].map((c) => html`<${Button} size="sm" kind=${a.cond === c ? 'primary' : ''} onClick=${() => upd(a, { cond: c }, `${a.tag} marked ${c.toLowerCase()}`)}>${c}</${Button}>`)}</div>
        <${Card} icon="History" accent="blue" title="History"><${Timeline} items=${hist} /></${Card}>
      </div>
    </${Drawer}>`;
  }

  function Assets({ query }) {
    const P = PO.P();
    const [st, setSt] = PO.useCoState('assets.state', {});
    const [added] = PO.useCoState('assets.added', []);
    const [off, setOff] = PO.useCoState('offboarding.state', {});
    const [tab, setTab] = useState(query.tab || 'register');
    const [assign, setAssign] = useState(null);
    const [sel, setSel] = useState(null);
    const all = useMemo(() => PX().assets(P, st, added), [P.id, st, added]);
    const assigned = all.filter((a) => a.who);
    const store = all.filter((a) => !a.who);
    const repair = all.filter((a) => a.cond === 'Needs repair');
    const value = all.reduce((t, a) => t + a.value, 0);
    const upd = (a, patch, msg) => { const before = st; setSt({ ...st, [a.tag]: { ...(st[a.tag] || {}), ...patch } }); PO.toast(msg, { action: { label: 'Undo', run: () => setSt(before) } }); };
    // overdue returns from exits
    const exitsAdded = PO.coGet(PO.useStore().state, 'offboarding.added', []);
    const overdue = useMemo(() => [...P.exits, ...exitsAdded].flatMap((e) => { const items = PX().exitAssets(P, e); const s = off[e.id] || {}; return items.map((a, i) => { const def = e.lastDay < TODAY ? !(i === items.length - 1 && items.length > 2) : false; const ret = s.assets && s.assets[a.tag] != null ? s.assets[a.tag] : def; return { ...a, e, returned: ret, p: PX().exitPerson(P, e) }; }); }).filter((x) => !x.returned), [P.id, off, exitsAdded]);
    const markReturned = (x) => { const s = off[x.e.id] || {}; setOff({ ...off, [x.e.id]: { ...s, assets: { ...(s.assets || {}), [x.tag]: true } } }); PO.toast(`${x.name} returned by ${x.p.name}. Settlement updated.`); };
    const byType = useMemo(() => { const m = {}; all.forEach((a) => { m[a.name] = m[a.name] || { n: 0, v: 0, out: 0 }; m[a.name].n++; m[a.name].v += a.value; if (a.who) m[a.name].out++; }); return Object.entries(m).sort((a, b) => b[1].n - a[1].n); }, [all]);
    const siteOf = (a) => (a.who && P.byId[a.who] ? P.byId[a.who].site : null);
    return html`
      <${PageHeader} title="Assets" sub=${`Uniforms, devices and keys issued to ${P.company.short} staff. ${PO.compactMoney(value)} of kit in the register.`} actions=${html`<${Button} onClick=${() => PO.toast('Scan a tag with a USB or webcam barcode scanner to check an item in or out', { icon: 'ScanBarcode' })}>Scan tag</${Button}><${Button} kind="primary" onClick=${() => setAssign({})}>Assign asset</${Button}>`} />
      <div style="margin-bottom:24px"><${PO.KpiStrip} items=${[
        { label: 'Items', icon: 'Package', accent: 'green', value: PO.num(all.length), sub: `${PO.num(assigned.length)} with staff, ${PO.num(store.length)} in store`, bar: [{ v: assigned.length - repair.filter((a) => a.who).length, k: 'ok', title: 'with staff' }, { v: repair.length, k: 'warn', title: 'needs repair' }, { v: store.length - repair.filter((a) => !a.who).length, k: 'mute', title: 'in store' }] },
        { label: 'Needs repair', icon: 'Wrench', accent: 'amber', value: PO.num(repair.length), alert: repair.length > 0, sub: `${PO.compactMoney(repair.reduce((t, a) => t + a.value, 0))} of kit` },
        { label: 'Overdue from exits', icon: 'PackageX', accent: 'red', value: PO.num(overdue.filter((x) => x.e.lastDay < TODAY).length), alert: overdue.some((x) => x.e.lastDay < TODAY), sub: 'Deducted in the final settlement', onClick: () => setTab('overdue') },
        { label: 'Value with staff', icon: 'Wallet', accent: 'teal', faces: [...new Set(assigned.map((a) => a.who))].filter((id) => P.byId[id]).slice(0, 8), value: PO.compactMoney(assigned.reduce((t, a) => t + a.value, 0)), sub: `Of ${PO.compactMoney(value)} in the register` },
      ]} /></div>
      <${Tabs} tabs=${[['register', 'Register', all.length], ['overdue', 'Returns from exits', overdue.length || null], ['types', 'By type']]} value=${tab} onChange=${setTab} />
      ${tab === 'register' ? html`<${DataTable} rows=${all} rowKey=${(a) => a.tag} selectable onRow=${(a) => setSel(a.tag)} exportName="asset-register" search=${(a) => `${a.tag} ${a.name} ${a.who && P.byId[a.who] ? P.byId[a.who].name : ''}`} searchPlaceholder="Search tag, item or person"
        filters=${[
          { key: 'type', label: 'Type', options: byType.map(([n]) => n), test: (a, v) => a.name === v },
          { key: 'cond', label: 'Condition', options: [...new Set(all.map((a) => a.cond))], test: (a, v) => a.cond === v },
          { key: 'asg', label: 'Assignment', options: [['yes', 'Assigned'], ['no', 'In store']], test: (a, v) => (v === 'yes' ? !!a.who : !a.who) },
          { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (a, v) => siteOf(a) === v },
        ]}
        bulk=${(ids, clear) => html`<${Button} size="sm" onClick=${() => { const before = st; const n = { ...st }; ids.forEach((t) => (n[t] = { ...(n[t] || {}), who: null, returnedOn: TODAY })); setSt(n); clear(); PO.toast(`${PO.plural(ids.length, 'item')} returned to store`, { action: { label: 'Undo', run: () => setSt(before) } }); }}>Return to store</${Button}><${Button} size="sm" onClick=${() => { const before = st; const n = { ...st }; ids.forEach((t) => (n[t] = { ...(n[t] || {}), cond: 'Needs repair' })); setSt(n); clear(); PO.toast(`${PO.plural(ids.length, 'item')} sent for repair`, { action: { label: 'Undo', run: () => setSt(before) } }); }}>Send for repair</${Button}>`}
        columns=${[
          { key: 'tag', label: 'Tag', render: (a) => html`<span class="tnum faint">${a.tag}</span>` },
          { key: 'name', label: 'Item', render: (a) => html`<span class="row" style="gap:10px"><${AssetChip} n=${a.name} /><b class="w-550">${a.name}</b></span>`, sort: (a) => a.name, csv: (a) => a.name },
          { key: 'who', label: 'Assigned to', render: (a) => (a.who && P.byId[a.who] ? html`<${Who} p=${P.byId[a.who]} sub=${P.byId[a.who].id} />` : html`<span class="faint">In store</span>`), sort: (a) => (a.who && P.byId[a.who] ? P.byId[a.who].name : 'zzz'), csv: (a) => (a.who && P.byId[a.who] ? P.byId[a.who].name : 'In store') },
          { key: 'site', label: P.id === 'us' ? 'Location' : 'Site', render: (a) => (siteOf(a) ? PO.site(siteOf(a)).name : html`<span class="faint">Store</span>`), sort: (a) => siteOf(a) || '', csv: (a) => (siteOf(a) ? PO.site(siteOf(a)).name : 'Store') },
          { key: 'issued', label: 'Issued', render: (a) => (a.issued ? PO.date(a.issued, { short: true }) : '—'), sort: (a) => a.issued || '' },
          { key: 'cond', label: 'Condition', render: (a) => html`<${Status} s=${a.cond} />` },
          { key: 'value', label: 'Value', align: 'r', render: (a) => html`<span class="tnum">${PO.money(a.value)}</span>` },
        ]} />` : null}
      ${tab === 'overdue' ? html`<div class="col gap-12">
        <p class="muted">${PO.plural(overdue.filter((x) => x.e.lastDay < TODAY).length, 'item')} overdue from people who have left. Unreturned items are deducted in the final settlement; mark them returned here or in the exit case.</p>
        ${!overdue.length ? html`<div class="card"><${Empty} icon="PackageCheck" title="Everything is back" text="No assets are outstanding from exits. Items from new exits show up here on their last day." action=${html`<${Button} size="sm" onClick=${() => PO.go('offboarding')}>Open exits</${Button}>`} /></div>` : html`<${DataTable} rows=${overdue} rowKey=${(x) => x.tag} exportName="overdue-returns" columns=${[
          { key: 'p', label: 'Employee', render: (x) => html`<${Who} p=${x.p} link=${!x.p.former} sub=${`${x.e.reason}, ${x.e.id}`} />`, sort: (x) => x.p.name, csv: (x) => x.p.name },
          { key: 'name', label: 'Item', render: (x) => html`<span class="row" style="gap:10px"><${AssetChip} n=${x.name} /><span><b class="w-550">${x.name}</b><small class="faint tnum" style="display:block">${x.tag}</small></span></span>`, sort: (x) => x.name, csv: (x) => x.name },
          { key: 'due', label: 'Due', render: (x) => PO.date(x.e.lastDay, { short: true }), sort: (x) => x.e.lastDay, csv: (x) => x.e.lastDay },
          { key: 'od', label: 'Status', render: (x) => (x.e.lastDay < TODAY ? html`<span style="color:var(--red)">Overdue ${PO.plural(PX().daysBetween(x.e.lastDay, TODAY), 'day')}</span>` : html`<span class="muted">Due ${PO.rel(x.e.lastDay).toLowerCase()}</span>`), sort: (x) => x.e.lastDay },
          { key: 'value', label: 'Value', align: 'r', render: (x) => html`<span class="tnum">${PO.money(x.value)}</span>` },
          { key: 'act', label: '', sort: false, csv: false, render: (x) => html`<span class="row" style="gap:4px;justify-content:flex-end"><${Button} size="sm" onClick=${() => markReturned(x)}>Mark returned</${Button}><${Button} size="sm" kind="ghost" onClick=${() => PO.go('offboarding?case=' + x.e.id)}>Exit case</${Button}></span>` },
        ]} empty=${{ title: 'Everything is back', text: 'No assets are outstanding from exits.' }} />`}
      </div>` : null}
      ${tab === 'types' ? html`<div class="grid g-main">
        <${Card} icon="Boxes" accent="green" title="Items by type" sub=${`${PO.num(all.length)} in the register`}><${PO.Charts.HBars} data=${byType.slice(0, 10).map(([n, x]) => ({ label: n, value: x.n, sub: `${x.out} out, ${x.n - x.out} in store` }))} /></${Card}>
        <div class="col gap-16">
          <${Card} icon="Gauge" accent="amber" title="Condition"><${PO.Charts.HBars} data=${['New', 'Good', 'Fair', 'Needs repair'].map((c) => ({ label: c, value: all.filter((a) => a.cond === c).length })).filter((d) => d.value)} /></${Card}>
          <${Card} icon="Wallet" accent="teal" title="Value by type" flush><div class="list">${byType.slice().sort((a, b) => b[1].v - a[1].v).slice(0, 6).map(([n, x]) => html`<div class="list-item"><span class="grow ellipsis">${n}</span><span class="faint t-sm">${x.n}</span><b class="tnum w-600" style="width:90px;text-align:right">${PO.compactMoney(x.v)}</b></div>`)}</div></${Card}>
        </div>
      </div>` : null}
      ${assign ? html`<${AssignAssetDrawer} tag=${assign.tag} onClose=${() => setAssign(null)} />` : null}
      ${sel ? html`<${AssetDrawer} a=${all.find((a) => a.tag === sel)} upd=${upd} onClose=${() => setSel(null)} onAssign=${(t) => { setSel(null); setAssign({ tag: t }); }} />` : null}
    `;
  }

  PO.DocKit = { LetterPreview, LetterDrawer, AssignAssetDrawer, templates };
  PO.route('documents', Documents, { title: 'Documents' });
  PO.route('assets', Assets, { title: 'Assets' });
})();
