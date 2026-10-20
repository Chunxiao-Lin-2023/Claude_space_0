/* 保龄球 — classic 10-pin, 10 frames. Perspective lane, deterministic ball + pin simulation inside apply. */
const D = BX.draw, C = BX.C, K = BX.data.pk;
const LANE_HW = .525, GUT = .65, HEAD = 18.29, PIT = 19.35, KICK = .8;
const BR = .109, PR = .061, PIN_H = .38, MB = 7, MP = 1.55, DT = 1 / 200, MAXSTEP = 1800;
const VMIN = 5.5, VMAX = 10, HOOK = 1.9, OIL = 11.5;
const SPOT = (() => { const s = [], row = .2639, sp = .3048; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) s.push([(i - r / 2) * sp, HEAD + r * row]); return s; })();
// pin numbering 1..10 standard: row0: 1; row1: 2,3; row2: 4,5,6; row3: 7..10 (left to right from bowler's view)

/* deterministic roll. pins: [[x,y]|null]*10; shot {x, dx, dy, v, h}. */
function simulate(pins, shot, rec) {
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
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy), dec = (p.down ? 2.4 : 6) * DT;
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
  rules: `<p>标准<b>十瓶保龄球</b>，每人打 <b>10 局</b>（frame），多名玩家按局轮流上场。</p>
<p><b>每局</b>最多投 2 球：第一球击倒全部 10 个球瓶为<b>全中</b>（X），本局结束；两球合计击倒全部为<b>补中</b>（/）；否则记击倒的瓶数。</p>
<p><b>计分：</b>全中 = 10 分 + 之后两球的瓶数；补中 = 10 分 + 下一球的瓶数；其他局 = 两球瓶数之和。第 10 局打出全中可再投 2 球、补中可再投 1 球（奖励球只用于计分）。满分 300 分（12 个全中）。</p>
<p>球掉进两侧<b>球沟</b>就无法击倒球瓶（记 0，显示“-”）。全部打完后总分最高者胜。单人练习会记录最高分。</p>
<p><b>操作：</b>先用下方按钮选择<b>站位</b>（在犯规线上的左右位置）和<b>弧线</b>（球在球道后段向左/右弯）。然后在画面上按住并<b>向后（向下）拉</b>，左右偏一点调整方向，拉得越长球速越快，松手出球。最佳击球点在 1 号瓶和 3 号瓶之间（右侧袋口）或 1、2 号之间（左侧袋口）。键盘：←→ 方向、↑↓ 球速、A/D 站位、空格出球。</p>`,
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
    let show = null, Z = st, aim = {x: .18, ang: 0, p: .55, h: -.5}, keyT = 0, cam = {y: -2.6, tgt: -2.6};
    const ui = ctx.ui(''); const bar = BX.h('div', {class: 'pk-bar'}); ui.append(bar);
    const posSeg = K.seg(bar, '站位', [['L', '◀'], ['R', '▶']], () => null, v => { aim.x = BX.clamp(aim.x + (v === 'L' ? -.06 : .06), -.42, .42); });
    const hookSeg = K.seg(bar, '弧线', [[-1, '↰强'], [-.5, '↰'], [0, '直'], [.5, '↱'], [1, '↱强']], () => aim.h, v => aim.h = v);
    void posSeg;
    /* ---------- projection ---------- */
    function layout() {
      const W = cv.w, H = cv.h, port = H > W;
      const cardH = cardHeight(W, port), barH = 60;
      const top = cardH, bot = H - barH;
      const zN = 2.2, hc = 1.25;
      let F = Math.min(W * .92 / 1.7 * zN, (bot - top - 40) * zN / hc);
      const hy = bot - hc * F / zN;
      return {W, H, port, top, bot, F, hy, hc, cardH, cx: W / 2};
    }
    function cardHeight(W, port) { const n = ctx.n; return n <= 2 ? 8 + n * 44 : 8 + n * 30; }
    let V = layout();
    const P3 = (x, y, z = 0) => { const d = Math.max(.25, y - cam.y); return [V.cx + x * V.F / d, V.hy + (V.hc - z) * V.F / d, V.F / d]; };
    /* ---------- input ---------- */
    const myTurn = () => !st.over && !pb.on && ctx.canAct(st.turn);
    const sling = K.sling(ctx, cv, {
      enabled: myTurn, max: () => Math.min(cv.w, cv.h) * .38, min: .05,
      change: s => { const fwd = Math.max(.25, -s.dy); aim.ang = BX.clamp(s.dx / fwd * .05, -.06, .06); aim.p = s.p; },
      release: () => roll(),
    });
    function shotOf(a) { const dy = 1 / Math.sqrt(1 + a.ang * a.ang); return {x: +a.x.toFixed(4), dx: +(a.ang * dy).toFixed(6), dy: +dy.toFixed(6), v: +(VMIN + a.p * (VMAX - VMIN)).toFixed(4), h: a.h}; }
    function roll() { if (!myTurn()) return; ctx.sfx('roll'); ctx.act(shotOf(aim), st.turn); }
    function key(e) {
      if (!myTurn()) return;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { aim.ang = BX.clamp(aim.ang + (e.code === 'ArrowRight' ? .002 : -.002), -.06, .06); keyT = performance.now(); }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { aim.p = BX.clamp(aim.p + (e.code === 'ArrowUp' ? .02 : -.02), 0, 1); keyT = performance.now(); }
      if (e.code === 'KeyA' || e.code === 'KeyD') aim.x = BX.clamp(aim.x + (e.code === 'KeyD' ? .03 : -.03), -.42, .42);
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
      toMove: () => st.over || pb.on ? null : st.turn,
      valid: a => a && isFinite(a.x) && isFinite(a.dx) && isFinite(a.dy) && isFinite(a.v),
      apply(a, by) {
        const who = st.turn;
        let dx = +a.dx || 0, dy = +a.dy || 1; const l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
        if (dy < .99) { dy = .99; dx = (dx < 0 ? -1 : 1) * Math.sqrt(1 - dy * dy); }
        const shot = {x: Math.max(-.45, Math.min(.45, +a.x || 0)), dx, dy, v: Math.max(VMIN, Math.min(VMAX, +a.v || VMIN)), h: Math.max(-1, Math.min(1, +a.h || 0))};
        const snap = {frame: st.frame, turn: who, ball: st.ball, pins: st.pins.slice(), rolls: st.rolls.map(r => r.slice())};
        const before = nUp(st.pins), r = simulate(st.pins, shot, !ctx.fast);
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
        st.last = {who, knocked, label};
        if (!ctx.fast) {
          show = {r, snap, knocked, label, who, done: false, ei: 0, shot};
          const simT = r.steps * DT;
          pb.start(simT + 1.3, () => { show = null; status(); }, [[r.tPins - .05, r.tPins + .7, .3]]);
          cam.y = -2.6;
        }
        if (st.over) finish(show ? (r.steps * DT + 2.4) * 1000 : 600);
        status();
      },
      aiMove(seat, level) { return ai(seat, level); },
      onTurn: status, key,
      resize() { V = layout(); },
      frame(dt) {
        pb.tick(dt); fx.update(dt * (pb.on ? Math.max(.3, pb.rate) : 1));
        Z = show ? Object.assign({}, st, show.snap, {over: false}) : st; V = layout();
        bar.classList.toggle('hide', !myTurn());
        hookSeg.refresh();
        draw(dt);
      },
    };
    function finish(delay) {
      const tt = BX.range(ctx.n).map(i => scoreCard(st.rolls[i]).total), best = Math.max(...tt), win = BX.range(ctx.n).filter(i => tt[i] === best);
      let text = BX.range(ctx.n).map(i => `${ctx.name(i)} ${tt[i]} 分`).join('　');
      if (ctx.n === 1) { const b = ctx.best('score', tt[0], 'max'); ctx.end({win: tt[0] >= 150, title: tt[0] === 300 ? '完美比赛！' : '十局打完', text: `总分 ${tt[0]}` + (b.isNew ? ' · 新纪录！' : ` · 最高 ${b.best}`), delay}); return; }
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
        const r = simulate(st.pins, shotOf(c), false);
        const kn = up.length - nUp(r.left);
        const v = kn + (nUp(r.left) === 0 ? 3 : 0) + Math.random() * .3;
        if (v > bv) { bv = v; best = c; }
      }
      if (!best) best = {x: .15, ang: -.004, p: .7, h: -.5};
      const na = [0, .006, .0028, .0012][level], nx = [0, .05, .025, .01][level];
      const g2 = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const pick = Object.assign({}, best, {ang: best.ang + g2() * na, x: BX.clamp(best.x + g2() * nx, -.45, .45)});
      if (!ctx.isRemote(seat)) aim = Object.assign({}, aim, pick);
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
      let bx = Z.pins ? aim.x : 0, by = 0, pins = Z.pins.map((p, i) => p ? {x: p[0], y: p[1], down: 0, i} : null), ballOn = true;
      if (show) {
        const fr = show.r.frames, k = Math.min(fr.length - 1, Math.floor(pb.t / (DT * 2))), f = fr[k];
        bx = f[0]; by = f[1]; ballOn = by < PIT - .1;
        pins = []; for (let i = 0; i < 10; i++) { const o = 2 + i * 3; if (f[o] < 50) pins.push({x: f[o], y: f[o + 1], down: f[o + 2], i}); }
        cam.tgt = Math.min(by - 2.6, HEAD - 4.4);
        while (show.ei < show.r.ev.length && show.r.ev[show.ei][0] <= k * 2 + 1) fire(show.r.ev[show.ei++], bx, by);
        if (pb.t >= show.r.steps * DT && !show.done) { show.done = true; atRest(); }
      } else { bx = aim.x; cam.tgt = -2.6; }
      cam.y += (cam.tgt - cam.y) * Math.min(1, dt * (show ? 9 : 4));
      const [ox, oy] = fx.off(); g.save(); g.translate(ox, oy);
      scene(g);
      // objects sorted far → near
      const objs = [];
      for (const p of pins) objs.push({y: p.y, d: () => drawPinAt(g, p)});
      if (ballOn) objs.push({y: by, d: () => drawBall(g, bx, by)});
      if (!show && myTurn()) drawGuide(g);
      objs.sort((a, b) => b.y - a.y); for (const o of objs) o.d();
      fx.draw(g, (x, y) => { const p = P3(x, y, .15); return [p[0], p[1]]; }, 1);
      g.restore();
      fx.drawFlash(g, V.W, V.H);
      drawCard(g);
      drawRack(g, show ? null : Z.pins);
      if (myTurn() && (sling.on || performance.now() - keyT < 1500)) K.meter(g, V.W - 28, V.top + 50, 14, Math.min(150, (V.bot - V.top) * .45), aim.p, {});
      if (myTurn() && Z.frame === 0 && Z.ball === 0 && !sling.on && performance.now() - keyT > 3000) D.text(g, '按住画面向下拉，左右调方向，松手出球', V.W / 2, V.bot - 14, {size: 14, color: '#fff3d6', font: 'serif', stroke: 'rgba(0,0,0,.6)', strokeW: 4});
    }
    function drawPinAt(g, p) {
      const [x, y, s] = P3(p.x, p.y);
      if (y < V.top - 20 || y > V.H + 40) return;
      if (!p.down) { drawPin(g, x, y, PIN_H * s, false); return; }
      // lying pin: from base along fall dir
      const fl = show && show.r.fall[p.i] ? show.r.fall[p.i] : [0, 1];
      const [x2, y2] = P3(p.x + fl[0] * PIN_H * .8, p.y + fl[1] * PIN_H * .8);
      g.save(); g.lineCap = 'round';
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .1 * s; g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x2, y2 + 2); g.stroke();
      g.strokeStyle = '#f6efe2'; g.lineWidth = .1 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = C.red; g.lineWidth = .1 * s; g.beginPath(); const mx = x + (x2 - x) * .62, my = y + (y2 - y) * .62; g.moveTo(mx, my); g.lineTo(mx + (x2 - x) * .08, my + (y2 - y) * .08); g.stroke();
      g.restore();
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
    function drawGuide(g) {
      const sh = shotOf(aim); let x = sh.x, y = 0, vx = sh.dx * sh.v, vy = sh.dy * sh.v;
      const pts = [];
      for (let i = 0; i < 400; i++) {
        if (y > OIL && y < HEAD) { const sp = Math.sqrt(vx * vx + vy * vy); vx += sh.h * HOOK * .01 * (y - OIL < 2 ? (y - OIL) / 2 : 1); const s2 = Math.sqrt(vx * vx + vy * vy); vx *= sp / s2; vy *= sp / s2; }
        x += vx * .01; y += vy * .01; const p = P3(x, y, .01); pts.push([p[0], p[1]]);
        if (y > HEAD - .2 || Math.abs(x) > LANE_HW) break;
      }
      K.guide(g, pts.filter((_, i) => i % 3 === 0), {color: '#fffaf0', w: 2.5, alpha: .9, fade: .75, dash: [6, 8]});
    }
    function fire(e, x, y) {
      if (e[1] === 'ball') { ctx.sfx('crash'); fx.shake(Math.min(12, 4 + e[2] * 1.2)); fx.burst(x, y + .15, {n: 16, sp: 120, color: ['#fff', '#ffe28a', '#e6c57d'], life: .5, kind: 'spark'}); }
      else if (e[1] === 'pin') { if (Math.random() < .5) ctx.sfx('hit'); }
      else if (e[1] === 'gutter') ctx.sfx('roll');
    }
    function atRest() {
      const L = show.label, strike = L === '全中！', spare = L === '补中！';
      ctx.sfx(strike || spare ? 'win' : show.knocked ? 'score' : 'buzz');
      if (strike || spare) { fx.flashOn(1); fx.shake(8); for (let i = 0; i < 3; i++) fx.burst((Math.random() - .5) * .8, HEAD + .3, {n: 30, sp: 200, color: ['#ffe28a', '#d0533f', '#fff6dd', '#5aa08a'], life: 1.3, g: 120, a0: -Math.PI / 2, spread: 2.4}); }
      fx.text(0, HEAD - .8, L, {size: strike || spare ? 40 : 28, life: 1.6, rise: 30});
    }
    function drawCard(g) {
      const n = ctx.n, W = V.W, big = n <= 2, rh = big ? 44 : 30, x0 = 6, nameW = Math.min(W * .16, 86), totW = big ? 44 : 38;
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
      const s = Math.min(16, (V.bot - V.top) * .045), x0 = 14 + s * 2, y0 = V.top + 12 + s * 4;
      g.fillStyle = 'rgba(30,18,8,.7)'; D.rr(g, x0 - s * 2.4, y0 - s * 4.2, s * 4.8, s * 4.9, 8); g.fill();
      SPOT.forEach(([x, y], i) => { const px = x0 + x / .3048 * s * 1.1, py = y0 - (y - HEAD) / .2639 * s; g.fillStyle = pins[i] ? '#fff6e6' : 'rgba(255,255,255,.15)'; D.circle(g, px, py, s * .38); g.fill(); });
    }
    status();
    return inst;
  },
});
function drawPin(g, x, y, hgt, down) {
  // x,y = base on the floor; hgt = pin height in px
  const w = hgt * .3;
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
  if (hgt > 10) { g.fillStyle = '#b23a2b'; g.fillRect(x - w * .19, y - hgt * .72, w * .38, hgt * .035); g.fillRect(x - w * .17, y - hgt * .67, w * .34, hgt * .03); }
  g.restore();
}
