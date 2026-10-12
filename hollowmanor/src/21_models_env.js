/* ================= procedural environment models =================
   Every builder returns a THREE.Group whose origin is the floor center of the footprint, front facing +z.
   Children with userData.dyn stay separate (animated); everything else is merged into static batches. */
const GEO = {
  box: (w, h, d, r = 0.012) => { const m = Math.min(w, h, d); if (r < 0.006 || m < 0.02) return new THREE.BoxGeometry(w, h, d); return new THREE.RoundedBoxGeometry(w, h, d, m > 0.2 && Math.max(w, h, d) > 0.6 ? 2 : 1, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)); },
  cyl: (rt, rb, h, seg = 16, hs = 1, open = false, ts = 0, tl = TAU) => new THREE.CylinderGeometry(rt, rb, h, seg, hs, open, ts, tl),
  sph: (r, w = 14, h = 10, ps = 0, pl = TAU, ts = 0, tl = PI) => new THREE.SphereGeometry(r, w, h, ps, pl, ts, tl),
  ico: (r, d = 0) => new THREE.IcosahedronGeometry(r, d),
  tor: (R, r, arc = TAU, rs = 8, ts = 24) => new THREE.TorusGeometry(R, r, rs, ts, arc),
  cone: (r, h, seg = 16) => new THREE.ConeGeometry(r, h, seg),
  lathe: (pts, seg = 18) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg),
  plane: (w, h) => new THREE.PlaneGeometry(w, h),
  ext: (shape, depth, bevel = 0.006) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 14 }); g.translate(0, 0, -depth / 2); return g; },
};
function addM(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const bx = (p, mat, w, h, d, x, y, z, ry = 0, r = 0.012) => addM(p, GEO.box(w, h, d, r), mat, x, y, z, 0, ry);
const grp = (p, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; if (p) p.add(g); return g; };
const dyn = o => { o.userData.dyn = true; return o; };
/* turned leg profile (lathe) */
const TURNED = (h, r) => [[0, 0], [r * 0.7, 0], [r * 0.8, h * 0.06], [r * 0.55, h * 0.12], [r * 0.5, h * 0.5], [r * 0.85, h * 0.62], [r * 0.6, h * 0.7], [r * 0.95, h * 0.8], [r, h * 0.97], [0, h]];
const leg = (p, mat, h, r, x, z, y = 0) => addM(p, GEO.lathe(TURNED(h, r), 10), mat, x, y, z);
const CANDLE_FLAME = () => { if (!MATC.has('flame')) MATC.set('flame', new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); return MATC.get('flame'); };
function candle(p, x, y, z, h = 0.14, lit = true, r = 0.022) {
  addM(p, GEO.cyl(r, r * 1.05, h, 10), M.ceramic(0xe8dcc0), x, y + h / 2, z);
  addM(p, GEO.sph(r * 1.1, 8, 6), M.ceramic(0xe8dcc0), x + r * 0.6, y + h - 0.02, z, 0, 0, 0, 0.5, 1.4, 0.5); // drip
  if (lit) { const f = dyn(addM(p, GEO.sph(0.018, 8, 6), CANDLE_FLAME(), x, y + h + 0.03, z, 0, 0, 0, 0.7, 1.7, 0.7)); f.castShadow = false; f.userData.flame = true; }
}
const BOOKC = [0x5a1a14, 0x1f2f4a, 0x24402c, 0x5a4020, 0x3a1e3a, 0x6a5a40, 0x2a2a2a, 0x7a3a1a, 0x40301e];
function bookRow(p, x0, x1, y, z, depth, maxH, lean = true) {
  let x = x0;
  while (x < x1 - 0.03) {
    const w = rr(0.025, 0.06), h = rr(maxH * 0.62, maxH), d = rr(depth * 0.7, depth);
    if (x + w > x1) break;
    if (RNG() < 0.06) { x += rr(0.04, 0.12); continue; }
    const m = M.paint(pick(BOOKC), 0.85);
    if (lean && RNG() < 0.05 && x + h * 0.7 < x1) { bx(p, m, h, w, d, x + h / 2, y + w / 2, z, 0, 0.004); x += h + 0.01; continue; }
    const b = bx(p, m, w, h, d, x + w / 2, y + h / 2, z, 0, 0.004);
    if (RNG() < 0.5) addM(p, GEO.plane(w * 0.8, 0.012), M.metal(0xb89a50, 0.4, 0.8), x + w / 2, y + h * 0.8, z + d / 2 + 0.001);
    x += w + 0.002;
  }
}
const FB = {}; // furniture builders
FB.bookshelf = (o, s = 1) => {
  const g = grp(), W = 1.5 * s, H = 2.3 * (s < 1 ? 0.87 : 1), D = 0.42, wd = M.wood(0x3a2214, 0.55), back = M.wood(0x24140a, 0.8), n = s < 1 ? 4 : 5;
  bx(g, wd, 0.045, H, D, -W / 2 + 0.022, H / 2, 0); bx(g, wd, 0.045, H, D, W / 2 - 0.022, H / 2, 0);
  bx(g, back, W - 0.04, H - 0.1, 0.02, 0, H / 2, -D / 2 + 0.012);
  bx(g, wd, W + 0.08, 0.06, D + 0.06, 0, H + 0.03, 0.02); bx(g, wd, W + 0.12, 0.05, D + 0.09, 0, H + 0.085, 0.03); bx(g, wd, W + 0.03, 0.12, D + 0.03, 0, 0.06, 0.01);
  const sh = (H - 0.2) / n;
  for (let i = 0; i <= n; i++) { const y = 0.12 + i * sh; bx(g, wd, W - 0.06, 0.03, D - 0.03, 0, y, 0.012); if (i < n && !o.empty) { if (RNG() < 0.85) bookRow(g, -W / 2 + 0.06, W / 2 - 0.06, y + 0.015, 0.01, D * 0.82, sh * 0.82); else { addM(g, GEO.lathe([[0, 0], [0.05, 0], [0.07, 0.08], [0.04, 0.18], [0.05, 0.2], [0, 0.2]], 12), M.ceramic(pick([0x6a7a8a, 0x8a6a5a, 0x3a4a3a])), rr(-W / 3, W / 3), y + 0.015, 0.03); } } }
  return g;
};
FB.bookshelfS = o => FB.bookshelf(o, 0.74);
FB.wardrobe = (o, s = 1) => {
  const g = grp(), W = 1.2 * s, H = 2.15 * s, D = 0.62 * s, wd = M.wood(0x3b2213, 0.5), dk = M.wood(0x24130a, 0.6), brass = M.metal(0xb08a40, 0.35);
  bx(g, wd, W, H - 0.18, D - 0.04, 0, (H - 0.18) / 2 + 0.1, -0.02);
  bx(g, wd, W + 0.08, 0.07, D + 0.04, 0, H - 0.05, 0); bx(g, wd, W + 0.14, 0.05, D + 0.08, 0, H + 0.0, 0.01); bx(g, dk, W + 0.04, 0.1, D, 0, 0.12, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(g, GEO.lathe([[0, 0], [0.04, 0], [0.05, 0.04], [0.03, 0.08], [0, 0.08]], 8), dk, sx * (W / 2 - 0.06), 0, sz * (D / 2 - 0.06));
  // doors (animated when someone hides)
  const doors = [];
  for (const sx of [-1, 1]) {
    const hinge = dyn(grp(g, sx * (W / 2 - 0.01), 0.17, D / 2 - 0.02)); hinge.userData.side = sx;
    const leaf = grp(hinge, -sx * W / 4, 0, 0);
    bx(leaf, wd, W / 2 - 0.02, H - 0.36, 0.03, 0, (H - 0.36) / 2, 0.0);
    for (const [py, ph] of [[0.25, 0.75], [1.1, 0.55]]) { bx(leaf, dk, W / 2 - 0.14, ph * s, 0.02, 0, py * s + ph * s / 2, 0.018, 0, 0.008); bx(leaf, wd, W / 2 - 0.2, ph * s - 0.06, 0.02, 0, py * s + ph * s / 2, 0.026, 0, 0.01); }
    addM(leaf, GEO.sph(0.018, 8, 6), brass, sx * -(W / 4 - 0.05), H * 0.48, 0.035);
    addM(leaf, GEO.box(0.012, 0.03, 0.005), M.paint(0x111111), sx * -(W / 4 - 0.05), H * 0.45, 0.034);
    doors.push(hinge);
  }
  g.userData.doors = doors;
  return g;
};
FB.smallWardrobe = o => { const g = FB.wardrobe(o, 0.84); return g; };
FB.sofa = o => {
  const g = grp(), vel = M.fabric(o.c || 0x2a4a3a), wd = M.wood(0x2a1608, 0.4), btn = M.fabric(o.c || 0x2a4a3a);
  bx(g, vel, 2.0, 0.28, 0.8, 0, 0.3, 0.02, 0, 0.06);
  for (let i = -1; i <= 1; i++) bx(g, vel, 0.62, 0.14, 0.62, i * 0.64, 0.5, 0.07, 0, 0.06);
  bx(g, vel, 2.0, 0.58, 0.2, 0, 0.66, -0.32, 0, 0.08);
  addM(g, GEO.cyl(0.11, 0.11, 2.05, 16), vel, 0, 0.95, -0.32, 0, 0, HP);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) addM(g, GEO.sph(0.014, 6, 5), btn, -0.86 + k * 0.215 + (r ? 0.1 : 0), 0.62 + r * 0.16, -0.21);
  for (const sx of [-1, 1]) { bx(g, vel, 0.2, 0.42, 0.82, sx * 1.0, 0.45, 0.0, 0, 0.06); addM(g, GEO.cyl(0.12, 0.12, 0.84, 16), vel, sx * 1.0, 0.68, 0.0, HP, 0, 0); addM(g, GEO.cyl(0.115, 0.115, 0.01, 16), wd, sx * 1.0, 0.68, 0.42, HP, 0, 0); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(g, GEO.lathe([[0, 0], [0.03, 0], [0.045, 0.06], [0.035, 0.16], [0, 0.16]], 8), wd, sx * 0.95, 0, sz * 0.33);
  return g;
};
FB.armchair = o => {
  const g = grp(), vel = M.fabric(o.c || 0x5a1e22), wd = M.wood(0x2a1608, 0.4);
  bx(g, vel, 0.78, 0.22, 0.72, 0, 0.32, 0.03, 0, 0.05); bx(g, vel, 0.6, 0.1, 0.55, 0, 0.47, 0.08, 0, 0.05);
  bx(g, vel, 0.78, 0.75, 0.16, 0, 0.8, -0.3, 0, 0.06);
  for (const sx of [-1, 1]) { bx(g, vel, 0.12, 0.3, 0.66, sx * 0.36, 0.5, 0.04, 0, 0.05); addM(g, GEO.cyl(0.07, 0.07, 0.68, 12), vel, sx * 0.38, 0.66, 0.04, HP, 0, 0); bx(g, vel, 0.1, 0.5, 0.28, sx * 0.36, 0.95, -0.2, sx * 0.3, 0.05); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, wd, 0.22, 0.03, sx * 0.32, sz * 0.28);
  return g;
};
FB.coffeeTable = () => {
  const g = grp(), wd = M.wood(0x3a1e0e, 0.35);
  bx(g, wd, 1.2, 0.04, 0.6, 0, 0.43, 0, 0, 0.015); bx(g, wd, 1.08, 0.07, 0.5, 0, 0.375, 0); bx(g, wd, 1.0, 0.025, 0.42, 0, 0.1, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, wd, 0.41, 0.028, sx * 0.53, sz * 0.24);
  for (let i = 0; i < 3; i++) bx(g, M.paint(pick(BOOKC)), 0.22, 0.03, 0.16, -0.32, 0.465 + i * 0.03, 0.02, rr(-0.3, 0.3), 0.004);
  addM(g, GEO.lathe([[0, 0], [0.03, 0], [0.045, 0.05], [0.04, 0.055], [0, 0.055]], 12), M.ceramic(), 0.28, 0.45, -0.06);
  addM(g, GEO.cyl(0.07, 0.065, 0.008, 16), M.ceramic(), 0.28, 0.452, -0.06);
  return g;
};
FB.sideTable = o => {
  const g = grp(), wd = M.wood(0x3a1e0e, 0.35);
  addM(g, GEO.cyl(0.25, 0.25, 0.03, 20), wd, 0, 0.64, 0); addM(g, GEO.cyl(0.24, 0.2, 0.04, 20), wd, 0, 0.61, 0);
  addM(g, GEO.lathe([[0, 0], [0.05, 0.05], [0.03, 0.2], [0.06, 0.32], [0.035, 0.5], [0.05, 0.6], [0, 0.6]], 12), wd, 0, 0, 0);
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; addM(g, GEO.box(0.24, 0.04, 0.04), wd, Math.cos(a) * 0.12, 0.04, Math.sin(a) * 0.12, 0, -a, -0.15); }
  if (o.lamp) {
    addM(g, GEO.lathe([[0, 0], [0.07, 0], [0.08, 0.03], [0.05, 0.06], [0.06, 0.2], [0.02, 0.32], [0.015, 0.4], [0, 0.4]], 14), M.ceramic(0x6a7a6a), 0, 0.655, 0);
    const shade = addM(g, GEO.cyl(0.08, 0.17, 0.2, 20, 1, true), M.fabric(0x9a7a5a, 0.9), 0, 1.12, 0); shade.material = stdMat({ color: 0x8a6a4a, side: THREE.DoubleSide, roughness: 0.9, map: TEX.fabric }, 'shade');
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; addM(g, GEO.box(0.006, 0.03, 0.006), M.paint(0x6a4a2a), Math.cos(a) * 0.17, 1.0, Math.sin(a) * 0.17); }
  }
  return g;
};
FB.roundTable = o => {
  const g = grp(), wd = M.wood(0x3a1e0e, 0.35), r = o.small ? 0.36 : 0.45;
  addM(g, GEO.cyl(r, r, 0.04, 28), wd, 0, 0.73, 0); addM(g, GEO.cyl(r * 0.92, r * 0.88, 0.06, 28), wd, 0, 0.69, 0);
  addM(g, GEO.lathe([[0, 0], [0.18, 0], [0.2, 0.04], [0.06, 0.12], [0.045, 0.4], [0.08, 0.55], [0.05, 0.66], [0, 0.66]], 16), wd, 0, 0, 0);
  if (!o.small) { // chessboard
    const cb = grp(g, 0, 0.752, 0); bx(cb, M.wood(0x1a0c06), 0.36, 0.02, 0.36, 0, 0, 0);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) addM(cb, GEO.plane(0.04, 0.04), M.paint(0xd8c8a8, 0.5), -0.14 + i * 0.04, 0.0105, -0.14 + j * 0.04, -HP);
    for (let k = 0; k < 7; k++) addM(cb, GEO.lathe([[0, 0], [0.012, 0], [0.008, 0.02], [0.006, 0.03], [0.01, 0.035], [0, 0.045]], 8), M.paint(k % 2 ? 0xe8e0d0 : 0x151010, 0.4), rr(-0.14, 0.14), 0.01, rr(-0.14, 0.14));
  } else { addM(g, GEO.lathe([[0, 0], [0.04, 0], [0.05, 0.03], [0.02, 0.1], [0.04, 0.2], [0, 0.2]], 12), M.ceramic(0x8a9aa8), 0.08, 0.75, -0.04); }
  return g;
};
FB.fireplace = () => {
  const g = grp(), mar = stdMat({ color: 0x5a5550, roughness: 0.3, map: TEX.marble }, 'fpmarble'), dark = M.paint(0x0a0807, 1), iron = M.metal(0x1c1a18, 0.6, 0.7);
  for (const sx of [-1, 1]) { bx(g, mar, 0.32, 1.15, 0.36, sx * 0.84, 0.575, 0.06, 0, 0.02); bx(g, mar, 0.38, 0.1, 0.42, sx * 0.84, 0.05, 0.06); }
  bx(g, mar, 2.0, 0.08, 0.5, 0, 1.3, 0.07); bx(g, mar, 1.9, 0.18, 0.38, 0, 1.17, 0.05); bx(g, mar, 1.36, 0.12, 0.3, 0, 1.0, 0.05);
  bx(g, dark, 1.36, 0.95, 0.3, 0, 0.47, -0.06); bx(g, mar, 2.2, 0.05, 0.85, 0, 0.025, 0.25);
  // grate, logs, embers
  bx(g, iron, 0.8, 0.03, 0.22, 0, 0.12, 0.02); for (let i = -3; i <= 3; i++) addM(g, GEO.cyl(0.008, 0.008, 0.2, 6), iron, i * 0.12, 0.2, 0.12);
  const logM = M.wood(0x1a0f08, 0.9);
  addM(g, GEO.cyl(0.07, 0.08, 0.7, 10), logM, 0, 0.2, 0.02, 0, 0.15, HP); addM(g, GEO.cyl(0.06, 0.07, 0.6, 10), logM, 0.05, 0.31, -0.02, 0, -0.2, HP);
  const ember = stdMat({ color: 0x401000, emissive: 0xff4a10, emissiveIntensity: 1.6, roughness: 1 }, 'ember', false);
  for (let k = 0; k < 14; k++) addM(g, GEO.ico ? new THREE.IcosahedronGeometry(rr(0.02, 0.05), 0) : GEO.sph(0.03), ember, rr(-0.32, 0.32), 0.15 + rr(0, 0.05), rr(-0.05, 0.12));
  // mantel clock & candlesticks
  bx(g, M.wood(0x2a1608, 0.3), 0.28, 0.24, 0.12, 0, 1.46, 0.0, 0, 0.03); addM(g, GEO.cyl(0.08, 0.08, 0.01, 20), M.ceramic(0xeee8d8), 0, 1.48, 0.065, HP);
  for (const sx of [-1, 1]) { addM(g, GEO.lathe([[0, 0], [0.05, 0], [0.02, 0.04], [0.015, 0.2], [0.035, 0.22], [0, 0.22]], 10), M.metal(0xb08a40), sx * 0.7, 1.34, 0.02); candle(g, sx * 0.7, 1.56, 0.02, 0.1, false); }
  // poker set
  addM(g, GEO.cyl(0.008, 0.008, 0.7, 6), iron, 1.05, 0.35, 0.25, 0.08, 0, 0.1);
  return g;
};
function pianoShape() { const s = new THREE.Shape(); s.moveTo(-0.75, 0); s.lineTo(0.75, 0); s.lineTo(0.75, -0.9); s.bezierCurveTo(0.75, -1.6, 0.35, -1.95, 0.0, -2.0); s.bezierCurveTo(-0.3, -2.0, -0.42, -1.6, -0.5, -1.2); s.bezierCurveTo(-0.6, -0.8, -0.75, -0.6, -0.75, -0.4); s.lineTo(-0.75, 0); return s; }
FB.grandPiano = () => {
  const g = grp(), lac = stdMat({ color: 0x050506, roughness: 0.12, metalness: 0.1 }, 'lacquer'), ivory = M.ceramic(0xece4d0), ebony = M.paint(0x080808, 0.3), brass = M.metal(0xb89040, 0.3);
  const body = grp(g, 0, 0, 1.0); // keyboard edge at z = +1.0, tail toward −z
  const shp = pianoShape();
  const bodyGeo = GEO.ext(shp, 0.3, 0.01); bodyGeo.rotateX(HP); addM(body, bodyGeo, lac, 0, 0.82, 0);
  const lidGeo = GEO.ext(shp, 0.02, 0.004); lidGeo.rotateX(HP);
  const lidP = grp(body, 0.75, 0.985, 0); lidP.rotation.z = -0.55; addM(lidP, lidGeo, lac, -0.75, 0, 0);
  addM(body, GEO.cyl(0.008, 0.008, 0.6, 6), brass, -0.25, 1.27, -0.9, 0, 0, 0.18);
  addM(body, GEO.plane(1.2, 1.5), stdMat({ color: 0x8a6a30, metalness: 0.7, roughness: 0.35 }, 'harp'), 0.05, 0.975, -0.9, -HP);
  for (let k = 0; k < 40; k++) addM(body, GEO.box(0.003, 0.003, 1.3), M.metal(0xd0c8b0, 0.3), -0.5 + k * 0.026, 0.978, -0.85);
  bx(body, lac, 1.5, 0.08, 0.32, 0, 0.75, 0.13); bx(body, ivory, 1.3, 0.03, 0.16, 0, 0.8, 0.1, 0, 0.003);
  for (let k = 0; k < 36; k++) { if (k % 7 === 2 || k % 7 === 6) continue; bx(body, ebony, 0.018, 0.02, 0.09, -0.63 + k * 0.036 + 0.018, 0.82, 0.07, 0, 0.002); }
  bx(body, lac, 1.5, 0.12, 0.05, 0, 0.9, 0.0); bx(body, lac, 0.08, 0.14, 0.34, -0.73, 0.83, 0.12); bx(body, lac, 0.08, 0.14, 0.34, 0.73, 0.83, 0.12);
  const rest = grp(body, 0, 1.05, -0.06); rest.rotation.x = -0.25; bx(rest, lac, 0.7, 0.25, 0.02, 0, 0, 0, 0, 0.004); addM(rest, GEO.plane(0.4, 0.22), M.paint(0xd8d0b8, 0.9), 0.05, 0, 0.012);
  for (const [x, z] of [[-0.65, -0.1], [0.65, -0.1], [0.05, -1.75]]) { addM(body, GEO.lathe([[0, 0], [0.04, 0], [0.05, 0.06], [0.04, 0.3], [0.06, 0.55], [0.07, 0.68], [0, 0.68]], 12), lac, x, 0.0, z); addM(body, GEO.sph(0.03, 8, 6), brass, x, 0.02, z); }
  bx(body, lac, 0.18, 0.5, 0.05, 0, 0.35, -0.08, 0, 0.01); for (let k = -1; k <= 1; k++) bx(body, brass, 0.03, 0.01, 0.1, k * 0.05, 0.08, -0.03);
  return g;
};
FB.pianoBench = () => { const g = grp(), lac = stdMat({ color: 0x050506, roughness: 0.12, metalness: 0.1 }, 'lacquer'); bx(g, lac, 0.8, 0.06, 0.36, 0, 0.47, 0); bx(g, M.fabric(0x2a1012), 0.74, 0.04, 0.32, 0, 0.51, 0, 0, 0.02); for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, lac, 0.45, 0.025, sx * 0.34, sz * 0.14); return g; };
FB.gramophone = () => {
  const g = grp(), wd = M.wood(0x4a2210, 0.3), brass = M.metal(0xc49a48, 0.28);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, wd, 0.6, 0.025, sx * 0.2, sz * 0.2);
  bx(g, wd, 0.5, 0.04, 0.5, 0, 0.6, 0); bx(g, wd, 0.36, 0.16, 0.36, 0, 0.7, 0, 0, 0.015);
  addM(g, GEO.cyl(0.14, 0.14, 0.01, 24), M.paint(0x111111, 0.25), 0, 0.785, 0); addM(g, GEO.cyl(0.04, 0.04, 0.012, 16), M.paint(0x8a1a1a), 0, 0.79, 0);
  addM(g, GEO.cyl(0.008, 0.008, 0.16, 6), brass, 0.1, 0.83, -0.08, 0.6, 0, 0.3); addM(g, GEO.cyl(0.006, 0.006, 0.14, 6), brass, 0.12, 0.84, 0.02, HP, 0.6, 0);
  addM(g, GEO.cyl(0.01, 0.01, 0.06, 6), M.wood(0x2a1208), -0.17, 0.72, 0.1, 0, 0, HP);
  const horn = grp(g, 0.06, 0.82, -0.08); horn.rotation.x = -1.0;
  const hp = []; for (let i = 0; i <= 14; i++) { const t = i / 14; hp.push([0.015 + Math.pow(t, 3.2) * 0.26, t * 0.55]); } hp.push([0.27, 0.552]);
  const hm = addM(horn, GEO.lathe(hp, 24), stdMat({ color: 0xc49a48, metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide }, 'hornM'), 0, 0, 0);
  return g;
};
FB.musicStand = () => { const g = grp(), ir = M.metal(0x222222, 0.5, 0.6); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; addM(g, GEO.cyl(0.008, 0.008, 0.3, 6), ir, Math.cos(a) * 0.1, 0.12, Math.sin(a) * 0.1, Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); } addM(g, GEO.cyl(0.01, 0.01, 1.1, 6), ir, 0, 0.6, 0); const p = grp(g, 0, 1.15, 0); p.rotation.x = -0.35; bx(p, ir, 0.48, 0.32, 0.01, 0, 0, 0, 0, 0.003); addM(p, GEO.plane(0.4, 0.28), M.paint(0xd8d0b0, 0.9), 0, 0, 0.007); return g; };
FB.cello = () => {
  const g = grp(), wd = stdMat({ color: 0x7a3a12, roughness: 0.25, map: TEX.grain }, 'violinWood'), eb = M.paint(0x111111, 0.3);
  const s = new THREE.Shape(); s.moveTo(0, -0.38); s.bezierCurveTo(0.24, -0.38, 0.25, -0.12, 0.17, -0.04); s.bezierCurveTo(0.12, 0.02, 0.12, 0.06, 0.17, 0.12); s.bezierCurveTo(0.22, 0.22, 0.14, 0.33, 0, 0.33); s.bezierCurveTo(-0.14, 0.33, -0.22, 0.22, -0.17, 0.12); s.bezierCurveTo(-0.12, 0.06, -0.12, 0.02, -0.17, -0.04); s.bezierCurveTo(-0.25, -0.12, -0.24, -0.38, 0, -0.38);
  const lean = grp(g, 0, 0.08, 0); lean.rotation.x = -0.25;
  addM(lean, GEO.ext(s, 0.14, 0.012), wd, 0, 0.45, 0);
  bx(lean, eb, 0.05, 0.42, 0.03, 0, 0.98, 0.08, 0, 0.01); addM(lean, GEO.tor(0.03, 0.012, TAU, 6, 12), wd, 0, 1.22, 0.06, 0, HP, 0);
  for (let k = -1.5; k <= 1.5; k++) addM(lean, GEO.cyl(0.0015, 0.0015, 0.85, 3), M.metal(0xdddddd, 0.3), k * 0.012, 0.72, 0.1);
  addM(lean, GEO.cyl(0.006, 0.006, 0.12, 6), M.metal(0x999999), 0, 0.02, 0);
  bx(g, M.wood(0x2a1608), 0.4, 0.04, 0.3, 0, 0.02, 0);
  return g;
};
FB.desk = () => {
  const g = grp(), wd = M.wood(0x3a1d0c, 0.38), lea = stdMat({ color: 0x1e3a24, roughness: 0.6, map: TEX.fabric }, 'leather'), brass = M.metal(0xb08a40, 0.35);
  bx(g, wd, 1.8, 0.05, 0.9, 0, 0.775, 0, 0, 0.012); addM(g, GEO.plane(1.4, 0.6), lea, 0, 0.8005, 0.0, -HP);
  for (const sx of [-1, 1]) { bx(g, wd, 0.5, 0.72, 0.82, sx * 0.62, 0.38, 0); for (let d = 0; d < 3; d++) { bx(g, wd, 0.44, 0.19, 0.02, sx * 0.62, 0.15 + d * 0.22, 0.42, 0, 0.01); addM(g, GEO.tor(0.025, 0.005, PI, 6, 10), brass, sx * 0.62, 0.17 + d * 0.22, 0.435, 0, 0, PI); } }
  bx(g, wd, 0.74, 0.12, 0.02, 0, 0.68, 0.42); bx(g, wd, 0.74, 0.6, 0.02, 0, 0.42, -0.4);
  // decor: banker's lamp, papers, inkwell, books, candlestick
  const lamp = grp(g, -0.6, 0.8, -0.22); addM(lamp, GEO.cyl(0.07, 0.08, 0.02, 16), brass, 0, 0.01, 0); addM(lamp, GEO.cyl(0.01, 0.01, 0.28, 6), brass, 0, 0.15, 0);
  const sh = addM(lamp, GEO.cyl(0.07, 0.07, 0.24, 16, 1, false, 0, PI), stdMat({ color: 0x1a5a30, roughness: 0.15, metalness: 0.2, side: THREE.DoubleSide }, 'bankers'), 0, 0.3, 0.04, 0, 0, HP); sh.rotation.set(0, 0, HP);
  for (let k = 0; k < 6; k++) bx(g, M.paint(0xd8ceb0, 0.9), 0.21, 0.003, 0.29, rr(-0.2, 0.35), 0.803 + k * 0.002, rr(-0.15, 0.15), rr(-0.6, 0.6), 0.001);
  addM(g, GEO.lathe([[0, 0], [0.035, 0], [0.04, 0.03], [0.015, 0.05], [0.02, 0.06], [0, 0.06]], 12), M.glass(0x101820, 0.85), 0.3, 0.8, -0.28);
  addM(g, GEO.cone(0.006, 0.22, 6), M.paint(0xe8e0d0, 0.9), 0.33, 0.9, -0.28, 0.3, 0, -0.4);
  const ob = grp(g, 0.62, 0.805, 0.05); ob.rotation.y = -0.2; bx(ob, M.paint(0x3a1410), 0.34, 0.02, 0.24, 0, 0.01, 0); addM(ob, GEO.plane(0.16, 0.22), M.paint(0xe0d6bc, 0.9), -0.08, 0.026, 0, -HP, 0, 0.05); addM(ob, GEO.plane(0.16, 0.22), M.paint(0xe0d6bc, 0.9), 0.08, 0.026, 0, -HP, 0, -0.05);
  candle(g, 0.75, 0.8, -0.3, 0.12, false, 0.02); addM(g, GEO.cyl(0.04, 0.05, 0.015, 12), brass, 0.75, 0.807, -0.3);
  return g;
};
FB.chair = o => {
  const g = grp(), wd = M.wood(o.dining ? 0x3a1c0c : 0x2a1608, 0.4), up = M.fabric(o.dining ? 0x5a1a1a : 0x2a3a2a);
  if (o.office) {
    addM(g, GEO.cyl(0.03, 0.03, 0.3, 8), M.metal(0x333333), 0, 0.2, 0); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; addM(g, GEO.box(0.28, 0.03, 0.04), wd, Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14, 0, -a); }
    bx(g, stdMat({ color: 0x3a1a0e, roughness: 0.45 }, 'leatherBrown'), 0.55, 0.1, 0.5, 0, 0.45, 0, 0, 0.04); bx(g, stdMat({ color: 0x3a1a0e, roughness: 0.45 }, 'leatherBrown'), 0.55, 0.45, 0.1, 0, 0.75, -0.22, 0, 0.05);
    for (const sx of [-1, 1]) bx(g, wd, 0.06, 0.2, 0.42, sx * 0.29, 0.6, -0.02);
    return g;
  }
  bx(g, wd, 0.46, 0.04, 0.44, 0, 0.45, 0); bx(g, up, 0.42, 0.05, 0.4, 0, 0.49, 0.01, 0, 0.02);
  for (const sx of [-1, 1]) { leg(g, wd, 0.44, 0.022, sx * 0.2, 0.18); addM(g, GEO.cyl(0.018, 0.022, 0.98, 8), wd, sx * 0.2, 0.49, -0.19, -0.06, 0, 0); }
  const sp = new THREE.Shape(); sp.moveTo(-0.05, 0); sp.bezierCurveTo(-0.14, 0.12, -0.03, 0.22, -0.09, 0.36); sp.lineTo(0.09, 0.36); sp.bezierCurveTo(0.03, 0.22, 0.14, 0.12, 0.05, 0); sp.lineTo(-0.05, 0);
  addM(g, GEO.ext(sp, 0.02, 0.004), wd, 0, 0.55, -0.205, -0.06);
  bx(g, wd, 0.46, 0.07, 0.04, 0, 0.97, -0.22, 0, 0.015);
  return g;
};
function globeTex() { if (TEX.globe) return TEX.globe; const c = cnv(256, 128), g = c.getContext('2d'); g.fillStyle = '#8a7a52'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#4a3a20'; for (let k = 0; k < 14; k++) { g.beginPath(); const x = tr(0, 256), y = tr(20, 108); for (let a = 0; a < 12; a++) g.lineTo(x + Math.cos(a / 12 * TAU) * tr(8, 30), y + Math.sin(a / 12 * TAU) * tr(6, 20)); g.fill(); } g.strokeStyle = 'rgba(40,30,10,.35)'; for (let x = 0; x < 256; x += 21) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); } for (let y = 0; y < 128; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } TEX.globe = mkTex(c); return TEX.globe; }
FB.globe = () => { const g = grp(), wd = M.wood(0x3a1c0c, 0.35), brass = M.metal(0xb08a40, 0.3); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; addM(g, GEO.cyl(0.015, 0.02, 0.62, 8), wd, Math.cos(a) * 0.14, 0.3, Math.sin(a) * 0.14, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); } addM(g, GEO.tor(0.2, 0.02, TAU, 8, 32), wd, 0, 0.62, 0, HP, 0, 0); const gl = grp(g, 0, 0.82, 0); gl.rotation.z = 0.41; addM(gl, GEO.sph(0.2, 28, 18), stdMat({ map: globeTex(), roughness: 0.45 }, 'globeM'), 0, 0, 0); addM(gl, GEO.tor(0.22, 0.007, PI * 1.6, 6, 32), brass, 0, 0, 0, 0, 0, -0.9); return g; };
FB.bed = () => {
  const g = grp(), wd = M.paint(0xd8d0c0, 0.55), sheet = M.fabric(0xb8b0a0), blanket = M.fabric(0x5a6a8a);
  bx(g, wd, 0.95, 0.25, 1.9, 0, 0.25, 0); bx(g, sheet, 0.88, 0.16, 1.82, 0, 0.44, 0, 0, 0.05);
  const bl = bx(g, blanket, 0.94, 0.08, 1.2, 0, 0.53, 0.32, 0, 0.04); bl.rotation.z = 0.02; bx(g, blanket, 0.94, 0.06, 0.3, 0, 0.52, -0.25, 0.03, 0.03);
  bx(g, M.fabric(0xe0d8c8), 0.6, 0.12, 0.32, 0, 0.58, -0.7, 0, 0.06);
  for (const z of [-0.95, 0.95]) { const hh = z < 0 ? 1.0 : 0.75; bx(g, wd, 0.95, 0.06, 0.05, 0, hh, z); bx(g, wd, 0.95, 0.05, 0.05, 0, 0.3, z); for (const sx of [-1, 1]) addM(g, GEO.cyl(0.025, 0.025, hh, 10), wd, sx * 0.47, hh / 2, z); addM(g, GEO.sph(0.035, 10, 8), wd, -0.47, hh + 0.03, z); addM(g, GEO.sph(0.035, 10, 8), wd, 0.47, hh + 0.03, z); for (let k = -3; k <= 3; k++) addM(g, GEO.cyl(0.01, 0.01, hh - 0.3, 6), wd, k * 0.12, 0.3 + (hh - 0.3) / 2, z); }
  // teddy bear on the pillow
  const tb = grp(g, 0.18, 0.66, -0.55); const fur = M.fabric(0x7a5a3a); addM(tb, GEO.sph(0.07, 10, 8), fur, 0, 0, 0, 0, 0, 0, 1, 1.15, 0.9); addM(tb, GEO.sph(0.055, 10, 8), fur, 0, 0.1, 0.01); for (const sx of [-1, 1]) addM(tb, GEO.sph(0.02, 6, 5), fur, sx * 0.04, 0.15, 0.0); addM(tb, GEO.sph(0.008, 6, 4), M.paint(0x050505, 0.2), 0.02, 0.11, 0.055);
  return g;
};
FB.crib = () => {
  const g = grp(), wd = M.paint(0xcfc4b0, 0.6), w = 0.7, l = 1.2;
  bx(g, M.fabric(0xc8c0b0), w - 0.06, 0.1, l - 0.06, 0, 0.42, 0, 0, 0.03); bx(g, M.fabric(0x8a9aa8), w - 0.1, 0.04, 0.5, 0, 0.48, 0.2, 0.1, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(g, GEO.cyl(0.025, 0.025, 1.0, 10), wd, sx * w / 2, 0.5, sz * l / 2);
  for (const sx of [-1, 1]) { bx(g, wd, 0.03, 0.04, l, sx * w / 2, 0.95, 0); bx(g, wd, 0.03, 0.04, l, sx * w / 2, 0.38, 0); for (let k = 1; k < 11; k++) addM(g, GEO.cyl(0.008, 0.008, 0.56, 6), wd, sx * w / 2, 0.66, -l / 2 + k * l / 11); }
  for (const sz of [-1, 1]) { bx(g, wd, w, 0.04, 0.03, 0, 0.95, sz * l / 2); bx(g, wd, w, 0.04, 0.03, 0, 0.38, sz * l / 2); for (let k = 1; k < 6; k++) addM(g, GEO.cyl(0.008, 0.008, 0.56, 6), wd, -w / 2 + k * w / 6, 0.66, sz * l / 2); }
  // hanging mobile
  const mob = dyn(grp(g, 0, 1.45, 0)); mob.userData.spin = 0.3; addM(g, GEO.cyl(0.006, 0.006, 0.5, 6), wd, w / 2, 1.2, 0); addM(g, GEO.cyl(0.006, 0.006, 0.36, 6), wd, w / 4 + 0.04, 1.45, 0, 0, 0, HP);
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; addM(mob, GEO.cyl(0.002, 0.002, 0.14, 3), M.paint(0xcccccc), Math.cos(a) * 0.14, -0.07, Math.sin(a) * 0.14); const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.015 : 0.035, b = i / 10 * TAU; i ? st.lineTo(Math.cos(b) * r, Math.sin(b) * r) : st.moveTo(Math.cos(b) * r, Math.sin(b) * r); } addM(mob, GEO.ext(st, 0.01, 0.002), M.paint(k % 2 ? 0xd8c070 : 0xa0b8d0, 0.5), Math.cos(a) * 0.14, -0.16, Math.sin(a) * 0.14); }
  addM(mob, GEO.tor(0.14, 0.004, TAU, 4, 24), M.paint(0xcccccc), 0, 0, 0, HP, 0, 0);
  return g;
};
FB.rockingHorse = () => {
  const g = grp(), wht = M.paint(0xd8d0c0, 0.5), red = M.paint(0x8a1a1a, 0.5), wd = M.wood(0x4a2a14, 0.5);
  for (const sx of [-1, 1]) addM(g, GEO.tor(1.0, 0.025, 0.95, 6, 18), wd, sx * 0.15, 1.02, 0, 0, HP, -HP - 0.475);
  const b = grp(g, 0, 0.12, 0);
  addM(b, GEO.cap ? null : GEO.sph(0.1), wht, 0, 0.5, 0, 0, 0, 0, 1, 0.9, 2.2);
  const nk = grp(b, 0, 0.58, 0.18); nk.rotation.x = 0.5; addM(nk, GEO.cyl(0.06, 0.08, 0.26, 10), wht, 0, 0.1, 0); const hd = grp(nk, 0, 0.24, 0.02); hd.rotation.x = -1.1; addM(hd, GEO.box(0.1, 0.24, 0.12, 0.04), wht, 0, 0.08, 0); for (const sx of [-1, 1]) { addM(hd, GEO.cone(0.025, 0.06, 6), wht, sx * 0.03, -0.06, -0.06, -HP); addM(hd, GEO.sph(0.012, 6, 5), M.paint(0x050505, 0.2), sx * 0.05, 0.0, 0.02); }
  for (let k = 0; k < 8; k++) addM(nk, GEO.box(0.03, 0.05, 0.02), M.paint(0x2a1a10), 0, 0.02 + k * 0.035, -0.06);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(b, GEO.cyl(0.025, 0.02, 0.36, 8), wht, sx * 0.07, 0.25, sz * 0.15, -sz * 0.25, 0, sx * 0.15);
  bx(b, red, 0.2, 0.04, 0.16, 0, 0.6, -0.02, 0, 0.015); addM(b, GEO.cone(0.03, 0.2, 8), M.paint(0x2a1a10), 0, 0.5, -0.27, -2.2);
  for (let k = 0; k < 7; k++) addM(b, GEO.sph(0.015, 6, 4), M.paint(0x6a6a6a), rr(-0.06, 0.06), rr(0.45, 0.6), rr(-0.18, 0.18));
  return g;
};
FB.toyChest = () => { const g = grp(), w = M.paint(0x6a7a5a, 0.6), st = M.paint(0xb8a070, 0.6); bx(g, w, 0.9, 0.42, 0.5, 0, 0.21, 0); for (let k = -2; k <= 2; k++) bx(g, st, 0.04, 0.4, 0.505, k * 0.18, 0.21, 0); const lid = grp(g, 0, 0.43, -0.25); lid.rotation.x = -0.35; bx(lid, w, 0.92, 0.05, 0.52, 0, 0.0, 0.26); addM(g, GEO.sph(0.07, 10, 8), M.paint(0xb83a2a, 0.5), -0.2, 0.47, 0.0); bx(g, M.paint(0x3a5a8a), 0.12, 0.12, 0.12, 0.15, 0.46, 0.05, 0.4, 0.02); return g; };
FB.blocks = () => { const g = grp(); for (let k = 0; k < 9; k++) { const c = pick([0xa83a2a, 0x2a5a9a, 0xd8b040, 0x3a8a4a]); bx(g, M.paint(c, 0.6), 0.09, 0.09, 0.09, rr(-0.35, 0.35), 0.045 + (k > 6 ? 0.09 : 0), rr(-0.35, 0.35), rr(0, 1), 0.01); } return g; };
FB.diningTable = () => {
  const g = grp(), wd = M.wood(0x3a1a0a, 0.3), cloth = M.fabric(0x6a5a40, 0.9), silver = M.metal(0xa8a8a0, 0.3), china = M.ceramic(0xe8e2d4);
  bx(g, wd, 5.2, 0.05, 1.4, 0, 0.755, 0, 0, 0.015); bx(g, wd, 5.0, 0.1, 1.24, 0, 0.68, 0);
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) leg(g, wd, 0.66, 0.045, sx * 2.4, sz * 0.58);
  addM(g, GEO.plane(4.8, 0.45), cloth, 0, 0.782, 0, -HP);
  const cand = (x) => { addM(g, GEO.lathe([[0, 0], [0.08, 0], [0.05, 0.03], [0.02, 0.06], [0.03, 0.25], [0.015, 0.3], [0, 0.3]], 12), silver, x, 0.78, 0); for (const a of [0, TAU / 3, TAU * 2 / 3]) { const cx = x + Math.cos(a) * 0.14, cz = Math.sin(a) * 0.14; addM(g, GEO.cyl(0.006, 0.006, 0.15, 5), silver, x + Math.cos(a) * 0.07, 1.06, Math.sin(a) * 0.07, 0, -a, HP - 0.3); addM(g, GEO.cyl(0.03, 0.02, 0.03, 10), silver, cx, 1.11, cz); candle(g, cx, 1.125, cz, 0.14, false, 0.017); } candle(g, x, 1.08, 0, 0.16, false, 0.018); };
  cand(-1.2); cand(1.2);
  for (const x of [-1.9, -0.6, 0.7, 2.0]) for (const sz of [-1, 1]) { addM(g, GEO.cyl(0.13, 0.1, 0.015, 20), china, x, 0.787, sz * 0.48); addM(g, GEO.lathe([[0, 0], [0.035, 0], [0.008, 0.02], [0.006, 0.09], [0.04, 0.13], [0.045, 0.19], [0.04, 0.19], [0.0, 0.11]], 12), M.glass(0xb0a090, 0.45), x + 0.18, 0.78, sz * 0.36); addM(g, GEO.box(0.015, 0.004, 0.18), silver, x - 0.2, 0.785, sz * 0.48); }
  return g;
};
FB.chinaCabinet = () => {
  const g = grp(), wd = M.wood(0x3a1c0c, 0.4), glass = M.glass(0x9ab0c0, 0.22), china = M.ceramic(0xd8d0c0);
  bx(g, wd, 1.6, 0.9, 0.5, 0, 0.45, 0); bx(g, wd, 1.64, 0.04, 0.54, 0, 0.92, 0.01);
  for (const sx of [-1, 1]) { bx(g, wd, 0.76, 0.7, 0.02, sx * 0.39, 0.45, 0.255, 0, 0.008); bx(g, M.wood(0x2a140a, 0.5), 0.6, 0.55, 0.02, sx * 0.39, 0.45, 0.262, 0, 0.01); addM(g, GEO.sph(0.015, 8, 6), M.metal(0xb08a40), sx * 0.06, 0.5, 0.275); }
  bx(g, wd, 1.5, 1.2, 0.04, 0, 1.54, -0.18); for (const sx of [-1, 1]) bx(g, wd, 0.05, 1.2, 0.36, sx * 0.725, 1.54, -0.02);
  for (let k = 0; k < 3; k++) { bx(g, wd, 1.44, 0.025, 0.32, 0, 1.0 + k * 0.38, -0.02); for (let p = 0; p < 5; p++) { const pl = addM(g, GEO.cyl(0.1, 0.1, 0.012, 20), china, -0.56 + p * 0.28, 1.13 + k * 0.38, -0.12, HP - 0.2); } }
  bx(g, wd, 1.62, 0.08, 0.42, 0, 2.18, -0.01); bx(g, wd, 1.68, 0.05, 0.46, 0, 2.23, 0.0);
  addM(g, GEO.plane(1.42, 1.15), glass, 0, 1.54, 0.16); for (const x of [-0.36, 0, 0.36]) bx(g, wd, 0.025, 1.16, 0.02, x, 1.54, 0.165);
  return g;
};
FB.sideboard = () => {
  const g = grp(), wd = M.wood(0x3a1c0c, 0.35), silver = M.metal(0xa8a8a0, 0.3), brass = M.metal(0xb08a40, 0.35);
  bx(g, wd, 2.2, 0.82, 0.55, 0, 0.5, 0); bx(g, wd, 2.26, 0.04, 0.6, 0, 0.93, 0.01); for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, wd, 0.12, 0.03, sx * 1.05, sz * 0.24);
  for (let k = 0; k < 3; k++) { bx(g, wd, 0.68, 0.16, 0.02, -0.72 + k * 0.72, 0.8, 0.28, 0, 0.008); addM(g, GEO.tor(0.025, 0.005, PI, 6, 10), brass, -0.72 + k * 0.72, 0.8, 0.295, 0, 0, PI); bx(g, wd, 0.66, 0.5, 0.02, -0.72 + k * 0.72, 0.4, 0.28, 0, 0.01); }
  addM(g, GEO.lathe([[0, 0], [0.08, 0], [0.12, 0.06], [0.13, 0.12], [0.09, 0.16], [0.03, 0.18], [0.03, 0.2], [0, 0.2]], 16), silver, -0.5, 0.95, 0);
  for (const x of [0.3, 0.9]) { addM(g, GEO.lathe([[0, 0], [0.05, 0], [0.02, 0.04], [0.015, 0.22], [0.03, 0.24], [0, 0.24]], 10), silver, x, 0.95, -0.05); candle(g, x, 1.19, -0.05, 0.12, false, 0.018); }
  return g;
};
FB.counter = (o, sink) => {
  const g = grp(), wd = M.paint(0x4a5248, 0.6), top = stdMat({ color: 0x6a5a48, roughness: 0.5, map: TEX.grain }, 'counterTop'), brass = M.metal(0x8a8a80, 0.35);
  bx(g, wd, 1.5, 0.84, 0.6, 0, 0.42, -0.02); bx(g, top, 1.52, 0.05, 0.66, 0, 0.885, 0);
  for (const sx of [-1, 1]) { bx(g, wd, 0.7, 0.62, 0.02, sx * 0.37, 0.38, 0.285, 0, 0.01); bx(g, M.paint(0x3a4038, 0.6), 0.56, 0.48, 0.02, sx * 0.37, 0.38, 0.292, 0, 0.012); addM(g, GEO.box(0.015, 0.1, 0.02), brass, sx * 0.08, 0.55, 0.305); }
  bx(g, M.paint(0x2a2a28, 0.8), 1.5, 0.08, 0.04, 0, 0.04, 0.27);
  if (sink) { addM(g, GEO.box(0.6, 0.18, 0.42, 0.04), M.ceramic(0xe8e4dc), 0, 0.82, 0.02); addM(g, GEO.plane(0.52, 0.34), M.paint(0x1a1a18, 0.2), 0, 0.912, 0.02, -HP); addM(g, GEO.cyl(0.015, 0.015, 0.25, 8), brass, 0, 1.02, -0.26); addM(g, GEO.cyl(0.012, 0.012, 0.18, 8), brass, 0, 1.13, -0.18, HP); for (const sx of [-1, 1]) addM(g, GEO.cyl(0.02, 0.02, 0.03, 8), brass, sx * 0.1, 0.95, -0.26); }
  else { addM(g, GEO.lathe([[0, 0], [0.08, 0], [0.09, 0.12], [0.07, 0.14], [0, 0.14]], 14), M.metal(0x5a4a3a, 0.5, 0.6), rr(-0.4, 0.4), 0.91, 0); bx(g, M.wood(0x6a4a2a, 0.6), 0.38, 0.03, 0.26, rr(-0.3, 0.3), 0.925, 0.05, rr(-0.3, 0.3), 0.01); }
  return g;
};
FB.sink = o => FB.counter(o, true);
FB.stove = () => {
  const g = grp(), ir = M.metal(0x161616, 0.55, 0.6), ch = M.metal(0x9a9a92, 0.3), en = M.paint(0x2a3830, 0.35);
  bx(g, ir, 1.3, 0.85, 0.72, 0, 0.47, 0, 0, 0.03); for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(g, GEO.cyl(0.035, 0.025, 0.1, 8), ir, sx * 0.58, 0.05, sz * 0.3);
  bx(g, ir, 1.36, 0.04, 0.76, 0, 0.91, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(g, GEO.cyl(0.12, 0.12, 0.02, 20), M.metal(0x0a0a0a, 0.7, 0.4), sx * 0.3, 0.935, sz * 0.15);
  for (const sx of [-1, 1]) { bx(g, en, 0.5, 0.42, 0.03, sx * 0.3, 0.45, 0.365, 0, 0.02); addM(g, GEO.cyl(0.012, 0.012, 0.36, 8), ch, sx * 0.3, 0.7, 0.4, 0, 0, HP); }
  bx(g, ir, 1.36, 0.5, 0.08, 0, 1.18, -0.34); addM(g, GEO.cyl(0.08, 0.08, 1.8, 12), ir, 0.45, 2.0, -0.3);
  const k = grp(g, -0.3, 0.945, -0.15); addM(k, GEO.lathe([[0, 0], [0.09, 0], [0.11, 0.06], [0.1, 0.12], [0.05, 0.16], [0.02, 0.17], [0, 0.17]], 16), M.metal(0x5a3020, 0.4, 0.7), 0, 0, 0); addM(k, GEO.cyl(0.012, 0.02, 0.14, 8), M.metal(0x5a3020, 0.4, 0.7), 0.12, 0.08, 0, 0, 0, -0.9); addM(k, GEO.tor(0.06, 0.008, PI, 6, 12), M.paint(0x111111), 0, 0.17, 0, 0, HP, 0);
  return g;
};
FB.icebox = () => { const g = grp(), wd = M.wood(0x6a4422, 0.45), brass = M.metal(0xb08a40, 0.35); bx(g, wd, 0.8, 1.6, 0.7, 0, 0.85, 0, 0, 0.02); for (const sz of [-1, 1]) for (const sx of [-1, 1]) leg(g, wd, 0.06, 0.03, sx * 0.34, sz * 0.3); for (const [y, h] of [[1.3, 0.5], [0.6, 0.8]]) { bx(g, wd, 0.66, h, 0.03, 0, y, 0.36, 0, 0.01); bx(g, brass, 0.03, 0.1, 0.04, 0.26, y, 0.385); for (const dy of [-1, 1]) bx(g, brass, 0.08, 0.025, 0.03, -0.3, y + dy * h * 0.35, 0.38); } return g; };
FB.jarShelf = () => {
  const g = grp(), wd = M.wood(0x4a3020, 0.7);
  for (const sx of [-1, 1]) bx(g, wd, 0.04, 2.0, 0.34, sx * 0.78, 1.0, 0); for (let k = 0; k < 5; k++) { const y = 0.1 + k * 0.45; bx(g, wd, 1.56, 0.03, 0.32, 0, y, 0); if (k < 4) { let x = -0.7; while (x < 0.7) { const r = rr(0.04, 0.07), h = rr(0.12, 0.26), kind = RNG(); if (kind < 0.6) { addM(g, GEO.lathe([[0, 0], [r, 0], [r, h * 0.85], [r * 0.7, h * 0.9], [r * 0.7, h], [0, h]], 12), M.glass(pick([0x8a9a6a, 0x9a7a4a, 0x7a8a9a]), 0.55), x + r, y + 0.015, rr(-0.05, 0.05)); addM(g, GEO.cyl(r * 0.72, r * 0.72, 0.02, 12), M.metal(0x8a7a5a), x + r, y + 0.015 + h, 0); addM(g, GEO.cyl(r * 0.8, r * 0.8, h * 0.5, 12), M.paint(pick([0x5a2a1a, 0x7a6a2a, 0x3a4a1a]), 0.9), x + r, y + 0.015 + h * 0.27, 0); } else bx(g, M.paint(pick([0x8a3a2a, 0x3a5a7a, 0xb8a060]), 0.7), r * 2, h * 0.8, r * 1.6, x + r, y + 0.015 + h * 0.4, 0); x += r * 2 + rr(0.01, 0.05); } } }
  return g;
};
FB.kitchenTable = () => { const g = grp(), wd = stdMat({ color: 0x7a5a38, roughness: 0.75, map: TEX.grain }, 'pine'); bx(g, wd, 1.6, 0.06, 1.0, 0, 0.75, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(g, GEO.box(0.07, 0.72, 0.07), wd, sx * 0.72, 0.36, sz * 0.42); addM(g, GEO.cyl(0.18, 0.12, 0.08, 18), M.ceramic(0xd0c8b8), 0.3, 0.82, 0.1); for (let k = 0; k < 4; k++) addM(g, GEO.sph(0.035, 8, 6), M.paint(0x6a2a1a, 0.6), 0.3 + rr(-0.07, 0.07), 0.86, 0.1 + rr(-0.07, 0.07)); bx(g, wd, 0.4, 0.025, 0.25, -0.35, 0.79, -0.1, 0.4, 0.01); addM(g, GEO.box(0.2, 0.004, 0.03), M.metal(0xb0b0b0), -0.32, 0.805, -0.12, 0, 0.6); return g; };
FB.stool = () => { const g = grp(), wd = stdMat({ color: 0x7a5a38, roughness: 0.75, map: TEX.grain }, 'pine'); addM(g, GEO.cyl(0.17, 0.17, 0.04, 16), wd, 0, 0.58, 0); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; addM(g, GEO.cyl(0.018, 0.022, 0.6, 6), wd, Math.cos(a) * 0.12, 0.29, Math.sin(a) * 0.12, Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); } return g; };
FB.barrel = () => { const g = grp(), wd = stdMat({ color: 0x5a3a20, roughness: 0.8, map: TEX.grain }, 'barrelW'), ir = M.metal(0x2a2622, 0.6, 0.6); const p = []; for (let i = 0; i <= 10; i++) { const t = i / 10; p.push([0.24 + Math.sin(t * PI) * 0.06, t * 0.92]); } addM(g, GEO.lathe([[0, 0], ...p, [0, 0.92]], 20), wd, 0, 0, 0); for (const y of [0.1, 0.32, 0.6, 0.82]) addM(g, GEO.tor(0.25 + Math.sin(y / 0.92 * PI) * 0.06, 0.01, TAU, 4, 24), ir, 0, y, 0, HP, 0, 0); return g; };
FB.crate = () => { const g = grp(), wd = stdMat({ color: 0x6a5032, roughness: 0.85, map: TEX.grain }, 'crateW'); for (let k = 0; k < 4; k++) { bx(g, wd, 0.7, 0.13, 0.03, 0, 0.08 + k * 0.15, 0.335, 0, 0.005); bx(g, wd, 0.7, 0.13, 0.03, 0, 0.08 + k * 0.15, -0.335, 0, 0.005); bx(g, wd, 0.03, 0.13, 0.64, 0.335, 0.08 + k * 0.15, 0, 0, 0.005); bx(g, wd, 0.03, 0.13, 0.64, -0.335, 0.08 + k * 0.15, 0, 0, 0.005); } bx(g, wd, 0.66, 0.02, 0.66, 0, 0.6, 0); return g; };
FB.boiler = () => { const g = grp(), ir = M.metal(0x3a2a20, 0.55, 0.7), cu = M.metal(0x8a4a2a, 0.35, 0.9); addM(g, GEO.cyl(0.45, 0.45, 1.7, 24), ir, 0, 0.95, 0); addM(g, GEO.sph(0.45, 24, 10), ir, 0, 1.8, 0, 0, 0, 0, 1, 0.35, 1); for (const y of [0.3, 0.9, 1.5]) addM(g, GEO.tor(0.455, 0.015, TAU, 4, 32), ir, 0, y, 0, HP, 0, 0); for (let k = 0; k < 16; k++) addM(g, GEO.sph(0.012, 5, 4), ir, Math.cos(k / 16 * TAU) * 0.46, 1.5, Math.sin(k / 16 * TAU) * 0.46); addM(g, GEO.cyl(0.05, 0.05, 1.2, 10), cu, 0.3, 2.4, -0.2); addM(g, GEO.cyl(0.04, 0.04, 0.9, 10), cu, -0.5, 1.2, 0.0, 0, 0, HP); const ga = grp(g, 0, 1.3, 0.46); addM(ga, GEO.cyl(0.07, 0.07, 0.03, 20), M.metal(0xb08a40), 0, 0, 0, HP); addM(ga, GEO.cyl(0.06, 0.06, 0.005, 20), stdMat({ color: 0xd8d0b0, emissive: 0x302010, roughness: 0.4 }, 'gauge'), 0, 0, 0.017, HP); addM(ga, GEO.box(0.004, 0.05, 0.002), M.paint(0x8a1010), 0.01, 0.01, 0.021, 0, 0, -0.6); bx(g, ir, 0.3, 0.2, 0.03, 0, 0.35, 0.45, 0, 0.01); return g; };
FB.workbench = () => { const g = grp(), wd = stdMat({ color: 0x6a5032, roughness: 0.85, map: TEX.grain }, 'crateW'), ir = M.metal(0x3a3a3a, 0.5, 0.7); bx(g, wd, 1.6, 0.07, 0.7, 0, 0.87, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, wd, 0.07, 0.84, 0.07, sx * 0.72, 0.42, sz * 0.28); bx(g, wd, 1.5, 0.03, 0.6, 0, 0.2, 0); bx(g, ir, 0.16, 0.1, 0.14, 0.6, 0.95, 0.28); addM(g, GEO.cyl(0.01, 0.01, 0.22, 6), ir, 0.6, 0.95, 0.4, 0, 0, HP); bx(g, M.paint(0x8a1a1a, 0.5), 0.45, 0.18, 0.2, -0.45, 0.99, -0.12, 0.1, 0.015); addM(g, GEO.box(0.3, 0.025, 0.04), wd, 0.0, 0.92, 0.15, 0, 0.8); bx(g, ir, 0.1, 0.05, 0.04, 0.12, 0.92, 0.04, 0.8, 0.01); return g; };
FB.metalShelf = () => { const g = grp(), ir = M.metal(0x4a4a48, 0.6, 0.6); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, ir, 0.03, 2.0, 0.03, sx * 0.68, 1.0, sz * 0.2); for (let k = 0; k < 4; k++) { const y = 0.15 + k * 0.55; bx(g, ir, 1.4, 0.02, 0.45, 0, y, 0); let x = -0.6; while (x < 0.55) { const w = rr(0.15, 0.35); if (RNG() < 0.5) bx(g, stdMat({ color: 0x8a7050, roughness: 0.95 }, 'cardboard'), w, rr(0.15, 0.35), 0.35, x + w / 2, y + 0.12, 0, rr(-0.1, 0.1), 0.005); else addM(g, GEO.cyl(0.08, 0.08, 0.18, 14), M.paint(pick([0x6a2a1a, 0x2a4a6a, 0x8a8a7a]), 0.5), x + 0.08, y + 0.1, 0); x += w + 0.04; } } return g; };
FB.bucket = () => { const g = grp(); addM(g, GEO.lathe([[0, 0], [0.13, 0], [0.16, 0.3], [0.17, 0.31], [0, 0.31]], 16), M.metal(0x6a6a68, 0.5, 0.7), 0, 0, 0); addM(g, GEO.cyl(0.012, 0.012, 1.2, 6), M.wood(0x8a6a40), 0.06, 0.6, 0, 0, 0, -0.3); return g; };
FB.altar = () => {
  const g = grp(), st = stdMat({ color: 0x5a5650, roughness: 0.75, map: TEX.stone }, 'altarStone'), cloth = M.fabric(0xc8c0b0, 0.95), purple = M.fabric(0x3a1a4a), gold = M.metal(0xc8a040, 0.3);
  bx(g, st, 2.2, 0.95, 0.9, 0, 0.475, 0, 0, 0.02); bx(g, st, 2.3, 0.08, 1.0, 0, 0.99, 0); bx(g, st, 2.4, 0.08, 1.0, 0, 0.04, 0);
  addM(g, GEO.plane(2.32, 1.02), cloth, 0, 1.032, 0, -HP); addM(g, GEO.plane(2.32, 0.5), cloth, 0, 0.78, 0.505); addM(g, GEO.plane(0.5, 0.8), purple, 0, 0.62, 0.507);
  for (let k = 0; k < 5; k++) addM(g, GEO.plane(0.06, 0.06), gold, -0.12 + k * 0.06, 0.92, 0.509);
  // offering bowl, book, candle cluster
  addM(g, GEO.lathe([[0, 0], [0.05, 0], [0.04, 0.03], [0.14, 0.08], [0.15, 0.1], [0, 0.04]], 20), gold, 0, 1.035, 0.05);
  const bk = grp(g, -0.55, 1.04, 0.05); bk.rotation.y = 0.2; bx(bk, M.paint(0x3a1410), 0.4, 0.04, 0.3, 0, 0.02, 0); addM(bk, GEO.plane(0.19, 0.28), M.paint(0xd8ccb0, 0.95), -0.1, 0.045, 0, -HP, 0, 0.08); addM(bk, GEO.plane(0.19, 0.28), M.paint(0xd8ccb0, 0.95), 0.1, 0.045, 0, -HP, 0, -0.08);
  for (let k = 0; k < 9; k++) candle(g, 0.55 + rr(-0.2, 0.2), 1.035, rr(-0.25, 0.2), rr(0.06, 0.2), true, rr(0.015, 0.028));
  // tall backboard with arch
  const ar = new THREE.Shape(); ar.moveTo(-0.7, 0); ar.lineTo(-0.7, 1.0); ar.absarc(0, 1.0, 0.7, PI, 0, true); ar.lineTo(0.7, 0); ar.lineTo(-0.7, 0);
  addM(g, GEO.ext(ar, 0.06, 0.01), stdMat({ color: 0x2a1a10, roughness: 0.6, map: TEX.grain }, 'reredos'), 0, 1.04, -0.42);
  const inner = new THREE.Shape(); inner.moveTo(-0.55, 0); inner.lineTo(-0.55, 0.95); inner.absarc(0, 0.95, 0.55, PI, 0, true); inner.lineTo(0.55, 0); inner.lineTo(-0.55, 0);
  addM(g, GEO.ext(inner, 0.01, 0), stdMat({ color: 0x1a0e22, roughness: 0.9 }, 'reredosIn'), 0, 1.12, -0.385);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; addM(g, GEO.box(0.02, 0.22, 0.01), gold, Math.cos(a) * 0.22, 2.05 + Math.sin(a) * 0.22, -0.375, 0, 0, a + HP); }
  addM(g, GEO.tor(0.16, 0.012, TAU, 6, 32), gold, 0, 2.05, -0.375);
  return g;
};
FB.pew = () => {
  const g = grp(), wd = M.wood(0x2e180a, 0.5);
  bx(g, wd, 2.6, 0.05, 0.42, 0, 0.45, 0.05); bx(g, wd, 2.6, 0.5, 0.04, 0, 0.75, -0.2); bx(g, wd, 2.6, 0.06, 0.08, 0, 1.0, -0.2); bx(g, wd, 2.5, 0.1, 0.03, 0, 0.2, -0.18);
  const ends = new THREE.Shape(); ends.moveTo(-0.28, 0); ends.lineTo(0.22, 0); ends.lineTo(0.22, 0.5); ends.bezierCurveTo(0.22, 0.6, 0.1, 0.62, 0.05, 0.62); ends.lineTo(-0.15, 1.02); ends.bezierCurveTo(-0.22, 1.08, -0.3, 1.04, -0.28, 0.95); ends.lineTo(-0.28, 0);
  for (const sx of [-1, 1]) addM(g, GEO.ext(ends, 0.06, 0.008), wd, sx * 1.3, 0, 0.0, 0, HP, 0);
  if (RNG() < 0.5) { const bk = grp(g, rr(-0.8, 0.8), 0.475, 0.05); bk.rotation.y = rr(-1, 1); bx(bk, M.paint(0x2a1010), 0.16, 0.035, 0.22, 0, 0.02, 0, 0, 0.004); }
  return g;
};
FB.candleStand = () => { const g = grp(), ir = M.metal(0x1a1816, 0.5, 0.7); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; addM(g, GEO.tor(0.12, 0.012, PI * 0.5, 4, 8), ir, Math.cos(a) * 0.08, 0.12, Math.sin(a) * 0.08, 0, -a, 0); } addM(g, GEO.lathe([[0, 0], [0.03, 0], [0.018, 0.4], [0.03, 0.42], [0.016, 0.44], [0.016, 1.3], [0.08, 1.33], [0.09, 1.36], [0, 1.36]], 10), ir, 0, 0.08, 0); candle(g, 0, 1.44, 0, 0.16, true, 0.04); for (let k = 0; k < 8; k++) addM(g, GEO.cone(0.008, 0.04, 4), ir, Math.cos(k / 8 * TAU) * 0.085, 1.46, Math.sin(k / 8 * TAU) * 0.085); return g; };
FB.statue = () => {
  const g = grp(), st = stdMat({ color: 0x8a8680, roughness: 0.8, map: TEX.concrete, bumpMap: TEX.concrete, bumpScale: 1.5 }, 'statueStone');
  bx(g, st, 0.7, 0.3, 0.7, 0, 0.15, 0, 0, 0.02);
  const robe = []; for (let i = 0; i <= 12; i++) { const t = i / 12; robe.push([0.27 - t * 0.14 + Math.sin(t * 9) * 0.01, 0.3 + t * 1.25]); } addM(g, GEO.lathe([[0, 0.3], ...robe, [0, 1.55]], 18), st, 0, 0, 0);
  addM(g, GEO.sph(0.12, 16, 12), st, 0, 1.68, 0.02, 0, 0, 0, 0.9, 1.05, 0.95); addM(g, GEO.sph(0.14, 16, 10, 0, TAU, 0, PI / 2), st, 0, 1.7, -0.01, 0, 0, 0, 1, 1.2, 1.05);
  // hands covering the face
  for (const sx of [-1, 1]) { addM(g, GEO.cyl(0.05, 0.06, 0.45, 8), st, sx * 0.12, 1.45, 0.08, -0.9, 0, sx * 0.3); addM(g, GEO.sph(0.05, 8, 6), st, sx * 0.04, 1.67, 0.11, 0, 0, 0, 1, 1.3, 0.6); }
  const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.bezierCurveTo(0.2, 0.3, 0.45, 0.6, 0.38, 1.0); wing.bezierCurveTo(0.3, 0.7, 0.25, 0.5, 0.22, 0.2); wing.bezierCurveTo(0.18, 0.1, 0.1, -0.2, 0, -0.5); wing.lineTo(0, 0);
  for (const sx of [-1, 1]) addM(g, GEO.ext(wing, 0.05, 0.012), st, sx * 0.08, 1.2, -0.12, 0, sx > 0 ? -0.4 : PI + 0.4, 0, 1, 1, 1);
  return g;
};
function clockFace() { if (TEX.clock) return TEX.clock; const c = cnv(128, 128), g = c.getContext('2d'); g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill(); g.fillStyle = '#1a1410'; g.font = '13px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; R.forEach((r, i) => { const a = i / 12 * TAU - HP; g.fillText(r, 64 + Math.cos(a) * 48, 64 + Math.sin(a) * 48); }); g.strokeStyle = '#1a1410'; g.lineWidth = 2; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.stroke(); TEX.clock = mkTex(c); return TEX.clock; }
FB.grandClock = () => {
  const g = grp(), wd = stdMat({ color: 0x4a1e0c, roughness: 0.3, map: TEX.grain }, 'mahogany'), brass = M.metal(0xc49a48, 0.3);
  bx(g, wd, 0.6, 0.5, 0.45, 0, 0.25, 0); bx(g, wd, 0.46, 1.25, 0.34, 0, 1.12, -0.02); bx(g, wd, 0.58, 0.55, 0.42, 0, 2.0, 0); bx(g, wd, 0.64, 0.06, 0.46, 0, 2.3, 0);
  const crest = new THREE.Shape(); crest.moveTo(-0.3, 0); crest.bezierCurveTo(-0.3, 0.15, -0.1, 0.1, 0, 0.22); crest.bezierCurveTo(0.1, 0.1, 0.3, 0.15, 0.3, 0); crest.lineTo(-0.3, 0); addM(g, GEO.ext(crest, 0.04, 0.006), wd, 0, 2.32, 0.18);
  addM(g, GEO.cyl(0.19, 0.19, 0.01, 32), stdMat({ map: clockFace(), roughness: 0.4 }, 'clockface'), 0, 2.0, 0.215, HP); addM(g, GEO.tor(0.195, 0.012, TAU, 6, 32), brass, 0, 2.0, 0.22);
  const hands = dyn(grp(g, 0, 2.0, 0.227)); addM(hands, GEO.box(0.008, 0.14, 0.003), M.paint(0x0a0a0a), 0, 0.06, 0, 0, 0, 0.9); addM(hands, GEO.box(0.01, 0.1, 0.003), M.paint(0x0a0a0a), 0, 0.04, 0.002, 0, 0, -2.4); hands.userData.clockHands = true;
  addM(g, GEO.plane(0.3, 1.0), M.glass(0x90a0a8, 0.18), 0, 1.15, 0.155);
  const pend = dyn(grp(g, 0, 1.68, 0.06)); pend.userData.pendulum = true; addM(pend, GEO.box(0.015, 0.8, 0.006), brass, 0, -0.4, 0); addM(pend, GEO.cyl(0.08, 0.08, 0.02, 24), brass, 0, -0.82, 0, HP);
  for (const x of [-0.08, 0.08]) addM(g, GEO.cyl(0.025, 0.025, 0.2, 12), brass, x, 1.35, 0.0);
  for (const sx of [-1, 1]) addM(g, GEO.cyl(0.025, 0.025, 0.55, 10), wd, sx * 0.27, 2.0, 0.19);
  return g;
};
FB.centerTable = () => {
  const g = grp(), wd = stdMat({ color: 0x4a1e0c, roughness: 0.3, map: TEX.grain }, 'mahogany');
  addM(g, GEO.cyl(0.7, 0.7, 0.05, 36), wd, 0, 0.755, 0); addM(g, GEO.cyl(0.66, 0.62, 0.08, 36), wd, 0, 0.7, 0);
  addM(g, GEO.lathe([[0, 0], [0.3, 0], [0.32, 0.05], [0.1, 0.15], [0.07, 0.4], [0.13, 0.55], [0.08, 0.66], [0, 0.66]], 18), wd, 0, 0, 0);
  const vp = []; for (let i = 0; i <= 14; i++) { const t = i / 14; vp.push([0.06 + Math.sin(t * PI * 0.9) * 0.12 - (t > 0.8 ? (t - 0.8) * 0.4 : 0), t * 0.5]); } addM(g, GEO.lathe([[0, 0], ...vp, [0, 0.5]], 20), M.ceramic(0x1a2a3a), 0, 0.78, 0);
  const stem = M.paint(0x3a3220, 0.9), head = M.paint(0x4a2a28, 0.9);
  for (let k = 0; k < 11; k++) { const a = k / 11 * TAU + rr(-0.2, 0.2), lean = rr(0.15, 0.6), L = rr(0.4, 0.7); const s = grp(g, 0, 1.22, 0); s.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean); addM(s, GEO.cyl(0.004, 0.005, L, 4), stem, 0, L / 2, 0); const h = grp(s, 0, L, 0); h.rotation.x = rr(0.5, 2.0); addM(h, GEO.sph(0.035, 8, 6), head, 0, 0, 0, 0, 0, 0, 1, 0.6, 1); for (let p = 0; p < 5; p++) addM(h, GEO.box(0.03, 0.004, 0.012), head, Math.cos(p) * 0.03, -0.01, Math.sin(p) * 0.03, 0, p, 0.5); }
  for (let k = 0; k < 6; k++) addM(g, GEO.box(0.03, 0.003, 0.015), head, rr(-0.5, 0.5), 0.785, rr(-0.5, 0.5), 0, rr(0, 3));
  return g;
};
FB.coatRack = () => { const g = grp(), wd = M.wood(0x2a1608, 0.4); addM(g, GEO.lathe([[0, 0], [0.2, 0], [0.2, 0.03], [0.04, 0.06], [0.025, 1.7], [0.04, 1.75], [0, 1.8]], 12), wd, 0, 0, 0); for (let k = 0; k < 4; k++) addM(g, GEO.cyl(0.012, 0.012, 0.2, 6), wd, Math.cos(k * HP) * 0.08, 1.62, Math.sin(k * HP) * 0.08, Math.sin(k * HP) * 0.8, 0, -Math.cos(k * HP) * 0.8); const coat = grp(g, 0.12, 1.6, 0); coat.rotation.z = 0.08; addM(coat, GEO.cyl(0.12, 0.26, 1.0, 12, 1, true), stdMat({ color: 0x1a1a20, roughness: 0.95, side: THREE.DoubleSide, map: TEX.fabric }, 'coat'), 0, -0.55, 0); addM(coat, GEO.sph(0.1, 10, 6), stdMat({ color: 0x1a1a20, roughness: 0.95, map: TEX.fabric }, 'coat2'), 0, -0.04, 0, 0, 0, 0, 1.4, 0.4, 1); const hat = grp(g, -0.08, 1.76, 0); addM(hat, GEO.cyl(0.13, 0.13, 0.01, 20), M.paint(0x111111, 0.7), 0, 0, 0); addM(hat, GEO.cyl(0.075, 0.08, 0.12, 20), M.paint(0x111111, 0.7), 0, 0.06, 0); return g; };
FB.bench = () => { const g = grp(), wd = M.wood(0x2a1608, 0.4); bx(g, M.fabric(0x3a1e1e), 1.4, 0.1, 0.42, 0, 0.45, 0, 0, 0.04); bx(g, wd, 1.42, 0.06, 0.44, 0, 0.38, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, wd, 0.36, 0.025, sx * 0.62, sz * 0.17); return g; };
FB.consoleTable = () => {
  const g = grp(), wd = stdMat({ color: 0x4a1e0c, roughness: 0.3, map: TEX.grain }, 'mahogany'), brass = M.metal(0xb08a40, 0.35);
  bx(g, wd, 1.4, 0.04, 0.42, 0, 0.83, 0, 0, 0.012); bx(g, wd, 1.3, 0.13, 0.36, 0, 0.74, -0.01); addM(g, GEO.tor(0.025, 0.005, PI, 6, 10), brass, 0, 0.73, 0.18, 0, 0, PI);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, wd, 0.68, 0.025, sx * 0.62, sz * 0.16);
  const vp = []; for (let i = 0; i <= 10; i++) { const t = i / 10; vp.push([0.05 + Math.sin(t * PI) * 0.07, t * 0.32]); } addM(g, GEO.lathe([[0, 0], ...vp, [0, 0.32]], 16), M.ceramic(pick([0x2a3a4a, 0x5a2a2a, 0x3a4a3a])), -0.4, 0.85, 0);
  addM(g, GEO.lathe([[0, 0], [0.05, 0], [0.02, 0.04], [0.015, 0.2], [0.03, 0.22], [0, 0.22]], 10), M.metal(0xb08a40), 0.45, 0.85, -0.05); candle(g, 0.45, 1.07, -0.05, 0.12, false, 0.018);
  const fr = grp(g, 0.05, 0.85, -0.08); fr.rotation.x = -0.2; bx(fr, M.metal(0xb08a40, 0.3), 0.16, 0.2, 0.015, 0, 0.1, 0, 0, 0.004); addM(fr, GEO.plane(0.12, 0.16), MAT.paint[1], 0, 0.1, 0.009);
  return g;
};
FB.fern = () => { const g = grp(); addM(g, GEO.lathe([[0, 0], [0.12, 0], [0.18, 0.1], [0.2, 0.4], [0.22, 0.42], [0, 0.42]], 16), M.ceramic(0x4a3a2a), 0, 0, 0); addM(g, GEO.cyl(0.19, 0.19, 0.01, 16), M.paint(0x1a1208, 1), 0, 0.4, 0); const lf = M.paint(0x3a3a1a, 0.9), lf2 = M.paint(0x5a4220, 0.9); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + rr(-0.2, 0.2); const f = grp(g, 0, 0.42, 0); f.rotation.y = a; const L = rr(0.4, 0.7); const seg = grp(f, 0, 0, 0); seg.rotation.z = rr(0.5, 1.2); for (let s = 0; s < 6; s++) { const t = s / 6; addM(seg, GEO.box(0.06 * (1 - t * 0.6), 0.004, 0.12 * (1 - t * 0.6)), RNG() < 0.5 ? lf : lf2, 0, L * t + 0.05, 0, 0, 0, 0.2 + t * 0.4); } } return g; };
function deadTree(p, x, y, z, L, r, depth, mat) { const s = grp(p, x, y, z); addM(s, GEO.cyl(r * 0.6, r, L, 6), mat, 0, L / 2, 0); if (depth <= 0) return s; const n = depth > 2 ? 2 : 3; for (let k = 0; k < n; k++) { const c = grp(s, 0, L * rr(0.65, 0.95), 0); c.rotation.set(rr(0.3, 0.8) * (k % 2 ? 1 : -1), rr(0, TAU), rr(-0.4, 0.4)); deadTree(c, 0, 0, 0, L * rr(0.55, 0.75), r * 0.6, depth - 1, mat); } return s; }
FB.potTree = () => { const g = grp(), st = stdMat({ color: 0x6a6258, roughness: 0.8, map: TEX.concrete }, 'urn'); addM(g, GEO.lathe([[0, 0], [0.22, 0], [0.24, 0.05], [0.18, 0.1], [0.32, 0.35], [0.4, 0.55], [0.42, 0.6], [0, 0.6]], 20), st, 0, 0, 0); addM(g, GEO.cyl(0.39, 0.39, 0.01, 20), M.paint(0x1a1208, 1), 0, 0.58, 0); deadTree(g, 0, 0.58, 0, 0.7, 0.06, 4, M.wood(0x2a2018, 0.9)); return g; };
FB.potPlant = () => { const g = grp(), st = stdMat({ color: 0x6a6258, roughness: 0.8, map: TEX.concrete }, 'urn'); addM(g, GEO.lathe([[0, 0], [0.15, 0], [0.2, 0.3], [0.22, 0.34], [0, 0.34]], 16), st, 0, 0, 0); deadTree(g, 0, 0.33, 0, 0.25, 0.025, 3, M.wood(0x3a2a1a, 0.9)); return g; };
FB.planterBench = () => { const g = grp(), wd = stdMat({ color: 0x5a4a38, roughness: 0.9, map: TEX.grain }, 'weathered'); for (let k = 0; k < 4; k++) bx(g, wd, 3.2, 0.03, 0.18, 0, 0.82, -0.3 + k * 0.2, 0, 0.005); for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) bx(g, wd, 0.06, 0.82, 0.06, sx * 1.5, 0.41, sz * 0.34); bx(g, wd, 3.1, 0.03, 0.7, 0, 0.25, 0); for (let k = 0; k < 5; k++) { const x = -1.3 + k * 0.6; if (k === 3) continue; const pg = grp(g, x, 0.84, rr(-0.1, 0.1)); addM(pg, GEO.lathe([[0, 0], [0.06, 0], [0.09, 0.12], [0.095, 0.13], [0, 0.13]], 14), M.ceramic(0x8a4a2a), 0, 0, 0); deadTree(pg, 0, 0.12, 0, 0.12, 0.012, 3, M.wood(0x3a3020, 0.9)); } for (let k = 0; k < 4; k++) addM(g, GEO.lathe([[0, 0], [0.06, 0], [0.09, 0.12], [0.095, 0.13], [0, 0.13]], 14), M.ceramic(0x8a4a2a), -1.2 + k * 0.7, 0.27, rr(-0.15, 0.15)); return g; };
FB.wickerChair = () => { const g = grp(), wk = stdMat({ color: 0x8a7050, roughness: 0.9, map: TEX.fabric }, 'wicker'); addM(g, GEO.cyl(0.38, 0.3, 0.42, 20), wk, 0, 0.21, 0); addM(g, GEO.cyl(0.36, 0.36, 0.08, 20), M.fabric(0x5a6a5a), 0, 0.46, 0.02); addM(g, GEO.cyl(0.4, 0.4, 0.6, 24, 1, true, PI * 0.6, PI * 1.8), stdMat({ color: 0x8a7050, roughness: 0.9, map: TEX.fabric, side: THREE.DoubleSide }, 'wicker2'), 0, 0.72, 0, 0, PI, 0); addM(g, GEO.tor(0.4, 0.03, PI * 1.8, 6, 24), wk, 0, 1.02, 0, HP, 0, -PI * 0.4); return g; };
FB.pedestal = () => { const g = grp(), mar = stdMat({ color: 0xd8d2c8, roughness: 0.3, map: TEX.marble }, 'whiteMarble'); addM(g, GEO.lathe([[0, 0], [0.22, 0], [0.22, 0.08], [0.16, 0.12], [0.13, 0.2], [0.13, 1.1], [0.17, 1.15], [0.2, 1.2], [0, 1.2]], 20), mar, 0, 0, 0); const b = grp(g, 0, 1.2, 0); addM(b, GEO.lathe([[0, 0], [0.16, 0], [0.18, 0.12], [0.09, 0.2], [0.06, 0.26], [0, 0.26]], 18), mar, 0, 0, 0); addM(b, GEO.sph(0.11, 16, 12), mar, 0, 0.36, 0, 0, 0, 0, 0.85, 1.1, 0.95); addM(b, GEO.sph(0.115, 16, 10, 0, TAU, 0, PI / 2), mar, 0, 0.39, -0.01, 0, 0, 0, 0.9, 1, 1); addM(b, GEO.cone(0.02, 0.05, 6), mar, 0, 0.36, 0.1, HP); return g; };
FB.chevalMirror = () => { const g = grp(), wd = stdMat({ color: 0x4a1e0c, roughness: 0.3, map: TEX.grain }, 'mahogany'); for (const sx of [-1, 1]) { addM(g, GEO.lathe(TURNED(1.7, 0.03), 10), wd, sx * 0.36, 0.06, 0); bx(g, wd, 0.06, 0.06, 0.45, sx * 0.36, 0.03, 0); } const fr = grp(g, 0, 1.15, 0); fr.rotation.x = -0.08; bx(fr, wd, 0.68, 1.48, 0.04, 0, 0, -0.01, 0, 0.02); fr.userData.mirrorMount = true; return g; };
FB.rug = (o) => { const g = grp(), rot = o.d > o.w && o.pat !== 'runnerRed'; const m = addM(g, GEO.plane(rot ? o.d : o.w, rot ? o.w : o.d), MAT.rug[o.pat], 0, 0.008, 0, -HP, 0, rot ? HP : 0); m.castShadow = false; return g; };
FB.umbrella = () => { const g = grp(); addM(g, GEO.cyl(0.13, 0.11, 0.5, 16, 1, true), stdMat({ color: 0x2a3a2a, roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide }, 'umbStand'), 0, 0.25, 0); for (let k = 0; k < 2; k++) { const u = grp(g, rr(-0.05, 0.05), 0.0, rr(-0.05, 0.05)); u.rotation.set(rr(-0.15, 0.15), 0, rr(-0.15, 0.15)); addM(u, GEO.cone(0.05, 0.7, 8), M.paint(k ? 0x111111 : 0x3a1010, 0.8), 0, 0.45, 0, PI); addM(u, GEO.tor(0.04, 0.008, PI, 6, 10), M.wood(0x4a2a10), 0.04, 0.85, 0); } return g; };
FB.wateringCan = () => { const g = grp(), m = M.metal(0x4a5a4a, 0.5, 0.7); addM(g, GEO.cyl(0.1, 0.11, 0.2, 14), m, 0, 0.1, 0); addM(g, GEO.cyl(0.012, 0.02, 0.25, 6), m, 0.15, 0.15, 0, 0, 0, -0.9); addM(g, GEO.tor(0.08, 0.01, PI, 6, 10), m, -0.02, 0.2, 0, 0, 0, 0); return g; };
FB.stairs = () => {
  // 2.6 wide, 8 deep; rises from the south end (z = +4) toward the north (z = -4), up to 3 m
  const g = grp(), wd = stdMat({ color: 0x3a1c0c, roughness: 0.35, map: TEX.grain }, 'stairWood'), carpet = M.fabric(0x4a1012), iron = M.metal(0x161412, 0.45, 0.7), n = 16;
  for (let i = 0; i < n; i++) { const h = (i + 1) * (3 / n), z = 4 - (i + 0.5) * (8 / n); bx(g, wd, 2.6, 0.06, 8 / n + 0.03, 0, h, z, 0, 0.01); bx(g, wd, 2.5, h - 0.03, 0.03, 0, h / 2, z + 8 / n / 2 - 0.01); addM(g, GEO.plane(1.4, 8 / n), carpet, 0, h + 0.032, z, -HP).castShadow = false; addM(g, GEO.cyl(0.008, 0.008, 1.42, 6), M.metal(0xb08a40, 0.3), 0, h + 0.035, z + 8 / n / 2 - 0.02, 0, 0, HP); }
  bx(g, wd, 2.6, 3, 0.1, 0, 1.5, -3.95);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < n; i++) { const h = (i + 1) * (3 / n), z = 4 - (i + 0.5) * (8 / n); addM(g, GEO.lathe([[0, 0], [0.025, 0], [0.02, 0.1], [0.03, 0.2], [0.015, 0.45], [0.025, 0.8], [0.018, 0.85], [0, 0.85]], 8), wd, sx * 1.22, h, z); }
    const rail = grp(g, sx * 1.22, 0, 0); const L = Math.hypot(8, 3); const rr2 = addM(rail, GEO.box(0.08, 0.06, L + 0.3), wd, 0, 1.5 + 0.85 + 0.1, 0); rr2.rotation.x = Math.atan2(3, 8);
    addM(g, GEO.lathe([[0, 0], [0.09, 0], [0.09, 0.1], [0.06, 0.15], [0.06, 1.05], [0.09, 1.1], [0.09, 1.18], [0.05, 1.22], [0.06, 1.3], [0, 1.38]], 12), wd, sx * 1.22, 0, 4.0);
    bx(g, wd, 0.08, 3, 8, sx * 1.27, 1.5, 0).visible = true;
  }
  return g;
};
/* ---------- wall-mounted things ---------- */
const WB = {};
WB.frame = (w, h, ornate) => { const g = grp(), gold = M.metal(0xa08040, 0.38, 0.85); const t = ornate ? 0.07 : 0.05; bx(g, gold, w + t * 2, t, 0.05, 0, h / 2 + t / 2, 0, 0, 0.012); bx(g, gold, w + t * 2, t, 0.05, 0, -h / 2 - t / 2, 0, 0, 0.012); bx(g, gold, t, h, 0.05, -w / 2 - t / 2, 0, 0, 0, 0.012); bx(g, gold, t, h, 0.05, w / 2 + t / 2, 0, 0, 0, 0.012); if (ornate) { addM(g, GEO.sph(0.05, 10, 8), gold, 0, h / 2 + t + 0.03, 0, 0, 0, 0, 1.6, 1, 0.6); for (const sx of [-1, 1]) for (const sy of [-1, 1]) addM(g, GEO.sph(0.03, 8, 6), gold, sx * (w / 2 + t / 2), sy * (h / 2 + t / 2), 0.02); } return g; };
WB.painting = (i, s = 1) => { const g = grp(), w = 0.62 * s, h = 0.78 * s; g.add(WB.frame(w, h, s > 1)); addM(g, GEO.plane(w, h), MAT.paint[i % MAT.paint.length], 0, 0, 0.005); return g; };
WB.mantelMirror = () => { const g = grp(); g.add(WB.frame(1.1, 0.8, true)); return g; };
WB.wallMirror = () => { const g = grp(); g.add(WB.frame(0.8, 1.1, true)); return g; };
WB.lever = () => { const g = grp(), ir = M.metal(0x2a2622, 0.5, 0.7); bx(g, ir, 0.24, 0.42, 0.05, 0, 0, 0.0, 0, 0.01); for (const sy of [-1, 1]) for (const sx of [-1, 1]) addM(g, GEO.sph(0.012, 6, 4), M.metal(0x8a7a5a), sx * 0.09, sy * 0.17, 0.03); bx(g, ir, 0.04, 0.3, 0.02, 0, 0, 0.03); const arm = dyn(grp(g, 0, 0.12, 0.05)); arm.userData.leverArm = true; addM(arm, GEO.cyl(0.015, 0.015, 0.32, 8), ir, 0, 0.0, 0.14, HP); addM(arm, GEO.cyl(0.03, 0.03, 0.12, 10), stdMat({ color: 0x5a1010, roughness: 0.5 }, 'leverGrip'), 0, 0.0, 0.32, HP); arm.rotation.x = -0.6; return g; };
WB.fuseBox = () => { const g = grp(), ir = M.metal(0x3a4038, 0.6, 0.6); bx(g, ir, 0.5, 0.65, 0.16, 0, 0, 0.0, 0, 0.02); bx(g, M.paint(0x111111, 0.8), 0.42, 0.55, 0.01, 0, 0, 0.085); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const sl = addM(g, GEO.cyl(0.03, 0.03, 0.06, 10), M.ceramic(0xd8d0c0), -0.12 + j * 0.24, 0.18 - i * 0.12, 0.1, HP); if (i === 2 && j === 1) { sl.visible = false; sl.userData.dyn = true; sl.userData.fuseSlot = true; } } addM(g, GEO.cyl(0.01, 0.01, 0.5, 6), M.metal(0x6a4a2a, 0.4, 0.8), 0.2, 0.55, 0.0); const lamp = dyn(addM(g, GEO.sph(0.025, 10, 8), stdMat({ color: 0x400808, emissive: 0xff2010, emissiveIntensity: 0.3, roughness: 0.4 }, 'fuseLamp', false), 0.19, 0.27, 0.1)); lamp.userData.fuseLamp = true; return g; };
WB.runePanel = () => { const g = grp(), st = stdMat({ color: 0x5a5650, roughness: 0.8, map: TEX.stone }, 'altarStone'), brass = M.metal(0x8a7040, 0.35); bx(g, st, 0.56, 0.42, 0.08, 0, 0, 0, 0, 0.02); const dials = []; for (let i = 0; i < 4; i++) { const d = dyn(grp(g, -0.195 + i * 0.13, 0.02, 0.05)); addM(d, GEO.cyl(0.05, 0.05, 0.03, 6), brass, 0, 0, 0, HP); const lab = addM(d, GEO.plane(0.07, 0.07), stdMat({ map: TEX.glyph[0], transparent: true, color: 0x1a120a, roughness: 0.6 }, null, false), 0, 0, 0.017); lab.castShadow = false; d.userData.dial = i; d.userData.label = lab; dials.push(d); } g.userData.dials = dials; addM(g, GEO.box(0.5, 0.02, 0.02), brass, 0, -0.14, 0.05); return g; };
WB.dollShelf = () => { const g = grp(), wd = M.paint(0xcfc4b0, 0.6); bx(g, wd, 1.0, 0.03, 0.2, 0, 0, 0.08); for (const sx of [-1, 1]) addM(g, GEO.box(0.02, 0.12, 0.14), wd, sx * 0.4, -0.07, 0.05); for (let k = 0; k < 3; k++) { const d = makeDoll(k + 1); d.scale.setScalar(0.7); d.position.set(-0.3 + k * 0.3, 0.015, 0.1); d.rotation.y = rr(-0.3, 0.3); g.add(d); } return g; };
WB.potRack = () => { const g = grp(), ir = M.metal(0x2a2622, 0.5, 0.7), cu = M.metal(0x9a5a30, 0.3, 0.9); bx(g, ir, 1.4, 0.03, 0.4, 0, 0, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) addM(g, GEO.cyl(0.006, 0.006, 0.7, 4), ir, sx * 0.65, 0.35, sz * 0.18); for (let k = 0; k < 5; k++) { const x = -0.55 + k * 0.27; addM(g, GEO.tor(0.02, 0.004, TAU, 4, 8), ir, x, -0.04, 0); const p = grp(g, x, -0.06, 0); p.rotation.x = HP * 0.9; addM(p, GEO.lathe([[0, 0], [0.09 + k * 0.01, 0], [0.1 + k * 0.01, 0.08], [0, 0.08]], 14), cu, 0, -0.1, 0.0); addM(p, GEO.cyl(0.01, 0.01, 0.18, 6), cu, 0, -0.06, 0.0); } return g; };
/* ---------- light fixtures ---------- */
const LB = {};
const bulbMat = () => stdMat({ color: 0xfff0d0, emissive: 0xffc070, emissiveIntensity: 0.0, roughness: 0.4 }, 'bulbMat', true);
LB.chandelier = (big) => {
  const g = grp(), brass = M.metal(0xb08a40, 0.3), crys = M.glass(0xe8f0ff, 0.5), s = big ? 1.4 : 1;
  addM(g, GEO.cyl(0.008, 0.008, 0.5, 6), brass, 0, 0.25, 0); addM(g, GEO.lathe([[0, 0], [0.06 * s, 0.02], [0.08 * s, 0.1], [0.05 * s, 0.2], [0.02, 0.28], [0, 0.3]], 14), brass, 0, -0.3, 0);
  const n = big ? 8 : 6;
  for (let k = 0; k < n; k++) { const a = k / n * TAU; const arm = grp(g, 0, -0.2, 0); arm.rotation.y = -a; addM(arm, GEO.tor(0.18 * s, 0.009, PI * 0.6, 6, 12), brass, 0.18 * s, 0.0, 0, 0, 0, -PI * 0.75); addM(arm, GEO.cyl(0.03, 0.02, 0.04, 10), brass, 0.36 * s, 0.03, 0); addM(arm, GEO.cyl(0.012, 0.012, 0.08, 8), bulbMat(), 0.36 * s, 0.09, 0); addM(arm, GEO.sph(0.018, 8, 6), bulbMat(), 0.36 * s, 0.15, 0, 0, 0, 0, 1, 1.5, 1); for (let c = 0; c < 2; c++) addM(arm, GEO.cone(0.012, 0.05, 6), crys, 0.25 * s + c * 0.06, -0.06, 0, PI); }
  addM(g, GEO.tor(0.25 * s, 0.006, TAU, 4, 24), brass, 0, -0.38, 0, HP, 0, 0); for (let k = 0; k < 12; k++) addM(g, GEO.cone(0.015, 0.07, 6), crys, Math.cos(k / 12 * TAU) * 0.25 * s, -0.42, Math.sin(k / 12 * TAU) * 0.25 * s, PI);
  return g;
};
LB.chandelierBig = () => LB.chandelier(true);
LB.pendant = () => { const g = grp(); addM(g, GEO.cyl(0.006, 0.006, 0.5, 4), M.paint(0x111111), 0, 0.25, 0); addM(g, GEO.cyl(0.04, 0.2, 0.14, 20, 1, true), stdMat({ color: 0x2a3a30, roughness: 0.35, metalness: 0.3, side: THREE.DoubleSide }, 'enamel'), 0, -0.05, 0); addM(g, GEO.sph(0.04, 10, 8), bulbMat(), 0, -0.1, 0); return g; };
LB.bulb = () => { const g = grp(); addM(g, GEO.cyl(0.004, 0.004, 0.4, 4), M.paint(0x111111), 0, 0.2, 0); addM(g, GEO.cyl(0.02, 0.02, 0.04, 8), M.metal(0x8a8a80), 0, -0.02, 0); addM(g, GEO.sph(0.035, 10, 8), bulbMat(), 0, -0.07, 0, 0, 0, 0, 1, 1.3, 1); return g; };
LB.sconce = () => { const g = grp(), brass = M.metal(0xb08a40, 0.3); addM(g, GEO.cyl(0.05, 0.05, 0.02, 14), brass, 0, 0, 0.01, HP); addM(g, GEO.tor(0.08, 0.008, PI * 0.5, 6, 10), brass, 0, 0.08, 0.02, 0, HP, PI); addM(g, GEO.cyl(0.05, 0.03, 0.12, 14, 1, true), stdMat({ color: 0xf0e0c0, roughness: 0.3, transparent: true, opacity: 0.75, side: THREE.DoubleSide }, 'sconceGlass', false), 0, 0.2, 0.1); addM(g, GEO.sph(0.025, 8, 6), bulbMat(), 0, 0.17, 0.1); return g; };
/* ---------- dolls (ritual item + decor) ---------- */
function makeDoll(v = 0) {
  const g = grp(), dress = M.fabric([0x8a6a7a, 0x5a6a8a, 0x8a7a5a, 0x7a4a4a][v % 4]), skin = M.fabric(0xd8c0a8), hair = M.fabric([0x4a2a14, 0x1a1210, 0xa87a3a, 0x5a3a1a][v % 4]);
  addM(g, GEO.cone(0.07, 0.14, 12), dress, 0, 0.07, 0); addM(g, GEO.sph(0.055, 12, 10), skin, 0, 0.18, 0);
  addM(g, GEO.sph(0.058, 12, 8, 0, TAU, 0, PI * 0.6), hair, 0, 0.19, -0.005); for (const sx of [-1, 1]) addM(g, GEO.cyl(0.015, 0.01, 0.1, 6), hair, sx * 0.05, 0.14, -0.01);
  addM(g, GEO.sph(0.009, 6, 5), M.paint(0x050505, 0.3), 0.02, 0.19, 0.05); addM(g, GEO.cyl(0.008, 0.008, 0.004, 6), M.paint(0x1a1a1a, 0.4), -0.02, 0.19, 0.05, HP); // one button eye, one stitched
  for (const sx of [-1, 1]) { addM(g, GEO.cyl(0.012, 0.012, 0.08, 6), skin, sx * 0.07, 0.1, 0, 0, 0, sx * 0.5); addM(g, GEO.cyl(0.013, 0.013, 0.06, 6), skin, sx * 0.03, 0.0, 0.03, HP * 0.8, 0, 0); }
  return g;
}
