/* 投壶 — ancient banquet arrow-into-pot game. Side view, deterministic arrow flight simulated inside apply. */
const D = BX.draw, C = BX.C, K = BX.data.pk;
const HAND = [0, 1.25], MOUTH_Y = .72, MOUTH_HW = .075, NECK_HW = .095, EAR_X = .14, EAR_IN = .026, EAR_OUT = .036, EAR_TOP = .6, EAR_BOT = .5;
const ARROW_L = .62, G = 9.8, DT = 1 / 200, VMIN = 3, VMAX = 8.6, XIAO_V = 6.4;
const DISTS = [2.4, 2.7, 3.0, 3.3, 3.6];

/* pot silhouette half-width at height y (relative to pot centre) */
function bodyHW(y) {
  if (y < 0) return 0;
  if (y < .05) return .13;
  if (y < .45) { const u = (y - .25) / .2; return .13 + .09 * (1 - u * u); }
  if (y <= MOUTH_Y) return .13 + (NECK_HW - .13) * (y - .45) / (MOUTH_Y - .45);
  return 0;
}
/* is (x,y) (relative to pot) inside solid bronze? */
function solid(x, y) {
  const ax = Math.abs(x);
  if (y >= EAR_BOT && y <= EAR_TOP && ax >= EAR_X - EAR_OUT && ax <= EAR_X + EAR_OUT && Math.abs(ax - EAR_X) >= EAR_IN) return 'ear';
  if (y < 0 || y > MOUTH_Y) return null;
  if (ax > bodyHW(y)) return null;
  if (y > .45 && ax < MOUTH_HW) return null;   // hollow neck
  return 'body';
}
/* deterministic flight. p = {vx, vy, wind, D} → {pts:[[tx,ty,vx,vy]...], res, end:{x,y,dx,dy}, tNear, steps} */
function simulate(p, rec) {
  let tx = HAND[0] + 0, ty = HAND[1], vx = p.vx, vy = p.vy;
  // the arrow is held at its middle: start the tip half an arrow ahead
  { const sp = Math.sqrt(vx * vx + vy * vy) || 1; tx += vx / sp * ARROW_L * .5; ty += vy / sp * ARROW_L * .5; }
  const pts = rec ? [[tx, ty, vx, vy]] : null;
  let res = 'miss', xiao = false, bounces = 0, tNear = -1, step = 0, endDx = 1, endDy = 0;
  const px0 = p.D;
  for (step = 1; step <= 1400; step++) {
    const ox = tx, oy = ty;
    vx += p.wind * DT; vy -= G * DT;
    tx += vx * DT; ty += vy * DT;
    const rx = tx - px0, rox = ox - px0;
    if (tNear < 0 && Math.abs(rx) < .5 && ty < 1.1) tNear = step * DT;
    // crossing the mouth plane downward
    if (!xiao && oy >= MOUTH_Y && ty < MOUTH_Y) {
      const k = (oy - MOUTH_Y) / (oy - ty), cx = rox + (rx - rox) * k;
      if (Math.abs(cx) < MOUTH_HW - .006) {
        if (-vy > XIAO_V) {   // too hard: bounces straight back out (骁)
          xiao = true; tx = px0 + cx; ty = MOUTH_Y + .01; vy = -vy * .42; vx = -vx * .35 - .25;
          if (rec) pts.push([tx, ty, vx, vy, 1]);
          continue;
        }
        const sp = Math.sqrt(vx * vx + vy * vy) || 1; endDx = vx / sp; endDy = vy / sp;
        tx = px0 + cx + endDx * .28; ty = MOUTH_Y + endDy * .28; res = 'mouth';
        // keep the tip inside the neck
        if (Math.abs(tx - px0) > MOUTH_HW - .01) tx = px0 + (tx - px0 > 0 ? 1 : -1) * (MOUTH_HW - .01);
        if (rec) pts.push([tx, ty, vx, vy]);
        break;
      }
    }
    // crossing an ear opening downward
    if (!xiao && oy >= EAR_TOP && ty < EAR_TOP) {
      const k = (oy - EAR_TOP) / (oy - ty), cx = rox + (rx - rox) * k;
      if (Math.abs(Math.abs(cx) - EAR_X) < EAR_IN - .004) {
        const sp = Math.sqrt(vx * vx + vy * vy) || 1; endDx = vx / sp; endDy = vy / sp;
        tx = px0 + cx; ty = EAR_BOT + .01; res = 'ear';
        if (rec) pts.push([tx, ty, vx, vy]);
        break;
      }
    }
    const sd = solid(tx - px0, ty);
    if (sd) {
      bounces++;
      // normal: top surfaces push up, sides push outward
      let nx, ny; const ax = tx - px0;
      if (sd === 'ear') { if (oy >= EAR_TOP) { nx = 0; ny = 1; } else { nx = ax >= 0 ? 1 : -1; ny = 0; } }
      else if (oy > MOUTH_Y - .005) { nx = 0; ny = 1; }
      else { nx = ax >= 0 ? 1 : -1; ny = ty > .45 ? .25 : (ty - .25) * 2; const l = Math.sqrt(nx * nx + ny * ny); nx /= l; ny /= l; }
      const vn = vx * nx + vy * ny;
      if (vn < 0) { vx -= 1.4 * vn * nx; vy -= 1.4 * vn * ny; vx *= .6; vy *= .6; }
      tx = ox; ty = oy;
      if (rec) pts.push([tx, ty, vx, vy, 2]);
      if (bounces > 6) { vx = (ax >= 0 ? 1 : -1) * .6; }
      continue;
    }
    if (ty <= 0) {
      const sp = Math.sqrt(vx * vx + vy * vy) || 1; endDx = vx / sp; endDy = vy / sp;
      ty = 0; res = xiao ? 'xiao' : 'miss';
      if (rec) pts.push([tx, ty, vx, vy]);
      break;
    }
    if (tx < -2 || tx > px0 + 4) { res = xiao ? 'xiao' : 'miss'; break; }
    if (rec && (step & 1) === 0) pts.push([tx, ty, vx, vy]);
  }
  if (res === 'miss' && xiao) res = 'xiao';
  return {pts, res, end: {x: tx, y: ty, dx: endDx, dy: endDy}, tNear, steps: step};
}

const RES_NAME = {mouth: '入壶', ear: '贯耳', xiao: '骁', miss: '不中'};

BX.register({
  id: 'touhu', title: '投壶', cat: 'folk', order: 1, sub: '宴饮雅戏，箭投铜壶',
  desc: '古人宴饮时的雅戏：站定后把箭投进远处的铜壶。入壶得一筹，穿过壶耳得两筹，还有“有初”“连中”“骁”等名目。每轮距离与风向都会变化。',
  kind: 'turn', seats: [1, 4], defSeats: 2, seatColors: ['#b23a2b', '#2f5d8a', '#3f8f5b', '#c8902b'], noFirst: false, aiDelay: 500,
  options: [{key: 'rounds', label: '轮数', choices: [[1, '1 轮'], [3, '3 轮'], [5, '5 轮']], def: 3}],
  rules: `<p><b>投壶</b>是先秦至明清宴饮时的礼仪游戏。主客依次站在规定距离外，把箭（矢）投向一只细颈铜壶。</p>
<p><b>流程：</b>共若干轮（默认 3 轮）。每轮开始时重新确定<b>壶的距离</b>（2.4～3.6 米）和<b>风向风力</b>；每位玩家轮流上场，一次投完 <b>4 支箭</b>。</p>
<p><b>计分（筹）：</b></p>
<ul>
<li><b>入壶</b>：箭落入壶口，得 1 筹。</li>
<li><b>贯耳</b>：箭穿入壶两侧的“耳”，得 2 筹（耳口很小，难度高）。</li>
<li><b>有初</b>：本轮第一支箭就投中（入壶或贯耳），额外 +1 筹。</li>
<li><b>连中</b>：紧接上一支投中的箭再次投中，每次额外 +1 筹。</li>
<li><b>全壶</b>：本轮 4 支箭全部投中，额外 +2 筹。</li>
<li><b>骁</b>：箭入壶口时力道过猛、从壶中反弹而出，古人以接住再投为绝技——记 1 筹并<b>奖励一支额外的箭</b>（每轮最多一次）。骁不算“投中”，会中断连中。</li>
</ul>
<p>撞到壶身、壶沿会弹开，若落地即为不中。全部轮次结束后，<b>总筹数最多者胜</b>（并列则同胜）。单人时可挑战自己的最高纪录。</p>
<p><b>操作：</b>在画面任意处按下并<b>向后拉</b>（像拉弓弦一样），出手方向与拉动方向相反，拉得越长力量越大，松手即投出。虚线为不计风时的前段轨迹；右上角显示风向。键盘：方向键微调角度/力度，空格投出。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f1e3c2'); gr.addColorStop(1, '#dcc59a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    K.mountains(g, 0, h * .1, w, h * .7, {seed: 4, layers: 2, top: .25, alpha: [.15, .25]});
    g.fillStyle = 'rgba(196,70,48,.85)'; D.circle(g, w * .8, h * .2, h * .08); g.fill();
    g.fillStyle = '#6b4426'; g.fillRect(0, h * .86, w, h * .14);
    drawPot(g, w * .62, h * .88, h * .9, 0);
    g.strokeStyle = 'rgba(40,25,10,.5)'; g.lineWidth = 2; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(w * .08, h * .62); g.quadraticCurveTo(w * .3, h * .02, w * .58, h * .3); g.stroke(); g.setLineDash([]);
    drawArrow(g, w * .62, h * .33, .35, .94, h * .55, 1);
    drawArrow(g, w * .56, h * .3, -.18, .98, h * .55, 1);
  },
  create(ctx) {
    K.css();
    const rounds = BX.test ? 1 : (ctx.opts.rounds || 3);
    const st = {n: ctx.n, R: rounds, round: 0, turn: 0, thrown: 0, quota: 4, xiaoUsed: false, streak: 0, firstHit: null,
      D: 3, wind: 0, score: new Array(ctx.n).fill(0), card: BX.range(ctx.n).map(() => new Array(rounds).fill(null)), arrows: [], last: null, over: false, order: BX.range(ctx.n)};
    function newRound() {
      st.D = DISTS[ctx.rng.int(DISTS.length)];
      st.wind = Math.round((ctx.rng() * 2 - 1) * (st.round === 0 ? .6 : 1.3) * 100) / 100;
    }
    newRound();
    const cv = ctx.canvas(), pb = K.playback(ctx), fx = K.fx();
    const ui = ctx.ui('');
    let show = null, aim = {dx: .6, dy: .8, p: .45}, lastAim = {}, sling, keyAim = null;
    let lantern = 0, Z = st;
    const cache = K.cache();

    /* ---------- view ---------- */
    function view() {
      const W = cv.w, H = cv.h, portrait = H > W * 1.1;
      const wx0 = -.75, wx1 = 4.4, wy0 = -.25, wy1 = 2.55;
      const top = portrait ? 64 : 46, bot = portrait ? Math.max(150, H * .36) : 8;
      const f = BX.fit(W, H - top - bot, wx1 - wx0, wy1 - wy0, 6);
      return {s: f.s, ox: f.x - wx0 * f.s, oy: top + f.y + wy1 * f.s, portrait, top, x0: wx0, x1: wx1};
    }
    let V = view();
    const T = (x, y) => [V.ox + x * V.s, V.oy - y * V.s];

    /* ---------- input ---------- */
    const myTurn = () => !st.over && !pb.on && ctx.canAct(st.turn);
    sling = K.sling(ctx, cv, {
      enabled: myTurn, max: () => Math.min(cv.w, cv.h) * .32,
      change: s => { const a = clampDir(s.dx, -s.dy); aim = {dx: a[0], dy: a[1], p: s.p}; },
      release: s => fire(),
    });
    function clampDir(dx, dy) {   // screen dy is down; world up = -screen y. limit angle 8°..84°
      let x = dx, y = dy; if (x < .1) x = .1; if (y < .14) y = .14;
      if (y / x > 9.5) x = y / 9.5;
      const l = Math.hypot(x, y); return [x / l, y / l];
    }
    function fire() {
      if (!myTurn()) return;
      const v = VMIN + aim.p * (VMAX - VMIN);
      lastAim[st.turn] = Object.assign({}, aim);
      ctx.sfx('swish');
      ctx.act({vx: Math.round(aim.dx * v * 1e4) / 1e4, vy: Math.round(aim.dy * v * 1e4) / 1e4}, st.turn);
    }
    function key(e) {
      if (!myTurn()) return;
      const ang = Math.atan2(aim.dy, aim.dx);
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { const a = ang + (e.code === 'ArrowUp' ? 1 : -1) * Math.PI / 180; const d = clampDir(Math.cos(a), Math.sin(a)); aim.dx = d[0]; aim.dy = d[1]; keyAim = performance.now(); }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { aim.p = BX.clamp(aim.p + (e.code === 'ArrowRight' ? .01 : -.01), .02, 1); keyAim = performance.now(); }
      if (e.code === 'Space' || e.code === 'Enter') fire();
    }

    /* ---------- rules ---------- */
    function nextTurn() {
      st.arrows = []; st.thrown = 0; st.quota = 4; st.xiaoUsed = false; st.streak = 0; st.firstHit = null;
      const idx = st.order.indexOf(st.turn) + 1;
      if (idx < st.n) { st.turn = st.order[idx]; return; }
      st.round++;
      if (st.round >= st.R) { st.over = true; return; }
      st.turn = st.order[0]; newRound();
    }
    function status() {
      for (let i = 0; i < ctx.n; i++) ctx.info(i, st.score[i] + ' 筹');
      if (st.over) { ctx.status('投壶结束'); return; }
      if (pb.on) { ctx.status(ctx.name(st.turn) + ' 投出一箭…'); return; }
      const left = st.quota - st.thrown;
      const who = ctx.canAct(st.turn) ? (ctx.hotseat || ctx.n === 1 ? ctx.name(st.turn) + '：' : '轮到你：') : ctx.name(st.turn) + ' ';
      ctx.status(`第 ${st.round + 1}/${st.R} 轮 · ${who}还剩 ${left} 箭`);
    }
    const inst = {
      st,
      toMove: () => st.over || (pb.on && !ctx.isRemote(st.turn)) ? null : st.turn,   // remote seats may act during our local playback (avoids host rejecting a guest that finished playback first)
      valid: a => a && isFinite(a.vx) && isFinite(a.vy),
      apply(a, by) {
        let vx = +a.vx || 0, vy = +a.vy || 0;
        const sp = Math.sqrt(vx * vx + vy * vy);
        if (sp > VMAX) { vx *= VMAX / sp; vy *= VMAX / sp; }
        const r = simulate({vx, vy, wind: st.wind, D: st.D}, !ctx.fast);
        const who = st.turn, feats = [];
        let gain = 0, hit = false;
        if (r.res === 'mouth' || r.res === 'ear') {
          hit = true; const base = r.res === 'ear' ? 2 : 1; gain += base; feats.push([RES_NAME[r.res], base]);
          if (st.thrown === 0) { gain++; feats.push(['有初', 1]); }
          else if (st.streak > 0) { gain++; feats.push(['连中', 1]); }
        } else if (r.res === 'xiao') {
          gain += 1; feats.push(['骁', 1]);
          if (!st.xiaoUsed) { st.xiaoUsed = true; st.quota++; feats.push(['加一箭', 0]); }
        }
        st.streak = hit ? st.streak + 1 : 0;
        st.thrown++;
        if (hit && st.streak === 4) { gain += 2; feats.push(['全壶', 2]); }
        const snap = {turn: who, round: st.round, thrown: st.thrown, quota: st.quota, D: st.D, wind: st.wind, score: st.score.slice(), card: st.card.map(r => r.slice()), arrows: st.arrows.slice()};
        st.score[who] += gain;
        st.card[who][st.round] = (st.card[who][st.round] || 0) + gain;
        const e = r.end;
        const arrow = {x: Math.round(e.x * 1e4) / 1e4, y: Math.round(e.y * 1e4) / 1e4, dx: Math.round(e.dx * 1e3) / 1e3, dy: Math.round(e.dy * 1e3) / 1e3, k: r.res};
        st.arrows.push(arrow);
        st.last = {who, res: r.res, gain, feats: feats.map(f => f[0])};
        const turnDone = st.thrown >= st.quota;
        if (turnDone) nextTurn();
        if (!ctx.fast) {
          show = {r, feats, who, D: snap.D, done: false, snap, turnDone};
          const dur = r.steps * DT + .25, tn = r.tNear;
          pb.start(dur + (turnDone ? 1.1 : .45), () => { show = null; status(); }, tn > 0 ? [[tn, tn + .45, .35]] : []);
        }
        if (st.over) endGame(show ? (show.r.steps * DT + 1.6) * 1000 : 600);
        status();
      },
      aiMove(seat, level) {
        const N1 = BX.test ? 12 : 44, N2 = BX.test ? 14 : 60;
        const A0 = 30 * Math.PI / 180, A1 = 80 * Math.PI / 180;
        const grid = [];
        for (let i = 0; i < N1; i++) {
          const row = []; const ang = A0 + (A1 - A0) * i / (N1 - 1), c = Math.cos(ang), s = Math.sin(ang);
          for (let j = 0; j < N2; j++) {
            const v = VMIN + (VMAX - VMIN) * j / (N2 - 1);
            const r = simulate({vx: c * v, vy: s * v, wind: st.wind, D: st.D}, false);
            row.push({ang, v, val: r.res === 'ear' ? (level >= 3 ? 1.6 : 1.2) : r.res === 'mouth' ? 1 : r.res === 'xiao' ? .4 : 0});
          }
          grid.push(row);
        }
        let best = null, bv = -1;
        for (let i = 0; i < N1; i++) for (let j = 0; j < N2; j++) {
          let sum = 0; for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const r = grid[i + di]; const c2 = r && r[j + dj]; if (c2) sum += c2.val * (di || dj ? .5 : 1.5); }
          sum += Math.random() * .01;
          if (sum > bv) { bv = sum; best = grid[i][j]; }
        }
        if (!best || bv <= .02) best = {ang: 55 * Math.PI / 180, v: Math.sqrt(G * st.D) * 1.05};
        const na = [0, 3.2, 1.3, .45][level] * Math.PI / 180, nv = [0, .06, .025, .009][level];
        const g2 = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        const ang = best.ang + g2() * na, v = BX.clamp(best.v * (1 + g2() * nv), VMIN, VMAX);
        if (!ctx.fast && !ctx.isRemote(seat)) aim = {dx: Math.cos(ang), dy: Math.sin(ang), p: (v - VMIN) / (VMAX - VMIN)};
        return {vx: Math.round(Math.cos(ang) * v * 1e4) / 1e4, vy: Math.round(Math.sin(ang) * v * 1e4) / 1e4};
      },
      onTurn: status,
      key,
      resize() { V = view(); },
      frame(dt) {
        pb.tick(dt); fx.update(dt * (pb.on ? pb.rate : 1)); lantern += dt;
        V = view(); Z = show ? Object.assign({}, st, show.snap, {over: false}) : st; draw(dt);
      },
    };
    function endGame(delay) {
      const best = Math.max(...st.score), win = BX.range(ctx.n).filter(i => st.score[i] === best);
      let text = BX.range(ctx.n).map(i => ctx.name(i) + ' ' + st.score[i] + ' 筹').join('　');
      if (ctx.n === 1) { const b = ctx.best('score' + st.R, st.score[0], 'max'); text = `共得 ${st.score[0]} 筹` + (b.isNew ? '（新纪录！）' : `（最佳 ${b.best} 筹）`); }
      ctx.end({winner: win.length === ctx.n && ctx.n > 1 ? -1 : (win.length === 1 ? win[0] : win), text, delay: delay || 600});
    }

    /* ---------- drawing ---------- */
    function background(g, W, H) {
      const [, gy] = T(0, 0);
      K.sky(g, 0, 0, W, H, {top: '#ead8b4', mid: '#f4e8cf', bot: '#e8d6ae', sunX: .8, sunY: .16, sunR: .05});
      K.mountains(g, 0, gy - V.s * 2.4, W, V.s * 2.4, {seed: 31, layers: 3, top: .05, base: .75, step: .16, alpha: [.13, .22, .34]});
      K.birds(g, W * .25, gy - V.s * 2.1, V.s * .07, 3);
      // floor
      const fg = g.createLinearGradient(0, gy, 0, H); fg.addColorStop(0, '#8a5a32'); fg.addColorStop(1, '#4a2c16'); g.fillStyle = fg; g.fillRect(0, gy, W, H - gy);
      g.strokeStyle = 'rgba(30,15,5,.25)'; g.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const x = (i / 13) * W; g.beginPath(); g.moveTo(W / 2 + (x - W / 2) * .55, gy); g.lineTo(x * 1.6 - W * .3, H); g.stroke(); }
      // mat
      const [mx0] = T(-.6, 0), [mx1] = T(4.3, 0);
      g.fillStyle = 'rgba(178,58,43,.75)'; g.fillRect(mx0, gy, mx1 - mx0, Math.max(4, V.s * .05));
      g.fillStyle = 'rgba(230,197,125,.7)'; g.fillRect(mx0, gy + Math.max(4, V.s * .05) - 2, mx1 - mx0, 2);
    }
    function draw(dt) {
      const g = cv.g, W = cv.w, H = cv.h; cv.clear();
      const bg = cache('bg', W, H, cv.dpr, (bg2) => background(bg2, W, H));
      g.drawImage(bg, 0, 0, W, H);
      const [ox, oy] = fx.off(); g.save(); g.translate(ox, oy);
      // throw line marker + thrower
      drawThrower(g);
      const potX = show ? show.D : Z.D;
      const [px, py] = T(potX, 0);
      // distance marker
      const [hx] = T(0, 0);
      g.strokeStyle = 'rgba(255,240,210,.5)'; g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(hx, py + 10); g.lineTo(px, py + 10); g.stroke(); g.setLineDash([]);
      D.text(g, potX.toFixed(1) + ' 米', (hx + px) / 2, py + 22, {size: 12, color: '#f3e2c0', font: 'serif'});
      // arrows resting (behind pot)
      const resting = Z.arrows;
      for (const a of resting) if (a.k === 'mouth' || a.k === 'ear') drawRestArrow(g, a, potX);
      drawPot(g, px, py, V.s, lantern);
      for (const a of resting) if (!(a.k === 'mouth' || a.k === 'ear')) drawRestArrow(g, a, potX);
      // flying arrow
      if (show) drawFlight(g);
      else if (!Z.over) drawAim(g);
      fx.draw(g, (x, y) => T(x, y), 1);
      g.restore();
      fx.drawFlash(g, W, H);
      drawHud(g);
    }
    function drawThrower(g) {
      const [hx, hy] = T(HAND[0], HAND[1]), s = V.s;
      const [fx0, fy0] = T(-.32, 0);
      const col = ctx.color(Z.turn);
      g.save();
      // robe
      g.fillStyle = 'rgba(40,28,18,.88)'; g.beginPath(); g.moveTo(fx0 - .22 * s, fy0); g.quadraticCurveTo(fx0 - .2 * s, fy0 - .9 * s, fx0 - .02 * s, fy0 - 1.32 * s); g.lineTo(fx0 + .12 * s, fy0 - 1.3 * s); g.quadraticCurveTo(fx0 + .2 * s, fy0 - .7 * s, fx0 + .26 * s, fy0); g.closePath(); g.fill();
      g.fillStyle = col; g.fillRect(fx0 - .16 * s, fy0 - .78 * s, .38 * s, .06 * s);
      // head
      g.fillStyle = '#e9cfa8'; D.circle(g, fx0 + .04 * s, fy0 - 1.45 * s, .12 * s); g.fill();
      g.fillStyle = '#1b1510'; g.beginPath(); g.arc(fx0 + .04 * s, fy0 - 1.48 * s, .125 * s, Math.PI, 0); g.fill(); g.fillRect(fx0 - .01 * s, fy0 - 1.68 * s, .1 * s, .1 * s);
      // sleeve to hand
      g.strokeStyle = 'rgba(40,28,18,.88)'; g.lineWidth = .1 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx0 + .08 * s, fy0 - 1.2 * s); g.quadraticCurveTo(hx - .1 * s, hy + .05 * s, hx - .02 * s, hy); g.stroke();
      g.restore();
    }
    function drawAim(g) {
      const mine = ctx.canAct(Z.turn);
      const [hx, hy] = T(HAND[0], HAND[1]);
      const a = mine ? aim : (lastAim[Z.turn] || null);
      if (!a) { drawArrow(g, hx, hy, .7, .7, ARROW_L * V.s, 1, ctx.color(Z.turn)); return; }
      const v = VMIN + a.p * (VMAX - VMIN);
      // guide arc (no wind), first part only
      const pts = []; let x = HAND[0], y = HAND[1], vx = a.dx * v, vy = a.dy * v;
      for (let i = 0; i < 70; i++) { x += vx * .01; y += vy * .01; vy -= G * .01; pts.push(T(x, y)); if (y < 0) break; }
      if (mine) K.guide(g, pts.slice(0, Math.max(6, Math.round(pts.length * .55))), {color: '#5a3416', w: 2.5, alpha: .8});
      drawArrow(g, hx, hy, a.dx, a.dy, ARROW_L * V.s, 1, ctx.color(Z.turn));
      if (mine && sling.on) K.drawPull(g, hx, hy, {dx: a.dx, dy: -a.dy, p: a.p}, Math.min(cv.w, cv.h) * .22, ctx.color(Z.turn));
      if (mine && (sling.on || keyAim)) K.meter(g, hx - 60, hy - 140 < V.top ? V.top + 30 : hy - 140, 12, 110, a.p, {marks: [[.5, ''], [.75, '']], labels: false});
      if (mine && !sling.on && !keyAim && Z.thrown === 0 && Z.round === 0) D.text(g, '按住画面向后拉，松手投出', cv.w / 2, V.oy - 2.3 * V.s, {size: 15, color: '#5a3416', font: 'serif', weight: 700});
    }
    function drawFlight(g) {
      const pts = show.r.pts, n = pts.length;
      const tSim = pb.t, idx = Math.min(n - 1, Math.floor(tSim / (DT * 2)));
      // trail (ink brush)
      g.save(); g.lineCap = 'round';
      for (let i = Math.max(1, idx - 40); i <= idx; i++) {
        const [x1, y1] = T(pts[i - 1][0], pts[i - 1][1]), [x2, y2] = T(pts[i][0], pts[i][1]);
        g.strokeStyle = `rgba(30,20,12,${.35 * (1 - (idx - i) / 40)})`; g.lineWidth = 1 + 3 * (1 - (idx - i) / 40);
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      }
      g.restore();
      const p = pts[idx];
      const sp = Math.hypot(p[2], p[3]) || 1;
      const final = idx === n - 1;
      let dx = p[2] / sp, dy = p[3] / sp;
      if (final) { const e = show.r.end; dx = e.dx; dy = e.dy; }
      const [tx, ty] = T(p[0], p[1]);
      drawArrowTip(g, tx, ty, dx, dy, ARROW_L * V.s, ctx.color(show.who), final && (show.r.res === 'mouth' || show.r.res === 'ear'));
      // events
      for (let i = show.ei || 0; i <= idx; i++) {
        if (pts[i] && pts[i][4] === 2) { ctx.sfx('hit'); fx.burst(pts[i][0], pts[i][1], {n: 8, sp: 2 * V.s, color: '#e6c57d', life: .4, kind: 'spark'}); fx.shake(4); }
        if (pts[i] && pts[i][4] === 1) { ctx.sfx('bounce'); fx.shake(6); }
      }
      show.ei = idx + 1;
      if (final && !show.done) {
        show.done = true;
        const r = show.r, e = r.end;
        if (r.res === 'mouth' || r.res === 'ear') {
          ctx.sfx(r.res === 'ear' ? 'gong' : 'bell'); fx.shake(r.res === 'ear' ? 8 : 4); fx.flashOn(r.res === 'ear' ? .9 : .5);
          fx.burst(show.D + (r.res === 'ear' ? (e.x - show.D) : 0), r.res === 'ear' ? EAR_TOP : MOUTH_Y, {n: 26, sp: 1.6 * V.s, color: ['#ffe28a', '#e6c57d', '#fff6dd', '#d0533f'], life: .9, g: 2 * V.s, a0: -Math.PI / 2, spread: 2.2});
        } else if (r.res === 'xiao') { ctx.sfx('coin'); fx.flashOn(.6, '200,240,255'); }
        else { ctx.sfx('place'); fx.burst(e.x, 0, {n: 10, sp: .8 * V.s, color: '150,110,70', kind: 'smoke', life: .7, size: 4, a0: -Math.PI / 2, spread: 2.4}); }
        let yy = (r.res === 'ear' ? EAR_TOP : MOUTH_Y) + .5;
        const pos = (show.feats.length ? show.feats : [['不中', 0]]);
        pos.forEach((f, k) => fx.text(show.D, yy, f[0] + (f[1] ? ' +' + f[1] : ''), {dy: k * 26 - 10, size: k ? 18 : 26, color: f[0] === '不中' ? '#e8d8c0' : k ? '#ffe9b8' : '#fff3d6', life: 1.7, rise: 30}));
      }
    }
    function drawRestArrow(g, a, potX) {
      const [x, y] = T(a.x, a.y), L = ARROW_L * V.s;
      let dx = a.dx, dy = a.dy;
      if (a.k === 'miss' || a.k === 'xiao') { if (dy > -.5) { dx = dx >= 0 ? .98 : -.98; dy = -.18; } }
      drawArrowTip(g, x, y, dx, dy, L, '#7a5a3a', false, .85);
    }
    function drawHud(g) {
      const W = cv.w, port = V.portrait;
      // wind
      K.wind(g, W - 66, 30, BX.clamp(Z.wind / 1.3, -1, 1), .95, '风');
      if (Math.abs(Z.wind) >= .05) D.text(g, (Z.wind > 0 ? '顺风 ' : '逆风 ') + Math.abs(Z.wind).toFixed(1), W - 66, 60, {size: 12, color: '#5a3416', font: 'serif', weight: 700});
      // scoreboard
      const n = ctx.n, rowH = port ? 30 : 20, nameW = port ? Math.min(150, W * .32) : 84;
      const colW = port ? Math.min(44, (W - 24 - nameW - 56) / Z.R) : 30;
      const bw = nameW + colW * Z.R + (port ? 56 : 46), bh = rowH * (n + 1) + 8;
      const bx = port ? (W - bw) / 2 : 8, by = port ? V.oy + 46 : 8, fs = port ? 15 : 12;
      g.save(); g.globalAlpha = .94; D.paper(g, bx, by, bw, bh, {r: 8}); g.restore();
      g.strokeStyle = 'rgba(90,60,30,.5)'; g.lineWidth = 1; D.rr(g, bx, by, bw, bh, 8); g.stroke();
      if (port) K.seal(g, bx + bw - 4, by + 4, 26, '筹');
      D.text(g, '筹', bx + nameW / 2, by + 4 + rowH / 2, {size: fs, color: C.red, font: 'serif', weight: 800});
      for (let r = 0; r < Z.R; r++) D.text(g, '第' + '一二三四五'[r], bx + nameW + colW * r + colW / 2, by + 4 + rowH / 2, {size: fs - 2, color: r === Z.round && !st.over ? C.red : C.ink2});
      const tcx = bx + nameW + colW * Z.R + (port ? 28 : 23);
      D.text(g, '合', tcx, by + 4 + rowH / 2, {size: fs, color: C.ink, weight: 800});
      for (let i = 0; i < n; i++) {
        const y = by + 4 + rowH * (i + 1) + rowH / 2;
        if (i === Z.turn && !st.over) { g.fillStyle = 'rgba(178,58,43,.15)'; g.fillRect(bx + 2, y - rowH / 2, bw - 4, rowH); }
        g.fillStyle = ctx.color(i); D.circle(g, bx + 11, y, port ? 5 : 4); g.fill();
        D.text(g, ctx.name(i), bx + 20, y, {size: fs, color: C.ink, align: 'left', maxW: nameW - 22});
        for (let r = 0; r < Z.R; r++) { const v = Z.card[i][r]; if (v != null) D.text(g, String(v), bx + nameW + colW * r + colW / 2, y, {size: fs + 1, color: C.ink}); }
        D.text(g, String(Z.score[i]), tcx, y, {size: fs + 2, color: C.red, weight: 800});
      }
      // quiver: arrows left for current thrower
      if (!st.over) {
        const left = Math.max(0, Z.quota - Z.thrown - (show ? 0 : 0)), qx = port ? W / 2 : bx + bw + 56, qy = port ? by + bh + 46 : by + 30;
        g.fillStyle = 'rgba(30,18,8,.7)'; D.rr(g, qx - 46, qy - 26, 92, 52, 12); g.fill();
        for (let k = 0; k < Z.quota; k++) drawArrow(g, qx - 32 + k * 11, qy, .12, 1, 42, k < left ? 1 : .2, ctx.color(Z.turn));
        D.text(g, '余 ' + left, qx + 24, qy + 1, {size: 13, color: '#f3e2c0', font: 'serif'});
      }
    }
    status();
    return inst;
  },
});

/* ---------- shared art ---------- */
function drawPot(g, x, y, s, t) {
  // x,y: base centre on screen; s: px per metre
  g.save();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + .02 * s, y + 2, .2 * s, .03 * s, 0, 0, Math.PI * 2); g.fill();
  const P = (hw, yy) => [x + hw * s, y - yy * s];
  // ears (tubes)
  for (const sd of [-1, 1]) {
    const ex = x + sd * EAR_X * s;
    const eg = g.createLinearGradient(ex - EAR_OUT * s, 0, ex + EAR_OUT * s, 0); eg.addColorStop(0, '#5d4a22'); eg.addColorStop(.5, '#a88a45'); eg.addColorStop(1, '#4a3a1a');
    g.fillStyle = eg; g.fillRect(ex - EAR_OUT * s, y - EAR_TOP * s, EAR_OUT * 2 * s, (EAR_TOP - EAR_BOT) * s);
    g.fillStyle = '#1e140a'; g.beginPath(); g.ellipse(ex, y - EAR_TOP * s, EAR_IN * s, Math.max(1.5, .012 * s), 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c9a85a'; g.lineWidth = Math.max(1, .006 * s); g.beginPath(); g.ellipse(ex, y - EAR_TOP * s, EAR_OUT * s, Math.max(2, .016 * s), 0, 0, Math.PI * 2); g.stroke();
    // strut to neck
    g.fillStyle = '#6a5528'; g.fillRect(Math.min(ex, x + sd * NECK_HW * s), y - .57 * s, Math.abs(ex - (x + sd * NECK_HW * s)) - EAR_OUT * s * .5, .04 * s);
  }
  // body outline
  g.beginPath();
  const steps = 30;
  for (let i = 0; i <= steps; i++) { const yy = MOUTH_Y * i / steps; const [px, py] = P(-bodyHW(yy), yy); i ? g.lineTo(px, py) : g.moveTo(px, py); }
  for (let i = steps; i >= 0; i--) { const yy = MOUTH_Y * i / steps; const [px, py] = P(bodyHW(yy), yy); g.lineTo(px, py); }
  g.closePath();
  const bg = g.createLinearGradient(x - .22 * s, 0, x + .22 * s, 0);
  bg.addColorStop(0, '#3e3016'); bg.addColorStop(.3, '#a7843e'); bg.addColorStop(.45, '#d9bb6a'); bg.addColorStop(.7, '#7a6128'); bg.addColorStop(1, '#2e2410');
  g.fillStyle = bg; g.fill();
  // patina + bands
  g.save(); g.clip();
  g.fillStyle = 'rgba(70,140,110,.22)'; for (let i = 0; i < 9; i++) { D.circle(g, x + ((i * 37) % 30 - 15) / 100 * s, y - (.08 + ((i * 53) % 60) / 100) * s, (.02 + (i % 3) * .012) * s); g.fill(); }
  g.strokeStyle = 'rgba(40,25,8,.6)'; g.lineWidth = Math.max(1, .008 * s);
  for (const yy of [.06, .44, .48, .66]) { g.beginPath(); g.moveTo(x - .25 * s, y - yy * s); g.lineTo(x + .25 * s, y - yy * s); g.stroke(); }
  // cloud-thunder pattern band on the belly
  g.strokeStyle = 'rgba(40,25,8,.45)';
  for (let i = -4; i <= 4; i++) { const cx = x + i * .05 * s, cy = y - .25 * s; g.beginPath(); g.moveTo(cx - .015 * s, cy - .03 * s); g.lineTo(cx - .015 * s, cy + .02 * s); g.lineTo(cx + .015 * s, cy + .02 * s); g.lineTo(cx + .015 * s, cy - .01 * s); g.lineTo(cx, cy - .01 * s); g.stroke(); }
  g.restore();
  // mouth
  g.fillStyle = '#140d06'; g.beginPath(); g.ellipse(x, y - MOUTH_Y * s, MOUTH_HW * s, Math.max(2, .02 * s), 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#e0c47a'; g.lineWidth = Math.max(1.2, .01 * s); g.beginPath(); g.ellipse(x, y - MOUTH_Y * s, NECK_HW * s, Math.max(2.5, .026 * s), 0, 0, Math.PI * 2); g.stroke();
  g.restore();
}
/* arrow with its middle at (x,y) pointing (dx, dy) in WORLD direction (dy up) */
function drawArrow(g, x, y, dx, dy, L, alpha = 1, col = '#b23a2b') {
  drawArrowTip(g, x + dx * L / 2, y - dy * L / 2, dx, dy, L, col, false, alpha);
}
/* arrow given tip screen pos and WORLD direction (dy up) */
function drawArrowTip(g, tx, ty, dx, dy, L, col = '#b23a2b', glow = false, alpha = 1) {
  const ux = dx, uy = -dy;   // screen direction
  const bx = tx - ux * L, by = ty - uy * L;
  g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
  if (glow) { g.shadowColor = 'rgba(255,220,120,.8)'; g.shadowBlur = 10; }
  g.strokeStyle = '#6b4a26'; g.lineWidth = Math.max(1.6, L * .035); g.beginPath(); g.moveTo(bx, by); g.lineTo(tx - ux * L * .06, ty - uy * L * .06); g.stroke();
  g.shadowBlur = 0;
  // head
  const nx = -uy, ny = ux, hw = Math.max(2, L * .035);
  g.fillStyle = '#3a3a3a'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - ux * L * .1 + nx * hw, ty - uy * L * .1 + ny * hw); g.lineTo(tx - ux * L * .1 - nx * hw, ty - uy * L * .1 - ny * hw); g.closePath(); g.fill();
  // fletching
  g.fillStyle = col; const fl = L * .16, fw = Math.max(2.5, L * .05);
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(bx + ux * L * .02, by + uy * L * .02); g.lineTo(bx + ux * (fl + L * .02) + nx * fw * sd * .3, by + uy * (fl + L * .02) + ny * fw * sd * .3); g.lineTo(bx + ux * L * .04 + nx * fw * sd, by + uy * L * .04 + ny * fw * sd); g.closePath(); g.fill(); }
  g.restore();
}
