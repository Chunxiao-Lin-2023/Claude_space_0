/* ---------- (round 37) 第二形态: the six beasts (models, animation, effects) ----------
   Model space as for the mechs: +x forward, +y up. mkBeast(v) builds one; beastTick animates it every frame; evoDraw swaps mech ↔ beast. */
const EVW = new THREE.Vector3();
const eL = c => new THREE.MeshLambertMaterial({ color: c });
const eG = (c, o) => o != null ? new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }) : new THREE.MeshBasicMaterial({ color: c });
const eS = (r, w, h) => new THREE.SphereGeometry(r, w || 16, h || 12);
function eP(par, geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); if (sx != null) m.scale.set(sx, sy != null ? sy : sx, sz != null ? sz : sx); par.add(m); return m; }
const eGrp = (par, x, y, z) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); par.add(g); return g; };
const eTube = (pts, r, seg) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), seg || 16, r, 6, false);
// a tile laid on an ellipsoid surface (rx, ry, rz) at polar angle th from the top and azimuth az, facing outward
function eOnDome(par, geo, mat, cy, rx, ry, rz, th, az, out) {
  const n = new THREE.Vector3(Math.sin(th) * Math.cos(az) / rx, Math.cos(th) / ry, Math.sin(th) * Math.sin(az) / rz).normalize(), m = new THREE.Mesh(geo, mat);
  m.position.set(Math.sin(th) * Math.cos(az) * rx + n.x * out, cy + Math.cos(th) * ry + n.y * out, Math.sin(th) * Math.sin(az) * rz + n.z * out); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); par.add(m); return m;
}
const BEAST_S = [0, 1.35, 1.25, 1.25, 1.3, 1.25, 1.25]; // overall size per beast

/* ---------- 青蛇: a cobra, hood spread, sliding on its belly ---------- */
function mkSnake(E) {
  const g = new THREE.Group(), U = { k: 1, segs: [] }; g.userData = U;
  const main = eL(E.col[0]), dark = eL(E.col[1]), belly = eL('#e2d68a'), spot = eL('#1b4632'), eye = eG('#d8ff4a'), blk = eL('#0d0d0d'), fang = eL('#f6f2e8'), tng = eL('#d0304a'), hoodIn = eL('#e9cf6a');
  const N = 28;
  for (let i = 0; i < N; i++) { const t = i / (N - 1), r = i < 3 ? 0.25 + i * 0.02 : 0.05 + 0.27 * (1 - Math.pow(Math.max(0, (t - 0.12) / 0.88), 1.2)); const s = eGrp(g);
    eP(s, eS(r, 14, 10), main, 0, 0, 0, 0, 0, 0, 1.3, 0.82, 1); eP(s, eS(r * 0.93, 12, 8), belly, 0, -r * 0.3, 0, 0, 0, 0, 1.25, 0.48, 0.96);
    if (i > 2 && i % 3 === 0) eP(s, eS(r * 0.55, 10, 8), spot, 0, r * 0.55, 0, 0, Math.PI / 4, 0, 1.3, 0.35, 1.3);
    if (i > 3 && i % 3 === 1) for (const z of [-1, 1]) eP(s, eS(r * 0.3, 8, 6), spot, 0, r * 0.2, z * r * 0.78, 0, 0, 0, 1.5, 0.5, 0.5);
    U.segs.push({ s, r }); }
  const head = eGrp(g); U.head = head; head.scale.setScalar(1.35);
  eP(head, eS(0.3, 20, 14), main, 0.1, 0, 0, 0, 0, 0, 1.55, 0.6, 1.05); eP(head, eS(0.2, 16, 10), main, 0.4, -0.02, 0, 0, 0, 0, 1.35, 0.55, 0.9);
  eP(head, eS(0.22, 14, 8), dark, 0.18, 0.11, 0, 0, 0, 0, 1.5, 0.25, 0.8); // the dark crown scale
  for (const z of [-1, 1]) { eP(head, eS(0.1, 10, 8), main, 0.3, 0.1, z * 0.15, 0, 0, 0, 1.3, 0.45, 0.8); // brow ridge
    eP(head, eS(0.07, 12, 10), eye, 0.31, 0.06, z * 0.165); eP(head, new THREE.BoxGeometry(0.025, 0.1, 0.02), blk, 0.345, 0.06, z * 0.215, 0, z * 0.5, 0);
    eP(head, eS(0.018, 6, 4), blk, 0.66, 0.02, z * 0.05); // nostril
    eP(head, new THREE.ConeGeometry(0.024, 0.15, 6), fang, 0.52, -0.12, z * 0.075, Math.PI, 0, 0); }
  const jaw = eGrp(head, 0.06, -0.07, 0); U.jaw = jaw; eP(jaw, eS(0.24, 14, 8), belly, 0.25, -0.03, 0, 0, 0, 0, 1.6, 0.33, 0.88);
  const tg = eGrp(head, 0.55, -0.07, 0); U.tongue = tg; eP(tg, new THREE.BoxGeometry(0.22, 0.012, 0.02), tng, 0.11, 0, 0); for (const z of [-1, 1]) eP(tg, new THREE.BoxGeometry(0.08, 0.01, 0.015), tng, 0.25, 0, z * 0.02, 0, z * 0.5, 0);
  const hood = eGrp(head, -0.2, -0.2, 0); hood.scale.setScalar(0.72); U.hood = hood; U.hoodS = 0.72;
  eP(hood, eS(0.5, 20, 14), main, 0, 0, 0, 0, 0, 0.15, 0.12, 1.0, 1.25); eP(hood, eS(0.43, 18, 12), hoodIn, 0.05, -0.02, 0, 0, 0, 0.15, 0.06, 0.85, 1.05);
  for (const z of [-1, 1]) { eP(hood, new THREE.TorusGeometry(0.11, 0.028, 6, 18), dark, -0.065, 0.12, z * 0.22, 0, Math.PI / 2, 0); eP(hood, eS(0.05, 8, 6), eG('#ffe060'), -0.07, 0.12, z * 0.22); }
  return g;
}
function snakeTick(p, g, dt) {
  const U = g.userData, sp = p._spd || 0, mv = clamp(sp / 4, 0, 1); U.ph = (U.ph || 0) + dt * (1.4 + sp * 2.4);
  const strike = p._mpT != null && p._mpT < 0.4 ? Math.sin(Math.min(1, p._mpT / 0.4) * Math.PI) : 0, ph = U.ph, sk = p._msK === 'venom' && p._msT < 0.6 ? Math.sin(p._msT / 0.6 * Math.PI) : 0;
  const neck = [[0.05, 0.98, 0], [-0.17, 0.72, 0], [-0.36, 0.44, 0]];
  U.segs.forEach((S, i) => { if (i < 3) { const n = neck[i]; S.s.position.set(n[0] + strike * 0.35 * (3 - i) / 3, n[1] - strike * 0.18 * (3 - i) / 3, Math.sin(ph * 0.5 - i) * 0.04); return; }
    const k = i - 2, w = Math.min(1, k / 6); S.s.position.set(-0.36 - k * 0.18, S.r * 0.85, Math.sin(ph - i * 0.38) * (0.22 + 0.16 * mv) * w); });
  U.head.position.set(0.26 + strike * 0.75, 1.12 + Math.sin(ph * 0.5) * 0.03 - strike * 0.25 + sk * 0.1, 0); U.head.rotation.z = -strike * 0.35 + sk * 0.5;
  U.jaw.rotation.z = -(strike * 0.7 + sk * 0.6); U.hood.scale.set(U.hoodS, U.hoodS * (1 + strike * 0.15 + sk * 0.2), U.hoodS * (1 + strike * 0.25 + sk * 0.3));
  const fl = (W.t * 1.3 + p.i) % 2.2; U.tongue.scale.x = fl < 0.25 ? Math.sin(fl / 0.25 * Math.PI) : 0.001; U.tongue.rotation.y = Math.sin(W.t * 40) * 0.15;
  if (sk && FXR() < dt * 30) { U.head.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(p._ly) * 3 + frnd(-1, 1), vy: Math.sin(p._ly) * 3 + frnd(-1, 1), vz: 0.5, g: 0.2, col: '#8dff5a', s: 0.1, life: 0.6, smoke: 1 }); }
}

/* ---------- 赤龙: a long Chinese dragon swimming through the air ---------- */
function mkDragon(E) {
  const g = new THREE.Group(), U = { k: 2, segs: [], legs: [] }; g.userData = U;
  const main = eL(E.col[0]), dark = eL(E.col[1]), gold = eL(E.col[2]), belly = eL('#f0c66a'), white = eL('#f6efe0'), eye = eG('#ffd040'), blk = eL('#120808'), mane = eL('#7a1414'), flame = eG('#ff9a30', 0.75), pearl = eG('#fff2b0');
  const N = 22;
  for (let i = 0; i < N; i++) { const t = i / (N - 1), r = 0.1 + 0.27 * Math.sin(Math.min(1, 0.22 + t * 0.95) * Math.PI) * (1 - t * 0.35); const s = eGrp(g);
    eP(s, eS(r, 14, 10), main, 0, 0, 0, 0, 0, 0, 1.25, 0.95, 1); eP(s, eS(r * 0.9, 12, 8), belly, 0, -r * 0.35, 0, 0, 0, 0, 1.2, 0.45, 0.92);
    eP(s, new THREE.ConeGeometry(r * 0.32, r * 1.1, 5), gold, -r * 0.2, r * 1.05, 0, 0, 0, 0.55); // dorsal spine, leaning back
    if (i % 2) for (const z of [-1, 1]) eP(s, eS(r * 0.35, 8, 6), dark, 0, r * 0.15, z * r * 0.85, 0, 0, 0, 1.3, 0.6, 0.4);
    U.segs.push({ s, r }); }
  // four legs with golden claws
  for (const [si, side] of [[3, -1], [3, 1], [12, -1], [12, 1]]) { const S = U.segs[si], hip = eGrp(S.s, 0, -S.r * 0.3, side * S.r * 0.85); eP(hip, eS(0.11, 10, 8), main, 0, 0, 0, 0, 0, 0, 1, 1.3, 1);
    const kn = eGrp(hip, 0.05, -0.22, side * 0.08); eP(hip, new THREE.CylinderGeometry(0.06, 0.07, 0.25, 8), main, 0.02, -0.11, side * 0.04, side * 0.3, 0, 0.2);
    eP(kn, new THREE.CylinderGeometry(0.045, 0.06, 0.22, 8), main, 0.04, -0.09, 0, 0, 0, -0.4); for (let c = -1; c <= 1; c++) eP(kn, new THREE.ConeGeometry(0.022, 0.12, 5), gold, 0.12, -0.2, c * 0.04, 0, 0, -1.9);
    U.legs.push({ hip, kn, side, si }); }
  const tail = eGrp(U.segs[N - 1].s); for (let k = 0; k < 4; k++) eP(tail, new THREE.ConeGeometry(0.08, 0.45, 6), flame, -0.2, 0, 0, 0, k * Math.PI / 2, Math.PI / 2 + 0.4 * Math.sin(k * 1.7)); U.tail = tail;
  // the head
  const head = eGrp(g); U.head = head;
  eP(head, eS(0.3, 20, 14), main, 0, 0.02, 0, 0, 0, 0, 1.25, 0.85, 0.95); eP(head, eS(0.2, 16, 12), main, 0.33, -0.04, 0, 0, 0, 0, 1.6, 0.62, 0.8); // skull, long snout
  eP(head, eS(0.1, 12, 8), gold, 0.62, 0.0, 0, 0, 0, 0, 0.8, 0.7, 1.2); // nose pad
  for (const z of [-1, 1]) { eP(head, eS(0.04, 8, 6), blk, 0.67, 0.02, z * 0.06);
    eP(head, eS(0.11, 10, 8), dark, 0.15, 0.17, z * 0.14, 0, 0, 0.3, 1.5, 0.5, 0.8); // brow
    eP(head, eS(0.065, 12, 10), eye, 0.2, 0.09, z * 0.19); eP(head, eS(0.028, 8, 6), blk, 0.24, 0.09, z * 0.215);
    // antlers
    const an = eGrp(head, -0.08, 0.22, z * 0.12); an.rotation.set(z * -0.35, 0, 0.75); eP(an, new THREE.CylinderGeometry(0.02, 0.04, 0.55, 6), gold, 0, 0.27, 0);
    eP(an, new THREE.CylinderGeometry(0.014, 0.025, 0.24, 5), gold, 0.08, 0.3, 0, 0, 0, -0.9); eP(an, new THREE.CylinderGeometry(0.012, 0.022, 0.2, 5), gold, -0.06, 0.42, 0, 0, 0, 0.9);
    // whiskers flowing back
    eP(head, eTube([[0.58, -0.05, z * 0.08], [0.6, -0.1, z * 0.3], [0.3, -0.18, z * 0.5], [-0.1, -0.1, z * 0.6], [-0.45, -0.25, z * 0.55]], 0.012, 20), gold);
    // mane
    for (let k = 0; k < 3; k++) eP(head, new THREE.ConeGeometry(0.07, 0.42, 5), mane, -0.25 - k * 0.04, 0.05 - k * 0.1, z * (0.16 + k * 0.03), z * 0.4, 0, Math.PI / 2 + 0.25 - k * 0.15); }
  const jaw = eGrp(head, 0.12, -0.12, 0); U.jaw = jaw; eP(jaw, eS(0.17, 14, 8), belly, 0.2, -0.04, 0, 0, 0, 0, 1.7, 0.4, 0.75);
  for (let k = 0; k < 4; k++) for (const z of [-1, 1]) { eP(jaw, new THREE.ConeGeometry(0.018, 0.07, 5), white, 0.15 + k * 0.08, 0.02, z * (0.09 - k * 0.012)); eP(head, new THREE.ConeGeometry(0.018, 0.07, 5), white, 0.3 + k * 0.08, -0.13, z * (0.09 - k * 0.012), Math.PI, 0, 0); }
  U.mouth = new THREE.Object3D(); U.mouth.position.set(0.68, -0.1, 0); head.add(U.mouth);
  U.pearl = eGrp(g); eP(U.pearl, eS(0.08, 16, 12), pearl); eP(U.pearl, eS(0.13, 12, 8), eG('#ffd070', 0.22)); head.scale.setScalar(1.3);
  return g;
}
function dragonTick(p, g, dt) {
  const U = g.userData, sp = p._spd || 0; U.ph = (U.ph || 0) + dt * (1.6 + sp * 1.4); const ph = U.ph, br = W.t - (p._brT || -9) < 0.25 ? 1 : 0;
  const dash = p._msK === 'dragdash' && p._msT < 0.5 ? 1 : 0, cy = 1.55;
  U.segs.forEach((S, i) => { const k = Math.min(1, i / 3); S.s.position.set(0.1 - i * 0.29 * (1 - dash * 0.25), cy + Math.sin(ph - i * 0.42) * 0.3 * k + i * 0.012, Math.sin(ph * 0.8 - i * 0.33) * (0.42 + dash * 0.3) * k); S.s.rotation.x = dash ? (W.t * 14 + i * 0.5) : 0; });
  for (const L of U.legs) { const w = Math.sin(ph * 1.5 + L.si + (L.side > 0 ? Math.PI : 0)); L.hip.rotation.z = w * 0.6; L.kn.rotation.z = -0.4 + Math.max(0, -w) * 0.6; }
  U.head.position.set(0.42, cy + 0.12 + Math.sin(ph + 0.6) * 0.08, Math.sin(ph * 0.8 + 0.3) * 0.12); U.head.rotation.z = Math.sin(ph + 0.6) * -0.12 - br * 0.12;
  U.jaw.rotation.z = -(br * (0.55 + Math.sin(W.t * 30) * 0.08) + (p._msK === 'dragdash' && p._msT < 0.6 ? 0.4 : 0));
  U.pearl.position.set(0.95 + Math.sin(W.t * 1.3) * 0.1, cy + 0.35 + Math.sin(W.t * 2.1) * 0.12, Math.cos(W.t * 1.3) * 0.25); U.pearl.rotation.y += dt * 2;
  U.tail.scale.setScalar(0.9 + Math.sin(W.t * 18) * 0.15);
  if (br) { U.mouth.getWorldPosition(EVW); const a = p._ly; for (let k = 0; k < 4; k++) { const s2 = frnd(5, 9), aa = a + frnd(-0.35, 0.35); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(aa) * s2, vy: Math.sin(aa) * s2, vz: frnd(-1.2, 0.3), g: 0.4, col: FXR() < 0.5 ? '#ffb030' : '#ff5a1a', s: 0.16 + FXR() * 0.1, life: 0.55, smoke: 0 }); } }
  if (dash && FXR() < dt * 60) { const S = U.segs[(FXR() * N22) | 0]; S.s.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: frnd(-1, 1), vy: frnd(-1, 1), vz: 0.8, g: 0.3, col: '#ff8a2a', s: 0.18, life: 0.5 }); }
}
const N22 = 22;

/* ---------- 玉兔: a jade rabbit, big hind legs, long ears ---------- */
function mkRabbit(E) {
  const g = new THREE.Group(), U = { k: 3 }; g.userData = U;
  const white = eL(E.col[0]), jade = eL(E.col[1]), pink = eL(E.col[2]), gold = eL('#f2cf6a'), eye = eG('#ff4a72'), blk = eL('#141414'), shine = eG('#ffffff');
  const body = eGrp(g); U.body = body;
  eP(body, eS(0.5, 22, 16), white, 0, 0.95, 0, 0, 0, 0, 0.95, 1.1, 0.86); eP(body, eS(0.4, 18, 12), jade, 0.2, 0.88, 0, 0, 0, 0, 0.5, 0.95, 0.74);
  eP(body, new THREE.TorusGeometry(0.42, 0.04, 8, 28), jade, 0, 1.38, 0, Math.PI / 2, 0, 0, 1, 1, 1); // collar
  for (let k = 0; k < 3; k++) eP(body, eS(0.07, 10, 8), eG('#bff8ff'), 0.4, 1.0 - k * 0.16, 0, 0, 0, 0, 0.4, 1, 1); // jade buttons
  const head = eGrp(body, 0.05, 1.78, 0); U.head = head;
  eP(head, eS(0.42, 22, 16), white, 0, 0, 0, 0, 0, 0, 1, 0.92, 1.02);
  for (const z of [-1, 1]) { eP(head, eS(0.19, 14, 10), white, 0.2, -0.13, z * 0.19); eP(head, eS(0.1, 14, 10), eye, 0.3, 0.06, z * 0.2); eP(head, eS(0.035, 8, 6), shine, 0.37, 0.1, z * 0.22);
    eP(head, eS(0.07, 10, 8), pink, 0.3, -0.12, z * 0.27, 0, 0, 0, 0.6, 0.6, 1); // blush
    for (let w = -1; w <= 1; w++) eP(head, new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4), blk, 0.44, -0.08 + w * 0.03, z * 0.2, Math.PI / 2 + z * 0.25, 0, w * 0.15); // whiskers
    const ear = eGrp(head, -0.06, 0.3, z * 0.15); ear.rotation.x = z * -0.18; U['ear' + (z > 0 ? 'R' : 'L')] = ear;
    eP(ear, eS(0.14, 14, 12), white, 0, 0.42, 0, 0, 0, 0, 0.6, 3.4, 1.05); eP(ear, eS(0.1, 12, 10), pink, 0.06, 0.42, 0, 0, 0, 0, 0.25, 2.9, 0.7); eP(ear, eS(0.08, 10, 8), jade, 0, 0.86, 0, 0, 0, 0, 0.7, 0.9, 1); }
  eP(head, eS(0.14, 14, 10), white, 0.36, -0.1, 0); const nose = eP(head, eS(0.05, 10, 8), pink, 0.49, -0.04, 0); U.nose = nose;
  eP(head, new THREE.BoxGeometry(0.04, 0.07, 0.07), white, 0.45, -0.21, 0);
  eP(head, new THREE.TorusGeometry(0.1, 0.022, 6, 18, Math.PI * 1.2), gold, 0.38, 0.27, 0, 0, Math.PI / 2, Math.PI * 0.9); // crescent moon on the brow
  for (const z of [-1, 1]) { const arm = eGrp(body, 0.14, 1.28, z * 0.4); U['arm' + (z > 0 ? 'R' : 'L')] = arm; eP(arm, eS(0.13, 12, 10), white); eP(arm, eS(0.1, 12, 8), white, 0.12, -0.2, 0, 0, 0, 0.5, 1, 1.6, 1); eP(arm, eS(0.09, 10, 8), jade, 0.2, -0.36, 0);
    const leg = eGrp(body, -0.08, 0.5, z * 0.3); U['leg' + (z > 0 ? 'R' : 'L')] = leg; eP(leg, eS(0.32, 16, 12), white, 0, 0, 0, 0, 0, 0, 1.2, 1, 0.9);
    const ft = eGrp(leg, 0.05, -0.38, z * 0.02); U['ft' + (z > 0 ? 'R' : 'L')] = ft; eP(ft, eS(0.14, 14, 10), white, 0.15, 0, 0, 0, 0, 0, 2.6, 0.7, 1); eP(ft, eS(0.11, 12, 8), jade, 0.18, -0.06, 0, 0, 0, 0, 2.3, 0.3, 0.8); }
  const tail = eGrp(body, -0.48, 0.62, 0); eP(tail, eS(0.18, 14, 10), white); for (let k = 0; k < 6; k++) eP(tail, eS(0.09, 8, 6), white, Math.cos(k) * 0.12, Math.sin(k * 1.3) * 0.12, Math.sin(k) * 0.12);
  return g;
}
function rabbitTick(p, g, dt) {
  const U = g.userData, sp = p._spd || 0, air = (p.rjz != null ? p.rjz : p.jz || 0) > 0.05; U.ph = (U.ph || 0) + dt * (sp > 0.4 ? 3 + sp * 1.2 : 0);
  const hop = sp > 0.4 && !air ? Math.abs(Math.sin(U.ph)) : 0, push = sp > 0.4 ? Math.max(0, -Math.cos(U.ph * 2)) : 0;
  U.body.position.y = hop * 0.42; U.body.rotation.z = sp > 0.4 ? -0.15 + Math.cos(U.ph * 2) * 0.12 : air ? -0.3 : 0;
  const tuck = air ? 1 : push; for (const s of ['L', 'R']) { U['leg' + s].rotation.z = -0.3 * tuck + 0.5 * hop; U['ft' + s].rotation.z = -0.6 * tuck + 0.4 * hop; U['arm' + s].rotation.z = 0.6 * tuck - 0.3 * hop + (p._msK === 'moon' && p._msT < 1 ? -1.6 : 0); }
  const back = air ? 1.0 : 0.25 * hop + Math.sin(W.t * 2 + p.i) * 0.05; U.earL.rotation.z = U.earR.rotation.z = -back; U.earL.rotation.x = -0.18 - 0.1 * hop; U.earR.rotation.x = 0.18 + 0.1 * hop;
  U.nose.scale.setScalar(1 + Math.max(0, Math.sin(W.t * 9)) * 0.25); U.head.rotation.z = air ? 0.15 : Math.sin(W.t * 1.2) * 0.04;
  if (p._msK === 'moon' && p._msT < 1 && FXR() < dt * 40) { U.head.getWorldPosition(EVW); addP({ x: EVW.x + frnd(-0.4, 0.4), y: EVW.z + frnd(-0.4, 0.4), z: EVW.y - 1, vx: 0, vy: 0, vz: -1, g: 0, col: '#bff8ff', s: 0.12, life: 0.6 }); }
}

/* ---------- 玄龟: the black tortoise — a domed shell of glowing scutes, a little snake for a tail ---------- */
function mkTurtle(E) {
  const g = new THREE.Group(), U = { k: 4, legs: [] }; g.userData = U;
  const main = eL(E.col[0]), dark = eL(E.col[1]), gold = eL(E.col[2]), skin = eL('#5b7a5a'), belly = eL('#b9a26a'), eye = eG('#7fffd0'), blk = eL('#0e1210'), rune = eG(E.glow), snake = eL('#2a3f30');
  const shell = eGrp(g, 0, 0, 0); U.shell = shell; const SY = 0.55, RX = 1.25, RY = 0.78, RZ = 1.05;
  eP(shell, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), main, 0, SY, 0, 0, 0, 0, RX, RY, RZ);
  eP(shell, new THREE.SphereGeometry(1, 24, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), belly, 0, SY, 0, 0, 0, 0, RX * 0.94, 0.22, RZ * 0.92);
  eP(shell, new THREE.TorusGeometry(1, 0.075, 8, 48), gold, 0, SY, 0, Math.PI / 2, 0, 0, RX, RZ, 1);
  const tile = eL('#557a5c'), hex = (r) => new THREE.CylinderGeometry(r, r * 1.04, 0.07, 6), hexRim = r => new THREE.TorusGeometry(r, 0.018, 4, 6);
  eOnDome(shell, hex(0.3), tile, SY, RX, RY, RZ, 0, 0, 0.0); eOnDome(shell, hexRim(0.3), gold, SY, RX, RY, RZ, 0, 0, 0.04).rotateX(Math.PI / 2); eOnDome(shell, new THREE.TorusGeometry(0.12, 0.022, 6, 6), rune, SY, RX, RY, RZ, 0, 0, 0.05).rotateX(Math.PI / 2);
  for (let k = 0; k < 6; k++) { const az = k / 6 * Math.PI * 2 + Math.PI / 6; eOnDome(shell, hex(0.27), tile, SY, RX, RY, RZ, 0.72, az, 0); eOnDome(shell, hexRim(0.27), gold, SY, RX, RY, RZ, 0.72, az, 0.04).rotateX(Math.PI / 2); const rr = eOnDome(shell, eS(0.05, 8, 6), rune, SY, RX, RY, RZ, 0.72, az, 0.05); }
  for (let k = 0; k < 11; k++) { const az = k / 11 * Math.PI * 2; eOnDome(shell, hex(0.19), tile, SY, RX, RY, RZ, 1.22, az, -0.005); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; eP(shell, new THREE.ConeGeometry(0.06, 0.16, 4), gold, Math.cos(a) * RX * 1.03, SY - 0.02, Math.sin(a) * RZ * 1.03, 0, -a, -Math.PI / 2); } // rim studs
  U.glowRing = eP(g, new THREE.TorusGeometry(1.5, 0.06, 6, 40), eG(E.glow, 0.7), 0, 0.5, 0, Math.PI / 2, 0, 0); U.glowRing.visible = false;
  // head and neck
  const neck = eGrp(g, 1.05, 0.6, 0); U.neck = neck; eP(neck, new THREE.CylinderGeometry(0.16, 0.2, 0.5, 12), skin, 0.22, 0.05, 0, 0, 0, -1.25);
  const head = eGrp(neck, 0.5, 0.15, 0); U.head = head; eP(head, eS(0.27, 18, 14), skin, 0, 0, 0, 0, 0, 0, 1.4, 0.82, 1); eP(head, eS(0.14, 12, 8), dark, 0.25, -0.08, 0, 0, 0, 0, 1.3, 0.5, 1.1);
  for (const z of [-1, 1]) { eP(head, eS(0.065, 10, 8), eye, 0.18, 0.08, z * 0.18); eP(head, eS(0.1, 10, 8), dark, 0.14, 0.15, z * 0.15, 0, 0, 0.3, 1.4, 0.4, 0.8); eP(head, new THREE.ConeGeometry(0.035, 0.12, 5), gold, -0.12, 0.2, z * 0.12, z * 0.4, 0, -0.5); }
  const jaw = eGrp(head, 0.05, -0.1, 0); U.jaw = jaw; eP(jaw, eS(0.2, 12, 8), belly, 0.12, -0.02, 0, 0, 0, 0, 1.4, 0.3, 0.9);
  // legs
  for (const [lx, lz] of [[0.72, 0.78], [0.72, -0.78], [-0.72, 0.78], [-0.72, -0.78]]) { const hip = eGrp(g, lx, 0.48, lz); eP(hip, eS(0.26, 14, 10), skin); eP(hip, new THREE.CylinderGeometry(0.19, 0.22, 0.4, 12), skin, 0, -0.22, Math.sign(lz) * 0.06);
    const ft = eGrp(hip, 0.02, -0.42, Math.sign(lz) * 0.08); eP(ft, eS(0.24, 14, 10), skin, 0.04, 0, 0, 0, 0, 0, 1.35, 0.55, 1.2); for (let c = -1; c <= 1; c++) eP(ft, new THREE.ConeGeometry(0.04, 0.14, 5), gold, 0.32, -0.04, c * 0.1, 0, 0, -Math.PI / 2);
    for (let k = 0; k < 3; k++) eP(hip, eS(0.07, 6, 5), dark, 0.12, -0.1 - k * 0.1, Math.sign(lz) * 0.18); U.legs.push({ hip, lx, lz }); }
  // tail: a small coiled snake (玄武)
  const tl = eGrp(g, -1.25, 0.45, 0); U.tail = tl; const pts = []; for (let k = 0; k <= 8; k++) { const a = k * 0.8; pts.push([-k * 0.08, 0.05 + Math.sin(a) * 0.12 + k * 0.03, Math.cos(a) * 0.15]); }
  eP(tl, eTube(pts, 0.05, 24), snake); const sh = eGrp(tl, -0.7, 0.35, 0.1); eP(sh, eS(0.09, 10, 8), snake, 0, 0, 0, 0, 0, 0, 1.6, 0.8, 1); for (const z of [-1, 1]) eP(sh, eS(0.022, 6, 4), eG('#ff4030'), 0.04, 0.03, z * 0.06); U.tailHead = sh;
  return g;
}
function turtleTick(p, g, dt) {
  const U = g.userData, sp = p._spd || 0, spin = p.spinT > 0 || (p._msK === 'spin' && p._msT < 4); U.ph = (U.ph || 0) + dt * (sp > 0.3 ? 2 + sp * 1.5 : 0);
  U.rt = lerp(U.rt || 0, spin ? 1 : 0, Math.min(1, dt * 8)); const r = U.rt, keep = 1 - r * 0.9;
  if (spin) U.shell.rotation.y += dt * 16; else U.shell.rotation.y = lerp(U.shell.rotation.y % (Math.PI * 2), 0, Math.min(1, dt * 6));
  U.glowRing.visible = r > 0.3; U.glowRing.scale.setScalar(0.9 + Math.sin(W.t * 20) * 0.08);
  const bash = p._mpT != null && p._mpT < 0.35 ? Math.sin(p._mpT / 0.35 * Math.PI) : 0; U.shell.position.x = bash * 0.4; U.shell.position.y = Math.abs(Math.sin(U.ph)) * 0.04 - r * 0.25;
  U.neck.scale.setScalar(Math.max(0.05, keep)); U.neck.position.x = 1.05 - r * 0.5 + bash * 0.4; U.neck.rotation.z = Math.sin(U.ph * 0.5) * 0.06 + bash * -0.2;
  U.jaw.rotation.z = -(bash * 0.4 + (p._msK === 'spin' && p._msT < 0.3 ? 0.5 : 0));
  U.legs.forEach((L, i) => { L.hip.scale.setScalar(Math.max(0.05, keep)); const w = Math.sin(U.ph + (i === 0 || i === 3 ? 0 : Math.PI)); L.hip.rotation.z = w * 0.5 * (1 - r); L.hip.position.x = L.lx * (1 - r * 0.4); L.hip.position.z = L.lz * (1 - r * 0.4); });
  U.tail.scale.setScalar(Math.max(0.05, keep)); U.tailHead.rotation.y = Math.sin(W.t * 2 + p.i) * 0.5;
  if (spin && FXR() < dt * 30) { const a = FXR() * 6.28; g.getWorldPosition(EVW); addP({ x: EVW.x + Math.cos(a) * 1.6, y: EVW.z + Math.sin(a) * 1.6, z: EVW.y + 0.3, vx: -Math.sin(a) * 5, vy: Math.cos(a) * 5, vz: 0.6, g: 0.4, col: '#9fffe0', s: 0.1, life: 0.35 }); }
}

/* ---------- 火凤: the phoenix — burning wings, a crest, long tail plumes ---------- */
function mkPhoenix(E) {
  const g = new THREE.Group(), U = { k: 5, wings: [], plumes: [] }; g.userData = U;
  const main = eL(E.col[0]), dark = eL(E.col[1]), gold = eL(E.col[2]), chest = eL('#ffb04a'), eye = eG('#fff6c0'), blk = eL('#2a0a04');
  const hot = [eG('#ff4a1a'), eG('#ff7a24'), eG('#ffb43a'), eG('#ffe07a')], aura = eG('#ff8a30', 0.1);
  const body = eGrp(g, 0, 0.9, 0); U.body = body;
  eP(body, eS(0.34, 20, 14), main, 0, 0, 0, 0, 0, 0, 1.6, 0.75, 0.7); eP(body, eS(0.26, 16, 12), chest, 0.25, -0.06, 0, 0, 0, 0, 1.0, 0.8, 0.62);
  eP(body, eS(0.6, 16, 12), aura, 0, 0, 0, 0, 0, 0, 1.6, 0.8, 0.9);
  for (let k = 0; k < 3; k++) eP(body, eS(0.12 - k * 0.012, 12, 10), main, 0.45 + k * 0.1, 0.1 + k * 0.12, 0); // neck
  const head = eGrp(body, 0.78, 0.45, 0); U.head = head; eP(head, eS(0.15, 16, 12), main, 0, 0, 0, 0, 0, 0, 1.3, 1, 0.9);
  eP(head, new THREE.ConeGeometry(0.06, 0.24, 8), gold, 0.24, -0.03, 0, 0, 0, -Math.PI / 2 - 0.15); for (const z of [-1, 1]) { eP(head, eS(0.04, 10, 8), eye, 0.08, 0.04, z * 0.11); eP(head, eS(0.018, 6, 4), blk, 0.1, 0.04, z * 0.125); }
  for (let k = 0; k < 3; k++) { const c = eTube([[0, 0.1, 0], [-0.1, 0.35 + k * 0.05, (k - 1) * 0.05], [-0.35, 0.55 + k * 0.06, (k - 1) * 0.1], [-0.6, 0.5 + k * 0.08, (k - 1) * 0.14]], 0.02, 14); eP(head, c, gold); eP(head, eS(0.05, 8, 6), hot[3], -0.6, 0.5 + k * 0.08, (k - 1) * 0.14); }
  // wings: an arm with coverts, a hand with long primaries fanning out
  for (const z of [-1, 1]) { const sh = eGrp(body, 0.05, 0.12, z * 0.18); const arm = eGrp(sh); U.wings.push({ sh, z, arm });
    eP(arm, eS(0.1, 10, 8), main, 0, 0, z * 0.35, 0, 0, 0, 1.2, 0.5, 3.6);
    for (let k = 0; k < 6; k++) { eP(arm, eS(0.1, 10, 6), hot[0], -0.3 - k * 0.02, -0.02, z * (0.1 + k * 0.11), 0, 0, 0, 4.2 - k * 0.2, 0.12, 1.1); eP(arm, eS(0.1, 8, 6), hot[1], -0.05, 0.01, z * (0.1 + k * 0.11), 0, 0, 0, 2.2, 0.14, 1.0); }
    const hand = eGrp(arm, 0, 0, z * 0.72); arm.userData.hand = hand; eP(hand, eS(0.08, 10, 8), main, 0, 0, z * 0.18, 0, 0, 0, 1.2, 0.5, 2.6);
    for (let k = 0; k < 8; k++) { const f = eGrp(hand, 0, 0, z * (0.05 + k * 0.05)); f.rotation.y = z * (-0.25 + k * 0.17); const L2 = 0.75 + k * 0.05 - (k > 5 ? (k - 5) * 0.12 : 0);
      eP(f, eS(0.1, 10, 6), hot[0], -L2 * 0.55, 0, z * 0.13, 0, 0, 0, L2 * 5.6, 0.14, 1.25); eP(f, eS(0.1, 10, 6), hot[2], -L2 * 0.95, 0.008, z * 0.14, 0, 0, 0, L2 * 3.2, 0.12, 1.05); eP(f, eS(0.1, 8, 6), hot[3], -L2 * 1.2, 0.014, z * 0.145, 0, 0, 0, L2 * 1.5, 0.1, 0.7); } }
  // tail plumes
  for (let k = 0; k < 5; k++) { const pl = eGrp(body, -0.45, 0.02, (k - 2) * 0.07); pl.rotation.y = (k - 2) * 0.22; const segs = [];
    let par = pl; for (let s = 0; s < 4; s++) { const sg = eGrp(par, s ? -0.38 : 0, 0, 0); eP(sg, eS(0.08, 8, 6), hot[Math.min(3, s)], -0.2, 0, 0, 0, 0, 0, 2.6, 0.18, 0.7 + s * 0.15); segs.push(sg); par = sg; }
    eP(par, new THREE.CircleGeometry(0.11, 16), gold, -0.45, 0.02, 0, -Math.PI / 2, 0, 0); eP(par, new THREE.CircleGeometry(0.05, 12), hot[0], -0.45, 0.025, 0, -Math.PI / 2, 0, 0); U.plumes.push(segs); }
  return g;
}
function phoenixTick(p, g, dt) {
  const U = g.userData, sp = p._spd || 0, fl = Math.sin(W.t * (6 + sp * 0.6) + p.i), shoot = p._mpT != null && p._mpT < 0.3 ? 1 : 0, nova = p._msK === 'rebirth' && p._msT < 0.8 ? 1 : 0;
  U.wings.forEach(Wg => { Wg.sh.rotation.x = Wg.z * (fl * 0.65 + 0.15 - nova * 0.9); Wg.arm.userData.hand.rotation.x = Wg.z * fl * 0.35; Wg.sh.rotation.y = -Wg.z * (shoot * 0.4 + sp * 0.03); });
  U.body.position.y = 0.9 + fl * 0.06; U.body.rotation.z = -clamp(sp * 0.04, 0, 0.25) + shoot * 0.1; U.head.rotation.z = shoot * 0.25;
  U.plumes.forEach((segs, k) => segs.forEach((s, i) => { s.rotation.z = Math.sin(W.t * 3 - i * 0.7 + k) * 0.12 + (i === 0 ? 0.15 : 0); s.rotation.y = Math.sin(W.t * 2.3 - i * 0.6 + k * 0.7) * 0.1; }));
  if (FXR() < dt * 26) { const Wg = U.wings[(FXR() * 2) | 0]; Wg.arm.userData.hand.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: frnd(-0.6, 0.6), vy: frnd(-0.6, 0.6), vz: frnd(-0.8, 0.2), g: 0.5, col: FXR() < 0.5 ? '#ffb43a' : '#ff5a1a', s: 0.1, life: 0.55 }); }
  if (nova && FXR() < dt * 50) { g.getWorldPosition(EVW); const a = FXR() * 6.28; addP({ x: EVW.x, y: EVW.z, z: EVW.y + 1, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, vz: frnd(-1, 1), g: 0.2, col: '#ffd060', s: 0.18, life: 0.6 }); }
}

/* ---------- 铁熊: an armoured bear — steel shoulder plates and claws, exhaust pipes from the old tank ---------- */
function mkBear(E) {
  const g = new THREE.Group(), U = { k: 6, legs: [] }; g.userData = U;
  const fur = eL(E.col[0]), dark = eL(E.col[1]), steel = eL('#8a9097'), steelD = eL('#4a5058'), light = eL('#b08860'), blk = eL('#141010'), eye = eG(E.glow), claw = eL(E.col[2]);
  const fore = eGrp(g, 0, 1.0, 0); U.fore = fore; // the front half rears up from the hips
  eP(fore, eS(0.7, 22, 16), fur, -0.15, 0.08, 0, 0, 0, 0, 1.45, 0.92, 0.98); eP(fore, eS(0.5, 18, 12), fur, 0.3, 0.38, 0, 0, 0, 0, 1.1, 0.8, 0.9); eP(fore, eS(0.5, 16, 12), light, 0.3, -0.25, 0, 0, 0, 0, 1.2, 0.5, 0.75);
  for (const z of [-1, 1]) { eP(fore, new THREE.SphereGeometry(0.36, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), steel, 0.42, 0.32, z * 0.5, z * 0.5, 0, -0.2, 1.1, 0.7, 1); eP(fore, new THREE.TorusGeometry(0.34, 0.03, 6, 20), steelD, 0.42, 0.3, z * 0.52, Math.PI / 2 - z * 0.5, 0, 0, 1.05, 1, 1); }
  eP(fore, new THREE.BoxGeometry(0.9, 0.12, 0.7), steel, -0.25, 0.68, 0, 0, 0, 0.08); for (let k = 0; k < 3; k++) eP(fore, new THREE.BoxGeometry(0.2, 0.06, 0.74), steelD, -0.55 + k * 0.3, 0.75, 0, 0, 0, 0.08);
  for (const z of [-1, 1]) { const pp = eP(fore, new THREE.CylinderGeometry(0.06, 0.07, 0.4, 10), steelD, -0.6, 0.85, z * 0.2, 0, 0, 0.3); U['pipe' + (z > 0 ? 'R' : 'L')] = pp; }
  const head = eGrp(fore, 0.95, 0.42, 0); U.head = head;
  eP(head, eS(0.42, 20, 16), fur, 0, 0, 0, 0, 0, 0, 1.05, 0.95, 1); eP(head, eS(0.22, 16, 12), light, 0.34, -0.1, 0, 0, 0, 0, 1.35, 0.8, 1); eP(head, eS(0.085, 10, 8), blk, 0.6, -0.04, 0, 0, 0, 0, 1, 0.8, 1.2);
  eP(head, new THREE.BoxGeometry(0.3, 0.06, 0.34), steel, 0.32, 0.06, 0, 0, 0, -0.25); // steel muzzle band
  for (const z of [-1, 1]) { eP(head, eS(0.15, 12, 10), fur, -0.08, 0.34, z * 0.26, 0, 0, 0, 0.6, 1, 1); eP(head, eS(0.09, 10, 8), light, -0.04, 0.34, z * 0.26, 0, 0, 0, 0.4, 0.8, 0.8);
    U['eye' + (z > 0 ? 'R' : 'L')] = eP(head, eS(0.05, 10, 8), eye, 0.3, 0.12, z * 0.17); eP(head, eS(0.08, 10, 6), dark, 0.27, 0.19, z * 0.17, 0, 0, 0.2, 1.4, 0.4, 0.9); }
  const jaw = eGrp(head, 0.18, -0.2, 0); U.jaw = jaw; eP(jaw, eS(0.18, 14, 10), light, 0.15, -0.04, 0, 0, 0, 0, 1.4, 0.45, 0.9); for (const z of [-1, 1]) eP(jaw, new THREE.ConeGeometry(0.025, 0.08, 5), eL('#f4eee0'), 0.32, 0.04, z * 0.08);
  const leg = (par, x, y, z, front) => { const hip = eGrp(par, x, y, z); eP(hip, eS(0.3, 14, 12), fur, 0, 0, 0, 0, 0, 0, 1, 1.35, 1); const kn = eGrp(hip, 0, -0.42, 0); eP(kn, new THREE.CylinderGeometry(0.2, 0.17, 0.5, 12), fur, 0, -0.18, 0);
    const paw = eGrp(kn, 0.04, -0.46, 0); eP(paw, eS(0.24, 14, 10), dark, 0.05, 0, 0, 0, 0, 0, 1.3, 0.6, 1.1); for (let c = -1; c <= 1; c++) eP(paw, new THREE.ConeGeometry(0.04, 0.2, 5), claw, 0.33, -0.03, c * 0.1, 0, 0, -Math.PI / 2 - 0.25);
    if (front) eP(kn, new THREE.CylinderGeometry(0.21, 0.21, 0.18, 12), steel, 0, -0.32, 0); // steel gauntlet
    return { hip, kn, paw }; };
  for (const z of [-1, 1]) { U['fl' + (z > 0 ? 'R' : 'L')] = leg(fore, 0.55, -0.05, z * 0.46, 1); U['bl' + (z > 0 ? 'R' : 'L')] = leg(g, -0.75, 0.95, z * 0.46, 0); }
  eP(g, eS(0.14, 10, 8), fur, -1.25, 1.1, 0);
  return g;
}
function bearTick(p, g, dt) {
  const U = g.userData, sp = p._spd || 0; U.ph = (U.ph || 0) + dt * (sp > 0.3 ? 2.2 + sp * 1.3 : 0); const ph = U.ph, w = sp > 0.3 ? 1 : 0;
  const t = p._mpT != null ? p._mpT : 9, c = p._mcombo || 0, side = p._mpS ? 1 : -1, atk = t < 0.5 ? Math.sin(Math.min(1, t / 0.5) * Math.PI) : 0, roar = p._msK === 'roar' && p._msT < 1.2 ? Math.sin(Math.min(1, p._msT / 1.2) * Math.PI) : 0;
  const rear = c === 2 ? (t < 0.2 ? ease(t / 0.2) * 0.75 : t < 0.32 ? 0.75 - ease((t - 0.2) / 0.12) * 0.9 : t < 0.6 ? -0.15 * (1 - (t - 0.32) / 0.28) : 0) : atk * 0.25;
  U.fore.rotation.z = rear + roar * 0.35; U.fore.position.y = 1.0 + Math.abs(Math.sin(ph)) * 0.05 * w;
  const sw = (L, k) => { L.hip.rotation.z = Math.sin(ph + k) * 0.5 * w; L.kn.rotation.z = Math.max(0, -Math.sin(ph + k)) * 0.5 * w; };
  sw(U.flL, 0); sw(U.blR, 0.2); sw(U.flR, Math.PI); sw(U.blL, Math.PI + 0.2);
  if (atk && c < 2) { const L = side > 0 ? U.flR : U.flL; L.hip.rotation.z = 1.6 * atk - 0.4 * (t > 0.25 ? 1 : 0); L.hip.rotation.x = side * -0.6 * atk; L.kn.rotation.z = 0.2; }
  if (c === 2 && t < 0.6) for (const L of [U.flL, U.flR]) { L.hip.rotation.z = rear * 2.2; L.kn.rotation.z = 0.3; }
  U.head.rotation.z = roar * 0.45 + atk * 0.1; U.jaw.rotation.z = -(roar * 0.7 + atk * 0.3); U.head.rotation.x = roar ? Math.sin(W.t * 40) * 0.06 : 0;
  const rg = p.rageT > 0; for (const e of [U.eyeL, U.eyeR]) { e.material.color.set(rg ? '#ff3020' : '#ff8a3a'); e.scale.setScalar(rg ? 1.3 + Math.sin(W.t * 12) * 0.2 : 1); }
  if ((rg || sp > 2) && FXR() < dt * (rg ? 20 : 6)) { const pp = FXR() < 0.5 ? U.pipeL : U.pipeR; pp.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y + 0.2, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: 1.4, g: -0.4, col: rg ? '#ff7a40' : '#888888', s: 0.14, life: 0.8, smoke: 1 }); }
}

const BEAST_MK = [null, mkSnake, mkDragon, mkRabbit, mkTurtle, mkPhoenix, mkBear], BEAST_TICK = [null, snakeTick, dragonTick, rabbitTick, turtleTick, phoenixTick, bearTick];
function mkBeast(v) { const E = EVO[v], g = BEAST_MK[v](E), root = new THREE.Group(); root.add(g); root.userData = { k: v, g, S: BEAST_S[v] }; g.scale.setScalar(BEAST_S[v]); root.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); return root; }
// mech ↔ beast: returns how much of the mech to show (1 = all, 0 = hidden)
function evoDraw(p, m, dt) {
  const E = EVO[p.veh], on = !!(p.evoOn && E && inMech(p)); if (p._evT != null) p._evT += dt; const ev = p._evT != null ? p._evT : 9;
  const show = on || (E && p._evOn === 0 && ev < 0.45 && inMech(p));
  if (!show) { if (m.evo) m.evo.visible = false; return 1; }
  if (!m.evo || m.evo.userData.k !== p.veh) { if (m.evo) m.g.remove(m.evo); m.evo = mkBeast(p.veh); m.g.add(m.evo); }
  const sB = on ? ease(clamp((ev - 0.2) / 0.4, 0.02, 1)) : clamp(1 - ev / 0.4, 0, 1); m.evo.visible = sB > 0.02; m.evo.scale.setScalar(sB); m.evo.rotation.y = -p._ly;
  if (m.evo.visible) BEAST_TICK[p.veh](p, m.evo.userData.g, dt);
  return on ? clamp(1 - ev / 0.3, 0, 1) : clamp((ev - 0.3) / 0.3, 0, 1);
}
// events
function evoEvent(e) { const q = W.p[e.o]; if (!q) return; q._evT = 0; q._evOn = e.on ? 1 : 0; const E = EVO[e.v];
  sfx(e.on ? 'xform' : 'clank', e.x, e.y); shake(e.x, e.y, e.on ? 0.5 : 0.15);
  const col = E ? E.glow : '#ffffff'; fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.1, s0: 0.5, s1: e.on ? BAL.evoBurst + 0.5 : 2, life: 0.5, col, op: 0.9 }); fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z + 1.2, s0: 0.4, s1: 2.6, life: 0.45, col, op: 0.7 });
  for (let k = 0; k < (e.on ? 40 : 14); k++) { const a = FXR() * 6.28, s2 = frnd(2, 6); addP({ x: e.x, y: e.y, z: e.z + 0.5 + FXR() * 1.5, vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, vz: frnd(0, 3), g: 0.3, col, s: 0.12, life: 0.7 }); }
  if (e.on && e.o === ME && E) { const b = document.createElement('div'); b.className = 'evoban'; b.textContent = '进化 · ' + E.name; document.body.appendChild(b); setTimeout(() => b.remove(), 1900); }
}
function evoSkillFx(e) { const q = W.p[e.o], E = q && EVO[q.veh];
  if (e.t === 'venom') { sfx('smoke', e.x, e.y); for (let k = 0; k < 20; k++) { const a = FXR() * 6.28, r = FXR() * 4; addP({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, z: e.z + 0.3, vx: 0, vy: 0, vz: 0.8, g: 0.1, col: '#7ae04a', s: 0.25, life: 1.2, smoke: 1 }); } }
  else if (e.t === 'dragdash') { sfx('mdash', e.x, e.y); sfx('flame', e.x, e.y); for (let k = 0; k < 30; k++) { const d = FXR() * (e.d || 10), aa = e.a + frnd(-0.2, 0.2); addP({ x: e.x + Math.cos(e.a) * d, y: e.y + Math.sin(e.a) * d, z: e.z + 1, vx: Math.cos(aa) * 2, vy: Math.sin(aa) * 2, vz: frnd(0, 2), g: 0.4, col: FXR() < 0.5 ? '#ff8a2a' : '#ffd040', s: 0.2, life: 0.7 }); } }
  else if (e.t === 'moon') { sfx('jump', e.x, e.y); fxAdd({ kind: 'disc', x: e.e[0], y: e.e[1], z: e.z + 0.06, s0: 6, s1: 6, life: 0.95, col: '#bff8ff', op: 0.25 }); }
  else if (e.t === 'spin') { sfx('mdash', e.x, e.y); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.3, s0: 1, s1: 2.8, life: 0.4, col: '#7fffd0', op: 0.8 }); }
  else if (e.t === 'rebirth') { sfx('blood', e.x, e.y); shake(e.x, e.y, 0.5); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z, s0: 0.5, s1: 6.5, life: 0.6, col: '#ffb030', op: 0.9 }); fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z + 0.8, s0: 0.6, s1: 6, life: 0.55, col: '#ff6a1e', op: 0.5 });
    for (let k = 0; k < 60; k++) { const a = FXR() * 6.28, s2 = frnd(3, 9); addP({ x: e.x, y: e.y, z: e.z + 0.8, vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, vz: frnd(-2, 3), g: 0.2, col: FXR() < 0.5 ? '#ffd060' : '#ff4a1a', s: 0.2, life: 0.8 }); } }
  else if (e.t === 'roar') { sfx('bigdie', e.x, e.y); shake(e.x, e.y, 0.7); for (let k = 0; k < 3; k++) fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.4 + k * 0.5, s0: 1, s1: 9, life: 0.5 + k * 0.15, col: '#ffcc88', op: 0.6 }); }
  void E;
}
function evoFeathers(e) { const q = W.p[e.o]; if (q) { q._mpT = 0; q._mA = e.a; q._mAT = 0.3; } sfx('mswing', e.x, e.y);
  for (let i = 0; i + 2 < e.e.length; i += 3) { RND.tracers.push({ x: e.x, y: e.y, z: e.z, x2: e.e[i], y2: e.e[i + 1], z2: e.e[i + 2], t: 0, life: 0.12, w: 0.06, col: [1, 0.55, 0.15] }); (RND.mrk = RND.mrk || []).push({ x: e.x, y: e.y, z: e.z, e: [e.e[i], e.e[i + 1], e.e[i + 2]], T: Math.max(0.05, Math.hypot(e.e[i] - e.x, e.e[i + 1] - e.y) / 40), t: 0, kd: 'feather' }); } }
function evoMoonFx(e) { shake(e.x, e.y, 0.9); sfx('collapse', e.x, e.y); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.08, s0: 0.8, s1: e.r, life: 0.6, col: '#bff8ff', op: 0.9 }); fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z + 0.5, s0: 0.5, s1: 3.5, life: 0.4, col: '#eaffff', op: 0.6 });
  for (let k = 0; k < 50; k++) { const a = FXR() * 6.28, r = FXR() * e.r; addP({ x: e.x + Math.cos(a) * r * 0.3, y: e.y + Math.sin(a) * r * 0.3, z: e.z + 0.1, vx: Math.cos(a) * frnd(3, 8), vy: Math.sin(a) * frnd(3, 8), vz: frnd(1, 5), g: -9, col: FXR() < 0.5 ? '#9a8a70' : '#bff8ff', s: 0.15, life: 0.8 }); }
  if (typeof addDecal === 'function') addDecal(e.x, e.y, e.z + 0.02, e.r * 0.5, '#2a2a30'); }
