/* ================= entities, movement, camera ================= */
const W = { ents: [], byId: new Map(), nid: 1, t: 0, zone: null, P: [null, null], me: 0, paused: false, cine: false };
const CAM = { yaw: PI, pitch: 0.38, dist: BAL.camDef, zoom: 1, zoomT: 1, tx: 0, ty: 0, tz: 0, lock: null, cine: null };
function entPos(e) { return new V3(e.x, e.y, e.z); }
function mkEnt(o) {
  const e = Object.assign({ id: W.nid++, type: 'npc', name: '', title: '', lv: 1, team: 2, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rot: 0, r: 0.4, h: 1.7, hp: 100, hpMax: 100, mp: 100, mpMax: 100, atk: 10, def: 0, spd: BAL.walk, cds: {}, buffs: [], A: { t: 0 }, alive: true, onGround: true, vis: true, tag: null }, o);
  if (e.spec) { e.R = buildRig(e.spec); e.root = e.R.root; e.A = e.R.A; if (e.scale) e.root.scale.setScalar(e.scale); e.h = (e.R.h || 1.7) * (e.scale || 1); e.root.shadow = e.r; R3.scene.add(e.root); }
  if (e.y === 0 && TER.h) e.y = groundH(e.x, e.z);
  e.home = { x: e.x, z: e.z, rot: e.rot };
  W.ents.push(e); W.byId.set(e.id, e); return e;
}
function rmEnt(e) { if (!e) return; e.removed = true; if (e.root) { e.root.removeFromParent(); } if (e.plate) { e.plate.remove(); e.plate = null; } W.ents = W.ents.filter(x => x !== e); W.byId.delete(e.id); }
function entByTag(tag) { return W.ents.find(e => e.tag === tag && !e.removed); }
function entsByTag(tag) { return W.ents.filter(e => e.tag === tag && !e.removed); }
function fwd(e) { return [Math.sin(e.rot), Math.cos(e.rot)]; }
function faceTo(e, x, z, k = 1) { const a = Math.atan2(x - e.x, z - e.z); e.rot = k >= 1 ? a : angLerp(e.rot, a, k); }
function edist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
/* ---------- physics: walk on terrain, collide with static props and other bodies ---------- */
function moveEnt(e, dx, dz, dt) {
  if (e.fixed) return;
  let nx = e.x + dx, nz = e.z + dz;
  if (!e.ghost) {
    // too-steep terrain blocks walking uphill (cliffs) unless flying
    if (!e.fly) { const h0 = terrH(e.x, e.z), h1 = terrH(nx, nz), step = Math.hypot(dx, dz) || 1e-6; if ((h1 - h0) / step > BAL.slopeMax * (e.climb || 1) && h1 > e.y + 0.2) { const hx = terrH(nx, e.z), hz = terrH(e.x, nz); if ((hx - h0) / step <= BAL.slopeMax) nz = e.z; else if ((hz - h0) / step <= BAL.slopeMax) nx = e.x; else { nx = e.x; nz = e.z; } } }
    if (!e.fly || e.y < terrH(nx, nz) + 3) [nx, nz] = collide(nx, nz, e.r, e.y);
    const S = TER.size / 2 - 8; nx = clamp(nx, -S, S); nz = clamp(nz, -S, S);
    if (W.zone && W.zone.walls) for (const wl of W.zone.walls) { if (wl.on && !wl.on()) continue; const d = Math.hypot(nx - wl.x, nz - wl.z); if (wl.out ? d > wl.r - e.r : d < wl.r + e.r) { const a = Math.atan2(nz - wl.z, nx - wl.x), rr2 = wl.out ? wl.r - e.r : wl.r + e.r; nx = wl.x + Math.cos(a) * rr2; nz = wl.z + Math.sin(a) * rr2; if (wl.msg && e.type === 'player' && W.t - (wl.mt || 0) > 3) { wl.mt = W.t; toast(wl.msg); } } }
  }
  e.x = nx; e.z = nz;
}
function separate() { // soft separation between bodies
  const L = W.ents; for (let i = 0; i < L.length; i++) { const a = L[i]; if (!a.alive || a.ghost || a.fixed || a.noPush) continue; for (let j = i + 1; j < L.length; j++) { const b = L[j]; if (!b.alive || b.ghost || b.noPush) continue; const dx = b.x - a.x, dz = b.z - a.z, m = a.r + b.r; if (Math.abs(dx) > m || Math.abs(dz) > m) continue; const d = Math.hypot(dx, dz); if (d < m && d > 1e-4) { const p = (m - d) / d * 0.5, wa = b.fixed ? 1 : a.heavy && !b.heavy ? 0.15 : b.heavy && !a.heavy ? 0.85 : 0.5; if (!a.fixed) { a.x -= dx * p * wa * 2 * 0.5; a.z -= dz * p * wa; } if (!b.fixed) { b.x += dx * p * (1 - wa); b.z += dz * p * (1 - wa); } } } }
}
function physEnt(e, dt) {
  const g = groundH(e.x, e.z, e.y), wl = waterAt(e.x, e.z);
  e.swim = !e.fly && wl > g + e.h * 0.55 && !e.noSwim;
  if (e.fly) { const tgtY = Math.max(g, wl) + (e.flyH ?? 3.5); e.y = lerp(e.y, tgtY + (e.vy > 0 ? 1 : 0), Math.min(1, dt * 3)); e.onGround = false; e.vy = 0; return; }
  if (e.swim) { e.y = lerp(e.y, wl - e.h * 0.55, Math.min(1, dt * 6)); e.vy = 0; e.onGround = false; return; }
  e.vy -= BAL.grav * dt * (e.gk || 1); e.y += e.vy * dt;
  if (e.y <= g) { if (!e.onGround && e.vy < -14 && e.type === 'player') { sfx('land'); dust(e.x, g, e.z, 6); } e.y = g; e.vy = 0; e.onGround = true; }
  else if (e.y > g + 0.05) e.onGround = false;
  if (e.onGround && g - e.y > -0.6) e.y = g;
}
/* ---------- per-frame sync of drawables ---------- */
function syncEnt(e, dt) {
  if (!e.root) return; const o = e.root;
  o.position.set(e.x, e.y + (e.dy || 0), e.z); o.groundY = groundH(e.x, e.z); if (e.swim) o.groundY = e.y;
  if (!e.R) { o.rotation.y = e.rot; o.visible = e.vis; if (e.spin) o.rotation.z = W.t * e.spin; return; }
  if (e.R.kind === 'bird' && e.fly) o.position.y += Math.sin(W.t * 3 + e.id) * 0.15;
  e.dispRot = e.dispRot == null ? e.rot : angLerp(e.dispRot, e.rot, Math.min(1, dt * 14)); o.rotation.y = e.dispRot;
  const A = e.A; A.spd = e.mvSpd || 0; A.vy = e.vy; A.fly = e.fly;
  if (!e.alive && e.type === 'mob') { A.spd = 0; A.pose = e.R.kind === 'human' ? 'down' : 'dead'; }
  A.talkOn = DLG.open && DLG.e === e && DLG.typing < DLG.full.length;
  o.visible = e.vis; o.shadow = e.swim ? 0 : e.r * (e.R.kind === 'human' ? 1.1 : 1.2) * (e.scale || 1);
  if (o.visible && onScreen(e.x, e.z, 8)) poseRig(e.R, A, dt);
}
/* ================= camera: a fixed 3/4 top-down view that follows the hero; cinematic pans for the story ================= */
function updateCam(dt) {
  const C = CAM;
  if (W.cine && C.cine) { const S = C.cine; S.t += dt; const q = S.d ? smooth(clamp(S.t / S.d, 0, 1)) : 1; C.tx = lerp(S.x0, S.x1, q); C.tz = lerp(S.z0, S.z1, q); C.zoom = lerp(S.k0, S.k1, q); }
  else { const me = W.P[W.me]; if (me) { const q = Math.min(1, dt * 6); C.tx = lerp(C.tx, me.x + (me.vx || 0) * 0, q); C.tz = lerp(C.tz, me.z, q); } C.zoom = lerp(C.zoom, C.zoomT, Math.min(1, dt * 5)); }
  V.cx = C.tx; V.cz = C.tz - 0.6; V.zoom = C.zoom;
  if (V.shake > 0) { const s = V.shake * 40; V.sx = (Math.random() - 0.5) * s; V.sy = (Math.random() - 0.5) * s; V.shake = Math.max(0, V.shake - dt * 2.5); } else V.sx = V.sy = 0;
}
function camBlocked() { return false; }
/* cinematic camera: a 3D-style shot (camera position, look-at point) becomes a 2D pan to the look point with a zoom from the distance */
function shotZoom(d) { return clamp(1.62 - d * 0.028, 0.62, 1.5); }
function camShot(pos, look, d = 1.2) { const dd = Math.hypot(pos[0] - look[0], pos[1] - look[1], pos[2] - look[2]); CAM.cine = { x0: CAM.tx, z0: CAM.tz, k0: CAM.zoom, x1: look[0], z1: look[2], k1: shotZoom(dd), t: 0, d }; W.cine = true; }
function camShotOn(e, o = {}) { const d = o.d ?? Math.max(3, e.h * 2.2); CAM.cine = { x0: CAM.tx, z0: CAM.tz, k0: CAM.zoom, x1: e.x, z1: e.z - e.h * 0.3, k1: shotZoom(d), t: 0, d: o.t ?? 1.0 }; W.cine = true; }
function camRelease() { W.cine = false; CAM.cine = null; }
