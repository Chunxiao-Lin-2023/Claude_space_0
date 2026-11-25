/* ================= (round 42) attack effects that read as skills and as things being thrown =================
   Soft, gradient shapes for the pooled fx meshes (additive, vertex-coloured so their edges fade instead of ending in a hard line):
   'cres' a crescent swing (opening along +x, flat), 'shock' a soft ground ring, 'wave' a standing band (sound / force waves),
   'claw' three raking streaks (in a plane facing +x), 'cone' a spray cone from its tip along +x.
   Plus: glowing particles (any bright particle glows and fades instead of being a hard cube), halos on things in flight. */
const FXGEO = {
  cres: () => { const g = new THREE.RingGeometry(0.58, 1, 36, 3, -1.25, 2.5), P = g.attributes.position, C = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), r = Math.hypot(x, y), t = (Math.atan2(y, x) + 1.25) / 2.5, rr = (r - 0.58) / 0.42, b = Math.pow(Math.sin(Math.PI * t), 0.7) * (0.25 + 0.75 * rr * rr); C.push(b, b, b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g.rotateX(-Math.PI / 2); },
  shock: () => { const g = new THREE.RingGeometry(0.45, 1, 56, 4), P = g.attributes.position, C = [];
    for (let i = 0; i < P.count; i++) { const r = Math.hypot(P.getX(i), P.getY(i)), b = Math.max(0, 1 - Math.abs(r - 0.84) / (r < 0.84 ? 0.39 : 0.16)); C.push(b, b, b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g.rotateX(-Math.PI / 2); },
  wave: () => { const g = new THREE.CylinderGeometry(1, 1, 0.6, 48, 4, true), P = g.attributes.position, C = [];
    for (let i = 0; i < P.count; i++) { const b = Math.max(0, 1 - Math.abs(P.getY(i)) / 0.3); C.push(b, b, b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g; },
  claw: () => { const pos = [], col = [], idx = []; let v = 0;
    for (let s = -1; s <= 1; s++) { const N = 10, off = s * 0.13; for (let k = 0; k <= N; k++) { const t = k / N, z = -0.36 + t * 0.72, y = off + (t - 0.5) * 0.42 + Math.sin(t * Math.PI) * 0.05, w = 0.035 * Math.sin(Math.PI * t) + 0.004, b = Math.pow(Math.sin(Math.PI * t), 0.6);
      pos.push(0, y + w, z, 0, y - w, z); col.push(b, b, b, b, b, b); if (k) idx.push(v - 2, v - 1, v, v - 1, v + 1, v); v += 2; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g; },
  cone: () => { const g = new THREE.ConeGeometry(0.5, 1, 24, 5, true).rotateZ(Math.PI / 2).translate(0.5, 0, 0), P = g.attributes.position, C = [];
    for (let i = 0; i < P.count; i++) { const t = clamp(P.getX(i), 0, 1), b = (1 - t) * 0.8 + 0.2 * Math.sin(Math.PI * t); C.push(b, b, b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g; },
};
// a sword / claw / knife swing: a bright crescent with a white core, sweeping out from r·0.6 to r
function fxSlash(x, y, z, yaw, r, col, o) { o = o || {}; const roll = o.roll || 0, life = o.life || 0.17;
  fxAdd({ kind: 'cres', x, y, z, s0: r * 0.62, s1: r, life, col, op: 1, yaw, roll }); fxAdd({ kind: 'cres', x, y, z: z + 0.01, s0: r * 0.5, s1: r * 0.86, life: life * 0.75, col: '#ffffff', op: 0.75, yaw, roll }); }
// raking marks across whoever was hit, facing the attacker (yaw = angle from the victim to the attacker)
function fxClaw(x, y, z, yaw, col, s) { s = s || 1; fxAdd({ kind: 'claw', x: x + Math.cos(yaw) * 0.42 * s, y: y + Math.sin(yaw) * 0.42 * s, z, s0: 0.75 * s, s1: 1.15 * s, life: 0.26, col, op: 1, yaw, pitch: 0.75 }); fxAdd({ kind: 'claw', x: x + Math.cos(yaw) * 0.44 * s, y: y + Math.sin(yaw) * 0.44 * s, z, s0: 0.7 * s, s1: 1.05 * s, life: 0.16, col: '#ffffff', op: 0.8, yaw, pitch: 0.75 }); }
// a shock ring along the ground, with a darker dust ring a beat behind
function fxShock(x, y, z, r, col, dust) { fxAdd({ kind: 'shock', x, y, z: z + 0.06, s0: r * 0.25, s1: r, life: 0.42, col, op: 0.95 }); if (dust) fxAdd({ kind: 'shock', x, y, z: z + 0.05, s0: r * 0.2, s1: r * 0.8, life: 0.7, col: dust, op: 0.6 }); }
// a splash of liquid: a crown ring, glowing droplets thrown up and out, a few that hang
function fxSplash(x, y, z, r, col, col2, n) { fxShock(x, y, z, r, col); fxAdd({ kind: 'ball', x, y, z: z + 0.15, s0: 0.1, s1: r * 0.35, life: 0.16, col: col2 || col, op: 0.35 });
  for (let k = 0; k < (n || 16); k++) { const a = FXR() * 6.283, v = frnd(1.5, 4.5) * r; addP({ x, y, z: z + 0.1, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: frnd(1.5, 4.5), g: 11, col: k % 3 ? col : (col2 || '#ffffff'), s: frnd(0.05, 0.09), life: frnd(0.35, 0.6), floor: z }); } }
// a flash where something goes off
function fxFlash(x, y, z, r, col) { fxAdd({ kind: 'ball', x, y, z, s0: r * 0.2, s1: r * 0.55, life: 0.1, col: '#fff4e0', op: 0.6 }); if (col) fxAdd({ kind: 'ball', x, y, z, s0: r * 0.35, s1: r, life: 0.2, col, op: 0.3 }); }
// --- glowing particles: any bright particle is drawn as a soft additive spark that dims as it dies
const PGLOW = {}; function pGlow(c) { if (PGLOW[c] == null) { const q = new THREE.Color(c); PGLOW[c] = 0.299 * q.r + 0.587 * q.g + 0.114 * q.b > 0.58 || Math.max(q.r, q.g, q.b) - Math.min(q.r, q.g, q.b) > 0.55 && Math.max(q.r, q.g, q.b) > 0.75; } return PGLOW[c]; }
// --- things in flight: a halo, a short streak behind, drips / sparks (called for each projectile while drawing them)
const PROJFX = { acid: ['#9dff3a', 0.24, '#d8ff90'], goo: ['#b46cff', 0.3, '#e8c8ff'], nade: ['#ff5a3a', 0.12, '#ffd0a0'], arrow: ['#ff6a4a', 0.1, '#fff0d0'] };
function projFx(b, dt) {
  const F = PROJFX[b.k]; if (!F || RND._nh >= 80) return; const [col, R, col2] = F; let rr = R, c = col;
  if (b.k === 'nade') { const blink = Math.sin(W.t * 18 + (b.x * 7)) > 0.2; c = ['#ff5a3a', '#5fe0c8', '#e8ecf0', '#ffb040'][b.gt || 0] || '#ff5a3a'; rr = blink ? 0.16 : 0.08; }
  setInst(OBJ.halo, RND._nh++, b.x, b.z, b.y, 0, rr, rr, rr, c);
  const sp = Math.hypot(b.vx, b.vy, b.vz) || 1, L = b.k === 'arrow' ? 0.9 : b.k === 'nade' ? 0.35 : 0.5, f = L / sp;
  RND.tracers.push({ x: b.x - b.vx * f, y: b.y - b.vy * f, z: b.z - b.vz * f, x2: b.x, y2: b.y, z2: b.z, t: 0, life: 0.035, w: b.k === 'arrow' ? 0.035 : b.k === 'nade' ? 0.025 : R * 0.45, col: new THREE.Color(b.k === 'nade' ? '#8a8a8a' : col).toArray() });
  if (b.k === 'acid' || b.k === 'goo') { if (Math.random() < 0.55) addP({ x: b.x + frnd(-0.06, 0.06), y: b.y + frnd(-0.06, 0.06), z: b.z - 0.05, vx: b.vx * 0.1, vy: b.vy * 0.1, vz: -0.6, g: 7, col: Math.random() < 0.5 ? col : col2, s: frnd(0.04, 0.07), life: 0.45 }); }
  else if (b.k === 'nade' && Math.random() < 0.4) addP({ x: b.x, y: b.y, z: b.z, vx: 0, vy: 0, vz: 0.3, g: -0.2, col: '#9a958a', s: 0.06, life: 0.5, smoke: 1 });
}
/* ================= (round 43) fusion parts and 苍隼 fusions: flying blade waves, whirlwinds, the dive, the landing moves ================= */
function fusFxTick(dt) {
  if (RND.bwaves && RND.bwaves.length) { for (const w of RND.bwaves) { w.t += dt; const u = Math.min(1, w.t / w.T), d = w.L * u, x = w.x + Math.cos(w.a) * d, y = w.y + Math.sin(w.a) * d, z = lerp(w.z, w.gz + 0.6, u);
      fxAdd({ kind: 'cres', x, y, z, s0: 1.25, s1: 1.3, life: 0.05, col: '#ffa040', op: 0.85 * (1 - u * 0.4), yaw: w.a }); fxAdd({ kind: 'cres', x, y, z: z + 0.01, s0: 1.0, s1: 1.05, life: 0.05, col: '#ffffff', op: 0.6, yaw: w.a });
      if (FXR() < 0.7) addP({ x: x + frnd(-0.4, 0.4), y: y + frnd(-0.4, 0.4), z, vx: 0, vy: 0, vz: 0.3, g: 0, col: '#ffd0a0', s: 0.06, life: 0.25 }); } RND.bwaves = RND.bwaves.filter(w => w.t < w.T); }
  if (RND.whirls && RND.whirls.length) { for (const w of RND.whirls) { w.t += dt; const k = Math.min(1, w.t / 0.25) * (w.t > w.T - 0.3 ? Math.max(0, (w.T - w.t) / 0.3) : 1); if (k <= 0) continue;
      const H = w.big > 1; /* (round 45) 风暴陨击's tornado: taller, wider, denser */ for (let q = 0; q < (H ? 14 : w.big ? 7 : 3); q++) { const h = FXR() * (H ? 7 : w.big ? 4.2 : 2.6), a = W.t * (H ? 7 : 9) + FXR() * 6.28 + h, r = (0.4 + h * 0.55) * k * (H ? 1.9 : w.big ? 1.5 : 1); addP({ x: w.x + Math.cos(a) * r, y: w.y + Math.sin(a) * r, z: w.z + 0.1 + h, vx: -Math.sin(a) * 4, vy: Math.cos(a) * 4, vz: 0.6, g: 0, col: q ? '#dff8ff' : '#9fe8ff', s: 0.07, life: 0.3 }); }
      for (let q = 0; q < (H ? 3 : 1); q++) if (FXR() < 0.5) addP({ x: w.x + frnd(-2.5, 2.5) * (H ? 2.4 : 1), y: w.y + frnd(-2.5, 2.5) * (H ? 2.4 : 1), z: w.z + 0.2, vx: 0, vy: 0, vz: 0.8, g: -0.2, col: H ? '#c8c2b4' : '#a89a80', s: 0.16, life: 0.6, smoke: 1 });
      if (H && thr('whH' + w.id, 0.05)) { const a = FXR() * 6.28, r = frnd(5, 9.5); addP({ x: w.x + Math.cos(a) * r, y: w.y + Math.sin(a) * r, z: w.z + 0.3, vx: -Math.cos(a) * 7 - Math.sin(a) * 5, vy: -Math.sin(a) * 7 + Math.cos(a) * 5, vz: 0.4, g: 0, col: '#dff8ff', s: 0.09, life: 0.7 }); } /* the inflow: streaks rushing in from the edge */
      if (thr('wh' + w.id, 0.12)) { fxAdd({ kind: 'wave', x: w.x, y: w.y, z: w.z + 0.5, s0: 1.4 * k, s1: 0.6 * k, life: 0.3, col: '#9fe8ff', op: 0.3, sy: 1.6 }); fxAdd({ kind: 'shock', x: w.x, y: w.y, z: w.z + 0.05, s0: H ? 9 : 3.6, s1: 1.0, life: H ? 0.5 : 0.35, col: '#cfefff', op: 0.35 }); if (H) fxAdd({ kind: 'wave', x: w.x, y: w.y, z: w.z + 3, s0: 3.2 * k, s1: 1.6 * k, life: 0.3, col: '#cfefff', op: 0.25, sy: 2.6 }); } }
    whirlFunnels(); RND.whirls = RND.whirls.filter(w => w.t < w.T); }
  else whirlFunnels();
  // the landing spot, the last half second of the flight: a ring on the driver's aim point (≤ 8)
  const F = W.fus; if (F && fusFlyKind(F) === 1) { const left = F.fly ? F.fly.T - F.fly.t : F.flyL || 0; if (left > 0 && left < 0.55) { const D = W.p[F.d]; if (D) { const tg = D.aimPt && !D.aimPt.auto ? D.aimPt : { x: D.x + Math.cos(D.aim) * 6, y: D.y + Math.sin(D.aim) * 6 }, a = Math.atan2(tg.y - D.y, tg.x - D.x), dd = Math.min(BAL.fDiveR, Math.hypot(tg.x - D.x, tg.y - D.y)), x = D.x + Math.cos(a) * dd, y = D.y + Math.sin(a) * dd, gz = surfZ(x, y, skyTop(x, y));
      fxAdd({ kind: 'shock', x, y, z: gz + 0.05, s0: 3.2, s1: 3.2, life: 0.04, col: '#ffd040', op: 0.75 }); fxAdd({ kind: 'shock', x, y, z: gz + 0.06, s0: 3.2 * (left / 0.55), s1: 3.2 * (left / 0.55), life: 0.04, col: '#ffffff', op: 0.5 }); } } }
  const fd = RND.fdv; if (fd) { fd.t = W.t - fd.t0; if (fd.t > 0.32) RND.fdv = null; else { const u = fd.t / 0.3, x = lerp(fd.x0, fd.x, u), y = lerp(fd.y0, fd.y, u), z = lerp(fd.z0, fd.z, u * u); const m = OBJ.pl[fd.o]; if (m && m.g.visible) m.g.position.set(x, z, y); for (let k = 0; k < 3; k++) addP({ x: x + frnd(-0.3, 0.3), y: y + frnd(-0.3, 0.3), z: z + 1 + FXR(), vx: 0, vy: 0, vz: 0, g: 0, col: k ? '#9fe8ff' : '#ffffff', s: 0.1, life: 0.3 }); if (fd.px != null) RND.tracers.push({ x: fd.px, y: fd.py, z: fd.pz, x2: x, y2: y, z2: z + 1.2, t: 0, life: 0.3, w: 0.35, col: fusRGB('#9fe8ff') }); fd.px = x; fd.py = y; fd.pz = z + 1.2; } }
}
function fusFxEvent(e) {
  switch (e.k) {
    case 'ffly': { fxShock(e.x, e.y, e.z, 3.2, '#cfefff', '#a89a80'); fxAdd({ kind: 'wave', x: e.x, y: e.y, z: e.z + 0.3, s0: 0.8, s1: 2.6, life: 0.4, col: '#9fe8ff', op: 0.45 }); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; addP({ x: e.x, y: e.y, z: e.z + 0.2, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, vz: frnd(0.5, 2), g: 1, col: '#a89a80', s: 0.18, life: 0.7, smoke: 1 }); } sfx('gyro', e.x, e.y); if (W.fus && (fusOf(W.p[ME]))) toast('翼能满了：起飞！4 秒后俯冲到你瞄准的地方', '#9fe8ff'); return true; }
    case 'fdive': RND.fdv = { o: e.o, x0: e.x0, y0: e.y0, z0: e.z0, x: e.x, y: e.y, z: e.z, t0: W.t, t: 0 }; sfx('mdash', e.x, e.y); return true;
    case 'fland': if (NETROLE === 'guest') for (const i of e.ps) { const q = W.p[i]; if (q && i === ME) { q.mfly = false; q.land = false; q.alt = 0; q.x = e.x; q.y = e.y; q.L = skyTop(e.x, e.y); q.z = surfZ(e.x, e.y, q.L); q.zv = q.z; q.jz = 0; } } return true;
    case 'fdhit': { const R = e.kk === '3-5' ? 3.5 : e.kk === '2-5' ? 3.2 : 3; fxFlash(e.x, e.y, e.z + 0.4, 1.6, '#9fe8ff'); fxShock(e.x, e.y, e.z, R * 1.15, '#ffffff', '#5a5040'); fxShock(e.x, e.y, e.z, R * 0.8, '#9fe8ff'); debrisFx(e.x, e.y, e.z + 0.05, '#7a6a58', 12); shake(e.x, e.y, 0.6); sfx('boom', e.x, e.y);
      if (e.kk === '2-5') { for (const s of [-1, 1]) (RND.bwaves = RND.bwaves || []).push({ x: e.x, y: e.y, z: e.z + 0.6, gz: e.z, a: e.a + s * Math.PI / 2, L: 6, t: 0, T: 0.3 }); fxSlash(e.x, e.y, e.z + 0.8, e.a, 3.2, '#ffa040'); }
      else if (e.kk === '1-5') { for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; RND.tracers.push({ x: e.x, y: e.y, z: e.z + 1.2, x2: e.x + Math.cos(a) * 4, y2: e.y + Math.sin(a) * 4, z2: e.z + 0.4, t: 0, life: 0.18 + k * 0.012, w: 0.05, col: fusRGB('#ffd27a') }); } }
      else if (e.kk === '3-5') { for (let k = 0; k < 10; k++) addP({ x: e.x, y: e.y, z: e.z + 0.6, vx: frnd(-4, 4), vy: frnd(-4, 4), vz: frnd(2, 5), g: 9, col: k % 2 ? '#b8893a' : '#e8d9a8', s: frnd(0.1, 0.18), life: 0.9, floor: e.z }); }
      else { for (let k = 0; k < 20; k++) { const a = FXR() * 6.283; addP({ x: e.x, y: e.y, z: e.z + 0.8, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, vz: frnd(1, 4), g: 6, col: k % 2 ? '#dff8ff' : '#59b8ff', s: 0.08, life: 0.6 }); } }
      return true; }
    case 'bwave': (RND.bwaves = RND.bwaves || []).push({ x: e.x, y: e.y, z: e.z, gz: e.gz, a: e.a, L: e.L, t: 0, T: 0.32 }); sfx('mslash', e.x, e.y); return true;
    case 'whirl': (RND.whirls = RND.whirls || []).push({ x: e.x, y: e.y, z: e.z, t: 0, T: e.t, id: Math.random(), big: e.big }); RND.tracers.push({ x: e.x0, y: e.y0, z: e.z + 1.6, x2: e.x, y2: e.y, z2: e.z + 1, t: 0, life: 0.25, w: 0.25, col: fusRGB('#9fe8ff') }); sfx('gyro', e.x, e.y); return true;
  }
  return false;
}
/* (round 45) a visible funnel for each whirlwind: two open cones (pale wind + a darker dust band near the ground), normal blending so they read on a
   bright day as well as at night; the 风暴陨击 tornado (big 2) is a tall wide one, the ultimates' (big 1) medium, the glide's small */
const WFUN = []; let WFTEX = null;
function wfTex() { if (WFTEX) return WFTEX; const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); g.clearRect(0, 0, 64, 128); /* diagonal wind streaks, soft-edged */
  for (let k = -4; k < 10; k++) { const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + (0.55 + (k % 3) * 0.15) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.translate(0, k * 16); g.transform(1, 0.45, 0, 1, 0, 0); g.fillStyle = gr; g.fillRect(0, 0, 64, 5 + (k % 2) * 3); g.restore(); }
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, 64, 128); WFTEX = new THREE.CanvasTexture(c); WFTEX.wrapS = WFTEX.wrapT = THREE.RepeatWrapping; WFTEX.repeat.set(3, 1); return WFTEX; }
function whirlFunnels() { const L = RND.whirls || []; let n = 0;
  for (const w of L) { const k = Math.min(1, w.t / 0.25) * (w.t > w.T - 0.3 ? Math.max(0, (w.T - w.t) / 0.3) : 1); if (k <= 0.01) continue; let F = WFUN[n];
    if (!F) { F = new THREE.Group(); const mk = (r0, r1, h, col, op) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 28, 6, true).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ color: col, map: wfTex(), transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide })); m.userData.op = op; F.add(m); return m; };
      mk(0.35, 1.6, 4.2, '#e8f4f8', 0.55); mk(0.5, 1.15, 3.2, '#ffffff', 0.4); mk(0.9, 1.5, 1.0, '#a89a82', 0.6); for (const c of F.children) c.renderOrder = 5; SCN.add(F); WFUN[n] = F; }
    const S = w.big > 1 ? 2.4 : w.big ? 1.5 : 0.85; F.visible = true; F.position.set(w.x, w.z, w.y); F.scale.set(S * k, S * (0.5 + 0.5 * k), S * k);
    F.children[0].rotation.y = W.t * 5; F.children[1].rotation.y = -W.t * 7; F.children[2].rotation.y = W.t * 3; F.children.forEach((c, i) => { c.material.opacity = c.userData.op * k * (1 + 0.15 * Math.sin(W.t * 11 + i * 2)); c.scale.x = c.scale.z = 1 + 0.06 * Math.sin(W.t * 9 + i); }); n++; }
  for (let i = n; i < WFUN.length; i++) WFUN[i].visible = false; }
/* ================= (round 44) anti-air throws: what a melee mech / beast sends up at a flyer it can't reach ================= */
const AAK = { blade: ['#ffa040', '#ffffff', 'cres'], shield: ['#5fe0ff', '#cfefff', 'ring'], venom: ['#7dff5a', '#d8ff90', 'ball'], fire: ['#ff7a2a', '#ffd27a', 'ball'], moon: ['#cfe8ff', '#ffffff', 'cres'], water: ['#5ab8ff', '#e0f4ff', 'ball'], rock: ['#8a7a60', '#c8b898', 'rock'] };
function aaFxTick(dt) { if (!RND.aas || !RND.aas.length) return;
  for (const r of RND.aas) { r.t += dt; const u = Math.min(1, r.t / r.T), x = lerp(r.x, r.e[0], u), y = lerp(r.y, r.e[1], u), z = lerp(r.z, r.e[2], u) + Math.sin(u * Math.PI) * (r.kd === 'rock' ? 0.8 : 0.2), K = AAK[r.kd] || AAK.fire, yaw = Math.atan2(r.e[1] - r.y, r.e[0] - r.x);
    if (K[2] === 'cres') { fxAdd({ kind: 'cres', x, y, z, s0: 0.75, s1: 0.8, life: 0.04, col: K[0], op: 0.9, yaw, roll: 0.9 }); fxAdd({ kind: 'cres', x, y, z: z + 0.01, s0: 0.55, s1: 0.6, life: 0.04, col: K[1], op: 0.6, yaw, roll: 0.9 }); }
    else if (K[2] === 'ring') fxAdd({ kind: 'ring', x, y, z, s0: 0.45, s1: 0.5, life: 0.04, col: K[0], op: 0.85 });
    else if (K[2] === 'rock') { fxAdd({ kind: 'ball', x, y, z, s0: 0.22, s1: 0.24, life: 0.04, col: K[1], op: 0.25 }); addP({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, col: K[0], s: 0.22, life: 0.035 }); }
    else { fxAdd({ kind: 'ball', x, y, z, s0: 0.26, s1: 0.3, life: 0.04, col: K[0], op: 0.75 }); fxAdd({ kind: 'ball', x, y, z, s0: 0.12, s1: 0.14, life: 0.04, col: K[1], op: 0.9 }); }
    for (let k = 0; k < 2; k++) addP({ x: x + frnd(-0.12, 0.12), y: y + frnd(-0.12, 0.12), z, vx: 0, vy: 0, vz: r.kd === 'venom' || r.kd === 'water' ? -1 : 0.3, g: r.kd === 'venom' || r.kd === 'water' ? 4 : 0, col: k ? K[0] : K[1], s: 0.06, life: 0.3, smoke: r.kd === 'rock' ? 1 : 0 }); }
  RND.aas = RND.aas.filter(r => r.t < r.T); }
function aaFxEvent(e) { const K = AAK[e.kd] || AAK.fire;
  if (e.k === 'aa') { (RND.aas = RND.aas || []).push({ x: e.x, y: e.y, z: e.z, e: e.e, T: Math.max(0.05, e.t), t: 0, kd: e.kd }); sfx(e.kd === 'blade' || e.kd === 'moon' ? 'mslash' : e.kd === 'rock' ? 'throw' : e.kd === 'fire' ? 'flamer' : 'spit', e.x, e.y); return; }
  fxFlash(e.x, e.y, e.z, 0.7, K[0]); for (let k = 0; k < 10; k++) { const a = FXR() * 6.283, v = frnd(1.5, 4); addP({ x: e.x, y: e.y, z: e.z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: frnd(-1, 2.5), g: 6, col: k % 2 ? K[0] : K[1], s: 0.06, life: 0.4 }); } if (thr('aah', 0.08)) sfx(e.kd === 'rock' ? 'thunk' : 'rhit', e.x, e.y); }
