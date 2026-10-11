// Procedural toon models for 裂隙守卫 (Rift Wardens). Every unit is built from primitives;
// a hand-built skeleton of Groups (known local axes) is posed by keyframes / analytic IK.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const PPU = 150; // render pixels per world unit (supersampled; packer scales down)
const R = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
R.setPixelRatio(1);
R.setClearColor(0x000000, 0);
R.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(R.domElement);

const grad = (() => {
  const v = [70, 150, 215, 255];
  const d = new Uint8Array(v.length * 4);
  v.forEach((x, i) => { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = x; d[i * 4 + 3] = 255; });
  const t = new THREE.DataTexture(d, v.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const MC = new Map();
function mat(c, e = 0, ei = 1) {
  const k = c + '|' + e + '|' + ei;
  if (!MC.has(k)) MC.set(k, new THREE.MeshToonMaterial({color: c, gradientMap: grad, side: THREE.DoubleSide, emissive: e, emissiveIntensity: ei, alphaTest: 0.5}));
  return MC.get(k);
}
const glow = c => mat(c, c, 1.6);

// ---------- geometry helpers ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function G(parent, p = [0, 0, 0], r = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...p); g.rotation.set(...r); if (parent) parent.add(g); return g; }
function M(parent, geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); parent.add(o); return o;
}
const sph = (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs);
const hemi = r => new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
const cyl = (rt, rb, h, s = 16, open = false, ts = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open, ts, tl);
const cone = (r, h, s = 12) => new THREE.ConeGeometry(r, h, s);
const box = (w, h, d, rad = 0.02) => new RoundedBoxGeometry(w, h, d, 3, Math.min(rad, w / 2.01, h / 2.01, d / 2.01));
const tor = (R0, r, arc = Math.PI * 2, rs = 8, ts = 24) => new THREE.TorusGeometry(R0, r, rs, ts, arc);
const lathe = (pts, s = 24, ts = 0, tl = Math.PI * 2) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), s, ts, tl);
const oct = r => new THREE.OctahedronGeometry(r, 0);
// tapered limb hanging down from its pivot
function limb(pivot, len, r0, r1, m, joint = true) {
  M(pivot, cyl(r0, r1, len, 14), m, [0, -len / 2, 0]);
  if (joint) M(pivot, sph(r1, 14, 10), m, [0, -len, 0]);
  M(pivot, sph(r0, 14, 10), m, [0, 0, 0]);
}

// ---------- skeleton ----------
function humanoid(o) {
  const H = o.thigh + o.shin + o.foot;
  const J = {};
  const root = new THREE.Group();
  J.body = G(root);
  J.hips = G(J.body, [0, H, 0]);
  J.spine = G(J.hips, [0, 0.02, 0]);
  J.chest = G(J.spine, [0, o.torsoH * 0.5, 0]);
  J.neck = G(J.chest, [0, o.torsoH * 0.5, o.neckZ || 0]);
  J.head = G(J.neck, [0, o.neckL || 0.05, 0]);
  for (const i of [0, 1]) {
    const s = i ? -1 : 1; // 0 = character's left (+X), 1 = right (-X) weapon hand
    const u = G(J.chest, [s * o.shW, o.torsoH * 0.4, 0]);
    const f = G(u, [0, -o.upper, 0]);
    const h = G(f, [0, -o.fore, 0]);
    J['a' + i + 'u'] = u; J['a' + i + 'f'] = f; J['a' + i + 'h'] = h;
    const t = G(J.hips, [s * o.hipW, 0, 0]);
    const sh = G(t, [0, -o.thigh, 0]);
    const ft = G(sh, [0, -o.shin, 0]);
    J['l' + i + 't'] = t; J['l' + i + 's'] = sh; J['l' + i + 'f'] = ft;
  }
  const rest = {};
  for (const k in J) rest[k] = {p: J[k].position.clone(), r: J[k].rotation.clone()};
  return {root, J, o, rest, H};
}
function resetPose(rig) {
  for (const k in rig.J) { rig.J[k].position.copy(rig.rest[k].p); rig.J[k].rotation.copy(rig.rest[k].r); }
}
// pose object: { joint: [rx,ry,rz], 'body.y': v, 'body.z': v }
const _Y = new THREE.Vector3(0, -1, 0);
// 3D two-bone arm IK in chest space: target T, pole hint (elbow direction)
function armIK(rig, i, T, pole) {
  const J = rig.J, o = rig.o, up = J['a' + i + 'u'], fo = J['a' + i + 'f'];
  const S = up.position.clone(), Tv = V(...T), L1 = o.upper, L2 = o.fore;
  let D = Tv.clone().sub(S); let d = D.length(); const dir = D.clone().normalize();
  d = Math.min(Math.max(d, Math.abs(L1 - L2) + 1e-3), (L1 + L2) * 0.999);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pv = V(...pole).normalize(); const perp = pv.sub(dir.clone().multiplyScalar(pv.dot(dir))).normalize();
  const E = S.clone().add(dir.clone().multiplyScalar(a)).add(perp.multiplyScalar(h));
  const Tc = S.clone().add(dir.clone().multiplyScalar(d));
  up.quaternion.setFromUnitVectors(_Y, E.clone().sub(S).normalize());
  const fl = Tc.clone().sub(E).normalize().applyQuaternion(up.quaternion.clone().invert());
  fo.quaternion.setFromUnitVectors(_Y, fl);
}
function applyPose(rig, P) {
  if (P._ik) for (const a of P._ik) armIK(rig, ...a);
  for (const k in P) {
    if (k === '_ik') continue;
    const v = P[k];
    if (k.includes('.')) { const [j, ax] = k.split('.'); rig.J[j].position[ax] = rig.rest[j].p[ax] + v; continue; }
    const j = rig.J[k]; if (!j) continue;
    j.rotation.set(rig.rest[k].r.x + (v[0] || 0), rig.rest[k].r.y + (v[1] || 0), rig.rest[k].r.z + (v[2] || 0));
  }
}
const ss = t => t * t * (3 - 2 * t);
function lerpPose(a, b, t) {
  const o = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k === '_ik') { o._ik = t < 0.5 ? a._ik : b._ik; if (!o._ik) delete o._ik; continue; }
    const x = a[k], y = b[k];
    if (typeof (x ?? y) === 'number') o[k] = (x || 0) + ((y || 0) - (x || 0)) * t;
    else { const X = x || [0, 0, 0], Y = y || [0, 0, 0]; o[k] = [0, 1, 2].map(i => (X[i] || 0) + ((Y[i] || 0) - (X[i] || 0)) * t); }
  }
  return o;
}
// keyframes [[t, pose], ...] sorted; smoothstep between
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) return lerpPose(a, b, ss((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}
const merge = (...ps) => { const o = {}; for (const p of ps) for (const k in p) { if (k === '_ik') { o._ik = (o._ik || []).concat(p._ik); continue; } if (o[k] && typeof p[k] !== 'number') o[k] = o[k].map((v, i) => v + (p[k][i] || 0)); else if (typeof p[k] === 'number' && o[k] != null) o[k] += p[k]; else o[k] = p[k]; } return o; };

// analytic two-bone IK in the sagittal (y,z) plane. target relative to hip pivot.
function legIK(rig, i, z, y, flat = true, toe = 0) {
  const {thigh: L1, shin: L2} = rig.o;
  let d = Math.hypot(z, y);
  d = Math.min(Math.max(d, 1e-4), (L1 + L2) * 0.999);
  const phi = Math.atan2(z, -y); // forward-from-down angle
  const c1 = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const beta = Math.acos(Math.min(1, Math.max(-1, c1)));
  const ci = (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2);
  const inner = Math.acos(Math.min(1, Math.max(-1, ci)));
  const bend = Math.PI - inner;
  const alpha = phi + beta;
  const P = {};
  P['l' + i + 't'] = [-alpha, 0, 0];
  P['l' + i + 's'] = [bend, 0, 0];
  P['l' + i + 'f'] = [flat ? alpha - bend + toe : toe, 0, 0];
  return P;
}
// walk legs; p in [0,1)
function walkLegs(rig, p, stride, lift, drop) {
  const o = rig.o;
  const yb = -(o.thigh + o.shin) + drop;
  let P = {'body.y': -drop};
  for (const i of [0, 1]) {
    const q = (p + i * 0.5) % 1;
    let z, y = yb, toe = 0;
    if (q < 0.5) { z = stride * (1 - 4 * q); } // stance: +S -> -S
    else { const s = (q - 0.5) / 0.5; z = stride * (-1 + 2 * ss(s)); y = yb + lift * Math.sin(Math.PI * s); toe = -0.35 * Math.sin(Math.PI * s); }
    P = merge(P, legIK(rig, i, z, y, true, toe));
  }
  return P;
}
function standLegs(rig, drop, spread = 0.0) {
  const o = rig.o; const yb = -(o.thigh + o.shin) + drop;
  return merge({'body.y': -drop}, legIK(rig, 0, spread, yb), legIK(rig, 1, -spread, yb));
}

// ---------- shared dressing ----------
function eyes(head, r, y, z, x, m, s = 1) {
  M(head, sph(r * s, 10, 8), m, [x, y, z]); M(head, sph(r * s, 10, 8), m, [-x, y, z]);
}
function foot(pivot, w, h, l, m, back = 0.04) { M(pivot, box(w, h, l, h * 0.45), m, [0, -h / 2 + 0.01, l / 2 - back]); }

// =====================================================================
// HEROES
// =====================================================================
function buildWarmage() {
  const o = {thigh: 0.42, shin: 0.41, foot: 0.07, hipW: 0.1, torsoH: 0.52, shW: 0.215, upper: 0.29, fore: 0.27};
  const rig = humanoid(o); const J = rig.J;
  const skin = mat(0xf2c39b), coat = mat(0xa3242f), coatD = mat(0x6e1620), gold = mat(0xe8b43c), leath = mat(0x6b4128), leathD = mat(0x3e2617),
    pants = mat(0x3b3446), steel = mat(0xb9c2cc), steelD = mat(0x6f7884), hair = mat(0x5a3218), wood = mat(0x8a5a2e), white = mat(0xf4efe6), eye = mat(0x1d1a26);
  // pelvis + belt
  M(J.hips, cyl(0.165, 0.17, 0.16), pants, [0, -0.02, 0]);
  M(J.hips, tor(0.172, 0.028, Math.PI * 2, 8, 30), leath, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
  M(J.hips, box(0.07, 0.06, 0.03), gold, [0, 0.05, 0.175]);
  M(J.hips, box(0.07, 0.08, 0.06), leathD, [0.14, -0.02, 0.07], [0, 0.6, 0]); // pouch
  // coat tails (open front)
  M(J.hips, cyl(0.19, 0.27, 0.42, 20, true, 0.55, Math.PI * 2 - 1.1), coat, [0, -0.2, -0.01]);
  M(J.hips, cyl(0.272, 0.272, 0.035, 20, true, 0.55, Math.PI * 2 - 1.1), gold, [0, -0.41, -0.01]);
  // torso
  M(J.spine, cyl(0.2, 0.165, 0.56, 20), coat, [0, 0.27, 0], [0, 0, 0], [1, 1, 0.82]);
  M(J.spine, box(0.08, 0.44, 0.03), coatD, [0, 0.27, 0.15]); // placket
  for (let i = 0; i < 4; i++) M(J.spine, sph(0.018, 8, 6), gold, [0.035, 0.12 + i * 0.1, 0.165]);
  M(J.spine, box(0.05, 0.62, 0.02), leath, [0, 0.28, 0.16], [0, 0, 0.62]); // bandolier
  for (let i = 0; i < 3; i++) M(J.spine, box(0.03, 0.06, 0.04), gold, [-0.08 + i * 0.07, 0.2 + i * 0.1, 0.175], [0, 0, 0.62]);
  M(J.chest, tor(0.115, 0.04, Math.PI * 2, 8, 20), gold, [0, 0.25, 0.0], [Math.PI / 2, 0, 0]); // collar
  M(J.chest, cyl(0.14, 0.17, 0.08, 18, true), coatD, [0, 0.22, -0.02]); // high collar back
  // pauldron (left)
  const pd = G(J.a0u, [0.03, 0.02, 0]);
  M(pd, hemi(0.12), steel, [0, 0, 0], [0, 0, -0.35], [1, 0.8, 1.05]);
  M(pd, tor(0.115, 0.016, Math.PI * 2, 6, 20), gold, [0.0, 0, 0], [Math.PI / 2, 0, -0.35]);
  M(pd, cone(0.03, 0.09, 8), steelD, [0.07, 0.07, 0], [0, 0, -0.9]);
  // arms
  for (const i of [0, 1]) {
    limb(J['a' + i + 'u'], o.upper, 0.065, 0.055, coat);
    limb(J['a' + i + 'f'], o.fore, 0.055, 0.045, leath);
    M(J['a' + i + 'f'], cyl(0.064, 0.058, 0.1, 12), leathD, [0, -o.fore + 0.07, 0]); // bracer cuff
    M(J['a' + i + 'h'], sph(0.05, 12, 10), leathD, [0, -0.035, 0.0], [0, 0, 0], [1, 1.1, 0.8]);
    // legs
    limb(J['l' + i + 't'], o.thigh, 0.085, 0.065, pants);
    limb(J['l' + i + 's'], o.shin, 0.068, 0.055, leathD);
    M(J['l' + i + 's'], cyl(0.085, 0.07, 0.12, 14), leath, [0, -0.04, 0.0]); // boot cuff
    foot(J['l' + i + 'f'], 0.11, 0.08, 0.22, leathD);
  }
  // head
  M(J.neck, cyl(0.055, 0.06, 0.08), skin, [0, 0.02, 0]);
  const hd = G(J.head, [0, 0.12, 0.01]);
  M(hd, sph(0.13, 22, 16), skin, [0, 0, 0], [0, 0, 0], [0.95, 1.05, 1]);
  M(hd, box(0.12, 0.08, 0.1, 0.035), skin, [0, -0.085, 0.035]); // jaw
  eyes(hd, 0.022, 0.0, 0.118, 0.048, eye);
  eyes(hd, 0.009, 0.006, 0.137, 0.042, white);
  M(hd, box(0.05, 0.014, 0.02), hair, [0.05, 0.04, 0.12], [0, 0, -0.2]); M(hd, box(0.05, 0.014, 0.02), hair, [-0.05, 0.04, 0.12], [0, 0, 0.2]);
  M(hd, cone(0.02, 0.05, 6), skin, [0, -0.02, 0.135], [Math.PI / 2.3, 0, 0]); // nose
  M(hd, sph(0.03, 8, 6), skin, [0.128, -0.005, 0], [0, 0, 0], [0.5, 1, 0.8]); M(hd, sph(0.03, 8, 6), skin, [-0.128, -0.005, 0], [0, 0, 0], [0.5, 1, 0.8]);
  M(hd, sph(0.138, 22, 16, 0), hair, [0, 0.03, -0.02], [0, 0, 0], [1, 0.9, 1]); // hair cap (back)
  const spikes = [[0, 0.15, 0.04, -0.6, 0], [0.07, 0.13, 0.03, -0.4, -0.5], [-0.07, 0.13, 0.03, -0.4, 0.5], [0.04, 0.12, -0.08, 0.5, -0.3], [-0.04, 0.12, -0.08, 0.5, 0.3], [0, 0.1, -0.12, 0.9, 0], [0.1, 0.07, -0.05, 0.3, -1.0], [-0.1, 0.07, -0.05, 0.3, 1.0]];
  for (const [x, y, z, rx, rz] of spikes) M(hd, cone(0.045, 0.14, 7), hair, [x, y, z], [rx, 0, rz]);
  M(hd, box(0.2, 0.05, 0.08, 0.02), hair, [0, 0.08, 0.09], [0.35, 0, 0]); // fringe
  // crossbow mounted to the chest, arms reach to it
  const W = G(J.chest, [-0.06, 0.09, 0.24]); rig.wpn = W;
  M(W, box(0.06, 0.07, 0.58, 0.02), wood, [0, 0, 0.02]);
  M(W, box(0.07, 0.11, 0.14, 0.02), wood, [0, -0.04, -0.22]); // butt
  M(W, box(0.035, 0.11, 0.05, 0.015), leathD, [0, -0.09, -0.04]); // grip
  M(W, box(0.075, 0.03, 0.4, 0.01), steelD, [0, 0.045, 0.06]); // rail
  M(W, tor(0.34, 0.022, Math.PI * 0.42, 6, 18), steel, [0, 0.03, -0.02], [Math.PI / 2, 0, Math.PI * 0.29]); // limbs
  M(W, box(0.44, 0.008, 0.008), white, [0, 0.035, 0.2]); // string
  M(W, cyl(0.012, 0.012, 0.42, 6), wood, [0, 0.07, 0.14], [Math.PI / 2, 0, 0]); // bolt
  M(W, cone(0.025, 0.07, 6), steel, [0, 0.07, 0.38], [Math.PI / 2, 0, 0]);
  M(W, box(0.09, 0.05, 0.06, 0.015), gold, [0, 0.0, 0.31]);
  M(W, cone(0.03, 0.06, 4), gold, [0, 0.0, -0.31], [-Math.PI / 2, 0, 0]);
  rig.height = 1.85; rig.kind = 'warmage';
  return rig;
}
function poseWarmage(rig, anim, t) {
  const hR = [1, [-0.06, -0.02, 0.19], [-0.6, -1, -0.3]], hL = [0, [-0.04, 0.04, 0.41], [0.8, -1, 0]];
  const aim = {_ik: [hR, hL], spine: [0.05, 0.0, 0], head: [-0.03, 0, 0]};
  const aimR = {_ik: [hR]};
  if (anim === 'idle') return merge(standLegs(rig, 0.05, 0.05), aim, {chest: [0, 0, 0]});
  if (anim === 'walk') {
    const p = t, w = 2 * Math.PI * p;
    return merge(walkLegs(rig, p, 0.2, 0.13, 0.06), aim, {spine: [0.06, 0.07 * Math.cos(w), 0], head: [0, -0.07 * Math.cos(w), 0]});
  }
  if (anim === 'cast') { // shoulder-bash blast: left palm thrust while crossbow swings to side
    const base = merge(standLegs(rig, 0.07, 0.1));
    const P = kf(t, [
      [0, merge(aim, {})],
      [0.3, {_ik: [hR], a0u: [-0.4, 0.2, 0.6], a0f: [-1.9, 0, 0], spine: [-0.08, 0.45, 0], head: [0, -0.35, 0], chest: [0, 0.1, 0]}],
      [0.55, {_ik: [hR], a0u: [-1.55, 0, 0.05], a0f: [-0.05, 0, 0], a0h: [-0.6, 0, 0], spine: [0.22, -0.35, 0], head: [-0.1, 0.3, 0], chest: [0, -0.1, 0]}],
      [1, merge(aim, {})]]);
    return merge(base, P);
  }
  if (anim === 'die') return dieFall(rig, t, aim);
  return {};
}

function buildSorceress() {
  const o = {thigh: 0.4, shin: 0.39, foot: 0.06, hipW: 0.085, torsoH: 0.48, shW: 0.18, upper: 0.28, fore: 0.27};
  const rig = humanoid(o); const J = rig.J;
  const skin = mat(0xf4cfb2), robe = mat(0x5d2c8f), robeD = mat(0x3c1a62), teal = mat(0x23a7a0), gold = mat(0xf0c34a), hair = mat(0xe9eef5), hairS = mat(0xb9c3d6),
    boot = mat(0x2e2140), wood = mat(0x4a2e1c), eye = mat(0x2a1a4a), white = mat(0xffffff), lip = mat(0xc76a7a);
  const cry = glow(0x46e6ff);
  // skirt (split front)
  M(J.hips, cyl(0.17, 0.36, 0.72, 24, true, 0.42, Math.PI * 2 - 0.84), robe, [0, -0.34, -0.02]);
  M(J.hips, cyl(0.362, 0.362, 0.05, 24, true, 0.42, Math.PI * 2 - 0.84), teal, [0, -0.69, -0.02]);
  M(J.hips, cyl(0.172, 0.18, 0.1, 20), robeD, [0, 0.0, 0]);
  M(J.hips, tor(0.18, 0.025, Math.PI * 2, 8, 30), gold, [0, 0.04, 0], [Math.PI / 2, 0, 0]);
  M(J.hips, oct(0.04), cry, [0, 0.04, 0.19]);
  M(J.hips, box(0.06, 0.34, 0.02), teal, [0, -0.17, 0.19], [0.18, 0, 0]); // sash
  // bodice
  M(J.spine, cyl(0.17, 0.13, 0.5, 20), robe, [0, 0.26, 0], [0, 0, 0], [1, 1, 0.8]);
  M(J.spine, box(0.14, 0.2, 0.03, 0.01), teal, [0, 0.32, 0.12], [0.1, 0, 0]);
  M(J.spine, oct(0.035), cry, [0, 0.36, 0.14]);
  // high flared collar
  M(J.chest, lathe([[0.09, 0], [0.13, 0.06], [0.2, 0.2], [0.25, 0.34]], 20, Math.PI * 0.62, Math.PI * 0.76), robeD, [0, 0.2, 0]);
  M(J.chest, lathe([[0.25, 0.34], [0.26, 0.36]], 20, Math.PI * 0.62, Math.PI * 0.76), gold, [0, 0.2, 0]);
  // shoulders
  for (const i of [0, 1]) {
    const s = i ? -1 : 1;
    M(J['a' + i + 'u'], sph(0.085, 14, 10), robeD, [0.01 * s, -0.02, 0], [0, 0, 0], [1, 0.9, 1]);
    limb(J['a' + i + 'u'], o.upper, 0.05, 0.045, robe);
    limb(J['a' + i + 'f'], o.fore, 0.045, 0.035, boot);
    M(J['a' + i + 'f'], cyl(0.06, 0.09, 0.12, 12, true), robe, [0, -o.fore + 0.12, 0]); // bell sleeve
    M(J['a' + i + 'h'], sph(0.04, 12, 10), skin, [0, -0.03, 0], [0, 0, 0], [0.9, 1.2, 0.7]);
    limb(J['l' + i + 't'], o.thigh, 0.07, 0.055, robeD);
    limb(J['l' + i + 's'], o.shin, 0.055, 0.045, boot);
    foot(J['l' + i + 'f'], 0.085, 0.07, 0.19, boot);
  }
  M(J.a0h, sph(0.07, 12, 10), cry, [0, -0.06, 0.03], [0, 0, 0], [1, 1, 1]); // spell glow hand
  rig.fxHand = J.a0h;
  // head
  M(J.neck, cyl(0.045, 0.05, 0.08), skin, [0, 0.02, 0]);
  const hd = G(J.head, [0, 0.115, 0.01]);
  M(hd, sph(0.12, 22, 16), skin, [0, 0, 0], [0, 0, 0], [0.92, 1.04, 0.98]);
  M(hd, box(0.1, 0.07, 0.09, 0.034), skin, [0, -0.08, 0.03]);
  eyes(hd, 0.024, 0.0, 0.108, 0.045, eye, 1);
  eyes(hd, 0.01, 0.008, 0.128, 0.04, white);
  M(hd, box(0.035, 0.012, 0.01), lip, [0, -0.07, 0.115]);
  // hair: cap + long fall + ponytail
  M(hd, sph(0.13, 22, 16), hair, [0, 0.025, -0.02], [0, 0, 0], [1.02, 0.95, 1.02]);
  M(hd, box(0.2, 0.06, 0.07, 0.025), hair, [0, 0.07, 0.085], [0.5, 0, 0]);
  M(hd, box(0.22, 0.34, 0.08, 0.04), hair, [0, -0.13, -0.08], [0.15, 0, 0]);
  M(hd, box(0.05, 0.22, 0.05, 0.02), hairS, [0.11, -0.1, 0.04]); M(hd, box(0.05, 0.22, 0.05, 0.02), hairS, [-0.11, -0.1, 0.04]);
  // circlet
  M(hd, tor(0.128, 0.012, Math.PI * 2, 6, 28), gold, [0, 0.05, 0], [Math.PI / 2 - 0.2, 0, 0]);
  M(hd, oct(0.03), cry, [0, 0.085, 0.125]);
  // staff in right hand
  const S = G(J.a1h, [0, -0.04, 0.02], [Math.PI / 2, 0, 0]); rig.wpn = S;
  M(S, cyl(0.022, 0.026, 1.5, 8), wood, [0, 0.35, 0]);
  M(S, tor(0.03, 0.01, Math.PI * 2, 6, 12), gold, [0, 0.0, 0], [Math.PI / 2, 0, 0]);
  const top = G(S, [0, 1.1, 0]);
  for (let i = 0; i < 4; i++) M(top, cone(0.025, 0.18, 6), gold, [Math.cos(i * Math.PI / 2) * 0.05, 0.08, Math.sin(i * Math.PI / 2) * 0.05], [Math.sin(i * Math.PI / 2) * 0.4, 0, -Math.cos(i * Math.PI / 2) * 0.4]);
  M(top, oct(0.085), cry, [0, 0.12, 0], [0, 0.4, 0], [1, 1.5, 1]);
  M(top, sph(0.05), gold, [0, 0, 0]);
  rig.height = 1.75; rig.kind = 'sorc';
  return rig;
}
function poseSorc(rig, anim, t) {
  const hold = {a1u: [-0.45, 0, -0.12], a1f: [-0.9, 0, 0], a1h: [0.0, 0, 0], a0u: [-0.55, 0, 0.25], a0f: [-0.9, 0.3, 0], head: [-0.02, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.04, 0.04), hold);
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.17, 0.11, 0.05), hold, {spine: [0.04, 0.06 * Math.cos(w), 0], a0u: [0.12 * Math.cos(w), 0, 0]}); }
  if (anim === 'cast') {
    return merge(standLegs(rig, 0.06, 0.12), kf(t, [
      [0, hold],
      [0.35, {a1u: [-0.7, 0, -0.2], a1f: [-1.1, 0, 0], a0u: [-0.3, 0.3, 0.9], a0f: [-1.4, 0, 0], spine: [-0.12, 0.3, 0], head: [0.05, -0.2, 0]}],
      [0.6, {a1u: [-1.2, 0, -0.1], a1f: [-0.3, 0, 0], a0u: [-1.6, -0.2, 0.0], a0f: [-0.1, 0, 0], a0h: [-0.8, 0, 0], spine: [0.15, -0.25, 0], head: [-0.05, 0.2, 0]}],
      [1, hold]]));
  }
  if (anim === 'die') return dieFall(rig, t, hold);
  return {};
}

function dieFall(rig, t, hold = {}) {
  const k = ss(Math.min(1, t * 1.25));
  return merge(lerpPose(merge(standLegs(rig, 0.04)), merge(standLegs(rig, 0.3, 0.12), {a0u: [-2.4, 0, 0.5], a1u: [-2.4, 0, -0.5], a0f: [-0.4, 0, 0], a1f: [-0.4, 0, 0], head: [-0.4, 0, 0]}), k),
    lerpPose(hold, {}, k), {body: [-1.45 * k, 0, 0], 'body.z': -0.25 * k, 'body.y': -0.05 * k});
}

// =====================================================================
// ORCS
// =====================================================================
function orcHead(J, o, skin, tuskC, eyeC, extra = {}) {
  const hd = G(J.head, [0, o.headR * 0.8, 0.04]);
  M(hd, sph(o.headR, 22, 16), skin, [0, 0.01, -0.01], [0, 0, 0], [1.05, 0.95, 1]);
  M(hd, box(o.headR * 1.75, o.headR * 0.95, o.headR * 1.25, 0.05), skin, [0, -o.headR * 0.55, o.headR * 0.35]); // jaw
  M(hd, box(o.headR * 1.6, o.headR * 0.32, o.headR * 0.5, 0.04), skin, [0, o.headR * 0.32, o.headR * 0.62], [0.25, 0, 0]); // brow
  eyes(hd, o.headR * 0.13, o.headR * 0.12, o.headR * 0.88, o.headR * 0.38, glow(eyeC));
  M(hd, sph(o.headR * 0.22, 10, 8), skin, [0, -o.headR * 0.08, o.headR * 0.98], [0, 0, 0], [1.3, 0.8, 0.9]); // snout
  for (const s of [1, -1]) {
    M(hd, cone(o.headR * 0.13, o.headR * 0.55, 8), tuskC, [s * o.headR * 0.45, -o.headR * 0.42, o.headR * 0.95], [-0.2, 0, s * -0.25]);
    M(hd, cone(o.headR * 0.22, o.headR * 0.85, 8), skin, [s * o.headR * 1.08, o.headR * 0.05, -0.0], [0.2, 0, s * -1.2]); // ear
  }
  return hd;
}
function buildGrunt() {
  const o = {thigh: 0.36, shin: 0.34, foot: 0.08, hipW: 0.13, torsoH: 0.56, shW: 0.31, upper: 0.32, fore: 0.3, headR: 0.15, neckZ: 0.08};
  const rig = humanoid(o); const J = rig.J;
  const skin = mat(0x6f9a3e), skinD = mat(0x4f7a2c), leath = mat(0x6b4426), leathD = mat(0x452a17), iron = mat(0x8d949c), ironD = mat(0x555c66), bone = mat(0xece2c4),
    cloth = mat(0x8a3324), wood = mat(0x7a5230), hairC = mat(0x1f1a1a);
  rig.J.spine.rotation.x = 0.28; rig.rest.spine.r.x = 0.28; rig.J.neck.rotation.x = -0.35; rig.rest.neck.r.x = -0.35;
  M(J.hips, cyl(0.2, 0.2, 0.18, 18), leath, [0, -0.02, 0]);
  M(J.hips, box(0.2, 0.32, 0.04, 0.02), cloth, [0, -0.2, 0.17], [0.1, 0, 0]); // loincloth
  M(J.hips, box(0.22, 0.28, 0.04, 0.02), cloth, [0, -0.18, -0.17], [-0.1, 0, 0]);
  M(J.hips, tor(0.205, 0.035, Math.PI * 2, 8, 26), leathD, [0, 0.06, 0], [Math.PI / 2, 0, 0]);
  M(J.hips, sph(0.055, 10, 8), bone, [0, 0.06, 0.21], [0, 0, 0], [1, 1, 0.6]); // skull buckle
  // torso: big chest
  M(J.spine, sph(0.29, 22, 16), skin, [0, 0.36, 0.02], [0, 0, 0], [1.08, 0.95, 0.85]);
  M(J.spine, cyl(0.24, 0.2, 0.3, 18), skin, [0, 0.12, 0], [0, 0, 0], [1, 1, 0.85]);
  M(J.spine, box(0.06, 0.62, 0.03), leathD, [0, 0.33, 0.24], [0.15, 0, 0.6]); // harness strap
  M(J.spine, box(0.06, 0.62, 0.03), leathD, [0, 0.33, -0.24], [-0.15, 0, 0.6]);
  M(J.spine, cyl(0.06, 0.06, 0.03, 10), iron, [0, 0.36, 0.26], [Math.PI / 2 - 0.15, 0, 0]);
  // right shoulder spiked pad
  const sp = G(J.a1u, [-0.04, 0.03, 0]);
  M(sp, hemi(0.15), iron, [0, 0, 0], [0, 0, 0.45], [1, 0.75, 1.1]);
  for (let i = 0; i < 3; i++) M(sp, cone(0.03, 0.12, 6), ironD, [-0.05 - i * 0.02, 0.07, -0.08 + i * 0.08], [0, 0, 0.8]);
  // arms & legs
  for (const i of [0, 1]) {
    limb(J['a' + i + 'u'], o.upper, 0.095, 0.08, skin);
    limb(J['a' + i + 'f'], o.fore, 0.085, 0.07, skin);
    M(J['a' + i + 'f'], cyl(0.09, 0.085, 0.14, 12), leath, [0, -o.fore + 0.09, 0]);
    M(J['a' + i + 'h'], sph(0.08, 12, 10), skinD, [0, -0.05, 0], [0, 0, 0], [1, 1, 0.85]);
    limb(J['l' + i + 't'], o.thigh, 0.11, 0.09, leath);
    limb(J['l' + i + 's'], o.shin, 0.085, 0.07, skinD);
    M(J['l' + i + 's'], cyl(0.095, 0.09, 0.16, 12), leathD, [0, -o.shin + 0.1, 0]);
    foot(J['l' + i + 'f'], 0.14, 0.09, 0.24, leathD);
  }
  // head
  const hd = orcHead(J, o, skin, bone, 0xff3b1f);
  M(hd, cone(0.05, 0.16, 8), hairC, [0, o.headR * 1.0, -0.04], [-0.4, 0, 0]); // topknot
  M(hd, sph(0.04, 8, 6), leath, [0, o.headR * 0.85, -0.03]);
  // left: round shield
  const sh = G(J.a0f, [0.07, -0.16, 0.02], [0, 0, Math.PI / 2]);
  M(sh, cyl(0.24, 0.24, 0.05, 20), wood, [0, 0, 0]);
  M(sh, tor(0.24, 0.025, Math.PI * 2, 6, 24), ironD, [0, 0, 0], [Math.PI / 2, 0, 0]);
  M(sh, sph(0.07, 12, 8), iron, [0, 0.03, 0], [0, 0, 0], [1, 0.6, 1]);
  for (const a of [0, 1.57, 3.14, 4.71]) M(sh, sph(0.02, 6, 4), iron, [Math.cos(a) * 0.17, 0.03, Math.sin(a) * 0.17]);
  // right: axe
  const ax = G(J.a1h, [0, -0.06, 0], [Math.PI / 2, 0, 0]); rig.wpn = ax;
  M(ax, cyl(0.024, 0.028, 0.75, 8), wood, [0, 0.15, 0]);
  M(ax, cyl(0.17, 0.17, 0.025, 18, false, Math.PI * 0.15, Math.PI * 0.7), iron, [0, 0.42, 0.04], [0, 0, Math.PI / 2], [1, 1, 1]);
  M(ax, box(0.06, 0.12, 0.06, 0.015), ironD, [0, 0.44, 0.0]);
  rig.height = 1.75; rig.kind = 'grunt';
  return rig;
}
function orcWalk(rig, t, stride, lift, drop, extra = {}) {
  const w = 2 * Math.PI * t;
  return merge(walkLegs(rig, t, stride, lift, drop), {a0u: [0.45 * Math.cos(w), 0, 0.12], a1u: [-0.45 * Math.cos(w) - 0.2, 0, -0.1], a0f: [-0.45, 0, 0], a1f: [-0.6, 0, 0], spine: [0, 0.1 * Math.cos(w), 0.05 * Math.sin(w)]}, extra);
}
function poseGrunt(rig, anim, t) {
  const rest = {a0u: [-0.2, 0, 0.12], a0f: [-0.6, 0, 0], a1u: [-0.25, 0, -0.25], a1f: [-1.35, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.06, 0.06), rest);
  if (anim === 'walk') return orcWalk(rig, t, 0.2, 0.12, 0.07, {a1f: [-0.7, 0, 0], a1u: [0, 0, -0.15]});
  if (anim === 'attack') return merge(standLegs(rig, 0.08, 0.1), kf(t, [
    [0, rest],
    [0.4, {a1u: [-2.9, 0.2, -0.35], a1f: [-0.9, 0, 0], a0u: [-0.6, 0, 0.3], a0f: [-0.9, 0, 0], spine: [-0.25, -0.25, 0], head: [0.15, 0.1, 0]}],
    [0.6, {a1u: [-0.75, -0.1, 0.05], a1f: [-0.15, 0, 0], a0u: [0.2, 0, 0.3], a0f: [-0.5, 0, 0], spine: [0.35, 0.3, 0], head: [-0.2, -0.1, 0]}],
    [1, rest]]));
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}

function buildKobold() {
  const o = {thigh: 0.22, shin: 0.22, foot: 0.05, hipW: 0.075, torsoH: 0.3, shW: 0.13, upper: 0.17, fore: 0.16, headR: 0.15, neckZ: 0.03};
  const rig = humanoid(o); const J = rig.J;
  const skin = mat(0xd48a2e), skinD = mat(0xa8641c), cloth = mat(0x5b6b2a), clothD = mat(0x3e4a1a), sack = mat(0xb39566), rope = mat(0x6d5432), steel = mat(0xc3cad4), eyeC = 0xffe14a;
  J.spine.rotation.x = 0.4; rig.rest.spine.r.x = 0.4; J.neck.rotation.x = -0.4; rig.rest.neck.r.x = -0.4;
  M(J.hips, cyl(0.1, 0.11, 0.12, 14), clothD, [0, 0, 0]);
  M(J.spine, cyl(0.12, 0.1, 0.32, 14), cloth, [0, 0.15, 0], [0, 0, 0], [1, 1, 0.85]);
  M(J.spine, box(0.03, 0.36, 0.02), rope, [0, 0.16, 0.1], [0.1, 0, 0.6]);
  // big sack on back
  M(J.chest, sph(0.17, 16, 12), sack, [0, 0.02, -0.2], [0, 0, 0], [1, 1.15, 0.9]);
  M(J.chest, cyl(0.04, 0.07, 0.08, 10), rope, [0, 0.2, -0.2]);
  M(J.chest, sph(0.03, 8, 6), mat(0xf2d34a), [0.05, 0.25, -0.2]); // coin peeking
  for (const i of [0, 1]) {
    limb(J['a' + i + 'u'], o.upper, 0.04, 0.035, skin);
    limb(J['a' + i + 'f'], o.fore, 0.035, 0.03, skin);
    M(J['a' + i + 'h'], sph(0.04, 10, 8), skinD, [0, -0.025, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.05, 0.04, clothD);
    limb(J['l' + i + 's'], o.shin, 0.04, 0.032, skin);
    foot(J['l' + i + 'f'], 0.07, 0.05, 0.14, skinD);
  }
  const hd = G(J.head, [0, 0.12, 0.03]);
  M(hd, sph(0.14, 20, 14), skin, [0, 0, 0], [0, 0, 0], [1, 0.9, 1]);
  M(hd, cone(0.06, 0.16, 10), skin, [0, -0.03, 0.17], [Math.PI / 2, 0, 0]); // pointy nose
  eyes(hd, 0.03, 0.03, 0.115, 0.06, glow(eyeC));
  eyes(hd, 0.012, 0.03, 0.142, 0.06, mat(0x221100));
  for (const s of [1, -1]) M(hd, cone(0.07, 0.3, 4), skin, [s * 0.17, 0.05, -0.02], [0.2, 0, s * -1.25], [1, 1, 0.35]); // big ears
  M(hd, box(0.12, 0.03, 0.04, 0.01), mat(0xfff4dc), [0, -0.075, 0.115]); // teeth
  M(hd, cone(0.08, 0.12, 8), clothD, [0, 0.13, -0.02], [-0.3, 0, 0]); // floppy hat
  // dagger
  const d = G(J.a1h, [0, -0.04, 0], [Math.PI / 2, 0, 0]); rig.wpn = d;
  M(d, box(0.025, 0.08, 0.025, 0.008), rope, [0, 0.0, 0]);
  M(d, box(0.06, 0.016, 0.02, 0.006), steel, [0, 0.05, 0]);
  M(d, cone(0.03, 0.2, 4), steel, [0, 0.15, 0], [0, 0, 0], [1, 1, 0.3]);
  rig.height = 1.05; rig.kind = 'kobold';
  return rig;
}
function poseKobold(rig, anim, t) {
  if (anim === 'idle') return merge(standLegs(rig, 0.04, 0.04), {a0u: [-0.3, 0, 0.3], a1u: [-0.4, 0, -0.3], a0f: [-1, 0, 0], a1f: [-1, 0, 0]});
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.15, 0.1, 0.05), {a0u: [0.9 * Math.cos(w), 0, 0.25], a1u: [-0.9 * Math.cos(w), 0, -0.25], a0f: [-1.2, 0, 0], a1f: [-1.2, 0, 0], spine: [0.1, 0.15 * Math.cos(w), 0]}); }
  if (anim === 'attack') return merge(standLegs(rig, 0.05, 0.08), kf(t, [[0, {a1u: [-0.4, 0, -0.3], a1f: [-1, 0, 0]}], [0.35, {a1u: [-0.1, 0.3, -0.5], a1f: [-1.8, 0, 0], spine: [-0.1, 0.3, 0]}], [0.55, {a1u: [-1.5, -0.1, 0], a1f: [0, 0, 0], spine: [0.3, -0.2, 0]}], [1, {a1u: [-0.4, 0, -0.3], a1f: [-1, 0, 0]}]]));
  if (anim === 'die') return dieFall(rig, t);
  return {};
}

function buildArcher() {
  const o = {thigh: 0.4, shin: 0.38, foot: 0.07, hipW: 0.1, torsoH: 0.5, shW: 0.21, upper: 0.3, fore: 0.28, headR: 0.13, neckZ: 0.05};
  const rig = humanoid(o); const J = rig.J;
  const skin = mat(0x58804a), skinD = mat(0x41633a), hood = mat(0x4b3626), hoodD = mat(0x33241a), leath = mat(0x7d5a36), wood = mat(0x6e4524), fl = mat(0xd9483b), str = mat(0xeae0c8), iron = mat(0x9aa2ab);
  J.spine.rotation.x = 0.15; rig.rest.spine.r.x = 0.15;
  M(J.hips, cyl(0.15, 0.16, 0.14, 16), leath, [0, 0, 0]);
  M(J.hips, cyl(0.16, 0.24, 0.32, 18, true, 0.5, Math.PI * 2 - 1), hoodD, [0, -0.16, 0]);
  M(J.spine, cyl(0.17, 0.14, 0.5, 18), leath, [0, 0.25, 0], [0, 0, 0], [1, 1, 0.8]);
  M(J.spine, box(0.3, 0.06, 0.24, 0.02), hoodD, [0, 0.1, 0]);
  M(J.chest, cyl(0.2, 0.3, 0.3, 18, true), hood, [0, 0.1, -0.02]); // mantle
  // quiver on back
  const q = G(J.chest, [0.06, 0.0, -0.16], [0.2, 0, -0.35]);
  M(q, cyl(0.06, 0.05, 0.45, 12), leath, [0, 0, 0]);
  for (let i = 0; i < 4; i++) { M(q, cyl(0.008, 0.008, 0.2, 4), wood, [-0.03 + i * 0.02, 0.3, 0]); M(q, box(0.02, 0.06, 0.035), fl, [-0.03 + i * 0.02, 0.38, 0]); }
  for (const i of [0, 1]) {
    limb(J['a' + i + 'u'], o.upper, 0.065, 0.055, skin);
    limb(J['a' + i + 'f'], o.fore, 0.055, 0.045, skin);
    M(J['a' + i + 'f'], cyl(0.06, 0.055, 0.12, 12), leath, [0, -o.fore + 0.08, 0]);
    M(J['a' + i + 'h'], sph(0.05, 12, 10), skinD, [0, -0.035, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.08, 0.065, hoodD);
    limb(J['l' + i + 's'], o.shin, 0.065, 0.05, leath);
    foot(J['l' + i + 'f'], 0.1, 0.07, 0.2, hoodD);
  }
  const hd = orcHead(J, o, skin, mat(0xe8dcc0), 0xffb52e);
  M(hd, sph(0.16, 20, 14, 0), hood, [0, 0.04, -0.035], [0, 0, 0], [1.05, 1, 1.05]);
  M(hd, cone(0.1, 0.22, 12), hood, [0, 0.12, -0.13], [-1.0, 0, 0]);
  // bow in left hand
  const b = G(J.a0h, [0, -0.05, 0], [0, 0, 0]); rig.wpn = b;
  M(b, tor(0.42, 0.02, Math.PI * 0.75, 6, 20), wood, [0, 0, -0.16], [0, Math.PI / 2, Math.PI / 2 - Math.PI * 0.375]);
  M(b, cyl(0.03, 0.03, 0.1, 8), leath, [0, 0, 0.0], [Math.PI / 2, 0, 0]);
  rig.bowStr = M(b, box(0.006, 0.006, 0.78), str, [0, 0, -0.32]);
  rig.height = 1.75; rig.kind = 'archer';
  return rig;
}
function poseArcher(rig, anim, t) {
  const rest = {a0u: [-0.35, 0, 0.1], a0f: [-0.6, 0, 0], a1u: [-0.15, 0, -0.1], a1f: [-0.4, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.05, 0.04), rest);
  if (anim === 'walk') return orcWalk(rig, t, 0.2, 0.12, 0.06, {a0u: [-0.35, 0, 0], a0f: [-0.4, 0, 0]});
  if (anim === 'attack') {
    const draw = {a0u: [-1.55, 0.25, 0.1], a0f: [0, 0, 0], a0h: [0, 0, 0], a1u: [-1.4, -0.45, -0.3], a1f: [-2.2, 0, 0], spine: [0, 0.45, 0], head: [0, -0.35, 0]};
    const P = merge(standLegs(rig, 0.07, 0.14), kf(t, [[0, rest], [0.3, merge(draw, {a1f: [-1.2, 0, 0]})], [0.7, draw], [0.8, merge(draw, {a1u: [-1.2, -0.7, -0.6], a1f: [-0.6, 0, 0]})], [1, rest]]));
    return P;
  }
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}

function buildOgre() {
  const o = {thigh: 0.48, shin: 0.44, foot: 0.11, hipW: 0.2, torsoH: 0.85, shW: 0.47, upper: 0.5, fore: 0.48, headR: 0.17, neckZ: 0.18};
  const rig = humanoid(o); const J = rig.J;
  const skin = mat(0xa08ab4), skinD = mat(0x7a6690), cloth = mat(0x6b5333), leathD = mat(0x3e2c1c), iron = mat(0x7f8790), wood = mat(0x6f4a2b), woodD = mat(0x4d321c), bone = mat(0xf1e7cc);
  J.spine.rotation.x = 0.32; rig.rest.spine.r.x = 0.32; J.neck.rotation.x = -0.55; rig.rest.neck.r.x = -0.55;
  M(J.hips, cyl(0.32, 0.3, 0.24, 20), cloth, [0, -0.04, 0]);
  M(J.hips, box(0.3, 0.42, 0.05, 0.02), cloth, [0, -0.28, 0.27], [0.12, 0, 0]);
  M(J.hips, tor(0.33, 0.05, Math.PI * 2, 8, 30), leathD, [0, 0.06, 0], [Math.PI / 2, 0, 0]);
  // body: barrel chest + belly
  M(J.spine, sph(0.44, 24, 18), skin, [0, 0.58, 0.02], [0, 0, 0], [1.1, 0.95, 0.9]);
  M(J.spine, sph(0.36, 22, 16), skin, [0, 0.22, 0.1], [0, 0, 0], [1.05, 0.95, 1.0]);
  M(J.spine, sph(0.025, 8, 6), skinD, [0, 0.2, 0.46]); // navel
  M(J.chest, tor(0.2, 0.06, Math.PI * 2, 8, 22), iron, [0, 0.33, 0.06], [Math.PI / 2 - 0.4, 0, 0]); // collar
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; M(J.chest, cone(0.04, 0.12, 6), iron, [Math.cos(a) * 0.2, 0.33 + Math.sin(a) * 0.02, 0.06 + Math.sin(a) * 0.18], [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2]); }
  for (const i of [0, 1]) {
    limb(J['a' + i + 'u'], o.upper, 0.15, 0.13, skin);
    limb(J['a' + i + 'f'], o.fore, 0.14, 0.12, skin);
    M(J['a' + i + 'f'], cyl(0.15, 0.14, 0.18, 12), leathD, [0, -o.fore + 0.12, 0]);
    M(J['a' + i + 'h'], sph(0.13, 14, 10), skinD, [0, -0.08, 0], [0, 0, 0], [1, 1, 0.8]);
    limb(J['l' + i + 't'], o.thigh, 0.17, 0.14, skin);
    limb(J['l' + i + 's'], o.shin, 0.14, 0.12, skinD);
    foot(J['l' + i + 'f'], 0.22, 0.12, 0.34, skinD);
  }
  const hd = G(J.head, [0, 0.12, 0.08]);
  M(hd, sph(o.headR, 20, 14), skin, [0, 0, 0], [0, 0, 0], [1.05, 0.95, 1]);
  M(hd, box(0.3, 0.16, 0.22, 0.06), skin, [0, -0.1, 0.06]); // underbite jaw
  M(hd, box(0.26, 0.05, 0.1, 0.02), skinD, [0, 0.07, 0.13], [0.3, 0, 0]);
  eyes(hd, 0.028, 0.02, 0.15, 0.06, glow(0xffd43a));
  for (const s of [1, -1]) M(hd, cone(0.03, 0.11, 8), bone, [s * 0.1, -0.02, 0.15], [-0.3, 0, s * -0.2]);
  M(hd, cone(0.045, 0.14, 8), bone, [0.06, 0.15, 0.0], [-0.3, 0, -0.3]); // single horn
  M(hd, sph(0.06, 10, 8), skin, [0.18, 0.0, -0.01], [0, 0, 0], [0.5, 1, 0.8]); M(hd, sph(0.06, 10, 8), skin, [-0.18, 0.0, -0.01], [0, 0, 0], [0.5, 1, 0.8]);
  // spiked club
  const c = G(J.a1h, [0, -0.1, 0], [Math.PI / 2, 0, 0]); rig.wpn = c;
  M(c, cyl(0.05, 0.06, 0.4, 10), woodD, [0, 0.0, 0]);
  M(c, cyl(0.15, 0.08, 0.7, 12), wood, [0, 0.55, 0]);
  for (let i = 0; i < 10; i++) { const a = i * 2.4, y = 0.4 + (i % 5) * 0.08; M(c, cone(0.025, 0.1, 5), iron, [Math.cos(a) * 0.13, y, Math.sin(a) * 0.13], [Math.sin(a) * Math.PI / 2, 0, -Math.cos(a) * Math.PI / 2]); }
  M(c, tor(0.13, 0.02, Math.PI * 2, 6, 18), iron, [0, 0.82, 0], [Math.PI / 2, 0, 0]);
  rig.height = 2.6; rig.kind = 'ogre';
  return rig;
}
function poseOgre(rig, anim, t) {
  const rest = {a0u: [-0.15, 0, 0.18], a0f: [-0.35, 0, 0], a1u: [-0.25, 0, -0.18], a1f: [-0.5, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.07, 0.07), rest);
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.24, 0.13, 0.09), {a0u: [0.35 * Math.cos(w), 0, 0.2], a1u: [-0.3 * Math.cos(w) - 0.2, 0, -0.15], a0f: [-0.35, 0, 0], a1f: [-0.6, 0, 0], spine: [0, 0.08 * Math.cos(w), 0.06 * Math.sin(w)], body: [0, 0, 0.04 * Math.cos(w)]}); }
  if (anim === 'attack') return merge(standLegs(rig, 0.1, 0.15), kf(t, [
    [0, rest],
    [0.45, {a1u: [-3.0, 0, -0.2], a1f: [-0.6, 0, 0], a0u: [-2.9, 0, 0.2], a0f: [-0.6, 0, 0], spine: [-0.35, 0, 0], head: [0.2, 0, 0]}],
    [0.62, {a1u: [-0.9, 0, 0.1], a1f: [-0.05, 0, 0], a0u: [-0.9, 0, -0.1], a0f: [-0.05, 0, 0], spine: [0.5, 0, 0], head: [-0.3, 0, 0], 'body.y': -0.08}],
    [1, rest]]));
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}

function buildWarchief() {
  const o = {thigh: 0.48, shin: 0.45, foot: 0.1, hipW: 0.17, torsoH: 0.72, shW: 0.42, upper: 0.42, fore: 0.4, headR: 0.19, neckZ: 0.1};
  const rig = humanoid(o); const J = rig.J;
  const skin = mat(0x52732f), skinD = mat(0x3c5a22), arm = mat(0x3a3d46), armL = mat(0x5f6573), gold = mat(0xd9a53a), red = mat(0xa31d1d), redD = mat(0x6e1010), bone = mat(0xefe4c8), leathD = mat(0x2e2016), steel = mat(0x9aa3ad);
  J.spine.rotation.x = 0.18; rig.rest.spine.r.x = 0.18; J.neck.rotation.x = -0.2; rig.rest.neck.r.x = -0.2;
  M(J.hips, cyl(0.27, 0.27, 0.22, 20), arm, [0, -0.03, 0]);
  for (let i = 0; i < 6; i++) { const a = -1.2 + i * 0.48; M(J.hips, box(0.14, 0.32, 0.04, 0.015), i % 2 ? armL : arm, [Math.sin(a) * 0.27, -0.24, Math.cos(a) * 0.27], [0.15, a, 0]); } // tasset plates
  M(J.hips, tor(0.28, 0.04, Math.PI * 2, 8, 28), gold, [0, 0.07, 0], [Math.PI / 2, 0, 0]);
  M(J.spine, sph(0.38, 22, 16), arm, [0, 0.46, 0.02], [0, 0, 0], [1.1, 0.95, 0.85]);
  M(J.spine, cyl(0.3, 0.25, 0.3, 18), arm, [0, 0.16, 0], [0, 0, 0], [1, 1, 0.85]);
  M(J.spine, box(0.22, 0.2, 0.05, 0.02), gold, [0, 0.48, 0.32], [-0.1, 0, 0]);
  M(J.spine, sph(0.07, 10, 8), bone, [0, 0.48, 0.36], [0, 0, 0], [1, 1, 0.6]);
  // cape
  M(J.chest, cyl(0.32, 0.55, 1.3, 20, true, Math.PI * 0.62, Math.PI * 0.76), red, [0, -0.38, -0.08]);
  M(J.chest, cyl(0.556, 0.556, 0.06, 20, true, Math.PI * 0.62, Math.PI * 0.76), redD, [0, -1.03, -0.08]);
  for (const i of [0, 1]) {
    const s = i ? -1 : 1;
    const pd = G(J['a' + i + 'u'], [s * 0.04, 0.04, 0]);
    M(pd, hemi(0.2), armL, [0, 0, 0], [0, 0, s * 0.5], [1, 0.85, 1.1]);
    M(pd, tor(0.195, 0.02, Math.PI * 2, 6, 22), gold, [0, 0, 0], [Math.PI / 2, 0, s * 0.5]);
    for (let k = 0; k < 2; k++) M(pd, cone(0.04, 0.2, 6), bone, [s * 0.08, 0.1, -0.06 + k * 0.12], [0, 0, s * -0.6]);
    limb(J['a' + i + 'u'], o.upper, 0.13, 0.11, skin);
    limb(J['a' + i + 'f'], o.fore, 0.12, 0.1, arm);
    M(J['a' + i + 'h'], sph(0.11, 12, 10), leathD, [0, -0.07, 0]);
    limb(J['l' + i + 't'], o.thigh, 0.14, 0.12, leathD);
    limb(J['l' + i + 's'], o.shin, 0.12, 0.1, arm);
    M(J['l' + i + 's'], sph(0.1, 10, 8), armL, [0, 0, 0.06]);
    foot(J['l' + i + 'f'], 0.18, 0.12, 0.3, arm);
  }
  const hd = orcHead(J, o, skin, bone, 0xff2a00);
  // horned helm
  M(hd, sph(0.2, 20, 14, 0), arm, [0, 0.05, -0.02], [0, 0, 0], [1.05, 0.85, 1.05]);
  M(hd, box(0.36, 0.06, 0.06, 0.02), gold, [0, 0.07, 0.17]);
  for (const s of [1, -1]) { const hg = G(hd, [s * 0.17, 0.1, -0.02], [0, 0, s * -0.7]); M(hg, cone(0.06, 0.3, 10), bone, [0, 0.12, 0]); M(hg, cone(0.04, 0.16, 8), bone, [0, 0.3, 0.06], [0.6, 0, 0]); }
  M(hd, cone(0.04, 0.16, 8), gold, [0, 0.24, 0]);
  // great hammer two-handed
  const h = G(J.a1h, [0, -0.08, 0], [Math.PI / 2, 0, 0]); rig.wpn = h;
  M(h, cyl(0.04, 0.045, 1.5, 10), leathD, [0, 0.35, 0]);
  M(h, box(0.5, 0.28, 0.28, 0.04), steel, [0, 1.05, 0]);
  M(h, box(0.52, 0.06, 0.3, 0.02), gold, [0, 1.05, 0]);
  M(h, cone(0.07, 0.25, 4), steel, [0, 1.3, 0]);
  M(h, sph(0.06, 8, 6), gold, [0, -0.4, 0]);
  rig.height = 2.6; rig.kind = 'chief';
  return rig;
}
function poseChief(rig, anim, t) {
  const rest = {a1u: [-0.3, 0.3, -0.55], a1f: [-1.1, 0, 0], a0u: [-0.4, -0.3, 0.3], a0f: [-0.9, 0, 0]};
  if (anim === 'idle') return merge(standLegs(rig, 0.08, 0.08), rest);
  if (anim === 'walk') { const w = 2 * Math.PI * t; return merge(walkLegs(rig, t, 0.24, 0.14, 0.09), rest, {spine: [0, 0.1 * Math.cos(w), 0]}); }
  if (anim === 'attack') return merge(standLegs(rig, 0.1, 0.16), kf(t, [
    [0, rest],
    [0.45, {a1u: [-3.0, 0.1, -0.15], a1f: [-0.5, 0, 0], a0u: [-2.8, -0.1, 0.25], a0f: [-0.7, 0, 0], spine: [-0.35, 0, 0], head: [0.2, 0, 0]}],
    [0.62, {a1u: [-0.8, 0.05, 0.05], a1f: [-0.05, 0, 0], a0u: [-0.75, 0, -0.15], a0f: [-0.15, 0, 0], spine: [0.5, 0, 0], head: [-0.3, 0, 0], 'body.y': -0.08}],
    [1, rest]]));
  if (anim === 'die') return dieFall(rig, t, rest);
  return {};
}

// ---------- hellbat (not humanoid) ----------
function buildBat() {
  const root = new THREE.Group();
  const J = {};
  const body = G(root, [0, 1.2, 0]); J.body = body; root.scale.setScalar(1.25);
  const fur = mat(0x5a1822), furD = mat(0x34101a), mem = mat(0xa1222e), bone = mat(0x2a0d12), horn = mat(0xe6dcc0);
  M(body, sph(0.22, 20, 14), fur, [0, 0, 0], [0, 0, 0], [1, 0.95, 1.15]);
  M(body, sph(0.16, 16, 12), furD, [0, -0.1, -0.12], [0, 0, 0], [1, 1, 1.2]);
  const head = G(body, [0, 0.12, 0.2]); J.head = head;
  M(head, sph(0.15, 18, 12), fur, [0, 0, 0]);
  M(head, cone(0.06, 0.1, 8), furD, [0, -0.05, 0.15], [Math.PI / 2, 0, 0], [1.4, 1, 0.8]);
  eyes(head, 0.035, 0.03, 0.12, 0.06, glow(0xffe53a));
  for (const s of [1, -1]) {
    M(head, cone(0.06, 0.2, 6), fur, [s * 0.09, 0.15, -0.02], [-0.2, 0, s * -0.35]); // ears
    M(head, cone(0.03, 0.14, 6), horn, [s * 0.05, 0.13, 0.08], [-0.6, 0, s * -0.2]);
    M(head, cone(0.012, 0.05, 4), horn, [s * 0.03, -0.1, 0.13], [Math.PI, 0, 0]); // fangs
  }
  // wings: fan membrane
  for (const i of [0, 1]) {
    const s = i ? -1 : 1;
    const w = G(body, [s * 0.15, 0.05, 0]); J['w' + i] = w;
    const pts = [[0, 0.12], [0.3, 0.3], [0.7, 0.32], [1.0, 0.12], [0.82, -0.12], [0.62, -0.02], [0.45, -0.3], [0.26, -0.12], [0.08, -0.28]];
    const shape = new THREE.Shape(); pts.forEach(([x, z], k) => k ? shape.lineTo(x * s, z) : shape.moveTo(x * s, z));
    const g = new THREE.ShapeGeometry(shape); g.rotateX(Math.PI / 2);
    M(w, g, mem, [0, 0, 0]);
    for (const [x, z] of [[0.7, 0.32], [1.0, 0.12], [0.62, -0.02], [0.45, -0.3]]) {
      const L = Math.hypot(x, z); const r = M(w, cyl(0.012, 0.018, L, 5), bone, [s * x / 2, 0.005, z / 2], [0, 0, 0]);
      r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(s * x, 0, z).normalize());
    }
    M(w, cone(0.02, 0.08, 4), horn, [s * 0.35, 0.03, 0.22], [0, 0, 0]);
  }
  // tail + feet
  M(body, cone(0.04, 0.35, 6), furD, [0, -0.05, -0.38], [-Math.PI / 2 - 0.3, 0, 0]);
  M(body, cone(0.06, 0.1, 4), mem, [0, -0.15, -0.55], [-Math.PI / 2, 0, 0], [1, 1, 0.3]);
  const rest = {}; for (const k in J) rest[k] = {p: J[k].position.clone(), r: J[k].rotation.clone()};
  return {root, J, rest, o: {}, height: 1.6, kind: 'bat', H: 1.2};
}
function poseBat(rig, anim, t) {
  const w = 2 * Math.PI * t;
  if (anim === 'walk' || anim === 'idle') { const a = anim === 'idle' ? 0.35 : 0.35 + 0.7 * Math.sin(w); return {w0: [0, 0, a], w1: [0, 0, -a], body: [0.15, 0, 0], 'body.y': 0.06 * Math.cos(w), head: [-0.1, 0, 0]}; }
  if (anim === 'attack') return kf(t, [[0, {w0: [0, 0, 0.5], w1: [0, 0, -0.5], body: [0.1, 0, 0]}], [0.4, {w0: [0, 0, 1.1], w1: [0, 0, -1.1], body: [-0.4, 0, 0], 'body.z': -0.1}], [0.6, {w0: [0, 0, -0.6], w1: [0, 0, 0.6], body: [0.7, 0, 0], 'body.z': 0.25, 'body.y': -0.2, head: [0.3, 0, 0]}], [1, {w0: [0, 0, 0.3], w1: [0, 0, -0.3], body: [0.15, 0, 0]}]]);
  if (anim === 'die') { const k = ss(t); return {w0: [0, 0, 1.2 * k], w1: [0, 0, -1.2 * k], body: [1.2 * k, 0, 0.6 * k], 'body.y': -1.05 * k}; }
  return {};
}

// =====================================================================
// TRAPS & PROPS (static meshes; frames vary by param)
// =====================================================================
const T = 1.45; // tile size in world units
function trapBase(g, c = 0x5c6068, rim = 0x3b3e45) {
  M(g, box(T * 0.94, 0.06, T * 0.94, 0.025), mat(rim), [0, 0.03, 0]);
  M(g, box(T * 0.86, 0.065, T * 0.86, 0.02), mat(c), [0, 0.035, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) M(g, cyl(0.035, 0.035, 0.03, 8), mat(0x9aa0a8), [sx * T * 0.4, 0.07, sz * T * 0.4]);
}
const BUILDERS = {
  spikes(f) { // f: 0 down,1 half,2 up
    const g = new THREE.Group(); trapBase(g, 0x4c5058);
    const h = [0.02, 0.18, 0.36][f]; const steel = mat(0xd5dbe2), hole = mat(0x15161a);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = (i - 1.5) * 0.3, z = (j - 1.5) * 0.3;
      M(g, cyl(0.06, 0.06, 0.02, 10), hole, [x, 0.07, z]);
      if (f) { M(g, cone(0.05, h, 6), steel, [x, 0.07 + h / 2, z]); if (f === 2) M(g, cone(0.012, 0.05, 4), mat(0xa01818), [x, 0.07 + h * 0.75, z]); }
    }
    return g;
  },
  tar() {
    const g = new THREE.Group();
    M(g, box(T * 0.94, 0.05, T * 0.94, 0.02), mat(0x3a2b1c), [0, 0.025, 0]);
    M(g, box(T * 0.82, 0.055, T * 0.82, 0.02), mat(0x5a432a), [0, 0.03, 0]);
    const tar = mat(0x16121a);
    M(g, cyl(0.62, 0.62, 0.04, 28), tar, [0, 0.06, 0], [0, 0, 0], [1, 1, 1]);
    for (const [x, z, r] of [[0.25, 0.2, 0.09], [-0.3, -0.1, 0.06], [0.05, -0.32, 0.07], [-0.15, 0.3, 0.05]]) M(g, hemi(r), mat(0x2c2433), [x, 0.07, z], [0, 0, 0], [1, 0.6, 1]);
    M(g, hemi(0.05), mat(0x8fb2ff, 0x324a88, 0.6), [0.27, 0.11, 0.2], [0, 0, 0], [0.5, 0.3, 0.5]);
    return g;
  },
  spring(f) { // f 0 armed, 1 launched; points +Z by default
    const g = new THREE.Group(); trapBase(g, 0x5a5048, 0x3a332c);
    const wood = mat(0xa8743d), woodD = mat(0x7a5126), iron = mat(0x8f969f);
    const hinge = G(g, [0, 0.1, -T * 0.38], [f ? -0.85 : -0.06, 0, 0]);
    M(hinge, box(T * 0.72, 0.07, T * 0.76, 0.02), wood, [0, 0.03, T * 0.38]);
    for (let i = 0; i < 4; i++) M(hinge, box(T * 0.72, 0.075, 0.025, 0.005), woodD, [0, 0.032, 0.12 + i * 0.25]);
    M(hinge, box(0.3, 0.08, 0.3, 0.02), mat(0xd4a83a), [0, 0.04, T * 0.5]); // arrow plate
    M(hinge, cone(0.14, 0.24, 3), mat(0xffe08a), [0, 0.085, T * 0.52], [Math.PI / 2, 0, 0], [1, 1, 0.25]);
    M(g, cyl(0.04, 0.04, T * 0.8, 10), iron, [0, 0.1, -T * 0.38], [0, 0, Math.PI / 2]);
    if (f) for (let i = 0; i < 6; i++) M(g, tor(0.1, 0.015, Math.PI * 2, 6, 14), iron, [0, 0.12 + i * 0.07, -0.05], [Math.PI / 2, 0, 0]);
    return g;
  },
  barricade(f) {
    const g = new THREE.Group();
    const wood = mat(f ? 0x7d5a35 : 0x9a6a38), woodD = mat(0x5e4022), rope = mat(0xc9b07a), iron = mat(0x8d949c);
    for (const s of [-1, 1]) {
      const x = G(g, [0, 0.35, 0], [0, s * 0.75, 0]);
      for (const k of [-1, 1]) M(x, cyl(0.08, 0.08, 1.3, 8), wood, [0, k * 0.02, 0], [0, 0, k * 0.9], [1, 1, 1]);
    }
    for (let i = 0; i < 5; i++) { const z = (i - 2) * 0.24; const st = G(g, [0, 0.0, z]); M(st, cyl(0.065, 0.075, 0.9, 7), i % 2 ? woodD : wood, [0, 0.45, 0], [0.0, 0, 0]); M(st, cone(0.066, 0.2, 7), mat(0xc8a46a), [0, 1.0, 0]); M(st, tor(0.08, 0.018, Math.PI * 2, 5, 10), rope, [0, 0.35, 0], [Math.PI / 2, 0, 0]); }
    M(g, box(0.12, 0.12, 1.25, 0.02), woodD, [0, 0.55, 0]);
    M(g, box(1.2, 0.1, 0.12, 0.02), woodD, [0, 0.12, 0.0]);
    for (let i = 0; i < 4; i++) { const z = (i - 1.5) * 0.32; M(g, cone(0.045, 0.45, 6), iron, [0.15, 0.55, z], [0, 0, -1.25]); M(g, cone(0.045, 0.45, 6), iron, [-0.15, 0.55, z], [0, 0, 1.25]); }
    if (f) { M(g, box(0.4, 0.06, 0.08, 0.01), woodD, [0.3, 0.05, 0.5], [0, 0.6, 0]); M(g, box(0.3, 0.05, 0.07, 0.01), wood, [-0.35, 0.04, -0.4], [0, -0.4, 0]); }
    g.rotation.y = Math.PI / 2;
    const w = new THREE.Group(); w.add(g); return w;
  },
  arrowwall(f) { // panel on wall top, faces +Z (south)
    const g = new THREE.Group();
    const stone = mat(0x6a6f7a), iron = mat(0x4e535c), brass = mat(0xc99a3a), dark = mat(0x101114);
    M(g, box(T * 0.92, 0.12, T * 0.92, 0.03), iron, [0, 0.06, 0]);
    M(g, box(T * 0.8, 0.14, T * 0.8, 0.03), stone, [0, 0.08, 0]);
    M(g, box(T * 0.86, 0.5, 0.2, 0.04), iron, [0, 0.26, T * 0.38]); // front face plate visible above wall
    for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.3; M(g, box(0.07, 0.24, 0.05), dark, [x, 0.27, T * 0.38 + 0.09]); if (f) M(g, cone(0.03, 0.12, 4), mat(0xd8dde4), [x, 0.27, T * 0.38 + 0.18], [Math.PI / 2, 0, 0]); }
    M(g, cyl(0.12, 0.12, 0.06, 16), brass, [0, 0.18, 0]);
    M(g, cone(0.09, 0.2, 3), brass, [0, 0.22, 0.15], [Math.PI / 2, 0, 0], [1, 1, 0.3]);
    return g;
  },
  brimstone(f) {
    const g = new THREE.Group(); trapBase(g, 0x3d3330, 0x2a201d);
    const ember = f ? glow(0xff7a1a) : mat(0x7a2a10, 0x601c08, 0.8), grate = mat(0x2a2b30);
    M(g, box(T * 0.72, 0.03, T * 0.72, 0.01), ember, [0, 0.07, 0]);
    for (let i = 0; i < 7; i++) { M(g, box(T * 0.74, 0.05, 0.05, 0.01), grate, [0, 0.1, (i - 3) * 0.15]); M(g, box(0.05, 0.05, T * 0.74, 0.01), grate, [(i - 3) * 0.15, 0.1, 0]); }
    if (f) for (let i = 0; i < 6; i++) M(g, cone(0.08, 0.3, 6), glow(0xffc23a), [Math.cos(i) * 0.35, 0.25, Math.sin(i * 1.7) * 0.35]);
    return g;
  },
  grinder(f) { // on wall, blades face +Z
    const g = new THREE.Group();
    const iron = mat(0x4b4f58), steel = mat(0xc7cdd4), red = mat(0x8a1e1e), brass = mat(0xb88a34);
    M(g, box(T * 0.92, 0.14, T * 0.92, 0.03), iron, [0, 0.07, 0]);
    M(g, box(T * 0.9, 0.45, 0.25, 0.04), iron, [0, 0.25, T * 0.36]);
    for (const x of [-0.32, 0.32]) {
      const r = G(g, [x, 0.27, T * 0.48], [0, 0, 0]);
      r.rotation.z = (x > 0 ? 1 : -1) * f * (Math.PI / 6);
      M(r, cyl(0.2, 0.2, 0.08, 16), steel, [0, 0, 0], [Math.PI / 2, 0, 0]);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; M(r, cone(0.06, 0.16, 4), steel, [Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0], [0, 0, a - Math.PI / 2], [1, 1, 0.3]); }
      M(r, cyl(0.06, 0.06, 0.1, 8), brass, [0, 0, 0.02], [Math.PI / 2, 0, 0]);
    }
    M(g, box(0.3, 0.06, 0.3, 0.02), red, [0, 0.16, 0]);
    return g;
  },
  frost(f) {
    const g = new THREE.Group(); trapBase(g, 0x51606e, 0x34404c);
    const ice = f ? glow(0x9ff0ff) : mat(0x7ad6f0, 0x2a88b0, 0.7), stone = mat(0x8a96a3);
    M(g, cyl(0.45, 0.5, 0.08, 6), stone, [0, 0.1, 0]);
    M(g, cyl(0.3, 0.3, 0.09, 6), mat(0x16303e), [0, 0.13, 0]);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; M(g, oct(0.11), ice, [Math.cos(a) * 0.5, 0.18, Math.sin(a) * 0.5], [0.3, a, 0], [0.7, 1.6, 0.7]); }
    M(g, oct(0.14), ice, [0, f ? 0.4 : 0.22, 0], [0, 0.5, 0], [0.8, 1.8, 0.8]);
    return g;
  },
  rift() {
    const g = new THREE.Group();
    const c = glow(0x6ae4ff), c2 = mat(0x3fa8ff, 0x2a6fe0, 1.2), gold = mat(0xe0b246), stone = mat(0x6d7280);
    M(g, cyl(0.85, 0.95, 0.18, 10), stone, [0, 0.09, 0]);
    M(g, tor(0.8, 0.05, Math.PI * 2, 6, 30), gold, [0, 0.19, 0], [Math.PI / 2, 0, 0]);
    M(g, oct(0.32), c, [0, 1.2, 0], [0, 0.3, 0], [0.8, 1.7, 0.8]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; M(g, oct(0.09), c2, [Math.cos(a) * 0.55, 0.9 + (i % 2) * 0.3, Math.sin(a) * 0.55], [0.4, a, 0], [0.7, 1.7, 0.7]); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; M(g, box(0.12, 0.35, 0.12, 0.03), stone, [Math.cos(a) * 0.78, 0.3, Math.sin(a) * 0.78], [0, -a, 0]); M(g, oct(0.06), c, [Math.cos(a) * 0.78, 0.52, Math.sin(a) * 0.78]); }
    return g;
  },
  barrel() {
    const g = new THREE.Group(); const w = mat(0x8f5c2c), band = mat(0x4a4d55);
    M(g, lathe([[0.0, 0], [0.32, 0], [0.38, 0.35], [0.32, 0.7], [0, 0.7]], 18), w, [0, 0, 0]);
    for (const y of [0.12, 0.58]) M(g, tor(0.345, 0.022, Math.PI * 2, 6, 22), band, [0, y, 0], [Math.PI / 2, 0, 0]);
    M(g, cyl(0.31, 0.31, 0.02, 18), mat(0x6e451f), [0, 0.7, 0]);
    return g;
  },
  crate() {
    const g = new THREE.Group(); const w = mat(0xb48448), d = mat(0x7e5a2c);
    M(g, box(0.7, 0.62, 0.7, 0.03), w, [0, 0.31, 0]);
    for (const s of [-1, 1]) { M(g, box(0.74, 0.08, 0.08, 0.01), d, [0, 0.31 + s * 0.27, 0.33]); M(g, box(0.74, 0.08, 0.08, 0.01), d, [0, 0.31 + s * 0.27, -0.33]); M(g, box(0.08, 0.62, 0.74, 0.01), d, [0.33 * s, 0.31, 0]); }
    M(g, box(0.08, 0.8, 0.08, 0.01), d, [0, 0.31, 0.35], [0, 0, 0.78]);
    return g;
  },
  brazier(f) {
    const g = new THREE.Group(); const iron = mat(0x3c3f46), coal = glow(0xff6a1a);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; M(g, cyl(0.03, 0.04, 0.6, 6), iron, [Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2], [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]); }
    M(g, lathe([[0.05, 0], [0.3, 0.08], [0.38, 0.22], [0.36, 0.24]], 16), iron, [0, 0.55, 0]);
    M(g, hemi(0.3), coal, [0, 0.7, 0], [0, 0, 0], [1, 0.35, 1]);
    return g;
  },
  bones() {
    const g = new THREE.Group(); const b = mat(0xe6dcc2);
    M(g, sph(0.13, 14, 10), b, [0, 0.12, 0], [0, 0, 0], [1, 0.9, 1.1]);
    eyes(g, 0.035, 0.13, 0.12, 0.05, mat(0x2a2016));
    for (const [x, z, r] of [[0.25, 0.1, 0.4], [-0.2, -0.15, -0.7], [0.1, -0.25, 1.4]]) M(g, cyl(0.03, 0.03, 0.4, 6), b, [x, 0.04, z], [Math.PI / 2, 0, r]);
    return g;
  },
};
const PROP_DIRS = {spring: 4, arrowwall: 4, grinder: 4};

// ---------- scene / camera ----------
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
scene.add(cam);
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const hl = new THREE.HemisphereLight(0xdde8ff, 0x6a5040, 0.5); scene.add(hl);
const key = new THREE.DirectionalLight(0xfff4e0, 1.9); key.position.set(-1.2, 1.6, 1.0); cam.add(key); key.target.position.set(0, 0, -5); cam.add(key.target);
const rim = new THREE.DirectionalLight(0xbcd2ff, 0.6); rim.position.set(1.5, 0.4, -1.0); cam.add(rim); rim.target.position.set(0, 0, -5); cam.add(rim.target);

const UNITS = {
  warmage: [buildWarmage, poseWarmage], sorc: [buildSorceress, poseSorc], grunt: [buildGrunt, poseGrunt], kobold: [buildKobold, poseKobold],
  archer: [buildArcher, poseArcher], ogre: [buildOgre, poseOgre], bat: [buildBat, poseBat], chief: [buildWarchief, poseChief],
};
let cur = null, curName = '';
function setCam(el, halfW, halfH, ty) {
  const D = 20; const e = el * Math.PI / 180;
  cam.position.set(0, ty + Math.sin(e) * D, Math.cos(e) * D); cam.up.set(0, 1, 0); cam.lookAt(0, ty, 0);
  cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH; cam.updateProjectionMatrix();
  R.setSize(Math.round(halfW * 2 * PPU), Math.round(halfH * 2 * PPU), false);
}
function anchor() { const v = new THREE.Vector3(0, 0, 0).project(cam); return [(v.x + 1) / 2 * R.domElement.width, (1 - v.y) / 2 * R.domElement.height]; }

// dir index: 0=E,1=SE,2=S,3=SW,4=W,5=NW,6=N,7=NE ; screen right=+X, screen down=+Z
const yawFor = d => { const th = d * Math.PI / 4; return Math.atan2(Math.cos(th), Math.sin(th)); };

window.renderUnit = (name, anim, t, dir, el = 40) => {
  if (curName !== name) { if (cur) scene.remove(cur.root); cur = UNITS[name][0](); curName = name; scene.add(cur.root); }
  resetPose(cur);
  applyPose(cur, UNITS[name][1](cur, anim, t));
  if (cur.bowStr) { cur.bowStr.scale.set(1, 1, 1); }
  cur.root.rotation.y = yawFor(dir);
  const h = cur.height;
  const halfW = h * 0.85 + 0.3, halfH = h * 0.85 + 0.3;
  setCam(el, halfW, halfH, h * 0.42);
  R.render(scene, cam);
  const [ax, ay] = anchor();
  return {url: R.domElement.toDataURL('image/png'), ax, ay, w: R.domElement.width, h: R.domElement.height};
};
window.renderProp = (name, f, dir, el = 62) => {
  if (cur) { scene.remove(cur.root); cur = null; curName = ''; }
  const g = BUILDERS[name](f);
  const holder = new THREE.Group(); holder.add(g); scene.add(holder);
  holder.rotation.y = yawFor(dir === undefined ? 2 : dir); // default faces S
  const half = name === 'rift' ? 1.25 : 1.0;
  setCam(el, half, half, name === 'rift' ? 0.55 : 0.15);
  R.render(scene, cam);
  const [ax, ay] = anchor();
  scene.remove(holder);
  return {url: R.domElement.toDataURL('image/png'), ax, ay, w: R.domElement.width, h: R.domElement.height};
};
window.PROP_DIRS = PROP_DIRS;
window.READY = true;
