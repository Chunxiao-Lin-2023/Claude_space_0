// =====================================================================
// ENEMIES — round 2: shield orc, sapper kobold, shaman
// =====================================================================
function buildShieldOrc() {
  const rig = buildGrunt(); const J = rig.J, o = rig.o;
  rig.roundShield.visible = false;
  const iron = mat(0x6e7681), ironD = mat(0x474d57), wood = mat(0x6a4526), red = mat(0x9a2a1f), bone = mat(0xece2c4);
  // tower shield on the left forearm, facing outward/forward
  const sh = G(J.chest, [0.16, -0.12, 0.34], [0.12, -0.25, 0]);
  M(sh, box(0.6, 1.0, 0.08, 0.04), wood, [0, 0, 0]);
  M(sh, box(0.08, 1.04, 0.1, 0.02), iron, [0.29, 0, 0]); M(sh, box(0.08, 1.04, 0.1, 0.02), iron, [-0.29, 0, 0]);
  M(sh, box(0.64, 0.08, 0.1, 0.02), iron, [0, 0.48, 0]); M(sh, box(0.64, 0.08, 0.1, 0.02), iron, [0, -0.48, 0]);
  M(sh, sph(0.11, 12, 8), ironD, [0, 0.05, 0.05], [0, 0, 0], [1, 1, 0.6]);
  M(sh, box(0.06, 0.42, 0.02, 0.01), red, [0, -0.18, 0.05]); M(sh, box(0.3, 0.06, 0.02, 0.01), red, [0, -0.06, 0.05]);
  // iron helm + chest plate
  M(J.head, sph(0.17, 18, 12, 0), iron, [0, 0.16, 0.03], [0, 0, 0], [1.05, 0.8, 1.05]);
  M(J.head, cone(0.03, 0.14, 6), bone, [0.1, 0.27, 0.0], [0, 0, -0.5]); M(J.head, cone(0.03, 0.14, 6), bone, [-0.1, 0.27, 0.0], [0, 0, 0.5]);
  M(J.spine, box(0.42, 0.34, 0.08, 0.04), iron, [0, 0.38, 0.22], [-0.15, 0, 0]);
  M(J.spine, box(0.44, 0.06, 0.09, 0.02), ironD, [0, 0.24, 0.22], [-0.15, 0, 0]);
  rig.kind = 'shield';
  return rig;
}
function poseShieldOrc(rig, anim, t) {
  const guard = {a0u: [-0.9, -0.3, 0.1], a0f: [-0.9, 0.3, 0], a1u: [-0.3, 0, -0.25], a1f: [-1.3, 0, 0], spine: [0.08, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.07, 0.08), guard);
  if (anim === 'walk') return merge(walkLegs(rig, t, 0.17, 0.1, 0.07), guard, {spine: [0.08, 0.05 * Math.cos(2 * Math.PI * t), 0]});
  if (anim === 'attack') return merge(standLegs(rig, 0.08, 0.12), kf(t, [
    [0, guard],
    [0.4, merge(guard, {a1u: [-2.7, 0.2, -0.3], a1f: [-0.9, 0, 0], spine: [-0.2, -0.2, 0]})],
    [0.6, merge(guard, {a1u: [-0.8, -0.1, 0.05], a1f: [-0.2, 0, 0], spine: [0.35, 0.25, 0]})],
    [1, guard]]));
  if (anim === 'die') return dieFall(rig, t, guard);
  return {};
}
function buildSapper() {
  const rig = buildKobold(); const J = rig.J;
  rig.sack.forEach(m => m.visible = false);
  const black = mat(0x1e1c22), iron = mat(0x5a5f68), rope = mat(0x7a5a32), red = mat(0xb02a20);
  const b = G(J.chest, [0, 0.06, -0.22]);
  M(b, sph(0.17, 16, 12), black, [0, 0, 0]);
  M(b, tor(0.172, 0.015, Math.PI * 2, 6, 20), iron, [0, 0, 0], [Math.PI / 2, 0, 0]);
  M(b, cyl(0.03, 0.03, 0.08, 8), iron, [0, 0.18, 0]);
  M(b, cyl(0.008, 0.008, 0.12, 4), rope, [0.02, 0.26, 0], [0, 0, -0.4]);
  M(b, sph(0.03, 8, 6), glow(0xffd23a), [0.05, 0.32, 0]);
  M(b, box(0.05, 0.05, 0.02, 0.005), red, [0, 0.0, -0.17]); // skull-ish marking
  M(J.head, box(0.22, 0.05, 0.07, 0.02), red, [0, 0.07, 0.07], [0.3, 0, 0]); // red bandana
  rig.kind = 'sapper';
  return rig;
}
function buildShaman() {
  const rig = buildArcher(); const J = rig.J;
  rig.wpn.visible = false; rig.quiver.visible = false;
  const wood = mat(0x5a3a1c), bone = mat(0xf0e6cc), feather = mat(0xc93a2a), feather2 = mat(0x2f8a7a), beads = mat(0xd9a84a), gem = glow(0x7cff6a), paint = mat(0xe8e0d0);
  // skull mask + feather headdress
  M(J.head, sph(0.11, 14, 10), bone, [0, 0.12, 0.11], [0, 0, 0], [1, 0.9, 0.6]);
  eyes(J.head, 0.025, 0.14, 0.17, 0.04, mat(0x101010));
  for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; M(J.head, box(0.05, 0.28, 0.015, 0.01), i % 2 ? feather : feather2, [Math.sin(a) * 0.16, 0.3, -0.04 + Math.cos(a) * 0.02], [-0.25, 0, -a * 0.8]); }
  M(J.chest, tor(0.14, 0.02, Math.PI * 2, 6, 18), beads, [0, 0.18, 0.02], [Math.PI / 2 - 0.3, 0, 0]);
  for (let i = 0; i < 5; i++) M(J.chest, sph(0.025, 6, 4), bone, [-0.1 + i * 0.05, 0.08, 0.15]);
  // totem staff in right hand
  const s = G(J.a1h, [0, -0.04, 0.02], [Math.PI / 2, 0, 0]); rig.staff = s;
  M(s, cyl(0.025, 0.03, 1.5, 8), wood, [0, 0.35, 0]);
  M(s, sph(0.09, 10, 8), bone, [0, 1.15, 0], [0, 0, 0], [1, 1.1, 0.9]);
  M(s, sph(0.06, 10, 8), gem, [0, 1.28, 0]);
  for (let i = 0; i < 3; i++) M(s, box(0.03, 0.18, 0.01, 0.005), i % 2 ? feather : feather2, [Math.cos(i * 2.1) * 0.08, 1.0, Math.sin(i * 2.1) * 0.08], [0.3, i * 2.1, 0]);
  rig.kind = 'shaman';
  return rig;
}
function poseShaman(rig, anim, t) {
  const rest = {a1u: [-0.45, 0, -0.12], a1f: [-0.9, 0, 0], a0u: [-0.2, 0, 0.2], a0f: [-0.5, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.05, 0.05), rest);
  if (anim === 'walk') return merge(walkLegs(rig, t, 0.18, 0.11, 0.06), rest, {a0u: [0.35 * Math.cos(2 * Math.PI * t), 0, 0]});
  if (anim === 'attack') return merge(standLegs(rig, 0.06, 0.1), kf(t, [[0, rest], [0.5, {a1u: [-2.9, 0, -0.2], a1f: [-0.2, 0, 0], a0u: [-2.2, 0, 0.6], a0f: [-0.3, 0, 0], spine: [-0.2, 0, 0], head: [0.3, 0, 0]}], [1, rest]]));
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}
