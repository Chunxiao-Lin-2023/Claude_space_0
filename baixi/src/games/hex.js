/* 六角棋 — Hex with optional swap (pie) rule. seat0 红 connects top↔bottom (rows), seat1 蓝 connects left↔right (cols). */
const D = BX.draw, C = BX.C;
const COL = ['#c0392b', '#2c5f93'];
const NB = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]];
/* bridge offsets: [dr,dc, carrier1(dr,dc), carrier2(dr,dc)] */
const BR = [[-1, 2, [-1, 1], [0, 1]], [1, 1, [0, 1], [1, 0]], [2, -1, [1, 0], [1, -1]], [1, -2, [1, -1], [0, -1]], [-1, -1, [0, -1], [-1, 0]], [-2, 1, [-1, 0], [-1, 1]]];

function makeTables(N) {
  const nb = [], br = [];
  for (let i = 0; i < N * N; i++) {
    const r = (i / N) | 0, c = i % N, a = [], b = [];
    for (const [dr, dc] of NB) { const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < N && cc < N) a.push(rr * N + cc); }
    for (const [dr, dc, p, q] of BR) {
      const rr = r + dr, cc = c + dc, r1 = r + p[0], c1 = c + p[1], r2 = r + q[0], c2 = c + q[1];
      if (rr >= 0 && cc >= 0 && rr < N && cc < N) b.push([rr * N + cc, r1 * N + c1, r2 * N + c2]);
    }
    nb.push(a); br.push(b);
  }
  return {nb, br};
}
/* winner check: v=1 red rows 0→N-1, v=2 blue cols. returns path cells or null */
function connected(b, N, nb, v, wantPath) {
  const seen = new Int16Array(N * N).fill(-2), q = [];
  for (let k = 0; k < N; k++) { const i = v === 1 ? k : k * N; if (b[i] === v) { seen[i] = -1; q.push(i); } }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], r = (i / N) | 0, c = i % N;
    if (v === 1 ? r === N - 1 : c === N - 1) {
      if (!wantPath) return true;
      const path = []; for (let j = i; j >= 0; j = seen[j]) path.push(j); return path;
    }
    for (const j of nb[i]) if (b[j] === v && seen[j] === -2) { seen[j] = i; q.push(j); }
  }
  return wantPath ? null : false;
}

/* ---------- MCTS with RAVE and bridge-saving playouts ---------- */
function mctsHex(b0, N, T, toPlay, ms, opt) {
  const NN = N * N, t0 = performance.now(), {nb, br} = T;
  const b = new Int8Array(NN), owner = new Int8Array(NN), empt = new Int16Array(NN);
  const K = opt.rave ? 600 : 0;
  const mkNode = (bb, who) => { const mv = []; for (let i = 0; i < NN; i++) if (!bb[i]) mv.push(i); const n = mv.length; return {who, mv: Int16Array.from(mv), n: new Float32Array(n), w: new Float32Array(n), rn: new Float32Array(n), rw: new Float32Array(n), kid: new Array(n).fill(null), N: 0}; };
  const root = mkNode(b0, toPlay);
  // prior: center-ish cells and bridges / neighbours get small virtual wins
  for (let k = 0; k < root.mv.length; k++) {
    const i = root.mv[k], r = (i / N) | 0, c = i % N, d = Math.abs(r - (N - 1) / 2) + Math.abs(c - (N - 1) / 2);
    let pr = Math.max(0, N * .6 - d) / N;
    for (const j of nb[i]) if (b0[j]) pr += .15;
    for (const [j] of br[i]) if (b0[j] === toPlay) pr += .25;
    root.rn[k] += 4; root.rw[k] += 4 * Math.min(.9, .3 + pr * .5);
  }
  let it = 0;
  const path = [], pathIdx = [];
  while (it < opt.cap && (it < 40 || performance.now() - t0 < ms)) {
    it++;
    b.set(b0); let who = toPlay, node = root; path.length = 0; pathIdx.length = 0;
    // selection
    while (node) {
      let best = -1, bv = -1e9; const lnN = Math.log(node.N + 1);
      for (let k = 0; k < node.mv.length; k++) {
        if (b[node.mv[k]]) continue;
        const n = node.n[k], rn = node.rn[k];
        let q = n ? node.w[k] / n : .5;
        if (K && rn) { const beta = Math.sqrt(K / (3 * node.N + K)); q = (1 - beta) * q + beta * node.rw[k] / rn; }
        const v = q + opt.c * Math.sqrt(lnN / (n + 1)) + Math.random() * 1e-6;
        if (v > bv) { bv = v; best = k; }
      }
      if (best < 0) break;
      path.push(node); pathIdx.push(best);
      const m = node.mv[best]; b[m] = who; who = 3 - who;
      if (!node.kid[best]) { if (node.n[best] >= 2) node.kid[best] = mkNode(b, who); else { node = null; break; } }
      node = node.kid[best];
    }
    // playout: fill randomly with bridge saving
    let ne = 0; for (let i = 0; i < NN; i++) if (!b[i]) empt[ne++] = i;
    for (let i = ne - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = empt[i]; empt[i] = empt[j]; empt[j] = t; }
    let last = path.length ? path[path.length - 1].mv[pathIdx[pathIdx.length - 1]] : -1;
    let p = 0;
    while (p < ne) {
      let m = -1;
      if (opt.bridge && last >= 0) {   // opponent (who just moved at last) intruded a bridge of `who`? answer it
        const me = who;
        for (const j of nb[last]) {
          if (b[j] !== me) continue;
          for (const [k2, c1, c2] of br[j]) { if (b[k2] !== me) continue; if (c1 === last && !b[c2]) { m = c2; break; } if (c2 === last && !b[c1]) { m = c1; break; } }
          if (m >= 0) break;
        }
      }
      if (m < 0) { while (p < ne && b[empt[p]]) p++; if (p >= ne) break; m = empt[p++]; }
      b[m] = who; last = m; who = 3 - who;
    }
    const winner = connected(b, N, nb, 1, false) ? 1 : 2;
    // backprop with AMAF
    for (let d = path.length - 1; d >= 0; d--) {
      const nd = path[d], k = pathIdx[d], mover = nd.who, res = winner === mover ? 1 : 0;
      nd.N++; nd.n[k]++; nd.w[k] += res;
      if (K) for (let q = 0; q < nd.mv.length; q++) { const cell = nd.mv[q]; if (b[cell] === mover) { nd.rn[q]++; nd.rw[q] += res; } }
    }
  }
  let bk = 0; for (let k = 1; k < root.mv.length; k++) if (root.n[k] > root.n[bk]) bk = k;
  return {m: root.mv[bk], it, winrate: root.n[bk] ? root.w[bk] / root.n[bk] : .5};
}

BX.register({
  id: 'hex', title: '六角棋', cat: 'brain', order: 4, sub: '连通两岸，永无和棋',
  desc: '菱形棋盘铺满六角格，红方要连通上下两岸，蓝方要连通左右两岸。规则极简却变化无穷，而且永远不会和棋。可选“交换规则”保证公平。',
  kind: 'turn', seats: 2, seatNames: ['红方', '蓝方'], seatColors: COL, firstLabel: '先手',
  options: [
    {key: 'size', label: '棋盘', choices: [[7, '7×7'], [9, '9×9'], [11, '11×11']], def: 11},
    {key: 'swap', label: '交换规则', choices: [[1, '开启'], [0, '关闭']], def: 1},
  ],
  rules: `<p>棋盘是由六角格组成的菱形。<b>红方</b>拥有上、下两条边，<b>蓝方</b>拥有左、右两条边（边框颜色即归属）。</p>
<p>红方先行，双方轮流在任意空格放一枚自己颜色的棋子，棋子放下后不再移动。</p>
<p>先用自己的棋子把<b>自己的两条边连通</b>（一条相邻棋子组成的链）者获胜。六角棋<b>不可能和棋</b>：棋盘填满时必有一方连通。</p>
<p><b>交换规则（开启时）：</b>先手优势很大，所以红方下完第一手后，蓝方可以选择“交换”——把这枚棋子沿对角线翻转成自己的蓝子，红方接着下。因此红方第一手不宜下得太强。</p>
<p>小技巧：两枚同色棋子之间隔着两个空格的“桥”几乎无法被切断。触屏上第一次点击预览，再点同一格确认。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#efe2c4', '#d9c49a');
    const N = 6, R = h * .085, hw = Math.sqrt(3) * R, ox = w / 2 - (N - 1) * .75 * hw, oy = h / 2 - (N - 1) * .75 * R;
    const P = (r, c) => [ox + (c + r / 2) * hw, oy + r * 1.5 * R];
    const hex = (x, y, r) => { g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
    const red = [[0, 3], [1, 2], [2, 2], [3, 1], [4, 1], [5, 0]], blue = [[2, 0], [2, 1], [1, 3], [3, 3], [2, 4], [1, 5]];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const [x, y] = P(r, c); hex(x, y, R * .98); g.fillStyle = '#f6ecd4'; g.fill(); g.strokeStyle = 'rgba(80,55,30,.5)'; g.lineWidth = 1; g.stroke();
    }
    g.lineWidth = 3; g.strokeStyle = COL[0]; let a = P(-.7, -.4), b = P(-.7, N - .6); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); a = P(N - .3, -.4); b = P(N - .3, N - .6); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
    g.strokeStyle = COL[1]; a = P(-.5, -.7); b = P(N - .5, -.7); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); a = P(-.5, N - .3); b = P(N - .5, N - .3); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
    for (const [r, c] of red) { const [x, y] = P(r, c); D.disc(g, x, y, R * .7, COL[0], {shadow: false}); }
    for (const [r, c] of blue) { const [x, y] = P(r, c); D.disc(g, x, y, R * .7, COL[1], {shadow: false}); }
  },
  create(ctx) {
    const N = +ctx.opts.size || 11, NN = N * N, pie = ctx.opts.swap == null ? true : !!+ctx.opts.swap;
    const T = makeTables(N);
    const st = {N, b: new Array(NN).fill(0), turn: 0, moves: 0, last: -1, swapped: false, over: false, win: null};
    const cv = ctx.canvas();
    const ui = ctx.ui();
    const swapBtn = h2('button', 'bx-btn jade', '交换（取走这一手）');
    swapBtn.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));display:none';
    swapBtn.onclick = () => { if (canSwap() && ctx.canAct(1)) ctx.act({swap: 1}, 1); };
    ui.append(swapBtn);
    function h2(tag, cls, text) { const e = document.createElement(tag); e.className = cls; e.textContent = text; return e; }
    const canSwap = () => pie && st.moves === 1 && !st.swapped && st.turn === 1 && !st.over;
    let hover = -1, preview = -1, drop = {i: -1, t: 1};

    /* ---------- layout ---------- */
    function raw(r, c) { return [(c + r / 2) * Math.sqrt(3), r * 1.5]; }   // R = 1
    let lCache = null;
    function L() {
      const bottom = canSwap() && ctx.canAct(1) ? 64 : 0;
      const key = cv.w + 'x' + cv.h + 'x' + bottom; if (lCache && lCache.key === key) return lCache;
      const pad = 1.15, pts = [raw(-pad, -pad * .5), raw(-pad, N - 1 + pad), raw(N - 1 + pad, N - 1 + pad * .5), raw(N - 1 + pad, -pad)];
      const ctr = raw((N - 1) / 2, (N - 1) / 2);
      let best = null;
      // candidate orientations: diamond (long diagonal horizontal / vertical) or classic parallelogram (flat / upright)
      for (const [rot, pref] of [[-Math.PI / 6, 1.1], [Math.PI / 3, 1.1], [0, 1], [Math.PI / 2, 1], [Math.PI / 6, 1], [-Math.PI / 3, 1]]) {
        const cs = Math.cos(rot), sn = Math.sin(rot);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const [x, y] of pts) { const dx = x - ctr[0], dy = y - ctr[1], X = dx * cs - dy * sn, Y = dx * sn + dy * cs; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
        const f = BX.fit(cv.w, cv.h - bottom, x1 - x0, y1 - y0, 4);
        if (!best || f.s * pref > best.R * best.pref) best = {key, pref, R: f.s, cs, sn, ctr, rot, cx: cv.w / 2 - (x0 + x1) / 2 * f.s, cy: (cv.h - bottom) / 2 - (y0 + y1) / 2 * f.s};
      }
      return (lCache = best);
    }
    function P(r, c, l) {
      const [x, y] = raw(r, c), dx = x - l.ctr[0], dy = y - l.ctr[1];
      return [l.cx + (dx * l.cs - dy * l.sn) * l.R, l.cy + (dx * l.sn + dy * l.cs) * l.R];
    }
    const cellAt = p => { const l = L(); let best = -1, bd = l.R * .95; for (let i = 0; i < NN; i++) { const [x, y] = P((i / N) | 0, i % N, l); const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } } return best; };
    const myTurn = () => ctx.canAct(st.turn);
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = cellAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!myTurn()) return;
      const i = cellAt(cv.pos(e)); if (i < 0 || st.b[i]) return;
      if (e.pointerType !== 'mouse' && preview !== i) { preview = i; ctx.sfx('tick'); return; }
      preview = -1; ctx.act({i}, st.turn);
    });
    const status = () => {
      ctx.info(0, '上下'); ctx.info(1, '左右');
      swapBtn.style.display = canSwap() && ctx.canAct(1) ? '' : 'none';
      if (st.over) return ctx.status(ctx.name(st.win.seat) + ' 连通两岸');
      const me = ctx.canAct(st.turn);
      let s = me ? (ctx.hotseat ? ctx.name(st.turn) + '落子' : '轮到你落子') : '等待 ' + ctx.name(st.turn) + '…';
      if (canSwap()) s += me ? ' · 可选择交换' : '';
      if (st.swapped && st.moves === 1) s = '<b style="color:#e6c57d">蓝方选择了交换</b> ' + s;
      ctx.status(s);
    };
    function finishIf(v) {
      const path = connected(st.b, N, T.nb, v, true);
      if (path) { st.win = {seat: v - 1, path}; st.over = true; status(); ctx.end({winner: v - 1, text: '共 ' + st.moves + ' 手'}); return true; }
      return false;
    }
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: (a, by) => a.swap ? canSwap() && by === 1 : Number.isInteger(a.i) && a.i >= 0 && a.i < NN && !st.b[a.i],
      apply(a) {
        if (a.swap) {
          const i = st.b.indexOf(1), r = (i / N) | 0, c = i % N, j = c * N + r;
          st.b[i] = 0; st.b[j] = 2; st.swapped = true; st.last = j; st.turn = 0;
          drop = {i: j, t: 0}; ctx.anim(320, k => drop.t = k, null, BX.ease.back); ctx.sfx('whoosh');
          status(); return;
        }
        st.b[a.i] = st.turn + 1; st.last = a.i; st.moves++; preview = -1;
        drop = {i: a.i, t: 0}; ctx.anim(180, k => drop.t = k); ctx.sfx('stone');
        if (finishIf(st.turn + 1)) return;
        st.turn = 1 - st.turn; status();
      },
      aiMove(seat, level) {
        const v = seat + 1;
        // swap decision / pie-aware opening
        if (canSwap()) {
          const i = st.b.indexOf(1), r = (i / N) | 0, c = i % N;
          const central = Math.min(r, N - 1 - r) >= 1 && Math.min(c, N - 1 - c) >= 1 && !(r + c <= 2 || r + c >= 2 * N - 4);
          if (level >= 2 ? central : Math.random() < .5) return {swap: 1};
        }
        if (pie && st.moves === 0 && level >= 2) {
          // pie rule: open with a modest edge move that is hard to judge (not worth swapping)
          const opts = []; for (let r = 1; r < N - 1; r++) opts.push(r * N, r * N + N - 1);
          return {i: opts[(Math.random() * opts.length) | 0]};
        }
        const empties = []; for (let i = 0; i < NN; i++) if (!st.b[i]) empties.push(i);
        // immediate win / forced block
        const b = Int8Array.from(st.b);
        for (const i of empties) { b[i] = v; if (connected(b, N, T.nb, v, false)) return {i}; b[i] = 0; }
        if (level >= 2) for (const i of empties) { b[i] = 3 - v; const lose = connected(b, N, T.nb, 3 - v, false); b[i] = 0; if (lose) return {i}; }
        if (level === 1 && Math.random() < .25) {
          const near = empties.filter(i => T.nb[i].some(j => st.b[j])); const pool = near.length ? near : empties;
          return {i: pool[(Math.random() * pool.length) | 0]};
        }
        const scale = NN / 121;
        const ms = BX.test ? 30 : [0, 140, 420, 760][level];
        const r = mctsHex(b, N, T, v, ms, {rave: level >= 2, bridge: level >= 2, c: level >= 2 ? .25 : .7, cap: level === 1 ? Math.round(1500 * scale + 300) : 1e9});
        return {i: r.m};
      },
      onTurn: status,
      frame() {
        const g = cv.g; cv.clear(); const l = L(), R = l.R;
        // board base (rhombus with coloured banks)
        const corner = (r, c) => P(r, c, l);
        const pad = 1.15;
        const A2 = corner(-pad, -pad * .5), B2 = corner(-pad, N - 1 + pad), C2 = corner(N - 1 + pad, N - 1 + pad * .5), D2 = corner(N - 1 + pad, -pad);
        g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = R; g.shadowOffsetY = R * .3;
        g.fillStyle = '#7a4a24'; g.beginPath(); g.moveTo(...A2); g.lineTo(...B2); g.lineTo(...C2); g.lineTo(...D2); g.closePath(); g.fill(); g.restore();
        g.save(); g.beginPath(); g.moveTo(...A2); g.lineTo(...B2); g.lineTo(...C2); g.lineTo(...D2); g.closePath(); g.clip();
        const xs = [A2[0], B2[0], C2[0], D2[0]], ys = [A2[1], B2[1], C2[1], D2[1]];
        D.wood(g, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), {seed: 13, base: '#b47a44', dark: '#6b4426'});
        // bank colours: triangles from centre to each side
        const mid = P((N - 1) / 2, (N - 1) / 2, l);
        const tri = (p, q, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(...mid); g.lineTo(...p); g.lineTo(...q); g.closePath(); g.fill(); };
        tri(A2, B2, D.alpha(COL[0], .85)); tri(C2, D2, D.alpha(COL[0], .85)); tri(B2, C2, D.alpha(COL[1], .85)); tri(D2, A2, D.alpha(COL[1], .85));
        g.restore();
        // cells
        const hex = (x, y, r) => { g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + l.rot + k * Math.PI / 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
        const winSet = st.win ? new Set(st.win.path) : null;
        for (let i = 0; i < NN; i++) {
          const [x, y] = P((i / N) | 0, i % N, l);
          hex(x, y, R * 1.0); g.fillStyle = '#efe1c0'; g.fill(); g.strokeStyle = '#5a3a1e'; g.lineWidth = Math.max(1, R * .08); g.stroke();
          hex(x, y, R * .8); g.fillStyle = 'rgba(255,255,255,.18)'; g.fill();
        }
        // star points for orientation
        for (let i = 0; i < NN; i++) {
          const v = st.b[i]; if (!v) continue;
          const [x, y] = P((i / N) | 0, i % N, l); const k = i === drop.i ? .55 + .45 * drop.t : 1;
          D.disc(g, x, y, R * .68 * k, COL[v - 1], {ring: 'rgba(255,255,255,.28)'});
        }
        if (winSet) {
          g.strokeStyle = C.gold2; g.lineWidth = R * .3; g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = .9;
          g.beginPath(); st.win.path.forEach((i, k) => { const [x, y] = P((i / N) | 0, i % N, l); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.globalAlpha = 1;
        }
        if (st.last >= 0) { const [x, y] = P((st.last / N) | 0, st.last % N, l); g.fillStyle = '#ffe6a0'; D.circle(g, x, y, R * .18); g.fill(); }
        const gh = preview >= 0 ? preview : hover;
        if (gh >= 0 && !st.b[gh] && myTurn()) { const [x, y] = P((gh / N) | 0, gh % N, l); g.globalAlpha = preview >= 0 ? .75 : .45; D.disc(g, x, y, R * .68, COL[st.turn], {shadow: false}); g.globalAlpha = 1; }
        // bank labels
        const lab = (p, q, txt, col) => { const x = (p[0] + q[0]) / 2, y = (p[1] + q[1]) / 2, dx = x - mid[0], dy = y - mid[1], d = Math.hypot(dx, dy) || 1; D.text(g, txt, x - dx / d * R * .05, y - dy / d * R * .05, {size: Math.max(11, R * .62), color: '#fff3e0', font: 'serif', weight: 800, shadow: 'rgba(0,0,0,.5)'}); void col; };
        if (R > 9) { lab(A2, B2, '红', COL[0]); lab(C2, D2, '红', COL[0]); lab(B2, C2, '蓝', COL[1]); lab(D2, A2, '蓝', COL[1]); }
      },
    };
    status();
    return inst;
  },
});
