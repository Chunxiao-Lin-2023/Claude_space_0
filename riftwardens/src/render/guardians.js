// =====================================================================
// GUARDIANS — allied units placed like traps
// =====================================================================
function buildSoldier(kind) {
  const o = {thigh: 0.4, shin: 0.39, foot: 0.07, hipW: 0.1, torsoH: 0.52, shW: 0.22, upper: 0.29, fore: 0.27};
  const rig = humanoid(o); const J = rig.J;
  const steel = mat(0xc4ccd6), steelD = mat(0x6e7886), tab = mat(kind === 'gknight' ? 0x2f7a4a : 0x2e6ab8), tabD = mat(kind === 'gknight' ? 0x1f5232 : 0x1d4680), gold = mat(0xe2b448), skin = mat(0xeec29c), leath = mat(0x5e3e24), wood = mat(0x7a522c), white = mat(0xf4efe6), eye = mat(0x1d1a26);
  M(J.hips, cyl(0.17, 0.18, 0.16, 18), steelD, [0, -0.02, 0]);
  M(J.hips, box(0.22, 0.36, 0.025, 0.01), tab, [0, -0.17, 0.18], [0.08, 0, 0]); M(J.hips, box(0.22, 0.36, 0.025, 0.01), tab, [0, -0.17, -0.18], [-0.08, 0, 0]);
  M(J.hips, tor(0.18, 0.026, Math.PI * 2, 8, 24), leath, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
  M(J.spine, cyl(0.2, 0.16, 0.54, 20), steel, [0, 0.27, 0], [0, 0, 0], [1, 1, 0.82]);
  M(J.spine, box(0.24, 0.44, 0.03, 0.01), tab, [0, 0.25, 0.15]);
  M(J.spine, box(0.1, 0.1, 0.02, 0.01), gold, [0, 0.33, 0.168], [0, 0, Math.PI / 4]);
  for (const i of [0, 1]) {
    const s = i ? -1 : 1;
    M(J['a' + i + 'u'], hemi(0.11), steel, [s * 0.02, 0.02, 0], [0, 0, s * 0.45], [1, 0.8, 1.1]);
    limb(J['a' + i + 'u'], o.upper, 0.062, 0.054, steelD);
    limb(J['a' + i + 'f'], o.fore, 0.054, 0.046, steel);
    M(J['a' + i + 'h'], sph(0.05, 12, 10), leath, [0, -0.035, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.08, 0.065, tabD);
    limb(J['l' + i + 's'], o.shin, 0.066, 0.055, steel);
    foot(J['l' + i + 'f'], 0.11, 0.08, 0.21, steelD);
  }
  M(J.neck, cyl(0.055, 0.06, 0.08), skin, [0, 0.02, 0]);
  const hd = G(J.head, [0, 0.12, 0.01]);
  M(hd, sph(0.125, 20, 14), skin, [0, 0, 0], [0, 0, 0], [0.95, 1.05, 1]);
  M(hd, box(0.12, 0.08, 0.1, 0.035), skin, [0, -0.08, 0.035]);
  eyes(hd, 0.02, 0.0, 0.115, 0.046, eye); eyes(hd, 0.008, 0.006, 0.132, 0.04, white);
  M(hd, box(0.08, 0.03, 0.04, 0.01), mat(0x5a3a1a), [0, -0.105, 0.08]); // moustache
  if (kind === 'gknight') { // great helm with green plume
    M(hd, sph(0.15, 20, 14), steel, [0, 0.02, 0], [0, 0, 0], [1, 1.05, 1.02]);
    M(hd, box(0.18, 0.02, 0.03, 0.005), mat(0x111111), [0, 0.0, 0.148]); M(hd, box(0.02, 0.12, 0.03, 0.005), mat(0x111111), [0, -0.05, 0.148]);
    for (let i = 0; i < 5; i++) M(hd, box(0.03, 0.08, 0.045, 0.01), tab, [0, 0.17 - Math.abs(i - 2) * 0.012, 0.06 - i * 0.04]);
  } else { // kettle hat
    M(hd, sph(0.14, 20, 12, 0), steel, [0, 0.04, -0.01], [0, 0, 0], [1, 0.8, 1]);
    M(hd, cyl(0.22, 0.22, 0.02, 24), steelD, [0, 0.05, 0]);
  }
  if (kind === 'gknight') {
    const sh = G(J.chest, [0.17, -0.1, 0.3], [0.1, -0.2, 0]);
    M(sh, box(0.46, 0.7, 0.07, 0.04), tab, [0, 0, 0]); M(sh, box(0.5, 0.06, 0.09, 0.02), steel, [0, 0.33, 0]); M(sh, box(0.5, 0.06, 0.09, 0.02), steel, [0, -0.33, 0]);
    M(sh, box(0.06, 0.74, 0.09, 0.02), steel, [0.22, 0, 0]); M(sh, box(0.06, 0.74, 0.09, 0.02), steel, [-0.22, 0, 0]);
    M(sh, box(0.05, 0.36, 0.02, 0.005), gold, [0, 0, 0.045]); M(sh, box(0.24, 0.05, 0.02, 0.005), gold, [0, 0.07, 0.045]);
    const sw = G(J.a1h, [0, -0.04, 0], [Math.PI / 2, 0, 0]); rig.wpn = sw;
    M(sw, cyl(0.02, 0.022, 0.14, 8), leath, [0, 0, 0]); M(sw, box(0.16, 0.025, 0.04, 0.01), gold, [0, 0.08, 0]);
    M(sw, box(0.05, 0.62, 0.012, 0.004), steel, [0, 0.4, 0]); M(sw, cone(0.025, 0.08, 4), steel, [0, 0.74, 0], [0, 0, 0], [1, 1, 0.3]);
  } else {
    const W = G(J.chest, [-0.06, 0.09, 0.24]); rig.wpn = W;
    M(W, box(0.06, 0.07, 0.52, 0.02), wood, [0, 0, 0.02]); M(W, box(0.035, 0.11, 0.05, 0.015), leath, [0, -0.09, -0.04]);
    M(W, tor(0.32, 0.02, Math.PI * 0.42, 6, 16), steelD, [0, 0.03, -0.02], [Math.PI / 2, 0, Math.PI * 0.29]);
    M(W, box(0.42, 0.008, 0.008), white, [0, 0.035, 0.18]); M(W, cone(0.022, 0.06, 6), steel, [0, 0.07, 0.34], [Math.PI / 2, 0, 0]);
  }
  rig.height = 1.85; rig.kind = kind;
  return rig;
}
function poseSoldier(rig, anim, t) {
  const knight = rig.kind === 'gknight';
  const aimHold = knight ? {a1u: [-0.4, 0, -0.25], a1f: [-1.2, 0, 0], a0u: [-0.9, -0.3, 0.1], a0f: [-0.9, 0.3, 0]}
    : {_ik: [[1, [-0.06, -0.02, 0.19], [-0.6, -1, -0.3]], [0, [-0.04, 0.04, 0.41], [0.8, -1, 0]]]};
  if (anim === 'idle') return merge(standLegs(rig, 0.05, 0.08), aimHold);
  if (anim === 'attack') {
    if (!knight) return merge(standLegs(rig, 0.06, 0.1), aimHold, kf(t, [[0, {}], [0.3, {spine: [-0.08, 0, 0], chest: [-0.06, 0, 0]}], [1, {}]]));
    return merge(standLegs(rig, 0.08, 0.12), kf(t, [[0, aimHold], [0.35, merge(aimHold, {a1u: [-2.6, 0.3, -0.5], a1f: [-0.6, 0, 0], spine: [-0.15, -0.3, 0]})], [0.6, merge(aimHold, {a1u: [-0.9, -0.4, 0.1], a1f: [-0.1, 0, 0], spine: [0.3, 0.3, 0]})], [1, aimHold]]));
  }
  if (anim === 'walk') return merge(walkLegs(rig, t, 0.18, 0.1, 0.06), aimHold);
  return {};
}
