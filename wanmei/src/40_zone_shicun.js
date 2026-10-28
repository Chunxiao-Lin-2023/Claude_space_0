/* ================= 区域：苍莽山脉·石村 (旧址) =================
   石村位于苍莽山脉中，四周高峰大壑。村头一株焦黑雷击木（柳神），村前空地晨练；
   北面出村一里多是石林，石林最深处三百米高的石崖顶上是青鳞鹰的梧木巢；西北是狩猎区，再往外数十里是狈村。 */
const ZONES = {};
const VIL = { x: 0, z: 55 }, WILLOW = { x: 0, z: 13 }, CHIEF = { x: 13, z: 20 }, ALTAR = { x: -13, z: 22 }, YARD = { x: 0, z: 104 }, BATH = { x: -30, z: 70 }, NEST = { x: 186, z: -214 }, CAVE = { x: 70, z: -58 }, ARENA = { x: -172, z: -182 }, STONEF = { x: 140, z: -160 }, MEADOW = { x: 100, z: 140 };
const ROAD_N = [[0, 10], [3, -25], [22, -70], [60, -110], [110, -142], [150, -175], [178, -192]];
const ROAD_W = [[0, 10], [-18, -18], [-58, -66], [-105, -105], [-148, -150], [-172, -182]];
const ROAD_S = [[0, 104], [6, 150], [-6, 230]];
const ROAD_E = [[30, 70], [70, 108], [100, 140]];
const ROAD_C = [[22, -70], [48, -64], [64, -58]];
ZONES.shicun = {
  id: 'shicun', name: '苍莽山脉·石村', size: 640, seg: 224, light: 'day', lvCap: 12,
  base: { h: 9, amp: 11, sc: 0.0065, ridge: 10, rsc: 0.004, fine: 0.4 },
  edge: { h: 95, w: 95 },
  biome: { grass1: 0x4f8a3a, grass2: 0x86b04a, grass3: 0x3e7a3e, grassTip: 0xd8e88a, rock: 0x7a7468, rock2: 0x9a9284, dirt: 0xb4966a, dirt2: 0x9c7e56, sand: 0xc8b88a, bed: 0x4a5a50, rockSl: 0.24, hiRock: 60 },
  water: { deep: 0x1f6a7a, shal: 0x5ac0b8 },
  feat: [
    { t: 'flat', x: VIL.x, z: VIL.z, r: 50, fall: 26, h: 10, n: 0.4 },
    { t: 'flat', x: YARD.x, z: YARD.z, r: 17, fall: 10, h: 9.6 },
    { t: 'mtn', x: -60, z: -290, r: 120, h: 70, rough: 0.5 }, { t: 'mtn', x: 90, z: -300, r: 110, h: 80, rough: 0.5 }, { t: 'mtn', x: 260, z: -60, r: 90, h: 55 }, { t: 'mtn', x: -270, z: 40, r: 90, h: 50 },
    { t: 'hill', x: 85, z: -62, r: 26, h: 16 }, { t: 'hill', x: -60, z: 170, r: 50, h: 14 }, { t: 'hill', x: 160, z: 40, r: 60, h: 18 }, { t: 'hill', x: -90, z: -10, r: 40, h: 10 },
    { t: 'flat', x: STONEF.x, z: STONEF.z, r: 55, fall: 30, h: 16, n: 2.5 },
    { t: 'mesa', x: NEST.x, z: NEST.z, r: 15, fall: 4, h: 50, n: 1.2 },
    { t: 'flat', x: ARENA.x, z: ARENA.z, r: 22, fall: 18, h: 14, n: 0.6 },
    { t: 'flat', x: MEADOW.x, z: MEADOW.z, r: 34, fall: 22, h: 11, n: 0.8 },
    { t: 'path', pts: Array.from({ length: 33 }, (_, i) => [VIL.x + Math.cos(i / 32 * TAU) * 23, VIL.z + Math.sin(i / 32 * TAU) * 22]), w: 3.2 },
    { t: 'path', pts: ROAD_N, w: 4.5 }, { t: 'path', pts: ROAD_W, w: 4 }, { t: 'path', pts: ROAD_S, w: 4.5 }, { t: 'path', pts: ROAD_E, w: 3.5 }, { t: 'path', pts: ROAD_C, w: 3 },
    { t: 'plaza', x: VIL.x, z: VIL.z + 6, r: 11, k: 0.8 }, { t: 'plaza', x: YARD.x, z: YARD.z, r: 14, k: 0.85 }, { t: 'plaza', x: WILLOW.x, z: WILLOW.z + 6, r: 12, k: 0.6 }, { t: 'plaza', x: BATH.x, z: BATH.z, r: 9, k: 0.8 },
    { t: 'river', pts: [[-190, -330], [-168, -220], [-182, -120], [-160, -20], [-176, 80], [-150, 190], [-170, 330]], w: 16, wl: 3.2, bed: 3, bank: 9, water: { deep: 0x1c5e74, shal: 0x56b8b4, flow: [0, 0.05] } },
    { t: 'lake', x: 58, z: 96, r: 9, wl: 8.6, bed: 2, bank: 5 },
  ],
  paint: [{ x: STONEF.x, z: STONEF.z, r: 70, col: 0x8a8270, k: 0.55, noise: true }, { x: NEST.x, z: NEST.z, r: 22, col: 0x6e685e, k: 0.6 }, { x: ARENA.x, z: ARENA.z, r: 26, col: 0x6a5a40, k: 0.35, noise: true }],
  clear: [{ x: VIL.x, z: VIL.z, r: 62 }, { x: YARD.x, z: YARD.z, r: 22 }, { x: ARENA.x, z: ARENA.z, r: 20 }, { x: MEADOW.x, z: MEADOW.z, r: 30 }, { x: CAVE.x - 6, z: CAVE.z, r: 10 }],
  grassDens: (x, z) => d2(x, z, STONEF.x, STONEF.z) < 60 * 60 ? 0.15 : 1,
  walls: [],
  pois: [
    { name: '石村', x: VIL.x, z: VIL.z }, { name: '柳神', x: WILLOW.x, z: WILLOW.z, icon: '🌿' }, { name: '村前空地', x: YARD.x, z: YARD.z }, { name: '石林', x: STONEF.x, z: STONEF.z }, { name: '梧木巢', x: NEST.x, z: NEST.z },
    { name: '藤后石洞', x: CAVE.x, z: CAVE.z }, { name: '狩猎区', x: -100, z: -100 }, { name: '山林较深处', x: ARENA.x, z: ARENA.z }, { name: '莽牛坡', x: MEADOW.x, z: MEADOW.z }, { name: '大河', x: -170, z: 40 },
  ],
};
/* forest density: thick old forest outside the village, thin in 石林 and meadows */
function forestDens(x, z) {
  const dv = Math.hypot(x - VIL.x, z - VIL.z); let d = sstep(60, 110, dv);
  d *= 0.55 + 0.45 * clamp(fbm(x * 0.01 + 5, z * 0.01 - 3, 3) * 2 + 0.5, 0, 1);
  if (d2(x, z, STONEF.x, STONEF.z) < 75 * 75) d *= 0.12;
  if (d2(x, z, MEADOW.x, MEADOW.z) < 45 * 45) d *= 0.15;
  return d;
}
function buildShicunProps() {
  const Z = ZONES.shicun;
  // ---- the village ----
  const houses = [];
  for (let ring = 0; ring < 3; ring++) { const n = [9, 13, 16][ring], R = [19, 27, 35][ring]; for (let i = 0; i < n; i++) { const a = i / n * TAU + ring * 0.37; const x = VIL.x + Math.cos(a) * R, z = VIL.z + Math.sin(a) * R * 0.95; if (z < 24 && Math.abs(x) < 24) continue; if (Math.abs(x) < 5.5) continue; if (d2(x, z, BATH.x, BATH.z) < 13 * 13) continue; if (d2(x, z, 58, 96) < 14 * 14) continue; if (z > 92 && Math.abs(x) < 14) continue; houses.push([x, z, Math.atan2(VIL.x - x, VIL.z - z) + rr(-0.25, 0.25)]); } }
  houses.forEach(([x, z, r], i) => place(i % 3 === 2 ? 'house2' : 'house', x, z, r, rr(0.82, 0.92)));
  place('chiefhouse', CHIEF.x + 4, CHIEF.z - 2, -0.5);
  // shade trees, bushes and flower beds between the houses
  { const R2 = mulberry32(55); let n = 0; for (let t = 0; t < 400 && n < 46; t++) { const a = R2() * TAU, d = 12 + R2() * 30, x = VIL.x + Math.cos(a) * d, z = VIL.z + Math.sin(a) * d * 0.95; if (houses.some(([hx, hz]) => Math.abs(hx - x) < 5.5 && Math.abs(hz - z) < 4.5)) continue; if (pathAt(x, z) > 0.15 || Math.abs(x) < 4 || d2(x, z, WILLOW.x, WILLOW.z + 4) < 14 * 14 || d2(x, z, CHIEF.x, CHIEF.z) < 9 * 9 || d2(x, z, BATH.x, BATH.z) < 10 * 10 || d2(x, z, ALTAR.x, ALTAR.z) < 7 * 7) continue; const k = R2(); place(k < 0.3 ? 'oak' : k < 0.6 ? 'bush' : k < 0.85 ? 'flowers' : 'berrybush', x, z, 0, k < 0.3 ? 0.75 + R2() * 0.2 : 0.8 + R2() * 0.4); n++; } }
  // the willow (柳神) is a special animated object, see makeWillow
  place('altar', ALTAR.x, ALTAR.z, 0.2);
  place('blackding', CHIEF.x - 1, CHIEF.z + 5, 0, 0.8);
  place('firepit', CHIEF.x + 1, CHIEF.z + 8.5, 0);
  place('tower', 26, 22, 0.3); place('tower', -30, 96, 0);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; place('ding', BATH.x + Math.cos(a) * 5, BATH.z + Math.sin(a) * 5, a, 1.2); }
  place('ding', YARD.x, YARD.z - 3, 0, 1.6); // 千斤青铜鼎
  place('mill', YARD.x + 8, YARD.z + 2, 0); place('roller', YARD.x - 8, YARD.z + 3, 0.4); place('stonelock', YARD.x + 5, YARD.z - 7, 0); place('stonelock', YARD.x - 5, YARD.z - 7, 0.6); place('stonelock', YARD.x + 9, YARD.z - 5, 1.2);
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI + PI; place('rock' + (i % 4), YARD.x + Math.cos(a) * 15, YARD.z + Math.sin(a) * 13, a, rr(0.9, 1.3)); } // elders sit on boulders
  for (let i = 0; i < 9; i++) { const [x, z] = houses[i * 3 % houses.length]; place('rack', x + rr(3, 4.5), z + rr(-2, 2), rr(0, TAU)); }
  for (let i = 0; i < 12; i++) { const [x, z] = houses[(i * 5 + 1) % houses.length]; place(i % 3 ? 'pot' : 'logpile', x + rr(-4, 4), z + rr(3.5, 5), rr(0, TAU), rr(0.8, 1.1)); }
  for (let i = 0; i < 6; i++) place('fence', 52 + Math.cos(i) * 2, 70 + i * 4.3, HP, 1);
  place('stele', 4, 6, 0); // 村头石碑
  // the village heart: a bonfire ring with stone seats, drying racks, firewood
  place('firepit', VIL.x, VIL.z + 6, 0, 1.3); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3; place('rock' + (i % 4), VIL.x + Math.cos(a) * 3.6, VIL.z + 6 + Math.sin(a) * 3, a, 0.7, { flip: i % 2 === 0 }); }
  place('rack', VIL.x - 8, VIL.z + 1, 0); place('rack', VIL.x + 8.5, VIL.z + 2, 0); place('logpile', VIL.x + 6, VIL.z + 11, 0); place('pot', VIL.x - 6, VIL.z + 11, 0); place('pot', VIL.x - 6.8, VIL.z + 11.4, 0, 0.8);
  // ---- outskirts: rocks, bushes, berry bushes, flowers near village ----
  const rk = ['rock0', 'rock1', 'rock2', 'rock3'];
  scatterPoints(Z, { sp: 9, seed: 3, dens: (x, z) => forestDens(x, z) * 0.65 + 0.08, slopeMax: 0.45 }, (x, z, h) => place(h < 0.5 ? 'oak' : 'pine', x, z, h * TAU, 0.8 + h * 0.6));
  scatterPoints(Z, { sp: 13, seed: 7, dens: (x, z) => 0.22 + forestDens(x, z) * 0.25, slopeMax: 0.6 }, (x, z, h) => place(rk[Math.floor(h * 4)], x, z, h * 9, 0.6 + h * 1.4));
  scatterPoints(Z, { sp: 7, seed: 11, dens: (x, z) => 0.3 + forestDens(x, z) * 0.4 }, (x, z, h) => place(h < 0.55 ? 'bush' : h < 0.75 ? 'fern' : 'flowers', x, z, h * 7, 0.7 + h * 0.6));
  scatterPoints(Z, { sp: 22, seed: 17, dens: (x, z) => sstep(50, 80, Math.hypot(x - VIL.x, z - VIL.z)) * 0.5 * (1 - sstep(140, 200, Math.hypot(x - VIL.x, z - VIL.z))) }, (x, z) => place('berrybush', x, z, 0, 1));
  scatterPoints(Z, { sp: 6, seed: 23, dens: (x, z) => { const w = waterAt(x, z); return w > -1e8 && terrH(x, z) > w - 0.4 && terrH(x, z) < w + 1.2 ? 0.7 : 0; }, inWater: true, slopeMax: 0.6 }, (x, z, h) => place('reed', x, z, h * 5, 0.8 + h * 0.4));
  // ---- 石林: stone pillars and the bones of giant beasts ----
  scatterPoints(Z, { sp: 11, seed: 31, dens: (x, z) => d2(x, z, STONEF.x, STONEF.z) < 62 * 62 && pathAt(x, z) < 0.1 ? 0.55 : 0, slopeMax: 0.7 }, (x, z, h) => place(h < 0.6 ? 'spire' : 'spire2', x, z, h * 9, 0.7 + h * 0.8, { dy: -1 }));
  for (let i = 0; i < 9; i++) { const a = i * 2.1, r = 12 + i * 5; place(i % 2 ? 'skull' : 'ribs', STONEF.x + Math.cos(a) * r, STONEF.z + Math.sin(a) * r, a, rr(0.8, 1.6)); }
  // ---- 梧木巢 cliff ----
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; place('cliffwall', NEST.x + Math.cos(a) * 19, NEST.z + Math.sin(a) * 19, -a + HP, 1, { dy: 2, nocol: true }); }
  place('nest', NEST.x, NEST.z, 0, 1, { y: terrH(NEST.x, NEST.z) });
  place('skull', NEST.x + 6, NEST.z + 3, 1, 0.7, { y: terrH(NEST.x + 6, NEST.z + 3) });
  // ---- 藤后石洞 ----
  place('cave', CAVE.x + 6, CAVE.z, -HP, 1.1);
  for (let i = 0; i < 4; i++) place('vine', CAVE.x + 1, CAVE.z + (i - 1.5) * 2.5, HP, 0.9, { dy: 3 });
  // ---- the deeper forest where 狈村 hunters prowl (broken trees, blood, chaos) ----
  for (let i = 0; i < 14; i++) { const a = i * 0.9, r = 18 + (i % 4) * 4; place('deadtree', ARENA.x + Math.cos(a) * r, ARENA.z + Math.sin(a) * r, a, rr(0.8, 1.3), { tilt: rr(0.3, 1.3) }); }
  for (let i = 0; i < 5; i++) place('tent', -232 + i * 9, -238 + (i % 2) * 6, i, 1);
  place('banner', -215, -222, 0); place('banner', -200, -230, 1);
  // ---- giant ancient trees towards the deep mountains (古木参天) ----
  [[-40, -170], [40, -200], [-120, -240], [230, -110], [-230, -60], [120, -250], [250, 160], [-250, 220]].forEach(([x, z], i) => place('ancient', x, z, i, 0.8 + (i % 3) * 0.2));
  scatterPoints(Z, { sp: 26, seed: 41, dens: (x, z) => { const w = waterAt(x, z); return w > -1e8 && Math.abs(terrH(x, z) - w) < 2 ? 0.4 : 0; }, slopeMax: 0.5 }, (x, z, h) => place('willowtree', x, z, h * 6, 0.9 + h * 0.3));
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
