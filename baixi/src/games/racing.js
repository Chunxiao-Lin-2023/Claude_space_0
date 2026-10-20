/* 飞驰赛车 — top-down realtime racing, 2–4 cars */
const D = BX.draw, C = BX.C, K = BX.data.spk;
const WW = 1000, WH = 620, TW = 74, CR = 11;                       // world size, track width, car radius
const TRACKS = [
  {name: '茶园环线', pts: [[150, 310], [200, 150], [400, 110], [600, 150], [820, 110], [905, 250], [860, 450], [650, 520], [480, 420], [330, 520], [165, 480]], deco: '#7fbf6a'},
  {name: '九曲回廊', pts: [[120, 520], [110, 300], [200, 115], [360, 135], [405, 300], [530, 330], [565, 160], [720, 95], [885, 180], [885, 330], [755, 405], [890, 505], [700, 560], [450, 515], [290, 565]], deco: '#8cc078'},
  {name: '龙脊山道', pts: [[140, 135], [480, 95], [860, 115], [905, 300], [705, 335], [565, 250], [420, 330], [600, 435], [885, 450], [845, 565], [400, 565], [115, 525], [225, 385], [95, 285]], deco: '#a8b878'},
];
function buildTrack(def) {
  const P = def.pts, n = P.length, raw = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      raw.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  // resample uniformly every STEP units
  const STEP = 7, out = [raw[0]]; let acc = 0;
  for (let i = 1; i <= raw.length; i++) {
    const a = raw[i - 1], b = raw[i % raw.length]; let seg = Math.hypot(b[0] - a[0], b[1] - a[1]), u = 0;
    while (acc + seg - u * seg >= STEP) { const need = STEP - acc; const f = u + need / seg; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); u = f; acc = 0; }
    acc += seg * (1 - u);
  }
  if (Math.hypot(out[out.length - 1][0] - out[0][0], out[out.length - 1][1] - out[0][1]) < STEP * .6) out.pop();
  const N = out.length, dir = out.map((p, i) => { const q = out[(i + 1) % N], r = out[(i - 1 + N) % N]; const a = Math.atan2(q[1] - r[1], q[0] - r[0]); return a; });
  return {pts: out, dir, N, STEP, L: N * STEP, name: def.name};
}
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

BX.register({
  id: 'racing', title: '飞驰赛车', cat: 'sports', order: 3, sub: '漂移过弯，三圈定胜负',
  desc: '俯视角小赛车，在三条原创赛道上跑三圈。车辆会轻微漂移，出赛道会减速，车与车可以碰撞。最多四人，空位由电脑车手补上。',
  kind: 'realtime', seats: [2, 4], defSeats: 2, noFirst: true,
  options: [{key: 'trk', label: '赛道', choices: [[0, '茶园环线'], [1, '九曲回廊'], [2, '龙脊山道']], def: 0}, {key: 'laps', label: '圈数', choices: [[2, '2 圈'], [3, '3 圈'], [5, '5 圈']], def: 3}],
  rules: `<p>所有赛车在起点线后发车，倒计时「3、2、1、开！」后起跑，<b>先跑完规定圈数（默认 3 圈）者获胜</b>。第一名冲线后，其余车手还有 15 秒冲线时间，之后按跑过的距离排名。</p>
<ul><li>驶出赛道（草地）会大幅减速；</li><li>高速转弯时车尾会轻微甩动（漂移），松一点油门更好过弯；</li><li>车与车会相互碰撞推挤；</li><li>必须按赛道方向依次跑完整圈，倒着跑不计圈。</li></ul>
<p>键盘：单人用 方向键 或 WASD（↑ 油门、↓ 刹车/倒车、←→ 转向）。同屏多人：玩家一 WASD，玩家二 方向键，玩家三 IJKL，玩家四 小键盘 8456。</p>
<p>触屏：每位玩家在屏幕下方有自己的 ◀ ▶ 转向键和「刹」键，<b>自动油门</b>。</p>`,
  icon(g, w, h) {
    g.fillStyle = '#7fbf6a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#5a5048'; g.lineWidth = h * .2; g.lineJoin = 'round'; g.beginPath(); g.ellipse(w / 2, h / 2, w * .36, h * .3, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([8, 8]); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#c23a2b'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.ellipse(w / 2, h / 2, w * .36 + h * .1, h * .3 + h * .1, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    teahouse(g, w / 2, h / 2 + 4, h * .16);
    car(g, w * .3, h * .2, -.15, 1.6, '#c23a2b', 1);
    car(g, w * .62, h * .17, .1, 1.6, '#2f5d8a', 2);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.6)'; D.circle(g, w * .18 - i * 8, h * .23 + i * 1.5, 3 - i * .5); g.fill(); }
  },
  create(ctx) {
    const TR = buildTrack(TRACKS[ctx.opts.trk || 0]);
    const LAPS = BX.test ? 1 : (ctx.opts.laps || 3), N = TR.N;
    const n = ctx.n;
    const st = {c: [], ph: 'cd', t: BX.test ? 1.2 : 3.6, order: [], fin: -1, ev: [], evId: 0, over: false};
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 2), lane = i % 2 ? 1 : -1, ci = (N - 3 - row * 5) % N, p = TR.pts[ci], a = TR.dir[ci];
      const nx = -Math.sin(a), ny = Math.cos(a);
      st.c.push({x: p[0] + nx * lane * TW * .22, y: p[1] + ny * lane * TW * .22, a, vx: 0, vy: 0, lap: -1, ci, fin: 0, off: 0, best: 0});
    }
    const cv = ctx.canvas(), fx = K.fx(), pads = K.pads(ctx, cv);
    const evSeen = {v: -1}, skids = [];
    let time = 0, bg = null, bgKey = '';
    const aiS = BX.range(n).map(() => ({lane: (Math.random() - .5) * .5, stuck: 0, rev: 0}));
    /* ---------- deco (deterministic) ---------- */
    const R = BX.rng(31 + (ctx.opts.trk || 0)), deco = [];
    const nearTrack = (x, y, m) => { for (let i = 0; i < N; i += 2) { const p = TR.pts[i]; if ((p[0] - x) ** 2 + (p[1] - y) ** 2 < m * m) return true; } return false; };
    for (let k = 0; k < 220 && deco.length < 46; k++) { const x = 20 + R() * (WW - 40), y = 20 + R() * (WH - 40); if (!nearTrack(x, y, TW * .9)) deco.push({x, y, t: R() < .7 ? 'tree' : R() < .5 ? 'lan' : 'rock', s: .7 + R() * .6}); }
    let house = null; for (let k = 0; k < 400 && !house; k++) { const x = 250 + R() * 500, y = 200 + R() * 220; if (!nearTrack(x, y, TW * 1.2)) house = {x, y}; }
    /* ---------- physics ---------- */
    function track(c) {
      let best = c.ci, bd = Infinity;
      for (let k = -18; k <= 18; k++) { const i = (c.ci + k + N) % N, p = TR.pts[i], d = (p[0] - c.x) ** 2 + (p[1] - c.y) ** 2; if (d < bd) { bd = d; best = i; } }
      if (bd > (TW * 2) ** 2) for (let i = 0; i < N; i += 3) { const p = TR.pts[i], d = (p[0] - c.x) ** 2 + (p[1] - c.y) ** 2; if (d < bd) { bd = d; best = i; } }
      const old = c.ci; c.ci = best; c.off = Math.sqrt(bd) > TW / 2 ? 1 : 0;
      if (best < old - N / 2) c.lap++; else if (best > old + N / 2) c.lap--;
    }
    const prog = c => c.fin ? 1e9 - c.fin : c.lap * N + c.ci;
    function stepCar(i, inp, dt) {
      const c = st.c[i], go = st.ph === 'race' || (st.ph === 'fin' && !c.fin);
      let steer = BX.clamp(+inp.s || 0, -1, 1), thr = BX.clamp(+inp.t || 0, -1, 1);
      if (!go) { thr = c.fin ? 0 : 0; if (c.fin) steer = 0; }
      const fx_ = Math.cos(c.a), fy = Math.sin(c.a);
      let vf = c.vx * fx_ + c.vy * fy, vl = -c.vx * fy + c.vy * fx_;
      const off = c.off, maxV = off ? 135 : 330;
      if (thr > 0) vf += thr * (off ? 170 : 250) * dt * Math.max(.25, 1 - vf / maxV);
      else if (thr < 0) vf += thr * (vf > 0 ? 420 : 140) * dt;
      vf -= vf * (off ? 1.6 : .35) * dt; if (vf < -90) vf = -90;
      if (vf > maxV) vf -= (vf - maxV) * 3 * dt;
      const turn = steer * 2.75 * Math.min(1, Math.abs(vf) / 70) * Math.sign(vf || 1) * (1 - Math.min(.3, Math.abs(vf) / 1400));
      c.a += turn * dt;
      vl *= Math.exp(-(off ? 4 : 5.2) * dt);
      if (c.fin) { vf *= Math.exp(-1.2 * dt); }
      const nfx = Math.cos(c.a), nfy = Math.sin(c.a);
      // keep momentum partly in old heading → light drift
      c.vx = nfx * vf - nfy * vl; c.vy = nfy * vf + nfx * vl;
      const drift = Math.abs(steer) * Math.max(0, vf - 180) * .55 * dt * 6;
      c.vx += -nfy * drift * -Math.sign(steer) * .5; c.vy += nfx * drift * -Math.sign(steer) * .5;
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.x < CR) { c.x = CR; c.vx = Math.abs(c.vx) * .4; } if (c.x > WW - CR) { c.x = WW - CR; c.vx = -Math.abs(c.vx) * .4; }
      if (c.y < CR) { c.y = CR; c.vy = Math.abs(c.vy) * .4; } if (c.y > WH - CR) { c.y = WH - CR; c.vy = -Math.abs(c.vy) * .4; }
      const before = c.lap; track(c);
      if (c.lap > before && c.lap >= 1 && !c.fin) K.ev(st, 'lap', i, c.lap);
      if (!c.fin && c.lap >= LAPS) { st.order.push(i); c.fin = st.order.length; K.ev(st, 'fin', i, c.fin); if (st.ph === 'race') { st.ph = 'fin'; st.t = BX.test ? 3 : 15; } }
    }
    function collide() {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = st.c[i], b = st.c[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < CR * 2 && d > 0) {
          const nx = dx / d, ny = dy / d, ov = CR * 2 - d; a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const imp = -rv * .8; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; if (imp > 40) K.ev(st, 'bump', Math.round((a.x + b.x) / 2), Math.round((a.y + b.y) / 2), Math.round(imp)); }
        }
      }
    }
    /* ---------- AI ---------- */
    function aiInput(seat, level) {
      const c = st.c[seat], A = aiS[seat], sp = Math.hypot(c.vx, c.vy);
      const look = Math.round(8 + sp * .1);
      const ti = (c.ci + look) % N, p = TR.pts[ti], a = TR.dir[ti];
      const lane = A.lane * TW * (level === 3 ? .15 : .35);
      const tx = p[0] - Math.sin(a) * lane, ty = p[1] + Math.cos(a) * lane;
      let want = Math.atan2(ty - c.y, tx - c.x), err = angDiff(want, c.a);
      if (level === 1) err += Math.sin(time * 1.3 + seat) * .18;
      let steer = BX.clamp(err * 2.6, -1, 1);
      // curvature ahead
      const k1 = TR.dir[(c.ci + 6) % N], k2 = TR.dir[(c.ci + 6 + Math.round(10 + sp * .09)) % N], curv = Math.abs(angDiff(k2, k1));
      const vmax = [0, 225, 275, 330][level] * (BX.test ? 1 : 1);
      const safe = Math.max(110, vmax * (1 - curv * [0, .55, .5, .42][level]));
      let thr = sp > safe ? -.6 : 1;
      // stuck recovery
      if (st.ph === 'race' || st.ph === 'fin') { if (sp < 15) A.stuck += 1 / 60; else A.stuck = 0; }
      if (A.stuck > 1.3) { A.rev = .8; A.stuck = 0; }
      if (A.rev > 0) { A.rev -= 1 / 60; thr = -1; steer = -steer; }
      if (Math.random() < .002) A.lane = (Math.random() - .5) * .6;
      return {s: steer, t: thr};
    }
    /* ---------- local input ---------- */
    const nLoc = () => ctx.mySeats.length;
    const KEYS = [['KeyW', 'KeyS', 'KeyA', 'KeyD'], ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], ['KeyI', 'KeyK', 'KeyJ', 'KeyL'], ['Numpad8', 'Numpad5', 'Numpad4', 'Numpad6']];
    function input(seat, slot, nl) {
      const kk = nl === 1 ? [KEYS[0], KEYS[1]] : [KEYS[slot] || KEYS[0]];
      let up = false, dn = false, l = false, r = false;
      for (const k of kk) { up = up || ctx.keys.has(k[0]); dn = dn || ctx.keys.has(k[1]); l = l || ctx.keys.has(k[2]); r = r || ctx.keys.has(k[3]); }
      const tl = pads.held('l', seat), tr = pads.held('r', seat), tb = pads.held('b', seat);
      let t = up ? 1 : dn ? -1 : 0;
      if (pads.touched && !up && !dn) t = tb ? -1 : 1;
      return {s: ((r || tr) ? 1 : 0) - ((l || tl) ? 1 : 0), t};
    }
    /* ---------- view ---------- */
    const touchUI = () => BX.TOUCH.matches || pads.touched;
    function view() {
      const W = cv.w, H = cv.h, hasLocal = nLoc() > 0 && touchUI();
      const ctrlH = hasLocal ? Math.min(Math.max(70, H * .14), 120) : 0;
      const aw = W, ah = H - ctrlH, port = ah > aw * 1.05;
      const lw = port ? WH : WW, lh = port ? WW : WH;
      const f = BX.fit(aw, ah, lw, lh, 4);
      return {W, H, ctrlH, port, s: f.s, ox: f.x, oy: f.y};
    }
    const T = (v, x, y) => v.port ? [v.ox + (WH - y) * v.s, v.oy + x * v.s] : [v.ox + x * v.s, v.oy + y * v.s];
    function ctrlBtns(v) {
      if (!v.ctrlH) return [];
      const seats = ctx.mySeats, k = seats.length, gw = v.W / k, out = [], pad = 6, y0 = v.H - v.ctrlH;
      seats.forEach((seat, gi) => {
        const gx = gi * gw, bh = v.ctrlH - pad * 2, bw = Math.min((gw - pad * 4) * .4, 120), bbw = Math.min((gw - pad * 4) * .2, 70);
        out.push({k: 'l', seat, x: gx + pad, y: y0 + pad, w: bw, h: bh});
        out.push({k: 'b', seat, x: gx + pad * 2 + bw, y: y0 + pad + bh * .25, w: bbw, h: bh * .75});
        out.push({k: 'r', seat, x: gx + gw - pad - bw, y: y0 + pad, w: bw, h: bh});
      });
      return out;
    }
    /* ---------- events / info ---------- */
    let lastCd = 9;
    function playEv() {
      K.evPlay(st, evSeen, e => {
        const v = view();
        if (e[0] === 'cd') ctx.sfx('tick');
        else if (e[0] === 'go') { ctx.sfx('gong'); fx.flash(.5); }
        else if (e[0] === 'lap') { if (ctx.isLocal(e[2]) || nLoc() === 0) { ctx.sfx('bell'); const c = st.c[e[2]], [x, y] = T(v, c.x, c.y); fx.text(x, y - 26, e[3] >= LAPS - 1 ? '最后一圈！' : '第 ' + (e[3] + 1) + ' 圈', {size: 22, color: '#ffe08a'}); } }
        else if (e[0] === 'fin') { ctx.sfx(e[3] === 1 ? 'win' : 'score'); const c = st.c[e[2]], [x, y] = T(v, c.x, c.y); fx.burst(x, y, {n: 40, color: ['#ffd76a', '#fff', ctx.color(e[2]), '#c23a2b'], sp: 300, square: true, up: 100}); fx.text(x, y - 30, '第 ' + e[3] + ' 名', {size: 28, color: '#ffe08a', life: 1.6}); if (e[3] === 1) fx.flash(.8); }
        else if (e[0] === 'bump') { ctx.sfx('hit'); const [x, y] = T(v, e[2], e[3]); fx.burst(x, y, {n: 10, color: ['#ffd76a', '#fff'], sp: 160, size: 3, grav: 0}); fx.shake(Math.min(6, e[4] / 30)); }
        else if (e[0] === 'end') ctx.sfx('bell');
      });
    }
    function ranking() { return BX.range(n).sort((a, b) => prog(st.c[b]) - prog(st.c[a])); }
    function info() {
      const rk = ranking();
      for (let i = 0; i < n; i++) { const c = st.c[i]; ctx.info(i, c.fin ? '第' + c.fin + '名' : 'P' + (rk.indexOf(i) + 1) + ' ' + BX.clamp(c.lap + 1, 1, LAPS) + '/' + LAPS); }
      ctx.status(st.ph === 'cd' ? TR.name + ' · ' + LAPS + ' 圈 · 准备' : st.ph === 'fin' ? '冲线倒计时 ' + Math.ceil(st.t) + ' 秒' : st.over ? '比赛结束' : TR.name + ' · ' + LAPS + ' 圈');
    }
    function finish() {
      st.over = true; st.ph = 'over';
      const rk = ranking(); for (const i of rk) if (!st.c[i].fin) { st.order.push(i); st.c[i].fin = st.order.length; }
      K.ev(st, 'end');
      ctx.end({winner: st.order[0], text: '名次：' + st.order.map((s, k) => (k + 1) + '. ' + ctx.name(s)).join('　')});
    }
    const inst = {
      st, input, aiInput,
      step(dt, inputs) {
        if (st.over) return;
        if (st.ph === 'cd') { st.t -= dt; const c = Math.ceil(st.t); if (c < lastCd && c <= 3 && c > 0) { lastCd = c; K.ev(st, 'cd'); } if (st.t <= 0) { st.ph = 'race'; K.ev(st, 'go'); } }
        for (let i = 0; i < n; i++) stepCar(i, inputs[i] || {}, dt);
        collide();
        if (st.ph === 'fin') { st.t -= dt; if (st.t <= 0 || st.c.every(c => c.fin)) finish(); }
        playEv(); info();
      },
      snapshot() {
        const r = v => Math.round(v * 10) / 10;
        return {c: st.c.map(c => [r(c.x), r(c.y), Math.round(c.a * 1000) / 1000, r(c.vx), r(c.vy), c.lap, c.ci, c.fin, c.off]), ph: st.ph, t: r(st.t), order: st.order, ev: st.ev, over: st.over};
      },
      restore(d) {
        d.c.forEach((a, i) => Object.assign(st.c[i], {x: a[0], y: a[1], a: a[2], vx: a[3], vy: a[4], lap: a[5], ci: a[6], fin: a[7], off: a[8]}));
        Object.assign(st, {ph: d.ph, t: d.t, order: d.order, ev: d.ev, over: d.over}); playEv(); info();
      },
      draw(dt) {
        time += dt; fx.update(dt);
        if (!ctx.isHost) for (const c of st.c) { c.x += c.vx * dt * .5; c.y += c.vy * dt * .5; }
        pads.begin(); const v = view(); for (const b of ctrlBtns(v)) pads.add(b);
        const g = cv.g; cv.clear('#2a190d');
        const key = [v.W, v.H, v.ctrlH, v.port].join(',');
        if (key !== bgKey) { bgKey = key; bg = renderBG(v); }
        const [ox, oy] = fx.offset(); g.save(); g.translate(ox, oy);
        g.drawImage(bg, 0, 0, v.W, v.H);
        // skid marks
        for (let i = 0; i < n; i++) {
          const c = st.c[i], fxx = Math.cos(c.a), fy = Math.sin(c.a), vl = Math.abs(-c.vx * fy + c.vy * fxx), sp = Math.hypot(c.vx, c.vy);
          if ((vl > 45 && sp > 120) || (c.off && sp > 60)) skids.push({x: c.x - fxx * 8, y: c.y - fy * 8, a: c.a, t: 0, off: c.off});
          if (c.off && sp > 60 && Math.random() < .3) { const [x, y] = T(v, c.x - fxx * 10, c.y - fy * 10); fx.burst(x, y, {n: 1, color: '#c8a070', sp: 30, size: 3 * v.s * 2, grav: 0, life: .5}); }
        }
        while (skids.length > 500) skids.shift();
        for (const s of skids) {
          s.t += dt; const [x, y] = T(v, s.x, s.y), al = Math.max(0, .35 - s.t * .05); if (al <= 0) continue;
          g.save(); g.translate(x, y); g.rotate(s.a + (v.port ? Math.PI / 2 : 0)); g.fillStyle = s.off ? `rgba(90,60,30,${al})` : `rgba(30,25,20,${al})`;
          g.fillRect(-1.5 * v.s, -6 * v.s, 3 * v.s, 2.5 * v.s); g.fillRect(-1.5 * v.s, 3.5 * v.s, 3 * v.s, 2.5 * v.s); g.restore();
        }
        // cars (shadow + body)
        const sc = Math.max(1, v.s * 1.15);
        for (let i = 0; i < n; i++) {
          const c = st.c[i], [x, y] = T(v, c.x, c.y), mine = ctx.isLocal(i);
          if (mine && nLoc() > 0) { g.strokeStyle = D.alpha(ctx.color(i), .7); g.lineWidth = 2; D.circle(g, x, y, 17 * sc); g.stroke(); }
          car(g, x, y, c.a + (v.port ? Math.PI / 2 : 0), sc, ctx.color(i), i + 1, Math.hypot(c.vx, c.vy) > 250 && st.ph !== 'cd');
          if (mine && n > 1 && (nLoc() > 1 || true)) D.text(g, nLoc() > 1 ? ctx.name(i) : '你', x, y - 20 * sc, {size: 11, color: '#fff', weight: 800, stroke: 'rgba(0,0,0,.6)'});
        }
        g.restore();
        fx.draw(g);
        drawHUD(g, v);
        drawCtrl(g, v);
        fx.drawFlash(g, v.W, v.H);
      },
    };
    function renderBG(v) {
      const c2 = document.createElement('canvas'), d = cv.dpr; c2.width = Math.max(1, Math.round(v.W * d)); c2.height = Math.max(1, Math.round(v.H * d));
      const g = c2.getContext('2d'); g.scale(d, d);
      D.wood(g, 0, 0, v.W, v.H, {base: '#5a3418', dark: '#2a160a', seed: 4});
      const [ax, ay] = T(v, 0, 0), [bx, by] = T(v, WW, WH), x0 = Math.min(ax, bx), y0 = Math.min(ay, by), w = Math.abs(bx - ax), h = Math.abs(by - ay);
      g.save(); D.rr(g, x0, y0, w, h, 12 * v.s); g.clip();
      const gr = g.createRadialGradient(x0 + w / 2, y0 + h / 2, 10, x0 + w / 2, y0 + h / 2, Math.max(w, h) * .7); gr.addColorStop(0, '#8fcf78'); gr.addColorStop(1, '#5f9f50'); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      const r = BX.rng(9); g.fillStyle = 'rgba(40,90,30,.18)'; for (let i = 0; i < 260; i++) { const [px, py] = T(v, r() * WW, r() * WH); g.fillRect(px, py, 2 * v.s, 4 * v.s); }
      // track
      const path = () => { g.beginPath(); TR.pts.forEach((p, i) => { const [px, py] = T(v, p[0], p[1]); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
      g.lineJoin = 'round'; g.lineCap = 'round';
      path(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = (TW + 14) * v.s; g.stroke();
      path(); g.strokeStyle = '#e8dcc0'; g.lineWidth = (TW + 8) * v.s; g.stroke();
      path(); g.strokeStyle = '#c23a2b'; g.lineWidth = (TW + 8) * v.s; g.setLineDash([10 * v.s, 10 * v.s]); g.stroke(); g.setLineDash([]);
      path(); g.strokeStyle = '#5c544c'; g.lineWidth = TW * v.s; g.stroke();
      path(); g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = TW * .6 * v.s; g.stroke();
      path(); g.strokeStyle = 'rgba(255,240,200,.55)'; g.lineWidth = 1.5 * v.s; g.setLineDash([14 * v.s, 16 * v.s]); g.stroke(); g.setLineDash([]);
      // arrows showing direction
      for (let i = 20; i < TR.N; i += 60) { const p = TR.pts[i], a = TR.dir[i], [px, py] = T(v, p[0], p[1]); g.save(); g.translate(px, py); g.rotate(a + (v.port ? Math.PI / 2 : 0)); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(10 * v.s, 0); g.lineTo(-6 * v.s, -8 * v.s); g.lineTo(-6 * v.s, 8 * v.s); g.fill(); g.restore(); }
      // start line (checkered)
      { const p = TR.pts[0], a = TR.dir[0], [px, py] = T(v, p[0], p[1]); g.save(); g.translate(px, py); g.rotate(a + (v.port ? Math.PI / 2 : 0));
        const cs = TW / 8 * v.s; for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#1b1510'; g.fillRect(j * cs - cs, -TW / 2 * v.s + i * cs, cs, cs); }
        g.restore();
        const [qx, qy] = T(v, p[0] - Math.sin(a) * (TW / 2 + 16), p[1] + Math.cos(a) * (TW / 2 + 16)); K.lantern(g, qx, qy, 7 * v.s * 1.2, '#d23a26', .5);
        const [qx2, qy2] = T(v, p[0] + Math.sin(a) * (TW / 2 + 16), p[1] - Math.cos(a) * (TW / 2 + 16)); K.lantern(g, qx2, qy2, 7 * v.s * 1.2, '#d23a26', .5); }
      // deco
      for (const o of deco) {
        const [px, py] = T(v, o.x, o.y), s = o.s * v.s;
        if (o.t === 'tree') { g.fillStyle = 'rgba(0,0,0,.2)'; D.circle(g, px + 3 * s, py + 4 * s, 13 * s); g.fill(); g.fillStyle = '#3f7f4b'; D.circle(g, px, py, 13 * s); g.fill(); g.fillStyle = '#5aa060'; D.circle(g, px - 3 * s, py - 4 * s, 8 * s); g.fill(); g.fillStyle = '#e88aa0'; for (let k = 0; k < 3; k++) { D.circle(g, px + Math.cos(k * 2.1 + o.x) * 7 * s, py + Math.sin(k * 2.1 + o.y) * 7 * s, 2 * s); g.fill(); } }
        else if (o.t === 'lan') K.lantern(g, px, py, 6 * s, '#d23a26', .4);
        else { g.fillStyle = '#9a9080'; g.beginPath(); g.ellipse(px, py, 9 * s, 6 * s, .4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#b8b0a0'; g.beginPath(); g.ellipse(px - 2 * s, py - 2 * s, 5 * s, 3 * s, .4, 0, Math.PI * 2); g.fill(); }
      }
      if (house) { const [px, py] = T(v, house.x, house.y); teahouse(g, px, py, 26 * v.s); }
      D.text(g, TR.name, x0 + w - 10, y0 + h - 12, {size: Math.max(11, 16 * v.s), color: 'rgba(255,255,255,.55)', font: 'deco', weight: 400, align: 'right'});
      g.restore();
      g.strokeStyle = '#3a1e0a'; g.lineWidth = 4; D.rr(g, x0, y0, w, h, 12 * v.s); g.stroke();
      return c2;
    }
    function drawHUD(g, v) {
      const rk = ranking(), fs = v.W < 500 ? 11 : 13, lh = fs + 7, bw = v.W < 500 ? 118 : 150;
      g.fillStyle = 'rgba(30,16,6,.72)'; D.rr(g, 8, 8, bw, lh * n + 10, 8); g.fill();
      rk.forEach((i, k) => {
        const c = st.c[i], y = 13 + lh * k + lh / 2;
        g.fillStyle = ctx.color(i); D.circle(g, 20, y, 5); g.fill();
        D.text(g, (k + 1) + '. ' + ctx.name(i), 30, y, {size: fs, color: ctx.isLocal(i) ? '#ffe08a' : '#fbe9d0', align: 'left', maxW: bw - 75});
        D.text(g, c.fin ? '完成' : BX.clamp(c.lap + 1, 1, LAPS) + '/' + LAPS, bw, y, {size: fs, color: '#e6c57d', align: 'right'});
      });
      const cy = (v.H - v.ctrlH) / 2, big = Math.min(v.W, v.H - v.ctrlH) * .22;
      if (st.ph === 'cd') { const c = Math.ceil(st.t); if (c <= 3) K.banner(g, String(c), v.W / 2, cy, big, 1 - (st.t % 1)); else K.banner(g, TR.name, v.W / 2, cy, big * .5, 1); drawLights(g, v.W / 2, cy - big * .9, c); }
      else if (st.ph === 'race' && time - (goT || (goT = time)) < .9) K.banner(g, '开！', v.W / 2, cy, big, (time - goT) / .9, {color: '#ffe08a'});
      if (st.ph === 'fin') D.text(g, '冲线倒计时 ' + Math.ceil(st.t), v.W / 2, 22, {size: 16, color: '#ffe08a', weight: 800, stroke: 'rgba(0,0,0,.6)'});
      if (st.ph !== 'race') goT = 0;
    }
    let goT = 0;
    function drawLights(g, x, y, c) {
      for (let i = 0; i < 3; i++) { const on = 3 - i >= c && c <= 3; K.lantern(g, x + (i - 1) * 34, y, 11, on ? '#e03a26' : '#5a2a1f', on ? .8 : 0); }
    }
    function drawCtrl(g, v) {
      const bs = ctrlBtns(v); if (!bs.length) return;
      g.fillStyle = 'rgba(30,16,6,.6)'; g.fillRect(0, v.H - v.ctrlH, v.W, v.ctrlH);
      const k = ctx.mySeats.length;
      for (let i = 1; i < k; i++) { g.fillStyle = '#e6c57d'; g.fillRect(v.W / k * i - 1, v.H - v.ctrlH, 2, v.ctrlH); }
      for (const b of bs) {
        K.btn(g, b, {l: '◀', r: '▶', b: '刹'}[b.k], {color: b.k === 'b' ? '#7a6a5a' : ctx.color(b.seat), fg: '#fff6e0', pressed: pads.held(b.k, b.seat), size: Math.min(b.h * .42, b.k === 'b' ? 18 : 30)});
      }
      if (k > 1) for (let gi = 0; gi < k; gi++) D.text(g, ctx.name(ctx.mySeats[gi]), v.W / k * (gi + .5), v.H - v.ctrlH + 9, {size: 10, color: '#fbe9d0'});
    }
    info();
    return inst;
  },
});

function car(g, x, y, a, s, col, num, fast) {
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,.3)'; D.rr(g, -11, -6, 24, 15, 5); g.fill();
  g.fillStyle = '#1b1510'; for (const [wx, wy] of [[-7, -7.5], [6, -7.5], [-7, 5.5], [6, 5.5]]) { D.rr(g, wx - 3, wy, 6, 2.5, 1); g.fill(); }
  const gr = g.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, D.shade(col, 25)); gr.addColorStop(1, D.shade(col, -25));
  g.fillStyle = gr; D.rr(g, -12, -6, 24, 12, 5); g.fill();
  g.fillStyle = '#e6c57d'; g.fillRect(-12, -1, 24, 2);
  g.fillStyle = 'rgba(180,220,255,.85)'; D.rr(g, 1, -4.5, 5, 9, 2); g.fill();
  g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, -7, -4, 6, 8, 2); g.fill();
  g.fillStyle = '#fff6c0'; D.circle(g, 11.5, -3.6, 1.3); g.fill(); D.circle(g, 11.5, 3.6, 1.3); g.fill();
  if (num) { g.save(); g.translate(-4, 0); g.rotate(-a); D.text(g, String(num), 0, 0, {size: 6.5, color: '#fff', weight: 900}); g.restore(); }
  if (fast) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (const yy of [-4, 0, 4]) { g.beginPath(); g.moveTo(-14, yy); g.lineTo(-22, yy); g.stroke(); } }
  g.restore();
}
function teahouse(g, x, y, s) {
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-s * .95, -s * .5, s * 2, s * 1.2);
  g.fillStyle = '#e8d8b0'; g.fillRect(-s * .8, -s * .5, s * 1.6, s * 1.1);
  g.fillStyle = '#7a2a1f'; g.beginPath(); g.moveTo(-s * 1.1, -s * .45); g.quadraticCurveTo(0, -s * .2, s * 1.1, -s * .45); g.lineTo(s * .8, -s * .95); g.lineTo(-s * .8, -s * .95); g.closePath(); g.fill();
  g.fillStyle = '#5a1e14'; g.fillRect(-s * .8, -s * 1, s * 1.6, s * .1);
  g.fillStyle = '#b23a2b'; for (const xx of [-.6, .6]) { g.fillRect(xx * s - s * .06, -s * .45, s * .12, s * 1.05); }
  g.fillStyle = '#3a1e0a'; g.fillRect(-s * .3, -s * .1, s * .6, s * .7);
  g.fillStyle = '#c8a052'; g.fillRect(-s * .35, -s * .42, s * .7, s * .22); D.text(g, '茶', 0, -s * .31, {size: s * .2, color: '#7a2a1f', font: 'deco', weight: 400});
  g.restore();
}
