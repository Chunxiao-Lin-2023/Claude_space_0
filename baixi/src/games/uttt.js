/* 超级井字棋 — Ultimate Tic-Tac-Toe with MCTS AI. */
const D = BX.draw, C = BX.C;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const COL = ['#b23a2b', '#24476b'];
const POS = ['左上', '上', '右上', '左', '中', '右', '左下', '下', '右下'];
const KEYPOS = {Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8};

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
  howto: ['金框小棋盘就是现在能下的地方；点格子落子（触屏默认先预览、再点同一格确认）。', '预览或鼠标悬停时，<b>虚线框</b>标出这一步会把对手送去的小棋盘。', '手机上棋盘下方 / 右侧有<b>放大镜</b>，显示当前小棋盘的大号格子，可以直接在里面点。', '键盘：数字键 1–9 按九宫位置选格（可任选时先选棋盘），再按一次或回车确认。💡 提示会标出推荐落点。'],
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
    let hover = -1, preview = -1, focus = -1, kbBoard = -1, hint = -1, hintT = 0;
    const fx = {drop: -1, t: 1, seal: -1, st: 1};
    /* layout: main board + (on small screens) a zoom panel showing one small board with big cells */
    let lc = null;
    function lay() {
      const W = cv.w, H = cv.h, key = W + 'x' + H; if (lc && lc.key === key) return lc;
      let area = {x: 0, y: 0, w: W, h: H}, panel = null;
      if (H > W * 1.2) { const B = Math.min(W, H * .6); if (B / 10.1 < 50 && H - B > 170) { const P = Math.min(W, H - B); const y0 = (H - B - P) / 2; area = {x: 0, y: y0, w: W, h: B}; panel = {x: (W - Math.min(W, P)) / 2, y: y0 + B, w: Math.min(W, P), h: P}; } }
      else if (W > H * 1.2) { const B = Math.min(H, W * .6); if (B / 10.1 < 50 && W - B > 170) { const P = Math.min(W - B, H * 1.05); const x0 = (W - B - P) / 2; area = {x: x0, y: 0, w: B, h: H}; panel = {x: x0 + B, y: 0, w: P, h: H}; } }
      const f = BX.fit(area.w, area.h, 10.1, 10.1, 4), x0 = area.x + f.x, y0 = area.y + f.y;
      let Z = null;
      if (panel) { const zs = Math.min(panel.w - 16, panel.h - 44) ; Z = {s: zs, x: panel.x + (panel.w - zs) / 2, y: panel.y + 34 + (panel.h - 44 - zs) / 2, P: panel}; }
      return (lc = {key, G: {s: f.s, x0, y0, ox: x0 + f.s * .4, oy: y0 + f.s * .4}, Z});
    }
    const geo = () => lay().G;
    const zoomBoard = () => {
      if (preview >= 0) return (preview / 9) | 0;
      if (hover >= 0) return (hover / 9) | 0;
      if (st.act >= 0 && st.big[st.act] === 0) return st.act;
      if (kbBoard >= 0) return kbBoard;
      if (focus >= 0 && st.big[focus] === 0) return focus;
      if (st.last >= 0 && (st.over || !myTurn())) return (st.last / 9) | 0;   // otherwise show where the last stone went
      return -1;
    };
    const zoomCellAt = p => { const Z = lay().Z, bi = zoomBoard(); if (!Z || bi < 0) return -2; if (p.x < Z.x || p.y < Z.y || p.x >= Z.x + Z.s || p.y >= Z.y + Z.s) return -2; return bi * 9 + Math.floor((p.y - Z.y) / Z.s * 3) * 3 + Math.floor((p.x - Z.x) / Z.s * 3); };
    /* where would move m send the opponent? -1 = anywhere */
    const destOf = m => { const S = {b: Int8Array.from(st.b), big: Int8Array.from(st.big), act: st.act, turn: st.turn}; play(S, m); return S.act; };
    const cellXY = (m, G) => { const bi = (m / 9) | 0, k = m % 9; const col = (bi % 3) * 3 + k % 3, row = ((bi / 3) | 0) * 3 + ((k / 3) | 0); const gx = col + Math.floor(col / 3) * .15, gy = row + Math.floor(row / 3) * .15; return [G.ox + gx * G.s, G.oy + gy * G.s, G.s]; };
    const boardRect = (bi, G) => { const [x, y, c] = cellXY(bi * 9, G); return [x, y, c * 3]; };
    const boardAt = p => { const G = geo(); for (let bi = 0; bi < 9; bi++) { const [x, y, c] = boardRect(bi, G); if (p.x >= x && p.x < x + c && p.y >= y && p.y < y + c) return bi; } return -1; };
    const cellAt = p => { const z = zoomCellAt(p); if (z !== -2) return z; const G = geo(); for (let m = 0; m < 81; m++) { const [x, y, c] = cellXY(m, G); if (p.x >= x && p.x < x + c && p.y >= y && p.y < y + c) return m; } return -1; };
    const legalNow = () => legal(st.b, st.big, st.act, []);
    const isLegal = m => legalNow().includes(m);
    const myTurn = () => ctx.canAct(st.turn);
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = cellAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e), m = cellAt(p);
      if (!myTurn()) { const bi = boardAt(p); if (bi >= 0) focus = bi; return; }   // peek a board in the zoom panel
      if (m < 0 || !isLegal(m)) {
        const bi = m >= 0 ? (m / 9) | 0 : boardAt(p);
        if (bi >= 0 && st.big[bi] === 0) focus = bi;
        if (m >= 0) { ctx.sfx('error'); ctx.buzz(15); preview = -1; }
        return;
      }
      if (ctx.needConfirm(e) && preview !== m) { preview = m; focus = (m / 9) | 0; ctx.sfx('tick'); status(); return; }
      preview = -1; ctx.act({m}, st.turn);
    });
    function key(e) {
      if (!myTurn()) return;
      if (e.code === 'Escape') { preview = -1; kbBoard = -1; status(); return; }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { if (preview >= 0) { const m = preview; preview = -1; ctx.act({m}, st.turn); } return; }
      const k = KEYPOS[e.code]; if (k == null) return;
      const fixed = st.act >= 0 && st.big[st.act] === 0;
      if (!fixed && kbBoard < 0 && preview < 0) { if (st.big[k] === 0) { kbBoard = k; ctx.sfx('tick'); status(); } else ctx.sfx('error'); return; }
      const bi = fixed ? st.act : kbBoard >= 0 ? kbBoard : (preview / 9) | 0, m = bi * 9 + k;
      if (!isLegal(m)) { ctx.sfx('error'); return; }
      if (preview === m) { preview = -1; kbBoard = -1; ctx.act({m}, st.turn); return; }
      preview = m; ctx.sfx('tick'); status();
    }
    const tally = s => st.big.filter(v => v === s + 1).length;
    const status = () => {
      ctx.info(0, '× ' + tally(0)); ctx.info(1, '○ ' + tally(1));
      if (st.over) return ctx.status(st.win ? ctx.name(st.win.seat) + ' 三盘连线' : '和棋');
      const where = st.act >= 0 && st.big[st.act] === 0 ? ` · 去<b style="color:#e6c57d">${POS[st.act]}</b>棋盘` : ' · <b style="color:#e6c57d">可任选棋盘</b>';
      let tail = '';
      if (preview >= 0 && myTurn()) { const d = destOf(preview); tail = ' → 对手' + (d >= 0 ? '去' + POS[d] : '可任选'); }
      ctx.status((ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + '落子' : '轮到你落子') : '等待 ' + ctx.name(st.turn) + '…') + where + tail);
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => Number.isInteger(a.m) && isLegal(a.m),
      apply(a) {
        const S = {b: st.b, big: st.big, act: st.act, turn: st.turn};
        const bi = (a.m / 9) | 0, before = st.big[bi];
        const r = play(S, a.m);
        st.act = S.act; st.last = a.m; st.moves++; preview = -1; hint = -1; kbBoard = -1; focus = -1;
        fx.drop = a.m; fx.t = 0; ctx.anim(200, k => fx.t = k);
        if (before === 0 && st.big[bi] !== 0) { fx.seal = bi; fx.st = 0; ctx.anim(420, k => fx.st = k, null, BX.ease.back); ctx.after(80, () => ctx.sfx(st.big[bi] === 3 ? 'tick' : 'chip')); }
        ctx.sfx('pen');
        if (r === 1 || r === 2) {
          const L = lineOf(st.big, 0, r);
          st.win = {seat: r - 1, line: L}; st.over = true; status(); if (ctx.isLocal(r - 1)) ctx.buzz(30); ctx.end({winner: r - 1, text: '× ' + tally(0) + ' : ' + tally(1) + ' ○'}); return;
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
      key,
      showHint(a) { hint = a.m; hintT = performance.now(); focus = (a.m / 9) | 0; },
      resize() { lc = null; },
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
        const tk = performance.now() / 1000;
        if (gh >= 0 && myTurn() && live.includes(gh)) {
          const [x, y, c] = cellXY(gh, G); g.globalAlpha = preview >= 0 ? .7 : .35; mark(g, x + c / 2, y + c / 2, c * .3, st.turn, 1); g.globalAlpha = 1;
          // destination preview: dashed frame in the opponent's colour around the board they'd be sent to
          const d = destOf(gh);
          g.save(); g.setLineDash([G.s * .22, G.s * .14]); g.lineDashOffset = -tk * 20; g.strokeStyle = D.alpha(COL[1 - st.turn], .9); g.lineWidth = Math.max(2, G.s * .07);
          if (d >= 0) { const [bx, by, bc] = boardRect(d, G); D.rr(g, bx - G.s * .1, by - G.s * .1, bc + G.s * .2, bc + G.s * .2, G.s * .2); }
          else D.rr(g, G.ox - G.s * .2, G.oy - G.s * .2, G.s * 9.7, G.s * 9.7, G.s * .3);   // opponent may pick any board
          g.stroke(); g.restore();
        }
        if (hint >= 0 && !st.b[hint]) { const [x, y, c] = cellXY(hint, G); g.strokeStyle = 'rgba(63,160,120,' + (.55 + .35 * Math.sin(tk * 6)) + ')'; g.lineWidth = Math.max(3, c * .1); D.rr(g, x + 1, y + 1, c - 2, c - 2, c * .2); g.stroke(); }
        if (kbBoard >= 0 && preview < 0) { const [bx, by, bc] = boardRect(kbBoard, G); g.strokeStyle = C.gold2; g.lineWidth = 3; D.rr(g, bx - 3, by - 3, bc + 6, bc + 6, G.s * .2); g.stroke(); }
        drawZoom(g, live, tk);
      },
    };
    function drawZoom(g, live, tk) {
      const Z = lay().Z; if (!Z) return;
      const P = Z.P, bi = zoomBoard(), mine = myTurn();
      g.fillStyle = 'rgba(0,0,0,.22)'; D.rr(g, P.x + 4, P.y + 4, P.w - 8, P.h - 8, 14); g.fill();
      const title = bi < 0 ? (mine ? '可任选棋盘 · 点上方任一金框棋盘放大' : '放大镜') : POS[bi] + '棋盘' + (st.big[bi] === 1 || st.big[bi] === 2 ? ' · 已被' + ctx.name(st.big[bi] - 1) + '拿下' : st.big[bi] === 3 ? ' · 平局盘' : live.some(m => ((m / 9) | 0) === bi) ? (mine ? ' · 在这里落子' : ' · 对手在此落子') : '');
      D.text(g, title, P.x + P.w / 2, P.y + 20, {size: 14, color: '#f3e2c0', maxW: P.w - 20});
      if (bi < 0) return;
      const c = Z.s / 3, act = live.some(m => ((m / 9) | 0) === bi);
      D.paper(g, Z.x, Z.y, Z.s, Z.s, {r: c * .2, color: '#f3e7cc'});
      if (act) { g.strokeStyle = 'rgba(200,150,50,.95)'; g.lineWidth = 4; D.rr(g, Z.x - 2, Z.y - 2, Z.s + 4, Z.s + 4, c * .22); g.stroke(); }
      g.strokeStyle = 'rgba(60,40,20,.7)'; g.lineWidth = Math.max(2, c * .05); g.lineCap = 'round';
      g.beginPath(); for (let i = 1; i < 3; i++) { g.moveTo(Z.x + c * i, Z.y + c * .1); g.lineTo(Z.x + c * i, Z.y + Z.s - c * .1); g.moveTo(Z.x + c * .1, Z.y + c * i); g.lineTo(Z.x + Z.s - c * .1, Z.y + c * i); } g.stroke();
      for (let k = 0; k < 9; k++) {
        const m = bi * 9 + k, x = Z.x + (k % 3) * c, y = Z.y + ((k / 3) | 0) * c, v = st.b[m];
        if (v) { g.globalAlpha = st.big[bi] ? .45 : 1; mark(g, x + c / 2, y + c / 2, c * .28, v - 1, m === fx.drop ? fx.t : 1); g.globalAlpha = 1; }
        else if (mine && live.includes(m) && ctx.pref('hints')) { g.fillStyle = 'rgba(200,150,50,.18)'; D.rr(g, x + c * .12, y + c * .12, c * .76, c * .76, c * .14); g.fill(); }
        if (m === st.last) { g.strokeStyle = 'rgba(200,150,50,.95)'; g.lineWidth = 3; D.rr(g, x + 4, y + 4, c - 8, c - 8, 8); g.stroke(); }
        if (m === hint && !v) { g.strokeStyle = 'rgba(63,160,120,' + (.55 + .35 * Math.sin(tk * 6)) + ')'; g.lineWidth = 5; D.rr(g, x + 5, y + 5, c - 10, c - 10, 10); g.stroke(); }
        if (m === preview && !v) { g.globalAlpha = .7; mark(g, x + c / 2, y + c / 2, c * .28, st.turn, 1); g.globalAlpha = 1; const d = destOf(m); D.text(g, '→' + (d >= 0 ? POS[d] : '任选'), x + c / 2, y + c * .9, {size: Math.max(11, c * .13), color: COL[1 - st.turn], weight: 800}); }
        // tiny map of where each cell sends the opponent (destination board label)
        else if (!v && mine && act && ctx.pref('hints') && c > 60) D.text(g, POS[k], x + c / 2, y + c * .86, {size: Math.max(10, c * .1), color: 'rgba(90,70,50,.35)'});
      }
      const v = st.big[bi];
      if (v === 1 || v === 2) { g.save(); g.globalAlpha = .25; mark(g, Z.x + Z.s / 2, Z.y + Z.s / 2, Z.s * .32, v - 1, 1); g.restore(); }
    }
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
