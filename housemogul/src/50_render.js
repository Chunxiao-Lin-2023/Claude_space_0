/* ================= isometric renderer (Canvas 2D, all procedural) ================= */
const cv = $('cv'), ctx = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1;
const TW = 64, TH = 32, FH = 8.5;
const CAM = { x: 0, y: N * TH / 2, z: 1, tx: null, ty: null, tz: null };
const RND = { t: 0, pick: [], cars: [], clouds: [], smoke: [], tags: [], pulse: [], hiD: -1 };
const PHONE = matchMedia('(pointer:coarse) and (max-height:500px), (pointer:coarse) and (max-width:500px)');
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2); VW = innerWidth; VH = innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));

const iso = (x, y, z) => [(x - y) * TW / 2, (x + y) * TH / 2 - (z || 0)];
const w2s = (ix, iy) => [(ix - CAM.x) * CAM.z + VW / 2, (iy - CAM.y) * CAM.z + VH / 2];
const s2w = (sx, sy) => [(sx - VW / 2) / CAM.z + CAM.x, (sy - VH / 2) / CAM.z + CAM.y];
const iso2tile = (ix, iy) => [iy / TH + ix / TW, iy / TH - ix / TW];

/* ---------- colors ---------- */
const _cc = new Map();
function hexRgb(h) { if (Array.isArray(h)) return h; if (h[0] === 'r') return h.slice(h.indexOf('(') + 1, -1).split(',').map(Number); const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shade(c, a) {
  const key = c + '|' + a; let r = _cc.get(key); if (r) return r;
  const [R, Gg, B] = hexRgb(c), f = a >= 0 ? v => v + (255 - v) * a : v => v * (1 + a);
  r = 'rgb(' + (f(R) | 0) + ',' + (f(Gg) | 0) + ',' + (f(B) | 0) + ')'; _cc.set(key, r); return r;
}
const rgb = (a, d = 0) => 'rgb(' + clamp(a[0] + d, 0, 255) + ',' + clamp(a[1] + d, 0, 255) + ',' + clamp(a[2] + d, 0, 255) + ')';

/* ---------- primitives (world iso coords) ---------- */
function poly(pts, fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
const diamond = (x, y, w, h, z) => [iso(x, y, z), iso(x + w, y, z), iso(x + w, y + h, z), iso(x, y + h, z)];
function box(x0, y0, x1, y1, z0, z1, c, o) {
  o = o || {};
  const L = shade(c, o.l != null ? o.l : -0.1), R = shade(c, o.r != null ? o.r : -0.3), Tp = shade(c, o.t != null ? o.t : 0.1);
  poly([iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)], L);
  poly([iso(x1, y0, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x1, y0, z1)], R);
  if (!o.noTop) poly([iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)], Tp);
  if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 0.6; ctx.beginPath(); const a = iso(x1, y1, z0), b = iso(x1, y1, z1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
}
// windows on the two visible faces
function windows(x0, y0, x1, y1, z0, fl, fh, col, lit, seed) {
  const cw = (x1 - x0), ch = (y1 - y0);
  const nx = Math.max(1, Math.round(cw * 3.2)), ny = Math.max(1, Math.round(ch * 3.2));
  for (let f = 0; f < fl; f++) {
    const za = z0 + f * fh + fh * 0.32, zb = z0 + f * fh + fh * 0.78;
    for (let c = 0; c < nx; c++) {
      const a = x0 + cw * (c + 0.22) / nx, b = x0 + cw * (c + 0.78) / nx;
      const on = lit && hash2(seed + c, f) < lit;
      poly([iso(a, y1, za), iso(b, y1, za), iso(b, y1, zb), iso(a, y1, zb)], on ? '#ffe39a' : col);
    }
    for (let c = 0; c < ny; c++) {
      const a = y0 + ch * (c + 0.22) / ny, b = y0 + ch * (c + 0.78) / ny;
      const on = lit && hash2(seed + 50 + c, f) < lit;
      poly([iso(x1, a, za), iso(x1, b, za), iso(x1, b, zb), iso(x1, a, zb)], on ? '#f5d27e' : shade(col, -0.25));
    }
  }
}
function hipRoof(x0, y0, x1, y1, z, rh, c) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ov = 0.06;
  x0 -= ov; y0 -= ov; x1 += ov; y1 += ov;
  const w = x1 - x0, h = y1 - y0;
  let A, B; // ridge endpoints
  if (Math.abs(w - h) < 0.05) { A = B = [cx, cy]; } else if (w > h) { const d = h / 2; A = [x0 + d, cy]; B = [x1 - d, cy]; } else { const d = w / 2; A = [cx, y0 + d]; B = [cx, y1 - d]; }
  const zt = z + rh, P = (p, zz) => iso(p[0], p[1], zz), X = w > h;
  const c00 = iso(x0, y0, z), c10 = iso(x1, y0, z), c11 = iso(x1, y1, z), c01 = iso(x0, y1, z), a = P(A, zt), b = P(B, zt);
  poly([c00, c10, X ? b : a, a], shade(c, -0.05));
  poly([c00, c01, X ? a : b, a], shade(c, -0.12));
  poly([c10, c11, b, X ? b : a], shade(c, -0.32));
  poly([c01, c11, b, X ? a : b], shade(c, 0.08));
  // ridge line
  ctx.strokeStyle = shade(c, -0.45); ctx.lineWidth = 0.7; ctx.beginPath(); const e = c11; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
}
function gableRoof(x0, y0, x1, y1, z, rh, c, wall) {
  const ym = (y0 + y1) / 2, ov = 0.05; x0 -= ov; x1 += ov;
  poly([iso(x0, y0, z), iso(x1, y0, z), iso(x1, ym, z + rh), iso(x0, ym, z + rh)], shade(c, -0.12));
  poly([iso(x1, y0 + ov, z), iso(x1, y1 - ov, z), iso(x1, ym, z + rh)], shade(wall, -0.3));
  poly([iso(x0, y1, z), iso(x1, y1, z), iso(x1, ym, z + rh), iso(x0, ym, z + rh)], shade(c, 0.06));
}
function tree(x, y, s, v) {
  const [bx, by] = iso(x, y, 0), k = s || 1;
  ctx.fillStyle = 'rgba(20,40,10,.22)'; ctx.beginPath(); ctx.ellipse(bx + 2, by + 1, 9 * k, 4.5 * k, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#6b4a2e'; ctx.fillRect(bx - 1.2, by - 9 * k, 2.4, 9 * k);
  const g = [[58, 120, 52], [72, 138, 58], [48, 110, 60], [88, 140, 50]][Math.floor(v * 4)];
  ctx.fillStyle = rgb(g, -12); ctx.beginPath(); ctx.arc(bx, by - 13 * k, 8.5 * k, 0, 6.283); ctx.fill();
  ctx.fillStyle = rgb(g); ctx.beginPath(); ctx.arc(bx - 2 * k, by - 15 * k, 6.5 * k, 0, 6.283); ctx.fill();
  ctx.fillStyle = rgb(g, 22); ctx.beginPath(); ctx.arc(bx - 3.5 * k, by - 17 * k, 3.2 * k, 0, 6.283); ctx.fill();
}
function pine(x, y, s, v) {
  const [bx, by] = iso(x, y, 0), k = s || 1, g = v > 0.5 ? [52, 104, 66] : [44, 96, 58];
  ctx.fillStyle = 'rgba(20,40,10,.22)'; ctx.beginPath(); ctx.ellipse(bx + 2, by + 1, 7 * k, 3.5 * k, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#5a3d26'; ctx.fillRect(bx - 1, by - 5 * k, 2, 5 * k);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = rgb(g, i * 9); ctx.beginPath(); ctx.moveTo(bx - (8 - i * 2) * k, by - (4 + i * 7) * k); ctx.lineTo(bx + (8 - i * 2) * k, by - (4 + i * 7) * k); ctx.lineTo(bx, by - (16 + i * 7) * k); ctx.closePath(); ctx.fill(); }
}

/* ---------- ground ---------- */
const MARGIN = 5;
function tileType(x, y) { if (inMap(x, y)) return G.tiles[ti(x, y)]; if (y <= 1) return T_WATER; return -1; }
function drawGround() {
  const t = RND.t;
  for (let y = -MARGIN; y < N + MARGIN; y++) for (let x = -MARGIN; x < N + MARGIN; x++) {
    const tt = tileType(x, y), h = hash2(x + 99, y + 7), pts = diamond(x, y, 1, 1, 0);
    if (tt === T_WATER) {
      const w = Math.sin(t * 1.2 + x * 0.7 + y * 0.9) * 6;
      poly(pts, rgb([58, 138, 186], (w | 0) - (y < -1 ? 10 : 0)));
    } else if (tt === T_ROAD) poly(pts, '#7a7f87');
    else if (tt === T_PLAZA) poly(pts, (x + y) & 1 ? '#ddd3c2' : '#d3c8b5');
    else if (tt === T_PATH) poly(pts, '#d8c59c');
    else if (tt === T_GRASS && inMap(x, y)) {
      const d = G.tdist[ti(x, y)]; const base = d >= 0 ? DISTS[d].grass : [120, 158, 90];
      poly(pts, rgb(base, ((h * 14) | 0) - 7 + (RND.hiD === d ? 22 : 0)));
    } else { // countryside outside the map
      const far = Math.max(-x, -y, x - N + 1, y - N + 1);
      const field = (Math.floor(x / 3) + Math.floor(y / 3)) & 1;
      poly(pts, rgb(field ? [150, 170, 96] : [128, 160, 88], ((h * 12) | 0) - 6 - far * 4));
    }
  }
  // shoreline + embankment along y=2
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
  let a = iso(-MARGIN, 2), b = iso(N + MARGIN, 2); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  for (let k = 0; k < 14; k++) { // glints
    const gx = ((k * 37.3 + t * 0.6) % (N + 2 * MARGIN)) - MARGIN, gy = -MARGIN + 0.5 + (k * 0.61 % 6.2);
    const p = iso(gx, gy), al = 0.25 + 0.25 * Math.sin(t * 2 + k);
    ctx.fillStyle = 'rgba(255,255,255,' + al.toFixed(2) + ')'; ctx.fillRect(p[0] - 6, p[1], 12, 1.2);
  }
  // road markings + curbs
  for (let y = 2; y < N; y++) for (let x = -MARGIN; x < N + MARGIN; x++) {
    if (tileType(x, y) !== T_ROAD) continue;
    const ex = tileType(x - 1, y) === T_ROAD || tileType(x + 1, y) === T_ROAD, ey = tileType(x, y - 1) === T_ROAD || tileType(x, y + 1) === T_ROAD;
    ctx.strokeStyle = 'rgba(255,240,190,.75)'; ctx.lineWidth = 1.1; ctx.beginPath();
    if (ex && !ey) { const p = iso(x + 0.25, y + 0.5), q = iso(x + 0.75, y + 0.5); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    else if (ey && !ex) { const p = iso(x + 0.5, y + 0.25), q = iso(x + 0.5, y + 0.75); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    ctx.stroke();
  }
}

/* ---------- objects ---------- */
function decoTrees() { // stable list of trees on free grass
  if (RND.trees && RND.treesV === G.deco.length + ':' + G.props.length) return RND.trees;
  const used = new Set();
  for (const o of G.props.concat(G.deco)) for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) used.add((o.x + i) + ',' + (o.y + j));
  const out = [];
  for (let y = -MARGIN; y < N + MARGIN; y++) for (let x = -MARGIN; x < N + MARGIN; x++) {
    if (tileType(x, y) !== T_GRASS && tileType(x, y) !== -1) continue;
    if (used.has(x + ',' + y)) continue;
    const inside = inMap(x, y), d = inside ? G.tdist[ti(x, y)] : -1, h = hash2(x, y);
    const prob = !inside ? 0.12 : d === DI.hill ? 0.95 : d >= 0 ? 0.75 : 0.3;
    if (h > prob) continue;
    const n = inside && d >= 0 ? (h < prob * 0.5 ? 2 : 1) : 1;
    for (let k = 0; k < n; k++) out.push({ x: x + 0.3 + hash2(x + k * 3, y + 11) * 0.45, y: y + 0.3 + hash2(x + 7, y + k * 5) * 0.45, s: 0.8 + hash2(x, y + k) * 0.45, v: hash2(y, x + k), pine: d === DI.hill || (!inside && h < 0.05) });
  }
  RND.trees = out; RND.treesV = G.deco.length + ':' + G.props.length; return out;
}
function propTopZ(p) { const K = KINDS[p.kind]; if (p.kind === 'mansion') return 4 * FH + 36; return K.fl * FH + 3 + (K.roof === 'hip' ? 10 + p.w * 3 : K.roof === 'gable' ? 9 : 4); }

function drawProp(p, hov, sel) {
  const K = KINDS[p.kind], t = RND.t;
  if (p.kind === 'mansion') return drawMansion(p, hov, sel);
  const e = p.w > 1 ? 0.16 : 0.13, x0 = p.x + e, y0 = p.y + e, x1 = p.x + p.w - e, y1 = p.y + p.h - e;
  // lot ground
  const own = p.owner;
  poly(diamond(p.x + 0.04, p.y + 0.04, p.w - 0.08, p.h - 0.08, 0), own >= 0 ? hexA(PCOL[own], 0.38) : 'rgba(255,255,255,.12)', own >= 0 ? PCOL[own] : null, 2);
  if (sel) { const a = 0.45 + 0.35 * Math.sin(t * 6); poly(diamond(p.x, p.y, p.w, p.h, 0), null, 'rgba(255,224,120,' + a.toFixed(2) + ')', 3); }
  let c = K.col; if (p.cond === 0) c = shade(c, -0.14); if (hov || sel) c = shade(c, 0.12);
  const zt = K.fl * FH + 3;
  box(x0, y0, x1, y1, 0, zt, c, { edge: 'rgba(0,0,0,.12)' });
  // door
  const dm = (x0 + x1) / 2; poly([iso(dm - 0.08, y1, 0), iso(dm + 0.08, y1, 0), iso(dm + 0.08, y1, 6), iso(dm - 0.08, y1, 6)], '#6b4a34');
  if (K.glass) {
    for (let f = 0; f < K.fl; f++) { const za = 3 + f * FH + 1.6, zb = 3 + f * FH + FH - 1.2;
      poly([iso(x0 + 0.03, y1, za), iso(x1 - 0.03, y1, za), iso(x1 - 0.03, y1, zb), iso(x0 + 0.03, y1, zb)], f % 3 === 1 ? '#8fc4e6' : '#6ea8cf');
      poly([iso(x1, y0 + 0.03, za), iso(x1, y1 - 0.03, za), iso(x1, y1 - 0.03, zb), iso(x1, y0 + 0.03, zb)], f % 3 === 1 ? '#5d93ba' : '#4b7fa6'); }
  } else windows(x0, y0, x1, y1, 2, K.fl, FH, p.cond === 0 ? '#4a4f55' : '#3f5f7a', p.cond === 2 ? 0.25 : 0.08, p.id * 13);
  if (K.roof === 'hip') hipRoof(x0, y0, x1, y1, zt, 9 + p.w * 3, p.cond === 0 ? shade(K.rc, -0.15) : K.rc);
  else if (K.roof === 'gable') gableRoof(x0, y0, x1, y1, zt, 9, K.rc, c);
  else {
    // parapet + rooftop box
    poly(diamond(x0 + 0.06, y0 + 0.06, x1 - x0 - 0.12, y1 - y0 - 0.12, zt), shade(K.rc, 0.05));
    const s = p.w > 1 ? 0.35 : 0.22; box(x0 + 0.12, y0 + 0.12, x0 + 0.12 + s, y0 + 0.12 + s, zt, zt + 5, K.rc);
    if (p.kind === 'techflat') { const a = iso(x1 - 0.3, y1 - 0.3, zt), b = iso(x1 - 0.3, y1 - 0.3, zt + 14); ctx.strokeStyle = '#9aa7b4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.fillStyle = Math.sin(t * 3 + p.id) > 0 ? '#ff5f52' : '#7a2a24'; ctx.fillRect(b[0] - 1.2, b[1] - 1.2, 2.4, 2.4); }
  }
  if (p.cond === 0 && p.owner === -1) { // a bit of grime
    ctx.fillStyle = 'rgba(70,60,40,.18)'; poly([iso(x0, y1, 0), iso(x1, y1, 0), iso(x1, y1, 5), iso(x0, y1, 5)], 'rgba(60,50,35,.25)');
  }
  if (p.reno) scaffold(x0, y0, x1, y1, zt);
  if (own >= 0) flag(x1 - 0.12, y1 - 0.12, zt + (K.roof === 'flat' ? 0 : 3), PCOL[own]);
  if (p.list && p.owner === -1) saleSign(p.x + p.w - 0.1, p.y + p.h - 0.1, p.list.tag === 'hot');
}
function hexA(h, a) { const [r, g, b] = hexRgb(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
function flag(x, y, z, col) {
  const a = iso(x, y, z), b = iso(x, y, z + 15), w = Math.sin(RND.t * 4 + x) * 1.5;
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] + 9, b[1] + 2.5 + w); ctx.lineTo(b[0], b[1] + 5.5); ctx.closePath(); ctx.fill();
}
function saleSign(x, y, hot) {
  const a = iso(x, y, 0), b = iso(x, y, 11);
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.fillStyle = hot ? '#e0392d' : '#d8452f'; ctx.fillRect(b[0] - 6, b[1] - 6, 12, 7);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('售', b[0], b[1] - 2.4);
}
function scaffold(x0, y0, x1, y1, zt) {
  ctx.strokeStyle = 'rgba(150,100,40,.85)'; ctx.lineWidth = 0.8; ctx.beginPath();
  for (let z = 0; z <= zt + 2; z += 6) { let a = iso(x0 - 0.04, y1 + 0.04, z), b = iso(x1 + 0.04, y1 + 0.04, z), c = iso(x1 + 0.04, y0 - 0.04, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); }
  for (const [x, y] of [[x0 - 0.04, y1 + 0.04], [(x0 + x1) / 2, y1 + 0.04], [x1 + 0.04, y1 + 0.04], [x1 + 0.04, (y0 + y1) / 2], [x1 + 0.04, y0 - 0.04]]) { const a = iso(x, y, 0), b = iso(x, y, zt + 2); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  ctx.stroke();
  poly([iso(x0, y1 + 0.05, 0), iso(x1, y1 + 0.05, 0), iso(x1, y1 + 0.05, zt * 0.6), iso(x0, y1 + 0.05, zt * 0.6)], 'rgba(60,140,90,.28)');
}
function drawMansion(p, hov, sel) {
  const x = p.x, y = p.y, t = RND.t;
  poly(diamond(x + 0.04, y + 0.04, 2.92, 2.92, 0), p.owner >= 0 ? hexA(PCOL[p.owner], 0.45) : '#8fc06e', p.owner >= 0 ? PCOL[p.owner] : '#e8d28a', 2);
  if (sel) { const a = 0.45 + 0.35 * Math.sin(t * 6); poly(diamond(x, y, 3, 3, 0), null, 'rgba(255,224,120,' + a.toFixed(2) + ')', 3.5); }
  // hedge
  box(x + 0.08, y + 0.08, x + 2.92, y + 0.2, 0, 4, '#3e7a3c'); box(x + 0.08, y + 0.2, x + 0.2, y + 2.92, 0, 4, '#3e7a3c');
  // pool
  poly(diamond(x + 2.0, y + 0.45, 0.8, 1.3, 0.5), '#e9e2d0'); poly(diamond(x + 2.08, y + 0.53, 0.64, 1.14, 0.6), shade('#4cb4e0', Math.sin(t * 2) * 0.05));
  let c = hov || sel ? '#fffaf0' : KINDS.mansion.col;
  // main house + wing
  const MH = 4 * FH + 4;
  box(x + 0.3, y + 0.35, x + 1.85, y + 2.0, 0, MH, c, { edge: 'rgba(0,0,0,.1)' });
  windows(x + 0.3, y + 0.35, x + 1.85, y + 2.0, 3, 4, FH, '#3b5d80', 0.35, 77);
  poly([iso(x + 0.3, y + 2.0, MH - 2), iso(x + 1.85, y + 2.0, MH - 2), iso(x + 1.85, y + 2.0, MH), iso(x + 0.3, y + 2.0, MH)], '#e2b84a');
  // columns porch
  for (let k = 0; k < 4; k++) { const cx = x + 0.55 + k * 0.33; box(cx, y + 2.0, cx + 0.07, y + 2.07, 0, 2 * FH, '#fffaf2'); }
  box(x + 0.45, y + 2.0, x + 1.7, y + 2.25, 2 * FH, 2 * FH + 3, '#efe6d2');
  hipRoof(x + 0.3, y + 0.35, x + 1.85, y + 2.0, MH, 18, KINDS.mansion.rc);
  box(x + 0.95, y + 1.0, x + 1.2, y + 1.25, MH + 8, MH + 22, '#f3ead6'); hipRoof(x + 0.95, y + 1.0, x + 1.2, y + 1.25, MH + 22, 9, '#2c3a50');
  box(x + 0.4, y + 2.25, x + 1.3, y + 2.85, 0, 2 * FH + 2, c);
  windows(x + 0.4, y + 2.25, x + 1.3, y + 2.85, 2, 2, FH, '#3b5d80', 0.35, 31);
  hipRoof(x + 0.4, y + 2.25, x + 1.3, y + 2.85, 2 * FH + 2, 9, KINDS.mansion.rc);
  // gold finial
  const f = iso(x + 1.075, y + 1.125, MH + 31); ctx.fillStyle = '#f5c451'; ctx.beginPath(); ctx.arc(f[0], f[1] - 2, 2.4, 0, 6.283); ctx.fill();
  // fountain
  const fo = iso(x + 1.9, y + 2.4, 0); ctx.fillStyle = '#e3dccb'; ctx.beginPath(); ctx.ellipse(fo[0], fo[1], 9, 4.5, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#5cbde6'; ctx.beginPath(); ctx.ellipse(fo[0], fo[1], 7, 3.4, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = 'rgba(220,240,255,.8)'; for (let k = 0; k < 5; k++) { const ph = (t * 1.6 + k / 5) % 1; ctx.fillRect(fo[0] - 0.8 + Math.sin(k * 2) * ph * 4, fo[1] - 9 * Math.sin(ph * Math.PI) - 2, 1.4, 1.4); }
  if (p.owner >= 0) flag(x + 1.075, y + 1.125, MH + 31, PCOL[p.owner]);
}
function drawDeco(d) {
  const t = RND.t, { x, y, w, h } = d;
  if (d.k === 'park') {
    poly(diamond(x + 0.05, y + 0.05, w - 0.1, h - 0.1, 0), '#7fbf68');
    poly(diamond(x + w / 2 - 0.08, y + 0.1, 0.16, h - 0.2, 0.2), '#e1cf9f'); poly(diamond(x + 0.1, y + h / 2 - 0.08, w - 0.2, 0.16, 0.2), '#e1cf9f');
    for (const [a, b] of [[0.45, 0.45], [1.5, 0.5], [0.5, 1.5], [1.5, 1.55]]) tree(x + a, y + b, 1.05, hash2(x + a * 9, y + b * 7));
  } else if (d.k === 'pond') {
    poly(diamond(x + 0.05, y + 0.05, w - 0.1, h - 0.1, 0), '#86c070');
    const c = iso(x + w / 2, y + h / 2); ctx.fillStyle = '#d9e8c8'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 44, 21, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = shade('#4aa5d4', Math.sin(t) * 0.05); ctx.beginPath(); ctx.ellipse(c[0], c[1], 40, 18, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#5c9a4a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(c[0] - 18 + k * 11, c[1] - 4 + (k % 2) * 8, 3.5, 1.8, 0, 0, 6.283); ctx.fill(); }
    tree(x + 0.3, y + 1.7, 1, 0.2); tree(x + 1.7, y + 0.3, 1, 0.6);
  } else if (d.k === 'plaza') {
    const c = iso(x + w / 2, y + h / 2); ctx.fillStyle = '#bfb39c'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 22, 11, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#56b6de'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 18, 8.5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(230,245,255,.85)'; for (let k = 0; k < 7; k++) { const ph = (t * 1.3 + k / 7) % 1; ctx.fillRect(c[0] + Math.cos(k) * ph * 9, c[1] - 14 * Math.sin(ph * Math.PI) - 2, 1.5, 1.5); }
    for (const [a, b] of [[0.2, 0.2], [1.8, 0.2], [0.2, 1.8], [1.8, 1.8]]) { const p = iso(x + a, y + b, 0), q = iso(x + a, y + b, 14); ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(q[0], q[1], 2, 0, 6.283); ctx.fill(); }
  } else if (d.k === 'mall') {
    box(x + 0.15, y + 0.15, x + w - 0.15, y + h - 0.15, 0, 26, '#e7dccb');
    poly([iso(x + 0.15, y + h - 0.15, 14), iso(x + w - 0.15, y + h - 0.15, 14), iso(x + w - 0.15, y + h - 0.15, 22), iso(x + 0.15, y + h - 0.15, 22)], '#d0453a');
    poly([iso(x + 0.3, y + h - 0.15, 2), iso(x + w - 0.3, y + h - 0.15, 2), iso(x + w - 0.3, y + h - 0.15, 11), iso(x + 0.3, y + h - 0.15, 11)], '#7fb6d8');
    const c = iso(x + w / 2, y + h - 0.15, 18); ctx.save(); ctx.translate(c[0], c[1]); ctx.transform(1, -0.5, 0, 1, 0, 0); ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('星光商场', 0, 0); ctx.restore();
  } else if (d.k === 'office') {
    const H = d.lo ? 80 : 118;
    box(x + 0.22, y + 0.22, x + w - 0.22, y + h - 0.22, 0, H, '#9fb4c6');
    for (let z = 4; z < H - 4; z += 6) { poly([iso(x + 0.25, y + h - 0.22, z), iso(x + w - 0.25, y + h - 0.22, z), iso(x + w - 0.25, y + h - 0.22, z + 3.5), iso(x + 0.25, y + h - 0.22, z + 3.5)], '#7db3d8'); poly([iso(x + w - 0.22, y + 0.25, z), iso(x + w - 0.22, y + h - 0.25, z), iso(x + w - 0.22, y + h - 0.25, z + 3.5), iso(x + w - 0.22, y + 0.25, z + 3.5)], '#5487ad'); }
    box(x + 0.6, y + 0.6, x + w - 0.6, y + h - 0.6, H, H + 8, '#8496a8');
  } else if (d.k === 'school') {
    poly(diamond(x + 0.08, y + 2.1, 1.84, 1.8, 0), '#c76a4a');
    const c = iso(x + 1, y + 3); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c[0], c[1], 26, 13, 0, 0, 6.283); ctx.stroke();
    ctx.fillStyle = '#6fae5a'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 20, 9, 0, 0, 6.283); ctx.fill();
    box(x + 0.2, y + 0.2, x + 1.8, y + 1.8, 0, 3 * FH + 3, '#ead9c0');
    windows(x + 0.2, y + 0.2, x + 1.8, y + 1.8, 2, 3, FH, '#3f5f7a', 0, 5);
    hipRoof(x + 0.2, y + 0.2, x + 1.8, y + 1.8, 3 * FH + 3, 12, '#b0563c');
    const a = iso(x + 1.92, y + 1.92, 0), b = iso(x + 1.92, y + 1.92, 34); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.fillStyle = '#e03a2e'; ctx.fillRect(b[0], b[1], 10, 6 + Math.sin(t * 3) * 0.6);
  } else if (d.k === 'factory') {
    box(x + 0.15, y + 0.15, x + w - 0.15, y + h - 0.15, 0, 18, '#a9a39a');
    for (let k = 0; k < 3; k++) { const a = x + 0.15 + k * 0.57; poly([iso(a, y + h - 0.15, 18), iso(a + 0.57, y + h - 0.15, 18), iso(a, y + h - 0.15, 26)], '#8b857c'); }
    for (const [a, b] of [[0.45, 0.5], [0.9, 0.4]]) { box(x + a, y + b, x + a + 0.16, y + b + 0.16, 18, 46, '#b55d4c'); const s = iso(x + a + 0.08, y + b + 0.08, 46); for (let k = 0; k < 4; k++) { const ph = (t * 0.35 + k / 4 + a) % 1; ctx.fillStyle = 'rgba(170,170,165,' + (0.5 * (1 - ph)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(s[0] + ph * 14, s[1] - ph * 26, 3 + ph * 7, 0, 6.283); ctx.fill(); } }
  } else if (d.k === 'metro') {
    poly(diamond(x + 0.15, y + 0.15, 0.7, 0.7, 0), '#cfc6b5');
    box(x + 0.3, y + 0.3, x + 0.75, y + 0.75, 0, 12, '#e8e2d6');
    poly(diamond(x + 0.25, y + 0.25, 0.55, 0.55, 12), '#2a6fb8');
    const c = iso(x + 0.52, y + 0.52, 26); ctx.fillStyle = '#d0302a'; ctx.beginPath(); ctx.arc(c[0], c[1], 6, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('M', c[0], c[1] + 0.5);
    const a = iso(x + 0.52, y + 0.52, 12); ctx.strokeStyle = '#555'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1] + 6); ctx.stroke();
  }
}

/* ---------- cars & clouds ---------- */
function initAmbient() {
  RND.cars = [];
  const lanesX = [2, 7, 12], lanesY = [4, 9, 14];
  for (let k = 0; k < 14; k++) {
    const ax = k % 2 === 0, line = ax ? lanesX[k % 3] : lanesY[k % 3], dir = (k >> 1) % 2 ? 1 : -1;
    RND.cars.push({ ax, line: line + (dir > 0 ? 0.32 : 0.68), pos: Math.random() * (N + 2 * MARGIN) - MARGIN, dir, sp: 1.1 + Math.random() * 0.9, col: ['#e8e4dc', '#d1453b', '#2f6db3', '#f2c14e', '#3a3f47', '#6fb5a7'][k % 6] });
  }
  RND.clouds = Array.from({ length: 5 }, (_, k) => ({ x: Math.random(), y: 0.1 + Math.random() * 0.7, s: 0.6 + Math.random() * 0.8, v: 0.004 + Math.random() * 0.006 }));
}
function stepAmbient(dt) {
  for (const c of RND.cars) { c.pos += c.dir * c.sp * dt; const L = N + MARGIN; if (c.pos > L) c.pos = -MARGIN; if (c.pos < -MARGIN) c.pos = L; }
  for (const c of RND.clouds) { c.x += c.v * dt; if (c.x > 1.3) c.x = -0.3; }
}
function drawCar(c) {
  const len = 0.32, wd = 0.17;
  let x0, y0, x1, y1;
  if (c.ax) { x0 = c.pos; x1 = c.pos + len; y0 = c.line - wd / 2; y1 = c.line + wd / 2; } else { y0 = c.pos; y1 = c.pos + len; x0 = c.line - wd / 2; x1 = c.line + wd / 2; }
  box(x0, y0, x1, y1, 0.5, 4, c.col);
  const m = 0.08; box(x0 + (c.ax ? m : 0.02), y0 + (c.ax ? 0.02 : m), x1 - (c.ax ? m : 0.02), y1 - (c.ax ? 0.02 : m), 4, 7, shade(c.col, 0.1), { t: -0.2 });
}

/* ---------- frame ---------- */
function render(dt) {
  RND.t += dt; stepAmbient(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, '#9ccbe0'); g.addColorStop(1, '#7cae8a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!G) return;
  const z = CAM.z;
  ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (VW / 2 - CAM.x * z), DPR * (VH / 2 - CAM.y * z));
  ctx.lineJoin = 'round';
  drawGround();
  // district tint when highlighted
  if (RND.hiD >= 0) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (G.tdist[ti(x, y)] === RND.hiD) poly(diamond(x, y, 1, 1, 0), 'rgba(255,230,140,.16)');
  // sortable objects
  const objs = [];
  for (const p of G.props) objs.push({ k: p.x + p.w / 2 + p.y + p.h / 2, p });
  for (const d of G.deco) objs.push({ k: d.x + d.w / 2 + d.y + d.h / 2, d });
  for (const t of decoTrees()) objs.push({ k: t.x + t.y, t });
  for (const c of RND.cars) objs.push({ k: (c.ax ? c.pos + 0.16 + c.line : c.line + c.pos + 0.16), c });
  objs.sort((a, b) => a.k - b.k);
  const sel = STATE.sel, hov = STATE.hover;
  for (const o of objs) {
    if (o.p) drawProp(o.p, o.p.id === hov, o.p.id === sel);
    else if (o.d) drawDeco(o.d);
    else if (o.t) (o.t.pine ? pine : tree)(o.t.x, o.t.y, o.t.s, o.t.v);
    else drawCar(o.c);
  }
  // pick polygons (front first)
  RND.pick = G.props.map(p => {
    const e = 0.1, zt = propTopZ(p), pts = [];
    for (const [a, b] of [[p.x + e, p.y + e], [p.x + p.w - e, p.y + e], [p.x + p.w - e, p.y + p.h - e], [p.x + e, p.y + p.h - e]]) { pts.push(iso(a, b, 0)); pts.push(iso(a, b, zt)); }
    return { id: p.id, k: p.x + p.y + p.w / 2 + p.h / 2, poly: hull(pts) };
  }).sort((a, b) => b.k - a.k);
  // screen-space overlays
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawLabels();
  for (const c of RND.clouds) { const cx = c.x * VW, cy = c.y * VH, s = c.s * 80; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.ellipse(cx, cy, s * 2, s * 0.7, 0, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + s * 0.6, cy - s * 0.3, s, s * 0.55, 0, 0, 6.283); ctx.fill(); }
}
function hull(P) {
  P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function inPoly(pt, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function pickAt(sx, sy) { const w = s2w(sx, sy); for (const r of RND.pick) if (inPoly(w, r.poly)) return r.id; return -1; }

function rr2(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawLabels() {
  const z = CAM.z;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // district names
  if (z < 1.25) {
    const al = clamp((1.25 - z) / 0.5, 0, 1) * 0.9;
    ctx.font = '700 ' + Math.round(clamp(15 * z + 4, 12, 20)) + 'px "Noto Sans SC",sans-serif';
    for (let i = 0; i < DISTS.length; i++) {
      const c = distCenter(i), s = w2s(...iso(c[0], c[1], 0));
      ctx.fillStyle = 'rgba(10,18,28,' + (al * 0.55).toFixed(2) + ')'; const tw = ctx.measureText(DISTS[i].n).width + 16; rr2(s[0] - tw / 2, s[1] - 12, tw, 24, 12); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + al.toFixed(2) + ')'; ctx.fillText(DISTS[i].n, s[0], s[1]);
    }
  }
  // price tags
  if (window.__dbg && __dbg.notags) return;
  const showAll = z >= 0.62;
  const tags = [];
  for (const p of G.props) {
    const listed = p.list && p.owner === -1, mine = p.owner === ME && p.owner >= 0;
    if (!listed && !mine) continue;
    if (!showAll && p.id !== STATE.sel && p.kind !== 'mansion' && !(listed && p.list.tag === 'hot')) continue;
    const s = w2s(...iso(p.x + p.w / 2, p.y + p.h / 2, propTopZ(p) + 8));
    if (s[0] < -60 || s[0] > VW + 60 || s[1] < -30 || s[1] > VH + 30) continue;
    tags.push({ p, s, listed, mine });
  }
  tags.sort((a, b) => a.s[1] - b.s[1]);
  ctx.font = '600 13px Oswald,"Noto Sans SC",sans-serif';
  for (const { p, s, listed, mine } of tags) {
    let txt, bg, fg = '#fff', badge = null;
    if (p.kind === 'mansion') { txt = '豪宅 ' + fmtM(p.list ? p.list.ask : val(p)); bg = '#c9952a'; fg = '#1d1406'; }
    else if (listed) { txt = fmtM(p.list.ask); bg = 'rgba(16,24,36,.88)'; const d = dealOf(p, ME); badge = d.k === 'great' ? ['超值', '#f5c451'] : d.k === 'good' ? ['划算', '#2c9b6c'] : d.k === 'high' ? ['贵', '#56657a'] : null; }
    else { const a = sellAdvice(p), pr = p.offer * (1 - sellFee()) - p.paid; txt = p.reno ? '装修中' : (pr >= 0 ? '赚' : '亏') + fmtM(Math.abs(pr)).replace('¥', ''); bg = p.reno ? 'rgba(120,90,40,.9)' : pr >= 0 ? 'rgba(200,60,50,.92)' : 'rgba(30,140,90,.92)'; if (a.k === 'sell') badge = ['卖', '#f5c451']; }
    const sel = p.id === STATE.sel, tw = ctx.measureText(txt).width + 14, bw = badge ? (badge[0].length > 1 ? 34 : 22) : 0, W = tw + bw, H = 21;
    const x = s[0] - W / 2, y = s[1] - H - 6 - (sel ? 4 + Math.abs(Math.sin(RND.t * 4)) * 4 : 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr2(x + 1, y + 2, W, H, 6); ctx.fill();
    ctx.fillStyle = bg; rr2(x, y, W, H, 6); ctx.fill();
    if (sel) { ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(s[0] - 5, y + H); ctx.lineTo(s[0] + 5, y + H); ctx.lineTo(s[0], y + H + 6); ctx.closePath(); ctx.fillStyle = bg; ctx.fill();
    if (badge) { ctx.fillStyle = badge[1]; rr2(x + 2, y + 2, bw - 3, H - 4, 4); ctx.fill(); ctx.fillStyle = badge[1] === '#f5c451' ? '#1d1406' : '#fff'; ctx.font = '700 11px "Noto Sans SC",sans-serif'; ctx.fillText(badge[0], x + 2 + (bw - 3) / 2, y + H / 2 + 0.5); ctx.font = '600 13px Oswald,"Noto Sans SC",sans-serif'; }
    ctx.fillStyle = fg; ctx.fillText(txt, x + bw + tw / 2, y + H / 2 + 1);
  }
  // floating money pops
  RND.pulse = RND.pulse.filter(f => (f.t += 1 / 60) < 1.6);
  ctx.font = '700 17px Oswald,"Noto Sans SC",sans-serif';
  for (const f of RND.pulse) {
    const p = G.props[f.id]; if (!p) continue;
    const s = w2s(...iso(p.x + p.w / 2, p.y + p.h / 2, propTopZ(p) + 30 + f.t * 30));
    ctx.globalAlpha = clamp(1.6 - f.t, 0, 1); ctx.fillStyle = f.col; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; ctx.strokeText(f.txt, s[0], s[1]); ctx.fillText(f.txt, s[0], s[1]); ctx.globalAlpha = 1;
  }
}
const _dc = {};
function distCenter(i) {
  if (_dc[i]) return _dc[i];
  let sx = 0, sy = 0, n = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (G.tdist[ti(x, y)] === i) { sx += x + 0.5; sy += y + 0.5; n++; }
  if (i === DI.river) sy -= 0.6;
  return (_dc[i] = [sx / n, sy / n]);
}
function popMoney(id, txt, col) { RND.pulse.push({ id, txt, col, t: 0 }); }

/* ---------- camera ---------- */
function viewInsets() {
  const narrow = innerWidth <= 760 || PHONE.matches;
  if (narrow) return { l: 0, r: 0, t: 60, b: 70 };
  return { l: $('side') && !$('hud').classList.contains('hidden') ? 320 : 0, r: STATE.sel >= 0 ? 350 : 0, t: 80, b: 84 };
}
function focusTile(x, y, zoom) {
  const ins = viewInsets(), [ix, iy] = iso(x, y, 0), z = zoom || CAM.z;
  const ox = (ins.l - ins.r) / 2, oy = (ins.t - ins.b) / 2;
  CAM.tx = ix - ox / z; CAM.ty = iy - 30 - oy / z; CAM.tz = z;
}
function fitCam() {
  const ins = viewInsets(), w = VW - ins.l - ins.r, h = VH - ins.t - ins.b;
  const z = clamp(Math.min(w / (N * TW * 0.95), h / (N * TH * 1.05)), 0.35, 1.6);
  CAM.z = z; CAM.x = (ins.r - ins.l) / 2 / z; CAM.y = N * TH / 2 - 20 + (ins.b - ins.t) / 2 / z; CAM.tx = CAM.ty = CAM.tz = null;
}
function camStep(dt) {
  const k = Math.min(1, dt * 7);
  if (CAM.tx != null) { CAM.x = lerp(CAM.x, CAM.tx, k); CAM.y = lerp(CAM.y, CAM.ty, k); if (Math.abs(CAM.x - CAM.tx) < 0.5 && Math.abs(CAM.y - CAM.ty) < 0.5) CAM.tx = CAM.ty = null; }
  if (CAM.tz != null) { CAM.z = lerp(CAM.z, CAM.tz, k); if (Math.abs(CAM.z - CAM.tz) < 0.003) CAM.tz = null; }
  const R = N * TW / 2 + 60; CAM.x = clamp(CAM.x, -R, R); CAM.y = clamp(CAM.y, -80, N * TH + 80);
}
