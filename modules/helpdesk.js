/* People OS: HR helpdesk (route `helpdesk`).
   Admin: ticket queue with SLA, AI-drafted replies a human reviews, internal notes, linked records,
   and a knowledge base with usage stats. Employee: "Ask HR" with KB search, their tickets and a request form. */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .hd-msg { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 12px; margin-bottom: 16px; }
  .hd-msg > .av { width: 36px; height: 36px; }
  .hd-msg.hr .hd-bubble { border-color: color-mix(in srgb, var(--brand) 18%, var(--border)); background: color-mix(in srgb, var(--brand-soft) 45%, var(--surface)); }
  .hd-bubble { border: 1px solid var(--border); border-radius: var(--r-lg); padding: 10px 12px; background: var(--surface); line-height: 1.55; }
  .hd-msg.note .hd-bubble { background: var(--surface-2); border-left: 3px solid var(--amber-solid); }
  .hd-meta { display: flex; gap: 6px; align-items: center; font-size: 12px; color: var(--text-3); margin-bottom: 4px; }
  .hd-meta b { color: var(--text); font-weight: 600; }
  .hd-draft { border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; background: var(--surface); }
  .hd-draft:focus-within { border-color: var(--border-strong); }
  .hd-draft-h { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 12px; color: var(--text-3); border-bottom: 1px solid var(--border); background: var(--surface-2); }
  .hd-draft textarea { border: none; border-radius: 0; box-shadow: none; min-height: 130px; }
  .hd-draft textarea:focus { box-shadow: none; }
  .hd-draft-f { display: flex; gap: 6px; align-items: center; padding: 8px 10px; border-top: 1px solid var(--border); }
  .hd-side { border-left: 1px solid var(--border); padding-left: 16px; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
  .hd-side h4 { font-size: 12px; font-weight: 600; color: var(--text-2); margin-bottom: 8px; }
  .hd-link { display: flex; gap: 8px; align-items: center; padding: 6px 0; cursor: pointer; color: var(--text); border-bottom: 1px solid var(--border); }
  .hd-link:last-child { border-bottom: none; }
  .hd-link:hover span.grow { color: var(--brand-text); }
  .hd-link svg { color: var(--text-3); flex: none; }
  .hd-art { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border); cursor: pointer; }
  .hd-art:hover { background: var(--hover); }
  .hd-art:last-child { border-bottom: none; }
  .hd-topics { display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 12px; }
  .hd-topics a { color: var(--text-2); cursor: pointer; } .hd-topics a:hover, .hd-topics a.on { color: var(--text); text-decoration: underline; }
  </style>`);

  const CHANS = ['Portal', 'Email', 'HR desk'];
  const replyVia = (c) => (c === 'Email' ? 'email' : 'the employee portal');
  const CH_ICON = { Portal: 'Globe', Email: 'Mail', 'HR desk': 'Building2' };

  function catOf(s) {
    if (/PF|UAN|ESI|pension|401/i.test(s)) return 'Benefits & PF';
    if (/Form 1[36]|W-2|P60|P45|tax/i.test(s)) return 'Tax & forms';
    if (/certificate|verification|letter|reference/i.test(s)) return 'Letters';
    if (/bank|deposit|address/i.test(s)) return 'Profile & bank';
    if (/PTO|holiday|leave/i.test(s)) return 'Leave';
    if (/uniform/i.test(s)) return 'Uniform & assets';
    return 'Pay';
  }
  const catName = (P, c) => (c === 'Benefits & PF' && P.id !== 'in' ? 'Benefits & pension' : c);
  const CAT_ACCENT = { Pay: 'green', 'Benefits & PF': 'violet', 'Benefits & pension': 'violet', 'Tax & forms': 'amber', Letters: 'blue', 'Profile & bank': 'teal', Leave: 'teal', 'Uniform & assets': 'rose' };
  const CatChip = ({ c, size = 14 }) => html`<${PO.Chip} icon=${CAT_ICON[c] || 'LifeBuoy'} accent=${CAT_ACCENT[c] || 'green'} size=${size} />`;
  const personByName = (P, n) => P.people.find((x) => x.name === n) || null;
  const CAT_ICON = { Pay: 'Banknote', 'Benefits & PF': 'PiggyBank', 'Benefits & pension': 'PiggyBank', 'Tax & forms': 'Landmark', Letters: 'FileText', 'Profile & bank': 'UserCog', Leave: 'Palmtree', 'Uniform & assets': 'Shirt' };

  /** Employee's opening message and People OS's draft reply, built from the person's real records. */
  function script(P, t, p) {
    const m = (v) => PO.money(v);
    const lt = P.leaveTypes[0];
    const s = t.subject;
    const f = p.first;
    const hr = PO.person(P.hrId);
    let ask, draft;
    if (/short|missing tips|night|premium|allowance/i.test(s)) {
      ask = P.id === 'in' ? `Sir/madam, ${s.toLowerCase()}. Please check.` : `Hi, ${s.toLowerCase()} on my last check. Can someone look?`;
      draft = `Hi ${f}, thanks for flagging this. I checked your ${P.company.period} payslip: net pay was ${m(p.pay.net)}${p.pay.otHours ? ` including ${p.pay.otHours} h overtime (${m(p.pay.otPay)})` : ''}. ${p.pay.extra ? `${P.unitWords.extra}: ${m(p.pay.extra)} is on the slip.` : `${P.unitWords.extra} was not on this slip because the shifts were logged after the cut-off.`} If anything is still missing, it will be paid as arrears in the next run. ${hr.first}, HR`;
    } else if (/PF|UAN|ESI/i.test(s)) {
      ask = `${s}. My UAN is ${p.ids.uan || ''}. What should I do?`;
      draft = `Hi ${f}, your PF for ${P.company.period} (${m(p.pay.ded.find((d) => d.k === 'epf')?.amt || 0)} from you, the same from us) is in this month’s ECR, filed by the 15th. UMANG usually updates 3–5 days after that. If it still doesn’t show by the 20th, reply here and I’ll raise it with EPFO. ${hr.first}, HR`;
    } else if (/certificate|verification|letter|reference/i.test(s)) {
      ask = `${s}. Please send it soon.`;
      draft = `Hi ${f}, I’ve generated your letter on company letterhead: ${p.title}, joined ${PO.date(p.joinedIso)}, ${P.id === 'in' ? 'monthly gross ' + m(p.pay.gross) : 'current employee in good standing'}. It’s attached and signed by ${PO.person(P.topId).name}. ${hr.first}, HR`;
    } else if (/bank|deposit|address/i.test(s)) {
      ask = `${s}. I have opened a new account.`;
      draft = `Hi ${f}, you can change this yourself in the employee portal under My profile → Bank. For safety we verify with a one-time code and a ${P.id === 'in' ? '₹1 penny-drop' : 'small test deposit'}. If you make the change before ${P.company.payBy}, this pay goes to the new account. ${hr.first}, HR`;
    } else if (/PTO|holiday|leave/i.test(s)) {
      const l = p.leave[lt.key];
      ask = `${s}. I think I should have more left.`;
      draft = `Hi ${f}, your ${lt.name.toLowerCase()} balance is ${PO.num(l.balance)} ${lt.unit} (${PO.num(l.quota)} for the year, ${PO.num(l.taken)} taken${l.pending ? `, ${PO.num(l.pending)} pending` : ''}). It accrues as: ${lt.accrual.toLowerCase()}. I’ve attached the ledger so you can see each entry. ${hr.first}, HR`;
    } else if (/Form 1[36]|W-2|P60|P45/i.test(s)) {
      ask = `${s}. Need it for ${P.id === 'in' ? 'ITR filing' : P.id === 'us' ? 'my taxes' : 'a mortgage application'}.`;
      draft = `Hi ${f}, your ${s.match(/Form 1[36]\d?|W-2|P60|P45/)[0]} is ready. I’ve attached it here and you can also download it any time from My documents in the employee portal. ${hr.first}, HR`;
    } else if (/uniform/i.test(s)) {
      ask = `${s}. Current size is too small.`;
      draft = `Hi ${f}, no problem. Bring the old set to the ${PO.site(p.site).name} supervisor this week and pick up the new size; there’s no deduction for a size exchange. ${hr.first}, HR`;
    } else {
      ask = `${s}. Please help.`;
      draft = `Hi ${f}, thanks for writing in. I’ve checked your records and updated them. Let me know if anything still looks wrong. ${hr.first}, HR`;
    }
    return { ask, draft };
  }

  /** Tickets: the shared P.tickets plus older resolved ones for history and stats. */
  const cache = {};
  function tickets(P) {
    if (cache[P.id]) return cache[P.id];
    const r = PO.seeded('hd' + P.id);
    const office = P.people.filter((p) => p.role === 'office' && p.id !== P.hrId && p.id !== P.topId);
    const second = office[0] ? office[0].name : P.byId[P.topId].name;
    const base = P.tickets.map((t, i) => ({ ...t, channel: CHANS.includes(t.channel) ? t.channel : 'Portal', assignee: i % 3 === 2 ? second : t.assignee }));
    const extra = (P.id === 'in' ? ['Advance recovery wrong in Sep', 'Change nominee for PF', 'Need experience letter', 'ESI hospital list for Hadapsar', 'Night allowance missing in Aug', 'Uniform size exchange'] : P.id === 'us' ? ['PTO balance looks wrong', 'Missing tips on last check', 'Employment verification letter', '401(k) enrollment', 'Update direct deposit'] : ['Holiday balance query', 'Payslip missing night premium', 'Reference letter for flat', 'Change bank details', 'Pension opt-out'])
      .map((s, i) => ({ id: `HD-${1480 + i}`, subject: s, who: r.pick(P.people.filter((p) => p.role !== 'office')).id, opened: PO.addDays(PO.TODAY, -r.int(13, 40)), status: 'Resolved', channel: r.pick(['Portal', 'Portal', 'Email', 'HR desk']), sla: 'On track', assignee: r.chance(0.7) ? P.byId[P.hrId].name : second, aiDraft: r.chance(0.7) }));
    const hero = P.hero;
    const mine = [{ id: 'HD-1509', subject: P.id === 'in' ? 'Need salary certificate for bank loan' : P.id === 'us' ? 'Employment verification letter' : 'Reference letter for flat', who: hero.id, opened: PO.addDays(PO.TODAY, -1), status: 'In progress', channel: 'Portal', sla: 'On track', assignee: P.byId[P.hrId].name, aiDraft: true }, { id: 'HD-1475', subject: P.id === 'in' ? 'Night allowance missing in Aug' : P.id === 'us' ? 'Missing tips on last check' : 'Payslip missing night premium', who: hero.id, opened: PO.addDays(PO.TODAY, -21), status: 'Resolved', channel: 'Portal', sla: 'On track', assignee: P.byId[P.hrId].name, aiDraft: true }];
    const all = [...base, ...extra, ...mine].map((t) => {
      const p = PO.person(t.who);
      const rr = PO.seeded('hdt' + P.id + t.id);
      return { ...t, cat: catName(P, catOf(t.subject)), frt: rr.int(6, 95), prio: t.sla === 'Breached' ? 'High' : rr.pick(['Normal', 'Normal', 'Low', 'High']), csat: t.status === 'Resolved' ? rr.pick([5, 5, 4, 5, 4, 3]) : null, ...script(P, t, p) };
    });
    cache[P.id] = all;
    return all;
  }

  function articles(P) {
    const r = PO.seeded('kb' + P.id);
    const A = P.id === 'in' ? [
      ['Pay', 'Downloading your payslip', 'Sign in to the employee portal and open My pay. Every payslip since you joined is there as a PDF; pick a month to download an older one.'],
      ['Pay', 'Why is my take-home different this month?', 'Take-home changes with paid days, overtime, night allowance and PF. Open your payslip and click “Why did my pay change?” for a line-by-line comparison with last month.'],
      ['Benefits & PF', 'Checking your PF balance on UMANG', 'Log in to UMANG with your UAN-linked mobile number, open EPFO → View passbook. Contributions show 3–5 days after the ECR is filed on the 15th.'],
      ['Benefits & PF', 'Getting your ESI e-Pehchan card', 'Download it from the ESIC portal using your insurance number, or ask HR to send it. You and your family can use any ESI dispensary from day one.'],
      ['Leave', 'Applying for casual, sick and earned leave', 'Apply in the employee portal under My leave. Casual leave needs one day’s notice to your supervisor; sick leave can be applied on the day.'],
      ['Leave', 'Earned leave carry-forward and encashment', 'Up to 45 earned leaves carry forward. Anything above that is encashed in the January salary at your basic plus DA rate.'],
      ['Tax & forms', 'Form 130 (earlier Form 16): when you get it', 'Form 130 is issued by 15 June for the previous financial year and appears in Documents. You need it to file your income tax return.'],
      ['Tax & forms', 'Old or new tax regime: declaring investments', 'Choose your regime in April. If you pick the old regime, declare 80C and HRA proofs by 15 January so TDS is correct.'],
      ['Profile & bank', 'Changing your bank account', 'Go to My profile → Bank in the employee portal. We verify with a one-time code and a ₹1 penny-drop before the next salary.'],
      ['Letters', 'Salary certificate and employment letters', 'Raise a request in the employee portal under Ask HR. Letters are generated on letterhead and signed digitally, usually the same day.'],
      ['Uniform & assets', 'Uniform exchange and replacement', 'Size exchanges are free. Lost or damaged uniforms are replaced at cost, recovered over two months.'],
    ] : P.id === 'us' ? [
      ['Pay', 'Viewing your pay stubs', 'Open My pay in the employee portal. Every stub since you started is there as a PDF.'],
      ['Pay', 'How card tips show on your check', 'Card tips are pooled by shift and paid on your regular check. They are taxable, so they show under earnings and in withholding.'],
      ['Tax & forms', 'Updating your W-4', 'Change your W-4 any time in the employee portal under My documents. The change applies from the next check after you submit it.'],
      ['Tax & forms', 'Getting your W-2', 'W-2s are published in Documents by January 31. Former employees get theirs by mail at the last address on file.'],
      ['Profile & bank', 'Changing direct deposit', 'Update it under Profile → Bank. We send a small test deposit to confirm before switching your pay.'],
      ['Leave', 'How PTO accrues', 'You earn 1 hour of PTO for every 30 hours worked, up to 80 hours a year. Up to 40 hours carry over into the new year.'],
      ['Leave', 'Sick time and doctor’s notes', 'You get 40 hours of sick time on January 1. No doctor’s note is needed for absences under 3 days.'],
      ['Benefits & PF', '401(k) enrollment and the 3% match', 'You are auto-enrolled at 4% after 60 days. We match 100% of the first 3% you save, vested immediately.'],
      ['Pay', 'Overtime and your workweek', 'Hourly staff earn 1.5× after 40 hours in a Monday–Sunday workweek, across all locations combined.'],
      ['Letters', 'Employment verification letters', 'Request one in the employee portal under Ask HR. Most are ready the same day; lenders can also verify through The Work Number.'],
    ] : [
      ['Pay', 'Your payslip explained', 'Your payslip shows hours, rates, night premium, PAYE, National Insurance and pension. Click any line in the employee portal to see how it was worked out.'],
      ['Tax & forms', 'P60 and P45: when you get them', 'P60s are issued by 31 May for the tax year to 5 April. A P45 is issued with your final pay when you leave.'],
      ['Leave', 'Holiday entitlement and how it accrues', 'Full-time staff get 28 days including bank holidays, pro rata for part-time. Up to 5 days carry over.'],
      ['Leave', 'Statutory Sick Pay', 'SSP is paid from the fourth day of sickness. Self-certify for up to 7 days, then you need a fit note.'],
      ['Benefits & PF', 'Opting out of the workplace pension', 'You can opt out within one month of being enrolled and get a full refund. After that, you can stop paying in at any time.'],
      ['Profile & bank', 'Changing your bank details', 'Update them in the employee portal under My profile → Bank. Changes made before the cut-off apply to the next pay run.'],
      ['Pay', 'Night premium and overtime rates', 'Hours between 22:00 and 06:00 earn a £1.50 an hour premium. Overtime is paid at time and a half after your contracted hours.'],
      ['Letters', 'Reference and employment letters', 'Raise a request in the employee portal under Ask HR. We confirm your role, dates and hours, usually within one working day.'],
      ['Profile & bank', 'Right to work share codes', 'If your right to work is time-limited, we’ll ask for a new share code before it expires. Upload it in the employee portal under My documents.'],
      ['Uniform & assets', 'Uniform and PPE', 'Your first uniform is free. Replacements are free for wear and tear and never take your pay below the National Living Wage.'],
    ];
    return A.map(([cat, title, body], i) => ({ id: `KB-${210 + i}`, cat: catName(P, cat), title, body, views: r.int(40, 900), helpful: r.int(78, 98), updated: PO.addDays(PO.TODAY, -r.int(5, 200)) }));
  }

  /* ---------- ticket drawer ---------- */
  function TicketDrawer({ t, P, st, setSt, onClose, kb }) {
    const p = PO.person(t.who);
    const s = st[t.id] || {};
    const status = s.status || t.status;
    const [mode, setMode] = useState('reply');
    const [draft, setDraft] = useState(t.aiDraft ? t.draft : '');
    const [note, setNote] = useState('');
    const [gen, setGen] = useState(t.aiDraft);
    const sent = s.sent || (t.status === 'Resolved' ? [t.draft] : []);
    const notes = s.notes || [];
    const patch = (x) => setSt({ ...st, [t.id]: { ...s, ...x } });
    const hr = PO.person(P.hrId);
    const related = kb.filter((a) => a.cat === t.cat).slice(0, 2);
    const send = () => { patch({ sent: [...sent, draft], status: 'Waiting on employee' }); setDraft(''); setGen(false); PO.toast(`Reply sent to ${p.first} via ${replyVia(t.channel)}`, { icon: 'Send', action: { label: 'Undo', run: () => setSt({ ...st, [t.id]: s }) } }); };
    const resolve = () => { patch({ status: 'Resolved' }); PO.toast(`${t.id} resolved. ${p.first} will get a one-click rating by email.`, { icon: 'CircleCheck', action: { label: 'Undo', run: () => setSt({ ...st, [t.id]: s }) } }); };
    return html`<${PO.Drawer} open size="lg" onClose=${onClose} head=${html`<div class="grow" style="min-width:0"><div class="row" style="gap:6px"><span class="faint tnum">${t.id}</span><${PO.Status} s=${status} /><${PO.Status} s=${t.sla} /></div><h3 class="ellipsis" style="margin-top:4px">${t.subject}</h3></div>`}
      footer=${html`<span class="faint t-sm" style="margin-right:auto">Opened ${PO.rel(t.opened)} via ${t.channel === 'Portal' ? 'the employee portal' : t.channel === 'Email' ? 'email' : 'the HR desk'}. First response took ${t.frt} min.</span>${status === 'Resolved' ? html`<${PO.Button} onClick=${() => patch({ status: 'Open' })}>Reopen</${PO.Button}>` : html`<${PO.Button} kind="primary" onClick=${resolve}>Resolve</${PO.Button}>`}`}>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:16px">
        <div style="min-width:0">
          <div class="hd-msg"><${PO.Avatar} p=${p} size="lg" /><div><div class="hd-meta"><b>${p.name}</b> ${t.channel === 'HR desk' ? 'logged at the HR desk' : t.channel === 'Email' ? 'by email' : 'via the employee portal'} on ${PO.date(t.opened, { short: true })}</div><div class="hd-bubble">${t.ask}</div></div></div>
          ${sent.map((m) => html`<div class="hd-msg hr"><${PO.Avatar} p=${hr} size="lg" /><div><div class="hd-meta"><b>${hr.name}</b> replied via ${replyVia(t.channel)}<span class="right">Seen</span></div><div class="hd-bubble">${m}</div></div></div>`)}
          ${notes.map((n) => html`<div class="hd-msg note"><${PO.Avatar} p=${hr} size="lg" /><div><div class="hd-meta"><b>${hr.name}</b> left an internal note, visible to HR only</div><div class="hd-bubble">${n}</div></div></div>`)}
          ${status !== 'Resolved' ? html`
            <${PO.Segmented} options=${[['reply', t.channel === 'Email' ? 'Reply by email' : 'Reply in the portal'], ['note', 'Internal note']]} value=${mode} onChange=${setMode} />
            <div class="mt-8">${mode === 'reply' ? html`<div class="hd-draft">
              ${gen ? html`<div class="hd-draft-h">Drafted from payslip, ${t.cat === 'Leave' ? 'leave ledger' : 'profile'}${related[0] ? ', ' + related[0].id : ''}. Review before sending.</div>` : null}
              <textarea class="textarea" placeholder=${`Write to ${p.first}…`} value=${draft} onInput=${(e) => setDraft(e.target.value)}></textarea>
              <div class="hd-draft-f"><${PO.Button} size="sm" kind="ghost" onClick=${() => { setDraft(t.draft); setGen(true); PO.toast('Draft written from their records', { icon: 'FilePen' }); }}>${gen ? 'Redraft' : 'Draft reply'}</${PO.Button}><${PO.Button} size="sm" kind="ghost" icon="Paperclip" onClick=${() => PO.toast('Attached latest payslip (PDF)', { icon: 'Paperclip' })}>Attach</${PO.Button}><span class="right row"><${PO.Button} size="sm" onClick=${() => { send(); resolve(); }} disabled=${!draft.trim()}>Send & resolve</${PO.Button}><${PO.Button} size="sm" kind="primary" onClick=${send} disabled=${!draft.trim()}>Send</${PO.Button}></span></div>
            </div>` : html`<div class="hd-draft"><textarea class="textarea" placeholder="Only HR can see notes. @mention someone to loop them in." value=${note} onInput=${(e) => setNote(e.target.value)}></textarea><div class="hd-draft-f"><span class="right"><${PO.Button} size="sm" kind="primary" disabled=${!note.trim()} onClick=${() => { patch({ notes: [...notes, note] }); setNote(''); PO.toast('Note added'); }}>Add note</${PO.Button}></span></div></div>`}</div>` : html`<div class="row t-sm" style="padding:10px 0;border-top:1px solid var(--border)"><${PO.Status} s="Resolved" /><span class="faint">${t.csat ? `${p.first} rated this ${t.csat}/5.` : `${p.first} has been asked to rate the answer.`}</span></div>`}
        </div>
        <div class="hd-side">
          <div><h4>Details</h4>
            <div class="col" style="gap:8px">
              <${PO.Field} label="Status"><${PO.Select} value=${status} onChange=${(v) => { patch({ status: v }); PO.toast(`Status: ${v}`); }} options=${['Open', 'In progress', 'Waiting on employee', 'Resolved']} /></${PO.Field}>
              <${PO.Field} label="Assignee"><${PO.Select} value=${s.assignee || t.assignee} onChange=${(v) => { patch({ assignee: v }); PO.toast(`Assigned to ${v}`); }} options=${[...new Set([t.assignee, hr.name, ...P.people.filter((q) => q.role === 'office').slice(0, 3).map((q) => q.name)])]} /></${PO.Field}>
              <div class="row t-sm"><span class="faint grow">Category</span><span class="row" style="gap:6px"><${CatChip} c=${t.cat} size=${12} />${t.cat}</span></div>
              <div class="row t-sm"><span class="faint grow">Priority</span><span style=${t.prio === 'High' ? 'color:var(--red)' : ''}>${t.prio}</span></div>
            </div></div>
          <div><h4>Requester</h4><${PO.Who} p=${p} sub=${`${p.title}, ${PO.site(p.site).name}`} /><div class="faint t-xs mt-8">${p.id}, ${p.phone}</div></div>
          <div><h4>Linked records</h4>
            <a class="hd-link" href=${PO.href('payslips')}><span class="grow t-sm ellipsis">Payslip, ${P.company.period}</span><span class="faint t-xs tnum">${PO.money(p.pay.net)}</span></a>
            <a class="hd-link" href=${PO.href('people/' + p.id)}><span class="grow t-sm ellipsis">Profile and documents</span></a>
            ${t.cat === 'Leave' ? html`<a class="hd-link" href=${PO.href('leave')}><span class="grow t-sm">Leave ledger</span></a>` : null}
          </div>
          ${related.length ? html`<div><h4>Suggested articles</h4>${related.map((a) => html`<div class="hd-link" onClick=${() => { setDraft((d) => (d ? d + '\n\n' : '') + `More here: ${a.title} (${a.id})`); PO.toast('Article link added to the reply'); }}><span class="grow t-sm" style="line-height:1.3">${a.title}</span><${PO.Icon} n="Plus" size=${13} /></div>`)}</div>` : null}
        </div>
      </div>
    </${PO.Drawer}>`;
  }

  function ArticleDrawer({ a, onClose }) {
    const [vote, setVote] = useState(null);
    return html`<${PO.Drawer} open title=${a.title} sub=${`${a.cat}. Updated ${PO.date(a.updated, { short: true })}.`} onClose=${onClose} footer=${html`<span class="faint t-sm" style="margin-right:auto">${PO.num(a.views)} views, ${a.helpful}% found it helpful</span><${PO.Button} onClick=${() => PO.toast('Editing. Changes publish to the employee portal and Ask HR.', { icon: 'Pencil' })}>Edit</${PO.Button}><${PO.Button} kind="primary" onClick=${() => PO.toast('Link copied')}>Copy link</${PO.Button}>`}>
      <p style="font-size:14px;line-height:1.65">${a.body}</p>
      <p class="faint t-sm mt-16">Ask AI cites this article for questions about ${a.cat.toLowerCase()}.</p>
      <div class="row mt-24" style="padding-top:16px;border-top:1px solid var(--border)"><span class="muted">Was this helpful?</span>${vote ? html`<span class="faint">Thanks for the feedback.</span>` : html`<${PO.Button} size="sm" onClick=${() => setVote('up')}>Yes</${PO.Button}><${PO.Button} size="sm" onClick=${() => setVote('down')}>No</${PO.Button}>`}</div>
    </${PO.Drawer}>`;
  }

  function KnowledgeBase({ P, kb, onOpen }) {
    const [cat, setCat] = useState('');
    const [q, setQ] = useState('');
    const cats = [...new Set(kb.map((a) => a.cat))];
    const byCat = cats.map((c) => ({ label: c, value: kb.filter((a) => a.cat === c).reduce((t, a) => t + a.views, 0), sub: PO.plural(kb.filter((a) => a.cat === c).length, 'article') })).sort((a, b) => b.value - a.value);
    let list = kb.filter((a) => (!cat || a.cat === cat) && (!q || (a.title + a.body).toLowerCase().includes(q.toLowerCase())));
    return html`<div class="grid g-main" style="align-items:start">
      <div class="card" style="overflow:hidden">
        <div class="tbl-toolbar"><${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search articles" />
          <select class="select" style="width:auto;min-width:150px;height:30px" value=${cat} onChange=${(e) => setCat(e.target.value)}><option value="">Category: All</option>${cats.map((c) => html`<option value=${c}>${c}</option>`)}</select>
          <span class="right"><${PO.Button} size="sm" onClick=${() => PO.toast('New article draft created', { icon: 'FilePlus' })}>New article</${PO.Button}></span></div>
        <div class="hd-art" style="cursor:default;background:var(--surface-2);padding-top:8px;padding-bottom:8px"><span class="t-sm muted w-500">Article</span><span class="row t-sm muted w-500" style="gap:24px"><span style="width:60px;text-align:right">Views</span><span style="width:60px;text-align:right">Helpful</span></span></div>
        ${list.length ? list.map((a) => html`<div class="hd-art" onClick=${() => onOpen(a)}><div class="row" style="gap:12px;min-width:0"><${CatChip} c=${a.cat} /><div style="min-width:0"><div class="w-500 ellipsis">${a.title}</div><div class="faint t-sm ellipsis">${a.cat}, updated ${PO.date(a.updated, { short: true })}</div></div></div><div class="row t-sm tnum" style="gap:24px"><span style="width:60px;text-align:right">${PO.num(a.views)}</span><span style=${`width:60px;text-align:right;${a.helpful < 82 ? 'color:var(--amber)' : ''}`}>${a.helpful}%</span></div></div>`) : html`<${PO.Empty} icon="SearchX" title="No articles match" text="Try another word, or create an article from a resolved ticket." />`}
      </div>
      <div class="col gap-16">
        <${PO.Card} title="Views by category" sub="Last 90 days"><${PO.Charts.HBars} data=${byCat} /></${PO.Card}>
        <${PO.Card} title="Deflection" sub="Last 30 days"><div class="row" style="align-items:baseline;gap:8px"><span class="t-xl w-600 tnum">64%</span><span class="faint t-sm">answered without a ticket</span></div><div class="faint t-sm mt-8">By an article or Ask HR in the employee portal.</div></${PO.Card}>
      </div>
    </div>`;
  }

  /* ---------- employee: Ask HR ---------- */
  function AskHR({ P, all, kb }) {
    const me = P.hero;
    const hr = PO.person(P.hrId);
    const { dispatch } = PO.useStore();
    const [mine, setMine] = PO.useCoState('helpdesk.mine', []);
    const [q, setQ] = useState('');
    const [art, setArt] = useState(null);
    const [form, setForm] = useState({ cat: 'Pay', subject: '', body: '', chan: 'Portal' });
    const my = [...mine, ...all.filter((t) => t.who === me.id)];
    const hits = q ? kb.filter((a) => (a.title + a.body).toLowerCase().includes(q.toLowerCase())) : [];
    const submit = () => { const id = `HD-${1520 + mine.length}`; setMine([{ id, subject: form.subject, status: 'Open', opened: PO.TODAY, channel: form.chan, cat: form.cat, sla: 'On track' }, ...mine]); setForm({ ...form, subject: '', body: '' }); PO.toast(`Request ${id} sent to HR. You’ll hear back ${form.chan === 'Email' ? 'by email' : 'here in the portal, with an email alert'}.`, { icon: 'Send' }); };
    const topics = [...new Set(kb.map((a) => a.cat))];
    return html`
      <div class="grid g-main" style="align-items:start">
        <div class="col" style="gap:24px">
          <div class="card" style="overflow:hidden">
            <div class="tbl-toolbar"><div class="input-wrap grow"><${PO.Icon} n="Search" size=${14} /><input class="input" placeholder=${`Search answers, e.g. “${P.leaveTypes[0].name.toLowerCase()}” or “payslip”`} value=${q} onInput=${(e) => setQ(e.target.value)} /></div>
              ${q ? html`<${PO.Button} size="sm" onClick=${() => dispatch({ type: 'set', patch: { assistant: { prompt: q } } })}>Ask HR assistant</${PO.Button}>` : null}</div>
            <div class="hd-topics"><span class="faint">Topics</span>${topics.map((c) => html`<a class=${q === c.split(' ')[0] ? 'on' : ''} onClick=${() => setQ(q === c.split(' ')[0] ? '' : c.split(' ')[0])}>${c}</a>`)}</div>
            ${(q ? hits : kb.slice().sort((a, b) => b.views - a.views).slice(0, 5)).map((a) => html`<div class="hd-art" onClick=${() => setArt(a)}><div style="min-width:0"><div class="w-500 ellipsis">${a.title}</div><div class="faint t-sm ellipsis">${a.body}</div></div><span class="faint t-xs tnum">${q ? a.cat : PO.num(a.views) + ' views'}</span></div>`)}
            ${q && !hits.length ? html`<${PO.Empty} icon="SearchX" title="No article matches" text="Raise a request and HR will answer." />` : null}
          </div>
          <${PO.Card} title="My requests" sub=${PO.plural(my.length, 'request')} flush>${my.length ? html`<div class="list">${my.map((t) => html`<div class="list-item"><div class="grow" style="min-width:0"><div class="w-500 ellipsis">${t.subject}</div><div class="faint t-xs">${t.cat}, raised ${PO.rel(t.opened).toLowerCase()}</div></div><${PO.Status} s=${t.status} /></div>`)}</div>` : html`<${PO.Empty} icon="LifeBuoy" title="No requests yet" />`}</${PO.Card}>
        </div>
        <div class="col gap-16">
          <${PO.Card} title="New request" foot=${html`<span class="faint t-xs">Usually answered within 4 working hours</span><span class="right"><${PO.Button} kind="primary" disabled=${!form.subject.trim()} onClick=${submit}>Send to HR</${PO.Button}></span>`}>
            <div class="col gap-12">
              <${PO.Field} label="Topic"><${PO.Select} value=${form.cat} onChange=${(v) => setForm({ ...form, cat: v })} options=${topics} /></${PO.Field}>
              <${PO.Field} label="Subject"><input class="input" placeholder="What do you need?" value=${form.subject} onInput=${(e) => setForm({ ...form, subject: e.target.value })} /></${PO.Field}>
              <${PO.Field} label="Details" hint="Add dates or amounts if it’s about pay"><textarea class="textarea" value=${form.body} onInput=${(e) => setForm({ ...form, body: e.target.value })}></textarea></${PO.Field}>
              <${PO.Field} label="Reply to me"><${PO.Segmented} options=${[['Portal', 'In the portal'], ['Email', 'By email']]} value=${form.chan} onChange=${(v) => setForm({ ...form, chan: v })} /></${PO.Field}>
              <div><${PO.Button} size="sm" kind="ghost" icon="Paperclip" onClick=${() => PO.toast('Photo attached', { icon: 'Paperclip' })}>Attach a file</${PO.Button}></div>
            </div>
          </${PO.Card}>
          <div class="card"><div class="card-b row"><${PO.Avatar} p=${hr} /><div class="grow" style="min-width:0"><b class="w-600">${hr.name}</b><div class="faint t-sm">${hr.title}, Mon–Sat 9–6</div></div><${PO.Button} size="sm" href=${`mailto:hr@${P.vocab.domain}`}>Email</${PO.Button}></div></div>
        </div>
      </div>
      ${art ? html`<${ArticleDrawer} a=${art} onClose=${() => setArt(null)} />` : null}`;
  }

  /* ---------- page ---------- */
  function Helpdesk({ query }) {
    const P = PO.P();
    const { state } = PO.useStore();
    const all = useMemo(() => tickets(P), [P.id]);
    const kb = useMemo(() => articles(P), [P.id]);
    const [tab, setTab] = useState(query.tab || 'queue');
    const [open, setOpen] = useState(query.ticket || null);
    const [art, setArt] = useState(null);
    const [st, setSt] = PO.useCoState('helpdesk.state', {});
    if (state.role === 'employee') return html`<${PO.PageHeader} title="Ask HR" sub=${`${PO.plural(all.filter((t) => t.who === P.hero.id && t.status !== 'Resolved').length, 'open request')}. HR replies within 4 working hours.`} /><${AskHR} P=${P} all=${all} kb=${kb} />`;
    const rows = all.map((t) => ({ ...t, status: (st[t.id] && st[t.id].status) || t.status, assignee: (st[t.id] && st[t.id].assignee) || t.assignee }));
    const openT = rows.filter((t) => t.status !== 'Resolved');
    const frts = rows.map((t) => t.frt).sort((a, b) => a - b);
    const median = frts[Math.floor(frts.length / 2)];
    const rated = rows.filter((t) => t.csat);
    const csat = rated.reduce((s, t) => s + t.csat, 0) / (rated.length || 1);
    const statuses = ['Open', 'In progress', 'Waiting on employee', 'Resolved'];
    const assignees = [...new Set(rows.map((t) => t.assignee))];
    const ticket = open && rows.find((t) => t.id === open);
    const columns = [
      { key: 'subject', label: 'Ticket', render: (t) => html`<div class="row" style="gap:12px;min-width:0;max-width:380px"><${CatChip} c=${t.cat} /><div style="min-width:0"><div class="w-500 ellipsis">${t.subject}</div><div class="faint t-xs">${t.id}${t.aiDraft && t.status !== 'Resolved' ? ', reply drafted' : ''}</div></div></div>`, sort: (t) => t.subject },
      { key: 'who', label: 'Requester', render: (t) => html`<${PO.Who} id=${t.who} sub=${PO.site(PO.person(t.who).site).name} />`, sort: (t) => PO.person(t.who).name, csv: (t) => PO.person(t.who).name },
      { key: 'cat', label: 'Category', render: (t) => html`<span class="t-sm" style="white-space:nowrap">${t.cat}</span>` },
      { key: 'status', label: 'Status', render: (t) => html`<${PO.Status} s=${t.status} />` },
      { key: 'sla', label: 'SLA', render: (t) => (t.status === 'Resolved' ? html`<span class="faint t-sm">Met</span>` : html`<${PO.Status} s=${t.sla} />`), sort: (t) => ({ Breached: 0, 'Due today': 1, 'On track': 2 }[t.sla]) },
      { key: 'opened', label: 'Opened', render: (t) => html`<div class="t-sm" style="white-space:nowrap">${PO.rel(t.opened)}</div><div class="faint t-xs">${t.channel === 'Portal' ? 'Portal' : t.channel}</div>`, sort: (t) => t.opened, csv: (t) => t.opened },
      { key: 'assignee', label: 'Assignee', render: (t) => html`<span class="row t-sm"><${PO.Avatar} p=${personByName(P, t.assignee)} name=${t.assignee} size="sm" />${t.assignee.split(' ')[0]}</span>` },
    ];
    const bulk = (ids, clear) => html`<${PO.Button} size="sm" kind="primary" icon="CircleCheck" onClick=${() => { const n = { ...st }; ids.forEach((id) => (n[id] = { ...(n[id] || {}), status: 'Resolved' })); setSt(n); clear(); PO.toast(`Resolved ${PO.plural(ids.length, 'ticket')}`, { action: { label: 'Undo', run: () => setSt(st) } }); }}>Resolve</${PO.Button}><${PO.Button} size="sm" icon="UserPlus" onClick=${() => { const n = { ...st }; ids.forEach((id) => (n[id] = { ...(n[id] || {}), assignee: PO.person(P.hrId).name })); setSt(n); clear(); PO.toast('Assigned to you'); }}>Assign to me</${PO.Button}>`;
    const byChan = CHANS.map((c) => ({ label: c === 'Portal' ? 'Employee portal' : c, value: rows.filter((t) => t.channel === c).length }));
    return html`
      <${PO.PageHeader} title="Helpdesk" sub=${`${PO.plural(openT.length, 'open ticket')} from ${PO.plural(rows.length, 'ticket')} in the last 40 days. First reply due within 24 working hours.`} actions=${html`<${PO.Menu} align="right" trigger=${html`<${PO.IconButton} icon="Ellipsis" title="More" bordered />`} items=${[{ label: 'SLA settings', icon: 'Settings2', onClick: () => PO.go('settings/notifications') }, { label: 'New article', icon: 'FilePlus', onClick: () => { setTab('kb'); PO.toast('New article draft created', { icon: 'FilePlus' }); } }]} /><${PO.Button} kind="primary" onClick=${() => PO.toast('New ticket started. Pick the employee and channel.', { icon: 'Plus' })}>New ticket</${PO.Button}>`} />
      <div style="margin-bottom:24px"><${PO.KpiStrip} items=${(() => { const br = openT.filter((t) => t.sla === 'Breached').length, due = openT.filter((t) => t.sla === 'Due today').length; const r5 = rated.filter((t) => t.csat === 5).length, r4 = rated.filter((t) => t.csat === 4).length; return [
        { label: 'Open tickets', icon: 'LifeBuoy', accent: 'amber', faces: [...new Set(openT.map((t) => t.who))].filter((id) => PO.person(id)), value: openT.length, alert: br > 0, sub: br ? `${br} past the first-reply SLA, ${due} due today` : `${due} due today`, bar: [{ v: openT.length - br - due, k: 'ok', title: 'on track' }, { v: due, k: 'warn', title: 'due today' }, { v: br, k: 'bad', title: 'breached' }] },
        { label: 'Replies drafted', icon: 'PenLine', accent: 'violet', value: openT.filter((t) => t.aiDraft).length, unit: `/${openT.length}`, sub: 'Ready for you to review and send', bar: [{ v: openT.filter((t) => t.aiDraft).length, k: 'ok', title: 'drafted' }, { v: openT.filter((t) => !t.aiDraft).length, k: 'mute', title: 'not drafted' }] },
        { label: 'Median first reply', icon: 'Timer', accent: 'blue', value: median, unit: 'min', sub: 'Down from 96 min in August' },
        { label: 'Satisfaction', icon: 'Smile', accent: 'green', value: csat.toFixed(1), unit: '/5', sub: `From ${PO.plural(rated.length, 'rating')}`, bar: [{ v: r5, k: 'ok', title: `${r5} rated 5` }, { v: r4, k: 'mute', title: `${r4} rated 4` }, { v: rated.length - r5 - r4, k: 'warn', title: 'rated 3 or less' }] },
      ]; })()} /></div>
      <${PO.Tabs} tabs=${[['queue', 'Queue', openT.length], ['kb', 'Knowledge base', kb.length], ['insights', 'Insights']]} value=${tab} onChange=${setTab} />
      ${tab === 'queue' ? html`<${PO.DataTable} rows=${rows} columns=${columns} onRow=${(t) => setOpen(t.id)} selectable bulk=${bulk} exportName="helpdesk-tickets" search=${(t) => t.subject + ' ' + PO.person(t.who).name + ' ' + t.id} searchPlaceholder="Search tickets" initialSort=${{ key: 'sla', dir: 'asc' }}
          filters=${[{ key: 'status', label: 'Status', options: statuses, test: (t, v) => t.status === v }, { key: 'sla', label: 'SLA', options: ['Breached', 'Due today', 'On track'], test: (t, v) => t.sla === v && t.status !== 'Resolved' }, { key: 'channel', label: 'Channel', options: CHANS, test: (t, v) => t.channel === v }, { key: 'assignee', label: 'Assignee', options: assignees, test: (t, v) => t.assignee === v }]} />`
        : tab === 'kb' ? html`<${KnowledgeBase} P=${P} kb=${kb} onOpen=${setArt} />`
        : html`<div class="grid g-main" style="align-items:start">
            <div class="col gap-16">
              <${PO.Card} title="Median first response" sub="Last 8 weeks. Drafted replies went live on 31 Aug."><${PO.Charts.Line} labels=${['Aug 17', 'Aug 24', 'Aug 31', 'Sep 7', 'Sep 14', 'Sep 21', 'Sep 28', 'Oct 5']} series=${[{ name: 'Median minutes', data: [96, 88, 81, 64, 52, 47, 41, median] }]} height=${220} fmt=${(v) => v + ' min'} /></${PO.Card}>
              <${PO.Card} title="When questions arrive" sub="Tickets and Ask HR questions, last 4 weeks"><${PO.Charts.Heatmap} rows=${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} cols=${['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']} value=${(ri, ci) => { const base = [3, 1, 6, 9, 7, 8, 5, 4][ci]; return Math.round(base * (ri === 0 ? 1.6 : ri >= 5 ? 0.6 : 1) + ((ri * 7 + ci * 3) % 4)); }} /></${PO.Card}>
            </div>
            <div class="col gap-16">
              <${PO.Card} title="This month"><${PO.KV} items=${[['Tickets raised', PO.num(rows.length + 23)], ['Answered by Ask HR', `${PO.num(41)}, no ticket`], ['Resolved', PO.num(rows.filter((t) => t.status === 'Resolved').length + 21)], ['Reopened', '2'], ['Drafts sent unedited', '68%'], ['Via employee portal', `${Math.round((byChan[0].value / rows.length) * 100)}%`]]} /></${PO.Card}>
              <${PO.Card} title="By category"><${PO.Charts.HBars} data=${[...new Set(rows.map((t) => t.cat))].map((c) => ({ label: c, value: rows.filter((t) => t.cat === c).length })).filter((d) => d.value).sort((x, y) => y.value - x.value)} /></${PO.Card}>
              <${PO.Card} title="By assignee" flush><div class="list">${assignees.map((a) => { const mine = rows.filter((t) => t.assignee === a); return html`<div class="list-item"><${PO.Avatar} p=${personByName(P, a)} name=${a} /><span class="grow ellipsis w-500">${a}</span><span class="t-sm muted tnum">${mine.filter((t) => t.status !== 'Resolved').length} open, ${mine.filter((t) => t.status === 'Resolved').length} done</span></div>`; })}</div></${PO.Card}>
            </div>
          </div>`}
      ${ticket ? html`<${TicketDrawer} key=${ticket.id} t=${ticket} P=${P} st=${st} setSt=${setSt} kb=${kb} onClose=${() => setOpen(null)} />` : null}
      ${art ? html`<${ArticleDrawer} a=${art} onClose=${() => setArt(null)} />` : null}`;
  }

  PO.route('helpdesk', Helpdesk, { title: 'Helpdesk' });
})();
