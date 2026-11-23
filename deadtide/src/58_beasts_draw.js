/* ---------- (round 35) flyers and 能力者 elites: models, auras, telegraphs ---------- */
// Flyers are small articulated groups (body, head, two two-part wings, tail) with a soft shadow on the ground under them so you can read their height.
// Elites are drawn with the normal zombie rig (their own skin and eye colour) plus an overlay group: a pulsing aura ring, a 护盾者's bubble,
// a 唤尸者's summoning circle, and a 隐身者's shimmer while it is cloaked (then nothing else is drawn).
const FLY = new Map(), ELX = new Map();
function mkFlyer(k) {
  const ptero = k === 'kwing', bat = k === 'bat', vult = k === 'vult', g = new THREE.Group(), J = { k, wings: [] }; /* (round 36m) 翼龙兽: a pterosaur — long beak, a swept-back crest, membrane wings, a long tail with a vane */
  const body = lam(bat ? '#4a3838' : ptero ? '#6a4a5c' : vult ? '#4a3a2c' : '#1d1d24'), dark = lam(bat ? '#2c2222' : ptero ? '#2e1e28' : vult ? '#c9b89a' : '#0d0d12'), /* (round 36l) 尸鹫: brown with a pale ruff */ beakM = lam('#8a7a58'), memb = lam(bat ? '#5c4242' : ptero ? '#9a5868' : '#24242c', { side: THREE.DoubleSide });
  const eyeM = new THREE.MeshBasicMaterial({ color: bat || ptero ? '#ffb030' : '#ff3a2a' });
  const B = kjGrp(g, 0, 0.25, 0); J.body = B;
  kjPart(B, kjBlob(0.12, bat ? 1.15 : 1.7, bat ? 0.95 : 0.85, bat ? 0.9 : 0.8, 5), body);
  if (!bat) kjPart(B, kjBlob(0.08, 1.4, 0.6, 0.9, 11), dark, -0.03, -0.06, 0); // a darker belly
  const H = kjGrp(B, bat ? 0.13 : 0.21, bat ? 0.04 : 0.06, 0); J.head = H;
  kjPart(H, kjBlob(0.08, 1.05, 0.95, 0.95, 7), body);
  if (bat) { for (const s of [1, -1]) kjPart(H, new THREE.ConeGeometry(0.03, 0.11, 4), dark, -0.01, 0.1, s * 0.04, 0.25 * s, 0, 0); kjPart(H, kjBlob(0.04, 1.2, 0.7, 0.9, 2), dark, 0.07, -0.02, 0); for (const s of [1, -1]) kjPart(H, new THREE.ConeGeometry(0.008, 0.03, 3), lam('#e8e0d0'), 0.08, -0.05, s * 0.015, Math.PI, 0, 0); }
  else if (ptero) { kjPart(H, new THREE.ConeGeometry(0.035, 0.3, 6).rotateZ(-Math.PI / 2), lam('#c8a878'), 0.22, -0.02, 0); kjPart(H, new THREE.ConeGeometry(0.03, 0.26, 4).rotateZ(Math.PI / 2 + 0.5).scale(1, 1, 0.3), memb, -0.13, 0.08, 0); }
  else { kjPart(H, new THREE.ConeGeometry(0.028, 0.13, 5).rotateZ(-Math.PI / 2), beakM, 0.12, -0.01, 0); kjPart(H, boxG(0.05, 0.02, 0.06), dark, -0.04, 0.07, 0, 0, 0, 0.3); } // beak, ragged crest
  for (const s of [1, -1]) kjPart(H, new THREE.IcosahedronGeometry(bat ? 0.016 : 0.018, 0), eyeM, 0.055, 0.025, s * 0.042);
  // tail: a fan of feathers (crow) / a stub (bat)
  if (ptero) { const T = kjGrp(B, -0.18, 0.01, 0); J.tail = T; kjPart(T, new THREE.ConeGeometry(0.03, 0.5, 5).rotateZ(Math.PI / 2), body, -0.25, 0, 0); kjPart(T, new THREE.OctahedronGeometry(0.06, 0).scale(1, 1.3, 0.3), memb, -0.5, 0.02, 0); }
  else if (!bat) { const T = kjGrp(B, -0.18, 0.01, 0); J.tail = T; for (let k = -2; k <= 2; k++) kjPart(T, boxG(0.2, 0.012, 0.04, -0.1, 0, 0), body, 0, 0, k * 0.022, 0, k * 0.16, 0); }
  else kjPart(B, new THREE.ConeGeometry(0.03, 0.12, 4).rotateZ(Math.PI / 2), dark, -0.16, 0, 0);
  // wings: an inner and an outer part on each side; crows get fanned feathers, bats a stretched membrane between finger bones
  for (const s of [1, -1]) {
    const W0 = kjGrp(B, 0.02, 0.05, s * 0.07), O = kjGrp(W0, 0, 0, s * (bat || ptero ? 0.24 : 0.22));
    if (bat || ptero) {
      const mem = (pts) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]); const geo = new THREE.ShapeGeometry(sh).rotateX(Math.PI / 2); if (s < 0) geo.scale(1, 1, -1); return geo; };
      kjPart(W0, mem([[0.06, 0], [0.04, 0.24], [-0.14, 0.22], [-0.16, 0]]), memb);
      kjPart(O, mem([[0.04, 0], [0.12, 0.26], [-0.02, 0.16], [-0.12, 0.3], [-0.14, 0.08], [-0.14, 0]]), memb);
      kjPart(W0, boxG(0.02, 0.02, 0.24, 0.05, 0, s * 0.12), dark); kjPart(O, boxG(0.015, 0.015, 0.3, 0.06, 0, s * 0.14).rotateY(s * -0.3), dark);
    } else {
      kjPart(W0, boxG(0.17, 0.016, 0.23, -0.03, 0, s * 0.115), body);
      for (let k = 0; k < 5; k++) kjPart(O, boxG(0.24 - k * 0.02, 0.01, 0.045, -0.1 + k * 0.01, 0, 0), k % 2 ? body : dark, 0.02 - k * 0.035, 0, s * (0.04 + k * 0.035), 0, s * (0.15 + k * 0.17), 0);
    }
    J.wings.push({ g: W0, o: O, s });
  }
  g.userData.J = J; return g;
}
let FLYSH = null;
function drawFlyer(z, corpse, dt) {
  const key = (corpse ? 'c' : 'z') + (z.id != null ? z.id : z.seed) + z.k; let K = FLY.get(key);
  if (!K) { if (!FLYSH) FLYSH = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3, depthWrite: false });
    const g = mkFlyer(z.k), sh = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12).rotateX(-Math.PI / 2), FLYSH.clone()); SCN.add(g); SCN.add(sh); K = { g, J: g.userData.J, sh }; FLY.set(key, K); }
  K.seen = 1; const g = K.g, J = K.J, bat = z.k === 'bat', t = W.t, S = bat ? 1.55 : z.k === 'vult' ? 2.3 : z.k === 'kwing' ? 6.0 : 1.4; g.visible = K.sh.visible = true;
  if (z._f == null) { z._f = z.face || 0; z._ph = (z.seed || 0) % 7; z._roll = 0; z._pz = z.z; }
  const kt = corpse ? 0 : z.kt || 0, f0 = z._f; z._f = angLerp(z._f, z.face || 0, Math.min(1, dt * 7));
  const turn = dt > 0 ? angDiff(f0, z._f) / dt : 0; z._roll = lerp(z._roll, clamp(-turn * 0.18, -0.7, 0.7), Math.min(1, dt * 5));
  const vz = dt > 0 ? (z.z - z._pz) / dt : 0; z._pz = z.z;
  // flap: cruising beats, a fast flutter while hovering for the dive, wings tucked back in the dive, gliding as it pulls up
  const rate = (kt === 1 ? 22 : kt === 2 ? 0 : (bat ? 14 : 9) * (vz > 0.4 ? 1.4 : 1)) * (z.k === 'kwing' ? 0.4 : 1); z._ph += dt * rate;
  const amp = corpse ? 0 : kt === 2 ? 0.1 : kt === 1 ? 0.75 : vz < -0.5 ? 0.25 : 0.62, tuck = kt === 2 ? 1 : 0;
  for (const Wg of J.wings) { const lift = Math.sin(z._ph) * amp + (corpse ? -0.1 : 0.12), lo = Math.sin(z._ph - 0.7) * amp * 0.8;
    Wg.g.rotation.x = -Wg.s * lift; Wg.g.rotation.y = lerp(Wg.g.rotation.y, -Wg.s * (tuck ? 0.95 : 0.05), Math.min(1, dt * 12)); Wg.o.rotation.x = -Wg.s * (lo * 0.7 + (tuck ? -0.3 : 0)); Wg.o.rotation.y = -Wg.s * (tuck ? 0.6 : 0); }
  const pitch = corpse ? 0 : kt === 2 ? -0.55 : kt === 1 ? 0.35 : clamp(vz * 0.12, -0.4, 0.3);
  J.body.rotation.z = lerp(J.body.rotation.z, pitch, Math.min(1, dt * 8)); J.body.position.y = 0.25 + (corpse ? 0 : Math.sin(z._ph) * 0.025 * amp);
  if (J.head) J.head.rotation.z = kt === 1 ? -0.4 + Math.sin(t * 30) * 0.08 : 0; // crying out
  if (J.tail) J.tail.rotation.z = kt === 2 ? 0.25 : Math.sin(z._ph * 0.5) * 0.08;
  let zz = z.z; if (corpse) { const k = Math.min(1, z.t / 0.45); zz = lerp(z.fz != null ? z.fz : z.z, z.z, k * k); }
  g.position.set(z.x, zz, z.y); g.rotation.set(corpse ? Math.min(1.3, z.t * 3) : z._roll, -z._f, 0);
  g.scale.setScalar(S * (!corpse && z.hitT > 0 ? 1.12 : 1)); if (corpse && z.t > 7) g.visible = false;
  // shadow on whatever is under it: darker and smaller the lower it flies
  const gz = skyTop(z.x, z.y) * FH, h = Math.max(0, zz - gz); K.sh.position.set(z.x, gz + 0.03, z.y); K.sh.scale.setScalar(clamp(1.3 - h * 0.12, 0.6, 1.3) * S); K.sh.material.opacity = clamp(0.38 - h * 0.05, 0.08, 0.38); K.sh.visible = g.visible && !corpse;
}
function flySweep() { for (const [k, K] of FLY) { if (!K.seen) { K.g.visible = K.sh.visible = false; if (k[0] === 'c' ? !RND.corpses.some(c => 'c' + (c.id != null ? c.id : c.seed) + c.k === k) : !W.zs.some(z => 'z' + z.id + z.k === k)) { SCN.remove(K.g); SCN.remove(K.sh); FLY.delete(k); } } K.seen = 0; } }

// ---- elites ----
function mkEliteFx(k) {
  const E = ZT[k].elite, g = new THREE.Group(), add = (geo, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: E.col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); g.add(m); return m; };
  const X = { g };
  X.ring = add(new THREE.RingGeometry(0.42, 0.56, 28).rotateX(-Math.PI / 2), 0.55);
  X.ring2 = add(new THREE.RingGeometry(0.62, 0.68, 28).rotateX(-Math.PI / 2), 0.3);
  if (E.k === 'shield') { X.bub = add(new THREE.SphereGeometry(SHIELD_R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), 0.1); X.edge = add(new THREE.RingGeometry(SHIELD_R - 0.08, SHIELD_R, 48).rotateX(-Math.PI / 2), 0.5); }
  if (E.k === 'call') X.circle = add(new THREE.RingGeometry(2.3, 2.6, 40).rotateX(-Math.PI / 2), 0.4);
  if (E.k === 'cloak') { X.ghost = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.75, 4, 8).translate(0, 0.65, 0), new THREE.MeshBasicMaterial({ color: '#c8c8e8', transparent: true, opacity: 0.08, depthWrite: false })); g.add(X.ghost);
    X.eyes = new THREE.Mesh(merge([new THREE.IcosahedronGeometry(0.03, 0).translate(0.2, 1.22, -0.06), new THREE.IcosahedronGeometry(0.03, 0).translate(0.2, 1.22, 0.06)]), new THREE.MeshBasicMaterial({ color: '#e0e0ff', transparent: true, opacity: 0.6 })); g.add(X.eyes); }
  return X;
}
function drawElite(z, dt) {
  let X = ELX.get(z.id); if (!X) { X = mkEliteFx(z.k); SCN.add(X.g); ELX.set(z.id, X); }
  X.seen = 1; const E = ZT[z.k].elite, t = W.t, kt = z.kt || 0, ck = !!(z.ck || z.ckF);
  X.g.visible = true; X.g.position.set(z.x, z.z + 0.04, z.y); X.g.rotation.y = -(z._f != null ? z._f : z.face || 0);
  const pulse = 0.5 + 0.5 * Math.sin(t * 4 + z.id);
  X.ring.visible = X.ring2.visible = !ck; X.ring.material.opacity = (kt ? 0.85 : 0.4 + pulse * 0.25); X.ring.scale.setScalar(kt ? 1 + Math.sin(t * 20) * 0.12 : 1); X.ring2.rotation.y = t * 1.5; X.ring2.scale.setScalar(1 + pulse * 0.15);
  if (!ck && Math.random() < dt * (kt ? 30 : 6)) addP({ x: z.x + frnd(-0.3, 0.3), y: z.y + frnd(-0.3, 0.3), z: z.z + frnd(0.1, 1.2), vx: 0, vy: 0, vz: frnd(0.4, 1.0), g: -0.2, col: E.col, s: 0.05, life: 0.7 });
  if (X.bub) { const up = !!(z.sh > 0 || z.shF); X.bub.visible = X.edge.visible = up; if (up) { X.bub.material.opacity = 0.07 + pulse * 0.04 + (X.flash > 0 ? X.flash * 0.6 : 0); X.edge.material.opacity = 0.35 + pulse * 0.2; X.bub.rotation.y = t * 0.3; } if (X.flash > 0) X.flash -= dt * 4; }
  if (X.circle) { X.circle.visible = kt === 1; if (kt === 1) { X.circle.material.opacity = 0.3 + Math.sin(t * 14) * 0.15; X.circle.rotation.y = -t * 2; } }
  if (X.ghost) { X.ghost.visible = X.eyes.visible = ck; if (ck) { X.ghost.material.opacity = 0.05 + Math.abs(Math.sin(t * 7 + z.id)) * 0.07; X.ghost.scale.set(1 + Math.sin(t * 9) * 0.06, 1, 1 + Math.cos(t * 8) * 0.06); X.eyes.material.opacity = 0.3 + pulse * 0.4; } }
}
// telegraph marks left by events (where a 闪影者 is about to appear)
function eliteMarks(dt) {
  if (!RND.elm || !RND.elm.length) return;
  for (const m of RND.elm) { m.t += dt; if (Math.random() < dt * 40) { const a = Math.random() * 6.28, r = 0.5 * (1 - m.t / m.life) + 0.1; addP({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, z: m.z + frnd(0, 1.4), vx: -Math.sin(a) * 1.5, vy: Math.cos(a) * 1.5, vz: 0.6, g: 0, col: m.col, s: 0.07, life: 0.4 }); } }
  RND.elm = RND.elm.filter(m => m.t < m.life);
}
function eliteSweep(dt) { eliteMarks(dt); for (const [id, X] of ELX) { if (!X.seen) { X.g.visible = false; if (!W.zs.some(z => z.id === id)) { SCN.remove(X.g); ELX.delete(id); } } X.seen = 0; } }
// the host's / guest's event for an elite skill moment
function eliteEvent(e) {
  const Z = W.zs.find(z => z.id === e.id), col = Z && ZT[Z.k].elite ? ZT[Z.k].elite.col : '#ffffff', burst = (x, y, z, c, n, sp) => { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = frnd(0.5, sp || 3); addP({ x, y, z: z + frnd(0.2, 1.3), vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: frnd(-0.5, 2), g: 1, col: c, s: frnd(0.05, 0.1), life: 0.6 }); } };
  switch (e.a) {
    case 'blink0': (RND.elm = RND.elm || []).push({ x: e.tx, y: e.ty, z: e.tz, t: 0, life: 0.65, col: '#b47aff' }); burst(e.x, e.y, e.z, '#b47aff', 10, 1.5); break;
    case 'blink1': burst(e.x, e.y, e.z, '#b47aff', 18); burst(e.tx, e.ty, e.tz, '#d8b0ff', 18); for (let k = 0; k <= 10; k++) { const f = k / 10; addP({ x: lerp(e.x, e.tx, f), y: lerp(e.y, e.ty, f), z: lerp(e.z, e.tz, f) + 0.8, g: 0, col: '#b47aff', s: 0.08, life: 0.35 }); } sfx('blink', e.tx, e.ty); break;
    case 'slash': for (let k = 0; k < 14; k++) { const a = e.f + (k / 13 - 0.5) * 2.2; addP({ x: e.x + Math.cos(a) * 1.3, y: e.y + Math.sin(a) * 1.3, z: e.z + 0.9 + (k / 13 - 0.5) * 0.4, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.5, g: 0, col: k % 2 ? '#e8d0ff' : '#b47aff', s: 0.08, life: 0.25 }); } sfx('slash', e.x, e.y); break;
    case 'call0': burst(e.x, e.y, e.z, '#6aff9a', 10, 1); if (thr('callMsg', 10)) uiMsg('唤尸者在召唤——晕住它可以打断', '#6aff9a'); break;
    case 'call1': for (const q of e.p || []) { debrisFx(q[0], q[1], q[2] + 0.1, '#5a4a36', 8); burst(q[0], q[1], q[2], '#6aff9a', 6, 1.5); } sfx('summon', e.x, e.y); break;
    case 'shield': burst(e.x, e.y, e.z, '#6ac8ff', 14, 2); sfx('shield', e.x, e.y); break;
    case 'shhit': { const X = ELX.get(e.id); if (X) X.flash = 0.25; for (let k = 0; k < 3; k++) addP({ x: e.x + frnd(-0.2, 0.2), y: e.y + frnd(-0.2, 0.2), z: e.z, vx: frnd(-1, 1), vy: frnd(-1, 1), vz: frnd(0, 1), g: 2, col: '#a8e4ff', s: 0.06, life: 0.3 }); if (thr('shMsg', 14)) uiMsg('打在护盾上了——走进蓝色护盾里再打', '#6ac8ff'); break; }
    case 'break': for (let k = 0; k < 30; k++) { const a = Math.random() * 6.28, b = Math.random() * 1.4; addP({ x: e.x + Math.cos(a) * SHIELD_R * Math.cos(b), y: e.y + Math.sin(a) * SHIELD_R * Math.cos(b), z: e.z + SHIELD_R * Math.sin(b) * 0.8, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: frnd(0, 2), g: 6, col: k % 2 ? '#6ac8ff' : '#d8f4ff', s: 0.08, life: 0.8 }); } sfx('brk', e.x, e.y); if (thr('brMsg', 6)) uiMsg('护盾碎了！', '#6ac8ff'); break;
    case 'cloak': burst(e.x, e.y, e.z, '#8a8aa0', 8, 1); break;
    case 'reveal': burst(e.x, e.y, e.z, '#c0c0e0', 10, 1.5); break;
    case 'ambush': burst(e.x, e.y, e.z, '#ff4a4a', 12, 2.5); sfx('ambush', e.x, e.y); shake(e.x, e.y, 0.35); if (thr('ambMsg', 12)) uiMsg('隐身者偷袭！', '#ff8080'); break;
  }
}
// (round 35) mech target marker: a ring on the zombie your next mech attack will go for (the same pick the host makes), so you can see what you'll hit
let MLOCK = null;
function drawMechLock(me, dt) {
  if (!MLOCK) { MLOCK = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide });
    const r = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 32).rotateX(-Math.PI / 2), mat); MLOCK.add(r);
    for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 3).rotateZ(Math.PI / 2).translate(0.82, 0, 0), mat); t.rotation.y = k * Math.PI / 2; MLOCK.add(t); }
    MLOCK.renderOrder = 998; MLOCK.children.forEach(c => c.renderOrder = 998); SCN.add(MLOCK); }
  const T = me && !me.dead && inMech(me) && !W.demo ? mechLock(me) : null; MLOCK.visible = !!T && zSeen(T); if (!MLOCK.visible) return;
  const M = mechOf(me), col = M.glow || '#ffe066'; MLOCK.children[0].material.color.set(col);
  MLOCK.position.set(T.x, T.z + 0.05, T.y); MLOCK.rotation.y = W.t * 2; MLOCK.scale.setScalar(Math.max(0.8, T.r * 2.6) * (1 + Math.sin(W.t * 8) * 0.06));
}
// (round 35) mech projectiles as real little models (they were coloured dots): taped cardboard parcels that tumble, finned rockets with a flame, brass shells, a glowing fist
const MPRJ = {};
function mprjMake(kd) {
  const g = new THREE.Group(), L = c => lam(c), B = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(boxG(w, h, d, x || 0, y || 0, z || 0), L(c)); g.add(m); return m; };
  if (kd === 'parcel' || kd === 'bigparcel') { const s = kd === 'bigparcel' ? 0.58 : 0.34; B(s, s * 0.78, s * 0.9, '#b8893a'); B(s + 0.01, s * 0.12, s * 0.92, '#e8d9a8'); B(s * 0.12, s * 0.8, s * 0.92, '#e8d9a8'); B(s * 0.4, s * 0.3, 0.01, '#f4f0e6', s * 0.15, -s * 0.12, s * 0.455); B(s * 0.25, s * 0.06, 0.012, '#c03030', s * 0.15, -s * 0.06, s * 0.46); }
  else if (kd === 'rocket') { const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 8).rotateZ(Math.PI / 2), L('#d8dde2')); g.add(body); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 8).rotateZ(-Math.PI / 2).translate(0.28, 0, 0), L('#d04030')); g.add(nose);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(boxG(0.12, 0.01, 0.09, -0.18, 0, 0.06), L('#5a6a7a')); f.rotation.x = k * Math.PI / 2; g.add(f); }
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 8).rotateZ(Math.PI / 2).translate(-0.36, 0, 0), new THREE.MeshBasicMaterial({ color: '#ffb84a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(fl); g.userData.fl = fl; }
  else if (kd === 'feather') { const ad = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }); /* (round 37) 火凤's burning feather */
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), ad('#ff6a1e')); a.scale.set(3.2, 0.25, 0.9); g.add(a); const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), ad('#ffd060')); b.scale.set(2.4, 0.3, 0.6); b.position.x = 0.12; g.add(b); }
  else if (kd === 'cannon') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 8).rotateZ(Math.PI / 2), L('#c8a040')); g.add(m); const n = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6).translate(0.11, 0, 0), L('#c8a040')); g.add(n); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6).translate(-0.08, 0, 0), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(gl); }
  else { const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: '#9fe8ff', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(m); const c = new THREE.Mesh(boxG(0.26, 0.22, 0.24), L('#3a4048')); g.add(c); }
  g.traverse(o => { if (o.isMesh && o.material.type !== 'MeshBasicMaterial') o.castShadow = true; }); SCN.add(g); return g;
}
function mprjDraw(r, x, y, z) {
  if (!r.m) { const q = MPRJ[r.kd] || (MPRJ[r.kd] = []); r.m = q.pop() || mprjMake(r.kd); r.m.visible = true; r.m.scale.setScalar(r.sm || 1); r.rs = (Math.random() - 0.5) * 2; }
  const m = r.m; m.position.set(x, z, y);
  if (r.kd === 'parcel' || r.kd === 'bigparcel') m.rotation.set(r.t * 7 * r.rs, -Math.atan2(r.e[1] - r.y, r.e[0] - r.x), r.t * 9);
  else { const dx = r.e[0] - r.x, dy = r.e[1] - r.y, dz = r.e[2] - r.z; m.rotation.set(0, -Math.atan2(dy, dx), Math.atan2(dz, Math.hypot(dx, dy))); if (m.userData.fl) m.userData.fl.scale.set(0.8 + Math.random() * 0.5, 1, 1); }
}
function mprjFree(r) { if (!r.m) return; r.m.visible = false; (MPRJ[r.kd] || (MPRJ[r.kd] = [])).push(r.m); r.m = null; if (r.fake) debrisFx(r.e[0], r.e[1], r.e[2] + 0.1, '#b8893a', 4); }

/* ---------- (round 36) mech effects: slash arcs, shock rings, muzzle blasts, casings, battle damage ---------- */
// short-lived additive meshes (arcs / rings / flashes), pooled per shape, animated by fxTick every frame
const FXM = { live: [], pool: {} };
function fxMesh(kind) {
  const q = FXM.pool[kind] || (FXM.pool[kind] = []); let m = q.pop();
  if (!m) { const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const geo = kind === 'arc' ? new THREE.RingGeometry(0.55, 1, 28, 1, -1.15, 2.3).rotateX(-Math.PI / 2) : kind === 'ring' ? new THREE.RingGeometry(0.82, 1, 40).rotateX(-Math.PI / 2) : kind === 'disc' ? new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2) : new THREE.SphereGeometry(1, 10, 8);
    m = new THREE.Mesh(geo, mat); m.renderOrder = 5; SCN.add(m); m.userData.kind = kind; }
  m.visible = true; return m;
}
// o: { kind, x, y, z, s0, s1 (scale over life), life, col, op, yaw, roll, pitch }
function fxAdd(o) { const m = fxMesh(o.kind); m.material.color.set(o.col || '#ffffff'); m.position.set(o.x, o.z, o.y); m.rotation.set(o.roll || 0, -(o.yaw || 0), o.pitch || 0, 'YXZ'); FXM.live.push(Object.assign({ m, t: 0, op: 0.9 }, o)); }
function fxTick(dt) {
  kaijuFxTick(dt);
  for (const m of KTRL) if (m.visible && !(W.t - (m.userData.seen || 0) < 0.1)) m.visible = false; /* (round 36f) a sword trail whose mech is gone */
  for (const f of FXM.live) { f.t += dt; const k = Math.min(1, f.t / f.life), s = lerp(f.s0, f.s1, 1 - (1 - k) * (1 - k)); f.m.scale.set(s, f.sy != null ? f.sy : s, s); f.m.material.opacity = f.op * (1 - k * k); if (k >= 1) { f.m.visible = false; FXM.pool[f.m.userData.kind].push(f.m); f.dead = 1; } }
  if (FXM.live.length) FXM.live = FXM.live.filter(f => !f.dead);
}
// a blow lands (mhit): slash arcs for blades / kicks, shock ring + crack for the ground smashes, sparks on what it hit
function mechHitFx(e, q) {
  if (!q || !inMech(q)) return; const M = mechOf(q), a = q._mA != null && q._mAT > 0 ? q._mA : q.aim, c = q._mcombo || 0, s = (MECH_DIM[M.style] || {}).s || 1;
  if (M.atk === 'chop' || M.atk === 'kick' || (M.atk === 'claw' && !e.g)) { // a bright crescent along the swing, tilted by the move; (round 37) 铁熊's paw swipes too
    const ax = (q.rx != null ? q.rx : q.x), ay = (q.ry != null ? q.ry : q.y), az = (q.zv != null ? q.zv : q.z) + (M.atk === 'kick' ? 0.5 : 1.3) * s, R = M.reach * 0.95;
    const roll = M.atk === 'kick' ? 0.15 : c === 0 ? 0.75 : c === 1 ? 0.12 : 1.45, col = M.atk === 'kick' ? '#ffe680' : '#ffb060';
    fxAdd({ kind: 'arc', x: ax, y: ay, z: az, yaw: a, roll: (q._mpS ? 1 : -1) * roll, s0: R * 0.7, s1: R * 0.95, life: 0.22, col, op: 0.65 });
    fxAdd({ kind: 'arc', x: ax, y: ay, z: az, yaw: a, roll: (q._mpS ? 1 : -1) * roll, s0: R * 0.55, s1: R * 0.8, life: 0.16, col: '#fff4d8', op: 0.35 });
  }
  if (e.g) { // ground smash: a dust shock ring, a scorch / crack on the floor, a little screen kick
    fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.06, s0: 0.3, s1: (e.r || 1) * 1.25, life: 0.35, col: M.glow || '#ffd27a', op: 0.75 });
    fxAdd({ kind: 'disc', x: e.x, y: e.y, z: e.z + 0.05, s0: 0.2, s1: (e.r || 1) * 0.9, life: 0.18, col: '#fff0c0', op: 0.45 });
    if ((e.r || 1) > 1.2) addDecal(e.x, e.y, e.z, (e.r || 1) * 0.45, '#2a2622');
  }
}
// a mech shot leaves the barrel (mrkt): muzzle blast and smoke, brass casings from the cannon, a back-blast from the rocket pods
function mechShotFx(e) {
  const dx = e.e[0] - e.x, dy = e.e[1] - e.y, a = Math.atan2(dy, dx);
  if (e.kd === 'cannon' || e.kd === 'rocket' || e.kd === 'fist') {
    fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z, s0: 0.15, s1: e.kd === 'cannon' ? 0.55 : 0.4, life: 0.1, col: e.kd === 'fist' ? '#9fe8ff' : '#ffd27a', op: 1 });
    for (let k = 0; k < (e.kd === 'cannon' ? 7 : 4); k++) addP({ x: e.x, y: e.y, z: e.z, vx: Math.cos(a) * frnd(1, 3) + frnd(-0.6, 0.6), vy: Math.sin(a) * frnd(1, 3) + frnd(-0.6, 0.6), vz: frnd(0, 0.8), g: -0.4, col: '#8a8478', s: frnd(0.1, 0.18), life: 0.7, smoke: 1 });
  }
  if (e.kd === 'cannon') addP({ x: e.x - Math.cos(a) * 0.6, y: e.y - Math.sin(a) * 0.6, z: e.z, vx: -Math.sin(a) * 2.5, vy: Math.cos(a) * 2.5, vz: 2.2, g: 9, col: '#d8b048', s: 0.07, life: 1.0, floor: e.z - 2.2 }); // an ejected casing
  if (e.kd === 'rocket') for (let k = 0; k < 4; k++) addP({ x: e.x, y: e.y, z: e.z, vx: -Math.cos(a) * frnd(1.5, 3), vy: -Math.sin(a) * frnd(1.5, 3), vz: frnd(0.2, 1), g: -0.2, col: k % 2 ? '#ffb060' : '#a09a90', s: 0.12, life: 0.45, smoke: k % 2 ? 0 : 1 });
  if (e.kd === 'parcel' || e.kd === 'bigparcel') for (let k = 0; k < 3; k++) addP({ x: e.x, y: e.y, z: e.z, vx: frnd(-1, 1), vy: frnd(-1, 1), vz: frnd(0.5, 1.5), g: 3, col: '#e8d9a8', s: 0.05, life: 0.5 });
}
// battle damage: under 35% hull a mech smokes and throws sparks (more as it gets worse); low energy makes its reactor flicker
function mechDamageFx(p, mm, dt) {
  const J = mm.userData.J, M = mechOf(p); if (!M || !J) return; const f = clamp(mhpOf(p) / M.hp, 0, 1), px = p.rx != null ? p.rx : p.x, py = p.ry != null ? p.ry : p.y, pz = (p.zv != null ? p.zv : p.z), s = (MECH_DIM[M.style] || {}).s || 1;
  if (f < 0.35) { const w = 1 - f / 0.35; if (FXR() < dt * (4 + 14 * w)) addP({ x: px + frnd(-0.3, 0.3), y: py + frnd(-0.3, 0.3), z: pz + frnd(1.4, 2.4) * s, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: frnd(0.6, 1.2), g: -0.3, col: w > 0.6 ? '#2a2a2a' : '#5a5650', s: frnd(0.12, 0.22), life: 1.1, smoke: 1 });
    if (FXR() < dt * (1 + 6 * w)) for (let k = 0; k < 4; k++) addP({ x: px + frnd(-0.35, 0.35), y: py + frnd(-0.35, 0.35), z: pz + frnd(0.8, 2.2) * s, vx: frnd(-2.5, 2.5), vy: frnd(-2.5, 2.5), vz: frnd(0.5, 3), g: 9, col: k % 2 ? '#ffe080' : '#ff9a3a', s: 0.04, life: 0.45, floor: pz }); }
  const low = (p.bat || 0) < BAL.mechLow; if (J.core) J.core.visible = !low || (W.t * 7 % 1) > 0.35;
}

/* ================= (round 36l) kaiju / elite fight feedback: telegraphs, boulders, spikes, the 破绽 (opening) label ================= */
const KXP = new Map(), ROCKS = [], SPIKES = [];
const kNow = () => performance.now() / 1000;
function kaijuFx(e) {
  if (e.k === 'ktell') { // red warning on the ground: a disc that fills in, or a strip of discs along a line
    const t = e.t || 1, col = '#ff3b2b';
    if (e.s === 'disc') { fxAdd({ kind: 'disc', x: e.x, y: e.y, z: e.z + 0.06, s0: e.r * 0.15, s1: e.r, life: t, col, op: 0.32 }); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.07, s0: e.r, s1: e.r, life: t, col, op: 0.7 }); }
    else { const L = Math.hypot(e.x2 - e.x, e.y2 - e.y), n = Math.max(2, Math.ceil(L / 0.8)); for (let k = 1; k <= n; k++) { const f = k / n, x = e.x + (e.x2 - e.x) * f, y = e.y + (e.y2 - e.y) * f, zz = surfZ(x, y, Math.max(0, Math.round(e.z / FH))); fxAdd({ kind: 'disc', x, y, z: zz + 0.06, s0: e.w * 0.25, s1: e.w * 0.55, life: t, col, op: 0.3 }); } }
    return;
  }
  if (e.k === 'krock') { // a boulder in a high arc
    let m = (ROCKS.pool || (ROCKS.pool = [])).pop(); if (!m) { m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), new THREE.MeshLambertMaterial({ color: '#6e6258', flatShading: true })); SCN.add(m); }
    m.visible = true; ROCKS.push({ m, x: e.x, y: e.y, z: e.z, x2: e.x2, y2: e.y2, z2: e.z2, t: 0, T: e.t || 0.9 }); return;
  }
  if (e.k === 'kspike') { // a spike bursts up and sinks back
    let m = (SPIKES.pool || (SPIKES.pool = [])).pop(); if (!m) { m = new THREE.Group(); const mat = new THREE.MeshLambertMaterial({ color: '#7a5a3a', flatShading: true }); for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22 - k * 0.04, 1.4 - k * 0.3, 5), mat); c.position.set((k - 1) * 0.22, (1.4 - k * 0.3) / 2, (k % 2 ? 0.15 : -0.12)); c.rotation.z = (k - 1) * 0.25; m.add(c); } SCN.add(m); }
    m.visible = true; m.position.set(e.x, e.z, e.y); m.rotation.y = Math.random() * 6; SPIKES.push({ m, t: 0 }); for (let k = 0; k < 4; k++) addP({ x: e.x, y: e.y, z: e.z + 0.2, vx: frnd(-2, 2), vy: frnd(-2, 2), vz: frnd(2, 4), col: '#6a5040', s: 0.08, life: 0.5 }); sfx('bash', e.x, e.y); return;
  }
  if (e.k === 'kroar') { fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z - 2, s0: 1, s1: 7, life: 0.7, col: '#ff5a3a', op: 0.8 }); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z - 2, s0: 0.5, s1: 5, life: 0.5, col: '#ffd0a0', op: 0.6 }); RND.floats.push({ x: e.x, y: e.y, z: e.z + 0.6, text: '暴怒！', col: '#ff6a4a', t: 0 }); return; }
  if (e.k === 'kxp') { // an opening: a flash, sparks, and a label that stays while it lasts
    KXP.set(e.id, kNow() + (e.t || 1)); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z - 0.2, s0: 0.4, s1: 2.2, life: 0.4, col: '#ffe14a', op: 0.9 });
    for (let k = 0; k < 10; k++) addP({ x: e.x, y: e.y, z: e.z, vx: frnd(-3, 3), vy: frnd(-3, 3), vz: frnd(1, 4), col: k % 2 ? '#ffe14a' : '#ffffff', s: 0.06, life: 0.5 });
    RND.floats.push({ x: e.x, y: e.y, z: e.z + 0.3, text: e.w === 'break' ? '打断！' : e.w === 'wall' ? '撞晕了！' : e.w === 'parry' ? '反击！' : '破绽！', col: '#ffe14a', t: 0 }); sfx('clink', e.x, e.y); return;
  }
}
function kaijuFxTick(dt) {
  for (let k = ROCKS.length - 1; k >= 0; k--) { const r = ROCKS[k]; r.t += dt; const f = Math.min(1, r.t / r.T); r.m.position.set(lerp(r.x, r.x2, f), lerp(r.z, r.z2, f) + Math.sin(f * Math.PI) * 4.5, lerp(r.y, r.y2, f)); r.m.rotation.x += dt * 7; r.m.rotation.z += dt * 5; if (f >= 1) { r.m.visible = false; ROCKS.pool.push(r.m); ROCKS.splice(k, 1); } }
  for (let k = SPIKES.length - 1; k >= 0; k--) { const s = SPIKES[k]; s.t += dt; const f = s.t < 0.12 ? s.t / 0.12 : s.t < 0.6 ? 1 : Math.max(0, 1 - (s.t - 0.6) / 0.35); s.m.scale.set(1, Math.max(0.01, f), 1); if (s.t > 0.95) { s.m.visible = false; SPIKES.pool.push(s.m); SPIKES.splice(k, 1); } }
}
// overlay: a pulsing 「破绽 ×2」 over anything that is open right now
function kxpLabels() {
  let h = ''; const now = kNow();
  for (const [id, until] of KXP) { if (now > until) { KXP.delete(id); continue; } const z = W.zs.find(q => q.id === id); if (!z || z.hp <= 0) continue; const T = ZT[z.k]; const [sx, sy, sz] = w2s(z.x, z.y, z.z + T.h * (T.sc || 1) / 1.1 + 0.9); if (sz > 1) continue;
    h += `<div class="kxp" style="left:${sx | 0}px;top:${sy | 0}px">破绽 伤害×2 <b>${(until - now).toFixed(1)}</b></div>`; }
  return h;
}

/* ---------- (round 36n) 疾风's 浮游炮: ten little gun pods orbit their owner and spray tracers ---------- */
const DRN = new Map(); // owner → { end, ms: [mesh…], aim: [angle…], fl: [flash time…] }
function droneMesh() {
  const g = new THREE.Group(), M = (c, e) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.4, emissive: e || '#000', emissiveIntensity: e ? 1 : 0 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), M('#3fb8b0')); body.scale.set(1.2, 0.7, 1.2); g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 20), M('#5a6068')); ring.rotation.x = Math.PI / 2; g.add(ring);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M('#7fe8ff', '#7fe8ff')); eye.position.set(0.13, 0.03, 0); g.add(eye);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.3, 8), M('#2a2e34')); bar.rotation.z = -Math.PI / 2; bar.position.set(0.24, -0.04, 0); g.add(bar);
  const rot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.04), M('#f2c230')); rot.position.y = 0.13; g.add(rot); g.userData.rot = rot;
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd070', transparent: true, opacity: 0.9 })); fl.position.set(0.42, -0.04, 0); fl.visible = false; g.add(fl); g.userData.fl = fl;
  SCN.add(g); return g;
}
function droneEvent(e) { let D = DRN.get(e.o); if (!e.t) { if (D) D.end = W.t; return; } if (!D) { D = { ms: [], aim: [], fl: [] }; DRN.set(e.o, D); } D.end = W.t + e.t; D.t0 = W.t;
  const q = W.p[e.o]; if (q) for (let k = 0; k < BAL.droneN; k++) { const P = dronePos(q, k, W.t); for (let j = 0; j < 5; j++) addP({ x: P.x, y: P.y, z: P.z, vx: frnd(-1, 1), vy: frnd(-1, 1), vz: frnd(0, 1), col: '#7fe8ff', s: 0.06, life: 0.4 }); } }
function droneShots(e) { const D = DRN.get(e.o), q = W.p[e.o]; if (!D || !q) return; const s = e.s;
  for (let i = 0; i + 3 < s.length; i += 4) { const k = s[i], P = dronePos(q, k, W.t); RND.tracers.push({ x: P.x, y: P.y, z: P.z, x2: s[i + 1], y2: s[i + 2], z2: s[i + 3], t: 0, life: 0.06, w: 0.018, col: [0.55, 0.95, 1] }); D.aim[k] = Math.atan2(s[i + 2] - P.y, s[i + 1] - P.x); D.fl[k] = W.t; }
  if (thr('drn', 0.12)) sfx('gyro', q.x, q.y); }
function drawDrones(dt) {
  for (const [o, D] of DRN) { const q = W.p[o], on = q && W.t < D.end + 0.4;
    if (!on) { for (const m of D.ms) { SCN.remove(m); m.traverse(c => { if (c.geometry) c.geometry.dispose(); }); } DRN.delete(o); continue; }
    const fade = clamp(Math.min((W.t - D.t0) / 0.4, (D.end + 0.4 - W.t) / 0.4), 0, 1);
    for (let k = 0; k < BAL.droneN; k++) { const m = D.ms[k] || (D.ms[k] = droneMesh()); const P = dronePos(q, k, W.t); m.position.set(P.x, P.z - (1 - fade) * 1.2, P.y); m.scale.setScalar(0.3 + 0.7 * fade);
      const a = D.aim[k] != null && W.t - D.fl[k] < 0.6 ? D.aim[k] : (q._ly != null ? q._ly : q.aim); m.rotation.y = -a; m.userData.rot.rotation.y += dt * 40; m.userData.fl.visible = W.t - (D.fl[k] || -9) < 0.05; }
  }
}
// (round 36n) 铁卫 掀地: a ring of heaved-up earth racing out to the edge, slabs and dust thrown up
function quakeFx(e) { const R = e.r || 7;
  fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.08, s0: 0.8, s1: R, life: 0.55, col: '#c8a878', op: 0.85 }); fxAdd({ kind: 'disc', x: e.x, y: e.y, z: e.z + 0.05, s0: 1, s1: R * 0.9, life: 0.7, col: '#a08060', op: 0.35 });
  for (let k = 0; k < 60; k++) { const a = rand() * Math.PI * 2, r = 1 + rand() * (R - 1); addP({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, z: e.z + 0.1, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, vz: 3 + rand() * 4, g: -9, col: rand() < 0.5 ? '#7a6a52' : '#a08c6c', s: 0.12 + rand() * 0.12, life: 0.9 }); }
  for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; addP({ x: e.x + Math.cos(a) * R * 0.9, y: e.y + Math.sin(a) * R * 0.9, z: e.z + 0.1, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: 0.6, g: -0.3, col: '#a89878', s: 0.18, life: 0.8, smoke: 1 }); }
  if (typeof addDecal === 'function') addDecal(e.x, e.y, e.z + 0.02, R * 0.7, '#2a2016', 0.35); }
