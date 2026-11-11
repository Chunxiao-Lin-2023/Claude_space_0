/* 保龄球 — classic 10-pin, 10 frames. Perspective lane, deterministic ball + pin simulation inside apply. */
const D = BX.draw, C = BX.C, K = BX.data.pk;
const LANE_HW = .525, GUT = .65, HEAD = 18.29, PIT = 19.35, KICK = .8;
const BR = .109, PR = .061, PIN_H = .38, MB = 7, MP = 1.55, DT = 1 / 200, MAXSTEP = 1800;
const VMIN = 5.5, VMAX = 10, HOOK = 1.9, OIL = 11.5;
const SPOT = (() => { const s = [], row = .2639, sp = .3048; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) s.push([(i - r / 2) * sp, HEAD + r * row]); return s; })();
// pin numbering 1..10 standard: row0: 1; row1: 2,3; row2: 4,5,6; row3: 7..10 (left to right from bowler's view)

/* deterministic roll. pins: [[x,y]|null]*10; shot {x, dx, dy, v, h}. */
function simulate(pins, shot, rec, soft) {   // soft = 辅助模式 pin friction (pins slide further)
  const P = [];
  for (let i = 0; i < 10; i++) if (pins[i]) P.push({i, x: pins[i][0], y: pins[i][1], vx: 0, vy: 0, down: 0, gone: 0, fx: 0, fy: 1, mv: 0});
  const b = {x: shot.x, y: 0, vx: shot.dx * shot.v, vy: shot.dy * shot.v, gut: 0, gone: 0};
  const frames = rec ? [] : null, ev = [];
  let tPins = -1, step;
  const snap = () => { const f = [b.x, b.y]; for (let k = 0; k < 10; k++) f.push(99, 99, 0); for (const p of P) { const o = 2 + p.i * 3; f[o] = p.gone ? 99 : p.x; f[o + 1] = p.gone ? 99 : p.y; f[o + 2] = p.down; } frames.push(f); };
  if (rec) snap();
  for (step = 1; step <= MAXSTEP; step++) {
    // ball
    if (!b.gone) {
      if (!b.gut) {
        if (b.y > OIL && b.y < HEAD - .1) { const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy); b.vx += shot.h * HOOK * DT * (b.y - OIL < 2 ? (b.y - OIL) / 2 : 1); const s2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy); b.vx *= sp / s2; b.vy *= sp / s2; }
        if (b.x > LANE_HW || b.x < -LANE_HW) { b.gut = b.x > 0 ? 1 : -1; b.vx = 0; b.x = b.gut * (LANE_HW + .1); ev.push([step, 'gutter']); }
      }
      const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy); if (sp > 0) { const k = Math.max(0, 1 - .12 * DT / sp); b.vx *= k; b.vy *= k; }
      b.x += b.vx * DT; b.y += b.vy * DT;
      if (b.y > PIT || b.vy < .05) b.gone = 1;
      if (b.y > HEAD - .4 && tPins < 0) tPins = step * DT;
      if (b.y >= HEAD - BR && Math.abs(b.x) > KICK - BR) { b.x = (b.x > 0 ? 1 : -1) * (KICK - BR); b.vx = -b.vx * .4; }
    }
    // pins
    let moving = b.gone ? 0 : 1;
    for (const p of P) {
      if (p.gone || !p.mv) continue;
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy), dec = (soft ? (p.down ? 1.9 : 4.2) : (p.down ? 2.4 : 6)) * DT;   // assist: pins slide further → livelier scatter; classic: original friction
      if (sp <= dec) { p.vx = 0; p.vy = 0; p.mv = 0; continue; }
      p.vx -= p.vx / sp * dec; p.vy -= p.vy / sp * dec; p.x += p.vx * DT; p.y += p.vy * DT; moving++;
      if (Math.abs(p.x) > KICK - PR) { p.x = (p.x > 0 ? 1 : -1) * (KICK - PR); p.vx = -p.vx * .55; if (!p.down) { p.down = 1; } }
      if (Math.abs(p.x) > LANE_HW && !p.down) p.down = 1;
      if (p.y > PIT) { p.gone = 1; p.down = 1; }
      if (p.y < HEAD - 1.2) { p.gone = 1; p.down = 1; }
    }
    // ball-pin
    if (!b.gone && !b.gut) for (const p of P) {
      if (p.gone) continue;
      const dx = p.x - b.x, dy = p.y - b.y, d2 = dx * dx + dy * dy, md = BR + PR;
      if (d2 >= md * md || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, rv = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
      const ov = md - d; b.x -= nx * ov * MP / (MB + MP); b.y -= ny * ov * MP / (MB + MP); p.x += nx * ov * MB / (MB + MP); p.y += ny * ov * MB / (MB + MP);
      if (rv > 0) {
        const j = 1.75 * rv / (1 / MB + 1 / MP);
        b.vx -= j / MB * nx; b.vy -= j / MB * ny; p.vx += j / MP * nx; p.vy += j / MP * ny; p.mv = 1;
        if (!p.down && rv > .3) { p.down = 1; p.fx = nx; p.fy = ny; }
        ev.push([step, 'ball', Math.round(rv * 10) / 10]);
      }
    }
    // pin-pin
    for (let a = 0; a < P.length; a++) {
      const p = P[a]; if (p.gone) continue;
      for (let c = a + 1; c < P.length; c++) {
        const q = P[c]; if (q.gone || (!p.mv && !q.mv)) continue;
        // a falling pin reaches further (its length), standing pins collide at base radius
        const reach = (p.down ? .17 : PR) + (q.down ? .17 : PR);
        const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 >= reach * reach || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, rv = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
        if (rv <= 0) continue;
        const j = 1.6 * rv / 2;
        p.vx -= j * nx; p.vy -= j * ny; q.vx += j * nx; q.vy += j * ny; p.mv = 1; q.mv = 1;
        if (!q.down && rv > .25) { q.down = 1; q.fx = nx; q.fy = ny; }
        if (!p.down && rv > .6) { p.down = 1; p.fx = -nx; p.fy = -ny; }
        ev.push([step, 'pin', Math.round(rv * 10) / 10]);
      }
    }
    if (rec && (step & 1) === 0) snap();
    if (!moving && b.gone) break;
  }
  if (rec) snap();
  const left = new Array(10).fill(null);
  for (const p of P) if (!p.down && !p.gone) left[p.i] = [Math.round(p.x * 1e4) / 1e4, Math.round(p.y * 1e4) / 1e4];
  const fall = {}; for (const p of P) if (p.down) fall[p.i] = [p.fx, p.fy];
  return {left, frames, ev, steps: step, tPins: tPins < 0 ? step * DT : tPins, gutter: !!b.gut, fall};
}
const nUp = pins => pins.reduce((a, p) => a + (p ? 1 : 0), 0);
/* standard scoring → {frames:[{marks:[..], score|null}], total} */
function scoreCard(rolls) {
  const fr = []; let i = 0, tot = 0;
  for (let f = 0; f < 10; f++) {
    const r1 = rolls[i], r2 = rolls[i + 1], r3 = rolls[i + 2];
    if (r1 == null) { fr.push({marks: [], score: null}); continue; }
    if (f < 9) {
      if (r1 === 10) { const ok = r2 != null && r3 != null; if (ok) tot += 10 + r2 + r3; fr.push({marks: ['', 'X'], score: ok ? tot : null}); i += 1; }
      else if (r2 == null) { fr.push({marks: [m(r1)], score: null}); i += 1; }
      else if (r1 + r2 === 10) { const ok = r3 != null; if (ok) tot += 10 + r3; fr.push({marks: [m(r1), '/'], score: ok ? tot : null}); i += 2; }
      else { tot += r1 + r2; fr.push({marks: [m(r1), m(r2)], score: tot}); i += 2; }
    } else {
      const mk = [r1 === 10 ? 'X' : m(r1)];
      if (r2 != null) mk.push(r1 === 10 ? (r2 === 10 ? 'X' : m(r2)) : (r1 + r2 === 10 ? '/' : m(r2)));
      if (r3 != null) mk.push((r1 === 10 && r2 !== 10) ? (r2 + r3 === 10 ? '/' : m(r3)) : (r3 === 10 ? 'X' : m(r3)));
      const done = r2 != null && (r1 + r2 < 10 ? true : r3 != null);
      if (done) tot += r1 + r2 + (r3 || 0);
      fr.push({marks: mk, score: done ? tot : null}); i += 3;
    }
  }
  return {frames: fr, total: tot};
  function m(v) { return v === 0 ? '-' : String(v); }
}
/* running total even if incomplete (for status) */
function partial(rolls) { const c = scoreCard(rolls); let last = 0; for (const f of c.frames) if (f.score != null) last = f.score; return last; }

BX.register({
  id: 'bowling', title: '保龄球', cat: 'physics', order: 5, sub: '十瓶十局，全中补中',
  desc: '标准十瓶保龄球：选站位、瞄准、决定力度和弧线，一球击倒全部球瓶就是“全中”。十局计分，全中与补中有奖励分。',
  kind: 'turn', seats: [1, 4], defSeats: 2, seatColors: ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b'], aiDelay: 500,
  howto: ['<b>向上划</b>出球：松手前最后一瞬划得越快球速越快，划的方向就是出球方向；划到最后<b>往左/右拐</b>就会打出向左/右的弧线球（拐得越多弧线越强）。', '也可以<b>按住向下拉</b>（弹弓式）再松手；下方按钮可微调站位（第几板）、方向、弧线和球速，再点「出球」。', '左上角的瓶位图显示剩余球瓶；虚线只画到球道中段，弧线怎么拐要靠自己判断。开启辅助模式后：虚线画到球瓶、瓶位图上标出本球预计到达的位置，淡色点和淡色线是你上一球。', '球滚动时点一下画面可快进；💡 提示给出建议的打法。键盘：←→ 方向、↑↓ 球速、A/D 站位、Q/E 弧线、空格出球。'],
  rules: `<p>标准<b>十瓶保龄球</b>，每人打 <b>10 局</b>（frame），多名玩家按局轮流上场。</p>
<p><b>每局</b>最多投 2 球：第一球击倒全部 10 个球瓶为<b>全中</b>（X），本局结束；两球合计击倒全部为<b>补中</b>（/）；否则记击倒的瓶数。</p>
<p><b>计分：</b>全中 = 10 分 + 之后两球的瓶数；补中 = 10 分 + 下一球的瓶数；其他局 = 两球瓶数之和。第 10 局打出全中可再投 2 球、补中可再投 1 球（奖励球只用于计分）。满分 300 分（12 个全中）。</p>
<p>球掉进两侧<b>球沟</b>就无法击倒球瓶（记 0，显示“-”）。全部打完后总分最高者胜。单人练习会记录最高分。</p>
<p><b>操作：</b>在画面上<b>向上划</b>即可出球（划得越快越有力，划的末段往哪边拐就打哪边的弧线）。也可以先用下方按钮选择<b>站位</b>（在犯规线上的左右位置）和<b>弧线</b>（球在球道后段向左/右弯）。然后在画面上按住并<b>向后（向下）拉</b>，左右偏一点调整方向，拉得越长球速越快，松手出球。最佳击球点在 1 号瓶和 3 号瓶之间（右侧袋口）或 1、2 号之间（左侧袋口）。键盘：←→ 方向、↑↓ 球速、A/D 站位、空格出球。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a190d'); gr.addColorStop(1, '#5a3a20'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d9b27a'; g.beginPath(); g.moveTo(w * .42, h * .12); g.lineTo(w * .58, h * .12); g.lineTo(w * .95, h); g.lineTo(w * .05, h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,70,30,.35)'; g.lineWidth = 1; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(w * (.42 + .16 * i / 8), h * .12); g.lineTo(w * (.05 + .9 * i / 8), h); g.stroke(); }
    const pins = [[.5, .24], [.46, .2], [.54, .2], [.42, .16], [.5, .16], [.58, .16]];
    for (const [x, y] of pins.reverse()) drawPin(g, w * x, h * y + 10, 28, false);
    D.disc(g, w * .52, h * .74, h * .14, '#c23a2b', {ring: false});
    g.fillStyle = '#1b1510'; for (const [dx, dy] of [[-.03, -.05], [.03, -.06], [0, .01]]) { D.circle(g, w * .52 + dx * w, h * .74 + dy * h, 3); g.fill(); }
  },
  create(ctx) {
    K.css();
    const st = {n: ctx.n, frame: 0, turn: 0, ball: 0, pins: rack(), rolls: BX.range(ctx.n).map(() => []), over: false, last: null};
    function rack() { return SPOT.map(([x, y]) => [Math.round((x + (ctx.rng() - .5) * .006) * 1e4) / 1e4, Math.round((y + (ctx.rng() - .5) * .006) * 1e4) / 1e4]); }
    const cv = ctx.canvas(), pb = K.playback(ctx), fx = K.fx(), cache = K.cache();
    const aims = BX.range(ctx.n).map(() => ({x: .18, ang: 0, p: .55, h: -.5})), lastBall = {};
    let show = null, Z = st, aim = aims[0], keyT = 0, cam = {y: -3.2, tgt: -3.2}, hintA = null, hintT = 0, aiPick = null, entryX = null;
    const skipKey = K.skip(ctx, cv, pb);
    const ui = ctx.ui(''); const bar = BX.h('div', {class: 'pk-bar'}); ui.append(bar);
    const board = x => Math.round((LANE_HW - x) / (2 * LANE_HW) * 39 + .5);
    const adjX = K.adj(bar, '站位', () => '第' + board(aim.x) + '板', (d, k) => { d *= K.acc(k); aim.x = BX.clamp(Math.round((aim.x + d * .0269) * 1e4) / 1e4, -.42, .42); keyT = performance.now(); }, {minus: '◀', plus: '▶'});
    const adjA = K.adj(bar, '方向', () => { const a = Math.round(Math.atan(aim.ang) * 1800 / Math.PI) / 10; return (a < 0 ? '↖' : a > 0 ? '↗' : '↑') + Math.abs(a).toFixed(1) + '°'; }, (d, k) => { d *= K.acc(k); aim.ang = BX.clamp(Math.round((aim.ang + d * .0015) * 1e4) / 1e4, -.06, .06); keyT = performance.now(); }, {minus: '◀', plus: '▶'});
    const hookSeg = K.seg(bar, '弧线', [[-1, '↰强'], [-.5, '↰'], [0, '直'], [.5, '↱'], [1, '↱强']], () => Math.round(aim.h * 2) / 2, v => aim.h = v);
    const kmh = p => Math.round((VMIN + p * (VMAX - VMIN)) * 3.6);
    const adjP = K.adj(bar, '球速', () => kmh(aim.p) + '<small>公里/时</small>', (d, k) => { aim.p = BX.clamp(Math.round((aim.p + d * .02 * K.acc(k)) * 100) / 100, 0, 1); keyT = performance.now(); });
    K.go(bar, '出球', () => roll());
    /* ---------- projection ---------- */
    function layout() {
      const W = cv.w, H = cv.h, port = H > W;
      const cardH = cardHeight(W, port), barH = K.barH(bar);
      const top = cardH, bot = H - barH;
      const zN = 2.2, hc = 1.25;
      const F = Math.min(W * 1.5 / 1.7 * zN, (bot - top - 26) * zN / hc);
      const hy = bot - hc * F / zN;
      return {W, H, port, top, bot, F, hy, hc, cardH, cx: W / 2};
    }
    function cardHeight(W, port) { return 8 + ctx.n * rowH(); }
    function rowH() { return cv.h < 500 ? (ctx.n <= 2 ? 30 : 24) : ctx.n <= 2 ? 44 : 30; }
    let V = layout();
    const P3 = (x, y, z = 0) => { const d = Math.max(.25, y - cam.y); return [V.cx + x * V.F / d, V.hy + (V.hc - z) * V.F / d, V.F / d]; };
    /* ---------- input ---------- */
    const myTurn = () => !st.over && !pb.on && ctx.canAct(st.turn);
    /* two gestures: pull DOWN and release (slingshot)  or  swipe UP. The swipe uses every coalesced sample:
       speed + final heading from a least-squares fit over the last ~80 ms, aim from the body of the swipe, hook = how much
       the final heading turns away from the body (soft dead zone so a straight swipe is straight). */
    let path = [], pathId = null, swipeMsg = -1e9;
    ctx.on(cv.cv, 'pointerdown', e => { if (myTurn() && pathId == null) { const p = cv.pos(e); path = [{x: p.x, y: p.y, t: e.timeStamp}]; pathId = e.pointerId; } });
    ctx.on(cv.cv, 'pointermove', e => { if (pathId === e.pointerId && path.length) { for (const q of ctx.points(e, cv.cv)) path.push(q); const t = path[path.length - 1].t; while (path.length > 3 && t - path[1].t > 1500) path.shift(); } });
    const endPath = e => { if (e.pointerId === pathId) pathId = null; };
    ctx.on(cv.cv, 'pointerup', endPath); ctx.on(cv.cv, 'pointercancel', endPath);
    const isSwipe = s => s.y < s.y0 - 12;
    let aimSave = null;
    const sling = K.sling(ctx, cv, {
      enabled: myTurn, max: () => Math.min(cv.w, cv.h) * .38,
      engage: () => { aimSave = Object.assign({}, aim); },
      cancel: () => { if (aimSave) Object.assign(aim, aimSave); aimSave = null; },
      change: s => { if (isSwipe(s)) return; const fwd = Math.max(.25, -s.dy); aim.ang = BX.clamp(s.dx / fwd * .05, -.06, .06); aim.p = s.p; },
      release: s => { if (isSwipe(s)) swipe(s); else roll(); },
    });
    function fitVel(P, w) {   // least-squares velocity (px/ms) over the samples of the last w ms
      const tEnd = P[P.length - 1].t; let i0 = P.length - 1; while (i0 > 0 && tEnd - P[i0 - 1].t <= w) i0--;
      const S = P.slice(i0); if (S.length < 2) return null;
      let tm = 0, xm = 0, ym = 0; for (const q of S) { tm += q.t; xm += q.x; ym += q.y; } tm /= S.length; xm /= S.length; ym /= S.length;
      let stt = 0, stx = 0, sty = 0; for (const q of S) { const dt2 = q.t - tm; stt += dt2 * dt2; stx += dt2 * (q.x - xm); sty += dt2 * (q.y - ym); }
      if (stt < 1) return null;
      return {vx: stx / stt, vy: sty / stt, i0};
    }
    function swipe(s) {
      const P = path.length ? path : [{x: s.x0, y: s.y0, t: 0}, {x: s.x, y: s.y, t: 100}];
      let fv = null; for (const w of [80, 110, 150, 220]) { fv = fitVel(P, w); if (fv && P.length - fv.i0 >= 3) break; }
      const A = P[0], B = P[P.length - 1];
      const v = fv ? Math.hypot(fv.vx, fv.vy) : 0;
      if (!fv || A.y - B.y < 30 || v < .3 || fv.vy > -.1) { swipeMsg = performance.now(); ctx.buzz(15); return; }
      // body of the swipe: start → where the final 80 ms window begins (or the whole swipe if that part is short)
      let M = P[fv.i0]; if (Math.hypot(M.x - A.x, M.y - A.y) < 24) M = B;
      const bl = Math.hypot(M.x - A.x, M.y - A.y) || 1, bx = (M.x - A.x) / bl, by = (M.y - A.y) / bl;
      const ex = fv.vx / v, ey = fv.vy / v;
      let th = Math.atan2(bx, -by); th = Math.sign(th) * Math.max(0, Math.abs(th) - .015);   // ±0.9° soft dead zone
      aim.ang = BX.clamp(Math.round(Math.tan(th) * .12 * 1e4) / 1e4, -.06, .06);
      const turn = Math.atan2(bx * ey - by * ex, bx * ex + by * ey);
      aim.h = BX.clamp(Math.round(Math.sign(turn) * Math.max(0, Math.abs(turn) - .1) / .45 * 20) / 20, -1, 1);
      aim.p = BX.clamp(Math.round(Math.pow(BX.clamp((v - .55) / 2.6, 0, 1), .9) * 100) / 100, 0, 1);
      hookSeg.refresh(); roll();
    }
    function shotOf(a) { const dy = 1 / Math.sqrt(1 + a.ang * a.ang); return {x: +a.x.toFixed(4), dx: +(a.ang * dy).toFixed(6), dy: +dy.toFixed(6), v: +(VMIN + a.p * (VMAX - VMIN)).toFixed(4), h: a.h}; }
    function roll() { if (!myTurn()) return; K.impact('thud', .2 + .3 * aim.p); ctx.buzz(10); ctx.act(shotOf(aim), st.turn); }
    function key(e) {
      if (skipKey(e)) return;
      if (!myTurn()) return;
      if (e.code === 'Escape' && sling.on) { sling.abort(); return; }
      const m = /^Arrow/.test(e.code) ? Math.min(3, K.keyMul(e)) : 1;
      if (e.code === 'KeyQ' || e.code === 'KeyE') { aim.h = BX.clamp(aim.h + (e.code === 'KeyE' ? .5 : -.5), -1, 1); hookSeg.refresh(); }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { aim.ang = BX.clamp(Math.round((aim.ang + (e.code === 'ArrowRight' ? .0015 : -.0015) * m) * 1e4) / 1e4, -.06, .06); keyT = performance.now(); }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { aim.p = BX.clamp(Math.round((aim.p + (e.code === 'ArrowUp' ? .02 : -.02) * m) * 100) / 100, 0, 1); keyT = performance.now(); }
      if (e.code === 'KeyA' || e.code === 'KeyD') aim.x = BX.clamp(aim.x + (e.code === 'KeyD' ? .0269 : -.0269), -.42, .42);
      if (e.code === 'Space' || e.code === 'Enter') roll();
    }
    /* ---------- rules ---------- */
    function status() {
      for (let i = 0; i < ctx.n; i++) ctx.info(i, partial(st.rolls[i]) + ' 分');
      if (st.over) return ctx.status('比赛结束');
      if (pb.on) return ctx.status(ctx.name(Z.turn) + ' 出球…');
      const who = ctx.canAct(st.turn) ? (ctx.hotseat || ctx.n === 1 ? ctx.name(st.turn) + ' ' : '轮到你 ') : ctx.name(st.turn) + ' ';
      ctx.status(`第 ${st.frame + 1} 局 · ${who}第 ${st.ball + 1} 球 · 剩 ${nUp(st.pins)} 瓶`);
    }
    const inst = {
      st,
      toMove: () => st.over || (pb.on && !ctx.isRemote(st.turn)) ? null : st.turn,   // remote seats may act during our local playback (avoids host rejecting a guest that finished playback first)
      valid: a => a && isFinite(a.x) && isFinite(a.dx) && isFinite(a.dy) && isFinite(a.v),
      apply(a, by) {
        const who = st.turn;
        let dx = +a.dx || 0, dy = +a.dy || 1; const l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
        if (dy < .99) { dy = .99; dx = (dx < 0 ? -1 : 1) * Math.sqrt(1 - dy * dy); }
        const shot = {x: Math.max(-.45, Math.min(.45, +a.x || 0)), dx, dy, v: Math.max(VMIN, Math.min(VMAX, +a.v || VMIN)), h: Math.max(-1, Math.min(1, +a.h || 0))};
        const snap = {frame: st.frame, turn: who, ball: st.ball, pins: st.pins.slice(), rolls: st.rolls.map(r => r.slice())};
        const before = nUp(st.pins), r = simulate(st.pins, shot, !ctx.fast, ctx.assist);
        const after = nUp(r.left), knocked = before - after;
        st.rolls[who].push(knocked);
        st.pins = r.left;
        const R = st.rolls[who];
        // frame progression
        let done = false, fresh = false, label = '';
        if (st.frame < 9) {
          if (st.ball === 0 && knocked === 10) { done = true; label = '全中！'; }
          else if (st.ball === 1) { done = true; if (after === 0) label = '补中！'; }
          else st.ball = 1;
        } else {
          const n10 = st.ball;   // 0,1,2
          const r1 = R[R.length - 1 - n10];
          if (n10 === 0) { st.ball = 1; if (knocked === 10) { fresh = true; label = '全中！'; } }
          else if (n10 === 1) {
            const r2 = knocked;
            if (r1 === 10 || r1 + r2 === 10) { st.ball = 2; if (r1 === 10 && r2 === 10) { fresh = true; label = '全中！'; } else if (r1 === 10) { /* keep standing */ if (after === 0) { fresh = true; label = '全中！'; } } else { fresh = true; label = '补中！'; } }
            else done = true;
          } else { done = true; if (knocked === 10 && before === 10) label = '全中！'; else if (after === 0) label = '补中！'; }
        }
        if (!label) label = r.gutter && knocked === 0 ? '洗沟' : knocked === 0 ? '未中' : knocked + ' 瓶';
        if (fresh) st.pins = rack();
        if (done) {
          st.ball = 0; st.pins = rack();
          if (who < st.n - 1) st.turn = who + 1; else { st.turn = 0; st.frame++; if (st.frame >= 10) st.over = true; }
        }
        // split: head pin down and the standing pins fall apart into separate groups
        if (!done && !fresh && snap.ball === 0 && !r.left[0] && after >= 2) {
          const up = r.left.map((p, i) => p ? i : -1).filter(i => i >= 0), seen = new Set([up[0]]), q = [up[0]];
          while (q.length) { const a = q.pop(); for (const b of up) if (!seen.has(b) && Math.abs(SPOT[a][0] - SPOT[b][0]) < .32 && Math.abs(SPOT[a][1] - SPOT[b][1]) < .3) { seen.add(b); q.push(b); } }
          if (seen.size < up.length) label = '分瓶 · 剩 ' + after;
        }
        st.last = {who, knocked, label};
        hintA = null;
        if (!ctx.fast) {
          lastBall[who] = {pts: r.frames.filter((f, i) => i % 4 === 0 && f[1] < HEAD + .3).map(f => [f[0], f[1]]), ex: entryOf(shot)};
          show = {r, snap, knocked, label, who, done: false, ei: 0, shot, fd: {}, rmb: 0, hit1: false};
          if (!(ctx.isLocal(who) && !ctx.isAI(who))) K.impact('thud', .2 + .3 * (shot.v - VMIN) / (VMAX - VMIN));
          const simT = r.steps * DT;
          pb.start(simT + 1.3, () => { show = null; status(); }, [[r.tPins - .05, r.tPins + .7, .3]]);
          cam.y = -3.2;
        }
        if (st.over) finish(show ? (r.steps * DT + 2.4) * 1000 : 600);
        status();
      },
      aiMove(seat, level) { return ai(seat, level); },
      onTurn() { status(); if (!pb.on) aim = aims[st.turn]; hookSeg.refresh(); },
      key,
      showHint() { if (aiPick) { hintA = Object.assign({}, aiPick); hintT = performance.now(); } },
      resize() { V = layout(); },
      frame(dt) {
        pb.tick(dt); fx.update(dt * (pb.on ? Math.max(.3, pb.rate) : 1));
        Z = show ? Object.assign({}, st, show.snap, {over: false}) : st; V = layout();
        bar.classList.toggle('hide', !myTurn());
        if (myTurn()) { aim = aims[st.turn]; adjX.refresh(); adjA.refresh(); adjP.refresh(); }
        hookSeg.refresh();
        draw(dt);
      },
    };
    function finish(delay) {
      const tt = BX.range(ctx.n).map(i => scoreCard(st.rolls[i]).total), best = Math.max(...tt), win = BX.range(ctx.n).filter(i => tt[i] === best);
      const xs = i => { let x = 0, sp = 0; for (const f of scoreCard(st.rolls[i]).frames) for (const m of f.marks) { if (m === 'X') x++; else if (m === '/') sp++; } return `（全中 ${x} · 补中 ${sp}）`; };
      let text = BX.range(ctx.n).map(i => `${ctx.name(i)} ${tt[i]} 分${xs(i)}`).join('　');
      if (ctx.n === 1) { const b = ctx.best('score', tt[0], 'max'); ctx.end({win: tt[0] >= 150, title: tt[0] === 300 ? '完美比赛！' : '十局打完', text: `总分 ${tt[0]}${xs(0)}` + (b.isNew ? ' · 新纪录！' : ` · 最高 ${b.best}`), delay}); return; }
      ctx.end({winner: win.length === ctx.n ? -1 : win.length === 1 ? win[0] : win, text, delay});
    }
    /* ---------- AI ---------- */
    function ai(seat, level) {
      const t0 = performance.now(), budget = BX.test ? 25 : 520;
      const up = st.pins.map((p, i) => p ? i : -1).filter(i => i >= 0);
      // target: centroid-ish of standing pins, or the pocket for a full rack
      let best = null, bv = -1;
      const cands = [];
      for (const h of level === 1 ? [0] : [-.5, 0, .5, -1, 1]) for (const x of [-.3, -.2, -.1, 0, .1, .2, .3]) for (let k = -12; k <= 12; k++) for (const p of [.45, .7, .9]) cands.push({x, ang: k * .005, p, h});
      // shuffle deterministic-free (Math.random ok in AI)
      for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
      let n = 0;
      for (const c of cands) {
        if (n > 20 && performance.now() - t0 > budget) break;
        n++;
        // quick reject: ball must reach the pins near the standing ones
        const r = simulate(st.pins, shotOf(c), false, ctx.assist);
        const kn = up.length - nUp(r.left);
        const v = kn + (nUp(r.left) === 0 ? 3 : 0) + Math.random() * .3;
        if (v > bv) { bv = v; best = c; }
      }
      if (!best) best = {x: .15, ang: -.004, p: .7, h: -.5};
      const na = [0, .06, .03, .006][level], nx = [0, .2, .1, .025][level];
      const g2 = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const pick = Object.assign({}, best, {ang: best.ang + g2() * na, x: BX.clamp(best.x + g2() * nx, -.45, .45)});
      aiPick = pick; if (ctx.isAI(seat)) Object.assign(aims[seat], pick);
      return shotOf(pick);
    }
    /* ---------- drawing ---------- */
    function scene(g) {
      const W = V.W;
      // back wall with ink landscape mural above the pins
      const [, wy] = P3(0, PIT + .3, 1.2), [, fy] = P3(0, PIT + .3, 0);
      D.paper(g, 0, 0, W, fy, {color: '#eadcbc'});
      K.mountains(g, 0, wy - (fy - wy) * .6, W, (fy - wy) * 1.7, {seed: 77, layers: 3, top: .05, base: .75, alpha: [.15, .25, .4]});
      K.sky(g, 0, -9999, 0, 0, {sun: false});
      g.fillStyle = 'rgba(196,70,48,.8)'; D.circle(g, W * .78, wy + (fy - wy) * .12, Math.max(6, (fy - wy) * .12)); g.fill();
      // lane surroundings (dark wood)
      g.fillStyle = '#2a190d'; g.fillRect(0, fy, W, V.H - fy);
      // lane polygon
      const quad = (x0, x1, y0, y1, fill) => { const a = P3(x0, y0), b = P3(x1, y0), c = P3(x1, y1), d = P3(x0, y1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fillStyle = fill; g.fill(); };
      const y0 = Math.max(cam.y + .3, -3), y1 = PIT;
      quad(-KICK - .15, KICK + .15, Math.max(y0, HEAD - .5), y1 + .3, '#3a2414');
      quad(-GUT - .05, GUT + .05, y0, y1, '#1e130a');
      // gutters
      const gg = g.createLinearGradient(0, V.hy, 0, V.H); gg.addColorStop(0, '#4a4a48'); gg.addColorStop(1, '#2a2a28');
      quad(-GUT, -LANE_HW, y0, HEAD + .6, gg); quad(LANE_HW, GUT, y0, HEAD + .6, gg);
      // lane boards
      const lg = g.createLinearGradient(0, V.hy, 0, V.H); lg.addColorStop(0, '#c99a62'); lg.addColorStop(1, '#e7c48e');
      quad(-LANE_HW, LANE_HW, y0, HEAD + .85, lg);
      // pin deck (lighter)
      quad(-LANE_HW, LANE_HW, HEAD - .3, HEAD + .85, 'rgba(255,240,210,.25)');
      // pit
      quad(-KICK, KICK, HEAD + .9, PIT + .3, '#0d0805');
      g.strokeStyle = 'rgba(110,60,20,.22)'; g.lineWidth = 1;
      for (let i = 1; i < 39; i++) { const x = -LANE_HW + i * 2 * LANE_HW / 39; const a = P3(x, y0), b = P3(x, HEAD + .85); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      // gloss
      const gl = g.createLinearGradient(V.cx - 60, 0, V.cx + 60, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.5, 'rgba(255,255,255,.12)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      quad(-.25, .25, Math.max(y0, 2), OIL, gl);
      // foul line
      if (y0 < 0) { const a = P3(-GUT, 0), b = P3(GUT, 0); g.strokeStyle = C.red; g.lineWidth = Math.max(2, .02 * V.F / (0 - cam.y)); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      // approach
      if (y0 < 0) quad(-LANE_HW - .3, LANE_HW + .3, y0, 0, '#d9b27a');
      // dots & arrows (targets)
      g.fillStyle = 'rgba(60,30,10,.65)';
      for (let i = -2; i <= 2; i++) { const [x, y, s] = P3(i * .2 + (i === 0 ? 0 : 0), 2.1); if (y < V.H) { D.circle(g, x, y, Math.max(1.2, .015 * s)); g.fill(); } }
      for (let i = -3; i <= 3; i++) { const yy = 4.6 + Math.abs(i) * .3, xx = i * .13; const a = P3(xx, yy + .18), b = P3(xx - .03, yy), c = P3(xx + .03, yy); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fillStyle = 'rgba(178,58,43,.75)'; g.fill(); }
      // masking unit (wood beam with seal)
      const [mx0, my0] = P3(-KICK - .2, PIT + .3, .9), [mx1, my1] = P3(KICK + .2, PIT + .3, .62);
      D.wood(g, mx0, my0, mx1 - mx0, my1 - my0, {seed: 3, base: '#7a3a22', dark: '#3a160a', grain: .3});
      D.text(g, '百戏保龄', (mx0 + mx1) / 2, (my0 + my1) / 2, {size: Math.max(9, (my1 - my0) * .55), color: '#f3d9a0', font: 'deco', weight: 400});
    }
    function draw(dt) {
      const g = cv.g; cv.clear('#1b1108');
      // camera
      let bx = 0, by = 0, pins = Z.pins.map((p, i) => p ? {x: p[0], y: p[1], down: 0, i} : null), ballOn = true;
      if (show) {
        const fr = show.r.frames, L = K.lerpFrame(fr, pb.t / (DT * 2), 90, .3), k = L.k, f = L.f, f0 = fr[k], f1 = fr[Math.min(fr.length - 1, k + 1)];
        bx = f[0]; by = f[1]; ballOn = by < PIT - .1;
        pins = []; for (let i = 0; i < 10; i++) {
          const o = 2 + i * 3; if (f[o] >= 50) continue;
          const down = f0[o + 2];
          if (down && show.fd[i] == null) show.fd[i] = pb.t;
          const sp = f1[o] < 50 ? Math.hypot(f1[o] - f0[o], f1[o + 1] - f0[o + 1]) / (DT * 2) : 0;
          pins.push({x: f[o], y: f[o + 1], down, i, tilt: down ? Math.min(1, (pb.t - show.fd[i]) / .17) : 0, wob: !down && sp > .02 ? Math.min(.22, sp * .25) : 0, wx: f1[o] - f0[o], wy: f1[o + 1] - f0[o + 1]});
        }
        if (ballOn && !show.r.gutter && (show.rmb -= dt) <= 0) { show.rmb = .38; K.impact('rumble', Math.min(1, Math.hypot(f1[0] - f0[0], f1[1] - f0[1]) / (DT * 2) / 10)); }
        cam.tgt = Math.min(by - 3.2, HEAD - 3);
        while (show.ei < show.r.ev.length && show.r.ev[show.ei][0] <= k * 2 + 1) fire(show.r.ev[show.ei++], bx, by);
        if (pb.t >= show.r.steps * DT && !show.done) { show.done = true; atRest(); }
      } else { bx = aims[Z.turn].x; cam.tgt = -3.2; }
      cam.y += (cam.tgt - cam.y) * (1 - Math.exp(-dt * (show ? 7 : 4)));
      const [ox, oy] = fx.off(); g.save(); g.translate(ox, oy);
      scene(g);
      // objects sorted far → near
      const objs = [];
      for (const p of pins) if (p) objs.push({y: p.y, d: () => drawPinAt(g, p)});
      if (ballOn) objs.push({y: by, d: () => drawBall(g, bx, by)});
      if (!show && myTurn()) drawGuide(g);
      objs.sort((a, b) => b.y - a.y); for (const o of objs) o.d();
      fx.draw(g, (x, y) => { const p = P3(x, y, .15); return [p[0], p[1]]; }, 1);
      g.restore();
      fx.drawFlash(g, V.W, V.H);
      drawCard(g);
      drawRack(g, show ? null : Z.pins);
      K.skipLabel(g, V.W / 2, V.bot - 12, pb);
      if (myTurn() && (sling.on || performance.now() - keyT < 1500)) K.meter(g, V.W - 28, V.top + 50, 14, Math.min(150, (V.bot - V.top) * .45), aim.p, {});
      if (myTurn() && sling.on && sling.eng && path.length > 1 && isSwipe(sling)) {
        const t1 = path[path.length - 1].t; g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
        for (let i = 1; i < path.length; i++) { const a2 = path[i - 1], b2 = path[i], age = (t1 - b2.t) / 260; if (age > 1) continue; g.strokeStyle = `rgba(255,236,190,${.75 * (1 - age)})`; g.lineWidth = 3 + 9 * (1 - age); g.beginPath(); g.moveTo(a2.x, a2.y); g.lineTo(b2.x, b2.y); g.stroke(); }
        g.restore();
      } else if (myTurn() && sling.on) K.drawAnchor(g, sling, '#fff6dd');
      if (myTurn() && performance.now() - swipeMsg < 1400) D.text(g, '划得再快、再长一点 ↑', V.W / 2, V.bot - 40, {size: 16, color: '#ffe9b8', weight: 800, stroke: 'rgba(0,0,0,.7)', strokeW: 4});
      if (myTurn() && Z.frame === 0 && Z.ball === 0 && !sling.on && !hintA && performance.now() - keyT > 3000) D.text(g, '向上划出球（末段拐弯＝弧线球），或向下拉后松手', V.W / 2, V.bot - 14, {size: 14, color: '#fff3d6', font: 'serif', stroke: 'rgba(0,0,0,.6)', strokeW: 4});
    }
    function drawPinAt(g, p) {
      const [x, y, sc] = P3(p.x, p.y);
      if (y < V.top - 20 || y > V.H + 40) return;
      let tilt = 0, fx2 = 0, fy2 = 1;
      if (p.down) { tilt = p.tilt != null ? p.tilt : 1; const fl = show && show.r.fall[p.i] ? show.r.fall[p.i] : [0, 1]; fx2 = fl[0]; fy2 = fl[1]; tilt = tilt * tilt * (3 - 2 * tilt); }
      else if (p.wob) { const l = Math.hypot(p.wx, p.wy) || 1; fx2 = p.wx / l; fy2 = p.wy / l; tilt = p.wob; }
      if (!tilt) { drawPin(g, x, y, PIN_H * sc, false); return; }
      // tip the pin over its base along the fall direction (projected), keeping its girth
      const th = tilt * Math.PI / 2 * .96, sn = Math.sin(th), [tx, ty] = P3(p.x + fx2 * PIN_H * sn, p.y + fy2 * PIN_H * sn, PIN_H * Math.cos(th));
      const len = Math.hypot(tx - x, ty - y), ang = Math.atan2(tx - x, -(ty - y));
      if (p.down && tilt > .6) { g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = .1 * sc; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y + 2); g.lineTo(tx, ty + 2); g.stroke(); }
      g.save(); g.translate(x, y); g.rotate(ang); drawPin(g, 0, 0, Math.max(2, len), false, PIN_H * sc * .3 * (1 - .25 * tilt)); g.restore();
    }
    function drawBall(g, x, y) {
      const [sx, sy, s] = P3(x, y, BR), r = BR * s;
      const [shx, shy] = P3(x, y, 0);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(shx, shy, r * 1.05, r * .35, 0, 0, Math.PI * 2); g.fill();
      const col = ctx.color(show ? show.who : Z.turn);
      D.disc(g, sx, sy, r, col, {shadow: false});
      const rot = show ? y * 9 : 0;
      g.fillStyle = 'rgba(20,10,5,.75)'; for (const [a, d] of [[0, .4], [.5, .45], [-.45, .42]]) { const yy = sy - r * .3 + Math.sin(rot + a) * r * .2, xx = sx + d * r * (a - .02) * 1.2; D.circle(g, xx, yy, r * .1); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = r * .1; g.beginPath(); g.arc(sx, sy, r * .7, rot, rot + 2); g.stroke();
    }
    function pathOf(sh) {
      let x = sh.x, y = 0, vx = sh.dx * sh.v, vy = sh.dy * sh.v;
      const pts = [];
      for (let i = 0; i < 400; i++) {
        if (y > OIL && y < HEAD) { const sp = Math.sqrt(vx * vx + vy * vy); vx += sh.h * HOOK * .01 * (y - OIL < 2 ? (y - OIL) / 2 : 1); const s2 = Math.sqrt(vx * vx + vy * vy); vx *= sp / s2; vy *= sp / s2; }
        x += vx * .01; y += vy * .01; pts.push([x, y]);
        if (y > HEAD - .2 || Math.abs(x) > LANE_HW) break;
      }
      return pts;
    }
    function entryOf(sh) { const p = pathOf(sh), e = p[p.length - 1]; return Math.abs(e[0]) > LANE_HW ? null : e[0]; }
    function drawGuide(g) {
      const lb = ctx.assist && lastBall[st.turn];
      if (lb) K.ghost(g, lb.pts.map(q => { const p = P3(q[0], q[1], .01); return [p[0], p[1]]; }), {color: '#fffaf0', alpha: .3, mark: false});
      if (hintA) {
        const hp = pathOf(shotOf(hintA)).filter((_, i) => i % 3 === 0).map(q => { const p = P3(q[0], q[1], .01); return [p[0], p[1]]; });
        K.guide(g, hp, {color: K.HINT, w: 3.5, alpha: K.pulse(hintT), fade: .3, dash: [8, 6]});
        const [hx, hy] = P3(hintA.x, 0, BR); g.strokeStyle = K.HINT; g.lineWidth = 3; D.circle(g, hx, hy, 16 + 2 * Math.sin(performance.now() / 150)); g.stroke();
        D.text(g, `💡 第${board(hintA.x)}板 · ${hintA.h < 0 ? '↰左弧' : hintA.h > 0 ? '↱右弧' : '直球'} · ${kmh(hintA.p)}公里/时`, V.W / 2, V.bot - 34, {size: 13, color: '#bff0d8', weight: 800, stroke: 'rgba(0,0,0,.7)', strokeW: 4});
      }
      const pp = pathOf(shotOf(aim)), e = pp[pp.length - 1]; entryX = Math.abs(e[0]) > LANE_HW ? null : e[0];
      // classic: only the straight part up to the end of the oil (no hook prediction); assist: full path to the pins
      K.guide(g, pp.filter((q, i) => i % 3 === 0 && (ctx.assist || q[1] <= OIL)).map(q => { const p = P3(q[0], q[1], .01); return [p[0], p[1]]; }), {color: '#fffaf0', w: 2.5, alpha: .9, fade: .75, dash: [6, 8]});
    }
    function fire(e, x, y) {
      if (e[1] === 'ball') {
        const kk = Math.min(1, e[2] / 7);
        K.impact('thud', kk); if (!show.hit1) { show.hit1 = true; if (kk > .3) ctx.sfx('crash'); if (e[2] > 2.5) pb.hit(.05); }
        fx.shake(2 + 9 * kk); fx.burst(x, y + .15, {n: 6 + Math.round(14 * kk), sp: 60 + 100 * kk, color: ['#fff', '#ffe28a', '#e6c57d'], life: .5, kind: 'spark'});
      }
      else if (e[1] === 'pin') K.impact('pin', Math.min(1, e[2] / 3.5));
      else if (e[1] === 'gutter') { K.impact('thud', .3); ctx.sfx('roll'); }
    }
    function atRest() {
      const L = show.label, strike = L === '全中！', spare = L === '补中！';
      ctx.sfx(strike || spare ? 'win' : show.knocked ? 'score' : 'buzz');
      if ((strike || spare) && ctx.isLocal(show.who)) ctx.buzz(40);
      if (strike || spare) { fx.flashOn(1); fx.shake(8); for (let i = 0; i < 3; i++) fx.burst((Math.random() - .5) * .8, HEAD + .3, {n: 30, sp: 200, color: ['#ffe28a', '#d0533f', '#fff6dd', '#5aa08a'], life: 1.3, g: 120, a0: -Math.PI / 2, spread: 2.4}); }
      fx.text(0, HEAD - .8, L, {size: strike || spare ? 40 : 28, life: 1.6, rise: 30});
    }
    function drawCard(g) {
      const n = ctx.n, W = V.W, rh = rowH(), big = rh >= 40, x0 = 6, nameW = Math.min(W * .16, 86), totW = big ? 44 : 38;
      const fw = (W - 12 - nameW - totW) / 10;
      g.save(); g.globalAlpha = .96; D.paper(g, x0, 4, W - 12, rh * n, {r: 6}); g.restore();
      for (let p = 0; p < n; p++) {
        const y = 4 + rh * p, R = Z.rolls[p], card = scoreCard(R);
        if (p === Z.turn && !st.over) { g.fillStyle = 'rgba(178,58,43,.12)'; g.fillRect(x0, y, W - 12, rh); }
        g.fillStyle = ctx.color(p); D.circle(g, x0 + 9, y + rh / 2, 4.5); g.fill();
        D.text(g, ctx.name(p), x0 + 17, y + rh / 2, {size: big ? 13 : 11, color: C.ink, align: 'left', maxW: nameW - 20});
        for (let f = 0; f < 10; f++) {
          const fx0 = x0 + nameW + fw * f, fr = card.frames[f];
          g.strokeStyle = 'rgba(90,60,30,.45)'; g.lineWidth = 1; g.strokeRect(fx0, y, fw, rh);
          const nb = f === 9 ? 3 : 2, bw = Math.min(fw / nb, big ? 16 : 13);
          for (let k = 0; k < nb; k++) { const bxx = fx0 + fw - bw * (nb - k); g.strokeRect(bxx, y, bw, big ? 18 : 13); const mk = fr.marks[k + (f < 9 && fr.marks.length === 1 ? 0 : 0)]; if (mk) D.text(g, mk, bxx + bw / 2, y + (big ? 9 : 7), {size: big ? 12 : 10, color: mk === 'X' || mk === '/' ? C.red : C.ink, weight: 800}); }
          if (fr.score != null) D.text(g, String(fr.score), fx0 + fw / 2, y + (big ? 31 : 22), {size: big ? 13 : 11, color: C.ink, weight: 700});
          if (f === Z.frame && p === Z.turn && !st.over) { g.strokeStyle = C.red; g.lineWidth = 2; g.strokeRect(fx0 + 1, y + 1, fw - 2, rh - 2); }
        }
        D.text(g, String(partial(R)), x0 + nameW + fw * 10 + totW / 2, y + rh / 2, {size: big ? 18 : 14, color: C.red, weight: 800});
      }
    }
    function drawRack(g, pins) {
      if (!pins) return;
      const s = Math.min(22, (V.bot - V.top) * .06), x0 = 14 + s * 2.4, y0 = V.top + 12 + s * 4.1;
      g.fillStyle = 'rgba(30,18,8,.72)'; D.rr(g, x0 - s * 2.8, y0 - s * 4.2, s * 5.6, s * 6, 8); g.fill();
      const lx = x => x0 + x / .3048 * s * 1.1;
      g.strokeStyle = 'rgba(255,240,210,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(lx(-LANE_HW), y0 + s * 1.6); g.lineTo(lx(-LANE_HW), y0 - s * 3.8); g.moveTo(lx(LANE_HW), y0 + s * 1.6); g.lineTo(lx(LANE_HW), y0 - s * 3.8); g.stroke();
      SPOT.forEach(([x, y], i) => { const px = lx(x), py = y0 - (y - HEAD) / .2639 * s; g.fillStyle = pins[i] ? '#fff6e6' : 'rgba(255,255,255,.12)'; D.circle(g, px, py, s * .38); g.fill(); if (pins[i] && s >= 14) D.text(g, String(i + 1), px, py + .5, {size: s * .42, color: '#7a2a1a', weight: 700}); });
      const by = y0 + s * 1.15, mine = myTurn();
      const lb = ctx.assist && lastBall[Z.turn]; if (mine && lb && lb.ex != null) { g.fillStyle = 'rgba(255,246,221,.35)'; D.circle(g, lx(lb.ex), by, s * .32); g.fill(); }
      if (!ctx.assist) return;   // predicted pin-arrival marker = assist
      if (mine && entryX != null && ctx.pref('hints')) { g.fillStyle = ctx.color(Z.turn); D.circle(g, lx(entryX), by, s * .36); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
      else if (mine && ctx.pref('hints')) D.text(g, '洗沟', x0, by, {size: 11, color: '#ffb0a0', weight: 700});
    }
    status();
    return inst;
  },
});
function drawPin(g, x, y, hgt, down, wid) {
  // x,y = base on the floor; hgt = pin height in px; wid = girth override (tilted pins)
  const w = wid || hgt * .3;
  g.save();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y, w * .55, w * .18, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createLinearGradient(x - w * .5, 0, x + w * .5, 0); gr.addColorStop(0, '#d9d2c4'); gr.addColorStop(.4, '#ffffff'); gr.addColorStop(1, '#bdb5a6');
  g.fillStyle = gr; g.beginPath();
  g.moveTo(x - w * .28, y);
  g.bezierCurveTo(x - w * .62, y - hgt * .25, x - w * .5, y - hgt * .45, x - w * .2, y - hgt * .62);
  g.bezierCurveTo(x - w * .1, y - hgt * .7, x - w * .32, y - hgt * .9, x, y - hgt);
  g.bezierCurveTo(x + w * .32, y - hgt * .9, x + w * .1, y - hgt * .7, x + w * .2, y - hgt * .62);
  g.bezierCurveTo(x + w * .5, y - hgt * .45, x + w * .62, y - hgt * .25, x + w * .28, y);
  g.closePath(); g.fill();
  if (hgt > 10 || (wid && wid > 3)) { g.fillStyle = '#b23a2b'; g.fillRect(x - w * .19, y - hgt * .72, w * .38, hgt * .035); g.fillRect(x - w * .17, y - hgt * .67, w * .34, hgt * .03); }
  g.restore();
}
