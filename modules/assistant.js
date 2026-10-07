/* People OS: the "Ask People OS" side panel (PO.panels.assistant).
   Ask: scripted, record-backed answers with thinking steps, charts, sources and a human hand-off.
   Agents: background agents that draft work for a human to approve, with logs and Undo.
   History: past conversations. Answers are scoped by role (employees only hear about themselves). */
(function () {
  const PO = window.PO;
  const { html, useState, useEffect, useRef, useMemo } = PO;
  PO.panels = PO.panels || {};

  document.head.insertAdjacentHTML('beforeend', `<style>
  .as-panel { position: fixed; top: 0; right: 0; bottom: 0; width: min(440px, 100vw); z-index: 65; background: var(--surface); border-left: 1px solid var(--border); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; animation: slidein .2s cubic-bezier(.2,.8,.2,1); }
  .as-head { display: flex; align-items: center; gap: 8px; height: 52px; padding: 0 8px 0 16px; }
  .as-head svg.as-mark { color: var(--text-2); flex: none; }
  .as-tabs { display: flex; gap: 2px; padding: 0 8px; border-bottom: 1px solid var(--border); }
  .as-tabs .tab { height: 36px; }
  .as-body { flex: 1; overflow-y: auto; padding: 16px; min-height: 0; scroll-behavior: smooth; }
  .as-foot { border-top: 1px solid var(--border); padding: 12px; }
  .as-input { display: flex; gap: 8px; align-items: flex-end; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); padding: 6px 6px 6px 12px; }
  .as-input:focus-within { border-color: var(--border-strong); box-shadow: 0 0 0 3px var(--ring); }
  .as-input textarea { flex: 1; border: none; outline: none; resize: none; background: none; min-height: 22px; max-height: 120px; padding: 5px 0; line-height: 1.45; }
  .as-me { display: flex; justify-content: flex-end; margin: 0 0 16px; }
  .as-me div { max-width: 85%; background: var(--surface-3); color: var(--text); padding: 7px 12px; border-radius: 10px; }
  .as-ai { margin: 0 0 24px; }
  .as-ai-b { min-width: 0; }
  .as-ai-b > p { margin: 0 0 8px; line-height: 1.55; }
  .as-wait { color: var(--text-3); font-size: 12px; margin-bottom: 16px; }
  .as-block { border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); padding: 12px; margin: 8px 0; }
  .as-note { color: var(--text-2); font-size: 12.5px; line-height: 1.5; margin: 8px 0; }
  .as-done { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--r-lg); margin-top: 8px; font-size: 12.5px; }
  .as-done > svg { color: var(--green); flex: none; margin-top: 2px; }
  .as-cands { border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; margin: 8px 0; }
  .as-cand { display: grid; grid-template-columns: 16px 40px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--border); cursor: pointer; }
  .as-person { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); margin: 8px 0; }
  .as-person b { display: block; font-weight: 550; } .as-person small { display: block; color: var(--text-3); font-size: 12px; }
  .as-faces { display: flex; align-items: center; margin: 8px 0; } .as-faces .av { box-shadow: 0 0 0 2px var(--surface); } .as-faces .av + .av { margin-left: -6px; } .as-faces small { margin-left: 8px; color: var(--text-3); font-size: 12px; }
  .as-cand:last-child { border-bottom: none; }
  .as-cand:hover { background: var(--hover); }
  .as-cand.on { background: var(--surface-2); }
  .as-cand .radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--border-strong); display: grid; place-items: center; }
  .as-cand.on .radio { border-color: var(--ink); } .as-cand.on .radio::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--ink); }
  .as-why { font-size: 12px; color: var(--text-3); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .as-why .warn { color: var(--amber); }
  .as-prov { font-size: 11.5px; color: var(--text-3); margin-top: 10px; line-height: 1.6; }
  .as-prov a { color: var(--text-2); cursor: pointer; } .as-prov a:hover { color: var(--brand-text); text-decoration: underline; }
  .as-fb { display: flex; gap: 2px; align-items: center; margin-top: 4px; margin-left: -6px; }
  .as-fb .icon-btn.on { color: var(--text); background: var(--surface-3); }
  .as-cite { color: var(--brand-text); font-size: 12px; cursor: pointer; white-space: nowrap; }
  .as-cite:hover { text-decoration: underline; }
  .as-driver { display: grid; grid-template-columns: minmax(0, 1fr) 90px 76px; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12.5px; }
  .as-driver:last-child { border-bottom: none; }
  .as-hello { padding: 8px 0; }
  .as-hello h4 { font-size: 15px; font-weight: 600; }
  .as-prompts { margin-top: 16px; border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }
  .as-prompt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: none; border-bottom: 1px solid var(--border); background: var(--surface); cursor: pointer; text-align: left; color: var(--text); }
  .as-prompt:last-child { border-bottom: none; }
  .as-prompt:hover { background: var(--hover); }
  .as-prompt small { color: var(--text-3); font-size: 12px; display: block; }
  .as-prompt > svg { color: var(--text-3); flex: none; margin-left: auto; }
  .as-sum { font-size: 12px; color: var(--text-3); margin-bottom: 12px; line-height: 1.5; }
  .as-agents { border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }
  .as-agent { border-bottom: 1px solid var(--border); }
  .as-agent:last-child { border-bottom: none; }
  .as-agent-h { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; padding: 12px; align-items: flex-start; }
  .as-agent.off .as-agent-h b { color: var(--text-3); }
  .as-agent-meta { font-size: 11.5px; color: var(--text-3); margin-top: 4px; }
  .as-draft { margin: 0 12px 8px; padding: 8px 10px; border-radius: var(--r); background: var(--surface-2); border: 1px solid var(--border); display: flex; gap: 8px; align-items: center; }
  .as-draft .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amber-solid); flex: none; }
  .as-log { padding: 0 12px 8px; }
  .as-log-i { display: flex; gap: 8px; align-items: center; padding: 5px 0; font-size: 12px; color: var(--text-2); }
  .as-log-i.undone span.t { text-decoration: line-through; color: var(--text-3); }
  .as-hists { border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }
  .as-hist { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--border); cursor: pointer; background: var(--surface); }
  .as-hist:last-child { border-bottom: none; }
  .as-hist:hover { background: var(--hover); }
  </style>`);

  /* ---------- helpers ---------- */
  const chanWord = () => 'SMS';
  const byName = (P, n) => P.people.find((p) => p.name === n) || null;
  const leaveWord = (P) => (P.id === 'us' ? 'PTO' : P.id === 'uk' ? 'holiday' : 'leave');
  const periodWord = (P) => (P.id === 'in' ? 'month' : 'period');
  const cite = (P) => { const m = /\(([^)]+)\)\.?$/.exec(P.ai.leave); return m ? m[1] : 'Leave policy'; };
  const policyLine = (P) => P.ai.leave.split('. ').slice(1).join('. ');
  const signed = (v, money) => `${v >= 0 ? '+' : '−'}${money(Math.abs(v))}`;
  let uid = 0;
  const nid = () => `m${Date.now().toString(36)}${++uid}`;

  /** Decide what a prompt means. Scripted on purpose: the demo never misfires. */
  function intent(P, text, role) {
    const t = text.toLowerCase();
    if (role === 'employee') {
      if (/cover|late arrivals|headcount|attrition|payroll up|rule|2×|double|time and a half|team/.test(t)) return 'denied';
      if (/leave|pto|holiday|balance|days off|time off/.test(t)) return 'myLeave';
      if (/pay|payslip|salary|lower|less|more|deduct|net/.test(t)) return 'myPay';
      if (/shift|roster|tomorrow|tonight|next|schedule/.test(t)) return 'myShift';
      return 'help';
    }
    if (text === P.ai.cover || /\bcover\b|sick tonight|called in sick|replace/.test(t)) return 'cover';
    if (text === P.ai.rule || /(2×|2x|1\.5×|double time|time and a half|overtime is|premium|rule)/.test(t)) return 'rule';
    if (text === P.ai.late || /\blate\b/.test(t)) return 'late';
    if (/headcount|attrition|turnover|leavers|hires/.test(t)) return 'headcount';
    if (/close to overtime|near overtime|overtime risk/.test(t)) return 'otRisk';
    if (/payroll|net pay|pay.*up|wage bill|labour cost|labor cost/.test(t)) return 'payroll';
    if (text === P.ai.leaveQ || /leave|pto|holiday|balance/.test(t)) return 'leaveQ';
    return 'help';
  }
  const STEPS = (P, kind) => {
    const C = P.company;
    const cp = PO.person(P.cover.who);
    return ({
      cover: [`Reading tonight’s roster at ${PO.site(P.cover.site).name}`, `Checking who is off, rested and trained for ${cp ? cp.post || 'the post' : 'the post'}`, 'Ranking by hours this week and overtime cost'],
      late: ['Reading clock-ins for this ' + periodWord(P), 'Grouping late arrivals by site', 'Looking for a pattern'],
      rule: ['Parsing the rule', `Matching it to sites, roles and pay codes`, `Re-running last ${periodWord(P)}’s payroll with the rule`],
      leaveQ: [`Finding ${P.hero.name}`, 'Reading the leave ledger', 'Checking the leave policy'],
      payroll: [`Comparing ${C.period} with the previous run`, 'Splitting the change by headcount, overtime and pay days', 'Checking for anything unexplained'],
      headcount: ['Reading 12 pay runs', 'Counting joiners and leavers', 'Working out attrition'],
      otRisk: ['Reading this week’s clock-ins for your team', 'Adding scheduled shifts to Sunday', 'Flagging anyone above 44 h'],
      myLeave: ['Reading your leave ledger', 'Checking pending requests', 'Checking the policy'],
      myPay: ['Opening your latest payslip', 'Comparing with the one before', 'Explaining each change'],
      myShift: ['Reading the published roster', 'Checking swaps and leave'],
      denied: ['Checking what you can see'],
      help: ['Looking for a match in your records'],
    })[kind] || ['Thinking'];
  };
  const SOURCES = (P, kind) => {
    const C = P.company, last = P.payHistory[P.payHistory.length - 1], prev = P.payHistory[P.payHistory.length - 2];
    const cp = PO.person(P.cover.who);
    return ({
      cover: [['CalendarRange', `tonight’s roster at ${PO.site(P.cover.site).name}`, 'roster'], ['Globe', `${cp ? cp.first : 'Sick'}’s sick report in the employee portal`, null], ['ScrollText', 'Attendance & overtime policy §4.2', 'rules'], ['GraduationCap', 'Site training records', 'learning']],
      late: [['CalendarCheck2', `the attendance muster for ${C.period}`, 'attendance'], ['MapPin', 'live board clock-ins', 'live']],
      rule: [['ReceiptText', `the ${prev.label.replace('*', '')} payroll register`, 'payslips'], ['ScrollText', 'Rules & policies', 'rules'], ['Scale', P.id === 'in' ? 'Code on Wages 2019, §14' : P.id === 'us' ? 'FLSA, 29 CFR 778' : 'Working Time Regulations 1998', null]],
      leaveQ: [['UserRound', `${P.hero.name}’s leave ledger`, 'people/' + P.hero.id], ['BookOpen', cite(P), 'documents']],
      payroll: [['ReceiptText', `payroll register ${last.id}`, 'payroll'], ['ReceiptText', `payroll register ${prev.id}`, 'payslips'], ['Timer', 'Overtime approvals', 'approvals']],
      headcount: [['Users', 'Employee records', 'people'], ['UserMinus', `Exit records (${P.exits.length} open)`, 'offboarding'], ['ReceiptText', '12 pay runs', 'payslips']],
      otRisk: [['CalendarCheck2', 'Clock-ins this week', 'attendance'], ['CalendarRange', 'Published roster', 'roster']],
      myLeave: [['Palmtree', 'Your leave ledger', 'my-leave'], ['BookOpen', cite(P), null]],
      myPay: [['ReceiptText', `your ${C.period} payslip`, 'my-pay'], ['ReceiptText', 'Your previous payslip', 'my-pay']],
      myShift: [['CalendarRange', 'Published roster', 'my-time']],
    })[kind] || [];
  };

  /* ---------- answer bodies ---------- */
  function CoverAnswer({ P }) {
    const [cover, setCover] = PO.useCoState('assistant.cover', null);
    const [pick, setPick] = useState(0);
    const cands = P.cover.cands;
    const cp = PO.person(P.cover.who);
    const chan = chanWord(P);
    const confirm = () => { const c = cands[pick]; setCover({ ...c, rank: pick }); PO.toast(`${c.name} confirmed for tonight. Both were notified by SMS and email.`, { icon: 'CircleCheck', action: { label: 'Undo', run: () => setCover(null) } }); };
    return html`${cp ? html`<div class="as-person"><${PO.Avatar} p=${cp} size="lg" /><div style="min-width:0" class="grow"><b>${cp.name}</b><small>Off sick tonight, ${PO.shiftOf(cp.shift).label.toLowerCase()} shift at ${PO.site(P.cover.site).name}</small></div><${PO.Chip} icon="Thermometer" accent="rose" /></div>` : null}<p>${P.cover.text}</p>
      <div class="as-cands">${cands.map((c, i) => { const p = byName(P, c.name); const bits = c.why.split(' · '); return html`<div class=${'as-cand ' + (cover ? (cover.name === c.name ? 'on' : '') : pick === i ? 'on' : '')} onClick=${() => !cover && setPick(i)}>
        <span class="radio"></span>${p ? html`<${PO.Avatar} p=${p} size="lg" />` : html`<${PO.Avatar} name=${c.name} size="lg" />`}
        <div style="min-width:0"><b class="w-550 ellipsis" style="display:block">${c.name}</b><div class="as-why">${bits.map((b, j) => html`${j ? ', ' : ''}<span class=${/overtime/.test(b) ? 'warn' : ''}>${b}</span>`)}</div></div>
        <span class="faint t-xs tnum">${i === 0 ? 'Best match' : ''}</span>
      </div>`; })}</div>
      ${cover ? html`<div class="as-done"><${PO.Icon} n="CircleCheck" size=${15} /><div class="grow"><div class="w-500">${P.cover.done(cover)}</div><div class="faint mt-4">Roster updated for ${PO.shiftOf(cp ? cp.shift : 'C').label.toLowerCase()} shift at ${PO.site(P.cover.site).name}. ${cover.name.split(' ')[0]} accepted in the employee portal at ${P.hhmm(P.company.nowMin + 1)}. ${cp ? cp.first : ''}’s shift recorded as ${P.id === 'uk' ? 'off sick' : 'sick ' + (P.id === 'us' ? 'time' : 'leave')}.</div></div><${PO.Button} size="sm" onClick=${() => { setCover(null); PO.toast('Cover undone. Both were told the change is cancelled.', { icon: 'Undo2' }); }}>Undo</${PO.Button}></div>`
        : html`<div class="row mt-8"><${PO.Button} kind="primary" onClick=${confirm}>Confirm ${cands[pick].name.split(' ')[0]} and notify</${PO.Button}><${PO.Button} kind="ghost" onClick=${() => PO.go('roster')}>Open roster</${PO.Button}></div>`}`;
  }

  function LateAnswer({ P, viewer, role }) {
    const data = P.lateBySite;
    const total = data.reduce((t, d) => t + d[1], 0);
    const top = data[0];
    const mySite = role === 'manager' && viewer ? PO.site(viewer.site).name : null;
    return html`<p>${total} late arrivals across ${P.sites.length} sites this ${periodWord(P)}. ${top[0]} has ${Math.round((top[1] / total) * 100)}% of them.</p>
      <div class="as-block"><${PO.Charts.HBars} data=${data.map(([n, v]) => ({ label: n, value: v, color: mySite ? (n === mySite ? 'var(--chart-1)' : 'var(--chart-5)') : 'var(--chart-1)' }))} /></div>
      <p class="as-note">${Math.round(total * 0.71)} of ${total} were under 15 minutes, mostly on the ${P.shifts.find((s) => s.key === P.current).label.toLowerCase()} shift on Mondays. ${top[0]}’s gate queue at shift change is the likely cause; a second QR point would clear it.${mySite ? ` Your site, ${mySite}, is highlighted.` : ''}</p>
      <div class="row mt-8"><${PO.Button} size="sm" onClick=${() => PO.toast(`Sent the chart to ${P.sites.length} site leads by email`, { icon: 'Send' })}>Share with site leads</${PO.Button}><${PO.Button} size="sm" kind="ghost" onClick=${() => PO.go('attendance')}>Open muster</${PO.Button}></div>`;
  }

  function RuleAnswer({ P, setDraft }) {
    const A = P.ai;
    const [rules, setRules] = PO.useCoState('rules.custom', []);
    const applied = rules.some((r) => r.name === A.ruleName);
    const starts = P.id === 'in' ? '1 Oct 2026' : P.id === 'us' ? 'Nov 26, 2026 (Thanksgiving)' : '25 Dec 2026 (next bank holiday)';
    const scope = P.id === 'in' ? 'Security guards at EON Kharadi' : P.id === 'us' ? 'All hourly staff, every location' : 'All hourly staff, every site';
    const apply = () => { setRules((r) => [...r.filter((x) => x.name !== A.ruleName), { name: A.ruleName, value: A.ruleValue, from: 'Today', by: 'People OS assistant' }]); PO.toast(`Rule applied: ${A.ruleName}`, { icon: 'ScrollText', action: { label: 'Undo', run: () => setRules((r) => r.filter((x) => x.name !== A.ruleName)) } }); };
    return html`<p>Here’s the rule as I understood it. Check it before I apply anything.</p>
      <div class="as-block" style="padding:0;overflow:hidden">
        <div style="padding:10px 12px;border-bottom:1px solid var(--border)" class="row"><b class="w-600 grow">${A.ruleName}</b><${PO.Status} s=${applied ? 'Live' : 'Draft'} /></div>
        <div style="padding:12px"><div class="w-500" style="margin-bottom:10px">${A.ruleText}</div>
          <${PO.KV} items=${[['Pays', A.ruleValue], ['Applies to', scope], ['Starts', starts], ['Pay code', P.id === 'in' ? 'OT2X-KHD' : P.id === 'us' ? 'HOL-DT' : 'BH-150'], [`Cost on last ${periodWord(P)}`, A.ruleCost]]} />
        </div>
      </div>
      ${applied ? html`<div class="as-done"><${PO.Icon} n="CircleCheck" size=${15} /><div class="grow">Applied from today. It’s listed under <a class="link" href=${PO.href('rules')}>Rules & policies</a> and the next payroll uses it.</div><${PO.Button} size="sm" onClick=${() => setRules((r) => r.filter((x) => x.name !== A.ruleName))}>Undo</${PO.Button}></div>`
        : html`<div class="row mt-8"><${PO.Button} kind="primary" onClick=${apply}>Apply rule</${PO.Button}><${PO.Button} kind="ghost" onClick=${() => setDraft(A.rule)}>Edit wording</${PO.Button}></div>`}`;
  }

  function LeaveAnswer({ P, me }) {
    const h = P.hero;
    const types = P.leaveTypes.filter((t) => h.leave[t.key] && h.leave[t.key].balance != null && t.quota);
    const list = types.map((t) => `${PO.num(h.leave[t.key].balance)} ${t.unit === 'hours' ? 'h of ' + t.short : t.name.toLowerCase().replace(' leave', '')}`);
    return html`${me ? null : html`<div class="as-person"><${PO.Avatar} p=${h} size="lg" /><div style="min-width:0"><b>${h.name}</b><small>${h.title}, ${PO.site(h.site).name}</small></div></div>`}<p>${me ? 'You have' : `${h.name} has`} ${list.slice(0, -1).join(', ')}${list.length > 1 ? ' and ' : ''}${list[list.length - 1]} left${types[0] && types[0].unit === 'days' ? ' (days)' : ''}. ${policyLine(P).replace(/\s*\([^)]*\)\.?$/, '.')} <span class="as-cite" onClick=${() => PO.toast(`Opened ${cite(P)}`, { icon: 'BookOpen' })}>[${cite(P)}]</span></p>
      <div class="as-block" style="padding:4px 12px">${types.map((t) => { const l = h.leave[t.key]; return html`<div class="row t-sm" style="padding:7px 0;border-bottom:1px solid var(--border)"><${PO.Chip} icon=${{ cl: 'Coffee', sl: 'Thermometer', sick: 'Thermometer', el: 'Palmtree', pto: 'Palmtree', hol: 'Palmtree', co: 'RefreshCcw', jury: 'Scale', comp: 'HeartHandshake' }[t.key] || 'CalendarDays'} accent=${({ blue: 'blue', rose: 'rose', green: 'green', amber: 'amber' })[t.color] || 'violet'} size=${13} /><span style="width:110px;margin-left:4px" class="ellipsis">${t.name}</span><div class="grow"><${PO.Progress} value=${(l.balance / (l.quota || 1)) * 100} tone=${l.balance / (l.quota || 1) < 0.25 ? 'amber' : ''} /></div><b class="tnum" style="width:70px;text-align:right">${PO.num(l.balance)} / ${PO.num(l.quota)}</b></div>`; })}</div>
      ${me ? html`<div class="row mt-8"><${PO.Button} size="sm" kind="primary" href=${PO.href('my-leave')}>Apply for ${leaveWord(P)}</${PO.Button}></div>` : html`<div class="row mt-8"><${PO.Button} size="sm" href=${PO.href('people/' + h.id)}>Open profile</${PO.Button}><${PO.Button} size="sm" kind="ghost" href=${PO.href('leave')}>Team calendar</${PO.Button}></div>`}`;
  }

  function PayrollAnswer({ P }) {
    const H = P.payHistory, last = H[H.length - 1], prev = H[H.length - 2];
    const diff = last.net - prev.net, pct = diff / prev.net;
    const heads = Math.round((last.heads - prev.heads) * (prev.net / prev.heads));
    const ot = last.ot - prev.ot;
    const other = diff - heads - ot;
    const m = (v) => PO.money(Math.round(v));
    const max = Math.max(Math.abs(heads), Math.abs(ot), Math.abs(other)) || 1;
    const rows = [['Headcount', `${last.heads - prev.heads >= 0 ? '+' : ''}${last.heads - prev.heads} people`, heads], ['Overtime', `${PO.compactMoney(prev.ot)} → ${PO.compactMoney(last.ot)}`, ot], [P.id === 'in' ? 'Paid days & allowances' : 'Hours, rates & tips', other >= 0 ? (P.id === 'in' ? 'Night allowance, fewer LOP days' : 'More scheduled hours and tips') : (P.id === 'in' ? 'More loss-of-pay days, lower allowances' : 'Fewer regular hours per person'), other]];
    return html`<p>Net pay for ${P.company.period} is <b>${PO.money(last.net)}</b>, ${diff >= 0 ? 'up' : 'down'} ${(Math.abs(pct) * 100).toFixed(1)}% (${signed(diff, m)}) on ${prev.label.replace('*', '')}. Three things explain it:</p>
      <div class="as-block" style="padding:6px 12px">${rows.map(([k, s, v]) => html`<div class="as-driver"><div style="min-width:0"><div class="w-500">${k}</div><div class="faint t-xs ellipsis">${s}</div></div><div class="prog" style="height:6px"><i style=${`width:${(Math.abs(v) / max) * 100}%;background:${v >= 0 ? 'var(--chart-1)' : 'var(--chart-5)'}`}></i></div><b class="tnum" style="text-align:right">${signed(v, m)}</b></div>`)}
        <div class="as-driver" style="border-top:1px solid var(--border)"><b>Total change</b><span></span><b class="tnum" style="text-align:right">${signed(diff, m)}</b></div></div>
      <div class="as-block"><div class="faint t-xs" style="margin-bottom:8px">Net pay, last 6 runs</div><div style="display:flex;gap:8px;align-items:flex-end;height:90px">${H.slice(-6).map((h, i) => { const mx = Math.max(...H.slice(-6).map((x) => x.net)); return html`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end" title=${PO.money(h.net)}><span class="tnum" style="font-size:10.5px;color:var(--text-2)">${PO.compactMoney(h.net)}</span><div style=${`width:100%;height:${(h.net / mx) * 70}%;border-radius:4px 4px 1px 1px;background:${i === 5 ? 'var(--chart-1)' : 'var(--chart-5)'};opacity:${i === 5 ? 1 : 0.45}`}></div></div>`; })}</div><div style="display:flex;gap:8px;margin-top:4px">${H.slice(-6).map((h) => html`<span class="faint tnum" style="flex:1;text-align:center;font-size:10.5px;white-space:nowrap">${P.id === 'in' ? h.label.slice(0, 3) : h.label.replace('*', '').split('–').pop().trim()}</span>`)}</div></div>
      <p class="faint t-sm">Nothing unexplained: every line ties back to approved hours or a headcount change.</p>`;
  }

  function HeadcountAnswer({ P }) {
    const H = P.payHistory;
    const start = H[0].heads, now = H[H.length - 1].heads;
    const avg = H.reduce((t, h) => t + h.heads, 0) / H.length;
    const rate = { in: 0.21, us: 0.17, uk: 0.24 }[P.id];
    const left = Math.round(avg * rate), joined = now - start + left;
    const annual = P.id === 'us' ? rate * (26 / 12) : P.id === 'uk' ? rate * (13 / 12) : rate;
    return html`<p>Headcount grew from ${start} to <b>${now}</b> over the last 12 pay runs: ${joined} joined and ${left} left. That’s ${(annual * 100).toFixed(0)}% annualised attrition, ${annual < 0.3 ? 'well below' : 'close to'} the ${P.id === 'in' ? 'facility-services' : P.id === 'us' ? 'food-service' : 'contract-cleaning'} norm of ${P.id === 'in' ? '35–45%' : P.id === 'us' ? '60–75%' : '30–40%'}.</p>
      <div class="as-block"><${PO.Charts.Line} labels=${H.map((h) => (P.id === 'in' ? h.label.slice(0, 3) : h.label.replace('*', '').split('–').pop().trim()))} series=${[{ name: 'Headcount', data: H.map((h) => h.heads) }]} height=${180} /></div>
      ${P.exits.length ? html`<div class="as-faces">${P.exits.slice(0, 6).map((e) => html`<${PO.Avatar} p=${e.who ? PO.person(e.who) : P.people.find((q) => q.name === e.name)} name=${e.name} size="sm" />`)}<small>${P.exits.map((e) => e.name.split(' ')[0]).slice(0, 3).join(', ')}${P.exits.length > 3 ? ` and ${P.exits.length - 3} more` : ''}, recent and upcoming leavers</small></div>` : null}
      <p class="as-note">${P.exits.filter((e) => e.status === 'Serving notice').length} more are serving notice. Most leavers had under 6 months’ tenure. Exit interviews mention ${P.id === 'in' ? 'pay at rival agencies and night-shift fatigue' : P.id === 'us' ? 'school schedules and commute' : 'hours and travel to the airport site'}.</p>`;
  }

  function OtRiskAnswer({ P, viewer }) {
    const team = useMemo(() => { const acc = new Set(); const walk = (m) => (P.byManager[m] || []).forEach((x) => { if (!acc.has(x)) { acc.add(x); walk(x); } }); walk(viewer.id); return [...acc].map(PO.person).filter(Boolean); }, [P.id]);
    const r = PO.seeded('otrisk' + P.id);
    const lim = P.id === 'us' ? 40 : 48;
    const rows = team.map((p) => ({ p, h: r.int(26, lim + 4) })).sort((a, b) => b.h - a.h).slice(0, 5);
    return html`<p>${rows.filter((x) => x.h >= lim - 4).length} people on your team will be within 4 hours of ${lim} h by Sunday if they work their scheduled shifts.</p>
      <div class="as-block" style="padding:4px 12px">${rows.map(({ p, h }) => html`<div class="row t-sm" style="padding:7px 0;border-bottom:1px solid var(--border)"><${PO.Avatar} p=${p} size="xs" /><span class="grow ellipsis w-500">${p.name}</span><div style="width:90px"><${PO.Progress} value=${(h / lim) * 100} tone=${h >= lim ? 'red' : h >= lim - 4 ? 'amber' : ''} /></div><b class="tnum" style="width:44px;text-align:right">${h} h</b></div>`)}</div>
      <div class="row mt-8"><${PO.Button} size="sm" href=${PO.href('roster')}>Rebalance in roster</${PO.Button}></div>`;
  }

  function MyPayAnswer({ P }) {
    const h = P.hero, prev = P.prevPay;
    const diff = h.pay.net - prev.net;
    const m = (v) => PO.money(v);
    return html`<p>Your net pay for ${P.company.period} is <b>${PO.money(h.pay.net)}</b>, ${diff >= 0 ? 'more' : 'less'} than last time by ${PO.money(Math.abs(Math.round(diff * 100) / 100))}. Here’s why:</p>
      <div class="as-block" style="padding:4px 12px">${P.why.map((w) => html`<div class="row t-sm" style="padding:7px 0;border-bottom:1px solid var(--border)"><span class="grow">${w.label}</span><b class="tnum">${signed(Math.round(w.v * 100) / 100, m)}</b></div>`)}</div>
      <div class="row mt-8"><${PO.Button} size="sm" kind="primary" href=${PO.href('my-pay')}>Open payslip</${PO.Button}></div>`;
  }

  function MyShiftAnswer({ P }) {
    const h = P.hero, s = PO.shiftOf(h.shift);
    const tonight = s.from >= P.company.nowMin || s.from > s.to;
    return html`<p>Your next shift is <b>${tonight ? 'tonight' : 'tomorrow'}, ${s.label.toLowerCase()} (${s.time})</b> at ${PO.site(h.site).name}${h.post ? `, ${h.post}` : ''}. No swaps or ${leaveWord(P)} on it.</p>
      <div class="row"><${PO.Button} size="sm" href=${PO.href('my-time')}>See my week</${PO.Button}><${PO.Button} size="sm" kind="ghost" onClick=${() => PO.toast('Swap request opened. Pick a colleague on the My time page.', { icon: 'ArrowLeftRight' })}>Ask for a swap</${PO.Button}></div>`;
  }

  /** How many records an answer drew on: shown as short provenance instead of step-by-step theatre. */
  const recordsFor = (P, kind) => {
    const site = PO.site(P.cover.site);
    return ({ cover: (site ? site.staff : 20) + 3, late: P.people.length, rule: P.people.length + 1, leaveQ: P.leaveTypes.length + 1, myLeave: P.leaveTypes.length + 1, payroll: P.people.length * 2, headcount: P.payHistory.length + P.exits.length, otRisk: 12, myPay: 2, myShift: 1 })[kind] || 0;
  };

  /* ---------- message ---------- */
  function AiMessage({ m, P, role, viewer, busy, ask, setDraft, talk }) {
    const [fb, setFb] = PO.useCoState('assistant.fb', {});
    const [open, setOpen] = useState(false);
    const steps = STEPS(P, m.kind);
    const running = m.pending;
    const at = running ? busy : steps.length;
    const sources = SOURCES(P, m.kind);
    const body = () => {
      switch (m.kind) {
        case 'cover': return html`<${CoverAnswer} P=${P} />`;
        case 'late': return html`<${LateAnswer} P=${P} role=${role} viewer=${viewer} />`;
        case 'rule': return html`<${RuleAnswer} P=${P} setDraft=${setDraft} />`;
        case 'leaveQ': return html`<${LeaveAnswer} P=${P} />`;
        case 'myLeave': return html`<${LeaveAnswer} P=${P} me />`;
        case 'payroll': return html`<${PayrollAnswer} P=${P} />`;
        case 'headcount': return html`<${HeadcountAnswer} P=${P} />`;
        case 'otRisk': return html`<${OtRiskAnswer} P=${P} viewer=${viewer} />`;
        case 'myPay': return html`<${MyPayAnswer} P=${P} />`;
        case 'myShift': return html`<${MyShiftAnswer} P=${P} />`;
        case 'human': { if (role === 'admin') return html`<p>I’ve passed this conversation to People OS support.</p><div class="as-block row"><${PO.Avatar} name="Ananya Rao" /><div class="grow"><b class="w-600">Ananya Rao</b><div class="faint t-sm">Customer success at People OS. Replies in about 15 min.</div><div class="t-sm mt-4">She can see this conversation, nothing else. Case <span class="mono">CS-48213</span>.</div></div></div>`; const hr = PO.person(P.hrId); return html`<p>I’ve passed this conversation to a person.</p><div class="as-block row"><${PO.Avatar} p=${hr} /><div class="grow"><b class="w-600">${hr.name}</b><div class="faint t-sm">${hr.title}. Usually replies within 2 h.</div><div class="t-sm mt-4">They’ll reply here and by email. Ticket <span class="mono">HD-1561</span> is open.</div></div></div>`; }
        case 'denied': { const sup = PO.person(P.hero.supervisor) || PO.person(P.hero.manager); return html`<p>I can only answer questions about you: your pay, ${leaveWord(P)}, shifts and documents. For team or company questions, ask ${sup ? sup.name : 'your supervisor'}.</p><div class="as-prompts">${myChips(P).map((c) => html`<button class="as-prompt" onClick=${() => ask(c)}>${c}<${PO.Icon} n="ArrowUpRight" size=${13} /></button>`)}</div>`; }
        default: return html`<p>I don’t have an answer for “${m.q}” yet. Here’s what I can do${role === 'employee' ? ' for you' : ''}:</p><div class="as-prompts">${(role === 'employee' ? myChips(P) : [P.ai.cover, P.ai.late, P.ai.rule, P.ai.leaveQ, 'Why is payroll up this period?', 'Headcount and attrition this year']).map((c) => html`<button class="as-prompt" onClick=${() => ask(c)}>${c}<${PO.Icon} n="ArrowUpRight" size=${13} /></button>`)}</div>`;
      }
    };
    const n = recordsFor(P, m.kind);
    if (running) return html`<div class="as-wait">Reading records…</div>`;
    return html`<div class="as-ai"><div class="as-ai-b">
      ${body()}
      ${m.kind !== 'human' && (n || sources.length) ? html`<div class="as-prov">${n ? `Looked at ${PO.plural(n, 'record')}` : 'Used'}${sources.length ? ' in ' : '.'}${sources.map(([, l, to], i) => html`${i ? (i === sources.length - 1 ? ' and ' : ', ') : ''}<a onClick=${() => (to ? PO.go(to) : PO.toast(`Opened ${l}`, { icon: 'BookOpen' }))} title=${l}>${l}</a>`)}${sources.length ? '.' : ''}</div>` : null}
      ${m.kind !== 'human' ? html`<div class="as-fb"><${PO.IconButton} size="sm" icon="ThumbsUp" title="Helpful" cls=${fb[m.id] === 'up' ? 'on' : ''} onClick=${() => { setFb({ ...fb, [m.id]: 'up' }); PO.toast('Thanks. This helps tune answers for your company.', { icon: 'ThumbsUp' }); }} /><${PO.IconButton} size="sm" icon="ThumbsDown" title="Not helpful" cls=${fb[m.id] === 'down' ? 'on' : ''} onClick=${() => { setFb({ ...fb, [m.id]: 'down' }); PO.toast('Noted. A person will review this answer.', { icon: 'ThumbsDown' }); }} /><${PO.IconButton} size="sm" icon="Copy" title="Copy" onClick=${() => PO.toast('Answer copied')} /><button class="btn ghost sm right" onClick=${talk}>${role === 'admin' ? 'Talk to support' : `Talk to ${PO.person(P.hrId).first}`}</button></div>` : null}
    </div></div>`;
  }

  const myChips = (P) => [`How much ${leaveWord(P)} do I have?`, 'Why is my pay different this time?', 'When is my next shift?'];
  const chipsFor = (P, role) => (role === 'employee' ? myChips(P) : role === 'manager' ? [P.ai.cover, P.ai.late, 'Who on my team is close to overtime?', P.ai.leaveQ] : [P.ai.cover, P.ai.late, P.ai.rule, P.ai.leaveQ, 'Why is payroll up this period?', 'Headcount and attrition this year']);

  /* ---------- Ask tab ---------- */
  function AskTab({ P, role, viewer, thread, setThread, draft, setDraft, run }) {
    const ref = useRef();
    const [busy, setBusy] = useState(0);
    const pending = thread.find((m) => m.pending);
    useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [thread.length, busy, !!pending]);
    useEffect(() => {
      if (!pending) return;
      const t = setTimeout(() => setThread((th) => th.map((m) => (m.id === pending.id ? { ...m, pending: false } : m))), 550);
      return () => clearTimeout(t);
    }, [pending && pending.id]);
    const talk = () => setThread((t) => [...t, { id: nid(), who: 'me', text: 'Talk to a person' }, { id: nid(), who: 'ai', kind: 'human' }]);
    const prompts = role === 'employee'
      ? [[myChips(P)[0], 'Balances and how to apply'], [myChips(P)[1], 'Line-by-line against your last payslip'], [myChips(P)[2], 'From the published roster'], ['Talk to HR', PO.person(P.hrId).name]]
      : [[P.ai.cover, 'Ranked by rest, training and overtime cost'], [P.ai.late, 'Clock-ins this ' + periodWord(P) + ', by site'], role === 'manager' ? ['Who on my team is close to overtime?', 'This week, scheduled shifts included'] : [P.ai.rule, 'Drafts the rule and prices it on last ' + periodWord(P)], [P.ai.leaveQ, 'From the leave ledger, with the policy clause'], ...(role === 'admin' ? [['Why is payroll up this period?', `${P.company.period} against the previous run`]] : [])];
    return html`<div class="as-body" ref=${ref}>
      ${thread.length ? null : html`<div class="as-hello"><h4>What do you need, ${viewer.first}?</h4><div class="faint t-sm mt-4">${role === 'employee' ? 'Answers use only your own records.' : role === 'manager' ? `Scoped to your team of ${(P.byManager[viewer.id] || []).length}+ people.` : `Scoped to all ${P.people.length} people at ${P.company.short}.`} Changes always wait for your OK.</div>
        <div class="as-prompts">${prompts.map(([q, sub]) => html`<button class="as-prompt" onClick=${() => (q === 'Talk to HR' ? talk() : run(q))}><span class="grow" style="min-width:0"><span class="w-500">${q}</span><small>${sub}</small></span><${PO.Icon} n="ArrowUpRight" size=${13} /></button>`)}</div></div>`}
      ${thread.map((m) => (m.who === 'me' ? html`<div class="as-me"><div>${m.text}</div></div>` : html`<${AiMessage} key=${m.id} m=${m} P=${P} role=${role} viewer=${viewer} busy=${busy} ask=${run} setDraft=${setDraft} talk=${talk} />`))}
    </div>
    <div class="as-foot">
      <form class="as-input" onSubmit=${(e) => { e.preventDefault(); if (draft.trim() && !pending) { run(draft.trim()); setDraft(''); } }}>
        <textarea rows="1" placeholder=${role === 'employee' ? 'Ask about your pay, leave or shifts…' : 'Ask, or tell People OS what to do…'} value=${draft} onInput=${(e) => setDraft(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (draft.trim() && !pending) { run(draft.trim()); setDraft(''); } } }}></textarea>
        <${PO.IconButton} icon="Paperclip" size="sm" title="Attach a file" onClick=${() => PO.toast('Attach a payslip, policy or spreadsheet to ask about it', { icon: 'Paperclip' })} />
        <button class="btn primary sm" type="submit" disabled=${!draft.trim() || !!pending} title="Send" style="width:26px;padding:0"><${PO.Icon} n="ArrowUp" size=${14} /></button>
      </form>
    </div>`;
  }

  /* ---------- Agents tab ---------- */
  function agentsFor(P, decided, cover, state) {
    const chan = chanWord(P);
    const a1 = P.approvals[0], a2 = P.approvals[1];
    const p1 = PO.person(a1.who), p2 = PO.person(a2.who);
    const fnf = P.exits.filter((e) => e.status === 'F&F due');
    const cp = PO.person(P.cover.who);
    const sup = PO.person(P.hero.manager);
    const docs = P.people.reduce((t, p) => t + p.docs.filter((d) => d.status === 'Missing' || d.status === 'Expired').length, 0);
    const opens = P.roster.opens.length;
    return [
      { key: 'punch', icon: 'Fingerprint', name: 'Missed-punch fixer', desc: `Matches missing clock-ins and clock-outs against ${P.id === 'in' ? 'gate registers' : P.id === 'us' ? 'oven and POS logs' : 'site pass logs'} and supervisor confirmations, then drafts the correction.`, last: '07:58', week: 14, saved: 2.1,
        drafts: [a1, a2].filter((a) => !decided[a.id]).map((a) => ({ id: a.id, t: `${PO.person(a.who).name}: ${a.ask.toLowerCase()}`, s: a.title, approve: 'approvals' })),
        log: [[`Drafted correction for ${p1 ? p1.name : ''}`, '07:58'], [`Drafted correction for ${p2 ? p2.name : ''}`, '07:58'], ['Auto-closed 4 punches that matched the device log exactly', 'Yesterday']] },
      { key: 'chaser', icon: 'BellRing', name: 'Approval chaser', desc: `Nudges approvers by email and SMS when a request waits 24 h and escalates to you at 48 h. Never approves anything itself.`, last: '08:00', week: 9, saved: 1.2, drafts: [],
        log: [[`Reminded ${sup ? sup.name : 'a supervisor'} about 2 ${leaveWord(P)} requests by email`, '08:00'], ['Escalated a missed punch to you after 48 h', '08:00'], ['Sent 6 reminders this week; 5 got a decision', 'Mon']] },
      { key: 'fnf', icon: 'FileSignature', name: P.id === 'in' ? 'F&F drafter' : 'Final pay drafter', desc: P.id === 'in' ? 'Drafts full and final settlements inside the 2-working-day rule: unpaid salary, leave encashment, recoveries and gratuity check.' : P.id === 'us' ? 'Drafts final pay by the Texas Payday Law deadline, with PTO payout per policy and COBRA notice.' : 'Drafts final pay with holiday owed and the P45, ready for the next pay run.', last: 'Yesterday', week: fnf.length + 1, saved: 1.5,
        drafts: fnf.filter((e) => !(state.agentApproved || {})['fnf:' + e.id]).map((e) => ({ id: 'fnf:' + e.id, t: `${e.name}: ${PO.money(e.settlement)}`, s: `Last day ${PO.date(e.lastDay, { short: true })}, ${e.reason.toLowerCase()}` })),
        log: [[`Drafted ${P.id === 'in' ? 'F&F' : 'final pay'} for ${fnf.map((e) => e.name).join(' and ') || 'leavers'}`, 'Yesterday'], [P.id === 'in' ? 'Gratuity check: under 5 years, not due' : P.id === 'us' ? 'PTO payout: not owed under handbook §4.6' : 'Prepared P45 parts 1A to 3', 'Yesterday']] },
      { key: 'docs', icon: 'FileSearch', name: 'Document chaser', desc: 'Emails and texts people about missing or expiring documents with a secure upload link to the employee portal, then files each upload against their profile for HR to verify.', last: '07:30', week: 22, saved: 1.4, drafts: [],
        log: [[`Asked ${Math.min(docs, 17)} people for missing documents by email and SMS`, '07:30'], ['Filed 3 documents received overnight, waiting for your check', '06:10'], [`Second reminder to ${P.onboarding[0].name}`, 'Mon']] },
      { key: 'roster', icon: 'CalendarPlus', name: 'Roster gap filler', desc: 'Watches sick calls, no-shows and open shifts, and proposes cover from people who are rested, trained for the site and won’t tip into overtime.', last: '07:41', week: 6 + opens, saved: 0.9,
        drafts: cover ? [] : [{ id: 'cover', t: `${P.cover.cands[0].name} to cover ${cp ? cp.name : ''} tonight`, s: `${PO.site(P.cover.site).name}. ${P.cover.cands[0].why.split(' · ').join(', ')}`, cover: true }],
        log: [[cover ? `Confirmed ${cover.name} for tonight (approved by you)` : `Proposed ${P.cover.cands[0].name} to cover ${cp ? cp.first : ''}`, '07:41'], [`Filled ${opens} open shifts at ${PO.site(P.roster.site).name} from the swap pool`, 'Mon']] },
    ];
  }

  function AgentsTab({ P }) {
    const { state } = PO.useStore();
    const [cfg, setCfg] = PO.useCoState('assistant.agents', { off: {}, undone: {}, approved: {} });
    const [decided, setDecided] = PO.useCoState('approvals.decided', {});
    const [cover, setCover] = PO.useCoState('assistant.cover', null);
    const [openLog, setOpenLog] = useState({});
    const agents = agentsFor(P, decided, cover, { agentApproved: cfg.approved });
    const on = agents.filter((a) => !cfg.off[a.key]);
    const waiting = on.reduce((t, a) => t + a.drafts.length, 0);
    const approve = (a, d) => {
      if (d.approve === 'approvals') { setDecided((x) => ({ ...x, [d.id]: 'approved' })); PO.toast(`Approved: ${d.t}`, { action: { label: 'Undo', run: () => setDecided((x) => { const n = { ...x }; delete n[d.id]; return n; }) } }); return; }
      if (d.cover) { setCover({ ...P.cover.cands[0], rank: 0 }); PO.toast(`${P.cover.cands[0].name} confirmed for tonight`, { action: { label: 'Undo', run: () => setCover(null) } }); return; }
      setCfg({ ...cfg, approved: { ...cfg.approved, [d.id]: true } });
      PO.toast(`Approved: ${d.t}. Sent to payroll.`, { action: { label: 'Undo', run: () => setCfg((c) => { const n = { ...c.approved }; delete n[d.id]; return { ...c, approved: n }; }) } });
    };
    return html`<div class="as-body">
      <div class="as-sum">${on.length} of ${agents.length} agents running, ${waiting} drafts waiting for you, ${on.reduce((t, a) => t + a.saved, 0).toFixed(1)} h saved this week. Agents only draft: every action waits for approval, is logged and can be undone. Owner: ${PO.person(P.hrId).name}.</div>
      <div class="as-agents">${agents.map((a) => { const off = cfg.off[a.key]; return html`<div class=${'as-agent ' + (off ? 'off' : '')}>
        <div class="as-agent-h">
          <div style="min-width:0"><b class="w-600">${a.name}</b><div class="muted t-sm" style="margin-top:2px;line-height:1.45">${a.desc}</div>
            <div class="as-agent-meta">${off ? 'Paused.' : `Last ran at ${a.last}.`} ${a.week} actions this week.</div></div>
          <${PO.Switch} on=${!off} onChange=${(v) => { setCfg({ ...cfg, off: { ...cfg.off, [a.key]: !v } }); PO.toast(`${a.name} ${v ? 'resumed' : 'paused'}`, { icon: v ? 'Play' : 'Pause' }); }} />
        </div>
        ${!off ? a.drafts.map((d) => html`<div class="as-draft"><span class="dot"></span><div class="grow" style="min-width:0"><div class="w-500 ellipsis t-sm">${d.t}</div><div class="faint t-xs ellipsis">${d.s}</div></div><${PO.Button} size="sm" kind="ghost" onClick=${() => PO.go(d.approve || (d.cover ? 'roster' : 'offboarding'))}>Review</${PO.Button}><${PO.Button} size="sm" kind="primary" onClick=${() => approve(a, d)}>Approve</${PO.Button}></div>`) : null}
        <div class="as-log"><button class="btn ghost sm" style="padding:0;height:24px;color:var(--text-3)" onClick=${() => setOpenLog({ ...openLog, [a.key]: !openLog[a.key] })}><${PO.Icon} n=${openLog[a.key] ? 'ChevronDown' : 'ChevronRight'} size=${12} />Activity log</button>
          ${openLog[a.key] ? a.log.map(([t, when], i) => { const k = a.key + i; const un = cfg.undone[k]; return html`<div class=${'as-log-i ' + (un ? 'undone' : '')}><${PO.Icon} n=${un ? 'Undo2' : 'Check'} size=${12} style=${`color:var(--${un ? 'text-3' : 'green'});flex:none`} /><span class="t grow">${t}</span><span class="faint t-xs tnum">${when}</span>${un ? html`<span class="faint t-xs">Undone</span>` : html`<button class="btn ghost sm" style="height:22px;padding:0 6px" onClick=${() => { setCfg({ ...cfg, undone: { ...cfg.undone, [k]: true } }); PO.toast('Undone and logged in the audit trail', { icon: 'Undo2' }); }}>Undo</button>`}</div>`; }) : null}
        </div>
      </div>`; })}</div>
      <div class="mt-12"><${PO.Button} size="sm" kind="ghost" onClick=${() => PO.go('settings')}>Set up a new agent</${PO.Button}></div>
    </div>`;
  }

  /* ---------- History tab ---------- */
  function HistoryTab({ P, role, viewer, run, archived }) {
    const [q, setQ] = useState('');
    const base = role === 'employee'
      ? [[myChips(P)[1], 'Yesterday', 3], [myChips(P)[0], 'Fri', 2], ['Can I get a salary certificate?', '24 Sep', 4]]
      : [[P.ai.late, 'Yesterday', 4], ['Draft a warning letter for repeated late arrival', 'Mon', 6], [P.ai.leaveQ, 'Fri', 2], ['Compare overtime this period with last', '2 Oct', 5], ['Which sites have open shifts next week?', '29 Sep', 3], ['Headcount and attrition this year', '24 Sep', 2]];
    const all = [...archived.map((a) => [a.title, a.when, a.n, true]), ...base];
    const list = q ? all.filter((x) => x[0].toLowerCase().includes(q.toLowerCase())) : all;
    return html`<div class="as-body">
      <div style="margin-bottom:12px"><${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search conversations" width=${408} /></div>
      ${list.length ? html`<div class="as-hists">${list.map(([t, when, n]) => html`<div class="as-hist" onClick=${() => run(t, true)}><div class="grow" style="min-width:0"><div class="w-500 ellipsis">${t}</div><div class="faint t-xs">${PO.plural(n, 'message')}</div></div><span class="faint t-xs tnum">${when}</span></div>`)}</div>` : html`<${PO.Empty} icon="SearchX" title="No conversations match" />`}
      <div class="faint t-xs mt-12">Kept for 90 days, visible only to you.</div>
    </div>`;
  }

  /* ---------- panel ---------- */
  function AssistantPanel() {
    const P = PO.P();
    const { state, dispatch } = PO.useStore();
    const role = state.role;
    const viewer = PO.viewer();
    const [tab, setTab] = PO.useCoState('assistant.tab', 'ask');
    const [thread, setThread] = PO.useCoState('assistant.thread.' + role, []);
    const [archived, setArchived] = PO.useCoState('assistant.history.' + role, []);
    const [draft, setDraft] = useState('');
    const [decided] = PO.useCoState('approvals.decided', {});
    const [cover] = PO.useCoState('assistant.cover', null);
    const [cfg] = PO.useCoState('assistant.agents', { off: {}, undone: {}, approved: {} });
    const close = () => dispatch({ type: 'set', patch: { assistant: null } });
    useEffect(() => { setThread((t) => t.map((m) => (m.pending ? { ...m, pending: false } : m))); }, []);
    useEffect(() => { const k = (e) => e.key === 'Escape' && !document.querySelector('.modal') && close(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
    const run = (text, fresh) => {
      setTab('ask');
      const kind = intent(P, text, role);
      const msgs = [{ id: nid(), who: 'me', text }, { id: nid(), who: 'ai', kind, q: text, pending: true }];
      setThread((t) => (fresh ? msgs : [...t.map((m) => ({ ...m, pending: false })), ...msgs]));
    };
    const prompt = state.assistant && state.assistant.prompt;
    useEffect(() => { if (prompt) { run(prompt); dispatch({ type: 'set', patch: { assistant: {} } }); } }, [prompt]);
    const newChat = () => { if (thread.length) setArchived((a) => [{ title: thread[0].text, when: 'Today', n: thread.length }, ...a]); setThread([]); setTab('ask'); };
    const waiting = agentsFor(P, decided, cover, { agentApproved: cfg.approved }).filter((a) => !cfg.off[a.key]).reduce((t, a) => t + a.drafts.length, 0);
    const scope = role === 'employee' ? 'Only your records' : role === 'manager' ? `Your team at ${PO.site(viewer.site).name}` : `All ${P.people.length} people at ${P.company.short}`;
    return html`<aside class="as-panel" role="dialog" aria-label="Ask People OS">
      <div class="as-head"><div class="grow" style="min-width:0"><b class="w-600">${role === 'employee' ? 'Ask HR' : 'Ask AI'}</b><span class="faint t-sm" style="margin-left:8px">${scope}</span></div>
        <${PO.IconButton} icon="SquarePen" title="New conversation" onClick=${newChat} /><${PO.IconButton} icon="X" title="Close" onClick=${close} /></div>
      <div class="as-tabs">${(role === 'employee' ? [['ask', 'Ask'], ['history', 'History']] : [['ask', 'Ask'], ['agents', 'Agents', waiting || null], ['history', 'History']]).map(([k, l, c]) => html`<button class="tab" aria-selected=${tab === k} onClick=${() => setTab(k)}>${l}${c ? html`<span class="nav-count">${c}</span>` : null}</button>`)}</div>
      ${tab === 'agents' && role !== 'employee' ? html`<${AgentsTab} P=${P} />` : tab === 'history' ? html`<${HistoryTab} P=${P} role=${role} viewer=${viewer} run=${run} archived=${archived} />` : html`<${AskTab} P=${P} role=${role} viewer=${viewer} thread=${thread} setThread=${setThread} draft=${draft} setDraft=${setDraft} run=${run} />`}
    </aside>`;
  }

  PO.panels.assistant = AssistantPanel;
})();
