/* ================= tile world (星露谷式分区地图) =================
   The world is a grid of 1 m tiles (20 art px). It is split into hand-planned areas (石村, 山林, 石林, 莽牛坡, 狈村边界);
   each area is a rectangle with a foliage/rock wall around it and gaps that lead to the next area.
   Ground is painted tile by tile with hand-made pixel textures; where two ground types meet, the higher one
   (grass over path, foliage over grass, sand over water…) bleeds over with a jagged pixel fringe and a 1-px shadow lip. */
const T = { VOID: 0, GRASS: 1, DIRT: 2, COBBLE: 3, WATER: 4, SAND: 5, GRAVEL: 6, FLOOR: 7, FIELD: 8, WALL: 9, ROCK: 10, PLANK: 11 };
const TPRIO = [-1, 7, 3, 5, 0, 1, 4, 6, 2, 9, 9, 5];
const TFRINGE = [0, 3, 2, 1, 0, 2, 2, 2, 1, 4, 3, 0];
const TSOLID = [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0];
const TG = { N: 640, o: 320, t: new Uint8Array(640 * 640) };
const tidx = (x, z) => { const i = Math.floor(x) + TG.o, j = Math.floor(z) + TG.o; return i < 0 || j < 0 || i >= TG.N || j >= TG.N ? -1 : j * TG.N + i; };
function tget(x, z) { const k = tidx(x, z); return k < 0 ? T.VOID : TG.t[k]; }
function tset(x, z, v) { const k = tidx(x, z); if (k >= 0) TG.t[k] = v; }
function trect(x0, z0, x1, z1, v, only) { for (let z = Math.floor(z0); z <= Math.floor(z1); z++) for (let x = Math.floor(x0); x <= Math.floor(x1); x++) if (only == null || only.includes(tget(x, z))) tset(x, z, v); }
function tdisc(cx, cz, r, v, jag = 0, seed = 1, only) { for (let z = Math.floor(cz - r - 2); z <= Math.ceil(cz + r + 2); z++) for (let x = Math.floor(cx - r - 2); x <= Math.ceil(cx + r + 2); x++) { const a = Math.atan2(z + 0.5 - cz, x + 0.5 - cx), rr_ = r * (1 + jag * vnoise(Math.cos(a) * 2 + seed, Math.sin(a) * 2 + seed)); if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) <= rr_ && (only == null || only.includes(tget(x, z)))) tset(x, z, v); } }
function tpath(pts, w, v, only) { for (let i = 0; i + 1 < pts.length; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az); for (let s = 0; s <= L; s += 0.5) { const x = lerp(ax, bx, s / L), z = lerp(az, bz, s / L); for (let dz = -w / 2; dz <= w / 2; dz += 0.5) for (let dx = -w / 2; dx <= w / 2; dx += 0.5) if (dx * dx + dz * dz <= w * w / 4 && (only == null || only.includes(tget(x + dx, z + dz)))) tset(x + dx, z + dz, v); } } }
const tileSolid = (x, z) => TSOLID[tget(x, z)] === 1;
function solidNear(x, z, r) { return tileSolid(x - r, z) || tileSolid(x + r, z) || tileSolid(x, z - r) || tileSolid(x, z + r * 0.6); }
const tileOpen = (x, z) => { const t = tget(x, z); return t === T.GRASS || t === T.FLOOR || t === T.GRAVEL || t === T.SAND; };
/* ---------- areas ---------- */
const AREAS = [], AREA_BY = {};
function addArea(A) { A.links = []; AREAS.push(A); AREA_BY[A.id] = A; return A; }
function areaAt(x, z) { for (const A of AREAS) if (x >= A.x0 && x <= A.x1 + 1 && z >= A.z0 && z <= A.z1 + 1) return A; return null; }
/* a link joins a gap on one area's edge to a gap on another's: side n/s use x for the gap centre, e/w use z */
function linkAreas(a, sa, ca, b, sb, cb, w = 6) { const A = AREA_BY[a], B = AREA_BY[b]; A.links.push({ side: sa, c: ca, w, to: B, toSide: sb, toC: cb }); B.links.push({ side: sb, c: cb, w, to: A, toSide: sa, toC: ca }); }
function gapPoint(A, side, c, inset) { return side === 'n' ? [c, A.z0 + inset] : side === 's' ? [c, A.z1 + 1 - inset] : side === 'w' ? [A.x0 + inset, c] : [A.x1 + 1 - inset, c]; }
function inGap(A, L, x, z, depth) { const [gx, gz] = gapPoint(A, L.side, L.c, 0); return L.side === 'n' || L.side === 's' ? Math.abs(x - gx) < L.w / 2 && Math.abs(z - gz) < depth : Math.abs(z - gz) < L.w / 2 && Math.abs(x - gx) < depth; }
/* the foliage/rock wall round an area, with gaps for its links and dirt paths leading in */
function areaWalls(A, thick = 3, wallT = T.WALL) {
  for (let z = A.z0; z <= A.z1; z++) for (let x = A.x0; x <= A.x1; x++) { const d = Math.min(x - A.x0, A.x1 - x, z - A.z0, A.z1 - z), n = vnoise(x * 0.18 + A.x0, z * 0.18) * 1.6 + vnoise(x * 0.5, z * 0.5) * 0.6; if (d < thick + n) tset(x, z, wallT); }
  for (const L of A.links) { const [gx, gz] = gapPoint(A, L.side, L.c, 0), h = L.w / 2, D = thick + 4, G = [wallT];
    if (L.side === 'n') trect(gx - h, A.z0, gx + h - 1, A.z0 + D, A.ground, G); else if (L.side === 's') trect(gx - h, A.z1 - D, gx + h - 1, A.z1, A.ground, G); else if (L.side === 'w') trect(A.x0, gz - h, A.x0 + D, gz + h - 1, A.ground, G); else trect(A.x1 - D, gz - h, A.x1, gz + h - 1, A.ground, G);
    const p0 = gapPoint(A, L.side, L.c, 0.5), p1 = gapPoint(A, L.side, L.c, thick + 6); tpath([p0, p1], 3, T.DIRT); }
}
/* where to head for a target in another area: the gap leading there (breadth-first over the area graph) */
function routeTo(x, z, tx, tz) {
  const A = areaAt(x, z), B = areaAt(tx, tz); if (!A || !B || A === B) return { x: tx, z: tz };
  const prev = new Map([[A, null]]), q = [A]; while (q.length) { const C = q.shift(); if (C === B) break; for (const L of C.links) if (!prev.has(L.to)) { prev.set(L.to, { from: C, L }); q.push(L.to); } }
  if (!prev.has(B)) return { x: tx, z: tz }; let C = B, step = null; while (prev.get(C)) { step = prev.get(C); C = step.from; }
  const [gx, gz] = gapPoint(A, step.L.side, step.L.c, 0.6); return { x: gx, z: gz, via: step.L.to.name };
}
/* ---------- tile textures (20×20 px each) ---------- */
const TCOL = {}; { const c = (k, a) => TCOL[k] = a.map(h => rgbOf(h));
  c('grass', ['#3b7330', '#4b8a38', '#5e9e42', '#79b552', '#9ccc6a']); c('dirt', ['#7c5a3a', '#9a7450', '#b08a5e', '#c6a074']); c('cobble', ['#55524a', '#86817a', '#9a958a', '#b0ab9c', '#c8c2b0']);
  c('water', ['#1f5878', '#2c6e94', '#3a86ac', '#5aa6c6', '#bfe6f0']); c('sand', ['#b8a070', '#ccb684', '#dcc898']); c('gravel', ['#5e584c', '#7a7262', '#8e8674', '#a49c88']);
  c('floor', ['#2a4422', '#34522a', '#3e5e30', '#6a5a30']); c('field', ['#5a3c22', '#6e4a2c', '#86603a']); c('wall', ['#122a16', '#1b3a1e', '#285028', '#386a34', '#4e8040']); c('rock', ['#3c3832', '#57524a', '#706a60', '#8a8478']); c('plank', ['#5a3e26', '#7a5636', '#946a44']); c('void', ['#0c0a0e']); }
const thash = (x, y, s = 0) => hash2(x * 7 + s * 131, y * 13 - s * 17);
function texPix(t, gx, gy, out) {
  const tx = Math.floor(gx / 20), ty = Math.floor(gy / 20), u = gx - tx * 20, v = gy - ty * 20, h = thash(gx, gy), by = bayer(gx, gy); let C;
  switch (t) {
    case T.GRASS: { C = TCOL.grass; const n = vnoise(gx / 26, gy / 26) * 0.6 + vnoise(gx / 7, gy / 7) * 0.3; let k = n + (by - 0.5) * 0.25 > 0.22 ? 2 : 1;
      for (let i = 0; i < 7; i++) { const bx = Math.floor(thash(tx, ty, i) * 18) + 1, bv = Math.floor(thash(tx, ty, i + 9) * 16) + 2; const dx = u - bx, dy = v - bv; if (dy === 0 && Math.abs(dx) === 1 || dy === -1 && dx === 0) k = k === 2 ? 3 : 2; if (dy === 1 && dx === 0) k = 0; }
      if (h < 0.035) k = Math.max(0, k - 1); else if (h > 0.985) k = Math.min(4, k + 1); out.set(C[k]); return; }
    case T.DIRT: { C = TCOL.dirt; const n = vnoise(gx / 9, gy / 9) * 0.6; let k = n + (by - 0.5) * 0.3 > 0.2 ? 2 : 1; if (h < 0.06) k = 0; else if (h > 0.975) k = 3; if (thash(tx, ty, 3) < 0.25) { const px = Math.floor(thash(tx, ty, 4) * 16) + 2, py = Math.floor(thash(tx, ty, 5) * 16) + 2; if ((u === px || u === px + 1) && v === py) { out.set(TCOL.gravel[3]); return; } if ((u === px || u === px + 1) && v === py + 1) { out.set(TCOL.gravel[1]); return; } } out.set(C[k]); return; }
    case T.COBBLE: { C = TCOL.cobble; const row = Math.floor(gy / 5), off = (row % 2) * 3 + (row % 3), col = Math.floor((gx + off) / 7), su = (gx + off) % 7, sv = gy % 5;
      if (sv === 0 || su === 0) { out.set(C[0]); return; } const st = thash(col, row, 7), base = st < 0.33 ? 1 : st < 0.75 ? 2 : 3; let k = base; if (sv === 1 || su === 1) k = Math.min(4, base + 1); else if (sv === 4) k = Math.max(1, base - 1); out.set(C[k]); return; }
    case T.WATER: { C = TCOL.water; const w = Math.sin(gy * 0.5 + Math.sin(gx * 0.09) * 2.2); let k = 1 + (vnoise(gx / 30, gy / 30) > 0.2 ? 1 : 0); if (w > 0.93 && (gx + gy * 3) % 11 < 4) k = 3; out.set(C[k]); return; }
    case T.SAND: { C = TCOL.sand; let k = vnoise(gx / 10, gy / 10) + (by - 0.5) * 0.3 > 0.1 ? 2 : 1; if (h < 0.05) k = 0; out.set(C[k]); return; }
    case T.GRAVEL: { C = TCOL.gravel; let k = vnoise(gx / 16, gy / 16) + (by - 0.5) * 0.25 > 0.1 ? 2 : 1; if (h < 0.08) k = 0; else if (h > 0.95) k = 3; const sx = Math.floor(gx / 6), sy = Math.floor(gy / 6); if (thash(sx, sy, 2) < 0.18) { const cx = sx * 6 + 3, cy = sy * 6 + 3, d = Math.hypot(gx - cx, (gy - cy) * 1.3); if (d < 2.2) k = gy < cy ? 3 : 2; else if (d < 2.9 && gy > cy) k = 0; } out.set(C[k]); return; }
    case T.FLOOR: { C = TCOL.floor; let k = vnoise(gx / 20, gy / 20) + (by - 0.5) * 0.2 > 0.15 ? 2 : 1; if (h < 0.07) k = 0; if (h > 0.97) k = 3; if ((u * 3 + v * 5) % 23 === 0 && thash(tx, ty, 1) < 0.7) k = 0; out.set(C[k]); return; }
    case T.FIELD: { C = TCOL.field; const r = gy % 5; let k = r === 0 ? 0 : r === 1 ? 2 : 1; if (h < 0.04) k = 0; out.set(C[k]); return; }
    case T.WALL: { C = TCOL.wall; const cs = 7, cx0 = Math.floor(gx / cs), cy0 = Math.floor(gy / cs); let best = 9, bdy = 0, bdx = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = (cx0 + i) * cs + thash(cx0 + i, cy0 + j, 1) * cs, cy = (cy0 + j) * cs + thash(cx0 + i, cy0 + j, 2) * cs, dx = gx - cx, dy = gy - cy, d = Math.hypot(dx, dy) / (4.2 + thash(cx0 + i, cy0 + j, 3) * 1.6); if (d < best) { best = d; bdx = dx; bdy = dy; } }
      let k = best > 1 ? 0 : best > 0.86 ? 1 : (bdx + bdy < -1.5 ? 4 : bdx + bdy < 1 ? 3 : 2); if (best <= 1 && h < 0.04) k = 1; out.set(C[k]); return; }
    case T.ROCK: { C = TCOL.rock; const cs = 9, cx0 = Math.floor(gx / cs), cy0 = Math.floor(gy / cs); let best = 9, b2 = 9, bdx = 0, bdy = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = (cx0 + i) * cs + thash(cx0 + i, cy0 + j, 6) * cs, cy = (cy0 + j) * cs + thash(cx0 + i, cy0 + j, 7) * cs, dx = gx - cx, dy = gy - cy, dd = Math.hypot(dx, dy * 1.2); if (dd < best) { b2 = best; best = dd; bdx = dx; bdy = dy; } else if (dd < b2) b2 = dd; }
      let k = b2 - best < 1.2 ? 0 : (bdx + bdy * 1.4 < -3 ? 3 : bdx + bdy * 1.4 < 2 ? 2 : 1); if (h < 0.05 && k > 0) k--; out.set(C[k]); return; }
    case T.PLANK: { C = TCOL.plank; const r = gy % 6; let k = r === 0 ? 0 : r === 1 ? 2 : 1; if ((gx + Math.floor(gy / 6) * 7) % 23 === 0) k = 0; out.set(C[k]); return; }
    default: out.set(TCOL.void[0]);
  }
}
/* paint one 16×16-tile chunk; returns a canvas.
   Boundaries are smooth, not stair-stepped: each pixel looks at the four nearest tile centres and, from the highest
   ground type down, takes the first whose bilinear coverage beats a jittered 0.5 threshold. Just below a higher layer
   the lower one gets a 1-px shadow lip; water gets a foam line and a lighter shallow band along its shore. */
const TEDGE = [0, 0.22, 0.12, 0.05, 0.1, 0.14, 0.16, 0.18, 0.06, 0.32, 0.22, 0.04];
function paintTileChunk(ci, cj, S) {
  const P = 20, N = S * P, c = cnv(N, N), g = c.getContext('2d'), id = g.createImageData(N, N), d = id.data, tx0 = ci * S, tz0 = cj * S, px = new Uint8ClampedArray(3);
  const cand = [0, 0, 0, 0];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const gx = tx0 * P + x, gy = tz0 * P + y, fx = gx / P - 0.5, fz = gy / P - 0.5, i0 = Math.floor(fx), j0 = Math.floor(fz), ax = fx - i0, az = fz - j0;
    const A = tget(i0, j0), B = tget(i0 + 1, j0), C = tget(i0, j0 + 1), D = tget(i0 + 1, j0 + 1), own = tget(Math.floor(gx / P), Math.floor(gy / P));
    let tt = own, lip = 0, shore = 0;
    if (A !== B || A !== C || A !== D) {
      cand[0] = A; cand[1] = B; cand[2] = C; cand[3] = D; cand.sort((p, q) => TPRIO[q] - TPRIO[p]);
      const jag = vnoise(gx * 0.3, gy * 0.3) + vnoise(gx * 0.9, gy * 0.9) * 0.35; tt = cand[3];
      for (let k = 0; k < 3; k++) { const t = cand[k]; if (k && t === cand[k - 1]) continue; if (t === T.VOID) continue; const pr = TPRIO[t];
        const cov = (TPRIO[A] >= pr ? (1 - ax) * (1 - az) : 0) + (TPRIO[B] >= pr ? ax * (1 - az) : 0) + (TPRIO[C] >= pr ? (1 - ax) * az : 0) + (TPRIO[D] >= pr ? ax * az : 0), th = 0.5 + jag * TEDGE[t];
        if (cov > th) { tt = t; break; } if (cov > th - 0.09 && t !== T.WATER && !lip) lip = t; if (t !== T.WATER && cov > 0.02) shore = Math.max(shore, cov - th + 0.5); }
      if (tt === T.VOID) tt = own;
    }
    texPix(tt, gx, gy, px); let r = px[0], gg = px[1], b = px[2];
    if (lip && TPRIO[lip] > TPRIO[tt]) { const k2 = lip === T.WALL || lip === T.ROCK ? 0.6 : 0.8; r *= k2; gg *= k2; b *= k2; }
    if (tt === T.WATER && shore > 0) { const f = shore > 0.36 ? TCOL.water[4] : shore > 0.22 ? TCOL.water[3] : null; if (f) { r = f[0]; gg = f[1]; b = f[2]; } }
    const o = (y * N + x) * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; }
  g.putImageData(id, 0, 0);
  // little ground details: flower clusters and clover on grass, leaf litter on forest floor
  const R = mulberry32(ci * 7919 + cj * 104729), put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let q = 0; q < 70; q++) { const lx = Math.floor(R() * N), ly = Math.floor(R() * N), t = tget(tx0 + lx / P, tz0 + ly / P), k = R();
    if (t === T.GRASS && tget(tx0 + lx / P + 1, tz0 + ly / P) === T.GRASS && tget(tx0 + lx / P, tz0 + ly / P + 1) === T.GRASS) {
      if (k < 0.18) { const cc = ['#fff6e0', '#ffe060', '#ff9ab8', '#c8a8ff'][Math.floor(R() * 4)]; for (const [dx, dy] of [[0, 0], [3, 1], [1, 3]]) { put(lx + dx, ly + dy, cc); put(lx + dx + 1, ly + dy + 1, '#2f6a28'); put(lx + dx, ly + dy - 1, cc === '#ffe060' ? '#fff6c0' : cc); } }
      else if (k < 0.5) { put(lx, ly, '#7cbc56'); put(lx + 1, ly, '#7cbc56'); put(lx, ly + 1, '#3f7a32'); put(lx + 2, ly - 1, '#9ccc6a'); } }
    else if (t === T.FLOOR && k < 0.4) { const cc = k < 0.15 ? '#9a6a30' : '#7a5a2a'; put(lx, ly, cc); put(lx + 1, ly + 1, cc); }
  }
  return c;
}
/* base colour of a tile type for the minimap */
function tileMapColor(t) { switch (t) { case T.GRASS: return TCOL.grass[2]; case T.DIRT: return TCOL.dirt[2]; case T.COBBLE: return TCOL.cobble[2]; case T.WATER: return TCOL.water[2]; case T.SAND: return TCOL.sand[1]; case T.GRAVEL: return TCOL.gravel[2]; case T.FLOOR: return TCOL.floor[2]; case T.FIELD: return TCOL.field[1]; case T.WALL: return TCOL.wall[1]; case T.ROCK: return TCOL.rock[1]; case T.PLANK: return TCOL.plank[1]; default: return TCOL.void[0]; } }
