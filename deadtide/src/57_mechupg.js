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
// Built once per (body, module kind) and kept on the body's model; fitted to its chest, shoulders and head (round 40b). tick(F, body p, dt, gunner aim, since the gunner's last shot)
function fuseModBuild(mm, kp) {
  /* (round 40b) fitted to the body: everything is laid out in the chest's own frame (J.ch) from measured anchors — the shoulder joints,
     the chest box without arms / head / upgrade parts, the head box — so plates sit on the shoulders, the wings and the rider come off
     the real back, and the cannons sit on the real shoulder line whatever the body's shape; it also leans and turns with the torso */
  const J = mm.userData.J, ch = J.ch; mm.updateMatrixWorld(true);
  const upg = J.upg ? [].concat(...J.upg) : [], CB = mechUpgBox(ch, [J.head, ...J.arms.map(a => a.sh), ...upg]);
  const inv = new THREE.Matrix4().copy(ch.matrixWorld).invert(), shs = J.arms.map(a => new THREE.Vector3().setFromMatrixPosition(a.sh.matrixWorld).applyMatrix4(inv));
  const SZ = shs.length ? Math.max(...shs.map(q => Math.abs(q.z))) : CB.max.z, SY = shs.length ? shs.reduce((t, q) => t + q.y, 0) / shs.length : CB.max.y * 0.85, SX = shs.length ? shs.reduce((t, q) => t + q.x, 0) / shs.length : 0;
  const BACK = Math.min(CB.min.x, SX - 0.12), FRONT = Math.max(CB.max.x, SX + 0.12), BOT = CB.min.y, A = (J.D && J.D.arm) || 1;
  const hb = mechUpgBox(J.head, upg), hs = J.head.scale.x || 1, hbC = mechUpgBox(ch, [...ch.children.filter(o => o !== J.head), ...upg]), HZ = Math.max(hbC.max.z, -hbC.min.z); /* the head's half-width in the chest frame (工蜂's is huge) */
  const old = Object.values(mm.userData.fmods || {}), fb = mechUpgBox(J.root, [...upg, ...old]), HW = Math.max(fb.max.z, -fb.min.z, 0.5) * J.root.scale.x; /* side-to-side only (a katana sticking out front would blow the halo up), without other fusions' parts */
  const Lm = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || '#000000' }), gold = Lm('#f2c232', '#6a4600'), glow = c => new THREE.MeshBasicMaterial({ color: c });
  const add2 = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group(); g.name = 'fmod' + kp; ch.add(g); const ex = []; g.userData.ex = ex;
  const P = (par, geo, mt, x, y, z, rx, ry, rz) => { const o = new THREE.Mesh(geo, mt); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = !mt.transparent; par.add(o); return o; };
  const G2 = (par, x, y, z) => { const q = new THREE.Group(); q.position.set(x || 0, y || 0, z || 0); par.add(q); return q; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), Cy = (r1, r2, h, s) => new THREE.CylinderGeometry(r1, r2, h, s || 14);
  let tick = () => {};
  const yawTo = (F, p, gA) => -angDiff(p._ly != null ? p._ly : gA, gA) - (J.pel.rotation.y + J.tor.rotation.y); /* relative to where the chest faces now */
  if (kp === 1) { // 疾风 → a little gun drone that hovers around the body at head height and turns to whatever the gunner aims at
    const mini = mkMech(1); mini.scale.setScalar(0.4); const o = G2(g, 0, SY + 0.2, 0); o.add(mini);
    P(o, new THREE.TorusGeometry(0.22, 0.03, 6, 20), add2('#7fe8ff'), 0, -0.04, 0, Math.PI / 2); const jet = P(o, new THREE.ConeGeometry(0.1, 0.34, 10).rotateX(Math.PI), add2('#7fd8ff'), 0, -0.2, 0);
    tick = (F, p, dt, gA, gT) => { const a = W.t * 0.8, R = SZ + 0.62; o.position.set(SX + Math.cos(a) * R * 0.8, SY + 0.22 + Math.sin(W.t * 2.2) * 0.07, Math.sin(a) * R); mini.rotation.y = yawTo(F, p, gA); mini.position.x = gT < 0.12 ? -0.1 : 0; jet.scale.y = 0.8 + Math.sin(W.t * 23) * 0.2; };
  } else if (kp === 2) { // 赤刃 → red lacquered sode hanging off each shoulder, a gold crescent on the helmet, a greatsword across the back that slashes for the gunner
    const red = Lm('#a8262a'), lac = Lm('#1d1416'), wd = 0.5 * A;
    for (const s of [-1, 1]) { const sp = G2(g, SX, SY + 0.1, s * (SZ + 0.16 * A)); sp.rotation.x = -s * 0.22; P(sp, B(wd + 0.02, 0.06, 0.13), red, 0, 0.03, -s * 0.03); P(sp, B(wd + 0.03, 0.02, 0.135), gold, 0, 0.065, -s * 0.03);
      for (let q = 0; q < 3; q++) { P(sp, B(wd - q * 0.03, 0.15, 0.05), q % 2 ? lac : red, 0, -0.06 - q * 0.135, s * q * 0.035); P(sp, B(wd - q * 0.03 + 0.01, 0.022, 0.06), gold, 0, -0.13 - q * 0.135, s * q * 0.035); } }
    const hw = Math.max(0.12, (hb.max.z - hb.min.z) / 2), cr = G2(J.head, hb.max.x - 0.04 / hs, hb.max.y - 0.06 / hs, 0); ex.push(cr);
    P(cr, new THREE.TorusGeometry(hw * 1.25, 0.03 / hs, 6, 22, Math.PI * 0.9), gold, 0, hw * 0.25, 0, 0, Math.PI / 2, Math.PI * 1.05); P(cr, B(0.05 / hs, 0.09 / hs, 0.07 / hs), gold, 0, 0, 0);
    const bl = G2(g, BACK - 0.08, SY - 0.12, 0), sw = G2(bl, 0, 0, 0); const L = clamp((SY - BOT) * 1.35 + 0.3, 1.0, 1.45);
    P(sw, B(L, 0.2, 0.04), Lm('#e8ecf0', '#203040'), L / 2 + 0.25, 0, 0); P(sw, B(L, 0.04, 0.05), glow('#ffa040'), L / 2 + 0.25, -0.11, 0); P(sw, new THREE.ConeGeometry(0.1, 0.24, 4).rotateZ(-Math.PI / 2), Lm('#e8ecf0', '#203040'), L + 0.37, 0, 0); P(sw, B(0.06, 0.3, 0.2), gold, 0.2, 0, 0); P(sw, B(0.22, 0.07, 0.07), lac, 0.05, 0, 0); P(sw, B(L * 0.9, 0.2, 0.02), add2('#ff5a1a'), L / 2 + 0.3, -0.11, 0);
    tick = (F, p, dt, gA, gT) => { const y = yawTo(F, p, gA), k = gT < 0.35 ? gT / 0.35 : 1, sl = gT < 0.35; bl.rotation.y = sl ? y : 0; bl.position.set(sl ? SX : BACK - 0.08, SY - 0.12 + Math.sin(W.t * 2) * 0.04, 0); if (sl) sw.rotation.set(0, lerp(-1.1, 1.1, ease(k)), lerp(0.9, -0.4, ease(k))); else sw.rotation.set(0, -Math.PI / 2, Math.PI / 4 + Math.sin(W.t * 1.5) * 0.03); }; /* at rest it hangs diagonally across the back, flat side out; it swings toward the gunner's aim to cut */
  } else if (kp === 3) { // 工蜂 → rides piggyback (facing backwards) as a backpack launcher, head peeking over the shoulders
    const mini = mkMech(3), ms = 0.46; mini.updateMatrixWorld(true); const msy = new THREE.Vector3().setFromMatrixPosition(mini.userData.J.arms[0].sh.matrixWorld).y * ms; mini.scale.setScalar(ms); const o = G2(g, BACK - 0.2, SY + 0.04 - msy, 0); /* its shoulders just under the body's, the big head over them */ o.add(mini); mini.rotation.y = Math.PI;
    const tb = G2(o, 0, msy + 0.05, 0.36); P(tb, Cy(0.12, 0.12, 0.7).rotateZ(Math.PI / 2), Lm('#8fd6c4'), 0.2, 0, 0); P(tb, Cy(0.14, 0.14, 0.08).rotateZ(Math.PI / 2), Lm('#5b4a3a'), 0.52, 0, 0); P(tb, new THREE.CircleGeometry(0.09, 14), glow('#9ff0e0'), 0.565, 0, 0, 0, Math.PI / 2);
    const y0 = o.position.y; tick = (F, p, dt, gA, gT) => { tb.rotation.y = yawTo(F, p, gA); tb.rotation.z = 0.3; tb.position.x = gT < 0.15 ? -0.1 : 0; o.position.y = y0 + Math.sin(W.t * 3) * 0.025; };
  } else if (kp === 4) { // 铁卫 → heavy hazard-striped pauldrons + a chest plate + a tower shield on the left that slams forward for the gunner
    const gr = Lm('#8794a1'), dk = Lm('#4a5560'), yl = Lm('#e2b93b', '#2a1c00');
    for (const s of [-1, 1]) { const sp = G2(g, SX, SY + 0.12, s * (SZ + 0.05)); sp.rotation.x = -s * 0.25; P(sp, new THREE.SphereGeometry(0.27 * A, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), gr, 0, 0, 0).scale.set(1.25, 0.75, 1.05); P(sp, Cy(0.28 * A, 0.3 * A, 0.07, 18), yl, 0, -0.02, 0).scale.set(1.25, 1, 1.05); P(sp, Cy(0.3 * A, 0.31 * A, 0.035, 18), dk, 0, -0.06, 0).scale.set(1.25, 1, 1.05); }
    const cw = Math.max(0.2, Math.min(CB.max.z, SZ - 0.1)), chh = Math.max(0.3, (SY - BOT) * 0.62); P(g, B(0.07, chh, cw * 1.5), gr, FRONT + 0.03, SY - chh / 2 - 0.02, 0); P(g, B(0.075, 0.05, cw * 1.52), yl, FRONT + 0.035, SY - 0.06, 0); P(g, B(0.075, 0.05, cw * 1.52), yl, FRONT + 0.035, SY - chh + 0.05, 0);
    const h = clamp((SY - BOT) * 1.5, 0.85, 1.15), w = h * 0.6, sh = G2(g, 0.2, SY - 0.42, -(SZ + 0.3 * A + 0.1)); P(sh, B(0.1, h, w), gr, 0, 0, 0); P(sh, B(0.11, h * 0.8, w * 0.72), dk, 0.01, 0, 0);
    for (const t of [-1, 1]) P(sh, B(0.12, 0.06, w), yl, 0, t * h * 0.44, 0); P(sh, new THREE.CircleGeometry(0.12, 6), glow('#5fe0ff'), 0.07, h * 0.08, 0, 0, Math.PI / 2); P(sh, B(0.12, 0.04, w * 0.5), gold, 0.02, -h * 0.12, 0);
    tick = (F, p, dt, gA, gT) => { const k = gT < 0.3 ? Math.sin(gT / 0.3 * Math.PI) : 0; sh.position.x = 0.2 + k * 0.6; sh.rotation.y = -k * 0.5; };
  } else if (kp === 5) { // 苍隼 → two big wings off the upper back, swept up and back, jets and rocket rails underneath
    const wh = Lm('#dfe6ee'), bl = Lm('#3a5a7a'), lb = Lm('#59b8ff', '#0a2a40'), wings = [], span = clamp(SZ * 2.1, 1.05, 1.45);
    P(g, B(0.16, 0.42, SZ * 0.9), bl, BACK - 0.04, SY + 0.08, 0); /* the wing root on the back */
    for (const s of [-1, 1]) { const w = G2(g, BACK - 0.02, SY + 0.26, s * 0.18); /* (round 40b) chord centred on the root so the wing doesn't trail far behind and read low */
      P(w, B(0.56, 0.06, span), wh, 0.08, 0, s * span / 2); P(w, B(0.32, 0.07, span * 0.8), bl, -0.16, 0.01, s * span * 0.45); P(w, B(0.58, 0.065, 0.1), lb, 0.08, 0.01, s * span * 0.98);
      P(w, Cy(0.1, 0.13, 0.46).rotateZ(Math.PI / 2), Lm('#8a9198'), -0.02, -0.11, s * span * 0.32); P(w, new THREE.CircleGeometry(0.09, 12), glow('#9fe8ff'), -0.26, -0.11, s * span * 0.32, 0, -Math.PI / 2);
      for (let q = 0; q < 3; q++) { P(w, Cy(0.032, 0.032, 0.36).rotateZ(Math.PI / 2), wh, 0.18, -0.08, s * (span * 0.55 + q * 0.11)); P(w, new THREE.ConeGeometry(0.032, 0.09, 8).rotateZ(-Math.PI / 2), Lm('#d83a2a'), 0.4, -0.08, s * (span * 0.55 + q * 0.11)); }
      const fl = P(w, new THREE.ConeGeometry(0.08, 0.55, 10).rotateZ(Math.PI / 2).translate(-0.27, 0, 0), add2('#7fd8ff'), -0.26, -0.11, s * span * 0.32); wings.push({ w, s, fl }); }
    tick = (F, p, dt, gA, gT) => { const sp = clamp((p._spd || 0) / 3, 0, 1); for (const { w, s, fl } of wings) { w.rotation.set(-s * (0.62 + 0.05 * Math.sin(W.t * 2.5)), -s * 0.22, 0.08, 'YXZ'); /* raised into a V and swept back */ fl.scale.set(0.6 + sp * 0.9 + (gT < 0.1 ? 0.6 : 0), 1, 1); } };
  } else if (kp === 6) { // 重炮 → two cannons sitting on the shoulder line that train on the gunner's aim and recoil
    const ol = Lm('#5a6b3a'), dk = Lm('#2e3622'), st = Lm('#8a9198'), guns = [], bz = Math.max(0.3, SZ * 0.8, HZ + 0.24), L = 0.85; /* clear of the head so the barrels don't run through it */
    for (const s of [-1, 1]) { if (bz > SZ * 0.9) P(g, B(0.14, 0.1, bz - SZ * 0.5), dk, (SX + BACK) / 2, SY + 0.12, s * (bz + SZ * 0.5) / 2); /* a mounting arm out from the shoulder */ const b = G2(g, (SX + BACK) / 2, SY + 0.24, s * bz); P(b, B(0.46, 0.26, 0.3), dk, 0, 0, 0); P(b, B(0.3, 0.12, 0.2), ol, 0, -0.17, 0); const gn = G2(b, 0.1, 0.05, 0); P(gn, Cy(0.1, 0.1, 0.42).rotateZ(Math.PI / 2), ol, 0.18, 0, 0); P(gn, Cy(0.065, 0.065, L).rotateZ(Math.PI / 2), st, 0.38 + L / 2, 0, 0); P(gn, Cy(0.1, 0.1, 0.16).rotateZ(Math.PI / 2), Lm('#18191b'), 0.38 + L, 0, 0); P(gn, new THREE.CircleGeometry(0.05, 12), glow('#ff9a3a'), 0.465 + L, 0, 0, 0, Math.PI / 2); guns.push({ b, gn, s }); }
    tick = (F, p, dt, gA, gT) => { const y = yawTo(F, p, gA); for (const { b, gn, s } of guns) { b.rotation.y = clamp(y, -1.2, 1.2); gn.position.x = 0.1 - (gT < 0.25 ? 0.22 * (1 - gT / 0.25) * (s > 0 ? 1 : (gT > 0.08 ? 1 : 0)) : 0); } };
  }
  const ring = P(mm, new THREE.RingGeometry(HW + 0.1, HW + 0.22, 40), add2('#ffd040'), 0, 0.05, 0, -Math.PI / 2); ex.push(ring); // the fusion halo at its feet
  g.userData.tick = (F, p, dt, gA, gT) => { tick(F, p, dt, gA, gT); ring.material.opacity = 0.3 + 0.18 * Math.sin(W.t * 4); ring.rotation.z = W.t * 0.6; };
  return g;
}
// per frame, on the body's model: size it up, show this fusion's module, aim it with the gunner
function fuseDraw(p, m, dt) {
  const F = W.fus, mm = m.mech, J = mm && mm.userData.J; if (!J) return;
  const on = !!(F && F.a === p.i && J.k === F.kb), sc = on ? (F.same ? FUS.sameScale : FUS.scale) : 1, cur = mm.userData.fsc || 1;
  const A = on && RND.fusA && RND.fusA.a === p.i ? RND.fusA : null, U = !on && RND.fusU && RND.fusU.a === p.i && RND.fusU.t < FUSA.out ? RND.fusU : null;
  if (A) { const k = clamp((A.t - FUSA.hit) / FUSA.asm, 0, 1); mm.userData.fsc = A.t < FUSA.hit ? 1 - 0.07 * Math.sin(A.t / FUSA.hit * Math.PI) : 1 + (sc - 1) * backOut(k, 2.4); } /* (round 40c) braces while the partner flies in, then pops up past its new size and settles */
  else { const s2 = lerp(cur, sc, Math.min(1, dt * 4)); mm.userData.fsc = Math.abs(s2 - sc) < 0.005 ? sc : s2; }
  const mods = mm.userData.fmods || (mm.userData.fmods = {});
  for (const k in mods) { const v = (on && +k === F.kp) || (!!U && +k === U.kp); mods[k].visible = v; for (const o of mods[k].userData.ex) o.visible = v; }
  if (U && mods[U.kp]) { const k = U.t / FUSA.out; fuseModScale(mods[U.kp], Math.max(0.001, (1 - k * k) * (1 + 0.3 * Math.sin(k * Math.PI))), k * k * 5); } /* (round 40c) on a split the parts spin and shrink back into the chest */
  if (!on) return; const md = mods[F.kp] || (mods[F.kp] = fuseModBuild(mm, F.kp)); /* (round 40b) it attaches itself: the chest, the helmet, the feet */
  if (A) { const k = clamp((A.t - FUSA.hit) / FUSA.asm, 0, 1); fuseModScale(md, A.t < FUSA.hit ? 0.001 : Math.max(0.001, backOut(k, 2.2)), (1 - k) * (1 - k) * Math.PI * 2); } /* the parts burst out of the chest, spinning into place */
  else if (md.scale.x !== 1) fuseModScale(md, 1, 0);
  const G = W.p[F.g], gT = W.t - (RND.fgT != null ? RND.fgT : -9); md.userData.tick(F, p, dt, G ? G.aim : F.v ? F.ga : p.aim, gT); /* (round 40d) a capsule module aims where it last attacked */
}
/* ================= (round 40c) the fusion cut-in: the partner leaps up spinning and streaks into the body; a flash, a light pillar and a
   shock ring; the body pops up to its fused size while the module's parts burst out of its chest into place; the combo's name slams on screen.
   A split plays it backwards: the parts spin back into the chest and the partner is thrown out to the side. Render only (the sim fuses at once). */
const FUSA = { hit: 0.75, asm: 0.55, out: 0.3, pop: 0.4 };
function backOut(k, s) { const u = k - 1; return 1 + (s + 1) * u * u * u + s * u * u; }
function fuseModScale(g, s, ry) { g.scale.setScalar(s); g.rotation.y = ry; for (const o of g.userData.ex) o.scale.setScalar(s); }
const fusRGB = c => { const q = new THREE.Color(c); return [q.r, q.g, q.b]; };
function fuseAnimStart(e) {
  RND.fusU = null; RND.fusA = { t: 0, t0: W.t, a: e.a, b: e.b, kb: e.kb, kp: e.kp, sx: e.bx != null ? e.bx : e.x, sy: e.by != null ? e.by : e.y, sz: e.bz != null ? e.bz : e.z, hit: 0 };
  const ca = MECHS[e.kb].glow, cb = MECHS[e.kp].glow; sfx('xform', e.x, e.y); shake(e.x, e.y, 0.15);
  fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.08, s0: 3.6, s1: 0.7, life: FUSA.hit, col: '#ffd040', op: 0.85 }); /* closing in: the charge */
  fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 1.5, s0: 2.8, s1: 0.5, life: FUSA.hit, col: ca, op: 0.7 });
  if (e.v) { fuseVModel(e.kp); fxAdd({ kind: 'ball', x: RND.fusA.sx, y: RND.fusA.sy, z: RND.fusA.sz, s0: 0.3, s1: 1.8, life: 0.3, col: cb, op: 0.9 }); sfx('plane', e.x, e.y); return; } /* (round 40d) a capsule: a flash high up, then the pod comes down */
  fxAdd({ kind: 'ring', x: RND.fusA.sx, y: RND.fusA.sy, z: RND.fusA.sz + 0.08, s0: 0.6, s1: 2.6, life: 0.4, col: cb, op: 0.8 }); /* the partner's take-off */
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; addP({ x: RND.fusA.sx, y: RND.fusA.sy, z: RND.fusA.sz + 0.2, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, vz: frnd(0.5, 2), g: 4, col: cb, s: 0.08, life: 0.45 }); }
}
function fuseAnimEnd(e) {
  RND.fusA = null; RND.fusU = { t: 0, t0: W.t, a: e.a, b: e.b, kp: e.kp, x: e.x, y: e.y, z: e.z };
  const col = e.br ? '#ff5a3a' : '#ffd040'; shake(e.x, e.y, e.br ? 0.5 : 0.25);
  fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z + 1.4, s0: 0.3, s1: 1.6, life: 0.18, col: '#ffffff', op: 0.7 });
  fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.08, s0: 0.5, s1: 5, life: 0.45, col, op: 0.85 });
  if (e.b < 0 && MECHS[e.kp]) for (let k = 0; k < 36; k++) { const a = FXR() * 6.283, r = FXR() * 0.8; addP({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, z: e.z + 0.6 + FXR() * 2, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, vz: frnd(1.5, 4), g: -1, col: k % 3 ? MECHS[e.kp].glow : '#ffffff', s: 0.09, life: 0.9 }); } /* (round 40d) the capsule mech fades away in sparks */
}
// (round 40d) the capsule's mech for the cut-in: a model of that kind in a glowing pod, kept and reused
function fuseVModel(k) {
  let V = RND.fusVM; if (!V) { const g = new THREE.Group(), pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 1.6, 6, 16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })); pod.position.y = 1.55; g.add(pod); const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 6, 28), new THREE.MeshBasicMaterial({ color: '#ffd040' })); rim.rotation.x = Math.PI / 2; rim.position.y = 1.55; g.add(rim); SCN.add(g); V = RND.fusVM = { g, pod, rim, k: 0, mech: null }; }
  if (V.k !== k) { if (V.mech) V.g.remove(V.mech); V.mech = mkMech(k); V.g.add(V.mech); V.k = k; } V.pod.material.color.set(MECHS[k].glow); V.g.visible = true; return V;
}
function fusBanner(kb, kp) {
  const b = document.createElement('div'); b.className = 'fusban';
  b.innerHTML = '<span class="f1">合 体</span><span class="f2">' + (FUS_NAME[fusKey(kb, kp)] || '合体机甲') + '</span><span class="f3">' + MECHS[kb].name + ' × ' + MECHS[kp].name + '</span>';
  document.body.appendChild(b); setTimeout(() => b.remove(), 2600);
}
function fuseAnimPost(dt) { // after drawPlayers: fly the partner's model in (or out), fire the impact; also put back any model scale an animation left
  const A = RND.fusA, U = RND.fusU;
  OBJ.pl.forEach((m, i) => { if (m.g.scale.x !== 1 && !(A && A.b === i && A.t < FUSA.hit) && !(U && U.b === i && U.t < FUSA.pop)) m.g.scale.setScalar(1); });
  if (!A && RND.fusVM && RND.fusVM.g.visible) RND.fusVM.g.visible = false;
  if (A) { A.t = W.t - A.t0; /* on the game clock: a cut-in missed while drawing was off is simply over */ const ma = OBJ.pl[A.a]; let m = OBJ.pl[A.b];
    if (!ma || !W.p[A.a]) { RND.fusA = null; if (RND.fusVM) RND.fusVM.g.visible = false; return; } /* not on W.fus: a guest can get the event a moment before the snapshot */
    const tx = ma.g.position.x, ty = ma.g.position.z, tz = ma.g.position.y, ca = MECHS[A.kb].glow, cb = MECHS[A.kp].glow;
    if (A.b < 0) { const V = RND.fusVM; m = V && A.t < FUSA.hit ? V : null; if (V) { V.g.visible = A.t < FUSA.hit; V.rim.rotation.z = A.t * 9; V.pod.material.opacity = 0.25 + 0.2 * Math.sin(A.t * 30); } } /* (round 40d) the capsule pod stands in for a partner */
    if (A.t < FUSA.hit) { const u = A.t / FUSA.hit, e2 = u * u;
      if (m && m.g.visible) { const x = lerp(A.sx, tx, e2), y = lerp(A.sy, ty, e2), z = lerp(A.sz, tz + 1.1, e2) + Math.sin(u * Math.PI) * (A.b < 0 ? 0 : 2.6); /* a capsule falls straight in, speeding up */
        m.g.position.set(x, z, y); m.g.scale.setScalar(lerp(1, 0.22, e2)); m.g.rotation.set(0, e2 * Math.PI * 5, Math.sin(u * Math.PI) * 0.5); /* leaps up, spins faster and faster, shrinks into a streak */
        for (let k = 0; k < 4; k++) addP({ x: x + frnd(-0.3, 0.3), y: y + frnd(-0.3, 0.3), z: z + 0.4 + FXR() * 1.2 * (1 - e2 * 0.7), vx: 0, vy: 0, vz: frnd(-0.4, 0.4), g: 0, col: k % 2 ? cb : '#ffffff', s: 0.1, life: 0.45 });
        if (A.px != null) RND.tracers.push({ x: A.px, y: A.py, z: A.pz, x2: x, y2: y, z2: z + 0.8, t: 0, life: 0.3, w: 0.2, col: fusRGB(cb) });
        A.px = x; A.py = y; A.pz = z + 0.8; }
      for (let k = 0; k < 3; k++) { const a = FXR() * 6.283, r = 2.6 - u * 1.2; addP({ x: tx + Math.cos(a) * r, y: ty + Math.sin(a) * r, z: tz + 0.2 + FXR() * 2.6, vx: -Math.cos(a) * 3 - Math.sin(a) * 2.5, vy: -Math.sin(a) * 3 + Math.cos(a) * 2.5, vz: 0.4, g: 0, col: k ? '#ffd040' : ca, s: 0.07, life: 0.55 }); } /* sparks spiralling into the body */
    } else if (!A.hit) { A.hit = 1; const x = tx, y = ty, z = tz; if (m) m.g.scale.setScalar(1);
      fxAdd({ kind: 'ball', x, y, z: z + 1.4, s0: 0.3, s1: 2.1, life: 0.18, col: '#ffffff', op: 0.9 }); /* a short white flash, not a dome over everything */
      fxAdd({ kind: 'ball', x, y, z: z + 1.4, s0: 0.6, s1: 2.8, life: 0.3, col: '#ffd040', op: 0.25 });
      fxAdd({ kind: 'pillar', x, y, z, s0: 0.85, s1: 0.06, sy: 11, life: 0.55, col: '#ffd040', op: 0.5 });
      fxAdd({ kind: 'pillar', x, y, z, s0: 0.3, s1: 0.02, sy: 13, life: 0.45, col: '#ffffff', op: 0.75 });
      fxAdd({ kind: 'ring', x, y, z: z + 0.08, s0: 0.6, s1: 9, life: 0.7, col: '#ffd040', op: 0.9 });
      fxAdd({ kind: 'ring', x, y, z: z + 0.1, s0: 0.4, s1: 6, life: 0.5, col: cb, op: 0.85 });
      fxAdd({ kind: 'ring', x, y, z: z + 1.5, s0: 0.5, s1: 4.4, life: 0.4, col: '#ffffff', op: 0.7 });
      fxAdd({ kind: 'disc', x, y, z: z + 0.05, s0: 0.5, s1: 3.6, life: 0.5, col: '#fff0c0', op: 0.5 });
      const cols = [ca, cb, '#ffd040', '#ffffff']; for (let k = 0; k < 80; k++) { const a = FXR() * 6.283, s2 = frnd(4, 11); addP({ x, y, z: z + 0.6 + FXR() * 1.6, vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, vz: frnd(1, 6), g: 6, col: cols[k % 4], s: 0.12, life: 0.9 }); }
      shake(x, y, 0.8); sfx('boom', x, y); sfx('clank', x, y); fusBanner(A.kb, A.kp); }
    if (A.t > FUSA.hit + FUSA.asm + 0.1) RND.fusA = null; }
  if (U) { U.t = W.t - U.t0; const m = OBJ.pl[U.b];
    if (m && m.g.visible && U.t < FUSA.pop) { const k = U.t / FUSA.pop, qx = m.g.position.x, qy = m.g.position.z, qz = m.g.position.y; /* thrown out of the body to where the sim put it */
      m.g.position.set(lerp(U.x, qx, k), lerp(U.z + 1.2, qz, k) + Math.sin(k * Math.PI) * 1.3, lerp(U.y, qy, k)); m.g.scale.setScalar(lerp(0.35, 1, Math.min(1.15, backOut(k, 1.8)))); m.g.rotation.y = (1 - k) * (1 - k) * -4; }
    if (U.t > 0.6) RND.fusU = null; }
}
