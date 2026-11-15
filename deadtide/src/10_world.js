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
// a player wall (wood / brick / steel) above ground level with nothing on top: waist-high parapet you can shoot over
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
const TOWN_HOUSES = [
  // [x0, y0, x1, y1, storeys, type]: big blocks, one or two per street block. apt: apartment block (corridor, rooms,
  // balconies, roof); villa: big house with rooms, balcony and an attic under a pitched roof; ware: warehouse with a mezzanine.
  [33, 62, 54, 76, 2, 'villa'], [61, 62, 86, 77, 4, 'apt'], [94, 58, 121, 75, 5, 'apt'], [128, 58, 155, 74, 3, 'apt'],
  [36, 81, 54, 96, 2, 'ware'], [62, 81, 87, 96, 2, 'villa'], [95, 81, 121, 96, 2, 'ware'], [129, 80, 155, 96, 2, 'villa'],
  [33, 104, 54, 124, 3, 'apt'], [61, 105, 87, 124, 2, 'ware'], [94, 104, 121, 124, 4, 'apt'], [128, 104, 155, 124, 2, 'villa'],
  [33, 132, 54, 156, 2, 'villa'], [61, 132, 87, 156, 5, 'apt'], [94, 133, 121, 156, 2, 'ware'], [128, 132, 155, 156, 3, 'apt'],
  [48, 3, 58, 11, 1, 'barn'],
];
const RADIO_XY = [48, 40];
function genMap(seed) {
  const r = mulberry(seed ^ 0x2545F491);
  const G = new Uint8Array(MW * MH), tt = new Uint8Array(MW * MH);
  const blk = new Uint8Array(NC), bhp = new Float32Array(NC), slab = new Uint8Array(NC), shp = new Float32Array(NC), bdir = new Uint8Array(NC);
  const col = (x, y) => y * MW + x;
  const noise = (x, y, s) => { const xi = Math.floor(x / s), yi = Math.floor(y / s), fx = x / s - xi, fy = y / s - yi; const v = (a, b) => hash2(a + seed % 997, b + 31); const sm = t => t * t * (3 - 2 * t); return lerp(lerp(v(xi, yi), v(xi + 1, yi), sm(fx)), lerp(v(xi, yi + 1), v(xi + 1, yi + 1), sm(fx)), sm(fy)); };
  const [RX, RY] = RADIO_XY;
  const inTown = (x, y, pad) => TOWN_HOUSES.some(([x0, y0, x1, y1]) => x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad);
  // hills (kept away from the base and the town)
  const hill = (cx, cy, rad, top) => { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { if (inTown(x, y, 2) || Math.max(Math.abs(x - RX), Math.abs(y - RY)) <= BUILD_R + 1) continue; const d = d2(x, y, cx, cy) / rad + (noise(x, y, 5) - 0.5) * 0.45; if (d < 1) { G[col(x, y)] = Math.max(G[col(x, y)], 1); tt[col(x, y)] = TT.hill; } if (top && d < 0.48) G[col(x, y)] = 2; } };
  hill(80, 20, 12.5, true); hill(105, 32, 9, true); hill(119, 11, 6.5, false); hill(10, 84, 7.5, true); hill(26, 8, 5.5, false); hill(12, 116, 6, false);
  // river (west), lake (south-west of town), farm pond (north)
  const riverC = y => 16 + 3 * Math.sin(y / 11 + 1.3) + 1.4 * Math.sin(y / 3.7);
  for (let y = 0; y < MH; y++) { const c = Math.round(riverC(y)), w = 2 + (noise(0, y, 6) > 0.55 ? 1 : 0); for (let x = c; x < c + w; x++) { G[col(x, y)] = 0; tt[col(x, y)] = TT.water; } }
  const pond = (cx, cy, rx, ry) => { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy + (noise(x, y, 3) - 0.5) * 0.5 < 1) { G[col(x, y)] = 0; tt[col(x, y)] = TT.water; } } };
  pond(30, 87, 5.5, 3.8); pond(66, 8, 3.2, 2.4);
  // roads: main east-west road y 51-52, town road x 57-58 south of it, farm track x 44-45 north
  const roadCells = new Set();
  const road = (x, y) => { if (!inMap(x, y) || G[col(x, y)] !== 0) return; if (tt[col(x, y)] !== TT.water) tt[col(x, y)] = TT.road; roadCells.add(col(x, y)); };
  for (let x = 0; x < MW; x++) { road(x, 51); road(x, 52); }
  for (let y = 53; y < MH; y++) { road(57, y); road(58, y); }
  for (let y = 0; y < 19; y++) { road(44, y); road(45, y); }
  for (let x = 30; x <= MW - 2; x++) { road(x, 100); road(x, 101); road(x, 128); road(x, 129); } // town cross streets
  for (let y = 53; y < MH; y++) { road(90, y); road(91, y); road(124, y); road(125, y); }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = col(x, y);
    if (tt[i] === TT.grass) { const n = noise(x, y, 7); if ((x < riverC(y) - 1 && n > 0.22) || (n > 0.8 && !inTown(x, y, 3))) tt[i] = TT.forest; else if (n < 0.16) tt[i] = TT.dirt; }
    if (tt[i] !== TT.water && tt[i] !== TT.road) for (const [dx, dy] of DIRS) { const xx = x + dx, yy = y + dy; if (inMap(xx, yy) && tt[col(xx, yy)] === TT.water && G[i] === 0) { tt[i] = TT.sand; break; } }
  }
  // farm fields north of the base: ploughed rows between the track and the barn
  for (let y = 2; y <= 14; y++) for (let x = 32; x <= 43; x++) if (G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water && tt[col(x, y)] !== TT.road) tt[col(x, y)] = y % 2 ? TT.dirt : TT.grass;
  // fill terrain below ground; water
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[col(x, y)]; for (let L = 0; L < g; L++) blk[ci(x, y, L)] = 20; if (tt[col(x, y)] === TT.water) blk[ci(x, y, 0)] = 23; }
  // bridges over the river: the main road, a northern footbridge, a southern one
  const bridgeRow = (ys) => { for (const y of ys) for (let x = 0; x < 30; x++) if (tt[col(x, y)] === TT.water) { blk[ci(x, y, 0)] = 0; slab[ci(x, y, 0)] = SLAB_BRIDGE; } };
  bridgeRow([51, 52]); bridgeRow([22]); bridgeRow([74]);
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
  // town: ruined buildings in the style of a real small town. Every type has rooms, ladders hung on inner walls (each climbs
  // through a hatch onto the top of that wall, where the wall upstairs leaves a doorway), and things to search on each floor.
  TOWN_HOUSES.forEach((H, k) => genBuilding(H, k));
  function genBuilding([x0, y0, x1, y1, st, type], k) {
    const rr = mulberry(seed ^ (k * 7919 + 17));
    const ok = (x, y) => inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water;
    const okIn = (x, y) => ok(x, y) && tt[col(x, y)] !== TT.road;
    const pad = type === 'apt' || type === 'villa' ? 2 : 0;
    for (let x = x0 - pad; x <= x1 + pad; x++) for (let y = y0 - pad; y <= y1 + pad; y++) { if (!ok(x, y)) continue; for (let L = 0; L <= st + 1 && L < ML; L++) { blk[ci(x, y, L)] = 0; if (L) slab[ci(x, y, L)] = 0; } if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && tt[col(x, y)] !== TT.road) tt[col(x, y)] = TT.dirt; }
    const W_ = (x, y, L, id = 24) => { if (okIn(x, y) && L < ML) put(x, y, L, id); };
    const F_ = (x, y, L, id = 5) => { if (ok(x, y) && L < ML) putS(x, y, L, id); };
    const isEdge = (x, y) => x === x0 || x === x1 || y === y0 || y === y1;
    const lads = [], gaps = new Set(), hatches = new Set(), K = (x, y, L) => x + ',' + y + ',' + L;
    // hang a ladder on wall cell (wx,wy) at floor L, standing on side (sx,sy); the wall upstairs gets a doorway there
    const ladder = (wx, wy, sx, sy, L) => {
      const cx = wx + sx, cy = wy + sy, dir = sx > 0 ? 2 : sx < 0 ? 0 : sy > 0 ? 3 : 1;
      if (hatches.has(K(cx, cy, L)) || gaps.has(K(cx, cy, L)) || hatches.has(K(wx, wy, L + 1))) return false;
      lads.push([cx, cy, L, dir]); gaps.add(K(wx, wy, L + 1)); hatches.add(K(cx, cy, L + 1)); return true;
    };
    const floors = (from, to, hole) => // hatches are left open here and closed again at the end if their ladder is dropped
      { for (let L = from; L <= to && L < ML; L++) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (!hatches.has(K(x, y, L)) && !(hole && hole(x, y, L))) F_(x, y, L); };
    const perim = (L, gapP, keep) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { if (!isEdge(x, y)) continue; const corner = (x === x0 || x === x1) && (y === y0 || y === y1); if (!corner && !(keep && keep(x, y)) && rr() < gapP) { if (L === 0 && rr() < 0.4) W_(x, y, 0, 29); continue; } W_(x, y, L); } };
    const balcony = (side, a, L) => { // a 3-wide balcony on the north (-1) or south (+1) side of the building, rail round it
      const yb = side < 0 ? y0 - 1 : y1 + 1, yr = side < 0 ? y0 - 2 : y1 + 2, yw = side < 0 ? y0 : y1;
      for (let x = a - 1; x <= a + 3; x++) { F_(x, yb, L); F_(x, yr, L); W_(x, yr, L, 42); }
      W_(a - 1, yb, L, 42); W_(a + 3, yb, L, 42); blk[ci(a + 1, yw, L)] = 0; // the balcony door
    };
    const loot = (L, n, ids) => { for (let j = 0; j < n * 4 && n > 0; j++) { const x = x0 + 1 + Math.floor(rr() * (x1 - x0 - 1)), y = y0 + 1 + Math.floor(rr() * (y1 - y0 - 1)), i = ci(x, y, L); if (blk[i] || !okIn(x, y) || (L > 0 && !slab[i]) || hatches.has(K(x, y, L)) || lads.some(q => q[2] === L && Math.abs(q[0] - x) + Math.abs(q[1] - y) < 2)) continue; put(x, y, L, ids[Math.floor(rr() * ids.length)]); n--; } };
    const doorsOn = (cells) => { for (const [x, y] of cells) if (okIn(x, y)) { blk[ci(x, y, 0)] = 0; put(x, y, 0, 7); } };
    if (type === 'apt') {
      // a corridor down the middle, rooms 3 wide on both sides, two ladders per floor on the room walls
      const py = Math.floor((y0 + y1) / 2), xs = []; for (let x = x0 + 4; x < x1 - 1; x += 4) xs.push(x);
      for (let L = 0; L < st; L++) {
        const ya = y0 + 2 + Math.floor(rr() * Math.max(1, py - y0 - 3)), yb = py + 2 + Math.floor(rr() * Math.max(1, y1 - py - 3));
        const w1 = xs[Math.floor(rr() * xs.length)], w2 = xs[Math.floor(rr() * xs.length)];
        ladder(w1, ya, -1, 0, L) || ladder(w1, ya, 1, 0, L); ladder(w2, yb, 1, 0, L) || ladder(w2, yb, -1, 0, L);
      }
      floors(1, st);
      for (let L = 0; L < st; L++) {
        perim(L, L === 0 ? 0.06 : 0.16, (x, y) => y === py);
        for (let x = x0 + 1; x < x1; x++) for (const yy of [py - 1, py + 1]) { if (xs.some(w => x === w - 2) && !gaps.has(K(x, yy, L))) continue; if (!gaps.has(K(x, yy, L))) W_(x, yy, L); } // corridor walls, a door into every room
        for (const w of xs) for (let y = y0 + 1; y < y1; y++) { if (Math.abs(y - py) <= 1 || gaps.has(K(w, y, L))) continue; W_(w, y, L); }
        if (L >= 1) for (const w of xs) { if (rr() < 0.55) balcony(-1, w + 1, L); if (rr() < 0.55) balcony(1, w + 1, L); }
        loot(L, 3, [26, 29, 34, 34, 32]);
      }
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (isEdge(x, y) && !hatches.has(K(x, y, st))) W_(x, y, st, 42); // roof rail
      loot(st, 2, [26, 36, 37]);
      doorsOn([[x0, py], [x1, py], [Math.floor((x0 + x1) / 2), y1]]);
      blk[ci(Math.floor((x0 + x1) / 2), py + 1, 0)] = 0;
    } else if (type === 'villa' || type === 'barn') {
      const py = Math.floor((y0 + y1) / 2), px = x0 + Math.floor((x1 - x0) * (0.35 + rr() * 0.3));
      if (type === 'villa' && st > 1) for (let L = 0; L < st - 1; L++) { const a = x0 + 2 + Math.floor(rr() * (x1 - x0 - 4)); ladder(a, py, 0, 1, L) || ladder(a + 1, py, 0, -1, L); ladder(x0 + 1 + Math.floor(rr() * 2), py, 0, -1, L) || ladder(x1 - 2, py, 0, 1, L); }
      if (st > 1) floors(1, st - 1);
      for (let L = 0; L < st; L++) {
        perim(L, L === 0 ? 0.05 : 0.12);
        if (type === 'villa') {
          for (let x = x0 + 1; x < x1; x++) { if (gaps.has(K(x, py, L)) || (x - x0) % 6 === 3) continue; W_(x, py, L); }                    // front / back rooms, a doorway every 6
          for (let wx = x0 + 6 + (L % 2) * 2; wx < x1 - 2; wx += 6) for (let y = y0 + 1; y < y1; y++) if (y !== py && y !== py - 2 && y !== py + 2 && !gaps.has(K(wx, y, L))) W_(wx, y, L); // side rooms
          if (L >= 1 && L === st - 1) balcony(1, Math.floor((x0 + x1) / 2) - 1, L);
        }
        loot(L, type === 'barn' ? 3 : 2, [26, 29, 34, 35, 32]);
      }
      if (type === 'villa') doorsOn([[Math.floor((x0 + x1) / 2), y1], [x0 + 2, y0], [x1, py + 2]]); else for (const [x, y] of [[Math.floor((x0 + x1) / 2), y1], [Math.floor((x0 + x1) / 2) + 1, y1]]) blk[ci(x, y, 0)] = 0;
    } else if (type === 'ware') {
      // a tall hall (two storeys of wall), a mezzanine along the north side reached by ladders on its pillars, rows of shelves
      const my = y0 + 3;
      for (let x = x0 + 1; x < x1; x++) for (let y = y0 + 1; y <= my; y++) F_(x, y, 1);
      const pillars = []; for (let x = x0 + 3; x < x1 - 1; x += 4) pillars.push(x);
      for (const x of pillars) W_(x, my, 0);
      const lp = [pillars[0], pillars[pillars.length - 1]];
      for (const x of lp) { lads.push([x, my + 1, 0, 3]); gaps.add(K(x, my, 1)); }
      for (let x = x0 + 1; x < x1; x++) if (!lp.includes(x)) W_(x, my, 1, 42);                       // mezzanine rail
      perim(0, 0.04); perim(1, 0.1, (x, y) => true);
      for (let L = 1; L < 2; L++) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (isEdge(x, y) && (x + y) % 3 === 0 && y !== y0) blk[ci(x, y, 1)] = 0; // high windows
      for (let y = my + 3; y < y1 - 1; y += 3) for (let x = x0 + 3; x < x1 - 2; x++) if ((x - x0) % 6 !== 0 && okIn(x, y) && !blk[ci(x, y, 0)]) put(x, y, 0, [34, 26, 37, 40, 34][Math.floor(rr() * 5)]); // shelves / crates / drums
      loot(1, 3, [26, 36, 35]);
      const dx = Math.floor((x0 + x1) / 2); for (const x of [dx, dx + 1]) blk[ci(x, y1, 0)] = 0; doorsOn([[x0, y1 - 2], [x1, my + 2]]);
    }
    const placed = new Set();
    for (const [cx, cy, L, dir] of lads) {
      const [dx, dy] = DIRS[dir], fb = blk[ci(cx + dx, cy + dy, L)], up = blk[ci(cx + dx, cy + dy, L + 1)];
      const exitOk = !up || !(B[up].P || B[up].Z);
      if (!fb || !B[fb].top || !(B[fb].P || B[fb].Z) || B[fb].stairs || !exitOk || !okIn(cx, cy) || blk[ci(cx, cy, L)] === 7) continue; // no wall to hang on: no ladder (the floor above stays closed)
      blk[ci(cx, cy, L)] = 0; slab[ci(cx, cy, L + 1)] = 0; shp[ci(cx, cy, L + 1)] = 0; put(cx, cy, L, 6, dir); placed.add(K(cx, cy, L + 1));
    }
    for (const h of hatches) if (!placed.has(h)) { const [x, y, L] = h.split(',').map(Number); if (L <= st && L < ML && okIn(x, y) && !slab[ci(x, y, L)] && (type !== 'ware' || y <= y0 + 3)) F_(x, y, L); }
  }
  // landmarks: gas station, parking lot, park, military checkpoint, junkyard, campsites
  const free = (x, y) => inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water && !blk[ci(x, y, 0)] && !slab[ci(x, y, 0)];
  const lot = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water) tt[col(x, y)] = t; };
  const at = (x, y, id, d) => { if (free(x, y)) put(x, y, 0, id, d); };
  lot(74, 54, 86, 61, TT.road); at(78, 56, 37); at(82, 56, 37); at(76, 60, 38); at(84, 60, 38); at(80, 58, 25, 0); at(86, 55, 32); at(74, 61, 32);       // gas station
  lot(40, 54, 54, 59, TT.road); for (const [x, y, d] of [[42, 55, 1], [45, 55, 1], [51, 55, 3], [43, 58, 1], [49, 58, 3], [53, 58, 1]]) at(x, y, 25, d); at(54, 54, 32); // parking lot
  for (let x = 4; x <= 20; x++) for (const y of [140, 150]) if ((x + y) % 3) at(x, y, 41);                                                           // park out west: hedges
  at(8, 145, 22); at(15, 146, 22); at(12, 144, 38); at(18, 142, 33);
  for (const [x, y] of [[104, 49], [105, 49], [107, 49], [108, 49], [104, 54], [105, 54], [107, 54], [108, 54]]) at(x, y, 27);                     // checkpoint
  at(103, 48, 36); at(109, 55, 36); at(106, 48, 37); at(110, 50, 25, 1);
  lot(112, 38, 124, 47, TT.dirt); for (let k = 0; k < 9; k++) at(113 + Math.floor(r() * 11), 39 + Math.floor(r() * 8), 39);                          // junkyard
  for (const [x, y, d] of [[114, 41, 0], [119, 44, 1], [122, 39, 2], [116, 46, 3]]) at(x, y, 25, d); at(124, 42, 37); at(112, 45, 37); at(118, 38, 35);
  for (let x = 111; x <= 125; x++) for (const y of [37, 48]) if (r() < 0.75) at(x, y, 27);
  for (const [cx, cy] of [[8, 32], [97, 14], [12, 100], [74, 34]]) { at(cx, cy, 33); at(cx + 1, cy + 1, 40); at(cx - 1, cy + 2, 40); at(cx + 2, cy - 1, 41); at(cx - 2, cy, 41); } // campsites
  at(46, 13, 40); at(47, 15, 40); at(59, 12, 39); at(60, 6, 35);                                                                                    // farmyard
  // trees, rocks, bushes, log piles, scrap
  const clearNear = (x, y) => Math.max(Math.abs(x - RX), Math.abs(y - RY)) <= 9;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = col(x, y), t = tt[i], g = G[i];
    if (t === TT.water || t === TT.road || roadCells.has(i) || clearNear(x, y) || inTown(x, y, 1) || blk[ci(x, y, g)]) continue;
    if (y >= 2 && y <= 14 && x >= 32 && x <= 43) continue; // fields
    const pTree = t === TT.forest ? 0.42 : t === TT.hill ? 0.1 : 0.035, pRock = t === TT.hill ? 0.05 : 0.018;
    const v = r();
    if (v < pTree) put(x, y, g, 22); else if (v < pTree + pRock) put(x, y, g, 21);
    else if (v < pTree + pRock + (t === TT.forest ? 0.05 : 0.025)) put(x, y, g, 41);
    else if (v < pTree + pRock + 0.032 && t === TT.forest) put(x, y, g, 40);
    else if (v < pTree + pRock + 0.03 && (t === TT.hill || t === TT.dirt)) put(x, y, g, 39);
  }
  // cars on the roads (not on bridges), crates in the open
  const cars = [[8, 51], [24, 52], [38, 51], [66, 52], [80, 51], [92, 52], [110, 51], [124, 52], [57, 60], [58, 71], [57, 90], [57, 108], [58, 122], [40, 76], [70, 77], [86, 76], [100, 77], [118, 76], [80, 101], [112, 100], [45, 100], [90, 60], [91, 84], [90, 112], [44, 6], [45, 16]];
  for (const [x, y] of cars) if (inMap(x, y) && !slab[ci(x, y, 0)] && G[col(x, y)] === 0 && !blk[ci(x, y, 0)]) put(x, y, 0, 25, Math.floor(r() * 4));
  for (const [x, y] of [[22, 40], [70, 30], [30, 60], [8, 30], [88, 64], [76, 6], [10, 66], [64, 101], [92, 102], [36, 30], [104, 44], [120, 30], [118, 56], [52, 115], [126, 110], [30, 120], [8, 120], [100, 8], [124, 96]]) if (inMap(x, y) && !blk[ci(x, y, G[col(x, y)])] && tt[col(x, y)] !== TT.water) put(x, y, G[col(x, y)], 26);
  // fences: around the farm fields and along the town lots
  for (let x = 31; x <= 43; x++) for (const y of [1, 15]) if (!blk[ci(x, y, 0)] && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.road && tt[col(x, y)] !== TT.water) put(x, y, 0, 27);
  for (let y = 2; y <= 14; y++) if (!blk[ci(31, y, 0)] && G[col(31, y)] === 0 && tt[col(31, y)] !== TT.water) put(31, y, 0, 27);
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
function ladderDir(x, y, L, pref) {
  for (const d of [pref, 0, 1, 2, 3]) if (d != null && !canPlace(x, y, L, 6, d)) return d;
  return pref;
}
function canPlace(x, y, L, id, dir) {
  if (!inMap(x, y) || !inZone(x, y)) return '只能在营地周围的建造区（黄框）内建造';
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
    if (W.blk[i]) return '这里已经有东西了';
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
