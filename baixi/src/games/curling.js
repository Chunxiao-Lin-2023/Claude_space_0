/* 冰壶 — classic curling on one sheet. Deterministic stone simulation inside apply (only + - * / sqrt). */
const D = BX.draw, C = BX.C, K = BX.data.pk;
/* sheet coordinates (metres): tee at (0,0), +y toward the back of the house */
const R = .145, HALF = 2.375, HOG = -6.4, BACK = 1.83, TEE_Y = 0, START_Y = -28.35, SHEET_Y0 = -31, SHEET_Y1 = 3.66;
const HOUSE = 1.83, FRIC = .08, DT = .02, MAXSTEP = 2600, CURL = .012;
const VMIN = 1.7, VMAX = 3.6;
const PER = 8;
/* slider 0..1 → travel distance (m): 0..0.72 covers guards → back line, the rest is takeout weight */
const p2d = p => p < .72 ? 20 + p / .72 * 10.6 : 30.6 + (p - .72) / .28 * 30;
const d2p = d => d < 30.6 ? (d - 20) / 10.6 * .72 : .72 + (d - 30.6) / 30 * .28;
const p2v = p => Math.sqrt(2 * FRIC * p2d(p));
const SWF = w => 1 - .02 * w, SWC = w => 1 - .14 * w;

/* ---------- deterministic simulation ----------
   stones: [{x,y,t}] at rest; shot: {dx,dy,v,s,w,t}. Returns {stones (in play), frames, ev, hitAny, thrownOut, steps, tHouse} */
function simulate(stones, shot, rec) {
  const n = stones.length, S = [];
  for (let i = 0; i < n; i++) S.push({x: stones[i].x, y: stones[i].y, vx: 0, vy: 0, t: stones[i].t, on: 1, sp: 0, mv: 0});
  const fr = SWF(shot.w), cu = SWC(shot.w);
  S.push({x: 0, y: START_Y, vx: shot.dx * shot.v, vy: shot.dy * shot.v, t: shot.t, on: 1, sp: shot.s, mv: 1});
  const me = n, frames = rec ? [] : null, ev = [];
  let hitAny = false, step = 0, tHouse = -1;
  const snap = () => { const f = new Array(S.length * 2); for (let i = 0; i < S.length; i++) { f[i * 2] = S[i].on ? S[i].x : 99; f[i * 2 + 1] = S[i].on ? S[i].y : 99; } frames.push(f); };
  if (rec) snap();
  for (step = 1; step <= MAXSTEP; step++) {
    let moving = 0;
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (!s.on || !s.mv) continue;
      const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      const dec = FRIC * (i === me ? fr : 1) * DT;
      if (sp <= dec) { s.vx = 0; s.vy = 0; s.mv = 0; continue; }
      const ux = s.vx / sp, uy = s.vy / sp;
      let nvx = s.vx - ux * dec, nvy = s.vy - uy * dec;
      if (s.sp) { const a = CURL * s.sp * (i === me ? cu : 1) / (sp + .35) * DT; nvx += uy * a; nvy -= ux * a; }   // clockwise (s=+1) curls to the right of travel
      s.vx = nvx; s.vy = nvy; s.x += s.vx * DT; s.y += s.vy * DT; moving++;
      if (s.x + R > HALF || s.x - R < -HALF || s.y - R > BACK || s.y > SHEET_Y1) { s.on = 0; s.mv = 0; ev.push([step, 'out', i]); }
    }
    if (tHouse < 0 && S[me].y > HOG - 1.5) tHouse = step * DT;
    // collisions (pairs where at least one moves)
    for (let i = 0; i < S.length; i++) {
      const a = S[i]; if (!a.on) continue;
      for (let j = i + 1; j < S.length; j++) {
        const b = S[j]; if (!b.on || (!a.mv && !b.mv)) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        const ov = (2 * R - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
        if (rv > 0) {
          const jv = rv * .95;
          a.vx -= jv * nx; a.vy -= jv * ny; b.vx += jv * nx; b.vy += jv * ny;
          a.mv = 1; b.mv = 1; a.sp *= .3; b.sp *= .3;
          if (i === me || j === me) hitAny = true;
          ev.push([step, 'hit', i, j, Math.round(rv * 100) / 100]);
        }
      }
    }
    if (rec && (step & 1) === 0) snap();
    if (!moving && step > 2) break;
  }
  if (rec) snap();
  const thrown = S[me];
  let hogOut = false;
  if (thrown.on && !hitAny && thrown.y - R < HOG) { thrown.on = 0; hogOut = true; ev.push([step, 'hog', me]); }
  const out = [];
  for (let i = 0; i < S.length; i++) if (S[i].on) out.push({x: Math.round(S[i].x * 1e4) / 1e4, y: Math.round(S[i].y * 1e4) / 1e4, t: S[i].t, i});
  return {stones: out, all: S, frames, ev, hitAny, hogOut, steps: step, tHouse: tHouse < 0 ? 0 : tHouse};
}
const inHouse = s => s.x * s.x + s.y * s.y <= (HOUSE + R) * (HOUSE + R);
const inFGZ = s => s.y - R >= HOG - 2 * R && s.y < TEE_Y && !inHouse(s);
/* end scoring: {team, pts, counting:[idx]} */
function count(stones) {
  const hs = stones.map((s, k) => ({k, t: s.t, d: Math.sqrt(s.x * s.x + s.y * s.y)})).filter(o => o.d <= HOUSE + R).sort((a, b) => a.d - b.d);
  if (!hs.length) return {team: -1, pts: 0, counting: []};
  const t = hs[0].t, opp = hs.find(o => o.t !== t), lim = opp ? opp.d : Infinity;
  const c = hs.filter(o => o.t === t && o.d < lim);
  return {team: t, pts: c.length, counting: c.map(o => o.k)};
}

BX.register({
  id: 'curling', title: '冰壶', cat: 'physics', order: 3, sub: '冰上棋局，旋转与擦冰',
  desc: '两队各掷 8 只冰壶，靠旋转让壶走出弧线，用擦冰控制滑行距离。离营垒圆心最近的一方得分，最后一壶（后手）决定胜负。',
  kind: 'turn', seats: 2, seatNames: ['赤队', '金队'], seatColors: ['#c23a2b', '#d9a12b'], firstLabel: '先掷', aiDelay: 500,
  options: [{key: 'ends', label: '局数', choices: [[2, '2 局'], [4, '4 局'], [8, '8 局']], def: 4},
    {key: 'fgz', label: '自由防守区', choices: [[1, '开'], [0, '关']], def: 1}],
  rules: `<p><b>冰壶</b>：两队在冰道上轮流把冰壶推向远端的<b>营垒</b>（同心圆）。每局每队各掷 <b>8 壶</b>，双方交替出手。</p>
<p><b>计分：</b>一局 16 壶全部掷完后，只有离营垒圆心（<b>T 点</b>）最近的一方得分：该方每有一只壶比对方最近的壶更靠近圆心，就得 1 分。只计算营垒内（外圈半径 1.83 米以内、壶身接触圆圈即算）的壶。双方都没有壶在营垒内则本局 0:0（空局）。</p>
<p><b>后手（最后一壶）：</b>首局由先掷方的对手持后手；此后由<b>本局未得分的一方</b>获得下一局后手（空局则后手不变）。后手方每局最后出手，优势很大。</p>
<p><b>出界：</b>壶完全越过<b>底线</b>或碰到两侧边线即被移出；掷出的壶必须完全越过远端<b>前掷线</b>（粗红线），除非它碰到了场上其他壶，否则同样移出。</p>
<p><b>自由防守区（可选，五壶规则）：</b>前掷线与 T 线之间、营垒以外的区域。每局前 4 壶掷出期间，不得把对方停在该区域内的壶击出界；违例时掷出的壶被移出，其余壶恢复原位。</p>
<p>全部局数打完后总分高者胜；平分则加赛一局（最多三局，仍平则为和局）。</p>
<p><b>操作：</b>先在下方选好<b>旋转</b>（顺旋向右弯、逆旋向左弯）和<b>擦冰</b>力度（擦得越多，滑得越远、弯得越少）。然后在画面上按住并<b>向后拉</b>：左右偏移决定瞄准点（营垒中的十字），拉得越长力度越大；虚线是不考虑碰撞时的预计路线，松手掷出。冰面有细微不平，实际落点会有少许偏差。键盘：←→ 瞄准、↑↓ 力度、空格掷出。</p>`,
  icon(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#eef5f7'); gr.addColorStop(1, '#cfe0e6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const cx = w * .55, cy = h * .5, s = h * .26;
    for (const [r, c] of [[1.83, '#b23a2b'], [1.22, '#f6fbfc'], [.61, '#3f7f6b'], [.15, '#f6fbfc']]) { g.fillStyle = c; D.circle(g, cx, cy, r * s); g.fill(); }
    g.strokeStyle = 'rgba(40,60,80,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, cy); g.lineTo(w, cy); g.moveTo(cx, 0); g.lineTo(cx, h); g.stroke();
    drawStone(g, cx + s * .3, cy - s * .2, R * s * 2.3, '#c23a2b', .6);
    drawStone(g, cx - s * .9, cy + s * .5, R * s * 2.3, '#d9a12b', 2);
    drawStone(g, w * .14, cy + s * .1, R * s * 2.3, '#c23a2b', 1.2);
    g.strokeStyle = 'rgba(194,58,43,.55)'; g.lineWidth = 3; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(w * .14 + 12, cy + s * .1); g.quadraticCurveTo(w * .4, cy + s * .5, cx + s * .2, cy - s * .1); g.stroke(); g.setLineDash([]);
  },
  create(ctx) {
    K.css();
    const ends = BX.test ? 1 : (ctx.opts.ends || 4), fgz = ctx.opts.fgz == null ? 1 : +ctx.opts.fgz;
    const st = {ends, end: 0, extra: 0, hammer: 1, turn: 0, thrown: [0, 0], stones: [], score: [0, 0], card: [[], []], hammerLog: [], over: false, last: null, fgz};
    const cv = ctx.canvas(), pb = K.playback(ctx), fx = K.fx(), cache = K.cache();
    let show = null, Z = st, cam = {c: -2, s: 60}, aim = {xa: 0, p: .19, s: 1, w: 0}, keyT = 0, lastRemote = null;
    const ui = ctx.ui('');
    const bar = BX.h('div', {class: 'pk-bar'}); ui.append(bar);
    const segSpin = K.seg(bar, '旋转', [[1, '↻<small>顺旋·右弯</small>'], [-1, '↺<small>逆旋·左弯</small>']], () => aim.s, v => aim.s = v);
    const segSw = K.seg(bar, '擦冰', [[0, '不擦'], [1, '轻'], [2, '中'], [3, '重']], () => aim.w, v => aim.w = v);

    /* ---------- view ---------- */
    function layout() {
      const W = cv.w, H = cv.h, port = H > W;
      const barH = 58, topH = port ? 50 : 0;
      const main = port ? H - barH - topH : W, cross = port ? W : H - barH;
      const s = Math.min((cross - (port ? 10 : 8)) / (HALF * 2 + .4), main / (port ? 9.5 : 10.5));
      return {W, H, port, s, barH, topH, main, cross, L: main / s};
    }
    let V = layout();
    /* sheet → screen.  portrait: +y up; landscape: +y right */
    const T = (x, y) => V.port ? [V.W / 2 + x * V.s, V.topH + V.main / 2 - (y - cam.c) * V.s] : [V.W / 2 + (y - cam.c) * V.s, V.cross / 2 + x * V.s];
    const houseCam = () => Math.min(SHEET_Y1 + .3 - V.L / 2, TEE_Y + 2.2 - (V.L / 2 - 4.2) * .2);

    /* ---------- input ---------- */
    const myTurn = () => !st.over && !pb.on && ctx.canAct(st.turn);
    let base = null;
    const sling = K.sling(ctx, cv, {
      enabled: myTurn, max: () => Math.min(cv.w, cv.h) * .4, min: .04,
      change: s => {
        // s.dx,s.dy: screen unit vector opposite the pull; convert to sheet frame
        let fwd, lat; if (V.port) { fwd = -s.dy; lat = s.dx; } else { fwd = s.dx; lat = s.dy; }
        if (fwd < .2) fwd = .2;
        aim.xa = BX.clamp(lat / fwd * 2.2, -HALF + .1, HALF - .1); aim.p = s.p;
      },
      release: () => throwIt(),
    });
    function throwIt() {
      if (!myTurn()) return;
      const a = makeShot(aim);
      ctx.sfx('roll'); ctx.act(a, st.turn);
    }
    function makeShot(a) {
      const vx = a.xa - 0, vy = TEE_Y - START_Y, l = Math.hypot(vx, vy);
      return {dx: +(vx / l).toFixed(6), dy: +(vy / l).toFixed(6), v: +p2v(a.p, a.w).toFixed(4), s: a.s, w: a.w};
    }
    function key(e) {
      if (!myTurn()) return;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { aim.xa = BX.clamp(aim.xa + (e.code === 'ArrowRight' ? .05 : -.05), -HALF, HALF); keyT = performance.now(); }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { aim.p = BX.clamp(aim.p + (e.code === 'ArrowUp' ? .01 : -.01), 0, 1); keyT = performance.now(); }
      if (e.code === 'KeyQ' || e.code === 'KeyE') { aim.s = e.code === 'KeyE' ? 1 : -1; segSpin.refresh(); }
      if (e.code === 'Space' || e.code === 'Enter') throwIt();
    }
    // preview path (no other stones)
    let pvKey = '', pv = null;
    function preview() {
      const shot = makeShot(aim); shot.t = 0;
      const k = JSON.stringify(shot); if (k === pvKey) return pv;
      const r = simulate([], shot, true); pvKey = k;
      pv = r.frames.map(f => [f[0], f[1]]).filter(p => p[1] < 50);
      return pv;
    }

    /* ---------- rules ---------- */
    const firstThrower = () => 1 - st.hammer;
    function status() {
      ctx.info(0, st.score[0] + ' 分'); ctx.info(1, st.score[1] + ' 分');
      if (st.over) return ctx.status('比赛结束 ' + st.score[0] + ' : ' + st.score[1]);
      if (pb.on) return ctx.status(ctx.name(Z.turn) + ' 掷壶中…');
      const k = st.thrown[st.turn] + 1, endLbl = st.end >= st.ends ? '加赛' : `第 ${st.end + 1}/${st.ends} 局`;
      const who = ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + '：' : '轮到你：') : ctx.name(st.turn) + ' ';
      ctx.status(`${endLbl} · ${who}第 ${k}/${PER} 壶${st.hammer === st.turn && k === PER ? '（后手）' : ''}`);
    }
    st.turn = firstThrower();
    const inst = {
      st,
      toMove: () => st.over || pb.on ? null : st.turn,
      valid: a => a && isFinite(a.dx) && isFinite(a.dy) && isFinite(a.v),
      apply(a, by) {
        const t = st.turn;
        // sanitize
        let dx = +a.dx || 0, dy = +a.dy || 1; const l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
        if (dy < .95) { dy = .95; dx = dx < 0 ? -Math.sqrt(1 - dy * dy) : Math.sqrt(1 - dy * dy); }
        let v = Math.min(VMAX, Math.max(VMIN * .8, +a.v || VMIN));
        const s = a.s < 0 ? -1 : 1, w = Math.max(0, Math.min(3, Math.round(+a.w || 0)));
        // ice imperfection (deterministic)
        const e = (ctx.rng() - .5) * .0016; const ndx = dx - e * dy, ndy = dy + e * dx, nl = Math.sqrt(ndx * ndx + ndy * ndy);
        dx = ndx / nl; dy = ndy / nl; v *= 1 + (ctx.rng() - .5) * .008;
        const before = st.stones.map(o => ({x: o.x, y: o.y, t: o.t}));
        const r = simulate(st.stones, {dx, dy, v, s, w, t}, !ctx.fast);
        let stones = r.stones.map(o => ({x: o.x, y: o.y, t: o.t}));
        let foul = r.hogOut ? 'hog' : null;
        const nThrown = st.thrown[0] + st.thrown[1];
        if (st.fgz && nThrown < 4) {
          const prot = before.map((o, i) => ({o, i})).filter(q => q.o.t !== t && inFGZ(q.o));
          const gone = prot.some(q => !r.stones.some(z => z.i === q.i));
          if (gone) { stones = before.slice(); foul = 'fgz'; }
        }
        const snap = {turn: t, end: st.end, thrown: st.thrown.slice(), score: st.score.slice(), card: st.card.map(c => c.slice()), hammer: st.hammer, stones: before};
        st.stones = stones; st.thrown[t]++;
        st.last = {t, foul};
        let endInfo = null;
        if (st.thrown[0] >= PER && st.thrown[1] >= PER) {
          const c = count(st.stones);
          endInfo = {team: c.team, pts: c.pts, counting: c.counting, stones: st.stones.slice()};
          if (c.team >= 0) { st.score[c.team] += c.pts; st.hammer = 1 - c.team; }
          st.card[0].push(c.team === 0 ? c.pts : 0); st.card[1].push(c.team === 1 ? c.pts : 0);
          st.end++; st.thrown = [0, 0]; st.stones = [];
          if (st.end >= st.ends) {
            if (st.score[0] !== st.score[1] || st.extra >= (BX.test ? 1 : 3)) st.over = true;
            else st.extra++;
          }
          st.turn = 1 - st.hammer;
        } else st.turn = 1 - t;
        if (!ctx.fast) {
          show = {r, snap, foul, endInfo, t, w, s, done: false, ei: 0, spin: 0};
          const simT = r.steps * DT, th = r.tHouse;
          const slow = [[0, Math.max(0, th), 7], [Math.max(0, th), simT + 5, 2.2]];
          for (const ev of r.ev) if (ev[0] === 'x') continue; else if (ev[1] === 'hit' && ev[4] > .6) slow.push([ev[0] * DT - .05, ev[0] * DT + .35, .45]);
          pb.start(simT + (endInfo ? 3.2 : .7), () => { show = null; status(); }, slow);
          if (ctx.isRemote(t) || ctx.isAI(t)) lastRemote = null;
        }
        if (st.over) {
          const w2 = st.score[0] === st.score[1] ? -1 : st.score[0] > st.score[1] ? 0 : 1;
          ctx.end({winner: w2, text: `${ctx.name(0)} ${st.score[0]} : ${st.score[1]} ${ctx.name(1)}`, delay: show ? (r.steps * DT / 1.6 + 3.4) * 1000 : 600});
        }
        status();
      },
      aiMove(seat, level) { return ai(seat, level); },
      onTurn: status, key,
      resize() { V = layout(); },
      frame(dt) {
        pb.tick(dt); fx.update(dt * (pb.on ? Math.min(1, pb.rate) : 1));
        V = layout(); Z = show ? Object.assign({}, st, show.snap, {over: false}) : st;
        const showBar = myTurn(); bar.classList.toggle('hide', !showBar);
        draw(dt);
      },
    };

    /* ---------- AI ---------- */
    function evalPos(stones, me, remainMe, remainOp, hammerMe) {
      const c = count(stones);
      let v = c.team === me ? c.pts : c.team >= 0 ? -c.pts : 0;
      if (c.team === me && c.pts) v += .15;
      for (const s of stones) {
        const d = Math.sqrt(s.x * s.x + s.y * s.y), sg = s.t === me ? 1 : -1;
        if (d < HOUSE + R) v += sg * .18 * (1 - d / (HOUSE + R));
        else if (inFGZ(s) && Math.abs(s.x) < 1.2 && remainMe + remainOp > 2) v += sg * (hammerMe === (s.t === me) ? .05 : .2);
      }
      return v;
    }
    function ai(seat, level) {
      const t0 = performance.now(), budget = BX.test ? 40 : 650;
      const remainMe = PER - st.thrown[seat] - 1, remainOp = PER - st.thrown[1 - seat], hammerMe = st.hammer === seat;
      const cands = [];
      const xs = [0, -.4, .4, -.8, .8, -1.2, 1.2, -.2, .2, -.6, .6, -1, 1, -1.5, 1.5, -1.8, 1.8];
      const ps = level === 1 ? [.19, .23, .14] : [.19, .55, .23, .14, .75, .28, .09, .4, 1, .32];
      // aim at existing stones for takeouts
      const targets = st.stones.filter(s => s.t !== seat).map(s => s.x);
      for (const p of ps) for (const sp of [1, -1]) for (const x of xs.concat(targets.map(x2 => x2 + sp * -.5), targets)) cands.push({xa: x, p, s: sp, w: p < .3 ? (level >= 2 ? 1 : 0) : 0});
      let best = null, bv = -1e9, n = 0;
      const order = cands.map((c, i) => [c, (i * 7919) % cands.length]).sort((a, b) => a[1] - b[1]).map(z => z[0]);
      // keep a coarse prefix first so short budgets still cover the space
      for (const c of order) {
        if (n > 8 && performance.now() - t0 > budget) break;
        const sh = makeShot(c); sh.t = seat;
        const r = simulate(st.stones, sh, false);
        let stones = r.stones;
        if (st.fgz && st.thrown[0] + st.thrown[1] < 4) {
          const gone = st.stones.some((o, i) => o.t !== seat && inFGZ(o) && !r.stones.some(z => z.i === i));
          if (gone) stones = st.stones.concat([]);
        }
        let v = evalPos(stones, seat, remainMe, remainOp, hammerMe) + Math.random() * .02;
        if (level === 1) v += Math.random() * .8;
        n++;
        if (v > bv) { bv = v; best = c; }
      }
      if (!best) best = {xa: 0, p: .19, s: 1, w: 0};
      const na = [0, .1, .05, .018][level], np = [0, .025, .012, .004][level];
      const g2 = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const shot = Object.assign({}, best, {xa: best.xa + g2() * na, p: BX.clamp(best.p + g2() * np, 0, 1)});
      if (!ctx.isRemote(seat)) { aim = Object.assign({}, aim, shot); }
      return makeShot(shot);
    }

    /* ---------- drawing ---------- */
    function sheetBG(g) {
      // draw the whole sheet into a long offscreen strip in sheet units (pixel per metre = V.s), oriented like the screen
      const len = (SHEET_Y1 - SHEET_Y0) * V.s, wid = (HALF * 2) * V.s;
      return cache('sheet' + (V.port ? 'p' : 'l'), V.port ? wid : len, V.port ? len : wid, cv.dpr, (c) => {
        const S = V.s;
        const P = (x, y) => V.port ? [(x + HALF) * S, (SHEET_Y1 - y) * S] : [(y - SHEET_Y0) * S, (x + HALF) * S];
        const W2 = V.port ? wid : len, H2 = V.port ? len : wid;
        const ig = c.createLinearGradient(0, 0, V.port ? W2 : 0, V.port ? 0 : H2); ig.addColorStop(0, '#dfeaee'); ig.addColorStop(.5, '#f4f9fa'); ig.addColorStop(1, '#dbe7eb');
        c.fillStyle = ig; c.fillRect(0, 0, W2, H2);
        // pebble
        const rr = BX.rng(9); c.fillStyle = 'rgba(120,150,170,.12)';
        for (let i = 0; i < W2 * H2 / 260; i++) { c.fillRect(rr() * W2, rr() * H2, 1.2, 1.2); }
        // ink-wash mountains frozen under the ice near the middle
        c.save(); c.globalAlpha = .5;
        const [mx, my] = P(-HALF, -16), [mx2, my2] = P(HALF, -11);
        if (V.port) { K.mountains(c, mx, my2, mx2 - mx, my - my2, {seed: 12, layers: 2, color: [60, 90, 110], top: .1, base: .9, alpha: [.12, .2]}); }
        else { c.translate(mx, my); c.rotate(-Math.PI / 2); c.translate(-(my2 - my), 0); K.mountains(c, 0, 0, my2 - my, mx2 - mx, {seed: 12, layers: 2, color: [60, 90, 110], top: .1, base: .9, alpha: [.12, .2]}); }
        c.restore();
        // house
        const [hx, hy] = P(0, 0);
        for (const [r, col] of [[HOUSE, 'rgba(178,58,43,.82)'], [1.22, '#f4f9fa'], [.61, 'rgba(63,127,107,.85)'], [.15, '#f4f9fa']]) { c.fillStyle = col; D.circle(c, hx, hy, r * S); c.fill(); }
        c.strokeStyle = 'rgba(200,160,82,.8)'; c.lineWidth = 1.5; for (const r of [HOUSE, 1.22, .61]) { D.circle(c, hx, hy, r * S); c.stroke(); }
        // FGZ tint
        const [f1x, f1y] = P(-HALF, HOG), [f2x, f2y] = P(HALF, TEE_Y);
        // lines
        const line = (x1, y1, x2, y2, col, w) => { const [a1, b1] = P(x1, y1), [a2, b2] = P(x2, y2); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a1, b1); c.lineTo(a2, b2); c.stroke(); };
        line(0, SHEET_Y0, 0, SHEET_Y1, 'rgba(40,60,80,.35)', 1.2);
        line(-HALF, 0, HALF, 0, 'rgba(40,60,80,.55)', 1.5);
        line(-HALF, BACK, HALF, BACK, 'rgba(40,60,80,.6)', 2);
        line(-HALF, HOG, HALF, HOG, 'rgba(178,58,43,.85)', Math.max(3, .1 * S));
        line(-HALF, START_Y, HALF, START_Y, 'rgba(178,58,43,.85)', Math.max(3, .1 * S));
        // hack
        const [kx, ky] = P(0, -30.2); c.fillStyle = '#2b2118'; c.fillRect(kx - .2 * S, ky - .08 * S, .4 * S, .16 * S);
        // labels
        const lbl = (s, x, y) => { const [lx, ly] = P(x, y); c.save(); c.translate(lx, ly); if (!V.port) c.rotate(-Math.PI / 2); D.text(c, s, 0, 0, {size: Math.max(10, S * .2), color: 'rgba(178,58,43,.6)', font: 'serif', weight: 700}); c.restore(); };
        lbl('前掷线', HALF - .55, HOG + .25); lbl('底线', HALF - .4, BACK + .2);
        lbl('自由防守区', -HALF + .75, HOG + 2.4);
        void f1x; void f1y; void f2x; void f2y;
      });
    }
    function draw(dt) {
      const g = cv.g; cv.clear('#1f140b');
      // camera
      let target = houseCam();
      let liveStones = null, thrownPos = null;
      if (show) {
        const fr = show.r.frames, k = Math.min(fr.length - 1, Math.floor(pb.t / (DT * 2)));
        const f = fr[k]; liveStones = [];
        for (let i = 0; i < f.length / 2; i++) liveStones.push({x: f[i * 2], y: f[i * 2 + 1], t: i < show.snap.stones.length ? show.snap.stones[i].t : show.t, me: i === f.length / 2 - 1});
        thrownPos = liveStones[liveStones.length - 1];
        if (thrownPos.y < 50) target = Math.min(houseCam(), Math.max(SHEET_Y0 + V.L / 2, thrownPos.y + V.L * .22));
        while (show.ei < show.r.ev.length && show.r.ev[show.ei][0] <= k * 2 + 1) fire(show.r.ev[show.ei++], f);
        show.spin += dt * pb.rate * 1.6 * show.s;
        if (pb.t >= show.r.steps * DT && !show.done) { show.done = true; atRest(); }
      }
      cam.c += (target - cam.c) * Math.min(1, dt * (show ? 6 : 3));
      if (!isFinite(cam.c)) cam.c = target;
      const [ox, oy] = fx.off(); g.save(); g.translate(ox, oy);
      // boards & arena
      D.wood(g, 0, 0, V.W, V.H, {seed: 5, base: '#5a3a20', dark: '#2a190d', vertical: V.port, grain: .25});
      const sb = sheetBG(g), [sx0, sy0] = V.port ? T(-HALF, SHEET_Y1) : T(-HALF, SHEET_Y0);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(sx0 - 6, sy0 - 6, (V.port ? HALF * 2 * V.s : (SHEET_Y1 - SHEET_Y0) * V.s) + 12, (V.port ? (SHEET_Y1 - SHEET_Y0) * V.s : HALF * 2 * V.s) + 12);
      g.drawImage(sb, sx0, sy0, V.port ? HALF * 2 * V.s : (SHEET_Y1 - SHEET_Y0) * V.s, V.port ? (SHEET_Y1 - SHEET_Y0) * V.s : HALF * 2 * V.s);
      // stones
      const stones = liveStones || Z.stones;
      const cnt = show && show.done && show.endInfo ? show.endInfo : null;
      const ci = cnt ? new Set(cnt.counting) : null;
      // trail for thrown stone
      if (show) {
        const fr = show.r.frames, k = Math.min(fr.length - 1, Math.floor(pb.t / (DT * 2))), me = fr[0].length / 2 - 1;
        g.save(); g.lineCap = 'round';
        for (let i = Math.max(1, k - 60); i <= k; i++) { const a = fr[i - 1], b = fr[i]; if (b[me * 2 + 1] > 50) break; const [x1, y1] = T(a[me * 2], a[me * 2 + 1]), [x2, y2] = T(b[me * 2], b[me * 2 + 1]); g.strokeStyle = D.alpha(ctx.color(show.t), .35 * (1 - (k - i) / 60)); g.lineWidth = R * V.s * 1.3 * (1 - (k - i) / 60); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
        g.restore();
      }
      stones.forEach((s, i) => {
        if (s.y > 50) return;
        const [x, y] = T(s.x, s.y);
        if (x < -40 || y < -40 || x > V.W + 40 || y > V.H + 40) return;
        const rot = (s.me ? show.spin : 0) + i * 1.3 + (V.port ? 0 : Math.PI / 2);
        if (ci && ci.has(i)) { g.strokeStyle = '#ffe28a'; g.lineWidth = 3; g.shadowColor = '#ffd76a'; g.shadowBlur = 16; D.circle(g, x, y, R * V.s * 1.25 + 2 * Math.sin(performance.now() / 150)); g.stroke(); g.shadowBlur = 0; }
        drawStone(g, x, y, R * V.s, ctx.color(s.t), rot);
      });
      // sweepers
      if (show && thrownPos && thrownPos.y < 50 && show.w > 0 && pb.t < show.r.steps * DT - .5) {
        const sweep = Math.sin(performance.now() / 60) * .12 * show.w / 3;
        for (const sd of [-1, 1]) { const [bx, by] = T(thrownPos.x + sd * .32 + sweep * sd, thrownPos.y + .55); g.fillStyle = '#3a2414'; g.beginPath(); g.ellipse(bx, by, V.s * (V.port ? .16 : .06), V.s * (V.port ? .06 : .16), 0, 0, Math.PI * 2); g.fill(); }
        if (Math.random() < .5) fx.burst(thrownPos.x, thrownPos.y + .5, {n: 1, sp: .5, color: '#ffffff', life: .4, size: 2});
      }
      // aim UI
      if (!show && !st.over) drawAim(g);
      fx.draw(g, T, 1);
      g.restore();
      fx.drawFlash(g, V.W, V.H);
      drawHud(g, cnt);
    }
    function fire(e, f) {
      if (e[1] === 'hit') {
        const i = e[2], j = e[3], x = (f[i * 2] + f[j * 2]) / 2, y = (f[i * 2 + 1] + f[j * 2 + 1]) / 2;
        if (y > 50) return;
        ctx.sfx('hit'); fx.shake(Math.min(10, 3 + e[4] * 4));
        fx.burst(x, y, {n: 14, sp: 2.5 * V.s, color: ['#ffffff', '#cfe8f0', '#e6c57d'], life: .45, kind: 'spark'});
      } else if (e[1] === 'out') ctx.sfx('whoosh');
    }
    function atRest() {
      const f = show.foul;
      const me = show.r.all[show.r.all.length - 1];
      if (f === 'hog') { fx.text(me.x, Math.max(me.y, HOG - 1), '未过前掷线', {size: 20, life: 1.8}); ctx.sfx('error'); }
      else if (f === 'fgz') { fx.text(0, HOG + 1.5, '自由防守区违例', {size: 20, life: 1.8}); ctx.sfx('buzz'); }
      else if (me.on && inHouse(me)) { ctx.sfx('chip'); fx.burst(me.x, me.y, {n: 10, sp: 1.2 * V.s, color: ['#ffe28a', '#fff'], life: .6}); }
      if (show.endInfo) {
        const e = show.endInfo;
        ctx.after(250, () => {
          ctx.sfx(e.team >= 0 ? 'score' : 'draw'); fx.flashOn(.5);
          fx.text(0, 2.6, e.team >= 0 ? `${ctx.name(e.team)} 得 ${e.pts} 分` : '空局', {size: 28, life: 2.8, rise: 20});
        });
      }
    }
    function drawAim(g) {
      const mine = ctx.canAct(st.turn);
      const pts = mine ? preview() : null;
      if (mine) {
        const sp = pts.map(p => T(p[0], p[1]));
        K.guide(g, sp, {color: D.alpha(ctx.color(st.turn), 1), w: 3, alpha: .85, fade: .2, dash: [4, 8]});
        const end = pts[pts.length - 1];
        if (end) { const [ex, ey] = T(end[0], end[1]); g.globalAlpha = .45; drawStone(g, ex, ey, R * V.s, ctx.color(st.turn), 0); g.globalAlpha = 1; }
        // broom target
        const [bx, by] = T(aim.xa, TEE_Y);
        g.strokeStyle = '#1b1510'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx - 10, by); g.lineTo(bx + 10, by); g.moveTo(bx, by - 10); g.lineTo(bx, by + 10); g.stroke();
        D.circle(g, bx, by, 6); g.stroke();
        // power meter
        const mh = Math.min(170, V.H * .35), mx = V.port ? V.W - 26 : V.W - 30, my = V.port ? V.topH + 70 : 40;
        K.meter(g, mx, my, 14, mh, aim.p, {marks: [[d2p((HOG - START_Y + .4) * SWF(aim.w)), '防守'], [d2p((TEE_Y - START_Y - 1.2) * SWF(aim.w)), '进营'], [d2p((BACK - START_Y + .3) * SWF(aim.w)), '击打']]});
        if (st.thrown[0] + st.thrown[1] < 2 && st.end === 0 && !sling.on && performance.now() - keyT > 3000) {
          const [hx, hy] = T(0, -3.2);
          D.text(g, '按住画面向后拉 · 左右偏移瞄准 · 松手掷出', V.W / 2, V.port ? hy : V.cross - 22, {size: 14, color: '#2b2118', font: 'serif', weight: 700, stroke: 'rgba(255,255,255,.7)', strokeW: 4});
        }
      } else if (ctx.isRemote(st.turn) || ctx.isAI(st.turn)) {
        D.text(g, ctx.name(st.turn) + ' 正在瞄准…', V.W / 2, V.port ? V.topH + 30 : 26, {size: 15, color: '#fff3d6', font: 'serif', stroke: 'rgba(0,0,0,.5)', strokeW: 4});
      }
    }
    function drawHud(g, cnt) {
      // scoreboard: one row per team; columns = ends
      const nE = Math.max(Z.ends, Z.card[0].length), port = V.port;
      const cw = port ? Math.min(26, (V.W - 150) / (nE + 1)) : 24, nw = port ? 64 : 70, rh = port ? 20 : 20;
      const bw = nw + cw * nE + 34, bh = rh * 2 + 18;
      const bx = port ? (V.W - bw) / 2 : 8, by = port ? 2 : 8;
      g.save(); g.globalAlpha = .93; D.paper(g, bx, by, bw, bh, {r: 8}); g.restore();
      g.strokeStyle = 'rgba(90,60,30,.5)'; g.lineWidth = 1; D.rr(g, bx, by, bw, bh, 8); g.stroke();
      for (let e = 0; e < nE; e++) D.text(g, String(e + 1), bx + nw + cw * e + cw / 2, by + 9, {size: 10, color: e === Z.end ? C.red : C.ink2});
      D.text(g, '总', bx + nw + cw * nE + 17, by + 9, {size: 11, color: C.ink, weight: 800});
      for (let t = 0; t < 2; t++) {
        const y = by + 18 + rh * t + rh / 2;
        if (Z.hammer === t) { g.fillStyle = C.red; D.text(g, '锤', bx + 10, y, {size: 11, color: C.red, font: 'deco', weight: 400}); }
        drawStone(g, bx + 26, y, 6, ctx.color(t), 0);
        D.text(g, ctx.name(t), bx + 35, y, {size: 11, color: C.ink, align: 'left', maxW: nw - 36});
        for (let e = 0; e < Z.card[t].length; e++) D.text(g, String(Z.card[t][e]), bx + nw + cw * e + cw / 2, y, {size: 12, color: Z.card[t][e] ? C.ink : 'rgba(0,0,0,.35)', weight: Z.card[t][e] ? 800 : 400});
        D.text(g, String(Z.score[t]), bx + nw + cw * nE + 17, y, {size: 14, color: C.red, weight: 800});
      }
      // stones remaining
      const rx = port ? 10 : bx, ry = port ? V.H - V.barH - 16 : by + bh + 14;
      if (!port || true) for (let t = 0; t < 2; t++) {
        const left = PER - Z.thrown[t];
        for (let k = 0; k < PER; k++) { g.globalAlpha = k < left ? 1 : .2; drawStone(g, (port ? rx : rx) + 8 + k * 13, ry + t * 15 - (port ? 15 : 0), 5.5, ctx.color(t), 0); }
        g.globalAlpha = 1;
      }
    }
    status();
    return inst;
  },
});

function drawStone(g, x, y, r, col, rot) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,.28)'; D.circle(g, x + r * .12, y + r * .18, r * 1.02); g.fill();
  const gr = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
  gr.addColorStop(0, '#d6d6d2'); gr.addColorStop(.6, '#8f918f'); gr.addColorStop(1, '#4e504f');
  g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
  g.strokeStyle = 'rgba(30,30,30,.5)'; g.lineWidth = Math.max(1, r * .08); D.circle(g, x, y, r * .97); g.stroke();
  const cg = g.createRadialGradient(x - r * .2, y - r * .25, r * .05, x, y, r * .62);
  cg.addColorStop(0, D.shade(col, 35)); cg.addColorStop(1, D.shade(col, -15));
  g.fillStyle = cg; D.circle(g, x, y, r * .6); g.fill();
  if (r > 4) {
    g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = D.shade(col, -35); D.rr(g, -r * .14, -r * .62, r * .28, r * .9, r * .12); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; D.rr(g, -r * .07, -r * .58, r * .1, r * .7, r * .05); g.fill();
  }
  g.restore();
}
