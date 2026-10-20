/* ================= ghost true forms =================
   Before the players identify it, a ghost shows as the veiled wraith (makeGhost in 22). Once two pieces of evidence
   pin it down, it shows its true shape. The lady of the house (final floor) always shows hers.
   Every form returns a group with userData { body, head, arms: [{sh, el, sx}], wisps: [], kind }. */
const GF = {};
function gm(dark) { const k = dark ? 'gmD' : 'gmL'; if (!GF[k]) GF[k] = ghostMat(dark); return GF[k]; }
function gAdd(p, geo, dark, x, y, z, rx, ry, rz, sx, sy, sz) { const m = addM(p, geo, gm(dark), x, y, z, rx, ry, rz, sx, sy, sz); m.castShadow = false; m.receiveShadow = false; return m; }
/* lathe profile helper: pts are [radius, height] from bottom to top */
const latheUp = (pts, seg = 28) => GEO.lathe(pts, seg);
function ghostArm(body, sx, x, y, z, upper, fore, rU, fingers = 4, fl = 0.13) {
  const sh = grp(body, sx * x, y, z);
  gAdd(sh, GEO.cyl(rU, rU * 0.75, upper, 10), false, 0, -upper / 2, 0);
  const el = grp(sh, 0, -upper, 0);
  gAdd(el, GEO.cyl(rU * 0.75, rU * 0.5, fore, 10), false, 0, -fore / 2, 0);
  const hd = grp(el, 0, -fore - 0.02, 0);
  gAdd(hd, GEO.sph(rU * 0.9, 10, 8), false, 0, 0, 0, 0, 0, 0, 1, 1.3, 0.6);
  for (let f = 0; f < fingers; f++) gAdd(hd, GEO.cyl(0.007, 0.003, fl, 5), false, (f - (fingers - 1) / 2) * 0.016, -fl / 2 - 0.03, 0.005, 0, 0, (f - (fingers - 1) / 2) * 0.1);
  gAdd(hd, GEO.cyl(0.008, 0.004, fl * 0.7, 5), false, sx * 0.03, -0.03, 0.02, 0.5, 0, sx * 0.8);
  return { sh, el, hd, sx };
}
function hollowEyes(head, y, z, sep, r, glow) {
  const g = grp(head, 0, y, z);
  for (const sx of [-1, 1]) { gAdd(g, GEO.sph(r, 10, 8), true, sx * sep, 0, 0, 0, 0, 0, 1, 1.25, 0.5); if (glow) { const e = addM(g, GEO.sph(r * 0.32, 8, 6), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.95 }), sx * sep, 0, r * 0.35); e.castShadow = false; } }
  return g;
}
function wispTail(body, n, r, y, len) { const out = []; for (let k = 0; k < n; k++) { const a = k / n * TAU; const w = gAdd(body, GEO.cone(r, len, 6), false, Math.cos(a) * r * 2.2, y, Math.sin(a) * r * 2.2 - 0.05, PI + 0.25, 0, rr(-0.3, 0.3)); w.userData.keep = true; out.push(w); } return out; }

/* 泣嫁 — the bride: tiered gown, corset bodice, long veil, wilted bouquet */
GF.bride = () => {
  const g = new THREE.Group(), body = grp(g);
  const skirt = []; for (let i = 0; i <= 20; i++) { const t = i / 20; skirt.push([0.62 - t * 0.48 + Math.sin(t * 34) * 0.012 * (1 - t), t * 1.05]); }
  gAdd(body, latheUp([[0, 0], ...skirt, [0, 1.05]], 36), false, 0, 0.0, 0);
  for (let k = 0; k < 4; k++) { const y = 0.18 + k * 0.22, r = 0.58 - k * 0.1; gAdd(body, GEO.tor(r, 0.03, TAU, 6, 40), false, 0, y, 0, HP, 0, 0, 1, 1, 0.8 + k * 0.05); }
  gAdd(body, latheUp([[0.15, 0], [0.17, 0.1], [0.15, 0.24], [0.17, 0.38], [0.12, 0.44], [0, 0.46]], 24), false, 0, 1.03, 0, 0, 0, 0, 1, 1, 0.78);
  gAdd(body, GEO.tor(0.13, 0.025, TAU, 6, 24), false, 0, 1.44, 0, HP, 0, 0, 1, 0.8, 1);
  for (const sx of [-1, 1]) gAdd(body, GEO.sph(0.08, 12, 10), false, sx * 0.17, 1.38, 0, 0, 0, 0, 1, 0.8, 1);
  const head = grp(body, 0, 1.6, 0.02);
  gAdd(head, GEO.sph(0.12, 18, 14), false, 0, 0, 0, 0, 0, 0, 0.88, 1.12, 0.95);
  gAdd(head, GEO.cyl(0.04, 0.05, 0.12, 10), false, 0, -0.13, -0.01);
  gAdd(head, GEO.sph(0.13, 16, 12, 0, TAU, 0, PI * 0.55), true, 0, 0.02, -0.01, -0.15);
  gAdd(head, GEO.sph(0.07, 12, 10), true, 0, 0.1, -0.1);
  hollowEyes(head, 0.01, 0.1, 0.04, 0.022, 0xd8f0ff);
  for (const sx of [-1, 1]) gAdd(head, GEO.box(0.006, 0.11, 0.004), true, sx * 0.04, -0.06, 0.11, 0, 0, sx * 0.05);
  // veil: a long translucent sheet from the crown down the back
  const vg = new THREE.PlaneGeometry(0.62, 1.55, 6, 14), vp = vg.attributes.position;
  for (let i = 0; i < vp.count; i++) { const x = vp.getX(i), y = vp.getY(i), t = (0.77 - y) / 1.55; vp.setZ(i, -Math.pow(t, 0.7) * 0.32 - Math.cos(x * 6) * 0.03 * t); vp.setX(i, x * (0.55 + t * 0.9)); }
  vg.computeVertexNormals();
  const veil = gAdd(head, vg, false, 0, -0.62, -0.08); veil.userData.keep = true;
  gAdd(head, GEO.tor(0.1, 0.012, TAU, 5, 20), false, 0, 0.1, -0.02, 1.2, 0, 0);
  const arms = [ghostArm(body, 1, 0.19, 1.38, 0, 0.3, 0.27, 0.035), ghostArm(body, -1, 0.19, 1.38, 0, 0.3, 0.27, 0.035)];
  // bouquet held in front
  const bq = grp(arms[0].hd, -0.06, -0.06, 0.06); gAdd(bq, GEO.cone(0.05, 0.22, 8), true, 0, -0.08, 0, PI);
  for (let k = 0; k < 7; k++) gAdd(bq, GEO.sph(0.035, 8, 6), true, rr(-0.06, 0.06), 0.04 + rr(0, 0.04), rr(-0.06, 0.06));
  const wisps = wispTail(body, 6, 0.09, 0.15, 0.6);
  mergeRig(g); g.userData = { body, head, arms, wisps, kind: 'bride', veil };
  return g;
};
/* 顽童 — the child: small, oversized head, nightgown, clutching a bear */
GF.child = () => {
  const g = new THREE.Group(), body = grp(g);
  const gown = []; for (let i = 0; i <= 14; i++) { const t = i / 14; gown.push([0.3 - t * 0.17 + Math.sin(t * 28) * 0.01, t * 0.72]); }
  gAdd(body, latheUp([[0, 0.08], ...gown.map(([r, y]) => [r, y + 0.08]), [0, 0.8]], 26), false, 0, 0, 0);
  gAdd(body, GEO.tor(0.13, 0.02, TAU, 6, 20), false, 0, 0.8, 0, HP, 0, 0);
  for (const sx of [-1, 1]) { gAdd(body, GEO.cyl(0.035, 0.03, 0.14, 8), false, sx * 0.08, 0.06, 0); gAdd(body, GEO.sph(0.04, 8, 6), false, sx * 0.08, -0.01, 0.03, 0, 0, 0, 0.8, 0.5, 1.4); }
  const head = grp(body, 0, 1.0, 0.0);
  gAdd(head, GEO.sph(0.16, 18, 14), false, 0, 0, 0, 0, 0, 0, 0.95, 1.0, 0.95);
  for (let k = 0; k < 12; k++) { const a = -PI * 0.9 + k / 11 * PI * 1.8; gAdd(head, GEO.cone(0.05, 0.16, 6), true, Math.sin(a) * 0.12, 0.08 + Math.cos(a) * 0.02, Math.cos(a) * 0.1 - 0.03, -0.4 - Math.cos(a) * 0.6, 0, Math.sin(a) * -1.1); }
  gAdd(head, GEO.sph(0.165, 16, 12, 0, TAU, 0, PI * 0.5), true, 0, 0.02, -0.01, -0.25);
  hollowEyes(head, 0.0, 0.13, 0.055, 0.035, 0xffffff);
  gAdd(head, GEO.tor(0.035, 0.008, PI, 5, 12), true, 0, -0.07, 0.135, 0, 0, PI); // a too-wide smile
  const arms = [ghostArm(body, 1, 0.12, 0.74, 0, 0.2, 0.18, 0.026, 4, 0.06), ghostArm(body, -1, 0.12, 0.74, 0, 0.2, 0.18, 0.026, 4, 0.06)];
  const bear = grp(body, 0, 0.55, 0.16), fur = true;
  gAdd(bear, GEO.sph(0.08, 10, 8), fur, 0, 0, 0, 0, 0, 0, 1, 1.15, 0.85); gAdd(bear, GEO.sph(0.06, 10, 8), fur, 0, 0.11, 0.01);
  for (const sx of [-1, 1]) { gAdd(bear, GEO.sph(0.025, 8, 6), fur, sx * 0.045, 0.16, 0); gAdd(bear, GEO.cyl(0.02, 0.02, 0.08, 6), fur, sx * 0.07, 0.02, 0.02, 0, 0, sx * 0.9); }
  gAdd(bear, GEO.cyl(0.004, 0.004, 0.05, 4), false, 0.02, 0.12, 0.06, HP); // a loose button eye on a thread
  const wisps = wispTail(body, 4, 0.06, 0.1, 0.35);
  mergeRig(g); g.userData = { body, head, arms, wisps, kind: 'child', bear };
  return g;
};
/* 守钟人 — the keeper: tall, gaunt butler in a tailcoat, a pocket watch on a long chain */
GF.keeper = () => {
  const g = new THREE.Group(), body = grp(g);
  for (const sx of [-1, 1]) { gAdd(body, GEO.cyl(0.05, 0.035, 0.95, 10), false, sx * 0.09, 0.5, 0); gAdd(body, GEO.box(0.08, 0.05, 0.2, 0.02), true, sx * 0.09, 0.03, 0.04); }
  const coat = grp(body, 0, 1.0, 0);
  gAdd(coat, latheUp([[0.16, 0], [0.19, 0.2], [0.17, 0.45], [0.21, 0.66], [0.13, 0.76], [0, 0.78]], 22), true, 0, 0, 0, 0, 0, 0, 1, 1, 0.72);
  gAdd(coat, GEO.box(0.18, 0.5, 0.02, 0.01), false, 0, 0.42, 0.115); // waistcoat front
  for (let k = 0; k < 4; k++) gAdd(coat, GEO.sph(0.011, 6, 5), true, 0.03, 0.26 + k * 0.1, 0.13);
  for (const sx of [-1, 1]) { const tail = gAdd(coat, GEO.box(0.12, 0.55, 0.02, 0.01), true, sx * 0.08, -0.15, -0.13, 0.12, 0, sx * 0.06); tail.userData.keep = true; }
  gAdd(coat, GEO.box(0.1, 0.03, 0.03, 0.01), true, 0, 0.72, 0.12); // bow tie
  for (const sx of [-1, 1]) gAdd(coat, GEO.box(0.05, 0.035, 0.03, 0.01), true, sx * 0.05, 0.72, 0.12, 0, 0, sx * 0.4);
  const head = grp(body, 0, 1.92, 0.04);
  gAdd(head, GEO.sph(0.11, 16, 12), false, 0, 0, 0, 0, 0, 0, 0.82, 1.25, 0.95);
  gAdd(head, GEO.cyl(0.035, 0.04, 0.14, 8), false, 0, -0.16, -0.01);
  gAdd(head, GEO.sph(0.115, 14, 10, 0, TAU, 0, PI * 0.4), true, 0, 0.04, -0.01, -0.2);
  hollowEyes(head, 0.02, 0.085, 0.035, 0.026, 0xfff0c0);
  for (const sx of [-1, 1]) gAdd(head, GEO.sph(0.03, 8, 6), true, sx * 0.05, -0.05, 0.07, 0, 0, 0, 1, 0.6, 0.4); // sunken cheeks
  const arms = [ghostArm(body, 1, 0.21, 1.72, 0, 0.38, 0.36, 0.032, 4, 0.18), ghostArm(body, -1, 0.21, 1.72, 0, 0.38, 0.36, 0.032, 4, 0.18)];
  const watch = grp(arms[1].hd, 0, -0.18, 0.04); gAdd(watch, GEO.cyl(0.045, 0.045, 0.012, 18), false, 0, 0, 0, HP); const face = addM(watch, GEO.cyl(0.038, 0.038, 0.004, 18), new THREE.MeshBasicMaterial({ map: clockFace(), transparent: true, opacity: 0.85 }), 0, 0, 0.008, HP); face.castShadow = false;
  for (let k = 0; k < 9; k++) gAdd(arms[1].hd, GEO.tor(0.008, 0.002, TAU, 4, 8), false, 0, -0.02 - k * 0.018, 0.02, HP, k * 0.7, 0);
  const wisps = wispTail(body, 5, 0.06, 0.08, 0.4);
  mergeRig(g); g.userData = { body, head, arms, wisps, kind: 'keeper', watch };
  return g;
};
/* 无面者 — the faceless: a very tall, thin shape with a blank egg face and arms to its knees */
GF.faceless = () => {
  const g = new THREE.Group(), body = grp(g);
  const robe = []; for (let i = 0; i <= 18; i++) { const t = i / 18; robe.push([0.2 - t * 0.08 + Math.sin(t * 40) * 0.01, t * 1.75]); }
  gAdd(body, latheUp([[0, 0.1], ...robe.map(([r, y]) => [r, y + 0.1]), [0, 1.86]], 20), true, 0, 0, 0, 0, 0, 0, 1, 1, 0.8);
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; const s = gAdd(body, GEO.box(0.06, rr(0.5, 0.9), 0.01, 0.004), true, Math.cos(a) * 0.19, 0.35, Math.sin(a) * 0.15, 0, -a, rr(-0.15, 0.15)); s.userData.keep = true; }
  const head = grp(body, 0, 2.18, 0.02);
  gAdd(head, GEO.cyl(0.035, 0.045, 0.26, 10), false, 0, -0.2, 0);
  const egg = []; for (let i = 0; i <= 14; i++) { const t = i / 14, a = t * PI; egg.push([Math.sin(a) * 0.115 * (1 - t * 0.18), -Math.cos(a) * 0.17]); }
  gAdd(head, GEO.lathe(egg, 22), false, 0, 0.02, 0, 0.12);
  const arms = [ghostArm(body, 1, 0.17, 1.86, 0, 0.62, 0.58, 0.028, 4, 0.26), ghostArm(body, -1, 0.17, 1.86, 0, 0.62, 0.58, 0.028, 4, 0.26)];
  const wisps = wispTail(body, 7, 0.05, 0.1, 0.55);
  mergeRig(g); g.userData = { body, head, arms, wisps, kind: 'faceless' };
  return g;
};
/* 宅主 温夫人 — the lady of the house: mourning gown with a hooped skirt and train, high collar, lace veil, cane */
GF.boss = () => {
  const g = new THREE.Group(), body = grp(g);
  const sk = []; for (let i = 0; i <= 24; i++) { const t = i / 24; sk.push([0.78 * Math.pow(1 - t, 0.75) + 0.16 + Math.sin(t * 40) * 0.01 * (1 - t), t * 1.12]); }
  gAdd(body, latheUp([[0, 0], ...sk, [0, 1.12]], 40), false, 0, 0, 0);
  for (let k = 0; k < 2; k++) { const t = k * 0.45, r = 0.78 * Math.pow(1 - t, 0.75) + 0.16 + Math.sin(t * 40) * 0.01 * (1 - t); gAdd(body, GEO.tor(r + 0.004, 0.014, TAU, 5, 48), true, 0, 0.04 + t * 1.12, 0, HP); }
  const train = new THREE.PlaneGeometry(0.9, 1.4, 6, 10), tp = train.attributes.position; for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i), t = (0.7 - y) / 1.4; tp.setZ(i, -t * t * 0.6); tp.setY(i, y * (1 - t * 0.55)); tp.setX(i, x * (0.7 + t * 0.5)); } train.computeVertexNormals();
  const tr0 = gAdd(body, train, true, 0, 0.45, -0.75, -1.2); tr0.userData.keep = true;
  gAdd(body, latheUp([[0.2, 0], [0.22, 0.12], [0.18, 0.3], [0.21, 0.5], [0.15, 0.58], [0, 0.6]], 26), true, 0, 1.1, 0, 0, 0, 0, 1, 1, 0.75);
  for (const sx of [-1, 1]) gAdd(body, GEO.sph(0.11, 12, 10), true, sx * 0.22, 1.6, 0, 0, 0, 0, 1, 0.85, 1);
  gAdd(body, GEO.cyl(0.07, 0.09, 0.2, 14), true, 0, 1.76, 0); // high collar
  for (let k = 0; k < 10; k++) gAdd(body, GEO.cone(0.025, 0.06, 4), true, Math.cos(k / 10 * TAU) * 0.085, 1.88, Math.sin(k / 10 * TAU) * 0.085);
  const brooch = addM(body, GEO.sph(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: 0xc8a8ff }), 0, 1.66, 0.17, 0, 0, 0, 1, 1.3, 0.5); brooch.castShadow = false;
  const head = grp(body, 0, 2.02, 0.02);
  gAdd(head, GEO.sph(0.12, 18, 14), false, 0, 0, 0, 0, 0, 0, 0.85, 1.15, 0.95);
  gAdd(head, GEO.sph(0.11, 14, 12), true, 0, 0.2, -0.02, 0, 0, 0, 0.9, 1.2, 0.9); // tall coiffure
  gAdd(head, GEO.sph(0.13, 16, 12, 0, TAU, 0, PI * 0.55), true, 0, 0.03, -0.02, -0.15);
  hollowEyes(head, 0.01, 0.1, 0.042, 0.026, 0xd8c0ff);
  const vg = new THREE.PlaneGeometry(0.34, 0.4, 4, 6), vp = vg.attributes.position; for (let i = 0; i < vp.count; i++) { const y = vp.getY(i), x = vp.getX(i); vp.setZ(i, 0.12 + Math.cos(x * 7) * 0.02 - (0.2 - y) * 0.08); } vg.computeVertexNormals();
  const veil = gAdd(head, vg, true, 0, 0.0, 0.0); veil.userData.keep = true;
  const arms = [ghostArm(body, 1, 0.24, 1.62, 0, 0.36, 0.33, 0.038, 4, 0.16), ghostArm(body, -1, 0.24, 1.62, 0, 0.36, 0.33, 0.038, 4, 0.16)];
  const cane = grp(arms[0].hd, 0, -0.05, 0.02); gAdd(cane, GEO.cyl(0.014, 0.012, 1.05, 8), true, 0, -0.52, 0); gAdd(cane, GEO.sph(0.03, 10, 8), false, 0, 0.0, 0);
  const wisps = wispTail(body, 8, 0.1, 0.12, 0.5);
  mergeRig(g); g.userData = { body, head, arms, wisps, kind: 'boss', cane };
  g.scale.setScalar(1.05);
  return g;
};
GF.veil = () => { const g = makeGhost(); g.userData.kind = 'veil'; return g; };
/* swap the visible ghost form */
function setGhostForm(k) {
  if (!GF[k]) k = 'veil';
  R3.ghostForms = R3.ghostForms || {};
  if (R3.ghostKind === k && R3.ghost) return;
  if (R3.ghost) R3.ghost.visible = false;
  if (!R3.ghostForms[k]) { const f = GF[k](); f.renderOrder = 5; R3.scene.add(f); R3.ghostForms[k] = f; }
  const gh = R3.ghostForms[k]; if (!gh.userData.glows) { gh.userData.glows = []; gh.traverse(o => { if (o.material && o.material.isMeshBasicMaterial && !gh.userData.glows.includes(o.material)) gh.userData.glows.push(o.material); }); }
  R3.ghost = R3.ghostForms[k]; R3.ghostKind = k;
}
/* per-form idle flavour on top of the shared arm/wisp animation in renderFrame */
function animGhostForm(gh, G, t, dt, hunting) {
  const U = gh.userData;
  switch (U.kind) {
    case 'bride': if (U.veil) U.veil.rotation.x = Math.sin(t * 1.3) * 0.08 + (G.spd || 0) * 0.08; U.head.rotation.x = 0.25 + Math.sin(t * 0.9) * 0.05; break; // head bowed, weeping
    case 'child': U.body.position.y = Math.abs(Math.sin(t * (hunting ? 9 : 3))) * (hunting ? 0.12 : 0.04); U.head.rotation.z = Math.sin(t * 2.3) * 0.35; break; // skipping, head lolling
    case 'keeper': U.head.rotation.z = 0.35 + Math.sin(t * 0.6) * 0.05; U.body.rotation.x = 0.12; break; // hunched, head cocked
    case 'faceless': U.head.rotation.y = Math.sin(t * 0.37) * 0.6; U.body.rotation.z = Math.sin(t * 0.8) * 0.04; break;
    case 'boss': U.body.rotation.y = Math.sin(t * 0.5) * 0.05; U.head.rotation.x = -0.12 + Math.sin(t * 0.7) * 0.04; break; // chin raised
  }
}
