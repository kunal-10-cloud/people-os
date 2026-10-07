/* People OS: Talent. Hiring (jobs, kanban pipeline, candidates, offers, interview invites, job boards, analytics),
   Performance (review cycle, 9-box, goals, 1:1s, feedback, calibration), Learning (courses, completion by site,
   certifications) and Engagement (announcements, pulse survey, recognition, celebrations). */
(function () {
  const PO = window.PO;
  const { html, useState, useMemo, useEffect } = PO;
  const { Icon, Avatar, Who, Badge, Status, Button, IconButton, Menu, Tabs, Segmented, Switch, PageHeader, Card, Stat, Empty, Callout, Progress, KV, Timeline, Steps, Field, Select, Drawer, Modal, DataTable, MonthCal, AvatarStack } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .tl-kan{display:grid;grid-template-columns:repeat(5,minmax(200px,1fr));gap:12px;overflow-x:auto}
  .tl-col{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-lg);display:flex;flex-direction:column;min-width:0}
  .tl-col-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;font-weight:600;font-size:13px}
  .tl-col-h i{width:7px;height:7px;border-radius:50%;flex:none;background:var(--text-3)}
  .tl-col-h .n{color:var(--text-3);font-weight:500;font-variant-numeric:tabular-nums}
  .tl-col-b{padding:0 8px 8px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;max-height:max(360px,calc(100vh - 420px))}
  .tl-cc{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:9px 10px;cursor:pointer;display:flex;flex-direction:column;gap:4px;transition:border-color .12s}
  .tl-cc:hover{border-color:var(--border-strong)}
  .tl-cc.sel{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}
  .tl-cc .tl-hov{opacity:0;transition:opacity .1s}
  .tl-cc:hover .tl-hov,.tl-cc.sel .tl-hov,.tl-kan.picking .tl-hov{opacity:1}
  .tl-cc .check{margin:0}
  .tl-empty{color:var(--text-3);font-size:12px;text-align:center;padding:20px 8px;border:1px dashed var(--border);border-radius:var(--r)}
  .tl-score{font-variant-numeric:tabular-nums;font-size:12px;font-weight:550;color:var(--text-2)}
  .tl-score.r{color:var(--red)}
  .tl-9{display:grid;grid-template-columns:22px repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(118px,auto)) 22px;gap:8px}
  .tl-9 .ax{display:grid;place-items:center;color:var(--text-3);font-size:11.5px;font-weight:500}
  .tl-9 .ax.v{writing-mode:vertical-rl;transform:rotate(180deg)}
  .tl-box{border-radius:var(--r-lg);padding:10px 12px;border:1px solid var(--border);background:var(--surface);cursor:pointer;display:flex;flex-direction:column;gap:6px;min-width:0}
  .tl-box:hover{border-color:var(--border-strong)} .tl-box.on{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
  .tl-box.g{background:var(--surface-2)}
  .tl-box b.n{font-family:var(--num);font-size:24px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.1}
  .tl-feed{display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border)} .tl-feed:last-child{border-bottom:none}
  .tl-react{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 8px;border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;color:var(--text-2)}
  .tl-react:hover{background:var(--hover)} .tl-react.on{border-color:var(--border-strong);color:var(--text);font-weight:550}
  .tl-letter{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:22px 24px;font-size:12.5px;line-height:1.6}
  .tl-letter h4{font-size:15px;margin:0 0 2px}
  .tl-wa{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;display:flex;flex-direction:column;gap:8px}
  .tl-wa-from{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--text-2)}
  .tl-wa .bub{align-self:flex-start;max-width:92%;background:var(--surface);color:var(--text);border:1px solid var(--border);padding:9px 11px 6px;border-radius:12px 12px 12px 4px;font-size:12.5px;line-height:1.5;white-space:pre-line}
  .tl-wa small{display:block;text-align:right;font-size:10px;opacity:.6;margin-top:2px}
  .tl-gauge text{font-family:var(--num)}
  .tl-dots{display:inline-flex;gap:3px} .tl-dots i{width:8px;height:8px;border-radius:50%;background:var(--surface-3)} .tl-dots i.on{background:var(--text-2)}
  .tl-star{background:none;border:none;padding:2px;cursor:pointer;color:var(--border-strong)} .tl-star.on{color:var(--amber-solid)}
  .tl-mono{width:28px;height:28px;border-radius:var(--r);display:grid;place-items:center;font-weight:600;font-size:12px;flex:none;background:var(--surface-3);color:var(--text-2)}
  .tl-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:16px}
  .tl-facts > div{padding:10px 14px;border-left:1px solid var(--border);min-width:0} .tl-facts > div:first-child{border-left:none}
  .tl-facts span{display:block;font-size:12px;color:var(--text-3)} .tl-facts b{font-weight:600}
  .tl-sub{font-size:12px;font-weight:600;color:var(--text-2);margin:20px 0 8px}
  .tl-row{display:flex;align-items:center;gap:12px;padding:9px 16px;border-bottom:1px solid var(--border);min-width:0} .tl-row:last-child{border-bottom:none}
  .tl-row.click{cursor:pointer} .tl-row.click:hover{background:var(--hover)}
  .tl-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:var(--r);border:1px solid var(--border);background:var(--surface);cursor:pointer;font-size:12.5px;color:var(--text-2)}
  .tl-chip[aria-pressed='true']{border-color:var(--ink);color:var(--text);font-weight:550;box-shadow:inset 0 0 0 1px var(--ink)}
  .tl-split{display:flex;height:8px;border-radius:4px;overflow:hidden;gap:2px}
  .tl-col{border-top:2px solid var(--acc,var(--border))}
  .tl-col-h .chip-ic{width:22px;height:22px;border-radius:6px}
  .tl-acc-blue{--acc:var(--blue-solid)} .tl-acc-violet{--acc:var(--violet)} .tl-acc-amber{--acc:var(--amber-solid)} .tl-acc-teal{--acc:var(--teal)} .tl-acc-green{--acc:var(--green-solid)} .tl-acc-red{--acc:var(--red-solid)} .tl-acc-rose{--acc:var(--rose)}
  .tl-cc .tl-top{display:flex;align-items:center;gap:10px;min-width:0}
  .tl-cc .tl-top .av{width:40px;height:40px}
  .tl-cc .tl-top b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tl-cc .tl-top small{display:block;color:var(--text-3);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tl-ring{flex:none;display:block}
  .tl-ring text{font-family:var(--num);font-size:11px;font-weight:600;fill:var(--text)}
  .tl-box{border-top:2px solid var(--acc,var(--border));background:color-mix(in srgb,var(--acc,var(--surface)) 6%,var(--surface))}
  .tl-box.g{background:color-mix(in srgb,var(--acc,var(--surface)) 6%,var(--surface))}
  .tl-box .chip-ic{width:22px;height:22px;border-radius:6px}
  .tl-pair{position:relative;width:46px;height:46px;flex:none}
  .tl-pair .av.lg{position:absolute;left:0;top:0}
  .tl-pair .av.sm{position:absolute;right:0;bottom:0;box-shadow:0 0 0 2px var(--surface)}
  .tl-val{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px 0 6px;border-radius:12px;font-size:12px;font-weight:550;background:var(--amber-soft);color:var(--amber)}
  .tl-courses{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .tl-course{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:10px;min-width:0}
  .tl-course:hover{border-color:var(--border-strong)}
  .tl-course .chip-ic{width:34px;height:34px;border-radius:10px}
  .tl-course .bar{height:6px;border-radius:3px;background:var(--surface-3);overflow:hidden} .tl-course .bar i{display:block;height:100%;border-radius:3px;background:var(--acc)}
  .tl-course .pc{font-family:var(--num);font-size:20px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
  .tl-cel{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
  .tl-cel .pcard{cursor:default}
  .tl-cel .pcard-cover{display:flex;justify-content:flex-end;align-items:flex-start;padding:8px}
  .tl-cel .pcard-cover .chip-ic{width:24px;height:24px;background:var(--surface)}
  @media (max-width:1100px){.tl-courses{grid-template-columns:1fr}}
  </style>`);

  /* ---------- shared helpers ---------- */
  const TODAY = () => PO.TODAY;
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
  const STAGE_META = { Applied: ['Inbox', 'blue'], Screening: ['ListFilter', 'violet'], Interview: ['MessagesSquare', 'amber'], Offer: ['FileSignature', 'teal'], Hired: ['BadgeCheck', 'green'] };
  /** Screening score as a small ring: green 80+, amber 65–79, red under 65. */
  function ScoreRing({ v, size = 32 }) {
    const r = size / 2 - 3, c = 2 * Math.PI * r, col = v >= 80 ? 'var(--green-solid)' : v >= 65 ? 'var(--amber-solid)' : 'var(--red-solid)';
    return html`<svg class="tl-ring" width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} role="img" aria-label=${`Screening score ${v}`}><title>Screening score ${v} of 100</title><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--surface-3)" stroke-width="3" /><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${col} stroke-width="3" stroke-linecap="round" stroke-dasharray=${`${(c * v) / 100} ${c}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} /><text x=${size / 2} y=${size / 2 + 4} text-anchor="middle">${v}</text></svg>`;
  }
  const BOARDS = {
    in: [['Apna', 'Free, paid boost ₹999', '#2bb673', 999], ['WorkIndia', '₹1,499 per post', '#f15a29', 1499], ['Naukri', '₹4,000 per post', '#0b59c7', 4000], ['Staff referral', '₹2,000 bonus per hire', '#25a35a', 0], ['Walk-in', 'Gate notice at sites', '#6b7280', 0]],
    us: [['Indeed', 'Sponsored, $5/day', '#2557a7', 5], ['Snagajob', '$89 per post', '#f68b1f', 89], ['Staff referral', '$200 bonus per hire', '#16a34a', 0], ['Walk-in', 'Window sign at cafés', '#6b7280', 0]],
    uk: [['Indeed', 'Sponsored, £4/day', '#2557a7', 4], ['Reed', '£99 per post', '#cc0033', 99], ['Staff referral', '£150 bonus per hire', '#16a34a', 0], ['Walk-in', 'Depot notice board', '#6b7280', 0]],
  };
  const boardNames = (P) => BOARDS[P.id].map((b) => b[0]);
  const shortBoard = (n) => n;
  /** Seeded sources aren't country-aware; map anything foreign onto this country's boards, deterministically. */
  function srcOf(P, s, key) {
    const list = boardNames(P).map(shortBoard);
    if (list.includes(s)) return s;
    if (s === 'Referral') return list.find((x) => /referral/i.test(x));
    if (s === 'Walk-in') return 'Walk-in';
    return list[PO.hueOf(key + s) % (list.length - 1)];
  }
  function teamOf(P, id) { const out = []; const walk = (m) => (P.byManager[m] || []).forEach((x) => { out.push(x); walk(x); }); walk(id); return out; }
  function useScope() {
    const { state } = PO.useStore(); const P = PO.P(); const v = PO.viewer();
    if (state.role === 'manager') { const ids = new Set(teamOf(P, v.id)); return { role: 'manager', people: P.people.filter((p) => ids.has(p.id)), viewer: v }; }
    return { role: state.role, people: P.people, viewer: v };
  }
  const roleKeyOf = (P, title) => Object.keys(P.roles).find((k) => title.toLowerCase().startsWith(P.roles[k].title.toLowerCase().split(' ')[0])) || Object.keys(P.roles).find((k) => !P.roles[k].salary) || Object.keys(P.roles)[0];
  function payFor(P, title) {
    const R = P.roles[roleKeyOf(P, title)];
    if (P.id === 'in') { const g = (R.basic || 14000) + (R.hra || 4000) + (R.special || 2000); const er = Math.round(Math.min(R.basic || 14000, 15000) * 0.13 + (g <= 21000 ? g * 0.0325 : 0)); return { gross: g, ctc: (g + er) * 12, label: `${PO.money(g)} per month`, sub: `CTC ${PO.money((g + er) * 12)} a year` }; }
    if (R.rate) return { rate: R.rate, label: `${PO.money(R.rate, { cents: true })} an hour`, sub: P.id === 'us' ? 'Paid bi-weekly, overtime after 40 h' : 'Paid four-weekly, pension auto-enrolment' };
    return { rate: 0, label: `${PO.money(R.salary)} per period`, sub: 'Salaried' };
  }
  const EMPLOYERS = { in: ['SIS Security', 'G4S Secure Solutions', 'Checkmate Services', 'Topsgrup', 'BVG India', 'Securitas India', 'Sodexo FM', 'Peregrine Guarding'], us: ['Starbucks', 'Panera Bread', 'H-E-B Bakery', 'Whole Foods Market', 'Tiff’s Treats', 'Epoch Coffee', 'Kerbey Lane Café'], uk: ['OCS Group', 'Mitie', 'ISS UK', 'Sodexo UK', 'Atalian Servest', 'Churchill Services', 'Bidvest Noonan'] };
  function candInfo(P, c) {
    const r = PO.seeded('cand' + P.id + c.id);
    const emp = r.shuffle(EMPLOYERS[P.id]);
    const city = r.pick(P.vocab.cities);
    const phone = P.vocab.phone(r);
    const hist = c.exp > 0 ? [{ at: emp[0], role: c.exp > 4 ? 'Senior ' + jobTitleShort(P, c) : jobTitleShort(P, c), yrs: Math.max(1, Math.round(c.exp * 0.6)) }, ...(c.exp > 2 ? [{ at: emp[1], role: jobTitleShort(P, c), yrs: Math.max(1, c.exp - Math.round(c.exp * 0.6)) }] : [])] : [];
    const notice = r.pick(P.id === 'in' ? ['Immediate', '7 days', '15 days', '30 days'] : ['Immediate', '1 week', '2 weeks']);
    const skills = r.shuffle(P.id === 'in' ? ['Access control', 'Patrolling', 'CCTV monitoring', 'Fire safety', 'Visitor register', 'First aid', 'Night shifts', 'Two-wheeler licence'] : P.id === 'us' ? ['Espresso bar', 'Latte art', 'Food handler card', 'Cash handling', 'Opening shifts', 'Lamination', 'Sourdough', 'Forklift'] : ['Floor scrubber', 'COSHH aware', 'Infection control', 'Night shifts', 'Window cleaning', 'Own transport', 'DBS ready', 'Manual handling']).slice(0, 4);
    const crit = P.id === 'in' ? ['Alertness & discipline', 'Communication', 'Fitness', 'Shift flexibility'] : P.id === 'us' ? ['Hospitality', 'Speed & accuracy', 'Teamwork', 'Availability'] : ['Attention to detail', 'Reliability', 'Communication', 'Availability'];
    const inStage = Math.max(0, Math.min(days(c.applied, PO.TODAY), r.int(0, 9)));
    const scorecards = STAGES.indexOf(c.stage) >= 2 ? [{ by: c.hm, kind: 'In-person interview', on: PO.addDays(PO.TODAY, -r.int(1, 6)), rec: c.score >= 80 ? 'Strong yes' : c.score >= 68 ? 'Yes' : 'Maybe', marks: crit.map((k) => [k, Math.max(2, Math.min(5, Math.round(c.score / 20 + (r.rnd() - 0.5) * 1.6)))]), note: c.score >= 80 ? 'Calm under pressure, answered every scenario question well. Can start on short notice.' : c.score >= 68 ? 'Good attitude. Needs a buddy for the first two weeks.' : 'Unsure about night shifts. Second opinion needed.' }] : [];
    const expPay = P.id === 'in' ? PO.money(r.int(17, 24) * 1000) + ' per month' : PO.money(r.int(P.id === 'us' ? 14 : 12, P.id === 'us' ? 20 : 15) + r.pick([0, 0.5]), { cents: true }) + ' an hour';
    const km = r.int(2, 18);
    const screen = P.id === 'in' ? [['Okay with night shifts?', c.score > 60 ? 'Yes' : 'Only sometimes', c.score > 60], ['Distance from site', km + ' km', km < 12], ['Police verification', c.score > 70 ? 'Has a recent one' : 'Will apply', c.score > 70], ['Aadhaar and PAN ready', 'Yes', true]]
      : P.id === 'us' ? [['Weekend availability', c.score > 62 ? 'Sat and Sun' : 'Sundays only', c.score > 62], ['Commute', km + ' mi', km < 12], ['Food handler card', c.score > 72 ? 'Valid to 2027' : 'Will get one', c.score > 72], ['Authorised to work in the US', 'Yes', true]]
        : [['Right to work in the UK', 'Share code provided', true], ['Night shifts', c.score > 60 ? 'Yes' : 'Days only', c.score > 60], ['Distance from site', km + ' mi', km < 12], ['DBS check', c.score > 70 ? 'On update service' : 'Needs a new one', c.score > 70]];
    return { km, screen, city, phone, hist, notice, skills, scorecards, inStage, expPay, email: c.name.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.') + r.int(1, 99) + '@' + (P.id === 'in' ? 'gmail.com' : P.id === 'us' ? 'gmail.com' : 'outlook.com') };
  }
  const jobTitleShort = (P, c) => (P.jobs.find((j) => j.id === c.job) || {}).title || 'Staff';

  /* =====================================================================
     HIRING
     ===================================================================== */
  function useHiring() {
    const P = PO.P();
    const [stages, setStages] = PO.useCoState('hiring.stages', {});
    const [added, setAdded] = PO.useCoState('hiring.jobs', []);
    const [closed, setClosed] = PO.useCoState('hiring.closed', {});
    const base = useMemo(() => P.candidates.map((c) => { const j = P.jobs.find((x) => x.id === c.job); return { ...c, source: srcOf(P, c.source, c.id), hm: j.hiringManager }; }), [P.id]);
    const cands = useMemo(() => base.map((c) => (stages[c.id] ? { ...c, stage: stages[c.id] } : c)), [base, stages]);
    const jobs = useMemo(() => [...added, ...P.jobs.map((j) => ({ ...j, sources: [...new Set(j.sources.map((s) => srcOf(P, s, j.id)))] }))].map((j) => ({ ...j, status: closed[j.id] ? 'Closed' : j.status || 'Open' })), [P.id, added, closed]);
    return { P, cands, jobs, stages, setStages, added, setAdded, closed, setClosed };
  }

  function PipeBar({ list }) {
    const n = list.length || 1;
    return html`<div class="row" style="gap:8px"><div class="tl-split" style="flex:1;min-width:90px;background:var(--surface-3)" title=${STAGES.map((s) => `${s}: ${list.filter((c) => c.stage === s).length}`).join(', ')}>${STAGES.map((s, i) => { const k = list.filter((c) => c.stage === s).length; return k ? html`<i style=${`display:block;width:${(k / n) * 100}%;background:var(--chart-1);opacity:${(0.25 + i * 0.19).toFixed(2)}`}></i>` : null; })}</div></div>`;
  }

  function Hiring({ params, query }) {
    const H = useHiring();
    const { P, cands, jobs } = H;
    const sc = useScope();
    const [tab, setTab] = PO.useCoState('hiring.view', 'pipeline');
    useEffect(() => { if (query.tab) setTab(query.tab); }, [query.tab]);
    const [newOpen, setNewOpen] = useState(query.new === '1');
    const job = params[0] ? jobs.find((j) => j.id === params[0]) : null;
    const visJobs = sc.role === 'manager' ? jobs.filter((j) => j.hiringManager === sc.viewer.id || sc.people.some((p) => p.site === j.site)) : jobs;
    const myJobs = visJobs.length ? visJobs : jobs;
    const jobIds = new Set(myJobs.map((j) => j.id));
    const pool = cands.filter((c) => jobIds.has(c.job));
    const hired = pool.filter((c) => c.stage === 'Hired');
    const offers = pool.filter((c) => c.stage === 'Offer');
    const tth = hired.length ? Math.round(hired.reduce((t, c) => t + days(c.applied, PO.TODAY), 0) / hired.length) + 6 : 12;
    const declined = Math.max(1, Math.round(hired.length * 0.14));
    if (job) return html`<${JobView} H=${H} job=${job} />`;
    const openJobs = myJobs.filter((j) => j.status === 'Open');
    const openings = openJobs.reduce((t, j) => t + (+j.openings || 0), 0);
    const inPipe = pool.filter((c) => c.stage !== 'Hired').length;
    const fresh = pool.filter((c) => days(c.applied, PO.TODAY) <= 7).length;
    return html`
      <${PageHeader} title="Hiring" sub=${`${PO.plural(openJobs.length, 'open role')} across ${PO.plural(new Set(openJobs.map((j) => j.site)).size, 'site')}, with ${PO.plural(fresh, 'new applicant')} this week.`} actions=${html`
        <${Button} icon="Link" onClick=${() => PO.toast(`Careers page link copied: careers.${P.vocab.domain}`, { icon: 'Link' })}>Careers page</${Button}>
        <${Button} kind="primary" icon="Plus" onClick=${() => setNewOpen(true)}>Post a job</${Button}>
        <${Menu} align="right" width=${220} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'Walk-in QR poster', icon: 'QrCode', onClick: () => PO.fakeDownload('Walk-in QR poster (A4 PDF)') },
          { label: 'Export candidates', icon: 'Download', onClick: () => PO.exportCsv('candidates', [['Name', 'Job', 'Stage', 'Source', 'Score', 'Applied'], ...pool.map((c) => [c.name, jobTitleShort(P, c), c.stage, c.source, c.score, c.applied])]) },
          '-',
          { label: 'Job boards', icon: 'Globe', onClick: () => setTab('boards') },
          { label: 'Funnel & sources', icon: 'ChartColumn', onClick: () => setTab('analytics') },
        ]} />`} />
      <${PO.KpiStrip} items=${[
        { label: 'Openings filled', icon: 'BadgeCheck', accent: 'green', value: String(hired.length), unit: `/${openings}`, bar: [{ v: hired.length, k: 'ok', title: `${hired.length} hired` }, { v: Math.max(0, openings - hired.length), k: 'mute', title: `${Math.max(0, openings - hired.length)} to fill` }], sub: `${Math.max(0, openings - hired.length)} still to fill` },
        { label: 'In pipeline', icon: 'Users', accent: 'blue', value: PO.num(inPipe), bar: STAGES.slice(0, 4).map((st, i) => ({ v: pool.filter((c) => c.stage === st).length, k: i < 2 ? 'mute' : 'ok', title: `${pool.filter((c) => c.stage === st).length} ${st.toLowerCase()}` })), sub: `${fresh} new this week` },
        { label: 'Offers out', icon: 'FileSignature', accent: 'teal', value: String(offers.length), sub: `${PO.pct(hired.length / (hired.length + declined || 1))} accepted this quarter` },
        { label: 'Time to hire', icon: 'Timer', accent: 'violet', value: String(tth), unit: 'days', sub: '3 days faster than last quarter' },
      ]} />
      <div class="mt-24"><${Tabs} tabs=${[['pipeline', 'Pipeline', inPipe], ['jobs', 'Jobs', myJobs.length], ['people', 'Candidates', pool.length], ['analytics', 'Funnel & sources'], ['boards', 'Job boards']]} value=${tab} onChange=${setTab} /></div>
      ${tab === 'pipeline' ? html`<${PipelineTab} H=${H} pool=${pool} jobs=${myJobs} />` : null}
      ${tab === 'jobs' ? html`<${JobsTable} H=${H} jobs=${myJobs} />` : null}
      ${tab === 'people' ? html`<${AllCandidates} H=${H} pool=${pool} />` : null}
      ${tab === 'analytics' ? html`<${HiringAnalytics} P=${P} pool=${pool} jobs=${myJobs} />` : null}
      ${tab === 'boards' ? html`<${BoardsPanel} P=${P} jobs=${myJobs} pool=${pool} />` : null}
      <${NewJobDrawer} open=${newOpen} onClose=${() => setNewOpen(false)} H=${H} />`;
  }

  function PipelineTab({ H, pool, jobs }) {
    const [q, setQ] = useState('');
    const [jb, setJb] = useState('');
    const [src, setSrc] = useState('');
    const shown = pool.filter((c) => (!q || c.name.toLowerCase().includes(q.toLowerCase())) && (!jb || c.job === jb) && (!src || c.source === src));
    const job = jb ? jobs.find((j) => j.id === jb) : null;
    return html`<${Kanban} H=${H} list=${shown} job=${job} showJob=${!jb} filters=${html`
      <${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search candidates" width=${220} />
      <${Select} value=${jb} onChange=${setJb} options=${[['', 'All jobs'], ...jobs.map((j) => [j.id, `${j.title}, ${PO.site(j.site).name}`])]} width=${240} />
      <${Select} value=${src} onChange=${setSrc} options=${[['', 'All sources'], ...[...new Set(pool.map((c) => c.source))].map((s) => [s, s])]} width=${160} />
      ${jb ? html`<${Button} size="sm" kind="ghost" href=${PO.href('hiring/' + jb)}>Open job</${Button}>` : null}`} />`;
  }

  /** The pipeline board: five stage columns, calm cards, multi-select for invites and moves. */
  function Kanban({ H, list, job, showJob, filters }) {
    const { P, cands } = H;
    const [open, setOpen] = useState(null);
    const [sel, setSel] = useState(new Set());
    const [invite, setInvite] = useState(null);
    const { move, handoff, handed } = useMove(H);
    const toggle = (id) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
    const picked = cands.filter((c) => sel.has(c.id));
    const openC = open ? cands.find((c) => c.id === open) : null;
    return html`
      <div class="row wrap" style="gap:8px;margin-bottom:12px">
        ${filters}
        <span class="right row" style="gap:8px">${sel.size ? html`<span class="t-sm w-550">${sel.size} selected</span>
          <${Button} size="sm" icon="CalendarPlus" onClick=${() => setInvite(picked)}>Invite to interview</${Button}>
          <${Menu} align="right" trigger=${html`<${Button} size="sm" iconRight="ChevronDown">Move to</${Button}>`} items=${STAGES.map((s) => ({ label: s, onClick: () => { const o = { ...H.stages }; sel.forEach((id) => (o[id] = s)); H.setStages(o); PO.toast(`${PO.plural(sel.size, 'candidate')} moved to ${s}`); setSel(new Set()); } }))} />
          <${Button} size="sm" kind="ghost" onClick=${() => setSel(new Set())}>Clear</${Button}>` : html`<span class="faint t-sm tnum">${PO.plural(list.length, 'candidate')}</span>`}</span>
      </div>
      <div class=${'tl-kan ' + (sel.size ? 'picking' : '')}>${STAGES.map((s) => { const col = list.filter((c) => c.stage === s).sort((a, b) => b.score - a.score); return html`<div class=${'tl-col tl-acc-' + STAGE_META[s][1]}>
        <div class="tl-col-h"><${PO.Chip} icon=${STAGE_META[s][0]} accent=${STAGE_META[s][1]} size=${13} />${s}<span class="n">${col.length}</span>${s === 'Hired' && job ? html`<span class="right faint t-xs w-500">of ${job.openings}</span>` : null}</div>
        <div class="tl-col-b">${col.length ? col.map((c) => html`<${CandCard} key=${c.id} c=${c} P=${P} showJob=${showJob} sel=${sel.has(c.id)} onSel=${toggle} onOpen=${(x) => setOpen(x.id)} onMove=${move} />`) : html`<div class="tl-empty">${s === 'Hired' ? 'Hires land here' : 'Nobody in ' + s.toLowerCase()}</div>`}</div>
      </div>`; })}</div>
      ${openC ? html`<${CandidateDrawer} c=${openC} H=${H} onClose=${() => setOpen(null)} move=${move} handoff=${handoff} handed=${handed} onInvite=${(c) => setInvite([c])} />` : null}
      ${invite ? html`<${InviteModal} P=${P} list=${invite} job=${job} onClose=${() => setInvite(null)} onDone=${() => setSel(new Set())} />` : null}`;
  }

  function JobsTable({ H, jobs }) {
    const { P, cands } = H;
    return html`<${DataTable} rows=${jobs} exportName="jobs" search=${(j) => j.title + ' ' + PO.site(j.site).name}
      searchPlaceholder="Search roles"
      filters=${[{ key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (j, v) => j.site === v }, { key: 'st', label: 'Status', options: ['Open', 'Closed'], test: (j, v) => j.status === v }]}
      onRow=${(j) => PO.go('hiring/' + j.id)}
      columns=${[
        { key: 'title', label: 'Role', render: (j) => html`<b class="w-550">${j.title}</b><div class="faint t-xs">${j.id}, ${j.isNew ? 'posted today' : 'posted ' + PO.rel(j.posted)}</div>`, sort: (j) => j.title },
        { key: 'site', label: 'Site', render: (j) => PO.site(j.site).name, sort: (j) => PO.site(j.site).name, csv: (j) => PO.site(j.site).name },
        { key: 'hm', label: 'Hiring manager', render: (j) => PO.person(j.hiringManager)?.name || '—', sort: (j) => PO.person(j.hiringManager)?.name, csv: (j) => PO.person(j.hiringManager)?.name },
        { key: 'pipe', label: 'Pipeline', width: 180, render: (j) => { const l = cands.filter((c) => c.job === j.id); return l.length ? html`<${PipeBar} list=${l} />` : html`<span class="faint t-sm">No applicants yet</span>`; }, sort: false, csv: (j) => STAGES.map((s) => cands.filter((c) => c.job === j.id && c.stage === s).length).join(' / ') },
        { key: 'apps', label: 'Applicants', align: 'r', sort: (j) => cands.filter((c) => c.job === j.id).length, render: (j) => html`<span class="tnum">${cands.filter((c) => c.job === j.id).length}</span>` },
        { key: 'openings', label: 'Hired', align: 'r', render: (j) => { const h = cands.filter((c) => c.job === j.id && c.stage === 'Hired').length; return html`<span class="tnum">${h} / ${j.openings}</span>`; }, sort: (j) => cands.filter((c) => c.job === j.id && c.stage === 'Hired').length / (j.openings || 1), csv: (j) => j.openings },
        { key: 'status', label: 'Status', render: (j) => { const h = cands.filter((c) => c.job === j.id && c.stage === 'Hired').length; return html`<${Status} s=${j.status === 'Open' && h >= j.openings ? 'Filled' : j.status} />`; } },
      ]} />`;
  }

  function CandCard({ c, onOpen, onMove, sel, onSel, P, showJob }) {
    const info = useMemo(() => candInfo(P, c), [c.id, P.id]);
    const idx = STAGES.indexOf(c.stage);
    const stuck = info.inStage > 6 && c.stage !== 'Hired';
    return html`<div class=${'tl-cc ' + (sel ? 'sel' : '')} onClick=${() => onOpen(c)}>
      <div class="tl-top"><${Avatar} name=${c.name} hue=${c.hue} size="lg" /><div class="grow" style="min-width:0"><b>${c.name}</b><small>${showJob ? jobTitleShort(P, c) : c.exp ? PO.plural(c.exp, 'yr') + ' experience' : 'Fresher'}</small></div><${ScoreRing} v=${c.score} /></div>
      <div class="faint t-xs ellipsis">${showJob ? (c.exp ? PO.plural(c.exp, 'yr') : 'Fresher') + ', via ' : 'Via '}${c.source}</div>
      <div class="row t-xs" style="min-height:22px"><span style=${stuck ? 'color:var(--amber)' : 'color:var(--text-3)'}>${c.stage === 'Hired' ? 'Hired' : info.inStage === 0 ? 'Moved today' : PO.plural(info.inStage, 'day') + ' in stage'}</span>
        <span class="right row tl-hov" style="gap:2px" onClick=${(e) => e.stopPropagation()}>
          <label class="check" title="Select"><input type="checkbox" checked=${sel} onChange=${() => onSel(c.id)} /></label>
          ${idx < 4 ? html`<${IconButton} icon="ChevronRight" size="sm" title=${'Move to ' + STAGES[idx + 1]} onClick=${() => onMove(c, STAGES[idx + 1])} />` : null}
          <${Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ header: 'Move to' }, ...STAGES.filter((s) => s !== c.stage).map((s) => ({ label: s, onClick: () => onMove(c, s) })), '-', { label: 'Reject', icon: 'X', danger: true, onClick: () => onMove(c, 'Rejected') }]} />
        </span></div>
    </div>`;
  }

  function useMove(H) {
    const [handed, setHanded] = PO.useCoState('hiring.handed', {});
    const [onb, setOnb] = PO.useCoState('onboarding.added', []);
    const handoff = (c) => {
      const j = H.jobs.find((x) => x.id === c.job);
      if (handed[c.id]) { PO.toast(`${c.name} is already in onboarding`); return; }
      setOnb([...(onb || []), { name: c.name, role: j.title, site: j.site, start: PO.addDays(PO.TODAY, 7) }]);
      setHanded({ ...handed, [c.id]: true });
      PO.toast(`${c.name} added to onboarding, starts ${PO.date(PO.addDays(PO.TODAY, 7), { short: true })}`, { icon: 'UserPlus', action: { label: 'Open', run: () => PO.go('onboarding') } });
    };
    const move = (c, stage) => {
      const prev = c.stage;
      H.setStages({ ...H.stages, [c.id]: stage });
      if (stage === 'Hired') PO.toast(`${c.name} marked as hired`, { icon: 'BadgeCheck', action: { label: 'Start onboarding', run: () => handoff(c) }, ms: 7000 });
      else PO.toast(stage === 'Rejected' ? `${c.name} rejected, a polite email goes out` : `${c.name} moved to ${stage}`, { action: { label: 'Undo', run: () => H.setStages({ ...H.stages, [c.id]: prev }) } });
    };
    return { move, handoff, handed };
  }

  function JobView({ H, job }) {
    const { P, cands } = H;
    const list = cands.filter((c) => c.job === job.id);
    const [q, setQ] = useState('');
    const [src, setSrc] = useState('');
    const [boards, setBoards] = PO.useCoState('hiring.boards.' + job.id, Object.fromEntries(boardNames(P).map((b, i) => [b, i < 2 || job.sources.includes(shortBoard(b)) || /referral/i.test(b)])));
    const [invite, setInvite] = useState(null);
    const shown = list.filter((c) => (!q || c.name.toLowerCase().includes(q.toLowerCase())) && (!src || c.source === src));
    const pay = payFor(P, job.title);
    const hm = PO.person(job.hiringManager);
    const live = Object.values(boards).filter(Boolean).length;
    const screening = list.filter((c) => c.stage === 'Screening');
    return html`
      <div class="row t-sm muted" style="margin-bottom:8px"><a href=${PO.href('hiring')} class="row" style="gap:4px"><${Icon} n="ArrowLeft" size=${14} />Hiring</a></div>
      <${PageHeader} title=${job.title} sub=${`${PO.plural(job.openings, 'opening')} at ${PO.site(job.site).name}, ${pay.label}. ${PO.plural(list.length, 'applicant')} since it was ${job.isNew ? 'posted today' : 'posted on ' + PO.date(job.posted, { short: true })}${job.status === 'Closed' ? '; now closed' : ''}.`} actions=${html`
        <${Button} icon="Link" onClick=${() => PO.toast(`Link copied: careers.${P.vocab.domain}/${job.id.toLowerCase()}`)}>Copy link</${Button}>
        <${Button} kind="primary" icon="CalendarPlus" disabled=${!screening.length} onClick=${() => setInvite(screening)}>Invite ${screening.length} in screening</${Button}>
        <${Menu} align="right" width=${240} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'Share with staff for referrals', icon: 'Share2', onClick: () => PO.toast(`Shared with ${PO.plural(P.people.filter((p) => p.site === job.site).length, 'person', 'people')} at ${PO.site(job.site).name}`) },
          { label: 'Walk-in QR poster', icon: 'QrCode', onClick: () => PO.fakeDownload('Walk-in QR poster (A4 PDF)') },
          { label: 'Edit job description', icon: 'Pencil', onClick: () => PO.toast('Job description opened for editing') },
          { label: 'Export candidates', icon: 'Download', onClick: () => PO.exportCsv('candidates-' + job.id.toLowerCase(), [['Name', 'Stage', 'Source', 'Score', 'Applied'], ...list.map((c) => [c.name, c.stage, c.source, c.score, c.applied])]) },
          '-',
          { label: job.status === 'Closed' ? 'Reopen job' : 'Close job', icon: job.status === 'Closed' ? 'RotateCcw' : 'Archive', danger: job.status !== 'Closed', onClick: () => { H.setClosed({ ...H.closed, [job.id]: job.status !== 'Closed' }); PO.toast(job.status === 'Closed' ? 'Job reopened and reposted' : 'Job closed and taken down from all boards'); } },
        ]} />`} />
      ${list.length ? html`<${Kanban} H=${H} list=${shown} job=${job} filters=${html`
          <${PO.SearchInput} value=${q} onInput=${setQ} placeholder="Search candidates" width=${220} />
          <${Select} value=${src} onChange=${setSrc} options=${[['', 'All sources'], ...[...new Set(list.map((c) => c.source))].map((s) => [s, s])]} width=${160} />`} />`
        : html`<div class="card"><${Empty} icon="Inbox" title="No applicants yet" text=${`Posted to ${PO.plural(live, 'board')}. First applicants usually arrive within 24 hours; walk-ins can scan the QR poster at the gate.`} action=${html`<${Button} icon="QrCode" onClick=${() => PO.fakeDownload('Walk-in QR poster (A4 PDF)')}>Download QR poster</${Button}>`} /></div>`}
      <div class="grid g-2 mt-24" style="align-items:start">
        <${Card} title="Job details">
          <${KV} items=${[['Site', PO.site(job.site).name], ['Pay', html`${pay.label}<div class="faint t-xs">${pay.sub}</div>`], ['Hiring manager', hm ? hm.name : '—'], ['Shifts', P.shifts.map((s) => s.label).join(', ')], ['Interview', 'Walk-in at site gate, Mon–Sat 10:00–13:00'], ['Screening', P.id === 'in' ? 'Police verification, Aadhaar, 10th pass' : P.id === 'us' ? 'Food handler card within 30 days' : 'Right to work, DBS (healthcare sites)']]} />
        </${Card}>
        <${Card} title="Where it’s posted" sub=${`${live} live`} flush>
          ${BOARDS[P.id].map(([b, cost]) => html`<div class="tl-row"><span class="tl-mono">${b[0]}</span><div class="grow" style="min-width:0"><b class="w-550">${b}</b><div class="faint t-xs">${cost}</div></div><span class="faint t-sm tnum">${boards[b] ? PO.plural(list.filter((c) => c.source === shortBoard(b)).length, 'applicant') : 'Off'}</span><${Switch} on=${boards[b]} onChange=${(v) => { setBoards({ ...boards, [b]: v }); PO.toast(v ? `Posted to ${b}` : `Taken down from ${b}`); }} /></div>`)}
        </${Card}>
      </div>
      ${invite ? html`<${InviteModal} P=${P} list=${invite} job=${job} onClose=${() => setInvite(null)} />` : null}`;
  }

  function AllCandidates({ H, pool }) {
    const { P } = H;
    const [open, setOpen] = useState(null);
    const [invite, setInvite] = useState(null);
    const { move, handoff, handed } = useMove(H);
    const openC = open ? H.cands.find((c) => c.id === open) : null;
    return html`<${DataTable} rows=${pool} exportName="candidates" selectable search=${(c) => c.name + ' ' + jobTitleShort(P, c)} searchPlaceholder="Search candidates"
      initialSort=${{ key: 'score', dir: 'desc' }}
      filters=${[{ key: 'stage', label: 'Stage', options: STAGES, test: (c, v) => c.stage === v }, { key: 'src', label: 'Source', options: [...new Set(pool.map((c) => c.source))], test: (c, v) => c.source === v }, { key: 'job', label: 'Job', options: H.jobs.map((j) => [j.id, j.title]), test: (c, v) => c.job === v }]}
      bulk=${(ids, clear) => html`<${Button} size="sm" icon="CalendarPlus" onClick=${() => { setInvite(pool.filter((c) => ids.includes(c.id))); clear(); }}>Invite to interview</${Button}><${Menu} trigger=${html`<${Button} size="sm" iconRight="ChevronDown">Move to</${Button}>`} items=${STAGES.map((s) => ({ label: s, onClick: () => { const o = { ...H.stages }; ids.forEach((id) => (o[id] = s)); H.setStages(o); clear(); PO.toast(`${PO.plural(ids.length, 'candidate')} moved to ${s}`); } }))} />`}
      onRow=${(c) => setOpen(c.id)}
      columns=${[
        { key: 'name', label: 'Candidate', render: (c) => html`<div class="row"><${Avatar} name=${c.name} hue=${c.hue} size="sm" /><b class="w-550">${c.name}</b></div>`, sort: (c) => c.name },
        { key: 'job', label: 'Applied for', render: (c) => html`${jobTitleShort(P, c)}<div class="faint t-xs">${PO.site(H.jobs.find((j) => j.id === c.job).site).name}</div>`, sort: (c) => jobTitleShort(P, c), csv: (c) => jobTitleShort(P, c) },
        { key: 'stage', label: 'Stage', render: (c) => c.stage },
        { key: 'source', label: 'Source' },
        { key: 'exp', label: 'Experience', align: 'r', render: (c) => (c.exp ? PO.plural(c.exp, 'yr') : 'Fresher') },
        { key: 'applied', label: 'Applied', align: 'r', render: (c) => PO.rel(c.applied) },
        { key: 'score', label: 'Score', align: 'r', render: (c) => html`<span class=${'tl-score ' + (c.score < 65 ? 'r' : '')}>${c.score}</span>` },
      ]} />
      ${openC ? html`<${CandidateDrawer} c=${openC} H=${H} onClose=${() => setOpen(null)} move=${move} handoff=${handoff} handed=${handed} onInvite=${(c) => setInvite([c])} />` : null}
      ${invite ? html`<${InviteModal} P=${P} list=${invite} onClose=${() => setInvite(null)} />` : null}`;
  }

  function CandidateDrawer({ c, H, onClose, move, handoff, handed, onInvite }) {
    const { P } = H;
    const info = useMemo(() => candInfo(P, c), [c.id, P.id]);
    const job = H.jobs.find((j) => j.id === c.job);
    const [tab, setTab] = useState('profile');
    const [notes, setNotes] = PO.useCoState('hiring.notes', {});
    const [draft, setDraft] = useState('');
    const [offer, setOffer] = useState(false);
    const [ask, confirmEl] = PO.useConfirm();
    const my = notes[c.id] || [];
    const hm = PO.person(c.hm);
    const docs = [['Resume / biodata', 'PDF, 1 page', true], [P.id === 'in' ? 'Aadhaar card' : P.id === 'us' ? 'Photo ID' : 'Passport / share code', 'Image', STAGES.indexOf(c.stage) >= 1], [P.id === 'in' ? 'Police verification form' : P.id === 'us' ? 'Food handler card' : 'DBS application', 'PDF', STAGES.indexOf(c.stage) >= 3], ['Signed offer letter', 'PDF', c.stage === 'Hired']];
    const activity = [
      { icon: 'Inbox', title: `Applied via ${c.source}`, sub: PO.date(c.applied, { short: true }) },
      STAGES.indexOf(c.stage) >= 1 ? { icon: 'PhoneCall', tone: '', title: 'Phone screen passed', sub: `${hm ? hm.first : 'HR'}, ${PO.date(PO.addDays(c.applied, 2), { short: true })}` } : null,
      STAGES.indexOf(c.stage) >= 2 ? { icon: 'CalendarCheck2', tone: 'green', title: 'Interview invite sent by SMS and email', sub: 'Slot confirmed from the invite link' } : null,
      STAGES.indexOf(c.stage) >= 3 ? { icon: 'FileSignature', tone: 'brand', title: 'Offer letter sent', sub: 'Opened 2 times' } : null,
      c.stage === 'Hired' ? { icon: 'BadgeCheck', tone: 'green', title: 'Offer accepted', sub: 'E-signed online' } : null,
    ].filter(Boolean).reverse();
    return html`<${Drawer} open size="lg" onClose=${onClose} head=${html`<div class="row grow" style="gap:12px;min-width:0"><${Avatar} name=${c.name} hue=${c.hue} size="lg" /><div style="min-width:0"><h3>${c.name}</h3><div class="faint t-sm">${job.title}, ${PO.site(job.site).name}, ${c.id}</div></div><span class="right row" style="gap:12px"><span class="t-sm muted">${c.stage}</span><span class="t-sm muted">Score <b class=${'tl-score ' + (c.score < 65 ? 'r' : '')} style="font-size:13px">${c.score}</b></span></span></div>`}
      footer=${html`
        <${Menu} trigger=${html`<${Button} icon="ArrowRight">Move to</${Button}>`} items=${STAGES.filter((s) => s !== c.stage).map((s) => ({ label: s, onClick: () => move(c, s) }))} />
        <${Button} kind="danger" icon="X" onClick=${() => ask({ title: `Reject ${c.name}?`, body: html`<p>They get a short, polite email. You can find them later under All candidates.</p>`, confirm: 'Reject', danger: true, onConfirm: () => { move(c, 'Rejected'); onClose(); } })}>Reject</${Button}>
        <span class="grow"></span>
        <${Button} icon="CalendarPlus" onClick=${() => onInvite(c)}>Invite to interview</${Button}>
        ${c.stage === 'Hired' ? html`<${Button} kind="primary" icon="UserPlus" disabled=${handed[c.id]} onClick=${() => handoff(c)}>${handed[c.id] ? 'In onboarding' : 'Start onboarding'}</${Button}>` : html`<${Button} kind="primary" icon="FileSignature" onClick=${() => setOffer(true)}>Send offer letter</${Button}>`}`}>
      <div class="tl-facts"><div><span>Experience</span><b>${c.exp ? PO.plural(c.exp, 'year') : 'Fresher'}</b></div><div><span>Expected pay</span><b>${info.expPay}</b></div><div><span>Can join</span><b>${info.notice}</b></div></div>
      <${Tabs} tabs=${[['profile', 'Profile'], ['scores', 'Scorecards', info.scorecards.length], ['docs', 'Documents', docs.filter((d) => d[2]).length], ['notes', 'Notes', my.length + 1], ['activity', 'Activity']]} value=${tab} onChange=${setTab} />
      <div class="mt-16">
        ${tab === 'profile' ? html`
          <${KV} items=${[['Phone', info.phone], ['Email', info.email], ['Lives in', info.city], ['Source', c.source], ['Applied', PO.date(c.applied)], ['Hiring manager', hm ? html`<${Who} p=${hm} size="xs" sub="" />` : '—']]} />
          <div class="tl-sub">Screening answers <span class="faint w-500">from the application form</span></div>
          <div class="card flush">${info.screen.map(([q, a, ok]) => html`<div class="tl-row" style="padding:8px 12px"><span class="grow muted">${q}</span><b class="w-550">${a}</b><${Icon} n=${ok ? 'Check' : 'CircleAlert'} size=${14} style=${ok ? 'color:var(--text-3)' : 'color:var(--amber)'} /></div>`)}</div>
          <p class="muted mt-12">${c.score >= 80 ? `Strong fit. ${info.hist.length ? 'Has done this job before' : 'Fresher but scored well'}, lives ${info.km} km from the site and can start in ${info.notice.toLowerCase()}.` : c.score >= 65 ? `Reasonable fit. Lives ${info.km} km away; check comfort with ${P.shifts[0].label.toLowerCase()} shifts in the interview.` : `Weak fit on screening answers. Consider for a different site closer to ${info.city}.`}</p>
          <div class="tl-sub">Experience</div>
          ${info.hist.length ? html`<${Timeline} items=${info.hist.map((h) => ({ icon: 'Building2', title: h.role, sub: `${h.at}, ${PO.plural(h.yrs, 'year')}` }))} />` : html`<p class="muted">First job. Shortlisted on attitude and availability; pair with a buddy for two weeks.</p>`}
          <div class="tl-sub">Skills</div>
          <div class="row wrap" style="gap:6px">${info.skills.map((s) => html`<span class="tag">${s}</span>`)}</div>` : null}
        ${tab === 'scores' ? (info.scorecards.length ? info.scorecards.map((s) => html`<div class="card" style="padding:14px 16px">
            <div class="row"><${Who} id=${s.by} size="sm" sub=${`${s.kind}, ${PO.date(s.on, { short: true })}`} link=${false} /><span class="right t-sm w-550" style=${s.rec === 'Maybe' ? 'color:var(--amber)' : ''}>${s.rec}</span></div>
            <div class="col mt-12" style="gap:8px">${s.marks.map(([k, v]) => html`<div class="row t-sm"><span class="grow">${k}</span><span class="tl-dots">${[1, 2, 3, 4, 5].map((i) => html`<i class=${i <= v ? 'on' : ''}></i>`)}</span><b class="tnum" style="width:24px;text-align:right">${v}</b></div>`)}</div>
            <p class="muted mt-12">“${s.note}”</p></div>`) : html`<${Empty} icon="ClipboardList" title="No scorecards yet" text="Scorecards appear once the interview happens. Invite them to a walk-in slot." action=${html`<${Button} icon="CalendarPlus" onClick=${() => onInvite(c)}>Invite to interview</${Button}>`} />`) : null}
        ${tab === 'docs' ? html`<div class="card flush">${docs.map(([n, k, has]) => html`<div class="list-item"><${Icon} n="FileText" size=${16} cls="faint" /><div class="grow"><b class="w-550">${n}</b><div class="faint t-xs">${has ? k + ', received' : 'Not received yet'}</div></div>${has ? html`<${Button} size="sm" icon="Eye" onClick=${() => PO.toast(`Opened ${n}`)}>View</${Button}>` : html`<${Button} size="sm" icon="Send" onClick=${() => PO.toast(`Asked ${c.name.split(' ')[0]} for ${n.toLowerCase()} by email`)}>Request</${Button}>`}</div>`)}</div>` : null}
        ${tab === 'notes' ? html`
          <div class="col" style="gap:8px"><textarea class="textarea" rows="3" placeholder=${`Add a note for the hiring team about ${c.name.split(' ')[0]}`} value=${draft} onInput=${(e) => setDraft(e.target.value)} style="height:auto;padding:8px 10px"></textarea>
          <div class="row"><span class="faint t-xs">Visible to HR and ${hm ? hm.first : 'the hiring manager'}</span><${Button} size="sm" kind="primary" cls="right" disabled=${!draft.trim()} onClick=${() => { setNotes({ ...notes, [c.id]: [{ t: draft.trim(), at: P.hhmm(P.company.nowMin), by: PO.viewer ? 'You' : 'You' }, ...my] }); setDraft(''); PO.toast('Note added'); }}>Add note</${Button}></div></div>
          <div class="mt-16"><${Timeline} items=${[...my.map((n) => ({ icon: 'StickyNote', title: n.by, sub: 'Today ' + n.at, body: n.t })), { icon: 'StickyNote', title: hm ? hm.name : 'Hiring manager', sub: PO.date(PO.addDays(c.applied, 1), { short: true }), body: c.score >= 75 ? 'Strong profile. Lives close to the site, fine with rotating shifts.' : 'Okay on paper. Check how they handle night shifts.' }]} /></div>` : null}
        ${tab === 'activity' ? html`<${Timeline} items=${activity} />` : null}
      </div>
      ${offer ? html`<${OfferModal} c=${c} job=${job} P=${P} onClose=${() => setOffer(false)} onSent=${() => { move(c, 'Offer'); setOffer(false); }} />` : null}
      ${confirmEl}
    </${Drawer}>`;
  }

  function OfferModal({ c, job, P, onClose, onSent }) {
    const pay = payFor(P, job.title);
    const [amt, setAmt] = useState(P.id === 'in' ? pay.gross : pay.rate);
    const [start, setStart] = useState(PO.addDays(PO.TODAY, 7));
    const [shift, setShift] = useState((P.shifts.find((s) => s.key === 'A') || P.shifts[0]).key);
    const [via, setVia] = useState('email');
    const sh = PO.shiftOf(shift);
    const ctc = P.id === 'in' ? Math.round(amt * 12 * 1.1) : null;
    const C = P.company;
    return html`<${Modal} open size="lg" title=${`Offer letter for ${c.name}`} icon="FileSignature" onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} icon="Download" onClick=${() => PO.fakeDownload(`Offer letter – ${c.name}.pdf`)}>Download PDF</${Button}><${Button} kind="primary" icon="Send" onClick=${() => { PO.toast(`Offer sent to ${c.name} by ${via === 'sms' ? 'email, with an SMS link' : 'email'}, e-sign link included`, { icon: 'Send' }); onSent(); }}>Send offer</${Button}>`}>
      <div class="grid" style="grid-template-columns:220px minmax(0,1fr);gap:16px">
        <div class="col" style="gap:12px">
          <${Field} label=${P.id === 'in' ? 'Monthly gross (₹)' : 'Hourly rate'} hint=${P.id === 'in' ? `CTC ≈ ${PO.money(ctc)} a year incl. PF & ESI` : P.id === 'us' ? 'Texas minimum is $7.25; our floor is $14.50' : 'National Living Wage is £12.21'}><input class="input tnum" type="number" step=${P.id === 'in' ? 500 : 0.25} value=${amt} onInput=${(e) => setAmt(+e.target.value)} /></${Field}>
          <${Field} label="Start date"><input class="input" type="date" value=${start} onInput=${(e) => setStart(e.target.value)} /></${Field}>
          <${Field} label="Shift"><${Select} value=${shift} onChange=${setShift} options=${P.shifts.map((s) => [s.key, `${s.label}, ${s.time}`])} /></${Field}>
          <${Field} label="Send by"><${PO.Segmented} options=${[['email', 'Email'], ['sms', 'Email + SMS link']]} value=${via} onChange=${setVia} /></${Field}>
          <div class="row t-sm muted" style="gap:6px"><${Icon} n="Check" size=${14} />Within the pay band for ${job.title.toLowerCase()}</div>
        </div>
        <div class="tl-letter">
          <div class="row"><div><h4>${C.name}</h4><div class="faint t-xs">${C.city}${C.region ? ', ' + C.region : ''}, ${P.vocab.domain}</div></div><span class="right faint t-xs">${PO.date(PO.TODAY)}</span></div>
          <div class="divider" style="margin:12px 0;border-top:1px solid var(--border)"></div>
          <p>Dear ${c.name.split(' ')[0]},</p>
          <p>We are pleased to offer you the position of <b>${job.title}</b> at <b>${PO.site(job.site).name}</b>, starting <b>${PO.date(start)}</b> on the ${sh.label.toLowerCase()} shift (${sh.time}).</p>
          <p>${P.id === 'in' ? html`Your monthly gross salary will be <b>${PO.money(amt)}</b> (CTC <b>${PO.money(ctc)}</b> per annum), including basic, HRA and special allowance. You will be covered under PF and ESI from day one, and overtime is paid at twice the hourly wage.` : P.id === 'us' ? html`Your pay will be <b>${PO.money(amt, { cents: true })} per hour</b>, paid bi-weekly by direct deposit. Overtime over 40 hours a week is paid at 1.5×. You can join the 401(k) after 90 days.` : html`Your pay will be <b>${PO.money(amt, { cents: true })} per hour</b>, paid four-weekly. You will be auto-enrolled into the workplace pension, and you get 5.6 weeks’ paid holiday a year pro rata.`}</p>
          <p>This offer is subject to ${P.id === 'in' ? 'police verification and original documents (Aadhaar, PAN, bank passbook)' : P.id === 'us' ? 'Form I-9 verification within 3 days of starting and a valid food handler card within 30 days' : 'a right to work check and, for hospital sites, an enhanced DBS check'}.</p>
          <p class="mt-12">Warm regards,<br /><b>${P.byId[P.hrId].name}</b><br /><span class="faint">${P.byId[P.hrId].title}, ${C.short}</span></p>
        </div>
      </div>
    </${Modal}>`;
  }

  function InviteModal({ P, list, job, onClose, onDone }) {
    const [invited, setInvited] = PO.useCoState('hiring.invited', {});
    const [slot, setSlot] = useState(0);
    const slots = [1, 2, 3].map((d) => PO.addDays(PO.TODAY, d));
    const j = job || P.jobs.find((x) => x.id === list[0]?.job) || P.jobs[0];
    const site = PO.site(j.site).name;
    const when = `${PO.date(slots[slot], { weekday: true, short: true })}, 11:00`;
    const text = `${P.company.short}: Hi {name}, your interview for ${j.title} is on ${when} at ${site}. Please bring photo ID${P.id === 'in' ? ' (Aadhaar) and 2 photos' : P.id === 'uk' ? ' and your share code' : ''}. Confirm or pick another time: ${P.vocab.domain}/i/${j.id.toLowerCase()}`;
    const first = list[0] ? list[0].name.split(' ')[0] : '';
    return html`<${Modal} open size="lg" title=${`Invite ${PO.plural(list.length, 'candidate')} to interview`} icon="CalendarPlus" onClose=${onClose} footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" icon="Send" disabled=${!list.length} onClick=${() => { const o = { ...invited }; list.forEach((c) => (o[c.id] = slots[slot])); setInvited(o); PO.toast(`${PO.plural(list.length, 'invite')} sent by SMS and email, confirmations land in the candidate's activity`, { icon: 'Send' }); onDone && onDone(); onClose(); }}>Send ${list.length > 1 ? list.length + ' invites' : 'invite'}</${Button}>`}>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:16px">
        <div class="col" style="gap:12px">
          <${Field} label="Recipients"><div class="row wrap" style="gap:6px;max-height:120px;overflow:auto">${list.length ? list.map((c) => html`<span class="tag"><${Avatar} name=${c.name} hue=${c.hue} size="xs" />${c.name}${invited[c.id] ? html`<${Icon} n="CheckCheck" size=${12} cls="faint" />` : null}</span>`) : html`<span class="faint">Nobody selected. Tick candidates on the board first.</span>`}</div></${Field}>
          <${Field} label="Walk-in slot"><div class="row wrap" style="gap:6px">${slots.map((d, i) => html`<button class="tl-chip" aria-pressed=${slot === i} onClick=${() => setSlot(i)}>${PO.date(d, { weekday: true, short: true })}, 11:00</button>`)}</div></${Field}>
          <p class="faint t-sm">Sent by SMS from your registered sender ID and by email, using the approved template. Candidates confirm or pick another slot from the link; it shows up in their activity here.</p>
        </div>
        <div><div class="faint t-xs" style="margin-bottom:6px">SMS preview${first ? ' for ' + first : ''}</div><div class="tl-wa"><div class="tl-wa-from"><${Icon} n="MessageSquare" size=${12} />${P.msg.name}</div><div class="bub">${text.replace(/\{[^}]+\}/, first || 'there')}<small>${P.hhmm(P.company.nowMin)}</small></div></div></div>
      </div>
    </${Modal}>`;
  }

  function NewJobDrawer({ open, onClose, H }) {
    const { P } = H;
    const roleTitles = [...new Set([...P.jobs.map((j) => j.title), ...Object.values(P.roles).filter((r) => r.title !== 'Office' && r.title !== 'Office staff').map((r) => r.title)])];
    const [title, setTitle] = useState(roleTitles[0]);
    const [site, setSite] = useState(P.sites[0].id);
    const [openings, setOpenings] = useState(3);
    const [shift, setShift] = useState(P.shifts[0].key);
    const [boards, setBoards] = useState(Object.fromEntries(boardNames(P).map((b, i) => [b, i < 2 || /referral/i.test(b)])));
    const [wa, setWa] = useState(true);
    const pay = payFor(P, title);
    const [descEdit, setDescEdit] = useState(null);
    useEffect(() => setDescEdit(null), [title, site]);
    const desc = P.id === 'in' ? `We are hiring ${title.toLowerCase()}s for ${PO.site(site).name}, Pune. 8-hour rotating shifts, weekly off, PF + ESI from day one, uniform provided. ${pay.label}. 10th pass, age 21–45, police verification needed.` : P.id === 'us' ? `Join ${P.company.short} as a ${title.toLowerCase()} at ${PO.site(site).name}, Austin. ${pay.label} plus tips where applicable, free coffee and day-old pastries, flexible schedules, 401(k) after 90 days.` : `${P.company.short} is hiring a ${title.toLowerCase()} at ${PO.site(site).name}. ${pay.label}, paid four-weekly, uniform provided, pension, 28 days’ holiday pro rata. Right to work in the UK required.`;
    const publish = () => {
      const id = 'JOB-' + (200 + H.added.length);
      const live = Object.entries(boards).filter(([, v]) => v).map(([k]) => shortBoard(k));
      H.setAdded([{ id, title, site, openings: +openings, posted: PO.TODAY, sources: live, hiringManager: (PO.site(site).lead || P.topId), isNew: true }, ...H.added]);
      PO.toast(`${title} posted to ${PO.plural(live.length, 'board')}${wa ? ' and shared with staff for referrals' : ''}`, { icon: 'Megaphone', action: { label: 'View', run: () => PO.go('hiring/' + id) } });
      onClose();
    };
    return html`<${Drawer} open=${open} onClose=${onClose} title="Post a job" sub="It goes live on the boards you pick, and a short link goes to your staff for referrals" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} icon="Save" onClick=${() => { PO.toast('Saved as a draft'); onClose(); }}>Save draft</${Button}><${Button} kind="primary" icon="Send" onClick=${publish}>Publish</${Button}>`}>
      <div class="col" style="gap:14px">
        <${Field} label="Role"><${Select} value=${title} onChange=${setTitle} options=${roleTitles} /></${Field}>
        <div class="grid g-3" style="gap:12px">
          <${Field} label="Site"><${Select} value=${site} onChange=${setSite} options=${P.sites.map((s) => [s.id, s.name])} /></${Field}>
          <${Field} label="Openings"><input class="input tnum" type="number" min="1" value=${openings} onInput=${(e) => setOpenings(e.target.value)} /></${Field}>
          <${Field} label="Shift"><${Select} value=${shift} onChange=${setShift} options=${P.shifts.map((s) => [s.key, s.label])} /></${Field}>
        </div>
        <${Field} label="Pay" hint=${pay.sub}><input class="input" value=${pay.label} readOnly /></${Field}>
        <${Field} label="Description" hint="Written for a phone screen: short lines, pay up front."><textarea class="textarea" rows="5" style="height:auto;padding:8px 10px" value=${descEdit ?? desc} onInput=${(e) => setDescEdit(e.target.value)}></textarea></${Field}>
        <${Field} label="Post to">
          <div class="card flush">${BOARDS[P.id].map(([b, cost]) => html`<div class="tl-row" style="padding:8px 12px"><span class="tl-mono">${b[0]}</span><div class="grow"><b class="w-550">${b}</b><div class="faint t-xs">${cost}</div></div><${Switch} on=${boards[b]} onChange=${(v) => setBoards({ ...boards, [b]: v })} /></div>`)}</div>
        </${Field}>
        <${Switch} on=${wa} onChange=${setWa} label=${`Share with staff at ${PO.site(site).name} by email and on the employee portal for referrals`} />
        <p class="faint t-sm">It also goes on your careers page at ${P.vocab.domain}/careers, with a short apply form that works in any phone browser.</p>
      </div>
    </${Drawer}>`;
  }

  function HiringAnalytics({ P, pool, jobs }) {
    const srcs = [...new Set(pool.map((c) => c.source))];
    const cost = Object.fromEntries(BOARDS[P.id].map(([b, , , c]) => [shortBoard(b), c]));
    const r = PO.seeded('ha' + P.id);
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const hires = months.map((_, i) => (i === 5 ? pool.filter((c) => c.stage === 'Hired').length : r.int(3, 9) + (P.id === 'in' ? 6 : 0)));
    const rows = srcs.map((s) => { const l = pool.filter((c) => c.source === s); const h = l.filter((c) => c.stage === 'Hired').length; const iv = l.filter((c) => STAGES.indexOf(c.stage) >= 2).length; const spend = (cost[s] || 0) * (P.id === 'in' ? 2 : 30) + (/referral/i.test(s) ? h * (P.id === 'in' ? 2000 : P.id === 'us' ? 200 : 150) : 0); return { s, n: l.length, iv, h, conv: l.length ? h / l.length : 0, cph: h ? spend / h : null, score: l.length ? Math.round(l.reduce((t, c) => t + c.score, 0) / l.length) : 0 }; }).sort((a, b) => b.n - a.n);
    const tis = [['Applied', 2.1], ['Screening', 3.4], ['Interview', 4.2], ['Offer', 2.6]];
    return html`<div class="grid g-main" style="align-items:start">
      <div class="col" style="gap:16px;min-width:0">
        <${Card} title="Hiring funnel" sub="All open roles"><${PO.Charts.Bars} labels=${STAGES} series=${[{ name: 'Candidates who reached the stage', data: STAGES.map((s) => pool.filter((c) => STAGES.indexOf(c.stage) >= STAGES.indexOf(s)).length) }]} height=${210} />
          <div class="row wrap mt-12" style="gap:20px">${STAGES.slice(1).map((s, i) => { const a = pool.filter((c) => STAGES.indexOf(c.stage) >= i).length, b = pool.filter((c) => STAGES.indexOf(c.stage) >= i + 1).length; return html`<div class="t-sm"><span class="faint">${STAGES[i]} to ${s.toLowerCase()}</span> <b class="tnum w-600">${PO.pct(b / (a || 1))}</b></div>`; })}</div></${Card}>
        <${Card} title="Source effectiveness" sub="Which boards bring people who get hired" flush>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Source</th><th class="r">Applicants</th><th class="r">Interviewed</th><th class="r">Hired</th><th class="r">Hire rate</th><th class="r">Avg score</th><th class="r">Cost per hire</th></tr></thead>
          <tbody>${rows.map((x) => html`<tr><td class="w-550">${x.s}</td><td class="r tnum">${x.n}</td><td class="r tnum">${x.iv}</td><td class="r tnum">${x.h}</td><td class="r tnum">${PO.pct(x.conv)}</td><td class="r tnum">${x.score}</td><td class="r tnum">${x.cph == null ? '—' : x.cph === 0 ? 'Free' : PO.money(Math.round(x.cph))}</td></tr>`)}</tbody></table></div>
        </${Card}>
      </div>
      <div class="col" style="gap:16px;min-width:0">
        <${Card} title="Hires per month"><${PO.Charts.Line} labels=${months} series=${[{ name: 'Hires', data: hires }]} height=${150} zero /></${Card}>
        <${Card} title="Average days in each stage"><${PO.Charts.HBars} data=${tis.map(([l, v]) => ({ label: l, value: v }))} fmt=${(v) => v.toFixed(1) + ' d'} /></${Card}>
        <${Card} title="Open roles by site"><${PO.Charts.HBars} data=${[...new Set(jobs.map((j) => j.site))].map((s) => ({ label: PO.site(s).name, value: jobs.filter((j) => j.site === s).reduce((t, j) => t + +j.openings, 0) }))} fmt=${(v) => PO.plural(v, 'opening')} /></${Card}>
      </div>
    </div>`;
  }

  function BoardsPanel({ P, jobs, pool }) {
    const [conn, setConn] = PO.useCoState('hiring.boardsConn', Object.fromEntries(boardNames(P).map((b) => [b, true])));
    return html`<${Card} title="Job boards" sub=${`${Object.values(conn).filter(Boolean).length} of ${BOARDS[P.id].length} connected`} flush foot=${html`<span class="muted t-sm grow">Referred candidates are hired twice as often and stay longer. A referral drive costs nothing until someone is hired.</span><${Button} size="sm" onClick=${() => PO.toast('Referral bonus campaign scheduled for Monday by email and on the employee portal')}>Run a referral drive</${Button}>`}>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Board</th><th>Pricing</th><th class="r">Live jobs</th><th class="r">Applicants (30 d)</th><th class="r">Hired</th><th>Status</th><th style="width:60px"></th></tr></thead>
      <tbody>${BOARDS[P.id].map(([b, cost]) => { const s = shortBoard(b); const l = pool.filter((c) => c.source === s); const live = jobs.filter((j) => j.sources.includes(s)).length; return html`<tr>
        <td><div class="row"><span class="tl-mono">${b[0]}</span><b class="w-550">${b}</b></div></td><td class="muted">${cost}</td><td class="r tnum">${conn[b] ? live : 0}</td><td class="r tnum">${l.length}</td><td class="r tnum">${l.filter((c) => c.stage === 'Hired').length}</td><td><${Status} s=${conn[b] ? 'Connected' : 'Disconnected'} /></td>
        <td class="r"><${Switch} on=${conn[b]} onChange=${(v) => { setConn({ ...conn, [b]: v }); PO.toast(v ? `${b} connected` : `${b} disconnected, jobs taken down`); }} /></td></tr>`; })}</tbody></table></div>
    </${Card}>`;
  }

  /* =====================================================================
     PERFORMANCE
     ===================================================================== */
  const BOX = [ // [perf 0..2][pot 0..2] → name, tone
    [['Underperformer', 'r'], ['Inconsistent', 'a'], ['Enigma', 'a']],
    [['Effective', 's'], ['Core player', 'b'], ['High potential', 't']],
    [['Trusted professional', 'b'], ['Strong performer', 't'], ['Star', 'g']],
  ];
  const perfLvl = (r) => (r <= 2 ? 0 : r === 3 ? 1 : 2);
  function potLvl(P, p) { const r = PO.seeded('pot' + P.id + p.id); const s = r.rnd() * 0.8 + (['sup', 'lead', 'office', 'tech', 'spec'].includes(p.role) ? 0.3 : 0) + (p.age < 32 ? 0.12 : 0) + (p.rating >= 4 ? 0.1 : 0); return s < 0.42 ? 0 : s < 0.82 ? 1 : 2; }
  const ANS = {
    in: ['I did not miss a single night shift in September and covered for Ravi twice when he was sick.', 'I want to become a site in-charge. I have started helping new guards with the visitor register.', 'The paper gate register was slow; the site QR clock-in helped.'],
    us: ['I trained two new baristas on the espresso bar and kept ticket times under 4 minutes on weekends.', 'I’d like to move towards shift lead and learn ordering and inventory.', 'More notice when the schedule changes would help me plan school.'],
    uk: ['I passed the infection control audit on Ward 7 and covered three extra nights during the outbreak.', 'I would like to train as a team leader and do the COSHH assessor course.', 'Night rotas sometimes come out late; earlier rotas would help with childcare.'],
  };
  const QS = ['What went well this period?', 'What do you want to get better at, or try next?', 'What would help you do your job better?'];

  function Performance({ query = {} }) {
    const P = PO.P();
    const sc = useScope();
    const [tab, setTab] = PO.useCoState('perf.tab', 'cycle');
    useEffect(() => { if (query.tab) setTab(query.tab); }, [query.tab]);
    const [reviews, setReviews] = PO.useCoState('perf.reviews', {});
    const [calib, setCalib] = PO.useCoState('perf.calib', {});
    const [nudged, setNudged] = PO.useCoState('perf.nudged', false);
    const [open, setOpen] = useState(null);
    const people = useMemo(() => sc.people.filter((p) => p.id !== P.topId).map((p) => { const rv = reviews[p.id] || {}; return { ...p, rs: rv.status || p.reviewStatus, rt: calib[p.id] || rv.rating || p.rating, pot: potLvl(P, p) }; }), [P.id, sc.people.length, reviews, calib]);
    const n = people.length || 1;
    const cnt = (s) => people.filter((p) => p.rs === s).length;
    const selfDone = people.filter((p) => p.rs !== 'Not started').length;
    const mgrDone = people.filter((p) => p.rs === 'Manager review' || p.rs === 'Completed').length;
    const goals = people.flatMap((p) => p.goals.map((g) => ({ ...g, p })));
    const onTrack = goals.filter((g) => g.pct >= 60).length;
    const avg = people.reduce((t, p) => t + p.rt, 0) / n;
    const openP = open ? people.find((p) => p.id === open) : null;
    const C = P.reviewCycle;
    const left = days(PO.TODAY, C.closes);
    return html`
      <${PageHeader} title="Performance" sub=${`${C.name} runs ${PO.date(C.opens, { short: true })} to ${PO.date(C.closes, { short: true })} for ${sc.role === 'manager' ? `your team of ${people.length}` : PO.plural(people.length, 'person', 'people')}. Closes in ${PO.plural(left, 'day')}.`} actions=${html`
        <${Button} icon="Grid3x3" onClick=${() => setTab('nine')}>9-box</${Button}>
        <${Button} kind="primary" icon="BellRing" disabled=${nudged || !cnt('Not started')} onClick=${() => { setNudged(true); PO.toast(`Reminder sent by email and SMS to ${PO.plural(cnt('Not started'), 'person', 'people')} who haven't started`, { icon: 'BellRing', action: { label: 'Undo', run: () => setNudged(false) } }); }}>${nudged ? 'Reminders sent' : `Remind ${cnt('Not started')} not started`}</${Button}>
        <${Menu} align="right" width=${220} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'Export reviews', icon: 'Download', onClick: () => PO.exportCsv('reviews', [['Name', 'Site', 'Status', 'Rating', 'Potential'], ...people.map((p) => [p.name, PO.site(p.site).name, p.rs, p.rt, ['Low', 'Medium', 'High'][p.pot]])]) },
          { label: 'Review form template', icon: 'FileText', onClick: () => PO.toast('Review form opened: 3 questions and a 5-point rating') },
          { label: 'Cycle settings', icon: 'Settings', onClick: () => PO.toast('Cycle dates, reviewers and rating scale') },
        ]} />`} />
      <${PO.KpiStrip} items=${[
        { label: 'Self reviews done', icon: 'PenLine', accent: 'blue', faces: people.filter((p) => p.rs === 'Not started').map((p) => p.id), value: String(selfDone), unit: `/${people.length}`, alert: cnt('Not started') / n > 0.25, bar: [{ v: selfDone, k: 'ok', title: `${selfDone} done` }, { v: cnt('Not started'), k: 'warn', title: `${cnt('Not started')} not started` }], sub: `${cnt('Not started')} not started, due ${PO.date(C.closes, { short: true, noYear: true })}` },
        { label: 'Manager reviews', icon: 'ClipboardCheck', accent: 'green', value: String(mgrDone), unit: `/${people.length}`, bar: [{ v: mgrDone, k: 'ok' }, { v: people.length - mgrDone, k: 'mute' }], sub: 'Opens fully after self reviews' },
        { label: 'Goals on track', icon: 'Target', accent: 'amber', value: PO.pct(onTrack / (goals.length || 1)), bar: [{ v: onTrack, k: 'ok', title: `${onTrack} on track` }, { v: goals.length - onTrack, k: 'warn', title: `${goals.length - onTrack} behind` }], sub: `${onTrack} of ${goals.length} goals` },
        { label: 'Average rating', icon: 'Star', accent: 'violet', value: avg.toFixed(2), unit: '/5', sub: 'Before calibration' },
      ]} />
      <div class="mt-24"><${Tabs} tabs=${[['cycle', 'Review cycle'], ['nine', '9-box'], ['goals', 'Goals & OKRs', goals.length], ['ones', '1:1s'], ['feedback', 'Feedback'], ['calib', 'Calibration']]} value=${tab} onChange=${setTab} /></div>
      ${tab === 'cycle' ? html`<${CycleTab} P=${P} people=${people} cnt=${cnt} onOpen=${setOpen} />` : null}
      ${tab === 'nine' ? html`<${NineBox} P=${P} people=${people} onOpen=${setOpen} />` : null}
      ${tab === 'goals' ? html`<${GoalsTab} P=${P} people=${people} goals=${goals} />` : null}
      ${tab === 'ones' ? html`<${OneOnOnes} P=${P} people=${people} sc=${sc} />` : null}
      ${tab === 'feedback' ? html`<${FeedbackFeed} P=${P} people=${people} compact=${false} />` : null}
      ${tab === 'calib' ? html`<${Calibration} P=${P} people=${people} calib=${calib} setCalib=${setCalib} onOpen=${setOpen} />` : null}
      ${openP ? html`<${ReviewDrawer} P=${P} p=${openP} onClose=${() => setOpen(null)} save=${(v) => setReviews({ ...reviews, [openP.id]: { ...(reviews[openP.id] || {}), ...v } })} />` : null}`;
  }

  function CycleTab({ P, people, cnt, onOpen }) {
    const statuses = ['Not started', 'Self review done', 'Manager review', 'Completed'];
    const sites = P.sites.filter((s) => people.some((p) => p.site === s.id));
    const dist = [1, 2, 3, 4, 5].map((r) => people.filter((p) => p.rt === r).length);
    const guide = [0.03, 0.12, 0.5, 0.28, 0.07].map((f) => Math.round(f * people.length));
    const us = P.id === 'us';
    const n = people.length || 1;
    const phases = [
      ['Self review', `${PO.date(P.reviewCycle.opens, { short: true })} – ${us ? 'Oct 15' : '15 Oct'}`, `${people.length - cnt('Not started')} of ${people.length} done`, true],
      ['Manager review', us ? 'Oct 16 – 24' : '16 – 24 Oct', `${cnt('Manager review') + cnt('Completed')} submitted`],
      ['Calibration', us ? 'Oct 27 – 29' : '27 – 29 Oct', 'Not started'],
      ['Share & sign', us ? 'By Oct 31' : 'By 31 Oct', 'Not started'],
    ];
    return html`<div class="grid g-main" style="align-items:start">
      <${DataTable} rows=${people} exportName="review-status" search=${(p) => p.name + ' ' + p.title} searchPlaceholder="Search people" onRow=${(p) => onOpen(p.id)} pageSize=${10}
        initialSort=${{ key: 'rs', dir: 'asc' }}
        filters=${[{ key: 'rs', label: 'Status', options: statuses, test: (p, v) => p.rs === v }, { key: 'site', label: 'Site', options: sites.map((s) => [s.id, s.name]), test: (p, v) => p.site === v }]}
        columns=${[
          { key: 'name', label: 'Employee', render: (p) => html`<${Who} p=${p} />`, sort: (p) => p.name },
          { key: 'site', label: 'Site', render: (p) => PO.site(p.site).name, sort: (p) => PO.site(p.site).name, csv: (p) => PO.site(p.site).name },
          { key: 'mgr', label: 'Reviewer', render: (p) => (p.manager ? PO.person(p.manager).name : '—'), sort: (p) => (p.manager ? PO.person(p.manager).name : ''), csv: (p) => (p.manager ? PO.person(p.manager).name : '') },
          { key: 'rs', label: 'Status', render: (p) => html`<${Status} s=${p.rs} />`, sort: (p) => statuses.indexOf(p.rs) },
          { key: 'goals', label: 'Goals', align: 'r', render: (p) => html`<span class="tnum">${Math.round(p.goals.reduce((t, g) => t + g.pct, 0) / p.goals.length)}%</span>`, sort: (p) => p.goals.reduce((t, g) => t + g.pct, 0) / p.goals.length },
          { key: 'rt', label: 'Rating', align: 'r', render: (p) => html`<span class="tnum">${p.rt}</span><span class="faint"> / 5</span>` },
        ]} />
      <div class="col" style="gap:16px;min-width:0">
        <${Card} icon="CalendarRange" accent="blue" title="Cycle" flush>
          ${phases.map(([t, when, st, cur]) => html`<div class="tl-row"><span style=${`width:7px;height:7px;border-radius:50%;flex:none;background:${cur ? 'var(--ink)' : 'var(--border-strong)'}`}></span><div class="grow" style="min-width:0"><div class=${cur ? 'w-600' : 'w-500 muted'}>${t}</div><div class="faint t-xs">${when}</div></div><span class=${'t-sm tnum ' + (cur ? '' : 'faint')}>${st}</span></div>`)}
        </${Card}>
        <${Card} icon="ChartColumn" accent="violet" title="Rating distribution" sub="Actual vs guideline">
          <${PO.Charts.Bars} labels=${['1', '2', '3', '4', '5']} series=${[{ name: 'Current', data: dist, color: 'var(--chart-1)' }, { name: 'Guideline', data: guide, color: 'var(--chart-5)' }]} height=${150} /></${Card}>
        <${Card} icon="MapPin" accent="teal" title="Self reviews by site" flush>${sites.slice(0, 7).map((s) => { const l = people.filter((p) => p.site === s.id); const d = l.filter((p) => p.rs !== 'Not started').length; return html`<div class="tl-row" style="padding:8px 16px"><span class="grow ellipsis">${s.name}</span><span style="width:90px;flex:none"><${Progress} value=${(d / (l.length || 1)) * 100} tone=${d / (l.length || 1) < 0.35 ? 'amber' : ''} /></span><span class="faint t-sm tnum" style="width:44px;text-align:right">${d}/${l.length}</span></div>`; })}</${Card}>
      </div>
    </div>`;
  }

  function NineBox({ P, people, onOpen }) {
    const [pick, setPick] = useState('2-2');
    const [pf, pt] = pick.split('-').map(Number);
    const inBox = people.filter((p) => perfLvl(p.rt) === pf && p.pot === pt);
    return html`<div class="grid g-main" style="align-items:start">
      <div class="card" style="padding:16px"><div class="tl-9">
        ${[2, 1, 0].map((pot) => html`<div class="ax v">${['Low', 'Medium', 'High'][pot]} potential</div>${[0, 1, 2].map((perf) => { const l = people.filter((p) => perfLvl(p.rt) === perf && p.pot === pot); const [nm] = BOX[perf][pot]; const [bic, bac] = perf === 2 && pot === 2 ? ['Star', 'green'] : perf === 0 && pot === 0 ? ['TriangleAlert', 'red'] : perf + pot >= 3 ? ['TrendingUp', 'teal'] : perf + pot === 2 ? ['CircleDot', 'blue'] : ['Sprout', 'amber']; return html`<div class=${`tl-box tl-acc-${bac} ${perf + pot >= 3 ? 'g' : ''} ${pick === perf + '-' + pot ? 'on' : ''}`} onClick=${() => setPick(perf + '-' + pot)}><div class="row" style="gap:8px"><${PO.Chip} icon=${bic} accent=${bac} size=${13} /><span class="w-550 ellipsis">${nm}</span><span class="right faint t-xs tnum">${PO.pct(l.length / (people.length || 1))}</span></div><b class="n">${l.length}</b>${l.length ? html`<${AvatarStack} ids=${l.map((p) => p.id)} max=${5} size="" />` : html`<span class="faint t-xs">Nobody here</span>`}</div>`; })}`)}
        <div></div>${['Low', 'Medium', 'High'].map((x) => html`<div class="ax">${x} performance</div>`)}
      </div><p class="faint t-xs mt-12">Performance is this cycle's rating after calibration. Potential combines role scope, learning pace and manager input; it is a talking point, not a label shared with the employee.</p></div>
      <${Card} icon="Grid3x3" accent="green" title=${BOX[pf][pt][0]} sub=${PO.plural(inBox.length, 'person', 'people')} flush actions=${html`<${Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: 'Export this box', icon: 'Download', onClick: () => PO.exportCsv('9-box-' + BOX[pf][pt][0].toLowerCase().replace(/ /g, '-'), [['Name', 'Title', 'Site', 'Rating'], ...inBox.map((p) => [p.name, p.title, PO.site(p.site).name, p.rt])]) }, pf === 2 && pt === 2 && inBox.length ? { label: 'Nominate for supervisor track', icon: 'GraduationCap', onClick: () => PO.toast(`${PO.plural(inBox.length, 'star')} nominated for the supervisor development track`) } : null]} />`}>
        <div style="max-height:480px;overflow:auto">${inBox.length ? inBox.map((p) => html`<div class="list-item clickable" onClick=${() => onOpen(p.id)}><${Who} p=${p} sub=${`${p.title}, ${PO.site(p.site).name}`} link=${false} /><span class="right tnum t-sm">${p.rt}<span class="faint"> / 5</span></span></div>`) : html`<${Empty} icon="Grid3x3" title="Nobody in this box" text="That's usually good news for the bottom-left boxes." />`}</div>
      </${Card}>
    </div>`;
  }

  function GoalsTab({ P, people, goals }) {
    const [prog, setProg] = PO.useCoState('perf.goalProg', {});
    const avgOf = (re) => { const l = goals.filter((g) => re.test(g.t)); return l.length ? Math.round(l.reduce((t, g) => t + (prog[g.p.id + g.t] ?? g.pct), 0) / l.length) : 0; };
    const okrs = P.id === 'in' ? [['Every post covered, every shift', [['Attendance above 97% at all sites', avgOf(/Attendance|On-time/)], ['Zero client escalations at site', avgOf(/escalation/)], ['Shift fill rate 99%', 88]]], ['A safer, better-trained workforce', [['100% guards complete safety refresher', avgOf(/safety/)], ['Two trained backups per site', avgOf(/Train two/)]]]]
      : P.id === 'us' ? [['Great coffee, on time, every shift', [['Shift fill rate above 98%', avgOf(/fill rate|On-time/)], ['Labour cost under 28% of sales', avgOf(/Labour/)], ['Drive-up ticket time under 4 min', 72]]], ['Grow our own leads', [['Two trained backups per café', avgOf(/Train two/)], ['Everyone has a food handler card', avgOf(/safety/)]]]]
        : [['Pass every client audit', [['Every client audit passed', avgOf(/audit/)], ['On-time attendance 98%', avgOf(/On-time|fill rate/)]]], ['Skilled, safe teams', [['COSHH & safety refresher for all', avgOf(/safety/)], ['Two trained backups per site', avgOf(/Train two/)]]]];
    const st = (v) => (v >= 70 ? 'On track' : v >= 45 ? 'At risk' : 'Behind');
    return html`<div class="grid g-2">${okrs.map(([o, krs]) => { const v = Math.round(krs.reduce((t, k) => t + k[1], 0) / krs.length); return html`<${Card} title=${o} sub=${`Q4 objective, ${v}% complete`}>
        <div class="col" style="gap:12px">${krs.map(([k, val]) => html`<div><div class="row t-sm" style="margin-bottom:4px"><span class="grow">${k}</span>${val >= 70 ? html`<span class="faint t-xs">On track</span>` : html`<${Badge} tone=${val >= 45 ? 'amber' : 'red'} dot>${st(val)}</${Badge}>`}</div><${Progress} value=${val} tone=${val >= 70 ? '' : val >= 45 ? 'amber' : 'red'} label=${val + '%'} /></div>`)}</div></${Card}>`; })}
      <div class="span-all"><${DataTable} rows=${goals} rowKey=${(g) => g.p.id + g.t} exportName="goals" pageSize=${12} search=${(g) => g.p.name + ' ' + g.t} searchPlaceholder="Search goals or people"
        filters=${[{ key: 'st', label: 'Status', options: ['On track', 'At risk', 'Behind'], test: (g, v) => st(prog[g.p.id + g.t] ?? g.pct) === v }, { key: 'site', label: 'Site', options: P.sites.map((s) => [s.id, s.name]), test: (g, v) => g.p.site === v }]}
        columns=${[
          { key: 'who', label: 'Owner', render: (g) => html`<${Who} p=${g.p} size="sm" />`, sort: (g) => g.p.name, csv: (g) => g.p.name },
          { key: 't', label: 'Goal', render: (g) => html`<b class="w-500">${g.t}</b><div class="faint t-xs">${okrs[/safety|Train|backup/i.test(g.t) ? 1 : 0][0]}</div>`, csv: (g) => g.t },
          { key: 'due', label: 'Due', render: () => PO.date(P.reviewCycle.closes, { short: true }), sort: false, csv: () => P.reviewCycle.closes },
          { key: 'pct', label: 'Progress', width: 220, render: (g) => { const v = prog[g.p.id + g.t] ?? g.pct; return html`<div class="row" style="gap:8px"><input type="range" min="0" max="100" step="5" value=${v} style="flex:1;accent-color:var(--brand)" onClick=${(e) => e.stopPropagation()} onChange=${(e) => { setProg({ ...prog, [g.p.id + g.t]: +e.target.value }); PO.toast(`Progress updated: ${g.t}`); }} /><b class="tnum" style="width:36px;text-align:right">${v}%</b></div>`; }, sort: (g) => prog[g.p.id + g.t] ?? g.pct },
          { key: 'st', label: 'Status', render: (g) => { const v = prog[g.p.id + g.t] ?? g.pct; return v >= 70 ? html`<span class="muted">${v >= 100 ? 'Done' : 'On track'}</span>` : html`<${Badge} tone=${v >= 45 ? 'amber' : 'red'} dot>${st(v)}</${Badge}>`; }, sort: (g) => prog[g.p.id + g.t] ?? g.pct },
        ]} /></div></div>`;
  }

  function OneOnOnes({ P, people, sc }) {
    const [done, setDone] = PO.useCoState('perf.ones', {});
    const [points, setPoints] = PO.useCoState('perf.points', {});
    const [add, setAdd] = useState(null);
    const [txt, setTxt] = useState('');
    const list = useMemo(() => {
      const r = PO.seeded('ones' + P.id + sc.viewer.id);
      const pairs = people.filter((p) => p.manager && (sc.role !== 'manager' || p.manager === sc.viewer.id) && p.manager !== P.topId).slice(0, 60);
      return r.shuffle(pairs).slice(0, 9).map((p, i) => ({ id: 'oo' + p.id, p, m: PO.person(p.manager), on: PO.addDays(PO.TODAY, Math.floor(i / 2)), at: [10, 11, 14, 15, 16][i % 5] * 60 + (i % 2) * 30, topics: r.shuffle([P.id === 'in' ? 'Night shift rotation for November' : 'Holiday-season schedule', 'Progress on goals', 'Self review: what went well', 'Training: ' + (P.id === 'in' ? 'fire drill certificate' : P.id === 'us' ? 'food handler renewal' : 'COSHH refresher'), 'Feedback from the client', 'Career: next role']).slice(0, 3) }));
    }, [P.id, people.length]);
    return html`<div class="grid g-main">
      <${Card} title="Upcoming 1:1s" sub=${`${list.length} this week`} flush actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => PO.toast('Recurring 1:1s scheduled every other week for your team')}>Schedule recurring</${Button}>`}>
        ${list.map((o) => html`<div class="list-item" style="align-items:flex-start;padding:12px 16px">
          <div style="width:64px;flex:none" class="t-sm"><b class="w-600">${PO.rel(o.on)}</b><div class="faint tnum">${P.hhmm(o.at)}</div></div>
          <div class="grow" style="min-width:0"><div class="row"><${Who} p=${o.p} size="sm" sub=${`with ${o.m.name}`} />${done[o.id] ? html`<span class="right"><${Status} s="Done" /></span>` : null}</div>
            <div class="col mt-8" style="gap:4px">${[...o.topics, ...(points[o.id] || [])].map((t) => html`<div class="t-sm muted">· ${t}</div>`)}</div>
            ${add === o.id ? html`<div class="row mt-8"><input class="input" style="height:28px" placeholder="Add a talking point" value=${txt} onInput=${(e) => setTxt(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && txt.trim()) { setPoints({ ...points, [o.id]: [...(points[o.id] || []), txt.trim()] }); setTxt(''); setAdd(null); } }} /><${Button} size="sm" kind="primary" onClick=${() => { if (txt.trim()) setPoints({ ...points, [o.id]: [...(points[o.id] || []), txt.trim()] }); setTxt(''); setAdd(null); }}>Add</${Button}></div>` : null}
          </div>
          <div class="row" style="gap:4px;flex:none"><${IconButton} icon="Plus" size="sm" title="Add talking point" onClick=${() => setAdd(o.id)} /><${Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: done[o.id] ? 'Mark not done' : 'Mark done', icon: 'Check', onClick: () => setDone({ ...done, [o.id]: !done[o.id] }) }, { label: 'Reschedule to tomorrow', icon: 'CalendarClock', onClick: () => PO.toast(`1:1 with ${o.p.first} moved to tomorrow, ${P.hhmm(o.at)}`) }, { label: 'Email the agenda', icon: 'Mail', onClick: () => PO.toast(`Agenda sent to ${o.p.first}`) }]} /></div>
        </div>`)}
      </${Card}>
      <div class="col" style="gap:16px">
        <${Callout} tone="amber" icon="TriangleAlert" title=${`${Math.round(people.length * 0.12)} people haven't had a 1:1 in 30 days`} action=${html`<${Button} size="sm" onClick=${() => PO.toast('Managers reminded to book a 1:1')}>Remind</${Button}>`}>Mostly night-shift staff. Try a 10-minute check-in at shift handover.</${Callout}>
        <${Card} title="1:1 health" flush>${[['Held on time', '86%'], ['Average gap between 1:1s', '16 days'], ['No 1:1 in 30 days', String(Math.round(people.length * 0.12))]].map(([k, v]) => html`<div class="tl-row"><span class="grow muted">${k}</span><b class="tnum w-600">${v}</b></div>`)}</${Card}>
        <${Card} title="Suggested agenda"><ol class="t-sm" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">${['How did the last two weeks go?', 'Anything blocking you on shift?', 'Goal check-in: what moved?', 'One thing I can do to help'].map((t) => html`<li>${t}</li>`)}</ol></${Card}>
      </div>
    </div>`;
  }

  /* kudos feed: shared by performance (feedback), engagement (recognition) and self-service (feedback received) */
  const VALUES = { in: ['Always alert', 'Team first', 'Client delight', 'Integrity'], us: ['Hospitality', 'Craft', 'Hustle', 'Kindness'], uk: ['Pride in clean', 'Safety first', 'Team player', 'Above and beyond'] };
  function kudosSeed(P) {
    const r = PO.seeded('kudos' + P.id);
    const msgs = P.id === 'in' ? ['Stopped an unauthorised vehicle at the gate at 2 am and followed protocol perfectly.', 'Covered a double shift when Ravi was sick, without being asked.', 'The client’s facility manager called to praise the clean lobby.', 'Helped a visitor in a wheelchair all the way to the lift.', 'Trained three new guards on the visitor register this week.', 'Found a fire extinguisher past its date and got it replaced the same day.']
      : P.id === 'us' ? ['Handled the 7am rush solo when the other opener was late. Zero remakes!', 'Her sourdough scored 10/10 in the quality check.', 'Stayed late to help close after the catering order ran over.', 'A customer emailed to say he made her day.', 'Trained our two new baristas on latte art.', 'Caught an allergen labelling mistake before it went out.']
        : ['Ward 7 scored 98% on the infection control audit.', 'Covered three night shifts during the norovirus outbreak.', 'The client at MediaCityUK sent a thank-you note for the event clean-up.', 'Spotted a COSHH storage issue and fixed it the same shift.', 'Showed two new starters the ropes on the floor scrubber.', 'Turned around the T2 toilets in record time before the morning peak.'];
    const pool = P.people.filter((p) => p.role !== 'office');
    const hero = P.hero;
    const order = r.shuffle(msgs.map((_, k) => k));
    const out = Array.from({ length: 10 }, (_, i) => { const to = i === 1 ? hero : r.pick(pool); const from = PO.person(to.manager) || P.byId[P.hrId]; return { id: 'k' + i, to: to.id, from: (i % 3 === 2 ? r.pick(pool) : from).id, text: i === 1 ? msgs[1] : msgs[order[i % msgs.length]], value: r.pick(VALUES[P.id]), at: PO.addDays(PO.TODAY, -Math.floor(i / 2)), claps: r.int(2, 24) }; });
    return out;
  }
  PO.talentKudos = kudosSeed;

  function FeedbackFeed({ P, people, compact, canGive = true }) {
    const base = useMemo(() => kudosSeed(P), [P.id]);
    const [added, setAdded] = PO.useCoState('eng.kudos', []);
    const [claps, setClaps] = PO.useCoState('eng.claps', {});
    const [to, setTo] = useState('');
    const [txt, setTxt] = useState('');
    const [val, setVal] = useState(VALUES[P.id][0]);
    const v = PO.viewer();
    const scopeIds = new Set(people.map((p) => p.id));
    const feed = [...added, ...base].filter((k) => !people || scopeIds.has(k.to) || added.includes(k));
    const pickable = people.filter((p) => p.id !== v.id).slice(0, 200);
    return html`<div class="grid g-main" style="align-items:start">
      <${Card} icon="Award" accent="amber" title="Recognition & feedback" sub=${PO.plural(feed.length, 'post')} flush>
        ${feed.map((k) => { const t = PO.person(k.to), f = PO.person(k.from); const on = claps[k.id]; return html`<div class="tl-feed"><span class="tl-pair" title=${`${f.name} to ${t.name}`}><${Avatar} p=${t} size="lg" /><${Avatar} p=${f} size="sm" /></span>
          <div class="grow" style="min-width:0"><div class="t-sm"><a class="w-600" href=${PO.href('people/' + t.id)}>${t.name}</a> <span class="muted">was recognised by</span> <b class="w-600">${f.name}</b> <span class="faint">${PO.rel(k.at).toLowerCase()}</span></div>
            <div class="mt-4">${k.text}</div>
            <div class="row mt-8" style="gap:6px"><span class="tl-val"><${Icon} n="Award" size=${13} />${k.value}</span><button class=${'tl-react ' + (on ? 'on' : '')} onClick=${() => setClaps({ ...claps, [k.id]: !on })} title="Applaud"><${Icon} n="ThumbsUp" size=${12} /><span class="tnum">${k.claps + (on ? 1 : 0)}</span></button><button class="tl-react" onClick=${() => PO.toast(`Reply sent to ${t.first}`)}><${Icon} n="MessageCircle" size=${12} /> Reply</button></div></div>
          </div>`; })}
      </${Card}>
      ${canGive ? html`<${Card} icon="ThumbsUp" accent="green" title="Give kudos" sub="Also sent to them by email">
        <div class="col" style="gap:12px">
          <${Field} label="To"><select class="select" value=${to} onChange=${(e) => setTo(e.target.value)}><option value="">Choose a colleague</option>${pickable.map((p) => html`<option value=${p.id}>${p.name}, ${PO.site(p.site).name}</option>`)}</select></${Field}>
          <${Field} label="Value"><div class="row wrap" style="gap:6px">${VALUES[P.id].map((x) => html`<button class="tl-chip" aria-pressed=${val === x} onClick=${() => setVal(x)}>${x}</button>`)}</div></${Field}>
          <${Field} label="What did they do?"><textarea class="textarea" rows="3" style="height:auto;padding:8px 10px" value=${txt} onInput=${(e) => setTxt(e.target.value)} placeholder="Be specific: what happened and why it mattered"></textarea></${Field}>
          <${Button} kind="primary" icon="Send" disabled=${!to || !txt.trim()} onClick=${() => { setAdded([{ id: 'ku' + Date.now(), to, from: v.id, text: txt.trim(), value: val, at: PO.TODAY, claps: 0 }, ...added]); setTxt(''); setTo(''); PO.toast(`Kudos sent to ${PO.person(to).first}`, { icon: 'Check' }); }}>Post kudos</${Button}>
        </div></${Card}>` : null}
    </div>`;
  }

  function Calibration({ P, people, calib, setCalib, onOpen }) {
    const [site, setSite] = useState('');
    const l = people.filter((p) => !site || p.site === site);
    const dist = [5, 4, 3, 2, 1].map((r) => l.filter((p) => p.rt === r));
    const guide = { 5: 0.07, 4: 0.28, 3: 0.5, 2: 0.12, 1: 0.03 };
    const changed = Object.keys(calib).filter((id) => l.some((p) => p.id === id)).length;
    return html`<div class="row" style="margin-bottom:12px"><${Select} value=${site} onChange=${setSite} options=${[['', 'All sites'], ...P.sites.map((s) => [s.id, s.name])]} width=${220} /><span class="faint t-sm">${changed ? PO.plural(changed, 'rating') + ' adjusted in calibration' : 'Move people between columns to calibrate'}</span>
      <span class="right row" style="gap:8px">${changed ? html`<${Button} size="sm" kind="ghost" icon="RotateCcw" onClick=${() => { setCalib({}); PO.toast('Calibration changes cleared'); }}>Reset</${Button}>` : null}<${Button} size="sm" icon="Lock" onClick=${() => PO.toast('Calibration locked. Managers can now share reviews.', { icon: 'Lock' })}>Lock calibration</${Button}></span></div>
      <div class="tl-kan" style="grid-template-columns:repeat(5,minmax(210px,1fr))">${dist.map((list, i) => { const r = 5 - i; const g = Math.round(guide[r] * l.length); const over = list.length > g * 1.3 + 1; const ca = ['red', 'amber', 'blue', 'teal', 'green'][r - 1]; return html`<div class=${'tl-col tl-acc-' + ca}><div class="tl-col-h"><span class=${'chip-ic ' + ca} style="font-family:var(--num);font-size:13px;font-weight:600">${r}</span>${['Needs work', 'Below', 'Solid', 'Strong', 'Exceptional'][r - 1]}<span class="n">${list.length}</span><span class="right t-xs w-500" style=${over ? 'color:var(--amber)' : 'color:var(--text-3)'}>guide ${g}</span></div>
        <div class="tl-col-b" style="max-height:520px">${list.slice(0, 40).map((p) => html`<div class="tl-cc" style="padding:8px" onClick=${() => onOpen(p.id)}><div class="row" style="gap:8px"><${Avatar} p=${p} /><div class="grow" style="min-width:0"><b class="w-550 ellipsis" style="display:block">${p.name}</b><span class="faint t-xs ellipsis" style="display:block">${PO.site(p.site).name}</span></div>${calib[p.id] ? html`<span class="faint t-xs">moved</span>` : null}
          <span onClick=${(e) => e.stopPropagation()}><${Menu} align="right" trigger=${html`<${IconButton} icon="ArrowUpDown" size="sm" title="Change rating" />`} items=${[{ header: 'Calibrated rating' }, ...[5, 4, 3, 2, 1].map((x) => ({ label: `${x} star${x > 1 ? 's' : ''}`, checked: p.rt === x, onClick: () => { setCalib({ ...calib, [p.id]: x }); PO.toast(`${p.name} calibrated to ${x}`); } }))]} /></span></div></div>`)}${list.length > 40 ? html`<div class="faint t-xs" style="text-align:center">+${list.length - 40} more</div>` : null}${!list.length ? html`<div class="tl-empty">Nobody rated ${r} yet</div>` : null}</div></div>`; })}</div>`;
  }

  function ReviewDrawer({ P, p, onClose, save }) {
    const answers = ANS[P.id];
    const [rating, setRating] = useState(p.rt);
    const [comment, setComment] = useState(p.rs === 'Completed' ? 'Reliable and calm under pressure. Ready to train others.' : '');
    const mgr = p.manager ? PO.person(p.manager) : null;
    const selfDone = p.rs !== 'Not started';
    return html`<${Drawer} open size="lg" onClose=${onClose} head=${html`<div class="row grow" style="gap:12px"><${Avatar} p=${p} size="lg" /><div><h3>${p.name}</h3><div class="faint t-sm">${p.title}, ${PO.site(p.site).name}, ${P.reviewCycle.name}</div></div><span class="right"><${Status} s=${p.rs} /></span></div>`}
      footer=${html`<${Button} onClick=${() => { save({ rating, comment }); PO.toast('Draft saved'); }}>Save draft</${Button}><${Button} kind="primary" icon="Send" onClick=${() => { save({ rating, comment, status: 'Completed' }); PO.toast(`Review for ${p.first} submitted for calibration`); onClose(); }}>Submit review</${Button}>`}>
      <div class="tl-facts"><div><span>Tenure</span><b>${PO.tenure(p.tenureMonths)}</b></div><div><span>Attendance (90 d)</span><b class="tnum">${94 + (PO.hueOf(p.id) % 6)}%</b></div><div><span>Last rating</span><b class="tnum">${Math.max(2, p.rating - (PO.hueOf(p.name) % 2))} / 5</b></div></div>
      <div class="tl-sub row">Self review<span class="right faint w-500">${selfDone ? 'Submitted ' + PO.date(PO.addDays(P.reviewCycle.opens, 2 + (PO.hueOf(p.id) % 4)), { short: true }) : ''}</span></div>
      ${selfDone ? html`<div class="col" style="gap:12px">${QS.map((q, i) => html`<div><div class="faint t-xs">${q}</div><div class="mt-4">${answers[i]}</div></div>`)}
        <div class="row t-sm"><span class="muted">Self rating</span><span class="row" style="gap:2px">${[1, 2, 3, 4, 5].map((i) => html`<${Icon} n="Star" size=${14} style=${i <= Math.min(5, p.rating + 1) - 1 + 1 && i <= p.rating ? 'color:var(--amber-solid);fill:var(--amber-solid)' : 'color:var(--border-strong)'} />`)}</span>${P.msg.hero === p.id ? html`<span class="faint t-xs">· via the employee portal</span>` : null}</div></div>` : html`<${Callout} tone="amber" icon="Clock" title=${`${p.first} hasn't started their self review`} action=${html`<${Button} size="sm" icon="BellRing" onClick=${() => PO.toast(`Reminder sent to ${p.first} by email and SMS, with a link to the self review`)}>Send reminder</${Button}>`}>Frontline staff answer three short questions in the employee portal. It takes about five minutes on any phone or computer.</${Callout}>`}
      <div class="tl-sub">Goals</div>
      <div class="col" style="gap:8px">${p.goals.map((g) => html`<div><div class="row t-sm" style="margin-bottom:4px"><span class="grow">${g.t}</span></div><${Progress} value=${g.pct} tone=${g.pct >= 45 ? '' : 'amber'} label=${g.pct + '%'} /></div>`)}</div>
      <div class="tl-sub">Manager review${mgr ? ', ' + mgr.name : ''}</div>
      <${Field} label="Overall rating"><div class="row" style="gap:2px">${[1, 2, 3, 4, 5].map((i) => html`<button class=${'tl-star ' + (i <= rating ? 'on' : '')} title=${['Needs work', 'Below expectations', 'Solid', 'Strong', 'Exceptional'][i - 1]} onClick=${() => setRating(i)}><${Icon} n="Star" size=${22} style=${i <= rating ? 'fill:var(--amber-solid)' : ''} /></button>`)}<span class="muted t-sm" style="margin-left:8px">${['Needs work', 'Below expectations', 'Solid', 'Strong', 'Exceptional'][rating - 1]}</span></div></${Field}>
      <div class="mt-12"><${Field} label="Comments" hint="Shared with the employee after calibration."><textarea class="textarea" rows="4" style="height:auto;padding:8px 10px" value=${comment} onInput=${(e) => setComment(e.target.value)} placeholder=${`What should ${p.first} keep doing, and what's one thing to work on?`}></textarea></${Field}></div>
      <div class="row wrap mt-8" style="gap:6px">${['Reliable on every shift', 'Great with clients', 'Ready to train others', 'Work on punctuality'].map((s) => html`<button class="tl-chip" onClick=${() => setComment((comment ? comment + ' ' : '') + s + '.')}>+ ${s}</button>`)}</div>
    </${Drawer}>`;
  }

  /* =====================================================================
     LEARNING
     ===================================================================== */
  function courses(P) {
    const c = (key, title, icon, mins, format, mandatory, renew, roles, tone) => ({ key, title, icon, mins, format, mandatory, renew, roles, tone });
    if (P.id === 'in') return [
      c('safety', 'Guard safety refresher', 'ShieldCheck', 35, 'Video + quiz', true, 12, ['guard', 'lady', 'sup'], 'blue'),
      c('fire', 'Fire drill & extinguisher use', 'Flame', 45, 'On-site drill', true, 6, null, 'red'),
      c('posh', 'POSH awareness', 'Scale', 30, 'Video + quiz', true, 12, null, 'violet'),
      c('cs', 'Customer service at the gate', 'Smile', 20, 'Micro-lessons in the portal', false, null, ['guard', 'lady', 'hk'], 'teal'),
      c('induct', 'New-joiner induction', 'DoorOpen', 60, 'Classroom + post orders', true, null, null, 'amber'),
      c('first', 'First aid basics', 'HeartPulse', 90, 'Classroom', false, 24, ['sup', 'guard', 'tech'], 'rose'),
    ];
    if (P.id === 'us') return [
      c('foodh', 'Texas food handler', 'BadgeCheck', 75, 'ANSI course + exam', true, 24, ['barista', 'baker', 'lead', 'porter', 'sup'], 'green'),
      c('allergen', 'Food safety & allergens', 'Wheat', 25, 'Video + quiz', true, 12, null, 'amber'),
      c('safety', 'Workplace safety refresher', 'HardHat', 20, 'Video + quiz', true, 12, null, 'blue'),
      c('fire', 'Fire drill & evacuation', 'Flame', 15, 'On-site drill', true, 12, null, 'red'),
      c('cs', 'Customer service the Corner & Crust way', 'Smile', 30, 'Micro-lessons in the portal', false, null, ['barista', 'lead'], 'teal'),
      c('induct', 'New-hire induction', 'DoorOpen', 90, 'In café + online', true, null, null, 'violet'),
    ];
    return [
      c('coshh', 'COSHH awareness', 'FlaskConical', 40, 'Video + quiz', true, 12, null, 'amber'),
      c('manual', 'Manual handling', 'PackageOpen', 30, 'Video + practical', true, 12, null, 'blue'),
      c('ipc', 'Infection prevention & control', 'ShieldPlus', 45, 'NHS e-learning', true, 12, ['domestic', 'sup'], 'rose'),
      c('fire', 'Fire safety & drill', 'Flame', 20, 'On-site drill', true, 12, null, 'red'),
      c('cs', 'Customer service on client sites', 'Smile', 20, 'Micro-lessons in the portal', false, null, ['cleaner', 'spec'], 'teal'),
      c('induct', 'New starter induction', 'DoorOpen', 60, 'Depot + online', true, null, null, 'violet'),
    ];
  }
  function enrolments(P) {
    const out = [];
    courses(P).forEach((c) => P.people.forEach((p) => {
      if (c.roles && !c.roles.includes(p.role)) return;
      if (c.key === 'induct' && p.tenureMonths > 14 && !p.joiner) return;
      const r = PO.seeded('lrn' + P.id + c.key + p.id);
      const pct = p.joiner ? r.pick([0, 20, 50, 100]) : r.pick([100, 100, 100, 100, 100, 100, 100, 100, 80, 50, 0, 100, 30]);
      out.push({ id: c.key + p.id, c: c.key, p: p.id, site: p.site, pct, due: PO.addDays(PO.TODAY, r.int(-10, 30)), done: pct === 100 ? PO.addDays(PO.TODAY, -r.int(5, 200)) : null });
    }));
    return out;
  }
  function certs(P) {
    const defs = P.id === 'in' ? [['PSARA guard training certificate', ['guard', 'lady', 'sup'], 60], ['Fire safety certificate', null, 12], ['First aid (St John Ambulance)', ['sup'], 24]]
      : P.id === 'us' ? [['Texas food handler card', ['barista', 'baker', 'lead', 'porter'], 24], ['Certified food manager (CFM)', ['sup', 'lead'], 60], ['Commercial driver medical card', ['driver'], 24]]
        : [['Enhanced DBS check (update service)', ['domestic', 'sup'], 36], ['COSHH training certificate', null, 12], ['IPAF / PASMA (working at height)', ['spec'], 60]];
    const out = [];
    defs.forEach(([name, roles, months], di) => P.people.forEach((p) => {
      if (roles && !roles.includes(p.role)) return;
      if (!roles && p.role === 'office') return;
      const r = PO.seeded('cert' + P.id + di + p.id);
      if (!roles && !r.chance(0.6)) return;
      const exp = PO.addDays(PO.TODAY, r.chance(0.04) ? -r.int(1, 40) : r.chance(0.08) ? r.int(1, 60) : r.int(61, months * 30));
      out.push({ id: di + p.id, name, p: p.id, issued: PO.addDays(exp, -months * 30), exp, status: exp < PO.TODAY ? 'Expired' : days(PO.TODAY, exp) <= 60 ? 'Expiring soon' : 'Valid' });
    }));
    return out;
  }

  function Learning({ query = {} }) {
    const P = PO.P();
    const sc = useScope();
    const ids = new Set(sc.people.map((p) => p.id));
    const [tab, setTab] = PO.useCoState('learn.view', 'overview');
    useEffect(() => { if (query.tab) setTab(query.tab); }, [query.tab]);
    const [assignOpen, setAssignOpen] = useState(false);
    const [extra, setExtra] = PO.useCoState('learn.assigned', []);
    const [reminded, setReminded] = PO.useCoState('learn.reminded', {});
    const [course, setCourse] = useState(null);
    const C = useMemo(() => courses(P), [P.id]);
    const E = useMemo(() => enrolments(P).filter((e) => ids.has(e.p)), [P.id, ids.size]);
    const X = useMemo(() => certs(P).filter((e) => ids.has(e.p)), [P.id, ids.size]);
    const all = [...E, ...extra];
    const done = all.filter((e) => e.pct === 100).length;
    const overdue = all.filter((e) => e.pct < 100 && e.due < PO.TODAY).length;
    const expiring = X.filter((x) => x.status !== 'Valid').sort((a, b) => a.exp.localeCompare(b.exp));
    const expired = expiring.filter((x) => x.status === 'Expired').length;
    const sites = P.sites.filter((s) => sc.people.some((p) => p.site === s.id));
    const openC = course ? C.find((c) => c.key === course) : null;
    const behind = sites.map((s) => { const l = all.filter((e) => e.site === s.id); return { s, v: l.length ? l.filter((e) => e.pct === 100).length / l.length : 1, od: l.filter((e) => e.pct < 100 && e.due < PO.TODAY).length }; }).sort((a, b) => a.v - b.v);
    const remindCert = (x) => { setReminded({ ...reminded, [x.id]: true }); PO.toast(`${PO.person(x.p).first} reminded to renew by email and SMS`); };
    return html`
      <${PageHeader} title="Learning" sub=${`${C.length} courses, ${C.filter((c) => c.mandatory).length} of them mandatory. ${PO.num(all.length)} assignments, taken in the employee portal.`} actions=${html`
        <${Button} icon="Upload" onClick=${() => PO.toast('Course builder opened. Upload a video or a PDF and add a 5-question quiz.')}>Create course</${Button}>
        <${Button} kind="primary" icon="UserPlus" onClick=${() => setAssignOpen(true)}>Assign course</${Button}>
        <${Menu} align="right" width=${220} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'Export assignments', icon: 'Download', onClick: () => PO.exportCsv('course-assignments', [['Employee', 'Course', 'Progress', 'Due', 'Status'], ...all.map((e) => [PO.person(e.p).name, C.find((c) => c.key === e.c).title, e.pct, e.due, lstat(e)])]) },
          { label: 'Training register (PDF)', icon: 'FileText', onClick: () => PO.fakeDownload('Training register.pdf') },
          { label: 'Completion by site', icon: 'Grid3x3', onClick: () => setTab('sites') },
        ]} />`} />
      <${PO.KpiStrip} items=${[
        { label: 'Completion', icon: 'GraduationCap', accent: 'green', value: String(Math.round((done / (all.length || 1)) * 100)), unit: '%', bar: [{ v: done, k: 'ok', title: `${done} completed` }, { v: all.length - done - overdue, k: 'mute', title: 'in progress or not started' }, { v: overdue, k: 'warn', title: `${overdue} overdue` }], sub: 'Up 6 points on last quarter' },
        { label: 'Overdue', icon: 'AlarmClock', accent: 'amber', faces: [...new Set(all.filter((e) => e.pct < 100 && e.due < PO.TODAY).map((e) => e.p))], value: PO.num(overdue), alert: overdue > 0, sub: 'Assignments past their due date', onClick: () => setTab('people') },
        { label: 'Certificates to renew', icon: 'BadgeCheck', accent: 'red', faces: [...new Set(expiring.map((x) => x.p))], value: String(expiring.length), alert: expired > 0, bar: expiring.length ? [{ v: expired, k: 'bad', title: `${expired} expired` }, { v: expiring.length - expired, k: 'warn', title: `${expiring.length - expired} within 60 days` }] : null, sub: html`${expired ? html`<span style="color:var(--red)">${expired} expired</span>` : 'None expired'}, ${expiring.length - expired} due within 60 days`, onClick: () => setTab('certs') },
        { label: 'In-person sessions', icon: 'Users', accent: 'blue', value: String(sessions(P).length), sub: 'In the next 3 weeks' },
      ]} />
      <div class="mt-24"><${Tabs} tabs=${[['overview', 'Overview'], ['certs', 'Certifications', expiring.length], ['people', 'Assignments', all.length], ['sites', 'Completion by site']]} value=${tab} onChange=${setTab} /></div>
      ${tab === 'overview' ? html`<div class="grid g-main" style="align-items:start">
        <div class="col" style="gap:16px;min-width:0">
          <div><div class="row" style="margin-bottom:10px"><${PO.Chip} icon="BookOpen" accent="green" /><h3 class="w-600" style="font-size:13.5px;margin:0">Courses</h3><span class="faint t-sm">${C.length}, select one for learners and lessons</span></div>
          <div class="tl-courses">${C.map((c) => { const l = all.filter((e) => e.c === c.key); const d = l.filter((e) => e.pct === 100).length; const od = l.filter((e) => e.pct < 100 && e.due < PO.TODAY); const f = d / (l.length || 1); return html`<div class=${'tl-course tl-acc-' + c.tone} onClick=${() => setCourse(c.key)}>
              <div class="row" style="gap:10px;align-items:flex-start"><${PO.Chip} icon=${c.icon} accent=${c.tone} size=${17} /><div class="grow" style="min-width:0"><b class="w-600 ellipsis" style="display:block">${c.title}</b><div class="faint t-xs ellipsis">${c.format}, ${c.mins} min</div></div>${c.mandatory ? html`<span class="faint t-xs" style="white-space:nowrap">Mandatory</span>` : html`<span class="faint t-xs">Optional</span>`}</div>
              <div class="row" style="align-items:baseline;gap:8px"><span class="pc">${PO.pct(f)}</span><span class="faint t-xs">${d} of ${l.length} completed</span>${od.length ? html`<span class="right t-xs" style="color:var(--amber);font-weight:550">${od.length} overdue</span>` : html`<span class="right faint t-xs">${c.renew ? `Renews every ${c.renew} months` : 'One-off'}</span>`}</div>
              <div class="bar"><i style=${`width:${f * 100}%`}></i></div>
              ${od.length ? html`<div class="row" style="gap:8px"><${AvatarStack} ids=${[...new Set(od.map((e) => e.p))]} max=${5} /><span class="faint t-xs">still to finish</span></div>` : null}
            </div>`; })}</div></div>
          <${Card} icon="TrendingUp" accent="blue" title="Completion trend" sub="Mandatory courses against the 85% target"><${PO.Charts.Line} labels=${['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']} series=${[{ name: 'Completion', data: [0.58, 0.63, 0.66, 0.71, 0.74, done / (all.length || 1)].map((v) => Math.round(v * 100)), color: 'var(--chart-1)' }, { name: 'Target', data: [85, 85, 85, 85, 85, 85], dash: true, color: 'var(--chart-5)' }]} fmt=${(v) => v + '%'} yFmt=${(v) => v + '%'} height=${180} /></${Card}>
        </div>
        <div class="col" style="gap:16px;min-width:0">
          <${Card} icon="BadgeCheck" accent="red" title="Certificates to renew" sub=${String(expiring.length)} flush actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => setTab('certs')}>View all</${Button}>`}>
            ${expiring.length ? expiring.slice(0, 6).map((x) => { const p = PO.person(x.p); return html`<div class="tl-row" style="padding:8px 16px"><${Avatar} p=${p} /><div class="grow" style="min-width:0"><div class="w-550 ellipsis">${p.name}</div><div class="faint t-xs ellipsis">${x.name}</div></div><span class="t-xs tnum" style=${x.status === 'Expired' ? 'color:var(--red)' : 'color:var(--text-2)'}>${x.exp < PO.TODAY ? 'Expired ' + PO.date(x.exp, { short: true, noYear: true }) : PO.date(x.exp, { short: true, noYear: true })}</span>${reminded[x.id] ? html`<span class="faint" title="Reminded"><${Icon} n="CheckCheck" size=${14} /></span>` : html`<${IconButton} icon="BellRing" size="sm" title="Send renewal reminder" onClick=${() => remindCert(x)} />`}</div>`; }) : html`<${Empty} icon="BadgeCheck" title="All certificates valid" />`}
          </${Card}>
          <${Card} icon="CalendarDays" accent="violet" title="Upcoming sessions" sub="In person" flush>${sessions(P).map((x) => html`<div class="tl-row"><span class="tnum t-sm w-550" style="width:52px;flex:none">${PO.date(x.d, { short: true, noYear: true })}</span><div class="grow" style="min-width:0"><div class="w-550 ellipsis">${x.t}</div><div class="faint t-xs ellipsis">${x.where}, ${x.time}, ${x.seats} seats</div></div><${Button} size="sm" onClick=${() => PO.toast(`Invites sent by email and SMS for ${x.t}`)}>Invite</${Button}></div>`)}</${Card}>
          <${Card} icon="MapPin" accent="amber" title="Sites furthest behind" flush actions=${html`<${Button} size="sm" kind="ghost" onClick=${() => setTab('sites')}>By course</${Button}>`}>${behind.slice(0, 4).map(({ s, v, od }) => html`<div class="tl-row" style="padding:8px 16px"><span class="grow ellipsis">${s.name}</span><span class="faint t-xs tnum">${od} overdue</span><span class="tnum t-sm w-550" style="width:40px;text-align:right">${PO.pct(v)}</span><${IconButton} icon="BellRing" size="sm" title="Remind this site" onClick=${() => PO.toast(`Reminder sent to ${od || 'everyone with pending courses'} at ${s.name} by email and SMS`)} /></div>`)}</${Card}>
        </div>
      </div>` : null}
      ${tab === 'sites' ? html`<${Card} icon="Grid3x3" accent="green" title="Completion by site and course" sub="% of assigned learners who finished"><${PO.Charts.Heatmap} rows=${sites.map((s) => s.name)} cols=${C.map((c) => c.title.split(' ').slice(0, 2).join(' '))} value=${(ri, ci) => { const l = all.filter((e) => e.site === sites[ri].id && e.c === C[ci].key); return l.length ? Math.round((l.filter((e) => e.pct === 100).length / l.length) * 100) : -1; }} fmt=${(v) => (v < 0 ? '—' : v + '%')} /></${Card}>` : null}
      ${tab === 'certs' ? html`<${DataTable} rows=${X} exportName="certifications" selectable initialSort=${{ key: 'exp', dir: 'asc' }} search=${(x) => PO.person(x.p).name + ' ' + x.name} searchPlaceholder="Search people or certificates"
        filters=${[{ key: 'st', label: 'Status', options: ['Expired', 'Expiring soon', 'Valid'], test: (x, v) => x.status === v }, { key: 'n', label: 'Certificate', options: [...new Set(X.map((x) => x.name))], test: (x, v) => x.name === v }, { key: 'site', label: 'Site', options: sites.map((s) => [s.id, s.name]), test: (x, v) => PO.person(x.p).site === v }]}
        bulk=${(ids2, clear) => html`<${Button} size="sm" icon="BellRing" onClick=${() => { const o = { ...reminded }; ids2.forEach((i) => (o[i] = true)); setReminded(o); clear(); PO.toast(`Renewal reminders sent to ${PO.plural(ids2.length, 'person', 'people')} by email and SMS`); }}>Send renewal reminder</${Button}>`}
        columns=${[
          { key: 'p', label: 'Employee', render: (x) => html`<${Who} id=${x.p} sub=${PO.site(PO.person(x.p).site).name} />`, sort: (x) => PO.person(x.p).name, csv: (x) => PO.person(x.p).name },
          { key: 'name', label: 'Certificate' },
          { key: 'issued', label: 'Issued', render: (x) => PO.date(x.issued, { short: true }) },
          { key: 'exp', label: 'Expires', render: (x) => html`<span class="tnum">${PO.date(x.exp, { short: true })}</span><div class="faint t-xs">${x.exp < PO.TODAY ? PO.plural(days(x.exp, PO.TODAY), 'day') + ' ago' : 'in ' + PO.plural(days(PO.TODAY, x.exp), 'day')}</div>` },
          { key: 'status', label: 'Status', render: (x) => (x.status === 'Valid' ? html`<span class="muted">Valid</span>` : html`<${Status} s=${x.status} />`) },
          { key: 'act', label: '', sort: false, csv: false, render: (x) => (x.status === 'Valid' ? null : reminded[x.id] ? html`<span class="faint t-xs">Reminded</span>` : html`<${Button} size="sm" onClick=${(e) => { e.stopPropagation(); remindCert(x); }}>Remind</${Button}>`) },
        ]} />` : null}
      ${tab === 'people' ? html`<${DataTable} rows=${all} exportName="course-assignments" search=${(e) => PO.person(e.p).name} searchPlaceholder="Search people" initialSort=${{ key: 'due', dir: 'asc' }}
        filters=${[{ key: 'c', label: 'Course', options: C.map((c) => [c.key, c.title]), test: (e, v) => e.c === v }, { key: 'st', label: 'Status', options: ['Completed', 'In progress', 'Not started', 'Overdue'], test: (e, v) => lstat(e) === v }, { key: 'site', label: 'Site', options: sites.map((s) => [s.id, s.name]), test: (e, v) => e.site === v }]}
        columns=${[
          { key: 'p', label: 'Employee', render: (e) => html`<${Who} id=${e.p} />`, sort: (e) => PO.person(e.p).name, csv: (e) => PO.person(e.p).name },
          { key: 'c', label: 'Course', render: (e) => C.find((c) => c.key === e.c).title, csv: (e) => C.find((c) => c.key === e.c).title },
          { key: 'pct', label: 'Progress', width: 180, render: (e) => html`<${Progress} value=${e.pct} label=${e.pct + '%'} />` },
          { key: 'due', label: 'Due', render: (e) => PO.date(e.due, { short: true }) },
          { key: 'st', label: 'Status', render: (e) => html`<${Status} s=${lstat(e)} />`, sort: (e) => lstat(e), csv: (e) => lstat(e) },
        ]} />` : null}
      ${openC ? html`<${CourseDrawer} P=${P} c=${openC} list=${all.filter((e) => e.c === openC.key)} onClose=${() => setCourse(null)} onAssign=${() => { setCourse(null); setAssignOpen(true); }} />` : null}
      <${AssignDrawer} open=${assignOpen} onClose=${() => setAssignOpen(false)} P=${P} C=${C} people=${sc.people} onAssign=${(rows) => setExtra([...rows, ...extra])} />`;
  }
  const sessions = (P) => (P.id === 'in' ? [{ d: '2026-10-08', t: 'Fire drill & extinguisher use', where: 'Hinjewadi Phase 2, Tower B', time: '15:00', seats: 20 }, { d: '2026-10-13', t: 'First aid basics', where: 'Head office, training room', time: '11:00', seats: 16 }, { d: '2026-10-16', t: 'New-joiner induction', where: 'Head office', time: '10:00', seats: 12 }]
    : P.id === 'us' ? [{ d: '2026-10-08', t: 'Fall menu & allergen briefing', where: 'Central kitchen', time: '2:00pm', seats: 14 }, { d: '2026-10-14', t: 'Fire drill & evacuation', where: 'South Lamar', time: '3:00pm', seats: 16 }, { d: '2026-10-20', t: 'New-hire induction', where: 'East 6th', time: '9:00am', seats: 8 }]
      : [{ d: '2026-10-09', t: 'Manual handling practical', where: 'Trafford depot', time: '10:00', seats: 12 }, { d: '2026-10-15', t: 'Fire safety & drill', where: 'Manchester Airport T2', time: '14:00', seats: 20 }, { d: '2026-10-21', t: 'New starter induction', where: 'Trafford depot', time: '09:00', seats: 10 }]);
  PO.talentLearning = { courses, enrolments };
  const lstat = (e) => (e.pct === 100 ? 'Completed' : e.due < PO.TODAY ? 'Overdue' : e.pct > 0 ? 'In progress' : 'Not started');

  function CourseDrawer({ P, c, list, onClose, onAssign }) {
    const mods = { safety: ['Your post orders', 'Handling visitors and vehicles', 'Emergency codes', 'Quiz: 5 questions'], fire: ['Types of fire and extinguishers', 'PASS technique', 'Evacuation routes', 'Live drill sign-off'], posh: ['What counts as harassment', 'How to raise a complaint', 'The Internal Committee', 'Quiz'], cs: ['Greeting and tone', 'Handling an angry visitor', 'When to call the supervisor'], induct: ['About the company', 'Your payslip and leave', 'Clocking in through the employee portal', 'Uniform and grooming', 'Site walk-through'], first: ['Bleeding and burns', 'CPR basics', 'Recovery position', 'Practical'], foodh: ['Personal hygiene', 'Time and temperature', 'Cross-contamination', 'Exam (70% to pass)'], allergen: ['The big 9 allergens', 'Labels and tickets', 'What to say to a guest'], coshh: ['Reading a safety data sheet', 'Dilution and storage', 'PPE', 'Quiz'], manual: ['TILE assessment', 'Safe lifting', 'Trolleys and floor machines'], ipc: ['Hand hygiene', 'Colour-coded equipment', 'Outbreak cleaning', 'NHS assessment'] }[c.key] || ['Introduction', 'Main lesson', 'Quiz'];
    const d = list.filter((e) => e.pct === 100).length;
    return html`<${Drawer} open size="lg" onClose=${onClose} title=${c.title} sub=${`${c.format}, ${c.mins} min`} footer=${html`<${Button} icon="Eye" onClick=${() => PO.toast('Preview opened as the learner sees it in the employee portal')}>Preview as learner</${Button}><${Button} icon="BellRing" onClick=${() => PO.toast(`Reminder sent to ${PO.plural(list.filter((e) => e.pct < 100).length, 'person', 'people')} by email and SMS`)}>Remind incomplete</${Button}><${Button} kind="primary" icon="UserPlus" onClick=${onAssign}>Assign</${Button}>`}>
      <div class="tl-facts"><div><span>Assigned</span><b class="tnum">${list.length}</b></div><div><span>Completed</span><b class="tnum">${d}, ${PO.pct(d / (list.length || 1))}</b></div><div><span>Renewal</span><b>${c.renew ? 'Every ' + c.renew + ' months' : 'One-off'}</b></div></div>
      <div class="tl-sub">Lessons</div>
      <div class="card flush">${mods.map((m, i) => html`<div class="tl-row" style="padding:8px 14px"><span class="faint tnum" style="width:16px">${i + 1}</span><span class="grow">${m}</span><span class="faint t-xs tnum">${Math.round(c.mins / mods.length)} min</span></div>`)}</div>
      <div class="tl-sub">Learners</div>
      <${DataTable} rows=${list} pageSize=${8} compact search=${(e) => PO.person(e.p).name} columns=${[{ key: 'p', label: 'Employee', render: (e) => html`<${Who} id=${e.p} size="xs" sub="" />`, sort: (e) => PO.person(e.p).name }, { key: 'pct', label: 'Progress', render: (e) => html`<${Progress} value=${e.pct} label=${e.pct + '%'} />` }, { key: 'st', label: 'Status', render: (e) => html`<${Status} s=${lstat(e)} />`, sort: (e) => lstat(e) }]} />
    </${Drawer}>`;
  }

  function AssignDrawer({ open, onClose, P, C, people, onAssign }) {
    const [ck, setCk] = useState(C[0].key);
    const [aud, setAud] = useState('site');
    const [site, setSite] = useState(P.sites[0].id);
    const [dept, setDept] = useState(P.depts[0].name);
    const [due, setDue] = useState(PO.addDays(PO.TODAY, 14));
    const [wa, setWa] = useState(true);
    const target = people.filter((p) => (aud === 'all' ? true : aud === 'site' ? p.site === site : aud === 'dept' ? p.dept === dept : p.joiner || p.tenureMonths < 3));
    const c = C.find((x) => x.key === ck);
    return html`<${Drawer} open=${open} onClose=${onClose} title="Assign a course" sub="Learners see it in the employee portal; progress syncs back here" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" icon="Send" disabled=${!target.length} onClick=${() => { onAssign(target.map((p) => ({ id: ck + p.id + 'x', c: ck, p: p.id, site: p.site, pct: 0, due }))); PO.toast(`${c.title} assigned to ${PO.plural(target.length, 'person', 'people')}${wa ? ', link sent by email and SMS' : ''}`, { icon: 'GraduationCap' }); onClose(); }}>Assign to ${PO.plural(target.length, 'person', 'people')}</${Button}>`}>
      <div class="col" style="gap:14px">
        <${Field} label="Course"><${Select} value=${ck} onChange=${setCk} options=${C.map((x) => [x.key, x.title])} /></${Field}>
        <${Field} label="Who"><${PO.Segmented} options=${[['site', 'A site'], ['dept', 'A department'], ['new', 'New joiners'], ['all', 'Everyone']]} value=${aud} onChange=${setAud} /></${Field}>
        ${aud === 'site' ? html`<${Field} label="Site"><${Select} value=${site} onChange=${setSite} options=${P.sites.map((s) => [s.id, s.name])} /></${Field}>` : null}
        ${aud === 'dept' ? html`<${Field} label="Department"><${Select} value=${dept} onChange=${setDept} options=${P.depts.map((d) => d.name)} /></${Field}>` : null}
        <${Field} label="Due by"><input class="input" type="date" value=${due} onInput=${(e) => setDue(e.target.value)} /></${Field}>
        <${Switch} on=${wa} onChange=${setWa} label="Email and text each person the course link"  />
        <div class="card inset" style="padding:12px 14px"><div class="row"><b class="w-600">${PO.plural(target.length, 'learner')}</b><span class="right"><${AvatarStack} ids=${target.map((p) => p.id)} max=${7} /></span></div><div class="faint t-sm mt-4">${c.mins} min, ${c.format}, in the employee portal</div></div>
      </div>
    </${Drawer}>`;
  }

  /* =====================================================================
     ENGAGEMENT
     ===================================================================== */
  function Gauge({ value }) {
    const a = ((value + 100) / 200) * Math.PI;
    const R = 80, cx = 100, cy = 92;
    const pt = (ang) => [cx - R * Math.cos(ang), cy - R * Math.sin(ang)];
    const [x1, y1] = pt(a);
    const tone = 'var(--chart-1)';
    return html`<svg class="tl-gauge" viewBox="0 0 200 110" width="100%" style="max-width:200px;display:block;margin:0 auto">
      <path d=${`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="var(--surface-3)" stroke-width="16" stroke-linecap="round" />
      <path d=${`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`} fill="none" stroke=${tone} stroke-width="16" stroke-linecap="round" />
      <text x=${cx} y=${cy - 14} text-anchor="middle" font-size="34" font-weight="650" fill="var(--text)">${value > 0 ? '+' : ''}${value}</text>
      <text x=${cx} y=${cy + 4} text-anchor="middle" font-size="10" fill="var(--text-3)">eNPS</text>
      <text x=${cx - R} y=${cy + 16} text-anchor="middle" font-size="9" fill="var(--text-3)">−100</text><text x=${cx + R} y=${cy + 16} text-anchor="middle" font-size="9" fill="var(--text-3)">+100</text></svg>`;
  }
  const COMMENTS = {
    in: [['Pay on time', 'pos', 'Salary always comes on the 7th. That is why I stay.'], ['Shift fairness', 'neg', 'Same people always get night shift at Hinjewadi. Please rotate.'], ['My supervisor', 'pos', 'Dattatray sir listens and gives leave when it is really needed.'], ['Tools & uniforms', 'neg', 'Raincoats were given late this monsoon.'], ['Growth', 'neg', 'No clear way to become supervisor. Would like training.'], ['Pay on time', 'pos', 'Downloading the payslip from the portal is very easy now.']],
    us: [['Shift fairness', 'neg', 'Schedules come out Thursday for Monday. Hard to plan around classes.'], ['My supervisor', 'pos', 'Maria is the best lead I’ve had. Fair and fun.'], ['Pay on time', 'pos', 'Tips show up properly on the check now.'], ['Growth', 'neg', 'I’d love a path to shift lead but nobody has explained it.'], ['Tools & uniforms', 'pos', 'New aprons are great.'], ['Shift fairness', 'neg', 'Overnight bake always goes to the same three people.']],
    uk: [['Shift fairness', 'neg', 'Night rotas at Salford Royal come out too late.'], ['Pay on time', 'pos', 'Never had a problem with pay. Payslips in the portal are handy.'], ['Tools & uniforms', 'neg', 'Floor scrubber at T2 has been broken for two weeks.'], ['My supervisor', 'pos', 'Sarah always checks we are okay after a hard night.'], ['Growth', 'neg', 'Would like the COSHH assessor course.'], ['My supervisor', 'pos', 'Team leaders actually listen at MediaCity.']],
  };

  function Engagement({ query }) {
    const P = PO.P();
    const { state } = PO.useStore();
    const emp = state.role === 'employee';
    const [tab, setTab] = PO.useCoState('eng.tab', 'news');
    useEffect(() => { if (query.tab) setTab(query.tab); }, [query.tab]);
    const [compose, setCompose] = useState(query.new === '1' && !emp);
    const [added, setAdded] = PO.useCoState('eng.posts', []);
    const [pins, setPins] = PO.useCoState('eng.pins', {});
    const [removed, setRemoved] = PO.useCoState('eng.removed', {});
    const [kudos] = PO.useCoState('eng.kudos', []);
    const [pulse, setPulse] = PO.useCoState('eng.pulse', false);
    const posts = [...added, ...P.announcements].filter((a) => !removed[a.id]).map((a) => ({ ...a, pinned: pins[a.id] ?? a.pinned })).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.date.localeCompare(a.date));
    const S = P.survey;
    const cel = useMemo(() => celebrations(P), [P.id]);
    const thisWeek = cel.filter((c) => c.date >= PO.addDays(PO.TODAY, -1) && c.date <= PO.addDays(PO.TODAY, 13));
    const avgReach = posts.reduce((t, a) => t + a.reach, 0) / (posts.length || 1);
    const tabs = emp ? [['news', 'Announcements', posts.length], ['kudos', 'Kudos'], ['cel', 'Celebrations', thisWeek.length]] : [['news', 'Announcements', posts.length], ['survey', 'Pulse survey'], ['kudos', 'Recognition'], ['cel', 'Celebrations', thisWeek.length]];
    const t = tabs.some((x) => x[0] === tab) ? tab : 'news';
    return html`
      <${PageHeader} title=${emp ? 'Announcements' : 'Engagement'} sub=${emp ? `${PO.plural(posts.length, 'announcement')} from ${P.company.short}, and ${PO.plural(thisWeek.length, 'celebration')} in the next two weeks.` : `${PO.plural(posts.length, 'announcement')} live. ${S.responses} of ${P.people.length} people answered the ${S.name}.`} actions=${emp ? html`<${Button} icon="ThumbsUp" onClick=${() => setTab('kudos')}>Give kudos</${Button}>` : html`
        <${Button} icon="ClipboardList" disabled=${pulse} onClick=${() => { setPulse(true); PO.toast('Pulse survey scheduled: 5 questions in the employee portal, with an email and SMS link, Monday 10:00', { action: { label: 'Undo', run: () => setPulse(false) } }); }}>${pulse ? 'Pulse scheduled' : 'Schedule pulse survey'}</${Button}>
        <${Button} kind="primary" icon="Megaphone" onClick=${() => setCompose(true)}>New announcement</${Button}>
        <${Menu} align="right" width=${220} trigger=${html`<${IconButton} icon="Ellipsis" bordered title="More" />`} items=${[
          { label: 'Export survey results', icon: 'Download', onClick: () => PO.exportCsv('pulse-drivers', [['Driver', 'Score'], ...S.drivers.map(([l, v]) => [l, v])]) },
          { label: 'Celebration automations', icon: 'Cake', onClick: () => setTab('cel') },
        ]} />`} />
      ${emp ? null : html`<${PO.KpiStrip} items=${[
        { label: 'eNPS', icon: 'Smile', accent: 'green', value: (S.enps > 0 ? '+' : '') + S.enps, sub: 'Up 5 since the July pulse', onClick: () => setTab('survey') },
        { label: 'Survey response', icon: 'ClipboardList', accent: 'blue', value: String(S.responses), unit: `/${P.people.length}`, bar: [{ v: S.responses, k: 'ok', title: `${S.responses} responded` }, { v: P.people.length - S.responses, k: 'mute', title: `${P.people.length - S.responses} not yet` }], sub: `${PO.pct(S.responses / P.people.length)} responded` },
        { label: 'Announcement reach', icon: 'Megaphone', accent: 'violet', value: String(Math.round(avgReach * 100)), unit: '%', sub: 'Read in the portal or by email' },
        { label: 'Kudos this month', icon: 'Award', accent: 'amber', faces: [...new Set([...kudos, ...kudosSeed(P)].map((k) => k.to))], value: String(10 + kudos.length + 21), sub: '12 more than September', onClick: () => setTab('kudos') },
      ]} />`}
      <div class=${emp ? '' : 'mt-24'}><${Tabs} tabs=${tabs} value=${t} onChange=${setTab} /></div>
      ${t === 'news' ? html`<div class="grid g-main" style="align-items:start">
        <${Card} icon="Megaphone" accent="violet" title="Announcements" sub=${PO.plural(posts.length, 'post')} flush>
          ${posts.map((a) => html`<div class="tl-feed" style="flex-direction:column;gap:6px">
            <div class="row" style="gap:8px">${a.pinned ? html`<${Icon} n="Pin" size=${13} cls="faint" />` : null}<b class="w-600 t-md grow" style="min-width:0">${a.title}</b>${a.isNew ? html`<span class="faint t-xs">Just sent</span>` : null}
              ${emp ? null : html`<span class="row" style="gap:2px"><${IconButton} icon=${a.pinned ? 'PinOff' : 'Pin'} size="sm" title=${a.pinned ? 'Unpin' : 'Pin to top'} onClick=${() => { setPins({ ...pins, [a.id]: !a.pinned }); PO.toast(a.pinned ? 'Unpinned' : 'Pinned to the top of everyone’s feed'); }} />
                <${Menu} align="right" trigger=${html`<${IconButton} icon="Ellipsis" size="sm" title="More" />`} items=${[{ label: `Resend to ${P.people.length - Math.round(a.reach * P.people.length)} who haven't read`, icon: 'Send', onClick: () => PO.toast('Resent by email and SMS to people who haven’t read it') }, { label: 'See who read it', icon: 'Eye', onClick: () => PO.toast('Read receipts exported', { icon: 'Download' }) }, '-', { label: 'Delete', icon: 'Trash2', danger: true, onClick: () => { setRemoved({ ...removed, [a.id]: true }); PO.toast('Announcement deleted', { action: { label: 'Undo', run: () => setRemoved({ ...removed, [a.id]: false }) } }); } }]} /></span>`}</div>
            <div class="faint t-xs">${PO.rel(a.date)} by ${P.byId[P.hrId].name}, to ${(a.audience || 'Everyone').toLowerCase() === 'everyone' ? 'everyone' : a.audience}</div>
            <p>${a.body}</p>
            ${emp ? html`<div class="row mt-4" style="gap:6px"><${Button} size="sm" icon="Check" onClick=${() => PO.toast('Marked as read')}>Got it</${Button}><${Button} size="sm" kind="ghost" icon="Bookmark" onClick=${() => PO.toast('Saved to your bookmarks')}>Save</${Button}></div>` : html`<div class="row mt-4" style="gap:12px"><div style="width:180px"><${Progress} value=${a.reach * 100} /></div><span class="faint t-xs tnum">${Math.round(a.reach * P.people.length)} of ${P.people.length} read, sent by ${(a.channels || ['Portal', 'Email']).join(' and ').toLowerCase()}</span></div>`}
          </div>`)}
        </${Card}>
        <div class="col" style="gap:16px;min-width:0"><${CelebrationList} P=${P} list=${thisWeek} />
          ${emp ? html`<${Card} title=${S.name} sub="Two minutes, anonymous"><p class="muted">Five quick questions about pay, shifts and your supervisor.</p><div class="mt-12"><${Button} kind="primary" icon="ClipboardList" onClick=${() => PO.toast('Thanks. Your answers are anonymous.', { icon: 'Check' })}>Take the survey</${Button}></div></${Card}>`
            : html`<${Card} icon="Radio" accent="blue" title="Reach by channel" sub="Last 30 days" flush>${[['Employee portal', 68], ['Email', 19], ['SMS link', 6], ['Not reached', 7]].map(([l, v]) => html`<div class="tl-row" style="padding:8px 16px"><span class="grow">${l}</span><span style="width:110px;flex:none"><${Progress} value=${v} tone=${l === 'Not reached' ? 'amber' : ''} /></span><span class="tnum t-sm" style="width:36px;text-align:right">${v}%</span></div>`)}</${Card}>`}
        </div></div>` : null}
      ${t === 'survey' ? html`<${Survey} P=${P} />` : null}
      ${t === 'kudos' ? html`<${FeedbackFeed} P=${P} people=${P.people} />` : null}
      ${t === 'cel' ? html`<${Celebrations} P=${P} cel=${cel} />` : null}
      ${!emp ? html`<${Composer} open=${compose} onClose=${() => setCompose(false)} P=${P} onPost=${(a) => setAdded([a, ...added])} />` : null}`;
  }

  function Survey({ P }) {
    const S = P.survey;
    const prom = Math.round(S.responses * (0.42 + S.enps / 400)), det = Math.round(prom - (S.enps / 100) * S.responses), pas = S.responses - prom - det;
    const sites = P.sites.filter((s) => P.people.some((p) => p.site === s.id && p.role !== 'office'));
    const r = PO.seeded('sv' + P.id);
    const heat = sites.map(() => S.drivers.map(([, v]) => Math.max(2.4, Math.min(4.9, v + (r.rnd() - 0.5) * 0.9))));
    const [planned, setPlanned] = PO.useCoState('eng.planned', {});
    const low = S.drivers.slice().sort((a, b) => a[1] - b[1]).slice(0, 2);
    return html`<div class="grid g-main" style="align-items:start">
      <div class="col" style="gap:16px;min-width:0">
        <${Card} icon="ChartColumn" accent="blue" title="Drivers" sub="Average score out of 5"><${PO.Charts.HBars} data=${S.drivers.map(([l, v]) => ({ label: l, value: v }))} max=${5} fmt=${(v) => v.toFixed(1)} /></${Card}>
        <${Card} icon="MapPin" accent="teal" title="Drivers by site"><${PO.Charts.Heatmap} rows=${sites.map((s) => s.name)} cols=${S.drivers.map((d) => d[0])} value=${(ri, ci) => heat[ri][ci]} fmt=${(v) => v.toFixed(1)} /></${Card}>
      </div>
      <div class="col" style="gap:16px;min-width:0">
        <${Card} icon="Smile" accent="green" title="Employee NPS" sub=${`${S.responses} responses`}><${Gauge} value=${S.enps} />
          <div class="tl-split mt-12"><i style=${`flex:${det};background:var(--text-3)`}></i><i style=${`flex:${pas};background:var(--border-strong)`}></i><i style=${`flex:${prom};background:var(--chart-1)`}></i></div>
          <div class="row t-xs mt-8 muted tnum"><span>${det} detractors</span><span style="margin:0 auto">${pas} passives</span><span>${prom} promoters</span></div></${Card}>
        <${Card} icon="TriangleAlert" accent="amber" title="Lowest scores" sub="Act on these first" flush>${low.map(([l, v]) => html`<div class="tl-row" style="align-items:flex-start;padding:10px 16px"><div class="grow" style="min-width:0"><div class="row"><b class="w-550">${l}</b><span class="tnum t-sm" style="color:var(--amber)">${v.toFixed(1)}</span></div><div class="faint t-xs mt-4">${l === 'Shift fairness' ? 'Night and weekend shifts feel unevenly shared. Try rotation rules in Roster.' : 'People want a visible path to the next role. Publish a supervisor track.'}</div></div>${planned[l] ? html`<span class="faint t-xs" style="padding-top:4px">Planned</span>` : html`<${Button} size="sm" onClick=${() => { setPlanned({ ...planned, [l]: true }); PO.toast(`Action plan created for “${l}” and shared with site leads`); }}>Plan</${Button}>`}</div>`)}
          <div class="tl-row faint t-xs" style="padding:8px 16px">Highest: pay on time. Payroll is on track for ${P.company.payBy}.</div></${Card}>
        <${Card} icon="MessageSquare" accent="violet" title="Comments" sub="Anonymous" flush><div style="max-height:320px;overflow:auto">${COMMENTS[P.id].map(([d, s, t]) => html`<div class="tl-row" style="align-items:flex-start;padding:10px 16px"><div class="grow"><div>“${t}”</div><div class="faint t-xs mt-4">${d}, ${s === 'pos' ? 'positive' : 'negative'}</div></div></div>`)}</div></${Card}>
      </div>
    </div>`;
  }

  function celebrations(P) {
    const out = [];
    P.people.forEach((p) => {
      const b = '2026' + p.dob.slice(4);
      if (b.slice(5, 7) === '10' || b.slice(5, 7) === '11') out.push({ kind: 'Birthday', p: p.id, date: b });
      const a = '2026' + p.joinedIso.slice(4);
      const yrs = 2026 - +p.joinedIso.slice(0, 4);
      if ((a.slice(5, 7) === '10' || a.slice(5, 7) === '11') && yrs >= 1) out.push({ kind: 'Work anniversary', p: p.id, date: a, yrs });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }
  function CelebrationList({ P, list, title }) {
    const [sent, setSent] = PO.useCoState('eng.wished', {});
    return html`<${Card} icon="Cake" accent="rose" title=${title || 'Coming up'} sub="Birthdays and work anniversaries" flush>${list.length ? list.slice(0, 7).map((c) => { const p = PO.person(c.p); const k = c.p + c.kind; return html`<div class="list-item" style="padding:8px 16px"><${Avatar} p=${p} /><div class="grow" style="min-width:0"><b class="w-550 ellipsis" style="display:block">${p.name}</b><span class="faint t-xs">${c.kind === 'Birthday' ? 'Birthday' : `${PO.plural(c.yrs, 'year')} at ${P.company.short}`}, ${PO.date(c.date, { short: true, noYear: true })}</span></div>${sent[k] ? html`<span class="faint t-xs">Sent</span>` : html`<${Button} size="sm" onClick=${() => { setSent({ ...sent, [k]: true }); PO.toast(`Wishes sent to ${p.first} by SMS`, { icon: 'Check' }); }}>Wish</${Button}>`}</div>`; }) : html`<${Empty} icon="Cake" title="No celebrations this week" />`}</${Card}>`;
  }
  function Celebrations({ P, cel }) {
    const ev = {};
    cel.forEach((c) => { (ev[c.date] = ev[c.date] || []).push({ label: PO.person(c.p).first + (c.kind === 'Birthday' ? '' : `, ${c.yrs} yr`), tone: c.kind === 'Birthday' ? 'brand' : 'slate' }); });
    P.holidays.filter((h) => h.date.slice(5, 7) === '10').forEach((h) => (ev[h.date] = [{ label: h.name, tone: 'amber' }, ...(ev[h.date] || [])]));
    P.holidays.filter((h) => h.date.slice(5, 7) === '11').forEach((h) => (ev[h.date] = [{ label: h.name, tone: 'amber' }, ...(ev[h.date] || [])]));
    const [day, setDay] = useState(null);
    const [m, setM] = useState('10');
    const [auto, setAuto] = PO.useCoState('eng.auto', { b: true, a: true, m: false });
    const inM = cel.filter((c) => c.date.slice(5, 7) === m);
    const list = day ? cel.filter((c) => c.date === day) : cel.filter((c) => c.date >= PO.addDays(PO.TODAY, -1) && c.date <= PO.addDays(PO.TODAY, 13));
    const [sent, setSent] = PO.useCoState('eng.wished', {});
    const soon = cel.filter((c) => c.date >= PO.addDays(PO.TODAY, -1) && c.date <= PO.addDays(PO.TODAY, 13)).slice(0, 12);
    return html`${soon.length ? html`<div style="margin-bottom:16px"><div class="row" style="margin-bottom:10px"><${PO.Chip} icon="PartyPopper" accent="rose" /><h3 class="w-600" style="font-size:13.5px;margin:0">Next 2 weeks</h3><span class="faint t-sm">${PO.plural(soon.length, 'celebration')}</span></div>
      <div class="tl-cel">${soon.map((c) => { const p = PO.person(c.p); const k = c.p + c.kind; const bd = c.kind === 'Birthday'; return html`<div class="pcard"><span class="pcard-cover" style=${`--h:${p.hue}`}><${PO.Chip} icon=${bd ? 'Cake' : 'Award'} accent=${bd ? 'rose' : 'amber'} size=${13} /></span><${Avatar} p=${p} size="xl" /><a href=${PO.href('people/' + p.id)}><b>${p.name}</b></a><small>${bd ? 'Birthday' : `${PO.plural(c.yrs, 'year')} at ${P.company.short}`}, ${PO.date(c.date, { short: true, noYear: true })}</small><span class="pcard-foot">${sent[k] ? html`<span class="faint">Wishes sent</span>` : html`<${Button} size="sm" onClick=${() => { setSent({ ...sent, [k]: true }); PO.toast(`Wishes sent to ${p.first} by SMS`, { icon: 'Check' }); }}>${bd ? 'Wish' : 'Congratulate'}</${Button}>`}</span></div>`; })}</div></div>` : null}
    <div class="grid g-main" style="align-items:start"><${Card} icon="CalendarHeart" accent="rose" title=${m === '10' ? 'October 2026' : 'November 2026'} sub=${`${inM.filter((c) => c.kind === 'Birthday').length} birthdays and ${inM.filter((c) => c.kind !== 'Birthday').length} work anniversaries`} actions=${html`<${PO.Segmented} options=${[['10', 'Oct'], ['11', 'Nov']]} value=${m} onChange=${(v) => { setM(v); setDay(null); }} />`}><${MonthCal} year=${2026} month=${+m - 1} events=${ev} onDay=${setDay} /></${Card}>
      <div class="col" style="gap:16px"><${CelebrationList} P=${P} list=${day ? list : inM.filter((c) => c.date >= PO.TODAY)} title=${day ? PO.date(day, { weekday: true }) : `Later in ${m === '10' ? 'October' : 'November'}`} />
      <${Card} icon="Zap" accent="violet" title="Automations"><div class="col" style="gap:10px">${[['b', 'Send a birthday wish by SMS at 09:00'], ['a', 'Post work anniversaries to the feed'], ['m', 'Remind managers a day before']].map(([k, l]) => html`<${Switch} on=${auto[k]} onChange=${(v) => { setAuto({ ...auto, [k]: v }); PO.toast(v ? 'Turned on' : 'Turned off'); }} label=${l} />`)}</div></${Card}></div></div>`;
  }

  function Composer({ open, onClose, P, onPost }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [aud, setAud] = useState('all');
    const [ch, setCh] = useState({ Portal: true, Email: true, SMS: false });
    const [pin, setPin] = useState(false);
    const [when, setWhen] = useState('now');
    const reach = aud === 'all' ? P.people.length : P.people.filter((p) => p.site === aud || p.dept === aud).length;
    const sample = P.id === 'in' ? ['Dussehra holiday on 20 October', 'All sites follow the Sunday roster on 20 October. Double wages for anyone on duty.'] : P.id === 'us' ? ['New fall menu training this Thursday', 'Pumpkin loaf and chai launch Monday. Short training at each café Thursday at 2pm.'] : ['Clocks go back on 25 October', 'Night shift on 24–25 October is one hour longer and paid at the night rate.'];
    return html`<${Drawer} open=${open} onClose=${onClose} size="lg" title="New announcement" sub="Write once; it goes to the employee portal, with email and SMS alerts where you choose" footer=${html`<${Button} onClick=${onClose}>Cancel</${Button}><${Button} kind="primary" icon="Send" disabled=${!title.trim()} onClick=${() => { onPost({ id: 'an' + Date.now(), title, body, date: PO.TODAY, reach: 0.12, pinned: pin, isNew: true, audience: aud === 'all' ? 'Everyone' : (PO.site(aud) || {}).name || aud, channels: Object.keys(ch).filter((k) => ch[k]) }); PO.toast(when === 'now' ? `Sent to ${PO.plural(reach, 'person', 'people')}: ${Object.keys(ch).filter((k) => ch[k]).map((k) => (k === 'Portal' ? 'employee portal' : k === 'SMS' ? 'SMS' : 'email')).join(', ')}` : 'Scheduled for tomorrow 09:00', { icon: 'Megaphone' }); setTitle(''); setBody(''); onClose(); }}>${when === 'now' ? 'Send now' : 'Schedule'}</${Button}>`}>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 280px;gap:18px">
        <div class="col" style="gap:14px">
          <${Field} label="Title"><input class="input" value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder=${sample[0]} /></${Field}>
          <${Field} label="Message" hint="Keep it short; it is read on a phone between shifts."><textarea class="textarea" rows="5" style="height:auto;padding:8px 10px" value=${body} onInput=${(e) => setBody(e.target.value)} placeholder=${sample[1]}></textarea></${Field}>
          ${!title ? html`<button class="tl-chip" style="align-self:flex-start" onClick=${() => { setTitle(sample[0]); setBody(sample[1]); }}><${Icon} n="FileText" size=${13} />Use a template</button>` : null}
          <${Field} label="Audience"><select class="select" value=${aud} onChange=${(e) => setAud(e.target.value)}><option value="all">Everyone (${P.people.length})</option><optgroup label="Sites">${P.sites.map((s) => html`<option value=${s.id}>${s.name}</option>`)}</optgroup><optgroup label="Departments">${P.depts.map((d) => html`<option value=${d.name}>${d.name} (${d.count})</option>`)}</optgroup></select></${Field}>
          <${Field} label="Channels"><div class="row wrap" style="gap:6px">${Object.keys(ch).map((k) => html`<button class="tl-chip" aria-pressed=${ch[k]} onClick=${() => setCh({ ...ch, [k]: !ch[k] })}><${Icon} n=${k === 'Portal' ? 'Globe' : k === 'Email' ? 'Mail' : 'MessageSquare'} size=${13} />${k === 'Portal' ? 'Employee portal' : k === 'SMS' ? 'SMS alert' : 'Email'}</button>`)}</div></${Field}>
          <div class="row" style="gap:16px"><${Switch} on=${pin} onChange=${setPin} label="Pin to the top" /><${PO.Segmented} options=${[['now', 'Send now'], ['later', 'Tomorrow 09:00']]} value=${when} onChange=${setWhen} /></div>
        </div>
        <div><div class="faint t-xs" style="margin-bottom:6px">Preview in the employee portal, reaches ${PO.plural(reach, 'person', 'people')}</div>
          <div class="card" style="padding:14px"><div class="row" style="gap:8px;align-items:flex-start">${pin ? html`<${Icon} n="Pin" size=${14} cls="faint" style="margin-top:2px" />` : null}<div style="min-width:0"><b class="w-600">${title || sample[0]}</b><div class="faint t-xs">${P.byId[P.hrId].name}, just now</div><p class="mt-8 t-sm">${body || sample[1]}</p></div></div></div>
          <div class="faint t-xs mt-8">Read receipts come back to this page within minutes.</div></div>
      </div>
    </${Drawer}>`;
  }

  PO.route('hiring', Hiring, { title: 'Hiring', wide: true });
  PO.route('performance', Performance, { title: 'Performance', wide: true });
  PO.route('learning', Learning, { title: 'Learning' });
  PO.route('engagement', Engagement, { title: 'Engagement' });
})();
