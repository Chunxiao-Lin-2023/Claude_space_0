/* ================= (round 39) bespoke mech upgrades: every mech gets its own three-level look ================= */
// Lv1 强化装甲 (tougher) / Lv2 火力改装 (hits harder) / Lv3 王牌 (both): each level adds parts that change the silhouette
// and fit that mech's character, big and bright enough to read at the normal camera distance. mechUpgBuild(J) returns
// three lists of meshes (toggled by mechUpgSet); J.upgA holds per-frame animations (banner, wings, drones, radar ...),
// J.upgLv(lv) applies reversible tweaks (material swaps, moved parts).
const MUPG_NAME = [null,
  ['护甲套件', '双联机枪 + 推进器', '王牌 · 极速'],
  ['大铠', '妖刀 + 旗指物', '王牌 · 新月'],
  ['安全帽', '快递无人机', '王牌 · 蜂后'],
  ['塔盾', '液压重拳', '王牌 · 金角'],
  ['流线座舱', '翼下导弹', '王牌 · 光翼'],
  ['反应装甲', '主炮', '王牌 · 雷达'],
];
function mechUpgBuild(J) {
  const M = MECHS[J.k] || MECHS[4], Lm = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || '#000000' });
  const main = Lm(M.col[0]), dark = Lm(M.col[1]), acc = Lm(M.col[2], '#1a1408'), gold = Lm('#f2c232', '#6a4600'), steel = Lm('#8a9198'), blk = Lm('#18191b');
  const glow = new THREE.MeshBasicMaterial({ color: M.glow }), add2 = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const u = [[], [], []], A = J.upgA = [], tw = J.upgTw = [], anim = (q, f) => { f.lv = q; A.push(f); };
  const put = (k, par, m) => { if (!par || !m) return m; par.add(m); u[k].push(m); return m; };
  const P = (k, par, geo, mat, x, y, z, rz, ry, rx, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); if (sx) m.scale.set(sx, sy || sx, sz || sx); return put(k, par, m); };
  const R = (k, par, mat, w, h, d, r, x, y, z, rz, ry, rx) => P(k, par, mRound(w, h, d, r), mat, x, y, z, rz, ry, rx);
  const S = (k, par, mat, w, h, d, r, x, y, z, rz, ry, rx) => P(k, par, mSoft(w, h, d, r), mat, x, y, z, rz, ry, rx);
  const B = (k, par, mat, w, h, d, x, y, z, rz, ry, rx) => P(k, par, boxG(w, h, d), mat, x, y, z, rz, ry, rx);
  const C = (k, par, mat, r1, r2, h, x, y, z, axis, seg) => { const g = new THREE.CylinderGeometry(r1, r2, h, seg || 14); if (axis === 'x') g.rotateZ(-Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2); return P(k, par, g, mat, x, y, z); };
  const G = (k, par, x, y, z, rz, ry, rx) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); g.rotation.set(rx || 0, ry || 0, rz || 0); return put(k, par, g); };
  const Rod = (k, par, mat, a, b, r) => { const m = vRod(par, mat, a, b, r, 8); u[k].push(m); return m; };
  const flame = c => { const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 12, 1, true).rotateX(Math.PI).translate(0, -0.5, 0), add2(c)); return m; }; // points down, tip at y = -1
  const flag = (w, h, bg, fg, txt, rim) => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 160; const x = cv.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 64, 160); if (rim) { x.strokeStyle = rim; x.lineWidth = 6; x.strokeRect(3, 3, 58, 154); }
    x.fillStyle = fg; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; [...txt].forEach((ch2, i) => x.fillText(ch2, 32, 50 + i * 58)); const t = new THREE.CanvasTexture(cv);
    const geo = new THREE.PlaneGeometry(w, h, 1, 6); return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide })); };
  const hazard = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); x.fillStyle = '#e2b93b'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#1a1a1a'; for (let i = -64; i < 128; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 11, 0); x.lineTo(i + 11 - 64, 64); x.lineTo(i - 64, 64); x.fill(); } const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.MeshLambertMaterial({ map: t }); };
  const ch = J.ch, hd = J.head, AR = J.arms, LG = J.legs, k = J.k;

  if (k === 1) { // ---------------- 疾风: the toy racer ----------------
    const org = Lm('#f07a2a', '#301000'), yel = Lm('#ffd23a', '#2a2000'), glass = new THREE.MeshLambertMaterial({ color: '#7fe8ff', transparent: true, opacity: 0.38, emissive: '#0a3040' });
    // Lv1 护甲套件: a clear racing visor over the face, padded yellow shoulder bumpers, a front bumper bar with hazard ends, orange knee pads
    P(0, hd, new THREE.SphereGeometry(0.34, 22, 14, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.22, Math.PI * 0.46), glass, 0.0, 0.34, 0, 0, Math.PI / 2, 0, 0.85, 0.8, 1.0);
    for (const a of AR) { S(0, a.sh, yel, 0.32, 0.16, 0.3, 0.07, 0, 0.13, a.s * 0.03); S(0, a.sh, org, 0.34, 0.05, 0.32, 0.02, 0, 0.06, a.s * 0.03); }
    S(0, ch, yel, 0.1, 0.12, 0.84, 0.05, 0.34, -0.05, 0); for (const s of [-1, 1]) S(0, ch, blk, 0.105, 0.125, 0.12, 0.04, 0.345, -0.05, s * 0.36);
    for (const L of LG) S(0, L.kn, org, 0.12, 0.2, 0.26, 0.05, 0.16, -0.02, 0);
    // Lv2 双联机枪 + 推进器: a second gun on the right arm, twin jet boosters on the back that light up when it runs
    const a1 = AR.find(a => a.s === 1); if (J.mg && a1) { const g2 = J.mg.clone(true); g2.position.copy(J.mg.position); a1.el.add(g2); u[1].push(g2); const bar2 = g2.children.find(c => c.position.y < -0.3 && c.isGroup); if (bar2) anim(1, () => { bar2.rotation.y = J.mgBar.rotation.y; }); }
    const jets = [];
    for (const s of [-1, 1]) { const jg = G(1, ch, -0.42, 0.34, s * 0.24); C(1, jg, steel, 0.12, 0.1, 0.42, 0, 0, 0, 'y', 16); C(1, jg, org, 0.13, 0.13, 0.07, 0, 0.12, 0, 'y', 16); C(1, jg, org, 0.125, 0.125, 0.05, 0, -0.08, 0, 'y', 16); C(1, jg, blk, 0.09, 0.11, 0.08, 0, -0.24, 0, 'y', 16); P(1, jg, new THREE.CircleGeometry(0.08, 14), glow, 0, -0.285, 0, 0, 0, Math.PI / 2);
      S(1, jg, main, 0.18, 0.2, 0.04, 0.02, -0.08, 0.06, s * 0.13); const f = flame('#7fe8ff'); f.position.set(0, -0.29, 0); f.scale.set(0.08, 0.5, 0.08); jg.add(f); u[1].push(f); jets.push(f); }
    anim(1, (p, dt, sp, mx) => { const on = sp > mx * 0.5; for (const f of jets) { f.visible = on; f.scale.y = (0.35 + 0.4 * clamp(sp / mx, 0, 1.2)) * (0.85 + FXR() * 0.3); } });
    // Lv3 王牌 · 极速: a gold racing spoiler, swept gold V-fins on the head, a glowing chest stripe; the scarf turns into a glowing gold streamer
    for (const s of [-1, 1]) { Rod(2, ch, gold, [-0.42, 0.56, s * 0.2], [-0.62, 0.86, s * 0.26], 0.025); }
    R(2, ch, gold, 0.26, 0.04, 1.1, 0.015, -0.66, 0.9, 0, 0.18); for (const s of [-1, 1]) R(2, ch, gold, 0.3, 0.2, 0.03, 0.01, -0.68, 0.84, s * 0.56); B(2, ch, glow, 0.2, 0.012, 1.0, -0.66, 0.925, 0, 0.18);
    for (const s of [-1, 1]) { const fin = G(2, hd, 0.2, 0.5, s * 0.04, 0, 0, -s * 0.75); R(2, fin, gold, 0.07, 0.46, 0.03, 0.015, -0.03, 0.22, 0, -0.35); B(2, fin, glow, 0.02, 0.36, 0.034, -0.0, 0.2, 0, -0.35); }
    R(2, hd, gold, 0.16, 0.1, 0.12, 0.03, 0.2, 0.5, 0);
    P(2, hd, new THREE.SphereGeometry(0.045, 12, 8), glow, 0.18, 0.57, 0);
    B(2, ch, glow, 0.012, 0.05, 0.62, 0.305, 0.12, 0); for (const L of LG) C(2, L.kn, glow, 0.172, 0.172, 0.03, 0, -0.03, 0, 'y', 20);
    const gs = Lm('#ffcf4a', '#ff7a00'), scf = J.scarf ? J.scarf.map(sg => sg.children.filter(c => c.isMesh)).flat() : []; const scf0 = scf.map(m => m.material);
    tw.push(lv => scf.forEach((m, i) => m.material = lv >= 3 ? gs : scf0[i]));
  }

  if (k === 2) { // ---------------- 赤刃: the samurai ----------------
    const red = Lm(M.col[0]), lac = Lm('#1d1416'), gd = Lm('#d4ad4a', '#4a3000'), lace = Lm('#b0242a');
    // Lv1 大铠: big layered 大袖 shoulder plates with gold rims, a lacquered 胴 with three lames, gold-trimmed 臑当 shin guards, a 喉輪 collar
    for (const a of AR) { const ws = G(0, a.sh, 0, -0.02, a.s * 0.34, 0, 0, a.s * 0.42); R(0, ws, lac, 0.5, 0.56, 0.04, 0.02, 0, -0.26, -a.s * 0.012); for (let q = 0; q < 4; q++) { const y = -0.06 - q * 0.135; R(0, ws, red, 0.5, 0.15, 0.07, 0.025, 0, y, a.s * 0.02); B(0, ws, gd, 0.51, 0.025, 0.075, 0, y - 0.07, a.s * 0.02); } for (const xq of [-0.15, 0, 0.15]) B(0, ws, lace, 0.025, 0.54, 0.08, xq, -0.26, a.s * 0.025); } /* one solid 大袖: lacquered backing, four overlapping red lames with gold edges, laced together */
    for (let q = 0; q < 3; q++) { R(0, ch, q % 2 ? red : lac, 0.06, 0.1, 0.84, 0.02, 0.4 - q * 0.02, 0.12 - q * 0.11, 0, 0.12); B(0, ch, gd, 0.065, 0.015, 0.85, 0.405 - q * 0.02, 0.07 - q * 0.11, 0, 0.12); }
    R(0, ch, lac, 0.44, 0.1, 0.86, 0.04, 0.0, 0.7, 0); B(0, ch, gd, 0.45, 0.02, 0.87, 0.0, 0.66, 0);
    for (const L of LG) { R(0, L.kn, lac, 0.06, 0.62, 0.3, 0.02, 0.2, -0.42, 0, 0.07); for (const yy of [-0.16, -0.42, -0.68]) B(0, L.kn, gd, 0.065, 0.025, 0.31, 0.2 - (yy + 0.42) * 0.07, yy, 0, 0.07); }
    // Lv2 妖刀 + 旗指物: the katana burns (a flame sheet along the edge), a tall war banner on the back that sways
    if (J.katBase) { let seg = J.katBase.parent; const fl = add2('#ff5a1a'), fl2 = add2('#ffd060'), fls = []; while (seg) { const L = 0.44; const a1 = B(1, seg, fl, L + 0.03, 0.16, 0.02, L / 2, -0.1, 0); const a2 = B(1, seg, fl2, L + 0.03, 0.05, 0.03, L / 2, -0.07, 0); fls.push(a1, a2); seg = seg.children.find(c => c.isGroup && c.position.x > 0.4); }
      anim(1, () => { const t = W.t * 14; fls.forEach((m, i) => { m.scale.y = 0.75 + 0.35 * Math.sin(t + i * 1.7); }); }); }
    const pole = G(1, ch, -0.5, 0.3, -0.18); Rod(1, pole, lac, [0, 0, 0], [0, 2.0, 0], 0.025); C(1, pole, gd, 0.04, 0.04, 0.05, 0, 2.02, 0, 'y'); B(1, pole, lac, 0.03, 0.03, 0.5, 0, 1.95, 0.22);
    const fg = G(1, pole, 0, 1.94, 0.02); const fm = flag(0.42, 1.05, '#a8262a', '#f3e6c8', '赤刃'); fm.position.set(0, -0.53, 0.22); fm.rotation.y = Math.PI / 2; fg.add(fm); u[1].push(fm);
    const fp = fm.geometry.attributes.position, f0 = Float32Array.from(fp.array);
    anim(1, (p, dt, sp, mx) => { const t = W.t, w = 0.06 + 0.12 * clamp(sp / mx, 0, 1); for (let n = 0; n < fp.count; n++) { const yy = f0[n * 3 + 1], xx = f0[n * 3]; fp.array[n * 3 + 2] = f0[n * 3 + 2] + Math.sin(t * 5 + xx * 7 + yy * 3) * w * (xx + 0.21) * 2; } fp.needsUpdate = true; pole.rotation.z = -0.08 - 0.1 * clamp(sp / mx, 0, 1) + Math.sin(t * 2.3) * 0.02; });
    // Lv3 王牌 · 新月: a huge gold crescent 前立, gold oni horns, three will-o'-wisp flames circling it, gold rims light up
    P(2, hd, new THREE.TorusGeometry(0.4, 0.035, 6, 30, Math.PI * 1.15), gd, 0.2, 0.62, 0, Math.PI * 1.0 - Math.PI * 0.075 + Math.PI, Math.PI / 2, 0, 1, 1, 1.4);
    P(2, hd, new THREE.SphereGeometry(0.06, 12, 8), glow, 0.2, 0.3, 0);
    for (const s of [-1, 1]) P(2, hd, new THREE.ConeGeometry(0.045, 0.3, 8), gd, 0.02, 0.38, s * 0.15, -0.15, 0, s * 0.55);
    const wisp = []; for (let q = 0; q < 3; q++) { const o = G(2, J.root, 0, 2.0, 0); P(2, o, new THREE.SphereGeometry(0.2, 12, 10), add2('#ff6a1a'), 0, 0, 0); P(2, o, new THREE.SphereGeometry(0.11, 10, 8), add2('#ffb040'), 0, 0, 0); P(2, o, new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff0c0' }), 0, 0, 0); wisp.push(o); }
    anim(2, () => wisp.forEach((o, q) => { const a = W.t * 1.6 + q * 2.094; o.position.set(Math.cos(a) * 1.0, 1.9 + Math.sin(W.t * 3 + q) * 0.18, Math.sin(a) * 1.0); o.scale.setScalar(0.85 + 0.25 * Math.sin(W.t * 9 + q * 3)); }));
    tw.push(lv => { gd.emissive.set(lv >= 3 ? '#9a6a00' : '#4a3000'); });
  }

  if (k === 3) { // ---------------- 工蜂: the delivery bee ----------------
    const yel = Lm('#ffc93a', '#2a1c00'), brn = Lm('#5b4a3a'), mint = Lm(M.col[2]), wing = new THREE.MeshLambertMaterial({ color: '#e8fdff', transparent: true, opacity: 0.62, emissive: '#3a7a80', side: THREE.DoubleSide, depthWrite: false });
    const HR = 0.42, HS = [0.95, 0.9, 1.12];
    // Lv1 安全帽: a yellow hard hat with a brim, ridge and a headlamp; round padded shoulder and knee pads; a padded belly bumper
    P(0, hd, new THREE.SphereGeometry(HR + 0.04, 26, 10, 0, Math.PI * 2, 0, Math.PI * 0.27), yel, 0, 0.4, 0, 0, 0, 0, HS[0], HS[1], HS[2]);
    P(0, hd, new THREE.CylinderGeometry(0.36, 0.38, 0.03, 30), yel, 0.05, 0.665, 0, 0, 0, 0, 1.05, 1, 1.12); R(0, hd, yel, 0.42, 0.07, 0.07, 0.03, 0.0, 0.81, 0);
    C(0, hd, steel, 0.055, 0.055, 0.06, 0.3, 0.72, 0, 'x'); P(0, hd, new THREE.CircleGeometry(0.045, 14), glow, 0.332, 0.72, 0, 0, Math.PI / 2, 0);
    for (const a of AR) P(0, a.sh, new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), brn, 0, 0.02, a.s * 0.02);
    for (const L of LG) S(0, L.kn, brn, 0.12, 0.16, 0.24, 0.05, 0.15, 0, 0);
    S(0, ch, brn, 0.08, 0.14, 0.56, 0.05, 0.33, -0.08, 0, 0, 0); B(0, ch, yel, 0.085, 0.03, 0.5, 0.335, -0.08, 0);
    tw.push(lv => { if (J.ant) { J.ant.userData.y0 = J.ant.userData.y0 != null ? J.ant.userData.y0 : J.ant.position.y; J.ant.position.y = J.ant.userData.y0 + (lv >= 1 ? 0.08 : 0); } });
    // Lv2 快递无人机: two little quadcopters with parcels hovering beside its head (rotors spin), a launcher tube on the rack
    const drones = [];
    for (const s of [-1, 1]) { const d = G(1, ch, -0.1, 1.55, s * 0.62); S(1, d, mint, 0.2, 0.08, 0.2, 0.035, 0, 0, 0); P(1, d, new THREE.CircleGeometry(0.03, 10), glow, 0.101, 0, 0, 0, Math.PI / 2, 0); const rot = [];
      for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { Rod(1, d, brn, [0, 0, 0], [dx * 0.16, 0.03, dz * 0.16], 0.012); const r = G(1, d, dx * 0.16, 0.06, dz * 0.16); C(1, r, blk, 0.02, 0.02, 0.04, 0, -0.02, 0, 'y', 8); B(1, r, steel, 0.2, 0.008, 0.03, 0, 0, 0); B(1, r, steel, 0.03, 0.008, 0.2, 0, 0, 0); rot.push(r); }
      Rod(1, d, brn, [0, -0.04, 0], [0, -0.16, 0], 0.008); const pk = R(1, d, Lm('#b8893a'), 0.14, 0.12, 0.14, 0.02, 0, -0.22, 0); B(1, d, Lm('#e8d9a8'), 0.145, 0.03, 0.145, 0, -0.22, 0); drones.push({ d, rot, s, pk }); }
    anim(1, () => drones.forEach(({ d, rot, s }) => { d.position.y = 1.55 + Math.sin(W.t * 2.6 + s) * 0.08; d.rotation.z = Math.sin(W.t * 1.7 + s) * 0.08; rot.forEach((r, i) => r.rotation.y = W.t * (30 + i)); }));
    if (J.rack) { const lt = G(1, J.rack, -0.2, 1.02, 0, -0.25); C(1, lt, mint, 0.11, 0.11, 0.62, 0.12, 0, 0, 'x', 16); C(1, lt, brn, 0.125, 0.125, 0.06, 0.42, 0, 0, 'x', 16); C(1, lt, brn, 0.125, 0.125, 0.06, -0.16, 0, 0, 'x', 16); P(1, lt, new THREE.CircleGeometry(0.09, 14), blk, 0.455, 0, 0, 0, Math.PI / 2, 0); }
    // Lv3 王牌 · 蜂后: two pairs of buzzing see-through bee wings, gold-and-black belly stripes, curly bee antennae, a gold stinger on the tail
    const wings = [];
    for (const s of [-1, 1]) for (let q = 0; q < 2; q++) { const wg = G(2, ch, -0.36, 0.62 - q * 0.2, s * 0.18); const L = q ? 0.8 : 1.15; P(2, wg, new THREE.CircleGeometry(L / 2, 20), wing, -L * 0.15, 0, s * L * 0.45, 0, 0, Math.PI / 2, 1.0, 0.45, 1);
      const ed = new THREE.Mesh(new THREE.TorusGeometry(L / 2, 0.012, 4, 24), gold); ed.position.set(-L * 0.15, 0, s * L * 0.45); ed.rotation.x = Math.PI / 2; ed.scale.set(1, 0.45, 1); wg.add(ed); u[2].push(ed); wings.push({ wg, s, q }); }
    anim(2, (p, dt, sp) => wings.forEach(({ wg, s, q }) => { const f = Math.sin(W.t * 42 + q * 1.3); wg.rotation.x = s * (0.25 + 0.35 * f); wg.rotation.z = 0.35 + q * 0.25; }));
    for (let q = 0; q < 3; q++) S(2, ch, q % 2 ? gold : blk, 0.63, 0.07, 0.71, 0.03, 0, 0.0 + q * 0.09, 0);
    for (const s of [-1, 1]) { const ag = G(2, hd, 0.12, 0.7, s * 0.14); Rod(2, ag, blk, [0, 0, 0], [0.05, 0.22, s * 0.06], 0.014); Rod(2, ag, blk, [0.05, 0.22, s * 0.06], [0.18, 0.32, s * 0.1], 0.014); P(2, ag, new THREE.SphereGeometry(0.05, 12, 8), gold, 0.19, 0.33, s * 0.1); }
    P(2, hd, new THREE.ConeGeometry(0.17, 0.16, 5), gold, 0, 0.88, 0); for (let q = 0; q < 5; q++) { const a = q / 5 * Math.PI * 2; P(2, hd, new THREE.SphereGeometry(0.025, 8, 6), glow, Math.cos(a) * 0.12, 0.92, Math.sin(a) * 0.12); }
    if (J.tail && J.tail.length) { const tl = J.tail[J.tail.length - 1]; P(2, tl, new THREE.ConeGeometry(0.05, 0.22, 10), gold, -0.14, 0, 0, Math.PI / 2); }
    tw.push(lv => { if (J.ant) J.ant.visible = lv < 3; });
  }

  if (k === 4) { // ---------------- 铁卫: the fortress ----------------
    const hz = hazard(), yel = Lm(M.col[2], '#2a1c00');
    // Lv1 塔盾: a tall tower shield on the left forearm (hazard border, glowing emblem), extra hazard-striped pauldron caps, shin plates
    const a0 = AR.find(a => a.s === -1) || AR[0], sh0 = G(0, a0.el, 0.04, -0.4, a0.s * 0.36);
    R(0, sh0, main, 0.12, 1.1, 0.72, 0.06, 0, 0, 0); R(0, sh0, dark, 0.13, 0.96, 0.58, 0.05, 0.01, 0, 0); for (const yy of [-0.52, 0.52]) B(0, sh0, hz, 0.14, 0.07, 0.72, 0.005, yy, 0);
    R(0, sh0, yel, 0.14, 0.3, 0.3, 0.06, 0.015, 0.08, 0, Math.PI / 4); P(0, sh0, new THREE.CircleGeometry(0.09, 6), glow, 0.085, 0.08, 0, 0, Math.PI / 2, 0); P(0, sh0, new THREE.CircleGeometry(0.09, 6), glow, -0.085, 0.08, 0, 0, -Math.PI / 2, 0);
    for (const a of AR) { R(0, a.sh, main, 0.58, 0.12, 0.5, 0.05, 0, 0.26, a.s * 0.08, 0, 0, a.s * 0.25); B(0, a.sh, hz, 0.6, 0.05, 0.5, 0, 0.33, a.s * 0.09, 0, 0, a.s * 0.25); }
    for (const L of LG) { R(0, L.kn, main, 0.08, 0.55, 0.36, 0.03, 0.24, -0.34, 0, 0.06); B(0, L.kn, hz, 0.085, 0.06, 0.37, 0.24, -0.08, 0, 0.06); }
    // Lv2 液压重拳: huge piston gauntlets (knuckle block, twin rams, glowing vents), bigger exhaust stacks that breathe flame
    const vents = [];
    for (const a of AR) { R(1, a.el, dark, 0.34, 0.3, 0.38, 0.06, 0.02, -0.74, 0); for (let q = 0; q < 4; q++) R(1, a.el, steel, 0.1, 0.1, 0.085, 0.02, 0.19, -0.74, (q - 1.5) * 0.09);
      for (const s2 of [-1, 1]) { C(1, a.el, steel, 0.04, 0.04, 0.5, -0.14, -0.38, s2 * 0.12, 'y', 10); C(1, a.el, blk, 0.055, 0.055, 0.16, -0.14, -0.2, s2 * 0.12, 'y', 10); }
      for (let q = 0; q < 3; q++) vents.push(B(1, a.el, glow, 0.02, 0.03, 0.22, 0.2, -0.32 - q * 0.08, 0)); }
    const fl = [];
    for (const s of [-1, 1]) { C(1, ch, steel, 0.11, 0.12, 0.32, -0.5, 1.18, s * 0.2, 'y', 12); C(1, ch, glow, 0.115, 0.115, 0.03, -0.5, 1.12, s * 0.2, 'y', 12); const f = flame('#ff8a3a'); f.rotation.x = Math.PI; f.position.set(-0.5, 1.33, s * 0.2); f.scale.set(0.08, 0.3, 0.08); ch.add(f); u[1].push(f); fl.push(f); }
    anim(1, (p, dt, sp, mx) => { const atk = (p._mpT != null ? p._mpT : 99) < 0.4; fl.forEach(f => { f.scale.y = (atk ? 0.6 : 0.22) * (0.8 + FXR() * 0.4); }); vents.forEach((v, i) => v.scale.y = 0.7 + 0.3 * Math.sin(W.t * 6 + i)); });
    // Lv3 王牌 · 金角: two great gold horns and a gold crest on the helmet, a big glowing reactor ring on the chest, gold shield rim and knuckles
    for (const s of [-1, 1]) { const hg = G(2, hd, 0.02, 0.24, s * 0.15); let par = hg; for (let q = 0; q < 5; q++) { const sg = new THREE.Group(); sg.position.set(0, q ? 0.1 : 0, 0); sg.rotation.set(s * (q ? 0.28 : 0.9), 0, q ? -0.18 : 0.2); par.add(sg); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045 - q * 0.008, 0.055 - q * 0.008, 0.11, 8).translate(0, 0.05, 0), gold); sg.add(m); par = sg; } }
    R(2, hd, gold, 0.3, 0.08, 0.05, 0.02, 0.06, 0.38, 0, 0.3); P(2, hd, new THREE.SphereGeometry(0.04, 10, 8), glow, 0.21, 0.34, 0);
    P(2, ch, new THREE.TorusGeometry(0.3, 0.04, 8, 30), gold, 0.4, 0.34, 0, 0, Math.PI / 2, 0); const halo = P(2, ch, new THREE.TorusGeometry(0.4, 0.025, 6, 30), add2(M.glow), 0.41, 0.34, 0, 0, Math.PI / 2, 0);
    anim(2, () => { halo.scale.setScalar(1 + 0.08 * Math.sin(W.t * 4)); });
    R(2, sh0, gold, 0.14, 1.14, 0.06, 0.02, 0, 0, 0.36); R(2, sh0, gold, 0.14, 1.14, 0.06, 0.02, 0, 0, -0.36); R(2, sh0, gold, 0.14, 0.06, 0.76, 0.02, 0, 0.56, 0); R(2, sh0, gold, 0.14, 0.06, 0.76, 0.02, 0, -0.56, 0);
    for (const a of AR) R(2, a.el, gold, 0.06, 0.12, 0.36, 0.02, 0.22, -0.74, 0);
  }

  if (k === 5) { // ---------------- 苍隼: the falcon ----------------
    const glass = new THREE.MeshLambertMaterial({ color: '#59b8ff', transparent: true, opacity: 0.5, emissive: '#0a2a50' }), red = Lm('#d83a2a'), wht = Lm('#f4f7fa');
    // Lv1 流线座舱: a pointed glass canopy over the head, a chest plate with a blue chevron, aero shin fairings
    P(0, hd, new THREE.ConeGeometry(0.17, 0.5, 14).rotateZ(-Math.PI / 2), glass, 0.3, 0.2, 0, 0, 0, 0, 1, 0.8, 1); P(0, hd, new THREE.ConeGeometry(0.18, 0.45, 14).rotateZ(-Math.PI / 2), wht, 0.12, 0.27, 0, 0, 0, 0, 1, 0.55, 1);
    for (const s of [-1, 1]) { R(0, ch, wht, 0.09, 0.42, 0.22, 0.04, 0.4, 0.26, s * 0.3, 0.12, s * 0.3); B(0, ch, acc, 0.095, 0.07, 0.2, 0.41, 0.34, s * 0.3, 0.12, s * 0.3); }
    for (const a of AR) { R(0, a.sh, wht, 0.5, 0.1, 0.4, 0.04, 0, 0.22, a.s * 0.1, 0, 0, a.s * 0.35); B(0, a.sh, acc, 0.5, 0.03, 0.12, 0, 0.27, a.s * 0.25, 0, 0, a.s * 0.35); }
    for (const L of LG) { R(0, L.kn, wht, 0.1, 0.6, 0.26, 0.04, 0.18, -0.4, 0, 0.1); B(0, L.kn, acc, 0.105, 0.3, 0.04, 0.19, -0.42, 0, 0.1); }
    // Lv2 翼下导弹: three missiles under each wing (red tips, fins), big afterburner rings on the back thrusters
    for (const wg of (J.wings || [])) { const s = wg.userData.s; for (let q = 0; q < 3; q++) { const m = G(1, wg, 0.0, -0.08, s * (0.3 + q * 0.2)); C(1, m, wht, 0.04, 0.04, 0.42, 0, 0, 0, 'x', 10); P(1, m, new THREE.ConeGeometry(0.04, 0.1, 10).rotateZ(-Math.PI / 2), red, 0.26, 0, 0); for (const r2 of [0, Math.PI / 2]) B(1, m, acc, 0.08, 0.12, 0.008, -0.17, 0, 0, 0, 0, r2); B(1, m, steel, 0.06, 0.04, 0.02, 0, 0.05, 0); } }
    for (const s of [-1, 1]) { C(1, ch, steel, 0.15, 0.17, 0.12, -0.62, 0.08, s * 0.16, 'y', 16); C(1, ch, glow, 0.155, 0.155, 0.025, -0.62, 0.03, s * 0.16, 'y', 16); }
    for (const s of [-1, 1]) { const rk = G(1, J.pel, 0.0, -0.08, s * 0.56); R(1, rk, dark, 0.66, 0.14, 0.28, 0.04, 0, 0.0, 0); for (let q = 0; q < 3; q++) { const m = G(1, rk, 0.04, -0.12, (q - 1) * 0.09); C(1, m, wht, 0.045, 0.045, 0.6, 0, 0, 0, 'x', 10); P(1, m, new THREE.ConeGeometry(0.045, 0.14, 10).rotateZ(-Math.PI / 2), red, 0.37, 0, 0); B(1, m, acc, 0.1, 0.16, 0.01, -0.24, 0, 0); } }
    // Lv3 王牌 · 光翼: glowing energy feathers fanned out past each wing tip, gold wing edges, a fanned tail of feathers, a swept gold crest
    const feathers = [];
    for (const wg of (J.wings || [])) { const s = wg.userData.s, tip = wg.userData.tip || wg; for (let q = 0; q < 4; q++) { const f = G(2, tip, -0.15 - q * 0.08, 0.02, s * 0.55); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.9).translate(0, 0.45, 0), add2('#7fd8ff')); m.rotation.x = -s * Math.PI / 2; m.rotation.y = 0; f.add(m); u[2].push(m); f.rotation.y = s * (-0.2 - q * 0.28); feathers.push(m); }
      R(2, wg, gold, 0.06, 0.03, 0.95, 0.01, 0.17, 0.02, s * 0.45); }
    anim(2, () => feathers.forEach((m, i) => { m.material.opacity = 0.45 + 0.2 * Math.sin(W.t * 5 + i); }));
    const lw = []; for (const s of [-1, 1]) for (let q = 0; q < 3; q++) { const g2 = G(2, ch, -0.45, 0.6, s * 0.22, 0.2 + q * 0.25, 0, -s * (0.75 + q * 0.38)); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.4 - q * 0.22).translate(0, (1.3 - q * 0.22) / 2, 0), add2(q ? '#5ac8ff' : '#aef0ff')); m.rotation.y = Math.PI / 2; g2.add(m); u[2].push(m); lw.push(m); }
    anim(2, () => lw.forEach((m, i) => { m.material.opacity = 0.4 + 0.2 * Math.sin(W.t * 3 + i * 0.7); }));
    const tail = G(2, J.pel, -0.3, 0.0, 0); for (let q = 0; q < 5; q++) { const a = (q - 2) * 0.32, f = G(2, tail, 0, 0, 0, 0, a); R(2, f, q % 2 ? acc : wht, 0.6, 0.03, 0.12, 0.01, -0.32, -0.06, 0, -0.12); R(2, f, gold, 0.12, 0.035, 0.13, 0.01, -0.62, -0.1, 0, -0.12); }
    for (const s of [-1, 1]) R(2, hd, gold, 0.36, 0.04, 0.05, 0.015, -0.12, 0.34, s * 0.07, 0.3, s * 0.2, 0);
    P(2, hd, new THREE.SphereGeometry(0.04, 10, 8), glow, 0.2, 0.3, 0);
  }

  if (k === 6) { // ---------------- 重炮: the artillery ----------------
    const tan = Lm(M.col[2]), olive = Lm(M.col[0]), brass = Lm('#c9a24a', '#2a1a00');
    // Lv1 反应装甲: a grid of reactive-armour bricks over the chest and shoulders, track skirts on the legs, a sandbag collar
    for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 4; c2++) { if (r2 === 1 && (c2 === 1 || c2 === 2)) continue; R(0, ch, (r2 + c2) % 2 ? olive : tan, 0.08, 0.15, 0.2, 0.02, 0.43, 0.12 + r2 * 0.2, (c2 - 1.5) * 0.23); }
    for (const a of AR) for (let c2 = 0; c2 < 3; c2++) R(0, a.sh, c2 % 2 ? tan : olive, 0.2, 0.08, 0.22, 0.02, (c2 - 1) * 0.21, 0.32, a.s * 0.08, 0, 0, a.s * 0.2);
    for (const L of LG) { R(0, L.kn, olive, 0.4, 0.42, 0.05, 0.02, 0.0, -0.28, L.s * 0.2); for (let q = 0; q < 3; q++) C(0, L.kn, blk, 0.05, 0.05, 0.06, -0.12 + q * 0.12, -0.42, L.s * 0.2, 'z', 10); }
    for (let q = 0; q < 5; q++) S(0, ch, tan, 0.2, 0.12, 0.26, 0.05, -0.05 + (q % 2) * 0.02, 0.72, (q - 2) * 0.2);
    // Lv2 主炮: a long main gun over the right shoulder (recoil sleeve, muzzle brake), muzzle brakes on the shoulder guns
    const mg = G(1, ch, -0.1, 1.02, 0.34); R(1, mg, dark, 0.6, 0.32, 0.34, 0.06, -0.1, 0, 0); C(1, mg, olive, 0.1, 0.1, 0.5, 0.36, 0.02, 0, 'x', 16); C(1, mg, steel, 0.075, 0.075, 1.3, 1.1, 0.02, 0, 'x', 14); C(1, mg, blk, 0.12, 0.12, 0.22, 1.82, 0.02, 0, 'x', 14);
    for (const s2 of [-1, 1]) B(1, mg, blk, 0.12, 0.05, 0.3, 1.82, 0.02 + s2 * 0.07, 0); C(1, mg, glow, 0.06, 0.06, 0.01, 1.935, 0.02, 0, 'x', 12); J.upgMuz = vMark(mg, 1.95, 0.02, 0); u[1].push(J.upgMuz);
    for (const gn of (J.guns || [])) { C(1, gn, blk, 0.1, 0.1, 0.16, 1.2, 0.02, 0, 'x', 12); B(1, gn, blk, 0.1, 0.18, 0.04, 1.2, 0.02, 0); }
    anim(1, (p) => { const r = (p._mpT != null ? p._mpT : 99); mg.position.x = -0.1 - (r < 0.25 ? 0.18 * (1 - r / 0.25) : 0); });
    // Lv3 王牌 · 雷达: a spinning radar dish on the back, glowing heat rings on the main gun, gold muzzle brakes, a whip antenna with a pennant
    const rd = G(2, ch, -0.55, 1.05, -0.3); C(2, rd, steel, 0.04, 0.04, 0.35, 0, 0.17, 0, 'y', 10); const dish = G(2, rd, 0, 0.4, 0); P(2, dish, new THREE.SphereGeometry(0.34, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.32), tan, 0, 0, 0, 0, 0, Math.PI / 2 - 0.4); P(2, dish, new THREE.TorusGeometry(0.29, 0.02, 6, 24), gold, 0.09, 0.03, 0, 0, Math.PI / 2 - 0.4 + Math.PI / 2, 0); Rod(2, dish, steel, [0, 0, 0], [0.3, 0.1, 0], 0.012); P(2, dish, new THREE.SphereGeometry(0.035, 8, 6), glow, 0.3, 0.1, 0);
    anim(2, (p, dt) => { dish.rotation.y += dt * 1.6; });
    const rings = []; for (let q = 0; q < 4; q++) rings.push(C(2, mg, add2('#ff8a2a'), 0.085, 0.085, 0.05, 0.7 + q * 0.26, 0.02, 0, 'x', 14));
    anim(2, () => rings.forEach((r, i) => r.material.opacity = 0.35 + 0.3 * Math.sin(W.t * 4 - i)));
    C(2, mg, gold, 0.125, 0.125, 0.23, 1.82, 0.02, 0, 'x', 14);
    const ant = G(2, ch, -0.6, 0.9, 0.42); Rod(2, ant, blk, [0, 0, 0], [-0.1, 1.3, 0], 0.012); const pn = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.18).translate(-0.2, 0, 0), new THREE.MeshLambertMaterial({ color: '#d84a2a', side: THREE.DoubleSide })); pn.position.set(-0.1, 1.2, 0); ant.add(pn); u[2].push(pn);
    anim(2, (p, dt, sp, mx) => { pn.rotation.y = Math.sin(W.t * 4) * 0.35; ant.rotation.z = Math.sin(W.t * 3.1) * 0.04 - 0.08 * clamp(sp / mx, 0, 1); });
  }
  [0, 1, 2].forEach(q => u[q].forEach(o => o.traverse(m => { if (m.isMesh && !m.material.transparent && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; })));
  return u;
}
function mechUpgTick(J, p, dt, sp, mx) { if (!J.upgA || !J._ul) return; for (const f of J.upgA) if (J._ul > f.lv) f(p, dt, sp, mx || 1); }
/* ================= (round 40) fusion modules: what the second mech turns into on the body ================= */
// Built once per (body, module kind) and kept on the body's model; sized from the body's bounding box. tick(F, body p, dt, gunner aim, since the gunner's last shot)
function fuseModBuild(mm, kp) {
  const J = mm.userData.J; mm.updateMatrixWorld(true); const s0 = mm.scale.x; const bb = new THREE.Box3().setFromObject(J.root).applyMatrix4(mm.matrixWorld.clone().invert()), H = bb.max.y - bb.min.y, HW = Math.max(bb.max.z, -bb.min.z), BX = bb.min.x;
  const Lm = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || '#000000' }), gold = Lm('#f2c232', '#6a4600'), glow = c => new THREE.MeshBasicMaterial({ color: c });
  const add2 = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group(); g.name = 'fmod' + kp; const P = (par, geo, mt, x, y, z, rx, ry, rz) => { const o = new THREE.Mesh(geo, mt); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = !mt.transparent; par.add(o); return o; };
  const G2 = (par, x, y, z) => { const q = new THREE.Group(); q.position.set(x || 0, y || 0, z || 0); par.add(q); return q; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), Cy = (r1, r2, h, s) => new THREE.CylinderGeometry(r1, r2, h, s || 14);
  let tick = () => {};
  const yawTo = (F, p, gA) => -angDiff(p._ly != null ? p._ly : gA, gA);
  if (kp === 1) { // 疾风 → a little hovering gun that circles the body and turns to whatever the gunner aims at
    const mini = mkMech(1); mini.scale.setScalar(0.42); const o = G2(g, 0, H * 0.7, 0); o.add(mini); P(o, new THREE.TorusGeometry(0.45, 0.04, 6, 24), add2('#7fe8ff'), 0, -0.05, 0, Math.PI / 2);
    tick = (F, p, dt, gA, gT) => { const a = W.t * 0.9, R = HW * 0.75 + 0.45; o.position.set(Math.cos(a) * R * 0.7 - 0.1, H * 0.62 + Math.sin(W.t * 2.2) * 0.1, Math.sin(a) * R); mini.rotation.y = yawTo(F, p, gA); mini.position.x = gT < 0.12 ? -0.12 : 0; };
  } else if (kp === 2) { // 赤刃 → red lacquered plates on the shoulders + a giant blade floating at the back that slashes for the gunner
    const red = Lm('#a8262a'), lac = Lm('#1d1416');
    for (const s of [-1, 1]) { const sp = G2(g, 0, H * 0.72, s * (HW * 0.72 + 0.05)); for (let q = 0; q < 3; q++) { P(sp, B(0.75 - q * 0.08, 0.2, 0.08), q % 2 ? lac : red, 0, -q * 0.17, s * q * 0.03, s * 0.35, 0, 0); P(sp, B(0.76 - q * 0.08, 0.03, 0.09), gold, 0, -q * 0.17 - 0.1, s * q * 0.03, s * 0.35); } }
    P(g, new THREE.TorusGeometry(H * 0.18, 0.04, 6, 20, Math.PI * 1.15), gold, 0.1, H * 0.98, 0, 0, Math.PI / 2, Math.PI * 0.93);
    const bl = G2(g, BX + 0.05, H * 0.6, 0), sw = G2(bl, 0, 0, 0); const L = H * 0.62;
    P(sw, B(L, 0.22, 0.04), Lm('#e8ecf0', '#203040'), L / 2 + 0.25, 0, 0); P(sw, B(L, 0.04, 0.05), glow('#ffa040'), L / 2 + 0.25, -0.12, 0); P(sw, new THREE.ConeGeometry(0.11, 0.25, 4).rotateZ(-Math.PI / 2), Lm('#e8ecf0', '#203040'), L + 0.37, 0, 0); P(sw, B(0.06, 0.3, 0.2), gold, 0.2, 0, 0); P(sw, B(0.22, 0.07, 0.07), lac, 0.05, 0, 0); P(sw, B(L * 0.9, 0.22, 0.02), add2('#ff5a1a'), L / 2 + 0.3, -0.12, 0);
    tick = (F, p, dt, gA, gT) => { const y = yawTo(F, p, gA), k = gT < 0.35 ? gT / 0.35 : 1, sl = gT < 0.35; bl.rotation.y = sl ? y : 0; bl.position.y = H * 0.6 + Math.sin(W.t * 2) * 0.06; if (sl) sw.rotation.set(0, lerp(-1.1, 1.1, ease(k)), lerp(0.9, -0.4, ease(k))); else sw.rotation.set(0, -Math.PI / 2, Math.PI / 4 + Math.sin(W.t * 1.5) * 0.04); }; /* at rest it hangs diagonally across the back, flat side out; it swings toward the gunner's aim to cut */
  } else if (kp === 3) { // 工蜂 → rides piggyback on the body as a backpack launcher
    const mini = mkMech(3); mini.scale.setScalar(0.5); const o = G2(g, BX - 0.15, H * 0.45, 0); o.add(mini); mini.rotation.y = Math.PI;
    const tb = G2(o, -0.1, 1.15, 0); P(tb, Cy(0.13, 0.13, 0.8).rotateZ(Math.PI / 2), Lm('#8fd6c4'), 0.25, 0, 0); P(tb, Cy(0.15, 0.15, 0.08).rotateZ(Math.PI / 2), Lm('#5b4a3a'), 0.62, 0, 0); P(tb, new THREE.CircleGeometry(0.1, 14), glow('#9ff0e0'), 0.665, 0, 0, 0, Math.PI / 2);
    tick = (F, p, dt, gA, gT) => { tb.rotation.y = yawTo(F, p, gA); tb.rotation.z = 0.35; tb.position.x = -0.1 - (gT < 0.15 ? 0.12 : 0); o.position.y = H * 0.45 + Math.sin(W.t * 3) * 0.03; };
  } else if (kp === 4) { // 铁卫 → heavy hazard-striped plating + a tower shield that slams forward for the gunner
    const gr = Lm('#55606c'), dk = Lm('#2c333b'), yl = Lm('#e2b93b', '#2a1c00');
    for (const s of [-1, 1]) { const sp = G2(g, 0, H * 0.78, s * (HW * 0.7 + 0.05)); P(sp, new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gr, 0, 0, 0, 0, 0, s * 0.3).scale.set(1.2, 0.8, 1); P(sp, B(0.66, 0.07, 0.38), yl, 0, 0.04, s * 0.05, 0, 0, s * 0.3); P(sp, B(0.68, 0.04, 0.4), dk, 0, 0.08, s * 0.05, 0, 0, s * 0.3); }
    P(g, B(0.15, H * 0.3, HW * 1.4), gr, 0.42, H * 0.6, 0); P(g, B(0.16, 0.05, HW * 1.42), yl, 0.43, H * 0.72, 0);
    const sh = G2(g, 0.25, H * 0.45, -(HW * 0.75 + 0.25)); P(sh, B(0.12, H * 0.46, H * 0.3), gr, 0, 0, 0); P(sh, B(0.13, H * 0.38, H * 0.22), dk, 0.01, 0, 0); P(sh, B(0.14, 0.07, H * 0.3), yl, 0, H * 0.21, 0); P(sh, B(0.14, 0.07, H * 0.3), yl, 0, -H * 0.21, 0); P(sh, new THREE.CircleGeometry(0.15, 6), glow('#5fe0ff'), 0.09, 0, 0, 0, Math.PI / 2);
    tick = (F, p, dt, gA, gT) => { const k = gT < 0.3 ? Math.sin(gT / 0.3 * Math.PI) : 0; sh.position.x = 0.3 + k * 0.7; sh.rotation.y = -k * 0.6; };
  } else if (kp === 5) { // 苍隼 → two big wings on the back with jets and rocket rails under them
    const wh = Lm('#dfe6ee'), bl = Lm('#3a5a7a'), lb = Lm('#59b8ff', '#0a2a40'), wings = [];
    for (const s of [-1, 1]) { const w = G2(g, BX + 0.1, H * 0.78, s * 0.25); const span = H * 0.62; P(w, B(0.7, 0.06, span), wh, -0.1, 0, s * span / 2, 0, 0, 0); P(w, B(0.4, 0.07, span * 0.8), bl, -0.4, 0.01, s * span * 0.45); P(w, B(0.72, 0.065, 0.12), lb, -0.1, 0.01, s * span * 0.98);
      P(w, Cy(0.11, 0.14, 0.5).rotateZ(Math.PI / 2), Lm('#8a9198'), -0.2, -0.12, s * span * 0.35); P(w, new THREE.CircleGeometry(0.1, 12), glow('#9fe8ff'), -0.46, -0.12, s * span * 0.35, 0, -Math.PI / 2);
      for (let q = 0; q < 3; q++) { P(w, Cy(0.035, 0.035, 0.4).rotateZ(Math.PI / 2), wh, 0.05, -0.09, s * (span * 0.55 + q * 0.12)); P(w, new THREE.ConeGeometry(0.035, 0.1, 8).rotateZ(-Math.PI / 2), Lm('#d83a2a'), 0.3, -0.09, s * (span * 0.55 + q * 0.12)); }
      const fl = P(w, new THREE.ConeGeometry(0.09, 0.6, 10).rotateZ(Math.PI / 2).translate(-0.3, 0, 0), add2('#7fd8ff'), -0.46, -0.12, s * span * 0.35); wings.push({ w, s, fl }); }
    tick = (F, p, dt, gA, gT) => { const sp = clamp((p._spd || 0) / 3, 0, 1); for (const { w, s, fl } of wings) { w.rotation.x = s * (0.55 + 0.06 * Math.sin(W.t * 2.5)); w.rotation.y = s * 0.35; w.rotation.z = -0.15; /* swept up and back */ fl.scale.set(0.6 + sp * 0.9 + (gT < 0.1 ? 0.6 : 0), 1, 1); } };
  } else if (kp === 6) { // 重炮 → two long cannons on the shoulders that train on the gunner's aim and recoil
    const ol = Lm('#5a6b3a'), dk = Lm('#2e3622'), st = Lm('#8a9198'), guns = [];
    for (const s of [-1, 1]) { const b = G2(g, -0.1, H * 0.95, s * (HW * 0.7)); P(b, B(0.5, 0.3, 0.32), dk, 0, 0, 0); const gn = G2(b, 0.1, 0.05, 0); P(gn, Cy(0.11, 0.11, 0.5).rotateZ(Math.PI / 2), ol, 0.2, 0, 0); P(gn, Cy(0.075, 0.075, H * 0.55).rotateZ(Math.PI / 2), st, 0.45 + H * 0.27, 0, 0); P(gn, Cy(0.12, 0.12, 0.2).rotateZ(Math.PI / 2), Lm('#18191b'), 0.45 + H * 0.55, 0, 0); P(gn, new THREE.CircleGeometry(0.06, 12), glow('#ff9a3a'), 0.56 + H * 0.55, 0, 0, 0, Math.PI / 2); guns.push({ b, gn, s }); }
    tick = (F, p, dt, gA, gT) => { const y = yawTo(F, p, gA); for (const { b, gn, s } of guns) { b.rotation.y = clamp(y, -1.2, 1.2); gn.position.x = 0.1 - (gT < 0.25 ? 0.25 * (1 - gT / 0.25) * (s > 0 ? 1 : (gT > 0.08 ? 1 : 0)) : 0); } };
  }
  const ring = P(g, new THREE.RingGeometry(HW + 0.5, HW + 0.7, 40), add2('#ffd040'), 0, 0.05, 0, -Math.PI / 2); // the fusion halo at its feet
  g.userData.tick = (F, p, dt, gA, gT) => { tick(F, p, dt, gA, gT); ring.material.opacity = 0.35 + 0.2 * Math.sin(W.t * 4); ring.rotation.z = W.t * 0.6; };
  return g;
}
// per frame, on the body's model: size it up, show this fusion's module, aim it with the gunner
function fuseDraw(p, m, dt) {
  const F = W.fus, mm = m.mech, J = mm && mm.userData.J; if (!J) return;
  const on = !!(F && F.a === p.i && J.k === F.kb), sc = on ? (F.same ? FUS.sameScale : FUS.scale) : 1, cur = mm.userData.fsc || 1;
  const s2 = lerp(cur, sc, Math.min(1, dt * 4)); mm.userData.fsc = Math.abs(s2 - sc) < 0.005 ? sc : s2;
  const mods = mm.userData.fmods || (mm.userData.fmods = {});
  for (const k in mods) mods[k].visible = on && +k === F.kp;
  if (!on) return; const md = mods[F.kp] || (mods[F.kp] = (() => { const g = fuseModBuild(mm, F.kp); mm.add(g); return g; })());
  const G = W.p[F.g], gT = W.t - (RND.fgT != null ? RND.fgT : -9); md.userData.tick(F, p, dt, G ? G.aim : p.aim, gT);
}
