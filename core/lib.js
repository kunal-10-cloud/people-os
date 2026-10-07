/* People OS runtime: store, router, formatting and helpers shared by every module.
   Modules read the current company through PO.P() and keep their UI state with PO.useCoState(),
   which is stored per company, so switching companies keeps each company's progress. */
(function () {
  const { html, render, h, useState, useEffect, useMemo, useRef, useCallback, useReducer, useContext, createContext, Fragment } = htmPreact;
  const PO = window.PO;

  /* ---------- store ---------- */
  const saved = (() => { try { return JSON.parse(localStorage.getItem('po-ui') || '{}'); } catch { return {}; } })();
  const urlQ = Object.fromEntries(new URLSearchParams((location.hash.split('?')[1]) || ''));
  const initial = {
    co: PO.DATA[urlQ.co] ? urlQ.co : PO.DATA[saved.co] ? saved.co : PO.order[0],
    role: ['admin', 'manager', 'employee'].includes(urlQ.role) ? urlQ.role : saved.role || 'admin',
    theme: ['light', 'dark'].includes(urlQ.theme) ? urlQ.theme : saved.theme || 'light',
    collapsed: !!saved.collapsed,
    cmdk: false,
    assistant: null,       // null | { prompt?: string }
    phone: null,
    signedOut: false,
    notif: false,
    toasts: [],
    by: {},                // per-company state: { [co]: { [key]: value } }
    tick: 0,
  };
  function reducer(s, a) {
    switch (a.type) {
      case 'set': return { ...s, ...a.patch };
      case 'co': return { ...s, co: a.co, assistant: null, phone: null };
      case 'coState': {
        const cur = s.by[s.co] || {};
        const prev = cur[a.key];
        const val = typeof a.value === 'function' ? a.value(prev === undefined ? a.init : prev) : a.value;
        return { ...s, by: { ...s.by, [s.co]: { ...cur, [a.key]: val } } };
      }
      case 'toast': return { ...s, toasts: [...s.toasts, a.toast] };
      case 'untoast': return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
      default: return s;
    }
  }
  const Store = createContext(null);
  let current = null; // latest {state, dispatch} for non-component helpers
  function useStore() { return useContext(Store); }
  function StoreProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initial);
    current = { state, dispatch };
    PO.dispatch = dispatch;
    PO.P = () => PO.DATA[state.co];
    useEffect(() => { try { localStorage.setItem('po-ui', JSON.stringify({ co: state.co, role: state.role, theme: state.theme, collapsed: state.collapsed })); } catch {} }, [state.co, state.role, state.theme, state.collapsed]);
    useEffect(() => { document.documentElement.dataset.theme = state.theme; }, [state.theme]);
    return html`<${Store.Provider} value=${{ state, dispatch }}>${children}<//>`;
  }
  /** Per-company UI state that survives navigation: const [v, setV] = useCoState('payroll.step', 0) */
  function useCoState(key, init) {
    const { state, dispatch } = useStore();
    const slice = state.by[state.co] || {};
    const value = slice[key] === undefined ? init : slice[key];
    const set = useCallback((v) => dispatch({ type: 'coState', key, value: v, init }), [key, state.co]);
    return [value, set];
  }
  /** Read any per-company key without subscribing a setter (e.g. for nav badge counts). */
  const coGet = (state, key, init) => { const v = (state.by[state.co] || {})[key]; return v === undefined ? init : v; };
  const setCo = (key, value) => current && current.dispatch({ type: 'coState', key, value });

  /* ---------- toasts ---------- */
  let tid = 0;
  function toast(text, opts = {}) {
    if (!current) return;
    const id = ++tid;
    current.dispatch({ type: 'toast', toast: { id, text, ...opts } });
    setTimeout(() => current && current.dispatch({ type: 'untoast', id }), opts.ms || 4200);
  }

  /* ---------- router ---------- */
  const routes = {};
  /** PO.route('people', Component, { title, wide }) — component receives { params, query } */
  function route(name, component, meta = {}) { routes[name] = { component, ...meta }; }
  function parseHash() {
    const raw = (location.hash || '#/home').slice(2);
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    return { name: parts[0] || 'home', params: parts.slice(1), query, raw };
  }
  function useRoute() {
    const [r, setR] = useState(parseHash());
    useEffect(() => { const f = () => { setR(parseHash()); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
    return r;
  }
  const go = (path) => { location.hash = '#/' + path.replace(/^#?\/?/, ''); };
  const href = (path) => '#/' + path.replace(/^#?\/?/, '');

  /* ---------- formatting ---------- */
  const P = () => PO.DATA[current ? current.state.co : PO.order[0]];
  function money(n, o = {}) {
    const C = P().company;
    const cents = o.cents ?? (C.currency !== 'INR' && Math.abs(n) < 100000 && !Number.isInteger(n));
    if (o.compact) return compactMoney(n);
    return new Intl.NumberFormat(C.locale, { style: 'currency', currency: C.currency, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n);
  }
  function compactMoney(n) {
    const C = P().company;
    if (C.currency === 'INR') {
      const a = Math.abs(n), s = n < 0 ? '−' : '';
      if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)} Cr`;
      if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)} L`;
      if (a >= 1e3) return `${s}₹${(a / 1e3).toFixed(1)}k`;
      return `${s}₹${Math.round(a)}`;
    }
    return new Intl.NumberFormat(C.locale, { style: 'currency', currency: C.currency, notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  const num = (n, d = 0) => new Intl.NumberFormat(P().company.locale, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
  const pct = (n, d = 0) => `${(n * 100).toFixed(d)}%`;
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  /** date('2026-10-06') → "6 Oct 2026" (IN/UK) or "Oct 6, 2026" (US). opts: { short, weekday, noYear } */
  function date(isoStr, o = {}) {
    if (!isoStr) return '—';
    const d = new Date(isoStr.slice(0, 10) + 'T00:00:00Z');
    const us = P().company.locale === 'en-US';
    const y = o.noYear || (o.short && d.getUTCFullYear() === 2026) ? '' : ` ${d.getUTCFullYear()}`;
    const wd = o.weekday ? DAYS[d.getUTCDay()] + (us ? ', ' : ' ') : '';
    return us ? `${wd}${MONS[d.getUTCMonth()]} ${d.getUTCDate()}${y ? ',' + y : ''}` : `${wd}${d.getUTCDate()} ${MONS[d.getUTCMonth()]}${y}`;
  }
  /** rel('2026-10-05') → "Yesterday"; rel(iso, { lower: true }) → "yesterday" for use mid-sentence. */
  function rel(isoStr, o = {}) {
    const days = Math.round((new Date(isoStr.slice(0, 10)) - new Date(PO.TODAY)) / 864e5);
    let s;
    if (days === 0) s = 'Today'; else if (days === 1) s = 'Tomorrow'; else if (days === -1) s = 'Yesterday';
    else if (days < 0 && days > -7) s = `${-days} days ago`; else if (days > 0 && days < 7) s = `In ${days} days`;
    else return date(isoStr, { short: true });
    return o.lower ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  }
  const tenure = (m) => (m < 1 ? 'New' : m < 12 ? `${m} mo` : `${Math.floor(m / 12)} yr${m >= 24 ? 's' : ''}${m % 12 ? ` ${m % 12} mo` : ''}`);
  const plural = (n, w, pl) => `${num(n)} ${n === 1 ? w : pl || w + 's'}`;
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const hueOf = (s) => { let x = 0; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) % 360; return x; };

  /* ---------- data helpers ---------- */
  const person = (id) => P().byId[id];
  const site = (id) => P().sites.find((s) => s.id === id);
  const shiftOf = (key) => P().shifts.find((s) => s.key === key);
  const leaveType = (key) => P().leaveTypes.find((t) => t.key === key);
  const isIN = () => P().id === 'in';
  const isUS = () => P().id === 'us';
  const isUK = () => P().id === 'uk';

  /** Download rows as CSV: exportCsv('employees', [['Name','Site'], ...]) */
  function exportCsv(name, rows) {
    const csv = rows.map((r) => r.map((c) => { const s = String(c ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${P().company.short.toLowerCase().replace(/[^a-z]+/g, '-')}-${name}.csv`;
    a.click();
    toast(`Exported ${name}.csv`);
  }
  /** Fake a document download (PDF/XLSX) with a toast, for generated files like payslips or ECR. */
  const fakeDownload = (label) => toast(`${label} downloaded`, { icon: 'Download' });

  /* close-on-outside-click helper for menus/popovers */
  function useOutside(ref, onOut, active = true) {
    useEffect(() => {
      if (!active) return;
      const f = (e) => { if (ref.current && !ref.current.contains(e.target)) onOut(); };
      const k = (e) => { if (e.key === 'Escape') onOut(); };
      setTimeout(() => { document.addEventListener('mousedown', f); document.addEventListener('keydown', k); });
      return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k); };
    }, [active]);
  }

  /* nav badge counts: PO.navCount('approvals', (state, P) => n, hot). Defined here so modules can call it at load time. */
  PO._navCounts = PO._navCounts || {};
  PO.navCount = (key, fn, hot = false) => { PO._navCounts[key] = { fn, hot }; };

  Object.assign(PO, {
    html, render, h, Fragment, useState, useEffect, useMemo, useRef, useCallback,
    StoreProvider, useStore, useCoState, coGet, setCo, toast,
    routes, route, useRoute, go, href,
    money, compactMoney, num, pct, date, rel, tenure, plural, initials, hueOf, MONS, DAYS,
    person, site, shiftOf, leaveType, isIN, isUS, isUK, exportCsv, fakeDownload, useOutside,
    P,
  });
})();
