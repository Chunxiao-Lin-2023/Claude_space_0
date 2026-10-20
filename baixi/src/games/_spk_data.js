/* shared helpers for 点球大战 / 羽毛球 / 飞驰赛车 / 打地鼠 / 速算对战 / 反应力大比拼 (prefix spk) */
BX.data.spk = (function () {
  const D = BX.draw;
  const K = {};
  const inR = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  K.inR = inR;

  /* pointer tracker + per-frame canvas buttons {k, seat, x, y, w, h}. A short tap is latched for 140 ms so the
     60 Hz / 30 Hz input poll never misses it. */
  K.pads = function (ctx, cv) {
    const P = new Map(), lat = new Map(), downFns = [];
    let btns = [];
    const latched = (k, seat) => (lat.get(k + '|' + seat) || 0) > performance.now();
    const o = {
      ptrs: P, touched: false,
      begin() { btns = []; },
      add(b) { btns.push(b); return b; },
      list: () => btns,
      held(k, seat) {
        if (latched(k, seat)) return true;
        for (const b of btns) if (b.k === k && b.seat === seat) for (const p of P.values()) if (inR(p, b)) return true;
        return false;
      },
      pressed(b) { if (latched(b.k, b.seat)) return true; for (const p of P.values()) if (inR(p, b)) return true; return false; },
      onDown(fn) { downFns.push(fn); },
    };
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e); P.set(e.pointerId, p); if (e.pointerType !== 'mouse') o.touched = true;
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
      for (const b of btns) if (inR(p, b)) lat.set(b.k + '|' + b.seat, performance.now() + 140);
      for (const f of downFns) f(p, e);
    });
    ctx.on(cv.cv, 'pointermove', e => { if (P.has(e.pointerId)) P.set(e.pointerId, cv.pos(e)); });
    const up = e => P.delete(e.pointerId);
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    return o;
  };

  /* chunky lacquered button */
  K.btn = function (g, b, label, o = {}) {
    const pr = !!o.pressed, col = o.color || '#c8a052';
    const r = Math.min(b.w, b.h) * (o.round != null ? o.round : .26), depth = Math.max(3, Math.min(7, b.h * .08));
    g.save(); if (o.alpha != null) g.globalAlpha = o.alpha;
    g.fillStyle = 'rgba(0,0,0,.28)'; D.rr(g, b.x + 1, b.y + depth + 2, b.w, b.h - depth, r); g.fill();
    g.fillStyle = D.shade(col, -42); D.rr(g, b.x, b.y + depth, b.w, b.h - depth, r); g.fill();
    const top = b.y + (pr ? depth - 1 : 0), hh = b.h - depth;
    const gr = g.createLinearGradient(0, top, 0, top + hh); gr.addColorStop(0, D.shade(col, 28)); gr.addColorStop(1, col);
    g.fillStyle = gr; D.rr(g, b.x, top, b.w, hh, r); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.2; D.rr(g, b.x + 1.5, top + 1.5, b.w - 3, hh - 3, r * .9); g.stroke();
    if (o.sel) { g.strokeStyle = o.sel; g.lineWidth = 3; D.rr(g, b.x - 2, top - 2, b.w + 4, hh + 4, r + 2); g.stroke(); }
    const size = o.size || Math.min(hh * .46, b.w * .42);
    if (o.sub) {
      D.text(g, label, b.x + b.w / 2, top + hh * .4, {size, color: o.fg || '#3a2410', weight: 800, font: o.font});
      D.text(g, o.sub, b.x + b.w / 2, top + hh * .76, {size: Math.max(9, size * .45), color: o.fg2 || o.fg || '#3a2410', weight: 600});
    } else D.text(g, label, b.x + b.w / 2, top + hh / 2 + 1, {size, color: o.fg || '#3a2410', weight: 800, font: o.font});
    g.restore();
  };

  /* particles, floating text, shake, flash (visual only) */
  K.fx = function () {
    const ps = [], tx = []; let shake = 0, flash = 0, flashC = '255,230,160';
    return {
      burst(x, y, o = {}) {
        const n = o.n || 14, cols = Array.isArray(o.color) ? o.color : [o.color || '#ffd76a'];
        for (let i = 0; i < n; i++) {
          const a = (o.a0 != null ? o.a0 : 0) + (o.spread != null ? o.spread : Math.PI * 2) * Math.random() - (o.spread != null ? o.spread / 2 : 0);
          const sp = (o.sp || 160) * (.35 + Math.random() * .85);
          ps.push({x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), t: 0, life: (o.life || .7) * (.6 + Math.random() * .6),
            s: (o.size || 4) * (.6 + Math.random() * .8), c: cols[i % cols.length], g: o.grav != null ? o.grav : 300, sq: !!o.square, rot: Math.random() * 6});
        }
      },
      text(x, y, s, o = {}) { tx.push({x, y, s, t: 0, life: o.life || 1, size: o.size || 22, color: o.color || '#fff', vy: o.vy != null ? o.vy : -50}); },
      shake(v) { shake = Math.max(shake, v); },
      flash(v, c) { flash = Math.max(flash, v); if (c) flashC = c; },
      offset() { return shake > .3 ? [(Math.random() - .5) * shake * 2, (Math.random() - .5) * shake * 2] : [0, 0]; },
      update(dt) {
        shake = Math.max(0, shake - dt * 40); flash = Math.max(0, flash - dt * 2.2);
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.t += dt; if (p.t >= p.life) { ps.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.rot += dt * 6; }
        for (let i = tx.length - 1; i >= 0; i--) { const t = tx[i]; t.t += dt; if (t.t >= t.life) tx.splice(i, 1); else t.y += t.vy * dt; }
      },
      draw(g) {
        for (const p of ps) {
          const k = 1 - p.t / p.life; g.globalAlpha = Math.min(1, k * 1.5); g.fillStyle = p.c;
          if (p.sq) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }
          else { D.circle(g, p.x, p.y, p.s * (.4 + .6 * k)); g.fill(); }
        }
        g.globalAlpha = 1;
        for (const t of tx) {
          const k = t.t / t.life, sc = k < .15 ? .6 + k / .15 * .5 : k < .3 ? 1.1 - (k - .15) / .15 * .1 : 1;
          g.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
          D.text(g, t.s, t.x, t.y, {size: t.size * sc, color: t.color, font: 'deco', weight: 400, stroke: 'rgba(40,20,5,.8)', strokeW: Math.max(2, t.size * .14)});
        }
        g.globalAlpha = 1;
      },
      drawFlash(g, w, h) { if (flash > 0) { g.fillStyle = `rgba(${flashC},${Math.min(.55, flash * .45)})`; g.fillRect(0, 0, w, h); } },
      clear() { ps.length = 0; tx.length = 0; },
    };
  };

  /* reliable discrete inputs over the lossy input channel: each item = [...data, id] */
  K.tq = function () { let id = 0; const q = []; return {push(...d) { q.push([...d, ++id]); if (q.length > 10) q.shift(); }, list: () => q.slice()}; };
  K.take = function (list, seen, seat, fn) {
    if (!Array.isArray(list)) return;
    for (const it of list) { if (!Array.isArray(it)) continue; const id = it[it.length - 1]; if (id > (seen[seat] || 0)) { seen[seat] = id; fn(it); } }
  };
  /* one-shot events in state: [kind, id, ...args] */
  K.ev = (st, k, ...a) => { st.evId = (st.evId || 0) + 1; st.ev.push([k, st.evId, ...a]); if (st.ev.length > 14) st.ev.shift(); };
  K.evPlay = (st, seen, fn) => {
    if (seen.v < 0) { for (const e of st.ev) seen.v = Math.max(seen.v, e[1]); seen.v = Math.max(seen.v, 0); return; }
    for (const e of st.ev) if (e[1] > seen.v) { seen.v = e[1]; fn(e); }
  };
  K.keyAny = (ctx, codes) => codes.some(c => ctx.keys.has(c));

  /* popping banner text */
  K.banner = function (g, s, x, y, size, k, o = {}) {
    const sc = k < .25 ? .4 + BX.ease.back(k / .25) * .6 : 1;
    g.save(); g.translate(x, y); g.scale(sc, sc);
    D.text(g, s, 0, 0, {size, color: o.color || '#fff6dc', font: 'deco', weight: 400, stroke: o.stroke || 'rgba(60,25,5,.9)', strokeW: Math.max(3, size * .12), shadow: 'rgba(0,0,0,.4)', blur: 10});
    g.restore();
  };
  /* red paper lantern */
  K.lantern = function (g, x, y, r, col = '#d23a26', glow = .6) {
    g.save();
    if (glow > 0) { const gr = g.createRadialGradient(x, y, r * .2, x, y, r * 2.6); gr.addColorStop(0, `rgba(255,170,80,${.35 * glow})`); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; D.circle(g, x, y, r * 2.6); g.fill(); }
    g.strokeStyle = '#e6c57d'; g.lineWidth = Math.max(1, r * .08); g.beginPath(); g.moveTo(x, y - r * 1.6); g.lineTo(x, y - r * .9); g.stroke();
    const gr = g.createRadialGradient(x - r * .2, y - r * .2, r * .1, x, y, r * 1.1); gr.addColorStop(0, D.shade(col, 45)); gr.addColorStop(.6, col); gr.addColorStop(1, D.shade(col, -35));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * .85, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(90,20,5,.35)'; g.lineWidth = Math.max(.8, r * .05);
    for (const f of [-.55, 0, .55]) { g.beginPath(); g.ellipse(x, y, r * Math.abs(f) + .01, r * .85, 0, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#c8a052'; g.fillRect(x - r * .45, y - r * .98, r * .9, r * .2); g.fillRect(x - r * .45, y + r * .78, r * .9, r * .2);
    g.strokeStyle = '#e6c57d'; g.lineWidth = Math.max(1, r * .06);
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * r * .12, y + r * .98); g.lineTo(x + i * r * .12, y + r * 1.45); g.stroke(); }
    g.restore();
  };
  /* tea-house hall backdrop: wood wall, lattice windows, beam */
  K.hall = function (g, x, y, w, h, o = {}) {
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, o.top || '#5a3418'); gr.addColorStop(1, o.bot || '#7a4a24');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    const n = Math.max(2, Math.round(w / Math.max(120, h * 1.1))), ww = w / n;
    for (let i = 0; i < n; i++) {
      const wx = x + i * ww + ww * .18, wy = y + h * .18, wW = ww * .64, wH = h * .6;
      g.fillStyle = 'rgba(255,236,190,.82)'; g.fillRect(wx, wy, wW, wH);
      g.strokeStyle = 'rgba(70,35,12,.75)'; g.lineWidth = Math.max(1, wW * .025);
      const cs = Math.max(8, wW / 6);
      g.beginPath(); for (let c = cs; c < wW - 1; c += cs) { g.moveTo(wx + c, wy); g.lineTo(wx + c, wy + wH); } for (let r = cs; r < wH - 1; r += cs) { g.moveTo(wx, wy + r); g.lineTo(wx + wW, wy + r); } g.stroke();
      g.lineWidth = Math.max(2, wW * .05); g.strokeStyle = '#3a1e0a'; g.strokeRect(wx, wy, wW, wH);
    }
    g.fillStyle = '#3a1e0a'; g.fillRect(x, y, w, Math.max(4, h * .07));
    g.fillStyle = '#b23a2b'; g.fillRect(x, y + Math.max(4, h * .07), w, Math.max(2, h * .025));
  };
  /* 1-9 key → 3x3 index (numpad layout: 7 8 9 top) */
  K.NUMPAD = {Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8};
  K.QWE = {KeyQ: 0, KeyW: 1, KeyE: 2, KeyA: 3, KeyS: 4, KeyD: 5, KeyZ: 6, KeyX: 7, KeyC: 8};
  K.UIO = {KeyU: 0, KeyI: 1, KeyO: 2, KeyJ: 3, KeyK: 4, KeyL: 5, KeyM: 6, Comma: 7, Period: 8};
  K.DIGIT9 = {Digit7: 0, Digit8: 1, Digit9: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit1: 6, Digit2: 7, Digit3: 8};
  return K;
})();
