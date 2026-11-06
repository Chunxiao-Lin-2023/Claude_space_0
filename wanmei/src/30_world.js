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
    if (!e.fly && !e.ghostTiles) { const r = Math.max(0.25, (e.r || 0.4) * 0.8); if (solidNear(nx, nz, r) && !solidNear(e.x, e.z, r)) { if (!solidNear(nx, e.z, r)) nz = e.z; else if (!solidNear(e.x, nz, r)) nx = e.x; else { nx = e.x; nz = e.z; } } }
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
  if (e.fly) { const k = Math.min(1, dt * 2.5), lh = liftH(e.x, e.z); e.vFlyH = e.vFlyH == null ? (e.flyH ?? 3.5) : lerp(e.vFlyH, e.flyH ?? 3.5, k); o.visLift = o.visLift == null ? lh : lerp(o.visLift, lh, k); o.flyElev = Math.max(0, e.vFlyH + Math.sin(W.t * 3 + e.id) * 0.15); } else { o.flyElev = null; o.visLift = null; e.vFlyH = null; }
  e.dispRot = e.dispRot == null ? e.rot : angLerp(e.dispRot, e.rot, Math.min(1, dt * 14)); o.rotation.y = e.dispRot;
  // animate from the distance actually travelled, not from what the AI asked for: no sliding, no walking on the spot
  const mv = e._lx == null ? 0 : Math.hypot(e.x - e._lx, e.z - e._lz) / Math.max(dt, 1e-3); e._lx = e.x; e._lz = e.z;
  e.vel = mv > 14 && !e.fly ? 0 : lerp(e.vel || 0, mv, Math.min(1, dt * 12)); if (e.vel < 0.05) e.vel = 0;
  const A = e.A; A.spd = e.vel; A.vy = e.vy; A.fly = e.fly;
  if (!e.alive && e.type === 'mob') { A.spd = 0; A.pose = e.R.kind === 'human' ? 'down' : 'dead'; }
  A.talkOn = DLG.open && DLG.e === e && DLG.typing < DLG.full.length;
  o.visible = e.vis; o.shadow = e.swim ? 0 : e.r * (e.R.kind === 'human' ? 1.1 : 1.2) * (e.scale || 1);
  if (o.visible && onScreen(e.x, e.z, 8)) poseRig(e.R, A, dt);
}
/* ================= camera: a fixed 3/4 top-down view that follows the hero; cinematic pans for the story ================= */
function updateCam(dt) {
  const C = CAM;
  if (W.cine && C.cine) { const S = C.cine; S.t += dt; const q = S.d ? smooth(clamp(S.t / S.d, 0, 1)) : 1; C.tx = lerp(S.x0, S.x1, q); C.tz = lerp(S.z0, S.z1, q); C.zoom = lerp(S.k0, S.k1, q); }
  else { const me = W.P[W.me]; if (me) { const q = Math.min(1, dt * 6), far = Math.hypot(C.tx - me.x, C.tz - me.z) > 30; C.tx = far ? me.x : lerp(C.tx, me.x, q); C.tz = far ? me.z : lerp(C.tz, me.z, q); } C.zoom = lerp(C.zoom, C.zoomT, Math.min(1, dt * 5)); }
  V.cx = C.tx; V.cz = C.tz - 0.6; V.zoom = C.zoom; fitLow(); clampCamToArea();
  if (V.shake > 0) { const s = V.shake * 14; V.sx = Math.round((Math.random() - 0.5) * s); V.sy = Math.round((Math.random() - 0.5) * s); V.shake = Math.max(0, V.shake - dt * 2.5); } else V.sx = V.sy = 0;
  camSnap();
}
function camBlocked() { return false; }
/* cinematic camera: a 3D-style shot (camera position, look-at point) becomes a 2D pan to the look point with a zoom from the distance */
function shotZoom(d) { return d < 7 ? 1.5 : d < 30 ? 1 : 0.5; }
function camShot(pos, look, d = 1.2) { const dd = Math.hypot(pos[0] - look[0], pos[1] - look[1], pos[2] - look[2]); CAM.cine = { x0: CAM.tx, z0: CAM.tz, k0: CAM.zoom, x1: look[0], z1: look[2], k1: shotZoom(dd), t: 0, d }; W.cine = true; }
function camShotOn(e, o = {}) { const d = o.d ?? Math.max(3, e.h * 2.2); CAM.cine = { x0: CAM.tx, z0: CAM.tz, k0: CAM.zoom, x1: e.x, z1: e.z - e.h * 0.3, k1: shotZoom(d), t: 0, d: o.t ?? 1.0 }; W.cine = true; }
function camRelease() { W.cine = false; CAM.cine = null; }

/* ---------- areas: the camera stays inside the current area; walking into a gap takes you to the next one ---------- */
function curArea() { const me = W.P[W.me]; const A = me ? areaAt(me.x, me.z) : null; return A || areaAt(CAM.tx, CAM.tz); }
function clampCamToArea() {
  const A = W.cine && CAM.cine ? (areaAt(CAM.tx, CAM.tz) || curArea()) : curArea(); W.area = A; if (!A) return;
  const hw = V.W / 2 / V.PPM, hh = V.H / 2 / V.PPM, x0 = A.x0 + 1, x1 = A.x1, z0 = A.z0 + 1, z1 = A.z1;
  V.cx = x1 - x0 < hw * 2 ? (x0 + x1) / 2 : clamp(V.cx, x0 + hw, x1 - hw);
  V.cz = z1 - z0 < hh * 2 ? (z0 + z1) / 2 : clamp(V.cz, z0 + hh - (V.camLift || 0), z1 - hh);
}
function maskOutsideArea(g) { const A = W.area; if (!A) return; const [ax, ay] = w2s0(A.x0, A.z0), [bx, by] = w2s0(A.x1 + 1, A.z1 + 1); g.fillStyle = '#0c0a0e'; if (ay > 0) g.fillRect(0, 0, V.W, ay); if (by < V.H) g.fillRect(0, by, V.W, V.H - by); if (ax > 0) g.fillRect(0, 0, ax, V.H); if (bx < V.W) g.fillRect(bx, 0, V.W - bx, V.H); }
const FOLLOW_AI = () => [typeof kidFollow === 'function' && kidFollow, typeof adultFollow === 'function' && adultFollow].filter(Boolean);
function areaTick(dt) {
  const me = W.P[W.me]; if (!me || !me.alive || W.cine || W.transit || DLG.open || STORY.running && !STORY.canTravel) return;
  const A = areaAt(me.x, me.z); if (!A) return;
  for (const L of A.links) if (inGap(A, L, me.x, me.z, 1.3)) { travel(me, A, L); return; }
}
async function travel(me, A, L) {
  W.transit = true; uiFade(true, 0.3); await wait(0.32);
  const [x, z] = gapPoint(L.to, L.toSide, L.toC, 3.2), rot = { n: 0, s: PI, w: HP, e: -HP }[L.toSide];
  const ox = me.x, oz = me.z, move = (e, dx, dz) => { teleport(e, x + dx, z + dz, rot); };
  move(me, 0, 0); if (NETROLE !== 'guest') { const p2 = W.P[1]; if (p2 && p2 !== me && p2.ctrl !== 'remote') move(p2, 1.4, 0.6);
    let k = 0; for (const e of W.ents) if (e.type === 'npc' && FOLLOW_AI().includes(e.npcAI) && d2(e.x, e.z, ox, oz) < 40 * 40) move(e, -1.5 + (k++ % 3) * 1.5, 1.8 + Math.floor(k / 3)); 
    if (typeof STORY !== 'undefined' && STORY.eagleChase) { const eg = entByTag('eagle'); if (eg) teleport(eg, x - Math.sin(rot) * 18, z - Math.cos(rot) * 18); } }
  CAM.tx = x; CAM.tz = z; uiFade(false, 0.35); toastArea(L.to.name); await wait(0.2); W.transit = false;
}
function toastArea(name) { if (typeof banner === 'function') banner(name, ''); }
