/* ================= characters: survivors (jointed meshes + IK arms) and zombies (instanced rigs) =================
   Zombies follow the horror-house monster rules: organic tapered bodies, multi-joint limbs, long fingers,
   asymmetric poses, tilted / crooked heads, torn rags and hair strands, eyes that glow in the dark, the odd twitch.
   Every type has its own silhouette. Model frame: facing +x, y up, z to the side (L = -z, R = +z). */

/* ---------- shared helpers ---------- */
const _e = new THREE.Euler(), _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _sm = new THREE.Matrix4();
function J(out, par, x, y, z, rx, ry, rz) { _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _m.makeRotationFromEuler(_e); _m.setPosition(x, y, z); return out.multiplyMatrices(par, _m); }
// jitter vertices by position (so split faces stay welded) for a hand-made, uneven look
function jitterG(g, amt, seed) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.round(x * 97) * 7 + Math.round(y * 89) * 13 + Math.round(z * 83) * 29 + seed; p.setXYZ(i, x + (hash2(k, 1) - 0.5) * amt, y + (hash2(k, 2) - 0.5) * amt, z + (hash2(k, 3) - 0.5) * amt); }
  g.computeVertexNormals(); return g;
}
const limbGeo = (rt, rb, seg) => new THREE.CylinderGeometry(rt, rb, 1, seg || 6).translate(0, -0.5, 0); // origin at the top joint, hangs down 1
const angLerp = (a, b, k) => a + angDiff(a, b) * k;
const ni = g => g.index ? g.toNonIndexed() : g;
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

/* ================= zombies ================= */
const ZPOOL = {}, ZCAP = 420;
function charScene() {
  const G = {};
  G.limb = limbGeo(1, 0.72, 6);
  G.torso = jitterG(new THREE.CylinderGeometry(0.17, 0.115, 0.44, 7, 2).translate(0, 0.22, 0).scale(0.74, 1, 1), 0.03, 5);
  G.head = jitterG(new THREE.IcosahedronGeometry(0.11, 1).scale(1.02, 1.14, 0.92).translate(0.01, 0.11, 0), 0.025, 9);
  G.jaw = boxG(0.09, 0.035, 0.1, 0.055, -0.015, 0);
  // claw: palm and four long thin fingers fanned out, plus a thumb
  const cl = [boxG(0.05, 0.06, 0.075, 0, -0.03, 0)];
  for (let k = 0; k < 4; k++) cl.push(new THREE.ConeGeometry(0.011, 0.11, 4).translate(0, -0.055, 0).rotateZ(0.25 + k * 0.05).rotateX((k - 1.5) * 0.18).translate(0.005, -0.055, (k - 1.5) * 0.017));
  cl.push(new THREE.ConeGeometry(0.01, 0.06, 4).translate(0, -0.03, 0).rotateZ(0.9).translate(0.02, -0.03, 0.03));
  G.claw = merge(cl);
  G.foot = boxG(0.13, 0.045, 0.075, 0.035, -0.022, 0);
  // torn rags hanging under the waist (strips of different length)
  const rg = []; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, len = 0.07 + hash2(k, 31) * 0.12; rg.push(boxG(0.012, len, 0.05, 0, -len / 2, 0).rotateY(-a).translate(Math.cos(a) * 0.09, 0.02, Math.sin(a) * 0.115)); }
  G.rag = merge(rg);
  // long hair: strands from the crown down the back and sides
  const hr = [jitterG(new THREE.IcosahedronGeometry(0.118, 1).scale(1, 0.75, 0.98).translate(-0.01, 0.15, 0), 0.02, 3)];
  for (let k = 0; k < 11; k++) { const a = Math.PI * 0.55 + k / 10 * Math.PI * 0.9, len = 0.22 + hash2(k, 77) * 0.22; hr.push(boxG(0.022, len, 0.028, 0, -len / 2, 0).rotateZ((hash2(k, 5) - 0.5) * 0.2).translate(Math.cos(a) * 0.1, 0.19, Math.sin(a) * 0.1)); }
  G.hair = merge(hr.map(ni));
  G.eye = merge([new THREE.IcosahedronGeometry(0.019, 0).translate(0.1, 0.125, -0.038), new THREE.IcosahedronGeometry(0.014, 0).translate(0.1, 0.13, 0.04)]);
  G.glow = merge([new THREE.IcosahedronGeometry(0.065, 1).translate(0.1, 0.125, -0.038), new THREE.IcosahedronGeometry(0.055, 1).translate(0.1, 0.13, 0.04)]);
  G.belly = jitterG(new THREE.IcosahedronGeometry(0.17, 1).scale(1.1, 0.95, 1.1), 0.04, 21);
  const pu = []; for (let k = 0; k < 9; k++) { const a = hash2(k, 3) * 6.28, b = (hash2(k, 4) - 0.3) * 1.4, r = 0.17; pu.push(new THREE.IcosahedronGeometry(0.022 + hash2(k, 9) * 0.02, 0).translate(Math.cos(a) * Math.cos(b) * r * 1.1, Math.sin(b) * r * 0.95, Math.sin(a) * Math.cos(b) * r * 1.1)); }
  G.pust = merge(pu);
  G.fist = jitterG(merge([new THREE.IcosahedronGeometry(0.12, 0).translate(0, -0.1, 0), new THREE.ConeGeometry(0.025, 0.09, 4).rotateZ(-Math.PI / 2).translate(0.13, -0.08, 0.04), new THREE.ConeGeometry(0.025, 0.09, 4).rotateZ(-Math.PI / 2).translate(0.13, -0.12, -0.04)].map(ni)), 0.02, 13);
  const sp = []; for (let k = 0; k < 5; k++) sp.push(new THREE.ConeGeometry(0.03 - k * 0.003, 0.14 + hash2(k, 8) * 0.1, 4).rotateZ(0.9 + hash2(k, 2) * 0.3).translate(-0.12, 0.1 + k * 0.075, (hash2(k, 6) - 0.5) * 0.08));
  G.spikes = merge(sp);
  // riot helmet (dome + visor) and riot shield with a window
  G.helmet = merge([new THREE.SphereGeometry(0.135, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.14, 0), boxG(0.03, 0.09, 0.22, 0.12, 0.12, 0), boxG(0.2, 0.025, 0.25, 0.01, 0.14, 0)].map(ni));
  G.shield = merge([boxG(0.035, 0.55, 0.36, 0, -0.12, 0), boxG(0.045, 0.12, 0.22, 0.004, 0.06, 0), boxG(0.05, 0.03, 0.38, 0, -0.39, 0)]);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  const def = (k, geo, mat, cap, sh = true) => { const m = inst(geo, mat, cap, sh); ZPOOL[k] = { m, n: 0, cap }; };
  def('limb', G.limb, lam('#ffffff'), ZCAP * 10);
  def('torso', G.torso, lam('#ffffff'), ZCAP); def('head', G.head, lam('#ffffff'), ZCAP + 40); def('jaw', G.jaw, lam('#ffffff'), ZCAP);
  def('claw', G.claw, lam('#ffffff'), ZCAP * 2); def('foot', G.foot, lam('#ffffff'), ZCAP * 2); def('rag', G.rag, lam('#ffffff'), ZCAP);
  def('hair', G.hair, lam('#ffffff'), ZCAP); def('eye', G.eye, eyeMat, ZCAP + 40, false); def('glow', G.glow, glowMat, ZCAP + 40, false);
  def('belly', G.belly, lam('#ffffff'), 120); def('pust', G.pust, new THREE.MeshBasicMaterial({ color: '#ffffff' }), 120, false);
  def('fist', G.fist, lam('#ffffff'), 120); def('spikes', G.spikes, lam('#ffffff'), 120);
  def('helmet', G.helmet, lam('#ffffff'), 160); def('shield', G.shield, lam('#ffffff'), 160);
  // survivors' shared geometry
  PGEO.limb = limbGeo(1, 0.8, 7);
  // thick additive tracers + blood decals on the floor
  OBJ.tracerI = inst(boxG(1, 1, 1, 0.5, 0, 0), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 140, false);
  OBJ.decal = inst(new THREE.CircleGeometry(1, 9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), 220, false);
  OBJ.decal.receiveShadow = false;
}
function zput(k, M, sx, sy, sz, col) { const q = ZPOOL[k]; if (q.n >= q.cap) return; _sm.makeScale(sx, sy, sz); _m2.multiplyMatrices(M, _sm); q.m.setMatrixAt(q.n, _m2); if (col) q.m.setColorAt(q.n, tmpC.set(col)); q.n++; }
const ZSHIRT = ['#3c4652', '#4f3e33', '#34402f', '#5a4a3a', '#3e3446', '#46503f', '#5a3434', '#2f3a44', '#6a5a48', '#2c2c30'];
const ZSKIN = ['#93a383', '#82967a', '#a0aa8e', '#8a9a80', '#b4b8a4'];
const ZEYE = { walker: '#ffd36a', runner: '#ff9a3a', climber: '#d6f0ff', spitter: '#b6ff4a', brute: '#ff6a3a', boss: '#ff2a2a', dog: '#ff3a2a', crawler: '#ffd36a', bloater: '#c8ff4a', screamer: '#ff6ad0', armored: '#9ad8ff' };
// per-type body plan: proportions + posture. Walkers get variants from their seed.
const ZBODY = {
  walker: { tw: 1, th: 1, hs: 1, ua: 0.2, fa: 0.2, tl: 0.22, sl: 0.22, sw: 0.15, hunch: 0.32 },
  runner: { tw: 0.82, th: 1.02, hs: 0.95, ua: 0.22, fa: 0.22, tl: 0.25, sl: 0.25, sw: 0.14, hunch: 0.7 },
  climber: { tw: 0.8, th: 0.92, hs: 0.95, ua: 0.3, fa: 0.33, tl: 0.21, sl: 0.24, sw: 0.14, hunch: 1.3 },
  spitter: { tw: 1.15, th: 0.95, hs: 1.05, ua: 0.18, fa: 0.18, tl: 0.2, sl: 0.2, sw: 0.17, hunch: 0.15 },
  brute: { tw: 1.65, th: 1.05, hs: 0.72, ua: 0.22, fa: 0.22, tl: 0.22, sl: 0.2, sw: 0.25, hunch: 0.28 },
  boss: { tw: 1.45, th: 1.05, hs: 0.95, ua: 0.27, fa: 0.33, tl: 0.21, sl: 0.2, sw: 0.24, hunch: 0.38 },
  crawler: { tw: 0.95, th: 0.9, hs: 1, ua: 0.22, fa: 0.24, tl: 0.09, sl: 0.06, sw: 0.15, hunch: 1.42 },
  bloater: { tw: 1.75, th: 1.0, hs: 0.85, ua: 0.17, fa: 0.17, tl: 0.21, sl: 0.19, sw: 0.2, hunch: 0.08 },
  screamer: { tw: 0.76, th: 1.05, hs: 0.95, ua: 0.26, fa: 0.27, tl: 0.24, sl: 0.24, sw: 0.13, hunch: 0.12 },
  armored: { tw: 1.15, th: 1.0, hs: 1, ua: 0.2, fa: 0.2, tl: 0.22, sl: 0.22, sw: 0.17, hunch: 0.18 },
};
const ZM = []; for (let k = 0; k < 16; k++) ZM.push(new THREE.Matrix4());
function drawZombies(vl, dt) {
  for (const k in ZPOOL) ZPOOL[k].n = 0;
  const list = W.zs.concat(RND.corpses), dk = darkness();
  ZPOOL.glow.m.material.opacity = 0.1 + dk * 0.9;
  let drawn = 0; const CR = cullR() + 2;
  for (const z of list) {
    if (drawn >= ZCAP - 2) break;
    if (Math.abs(z.x - CAM.tx) > CR || Math.abs(z.y - CAM.ty) > CR) continue; // off screen (the town's sleeping crowds are mostly far away)
    const corpse = !!z.corpse, L = z.L != null ? z.L : Math.floor((z.z + 0.1) / FH);
    if (z.hidden && !corpse) continue;
    if (L > vl || lcHide(Math.floor(z.x), Math.floor(z.y), L)) continue;
    drawn++;
    if (ZT[z.k] && ZT[z.k].kaiju) { drawKaiju(z, corpse, dt); continue; } // (round 34)
    rigZombie(z, corpse, dt, dk);
  }
  kaijuSweep();
  for (const k in ZPOOL) { const q = ZPOOL[k]; q.m.count = q.n; q.m.instanceMatrix.needsUpdate = true; if (q.m.instanceColor) q.m.instanceColor.needsUpdate = true; }
}
function rigZombie(z, corpse, dt, dk) {
  const zk = ZT[z.k].look || z.k;
  if ((z.burn > 0 || z.burnF) && !corpse && Math.random() < dt * 22) addP({ x: z.x + frnd(-0.2, 0.2), y: z.y + frnd(-0.2, 0.2), z: z.z + frnd(0.2, ZT[z.k].h), vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: frnd(0.8, 1.6), g: -0.5, col: Math.random() < 0.5 ? '#ffb030' : '#ff6a1a', s: frnd(0.06, 0.12), life: 0.45 });
  if (zk === 'dog') return rigDog(z, corpse, dt);
  const T = ZT[z.k], Bd = ZBODY[zk] || ZBODY.walker, s = T.sc, sd = z.seed || 0, v = zk === 'walker' ? sd % 5 : 0;
  // render-side smoothing: facing, speed and gait phase (works the same for host and guest)
  if (!corpse) {
    if (z._f == null) { z._f = z.face || 0; z._px = z.x; z._py = z.y; z._spd = 0; z._ph = (sd % 100) * 0.1; }
    const sp = dt > 0 ? Math.min(6, Math.hypot(z.x - z._px, z.y - z._py) / dt) : 0; z._px = z.x; z._py = z.y;
    z._spd = lerp(z._spd, sp, Math.min(1, dt * 8)); z._f = angLerp(z._f, z.face || 0, Math.min(1, dt * 9));
    z._ph += dt * (1.2 + z._spd * (zk === 'runner' ? 3.2 : zk === 'climber' ? 4.2 : 3.6) / s);
  }
  const hit = !corpse && z.hitT > 0, white = c => hit ? '#ffd8cc' : c;
  const skin = white(ZT[z.k].skin ? ZT[z.k].skin : zk === 'bloater' ? '#9aa86a' : zk === 'screamer' ? '#b8b0b4' : zk === 'crawler' ? '#8a9480' : zk === 'climber' ? '#7d8e98' : zk === 'spitter' ? '#93a64e' : zk === 'brute' ? '#7a6d62' : zk === 'boss' ? '#6e534c' : v === 1 ? '#c2c4b2' : ZSKIN[sd % 5]);
  const shirt = white(v === 1 ? ['#6b1414', '#3a3a52', '#d8d0bc'][sd % 3] : ZSHIRT[sd % 10]), pants = white(zk === 'brute' || zk === 'boss' ? '#2a2420' : '#26292b'), shoe = '#1b1a18';
  const rag = white(v === 1 ? ['#4a0808', '#24243a', '#a8a090'][sd % 3] : tmpC.set(ZSHIRT[sd % 10]).multiplyScalar(0.7).getStyle());
  const amp = corpse ? 0 : clamp(z._spd / Math.max(0.6, T.spd * 0.8), 0, 1.15), ph = corpse ? 0 : z._ph, t = W.t;
  const atk = !corpse && z.atk > 0, aph = atk ? (t * 3.2 + sd * 0.37) % 1 : 0, swing = atk ? (aph < 0.62 ? -ease(aph / 0.62) : -1 + ease((aph - 0.62) / 0.2) * 1.6) : 0; // raise, then slam
  const climbing = !corpse && !!z.climbing, quad = zk === 'climber' && !climbing, crawl = zk === 'crawler', scream = !corpse && z.scr > 0;
  const twitch = !corpse && hash2(Math.floor(t * 3) + sd, 7) > 0.93 ? (hash2(Math.floor(t * 3), sd) - 0.5) * 1.3 : 0;
  const flinch = hit ? 0.35 : 0;
  // --- legs: thigh swing + knee bend; left/right can differ (limp) ---
  const limp = zk === 'walker' && (v === 0 || v === 3), big = zk === 'brute' || zk === 'boss';
  let thA = (zk === 'runner' ? 0.85 : big ? 0.38 : quad ? 0.5 : 0.48) * amp, kn = (zk === 'runner' ? 1.25 : quad ? 0.6 : 0.75) * amp;
  let aL = Math.sin(ph) * thA, aR = -Math.sin(ph) * thA * (limp ? 0.45 : 1);
  let kL = 0.12 + Math.max(0, Math.cos(ph)) * kn, kR = limp ? 0.08 : 0.12 + Math.max(0, -Math.cos(ph)) * kn;
  if (quad) { aL += 0.85; aR += 0.85; kL += 1.25; kR += 1.25; }
  if (crawl) { aL = 1.3 + Math.sin(ph) * 0.15; aR = 1.4; kL = kR = 0; }
  if (zk === 'spitter') { aL *= 0.8; aR *= 0.8; }
  const asleep = !corpse && !!(z.sleep || z.sleepF); // 尸城求生 sleepers: slumped on their haunches, head down
  if (asleep && !crawl && !quad) { aL = aR = 1.45; kL = kR = 2.55; }
  // corpse fall styles
  let fall = 0, fstyle = sd % 3, knees = 0;
  if (corpse) {
    const ft = z.t;
    if (fstyle === 2) { knees = ease(ft / 0.3); fall = ease((ft - 0.25) / 0.45); }
    else fall = ease(ft / 0.5);
    aL = aR = knees * 1.2; kL = kR = knees * 2.2 + fall * 0.3;
  }
  const TL = Bd.tl, SL = Bd.sl, legH = l => TL * Math.cos(l[0]) + SL * Math.cos(l[0] - l[1]);
  let hipY = crawl ? 0.13 : Math.max(legH([aL, kL]), legH([aR, kR]));
  // --- root ---
  const R0 = ZM[0];
  tmpQ.setFromAxisAngle(UPV, -(corpse ? z.face || 0 : z._f)); tmpV.set(z.x, z.z, z.y); tmpS.set(s, s, s); R0.compose(tmpV, tmpQ, tmpS);
  if (corpse) {
    const dir = fstyle === 1 || fstyle === 2 ? -1 : 1, sink = Math.max(0, z.t - 6) * 0.12;
    J(R0, R0, 0, 0.06 * fall - sink, 0, fstyle === 2 ? 0.25 * fall : 0, 0, dir * fall * Math.PI / 2 * 0.94);
  }
  // body roll / bob
  const roll = crawl ? Math.sin(ph) * 0.12 * amp : (limp ? Math.sin(ph) * 0.13 : zk === 'spitter' ? Math.sin(ph) * 0.15 : big ? Math.sin(ph) * 0.07 : Math.sin(ph) * 0.04) * amp;
  const hunch = (climbing ? -0.15 : Bd.hunch + (zk === 'runner' ? 0.1 * amp : 0)) - flinch + (corpse ? knees * 0.4 : 0) + (asleep ? 0.55 : Math.sin(t * 1.3 + sd) * 0.03);
  const pelv = J(ZM[1], R0, 0, hipY, 0, roll, Math.sin(ph) * 0.08 * amp, 0);
  // legs
  for (const sg of [-1, 1]) {
    const a = sg < 0 ? aL : aR, k = sg < 0 ? kL : kR;
    const hip = J(ZM[2], pelv, 0, 0, sg * 0.08 * Bd.tw * (zk === 'spitter' ? 1.3 : 1), (quad ? -0.25 : 0.04) * sg, 0, a);
    zput('limb', hip, 0.05 * (big ? 1.45 : 1), TL, 0.05 * (big ? 1.45 : 1), pants);
    const knee = J(ZM[3], hip, 0, -TL, 0, 0, 0, -k);
    zput('limb', knee, 0.04 * (big ? 1.4 : 1), SL, 0.04 * (big ? 1.4 : 1), sg > 0 && limp ? skin : pants);
    const foot = J(ZM[4], knee, 0, -SL, 0, 0, 0, k - a);
    if (!crawl) zput('foot', foot, big ? 1.4 : 1, 1, big ? 1.4 : 1, shoe);
  }
  // torso
  const tor = J(ZM[5], pelv, 0, 0, 0, 0, Math.sin(ph) * -0.12 * amp, -hunch);
  zput('torso', tor, Bd.tw, Bd.th, Bd.tw, shirt);
  zput('rag', J(ZM[6], tor, 0, 0.02, 0, Math.sin(ph * 2) * 0.08, 0, -Math.sin(ph) * 0.15 * amp), Bd.tw, v === 1 ? 2.2 : 1, Bd.tw, rag);
  if (zk === 'spitter' || zk === 'bloater') { const bl = zk === 'bloater', sw = (bl ? 1.75 : 1) * (1 + Math.sin(t * (bl ? 5 : 3) + sd) * (bl ? 0.06 : 0.04)); zput('belly', J(ZM[7], tor, bl ? 0.1 : 0.07, bl ? 0.2 : 0.17, 0, 0, 0, 0), sw, sw * (bl ? 0.95 : 1), sw, skin); zput('pust', ZM[7], sw, sw, sw, bl ? '#ffb84a' : '#c8ff4a'); }
  if (zk === 'armored') zput('torso', J(ZM[6], tor, 0, 0.06, 0, 0, 0, 0), Bd.tw * 1.12, Bd.th * 0.82, Bd.tw * 1.12, white('#1f2a3a'));
  if (big) zput('spikes', tor, Bd.tw, Bd.th, Bd.tw, '#d8ccb4');
  // head: tilted, drooped, twitching; climbers have the neck wrung sideways and look up
  const TH = 0.44 * Bd.th, spitWind = zk === 'spitter' && z.spitT != null && z.spitT < 0.55 ? ease(1 - z.spitT / 0.55) : 0;
  let hRoll = 0.12, hPitch = 0.25, hYaw = 0, jaw = 0.12;
  if (zk === 'walker') { hRoll = [0.4, 0.15, 0.25, 0.85, -0.3][v]; hPitch = [0.35, 0.5, 0.25, 0.2, 0.15][v]; jaw = v === 4 ? 0.7 : 0.15; }
  else if (zk === 'runner') { hRoll = -0.15; hPitch = -0.45; jaw = 0.55 + Math.sin(t * 9 + sd) * 0.15; }
  else if (zk === 'climber') { hRoll = 1.15; hPitch = quad ? -1.05 : 0.2; jaw = 0.3; }
  else if (zk === 'spitter') { hRoll = 0.1; hPitch = 0.15 - spitWind * 1.0; jaw = 0.2 + spitWind * 0.8; }
  else if (big) { hRoll = 0.2; hPitch = -0.15 + (zk === 'boss' ? 0.25 : 0); jaw = 0.35; }
  else if (crawl) { hRoll = 0.3; hPitch = -1.25; jaw = 0.45; }
  else if (zk === 'screamer') { hRoll = 0.2; hPitch = scream ? -1.0 : 0.1; jaw = scream ? 1.05 : 0.8; }
  else if (zk === 'bloater') { hRoll = 0.15; hPitch = 0.2; jaw = 0.3; }
  else if (zk === 'armored') { hRoll = 0.05; hPitch = 0.1; jaw = 0.1; }
  hPitch += hunch * 0.4 - flinch * 1.5; // look ahead despite the hunch
  if (asleep) { hPitch += 0.75; jaw = 0.05; }
  const head = J(ZM[8], tor, 0.03 * Bd.tw, TH * (big && zk === 'brute' ? 0.82 : 0.97) + (zk === 'screamer' ? 0.1 : 0), 0, hRoll + twitch, hYaw + twitch * 0.6 + Math.sin(t * 0.7 + sd) * 0.15, -hPitch);
  const hs = Bd.hs;
  zput('head', head, hs, hs, hs, skin);
  zput('jaw', J(ZM[9], head, 0.02 * hs, 0.05 * hs, 0, 0, 0, -jaw), hs, hs, hs, skin);
  const ec = z.rage > 0 || z.rageF ? '#ff2a1a' : ZEYE[z.k] || '#ffd36a';
  if (zk === 'screamer') zput('limb', J(ZM[11], tor, 0.03, TH * 0.97 + 0.12, 0, 0, 0, Math.PI - hPitch * 0.5), 0.035, 0.13, 0.035, skin); // the long neck
  if (zk === 'armored') zput('helmet', head, hs, hs, hs, white('#2a3442'));
  if (zk === 'armored' && !corpse) zput('shield', J(ZM[15], tor, 0.24, TH * 0.62, -0.08, 0, 0.15, hunch - flinch), 1, 1, 1, white('#3a4656')); // riot shield held upright in front
  if (!corpse) { zput('eye', head, hs, hs, hs, ec); zput('glow', head, hs, hs, hs, ec); }
  if (v === 1 || zk === 'boss') zput('hair', J(ZM[10], head, 0, 0, 0, 0, 0, 0), hs, hs * (zk === 'boss' ? 1.4 : 1), hs, zk === 'boss' ? '#120c0a' : '#151010');
  if (zk === 'boss') { // the second face on the back of the head
    const h2 = J(ZM[11], head, -0.02, 0.0, 0, 0.5, Math.PI, 0.25);
    zput('head', h2, hs * 0.9, hs * 0.9, hs * 0.9, '#cfc6bc'); if (!corpse) { zput('eye', h2, hs * 0.9, hs * 0.9, hs * 0.9, '#ff2a2a'); zput('glow', h2, hs * 0.9, hs * 0.9, hs * 0.9, '#ff2a2a'); }
  }
  // arms: every type poses them differently, always asymmetric
  for (const sg of [-1, 1]) {
    if (zk === 'walker' && v === 2 && sg > 0) continue; // one-armed
    let ap = 0.1, ar = 0.12, el = 0.25, uaL = Bd.ua, faL = Bd.fa, hand = 'claw', hsz = 1, sleeve = shirt;
    const sw = Math.sin(ph + (sg > 0 ? Math.PI : 0));
    if (zk === 'walker') {
      if (sg < 0) { ap = 1.25 + Math.sin(t * 1.1 + sd) * 0.1; el = 0.35; } // the reaching arm
      else { ap = (v === 3 ? 1.1 : 0.12) + sw * 0.18 * amp; ar = 0.22; el = 0.15; faL *= 1.35; } // the one hanging to the knee
      if (atk) { ap = 1.6 + swing * 1.1; el = 0.2; }
    } else if (zk === 'runner') {
      ap = -0.7 + sw * 0.8 * amp; el = 0.9; ar = 0.18;
      if (atk) { ap = 1.4 + swing; el = 0.3; }
    } else if (zk === 'climber') {
      if (climbing) { ap = Math.PI - 0.35 + Math.sin(t * 9 + (sg > 0 ? 3 : 0)) * 0.45; el = 0.5; ar = 0.25; }
      else { ap = 1.25 + sw * 0.55 * Math.max(0.3, amp) + (atk ? swing * 0.6 : 0); el = -0.5; ar = 0.65; }
    } else if (zk === 'spitter') {
      ap = 0.25 + sw * 0.25 * amp; ar = 0.55; el = 0.6; if (spitWind) { ap = 0.6; ar = 0.9; }
      if (atk) { ap = 1.3 + swing; }
    } else if (zk === 'brute') {
      if (sg > 0) { hand = 'fist'; hsz = 1.25; uaL *= 1.2; faL *= 1.2; ap = (atk ? 1.5 + swing * 1.7 : 0.2 + sw * 0.2 * amp); el = atk ? 0.2 : 0.35; ar = 0.25; }
      else { ap = 0.5 + sw * 0.25 * amp; el = 0.8; ar = 0.3; uaL *= 0.85; faL *= 0.85; }
    } else if (zk === 'boss') {
      ap = (atk && sg > 0 ? 1.4 + swing * 1.6 : 0.35 + sw * 0.15 * amp); el = 0.2; ar = 0.3; faL *= 1.15; if (sg > 0) { hand = 'fist'; hsz = 1.4; }
    }
    else if (crawl) { ap = 2.0 + sw * 0.55 * Math.max(0.35, amp) + (atk ? swing * 0.4 : 0); el = -0.3; ar = 0.45; }
    else if (zk === 'bloater') { ap = 0.45 + sw * 0.2 * amp; ar = 0.75; el = 0.5; uaL *= 0.9; if (atk) ap = 1.2 + swing * 0.8; }
    else if (zk === 'screamer') { if (scream) { ap = 2.5; ar = 0.9; el = 0.2; faL *= 1.1; } else { ap = 0.3 + sw * 0.3 * amp; ar = 0.25; el = 0.45; faL *= 1.2; } if (atk) ap = 1.5 + swing; }
    else if (zk === 'armored') { if (sg < 0) { ap = 1.25; ar = 0.1; el = 1.2; } else { ap = 0.25 + sw * 0.3 * amp; el = 0.4; if (atk) { ap = 1.7 + swing * 1.4; el = 0.15; } } sleeve = white('#1f2a3a'); }
    if (corpse) { ap = 0.3 + fall * 1.3; el = 0.4; ar = 0.6 + fall * 0.4; }
    ap += flinch * -1.2;
    const sh = J(ZM[12], tor, 0, TH * 0.9, sg * 0.15 * Bd.tw, sg * -ar, 0, ap);
    const ur = (big ? 0.075 : 0.042) * (hand === 'fist' && zk === 'brute' ? 1.5 : 1);
    zput('limb', sh, ur, uaL, ur, sleeve);
    const elb = J(ZM[13], sh, 0, -uaL, 0, 0, 0, el);
    zput('limb', elb, ur * 0.85, faL, ur * 0.85, skin);
    const wr = J(ZM[14], elb, 0, -faL, 0, 0, 0, hand === 'claw' ? 0.2 : 0);
    zput(hand, wr, hsz * (big ? 1.4 : 1.05), hsz * (zk === 'walker' || zk === 'climber' ? 1.25 : 1) * (big ? 1.3 : 1), hsz * (big ? 1.4 : 1.05), skin);
  }
  // footfall dust for the heavy ones
  if (!corpse && big && amp > 0.3) { const st = Math.sign(Math.sin(ph)); if (z._st != null && st !== z._st) { addP({ x: z.x, y: z.y, z: z.z + 0.05, vx: frnd(-0.5, 0.5), vy: frnd(-0.5, 0.5), vz: 0.3, g: -0.2, col: '#7a7266', s: 0.18 * s * 0.6, life: 0.6, smoke: 1 }); if (zk === 'boss') shake(z.x, z.y, 0.06); } z._st = st; }
}

// zombie dog: low and long, four jointed legs at a gallop, snout, ears and a ragged tail
function rigDog(z, corpse, dt) {
  const sd = z.seed || 0, t = W.t;
  if (!corpse) {
    if (z._f == null) { z._f = z.face || 0; z._px = z.x; z._py = z.y; z._spd = 0; z._ph = sd * 0.1; }
    const sp = dt > 0 ? Math.min(8, Math.hypot(z.x - z._px, z.y - z._py) / dt) : 0; z._px = z.x; z._py = z.y;
    z._spd = lerp(z._spd, sp, Math.min(1, dt * 8)); z._f = angLerp(z._f, z.face || 0, Math.min(1, dt * 10)); z._ph += dt * (2 + z._spd * 3.4);
  }
  const hit = !corpse && z.hitT > 0, fur = hit ? '#ffd8cc' : ['#4a3c32', '#3a3530', '#5a4a3a'][sd % 3], raw = hit ? '#ffd8cc' : '#7a3a34';
  const amp = corpse ? 0 : clamp(z._spd / 3, 0, 1.1), ph = corpse ? 0 : z._ph, atk = !corpse && z.atk > 0;
  const R0 = ZM[0]; tmpQ.setFromAxisAngle(UPV, -(corpse ? z.face || 0 : z._f)); tmpV.set(z.x, z.z, z.y); tmpS.setScalar(ZT.dog.sc); R0.compose(tmpV, tmpQ, tmpS);
  if (corpse) J(R0, R0, 0, 0.05, 0, ease(z.t / 0.4) * Math.PI / 2 * 0.95, 0, 0);
  const bob = Math.abs(Math.sin(ph)) * 0.04 * amp, lunge = atk ? Math.sin(t * 14) * 0.12 : 0;
  const body = J(ZM[1], R0, lunge, 0.33 + bob, 0, 0, 0, -Math.PI / 2 + Math.sin(ph) * 0.12 * amp);
  zput('torso', body, 0.62, 1.05, 0.55, fur);
  zput('rag', J(ZM[2], body, 0, 0.3, 0, 0, 0, 0), 0.5, 0.6, 0.5, raw);
  // legs: front pair and back pair, diagonal gait
  const legs = [[0.36, -1, 0], [0.36, 1, Math.PI], [-0.05, -1, Math.PI * 0.9], [-0.05, 1, -0.1]];
  for (const [ox, sg, off] of legs) {
    const a = Math.sin(ph + off) * 0.7 * amp + (corpse ? 1.2 : 0);
    const hip = J(ZM[3], R0, ox + lunge, 0.3 + bob, sg * 0.1, 0, 0, a);
    zput('limb', hip, 0.04, 0.17, 0.04, fur);
    const knee = J(ZM[4], hip, 0, -0.17, 0, 0, 0, ox > 0 ? 0.5 + Math.max(0, Math.cos(ph + off)) * 0.6 * amp : -0.6 - Math.max(0, Math.cos(ph + off)) * 0.5 * amp);
    zput('limb', knee, 0.03, 0.16, 0.03, fur);
  }
  const head = J(ZM[5], R0, 0.44 + lunge * 1.4, 0.4 + bob, 0, Math.sin(t * 7 + sd) * 0.08, 0, atk ? 0.2 + Math.sin(t * 14) * 0.3 : -0.15);
  zput('head', head, 0.75, 0.62, 0.68, fur);
  zput('jaw', J(ZM[6], head, 0.07, 0.05, 0, 0, 0, 0), 2.1, 1.6, 0.8, fur);                    // snout
  zput('jaw', J(ZM[7], head, 0.07, 0.02, 0, 0, 0, -(atk ? 0.6 : 0.2)), 1.9, 1.2, 0.7, raw);    // open jaw
  zput('limb', J(ZM[8], head, -0.03, 0.15, -0.05, -0.3, 0, -0.2), 0.02, 0.09, 0.03, fur); zput('limb', J(ZM[9], head, -0.03, 0.15, 0.05, 0.3, 0, -0.2), 0.02, 0.09, 0.03, fur); // ears
  if (!corpse) { zput('eye', J(ZM[10], head, -0.02, -0.03, 0, 0, 0, 0), 0.8, 0.7, 1.1, z.rage > 0 || z.rageF ? '#ff2a1a' : ZEYE.dog); zput('glow', ZM[10], 0.8, 0.7, 1.1, ZEYE.dog); }
  zput('limb', J(ZM[11], R0, -0.22, 0.38 + bob, 0, Math.sin(t * 9 + sd) * 0.4, 0, -2.2), 0.025, 0.2, 0.025, fur); // tail
}

/* ================= survivors ================= */
const PGEO = {};
const PCOL = [
  { j: '#d9733a', j2: '#a85224', h: '#3a2618', p: '#2f3442', sk: '#e1b892', boot: '#2a2420', acc: '#f0d060' },
  { j: '#2f9e94', j2: '#1f6f68', h: '#16161c', p: '#3b3a33', sk: '#d6a77f', boot: '#1d1d22', acc: '#c94b4b' },
];
function mkPlayerModel(i) {
  const C = PCOL[i % 2], g = new THREE.Group(), mats = [];
  const M = col => { const m = new THREE.MeshLambertMaterial({ color: col, flatShading: true }); mats.push(m); return m; };
  const mesh = (geo, col, par, x, y, z) => { const m = new THREE.Mesh(geo, M(col)); m.castShadow = true; m.position.set(x || 0, y || 0, z || 0); par.add(m); return m; };
  const grp = (par, x, y, z) => { const q = new THREE.Group(); q.position.set(x || 0, y || 0, z || 0); par.add(q); return q; };
  const limb = (par, r, len, col) => { const m = mesh(PGEO.limb, col, par); m.scale.set(r, len, r); return m; };
  // lower body: hips + two jointed legs with boots, faces the move direction
  const lower = grp(g), hips = grp(lower, 0, 0.47, 0);
  mesh(boxG(0.17, 0.1, 0.27, 0, 0, 0), C.p, hips);
  const legs = [-1, 1].map(sg => {
    const th = grp(hips, 0, -0.02, sg * 0.075); limb(th, 0.068, 0.23, C.p);
    const kn = grp(th, 0, -0.23, 0); limb(kn, 0.058, 0.22, C.p); mesh(boxG(0.075, 0.07, 0.115, 0.02, -0.035, 0), '#1e2128', kn, 0.035, -0.04, 0); // knee pad
    const ft = grp(kn, 0, -0.22, 0); mesh(boxG(0.17, 0.075, 0.1, 0.04, -0.03, 0), C.boot, ft);
    return { th, kn, ft };
  });
  // upper body: faces the aim
  const upper = grp(g, 0, 0.47, 0), torso = grp(upper);
  mesh(new THREE.CylinderGeometry(0.155, 0.125, 0.36, 8).translate(0, 0.19, 0).scale(0.78, 1, 1), C.j, torso);
  mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 8).translate(0, 0.03, 0).scale(0.8, 1, 1), '#2a241e', torso);          // belt
  mesh(boxG(0.05, 0.05, 0.06, 0.1, 0.035, 0.08), '#4a4232', torso); mesh(boxG(0.05, 0.05, 0.06, 0.1, 0.035, -0.08), '#4a4232', torso); // pouches
  mesh(boxG(0.01, 0.3, 0.035, 0.122, 0.2, 0), C.j2, torso);                                                                         // zip strip
  mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.06, 8).translate(0, 0.39, 0).scale(0.8, 1, 1), C.j2, torso);                       // collar
  const pack = grp(torso, -0.15, 0.2, 0); mesh(boxG(0.12, 0.27, 0.24, 0, 0, 0), '#4c4636', pack); mesh(boxG(0.05, 0.12, 0.2, -0.07, -0.04, 0), '#5c5442', pack);
  mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.28, 8).rotateX(Math.PI / 2), i % 2 ? '#6a4a8a' : '#3f6a4a', pack, 0, 0.17, 0);       // bedroll
  // head: face, ears, hair (P1 short messy hair; P2 ponytail + red headband)
  const head = grp(torso, 0.01, 0.42, 0);
  mesh(boxG(0.19, 0.2, 0.18, 0, 0.1, 0), C.sk, head);
  mesh(boxG(0.02, 0.03, 0.035, 0.096, 0.115, -0.045), '#1a1412', head); mesh(boxG(0.02, 0.03, 0.035, 0.096, 0.115, 0.045), '#1a1412', head); // eyes
  mesh(boxG(0.015, 0.012, 0.05, 0.097, 0.145, -0.045), C.h, head); mesh(boxG(0.015, 0.012, 0.05, 0.097, 0.145, 0.045), C.h, head);       // brows
  mesh(boxG(0.03, 0.035, 0.03, 0.105, 0.085, 0), tmpC.set(C.sk).multiplyScalar(0.88).getStyle(), head);                                // nose
  mesh(boxG(0.04, 0.05, 0.02, 0, 0.1, -0.098), C.sk, head); mesh(boxG(0.04, 0.05, 0.02, 0, 0.1, 0.098), C.sk, head);                      // ears
  if (i % 2 === 0) {
    mesh(boxG(0.21, 0.07, 0.2, -0.01, 0.2, 0), C.h, head);
    for (let k = 0; k < 5; k++) mesh(boxG(0.06, 0.05, 0.07, -0.06 + k * 0.035, 0.24, (k % 2 ? 1 : -1) * 0.04), C.h, head).rotation.z = 0.3 - k * 0.12;
    mesh(boxG(0.06, 0.12, 0.19, -0.085, 0.13, 0), C.h, head); mesh(boxG(0.05, 0.03, 0.19, 0.08, 0.185, 0), C.h, head);
  } else {
    mesh(boxG(0.21, 0.08, 0.2, -0.01, 0.195, 0), C.h, head); mesh(boxG(0.07, 0.15, 0.2, -0.08, 0.12, 0), C.h, head);
    mesh(boxG(0.205, 0.035, 0.205, 0, 0.165, 0), C.acc, head);
    const tail = grp(head, -0.11, 0.16, 0); mesh(boxG(0.05, 0.2, 0.06, -0.02, -0.1, 0), C.h, tail); mesh(boxG(0.03, 0.03, 0.07, 0, 0, 0), C.acc, tail);
    head.userData.tail = tail;
  }
  // arms (IK driven) and weapons, inside an aim rig that pitches with the aim
  const aim = grp(torso, 0, 0.33, 0);
  const arms = [-1, 1].map(sg => {
    const sh = grp(aim, 0, 0, sg * 0.165); limb(sh, 0.05, 0.19, sg > 0 ? C.j : C.j2); mesh(new THREE.IcosahedronGeometry(0.06, 0), C.j, sh, 0, -0.01, 0);
    const el = grp(sh, 0, -0.19, 0); limb(el, 0.042, 0.18, C.j); mesh(boxG(0.065, 0.06, 0.06, 0, -0.18, 0), '#2a2a2a', el); // glove
    return { sh, el };
  });
  const gunG = grp(aim, 0.2, -0.04, 0.06);
  const dark = '#1c1f24', wood = '#6a4a2e';
  const mk = parts => { const q = grp(gunG); for (const [geo, col] of parts) mesh(geo, col, q); q.visible = false; return q; };
  const guns = [
    mk([[boxG(0.2, 0.06, 0.045, 0.08, 0.03, 0), dark], [boxG(0.05, 0.1, 0.04, 0, -0.03, 0), '#2b2b2b']]),
    mk([[boxG(0.5, 0.05, 0.05, 0.25, 0.04, 0), dark], [boxG(0.12, 0.06, 0.06, 0.2, 0, 0), wood], [boxG(0.2, 0.07, 0.05, -0.1, 0, 0), wood], [boxG(0.04, 0.08, 0.04, 0, -0.04, 0), wood]]),
    mk([[boxG(0.36, 0.07, 0.055, 0.12, 0.03, 0), '#2a2f28'], [boxG(0.22, 0.03, 0.03, 0.39, 0.04, 0), dark], [boxG(0.05, 0.13, 0.045, 0.1, -0.06, 0), dark], [boxG(0.17, 0.06, 0.05, -0.12, 0.01, 0), '#2a2f28'], [boxG(0.04, 0.08, 0.04, 0, -0.04, 0), dark]]),
    mk([[boxG(0.7, 0.045, 0.045, 0.32, 0.04, 0), dark], [boxG(0.22, 0.07, 0.06, 0.05, 0.02, 0), wood], [boxG(0.2, 0.05, 0.05, -0.12, 0.0, 0), wood], [new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8).rotateZ(Math.PI / 2).translate(0.12, 0.1, 0), '#14161a'], [boxG(0.04, 0.08, 0.04, 0, -0.04, 0), wood]]),
  ];
  guns.push(
    mk([[boxG(0.42, 0.05, 0.05, 0.12, 0.03, 0), wood], [boxG(0.04, 0.03, 0.46, 0.3, 0.05, 0), '#3a3a3a'], [boxG(0.01, 0.01, 0.4, 0.22, 0.05, 0), '#ddd'], [boxG(0.04, 0.08, 0.04, 0, -0.04, 0), wood], [boxG(0.3, 0.015, 0.015, 0.2, 0.07, 0), '#c9a23a']]),
    mk([[boxG(0.42, 0.06, 0.06, 0.18, 0.04, 0), '#4a4f55'], [new THREE.CylinderGeometry(0.035, 0.05, 0.12, 8).rotateZ(Math.PI / 2).translate(0.44, 0.04, 0), '#2a2d30'], [new THREE.CylinderGeometry(0.06, 0.06, 0.26, 10).rotateZ(Math.PI / 2).translate(0.08, -0.06, 0), '#a8322a'], [boxG(0.04, 0.08, 0.04, 0, -0.03, 0), dark]]),
    mk([[new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10).rotateZ(Math.PI / 2).translate(0.2, 0.05, 0), '#3d4a34'], [boxG(0.08, 0.1, 0.07, 0.02, -0.03, 0), dark], [boxG(0.18, 0.06, 0.05, -0.12, 0.03, 0), '#3d4a34'], [boxG(0.06, 0.05, 0.06, 0.3, 0.12, 0), dark]]),
  );
  const knife = grp(aim); for (const [geo, col] of [[boxG(0.075, 0.03, 0.03, -0.02, 0, 0), '#2a2420'], [boxG(0.02, 0.05, 0.05, 0.025, 0, 0), '#3a3a3a'], [boxG(0.15, 0.012, 0.035, 0.11, 0, 0), '#cfd4d8']]) mesh(geo, col, knife); knife.visible = false;
  const hammer = mk([[boxG(0.03, 0.32, 0.03, 0, 0.1, 0), '#8a6a44'], [boxG(0.12, 0.06, 0.06, 0.02, 0.26, 0), '#5a5f66']]);
  const medkit = mk([[boxG(0.14, 0.1, 0.2, 0, 0, 0), '#e8e2d6'], [boxG(0.145, 0.03, 0.08, 0, 0, 0), '#c83a32'], [boxG(0.145, 0.08, 0.03, 0, 0, 0), '#c83a32']]);
  const nade = mk([[new THREE.IcosahedronGeometry(0.05, 0), '#3c4a32']]);
  SCN.add(g);
  // (round 22) riot shield strapped to the left forearm side, facing the aim
  const shield = grp(torso, 0.17, 0.16, -0.19); mesh(boxG(0.035, 0.5, 0.3, 0, 0, 0), '#2e3a44', shield); mesh(boxG(0.04, 0.12, 0.22, 0.005, 0.12, 0), '#8fb4c8', shield); mesh(boxG(0.04, 0.03, 0.3, 0.004, -0.06, 0), '#e8d26a', shield); shield.visible = false;
  return { g, lower, hips, legs, upper, torso, head, aim, arms, gunG, guns, knife, hammer, medkit, nade, mats, i, shield };
}
// two-bone IK inside the aim rig: put the hand of arm A at target T (aim-rig coordinates)
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _down = new THREE.Vector3(0, -1, 0), _pole = new THREE.Vector3();
function ikArm(A, tx, ty, tz, sg) {
  const a = 0.19, b = 0.2, S = A.sh.position;
  _v1.set(tx - S.x, ty - S.y, tz - S.z); let d = _v1.length(); d = clamp(d, 0.08, a + b - 0.002); _v1.setLength(d);
  const cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = Math.acos(cosA);
  _pole.set(-0.25, -1, sg * 0.9).normalize();                       // elbows point down and out
  _v2.copy(_pole).addScaledVector(_v1, -_pole.dot(_v1) / (d * d)).normalize(); // pole projected off the shoulder->hand line
  _v3.copy(_v1).normalize().multiplyScalar(Math.cos(ang) * a).addScaledVector(_v2, Math.sin(ang) * a); // elbow position
  A.sh.quaternion.setFromUnitVectors(_down, _v3.clone().normalize());
  _v2.set(_v1.x - _v3.x, _v1.y - _v3.y, _v1.z - _v3.z).normalize().applyQuaternion(_q1.copy(A.sh.quaternion).invert());
  A.el.quaternion.setFromUnitVectors(_down, _v2);
}
// how each weapon is really held (aim-rig coords: x forward, y up, z right).
// Shouldered guns: butt in the shoulder pocket `sh`, stock length L back from the grip; `tw` blades the body (support side forward);
// the gun counter-turns so it still points at the target. `lh` = support hand on the gun (gun-local); `lo` = muzzle dip at low ready.
const STANCE = [
  { g: [0.31, 0.09, 0.02], tw: 0, lh: [-0.01, -0.035, -0.045], pz: 0, lo: 0.3, lean: -0.06 },                       // pistol: isosceles, two hands, at the eye line
  { L: 0.2, sh: [0.02, 0.06, 0.11], tw: 0.55, lh: [0.17, -0.035, -0.005], pz: 0, lo: 0.4, lean: -0.14, cheek: 1 },  // shotgun: bladed, weight forward, hand on the pump
  { L: 0.205, sh: [0.02, 0.07, 0.11], tw: 0.5, lh: [0.15, -0.035, 0], pz: 0, lo: 0.42, lean: -0.08, cheek: 1 },       // rifle: cheek on the stock, hand on the handguard
  { L: 0.22, sh: [0.02, 0.06, 0.11], tw: 0.5, lh: [0.15, -0.035, 0], pz: 0, lo: 0.42, lean: 0, cheek: 1, kneel: 1 },  // sniper: kneels when still, eye on the scope
  { L: 0.12, sh: [0.03, 0.07, 0.11], tw: 0.4, lh: [0.2, -0.035, 0], pz: 0, lo: 0.38, lean: -0.06, cheek: 1 },         // crossbow: shouldered, hand under the stock
  { g: [0.12, -0.16, 0.1], tw: 0.45, lh: [0.16, -0.02, 0], pz: 0.04, lo: 0.12, lean: -0.05 },                       // flamethrower: from the hip, two hands
  { L: 0.21, sh: [0.02, 0.06, 0.11], tw: 0.5, lh: [0.18, -0.045, 0], pz: 0.12, lo: 0.38, lean: -0.04, cheek: 1 },     // launcher: shouldered, barrel up for the arc
];
const MUZ = [[0.18, 0.03, 0], [0.5, 0.04, 0], [0.5, 0.04, 0], [0.67, 0.04, 0], [0.33, 0.05, 0], [0.5, 0.04, 0], [0.45, 0.05, 0]];
const _gv = new THREE.Vector3(), _gl = new THREE.Vector3();
// world position of a survivor's muzzle (from last frame's pose), so shots leave the barrel you see
function muzzleW(i, wi) { const m = OBJ.pl && OBJ.pl[i], p = W.p[i]; if (!m || !m.g.visible || !m.guns[wi] || !m.guns[wi].visible || (p && p._rdy != null && p._rdy < 0.7)) return null; _gv.set(MUZ[wi][0], MUZ[wi][1], MUZ[wi][2]).applyMatrix4(m.guns[wi].matrixWorld); return [_gv.x, _gv.z, _gv.y]; }
const GRIP = [[0.2, -0.04, 0.05, 0.19, -0.06, -0.02], [0.2, -0.04, 0.06, 0.42, -0.02, 0.0], [0.2, -0.04, 0.06, 0.4, -0.02, 0.0], [0.2, -0.04, 0.06, 0.46, -0.0, 0.0], [0.2, -0.04, 0.06, 0.34, -0.02, 0.0], [0.2, -0.04, 0.06, 0.3, -0.08, 0.0], [0.2, -0.04, 0.06, 0.36, -0.06, 0.0]];
// (round 27) vehicle models, riding poses and vehicle animation live in 55_vehicles.js
let DKN = 0;
function drawPlayers(vl, dt) {
  DKN = darkness();
  while (OBJ.pl.length < W.p.length) OBJ.pl.push(mkPlayerModel(OBJ.pl.length));
  OBJ.pl.forEach((m, i) => { const p = W.p[i]; m.g.visible = !!p && !p.gone && p.L <= vl; });
  W.p.forEach((p, i) => {
    const m = OBJ.pl[i]; if (!m.g.visible) return;
    if (!m.veh) { m.veh = mkVehicles(); m.g.add(m.veh); }
    let zv = (p.zv != null ? p.zv : p.z) + (p.rjz != null ? p.rjz : p.jz || 0), gx = p.rx != null ? p.rx : p.x, gy = p.ry != null ? p.ry : p.y; // (round 34) rx / ry: drawn between sim steps
    // (round 26) the back-seat rider is drawn glued to the driver as drawn on this screen (their own reported position lags behind over the network)
    const drv = p.pass != null && p.pass >= 0 && !p.down && !p.dead ? W.p[p.pass] : null;
    if (drv && drv.ride && !drv.gone && drv._ly != null) { gx = (drv.rx != null ? drv.rx : drv.x) - Math.cos(drv._ly) * PILLION; gy = (drv.ry != null ? drv.ry : drv.y) - Math.sin(drv._ly) * PILLION; zv = (drv.zv != null ? drv.zv : drv.z) + (drv.jz || 0) - Math.sin(drv._pitch || 0) * PILLION; } // (round 30) a nose-down aircraft lifts the back seat
    m.g.position.set(gx, zv, gy);
    if (inMech(p) && !p.dead && !p.down) { // (round 34) in a mech: draw the mech, hide the pilot
      if (!m.mech || m.mech.userData.J.k !== (p.mk || 0)) { if (m.mech) m.g.remove(m.mech); m.mech = mkMech(p.mk || 0); m.g.add(m.mech); }
      m.mech.visible = true; m.lower.visible = m.upper.visible = false; m.veh.visible = false; m.g.rotation.set(0, 0, 0);
      if (p._px == null || p._ly == null) { p._px = gx; p._py = gy; p._ly = p.aim; p._spd = 0; }
      const mvx = gx - p._px, mvy = gy - p._py; p._spd = lerp(p._spd || 0, dt > 0 ? Math.min(8, Math.hypot(mvx, mvy) / dt) : 0, Math.min(1, dt * 10)); p._px = gx; p._py = gy;
      if (p._spd > 0.4 && Math.hypot(mvx, mvy) > 1e-4) p._ly = angLerp(p._ly, Math.atan2(mvy, mvx), Math.min(1, dt * 6)); else if (p._spd < 0.25) p._ly = angLerp(p._ly, p.aim, Math.min(1, dt * 2));
      p._uy = p.aim; m.mech.rotation.y = -p._ly; mechTick(p, m.mech, dt); return;
    }
    if (m.mech) m.mech.visible = false; m.lower.visible = m.upper.visible = true;
    const vr = drv && drv.ride ? drv : p.ride && !p.down && !p.dead ? p : null; // (round 27) whose vehicle this player is on
    if (p.dead) m.g.rotation.set(-1.45, 0, 0); else if (vr && vr._ly != null && (vr._roll || vr._pitch)) rideBank(m, vr._ly, vr._roll, vr._pitch); else m.g.rotation.set(0, 0, 0); // a dead player lies flat until respawn / rescue
    // smoothing state
    if (p._uy == null) { p._uy = p.aim; p._ly = p.aim; p._ph = 0; p._kick = 0; p._spd = 0; p._px = gx; p._py = gy; p._st = 0; }
    const sp = dt > 0 ? Math.min(8, Math.hypot(gx - p._px, gy - p._py) / dt) : 0, mvx = gx - p._px, mvy = gy - p._py; p._px = gx; p._py = gy;
    p._spd = lerp(p._spd, sp, Math.min(1, dt * 10));
    const amp = clamp(p._spd / BAL.pSpeed, 0, 1.1), moving = p._spd > 0.4;
    p._uy = angLerp(p._uy, p.aim, Math.min(1, dt * 22));
    let back = false;
    if (moving && Math.hypot(mvx, mvy) > 1e-4) { // (round 34) a frame with no movement (no sim step ran) must not turn you toward atan2(0, 0) = east
      const md = Math.atan2(mvy, mvx); back = !p.ride && Math.cos(angDiff(md, p._uy)) < -0.35;
      p._ly = angLerp(p._ly, back ? md + Math.PI : md, Math.min(1, dt * (p.ride ? 8 : 12)));
    } else if (!p.ride) p._ly = angLerp(p._ly, p._uy, Math.min(1, dt * 5));
    if (drv && drv.ride && drv._ly != null) { p._ly = drv._ly; back = false; }                 // sit facing the way the bike goes
    // keep the hips within ~100 degrees of the chest
    const tw = angDiff(p._uy, p._ly); if (!vr && Math.abs(tw) > 1.75) p._ly = p._uy - Math.sign(tw) * 1.75; // (round 27) not on a vehicle: the vehicle sets the hips
    if (p.ride && !p.down && !p.dead) rideState(p, dt); else { p._roll = 0; p._pitch = 0; p._stopK = 0; p._lyP = null; }
    p._ph += dt * p._spd * 2.1 * (back ? -1 : 1);
    p._kick = Math.max(0, p._kick - dt * 9);
    m.lower.rotation.y = -p._ly; m.upper.rotation.y = -p._uy;
    // gait
    const ph = p._ph, down = p.down || p.dead, A = 0.62 * amp, K = 1.05 * amp;
    let aL = Math.sin(ph) * A, aR = -Math.sin(ph) * A, kL = 0.08 + Math.max(0, Math.cos(ph)) * K, kR = 0.08 + Math.max(0, -Math.cos(ph)) * K;
    if (p.jz > 0.05) { aL = 0.9; aR = -0.2; kL = 1.5; kR = 0.9; } // tucked legs in the air
    if (down) { aL = 1.35 + Math.sin(ph) * 0.2; aR = 0.2; kL = 2.1; kR = 1.9; }
    const wK = down ? 0 : p.wpn, SK = STANCE[wK] || STANCE[0];
    p._kn = lerp(p._kn || 0, SK.kneel && !moving && !p.build && !(p.medT > 0) && !(p.jz > 0.05) && !down ? 1 : 0, Math.min(1, dt * 7));
    if (p._kn > 0.01) { const q = p._kn; aL = lerp(aL, 1.45, q); kL = lerp(kL, 1.45, q); aR = lerp(aR, -0.05, q); kR = lerp(kR, 1.62, q); } // right knee down, left foot forward
    const pil = p.pass != null && p.pass >= 0 && !down, ride = (!!p.ride || pil) && !down; m.veh.visible = !!p.ride && !down; if (ride) { m.veh.userData.all.forEach((q, k) => { if (q) q.visible = k === (p.veh || 1); }); m.veh.rotation.y = -p._ly; aL = aR = 1.15; kL = kR = 1.35; }
    if (m.veh.visible) vehTick(p, m, dt, DKN);
    const vk = pil ? (W.p[p.pass] && W.p[p.pass].veh) || 2 : p.veh || 1, RP = ride ? VPOSE[vk] || VPOSE[1] : null, rH = RP ? (pil ? RP.pH || RP.H : RP.H) : 0;
    if (m.shield) m.shield.visible = !!p.shield && p.melee === 1 && !down && !p.dead && !p.ride; // (round 23) shown when it's your melee weapon
    const legH = (a, k) => 0.23 * Math.cos(a) + 0.22 * Math.cos(a - k) + 0.03;
    const hipY = down ? 0.2 : Math.max(legH(aL, kL), legH(aR, kR));
    const sk = RP && !pil && RP.foot ? p._stopK || 0 : 0, rX = sk * (RP && RP.slide || 0), rZ = sk * 0.09, rY = RP ? rH - sk * (RP.drop || 0) : hipY; // (round 27) hips on the saddle; stopped: slid off it toward the foot that's down
    m.hips.position.set(rX, rY, rZ); m.upper.position.set(rX * Math.cos(p._ly) - rZ * Math.sin(p._ly), rY, rX * Math.sin(p._ly) + rZ * Math.cos(p._ly));
    m.legs[0].th.rotation.z = aL; m.legs[0].kn.rotation.z = -kL; m.legs[0].ft.rotation.z = kL - aL;
    m.legs[1].th.rotation.z = aR; m.legs[1].kn.rotation.z = -kR; m.legs[1].ft.rotation.z = kR - aR;
    m.legs[0].th.rotation.x = 0; if (down) { m.legs[1].th.rotation.x = 0.6; } else m.legs[1].th.rotation.x = 0;
    if (RP) rideLegs(m, RP, pil, rY, pil ? W.p[p.pass] : p, rX, rZ);
    // footsteps: a puff of dust when a foot lands while running
    const st = Math.sign(Math.sin(ph)); if (amp > 0.55 && st !== p._st && !down && !ride) addP({ x: p.x - Math.cos(p._ly) * 0.1, y: p.y - Math.sin(p._ly) * 0.1, z: zv + 0.03, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: 0.25, g: -0.2, col: '#8a7e6a', s: 0.07, life: 0.45, smoke: 1 }); p._st = st;
    // torso: lean into the run, breathe when idle, flinch when hit, slump when down
    const breath = Math.sin(W.t * 2.2 + i) * 0.012;
    const hurt = p.hurtT > 0 ? p.hurtT / 0.3 : 0;
    m.torso.rotation.z = -0.1 * amp + hurt * 0.35 + (down ? -0.45 : 0) + (p.medT > 0 ? -0.2 : 0) + (down || p.build || p.medT > 0 ? 0 : SK.lean * (1 - amp * 0.5) * (p._rdy == null ? 1 : p._rdy));
    m.torso.rotation.x = ride ? 0 : Math.sin(ph) * 0.05 * amp;
    m.torso.position.y = breath + (ride ? Math.abs(Math.sin(W.t * 13 + i)) * 0.008 * clamp(p._spd / 3, 0, 1) * (vk === 1 || vk === 3 ? 0.4 : 1) : Math.abs(Math.sin(ph)) * 0.012 * amp);
    m.head.rotation.z = (down ? 0.35 : 0) + (p.medT > 0 ? -0.35 : 0) - m.torso.rotation.z * 0.4;
    m.head.rotation.y = moving ? 0 : Math.sin(W.t * 0.5 + i * 2) * 0.25 * (p._kick > 0.05 ? 0 : 1);
    if (m.head.userData.tail) m.head.userData.tail.rotation.z = 0.25 + Math.sin(ph * 2) * 0.25 * amp + (moving ? 0.25 : 0);
    const flash = hurt > 0 ? hurt : 0; for (const mt of m.mats) mt.emissive.setRGB(flash * 0.7, flash * 0.08, flash * 0.05);
    // aim rig: pitch toward the target, recoil kick, shove thrust, run bob
    const wi = down ? 0 : p.wpn, kickM = [0.6, 1.4, 0.7, 1.6, 0.5, 0.08, 1.3][wi];
    const pitch = p.aimPt ? Math.atan2(p.aimPt.z - (p.z + 0.72), Math.max(0.4, Math.hypot(p.aimPt.x - p.x, p.aimPt.y - p.y))) : 0;
    const shove = p.shoveT > 0 ? Math.sin(Math.PI * (1 - p.shoveT / 0.18)) : 0;
    m.aim.rotation.z = p.build ? -0.15 : clamp(pitch, -0.9, 0.7) * 0.85 + p._kick * 0.22 * kickM - shove * 0.25 + m.torso.rotation.z * -0.8;
    m.aim.position.x = -p._kick * 0.05 * kickM + shove * 0.14;
    m.aim.position.y = 0.33 + Math.sin(ph * 2) * 0.01 * amp;
    // what's in hand + arm IK
    const reload = p.reloadT > 0 && !p.build, med = p.medT > 0, thr = p._throwT > 0, build = !!p.build;
    const bashing = p.melee === 1 && p.shield, kn = p.knT > 0 && !build && !med && !p.down ? clamp(1 - p.knT / (bashing ? 0.3 : 0.28), 0, 1) : -1;
    const fired0 = W.t - (p._lastShot || -9) < 1.4, busy = reload || med || thr || build || kn >= 0 || fired0 || !!(p.inp && p.inp.fire);
    p._grip = lerp(p._grip || 0, RP && !busy ? 1 : 0, Math.min(1, dt * 7)); const grip = RP ? p._grip : 0; // (round 27) riding and not shooting: hands on the bars
    m.guns.forEach((gm, k) => gm.visible = !build && !med && !thr && kn < 0 && k === wi && grip < 0.5); m.knife.visible = kn >= 0 && !bashing; m.hammer.visible = build; m.medkit.visible = med; m.nade.visible = thr;
    // stance: shouldered up when shooting or standing, low ready (muzzle down, butt still in the shoulder) when on the move
    const S = STANCE[wi], fired = W.t - (p._lastShot || -9) < 1.4, plain = down || build || med || thr;
    p._rdy = lerp(p._rdy == null ? 1 : p._rdy, plain || !moving || fired || (p.inp && p.inp.fire) ? 1 : 0, Math.min(1, dt * 8));
    const lo = 1 - p._rdy, bt = plain ? 0 : S.tw;
    m.torso.rotation.y = -bt; m.head.rotation.y = (S.cheek && !plain && p._rdy > 0.5 ? 0 : m.head.rotation.y) + bt * 0.85; // blade the body, eyes stay on the target
    if (S.cheek && !plain) { m.head.rotation.x = 0.2 * p._rdy; m.head.rotation.z -= 0.14 * p._rdy; } else m.head.rotation.x = 0; // cheek on the stock
    const rl = reload ? Math.sin(((W.t * 2.6) % 1) * Math.PI) : 0;
    m.gunG.rotation.set(reload ? 0.55 : 0, bt, S.pz - lo * S.lo - (reload ? 0.35 : 0));
    if (S.L) { _gl.set(S.L, 0, 0).applyEuler(m.gunG.rotation); m.gunG.position.set(S.sh[0] + _gl.x, S.sh[1] + _gl.y, S.sh[2] + _gl.z); }
    else m.gunG.position.set(S.g[0] - lo * 0.06, S.g[1] - lo * 0.05, S.g[2]);
    if (down) m.gunG.position.set(0.24, -0.02, 0.06);
    let lhx = S.lh[0], lhy = S.lh[1], lhz = S.lh[2];
    if (reload) { lhx = 0.06 + 0.04 * (1 - rl); lhy = -0.1 - rl * 0.12; lhz = -0.03; // off hand down to the magazine and back
      if (!p._rl) addP({ x: p.x + Math.cos(p._uy) * 0.25, y: p.y + Math.sin(p._uy) * 0.25, z: zv + 0.7, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: 0.4, col: '#2a2d30', s: 0.05, life: 0.9, floor: zv + 0.02 }); }
    p._rl = reload;
    if (wi === 1 && p._kick > 0.1 && p._kick < 0.75) lhx -= Math.sin((0.75 - p._kick) / 0.65 * Math.PI) * 0.1; // rack the pump
    _gl.set(lhx, lhy, lhz).applyEuler(m.gunG.rotation).add(m.gunG.position);
    let rx = m.gunG.position.x, ry = m.gunG.position.y, rz = m.gunG.position.z, lx = _gl.x, ly = _gl.y, lz = _gl.z;
    if (wi === 3 && p._kick > 0.1 && p._kick < 0.6) { ry += Math.sin((0.6 - p._kick) / 0.5 * Math.PI) * 0.07; } // work the bolt
    if (plain) m.torso.rotation.y = 0;
    if (build) { const sw = p._swingT > 0 ? Math.sin((1 - p._swingT / 0.3) * Math.PI) : 0; rx = 0.25; ry = 0.08 + sw * 0.12; rz = 0.12; lx = 0.05; ly = -0.3; lz = -0.06; m.gunG.position.set(rx, ry, rz); m.gunG.rotation.set(0, 0, -0.4 + sw * -1.3); }
    if (med) { rx = 0.22; ry = -0.12; rz = 0.06; lx = 0.22; ly = -0.12; lz = -0.06; m.gunG.position.set(0.24, -0.12, 0); m.gunG.rotation.set(0, 0, 0); }
    if (thr) { const k = 1 - p._throwT / 0.35, wind = k < 0.45 ? ease(k / 0.45) : 1 - ease((k - 0.45) / 0.3); rx = 0.05 + (k < 0.45 ? -0.15 * wind : 0.4 * (1 - wind)); ry = 0.05 + wind * 0.3; rz = 0.15; m.gunG.position.set(rx, ry, rz); m.gunG.rotation.set(0, 0, 0); }
    if (kn >= 0) { // wind up high on the right, slash down across the body, recover
      const a = kn < 0.3 ? ease(kn / 0.3) : 1, b = kn < 0.3 ? 0 : kn < 0.62 ? ease((kn - 0.3) / 0.32) : 1, c = kn > 0.62 ? ease((kn - 0.62) / 0.38) : 0;
      rx = lerp(lerp(lerp(0.2, 0.1, a), 0.36, b), 0.22, c); ry = lerp(lerp(lerp(0, 0.2, a), -0.1, b), 0.02, c); rz = lerp(lerp(lerp(0.12, 0.2, a), -0.12, b), 0.1, c);
      lx = 0.17; ly = 0.06; lz = -0.13; m.torso.rotation.y = lerp(lerp(0, 0.35, a), -0.45, b) * (1 - c);
      m.knife.position.set(rx, ry, rz); m.knife.rotation.set(lerp(-0.4, 0.5, b), lerp(-0.6, 0.7, b), lerp(lerp(0.2, 1.0, a), -0.9, b));
      m.aim.position.x += Math.sin(b * Math.PI) * 0.08;
    }
    if (m.shield) { const t = kn >= 0 && bashing ? Math.sin(Math.min(1, kn * 1.6) * Math.PI) : 0; m.shield.position.x = 0.17 + t * 0.3; m.torso.rotation.y += t * -0.25; if (t) { lx = 0.2 + t * 0.25; ly = 0.12; lz = -0.17; } } // shield bash: shove it forward
    if (RP) {
      const lean = pil ? RP.pLean : RP.lean;
      const oz = m.torso.rotation.z; m.torso.rotation.z = lean * (0.45 + 0.55 * grip) + hurt * 0.35; m.aim.rotation.z -= (m.torso.rotation.z - oz) * 0.8; // keep the gun on target while leaning over the bars
      if (grip > 0.01) {
        if (!RP.turret) m.upper.rotation.y = -angLerp(p._uy, p._ly, grip); m.torso.rotation.y *= 1 - grip; // (round 31) a tank commander turns with the turret (= the aim)
        m.aim.rotation.z = lerp(m.aim.rotation.z, -m.torso.rotation.z * 0.3, grip); m.aim.position.x *= 1 - grip;
        m.head.rotation.y = lerp(m.head.rotation.y, RP.turret ? 0 : clamp(-angDiff(p._ly, p._uy), -1.2, 1.2), grip); m.head.rotation.x *= 1 - grip;
        m.head.rotation.z = lerp(m.head.rotation.z, -m.torso.rotation.z * 0.6 + (pil && vk === 2 ? 0.14 : 0), grip); // the back-seat rider peeks past the driver
        m.g.updateMatrixWorld(true);
        const V = !pil && m.veh.userData.all[vk], gr = V && V.userData.S.grip, hd = pil && RP.hold;
        for (let s = 0; s < 2; s++) {
          if (gr) gr[s].getWorldPosition(_v1); else if (hd) m.lower.localToWorld(_v1.set(hd[0], hd[1], (s ? 1 : -1) * hd[2])); else continue;
          m.aim.worldToLocal(_v1);
          if (s) { rx = lerp(rx, _v1.x, grip); ry = lerp(ry, _v1.y, grip); rz = lerp(rz, _v1.z, grip); } else { lx = lerp(lx, _v1.x, grip); ly = lerp(ly, _v1.y, grip); lz = lerp(lz, _v1.z, grip); }
        }
      }
    }
    ikArm(m.arms[1], rx, ry, rz, 1); ikArm(m.arms[0], lx, ly, lz, -1);
  });
  for (const p of W.p) { if (p._throwT > 0) p._throwT -= dt; if (p._swingT > 0) p._swingT -= dt; }
}

/* ---------- tracers (thick, additive) and blood decals ---------- */
const _qd = new THREE.Quaternion(), _xa = new THREE.Vector3(1, 0, 0), _dv = new THREE.Vector3();
function drawTracers() {
  const T = OBJ.tracerI; let n = 0;
  for (const t of RND.tracers) {
    if (n >= 140) break;
    const a = 1 - t.t / t.life, f = t.t / t.life * 0.7;
    const x1 = lerp(t.x, t.x2, f), y1 = lerp(t.y, t.y2, f), z1 = lerp(t.z, t.z2, f);
    _dv.set(t.x2 - x1, t.z2 - z1, t.y2 - y1); const len = _dv.length(); if (len < 0.01) continue; _dv.divideScalar(len);
    _qd.setFromUnitVectors(_xa, _dv); tmpV.set(x1, z1, y1); const w = (t.w || 0.035) * (0.6 + a * 0.4); tmpS.set(len, w, w);
    tmpM.compose(tmpV, _qd, tmpS); T.setMatrixAt(n, tmpM); const c = t.col || [1, 0.85, 0.5]; T.setColorAt(n, tmpC.setRGB(a * c[0], a * c[1], a * c[2])); n++;
  }
  // sniper laser sight
  for (const p of W.p) {
    if (n >= 140 || p.gone || p.dead || p.down || p.build || p.wpn !== 3 || p.reloadT > 0 || !OBJ.pl[p.i] || !OBJ.pl[p.i].g.visible) continue;
    const [sx, sy, sz] = shoulder(p), [ax, ay, az] = aimDir(p), hit = rayWorld(sx, sy, sz, ax, ay, az, 30, { lean: LEAN }), x0 = sx + ax * 0.6, y0 = sy + ay * 0.6, z0 = sz + az * 0.6;
    _dv.set(ax, az, ay); _qd.setFromUnitVectors(_xa, _dv); tmpV.set(x0, z0 + (p.jz || 0), y0); tmpS.set(Math.max(0.1, hit.d - 0.6), 0.012, 0.012);
    tmpM.compose(tmpV, _qd, tmpS); T.setMatrixAt(n, tmpM); T.setColorAt(n, tmpC.setRGB(0.9, 0.08, 0.05)); n++;
  }
  T.count = n; T.instanceMatrix.needsUpdate = true; if (T.instanceColor) T.instanceColor.needsUpdate = true;
  const D = OBJ.decal; let k = 0;
  RND.decals = RND.decals.filter(d => (d.t += 1 / 60) < 40);
  for (const d of RND.decals) { const sh = d.t > 34 ? 1 - (d.t - 34) / 6 : Math.min(1, d.t * 6); setInst(D, k++, d.x, d.z + 0.015 + k * 0.0002, d.y, d.r, d.s * sh, 1, d.s * sh * d.e, d.col); }
  D.count = k; D.instanceMatrix.needsUpdate = true; if (D.instanceColor) D.instanceColor.needsUpdate = true;
}
function addDecal(x, y, z, s, col) {
  const L = Math.max(0, Math.round(z / FH)); let fz = L * FH; const cx = Math.floor(x), cy = Math.floor(y);
  for (let l = Math.min(ML - 1, Math.floor((z + 0.2) / FH)); l >= 0; l--) { if (inMap(cx, cy) && support(cx, cy, l)) { fz = l * FH; break; } }
  RND.decals.push({ x, y, z: fz, s, col: col || (hash2(cx, cy) < 0.5 ? '#4a0606' : '#5e0b08'), r: frnd(0, 6.28), e: frnd(0.6, 1), t: 0 });
  if (RND.decals.length > 210) RND.decals.shift();
}

/* ---------- (round 34) kaiju: one mesh each (only a few are ever alive), built from parts and animated by hand ---------- */
const KAIJU = new Map();
function kjPart(par, geo, mat, x, y, z, rx, ry, rz) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = !mat.transparent && mat.type !== 'MeshBasicMaterial'; par.add(m); return m; }
const kjBlob = (r, sx, sy, sz, seed) => jitterG(new THREE.IcosahedronGeometry(r, 1).scale(sx, sy, sz), r * 0.08, seed || 3);
const kjGrp = (par, x, y, z) => { const q = new THREE.Group(); q.position.set(x || 0, y || 0, z || 0); par.add(q); return q; };
function mkKaiju(k) {
  const T = ZT[k], g = new THREE.Group(), J = { k, legs: [], tail: [], spin: 0 };
  const skin = lam(T.skin), dark = lam(tmpC.set(T.skin).multiplyScalar(0.55).getStyle()), bone = lam('#d8ceb4'), plate = lam('#6c707a'), claw = lam('#2a2622');
  const glowC = k === 'kjaw' ? '#9dff3a' : k === 'ktail' ? '#ff6a2a' : '#ffd23a', glow = new THREE.MeshBasicMaterial({ color: glowC }), glowA = new THREE.MeshBasicMaterial({ color: glowC, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const tellM = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  J.glowA = glowA;
  const body = kjGrp(g, 0, 0, 0); J.body = body;
  const leg = (x, z, hy, th, sh, fat, s, quad) => { // hip at (x, hy, z); thigh, shin, foot with three claws
    const hip = kjGrp(body, x, hy, z); kjPart(hip, kjBlob(fat, 1, 1.5, 1, 7), skin, 0, -th * 0.45, 0);
    const kn = kjGrp(hip, 0, -th, 0); kjPart(kn, kjBlob(fat * 0.7, 1, 1.6, 1, 9), dark, quad ? 0 : -0.05, -sh * 0.45, 0);
    const ft = kjGrp(kn, 0, -sh, 0); kjPart(ft, new THREE.BoxGeometry(fat * 1.6, 0.14, fat * 1.2), dark, fat * 0.3, -0.04, 0);
    for (let c = -1; c <= 1; c++) kjPart(ft, new THREE.ConeGeometry(0.05, 0.22, 5).rotateZ(-Math.PI / 2), claw, fat * 1.15, -0.06, c * fat * 0.4);
    J.legs.push({ hip, kn, ft, s, th, sh });
  };
  const tail = (x, y, n, r0, len, droop) => { let par = body, px = x, py = y; for (let i = 0; i < n; i++) { const seg = kjGrp(par, px, py, 0); const r = r0 * (1 - i / (n + 1)); kjPart(seg, kjBlob(r, 1.6, 1, 1, 11 + i), i % 2 ? skin : dark, -len * 0.5, 0, 0); J.tail.push(seg); par = seg; px = -len; py = -droop; } return par; };
  if (k === 'kjaw') { // a towering biped: split jaws, glowing throat, a crest of spines
    J.hipY = 1.55;
    const tor = kjGrp(body, 0, 1.75, 0); J.tor = tor; tor.rotation.z = 0.25;
    kjPart(tor, kjBlob(0.75, 1.5, 1.05, 1.0, 5), skin, 0, 0.1, 0); kjPart(tor, kjBlob(0.55, 1.2, 0.8, 0.9, 6), lam('#8aa070'), 0.25, -0.15, 0); // body, pale belly
    for (let i = 0; i < 7; i++) kjPart(tor, new THREE.ConeGeometry(0.08, 0.45 - Math.abs(i - 3) * 0.06, 5), bone, -0.7 + i * 0.25, 0.85 - Math.abs(i - 3) * 0.05, 0, 0, 0, 0.3); // spines
    const nk = kjGrp(tor, 0.95, 0.45, 0); nk.rotation.z = 0.4; J.neck = nk; kjPart(nk, kjBlob(0.36, 1.6, 1, 1, 8), skin, 0.25, 0, 0);
    J.throat = kjPart(nk, kjBlob(0.22, 1.4, 0.8, 0.8, 4), glowA, 0.3, -0.2, 0);
    const hd = kjGrp(nk, 0.65, 0.05, 0); J.head = hd; kjPart(hd, kjBlob(0.34, 1.5, 0.75, 0.9, 12), skin, 0.25, 0.08, 0);
    for (const s of [-1, 1]) { kjPart(hd, new THREE.SphereGeometry(0.06, 6, 4), glow, 0.38, 0.2, s * 0.22); kjPart(hd, new THREE.ConeGeometry(0.06, 0.4, 5), bone, 0.05, 0.3, s * 0.18, s * 0.5, 0, 0.6); }
    const uj = kjGrp(hd, 0.3, 0.05, 0); J.uj = uj; kjPart(uj, new THREE.BoxGeometry(0.75, 0.14, 0.42), dark, 0.38, 0, 0); for (let t = 0; t < 6; t++) kjPart(uj, new THREE.ConeGeometry(0.03, 0.12, 4).rotateZ(Math.PI), bone, 0.12 + t * 0.11, -0.1, (t % 2 ? 1 : -1) * 0.17);
    J.lj = []; for (const s of [-1, 1]) { const lj = kjGrp(hd, 0.25, -0.08, s * 0.08); kjPart(lj, new THREE.BoxGeometry(0.72, 0.11, 0.2), dark, 0.36, 0, s * 0.06); for (let t = 0; t < 5; t++) kjPart(lj, new THREE.ConeGeometry(0.028, 0.11, 4), bone, 0.12 + t * 0.12, 0.08, s * 0.1); J.lj.push({ g: lj, s }); } // the lower jaw splits in two
    for (const s of [-1, 1]) { const ar = kjGrp(tor, 0.6, -0.2, s * 0.55); ar.rotation.z = -0.8; kjPart(ar, kjBlob(0.14, 1, 2.4, 1, 2), skin, 0, -0.25, 0); for (let c = -1; c <= 1; c++) kjPart(ar, new THREE.ConeGeometry(0.03, 0.2, 4).rotateZ(Math.PI), claw, 0.04, -0.6, c * 0.06); J.arms = (J.arms || []).concat(ar); }
    for (const s of [-1, 1]) leg(-0.15, s * 0.5, J.hipY, 0.85, 0.8, 0.26, s);
    tail(-1.0, 1.65, 5, 0.42, 0.55, 0.06);
    J.tell = kjPart(g, new THREE.CircleGeometry(7.5, 20, -0.5, 1.0).rotateX(-Math.PI / 2), tellM, 0, 0.04, 0);
  } else if (k === 'ktail') { // a low, armoured four-legger with a mace on the end of a long tail
    J.hipY = 1.0;
    const tor = kjGrp(body, 0, 1.25, 0); J.tor = tor;
    kjPart(tor, kjBlob(0.8, 1.7, 0.75, 1.15, 5), skin, 0, 0, 0);
    for (let i = 0; i < 5; i++) for (const s of [-1, 0, 1]) kjPart(tor, new THREE.BoxGeometry(0.36, 0.12, 0.34), plate, -0.9 + i * 0.42, 0.55 - Math.abs(s) * 0.12, s * 0.42, s * 0.35, 0, 0);
    for (let i = 0; i < 5; i++) kjPart(tor, new THREE.ConeGeometry(0.07, 0.3, 5), bone, -0.85 + i * 0.42, 0.72, 0);
    const hd = kjGrp(tor, 1.3, -0.15, 0); J.head = hd; kjPart(hd, kjBlob(0.38, 1.4, 0.8, 1, 9), dark, 0.2, 0, 0); kjPart(hd, new THREE.BoxGeometry(0.5, 0.1, 0.62), plate, 0.15, 0.28, 0);
    for (const s of [-1, 1]) { kjPart(hd, new THREE.ConeGeometry(0.07, 0.5, 5), bone, 0.3, 0.3, s * 0.3, s * 0.9, 0, -0.6); kjPart(hd, new THREE.SphereGeometry(0.05, 6, 4), glow, 0.55, 0.08, s * 0.18); }
    J.uj = kjGrp(hd, 0.45, -0.12, 0); kjPart(J.uj, new THREE.BoxGeometry(0.4, 0.1, 0.4), dark, 0.1, 0, 0);
    for (const sx of [1, -1]) for (const s of [-1, 1]) leg(sx * 0.75, s * 0.75, J.hipY, 0.55, 0.5, 0.24, s * sx, 1);
    const end = tail(-1.25, 1.3, 7, 0.4, 0.5, -0.02);
    const mace = kjGrp(end, -0.55, 0, 0); kjPart(mace, kjBlob(0.34, 1, 1, 1, 13), plate, 0, 0, 0); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; kjPart(mace, new THREE.ConeGeometry(0.06, 0.32, 5), bone, Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0, 0, 0, a - Math.PI / 2); }
    J.tell = kjPart(g, new THREE.RingGeometry(0.2, 4.2, 28).rotateX(-Math.PI / 2), tellM, 0, 0.04, 0);
    J.lane = kjPart(g, new THREE.PlaneGeometry(12, 1.9).rotateX(-Math.PI / 2).translate(6, 0, 0), tellM, 0, 0.05, 0);
  } else { // kdig: a hunched digger: shovel claws, a drill horn, a row of glowing eyes
    J.hipY = 0.85;
    const tor = kjGrp(body, 0, 1.35, 0); J.tor = tor; tor.rotation.z = 0.35;
    kjPart(tor, kjBlob(0.75, 1.3, 1.0, 1.1, 5), skin, 0, 0, 0);
    for (let i = 0; i < 5; i++) kjPart(tor, new THREE.TorusGeometry(0.62 - i * 0.04, 0.07, 5, 12, Math.PI).rotateY(Math.PI / 2), dark, -0.6 + i * 0.28, 0.1, 0, 0, 0, 0);
    const hd = kjGrp(tor, 0.85, 0.1, 0); J.head = hd; kjPart(hd, kjBlob(0.4, 1.2, 0.85, 1, 9), plate, 0.1, 0, 0);
    J.drill = kjGrp(hd, 0.5, 0.05, 0); kjPart(J.drill, new THREE.ConeGeometry(0.2, 0.7, 7).rotateZ(-Math.PI / 2), bone, 0.3, 0, 0); for (let i = 0; i < 3; i++) kjPart(J.drill, new THREE.TorusGeometry(0.17 - i * 0.05, 0.02, 4, 10).rotateY(Math.PI / 2), claw, 0.1 + i * 0.18, 0, 0);
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) kjPart(hd, new THREE.SphereGeometry(0.045, 6, 4), glow, 0.38 - i * 0.07, 0.22 - i * 0.03, s * (0.14 + i * 0.05));
    J.arms = []; for (const s of [-1, 1]) { const ar = kjGrp(tor, 0.55, -0.25, s * 0.7); kjPart(ar, kjBlob(0.2, 1, 2, 1, 4), skin, 0, -0.3, 0); const hand = kjGrp(ar, 0, -0.7, 0); kjPart(hand, new THREE.BoxGeometry(0.45, 0.12, 0.5), claw, 0.15, 0, 0); for (let c = 0; c < 4; c++) kjPart(hand, new THREE.ConeGeometry(0.05, 0.35, 4).rotateZ(-Math.PI / 2), bone, 0.5, -0.02, (c - 1.5) * 0.12); J.arms.push(ar); } // shovel claws
    for (const s of [-1, 1]) leg(-0.3, s * 0.55, J.hipY, 0.48, 0.42, 0.22, s);
    tail(-0.9, 1.1, 3, 0.3, 0.42, 0.12);
  }
  g.userData.J = J; return g;
}
function drawKaiju(z, corpse, dt) {
  const key = (corpse ? 'c' : 'z') + (z.id != null ? z.id : z.seed) + z.k; let K = KAIJU.get(key);
  if (!K) { const g = mkKaiju(z.k); SCN.add(g); K = { g, J: g.userData.J }; KAIJU.set(key, K); }
  K.seen = 1; const g = K.g, J = K.J, T = ZT[z.k]; g.visible = !z.hidden || corpse;
  if (z._f == null) { z._f = z.face || 0; z._px = z.x; z._py = z.y; z._spd = 0; z._ph = 0; }
  const sp = dt > 0 ? Math.min(10, Math.hypot(z.x - z._px, z.y - z._py) / dt) : 0; z._px = z.x; z._py = z.y; z._spd = lerp(z._spd, sp, Math.min(1, dt * 6)); z._f = angLerp(z._f, z.face || 0, Math.min(1, dt * 6));
  z._ph += dt * (1 + z._spd * 1.6);
  const amp = corpse ? 0 : clamp(z._spd / 1.2, 0, 1.3), ph = z._ph, kt = corpse ? 0 : z.kt || 0, atk = !corpse && z.atk > 0, t = W.t;
  g.position.set(z.x, z.z - (corpse ? Math.max(0, z.t - 3) * 0.4 : 0), z.y); g.rotation.set(0, -z._f, 0);
  if (corpse) { g.rotation.x = Math.min(1.4, z.t * 2) * 0.95; if (z.t > 7) g.visible = false; }
  // legs: walk cycle (quadrupeds: diagonal pairs)
  J.legs.forEach((L, n) => { const off = J.legs.length > 2 ? ((n === 0 || n === 3) ? 0 : Math.PI) : n * Math.PI, a = Math.sin(ph + off) * 0.5 * amp, k = 0.2 + Math.max(0, Math.cos(ph + off)) * 0.7 * amp; L.hip.rotation.z = a; L.kn.rotation.z = -k; L.ft.rotation.z = k - a; });
  J.body.position.y = Math.abs(Math.sin(ph)) * 0.06 * amp;
  // tail sway (whips round during a sweep)
  const sweep = z.k === 'ktail' && kt === 2 && !z.kc;
  J.tail.forEach((s, i) => { s.rotation.y = Math.sin(t * 2.2 - i * 0.6) * 0.12 * (1 + amp) + (z.k === 'ktail' && kt === 1 && !z.kc ? -0.25 : 0); s.rotation.z = (z.k === 'ktail' && kt === 1 && !z.kc ? 0.12 : 0) + Math.sin(t * 1.3 - i * 0.5) * 0.03; });
  if (sweep) J.spin += dt * 14; else J.spin = 0; J.body.rotation.y = sweep ? J.spin : lerp(J.body.rotation.y, 0, Math.min(1, dt * 10));
  // head / jaws: bite when attacking, open wide for the breath
  const bite = atk ? Math.max(0, Math.sin(t * 9)) : 0;
  if (J.uj) J.uj.rotation.z = (z.k === 'kjaw' ? (kt ? 0.45 : bite * 0.3) : bite * 0.2);
  if (J.lj) J.lj.forEach(L => { L.g.rotation.z = -(kt ? 0.6 : bite * 0.4); L.g.rotation.y = L.s * (kt ? 0.45 : bite * 0.2); });
  if (J.neck) J.neck.rotation.z = 0.4 + (kt === 1 ? 0.5 : kt === 2 ? -0.25 : 0) + Math.sin(ph) * 0.04;
  if (J.head && z.k === 'ktail') J.head.rotation.z = z.kc ? -0.35 : atk ? -bite * 0.3 : 0;
  if (J.drill) J.drill.rotation.x += dt * (atk ? 30 : 6);
  if (J.arms) J.arms.forEach((a, n) => { a.rotation.z = (z.k === 'kdig' ? -0.6 + (atk ? Math.sin(t * 10 + n * 3) * 0.8 : Math.sin(ph + n * Math.PI) * 0.3 * amp) : -0.8 + (atk ? bite * 0.6 : 0)); });
  if (J.tor) J.tor.rotation.z = (z.k === 'kjaw' ? 0.25 : z.k === 'kdig' ? 0.35 : 0) + (z.kc && kt === 1 ? -0.15 : 0) + (z.k === 'ktail' && kt === 1 && !z.kc ? -0.1 : 0);
  // glow: brighter while winding up; hit flash
  J.glowA.opacity = kt ? 0.9 : 0.35 + Math.sin(t * 3) * 0.1; if (J.throat) J.throat.scale.setScalar(kt ? 1.4 : 1);
  // telegraphs on the ground: the breath cone, the sweep ring, the charge lane
  if (J.tell) { J.tell.visible = kt === 1 && !z.kc || (z.k === 'kjaw' && kt === 2); J.tell.material.opacity = kt === 1 ? 0.18 + Math.sin(t * 16) * 0.08 : 0.1; }
  if (J.lane) J.lane.visible = !!z.kc && kt === 1;
  const s = z.hitT > 0 ? 1.03 : 1; g.scale.setScalar(s);
}
function kaijuSweep() { for (const [k, K] of KAIJU) { if (!K.seen) { K.g.visible = false; if (k[0] === 'c' ? !RND.corpses.some(c => 'c' + (c.id != null ? c.id : c.seed) + c.k === k) : !W.zs.some(z => 'z' + z.id + z.k === k)) { K.g.parent && K.g.parent.remove(K.g); KAIJU.delete(k); } } K.seen = 0; } }
