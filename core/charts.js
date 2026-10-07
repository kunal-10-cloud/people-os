/* People OS charts: small, dependency-free SVG charts that read colours from tokens.
   Use as components: html`<${PO.Charts.Bars} data=${…} />`. Sparkline is hook-free and may be called directly. */
(function () {
  const PO = window.PO;
  const { html, useState, useRef } = PO;
  const SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];
  const niceMax = (v) => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  const fmtAxis = (v, f) => (f ? f(v) : Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : String(Math.round(v * 10) / 10));

  /** Sparkline({ data:[n], w, h, color }) */
  function Sparkline({ data, w = 90, h = 28, color = 'var(--chart-1)', fill = true }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
    const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 2) + 1, h - 2 - ((v - min) / span) * (h - 4)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return html`<svg width=${w} height=${h} viewBox=${`0 0 ${w} ${h}`} style="display:block;overflow:visible">${fill ? html`<path d=${d + ` L ${w - 1} ${h} L 1 ${h} Z`} fill=${color} opacity="0.1" />` : null}<path d=${d} fill="none" stroke=${color} stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" /><circle cx=${pts[pts.length - 1][0]} cy=${pts[pts.length - 1][1]} r="2.4" fill=${color} /></svg>`;
  }

  function Tip({ tip }) { return tip ? html`<div class="chart-tip" style=${`left:${tip.x}px;top:${tip.y}px`}>${tip.html}</div>` : null; }

  /**
   * Bars({ labels:[…], series:[{name, data:[…], color?}], height, stacked, fmt, yFmt, highlight:index })
   */
  function Bars({ labels, series, height = 220, stacked = false, fmt = (v) => PO.num(v), yFmt, highlight, legend = series.length > 1 }) {
    const [tip, setTip] = useState(null);
    const W = 640, H = height, L = 44, R = 8, T = 10, B = 26;
    const totals = labels.map((_, i) => series.reduce((t, s) => t + (s.data[i] || 0), 0));
    const max = niceMax(stacked ? Math.max(...totals) : Math.max(...series.flatMap((s) => s.data)));
    const iw = W - L - R, ih = H - T - B, bw = iw / labels.length;
    const y = (v) => T + ih - (v / max) * ih;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
    const gw = stacked ? Math.min(36, bw * 0.62) : Math.min(22, (bw * 0.7) / series.length);
    return html`<div style="position:relative">
      ${legend ? html`<div class="legend" style="margin-bottom:8px">${series.map((s, i) => html`<span><i style=${`background:${s.color || SERIES[i]}`}></i>${s.name}</span>`)}</div>` : null}
      <svg class="chart" viewBox=${`0 0 ${W} ${H}`} width="100%" style="display:block" onMouseLeave=${() => setTip(null)}>
        ${ticks.map((t) => html`<line class="grid-line" x1=${L} x2=${W - R} y1=${y(t)} y2=${y(t)} /><text x=${L - 8} y=${y(t) + 4} text-anchor="end">${fmtAxis(t, yFmt)}</text>`)}
        ${labels.map((lb, i) => {
          const cx = L + bw * i + bw / 2;
          let acc = 0;
          const bars = series.map((s, si) => {
            const v = s.data[i] || 0;
            const x = stacked ? cx - gw / 2 : cx - (gw * series.length) / 2 + gw * si;
            const y0 = stacked ? y(acc + v) : y(v);
            const hh = stacked ? y(acc) - y(acc + v) : T + ih - y(v);
            acc += v;
            const op = highlight != null && highlight !== i ? 0.35 : 1;
            return html`<rect x=${x + (stacked ? 0 : 1)} y=${y0} width=${stacked ? gw : gw - 2} height=${Math.max(0, hh)} rx=${stacked ? 0 : 3} fill=${s.color || SERIES[si]} opacity=${op} />`;
          });
          return html`<g onMouseEnter=${(e) => { const box = e.currentTarget.ownerSVGElement.getBoundingClientRect(); setTip({ x: (cx / W) * box.width, y: (y(stacked ? totals[i] : Math.max(...series.map((s) => s.data[i] || 0))) / H) * box.height, html: html`<b>${lb}</b>${series.map((s, si) => html`<div><i style=${`display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${s.color || SERIES[si]}`}></i>${series.length > 1 ? s.name + ': ' : ''}${fmt(s.data[i] || 0)}</div>`)}` }); }}>
            <rect x=${L + bw * i} y=${T} width=${bw} height=${ih} fill="transparent" />${bars}
            <text x=${cx} y=${H - 8} text-anchor="middle">${lb}</text></g>`;
        })}
      </svg><${Tip} tip=${tip} /></div>`;
  }

  /** Line({ labels, series:[{name,data,color?,dash?}], height, area, fmt, yFmt, min }) */
  function Line({ labels, series, height = 220, area = true, fmt = (v) => PO.num(v), yFmt, legend = series.length > 1, zero = false }) {
    const [tip, setTip] = useState(null);
    const W = 640, H = height, L = 48, R = 12, T = 12, B = 26;
    const all = series.flatMap((s) => s.data);
    const max = niceMax(Math.max(...all) * 1.04);
    const rawMin = Math.min(...all);
    const min = zero ? 0 : Math.max(0, Math.floor((rawMin - (max - rawMin) * 0.3) / (max / 10)) * (max / 10));
    const iw = W - L - R, ih = H - T - B;
    const x = (i) => L + (labels.length === 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
    const y = (v) => T + ih - ((v - min) / (max - min || 1)) * ih;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));
    const step = Math.ceil(labels.length / 8);
    return html`<div style="position:relative">
      ${legend ? html`<div class="legend" style="margin-bottom:8px">${series.map((s, i) => html`<span><i style=${`background:${s.color || SERIES[i]}`}></i>${s.name}</span>`)}</div>` : null}
      <svg class="chart" viewBox=${`0 0 ${W} ${H}`} width="100%" style="display:block" onMouseLeave=${() => setTip(null)}>
        <defs>${series.map((s, i) => html`<linearGradient id=${'lg' + i + (s.name || '').replace(/\W/g, '')} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color=${s.color || SERIES[i]} stop-opacity="0.18" /><stop offset="1" stop-color=${s.color || SERIES[i]} stop-opacity="0" /></linearGradient>`)}</defs>
        ${ticks.map((t) => html`<line class="grid-line" x1=${L} x2=${W - R} y1=${y(t)} y2=${y(t)} /><text x=${L - 8} y=${y(t) + 4} text-anchor="end">${fmtAxis(t, yFmt)}</text>`)}
        ${labels.map((lb, i) => (i % step === 0 || i === labels.length - 1) ? html`<text x=${x(i)} y=${H - 8} text-anchor="middle">${lb}</text>` : null)}
        ${series.map((s, si) => { const d = s.data.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '); const c = s.color || SERIES[si]; return html`<g>${area && si === 0 ? html`<path d=${d + ` L ${x(s.data.length - 1)} ${T + ih} L ${x(0)} ${T + ih} Z`} fill=${`url(#lg${si}${(s.name || '').replace(/\W/g, '')})`} />` : null}<path d=${d} fill="none" stroke=${c} stroke-width="2" stroke-dasharray=${s.dash ? '5 4' : ''} stroke-linejoin="round" stroke-linecap="round" /></g>`; })}
        ${labels.map((lb, i) => html`<rect x=${x(i) - iw / labels.length / 2} y=${T} width=${iw / labels.length} height=${ih} fill="transparent" onMouseEnter=${(e) => { const box = e.currentTarget.ownerSVGElement.getBoundingClientRect(); setTip({ i, x: (x(i) / W) * box.width, y: (y(Math.max(...series.map((s) => s.data[i]))) / H) * box.height, html: html`<b>${lb}</b>${series.map((s, si) => html`<div><i style=${`display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${s.color || SERIES[si]}`}></i>${series.length > 1 ? s.name + ': ' : ''}${fmt(s.data[i])}</div>`)}` }); }} />`)}
        ${tip ? html`<line x1=${x(tip.i)} x2=${x(tip.i)} y1=${T} y2=${T + ih} stroke="var(--border-strong)" stroke-dasharray="3 3" />${series.map((s, si) => html`<circle cx=${x(tip.i)} cy=${y(s.data[tip.i])} r="4" fill="var(--surface)" stroke=${s.color || SERIES[si]} stroke-width="2" />`)}` : null}
      </svg><${Tip} tip=${tip} /></div>`;
  }

  /** Donut({ data:[{label, value, color?}], size, thickness, center, sub, fmt }) */
  function Donut({ data, size = 150, thickness = 18, center, sub, fmt = (v) => PO.num(v), legend = true }) {
    const total = data.reduce((t, d) => t + d.value, 0) || 1;
    const r = (size - thickness) / 2, c = 2 * Math.PI * r;
    let off = 0;
    return html`<div class="row gap-16" style="align-items:center">
      <div style=${`position:relative;width:${size}px;height:${size}px;flex:none`}>
        <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} style="transform:rotate(-90deg)"><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--surface-3)" stroke-width=${thickness} />
          ${data.map((d, i) => { const len = (d.value / total) * c; const el = html`<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${d.color || SERIES[i % SERIES.length]} stroke-width=${thickness} stroke-dasharray=${`${Math.max(0, len - 1.5)} ${c}`} stroke-dashoffset=${-off}><title>${d.label}: ${fmt(d.value)}</title></circle>`; off += len; return el; })}
        </svg>
        <div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div class="t-xl w-600 tnum">${center ?? fmt(total)}</div>${sub ? html`<div class="faint t-xs">${sub}</div>` : null}</div></div>
      </div>
      ${legend ? html`<div class="col grow" style="gap:6px">${data.map((d, i) => html`<div class="row t-sm"><i style=${`width:9px;height:9px;border-radius:3px;background:${d.color || SERIES[i % SERIES.length]};flex:none`}></i><span class="grow muted ellipsis">${d.label}</span><b class="tnum w-600">${fmt(d.value)}</b><span class="faint tnum" style="width:38px;text-align:right">${Math.round((d.value / total) * 100)}%</span></div>`)}</div>` : null}
    </div>`;
  }

  /** HBars({ data:[{label, value, color?, sub?}], fmt, max }) — ranked horizontal bars */
  function HBars({ data, fmt = (v) => PO.num(v), max, color = 'var(--chart-1)' }) {
    const m = max || Math.max(...data.map((d) => d.value)) || 1;
    return html`<div class="col" style="gap:10px">${data.map((d) => html`<div><div class="row t-sm" style="margin-bottom:4px"><span class="grow ellipsis">${d.label}</span>${d.sub ? html`<span class="faint">${d.sub}</span>` : null}<b class="tnum w-600">${fmt(d.value)}</b></div><div class="prog" style="height:8px"><i style=${`width:${(d.value / m) * 100}%;background:${d.color || color}`}></i></div></div>`)}</div>`;
  }

  /** Heatmap({ rows:[label], cols:[label], value:(ri,ci)=>n, fmt }) */
  function Heatmap({ rows, cols, value, fmt = (v) => v, color = '31, 77, 61' }) {
    const vals = rows.flatMap((_, ri) => cols.map((_, ci) => value(ri, ci)));
    const max = Math.max(...vals) || 1;
    return html`<div class="scroll-x"><table class="tbl compact" style="width:auto"><thead><tr><th></th>${cols.map((c) => html`<th class="c">${c}</th>`)}</tr></thead><tbody>${rows.map((r, ri) => html`<tr><td class="w-500" style="white-space:nowrap">${r}</td>${cols.map((_, ci) => { const v = value(ri, ci); return html`<td class="c tnum" style=${`background:rgba(${color},${(0.07 + (v / max) * 0.83).toFixed(2)});color:${v / max > 0.5 ? '#fff' : 'inherit'};font-weight:${v / max > 0.5 ? 600 : 400};min-width:44px`}>${fmt(v)}</td>`; })}</tr>`)}</tbody></table></div>`;
  }

  /** Gauge-like ring: Ring({ value: 0..1, size, color, label }) */
  function Ring({ value, size = 44, stroke = 5, color = 'var(--brand)', label }) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return html`<span class="ring" style=${`width:${size}px;height:${size}px`}><svg width=${size} height=${size} style="transform:rotate(-90deg)"><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--surface-3)" stroke-width=${stroke} /><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${color} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${c * Math.max(0, Math.min(1, value))} ${c}`} /></svg><span>${label ?? Math.round(value * 100) + '%'}</span></span>`;
  }

  PO.Charts = { Sparkline, Bars, Line, Donut, HBars, Heatmap, Ring, SERIES };
})();
