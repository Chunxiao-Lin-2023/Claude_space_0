/* ================= maps: presets for the world generator (setMap swaps the live lots / camp) ================= */
// Each preset: camp [x, y], lots (TOWN_HOUSES rows), hills [cx, cy, radius, top], river { c: y => x, w }, ponds [cx, cy, rx, ry],
// ocean(x, y, noise) -> water, roads(K), forestAt(x, y, n, K), fields/landmarks/after(K) hooks, veg multipliers, colours.
const MAPS = {};
MAPS.town = {
  name: '小镇', desc: '河边的小镇：公寓、警局、超市、修车厂，北边有农场', camp: [48, 40], lots: TOWN_LOTS,
  hills: [[80, 20, 12.5, true], [105, 32, 9, true], [119, 11, 6.5, false], [10, 84, 7.5, true], [26, 8, 5.5, false], [12, 116, 6, false]],
  river: { c: y => 16 + 3 * Math.sin(y / 11 + 1.3) + 1.4 * Math.sin(y / 3.7), w: 2 },
  ponds: [[30, 87, 5.5, 3.8], [66, 8, 3.2, 2.4]],
  bridges: [[22, 0, 30], [74, 0, 30]],
  roads({ road }) {
  for (let x = 0; x < MW; x++) { road(x, 51); road(x, 52); }
  for (let y = 53; y < MH; y++) { road(57, y); road(58, y); }
  for (let y = 0; y < 19; y++) { road(44, y); road(45, y); }
  for (let x = 30; x <= MW - 2; x++) { road(x, 100); road(x, 101); road(x, 128); road(x, 129); } // town cross streets
  for (let y = 53; y < MH; y++) { road(90, y); road(91, y); road(124, y); road(125, y); }
  },
  forestAt: (x, y, n, K) => (x < K.riverC(y) - 1 && n > 0.22) || (n > 0.8 && !K.inTown(x, y, 3)),
  fields({ G, tt, col }) {
  for (let y = 2; y <= 14; y++) for (let x = 32; x <= 43; x++) if (G[col(x, y)] === 0 && tt[col(x, y)] !== TT.water && tt[col(x, y)] !== TT.road) tt[col(x, y)] = y % 2 ? TT.dirt : TT.grass;
  },
  noVeg: (x, y) => y >= 2 && y <= 14 && x >= 32 && x <= 43,
  landmarks({ lot, at, r, free }) {
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

  },
  after({ blk, G, tt, col, put, ci }) {
  // fences: around the farm fields and along the town lots
  for (let x = 31; x <= 43; x++) for (const y of [1, 15]) if (!blk[ci(x, y, 0)] && G[col(x, y)] === 0 && tt[col(x, y)] !== TT.road && tt[col(x, y)] !== TT.water) put(x, y, 0, 27);
  for (let y = 2; y <= 14; y++) if (!blk[ci(31, y, 0)] && G[col(31, y)] === 0 && tt[col(31, y)] !== TT.water) put(31, y, 0, 27);

  },
  cars: [[8, 51], [24, 52], [38, 51], [66, 52], [80, 51], [92, 52], [110, 51], [124, 52], [57, 60], [58, 71], [57, 90], [57, 108], [58, 122], [40, 76], [70, 77], [86, 76], [100, 77], [118, 76], [80, 101], [112, 100], [45, 100], [90, 60], [91, 84], [90, 112], [44, 6], [45, 16]],
  crates: [[22, 40], [70, 30], [30, 60], [8, 30], [88, 64], [76, 6], [10, 66], [64, 101], [92, 102], [36, 30], [104, 44], [120, 30], [118, 56], [52, 115], [126, 110], [30, 120], [8, 120], [100, 8], [124, 96]],
};
MAPS.forest = {
  name: '林地', desc: '密林和河谷：伐木场、护林站、湖边小屋，视野短、近战多', camp: [80, 82],
  lots: [[18, 18, 42, 32, 2, 'ware'], [96, 14, 113, 25, 2, 'police'], [20, 100, 35, 111, 2, 'villa'], [44, 128, 66, 140, 3, 'apt'], [92, 100, 108, 110, 1, 'shop'], [128, 56, 150, 68, 1, 'garage'], [132, 120, 148, 131, 2, 'villa'], [46, 50, 62, 62, 2, 'clinic']],
  hills: [[30, 62, 8, true], [140, 142, 8, true], [70, 150, 5, false], [146, 92, 6, false], [100, 50, 5, false]],
  river: { c: y => 118 + 7 * Math.sin(y / 14) + 2 * Math.sin(y / 5), w: 3 },
  ponds: [[38, 122, 5, 3.5], [140, 36, 4, 3]],
  roads({ road }) {
    for (let x = 20; x <= 120; x++) { road(x, 34); road(x, 35); }
    for (let x = 8; x <= 156; x++) { road(x, 92); road(x, 93); }
    for (let x = 20; x <= 156; x++) { road(x, 114); road(x, 115); }
    for (let y = 8; y <= 152; y++) { road(70, y); road(71, y); }
    for (let y = 30; y <= 150; y++) { road(154, y); road(155, y); }
    for (let y = 26; y <= 34; y++) { road(104, y); road(105, y); }
  },
  forestAt: (x, y, n, K) => n > 0.3 && !K.inTown(x, y, 4) && Math.max(Math.abs(x - K.RX), Math.abs(y - K.RY)) > 12,
  veg: { tree: 1.0, bush: 1.4 }, feat: { farms: 2 },
  nCars: 14,
};
MAPS.desert = {
  name: '荒漠', desc: '开阔的荒漠和台地：公路交叉口的加油站、汽车旅馆，视野远、适合狙击', camp: [60, 100],
  lots: [[90, 76, 113, 88, 2, 'apt'], [40, 40, 56, 50, 1, 'shop'], [100, 40, 120, 52, 1, 'garage'], [120, 104, 138, 116, 2, 'police'], [36, 128, 60, 142, 2, 'ware'], [130, 16, 146, 28, 2, 'villa'], [96, 128, 112, 140, 2, 'clinic']],
  hills: [[26, 26, 9, true], [124, 44, 10, true], [146, 132, 8, true], [80, 146, 7, false], [18, 146, 7, true], [76, 18, 6, false], [140, 80, 6, false], [20, 80, 5, true]],
  ponds: [[106, 100, 4.5, 3.5]],
  roads({ road }) {
    for (let x = 0; x < MW; x++) { road(x, 70); road(x, 71); }
    for (let y = 0; y < MH; y++) { road(84, y); road(85, y); }
    for (let x = 20; x <= 150; x++) { road(x, 124); road(x, 125); }
    for (let y = 72; y <= 150; y++) { road(30, y); road(31, y); }
  },
  landmarks({ lot, at }) {
    lot(72, 60, 82, 68, TT.road); at(75, 62, 37); at(79, 62, 37); at(74, 66, 38); at(80, 66, 25, 0); at(82, 61, 32);          // gas station at the crossing
    for (const [x, y, d] of [[40, 72, 0], [60, 69, 2], [100, 72, 1], [130, 69, 0], [86, 30, 1], [84, 110, 3]]) at(x, y, 25, d); // wrecks on the highway
  },
  forestN: 0.86, dirtN: 0.3, veg: { tree: 0.22, rock: 1.3, bush: 0.6 }, feat: { mud: 0.2, meadow: 0.5, rocky: 1.1, farms: 3 }, /* (round 34d) desert rocks halved: they boxed you in */
  deco: { tuft: '#9a8a50', flower: ['#d8a040', '#c86a3a', '#e8d8a0'] },
  tcol: { [TT.grass]: ['#c8aa72', '#c2a46c', '#cfb17a'], [TT.hill]: ['#b48f5c', '#ad8956', '#b9945f'], [TT.forest]: ['#a99a62', '#a09158'], [TT.dirt]: ['#a8805a', '#b08860'], [TT.sand]: ['#d6bf8a', '#ddc792'], [TT.road]: ['#56524c', '#5a564f'] },
  mc: { [TT.grass]: '#c4a66e', [TT.hill]: '#a8845a', [TT.dirt]: '#a07a52', [TT.road]: '#55524c', [TT.sand]: '#d6bf8a', [TT.forest]: '#9c8e5c', [TT.water]: '#3a7a96' },
  trees: { pine: ['#5f6b3a', '#66723f', '#6e7a45'], oak: ['#7a7a45', '#8a8450'], trunk: '#5a4632' }, bush: '#8a8a52',
  nCars: 20,
};
const ISLES = [[80, 82, 46], [30, 28, 20], [132, 28, 21], [28, 134, 19], [134, 132, 22]];
MAPS.islands = {
  name: '海岛', desc: '一座大岛和四座小岛，桥连在一起：雨林、海滩，过桥是咽喉要道', camp: [80, 82],
  lots: [[84, 102, 98, 111, 1, 'shop'], [84, 50, 99, 60, 2, 'clinic'], [104, 76, 118, 87, 2, 'villa'], [20, 18, 36, 29, 2, 'villa'], [122, 18, 140, 30, 2, 'police'], [16, 126, 36, 137, 1, 'garage'], [122, 122, 144, 134, 3, 'apt'], [46, 70, 58, 80, 1, 'shop']],
  ocean: (x, y, noise) => !TOWN_HOUSES.some(([x0, y0, x1, y1]) => x >= x0 - 3 && x <= x1 + 3 && y >= y0 - 3 && y <= y1 + 3) && !(MAPDEF.isles || ISLES).some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r * (0.86 + noise(x, y, 9) * 0.28)), // (round 33) called in full-map coordinates; MAPDEF.isles = shifted + outskirts islands
  hills: [[70, 110, 5, false], [26, 22, 4, false], [138, 138, 5, true]],
  roads({ road }) {
    const line = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); road(x, y); road(x + 1, y); road(x, y + 1); } };
    line(62, 64, 98, 64); line(62, 100, 98, 100); line(62, 64, 62, 100); line(98, 64, 98, 100);
    line(62, 64, 30, 33); line(98, 64, 130, 34); line(62, 100, 40, 130); line(98, 100, 132, 119);
  },
  forestN: 0.42, veg: { tree: 1.0, bush: 1.5 }, feat: { mud: 0.8, farms: 2 },
  tcol: { [TT.grass]: ['#4f7a3a', '#548040', '#4a7436'], [TT.forest]: ['#36582a', '#3b5e2e'], [TT.sand]: ['#d8c88e', '#e0d196'] },
  mc: { [TT.grass]: '#4f7a3a', [TT.forest]: '#33552a', [TT.sand]: '#d8c88e', [TT.water]: '#2a7aa0' },
  trees: { pine: ['#2c5a2e', '#336233', '#3a6a38'], oak: ['#3f7a34', '#4a8538'] },
  nCars: 12,
};
MAPS.snow = {
  name: '雪原', desc: '冰天雪地：东北的军事基地、西南的村子、冰湖，白茫茫一片丧尸也难看清', camp: [52, 62],
  lots: [[126, 20, 144, 32, 2, 'police'], [100, 54, 116, 68, 2, 'ware'], [130, 54, 150, 66, 1, 'garage'], [20, 66, 34, 77, 2, 'villa'], [16, 86, 30, 97, 2, 'villa'], [36, 120, 52, 130, 1, 'shop'], [80, 118, 96, 130, 2, 'clinic'], [96, 88, 118, 100, 4, 'apt']],
  hills: [[106, 26, 10, true], [142, 96, 8, true], [26, 136, 8, true], [120, 140, 6, false], [20, 30, 7, false]],
  ponds: [[86, 76, 8, 5.5], [44, 100, 4, 3]],
  roads({ road }) {
    for (let x = 0; x < MW; x++) { road(x, 46); road(x, 47); }
    for (let y = 48; y < MH; y++) { road(72, y); road(73, y); }
    for (let x = 20; x <= 150; x++) { road(x, 112); road(x, 113); }
    for (let y = 48; y <= 112; y++) { road(120, y); road(121, y); }
    for (let y = 33; y <= 46; y++) { road(134, y); road(135, y); }
  },
  landmarks({ at }) { for (const [x, y] of [[124, 36], [126, 36], [128, 36], [140, 36], [142, 36], [144, 36]]) at(x, y, 27); at(130, 38, 36); at(138, 38, 36); }, // base gate
  forestN: 0.72, veg: { tree: 0.9, rock: 1.2 }, feat: { mud: 0.5, meadow: 0.4, farms: 3 },
  deco: { tuft: '#a9b8b4', flower: ['#ffffff', '#c8d8f0'] },
  tcol: { [TT.grass]: ['#e6ecef', '#dfe6ea', '#eef2f4'], [TT.hill]: ['#d3dce2', '#cdd7de', '#d9e1e6'], [TT.forest]: ['#c8d3da', '#c2ced6'], [TT.dirt]: ['#9d978e', '#a49e94'], [TT.road]: ['#5c6066', '#585c62'], [TT.sand]: ['#cfd8dc', '#c8d2d7'] },
  mc: { [TT.grass]: '#dfe6ea', [TT.hill]: '#c4ced6', [TT.forest]: '#9fb0b8', [TT.dirt]: '#9a948a', [TT.road]: '#55595e', [TT.sand]: '#cfd6da', [TT.water]: '#2b4a62' },
  trees: { pine: ['#3e5a52', '#45615a', '#4d6a62'], oak: ['#b8c7cc', '#c5d2d6'], trunk: '#4a3a30' }, bush: '#7f948f',
  nCars: 16,
};
MAPS.city = {
  name: '废城', desc: '密集的街区和高楼：楼多、巷子窄、到处是车，楼顶是好位置', camp: [80, 80],
  lots: [[18, 18, 37, 32, 5, 'apt'], [70, 18, 91, 32, 4, 'apt'], [98, 18, 117, 30, 2, 'clinic'], [124, 18, 143, 32, 5, 'apt'],
    [18, 44, 37, 58, 1, 'garage'], [44, 44, 63, 58, 3, 'apt'], [98, 44, 117, 58, 2, 'police'],
    [18, 70, 37, 84, 4, 'apt'], [44, 70, 63, 82, 2, 'villa'], [98, 70, 117, 84, 4, 'apt'],
    [18, 98, 37, 112, 2, 'clinic'], [44, 98, 63, 114, 5, 'apt'], [70, 98, 91, 112, 1, 'garage'], [98, 98, 117, 114, 3, 'apt'], [124, 98, 143, 112, 2, 'police'],
    [44, 124, 63, 140, 4, 'apt'], [98, 124, 117, 138, 1, 'shop'], [124, 70, 143, 82, 1, 'shop']],
  roads({ road }) { for (const g of [14, 40, 66, 94, 120, 146]) for (let k = 0; k < MW; k++) { road(g, k); road(g + 1, k); road(k, g); road(k, g + 1); } },
  forestN: 0.97, veg: { tree: 0.35, rock: 0.4, bush: 0.6 }, feat: { meadow: 0.5, rocky: 1.3, farms: 1 },
  tcol: { [TT.grass]: ['#5f6a4a', '#646f4e', '#5a6546'], [TT.dirt]: ['#6a625a', '#70675e'] },
  mc: { [TT.grass]: '#5f6a4a', [TT.dirt]: '#6a625a' },
  nCars: 48,
};
const MAP_IDS = ['town', 'forest', 'desert', 'islands', 'snow', 'city'];
let MAPDEF = MAPS.town, MAP_ID = 'town';
// switch the live map: building lots, camp position, and everything derived from them (house ids, roof cells, cut boxes)
// (round 33) the maps grew from 160×160 to 240×240: every preset is drawn in its own (classic) coordinates and shifted by MOFF into the middle;
// the ring around it gets roads out to the edge and themed outskirts scenes (OUTSKIRTS in 13_outskirts.js)
const WIDE = {};
// (round 33) where a preset's roads leave the old square: columns crossing the top/bottom edge and rows crossing the left/right one,
// so the outskirts scenes keep clear of the roads that carry on out to the new edge
function edgeRoads(M) {
  const E = { t: new Set(), b: new Set(), l: new Set(), r: new Set() }, N = MW0 - 1;
  M.roads({ road: (x, y) => { if (x < 0 || y < 0 || x > N || y > N) return; if (y === 0) E.t.add(x + MOFF); if (y === N) E.b.add(x + MOFF); if (x === 0) E.l.add(y + MOFF); if (x === N) E.r.add(y + MOFF); }, col: () => -1, roadCells: new Set() });
  return E;
}
function widen(id) {
  if (WIDE[id]) return WIDE[id];
  const M = MAPS[id], O = MOFF, sh = a => [a[0] + O, a[1] + O].concat(a.slice(2)), shLot = l => [l[0] + O, l[1] + O, l[2] + O, l[3] + O].concat(l.slice(4));
  const kOff = K => Object.assign({}, K, {
    road: (x, y) => x >= 0 && y >= 0 && x < MW0 && y < MW0 && K.road(x + O, y + O), col: (x, y) => { x += O; y += O; return x >= 0 && y >= 0 && x < MW && y < MH ? K.col(x, y) : -1; },
    lot: (a, b, c, d, t) => K.lot && K.lot(a + O, b + O, c + O, d + O, t), at: (x, y, id, d) => K.at && K.at(x + O, y + O, id, d),
    put: (x, y, L, id, d) => inMap(x + O, y + O) && K.put(x + O, y + O, L, id, d), putS: K.putS && ((x, y, L, s) => inMap(x + O, y + O) && K.putS(x + O, y + O, L, s)),
    free: (x, y) => K.free && K.free(x + O, y + O), ci: (x, y, L) => inMap(x + O, y + O) ? ci(x + O, y + O, L) : 0 });
  const X = typeof outskirtsFor === 'function' ? outskirtsFor(id, edgeRoads(M)) : { lots: [], isles: [], hills: [], cars: [], crates: [], roads() { }, props() { } };
  const D = Object.assign({}, M, {
    camp: sh(M.camp), lots: M.lots.map(shLot).concat(X.lots), hills: (M.hills || []).map(sh).concat(X.hills), ponds: (M.ponds || []).map(sh), bridges: (M.bridges || []).map(b => [b[0] + O, b[1] + O, b[2] + O]),
    isles: ISLES.map(sh).concat(X.isles), cars: M.cars ? M.cars.map(sh).concat(X.cars) : M.cars, crates: M.crates ? M.crates.map(sh).concat(X.crates) : M.crates,
    river: M.river ? { c: y => M.river.c(y - O) + O, w: M.river.w } : null,
    roads(K) {
      M.roads(kOff(K));
      // roads that ran into the old map edge carry on out to the new one
      const T = K.tt, cells = [...K.roadCells];
      const inScene = (x, y) => X.placed && X.placed.some(q => x >= q.x0 - 1 && x <= q.x1 + 1 && y >= q.y0 - 1 && y <= q.y1 + 1); // an edge road that runs into a scene stops there
      for (const i of cells) { const x = i % MW, y = Math.floor(i / MW);
        if (x === O) for (let k = O - 1; k >= 0 && !inScene(k, y); k--) K.road(k, y); if (x === O + MW0 - 1) for (let k = O + MW0; k < MW && !inScene(k, y); k++) K.road(k, y);
        if (y === O) for (let k = O - 1; k >= 0 && !inScene(x, k); k--) K.road(x, k); if (y === O + MW0 - 1) for (let k = O + MW0; k < MH && !inScene(x, k); k++) K.road(x, k); }
      X.roads(K);
    },
    fields: M.fields && (K => M.fields(kOff(K))), noVeg: M.noVeg && ((x, y) => M.noVeg(x - O, y - O)),
    landmarks: K => { if (M.landmarks) M.landmarks(kOff(K)); X.props(K); }, after: M.after && (K => M.after(kOff(K))),
    nCars: M.cars ? M.nCars : Math.round((M.nCars || 28) * 1.8), outskirts: X,
  });
  if (typeof outskirtsFor === 'function') WIDE[id] = D; return D; // (cache only once the outskirts module has loaded)
}
function setMap(id) {
  if (!MAPS[id]) id = 'town'; MAP_ID = id; MAPDEF = widen(id);
  TOWN_HOUSES.length = 0; for (const h of MAPDEF.lots) TOWN_HOUSES.push(h.slice());
  RADIO_XY[0] = MAPDEF.camp[0]; RADIO_XY[1] = MAPDEF.camp[1];
  if (typeof archMapInit === 'function') archMapInit();
  if (typeof cutHousesInit === 'function') cutHousesInit();
}
