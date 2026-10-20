/* 桌上冰球 — reference implementation of a REALTIME game (read this before writing a new realtime game). */
const D = BX.draw, C = BX.C;
const W = 600, H = 340, GOAL = 120, PR = 16, MR = 26, WIN = 7;     // table units

BX.register({
  id: 'airhockey', title: '桌上冰球', cat: 'arcade', order: 2, sub: '推杆击球，先进 7 球',
  desc: '按住拖动自己的推杆把冰球打进对方球门。手机、iPad 上两人可以各占半边屏幕同时对战。',
  kind: 'realtime', seats: 2, seatColors: ['#c23a2b', '#2f5d8a'], noFirst: true,
  rules: `<p>拖动（或用鼠标移动）自己的推杆击打冰球，把球打进对方球门得 1 分，<b>先得 7 分</b>获胜。</p>
<p>推杆只能在自己的半场移动。失球的一方获得发球权。</p>
<p>键盘：单人用 WASD 或方向键；同屏双人时左方 WASD、右方方向键；触屏同屏时两人各按住自己那半边屏幕。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2f6f8a'); gr.addColorStop(1, '#183f52'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(230,197,125,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); D.circle(g, w / 2, h / 2, h * .22); g.stroke();
    D.disc(g, w * .25, h * .55, h * .14, '#c23a2b', {ring: '#ffd0c0'}); D.disc(g, w * .78, h * .4, h * .14, '#2f5d8a', {ring: '#cfe0ff'});
    D.disc(g, w * .5, h * .5, h * .08, '#1b1510');
  },
  create(ctx) {
    /* host-authoritative state; guests receive it via snapshot()/restore() */
    const st = {
      p: {x: W / 2, y: H / 2, vx: 0, vy: 0},
      m: [{x: 70, y: H / 2, vx: 0, vy: 0}, {x: W - 70, y: H / 2, vx: 0, vy: 0}],
      s: [0, 0], ph: 'serve', t: 1.2, server: ctx.rng() < .5 ? 0 : 1, ev: [], evId: 0, over: false,
    };
    const cv = ctx.canvas();
    let seenEv = 0;
    st.p.x = st.server === 0 ? W / 2 - 80 : W / 2 + 80;
    // ---------- view transform: each viewer sees their own goal on the left (landscape) or bottom (portrait) ----------
    const viewSeat = () => ctx.mySeats.length === 1 ? ctx.mySeats[0] : 0;
    function view() {
      const portrait = cv.h > cv.w * 1.05;
      const lw = portrait ? H : W, lh = portrait ? W : H;
      const f = BX.fit(cv.w, cv.h, lw + 40, lh + 40, 4);
      return {portrait, s: f.s, ox: f.x + 20 * f.s, oy: f.y + 20 * f.s, flip: viewSeat() === 1};
    }
    // table → screen
    function T(x, y, v = view()) {
      if (v.flip) { x = W - x; y = H - y; }
      return v.portrait ? [v.ox + (H - y) * v.s, v.oy + (W - x) * v.s] : [v.ox + x * v.s, v.oy + y * v.s];
    }
    // screen → table
    function inv(px, py, v = view()) {
      let x, y;
      if (v.portrait) { y = H - (px - v.ox) / v.s; x = W - (py - v.oy) / v.s; } else { x = (px - v.ox) / v.s; y = (py - v.oy) / v.s; }
      if (v.flip) { x = W - x; y = H - y; }
      return {x, y};
    }
    // ---------- local input ----------
    const ptrs = new Map();   // pointerId -> table pos
    let mouse = null;
    const track = e => { const p = cv.pos(e); const t = inv(p.x, p.y); if (e.pointerType === 'mouse') mouse = t; else if (ptrs.has(e.pointerId) || e.type === 'pointerdown') ptrs.set(e.pointerId, t); };
    ctx.on(cv.cv, 'pointerdown', e => { track(e); try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {} });
    ctx.on(cv.cv, 'pointermove', track);
    const up = e => ptrs.delete(e.pointerId);
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    ctx.on(cv.cv, 'pointerleave', e => { if (e.pointerType === 'mouse') mouse = null; });
    const K = (a, b, c, d) => { const k = ctx.keys; return {kx: (k.has(d) ? 1 : 0) - (k.has(c) ? 1 : 0), ky: (k.has(b) ? 1 : 0) - (k.has(a) ? 1 : 0)}; };
    function keyInput(slot, nLocal) {
      const wasd = K('KeyW', 'KeyS', 'KeyA', 'KeyD'), arr = K('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
      let k = nLocal === 1 ? {kx: wasd.kx || arr.kx, ky: wasd.ky || arr.ky} : slot === 0 ? wasd : arr;
      if (!k.kx && !k.ky) return null;
      // keys are in SCREEN directions; convert to table directions for this viewer
      const v = view(); let tx = k.kx, ty = k.ky;
      if (v.portrait) { const a = -k.ky, b = k.kx; tx = a; ty = -b; }   // screen up = table +x (toward opponent)
      if (v.flip) { tx = -tx; ty = -ty; }
      return {kx: tx, ky: ty};
    }
    // ---------- physics (host only) ----------
    const half = seat => seat === 0 ? [MR, W / 2 - MR] : [W / 2 + MR, W - MR];
    function moveMallet(i, inp, dt) {
      const m = st.m[i], [x0, x1] = half(i), maxV = 1500;
      let tx = m.x, ty = m.y;
      if (inp && inp.x != null) { tx = inp.x; ty = inp.y; }
      else if (inp && (inp.kx || inp.ky)) { const l = Math.hypot(inp.kx, inp.ky); tx = m.x + inp.kx / l * 700 * dt; ty = m.y + inp.ky / l * 700 * dt; }
      tx = BX.clamp(tx, x0, x1); ty = BX.clamp(ty, MR, H - MR);
      let dx = tx - m.x, dy = ty - m.y; const d = Math.hypot(dx, dy), lim = maxV * dt;
      if (d > lim) { dx *= lim / d; dy *= lim / d; }
      m.vx = dx / dt; m.vy = dy / dt; m.x += dx; m.y += dy;
    }
    const fx = k => { st.ev.push({k, id: ++st.evId}); if (st.ev.length > 8) st.ev.shift(); };
    function serve(to) { st.p = {x: to === 0 ? W / 2 - 80 : W / 2 + 80, y: H / 2, vx: 0, vy: 0}; st.ph = 'serve'; st.t = 1; }
    function physics(dt) {
      const p = st.p;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.pow(.6, dt); p.vy *= Math.pow(.6, dt);
      if (p.y < PR) { p.y = PR; p.vy = Math.abs(p.vy) * .9; fx('wall'); }
      if (p.y > H - PR) { p.y = H - PR; p.vy = -Math.abs(p.vy) * .9; fx('wall'); }
      const inGoal = Math.abs(p.y - H / 2) < GOAL / 2;
      if (p.x < PR && !inGoal) { p.x = PR; p.vx = Math.abs(p.vx) * .9; fx('wall'); }
      if (p.x > W - PR && !inGoal) { p.x = W - PR; p.vx = -Math.abs(p.vx) * .9; fx('wall'); }
      for (const m of st.m) {
        const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), md = PR + MR;
        if (d < md && d > 0) {
          const nx = dx / d, ny = dy / d; p.x = m.x + nx * md; p.y = m.y + ny * md;
          const rvx = p.vx - m.vx, rvy = p.vy - m.vy, vn = rvx * nx + rvy * ny;
          if (vn < 0) { p.vx -= 1.9 * vn * nx; p.vy -= 1.9 * vn * ny; fx('hit'); }
          const sp = Math.hypot(p.vx, p.vy); if (sp > 1300) { p.vx *= 1300 / sp; p.vy *= 1300 / sp; }
        }
      }
      if (p.x < -PR || p.x > W + PR) {
        const scorer = p.x < 0 ? 1 : 0; st.s[scorer]++; fx('goal');
        if (st.s[scorer] >= WIN) { st.over = true; st.ph = 'over'; ctx.end({winner: scorer, text: st.s[0] + ' : ' + st.s[1]}); }
        else serve(1 - scorer);
      }
    }
    // ---------- AI ----------
    function aiInput(seat, level) {
      const m = st.m[seat], p = st.p, dir = seat === 0 ? 1 : -1, goalX = seat === 0 ? 0 : W;
      const mine = seat === 0 ? p.x < W / 2 : p.x > W / 2;
      const coming = (p.vx * dir) < 40;
      const react = [0, .35, .65, 1][level];
      if (mine && (coming || Math.abs(p.vx) < 120)) {
        // strike: aim behind the puck toward the opponent goal
        const tx = W - goalX, ty = H / 2 + (level === 3 ? (p.y < H / 2 ? 50 : -50) : 0);
        const ax = p.x - tx, ay = p.y - ty, l = Math.hypot(ax, ay) || 1;
        const behind = {x: p.x + ax / l * (PR + MR - 6), y: p.y + ay / l * (PR + MR - 6)};
        const close = Math.hypot(m.x - behind.x, m.y - behind.y) < 18;
        const tgt = close ? {x: p.x - ax / l * 30, y: p.y - ay / l * 30} : behind;
        return {x: BX.lerp(m.x, tgt.x, react), y: BX.lerp(m.y, tgt.y, react)};
      }
      // defend: stand between puck and own goal
      const dx = seat === 0 ? 60 : W - 60;
      return {x: BX.lerp(m.x, dx, .3 * react + .1), y: BX.lerp(m.y, BX.clamp(p.y, H / 2 - GOAL, H / 2 + GOAL), .25 * react + .08)};
    }
    function playEv() {
      for (const e of st.ev) if (e.id > seenEv) { seenEv = e.id; ctx.sfx(e.k === 'hit' ? 'hit' : e.k === 'wall' ? 'bounce' : 'score'); if (e.k === 'goal') flash = 1; }
    }
    let flash = 0;
    const info = () => { ctx.info(0, st.s[0]); ctx.info(1, st.s[1]); };
    info(); ctx.status('先得 ' + WIN + ' 分获胜');
    return {
      st,
      /* input(seat, slot, nLocal): read THIS device's controls for a local seat → plain object sent to host */
      input(seat, slot, nLocal) {
        const k = keyInput(slot, nLocal); if (k) return k;
        if (nLocal === 1) { const t = ptrs.size ? [...ptrs.values()].pop() : mouse; return t ? {x: Math.round(t.x), y: Math.round(t.y)} : {}; }
        for (const t of ptrs.values()) if (seat === 0 ? t.x < W / 2 : t.x >= W / 2) return {x: Math.round(t.x), y: Math.round(t.y)};
        return {};
      },
      aiInput,
      /* step(dt, inputs): host only, fixed 1/60 s */
      step(dt, inputs) {
        if (st.over) return;
        moveMallet(0, inputs[0], dt); moveMallet(1, inputs[1], dt);
        if (st.ph === 'serve') { st.t -= dt; if (st.t <= 0) st.ph = 'play'; }
        else { physics(dt); if (Math.abs(st.p.x - W / 2) < 2 && Math.hypot(st.p.vx, st.p.vy) < 5) st.p.vx += (st.p.vx >= 0 ? 30 : -30); }
        playEv(); info();
      },
      snapshot() { const r = v => Math.round(v); return {p: [r(st.p.x), r(st.p.y), r(st.p.vx), r(st.p.vy)], m: st.m.map(m => [r(m.x), r(m.y)]), s: st.s, ph: st.ph, ev: st.ev}; },
      restore(d) {
        Object.assign(st.p, {x: d.p[0], y: d.p[1], vx: d.p[2], vy: d.p[3]});
        d.m.forEach((m, i) => { st.m[i].x = m[0]; st.m[i].y = m[1]; });
        st.s = d.s; st.ph = d.ph; st.ev = d.ev; playEv(); info();
      },
      draw(dt) {
        const g = cv.g; cv.clear(); const v = view();
        if (!ctx.isHost) { st.p.x += st.p.vx * dt * .5; st.p.y += st.p.vy * dt * .5; }  // light extrapolation on guests
        const [ax, ay] = T(0, 0, v), [bx, by] = T(W, H, v);
        const x0 = Math.min(ax, bx), y0 = Math.min(ay, by), tw = Math.abs(bx - ax), th = Math.abs(by - ay), s = v.s;
        // rim
        D.wood(g, x0 - 16 * s, y0 - 16 * s, tw + 32 * s, th + 32 * s, {r: 30 * s, base: '#7a3a22', dark: '#3a160a', vertical: v.portrait});
        const gr = g.createLinearGradient(x0, y0, x0 + tw, y0 + th); gr.addColorStop(0, '#3a8aa8'); gr.addColorStop(1, '#1f5d78');
        g.fillStyle = gr; D.rr(g, x0, y0, tw, th, 22 * s); g.fill();
        g.save(); D.rr(g, x0, y0, tw, th, 22 * s); g.clip();
        g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 40; i++) { const [px, py] = T((i * 97) % W, (i * 53) % H, v); D.circle(g, px, py, 1.5 * s); g.fill(); }
        g.strokeStyle = 'rgba(230,197,125,.75)'; g.lineWidth = 3 * s;
        const [c1x, c1y] = T(W / 2, 0, v), [c2x, c2y] = T(W / 2, H, v); g.beginPath(); g.moveTo(c1x, c1y); g.lineTo(c2x, c2y); g.stroke();
        const [cx, cy] = T(W / 2, H / 2, v); D.circle(g, cx, cy, 60 * s); g.stroke();
        for (const side of [0, 1]) { const [gx, gy] = T(side ? W : 0, H / 2, v); g.strokeStyle = D.alpha(ctx.color(side), .7); D.circle(g, gx, gy, 90 * s); g.stroke(); }
        g.restore();
        // goals
        for (const side of [0, 1]) {
          const [g1x, g1y] = T(side ? W : 0, H / 2 - GOAL / 2, v), [g2x, g2y] = T(side ? W : 0, H / 2 + GOAL / 2, v);
          g.strokeStyle = '#111'; g.lineWidth = 10 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(g1x, g1y); g.lineTo(g2x, g2y); g.stroke();
          g.strokeStyle = ctx.color(side); g.lineWidth = 4 * s; g.stroke();
        }
        // puck & mallets
        const [px, py] = T(st.p.x, st.p.y, v); D.disc(g, px, py, PR * s, '#1b1510', {ring: '#e6c57d'});
        st.m.forEach((m, i) => { const [mx, my] = T(m.x, m.y, v); D.disc(g, mx, my, MR * s, ctx.color(i), {ring: 'rgba(255,255,255,.55)'}); D.disc(g, mx, my, MR * .45 * s, D.shade(ctx.color(i), -20), {shadow: false}); });
        // score + serve text
        D.text(g, st.s[0] + '  :  ' + st.s[1], cx, y0 - (v.portrait ? 0 : 0) + 30 * s, {size: 30 * s, color: 'rgba(255,255,255,.35)', font: 'deco', weight: 400});
        if (st.ph === 'serve' && !st.over) D.text(g, '准备', cx, cy, {size: 26 * s, color: '#fff', font: 'deco', weight: 400, shadow: true});
        if (flash > 0) { flash = Math.max(0, flash - dt * 2); g.fillStyle = `rgba(255,230,160,${flash * .25})`; g.fillRect(0, 0, cv.w, cv.h); }
      },
    };
  },
});
