/* 桌球·八球 — turn-based physics.  Shot action = {dx,dy (unit), p (0..1 power), s (-1 draw .. +1 follow) [, cx, cy (ball-in-hand placement)]}.
   apply() runs a deterministic fixed-step simulation to rest (only + - * / sqrt), stores the result in st and a recorded
   trajectory (UI only) that frame() plays back. */
const D = BX.draw, C = BX.C;
const L = 1000, W = 500, R = 12, R2 = 24, RR = R2 * R2;
const HEAD = 250, FOOTX = 750, FOOTY = 250;
const DT = 1 / 360, MAXSTEP = 360 * 18, REC = 6;
const MU_S = 640, MU_R = 150, E_BALL = .95, VMIN = 120, VMAX = 2300, MU_B = .03;
/* cushion restitution falls with impact speed (lively soft touches, deader slams); pocket jaws are softer than the rails
   so a ball that clips a jaw at modest pace drops instead of rattling out, while slammed balls can still jaw. */
const eCush = (vn, jaw) => jaw ? .5 + .26 * Math.min(1, vn / 1600) : .9 - .22 * Math.min(1, vn / 2000);
const CG = 34, SG = 26, HOLE = 22, HOLE2 = (HOLE + 2) * (HOLE + 2), CD = 16, FR = 62;   // a ball drops once its centre is over the drawn hole (radius HOLE+2)
/* cushion segments [ax, ay, bx, by] — rails + pocket jaws */
const SEG = [];
const seg = (ax, ay, bx, by) => SEG.push([ax, ay, bx - ax, by - ay, (bx - ax) * (bx - ax) + (by - ay) * (by - ay)]);
seg(CG, 0, L / 2 - SG, 0); seg(L / 2 + SG, 0, L - CG, 0); seg(CG, W, L / 2 - SG, W); seg(L / 2 + SG, W, L - CG, W);
seg(0, CG, 0, W - CG); seg(L, CG, L, W - CG);
for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
  const ox = sx > 0 ? 0 : L, oy = sy > 0 ? 0 : W;
  seg(ox + sx * CG, oy, ox + sx * 12, oy - sy * 16); seg(ox, oy + sy * CG, ox - sx * 16, oy + sy * 12);
}
for (const sy of [1, -1]) { const oy = sy > 0 ? 0 : W; seg(L / 2 - SG, oy, L / 2 - 21, oy - sy * 16); seg(L / 2 + SG, oy, L / 2 + 21, oy - sy * 16); }
const POCK = [[-14, -14], [L / 2, -26], [L + 14, -14], [-14, W + 14], [L / 2, W + 26], [L + 14, W + 14]];
const AIMP = [[5, 5], [L / 2, -3], [L - 5, 5], [5, W - 5], [L / 2, W + 3], [L - 5, W - 5]];
const BCOL = ['#fbf6e8', '#e9b824', '#1f4fa8', '#c8281e', '#5b2d8a', '#e2711d', '#1d7a42', '#7a1f22', '#141414'];
const colOf = n => BCOL[n > 8 ? n - 8 : n];
const groupOf = n => n >= 1 && n <= 7 ? 0 : n >= 9 && n <= 15 ? 1 : -1;
const GN = ['全色', '花色'];
/* power curve: finger travel u (0..1) → shot power p. Dead zone near 0 (release there = cancel), fine control at the soft
   end (half travel ≈ 37 % power), full power at full travel. uOf() is the inverse (for markers). */
const DZ = .045;
const powOf = u => u <= DZ ? 0 : (x => .03 + .97 * x * (.42 + .58 * x))(Math.min(1, (u - DZ) / (1 - DZ)));
const uOf = p => { if (p <= .03) return DZ; const a = .97 * .58, b = .97 * .42, x = (-b + Math.sqrt(b * b + 4 * a * (p - .03))) / (2 * a); return DZ + Math.min(1, x) * (1 - DZ); };
const wheelRate = s => .00035 + .00125 * Math.min(1, Math.max(0, (s - .08) / 1.1));   // fine wheel rad/px: slow drags 4.5× finer
const aimGain = s => .3 + .7 * Math.min(1, Math.max(0, (s - .05) / .55));             // touch swipe aim: slow swipes rotate at 30 %
const wrapA = a => a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a;

/* ---------------- deterministic physics ---------------- */
function mkP(b) {
  const P = {X: new Float64Array(16), Y: new Float64Array(16), VX: new Float64Array(16), VY: new Float64Array(16), WX: new Float64Array(16), WY: new Float64Array(16), ON: new Uint8Array(16)};
  for (let i = 0; i < 16; i++) { P.X[i] = b[i][0]; P.Y[i] = b[i][1]; P.ON[i] = b[i][2]; }
  return P;
}
function copyP(P, Q) { Q.X.set(P.X); Q.Y.set(P.Y); Q.ON.set(P.ON); Q.VX.fill(0); Q.VY.fill(0); Q.WX.fill(0); Q.WY.fill(0); return Q; }
function simulate(P, dx, dy, p, s, rec) {
  const {X, Y, VX, VY, WX, WY, ON} = P;
  const v0 = VMIN + p * (VMAX - VMIN);
  VX[0] = dx * v0; VY[0] = dy * v0; WX[0] = VX[0] * s * 1.25; WY[0] = VY[0] * s * 1.25;
  /* recording (UI playback only): a key frame every REC steps plus one right after every contact, each tagged with its step,
     so playback shows exact contact points instead of interpolating across a bounce */
  const out = {first: -1, railAfter: false, railN: 0, pots: [], frames: rec ? [] : null, fs: rec ? [] : null, ev: rec ? [] : null, steps: 0};
  let railMask = 0, evNow = false;
  const snap = st => { const f = new Float32Array(32); for (let i = 0; i < 16; i++) { f[i * 2] = X[i]; f[i * 2 + 1] = Y[i]; } out.frames.push(f); out.fs.push(st); };
  if (rec) snap(0);
  let step = 0;
  for (; step < MAXSTEP; step++) {
    let moving = false;
    for (let i = 0; i < 16; i++) {
      if (!ON[i]) continue;
      let vx = VX[i], vy = VY[i], wx = WX[i], wy = WY[i];
      if (vx === 0 && vy === 0 && wx === 0 && wy === 0) continue;
      moving = true;
      const sx = vx - wx, sy = vy - wy, sl2 = sx * sx + sy * sy;
      if (sl2 > 1) {
        const sl = Math.sqrt(sl2), a = MU_S * DT;
        if (3.5 * a >= sl) { vx = (5 * vx + 2 * wx) / 7; vy = (5 * vy + 2 * wy) / 7; wx = vx; wy = vy; }
        else { const ux = sx / sl, uy = sy / sl; vx -= a * ux; vy -= a * uy; wx += 2.5 * a * ux; wy += 2.5 * a * uy; }
      } else {
        const sp = Math.sqrt(vx * vx + vy * vy), dec = MU_R * DT;
        if (sp <= dec + .6) { vx = 0; vy = 0; }
        else { const k = (sp - dec) / sp; vx *= k; vy *= k; }
        wx = vx; wy = vy;
      }
      VX[i] = vx; VY[i] = vy; WX[i] = wx; WY[i] = wy;
      X[i] += vx * DT; Y[i] += vy * DT;
    }
    if (!moving) break;
    for (let i = 0; i < 15; i++) {
      if (!ON[i]) continue;
      for (let j = i + 1; j < 16; j++) {
        if (!ON[j]) continue;
        const dx2 = X[j] - X[i]; if (dx2 >= R2 || dx2 <= -R2) continue;
        const dy2 = Y[j] - Y[i]; if (dy2 >= R2 || dy2 <= -R2) continue;
        const d2 = dx2 * dx2 + dy2 * dy2; if (d2 >= RR) continue;
        /* rewind both balls to the exact moment of contact inside this step, so the contact normal (and thus the
           cut angle) matches the ghost-ball geometry the aim line shows, at any speed */
        let px = dx2, py = dy2, back = 0;
        const rvx = VX[j] - VX[i], rvy = VY[j] - VY[i], ra = rvx * rvx + rvy * rvy, rb = px * rvx + py * rvy;
        if (rb < 0 && ra > 1e-6) {
          back = (rb + Math.sqrt(rb * rb - ra * (d2 - RR))) / ra; if (back > DT) back = DT;
          X[i] -= VX[i] * back; Y[i] -= VY[i] * back; X[j] -= VX[j] * back; Y[j] -= VY[j] * back;
          px = X[j] - X[i]; py = Y[j] - Y[i];
        }
        let d = Math.sqrt(px * px + py * py), nx = 1, ny = 0;
        if (d > 1e-9) { nx = px / d; ny = py / d; } else d = 0;
        if (d < R2 - 1e-6) { const push = (R2 - d) / 2; X[i] -= nx * push; Y[i] -= ny * push; X[j] += nx * push; Y[j] += ny * push; }
        const vr = (VX[i] - VX[j]) * nx + (VY[i] - VY[j]) * ny;
        if (vr > 0) {
          const J = (1 + E_BALL) / 2 * vr;
          /* cut-induced throw: contact friction drags the struck ball slightly along the striker's tangential motion (≤ ~1.7°) */
          const vt = (VY[i] - VY[j]) * nx - (VX[i] - VX[j]) * ny, lim = MU_B * J;
          let Jt = vt / 7; Jt = Jt > lim ? lim : Jt < -lim ? -lim : Jt;
          VX[i] -= J * nx - Jt * ny; VY[i] -= J * ny + Jt * nx; VX[j] += J * nx - Jt * ny; VY[j] += J * ny + Jt * nx;
          if (out.first < 0 && i === 0) out.first = j;
          if (rec) { out.ev.push([out.frames.length, 0, i, vr, j]); evNow = true; }
        }
        if (back) { X[i] += VX[i] * back; Y[i] += VY[i] * back; X[j] += VX[j] * back; Y[j] += VY[j] * back; }
      }
    }
    for (let i = 0; i < 16; i++) {
      if (!ON[i]) continue;
      const x = X[i], y = Y[i];
      if (x > R + 1 && x < L - R - 1 && y > R + 1 && y < W - R - 1) continue;
      let pk = -1;
      for (let k = 0; k < 6; k++) { const ex = x - POCK[k][0], ey = y - POCK[k][1]; if (ex * ex + ey * ey < HOLE2) { pk = k; break; } }
      if (pk < 0 && (x < -40 || x > L + 40 || y < -40 || y > W + 40)) {
        let bd = 1e18; for (let k = 0; k < 6; k++) { const ex = x - POCK[k][0], ey = y - POCK[k][1], dd = ex * ex + ey * ey; if (dd < bd) { bd = dd; pk = k; } }
      }
      if (pk >= 0) {
        if (rec) { out.ev.push([out.frames.length, 2, i, pk, Math.sqrt(VX[i] * VX[i] + VY[i] * VY[i])]); evNow = true; }
        ON[i] = 0; VX[i] = VY[i] = WX[i] = WY[i] = 0; X[i] = POCK[pk][0]; Y[i] = POCK[pk][1];
        out.pots.push(i);
        continue;
      }
      for (let k = 0; k < SEG.length; k++) {
        const sg = SEG[k];
        let t = ((X[i] - sg[0]) * sg[2] + (Y[i] - sg[1]) * sg[3]) / sg[4];
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = sg[0] + sg[2] * t, qy = sg[1] + sg[3] * t, ex = X[i] - qx, ey = Y[i] - qy, d2 = ex * ex + ey * ey;
        if (d2 >= R * R) continue;
        const d = Math.sqrt(d2); if (d < 1e-9) continue;
        const nx = ex / d, ny = ey / d;
        X[i] = qx + nx * R; Y[i] = qy + ny * R;
        const vn = VX[i] * nx + VY[i] * ny;
        if (vn < 0) {
          const e1 = 1 + eCush(-vn, k >= 6);
          VX[i] -= e1 * vn * nx; VY[i] -= e1 * vn * ny;
          const wn = WX[i] * nx + WY[i] * ny; if (wn < 0) { WX[i] -= e1 * wn * nx; WY[i] -= e1 * wn * ny; }
          if (out.first >= 0) out.railAfter = true;
          if (i > 0) railMask |= 1 << i;
          if (rec) { out.ev.push([out.frames.length, 1, i, -vn]); evNow = true; }
        }
      }
    }
    if (rec && (evNow || step % REC === REC - 1)) { snap(step + 1); evNow = false; }
  }
  VX.fill(0); VY.fill(0); WX.fill(0); WY.fill(0);
  out.steps = step;
  if (rec) snap(step + 1);
  let m = railMask, c = 0; while (m) { c += m & 1; m >>>= 1; } out.railN = c;
  return out;
}
/* 8-ball referee. pre = st before the shot (positions/on flags pre-shot). */
function judge(st, sh, res) {
  const brk = st.brk, g = st.grp[sh];
  const ownLeft = g < 0 ? -1 : countGroup(st.b, g);
  const pots = res.pots, scratch = pots.includes(0), eight = pots.includes(8);
  const objs = pots.filter(n => n !== 0 && n !== 8);
  let foul = '';
  if (scratch) foul = '白球落袋';
  else if (res.first < 0) foul = '白球没有碰到任何球';
  else if (!brk) {
    if (g < 0) { if (res.first === 8) foul = '开放球局不能先碰黑八'; }
    else if (ownLeft === 0) { if (res.first !== 8) foul = '应先击打黑八'; }
    else if (groupOf(res.first) !== g) foul = res.first === 8 ? '先碰到了黑八' : '先碰到了对方的球';
    if (!foul && !pots.length && !res.railAfter) foul = '击球后没有球碰库';
  } else if (!objs.length && !eight && res.railN < 4) foul = '开球不合格（需进球或至少四球碰库）';
  const r = {foul, win: false, lose: false, cont: false, assign: -1, respot8: false, scratch, objs, eight};
  if (eight) {
    if (brk) r.respot8 = true;
    else if (foul) { r.lose = true; r.why = '打进黑八时犯规（' + foul + '）'; return r; }
    else if (g < 0 || ownLeft > 0) { r.lose = true; r.why = '本方球未清完就打进了黑八'; return r; }
    else { r.win = true; r.why = '清台后合法打进黑八'; return r; }
  }
  if (foul) return r;
  if (brk) { r.cont = objs.length > 0 || eight; return r; }
  if (g < 0) { if (objs.length) { r.assign = groupOf(objs[0]); r.cont = true; } }
  else r.cont = objs.some(n => groupOf(n) === g);
  return r;
}
function countGroup(b, g) { let c = 0; for (let n = 1; n < 16; n++) if (b[n][2] && groupOf(n) === g) c++; return c; }
function freeAt(b, x, y, skip0) {
  for (let n = skip0 ? 1 : 0; n < 16; n++) { if (!b[n][2]) continue; const dx = b[n][0] - x, dy = b[n][1] - y; if (dx * dx + dy * dy < RR + .01) return false; }
  return true;
}
function legalSpot(b, x, y, kitchen) { return x >= R && x <= (kitchen ? HEAD : L - R) && y >= R && y <= W - R && freeAt(b, x, y, true); }
/* deterministic nearest-free spot search (used for respotting / sanitising placements) */
function findFree(b, x, y, kitchen, skip0) {
  const ok = (px, py) => px >= R && px <= (kitchen ? HEAD : L - R) && py >= R && py <= W - R && freeAt(b, px, py, skip0);
  if (ok(x, y)) return [x, y];
  for (let r = 4; r < 600; r += 4) for (let k = 0; k < 16; k++) {
    const ang = [[1, 0], [.92, .38], [.71, .71], [.38, .92], [0, 1], [-.38, .92], [-.71, .71], [-.92, .38], [-1, 0], [-.92, -.38], [-.71, -.71], [-.38, -.92], [0, -1], [.38, -.92], [.71, -.71], [.92, -.38]][k];
    const px = x + ang[0] * r, py = y + ang[1] * r; if (ok(px, py)) return [px, py];
  }
  return [HEAD, W / 2];
}

/* ---------------- AI geometry helpers ---------------- */
function pathClear(b, ax, ay, bx, by, i1, i2, rad) {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
  for (let n = 0; n < 16; n++) {
    if (n === i1 || n === i2 || !b[n][2]) continue;
    let t = ((b[n][0] - ax) * vx + (b[n][1] - ay) * vy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = b[n][0] - ax - vx * t, ey = b[n][1] - ay - vy * t;
    if (ex * ex + ey * ey < rad * rad) return false;
  }
  return true;
}
/* object-ball departure (ox,oy) and cue-ball deflection (cx,cy) for a cue ball moving along d that contacts with normal n —
   mirrors simulate()'s collision incl. throw, so the aim line and the AI agree with the physics */
function throwDir(dx, dy, nx, ny) {
  const J = (1 + E_BALL) / 2 * (dx * nx + dy * ny), lim = MU_B * J;
  let Jt = (dy * nx - dx * ny) / 7; Jt = Jt > lim ? lim : Jt < -lim ? -lim : Jt;
  const ox = J * nx - Jt * ny, oy = J * ny + Jt * nx, l = Math.hypot(ox, oy) || 1;
  return {ox: ox / l, oy: oy / l, cx: dx - ox, cy: dy - oy};   // (cx,cy): cue ball velocity left over (per unit speed)
}
function potGeo(b, cx, cy, t, k) {
  const bx = b[t][0], by = b[t][1], ax = AIMP[k][0], ay = AIMP[k][1];
  let ux = ax - bx, uy = ay - by; const d2 = Math.hypot(ux, uy); ux /= d2; uy /= d2;
  if ((k === 1 || k === 4) && Math.abs(uy) < .5) return null;     // side pockets need a steep entry
  if (k !== 1 && k !== 4) { const ix = k % 3 === 0 ? 1 : -1, iy = k < 3 ? 1 : -1; if (-ux * ix < -.2 || -uy * iy < -.2) return null; }
  /* ghost ball, over-cut a touch to cancel throw (2 fixed-point iterations) */
  let nx = ux, ny = uy, gx = 0, gy = 0, vx = 0, vy = 0, d1 = 0;
  for (let it = 0; it < 3; it++) {
    gx = bx - nx * R2; gy = by - ny * R2; vx = gx - cx; vy = gy - cy; d1 = Math.hypot(vx, vy); if (d1 < 1) return null; vx /= d1; vy /= d1;
    if (it === 2 || vx * nx + vy * ny < .1) break;
    const o = throwDir(vx, vy, nx, ny), sa = o.ox * uy - o.oy * ux, ca = Math.sqrt(Math.max(0, 1 - sa * sa));
    const rx = nx * ca - ny * sa, ry = nx * sa + ny * ca; nx = rx; ny = ry;
  }
  const cs = vx * ux + vy * uy; if (cs < .22) return null;
  if (!pathClear(b, cx, cy, gx, gy, 0, t, R2 - .5)) return null;
  if (!pathClear(b, bx, by, ax, ay, 0, t, R2 - 2)) return null;
  const ease = cs * cs / (1 + d1 / 700 + d2 / 450);
  return {dx: vx, dy: vy, cs, d1, d2, ease, t, k, gx, gy};
}
function targetsFor(st, seat) {
  const g = st.grp[seat], out = [];
  if (g >= 0 && countGroup(st.b, g) === 0) return [8];
  for (let n = 1; n < 16; n++) if (st.b[n][2] && n !== 8 && (g < 0 || groupOf(n) === g)) out.push(n);
  return out.length ? out : [8];
}
function options(b, cx, cy, targets) {
  let best = 0, cnt = 0;
  for (const t of targets) for (let k = 0; k < 6; k++) { const o = potGeo(b, cx, cy, t, k); if (o) { cnt++; if (o.ease > best) best = o.ease; } }
  return best + Math.min(cnt, 6) * .08;
}

BX.register({
  id: 'billiards', title: '桌球·八球', cat: 'arcade', order: 1, sub: '十五球开局，黑八定输赢',
  desc: '经典美式八球：开球后打进一颗球即定全色或花色，清完本方七球再合法打进黑八获胜。真实的碰撞、库边与高低杆，电脑三档难度。',
  kind: 'turn', seats: 2, seatColors: ['#c23a2b', '#2f5d8a'], noTurnChime: false, firstLabel: '开球', aiDelay: 300,
  howto: ['<b>瞄准</b>：手指在球台上划动转动球杆（划得越慢越精细），轻点某颗球直接对准它；用鼠标时球杆指向光标。侧边<b>微调轮</b>可拖、可甩，按住两端连续细调。', '<b>出杆</b>：拖动<b>力度条</b>，或按住白球沿球杆向后拉，松手出杆；前半段力度更细腻，拖回起点松手即取消。“杆法”小球设高杆 / 低杆。', '瞄准线按真实碰撞（含微小的切球偏移）画出目标球走向，能进袋时袋口亮起绿圈；自由球时直接拖动白球摆放。', '击球中点一下快进，再点一下直接看结果；💡 会对准推荐线路并在力度条上标出建议力度。键盘：←→ 瞄准（Shift 更细，按住加速）、↑↓ 力度、W/S 杆法、空格出杆。'],
  rules: `<p><b>器材</b>：一颗白色主球，十五颗目标球：1–7 号为<b>全色球</b>，9–15 号为<b>花色球</b>，8 号为<b>黑八</b>。开局摆成三角形，黑八居中。</p>
<p><b>开球</b>：白球放在开球线（球台左侧/下方淡线）后任意位置击打。开球须有球入袋，或至少四颗目标球碰库，否则判犯规。开球打进黑八：黑八放回置球点，开球方继续。开球后球台为<b>开放球局</b>。</p>
<p><b>定色</b>：开放球局时（开球之后），第一颗被合法打进的球决定该选手的球组（全色或花色），对手为另一组。开放球局可以先碰任意全色或花色球，但不能先碰黑八。</p>
<p><b>连续击球</b>：合法打进本方球即可继续击球；没有进本方球则换对手。打进对方的球不算犯规，但不能继续。</p>
<p><b>犯规</b>（对手获得<b>自由球</b>，可把白球放在台面任意位置）：白球落袋；白球没碰到任何球；白球首先碰到的不是本方球（清台后须先碰黑八）；碰球后没有任何球进袋、也没有任何球碰库。开球时白球落袋，对手的自由球须放在开球线后。</p>
<p><b>胜负</b>：清完本方七球后，合法打进黑八者<b>获胜</b>。未清完本方球就打进黑八、或打进黑八的同时犯规（如白球落袋），<b>直接判负</b>。</p>
<p><b>操作</b>：触屏在球台上划动转动球杆（慢划更精细），轻点某颗球即对准该球；鼠标则球杆指向光标。拖动侧边<b>微调轮</b>精细调整（可甩动、按住两端连续调）。按住白球沿球杆向后拉可直接蓄力，松手出杆；也可拖动侧边的<b>力度条</b>出杆（拖回起点松手即取消）。点击或拖动“杆法”小球设置高杆（跟进）/低杆（缩杆）。自由球时直接拖动白球摆放。键盘：←→ 微调方向（按住 Shift 更细），↑↓ 力度，W/S 杆法，空格出杆。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#7a2f1c', dark: '#3a120a', seed: 5});
    g.fillStyle = '#226a4c'; D.rr(g, 12, 12, w - 24, h - 24, 8); g.fill();
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .6); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; D.rr(g, 12, 12, w - 24, h - 24, 8); g.fill();
    g.fillStyle = '#0c0805'; for (const [x, y] of [[14, 14], [w / 2, 11], [w - 14, 14], [14, h - 14], [w / 2, h - 11], [w - 14, h - 14]]) { D.circle(g, x, y, 9); g.fill(); }
    const r = 10, ox = 128, oy = h / 2, nums = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5];
    let k = 0;
    for (let c = 0; c < 4; c++) for (let j = 0; j <= c; j++) { const n = nums[k++]; const x = ox + c * r * 1.75, y = oy + (j - c / 2) * r * 2.02; D.disc(g, x, y, r, n > 8 ? '#fbf6e8' : colOf(n), {shadow: true}); if (n > 8) { g.save(); D.circle(g, x, y, r); g.clip(); g.fillStyle = colOf(n); g.fillRect(x - r, y - r * .5, r * 2, r); g.restore(); } }
    D.disc(g, 52, oy + 4, r, '#fbf6e8');
    g.save(); g.translate(52, oy + 4); g.rotate(.18); const sg = g.createLinearGradient(0, -3, 0, 3); sg.addColorStop(0, '#e9c98c'); sg.addColorStop(1, '#8a5a2a');
    g.fillStyle = sg; g.fillRect(-120, -3, 104, 6); g.fillStyle = '#f4ecd8'; g.fillRect(-18, -2.6, 5, 5.2); g.fillStyle = '#2a1408'; g.fillRect(-120, -3.4, 40, 6.8); g.fillStyle = '#c8a052'; g.fillRect(-82, -3.4, 3, 6.8); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.setLineDash([4, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(64, oy + 2); g.lineTo(ox - r * 1.2, oy - 1); g.stroke(); g.setLineDash([]);
  },
  _t: {simulate, mkP, judge, potGeo},
  create(ctx) {
    const st = {b: [], turn: 0, grp: [-1, -1], bih: 'k', brk: true, shots: 0, over: false, winner: -1, note: null};
    /* rack: apex on the foot spot, 8 in the middle, one solid + one stripe in the back corners */
    {
      const solids = [1, 2, 3, 4, 5, 6, 7], stripes = [9, 10, 11, 12, 13, 14, 15];
      ctx.rng.shuffle(solids); ctx.rng.shuffle(stripes);
      const cornerS = solids.pop(), cornerT = stripes.pop();
      const rest = ctx.rng.shuffle(solids.concat(stripes));
      const slots = []; for (let c = 0; c < 5; c++) for (let j = 0; j <= c; j++) slots.push([c, j]);
      st.b = [[HEAD - 20, W / 2, 1]]; for (let n = 1; n < 16; n++) st.b.push([0, 0, 1]);
      const dx = (R2 + .15) * .8660254, gap = R2 + .15;
      const flip = ctx.rng() < .5;
      slots.forEach(([c, j], i) => {
        let n;
        if (c === 2 && j === 1) n = 8; else if (c === 4 && j === 0) n = flip ? cornerS : cornerT; else if (c === 4 && j === 4) n = flip ? cornerT : cornerS; else n = rest.pop();
        st.b[n] = [FOOTX + c * dx, FOOTY + (j - c / 2) * gap, 1];
      });
    }
    const cv = ctx.canvas();
    /* ---------- UI state (never part of st) ---------- */
    let aim = {dx: 1, dy: 0}, kbPow = .55, spin = 0, place = null, placeBad = false, drag = null, aimFor = -1;
    let play = null, playId = 0, phase = new Array(16).fill(0), rdir = new Array(16).fill(0).map(() => [1, 0]);
    let parts = [], shake = 0, banner = null, remoteAim = null, lastSend = 0, bg = null, bgKey = '', wheelPh = 0, hintMk = null;
    let pend = null, wheelV = 0, kRep = 0, remoteShow = null, sq = {c: 0, r: 0};
    const myTurn = () => ctx.canAct(st.turn) && !play && !st.over && !pend;
    /* impact sounds synthesised per hit, loudness/pitch scaled by speed (aggregated to one click per frame) */
    const sfxOn = () => !ctx.fast && !BX.sfx.muted, jit = () => 1 + (Math.random() - .5) * .1;
    const snd = {
      click(v) { const k = Math.min(1, v / 1700), vol = .04 + .42 * Math.sqrt(k); BX.sfx.noise(.022 + .016 * k, vol, 'highpass', (2400 + 1600 * k) * jit(), 0, .9); BX.sfx.tone('sine', (1700 + 900 * k) * jit(), 1200, .05, vol * .45); },
      rail(v) { const k = Math.min(1, v / 1600), vol = .04 + .3 * Math.sqrt(k); BX.sfx.tone('sine', (120 + 70 * k) * jit(), 70, .1, vol); BX.sfx.noise(.05, vol * .6, 'lowpass', 600 + 500 * k, 250, 1); },
      cue(p) { const vol = .1 + .32 * p; BX.sfx.noise(.03, vol, 'bandpass', (1500 + 900 * p) * jit(), 700, 2.2); BX.sfx.tone('sine', (520 + 260 * p) * jit(), 260, .06, vol * .7); },
      drop(v) { const k = Math.min(1, (v || 300) / 1200), vol = .14 + .3 * k; BX.sfx.noise(.09, vol, 'bandpass', 900 * jit(), 380, 2.4); BX.sfx.tone('sine', 150 * jit(), 70, .16, vol * .8, .03); BX.sfx.noise(.05, vol * .5, 'bandpass', 2200, 1200, 3, .06 + .04 * (1 - k)); },
    };
    /* ---------- layout ---------- */
    function lay() {
      const w = cv.w, h = cv.h, portrait = h > w * 1.02, TW = L + 2 * FR, TH = W + 2 * FR;
      let f, panel;
      if (portrait) { const ph = BX.clamp(h * .14, 96, 132); f = BX.fit(w, h - ph, TH, TW, 4); panel = {x: 0, y: h - ph, w, h: ph, horiz: true}; }
      else { const pw = BX.clamp(w * .14, 96, 150); f = BX.fit(w - pw, h, TW, TH, 4); panel = {x: w - pw, y: 0, w: pw, h, horiz: false}; }
      const s = f.s, ox = f.x + FR * s, oy = f.y + FR * s;
      const P = panel;
      let spinW, pw, nudge;
      if (P.horiz) {
        const sr = Math.min(34, P.h * .32); spinW = {x: P.x + 14 + sr, y: P.y + P.h / 2, r: sr};
        nudge = {x: P.w - 12 - 100, y: P.y + P.h / 2 - 22 + 6, w: 100, h: 44};
        const x0 = spinW.x + sr + 18, x1 = nudge.x - 14; pw = {x: x0, y: P.y + P.h / 2 - 17, w: Math.max(60, x1 - x0), h: 34, horiz: true};
      } else {
        const sr = Math.min(34, P.w * .3); spinW = {x: P.x + P.w / 2, y: P.y + 16 + sr, r: sr};
        const ny = spinW.y + sr + 38, ww = Math.min(100, P.w - 10); nudge = {x: P.x + (P.w - ww) / 2, y: ny, w: ww, h: 44};
        const y0 = ny + 44 + 30; pw = {x: P.x + P.w / 2 - 17, y: y0, w: 34, h: Math.max(60, P.y + P.h - 16 - y0), horiz: false};
      }
      return {portrait, s, ox, oy, f, panel, spinW, pw, nudge, w, h};
    }
    let V = lay();
    const T = (x, y) => V.portrait ? [V.ox + y * V.s, V.oy + (L - x) * V.s] : [V.ox + x * V.s, V.oy + y * V.s];
    const inv = (px, py) => V.portrait ? {x: L - (py - V.oy) / V.s, y: (px - V.ox) / V.s} : {x: (px - V.ox) / V.s, y: (py - V.oy) / V.s};
    function tableXf(g, sx = 0, sy = 0) {
      const d = cv.dpr;
      if (V.portrait) g.setTransform(0, -V.s * d, V.s * d, 0, (V.ox + sx) * d, (V.oy + L * V.s + sy) * d);
      else g.setTransform(V.s * d, 0, 0, V.s * d, (V.ox + sx) * d, (V.oy + sy) * d);
    }
    const screenXf = g => g.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0);
    /* ---------- helpers ---------- */
    const cuePos = () => st.bih && myTurn() && place ? place : st.b[0];
    function initAim() {
      if (aimFor === st.shots) return; aimFor = st.shots;
      const c = st.b[0];
      if (st.bih) { place = st.b[0][2] && legalSpot(st.b, st.b[0][0], st.b[0][1], st.bih === 'k') ? [st.b[0][0], st.b[0][1]] : findFree(st.b, HEAD - 20, W / 2, st.bih === 'k', true); placeBad = false; }
      const cp = st.bih ? place : c;
      const tg = st.brk ? [1] : targetsFor(st, st.turn);
      let best = null, bd = 1e9;
      for (const n of tg) { if (!st.b[n][2]) continue; const d = Math.hypot(st.b[n][0] - cp[0], st.b[n][1] - cp[1]); if (d < bd) { bd = d; best = n; } }
      if (st.brk) { let ax = FOOTX, ay = FOOTY; for (let n = 1; n < 16; n++) if (st.b[n][0] < ax) { ax = st.b[n][0]; ay = st.b[n][1]; } best = null; const l = Math.hypot(ax - cp[0], ay - cp[1]); aim = {dx: (ax - cp[0]) / l, dy: (ay - cp[1]) / l}; return; }
      if (best != null) { const l = Math.hypot(st.b[best][0] - cp[0], st.b[best][1] - cp[1]) || 1; aim = {dx: (st.b[best][0] - cp[0]) / l, dy: (st.b[best][1] - cp[1]) / l}; }
    }
    function rotAim(a) { const c = Math.cos(a), s = Math.sin(a); aim = {dx: aim.dx * c - aim.dy * s, dy: aim.dx * s + aim.dy * c}; sendAim(); }
    function sendAim(pw) {
      if (!ctx.online) return; const now = performance.now(); if (now - lastSend < 90) return; lastSend = now;
      const c = cuePos(); ctx.send({aim: [+aim.dx.toFixed(4), +aim.dy.toFixed(4), +(pw || 0).toFixed(2), Math.round(c[0]), Math.round(c[1])]});
    }
    function shoot(p, u) {
      if (!myTurn()) return;
      if (st.bih && (!place || !legalSpot(st.b, place[0], place[1], st.bih === 'k'))) { ctx.toast('这里放不下白球'); ctx.sfx('error'); return; }
      const a = {dx: aim.dx, dy: aim.dy, p: Math.round(BX.clamp(p, 0, 1) * 1000) / 1000, s: spin};
      if (st.bih) { a.cx = place[0]; a.cy = place[1]; }
      kbPow = a.p;
      /* the cue strikes from where the player drew it back, right now (60–110 ms, harder = faster) — online guests see it
         immediately instead of after the host round trip */
      pend = {t0: performance.now(), pull: 6 + (u != null ? u : uOf(a.p)) * 95, p: a.p, ms: 110 - 50 * a.p, shots: st.shots, a, cue: cuePos().slice(0, 2)};
      ctx.act(a, st.turn);
    }
    function tapAim(p) {   // quick tap on the table: aim straight at the tapped ball (full hit), or at the tapped spot
      const t = inv(p.x, p.y), c = cuePos(); let tx = t.x, ty = t.y, bd = (R2 + 16 / V.s) ** 2;
      for (let n = 1; n < 16; n++) { if (!st.b[n][2]) continue; const d = (st.b[n][0] - t.x) ** 2 + (st.b[n][1] - t.y) ** 2; if (d < bd) { bd = d; tx = st.b[n][0]; ty = st.b[n][1]; } }
      const l = Math.hypot(tx - c[0], ty - c[1]); if (l < 2) return;
      aim = {dx: (tx - c[0]) / l, dy: (ty - c[1]) / l}; ctx.sfx('tick'); sendAim();
    }
    /* ---------- input ---------- */
    const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    const cap = e => { try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {} };
    const pullRange = () => Math.min(220, Math.max(140, Math.min(cv.w, cv.h) * .42));
    function setPow(d, u) {
      const was = d.u > DZ; d.u = u; d.p = powOf(u); d.peak = Math.max(d.peak, u);
      if (was !== (u > DZ) && d.peak > DZ * 2) ctx.sfx('tick');       // crossing into / out of the cancel zone
      sendAim(d.p);
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e); V = V.w === cv.w && V.h === cv.h ? V : lay();
      const sw = V.spinW; wheelV = 0;
      if (play && !st.over) { speedUp(); return; }
      if (Math.hypot(p.x - sw.x, p.y - sw.y) < sw.r + 10) { spin = Math.round(BX.clamp((sw.y - p.y) / sw.r, -1, 1) * 4) / 4; ctx.sfx('tick'); drag = {m: 'spin'}; cap(e); return; }
      const nb = V.nudge;
      if (inRect(p, {x: nb.x - 4, y: nb.y - 8, w: nb.w + 8, h: nb.h + 16})) {
        if (myTurn()) { const cx = nb.x + nb.w / 2; drag = {m: 'wheel', last: p.x, lt: e.timeStamp, moved: 0, v: 0, sd: p.x < cx ? -1 : 1, edge: Math.abs(p.x - cx) > nb.w * .28, t0: performance.now(), rep: 0, acc: 0}; cap(e); }
        return;
      }
      const pr = V.pw, prx = {x: pr.x - 14, y: pr.y - 10, w: pr.w + 28, h: pr.h + 20};
      if (inRect(p, prx)) { if (myTurn()) { drag = {m: 'power', x0: p.x, y0: p.y, u: 0, p: 0, peak: 0}; cap(e); } return; }
      if (!myTurn()) return;
      const t = inv(p.x, p.y), c = cuePos();
      const [csx, csy] = T(c[0], c[1]), dS = Math.hypot(p.x - csx, p.y - csy);
      cap(e);
      if (st.bih && dS < R * V.s + 26) { drag = {m: 'place', ox: c[0] - t.x, oy: c[1] - t.y}; ctx.sfx('select'); return; }
      if (!st.bih && dS < Math.max(36, R * V.s + 22)) {
        // pull the cue straight back along its line: only the component along the stick counts, so the aim never wobbles
        const [ax, ay] = T(c[0] + aim.dx, c[1] + aim.dy), bl = Math.hypot(ax - csx, ay - csy) || 1;
        drag = {m: 'pull', x0: p.x, y0: p.y, bx: (csx - ax) / bl, by: (csy - ay) / bl, u: 0, p: 0, peak: 0}; return;
      }
      if (e.pointerType === 'mouse') { drag = {m: 'aim'}; const l = Math.hypot(t.x - c[0], t.y - c[1]); if (l > 2) { aim = {dx: (t.x - c[0]) / l, dy: (t.y - c[1]) / l}; sendAim(); } return; }
      // touch: relative swipe-to-rotate (finer when slow / far from the ball); a quick tap aims at the tapped ball
      drag = {m: 'aimT', lx: p.x, ly: p.y, lt: e.timeStamp, t0: performance.now(), last: Math.atan2(t.y - c[1], t.x - c[0]), moved: 0, sp: 0};
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!drag) return;
      if (!myTurn()) { drag = null; return; }
      const pts = ctx.points(e, cv.cv), p = pts[pts.length - 1];
      if (drag.m === 'spin') { const sw = V.spinW, ns = Math.round(BX.clamp((sw.y - p.y) / sw.r, -1, 1) * 4) / 4; if (ns !== spin) { spin = ns; ctx.sfx('tick'); } return; }
      if (drag.m === 'wheel') {
        for (const q of pts) {
          const d = q.x - drag.last, dtm = Math.max(1, q.t - drag.lt); drag.last = q.x; drag.lt = q.t; if (!d) continue;
          drag.v = drag.moved ? drag.v * .55 + d / dtm * .45 : d / dtm; drag.moved += Math.abs(d); rotAim(d * wheelRate(Math.abs(drag.v))); wheelPh += d;
        }
        return;
      }
      if (drag.m === 'aim') { const t = inv(p.x, p.y), c = cuePos(), l = Math.hypot(t.x - c[0], t.y - c[1]); if (l > 2) { aim = {dx: (t.x - c[0]) / l, dy: (t.y - c[1]) / l}; sendAim(); } }
      else if (drag.m === 'aimT') {
        const c = cuePos(), [csx, csy] = T(c[0], c[1]);
        for (const q of pts) {
          const dd = Math.hypot(q.x - drag.lx, q.y - drag.ly), dtm = Math.max(1, q.t - drag.lt);
          drag.sp = drag.moved ? drag.sp * .6 + dd / dtm * .4 : dd / dtm; drag.moved += dd; drag.lx = q.x; drag.ly = q.y; drag.lt = q.t;
          const t = inv(q.x, q.y), a = Math.atan2(t.y - c[1], t.x - c[0]);
          if (drag.moved <= 5) continue;               // tap slop: the first few px are applied once the swipe is clearly a swipe
          if (Math.hypot(q.x - csx, q.y - csy) > 26) rotAim(wrapA(a - drag.last) * aimGain(drag.sp));
          drag.last = a;
        }
      } else if (drag.m === 'place') {
        const t = inv(p.x, p.y), k = st.bih === 'k';
        const nx = BX.clamp(t.x + drag.ox, R, k ? HEAD : L - R), ny = BX.clamp(t.y + drag.oy, R, W - R);
        placeBad = !freeAt(st.b, nx, ny, true); place = [nx, ny]; sendAim();
      } else if (drag.m === 'pull') {
        const pr = (p.x - drag.x0) * drag.bx + (p.y - drag.y0) * drag.by;
        setPow(drag, BX.clamp((pr - 8) / pullRange(), 0, 1));
      } else if (drag.m === 'power') {
        const d = V.pw.horiz ? (p.x - drag.x0) : (p.y - drag.y0), len = V.pw.horiz ? V.pw.w : V.pw.h;
        setPow(drag, BX.clamp(Math.abs(d) / (len * .92), 0, 1));
      }
    });
    const up = e => {
      const d = drag; drag = null; if (!d) return;
      if (d.m === 'wheel') {
        if (d.moved < 6 && !d.rep && myTurn()) { rotAim(d.sd * .0035); wheelPh += d.sd * 6; ctx.sfx('tick'); }
        else if (d.moved >= 6 && Math.abs(d.v) > .25 && e.timeStamp - d.lt < 80) wheelV = BX.clamp(d.v, -1.5, 1.5);   // flick: the wheel coasts
      }
      if (d.m === 'aimT' && d.moved < 8 && performance.now() - d.t0 < 350 && myTurn()) tapAim(cv.pos(e));
      if (d.m === 'place') { if (placeBad) { place = findFree(st.b, place[0], place[1], st.bih === 'k', true); placeBad = false; } ctx.sfx('place'); }
      else if (d.m === 'pull' || d.m === 'power') { if (d.p > 0) shoot(d.p, d.u); else if (d.peak > DZ * 2) { ctx.sfx('click'); sendAim(0); } }
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', () => { drag = null; });
    /* ---------- status ---------- */
    function status() {
      for (const s of [0, 1]) { const g = st.grp[s]; ctx.info(s, g < 0 ? '未定色' : GN[g] + '·' + countGroup(st.b, g)); }
      if (st.over) return ctx.status(ctx.name(st.winner) + ' 获胜');
      if (play) return ctx.status(play.fastF ? '快进中… 再点一下直接看结果' : '击球中… 点球台快进');
      const t = st.turn, g = st.grp[t], tgt = g < 0 ? '' : countGroup(st.b, g) === 0 ? ' · 目标：黑八' : ' · 目标：' + GN[g];
      if (ctx.canAct(t)) {
        initAim();
        const who = ctx.hotseat ? ctx.name(t) + '：' : '';
        if (st.bih) ctx.status(who + (st.brk ? '开球：拖白球在开球线后摆放，拖力度条出杆' : '自由球！拖动白球摆放，再出杆') + tgt);
        else ctx.status(who + (st.brk ? '开球！从白球向后拖动蓄力' : '轮到你击球') + tgt);
      } else ctx.status('等待 ' + ctx.name(t) + ' 击球…' + tgt);
    }
    /* ---------- AI ---------- */
    function aiMove(seat, level) {
      const t0 = performance.now(), budget = BX.test ? 30 : [0, 160, 420, 700][level];
      const maxSims = BX.test ? 10 : [0, 6, 28, 90][level];
      const noise = [0, .03, .011, .0025][level], pnoise = [0, .16, .07, .025][level];
      const rnd = () => (Math.random() + Math.random() + Math.random() - 1.5) / .5;
      const finish = (a) => {
        const an = rnd() * noise, c = Math.cos(an), s = Math.sin(an);
        const dx = a.dx * c - a.dy * s, dy = a.dx * s + a.dy * c, l = Math.hypot(dx, dy);
        const out = {dx: dx / l, dy: dy / l, p: Math.round(BX.clamp(a.p * (1 + rnd() * pnoise), .02, 1) * 1000) / 1000, s: a.s || 0};
        if (st.bih) { out.cx = a.cx; out.cy = a.cy; }
        return out;
      };
      if (st.brk) {
        let ax = FOOTX, ay = FOOTY; for (let n = 1; n < 16; n++) if (st.b[n][2] && st.b[n][0] < ax) { ax = st.b[n][0]; ay = st.b[n][1]; }
        const cx = HEAD - 10 - Math.random() * 30, cy = W / 2 + (Math.random() - .5) * (level === 3 ? 30 : 140);
        const l = Math.hypot(ax - cx, ay - cy);
        return finish({dx: (ax - cx) / l, dy: (ay + (Math.random() - .5) * 3 - cy) / l, p: [0, .78, .92, 1][level], s: 0, cx, cy});
      }
      const tg = targetsFor(st, seat), b = st.b, op = 1 - seat;
      /* candidate cue positions */
      let spots = [[b[0][0], b[0][1]]];
      if (st.bih) {
        const k = st.bih === 'k', list = [];
        for (const t of tg) for (let pk = 0; pk < 6; pk++) {
          const bx = b[t][0], by = b[t][1]; let ux = AIMP[pk][0] - bx, uy = AIMP[pk][1] - by; const dd = Math.hypot(ux, uy); ux /= dd; uy /= dd;
          if (!pathClear(b, bx, by, AIMP[pk][0], AIMP[pk][1], 0, t, R2 - 2)) continue;
          for (const dist of [70, 150, 240]) {
            const x = bx - ux * (R2 + dist), y = by - uy * (R2 + dist);
            if (!legalSpot(b, x, y, k)) continue;
            const o = potGeo(b, x, y, t, pk); if (o) list.push([x, y, o.ease + Math.random() * .05]);
          }
        }
        list.sort((p, q) => q[2] - p[2]);
        spots = list.slice(0, level === 1 ? 2 : 4).map(q => [q[0], q[1]]);
        if (!spots.length) spots = [findFree(b, k ? HEAD - 40 : L / 2, W / 2, k, true)];
      }
      /* candidate shots */
      const cands = [];
      for (const sp of spots) for (const t of tg) for (let pk = 0; pk < 6; pk++) {
        const o = potGeo(b, sp[0], sp[1], t, pk); if (!o) continue;
        o.cx = sp[0]; o.cy = sp[1]; cands.push(o);
      }
      cands.sort((p, q) => q.ease - p.ease);
      const nC = [0, 3, 6, 10][level];
      const base = mkP(b), work = mkP(b);
      const tryShot = (sh) => {
        copyP(base, work); work.X[0] = sh.cx; work.Y[0] = sh.cy; work.ON[0] = 1;
        const pre = st.b; const bb = pre.map(q => q.slice()); bb[0] = [sh.cx, sh.cy, 1];
        const res = simulate(work, sh.dx, sh.dy, sh.p, sh.s, false);
        const j = judge({b: bb, brk: false, grp: st.grp}, seat, res);
        if (j.win) return 1e6; if (j.lose) return -1e6;
        const after = []; for (let n = 0; n < 16; n++) after.push([work.X[n], work.Y[n], work.ON[n]]);
        const myG = j.assign >= 0 ? j.assign : st.grp[seat];
        const myT = (g => { if (g < 0) return []; const o = []; for (let n = 1; n < 16; n++) if (after[n][2] && groupOf(n) === g) o.push(n); return o.length ? o : [8]; })(myG);
        const opT = (g => { if (g < 0) { const o = []; for (let n = 1; n < 16; n++) if (after[n][2] && n !== 8) o.push(n); return o; } const o = []; for (let n = 1; n < 16; n++) if (after[n][2] && groupOf(n) === g) o.push(n); return o.length ? o : [8]; })(myG < 0 ? -1 : 1 - myG);
        let sc = 0;
        const ownPot = j.objs.filter(n => myG >= 0 && groupOf(n) === myG).length, oppPot = j.objs.length - ownPot;
        sc += ownPot * 60 - oppPot * 25;
        if (j.foul) sc -= 500;
        else if (j.cont) { sc += 500; if (level >= 2) sc += options(after, after[0][0], after[0][1], myT) * (level === 3 ? 220 : 90); }
        else if (level >= 2 && after[0][2]) sc -= options(after, after[0][0], after[0][1], opT) * (level === 3 ? 160 : 60);
        return sc;
      };
      const scored = [];
      let sims = 0;
      const vNeed = o => { const vo = Math.sqrt(2 * MU_R * (o.d2 + 40)) / .71 / (.97 * Math.max(o.cs, .3)); return Math.sqrt(vo * vo + 2 * MU_R * o.d1) / .78; };
      outer:
      for (const o of cands.slice(0, nC)) {
        const v = vNeed(o), base0 = BX.clamp((v - VMIN) / (VMAX - VMIN), .05, 1);
        const pows = level === 1 ? [base0 * 1.3] : [base0 * 1.15, base0 * 1.6, base0 * 2.3];
        const spins = level === 3 ? [0, -.5, .5] : [0];
        for (const s of spins) for (const pf of pows) {
          if (sims >= maxSims || (sims > 0 && performance.now() - t0 > budget)) break outer;
          const sh = {dx: o.dx, dy: o.dy, p: BX.clamp(pf, .03, 1), s, cx: o.cx, cy: o.cy};
          sims++; scored.push([sh, tryShot(sh)]);
        }
      }
      let bestSc = scored.length ? Math.max(...scored.map(q => q[1])) : -1e9;
      /* safeties / fallbacks: hit a legal ball full or slightly cut */
      if (bestSc < 200) {
        const sp = spots[0];
        const fb = tg.filter(n => b[n][2]).map(n => ({n, d: Math.hypot(b[n][0] - sp[0], b[n][1] - sp[1]), clear: pathClear(b, sp[0], sp[1], b[n][0], b[n][1], 0, n, R2 - .5)}))
          .sort((p, q) => (q.clear - p.clear) || (p.d - q.d));
        for (const f of fb.slice(0, 4)) for (const off of [0, .6, -.6]) for (const pw of [.22, .42]) {
          if (sims >= maxSims + 8 || (sims > 0 && performance.now() - t0 > budget * 1.3)) break;
          const vx = b[f.n][0] - sp[0], vy = b[f.n][1] - sp[1], l = Math.hypot(vx, vy);
          let dx = vx / l, dy = vy / l; const a = off * R / l; const c = Math.cos(a), s = Math.sin(a); [dx, dy] = [dx * c - dy * s, dx * s + dy * c];
          const sh = {dx, dy, p: pw + f.d / 2500, s: 0, cx: sp[0], cy: sp[1]};
          sims++; scored.push([sh, tryShot(sh) - 5]);
        }
        if (!scored.length) { const n = fb.length ? fb[0].n : 8, vx = b[n][0] - sp[0], vy = b[n][1] - sp[1], l = Math.hypot(vx, vy) || 1; scored.push([{dx: vx / l, dy: vy / l, p: .45, s: 0, cx: sp[0], cy: sp[1]}, 0]); }
      }
      return finish(BX.ai.byLevel(scored, level));
    }
    /* ---------- apply ---------- */
    /* playback of the recorded shot. Time map: real-time-ish (1.25×) while balls are fast, speeding up to ~2.35× while
       everything is just creeping to a stop; a short hit-stop (≈40–70 ms) on the hardest contacts. */
    function startPlayback(res, a, preCue, offBefore, loc) {
      if (play && play.anim) play.anim.cancel();
      const id = ++playId, fr = res.frames, fs = res.fs, n = fr.length, SM = 1000 / 360;
      const cum = new Float64Array(n), hold = new Float32Array(n);
      let nh = 0, lastH = -99;
      for (const e of res.ev) if (e[1] === 0 && e[3] > 1300 && nh < 2 && e[0] - lastH > 12 && e[0] < n) { hold[e[0]] = 38 + Math.min(30, (e[3] - 1300) / 30); nh++; lastH = e[0]; }
      for (let i = 1; i < n; i++) {
        const A = fr[i - 1], B = fr[i], ds = Math.max(1, fs[i] - fs[i - 1]);
        let m2 = 0; for (let q = 0; q < 32; q += 2) { const ex = B[q] - A[q], ey = B[q + 1] - A[q + 1], dd = ex * ex + ey * ey; if (dd > m2 && dd < 49 * ds * ds) m2 = dd; }
        const rate = 1.25 + 1.1 * Math.max(0, 1 - Math.sqrt(m2) / ds * 360 / 350);
        cum[i] = cum[i - 1] + hold[i - 1] + ds * SM / rate;
      }
      const preMs = loc ? Math.max(0, loc.ms - (performance.now() - loc.t0)) : 300;
      play = {id, offBefore, frames: fr, fs, ev: res.ev, ei: 0, k: 0, cum, hold, fi: 0, preMs, T: preMs + cum[n - 1] + 60, a, cue: preCue, loc, pots: new Map(), struck: false};
      play.done = () => {
        if (!play || play.id !== id) return;
        play = null; aimFor = -1;
        if (st.note) banner = {note: st.note, t: 2.6};
        status(); ctx.poke();
      };
      play.anim = ctx.anim(play.T, k => { if (play && play.id === id) play.k = k; }, play.done, t => t);
    }
    /* tap during the shot → rest plays 4× faster (collision clicks muted); tap again → jump straight to the result */
    function speedUp() {
      if (!play) return;
      const P = play;
      if (P.fastF) { P.anim.cancel(); P.k = 1; P.done(); return; }
      const k0 = P.k; P.fastF = true; P.anim.cancel(); status();
      P.anim = ctx.anim(Math.max(60, (1 - k0) * P.T / 4), k => { if (play === P) P.k = k0 + (1 - k0) * k; }, P.done, t => t);
    }
    /* cue stick offset before contact (e < 0 ms): the player's own shot strikes from its drawn-back position with an accelerating
       stroke; AI / remote shots get a short draw-back, pause and strike so the watcher can read power */
    function stickPull(e) {
      const P = play;
      if (P.loc) { const kk = BX.clamp(1 + e / P.loc.ms, 0, 1); return P.loc.pull * (1 - kk * kk) - 4 * kk; }
      const kk = BX.clamp(1 + e / P.preMs, 0, 1), back = 14 + 76 * P.a.p;
      if (kk < .6) return 6 + (back - 6) * BX.ease.out(kk / .6);
      if (kk < .72) return back;
      const q = (kk - .72) / .28; return back * (1 - q * q) - 4 * q;
    }
    function strikeFx(p, loc) {
      if (sfxOn()) snd.cue(p);
      if (loc && !ctx.isAI(st.turn)) ctx.buzz(Math.round(4 + 16 * p));
      if (p > .8) shake = Math.max(shake, 1.5 + 3 * (p - .8) / .2);
    }
    const inst = {
      st,
      // host keeps a remote seat's turn open during its own playback (the guest gates on its own animation; avoids rejected requests)
      toMove: () => st.over ? null : play && !(ctx.online && ctx.isHost && ctx.isRemote(st.turn)) ? null : st.turn,
      valid(a) {
        if (!a || ![a.dx, a.dy, a.p].every(Number.isFinite) || Math.abs(a.dx) + Math.abs(a.dy) < 1e-6) return false;
        if (st.bih && !(Number.isFinite(a.cx) && Number.isFinite(a.cy) && legalSpot(st.b, a.cx, a.cy, st.bih === 'k'))) return false;
        return true;
      },
      apply(a, by) {
        const sh = st.turn, op = 1 - sh;
        const loc = pend && pend.shots === st.shots && ctx.isLocal(sh) ? pend : null; pend = null;
        if (st.bih) {
          let x = +a.cx, y = +a.cy; if (!Number.isFinite(x) || !Number.isFinite(y)) { x = HEAD - 20; y = W / 2; }
          const k = st.bih === 'k'; x = BX.clamp(x, R, k ? HEAD : L - R); y = BX.clamp(y, R, W - R);
          st.b[0] = findFree(st.b, x, y, k, true).concat([1]);
        }
        let dx = +a.dx || 0, dy = +a.dy || 0; const l = Math.sqrt(dx * dx + dy * dy);
        if (l < 1e-9) { dx = 1; dy = 0; } else { dx /= l; dy /= l; }
        const p = BX.clamp(+a.p || 0, 0, 1), s = BX.clamp(+a.s || 0, -1, 1);
        const P = mkP(st.b), preCue = [st.b[0][0], st.b[0][1]], offBefore = st.b.map(q => !q[2]);
        const res = simulate(P, dx, dy, p, s, !ctx.fast);
        const j = judge(st, sh, res); hintMk = null;
        if (j.foul && ctx.isLocal(sh) && !ctx.isAI(sh)) ctx.buzz(30);
        for (let n = 0; n < 16; n++) st.b[n] = [P.X[n], P.Y[n], P.ON[n]];
        st.shots++;
        if (j.respot8) { st.b[8] = findFree(st.b, FOOTX, FOOTY, false, false).concat([1]); }
        const wasBrk = st.brk; st.brk = false;
        if (j.win || j.lose) {
          st.over = true; st.winner = j.win ? sh : op; st.note = ['end', sh, j.why]; st.bih = null;
        } else {
          if (j.assign >= 0) { st.grp[sh] = j.assign; st.grp[op] = 1 - j.assign; }
          if (j.foul) { st.turn = op; st.bih = j.scratch && wasBrk ? 'k' : 'a'; st.note = ['foul', sh, j.foul, j.assign]; }
          else if (j.cont) { st.bih = null; st.note = ['cont', sh, j.respot8 ? '黑八放回置球点' : '', j.assign]; }
          else { st.turn = op; st.bih = null; st.note = ['miss', sh, '', j.assign]; }
          if (!st.b[0][2]) st.b[0] = findFree(st.b, HEAD - 20, W / 2, st.bih === 'k', true).concat([1]);
        }
        if (!ctx.fast) startPlayback(res, {dx, dy, p, s}, preCue, offBefore, loc);
        status();
        if (st.over) ctx.end({winner: st.winner, text: j.why, delay: (play ? play.T : 0) + 700});
      },
      aiMove,
      onTurn: status,
      /* 💡: point the cue along the strongest AI's shot (incl. ball-in-hand spot, spin) and mark its power on the bar */
      showHint(a) {
        if (!myTurn()) return;
        initAim();
        aim = {dx: a.dx, dy: a.dy}; spin = BX.clamp(Math.round((a.s || 0) * 4) / 4, -1, 1); kbPow = a.p;
        if (st.bih && Number.isFinite(a.cx)) { place = [a.cx, a.cy]; placeBad = !legalSpot(st.b, a.cx, a.cy, st.bih === 'k'); }
        hintMk = {shots: st.shots, p: a.p, t0: performance.now()}; sendAim();
        ctx.toast('已对准推荐线路 · 建议力度 ' + Math.round(a.p * 100) + '%' + (BX.TOUCH.matches ? '（把力度条拖到金色标记）' : '（空格出杆，或把力度条拖到金色标记）') + '');
      },
      onMsg(m, by) { if (m && m.aim) remoteAim = {a: m.aim, t: performance.now()}; },
      _dbg: () => ({play: play && {e: play.k * play.T - play.preMs, T: play.T, pre: play.preMs, fast: !!play.fastF}, pend: !!pend, aim, mine: myTurn(), V: {portrait: V.portrait, pw: V.pw, nudge: V.nudge}, cue: T(cuePos()[0], cuePos()[1])}),
      key(e) {
        if (!myTurn()) return;
        const fine = e.shiftKey ? .0012 : .006, sg = 1;
        kRep = e.repeat ? kRep + 1 : 0;
        const acc = 1 + Math.min(3, kRep * .1);     // held arrow keys speed up
        if (e.code === 'ArrowLeft') rotAim(-fine * sg * acc); else if (e.code === 'ArrowRight') rotAim(fine * sg * acc);
        else if (e.code === 'ArrowUp') kbPow = BX.clamp(kbPow + .05, .05, 1); else if (e.code === 'ArrowDown') kbPow = BX.clamp(kbPow - .05, .05, 1);
        else if (e.code === 'KeyW') spin = BX.clamp(spin + .25, -1, 1); else if (e.code === 'KeyS') spin = BX.clamp(spin - .25, -1, 1);
        else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); shoot(kbPow); }
      },
      resize() { V = lay(); bgKey = ''; },
      frame(dt) { draw(dt); },
    };
    /* ---------- drawing ---------- */
    function drawTable(g) {
      // lacquered wooden frame
      g.save();
      g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, -FR + 6, -FR + 10, L + 2 * FR, W + 2 * FR, 34); g.fill();
      D.wood(g, -FR, -FR, L + 2 * FR, W + 2 * FR, {r: 34, base: '#7c2c18', dark: '#2e0e06', seed: 21, grain: .22});
      const lq = g.createLinearGradient(0, -FR, 0, W + FR); lq.addColorStop(0, 'rgba(255,190,140,.16)'); lq.addColorStop(.5, 'rgba(0,0,0,0)'); lq.addColorStop(1, 'rgba(0,0,0,.25)');
      g.fillStyle = lq; D.rr(g, -FR, -FR, L + 2 * FR, W + 2 * FR, 34); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.75)'; g.lineWidth = 2.2; D.rr(g, -FR + 7, -FR + 7, L + 2 * FR - 14, W + 2 * FR - 14, 28); g.stroke();
      g.strokeStyle = 'rgba(230,197,125,.35)'; g.lineWidth = 1; D.rr(g, -FR + 12, -FR + 12, L + 2 * FR - 24, W + 2 * FR - 24, 24); g.stroke();
      // gold cloud motifs at the corners
      for (const [x, y] of [[-FR + 30, -FR + 30], [L + FR - 30, -FR + 30], [-FR + 30, W + FR - 30], [L + FR - 30, W + FR - 30]]) {
        g.strokeStyle = 'rgba(230,197,125,.55)'; g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 1.6); g.stroke(); g.beginPath(); g.arc(x, y, 4, Math.PI, Math.PI * 2.7); g.stroke();
      }
      // felt bed incl. cushions
      g.fillStyle = '#18523a'; g.fillRect(-CD, -CD, L + 2 * CD, W + 2 * CD);
      const fg = g.createRadialGradient(L / 2, W / 2, 40, L / 2, W / 2, L * .62); fg.addColorStop(0, '#2f8a62'); fg.addColorStop(1, '#1d6447');
      g.fillStyle = fg; g.fillRect(0, 0, L, W);
      // felt nap texture
      const r = BX.rng(9); g.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 500; i++) g.fillRect(r() * L, r() * W, 2, 1);
      g.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 500; i++) g.fillRect(r() * L, r() * W, 2, 1);
      // cushions (slightly darker rubber with shading)
      const cush = (pts, nx, ny) => {
        g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
        g.fillStyle = '#1a5a40'; g.fill();
        const [a, b2] = [pts[0], pts[1]]; g.strokeStyle = 'rgba(160,230,190,.35)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b2[0], b2[1]); g.stroke();
      };
      cush([[CG, 0], [L / 2 - SG, 0], [L / 2 - 21, -CD], [12, -CD]]); cush([[L / 2 + SG, 0], [L - CG, 0], [L - 12, -CD], [L / 2 + 21, -CD]]);
      cush([[CG, W], [L / 2 - SG, W], [L / 2 - 21, W + CD], [12, W + CD]]); cush([[L / 2 + SG, W], [L - CG, W], [L - 12, W + CD], [L / 2 + 21, W + CD]]);
      cush([[0, CG], [0, W - CG], [-CD, W - 12], [-CD, 12]]); cush([[L, CG], [L, W - CG], [L + CD, W - 12], [L + CD, 12]]);
      // pockets
      for (const [x, y] of POCK) {
        g.fillStyle = 'rgba(0,0,0,.35)'; D.circle(g, x, y, HOLE + 6); g.fill();
        const pg = g.createRadialGradient(x, y, 2, x, y, HOLE + 2); pg.addColorStop(0, '#000'); pg.addColorStop(.75, '#0b0604'); pg.addColorStop(1, '#2a1a10');
        g.fillStyle = pg; D.circle(g, x, y, HOLE + 2); g.fill();
        g.strokeStyle = 'rgba(200,160,82,.85)'; g.lineWidth = 3; g.beginPath();
        const ang = Math.atan2(y - W / 2, x - L / 2); g.arc(x, y, HOLE + 5, ang - 1.4, ang + 1.4); g.stroke();
      }
      // sights (mother-of-pearl diamonds)
      g.fillStyle = 'rgba(245,232,200,.85)';
      const dia = (x, y) => { g.beginPath(); g.moveTo(x, y - 4.5); g.lineTo(x + 3.2, y); g.lineTo(x, y + 4.5); g.lineTo(x - 3.2, y); g.closePath(); g.fill(); };
      for (let k = 1; k < 8; k++) { if (k === 4) continue; dia(k * L / 8, -CD - 10); dia(k * L / 8, W + CD + 21); }
      for (let k = 1; k < 4; k++) { dia(-CD - 21, k * W / 4); dia(L + CD + 21, k * W / 4); }
      // head string, foot spot, center spot
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(HEAD, 0); g.lineTo(HEAD, W); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(HEAD, W / 2, 70, Math.PI / 2, Math.PI * 1.5); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; for (const [x, y] of [[FOOTX, FOOTY], [HEAD, W / 2], [L / 2, W / 2]]) { D.circle(g, x, y, 2.5); g.fill(); }
      // faint seal in the felt
      g.globalAlpha = .07; g.fillStyle = '#e6c57d'; g.font = '700 64px ' + BX.F.deco; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('百戏', L / 2, W / 2); g.globalAlpha = 1;
      g.restore();
    }
    function ball(g, x, y, n, k = 1, ph = 0, dir = [1, 0]) {
      const r = R * k, P = V.portrait, lx = P ? .4 : -.35, ly = P ? -.35 : -.4;
      g.fillStyle = 'rgba(0,0,0,.3)'; D.circle(g, x + (P ? -3 : 2.2), y + (P ? 2.2 : 3), r); g.fill();
      g.save(); D.circle(g, x, y, r); g.clip();
      const base = n > 8 ? '#fbf6e8' : colOf(n);
      g.fillStyle = base; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      const sn = Math.sin(ph), cs = Math.cos(ph), ox = dir[0] * sn * r * .85, oy = dir[1] * sn * r * .85;
      if (n > 8) { // stripe band rolls with the ball
        g.save(); g.translate(x + ox * .7, y + oy * .7); g.transform(dir[0], dir[1], -dir[1], dir[0], 0, 0);
        g.fillStyle = colOf(n); g.fillRect(-r * .55 * Math.max(.35, Math.abs(cs)), -r * 2, r * 1.1 * Math.max(.35, Math.abs(cs)), r * 4); g.restore();
      }
      if (n > 0 && cs > -.15 && r > 6) {
        const lk = .45 + .55 * Math.max(0, cs);
        g.fillStyle = '#fbf6e8'; g.beginPath(); g.ellipse(x + ox, y + oy, r * .48, r * .48 * lk, Math.atan2(dir[1], dir[0]) + Math.PI / 2, 0, Math.PI * 2); g.fill();
        if (r > 8) { g.save(); g.translate(x + ox, y + oy); g.rotate(-Math.PI / 2 * (V.portrait ? -1 : 0)); g.fillStyle = '#1b1510'; g.font = `800 ${r * .62}px ${BX.F.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 0, r * .04); g.restore(); }
      }
      if (n === 0) { g.fillStyle = 'rgba(200,40,30,.5)'; D.circle(g, x + ox, y + oy, r * .14); g.fill(); }
      const sh = g.createRadialGradient(x + r * lx, y + r * ly, r * .05, x, y, r * 1.05);
      sh.addColorStop(0, 'rgba(255,255,255,.75)'); sh.addColorStop(.25, 'rgba(255,255,255,.08)'); sh.addColorStop(.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.42)');
      g.fillStyle = sh; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      g.restore();
    }
    function cueStick(g, cx, cy, dx, dy, pull, alpha = 1) {
      g.save(); g.globalAlpha = alpha; g.translate(cx, cy); g.rotate(Math.atan2(dy, dx) + Math.PI);
      const off = R + 4 + pull, len = 560;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(off + 4, -2, len, 9);
      const sg = g.createLinearGradient(0, -6, 0, 6); sg.addColorStop(0, '#f0d9a6'); sg.addColorStop(.5, '#c9955a'); sg.addColorStop(1, '#7a4a20');
      g.fillStyle = sg; g.beginPath(); g.moveTo(off, -2.6); g.lineTo(off + len, -6.5); g.lineTo(off + len, 6.5); g.lineTo(off, 2.6); g.closePath(); g.fill();
      g.fillStyle = '#3a6a9a'; g.fillRect(off - 1, -2.6, 3, 5.2);
      g.fillStyle = '#f6efdc'; g.fillRect(off + 2, -2.8, 12, 5.6);
      const bg2 = g.createLinearGradient(0, -7, 0, 7); bg2.addColorStop(0, '#5a1a10'); bg2.addColorStop(.5, '#2a0c06'); bg2.addColorStop(1, '#120402');
      g.fillStyle = bg2; g.beginPath(); g.moveTo(off + len * .58, -5); g.lineTo(off + len, -6.5); g.lineTo(off + len, 6.5); g.lineTo(off + len * .58, 5); g.closePath(); g.fill();
      g.fillStyle = '#c8a052'; for (const q of [.58, .6, .97]) g.fillRect(off + len * q, -6, 3, 12);
      g.restore();
    }
    function guide(g, cx, cy, dx, dy, b) {
      // find first ball along the ray
      let tBest = 1e9, hit = -1;
      for (let n = 1; n < 16; n++) {
        if (!b[n][2]) continue; const ex = b[n][0] - cx, ey = b[n][1] - cy, tc = ex * dx + ey * dy; if (tc <= 0) continue;
        const pd2 = ex * ex + ey * ey - tc * tc; if (pd2 >= RR) continue; const t = tc - Math.sqrt(RR - pd2); if (t < tBest) { tBest = t; hit = n; }
      }
      // rails
      let tr = 1e9; if (dx > 0) tr = Math.min(tr, (L - R - cx) / dx); if (dx < 0) tr = Math.min(tr, (R - cx) / dx); if (dy > 0) tr = Math.min(tr, (W - R - cy) / dy); if (dy < 0) tr = Math.min(tr, (R - cy) / dy);
      const t = Math.min(tBest, tr), gx = cx + dx * t, gy = cy + dy * t;
      g.save(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.6; g.setLineDash([7, 6]);
      g.beginPath(); g.moveTo(cx + dx * R, cy + dy * R); g.lineTo(gx, gy); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; D.circle(g, gx, gy, R); g.stroke();
      if (hit >= 0 && tBest <= tr) {
        let nx = b[hit][0] - gx, ny = b[hit][1] - gy; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
        const cs = dx * nx + dy * ny, ok = st.brk || targetsFor(st, st.turn).includes(hit), th = throwDir(dx, dy, nx, ny);
        const pk = ok && ctx.pref('hints') ? pocketOf(b, hit, th.ox, th.oy) : null;
        g.strokeStyle = ok ? 'rgba(255,220,120,.9)' : 'rgba(255,90,70,.9)'; g.lineWidth = 2.2;
        const len = pk ? pk.t : 40 + 140 * cs;
        g.beginPath(); g.moveTo(b[hit][0], b[hit][1]); g.lineTo(b[hit][0] + th.ox * len, b[hit][1] + th.oy * len); g.stroke();
        if (pk) { const [qx, qy] = POCK[pk.k], k2 = performance.now() / 160; g.strokeStyle = `rgba(90,230,150,${.7 + .25 * Math.sin(k2)})`; g.lineWidth = 3.5; D.circle(g, qx, qy, HOLE + 4); g.stroke(); }
        let tx = th.cx, ty = th.cy; const tl = Math.hypot(tx, ty);
        if (tl > .05) { tx /= tl; ty /= tl; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + tx * 80 * tl, gy + ty * 80 * tl); g.stroke(); }
        if (!ok) { g.strokeStyle = 'rgba(255,90,70,.9)'; g.lineWidth = 2; D.circle(g, b[hit][0], b[hit][1], R + 3); g.stroke(); }
      }
      g.restore();
    }
    /* where would object ball `hit` go along (nx,ny)? → {k: pocket, t: distance} if it reaches a pocket mouth before another ball / a cushion */
    function pocketOf(b, hit, nx, ny) {
      const ox = b[hit][0], oy = b[hit][1];
      let tObs = 1e9;
      for (let m = 0; m < 16; m++) {
        if (m === hit || !b[m][2]) continue; const ex = b[m][0] - ox, ey = b[m][1] - oy, tc = ex * nx + ey * ny; if (tc <= 0) continue;
        const pd2 = ex * ex + ey * ey - tc * tc; if (pd2 < RR) tObs = Math.min(tObs, tc - Math.sqrt(RR - pd2));
      }
      let t = 1e9, xLine = false;
      if (nx > 0 && (L - R - ox) / nx < t) { t = (L - R - ox) / nx; xLine = true; } if (nx < 0 && (R - ox) / nx < t) { t = (R - ox) / nx; xLine = true; }
      if (ny > 0 && (W - R - oy) / ny < t) { t = (W - R - oy) / ny; xLine = false; } if (ny < 0 && (R - oy) / ny < t) { t = (R - oy) / ny; xLine = false; }
      if (!(t < tObs)) return null;
      const cx = ox + nx * t, cy = oy + ny * t;
      const mouth = xLine ? (cy < CG + 2 || cy > W - CG - 2) : (cx < CG + 2 || cx > L - CG - 2 || Math.abs(cx - L / 2) < SG - 4);
      if (!mouth) return null;
      let best = 0, bd = 1e18; for (let k = 0; k < 6; k++) { const dx = POCK[k][0] - cx, dy = POCK[k][1] - cy, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } }
      return {k: best, t: t + 8};
    }
    function sunkRack(g) {
      // ball tray on the far rail: every object ball, faded once pocketed; owner's colour chip next to each group
      const onNow = n => play ? !play.offBefore[n] && !(play.pots.get(n) && play.pots.get(n).done) : !!st.b[n][2];
      const y = -CD - 31, xs = n => n < 8 ? 70 + (n - 1) * 26 : n === 8 ? 300 : L - 226 + (n - 9) * 26;
      for (let n = 1; n < 16; n++) {
        const x = xs(n); g.fillStyle = 'rgba(0,0,0,.45)'; D.circle(g, x, y, 10); g.fill();
        if (onNow(n)) ball(g, x, y, n, .72); else { g.globalAlpha = .22; ball(g, x, y, n, .72); g.globalAlpha = 1; }
      }
      for (const s of [0, 1]) {
        const gp = st.grp[s]; if (gp < 0) continue;
        const x = gp === 0 ? 46 : L - 46; g.fillStyle = ctx.color(s); D.circle(g, x, y, 7); g.fill();
        g.strokeStyle = st.turn === s && !st.over ? '#ffe39a' : 'rgba(255,255,255,.5)'; g.lineWidth = st.turn === s ? 2.5 : 1; g.stroke();
      }
    }
    function draw(dt) {
      const g = cv.g; cv.clear();
      if (V.w !== cv.w || V.h !== cv.h) V = lay();
      // cached static table
      const key = cv.w + 'x' + cv.h + '@' + cv.dpr;
      if (key !== bgKey) {
        bgKey = key; bg = bg || document.createElement('canvas'); bg.width = Math.round(cv.w * cv.dpr); bg.height = Math.round(cv.h * cv.dpr);
        const bgc = bg.getContext('2d'); bgc.clearRect(0, 0, bg.width, bg.height); tableXf(bgc); drawTable(bgc);
      }
      feelTick(dt);
      shake = Math.max(0, shake - dt * 30);
      const sx = shake ? (Math.random() - .5) * shake : 0, sy = shake ? (Math.random() - .5) * shake : 0;
      g.setTransform(1, 0, 0, 1, sx * cv.dpr, sy * cv.dpr); g.drawImage(bg, 0, 0);
      tableXf(g, sx, sy);
      // balls
      let pos = st.b.map(q => [q[0], q[1], q[2]]), stickA = null, vel = null;
      if (play) {
        const e = play.k * play.T - play.preMs, fr = play.frames, fl = fr.length;
        if (e < 0) {
          const f = fr[0]; for (let n = 0; n < 16; n++) pos[n] = [f[n * 2], f[n * 2 + 1], play.offBefore[n] ? 0 : 1];
          stickA = [play.cue[0], play.cue[1], play.a.dx, play.a.dy, stickPull(e), 1];
        } else {
          if (!play.struck) { play.struck = true; strikeFx(play.a.p, play.loc); }
          const cum = play.cum, hold = play.hold;
          while (play.fi < fl - 2 && cum[play.fi + 1] <= e) play.fi++;
          const fi = play.fi, seg = cum[fi + 1] - cum[fi] - hold[fi], lc = e - cum[fi] - hold[fi];
          const frc = fl < 2 || lc <= 0 ? 0 : Math.min(1, lc / seg);
          const A = fr[fi], B = fr[Math.min(fl - 1, fi + 1)], ds = Math.max(1, play.fs[Math.min(fl - 1, fi + 1)] - play.fs[fi]) / 360;
          while (play.ei < play.ev.length && play.ev[play.ei][0] <= fi) fire(play.ev[play.ei++]);
          flushSnd();
          vel = [];
          for (let n = 0; n < 16; n++) {
            const x = A[n * 2] + (B[n * 2] - A[n * 2]) * frc, y = A[n * 2 + 1] + (B[n * 2 + 1] - A[n * 2 + 1]) * frc;
            const old = play.last ? play.last[n] : null;
            if (old) { const mx = x - old[0], my = y - old[1], md = Math.hypot(mx, my); if (md > .01 && md < 40) { phase[n] += md / R; rdir[n] = [mx / md, my / md]; } }
            pos[n] = [x, y, 1]; vel.push([(B[n * 2] - A[n * 2]) / ds, (B[n * 2 + 1] - A[n * 2 + 1]) / ds]);
          }
          play.last = pos.map(q => [q[0], q[1]]);
          for (let n = 0; n < 16; n++) { const pk = play.pots.get(n); if (pk) { vel[n] = null; pk.t += dt * 4; if (pk.t >= 1) { pk.done = true; pos[n][2] = 0; } else { pos[n] = [pk.x + (POCK[pk.k][0] - pk.x) * pk.t, pk.y + (POCK[pk.k][1] - pk.y) * pk.t, 1 - pk.t]; } } else if (wasOffBefore(n)) pos[n][2] = 0; }
          if (e < 140) { const q = e / 140; stickA = [play.cue[0], play.cue[1], play.a.dx, play.a.dy, -4 - 22 * Math.sin(q * Math.PI / 2) * (.4 + .6 * play.a.p), 1 - q]; }   // follow-through
        }
      } else if (st.bih && myTurn() && place) pos[0] = [place[0], place[1], 1];
      sunkRack(g);
      const mine = myTurn();
      if (mine && !st.over) {
        const c = pos[0];
        if (st.bih) {
          g.fillStyle = 'rgba(255,255,255,.06)'; if (st.bih === 'k') g.fillRect(0, 0, HEAD, W);
          g.strokeStyle = placeBad ? 'rgba(255,80,60,.9)' : 'rgba(255,230,160,.85)'; g.lineWidth = 2; g.setLineDash([4, 4]);
          D.circle(g, c[0], c[1], R + 9 + Math.sin(performance.now() / 200) * 2); g.stroke(); g.setLineDash([]);
        }
        guide(g, c[0], c[1], aim.dx, aim.dy, pos);
      }
      // motion streaks on fast balls
      if (vel) {
        g.save(); g.lineCap = 'round';
        for (let n = 0; n < 16; n++) {
          const v = vel[n], q = pos[n]; if (!v || !q[2]) continue; const sp = Math.hypot(v[0], v[1]); if (sp < 800) continue;
          const len = Math.min(70, sp * .03), ux = v[0] / sp, uy = v[1] / sp;
          const gr = g.createLinearGradient(q[0], q[1], q[0] - ux * len, q[1] - uy * len); gr.addColorStop(0, `rgba(255,250,235,${.1 + .14 * Math.min(1, (sp - 800) / 1200)})`); gr.addColorStop(1, 'rgba(255,250,235,0)');
          g.strokeStyle = gr; g.lineWidth = R * 1.5; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0] - ux * len, q[1] - uy * len); g.stroke();
        }
        g.restore();
      }
      for (let n = 15; n >= 0; n--) { const q = pos[n]; if (!q[2]) continue; ball(g, q[0], q[1], n, q[2] < 1 ? .55 + .45 * q[2] : 1, phase[n], rdir[n]); }
      // cue stick
      if (stickA) cueStick(g, stickA[0], stickA[1], stickA[2], stickA[3], stickA[4], stickA[5]);
      else if (pend && !play) {   // own shot sent, waiting for the host: the strike already happened locally
        const kk = Math.min(1, (performance.now() - pend.t0) / pend.ms), a = pend.a;
        cueStick(g, pend.cue[0], pend.cue[1], a.dx, a.dy, pend.pull * (1 - kk * kk) - 4 * kk);
      } else if (mine && !st.over) {
        const u = drag && (drag.m === 'pull' || drag.m === 'power') ? drag.u : 0;
        const trem = u > .85 ? Math.sin(performance.now() / 24) * 1.4 * (u - .85) / .15 : 0;   // tension at full draw
        cueStick(g, pos[0][0], pos[0][1], aim.dx, aim.dy, 6 + u * 95 + trem);
      } else if (!play && !st.over && remoteAim && ctx.isRemote(st.turn) && performance.now() - remoteAim.t < 4000) {
        const a = remoteAim.a, k = 1 - Math.exp(-dt / .07);   // ease toward the opponent's latest aim (sent ~11×/s)
        if (!remoteShow) remoteShow = a.slice(); else for (let q = 0; q < 5; q++) remoteShow[q] += (a[q] - remoteShow[q]) * k;
        const r = remoteShow, l = Math.hypot(r[0], r[1]) || 1; cueStick(g, r[3], r[4], r[0] / l, r[1] / l, 6 + r[2] * 90, .55);
      } else remoteShow = null;
      // particles
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.t -= dt; if (p.t <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92;
        g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = p.c;
        if (p.ring) { g.strokeStyle = p.c; g.lineWidth = 2; D.circle(g, p.x, p.y, R * (p.rs ? .6 : 1) + (1 - p.t / p.t0) * 22 * (p.rs || 1)); g.stroke(); }
        else { D.circle(g, p.x, p.y, p.r); g.fill(); }
      }
      g.globalAlpha = 1;
      screenXf(g);
      drawPanel(g);
      if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; else drawBanner(g, banner); }
    }
    function wasOffBefore(n) { return play ? play.offBefore[n] : false; }
    /* per-frame UI dynamics: fine-wheel coasting after a flick, press-and-hold on the wheel ends (accelerating) */
    function feelTick(dt) {
      if (pend && !play && performance.now() - pend.t0 > 3000) pend = null;      // request lost → unlock
      if (wheelV) {
        if (!myTurn()) wheelV = 0;
        else { const d = wheelV * dt * 1000; rotAim(d * wheelRate(Math.abs(wheelV)) * .6); wheelPh += d; wheelV *= Math.exp(-dt / .11); if (Math.abs(wheelV) < .03) wheelV = 0; }
      }
      if (drag && drag.m === 'wheel' && drag.edge && drag.moved < 6 && myTurn()) {
        const held = performance.now() - drag.t0;
        if (held > 300) { drag.acc += dt; while (drag.acc >= .05) { drag.acc -= .05; rotAim(drag.sd * .0012 * Math.min(5, 1 + (held - 300) / 350)); wheelPh += drag.sd * 3; if (drag.rep++ % 3 === 0) ctx.sfx('tick'); } }
      }
    }
    function flushSnd() {
      if (sfxOn()) { if (sq.c > 40) snd.click(sq.c); if (sq.r > 90) snd.rail(sq.r); }
      sq.c = sq.r = 0;
    }
    function fire(e) {
      const [f, type, i, v] = e, fr = play.frames[Math.min(f, play.frames.length - 1)];
      if (type === 0) {
        if (!play.fastF) sq.c = Math.max(sq.c, v);
        if (v > 450) { const j = e[4], k = Math.min(1, v / 2000), x = (fr[i * 2] + fr[j * 2]) / 2, y = (fr[i * 2 + 1] + fr[j * 2 + 1]) / 2; parts.push({x, y, vx: 0, vy: 0, t: .14 + .16 * k, t0: .14 + .16 * k, c: `rgba(255,255,255,${.35 + .45 * k})`, ring: true, rs: .4 + .7 * k}); }
        if (v > 1500) shake = Math.max(shake, Math.min(5, (v - 1200) / 160));
      }
      else if (type === 1) { if (!play.fastF) sq.r = Math.max(sq.r, v); }
      else if (type === 2) {
        const ff = play.frames[Math.max(0, f - 1)];
        play.pots.set(i, {x: ff[i * 2], y: ff[i * 2 + 1], k: v, t: 0});
        if (i === 0 || i === 8) ctx.sfx(i === 0 ? 'buzz' : 'gong'); else if (sfxOn()) snd.drop(e[4]);
        const [px, py] = POCK[v], col = i === 0 ? '#ffffff' : colOf(i);
        parts.push({x: px, y: py, vx: 0, vy: 0, t: .45, t0: .45, c: i === 0 ? 'rgba(255,90,70,.9)' : 'rgba(255,225,140,.9)', ring: true});
        for (let k = 0; k < 12; k++) { const a = Math.random() * Math.PI * 2, sp = 160 + Math.random() * 200; parts.push({x: px + Math.cos(a) * 18, y: py + Math.sin(a) * 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: .35 + Math.random() * .25, t0: 1, r: 1.2 + Math.random() * 1.6, c: k % 3 ? '#ffe39a' : col}); }
      }
    }
    function drawPanel(g) {
      const P = V.panel, sw = V.spinW, pr = V.pw, mine = myTurn();
      g.save(); g.globalAlpha = mine ? 1 : .55;
      // spin selector
      D.text(g, '杆法', sw.x, sw.y - sw.r - 8, {size: 11, color: 'rgba(243,226,192,.8)'});
      D.disc(g, sw.x, sw.y, sw.r, '#fbf6e8');
      g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(sw.x - sw.r, sw.y); g.lineTo(sw.x + sw.r, sw.y); g.moveTo(sw.x, sw.y - sw.r); g.lineTo(sw.x, sw.y + sw.r); g.stroke();
      g.fillStyle = C.red; D.circle(g, sw.x, sw.y - spin * sw.r * .72, sw.r * .17); g.fill();
      D.text(g, spin > 0 ? '高杆' : spin < 0 ? '低杆' : '中杆', sw.x, sw.y + sw.r + (P.horiz ? 0 : 10), {size: 11, color: '#f3e2c0', base: P.horiz ? 'top' : 'middle'});
      // fine-aim wheel: drag left/right, or tap its ends
      {
        const nb = V.nudge, cy = nb.y + nb.h / 2;
        g.save(); D.rr(g, nb.x, nb.y, nb.w, nb.h, 12); g.clip();
        const wg = g.createLinearGradient(0, nb.y, 0, nb.y + nb.h); wg.addColorStop(0, '#2a160a'); wg.addColorStop(.5, '#6a4426'); wg.addColorStop(1, '#2a160a');
        g.fillStyle = wg; g.fillRect(nb.x, nb.y, nb.w, nb.h);
        const step = 7, off = ((wheelPh % step) + step) % step;
        for (let x = nb.x - step + off; x < nb.x + nb.w + step; x += step) {
          const u = (x - nb.x) / nb.w * 2 - 1, a = Math.max(0, 1 - u * u);
          g.fillStyle = `rgba(243,226,192,${.12 + .45 * a})`; g.fillRect(x, nb.y + 6, 1.6, nb.h - 12);
        }
        g.restore();
        g.strokeStyle = 'rgba(230,197,125,.55)'; g.lineWidth = 1.2; D.rr(g, nb.x, nb.y, nb.w, nb.h, 12); g.stroke();
        D.text(g, '‹', nb.x + 9, cy, {size: 18, color: '#f3e2c0', weight: 700}); D.text(g, '›', nb.x + nb.w - 9, cy, {size: 18, color: '#f3e2c0', weight: 700});
        D.text(g, '微调', nb.x + nb.w / 2, nb.y - 9, {size: 11, color: 'rgba(243,226,192,.8)'});
      }
      // power bar
      const pd = drag && (drag.m === 'power' || drag.m === 'pull') ? drag : null, v = pd ? pd.u : 0, cancel = pd && pd.peak > DZ * 2 && pd.u <= DZ;
      D.wood(g, pr.x - 5, pr.y - 5, pr.w + 10, pr.h + 10, {r: 10, base: '#5a2414', dark: '#200804', seed: 4, vertical: !pr.horiz});
      g.fillStyle = '#140904'; D.rr(g, pr.x, pr.y, pr.w, pr.h, 7); g.fill();
      if (v > 0) {
        g.save(); D.rr(g, pr.x, pr.y, pr.w, pr.h, 7); g.clip();
        const gr = pr.horiz ? g.createLinearGradient(pr.x, 0, pr.x + pr.w, 0) : g.createLinearGradient(0, pr.y, 0, pr.y + pr.h);
        gr.addColorStop(0, '#3f9f6b'); gr.addColorStop(.55, '#e6c57d'); gr.addColorStop(1, '#d0533f'); g.fillStyle = gr;
        if (pr.horiz) g.fillRect(pr.x, pr.y, pr.w * v, pr.h); else g.fillRect(pr.x, pr.y, pr.w, pr.h * v);
        g.restore();
      } else {
        const kv = uOf(kbPow); g.fillStyle = 'rgba(230,197,125,.25)';
        if (pr.horiz) g.fillRect(pr.x + pr.w * kv - 1, pr.y + 3, 2, pr.h - 6); else g.fillRect(pr.x + 3, pr.y + pr.h * kv - 1, pr.w - 6, 2);
      }
      for (let i = 1; i < 10; i++) { g.fillStyle = 'rgba(255,255,255,.15)'; if (pr.horiz) g.fillRect(pr.x + pr.w * i / 10, pr.y + pr.h - 7, 1, 7); else g.fillRect(pr.x + pr.w - 7, pr.y + pr.h * i / 10, 7, 1); }
      // handle
      const hx = pr.horiz ? pr.x + pr.w * v : pr.x + pr.w / 2, hy = pr.horiz ? pr.y + pr.h / 2 : pr.y + pr.h * v;
      D.disc(g, hx, hy, 13, '#e6c57d', {ring: '#8a6a2c'});
      if (hintMk && hintMk.shots === st.shots && mine) {
        const k = (performance.now() - hintMk.t0) / 1000, hp = uOf(hintMk.p); g.strokeStyle = `rgba(255,215,106,${.65 + .3 * Math.sin(k * 6)})`; g.lineWidth = 3;
        if (pr.horiz) { g.beginPath(); g.moveTo(pr.x + pr.w * hp, pr.y - 4); g.lineTo(pr.x + pr.w * hp, pr.y + pr.h + 4); g.stroke(); }
        else { g.beginPath(); g.moveTo(pr.x - 4, pr.y + pr.h * hp); g.lineTo(pr.x + pr.w + 4, pr.y + pr.h * hp); g.stroke(); }
      }
      D.text(g, cancel ? '松手取消' : pd && pd.p > 0 ? '力度 ' + Math.round(pd.p * 100) + '%' : (pr.horiz ? '拖动力度条出杆 →' : '力度'), pr.x + pr.w / 2, pr.horiz ? pr.y - 13 : pr.y - 20, {size: 11, color: cancel ? '#ffb4a0' : 'rgba(243,226,192,.85)'});
      if (pd && (pd.p > 0 || cancel)) D.text(g, cancel ? '已取消 · 再拉出去可继续' : '松手出杆 · 拖回取消', pr.horiz ? pr.x + pr.w / 2 : V.w / 2, pr.horiz ? pr.y + pr.h + 12 : 12, {size: 10, color: 'rgba(243,226,192,.7)'});
      if (!pr.horiz) D.text(g, '↓', pr.x + pr.w / 2, pr.y + pr.h / 2, {size: 16, color: 'rgba(243,226,192,.35)'});
      g.restore();
    }
    function drawBanner(g, b) {
      const n = b.note, a = Math.min(1, b.t * 2);
      let txt = '';
      if (n[0] === 'foul') txt = '犯规：' + n[2] + ' · ' + ctx.name(1 - n[1]) + ' 自由球';
      else if (n[0] === 'cont') txt = (n[3] >= 0 ? ctx.name(n[1]) + ' 定为' + GN[n[3]] + ' · ' : '') + (n[2] ? n[2] + ' · ' : '') + '进球！继续击球';
      else if (n[0] === 'miss') txt = n[3] >= 0 ? ctx.name(n[1]) + ' 定为' + GN[n[3]] : '';
      else if (n[0] === 'end') txt = n[2];
      if (!txt) return;
      const [cx] = T(L / 2, W / 2), cy = V.portrait ? V.oy + 40 : V.oy + 28;
      g.save(); g.globalAlpha = a; g.font = `700 ${V.portrait ? 13 : 15}px ${BX.F.sans}`;
      const tw = Math.min(cv.w - 20, g.measureText(txt).width + 30);
      g.fillStyle = n[0] === 'foul' ? 'rgba(140,30,20,.88)' : 'rgba(30,18,8,.85)'; D.rr(g, cx - tw / 2, cy - 17, tw, 34, 17); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.6)'; g.lineWidth = 1; g.stroke();
      D.text(g, txt, cx, cy, {size: V.portrait ? 13 : 15, color: '#fbe9d0', maxW: tw - 16});
      g.restore();
    }
    status();
    return inst;
  },
});
