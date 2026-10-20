/* 康乐球 — turn-based physics.  Action = {x: striker x on own baseline (board coords), dx, dy (unit), p (0..1)}.
   apply() runs a deterministic fixed-step simulation (+ - * / sqrt only) to rest and stores the result. */
const D = BX.draw, C = BX.C;
const S = 740, CR = 16, SR = 21, PC = 24, PR = 23, PR2 = PR * PR, BLY = 118, BX0 = 152, BX1 = S - 152, FRAME = 70;
const NC = 19, Q = 18, STK = 19, NB = 20;          // 0..8 white, 9..17 black, 18 queen, 19 striker
const DT = 1 / 300, MAXSTEP = 300 * 16, REC = 5;
const DEC = 820, VMIN = 140, VMAX = 2700, E_C = .9, E_W = .72, MS = 2.6;
const POCK = [[PC, PC], [S - PC, PC], [PC, S - PC], [S - PC, S - PC]];
const AIMP = [[8, 8], [S - 8, 8], [8, S - 8], [S - 8, S - 8]];
const HEX = [[1, 0], [.5, .8660254037844386], [-.5, .8660254037844386], [-1, 0], [-.5, -.8660254037844386], [.5, -.8660254037844386]];
const SPIRAL = [[1, 0], [.7071, .7071], [0, 1], [-.7071, .7071], [-1, 0], [-.7071, -.7071], [0, -1], [.7071, -.7071]];
const colorOf = n => n < 9 ? 0 : n < 18 ? 1 : 2;
const baseY = seat => seat === 0 ? S - BLY : BLY;
const radOf = n => n === STK ? SR : CR;

/* ---------------- deterministic physics ---------------- */
function simulate(c, sx, sy, dx, dy, p, rec) {
  const X = new Float64Array(NB), Y = new Float64Array(NB), VX = new Float64Array(NB), VY = new Float64Array(NB), ON = new Uint8Array(NB);
  for (let i = 0; i < NC; i++) { X[i] = c[i][0]; Y[i] = c[i][1]; ON[i] = c[i][2]; }
  X[STK] = sx; Y[STK] = sy; ON[STK] = 1;
  const v0 = VMIN + p * (VMAX - VMIN); VX[STK] = dx * v0; VY[STK] = dy * v0;
  const out = {pots: [], first: -1, frames: rec ? [] : null, ev: rec ? [] : null, X, Y, ON};
  const snap = () => { const f = new Float32Array(NB * 2); for (let i = 0; i < NB; i++) { f[i * 2] = X[i]; f[i * 2 + 1] = Y[i]; } out.frames.push(f); };
  if (rec) snap();
  const dec = DEC * DT;
  for (let step = 0; step < MAXSTEP; step++) {
    let moving = false;
    for (let i = 0; i < NB; i++) {
      if (!ON[i]) continue; const vx = VX[i], vy = VY[i]; if (vx === 0 && vy === 0) continue;
      moving = true;
      const sp = Math.sqrt(vx * vx + vy * vy);
      if (sp <= dec + .5) { VX[i] = 0; VY[i] = 0; continue; }
      const k = (sp - dec) / sp; VX[i] = vx * k; VY[i] = vy * k;
      X[i] += VX[i] * DT; Y[i] += VY[i] * DT;
    }
    if (!moving) break;
    for (let i = 0; i < NB - 1; i++) {
      if (!ON[i]) continue; const ri = radOf(i), mi = i === STK ? MS : 1;
      for (let j = i + 1; j < NB; j++) {
        if (!ON[j]) continue; const rr = ri + radOf(j);
        const ex = X[j] - X[i]; if (ex >= rr || ex <= -rr) continue;
        const ey = Y[j] - Y[i]; if (ey >= rr || ey <= -rr) continue;
        const d2 = ex * ex + ey * ey; if (d2 >= rr * rr) continue;
        let d = Math.sqrt(d2), nx = 1, ny = 0; if (d > 1e-9) { nx = ex / d; ny = ey / d; } else d = 0;
        const mj = j === STK ? MS : 1, im = 1 / mi + 1 / mj, pen = rr - d;
        X[i] -= nx * pen * (1 / mi) / im; Y[i] -= ny * pen * (1 / mi) / im; X[j] += nx * pen * (1 / mj) / im; Y[j] += ny * pen * (1 / mj) / im;
        const vr = (VX[i] - VX[j]) * nx + (VY[i] - VY[j]) * ny;
        if (vr > 0) {
          const J = (1 + E_C) * vr / im;
          VX[i] -= J / mi * nx; VY[i] -= J / mi * ny; VX[j] += J / mj * nx; VY[j] += J / mj * ny;
          if (out.first < 0 && (i === STK || j === STK)) out.first = i === STK ? j : i;
          if (rec) out.ev.push([out.frames.length, 0, j, vr]);
        }
      }
    }
    for (let i = 0; i < NB; i++) {
      if (!ON[i]) continue; const r = radOf(i), x = X[i], y = Y[i];
      if (x > 50 && x < S - 50 && y > 50 && y < S - 50) continue;
      let pk = -1;
      for (let k = 0; k < 4; k++) { const ex = x - POCK[k][0], ey = y - POCK[k][1]; if (ex * ex + ey * ey < PR2) { pk = k; break; } }
      if (pk >= 0) { ON[i] = 0; VX[i] = VY[i] = 0; X[i] = POCK[pk][0]; Y[i] = POCK[pk][1]; out.pots.push(i); if (rec) out.ev.push([out.frames.length, 2, i, pk]); continue; }
      let hit = 0;
      if (x < r) { X[i] = r; if (VX[i] < 0) { hit = -VX[i]; VX[i] = -VX[i] * E_W; } }
      else if (x > S - r) { X[i] = S - r; if (VX[i] > 0) { hit = VX[i]; VX[i] = -VX[i] * E_W; } }
      if (y < r) { Y[i] = r; if (VY[i] < 0) { hit = Math.max(hit, -VY[i]); VY[i] = -VY[i] * E_W; } }
      else if (y > S - r) { Y[i] = S - r; if (VY[i] > 0) { hit = Math.max(hit, VY[i]); VY[i] = -VY[i] * E_W; } }
      if (hit && rec) out.ev.push([out.frames.length, 1, i, hit]);
    }
    if (rec && step % REC === REC - 1) snap();
  }
  if (rec) snap();
  return out;
}
function freeAt(c, x, y, r, skip) {
  for (let n = 0; n < NC; n++) { if (n === skip || !c[n][2]) continue; const dx = c[n][0] - x, dy = c[n][1] - y, rr = r + CR; if (dx * dx + dy * dy < rr * rr) return false; }
  return true;
}
function centerSpot(c) {
  if (freeAt(c, S / 2, S / 2, CR, -1)) return [S / 2, S / 2];
  for (let rad = 8; rad < 300; rad += 4) for (const [ux, uy] of SPIRAL) { const x = S / 2 + ux * rad, y = S / 2 + uy * rad; if (freeAt(c, x, y, CR, -1)) return [x, y]; }
  return [S / 2, S / 2];
}
function strikerX(c, seat, x) {
  x = Math.min(BX1, Math.max(BX0, x)); const y = baseY(seat);
  if (freeAt(c, x, y, SR, -1)) return x;
  for (let d = 2; d < 460; d += 2) for (const s of [1, -1]) { const xx = x + s * d; if (xx >= BX0 && xx <= BX1 && freeAt(c, xx, y, SR, -1)) return xx; }
  return x;
}
const potted = (c, col) => { let k = 0; for (let n = col * 9; n < col * 9 + 9; n++) if (!c[n][2]) k++; return k; };
function returnCoin(st, n) { const sp = centerSpot(st.c); st.c[n] = [sp[0], sp[1], 1]; }

/* ---------------- AI geometry ---------------- */
function clearPath(c, ax, ay, bx, by, skip, rad, extraSkip) {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
  for (let n = 0; n < NC; n++) {
    if (n === skip || n === extraSkip || !c[n][2]) continue;
    let t = ((c[n][0] - ax) * vx + (c[n][1] - ay) * vy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = c[n][0] - ax - vx * t, ey = c[n][1] - ay - vy * t; if (ex * ex + ey * ey < rad * rad) return false;
  }
  return true;
}
function shotGeo(c, sx, sy, t, k) {
  const bx = c[t][0], by = c[t][1], ax = AIMP[k][0], ay = AIMP[k][1];
  let ux = ax - bx, uy = ay - by; const d2 = Math.hypot(ux, uy); ux /= d2; uy /= d2;
  const gx = bx - ux * (CR + SR), gy = by - uy * (CR + SR);
  let vx = gx - sx, vy = gy - sy; const d1 = Math.hypot(vx, vy); if (d1 < 1) return null; vx /= d1; vy /= d1;
  const cs = vx * ux + vy * uy; if (cs < .3) return null;
  if (gx < SR || gx > S - SR || gy < SR || gy > S - SR) return null;
  if (!clearPath(c, sx, sy, gx, gy, t, CR + SR - .5)) return null;
  if (!clearPath(c, bx, by, ax, ay, t, CR * 2 - 1)) return null;
  return {dx: vx, dy: vy, cs, d1, d2, t, k, ease: cs * cs / (1 + d1 / 600 + d2 / 500)};
}

BX.register({
  id: 'carrom', title: '康乐球', cat: 'physics', order: 2, sub: '弹击棋子入四角袋',
  desc: '方桌四角有袋，白黑各九子加一枚红后。把击子放在自己的底线上弹出去，打进本方棋子并“盖住”红后，先清完的一方获胜。',
  kind: 'turn', seats: 2, seatNames: ['白方', '黑方'], seatColors: ['#efe6d2', '#2a211b'], firstLabel: '执白先手', aiDelay: 300,
  rules: `<p><b>器材</b>：方形球盘四角各有一个袋，盘上有 9 枚白子、9 枚黑子和 1 枚<b>红后</b>，开局红后居中，其余子围成两圈花形。每人有一枚较大较重的<b>击子</b>。白方先手。</p>
<p><b>击球</b>：把击子放在自己一侧的<b>底线</b>上（两端圆圈之间，不能压住棋子），然后弹出击子撞击棋子。只能打进本方颜色的棋子才算得分。</p>
<p><b>连击</b>：一杆打进本方棋子，可继续击球；没有打进本方棋子则换对方。打进对方棋子算对方的，并不能继续击球。</p>
<p><b>红后</b>：须先打进至少一枚本方棋子后才能打红后（否则红后放回中心）。打进红后时如同一杆也进了本方棋子，即为“<b>盖后</b>”成功；否则可以继续击球，下一杆必须打进本方棋子来盖后，没盖住则红后放回中心。</p>
<p><b>犯规</b>：击子落袋为犯规：本杆打进的本方棋子放回中心，并<b>罚</b>放回一枚已进的本方棋子（若还没有进子，记为欠子，以后进子时补罚），换对方击球。红后未被盖住之前，不能打进本方（或对方）的最后一枚棋子，否则该子放回中心并换人。</p>
<p><b>胜负</b>：红后被盖住后，先把本方 9 枚棋子全部打进者获胜（若把对方最后一枚打进，则对方获胜）。本局得分 = 对方剩余棋子数，盖后者再加 3 分（仅作展示）。</p>
<p><b>操作</b>：沿底线左右拖动击子调整位置（也可点击底线某处）；从击子向后拖动拉弓瞄准，拉得越远力量越大，松手弹出。键盘：← → 移动击子，A D 调方向（Shift 更细），W S 力度，空格击出。球盘会转到让击球方的底线在下方。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#3a1c0c', '#1c0c04');
    const s = h - 16, x0 = (w - s) / 2, y0 = 8;
    D.wood(g, x0, y0, s, s, {base: '#4a1e0e', dark: '#1a0804', seed: 3, r: 6});
    g.fillStyle = '#ead6a8'; g.fillRect(x0 + 10, y0 + 10, s - 20, s - 20);
    g.fillStyle = '#1a0c06'; for (const [px, py] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { D.circle(g, x0 + 16 + px * (s - 32), y0 + 16 + py * (s - 32), 7); g.fill(); }
    g.strokeStyle = '#b23a2b'; g.lineWidth = 1.5; D.circle(g, w / 2, h / 2, s * .2); g.stroke();
    g.strokeStyle = '#2a1a10'; g.lineWidth = 1; g.strokeRect(x0 + 28, y0 + s - 38, s - 56, 8); g.strokeRect(x0 + 28, y0 + 30, s - 56, 8);
    const r = 7;
    D.disc(g, w / 2, h / 2, r, '#c8281e');
    HEX.forEach(([ux, uy], k) => D.disc(g, w / 2 + ux * r * 2, h / 2 + uy * r * 2, r, k % 2 ? '#2a211b' : '#efe6d2'));
    HEX.forEach(([ux, uy], k) => D.disc(g, w / 2 + ux * r * 4, h / 2 + uy * r * 4, r, k % 2 ? '#efe6d2' : '#2a211b'));
    D.disc(g, w / 2 + 30, y0 + s - 34, 10, '#f6efdc', {ring: '#b23a2b'});
  },
  _t: {simulate},
  create(ctx) {
    const st = {c: [], turn: 0, queen: {s: 'board', by: -1}, due: [0, 0], shots: 0, over: false, winner: -1, note: null, sx: [S / 2, S / 2], pts: null};
    {
      const c = []; for (let n = 0; n < NC; n++) c.push([0, 0, 1]);
      c[Q] = [S / 2, S / 2, 1];
      const g2 = CR * 2 + .3;
      let w = 0, b = 9;
      HEX.forEach(([ux, uy], k) => { const n = k % 2 ? b++ : w++; c[n] = [S / 2 + ux * g2, S / 2 + uy * g2, 1]; });
      // outer ring: 6 on the axes (radius 2*g2) + 6 between (radius sqrt3*g2)
      HEX.forEach(([ux, uy], k) => { const n = k % 2 ? w++ : b++; c[n] = [S / 2 + ux * g2 * 2, S / 2 + uy * g2 * 2, 1]; });
      HEX.forEach(([ux, uy], k) => { const vx = ux + HEX[(k + 1) % 6][0], vy = uy + HEX[(k + 1) % 6][1]; const n = k % 2 ? w++ : b++; c[n] = [S / 2 + vx * g2, S / 2 + vy * g2, 1]; });
      // a random rotation of the rosette by mirroring (deterministic, rng from ctx)
      if (ctx.rng() < .5) for (const q of c) q[0] = S - q[0];
      st.c = c;
    }
    const cv = ctx.canvas();
    let aim = {dx: 0, dy: -1}, kbPow = .55, sxLocal = S / 2, drag = null, aimFor = -1;
    let play = null, playId = 0, parts = [], shake = 0, banner = null, remoteAim = null, lastSend = 0, bg = null, bgKey = '';
    let rot = 0, rotTarget = 0;
    const myTurn = () => ctx.canAct(st.turn) && !play && !st.over;
    const viewSeat = () => {
      if (ctx.hotseat) return play ? play.by : st.turn;
      return ctx.mySeats.length ? ctx.mySeats[0] : 0;
    };
    /* ---------- layout ---------- */
    function lay() {
      const w = cv.w, h = cv.h, portrait = h > w;
      const tray = portrait ? Math.min(70, Math.max(46, (h - w) / 2 - 4)) : Math.min(110, Math.max(60, (w - h) / 2 - 4));
      const aw = portrait ? w : w - 2 * tray, ah = portrait ? h - 2 * tray : h;
      const f = BX.fit(aw, ah, S + 2 * FRAME, S + 2 * FRAME, 4), sc = f.s;
      const ox = (portrait ? 0 : tray) + f.x + FRAME * sc, oy = (portrait ? tray : 0) + f.y + FRAME * sc;
      return {w, h, portrait, sc, ox, oy, tray, cx: ox + S * sc / 2, cy: oy + S * sc / 2};
    }
    let V = lay();
    const T = (x, y) => { const a = rot, cx = x - S / 2, cy = y - S / 2, c = Math.cos(a), s = Math.sin(a); return [V.cx + (cx * c - cy * s) * V.sc, V.cy + (cx * s + cy * c) * V.sc]; };
    const inv = (px, py) => { const a = -rot, cx = (px - V.cx) / V.sc, cy = (py - V.cy) / V.sc, c = Math.cos(a), s = Math.sin(a); return {x: S / 2 + cx * c - cy * s, y: S / 2 + cx * s + cy * c}; };
    const boardXf = (g, ox = 0, oy = 0) => { const d = cv.dpr, c = Math.cos(rot) * V.sc, s = Math.sin(rot) * V.sc; g.setTransform(c * d, s * d, -s * d, c * d, (V.cx + ox - (c * S / 2 - s * S / 2)) * d, (V.cy + oy - (s * S / 2 + c * S / 2)) * d); };
    function updRot() {
      const want = viewSeat() === 1 ? Math.PI : 0;
      if (want !== rotTarget) { rotTarget = want; const from = rot; if (ctx.fast) { rot = want; return; } ctx.anim(550, k => { rot = from + (want - from) * k; }, () => { rot = want; }); }
    }
    /* ---------- helpers ---------- */
    function initAim() {
      if (aimFor === st.shots) return; aimFor = st.shots;
      sxLocal = strikerX(st.c, st.turn, st.sx[st.turn]);
      aim = {dx: 0, dy: st.turn === 0 ? -1 : 1};
    }
    const sPos = () => [myTurn() ? sxLocal : st.sx[st.turn], baseY(st.turn)];
    const placeOk = () => freeAt(st.c, sxLocal, baseY(st.turn), SR, -1);
    function sendAim(pw) {
      if (!ctx.online) return; const now = performance.now(); if (now - lastSend < 90) return; lastSend = now;
      ctx.send({aim: [Math.round(sxLocal), +aim.dx.toFixed(4), +aim.dy.toFixed(4), +(pw || 0).toFixed(2)]});
    }
    function shoot(p) {
      if (!myTurn()) return;
      if (!placeOk()) { ctx.toast('击子不能压住棋子'); ctx.sfx('error'); return; }
      kbPow = p; ctx.act({x: Math.round(sxLocal * 100) / 100, dx: aim.dx, dy: aim.dy, p: Math.round(BX.clamp(p, 0, 1) * 1000) / 1000}, st.turn);
    }
    function rotAim(a) { const c = Math.cos(a), s = Math.sin(a); aim = {dx: aim.dx * c - aim.dy * s, dy: aim.dx * s + aim.dy * c}; sendAim(); }
    /* ---------- input ---------- */
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!myTurn()) return;
      const p = cv.pos(e), t = inv(p.x, p.y), [sx, sy] = sPos(), [px, py] = T(sx, sy);
      try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
      const dS = Math.hypot(p.x - px, p.y - py);
      if (dS < Math.max(30, SR * V.sc + 16)) { drag = {m: 'pend', x0: p.x, y0: p.y, sx0: sxLocal, t0: t, v: 0}; return; }
      if (Math.abs(t.y - baseY(st.turn)) < 34 && t.x > BX0 - 30 && t.x < BX1 + 30) { sxLocal = BX.clamp(t.x, BX0, BX1); drag = {m: 'place', off: 0}; ctx.sfx('tick'); sendAim(); return; }
      drag = {m: 'aim'}; const l = Math.hypot(t.x - sx, t.y - sy); if (l > 3) { aim = {dx: (t.x - sx) / l, dy: (t.y - sy) / l}; sendAim(); }
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!drag) return; if (!myTurn()) { drag = null; return; }
      const p = cv.pos(e), t = inv(p.x, p.y);
      if (drag.m === 'pend') {
        const dx = p.x - drag.x0, dy = p.y - drag.y0;
        if (Math.hypot(dx, dy) < 10) return;
        // horizontal (along the baseline, in board space) → slide; otherwise pull back to aim
        const bdx = t.x - drag.t0.x, bdy = t.y - drag.t0.y;
        drag = Math.abs(bdx) > 1.6 * Math.abs(bdy) ? {m: 'place', off: drag.sx0 - drag.t0.x} : {m: 'pull', x0: drag.x0, y0: drag.y0, v: 0};
      }
      if (drag.m === 'place') { sxLocal = BX.clamp(t.x + drag.off, BX0, BX1); sendAim(); }
      else if (drag.m === 'aim') { const [sx, sy] = sPos(), l = Math.hypot(t.x - sx, t.y - sy); if (l > 3) { aim = {dx: (t.x - sx) / l, dy: (t.y - sy) / l}; sendAim(); } }
      else if (drag.m === 'pull') {
        const [sx, sy] = sPos(), vx = sx - t.x, vy = sy - t.y, l = Math.hypot(vx, vy);
        if (l * V.sc > 12) aim = {dx: vx / l, dy: vy / l};
        drag.v = BX.clamp((Math.hypot(p.x - drag.x0, p.y - drag.y0) - 10) / Math.max(130, Math.min(230, Math.min(cv.w, cv.h) * .4)), 0, 1); sendAim(drag.v);
      }
    });
    const up = () => {
      const d = drag; drag = null; if (!d) return;
      if (d.m === 'place') { ctx.sfx('place'); if (!placeOk()) sxLocal = strikerX(st.c, st.turn, sxLocal); }
      else if (d.m === 'pull' && d.v > .03) shoot(d.v);
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', () => { drag = null; });
    /* ---------- status ---------- */
    function status() {
      for (const s of [0, 1]) ctx.info(s, '进' + potted(st.c, s) + '/9' + (st.queen.s === 'cov' && st.queen.by === s ? ' 后' : '') + (st.due[s] ? ' 欠' + st.due[s] : ''));
      updRot();
      if (st.over) return ctx.status(ctx.name(st.winner) + ' 获胜');
      if (play) return ctx.status(ctx.name(play.by) + ' 击球中…');
      const t = st.turn, q = st.queen.s === 'pend' && st.queen.by === t ? ' · 须盖后！' : '';
      if (ctx.canAct(t)) { initAim(); ctx.status((ctx.hotseat ? ctx.name(t) + '：' : '') + '拖动击子定位，向后拉弓出击（打' + (t ? '黑' : '白') + '子）' + q); }
      else ctx.status('等待 ' + ctx.name(t) + ' 击球…' + q);
    }
    /* ---------- AI ---------- */
    function aiMove(seat, level) {
      const t0 = performance.now(), budget = BX.test ? 30 : [0, 150, 380, 650][level], maxSims = BX.test ? 10 : [0, 8, 30, 80][level];
      const c = st.c, y = baseY(seat), mine = [];
      for (let n = seat * 9; n < seat * 9 + 9; n++) if (c[n][2]) mine.push(n);
      const canQueen = c[Q][2] && potted(c, seat) > 0;
      const tg = mine.slice(); if (canQueen && level >= 2) tg.push(Q);
      const xs = []; const nx = [0, 7, 13, 19][level]; for (let k = 0; k < nx; k++) xs.push(BX0 + (BX1 - BX0) * k / (nx - 1));
      const cands = [];
      for (const x0 of xs) {
        if (!freeAt(c, x0, y, SR, -1)) continue;
        for (const t of tg) for (let k = 0; k < 4; k++) { const o = shotGeo(c, x0, y, t, k); if (o) { o.x = x0; if (t === Q) o.ease *= 1.3; cands.push(o); } }
      }
      cands.sort((a, b) => b.ease - a.ease);
      const noise = [0, .035, .014, .004][level], pn = [0, .2, .09, .03][level];
      const rnd = () => (Math.random() + Math.random() + Math.random() - 1.5) / .5;
      const finish = a => {
        const an = rnd() * noise, cs = Math.cos(an), sn = Math.sin(an);
        let dx = a.dx * cs - a.dy * sn, dy = a.dx * sn + a.dy * cs; const l = Math.hypot(dx, dy);
        return {x: Math.round(a.x * 100) / 100, dx: dx / l, dy: dy / l, p: Math.round(BX.clamp(a.p * (1 + rnd() * pn), .03, 1) * 1000) / 1000};
      };
      const evalShot = sh => {
        const r = simulate(c, sh.x, y, sh.dx, sh.dy, sh.p, false);
        const res = judge(st, seat, r, true);
        if (res.win === seat) return 1e6; if (res.win === 1 - seat) return -1e6;
        let sc = res.own * 100 - res.opp * 40 + (res.queenCov ? 160 : 0) + (res.queenPend ? 60 : 0);
        if (res.foul) sc -= 250;
        if (res.cont && level >= 2) {
          // follow-up opportunities from the new position
          const nc = []; for (let n = 0; n < NC; n++) nc.push([r.X[n], r.Y[n], r.ON[n]]);
          let best = 0; for (let n = seat * 9; n < seat * 9 + 9; n++) if (nc[n][2]) for (const x0 of [BX0, S / 2 - 110, S / 2, S / 2 + 110, BX1]) for (let k = 0; k < 4; k++) { const o = shotGeo(nc, x0, y, n, k); if (o && o.ease > best) best = o.ease; }
          sc += best * (level === 3 ? 140 : 60);
        }
        return sc;
      };
      const vNeed = o => { const vc = Math.sqrt(2 * DEC * (o.d2 + 30)) + 60; const vi = vc / (Math.max(o.cs, .3) * (1 + E_C) * MS / (MS + 1)); return Math.sqrt(vi * vi + 2 * DEC * o.d1); };
      const scored = []; let sims = 0;
      outer:
      for (const o of cands.slice(0, [0, 4, 9, 16][level])) {
        const b0 = BX.clamp((vNeed(o) - VMIN) / (VMAX - VMIN), .04, 1);
        for (const pf of level === 1 ? [1.25] : [1.1, 1.45, 2]) {
          if (sims >= maxSims || (sims && performance.now() - t0 > budget)) break outer;
          const sh = {x: o.x, dx: o.dx, dy: o.dy, p: BX.clamp(b0 * pf, .04, 1)}; sims++; scored.push([sh, evalShot(sh)]);
        }
      }
      if (!scored.length || Math.max(...scored.map(s => s[1])) < 50) {
        // fallback: break-style shots into the nearest own coin / pack
        const pool = mine.length ? mine : [Q];
        for (let k = 0; k < 6 && sims < maxSims + 6; k++) {
          const n = pool[Math.floor(Math.random() * pool.length)], x0 = strikerX(c, seat, c[n] ? c[n][0] + (Math.random() - .5) * 200 : S / 2);
          const vx = (c[n] ? c[n][0] : S / 2) - x0, vy = (c[n] ? c[n][1] : S / 2) - y, l = Math.hypot(vx, vy) || 1;
          const sh = {x: x0, dx: vx / l, dy: vy / l, p: .45 + Math.random() * .4}; sims++; scored.push([sh, evalShot(sh) - 5]);
        }
      }
      return finish(BX.ai.byLevel(scored, level));
    }
    /* ---------- rules ---------- */
    function judge(s, sh, r, dry) {
      // works on a clone when dry
      const st2 = dry ? {c: s.c.map(q => q.slice()), queen: Object.assign({}, s.queen), due: s.due.slice(), turn: s.turn} : s;
      const pots = r.pots, foul = pots.includes(STK), own = pots.filter(n => n < 18 && colorOf(n) === sh), opp = pots.filter(n => n < 18 && colorOf(n) !== sh), qIn = pots.includes(Q);
      const prevOwn = potted(s.c, sh) - 0;
      for (let n = 0; n < NC; n++) st2.c[n] = [r.X[n], r.Y[n], r.ON[n]];
      const out = {foul, own: own.length, opp: opp.length, queenCov: false, queenPend: false, cont: false, win: -1, msg: []};
      // queen
      const q = st2.queen;
      if (q.s === 'pend' && q.by === sh) {
        if (!foul && own.length) { q.s = 'cov'; out.queenCov = true; out.msg.push('盖后成功'); }
        else { q.s = 'board'; q.by = -1; returnCoin(st2, Q); out.msg.push('未能盖后，红后放回中心'); }
      }
      if (qIn) {
        if (foul) { returnCoin(st2, Q); q.s = 'board'; q.by = -1; out.msg.push('红后放回'); }
        else if (prevOwn === 0 && !own.length) { returnCoin(st2, Q); q.s = 'board'; q.by = -1; out.msg.push('先进本方子才能打红后'); }
        else if (own.length) { q.s = 'cov'; q.by = sh; out.queenCov = true; out.msg.push('打进红后并盖后'); }
        else { q.s = 'pend'; q.by = sh; out.queenPend = true; out.msg.push('打进红后！下一杆须盖后'); }
      }
      if (foul) {
        for (const n of own) returnCoin(st2, n);
        let pen = 1; for (let n = sh * 9; n < sh * 9 + 9 && pen; n++) if (!st2.c[n][2]) { returnCoin(st2, n); pen--; }
        if (pen) st2.due[sh]++;
        out.msg.unshift('击子落袋犯规'); out.own = 0;
      } else if (own.length && st2.due[sh]) {
        for (let n = sh * 9; n < sh * 9 + 9 && st2.due[sh]; n++) if (!st2.c[n][2]) { returnCoin(st2, n); st2.due[sh]--; }
        out.msg.push('补罚欠子');
      }
      // last coin before the queen is covered
      let lastFoul = false;
      if (q.s !== 'cov') for (const col of [0, 1]) if (potted(st2.c, col) === 9) {
        const mine2 = r.pots.filter(m => m < 18 && colorOf(m) === col), n = mine2.length ? mine2[mine2.length - 1] : col * 9;
        returnCoin(st2, n); lastFoul = true; out.msg.push('红后未盖，最后一子放回');
      }
      // win check
      if (q.s === 'cov') {
        const a = potted(st2.c, sh) === 9, b = potted(st2.c, 1 - sh) === 9;
        if (b) out.win = 1 - sh; else if (a) out.win = sh;
      }
      out.cont = !foul && !lastFoul && (own.length > 0 || out.queenPend) && out.win < 0;
      out.st2 = st2;
      return out;
    }
    function startPlayback(res, a, by, offBefore) {
      if (play && play.anim) play.anim.cancel();
      const id = ++playId, ms = 250 + res.frames.length * REC * 1000 / 300 / 1.15;
      play = {id, by, frames: res.frames, ev: res.ev, ei: 0, k: 0, ms, pre: 250 / ms, a, offBefore, pots: new Map(), last: null};
      play.anim = ctx.anim(ms, k => { if (play && play.id === id) play.k = k; }, () => {
        if (!play || play.id !== id) return; play = null; aimFor = -1;
        if (st.note) banner = {note: st.note, t: 2.4};
        status(); ctx.poke();
      }, t => t);
    }
    const inst = {
      st,
      toMove: () => st.over || play ? null : st.turn,
      valid: a => a && [a.x, a.dx, a.dy, a.p].every(Number.isFinite) && Math.abs(a.dx) + Math.abs(a.dy) > 1e-6,
      apply(a, by) {
        const sh = st.turn;
        let dx = +a.dx || 0, dy = +a.dy || 0; const l = Math.sqrt(dx * dx + dy * dy); if (l < 1e-9) { dx = 0; dy = sh ? 1 : -1; } else { dx /= l; dy /= l; }
        const x = strikerX(st.c, sh, +a.x || S / 2), p = BX.clamp(+a.p || 0, 0, 1);
        st.sx[sh] = x;
        const offBefore = st.c.map(q => !q[2]); offBefore.push(false);
        const r = simulate(st.c, x, baseY(sh), dx, dy, p, !ctx.fast);
        const j = judge(st, sh, r, false);
        st.shots++;
        if (j.win >= 0) {
          st.over = true; st.winner = j.win;
          const w = j.win, pts = (9 - potted(st.c, 1 - w)) + (st.queen.by === w ? 3 : 0);
          st.pts = pts; st.note = ['end', w, ctx.name(w) + ' 清台获胜 · 得 ' + pts + ' 分'];
        } else if (st.shots >= (BX.test ? 70 : 400)) {
          const a0 = potted(st.c, 0), a1 = potted(st.c, 1);
          st.over = true; st.winner = a0 === a1 ? -1 : a0 > a1 ? 0 : 1; st.note = ['end', st.winner, '杆数用尽，按进子数判定'];
        } else {
          st.note = [j.foul ? 'foul' : j.cont ? 'cont' : 'miss', sh, j.msg.join('，')];
          if (!j.cont) st.turn = 1 - sh;
        }
        if (!ctx.fast) { startPlayback(r, {dx, dy, p, x}, sh, offBefore); ctx.sfx('hit'); }
        status();
        if (st.over) ctx.end({winner: st.winner, text: st.note[2], delay: (play ? play.ms : 0) + 700});
      },
      aiMove,
      onTurn: status,
      onView: status,
      onMsg(m) { if (m && m.aim) remoteAim = {a: m.aim, t: performance.now()}; },
      key(e) {
        if (!myTurn()) return;
        const fine = e.shiftKey ? .0015 : .008, flip = rotTarget ? -1 : 1;
        if (e.code === 'ArrowLeft') { sxLocal = BX.clamp(sxLocal - 6 * flip, BX0, BX1); sendAim(); }
        else if (e.code === 'ArrowRight') { sxLocal = BX.clamp(sxLocal + 6 * flip, BX0, BX1); sendAim(); }
        else if (e.code === 'KeyA') rotAim(-fine); else if (e.code === 'KeyD') rotAim(fine);
        else if (e.code === 'KeyW' || e.code === 'ArrowUp') kbPow = BX.clamp(kbPow + .05, .05, 1);
        else if (e.code === 'KeyS' || e.code === 'ArrowDown') kbPow = BX.clamp(kbPow - .05, .05, 1);
        else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); shoot(kbPow); }
      },
      resize() { V = lay(); bgKey = ''; },
      frame(dt) { draw(dt); },
    };
    /* ---------- drawing ---------- */
    function drawBoard(g) {
      // frame
      g.fillStyle = 'rgba(0,0,0,.4)'; D.rr(g, -FRAME + 8, -FRAME + 12, S + 2 * FRAME, S + 2 * FRAME, 26); g.fill();
      D.wood(g, -FRAME, -FRAME, S + 2 * FRAME, S + 2 * FRAME, {r: 26, base: '#4a1c0c', dark: '#160602', seed: 31, grain: .25});
      const lq = g.createLinearGradient(-FRAME, -FRAME, S + FRAME, S + FRAME); lq.addColorStop(0, 'rgba(255,190,140,.14)'); lq.addColorStop(.5, 'rgba(0,0,0,0)'); lq.addColorStop(1, 'rgba(0,0,0,.3)');
      g.fillStyle = lq; D.rr(g, -FRAME, -FRAME, S + 2 * FRAME, S + 2 * FRAME, 26); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.7)'; g.lineWidth = 2.5; D.rr(g, -FRAME + 9, -FRAME + 9, S + 2 * FRAME - 18, S + 2 * FRAME - 18, 20); g.stroke();
      // gold fret pattern (回纹) along the frame
      g.strokeStyle = 'rgba(230,197,125,.28)'; g.lineWidth = 2;
      for (let k = 0; k < 14; k++) for (const side of [0, 1, 2, 3]) {
        const t0 = 60 + k * (S - 120) / 13; let x, y;
        if (side === 0) { x = t0; y = -FRAME / 2 - 2; } else if (side === 1) { x = t0; y = S + FRAME / 2 + 2; } else if (side === 2) { x = -FRAME / 2 - 2; y = t0; } else { x = S + FRAME / 2 + 2; y = t0; }
        g.beginPath(); g.moveTo(x - 7, y + 7); g.lineTo(x - 7, y - 7); g.lineTo(x + 7, y - 7); g.lineTo(x + 7, y + 3); g.lineTo(x - 2, y + 3); g.lineTo(x - 2, y - 2); g.stroke();
      }
      // playing surface: pale birch
      const pg = g.createLinearGradient(0, 0, S, S); pg.addColorStop(0, '#f1dfb4'); pg.addColorStop(.5, '#ead2a0'); pg.addColorStop(1, '#dcc08a');
      g.fillStyle = pg; g.fillRect(0, 0, S, S);
      const r = BX.rng(5); g.globalAlpha = .08; g.strokeStyle = '#8a5a2a';
      for (let i = 0; i < 70; i++) { const yy = r() * S; g.lineWidth = .6 + r() * 1.4; g.beginPath(); for (let x = 0; x <= S; x += 20) { const q = yy + Math.sin(x * .01 + i) * 3; x ? g.lineTo(x, q) : g.moveTo(x, q); } g.stroke(); }
      g.globalAlpha = 1;
      const vg = g.createRadialGradient(S / 2, S / 2, S * .25, S / 2, S / 2, S * .75); vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(90,50,10,.22)'); g.fillStyle = vg; g.fillRect(0, 0, S, S);
      // inner edge shadow
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 6; g.strokeRect(3, 3, S - 6, S - 6);
      // baselines (4 sides) with end circles
      const ink = '#2a1a10';
      for (let side = 0; side < 4; side++) {
        g.save(); g.translate(S / 2, S / 2); g.rotate(side * Math.PI / 2); g.translate(-S / 2, -S / 2);
        const y1 = S - BLY - CR, y2 = S - BLY + CR;
        g.strokeStyle = ink; g.lineWidth = 2.2; g.beginPath(); g.moveTo(BX0, y1); g.lineTo(BX1, y1); g.moveTo(BX0, y2); g.lineTo(BX1, y2); g.stroke();
        for (const x of [BX0, BX1]) { g.fillStyle = '#b23a2b'; D.circle(g, x, S - BLY, CR); g.fill(); g.strokeStyle = ink; g.lineWidth = 2; g.stroke(); g.fillStyle = '#f1dfb4'; D.circle(g, x, S - BLY, CR * .5); g.fill(); }
        // corner arrows toward pocket
        g.strokeStyle = ink; g.lineWidth = 1.8; g.beginPath(); g.moveTo(S - 70, S - 70); g.lineTo(S - 260, S - 260); g.stroke();
        g.beginPath(); g.arc(S - 230, S - 230, 26, Math.PI * .25 + .55, Math.PI * 1.25 - .55, false); g.stroke();
        g.beginPath(); g.moveTo(S - 70, S - 70); g.lineTo(S - 86, S - 72); g.moveTo(S - 70, S - 70); g.lineTo(S - 72, S - 86); g.stroke();
        g.restore();
      }
      // centre rosette: outer circle with lotus petals
      g.strokeStyle = '#b23a2b'; g.lineWidth = 2.5; D.circle(g, S / 2, S / 2, 92); g.stroke();
      g.lineWidth = 1.2; D.circle(g, S / 2, S / 2, 86); g.stroke();
      g.fillStyle = 'rgba(178,58,43,.12)'; g.strokeStyle = 'rgba(178,58,43,.55)'; g.lineWidth = 1.2;
      for (let k = 0; k < 8; k++) { g.save(); g.translate(S / 2, S / 2); g.rotate(k * Math.PI / 4 + Math.PI / 8); g.beginPath(); g.moveTo(0, -18); g.quadraticCurveTo(22, -50, 0, -82); g.quadraticCurveTo(-22, -50, 0, -18); g.fill(); g.stroke(); g.restore(); }
      g.strokeStyle = '#b23a2b'; g.lineWidth = 2; D.circle(g, S / 2, S / 2, CR + 1); g.stroke();
      // pockets
      for (const [x, y] of POCK) {
        g.fillStyle = 'rgba(0,0,0,.25)'; D.circle(g, x, y, PR + 6); g.fill();
        const hg = g.createRadialGradient(x - 3, y - 3, 2, x, y, PR + 1); hg.addColorStop(0, '#000'); hg.addColorStop(.8, '#120804'); hg.addColorStop(1, '#3a2010');
        g.fillStyle = hg; D.circle(g, x, y, PR + 1); g.fill();
        g.strokeStyle = 'rgba(200,160,82,.9)'; g.lineWidth = 2.5; D.circle(g, x, y, PR + 3); g.stroke();
      }
      g.globalAlpha = .07; g.fillStyle = '#7a2a10'; g.font = '400 54px ' + BX.F.deco; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('百戏', S / 2, S / 2 + 190); g.globalAlpha = 1;
    }
    function coin(g, x, y, n, k = 1) {
      const isS = n === STK, r = (isS ? SR : CR) * k;
      g.fillStyle = 'rgba(0,0,0,.3)'; D.circle(g, x + 2, y + 3, r); g.fill();
      if (isS) {
        const gr = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#d9ccb0');
        g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
        g.strokeStyle = '#b23a2b'; g.lineWidth = r * .1; D.circle(g, x, y, r * .78); g.stroke();
        g.fillStyle = '#b23a2b'; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; D.circle(g, x + Math.cos(a) * r * .45, y + Math.sin(a) * r * .45, r * .12); g.fill(); }
        D.circle(g, x, y, r * .18); g.fill();
        return;
      }
      const base = n === Q ? '#c8281e' : n < 9 ? '#efe6d2' : '#2a211b', ring = n === Q ? '#ff9a80' : n < 9 ? '#b8a888' : '#6a5a4a';
      const gr = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r); gr.addColorStop(0, D.shade(base, 25)); gr.addColorStop(1, D.shade(base, -15));
      g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
      g.strokeStyle = ring; g.lineWidth = Math.max(.8, r * .08); D.circle(g, x, y, r * .72); g.stroke(); D.circle(g, x, y, r * .42); g.stroke();
      if (n === Q) { g.fillStyle = '#ffd76a'; D.circle(g, x, y, r * .2); g.fill(); }
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; D.circle(g, x, y, r); g.stroke();
    }
    function guide(g, sx, sy, dx, dy, c) {
      let tB = 1e9, hit = -1;
      for (let n = 0; n < NC; n++) {
        if (!c[n][2]) continue; const ex = c[n][0] - sx, ey = c[n][1] - sy, tc = ex * dx + ey * dy; if (tc <= 0) continue;
        const rr = SR + CR, pd2 = ex * ex + ey * ey - tc * tc; if (pd2 >= rr * rr) continue; const t = tc - Math.sqrt(rr * rr - pd2); if (t < tB) { tB = t; hit = n; }
      }
      let tw = 1e9; if (dx > 0) tw = Math.min(tw, (S - SR - sx) / dx); if (dx < 0) tw = Math.min(tw, (SR - sx) / dx); if (dy > 0) tw = Math.min(tw, (S - SR - sy) / dy); if (dy < 0) tw = Math.min(tw, (SR - sy) / dy);
      const t = Math.min(tB, tw), gx = sx + dx * t, gy = sy + dy * t;
      g.save(); g.strokeStyle = 'rgba(60,30,10,.7)'; g.lineWidth = 1.8; g.setLineDash([8, 7]);
      g.beginPath(); g.moveTo(sx + dx * SR, sy + dy * SR); g.lineTo(gx, gy); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(60,30,10,.6)'; D.circle(g, gx, gy, SR); g.stroke();
      if (hit >= 0 && tB <= tw) {
        let nx = c[hit][0] - gx, ny = c[hit][1] - gy; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
        const cs = dx * nx + dy * ny, own = colorOf(hit) === st.turn || hit === Q;
        g.strokeStyle = own ? 'rgba(40,130,90,.95)' : 'rgba(190,40,30,.9)'; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(c[hit][0], c[hit][1]); g.lineTo(c[hit][0] + nx * (40 + 150 * cs), c[hit][1] + ny * (40 + 150 * cs)); g.stroke();
      } else if (tw < 1e8) {
        // one bounce preview
        let rx = dx, ry = dy; if (Math.abs(gx - SR) < 1 || Math.abs(gx - (S - SR)) < 1) rx = -rx; else ry = -ry;
        g.strokeStyle = 'rgba(60,30,10,.35)'; g.setLineDash([5, 7]); g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + rx * 110, gy + ry * 110); g.stroke(); g.setLineDash([]);
      }
      g.restore();
    }
    function draw(dt) {
      const g = cv.g; cv.clear();
      if (V.w !== cv.w || V.h !== cv.h) V = lay();
      const key = cv.w + 'x' + cv.h + '@' + cv.dpr + '@' + rot.toFixed(3);
      if (key !== bgKey) {
        bgKey = key; bg = bg || document.createElement('canvas'); bg.width = Math.round(cv.w * cv.dpr); bg.height = Math.round(cv.h * cv.dpr);
        const b = bg.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, bg.width, bg.height); boardXf(b); drawBoard(b);
      }
      shake = Math.max(0, shake - dt * 30);
      const ox = shake ? (Math.random() - .5) * shake : 0, oy = shake ? (Math.random() - .5) * shake : 0;
      g.setTransform(1, 0, 0, 1, ox * cv.dpr, oy * cv.dpr); g.drawImage(bg, 0, 0);
      boardXf(g, ox, oy);
      let pos = st.c.map(q => q.slice()); pos.push([0, 0, 0]);
      let flick = null;
      if (play) {
        const ph = play.k < play.pre ? -1 : (play.k - play.pre) / (1 - play.pre), fl = play.frames.length;
        if (ph < 0) {
          const f = play.frames[0]; for (let n = 0; n < NB; n++) pos[n] = [f[n * 2], f[n * 2 + 1], play.offBefore[n] ? 0 : 1];
          flick = 1 - play.k / play.pre;
        } else {
          const fx2 = ph * (fl - 1), fi = Math.min(fl - 2, Math.floor(fx2)), fr = fx2 - fi, A = play.frames[Math.max(0, fi)], B = play.frames[Math.min(fl - 1, fi + 1)];
          while (play.ei < play.ev.length && play.ev[play.ei][0] <= fi + 1) fire(play.ev[play.ei++]);
          for (let n = 0; n < NB; n++) pos[n] = [A[n * 2] + (B[n * 2] - A[n * 2]) * fr, A[n * 2 + 1] + (B[n * 2 + 1] - A[n * 2 + 1]) * fr, play.offBefore[n] ? 0 : 1];
          for (const [n, pk] of play.pots) { pk.t += dt * 4; if (pk.t >= 1) pos[n][2] = 0; else pos[n] = [pk.x + (POCK[pk.k][0] - pk.x) * pk.t, pk.y + (POCK[pk.k][1] - pk.y) * pk.t, 1 - pk.t]; }
        }
      } else if (!st.over) {
        const [sx, sy] = sPos(); pos[STK] = [sx, sy, 1];
        if (!myTurn() && remoteAim && ctx.isRemote(st.turn) && performance.now() - remoteAim.t < 4000) pos[STK][0] = remoteAim.a[0];
      }
      const mine = myTurn();
      if (mine) {
        const [sx, sy] = [pos[STK][0], pos[STK][1]], bad = !placeOk();
        g.strokeStyle = bad ? 'rgba(200,40,30,.9)' : 'rgba(178,58,43,.55)'; g.lineWidth = 2; g.setLineDash([4, 4]); D.circle(g, sx, sy, SR + 7 + Math.sin(performance.now() / 200) * 1.5); g.stroke(); g.setLineDash([]);
        // slide arrows
        g.fillStyle = 'rgba(178,58,43,.6)';
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(sx + s * (SR + 22), sy); g.lineTo(sx + s * (SR + 13), sy - 7); g.lineTo(sx + s * (SR + 13), sy + 7); g.closePath(); g.fill(); }
        guide(g, sx, sy, aim.dx, aim.dy, st.c);
      } else if (!play && !st.over && remoteAim && ctx.isRemote(st.turn) && performance.now() - remoteAim.t < 4000) {
        g.globalAlpha = .5; guide(g, pos[STK][0], pos[STK][1], remoteAim.a[1], remoteAim.a[2], st.c); g.globalAlpha = 1;
      }
      for (let n = 0; n < NB; n++) { const q = pos[n]; if (!q[2]) continue; coin(g, q[0], q[1], n, q[2] < 1 ? .5 + .5 * q[2] : 1); }
      // pull band / flick finger
      const pull = mine && drag && drag.m === 'pull' ? drag.v : flick != null ? flick * play.a.p : 0;
      if (pull > 0) {
        const [sx, sy] = mine ? [pos[STK][0], pos[STK][1]] : [play.a.x, baseY(play.by)], [adx, ady] = mine ? [aim.dx, aim.dy] : [play.a.dx, play.a.dy];
        const bx = sx - adx * (SR + 10 + pull * 70), by = sy - ady * (SR + 10 + pull * 70);
        g.strokeStyle = `rgba(178,58,43,${.5 + pull * .5})`; g.lineWidth = 4 + pull * 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(sx - adx * SR, sy - ady * SR); g.lineTo(bx, by); g.stroke();
        g.fillStyle = '#e6c57d'; D.circle(g, bx, by, 8); g.fill(); g.strokeStyle = '#7a4a10'; g.lineWidth = 1.5; g.stroke();
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.t -= dt; if (p.t <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; g.globalAlpha = Math.min(1, p.t * 2);
        if (p.ring) { g.strokeStyle = p.c; g.lineWidth = 2.5; D.circle(g, p.x, p.y, CR + (1 - p.t / p.t0) * 26); g.stroke(); } else { g.fillStyle = p.c; D.circle(g, p.x, p.y, p.r); g.fill(); }
      }
      g.globalAlpha = 1;
      g.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0);
      drawTrays(g);
      if (mine && drag && drag.m === 'pull') { const [px, py] = T(pos[STK][0], pos[STK][1]); D.text(g, Math.round(drag.v * 100) + '%', px, py + (SR + 28) * V.sc, {size: 13, color: '#fff3d6', stroke: 'rgba(40,20,5,.8)', strokeW: 3}); }
      if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; else drawBanner(g, banner); }
    }
    function fire(e) {
      const [f, type, i, v] = e, fr = play.frames[Math.min(f, play.frames.length - 1)];
      if (type === 0) { if (v > 80) ctx.sfx(v > 900 ? 'hit' : 'stone'); if (v > 600) parts.push({x: fr[i * 2], y: fr[i * 2 + 1], vx: 0, vy: 0, t: .25, t0: .25, c: 'rgba(255,240,200,.8)', ring: true}); if (v > 1600) shake = Math.max(shake, 6); }
      else if (type === 1) { if (v > 200) ctx.sfx('bounce'); if (v > 1400) shake = Math.max(shake, 4); }
      else if (type === 2) {
        const ff = play.frames[Math.max(0, f - 1)]; play.pots.set(i, {x: ff[i * 2], y: ff[i * 2 + 1], k: v, t: 0});
        ctx.sfx(i === STK ? 'buzz' : i === Q ? 'gong' : 'capture');
        const [px, py] = POCK[v], col = i === STK ? '#ff6a4a' : i === Q ? '#ff8a6a' : '#ffe39a';
        parts.push({x: px, y: py, vx: 0, vy: 0, t: .45, t0: .45, c: col, ring: true});
        for (let k = 0; k < 12; k++) { const a = Math.random() * 6.283, sp = 150 + Math.random() * 200; parts.push({x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: .3 + Math.random() * .3, t0: 1, r: 1.5 + Math.random() * 2, c: col}); }
      }
    }
    function drawTrays(g) {
      // each player's pocketed coins, near their own side of the screen
      const vs = Math.round(rot / Math.PI) % 2 ? 1 : 0;
      for (const s of [0, 1]) {
        const near = s === vs, n = potted(st.c, s), r = Math.max(8, Math.min(14, V.sc * CR * .9));
        let x, y, dx = 0, dy = 0;
        if (V.portrait) { y = near ? V.oy + (S + FRAME) * V.sc + V.tray / 2 + 4 : V.oy - FRAME * V.sc - V.tray / 2 - 4; x = V.w / 2 - 4 * r * 2.2 - r; dx = r * 2.2; }
        else { x = near ? V.ox + (S + FRAME) * V.sc + V.tray / 2 : V.ox - FRAME * V.sc - V.tray / 2; y = V.h / 2 - 4 * r * 2.2; dy = r * 2.2; }
        const active = st.turn === s && !st.over;
        g.fillStyle = active ? 'rgba(230,197,125,.18)' : 'rgba(0,0,0,.25)';
        if (V.portrait) D.rr(g, x - r * 2.2, y - r * 1.6, 9 * r * 2.2 + r * 2.4, r * 3.2, r); else D.rr(g, x - r * 1.6, y - r * 3.4, r * 3.2, 9 * r * 2.2 + r * 3.2, r);
        g.fill(); if (active) { g.strokeStyle = 'rgba(230,197,125,.7)'; g.lineWidth = 1.5; g.stroke(); }
        const lbl = ctx.name(s) + (st.queen.s === 'cov' && st.queen.by === s ? ' ♛' : '');
        if (V.portrait) D.text(g, lbl, x - r * 2.2 + 4, y - r * 1.6 - 9, {size: 11, color: '#f3e2c0', align: 'left'});
        else D.text(g, lbl, x, y - r * 3.4 - 10, {size: 11, color: '#f3e2c0', maxW: V.tray - 6});
        for (let k = 0; k < 9; k++) {
          const cx = x + dx * k, cy = y + dy * k;
          if (k < n) coin(g, cx, cy, s * 9, r / CR); else { g.strokeStyle = 'rgba(243,226,192,.25)'; g.lineWidth = 1; D.circle(g, cx, cy, r * .8); g.stroke(); }
        }
        if (st.queen.by === s && st.queen.s !== 'board') { const cx = x + dx * 9.4, cy = y + dy * 9.4; coin(g, cx, cy, Q, r / CR); if (st.queen.s === 'pend') D.text(g, '待盖', cx + (V.portrait ? r * 2.6 : 0), cy + (V.portrait ? 0 : r * 1.9), {size: 10, color: '#ffb4a0'}); }
      }
    }
    function drawBanner(g, b) {
      const n = b.note; let txt = n[2]; const a = Math.min(1, b.t * 2);
      if (n[0] === 'cont' && !txt) txt = '进子！' + ctx.name(n[1]) + ' 继续击球';
      if (n[0] === 'foul') txt = txt + ' · 换 ' + ctx.name(1 - n[1]);
      if (!txt) return;
      g.save(); g.globalAlpha = a; const fs = V.w < 500 ? 13 : 15; g.font = `700 ${fs}px ${BX.F.sans}`;
      const tw = Math.min(V.w - 16, g.measureText(txt).width + 30), cx = V.cx, cy = V.cy - 130 * V.sc;
      g.fillStyle = n[0] === 'foul' ? 'rgba(140,30,20,.9)' : 'rgba(30,18,8,.86)'; D.rr(g, cx - tw / 2, cy - 17, tw, 34, 17); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.6)'; g.lineWidth = 1; g.stroke();
      D.text(g, txt, cx, cy, {size: fs, color: '#fbe9d0', maxW: tw - 16}); g.restore();
    }
    status();
    return inst;
  },
});
