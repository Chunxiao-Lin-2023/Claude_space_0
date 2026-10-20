/* 跳棋 — 两人对角星形跳棋（各 10 子） */
const D = BX.draw, C = BX.C;
/* star board in cube-ish axial coords (x, y) with z = -x-y; hole if any two of |x|,|y|,|z| ≤ 4 and all ≤ 8 */
const CELLS = [], AT = new Map();
for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) {
  const z = -x - y, ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  if (Math.max(ax, ay, az) > 8) continue;
  if ([ax, ay, az].filter(v => v <= 4).length < 2) continue;
  AT.set(x + ',' + y, CELLS.length); CELLS.push({x, y});
}
const NC = CELLS.length;   // 121
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const NB = CELLS.map(({x, y}) => DIRS.map(([dx, dy]) => AT.has((x + dx) + ',' + (y + dy)) ? AT.get((x + dx) + ',' + (y + dy)) : -1));
const JP = CELLS.map(({x, y}) => DIRS.map(([dx, dy]) => AT.has((x + 2 * dx) + ',' + (y + 2 * dy)) ? AT.get((x + 2 * dx) + ',' + (y + 2 * dy)) : -1));
/* screen coords (unit spacing, pointy rows): row = y, col = x + y/2 ; seat 0 (红) starts at the bottom (y > 4) */
const SX = CELLS.map(({x, y}) => x + y / 2), SY = CELLS.map(({y}) => y * 0.8660254);
const HOME = [[], []];
CELLS.forEach(({x, y}, i) => { if (y > 4) HOME[0].push(i); if (y < -4) HOME[1].push(i); });
const GOAL = [HOME[1], HOME[0]];
const GSET = GOAL.map(a => new Set(a));
/* distance (rows) to the far tip of the goal triangle; plus a centring term */
const rowD = (s, i) => s === 0 ? CELLS[i].y + 8 : 8 - CELLS[i].y;
function fillGoalDist(s, b) {   // sum over own marbles of distance to the goal, assignment-free approximation
  let d = 0;
  for (let i = 0; i < NC; i++) if (b[i] === s + 1) d += rowD(s, i) + Math.abs(SX[i]) * .35;
  return d;
}
function jumps(b, from) {   // all chain-jump destinations from `from` with a path
  const out = new Map(); const q = [from]; out.set(from, [from]);
  for (let k = 0; k < q.length; k++) {
    const u = q[k];
    for (let d = 0; d < 6; d++) {
      const m = NB[u][d], t = JP[u][d];
      if (m < 0 || t < 0 || !b[m] || b[t] || out.has(t)) continue;
      out.set(t, out.get(u).concat(t)); q.push(t);
    }
  }
  out.delete(from); return out;
}
function movesFrom(b, f) {
  const res = new Map();
  for (let d = 0; d < 6; d++) { const t = NB[f][d]; if (t >= 0 && !b[t]) res.set(t, [f, t]); }
  const saved = b[f]; b[f] = 0;   // the moving marble is not an obstacle for its own chain
  for (const [t, path] of jumps(b, f)) if (!res.has(t)) res.set(t, path);
  b[f] = saved;
  return res;
}
/* a marble that reached its goal triangle may still move, but not leave it (classic rule) */
function legalFrom(b, s, f) {
  const r = movesFrom(b, f);
  if (GSET[s].has(f)) for (const t of [...r.keys()]) if (!GSET[s].has(t)) r.delete(t);
  return r;
}
function allMoves(b, s) {
  const out = [];
  for (let f = 0; f < NC; f++) if (b[f] === s + 1) for (const [t, path] of legalFrom(b, s, f)) out.push({f, t, path});
  return out;
}
/* win: every goal hole filled; opponent stragglers that never left (their own start triangle = our goal) count for us,
   but only once both sides have made ANTI_PLY/2 moves (anti-blocking rule) */
const ANTI_PLY = 60;
function won(b, s, ply) {
  let mine = 0, opp = 0;
  for (const i of GOAL[s]) { if (b[i] === s + 1) mine++; else if (b[i]) opp++; else return false; }
  return mine === 10 || (mine >= 1 && ply >= ANTI_PLY);
}

BX.register({
  id: 'chinesecheckers', title: '跳棋', cat: 'heavy', order: 3, sub: '星盘连跳，先占对角',
  desc: '经典六角星跳棋（两人对角）。每方 10 颗弹珠，一步走一格或沿棋子连续跳跃，先把全部弹珠搬进对面三角营的一方获胜。',
  kind: 'turn', seats: 2, seatNames: ['红方', '蓝方'], seatColors: ['#c23a2b', '#2f5d8a'],
  rules: `<p><b>棋盘</b>：六角星形棋盘共 121 个孔。两人对局时，双方各占相对的一个三角营，每方 <b>10 颗</b>弹珠。红方先走。</p>
<p><b>走法</b>：每回合移动自己的一颗弹珠，二选一：</p>
<ul><li><b>移一格</b>：走到相邻的空孔（六个方向）。</li>
<li><b>跳跃</b>：沿直线越过紧邻的<b>一颗</b>棋子（自己或对方的都可以），落在其正后方的空孔上；落下后若还能继续跳，可以<b>连续跳跃</b>，路线可以拐弯，在任意一次跳跃后停下。被跳过的棋子不会被吃掉。</li></ul>
<p>同一回合不能既移一格又跳跃。弹珠进入对面三角营后，只能在营内移动，不能再离开。</p>
<p><b>胜负</b>：先把 10 颗弹珠全部移入正对面三角营的一方获胜。<b>防堵规则</b>：如果对方有弹珠一直赖在它的出发营（也就是你的目标营）里不走，只要营内其余的孔都已被你的弹珠占满，也算你获胜（双方各走满 30 步后生效）。</p>
<p><b>操作</b>：点自己的弹珠选中（亮出所有可达位置），再点目标孔即可；跳跃路线会以虚线显示。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#7a4a28', '#3a2010');
    const cx = w / 2, cy = h / 2, s = h * .056;
    g.save(); g.translate(cx, cy);
    g.fillStyle = '#e8d3a6'; g.beginPath();
    for (let k = 0; k < 2; k++) { const a0 = k ? Math.PI / 2 : -Math.PI / 2; g.moveTo(Math.cos(a0) * 8.5 * s * 1.04, Math.sin(a0) * 8.5 * s); for (let j = 1; j <= 3; j++) { const a = a0 + j * 2 * Math.PI / 3; g.lineTo(Math.cos(a) * 8.5 * s * 1.04, Math.sin(a) * 8.5 * s); } g.closePath(); }
    g.fill();
    for (let i = 0; i < NC; i++) {
      const x = SX[i] * s * 1.04, y = SY[i] * s * 1.04, c = HOME[0].includes(i) ? '#c23a2b' : HOME[1].includes(i) ? '#2f5d8a' : null;
      if (c) D.disc(g, x, y, s * .46, c, {shadow: false}); else { g.fillStyle = 'rgba(90,60,30,.45)'; D.circle(g, x, y, s * .2); g.fill(); }
    }
    g.restore();
  },
  create(ctx) {
    const b = new Array(NC).fill(0);
    for (const i of HOME[0]) b[i] = 1; for (const i of HOME[1]) b[i] = 2;
    const st = {b, turn: 0, last: null, moves: 0, over: false, win: null};
    const cv = ctx.canvas();
    let sel = -1, preview = -1, anim = null, think = 0;
    const flip = () => ctx.view === 1;

    function layout() {
      const W = cv.w, H = cv.h, port = H > W * 1.05;
      const bw = 17.4, bh = 17.4;   // round plate (radius 8.6) around the star
      if (port) {
        const ph = 50, f = BX.fit(W, H - 2 * ph - 12, bw, bh, 4);
        const oy = f.y + ph + 6, pw = Math.min(W - 12, 420), px = (W - pw) / 2;
        return {s: f.s, cx: f.x + bw / 2 * f.s, cy: oy + bh / 2 * f.s, top: {x: px, y: oy - ph - 2, w: pw, h: ph - 4}, bot: {x: px, y: oy + bh * f.s + 4, w: pw, h: ph - 4}, port};
      }
      const PW = BX.clamp(W * .2, 130, 220), f = BX.fit(W - PW - 14, H, bw, bh, 6), ox = (W - (bw * f.s + PW + 14)) / 2;
      const cx = ox + bw / 2 * f.s, cy = f.y + bh / 2 * f.s, px = ox + bw * f.s + 14, top = Math.max(8, cy - bh / 2 * f.s), ph = Math.min(90, (bh * f.s) * .22);
      return {s: f.s, cx, cy, top: {x: px, y: top, w: PW, h: ph}, bot: {x: px, y: cy + bh / 2 * f.s - ph, w: PW, h: ph}, port};
    }
    const P = (i, L) => { const k = flip() ? -1 : 1; return [L.cx + SX[i] * L.s * k, L.cy + SY[i] * L.s * k]; };
    function cellAt(p, L) {
      let best = -1, bd = 1e9;
      for (let i = 0; i < NC; i++) { const [x, y] = P(i, L), d = (x - p.x) ** 2 + (y - p.y) ** 2; if (d < bd) { bd = d; best = i; } }
      return bd < (L.s * .62) ** 2 ? best : -1;
    }
    const myTurn = () => !st.over && ctx.canAct(st.turn);
    const touchDev = BX.TOUCH.matches;
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!myTurn() || anim) return;
      const L = layout(), i = cellAt(cv.pos(e), L); if (i < 0) { sel = -1; preview = -1; return; }
      if (st.b[i] === st.turn + 1) { sel = sel === i ? -1 : i; preview = -1; ctx.sfx('select'); return; }
      if (sel >= 0) {
        const mv = legalFrom(st.b, st.turn, sel);
        if (mv.has(i)) {
          // small boards (phones): a jump target shows its path first, tap again to confirm
          if (e.pointerType !== 'mouse' && L.s < 26 && preview !== i) { preview = i; ctx.sfx('tick'); return; }
          const f = sel; sel = -1; preview = -1; ctx.act({f, t: i}, st.turn); return;
        }
      }
      sel = -1; preview = -1;
    });

    function status() {
      const inGoal = s => GOAL[s].filter(i => st.b[i] === s + 1).length;
      ctx.info(0, '入营 ' + inGoal(0) + '/10'); ctx.info(1, '入营 ' + inGoal(1) + '/10');
      if (st.over) return ctx.status(st.win != null ? ctx.name(st.win) + ' 全部入营' : '对局结束');
      if (ctx.canAct(st.turn)) ctx.status((ctx.hotseat ? ctx.name(st.turn) + '走棋' : '轮到你走棋') + ' · 点弹珠再点目标');
      else ctx.status(ctx.isAI(st.turn) ? ctx.name(st.turn) + ' 思考中…' : '等待 ' + ctx.name(st.turn) + ' 走棋…');
    }

    /* ---------- AI ---------- */
    function evalFor(bd, s) {
      const o = 1 - s; let v = fillGoalDist(o, bd) - fillGoalDist(s, bd);
      // stragglers left behind in the home triangle are costly; reward goal triangle depth
      for (const i of HOME[s]) if (bd[i] === s + 1) v -= 1.5;
      for (const i of HOME[o]) if (bd[i] === o + 1) v += 1.5;
      if (won(bd, s, st.moves + 2)) v += 1000; if (won(bd, o, st.moves + 2)) v -= 1000;
      return v;
    }
    function gain(s, m) { return rowD(s, m.f) - rowD(s, m.t) + (Math.abs(SX[m.f]) - Math.abs(SX[m.t])) * .35; }
    async function aiMove(seat, level) {
      for (let k = 0; anim && k < 60 && !ctx.fast; k++) await BX.sleep(40);   // let the previous move's animation finish
      const bd = st.b.slice(), ms = allMoves(bd, seat);
      if (!ms.length) return null;
      for (const m of ms) { bd[m.f] = 0; bd[m.t] = seat + 1; const w = won(bd, seat, st.moves + 1); bd[m.t] = 0; bd[m.f] = seat + 1; if (w) return {f: m.f, t: m.t}; }
      const late = GOAL[seat].filter(i => bd[i] === seat + 1).length >= 6;
      if (level === 1) {
        const sc = ms.map(m => [m, gain(seat, m) + Math.random() * 3.2]);
        const m = BX.ai.byLevel(sc, 2); return {f: m.f, t: m.t};
      }
      // order moves by immediate gain, keep the best K for a 2-ply (me, opponent) search
      ms.sort((a, c) => gain(seat, c) - gain(seat, a));
      const K = level >= 3 ? (BX.test ? 10 : 22) : 12, KO = level >= 3 ? (BX.test ? 8 : 18) : 0;
      const cand = ms.filter(m => gain(seat, m) >= -.5 || late).slice(0, K);
      if (!cand.length) cand.push(ms[0]);
      const o = 1 - seat; let best = null, bv = -Infinity;
      const t0 = performance.now();
      for (const m of cand) {
        bd[m.f] = 0; bd[m.t] = seat + 1;
        let v;
        if (won(bd, seat, st.moves + 1)) v = 1e4;
        else if (level >= 3 && performance.now() - t0 < (BX.test ? 40 : 600)) {
          // opponent's best reply (by their gain + our follow-up potential)
          const om = allMoves(bd, o).sort((a, c) => gain(o, c) - gain(o, a)).slice(0, KO);
          v = Infinity;
          for (const r of om) {
            bd[r.f] = 0; bd[r.t] = o + 1;
            // our best follow-up gain (3rd ply, greedy) rewards building ladders
            let fu = 0; for (const q of allMoves(bd, seat)) { const gq = gain(seat, q); if (gq > fu) fu = gq; }
            const val = evalFor(bd, seat) + fu * .5;
            bd[r.t] = 0; bd[r.f] = o + 1;
            if (val < v) v = val;
          }
          if (v === Infinity) v = evalFor(bd, seat);
        } else { let fu = 0; for (const q of allMoves(bd, seat)) { const gq = gain(seat, q); if (gq > fu) fu = gq; } v = evalFor(bd, seat) + fu * .4 + Math.random() * .5; }
        v += (m.path.length > 2 ? .15 * (m.path.length - 2) : 0);
        bd[m.t] = 0; bd[m.f] = seat + 1;
        if (v > bv) { bv = v; best = m; }
      }
      return {f: best.f, t: best.t};
    }

    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: (a, by) => !!a && by === st.turn && Number.isInteger(a.f) && Number.isInteger(a.t) && st.b[a.f] === by + 1 && legalFrom(st.b, by, a.f).has(a.t),
      apply(a, by) {
        const s = st.turn; if (st.b[a.f] !== s + 1) return;
        const mv = legalFrom(st.b, s, a.f); if (!mv.has(a.t)) return;
        const path = mv.get(a.t);
        st.b[a.f] = 0; st.b[a.t] = s + 1; st.last = {path}; st.moves++; sel = -1; preview = -1;
        if (!ctx.fast) {
          const an = {path, k: 0, s, hop: -1}; anim = an;
          const n = path.length - 1, step = !NB[path[0]].includes(path[1]) ? 260 : 200;
          ctx.anim(n === 1 ? step : n * 240, k => {
            an.k = k; const h = Math.min(n - 1, Math.floor(k * n));
            if (h !== an.hop) { an.hop = h; if (n > 1 || !NB[path[0]].includes(path[1])) ctx.sfx('hit'); }
          }, () => { if (anim === an) anim = null; ctx.sfx('place'); ctx.poke(); }, k => k);
        } else ctx.sfx('move');
        if (won(st.b, s, st.moves)) { st.over = true; st.win = s; status(); ctx.end({winner: s, text: ctx.name(s) + ' 共走 ' + Math.ceil(st.moves / 2) + ' 步，全部入营'}); return; }
        if (st.moves >= 600) { st.over = true; status(); ctx.end({winner: -1, text: '步数过多，和棋'}); return; }
        st.turn = 1 - s;
        if (!allMoves(st.b, st.turn).length) st.turn = s;   // no legal move (practically impossible): skip
        status();
      },
      aiMove,
      onTurn: status,
      onView() { sel = -1; },
      frame(dt) {
        const g = cv.g; cv.clear(); think += dt;
        const L = layout(), s = L.s, R = s * .4;
        // board plate (star)
        const k = flip() ? -1 : 1;
        g.save();
        g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; g.shadowOffsetY = 6;
        const rad = s * 8.65; g.fillStyle = '#8a5a30'; D.circle(g, L.cx, L.cy, rad); g.fill(); g.restore();
        g.save(); D.circle(g, L.cx, L.cy, rad); g.clip(); D.wood(g, L.cx - rad, L.cy - rad, rad * 2, rad * 2, {seed: 33, base: '#c58e52', dark: '#8a5a2a'}); g.restore();
        g.strokeStyle = 'rgba(60,35,12,.6)'; g.lineWidth = 3; D.circle(g, L.cx, L.cy, rad - 2); g.stroke();
        const star = () => { g.beginPath(); for (let t = 0; t < 2; t++) { const a0 = t ? Math.PI / 2 : -Math.PI / 2; for (let j = 0; j <= 3; j++) { const a = a0 + j * 2 * Math.PI / 3, x = L.cx + Math.cos(a) * s * 8.1, y = L.cy + Math.sin(a) * s * 8.1; j ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); } };
        star(); g.fillStyle = '#f0deb4'; g.fill(); g.strokeStyle = 'rgba(90,55,20,.55)'; g.lineWidth = 2; g.stroke();
        // coloured home triangles
        for (const [seat, list] of [[0, HOME[0]], [1, HOME[1]]]) {
          const c = ctx.color(seat);
          for (const i of list) { const [x, y] = P(i, L); g.fillStyle = D.alpha(c, .16); D.circle(g, x, y, s * .58); g.fill(); }
        }
        // lines between neighbours
        g.strokeStyle = 'rgba(110,75,35,.28)'; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i < NC; i++) for (let d = 0; d < 6; d += 2) { const j = NB[i][d]; if (j > i) { const [x1, y1] = P(i, L), [x2, y2] = P(j, L); g.moveTo(x1, y1); g.lineTo(x2, y2); } }
        for (let i = 0; i < NC; i++) for (const d of [3, 4]) { const j = NB[i][d]; if (j > i) { const [x1, y1] = P(i, L), [x2, y2] = P(j, L); g.moveTo(x1, y1); g.lineTo(x2, y2); } }
        g.stroke();
        for (let i = 0; i < NC; i++) {
          const [x, y] = P(i, L);
          const gr = g.createRadialGradient(x + R * .2, y + R * .25, R * .1, x, y, R * .62); gr.addColorStop(0, '#b9925c'); gr.addColorStop(1, '#6e4a26');
          g.fillStyle = gr; D.circle(g, x, y, R * .6); g.fill();
        }
        // last move path
        const lastPath = st.last && !anim ? st.last.path : null;
        if (lastPath) drawPath(g, L, lastPath, 'rgba(200,160,82,.85)');
        // legal targets and preview path
        let tg = null;
        if (sel >= 0 && myTurn()) {
          tg = legalFrom(st.b, st.turn, sel);
          for (const [t, path] of tg) {
            const [x, y] = P(t, L); const jump = path.length > 2 || !NB[path[0]].includes(path[1]);
            D.hint(g, x, y, R * .55, jump ? 'rgba(200,160,82,.85)' : 'rgba(63,140,110,.8)');
          }
          if (preview >= 0 && tg.has(preview)) drawPath(g, L, tg.get(preview), C.red, true);
        }
        // marbles
        const moving = anim ? anim.path[anim.path.length - 1] : -1;
        for (let i = 0; i < NC; i++) {
          const v = st.b[i]; if (!v || i === moving) continue;
          const [x, y] = P(i, L); marble(g, x, y, R, v - 1, i === sel);
        }
        if (anim) {
          const p = anim.path, n = p.length - 1, kk = anim.k * n, h = Math.min(n - 1, Math.floor(kk)), f = kk - h;
          const [x1, y1] = P(p[h], L), [x2, y2] = P(p[h + 1], L);
          const jump = !NB[p[h]].includes(p[h + 1]), lift = jump ? Math.sin(f * Math.PI) * s * .55 : 0;
          drawPath(g, L, p, 'rgba(200,160,82,.6)');
          const x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f;
          g.fillStyle = 'rgba(0,0,0,.25)'; D.circle(g, x + 2, y + 4, R * (1 - lift / s * .3)); g.fill();
          marble(g, x, y - lift, R * (1 + lift / s * .15), anim.s, false, true);
        }
        // win glow
        if (st.over && st.win != null) for (const i of GOAL[st.win]) { const [x, y] = P(i, L); g.strokeStyle = C.gold2; g.lineWidth = 2.5; D.circle(g, x, y, R * 1.12); g.stroke(); }
        panels(g, L);
        if (!ctx.ended && st.moves === 0 && myTurn()) D.text(g, '点自己的弹珠，再点亮起的目标孔', L.cx, L.cy, {size: Math.max(12, s * .55), color: 'rgba(60,35,12,.55)', font: 'serif'});
      },
    };
    function drawPath(g, L, path, color, dashed) {
      if (!path || path.length < 2) return;
      g.save(); g.strokeStyle = color; g.lineWidth = Math.max(2, L.s * .12); g.lineCap = 'round'; g.lineJoin = 'round';
      if (dashed !== false) g.setLineDash([L.s * .25, L.s * .2]);
      g.beginPath(); path.forEach((i, k) => { const [x, y] = P(i, L); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]);
      for (const i of path.slice(1)) { const [x, y] = P(i, L); g.fillStyle = color; D.circle(g, x, y, L.s * .1); g.fill(); }
      g.restore();
    }
    function marble(g, x, y, r, s, selected, noShadow) {
      const c = ctx.color(s);
      if (!noShadow) { g.fillStyle = 'rgba(0,0,0,.3)'; D.circle(g, x + r * .12, y + r * .2, r); g.fill(); }
      const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .08, x, y, r);
      gr.addColorStop(0, D.shade(c, 55)); gr.addColorStop(.45, c); gr.addColorStop(1, D.shade(c, -40));
      g.fillStyle = gr; D.circle(g, x, y, r); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - r * .32, y - r * .38, r * .26, r * .16, -.6, 0, Math.PI * 2); g.fill();
      if (selected) { g.strokeStyle = '#ffd76a'; g.lineWidth = Math.max(2, r * .22); D.circle(g, x, y, r * 1.18); g.stroke(); }
    }
    function panels(g, L) {
      const v = flip() ? 1 : 0;
      for (const [r, s] of [[L.top, 1 - v], [L.bot, v]]) {
        const turn = !st.over && st.turn === s && !ctx.ended;
        g.save(); if (turn) { g.shadowColor = 'rgba(230,197,125,.8)'; g.shadowBlur = 14; }
        D.paper(g, r.x, r.y, r.w, r.h, {r: 10}); g.restore();
        g.strokeStyle = turn ? C.gold2 : 'rgba(120,90,50,.45)'; g.lineWidth = turn ? 2.5 : 1; D.rr(g, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 9); g.stroke();
        const mr = Math.min(r.h * .28, 15), cx = r.x + 10 + mr, cy = r.y + r.h / 2;
        marble(g, cx, cy, mr, s);
        const n = GOAL[s].filter(i => st.b[i] === s + 1).length, big = r.h > 70;
        let sub = '入营 ' + n + ' / 10'; if (turn && ctx.isAI(s)) sub = '思考中' + '.'.repeat(1 + ((think * 3) | 0) % 3);
        D.text(g, ctx.name(s), cx + mr + 8, cy - (big ? 12 : 9), {size: big ? 16 : 13, align: 'left', color: C.ink, weight: 700, maxW: r.w - 2 * mr - 24, font: 'serif'});
        D.text(g, sub, cx + mr + 8, cy + (big ? 12 : 9), {size: big ? 13 : 11, align: 'left', color: turn ? C.red : C.ink2, weight: 600, maxW: r.w - 2 * mr - 24});
        { const bw = Math.min(r.w * .35, 90), bx = r.x + r.w - bw - 10, by = cy - 3; g.fillStyle = 'rgba(0,0,0,.12)'; D.rr(g, bx, by, bw, 6, 3); g.fill(); g.fillStyle = ctx.color(s); D.rr(g, bx, by, bw * n / 10, 6, 3); g.fill(); }
      }
    }
    status();
    return inst;
  },
});
