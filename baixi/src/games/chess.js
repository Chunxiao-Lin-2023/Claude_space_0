/* 国际象棋 — FIDE 规则 + alpha-beta 引擎 */
const D = BX.draw, C = BX.C, L = BX.data.cls;
const PW = 1, KN = 2, BI = 3, RK = 4, QN = 5, KG = 6;
const RW = s => s >> 3, CL = s => s & 7;
const NT = [], KT = [], RAYS = [];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
for (let s = 0; s < 64; s++) {
  const r = RW(s), c = CL(s); NT[s] = []; KT[s] = []; RAYS[s] = [];
  for (const [dr, dc] of [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]]) if (r + dr >= 0 && r + dr < 8 && c + dc >= 0 && c + dc < 8) NT[s].push((r + dr) * 8 + c + dc);
  for (const [dr, dc] of DIRS) {
    if (r + dr >= 0 && r + dr < 8 && c + dc >= 0 && c + dc < 8) KT[s].push((r + dr) * 8 + c + dc);
    const ray = []; for (let k = 1; ; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) break; ray.push(rr * 8 + cc); } RAYS[s].push(ray);
  }
}
const VAL = [0, 100, 320, 330, 500, 900, 0];
const PSTW = [null,
  [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
];
const KEND = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
const mir = (p, s) => (p >> 3) ? s ^ 56 : s;
const PS = (p, s) => VAL[p & 7] + ((p & 7) === KG ? 0 : PSTW[p & 7][mir(p, s)]);
const Z = L.zob(16 * 64 + 26, 6464), ZC = 16 * 64, ZE = ZC + 16, ZS = ZE + 8;
const CMASK = new Array(64).fill(15); CMASK[60] = 12; CMASK[63] = 14; CMASK[56] = 13; CMASK[4] = 3; CMASK[7] = 11; CMASK[0] = 7;
const START = (() => { const b = new Array(64).fill(0), back = [RK, KN, BI, QN, KG, BI, KN, RK]; for (let c = 0; c < 8; c++) { b[c] = 8 + back[c]; b[8 + c] = 8 + PW; b[48 + c] = PW; b[56 + c] = back[c]; } return b; })();
/* move: f | t<<6 | promo<<12 | flag<<15  (flag 1 ep, 2 castle, 3 double) */
const MV = (f, t, pr, fl) => f | (t << 6) | ((pr || 0) << 12) | ((fl || 0) << 15);
const MF = m => m & 63, MT = m => (m >> 6) & 63, MP = m => (m >> 12) & 7, MFL = m => m >> 15;

function Eng(s0) {
  const b = Int8Array.from(s0.b); let side = s0.turn, cas = s0.cas, ep = s0.ep, half = s0.half, h1 = 0, h2 = 0;
  const sc = [0, 0], kp = [0, 0], npm = [0, 0], pc = [0, 0], stk = new Int32Array(13 * 256); let sp = 0;
  for (let s = 0; s < 64; s++) { const p = b[s]; if (!p) continue; const c = p >> 3, t = p & 7; h1 ^= Z.a[p * 64 + s]; h2 ^= Z.b[p * 64 + s]; sc[c] += PS(p, s); if (t === KG) kp[c] = s; else if (t === PW) pc[c]++; else npm[c] += VAL[t]; }
  const epKey = () => { if (ep < 0) return 0; const r = RW(ep) + (side ? -1 : 1), want = side * 8 + PW; let ok = false; for (const dc of [-1, 1]) { const c = CL(ep) + dc; if (c >= 0 && c < 8 && b[(side ? 4 : 3) * 8 + c] === want) ok = true; } return ok && r >= 0 ? 1 : 0; };
  function attacked(s, by) {
    const r = RW(s), c = CL(s);
    if (by === 0) { if (r < 7) { if (c > 0 && b[s + 7] === PW) return true; if (c < 7 && b[s + 9] === PW) return true; } }
    else { if (r > 0) { if (c > 0 && b[s - 9] === 8 + PW) return true; if (c < 7 && b[s - 7] === 8 + PW) return true; } }
    const o = by * 8;
    for (const t of NT[s]) if (b[t] === o + KN) return true;
    for (const t of KT[s]) if (b[t] === o + KG) return true;
    const rs = RAYS[s];
    for (let d = 0; d < 8; d++) {
      const ray = rs[d];
      for (let i = 0; i < ray.length; i++) { const p = b[ray[i]]; if (!p) continue; if ((p >> 3) === by) { const t = p & 7; if (t === QN || (d < 4 ? t === RK : t === BI)) return true; } break; }
    }
    return false;
  }
  const E = {
    b, side: () => side,
    hash() { let a = h1, c = h2; if (side) { a ^= Z.a[ZS]; c ^= Z.b[ZS]; } a ^= Z.a[ZC + cas]; c ^= Z.b[ZC + cas]; if (ep >= 0 && epKey()) { a ^= Z.a[ZE + CL(ep)]; c ^= Z.b[ZE + CL(ep)]; } return L.key(a, c); },
    inCheck: () => attacked(kp[side], side ^ 1),
    attacked,
    drawish: () => half >= 100 || (!pc[0] && !pc[1] && npm[0] <= 330 && npm[1] <= 330),
    evaluate() {
      const ph = Math.min(1, (npm[0] + npm[1]) / 6200);
      let v = sc[side] - sc[side ^ 1];
      const kt = c => PSTW[KG][mir(c * 8 + KG, kp[c])] * ph + KEND[mir(c * 8 + KG, kp[c])] * (1 - ph);
      v += kt(side) - kt(side ^ 1);
      if (ph < .5) {   // endgame: passed-ish pawn advancement
        let pa = 0;
        for (let s = 8; s < 56; s++) { const p = b[s]; if ((p & 7) !== PW) continue; const adv = (p >> 3) ? RW(s) - 1 : 6 - RW(s); pa += ((p >> 3) === side ? 1 : -1) * adv * adv * 3; }
        v += pa * (1 - ph * 2);
        const mat = (npm[side] + pc[side] * 100) - (npm[side ^ 1] + pc[side ^ 1] * 100);
        if (Math.abs(mat) >= 300) {
          const w = mat > 0 ? side : side ^ 1, l = w ^ 1, lk = kp[l], wk = kp[w];
          const cd = Math.max(3 - RW(lk), RW(lk) - 4) + Math.max(3 - CL(lk), CL(lk) - 4);
          const kd = Math.abs(RW(lk) - RW(wk)) + Math.abs(CL(lk) - CL(wk));
          const bonus = cd * 14 + (14 - kd) * 5; v += w === side ? bonus : -bonus;
        }
      }
      return v + 12;
    },
    score(m) { const q = MFL(m) === 1 ? PW : b[MT(m)] & 7; const pr = MP(m); return q ? 2000 + VAL[q] * 16 - VAL[b[MF(m)] & 7] / 10 + (pr ? VAL[pr] : 0) : pr ? 1500 + VAL[pr] : 0; },
    moves(capOnly) {
      const out = [], me = side, op = me ^ 1, o8 = me * 8;
      for (let s = 0; s < 64; s++) {
        const p = b[s]; if (!p || (p >> 3) !== me) continue;
        const t = p & 7, r = RW(s), c = CL(s);
        if (t === PW) {
          const dir = me ? 8 : -8, last = me ? 7 : 0, startR = me ? 1 : 6, to = s + dir, pr = RW(to) === last;
          if (!b[to]) {
            if (pr) { out.push(MV(s, to, QN)); if (!capOnly) { out.push(MV(s, to, RK), MV(s, to, BI), MV(s, to, KN)); } }
            else if (!capOnly) { out.push(MV(s, to)); if (r === startR && !b[to + dir]) out.push(MV(s, to + dir, 0, 3)); }
          }
          for (const dc of [-1, 1]) {
            const cc = c + dc; if (cc < 0 || cc > 7) continue; const tt = to + dc, q = b[tt];
            if (q && (q >> 3) === op) { if (pr) { out.push(MV(s, tt, QN)); if (!capOnly) out.push(MV(s, tt, RK), MV(s, tt, BI), MV(s, tt, KN)); } else out.push(MV(s, tt)); }
            else if (tt === ep) out.push(MV(s, tt, 0, 1));
          }
        } else if (t === KN || t === KG) {
          for (const to of (t === KN ? NT[s] : KT[s])) { const q = b[to]; if (q ? (q >> 3) === op : !capOnly) out.push(MV(s, to)); }
          if (t === KG && !capOnly && cas) {
            const kr = me ? 4 : 60;
            if (s === kr && !attacked(s, op)) {
              if ((cas & (me ? 4 : 1)) && b[s + 3] === o8 + RK && !b[s + 1] && !b[s + 2] && !attacked(s + 1, op) && !attacked(s + 2, op)) out.push(MV(s, s + 2, 0, 2));
              if ((cas & (me ? 8 : 2)) && b[s - 4] === o8 + RK && !b[s - 1] && !b[s - 2] && !b[s - 3] && !attacked(s - 1, op) && !attacked(s - 2, op)) out.push(MV(s, s - 2, 0, 2));
            }
          }
        } else {
          const d0 = t === BI ? 4 : 0, d1 = t === RK ? 4 : 8;
          for (let d = d0; d < d1; d++) for (const to of RAYS[s][d]) { const q = b[to]; if (!q) { if (!capOnly) out.push(MV(s, to)); } else { if ((q >> 3) === op) out.push(MV(s, to)); break; } }
        }
      }
      return out;
    },
    make(m) {
      const f = MF(m), t = MT(m), pr = MP(m), fl = MFL(m), p = b[f], me = side;
      let cs = t, q = b[t];
      if (fl === 1) { cs = t + (me ? -8 : 8); q = b[cs]; }
      stk[sp] = m; stk[sp + 1] = q; stk[sp + 2] = cas; stk[sp + 3] = ep; stk[sp + 4] = half; stk[sp + 5] = h1; stk[sp + 6] = h2; stk[sp + 7] = sc[0]; stk[sp + 8] = sc[1]; stk[sp + 9] = npm[0]; stk[sp + 10] = npm[1]; stk[sp + 11] = pc[0]; stk[sp + 12] = pc[1]; sp += 13;
      const tog = (pp, s) => { h1 ^= Z.a[pp * 64 + s]; h2 ^= Z.b[pp * 64 + s]; };
      if (q) { tog(q, cs); b[cs] = 0; sc[me ^ 1] -= PS(q, cs); if ((q & 7) === PW) pc[me ^ 1]--; else npm[me ^ 1] -= VAL[q & 7]; }
      tog(p, f); b[f] = 0;
      const np = pr ? me * 8 + pr : p;
      b[t] = np; tog(np, t); sc[me] += PS(np, t) - PS(p, f);
      if (pr) { pc[me]--; npm[me] += VAL[pr]; }
      if ((p & 7) === KG) kp[me] = t;
      if (fl === 2) { const rf = t > f ? f + 3 : f - 4, rt = t > f ? f + 1 : f - 1, rp = me * 8 + RK; b[rf] = 0; b[rt] = rp; tog(rp, rf); tog(rp, rt); sc[me] += PS(rp, rt) - PS(rp, rf); }
      cas &= CMASK[f] & CMASK[t];
      ep = fl === 3 ? (f + t) >> 1 : -1;
      half = q || (p & 7) === PW ? 0 : half + 1;
      side ^= 1;
      if (attacked(kp[me], side)) { E.unmake(); return false; }
      return true;
    },
    unmake() {
      sp -= 13; const m = stk[sp], q = stk[sp + 1]; cas = stk[sp + 2]; ep = stk[sp + 3]; half = stk[sp + 4]; h1 = stk[sp + 5]; h2 = stk[sp + 6];
      sc[0] = stk[sp + 7]; sc[1] = stk[sp + 8]; npm[0] = stk[sp + 9]; npm[1] = stk[sp + 10]; pc[0] = stk[sp + 11]; pc[1] = stk[sp + 12];
      side ^= 1; const me = side, f = MF(m), t = MT(m), pr = MP(m), fl = MFL(m);
      const np = b[t], p = pr ? me * 8 + PW : np;
      b[f] = p; b[t] = 0;
      if ((p & 7) === KG) kp[me] = f;
      if (fl === 1) b[t + (me ? -8 : 8)] = q; else b[t] = q;
      if (fl === 2) { const rf = t > f ? f + 3 : f - 4, rt = t > f ? f + 1 : f - 1; b[rf] = me * 8 + RK; b[rt] = 0; }
    },
    over: () => null,
    noMove(ply) { return attacked(kp[side], side ^ 1) ? -(L.MATE - ply) : 0; },
  };
  return E;
}
const legalMoves = E => E.moves(false).filter(m => { if (!E.make(m)) return false; E.unmake(); return true; });
function insufficient(b) {
  const minors = []; for (let s = 0; s < 64; s++) { const t = b[s] & 7; if (!b[s] || t === KG) continue; if (t === PW || t === RK || t === QN) return false; minors.push([t, (RW(s) + CL(s)) & 1]); }
  if (minors.length <= 1) return true;
  return minors.every(x => x[0] === BI && x[1] === minors[0][1]);
}
const SAN = ['', '', '马', '象', '车', '后', '王'];
/* ---------- vector pieces (100-unit box centred) ---------- */
function piecePath(g, t) {
  g.beginPath();
  if (t === PW) { g.moveTo(-22, 30); g.quadraticCurveTo(-10, 14, -9, -2); g.lineTo(9, -2); g.quadraticCurveTo(10, 14, 22, 30); g.closePath(); g.moveTo(13, -18); g.arc(0, -18, 13, 0, Math.PI * 2); }
  else if (t === RK) { g.moveTo(-22, 30); g.lineTo(-17, -12); g.lineTo(-24, -12); g.lineTo(-24, -36); g.lineTo(-14, -36); g.lineTo(-14, -28); g.lineTo(-5, -28); g.lineTo(-5, -36); g.lineTo(5, -36); g.lineTo(5, -28); g.lineTo(14, -28); g.lineTo(14, -36); g.lineTo(24, -36); g.lineTo(24, -12); g.lineTo(17, -12); g.lineTo(22, 30); g.closePath(); }
  else if (t === BI) { g.moveTo(-20, 30); g.quadraticCurveTo(-8, 16, -8, 4); g.lineTo(8, 4); g.quadraticCurveTo(8, 16, 20, 30); g.closePath(); g.moveTo(14, -14); g.ellipse(0, -14, 14, 19, 0, 0, Math.PI * 2); g.moveTo(5, -38); g.arc(0, -38, 5, 0, Math.PI * 2); }
  else if (t === QN) { g.moveTo(-22, 30); g.lineTo(-13, -2); g.lineTo(-17, -4); g.lineTo(-28, -27); g.lineTo(-14, -14); g.lineTo(-8, -33); g.lineTo(0, -17); g.lineTo(8, -33); g.lineTo(14, -14); g.lineTo(28, -27); g.lineTo(17, -4); g.lineTo(13, -2); g.lineTo(22, 30); g.closePath(); for (const [x, y] of [[-28, -27], [-8, -33], [8, -33], [28, -27], [0, -37]]) { g.moveTo(x + 5, y); g.arc(x, y, 5, 0, Math.PI * 2); } }
  else if (t === KG) { g.moveTo(-22, 30); g.lineTo(-13, -2); g.lineTo(-17, -4); g.lineTo(-23, -24); g.quadraticCurveTo(-11, -32, 0, -21); g.quadraticCurveTo(11, -32, 23, -24); g.lineTo(17, -4); g.lineTo(13, -2); g.lineTo(22, 30); g.closePath(); g.rect(-3.5, -46, 7, 22); g.rect(-10, -40, 20, 7); }
  else if (t === KN) { g.moveTo(22, 30); g.lineTo(-20, 30); g.quadraticCurveTo(-20, 14, -4, 2); g.lineTo(-18, -4); g.quadraticCurveTo(-31, -6, -26, -17); g.lineTo(-12, -31); g.lineTo(-7, -42); g.lineTo(0, -33); g.quadraticCurveTo(24, -30, 24, 2); g.quadraticCurveTo(25, 16, 22, 30); g.closePath(); }
}
function drawPiece(g, x, y, size, t, black, o = {}) {
  g.save(); g.translate(x, y); const k = size / 100; g.scale(k, k);
  if (o.shadow !== false) { g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(4, 40, 34, 8, 0, 0, Math.PI * 2); g.fill(); }
  const gr = g.createLinearGradient(-30, -40, 30, 40);
  if (black) { gr.addColorStop(0, '#5a4c44'); gr.addColorStop(.5, '#2a221d'); gr.addColorStop(1, '#0e0a08'); }
  else { gr.addColorStop(0, '#fffdf6'); gr.addColorStop(.55, '#f1e6cf'); gr.addColorStop(1, '#c9b691'); }
  const line = black ? '#0b0806' : '#4a3520', rim = black ? 'rgba(230,200,150,.55)' : 'rgba(255,255,255,.9)';
  g.lineJoin = 'round';
  // base
  D.rr(g, -31, 28, 62, 13, 5); g.fillStyle = gr; g.fill(); g.lineWidth = 3.4; g.strokeStyle = line; g.stroke();
  piecePath(g, t); g.fillStyle = gr; g.fill(); g.lineWidth = 3.4; g.strokeStyle = line; g.stroke();
  // collar band
  if (t !== KN && t !== RK) { D.rr(g, t === PW ? -14 : -17, t === PW ? -6 : (t === BI ? 0 : -6), t === PW ? 28 : 34, 7, 3); g.fillStyle = gr; g.fill(); g.stroke(); }
  if (t === RK) { g.beginPath(); g.moveTo(-18, -12); g.lineTo(18, -12); g.stroke(); }
  // details
  g.strokeStyle = rim; g.lineWidth = 2.2; g.lineCap = 'round';
  if (t === BI) { g.beginPath(); g.moveTo(5, -24); g.lineTo(-5, -9); g.stroke(); }
  if (t === KN) { g.fillStyle = black ? '#e8d7b0' : '#3a2a1a'; g.beginPath(); g.arc(-11, -20, 2.8, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(2, -30); g.quadraticCurveTo(18, -22, 16, 4); g.stroke(); }
  if (t !== KN) { g.beginPath(); g.moveTo(-6, 24); g.quadraticCurveTo(-8, 12, -5, 4); g.stroke(); }
  if (o.sel) { g.strokeStyle = '#ffd76a'; g.lineWidth = 5; piecePath(g, t); g.globalAlpha = .55; g.stroke(); }
  g.restore();
}
const BOOK = {w: ['e2e4', 'd2d4', 'c2c4', 'g1f3', 'e2e4'], e2e4: ['e7e5', 'c7c5', 'e7e6', 'c7c6'], d2d4: ['d7d5', 'g8f6'], c2c4: ['e7e5', 'g8f6', 'c7c5'], g1f3: ['d7d5', 'g8f6']};
const alg = s => 'abcdefgh'[CL(s)] + (8 - RW(s)), fromAlg = a => (8 - (+a[1])) * 8 + 'abcdefgh'.indexOf(a[0]);

BX.register({
  id: 'chess', title: '国际象棋', cat: 'classic', order: 2, sub: '王车易位，兵升变',
  desc: '世界通行的国际象棋，完整 FIDE 规则：王车易位、吃过路兵、兵升变、将死与逼和、50 步与三次重复。电脑三档难度。',
  kind: 'turn', seats: 2, seatNames: ['白方', '黑方'], seatColors: ['#f1e6cf', '#2a221d'], firstLabel: '执棋',
  rules: `<p><b>目标</b>：8×8 棋盘，白先黑后轮流走棋。<b>将死</b>对方的王即获胜。</p>
<p><b>走法</b>：王——任意方向一格；后——横竖斜任意格；车——横竖任意格；象——斜线任意格；马——「日」字，可越子；兵——向前一格，首步可走两格，斜前方一格吃子。除马以外都不能越过其他棋子。</p>
<p><b>王车易位</b>：王和该侧车都未曾移动、中间无子、王不在被将军状态、且王经过和到达的格子都不受攻击时，王向车方向走两格，车越过王停在其旁边。点王再点目标格即可。</p>
<p><b>吃过路兵</b>：对方兵从起始位置一步走两格、恰好停在你的兵旁边时，你可以在<b>紧接着的一步</b>斜进到它越过的那一格，把它吃掉。</p>
<p><b>兵升变</b>：兵走到底线必须升变为后、车、象或马（会弹出选择）。</p>
<p><b>将军</b>：走棋后不能让自己的王处于被攻击状态。被将军且无法解除即为<b>将死</b>，判负；没有被将军但无棋可走为<b>逼和</b>，和棋。</p>
<p><b>其他和棋</b>：同一局面（同一方走棋、易位与过路兵权利相同）出现<b>三次</b>；连续 <b>50 回合</b>双方都没有吃子或动兵；双方剩余子力不可能将死（如单王对单王、王象对王、王马对王、同色格象）。本版以上情况自动判和。</p>`,
  icon(g, w, h) {
    const s = h / 4;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { g.fillStyle = (r + c) & 1 ? '#b5865a' : '#f0d9b0'; g.fillRect(c * s - s * .3, r * s, s, s); }
    g.fillStyle = 'rgba(40,20,5,.15)'; g.fillRect(0, 0, w, h);
    drawPiece(g, w * .3, h * .55, h * .62, KG, false);
    drawPiece(g, w * .55, h * .5, h * .6, KN, true);
    drawPiece(g, w * .78, h * .6, h * .5, PW, false);
  },
  create(ctx) {
    const st = {b: START.slice(), turn: 0, cas: 15, ep: -1, half: 0, ply: 0, keys: [], caps: [[], []], last: null, chk: 0, over: false, result: null, hist: []};
    st.keys.push(Eng(st).hash());
    const cv = ctx.canvas(), boardImg = L.cache();
    let sel = -1, legal = [], anim = null, call = null, promo = null, pulse = 0;
    const flip = () => ctx.mySeats.length === 1 && ctx.mySeats[0] === 1;
    function geo() {
      const W = cv.w, H = cv.h, land = W > H * 1.08;
      const f = land ? BX.fit(W, H, 8.8 + 2 * 3.4, 8.9, 6) : BX.fit(W, H, 8.8, 8.9 + 2 * 1.35, 6);
      const s = Math.min(f.s, 88), ox = Math.round(W / 2 - 4 * s), oy = Math.round(H / 2 - 4 * s), m = .42 * s;
      let pl;
      if (land) { const pw = Math.min(s * 3.1, (W - 8.8 * s) / 2 - 14), ph = Math.min(s * 4, 250); pl = [{x: ox - m - 10 - pw, y: oy, w: pw, h: ph, v: true}, {x: ox + 8 * s + m + 10, y: oy + 8 * s - ph, w: pw, h: ph, v: true}]; }
      else { const ph = Math.min(s * 1.05, 56), pw = 8 * s + 2 * m; pl = [{x: ox - m, y: oy - m - 8 - ph, w: pw, h: ph}, {x: ox - m, y: oy + 8 * s + m + 8, w: pw, h: ph}]; }
      return {s, ox, oy, pl, m};
    }
    const scr = (sq, G) => { let r = RW(sq), c = CL(sq); if (flip()) { r = 7 - r; c = 7 - c; } return [G.ox + (c + .5) * G.s, G.oy + (r + .5) * G.s]; };
    const hit = (p, G) => { let c = Math.floor((p.x - G.ox) / G.s), r = Math.floor((p.y - G.oy) / G.s); if (r < 0 || r > 7 || c < 0 || c > 7) return -1; if (flip()) { r = 7 - r; c = 7 - c; } return r * 8 + c; };
    const refreshLegal = () => { legal = st.over ? [] : legalMoves(Eng(st)); };
    function status() {
      const mat = c => st.caps[c].reduce((a, p) => a + VAL[p & 7], 0) / 100;
      const d = mat(0) - mat(1);
      ctx.info(0, d > 0 ? '+' + d : ''); ctx.info(1, d < 0 ? '+' + (-d) : '');
      if (st.over) return ctx.status(st.result.text);
      const nm = ctx.name(st.turn), chk = st.chk ? '<b style="color:#ff8a70">（被将军）</b>' : '';
      ctx.status((ctx.canAct(st.turn) ? (ctx.hotseat ? nm + '走棋' : '轮到你走棋') : '等待 ' + nm + ' 走棋…') + chk);
    }
    function promoRect(G) {
      const [x, y] = scr(promo.t, G), s = G.s, bw = s * 4.4, bh = s * 1.3;
      return {x: BX.clamp(x - bw / 2, G.ox - G.m, G.ox + 8 * s + G.m - bw), y: BX.clamp(y < G.oy + 4 * s ? y + s * .6 : y - s * .6 - bh, G.oy - G.m, G.oy + 8 * s + G.m - bh), w: bw, h: bh};
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!ctx.canAct(st.turn) || st.over) return;
      const G = geo(), p = cv.pos(e);
      if (promo) {
        const r = promoRect(G), i = Math.floor((p.x - r.x - G.s * .1) / (G.s * 1.05));
        if (p.y >= r.y && p.y <= r.y + r.h && i >= 0 && i < 4) { const pr = [QN, RK, BI, KN][i], m = promo; promo = null; ctx.act({f: m.f, t: m.t, p: pr}, st.turn); }
        else promo = null;
        return;
      }
      const sq = hit(p, G);
      if (sq < 0) { sel = -1; return; }
      if (sel >= 0) {
        const ms = legal.filter(m => MF(m) === sel && MT(m) === sq);
        if (ms.length > 1) { promo = {f: sel, t: sq}; sel = -1; ctx.sfx('select'); return; }
        if (ms.length === 1) { const f = sel; sel = -1; ctx.act({f, t: sq}, st.turn); return; }
      }
      const q = st.b[sq];
      if (q && (q >> 3) === st.turn) { if (sel === sq) { sel = -1; return; } sel = sq; ctx.sfx('select'); if (!legal.some(m => MF(m) === sq)) ctx.toast('这个子现在走不了'); return; }
      if (sel >= 0) ctx.sfx('error'); sel = -1;
    });
    const findMove = (E, a) => legalMoves(E).find(m => MF(m) === a.f && MT(m) === a.t && (!MP(m) || MP(m) === (a.p || QN)));
    function finish(winner, text) { st.over = true; st.result = {winner, text}; ctx.end({winner, text}); }
    const showCall = (t, ms) => { call = {t, k: 0}; ctx.anim(ms, k => { if (call) call.k = k; }, () => call = null, x => x); };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => a && Number.isInteger(a.f) && Number.isInteger(a.t) && findMove(Eng(st), a) != null,
      apply(a) {
        const E = Eng(st), m = findMove(E, a), mover = st.turn;
        const p = st.b[MF(m)], fl = MFL(m), t = MT(m), capSq = fl === 1 ? t + (mover ? -8 : 8) : t, q = st.b[capSq];
        E.make(m);
        st.b = Array.from(E.b); st.turn ^= 1; st.ply++;
        st.cas &= CMASK[MF(m)] & CMASK[t]; st.ep = fl === 3 ? (MF(m) + t) >> 1 : -1;
        st.half = q || (p & 7) === PW ? 0 : st.half + 1;
        if (q) st.caps[mover].push(q);
        st.keys.push(E.hash()); st.last = [MF(m), t]; st.chk = E.inCheck() ? 1 : 0;
        st.hist.push(alg(MF(m)) + alg(t));
        sel = -1; promo = null;
        anim = {f: MF(m), t, p, q, cs: capSq, k: 0, castle: fl === 2 ? [t > MF(m) ? MF(m) + 3 : MF(m) - 4, t > MF(m) ? MF(m) + 1 : MF(m) - 1] : null, pr: MP(m) ? st.b[t] : 0};
        ctx.anim(240, k => { if (anim) anim.k = k; }, () => anim = null);
        ctx.sfx(q ? 'capture' : fl === 2 ? 'whoosh' : 'place');
        const n = legalMoves(E).length, nm = ctx.name(mover);
        const rep = st.keys.filter(k => k === st.keys[st.keys.length - 1]).length;
        if (!n && st.chk) { showCall('将死', 1700); finish(mover, nm + ' 将死对方获胜'); }
        else if (!n) { showCall('逼和', 1700); finish(-1, ctx.name(st.turn) + ' 无子可动，逼和'); }
        else if (insufficient(st.b)) finish(-1, '子力不足以将死，和棋');
        else if (rep >= 3) finish(-1, '同一局面重复三次，和棋');
        else if (st.half >= 100) finish(-1, '50 回合无吃子、无兵移动，和棋');
        else if (st.chk) { showCall('将军', 1200); ctx.after(110, () => ctx.sfx('gong')); }
        if (MP(m) && !ctx.fast) ctx.toast('兵升变为' + SAN[MP(m)]);
        refreshLegal(); status();
      },
      aiMove(seat, level) {
        const E = Eng(st), all = legalMoves(E); if (!all.length) return null;
        const toA = m => ({f: MF(m), t: MT(m), p: MP(m) || undefined});
        if (level >= 2 && st.ply < 2 && Math.random() < .9) {
          const opts = BOOK[st.ply === 0 ? 'w' : st.hist[0]];
          if (opts) { const pick = opts[Math.floor(Math.random() * opts.length)]; const m = all.find(x => MF(x) === fromAlg(pick.slice(0, 2)) && MT(x) === fromAlg(pick.slice(2))); if (m != null) return toA(m); }
        }
        const past = new Set(st.keys);
        if (level === 1) { const r = L.search(E, {depth: 2, all: true, past, timeMs: BX.test ? 25 : 300}); return toA(L.noisy(r.list, 70, .2)); }
        const r = L.search(E, {timeMs: L.levelTime(level), depth: level === 2 ? 4 : 30, past});
        return toA(r.move != null ? r.move : all[0]);
      },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear(); const G = geo(), s = G.s; pulse += dt;
        g.drawImage(boardImg(g, cv.w + 'x' + cv.h + (flip() ? 'f' : ''), cv.w, cv.h, c => {
          const m = G.m;
          c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = s * .5; c.shadowOffsetY = s * .12; c.fillStyle = '#4a2a14'; D.rr(c, G.ox - m, G.oy - m, 8 * s + 2 * m, 8 * s + 2 * m, s * .22); c.fill(); c.restore();
          D.wood(c, G.ox - m, G.oy - m, 8 * s + 2 * m, 8 * s + 2 * m, {r: s * .22, base: '#6e3e1c', dark: '#2a1408', seed: 8, grain: .3});
          for (let r = 0; r < 8; r++) for (let cc = 0; cc < 8; cc++) {
            const light = !((r + cc) & 1);
            D.wood(c, G.ox + cc * s, G.oy + r * s, s, s, {base: light ? '#f1dcb4' : '#b07f52', dark: light ? '#c9a876' : '#6e4524', seed: r * 8 + cc + 3, grain: .12});
          }
          c.strokeStyle = 'rgba(40,20,5,.6)'; c.lineWidth = 1.5; c.strokeRect(G.ox, G.oy, 8 * s, 8 * s);
          const fs = Math.max(8, m * .55);
          for (let i = 0; i < 8; i++) {
            const file = 'abcdefgh'[flip() ? 7 - i : i], rank = flip() ? i + 1 : 8 - i;
            D.text(c, file, G.ox + (i + .5) * s, G.oy + 8 * s + m * .5, {size: fs, color: 'rgba(240,215,170,.8)', font: 'serif'});
            D.text(c, String(rank), G.ox - m * .5, G.oy + (i + .5) * s, {size: fs, color: 'rgba(240,215,170,.8)', font: 'serif'});
          }
        }), 0, 0, cv.w, cv.h);
        const bot = flip() ? 1 : 0;
        for (const seat of [0, 1]) {
          const pr = G.pl[seat === bot ? 1 : 0];
          L.plate(g, pr.x, pr.y, pr.w, pr.h, {active: !st.over && st.turn === seat, color: seat ? '#2a221d' : '#f1e6cf', title: ctx.name(seat), tag: (seat ? '黑方' : '白方') + (!st.over && st.turn === seat ? ' · 走棋' : ''), vertical: pr.v,
            items: st.caps[seat].slice().sort((a, b2) => VAL[b2 & 7] - VAL[a & 7]), itemR: s * .26, drawItem: (g2, x, y, r, it) => drawPiece(g2, x, y, r * 2.1, it & 7, !!(it >> 3), {shadow: false})});
        }
        const hl = (sq, col) => { const [x, y] = scr(sq, G); g.fillStyle = col; g.fillRect(x - s / 2, y - s / 2, s, s); };
        if (st.last) { hl(st.last[0], 'rgba(230,190,60,.32)'); hl(st.last[1], 'rgba(230,190,60,.45)'); }
        if (sel >= 0) hl(sel, 'rgba(90,170,130,.5)');
        if (st.chk && !st.over || (st.over && st.chk)) {
          const kq = st.b.indexOf(st.turn * 8 + KG); if (kq >= 0) { const [x, y] = scr(kq, G); const a = .5 + .25 * Math.sin(pulse * 6); const gr = g.createRadialGradient(x, y, s * .1, x, y, s * .7); gr.addColorStop(0, `rgba(255,50,30,${a})`); gr.addColorStop(1, 'rgba(255,50,30,0)'); g.fillStyle = gr; g.fillRect(x - s / 2, y - s / 2, s, s); }
        }
        const PS0 = s * .86;
        const hide = new Set(anim ? [anim.t, anim.castle ? anim.castle[1] : -1] : []);
        for (let i = 0; i < 64; i++) { const p = st.b[i]; if (!p || hide.has(i)) continue; const [x, y] = scr(i, G); drawPiece(g, x, y + s * .02, PS0, p & 7, !!(p >> 3)); }
        if (anim) {
          const k = anim.k, lift = Math.sin(k * Math.PI) * s * .1;
          if (anim.q && k < .8) { const [x, y] = scr(anim.cs, G); g.globalAlpha = 1 - k / .8; drawPiece(g, x, y, PS0, anim.q & 7, !!(anim.q >> 3)); g.globalAlpha = 1; }
          if (anim.castle) { const [ax, ay] = scr(anim.castle[0], G), [bx, by] = scr(anim.castle[1], G); const rp = st.b[anim.castle[1]]; drawPiece(g, BX.lerp(ax, bx, k), BX.lerp(ay, by, k), PS0, rp & 7, !!(rp >> 3)); }
          const [fx, fy] = scr(anim.f, G), [tx, ty] = scr(anim.t, G), p = k > .7 && anim.pr ? anim.pr : anim.p;
          drawPiece(g, BX.lerp(fx, tx, k), BX.lerp(fy, ty, k) - lift, PS0 * (1 + lift / s * .5), p & 7, !!(p >> 3));
        }
        if (sel >= 0 && ctx.canAct(st.turn)) {
          const seen = new Set();
          for (const m of legal) {
            if (MF(m) !== sel || seen.has(MT(m))) continue; seen.add(MT(m));
            const [x, y] = scr(MT(m), G);
            if (st.b[MT(m)] || MFL(m) === 1) { g.strokeStyle = 'rgba(200,50,30,.85)'; g.lineWidth = Math.max(3, s * .07); D.circle(g, x, y, s * .44); g.stroke(); }
            else { D.hint(g, x, y, Math.max(6, s * .15), 'rgba(40,120,90,.7)'); }
          }
        }
        if (promo) {
          const r = promoRect(G);
          g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 14; g.fillStyle = 'rgba(243,233,210,.97)'; D.rr(g, r.x, r.y, r.w, r.h, s * .2); g.fill(); g.restore();
          g.strokeStyle = C.gold; g.lineWidth = 2; D.rr(g, r.x, r.y, r.w, r.h, s * .2); g.stroke();
          [QN, RK, BI, KN].forEach((t, i) => drawPiece(g, r.x + s * .1 + (i + .5) * s * 1.05, r.y + r.h / 2 + s * .02, s * .82, t, !!st.turn));
        }
        if (call) L.callout(g, G.ox + 4 * s, G.oy + 4 * s, s * .8, call.t, call.k);
      },
    };
    refreshLegal(); status();
    return inst;
  },
});
