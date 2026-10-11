/* ================= procedural 3D models (three.js) ================= */
const GRAD = (() => { const d = new Uint8Array([105, 105, 105, 255, 185, 185, 185, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const MATC = new Map();
function toon(color, o) {
  const key = color + '|' + (o ? JSON.stringify(o) : '');
  if (!o || !o.unique) { const c = MATC.get(key); if (c) return c; }
  const m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: GRAD }, o || {}));
  if (!o || !o.unique) MATC.set(key, m); return m;
}
const glow = (color, k = 1.4) => toon(color, { emissive: color, emissiveIntensity: k });
const basic = c => { const k = 'b' + c; if (!MATC.has(k)) MATC.set(k, new THREE.MeshBasicMaterial({ color: c })); return MATC.get(k); };
function makeOutlineMat(th, color = 0x2a1c26) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + th.toFixed(4) + ';'); };
  m.customProgramCacheKey = () => 'ol' + th;
  return m;
}
const OUTLINE = makeOutlineMat(0.024);
const OUTLINE_THIN = makeOutlineMat(0.014);

/* geometry helpers (scale baked into geometry so outlines stay even) */
const GEO = {
  sph: (r, sx = 1, sy = 1, sz = 1, w = r > 0.15 ? 18 : 12, h = r > 0.15 ? 12 : 8) => new THREE.SphereGeometry(r, w, h).scale(sx, sy, sz),
  half: (r, sx = 1, sy = 1, sz = 1) => new THREE.SphereGeometry(r, 20, 10, 0, TAU, 0, Math.PI / 2).scale(sx, sy, sz),
  cap: (r, len, sx = 1, sz = 1) => new THREE.CapsuleGeometry(r, len, 4, 10).scale(sx, 1, sz),
  cyl: (rt, rb, h, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg),
  box: (w, h, d, r = 0.04) => new THREE.RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)),
  cone: (r, h, seg = 14) => new THREE.ConeGeometry(r, h, seg),
  tor: (R, r, arc = TAU, rs = 8, ts = 24) => new THREE.TorusGeometry(R, r, rs, ts, arc),
  ico: (r, d = 0) => new THREE.IcosahedronGeometry(r, d),
  dod: r => new THREE.DodecahedronGeometry(r, 0),
};
function P(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, ol = OUTLINE) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true;
  if (ol) { const o = new THREE.Mesh(geo, ol); o.userData.outline = true; m.add(o); }
  parent.add(m); return m;
}
function G0(parent, name, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); return g; }

function baseRig(o) {
  const root = new THREE.Group();
  const s = o.scale || 1; root.userData.scale = s;
  const body = G0(root, 'body'); body.scale.setScalar(s);
  const hips = G0(body, 'hips', 0, o.hipY || 0.36, 0);
  const legL = G0(hips, 'legL', o.legX || 0.13, 0, 0), legR = G0(hips, 'legR', -(o.legX || 0.13), 0, 0);
  const torso = G0(hips, 'torso', 0, 0.04, 0);
  const head = G0(torso, 'head', 0, o.headY || 0.62, 0);
  const armL = G0(torso, 'armL', o.shX || 0.27, o.shY || 0.32, 0), armR = G0(torso, 'armR', -(o.shX || 0.27), o.shY || 0.32, 0);
  return { root, body, hips, legL, legR, torso, head, armL, armR };
}
function legs(r, pant, shoe, o = {}) {
  const lr = o.r || 0.085, len = (o.hip || 0.36) - 0.16;
  for (const L of [r.legL, r.legR]) {
    P(L, GEO.cap(lr, len * 0.7), toon(pant), 0, -len * 0.5 - 0.02, 0);
    P(L, GEO.box(lr * 2.3, 0.12, lr * 3.2, 0.05), toon(shoe), 0, -(o.hip || 0.36) + 0.06, 0.04);
  }
}
function arms(r, sleeve, hand, o = {}) {
  const ar = o.r || 0.07;
  for (const A of [r.armL, r.armR]) {
    P(A, GEO.cap(ar, 0.14), toon(sleeve), 0, -0.12, 0);
    P(A, GEO.sph(o.hr || 0.085), toon(hand), 0, -0.27, 0);
  }
}
function eyes(h, o = {}) {
  const y = o.y || 0.03, x = o.x || 0.105, z = o.z || 0.255, s = o.s || 1;
  for (const sx of [1, -1]) {
    P(h, GEO.sph(0.068 * s, 0.85, 1.15, 0.55), basic(0xffffff), sx * x, y, z, 0, sx * 0.18, 0, OUTLINE_THIN);
    P(h, GEO.sph(0.042 * s, 0.85, 1.1, 0.5), basic(o.pupil || 0x1d1626), sx * x, y - 0.004, z + 0.03 * s, 0, sx * 0.18, 0, null);
    P(h, GEO.sph(0.014 * s), basic(0xffffff), sx * x + 0.015, y + 0.025 * s, z + 0.05 * s, 0, 0, 0, null);
  }
}
function weaponGroup(arm) { const w = G0(arm, 'weapon', 0, -0.28, 0.02); w.rotation.x = Math.PI / 2; return w; }

/* ---------- heroes ---------- */
const HERO_BUILD = {
  anvil() {
    const r = baseRig({ scale: 1.06 }), skin = 0xf2c29b;
    legs(r, 0x34495e, 0x4a2f22);
    P(r.torso, GEO.box(0.52, 0.44, 0.4, 0.15), toon(0x2f6ea8), 0, 0.22, 0);
    P(r.torso, GEO.box(0.42, 0.3, 0.08, 0.04), toon(0xf08a24), 0, 0.15, 0.17);
    P(r.torso, GEO.box(0.54, 0.08, 0.42, 0.03), toon(0x5a3a24), 0, 0.04, 0);
    P(r.torso, GEO.box(0.09, 0.07, 0.04, 0.015), toon(0xf2c94c), 0, 0.04, 0.215, 0, 0, 0, null);
    for (const sx of [1, -1]) P(r.torso, GEO.box(0.07, 0.34, 0.44, 0.03), toon(0xf08a24), sx * 0.15, 0.27, 0);
    P(r.torso, GEO.box(0.34, 0.3, 0.16, 0.05), toon(0xb33a2a), 0, 0.25, -0.26);
    P(r.torso, GEO.cyl(0.03, 0.03, 0.36), toon(0x9aa3ad), 0.1, 0.42, -0.3, 0, 0, 0.3);
    const h = r.head;
    P(h, GEO.sph(0.29, 1, 0.94, 1), toon(skin));
    P(h, GEO.sph(0.25, 1.05, 0.62, 0.9), toon(0x7a4a2a), 0, -0.13, 0.08);
    P(h, GEO.sph(0.065, 1.1, 0.9, 1), toon(0xe89a78), 0, -0.02, 0.29);
    eyes(h, { y: 0.04, z: 0.245 });
    for (const sx of [1, -1]) P(h, GEO.box(0.12, 0.035, 0.04, 0.015), toon(0x4a2c18), sx * 0.105, 0.115, 0.27, 0, 0, sx * -0.15, null);
    P(h, GEO.half(0.3, 1, 0.92, 1), toon(0xffc933), 0, 0.13, -0.02);
    P(h, GEO.cyl(0.35, 0.35, 0.035, 24), toon(0xffc933), 0, 0.14, 0.02);
    P(h, GEO.cyl(0.05, 0.05, 0.06), toon(0x6d6d6d), 0, 0.27, 0.25, Math.PI / 2 - 0.4);
    P(h, GEO.cyl(0.035, 0.035, 0.02), glow(0xfff3a0, 1.2), 0, 0.285, 0.285, Math.PI / 2 - 0.4, 0, 0, null);
    arms(r, 0x2f6ea8, 0x6b4423, { hr: 0.095 });
    const w = weaponGroup(r.armR);
    P(w, GEO.box(0.11, 0.13, 0.3, 0.04), toon(0x8b5a2b), 0, 0, -0.06);
    P(w, GEO.cyl(0.055, 0.055, 0.44), toon(0x9aa3ad), 0, 0.02, 0.28, Math.PI / 2);
    P(w, GEO.cyl(0.12, 0.06, 0.14), toon(0xd4a640), 0, 0.02, 0.55, Math.PI / 2);
    P(w, GEO.cyl(0.07, 0.07, 0.04), toon(0xd4a640), 0, 0.02, 0.18, Math.PI / 2);
    r.style = 'gun2';
    return r;
  },
  vixen() {
    const r = baseRig({ scale: 0.98 }), skin = 0xf6d2b5, teal = 0x23a08f, orange = 0xf07f2a;
    legs(r, 0x5b3a2a, 0x3d2a20, { r: 0.075 });
    P(r.torso, GEO.cyl(0.19, 0.27, 0.44, 18), toon(teal), 0, 0.18, 0);
    P(r.torso, GEO.cyl(0.28, 0.28, 0.06, 18), toon(0x6b4226), 0, 0.03, 0);
    P(r.torso, GEO.tor(0.17, 0.06, TAU, 8, 20), toon(0xf3e2c0), 0, 0.41, 0, Math.PI / 2);
    P(r.torso, GEO.cyl(0.075, 0.075, 0.38), toon(0x7a4a26), 0.08, 0.27, -0.24, 0.25, 0, -0.35);
    for (const dx of [-0.03, 0.03]) P(r.torso, GEO.cone(0.035, 0.09, 6), toon(0xf8f4e6), 0.15 + dx, 0.5, -0.31, 0.25, 0, -0.35, null);
    // tail
    const tail = G0(r.hips, 'tail', 0, 0.06, -0.2); tail.rotation.x = -0.7;
    P(tail, GEO.sph(0.15, 0.85, 0.85, 1.7), toon(orange), 0, 0, -0.18);
    P(tail, GEO.sph(0.1, 0.9, 0.9, 1), toon(0xfff6ea), 0, 0, -0.42);
    const h = r.head;
    P(h, GEO.sph(0.28, 1, 0.94, 1), toon(skin));
    for (const [x, y, z] of [[0.11, 0.17, 0.2], [0, 0.2, 0.21], [-0.11, 0.17, 0.2]]) P(h, GEO.sph(0.09, 1, 0.8, 0.8), toon(orange), x, y, z, 0, 0, 0, null);
    eyes(h, { y: 0.02, z: 0.235, pupil: 0x16594e });
    P(h, GEO.sph(0.025, 1.4, 0.6, 1), toon(0xd9826b), 0, -0.08, 0.265, 0, 0, 0, null);
    const hood = new THREE.SphereGeometry(0.335, 22, 14, Math.PI / 2 + 0.95, TAU - 1.9, 0, Math.PI * 0.82);
    P(h, hood, toon(teal, { side: THREE.DoubleSide }), 0, 0.02, -0.01);
    for (const sx of [1, -1]) {
      P(h, GEO.cone(0.1, 0.22, 4), toon(orange), sx * 0.17, 0.33, -0.02, 0, Math.PI / 4, sx * -0.38);
      P(h, GEO.cone(0.055, 0.13, 4), toon(0xfff1e0), sx * 0.165, 0.31, 0.035, 0, Math.PI / 4, sx * -0.38, null);
    }
    arms(r, teal, skin, { r: 0.062, hr: 0.075 });
    const w = weaponGroup(r.armR);
    P(w, GEO.box(0.07, 0.08, 0.42, 0.03), toon(0x8b5a2b), 0, 0, 0.08);
    P(w, GEO.tor(0.24, 0.022, Math.PI, 6, 18), toon(0x5a3a22), 0, 0, 0.18, -Math.PI / 2, 0, 0);
    P(w, GEO.cyl(0.006, 0.006, 0.48, 4), basic(0xf4efe0), 0, 0, 0.18, 0, 0, Math.PI / 2, null);
    P(w, GEO.cyl(0.012, 0.012, 0.36, 6), toon(0xe9e2cf), 0, 0.05, 0.22, Math.PI / 2, 0, 0, null);
    P(w, GEO.cone(0.03, 0.08, 6), glow(0x55f0d8, 1.0), 0, 0.05, 0.42, Math.PI / 2, 0, 0, null);
    r.style = 'gun2';
    return r;
  },
  magma() {
    const r = baseRig({ scale: 1.14, hipY: 0.34, shX: 0.36, shY: 0.36, headY: 0.66, legX: 0.15 }), rock = 0x4b4453, dark = 0x332e3a, lava = 0xff6a1a;
    legs(r, dark, rock, { r: 0.11, hip: 0.34 });
    P(r.torso, GEO.box(0.64, 0.52, 0.48, 0.16), toon(rock), 0, 0.25, 0);
    for (const [x, y, rz, l] of [[0.1, 0.3, 0.7, 0.2], [-0.05, 0.22, -0.5, 0.22], [0.05, 0.12, 0.4, 0.16], [-0.14, 0.35, 0.3, 0.14]]) P(r.torso, GEO.box(l, 0.035, 0.03, 0.012), glow(lava, 1.6), x, y, 0.245, 0, 0, rz, null);
    P(r.torso, GEO.sph(0.09), glow(0xffa53a, 1.8), 0, 0.24, 0.215, 0, 0, 0, null);
    for (const sx of [1, -1]) { P(r.torso, GEO.dod(0.2), toon(0x5c5466), sx * 0.34, 0.46, 0, 0.3, sx, 0.2); P(r.torso, GEO.sph(0.05), glow(lava, 1.6), sx * 0.38, 0.6, 0.06, 0, 0, 0, null); }
    P(r.torso, GEO.cyl(0.14, 0.14, 0.42), toon(0x7d8590), 0, 0.3, -0.33);
    P(r.torso, GEO.cyl(0.145, 0.145, 0.06), toon(0xe0542a), 0, 0.36, -0.33);
    P(r.torso, GEO.half(0.14), toon(0x7d8590), 0, 0.51, -0.33);
    const h = r.head;
    P(h, GEO.box(0.4, 0.34, 0.36, 0.12), toon(rock));
    P(h, GEO.box(0.42, 0.08, 0.1, 0.03), toon(dark), 0, 0.08, 0.15);
    for (const sx of [1, -1]) P(h, GEO.box(0.09, 0.05, 0.03, 0.015), glow(0xffd54a, 2.2), sx * 0.09, 0.02, 0.18, 0, 0, sx * 0.15, null);
    P(h, GEO.box(0.2, 0.03, 0.03, 0.01), glow(lava, 1.4), 0, -0.08, 0.18, 0, 0, 0, null);
    for (const [x, z, s] of [[0.1, 0.03, 0.07], [-0.07, -0.05, 0.08], [0.0, 0.08, 0.06]]) P(h, GEO.ico(s), glow(lava, 1.6), x, 0.19, z, 0, 0, 0, null);
    arms(r, dark, rock, { r: 0.1, hr: 0.12 });
    const w = weaponGroup(r.armR);
    P(w, GEO.cyl(0.08, 0.1, 0.42), toon(0x5f6670), 0, 0, 0.16, Math.PI / 2);
    P(w, GEO.cyl(0.11, 0.09, 0.08), toon(0xe0542a), 0, 0, 0.38, Math.PI / 2);
    P(w, GEO.sph(0.045), glow(0x7fd0ff, 2), 0, 0.0, 0.45, 0, 0, 0, null);
    r.style = 'gun2';
    return r;
  },
  boomcat() {
    const r = baseRig({ scale: 0.98 }), fur = 0xf4a259, cream = 0xfff1de, purple = 0x7b4bc4;
    legs(r, purple, 0x3a2a4a, { r: 0.075 });
    P(r.torso, GEO.box(0.44, 0.42, 0.36, 0.14), toon(purple), 0, 0.21, 0);
    P(r.torso, GEO.box(0.46, 0.07, 0.38, 0.03), toon(0x3a2a4a), 0, 0.06, 0);
    for (const x of [-0.13, 0, 0.13]) { P(r.torso, GEO.sph(0.055), toon(0x2b2b3a), x, 0.06, 0.2); P(r.torso, GEO.cyl(0.008, 0.008, 0.05, 5), basic(0xd8b26e), x, 0.12, 0.2, 0, 0, 0, null); }
    P(r.torso, GEO.box(0.2, 0.18, 0.06, 0.03), toon(0xf2d14b), 0, 0.27, 0.18);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.05, -0.15), new THREE.Vector3(0, 0.12, -0.35), new THREE.Vector3(0.05, 0.35, -0.45), new THREE.Vector3(0.12, 0.52, -0.38)]);
    P(r.hips, new THREE.TubeGeometry(curve, 16, 0.045, 8), toon(fur), 0, 0, 0);
    P(r.hips, GEO.sph(0.06), toon(0x8a5a33), 0.12, 0.52, -0.38);
    const h = r.head;
    P(h, GEO.sph(0.3, 1.05, 0.92, 1), toon(fur));
    P(h, GEO.sph(0.14, 1.25, 0.75, 0.8), toon(cream), 0, -0.08, 0.2);
    P(h, GEO.sph(0.03, 1.3, 0.8, 1), toon(0xff7aa2), 0, -0.03, 0.31, 0, 0, 0, null);
    for (const sx of [1, -1]) {
      P(h, GEO.cone(0.12, 0.2, 4), toon(fur), sx * 0.18, 0.26, 0, 0, Math.PI / 4, sx * -0.35);
      P(h, GEO.cone(0.065, 0.12, 4), toon(0xffa6c1), sx * 0.175, 0.24, 0.05, 0, Math.PI / 4, sx * -0.35, null);
      for (const dy of [-0.02, 0.02]) P(h, GEO.box(0.16, 0.008, 0.008, 0.003), basic(0x4a3426), sx * 0.2, -0.06 + dy, 0.24, 0, 0, sx * dy * 4, null);
      for (const dx of [0.03, 0.09]) P(h, GEO.box(0.018, 0.07, 0.02, 0.008), toon(0xc87a3a), sx * dx, 0.2, 0.22, 0.3, 0, 0, null);
    }
    eyes(h, { y: 0.04, z: 0.245, pupil: 0x234a24, s: 1.05 });
    P(h, GEO.tor(0.3, 0.025, TAU, 6, 28), toon(0x5a3a26), 0, 0.15, 0, Math.PI / 2 - 0.25);
    for (const sx of [1, -1]) { P(h, GEO.tor(0.06, 0.02, TAU, 6, 16), toon(0x8b6a3a), sx * 0.09, 0.2, 0.25, -0.25); P(h, GEO.cyl(0.055, 0.055, 0.02, 14), toon(0x7fd3ff, { emissive: 0x2a7fb0, emissiveIntensity: 0.4 }), sx * 0.09, 0.2, 0.25, Math.PI / 2 - 0.25, 0, 0, null); }
    arms(r, purple, cream, { r: 0.065, hr: 0.08 });
    const w = weaponGroup(r.armR);
    P(w, GEO.sph(0.11), toon(0x2b2b3a), 0, 0, 0.08);
    P(w, GEO.sph(0.03), basic(0xe8e8f0), 0.04, -0.06, 0.13, 0, 0, 0, null);
    P(w, GEO.cyl(0.012, 0.012, 0.07, 5), toon(0xd8b26e), 0, -0.1, 0.08, 0, 0, 0, null);
    P(w, GEO.sph(0.03), glow(0xffd54a, 2.5), 0, -0.14, 0.08, 0, 0, 0, null);
    r.style = 'throw';
    return r;
  },
  kite() {
    const r = baseRig({ scale: 1.0 }), skin = 0xf3c9a8, red = 0xd62839, gold = 0xf2c14e;
    legs(r, 0x2b2d42, 0x5c3a21, { r: 0.075 });
    P(r.torso, GEO.cyl(0.21, 0.3, 0.5, 20), toon(red), 0, 0.15, 0);
    P(r.torso, GEO.box(0.16, 0.3, 0.06, 0.03), toon(0xf6f1e6), 0, 0.26, 0.17);
    for (const y of [0.18, 0.26, 0.34]) for (const sx of [1, -1]) P(r.torso, GEO.sph(0.018), toon(gold), sx * 0.11, y, 0.2, 0, 0, 0, null);
    P(r.torso, GEO.cyl(0.255, 0.27, 0.06, 20), toon(0x231f20), 0, 0.08, 0);
    P(r.torso, GEO.box(0.08, 0.06, 0.03, 0.01), toon(gold), 0, 0.08, 0.27, 0, 0, 0, null);
    P(r.torso, GEO.tor(0.16, 0.055, TAU, 8, 20), toon(0xf6f1e6), 0, 0.42, 0.01, Math.PI / 2);
    for (const sx of [1, -1]) P(r.torso, GEO.sph(0.1, 1.2, 0.6, 1), toon(gold), sx * 0.24, 0.4, 0, 0, 0, 0);
    const h = r.head;
    P(h, GEO.sph(0.28, 1, 0.94, 1), toon(skin));
    P(h, GEO.half(0.3, 1.02, 0.85, 1.02), toon(0x3b2618), 0, 0.02, -0.02, -0.3);
    P(h, GEO.sph(0.11, 0.9, 0.9, 1.6), toon(0x3b2618), 0, -0.02, -0.33, -0.5);
    eyes(h, { y: 0.02, z: 0.24, pupil: 0x3a2412 });
    P(h, GEO.box(0.07, 0.016, 0.02, 0.006), basic(0x8a3b2a), 0.02, -0.1, 0.26, 0, 0, 0.2, null);
    const hat = G0(h, 'hat', 0, 0.2, 0);
    P(hat, GEO.cyl(0.36, 0.38, 0.05, 3), toon(0x231f20), 0, 0, 0, 0, Math.PI / 6);
    P(hat, GEO.tor(0.34, 0.022, TAU, 6, 3), toon(gold), 0, 0.03, 0, Math.PI / 2, 0, Math.PI / 6, null);
    P(hat, GEO.cyl(0.2, 0.24, 0.2, 16), toon(0x231f20), 0, 0.1, 0);
    P(hat, GEO.sph(0.05, 1, 0.6, 3.2), toon(0xf6f1e6), 0.2, 0.17, -0.05, 0.4, 0, -0.5);
    P(hat, GEO.sph(0.045), toon(gold), 0, 0.12, 0.22, 0, 0, 0, null);
    arms(r, red, 0x3b2a22, { r: 0.065, hr: 0.075 });
    for (const arm of [r.armR, r.armL]) {
      const w = weaponGroup(arm); if (arm === r.armL) w.name = 'weapon2';
      P(w, GEO.box(0.05, 0.11, 0.07, 0.02), toon(0x6b3d1f), 0, 0.04, -0.02, 0.4);
      P(w, GEO.cyl(0.03, 0.03, 0.26, 10), toon(0xa0a7b0), 0, 0, 0.12, Math.PI / 2);
      P(w, GEO.cyl(0.04, 0.04, 0.04, 10), toon(gold), 0, 0, 0.25, Math.PI / 2, 0, 0, null);
    }
    r.style = 'dual';
    return r;
  },
  sprocket() {
    const r = baseRig({ scale: 0.98 }), white = 0xf2f5fb, blue = 0x3a86ff, dark = 0x2b2f3a;
    legs(r, dark, white, { r: 0.07 });
    P(r.torso, GEO.box(0.42, 0.4, 0.34, 0.13), toon(white), 0, 0.2, 0);
    P(r.torso, GEO.box(0.28, 0.2, 0.06, 0.04), toon(blue), 0, 0.22, 0.16);
    P(r.torso, GEO.cyl(0.06, 0.06, 0.02, 16), glow(0x5ef2ff, 1.8), 0, 0.22, 0.2, Math.PI / 2, 0, 0, null);
    P(r.torso, GEO.box(0.3, 0.32, 0.18, 0.06), toon(blue), 0, 0.24, -0.23);
    P(r.torso, GEO.cyl(0.012, 0.012, 0.3, 6), toon(0x9aa3ad), 0.09, 0.5, -0.25, 0, 0, 0, null);
    P(r.torso, GEO.sph(0.035), glow(0xff4757, 2), 0.09, 0.66, -0.25, 0, 0, 0, null);
    const h = r.head;
    P(h, GEO.sph(0.3, 1.04, 0.95, 1), toon(white));
    P(h, GEO.box(0.42, 0.24, 0.12, 0.08), toon(0x1b2333), 0, -0.01, 0.22);
    for (const sx of [1, -1]) P(h, GEO.box(0.08, 0.06, 0.02, 0.02), glow(0x5ef2ff, 2.2), sx * 0.09, 0.0, 0.285, 0, 0, 0, null);
    P(h, GEO.box(0.14, 0.02, 0.02, 0.008), glow(0x5ef2ff, 1.5), 0, -0.07, 0.285, 0, 0, 0, null);
    for (const sx of [1, -1]) {
      const ear = G0(h, sx > 0 ? 'earL' : 'earR', sx * 0.13, 0.24, -0.02); ear.rotation.z = sx * -0.22;
      P(ear, GEO.sph(0.06), toon(dark), 0, 0, 0);
      P(ear, GEO.cap(0.065, 0.28, 1, 0.7), toon(white), 0, 0.22, 0);
      P(ear, GEO.box(0.05, 0.24, 0.02, 0.01), toon(blue), 0, 0.22, 0.045, 0, 0, 0, null);
    }
    arms(r, white, blue, { r: 0.062, hr: 0.08 });
    const w = weaponGroup(r.armR);
    P(w, GEO.cyl(0.085, 0.1, 0.36, 16), toon(blue), 0, 0, 0.12, Math.PI / 2);
    for (const z of [0.04, 0.2]) P(w, GEO.tor(0.095, 0.015, TAU, 6, 18), toon(white), 0, 0, z, 0, 0, 0, null);
    P(w, GEO.sph(0.07), glow(0x5ef2ff, 2.2), 0, 0, 0.32, 0, 0, 0, null);
    r.style = 'gun1';
    return r;
  },
};

/* ---------- more heroes ---------- */
const _UP = new THREE.Vector3(0, 1, 0);
function spike(parent, len, r, x, y, z, dx, dy, dz, mat, ol = OUTLINE_THIN) {
  const g = GEO.cone(r, len, 6).translate(0, len / 2, 0);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.quaternion.setFromUnitVectors(_UP, new THREE.Vector3(dx, dy, dz).normalize()); m.castShadow = true;
  if (ol) { const o = new THREE.Mesh(g, ol); o.userData.outline = true; m.add(o); }
  parent.add(m); return m;
}
Object.assign(HERO_BUILD, {
  spore() {
    const r = baseRig({ scale: 0.96 }), skin = 0xf2d0b5, red = 0xd63a3a;
    legs(r, 0x5b4a6b, 0x6b3f2a, { r: 0.07 });
    P(r.torso, GEO.cyl(0.2, 0.31, 0.46, 18), toon(0x7d5ba6), 0, 0.17, 0);
    P(r.torso, GEO.box(0.22, 0.28, 0.05, 0.03), toon(0xf6ecd8), 0, 0.15, 0.24, -0.15);
    P(r.torso, GEO.tor(0.19, 0.07, TAU, 8, 20), toon(0x5a8f4e), 0, 0.4, 0, Math.PI / 2);
    P(r.torso, GEO.box(0.1, 0.1, 0.1, 0.03), toon(0x5a8f4e), 0, 0.37, 0.2, 0.6, 0.8, 0);
    const h = r.head;
    P(h, GEO.sph(0.27, 1, 0.95, 1), toon(skin));
    P(h, GEO.sph(0.13, 1, 1, 1), toon(0xd8d8e0), 0, 0.02, -0.25);
    eyes(h, { y: 0.02, z: 0.235, s: 0.85, pupil: 0x3a2a1a });
    for (const sx of [1, -1]) P(h, GEO.tor(0.055, 0.012, TAU, 6, 16), toon(0xc9a24a), sx * 0.1, 0.02, 0.27, 0, 0, 0, null);
    P(h, GEO.box(0.06, 0.012, 0.012, 0.004), toon(0xc9a24a), 0, 0.03, 0.29, 0, 0, 0, null);
    P(h, GEO.sph(0.04, 1, 0.9, 1), toon(0xe8a888), 0, -0.05, 0.27, 0, 0, 0, null);
    for (const sx of [1, -1]) P(h, GEO.sph(0.035, 1, 0.6, 0.5), toon(0xf4a0a8), sx * 0.15, -0.06, 0.22, 0, 0, 0, null);
    P(h, GEO.half(0.44, 1, 0.62, 1), toon(red), 0, 0.17, 0);
    P(h, GEO.cyl(0.18, 0.22, 0.08, 16), toon(0xf6ecd8), 0, 0.15, 0);
    for (const [a, e, s] of [[0.3, 0.5, 0.07], [1.6, 0.35, 0.06], [2.8, 0.55, 0.075], [4.2, 0.4, 0.065], [5.4, 0.6, 0.06], [0, 1.2, 0.07], [3.5, 1.1, 0.055]]) {
      const x = Math.cos(a) * Math.cos(e) * 0.44, z = Math.sin(a) * Math.cos(e) * 0.44, y = 0.17 + Math.sin(e) * 0.44 * 0.62;
      P(h, GEO.sph(s, 1, 0.4, 1), toon(0xfff4e8), x, y, z, 0, 0, 0, null);
    }
    arms(r, 0x7d5ba6, skin, { r: 0.065, hr: 0.075 });
    const w = weaponGroup(r.armR);
    P(w, GEO.cyl(0.02, 0.025, 0.55, 8), toon(0x7a5230), 0, 0, 0.12, Math.PI / 2);
    P(w, GEO.sph(0.07), glow(0x9cff57, 1.6), 0, 0, 0.42, 0, 0, 0, null);
    P(w, GEO.half(0.08, 1, 0.6, 1), toon(red), 0, 0.03, 0.42, 0, 0, 0, null);
    r.style = 'throw';
    return r;
  },
  frost() {
    const r = baseRig({ scale: 0.95, headY: 0.58 }), navy = 0x1f2a44, blue = 0x3fa9f5;
    legs(r, navy, 0xff9f1c, { r: 0.07 });
    P(r.torso, GEO.sph(0.3, 1, 1.15, 0.95), toon(navy), 0, 0.2, 0);
    P(r.torso, GEO.sph(0.24, 0.92, 1.05, 0.6), toon(0xf8fbff), 0, 0.18, 0.12);
    P(r.torso, GEO.tor(0.17, 0.06, TAU, 8, 20), toon(blue), 0, 0.42, 0, Math.PI / 2);
    P(r.torso, GEO.box(0.08, 0.22, 0.04, 0.02), toon(blue), 0.1, 0.3, 0.19, 0, 0, 0.2);
    const h = r.head;
    P(h, GEO.sph(0.27, 1, 0.95, 1), toon(navy));
    P(h, GEO.sph(0.21, 1.1, 0.9, 0.62), toon(0xf8fbff), 0, -0.03, 0.12);
    eyes(h, { y: 0.03, z: 0.235, s: 0.9 });
    P(h, GEO.cone(0.065, 0.16, 10), toon(0xffa22a), 0, -0.07, 0.3, Math.PI / 2);
    for (const sx of [1, -1]) P(h, GEO.sph(0.035, 1, 0.6, 0.5), toon(0xff9fb0), sx * 0.14, -0.06, 0.22, 0, 0, 0, null);
    P(h, GEO.half(0.285, 1, 0.9, 1), toon(blue), 0, 0.07, -0.01);
    P(h, GEO.tor(0.27, 0.045, TAU, 8, 24), toon(0xffffff), 0, 0.08, -0.01, Math.PI / 2);
    P(h, GEO.sph(0.08), toon(0xffffff), 0, 0.36, -0.02);
    arms(r, navy, navy, { r: 0.065, hr: 0.07 });
    const w = weaponGroup(r.armR);
    P(w, GEO.sph(0.1), toon(0xffffff), 0, 0, 0.06);
    r.style = 'throw';
    return r;
  },
  quill() {
    const r = baseRig({ scale: 0.95 }), fur = 0xc68a52, spk = 0x5a3a22, cream = 0xf3dcb5;
    legs(r, 0x6b4a2b, 0xc0392b, { r: 0.07 });
    P(r.torso, GEO.sph(0.27, 1, 1.1, 0.95), toon(fur), 0, 0.2, 0);
    P(r.torso, GEO.sph(0.2, 0.95, 1.1, 0.55), toon(cream), 0, 0.18, 0.13);
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + 0.7 * (i % 3) / 2), y = 0.12 + Math.floor(i / 3) * 0.13; spike(r.torso, 0.22, 0.06, Math.cos(a) * 0.2, y, -0.12 - Math.sin(a) * 0.08, Math.cos(a) * 0.6, 0.25, -1, toon(spk)); }
    const h = r.head;
    P(h, GEO.sph(0.27, 1, 0.95, 1), toon(fur));
    P(h, GEO.sph(0.15, 0.9, 0.75, 1.1), toon(cream), 0, -0.06, 0.18);
    P(h, GEO.sph(0.045), toon(0x221a1a), 0, -0.03, 0.34, 0, 0, 0, null);
    eyes(h, { y: 0.05, z: 0.225, s: 0.9 });
    for (const sx of [1, -1]) P(h, GEO.sph(0.06, 1, 1, 0.6), toon(fur), sx * 0.2, 0.18, 0.02);
    for (const [x, y, z, dx, dy, dz] of [[0, 0.2, -0.05, 0, 0.9, -0.6], [0.12, 0.17, -0.08, 0.5, 0.6, -0.8], [-0.12, 0.17, -0.08, -0.5, 0.6, -0.8], [0, 0.08, -0.2, 0, 0.3, -1], [0.14, 0.02, -0.18, 0.5, 0.1, -1], [-0.14, 0.02, -0.18, -0.5, 0.1, -1], [0.06, 0.24, 0.06, 0.2, 1, -0.2], [-0.06, 0.24, 0.06, -0.2, 1, -0.2]]) spike(h, 0.24, 0.065, x, y, z, dx, dy, dz, toon(spk));
    arms(r, fur, cream, { r: 0.062, hr: 0.08 });
    for (const arm of [r.armR, r.armL]) { const w = weaponGroup(arm); if (arm === r.armL) w.name = 'weapon2'; for (const dx of [-0.04, 0, 0.04]) spike(w, 0.14, 0.022, dx, 0, 0.05, 0, 0, 1, toon(0xf6f1e6)); }
    r.style = 'claw';
    return r;
  },
  wisp() {
    const r = baseRig({ scale: 1.0, hipY: 0.5, headY: 0.36 }), white = 0xeee8ff;
    r.float = true;
    const tail = G0(r.hips, 'tail', 0, -0.05, 0);
    P(tail, GEO.cone(0.27, 0.42, 16).rotateX(Math.PI), toon(white), 0, -0.12, -0.02);
    P(r.torso, GEO.sph(0.27, 1, 0.9, 1), toon(white), 0, 0.1, 0);
    const h = r.head;
    P(h, GEO.sph(0.31, 1, 0.95, 1), toon(white));
    for (const sx of [1, -1]) { P(h, GEO.sph(0.07, 0.8, 1.2, 0.5), basic(0x241c3a), sx * 0.11, 0.02, 0.27, 0, sx * 0.2, 0, OUTLINE_THIN); P(h, GEO.sph(0.02), basic(0xffffff), sx * 0.11 + 0.02, 0.05, 0.3, 0, 0, 0, null); P(h, GEO.sph(0.04, 1, 0.6, 0.5), toon(0xffa8c8), sx * 0.17, -0.07, 0.24, 0, 0, 0, null); }
    P(h, GEO.box(0.06, 0.03, 0.02, 0.01), basic(0x241c3a), 0, -0.07, 0.3, 0, 0, 0, null);
    P(h, GEO.ico(0.1, 1).scale(0.8, 1.5, 0.8), glow(0xffb43a, 1.8), 0, 0.37, 0, 0, 0, 0, null);
    P(h, GEO.ico(0.055, 1).scale(0.8, 1.5, 0.8), glow(0xfff1a8, 2.2), 0, 0.35, 0.02, 0, 0, 0, null);
    arms(r, white, white, { r: 0.06, hr: 0.07 });
    const w = weaponGroup(r.armR);
    P(w, GEO.tor(0.05, 0.012, TAU, 6, 14), toon(0x3b2a1a), 0, -0.02, 0.05, 0, 0, 0, null);
    // lantern points along +z when held forward: plates at each end, 4 posts, glowing core
    for (const z of [0.08, 0.28]) P(w, GEO.box(0.17, 0.17, 0.035, 0.015), toon(0x3b2a1a), 0, 0, z);
    for (const [x, y] of [[0.07, 0.07], [-0.07, 0.07], [0.07, -0.07], [-0.07, -0.07]]) P(w, GEO.box(0.02, 0.02, 0.2, 0.006), toon(0x3b2a1a), x, y, 0.18, 0, 0, 0, null);
    P(w, GEO.sph(0.075, 1, 1, 1.25), glow(0xffd36b, 2.4), 0, 0, 0.18, 0, 0, 0, null);
    r.style = 'throw';
    return r;
  },
  bruin() {
    const r = baseRig({ scale: 1.12, hipY: 0.34, shX: 0.34, shY: 0.36, headY: 0.64, legX: 0.15 }), fur = 0x8e5a36, light = 0xc89a6a, metal = 0x9aa3ad;
    legs(r, fur, 0x3a2a22, { r: 0.11, hip: 0.34 });
    P(r.torso, GEO.box(0.6, 0.5, 0.46, 0.18), toon(fur), 0, 0.25, 0);
    P(r.torso, GEO.sph(0.2, 1.1, 1, 0.5), toon(light), 0, 0.2, 0.19);
    P(r.torso, GEO.box(0.62, 0.08, 0.48, 0.03), toon(0x4a2f22), 0, 0.06, 0);
    P(r.torso, GEO.box(0.1, 0.08, 0.04, 0.02), toon(0xf2c94c), 0, 0.06, 0.25, 0, 0, 0, null);
    for (const sx of [1, -1]) P(r.torso, GEO.half(0.15, 1, 0.6, 1), toon(metal), sx * 0.3, 0.44, 0, 0, 0, sx * -0.3);
    const h = r.head;
    P(h, GEO.sph(0.3, 1.05, 0.95, 1), toon(fur));
    P(h, GEO.sph(0.14, 1.1, 0.8, 0.9), toon(light), 0, -0.07, 0.22);
    P(h, GEO.sph(0.05, 1.3, 0.8, 1), toon(0x221a1a), 0, -0.02, 0.33, 0, 0, 0, null);
    eyes(h, { y: 0.06, z: 0.24, s: 0.8 });
    for (const sx of [1, -1]) P(h, GEO.sph(0.08, 1, 1, 0.6), toon(fur), sx * 0.24, 0.2, -0.02);
    P(h, GEO.half(0.3, 1.04, 0.85, 1.04), toon(metal), 0, 0.09, 0);
    P(h, GEO.tor(0.305, 0.03, TAU, 6, 28), toon(0xd4a640), 0, 0.1, 0, Math.PI / 2);
    for (const sx of [1, -1]) spike(h, 0.26, 0.06, sx * 0.27, 0.2, 0, sx * 1, 0.7, 0, toon(0xf3ead6), OUTLINE_THIN);
    arms(r, fur, light, { r: 0.1, hr: 0.11 });
    const w = weaponGroup(r.armR);
    P(w, GEO.cyl(0.03, 0.035, 0.7, 8), toon(0x7a5230), 0, 0, 0.25, Math.PI / 2);
    P(w, GEO.box(0.36, 0.26, 0.26, 0.05), toon(0x6d7680), 0, 0, 0.62);
    P(w, GEO.box(0.38, 0.06, 0.28, 0.02), toon(0xd4a640), 0, 0, 0.62, 0, 0, Math.PI / 2, null);
    r.style = 'melee';
    return r;
  },
  zap() {
    const r = baseRig({ scale: 1.0 }), skin = 0xf3c9a8, jacket = 0x2b2d42, mag = 0xff4fd8;
    legs(r, 0x22223a, 0xf2f2f2, { r: 0.075 });
    P(r.torso, GEO.box(0.44, 0.42, 0.34, 0.12), toon(jacket), 0, 0.21, 0);
    P(r.torso, GEO.box(0.14, 0.34, 0.05, 0.02), toon(mag), 0, 0.22, 0.165);
    for (const [x, y] of [[0.15, 0.36], [-0.15, 0.36], [0.17, 0.26], [-0.17, 0.26]]) P(r.torso, GEO.sph(0.018), toon(0xd8dce4), x, y, 0.17, 0, 0, 0, null);
    P(r.torso, GEO.box(0.34, 0.05, 0.04, 0.02), toon(0x5a3a26), 0, 0.2, -0.18, 0, 0, 0.7);
    const h = r.head;
    P(h, GEO.sph(0.28, 1, 0.94, 1), toon(skin));
    for (const [x, y, z, dx, dy, dz, l] of [[0, 0.2, 0.02, 0, 1, 0.1, 0.3], [0.12, 0.18, 0, 0.6, 1, -0.1, 0.26], [-0.12, 0.18, 0, -0.6, 1, -0.1, 0.26], [0.06, 0.16, -0.14, 0.3, 0.8, -0.8, 0.28], [-0.06, 0.16, -0.14, -0.3, 0.8, -0.8, 0.28], [0, 0.05, -0.24, 0, 0.3, -1, 0.26], [0.2, 0.06, -0.1, 1, 0.4, -0.5, 0.22], [-0.2, 0.06, -0.1, -1, 0.4, -0.5, 0.22]]) spike(h, l, 0.08, x, y, z, dx, dy, dz, toon(0xffe14d), OUTLINE);
    P(h, GEO.box(0.38, 0.09, 0.08, 0.035), toon(0x1b1b2b), 0, 0.03, 0.24);
    for (const sx of [1, -1]) P(h, GEO.box(0.08, 0.03, 0.02, 0.01), glow(mag, 1.4), sx * 0.09, 0.045, 0.285, 0, 0, 0, null);
    P(h, GEO.box(0.1, 0.02, 0.02, 0.008), basic(0x8a3b2a), 0.01, -0.1, 0.255, 0, 0, -0.15, null);
    arms(r, jacket, skin, { r: 0.065, hr: 0.075 });
    const w = weaponGroup(r.armR);
    P(w, GEO.cyl(0.13, 0.13, 0.06, 20), toon(mag), 0, 0, -0.04, 0, 0, Math.PI / 2);
    P(w, GEO.cyl(0.1, 0.1, 0.06, 20), toon(mag), 0, 0, 0.1, 0, 0, Math.PI / 2);
    P(w, GEO.box(0.05, 0.035, 0.42, 0.012), toon(0x3b2a1a), 0, 0, 0.32);
    P(w, GEO.box(0.08, 0.05, 0.1, 0.02), toon(0x1b1b2b), 0, 0, 0.56);
    P(w, GEO.ico(0.05, 0), glow(0xb47aff, 2.2), 0, 0, 0.64, 0, 0, 0, null);
    r.style = 'gun2';
    return r;
  },
});

/* ---------- draw-call reduction: merge plain parts into vertex-coloured meshes ---------- */
function mergeKey(m) {
  const mat = m.material; if (!m.isMesh || m.userData.outline || m.children.some(c => !c.userData.outline)) return null;
  const ol = m.children.find(c => c.userData.outline), ok = ol ? (ol.material === OUTLINE ? 'o' : 't') : 'n';
  if (mat.isMeshToonMaterial && !mat.map && mat.side === THREE.FrontSide && !mat.transparent && !(mat.emissiveIntensity > 0 && mat.emissive.getHex() !== 0) && !mat.flatShading) return 'toon' + ok;
  if (mat.isMeshBasicMaterial && !mat.transparent && !mat.map) return 'basic' + ok;
  return null;
}
function bakeGeo(m, mtx) {
  let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
  g.applyMatrix4(mtx);
  for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
  const n = g.attributes.position.count, c = new Float32Array(n * 3), col = m.material.color;
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
function mergedMesh(key, geos, shadow = true) {
  const merged = THREE.mergeGeometries(geos);
  const mat = key.startsWith('toon') ? new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: GRAD }) : new THREE.MeshBasicMaterial({ vertexColors: true });
  const mm = new THREE.Mesh(merged, mat); mm.castShadow = shadow;
  const ok = key[key.length - 1]; if (ok !== 'n') { const o = new THREE.Mesh(merged, ok === 'o' ? OUTLINE : OUTLINE_THIN); o.userData.outline = true; mm.add(o); }
  return mm;
}
// merge the direct mesh children of every group (keeps bones animatable)
function mergeRig(root) {
  const groups = []; root.traverse(o => { if (o.isGroup) groups.push(o); });
  for (const g of groups) {
    const buckets = new Map();
    for (const m of g.children) { const k = mergeKey(m); if (k) { if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(m); } }
    for (const [k, list] of buckets) {
      if (list.length < 2) continue;
      const geos = list.map(m => { m.updateMatrix(); return bakeGeo(m, m.matrix); });
      list.forEach(m => g.remove(m)); g.add(mergedMesh(k, geos));
    }
  }
}
// flatten a static subtree into a few meshes
function mergeStatic(root, shadow = true) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), buckets = new Map(), keep = [];
  root.traverse(m => { if (!m.isMesh || m.userData.outline) return; const k = mergeKey(m); if (k) { if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(bakeGeo(m, inv.clone().multiply(m.matrixWorld))); } else keep.push(m); });
  for (const m of keep) root.attach(m);
  for (const c of [...root.children]) if (!keep.includes(c)) root.remove(c);
  for (const [k, geos] of buckets) { const mm = mergedMesh(k, geos, shadow); mm.receiveShadow = true; root.add(mm); }
}
const HERO_TPL = {};
function heroTemplate(k) { if (!HERO_TPL[k]) { const r = HERO_BUILD[k](); mergeRig(r.root); HERO_TPL[k] = r; } return HERO_TPL[k]; }
function makeHero(k) {
  const t = heroTemplate(k);
  const root = t.root.clone(true);
  const mats = [], seen = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.userData.outline) return;
    if (!seen.has(o.material.uuid)) { const m = o.material.clone(); m.userData.baseE = m.emissive ? m.emissive.clone() : null; m.userData.baseEI = m.emissiveIntensity; seen.set(o.material.uuid, m); mats.push(m); }
    o.material = seen.get(o.material.uuid);
  });
  const get = n => root.getObjectByName(n);
  return {
    k, root, mats, style: t.style, float: !!t.float, body: get('body'), hips: get('hips'), legL: get('legL'), legR: get('legR'), torso: get('torso'), head: get('head'),
    armL: get('armL'), armR: get('armR'), tail: get('tail'), earL: get('earL'), earR: get('earR'), hat: get('hat'),
    phase: Math.random() * TAU, face: 0, fade: 1, flash: 0, opac: 1, deadT: 0, lastAtkSeq: -1, lastSupSeq: -1, atkAge: 9, supAge: 9, hand: 0,
  };
}
function setHeroOpacity(V, a) {
  if (Math.abs(V.opac - a) < 0.01) return; V.opac = a;
  const tr = a < 0.999;
  V.root.traverse(o => { if (o.isMesh) { if (o.userData.outline) { o.visible = !tr || a > 0.7; return; } } });
  for (const m of V.mats) { m.transparent = tr; m.opacity = a; m.depthWrite = !tr; }
}
function setHeroFlash(V, f) {
  for (const m of V.mats) {
    if (!m.emissive) continue;
    if (f > 0) { m.emissive.setRGB(1, 1, 1); m.emissiveIntensity = f * 0.9; }
    else if (m.userData.baseE) { m.emissive.copy(m.userData.baseE); m.emissiveIntensity = m.userData.baseEI; }
  }
}
/* procedural animation. s: {moving, speed, atkAge, supAge, alive, deadAge, stun, dash, spin} */
function animHero(V, s, dt, now) {
  const st = V.style;
  if (!s.alive) {
    const a = Math.min(1, s.deadAge / 0.35);
    V.body.rotation.x = -a * 1.45; V.body.position.y = -a * 0.15;
    V.body.scale.setScalar((V.root.userData.scale || 1) * (1 - Math.max(0, s.deadAge - 0.8) * 1.5));
    return;
  }
  V.body.rotation.x = 0; V.body.position.y = 0; V.body.scale.setScalar(heroScale(V));
  const spd = s.moving ? 1 : 0;
  V.phase += dt * (s.moving ? 11 : 2.2);
  const sw = Math.sin(V.phase) * spd;
  const bob = s.moving ? Math.abs(Math.cos(V.phase)) * 0.05 : Math.sin(V.phase) * 0.012;
  V.hips.position.y = (V.hips.userData.y0 ?? (V.hips.userData.y0 = V.hips.position.y)) + bob;
  if (V.float) V.hips.position.y = V.hips.userData.y0 + 0.08 + Math.sin(now * 3.2) * 0.07;
  V.legL.rotation.x = sw * 0.8; V.legR.rotation.x = -sw * 0.8;
  if (V.tail && V.float) V.tail.rotation.x = -sw * 0.25 - (s.moving ? 0.35 : 0);
  V.torso.rotation.x = s.moving ? 0.12 : 0; V.torso.rotation.y = 0; V.torso.rotation.z = Math.sin(V.phase) * 0.04 * spd;
  V.head.rotation.x = s.moving ? -0.08 : Math.sin(V.phase * 0.5) * 0.03;
  // arms default swing
  let aL = -sw * 0.7, aR = sw * 0.7, zL = 0.12, zR = -0.12;
  const aim = s.atkAge < 0.55 || s.supAge < 0.6 || s.aiming;
  if (aim) {
    const rec = Math.max(0, 1 - s.atkAge / 0.12);
    if (st === 'gun2') { aR = -1.5 + rec * 0.35; aL = -1.25 + rec * 0.3; zL = -0.45; zR = -0.02; V.torso.rotation.y = 0.12; }
    else if (st === 'gun1') { aR = -1.55 + rec * 0.4; zR = -0.05; }
    else if (st === 'dual') { const h = V.hand; aR = -1.5 + (h ? 0 : rec * 0.45); aL = -1.5 + (h ? rec * 0.45 : 0); zL = 0.05; zR = -0.05; }
    else if (st === 'claw') { const t = Math.min(1, s.atkAge / 0.18), h = V.hand; if (s.atkAge < 0.3) { if (h) { aR = lerp(-0.5, -1.7, t); zR = lerp(-0.9, 0.3, t); } else { aL = lerp(-0.5, -1.7, t); zL = lerp(0.9, -0.3, t); } } else { aL = aR = -1.0; } V.torso.rotation.y = s.atkAge < 0.3 ? (h ? -0.35 : 0.35) * (1 - t) : 0; }
    else if (st === 'melee') { const t = Math.min(1, s.atkAge / 0.22); aR = s.atkAge < 0.4 ? lerp(-3.0, -0.55, t * t) : -1.0; aL = aR + 0.25; zR = -0.05; zL = 0.25; V.torso.rotation.x = s.atkAge < 0.4 ? lerp(-0.15, 0.25, t) : 0; }
    else if (st === 'throw') { const t = Math.min(1, s.atkAge / 0.28); aR = s.atkAge < 0.28 ? lerp(0.9, -2.4, t) : -1.2; zR = -0.1; V.torso.rotation.y = s.atkAge < 0.28 ? lerp(-0.3, 0.3, t) : 0; }
    if (!st.startsWith('gun') && st !== 'dual' && st !== 'throw' && st !== 'claw' && st !== 'melee') { aR = -1.4; }
  }
  if (s.supAge < 0.5 && st === 'throw') { const t = Math.min(1, s.supAge / 0.35); aR = lerp(1.0, -2.8, t); aL = lerp(1.0, -2.8, t); }
  if (s.spin) { V.torso.rotation.y = now * 18; aL = aR = -1.5; zL = 0.5; zR = -0.5; }
  if (s.dash) { V.torso.rotation.x = 0.45; aL = aR = 0.6; }
  if (s.stun) { V.torso.rotation.z = Math.sin(now * 30) * 0.08; }
  V.armL.rotation.x = aL; V.armR.rotation.x = aR; V.armL.rotation.z = zL; V.armR.rotation.z = zR;
  if (V.tail && !V.float) V.tail.rotation.y = Math.sin(now * 5) * 0.35;
  if (s.jy > 0.05) { aL = aR = -2.6; V.armL.rotation.x = aL; V.armR.rotation.x = aR; V.body.rotation.x = -0.25; }
  if (V.earL) { V.earL.rotation.x = Math.sin(now * 3 + 1) * 0.12 - (s.moving ? 0.25 : 0); V.earR.rotation.x = Math.sin(now * 3) * 0.12 - (s.moving ? 0.25 : 0); }
  // squash on hit
  const f = V.flash; if (f > 0) { const k = 1 + f * 0.6; V.body.scale.set(heroScale(V) * k, heroScale(V) / k, heroScale(V) * k); }
}
const heroScale = V => V.root.userData.scale || 1;

/* ---------- turret ---------- */
function makeTurret() {
  const root = new THREE.Group(), white = 0xf2f5fb, blue = 0x3a86ff;
  P(root, GEO.cyl(0.36, 0.44, 0.18, 18), toon(0x2b2f3a), 0, 0.09, 0);
  P(root, GEO.cyl(0.2, 0.28, 0.3, 16), toon(blue), 0, 0.33, 0);
  const head = G0(root, 'thead', 0, 0.62, 0);
  P(head, GEO.sph(0.25, 1, 0.85, 1), toon(white));
  P(head, GEO.box(0.26, 0.12, 0.08, 0.04), toon(0x1b2333), 0, 0.02, 0.2);
  P(head, GEO.box(0.18, 0.04, 0.02, 0.01), glow(0x5ef2ff, 2), 0, 0.02, 0.245, 0, 0, 0, null);
  P(head, GEO.cyl(0.06, 0.07, 0.34, 12), toon(0x5f6670), 0, -0.05, 0.3, Math.PI / 2);
  for (const sx of [1, -1]) P(head, GEO.cap(0.04, 0.16, 1, 0.7), toon(white), sx * 0.1, 0.27, -0.02, 0, 0, sx * -0.25);
  const mats = []; root.traverse(o => { if (o.isMesh && !o.userData.outline) { o.material = o.material.clone(); o.material.userData.baseE = o.material.emissive.clone(); o.material.userData.baseEI = o.material.emissiveIntensity; mats.push(o.material); } });
  return { root, head, mats };
}
