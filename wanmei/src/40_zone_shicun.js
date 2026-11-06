/* ================= 区域：苍莽山脉·石村 (星露谷式分区地图) =================
   石村位于苍莽山脉中。地图分成几块手工规划的区域，四周是密林或石壁，留出路口通往下一块：
     石村（柳神、族长家、祭台、药浴、篝火、村前空地）── 北门 ── 山林（狩猎区、藤后石洞）── 东北 ── 石林（梧木巢石崖）
     石村 ── 东口 ── 莽牛坡；  山林 ── 西口 ── 狈村边界（山林较深处） */
const ZONES = {};
const NEST_RIM = a => 8.5 * (1 + 0.13 * vnoise(Math.cos(a) * 2 + 186, Math.sin(a) * 2) + 0.07 * vnoise(Math.cos(a) * 5 + 3, Math.sin(a) * 5) + 0.025 * vnoise(Math.cos(a) * 14, Math.sin(a) * 14 + 5));
const VIL = { x: 0, z: 55 }, WILLOW = { x: 0, z: 13 }, CHIEF = { x: 13, z: 20 }, ALTAR = { x: -13, z: 22 }, YARD = { x: 0, z: 104 }, BATH = { x: -30, z: 78 }, NEST = { x: 186, z: -214 }, CAVE = { x: 70, z: -58 }, ARENA = { x: -172, z: -182 }, STONEF = { x: 140, z: -160 }, MEADOW = { x: 100, z: 140 };
addArea({ id: 'village', name: '石村', x0: -44, z0: -16, x1: 44, z1: 124, ground: T.GRASS });
addArea({ id: 'forest', name: '山林', x0: -60, z0: -112, x1: 104, z1: -34, ground: T.GRASS });
addArea({ id: 'stonef', name: '石林', x0: 106, z0: -236, x1: 212, z1: -120, ground: T.GRAVEL });
addArea({ id: 'meadow', name: '莽牛坡', x0: 58, z0: 96, x1: 150, z1: 176, ground: T.GRASS });
addArea({ id: 'beicun', name: '山林较深处', x0: -210, z0: -210, x1: -84, z1: -76, ground: T.FLOOR });
linkAreas('village', 'n', 0, 'forest', 's', 3); linkAreas('village', 'e', 99, 'meadow', 'w', 102); linkAreas('forest', 'e', -100, 'stonef', 'w', -140); linkAreas('forest', 'w', -80, 'beicun', 'e', -90);
const HOUSES = []; // [x, z(front), kind]
ZONES.shicun = {
  id: 'shicun', name: '苍莽山脉·石村', size: 640, seg: 160, light: 'day', lvCap: 12,
  base: { h: 10, amp: 0, sc: 0.01, ridge: 0, fine: 0 },
  noScatter: (x, z) => d2(x, z, NEST.x, NEST.z) < 15 * 15 || (Math.abs(x - NEST.x - 2) < 6 && z > NEST.z && z < NEST.z + 32),
  biome: { grass1: 0x4f8a3a, grass2: 0x86b04a, grass3: 0x3e7a3e, grassTip: 0xd8e88a, rock: 0x7a7468, rock2: 0x9a9284, dirt: 0xb4966a, dirt2: 0x9c7e56, sand: 0xc8b88a, bed: 0x4a5a50, rockSl: 0.24, hiRock: 60 },
  water: { deep: 0x1f6a7a, shal: 0x5ac0b8 },
  feat: [{ t: 'mesa', x: NEST.x, z: NEST.z, r: 8.5, fall: 3, h: 50, n: 0, rimF: NEST_RIM }],
  tiles: () => buildShicunTiles(),
  pois: [
    { name: '石村', x: VIL.x, z: VIL.z }, { name: '柳神', x: WILLOW.x, z: WILLOW.z, icon: '🌿' }, { name: '村前空地', x: YARD.x, z: YARD.z }, { name: '石林', x: STONEF.x, z: STONEF.z }, { name: '梧木巢', x: NEST.x, z: NEST.z },
    { name: '藤后石洞', x: CAVE.x, z: CAVE.z }, { name: '狩猎区', x: 22, z: -72 }, { name: '山林较深处', x: ARENA.x, z: ARENA.z }, { name: '莽牛坡', x: MEADOW.x, z: MEADOW.z },
  ],
};
/* ---------- ground tiles of every area (all rule-based: rectangles, discs and paths on the 1 m grid) ---------- */
function buildShicunTiles() {
  TG.t.fill(T.VOID);
  for (const A of AREAS) trect(A.x0, A.z0, A.x1, A.z1, A.ground);
  // ===== 石村 =====
  { const V = AREA_BY.village; HOUSES.length = 0;
    tpath([[0, -16], [0, 118]], 4, T.DIRT);                                  // main street, north gate to the yard
    for (const z of [38, 66, 94]) trect(-40, z, 40, z + 2, T.DIRT);          // three east–west lanes in front of the house rows
    tdisc(WILLOW.x, WILLOW.z + 4, 10.5, T.COBBLE, 0.06, 3);                    // 柳神 square
    tdisc(ALTAR.x, ALTAR.z + 3, 5, T.COBBLE, 0, 1);                            // 祭台
    trect(8, 20, 22, 30, T.DIRT);                                             // 族长家 front yard
    tdisc(VIL.x, VIL.z + 4, 8, T.COBBLE, 0.05, 7);                            // 篝火 square
    tdisc(BATH.x, BATH.z, 6.5, T.COBBLE, 0, 2);                               // 药浴
    tdisc(YARD.x, YARD.z, 13, T.DIRT, 0.08, 5);                               // 村前空地
    tpath([[44, 99], [16, 99], [10, 103]], 3, T.DIRT);                        // to 莽牛坡
    tdisc(-34, 108, 6.5, T.SAND, 0.15, 4); tdisc(-34, 108, 5, T.WATER, 0.15, 4); // pond
    for (const [row, xs] of [[36, [-36, -25, -14, 14, 25, 36]], [64, [-36, -25, 25, 36]], [92, [-36, -14, 14, 25, 36]]]) for (const x of xs) {
      HOUSES.push([x, row, HOUSES.length % 3 === 2 ? 'house2' : 'house']); trect(x - 1, row + 1, x + 1, row + 1, T.DIRT);                       // doorstep to the lane
      if ((x + row) % 3 === 0) trect(x + 4, row - 5, x + 6, row - 1, T.FIELD); else if ((x + row) % 3 === 1) trect(x - 6, row - 5, x - 4, row - 1, T.FIELD); }
    areaWalls(V, 3, T.WALL); }
  // ===== 山林 =====
  { const F = AREA_BY.forest;
    for (const [x, z, rx] of [[-30, -60, 16], [50, -92, 18], [-10, -96, 14], [80, -70, 10]]) tdisc(x, z, rx, T.FLOOR, 0.3, x);
    tpath([[-60, -96], [-40, -90], [-22, -98], [0, -94], [28, -102], [48, -112]], 3, T.SAND); tpath([[-60, -96], [-40, -90], [-22, -98], [0, -94], [28, -102], [48, -112]], 2, T.WATER); // stream
    const roads = [[[3, -34], [3, -46], [16, -62], [22, -70]], [[22, -70], [48, -64], [64, -58]], [[48, -64], [72, -80], [90, -96], [104, -100]], [[16, -62], [-10, -72], [-40, -80], [-60, -80]]];
    for (const r of roads) { tpath(r, 3, T.PLANK, [T.WATER]); tpath(r, 3, T.DIRT, [T.GRASS, T.FLOOR, T.SAND]); }
    tdisc(22, -72, 7, T.DIRT, 0.12, 9);                                      // hunters' camp
    trect(76, -68, 92, -48, T.ROCK); tdisc(84, -58, 9, T.ROCK, 0.2, 4); trect(64, -61, 75, -55, T.DIRT); // rock outcrop with the cave mouth
    areaWalls(F, 3, T.WALL); }
  // ===== 石林 =====
  { const S = AREA_BY.stonef;
    for (const [x, z, r] of [[124, -134, 9], [160, -140, 8], [196, -150, 10], [130, -200, 9]]) tdisc(x, z, r, T.GRASS, 0.35, x);
    tpath([[106, -140], [128, -150], [150, -170], [172, -194], [187, -203]], 3, T.DIRT);
    areaWalls(S, 4, T.ROCK); }
  // ===== 莽牛坡 =====
  { const M = AREA_BY.meadow; tdisc(124, 162, 7, T.SAND, 0.2, 2); tdisc(124, 162, 5.5, T.WATER, 0.2, 2); tpath([[58, 102], [80, 110], [100, 130]], 3, T.DIRT); areaWalls(M, 3, T.WALL); }
  // ===== 狈村边界 =====
  { const B = AREA_BY.beicun; for (const [x, z, r] of [[-120, -110, 14], [-150, -150, 12], [-110, -170, 10]]) tdisc(x, z, r, T.GRASS, 0.3, x);
    tdisc(ARENA.x, ARENA.z, 16, T.DIRT, 0.2, 11); tpath([[-84, -90], [-112, -112], [-150, -150], [-160, -166], [ARENA.x + 10, ARENA.z + 8]], 3, T.DIRT); areaWalls(B, 3, T.WALL); }
}
/* ---------- props ---------- */
const RABBIT_HOLES = [];
function forestDens(x, z) { const A = areaAt(x, z); if (!A) return 0; if (A.id === 'forest' || A.id === 'beicun') return tget(x, z) === T.FLOOR ? 1 : 0.55; if (A.id === 'meadow') return 0.12; return 0; }
function wallTrees(A, kinds, sp = 4.2) { // a forest edge on the inner rim of the area wall
  const R = mulberry32(A.x0 * 31 + A.z0); for (let z = A.z0; z <= A.z1; z += sp) for (let x = A.x0; x <= A.x1; x += sp) { const jx = x + R() * sp, jz = z + R() * sp; const t = tget(jx, jz); if (t !== T.WALL) continue; let nearOpen = false; for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) if (TSOLID[tget(jx + dx, jz + dz)] === 0) nearOpen = true; if (!nearOpen) continue; PLACE.scatter = true; try { place(kinds[Math.floor(R() * kinds.length)], jx, jz, 0, 0.85 + R() * 0.4); } finally { PLACE.scatter = false; } }
}
function buildShicunProps() {
  const Z = ZONES.shicun, rk = ['rock0', 'rock1', 'rock2', 'rock3'];
  LIFTS.length = 0; addLift({ x: NEST.x, z: NEST.z, r: 8.5, h: 11, crack: 1, seed: 5, rimF: NEST_RIM }); // the cliff under the eagle's nest
  // ===== 石村 =====
  HOUSES.forEach(([x, z, kind]) => place(kind, x, z, 0, 0.88, { force: true, flip: false }));
  place('chiefhouse', CHIEF.x + 2, CHIEF.z - 2, 0, 1, { force: true, flip: false });
  place('altar', ALTAR.x, ALTAR.z, 0.2); place('blackding', CHIEF.x - 1, CHIEF.z + 5, 0, 0.8); place('firepit', CHIEF.x + 3, CHIEF.z + 8.5, 0);
  place('tower', -8, -10, 0); place('tower', 8, -10, 0);
  for (const sd of [-1, 1]) for (let x = 12; x <= 40; x += 4.6) place('fence', sd * x, -9, HP, 1);
  place('stele', 4, 2, 0);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; place('ding', BATH.x + Math.cos(a) * 5, BATH.z + Math.sin(a) * 5, a, 1.2); }
  place('ding', YARD.x, YARD.z - 3, 0, 1.6);
  place('mill', YARD.x + 8, YARD.z + 2, 0); place('roller', YARD.x - 8, YARD.z + 3, 0.4); place('stonelock', YARD.x + 5, YARD.z - 7, 0); place('stonelock', YARD.x - 5, YARD.z - 7, 0.6); place('stonelock', YARD.x + 9, YARD.z - 5, 1.2);
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI + PI; place('rock' + (i % 4), YARD.x + Math.cos(a) * 15, YARD.z + Math.sin(a) * 13, a, 1.1); }
  place('firepit', VIL.x, VIL.z + 6, 0, 1.3); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3; place('rock' + (i % 4), VIL.x + Math.cos(a) * 3.6, VIL.z + 6 + Math.sin(a) * 3, a, 0.7, { flip: i % 2 === 0 }); }
  place('rack', VIL.x - 8, VIL.z + 2, 0); place('rack', VIL.x + 8.5, VIL.z + 2, 0); place('logpile', VIL.x + 6, VIL.z + 11, 0); place('pot', VIL.x - 6, VIL.z + 11, 0);
  HOUSES.forEach(([x, z], i) => { const sd = i % 2 ? 1 : -1; place(i % 3 ? 'pot' : 'logpile', x + sd * 4.6, z + 0.6, 0, 0.9); if (i % 2 === 0) place('rack', x - sd * 5.4, z - 3, 0); });
  for (let i = 0; i < 10; i++) place('reed', -34 + Math.cos(i * 0.63) * 6, 108 + Math.sin(i * 0.63) * 6, i, 0.9);
  // shade trees and flowerbeds on a loose grid in the gaps between the rows
  { const R = mulberry32(55); for (let z = -2; z <= 120; z += 6) for (let x = -40; x <= 40; x += 6) { const jx = x + R() * 3, jz = z + R() * 3; if (tget(jx, jz) !== T.GRASS) continue; const k = R(); if (k < 0.16) place(R() < 0.6 ? 'oak' : 'birch', jx, jz, 0, 0.75 + R() * 0.2); else if (k < 0.3) place('bush', jx, jz, 0, 0.8 + R() * 0.3); else if (k < 0.4) place('flowers', jx, jz, 0, 1); } }
  wallTrees(AREA_BY.village, ['oak', 'pine', 'oak', 'birch']);
  // ===== 山林 =====
  const F = 'forest';
  scatterPoints(Z, { area: F, sp: 5.5, seed: 3, dens: (x, z) => tget(x, z) === T.FLOOR ? 0.85 : 0.35 }, (x, z, h) => place(h < 0.45 ? 'oak' : h < 0.8 ? 'pine' : 'birch', x, z, 0, 0.8 + h * 0.5));
  scatterPoints(Z, { area: F, sp: 6, seed: 11, dens: () => 0.5 }, (x, z, h) => place(h < 0.45 ? 'bush' : h < 0.65 ? 'fern' : h < 0.8 ? 'mushroom' : 'grasstuft', x, z, 0, 0.8 + h * 0.4));
  scatterPoints(Z, { area: F, sp: 12, seed: 69, dens: () => 0.5 }, (x, z, h) => place(h < 0.5 ? 'log' : h < 0.75 ? 'stump' : rk[Math.floor(h * 13) % 4], x, z, 0, 0.9 + h * 0.3));
  for (let i = 0; i < 16; i++) place('reed', -50 + i * 6, -92 - (i % 3) * 3, i, 0.9);
  place('cave', CAVE.x + 6, CAVE.z, -HP, 1.1, { force: true });
  place('firepit', 22, -72, 0, 1.1); place('tent', 16, -76, 0); place('rack', 28, -76, 0); place('logpile', 27, -68, 0);
  RABBIT_HOLES.length = 0; for (const [x, z] of [[-34, -50], [40, -50], [-20, -84], [90, -84]]) { const it = place('rabbithole', x, z, 0, 1); if (it) RABBIT_HOLES.push({ x: it.x, z: it.z }); }
  wallTrees(AREA_BY.forest, ['pine', 'oak', 'pine', 'birch'], 3.6);
  // ===== 石林 =====
  scatterPoints(Z, { area: 'stonef', sp: 11, seed: 31, dens: () => 0.6, on: [T.GRAVEL, T.GRASS] }, (x, z, h) => place(h < 0.6 ? 'spire' : 'spire2', x, z, h * 9, 0.7 + h * 0.8, { dy: -1 }));
  scatterPoints(Z, { area: 'stonef', sp: 7, seed: 33, dens: () => 0.45, on: [T.GRAVEL, T.GRASS] }, (x, z, h) => place(h < 0.35 ? 'flint' : h < 0.6 ? 'thornbush' : h < 0.75 ? 'grasstuft' : rk[Math.floor(h * 13) % 4], x, z, 0, 0.8 + h * 0.5));
  for (let i = 0; i < 9; i++) { const a = i * 2.1, r = 12 + i * 4; place(i % 2 ? 'skull' : 'ribs', STONEF.x + Math.cos(a) * r, STONEF.z + Math.sin(a) * r, a, 1 + (i % 3) * 0.25); }
  place('nest', NEST.x, NEST.z - 0.8, 0, 1, { y: terrH(NEST.x, NEST.z), force: true });
  place('ribs', NEST.x + 5.6, NEST.z + 3.2, 0.6, 0.8); place('skull', NEST.x - 5.4, NEST.z + 3.6, 2.2, 0.6); place('pebbles', NEST.x + 3, NEST.z + 5.5, 0, 1);
  { const R = mulberry32(77); for (let i = 0; i < 26; i++) { const a = R() * TAU, r = 10.5 + R() * 5; const x = NEST.x + Math.cos(a) * r, z = NEST.z + Math.sin(a) * r; if (Math.abs(x - NEST.x - 1) < 3 && z > NEST.z) continue; place(R() < 0.3 ? 'boulder' : 'rock' + (i % 4), x, z, R() * TAU, R() < 0.3 ? 0.6 : 1.1); }
    place('deadtree', NEST.x - 12, NEST.z + 8, 0, 1.2); place('deadtree', NEST.x + 14, NEST.z - 4, 0, 1); }
  wallTrees(AREA_BY.stonef, ['spire', 'spire2', 'deadtree'], 5);
  // ===== 莽牛坡 =====
  scatterPoints(Z, { area: 'meadow', sp: 4.5, seed: 63, dens: () => 0.45 }, (x, z, h) => place(h < 0.55 ? 'grasstuft' : h < 0.75 ? 'flowers' : h < 0.85 ? 'sapling' : 'bush', x, z, 0, 0.8 + h * 0.5));
  scatterPoints(Z, { area: 'meadow', sp: 14, seed: 64, dens: () => 0.4 }, (x, z, h) => place(h < 0.5 ? 'birch' : 'oak', x, z, 0, 0.9 + h * 0.3));
  for (const [x, z] of [[80, 150], [130, 120], [100, 166]]) { const it = place('rabbithole', x, z, 0, 1); if (it) RABBIT_HOLES.push({ x: it.x, z: it.z }); }
  wallTrees(AREA_BY.meadow, ['oak', 'birch', 'pine']);
  // ===== 狈村边界 =====
  scatterPoints(Z, { area: 'beicun', sp: 5.5, seed: 81, dens: (x, z) => tget(x, z) === T.FLOOR ? 0.7 : 0.25, on: [T.FLOOR, T.GRASS] }, (x, z, h) => place(h < 0.5 ? 'pine' : h < 0.75 ? 'oak' : 'deadtree', x, z, 0, 0.9 + h * 0.4));
  scatterPoints(Z, { area: 'beicun', sp: 6, seed: 82, dens: () => 0.45, on: [T.FLOOR, T.GRASS] }, (x, z, h) => place(h < 0.4 ? 'fern' : h < 0.7 ? 'mushroom' : 'bush', x, z, 0, 0.9));
  for (let i = 0; i < 12; i++) { const a = i * 0.9, r = 15 + (i % 3) * 2; place('deadtree', ARENA.x + Math.cos(a) * r, ARENA.z + Math.sin(a) * r, a, 1); }
  for (let i = 0; i < 4; i++) place('tent', -200 + i * 8, -200 + (i % 2) * 5, i, 1); place('banner', -190, -192, 0); place('banner', -178, -196, 1);
  [[-200, -120], [-140, -196], [-96, -190]].forEach(([x, z], i) => place('ancient', x, z, i, 0.8));
  wallTrees(AREA_BY.beicun, ['pine', 'pine', 'oak']);
}
/* the 雷击木: 直径十几米焦黑树桩，只剩一条柳枝，晶莹如绿玉，夜里莹莹绿光笼罩全村 */
proto('willowstump', { w: 16, h: 15, ay: 0.86, col: 0, noFlip: true, fade: true, sh: [8, 1.6, 0.8, 0.3], draw(g, s, R) {
  // roots spreading over the ground
  for (let i = 0; i < 9; i++) { const a = PI * (0.05 + i / 8 * 0.9), x1 = Math.cos(a) * 7.4 * s, y1 = Math.sin(a) * 1.6 * s * 0.6; const p = limbP(Math.cos(a) * 4 * s, -0.4 * s, x1, y1, 0.75 * s, 0.18 * s, 0.2); cel(g, p, '#2a2420'); }
  // the trunk: a broad charred cylinder, jagged broken top
  const W2 = 5.4 * s, H2 = 9.2 * s, top = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = lerp(-W2 * 0.92, W2 * 0.92, t); top.push([x, -H2 - (i % 2 ? 1.6 : 0.2) * s - R() * 1.4 * s]); }
  const pts = [[-W2 * 1.15, 0], [-W2, -H2 * 0.5], ...top, [W2, -H2 * 0.5], [W2 * 1.15, 0]]; const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (const q of pts) p.lineTo(q[0], q[1]); p.quadraticCurveTo(0, 0.9 * s, -W2 * 1.15, 0); p.closePath();
  cel(g, p, '#2e2924', { sx: -W2 * 0.35, sy: 0, shade: '#14110f' });
  g.save(); g.clip(p);
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 0.12 * s; for (let i = 0; i < 16; i++) { const x = lerp(-W2, W2, i / 15) + (R() - 0.5) * s; g.beginPath(); g.moveTo(x, 0.3 * s); g.bezierCurveTo(x + (R() - 0.5) * s, -H2 * 0.4, x + (R() - 0.5) * 1.5 * s, -H2 * 0.7, x + (R() - 0.5) * s, -H2 * 1.1); g.stroke(); }
  // lightning scars still glowing like embers
  g.strokeStyle = '#ff8a3a'; g.lineWidth = 0.09 * s; g.shadowColor = '#ff6a1a'; g.shadowBlur = 0.4 * s; for (let i = 0; i < 4; i++) { let x = (R() - 0.5) * W2 * 1.4, y = -H2 * (0.2 + R() * 0.6); g.beginPath(); g.moveTo(x, y); for (let k2 = 0; k2 < 5; k2++) { x += (R() - 0.5) * 0.9 * s; y -= 0.6 * s; g.lineTo(x, y); } g.stroke(); }
  g.shadowBlur = 0; g.restore();
  // the top rim (we look slightly down into the hollow)
  const rim = ellP(0, -H2 - 0.4 * s, W2 * 0.86, 1.3 * s); flatP(g, rim, '#1a1614'); const rim2 = ellP(0, -H2 - 0.2 * s, W2 * 0.7, 0.9 * s); flatP(g, rim2, '#0c0a08', false);
  // ash at the foot
  g.fillStyle = 'rgba(60,54,48,.35)'; g.beginPath(); g.ellipse(0, 0.2 * s, W2 * 1.5, 1.3 * s, 0, 0, TAU); g.fill();
} });
let WILLOWOBJ = null;
function makeWillow(x, z) {
  place('willowstump', x, z, 0, 0.7, { nocol: true, flip: false });
  const segs = []; for (let i = 0; i < 16; i++) segs.push({ a: 0 });
  const g = new Obj2D((gg, K, o) => drawWillowBranch(gg, K, o)); g.position.set(x, terrH(x, z), z); g.zoff = 0.2; g.cullR = 20;
  const light = new PLight(0x7affa8, 0, 30); light.position.set(1, 0, 3); g.add(light);
  R3.scene.add(g); addCol({ x, z, r: 4.2 });
  WILLOWOBJ = { g, segs, light, glow: 0, boost: 0, t: 0 };
  return WILLOWOBJ;
}
function drawWillowBranch(g, K, o) {
  const W2 = WILLOWOBJ, t = W2.t, gl = W2.glow;
  const bx = 1.1 * K, by = -7.1 * K; let x = bx, y = by, a = 0.35;
  g.save();
  // glow halo
  if (gl > 0.05) { g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(bx + 0.8 * K, by + 3.5 * K, 0, bx + 0.8 * K, by + 3.5 * K, 6 * K); gr.addColorStop(0, `rgba(120,255,170,${0.22 * Math.min(1.5, gl)})`); gr.addColorStop(1, 'rgba(120,255,170,0)'); g.fillStyle = gr; g.fillRect(bx - 6 * K, by - 3 * K, 14 * K, 14 * K); g.globalCompositeOperation = 'source-over'; }
  a = -2.2; const pts = [[x, y]]; for (let i = 0; i < W2.segs.length; i++) { a = lerp(a, 0, i < 3 ? 0.42 : 0.25) + Math.sin(t * 1.2 - i * 0.45) * 0.045; const L = 0.4 * K; x += Math.sin(-a) * L * 0.9 + 0.03 * K; y += Math.cos(a) * L; pts.push([x, y]); }
  g.strokeStyle = '#1a3a24'; g.lineWidth = 0.12 * K + 2; g.lineCap = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  g.strokeStyle = mix('#6ae890', '#d8ffe0', clamp(gl * 0.5, 0, 1)); g.lineWidth = 0.09 * K; g.stroke();
  const leafC = mix('#5ad87a', '#c8ffd8', clamp(gl * 0.6, 0, 1));
  for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i]; for (const sd of [-1, 1]) { const la = sd * (0.9 + Math.sin(t * 2 + i) * 0.15); g.save(); g.translate(px, py); g.rotate(la); const lp = new Path2D(); lp.moveTo(0, 0); lp.quadraticCurveTo(0.12 * K, 0.18 * K, 0, 0.42 * K); lp.quadraticCurveTo(-0.12 * K, 0.18 * K, 0, 0); g.fillStyle = leafC; g.fill(lp); g.strokeStyle = '#1a4a2a'; g.lineWidth = 1; g.stroke(lp); g.restore(); } }
  if (gl > 0.3) { g.globalCompositeOperation = 'lighter'; for (let i = 2; i < pts.length; i += 3) glowDot(g, pts[i][0], pts[i][1], 0.5 * K, 0x8affb0, 0.25 * gl); }
  g.restore();
}
function tickWillow(dt) {
  const W2 = WILLOWOBJ; if (!W2) return; W2.t += dt;
  const night = LTGT === LIGHTS.night ? 1 : LTGT === LIGHTS.dusk ? 0.5 : 0.15; W2.glow = lerp(W2.glow, night + (W2.boost || 0), dt * 1.5);
  W2.light.intensity = 10 + W2.glow * 40;
  if (Math.random() < 0.15 + W2.glow * 0.4) { const p = W2.g.position; emit(p.x + 1.3 + rr(-1, 1), p.y + rr(1, 7), p.z + 0.5 + rr(-0.5, 0.5), rr(-0.3, 0.3), rr(0.2, 0.8), rr(-0.3, 0.3), 0x8affb0, rr(1.5, 3), rr(0.15, 0.3), -0.2); }
}
