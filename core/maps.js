/* People OS maps: real Google Maps (keyless embed) with People OS pins positioned on top.
   The embed is fixed (no panning inside it) so our pins stay exactly on their coordinates; zoom, recentre,
   map/satellite and "Open in Google Maps" are our own controls. Sites carry lat/lng/address (core/data-extra.js).

   <${PO.GMap} pins=${[{ id, lat, lng, label, sub, tone:'green'|'amber'|'red'|'slate'|'brand', count, ring }]}
               selected=${id} onPick=${(id) => …} height=${460} pad=${70} zoomBias=${0} children=${legend} />
   <${PO.GMapPlace} lat lng zoom=${16} height=${260} radius=${150} label="Main gate" />   (single site, with geofence ring)
*/
(function () {
  const PO = window.PO;
  const { html, useState, useEffect, useRef, useMemo } = PO;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .gm { position: relative; overflow: hidden; border-radius: var(--r-lg); border: 1px solid var(--border); background: #e8eaed; }
  .gm iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; pointer-events: none; }
  .gm-pins { position: absolute; inset: 0; }
  .gm-pin { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: pointer; z-index: 2; }
  .gm-pin:hover, .gm-pin.sel { z-index: 3; }
  .gm-pin.compact .gm-head { padding: 3px; }
  .gm-pin.compact:hover .gm-head::after { content: attr(data-l); }
  .gm-head { display: flex; align-items: center; gap: 6px; padding: 4px 9px 4px 4px; border-radius: 18px; background: #fff; color: #121218; font-size: 12px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 8px rgba(16,18,40,.22), 0 0 0 1px rgba(16,18,40,.06); transition: transform .12s; }
  .gm-pin:hover .gm-head, .gm-pin.sel .gm-head { transform: translateY(-2px) scale(1.04); }
  .gm-pin.sel .gm-head { box-shadow: 0 4px 14px rgba(16,18,40,.3), 0 0 0 2px var(--brand); }
  .gm-dot { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 700; background: #3b9463; }
  .gm-dot.amber { background: #d68a1c; } .gm-dot.red { background: #c94a3a; } .gm-dot.slate { background: #78857f; } .gm-dot.brand { background: #1f4d3d; }
  .gm-head small { font-weight: 500; color: #6b6d78; }
  .gm-stem { width: 2px; height: 9px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25); }
  .gm-base { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff; background: #1f4d3d; box-shadow: 0 1px 3px rgba(0,0,0,.35); margin-top: -1px; }
  .gm-ctl { position: absolute; right: 10px; top: 10px; display: flex; flex-direction: column; gap: 6px; z-index: 4; }
  .gm-ctl .grp { display: flex; flex-direction: column; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.22); overflow: hidden; }
  .gm-ctl button { width: 32px; height: 32px; border: none; background: #fff; color: #3c4043; cursor: pointer; display: grid; place-items: center; }
  .gm-ctl button:hover { background: #f1f3f4; }
  .gm-ctl .grp button + button { border-top: 1px solid #e8eaed; }
  .gm-type { position: absolute; left: 10px; bottom: 26px; z-index: 4; display: flex; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.22); overflow: hidden; }
  .gm-type button { height: 28px; padding: 0 10px; border: none; background: #fff; font-size: 12px; font-weight: 550; color: #3c4043; cursor: pointer; }
  .gm-type button[aria-pressed='true'] { background: #e8f0fe; color: #1a56db; }
  .gm-open { position: absolute; right: 10px; bottom: 26px; z-index: 4; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 8px; background: #fff; color: #1a56db; font-size: 12px; font-weight: 550; box-shadow: 0 1px 4px rgba(0,0,0,.22); }
  .gm-slot { position: absolute; left: 10px; top: 10px; z-index: 4; }
  .gm-fence { position: absolute; border-radius: 50%; border: 2px dashed rgba(31,77,61,.9); background: rgba(31,77,61,.12); transform: translate(-50%, -50%); pointer-events: none; z-index: 1; }
  .gm-me { position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #1a73e8; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(26,115,232,.22), 0 1px 3px rgba(0,0,0,.4); transform: translate(-50%, -50%); z-index: 2; }
  .gm-acc { position: absolute; border-radius: 50%; background: rgba(26,115,232,.14); border: 1px solid rgba(26,115,232,.4); transform: translate(-50%, -50%); z-index: 1; pointer-events: none; }
  </style>`);

  /* Web Mercator in 256px world coordinates at zoom z */
  const wx = (lng, z) => ((lng + 180) / 360) * 256 * Math.pow(2, z);
  const wy = (lat, z) => { const s = Math.sin((lat * Math.PI) / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * Math.pow(2, z); };
  const mPerPx = (lat, z) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, z);

  function useSize(ref) {
    const [s, setS] = useState({ w: 0, h: 0 });
    useEffect(() => {
      const el = ref.current; if (!el) return;
      const ro = new ResizeObserver(() => setS({ w: el.clientWidth, h: el.clientHeight }));
      ro.observe(el); setS({ w: el.clientWidth, h: el.clientHeight });
      return () => ro.disconnect();
    }, []);
    return s;
  }
  const embed = (lat, lng, z, type, pin) => `https://maps.google.com/maps?${pin ? 'q' : 'll'}=${lat.toFixed(5)},${lng.toFixed(5)}&z=${z}&t=${type}&hl=en&output=embed`;
  const openUrl = (lat, lng, label) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label ? label : lat + ',' + lng)}${label ? '' : ''}`;

  /** Fit pins into a box: returns { lat, lng, z } (integer zoom, as the embed needs). */
  function fit(pins, w, h, pad) {
    if (!pins.length) return { lat: 0, lng: 0, z: 2 };
    if (pins.length === 1) return { lat: pins[0].lat, lng: pins[0].lng, z: 15 };
    let z = 17;
    for (; z > 2; z--) {
      const xs = pins.map((p) => wx(p.lng, z)), ys = pins.map((p) => wy(p.lat, z));
      if (Math.max(...xs) - Math.min(...xs) <= w - pad * 2 && Math.max(...ys) - Math.min(...ys) <= h - pad * 2 - 30) break;
    }
    const lats = pins.map((p) => p.lat), lngs = pins.map((p) => p.lng);
    // centre in projected space so the box is visually centred; shift down a little for pin heads
    const cy = (Math.max(...pins.map((p) => wy(p.lat, z))) + Math.min(...pins.map((p) => wy(p.lat, z)))) / 2 - 14;
    const n = Math.PI - (2 * Math.PI * cy) / (256 * Math.pow(2, z));
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return { lat, lng: (Math.max(...lngs) + Math.min(...lngs)) / 2, z };
  }

  function GMap({ pins = [], selected, onPick, height = 460, pad = 70, zoomBias = 0, children, title = 'Locations' }) {
    const ref = useRef();
    const { w, h } = useSize(ref);
    const [type, setType] = useState('m');
    const [dz, setDz] = useState(zoomBias);
    const [focus, setFocus] = useState(null); // {lat,lng} when recentred on a pin
    const base = useMemo(() => (w ? fit(pins, w, h || height, pad) : null), [w, h, pins.map((p) => p.id + p.lat).join()]);
    const view = base && { lat: focus ? focus.lat : base.lat, lng: focus ? focus.lng : base.lng, z: Math.max(3, Math.min(19, base.z + dz)) };
    const px = (p) => ({ x: w / 2 + wx(p.lng, view.z) - wx(view.lng, view.z), y: (h || height) / 2 + wy(p.lat, view.z) - wy(view.lat, view.z) });
    const sel = pins.find((p) => p.id === selected);
    return html`<div class="gm" ref=${ref} style=${`height:${height}px`}>
      ${view ? html`<iframe title=${title} loading="lazy" referrerpolicy="no-referrer-when-downgrade" src=${embed(view.lat, view.lng, view.z, type)}></iframe>` : null}
      ${view ? html`<div class="gm-pins">${(() => {
        /* declutter: most important pins keep their label; overlapping ones collapse to the status bubble */
        const order = pins.map((p) => ({ p, q: px(p) })).sort((A, B) => (B.p.id === selected) - (A.p.id === selected) || (B.p.count || 0) - (A.p.count || 0));
        const placed = []; const compact = new Set();
        order.forEach(({ p, q }) => { const wd = 34 + (p.label || '').length * 7 + (p.sub ? p.sub.length * 6 : 0); const r = { l: q.x - wd / 2, r: q.x + wd / 2, t: q.y - 40, b: q.y - 12 }; if (placed.some((o) => r.l < o.r && r.r > o.l && r.t < o.b && r.b > o.t)) compact.add(p.id); else placed.push(r); });
        return pins.map((p) => { const q = px(p); if (q.x < -40 || q.y < -10 || q.x > w + 40 || q.y > (h || height) + 40) return null; const c = compact.has(p.id); return html`<div class=${'gm-pin ' + (p.id === selected ? 'sel' : '') + (c ? ' compact' : '')} style=${`left:${q.x}px;top:${q.y}px`} onClick=${() => onPick && onPick(p.id)} title=${p.sub ? p.label + ', ' + p.sub : p.label}>
          <div class="gm-head">${p.count != null ? html`<span class=${'gm-dot ' + (p.tone || 'green')}>${p.count}</span>` : html`<span class=${'gm-dot ' + (p.tone || 'brand')}><${PO.Icon} n=${p.icon || 'MapPin'} size=${12} stroke=${2.4} /></span>`}${c ? null : html`<span>${p.label}</span>`}${!c && p.sub ? html`<small>${p.sub}</small>` : null}</div>
          <div class="gm-stem"></div><div class="gm-base" style=${p.tone === 'red' ? 'background:#c94a3a' : p.tone === 'amber' ? 'background:#d68a1c' : p.tone === 'green' ? 'background:#3b9463' : ''}></div>
        </div>`; }); })()}</div>` : null}
      <div class="gm-ctl"><div class="grp"><button title="Zoom in" onClick=${() => setDz(dz + 1)}><${PO.Icon} n="Plus" size=${16} /></button><button title="Zoom out" onClick=${() => setDz(dz - 1)}><${PO.Icon} n="Minus" size=${16} /></button></div>
        <div class="grp"><button title=${sel ? 'Centre on ' + sel.label : 'Show all locations'} onClick=${() => { if (sel && !focus) { setFocus({ lat: sel.lat, lng: sel.lng }); setDz(Math.max(dz, 2)); } else { setFocus(null); setDz(zoomBias); } }}><${PO.Icon} n=${sel && !focus ? 'Crosshair' : 'Maximize'} size=${15} /></button></div></div>
      <div class="gm-type"><button aria-pressed=${type === 'm'} onClick=${() => setType('m')}>Map</button><button aria-pressed=${type === 'k'} onClick=${() => setType('k')}>Satellite</button></div>
      ${view ? html`<a class="gm-open" href=${sel ? openUrl(sel.lat, sel.lng, sel.address || null) : `https://www.google.com/maps/@${view.lat.toFixed(5)},${view.lng.toFixed(5)},${view.z}z`} target="_blank" rel="noopener"><${PO.Icon} n="ExternalLink" size=${13} />Open in Google Maps</a>` : null}
      ${children ? html`<div class="gm-slot">${children}</div>` : null}
    </div>`;
  }

  /** Single location with a real Google pin, optional geofence ring and an optional "you are here" dot (meters offset). */
  function GMapPlace({ lat, lng, zoom = 16, height = 240, radius, me, label, address, type: t0 = 'm' }) {
    const ref = useRef();
    const { w, h } = useSize(ref);
    const [type, setType] = useState(t0);
    const H = h || height;
    const r = radius && w ? radius / mPerPx(lat, zoom) : 0;
    const mePt = me && w ? { x: w / 2 + me.dx / mPerPx(lat, zoom), y: H / 2 - me.dy / mPerPx(lat, zoom), acc: me.acc / mPerPx(lat, zoom) } : null;
    return html`<div class="gm" ref=${ref} style=${`height:${height}px`}>
      <iframe title=${label || 'Location'} loading="lazy" src=${embed(lat, lng, zoom, type, !radius)}></iframe>
      ${r ? html`<div class="gm-fence" style=${`left:${w / 2}px;top:${H / 2}px;width:${r * 2}px;height:${r * 2}px`}></div><div class="gm-pin" style=${`left:${w / 2}px;top:${H / 2}px`}><div class="gm-head"><span class="gm-dot brand"><${PO.Icon} n="Building2" size=${12} stroke=${2.4} /></span><span>${label || 'Site'}</span><small>${PO.isUS && PO.isUS() ? Math.round(radius * 3.281) + ' ft' : radius + ' m'} fence</small></div><div class="gm-stem"></div><div class="gm-base"></div></div>` : null}
      ${mePt ? html`<div class="gm-acc" style=${`left:${mePt.x}px;top:${mePt.y}px;width:${mePt.acc * 2}px;height:${mePt.acc * 2}px`}></div><div class="gm-me" style=${`left:${mePt.x}px;top:${mePt.y}px`}></div>` : null}
      ${w >= 420 ? html`<div class="gm-type"><button aria-pressed=${type === 'm'} onClick=${() => setType('m')}>Map</button><button aria-pressed=${type === 'k'} onClick=${() => setType('k')}>Satellite</button></div>` : null}
      <a class="gm-open" href=${openUrl(lat, lng, address || null)} target="_blank" rel="noopener" title="Open in Google Maps"><${PO.Icon} n="ExternalLink" size=${13} />${w >= 420 ? 'Open in Google Maps' : 'Maps'}</a>
    </div>`;
  }

  /** Distance in metres between two lat/lng points (for geofence checks). */
  function distance(a, b) {
    const R = 6371000, toR = (d) => (d * Math.PI) / 180;
    const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  Object.assign(PO, { GMap, GMapPlace, geo: { distance, mPerPx } });
})();
