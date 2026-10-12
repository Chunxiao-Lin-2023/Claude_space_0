/* ================= rendering for modes, map gimmicks, events, social overlays ================= */
const MV = { g: null, gems: new Map(), ball: null, ballShadow: null, traps: new Map(), warns: new Map(), anim: [], goals: [] };
function buildModeScene() {
  const g = MV.g = new THREE.Group(); R3.mapG.add(g);
  MV.gems.clear(); MV.traps.clear(); MV.warns.clear(); MV.anim = []; MV.ball = null; MV.goals = [];
  // jump pads: plate + arrow pointing at the landing spot
  for (const p of M.pads) {
    const o = new THREE.Group(); o.position.set(p.x, 0.02, p.z); o.rotation.y = Math.PI / 2 - Math.atan2(p.tz - p.z, p.tx - p.x);
    P(o, GEO.cyl(0.45, 0.48, 0.08, 20), toon(0x3a3f4a), 0, 0.04, 0, 0, 0, 0, OUTLINE_THIN);
    const ar = P(o, GEO.cone(0.26, 0.5, 3).rotateX(Math.PI / 2).scale(1, 0.25, 1), glow(0x52f5ff, 1.6), 0, 0.12, 0.02, 0, 0, 0, null);
    g.add(o); MV.anim.push({ k: 'pad', o, ar });
    const t = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x52f5ff, transparent: true, opacity: 0.45, depthWrite: false }));
    t.position.set(p.tx, 0.04, p.tz); g.add(t);
  }
  // portals
  for (const P2 of M.ports) for (const s of [P2.a, P2.b]) {
    const o = new THREE.Group(); o.position.set(s.x, 0.03, s.z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.46, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9b5de5, transparent: true, opacity: 0.75, depthWrite: false })); disc.position.y = 0.02;
    const tor = P(o, GEO.tor(0.46, 0.06, TAU, 8, 32), glow(0xc77dff, 1.6), 0, 0.06, 0, Math.PI / 2, 0, 0, null);
    o.add(disc); g.add(o); MV.anim.push({ k: 'port', o, tor, disc, x: s.x, z: s.z });
  }
  // healing springs
  for (const s of M.springs) {
    const o = new THREE.Group(); o.position.set(s.x, 0.02, s.z);
    const w = new THREE.Mesh(new THREE.CircleGeometry(s.r, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6dffb0, transparent: true, opacity: 0.4, depthWrite: false })); w.position.y = 0.03;
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; P(o, GEO.dod(0.13), toon(0xb8c4cc), Math.cos(a) * s.r, 0.06, Math.sin(a) * s.r, i, i * 2, 0, OUTLINE_THIN); }
    o.add(w); g.add(o); MV.anim.push({ k: 'spring', o, w, s });
  }
  const md = G ? G.cfg.mode : (CL.cfg && CL.cfg.mode);
  if (md === 'gem') {
    const o = new THREE.Group(); o.position.set(BAL.N / 2, 0, BAL.N / 2);
    P(o, GEO.cyl(0.9, 1.05, 0.25, 8), toon(0x6b5b70), 0, 0.12, 0, 0, Math.PI / 8, 0, OUTLINE_THIN);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; P(o, GEO.cone(0.16, 0.5, 5), glow(0xc77dff, 1.2), Math.cos(a) * 0.45, 0.45, Math.sin(a) * 0.45, Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3, OUTLINE_THIN); }
    P(o, GEO.cone(0.22, 0.75, 5), glow(0xe0aaff, 1.4), 0, 0.55, 0, 0, 0, 0, OUTLINE_THIN);
    g.add(o);
  }
  if (md === 'ball' && M.goals) {
    const mt = myTeam();
    for (const G0 of M.goals) {
      const col = G0.team === mt ? 0x3fa9ff : 0xff4b4b, o = new THREE.Group(), z = G0.z + 0.5;
      for (const x of [G0.x0, G0.x1]) P(o, GEO.cyl(0.08, 0.08, 1.4, 10), toon(0xffffff), x, 0.7, z);
      P(o, GEO.cyl(0.08, 0.08, G0.x1 - G0.x0, 10), toon(col), (G0.x0 + G0.x1) / 2, 1.4, z, 0, 0, Math.PI / 2);
      const net = new THREE.Mesh(new THREE.PlaneGeometry(G0.x1 - G0.x0, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
      net.position.set((G0.x0 + G0.x1) / 2, 0.7, z + (G0.team === 0 ? 0.45 : -0.45)); o.add(net);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(G0.x1 - G0.x0, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.3, depthWrite: false })); fl.position.set((G0.x0 + G0.x1) / 2, 0.04, z); o.add(fl);
      g.add(o); MV.goals.push(o);
    }
    const ball = new THREE.Group();
    const core = P(ball, GEO.sph(0.26), toon(0xffffff), 0, 0, 0, 0, 0, 0, OUTLINE_THIN);
    for (let i = 0; i < 12; i++) { const v = new THREE.Vector3().setFromSphericalCoords(0.255, Math.acos(1 - 2 * (i + 0.5) / 12), i * 2.4); P(core, GEO.sph(0.07, 1, 1, 0.35).lookAt(v), toon(0x22223a), v.x, v.y, v.z, 0, 0, 0, null); }
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
    g.add(ball); g.add(sh); MV.ball = ball; MV.ballCore = core; MV.ballShadow = sh;
  }
}
function syncModeScene(dt, now) {
  for (const A of MV.anim) {
    if (A.k === 'pad') { A.ar.position.z = 0.02 + Math.sin(now * 5) * 0.06; A.ar.material.emissiveIntensity = 1.2 + Math.sin(now * 5) * 0.5; }
    else if (A.k === 'port') { A.o.rotation.y = now * 2; A.disc.material.opacity = 0.55 + Math.sin(now * 4) * 0.2; if (Math.random() < dt * 6) emit({ x: A.x + rr(-0.4, 0.4), z: A.z + rr(-0.4, 0.4), y: 0.1, c: [0xc77dff, 0xffffff], glow: 1, s0: 0.05, s1: 0, life: 0.8, up: 1.2, g: -0.5 }); }
    else if (A.k === 'spring') { A.w.material.opacity = 0.32 + Math.sin(now * 3) * 0.1; if (Math.random() < dt * 4) emit({ x: A.s.x + rr(-0.6, 0.6), z: A.s.z + rr(-0.6, 0.6), y: 0.1, c: [0x6dff8f, 0xffffff], glow: 1, s0: 0.05, s1: 0, life: 0.9, up: 1, g: -0.4 }); }
  }
  const ms = viewMS(); if (!ms) return;
  // gems
  const seen = new Set();
  for (const gm of ms.gems || []) {
    seen.add(gm.id); let m = MV.gems.get(gm.id);
    if (!m) { m = new THREE.Group(); P(m, GEO.ico(0.18, 0).scale(0.8, 1.3, 0.8), toon(0xb05cff, { emissive: 0x7a2dd8, emissiveIntensity: 0.9 }), 0, 0, 0, 0, 0, 0, OUTLINE_THIN); R3.fxG.add(m); MV.gems.set(gm.id, m); m.userData.b = now; }
    const age = now - m.userData.b; m.position.set(gm.x, 0.45 + Math.sin(now * 3 + gm.id) * 0.08 + (age < 0.4 ? Math.sin(age / 0.4 * Math.PI) * 0.8 : 0), gm.z); m.rotation.y = now * 2 + gm.id;
  }
  for (const [id, m] of MV.gems) if (!seen.has(id)) { R3.fxG.remove(m); MV.gems.delete(id); }
  // ball
  if (MV.ball && ms.ball) {
    const B = ms.ball, o = MV.ball, px = o.position.x, pz = o.position.z;
    o.position.set(B.x, B.y || 0.26, B.z); MV.ballShadow.position.set(B.x, 0.04, B.z);
    const dx = B.x - px, dz = B.z - pz; if (Math.hypot(dx, dz) > 1e-3) { MV.ballCore.rotation.x += dz / 0.26; MV.ballCore.rotation.z -= dx / 0.26; }
  }
  // traps (only your team's are sent / shown)
  const tseen = new Set();
  for (const tr of viewTraps()) {
    if (tr.team !== myTeam()) continue;
    tseen.add(tr.id); let m = MV.traps.get(tr.id);
    if (!m) { m = new THREE.Group(); P(m, GEO.cyl(0.32, 0.34, 0.05, 16), toon(0x6d7680), 0, 0.03, 0, 0, 0, 0, OUTLINE_THIN); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; spike(m, 0.14, 0.035, Math.cos(a) * 0.28, 0.05, Math.sin(a) * 0.28, 0, 1, 0, toon(0xd8dce4)); } m.position.set(tr.x, 0.01, tr.z); R3.fxG.add(m); MV.traps.set(tr.id, m); }
  }
  for (const [id, m] of MV.traps) if (!tseen.has(id)) { R3.fxG.remove(m); MV.traps.delete(id); }
  // telegraphs: meteor circles with a falling rock, supply crates on parachutes
  const wseen = new Set();
  for (const w of viewWarns()) {
    wseen.add(w.id); let V = MV.warns.get(w.id);
    if (!V) {
      const g = new THREE.Group(); g.position.set(w.x, 0.05, w.z);
      const col = w.k === 'drop' ? 0x6dff8f : 0xff4040;
      const ringM = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthWrite: false }));
      const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25, depthWrite: false }));
      ringM.renderOrder = fill.renderOrder = 7; g.add(ringM, fill); g.scale.set(w.r, 1, w.r);
      const fall = new THREE.Group();
      if (w.k === 'meteor') { P(fall, GEO.dod(0.42), toon(0x5a3a2a, { emissive: 0xff5a1a, emissiveIntensity: 0.6 })); }
      else { P(fall, GEO.box(0.7, 0.6, 0.7, 0.06), toon(0x5a7890)); P(fall, GEO.half(0.9, 1, 0.6, 1), toon(0xff6b6b), 0, 1.6, 0, 0, 0, 0, OUTLINE_THIN); for (const [x, z] of [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]) P(fall, GEO.cyl(0.01, 0.01, 1.4, 4).translate(0, 0.7, 0), basic(0xffffff), x, 0.3, z, z * 0.6, 0, -x * 0.6, null); }
      R3.fxG.add(g); R3.fxG.add(fall); V = { g, fill, fall, k: w.k }; MV.warns.set(w.id, V);
    }
    const f = clamp(w.t / w.T, 0, 1);
    V.fill.scale.setScalar(f); V.fill.material.opacity = 0.18 + f * 0.25;
    if (V.k === 'meteor') { V.fall.position.set(w.x - (1 - f) * 4, 0.4 + (1 - f) * 14, w.z - (1 - f) * 3); V.fall.rotation.set(now * 4, now * 3, 0); if (f > 0.3) emit({ x: V.fall.position.x, z: V.fall.position.z, y: V.fall.position.y, c: [0xff7a1a, 0xffb347], glow: 1, s0: 0.2, s1: 0, life: 0.3, g: 0 }); }
    else { V.fall.position.set(w.x, 0.3 + (1 - f) * 10, w.z); V.fall.rotation.y = Math.sin(now * 2) * 0.3; }
  }
  for (const [id, V] of MV.warns) if (!wseen.has(id)) { R3.fxG.remove(V.g); R3.fxG.remove(V.fall); MV.warns.delete(id); }
}

/* ---------- overlay extras: emote bubbles, pings, gem/star badges ---------- */
const SOC = { emotes: new Map(), pings: [] };
function drawSocialOverlay(g, sc, now) {
  // pings
  for (let i = SOC.pings.length - 1; i >= 0; i--) {
    const P = SOC.pings[i], age = now - P.t; if (age > 3.5) { SOC.pings.splice(i, 1); continue; }
    const tgt = P.tid ? viewEnt(P.tid) : null, x = tgt && tgt.alive ? tgt.x : P.x, z = tgt && tgt.alive ? tgt.z : P.z;
    const s = toScreen(x, tgt ? 2.6 : 0.3, z); if (!s.ok) continue;
    const a = age > 2.8 ? 1 - (age - 2.8) / 0.7 : 1, bob = Math.sin(now * 8) * 3;
    g.globalAlpha = a; g.fillStyle = tgt ? '#ff4d4d' : '#ffd23f'; g.strokeStyle = '#22141f'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(s.x, s.y + bob); g.lineTo(s.x - 12 * sc, s.y - 18 * sc + bob); g.lineTo(s.x + 12 * sc, s.y - 18 * sc + bob); g.closePath(); g.fill(); g.stroke();
    g.font = `900 ${12 * sc}px "ZCOOL KuaiLe",system-ui`; g.fillStyle = '#fff'; g.lineWidth = 3; const txt = tgt ? '集火' : '去这里';
    g.strokeText(txt, s.x, s.y - 24 * sc + bob); g.fillText(txt, s.x, s.y - 24 * sc + bob); g.globalAlpha = 1;
  }
}
function drawEmote(g, b, s, sc, now) {
  const E = SOC.emotes.get(b.id); if (!E) return;
  const age = now - E.t; if (age > 2.2) { SOC.emotes.delete(b.id); return; }
  const txt = EMOTES[E.e] || '?', pop = age < 0.15 ? 0.6 + age / 0.15 * 0.4 : 1, y = s.y - 40 * sc;
  g.font = `900 ${(txt.length > 2 ? 15 : 22) * sc * pop}px "ZCOOL KuaiLe","Apple Color Emoji","Segoe UI Emoji",system-ui`;
  const w = g.measureText(txt).width + 18 * sc, h = 30 * sc * pop;
  g.globalAlpha = age > 1.8 ? 1 - (age - 1.8) / 0.4 : 1;
  g.fillStyle = '#fff8ec'; g.strokeStyle = '#22141f'; g.lineWidth = 3; rrect(g, s.x - w / 2, y - h, w, h, 10 * sc); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(s.x - 6 * sc, y - 1); g.lineTo(s.x, y + 8 * sc); g.lineTo(s.x + 6 * sc, y - 1); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#22141f'; g.fillText(txt, s.x, y - h * 0.28); g.globalAlpha = 1;
}
function drawBadges(g, b, x, y, sc) {
  let bx = x + 41 * sc;
  if (b.gems > 0) { g.font = `900 ${12 * sc}px "Lilita One",system-ui`; g.fillStyle = '#b05cff'; g.strokeStyle = '#22141f'; g.lineWidth = 3; rrect(g, bx, y - 1, 26 * sc, 15 * sc, 5); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillText('💎' + b.gems, bx + 13 * sc, y + 11 * sc); bx += 30 * sc; }
  if (viewMode() === 'bounty' && b.bounty) { g.font = `900 ${12 * sc}px "Lilita One",system-ui`; g.fillStyle = '#ffd23f'; g.strokeStyle = '#22141f'; g.lineWidth = 3; rrect(g, bx, y - 1, 28 * sc, 15 * sc, 5); g.fill(); g.stroke(); g.fillStyle = '#22141f'; g.fillText('★' + b.bounty, bx + 14 * sc, y + 11 * sc); }
}
