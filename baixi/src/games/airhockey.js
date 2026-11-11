/* 桌上冰球 — reference implementation of a REALTIME game (read this before writing a new realtime game). */
const D = BX.draw, C = BX.C;
const W = 600, H = 340, GOAL = 120, PR = 16, MR = 26, WIN = 7;     // table units

BX.register({
  id: 'airhockey', title: '桌上冰球', cat: 'arcade', order: 2, sub: '推杆击球，先进 7 球',
  desc: '按住拖动自己的推杆把冰球打进对方球门。手机、iPad 上两人可以各占半边屏幕同时对战。',
  kind: 'realtime', seats: 2, seatColors: ['#c23a2b', '#2f5d8a'], noFirst: true, hint: false, snapHz: 30, inputHz: 60,
  options: [{key: 'win', label: '赛制', choices: [[5, '先得 5 分'], [7, '先得 7 分'], [11, '先得 11 分']], def: 7}],
  howto: ['手指按住屏幕任意处（或移动鼠标），推杆会跟到手指位置；挥得越快击球越重，迎着来球轻挡可以卸力。', '推杆只能在自己半场活动；冰球打进对方球门得 1 分。', '键盘：WASD / 方向键移动推杆；同屏双人左方 WASD、右方方向键，触屏各按住自己那半边。'],
  rules: `<p>拖动（或用鼠标移动）自己的推杆击打冰球，把球打进对方球门得 1 分，<b>先得 7 分</b>获胜（开局前可改为 5 分或 11 分）。</p>
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
      s: [0, 0], ph: 'serve', t: 1.2, server: ctx.rng() < .5 ? 0 : 1, ev: [], evId: 0, over: false, hs: 0,
    };
    /* feel constants (table units, seconds). Real air hockey: near-frictionless puck, lively but not perfectly elastic rails,
       hand-held mallet ≈ infinite mass so hit speed comes from how fast the mallet is swung. */
    const MV = 4200, PMAX = 1700, SOFT = 900, WALL_E = .86, WALL_T = .985, MAL_E = .86, DRAG = .88, DECEL = 10;
    const cv = ctx.canvas();
    const WINS = +ctx.opts.win || WIN;
    let seenEv = 0, trail = [], goalTxt = null, flash = 0, shake = 0, sparks = [], rings = [];
    st.p.x = st.server === 0 ? W / 2 - 80 : W / 2 + 80;
    const prev = {p: {x: st.p.x, y: st.p.y}, m: st.m.map(m => ({x: m.x, y: m.y}))};   // previous fixed step (render interpolation)
    const ack = [0, 0], hitCd = [0, 0];
    // ---------- view transform: each viewer sees their own goal on the left (landscape) or bottom (portrait) ----------
    const viewSeat = () => ctx.mySeats.length === 1 ? ctx.mySeats[0] : 0;
    let VV = null;
    function view() {
      if (VV && VV.w === cv.w && VV.h === cv.h && VV.vs === viewSeat()) return VV;
      const portrait = cv.h > cv.w * 1.05;
      const lw = portrait ? H : W, lh = portrait ? W : H;
      const f = BX.fit(cv.w, cv.h, lw + 40, lh + 40, 4);
      return (VV = {portrait, s: f.s, ox: f.x + 20 * f.s, oy: f.y + 20 * f.s, flip: viewSeat() === 1, w: cv.w, h: cv.h, vs: viewSeat()});
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
    // ---------- local input: every coalesced pointer sample is kept so mallet speed is measured, not guessed ----------
    const ptrs = new Map();   // pointerId -> {x, y, s:[{x,y,t}]} in table units
    let mouse = null;
    function track(e) {
      const isM = e.pointerType === 'mouse';
      let P = isM ? mouse : ptrs.get(e.pointerId);
      if (!P) { if (!isM && e.type !== 'pointerdown') return; P = {x: 0, y: 0, s: [], id: e.pointerId, fresh: !isM, t0: performance.now()}; if (isM) mouse = P; else ptrs.set(e.pointerId, P); }
      const v = view();
      for (const q of ctx.points(e, cv.cv)) { const t = inv(q.x, q.y, v); P.s.push({x: t.x, y: t.y, t: q.t}); P.x = t.x; P.y = t.y; }
      if (P.s.length > 32) P.s.splice(0, P.s.length - 32);
    }
    /* finger velocity (units/s) over the last ~60 ms of samples; 0 when the finger has stopped */
    function pvel(P) {
      const s = P && P.s; if (!s || s.length < 2) return [0, 0];
      const a = s[s.length - 1]; if (performance.now() - a.t > 70) return [0, 0];
      let b = s[0]; for (let i = s.length - 2; i >= 0; i--) { b = s[i]; if (a.t - b.t >= 55) break; }
      const dt = (a.t - b.t) / 1000; if (dt < .006) return [0, 0];
      return [(a.x - b.x) / dt, (a.y - b.y) / dt];
    }
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
    const half = seat => seat === 0 ? [MR, W / 2 - MR] : [W / 2 + MR, W - MR];
    const clampM = (seat, x, y) => { const [x0, x1] = half(seat); return {x: BX.clamp(x, x0, x1), y: BX.clamp(y, MR, H - MR)}; };
    /* pointer that steers a local seat (single player: newest finger or the mouse; same-screen: the finger on that seat's half) */
    function seatPtr(seat, nLocal) {
      if (nLocal === 1) return ptrs.size ? [...ptrs.values()].pop() : mouse;
      for (const t of ptrs.values()) if (seat === 0 ? t.x < W / 2 : t.x >= W / 2) return t;
      return null;
    }
    // ---------- physics (host; guests run the same code for their local prediction) ----------
    function moveMallet(i, inp, dt) {
      const m = st.m[i], ox = m.x, oy = m.y, cap = (inp && inp.c) || MV;
      let tx = m.x, ty = m.y, hasV = false;
      if (inp && inp.x != null) {
        tx = inp.x; ty = inp.y;
        if (inp.vx != null) {
          hasV = true;
          // remote guest: lead its mallet by the one-way latency so the host hits where the guest sees its mallet
          if (inp.lat && ctx.isRemote(i)) { const ld = Math.min(.05, inp.lat / 2000) * .8; tx += inp.vx * ld; ty += inp.vy * ld; }
        }
      } else if (inp && (inp.kx || inp.ky)) { const l = Math.hypot(inp.kx, inp.ky); tx = m.x + inp.kx / l * 900 * dt; ty = m.y + inp.ky / l * 900 * dt; }
      const c = clampM(i, tx, ty); tx = c.x; ty = c.y;
      let dx = tx - m.x, dy = ty - m.y; const d = Math.hypot(dx, dy), lim = cap * dt;
      if (d > lim) { dx *= lim / d; dy *= lim / d; }
      m.x += dx; m.y += dy;
      if (hasV && d <= lim + 1) {
        // measured finger speed (coalesced samples) instead of the jittery per-step displacement; 0 on a clamped axis
        const [x0, x1] = half(i);
        m.vx = (m.x <= x0 + .5 || m.x >= x1 - .5) ? dx / dt * .5 : BX.clamp(inp.vx, -MV, MV);
        m.vy = (m.y <= MR + .5 || m.y >= H - MR - .5) ? dy / dt * .5 : BX.clamp(inp.vy, -MV, MV);
      } else { m.vx = BX.lerp(m.vx, dx / dt, .6); m.vy = BX.lerp(m.vy, dy / dt, .6); }
      return {x0: ox, y0: oy, x1: m.x, y1: m.y, vx: m.vx, vy: m.vy};
    }
    /* advance puck p by dt against mallet paths ms (swept in sub-steps so fast swings never tunnel through the puck).
       cb(kind, strength, x, y, malletIndex) reports impacts. Returns 0, or ±1 when the puck left through a goal. */
    function sim(p, ms, dt, cb, frozen) {
      let maxD = Math.hypot(p.vx, p.vy) * dt;
      for (const m of ms) if (m) maxD = Math.max(maxD, Math.hypot(m.x1 - m.x0, m.y1 - m.y0));
      const n = BX.clamp(Math.ceil(maxD / 7), 1, 12), h = dt / n;
      for (let k = 1; k <= n; k++) {
        if (!frozen) { p.x += p.vx * h; p.y += p.vy * h; }
        if (p.y < PR) { p.y = PR; const s = Math.abs(p.vy); p.vy = s * WALL_E; p.vx *= WALL_T; cb('wall', s, p.x, PR); }
        if (p.y > H - PR) { p.y = H - PR; const s = Math.abs(p.vy); p.vy = -s * WALL_E; p.vx *= WALL_T; cb('wall', s, p.x, H - PR); }
        const inGoal = Math.abs(p.y - H / 2) < GOAL / 2;
        if (p.x < PR && !inGoal) { p.x = PR; const s = Math.abs(p.vx); p.vx = s * WALL_E; p.vy *= WALL_T; cb('wall', s, PR, p.y); }
        if (p.x > W - PR && !inGoal) { p.x = W - PR; const s = Math.abs(p.vx); p.vx = -s * WALL_E; p.vy *= WALL_T; cb('wall', s, W - PR, p.y); }
        ms.forEach((m, i) => {
          if (!m) return;
          const mx = m.x0 + (m.x1 - m.x0) * k / n, my = m.y0 + (m.y1 - m.y0) * k / n;
          const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy), md = PR + MR;
          if (d >= md) return;
          const nx = d > 0 ? dx / d : (i === 0 ? 1 : -1), ny = d > 0 ? dy / d : 0;
          p.x = mx + nx * md; p.y = my + ny * md;
          const vn = (p.vx - m.vx) * nx + (p.vy - m.vy) * ny;
          if (vn < 0) {
            p.vx -= (1 + MAL_E) * vn * nx; p.vy -= (1 + MAL_E) * vn * ny;
            // soft saturation: a medium swing gives a medium shot, only a really fast flick approaches top speed
            const s2 = Math.hypot(p.vx, p.vy);
            if (s2 > SOFT) { const ns = SOFT + (PMAX - SOFT) * (1 - Math.exp(-(s2 - SOFT) / 1800)); p.vx *= ns / s2; p.vy *= ns / s2; }
            cb('hit', -vn, mx + nx * MR, my + ny * MR, i);
          }
          const sp = Math.hypot(p.vx, p.vy); if (sp > PMAX) { p.vx *= PMAX / sp; p.vy *= PMAX / sp; }
        });
        // a puck pinned against the rail by a mallet is squeezed back onto the table
        p.x = BX.clamp(p.x, -PR * 3, W + PR * 3); p.y = BX.clamp(p.y, PR, H - PR);
      }
      // air-cushion glide: gentle exponential drag + a little constant friction so a slow puck really stops
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 0) { const ns = Math.max(0, sp * Math.pow(DRAG, dt) - DECEL * dt); p.vx *= ns / sp; p.vy *= ns / sp; }
      return p.x < -PR ? -1 : p.x > W + PR ? 1 : 0;
    }
    const fx = (k, o = {}) => { st.ev.push(Object.assign({k, id: ++st.evId}, o)); if (st.ev.length > 10) st.ev.shift(); };
    function serve(to) { st.p = {x: to === 0 ? W / 2 - 80 : W / 2 + 80, y: H / 2, vx: 0, vy: 0}; prev.p = {x: st.p.x, y: st.p.y}; st.ph = 'serve'; st.t = 1; }
    function hostImpact(kind, s, x, y, mi) {
      if (kind === 'hit') {
        if (hitCd[mi] > 0 && s < 250) return; hitCd[mi] = .08;
        fx('hit', {v: Math.round(s), x: Math.round(x), y: Math.round(y), m: mi});
        if (s > 1300 && !st.hs) st.hs = 3;   // hit-stop on smashes (3 frames, puck only)
      } else if (s > 60) fx('wall', {v: Math.round(s), x: Math.round(x), y: Math.round(y)});
    }
    function physics(dt, paths) {
      const frozen = st.hs > 0; if (frozen) st.hs--;
      const out = sim(st.p, paths, dt, hostImpact, frozen);
      if (out) {
        const scorer = out < 0 ? 1 : 0; st.s[scorer]++; fx('goal' + scorer, {y: Math.round(st.p.y)});
        if (st.s[scorer] >= WINS) { st.over = true; st.ph = 'over'; ctx.end({winner: scorer, text: st.s[0] + ' : ' + st.s[1]}); }
        else serve(1 - scorer);
      }
    }
    // ---------- AI ----------
    /* the AI reacts to where the puck WAS a moment ago (human-like reaction time per level), so hard angled shots can beat it */
    const seen = [], aim = [{on: false, y: 0}, {on: false, y: 0}];
    function aiInput(seat, level) {
      const lag = [0, 13, 8, 4][level] || 0, p = seen[Math.max(0, seen.length - 1 - lag)] || st.p;
      const m = st.m[seat], dir = seat === 0 ? 1 : -1, goalX = seat === 0 ? 0 : W;
      const mine = seat === 0 ? p.x < W / 2 : p.x > W / 2;
      const coming = (p.vx * dir) < 40;
      const react = [0, .35, .65, 1][level], c = [0, 1100, 1700, 2300][level];
      // pick an aim point each time the puck comes over: L3 shoots for the side the opponent leaves open, others vary at random
      const am = aim[seat];
      if (mine && !am.on) { am.on = true; const o = st.m[1 - seat]; am.y = level >= 3 ? (o.y > H / 2 ? -1 : 1) * 50 : (Math.random() < .5 ? -1 : 1) * (15 + Math.random() * 40); }
      if (!mine) am.on = false;
      if (mine && (coming || Math.abs(p.vx) < 120)) {
        // strike: aim behind the puck toward the opponent goal
        const tx = W - goalX, ty = H / 2 + am.y;
        const ax = p.x - tx, ay = p.y - ty, l = Math.hypot(ax, ay) || 1;
        const behind = {x: p.x + ax / l * (PR + MR - 6), y: p.y + ay / l * (PR + MR - 6)};
        const close = Math.hypot(m.x - behind.x, m.y - behind.y) < 18;
        // never cut through the puck from the wrong side (that is how own goals happen): go round it via a side point
        const along = ((m.x - p.x) * -ax + (m.y - p.y) * -ay) / l, side = ((m.x - p.x) * -ay + (m.y - p.y) * ax) >= 0 ? 1 : -1;
        let tgt = close && st.ph === 'play' ? {x: p.x - ax / l * 30, y: p.y - ay / l * 30} : behind;
        if (along > -(PR + MR) * .5) tgt = {x: behind.x - ay / l * (PR + MR + 10) * side, y: behind.y + ax / l * (PR + MR + 10) * side};
        return {x: BX.lerp(m.x, tgt.x, react), y: BX.lerp(m.y, tgt.y, react), c};
      }
      // defend: stand between puck and own goal
      const dx = seat === 0 ? 60 : W - 60;
      return {x: BX.lerp(m.x, dx, .3 * react + .1), y: BX.lerp(m.y, BX.clamp(p.y, H / 2 - GOAL, H / 2 + GOAL), .25 * react + .08), c};
    }
    // ---------- juice ----------
    const mineSeat = i => ctx.mySeats.includes(i) && !ctx.isAI(i);
    function impactFx(kind, s, x, y, mi) {
      if (ctx.fast) return;
      const k = BX.clamp(s / 1700, 0, 1);
      if (kind === 'hit') {
        BX.sfx.noise(.05 + k * .05, .18 + k * .5, 'lowpass', 900 + k * 2200, 300, 1);
        BX.sfx.tone('sine', 110 + k * 120, 70, .08 + k * .05, .12 + k * .3);
        const n = Math.round(3 + k * 14);
        for (let j = 0; j < n; j++) { const a = Math.random() * 6.283, v = (60 + Math.random() * 260) * (.4 + k); sparks.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: .25 + Math.random() * .2}); }
        if (k > .35) rings.push({x, y, t: 0, k});
        if (k > .75) shake = Math.min(4, shake + 2.5 * k);
        if (mi != null && mineSeat(mi) && k > .15) ctx.buzz(Math.round(6 + k * 18));
      } else {
        BX.sfx.tone('sine', 380 + k * 260, 220, .05 + k * .04, .05 + k * .2);
        if (k > .4) for (let j = 0; j < 4; j++) { const a = Math.random() * 6.283; sparks.push({x, y, vx: Math.cos(a) * 120 * k, vy: Math.sin(a) * 120 * k, t: .2}); }
      }
    }
    let localHitT = -1e9;
    function playEv() {
      for (const e of st.ev) if (e.id > seenEv) {
        seenEv = e.id;
        if (e.k === 'hit') { if (performance.now() - localHitT > Math.max(300, G.rtt + 150) || e.m !== viewSeat()) impactFx('hit', e.v || 600, e.x != null ? e.x : st.p.x, e.y != null ? e.y : st.p.y, e.m); }
        else if (e.k === 'wall') { if (ctx.isHost || performance.now() - localHitT > 300) impactFx('wall', e.v || 300, e.x, e.y); }
        else if (e.k.startsWith('goal')) {
          ctx.sfx('score');
          const sc = +e.k.slice(4); flash = 1; trail = []; shake = Math.min(5, shake + 4);
          const solo = ctx.mySeats.length === 1, me = ctx.mySeats[0];
          goalTxt = {t: 1.4, txt: solo && ctx.mode !== 'local' ? (sc === me ? '进球！' : '失球…') : ctx.name(sc) + ' 得分', good: !solo || sc === me};
          if (solo && sc !== me) ctx.buzz(30); else if (solo) ctx.buzz(15);
          if (!ctx.isHost) G.lp = null;
        }
      }
    }
    const info = () => { ctx.info(0, st.s[0]); ctx.info(1, st.s[1]); };
    info(); ctx.status('先得 ' + WINS + ' 分获胜 · 按住拖动推杆');
    // ---------- online guest: local prediction ----------
    // own mallet is drawn at the finger; the puck is simulated locally against it (instant hits) and eased toward the host's truth.
    const G = {lp: null, off: {x: 0, y: 0}, rtt: 110, om: {x: 0, y: 0, vx: 0, vy: 0, t: 0, dx: null, dy: null}, own: null, ownPrev: null, kb: null, lastIn: 0};
    function advance(p, t) { const q = {x: p.x, y: p.y, vx: p.vx, vy: p.vy}; let left = t; while (left > 1e-4) { const h = Math.min(1 / 120, left); sim(q, [], h, () => {}); left -= h; } return q; }
    function guestOwn() {
      const me = viewSeat();
      const P = ptrs.size ? [...ptrs.values()].pop() : mouse;
      if (P) { const c = clampM(me, P.x, P.y), v = pvel(P); return {x: c.x, y: c.y, vx: v[0], vy: v[1]}; }
      if (G.kb) return {x: G.kb.x, y: G.kb.y, vx: G.kb.vx, vy: G.kb.vy};
      return null;
    }
    function guestKeys(dt) {
      const k = keyInput(0, 1), me = viewSeat();
      if (!k) { if (G.kb) { G.kb.vx = 0; G.kb.vy = 0; } return; }
      if (!G.kb) G.kb = {x: st.m[me].x, y: st.m[me].y, vx: 0, vy: 0};
      const l = Math.hypot(k.kx, k.ky), vx = k.kx / l * 900, vy = k.ky / l * 900;
      const c = clampM(me, G.kb.x + vx * dt, G.kb.y + vy * dt); G.kb.vx = (c.x - G.kb.x) / Math.max(dt, 1e-3); G.kb.vy = (c.y - G.kb.y) / Math.max(dt, 1e-3); G.kb.x = c.x; G.kb.y = c.y;
    }
    function guestFrame(dt) {
      const me = viewSeat(), op = 1 - me;
      guestKeys(dt);
      const own = guestOwn();
      if (own) G.own = own; else if (G.own) { G.own.vx = 0; G.own.vy = 0; }
      if (!G.own) G.own = {x: st.m[me].x, y: st.m[me].y, vx: 0, vy: 0};
      // opponent mallet: extrapolate the latest snapshot a little, then ease (no 30 Hz stepping)
      const om = G.om, age = Math.min(.08, (performance.now() - om.t) / 1000);
      const wx = om.x + om.vx * age, wy = om.y + om.vy * age;
      if (om.dx == null) { om.dx = wx; om.dy = wy; }
      const ox0 = om.dx, oy0 = om.dy, kk = 1 - Math.exp(-dt / .035); om.dx += (wx - om.dx) * kk; om.dy += (wy - om.dy) * kk;
      const oc = clampM(op, om.dx, om.dy); om.dx = oc.x; om.dy = oc.y;
      if (!G.lp) return;
      if (st.ph !== 'play') { G.lp.vx = G.lp.vy = 0; G.ownPrev = {x: G.own.x, y: G.own.y}; return; }
      let pp = G.ownPrev || G.own;
      if (Math.hypot(G.own.x - pp.x, G.own.y - pp.y) > MV * Math.max(dt, 1 / 60) * 1.3) pp = G.own;   // finger re-placed: no sweep
      const ms = [];
      ms[me] = {x0: pp.x, y0: pp.y, x1: G.own.x, y1: G.own.y, vx: G.own.vx, vy: G.own.vy};
      ms[op] = {x0: ox0, y0: oy0, x1: om.dx, y1: om.dy, vx: om.vx, vy: om.vy};
      sim(G.lp, ms, Math.min(dt, 1 / 30), (kind, s, x, y, mi) => {
        if (kind === 'hit' && mi === me) { if (performance.now() - localHitT > 90) impactFx('hit', s, x, y, mi); localHitT = performance.now(); }
        else if (kind === 'wall' && s > 60 && performance.now() - localHitT < 400) impactFx('wall', s, x, y);
      });
      G.lp.x = BX.clamp(G.lp.x, -PR, W + PR);
      G.ownPrev = {x: G.own.x, y: G.own.y};
      const dk = Math.exp(-dt / .07); G.off.x *= dk; G.off.y *= dk;
    }
    function guestSnap(d) {
      const me = viewSeat(), op = 1 - me, now = performance.now();
      if (d.ak && d.ak[me]) { const r = now - d.ak[me] - 1000 / 60; if (r > 0 && r < 1500) G.rtt = G.rtt * .85 + r * .15; }
      const om = G.om, mo = d.m[op]; om.x = mo[0]; om.y = mo[1]; om.vx = mo[2] || 0; om.vy = mo[3] || 0; om.t = now;
      const auth = {x: d.p[0], y: d.p[1], vx: d.p[2], vy: d.p[3]};
      if (d.ph !== 'play') { G.lp = auth; G.off.x = G.off.y = 0; return; }
      const adv = advance(auth, BX.clamp(G.rtt / 2000, 0, .15));
      if (!G.lp) { G.lp = adv; G.off.x = G.off.y = 0; return; }
      const lp = G.lp, err = Math.hypot(adv.x - lp.x, adv.y - lp.y);
      if (now - localHitT < G.rtt + 90) {
        // our own hit is still in flight to the host: keep the local result unless the host already agrees
        const agree = adv.vx * lp.vx + adv.vy * lp.vy > 0 && err < 90;
        if (!agree) return;
      }
      if (err > 140) { G.off.x = G.off.y = 0; } else { G.off.x += lp.x - adv.x; G.off.y += lp.y - adv.y; }
      G.lp = adv;
    }
    // ---------- drawing helpers ----------
    function puckDraw() {
      if (!ctx.isHost && G.lp) return {x: G.lp.x + G.off.x, y: G.lp.y + G.off.y};
      const a = ctx.isHost ? ctx.alpha : 1;
      return {x: BX.lerp(prev.p.x, st.p.x, a), y: BX.lerp(prev.p.y, st.p.y, a)};
    }
    function malletDraw(i) {
      if (!ctx.isHost) {
        if (i === viewSeat() && ctx.mySeats.length === 1 && G.own) return G.own;
        if (i !== viewSeat() && G.om.dx != null) return {x: G.om.dx, y: G.om.dy};
        return st.m[i];
      }
      // local finger-steered mallet: draw exactly at the (clamped) finger → zero perceived lag
      if (ctx.isLocal(i) && !ctx.isAI(i)) {
        const nL = ctx.mySeats.length, P = seatPtr(i, nL);
        if (P) { const c = clampM(i, P.x, P.y); if (Math.hypot(c.x - st.m[i].x, c.y - st.m[i].y) < 90) return c; }
        return st.m[i];
      }
      const a = ctx.alpha;
      return {x: BX.lerp(prev.m[i].x, st.m[i].x, a), y: BX.lerp(prev.m[i].y, st.m[i].y, a)};
    }
    return {
      st,
      /* input(seat, slot, nLocal): read THIS device's controls for a local seat → plain object sent to host */
      input(seat, slot, nLocal) {
        if (!ctx.isHost) {
          // guest: send absolute mallet target (finger or locally integrated keys) + measured velocity + timing for latency lead
          const o = guestOwn() || G.own, ts = Math.round(performance.now()), P = ptrs.size ? [...ptrs.values()].pop() : null;
          if (!o) return {ts, lat: Math.round(G.rtt)};
          const m = st.m[seat]; if (P && P.fresh && (Math.hypot(m.x - o.x, m.y - o.y) < 25 || performance.now() - P.t0 > 160)) P.fresh = false;
          return {x: Math.round(o.x), y: Math.round(o.y), vx: Math.round(o.vx), vy: Math.round(o.vy), ts, lat: Math.round(G.rtt), c: P && P.fresh ? 2000 : undefined};
        }
        const k = keyInput(slot, nLocal); if (k) return k;
        const P = seatPtr(seat, nLocal);
        if (!P) return {};
        // a finger put down far from the mallet "picks it up" at a gentler speed instead of sweeping across at full swing speed
        const v = pvel(P), m = st.m[seat], c = clampM(seat, P.x, P.y);
        if (P.fresh && (Math.hypot(m.x - c.x, m.y - c.y) < 25 || performance.now() - P.t0 > 160)) P.fresh = false;
        return {x: P.x, y: P.y, vx: v[0], vy: v[1], c: P.fresh ? 2000 : undefined};
      },
      aiInput,
      get _dbg() { return {G, localHitT}; },   // diagnostics for probes
      /* step(dt, inputs): host only, fixed 1/60 s */
      step(dt, inputs) {
        if (st.over) return;
        seen.push({x: st.p.x, y: st.p.y, vx: st.p.vx, vy: st.p.vy}); if (seen.length > 20) seen.shift();
        prev.p.x = st.p.x; prev.p.y = st.p.y; st.m.forEach((m, i) => { prev.m[i].x = m.x; prev.m[i].y = m.y; });
        hitCd[0] = Math.max(0, hitCd[0] - dt); hitCd[1] = Math.max(0, hitCd[1] - dt);
        for (const i of [0, 1]) { const I = inputs[i]; if (I && I.ts) ack[i] = I.ts; }
        const paths = [moveMallet(0, inputs[0], dt), moveMallet(1, inputs[1], dt)];
        if (st.ph === 'serve') {
          st.t -= dt; if (st.t <= 0) st.ph = 'play';
          for (const m of st.m) { const dx = m.x - st.p.x, dy = m.y - st.p.y, d = Math.hypot(dx, dy), md = PR + MR; if (d < md) { const nx = d > 0 ? dx / d : (m === st.m[0] ? -1 : 1), ny = d > 0 ? dy / d : 0; m.x = st.p.x + nx * md; m.y = st.p.y + ny * md; m.vx = m.vy = 0; } }
        }
        else { physics(dt, paths); if (Math.abs(st.p.x - W / 2) < 2 && Math.hypot(st.p.vx, st.p.vy) < 5) st.p.vx += (st.p.vx >= 0 ? 30 : -30); }
        playEv(); info();
      },
      snapshot() {
        const r = v => Math.round(v);
        return {p: [r(st.p.x), r(st.p.y), r(st.p.vx), r(st.p.vy)], m: st.m.map(m => [r(m.x), r(m.y), r(m.vx), r(m.vy)]), s: st.s, ph: st.ph, ev: st.ev, ak: ack.slice()};
      },
      restore(d) {
        Object.assign(st.p, {x: d.p[0], y: d.p[1], vx: d.p[2], vy: d.p[3]});
        d.m.forEach((m, i) => { st.m[i].x = m[0]; st.m[i].y = m[1]; st.m[i].vx = m[2] || 0; st.m[i].vy = m[3] || 0; });
        st.s = d.s; st.ph = d.ph; st.ev = d.ev;
        guestSnap(d); playEv(); info();
      },
      draw(dt) {
        const g = cv.g; cv.clear(); const v = view();
        if (!ctx.isHost) guestFrame(dt);
        shake = Math.max(0, shake - dt * 22);
        g.save(); if (shake > .2) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
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
        // puck & mallets (interpolated between fixed steps; own mallet at the finger)
        const pd = puckDraw(), [px, py] = T(pd.x, pd.y, v);
        const pv = !ctx.isHost && G.lp ? G.lp : st.p, sp = Math.hypot(pv.vx, pv.vy);
        // speed trail: a tapered ribbon of recent drawn positions (frame-rate independent lifetime)
        if (st.ph === 'play' && sp > 220) trail.push({x: pd.x, y: pd.y, t: .16, k: Math.min(1, (sp - 220) / 900)});
        for (const q of trail) q.t -= dt; trail = trail.filter(q => q.t > 0).slice(-24);
        for (const q of trail) { const [qx, qy] = T(q.x, q.y, v); g.fillStyle = `rgba(255,226,150,${q.t * 3 * q.k})`; D.circle(g, qx, qy, PR * s * (.35 + q.t * 4)); g.fill(); }
        // impact rings + sparks (table units)
        for (const r of rings) r.t += dt; rings = rings.filter(r => r.t < .28);
        for (const r of rings) { const [rx, ry] = T(r.x, r.y, v); g.strokeStyle = `rgba(255,240,200,${(1 - r.t / .28) * .7})`; g.lineWidth = (1.5 + 2.5 * r.k) * s; D.circle(g, rx, ry, (PR + r.t * 170 * (.4 + r.k)) * s); g.stroke(); }
        for (const q of sparks) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .9; q.vy *= .9; }
        sparks = sparks.filter(q => q.t > 0).slice(-80);
        for (const q of sparks) { const [qx, qy] = T(q.x, q.y, v); g.fillStyle = `rgba(255,236,170,${Math.min(1, q.t * 4)})`; D.circle(g, qx, qy, 2.2 * s); g.fill(); }
        D.disc(g, px, py, PR * s, '#1b1510', {ring: '#e6c57d'});
        for (const i of [0, 1]) {
          const m = malletDraw(i), [mx, my] = T(m.x, m.y, v);
          D.disc(g, mx, my, MR * s, ctx.color(i), {ring: 'rgba(255,255,255,.55)'}); D.disc(g, mx, my, MR * .45 * s, D.shade(ctx.color(i), -20), {shadow: false});
        }
        // score + serve text
        D.text(g, st.s[0] + '  :  ' + st.s[1], cx, y0 + 30 * s, {size: 30 * s, color: 'rgba(255,255,255,.35)', font: 'deco', weight: 400});
        if (st.ph === 'serve' && !st.over && !goalTxt) D.text(g, '准备', cx, cy, {size: 26 * s, color: '#fff', font: 'deco', weight: 400, shadow: true});
        if (goalTxt) { goalTxt.t -= dt; if (goalTxt.t <= 0) goalTxt = null; else { g.globalAlpha = Math.min(1, goalTxt.t * 2); D.text(g, goalTxt.txt, cx, cy, {size: 40 * s * (1 + Math.max(0, goalTxt.t - 1.2) * 1.5), color: goalTxt.good ? '#ffe39a' : '#ffc0b0', font: 'deco', weight: 400, stroke: 'rgba(20,30,40,.7)', strokeW: 5}); g.globalAlpha = 1; } }
        g.restore();
        if (flash > 0) { flash = Math.max(0, flash - dt * 2); g.fillStyle = `rgba(255,230,160,${flash * .25})`; g.fillRect(0, 0, cv.w, cv.h); }
      },
    };
  },
});
