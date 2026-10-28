/* ================= terrain: heightfield from zone features, water, colliders, scatter ================= */
const TER = { Z: null, size: 0, seg: 0, cell: 1, h: null, wl: null, pm: null, chunks: new Map(), water: [] };
const COL = { cell: 8, map: new Map(), list: [] }; // static colliders: circles {x,z,r,top} and boxes {x,z,hw,hd,c,s,top}
function colKey(i, j) { return i * 73856093 ^ j * 19349663; }
function addCol(c) { COL.list.push(c); const R = c.r || Math.hypot(c.hw, c.hd), s = COL.cell; for (let i = Math.floor((c.x - R) / s); i <= Math.floor((c.x + R) / s); i++) for (let j = Math.floor((c.z - R) / s); j <= Math.floor((c.z + R) / s); j++) { const k = colKey(i, j); let a = COL.map.get(k); if (!a) COL.map.set(k, a = []); a.push(c); } return c; }
function colNear(x, z) { const s = COL.cell, k = colKey(Math.floor(x / s), Math.floor(z / s)); return COL.map.get(k) || []; }
function clearCols() { COL.map.clear(); COL.list.length = 0; }
/* push a circle (x,z,r) out of static colliders; returns corrected [x,z]. y = feet height so you can walk over low things */
function collide(x, z, r, y) {
  for (let pass = 0; pass < 2; pass++) {
    const near = colNear(x, z);
    for (const c of near) {
      if (c.off) continue;
      if (y != null && c.top != null && y >= c.top - 0.15) continue;
      if (c.r) { const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-6) { x = c.x + dx / d * m; z = c.z + dz / d * m; } }
      else { const dx = x - c.x, dz = z - c.z, lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c; const px = clamp(lx, -c.hw, c.hw), pz = clamp(lz, -c.hd, c.hd); let ex = lx - px, ez = lz - pz, d = Math.hypot(ex, ez);
        if (d < r) { if (d < 1e-6) { const ox = c.hw - Math.abs(lx), oz = c.hd - Math.abs(lz); if (ox < oz) { ex = Math.sign(lx) || 1; ez = 0; d = 0; const nl = Math.sign(lx) * (c.hw + r); const nx = nl, nz = lz; x = c.x + nx * c.c - nz * c.s; z = c.z + nx * c.s + nz * c.c; } else { const nz = Math.sign(lz) * (c.hd + r), nx = lx; x = c.x + nx * c.c - nz * c.s; z = c.z + nx * c.s + nz * c.c; } }
          else { const k = r / d, nx = px + ex * k, nz = pz + ez * k; x = c.x + nx * c.c - nz * c.s; z = c.z + nx * c.s + nz * c.c; } } }
    }
  }
  return [x, z];
}
/* height of standable collider tops (rocks, platforms) under a point */
function topAt(x, z, y) { let best = -1e9; for (const c of colNear(x, z)) { if (c.off || c.top == null || !c.stand) continue; let inside; if (c.r) inside = d2(x, z, c.x, c.z) < c.r * c.r; else { const dx = x - c.x, dz = z - c.z, lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c; inside = Math.abs(lx) < c.hw && Math.abs(lz) < c.hd; } if (inside && c.top <= y + BAL.stepUp && c.top > best) best = c.top; } return best; }

/* ---------- height function ---------- */
function zoneHeight(Z, x, z) {
  const B = Z.base; let h = B.h + fbm(x * B.sc, z * B.sc, 4) * B.amp + (B.ridge ? (ridged(x * B.rsc, z * B.rsc, 4) - 0.5) * B.ridge : 0);
  h += fbm(x * 0.06, z * 0.06, 2) * (B.fine || 0.35);
  if (Z.edge) { const S = Z.size / 2, d = Math.min(S - Math.abs(x), S - Math.abs(z)), e = 1 - sstep(0, Z.edge.w, d); h += e * e * Z.edge.h * (0.55 + 0.45 * ridged(x * 0.008 + 3, z * 0.008 - 2, 4)); }
  for (const F of Z.feat) {
    switch (F.t) {
      case 'mtn': case 'hill': { const d = Math.hypot(x - F.x, z - F.z); if (d > F.r) break; const k = 1 - d / F.r, s = F.t === 'mtn' ? Math.pow(k, 1.5) * (1 - (F.rough ?? 0.35) + (F.rough ?? 0.35) * ridged(x * 0.02 + F.x, z * 0.02 + F.z, 4)) : smooth(k); h += F.h * s; break; }
      case 'flat': { const d = Math.hypot(x - F.x, z - F.z), w = 1 - sstep(F.r, F.r + F.fall, d); if (w > 0) h = lerp(h, F.h + (F.n ? fbm(x * 0.05, z * 0.05, 2) * F.n : 0), w); break; }
      case 'mesa': { const d = Math.hypot((x - F.x) / (F.sx || 1), (z - F.z) / (F.sz || 1)), ang = Math.atan2(z - F.z, x - F.x), rr = F.r * (1 + 0.12 * vnoise(Math.cos(ang) * 2 + F.x, Math.sin(ang) * 2)), w = 1 - sstep(rr, rr + F.fall, d); if (w > 0) h = Math.max(h, lerp(h, F.h + fbm(x * 0.04, z * 0.04, 3) * (F.n ?? 1.5), w)); break; }
      case 'pit': { const d = Math.hypot(x - F.x, z - F.z); if (d < F.r) h -= F.h * smooth(1 - d / F.r); break; }
      case 'ridgeLine': { const { d } = polyDist(x, z, F.pts); if (d < F.w) h += F.h * Math.pow(1 - d / F.w, 1.3) * (0.7 + 0.3 * ridged(x * 0.03, z * 0.03, 3)); break; }
      case 'fn': h = F.fn(x, z, h); break;
    }
  }
  // water carving last so rivers cut through everything
  for (const F of Z.feat) {
    if (F.t === 'river') { const { d } = polyDist(x, z, F.pts), hw = F.w / 2, bank = F.bank || 8; if (d < hw + bank) { const tb = d < hw ? F.wl - F.bed * (1 - (d / hw) ** 2) - 0.2 : F.wl + 0.25 + (d - hw) / bank * (F.bankH || 3); h = Math.min(h, d < hw ? tb : lerp(tb, h, sstep(hw, hw + bank, d) * 0.65)); } }
    else if (F.t === 'lake') { const d = Math.hypot((x - F.x) / (F.sx || 1), (z - F.z) / (F.sz || 1)), ang = Math.atan2(z - F.z, x - F.x), r = F.r * (1 + 0.1 * vnoise(Math.cos(ang) * 1.7 + 9, Math.sin(ang) * 1.7)), bank = F.bank || 10; if (d < r + bank) { const tb = d < r ? F.wl - F.bed * smooth(1 - d / r) - 0.25 : F.wl + 0.25 + (d - r) / bank * 2.5; h = Math.min(h, d < r ? tb : lerp(tb, h, sstep(r, r + bank, d) * 0.6)); } }
  }
  return h;
}
function waterAtFeat(Z, x, z) { let wl = -1e9; for (const F of Z.feat) { if (F.t === 'river') { const { d } = polyDist(x, z, F.pts); if (d < F.w / 2 + 2) wl = Math.max(wl, F.wl); } else if (F.t === 'lake') { const d = Math.hypot((x - F.x) / (F.sx || 1), (z - F.z) / (F.sz || 1)); if (d < F.r * 1.12 + 2) wl = Math.max(wl, F.wl); } } return wl; }
function pathMaskFeat(Z, x, z, crisp) { let m = 0; const e = crisp ? 0.9 : 2.5, jit = crisp ? vnoise(x * 0.45, z * 0.45) * 0.7 : 0; for (const F of Z.feat) if (F.t === 'path') { if (F.bb && (x < F.bb[0] || x > F.bb[2] || z < F.bb[1] || z > F.bb[3])) continue; const { d } = polyDist(x, z, F.pts); m = Math.max(m, 1 - sstep(F.w * 0.5 + jit, F.w * 0.5 + jit + e, d)); } else if (F.t === 'plaza') { const d = Math.hypot(x - F.x, z - F.z); m = Math.max(m, (1 - sstep(F.r, F.r + 4, d)) * (F.k ?? 1)); } return m; }

/* ---------- grid sampling ---------- */
function gidx(x, z) { const S = TER.size / 2, c = TER.cell; return [(x + S) / c, (z + S) / c]; }
function terrH(x, z) {
  const N = TER.seg; let [gx, gz] = gidx(x, z); gx = clamp(gx, 0, N - 1e-4); gz = clamp(gz, 0, N - 1e-4);
  const i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j, W = N + 1, H = TER.h;
  // match the triangle split used by PlaneGeometry (a-b-d / b-c-d)
  const h00 = H[j * W + i], h10 = H[j * W + i + 1], h01 = H[(j + 1) * W + i], h11 = H[(j + 1) * W + i + 1];
  return fx + fz < 1 ? h00 + (h10 - h00) * fx + (h01 - h00) * fz : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
}
function terrN(x, z) { const e = TER.cell; const hx = terrH(x + e, z) - terrH(x - e, z), hz = terrH(x, z + e) - terrH(x, z - e); const L = Math.hypot(hx, 2 * e, hz); return { x: -hx / L, y: 2 * e / L, z: -hz / L }; }
function slopeAt(x, z) { return 1 - terrN(x, z).y; }
function waterAt(x, z) { const N = TER.seg; let [gx, gz] = gidx(x, z); const i = clamp(Math.round(gx), 0, N), j = clamp(Math.round(gz), 0, N); return TER.wl[j * (N + 1) + i]; }
function pathAt(x, z) { const N = TER.seg; let [gx, gz] = gidx(x, z); gx = clamp(gx, 0, N - 1e-6); gz = clamp(gz, 0, N - 1e-6); const i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j, P = TER.pm, r = N + 1; const v = lerp(lerp(P[j * r + i], P[j * r + i + 1], fx), lerp(P[(j + 1) * r + i], P[(j + 1) * r + i + 1], fx), fz); return v; }
/* ground height including standable props */
function groundH(x, z, y = 1e9) { return Math.max(terrH(x, z), topAt(x, z, y)); }
function inBounds(x, z, m = 6) { const S = TER.size / 2 - m; return Math.abs(x) < S && Math.abs(z) < S; }


/* ---------- build the height / water / path grids ---------- */
function buildTerrain(Z) {
  for (const F of Z.feat) if (F.t === 'path' && !F.bb) { const xs = F.pts.map(p => p[0]), zs = F.pts.map(p => p[1]), m = F.w + 4; F.bb = [Math.min(...xs) - m, Math.min(...zs) - m, Math.max(...xs) + m, Math.max(...zs) + m]; }
  const N = Z.seg || 224, W = N + 1, S = Z.size, cell = S / N;
  Object.assign(TER, { Z, size: S, seg: N, cell, h: new Float32Array(W * W), wl: new Float32Array(W * W), pm: new Float32Array(W * W) });
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { const x = -S / 2 + i * cell, z = -S / 2 + j * cell, k = j * W + i; TER.h[k] = zoneHeight(Z, x, z); TER.wl[k] = waterAtFeat(Z, x, z); TER.pm[k] = pathMaskFeat(Z, x, z); }
  for (let pass = 0; pass < 3; pass++) { const src = TER.h.slice(); for (let j = 2; j < W - 2; j++) for (let i = 2; i < W - 2; i++) { const k = j * W + i, m = TER.pm[k]; if (m <= 0.01) continue; let s = 0; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) s += src[(j + a) * W + i + b]; TER.h[k] = lerp(src[k], s / 25, m * 0.85); } }
  TER.chunks.clear();
  // sparkle points along water for the per-frame shimmer
  TER.water = []; for (let n = 0; n < 6000; n++) { const x = (hash2(n, 7) - 0.5) * S, z = (hash2(n, 13) - 0.5) * S; const w = waterAt(x, z); if (w > terrH(x, z) + 0.3) TER.water.push([x, z, hash2(n, 29) * TAU]); }
}
/* ---------- painted ground chunks ---------- */
const CH = { size: 16, ppm: 40, max: 44 };
function groundColor(x, z, out) {
  const Z = TER.Z, B = Z.biome, h = terrH(x, z), n = terrN(x, z), sl = 1 - n.y, wl = waterAt(x, z), pm = pathMaskFeat(Z, x, z, true);
  const n1 = fbm(x * 0.02, z * 0.02, 3), n2 = vnoise(x * 0.11, z * 0.11), n3 = vnoise(x * 0.5, z * 0.5);
  let c = mixRGB(B.grass1, B.grass2, clamp(0.5 + n1 * 1.3, 0, 1)); c = mixRGB3(c, B.grass3 || B.grass2, clamp(n2 * 0.7, 0, 0.55));
  const rk = sstep(B.rockSl ?? 0.24, (B.rockSl ?? 0.24) + 0.18, sl + n2 * 0.05); if (rk > 0) c = mixRGB3(c, mixRGB(B.rock, B.rock2 || B.rock, clamp(0.5 + n3, 0, 1)), rk);
  if (B.hiRock && h > B.hiRock) c = mixRGB3(c, B.rock, sstep(B.hiRock, B.hiRock + 25, h));
  if (B.snow && h > B.snowH) c = mixRGB3(c, B.snow, sstep(B.snowH, B.snowH + 12, h + n1 * 8));
  if (pm > 0) c = mixRGB3(c, mixRGB(B.dirt, B.dirt2 || B.dirt, clamp(0.5 + n3, 0, 1)), pm * 0.95);
  if (Z.paint) for (const P of Z.paint) { const d = Math.hypot(x - P.x, z - P.z); if (d < P.r) c = mixRGB3(c, P.col, (P.k ?? 1) * sstep(P.r, P.r * (P.soft ?? 0.6), d) * (P.noise ? clamp(0.6 + n2, 0, 1) : 1)); }
  let water = 0; if (wl > -1e8) { if (h < wl + 0.9) c = mixRGB3(c, B.sand, sstep(wl + 0.9, wl + 0.15, h)); const d = wl - h; if (d > 0) { water = clamp(d / 2.5, 0, 1); const W2 = Z.water || {}; c = mixRGB3(mixRGB(W2.shal || 0x6ac8c8, W2.deep || 0x1f6c8a, water), c, d < 0.25 ? 0.5 : 0); } }
  // hillshade: light from the upper left
  const lam = clamp(1.0 + (-n.x * 0.55 - n.z * 0.75) * 2.0, 0.55, 1.22);
  const k = water > 0 ? lerp(lam, 1, 0.7) : lam;
  out[0] = clamp(c[0] * k, 0, 255); out[1] = clamp(c[1] * k, 0, 255); out[2] = clamp(c[2] * k, 0, 255); return water;
}
function mixRGB(a, b, t) { const A = typeof a === 'number' ? [a >> 16 & 255, a >> 8 & 255, a & 255] : a, B = typeof b === 'number' ? [b >> 16 & 255, b >> 8 & 255, b & 255] : b; return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]; }
function mixRGB3(a, b, t) { return mixRGB(a, b, t); }
function paintChunk(ci, cj) {
  const S = CH.size, P = CH.ppm, px = S * P, c = cnv(px, px), g = c.getContext('2d'), x0 = ci * S, z0 = cj * S;
  // 1) smooth low-res colour field
  const n = 33, lo = cnv(n, n), lg = lo.getContext('2d'), id = lg.createImageData(n, n), out = [0, 0, 0], wmask = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = x0 + (i - 0.5) / (n - 2) * S, z = z0 + (j - 0.5) / (n - 2) * S, q = (j * n + i) * 4; wmask[j * n + i] = groundColor(x, z, out); id.data[q] = out[0]; id.data[q + 1] = out[1]; id.data[q + 2] = out[2]; id.data[q + 3] = 255; }
  lg.putImageData(id, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; const st = px / (n - 2); g.drawImage(lo, -st * 0.5, -st * 0.5, st * n, st * n);
  // 2) details: grass strokes, dirt specks, flowers, pebbles, water ripples
  const B = TER.Z.biome, R = mulberry32(ci * 7919 + cj * 104729);
  const grassDens = TER.Z.grassDens || (() => 1);
  for (let q = 0; q < 900; q++) { const lx = R() * S, lz = R() * S, x = x0 + lx, z = z0 + lz; const h = terrH(x, z), w = waterAt(x, z), pm = pathAt(x, z), sl = slopeAt(x, z); const sx = lx * P, sy = lz * P;
    if (w > h - 0.1) { if (R() < 0.5) { g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx - 8, sy); g.quadraticCurveTo(sx, sy - 3, sx + 8, sy); g.stroke(); } continue; }
    if (pm > 0.45) { if (R() < 0.35) { g.fillStyle = R() < 0.5 ? 'rgba(90,64,36,.16)' : 'rgba(255,240,200,.14)'; g.beginPath(); g.ellipse(sx, sy, 2 + R() * 3, 1 + R() * 1.5, 0, 0, TAU); g.fill(); } if (R() < 0.018) { g.fillStyle = R() < 0.5 ? '#a8a092' : '#968e80'; g.beginPath(); g.ellipse(sx, sy, 2.5 + R() * 2.5, 1.6 + R() * 1.6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(sx - 1, sy - 0.8, 1.2, 0.6, 0, 0, TAU); g.fill(); } continue; }
    if (pm > 0.18) { if (R() < 0.6) { const hh = 3 + R() * 4; g.strokeStyle = R() < 0.5 ? 'rgba(60,100,40,.5)' : 'rgba(160,190,90,.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(sx - 1.5, sy); g.lineTo(sx - 2.5, sy - hh); g.moveTo(sx + 1.5, sy); g.lineTo(sx + 2.5, sy - hh * 0.8); g.stroke(); } continue; }
    if (sl > 0.32) { g.strokeStyle = 'rgba(40,36,30,.25)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(sx, sy - 4); g.lineTo(sx + 1, sy + 6); g.stroke(); continue; }
    if (R() > grassDens(x, z)) continue;
    const dark = R() < 0.5, tone = R(); g.strokeStyle = dark ? (tone < 0.5 ? 'rgba(30,70,25,.42)' : 'rgba(40,90,50,.38)') : (tone < 0.5 ? 'rgba(220,240,160,.38)' : 'rgba(180,225,120,.36)'); g.lineWidth = 1.4; g.lineCap = 'round'; const hh = (4 + R() * 5) * (R() < 0.08 ? 1.8 : 1); g.beginPath(); g.moveTo(sx - 2, sy); g.lineTo(sx - 3.5, sy - hh); g.moveTo(sx, sy); g.lineTo(sx + 0.5, sy - hh * 1.2); g.moveTo(sx + 2, sy); g.lineTo(sx + 4, sy - hh * 0.9); g.stroke();
    if (R() < 0.035) { const cols = ['#ffffff', '#ffe060', '#ff9ab8', '#c0a0ff', '#ff7a5a']; const cc = cols[Math.floor(R() * 5)]; for (let f = 0; f < 3; f++) { g.fillStyle = cc; g.beginPath(); g.arc(sx + (R() - 0.5) * 12, sy + (R() - 0.5) * 8, 2.2, 0, TAU); g.fill(); } } }
  // shoreline foam
  g.strokeStyle = 'rgba(240,252,255,.55)'; g.lineWidth = 2;
  for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const wv = wmask[j * n + i] > 0, e = wmask[j * n + i + 1] > 0, s = wmask[(j + 1) * n + i] > 0; const sx = (i - 0.5) * st, sy = (j - 0.5) * st; if (wv !== e) { g.beginPath(); g.moveTo(sx + st * 0.5, sy - st * 0.4); g.quadraticCurveTo(sx + st * 0.62, sy, sx + st * 0.5, sy + st * 0.4); g.stroke(); } if (wv !== s) { g.beginPath(); g.moveTo(sx - st * 0.4, sy + st * 0.5); g.quadraticCurveTo(sx, sy + st * 0.62, sx + st * 0.4, sy + st * 0.5); g.stroke(); } }
  return c;
}
function getChunk(ci, cj) { const key = ci + ',' + cj; let c = TER.chunks.get(key); if (c) { c.t = V.t; return c; } c = { cv: paintChunk(ci, cj), t: V.t }; TER.chunks.set(key, c); if (TER.chunks.size > CH.max) { let old = null, ot = 1e9; for (const [k2, v] of TER.chunks) if (v.t < ot) { ot = v.t; old = k2; } TER.chunks.delete(old); } return c; }
let chunkBudget = 0;
function drawGround(g) {
  const K = k(), S = CH.size, [wx0, wz0] = s2w(-40, -40), [wx1, wz1] = s2w(V.W + 40, V.H + 40); chunkBudget = 3;
  g.fillStyle = '#5a7a40'; g.fillRect(0, 0, V.W, V.H);
  for (let cj = Math.floor(wz0 / S); cj <= Math.floor(wz1 / S); cj++) for (let ci = Math.floor(wx0 / S); ci <= Math.floor(wx1 / S); ci++) {
    const key = ci + ',' + cj; let c = TER.chunks.get(key); if (!c) { if (chunkBudget-- <= 0) continue; c = getChunk(ci, cj); } c.t = V.t;
    const [sx, sy] = w2s(ci * S, cj * S); g.drawImage(c.cv, Math.floor(sx), Math.floor(sy), Math.ceil(S * K) + 1, Math.ceil(S * K) + 1);
  }
  // water shimmer
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(200,240,255,.35)'; g.lineWidth = Math.max(1, 1.5 * V.zoom);
  for (const [x, z, p] of TER.water) { if (!onScreen(x, z, 2)) continue; const a = Math.sin(V.t * 1.6 + p); if (a < 0.3) continue; const [sx, sy] = w2s(x + Math.sin(V.t * 0.4 + p) * 0.4, z); const L = 10 * V.zoom * a; g.globalAlpha = (a - 0.3) * 1.2; g.beginPath(); g.moveTo(sx - L, sy); g.quadraticCurveTo(sx, sy - 3 * V.zoom, sx + L, sy); g.stroke(); }
  g.restore();
}
function prewarmChunks(cx, cz, r = 2) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) getChunk(Math.floor(cx / CH.size) + i, Math.floor(cz / CH.size) + j); }

/* ---------- deterministic scatter ---------- */
function scatterPoints(Z, spec, cb) {
  const S = Z.size / 2 - (spec.margin ?? 10), sp = spec.sp; let n = 0;
  for (let gz = -S; gz < S; gz += sp) for (let gx = -S; gx < S; gx += sp) {
    const seed = spec.seed || 1, hx = hash2(Math.floor(gx / sp) * 3 + seed, Math.floor(gz / sp) * 7 - seed), hz = hash2(Math.floor(gx / sp) * 11 - seed, Math.floor(gz / sp) * 5 + seed * 3);
    const x = gx + hx * sp, z = gz + hz * sp;
    const d = spec.dens(x, z); if (d <= 0 || hash2(Math.floor(x * 7), Math.floor(z * 7) + seed) > d) continue;
    if (!spec.inWater && waterAt(x, z) > terrH(x, z) - 0.6) continue;
    if (!spec.onPath && pathAt(x, z) > 0.15) continue;
    const sl = slopeAt(x, z); if (sl > (spec.slopeMax ?? 0.32)) continue;
    if (Z.clear && Z.clear.some(c => d2(x, z, c.x, c.z) < c.r * c.r)) continue;
    cb(x, z, hash2(Math.floor(x * 13), Math.floor(z * 17)), n++);
  }
}
