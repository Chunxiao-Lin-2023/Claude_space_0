/* 五子棋 — reference implementation of a TURN game (read this before writing a new turn game). */
const N = 15, D = BX.draw, C = BX.C;
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const idx = (x, y) => y * N + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

/* ---------- pure rules (shared by apply + AI) ---------- */
function fiveLine(b, x, y) {
  const c = b[idx(x, y)];
  for (const [dx, dy] of DIRS) {
    const line = [[x, y]];
    for (let k = 1; inb(x + dx * k, y + dy * k) && b[idx(x + dx * k, y + dy * k)] === c; k++) line.push([x + dx * k, y + dy * k]);
    for (let k = 1; inb(x - dx * k, y - dy * k) && b[idx(x - dx * k, y - dy * k)] === c; k++) line.unshift([x - dx * k, y - dy * k]);
    if (line.length >= 5) return line;
  }
  return null;
}
/* pattern score of placing color c at (x,y): counts runs + open ends in 4 directions */
function pointScore(b, x, y, c) {
  let total = 0;
  for (const [dx, dy] of DIRS) {
    let cnt = 1, open = 0, gap = 0;
    for (const s of [1, -1]) {
      let k = 1;
      while (inb(x + dx * k * s, y + dy * k * s) && b[idx(x + dx * k * s, y + dy * k * s)] === c) { cnt++; k++; }
      const nx = x + dx * k * s, ny = y + dy * k * s;
      if (inb(nx, ny) && b[idx(nx, ny)] === 0) {
        open++;
        // one-gap extension (e.g. XX_X)
        let k2 = k + 1; while (inb(x + dx * k2 * s, y + dy * k2 * s) && b[idx(x + dx * k2 * s, y + dy * k2 * s)] === c) { gap++; k2++; }
      }
    }
    const eff = cnt + Math.min(gap, 4 - Math.min(cnt, 4));
    if (cnt >= 5) total += 1e7;
    else if (cnt === 4) total += open === 2 ? 1e6 : open === 1 ? 1.2e5 : 0;
    else if (eff >= 4 && open >= 1) total += 1e5;                     // broken four
    else if (cnt === 3) total += open === 2 ? 5e4 : open === 1 ? 1500 : 0;
    else if (eff === 3 && open === 2) total += 2.5e4;                  // broken three
    else if (cnt === 2) total += open === 2 ? 1200 : open === 1 ? 150 : 0;
    else total += open === 2 ? 40 : open === 1 ? 10 : 0;
  }
  return total;
}
function candidates(b) {
  const out = []; let any = false;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (b[idx(x, y)]) { any = true; continue; }
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (inb(xx, yy) && b[idx(xx, yy)]) { near = true; break; } }
    if (near) out.push([x, y]);
  }
  if (!any) out.push([7, 7]);
  return out;
}

BX.register({
  id: 'gomoku', title: '五子棋', cat: 'classic', order: 3, sub: '先连成五子者胜',
  desc: '黑白双方轮流落子，横、竖、斜任意方向先连成五子即胜。电脑三档难度，高级会主动做杀。',
  kind: 'turn', seats: 2, seatNames: ['黑方', '白方'], seatColors: ['#1c1a18', '#ece8df'], firstLabel: '执子',
  rules: `<p>标准 15 路棋盘，<b>黑先白后</b>，轮流在交叉点上落子，落下后不能移动。</p>
<p>任何一方先在横、竖或斜方向上连成<b>五个或更多</b>同色棋子即获胜；棋盘下满仍无人连五则为和棋。</p>
<p>本版为<b>无禁手</b>规则（自由五子棋）。触屏上第一次点击预览落点，再点同一位置确认。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 3});
    const s = h / 6; g.strokeStyle = 'rgba(60,35,10,.6)'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(i * s + s / 2, 0); g.lineTo(i * s + s / 2, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s + s / 2); g.lineTo(w, i * s + s / 2); g.stroke(); }
    const pts = [[2, 1, 1], [3, 2, 1], [4, 3, 1], [5, 4, 1], [2, 3, 0], [3, 3, 0], [4, 1, 0], [5, 2, 0]];
    for (const [x, y, b] of pts) D.stone(g, x * s + s / 2, y * s + s / 2, s * .44, !b);
  },
  create(ctx) {
    /* ALL game state lives in `st` and is changed ONLY inside apply(). It must be JSON-serializable. */
    const st = {b: new Array(N * N).fill(0), turn: 0, last: -1, win: null, moves: 0, over: false};
    const cv = ctx.canvas();
    let hover = -1, preview = -1, drop = {i: -1, t: 1};
    const geo = () => { const f = BX.fit(cv.w, cv.h, N + 1, N + 1, 6); return {cell: f.s, ox: f.x + f.s, oy: f.y + f.s}; };
    const cellAt = p => { const {cell, ox, oy} = geo(); const x = Math.round((p.x - ox) / cell), y = Math.round((p.y - oy) / cell); return inb(x, y) ? idx(x, y) : -1; };
    const myTurn = () => ctx.canAct(st.turn);
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = cellAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!myTurn()) return;
      const i = cellAt(cv.pos(e)); if (i < 0 || st.b[i]) return;
      if (e.pointerType !== 'mouse' && preview !== i) { preview = i; ctx.sfx('tick'); return; }   // touch: tap twice
      preview = -1; ctx.act({i}, st.turn);
    });
    const status = () => {
      ctx.info(0, '黑'); ctx.info(1, '白');
      if (st.over) return ctx.status(st.win ? ctx.name(st.win.seat) + ' 连成五子' : '和棋');
      ctx.status(ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + '落子' : '轮到你落子') : '等待 ' + ctx.name(st.turn) + ' 落子…');
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => Number.isInteger(a.i) && a.i >= 0 && a.i < N * N && !st.b[a.i],
      apply(a, by) {
        st.b[a.i] = st.turn + 1; st.last = a.i; st.moves++; preview = -1;
        drop = {i: a.i, t: 0}; ctx.anim(160, k => drop.t = k);
        ctx.sfx('stone');
        const line = fiveLine(st.b, a.i % N, Math.floor(a.i / N));
        if (line) { st.win = {seat: st.turn, line: line.map(([x, y]) => idx(x, y))}; st.over = true; status(); ctx.end({winner: st.turn}); return; }
        if (st.moves === N * N) { st.over = true; status(); ctx.end({winner: -1}); return; }
        st.turn = 1 - st.turn; status();
      },
      aiMove(seat, level) {
        const me = seat + 1, op = 2 - seat, b = st.b, cand = candidates(b);
        const scored = cand.map(([x, y]) => {
          const att = pointScore(b, x, y, me), def = pointScore(b, x, y, op);
          let s = att * (level === 1 ? 1 : 1.1) + def * (level === 1 ? .6 : .95);
          if (level === 1) s *= .6 + Math.random() * .8;
          return [idx(x, y), s];
        });
        if (level >= 3) {   // look one ply deeper on the best few: avoid giving the opponent a winning double threat
          scored.sort((a, b2) => b2[1] - a[1]);
          const top = scored.slice(0, 8);
          for (const t of top) {
            if (t[1] >= 1e6) continue;
            b[t[0]] = me; let worst = 0;
            for (const [x, y] of candidates(b)) { const v = pointScore(b, x, y, op); if (v > worst) worst = v; }
            b[t[0]] = 0; t[1] -= worst * .5;
          }
          return {i: BX.ai.byLevel(top, 3)};
        }
        return {i: BX.ai.byLevel(scored, level)};
      },
      onTurn: status,
      frame() {
        const g = cv.g; cv.clear();
        const {cell, ox, oy} = geo(), R = cell * .46;
        D.wood(g, ox - cell * .8, oy - cell * .8, cell * (N - 1 + 1.6), cell * (N - 1 + 1.6), {r: cell * .3, seed: 11, base: '#d6a565'});
        g.strokeStyle = 'rgba(50,30,10,.75)'; g.lineWidth = 1;
        g.beginPath(); for (let i = 0; i < N; i++) { g.moveTo(ox + i * cell, oy); g.lineTo(ox + i * cell, oy + (N - 1) * cell); g.moveTo(ox, oy + i * cell); g.lineTo(ox + (N - 1) * cell, oy + i * cell); } g.stroke();
        g.lineWidth = 2; g.strokeRect(ox, oy, (N - 1) * cell, (N - 1) * cell);
        for (const [x, y] of [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]]) { g.fillStyle = 'rgba(50,30,10,.85)'; D.circle(g, ox + x * cell, oy + y * cell, cell * .1); g.fill(); }
        for (let i = 0; i < N * N; i++) {
          if (!st.b[i]) continue;
          const x = ox + (i % N) * cell, y = oy + Math.floor(i / N) * cell;
          const s = i === drop.i ? .6 + .4 * drop.t : 1;
          D.stone(g, x, y, R * s, st.b[i] === 2);
        }
        if (st.last >= 0) { const x = ox + (st.last % N) * cell, y = oy + Math.floor(st.last / N) * cell; g.fillStyle = C.red; D.circle(g, x, y, cell * .1); g.fill(); }
        if (st.win) { g.strokeStyle = C.red; g.lineWidth = cell * .12; g.lineCap = 'round'; const L = st.win.line; const p = i => [ox + (i % N) * cell, oy + Math.floor(i / N) * cell]; g.beginPath(); g.moveTo(...p(L[0])); g.lineTo(...p(L[L.length - 1])); g.stroke(); }
        const ghost = preview >= 0 ? preview : hover;
        if (ghost >= 0 && !st.b[ghost] && myTurn()) { g.globalAlpha = preview >= 0 ? .75 : .45; D.stone(g, ox + (ghost % N) * cell, oy + Math.floor(ghost / N) * cell, R, st.turn === 1); g.globalAlpha = 1; }
      },
    };
    return inst;
  },
});
