/* ================= world: layered grid, terrain generation, cell rules, structural support ================= */
// terrain type codes (per column, for colouring)
const TT = { grass: 0, hill: 1, dirt: 2, road: 3, sand: 4, water: 5, forest: 6 };
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const gAt = (x, y) => inMap(x, y) ? W.G[y * MW + x] : 0;
const ttAt = (x, y) => inMap(x, y) ? W.tt[y * MW + x] : 0;
function blkAt(x, y, L) {
  if (L < 0) return 20;
  if (!inMap(x, y)) return 20;
  if (L >= ML) return 0;
  return W.blk[ci(x, y, L)];
}
const slabAt = (x, y, L) => (inMap(x, y) && L >= 0 && L < ML) ? W.slab[ci(x, y, L)] : 0;
const solidFor = (b, who) => b !== 0 && !!(who === 'p' ? B[b].P : who === 'z' ? B[b].Z : B[b].B);
function support(x, y, L) {
  if (!inMap(x, y) || L < 0 || L >= ML) return false;
  if (L === W.G[y * MW + x] && W.tt[y * MW + x] !== TT.water) return true;
  if (W.slab[ci(x, y, L)]) return true;
  if (B[W.blk[ci(x, y, L)]].stairs) return true;
  return L > 0 && !!B[blkAt(x, y, L - 1)].top;
}
const standable = (x, y, L, who) => inMap(x, y) && L >= 0 && L < ML && !solidFor(W.blk[ci(x, y, L)], who) && support(x, y, L);
const radioDist = (x, y) => Math.max(Math.abs(x - W.radio.x), Math.abs(y - W.radio.y));
const inZone = (x, y) => radioDist(x, y) <= BUILD_R;

/* ---------- map generation (deterministic from seed) ---------- */
function genMap(seed) {
  const r = mulberry(seed ^ 0x2545F491);
  const G = new Uint8Array(MW * MH), tt = new Uint8Array(MW * MH);
  const blk = new Uint8Array(NC), bhp = new Float32Array(NC), slab = new Uint8Array(NC), shp = new Float32Array(NC), bdir = new Uint8Array(NC);
  const col = (x, y) => y * MW + x;
  const noise = (x, y, s) => { const xi = Math.floor(x / s), yi = Math.floor(y / s), fx = x / s - xi, fy = y / s - yi; const v = (a, b) => hash2(a + seed % 997, b + 31); const sm = t => t * t * (3 - 2 * t); return lerp(lerp(v(xi, yi), v(xi + 1, yi), sm(fx)), lerp(v(xi, yi + 1), v(xi + 1, yi + 1), sm(fx)), sm(fy)); };
  // hills
  const hill = (cx, cy, rad, top) => { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const d = d2(x, y, cx, cy) / rad + (noise(x, y, 5) - 0.5) * 0.45; if (d < 1) { G[col(x, y)] = Math.max(G[col(x, y)], 1); tt[col(x, y)] = TT.hill; } if (top && d < 0.48) G[col(x, y)] = 2; } };
  hill(53, 11, 10.5, true); hill(58, 31, 5.5, false); hill(57, 56, 6.5, false);
  // river (west), pond (south-west)
  const riverC = y => 12 + 3 * Math.sin(y / 9 + 1.3) + 1.4 * Math.sin(y / 3.7);
  for (let y = 0; y < MH; y++) { const c = Math.round(riverC(y)), w = 2 + (noise(0, y, 6) > 0.55 ? 1 : 0); for (let x = c; x < c + w; x++) { G[col(x, y)] = 0; tt[col(x, y)] = TT.water; } }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = (x - 25) / 3.6, dy = (y - 53) / 2.8; if (dx * dx + dy * dy + (noise(x, y, 3) - 0.5) * 0.5 < 1) { G[col(x, y)] = 0; tt[col(x, y)] = TT.water; } }
  // roads: east-west at y 35-36, north-south at x 40-41 (south half)
  const roadCells = new Set();
  for (let x = 0; x < MW; x++) for (const y of [35, 36]) if (G[col(x, y)] === 0) { if (tt[col(x, y)] !== TT.water) tt[col(x, y)] = TT.road; roadCells.add(col(x, y)); }
  for (let y = 37; y < MH; y++) for (const x of [40, 41]) if (G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water) { tt[col(x, y)] = TT.road; roadCells.add(col(x, y)); }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = col(x, y);
    if (tt[i] === TT.grass) { const n = noise(x, y, 7); if (x < riverC(y) - 1 && n > 0.25) tt[i] = TT.forest; else if (n < 0.18) tt[i] = TT.dirt; }
    if (tt[i] !== TT.water && tt[i] !== TT.road) for (const [dx, dy] of DIRS) { const xx = x + dx, yy = y + dy; if (inMap(xx, yy) && tt[col(xx, yy)] === TT.water && G[i] === 0) { tt[i] = TT.sand; break; } }
  }
  // fill terrain below ground; water
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[col(x, y)]; for (let L = 0; L < g; L++) blk[ci(x, y, L)] = 20; if (tt[col(x, y)] === TT.water) blk[ci(x, y, 0)] = 23; }
  // bridges: the road crossing + a northern footbridge
  const bridgeRow = (ys) => { for (const y of ys) for (let x = 0; x < MW; x++) if (tt[col(x, y)] === TT.water && x < 30) { blk[ci(x, y, 0)] = 0; slab[ci(x, y, 0)] = SLAB_BRIDGE; } };
  bridgeRow([35, 36]); bridgeRow([13]);
  // ramps up the hills
  const ramps = [];
  for (let pass = 0; pass < 2; pass++) for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    const g = G[col(x, y)];
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DIRS[d], hx = x + dx, hy = y + dy, bx = x - dx, by = y - dy;
      if (G[col(hx, hy)] !== g + 1 || G[col(bx, by)] !== g || tt[col(x, y)] === TT.water || tt[col(bx, by)] === TT.water) continue;
      const sx = x + dy, sy = y + dx, ox = x - dy, oy = y - dx; // sides must be same level so the ramp reads clean
      if (!inMap(sx, sy) || !inMap(ox, oy) || G[col(sx, sy)] !== g || G[col(ox, oy)] !== g) continue;
      if (ramps.some(q => d2(q[0], q[1], x, y) < 9)) continue;
      if (r() < 0.12 + pass * 0.3) { ramps.push([x, y]); blk[ci(x, y, g)] = 28; bdir[ci(x, y, g)] = d; tt[col(x, y)] = TT.dirt; }
    }
  }
  // radio + starter fort
  const RX = 32, RY = 28;
  const put = (x, y, L, id, d) => { blk[ci(x, y, L)] = id; bhp[ci(x, y, L)] = B[id].hp; if (d != null) bdir[ci(x, y, L)] = d; };
  const putS = (x, y, L, id) => { slab[ci(x, y, L)] = id; shp[ci(x, y, L)] = B[id].hp; };
  for (let y = 22; y <= 34; y++) for (let x = 26; x <= 38; x++) { G[col(x, y)] = 0; if (tt[col(x, y)] !== TT.road) tt[col(x, y)] = TT.grass; for (let L = 0; L < ML; L++) blk[ci(x, y, L)] = 0; }
  for (let x = 29; x <= 35; x++) for (let y = 25; y <= 31; y++) {
    const edge = x === 29 || x === 35 || y === 25 || y === 31;
    if (edge) {
      let id = 2;
      if ((x === 32 && y === 31) || (x === 29 && y === 28)) id = 7;
      if ((x === 31 && y === 25) || (x === 33 && y === 25) || (x === 35 && y === 28) || (x === 29 && y === 30)) id = 8;
      put(x, y, 0, id);
    } else if (!(x === 34 && y === 27)) putS(x, y, 1, 4);
    if (x === 29 || y === 25) { let id = 1; if ((x === 31 || x === 33) && y === 25) id = 8; if (x === 29 && (y === 28 || y === 30)) id = 8; put(x, y, 1, id); }
  }
  put(34, 27, 0, 6, 3);           // stairs going north up to (34,26) on the first floor
  put(31, 26, 1, 10);              // lamp upstairs
  put(RX, RY, 0, 30); put(30, 30, 0, 31);
  // trees, rocks
  const clearNear = (x, y) => Math.max(Math.abs(x - RX), Math.abs(y - RY)) <= 7;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = col(x, y), t = tt[i], g = G[i];
    if (t === TT.water || t === TT.road || roadCells.has(i) || clearNear(x, y) || blk[ci(x, y, g)]) continue;
    const pTree = t === TT.forest ? 0.42 : t === TT.hill ? 0.1 : 0.035, pRock = t === TT.hill ? 0.05 : 0.018;
    const v = r();
    if (v < pTree) put(x, y, g, 22); else if (v < pTree + pRock) put(x, y, g, 21);
  }
  // town (south, along the north-south road): ruined houses with rubble and crates
  const houses = [[32, 40, 37, 45], [43, 40, 49, 45], [32, 50, 37, 56], [43, 49, 48, 55], [44, 58, 49, 62]];
  for (const [x0, y0, x1, y1] of houses) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { if (G[col(x, y)] !== 0 || tt[col(x, y)] === TT.water) continue; blk[ci(x, y, 0)] = 0; blk[ci(x, y, 1)] = 0; tt[col(x, y)] = TT.dirt; }
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (G[col(x, y)] !== 0 || tt[col(x, y)] === TT.water) continue;
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      if (!edge) continue;
      if (r() < 0.22) { if (r() < 0.5) put(x, y, 0, 29); continue; } // gaps / rubble
      put(x, y, 0, 24);
      if (r() < 0.35) put(x, y, 1, 24);
    }
    put(x0 + 1 + Math.floor(r() * (x1 - x0 - 2)), y0 + 1 + Math.floor(r() * (y1 - y0 - 2)), 0, 26);
    put(x0 + 1 + Math.floor(r() * (x1 - x0 - 2)), y0 + 1 + Math.floor(r() * (y1 - y0 - 2)), 0, 29);
  }
  // cars on the roads (not on bridges), a few crates in the open
  const cars = [[6, 35], [22, 36], [46, 35], [55, 36], [40, 47], [41, 59], [62, 35]];
  for (const [x, y] of cars) if (!slab[ci(x, y, 0)] && G[col(x, y)] === 0) put(x, y, 0, 25, Math.floor(r() * 4));
  for (const [x, y] of [[20, 24], [44, 20], [24, 44], [5, 28], [58, 46], [52, 4]]) if (!blk[ci(x, y, G[col(x, y)])]) put(x, y, G[col(x, y)], 26);
  // fences around the town lots
  for (let x = 31; x <= 38; x++) if (!blk[ci(x, 48, 0)] && tt[col(x, 48)] !== TT.road) put(x, 48, 0, 27);
  for (let y = 38; y <= 46; y++) if (!blk[ci(51, y, 0)] && G[col(51, y)] === 0) put(51, y, 0, 27);
  // spots
  const spots = [];
  for (let i = 0; i < NC; i++) if (B[blk[i]].spot) spots.push({ i, k: B[blk[i]].spot, searched: false });
  return { G, tt, blk, bhp, slab, shp, bdir, spots, radio: { x: RX, y: RY }, bench: { x: 30, y: 30 } };
}

/* ---------- structural support (3D) ----------
   A cell with a structural block or floor resting on terrain gets support = its cap. Support passes straight up
   (capped by the upper cell's cap) and sideways losing 1 per tile. Cells with 0 support collapse. */
const cellCap = i => Math.max(B[W.blk[i]].st ? B[W.blk[i]].cap : 0, W.slab[i] && B[W.slab[i]].st ? B[W.slab[i]].cap : 0);
function recomputeStab() {
  const stab = W.stab; stab.fill(0);
  const Q = Array.from({ length: 14 }, () => []);
  for (let L = 0; L < ML; L++) for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = ci(x, y, L), cap = cellCap(i); if (!cap) continue;
    const below = blkAt(x, y, L - 1);
    if (L <= W.G[y * MW + x] || (B[below].nat && B[below].top)) { stab[i] = cap; Q[cap].push(i); }
  }
  for (let s = 13; s >= 1; s--) {
    const q = Q[s];
    while (q.length) {
      const u = q.pop(); if (stab[u] !== s) continue;
      const x = cx_(u), y = cy_(u), L = cl_(u);
      if (L + 1 < ML) { const v = ci(x, y, L + 1), c = cellCap(v); if (c) { const val = Math.min(c, s); if (val > stab[v]) { stab[v] = val; Q[val].push(v); } } }
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue;
        const v = ci(nx, ny, L), c = cellCap(v); if (!c) continue;
        const val = Math.min(c, s - 1); if (val > stab[v]) { stab[v] = val; Q[val].push(v); }
      }
    }
  }
}
function unsupported() {
  const out = [];
  for (let i = 0; i < NC; i++) {
    const b = W.blk[i], s = W.slab[i];
    if (!b && !s) continue;
    if ((B[b].st || (s && B[s].st)) && W.stab[i] <= 0) { out.push(i); continue; }
    if (B[b].dep && !support(cx_(i), cy_(i), cl_(i))) out.push(i);
  }
  return out;
}
function supportIf(x, y, L, id) {
  const Bi = B[id];
  if (Bi.dep) return support(x, y, L) ? 1 : 0;
  const i = ci(x, y, L), cap = Math.max(Bi.cap, cellCap(i));
  if (L <= gAt(x, y)) return cap;
  const below = blkAt(x, y, L - 1);
  if (B[below].nat && B[below].top) return cap;
  let s = W.stab[i] || 0;
  if (L > 0) s = Math.max(s, Math.min(cap, W.stab[ci(x, y, L - 1)]));
  for (const [dx, dy] of DIRS) if (inMap(x + dx, y + dy)) s = Math.max(s, Math.min(cap, W.stab[ci(x + dx, y + dy, L)] - 1));
  return s;
}
// can block `id` (with stairs dir) go into cell (x,y,L)? returns '' or a reason
function canPlace(x, y, L, id, dir) {
  if (!inMap(x, y) || !inZone(x, y)) return '只能在电台周围的建造区内建造';
  if (L < 0 || L >= ML - 1) return '太高了';
  const g = gAt(x, y), i = ci(x, y, L), Bi = B[id];
  if (L < g) return '这里是实心地面';
  const water = ttAt(x, y) === TT.water && L === 0;
  if (Bi.slab) {
    if (W.slab[i]) return '这里已经有楼板了';
    if (L === g && !water) return '地面上不用铺楼板';
    if (B[W.blk[i]].stairs) return '楼梯口不能铺楼板';
    if (L > 0 && B[blkAt(x, y, L - 1)].stairs) return '这是楼梯口，留空才能上下';
  } else {
    if (water && !W.slab[i]) return '水面要先铺楼板';
    if (W.blk[i]) return '这里已经有东西了';
    if (Bi.stairs) { if (L + 1 >= ML) return '太高了'; if (W.slab[ci(x, y, L + 1)]) return '楼梯上方有楼板，先拆掉'; }
    if (Bi.P || Bi.Z) {
      const hit = e => Math.floor(e.x) === x && Math.floor(e.y) === y && e.L === L;
      for (const p of W.p) if (!p.gone && !p.dead && hit(p)) return '有人站在这里';
      for (const z of W.zs) if (hit(z)) return '有丧尸挡着';
    }
  }
  if (supportIf(x, y, L, id) <= 0) return Bi.dep ? '下面要有地面或楼板' : '没有支撑，会塌';
  return '';
}
