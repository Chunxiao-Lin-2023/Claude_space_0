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
const DPR0 = Math.min(devicePixelRatio || 1, TOUCHY ? 1.5 : 2);
const QUAL = { lv: 0, acc: 0, n: 0, t: 0 };
const qualPick = () => SET.q == null || SET.q === 'auto' ? (SET.qa || 0) : SET.q;
function applyQual() {
  const lv = QUAL.lv = qualPick();
  RENDER.setPixelRatio(lv === 0 ? DPR0 : Math.min(DPR0, 1)); resize();
  if (OBJ.sun) OBJ.sun.castShadow = !!SET.shadows && lv < 2;
  if (typeof decoVis === 'function') decoVis();
}
const QNAME = ['高', '中', '低'];
const qualLabel = () => '画质：' + (SET.q == null || SET.q === 'auto' ? '自动（' + QNAME[qualPick()] + '）' : QNAME[SET.q]);
// auto: average frame time over 3 s of play; slower than ~30 fps steps down one level (never back up on its own)
function qualTick(dt) {
  if (!(SET.q == null || SET.q === 'auto') || QUAL.lv >= 2 || (DBG && !DBG.autoQ)) return;
  QUAL.t += dt; if (QUAL.t < 6) return; // skip the loading hitch at the start
  QUAL.acc += dt; QUAL.n++;
  if (QUAL.acc >= 3) { const avg = QUAL.acc / QUAL.n; QUAL.acc = 0; QUAL.n = 0;
    if (avg > 1 / 32) { SET.qa = Math.min(2, (SET.qa || 0) + 1); saveSet(); applyQual(); toast('画面有点卡，已自动调低画质（暂停菜单可改）', '#ffd27a'); } }
}
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
  cutBox(); return ML - 1; // auto: nothing is hidden globally; only buildings you're in, next to, or behind lose the floors above you (cutBox)
}
// auto view: inside a building, hide the floors above you in that building only — the rest of town keeps all its floors
// LCUT: the building you're inside (null outdoors). LCUTS: every building cut down to your floor — the one you're in,
// the ones right next to you (so you can see their doors and rooms) and any standing between the camera and you
let LCUT = null, LCUTS = [], LC_KEY = '';
let CUT_HOUSES = [];
function cutHousesInit() { CUT_HOUSES = TOWN_HOUSES.concat([[RADIO_XY[0] - 6, RADIO_XY[1] - 5, RADIO_XY[0] + 6, RADIO_XY[1] + 7, 3, 'camp']]); LC_KEY = ''; }
cutHousesInit();
const CUT_NEAR = 2.5;
function cutBox() {
  const me = W && W.p[ME]; if (!VIEW.auto || !me || me.gone) { LCUT = null; LCUTS = []; LC_KEY = ''; return null; }
  const t = me.dead ? (W.p.find(p => !p.dead && !p.gone) || me) : me;
  const k = W.ver + ':' + Math.floor(t.x) + ',' + Math.floor(t.y) + ',' + t.L + ':' + CAM.rot; if (LC_KEY === k) return LCUT; LC_KEY = k;
  const x = Math.floor(t.x), y = Math.floor(t.y), L = t.L, box = (H, m) => [H[0] - m, H[1] - m, H[2] + m, H[3] + m];
  LCUT = null; LCUTS = [];
  let hin = -1;
  if (covered(t)) {
    hin = CUT_HOUSES.findIndex(h => x >= h[0] - 2 && x <= h[2] + 2 && y >= h[1] - 2 && y <= h[3] + 2);
    LCUT = { L, b: hin >= 0 ? box(CUT_HOUSES[hin], 3) : [x - 10, y - 10, x + 10, y + 10], k: hin }; LCUTS.push(LCUT);
  }
  const yaw = camYawTarget(), ox = Math.sin(yaw), oy = Math.cos(yaw), lx = oy, ly = -ox, tp = Math.tan(CAM.pitch);
  CUT_HOUSES.forEach((H, hk) => {
    if (hk === hin || H[4] <= L) return; // nothing above you there
    const inR = (px, py, m) => px >= H[0] - m && px <= H[2] + 1 + m && py >= H[1] - m && py <= H[3] + 1 + m;
    let cut = inR(t.x, t.y, CUT_NEAR);
    // between the camera and you: walk from you toward the camera as far as that building's top could hide you
    const reach = (H[4] - L) * FH / tp + 1.5;
    for (let s = 0.5; !cut && s <= reach; s += 0.7) for (const o of [-1.3, 0, 1.3]) if (inR(t.x + ox * s + lx * o, t.y + oy * s + ly * o, 0)) { cut = true; break; }
    if (cut) LCUTS.push({ L, b: box(H, 3), k: hk });
  });
  return LCUT;
}
function lcHide(x, y, L) { for (const c of LCUTS) if (L > c.L && x >= c.b[0] && x <= c.b[2] && y >= c.b[1] && y <= c.b[3]) return true; return false; }
const lcCut = hk => LCUTS.some(c => c.k === hk);

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
  SCN.add(sun, sun.target); OBJ.sun = sun; applyQual();
  OBJ.lamps = []; for (let k = 0; k < 3; k++) { const L = new THREE.PointLight('#ffc27a', 0, 8, 1.5); SCN.add(L); OBJ.lamps.push(L); }
  OBJ.flash = []; for (let k = 0; k < 2; k++) { const L = new THREE.PointLight('#ffb050', 0, 6, 2); SCN.add(L); OBJ.flash.push(L); }
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
  I.trunk = inst(GEO.trunk, new THREE.MeshLambertMaterial({ color: '#4a3220', flatShading: true }), 7000);
  I.pine = GEO.pine.map((g, k) => inst(g, new THREE.MeshLambertMaterial({ color: ['#2e4a2c', '#35552f', '#3c5f35'][k], flatShading: true }), 7000));
  I.oak = inst(GEO.oak, lam('#ffffff'), 7000);
  I.rock = inst(GEO.rock, lam('#ffffff'), 3000);
  I.crate = inst(GEO.crate, lam('#4f5d3c'), 600); I.rubble = inst(GEO.rubble, lam('#6a625a'), 800); I.fence = inst(GEO.fence, lam('#6b5a48'), 1200);
  I.car = inst(GEO.carBody, lam('#ffffff'), 120); I.carW = inst(GEO.carWheels, lam('#151515'), 120);
  for (const m of [I.slab, I.ramp, I.rock, I.crate, I.rubble, I.fence, I.carW, I.lampP, I.bars]) m.castShadow = false; // flat / small: not worth a shadow pass
  archScene();
  // radio + bench
  const radio = new THREE.Group();
  const rb = new THREE.Mesh(boxG(0.7, 0.55, 0.5, 0, 0.28, 0), lam('#3a403b')); const rs = new THREE.Mesh(boxG(0.34, 0.16, 0.02, -0.1, 0.4, 0.26), new THREE.MeshBasicMaterial({ color: '#8fd38b' }));
  const ant = new THREE.Mesh(boxG(0.03, 0.9, 0.03, 0.25, 1.0, 0), lam('#9a9a9a')); OBJ.radioLed = new THREE.Mesh(boxG(0.08, 0.08, 0.08, 0.25, 1.46, 0), new THREE.MeshBasicMaterial({ color: '#ff3b2f' }));
  radio.add(rb, rs, ant, OBJ.radioLed); radio.traverse(m => { m.castShadow = true; }); SCN.add(radio); OBJ.radio = radio;
  const bench = new THREE.Group(); bench.add(new THREE.Mesh(boxG(1, 0.08, 0.5, 0, 0.5, 0), lam('#5b4026')), new THREE.Mesh(boxG(0.08, 0.46, 0.44, -0.44, 0.23, 0), lam('#3d2a18')), new THREE.Mesh(boxG(0.08, 0.46, 0.44, 0.44, 0.23, 0), lam('#3d2a18')), new THREE.Mesh(boxG(0.3, 0.14, 0.24, -0.2, 0.61, 0), lam('#6c7a84')), new THREE.Mesh(boxG(0.1, 0.22, 0.1, 0.25, 0.65, 0), lam('#b8c0c6')));
  bench.traverse(m => { m.castShadow = true; }); SCN.add(bench); OBJ.bench = bench;
  charScene(); propScene();
  // players
  OBJ.pl = [];
  // projectiles, particles, tracers
  OBJ.nade = inst(new THREE.IcosahedronGeometry(0.09, 0), lam('#3c4a32'), 40); OBJ.acid = inst(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: '#9dff3a' }), 60, false);
  OBJ.parts = inst(boxG(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 900, false);
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
const TCOL = { [TT.mud]: ['#4a3b2a', '#45372a', '#503f2c'], [TT.meadow]: ['#6a8440', '#64803c', '#708a44'], [TT.rocky]: ['#6e6c62', '#76736a', '#68665e'], [TT.grass]: ['#55733e', '#5a7843', '#50703a'], [TT.hill]: ['#4b663b', '#516c3e', '#476038'], [TT.dirt]: ['#6e5a42', '#74604a'], [TT.road]: ['#3c3d40', '#38393c'], [TT.sand]: ['#7d7356', '#857a5a'], [TT.forest]: ['#3f5a30', '#445f33', '#3b552d'], [TT.water]: ['#2b2723'] };
// per-map tints for trees and bushes
function applyMapLook() {
  const T = MAPDEF.trees || {}, I = OBJ.I; if (!I) return;
  ['#2e4a2c', '#35552f', '#3c5f35'].forEach((c, k) => I.pine[k].material.color.set((T.pine && T.pine[k]) || c));
  I.trunk.material.color.set(T.trunk || '#4a3220');
  if (typeof PROP !== 'undefined' && PROP[41]) PROP[41].col = MAPDEF.bush || '#3e5f2e';
}
function buildTerrain() {
  applyMapLook();
  // one merged mesh: column tops + only the exposed side faces (vertex colours, flat shading)
  const pos = [], col = [], c = new THREE.Color();
  const quad = (a, b2, c2, d, hex, k) => { c.set(hex).multiplyScalar(k); for (const v of [a, b2, c2, a, c2, d]) { pos.push(v[0], v[1], v[2]); col.push(c.r, c.g, c.b); } };
  const topOf = (x, y) => !inMap(x, y) ? -1.6 : ttAt(x, y) === TT.water ? -0.55 : gAt(x, y) * FH;
  const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString(), MG = (MAPDEF.tcol && MAPDEF.tcol[TT.grass]) || TCOL[TT.grass];
  const TC2 = Object.assign({}, TCOL, MAPDEF.tcol || {}); if (MAPDEF.tcol && MAPDEF.tcol[TT.grass]) for (const [t, tgt, k] of [[TT.mud, '#3e3020', 0.62], [TT.meadow, '#a6b84a', 0.28], [TT.rocky, '#85827a', 0.58]]) if (!MAPDEF.tcol[t]) TC2[t] = MG.map(c => mix(c, tgt, k));
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = ttAt(x, y), h = hash2(x, y), top = topOf(x, y);
    const cols = TC2[t] || TCOL[TT.grass], tc = t === TT.water ? '#4a4136' : cols[Math.floor(h * cols.length)];
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
  OBJ.terrain = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide })); OBJ.terrain.receiveShadow = true; OBJ.terrain.castShadow = false; SCN.add(OBJ.terrain);
  const I = OBJ.I; let w = 0, rp = 0;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (ttAt(x, y) === TT.water) setInst(I.water, w++, x + 0.5, -0.12, y + 0.5, 0, 1, 1, 1);
    for (let L = 0; L < ML; L++) { const i = ci(x, y, L); if (W.blk[i] === 28) setInst(I.ramp, rp++, x + 0.5, L * FH, y + 0.5, -W.bdir[i] * Math.PI / 2, 1, 1, 1); }
  }
  I.water.count = w; I.ramp.count = rp;
  buildDeco(MG, mix);
  for (const m of [I.water, I.ramp]) m.instanceMatrix.needsUpdate = true;
  OBJ.radio.visible = false;
  OBJ.bench.position.set(W.bench.x + 0.5, gAt(W.bench.x, W.bench.y) * FH, W.bench.y + 0.5);
  OBJ.grid.position.set(W.radio.x, 0, W.radio.y); OBJ.zone.position.set(W.radio.x, 0.03, W.radio.y);
  RC.ver = -1; buildMinimapBase();
}
// ground detail (static per world, not part of the per-rebuild pools): grass tufts, flowers in the meadows, puddles in the mud,
// pebbles on gravel. Hidden on the lowest quality.
function buildDeco(MG, mix) {
  const D = OBJ.deco = OBJ.deco || {};
  for (const k in D) { SCN.remove(D[k]); D[k].dispose(); delete D[k]; }
  if (!GEO.tuft) {
    const bl = []; for (let k = 0; k < 5; k++) { const a = k * 1.26, rr = 0.06 + (k % 2) * 0.05; bl.push(new THREE.ConeGeometry(0.04, 0.3 + (k % 3) * 0.08, 3, 1, true).rotateZ((k % 2 ? 0.25 : -0.2)).rotateY(a).translate(Math.cos(a) * rr, 0.15 + (k % 3) * 0.04, Math.sin(a) * rr)); }
    GEO.tuft = merge(bl);
    GEO.flower = merge([0, 1, 2].map(k => new THREE.TetrahedronGeometry(0.06, 0).translate(Math.cos(k * 2.1) * 0.12, 0.28 + k * 0.03, Math.sin(k * 2.1) * 0.12)));
    GEO.puddle = new THREE.CircleGeometry(0.36, 10).rotateX(-Math.PI / 2).translate(0, 0.015, 0);
    GEO.pebble = merge([new THREE.OctahedronGeometry(0.09, 0).scale(1, 0.6, 1.2).translate(-0.15, 0.04, 0.1), new THREE.TetrahedronGeometry(0.08, 0).translate(0.18, 0.03, -0.12)]);
  }
  const deco = MAPDEF.deco || {}, tuftC = deco.tuft || mix(MG[0], '#3f6a2a', 0.45), flC = deco.flower || ['#e8d24a', '#e86a5a', '#f2f2f2', '#b08ae0'];
  const L = { tuft: [], flower: [], puddle: [], pebble: [] };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = ttAt(x, y); if (t === TT.water || t === TT.road || inZone(x, y) || houseInterior(x, y)) continue;
    const g = gAt(x, y), b = W.blk[ci(x, y, g)]; if (b && B[b].B) continue;
    const h = hash2(x * 5 + 3, y * 11 + 7), h2 = hash2(x * 13 + 1, y * 3 + 5), Y = g * FH, X = x + 0.2 + h * 0.6, Z = y + 0.2 + h2 * 0.6;
    if (t === TT.meadow) { L.tuft.push([X, Y, Z, h * 6, 1 + h2 * 0.5]); if (h2 < 0.4) L.tuft.push([x + 1 - (X - x), Y, y + 1 - (Z - y), h2 * 6, 0.8 + h * 0.4]); if (h < 0.55) L.flower.push([X + 0.1, Y, Z - 0.1, h2 * 6, 1, flC[Math.floor(h2 * flC.length)]]); }
    else if (t === TT.grass || t === TT.hill) { if (h < (t === TT.grass ? 0.08 : 0.05)) L.tuft.push([X, Y, Z, h2 * 6, 0.7 + h2 * 0.4]); if (h > 0.985) L.flower.push([X, Y, Z, h * 6, 0.8, flC[Math.floor(h2 * flC.length)]]); }
    else if (t === TT.forest) { if (h < 0.06) L.tuft.push([X, Y, Z, h2 * 6, 0.8]); }
    else if (t === TT.mud) { if (h < 0.4) L.puddle.push([X, Y, Z, 0, 0.6 + h2 * 0.8]); }
    else if (t === TT.rocky || t === TT.dirt) { if (h < (t === TT.rocky ? 0.65 : 0.05)) L.pebble.push([X, Y, Z, h2 * 6, 0.8 + h * 0.6]); }
  }
  const mats = { tuft: lam('#ffffff'), flower: lam('#ffffff'), puddle: new THREE.MeshPhongMaterial({ color: '#4a5a66', transparent: true, opacity: 0.7, shininess: 90, specular: '#9ab0c0', depthWrite: false }), pebble: lam('#ffffff') };
  const CH = 40;
  for (const k in L) {
    const by = {}; L[k].forEach((q, n) => { const c = Math.floor(q[0] / CH) + ',' + Math.floor(q[2] / CH); (by[c] = by[c] || []).push([q, n]); });
    for (const c in by) {
      const arr = by[c], m = D[k + c] = inst(GEO[k], mats[k], arr.length, false); m.receiveShadow = k !== 'puddle';
      arr.forEach(([q, n], j) => setInst(m, j, q[0], q[1], q[2], q[3], q[4], k === 'puddle' ? 1 : q[4], q[4], q[5] || (k === 'tuft' ? (n % 3 ? tuftC : mix(tuftC, '#000000', 0.15)) : k === 'pebble' ? (n % 2 ? '#8a877e' : '#77746c') : null)));
      m.count = arr.length; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere(); m.frustumCulled = true; SCN.add(m);
    }
  }
  decoVis();
}
const decoVis = () => { if (OBJ.deco) for (const k in OBJ.deco) OBJ.deco[k].visible = QUAL.lv < 2; };
/* ---------- cell contents (rebuilt when the map, view layer, camera or player cell changes) ---------- */
const RC = { ver: -1, key: '', lamps: [] };
const dmgTint = (hex, f) => { tmpC.set(hex); const k = 0.45 + 0.55 * clamp(f, 0, 1); return '#' + tmpC.multiplyScalar(k).getHexString(); };
function wallAxis(x, y, L) { const solid = (xx, yy) => { const b = blkAt(xx, yy, L); return b && (B[b].P || B[b].Z) && !B[b].nat || b === 24 || b === 50; }; return (solid(x - 1, y) || solid(x + 1, y)) && !(solid(x, y - 1) || solid(x, y + 1)) ? 0 : (solid(x, y - 1) || solid(x, y + 1)) ? 1 : 0; }
function cullR() { return Math.min(MW, CAM.zoom * Math.max(1, VW / Math.max(1, VH)) * 1.6 + 8); }
function rebuildCells() {
  const I = OBJ.I, me = W.p[ME], vl = viewL(), [ox, oy] = [Math.sin(CAM.yaw), Math.cos(CAM.yaw)];
  const c = { wall: 0, slab: 0, stairs: 0, door: 0, bars: 0, wire: 0, lamp: 0, trunk: 0, pine: 0, oak: 0, rock: 0, crate: 0, rubble: 0, fence: 0, car: 0 };
  const lamps = []; archBegin(); propBegin();
  if (RC.topVer !== W.ver) { RC.topVer = W.ver; RC.topL = 0; for (let i = NC - 1; i >= 0; i--) if (W.blk[i] || W.slab[i]) { RC.topL = cl_(i); break; } }
  // only the part of the map the camera can see (plus a margin) is put into the instance buffers
  const CR = cullR(), cx0 = Math.max(0, Math.floor(CAM.tx - CR)), cx1 = Math.min(MW - 1, Math.ceil(CAM.tx + CR)), cy0 = Math.max(0, Math.floor(CAM.ty - CR)), cy1 = Math.min(MH - 1, Math.ceil(CAM.ty + CR));
  for (let L = 0; L <= RC.topL; L++) for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) {
    const i = ci(x, y, L), b = W.blk[i], s = W.slab[i];
    if (!b && !s) continue;
    if ((b && !B[b]) || (s && !B[s])) continue;
    const X = x + 0.5, Y = L * FH, Z = y + 0.5, h = hash2(x * 3 + L, y * 7);
    const hide = (L > vl && !(b && B[b].nat)) || (lcHide(x, y, L) && b !== 20 && b !== 21 && b !== 22);
    if (hide) continue;
    // inside a town building, anything under a floor that is drawn can't be seen: skip it (big saving on tall blocks)
    if (L + 1 < ML && L + 1 <= vl && W.slab[i + MW * MH] && !lcHide(x, y, L + 1) && houseInterior(x, y)) continue;
    if (s && !archSlab(s, i, x, y, L, X, Y, Z)) { setInst(I.slab, c.slab++, X, Y, Z, 0, 1, 1, 1, dmgTint(B[s].col, s === SLAB_BRIDGE ? 1 : W.shp[i] / B[s].hp)); }
    if (!b || b === 20 || b === 23 || b === 28 || b === 30 || b === 31) continue;
    let cut = 1;
    // anything solid between the camera and you (your floor and up) is cut down, town ruins included
    const fdx = me ? X - me.x : 0, fdy = me ? Z - me.y : 0, fwd = fdx * ox + fdy * oy, lat = Math.abs(fdx * oy - fdy * ox);
    const inFront = me && !me.dead && L >= me.L && fwd > 0.2 && fwd < 5 + (L - me.L) * 1.5 && lat < 2.4 + fwd * 0.45;
    if (inFront && (B[b].P || B[b].Z) && (!B[b].nat || b === 24)) cut = 0.3;
    switch (b) {
      case 1: case 2: case 3: case 24: case 50: archWall(b, i, x, y, L, X, Y, Z, h, cut, vl); break;
      case 6: {
        propPut(6, i, x, y, L, X, Y, Z, h);
        // railings around the opening above, on every side you could walk up to except the top step
        if (L + 1 < ML && L + 1 <= vl && !lcHide(x, y, L + 1)) for (let k = 0; k < 4; k++) {
          if (k === W.bdir[i]) continue; const [ex, ey] = DIRS[k], nx = x + ex, ny = y + ey;
          if (inMap(nx, ny) && support(nx, ny, L + 1) && !W.blk[ci(nx, ny, L + 1)]) archPut('rail', X, Y + FH, Z, Math.atan2(-ex, -ey), 1, 1, 1);
        }
        break;
      }
      case 7: { const ax = wallAxis(x, y, L) ? Math.PI / 2 : 0, f = W.bhp[i] / B[b].hp; archPut('doorF', X, Y, Z, ax, 1, cut, 1, dmgTint('#ffffff', f)); archPut('doorL', X, Y, Z, ax, 1, cut, 1, dmgTint('#ffffff', f)); break; }
      case 8: { const ax = wallAxis(x, y, L) ? Math.PI / 2 : 0, f = W.bhp[i] / B[b].hp; archPut('sand', X, Y, Z, ax, 1, Math.max(cut, 0.6), 1, dmgTint('#ffffff', f)); if (cut === 1) archPut('bars', X, Y, Z, ax, 1, 1, 1, dmgTint('#ffffff', f)); break; }
      case 9: { const wa = blkAt(x - 1, y, L) === 9 || blkAt(x + 1, y, L) === 9 ? 0 : Math.PI / 2; setInst(I.wire, c.wire++, X, Y, Z, wa, 1, 1, 1); archPut('wireP', X, Y, Z, wa, 1, 1, 1); break; }
      case 10: setInst(I.lampP, c.lamp, X - 0.2, Y, Z - 0.2, 0, 1, 1, 1); setInst(I.lampH, c.lamp++, X - 0.2, Y, Z - 0.2, 0, 1, 1, 1); lamps.push([X + 0.05, Y + 0.75, Z - 0.2]); break;
      case 22: { const sc = 0.8 + h * 0.5, rot = h * 6; if (inFront && fwd < 3.5 && lat < 1.8) { setInst(I.trunk, c.trunk++, X, Y, Z, rot, sc, sc * 0.35, sc); break; } setInst(I.trunk, c.trunk++, X, Y, Z, rot, sc, sc, sc); if (h < 0.6) for (let k = 0; k < 3; k++) setInst(I.pine[k], c.pine + 0, X, Y, Z, rot + k, sc, sc, sc); if (h < 0.6) c.pine++; else setInst(I.oak, c.oak++, X, Y, Z, rot, sc, sc, sc, MAPDEF.trees ? MAPDEF.trees.oak[h < 0.8 ? 0 : 1] : h < 0.8 ? '#4f6a33' : '#5b7339'); break; }
      case 21: setInst(I.rock, c.rock++, X, Y, Z, h * 6, 0.8 + h * 0.6, 0.7 + h * 0.6, 0.8 + h * 0.5, h < 0.5 ? '#78746c' : '#6c6862'); break;
      case 26: setInst(I.crate, c.crate++, X, Y, Z, h * 2, 1, 1, 1); break;
      case 29: setInst(I.rubble, c.rubble++, X, Y, Z, h * 6, 1, 1, 1); break;
      case 27: setInst(I.fence, c.fence++, X, Y, Z, wallAxis(x, y, L) ? 0 : Math.PI / 2, 1, 1, 1); break;
      case 25: { const rot = -W.bdir[i] * Math.PI / 2 + (h - 0.5) * 0.3; const col = W.srch.has(i) ? '#3a3633' : ['#7a3b2a', '#3c5a6e', '#6b6b5a', '#5a4a6a'][Math.floor(h * 4)]; setInst(I.car, c.car, X, Y, Z, rot, 1, 1, 1, col); setInst(I.carW, c.car++, X, Y, Z, rot, 1, 1, 1); break; }
      default: propPut(b, i, x, y, L, X, Y, Z, h);
    }
  }
  I.wall.count = c.wall; I.slab.count = c.slab; I.stairs.count = c.stairs; I.doorF.count = I.doorL.count = c.door; I.bars.count = c.bars; I.wire.count = c.wire;
  I.lampP.count = I.lampH.count = c.lamp; I.trunk.count = c.trunk; for (const m of I.pine) m.count = c.pine; I.oak.count = c.oak; I.rock.count = c.rock;
  I.crate.count = c.crate; I.rubble.count = c.rubble; I.fence.count = c.fence; I.car.count = I.carW.count = c.car;
  for (const k in I) { const arr = Array.isArray(I[k]) ? I[k] : [I[k]]; for (const m of arr) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } }
  propEnd(); archEnd(); RC.lamps = lamps;
}

/* ---------- effects ---------- */
const RND = { parts: [], tracers: [], corpses: [], floats: [], flashes: [], booms: [], decals: [], hurtV: 0 };
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
  for (const p of W.p) { if (p.recoilT > 0) p.recoilT -= dt; if (p.shoveT > 0) p.shoveT -= dt; if (p.knT > 0) p.knT -= dt; }
}
function drawFx() {
  const P = OBJ.parts; let n = 0;
  for (const q of RND.parts) { const a = 1 - q.t / q.life, s = q.smoke ? q.s * (1 + q.t * 1.5) * a : q.s; setInst(P, n, q.x, q.z, q.y, q.t * 5, s, s, s, q.col); n++; }
  P.count = n; P.instanceMatrix.needsUpdate = true; if (P.instanceColor) P.instanceColor.needsUpdate = true;
  drawTracers();
  let f = 0; for (const fl of RND.flashes) { if (f >= 8) break; const s = (fl.big ? 1.6 : 1) * (1 - fl.t / fl.life); setInst(OBJ.flashM, f++, fl.x, fl.z, fl.y, 0, s, s, s); } OBJ.flashM.count = f; OBJ.flashM.instanceMatrix.needsUpdate = true;
  let b = 0; for (const bo of RND.booms) { if (b >= 8) break; const s = (bo.r || BAL.nadeR) * (0.3 + bo.t * 1.4); setInst(OBJ.boom, b++, bo.x, bo.z, bo.y, 0, s, s, s); } OBJ.boom.count = b; OBJ.boom.instanceMatrix.needsUpdate = true; OBJ.boom.material.opacity = RND.booms.length ? 0.55 * (1 - RND.booms[0].t / 0.6) : 0;
  let ng = 0, na = 0; for (const p of W.proj) { if (p.k === 'gl') { setInst(OBJ.nade, ng++, p.x, p.z, p.y, W.t * 12, 1.3, 1.3, 1.3); if (Math.random() < 0.5) addP({ x: p.x, y: p.y, z: p.z, vz: 0.2, g: -0.2, col: '#9a948a', s: 0.07, life: 0.4, smoke: 1 }); } else if (p.k === 'nade') setInst(OBJ.nade, ng++, p.x, p.z, p.y, W.t * 8, 1, 1, 1); else setInst(OBJ.acid, na++, p.x, p.z, p.y, 0, 1, 1, 1); }
  OBJ.nade.count = ng; OBJ.acid.count = na; OBJ.nade.instanceMatrix.needsUpdate = OBJ.acid.instanceMatrix.needsUpdate = true;
  // flashes + explosions light pool
  const srcs = RND.flashes.map(fl => [fl.x, fl.z, fl.y, (fl.big ? 6 : 4) * (1 - fl.t / fl.life), 5]).concat(RND.booms.map(bo => [bo.x, bo.z + 0.6, bo.y, 40 * (1 - bo.t / 0.6), 12])).sort((a, b) => b[3] - a[3]);
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
  let sky = C3('#9fb1c4', '#1a2440', dk); // (round 23) nights brighter: moonlit, not pitch black sky.lerp(new THREE.Color('#d98a5a'), dusk * 0.35); if (blood) sky = new THREE.Color('#2a070b');
  SCN.background = sky;
  OBJ.hemi.intensity = lerp(1.15, 1.0, dk); OBJ.hemi.color.copy(C3('#d6e2ff', blood ? '#b05a62' : '#7f93c8', dk)); OBJ.hemi.groundColor.copy(C3('#4a3c2a', '#2c2834', dk));
  OBJ.sun.intensity = lerp(2.3, 1.35, dk); OBJ.sun.color.copy(C3('#fff0d8', blood ? '#ff8a7a' : '#b8c8ff', dk)).lerp(new THREE.Color('#ff9a5a'), dusk * 0.5);
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
}

/* ---------- camera ---------- */
function updateCamera(dt) {
  const me = W.p[ME];
  let fx = W.radio.x + 0.5, fy = W.radio.y + 0.5, fz = 0;
  if (me && !me.gone) { const t = me.dead ? (W.p.find(p => !p.dead && !p.gone) || me) : me; fx = t.rx != null ? t.rx : t.x; fy = t.ry != null ? t.ry : t.y; fz = t.zv != null ? t.zv : t.z; }
  if (W.demo) { fx = W.radio.x + 0.5 + Math.sin(W.t * 0.08) * 6; fy = W.radio.y + 3 + Math.cos(W.t * 0.06) * 4; fz = 0; }
  const k = Math.min(1, dt * 6);
  CAM.tx = lerp(CAM.tx, fx + (CAM.lookX || 0), k); CAM.ty = lerp(CAM.ty, fy + (CAM.lookY || 0), k); CAM.tz = lerp(CAM.tz, fz, k);
  // own shots nudge the view back along the aim and it springs back
  CAM.kx = (CAM.kx || 0) * Math.max(0, 1 - dt * 10); CAM.ky = (CAM.ky || 0) * Math.max(0, 1 - dt * 10); CAM.tx += CAM.kx * dt * 12; CAM.ty += CAM.ky * dt * 12;
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
function aimPick(sx, sy, mag) {
  const { o, d } = screenRay(sx, sy), vl = viewL();
  let best = null, bd = 1e9;
  for (const z of W.zs) { if (z.L > vl || lcHide(Math.floor(z.x), Math.floor(z.y), z.L)) continue; const t = rayBox(o[0], o[1], o[2], d[0], d[1], d[2], z.x - z.r - 0.15, z.y - z.r - 0.15, z.z, z.r * 2 + 0.3, z.r * 2 + 0.3, z.h, 400); if (t >= 0 && t < bd) { bd = t; best = z; } }
  // cursor on a zombie: aim at the height you point at — over its head (the top of the silhouette) is a headshot
  if (best) { const hz = clamp(o[2] + d[2] * bd, best.z + best.h * 0.35, best.z + best.h * 0.9); return { x: best.x, y: best.y, z: hz, zb: best, head: hz > best.z + best.h * 0.76 }; }
  // near miss: a zombie within ~34 px of the cursor on screen pulls the aim onto its body
  let mb = null, md = mag != null ? mag : assistLv().mag ? 34 : 0;
  for (const z of W.zs) { if (z.L > vl || z.hp <= 0 || lcHide(Math.floor(z.x), Math.floor(z.y), z.L)) continue; const [px, py, pz] = w2s(z.x, z.y, z.z + z.h * 0.55); if (pz > 1) continue; const dd = Math.hypot(px - sx, py - sy); if (dd < md) { md = dd; mb = z; } }
  if (mb) return { x: mb.x, y: mb.y, z: mb.z + mb.h * 0.6, zb: mb, mag: 1 };
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
  OBJ.grid.visible = !!(me && me.build) && !modeDef().anyBuild; if (OBJ.grid.visible) OBJ.grid.position.y = (H ? H.L : buildL()) * FH + 0.02;
  G.visible = E.visible = !!show; if (!show) return;
  const b = me.demo ? 0 : me.sel, geo = me.demo ? GEO.wall : B[b].slab ? GEO.slab : b === 6 ? GEO.stairs : b === 8 ? GEO.bars : b === 9 ? GEO.wire : b === 10 ? GEO.lampPole : GEO.wall;
  if (G.geometry !== geo) G.geometry = geo;
  G.position.set(H.x + 0.5, H.L * FH + (B[b] && B[b].slab ? 0.0 : 0), H.y + 0.5); G.rotation.y = b === 6 ? -me.sdir * Math.PI / 2 : 0;
  G.material.color.set(me.demo ? '#ff5a4a' : H.ok ? '#7dff8a' : '#ff5a4a');
  E.position.set(H.x + 0.5, H.L * FH, H.y + 0.5); E.material.color.set(me.demo ? '#ff8a7a' : H.ok ? '#ffffff' : '#ffb0a0');
}

// (round 23) grenade landing ring while aiming one (blast radius, flat on the ground)
function drawNadeMark() {
  let M = OBJ.nadeMark;
  if (!M) {
    M = OBJ.nadeMark = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.85, depthTest: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(BAL.nadeR - 0.14, BAL.nadeR, 48), mat); ring.rotation.x = -Math.PI / 2;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), mat); dot.rotation.x = -Math.PI / 2;
    const fill = new THREE.Mesh(new THREE.CircleGeometry(BAL.nadeR, 48), new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.16, depthTest: false })); fill.rotation.x = -Math.PI / 2;
    M.add(fill, ring, dot); M.renderOrder = 999; M.children.forEach(c => c.renderOrder = 999); SCN.add(M);
  }
  const pt = INP.nadePt; M.visible = !!pt && STATE.mode === 'play'; if (!pt) return;
  const z = pt.z != null ? pt.z : surfZ(pt.x, pt.y, gAt(Math.floor(pt.x), Math.floor(pt.y))); M.position.set(pt.x, z + 0.06, pt.y);
}
// (round 24) grenade clouds: a bluish sticky puddle (slow) or a grey smoke ball (smoke)
// (round 28) the patch each trap covers, tinted on the floor (wire grey, bear traps amber, mines red)
const TRAPCOL = { 9: '#c8ced4', 15: '#e09a4a', 51: '#e0583a' };
function drawTrapAreas(vl) {
  if (!OBJ.trapA) { OBJ.trapA = inst(boxG(0.9, 0.012, 0.9), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false }), 900, false); OBJ.trapA.receiveShadow = false; }
  const T = OBJ.trapA; let n = 0; scanCells();
  for (const j of W.trapCells || []) {
    if (n >= 900) break; const t = W.trapAt[j]; if (t < 0) continue; const L = cl_(j); if (L > vl) continue;
    const x = cx_(j) + 0.5, y = cy_(j) + 0.5; setInst(T, n++, x, surfZ(x, y, L) + 0.02, y, 0, 1, 1, 1, TRAPCOL[W.blk[t]] || '#ffffff');
  }
  T.count = n; T.instanceMatrix.needsUpdate = true; if (T.instanceColor) T.instanceColor.needsUpdate = true;
}
function drawClouds() {
  let C = OBJ.clouds;
  if (!C) {
    C = OBJ.clouds = []; const disc = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), ring = new THREE.RingGeometry(0.93, 1, 40).rotateX(-Math.PI / 2), puff = new THREE.SphereGeometry(1, 10, 8);
    for (let k = 0; k < 6; k++) {
      const g = new THREE.Group(), sm = new THREE.MeshBasicMaterial({ color: '#5fb6d8', transparent: true, opacity: 0.35, depthWrite: false }), rm = new THREE.MeshBasicMaterial({ color: '#9fe6ff', transparent: true, opacity: 0.7, depthWrite: false });
      const pm = new THREE.MeshLambertMaterial({ color: '#b8bcc4', transparent: true, opacity: 0.6, depthWrite: false });
      const d = new THREE.Mesh(disc, sm), r = new THREE.Mesh(ring, rm), puffs = []; g.add(d, r);
      for (let j = 0; j < 9; j++) { const m = new THREE.Mesh(puff, pm); g.add(m); puffs.push(m); }
      g.visible = false; SCN.add(g); C.push({ g, d, r, puffs, pm, sm });
    }
  }
  const list = W.cz || []; let n = 0;
  for (const c of list) {
    if (n >= C.length) break; const o = C[n++], fade = clamp(c.t / 1.5, 0, 1); o.g.visible = true; o.g.position.set(c.x, c.z + 0.04, c.y);
    const slow = c.k === 1; o.d.visible = o.r.visible = slow; o.d.scale.set(c.r, 1, c.r); o.r.scale.set(c.r, 1, c.r); o.sm.opacity = 0.35 * fade;
    o.puffs.forEach((m, j) => { m.visible = !slow; if (slow) return; const a = j / 9 * Math.PI * 2 + W.t * 0.15, rr = j === 8 ? 0 : c.r * 0.55; m.position.set(Math.cos(a) * rr, 0.9 + (j % 3) * 0.35 + Math.sin(W.t + j) * 0.08, Math.sin(a) * rr); const sc = c.r * (j === 8 ? 0.62 : 0.48); m.scale.set(sc, sc * 0.8, sc); });
    o.pm.opacity = 0.62 * fade;
  }
  for (let k = n; k < C.length; k++) C[k].g.visible = false;
}
// (round 23) brute tells on the ground: a red lane before a charge, a red ring before a slam
function drawTells() {
  let T = OBJ.tells;
  if (!T) {
    T = OBJ.tells = []; const lm = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.4, depthTest: false }), rm = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.55, depthTest: false });
    const lane = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0).rotateX(-Math.PI / 2), ring = new THREE.RingGeometry(BAL.slamR - 0.2, BAL.slamR, 40).rotateX(-Math.PI / 2), disc = new THREE.CircleGeometry(BAL.slamR, 40).rotateX(-Math.PI / 2);
    for (let k = 0; k < 6; k++) { const g = new THREE.Group(), l = new THREE.Mesh(lane, lm), r = new THREE.Mesh(ring, rm), d = new THREE.Mesh(disc, lm); g.add(l, r, d); g.children.forEach(c => c.renderOrder = 998); g.visible = false; SCN.add(g); T.push({ g, l, r, d }); }
  }
  let n = 0; const pulse = 0.35 + 0.25 * Math.sin(performance.now() / 70);
  for (const z of W.zs) {
    if (n >= T.length) break; if (!z.tl || z.hp <= 0) continue; const t = T[n++], zz = (z.zv != null ? z.zv : z.z) + 0.07;
    t.g.visible = true; t.g.position.set(z.x, zz, z.y); t.l.visible = z.tl !== 3; t.r.visible = t.d.visible = z.tl === 3;
    if (z.tl !== 3) { t.l.rotation.y = -z.face; t.l.scale.set(z.tl === 1 ? BAL.chgSpd * BAL.chgTime : 3, 1, 1.0); }
    t.l.material.opacity = pulse;
  }
  for (let k = n; k < T.length; k++) T[k].g.visible = false;
}
/* ---------- main draw ---------- */
let CUT_KEY = '';
function draw(dt) {
  if (!W || !OBJ.I) return;
  stepFx(dt);
  updateCamera(dt);
  const me = W.p[ME], vl = viewL();
  const key = W.ver + ':' + vl + ':' + CAM.rot + ':' + (me ? Math.floor(me.x) + ',' + Math.floor(me.y) + ',' + me.L : '') + ':' + Math.floor(CAM.tx / 6) + ',' + Math.floor(CAM.ty / 6) + ':' + Math.round(cullR() / 4) + ':' + LC_KEY + ':' + (W.mode === 'nests' || W.mode === 'towers' ? W.obv : 0);
  if (key !== CUT_KEY) { CUT_KEY = key; rebuildCells(); }
  if (STATE.mode === 'play' && !W.demo) qualTick(dt);
  applyTime(darkness()); archFrame();
  drawZombies(vl, dt); drawPlayers(vl, dt); drawFx(); drawGhost(me); drawPlan(); drawNadeMark(); drawTells(); drawClouds(); drawTrapAreas(vl);
  OBJ.zone.visible = (!W.demo && W.phase === 'day' || !!(me && me.build)) && !modeDef().anyBuild;
  RENDER.render(SCN, CAMO);
  drawOverlay();
}
// DOM overlay: floating loot text, teammate tag, off-screen markers
const OV = document.getElementById('ov');
function drawOverlay() {
  if (!OV) return;
  let html = '';
  for (const f of RND.floats) { const [sx, sy] = w2s(f.x, f.y, f.z); html += `<div class="fl" style="left:${sx | 0}px;top:${sy | 0}px;opacity:${clamp(2.2 - f.t, 0, 1).toFixed(2)};color:${f.col}">${f.text}</div>`; }
  // 尸城求生: sleepers show a "z", a growing "?" while they're noticing you, a "!" as they wake
  if (isSiege()) {
    const me = W.p[ME], CR = Math.min(cullR(), 16), gst = NETROLE === 'guest';
    for (const z of W.zs) {
      if (z.hp <= 0 || z.hidden || Math.abs(z.x - CAM.tx) > CR || Math.abs(z.y - CAM.ty) > CR || z.L > me.L + 1 || lcHide(Math.floor(z.x), Math.floor(z.y), z.L)) continue;
      const sl = gst ? z.sleepF : z.sleep; if (z._ws && !sl) z.wokeT = W.t; z._ws = sl;
      const aw = gst ? (z.awF ? 0.6 : 0) : (z.aw || 0); let t = '', c = '', fs = 14;
      if (sl) { if (aw > 0.15) { t = '?'; c = aw > 0.6 ? '#ff8a3a' : '#ffd65a'; fs = 14 + aw * 12; } else if (Math.hypot(z.x - me.x, z.y - me.y) < 11) { t = 'z'; c = '#cfe0f0'; fs = 16; } }
      else if (z.wokeT && W.t - z.wokeT < 1.2) { t = '!'; c = '#ff4a3a'; fs = 20; }
      if (!t) continue;
      const [sx, sy] = w2s(z.x, z.y, z.z + (ZT[z.k].h || 1.4) * (ZT[z.k].sc || 1) + 0.3);
      html += `<div class="zmk" style="left:${sx | 0}px;top:${sy | 0}px;color:${c};font-size:${fs | 0}px">${t}</div>`;
    }
  }
  for (const p of W.p) {
    if (p.i === ME || p.gone || W.p.length < 2) continue;
    const [sx, sy] = w2s(p.x, p.y, (p.zv != null ? p.zv : p.z) + 1.35);
    const on = sx > 10 && sx < VW - 10 && sy > 10 && sy < VH - 10;
    if (on) html += `<div class="tag" style="left:${sx | 0}px;top:${sy | 0}px"><span>${p.dead ? '✝ ' : ''}${p.name}${p.dead ? ' · ' + Math.ceil(p.downT) + 's' + (W.p[ME].meds > 0 ? ' · 医疗包救' : '') : ''}${p.L !== W.p[ME].L ? ' · ' + (p.L + 1) + 'F' : ''}</span><i style="width:${(p.down ? 0 : p.hp / p.maxHp * 100) | 0}%;background:${PCOL[p.i % 2].j}"></i></div>`;
    else { const ax = clamp(sx, 26, VW - 26), ay = clamp(sy, 80, VH - 80); const an = Math.atan2(sy - ay, sx - ax); html += `<div class="arr" style="left:${ax | 0}px;top:${ay | 0}px;transform:translate(-50%,-50%) rotate(${an}rad);color:${p.down ? '#ff5a4a' : PCOL[p.i % 2].j}">➤</div>`; }
  }
  // objectives: a label over the ones on screen, an arrow at the edge for the rest (the three nearest)
  const me = W.p[ME];
  let KO = null;
  if (INP.touch) { if (!UI.koT || performance.now() - UI.koT > 500) { UI.koT = performance.now(); let l = 1e9, t = 1e9, r = -1e9, bt = -1e9; document.querySelectorAll('#tctl > *').forEach(e => { if (e.offsetParent === null) return; const q = e.getBoundingClientRect(); if (!q.width) return; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); bt = Math.max(bt, q.bottom); }); UI.ko = l < 1e9 ? [l - 50, t - 30, r + 10, bt + 10] : null; } KO = UI.ko; }
  if (me && !W.demo) { const used = []; let arrows = 0;
    for (const m of modeMarks().filter(m => m.a).map(m => Object.assign({}, m, { d: Math.hypot(m.x - me.x, m.y - me.y) })).sort((a, b) => a.d - b.d).slice(0, 4)) {
      const [sx, sy] = w2s(m.x, m.y, gAt(Math.floor(m.x), Math.floor(m.y)) * FH + 1.8), on = sx > 30 && sx < VW - 30 && sy > 70 && sy < VH - 70;
      if (on) { if (m.d > 3.5) html += `<div class="om" style="left:${sx | 0}px;top:${sy | 0}px;color:${m.c}">${m.n}<br>${Math.round(m.d)} 米</div>`; continue; }
      if (arrows >= 2) continue;
      let ax = clamp(sx, 56, VW - 56), ay = clamp(sy, 110, VH - 110); const an = Math.atan2(sy - ay, sx - ax);
      if (KO && ax > KO[0] && ax < KO[2] && ay > KO[1] && ay < KO[3]) { if (KO[1] - 34 > 110) ay = KO[1] - 34; else ax = KO[0] - 30; } // not on top of the buttons
      if (INP.touch && ax < 230 && ay > VH - 230) ay = VH - 230;                                                             // nor on the move stick
      for (const [ux, uy] of used) if (Math.abs(ux - ax) < 90 && Math.abs(uy - ay) < 40) ay += ay > VH / 2 ? -44 : 44; // don't stack labels
      used.push([ax, ay]); arrows++;
      html += `<div class="oa" style="left:${ax | 0}px;top:${ay | 0}px;color:${m.c}"><i style="transform:rotate(${an}rad)">➤</i>${m.n} ${Math.round(m.d)} 米</div>`;
    } }
  OV.innerHTML = html;
}

/* ---------- minimap ---------- */
// (round 31) a player marker you can spot at a glance: an arrow pointing where they aim, thick dark + white outline, your own with a pulsing white halo;
// teammates in their colour; a fallen teammate is a grey cross
function playerMark(g, x, y, ang, p, mine, k) {
  const s = (mine ? 7 : 6.2) * k, col = PCOL[p.i % 2].j;
  if (p.dead) { g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineWidth = 4 * k; g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke(); g.strokeStyle = '#c8ccd0'; g.lineWidth = 2 * k; g.stroke(); return; }
  if (mine) { const pu = 0.5 + 0.5 * Math.sin(performance.now() / 260); g.fillStyle = 'rgba(255,255,255,' + (0.18 + 0.2 * pu) + ')'; g.beginPath(); g.arc(x, y, s * (1.9 + 0.5 * pu), 0, 7); g.fill(); }
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.moveTo(s * 1.45, 0); g.lineTo(-s * 0.85, s * 0.95); g.lineTo(-s * 0.35, 0); g.lineTo(-s * 0.85, -s * 0.95); g.closePath();
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.9)'; g.lineWidth = 4 * k; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2 * k; g.stroke(); g.fillStyle = mine ? '#ffffff' : col; g.fill();
  if (mine) { g.fillStyle = col; g.beginPath(); g.arc(0, 0, s * 0.42, 0, 7); g.fill(); }
  g.restore();
}
const MM = { base: null, t: 0 };
function buildMinimapBase() {
  const c = document.createElement('canvas'); c.width = MW; c.height = MH; const g = c.getContext('2d');
  const MC = { [TT.grass]: '#55733e', [TT.hill]: '#7a8a5a', [TT.dirt]: '#6e5a42', [TT.road]: '#3c3d40', [TT.sand]: '#8a7f5a', [TT.forest]: '#3c5530', [TT.water]: '#2a6a86', [TT.mud]: '#4a3b2a', [TT.meadow]: '#6a8440', [TT.rocky]: '#6e6c62' };
  if (MAPDEF.mc) Object.assign(MC, MAPDEF.mc);
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
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { for (let L = gAt(x, y); L < Math.min(ML, gAt(x, y) + 3); L++) { const b = W.blk[ci(x, y, L)]; if ((b && B[b].cost) || b === 24 || b === 50) { g.fillRect(x * S, y * S, S, S); break; } if (b === 22) { g.fillStyle = '#25381f'; g.fillRect(x * S, y * S, S, S); g.fillStyle = 'rgba(30,30,34,.85)'; break; } } }
  if (!modeDef().anyBuild) g.strokeStyle = 'rgba(255,207,107,.6)', g.lineWidth = 1, g.strokeRect((W.radio.x - BUILD_R) * S, (W.radio.y - BUILD_R) * S, (BUILD_R * 2 + 1) * S, (BUILD_R * 2 + 1) * S);
  g.fillStyle = '#a8261f'; for (const z of W.zs) g.fillRect(z.x * S - 1, z.y * S - 1, 2, 2); // (round 31) zombies smaller and darker, so the players stand out
  g.fillStyle = '#7fd36b'; g.fillRect(W.radio.x * S - 1, W.radio.y * S - 1, S + 2, S + 2);
  g.restore();
  const R = CAM.yaw, cx = cv.width / 2, cy = cv.height / 2, rot = (x, y) => { const dx = x * S - cx, dy = y * S - cy; return [cx + dx * Math.cos(R) - dy * Math.sin(R), cy + dx * Math.sin(R) + dy * Math.cos(R)]; };
  for (const p of W.p) if (p.i !== ME && !p.gone) { const [px, py] = rot(p.x, p.y); playerMark(g, px, py, p.aim + R, p, false, 0.75); }
  const me = W.p[ME]; if (me && !me.gone) { const [px, py] = rot(me.x, me.y); playerMark(g, px, py, me.aim + R, me, true, 0.75); }
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
    case 'cshot': { RND.tracers.push({ x: e.x, y: e.y, z: e.z, x2: e.e[0], y2: e.e[1], z2: e.e[2], t: 0, life: 0.12, w: 0.09, col: [1, 0.7, 0.35] }); RND.flashes.push({ x: e.x, y: e.y, z: e.z, t: 0, life: 0.08 }); sfx('sniper', e.x, e.y); const q = W.p[e.o]; if (q) q._crec = 1; for (let k = 0; k < 6; k++) addP({ x: e.x, y: e.y, z: e.z, vx: frnd(-0.6, 0.6), vy: frnd(-0.6, 0.6), vz: frnd(0.2, 0.8), g: -0.3, col: '#8d8a84', s: 0.1, life: 0.8, smoke: 1 }); break; } // (round 31) tank cannon
    case 'gshot': RND.tracers.push({ x: e.x, y: e.y, z: e.z, x2: e.e[0], y2: e.e[1], z2: e.e[2], t: 0, life: 0.07, w: 0.03, col: [1, 0.8, 0.4] }); RND.flashes.push({ x: e.x, y: e.y, z: e.z, t: 0, life: 0.04 }); if (thr('gyro', 0.1)) sfx('rifle', e.x, e.y); if (e.h) addP({ x: e.e[0], y: e.e[1], z: e.e[2], vx: frnd(-1, 1), vy: frnd(-1, 1), vz: 1, col: '#7a1010', s: 0.06, life: 0.4 }); break; // (round 30) gyrocopter chin gun
    case 'tshot': { if (e.i != null) (RND.taim = RND.taim || {})[e.i] = Math.atan2(e.ty - e.y, e.tx - e.x);
      const a = Math.atan2(e.ty - e.y, e.tx - e.x), d = Math.hypot(e.tx - e.x, e.ty - e.y);
      if (e.w === 'shot') { for (let k = 0; k < 6; k++) { const q = a + (k / 5 - 0.5) * 0.8, L = Math.min(5, d + 0.6); RND.tracers.push({ x: e.x, y: e.y, z: e.z, x2: e.x + Math.cos(q) * L, y2: e.y + Math.sin(q) * L, z2: e.tz, t: 0, life: 0.07, w: 0.03, col: [1, 0.75, 0.4] }); } sfx('shotgun', e.x, e.y); }
      else if (e.w === 'frost') { RND.tracers.push({ x: e.x, y: e.y, z: e.z, x2: e.tx, y2: e.ty, z2: e.tz, t: 0, life: 0.25, w: 0.07, col: [0.45, 0.8, 1] }); sfx('acid', e.x, e.y); }
      else if (e.w === 'snipe') { RND.tracers.push({ x: e.x, y: e.y, z: e.z, x2: e.tx, y2: e.ty, z2: e.tz, t: 0, life: 0.2, w: 0.06, col: [1, 0.45, 0.3] }); sfx('sniper', e.x, e.y); }
      else { RND.tracers.push({ x: e.x, y: e.y, z: e.z, x2: e.tx, y2: e.ty, z2: e.tz, t: 0, life: 0.08, w: 0.03, col: [1, 0.85, 0.45] }); if (thr('tur', 0.09)) sfx('rifle', e.x, e.y); }
      if (e.w !== 'frost') RND.flashes.push({ x: e.x, y: e.y, z: e.z, t: 0, life: 0.05 }); break; }
    case 'hit': if (e.a) { for (let k = 0; k < 6; k++) addP({ x: e.x, y: e.y, z: e.z, vx: frnd(-3, 3), vy: frnd(-3, 3), vz: frnd(0.5, 3), col: k % 2 ? '#ffe9a0' : '#ffffff', s: 0.035, life: 0.25, floor: e.z - 1 }); if (thr('clank', 0.06)) sfx('clank', e.x, e.y); break; }
      bloodFx(e.x, e.y, e.z, e.h ? 9 : 5, e.g); if (Math.random() < 0.45) addDecal(e.x + frnd(-0.3, 0.3), e.y + frnd(-0.3, 0.3), e.z - 0.6, frnd(0.08, 0.16), e.g ? '#3c5a14' : null); if (thr('flesh', 0.05)) sfx(e.h ? 'head' : 'flesh', e.x, e.y); break;
    case 'zdie':
      RND.corpses.push({ corpse: 1, x: e.x, y: e.y, z: e.z, k: e.t, face: e.f, t: 0, seed: e.id * 7, id: e.id, L: Math.floor((e.z + 0.1) / FH) }); if (RND.corpses.length > 60) RND.corpses.shift();
      bloodFx(e.x, e.y, e.z + 0.6, 10, e.t === 'spitter'); addDecal(e.x, e.y, e.z, (e.t === 'boss' ? 0.9 : e.t === 'brute' ? 0.6 : 0.32) + Math.random() * 0.15, e.t === 'spitter' ? '#3c5a14' : null);
      if (thr('zdie', 0.12)) sfx(e.t === 'brute' || e.t === 'boss' ? 'bigdie' : 'zdie', e.x, e.y);
      if (guest) { const z = W.zs.find(z => z.id === e.id); if (z) z.hp = 0; }
      break;
    case 'cell': {
      const prevB = W.blk[e.i], prevS = W.slab[e.i];
      if (guest) { const eb = B[e.b] ? e.b : 0, es = B[e.s] ? e.s : 0; W.blk[e.i] = eb; W.bhp[e.i] = eb ? (B[eb].hp || 1) : 0; W.slab[e.i] = es; W.shp[e.i] = es ? (B[es].hp || 1) : 0; W.bdir[e.i] = e.d || 0; W.ver++; W.navDirty = true; W.stabDirty = true; }
      const [x, y, z] = cellPos(e.i), col = (B[prevB] && B[prevB].col) || (B[prevS] && B[prevS].col) || '#777';
      if (e.c === 'brk' || e.c === 'fall') { debrisFx(x, y, z - 0.5, col, e.c === 'fall' ? 6 : 10); if (thr('brk', 0.06)) sfx(e.c === 'fall' ? 'fall' : prevB === 3 || prevB === 8 || prevS === 5 ? 'brkMetal' : 'brk', x, y); }
      else if (e.c === 'build') { sfx('build', x, y); debrisFx(x, y, z - 0.5, '#c8bba8', 2); }
      else if (e.c === 'demo') { sfx('demo', x, y); debrisFx(x, y, z - 0.5, col, 4); }
      else if (e.c === 'chop') { sfx('chop', x, y); debrisFx(x, y, z - 0.4, '#3c5f35', 8); }
      else if (e.c === 'mine') { sfx('brk', x, y); debrisFx(x, y, z - 0.5, '#77736b', 8); }
      else if (e.c === 'loot') { debrisFx(x, y, z - 0.6, B[prevB] && B[prevB].col || '#6a5a48', 4); }
      else if (e.c === 'trap') { sfx('trap', x, y); bloodFx(x, y, z - 0.8, 8); }
      break;
    }
    case 'bash': { const [x, y, z] = cellPos(e.i); if (thr('bash' + e.i, 0.15)) { sfx(e.z === 'brute' || e.z === 'boss' ? 'smash' : 'bash', x, y); addP({ x, y, z, vx: frnd(-1.5, 1.5), vy: frnd(-1.5, 1.5), vz: frnd(0.5, 2.5), col: B[W.blk[e.i]] && B[W.blk[e.i]].col || '#888', s: 0.07, life: 0.5, floor: z - 0.6 }); if (e.z === 'brute' || e.z === 'boss') shake(x, y, 0.15); } break; }
    case 'collapse': { const [x, y] = cellPos(e.i); sfx('collapse', x, y); shake(x, y, 0.35); break; }
    case 'repair': { const [x, y] = cellPos(e.i); sfx('build', x, y); break; }
    case 'spot': if (guest) { if (e.v) W.srch.add(e.i); else W.srch.delete(e.i); W.ver++; } break;
    case 'loot': RND.floats.push({ x: e.x, y: e.y, z: e.z, text: e.text, col: '#ffd76a', t: 0 }); if (e.p === ME || e.p < 0) sfx('loot'); break;
    case 'phurt': if (guest && e.d > 0 && W.p[e.p]) W.p[e.p].hurtT = 0.3; if (e.d > 6 && Math.random() < 0.5) { const q = W.p[e.p]; addDecal(q.x + frnd(-0.2, 0.2), q.y + frnd(-0.2, 0.2), q.z, frnd(0.08, 0.14)); }
      if (e.p === ME) { RND.hurtV = Math.min(1, RND.hurtV + 0.5); CAM.shake = Math.max(CAM.shake, 0.12); if (thr('hurt', 0.25)) sfx('hurt'); } break;
    case 'down': sfx('down', W.p[e.p].x, W.p[e.p].y); uiMsg(e.p === ME ? (W.p.length > 1 ? '你倒地了！等队友扶你，或按 H 用医疗包自救' : '你倒地了！按 H 用医疗包自救') : W.p[e.p].name + ' 倒地了！快去扶（按住 F）', '#ff6b5a'); break;
    case 'revive': sfx('revive'); uiMsg(e.p === e.by ? W.p[e.p].name + ' 自救成功' : W.p[e.by].name + (e.rez ? ' 用医疗包救回了 ' : ' 扶起了 ') + W.p[e.p].name, '#8fe39a'); break;
    case 'dead': uiMsg(W.p[e.p].name + ' 阵亡了：' + (e.t >= 0 ? (e.t || 20) + ' 秒后在据点复活（还剩 ' + (e.n || 0) + ' 次）' : '复活次数用完了') + '，带医疗包到他倒下的地方能马上救回来', '#ff6b5a'); break;
    case 'slam': { debrisFx(e.x, e.y, e.z + 0.2, '#9a8a70', e.r > 1 ? 18 : 8); shake(e.x, e.y, e.r > 1 ? 0.5 : 0.3); break; } // brute slam / charge crash
    case 'sbash': { const q = W.p[e.p]; sfx('bash', q.x, q.y); if (e.p !== ME) q.knT = 0.3; if (e.n) { debrisFx(e.x, e.y, e.z, '#cfd8e0', 6); if (e.p === ME) shake(q.x, q.y, 0.18); } break; } // (round 23) shield bash
    case 'respawn': uiMsg(W.p[e.p].name + ' 回来了' + '（在据点）', '#8fe39a'); break;
    case 'task': sfx('craft'); uiMsg('任务完成：' + e.txt + '  奖励 ' + e.rt, '#ffd76a'); toast('任务完成 · ' + e.rt, '#ffd76a'); break;
    case 'tp': if (guest && e.p === ME) { const p = W.p[ME]; p.x = e.x; p.y = e.y; p.L = e.l; p.vx = p.vy = 0; } break;
    case 'kacid': for (let k = 0; k < 10; k++) { const a = e.a + frnd(-0.45, 0.45), v = frnd(5, 9); addP({ x: e.x + Math.cos(e.a) * 1.4, y: e.y + Math.sin(e.a) * 1.4, z: e.z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: frnd(-1.5, 0.5), g: -3, col: k % 3 ? '#9dff3a' : '#5f9a20', s: 0.1, life: 0.8, floor: e.z - 3 }); } if (thr('kacid', 0.3)) sfx('acid', e.x, e.y); break; // (round 34) kaiju acid breath
    case 'xform': { const q = W.p[e.o]; if (!q) break; q._xfT = 0; q._xfTo = e.to; q._xfS = -1; sfx('swap', q.x, q.y); shake(q.x, q.y, 0.12); break; } // (round 34b) start the 1 s transformation on every screen
    case 'mmove': if (guest && e.p === ME) { const p = W.p[ME]; if (e.m.dash) p.dash = e.m.dash; if (e.m.jmp) p.jmp = e.m.jmp; } break; // (round 34) a mech dash / leap the host started for this screen's survivor
    case 'mpunch': { const q = W.p[e.o]; if (!q) break; q._mcombo = q._mpT != null && q._mpT < 0.95 ? ((q._mcombo || 0) + 1) % 3 : 0; q._mpT = 0; q._mpS = e.s; sfx('swap', q.x, q.y); break; } // (round 34b) a quick follow-up continues the combo
    case 'mhit': { const q = W.p[e.o]; if (!q) break; if (e.h) { q._mhs = 0.07; sfx('smash', e.x, e.y); shake(e.x, e.y, 0.18); for (let k = 0; k < 12; k++) addP({ x: e.x, y: e.y, z: e.z, vx: frnd(-3, 3), vy: frnd(-3, 3), vz: frnd(0.5, 3), col: k % 3 ? '#ffd27a' : '#7a1010', s: 0.07, life: 0.35 }); RND.flashes.push({ x: e.x, y: e.y, z: e.z, t: 0, life: 0.06 }); } break; }
    case 'mskill': { const q = W.p[e.o]; if (q) { q._msT = 0; q._msK = e.t; }
      if (e.t === 'slam') { shake(e.x, e.y, 0.6); debrisFx(e.x, e.y, e.z + 0.2, '#9a8a70', 26); for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; addP({ x: e.x + Math.cos(a) * 0.8, y: e.y + Math.sin(a) * 0.8, z: e.z + 0.1, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, vz: 0.4, g: -0.3, col: '#a89878', s: 0.13, life: 0.55, smoke: 1 }); } sfx('collapse', e.x, e.y); }
      else if (e.t === 'dash') { sfx('swap', e.x, e.y); for (let k = 0; k < 16; k++) addP({ x: e.x + Math.cos(e.a) * k * 0.5, y: e.y + Math.sin(e.a) * k * 0.5, z: e.z + 1.3, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: 0.2, g: -0.1, col: '#ffb060', s: 0.08, life: 0.35 }); }
      else { sfx('jump', e.x, e.y); shake(e.x, e.y, 0.25); for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; addP({ x: e.x + Math.cos(a) * 0.6, y: e.y + Math.sin(a) * 0.6, z: e.z + 0.1, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, vz: 0.6, g: -0.2, col: '#bfc8d0', s: 0.12, life: 0.5, smoke: 1 }); } }
      break; }
    case 'kb': if (guest && e.p === ME) { const p = W.p[ME]; p.kbx += e.x; p.kby += e.y; } break;
    case 'night': sfx(e.blood ? 'blood' : 'night'); banner((e.blood ? '第 ' + e.n + ' 夜 · 血月' : '第 ' + e.n + ' 夜') + (e.lv ? ' · Lv ' + e.lv : ''), (e.up ? '尸潮升到 Lv ' + e.lv + '：更多、更硬、更快 · ' : '') + (e.blood ? '尸潮从四面八方涌来，巨尸出没' : '尸潮从' + e.from + '边来了') + '，守住堡垒', e.blood ? '#ff5a4a' : e.up ? '#ff9a5a' : '#ffd27a'); break; // (round 31) level every two nights
    case 'dawn': document.getElementById('over').classList.add('hidden'); sfx('dawn'); banner('天亮了', '撑过了第 ' + e.n + ' 夜 · 新的任务已刷新（点上方「今日任务」展开）', '#ffe7b0'); break;
    case 'say': uiMsg(e.text, e.col); break;
    case 'mbanner': banner(e.t, '', e.c); sfx('ready'); break;
    case 'dig': for (let k = 0; k < (e.big ? 14 : 4); k++) addP({ x: e.x + frnd(-0.4, 0.4), y: e.y + frnd(-0.4, 0.4), z: e.z + 0.05, vx: frnd(-1.2, 1.2), vy: frnd(-1.2, 1.2), vz: frnd(1, 3), col: k % 2 ? '#6a5236' : '#4a3a28', s: frnd(0.08, 0.16), life: 0.8, floor: e.z }); if (e.big) sfx('collapse', e.x, e.y); break;
    case 'craft': if (e.p === ME) { sfx('craft'); toast('制作完成：' + e.name); } break;
    case 'deny': if (e.p === ME && thr('deny', 0.3)) { sfx('deny'); toast(e.why, '#ff8a7a'); } break;
    case 'boom': RND.booms.push({ x: e.x, y: e.y, z: e.z, t: 0, r: e.r || (e.g ? BAL.blastR : BAL.nadeR) }); debrisFx(e.x, e.y, e.z, e.g ? '#6a8a2a' : '#3a3530', 12); if (e.g) { bloodFx(e.x, e.y, e.z, 24, true); addDecal(e.x, e.y, e.z - 0.5, 1.1, '#3c5a14'); } if (e.r === BAL.barrelR) for (let k = 0; k < 26; k++) addP({ x: e.x + frnd(-1, 1), y: e.y + frnd(-1, 1), z: e.z, vx: frnd(-3, 3), vy: frnd(-3, 3), vz: frnd(2, 6), g: 3, life: 0.9, s: 0.16, col: k % 3 ? '#ff8a2a' : '#ffd04a' }); sfx('boom', e.x, e.y); shake(e.x, e.y, 0.4); break;
    case 'acid': for (let k = 0; k < 8; k++) addP({ x: e.x, y: e.y, z: e.z, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(0, 2.5), col: k % 2 ? '#9dff3a' : '#5f9a20', s: 0.06, life: 0.5, floor: e.z - 0.3 }); sfx('acid', e.x, e.y); break;
    case 'rhit': if (thr('rhit', 0.3)) { sfx('rhit', W.radio.x, W.radio.y); for (let k = 0; k < 4; k++) addP({ x: W.radio.x + 0.5, y: W.radio.y + 0.5, z: 0.6, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(1, 3), col: '#ffd76a', s: 0.05, life: 0.4 }); } break;
    case 'knife': { const q = W.p[e.p]; sfx(e.n ? 'stab' : 'slash', q.x, q.y); if (e.p !== ME) q.knT = 0.28; if (e.n) { bloodFx(e.x, e.y, e.z, e.b ? 14 : 8, e.g); if (e.b) RND.floats.push({ x: e.x, y: e.y, z: e.z + 0.5, text: '背刺 ×' + BAL.knifeBack, col: '#ff8a6a', t: 0 }); } break; }
    case 'scream': (RND.rings = RND.rings || []).push({ x: e.x, y: e.y, z: e.z, t: 0 }); sfx('scream', e.x, e.y); if (thr('scrMsg', 8)) uiMsg('尖叫者在叫——附近的丧尸发狂了！', '#ff8ac0'); break;
    case 'over': if (!W.demo && STATE.mode === 'play') showOver(e); break;
    case 'sfx': if (e.n === 'throw') { let bp = null, bd = 2; for (const q of W.p) { const d = d2(q.x, q.y, e.x, e.y); if (d < bd) { bd = d; bp = q; } } if (bp) bp._throwT = 0.35; }
      if (e.local || !(guest && e.o === ME && /reload|swap/.test(e.n))) sfx(e.n, e.x, e.y); break;
  }
}
function shotFx(o, wi, ends) {
  const p = W.p[o]; if (!p) return;
  p._lastShot = W.t;
  const mw = muzzleW(o, wi); let z0 = (p.zv != null ? p.zv : p.z) + (p.down ? 0.25 : 0.72), mx = p.x + Math.cos(p.aim) * 0.55, my = p.y + Math.sin(p.aim) * 0.55;
  if (mw && Math.hypot(mw[0] - p.x, mw[1] - p.y) < 1.2) { mx = mw[0]; my = mw[1]; z0 = mw[2]; }
  if (WPN[wi].flame) { // a roaring tongue of fire
    for (let k = 0; k < 7; k++) { const a = p.aim + frnd(-0.3, 0.3), v = frnd(5, 9); addP({ x: mx, y: my, z: z0 - 0.03, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: frnd(-0.3, 0.8), g: -1.5, col: k % 3 === 0 ? '#fff0a0' : k % 3 === 1 ? '#ffb030' : '#ff5a1a', s: frnd(0.08, 0.16), life: frnd(0.35, 0.55), smoke: k === 6 ? 1 : 0 }); }
    RND.flashes.push({ x: mx, y: my, z: z0, t: 0, life: 0.05 }); p.recoilT = 0.04; p._kick = Math.max(p._kick || 0, 0.25);
    if (thr('flame' + o, 0.18)) sfx('flamer', p.x, p.y); return;
  }
  if (WPN[wi].gl) { for (let k = 0; k < 4; k++) addP({ x: mx, y: my, z: z0, vx: frnd(-0.4, 0.4), vy: frnd(-0.4, 0.4), vz: frnd(0.2, 0.6), g: -0.3, col: '#8a8478', s: 0.12, life: 0.6, smoke: 1 }); RND.flashes.push({ x: mx, y: my, z: z0, t: 0, life: 0.07, big: 1 }); p.recoilT = 0.08; p._kick = 1; sfx('launcher', p.x, p.y); if (o === ME) CAM.shake = Math.max(CAM.shake, 0.2); return; }
  for (const [x2, y2, z2, wall] of ends) {
    RND.tracers.push({ x: mx, y: my, z: z0, x2, y2, z2, t: 0, life: wi === 3 ? 0.18 : wi === 4 ? 0.22 : 0.09, w: wi === 3 ? 0.06 : wi === 1 ? 0.025 : wi === 4 ? 0.03 : 0.035, col: wi === 4 ? [0.75, 0.55, 0.3] : null });
    if (wall) { for (let k = 0; k < 5; k++) addP({ x: x2, y: y2, z: z2, vx: frnd(-2.5, 2.5), vy: frnd(-2.5, 2.5), vz: frnd(0, 2.5), col: k % 2 ? '#ffd76a' : '#fff2c0', s: 0.035, life: 0.22, floor: z2 - 1, g: 6 }); addP({ x: x2, y: y2, z: z2, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: 0.3, g: -0.2, col: '#8a8070', s: 0.08, life: 0.4, smoke: 1 }); }
  }
  RND.flashes.push({ x: mx, y: my, z: z0, t: 0, life: 0.06, big: wi === 1 || wi === 3 });
  p.recoilT = 0.08; p._kick = 1;
  if (wi && wi < 4) addP({ x: p.x, y: p.y, z: z0, vx: -Math.sin(p.aim) * frnd(1, 2), vy: Math.cos(p.aim) * frnd(1, 2), vz: frnd(1.5, 2.5), col: '#c9a23a', s: 0.04, life: 0.7, floor: z0 - 0.72 });
  sfx(WPN[wi].k, p.x, p.y);
  if (o === ME) { CAM.shake = Math.max(CAM.shake, WPN[wi].shake * 0.6); const kk = [0.06, 0.16, 0.05, 0.2][wi]; CAM.kx = (CAM.kx || 0) - Math.cos(p.aim) * kk; CAM.ky = (CAM.ky || 0) - Math.sin(p.aim) * kk; }
}
function shake(x, y, a) { const me = W.p[ME]; if (!me) return; const d = d2(x, y, me.x, me.y); CAM.shake = Math.max(CAM.shake, a * clamp(1 - d / 22, 0, 1)); }
