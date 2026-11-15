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
  // [x0, y0, x1, y1, storeys]: bigger blocks of 1-4 storeys with yards between them
  [33, 62, 45, 72, 2], [62, 62, 74, 72, 3], [77, 64, 88, 74, 1], [95, 57, 107, 67, 4], [112, 62, 124, 73, 2],
  [37, 81, 50, 93, 3], [62, 86, 74, 97, 2], [78, 79, 88, 88, 1], [94, 82, 106, 94, 3], [112, 79, 124, 90, 2],
  [33, 106, 45, 117, 2], [47, 116, 55, 125, 1], [61, 104, 74, 115, 4], [78, 111, 89, 122, 2], [95, 104, 107, 116, 3], [112, 112, 124, 124, 2],
  // the barn up at the farm
  [48, 3, 58, 11, 1],
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
  for (let x = 30; x <= 126; x++) { road(x, 76); road(x, 77); } // town cross streets
  for (let x = 33; x <= 126; x++) { road(x, 100); road(x, 101); }
  for (let y = 53; y < MH; y++) { road(90, y); road(91, y); }
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
  // 11 x 11, two full floors and a roof terrace. A short partition wall in the middle carries the ladders:
  // they hang flat on the wall and climb through a hatch in the floor above onto the top of the wall.
  const X0 = RX - 5, X1 = RX + 5, Y0 = RY - 5, Y1 = RY + 5;
  const slit = (x, y) => (y === Y0 || y === Y1) && Math.abs(x - RX) === 3 || (x === X0 || x === X1) && Math.abs(y - RY) === 3;
  const hatch = new Set([(RX - 1) + ',' + (RY - 2) + ',1', (RX + 1) + ',' + (RY + 1) + ',1', (RX + 1) + ',' + (RY + 2) + ',2', (RX - 1) + ',' + (RY - 1) + ',2']);
  for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) {
    const edge = x === X0 || x === X1 || y === Y0 || y === Y1;
    if (edge) put(x, y, 0, (x === RX && (y === Y0 || y === Y1)) || ((x === X0 || x === X1) && y === RY) ? 7 : slit(x, y) ? 8 : 2); // a door on every side
    for (const L of [1, 2]) if (!hatch.has(x + ',' + y + ',' + L)) putS(x, y, L, 4);
    if (edge) { put(x, y, 1, slit(x, y) ? 8 : 1); put(x, y, 2, 1); } // first-floor walls; waist-high parapet round the roof
  }
  for (let y = RY - 2; y <= RY + 2; y++) { if (y !== RY) put(RX, y, 0, 2); if (y !== RY - 2 && y !== RY + 1) put(RX, y, 1, 1); }
  put(RX - 1, RY - 2, 0, 6, 0); put(RX + 1, RY + 1, 0, 6, 2); // ground -> first floor
  put(RX + 1, RY + 2, 1, 6, 2); put(RX - 1, RY - 1, 1, 6, 0); // first floor -> roof
  put(X0 + 2, Y0 + 2, 1, 10); put(X1 - 1, Y1 - 1, 2, 10);    // lamps
  put(RX - 2, RY + 2, 0, 31);
  // town: plastered ruins of 1-4 storeys. Concrete floors, a partition wall on every floor, and two ladders per floor hung on
  // that wall, each climbing through a hatch onto the top of the wall (a doorway in the partition upstairs).
  TOWN_HOUSES.forEach(([x0, y0, x1, y1, st], k) => {
    const rr = mulberry(seed ^ (k * 7919 + 17));
    const ok = (x, y) => inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water && tt[col(x, y)] !== TT.road;
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { if (G[col(x, y)] !== 0 || tt[col(x, y)] === TT.water) continue; for (let L = 0; L <= st + 1 && L < ML; L++) { blk[ci(x, y, L)] = 0; slab[ci(x, y, L)] = 0; } if (tt[col(x, y)] !== TT.road) tt[col(x, y)] = TT.dirt; }
    const vert = x1 - x0 >= y1 - y0, px = Math.floor((x0 + x1) / 2), py = Math.floor((y0 + y1) / 2), len = vert ? y1 - y0 - 1 : x1 - x0 - 1;
    const onPart = (x, y) => vert ? x === px && y > y0 && y < y1 : y === py && x > x0 && x < x1;
    const pc = a => vert ? [px, y0 + 1 + a] : [x0 + 1 + a, py];                 // partition cell #a
    // ladders: two per storey (not on the roof), on opposite faces of the partition
    const lad = [], used = new Set(), key = (x, y) => x + ',' + y;
    if (st > 1) for (let L = 0; L < st; L++) for (let j = 0; j < 2; j++) {
      for (let tries = 0; tries < 12; tries++) {
        const a = 1 + Math.floor(rr() * Math.max(1, len - 2)), [fx, fy] = pc(a), sd = (j + L) % 2 ? 1 : -1;
        const cx = vert ? fx + sd : fx, cy = vert ? fy : fy + sd, dir = vert ? (sd > 0 ? 2 : 0) : (sd > 0 ? 3 : 1);
        if (used.has(key(fx, fy) + L) || used.has(key(cx, cy) + L) || used.has(key(cx, cy) + (L + 1)) || used.has(key(fx, fy) + (L + 1))) continue;
        used.add(key(fx, fy) + L); used.add(key(cx, cy) + L); used.add(key(cx, cy) + (L + 1)); used.add(key(fx, fy) + (L + 1));
        lad.push({ L, cx, cy, dir, fx, fy }); break;
      }
    }
    const isExit = (x, y, L) => lad.some(q => q.L === L - 1 && q.fx === x && q.fy === y), isHatch = (x, y, L) => lad.some(q => q.L === L - 1 && q.cx === x && q.cy === y);
    const isFront = (x, y, L) => lad.some(q => q.L === L && q.fx === x && q.fy === y);
    for (let L = 0; L < st; L++) {
      const door = 1 + Math.floor(rr() * len);                                    // one doorway through the partition per floor
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        if (!ok(x, y)) continue;
        const edge = x === x0 || x === x1 || y === y0 || y === y1, corner = (x === x0 || x === x1) && (y === y0 || y === y1);
        if (edge) {
          if (!corner && rr() < (L === 0 ? 0.12 : 0.22)) { if (L === 0 && rr() < 0.5) put(x, y, 0, 29); continue; } // gaps / broken windows
          put(x, y, L, 24);
        } else if (onPart(x, y)) {
          const a = vert ? y - y0 - 1 : x - x0 - 1;
          if ((a === door - 1 || isExit(x, y, L)) && !isFront(x, y, L)) continue;
          put(x, y, L, 24);
        }
      }
    }
    for (let L = 1; L <= st && L < ML; L++) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (!ok(x, y) || isHatch(x, y, L)) continue;
      if (L < st && !onPart(x, y) && !(x === x0 || x === x1 || y === y0 || y === y1) && rr() < 0.03 && !lad.some(q => Math.abs(q.cx - x) + Math.abs(q.cy - y) < 3)) continue; // a few collapsed holes
      if (st > 1 || L < st) putS(x, y, L, 5);
    }
    if (st === 1) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (ok(x, y) && slab[ci(x, y, 1)]) { slab[ci(x, y, 1)] = 0; }
    for (const q of lad) if (q.L + 1 < st || st > 1) { blk[ci(q.cx, q.cy, q.L)] = 0; put(q.cx, q.cy, q.L, 6, q.dir); }
    // entrances: at least three sides get a real doorway on the ground floor
    const sides = [[x0 + 1, x1 - 1, y0, y0], [x0 + 1, x1 - 1, y1, y1], [x0, x0, y0 + 1, y1 - 1], [x1, x1, y0 + 1, y1 - 1]];
    for (let s = sides.length - 1; s > 0; s--) { const j = Math.floor(rr() * (s + 1)); [sides[s], sides[j]] = [sides[j], sides[s]]; }
    let open = 0;
    for (const [ax, bx, ay, by] of sides) {
      const cells = []; for (let x = ax; x <= bx; x++) for (let y = ay; y <= by; y++) if (ok(x, y)) cells.push([x, y]);
      if (!cells.length) continue;
      if (cells.some(([x, y]) => !blk[ci(x, y, 0)])) { open++; continue; }
      if (open >= 3) continue;
      cells.sort((a, b) => Math.abs(a[0] - (ax + bx) / 2) + Math.abs(a[1] - (ay + by) / 2) - Math.abs(b[0] - (ax + bx) / 2) - Math.abs(b[1] - (ay + by) / 2));
      const [x, y] = cells[0]; blk[ci(x, y, 0)] = 0; open++;
    }
    // loot on every floor and the roof
    for (let L = 0; L <= st; L++) for (let n = 0; n < (L === 0 ? 3 : 2); n++) {
      const x = x0 + 1 + Math.floor(rr() * (x1 - x0 - 1)), y = y0 + 1 + Math.floor(rr() * (y1 - y0 - 1)), i = ci(x, y, L);
      if (L >= ML || blk[i] || !ok(x, y) || (L > 0 && !slab[i]) || onPart(x, y) || isHatch(x, y, L) || lad.some(q => q.L === L && Math.abs(q.cx - x) + Math.abs(q.cy - y) < 2)) continue;
      put(x, y, L, n ? 29 : 26);
    }
  });
  // landmarks: gas station, parking lot, park, military checkpoint, junkyard, campsites
  const free = (x, y) => inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water && !blk[ci(x, y, 0)] && !slab[ci(x, y, 0)];
  const lot = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inMap(x, y) && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water) tt[col(x, y)] = t; };
  const at = (x, y, id, d) => { if (free(x, y)) put(x, y, 0, id, d); };
  lot(74, 54, 86, 61, TT.road); at(78, 56, 37); at(82, 56, 37); at(76, 60, 38); at(84, 60, 38); at(80, 58, 25, 0); at(86, 55, 32); at(74, 61, 32);       // gas station
  lot(40, 54, 54, 59, TT.road); for (const [x, y, d] of [[42, 55, 1], [45, 55, 1], [51, 55, 3], [43, 58, 1], [49, 58, 3], [53, 58, 1]]) at(x, y, 25, d); at(54, 54, 32); // parking lot
  for (let x = 60; x <= 74; x++) for (const y of [79, 84]) if ((x + y) % 3) at(x, y, 41);                                                           // park: hedges
  at(63, 81, 22); at(70, 82, 22); at(66, 82, 38); at(72, 80, 33);
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
  return { G, tt, blk, bhp, slab, shp, bdir, spots, radio: { x: RX, y: RY }, bench: { x: RX - 2, y: RY + 2 } };
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
