/* 中国象棋 — 完整规则 + alpha-beta 引擎 */
const D = BX.draw, C = BX.C, L = BX.data.cls;
const K = 1, A = 2, B = 3, N = 4, R = 5, CN = 6, P = 7;
const ROW = [], COL = [];
for (let i = 0; i < 90; i++) { ROW[i] = Math.floor(i / 9); COL[i] = i % 9; }
const SQ = (r, c) => r * 9 + c;
const onB = (r, c) => r >= 0 && r < 10 && c >= 0 && c < 9;
const inPal = (r, c) => c >= 3 && c <= 5 && (r <= 2 || r >= 7);
/* ---------- precomputed move tables ---------- */
const KM = [], AM = [], BM = [], NM = [], NATK = [], PM = [[], []], RAY = [];
for (let s = 0; s < 90; s++) {
  const r = ROW[s], c = COL[s];
  KM[s] = []; AM[s] = []; BM[s] = []; NM[s] = []; NATK[s] = []; PM[0][s] = []; PM[1][s] = []; RAY[s] = [[], [], [], []];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (onB(r + dr, c + dc) && inPal(r + dr, c + dc) && inPal(r, c) && (r + dr <= 2) === (r <= 2)) KM[s].push(SQ(r + dr, c + dc));
  for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    if (onB(r + dr, c + dc) && inPal(r + dr, c + dc) && inPal(r, c) && (r + dr <= 2) === (r <= 2)) AM[s].push(SQ(r + dr, c + dc));
    const tr = r + 2 * dr, tc = c + 2 * dc;
    if (onB(tr, tc) && (tr <= 4) === (r <= 4)) BM[s].push([SQ(tr, tc), SQ(r + dr, c + dc)]);
  }
  for (const [dr, dc] of [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]]) {
    const tr = r + dr, tc = c + dc; if (!onB(tr, tc)) continue;
    const leg = Math.abs(dr) === 2 ? SQ(r + dr / 2, c) : SQ(r, c + dc / 2);
    NM[s].push([SQ(tr, tc), leg]);
  }
  if (r > 0) PM[0][s].push(SQ(r - 1, c));
  if (r <= 4) { if (c > 0) PM[0][s].push(s - 1); if (c < 8) PM[0][s].push(s + 1); }
  if (r < 9) PM[1][s].push(SQ(r + 1, c));
  if (r >= 5) { if (c > 0) PM[1][s].push(s - 1); if (c < 8) PM[1][s].push(s + 1); }
  for (let k = r - 1; k >= 0; k--) RAY[s][0].push(SQ(k, c));
  for (let k = r + 1; k < 10; k++) RAY[s][1].push(SQ(k, c));
  for (let k = c - 1; k >= 0; k--) RAY[s][2].push(SQ(r, k));
  for (let k = c + 1; k < 9; k++) RAY[s][3].push(SQ(r, k));
}
for (let s = 0; s < 90; s++) for (const [t, leg] of NM[s]) NATK[t].push([s, leg]);
/* ---------- evaluation tables (red's view; row 0 = enemy base line) ---------- */
const VAL = [0, 0, 80, 80, 360, 800, 380, 40], OVAL = [0, 3000, 80, 80, 360, 800, 380, 40];
const T = rows => rows.flat();
const PST = [null,
  T([[0, 0, 0, -8, -10, -8, 0, 0, 0], [0, 0, 0, -8, -8, -8, 0, 0, 0], [0, 0, 0, -8, -8, -8, 0, 0, 0], [], [], [], [], [0, 0, 0, -6, -6, -6, 0, 0, 0], [0, 0, 0, -3, -2, -3, 0, 0, 0], [0, 0, 0, 0, 4, 0, 0, 0, 0]].map(r => r.length ? r : Array(9).fill(0))),
  T([[...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 6, 0, 0, 0, 0], [0, 0, 0, 2, 0, 2, 0, 0, 0]]),
  T([[...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)], [0, 0, -2, 0, 0, 0, -2, 0, 0], [...Array(9).fill(0)], [-2, 0, 0, 0, 6, 0, 0, 0, -2], [...Array(9).fill(0)], [0, 0, 2, 0, 0, 0, 2, 0, 0]]),
  T([[4, 8, 16, 12, 4, 12, 16, 8, 4], [4, 10, 28, 16, 8, 16, 28, 10, 4], [12, 14, 16, 20, 18, 20, 16, 14, 12], [8, 24, 18, 24, 20, 24, 18, 24, 8], [6, 16, 14, 18, 16, 18, 14, 16, 6], [4, 12, 16, 14, 12, 14, 16, 12, 4], [2, 6, 8, 6, 10, 6, 8, 6, 2], [4, 2, 8, 8, 4, 8, 8, 2, 4], [0, 2, 4, 4, -2, 4, 4, 2, 0], [0, -4, 0, 0, 0, 0, 0, -4, 0]]),
  T([[14, 14, 12, 18, 16, 18, 12, 14, 14], [16, 20, 18, 24, 26, 24, 18, 20, 16], [12, 12, 12, 18, 18, 18, 12, 12, 12], [12, 18, 16, 22, 22, 22, 16, 18, 12], [12, 14, 12, 18, 18, 18, 12, 14, 12], [12, 16, 14, 20, 20, 20, 14, 16, 12], [6, 10, 8, 14, 14, 14, 8, 10, 6], [4, 8, 6, 14, 12, 14, 6, 8, 4], [8, 4, 8, 16, 8, 16, 8, 4, 8], [-2, 10, 6, 14, 12, 14, 6, 10, -2]]),
  T([[6, 4, 0, -10, -12, -10, 0, 4, 6], [2, 2, 0, -4, -14, -4, 0, 2, 2], [2, 2, 0, -10, -8, -10, 0, 2, 2], [0, 0, -2, 4, 10, 4, -2, 0, 0], [0, 0, 0, 2, 8, 2, 0, 0, 0], [-2, 0, 4, 2, 6, 2, 4, 0, -2], [0, 0, 0, 2, 4, 2, 0, 0, 0], [4, 0, 8, 6, 10, 6, 8, 0, 4], [0, 2, 4, 6, 6, 6, 4, 2, 0], [0, 0, 2, 6, 6, 6, 2, 0, 0]]),
  T([[0, 3, 6, 9, 12, 9, 6, 3, 0], [18, 36, 56, 80, 120, 80, 56, 36, 18], [14, 26, 42, 60, 80, 60, 42, 26, 14], [10, 20, 30, 34, 40, 34, 30, 20, 10], [6, 12, 18, 18, 20, 18, 18, 12, 6], [2, 0, 8, 0, 8, 0, 8, 0, 2], [0, 0, -2, 0, 4, 0, -2, 0, 0], [...Array(9).fill(0)], [...Array(9).fill(0)], [...Array(9).fill(0)]]),
];
const PS = (p, s) => { const t = p & 7; return VAL[t] + PST[t][(p >> 3) ? 89 - s : s]; };
const Z = L.zob(16 * 90 + 2, 90210), SIDE = 16 * 90;
const START = (() => {
  const b = new Array(90).fill(0), back = [R, N, B, A, K, A, B, N, R];
  for (let c = 0; c < 9; c++) { b[SQ(0, c)] = 8 + back[c]; b[SQ(9, c)] = back[c]; }
  for (const c of [1, 7]) { b[SQ(2, c)] = 8 + CN; b[SQ(7, c)] = CN; }
  for (const c of [0, 2, 4, 6, 8]) { b[SQ(3, c)] = 8 + P; b[SQ(6, c)] = P; }
  return b;
})();
/* ---------- engine ---------- */
function Eng(b0, side0) {
  const b = Int8Array.from(b0); let side = side0, h1 = 0, h2 = 0; const sc = [0, 0], kp = [-1, -1], stk = [];
  for (let s = 0; s < 90; s++) { const p = b[s]; if (!p) continue; h1 ^= Z.a[p * 90 + s]; h2 ^= Z.b[p * 90 + s]; sc[p >> 3] += PS(p, s); if ((p & 7) === K) kp[p >> 3] = s; }
  if (side) { h1 ^= Z.a[SIDE]; h2 ^= Z.b[SIDE]; }
  function attacked(s, by) {
    const bR = by * 8 + R, bC = by * 8 + CN, bK = by * 8 + K, bN = by * 8 + N, bP = by * 8 + P, rays = RAY[s];
    for (let d = 0; d < 4; d++) {
      const ray = rays[d]; let i = 0;
      for (; i < ray.length; i++) { const p = b[ray[i]]; if (p) { if (p === bR || (p === bK && d < 2)) return true; break; } }
      for (i++; i < ray.length; i++) { const p = b[ray[i]]; if (p) { if (p === bC) return true; break; } }
    }
    const na = NATK[s];
    for (let i = 0; i < na.length; i++) if (b[na[i][0]] === bN && !b[na[i][1]]) return true;
    const r = ROW[s], c = COL[s];
    if (by === 0) { if (r < 9 && b[s + 9] === bP) return true; if (r <= 4 && ((c > 0 && b[s - 1] === bP) || (c < 8 && b[s + 1] === bP))) return true; }
    else { if (r > 0 && b[s - 9] === bP) return true; if (r >= 5 && ((c > 0 && b[s - 1] === bP) || (c < 8 && b[s + 1] === bP))) return true; }
    return false;
  }
  const E = {
    b, side: () => side,
    hash: () => L.key(h1, h2),
    inCheck: () => attacked(kp[side], side ^ 1),
    evaluate: () => sc[side] - sc[side ^ 1] + 10,
    score(m) { const q = b[m & 127]; return q ? 2000 + OVAL[q & 7] * 16 - OVAL[b[m >> 7] & 7] : 0; },
    moves(capOnly) {
      const out = [], me = side;
      for (let s = 0; s < 90; s++) {
        const p = b[s]; if (!p || (p >> 3) !== me) continue;
        const t = p & 7, base = s * 128;
        const add = to => { const q = b[to]; if (q) { if ((q >> 3) !== me) out.push(base + to); } else if (!capOnly) out.push(base + to); };
        if (t === K) for (const to of KM[s]) add(to);
        else if (t === A) for (const to of AM[s]) add(to);
        else if (t === B) { for (const [to, eye] of BM[s]) if (!b[eye]) add(to); }
        else if (t === N) { for (const [to, leg] of NM[s]) if (!b[leg]) add(to); }
        else if (t === P) for (const to of PM[me][s]) add(to);
        else if (t === R) {
          for (const ray of RAY[s]) for (const to of ray) { const q = b[to]; if (!q) { if (!capOnly) out.push(base + to); } else { if ((q >> 3) !== me) out.push(base + to); break; } }
        } else {
          for (const ray of RAY[s]) {
            let i = 0;
            for (; i < ray.length; i++) { const to = ray[i]; if (b[to]) break; if (!capOnly) out.push(base + to); }
            for (i++; i < ray.length; i++) { const to = ray[i], q = b[to]; if (q) { if ((q >> 3) !== me) out.push(base + to); break; } }
          }
        }
      }
      return out;
    },
    make(m) {
      const f = m >> 7, t = m & 127, p = b[f], q = b[t], s = side;
      stk.push(m, q, h1, h2);
      sc[s] += PS(p, t) - PS(p, f);
      h1 ^= Z.a[p * 90 + f] ^ Z.a[p * 90 + t] ^ Z.a[SIDE]; h2 ^= Z.b[p * 90 + f] ^ Z.b[p * 90 + t] ^ Z.b[SIDE];
      if (q) { sc[s ^ 1] -= PS(q, t); h1 ^= Z.a[q * 90 + t]; h2 ^= Z.b[q * 90 + t]; }
      b[t] = p; b[f] = 0; if ((p & 7) === K) kp[s] = t;
      side ^= 1;
      if (attacked(kp[s], side)) { E.unmake(); return false; }
      return true;
    },
    unmake() {
      h2 = stk.pop(); h1 = stk.pop(); const q = stk.pop(), m = stk.pop();
      const f = m >> 7, t = m & 127, p = b[t];
      side ^= 1; const s = side;
      b[f] = p; b[t] = q; if ((p & 7) === K) kp[s] = f;
      sc[s] -= PS(p, t) - PS(p, f); if (q) sc[s ^ 1] += PS(q, t);
    },
    over: () => null,
    noMove: ply => -(L.MATE - ply),
  };
  return E;
}
const legalMoves = E => E.moves(false).filter(m => { if (!E.make(m)) return false; E.unmake(); return true; });
/* repetition judgement after the latest ply. keys[i] = position after ply i, chk[i] = ply i gave check */
function repJudge(keys, chk) {
  const n = keys.length - 1, k = keys[n]; let cnt = 0, first = -1;
  for (let i = n; i >= 0; i -= 2) if (keys[i] === k) { cnt++; first = i; }
  if (cnt < 3) return null;
  const all = [true, true];
  for (let i = first + 1; i <= n; i++) if (!chk[i]) all[(i - 1) & 1] = false;
  if (all[0] && !all[1]) return {loser: 0};
  if (all[1] && !all[0]) return {loser: 1};
  return {draw: true};
}
const CH = [null, ['帅', '仕', '相', '马', '车', '炮', '兵'], ['将', '士', '象', '马', '车', '炮', '卒']];
const chOf = p => CH[1 + (p >> 3)][(p & 7) - 1];
const RED = '#b5261b', BLK = '#1f1b17';
const colOf = p => (p >> 3) ? BLK : RED;
const BOOK = [[[SQ(7, 7), SQ(7, 4)], [SQ(7, 1), SQ(7, 4)], [SQ(9, 7), SQ(7, 6)], [SQ(9, 6), SQ(7, 4)], [SQ(6, 2), SQ(5, 2)], [SQ(6, 6), SQ(5, 6)]],
  [[SQ(0, 7), SQ(2, 6)], [SQ(0, 1), SQ(2, 2)], [SQ(2, 7), SQ(2, 4)], [SQ(2, 1), SQ(2, 4)], [SQ(3, 6), SQ(4, 6)], [SQ(3, 2), SQ(4, 2)]]];

function drawBoard(g, s, x0, y0) {
  // x0,y0 = screen of point (0,0)
  const m = .62 * s, W = 8 * s + 2 * m, H = 9 * s + 2 * m;
  g.save();
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = s * .5; g.shadowOffsetY = s * .12;
  g.fillStyle = '#5a3418'; D.rr(g, x0 - m - s * .1, y0 - m - s * .1, W + s * .2, H + s * .2, s * .32); g.fill();
  g.restore();
  D.wood(g, x0 - m, y0 - m, W, H, {r: s * .26, base: '#e3b675', dark: '#9a6630', seed: 21, grain: .14});
  const vg = g.createRadialGradient(x0 + 4 * s, y0 + 4.5 * s, s * 2, x0 + 4 * s, y0 + 4.5 * s, s * 7.5);
  vg.addColorStop(0, 'rgba(255,240,200,.18)'); vg.addColorStop(1, 'rgba(80,40,10,.18)');
  g.fillStyle = vg; D.rr(g, x0 - m, y0 - m, W, H, s * .26); g.fill();
  const ink = 'rgba(70,36,12,.88)';
  g.strokeStyle = ink; g.lineWidth = Math.max(2, s * .07); g.strokeRect(x0 - s * .14, y0 - s * .14, 8 * s + s * .28, 9 * s + s * .28);
  g.lineWidth = Math.max(1, s * .032); g.beginPath();
  for (let r = 0; r < 10; r++) { g.moveTo(x0, y0 + r * s); g.lineTo(x0 + 8 * s, y0 + r * s); }
  for (let c = 0; c < 9; c++) {
    if (c === 0 || c === 8) { g.moveTo(x0 + c * s, y0); g.lineTo(x0 + c * s, y0 + 9 * s); }
    else { g.moveTo(x0 + c * s, y0); g.lineTo(x0 + c * s, y0 + 4 * s); g.moveTo(x0 + c * s, y0 + 5 * s); g.lineTo(x0 + c * s, y0 + 9 * s); }
  }
  for (const r0 of [0, 7]) { g.moveTo(x0 + 3 * s, y0 + r0 * s); g.lineTo(x0 + 5 * s, y0 + (r0 + 2) * s); g.moveTo(x0 + 5 * s, y0 + r0 * s); g.lineTo(x0 + 3 * s, y0 + (r0 + 2) * s); }
  g.stroke();
  // position marks
  const mark = (r, c) => {
    const x = x0 + c * s, y = y0 + r * s, d = s * .08, l = s * .2; g.beginPath();
    for (const sx of [-1, 1]) { if ((sx < 0 && c === 0) || (sx > 0 && c === 8)) continue; for (const sy of [-1, 1]) { g.moveTo(x + sx * (d + l), y + sy * d); g.lineTo(x + sx * d, y + sy * d); g.lineTo(x + sx * d, y + sy * (d + l)); } }
    g.stroke();
  };
  for (const [r, c] of [[2, 1], [2, 7], [7, 1], [7, 7]]) mark(r, c);
  for (const c of [0, 2, 4, 6, 8]) { mark(3, c); mark(6, c); }
  // river
  const ry = y0 + 4.5 * s;
  g.fillStyle = 'rgba(90,140,150,.10)'; g.fillRect(x0 + 1, y0 + 4 * s + 1, 8 * s - 2, s - 2);
  D.text(g, '楚  河', x0 + 2 * s, ry, {size: s * .52, color: 'rgba(80,40,14,.72)', font: 'deco', weight: 400});
  D.text(g, '汉  界', x0 + 6 * s, ry, {size: s * .52, color: 'rgba(80,40,14,.72)', font: 'deco', weight: 400});
}

BX.register({
  id: 'xiangqi', title: '中国象棋', cat: 'classic', order: 1, sub: '楚河汉界，将帅对决',
  desc: '最经典的中国棋戏。红先黑后，蹩马腿、塞象眼、炮隔子吃、将帅不照面，一应俱全。电脑三档难度，高级能和你认真拼杀。',
  kind: 'turn', seats: 2, seatNames: ['红方', '黑方'], seatColors: ['#c23a2b', '#2a2420'], firstLabel: '执子',
  rules: `<p><b>棋盘与目标</b>：9 路 × 10 线，中间为「楚河汉界」。红先黑后，轮流走一步。把对方的将（帅）<b>将死</b>即获胜；轮到某方走棋却<b>无子可动（困毙）</b>，该方判负。</p>
<p><b>帅/将</b>：只能在九宫内横竖走一格。双方将帅不能在同一直线上直接照面（中间无子）。<br>
<b>仕/士</b>：只能在九宫内斜走一格。<br>
<b>相/象</b>：斜走「田」字（两格），田字中心有子则不能走（<b>塞象眼</b>），且不能过河。<br>
<b>马</b>：走「日」字，先直后斜；紧挨着马、在前进方向上有子则不能走（<b>蹩马腿</b>）。<br>
<b>车</b>：横竖直走，格数不限，不能越子。<br>
<b>炮</b>：不吃子时与车相同；吃子时必须与目标之间<b>恰好隔一个子</b>（炮架）。<br>
<b>兵/卒</b>：未过河只能向前一步；过河后可向前或左右走一步，永不后退。</p>
<p><b>将军</b>：一方走子后攻击到对方将帅，即为「将军」，对方必须应将。不能走出让自己将帅被吃或与对方将帅照面的棋。</p>
<p><b>和棋与禁着</b>：同一局面重复出现第三次时，若一方在这段循环中<b>每步都在将军（长将）</b>而另一方没有，长将方判负；其余情况判和。连续 <b>60 回合</b>（双方各 60 步）无吃子，判和。</p>
<p><b>操作</b>：点选自己的棋子，绿点为可走位置，红圈为可吃子，再点目标即可。顶栏 ↶ 可悔棋。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#e0b06c', seed: 5});
    const s = h / 5.2, x0 = w / 2 - 2.5 * s, y0 = h * .1;
    g.strokeStyle = 'rgba(70,36,12,.7)'; g.lineWidth = 1.4; g.beginPath();
    for (let r = 0; r < 6; r++) { g.moveTo(x0 - s, y0 + r * s); g.lineTo(x0 + 6 * s, y0 + r * s); }
    for (let c = -1; c <= 6; c++) { g.moveTo(x0 + c * s, y0); g.lineTo(x0 + c * s, y0 + 2 * s); g.moveTo(x0 + c * s, y0 + 3 * s); g.lineTo(x0 + c * s, y0 + 5 * s); }
    g.stroke();
    D.text(g, '楚 河        汉 界', w / 2, y0 + 2.5 * s, {size: s * .55, color: 'rgba(80,40,14,.65)', font: 'deco', weight: 400});
    const pc = [[1, 1, '车', RED], [3, 1, '炮', RED], [2, 4, '帅', RED], [4, 4, '马', RED], [2, 0, '将', BLK], [0, 2, '卒', BLK], [5, 0, '车', BLK]];
    for (const [c, r, ch, col] of pc) D.piece(g, x0 + c * s, y0 + r * s, s * .44, ch, col);
    g.save(); g.translate(w * .8, h * .78); g.rotate(-.12); g.fillStyle = C.red; D.rr(g, -26, -14, 52, 28, 5); g.fill();
    D.text(g, '将军', 0, 1, {size: 17, color: '#fff3e0', font: 'deco', weight: 400}); g.restore();
  },
  create(ctx) {
    const st = {b: START.slice(), turn: 0, ply: 0, keys: [Eng(START, 0).hash()], chk: [0], caps: [[], []], noCap: 0, last: null, over: false, result: null};
    const cv = ctx.canvas();
    let sel = -1, legal = [], anim = null, call = null, pulse = 0;
    const boardImg = L.cache();
    const flip = () => ctx.mySeats.length === 1 && ctx.mySeats[0] === 1;
    function geo() {
      const W = cv.w, H = cv.h, land = W > H * 1.08;
      let s, ox, oy;
      if (land) { const f = BX.fit(W, H, 9.5 + 2 * 4.0, 10.5, 6); s = Math.min(f.s, 82); }
      else { const f = BX.fit(W, H, 9.5, 10.5 + 2 * 1.5, 6); s = Math.min(f.s, 82); }
      ox = Math.round(W / 2 - 4 * s); oy = Math.round(H / 2 - 4.5 * s);
      const m = .72 * s;
      let pl;
      if (land) {
        const pw = Math.min(s * 3.6, (W - 9.5 * s) / 2 - 14), ph = Math.min(s * 4.4, 260);
        pl = [{x: ox - m - 10 - pw, y: oy - .6 * s, w: pw, h: ph, v: true}, {x: ox + 8 * s + m + 10, y: oy + 9.6 * s - ph, w: pw, h: ph, v: true}];
      } else {
        const ph = Math.min(s * 1.15, 58), pw = 8 * s + 2 * m;
        pl = [{x: ox - m, y: oy - m - 8 - ph, w: pw, h: ph}, {x: ox - m, y: oy + 9 * s + m + 8, w: pw, h: ph}];
      }
      return {s, ox, oy, land, pl};
    }
    const scr = (sq, G) => { let r = ROW[sq], c = COL[sq]; if (flip()) { r = 9 - r; c = 8 - c; } return [G.ox + c * G.s, G.oy + r * G.s]; };
    const hit = (p, G) => { let c = Math.round((p.x - G.ox) / G.s), r = Math.round((p.y - G.oy) / G.s); if (!onB(r, c)) return -1; if (Math.hypot(p.x - G.ox - c * G.s, p.y - G.oy - r * G.s) > G.s * .55) return -1; if (flip()) { r = 9 - r; c = 8 - c; } return SQ(r, c); };
    function refreshLegal() { legal = st.over ? [] : legalMoves(Eng(st.b, st.turn)); }
    const inCheckNow = () => !st.over && st.chk[st.chk.length - 1] === 1;
    function status() {
      ctx.info(0, st.caps[0].length ? '吃' + st.caps[0].length : ''); ctx.info(1, st.caps[1].length ? '吃' + st.caps[1].length : '');
      if (st.over) return ctx.status(st.result.text);
      const nm = ctx.name(st.turn), chk = inCheckNow() ? '<b style="color:#ff8a70">（被将军）</b>' : '';
      ctx.status((ctx.canAct(st.turn) ? (ctx.hotseat ? nm + '走棋' : '轮到你走棋') : '等待 ' + nm + ' 走棋…') + chk);
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!ctx.canAct(st.turn) || st.over) return;
      const G = geo(), sq = hit(cv.pos(e), G);
      if (sq < 0) { sel = -1; return; }
      if (sel >= 0 && legal.includes(sel * 128 + sq)) { const f = sel; sel = -1; ctx.act({f, t: sq}, st.turn); return; }
      const p = st.b[sq];
      if (p && (p >> 3) === st.turn) { if (sel === sq) { sel = -1; return; } sel = sq; ctx.sfx('select'); if (!legal.some(m => (m >> 7) === sq)) ctx.toast('这个子现在走不了'); return; }
      if (sel >= 0) ctx.sfx('error');
      sel = -1;
    });
    function finish(winner, text, big) {
      st.over = true; st.result = {winner, text};
      ctx.end({winner, text});
    }
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => a && Number.isInteger(a.f) && Number.isInteger(a.t) && legalMoves(Eng(st.b, st.turn)).includes(a.f * 128 + a.t),
      apply(a) {
        const E = Eng(st.b, st.turn), mover = st.turn, p = st.b[a.f], q = st.b[a.t];
        E.make(a.f * 128 + a.t);
        st.b[a.t] = p; st.b[a.f] = 0; st.turn ^= 1; st.ply++;
        if (q) { st.caps[mover].push(q); st.noCap = 0; } else st.noCap++;
        const chk = E.inCheck() ? 1 : 0;
        st.keys.push(E.hash()); st.chk.push(chk); st.last = [a.f, a.t];
        sel = -1;
        const nLegal = legalMoves(E).length;
        // visuals
        anim = {f: a.f, t: a.t, p, q, k: 0};
        ctx.anim(q ? 260 : 230, k => { if (anim) anim.k = k; }, () => { anim = null; });
        ctx.sfx(q ? 'capture' : 'place');
        const nm = ctx.name(mover);
        if (!nLegal) {
          const txt = chk ? '绝杀' : '困毙';
          call = {t: txt, k: 0, red: true}; ctx.anim(1700, k => { if (call) call.k = k; }, () => call = null, x => x);
          finish(mover, nm + (chk ? ' 绝杀获胜' : ' 困毙对方获胜'));
        } else {
          const rj = repJudge(st.keys, st.chk);
          if (rj && rj.loser != null) finish(1 - rj.loser, ctx.name(rj.loser) + ' 长将，判负');
          else if (rj) finish(-1, '同一局面三次重复，和棋');
          else if (st.noCap >= 120) finish(-1, '六十回合无吃子，和棋');
          else if (chk) {
            call = {t: '将军', k: 0}; ctx.anim(1300, k => { if (call) call.k = k; }, () => call = null, x => x);
            ctx.after(120, () => ctx.sfx('gong'));
          }
        }
        refreshLegal(); status();
      },
      aiMove(seat, level) {
        const E = Eng(st.b, st.turn), all = legalMoves(E);
        if (!all.length) return null;
        const toA = m => ({f: m >> 7, t: m & 127});
        // moves that would lose by perpetual check
        const exclude = new Set();
        const recent = new Set(st.keys.slice(-24));
        for (const m of all) {
          E.make(m); const k = E.hash(), c = E.inCheck() ? 1 : 0;
          const keys = st.keys.concat([k]), chk = st.chk.concat([c]);
          let bad = false; const rj = repJudge(keys, chk);
          if (rj && rj.loser === seat) bad = true;
          else if (c && level >= 2) {   // my check → can the reply complete a repetition that makes me lose (perpetual check)?
            for (const r of E.moves(false)) {
              if (!E.make(r)) continue; const k2 = E.hash();
              if (recent.has(k2)) { const rj2 = repJudge(keys.concat([k2]), chk.concat([E.inCheck() ? 1 : 0])); if (rj2 && rj2.loser === seat) bad = true; }
              E.unmake(); if (bad) break;
            }
          }
          E.unmake();
          if (bad) exclude.add(m);
        }
        if (level >= 2 && st.ply < 2 && Math.random() < .85) {
          const bk = BOOK[seat].map(([f, t]) => f * 128 + t).filter(m => all.includes(m));
          if (bk.length) return toA(bk[Math.floor(Math.random() * bk.length)]);
        }
        const past = new Set(st.keys);
        if (level === 1) {
          const r = L.search(E, {depth: 2, all: true, past, exclude, timeMs: BX.test ? 25 : 300});
          return toA(L.noisy(r.list, 90, .18));
        }
        const r = L.search(E, {timeMs: L.levelTime(level), depth: level === 2 ? 4 : 30, past, exclude});
        return toA(r.move != null ? r.move : all[0]);
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear(); const G = geo(), s = G.s;
        pulse += dt;
        g.drawImage(boardImg(g, cv.w + 'x' + cv.h + ':' + s, cv.w, cv.h, c => drawBoard(c, s, G.ox, G.oy)), 0, 0, cv.w, cv.h);
        // plates
        const bot = flip() ? 1 : 0;
        for (const seat of [0, 1]) {
          const pr = G.pl[seat === bot ? 1 : 0];
          L.plate(g, pr.x, pr.y, pr.w, pr.h, {active: !st.over && st.turn === seat, color: seat ? '#2a2420' : '#c23a2b', title: ctx.name(seat), tag: (seat ? '黑方' : '红方') + (!st.over && st.turn === seat ? ' · 走棋' : ''), vertical: pr.v, items: st.caps[seat], itemR: s * .3,
            drawItem: (g2, x, y, r, it) => D.piece(g2, x, y, r * .92, chOf(it), colOf(it))});
        }
        const R0 = s * .445;
        // last move marks
        if (st.last) {
          const [fx, fy] = scr(st.last[0], G), [tx, ty] = scr(st.last[1], G);
          g.strokeStyle = 'rgba(178,58,43,.55)'; g.lineWidth = Math.max(1.5, s * .05); g.setLineDash([s * .08, s * .08]); D.circle(g, fx, fy, R0 * .7); g.stroke(); g.setLineDash([]);
          g.strokeStyle = '#d9472f'; g.lineWidth = Math.max(2, s * .06); const e = R0 * 1.12, l = R0 * .38;
          g.beginPath(); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.moveTo(tx + sx * e, ty + sy * (e - l)); g.lineTo(tx + sx * e, ty + sy * e); g.lineTo(tx + sx * (e - l), ty + sy * e); } g.stroke();
        }
        // check glow
        if (inCheckNow()) {
          const kq = st.b.indexOf(st.turn * 8 + K);
          if (kq >= 0) { const [kx, ky] = scr(kq, G); const a = .45 + .25 * Math.sin(pulse * 6); const gr = g.createRadialGradient(kx, ky, R0 * .5, kx, ky, R0 * 1.7); gr.addColorStop(0, `rgba(255,60,30,${a})`); gr.addColorStop(1, 'rgba(255,60,30,0)'); g.fillStyle = gr; D.circle(g, kx, ky, R0 * 1.7); g.fill(); }
        }
        // pieces
        for (let i = 0; i < 90; i++) {
          const p = st.b[i]; if (!p) continue;
          if (anim && i === anim.t) continue;
          const [x, y] = scr(i, G);
          if (i === sel) { D.piece(g, x, y - s * .06, R0 * 1.07, chOf(p), colOf(p), {sel: '#ffd76a'}); continue; }
          D.piece(g, x, y, R0, chOf(p), colOf(p));
        }
        if (anim) {
          const [fx, fy] = scr(anim.f, G), [tx, ty] = scr(anim.t, G), k = anim.k;
          if (anim.q && k < .85) { g.globalAlpha = 1 - k / .85; D.piece(g, tx, ty, R0 * (1 - k * .15), chOf(anim.q), colOf(anim.q)); g.globalAlpha = 1; }
          const lift = Math.sin(k * Math.PI) * s * .12;
          D.piece(g, BX.lerp(fx, tx, k), BX.lerp(fy, ty, k) - lift, R0 * (1 + lift / s * .6), chOf(anim.p), colOf(anim.p));
        }
        // legal hints
        if (sel >= 0 && ctx.canAct(st.turn)) {
          for (const m of legal) {
            if ((m >> 7) !== sel) continue;
            const t = m & 127, [x, y] = scr(t, G);
            if (st.b[t]) { g.strokeStyle = 'rgba(220,50,30,.9)'; g.lineWidth = Math.max(2.5, s * .08); D.circle(g, x, y, R0 * 1.06); g.stroke(); }
            else { D.hint(g, x, y, Math.max(6, s * .15), 'rgba(40,140,100,.8)'); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.stroke(); }
          }
        }
        if (call) L.callout(g, G.ox + 4 * s, G.oy + 4.5 * s, s * .95, call.t, call.k);
      },
    };
    refreshLegal(); status();
    return inst;
  },
});
