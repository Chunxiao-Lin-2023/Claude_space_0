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
.pk-go{min-height:42px!important;padding:6px 16px!important}
.pk-adj button{font-size:19px;font-weight:700;touch-action:none;-webkit-user-select:none;user-select:none}
.pk-adj button:active{background:rgba(230,197,125,.25)}
.pk-val{display:inline-block;min-width:44px;text-align:center;color:#ffe9b8;font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap}
.pk-val small{display:block;font-size:10px;font-weight:500;opacity:.8;color:#f3e2c0}
@media (max-width:420px){.pk-seg button{min-width:38px;padding:0 5px}.pk-val{min-width:40px}}`;
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

  /* fine-adjust stepper  [label] [−] value [+]  — press and hold repeats with an accelerating rate (340 ms delay, then
     140 ms → 32 ms intervals). step(dir, n): n = repeat count (0 on the first press); use K.acc(n) for a step multiplier. */
  K.acc = n => n < 10 ? 1 : n < 26 ? 2 : 3;
  K.adj = function (parent, label, fmt, step, o = {}) {
    const el = BX.h('div', {class: 'pk-seg pk-adj'}); if (label) el.append(BX.h('b', {text: label}));
    const val = BX.h('span', {class: 'pk-val'}); let last = null;
    const refresh = () => { const v = fmt(); if (v !== last) { last = v; val.innerHTML = v; } };
    const mk = (html, d) => {
      const b = BX.h('button', {html}); let t = 0, n = 0, iv = 140;
      const stop = () => { clearTimeout(t); t = 0; };
      const rep = () => { if (!b.isConnected) return stop(); n++; step(d, n); refresh(); if (n % 3 === 0) BX.sfx.play('tick'); iv = Math.max(32, iv * .86); t = setTimeout(rep, iv); };
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); stop(); n = 0; iv = 140; step(d, 0); refresh(); BX.sfx.play('tick');
        try { b.setPointerCapture(e.pointerId); } catch (er) {}
        t = setTimeout(rep, 340);
      });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, stop);
      b.addEventListener('click', e => e.stopPropagation());
      return b;
    };
    el.append(mk(o.minus || '−', -1), val, mk(o.plus || '+', 1)); parent.append(el); refresh();
    return {el, refresh};
  };
  /* held-key acceleration: K.keyMul(e) → 5 with Shift, else 1 → 2 → 3 the longer the same key auto-repeats */
  let kc = '', kn = 0, kt = 0;
  K.keyN = e => { const now = performance.now(); if (e.code === kc && (e.repeat || now - kt < 200)) kn++; else kn = 0; kc = e.code; kt = now; return kn; };
  K.keyMul = e => { const n = K.keyN(e); return e.shiftKey ? 5 : K.acc(n); };
  /* big action button (fire / throw) */
  K.go = function (parent, html, fn, cls = 'red') {
    const b = BX.h('button', {class: 'bx-btn pk-go ' + cls, html, on: {click: e => { e.stopPropagation(); fn(); }}}); parent.append(b); return b;
  };
  /* tap the canvas (or press space) during a playback → fast-forward it (eases up to ×4; a second tap → ×10) */
  K.skip = function (ctx, cv, pb) {
    const ff = () => { if (!pb.on || pb.t < .12) return false; if (!pb.ff) { pb.ff = true; pb.hold = 0; BX.sfx.play('whoosh'); } else pb.ff2 = true; return true; };
    ctx.on(cv.cv, 'pointerdown', ff);
    return e => { if (pb.on && /^(Space|Enter|Escape)$/.test(e.code)) { ff(); return true; } return pb.on; };
  };
  K.skipLabel = function (g, x, y, pb) {
    if (!pb.on || pb.t < .5) return;
    D.text(g, pb.ff2 ? '⏩⏩ 快进中' : pb.ff ? '⏩ 快进中 · 再点更快' : '点击画面快进 ⏩', x, y, {size: 12, color: '#fff3d6', stroke: 'rgba(30,15,5,.7)', strokeW: 3});
  };
  /* faint dashed path of the previous shot + end marker (screen points) */
  K.ghost = function (g, pts, o = {}) {
    if (!pts || pts.length < 2) return;
    g.save(); g.globalAlpha = o.alpha || .5; g.strokeStyle = o.color || '#fff6dd'; g.lineWidth = o.w || 2; g.setLineDash(o.dash || [2, 6]); g.lineCap = 'round';
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.setLineDash([]);
    const [ex, ey] = pts[pts.length - 1], r = o.r || 6;
    if (o.mark !== false) { g.lineWidth = 2.5; g.beginPath(); g.moveTo(ex - r, ey - r); g.lineTo(ex + r, ey + r); g.moveTo(ex + r, ey - r); g.lineTo(ex - r, ey + r); g.stroke(); }
    if (o.label) D.text(g, o.label, ex, ey - r - 9, {size: 11, color: o.color || '#fff6dd', stroke: 'rgba(30,15,5,.6)', strokeW: 3});
    g.restore();
  };
  K.HINT = 'rgba(63,170,128,1)';
  K.pulse = (t0, sp = 6) => .55 + .35 * Math.sin((performance.now() - t0) / 1000 * sp);
  /* measured height of a bottom bar (works while visibility:hidden) */
  K.barH = (bar, d = 60) => bar && bar.offsetHeight ? bar.offsetHeight + 12 : d;

  /* ---------- playback clock (frame driven, eased slow-mo windows, eased fast-forward, hit-stop, fast in tests, fallback timer) ---------- */
  K.playback = function (ctx) {
    const pb = {on: false, t: 0, dur: 0, slow: [], done: null, rate: 1, ffk: 1, hold: 0, id: 0, timer: 0, ff: false, ff2: false};
    const target = () => { if (pb.ff) return 1; for (const s of pb.slow) if (pb.t > s[0] && pb.t < s[1]) return s[2] || .3; return 1; };
    pb.start = (dur, done, slow) => {
      pb.id++; const id = pb.id;
      if (ctx.fast) { pb.on = false; done && done(); return; }
      Object.assign(pb, {on: true, t: 0, dur: Math.max(.05, dur), done, slow: slow || [], ff: false, ff2: false, ffk: 1, hold: 0});
      pb.rate = target();
      ctx.cancel(pb.timer);
      pb.timer = ctx.after(pb.dur * 1000 * 3.5 + 1500, () => { if (pb.on && pb.id === id) pb.finish(); });
    };
    pb.finish = () => { if (!pb.on) return; pb.on = false; ctx.cancel(pb.timer); const d = pb.done; pb.done = null; if (d) d(); ctx.poke(); };
    /* hit-stop: freeze the playback clock for a few frames on a big impact (skipped while fast-forwarding / in tests) */
    pb.hit = sec => { if (pb.on && !pb.ff && !BX.test && !ctx.fast) pb.hold = Math.max(pb.hold, Math.min(.09, sec)); };
    pb.tick = dt => {
      if (!pb.on) return;
      dt = Math.min(dt, .1);
      const tr = target(); pb.rate += (tr - pb.rate) * (1 - Math.exp(-dt / .11));
      pb.ffk += ((pb.ff2 ? 10 : pb.ff ? 4 : 1) - pb.ffk) * (1 - Math.exp(-dt / .09));
      if (pb.hold > 0) { pb.hold -= dt; return; }
      pb.t += dt * (BX.test ? 25 : 1) * pb.rate * pb.ffk * (BX.pref('speed') === 2 ? 1.6 : 1);
      if (pb.t >= pb.dur) { pb.t = pb.dur; pb.finish(); }
    };
    return pb;
  };
  /* recorded frames → interpolated frame at fractional index tf (smooth playback at any refresh rate).
     values ≥ sent are "absent" sentinels; a jump larger than `jump` between frames is a teleport (no blend). */
  K.lerpFrame = function (fr, tf, sent = 90, jump = Infinity) {
    const n = fr.length; if (!n) return {f: [], k: 0, a: 0};
    let k = Math.floor(tf); if (k >= n - 1) return {f: fr[n - 1], k: n - 1, a: 0};
    if (k < 0) k = 0;
    const a = Math.min(1, Math.max(0, tf - k)), A = fr[k], B = fr[k + 1], f = A.slice();
    for (let i = 0; i < A.length; i++) { const x = A[i], y = B[i]; if (x == null || y == null || x >= sent || y >= sent || Math.abs(y - x) > jump) continue; f[i] = x + (y - x) * a; }
    return {f, k, a};
  };
  /* synthesized impact sounds whose loudness / pitch follow the impact strength k (0..1) */
  const lastI = {};
  K.impact = function (kind, k = .5) {
    if (BX.fastReplay || BX.test || !BX.sfx.tone) return;
    const now = performance.now(); if (lastI[kind] && now - lastI[kind] < 30) return; lastI[kind] = now;
    k = Math.max(0, Math.min(1, k)); const T = BX.sfx.tone, N = BX.sfx.noise, j = 1 + (Math.random() - .5) * .12;
    try {
      if (kind === 'boom') { N(.45 + .6 * k, .22 + .45 * k, 'lowpass', 700 + 1100 * k, 50, .7); T('sine', 60 + 50 * k, 26, .35 + .5 * k, .2 + .32 * k); }
      else if (kind === 'clack') { T('sine', 1150 * j, 760, .07, .05 + .2 * k); N(.04 + .05 * k, .12 + .4 * k, 'bandpass', 2300 * j, 900, 3); T('sine', 190 * j, 120, .14, .08 + .22 * k); }
      else if (kind === 'thud') { N(.12 + .22 * k, .22 + .42 * k, 'lowpass', 1500 * j, 260, 1); T('sine', 125 * j, 55, .16 + .12 * k, .18 + .28 * k); }
      else if (kind === 'pin') { N(.05 + .05 * k, .1 + .35 * k, 'bandpass', 2700 * j, 1300, 2.5); T('triangle', 950 * j, 620, .05, .03 + .1 * k); }
      else if (kind === 'wood') { T('sine', 430 * j, 240, .07, .05 + .2 * k); N(.03, .06 + .25 * k, 'bandpass', 950 * j, 500, 2); }
      else if (kind === 'stone') { T('sine', 720 * j, 380, .09, .07 + .22 * k); N(.04, .08 + .3 * k, 'highpass', 2600, 0, 1); }
      else if (kind === 'metal') { T('sine', 1720 * j, 1680, .3 + .35 * k, .03 + .14 * k); T('sine', 2690 * j, 2650, .22, .015 + .06 * k); N(.03, .08 + .2 * k, 'highpass', 3600, 0, 1); }
      else if (kind === 'rumble') N(.42, .03 + .1 * k, 'lowpass', 240 + 220 * k, 150, 1);
      else if (kind === 'brush') N(.11, .025 + .05 * k, 'bandpass', 1700 * j, 2600, 1.2);
      else if (kind === 'tension') T('sine', 480 + 900 * k, 480 + 900 * k, .03, .03);
      else if (kind === 'max') T('square', 1600, 1600, .03, .045, 0, 3000);
      else if (kind === 'cancel') T('sine', 520, 300, .09, .07);
      else if (kind === 'cup') { T('sine', 1350 * j, 1150, .05, .12); T('sine', 1050 * j, 950, .05, .1, .07); T('sine', 820, 700, .09, .1, .15); N(.06, .12, 'lowpass', 600, 200, 1, .18); }
    } catch (e) {}
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
    F.shake = a => { F.sh = Math.max(F.sh, Math.min(16, a)); };
    F.flashOn = (a, c) => { F.flash = Math.max(F.flash, a); if (c) F.flashC = c; };
    F.update = dt => {
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.t += dt; if (p.t >= p.life) { P.splice(i, 1); continue; }
        const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = T.length - 1; i >= 0; i--) { T[i].t += dt; if (T[i].t >= T[i].life) T.splice(i, 1); }
      F.sh *= Math.exp(-dt * 9); if (F.sh < .2) F.sh = 0; F.flash = Math.max(0, F.flash - dt * 2.2);
      if (P.length > 600) P.splice(0, P.length - 600);
    };
    /* smooth (non-random) rumble, capped so effects never obscure play */
    F.off = () => { if (F.sh < .2) return [0, 0]; const t = performance.now() / 1000, a = Math.min(F.sh, 16) * .5; return [a * (Math.sin(t * 61) * .6 + Math.sin(t * 97 + 1) * .4), a * (Math.sin(t * 73 + 2) * .6 + Math.sin(t * 89 + 3) * .4)]; };
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
     o = {enabled(), accept?(p,e) → bool, max() px, engage?(s) (drag passed the dead zone — snapshot your aim here),
          change?(s), release(s), cancel?(s) (restore the snapshot), dead? px, cancelPx? px, curve?(u) → p}
     s = {on, eng, x0,y0 (press), x,y (current), dx,dy (unit, opposite to pull, screen), u 0..1 raw pull, p 0..1 power,
          over (overpull fraction), cancel (inside the cancel ring → releasing cancels), abort()}
     Feel: every coalesced pointer sample is used; dead zone (a tap never touches the aim); direction smoothed at short pulls;
     non-linear power (fine control at low power, clamped max); ticks rising in pitch as tension builds; lift-off jitter filter. */
  K.sling = function (ctx, cv, o) {
    const s = {on: false, eng: false, x0: 0, y0: 0, x: 0, y: 0, dx: 0, dy: -1, u: 0, p: 0, over: 0, cancel: false, id: null, cr: 24, hist: []};
    const max = () => o.max ? o.max() : Math.min(cv.w, cv.h) * .3;
    const DZ = o.dead != null ? o.dead : 9;
    const curve = o.curve || (u => u * (.62 + .38 * u));
    let tick = 0, maxed = false;
    const feed = pt => {
      const vx = s.x0 - pt.x, vy = s.y0 - pt.y, L = Math.hypot(vx, vy), M = max();
      s.x = pt.x; s.y = pt.y;
      if (!s.eng) { if (L < DZ) return; s.eng = true; s.dx = vx / L; s.dy = vy / L; o.engage && o.engage(s); }
      s.cr = Math.max(o.cancelPx || 24, DZ + 8);
      s.u = Math.min(1, Math.max(0, (L - DZ) / Math.max(20, M - DZ)));
      s.over = Math.max(0, L / M - 1);
      s.p = Math.round(curve(s.u) * 1000) / 1000;
      if (L > 2) {
        const nx = vx / L, ny = vy / L, a = Math.min(1, Math.max(.2, (L - DZ) / 80));
        const mx = s.dx + (nx - s.dx) * a, my = s.dy + (ny - s.dy) * a, ml = Math.hypot(mx, my) || 1;
        s.dx = mx / ml; s.dy = my / ml;
      }
      s.cancel = L < s.cr;
      s.hist.push({t: pt.t, x: pt.x, y: pt.y, dx: s.dx, dy: s.dy, p: s.p, u: s.u, over: s.over});
      if (s.hist.length > 80) s.hist.shift();
    };
    const feedback = () => {
      if (!s.eng || s.cancel) { tick = Math.floor(s.p * 10); return; }
      const tk = Math.floor(s.p * 10 + .001);
      if (tk > tick) K.impact('tension', s.p);
      tick = tk;
      if (s.p >= .999 && !maxed) { maxed = true; K.impact('max'); ctx.buzz(8); } else if (s.p < .97) maxed = false;
    };
    ctx.on(cv.cv, 'pointerdown', e => {
      if (s.on || !o.enabled()) return; const p = cv.pos(e);
      if (o.accept && !o.accept(p, e)) return;
      Object.assign(s, {on: true, eng: false, cancel: false, id: e.pointerId, x0: p.x, y0: p.y, x: p.x, y: p.y, u: 0, p: 0, over: 0, hist: []});
      tick = 0; maxed = false;
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!s.on || e.pointerId !== s.id) return;
      if (!o.enabled()) { s.on = false; return; }
      for (const pt of ctx.points(e, cv.cv)) feed(pt);
      if (s.eng) { o.change && o.change(s); feedback(); }
    });
    const up = e => {
      if (!s.on || e.pointerId !== s.id) return; s.on = false;
      if (!s.eng) return;   // a tap: aim untouched
      if (e.type === 'pointercancel' || !o.enabled() || s.cancel) { o.cancel && o.cancel(s); if (s.cancel) K.impact('cancel'); return; }
      // lift-off filter: fingers roll a few px while lifting — use the aim from ~45 ms earlier if the tail barely moved
      const H = s.hist, last = H[H.length - 1];
      if (last) {
        let ref = null; for (let i = H.length - 1; i >= 0; i--) if (H[i].t <= last.t - 45) { ref = H[i]; break; }
        if (ref && ref !== last && Math.hypot(last.x - ref.x, last.y - ref.y) < 14) { Object.assign(s, {dx: ref.dx, dy: ref.dy, p: ref.p, u: ref.u, over: ref.over}); o.change && o.change(s); }
      }
      o.release(s);
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    s.abort = () => { if (!s.on) return; s.on = false; if (s.eng) { o.cancel && o.cancel(s); K.impact('cancel'); } };
    return s;
  };
  /* finger side of the drag: cancel ring around the press point + rubber line to the finger */
  K.drawAnchor = function (g, s, col = '#fff6dd') {
    if (!s.on || !s.eng) return;
    g.save(); g.lineCap = 'round';
    g.globalAlpha = s.cancel ? .9 : .45; g.strokeStyle = s.cancel ? '#d0533f' : col; g.lineWidth = 2; g.setLineDash([4, 5]);
    D.circle(g, s.x0, s.y0, s.cr); g.stroke(); g.setLineDash([]);
    g.globalAlpha = .35; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x0, s.y0); g.lineTo(s.x, s.y); g.stroke();
    g.globalAlpha = .8; g.fillStyle = s.cancel ? '#d0533f' : col; D.circle(g, s.x, s.y, 5); g.fill();
    g.restore();
    if (s.cancel) D.text(g, '松手取消', s.x0, s.y0 - s.cr - 12, {size: 13, color: '#fff3d6', weight: 700, stroke: 'rgba(120,20,10,.85)', strokeW: 4});
  };
  /* rubber band + knob from projectile (ox,oy) in pull direction. s = {dx,dy (screen, opposite pull), p, u?, over?, cancel?} */
  K.drawPull = function (g, ox, oy, s, len, col = '#e6c57d') {
    const u = s.u != null ? s.u : s.p, p = s.p, strain = (s.over || 0) > 0 || p > .985;
    const jit = strain ? 1.6 : 0, px = ox - s.dx * len * u + (Math.random() - .5) * jit, py = oy - s.dy * len * u + (Math.random() - .5) * jit;
    const nx = -s.dy * 9, ny = s.dx * 9;   // fork prongs perpendicular to the pull
    g.save(); g.lineCap = 'round'; if (s.cancel) g.globalAlpha = .35;
    const w = 4.6 - 2.4 * u, hot = p > .8 ? '#d0533f' : col;
    g.strokeStyle = 'rgba(40,20,8,.5)'; g.lineWidth = w + 2.5;
    g.beginPath(); g.moveTo(ox + nx, oy + ny); g.lineTo(px, py); g.lineTo(ox - nx, oy - ny); g.stroke();
    g.strokeStyle = hot; g.lineWidth = w; g.stroke();
    g.fillStyle = '#3a2414'; D.circle(g, ox + nx, oy + ny, 3); g.fill(); D.circle(g, ox - nx, oy - ny, 3); g.fill();
    D.disc(g, px, py, 8 + 2 * u, p > .985 ? '#b23a2b' : '#8a2a20', {ring: '#f3e2c0'});
    g.restore();
    if (s.cancel) D.text(g, '✕', px, py, {size: 14, color: '#fff3d6', weight: 800});
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
  K.wind = function (g, x, y, w, size = 1, label = '风', val = null) {
    g.save(); g.translate(x, y); g.scale(size, size);
    const vh = val != null && val !== '' ? 8 : 0;
    g.fillStyle = 'rgba(30,18,8,.72)'; D.rr(g, -58, -20, 116, 40 + vh, 12); g.fill();
    D.text(g, label, -40, 1 + vh / 2, {size: 15, color: '#e6c57d', font: 'deco', weight: 400});
    const L = Math.max(Math.abs(w) * 48, w ? 8 : 0), dir = w >= 0 ? 1 : -1;
    g.strokeStyle = '#f3e2c0'; g.lineWidth = 3; g.lineCap = 'round';
    if (!w) { D.text(g, '无风', 12, 1 + vh / 2, {size: 13, color: '#f3e2c0'}); g.restore(); return; }
    if (vh) { D.text(g, String(val), 12, 15, {size: 11, color: '#ffe9b8', weight: 700}); g.translate(0, -4); }
    const x0 = 12 - dir * L / 2, x1 = 12 + dir * L / 2;
    g.beginPath(); g.moveTo(x0, 0); g.lineTo(x1, 0); g.moveTo(x1, 0); g.lineTo(x1 - dir * 8, -6); g.moveTo(x1, 0); g.lineTo(x1 - dir * 8, 6); g.stroke();
    g.restore();
  };
  return K;
})();
