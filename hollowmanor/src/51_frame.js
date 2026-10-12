/* ================= per-frame visual update (works the same on host and guest) ================= */
const VIS = { hunt: 0, fear: 0, light: 0, nextBolt: 12, prevDoors: '', seenGhost: 0 };
function holderOf(W) { return W.p.find(p => p.role === 'L'); }
function seerOf(W) { return W.p.find(p => p.role === 'S'); }
/* how strongly the holder's flashlight lights a world point (0..1) */
function beamFactor(W, x, y, z, needFace) {
  const h = holderOf(W); if (!h || h.hide >= 0 || h.down) return 0;
  const hx = h.x + Math.cos(h.aim) * 0.35, hz = h.z + Math.sin(h.aim) * 0.35, d = dist(hx, hz, x, z);
  const boost = h.boostT > 0 ? 1 : 0, range = BAL.beamRange * (h.batt > 0.02 ? 1 : 0.45);
  if (d > range) return 0;
  const ang = Math.abs(angDiff(h.aim, Math.atan2(z - hz, x - hx)));
  const half = BAL.beamHalf * (boost ? 1.25 : 1) + (d < 1 ? 0.5 : 0);
  if (ang > half) return 0;
  if (!los(hx, hz, x - Math.cos(h.aim) * 0.15, z - Math.sin(h.aim) * 0.15, W)) return 0;
  if (needFace && Math.cos(needFace - (h.aim + PI)) < 0.15) return 0;
  return clamp((1 - ang / half) * 1.6, 0, 1) * clamp(1.2 - d / range, 0, 1) * (h.batt > 0.02 ? 1 : 0.5);
}
function renderFrame(W, meIdx, dt) {
  const t = performance.now() / 1000, me = W.p[meIdx], partner = W.p[1 - meIdx], seer = me.role === 'S';
  ensureChars();
  // ---- characters
  for (const p of W.p) { const R = charOf(p.role); poseChar(R, p, dt, t); }
  // ---- flashlight (holder)
  const h = holderOf(W), RL = charOf('L');
  RL.root.updateMatrixWorld(true);
  const lensP = new THREE.Vector3(); RL.lens.getWorldPosition(lensP);
  const on = h && h.hide < 0 && !h.down, boost = h && h.boostT > 0, weak = h && h.batt <= 0.02;
  const fl = R3.flashLight;
  let flick = 1; if (W.flick > 0 && Math.random() < W.flick * 0.35) flick = Math.random() * 0.3; if (weak) flick *= 0.35 + Math.random() * 0.15;
  fl.intensity = on ? (boost ? 700 : 190) * flick : 0; fl.angle = boost ? 0.55 : 0.42;
  fl.position.copy(lensP);
  if (h) fl.target.position.set(lensP.x + Math.cos(h.aim) * 6, 0.25, lensP.z + Math.sin(h.aim) * 6);
  fl.target.updateMatrixWorld();
  R3.flashFill.intensity = on ? 0.6 * flick : 0; R3.flashFill.position.set(lensP.x, 1.3, lensP.z);
  R3.beam.visible = !!on; R3.beam.position.copy(lensP); R3.beam.lookAt(fl.target.position); R3.beam.material.uniforms.uA.value = (boost ? 0.16 : 0.055) * flick;
  RL.lens.material.emissiveIntensity = on ? 2.5 * flick : 0;
  // ---- seer lantern
  const s = seerOf(W), RS = charOf('S');
  const lp = new THREE.Vector3(); RS.spiritFlame.getWorldPosition(lp);
  R3.lantern.position.copy(lp); R3.lantern.intensity = s && s.hide < 0 ? (s.down ? 0.6 : 2.4) * (0.9 + Math.sin(t * 9) * 0.08) : 0;
  RS.amulet.material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.4 + (W.g && dist(W.g.x, W.g.z, s.x, s.z) < 6 ? 1.5 : 0);
  // ---- ghost
  const G = W.g, gh = R3.ghost;
  if (G) {
    const hunting = G.st === 'hunt' || G.st === 'ritual';
    VIS.hunt = lerp(VIS.hunt, hunting ? 1 : 0, Math.min(1, dt * 3));
    gh.position.set(G.x, 0.08 + Math.sin(t * 1.3) * 0.05, G.z); gh.rotation.y = HP - G.a;
    const U = gh.userData; for (const a of U.arms) { a.sh.rotation.x = lerp(a.sh.rotation.x, hunting ? -1.25 + Math.sin(t * 6 + a.sx) * 0.08 : 0.15, dt * 4); a.sh.rotation.z = a.sx * (hunting ? 0.15 : 0.05); a.el.rotation.x = hunting ? -0.2 : 0.1; }
    U.wisps.forEach((w, i) => { w.rotation.x = PI + 0.3 + Math.sin(t * 2 + i) * 0.15 + (G.spd || 0) * 0.15; });
    U.head.rotation.z = Math.sin(t * 0.7) * 0.15 + (hunting ? Math.sin(t * 17) * 0.05 : 0);
    let a = 0, xray = false;
    if (G.st === 'gone') a = 0;
    else if (seer && !me.down) { const d = dist(G.x, G.z, me.x, me.z); if (d < 18) { const vis = los(me.x, me.z, G.x, G.z, W); a = vis ? 0.85 : 0.5; xray = !vis; } }
    if (!seer || a < 0.85) { const lit = beamFactor(W, G.x, 1.2, G.z) > 0.05 ? 0.8 : 0; a = Math.max(a, G.man || 0, lit); }
    a *= G.fade == null ? 1 : G.fade;
    GHOST_U.uAlpha.value = lerp(GHOST_U.uAlpha.value, a, Math.min(1, dt * 8)); GHOST_U.uTime.value = t; GHOST_U.uHunt.value = VIS.hunt; GHOST_U.uSpirit.value = seer ? 1 : 0;
    GHOST_U.uColor.value.setHex(hunting ? 0xc8e6ff : 0x9fd8ff);
    gh.visible = GHOST_U.uAlpha.value > 0.01;
    gh.traverse(o => { if (o.material && o.material.isShaderMaterial) o.material.depthTest = !xray; });
    R3.ghostLight.position.set(G.x, 1.5, G.z); R3.ghostLight.intensity = (G.man || 0) * 2.2 + VIS.hunt * 0.6; R3.ghostLight.color.setHex(hunting ? 0xa0c8ff : 0x9fd8ff);
    if (a > 0.3 && !seer) VIS.seenGhost = t;
  }
  // ---- doors, shutter, shelf
  for (const e of R3.doors) {
    if (!e) continue; const st = W.doors[e.d.idx], o = st.open;
    for (const l of e.leaves) l.hinge.rotation.y = l.side * o * 1.75;
    if (e.kind === 'shutter') { e.slide.position.y = o * 2.2; if (e.lamp) { const m = e.lamp.material; m.emissive.setHex(W.f.power ? 0x20ff40 : 0xff2010); } }
    if (e.kind === 'shelf') e.slide.position.x = -o * 1.5;
  }
  const dk = W.doors.map(d => d.open > 0.5 ? 1 : 0).join('');
  if (dk !== VIS.prevDoors) { VIS.prevDoors = dk; R3.moon.shadow.needsUpdate = true; }
  // wardrobes
  R3.hides.forEach((doors, i) => { if (!doors) return; const ta = W.hideA ? (W.now - (W.hideA[i] || -9)) : 9; const o = ta < 0.9 ? Math.sin(clamp(ta / 0.9, 0, 1) * PI) * 1.2 : 0; for (const d of doors) d.rotation.y = d.userData.side * o; });
  R3.levers.forEach((arm, i) => { if (arm) arm.rotation.x = lerp(arm.rotation.x, W.lv[i] > 0 ? 0.7 : -0.6, Math.min(1, dt * 10)); });
  R3.dials.forEach((d, i) => { const v = W.dials[i]; d.rotation.z = lerp(d.rotation.z, -v / 6 * TAU, Math.min(1, dt * 10)); d.userData.label.material.map = TEX.glyph[v]; d.userData.label.rotation.z = v / 6 * TAU * 0; });
  if (R3.fuseSlot) R3.fuseSlot.visible = !!W.f.power; if (R3.fuseLamp) R3.fuseLamp.material.emissive.setHex(W.f.power ? 0x20ff40 : 0xff2010);
  if (R3.gate) { const gt = R3.gate, sealA = W.f.seal ? 1 : 0; gt.sm.opacity = lerp(gt.sm.opacity, sealA * (0.7 + Math.sin(t * 2) * 0.15), dt * 2); gt.chainM.opacity = gt.sm.opacity * 0.85; gt.seal.rotation.z = t * 0.2; gt.open = lerp(gt.open, W.f.seal ? 0 : 1, dt * 0.8); for (const l of gt.leaves) l.h.rotation.y = -l.sx * gt.open * 1.4; }
  if (R3.pend) R3.pend.rotation.z = Math.sin(t * PI) * 0.22;
  if (R3.mobile) R3.mobile.rotation.y += dt * (0.3 + (G && dist(G.x, G.z, 6.15, 20.5) < 4 ? 2.5 : 0));
  // ---- lights: flicker, pool assignment
  const elecOn = W.f.power ? 1 : 0;
  const bm = MATC.get('bulbMat'); let eflick = 1; if (W.flick > 0 && Math.random() < W.flick * 0.5) eflick = 0.1 + Math.random() * 0.4;
  if (bm) bm.emissiveIntensity = elecOn * 2.4 * eflick;
  const emb = MATC.get('ember'); if (emb) emb.emissiveIntensity = 1.3 + Math.sin(t * 5.3) * 0.3 + Math.sin(t * 11.7) * 0.2;
  for (const f of R3.flames) { const k = 1 + Math.sin(t * 17 + f.id) * 0.15 + Math.sin(t * 9.3 + f.id * 3) * 0.1; f.scale.set(0.7 * k, 1.7 * k, 0.7 * k); }
  const cx = R3.camT.x, cz = R3.camT.z;
  const act = [];
  for (const fx of R3.fixtures) { const l = fx.l; let I = 0, col = 0xffb870, dist2 = 7; if (fx.k === 'elec') { if (!elecOn) continue; I = (l.k.startsWith('chandelier') ? 5.5 : l.k === 'sconce' ? 2.2 : 3.2) * eflick * (0.96 + Math.sin(t * 50 + fx.phase) * 0.02); col = 0xffc890; dist2 = l.k === 'sconce' ? 4.5 : 8; } else if (fx.k === 'candle') { I = (l.k === 'candles' ? 2.4 : 1.1) * (0.85 + Math.sin(t * 13 + fx.phase) * 0.1 + Math.sin(t * 7.1 + fx.phase) * 0.06); col = 0xffa060; dist2 = l.k === 'candles' ? 6 : 4; } else { I = 3.2 * (0.8 + Math.sin(t * 6 + fx.phase) * 0.15 + Math.sin(t * 13) * 0.07); col = 0xff6a20; dist2 = 6; }
    act.push({ x: l.x, y: l.y - (l.k.startsWith('chandelier') ? 0.35 : 0.05), z: l.z, I, col, dist2, d: d2(l.x, l.z, cx, cz) }); }
  act.sort((a, b) => a.d - b.d);
  R3.pool.forEach((p, i) => { const a = act[i]; if (!a || a.d > 22 * 22) { p.intensity = 0; return; } p.position.set(a.x, a.y, a.z); p.intensity = a.I; p.color.setHex(a.col); p.distance = a.dist2; });
  // ---- lightning
  VIS.nextBolt -= dt; if (VIS.nextBolt <= 0) { VIS.nextBolt = rrLocal(18, 42); R3.flash = 1; R3.flash2 = rrLocal(0.2, 0.45); setTimeout(() => sfx('thunder'), rrLocal(300, 1600)); }
  if (R3.flash > 0) { R3.flash = Math.max(0, R3.flash - dt * 2.6); }
  const fk = R3.flash > 0 ? (R3.flash > 0.8 || (R3.flash > 0.3 && R3.flash < R3.flash2) ? R3.flash : R3.flash * 0.2) : 0;
  R3.moon.intensity = 1.6 + fk * 9; for (const g of R3.glass) g.m.emissiveIntensity = g.base * (1 + fk * 5);
  for (const sh of R3.shafts) sh.material.opacity = 0.07 + fk * 0.3;
  R3.hemi.intensity = (seer ? 5.0 : 3.6) + fk * 2.5; R3.hemi.color.setHex(seer ? 0x7a9ad0 : 0x6a7898); if (window.__dbgLight) { R3.hemi.intensity = window.__dbgLight; R3.hemi.color.setHex(0xffffff); }
  // ---- evidence & spirit layer
  for (const o of R3.spirit) {
    o.visible = seer;
    if (o.userData.orbs) o.children.forEach(sp => { sp.position.set(Math.sin(t * 0.5 + sp.userData.ph) * 0.5, Math.sin(t * 0.8 + sp.userData.ph * 2) * 0.3, Math.cos(t * 0.4 + sp.userData.ph) * 0.5); sp.material.opacity = 0.5 + Math.sin(t * 3 + sp.userData.ph) * 0.3; });
    if (o.userData.draft) { o.visible = seer && W.doors[MAP.doors.find(d => d.kind === 'shelf').idx].open < 0.5; o.children.forEach(sp => { const k = (t * 0.35 + sp.userData.ph) % 1; sp.position.set(Math.sin(k * 9 + sp.userData.ph * 20) * 0.5, 0.2 + k * 2.2, 0); sp.material.opacity = Math.sin(k * PI) * 0.35; }); }
  }
  for (const f of R3.frost) { const b = beamFactor(W, f.e.x, 0.1, f.e.z); f.a = lerp(f.a, b, Math.min(1, dt * 6)); f.m.material.opacity = f.a * 0.9; f.m.visible = f.a > 0.01; }
  const hasMirror = W.setup && GHOSTS[W.setup.gtype].ev.includes('mirror');
  for (const m of R3.mirrors) { const b = beamFactor(W, m.mr.x, 1.2, m.mr.z, m.mr.r); m.lit = lerp(m.lit, b, Math.min(1, dt * 6)); m.sheen.material.opacity = m.lit * 0.18; m.fig.material.opacity = hasMirror ? m.lit * (0.75 + Math.sin(t * 9) * 0.1) : 0; }
  for (const it of R3.items) { const st = W.items && W.items[it.it.i]; if (!st) { it.m.visible = false; continue; } it.m.visible = !st.taken; if (!st.taken) { it.m.rotation.y += dt * 0.6; const g = it.m.userData.glint; const dd = dist(me.x, me.z, st.x, st.z); g.material.opacity = clamp(1.2 - dd / 7, 0, 1) * (0.35 + Math.max(0, Math.sin(t * 2.4 + it.it.i)) * 0.65) + beamFactor(W, st.x, st.y, st.z) * 0.6; } }
  // ---- camera
  const hidden = me.hide >= 0;
  const look = me.role === 'L' ? 1.6 : 1.0;
  const tx = me.x + (hidden ? 0 : Math.cos(me.aim) * look), tz = me.z + (hidden ? 0 : Math.sin(me.aim) * look);
  R3.camT.x = lerp(R3.camT.x, tx, Math.min(1, dt * 4)); R3.camT.z = lerp(R3.camT.z, tz, Math.min(1, dt * 4));
  const asp = innerWidth / innerHeight, far = W.menu ? 1.75 : (asp < 1 ? 1.45 : asp < 1.3 ? 1.15 : 1) * (hidden ? 0.55 : 1) * (window.__dbg && window.__dbg.zoom || 1);
  let shx = 0, shz = 0; if (R3.shake > 0 && SET.shake) { shx = (Math.random() - 0.5) * R3.shake * 0.4; shz = (Math.random() - 0.5) * R3.shake * 0.4; R3.shake = Math.max(0, R3.shake - dt * 2.5); }
  R3.cam.position.set(R3.camT.x + shx, 10.4 * far, R3.camT.z + 7.0 * far + shz); R3.cam.lookAt(R3.camT.x + shx, 0.4, R3.camT.z + shz);
  CUT.uCam.value.copy(R3.cam.position); CUT.uP0.value.set(me.x, 0.9, me.z); CUT.uP1.value.set(partner.x, 0.9, partner.z);
  if (G && (G.st === 'hunt' || G.man > 0.3) && dist(G.x, G.z, me.x, me.z) < dist(partner.x, partner.z, me.x, me.z)) CUT.uP1.value.set(G.x, 0.9, G.z);
  CUT.uR.value = 2.0 * far;
  if (R3.rain) R3.rain.material.uniforms.uT.value = t;
  // ---- post
  VIS.fear = lerp(VIS.fear, me.fear / 100, Math.min(1, dt * 2));
  const U = R3.postMat.uniforms; U.uT.value = t; U.uFear.value = VIS.fear; U.uSpirit.value = seer ? 1 : 0; U.uHunt.value = VIS.hunt; U.uFlash.value = fk * 0.6; U.uDown.value = me.down ? 1 : 0; U.uGrain.value = SET.grain ? 1 : 0.2; U.uHide.value = hidden ? 1 : 0;
  const bpm = 60 + me.fear * 0.8 + VIS.hunt * 40, ph = (t * bpm / 60) % 1; U.uBeat.value = me.fear > 50 || VIS.hunt > 0.5 ? Math.max(0, 1 - ph * 5) * clamp((me.fear - 40) / 60 + VIS.hunt * 0.5, 0, 1) : 0;
  R3.renderer.setRenderTarget(R3.rt); R3.renderer.render(R3.scene, R3.cam); R3.lastCalls = R3.renderer.info.render.calls; R3.lastTris = R3.renderer.info.render.triangles;
  R3.renderer.setRenderTarget(null); R3.renderer.render(R3.postScene, R3.postCam);
}
const rrLocal = (a, b) => a + Math.random() * (b - a);
/* world → screen for DOM overlays */
const _pv = new THREE.Vector3();
function toScreen(x, y, z) { _pv.set(x, y, z).project(R3.cam); return { x: (_pv.x + 1) / 2 * innerWidth, y: (1 - _pv.y) / 2 * innerHeight, on: _pv.z < 1 && Math.abs(_pv.x) < 1.1 && Math.abs(_pv.y) < 1.1 }; }
