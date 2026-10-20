/* 迷你高尔夫 — 9 original holes, turn-based putting with deterministic ball physics inside apply. */
const D = BX.draw, C = BX.C, K = BX.data.pk;
const BR = 1.1, CUP = 1.75, DT = 1 / 120, MAXSTEP = 120 * 14, VMAX = 120, CAP = 6;
/* hole definitions in a 100 × 60 landscape frame.
   walls: polylines [[x,y],...] (closed outlines repeat first point);  sand / water / slope: polygons (slope has g:[gx,gy]);
   bump: [x,y,r] round bumpers (bouncy);  tun: [[ax,ay],[bx,by], exitDir[dx,dy]] tunnel mouths;  mill: rotating-free blocker posts [x,y,r] (static) */
const HOLES = [
  {name: '曲水流觞', par: 2, tee: [12, 30], cup: [86, 30],
    walls: [[[4, 18], [96, 18], [96, 42], [4, 42], [4, 18]]], bump: [[50, 30, 3]]},
  {name: '折桂', par: 3, tee: [12, 48], cup: [86, 14],
    walls: [[[4, 40], [62, 40], [62, 6], [96, 6], [96, 56], [4, 56], [4, 40]]], slope: [{p: [[62, 40], [96, 40], [96, 56], [62, 56]], g: [0, -26]}]},
  {name: '沙洲', par: 3, tee: [10, 30], cup: [90, 30],
    walls: [[[4, 12], [96, 12], [96, 48], [4, 48], [4, 12]]], sand: [[[34, 12], [52, 12], [52, 34], [34, 34]], [[58, 26], [74, 26], [74, 48], [58, 48]]], bump: [[46, 42, 2.4], [66, 18, 2.4]]},
  {name: '石桥', par: 3, tee: [10, 30], cup: [90, 30],
    walls: [[[4, 10], [96, 10], [96, 50], [4, 50], [4, 10]], [[40, 26], [60, 26]], [[40, 34], [60, 34]]], water: [[[36, 10], [64, 10], [64, 25], [36, 25]], [[36, 35], [64, 35], [64, 50], [36, 50]]]},
  {name: '回廊', par: 3, tee: [10, 14], cup: [10, 46],
    walls: [[[4, 6], [96, 6], [96, 54], [4, 54], [4, 6]], [[4, 30], [80, 30]]], bump: [[88, 30, 2.5]]},
  {name: '洞天', par: 2, tee: [10, 30], cup: [88, 30],
    walls: [[[4, 20], [30, 20], [30, 40], [4, 40], [4, 20]], [[64, 14], [96, 14], [96, 46], [64, 46], [64, 14]]], tun: [[[27, 30], [68, 30], [1, 0]]], water: [[[30, 6], [64, 6], [64, 54], [30, 54]]]},
  {name: '梅花桩', par: 3, tee: [10, 30], cup: [90, 30],
    walls: [[[4, 10], [96, 10], [96, 50], [4, 50], [4, 10]]], bump: [[34, 22, 3], [34, 38, 3], [50, 30, 3], [66, 20, 3], [66, 40, 3], [80, 30, 2.4]]},
  {name: '山坳', par: 3, tee: [10, 30], cup: [90, 30],
    walls: [[[4, 8], [96, 8], [96, 52], [4, 52], [4, 8]]], slope: [{p: [[28, 8], [50, 8], [50, 52], [28, 52]], g: [0, 22]}, {p: [[50, 8], [72, 8], [72, 52], [50, 52]], g: [0, -22]}], sand: [[[80, 8], [96, 8], [96, 20], [80, 20]], [[80, 40], [96, 40], [96, 52], [80, 52]]], water: [[[36, 44], [64, 44], [64, 52], [36, 52]]]},
  {name: '龙门', par: 4, tee: [10, 48], cup: [88, 12],
    walls: [[[4, 40], [40, 40], [40, 20], [60, 20], [60, 4], [96, 4], [96, 22], [72, 22], [72, 56], [4, 56], [4, 40]], [[52, 56], [52, 47]]], water: [[[40, 22], [52, 22], [52, 40], [40, 40]]], bump: [[62, 46, 2.6], [80, 8, 1.8]], slope: [{p: [[60, 22], [72, 22], [72, 56], [60, 56]], g: [0, -18]}]},
];
/* ---------- deterministic helpers ---------- */
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function segs(h) { if (h._s) return h._s; const s = []; for (const w of h.walls) for (let i = 1; i < w.length; i++) s.push([w[i - 1][0], w[i - 1][1], w[i][0], w[i][1]]); h._s = s; return s; }
/* simulate one putt. ball {x,y}; shot {dx,dy,p}. returns {x,y,res:'cup'|'water'|'rest', frames, ev, steps} */
function simulate(h, bx, by, dx, dy, p, rec) {
  let x = bx, y = by, vx = dx * p * VMAX, vy = dy * p * VMAX, step = 0, res = 'rest', lx = bx, ly = by;
  const S = segs(h), fr = rec ? [[x, y]] : null, ev = [];
  let tunCD = 0;
  for (step = 1; step <= MAXSTEP; step++) {
    const sp = Math.sqrt(vx * vx + vy * vy);
    const sand = h.sand && h.sand.some(q => inPoly(x, y, q));
    let ax = 0, ay = 0;
    if (h.slope) for (const sl of h.slope) if (inPoly(x, y, sl.p)) { ax += sl.g[0]; ay += sl.g[1]; }
    const fric = sand ? 95 : 16;
    vx += ax * DT; vy += ay * DT;
    if (sp > 0) { const k = Math.max(0, 1 - fric * DT / sp); vx *= k; vy *= k; }
    const nsp = Math.sqrt(vx * vx + vy * vy);
    // cup: captured if slow enough near the centre
    const cx = h.cup[0] - x, cy = h.cup[1] - y, cd = Math.sqrt(cx * cx + cy * cy);
    if (cd < CUP) {
      if (nsp < 34) { res = 'cup'; x = h.cup[0]; y = h.cup[1]; ev.push([step, 'cup']); if (rec) fr.push([x, y]); break; }
      // lip-out: deflect a little
      vx += cx / cd * 30 * DT * 8; vy += cy / cd * 30 * DT * 8; if (step % 6 === 0) ev.push([step, 'lip']);
    } else if (cd < CUP * 2 && nsp < 40) { vx += cx / cd * 14 * DT; vy += cy / cd * 14 * DT; }
    // integrate in sub-steps to avoid tunnelling
    const sub = Math.max(1, Math.ceil(nsp * DT / (BR * .5)));
    for (let k = 0; k < sub; k++) {
      x += vx * DT / sub; y += vy * DT / sub;
      for (const s of S) {
        const ex = s[2] - s[0], ey = s[3] - s[1], L2 = ex * ex + ey * ey;
        let t = ((x - s[0]) * ex + (y - s[1]) * ey) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = s[0] + ex * t, qy = s[1] + ey * t, ox = x - qx, oy = y - qy, d2 = ox * ox + oy * oy;
        if (d2 < BR * BR && d2 > 1e-12) {
          const d = Math.sqrt(d2), nx = ox / d, ny = oy / d, vn = vx * nx + vy * ny;
          x = qx + nx * BR; y = qy + ny * BR;
          if (vn < 0) { vx -= 1.8 * vn * nx; vy -= 1.8 * vn * ny; vx *= .96; vy *= .96; if (-vn > 8) ev.push([step, 'wall', Math.round(-vn)]); }
        }
      }
      if (h.bump) for (const b of h.bump) {
        const ox = x - b[0], oy = y - b[1], d2 = ox * ox + oy * oy, md = BR + b[2];
        if (d2 < md * md && d2 > 1e-12) {
          const d = Math.sqrt(d2), nx = ox / d, ny = oy / d, vn = vx * nx + vy * ny;
          x = b[0] + nx * md; y = b[1] + ny * md;
          if (vn < 0) { vx -= 2.15 * vn * nx; vy -= 2.15 * vn * ny; ev.push([step, 'bump', Math.round(-vn)]); }
        }
      }
    }
    if (tunCD > 0) tunCD--;
    else if (h.tun) for (const tn of h.tun) {
      const ox = x - tn[0][0], oy = y - tn[0][1];
      if (ox * ox + oy * oy < 4 * BR * BR) { const s2 = Math.sqrt(vx * vx + vy * vy) * .9; x = tn[1][0]; y = tn[1][1]; vx = tn[2][0] * s2; vy = tn[2][1] * s2; tunCD = 30; ev.push([step, 'tun']); if (rec) fr.push([x, y, 1]); }
    }
    if (h.water && h.water.some(q => inPoly(x, y, q)) && !(h.tun && tunCD > 0 && false)) {
      // only splash if not on a bridge (segments of walls inside water act as rails; bridge = band between rails)
      if (!onBridge(h, x, y)) { res = 'water'; ev.push([step, 'water']); if (rec) fr.push([x, y]); break; }
    }
    if (rec && step % 2 === 0) fr.push([x, y]);
    if (Math.sqrt(vx * vx + vy * vy) < .6 && !(h.slope && h.slope.some(sl => inPoly(x, y, sl.p)) && step < 400)) break;
    if (Math.sqrt(vx * vx + vy * vy) < .25) break;
    lx = x; ly = y;
  }
  void lx; void ly;
  if (rec) fr.push([x, y]);
  return {x: Math.round(x * 1e3) / 1e3, y: Math.round(y * 1e3) / 1e3, res, frames: fr, ev, steps: step};
}
/* AI helper: path distance to the cup over a 1-unit grid (walls / water block; tunnels connect) */
function distField(h) {
  if (h._df) return h._df;
  const W = 101, H = 61, df = new Float32Array(W * H).fill(1e9), S = segs(h), blk = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let b = 0;
    for (const s of S) { const ex = s[2] - s[0], ey = s[3] - s[1], L2 = ex * ex + ey * ey; let t = ((x - s[0]) * ex + (y - s[1]) * ey) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = s[0] + ex * t - x, qy = s[1] + ey * t - y; if (qx * qx + qy * qy < 1.4) { b = 1; break; } }
    if (!b && h.water && h.water.some(q => inPoly(x, y, q)) && !onBridge(h, x, y)) b = 1;
    if (!b && h.bump && h.bump.some(q => (x - q[0]) * (x - q[0]) + (y - q[1]) * (y - q[1]) < (q[2] + 1) * (q[2] + 1))) b = 1;
    blk[y * W + x] = b;
  }
  const q = [], cx = Math.round(h.cup[0]), cy = Math.round(h.cup[1]);
  df[cy * W + cx] = 0; q.push(cy * W + cx);
  const N = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  for (let it = 0; it < 3; it++) {
    for (let qi = 0; qi < q.length; qi++) {
      const i = q[qi], x = i % W, y = (i - x) / W, d = df[i];
      for (const [dx, dy, c] of N) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (blk[j] || df[j] <= d + c) continue; df[j] = d + c; q.push(j); }
    }
    // tunnels: entering mouth A costs the distance from mouth B
    let ch = false;
    for (const tn of h.tun || []) { const a = Math.round(tn[0][1]) * W + Math.round(tn[0][0]), b = Math.round(tn[1][1]) * W + Math.round(tn[1][0]); if (df[b] + 2 < df[a]) { df[a] = df[b] + 2; q.length = 0; q.push(a); ch = true; } }
    if (!ch) break;
  }
  h._df = df; return df;
}
function pathDist(h, x, y) { const df = distField(h), xi = Math.max(0, Math.min(100, Math.round(x))), yi = Math.max(0, Math.min(60, Math.round(y))); let v = df[yi * 101 + xi]; if (v > 1e8) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const xx = Math.max(0, Math.min(100, xi + dx)), yy = Math.max(0, Math.min(60, yi + dy)); v = Math.min(v, df[yy * 101 + xx] + 1); } } return v > 1e8 ? 300 : v; }
function onBridge(h, x, y) { return h.bridge ? h.bridge.some(q => inPoly(x, y, q)) : false; }
// the stone bridge on hole 4 is the band between the rails
HOLES[3].bridge = [[[36, 25], [64, 25], [64, 35], [36, 35]]];
HOLES[5].bridgeless = true;

BX.register({
  id: 'minigolf', title: '迷你高尔夫', cat: 'physics', order: 4, sub: '九洞园林，一杆进洞',
  desc: '在九个园林小球场上推杆：借边库反弹、绕过沙坑和水池、钻过假山洞。每洞看谁用的杆数少，九洞总杆数最少者胜。',
  kind: 'turn', seats: [1, 4], defSeats: 2, seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b'], aiDelay: 450,
  options: [{key: 'holes', label: '洞数', choices: [[3, '前 3 洞'], [9, '9 洞']], def: 9}],
  rules: `<p>共 <b>9 洞</b>（可选只打前 3 洞）。每洞所有玩家依次上场，<b>每人一直推杆直到球进洞</b>，再轮到下一位。</p>
<p><b>计杆：</b>每推一次记 1 杆。球落入<b>水池</b>罚 1 杆，球放回击球前的位置。每洞最多 <b>${CAP} 杆</b>，到达上限仍未进洞记 ${CAP} 杆。</p>
<p><b>场地：</b>木栏可以反弹（打库边借角度）；圆形<b>石墩</b>弹性更强；<b>沙坑</b>阻力很大；<b>坡道</b>会把球往低处推（看地面箭头）；<b>假山洞</b>从一个洞口进、另一个洞口出。球速太快经过洞口会“吃边”滑走，力度要恰到好处。</p>
<p>每洞有标准杆（<b>标准杆 Par</b>），记分卡上显示与标准杆之差。九洞总杆数<b>最少者胜</b>，并列同胜。单人练习时会记录你的最好成绩。</p>
<p><b>操作：</b>在画面任意处按住并<b>向后拉</b>（像弹弓），球会朝相反方向击出，拉得越长越用力；虚线显示开头一段路线（不含反弹）。键盘：←→ 转向、↑↓ 力度、空格击球。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 9, base: '#6b4426'});
    g.fillStyle = '#3f8f5b'; D.rr(g, 10, 14, w - 20, h - 28, 10); g.fill();
    const gr = g.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, w * .6); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(0,0,0,.15)'); g.fillStyle = gr; D.rr(g, 10, 14, w - 20, h - 28, 10); g.fill();
    g.fillStyle = '#e8d5a5'; g.beginPath(); g.ellipse(w * .45, h * .66, 22, 13, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4a8fb0'; g.beginPath(); g.ellipse(w * .62, h * .32, 20, 11, .3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; D.circle(g, w * .82, h * .5, 7); g.fill();
    g.strokeStyle = '#7a3a22'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * .82, h * .5); g.lineTo(w * .82, h * .18); g.stroke();
    g.fillStyle = '#c23a2b'; g.beginPath(); g.moveTo(w * .82, h * .18); g.lineTo(w * .82 + 20, h * .23); g.lineTo(w * .82, h * .29); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(w * .18, h * .55); g.lineTo(w * .4, h * .3); g.lineTo(w * .78, h * .48); g.stroke(); g.setLineDash([]);
    D.disc(g, w * .18, h * .55, 6, '#fffaf0');
  },
  create(ctx) {
    K.css();
    const NH = BX.test ? 2 : (ctx.opts.holes || 9);
    const st = {n: ctx.n, NH, hole: 0, turn: 0, strokes: 0, ball: HOLES[0].tee.slice(), card: BX.range(ctx.n).map(() => []), over: false, last: null};
    const cv = ctx.canvas(), pb = K.playback(ctx), fx = K.fx(), cache = K.cache();
    let show = null, aim = {dx: 1, dy: 0, p: .35}, keyT = 0, intro = 0;
    /* ---------- view ---------- */
    function bbox(hi) {
      const h = HOLES[hi]; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
      for (const w of h.walls) for (const [x, y] of w) add(x, y);
      for (const q of (h.water || [])) for (const [x, y] of q) add(x, y);
      return [x0 - 3, y0 - (hi === Z.hole ? 7 : 3), x1 + 3, y1 + 3];
    }
    function layout() {
      const W = cv.w, H = cv.h, port = H > W * 1.05;
      const cardH = port ? 26 + 22 * ctx.n : 0, cardW = port ? 0 : Math.min(250, W * .26);
      const aw = W - cardW, ah = H - cardH;
      const [x0, y0, x1, y1] = bbox(Math.min(Z.hole, HOLES.length - 1));
      const lw = port ? y1 - y0 : x1 - x0, lh = port ? x1 - x0 : y1 - y0;
      const f = BX.fit(aw, ah - (port ? 44 : 0), lw, lh, 10);
      return {W, H, port, s: f.s, ox: f.x, oy: (port ? cardH : 0) + f.y, cardH, cardW, x0, y0, x1, y1};
    }
    let Z = st;
    let V = layout();
    /* world → screen. portrait is rotated so that world +x points up (tee at the bottom) */
    const T = (x, y) => V.port ? [V.ox + (y - V.y0) * V.s, V.oy + (V.x1 - x) * V.s] : [V.ox + (x - V.x0) * V.s, V.oy + (y - V.y0) * V.s];
    const myTurn = () => !st.over && !pb.on && ctx.canAct(st.turn);
    const sling = K.sling(ctx, cv, {
      enabled: myTurn, max: () => Math.min(cv.w, cv.h) * .36, min: .03,
      change: s => { let dx, dy; if (V.port) { dx = -s.dy; dy = s.dx; } else { dx = s.dx; dy = s.dy; } aim = {dx, dy, p: s.p}; },
      release: () => putt(),
    });
    function putt() { if (!myTurn()) return; ctx.sfx('hit'); ctx.act({dx: +aim.dx.toFixed(6), dy: +aim.dy.toFixed(6), p: +aim.p.toFixed(4)}, st.turn); }
    function key(e) {
      if (!myTurn()) return;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { const a = Math.atan2(aim.dy, aim.dx) + (e.code === 'ArrowRight' ? 1 : -1) * Math.PI / 120; aim.dx = Math.cos(a); aim.dy = Math.sin(a); keyT = performance.now(); }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { aim.p = BX.clamp(aim.p + (e.code === 'ArrowUp' ? .01 : -.01), .02, 1); keyT = performance.now(); }
      if (e.code === 'Space' || e.code === 'Enter') putt();
    }
    /* ---------- rules ---------- */
    const total = i => st.card[i].reduce((a, b) => a + b, 0);
    function status() {
      for (let i = 0; i < ctx.n; i++) { const t = total(i), par = HOLES.slice(0, st.card[i].length).reduce((a, h) => a + h.par, 0); ctx.info(i, t + ' 杆' + (st.card[i].length ? '（' + (t - par >= 0 ? '+' : '') + (t - par) + '）' : '')); }
      if (st.over) return ctx.status('九洞完成');
      if (pb.on) return ctx.status(ctx.name(Z.turn) + ' 推杆…');
      const h = HOLES[st.hole], who = ctx.canAct(st.turn) ? (ctx.hotseat || ctx.n === 1 ? ctx.name(st.turn) + ' ' : '轮到你 ') : ctx.name(st.turn) + ' ';
      ctx.status(`第 ${st.hole + 1} 洞「${h.name}」标准杆 ${h.par} · ${who}第 ${st.strokes + 1} 杆`);
    }
    const inst = {
      st,
      toMove: () => st.over || (pb.on && !ctx.isRemote(st.turn)) ? null : st.turn,   // remote seats may act during our local playback (avoids host rejecting a guest that finished playback first)
      valid: a => a && isFinite(a.dx) && isFinite(a.dy) && isFinite(a.p),
      apply(a, by) {
        const h = HOLES[st.hole], who = st.turn;
        let dx = +a.dx || 1, dy = +a.dy || 0; const l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
        const p = Math.max(.02, Math.min(1, +a.p || .1));
        const snap = {hole: st.hole, turn: who, strokes: st.strokes, ball: st.ball.slice(), card: st.card.map(c => c.slice())};
        const r = simulate(h, st.ball[0], st.ball[1], dx, dy, p, !ctx.fast);
        st.strokes++;
        let done = false, note = '';
        if (r.res === 'water') { st.strokes++; note = 'water'; }
        else st.ball = [r.x, r.y];
        if (r.res === 'cup') { done = true; note = 'cup'; }
        if (!done && st.strokes >= CAP) { done = true; st.strokes = CAP; note = 'cap'; }
        const sc = st.strokes;
        st.last = {who, res: r.res, strokes: sc};
        let newHole = false;
        if (done) {
          st.card[who].push(sc);
          if (who < st.n - 1) { st.turn = who + 1; }
          else { st.hole++; st.turn = 0; newHole = true; if (st.hole >= st.NH) st.over = true; }
          st.strokes = 0;
          if (!st.over) st.ball = HOLES[st.hole].tee.slice();
        }
        if (!ctx.fast) {
          show = {r, snap, note, sc, who, par: h.par, done: false, ei: 0, newHole};
          const simT = r.steps * DT;
          pb.start(simT + (done ? 1.6 : .5), () => { show = null; if (newHole) intro = 1; status(); }, []);
        }
        if (st.over) finish(show ? (r.steps * DT + 2) * 1000 : 600);
        status();
      },
      aiMove(seat, level) { return ai(seat, level); },
      onTurn: status, key,
      resize() { V = layout(); },
      frame(dt) {
        pb.tick(dt); fx.update(dt); intro = Math.max(0, intro - dt * .6);
        Z = show ? Object.assign({}, st, show.snap, {over: false}) : st; V = layout();
        draw(dt);
      },
    };
    function finish(delay) {
      const tt = BX.range(ctx.n).map(total), best = Math.min(...tt), win = BX.range(ctx.n).filter(i => tt[i] === best);
      const par = HOLES.slice(0, st.NH).reduce((a, h) => a + h.par, 0);
      let text = BX.range(ctx.n).map(i => `${ctx.name(i)} ${tt[i]} 杆`).join('　') + `（标准杆 ${par}）`;
      if (ctx.n === 1) { const b = ctx.best('total' + st.NH, tt[0], 'min'); text = `总杆数 ${tt[0]}（标准杆 ${par}）` + (b.isNew ? ' · 新纪录！' : ` · 最佳 ${b.best}`); ctx.end({win: tt[0] <= par + 3, title: tt[0] <= par ? '漂亮！' : '打完九洞', text, delay}); return; }
      ctx.end({winner: win.length === ctx.n ? -1 : win.length === 1 ? win[0] : win, text, delay});
    }
    /* ---------- AI: sample directions × powers, score by result ---------- */
    function ai(seat, level) {
      const h = HOLES[st.hole], [bx, by] = st.ball, t0 = performance.now(), budget = BX.test ? 30 : 380;
      let best = null, bv = -1e9;
      const direct = Math.atan2(h.cup[1] - by, h.cup[0] - bx);
      const score = r => {
        if (r.res === 'cup') return 1000;
        if (r.res === 'water') return -400;
        let v = -pathDist(h, r.x, r.y);
        if (h.sand && h.sand.some(q => inPoly(r.x, r.y, q))) v -= 8;
        if (blocked(h, r.x, r.y)) v -= 4;
        return v;
      };
      const tries = [];
      for (let i = 0; i < 72; i++) tries.push(direct + (i - 36) * Math.PI / 36 * (i % 2 ? 1 : 1));
      for (let i = 0; i < 48; i++) tries.push(direct + (Math.random() - .5) * .5);
      const ps = [.1, .16, .22, .3, .38, .48, .6, .75, .9];
      let n = 0;
      outer: for (const pp of [ps, ps.map(p => p * 1.07), ps.map(p => p * .93)]) for (const a of tries) for (const p of pp) {
        if (n > 12 && performance.now() - t0 > budget) break outer;
        n++;
        const r = simulate(h, bx, by, Math.cos(a), Math.sin(a), p, false);
        const v = score(r) + Math.random() * .1;
        if (v > bv) { bv = v; best = {a, p}; }
      }
      if (!best) best = {a: direct, p: .3};
      const na = [0, .1, .045, .018][level], np = [0, .14, .07, .03][level];
      const g2 = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const ang = best.a + g2() * na, p = BX.clamp(best.p * (1 + g2() * np), .02, 1);
      if (!ctx.isRemote(seat)) aim = {dx: Math.cos(ang), dy: Math.sin(ang), p};
      return {dx: +Math.cos(ang).toFixed(6), dy: +Math.sin(ang).toFixed(6), p: +p.toFixed(4)};
    }
    function blocked(h, x, y) {
      const S = segs(h), ex = h.cup[0] - x, ey = h.cup[1] - y;
      for (const s of S) { const fx2 = s[2] - s[0], fy = s[3] - s[1], den = ex * fy - ey * fx2; if (Math.abs(den) < 1e-9) continue; const t = ((s[0] - x) * fy - (s[1] - y) * fx2) / den, u = ((s[0] - x) * ey - (s[1] - y) * ex) / den; if (t > 0 && t < 1 && u > 0 && u < 1) return true; }
      return false;
    }
    /* ---------- drawing ---------- */
    function course(g, hi) {
      const h = HOLES[hi], S = V.s;
      const poly = (pts) => { g.beginPath(); pts.forEach((p, i) => { const [x, y] = T(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
      // ink landscape backdrop on paper
      D.paper(g, 0, 0, V.W, V.H, {color: '#efe2c4'});
      K.mountains(g, 0, V.H * .05, V.W, V.H * .9, {seed: 40 + hi, layers: 3, top: .1, base: .8, alpha: [.08, .12, .18]});
      // fairway = convex hull-ish: fill each closed wall outline
      const outlines = h.walls.filter(w => w.length > 3 && w[0][0] === w[w.length - 1][0] && w[0][1] === w[w.length - 1][1]);
      for (const w of outlines) {
        g.save(); g.shadowColor = 'rgba(40,25,10,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 4;
        poly(w); g.fillStyle = '#3f8f5b'; g.fill(); g.restore();
        g.save(); poly(w); g.clip();
        const [cx, cy] = T(50, 30); const gr = g.createRadialGradient(cx, cy, 10, cx, cy, Math.max(V.W, V.H) * .6); gr.addColorStop(0, '#58a86e'); gr.addColorStop(1, '#2f7348'); g.fillStyle = gr; g.fillRect(0, 0, V.W, V.H);
        // mowing stripes
        g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 100; i += 8) { poly([[i, 0], [i + 4, 0], [i + 4, 60], [i, 60]]); g.fill(); }
        g.restore();
      }
      const zone = (pts, fill, stroke) => { poly(pts); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); } };
      for (const q of h.water || []) {
        zone(q, '#3c7fa0');
        g.save(); poly(q); g.clip(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.2;
        const [a] = T(q[0][0], q[0][1]); void a;
        for (let i = 0; i < 26; i++) { const xx = q[0][0] + (i * 37 % 100) / 100 * 30, yy = q[0][1] + (i * 53 % 100) / 100 * 45; const [px, py] = T(xx, yy); g.beginPath(); g.arc(px, py, S * 1.6, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
        // lotus pads
        for (let i = 0; i < 3; i++) { const [px, py] = T(q[0][0] + 4 + i * 7, q[0][1] + 4 + (i % 2) * 6); g.fillStyle = 'rgba(80,140,90,.85)'; g.beginPath(); g.arc(px, py, S * 1.5, .4, Math.PI * 2); g.lineTo(px, py); g.fill(); }
        g.restore();
      }
      for (const b of h.bridge || []) { zone(b, '#a8865a', 'rgba(60,35,15,.6)'); g.save(); poly(b); g.clip(); g.strokeStyle = 'rgba(60,35,15,.35)'; g.lineWidth = 1; for (let xx = b[0][0]; xx < b[1][0]; xx += 2.5) { const [x1, y1] = T(xx, b[0][1]), [x2, y2] = T(xx, b[2][1]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } g.restore(); }
      for (const q of h.sand || []) { zone(q, '#e3cf98', 'rgba(150,120,60,.4)'); g.save(); poly(q); g.clip(); g.fillStyle = 'rgba(150,120,60,.25)'; const r2 = BX.rng(hi * 7 + 1); for (let i = 0; i < 160; i++) { const [px, py] = T(q[0][0] + r2() * 30, q[0][1] + r2() * 30); g.fillRect(px, py, 1.5, 1.5); } g.restore(); }
      for (const sl of h.slope || []) {
        zone(sl.p, 'rgba(20,60,30,.14)');
        const xs = sl.p.map(p => p[0]), ys = sl.p.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const gl = Math.hypot(sl.g[0], sl.g[1]), ux = sl.g[0] / gl, uy = sl.g[1] / gl;
        g.strokeStyle = 'rgba(255,255,230,.45)'; g.lineWidth = 2;
        for (let xx = x0 + 4; xx < x1; xx += 8) for (let yy = y0 + 4; yy < y1; yy += 8) {
          if (!inPoly(xx, yy, sl.p)) continue;
          const [ax, ay] = T(xx - ux * 2, yy - uy * 2), [bx2, by2] = T(xx + ux * 2, yy + uy * 2);
          const vx = bx2 - ax, vy = by2 - ay, L = Math.hypot(vx, vy) || 1;
          g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx2, by2); g.moveTo(bx2, by2); g.lineTo(bx2 - vx / L * 5 - vy / L * 4, by2 - vy / L * 5 + vx / L * 4); g.moveTo(bx2, by2); g.lineTo(bx2 - vx / L * 5 + vy / L * 4, by2 - vy / L * 5 - vx / L * 4); g.stroke();
        }
      }
      // tunnels: rockery
      for (const tn of h.tun || []) for (const m of [tn[0], tn[1]]) {
        const [x, y] = T(m[0], m[1]);
        g.fillStyle = '#6e6a62'; g.beginPath(); g.ellipse(x, y, S * 5, S * 4.2, .3, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#8c877c'; g.beginPath(); g.ellipse(x - S, y - S, S * 3.4, S * 2.6, .2, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#15100a'; D.circle(g, x, y, S * 2.2); g.fill();
      }
      // walls (wood rails)
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const w of h.walls) {
        g.beginPath(); w.forEach((p, i) => { const [x, y] = T(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.strokeStyle = '#3a2414'; g.lineWidth = S * 1.6 + 2; g.stroke();
        g.strokeStyle = '#a8723d'; g.lineWidth = S * 1.2; g.stroke();
        g.strokeStyle = 'rgba(255,230,180,.35)'; g.lineWidth = S * .35; g.stroke();
      }
      // bumpers: stone drums
      for (const b of h.bump || []) { const [x, y] = T(b[0], b[1]); D.disc(g, x, y, b[2] * S, '#8a8478', {ring: 'rgba(255,255,255,.35)'}); D.disc(g, x, y, b[2] * S * .55, '#6e675b', {shadow: false}); }
      // tee mat
      const [tx, ty] = T(h.tee[0], h.tee[1]); g.fillStyle = 'rgba(178,58,43,.5)'; D.rr(g, tx - S * 2.4, ty - S * 2.4, S * 4.8, S * 4.8, S); g.fill();
      // cup
      const [cx, cy] = T(h.cup[0], h.cup[1]);
      g.fillStyle = 'rgba(255,255,255,.25)'; D.circle(g, cx, cy, CUP * S * 1.5); g.fill();
      g.fillStyle = '#0d0905'; D.circle(g, cx, cy, CUP * S); g.fill();
      g.strokeStyle = '#d8d0c0'; g.lineWidth = Math.max(1, S * .25); D.circle(g, cx, cy, CUP * S); g.stroke();
    }
    function draw(dt) {
      const g = cv.g; cv.clear();
      const hi = Math.min(Z.hole, HOLES.length - 1);
      const bg = cache('c' + hi + (V.port ? 'p' : 'l') + V.cardW + ':' + Math.round(V.s * 100) + ':' + Math.round(V.ox) + ':' + Math.round(V.oy), V.W, V.H, cv.dpr, c2 => course(c2, hi));
      const [ox, oy] = fx.off(); g.save(); g.translate(ox, oy);
      g.drawImage(bg, 0, 0, V.W, V.H);
      const h = HOLES[hi], S = V.s;
      // flag
      const [cx, cy] = T(h.cup[0], h.cup[1]), wave = Math.sin(performance.now() / 300);
      g.strokeStyle = '#2b2118'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - S * 9); g.stroke();
      g.fillStyle = C.red; g.beginPath(); g.moveTo(cx, cy - S * 9); g.quadraticCurveTo(cx + S * 3, cy - S * (8.5 + wave * .4), cx + S * 6, cy - S * 7.8); g.lineTo(cx, cy - S * 6.4); g.fill();
      D.text(g, String(hi + 1), cx + S * 2.4, cy - S * 7.7, {size: Math.max(9, S * 1.8), color: '#fff3d6', font: 'deco', weight: 400});
      // other players' resting balls? (only current player's ball is in play)
      let bx = Z.ball[0], by = Z.ball[1], hidden = false;
      if (show) {
        const fr = show.r.frames, k = Math.min(fr.length - 1, Math.floor(pb.t / (DT * 2)));
        bx = fr[k][0]; by = fr[k][1];
        // trail
        g.save(); g.lineCap = 'round';
        for (let i = Math.max(1, k - 30); i <= k; i++) { if (fr[i][2]) continue; const [x1, y1] = T(fr[i - 1][0], fr[i - 1][1]), [x2, y2] = T(fr[i][0], fr[i][1]); g.strokeStyle = `rgba(255,250,235,${.5 * (1 - (k - i) / 30)})`; g.lineWidth = BR * S * 1.4 * (1 - (k - i) / 30); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
        g.restore();
        while (show.ei < show.r.ev.length && show.r.ev[show.ei][0] <= k * 2 + 1) fireEv(show.r.ev[show.ei++], bx, by);
        if (pb.t >= show.r.steps * DT && !show.done) { show.done = true; atRest(); }
        if (show.done && (show.note === 'cup' || show.note === 'water')) hidden = true;
      }
      if (!hidden) {
        const [x, y] = T(bx, by);
        if (!show && myTurn()) drawAim(g, x, y);
        D.disc(g, x, y, BR * S * 1.15, ctx.color(Z.turn), {ring: '#fffaf0'});
      }
      fx.draw(g, T, 1);
      g.restore();
      fx.drawFlash(g, V.W, V.H);
      drawCard(g);
      if (intro > 0 && !st.over) {
        const a = Math.min(1, intro * 2.5), hh = HOLES[st.hole];
        g.globalAlpha = a; g.fillStyle = 'rgba(30,18,8,.6)'; g.fillRect(0, V.H / 2 - 50, V.W, 100);
        D.text(g, `第 ${st.hole + 1} 洞 · ${hh.name}`, V.W / 2, V.H / 2 - 12, {size: 30, color: '#ffe9b8', font: 'deco', weight: 400});
        D.text(g, `标准杆 ${hh.par}`, V.W / 2, V.H / 2 + 24, {size: 16, color: '#f3e2c0', font: 'serif'});
        g.globalAlpha = 1;
      }
    }
    function drawAim(g, x, y) {
      const S = V.s, sdx = V.port ? aim.dy : aim.dx, sdy = V.port ? -aim.dx : aim.dy;
      const L = (10 + aim.p * 40) * S;
      const pts = []; for (let i = 0; i <= 12; i++) pts.push([x + sdx * L * i / 12, y + sdy * L * i / 12]);
      K.guide(g, pts, {color: '#fffaf0', w: 3, alpha: .95, fade: .7, dash: [5, 7]});
      // putter
      const px = x - sdx * (BR * S * 2 + aim.p * S * 6), py = y - sdy * (BR * S * 2 + aim.p * S * 6);
      g.strokeStyle = '#2b2118'; g.lineWidth = S * 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - sdy * S * 2.4, py + sdx * S * 2.4); g.lineTo(px + sdy * S * 2.4, py - sdx * S * 2.4); g.stroke();
      g.strokeStyle = C.gold; g.lineWidth = S * .5; g.stroke();
      if (sling.on || performance.now() - keyT < 1500) K.meter(g, V.W - (V.cardW || 0) - 30, (V.cardH || 0) + 40, 14, Math.min(160, V.H * .35), aim.p, {});
      if (Z.hole === 0 && Z.strokes === 0 && !sling.on && performance.now() - keyT > 3000) D.text(g, '按住画面向后拉，松手击球', V.port ? V.W / 2 : (V.W - V.cardW) / 2, V.H - 22, {size: 15, color: '#2b2118', font: 'serif', weight: 700, stroke: 'rgba(255,250,235,.8)', strokeW: 4});
    }
    function fireEv(e, x, y) {
      if (e[1] === 'wall') { ctx.sfx('bounce'); fx.burst(x, y, {n: 5, sp: 20, color: '#f3e2c0', life: .3, size: 2}); }
      else if (e[1] === 'bump') { ctx.sfx('hit'); fx.shake(4); fx.burst(x, y, {n: 10, sp: 40, color: ['#fff', '#e6c57d'], life: .4, kind: 'spark'}); }
      else if (e[1] === 'tun') { ctx.sfx('whoosh'); fx.burst(x, y, {n: 14, sp: 25, color: '120,110,100', kind: 'smoke', life: .7, size: 5}); }
      else if (e[1] === 'lip') ctx.sfx('tick');
    }
    function atRest() {
      const h = HOLES[show.snap.hole], n = show.note, [cx, cy] = h.cup;
      if (n === 'cup') {
        const d = show.sc - show.par, name = show.sc === 1 ? '一杆进洞！' : d <= -2 ? '老鹰！' : d === -1 ? '小鸟！' : d === 0 ? '标准杆' : d === 1 ? '柏忌' : '+' + d;
        ctx.sfx(show.sc === 1 || d < 0 ? 'win' : 'score'); fx.flashOn(show.sc === 1 ? 1 : .5);
        fx.burst(cx, cy, {n: show.sc === 1 ? 60 : 28, sp: 60, color: ['#ffe28a', '#d0533f', '#fff6dd', '#5aa08a'], life: 1.1, g: 30});
        if (show.sc === 1 || d < 0) fx.shake(8);
        fx.text(cx, cy - 4, name, {size: show.sc === 1 ? 34 : 26, life: 1.8});
      } else if (n === 'water') {
        const fr = show.r.frames, [wx, wy] = fr[fr.length - 1];
        ctx.sfx('splash'); fx.burst(wx, wy, {n: 20, sp: 30, color: ['#cfe8f0', '#ffffff', '#4a8fb0'], life: .7, g: 20, a0: -Math.PI / 2, spread: 2});
        fx.text(wx, wy - 3, '落水 +1', {size: 22});
      } else if (n === 'cap') fx.text(show.r.x, show.r.y - 3, '已达 ' + CAP + ' 杆', {size: 20});
    }
    function drawCard(g) {
      const n = ctx.n, NH = st.NH;
      if (V.port) {
        const cw = Math.min(30, (V.W - 100) / (NH + 1)), nw = V.W - cw * (NH + 1) - 12, x0 = 6, y0 = 4, rh = 22;
        g.save(); g.globalAlpha = .95; D.paper(g, x0, y0, V.W - 12, V.cardH - 8, {r: 8}); g.restore();
        D.text(g, '洞', x0 + 14, y0 + 11, {size: 11, color: C.red, weight: 800});
        for (let i = 0; i < NH; i++) D.text(g, String(i + 1), x0 + nw + cw * i + cw / 2, y0 + 11, {size: 11, color: i === Z.hole ? C.red : C.ink2, weight: i === Z.hole ? 800 : 500});
        D.text(g, '总', x0 + nw + cw * NH + cw / 2, y0 + 11, {size: 11, color: C.ink, weight: 800});
        for (let p = 0; p < n; p++) row(g, p, x0, y0 + 22 + rh * p, nw, cw, rh, 13);
        return;
      }
      const x0 = V.W - V.cardW + 4, w = V.cardW - 10, rh = 26;
      const nw = w * .42, cw = (w - nw) / 3;
      const hR = 26 + 22 * (NH + 1) + 10;
      g.save(); g.globalAlpha = .95; D.paper(g, x0, 8, w, Math.min(V.H - 16, hR + (n + 1) * 22 + 20), {r: 10}); g.restore();
      K.seal(g, x0 + w - 18, 26, 26, '计杆');
      D.text(g, '记分卡', x0 + 14, 26, {size: 16, color: C.ink, font: 'deco', weight: 400, align: 'left'});
      // hole list with par and current player's score columns (up to 4 players → compact)
      const colW = Math.min(30, (w - 92) / n);
      let y = 50;
      D.text(g, '洞', x0 + 16, y, {size: 11, color: C.ink2}); D.text(g, '标准', x0 + 48, y, {size: 11, color: C.ink2});
      for (let p = 0; p < n; p++) { g.fillStyle = ctx.color(p); D.circle(g, x0 + 84 + colW * p + colW / 2, y, 5); g.fill(); }
      for (let i = 0; i < NH; i++) {
        y = 50 + 21 * (i + 1);
        if (i === Z.hole && !st.over) { g.fillStyle = 'rgba(178,58,43,.13)'; g.fillRect(x0 + 4, y - 10, w - 8, 20); }
        D.text(g, String(i + 1), x0 + 16, y, {size: 12, color: C.ink, weight: 700});
        D.text(g, HOLES[i].name, x0 + 28, y, {size: 10, color: C.ink2, align: 'left', maxW: 32});
        D.text(g, String(HOLES[i].par), x0 + 70, y, {size: 12, color: C.ink2});
        for (let p = 0; p < n; p++) { const v = Z.card[p][i]; if (v != null) { const d = v - HOLES[i].par; D.text(g, String(v), x0 + 84 + colW * p + colW / 2, y, {size: 13, color: d < 0 ? C.red : d === 0 ? C.ink : '#2f5d8a', weight: 800}); if (v === 1) { g.strokeStyle = C.red; g.lineWidth = 1.2; D.circle(g, x0 + 84 + colW * p + colW / 2, y, 8); g.stroke(); } } }
      }
      y = 50 + 21 * (NH + 1) + 4;
      g.strokeStyle = 'rgba(90,60,30,.4)'; g.beginPath(); g.moveTo(x0 + 6, y - 12); g.lineTo(x0 + w - 6, y - 12); g.stroke();
      D.text(g, '合计', x0 + 30, y, {size: 12, color: C.ink, weight: 800});
      D.text(g, String(HOLES.slice(0, NH).reduce((a, h) => a + h.par, 0)), x0 + 70, y, {size: 12, color: C.ink2});
      for (let p = 0; p < n; p++) D.text(g, String(Z.card[p].reduce((a, b) => a + b, 0)), x0 + 84 + colW * p + colW / 2, y, {size: 14, color: C.red, weight: 800});
      // current shot info
      if (!st.over) {
        y += 30; const t = Z.turn;
        g.fillStyle = ctx.color(t); D.circle(g, x0 + 16, y, 6); g.fill();
        D.text(g, `${ctx.name(t)} · 本洞 ${Z.strokes} 杆`, x0 + 28, y, {size: 13, color: C.ink, align: 'left', maxW: w - 34});
      }
    }
    function row(g, p, x0, y, nw, cw, rh, fs) {
      const yy = y + rh / 2;
      if (p === Z.turn && !st.over) { g.fillStyle = 'rgba(178,58,43,.13)'; g.fillRect(x0 + 2, y, V.W - 16, rh); }
      g.fillStyle = ctx.color(p); D.circle(g, x0 + 12, yy, 5); g.fill();
      D.text(g, ctx.name(p) + (p === Z.turn && !st.over ? ` (${Z.strokes})` : ''), x0 + 21, yy, {size: fs - 1, color: C.ink, align: 'left', maxW: nw - 24});
      for (let i = 0; i < st.NH; i++) { const v = Z.card[p][i]; if (v != null) { const d = v - HOLES[i].par; D.text(g, String(v), x0 + nw + cw * i + cw / 2, yy, {size: fs, color: d < 0 ? C.red : d === 0 ? C.ink : '#2f5d8a', weight: 800}); } }
      D.text(g, String(Z.card[p].reduce((a, b) => a + b, 0)), x0 + nw + cw * st.NH + cw / 2, yy, {size: fs + 1, color: C.red, weight: 800});
    }
    intro = 1;
    status();
    return inst;
  },
});
