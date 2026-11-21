/* ================= world: layered grid, terrain generation, cell rules, structural support ================= */
// terrain type codes (per column, for colouring)
const TT = { grass: 0, hill: 1, dirt: 2, road: 3, sand: 4, water: 5, forest: 6, mud: 7, meadow: 8, rocky: 9 }; // mud slows you; meadow = tall grass and flowers; rocky = gravel and boulders
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const gAt = (x, y) => inMap(x, y) ? W.G[y * MW + x] : 0;
const ttAt = (x, y) => inMap(x, y) ? W.tt[y * MW + x] : 0;
const inMud = (x, y, L) => L === 0 && ttAt(Math.floor(x), Math.floor(y)) === TT.mud && !W.slab[ci(Math.floor(x), Math.floor(y), 0)];
function blkAt(x, y, L) {
  if (L < 0) return 20;
  if (!inMap(x, y)) return 20;
  if (L >= ML) return 0;
  return W.blk[ci(x, y, L)];
}
const slabAt = (x, y, L) => (inMap(x, y) && L >= 0 && L < ML) ? W.slab[ci(x, y, L)] : 0;
const solidFor = (b, who) => b !== 0 && !!(who === 'p' ? B[b].P : who === 'z' ? B[b].Z : B[b].B);
// a player wall (wood / brick / steel) above ground level with nothing on top: waist-high parapet you can shoot over
// town walls come in four shapes: 0 window wall, 1 broken stepped top, 2 full, 3 low stub. A wall carrying a floor is
// a window wall or full. The renderer draws these and bullets go through the same openings (rayWorld).
function ruinShape(x, y, L) {
  const h = hash2(x * 3 + L, y * 7); let v = h < 0.28 ? 0 : h < 0.58 ? 1 : h < 0.84 ? 2 : 3;
  if (ARCH.roofCells.has(x + ',' + y + ',' + L) || (L + 1 < ML && (W.slab[ci(x, y, L + 1)] || W.blk[ci(x, y, L + 1)]))) v = h < 0.4 ? 0 : 2;
  return v;
}
const ruinRot = (x, y, L, v) => (v === 0 || v === 1 ? (wallAxis(x, y, L) ? Math.PI / 2 : 0) : 0) + (v === 1 && hash2(x, y * 3) < 0.5 ? Math.PI : 0);
const WIN = { lo: 0.39, hi: 0.78, half: 0.3 };   // window opening: sill / lintel (fractions of FH), half width
function isParapet(i) {
  const b = W.blk[i]; if (b !== 1 && b !== 2 && b !== 3) return false;
  const x = cx_(i), y = cy_(i), L = cl_(i); if (L < 1 || L <= gAt(x, y)) return false;
  if (L + 1 >= ML) return true; const u = ci(x, y, L + 1); return !W.blk[u] && !W.slab[u];
}
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

/* ---------- map generation (deterministic from seed) ----------
   128 x 128: river and forest in the west, the camp north-west of centre, hills to the north-east, a farm in the north
   and a big ruined town (three rows of blocks on a street grid) filling the south and south-east. Town lots: [x0, y0, x1, y1, storeys]. */
const TOWN_LOTS = [
  // [x0, y0, x1, y1, storeys, type] — one building per street block, two in the long northern row, yards in between.
  // apt: apartments (corridor + rooms, balconies, roof); villa: house (open living room downstairs, bedrooms in the attic);
  // ware: warehouse (tall hall, mezzanine); shop: supermarket (aisles, stockroom, roof); clinic: wards off a corridor (medkits);
  // police: cells, armoury (ammo, grenades), offices upstairs; garage: repair hall with cars and tool benches (parts, steel).
  [35, 64, 52, 76, 2, 'villa'], [40, 84, 54, 95, 1, 'shop'],
  [63, 66, 84, 79, 4, 'apt'], [63, 86, 82, 96, 1, 'garage'],
  [96, 62, 119, 76, 5, 'apt'], [98, 84, 117, 96, 2, 'police'],
  [131, 62, 150, 75, 2, 'villa'], [130, 83, 154, 97, 2, 'ware'],
  [36, 107, 52, 122, 2, 'clinic'], [64, 107, 85, 122, 2, 'ware'], [97, 106, 120, 123, 4, 'apt'], [131, 108, 152, 121, 1, 'shop'],
  [36, 134, 52, 150, 2, 'villa'], [64, 134, 85, 151, 3, 'apt'], [97, 136, 118, 150, 1, 'garage'], [131, 134, 150, 150, 2, 'police'],
  [48, 3, 58, 11, 1, 'barn'],
];
const TOWN_HOUSES = TOWN_LOTS.map(h => h.slice()); // live list for the current map (setMap swaps it)
const RADIO_XY = [48, 40];                          // live camp position for the current map
function genMap(seed) {
  const M = MAPDEF;
  const r = mulberry(seed ^ 0x2545F491);
  const G = new Uint8Array(MW * MH), tt = new Uint8Array(MW * MH);
  const blk = new Uint8Array(NC), bhp = new Float32Array(NC), slab = new Uint8Array(NC), shp = new Float32Array(NC), bdir = new Uint8Array(NC);
  const col = (x, y) => y * MW + x;
  const noise = (x, y, s) => { const xi = Math.floor(x / s), yi = Math.floor(y / s), fx = x / s - xi, fy = y / s - yi; const v = (a, b) => hash2(a + seed % 997, b + 31); const sm = t => t * t * (3 - 2 * t); return lerp(lerp(v(xi, yi), v(xi + 1, yi), sm(fx)), lerp(v(xi, yi + 1), v(xi + 1, yi + 1), sm(fx)), sm(fy)); };
  const [RX, RY] = RADIO_XY, radioDist0 = (x, y) => Math.max(Math.abs(x - RX), Math.abs(y - RY));
  const inTown = (x, y, pad) => TOWN_HOUSES.some(([x0, y0, x1, y1]) => x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad);
  // hills (kept away from the base and the town)
  const hill = (cx, cy, rad, top) => { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { if (inTown(x, y, 2) || Math.max(Math.abs(x - RX), Math.abs(y - RY)) <= BUILD_R + 1) continue; const d = d2(x, y, cx, cy) / rad + (noise(x, y, 5) - 0.5) * 0.45; if (d < 1) { G[col(x, y)] = Math.max(G[col(x, y)], 1); tt[col(x, y)] = TT.hill; } if (top && d < 0.48) G[col(x, y)] = 2; } };
  for (const h of M.hills || []) hill(...h);
  // river (west), lake (south-west of town), farm pond (north)
  const riverC = M.river ? M.river.c : null;
  if (riverC) for (let y = 0; y < MH; y++) { const c = Math.round(riverC(y)), w = (M.river.w || 2) + (noise(0, y, 6) > 0.55 ? 1 : 0); for (let x = c; x < c + w; x++) { G[col(x, y)] = 0; tt[col(x, y)] = TT.water; } }
  const pond = (cx, cy, rx, ry) => { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy + (noise(x, y, 3) - 0.5) * 0.5 < 1) { G[col(x, y)] = 0; tt[col(x, y)] = TT.water; } } };
  for (const p of M.ponds || []) pond(...p);
  if (M.ocean) for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (M.ocean(x, y, noise)) { G[col(x, y)] = 0; tt[col(x, y)] = TT.water; }
  // roads: main east-west road y 51-52, town road x 57-58 south of it, farm track x 44-45 north
  const roadCells = new Set();
  const road = (x, y) => { if (!inMap(x, y) || G[col(x, y)] !== 0) return; if (tt[col(x, y)] !== TT.water) tt[col(x, y)] = TT.road; roadCells.add(col(x, y)); };
  const K = { r, noise, G, tt, col, road, roadCells, RX, RY, inTown, riverC };
  M.roads(K);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = col(x, y);
    if (tt[i] === TT.grass) { const n = noise(x, y, 7); if (M.forestAt ? M.forestAt(x, y, n, K) : (n > (M.forestN || 0.8) && !inTown(x, y, 3))) tt[i] = TT.forest; else if (n < (M.dirtN || 0.16)) tt[i] = TT.dirt; }
    if (tt[i] !== TT.water && tt[i] !== TT.road) for (const [dx, dy] of DIRS) { const xx = x + dx, yy = y + dy; if (inMap(xx, yy) && tt[col(xx, yy)] === TT.water && G[i] === 0) { tt[i] = TT.sand; break; } }
  }
  if (M.fields) M.fields(K);
  // terrain variety (per-map switches in MAPDEF.feat): forest trails, mud by the water and in hollows, meadows, gravel flats
  const FT = Object.assign({ mud: 1, meadow: 1, rocky: 1, trails: 1, farms: 3 }, M.feat || {}), trail = new Set();
  const nearT = (x, y, r, t) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (inMap(x + dx, y + dy) && tt[col(x + dx, y + dy)] === t) return true; return false; };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = col(x, y), t = tt[i];
    if (t !== TT.grass && t !== TT.forest && t !== TT.dirt && t !== TT.hill) continue;
    if (inTown(x, y, 2) || radioDist0(x, y) <= BUILD_R + 1) continue;
    const n2 = noise(x + 400, y + 400, 9), n3 = noise(x + 900, y + 200, 6);
    if (FT.trails && t === TT.forest && Math.abs(noise(x + 1300, y + 700, 13) - 0.5) < 0.03) { tt[i] = TT.dirt; trail.add(i); continue; }
    if (FT.mud && G[i] === 0 && t !== TT.forest && (n2 < 0.16 * FT.mud || (n3 < 0.4 && nearT(x, y, 2, TT.water)))) tt[i] = TT.mud;
    else if (FT.meadow && t === TT.grass && n3 > 1 - 0.3 * FT.meadow) tt[i] = TT.meadow;
    else if (FT.rocky && (t === TT.hill || t === TT.grass) && n2 > 1 - 0.13 * FT.rocky) tt[i] = TT.rocky;
  }
  // fill terrain below ground; water
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[col(x, y)]; for (let L = 0; L < g; L++) blk[ci(x, y, L)] = 20; if (tt[col(x, y)] === TT.water) blk[ci(x, y, 0)] = 23; }
  // bridges over the river: the main road, a northern footbridge, a southern one
  for (const i of roadCells) if (tt[i] === TT.water) { const x = i % MW, y = Math.floor(i / MW); blk[ci(x, y, 0)] = 0; slab[ci(x, y, 0)] = SLAB_BRIDGE; }
  for (const [y, xa, xb] of M.bridges || []) for (let x = xa; x <= xb; x++) if (inMap(x, y) && tt[col(x, y)] === TT.water) { blk[ci(x, y, 0)] = 0; slab[ci(x, y, 0)] = SLAB_BRIDGE; }
  // ramps up the hills
  const ramps = [];
  for (let pass = 0; pass < 2; pass++) for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    const g = G[col(x, y)];
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DIRS[d], hx = x + dx, hy = y + dy, bx = x - dx, by = y - dy;
      if (G[col(hx, hy)] !== g + 1 || G[col(bx, by)] !== g || tt[col(x, y)] === TT.water || tt[col(bx, by)] === TT.water) continue;
      const sx = x + dy, sy = y + dx, ox = x - dy, oy = y - dx;
      if (!inMap(sx, sy) || !inMap(ox, oy) || G[col(sx, sy)] !== g || G[col(ox, oy)] !== g) continue;
      if (ramps.some(q => d2(q[0], q[1], x, y) < 9)) continue;
      if (r() < 0.12 + pass * 0.3) { ramps.push([x, y]); blk[ci(x, y, g)] = 28; bdir[ci(x, y, g)] = d; tt[col(x, y)] = TT.dirt; }
    }
  }
  // camp: starter house (9 x 9, half second floor) with the workbench
  const put = (x, y, L, id, d) => { blk[ci(x, y, L)] = id; bhp[ci(x, y, L)] = B[id].hp || 1; if (d != null) bdir[ci(x, y, L)] = d; };
  const putS = (x, y, L, id) => { slab[ci(x, y, L)] = id; shp[ci(x, y, L)] = B[id].hp; };
  for (let y = RY - 7; y <= RY + 7; y++) for (let x = RX - 7; x <= RX + 7; x++) { G[col(x, y)] = 0; if (tt[col(x, y)] !== TT.road) tt[col(x, y)] = TT.grass; for (let L = 0; L < ML; L++) blk[ci(x, y, L)] = 0; }
  // 13 x 11 house: a big hall and a workshop downstairs, two rooms and a balcony upstairs, a roof terrace with a parapet.
  // Ladders hang on the hall's inner wall in the corners and on the upstairs dividing wall; doors on every side.
  const X0 = RX - 6, X1 = RX + 6, Y0 = RY - 5, Y1 = RY + 5, WX = RX + 2;   // WX: wall between hall and workshop
  const slit = (x, y) => ((y === Y0 || y === Y1) && (x === RX - 4 || x === RX + 1 || x === RX + 4)) || ((x === X0 || x === X1) && (y === RY - 3 || y === RY + 3));
  const hatch = new Set([(WX - 1) + ',' + (Y0 + 1) + ',1', (WX - 1) + ',' + (Y1 - 1) + ',1', (X0 + 2) + ',' + (RY + 1) + ',2', (RX - 1) + ',' + (RY - 1) + ',2']);
  const door0 = (x, y) => (x === RX - 2 && (y === Y0 || y === Y1)) || (x === X0 && y === RY) || (x === X1 && y === RY);
  for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) {
    const edge = x === X0 || x === X1 || y === Y0 || y === Y1;
    if (edge) put(x, y, 0, door0(x, y) ? 7 : slit(x, y) ? 8 : 2);
    else if (x === WX && y !== RY - 2 && y !== RY + 2) put(x, y, 0, 2);                     // hall | workshop, two doorways
    for (const L of [1, 2]) if (!hatch.has(x + ',' + y + ',' + L)) putS(x, y, L, 4);
    if (edge) { put(x, y, 1, x === RX && y === Y1 ? 0 : slit(x, y) ? 8 : 1); put(x, y, 2, 1); } // upstairs walls (balcony door south); roof parapet
    else if (y === RY && x !== RX + 1 && x <= WX) put(x, y, 1, 1);                          // upstairs dividing wall with a doorway
  }
  for (let x = RX - 3; x <= RX + 3; x++) { putS(x, Y1 + 1, 1, 4); putS(x, Y1 + 2, 1, 4); put(x, Y1 + 2, 1, 42); } // balcony over the front door
  put(RX - 3, Y1 + 1, 1, 42); put(RX + 3, Y1 + 1, 1, 42);
  put(WX - 1, Y0 + 1, 0, 6, 0); put(WX - 1, Y1 - 1, 0, 6, 0);   // hall corners -> upstairs (onto the top of the hall wall)
  put(X0 + 2, RY + 1, 1, 6, 3); put(RX - 1, RY - 1, 1, 6, 1);   // upstairs -> roof (on the dividing wall)
  put(X0 + 2, Y0 + 2, 1, 10); put(X1 - 1, Y1 - 1, 2, 10); put(RX + 4, RY + 3, 0, 10); // lamps
  // town: one building per street block (two in the long northern blocks), each type with its own interior. Every building
  // has a stair core near its main door: a short two-cell wall with the ladders on one side, alternating cells floor by floor,
  // so the way up is always in the same, obvious place. Each ladder climbs through a hatch onto the top of that wall.
  TOWN_HOUSES.forEach((H, k) => genBuilding(H, k));
  function genBuilding([x0, y0, x1, y1, st, type], k) {
    const rr = mulberry(seed ^ (k * 7919 + 17));
    const ok = (x, y) => inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water;
    const okIn = (x, y) => ok(x, y) && tt[col(x, y)] !== TT.road;
    const flat = type === 'apt' || type === 'shop' || type === 'clinic' || type === 'police';   // flat roof you can get onto
    const pad = type === 'garage' || type === 'ware' || type === 'barn' ? 0 : 2;
    for (let x = x0 - pad; x <= x1 + pad; x++) for (let y = y0 - pad; y <= y1 + pad; y++) { if (!ok(x, y)) continue; for (let L = 0; L <= st + 1 && L < ML; L++) { blk[ci(x, y, L)] = 0; if (L) slab[ci(x, y, L)] = 0; } if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && tt[col(x, y)] !== TT.road) tt[col(x, y)] = TT.dirt; }
    const W_ = (x, y, L, id = 24) => { if (okIn(x, y) && L < ML && !gaps.has(K(x, y, L))) put(x, y, L, id); };
    const F_ = (x, y, L, id = 5) => { if (ok(x, y) && L < ML) putS(x, y, L, id); };
    const P_ = (x, y, L, id, d) => { if (okIn(x, y) && L < ML && !blk[ci(x, y, L)] && (L === 0 || slab[ci(x, y, L)]) && !hatches.has(K(x, y, L)) && !gaps.has(K(x, y, L)) && !lads.some(q => q[2] === L && Math.abs(q[0] - x) + Math.abs(q[1] - y) < 2)) put(x, y, L, id, d); };
    const isEdge = (x, y) => x === x0 || x === x1 || y === y0 || y === y1;
    const lads = [], gaps = new Set(), hatches = new Set(), K = (x, y, L) => x + ',' + y + ',' + L;
    const ladder = (wx, wy, sx, sy, L) => {
      const cx = wx + sx, cy = wy + sy, dir = sx > 0 ? 2 : sx < 0 ? 0 : sy > 0 ? 3 : 1;
      if (hatches.has(K(cx, cy, L)) || gaps.has(K(cx, cy, L)) || hatches.has(K(wx, wy, L + 1))) return false;
      lads.push([cx, cy, L, dir]); gaps.add(K(wx, wy, L + 1)); hatches.add(K(cx, cy, L + 1)); return true;
    };
    // stair core: wall cells (wx, wy) and (wx, wy+1); ladders on side sx (-1 west / +1 east) from floor 0 up to floor `top`
    const coreAt = [];
    const core = (wx, wy, sx, top) => { coreAt.push([wx, wy]); for (let L = 0; L <= top; L++) ladder(wx, wy + (L % 2), sx, 0, L); };
    const coreWalls = L => { for (const [wx, wy] of coreAt) for (const y of [wy, wy + 1]) W_(wx, y, L); };
    const floors = (from, to) => { for (let L = from; L <= to && L < ML; L++) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (!hatches.has(K(x, y, L))) F_(x, y, L); };
    // outer wall with a few windows knocked out (never at corners or next to the stair core)
    const perim = (L, winP) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { if (!isEdge(x, y)) continue; const corner = (x === x0 || x === x1) && (y === y0 || y === y1); if (!corner && L > 0 && rr() < winP) continue; W_(x, y, L); } };
    const roofRail = () => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (isEdge(x, y) && !hatches.has(K(x, y, st))) W_(x, y, st, 42); };
    const balcony = (side, a, L) => {
      const yb = side < 0 ? y0 - 1 : y1 + 1, yr = side < 0 ? y0 - 2 : y1 + 2, yw = side < 0 ? y0 : y1;
      for (let x = a - 1; x <= a + 3; x++) { F_(x, yb, L); F_(x, yr, L); W_(x, yr, L, 42); }
      W_(a - 1, yb, L, 42); W_(a + 3, yb, L, 42); blk[ci(a + 1, yw, L)] = 0;
    };
    const wallNb = (x, y, L) => DIRS.some(([dx, dy]) => { const q = blk[ci(x + dx, y + dy, L)]; return q === 24 || q === 7 || q === 8 || q === 50; });
    const loot = (L, n, ids, ax0 = x0 + 1, ay0 = y0 + 1, ax1 = x1 - 1, ay1 = y1 - 1) => { for (let j = 0; j < n * 8 && n > 0; j++) { const x = ax0 + Math.floor(rr() * (ax1 - ax0 + 1)), y = ay0 + Math.floor(rr() * (ay1 - ay0 + 1)), i = ci(x, y, L); const b0 = blk[i]; if (j < n * 6 && !wallNb(x, y, L)) continue; P_(x, y, L, ids[Math.floor(rr() * ids.length)]); if (!b0 && blk[i]) n--; } };
    const door = (x, y) => { if (okIn(x, y)) { blk[ci(x, y, 0)] = 0; put(x, y, 0, 7); } };
    const open = (x, y, L = 0) => { if (inMap(x, y)) blk[ci(x, y, L)] = 0; };
    const w = x1 - x0, h = y1 - y0, mx = Math.floor((x0 + x1) / 2), py = Math.floor((y0 + y1) / 2);
    // a corridor block (apartments, clinic, police upstairs): 3-wide corridor along py, rooms of width `rw` both sides, a door into each
    // glass: chance a room's corridor wall has waist-high panels beside the door; open: the whole front is waist-high (wards, offices)
    const corridorFloor = (L, rw, glass = 0, openFront = false) => {
      const dq = Math.floor(rw / 2), gl = {};
      for (let x = x0 + 1; x < x1; x++) for (const yy of [py - 2, py + 2]) {
        const q = (x - x0 - 1) % rw, rk = Math.floor((x - x0 - 1) / rw) + ',' + yy; if (q === dq || q === dq - 1) continue;
        if (gl[rk] == null) gl[rk] = rr() < glass;
        W_(x, yy, L, gl[rk] && q > 0 && (openFront || q === dq - 2 || q === dq + 1) ? 50 : 24);
      }
      const ym = [Math.floor((y0 + 1 + py - 3) / 2), Math.ceil((py + 3 + y1 - 1) / 2)];
      for (let wx = x0 + rw + 1; wx < x1 - 2; wx += rw) { const thru = [rr() < 0.5, rr() < 0.5]; for (let y = y0 + 1; y < y1; y++) { if (Math.abs(y - py) <= 2) continue; if ((y === ym[0] && thru[0]) || (y === ym[1] && thru[1])) continue; W_(wx, y, L); } }
    };
    if (type === 'apt') {
      core(x0 + 3, py - 1, -1, st - 1); if (w >= 24) core(x1 - 3, py - 1, 1, st - 2);
      floors(1, st);
      for (let L = 0; L < st; L++) {
        perim(L, 0.12); coreWalls(L); corridorFloor(L, 7, 0.6);
        if (L >= 1) for (let a = x0 + 3; a < x1 - 4; a += 6) { if (rr() < 0.35) balcony(-1, a, L); if (rr() < 0.35) balcony(1, a, L); }
        loot(L, 4, [34, 34, 32, 26, 33]);
      }
      roofRail(); loot(st, 2, [26, 36, 37]);
      door(x0, py + 1); door(x1, py); door(mx, y1); open(mx, py + 2);
    } else if (type === 'villa') {
      const kx = x0 + Math.floor(w * 0.6);
      core(x0 + 3, y1 - 4, -1, st - 2);
      floors(1, st - 1);
      // ground floor: an open living room and a kitchen behind a wall with a wide opening
      perim(0, 0); coreWalls(0); for (let y = y0 + 1; y < y1; y++) if (Math.abs(y - py) > 1) W_(kx, y, 0);
      P_(kx + 2, y0 + 1, 0, 34); P_(kx + 3, y0 + 1, 0, 34); P_(x1 - 1, y0 + 1, 0, 32); P_(x0 + 6, py, 0, 48); P_(x0 + 7, py, 0, 48); // kitchen cupboards, bin, a sofa
      loot(0, 2, [26, 33]);
      // upstairs (the attic under the roof): a landing by the ladder, three bedrooms along the back
      for (let L = 1; L < st; L++) {
        perim(L, 0.1); coreWalls(L);
        for (let x = x0 + 1; x < x1; x++) if ((x - x0) % 5 !== 3 && (x - x0) % 5 !== 2) W_(x, py, L);
        for (let wx = x0 + 5; wx < x1 - 1; wx += 5) for (let y = y0 + 1; y < py; y++) W_(wx, y, L);
        balcony(1, mx - 1, L);
        loot(L, 4, [34, 34, 33, 35]);
      }
      door(mx, y1); door(x0 + 2, y0); door(x1, py + 2);
    } else if (type === 'ware') {
      const my = y0 + 3;
      for (let x = x0 + 1; x < x1; x++) for (let y = y0 + 1; y <= my; y++) F_(x, y, 1);
      const pillars = []; for (let x = x0 + 3; x < x1 - 1; x += 4) pillars.push(x);
      for (const x of pillars) W_(x, my, 0);
      const lp = [pillars[0], pillars[pillars.length - 1]];
      for (const x of lp) { lads.push([x, my + 1, 0, 3]); gaps.add(K(x, my, 1)); }
      for (let x = x0 + 1; x < x1; x++) if (!lp.includes(x)) W_(x, my, 1, 42);
      perim(0, 0); perim(1, 0.25);
      for (let y = my + 3; y < y1 - 1; y += 3) for (let x = x0 + 3; x < x1 - 2; x++) if ((x - x0) % 6 !== 0 && okIn(x, y) && !blk[ci(x, y, 0)]) put(x, y, 0, rr() < 0.3 ? [34, 26, 37][Math.floor(rr() * 3)] : [49, 49, 40][Math.floor(rr() * 3)]); // racks, drums, crates
      loot(1, 4, [26, 36, 35]);
      for (const x of [mx, mx + 1]) open(x, y1); door(x0, y1 - 2); door(x1, my + 2);
    } else if (type === 'shop') {
      // supermarket: aisles of shelving, checkouts by the doors, a stockroom at the back with the way up to the roof
      const sx = x1 - 5;
      for (let y = y0 + 1; y < y1; y++) if (y !== py) W_(sx, y, 0);
      ladder(sx, y0 + 2, 1, 0, 0);
      floors(1, 1);
      perim(0, 0);
      for (let y = y0 + 3; y <= y1 - 4; y += 3) for (let x = x0 + 3; x < sx - 1; x++) if ((x - x0) % 7 !== 0) P_(x, y, 0, rr() < 0.12 ? 34 : 49);
      for (let x = x0 + 3; x < sx - 2; x += 4) P_(x, y1 - 2, 0, 48);
      loot(0, 4, [26, 37, 36], sx + 1, y0 + 1, x1 - 1, y1 - 1);
      roofRail(); loot(1, 2, [26, 33]);
      for (const x of [mx - 1, mx]) open(x, y1); door(x0, py); door(x1, y1 - 2);
    } else if (type === 'clinic') {
      core(x0 + 3, py - 1, -1, st - 1);
      floors(1, st);
      for (let L = 0; L < st; L++) {
        perim(L, 0.1); coreWalls(L); corridorFloor(L, 6, 0.75, true);
        loot(L, 4, [33, 33, 34, 34, 26]);   // backpacks and cabinets carry the medkits
      }
      P_(x0 + 6, py + 1, 0, 48); P_(x0 + 7, py + 1, 0, 48);               // reception desk
      roofRail(); loot(st, 1, [26]);
      door(x0, py + 1); door(x1, py); door(mx, y1); open(mx, py + 2);
    } else if (type === 'police') {
      // ground: front office with a desk, a row of cells behind bars, an armoury with military crates; offices upstairs
      const cy = y0 + 4, ax = x1 - 5;
      core(x0 + 3, y1 - 4, -1, st - 1);
      floors(1, st);
      perim(0, 0); coreWalls(0);
      for (let x = x0 + 1; x < ax; x++) W_(x, cy, 0, (x - x0) % 4 === 2 ? 0 : 8);              // bars along the cells, a gap into each
      for (let x = x0 + 4; x < ax; x += 4) for (let y = y0 + 1; y < cy; y++) W_(x, y, 0);
      for (let y = y0 + 1; y < y1; y++) if (y !== py + 1) W_(ax, y, 0);
      for (const [x, y] of [[ax + 2, y0 + 1], [ax + 3, y0 + 1], [ax + 2, y0 + 2], [x1 - 1, y1 - 1]]) P_(x, y, 0, 36); P_(ax + 3, y1 - 1, 0, 26);
      P_(mx - 1, y1 - 3, 0, 48); P_(mx, y1 - 3, 0, 48); P_(mx + 1, y1 - 3, 0, 48);
      loot(0, 2, [34, 33], x0 + 1, cy + 1, ax - 1, y1 - 1);
      for (let L = 1; L < st; L++) { perim(L, 0.1); coreWalls(L); corridorFloor(L, 5, 1, true); loot(L, 4, [34, 34, 36, 33]); }
      roofRail(); loot(st, 1, [36]);
      door(mx, y1); door(x0, py + 1); door(x1, py + 1);
    } else if (type === 'garage') {
      // repair shop: a big hall with cars up on the floor, tool benches along the back, an office in the corner
      perim(0, 0);
      for (let x = mx - 2; x <= mx + 1; x++) open(x, y1);                                   // the roller door
      const ox = x1 - 5, oy = y0 + 4;
      for (let x = ox; x < x1; x++) W_(x, oy, 0); for (let y = y0 + 1; y < oy; y++) W_(ox, y, 0); open(ox + 2, oy);
      P_(ox + 2, y0 + 1, 0, 34); P_(x1 - 1, y0 + 2, 0, 26);
      for (const [x, y, d] of [[x0 + 4, py, 1], [x0 + 9, py + 1, 1], [x0 + 14, py, 3]]) if (x < ox - 1) P_(x, y, 0, 25, d);
      for (let x = x0 + 2; x < ox - 1; x += 3) P_(x, y0 + 1, 0, rr() < 0.6 ? 35 : 39);
      for (let y = y0 + 3; y < y1 - 1; y += 3) P_(x0 + 1, y, 0, 37);
      loot(0, 2, [39, 35, 26]);
      door(x0, py); door(x1, y1 - 2);
    } else { // barn: one big shed
      perim(0, 0); loot(0, 4, [26, 29, 34, 35, 32, 33]);
      for (const x of [mx, mx + 1]) open(x, y1);
    }
    const placed = new Set();
    for (const [cx, cy, L, dir] of lads) {
      const [dx, dy] = DIRS[dir], fb = blk[ci(cx + dx, cy + dy, L)], up = blk[ci(cx + dx, cy + dy, L + 1)];
      const exitOk = !up || !(B[up].P || B[up].Z);
      if (!fb || !B[fb].top || !(B[fb].P || B[fb].Z) || B[fb].stairs || !exitOk || !okIn(cx, cy) || blk[ci(cx, cy, L)] === 7) continue;
      blk[ci(cx, cy, L)] = 0; slab[ci(cx, cy, L + 1)] = 0; shp[ci(cx, cy, L + 1)] = 0; put(cx, cy, L, 6, dir); placed.add(K(cx, cy, L + 1));
    }
    for (const h of hatches) if (!placed.has(h)) { const [x, y, L] = h.split(',').map(Number); if (L <= st && L < ML && okIn(x, y) && !slab[ci(x, y, L)] && (type !== 'ware' || y <= y0 + 3)) F_(x, y, L); }
  }
  const free = (x, y) => inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water && !blk[ci(x, y, 0)] && !slab[ci(x, y, 0)];
  const lot = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water) tt[col(x, y)] = t; };
  const at = (x, y, id, d) => { if (free(x, y)) put(x, y, 0, id, d); };
  Object.assign(K, { put, putS, at, lot, free, blk, slab, bdir });
  if (M.landmarks) M.landmarks(K);
  // abandoned farmsteads out in the country: a ruined shell (broken walls, waist-high bits), a fenced yard, loot and cover
  const farms = [];
  for (let k = 0; k < 600 && farms.length < FT.farms; k++) {
    const fx = 4 + Math.floor(r() * (MW - 14)), fy = 4 + Math.floor(r() * (MH - 13));
    if (farms.some(([a, b]) => Math.abs(a - fx) + Math.abs(b - fy) < 34) || radioDist0(fx + 3, fy + 3) < BUILD_R + 10 || TOWN_HOUSES.some(([x0, y0, x1, y1]) => fx + 9 >= x0 - 5 && fx - 2 <= x1 + 5 && fy + 8 >= y0 - 5 && fy - 2 <= y1 + 5)) continue;
    let ok = true; for (let y = fy - 2; y <= fy + 8 && ok; y++) for (let x = fx - 2; x <= fx + 9 && ok; x++) { const i = col(x, y); if (!inMap(x, y) || G[i] !== 0 || tt[i] === TT.water || roadCells.has(i) || blk[ci(x, y, 0)]) ok = false; }
    if (!ok) continue;
    farms.push([fx, fy]);
    const x0 = fx, y0 = fy, x1 = fx + 6, y1 = fy + 4, gaps = new Set([(x0 + 2) + ',' + y1, (x0 + 3) + ',' + y1, x1 + ',' + (y0 + 2)]);
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) tt[col(x, y)] = TT.dirt;
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (!(x === x0 || x === x1 || y === y0 || y === y1) || gaps.has(x + ',' + y)) continue;
      if (r() < 0.16) continue;                                              // collapsed bits you can walk through
      put(x, y, 0, r() < 0.3 ? 50 : 24);
    }
    for (const [x, y, id] of [[x0 + 1, y0 + 1, 34], [x1 - 1, y0 + 1, 26], [x0 + 1, y1 - 1, 33], [x0 + 4, y0 + 2, 48], [x1 - 1, y1 - 1, 37]]) if (!blk[ci(x, y, 0)]) put(x, y, 0, id);
    for (let x = x0 - 2; x <= x1 + 2; x++) if (r() < 0.75) put(x, y1 + 3, 0, 27);      // the yard fence
    put(x1 + 2, y0, 0, 40); put(x1 + 2, y0 + 1, 0, 26); if (r() < 0.5) put(x0 - 2, y0 + 1, 0, 25, Math.floor(r() * 4)); // a log pile, a crate, an old car
  }
  // trees, rocks, bushes, log piles, scrap. Trees grow in clumps (noise), keep 2 cells off the roads and 3 off the town,
  // and leave the forest trails open.
  const clearNear = (x, y) => Math.max(Math.abs(x - RX), Math.abs(y - RY)) <= 9;
  const nearRoad = new Set(); for (let i = 0; i < MW * MH; i++) { if (!roadCells.has(i) && tt[i] !== TT.road) continue; const x = i % MW, y = Math.floor(i / MW); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inMap(x + dx, y + dy)) nearRoad.add(col(x + dx, y + dy)); }
  const farmNear = (x, y) => farms.some(([a, b]) => x >= a - 3 && x <= a + 10 && y >= b - 3 && y <= b + 9);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = col(x, y), t = tt[i], g = G[i];
    if (t === TT.water || t === TT.road || roadCells.has(i) || trail.has(i) || clearNear(x, y) || inTown(x, y, 1) || blk[ci(x, y, g)] || farmNear(x, y)) continue;
    if (M.noVeg && M.noVeg(x, y)) continue;
    if (DIRS.some(([dx, dy]) => inMap(x + dx, y + dy) && blk[ci(x + dx, y + dy, G[col(x + dx, y + dy)])] === 28)) continue; // keep both ends of a ramp clear
    const VG = M.veg || {}, clump = 0.3 + 1.4 * noise(x + 2000, y + 50, 5), noTree = nearRoad.has(i) || inTown(x, y, 3);
    const pTree = noTree ? 0 : (t === TT.forest ? 0.2 : t === TT.hill ? 0.06 : t === TT.grass ? 0.02 : 0.008) * clump * (VG.tree == null ? 1 : VG.tree);
    const pRock = (t === TT.rocky ? 0.14 : t === TT.hill ? 0.04 : 0.012) * (VG.rock == null ? 1 : VG.rock);
    const v = r();
    if (v < pTree) put(x, y, g, 22); else if (v < pTree + pRock) put(x, y, g, 21);
    else if (v < pTree + pRock + (t === TT.forest ? 0.05 : t === TT.meadow ? 0.04 : 0.022) * (VG.bush == null ? 1 : VG.bush)) put(x, y, g, 41);
    else if (v < pTree + pRock + 0.02 && t === TT.forest) put(x, y, g, 40);
    else if (v < pTree + pRock + 0.025 && (t === TT.hill || t === TT.dirt || t === TT.rocky)) put(x, y, g, 39);
  }
  // fallen trees along the forest trails
  for (const i of trail) { if (r() > 0.03) continue; const x = i % MW, y = Math.floor(i / MW); for (const [dx, dy] of DIRS) { const xx = x + dx, yy = y + dy; if (inMap(xx, yy) && tt[col(xx, yy)] === TT.forest && !blk[ci(xx, yy, G[col(xx, yy)])]) { put(xx, yy, G[col(xx, yy)], 40); break; } } }
  // cars on the roads (not on bridges), crates in the open
  let cars = M.cars;
  if (!cars) { cars = []; const rc = [...roadCells].filter(i => tt[i] !== TT.water); for (let k = 0; k < 400 && cars.length < (M.nCars || 28); k++) { const i = rc[Math.floor(r() * rc.length)], x = i % MW, y = Math.floor(i / MW); if (!cars.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 8) && radioDist0(x, y) > 9) cars.push([x, y]); } }
  for (const [x, y] of cars) if (inMap(x, y) && !slab[ci(x, y, 0)] && G[col(x, y)] === 0 && !blk[ci(x, y, 0)]) put(x, y, 0, 25, Math.floor(r() * 4));
  const crates = M.crates || Array.from({ length: Math.round(19 * MW * MH / 25600) }, () => [Math.floor(r() * MW), Math.floor(r() * MH)]);
  for (const [x, y] of crates) if (inMap(x, y) && !blk[ci(x, y, G[col(x, y)])] && tt[col(x, y)] !== TT.water && radioDist0(x, y) > 9) put(x, y, G[col(x, y)], 26);
  if (M.after) M.after(K);
  for (const [x0, y0, x1, y1] of TOWN_HOUSES) for (let x = x0 - 1; x <= x1 + 1; x++) { const y = y1 + 2; if (inMap(x, y) && !blk[ci(x, y, 0)] && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.road && tt[col(x, y)] !== TT.water && hash2(x, y) < 0.7) put(x, y, 0, 27); }
  // spots
  const spots = [];
  for (let i = 0; i < NC; i++) if (B[blk[i]].spot) spots.push({ i, k: B[blk[i]].spot, searched: false });
  return { G, tt, blk, bhp, slab, shp, bdir, spots, radio: { x: RX, y: RY }, bench: { x: RX + 4, y: RY } };
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
// which way can a ladder in (x,y,L) face? the preferred facing if it works, else any wall next to it
// (round 22) a ladder picks its own side: the wall with somewhere to stand on top wins, so it doesn't matter which way you face
function ladderDir(x, y, L, pref) {
  let best = pref, bs = -1;
  for (let d = 0; d < 4; d++) {
    if (canPlace(x, y, L, 6, d)) continue;
    const [dx, dy] = DIRS[d]; let s = 1 + (d === pref ? 0.1 : 0);
    if (standable(x + dx, y + dy, L + 1, 'p')) s += 2;
    if (standable(x - dx, y - dy, L, 'p')) s += 0.5;                       // room to step on at the foot
    if (s > bs) { bs = s; best = d; }
  }
  return best;
}
// (round 25) clutter that gear items (traps, cover, turret, lamp, jump pad) may simply go on top of: bushes, and searched / empty loot spots lying on the floor
function softCell(i) { const b = W.blk[i]; if (!b) return true; if (b === 41) return true; const Bb = B[b]; return !!(Bb.spot && !Bb.B && !Bb.top && W.srch && W.srch.has(i)); }
function canPlace(x, y, L, id, dir) {
  if (!inMap(x, y) || !(modeDef().anyBuild || inZone(x, y) || (B[id] && B[id].any))) return '只能在营地周围的建造区（黄框）内建造';
  if (!hasBP(id)) return '还没有「' + B[id].name + '」的蓝图：去搜箱子、清理丧尸占着的楼';
  if (L < 0 || L >= ML - 1) return '太高了';
  const g = gAt(x, y), i = ci(x, y, L), Bi = B[id];
  if (L < g) return '这里是实心地面';
  const water = ttAt(x, y) === TT.water && L === 0;
  if (Bi.slab) {
    if (W.slab[i]) return '这里已经有楼板了';
    if (L === g && !water) return '地面上不用铺楼板';
    if (B[W.blk[i]].stairs) return '梯子这格不能铺楼板';
    if (L > 0 && B[blkAt(x, y, L - 1)].stairs) return '这是梯子口，留空才能上下';
  } else {
    if (water && !W.slab[i]) return '水面要先铺楼板';
    if (W.blk[i] && !(Bi.any && softCell(i))) return '这里已经有东西了';
    if (Bi.stairs) {
      if (L + 1 >= ML) return '太高了'; if (W.slab[ci(x, y, L + 1)]) return '梯子上方有楼板，先拆掉';
      const [dx, dy] = DIRS[dir || 0], fb = blkAt(x + dx, y + dy, L);
      if (!B[fb].top || !(B[fb].P || B[fb].Z) || B[fb].stairs) return '爬梯要贴着墙放';
      if (W.blk[ci(x + dx, y + dy, L + 1)] && !B[W.blk[ci(x + dx, y + dy, L + 1)]].dep) return '这面墙上面还有墙，爬上去没地方站';
    }
    if (Bi.P || Bi.Z) {
      const hit = e => Math.floor(e.x) === x && Math.floor(e.y) === y && e.L === L;
      for (const p of W.p) if (!p.gone && !p.dead && hit(p)) return '有人站在这里';
      for (const z of W.zs) if (hit(z)) return '有丧尸挡着';
    }
  }
  if (supportIf(x, y, L, id) <= 0) return Bi.dep ? '下面要有地面或楼板' : '没有支撑，会塌';
  return '';
}
