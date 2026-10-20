/* 超级井字棋 — Ultimate Tic-Tac-Toe with MCTS AI. */
const D = BX.draw, C = BX.C;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const COL = ['#b23a2b', '#24476b'];

/* ---------- pure rules on a compact state (also used by the MCTS) ----------
   b: Int8Array(81) cell = board*9 + pos (0 empty, 1 seat0, 2 seat1); big: Int8Array(9) (0 open, 1/2 won, 3 full/draw) */
function lineOf(arr, base, v) { for (const L of LINES) if (arr[base + L[0]] === v && arr[base + L[1]] === v && arr[base + L[2]] === v) return L; return null; }
function smallStatus(b, bi, v) {
  if (lineOf(b, bi * 9, v)) return v;
  for (let k = 0; k < 9; k++) if (!b[bi * 9 + k]) return 0;
  return 3;
}
function bigWinner(big) { for (const L of LINES) { const v = big[L[0]]; if ((v === 1 || v === 2) && big[L[1]] === v && big[L[2]] === v) return v; } return 0; }
function legal(b, big, act, out) {
  out.length = 0;
  if (act >= 0 && big[act] === 0) { for (let k = 0; k < 9; k++) if (!b[act * 9 + k]) out.push(act * 9 + k); return out; }
  for (let bi = 0; bi < 9; bi++) if (big[bi] === 0) for (let k = 0; k < 9; k++) if (!b[bi * 9 + k]) out.push(bi * 9 + k);
  return out;
}
/* plays move m for value v. returns 0 continue, v win, 3 draw */
function play(S, m) {
  const v = S.turn + 1, bi = (m / 9) | 0, k = m % 9;
  S.b[m] = v;
  const ss = smallStatus(S.b, bi, v); if (ss) S.big[bi] = ss;
  S.act = S.big[k] === 0 ? k : -1; S.turn ^= 1;
  if (ss === v && bigWinner(S.big) === v) return v;
  for (let i = 0; i < 9; i++) if (S.big[i] === 0) return 0;
  return 3;
}

/* ---------- MCTS (UCT with light heuristic playouts) ---------- */
function mcts(st, seat, ms, iterCap) {
  const root = {S: null, kids: null, moves: null, n: 0, w: 0, m: -1, term: 0};
  const base = {b: Int8Array.from(st.b), big: Int8Array.from(st.big), act: st.act, turn: st.turn};
  const S = {b: new Int8Array(81), big: new Int8Array(9), act: 0, turn: 0};
  const buf = [], t0 = performance.now();
  const reset = () => { S.b.set(base.b); S.big.set(base.big); S.act = base.act; S.turn = base.turn; };
  let it = 0;
  const C2 = 1.1;
  while (it < iterCap && (it < 50 || performance.now() - t0 < ms)) {
    it++; reset();
    let node = root; const path = [root]; let res = 0;
    // selection
    for (;;) {
      if (node.term) { res = node.term; break; }
      if (!node.moves) node.moves = legal(S.b, S.big, S.act, []).slice(), node.kids = [];
      if (node.kids.length < node.moves.length) {
        const m = node.moves[node.kids.length];
        const mover = S.turn;
        const r = play(S, m);
        const child = {kids: null, moves: null, n: 0, w: 0, m, mover, term: r};
        node.kids.push(child); node = child; path.push(node); res = r; break;
      }
      let best = null, bv = -1e9; const ln = Math.log(node.n);
      for (const c of node.kids) { const v = c.w / c.n + C2 * Math.sqrt(ln / c.n); if (v > bv) { bv = v; best = c; } }
      play(S, best.m); node = best; path.push(node);
      if (node.term) { res = node.term; break; }
    }
    // rollout
    let guard = 0;
    while (!res && guard++ < 81) {
      const mv = legal(S.b, S.big, S.act, buf);
      // prefer a move that wins a small board
      let pick = -1; const v = S.turn + 1;
      if (Math.random() < .5) for (let q = 0; q < mv.length && pick < 0; q++) { const m = mv[q], bi = (m / 9) | 0, k = m % 9; S.b[m] = v; if (lineOf(S.b, bi * 9, v) && LINES.some(L => L.includes(k))) pick = m; S.b[m] = 0; }
      if (pick < 0) pick = mv[(Math.random() * mv.length) | 0];
      res = play(S, pick);
    }
    // backprop: res 1/2 winner value, 3 draw
    for (const nd of path) {
      nd.n++;
      if (nd.mover == null) continue;
      if (res === 3 || !res) nd.w += .5; else if (res === nd.mover + 1) nd.w += 1;
    }
  }
  let best = null;
  for (const c of root.kids || []) { if (c.term && c.term === seat + 1) return c.m; if (!best || c.n > best.n) best = c; }
  return best ? best.m : legal(st.b, st.big, st.act, [])[0];
}

BX.register({
  id: 'uttt', title: '超级井字棋', cat: 'brain', order: 2, sub: '九宫套九宫，一步定去向',
  desc: '九个小井字棋组成一个大井字棋。你落子的位置决定对手下一步必须去哪个小棋盘，赢下三个连成一线的小棋盘即获胜。',
  kind: 'turn', seats: 2, seatNames: ['朱方', '墨方'], seatColors: COL, firstLabel: '先手',
  rules: `<p>大棋盘由 <b>3×3 个小井字棋盘</b>组成，朱方（×）先行，双方轮流在小格中落子。</p>
<p><b>落子定去向：</b>你落在小棋盘中的哪个位置，对手下一步就必须在大棋盘<b>对应位置的小棋盘</b>里下。例如你下在某小棋盘的右上角，对手就要去右上角的小棋盘。</p>
<p>在小棋盘中先连成三子（横、竖、斜）即<b>赢下该小棋盘</b>，盖上你的大印；小棋盘下满无人连线则为平局盘，不属于任何人。</p>
<p>若被送去的小棋盘已经分出胜负或已下满，则可以在<b>任意一个</b>尚未结束的小棋盘中落子。</p>
<p>在大棋盘上先赢下<b>三个连成一线</b>的小棋盘者获胜；所有小棋盘都结束仍无人连线，则为和棋。</p>
<p>金色高亮的小棋盘就是当前可以落子的区域。触屏上第一次点击预览，再点同一格确认。</p>`,
  icon(g, w, h) {
    D.paper(g, 0, 0, w, h, {color: '#efe2c4'});
    const s = h * .82, ox = (w - s) / 2, oy = (h - s) / 2, c = s / 3;
    g.fillStyle = 'rgba(230,197,125,.45)'; g.fillRect(ox + c, oy, c, c);
    g.strokeStyle = 'rgba(43,33,24,.35)'; g.lineWidth = 1;
    for (let bi = 0; bi < 9; bi++) { const bx = ox + (bi % 3) * c, by = oy + ((bi / 3) | 0) * c; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(bx + c * i / 3, by + 4); g.lineTo(bx + c * i / 3, by + c - 4); g.moveTo(bx + 4, by + c * i / 3); g.lineTo(bx + c - 4, by + c * i / 3); g.stroke(); } }
    g.strokeStyle = C.ink; g.lineWidth = 3; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(ox + c * i, oy); g.lineTo(ox + c * i, oy + s); g.moveTo(ox, oy + c * i); g.lineTo(ox + s, oy + c * i); g.stroke(); }
    const X = (x, y, r) => { g.strokeStyle = COL[0]; g.lineWidth = r * .35; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke(); };
    const O = (x, y, r) => { g.strokeStyle = COL[1]; g.lineWidth = r * .32; D.circle(g, x, y, r); g.stroke(); };
    X(ox + c * .5, oy + c * .5, c * .3); O(ox + c * 2.5, oy + c * 2.5, c * .3);
    const sm = c / 3;
    X(ox + c + sm * .5, oy + sm * .5, sm * .28); O(ox + c + sm * 1.5, oy + sm * 1.5, sm * .28); X(ox + sm * 2.5 + c * 2, oy + c + sm * .5, sm * .28); O(ox + sm * .5, oy + c * 2 + sm * 1.5, sm * .28);
    O(ox + c + sm * 2.5, oy + c * 1 + sm * 2.5, sm * .28); X(ox + c * 2 + sm * 1.5, oy + sm * 0.5, sm * .28);
  },
  create(ctx) {
    const st = {b: new Array(81).fill(0), big: new Array(9).fill(0), act: -1, turn: 0, last: -1, moves: 0, over: false, win: null};
    const cv = ctx.canvas();
    let hover = -1, preview = -1;
    const fx = {drop: -1, t: 1, seal: -1, st: 1};
    const geo = () => { const f = BX.fit(cv.w, cv.h, 10.1, 10.1, 4); return {s: f.s, x0: f.x, y0: f.y, ox: f.x + f.s * .4, oy: f.y + f.s * .4}; };
    const cellXY = (m, G) => { const bi = (m / 9) | 0, k = m % 9; const col = (bi % 3) * 3 + k % 3, row = ((bi / 3) | 0) * 3 + ((k / 3) | 0); const gx = col + Math.floor(col / 3) * .15, gy = row + Math.floor(row / 3) * .15; return [G.ox + gx * G.s, G.oy + gy * G.s, G.s]; };
    const boardRect = (bi, G) => { const [x, y, c] = cellXY(bi * 9, G); return [x, y, c * 3]; };
    const cellAt = p => { const G = geo(); for (let m = 0; m < 81; m++) { const [x, y, c] = cellXY(m, G); if (p.x >= x && p.x < x + c && p.y >= y && p.y < y + c) return m; } return -1; };
    const legalNow = () => legal(st.b, st.big, st.act, []);
    const isLegal = m => legalNow().includes(m);
    const myTurn = () => ctx.canAct(st.turn);
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = cellAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!myTurn()) return;
      const m = cellAt(cv.pos(e)); if (m < 0 || !isLegal(m)) { if (m >= 0) ctx.sfx('error'); return; }
      if (e.pointerType !== 'mouse' && preview !== m) { preview = m; ctx.sfx('tick'); return; }
      preview = -1; ctx.act({m}, st.turn);
    });
    const tally = s => st.big.filter(v => v === s + 1).length;
    const status = () => {
      ctx.info(0, '× ' + tally(0)); ctx.info(1, '○ ' + tally(1));
      if (st.over) return ctx.status(st.win ? ctx.name(st.win.seat) + ' 三盘连线' : '和棋');
      const where = st.act >= 0 ? '' : '（可任选棋盘）';
      ctx.status((ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + '落子' : '轮到你落子') : '等待 ' + ctx.name(st.turn) + '…') + where);
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => Number.isInteger(a.m) && isLegal(a.m),
      apply(a) {
        const S = {b: st.b, big: st.big, act: st.act, turn: st.turn};
        const bi = (a.m / 9) | 0, before = st.big[bi];
        const r = play(S, a.m);
        st.act = S.act; st.last = a.m; st.moves++; preview = -1;
        fx.drop = a.m; fx.t = 0; ctx.anim(200, k => fx.t = k);
        if (before === 0 && st.big[bi] !== 0) { fx.seal = bi; fx.st = 0; ctx.anim(420, k => fx.st = k, null, BX.ease.back); ctx.after(80, () => ctx.sfx(st.big[bi] === 3 ? 'tick' : 'chip')); }
        ctx.sfx('pen');
        if (r === 1 || r === 2) {
          const L = lineOf(st.big, 0, r);
          st.win = {seat: r - 1, line: L}; st.over = true; status(); ctx.end({winner: r - 1}); return;
        }
        if (r === 3) { st.over = true; status(); ctx.end({winner: -1, text: '× ' + tally(0) + ' : ' + tally(1) + ' ○'}); return; }
        st.turn = S.turn; status();
      },
      aiMove(seat, level) {
        const lim = BX.test ? 40 : [0, 90, 380, 760][level];
        const mv = legalNow();
        if (level === 1 && Math.random() < .3) return {m: mv[(Math.random() * mv.length) | 0]};
        return {m: mcts(st, seat, lim, level === 1 ? 250 : 1e9)};
      },
      onTurn: status,
      frame() {
        const g = cv.g; cv.clear(); const G = geo();
        const W = G.s * 10.1;
        D.wood(g, G.x0, G.y0, W, W, {r: G.s * .35, seed: 9, base: '#b98250', dark: '#6b4426'});
        D.paper(g, G.x0 + G.s * .2, G.y0 + G.s * .2, W - G.s * .4, W - G.s * .4, {r: G.s * .2, color: '#f3e7cc'});
        const live = st.over ? [] : legalNow();
        const activeB = new Set(live.map(m => (m / 9) | 0));
        for (let bi = 0; bi < 9; bi++) {
          const [x, y, c] = boardRect(bi, G);
          if (activeB.has(bi)) {
            g.fillStyle = 'rgba(230,197,125,.38)'; D.rr(g, x - G.s * .04, y - G.s * .04, c + G.s * .08, c + G.s * .08, G.s * .18); g.fill();
            g.strokeStyle = 'rgba(200,150,50,.9)'; g.lineWidth = Math.max(2, G.s * .06); g.stroke();
          }
          g.strokeStyle = 'rgba(60,40,20,.55)'; g.lineWidth = Math.max(1, G.s * .035); g.lineCap = 'round';
          g.beginPath(); for (let i = 1; i < 3; i++) { g.moveTo(x + c * i / 3, y + c * .06); g.lineTo(x + c * i / 3, y + c * .94); g.moveTo(x + c * .06, y + c * i / 3); g.lineTo(x + c * .94, y + c * i / 3); } g.stroke();
        }
        // big grid (ink brush)
        g.strokeStyle = C.ink; g.lineWidth = Math.max(3, G.s * .1); g.lineCap = 'round';
        for (let i = 1; i < 3; i++) {
          const off = (3 * i + .15 * i - .075) * G.s, gx = G.ox + off, gy = G.oy + off;
          g.beginPath(); g.moveTo(gx, G.oy); g.lineTo(gx, G.oy + G.s * 9.3); g.stroke();
          g.beginPath(); g.moveTo(G.ox, gy); g.lineTo(G.ox + G.s * 9.3, gy); g.stroke();
        }
        // marks
        for (let m = 0; m < 81; m++) {
          const v = st.b[m]; if (!v) continue;
          const [x, y, c] = cellXY(m, G); const k = m === fx.drop ? fx.t : 1;
          const dim = st.big[(m / 9) | 0] !== 0 ? .4 : 1;
          g.globalAlpha = dim; mark(g, x + c / 2, y + c / 2, c * .3, v - 1, k); g.globalAlpha = 1;
        }
        if (st.last >= 0) { const [x, y, c] = cellXY(st.last, G); g.strokeStyle = 'rgba(200,150,50,.95)'; g.lineWidth = 2; D.rr(g, x + 2, y + 2, c - 4, c - 4, 4); g.stroke(); }
        // seals on decided boards
        for (let bi = 0; bi < 9; bi++) {
          const v = st.big[bi]; if (!v) continue;
          const [x, y, c] = boardRect(bi, G); const k = bi === fx.seal ? fx.st : 1;
          if (v === 3) { g.fillStyle = `rgba(120,100,80,${.22 * k})`; D.rr(g, x, y, c, c, G.s * .15); g.fill(); D.text(g, '和', x + c / 2, y + c / 2, {size: c * .4 * k, color: 'rgba(90,70,50,.55)', font: 'serif', weight: 900}); continue; }
          const sz = c * .78 * (1.4 - .4 * k);
          g.save(); g.globalAlpha = k; g.translate(x + c / 2, y + c / 2); g.rotate(-.06);
          g.fillStyle = D.alpha(COL[v - 1], .86); D.rr(g, -sz / 2, -sz / 2, sz, sz, sz * .1); g.fill();
          g.strokeStyle = 'rgba(255,240,220,.85)'; g.lineWidth = sz * .04; D.rr(g, -sz * .42, -sz * .42, sz * .84, sz * .84, sz * .06); g.stroke();
          g.globalAlpha = k * .95; mark(g, 0, 0, sz * .27, v - 1, 1, '#fbecd2');
          g.restore();
        }
        // winning line
        if (st.win) {
          const L = st.win.line, a = boardRect(L[0], G), b = boardRect(L[2], G);
          g.strokeStyle = C.gold2; g.lineWidth = G.s * .22; g.lineCap = 'round'; g.globalAlpha = .9;
          g.beginPath(); g.moveTo(a[0] + a[2] / 2, a[1] + a[2] / 2); g.lineTo(b[0] + b[2] / 2, b[1] + b[2] / 2); g.stroke(); g.globalAlpha = 1;
        }
        // ghost
        const gh = preview >= 0 ? preview : hover;
        if (gh >= 0 && myTurn() && live.includes(gh)) { const [x, y, c] = cellXY(gh, G); g.globalAlpha = preview >= 0 ? .7 : .35; mark(g, x + c / 2, y + c / 2, c * .3, st.turn, 1); g.globalAlpha = 1; }
      },
    };
    function mark(g, x, y, r, s, k, col) {
      g.save(); g.lineCap = 'round'; g.strokeStyle = col || COL[s]; g.lineWidth = r * .38;
      if (s === 0) {
        const a = Math.min(1, k * 2), b = Math.max(0, k * 2 - 1);
        g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x - r + 2 * r * a, y - r + 2 * r * a);
        if (b > 0) { g.moveTo(x + r, y - r); g.lineTo(x + r - 2 * r * b, y - r + 2 * r * b); } g.stroke();
      } else { g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke(); }
      g.restore();
    }
    status();
    return inst;
  },
});
