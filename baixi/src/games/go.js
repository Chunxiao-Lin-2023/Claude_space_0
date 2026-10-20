/* 围棋 — 中国规则（数子法 + 贴目），位置超级劫，自动判断死活后双方确认；电脑：MCTS + RAVE + 简单棋形先验 */
const D = BX.draw, C = BX.C;
const ZR = BX.rng(0x60D0BEEF), ZT = new Uint32Array(2 * 361 * 2);
for (let i = 0; i < ZT.length; i++) ZT[i] = (ZR() * 4294967296) >>> 0;
const Z = (c, i, k) => ZT[((c - 1) * 361 + i) * 2 + k];
const keyOf = h => h[0] + (h[1] & 0x1fffff) * 4294967296;
const LETTERS = 'ABCDEFGHJKLMNOPQRST';
const STAR = {19: [3, 9, 15], 13: [3, 6, 9], 9: [2, 4, 6]};

/* ---------------- fast board engine (padded, shared by rules and AI) ---------------- */
function makeEng(N) {
  const W = N + 2, S = W * W;
  const b = new Uint8Array(S), mark = new Int32Array(S), stk = new Int32Array(S);
  const empt = new Int32Array(S), eIdx = new Int32Array(S).fill(-1);
  const D4 = [1, -1, W, -W], DG = [W + 1, W - 1, 1 - W, -1 - W];
  let stamp = 0;
  const E = {N, W, S, b, empt, eIdx, D4, ko: -1, last: -1, ne: 0, lib: -1, caps: []};
  const P = E.P = (x, y) => (y + 1) * W + x + 1;
  E.X = p => p % W - 1; E.Y = p => ((p / W) | 0) - 1;
  E.toI = p => E.Y(p) * N + E.X(p);
  E.fromI = i => P(i % N, (i / N) | 0);
  function addE(p) { eIdx[p] = E.ne; empt[E.ne++] = p; }
  function delE(p) { const j = eIdx[p], q = empt[--E.ne]; empt[j] = q; eIdx[q] = j; eIdx[p] = -1; }
  E.load = arr => {
    b.fill(3); E.ne = 0; eIdx.fill(-1); E.ko = -1; E.last = -1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const p = P(x, y), v = arr[y * N + x]; b[p] = v; if (!v) addE(p); }
  };
  E.copy = o => { b.set(o.b); empt.set(o.empt); eIdx.set(o.eIdx); E.ne = o.ne; E.ko = o.ko; E.last = o.last; };
  /* count liberties of the group at p, stopping at max; E.lib = a liberty found */
  E.libs = (p, max) => {
    if (++stamp > 2e9) { mark.fill(0); stamp = 1; }
    const c = b[p]; let sp = 0, n = 0; stk[sp++] = p; mark[p] = stamp;
    while (sp) {
      const q = stk[--sp];
      for (let k = 0; k < 4; k++) {
        const r = q + D4[k]; if (mark[r] === stamp) continue; const v = b[r];
        if (v === 0) { mark[r] = stamp; E.lib = r; if (++n >= max) return n; }
        else if (v === c) { mark[r] = stamp; stk[sp++] = r; }
      }
    }
    return n;
  };
  function remove(p) {
    const c = b[p]; let sp = 0, n = 0; stk[sp++] = p; b[p] = 0; addE(p); E.caps.push(p); n++;
    while (sp) {
      const q = stk[--sp];
      for (let k = 0; k < 4; k++) { const r = q + D4[k]; if (b[r] === c) { b[r] = 0; addE(r); E.caps.push(r); n++; stk[sp++] = r; } }
    }
    return n;
  }
  E.play = (p, c) => {
    E.caps.length = 0;
    if (p < 0) { E.ko = -1; E.last = -1; return 0; }
    b[p] = c; delE(p); const o = 3 - c; let cap = 0, cp = -1;
    for (let k = 0; k < 4; k++) { const r = p + D4[k]; if (b[r] === o && E.libs(r, 1) === 0) { cap += remove(r); cp = r; } }
    E.ko = -1;
    if (cap === 1) {
      let alone = true; for (let k = 0; k < 4; k++) if (b[p + D4[k]] === c) alone = false;
      if (alone && E.libs(p, 2) === 1) E.ko = cp;
    }
    E.last = p; return cap;
  };
  E.legal = (p, c) => {
    if (b[p] !== 0 || p === E.ko) return false;
    for (let k = 0; k < 4; k++) if (b[p + D4[k]] === 0) return true;
    for (let k = 0; k < 4; k++) {
      const r = p + D4[k], v = b[r];
      if (v === c) { if (E.libs(r, 2) >= 2) return true; }
      else if (v === 3 - c) { if (E.libs(r, 2) === 1) return true; }
    }
    return false;
  };
  E.isEye = (p, c) => {
    for (let k = 0; k < 4; k++) { const v = b[p + D4[k]]; if (v !== c && v !== 3) return false; }
    let opp = 0, edge = 0;
    for (let k = 0; k < 4; k++) { const v = b[p + DG[k]]; if (v === 3 - c) opp++; else if (v === 3) edge = 1; }
    return edge ? opp === 0 : opp <= 1;
  };
  /* would playing p put a multi-stone group of c into atari (without capturing)? */
  E.selfAtari = (p, c) => {
    let e = 0, own = false;
    for (let k = 0; k < 4; k++) { const v = b[p + D4[k]]; if (v === 0) e++; else if (v === c) own = true; }
    if (e >= 2 || !own) return false;
    b[p] = c; let bad = E.libs(p, 2) <= 1;
    if (bad) for (let k = 0; k < 4; k++) { const r = p + D4[k]; if (b[r] === 3 - c && E.libs(r, 1) === 0) { bad = false; break; } }
    b[p] = 0; return bad;
  };
  /* light playout policy: answer ataris around the last move, otherwise random non-eye, non-self-atari move */
  E.pick = c => {
    const L = E.last;
    if (L >= 0 && Math.random() < .9) {
      if (b[L] === 3 - c && E.libs(L, 2) === 1) { const l = E.lib; if (E.legal(l, c)) return l; }
      for (let k = 0; k < 4; k++) {
        const r = L + D4[k];
        if (b[r] === c && E.libs(r, 2) === 1) {
          const l = E.lib; let e = 0; for (let j = 0; j < 4; j++) if (b[l + D4[j]] === 0) e++;
          if (e >= 2 && E.legal(l, c)) return l;
        }
      }
    }
    let n = E.ne;
    while (n > 0) {
      const j = (Math.random() * n) | 0, p = empt[j];
      if (!E.isEye(p, c) && E.legal(p, c) && !E.selfAtari(p, c)) return p;
      n--; const q = empt[n]; empt[j] = q; eIdx[q] = j; empt[n] = p; eIdx[p] = n;
    }
    return -1;
  };
  /* area score (black − white) at the end of a playout; optionally accumulate ownership */
  E.area = own => {
    let s = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const p = P(x, y), v = b[p]; let o = 0;
      if (v === 1) o = 1; else if (v === 2) o = -1;
      else { let bl = 0, wh = 0; for (let k = 0; k < 4; k++) { const q = b[p + D4[k]]; if (q === 1) bl = 1; else if (q === 2) wh = 1; } o = bl && !wh ? 1 : wh && !bl ? -1 : 0; }
      s += o; if (own) own[y * N + x] += o;
    }
    return s;
  };
  E.playout = (c, maxM, amaf) => {
    let pass = 0, m = 0;
    while (pass < 2 && m < maxM) {
      const p = E.pick(c);
      if (p < 0) { pass++; E.ko = -1; E.last = -1; } else { pass = 0; E.play(p, c); if (amaf && !amaf[p]) amaf[p] = c; }
      c = 3 - c; m++;
    }
  };
  return E;
}

/* ---------------- move priors (shape / tactics) ---------------- */
const PREP = {};
function prep(E) {
  const N = E.N, S = E.S, b = E.b, M = N + 1;
  let F = PREP[N];
  if (!F) F = PREP[N] = {gid: new Int32Array(S), glib: new Int32Array(S), gsz: new Int32Array(S), mk: new Int32Array(S), stk: new Int32Array(S), I: new Int32Array(M * M), M, stamp: 0};
  const gid = F.gid, glib = F.glib, gsz = F.gsz, mk = F.mk, stk = F.stk; gid.fill(-1); let ng = 0;
  for (let p = 0; p < S; p++) {
    const c = b[p]; if ((c !== 1 && c !== 2) || gid[p] >= 0) continue;
    const id = ng++; const stamp = ++F.stamp; let sz = 0, lb = 0, sp = 0; stk[sp++] = p; gid[p] = id;
    while (sp) {
      const q = stk[--sp]; sz++;
      for (let k = 0; k < 4; k++) { const r = q + E.D4[k], v = b[r]; if (v === 0) { if (mk[r] !== stamp) { mk[r] = stamp; lb++; } } else if (v === c && gid[r] < 0) { gid[r] = id; stk[sp++] = r; } }
    }
    glib[id] = lb; gsz[id] = sz;
  }
  const I = F.I;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = b[E.P(x, y)]; I[(y + 1) * M + x + 1] = (v === 1 || v === 2 ? 1 : 0) + I[y * M + x + 1] + I[(y + 1) * M + x] - I[y * M + x]; }
  return F;
}
function stonesIn(F, N, x0, y0, x1, y1) {
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(N - 1, x1); y1 = Math.min(N - 1, y1); const M = F.M, I = F.I;
  return I[(y1 + 1) * M + x1 + 1] - I[y0 * M + x1 + 1] - I[(y1 + 1) * M + x0] + I[y0 * M + x0];
}
function prior(E, F, p, c) {
  const N = E.N, b = E.b, x = E.X(p), y = E.Y(p), d = Math.min(x, y, N - 1 - x, N - 1 - y);
  let v = .5, capSz = 0, savSz = 0, atari = 0, newL = 0, ownAdj = false; const seen = [-1, -1, -1, -1]; let ns = 0;
  for (let k = 0; k < 4; k++) {
    const r = p + E.D4[k], q = b[r];
    if (q === 0) newL++;
    else if (q === c) { const g = F.gid[r]; ownAdj = true; if (seen[0] !== g && seen[1] !== g && seen[2] !== g) { seen[ns++] = g; newL += F.glib[g] - 1; if (F.glib[g] === 1) savSz += F.gsz[g]; } }
    else if (q === 3 - c) { const g = F.gid[r]; if (seen[0] !== g && seen[1] !== g && seen[2] !== g) { seen[ns++] = g; if (F.glib[g] === 1) capSz += F.gsz[g]; else if (F.glib[g] === 2) atari++; } }
  }
  if (capSz) v += Math.min(.38, .18 + .05 * capSz);
  if (savSz && newL >= 2) v += Math.min(.32, .12 + .05 * savSz);
  if (!capSz && newL <= 1) v -= ownAdj ? .32 : .12;
  if (atari) v += .05;
  const near = stonesIn(F, N, x - 3, y - 3, x + 3, y + 3);
  if (!near) { if (d === 0) v -= .28; else if (d === 1) v -= .14; else if (d === 2 || d === 3) v += .1; }
  else {
    if (d === 0 && stonesIn(F, N, x - 1, y - 1, x + 1, y + 1) === 0) v -= .12;
    if (stonesIn(F, N, x - 2, y - 2, x + 2, y + 2)) v += .03;
  }
  if (E.last >= 0 && Math.max(Math.abs(E.X(E.last) - x), Math.abs(E.Y(E.last) - y)) <= 2) v += .06;
  return {v: Math.max(.04, Math.min(.96, v)), tac: !!(capSz || (savSz && newL >= 2))};
}

/* ---------------- MCTS with RAVE ---------------- */
const N0 = 10, RB = .04, EXP = 6;
function expand(node, E, c, ok) {
  const F = prep(E), kids = [];
  for (let j = 0; j < E.ne; j++) {
    const p = E.empt[j]; if (E.isEye(p, c) || !E.legal(p, c)) continue;
    if (ok && !ok(p)) continue;
    const f = prior(E, F, p, c);
    kids.push({p, c, n: N0, w: N0 * f.v, rn: N0, rw: N0 * f.v, v: 0, kids: null, pv: f.v, tac: f.tac});
  }
  node.kids = kids;
}
function selectKid(node) {
  let best = null, bv = -1; const ln = Math.log(node.n + 1);
  for (const k of node.kids) {
    const q = k.w / k.n, rq = k.rw / k.rn, beta = k.rn / (k.rn + k.n + RB * k.rn * k.n);
    const val = (1 - beta) * q + beta * rq + .06 * Math.sqrt(ln / k.n);
    if (val > bv) { bv = val; best = k; }
  }
  return best;
}
async function search(o) {
  const N = o.N, E = makeEng(N), base = makeEng(N);
  base.load(o.b); base.ko = o.ko >= 0 ? base.fromI(o.ko) : -1; base.last = o.last >= 0 ? base.fromI(o.last) : -1;
  const own = new Float32Array(N * N), amaf = new Uint8Array(E.S);
  const root = {p: -1, c: 3 - o.c, n: 0, w: 0, kids: null};
  expand(root, base, o.c, o.ok);
  if (!root.kids.length) return {move: -1, wr: .5, own, n: 0, kids: []};
  const t0 = performance.now(); let slice = t0, it = 0; const maxM = N * N * 2;
  while (it < (o.min || 16) || performance.now() - t0 < o.ms) {
    it++; E.copy(base); amaf.fill(0);
    let node = root, c = o.c; const path = [root];
    for (;;) {
      if (!node.kids) { if (node.v >= EXP) expand(node, E, c, null); else break; }
      if (!node.kids.length) break;
      const k = selectKid(node); E.play(k.p, c); if (!amaf[k.p]) amaf[k.p] = c;
      path.push(k); node = k; c = 3 - c;
    }
    E.playout(c, maxM, amaf);
    const winC = E.area(own) - o.komi > 0 ? 1 : 2;
    for (const nd of path) {
      nd.n++; if (nd !== root) nd.v++; if (nd.c === winC) nd.w++;
      if (nd.kids) for (const k of nd.kids) if (amaf[k.p] === k.c) { k.rn++; if (k.c === winC) k.rw++; }
    }
    if (performance.now() - slice > 35) { await BX.ai.yield(); slice = performance.now(); if (o.stale && o.stale()) break; }
  }
  for (let i = 0; i < own.length; i++) own[i] /= it;
  let best = null;
  for (const k of root.kids) if (!best || k.v > best.v || (k.v === best.v && k.w / k.n > best.w / best.n)) best = k;
  return {move: base.toI(best.p), wr: best.w / best.n, own, n: it, kids: root.kids.map(k => ({i: base.toI(k.p), v: k.v, pv: k.pv, tac: k.tac, q: k.w / k.n}))};
}
/* ownership estimate from pure playouts (dead-stone judgement) */
function ownership(b, N, c, ko, n) {
  const E = makeEng(N), base = makeEng(N); base.load(b); base.ko = ko >= 0 ? base.fromI(ko) : -1;
  const own = new Float32Array(N * N);
  for (let k = 0; k < n; k++) { E.copy(base); E.playout(c, N * N * 2, null); E.area(own); }
  for (let i = 0; i < own.length; i++) own[i] /= n;
  return own;
}
/* group (same-colour connected) of index i on a plain board */
function groupOf(b, N, i) {
  const c = b[i], out = [i], seen = new Set([i]);
  for (let k = 0; k < out.length; k++) {
    const j = out[k], x = j % N, y = (j / N) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
      const q = yy * N + xx; if (b[q] === c && !seen.has(q)) { seen.add(q); out.push(q); }
    }
  }
  return out;
}
/* Chinese area count with dead stones removed. terr[i] = owner 1/2 or 0 */
function areaCount(b, N, dead) {
  const a = b.map((v, i) => dead && dead[i] ? 0 : v), terr = new Array(N * N).fill(0), seen = new Uint8Array(N * N);
  let bs = 0, ws = 0;
  for (let i = 0; i < N * N; i++) {
    if (a[i] === 1) { bs++; terr[i] = 1; continue; } if (a[i] === 2) { ws++; terr[i] = 2; continue; }
    if (seen[i]) continue;
    const reg = [i]; seen[i] = 1; let bl = 0, wh = 0;
    for (let k = 0; k < reg.length; k++) {
      const j = reg[k], x = j % N, y = (j / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
        const q = yy * N + xx; if (a[q] === 1) bl = 1; else if (a[q] === 2) wh = 1; else if (!seen[q]) { seen[q] = 1; reg.push(q); }
      }
    }
    const own = bl && !wh ? 1 : wh && !bl ? 2 : 0;
    for (const j of reg) terr[j] = own;
    if (own === 1) bs += reg.length; else if (own === 2) ws += reg.length;
  }
  return {bs, ws, terr};
}
const fmt = v => (Math.round(v * 2) / 2).toString();

BX.register({
  id: 'go', title: '围棋', cat: 'heavy', order: 1, sub: '黑白围地，数子定胜负',
  desc: '中国规则围棋：黑先白后，围空吃子，终局数子并贴目。支持 19/13/9 路，终局自动判断死活，双方确认后出结果。电脑采用蒙特卡洛树搜索。',
  kind: 'turn', seats: 2, seatNames: ['黑方', '白方'], seatColors: ['#1c1a18', '#ece8df'], firstLabel: '执子',
  options: [
    {key: 'size', label: '棋盘', choices: [[19, '19路'], [13, '13路'], [9, '9路']], def: 19},
    {key: 'komi', label: '贴目', choices: [[7.5, '7.5目'], [6.5, '6.5目'], [0.5, '0.5目']], def: 7.5},
  ],
  rules: `<p><b>棋具</b>：19×19（亦可选 13 路、9 路）棋盘，黑白两色棋子。<b>黑先白后</b>，轮流在交叉点上落一子，落下后不再移动。</p>
<p><b>气与提子</b>：一块棋（上下左右相连的同色棋子）相邻的空交叉点叫“气”。落子后使对方棋块没有气，就把这些子提走。</p>
<p><b>禁着点</b>：落子后自己的棋块没有气、且不能提掉对方棋子的位置不能下（禁止自杀）。</p>
<p><b>打劫</b>：本版采用<b>全局同形禁止</b>（位置超级劫）——任何一手棋都不能使全盘局面与之前出现过的局面完全相同。普通“劫”因此需要先在别处“找劫材”。</p>
<p><b>停一手</b>：轮到自己时可以选择“停一手”（虚着）。<b>双方连续停一手</b>即进入终局数子。</p>
<p><b>数子（中国规则）</b>：去掉双方认定的死子后，每方的得分 = 盘上活子数 + 自己围住的空点数；双方都相邻的空点（单官、双活）不计。黑方再<b>贴还 7.5 目</b>（可在开局选项里改）。得分高者胜，结果以“黑胜 / 白胜 X 目”表示。</p>
<p><b>判断死活</b>：进入数子后电脑会自动估计死子（半透明并打叉），双方可点击棋块切换死活；双方都按“确认结果”后结束。若有争议，可点“继续对局”把棋下完。</p>
<p><b>认输</b>：轮到自己时可以随时认输（中盘负）。</p>
<p><b>操作</b>：鼠标直接点击落子；触屏第一次点击预览落点（出现十字准线），再点同一点确认。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 19, base: '#dcb06a'});
    const s = h / 7; g.strokeStyle = 'rgba(50,30,10,.65)'; g.lineWidth = 1;
    for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * s + s * .5, 0); g.lineTo(i * s + s * .5, h); g.stroke(); }
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * s + s * .5); g.lineTo(w, i * s + s * .5); g.stroke(); }
    g.fillStyle = 'rgba(50,30,10,.85)'; D.circle(g, 3 * s + s * .5, 3 * s + s * .5, s * .1); g.fill();
    const pts = [[2, 2, 0], [3, 2, 1], [3, 3, 0], [4, 3, 1], [2, 4, 0], [4, 2, 1], [3, 4, 0], [5, 3, 1], [4, 4, 1], [2, 3, 0], [5, 1, 0], [1, 3, 1]];
    for (const [x, y, wt] of pts) D.stone(g, x * s + s * .5, y * s + s * .5, s * .46, !!wt);
    g.fillStyle = C.red; D.circle(g, 5 * s + s * .5, 1 * s + s * .5, s * .12); g.fill();
    // a bowl of white stones (棋罐)
    const bx = w * .8, by = h * .74, br = h * .26;
    g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(bx + 3, by + 6, br, br * .62, 0, 0, Math.PI * 2); g.fill(); g.restore();
    const gr = g.createLinearGradient(bx - br, by - br, bx + br, by + br); gr.addColorStop(0, '#8a5a2e'); gr.addColorStop(1, '#4a2a12');
    g.fillStyle = gr; g.beginPath(); g.ellipse(bx, by, br, br * .62, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a170a'; g.beginPath(); g.ellipse(bx, by - br * .08, br * .8, br * .45, 0, 0, Math.PI * 2); g.fill();
    for (const [dx, dy] of [[-.4, -.1], [0, -.18], [.38, -.08], [-.15, .08], [.2, .1]]) D.stone(g, bx + dx * br, by + dy * br, br * .2, true);
  },
  create(ctx) {
    const N = +ctx.opts.size || 19, KOMI = ctx.opts.komi != null ? +ctx.opts.komi : 7.5;
    const st = {N, komi: KOMI, b: new Array(N * N).fill(0), turn: 0, last: -1, ko: -1, passes: 0, caps: [0, 0], moves: 0,
      h: [0, 0], hh: [0], ph: 'play', dead: null, acc: [false, false], res: null, lastPass: -1};
    const gEng = makeEng(N);
    const cv = ctx.canvas();
    let hover = -1, preview = -1, drop = {i: -1, t: 1}, fades = [], passFx = null, passArm = 0, thinkT = 0;

    /* ---------- rules ---------- */
    function tryMove(i) {
      if (i < 0 || i >= N * N || st.b[i] || st.ph !== 'play') return null;
      const E = gEng; E.load(st.b); const c = st.turn + 1, p = E.fromI(i);
      if (!E.legal(p, c)) return null;
      E.play(p, c);
      let h1 = st.h[0] ^ Z(c, i, 0), h2 = st.h[1] ^ Z(c, i, 1);
      const caps = E.caps.map(E.toI);
      for (const j of caps) { h1 ^= Z(3 - c, j, 0); h2 ^= Z(3 - c, j, 1); }
      const h = [h1 >>> 0, h2 >>> 0], key = keyOf(h);
      if (st.hh.indexOf(key) >= 0) return null;
      return {caps, ko: E.ko >= 0 ? E.toI(E.ko) : -1, h, key};
    }
    const whyIllegal = i => {
      if (st.b[i]) return '这里已有棋子';
      const E = gEng; E.load(st.b);
      return E.legal(E.fromI(i), st.turn + 1) ? '全局同形（打劫），请先在别处找劫材' : '禁着点：不能自杀';
    };
    function finalCount() { return areaCount(st.b, N, st.dead); }
    function finish() {
      const {bs, ws} = finalCount(), diff = bs - ws - KOMI;
      const w = diff > 0 ? 0 : 1;
      st.res = {w, diff: Math.abs(diff), bs, ws}; st.ph = 'over';
      const text = (w === 0 ? '黑胜 ' : '白胜 ') + fmt(Math.abs(diff)) + ' 目（黑 ' + bs + ' 子，白 ' + ws + ' 子，贴 ' + KOMI + ' 目）';
      ctx.end({winner: w, text});
    }

    /* ---------- layout ---------- */
    const bottomSeat = () => ctx.mySeats.length === 1 ? ctx.mySeats[0] : 0;
    function layout() {
      const w = cv.w, h = cv.h, port = h > w * 1.08;
      if (port) {
        const ph = 56; const B = Math.max(120, Math.min(w - 8, h - 2 * ph - 20));
        const y0 = Math.max(4, (h - (B + 2 * ph + 12)) / 2), pw = Math.min(B, 520), px = (w - pw) / 2;
        return {port, B, bx: (w - B) / 2, by: y0 + ph + 6, top: {x: px, y: y0, w: pw, h: ph - 4}, bot: {x: px, y: y0 + ph + 12 + B, w: pw, h: ph - 4}, btn: 'row'};
      }
      const PW = BX.clamp(w * .26, 150, 250); const B = Math.max(120, Math.min(h - 10, w - PW - 28));
      const tot = B + 16 + PW, x0 = (w - tot) / 2, by = (h - B) / 2, px = x0 + B + 16;
      const ph = Math.min(96, (B - 120) / 2);
      return {port, B, bx: x0, by, top: {x: px, y: by, w: PW, h: ph}, bot: {x: px, y: by + B - ph, w: PW, h: ph}, mid: {x: px, y: by + ph + 8, w: PW, h: B - 2 * ph - 16}};
    }
    function geo(L = layout()) {
      const coords = L.B / (N + 1) >= 21, mf = coords ? 1.05 : .72;
      const cell = L.B / (N - 1 + 2 * mf);
      return {cell, ox: L.bx + cell * mf, oy: L.by + cell * mf, coords};
    }
    const cellAt = p => { const {cell, ox, oy} = geo(); const x = Math.round((p.x - ox) / cell), y = Math.round((p.y - oy) / cell); return x >= 0 && y >= 0 && x < N && y < N && Math.abs(p.x - ox - x * cell) < cell * .62 && Math.abs(p.y - oy - y * cell) < cell * .62 ? y * N + x : -1; };

    /* ---------- DOM buttons ---------- */
    const ui = ctx.ui();
    const box = BX.h('div', {style: {position: 'absolute', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto'}});
    ui.append(box);
    const mk = (txt, cls, fn) => { const b = BX.h('button', {class: 'bx-btn ' + cls, text: txt, on: {click: fn}}); b.style.minWidth = '84px'; b.style.padding = '8px 12px'; box.append(b); return b; };
    const actSeat = () => { for (const s of ctx.turn) if (ctx.canAct(s)) return s; return -1; };
    const bPass = mk('停一手', 'ghost', () => {
      const s = actSeat(); if (s < 0 || st.ph !== 'play') return;
      if (passArm < performance.now()) { passArm = performance.now() + 2500; bPass.textContent = '确认停一手'; ctx.sfx('tick'); setTimeout(() => { bPass.textContent = '停一手'; }, 2500); return; }
      passArm = 0; bPass.textContent = '停一手'; preview = -1; ctx.act({t: 'pass'}, s);
    });
    const bResign = mk('认输', 'ghost', async () => {
      const s = actSeat(); if (s < 0 || st.ph !== 'play') return;
      if (!(await BX.confirm('确定要认输吗？', '认输'))) return;
      if (ctx.canAct(s) && st.ph === 'play') ctx.act({t: 'resign'}, s);
    });
    const bOk = mk('确认结果', 'red', () => { const s = actSeat(); if (s >= 0 && st.ph === 'score' && st.dead) ctx.act({t: 'ok'}, s); });
    const bResume = mk('继续对局', 'ghost', () => { const s = actSeat(); if (s >= 0 && st.ph === 'score' && st.dead) ctx.act({t: 'resume'}, s); });
    let boxKey = '';
    function placeBox(L) {
      const sc = st.ph === 'score';
      const show = (b, v) => { b.style.display = v ? '' : 'none'; };
      show(bPass, !sc && st.ph === 'play'); show(bResign, !sc && st.ph === 'play'); show(bOk, sc); show(bResume, sc);
      const mine = actSeat() >= 0;
      bPass.disabled = bResign.disabled = !mine; bOk.disabled = bResume.disabled = !mine || !st.dead;
      if (sc && ctx.hotseat) { const s = actSeat(); bOk.textContent = s >= 0 ? (s ? '白方确认' : '黑方确认') : '确认结果'; } else bOk.textContent = '确认结果';
      let r;
      if (L.port) { const b = L.bot; r = {x: b.x + b.w * .42, y: b.y, w: b.w * .58, h: b.h, dir: 'row'}; }
      else { const m = L.mid; r = {x: m.x, y: m.y, w: m.w, h: m.h, dir: 'column'}; }
      const k = [r.x, r.y, r.w, r.h, r.dir].map(v => typeof v === 'number' ? Math.round(v) : v).join(',');
      if (k !== boxKey) {
        boxKey = k; Object.assign(box.style, {left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', flexDirection: r.dir, justifyContent: r.dir === 'row' ? 'flex-end' : 'center'});
        for (const b of [bPass, bResign, bOk, bResume]) { b.style.minWidth = r.dir === 'row' ? '0' : '120px'; b.style.flex = r.dir === 'row' ? '0 1 auto' : 'none'; b.style.fontSize = r.w < 220 && r.dir === 'row' ? '14px' : '15px'; }
      }
    }

    /* ---------- input ---------- */
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = cellAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      const i = cellAt(cv.pos(e)); if (i < 0) { preview = -1; return; }
      if (st.ph === 'score') {
        const s = actSeat(); if (s < 0 || !st.dead || !st.b[i]) return;
        ctx.act({t: 'tog', i}, s); return;
      }
      if (st.ph !== 'play' || !ctx.canAct(st.turn)) return;
      if (st.b[i]) return;
      if (e.pointerType !== 'mouse' && preview !== i) { preview = i; ctx.sfx('tick'); return; }
      if (!tryMove(i)) { ctx.sfx('error'); ctx.toast(whyIllegal(i)); preview = -1; return; }
      preview = -1; ctx.act({t: 'p', i}, st.turn);
    });

    /* ---------- status ---------- */
    const touch = BX.TOUCH.matches;
    function status() {
      ctx.info(0, '提' + st.caps[0]); ctx.info(1, '提' + st.caps[1]);
      if (st.ph === 'over') { const r = st.res; return ctx.status(r.resign != null ? ctx.name(r.resign) + ' 认输' : (r.w ? '白胜 ' : '黑胜 ') + fmt(r.diff) + ' 目'); }
      if (st.ph === 'score') {
        if (!st.dead) return ctx.status('双方停一手，正在判断死活…');
        const {bs, ws} = finalCount(), d = bs - ws - KOMI;
        return ctx.status('黑 ' + bs + ' · 白 ' + ws + '+' + KOMI + ' → ' + (d > 0 ? '黑' : '白') + '胜 ' + fmt(Math.abs(d)) + ' 目 · 点棋块改死活');
      }
      const pre = st.passes === 1 ? '对方停了一手 · ' : '';
      if (ctx.canAct(st.turn)) ctx.status(pre + (ctx.hotseat ? ctx.name(st.turn) + '落子' : '轮到你落子') + (touch ? '（点两下确认）' : ''));
      else ctx.status(pre + (ctx.isAI(st.turn) ? ctx.name(st.turn) + ' 思考中…' : '等待 ' + ctx.name(st.turn) + ' 落子…'));
    }

    /* ---------- AI ---------- */
    async function aiMove(seat, level) {
      if (st.ph === 'score') return {t: 'ok'};
      const c = seat + 1, sgn = c === 1 ? 1 : -1, L0 = ctx.log.length;
      const ms = BX.test ? (level >= 3 ? 40 : 28) : [0, 90, 320, 700][level] * (N === 9 ? .8 : 1);
      const okCache = new Map();
      const ok = p => { const i = gEng.toI(p); if (!okCache.has(i)) okCache.set(i, !!tryMove(i)); return okCache.get(i); };
      // gEng is reused by tryMove; compute the root filter from a separate index space
      const r = await search({N, b: st.b.slice(), c, ko: st.ko, last: st.last, komi: KOMI, ms, min: BX.test ? 8 : 24, ok: p => ok(p), stale: () => ctx.log.length !== L0});
      if (ctx.log.length !== L0 || st.ph !== 'play') return null;
      const own = r.own; let est = -KOMI; for (let i = 0; i < own.length; i++) est += own[i];
      const myEst = sgn * est;
      if (!r.kids.length) return {t: 'pass'};
      if (level >= 2 && st.moves > N * N / 3 && r.wr < .1 && myEst < -Math.max(10, N * N / 12)) return {t: 'resign'};
      if (st.moves > N * N * 2) return {t: 'pass'};
      if (BX.test && st.moves > N * N * (N === 19 ? .62 : .8)) return {t: 'pass'};
      if (st.passes === 1 && myEst > .5) return {t: 'pass'};
      const thr = level >= 3 ? .9 : .82;
      const useful = r.kids.filter(k => k.tac || Math.abs(own[k.i]) < thr);
      if (!useful.length) return {t: 'pass'};
      let m;
      if (level === 1) {
        const sc = useful.map(k => [k.i, k.pv + Math.random() * .4 + (k.tac ? .1 : 0)]);
        m = BX.ai.byLevel(sc, 2);
      } else {
        m = r.move;
        if (!(useful.some(k => k.i === m))) { useful.sort((a, b) => b.v - a.v || b.q - a.q); m = useful[0].i; }
      }
      if (!tryMove(m)) { const alt = useful.find(k => tryMove(k.i)); if (!alt) return {t: 'pass'}; m = alt.i; }
      return {t: 'p', i: m};
    }

    const inst = {
      st,
      toMove() {
        if (st.ph === 'play') return st.turn;
        if (st.ph === 'score') return st.dead ? [0, 1].filter(s => !st.acc[s]) : null;
        return null;
      },
      valid(a, by) {
        if (!a || typeof a !== 'object') return false;
        if (a.t === 'p') return st.ph === 'play' && by === st.turn && Number.isInteger(a.i) && !!tryMove(a.i);
        if (a.t === 'pass' || a.t === 'resign') return st.ph === 'play' && by === st.turn;
        if (a.t === 'tog') return st.ph === 'score' && !!st.dead && Number.isInteger(a.i) && a.i >= 0 && a.i < N * N && !!st.b[a.i];
        if (a.t === 'ok' || a.t === 'resume') return st.ph === 'score' && !!st.dead;
        return false;
      },
      sysMove() {
        if (st.ph !== 'score' || st.dead) return null;
        const own = ownership(st.b, N, st.turn + 1, st.ko, BX.test ? 40 : N === 19 ? 320 : 600);
        const d = [], seen = new Uint8Array(N * N);
        for (let i = 0; i < N * N; i++) {
          if (!st.b[i] || seen[i]) continue;
          const g = groupOf(st.b, N, i), sg = st.b[i] === 1 ? 1 : -1; let s = 0;
          for (const j of g) { seen[j] = 1; s += own[j] * sg; }
          if (s / g.length < -.25) for (const j of g) d.push(j);
        }
        d.sort((a, b) => a - b);
        return {a: {t: 'dead', d}, delay: 350};
      },
      apply(a, by) {
        preview = -1;
        if (a.t === 'p') {
          const r = tryMove(a.i); if (!r) return;
          const c = st.turn + 1; st.b[a.i] = c;
          for (const j of r.caps) st.b[j] = 0;
          st.caps[st.turn] += r.caps.length; st.h = r.h; st.hh.push(r.key); st.ko = r.ko; st.last = a.i;
          st.passes = 0; st.moves++; st.turn ^= 1;
          if (!ctx.fast) {
            drop = {i: a.i, t: 0}; ctx.anim(170, k => drop.t = k, null, BX.ease.out);
            if (r.caps.length) {
              const f = {list: r.caps, col: 3 - c, t: 0}; fades.push(f);
              ctx.anim(420, k => f.t = k, () => fades.splice(fades.indexOf(f), 1));
              ctx.after(90, () => ctx.sfx('capture'));
            }
          }
          ctx.sfx('stone');
        } else if (a.t === 'pass') {
          st.passes++; st.moves++; st.last = -1; st.ko = -1; st.lastPass = st.turn;
          if (!ctx.fast) { const f = {s: st.turn, t: 0}; passFx = f; ctx.anim(1300, k => f.t = k, () => { if (passFx === f) passFx = null; }, k => k); }
          ctx.sfx('whoosh');
          st.turn ^= 1;
          if (st.passes >= 2) { st.ph = 'score'; st.dead = null; st.acc = [false, false]; ctx.sfx('bell'); }
        } else if (a.t === 'resign') {
          st.ph = 'over'; st.res = {w: 1 - by, resign: by};
          status(); ctx.end({winner: 1 - by, text: ctx.name(by) + ' 认输，' + (by ? '黑' : '白') + '中盘胜'}); return;
        } else if (a.t === 'dead') {
          st.dead = new Array(N * N).fill(0); for (const j of a.d) st.dead[j] = 1; st.acc = [false, false];
        } else if (a.t === 'tog') {
          if (!st.dead || !st.b[a.i]) return;
          const g = groupOf(st.b, N, a.i), v = st.dead[a.i] ? 0 : 1;
          for (const j of g) st.dead[j] = v; st.acc = [false, false]; ctx.sfx('click');
        } else if (a.t === 'ok') {
          st.acc[by] = true; ctx.sfx('select');
          if (st.acc[0] && st.acc[1]) { finish(); status(); return; }
        } else if (a.t === 'resume') {
          st.ph = 'play'; st.passes = 0; st.dead = null; st.acc = [false, false]; ctx.sfx('start');
        }
        status();
      },
      aiMove,
      onTurn() { status(); },
      frame(dt) {
        const g = cv.g; cv.clear(); thinkT += dt;
        const L = layout(), {cell, ox, oy, coords} = geo(L), R = cell * .47;
        const px = x => ox + x * cell, py = y => oy + y * cell;
        placeBox(L);
        // board
        g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = '#c99a55'; D.rr(g, L.bx, L.by, L.B, L.B, 8); g.fill(); g.restore();
        D.wood(g, L.bx, L.by, L.B, L.B, {r: 8, seed: 23, base: '#ddb36e', dark: '#a8763c', grain: .14});
        g.strokeStyle = 'rgba(90,55,20,.5)'; g.lineWidth = 1.5; D.rr(g, L.bx + .75, L.by + .75, L.B - 1.5, L.B - 1.5, 8); g.stroke();
        g.strokeStyle = 'rgba(40,24,8,.8)'; g.lineWidth = Math.max(.8, cell * .035);
        g.beginPath(); for (let i = 0; i < N; i++) { g.moveTo(px(i), py(0)); g.lineTo(px(i), py(N - 1)); g.moveTo(px(0), py(i)); g.lineTo(px(N - 1), py(i)); } g.stroke();
        g.lineWidth = Math.max(1.4, cell * .07); g.strokeRect(px(0), py(0), (N - 1) * cell, (N - 1) * cell);
        g.fillStyle = 'rgba(40,24,8,.9)'; for (const x of STAR[N]) for (const y of STAR[N]) { D.circle(g, px(x), py(y), Math.max(2, cell * .1)); g.fill(); }
        if (coords) {
          const fs = Math.min(14, cell * .36), off = cell * .72;
          for (let i = 0; i < N; i++) {
            D.text(g, LETTERS[i], px(i), py(0) - off, {size: fs, color: 'rgba(60,35,12,.75)', weight: 600});
            D.text(g, LETTERS[i], px(i), py(N - 1) + off, {size: fs, color: 'rgba(60,35,12,.75)', weight: 600});
            D.text(g, String(N - i), px(0) - off, py(i), {size: fs, color: 'rgba(60,35,12,.75)', weight: 600});
            D.text(g, String(N - i), px(N - 1) + off, py(i), {size: fs, color: 'rgba(60,35,12,.75)', weight: 600});
          }
        }
        // crosshair for touch preview
        const myT = st.ph === 'play' && ctx.canAct(st.turn);
        if (preview >= 0 && myT && !st.b[preview]) {
          const x = preview % N, y = (preview / N) | 0;
          g.strokeStyle = 'rgba(178,58,43,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(px(0), py(y)); g.lineTo(px(N - 1), py(y)); g.moveTo(px(x), py(0)); g.lineTo(px(x), py(N - 1)); g.stroke();
        }
        // stones
        const sc = st.ph === 'score' || st.ph === 'over';
        const cnt = sc && st.dead ? finalCount() : null;
        for (let i = 0; i < N * N; i++) {
          const v = st.b[i]; if (!v) continue;
          const x = px(i % N), y = py((i / N) | 0);
          const s = i === drop.i ? .55 + .45 * drop.t : 1;
          const dead = sc && st.dead && st.dead[i];
          if (dead) g.globalAlpha = .42;
          if (i === drop.i && drop.t < 1) g.globalAlpha = .4 + .6 * drop.t;
          D.stone(g, x, y, R * s, v === 2);
          g.globalAlpha = 1;
          if (dead) { g.strokeStyle = C.red; g.lineWidth = Math.max(1.5, cell * .08); const q = cell * .18; g.beginPath(); g.moveTo(x - q, y - q); g.lineTo(x + q, y + q); g.moveTo(x + q, y - q); g.lineTo(x - q, y + q); g.stroke(); }
        }
        for (const f of fades) for (const j of f.list) {
          g.globalAlpha = Math.max(0, 1 - f.t); D.stone(g, px(j % N), py((j / N) | 0), R * (1 + .35 * f.t), f.col === 2); g.globalAlpha = 1;
        }
        // territory
        if (cnt) {
          const q = cell * .34;
          for (let i = 0; i < N * N; i++) {
            const o = cnt.terr[i]; if (!o || (st.b[i] && !st.dead[i])) continue;
            const x = px(i % N), y = py((i / N) | 0);
            g.fillStyle = o === 1 ? 'rgba(20,16,12,.85)' : 'rgba(250,246,236,.95)'; g.strokeStyle = o === 1 ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.35)'; g.lineWidth = 1;
            g.fillRect(x - q / 2, y - q / 2, q, q); g.strokeRect(x - q / 2, y - q / 2, q, q);
          }
        }
        // last move / ko
        if (st.last >= 0 && st.b[st.last]) {
          const x = px(st.last % N), y = py((st.last / N) | 0);
          g.strokeStyle = st.b[st.last] === 1 ? '#f0d9a0' : C.red; g.lineWidth = Math.max(1.5, cell * .08); D.circle(g, x, y, R * .45); g.stroke();
        }
        if (st.ko >= 0 && st.ph === 'play') { const x = px(st.ko % N), y = py((st.ko / N) | 0), q = cell * .3; g.strokeStyle = C.red; g.lineWidth = 2; g.strokeRect(x - q / 2, y - q / 2, q, q); }
        // ghost
        const ghost = preview >= 0 ? preview : hover;
        if (ghost >= 0 && myT && !st.b[ghost]) { g.globalAlpha = preview >= 0 ? .78 : .45; D.stone(g, px(ghost % N), py((ghost / N) | 0), R, st.turn === 1); g.globalAlpha = 1; }
        // pass banner
        if (passFx) {
          const k = passFx.t, a = k < .15 ? k / .15 : k > .75 ? (1 - k) / .25 : 1;
          g.globalAlpha = a; const bw = Math.min(L.B * .7, 260), bh = Math.min(64, L.B * .16), cx = L.bx + L.B / 2, cy = L.by + L.B / 2;
          D.paper(g, cx - bw / 2, cy - bh / 2, bw, bh, {r: 12}); g.strokeStyle = C.red; g.lineWidth = 2; D.rr(g, cx - bw / 2 + 4, cy - bh / 2 + 4, bw - 8, bh - 8, 9); g.stroke();
          D.text(g, (passFx.s ? '白方' : '黑方') + ' 停一手', cx, cy, {size: bh * .42, color: C.ink, font: 'deco', weight: 400});
          g.globalAlpha = 1;
        }
        // player panels
        const bs = bottomSeat();
        panel(g, L.top, 1 - bs, L, cnt); panel(g, L.bot, bs, L, cnt);
      },
    };
    function panel(g, r, s, L, cnt) {
      const turn = ctx.turn.includes(s) && !ctx.ended && st.ph === 'play';
      const w = L.port ? r.w * (r === L.bot ? .42 : 1) : r.w;
      g.save();
      if (turn) { g.shadowColor = 'rgba(230,197,125,.8)'; g.shadowBlur = 14; }
      D.paper(g, r.x, r.y, w, r.h, {r: 12}); g.restore();
      g.strokeStyle = turn ? C.gold2 : 'rgba(120,90,50,.45)'; g.lineWidth = turn ? 2.5 : 1; D.rr(g, r.x + 1, r.y + 1, w - 2, r.h - 2, 11); g.stroke();
      const sr = Math.min(r.h * .3, 18), cx = r.x + 10 + sr, cy = r.y + r.h / 2;
      D.stone(g, cx, cy, sr, s === 1);
      const nx = cx + sr + 8, maxW = w - (nx - r.x) - 8;
      let sub = '提子 ' + st.caps[s];
      if (cnt) sub = (s ? cnt.ws + ' 子 +' + KOMI : cnt.bs + ' 子') + (st.ph === 'score' ? (st.acc[s] ? ' · 已确认' : '') : '');
      else if (turn && ctx.isAI(s)) sub = '思考中' + '.'.repeat(1 + ((thinkT * 3) | 0) % 3);
      const big = r.h > 70;
      D.text(g, ctx.name(s), nx, cy - (big ? 12 : 9), {size: big ? 17 : 14, align: 'left', color: C.ink, weight: 700, maxW, font: 'serif'});
      D.text(g, sub, nx, cy + (big ? 13 : 10), {size: big ? 14 : 12, align: 'left', color: turn ? C.red : C.ink2, weight: 600, maxW});
    }
    status();
    return inst;
  },
});
