/* 四子棋 — 7×6 gravity connect-four. AI: negamax + alpha-beta + transposition table + threat-aware evaluation. */
const COLS = 7, ROWS = 6, NC = COLS * ROWS, D = BX.draw, C = BX.C;
const ix = (c, r) => c * ROWS + r;                 // r = 0 is the bottom row
const ORDER = [3, 2, 4, 1, 5, 0, 6];
const PCOL = ['#c23a2b', '#e0a92e'];
/* all 69 winning windows */
const WINS = [];
for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
  const ec = c + dc * 3, er = r + dr * 3; if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
  WINS.push([0, 1, 2, 3].map(k => ix(c + dc * k, r + dr * k)));
}
function winLine(b, i) {
  const p = b[i]; if (!p) return null; const c0 = Math.floor(i / ROWS), r0 = i % ROWS;
  for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const line = [i];
    for (let k = 1; k < 4; k++) { const c = c0 + dc * k, r = r0 + dr * k; if (c < 0 || c >= COLS || r < 0 || r >= ROWS || b[ix(c, r)] !== p) break; line.push(ix(c, r)); }
    for (let k = 1; k < 4; k++) { const c = c0 - dc * k, r = r0 - dr * k; if (c < 0 || c >= COLS || r < 0 || r >= ROWS || b[ix(c, r)] !== p) break; line.unshift(ix(c, r)); }
    if (line.length >= 4) return line;
  }
  return null;
}
function isWin(b, i) {
  const p = b[i], c0 = (i / ROWS) | 0, r0 = i % ROWS;
  for (let d = 0; d < 4; d++) {
    const dc = d === 1 ? 0 : 1, dr = d === 0 ? 0 : d === 3 ? -1 : 1; let n = 1;
    for (let k = 1; k < 4; k++) { const c = c0 + dc * k, r = r0 + dr * k; if (c >= COLS || r < 0 || r >= ROWS || b[c * ROWS + r] !== p) break; n++; }
    for (let k = 1; k < 4; k++) { const c = c0 - dc * k, r = r0 - dr * k; if (c < 0 || r < 0 || r >= ROWS || b[c * ROWS + r] !== p) break; n++; }
    if (n >= 4) return true;
  }
  return false;
}
/* static evaluation for player p (1|2) */
function evaluate(b, p) {
  let s = 0; const op = 3 - p;
  for (const w of WINS) {
    let a = 0, o = 0, emp = -1;
    for (const i of w) { const v = b[i]; if (v === p) a++; else if (v === op) o++; else emp = i; }
    if (a && o) continue;
    if (a) { if (a === 3) { const r = emp % ROWS; s += 40 + (((p === 1) === (r % 2 === 0)) ? 25 : 0); } else s += a === 2 ? 6 : 1; }
    else if (o) { if (o === 3) { const r = emp % ROWS; s -= 40 + (((op === 1) === (r % 2 === 0)) ? 25 : 0); } else s -= o === 2 ? 6 : 1; }
  }
  for (let r = 0; r < ROWS; r++) { const v = b[ix(3, r)]; if (v === p) s += 4; else if (v === op) s -= 4; }
  return s;
}
const ZL = [], ZH = [];
for (let k = 0; k < 2; k++) { ZL.push([]); ZH.push([]); for (let i = 0; i < NC; i++) { ZL[k].push((Math.random() * 4294967296) | 0); ZH[k].push((Math.random() * 2097152) | 0); } }
const WINV = 100000;
/* returns [[col, score], ...] for the side p to move */
function search(b0, p, maxD, timeMs) {
  const b = b0.slice(), h = new Array(COLS).fill(0); let filled = 0, hl = 0, hh = 0;
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (b[ix(c, r)]) { h[c] = r + 1; filled++; hl ^= ZL[b[ix(c, r)] - 1][ix(c, r)]; hh ^= ZH[b[ix(c, r)] - 1][ix(c, r)]; }
  const tt = new Map(), t0 = performance.now(); let nodes = 0, abort = false;
  function neg(depth, alpha, beta, pl, ply) {
    if ((++nodes & 2047) === 0 && performance.now() - t0 > timeMs) { abort = true; return 0; }
    const op = 3 - pl;
    for (let c = 0; c < COLS; c++) if (h[c] < ROWS) { const i = c * ROWS + h[c]; b[i] = pl; const w = isWin(b, i); b[i] = 0; if (w) return WINV - ply; }
    if (filled >= NC - 1) return 0;
    if (depth <= 0) return evaluate(b, pl);
    let forced = -1, nt = 0;
    for (let c = 0; c < COLS; c++) if (h[c] < ROWS) { const i = c * ROWS + h[c]; b[i] = op; if (isWin(b, i)) { nt++; forced = c; } b[i] = 0; }
    if (nt > 1) return -(WINV - ply - 1);
    const key = (hh & 0x1fffff) * 4294967296 + (hl >>> 0);   // side to move is implied by the piece count
    const e = tt.get(key); let ttm = -1;
    if (e) { if (e.d >= depth) { if (e.f === 0) return e.v; if (e.f === 1 && e.v >= beta) return e.v; if (e.f === 2 && e.v <= alpha) return e.v; } ttm = e.m; }
    let order;
    if (forced >= 0) order = [forced];
    else {
      order = []; const bad = [];
      for (const c of ORDER) {
        if (h[c] >= ROWS) continue;
        // playing here lets the opponent win right on top?
        let w = false;
        if (h[c] + 1 < ROWS) { const i2 = c * ROWS + h[c] + 1; b[i2] = op; w = isWin(b, i2); b[i2] = 0; }
        (w ? bad : order).push(c);
      }
      const k = order.indexOf(ttm); if (k > 0) { order.splice(k, 1); order.unshift(ttm); }
      order.push(...bad);
    }
    let best = -Infinity, bm = order[0]; const a0 = alpha;
    for (const c of order) {
      const i = c * ROWS + h[c]; b[i] = pl; h[c]++; filled++; hl ^= ZL[pl - 1][i]; hh ^= ZH[pl - 1][i];
      const v = -neg(depth - 1, -beta, -alpha, op, ply + 1);
      b[i] = 0; h[c]--; filled--; hl ^= ZL[pl - 1][i]; hh ^= ZH[pl - 1][i];
      if (abort) return 0;
      if (v > best) { best = v; bm = c; } if (v > alpha) alpha = v; if (alpha >= beta) break;
    }
    tt.set(key, {d: depth, v: best, f: best <= a0 ? 2 : best >= beta ? 1 : 0, m: bm});
    return best;
  }
  let roots = ORDER.filter(c => h[c] < ROWS), result = roots.map(c => [c, 0]);
  for (let d = 1; d <= maxD; d++) {
    const sc = []; let alpha = -Infinity;
    for (const c of roots) {
      const i = c * ROWS + h[c]; b[i] = p; h[c]++; filled++; hl ^= ZL[p - 1][i]; hh ^= ZH[p - 1][i];
      let v;
      if (isWin(b, i)) v = WINV; else v = -neg(d - 1, -Infinity, -alpha + 1, 3 - p, 1);
      b[i] = 0; h[c]--; filled--; hl ^= ZL[p - 1][i]; hh ^= ZH[p - 1][i];
      if (abort) break;
      sc.push([c, v]); if (v > alpha) alpha = v;
    }
    if (abort) break;
    result = sc; roots = sc.slice().sort((a, b2) => b2[1] - a[1]).map(x => x[0]);
    if (Math.abs(sc.reduce((m, x) => Math.max(m, x[1]), -Infinity)) > WINV - 100) break;
    if (filled + d >= NC) break;
    if (performance.now() - t0 > timeMs * .45) break;
  }
  return result;
}

BX.register({
  id: 'connect4', title: '四子棋', cat: 'party', order: 2, sub: '竖盘落子，先连四子',
  desc: '七列六行的竖立棋盘，棋子投下后会落到最底部。横、竖、斜先连成四子者获胜，高级电脑几乎不犯错。',
  kind: 'turn', seats: 2, seatNames: ['朱方', '金方'], seatColors: PCOL, firstLabel: '先手', anyTimeActs: true,
  rules: `<p>棋盘竖立，共 <b>7 列 6 行</b>。双方轮流选择一列投下一枚棋子，棋子会落到该列最低的空位。</p>
<p>任一方先在<b>横、竖或斜</b>方向连成<b>四子</b>即获胜；棋盘下满仍无人连四则为和棋。朱方先手。</p>
<p>操作：电脑上点击某一列即可落子；触屏上按住屏幕会显示预览，左右拖动选列，<b>松手落子</b>（拖出棋盘可取消）。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 21, base: '#8a5a34', dark: '#4a2a14'});
    const s = h / 6.6, ox = (w - s * 7) / 2, oy = h * .06;
    g.fillStyle = '#4a1d12'; D.rr(g, ox - 4, oy - 4, s * 7 + 8, s * 6 + 8, 10); g.fill();
    const pat = [[0, 0, 1], [1, 0, 2], [2, 0, 1], [3, 0, 1], [2, 1, 2], [3, 1, 1], [3, 2, 2], [4, 0, 2], [4, 1, 1], [5, 0, 2], [3, 3, 1], [1, 1, 2]];
    for (let c = 0; c < 7; c++) for (let r = 0; r < 6; r++) { g.fillStyle = '#26100a'; D.circle(g, ox + (c + .5) * s, oy + (5 - r + .5) * s, s * .38); g.fill(); }
    for (const [c, r, p] of pat) D.disc(g, ox + (c + .5) * s, oy + (5 - r + .5) * s, s * .38, PCOL[p - 1], {ring: 'rgba(255,240,200,.5)', shadow: false});
    g.strokeStyle = '#ffe9a8'; g.lineWidth = 3; g.beginPath(); g.moveTo(ox + .5 * s, oy + 5.5 * s); g.lineTo(ox + 3.5 * s, oy + 2.5 * s); g.stroke();
  },
  create(ctx) {
    const st = {b: new Array(NC).fill(0), turn: 0, last: -1, win: null, moves: 0, over: false};
    const cv = ctx.canvas();
    let hoverCol = -1, touchCol = -1, drop = null, glow = 0;
    const height = c => { let r = 0; while (r < ROWS && st.b[ix(c, r)]) r++; return r; };
    const geo = () => {
      const f = BX.fit(cv.w, cv.h, COLS + .9, ROWS + 1.75, 8), s = f.s;
      return {s, bx: f.x + .45 * s, by: f.y + 1.25 * s, top: f.y + .55 * s};
    };
    const colAt = p => { const {s, bx, by} = geo(); const c = Math.floor((p.x - bx) / s); if (c < 0 || c >= COLS || p.y < by - 1.6 * s || p.y > by + ROWS * s + .3 * s) return -1; return c; };
    const myTurn = () => ctx.canAct(st.turn) && !st.over;
    const tryDrop = c => { if (c < 0 || !myTurn() || height(c) >= ROWS) { if (c >= 0 && myTurn()) ctx.sfx('error'); return; } ctx.act({c}, st.turn); };
    ctx.on(cv.cv, 'pointermove', e => {
      const c = colAt(cv.pos(e));
      if (e.pointerType === 'mouse') hoverCol = c; else if (touchCol !== -2) { if (c !== touchCol && c >= 0) ctx.sfx('tick'); touchCol = c; }
    });
    ctx.on(cv.cv, 'pointerleave', () => { hoverCol = -1; });
    ctx.on(cv.cv, 'pointerdown', e => {
      const c = colAt(cv.pos(e));
      if (e.pointerType === 'mouse') { tryDrop(c); return; }
      if (!myTurn()) return; touchCol = c; try { cv.cv.setPointerCapture(e.pointerId); } catch (er) {}
    });
    const up = e => { if (e.pointerType === 'mouse') return; const c = touchCol; touchCol = -1; if (e.type === 'pointerup') tryDrop(c >= 0 ? colAt(cv.pos(e)) : -1); };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    ctx.on(cv.cv, 'pointercancel', () => touchCol = -1);
    ctx.info(0, '朱'); ctx.info(1, '金');
    const status = () => {
      if (st.over) return ctx.status(st.win ? '<b>' + ctx.name(st.win.seat) + '</b> 连成四子' : '棋盘已满，和棋');
      const nm = '<span style="color:' + PCOL[st.turn] + '">●</span> ';
      ctx.status(nm + (myTurn() ? (ctx.hotseat ? ctx.name(st.turn) + ' 落子' : '轮到你落子') : '等待 ' + ctx.name(st.turn) + ' 落子…'));
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: (a, by) => by === st.turn && !st.over && Number.isInteger(a.c) && a.c >= 0 && a.c < COLS && height(a.c) < ROWS,
      apply(a) {
        const r = height(a.c), i = ix(a.c, r);
        st.b[i] = st.turn + 1; st.last = i; st.moves++; hoverCol = -1;
        const d = {i, k: 0, from: ROWS - r}; drop = d;
        ctx.anim(180 + 70 * (ROWS - r), k => d.k = k, () => { if (drop === d) drop = null; ctx.sfx('stone'); }, BX.ease.bounce);
        ctx.sfx('whoosh');
        const line = winLine(st.b, i);
        if (line) { st.win = {seat: st.turn, line}; st.over = true; status(); ctx.end({winner: st.turn, delay: 1500}); return; }
        if (st.moves === NC) { st.over = true; status(); ctx.end({winner: -1, delay: 1200}); return; }
        st.turn = 1 - st.turn; status();
      },
      aiMove(seat, level) {
        const p = seat + 1, fast = BX.test;
        if (st.moves === 0 && level >= 2) return {c: 3};
        if (level === 1) {
          // sees wins (usually) and blocks (sometimes); otherwise loose centre preference
          const legal = ORDER.filter(c => height(c) < ROWS), b = st.b.slice();
          for (const c of legal) { const i = ix(c, height(c)); b[i] = p; const w = isWin(b, i); b[i] = 0; if (w && Math.random() < .85) return {c}; }
          for (const c of legal) { const i = ix(c, height(c)); b[i] = 3 - p; const w = isWin(b, i); b[i] = 0; if (w && Math.random() < .6) return {c}; }
          const sc = search(st.b, p, 2, fast ? 20 : 100).map(([c, v]) => [c, v + (Math.random() - .5) * 80]);
          return {c: BX.ai.byLevel(sc, 1)};
        }
        const sc = level === 2 ? search(st.b, p, 6, fast ? 30 : 250) : search(st.b, p, 42, fast ? 45 : 720);
        if (level === 2) { const top = sc.slice().sort((a, b) => b[1] - a[1]); if (top.length > 1 && Math.abs(top[0][1]) < 1000 && top[0][1] - top[1][1] < 12 && Math.random() < .3) return {c: top[1][0]}; return {c: top[0][0]}; }
        return {c: BX.ai.byLevel(sc, 3)};
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear(); glow += dt;
        const {s, bx, by, top} = geo(), R = s * .4;
        const cx = c => bx + (c + .5) * s, cy = r => by + (ROWS - 1 - r + .5) * s;
        // table shadow + back panel
        g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, bx - s * .3 + 6, by - s * .25 + 10, COLS * s + s * .6, ROWS * s + s * .6, s * .3); g.fill();
        g.fillStyle = '#1e0d07'; D.rr(g, bx - s * .3, by - s * .25, COLS * s + s * .6, ROWS * s + s * .55, s * .3); g.fill();
        // active column highlight
        const pc = touchCol >= 0 ? touchCol : hoverCol;
        if (pc >= 0 && myTurn() && height(pc) < ROWS) { g.fillStyle = 'rgba(255,230,160,.10)'; g.fillRect(bx + pc * s, by, s, ROWS * s); }
        // pieces (behind the front panel)
        for (let i = 0; i < NC; i++) {
          const v = st.b[i]; if (!v) continue;
          const c = (i / ROWS) | 0, r = i % ROWS; let y = cy(r);
          if (drop && drop.i === i) y = BX.lerp(top - s * .1, cy(r), drop.k);
          D.disc(g, cx(c), y, R, PCOL[v - 1], {ring: 'rgba(255,240,200,.45)', shadow: false});
          D.text(g, v === 1 ? '朱' : '金', cx(c), y + 1, {size: R * .8, color: 'rgba(255,245,220,.55)', font: 'serif', weight: 900});
        }
        // front panel with holes (evenodd)
        g.save();
        g.beginPath(); D.rr(g, bx - s * .3, by - s * .25, COLS * s + s * .6, ROWS * s + s * .55, s * .3);
        for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { g.moveTo(cx(c) + R * 1.04, cy(r)); g.arc(cx(c), cy(r), R * 1.04, 0, Math.PI * 2, true); }
        const gr = g.createLinearGradient(bx, by, bx + COLS * s, by + ROWS * s); gr.addColorStop(0, '#8e3b24'); gr.addColorStop(.5, '#6e2a18'); gr.addColorStop(1, '#4c1a0e');
        g.fillStyle = gr; g.fill('evenodd');
        g.restore();
        g.strokeStyle = 'rgba(230,197,125,.55)'; g.lineWidth = Math.max(1, s * .035);
        for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { D.circle(g, cx(c), cy(r), R * 1.06); g.stroke(); }
        g.lineWidth = Math.max(2, s * .06); g.strokeStyle = C.gold; D.rr(g, bx - s * .3, by - s * .25, COLS * s + s * .6, ROWS * s + s * .55, s * .3); g.stroke();
        // feet
        g.fillStyle = '#3a1a0c'; for (const fx of [bx - s * .1, bx + COLS * s - s * .5]) { D.rr(g, fx, by + ROWS * s + s * .25, s * .6, s * .22, s * .06); g.fill(); }
        // last move marker
        if (st.last >= 0 && !(drop && drop.i === st.last) && !st.win) { g.strokeStyle = '#fff3c4'; g.lineWidth = Math.max(2, s * .05); D.circle(g, cx((st.last / ROWS) | 0), cy(st.last % ROWS), R * .55); g.stroke(); }
        // win line
        if (st.win && !drop) {
          const L = st.win.line, a = .6 + .4 * Math.sin(glow * 5);
          for (const i of L) { g.strokeStyle = `rgba(255,236,150,${a})`; g.lineWidth = s * .09; D.circle(g, cx((i / ROWS) | 0), cy(i % ROWS), R * .92); g.stroke(); }
          g.strokeStyle = `rgba(255,250,220,${.7 * a})`; g.lineWidth = s * .08; g.lineCap = 'round'; g.beginPath();
          g.moveTo(cx((L[0] / ROWS) | 0), cy(L[0] % ROWS)); g.lineTo(cx((L[L.length - 1] / ROWS) | 0), cy(L[L.length - 1] % ROWS)); g.stroke();
        }
        // preview piece in the top lane
        if (pc >= 0 && myTurn() && height(pc) < ROWS) {
          g.globalAlpha = .9; D.disc(g, cx(pc), top + s * .05, R, PCOL[st.turn], {ring: 'rgba(255,240,200,.45)'}); g.globalAlpha = 1;
          g.fillStyle = 'rgba(255,240,200,.6)'; g.beginPath(); g.moveTo(cx(pc) - s * .12, by - s * .42); g.lineTo(cx(pc) + s * .12, by - s * .42); g.lineTo(cx(pc), by - s * .3); g.fill();
        } else if (!st.over && !drop) {
          // waiting indicator above the board: small bobbing piece of the side to move
          const bob = Math.sin(glow * 3) * s * .05;
          D.disc(g, bx + COLS * s / 2, top + bob, R * .55, PCOL[st.turn], {ring: 'rgba(255,240,200,.45)'});
        }
      },
    };
    status();
    return inst;
  },
});
