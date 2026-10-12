/* ================= characters, ghost, items ================= */
const CM = {}; // character materials (no cut-away)
function cmat(k, o) { if (!CM[k]) CM[k] = new THREE.MeshStandardMaterial(o); return CM[k]; }
const cm = (c, r = 0.75, extra) => cmat('c' + c + r + (extra ? JSON.stringify(extra) : ''), Object.assign({ color: c, roughness: r }, extra || {}));
const cfab = (c, r = 0.92) => cmat('f' + c, { color: c, roughness: r, map: TEX.fabric });
const SKIN = () => cmat('skin', { color: 0xe8c4a6, roughness: 0.62 });
function limb(p, rTop, rBot, len, mat, seg = 12) { const m = addM(p, new THREE.CapsuleGeometry((rTop + rBot) / 2, len, 4, seg), mat, 0, -len / 2, 0); m.geometry.scale(rTop / ((rTop + rBot) / 2) * 0.5 + 0.5, 1, 1); return m; }
function taper(p, rTop, rBot, len, mat, seg = 14) { const g = new THREE.CylinderGeometry(rTop, rBot, len, seg, 1); addM(p, g, mat, 0, -len / 2, 0); addM(p, GEO.sph(rBot, seg, 8), mat, 0, -len, 0); addM(p, GEO.sph(rTop, seg, 8), mat, 0, 0, 0); }
/* generic humanoid rig: root → hips → (legL, legR), torso → chest → (head, armL, armR) */
function rig(o) {
  const root = new THREE.Group(), body = grp(root), hips = grp(body, 0, o.hipY, 0), torso = grp(hips, 0, 0.02, 0), chest = grp(torso, 0, o.chestY, 0), head = grp(chest, 0, o.headY, 0);
  const mkArm = sx => { const sh = grp(chest, sx * o.shX, o.shY, 0), el = grp(sh, 0, -o.upper, 0), hand = grp(el, 0, -o.fore, 0); return { sh, el, hand }; };
  const mkLeg = sx => { const hp = grp(hips, sx * o.legX, -0.02, 0), kn = grp(hp, 0, -o.thigh, 0), ft = grp(kn, 0, -o.shin, 0); return { hp, kn, ft }; };
  return { root, body, hips, torso, chest, head, aL: mkArm(1), aR: mkArm(-1), lL: mkLeg(1), lR: mkLeg(-1), o };
}
function eyes(head, o) {
  const white = cm(0xf4f0ea, 0.25), iris = cm(o.iris || 0x2a1a10, 0.2), hl = cmat('eyehl', { color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
  for (const sx of [-1, 1]) {
    const e = grp(head, sx * o.ex, o.ey, o.ez);
    addM(e, GEO.sph(o.er, 14, 10), white, 0, 0, 0, 0, 0, 0, 0.9, 1.15, 0.55);
    addM(e, GEO.sph(o.er * 0.62, 12, 10), iris, sx * 0.002, -0.002, o.er * 0.38, 0, 0, 0, 0.9, 1.1, 0.5);
    addM(e, GEO.sph(o.er * 0.2, 8, 6), hl, sx * -o.er * 0.22, o.er * 0.3, o.er * 0.56);
    addM(e, GEO.box(o.er * 2.2, o.er * 0.35, o.er * 0.4, 0.004), cm(o.brow || 0x1a120c, 0.8), 0, o.er * 1.6, o.er * 0.3, 0, 0, sx * (o.browA || 0.1));
  }
}
/* ---------- 持灯者 阿岩 ---------- */
function makeHolder() {
  const R = rig({ hipY: 0.8, chestY: 0.3, headY: 0.36, shX: 0.2, shY: 0.08, upper: 0.27, fore: 0.25, legX: 0.1, thigh: 0.38, shin: 0.36 });
  const coat = cfab(0xc89a2a, 0.7), coatD = cfab(0x8a6618), jeans = cfab(0x2a3448), boot = cm(0x3a2416, 0.6), skin = SKIN(), hair = cm(0x1c140e, 0.7), strap = cm(0x2a2a2a, 0.6);
  const refl = cmat('refl', { color: 0xc8c8c0, roughness: 0.3, metalness: 0.6, emissive: 0x303028, emissiveIntensity: 1 });
  // legs
  for (const L of [R.lL, R.lR]) { taper(L.hp, 0.075, 0.062, 0.38, jeans); taper(L.kn, 0.062, 0.05, 0.3, jeans); const b = grp(L.ft, 0, 0.0, 0); addM(b, GEO.cyl(0.058, 0.062, 0.14, 14), boot, 0, 0.04, 0); addM(b, GEO.box(0.11, 0.07, 0.22, 0.03), boot, 0, -0.03, 0.05); addM(b, GEO.box(0.12, 0.025, 0.23, 0.01), cm(0x111111, 0.9), 0, -0.065, 0.05); for (let k = 0; k < 3; k++) addM(b, GEO.box(0.06, 0.006, 0.006), cm(0xb8a070), 0, 0.0 + k * 0.03, 0.05 + 0.02 - k * 0.012, 0.6); }
  // torso: raincoat (lathe) with belt, toggles, pockets, reflective band
  const cp = [[0.0, -0.32], [0.24, -0.32], [0.235, -0.18], [0.2, 0.0], [0.19, 0.18], [0.22, 0.32], [0.2, 0.4], [0.1, 0.44], [0, 0.44]];
  const coatM = addM(R.torso, GEO.lathe(cp, 22), coat, 0, 0, 0, 0, 0, 0, 1, 1, 0.78);
  addM(R.torso, GEO.cyl(0.235, 0.24, 0.05, 22), refl, 0, -0.22, 0, 0, 0, 0, 1, 1, 0.8);
  addM(R.torso, GEO.box(0.02, 0.62, 0.02), coatD, 0, 0.05, 0.188);
  for (let k = 0; k < 4; k++) addM(R.torso, GEO.cyl(0.008, 0.008, 0.05, 6), cm(0x3a2a1a), 0.03, 0.3 - k * 0.14, 0.19, 0, 0, HP);
  for (const sx of [-1, 1]) { addM(R.torso, GEO.box(0.1, 0.1, 0.02, 0.01), coatD, sx * 0.12, -0.12, 0.17, 0.1 * sx, 0, 0); addM(R.torso, GEO.box(0.11, 0.025, 0.025, 0.008), coatD, sx * 0.12, -0.07, 0.175); }
  // collar & hood bunched at the back
  addM(R.chest, GEO.tor(0.1, 0.035, TAU, 8, 18), coat, 0, 0.1, 0, HP, 0, 0, 1, 0.85, 1);
  addM(R.chest, GEO.sph(0.13, 14, 10, 0, TAU, 0, PI * 0.6), coatD, 0, 0.08, -0.1, -1.2, 0, 0, 1, 0.7, 0.7);
  // scarf
  const scarf = cfab(0x7a1e1a); addM(R.chest, GEO.tor(0.085, 0.035, TAU, 8, 18), scarf, 0, 0.16, 0.01, HP, 0, 0); addM(R.chest, GEO.box(0.07, 0.2, 0.03, 0.012), scarf, 0.06, 0.03, 0.12, 0.25, 0, 0.12);
  // backpack + bedroll
  const bp = grp(R.chest, 0, -0.06, -0.2); addM(bp, GEO.box(0.3, 0.38, 0.16, 0.05), cfab(0x3a4a34), 0, 0, 0); addM(bp, GEO.box(0.22, 0.14, 0.05, 0.02), cfab(0x2e3c2a), 0, -0.08, -0.09); addM(bp, GEO.cyl(0.07, 0.07, 0.34, 14), cfab(0x6a4a2a), 0, 0.24, 0.0, 0, 0, HP); for (const sx of [-1, 1]) { addM(bp, GEO.box(0.04, 0.4, 0.02), strap, sx * 0.1, 0.02, 0.16); addM(bp, GEO.box(0.035, 0.012, 0.03), cm(0x9a9a90, 0.3, { metalness: 0.8 }), sx * 0.1, 0.25, 0.0); }
  // head
  const H = R.head; addM(H, GEO.cyl(0.05, 0.055, 0.1, 10), skin, 0, -0.05, 0);
  addM(H, GEO.sph(0.15, 22, 18), skin, 0, 0.12, 0.0, 0, 0, 0, 0.95, 1.05, 1.0);
  addM(H, GEO.sph(0.022, 8, 6), skin, 0, 0.09, 0.145, 0, 0, 0, 1, 0.8, 0.8);
  for (const sx of [-1, 1]) addM(H, GEO.sph(0.03, 8, 6), skin, sx * 0.145, 0.11, 0.0, 0, 0, 0, 0.5, 1, 0.8);
  addM(H, GEO.box(0.05, 0.008, 0.01, 0.003), cm(0x8a4a3a, 0.6), 0, 0.04, 0.138);
  eyes(H, { ex: 0.055, ey: 0.13, ez: 0.12, er: 0.026, iris: 0x2a1a0e, brow: 0x1c140e, browA: -0.15 });
  // messy hair clumps
  addM(H, GEO.sph(0.158, 18, 14, 0, TAU, 0, PI * 0.55), hair, 0, 0.13, -0.01, -0.15, 0, 0, 1, 1.05, 1.05);
  for (let k = 0; k < 11; k++) { const a = (k / 11) * PI * 1.4 - PI * 0.2; addM(H, GEO.cone(0.045, 0.12, 6), hair, Math.cos(a) * 0.1, 0.24 + Math.sin(k * 1.7) * 0.02, Math.sin(a) * -0.08 + 0.04, -0.6 - Math.sin(a) * 0.4, 0, Math.cos(a) * -0.9); }
  for (let k = 0; k < 5; k++) addM(H, GEO.cone(0.035, 0.11, 6), hair, -0.08 + k * 0.04, 0.22, 0.11, 2.3, 0, (k - 2) * 0.15);
  // arms (coat sleeves) and hands
  for (const [A, sx] of [[R.aL, 1], [R.aR, -1]]) { addM(A.sh, GEO.sph(0.07, 12, 10), coat, 0, 0, 0); taper(A.sh, 0.065, 0.058, 0.27, coat); taper(A.el, 0.058, 0.052, 0.21, coat); addM(A.el, GEO.cyl(0.062, 0.06, 0.03, 12), coatD, 0, -0.21, 0); addM(A.hand, GEO.sph(0.045, 12, 10), skin, 0, -0.02, 0, 0, 0, 0, 0.85, 1.1, 1); addM(A.hand, GEO.cyl(0.014, 0.012, 0.05, 6), skin, sx * -0.035, -0.0, 0.02, 0.6, 0, sx * 0.4); }
  // flashlight in the right hand (points along +z of the hand group after pose)
  const fl = grp(R.aR.hand, 0, -0.04, 0.03); fl.rotation.x = HP;
  addM(fl, GEO.cyl(0.022, 0.022, 0.2, 12), cm(0x2a2a2e, 0.35, { metalness: 0.7 }), 0, 0.02, 0);
  addM(fl, GEO.cyl(0.04, 0.026, 0.07, 16), cm(0x3a3a40, 0.3, { metalness: 0.8 }), 0, 0.15, 0);
  for (let k = 0; k < 6; k++) addM(fl, GEO.box(0.006, 0.12, 0.006), cm(0x111111, 0.6), Math.cos(k) * 0.023, 0.0, Math.sin(k) * 0.023);
  const lens = addM(fl, GEO.cyl(0.036, 0.036, 0.005, 16), cmat('lens', { color: 0xfff6dd, emissive: 0xfff2c8, emissiveIntensity: 2.5, roughness: 0.1 }), 0, 0.188, 0); lens.castShadow = false;
  lens.userData.keep = true; R.lens = lens; R.flash = fl;
  mergeRig(R.root);
  R.kind = 'L';
  return R;
}
/* ---------- 灵视者 小雾 ---------- */
function pleatedSkirt(rTop, rBot, h, pleats, mat) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, pleats * 4, 3, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), t = (h / 2 - y) / h, k = 1 + Math.abs(Math.sin(a * pleats)) * 0.06 * (0.3 + t); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals(); return g;
}
function makeSeer() {
  const R = rig({ hipY: 0.74, chestY: 0.28, headY: 0.33, shX: 0.17, shY: 0.07, upper: 0.24, fore: 0.22, legX: 0.08, thigh: 0.35, shin: 0.33 });
  const card = cfab(0x232c4a), blouse = cfab(0xe8e4dc, 0.8), skirt = cmat('skirtM', { color: 0x1e3a3a, roughness: 0.85, map: TEX.fabric, side: THREE.DoubleSide }), sock = cfab(0xe8e4dc), shoe = cm(0x0e0c0c, 0.25), skin = SKIN(), hair = cm(0x0d0b10, 0.5);
  for (const L of [R.lL, R.lR]) { taper(L.hp, 0.06, 0.05, 0.35, skin); taper(L.kn, 0.052, 0.042, 0.29, sock); addM(L.kn, GEO.cyl(0.055, 0.055, 0.03, 12), sock, 0, -0.01, 0); const b = grp(L.ft); addM(b, GEO.box(0.085, 0.06, 0.18, 0.03), shoe, 0, -0.02, 0.04); addM(b, GEO.box(0.09, 0.01, 0.02), shoe, 0, 0.01, 0.03); addM(b, GEO.sph(0.008, 6, 5), cm(0xb0a080, 0.3, { metalness: 0.8 }), 0.045, 0.01, 0.03); }
  // skirt + cardigan + blouse collar + ribbon
  addM(R.hips, pleatedSkirt(0.15, 0.25, 0.34, 12, skirt), skirt, 0, -0.1, 0, 0, 0, 0, 1, 1, 0.85);
  const cp = [[0, -0.1], [0.16, -0.1], [0.165, 0.0], [0.15, 0.14], [0.17, 0.28], [0.15, 0.36], [0.08, 0.4], [0, 0.4]];
  addM(R.torso, GEO.lathe(cp, 22), card, 0, 0, 0, 0, 0, 0, 1, 1, 0.75);
  addM(R.torso, GEO.box(0.06, 0.38, 0.02, 0.01), blouse, 0, 0.14, 0.12);
  for (let k = 0; k < 4; k++) addM(R.torso, GEO.sph(0.009, 6, 5), cm(0xd8c8a0, 0.3), 0.04, 0.24 - k * 0.08, 0.125);
  for (const sx of [-1, 1]) addM(R.chest, GEO.box(0.08, 0.05, 0.01, 0.005), blouse, sx * 0.04, 0.09, 0.105, 0, 0, sx * 0.5);
  const rib = cm(0x8a1420, 0.6); addM(R.chest, GEO.sph(0.02, 8, 6), rib, 0, 0.08, 0.115); for (const sx of [-1, 1]) addM(R.chest, GEO.cone(0.03, 0.06, 6), rib, sx * 0.03, 0.08, 0.11, 0, 0, sx * HP); for (const sx of [-1, 1]) addM(R.chest, GEO.box(0.015, 0.07, 0.004), rib, sx * 0.012, 0.03, 0.115, 0, 0, sx * 0.2);
  // amulet
  const am = addM(R.chest, GEO.cyl(0.022, 0.022, 0.006, 16), cmat('amulet', { color: 0x9adfff, emissive: 0x5ac8ff, emissiveIntensity: 1.2, roughness: 0.2 }), 0, -0.04, 0.125, HP); am.castShadow = false; am.userData.keep = true; R.amulet = am;
  // satchel across the body
  addM(R.torso, GEO.box(0.03, 0.5, 0.01), cm(0x5a3a1a, 0.7), 0.0, 0.18, 0.123, 0, 0, 0.75); const sat = grp(R.torso, 0.17, -0.05, 0.05); addM(sat, GEO.box(0.06, 0.16, 0.2, 0.02), cm(0x6a4422, 0.65), 0, 0, 0);
  // head
  const H = R.head; addM(H, GEO.cyl(0.04, 0.045, 0.1, 10), skin, 0, -0.05, 0);
  addM(H, GEO.sph(0.145, 22, 18), skin, 0, 0.12, 0.0, 0, 0, 0, 0.94, 1.02, 0.98);
  addM(H, GEO.sph(0.016, 8, 6), skin, 0, 0.09, 0.138, 0, 0, 0, 1, 0.8, 0.8);
  addM(H, GEO.box(0.03, 0.006, 0.008, 0.003), cm(0xa04a4a, 0.5), 0, 0.045, 0.132);
  for (const sx of [-1, 1]) addM(H, GEO.sph(0.022, 8, 6), cmat('blush', { color: 0xe89a90, roughness: 0.8, transparent: true, opacity: 0.45 }), sx * 0.075, 0.07, 0.11, 0, 0, 0, 1, 0.6, 0.4);
  eyes(H, { ex: 0.052, ey: 0.12, ez: 0.112, er: 0.03, iris: 0x2a5a8a, brow: 0x0d0b10, browA: 0.05 });
  // long hair: crown, bangs, side locks, back mass
  addM(H, GEO.sph(0.155, 20, 14, 0, TAU, 0, PI * 0.58), hair, 0, 0.13, -0.008, -0.12, 0, 0, 1.03, 1.06, 1.06);
  for (let k = 0; k < 7; k++) addM(H, GEO.box(0.045, 0.1, 0.02, 0.01), hair, -0.09 + k * 0.03, 0.2, 0.125 - Math.abs(k - 3) * 0.004, -0.25, 0, (k - 3) * 0.06);
  for (const sx of [-1, 1]) { addM(H, GEO.box(0.05, 0.3, 0.05, 0.02), hair, sx * 0.13, 0.02, 0.05, 0.05, 0, sx * 0.08); }
  const back = grp(H, 0, 0.18, -0.07); addM(back, GEO.cyl(0.14, 0.17, 0.62, 18, 1, false, PI * 0.15, PI * 1.7), hair, 0, -0.3, 0, 0.08, PI * 0.0, 0, 1, 1, 0.55); R.hairBack = back;
  const clip = grp(H, 0.1, 0.24, 0.07); clip.rotation.z = -0.6; const mo = new THREE.Shape(); mo.absarc(0, 0, 0.03, 0.4, TAU - 0.4, false); mo.absarc(0.015, 0, 0.022, TAU - 0.6, 0.6, true); addM(clip, GEO.ext(mo, 0.008, 0.002), cmat('clip', { color: 0xd8d0a8, emissive: 0x5a5030, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.6 }), 0, 0, 0);
  // arms + hands
  for (const [A, sx] of [[R.aL, 1], [R.aR, -1]]) { addM(A.sh, GEO.sph(0.058, 12, 10), card, 0, 0, 0); taper(A.sh, 0.055, 0.048, 0.24, card); taper(A.el, 0.048, 0.042, 0.19, card); addM(A.el, GEO.cyl(0.05, 0.048, 0.03, 12), blouse, 0, -0.19, 0); addM(A.hand, GEO.sph(0.036, 12, 10), skin, 0, -0.02, 0, 0, 0, 0, 0.85, 1.1, 1); }
  // spirit lantern in the left hand
  const ln = grp(R.aL.hand, 0, -0.05, 0.0); R.lanternG = ln;
  const brass = cm(0x9a7a3a, 0.3, { metalness: 0.85 });
  addM(ln, GEO.tor(0.025, 0.004, PI, 6, 10), brass, 0, 0.0, 0, 0, HP, 0);
  const cage = grp(ln, 0, -0.14, 0); R.lanternCage = cage;
  addM(cage, GEO.cyl(0.035, 0.05, 0.03, 6), brass, 0, 0.1, 0); addM(cage, GEO.cyl(0.055, 0.055, 0.025, 6), brass, 0, -0.08, 0);
  for (let k = 0; k < 6; k++) addM(cage, GEO.cyl(0.004, 0.004, 0.17, 4), brass, Math.cos(k / 6 * TAU) * 0.048, 0.01, Math.sin(k / 6 * TAU) * 0.048);
  addM(cage, GEO.cyl(0.043, 0.043, 0.16, 12, 1, true), cmat('lglass', { color: 0x9adcff, transparent: true, opacity: 0.25, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), 0, 0.01, 0);
  const flame = addM(cage, GEO.sph(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.0, 0, 0, 0, 0, 0.8, 1.6, 0.8); flame.castShadow = false; flame.userData.keep = true; R.spiritFlame = flame;
  mergeRig(R.root);
  R.kind = 'S';
  return R;
}
/* ---------- the ghost (custom translucent shader) ---------- */
const GHOST_U = { uTime: { value: 0 }, uAlpha: { value: 1 }, uColor: { value: new THREE.Color(0x9fd8ff) }, uHunt: { value: 0 }, uSpirit: { value: 0 } };
function ghostMat(dark) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uDark: { value: dark ? 1 : 0 } }, GHOST_U), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: dark ? THREE.NormalBlending : THREE.NormalBlending,
    vertexShader: `uniform float uTime; uniform float uHunt; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vY;
      void main(){ vec3 p = position; vec4 w0 = modelMatrix * vec4(p,1.0); float sway = sin(uTime*2.2 + w0.y*3.0 + p.x*4.0) * 0.035 * (1.0 + uHunt) * smoothstep(1.4, 0.0, w0.y);
        p.x += sway; p.z += cos(uTime*1.7 + w0.y*2.5) * 0.03 * smoothstep(1.4, 0.0, w0.y);
        vec4 w = modelMatrix * vec4(p,1.0); vW = w.xyz; vY = w.y; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; uniform float uAlpha; uniform vec3 uColor; uniform float uDark; uniform float uHunt; uniform float uSpirit; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vY;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
        float nz = n2(vW.xz*3.0 + vec2(0.0, uTime*0.6) + vY*2.0) * 0.6 + n2(vW.xy*7.0 - uTime*0.9) * 0.4;
        float hem = smoothstep(0.02, 0.55, vY + (nz - 0.5) * 0.35);
        float a = uAlpha * hem;
        if (uDark > 0.5) { gl_FragColor = vec4(vec3(0.02,0.02,0.03), a * (0.92 - fr*0.3)); return; }
        vec3 c = mix(uColor * 0.35, uColor * 1.6, fr) + vec3(0.6,0.0,0.05) * uHunt * fr;
        c = mix(c, vec3(0.55,0.9,1.0) * 1.4, uSpirit * 0.35);
        float body = 0.18 + fr * 0.8 + nz * 0.12;
        gl_FragColor = vec4(c, a * body); }`,
  });
}
function makeGhost() {
  const g = new THREE.Group(), body = grp(g), mat = ghostMat(false), dark = ghostMat(true);
  // shroud
  const sp = []; for (let i = 0; i <= 18; i++) { const t = i / 18; sp.push([0.05 + Math.pow(t, 0.8) * 0.42 + Math.sin(t * 20) * 0.012, 1.95 - t * 1.95]); }
  const shroud = addM(body, GEO.lathe(sp.reverse(), 28), mat, 0, 0.12, 0); shroud.castShadow = false;
  // head under the veil
  const head = grp(body, 0, 1.86, 0.05); addM(head, GEO.sph(0.15, 18, 14), mat, 0, 0, 0, 0, 0, 0, 0.9, 1.15, 0.95);
  // long black hair hanging over the face
  for (let k = 0; k < 16; k++) { const a = -PI * 0.55 + k / 15 * PI * 1.1, L = rr(0.55, 0.95); const s = addM(head, GEO.cone(0.035, L, 5), dark, Math.sin(a) * 0.12, -L / 2 + 0.08, Math.cos(a) * 0.11 + 0.02, PI + rr(-0.08, 0.08), 0, rr(-0.06, 0.06)); s.castShadow = false; }
  addM(head, GEO.sph(0.16, 16, 12, 0, TAU, 0, PI * 0.55), dark, 0, 0.02, -0.01, -0.1).castShadow = false;
  const eyesG = grp(head, 0, 0.0, 0.13); for (const sx of [-1, 1]) { const e = addM(eyesG, GEO.sph(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }), sx * 0.045, 0.01, 0); e.castShadow = false; }
  // arms (reach forward during hunts)
  const arms = [];
  for (const sx of [-1, 1]) { const sh = grp(body, sx * 0.2, 1.62, 0.02); const up = addM(sh, GEO.cyl(0.035, 0.025, 0.55, 8), mat, 0, -0.27, 0); up.castShadow = false; const el = grp(sh, 0, -0.55, 0); addM(el, GEO.cyl(0.025, 0.018, 0.5, 8), mat, 0, -0.25, 0).castShadow = false; const hd = grp(el, 0, -0.52, 0); for (let f = 0; f < 4; f++) addM(hd, GEO.cyl(0.006, 0.003, 0.16, 4), mat, (f - 1.5) * 0.015, -0.07, 0.0, 0, 0, (f - 1.5) * 0.12).castShadow = false; arms.push({ sh, el, sx }); }
  // trailing wisps
  const wisps = []; for (let k = 0; k < 7; k++) { const w = addM(body, GEO.cone(0.08, 0.7, 6), mat, rr(-0.3, 0.3), 0.3, rr(-0.35, 0.1), PI + 0.3, 0, rr(-0.3, 0.3)); w.castShadow = false; w.userData.keep = true; wisps.push(w); }
  mergeRig(g);
  g.userData = { body, head, arms, wisps, eyes: eyesG };
  g.renderOrder = 5;
  return g;
}
/* merge the direct mesh children of every group (per material) — keeps the rig animatable, cuts draw calls */
function mergeRig(root) {
  const groups = []; root.traverse(o => { if (!o.isMesh) groups.push(o); });
  for (const g of groups) {
    const by = new Map();
    for (const c of g.children) { if (!c.isMesh || c.userData.keep || c.children.length) continue; const k = c.material.uuid + (c.castShadow ? 's' : ''); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
    for (const list of by.values()) {
      if (list.length < 2) continue;
      const geos = list.map(c => { c.updateMatrix(); let q = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); for (const k of Object.keys(q.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') q.deleteAttribute(k); if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); q.applyMatrix4(c.matrix); return q; });
      const m = new THREE.Mesh(THREE.mergeGeometries(geos, false), list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = true; m.renderOrder = list[0].renderOrder;
      for (const c of list) g.remove(c); g.add(m);
    }
  }
  return root;
}
/* ---------- items ---------- */
function makeItem(kind) {
  const g = grp();
  if (kind === 'ring') { addM(g, GEO.tor(0.04, 0.009, TAU, 10, 24), cm(0xc8a040, 0.25, { metalness: 0.9 }), 0, 0.04, 0, 0.3, 0, 0); addM(g, GEO.ico(0.016, 0), cm(0xd8e8ff, 0.05, { metalness: 0.2 }), 0, 0.082, 0.01); addM(g, GEO.box(0.12, 0.04, 0.09, 0.01), cfab(0x3a0e14), 0, 0.02, 0.0).position.y = 0.0; }
  if (kind === 'doll') { const d = makeDoll(0); d.scale.setScalar(1.1); g.add(d); }
  if (kind === 'watch') { addM(g, GEO.cyl(0.045, 0.045, 0.015, 24), cm(0xc8a040, 0.25, { metalness: 0.9 }), 0, 0.01, 0); addM(g, GEO.cyl(0.038, 0.038, 0.003, 24), cmat('wface', { map: clockFace(), roughness: 0.4 }), 0, 0.019, 0); addM(g, GEO.tor(0.012, 0.003, TAU, 6, 10), cm(0xc8a040, 0.25, { metalness: 0.9 }), 0, 0.012, -0.055, HP); for (let k = 0; k < 6; k++) addM(g, GEO.tor(0.006, 0.0015, TAU, 4, 8), cm(0xc8a040, 0.3, { metalness: 0.9 }), 0.01 * Math.sin(k), 0.008, -0.07 - k * 0.012, HP, k * 0.6, 0); }
  if (kind === 'salt') { addM(g, GEO.lathe([[0, 0], [0.04, 0], [0.042, 0.1], [0.03, 0.12], [0.03, 0.13], [0, 0.13]], 16), cmat('saltGlass', { color: 0xd8e0e8, roughness: 0.1, transparent: true, opacity: 0.55 }), 0, 0, 0); addM(g, GEO.cyl(0.036, 0.038, 0.08, 16), cm(0xf4f4f0, 0.9), 0, 0.045, 0); addM(g, GEO.cyl(0.033, 0.033, 0.02, 16), cm(0x5a3a1a, 0.7), 0, 0.14, 0); addM(g, GEO.box(0.05, 0.04, 0.002), cm(0xd8c8a0, 0.9), 0, 0.06, 0.042); }
  if (kind === 'fuse') { addM(g, GEO.cyl(0.022, 0.022, 0.08, 12), cm(0xe0d8c8, 0.3), 0, 0.022, 0, 0, 0, HP); for (const sx of [-1, 1]) addM(g, GEO.cyl(0.024, 0.024, 0.015, 12), cm(0xb08a40, 0.3, { metalness: 0.9 }), sx * 0.045, 0.022, 0, 0, 0, HP); }
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xfff0c0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })); glint.scale.setScalar(0.22); glint.position.y = 0.08; g.add(glint); g.userData.glint = glint;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}
