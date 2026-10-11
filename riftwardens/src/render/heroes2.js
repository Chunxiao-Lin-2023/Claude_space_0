// =====================================================================
// HEROES — round 2: paladin, ranger, alchemist, blademaster
// (inserted into models.js before the UNITS registry by build step)
// =====================================================================
function kiteShield(parent, col, rim, emb) {
  const s = new THREE.Shape(); s.moveTo(0, 0.26); s.quadraticCurveTo(0.2, 0.26, 0.19, 0.06); s.quadraticCurveTo(0.16, -0.16, 0, -0.32); s.quadraticCurveTo(-0.16, -0.16, -0.19, 0.06); s.quadraticCurveTo(-0.2, 0.26, 0, 0.26);
  const g = new THREE.ExtrudeGeometry(s, {depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2, curveSegments: 10});
  g.translate(0, 0, -0.02);
  M(parent, g, col, [0, 0, 0]);
  const r = new THREE.Shape(); r.moveTo(0, 0.29); r.quadraticCurveTo(0.23, 0.29, 0.22, 0.06); r.quadraticCurveTo(0.18, -0.18, 0, -0.36); r.quadraticCurveTo(-0.18, -0.18, -0.22, 0.06); r.quadraticCurveTo(-0.23, 0.29, 0, 0.29);
  const gr = new THREE.ExtrudeGeometry(r, {depth: 0.03, bevelEnabled: false, curveSegments: 10}); gr.translate(0, 0, -0.04);
  M(parent, gr, rim, [0, 0, 0]);
  M(parent, box(0.05, 0.4, 0.02, 0.005), emb, [0, -0.02, 0.045]); M(parent, box(0.26, 0.05, 0.02, 0.005), emb, [0, 0.08, 0.045]);
}
function buildPaladin() {
  const o = {thigh: 0.43, shin: 0.41, foot: 0.08, hipW: 0.11, torsoH: 0.55, shW: 0.245, upper: 0.3, fore: 0.28};
  const rig = humanoid(o); const J = rig.J;
  const steel = mat(0xcfd6de), steelD = mat(0x7d8897), blue = mat(0x2a58b8), blueD = mat(0x1b3b80), gold = mat(0xeabc4c), skin = mat(0xf0c29a), hair = mat(0xd8b04f), leath = mat(0x5a3a22), wood = mat(0x6e4a2a), white = mat(0xf6f1e6), eye = mat(0x1d2433);
  M(J.hips, cyl(0.18, 0.2, 0.17, 20), steelD, [0, -0.02, 0]);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; M(J.hips, box(0.1, 0.2, 0.03, 0.01), i % 2 ? steel : steelD, [Math.sin(a) * 0.19, -0.14, Math.cos(a) * 0.19], [0.18 * Math.cos(a), a, -0.18 * Math.sin(a)]); }
  M(J.hips, box(0.2, 0.42, 0.025, 0.01), blue, [0, -0.2, 0.2], [0.08, 0, 0]); M(J.hips, box(0.2, 0.42, 0.025, 0.01), blue, [0, -0.2, -0.2], [-0.08, 0, 0]);
  M(J.hips, box(0.21, 0.03, 0.03, 0.005), gold, [0, -0.41, 0.215]); M(J.hips, box(0.21, 0.03, 0.03, 0.005), gold, [0, -0.41, -0.215]);
  M(J.hips, tor(0.19, 0.03, Math.PI * 2, 8, 26), leath, [0, 0.06, 0], [Math.PI / 2, 0, 0]);
  M(J.spine, cyl(0.22, 0.17, 0.56, 20), steel, [0, 0.28, 0], [0, 0, 0], [1, 1, 0.82]);
  M(J.spine, box(0.24, 0.42, 0.03, 0.01), blue, [0, 0.24, 0.155]);
  M(J.spine, box(0.05, 0.3, 0.02, 0.005), gold, [0, 0.27, 0.172]); M(J.spine, box(0.18, 0.05, 0.02, 0.005), gold, [0, 0.33, 0.172]);
  M(J.chest, tor(0.12, 0.035, Math.PI * 2, 8, 20), gold, [0, 0.25, 0], [Math.PI / 2, 0, 0]);
  // cape
  M(J.chest, cyl(0.2, 0.36, 0.95, 20, true, Math.PI * 0.65, Math.PI * 0.7), blueD, [0, -0.2, -0.06]);
  for (const i of [0, 1]) {
    const s = i ? -1 : 1; const pd = G(J['a' + i + 'u'], [s * 0.03, 0.03, 0]);
    M(pd, hemi(0.14), steel, [0, 0, 0], [0, 0, s * 0.45], [1, 0.8, 1.1]); M(pd, tor(0.135, 0.018, Math.PI * 2, 6, 20), gold, [0, 0, 0], [Math.PI / 2, 0, s * 0.45]);
    limb(J['a' + i + 'u'], o.upper, 0.068, 0.058, steelD);
    limb(J['a' + i + 'f'], o.fore, 0.06, 0.05, steel);
    M(J['a' + i + 'h'], sph(0.055, 12, 10), steelD, [0, -0.035, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.088, 0.07, steelD);
    limb(J['l' + i + 's'], o.shin, 0.072, 0.06, steel);
    M(J['l' + i + 's'], sph(0.075, 10, 8), steel, [0, 0, 0.03]);
    foot(J['l' + i + 'f'], 0.12, 0.09, 0.23, steelD);
  }
  M(J.neck, cyl(0.06, 0.065, 0.08), skin, [0, 0.02, 0]);
  const hd = G(J.head, [0, 0.12, 0.01]);
  M(hd, sph(0.13, 22, 16), skin, [0, 0, 0], [0, 0, 0], [0.95, 1.05, 1]);
  M(hd, box(0.13, 0.08, 0.1, 0.035), skin, [0, -0.085, 0.035]);
  eyes(hd, 0.02, 0.0, 0.118, 0.047, eye); eyes(hd, 0.008, 0.006, 0.135, 0.042, white);
  M(hd, box(0.05, 0.014, 0.02), hair, [0.05, 0.035, 0.12], [0, 0, -0.15]); M(hd, box(0.05, 0.014, 0.02), hair, [-0.05, 0.035, 0.12], [0, 0, 0.15]);
  M(hd, box(0.07, 0.03, 0.04, 0.01), hair, [0, -0.115, 0.08]); // short beard
  M(hd, sph(0.15, 22, 16, 0), steel, [0, 0.04, -0.01], [0, 0, 0], [1, 0.85, 1.02]); // helm
  M(hd, box(0.035, 0.12, 0.08, 0.01), steelD, [0.135, -0.04, 0.04]); M(hd, box(0.035, 0.12, 0.08, 0.01), steelD, [-0.135, -0.04, 0.04]);
  M(hd, box(0.3, 0.03, 0.04, 0.01), gold, [0, 0.07, 0.11], [0.2, 0, 0]);
  for (let i = 0; i < 6; i++) M(hd, box(0.035, 0.09, 0.05, 0.01), blue, [0, 0.17 - Math.abs(i - 2.5) * 0.015, 0.08 - i * 0.04], [0.2 * (i - 2.5) / 2.5, 0, 0]); // plume crest
  // shield on left forearm (face outwards +x)
  const sh = G(J.a0f, [0.08, -0.15, 0.02], [0, Math.PI / 2, 0]); kiteShield(sh, blue, gold, gold); rig.shield = sh;
  // warhammer right hand
  const h = G(J.a1h, [0, -0.04, 0], [Math.PI / 2, 0, 0]); rig.wpn = h;
  M(h, cyl(0.025, 0.028, 0.72, 8), wood, [0, 0.18, 0]);
  M(h, box(0.3, 0.14, 0.14, 0.03), steel, [0, 0.5, 0]); M(h, box(0.32, 0.04, 0.16, 0.01), gold, [0, 0.5, 0]);
  M(h, cone(0.05, 0.14, 6), steel, [0, 0.62, 0]); M(h, sph(0.04, 8, 6), gold, [0, -0.18, 0]);
  rig.height = 1.9; rig.kind = 'paladin';
  return rig;
}
function posePaladin(rig, anim, t) {
  const rest = {a1u: [-0.35, 0, -0.2], a1f: [-1.25, 0, 0], a0u: [-0.55, -0.2, 0.2], a0f: [-1.3, 0.2, 0], spine: [0.04, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.05, 0.06), rest);
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.2, 0.12, 0.06), rest, {spine: [0.04, 0.07 * Math.cos(w), 0]}); }
  if (anim === 'attack') return merge(standLegs(rig, 0.07, 0.12), kf(t, [ // horizontal sweep right->left
    [0, rest],
    [0.3, {a1u: [-1.3, 0.9, -0.9], a1f: [-0.6, 0, 0], a0u: [-0.6, -0.3, 0.3], a0f: [-1.2, 0, 0], spine: [0, -0.55, 0], head: [0, 0.3, 0]}],
    [0.55, {a1u: [-1.45, -0.9, 0.2], a1f: [-0.2, 0, 0], a0u: [-0.5, -0.4, 0.4], a0f: [-1.2, 0, 0], spine: [0.1, 0.6, 0], head: [0, -0.3, 0]}],
    [1, rest]]));
  if (anim === 'cast') return merge(standLegs(rig, 0.1, 0.16), kf(t, [ // overhead slam
    [0, rest],
    [0.4, {a1u: [-3.0, 0, -0.2], a1f: [-0.5, 0, 0], a0u: [-0.9, -0.3, 0.3], a0f: [-1.2, 0, 0], spine: [-0.3, 0, 0], head: [0.2, 0, 0]}],
    [0.62, {a1u: [-0.9, 0, 0.0], a1f: [-0.1, 0, 0], a0u: [-0.4, -0.3, 0.4], a0f: [-1.0, 0, 0], spine: [0.45, 0, 0], head: [-0.3, 0, 0], 'body.y': -0.06}],
    [1, rest]]));
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}

function buildRanger() {
  const o = {thigh: 0.42, shin: 0.41, foot: 0.07, hipW: 0.095, torsoH: 0.5, shW: 0.2, upper: 0.29, fore: 0.27};
  const rig = humanoid(o); const J = rig.J;
  const green = mat(0x3f7a3a), greenD = mat(0x2a5228), cloak = mat(0x355e30), leath = mat(0x8a5e34), leathD = mat(0x553820), skin = mat(0xe8b88f), hair = mat(0x9a3d1e), wood = mat(0x7a4c24), str = mat(0xefe6d0), fl = mat(0xe8e2d0), eye = mat(0x223018), white = mat(0xffffff), brass = mat(0xd2a446);
  M(J.hips, cyl(0.15, 0.16, 0.15, 18), leathD, [0, 0, 0]);
  M(J.hips, tor(0.162, 0.025, Math.PI * 2, 8, 26), leath, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
  M(J.hips, cyl(0.16, 0.25, 0.34, 20, true, 0.6, Math.PI * 2 - 1.2), green, [0, -0.17, 0]); // tunic skirt
  M(J.hips, box(0.07, 0.1, 0.05, 0.015), leath, [-0.15, -0.02, 0.06], [0, -0.6, 0]);
  M(J.spine, cyl(0.17, 0.14, 0.5, 18), green, [0, 0.25, 0], [0, 0, 0], [1, 1, 0.8]);
  M(J.spine, box(0.05, 0.6, 0.025), leath, [0, 0.26, 0.14], [0.12, 0, -0.6]);
  M(J.chest, cyl(0.17, 0.4, 1.0, 20, true, Math.PI * 0.62, Math.PI * 0.76), cloak, [0, -0.22, -0.07]); // cloak
  M(J.chest, cyl(0.15, 0.24, 0.2, 18, true), greenD, [0, 0.16, 0]); // shoulder cape
  const q = G(J.chest, [-0.08, 0.02, -0.16], [0.25, 0, 0.35]); // quiver
  M(q, cyl(0.06, 0.05, 0.46, 12), leath, [0, 0, 0]); M(q, tor(0.06, 0.012, Math.PI * 2, 6, 14), brass, [0, 0.2, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 5; i++) { M(q, cyl(0.007, 0.007, 0.2, 4), wood, [-0.03 + i * 0.015, 0.31, (i % 2) * 0.02]); M(q, box(0.016, 0.07, 0.035), fl, [-0.03 + i * 0.015, 0.39, (i % 2) * 0.02]); }
  for (const i of [0, 1]) {
    limb(J['a' + i + 'u'], o.upper, 0.058, 0.05, green);
    limb(J['a' + i + 'f'], o.fore, 0.05, 0.042, skin);
    M(J['a' + i + 'f'], cyl(0.058, 0.052, 0.13, 12), leath, [0, -o.fore + 0.08, 0]);
    M(J['a' + i + 'h'], sph(0.045, 12, 10), leathD, [0, -0.03, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.078, 0.062, leathD);
    limb(J['l' + i + 's'], o.shin, 0.062, 0.05, leath);
    M(J['l' + i + 's'], cyl(0.075, 0.064, 0.16, 12), leathD, [0, -0.06, 0]);
    foot(J['l' + i + 'f'], 0.1, 0.07, 0.2, leathD);
  }
  M(J.neck, cyl(0.05, 0.055, 0.08), skin, [0, 0.02, 0]);
  const hd = G(J.head, [0, 0.115, 0.01]);
  M(hd, sph(0.125, 22, 16), skin, [0, 0, 0], [0, 0, 0], [0.93, 1.04, 0.98]);
  M(hd, box(0.11, 0.07, 0.09, 0.034), skin, [0, -0.08, 0.03]);
  eyes(hd, 0.021, 0.0, 0.112, 0.045, eye); eyes(hd, 0.009, 0.006, 0.13, 0.04, white);
  M(hd, box(0.05, 0.014, 0.02), hair, [0.05, 0.035, 0.116], [0, 0, -0.15]); M(hd, box(0.05, 0.014, 0.02), hair, [-0.05, 0.035, 0.116], [0, 0, 0.15]);
  M(hd, sph(0.14, 22, 16, 0), green, [0, 0.03, -0.025], [0, 0, 0], [1.05, 1, 1.08]); // hood
  M(hd, cone(0.1, 0.24, 12), green, [0, 0.08, -0.15], [-1.2, 0, 0]);
  M(hd, box(0.18, 0.05, 0.06, 0.02), hair, [0, 0.06, 0.1], [0.4, 0, 0]);
  M(hd, box(0.06, 0.2, 0.05, 0.02), hair, [0.1, -0.08, 0.05], [0, 0, 0.1]); // braid
  // longbow in left hand
  const b = G(J.a0h, [0, -0.04, 0]); rig.wpn = b;
  M(b, tor(0.52, 0.022, Math.PI * 0.72, 6, 22), wood, [0, 0, -0.2], [0, Math.PI / 2, Math.PI / 2 - Math.PI * 0.36]);
  M(b, cyl(0.03, 0.03, 0.12, 8), leath, [0, 0, 0], [Math.PI / 2, 0, 0]);
  M(b, box(0.006, 0.006, 0.96), str, [0, 0, -0.39]);
  rig.height = 1.8; rig.kind = 'ranger';
  return rig;
}
function poseRanger(rig, anim, t) {
  const rest = {a0u: [-0.55, 0.1, 0.15], a0f: [-0.5, 0, 0], a1u: [-0.2, 0, -0.12], a1f: [-0.5, 0, 0]};
  const draw = {a0u: [-1.55, 0.25, 0.1], a0f: [0, 0, 0], a1u: [-1.4, -0.45, -0.3], a1f: [-2.2, 0, 0], spine: [0, 0.45, 0], head: [0, -0.35, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.05, 0.05), rest);
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.21, 0.12, 0.06), rest, {a1u: [0.3 * Math.cos(w), 0, 0], spine: [0.04, 0.07 * Math.cos(w), 0]}); }
  if (anim === 'attack') return merge(standLegs(rig, 0.07, 0.13), kf(t, [[0, merge(draw, {a1f: [-1.2, 0, 0]})], [0.5, draw], [0.7, merge(draw, {a1u: [-1.2, -0.7, -0.6], a1f: [-0.6, 0, 0]})], [1, merge(draw, {a1f: [-1.2, 0, 0]})]]));
  if (anim === 'cast') return merge(standLegs(rig, 0.06, 0.1), kf(t, [[0, rest], [0.4, {a1u: [-2.9, 0, -0.3], a1f: [-0.2, 0, 0], a0u: [-0.4, 0, 0.3], head: [0.35, 0, 0], spine: [-0.15, 0, 0]}], [0.7, {a1u: [-2.7, 0, -0.5], a1f: [-0.6, 0, 0], a0u: [-0.4, 0, 0.3], head: [0.3, 0, 0]}], [1, rest]]));
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}

function buildAlchemist() {
  const o = {thigh: 0.4, shin: 0.39, foot: 0.07, hipW: 0.095, torsoH: 0.5, shW: 0.2, upper: 0.28, fore: 0.27};
  const rig = humanoid(o); const J = rig.J;
  const coat = mat(0x6e4a2c), coatD = mat(0x4a301b), apron = mat(0xd3bf8c), brass = mat(0xd9a84a), copper = mat(0xc06a34), skin = mat(0xf2c7a6), hair = mat(0xc4421e), glass = mat(0x9ad9e6), eye = mat(0x2a1a14), white = mat(0xffffff), boot = mat(0x3a2618);
  const vials = [glow(0x7cff5a), glow(0xff5ad2), glow(0x5ab4ff), glow(0xffd23a)];
  M(J.hips, cyl(0.16, 0.17, 0.15, 18), coatD, [0, 0, 0]);
  M(J.hips, cyl(0.17, 0.28, 0.44, 20, true, 0.5, Math.PI * 2 - 1.0), coat, [0, -0.22, -0.01]); // long coat
  M(J.hips, box(0.24, 0.42, 0.02, 0.01), apron, [0, -0.2, 0.17], [0.1, 0, 0]);
  M(J.hips, tor(0.172, 0.028, Math.PI * 2, 8, 26), boot, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 4; i++) { const a = -1.1 + i * 0.32; M(J.hips, cyl(0.022, 0.022, 0.08, 8), vials[i], [Math.sin(a) * 0.19, 0.0, Math.cos(a) * 0.19]); M(J.hips, cyl(0.012, 0.012, 0.03, 6), boot, [Math.sin(a) * 0.19, 0.055, Math.cos(a) * 0.19]); }
  M(J.spine, cyl(0.17, 0.14, 0.5, 18), coat, [0, 0.25, 0], [0, 0, 0], [1, 1, 0.82]);
  M(J.spine, box(0.2, 0.3, 0.02, 0.01), apron, [0, 0.27, 0.135]);
  M(J.spine, box(0.05, 0.58, 0.025), boot, [0, 0.26, 0.15], [0.1, 0, 0.6]);
  for (let i = 0; i < 4; i++) M(J.spine, cyl(0.018, 0.018, 0.06, 6), vials[(i + 2) % 4], [-0.11 + i * 0.07, 0.15 + i * 0.075, 0.17], [0, 0, 0.6]);
  // backpack tank
  const bp = G(J.chest, [0, 0.0, -0.2]);
  M(bp, cyl(0.1, 0.1, 0.36, 14), copper, [0, 0, 0]); M(bp, sph(0.1, 14, 10), copper, [0, 0.18, 0]);
  M(bp, cyl(0.06, 0.06, 0.24, 10), glass, [0.13, -0.02, 0.02]); M(bp, cyl(0.045, 0.045, 0.2, 10), vials[0], [0.13, -0.02, 0.02]);
  M(bp, tor(0.12, 0.02, Math.PI, 6, 12), brass, [0, 0.12, 0.08], [0, 0, 0]);
  for (const i of [0, 1]) {
    limb(J['a' + i + 'u'], o.upper, 0.055, 0.048, coat);
    limb(J['a' + i + 'f'], o.fore, 0.048, 0.04, coatD);
    M(J['a' + i + 'f'], cyl(0.065, 0.055, 0.08, 12), apron, [0, -o.fore + 0.05, 0]);
    M(J['a' + i + 'h'], sph(0.045, 12, 10), boot, [0, -0.03, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.075, 0.06, coatD);
    limb(J['l' + i + 's'], o.shin, 0.06, 0.05, boot);
    foot(J['l' + i + 'f'], 0.095, 0.07, 0.19, boot);
  }
  M(J.neck, cyl(0.045, 0.05, 0.08), skin, [0, 0.02, 0]);
  const hd = G(J.head, [0, 0.115, 0.01]);
  M(hd, sph(0.122, 22, 16), skin, [0, 0, 0], [0, 0, 0], [0.93, 1.04, 0.98]);
  M(hd, box(0.1, 0.07, 0.09, 0.034), skin, [0, -0.08, 0.03]);
  eyes(hd, 0.022, 0.0, 0.11, 0.045, eye); eyes(hd, 0.009, 0.007, 0.128, 0.04, white);
  M(hd, sph(0.132, 22, 16), hair, [0, 0.03, -0.025], [0, 0, 0], [1.04, 0.95, 1.04]);
  M(hd, box(0.2, 0.06, 0.07, 0.025), hair, [0, 0.07, 0.085], [0.5, 0, 0]);
  M(hd, cyl(0.04, 0.03, 0.26, 8), hair, [0.0, -0.12, -0.12], [0.3, 0, 0]); M(hd, sph(0.04, 8, 6), hair, [0, -0.26, -0.16]); // braid
  // goggles pushed up on forehead
  M(hd, tor(0.128, 0.012, Math.PI * 2, 6, 26), boot, [0, 0.07, 0], [Math.PI / 2 - 0.25, 0, 0]);
  for (const s of [1, -1]) { M(hd, cyl(0.04, 0.04, 0.035, 14), brass, [s * 0.05, 0.11, 0.1], [Math.PI / 2 - 0.6, 0, 0]); M(hd, cyl(0.03, 0.03, 0.04, 14), glass, [s * 0.05, 0.112, 0.103], [Math.PI / 2 - 0.6, 0, 0]); }
  // flask in right hand
  const f = G(J.a1h, [0, -0.07, 0.02]); rig.wpn = f;
  M(f, sph(0.06, 12, 10), glass, [0, -0.02, 0]); M(f, sph(0.05, 12, 10), vials[0], [0, -0.025, 0]); M(f, cyl(0.02, 0.02, 0.06, 8), glass, [0, 0.05, 0]); M(f, cyl(0.022, 0.022, 0.02, 8), mat(0x8a5a2e), [0, 0.085, 0]);
  rig.height = 1.75; rig.kind = 'alch';
  return rig;
}
function poseAlchemist(rig, anim, t) {
  const rest = {a1u: [-0.35, 0, -0.15], a1f: [-1.2, 0, 0], a0u: [-0.15, 0, 0.15], a0f: [-0.5, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.05, 0.05), rest);
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.19, 0.11, 0.06), rest, {a0u: [0.4 * Math.cos(w), 0, 0], spine: [0.04, 0.07 * Math.cos(w), 0]}); }
  if (anim === 'attack') return merge(standLegs(rig, 0.07, 0.13), kf(t, [ // overhand throw
    [0, rest],
    [0.35, {a1u: [-2.6, -0.2, -0.4], a1f: [-1.4, 0, 0], a0u: [-1.1, 0, 0.3], a0f: [-0.4, 0, 0], spine: [-0.15, -0.35, 0], head: [0.05, 0.25, 0]}],
    [0.6, {a1u: [-1.3, 0.1, 0.0], a1f: [-0.1, 0, 0], a0u: [-0.3, 0, 0.3], spine: [0.25, 0.3, 0], head: [-0.1, -0.2, 0]}],
    [1, rest]]));
  if (anim === 'cast') return merge(standLegs(rig, 0.05, 0.08), kf(t, [[0, rest], [0.45, {a1u: [-2.8, 0, -0.2], a1f: [-0.2, 0, 0], a0u: [-1.6, 0, 0.4], a0f: [-0.6, 0, 0], head: [0.3, 0, 0], spine: [-0.1, 0, 0]}], [1, rest]]));
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}

function buildBlademaster() {
  const o = {thigh: 0.43, shin: 0.42, foot: 0.07, hipW: 0.095, torsoH: 0.5, shW: 0.2, upper: 0.29, fore: 0.27};
  const rig = humanoid(o); const J = rig.J;
  const red = mat(0xb3262b), redD = mat(0x7a161b), black = mat(0x26222e), white = mat(0xf2ede4), gold = mat(0xe0b04a), steel = mat(0xe3e8ee), skin = mat(0xeec09a), hair = mat(0x1a1720), eye = mat(0x1a1416), wrap = mat(0x5a4a3a);
  M(J.hips, cyl(0.15, 0.16, 0.14, 18), black, [0, 0, 0]);
  M(J.hips, tor(0.158, 0.035, Math.PI * 2, 8, 26), white, [0, 0.03, 0], [Math.PI / 2, 0, 0]); // sash
  M(J.hips, box(0.06, 0.34, 0.02, 0.01), white, [0.07, -0.18, 0.15], [0.1, 0, 0.12]); M(J.hips, box(0.05, 0.28, 0.02, 0.01), red, [0.12, -0.15, 0.13], [0.1, 0, 0.2]);
  M(J.hips, cyl(0.16, 0.26, 0.3, 20, true, 0.9, Math.PI * 2 - 1.8), black, [0, -0.15, 0]);
  M(J.spine, cyl(0.17, 0.13, 0.5, 18), red, [0, 0.25, 0], [0, 0, 0], [1, 1, 0.8]);
  M(J.spine, box(0.03, 0.42, 0.02, 0.005), gold, [-0.04, 0.26, 0.13], [0, 0, -0.35]); // wrap seam
  M(J.spine, box(0.05, 0.55, 0.02), redD, [0.04, 0.26, 0.13], [0, 0, 0.5]);
  // long scarf
  M(J.chest, tor(0.1, 0.04, Math.PI * 2, 8, 18), red, [0, 0.24, 0], [Math.PI / 2, 0, 0]);
  M(J.chest, box(0.08, 0.6, 0.02, 0.01), red, [0.06, -0.06, -0.15], [-0.35, 0, 0.15]); M(J.chest, box(0.07, 0.5, 0.02, 0.01), redD, [-0.03, -0.02, -0.17], [-0.45, 0, -0.1]);
  for (const i of [0, 1]) {
    const s = i ? -1 : 1;
    M(J['a' + i + 'u'], hemi(0.08), black, [s * 0.02, 0.02, 0], [0, 0, s * 0.4], [1, 0.8, 1.1]);
    limb(J['a' + i + 'u'], o.upper, 0.05, 0.045, skin);
    limb(J['a' + i + 'f'], o.fore, 0.046, 0.038, wrap);
    M(J['a' + i + 'h'], sph(0.042, 12, 10), skin, [0, -0.03, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.08, 0.065, black);
    limb(J['l' + i + 's'], o.shin, 0.062, 0.048, black);
    M(J['l' + i + 's'], cyl(0.06, 0.05, 0.16, 12), wrap, [0, -o.shin + 0.1, 0]);
    foot(J['l' + i + 'f'], 0.09, 0.06, 0.19, black);
    // curved blade in each hand
    const bl = G(J['a' + i + 'h'], [0, -0.04, 0], [Math.PI / 2, 0, 0]);
    M(bl, cyl(0.018, 0.02, 0.14, 8), black, [0, 0.0, 0]); M(bl, box(0.1, 0.02, 0.05, 0.008), gold, [0, 0.08, 0]);
    const bs = new THREE.Shape(); bs.moveTo(-0.02, 0); bs.quadraticCurveTo(0.05, 0.3, -0.03, 0.62); bs.quadraticCurveTo(-0.01, 0.3, -0.045, 0.0); bs.lineTo(-0.02, 0);
    const bgm = new THREE.ExtrudeGeometry(bs, {depth: 0.01, bevelEnabled: false, curveSegments: 12}); bgm.translate(0.02, 0.09, -0.005);
    M(bl, bgm, steel, [0, 0, 0]);
    if (!i) rig.wpn = bl;
  }
  M(J.neck, cyl(0.045, 0.05, 0.08), skin, [0, 0.02, 0]);
  const hd = G(J.head, [0, 0.115, 0.01]);
  M(hd, sph(0.122, 22, 16), skin, [0, 0, 0], [0, 0, 0], [0.92, 1.05, 0.98]);
  M(hd, box(0.11, 0.07, 0.09, 0.034), skin, [0, -0.08, 0.03]);
  eyes(hd, 0.02, 0.0, 0.11, 0.045, eye); eyes(hd, 0.008, 0.006, 0.128, 0.04, white);
  M(hd, box(0.055, 0.014, 0.02), hair, [0.05, 0.035, 0.114], [0, 0, -0.3]); M(hd, box(0.055, 0.014, 0.02), hair, [-0.05, 0.035, 0.114], [0, 0, 0.3]);
  M(hd, sph(0.13, 22, 16), hair, [0, 0.03, -0.03], [0, 0, 0], [1.02, 0.95, 1.02]);
  M(hd, sph(0.05, 10, 8), hair, [0, 0.15, -0.06]); M(hd, cyl(0.025, 0.012, 0.18, 8), hair, [0, 0.15, -0.16], [-1.1, 0, 0]); // topknot tail
  M(hd, tor(0.128, 0.018, Math.PI * 2, 6, 24), red, [0, 0.07, 0], [Math.PI / 2 - 0.15, 0, 0]); // headband
  M(hd, box(0.03, 0.2, 0.01), red, [0.03, 0.0, -0.14], [0.6, 0, 0.3]); M(hd, box(0.03, 0.18, 0.01), red, [-0.02, 0.0, -0.15], [0.7, 0, -0.2]);
  rig.height = 1.8; rig.kind = 'blade';
  return rig;
}
function poseBlademaster(rig, anim, t) {
  const rest = {a1u: [-0.5, 0.2, -0.35], a1f: [-1.0, 0, 0], a0u: [-0.5, -0.2, 0.35], a0f: [-1.0, 0, 0], spine: [0.1, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.09, 0.1), rest);
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.23, 0.13, 0.08), {a1u: [0.5 * Math.cos(w) - 0.3, 0.3, -0.5], a0u: [-0.5 * Math.cos(w) - 0.3, -0.3, 0.5], a1f: [-0.8, 0, 0], a0f: [-0.8, 0, 0], spine: [0.22, 0.09 * Math.cos(w), 0]}); }
  if (anim === 'attack') return merge(standLegs(rig, 0.1, 0.14), kf(t, [ // cross slash
    [0, rest],
    [0.3, {a1u: [-1.9, 0.6, -0.9], a1f: [-0.5, 0, 0], a0u: [-1.9, -0.6, 0.9], a0f: [-0.5, 0, 0], spine: [-0.1, 0, 0]}],
    [0.55, {a1u: [-1.0, -0.9, 0.6], a1f: [-0.1, 0, 0], a0u: [-1.0, 0.9, -0.6], a0f: [-0.1, 0, 0], spine: [0.3, 0, 0]}],
    [1, rest]]));
  if (anim === 'cast') return merge(standLegs(rig, 0.12, 0.18), {a1u: [-1.5, 0, -1.4], a1f: [-0.1, 0, 0], a0u: [-1.5, 0, 1.4], a0f: [-0.1, 0, 0], spine: [0.15, t * Math.PI * 2, 0], body: [0, t * Math.PI * 2, 0]});
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}
