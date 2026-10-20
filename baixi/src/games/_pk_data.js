/* 物理弹射小工具包 — shared by artillery / curling / minigolf / bowling / touhu (visual + input helpers only;
   nothing here touches game state, so it is free to use Math.random / trig). */
BX.data.pk = (function () {
  const D = BX.draw, K = {};
  K.TAU = Math.PI * 2;

  /* ---------- one-time CSS for small DOM controls ---------- */
  K.css = function () {
    if (document.getElementById('pk-style')) return;
    const s = document.createElement('style'); s.id = 'pk-style';
    s.textContent = `
.pk-bar{position:absolute;left:0;right:0;bottom:max(6px,env(safe-area-inset-bottom));display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;padding:0 6px;pointer-events:none!important}
.pk-bar>*{pointer-events:auto}
.pk-bar.hide,.pk-side.hide{visibility:hidden}
.pk-side{position:absolute;right:max(6px,env(safe-area-inset-right));top:6px;bottom:6px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:6px;pointer-events:none!important}
.pk-side>*{pointer-events:auto}
.pk-seg{display:inline-flex;background:rgba(30,18,8,.82);border:1px solid rgba(230,197,125,.35);border-radius:12px;padding:2px;gap:2px;align-items:center;box-shadow:0 3px 10px rgba(0,0,0,.35)}
.pk-seg b{color:#e6c57d;font-size:12px;padding:0 5px;font-weight:600;white-space:nowrap}
.pk-seg button{border:none;background:transparent;color:#f3e2c0;min-width:40px;height:40px;border-radius:9px;font-size:14px;padding:0 7px;white-space:nowrap;line-height:1.05}
.pk-seg button small{display:block;font-size:10px;opacity:.8}
.pk-seg button.on{background:linear-gradient(180deg,#e6c57d,#c8a052);color:#3a2410;font-weight:700}
.pk-seg button:disabled{opacity:.32}
.pk-go{min-height:42px!important;padding:6px 16px!important}`;
    document.head.append(s);
  };
  /* segmented control: items [[value, html]], returns {el, set(v), refresh()} */
  K.seg = function (parent, label, items, get, set) {
    const el = BX.h('div', {class: 'pk-seg'}); if (label) el.append(BX.h('b', {text: label}));
    const bs = items.map(([v, html]) => { const b = BX.h('button', {html, on: {click: e => { e.stopPropagation(); set(v); refresh(); BX.sfx.play('click'); }}}); b._v = v; el.append(b); return b; });
    function refresh() { const cur = get(); for (const b of bs) b.classList.toggle('on', b._v === cur); }
    parent.append(el); refresh();
    return {el, bs, refresh};
  };

  /* ---------- playback clock (frame driven, slow-mo windows, fast in tests, fallback timer) ---------- */
  K.playback = function (ctx) {
    const pb = {on: false, t: 0, dur: 0, slow: [], done: null, rate: 1, id: 0, timer: 0, ff: false};
    pb.start = (dur, done, slow) => {
      pb.id++; const id = pb.id;
      if (ctx.fast) { pb.on = false; done && done(); return; }
      Object.assign(pb, {on: true, t: 0, dur: Math.max(.05, dur), done, slow: slow || [], ff: false});
      ctx.cancel(pb.timer);
      pb.timer = ctx.after(pb.dur * 1000 * 3.5 + 1500, () => { if (pb.on && pb.id === id) pb.finish(); });
    };
    pb.finish = () => { if (!pb.on) return; pb.on = false; ctx.cancel(pb.timer); const d = pb.done; pb.done = null; if (d) d(); ctx.poke(); };
    pb.tick = dt => {
      if (!pb.on) return;
      pb.rate = 1;
      if (!pb.ff) for (const s of pb.slow) if (pb.t > s[0] && pb.t < s[1]) pb.rate = s[2] || .3;
      pb.t += dt * (BX.test ? 25 : 1) * pb.rate * (pb.ff ? 4 : 1);
      if (pb.t >= pb.dur) { pb.t = pb.dur; pb.finish(); }
    };
    return pb;
  };

  /* ---------- particles / shake / floating texts (world coords, screen-size px) ---------- */
  K.fx = function () {
    const P = [], T = [], F = {P, T, sh: 0, flash: 0, flashC: '255,230,170'};
    F.burst = (x, y, o = {}) => {
      const n = o.n || 12;
      for (let i = 0; i < n; i++) {
        const a = o.a0 != null ? o.a0 + (Math.random() - .5) * (o.spread != null ? o.spread : K.TAU) : Math.random() * K.TAU;
        const sp = (o.sp || 100) * (.25 + Math.random() * .9);
        P.push({x, y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0), life: (o.life || .8) * (.55 + Math.random() * .7), t: 0,
          size: (o.size || 3) * (.5 + Math.random()), color: Array.isArray(o.color) ? o.color[i % o.color.length] : (o.color || '#fff'), g: o.g || 0, drag: o.drag != null ? o.drag : 1.5, kind: o.kind || 'dot', grow: o.grow || 0});
      }
    };
    F.text = (x, y, s, o = {}) => T.push(Object.assign({x, y, s, t: 0, life: 1.5, color: '#fff3d6', size: 20, rise: 40}, o));
    F.shake = a => { F.sh = Math.max(F.sh, a); };
    F.flashOn = (a, c) => { F.flash = Math.max(F.flash, a); if (c) F.flashC = c; };
    F.update = dt => {
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.t += dt; if (p.t >= p.life) { P.splice(i, 1); continue; }
        const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = T.length - 1; i >= 0; i--) { T[i].t += dt; if (T[i].t >= T[i].life) T.splice(i, 1); }
      F.sh = Math.max(0, F.sh - dt * 30); F.flash = Math.max(0, F.flash - dt * 2.2);
      if (P.length > 600) P.splice(0, P.length - 600);
    };
    F.off = () => F.sh > .2 ? [(Math.random() - .5) * F.sh, (Math.random() - .5) * F.sh] : [0, 0];
    /* tf(x,y) → [sx,sy] */
    F.draw = (g, tf, sc = 1) => {
      for (const p of P) {
        const k = p.t / p.life, [sx, sy] = tf(p.x, p.y), a = 1 - k;
        if (p.kind === 'smoke') { g.fillStyle = `rgba(${p.color},${.35 * a})`; D.circle(g, sx, sy, p.size * (1 + k * (p.grow || 3)) * sc); g.fill(); }
        else if (p.kind === 'spark') { const [ex, ey] = tf(p.x - p.vx * .04, p.y - p.vy * .04); g.strokeStyle = p.color; g.globalAlpha = a; g.lineWidth = p.size * sc * .6; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke(); g.globalAlpha = 1; }
        else { g.globalAlpha = a; g.fillStyle = p.color; D.circle(g, sx, sy, Math.max(.5, p.size * sc * (1 - k * .5))); g.fill(); g.globalAlpha = 1; }
      }
      for (const t of T) {
        const k = t.t / t.life, [sx, sy] = tf(t.x, t.y), pop = k < .15 ? .6 + k / .15 * .5 : k < .25 ? 1.1 - (k - .15) : 1;
        g.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
        D.text(g, t.s, sx, sy - t.rise * k + (t.dy || 0), {size: t.size * pop, color: t.color, font: 'deco', weight: 400, stroke: 'rgba(30,15,5,.85)', strokeW: 4});
        g.globalAlpha = 1;
      }
    };
    F.drawFlash = (g, w, h) => { if (F.flash > 0) { g.fillStyle = `rgba(${F.flashC},${F.flash * .35})`; g.fillRect(0, 0, w, h); } };
    return F;
  };

  /* ---------- offscreen cache ---------- */
  K.cache = function () {
    const m = new Map();
    return (key, w, h, dpr, fn) => {
      const k = key + '|' + Math.round(w) + 'x' + Math.round(h) + '@' + dpr;
      let c = m.get(k);
      if (!c) {
        if (m.size > 6) m.clear();
        c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
        const g = c.getContext('2d'); g.scale(dpr, dpr); fn(g, w, h); m.set(k, c);
      }
      return c;
    };
  };

  /* ---------- ink-wash scenery ---------- */
  K.sky = function (g, x, y, w, h, o = {}) {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, o.top || '#efe2c4'); gr.addColorStop(.6, o.mid || '#f6ecd6'); gr.addColorStop(1, o.bot || '#e9dcbc');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    if (o.sun !== false) {
      const sx = x + w * (o.sunX || .78), sy = y + h * (o.sunY || .2), r = Math.min(w, h) * (o.sunR || .07);
      const sg = g.createRadialGradient(sx, sy, r * .2, sx, sy, r * 2.6); sg.addColorStop(0, 'rgba(214,92,62,.25)'); sg.addColorStop(1, 'rgba(214,92,62,0)');
      g.fillStyle = sg; D.circle(g, sx, sy, r * 2.6); g.fill();
      g.fillStyle = 'rgba(196,70,48,.82)'; D.circle(g, sx, sy, r); g.fill();
    }
  };
  /* layered misty mountains; o: {seed, layers, top (0..1 of h where highest ridge may reach), color:[r,g,b]} */
  K.mountains = function (g, x, y, w, h, o = {}) {
    const r = BX.rng(o.seed || 5), layers = o.layers || 3, col = o.color || [43, 33, 24];
    for (let L = 0; L < layers; L++) {
      const n = 65, pts = new Array(n).fill(0);
      // midpoint displacement ridge
      const ridge = (a, b, amp) => { if (b - a < 2) return; const m = (a + b) >> 1; pts[m] = (pts[a] + pts[b]) / 2 + (r() - .5) * amp; ridge(a, m, amp * .55); ridge(m, b, amp * .55); };
      pts[0] = r(); pts[n - 1] = r(); ridge(0, n - 1, 1.6);
      let mn = Infinity, mx = -Infinity; for (const v of pts) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
      const top = y + h * ((o.top != null ? o.top : .25) + L * (o.step != null ? o.step : .14)), bot = y + h * ((o.base != null ? o.base : .72) + L * .08);
      const alpha = (o.alpha || [.18, .3, .5])[L] != null ? (o.alpha || [.18, .3, .5])[L] : .4;
      const gr = g.createLinearGradient(0, top, 0, y + h);
      gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${alpha})`); gr.addColorStop(.55, `rgba(${col[0]},${col[1]},${col[2]},${alpha * .45})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, y + h);
      for (let i = 0; i < n; i++) { const t = (pts[i] - mn) / (mx - mn || 1); g.lineTo(x + w * i / (n - 1), bot - (bot - top) * t); }
      g.lineTo(x + w, y + h); g.closePath(); g.fill();
      // dry brush ridge
      g.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha * .9})`; g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i < n; i++) { const t = (pts[i] - mn) / (mx - mn || 1), px = x + w * i / (n - 1), py = bot - (bot - top) * t; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    }
  };
  K.birds = function (g, x, y, s, n = 3) { g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = Math.max(1, s * .12); for (let i = 0; i < n; i++) { const bx = x + i * s * 1.6, by = y + (i % 2) * s * .7; g.beginPath(); g.moveTo(bx - s * .5, by - s * .2); g.quadraticCurveTo(bx - s * .2, by - s * .35, bx, by); g.quadraticCurveTo(bx + s * .2, by - s * .35, bx + s * .5, by - s * .2); g.stroke(); } };
  /* small vermilion seal with 1–2 chars */
  K.seal = function (g, x, y, s, ch) { g.fillStyle = '#b23a2b'; D.rr(g, x - s / 2, y - s / 2, s, s, s * .14); g.fill(); g.strokeStyle = 'rgba(255,235,210,.75)'; g.lineWidth = Math.max(1, s * .05); D.rr(g, x - s * .4, y - s * .4, s * .8, s * .8, s * .08); g.stroke(); D.text(g, ch, x, y + s * .03, {size: s * (ch.length > 1 ? .36 : .6), color: '#fff1dc', font: 'deco', weight: 400}); };

  /* ---------- slingshot drag aiming ----------
     o = {enabled(), accept?(p,e) → bool, max() px, min (power), change?(s), release(s), cancel?(s)}
     s = {on, x0,y0 (press), x,y (current), dx,dy (unit, opposite to pull, screen), p 0..1} */
  K.sling = function (ctx, cv, o) {
    const s = {on: false, x0: 0, y0: 0, x: 0, y: 0, dx: 0, dy: -1, p: 0, id: null};
    const max = () => o.max ? o.max() : Math.min(cv.w, cv.h) * .3;
    const upd = p => { s.x = p.x; s.y = p.y; const vx = s.x0 - s.x, vy = s.y0 - s.y, L = Math.hypot(vx, vy); s.p = Math.min(1, L / max()); if (L > 4) { s.dx = vx / L; s.dy = vy / L; } o.change && o.change(s); };
    ctx.on(cv.cv, 'pointerdown', e => {
      if (s.on || !o.enabled()) return; const p = cv.pos(e);
      if (o.accept && !o.accept(p, e)) return;
      s.on = true; s.id = e.pointerId; s.x0 = p.x; s.y0 = p.y; s.p = 0;
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
      upd(p);
    });
    ctx.on(cv.cv, 'pointermove', e => { if (s.on && e.pointerId === s.id) upd(cv.pos(e)); });
    const up = e => {
      if (!s.on || e.pointerId !== s.id) return; s.on = false;
      if (e.type === 'pointercancel' || !o.enabled()) return;
      if (s.p < (o.min || .07)) { o.cancel && o.cancel(s); return; }
      o.release(s);
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    return s;
  };
  /* rubber band + knob from projectile (ox,oy) in pull direction */
  K.drawPull = function (g, ox, oy, s, len, col = '#e6c57d') {
    const px = ox - s.dx * len * s.p, py = oy - s.dy * len * s.p;
    g.strokeStyle = 'rgba(40,20,8,.55)'; g.lineWidth = 5; g.setLineDash([]); g.beginPath(); g.moveTo(ox, oy); g.lineTo(px, py); g.stroke();
    g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ox, oy); g.lineTo(px, py); g.stroke();
    D.disc(g, px, py, 9, '#8a2a20', {ring: '#f3e2c0'});
  };
  /* power meter (vertical); p 0..1 */
  K.meter = function (g, x, y, w, h, p, o = {}) {
    g.save();
    g.fillStyle = 'rgba(30,18,8,.75)'; D.rr(g, x - 3, y - 3, w + 6, h + 6, w * .5 + 3); g.fill();
    const gr = g.createLinearGradient(0, y + h, 0, y); gr.addColorStop(0, '#5aa08a'); gr.addColorStop(.55, '#e6c57d'); gr.addColorStop(1, '#d0533f');
    g.save(); D.rr(g, x, y, w, h, w * .5); g.clip();
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, w, h);
    g.fillStyle = gr; g.fillRect(x, y + h * (1 - p), w, h * p);
    if (o.marks) for (const [m, lab] of o.marks) { g.fillStyle = 'rgba(255,250,235,.7)'; g.fillRect(x, y + h * (1 - m) - .5, w, 1.5); }
    g.restore();
    if (o.marks && o.labels !== false) for (const [m, lab] of o.marks) if (lab) D.text(g, lab, x - 6, y + h * (1 - m), {size: 11, color: '#f3e2c0', align: 'right', stroke: 'rgba(0,0,0,.6)', strokeW: 3});
    D.text(g, Math.round(p * 100) + '', x + w / 2, y - 14, {size: 13, color: '#ffe9b8', stroke: 'rgba(0,0,0,.6)', strokeW: 3});
    g.restore();
  };
  /* dashed guide polyline through screen points */
  K.guide = function (g, pts, o = {}) {
    if (pts.length < 2) return;
    g.save(); g.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      const k = i / pts.length; g.globalAlpha = (o.alpha || .9) * (1 - k * (o.fade != null ? o.fade : .8));
      g.strokeStyle = o.color || '#fff6dd'; g.lineWidth = o.w || 2.5; g.setLineDash(o.dash || [6, 7]);
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
    }
    g.restore();
  };
  /* wind flag/arrow at (x,y); w −1..1 */
  K.wind = function (g, x, y, w, size = 1, label = '风') {
    g.save(); g.translate(x, y); g.scale(size, size);
    g.fillStyle = 'rgba(30,18,8,.72)'; D.rr(g, -58, -20, 116, 40, 12); g.fill();
    D.text(g, label, -40, 1, {size: 15, color: '#e6c57d', font: 'deco', weight: 400});
    const L = Math.abs(w) * 48, dir = w >= 0 ? 1 : -1;
    g.strokeStyle = '#f3e2c0'; g.lineWidth = 3; g.lineCap = 'round';
    if (L < 3) { D.text(g, '无风', 12, 1, {size: 13, color: '#f3e2c0'}); g.restore(); return; }
    const x0 = 12 - dir * L / 2, x1 = 12 + dir * L / 2;
    g.beginPath(); g.moveTo(x0, 0); g.lineTo(x1, 0); g.moveTo(x1, 0); g.lineTo(x1 - dir * 8, -6); g.moveTo(x1, 0); g.lineTo(x1 - dir * 8, 6); g.stroke();
    g.restore();
  };
  return K;
})();
