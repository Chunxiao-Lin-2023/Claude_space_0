/* ================= rendering (Three.js): terrain, cells, characters, lights, cutaway, camera, effects ================= */
// world (x east, y south, z up)  ->  three (X = x, Y = z, Z = y)
const CV = document.getElementById('cv');
const TOUCHY = matchMedia('(pointer:coarse)').matches;
const RENDER = new THREE.WebGLRenderer({ canvas: CV, antialias: !TOUCHY, powerPreference: 'high-performance' });
RENDER.setPixelRatio(Math.min(devicePixelRatio || 1, TOUCHY ? 1.5 : 2));
RENDER.shadowMap.enabled = !!SET.shadows; RENDER.shadowMap.type = THREE.PCFSoftShadowMap;
RENDER.toneMapping = THREE.ACESFilmicToneMapping; RENDER.toneMappingExposure = 1.3;
const SCN = new THREE.Scene();
const CAMO = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 300);
let VW = 1, VH = 1;
function resize() { VW = innerWidth; VH = innerHeight; RENDER.setSize(VW, VH, false); }
addEventListener('resize', resize); resize();
const CAM = { rot: 0, yaw: -Math.PI / 4, zoom: 9, tx: 32, ty: 28, tz: 0, shake: 0, pitch: 0.62 };
const VIEW = { auto: true, L: 0 };
const camYawTarget = () => -Math.PI / 4 + CAM.rot * Math.PI / 2;
// screen-relative basis on the ground: forward (screen up) and right
const camFwd = () => [-Math.sin(CAM.yaw), -Math.cos(CAM.yaw)];
const camRight = () => [Math.cos(CAM.yaw), -Math.sin(CAM.yaw)];
// auto view: outdoors you see every storey; under a floor/roof the storeys above you are cut away
function covered(p) { const x = Math.floor(p.x), y = Math.floor(p.y); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (let L = p.L + 1; L < ML; L++) { if (!inMap(x + dx, y + dy)) continue; const i = ci(x + dx, y + dy, L); if (W.slab[i] || (B[W.blk[i]].cost && L > p.L)) return true; } return false; }
// the layer you build on: your own floor in auto mode, the chosen floor in manual mode
function buildL() { if (!W) return 0; const me = W.p[ME]; return VIEW.auto ? (me ? me.L : 0) : VIEW.L; }
let VL_CACHE = { k: '', v: ML - 1 };
function viewL() {
  if (!W) return 0; if (!VIEW.auto) return VIEW.L;
  const me = W.p[ME]; if (!me || me.gone) return ML - 1;
  const k = W.ver + ':' + Math.floor(me.x) + ',' + Math.floor(me.y) + ',' + me.L;
  if (VL_CACHE.k !== k) VL_CACHE = { k, v: covered(me) ? me.L : ML - 1 };
  return VL_CACHE.v;
}

/* ---------- materials & helpers ---------- */
const MATS = {};
const lam = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return MATS[k] || (MATS[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c, flatShading: true }, o || {}))); };
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpC = new THREE.Color(), UPV = new THREE.Vector3(0, 1, 0);
function inst(geo, mat, cap, shadow = true) { const m = new THREE.InstancedMesh(geo, mat, cap); m.count = 0; m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); SCN.add(m); return m; }
function setInst(m, k, x, y, z, rotY, sx, sy, sz, col) {
  tmpQ.setFromAxisAngle(UPV, rotY || 0); tmpV.set(x, y, z); tmpS.set(sx, sy, sz); tmpM.compose(tmpV, tmpQ, tmpS); m.setMatrixAt(k, tmpM);
  if (col != null) { tmpC.set(col); m.setColorAt(k, tmpC); }
}
const boxG = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
const merge = gs => THREE.mergeGeometries(gs, false);

/* ---------- geometry kit ---------- */
const GEO = {};
function buildGeo() {
  GEO.col = boxG(1, 1, 1, 0, 0.5, 0);
  GEO.plate = boxG(1, 0.1, 1, 0, -0.05, 0);
  GEO.water = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  GEO.wall = boxG(1, FH, 1, 0, FH / 2, 0);
  GEO.slab = boxG(1, 0.14, 1, 0, -0.07, 0);
  const st = []; for (let k = 0; k < 5; k++) st.push(boxG(0.2, FH * (k + 1) / 5, 1, -0.4 + k * 0.2, FH * (k + 1) / 10, 0)); GEO.stairs = merge(st);
  // ramp wedge rising toward +x
  const rg = new THREE.BufferGeometry(), h = FH;
  const v = [-.5, 0, -.5, .5, 0, -.5, .5, h, -.5, -.5, 0, .5, .5, 0, .5, .5, h, .5];
  const idx = [0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4, 0, 1, 4, 0, 4, 3];
  const pos = []; for (const i of idx) pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
  rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.computeVertexNormals(); GEO.ramp = rg;
  GEO.doorPanel = merge([boxG(1, FH * 0.22, 1, 0, FH * 0.89, 0), boxG(0.12, FH * 0.78, 1, -0.44, FH * 0.39, 0), boxG(0.12, FH * 0.78, 1, 0.44, FH * 0.39, 0)]);
  GEO.doorLeaf = boxG(0.76, FH * 0.76, 0.16, 0, FH * 0.38, 0);
  const bars = [boxG(1, FH * 0.3, 1, 0, FH * 0.15, 0), boxG(1, FH * 0.14, 1, 0, FH * 0.93, 0)];
  for (let k = 0; k < 4; k++) bars.push(boxG(0.07, FH * 0.56, 0.07, -0.36 + k * 0.24, FH * 0.58, 0));
  GEO.bars = merge(bars);
  const wire = []; for (let k = 0; k < 3; k++) { const t = new THREE.TorusGeometry(0.2, 0.018, 4, 10); t.translate(-0.33 + k * 0.33, 0.2, 0); wire.push(t); } GEO.wire = merge(wire);
  GEO.lampPole = merge([boxG(0.07, 0.75, 0.07, 0, 0.37, 0), boxG(0.32, 0.06, 0.06, 0.12, 0.75, 0)]);
  GEO.lampHead = boxG(0.26, 0.12, 0.2, 0.25, 0.72, 0);
  GEO.trunk = new THREE.CylinderGeometry(0.07, 0.11, 0.8, 5).translate(0, 0.4, 0);
  GEO.pine = [0, 1, 2].map(k => new THREE.ConeGeometry(0.58 - k * 0.14, 0.75, 6).translate(0, 0.85 + k * 0.42, 0));
  GEO.oak = merge([new THREE.IcosahedronGeometry(0.55, 0).translate(0, 1.15, 0), new THREE.IcosahedronGeometry(0.4, 0).translate(0.3, 0.95, 0.15)]);
  GEO.rock = new THREE.DodecahedronGeometry(0.42, 0).scale(1, 0.7, 1).translate(0, 0.22, 0);
  GEO.crate = merge([boxG(0.6, 0.5, 0.6, 0, 0.25, 0), boxG(0.64, 0.06, 0.64, 0, 0.52, 0)]);
  GEO.rubble = merge([boxG(0.5, 0.25, 0.4, -0.15, 0.12, 0.1), boxG(0.35, 0.18, 0.3, 0.2, 0.09, -0.15), boxG(0.25, 0.4, 0.2, 0.1, 0.2, 0.2).rotateZ(0.4)]);
  GEO.fence = merge([boxG(0.08, 0.65, 0.08, -0.45, 0.32, 0), boxG(0.08, 0.65, 0.08, 0.45, 0.32, 0), boxG(1, 0.06, 0.04, 0, 0.48, 0), boxG(1, 0.06, 0.04, 0, 0.26, 0)]);
  GEO.carBody = merge([boxG(1.7, 0.38, 0.82, 0, 0.32, 0), boxG(0.95, 0.32, 0.74, -0.1, 0.66, 0)]);
  const wh = []; for (const [wx, wz] of [[-0.55, 0.4], [0.55, 0.4], [-0.55, -0.4], [0.55, -0.4]]) wh.push(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 8).rotateX(Math.PI / 2).translate(wx, 0.17, wz)); GEO.carWheels = merge(wh);
}
/* ---------- persistent scene objects ---------- */
const OBJ = {};
function buildScene() {
  buildGeo();
  SCN.background = new THREE.Color('#8fa0b2');
  OBJ.hemi = new THREE.HemisphereLight('#c9d8ff', '#3a3024', 1.1); SCN.add(OBJ.hemi);
  const sun = new THREE.DirectionalLight('#fff0d8', 2.2); sun.castShadow = !!SET.shadows;
  sun.shadow.mapSize.set(TOUCHY ? 1024 : 2048, TOUCHY ? 1024 : 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  SCN.add(sun, sun.target); OBJ.sun = sun;
  OBJ.lamps = []; for (let k = 0; k < 6; k++) { const L = new THREE.PointLight('#ffc27a', 0, 8, 1.5); SCN.add(L); OBJ.lamps.push(L); }
  OBJ.flash = []; for (let k = 0; k < 3; k++) { const L = new THREE.PointLight('#ffb050', 0, 6, 2); SCN.add(L); OBJ.flash.push(L); }
  OBJ.radioL = new THREE.PointLight('#ff3b2f', 0, 3, 2); SCN.add(OBJ.radioL);
  OBJ.spots = [0, 1].map(() => { const s = new THREE.SpotLight('#fff1d6', 0, 14, 0.42, 0.55, 1.2); SCN.add(s, s.target); return s; });
  // instanced pools
  const I = OBJ.I = {};
  I.water = inst(GEO.water, new THREE.MeshPhongMaterial({ color: '#2a6a86', transparent: true, opacity: 0.86, shininess: 80, specular: '#7fb8d0' }), MW * MH, false);
  I.ramp = inst(GEO.ramp, lam('#6e5a40'), 200);
  I.wall = inst(GEO.wall, lam('#ffffff'), 6000);
  I.slab = inst(GEO.slab, lam('#ffffff'), 6000);
  I.stairs = inst(GEO.stairs, lam('#ffffff'), 400);
  I.doorF = inst(GEO.doorPanel, lam('#ffffff'), 400); I.doorL = inst(GEO.doorLeaf, lam('#5c3c22'), 400);
  I.bars = inst(GEO.bars, lam('#ffffff'), 600);
  I.wire = inst(GEO.wire, lam('#9aa0a6'), 600, false);
  I.lampP = inst(GEO.lampPole, lam('#2d3238'), 200); I.lampH = inst(GEO.lampHead, new THREE.MeshBasicMaterial({ color: '#ffe9a8' }), 200, false);
  I.trunk = inst(GEO.trunk, lam('#4a3220'), 3000);
  I.pine = GEO.pine.map((g, k) => inst(g, lam(['#2e4a2c', '#35552f', '#3c5f35'][k]), 3000));
  I.oak = inst(GEO.oak, lam('#ffffff'), 3000);
  I.rock = inst(GEO.rock, lam('#ffffff'), 1500);
  I.crate = inst(GEO.crate, lam('#4f5d3c'), 300); I.rubble = inst(GEO.rubble, lam('#6a625a'), 300); I.fence = inst(GEO.fence, lam('#6b5a48'), 400);
  I.car = inst(GEO.carBody, lam('#ffffff'), 60); I.carW = inst(GEO.carWheels, lam('#151515'), 60);
  // radio + bench
  const radio = new THREE.Group();
  const rb = new THREE.Mesh(boxG(0.7, 0.55, 0.5, 0, 0.28, 0), lam('#3a403b')); const rs = new THREE.Mesh(boxG(0.34, 0.16, 0.02, -0.1, 0.4, 0.26), new THREE.MeshBasicMaterial({ color: '#8fd38b' }));
  const ant = new THREE.Mesh(boxG(0.03, 0.9, 0.03, 0.25, 1.0, 0), lam('#9a9a9a')); OBJ.radioLed = new THREE.Mesh(boxG(0.08, 0.08, 0.08, 0.25, 1.46, 0), new THREE.MeshBasicMaterial({ color: '#ff3b2f' }));
  radio.add(rb, rs, ant, OBJ.radioLed); radio.traverse(m => { m.castShadow = true; }); SCN.add(radio); OBJ.radio = radio;
  const bench = new THREE.Group(); bench.add(new THREE.Mesh(boxG(1, 0.08, 0.5, 0, 0.5, 0), lam('#5b4026')), new THREE.Mesh(boxG(0.08, 0.46, 0.44, -0.44, 0.23, 0), lam('#3d2a18')), new THREE.Mesh(boxG(0.08, 0.46, 0.44, 0.44, 0.23, 0), lam('#3d2a18')), new THREE.Mesh(boxG(0.3, 0.14, 0.24, -0.2, 0.61, 0), lam('#6c7a84')), new THREE.Mesh(boxG(0.1, 0.22, 0.1, 0.25, 0.65, 0), lam('#b8c0c6')));
  bench.traverse(m => { m.castShadow = true; }); SCN.add(bench); OBJ.bench = bench;
  // zombies: instanced body parts
  const Z = OBJ.Z = {}, ZC = 420;
  Z.legL = inst(boxG(0.12, 0.42, 0.13, 0, -0.21, 0), lam('#ffffff'), ZC); Z.legR = inst(boxG(0.12, 0.42, 0.13, 0, -0.21, 0), lam('#ffffff'), ZC);
  Z.torso = inst(boxG(0.24, 0.4, 0.34, 0, 0.2, 0), lam('#ffffff'), ZC); Z.head = inst(boxG(0.22, 0.22, 0.22, 0, 0.11, 0), lam('#ffffff'), ZC);
  Z.armL = inst(boxG(0.36, 0.09, 0.09, 0.18, 0, 0), lam('#ffffff'), ZC); Z.armR = inst(boxG(0.36, 0.09, 0.09, 0.18, 0, 0), lam('#ffffff'), ZC);
  Z.eyes = inst(boxG(0.05, 0.05, 0.17, 0, 0, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }), ZC, false);
  Z.belly = inst(new THREE.IcosahedronGeometry(0.2, 0), lam('#6c8c2a'), ZC);
  // players
  OBJ.pl = [];
  // projectiles, particles, tracers
  OBJ.nade = inst(new THREE.IcosahedronGeometry(0.09, 0), lam('#3c4a32'), 40); OBJ.acid = inst(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: '#9dff3a' }), 60, false);
  OBJ.parts = inst(boxG(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 900, false);
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(120 * 6), 3)); tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(120 * 6), 3));
  OBJ.tracers = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); OBJ.tracers.frustumCulled = false; SCN.add(OBJ.tracers);
  OBJ.flashM = inst(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.95 }), 8, false);
  OBJ.boom = inst(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffb050', transparent: true, opacity: 0.6, depthWrite: false }), 8, false);
  // build ghost + layer grid
  OBJ.ghost = new THREE.Mesh(GEO.wall, new THREE.MeshBasicMaterial({ color: '#7dff8a', transparent: true, opacity: 0.38, depthWrite: false })); OBJ.ghost.visible = false; SCN.add(OBJ.ghost);
  OBJ.ghostEdge = new THREE.LineSegments(new THREE.EdgesGeometry(boxG(1, FH, 1, 0, FH / 2, 0)), new THREE.LineBasicMaterial({ color: '#ffffff' })); OBJ.ghostEdge.visible = false; SCN.add(OBJ.ghostEdge);
  const gl = [], a0 = -BUILD_R, a1 = BUILD_R + 1;
  for (let k = a0; k <= a1; k++) gl.push(a0, 0, k, a1, 0, k, k, 0, a0, k, 0, a1);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3));
  OBJ.grid = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.18, depthWrite: false })); OBJ.grid.visible = false; SCN.add(OBJ.grid);
  const zb = [], q0 = -BUILD_R, q1 = BUILD_R + 1; for (const [a, b, c, d] of [[q0, q0, q1, q0], [q1, q0, q1, q1], [q1, q1, q0, q1], [q0, q1, q0, q0]]) zb.push(a, 0, b, c, 0, d);
  const zg = new THREE.BufferGeometry(); zg.setAttribute('position', new THREE.Float32BufferAttribute(zb, 3));
  OBJ.zone = new THREE.LineSegments(zg, new THREE.LineBasicMaterial({ color: '#ffcf6b', transparent: true, opacity: 0.55 })); SCN.add(OBJ.zone);
}
/* ---------- terrain (static per world) ---------- */
const TCOL = { [TT.grass]: ['#55733e', '#5a7843', '#50703a'], [TT.hill]: ['#4b663b', '#516c3e', '#476038'], [TT.dirt]: ['#6e5a42', '#74604a'], [TT.road]: ['#3c3d40', '#38393c'], [TT.sand]: ['#7d7356', '#857a5a'], [TT.forest]: ['#3f5a30', '#445f33', '#3b552d'], [TT.water]: ['#2b2723'] };
function buildTerrain() {
  // one merged mesh: column tops + only the exposed side faces (vertex colours, flat shading)
  const pos = [], col = [], c = new THREE.Color();
  const quad = (a, b2, c2, d, hex, k) => { c.set(hex).multiplyScalar(k); for (const v of [a, b2, c2, a, c2, d]) { pos.push(v[0], v[1], v[2]); col.push(c.r, c.g, c.b); } };
  const topOf = (x, y) => !inMap(x, y) ? -1.6 : ttAt(x, y) === TT.water ? -0.55 : gAt(x, y) * FH;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = ttAt(x, y), h = hash2(x, y), top = topOf(x, y);
    const cols = TCOL[t] || TCOL[TT.grass], tc = t === TT.water ? '#4a4136' : cols[Math.floor(h * cols.length)];
    quad([x, top, y], [x, top, y + 1], [x + 1, top, y + 1], [x + 1, top, y], tc, 1);
    const side = t === TT.water ? '#3a3128' : gAt(x, y) > 0 ? (h < 0.5 ? '#6b6052' : '#625849') : '#4e4134';
    const nb = [[x + 1, y, [x + 1, y + 1], [x + 1, y], 0.62], [x, y + 1, [x, y + 1], [x + 1, y + 1], 0.78], [x - 1, y, [x, y], [x, y + 1], 0.62], [x, y - 1, [x + 1, y], [x, y], 0.78]];
    for (const [nx, ny, p0, p1, k] of nb) {
      const nt = topOf(nx, ny); if (nt >= top) continue;
      quad([p0[0], top, p0[1]], [p0[0], nt, p0[1]], [p1[0], nt, p1[1]], [p1[0], top, p1[1]], side, k);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  if (OBJ.terrain) { SCN.remove(OBJ.terrain); OBJ.terrain.geometry.dispose(); }
  OBJ.terrain = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide })); OBJ.terrain.receiveShadow = true; OBJ.terrain.castShadow = true; SCN.add(OBJ.terrain);
  const I = OBJ.I; let w = 0, rp = 0;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (ttAt(x, y) === TT.water) setInst(I.water, w++, x + 0.5, -0.12, y + 0.5, 0, 1, 1, 1);
    for (let L = 0; L < ML; L++) { const i = ci(x, y, L); if (W.blk[i] === 28) setInst(I.ramp, rp++, x + 0.5, L * FH, y + 0.5, -W.bdir[i] * Math.PI / 2, 1, 1, 1); }
  }
  I.water.count = w; I.ramp.count = rp;
  for (const m of [I.water, I.ramp]) m.instanceMatrix.needsUpdate = true;
  OBJ.radio.position.set(W.radio.x + 0.5, gAt(W.radio.x, W.radio.y) * FH, W.radio.y + 0.5);
  OBJ.bench.position.set(W.bench.x + 0.5, gAt(W.bench.x, W.bench.y) * FH, W.bench.y + 0.5);
  OBJ.grid.position.set(W.radio.x, 0, W.radio.y); OBJ.zone.position.set(W.radio.x, 0.03, W.radio.y);
  RC.ver = -1; buildMinimapBase();
}
/* ---------- cell contents (rebuilt when the map, view layer, camera or player cell changes) ---------- */
const RC = { ver: -1, key: '', lamps: [] };
const dmgTint = (hex, f) => { tmpC.set(hex); const k = 0.45 + 0.55 * clamp(f, 0, 1); return '#' + tmpC.multiplyScalar(k).getHexString(); };
function wallAxis(x, y, L) { const solid = (xx, yy) => { const b = blkAt(xx, yy, L); return b && (B[b].P || B[b].Z) && !B[b].nat || b === 24; }; return (solid(x - 1, y) || solid(x + 1, y)) && !(solid(x, y - 1) || solid(x, y + 1)) ? 0 : (solid(x, y - 1) || solid(x, y + 1)) ? 1 : 0; }
function rebuildCells() {
  const I = OBJ.I, me = W.p[ME], vl = viewL(), [ox, oy] = [Math.sin(CAM.yaw), Math.cos(CAM.yaw)];
  const c = { wall: 0, slab: 0, stairs: 0, door: 0, bars: 0, wire: 0, lamp: 0, trunk: 0, pine: 0, oak: 0, rock: 0, crate: 0, rubble: 0, fence: 0, car: 0 };
  const lamps = [];
  for (let L = 0; L < ML; L++) for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = ci(x, y, L), b = W.blk[i], s = W.slab[i];
    if (!b && !s) continue;
    const X = x + 0.5, Y = L * FH, Z = y + 0.5, h = hash2(x * 3 + L, y * 7);
    const hide = L > vl && !(b && B[b].nat);
    if (hide) continue;
    if (s) { setInst(I.slab, c.slab++, X, Y, Z, 0, 1, 1, 1, dmgTint(B[s].col, s === SLAB_BRIDGE ? 1 : W.shp[i] / B[s].hp)); }
    if (!b || b === 20 || b === 23 || b === 28 || b === 30 || b === 31) continue;
    let cut = 1;
    if (L === vl && me && !me.dead && (B[b].P || B[b].Z) && !B[b].nat) { const dx = X - me.x, dy = Z - me.y; if (dx * dx + dy * dy < 40 && dx * ox + dy * oy > 0.25) cut = 0.3; }
    switch (b) {
      case 1: case 2: case 3: setInst(I.wall, c.wall++, X, Y, Z, 0, 1, cut, 1, dmgTint(B[b].col, W.bhp[i] / B[b].hp)); break;
      case 24: setInst(I.wall, c.wall++, X, Y, Z, 0, 1, 0.55 + h * 0.45, 1, dmgTint(h < 0.5 ? '#7c4a3a' : '#74503e', W.bhp[i] / B[b].hp)); break;
      case 6: setInst(I.stairs, c.stairs++, X, Y, Z, -W.bdir[i] * Math.PI / 2, 1, 1, 1, dmgTint(B[b].col, W.bhp[i] / B[b].hp)); break;
      case 7: { const ax = wallAxis(x, y, L) ? Math.PI / 2 : 0; setInst(I.doorF, c.door, X, Y, Z, ax, 1, cut, 1, dmgTint('#8a4c3a', 1)); setInst(I.doorL, c.door++, X, Y, Z, ax, 1, cut, 1); break; }
      case 8: setInst(I.bars, c.bars++, X, Y, Z, wallAxis(x, y, L) ? Math.PI / 2 : 0, 1, cut, 1, dmgTint('#6f8494', W.bhp[i] / B[b].hp)); break;
      case 9: setInst(I.wire, c.wire++, X, Y, Z, h * 3, 1, 1, 1); break;
      case 10: setInst(I.lampP, c.lamp, X - 0.2, Y, Z - 0.2, 0, 1, 1, 1); setInst(I.lampH, c.lamp++, X - 0.2, Y, Z - 0.2, 0, 1, 1, 1); lamps.push([X + 0.05, Y + 0.75, Z - 0.2]); break;
      case 22: { const sc = 0.8 + h * 0.5, rot = h * 6; setInst(I.trunk, c.trunk++, X, Y, Z, rot, sc, sc, sc); if (h < 0.6) for (let k = 0; k < 3; k++) setInst(I.pine[k], c.pine + 0, X, Y, Z, rot + k, sc, sc, sc); if (h < 0.6) c.pine++; else setInst(I.oak, c.oak++, X, Y, Z, rot, sc, sc, sc, h < 0.8 ? '#4f6a33' : '#5b7339'); break; }
      case 21: setInst(I.rock, c.rock++, X, Y, Z, h * 6, 0.8 + h * 0.6, 0.7 + h * 0.6, 0.8 + h * 0.5, h < 0.5 ? '#78746c' : '#6c6862'); break;
      case 26: setInst(I.crate, c.crate++, X, Y, Z, h * 2, 1, 1, 1); break;
      case 29: setInst(I.rubble, c.rubble++, X, Y, Z, h * 6, 1, 1, 1); break;
      case 27: setInst(I.fence, c.fence++, X, Y, Z, wallAxis(x, y, L) ? 0 : Math.PI / 2, 1, 1, 1); break;
      case 25: { const rot = -W.bdir[i] * Math.PI / 2 + (h - 0.5) * 0.3; const col = ['#7a3b2a', '#3c5a6e', '#6b6b5a', '#5a4a6a'][Math.floor(h * 4)]; setInst(I.car, c.car, X, Y, Z, rot, 1, 1, 1, col); setInst(I.carW, c.car++, X, Y, Z, rot, 1, 1, 1); break; }
    }
  }
  I.wall.count = c.wall; I.slab.count = c.slab; I.stairs.count = c.stairs; I.doorF.count = I.doorL.count = c.door; I.bars.count = c.bars; I.wire.count = c.wire;
  I.lampP.count = I.lampH.count = c.lamp; I.trunk.count = c.trunk; for (const m of I.pine) m.count = c.pine; I.oak.count = c.oak; I.rock.count = c.rock;
  I.crate.count = c.crate; I.rubble.count = c.rubble; I.fence.count = c.fence; I.car.count = I.carW.count = c.car;
  for (const k in I) { const arr = Array.isArray(I[k]) ? I[k] : [I[k]]; for (const m of arr) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } }
  RC.lamps = lamps;
}

/* ---------- characters ---------- */
const PCOL = [{ j: '#d9733a', j2: '#a85224', h: '#3a2618', p: '#2f3442' }, { j: '#2f9e94', j2: '#1f6f68', h: '#1b1b22', p: '#3b3a33' }];
function mkPlayerModel(i) {
  const C = PCOL[i % 2], g = new THREE.Group();
  const part = (geo, col) => { const m = new THREE.Mesh(geo, lam(col)); m.castShadow = true; return m; };
  const hip = new THREE.Group(); hip.position.y = 0.42; g.add(hip);
  const legL = part(boxG(0.12, 0.42, 0.13, 0, -0.21, 0), C.p), legR = part(boxG(0.12, 0.42, 0.13, 0, -0.21, 0), '#262a33'); legL.position.z = -0.08; legR.position.z = 0.08; hip.add(legL, legR);
  const torso = part(boxG(0.22, 0.4, 0.34, 0, 0.2, 0), C.j); torso.position.y = 0.42; g.add(torso);
  const pack = part(boxG(0.12, 0.28, 0.26, -0.16, 0.22, 0), '#4c4636'); torso.add(pack);
  const head = part(boxG(0.21, 0.21, 0.21, 0, 0.105, 0), '#e1b892'); head.position.y = 0.82; g.add(head);
  const hair = part(boxG(0.23, 0.08, 0.23, -0.01, 0.2, 0), C.h); head.add(hair);
  if (i % 2) { const band = part(boxG(0.235, 0.04, 0.235, 0, 0.15, 0), '#c94b4b'); head.add(band); }
  const arms = new THREE.Group(); arms.position.y = 0.7; g.add(arms);
  const armL = part(boxG(0.36, 0.09, 0.09, 0.18, 0, 0), C.j2), armR = part(boxG(0.36, 0.09, 0.09, 0.18, 0, 0), C.j); armL.position.z = -0.14; armR.position.z = 0.14; arms.add(armL, armR);
  const guns = [boxG(0.22, 0.07, 0.06, 0.42, 0.02, 0), merge([boxG(0.5, 0.07, 0.07, 0.48, 0.02, 0), boxG(0.18, 0.08, 0.08, 0.2, -0.01, 0)]), merge([boxG(0.5, 0.07, 0.06, 0.48, 0.02, 0), boxG(0.06, 0.12, 0.05, 0.42, -0.06, 0)]), merge([boxG(0.7, 0.06, 0.06, 0.55, 0.02, 0), boxG(0.16, 0.06, 0.06, 0.45, 0.08, 0)])].map(gg => { const m = part(gg, '#1c1f24'); m.visible = false; arms.add(m); return m; });
  const hammer = part(merge([boxG(0.3, 0.04, 0.04, 0.38, 0.02, 0), boxG(0.08, 0.14, 0.08, 0.52, 0.02, 0)]), '#8a6a44'); hammer.visible = false; arms.add(hammer);
  SCN.add(g);
  return { g, hip, legL, legR, torso, head, arms, guns, hammer };
}
const ZSHIRT = ['#3c4652', '#4f3e33', '#34402f', '#5a4a3a', '#3e3446', '#46503f', '#5a3434', '#2f3a44'];
const ZSKIN = ['#93a383', '#82967a', '#a0aa8e', '#8a9a80'];
const ZSPEC = { climber: '#6f7e86', spitter: '#7f9a45', brute: '#7a6f66', boss: '#6d5d58' };
const zm = new THREE.Matrix4(), zm2 = new THREE.Matrix4(), zp = new THREE.Matrix4(), ze = new THREE.Euler();
function partM(base, x, y, z, rx, ry, rz, out) { ze.set(rx, ry, rz); zp.makeRotationFromEuler(ze); zp.setPosition(x, y, z); return out.multiplyMatrices(base, zp); }
function drawZombies(vl) {
  const Z = OBJ.Z; let n = 0, nb = 0;
  const list = W.zs.concat(RND.corpses);
  for (const z of list) {
    if (n >= 410) break;
    const corpse = !!z.corpse, L = z.L != null ? z.L : Math.floor((z.z + 0.1) / FH);
    if (L > vl) continue;
    const T = ZT[z.k], s = T.sc, hit = !corpse && z.hitT > 0;
    const skin = hit ? '#f2efe6' : z.k === 'walker' || z.k === 'runner' ? ZSKIN[z.seed % 4] : ZSPEC[z.k] || ZSKIN[0], shirt = hit ? '#e0ddd6' : ZSHIRT[z.seed % 8], pants = hit ? '#d8d8d8' : '#26292b';
    const mv = corpse ? 0 : (z.moving ? 1 : 0.12), ph = (z.anim || 0) * (z.k === 'runner' ? 11 : z.k === 'climber' ? 9 : 5) * mv;
    const sw = Math.sin(ph) * (z.k === 'runner' ? 0.85 : 0.5), atk = !corpse && z.atk > 0 ? Math.sin(W.t * 16 + z.seed) : 0;
    tmpQ.setFromAxisAngle(UPV, -(z.face || 0)); tmpV.set(z.x, z.z, z.y); tmpS.set(s, s, s);
    zm.compose(tmpV, tmpQ, tmpS);
    if (corpse) { const a = Math.min(1, z.t / 0.45); zm2.makeRotationZ(a * a * Math.PI / 2 * 0.95); zm.multiply(zm2); const sink = Math.max(0, z.t - 6) * 0.15; zm2.makeTranslation(-sink, 0, 0); zm.multiply(zm2); }
    const crouch = z.k === 'climber' && !z.climbing, climbing = !!z.climbing;
    const lean = z.k === 'runner' ? 0.45 : z.k === 'brute' || z.k === 'boss' ? 0.12 : crouch ? 1.15 : 0.22;
    const hipY = crouch ? 0.3 : 0.42;
    Z.legL.setMatrixAt(n, partM(zm, 0, hipY, -0.08, 0, 0, crouch ? 0.9 + sw * 0.5 : sw, zm2)); Z.legL.setColorAt(n, tmpC.set(pants));
    Z.legR.setMatrixAt(n, partM(zm, 0, hipY, 0.08, 0, 0, crouch ? 0.9 - sw * 0.5 : -sw, zm2)); Z.legR.setColorAt(n, tmpC.set(pants));
    const tz = Math.sin(ph * 0.5) * 0.05;
    Z.torso.setMatrixAt(n, partM(zm, 0.02, hipY, 0, tz, 0, -lean - (climbing ? 0.4 : 0), zm2)); Z.torso.setColorAt(n, tmpC.set(shirt));
    const tx = Math.sin(lean) * 0.4, ty = Math.cos(lean) * 0.4;
    Z.head.setMatrixAt(n, partM(zm, 0.02 + tx + 0.04, hipY + ty, 0, 0, 0, -lean * 0.5, zm2)); Z.head.setColorAt(n, tmpC.set(skin));
    const big = z.k === 'brute' || z.k === 'boss', reach = big ? -1.1 + atk * 0.9 : crouch ? -1.0 : climbing ? 1.2 : -0.15 + atk * 0.5;
    Z.armL.setMatrixAt(n, partM(zm, 0.02 + tx * 0.8, hipY + ty * 0.8, -0.18, 0, 0, reach - (climbing ? Math.sin(ph) * 0.6 : 0), zm2)); Z.armL.setColorAt(n, tmpC.set(skin));
    Z.armR.setMatrixAt(n, partM(zm, 0.02 + tx * 0.8, hipY + ty * 0.8, 0.18, 0, 0, reach + (climbing ? Math.sin(ph) * 0.6 : 0) + (big ? 0 : atk * 0.3), zm2)); Z.armR.setColorAt(n, tmpC.set(skin));
    Z.eyes.setMatrixAt(n, partM(zm, 0.02 + tx + 0.15, hipY + ty + 0.13, 0, 0, 0, 0, zm2)); Z.eyes.setColorAt(n, tmpC.set(corpse ? '#1a1010' : z.k === 'boss' ? '#ff3b2f' : z.k === 'spitter' ? '#b6ff4a' : '#ffd36a'));
    if (z.k === 'spitter') { Z.belly.setMatrixAt(nb++, partM(zm, 0.13, hipY + 0.18, 0, 0, 0, 0, zm2)); }
    n++;
  }
  for (const k in Z) { Z[k].count = k === 'belly' ? nb : n; Z[k].instanceMatrix.needsUpdate = true; if (Z[k].instanceColor) Z[k].instanceColor.needsUpdate = true; }
}
function drawPlayers(vl) {
  while (OBJ.pl.length < W.p.length) OBJ.pl.push(mkPlayerModel(OBJ.pl.length));
  OBJ.pl.forEach((m, i) => { const p = W.p[i]; m.g.visible = !!p && !p.gone && !p.dead && p.L <= vl; });
  W.p.forEach((p, i) => {
    const m = OBJ.pl[i]; if (!m.g.visible) return;
    const zv = p.zv != null ? p.zv : p.z; m.g.position.set(p.x, zv, p.y);
    const run = Math.hypot(p.vx, p.vy) > 0.3, sw = Math.sin(p.anim) * (run ? 0.7 : 0.05);
    m.g.rotation.set(0, -p.aim, 0);
    if (p.down) { m.g.rotation.z = Math.PI / 2 * 0.9; m.g.position.y += 0.12; } else m.g.rotation.z = 0;
    m.legL.rotation.z = sw; m.legR.rotation.z = -sw;
    const recoil = p.recoilT > 0 ? -p.recoilT * 1.2 : 0, shove = p.shoveT > 0 ? 0.12 : 0;
    m.arms.position.x = recoil * 0.1 + shove;
    const pitch = p.aimPt ? Math.atan2(p.aimPt.z - (p.z + 0.72), Math.max(0.4, Math.hypot(p.aimPt.x - p.x, p.aimPt.y - p.y))) : 0;
    m.arms.rotation.z = p.build ? -0.3 : clamp(pitch, -0.9, 0.7) * 0.8;
    const wi = p.down ? 0 : p.wpn; m.guns.forEach((gm, k) => gm.visible = !p.build && k === wi); m.hammer.visible = !!p.build;
    const flash = p.hurtT > 0 && Math.floor(p.hurtT * 30) % 2; m.torso.visible = !flash;
  });
}

/* ---------- effects ---------- */
const RND = { parts: [], tracers: [], corpses: [], floats: [], flashes: [], booms: [], hurtV: 0 };
function addP(o) { if (RND.parts.length < 880) RND.parts.push(Object.assign({ vx: 0, vy: 0, vz: 0, g: 9, life: 0.8, t: 0, s: 0.06, col: '#ffffff', floor: 0 }, o)); }
function bloodFx(x, y, z, n, green) { for (let k = 0; k < n; k++) addP({ x, y, z, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(0, 3), col: green ? (k % 2 ? '#7fb53a' : '#4f7a1e') : (k % 2 ? '#6e0d0b' : '#9b1712'), s: frnd(0.04, 0.09), life: frnd(0.35, 0.8), floor: z - 1.2 }); }
function debrisFx(x, y, z, col, n) { for (let k = 0; k < n; k++) addP({ x: x + frnd(-0.4, 0.4), y: y + frnd(-0.4, 0.4), z: z + frnd(0, 1), vx: frnd(-2.5, 2.5), vy: frnd(-2.5, 2.5), vz: frnd(0, 4), col, s: frnd(0.06, 0.16), life: frnd(0.7, 1.4), floor: z - 0.05 }); for (let k = 0; k < n / 3; k++) addP({ x, y, z: z + 0.3, vx: frnd(-0.4, 0.4), vy: frnd(-0.4, 0.4), vz: frnd(0.2, 0.7), g: -0.3, col: '#5f5850', s: frnd(0.16, 0.26), life: frnd(0.4, 0.7), smoke: 1 }); }
function stepFx(dt) {
  for (const q of RND.parts) { q.t += dt; q.vz -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.z < q.floor && q.vz < 0) { q.z = q.floor; q.vz *= -0.3; q.vx *= 0.5; q.vy *= 0.5; } }
  RND.parts = RND.parts.filter(q => q.t < q.life);
  RND.tracers = RND.tracers.filter(t => (t.t += dt) < t.life);
  RND.flashes = RND.flashes.filter(f => (f.t += dt) < f.life);
  RND.booms = RND.booms.filter(b => (b.t += dt) < 0.6);
  for (const c of RND.corpses) c.t += dt; RND.corpses = RND.corpses.filter(c => c.t < 9);
  RND.floats = RND.floats.filter(f => { f.t += dt; f.z += dt * 0.6; return f.t < 2.2; });
  CAM.shake = Math.max(0, CAM.shake - dt * 1.8); RND.hurtV = Math.max(0, RND.hurtV - dt * 1.6);
  for (const p of W.p) { if (p.recoilT > 0) p.recoilT -= dt; if (p.shoveT > 0) p.shoveT -= dt; }
}
function drawFx() {
  const P = OBJ.parts; let n = 0;
  for (const q of RND.parts) { const a = 1 - q.t / q.life, s = q.smoke ? q.s * (1 + q.t * 1.5) * a : q.s; setInst(P, n, q.x, q.z, q.y, q.t * 5, s, s, s, q.col); n++; }
  P.count = n; P.instanceMatrix.needsUpdate = true; if (P.instanceColor) P.instanceColor.needsUpdate = true;
  const pos = OBJ.tracers.geometry.attributes.position, col = OBJ.tracers.geometry.attributes.color; let k = 0;
  for (const t of RND.tracers) { if (k >= 120) break; const a = 1 - t.t / t.life, f = t.t / t.life * 0.6; pos.setXYZ(k * 2, lerp(t.x, t.x2, f), lerp(t.z, t.z2, f), lerp(t.y, t.y2, f)); pos.setXYZ(k * 2 + 1, t.x2, t.z2, t.y2); col.setXYZ(k * 2, a * 0.6, a * 0.5, a * 0.3); col.setXYZ(k * 2 + 1, a, a * 0.9, a * 0.6); k++; }
  OBJ.tracers.geometry.setDrawRange(0, k * 2); pos.needsUpdate = col.needsUpdate = true;
  let f = 0; for (const fl of RND.flashes) { if (f >= 8) break; const s = (fl.big ? 1.6 : 1) * (1 - fl.t / fl.life); setInst(OBJ.flashM, f++, fl.x, fl.z, fl.y, 0, s, s, s); } OBJ.flashM.count = f; OBJ.flashM.instanceMatrix.needsUpdate = true;
  let b = 0; for (const bo of RND.booms) { if (b >= 8) break; const s = BAL.nadeR * (0.3 + bo.t * 1.4); setInst(OBJ.boom, b++, bo.x, bo.z, bo.y, 0, s, s, s); } OBJ.boom.count = b; OBJ.boom.instanceMatrix.needsUpdate = true; OBJ.boom.material.opacity = RND.booms.length ? 0.55 * (1 - RND.booms[0].t / 0.6) : 0;
  let ng = 0, na = 0; for (const p of W.proj) { if (p.k === 'nade') setInst(OBJ.nade, ng++, p.x, p.z, p.y, W.t * 8, 1, 1, 1); else setInst(OBJ.acid, na++, p.x, p.z, p.y, 0, 1, 1, 1); }
  OBJ.nade.count = ng; OBJ.acid.count = na; OBJ.nade.instanceMatrix.needsUpdate = OBJ.acid.instanceMatrix.needsUpdate = true;
  // flashes + explosions light pool
  const srcs = RND.flashes.map(fl => [fl.x, fl.z, fl.y, (fl.big ? 6 : 4) * (1 - fl.t / fl.life), 5]).concat(RND.booms.map(bo => [bo.x, bo.z + 0.6, bo.y, 40 * (1 - bo.t / 0.6), 12]));
  OBJ.flash.forEach((L, k) => { const s = srcs[k]; if (s) { L.position.set(s[0], s[1], s[2]); L.intensity = s[3]; L.distance = s[4]; } else L.intensity = 0; });
}

/* ---------- time of day ---------- */
function darkness() {
  if (!W) return 0.5;
  if (DBG && DBG.dark != null) return DBG.dark;
  if (W.phase === 'night' || W.phase === 'lose') return 1;
  if (W.phase === 'win') return 0.2;
  const c = W.clock, since = W.dayLen - c;
  if (W.night > 0 && since < 7) return lerp(1, 0, since / 7);
  if (c < 30) return lerp(0.85, 0, c / 30);
  return 0;
}
const C3 = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
function applyTime(dk) {
  const blood = W.phase === 'night' && isBlood(W.night), dusk = Math.sin(clamp(dk, 0, 1) * Math.PI);
  let sky = C3('#9fb1c4', '#0a0f1c', dk); sky.lerp(new THREE.Color('#d98a5a'), dusk * 0.35); if (blood) sky = new THREE.Color('#2a070b');
  SCN.background = sky;
  OBJ.hemi.intensity = lerp(1.15, 0.62, dk); OBJ.hemi.color.copy(C3('#d6e2ff', blood ? '#8a3a40' : '#4a5c8c', dk)); OBJ.hemi.groundColor.copy(C3('#4a3c2a', '#141018', dk));
  OBJ.sun.intensity = lerp(2.3, 0.85, dk); OBJ.sun.color.copy(C3('#fff0d8', blood ? '#ff6a5a' : '#9fb4ff', dk)).lerp(new THREE.Color('#ff9a5a'), dusk * 0.5);
  RENDER.toneMappingExposure = lerp(1.25, 1.6, dk);
  const lampOn = dk > 0.3 ? 1 : dk / 0.3;
  const me = W.p[ME], ref = me || { x: CAM.tx, y: CAM.ty };
  const ls = RC.lamps.slice().sort((a, b) => d2(a[0], a[2], ref.x, ref.y) - d2(b[0], b[2], ref.x, ref.y));
  OBJ.lamps.forEach((L, k) => { const s = ls[k]; if (s && lampOn > 0.01) { L.position.set(s[0], s[1], s[2]); L.intensity = 9 * lampOn; } else L.intensity = 0; });
  W.p.forEach((p, k) => {
    const S = OBJ.spots[k]; if (!S) return;
    if (p.gone || p.dead || p.down || dk < 0.25 || p.L > viewL()) { S.intensity = 0; return; }
    const z = (p.zv != null ? p.zv : p.z) + 0.8; S.position.set(p.x, z, p.y);
    const tx = p.aimPt ? p.aimPt.x : p.x + Math.cos(p.aim) * 6, ty = p.aimPt ? p.aimPt.y : p.y + Math.sin(p.aim) * 6, tz = p.aimPt ? Math.min(p.aimPt.z, z) - 0.6 : z - 1.2;
    S.target.position.set(tx, tz, ty); S.intensity = 36 * Math.min(1, (dk - 0.25) * 2);
  });
  OBJ.radioL.position.set(W.radio.x + 0.75, gAt(W.radio.x, W.radio.y) * FH + 1.4, W.radio.y + 0.5); OBJ.radioL.intensity = Math.sin(W.t * 6) > 0 ? 2.5 * Math.max(0.2, dk) : 0.3;
  OBJ.radioLed.material.color.set(Math.sin(W.t * 6) > 0 ? '#ff3b2f' : '#4a1410');
}

/* ---------- camera ---------- */
function updateCamera(dt) {
  const me = W.p[ME];
  let fx = W.radio.x + 0.5, fy = W.radio.y + 0.5, fz = 0;
  if (me && !me.gone) { const t = me.dead ? (W.p.find(p => !p.dead && !p.gone) || me) : me; fx = t.x; fy = t.y; fz = t.zv != null ? t.zv : t.z; }
  if (W.demo) { fx = W.radio.x + 0.5 + Math.sin(W.t * 0.08) * 6; fy = W.radio.y + 3 + Math.cos(W.t * 0.06) * 4; fz = 0; }
  const k = Math.min(1, dt * 6);
  CAM.tx = lerp(CAM.tx, fx + (CAM.lookX || 0), k); CAM.ty = lerp(CAM.ty, fy + (CAM.lookY || 0), k); CAM.tz = lerp(CAM.tz, fz, k);
  const tgtYaw = camYawTarget(); CAM.yaw += angDiff(CAM.yaw, tgtYaw) * Math.min(1, dt * 9);
  const zoom = clamp(CAM.zoom, 4, 22), asp = VW / VH, half = VH > VW ? zoom * 1.25 : zoom;
  CAMO.left = -half * asp; CAMO.right = half * asp; CAMO.top = half; CAMO.bottom = -half; CAMO.updateProjectionMatrix();
  const R = 60, cp = Math.cos(CAM.pitch), sp = Math.sin(CAM.pitch);
  const sh = CAM.shake ? frnd(-CAM.shake, CAM.shake) : 0;
  CAMO.position.set(CAM.tx + Math.sin(CAM.yaw) * cp * R + sh, CAM.tz + sp * R, CAM.ty + Math.cos(CAM.yaw) * cp * R + sh);
  CAMO.lookAt(CAM.tx + sh, CAM.tz, CAM.ty + sh);
  // sun & shadow box follow the view
  const S = OBJ.sun; S.position.set(CAM.tx + 18, CAM.tz + 30, CAM.ty + 8); S.target.position.set(CAM.tx, CAM.tz, CAM.ty);
  const sc = S.shadow.camera, ext = zoom * 1.9; if (sc.right !== ext) { sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 90; sc.updateProjectionMatrix(); }
}
// world (x,y,z) -> screen px
const projV = new THREE.Vector3();
function w2s(x, y, z) { projV.set(x, z, y).project(CAMO); return [(projV.x + 1) / 2 * VW, (1 - projV.y) / 2 * VH, projV.z]; }
// screen px -> world ray {o:[x,y,z], d:[dx,dy,dz]}
const RAY = new THREE.Raycaster(), NDC = new THREE.Vector2();
function screenRay(sx, sy) { NDC.set(sx / VW * 2 - 1, -(sy / VH) * 2 + 1); RAY.setFromCamera(NDC, CAMO); const o = RAY.ray.origin, d = RAY.ray.direction; return { o: [o.x, o.z, o.y], d: [d.x, d.z, d.y] }; }
// aim pick: nearest visible zombie under the cursor, else the first surface
function aimPick(sx, sy) {
  const { o, d } = screenRay(sx, sy), vl = viewL();
  let best = null, bd = 1e9;
  for (const z of W.zs) { if (z.L > vl) continue; const t = rayBox(o[0], o[1], o[2], d[0], d[1], d[2], z.x - z.r - 0.15, z.y - z.r - 0.15, z.z, z.r * 2 + 0.3, z.r * 2 + 0.3, z.h, 400); if (t >= 0 && t < bd) { bd = t; best = z; } }
  if (best) return { x: best.x, y: best.y, z: best.z + best.h * 0.65, zb: best };
  // march the camera ray into the visible part of the map
  const top = (vl + 2) * FH; let t0 = 0; if (o[2] > top && d[2] < 0) t0 = (o[2] - top) / -d[2];
  const h = rayWorld(o[0] + d[0] * t0, o[1] + d[1] * t0, o[2] + d[2] * t0, d[0], d[1], d[2], 200, { maxL: vl, pick: true });
  const t = t0 + h.d, px = o[0] + d[0] * t, py = o[1] + d[1] * t, pz = o[2] + d[2] * t;
  return { x: px, y: py, z: pz + (h.face === 2 || h.slab ? 0.6 : 0) };
}
// build pick: the cell on the view layer under the cursor
function buildPick(sx, sy, L) { const { o, d } = screenRay(sx, sy), pz = L * FH; if (Math.abs(d[2]) < 1e-6) return null; const t = (o[2] - pz) / -d[2]; return { x: Math.floor(o[0] + d[0] * t), y: Math.floor(o[1] + d[1] * t), L }; }

/* ---------- build ghost ---------- */
let BUILD_HOVER = null;
function drawGhost(me) {
  const G = OBJ.ghost, E = OBJ.ghostEdge, H = BUILD_HOVER, show = me && me.build && H && !me.down && !me.dead;
  OBJ.grid.visible = !!(me && me.build); if (OBJ.grid.visible) OBJ.grid.position.y = buildL() * FH + 0.02;
  G.visible = E.visible = !!show; if (!show) return;
  const b = me.demo ? 0 : me.sel, geo = me.demo ? GEO.wall : B[b].slab ? GEO.slab : b === 6 ? GEO.stairs : b === 8 ? GEO.bars : b === 9 ? GEO.wire : b === 10 ? GEO.lampPole : GEO.wall;
  if (G.geometry !== geo) G.geometry = geo;
  G.position.set(H.x + 0.5, H.L * FH + (B[b] && B[b].slab ? 0.0 : 0), H.y + 0.5); G.rotation.y = b === 6 ? -me.sdir * Math.PI / 2 : 0;
  G.material.color.set(me.demo ? '#ff5a4a' : H.ok ? '#7dff8a' : '#ff5a4a');
  E.position.set(H.x + 0.5, H.L * FH, H.y + 0.5); E.material.color.set(me.demo ? '#ff8a7a' : H.ok ? '#ffffff' : '#ffb0a0');
}

/* ---------- main draw ---------- */
let CUT_KEY = '';
function draw(dt) {
  if (!W || !OBJ.I) return;
  stepFx(dt);
  updateCamera(dt);
  const me = W.p[ME], vl = viewL();
  const key = W.ver + ':' + vl + ':' + CAM.rot + ':' + (me ? Math.floor(me.x) + ',' + Math.floor(me.y) + ',' + me.L : '');
  if (key !== CUT_KEY) { CUT_KEY = key; rebuildCells(); }
  applyTime(darkness());
  drawZombies(vl); drawPlayers(vl); drawFx(); drawGhost(me);
  OBJ.zone.visible = !W.demo && W.phase === 'day' || !!(me && me.build);
  RENDER.render(SCN, CAMO);
  drawOverlay();
}
// DOM overlay: floating loot text, teammate tag, off-screen markers
const OV = document.getElementById('ov');
function drawOverlay() {
  if (!OV) return;
  let html = '';
  for (const f of RND.floats) { const [sx, sy] = w2s(f.x, f.y, f.z); html += `<div class="fl" style="left:${sx | 0}px;top:${sy | 0}px;opacity:${clamp(2.2 - f.t, 0, 1).toFixed(2)};color:${f.col}">${f.text}</div>`; }
  for (const p of W.p) {
    if (p.i === ME || p.gone || p.dead || W.p.length < 2) continue;
    const [sx, sy] = w2s(p.x, p.y, (p.zv != null ? p.zv : p.z) + 1.35);
    const on = sx > 10 && sx < VW - 10 && sy > 10 && sy < VH - 10;
    if (on) html += `<div class="tag" style="left:${sx | 0}px;top:${sy | 0}px"><span>${p.name}${p.L !== W.p[ME].L ? ' · ' + (p.L + 1) + 'F' : ''}</span><i style="width:${(p.down ? 0 : p.hp / p.maxHp * 100) | 0}%;background:${PCOL[p.i % 2].j}"></i></div>`;
    else { const ax = clamp(sx, 26, VW - 26), ay = clamp(sy, 80, VH - 80); const an = Math.atan2(sy - ay, sx - ax); html += `<div class="arr" style="left:${ax | 0}px;top:${ay | 0}px;transform:translate(-50%,-50%) rotate(${an}rad);color:${p.down ? '#ff5a4a' : PCOL[p.i % 2].j}">➤</div>`; }
  }
  OV.innerHTML = html;
}

/* ---------- minimap ---------- */
const MM = { base: null, t: 0 };
function buildMinimapBase() {
  const c = document.createElement('canvas'); c.width = MW; c.height = MH; const g = c.getContext('2d');
  const MC = { [TT.grass]: '#55733e', [TT.hill]: '#7a8a5a', [TT.dirt]: '#6e5a42', [TT.road]: '#3c3d40', [TT.sand]: '#8a7f5a', [TT.forest]: '#3c5530', [TT.water]: '#2a6a86' };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { let col = MC[ttAt(x, y)] || '#555'; if (gAt(x, y) === 2) col = '#8f9a6a'; g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  MM.base = c;
}
function drawMinimap(dt) {
  const cv = document.getElementById('mini'); if (!cv || !MM.base || !W) return;
  MM.t -= dt; if (MM.t > 0) return; MM.t = 0.2;
  const g = cv.getContext('2d'), S = cv.width / MW;
  g.save(); g.clearRect(0, 0, cv.width, cv.height);
  g.translate(cv.width / 2, cv.height / 2); g.rotate(CAM.yaw); g.translate(-cv.width / 2, -cv.height / 2);
  g.imageSmoothingEnabled = false; g.drawImage(MM.base, 0, 0, cv.width, cv.height);
  g.fillStyle = 'rgba(30,30,34,.85)';
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { for (let L = gAt(x, y); L < Math.min(ML, gAt(x, y) + 3); L++) { const b = W.blk[ci(x, y, L)]; if ((b && B[b].cost) || b === 24) { g.fillRect(x * S, y * S, S, S); break; } if (b === 22) { g.fillStyle = '#25381f'; g.fillRect(x * S, y * S, S, S); g.fillStyle = 'rgba(30,30,34,.85)'; break; } } }
  g.strokeStyle = 'rgba(255,207,107,.6)'; g.lineWidth = 1; g.strokeRect((W.radio.x - BUILD_R) * S, (W.radio.y - BUILD_R) * S, (BUILD_R * 2 + 1) * S, (BUILD_R * 2 + 1) * S);
  g.fillStyle = '#ff3b2f'; for (const z of W.zs) g.fillRect(z.x * S - 1.5, z.y * S - 1.5, 3, 3);
  g.fillStyle = '#7fd36b'; g.fillRect(W.radio.x * S - 1, W.radio.y * S - 1, S + 2, S + 2);
  for (const p of W.p) { if (p.gone || p.dead) continue; g.fillStyle = PCOL[p.i % 2].j; g.beginPath(); g.arc(p.x * S, p.y * S, 3.2, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke(); }
  g.restore();
}

/* ---------- events -> effects (+ guest-side state application) ---------- */
const sfxThr = {};
function thr(k, s) { const n = performance.now(); if (sfxThr[k] && n - sfxThr[k] < s * 1000) return false; sfxThr[k] = n; return true; }
const cellPos = i => [cx_(i) + 0.5, cy_(i) + 0.5, cl_(i) * FH + 0.6];
function fxEvent(e) {
  if (!W) return;
  const guest = NETROLE === 'guest';
  switch (e.k) {
    case 'shot': if (guest && e.o === ME) break; shotFx(e.o, e.w, e.e); break;
    case 'hit': bloodFx(e.x, e.y, e.z, e.h ? 9 : 5, e.g); if (thr('flesh', 0.05)) sfx(e.h ? 'head' : 'flesh', e.x, e.y); break;
    case 'zdie':
      RND.corpses.push({ corpse: 1, x: e.x, y: e.y, z: e.z, k: e.t, face: e.f, t: 0, seed: e.id * 7, L: Math.floor((e.z + 0.1) / FH) }); if (RND.corpses.length > 60) RND.corpses.shift();
      bloodFx(e.x, e.y, e.z + 0.6, 10, e.t === 'spitter');
      if (thr('zdie', 0.12)) sfx(e.t === 'brute' || e.t === 'boss' ? 'bigdie' : 'zdie', e.x, e.y);
      if (guest) { const z = W.zs.find(z => z.id === e.id); if (z) z.hp = 0; }
      break;
    case 'cell': {
      const prevB = W.blk[e.i], prevS = W.slab[e.i];
      if (guest) { W.blk[e.i] = e.b; W.bhp[e.i] = e.b ? (B[e.b].hp || 1) : 0; W.slab[e.i] = e.s; W.shp[e.i] = e.s ? (B[e.s].hp || 1) : 0; W.bdir[e.i] = e.d; W.ver++; recomputeStab(); }
      const [x, y, z] = cellPos(e.i), col = (B[prevB] && B[prevB].col) || (B[prevS] && B[prevS].col) || '#777';
      if (e.c === 'brk' || e.c === 'fall') { debrisFx(x, y, z - 0.5, col, e.c === 'fall' ? 6 : 10); if (thr('brk', 0.06)) sfx(e.c === 'fall' ? 'fall' : prevB === 3 || prevB === 8 || prevS === 5 ? 'brkMetal' : 'brk', x, y); }
      else if (e.c === 'build') { sfx('build', x, y); debrisFx(x, y, z - 0.5, '#c8bba8', 2); }
      else if (e.c === 'demo') { sfx('demo', x, y); debrisFx(x, y, z - 0.5, col, 4); }
      else if (e.c === 'chop') { sfx('chop', x, y); debrisFx(x, y, z - 0.4, '#3c5f35', 8); }
      else if (e.c === 'mine') { sfx('brk', x, y); debrisFx(x, y, z - 0.5, '#77736b', 8); }
      break;
    }
    case 'bash': { const [x, y, z] = cellPos(e.i); if (thr('bash' + e.i, 0.15)) { sfx(e.z === 'brute' || e.z === 'boss' ? 'smash' : 'bash', x, y); addP({ x, y, z, vx: frnd(-1.5, 1.5), vy: frnd(-1.5, 1.5), vz: frnd(0.5, 2.5), col: B[W.blk[e.i]] && B[W.blk[e.i]].col || '#888', s: 0.07, life: 0.5, floor: z - 0.6 }); if (e.z === 'brute' || e.z === 'boss') shake(x, y, 0.15); } break; }
    case 'collapse': { const [x, y] = cellPos(e.i); sfx('collapse', x, y); shake(x, y, 0.35); break; }
    case 'repair': { const [x, y] = cellPos(e.i); sfx('build', x, y); break; }
    case 'spot': if (guest) { const s = W.spots.find(s => s.i === e.i); if (s) s.searched = !!e.v; } break;
    case 'loot': RND.floats.push({ x: e.x, y: e.y, z: e.z, text: e.text, col: '#ffd76a', t: 0 }); if (e.p === ME || e.p < 0) sfx('loot'); break;
    case 'phurt': if (e.p === ME) { RND.hurtV = Math.min(1, RND.hurtV + 0.5); CAM.shake = Math.max(CAM.shake, 0.12); if (thr('hurt', 0.25)) sfx('hurt'); } break;
    case 'down': sfx('down', W.p[e.p].x, W.p[e.p].y); uiMsg(e.p === ME ? (W.p.length > 1 ? '你倒地了！等队友扶你，或按 H 用医疗包自救' : '你倒地了！按 H 用医疗包自救') : W.p[e.p].name + ' 倒地了！快去扶（按住 F）', '#ff6b5a'); break;
    case 'revive': sfx('revive'); uiMsg(e.p === e.by ? W.p[e.p].name + ' 自救成功' : W.p[e.by].name + ' 扶起了 ' + W.p[e.p].name, '#8fe39a'); break;
    case 'dead': uiMsg(W.p[e.p].name + ' 阵亡了，天亮后会在电台旁复活', '#ff6b5a'); break;
    case 'tp': if (guest && e.p === ME) { const p = W.p[ME]; p.x = e.x; p.y = e.y; p.L = e.l; p.vx = p.vy = 0; } break;
    case 'kb': if (guest && e.p === ME) { const p = W.p[ME]; p.kbx += e.x; p.kby += e.y; } break;
    case 'night': sfx(e.blood ? 'blood' : 'night'); banner(e.blood ? '第 ' + e.n + ' 夜 · 血月' : '第 ' + e.n + ' 夜', (e.blood ? '尸潮从四面八方涌来，巨尸出没' : '尸潮从' + e.from + '边来了') + '，守住电台', e.blood ? '#ff5a4a' : '#ffd27a'); break;
    case 'dawn': document.getElementById('over').classList.add('hidden'); sfx('dawn'); banner('天亮了', '撑过了第 ' + e.n + ' 夜 · 出去搜物资、砍树采石、加固堡垒', '#ffe7b0'); break;
    case 'say': uiMsg(e.text, e.col); break;
    case 'craft': if (e.p === ME) { sfx('craft'); toast('制作完成：' + e.name); } break;
    case 'deny': if (e.p === ME && thr('deny', 0.3)) { sfx('deny'); toast(e.why, '#ff8a7a'); } break;
    case 'boom': RND.booms.push({ x: e.x, y: e.y, z: e.z, t: 0 }); debrisFx(e.x, e.y, e.z, '#3a3530', 12); sfx('boom', e.x, e.y); shake(e.x, e.y, 0.4); break;
    case 'acid': for (let k = 0; k < 8; k++) addP({ x: e.x, y: e.y, z: e.z, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(0, 2.5), col: k % 2 ? '#9dff3a' : '#5f9a20', s: 0.06, life: 0.5, floor: e.z - 0.3 }); sfx('acid', e.x, e.y); break;
    case 'rhit': if (thr('rhit', 0.3)) { sfx('rhit', W.radio.x, W.radio.y); for (let k = 0; k < 4; k++) addP({ x: W.radio.x + 0.5, y: W.radio.y + 0.5, z: 0.6, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(1, 3), col: '#ffd76a', s: 0.05, life: 0.4 }); } break;
    case 'shove': sfx(e.n ? 'shoveHit' : 'shove', W.p[e.p].x, W.p[e.p].y); if (guest || e.p !== ME) W.p[e.p].shoveT = 0.18; break;
    case 'over': if (!W.demo && STATE.mode === 'play') showOver(e); break;
    case 'sfx': if (e.local || !(guest && e.o === ME && /reload|swap/.test(e.n))) sfx(e.n, e.x, e.y); break;
  }
}
function shotFx(o, wi, ends) {
  const p = W.p[o]; if (!p) return;
  const z0 = (p.zv != null ? p.zv : p.z) + (p.down ? 0.25 : 0.72), mx = p.x + Math.cos(p.aim) * 0.55, my = p.y + Math.sin(p.aim) * 0.55;
  for (const [x2, y2, z2, wall] of ends) {
    RND.tracers.push({ x: mx, y: my, z: z0, x2, y2, z2, t: 0, life: wi === 3 ? 0.16 : 0.08 });
    if (wall) for (let k = 0; k < 3; k++) addP({ x: x2, y: y2, z: z2, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(0, 2), col: '#ffd76a', s: 0.04, life: 0.25, floor: z2 - 1 });
  }
  RND.flashes.push({ x: mx, y: my, z: z0, t: 0, life: 0.06, big: wi === 1 || wi === 3 });
  p.recoilT = 0.08;
  if (wi) addP({ x: p.x, y: p.y, z: z0, vx: -Math.sin(p.aim) * frnd(1, 2), vy: Math.cos(p.aim) * frnd(1, 2), vz: frnd(1.5, 2.5), col: '#c9a23a', s: 0.04, life: 0.7, floor: z0 - 0.72 });
  sfx(WPN[wi].k, p.x, p.y);
  if (o === ME) CAM.shake = Math.max(CAM.shake, WPN[wi].shake);
}
function shake(x, y, a) { const me = W.p[ME]; if (!me) return; const d = d2(x, y, me.x, me.y); CAM.shake = Math.max(CAM.shake, a * clamp(1 - d / 22, 0, 1)); }
