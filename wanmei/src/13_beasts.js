/* ================= beasts in side view (facing right; mirrored for left) =================
   Design units: body length 200 for a unit beast; P.size scales. drawBeast(g, P, A, px). */
function beastEye(g, x, y, r, P, A, s) {
  const closed = A.blink, mood = A.mood || P.mood || 'fierce';
  if (closed) { g.strokeStyle = '#140c10'; g.lineWidth = 3.5 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + r * 0.5, x + r, y - r * 0.1); g.stroke(); return; }
  const cute = mood === 'cute';
  const sh = new Path2D(); if (cute) sh.ellipse(x, y, r * 0.85, r, 0, 0, TAU); else { sh.moveTo(x - r, y + r * 0.1); sh.quadraticCurveTo(x - r * 0.2, y - r * 0.9, x + r, y - r * 0.4); sh.quadraticCurveTo(x + r * 0.6, y + r * 0.7, x - r, y + r * 0.1); sh.closePath(); }
  g.fillStyle = cute ? '#fff' : '#fff8e0'; g.fill(sh); g.save(); g.clip(sh);
  const I = P.iris || ['#5a2a0a', '#d89a20', '#ffe070', '#3a1a08']; const gr = g.createLinearGradient(0, y - r, 0, y + r); gr.addColorStop(0, I[0]); gr.addColorStop(0.5, I[1]); gr.addColorStop(1, I[2]); g.fillStyle = gr; g.beginPath(); g.ellipse(x + r * 0.1, y, r * (cute ? 0.72 : 0.6), r * (cute ? 0.85 : 0.8), 0, 0, TAU); g.fill();
  g.fillStyle = '#08060a'; g.beginPath(); g.ellipse(x + r * 0.15, y + r * 0.05, r * (P.slit === false || cute ? 0.36 : 0.12), r * 0.6, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - r * 0.15, y - r * 0.35, r * 0.24, r * 0.18, -0.4, 0, TAU); g.fill(); if (cute) { g.beginPath(); g.arc(x + r * 0.35, y + r * 0.4, r * 0.1, 0, TAU); g.fill(); }
  g.restore(); g.strokeStyle = '#140c10'; g.lineWidth = (cute ? 2.6 : 3.2) * s; g.stroke(sh);
  if (!cute) { g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x - r * 1.1, y - r * 0.55); g.lineTo(x + r * 0.9, y - r * 0.95 + (mood === 'angry' || mood === 'fierce' ? r * 0.5 : 0)); g.stroke(); }
}
function drawQuad(g, P, A, px) {
  const S = 1, L = P.len, hgt = P.legH, R = P.bodyR, c1 = P.c1, c2 = P.c2 || c1, cb = P.belly || c2;
  LW = Math.max(1, 1.2 / px);
  const w = A.walk || 0, ph = A.ph || 0, sw = Math.sin(ph), run = clamp((A.spd || 0) / 6, 0, 1);
  const act = A.act, k = act ? act.k01 : 0, up = act ? sstep(0, 0.3, k) * (1 - sstep(0.6, 1, k)) : 0;
  let bodyTilt = Math.sin(ph * 2) * 0.03 * w, headA = Math.sin((A.t || 0) * 1.3) * 0.04, jaw = 0, lunge = 0, rear = 0, lift = Math.abs(Math.sin(ph)) * 5 * w;
  if (act) { if (act.k === 'bite') { lunge = 24 * up; jaw = 0.5 * up; headA = 0.25 * up; } else if (act.k === 'roar') { headA = -0.4 * up; jaw = 0.8 * up; } else if (act.k === 'pounce' || act.k === 'dive') { rear = -0.35 * up; lunge = 30 * up; } else if (act.k === 'rear') { rear = -0.75 * up; } else if (act.k === 'swipe') { rear = -0.2 * up; } else if (act.k === 'hit') { bodyTilt = -0.12 * up; } else if (act.k === 'charge') { headA = 0.35; } else if (act.k === 'claw' || act.k === 'peck') { lunge = 18 * up; headA = 0.2 * up; } }
  const dead = A.pose === 'dead'; if (dead) { g.save(); g.translate(0, -R * 0.6); g.rotate(-0.15); g.scale(1, 0.75); }
  const by = -hgt - R * 0.55 - lift;
  g.save(); g.translate(lunge, 0); g.translate(-L * 0.35, by); g.rotate(bodyTilt + rear); g.translate(L * 0.35, -by);
  // tail
  if (P.tailL !== 0) { const tl = (P.tailL ?? 0.8) * L, wag = Math.sin((A.t || 0) * 3 + ph) * 0.3; const tx0 = -L * 0.48, ty0 = by - R * 0.2; const tp = new Path2D(); const t1x = tx0 - tl * 0.5, t1y = ty0 - tl * (0.35 + wag * 0.3), t2x = tx0 - tl * 0.9, t2y = ty0 - tl * (P.tailUp ?? 0.55) + wag * 30; tp.moveTo(tx0, ty0 - R * 0.18); tp.quadraticCurveTo(t1x, t1y - R * 0.18, t2x, t2y); tp.quadraticCurveTo(t1x + 6, t1y + R * 0.18, tx0, ty0 + R * 0.2); tp.closePath(); cel(g, tp, P.tailC || c1, { sx: 3, sy: -4 }); if (P.tailTuft) { const tt = ellP(t2x, t2y, R * 0.28, R * 0.4, -0.6); cel(g, tt, P.tailTuft); } }
  // far legs (darker)
  const legPath = (x, a, far) => { const L1 = hgt * 0.55, L2 = hgt * 0.5, x0 = x, y0 = by + R * 0.3, kx = x0 + Math.sin(a) * L1, ky = y0 + Math.cos(a) * L1, fx = kx + Math.sin(a * 0.4) * L2, fy = Math.min(-2, ky + Math.cos(a * 0.4) * L2); const lr = R * (P.legR || 0.26);
    g.save(); if (far) g.filter = 'brightness(0.78)'; const p1 = limbP(x0, y0, kx, ky, lr * 1.4, lr * 1.0), p2 = limbP(kx, ky, fx, fy, lr, lr * 0.85); cel(g, p1, c1, { sx: -4, sy: -2 }); cel(g, p2, P.legC || c1, { sx: -4, sy: -2 });
    if (P.hoof) { const hp = new Path2D(); hp.roundRect(fx - lr * 1.0, fy - lr * 0.9, lr * 2.0, lr * 1.0, lr * 0.3); cel(g, hp, P.hoof); } else { const pp = ellP(fx + lr * 0.4, fy - lr * 0.35, lr * 1.25, lr * 0.62); cel(g, pp, P.legC || c1); if (P.claws !== false) { g.fillStyle = '#f0ead8'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(fx + lr * (1.2 + i * 0.05), fy - lr * (0.6 - i * 0.3)); g.lineTo(fx + lr * 1.9, fy - lr * (0.45 - i * 0.3)); g.lineTo(fx + lr * 1.2, fy - lr * (0.3 - i * 0.3)); g.fill(); } } }
    g.restore(); };
  const legA = (o) => Math.sin(ph + o) * (0.5 + run * 0.3) * w;
  legPath(L * 0.3, legA(PI), true); legPath(-L * 0.32, legA(0), true);
  // wings (far)
  if (P.wings) { const fl = A.fly ? Math.sin((A.t || 0) * 10) : 0; g.save(); g.translate(L * 0.1, by - R * 0.6); g.rotate(-0.4 - fl * 0.5); g.filter = 'brightness(0.8)'; const wp = smoothP(sc2([[0, 0], [-60, -70], [-150, -90], [-200, -60], [-150, -40], [-170, -10], [-110, -8], [-120, 14], [-40, 12]], L / 200)); cel(g, wp, P.wings); g.restore(); }
  // body
  const bp = smoothP([[-L * 0.5, by], [-L * 0.46, by - R * 0.75], [-L * 0.1, by - R * (P.humpY || 0.95)], [L * 0.25, by - R * (P.chestY || 1.0)], [L * 0.48, by - R * 0.55], [L * 0.46, by + R * 0.35], [L * 0.2, by + R * 0.72], [-L * 0.2, by + R * 0.62], [-L * 0.45, by + R * 0.48]]);
  cel(g, bp, c1, { sx: -8, sy: -10 });
  g.save(); g.clip(bp); g.fillStyle = cb; g.beginPath(); g.ellipse(0, by + R * 0.75, L * 0.42, R * 0.5, 0, 0, TAU); g.fill();
  if (P.stripes) { g.fillStyle = P.stripes; for (let i = 0; i < 6; i++) { const x = -L * 0.35 + i * L * 0.13; g.beginPath(); g.moveTo(x, by - R * 1.1); g.quadraticCurveTo(x + 14, by - R * 0.2, x - 4, by + R * 0.1); g.lineTo(x + 10, by - R * 0.3); g.quadraticCurveTo(x + 22, by - R * 0.9, x + 14, by - R * 1.1); g.fill(); } }
  if (P.scales) { g.strokeStyle = P.scales; g.lineWidth = 2.2; for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(-L * 0.4 + i * L * 0.1 + (j % 2) * L * 0.05, by - R * 0.8 + j * R * 0.32, R * 0.16, 0.2, PI - 0.2); g.stroke(); } }
  g.restore(); inkP(g, bp, 1);
  if (P.spines) { for (let i = 0; i < 7; i++) { const x = -L * 0.35 + i * L * 0.1, y = by - R * 0.95 - Math.sin(i / 6 * PI) * R * 0.06; const sp = new Path2D(); sp.moveTo(x - 9, y + 6); sp.lineTo(x + 2, y - R * 0.35); sp.lineTo(x + 11, y + 6); sp.closePath(); cel(g, sp, P.spines); } }
  if (P.mane) { const mp = smoothP([[L * 0.12, by - R * 1.05], [L * 0.34, by - R * 1.35], [L * 0.56, by - R * 1.0], [L * 0.6, by - R * 0.2], [L * 0.5, by + R * 0.5], [L * 0.36, by + R * 0.3], [L * 0.3, by - R * 0.5], [L * 0.16, by - R * 0.6]]); cel(g, mp, P.mane, { sx: -6, sy: -6 }); }
  // near wing
  if (P.wings) { const fl = A.fly ? Math.sin((A.t || 0) * 10) : 0; g.save(); g.translate(L * 0.05, by - R * 0.75); g.rotate(-0.25 - fl * 0.55); const wp = smoothP(sc2([[0, 0], [-60, -80], [-160, -110], [-220, -80], [-160, -50], [-185, -20], [-115, -12], [-125, 12], [-40, 14]], L / 200)); cel(g, wp, P.wings, { sx: -4, sy: -6 }); g.strokeStyle = shadeOf(P.wings); g.lineWidth = 2; for (const f of [[-60, -40], [-110, -60], [-150, -70]]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(f[0] * L / 200, f[1] * L / 200); g.stroke(); } g.restore(); }
  // near legs
  legPath(L * 0.34, legA(0), false); legPath(-L * 0.28, legA(PI), false);
  // head
  const hr = R * (P.headR || 0.66), hx = L * 0.5 + hr * 0.25, hy = by - R * (P.neckUp ?? 0.75);
  g.save(); g.translate(hx, hy); g.rotate(headA);
  if (P.ears !== false) { for (const far of [true, false]) { const ex = far ? -hr * 0.1 : -hr * 0.42, el = hr * (P.earL || 0.6); const ep = new Path2D(); ep.moveTo(ex - hr * 0.22, -hr * 0.6); ep.lineTo(ex + (P.earBack ? -hr * 0.3 : 0), -hr * 0.6 - el); ep.lineTo(ex + hr * 0.22, -hr * 0.6); ep.closePath(); g.save(); if (far) g.filter = 'brightness(0.8)'; cel(g, ep, P.earC || c1); g.restore(); } }
  if (P.horns) { const hl = hr * (P.hornL || 1.2); const hp = new Path2D(); hp.moveTo(-hr * 0.3, -hr * 0.65); hp.quadraticCurveTo(-hr * 0.4 - hl * 0.3, -hr * 0.8 - hl * 0.7, -hr * 0.4 - hl * (P.hornCurve ?? 0.6), -hr * 0.65 - hl * 0.6); hp.quadraticCurveTo(-hr * 0.1 - hl * 0.2, -hr * 0.8 - hl * 0.4, hr * 0.0, -hr * 0.65); hp.closePath(); cel(g, hp, P.horns); }
  if (P.horn1) { const hp = new Path2D(); hp.moveTo(hr * 0.05, -hr * 0.7); hp.lineTo(hr * 0.55, -hr * 1.55); hp.lineTo(hr * 0.32, -hr * 0.62); hp.closePath(); cel(g, hp, P.horn1); }
  const snout = P.snout ?? 0.8;
  const head = smoothP([[-hr * 0.85, -hr * 0.1], [-hr * 0.6, -hr * 0.75], [0, -hr * 0.92], [hr * 0.5, -hr * 0.62], [hr * (0.7 + snout * 0.5), -hr * 0.3], [hr * (0.75 + snout * 0.6), hr * 0.05], [hr * (0.6 + snout * 0.5), hr * 0.32], [hr * 0.2, hr * 0.6], [-hr * 0.5, hr * 0.62], [-hr * 0.9, hr * 0.3]]);
  cel(g, head, c1, { sx: -6, sy: -6 });
  g.save(); g.clip(head); g.fillStyle = cb; g.beginPath(); g.ellipse(hr * (0.55 + snout * 0.4), hr * 0.35, hr * (0.4 + snout * 0.3), hr * 0.32, 0, 0, TAU); g.fill(); g.restore(); inkP(g, head, 1);
  if (P.frill) for (let i = 0; i < 5; i++) { const a = -2.2 + i * 0.35; const fp = new Path2D(); fp.moveTo(-hr * 0.6, 0); fp.lineTo(Math.cos(a) * hr * 1.4, Math.sin(a) * hr * 1.4); fp.lineTo(Math.cos(a + 0.2) * hr * 0.9, Math.sin(a + 0.2) * hr * 0.9); fp.closePath(); cel(g, fp, P.frill); }
  g.fillStyle = '#1a1214'; g.beginPath(); g.ellipse(hr * (0.72 + snout * 0.6), -hr * 0.04, hr * 0.12, hr * 0.09, 0, 0, TAU); g.fill();
  // jaw
  if (jaw > 0.05 || P.fangs) { g.save(); g.translate(hr * 0.2, hr * 0.32); g.rotate(jaw); const jp = smoothP([[-hr * 0.2, -hr * 0.05], [hr * (0.45 + snout * 0.45), -hr * 0.02], [hr * (0.35 + snout * 0.4), hr * 0.22], [-hr * 0.1, hr * 0.24]]); if (jaw > 0.05) { g.fillStyle = '#7a2a30'; g.beginPath(); g.ellipse(hr * 0.3, -hr * 0.05, hr * 0.5, hr * 0.12, 0, 0, TAU); g.fill(); } cel(g, jp, cb); if (P.fangs) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(hr * (0.3 + snout * 0.35), -hr * 0.05); g.lineTo(hr * (0.34 + snout * 0.35), -hr * 0.3); g.lineTo(hr * (0.4 + snout * 0.35), -hr * 0.05); g.fill(); } g.restore(); }
  beastEye(g, hr * 0.28, -hr * 0.25, hr * (P.eyeR || 0.22), P, A, Math.max(0.6, hr / 50));
  if (P.blush) { g.fillStyle = 'rgba(255,140,160,.5)'; g.beginPath(); g.ellipse(hr * 0.2, hr * 0.1, hr * 0.2, hr * 0.1, 0, 0, TAU); g.fill(); }
  g.restore();
  g.restore();
  if (dead) g.restore();
}
/* ---------- birds (青鳞鹰 family: metal scales instead of feathers) ---------- */
function drawBird(g, P, A, px) {
  LW = Math.max(1, 1.2 / px);
  const c1 = P.c1, c2 = P.c2 || c1, cb = P.belly || c2, ch = P.chibi || 0, fly = A.fly, t = A.t || 0;
  const act = A.act, k = act ? act.k01 : 0, up = act ? sstep(0, 0.3, k) * (1 - sstep(0.6, 1, k)) : 0;
  const BL = 100 * (1 - ch * 0.3), BR = 55 * (1 + ch * 0.2), legH = fly ? 0 : 60 * (1 - ch * 0.45), w = A.walk || 0, ph = A.ph || 0;
  let lunge = 0, headA = Math.sin(t * 1.5) * 0.05, tilt = fly ? 0.12 : 0; if (act) { if (act.k === 'peck' || act.k === 'claw') { lunge = 20 * up; headA = 0.5 * up; } else if (act.k === 'dive') { tilt = 0.6 * up; lunge = 30 * up; } else if (act.k === 'cast') { headA = -0.4 * up; } else if (act.k === 'hit') { tilt = -0.3 * up; } }
  const by = -legH - BR * 0.9 - Math.abs(Math.sin(ph)) * 4 * w;
  g.save(); g.translate(lunge, by); g.rotate(tilt);
  // legs
  if (!fly) for (const far of [true, false]) { const a = Math.sin(ph + (far ? PI : 0)) * 0.5 * w, lx = far ? 6 : -6; g.save(); if (far) g.filter = 'brightness(0.78)'; const kx = lx + Math.sin(a) * legH * 0.5, ky = BR * 0.6 + Math.cos(a) * legH * 0.5, fx = kx + Math.sin(a * 0.3) * legH * 0.55, fy = -by; const p1 = limbP(lx, BR * 0.4, kx, ky, 11, 7), p2 = limbP(kx, ky, fx, fy - 6, 6, 5); cel(g, p1, c1); cel(g, p2, '#4a4030'); g.fillStyle = '#1a1a1a'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(fx, fy - 6); g.lineTo(fx + 16 + i * 4, fy - 4 + i * 4); g.lineTo(fx + 4, fy - 8); g.fill(); } g.restore(); }
  // far wing
  const flap = fly ? Math.sin(t * 9) : 0, spread = fly ? 1 : (act && act.k === 'flap' ? Math.abs(Math.sin(k * 20)) : 0);
  const wing = (far) => { g.save(); if (far) g.filter = 'brightness(0.75)'; g.translate(-BL * 0.05, -BR * 0.35); g.rotate(fly ? -0.9 * flap - (far ? 0.3 : 0) : (spread ? -1.2 * spread : 0.15)); const Wl = BL * (fly || spread ? 1.6 : 0.9) * (1 - ch * 0.35); const wp = smoothP([[0, -10], [-Wl * 0.3, -BR * 0.45], [-Wl * 0.8, -BR * 0.5], [-Wl, -BR * 0.25], [-Wl * 0.85, -BR * 0.05], [-Wl * 0.95, BR * 0.15], [-Wl * 0.6, BR * 0.12], [-Wl * 0.62, BR * 0.32], [-Wl * 0.2, BR * 0.3]]); cel(g, wp, c1, { sx: -4, sy: -5 });
    g.save(); g.clip(wp); g.strokeStyle = c2; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-Wl * (0.15 + i * 0.14), BR * 0.02, BR * 0.22, 0.3, PI - 0.3); g.stroke(); } g.restore(); g.restore(); };
  wing(true);
  // tail
  const tp = smoothP([[-BL * 0.4, -BR * 0.1], [-BL * 0.95, -BR * 0.45 + Math.sin(t * 2) * 4], [-BL * 1.0, -BR * 0.05], [-BL * 0.9, BR * 0.25], [-BL * 0.4, BR * 0.3]]); cel(g, tp, c1);
  // body
  const bp = smoothP([[-BL * 0.5, 0], [-BL * 0.3, -BR * 0.85], [BL * 0.2, -BR * 0.95], [BL * 0.5, -BR * 0.5], [BL * 0.45, BR * 0.4], [BL * 0.05, BR * 0.85], [-BL * 0.4, BR * 0.6]]); cel(g, bp, c1, { sx: -6, sy: -8 });
  g.save(); g.clip(bp); g.fillStyle = cb; g.beginPath(); g.ellipse(BL * 0.15, BR * 0.6, BL * 0.42, BR * 0.55, 0, 0, TAU); g.fill(); g.strokeStyle = rgba(c2, 0.8); g.lineWidth = 2.4; for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(-BL * 0.35 + i * BL * 0.13 + (j % 2) * 6, -BR * 0.6 + j * BR * 0.3, BR * 0.14, 0.3, PI - 0.3); g.stroke(); } g.restore(); inkP(g, bp, 1);
  wing(false);
  // head
  const hr = BR * (0.62 + ch * 0.55); g.save(); g.translate(BL * 0.45, -BR * 0.75 - ch * 10); g.rotate(headA);
  for (let i = 0; i < 4; i++) { const sp = new Path2D(); const x = -hr * 0.2 - i * hr * 0.25, y = -hr * 0.85 + i * hr * 0.12; sp.moveTo(x, y + 6); sp.lineTo(x - hr * 0.25, y - hr * 0.35 * (1 - ch * 0.4)); sp.lineTo(x + hr * 0.12, y + 4); sp.closePath(); cel(g, sp, P.spike || '#f0e8d0'); }
  const hp = ellP(0, 0, hr, hr * 0.92); cel(g, hp, c1, { sx: -5, sy: -6, hl: c2, hla: 0.35 });
  const bk = new Path2D(); const bl = hr * (0.9 - ch * 0.35); bk.moveTo(hr * 0.7, -hr * 0.3); bk.quadraticCurveTo(hr * 0.7 + bl, -hr * 0.35, hr * 0.7 + bl * 1.05, hr * 0.15); bk.quadraticCurveTo(hr * 0.7 + bl * 0.7, 0, hr * 0.7, hr * 0.2); bk.closePath(); cel(g, bk, P.beak || '#1a1a1e', { hl: '#5a5a66', hla: 0.5 });
  beastEye(g, hr * 0.25, -hr * 0.12, hr * (0.28 + ch * 0.12), P, Object.assign({}, A, { mood: ch > 0.4 ? 'cute' : (A.mood || 'fierce') }), Math.max(0.6, hr / 40));
  if (ch > 0.4) { g.fillStyle = 'rgba(255,140,160,.45)'; g.beginPath(); g.ellipse(hr * 0.2, hr * 0.4, hr * 0.2, hr * 0.1, 0, 0, TAU); g.fill(); }
  g.restore(); g.restore();
}
/* ---------- serpents ---------- */
function drawSnake(g, P, A, px) {
  LW = Math.max(1, 1.2 / px); const n = P.n || 14, r0 = P.r, t = A.t || 0, spd = clamp((A.spd || 0) / 2, 0.3, 1); const pts = [];
  for (let i = 0; i < n; i++) { const x = -i * r0 * 1.15, y = Math.sin(t * 5 - i * 0.7) * r0 * 0.8 * spd * (i > 0 ? 1 : 0.3); pts.push([x, y]); }
  const strike = A.act ? sstep(0, 0.4, A.act.k01) * (1 - sstep(0.6, 1, A.act.k01)) : 0;
  for (let i = n - 1; i >= 0; i--) { const r = r0 * (i === 0 ? 1.15 : (1 - i / n * 0.75)); const [x, y] = pts[i]; const yy = -r - (i < 3 ? (3 - i) * r0 * (0.5 + strike * 1.6) : 0); const p = ellP(x + (i === 0 ? strike * r0 * 2 : 0), yy + y * 0.3, r * 1.1, r); cel(g, p, i % 2 ? P.c1 : P.c2, { sx: -3, sy: -4 }); if (i === 0) { const ex = x + strike * r0 * 2 + r * 0.35, ey = yy - r * 0.3; g.fillStyle = hex(P.eye || 0xffd020); g.beginPath(); g.ellipse(ex, ey, r * 0.24, r * 0.2, 0, 0, TAU); g.fill(); g.fillStyle = '#100'; g.beginPath(); g.ellipse(ex + 1, ey, r * 0.07, r * 0.17, 0, 0, TAU); g.fill(); if (P.crest) { const cp = new Path2D(); cp.moveTo(x - r * 0.4, yy - r * 0.8); cp.lineTo(x - r * 0.1, yy - r * 1.8); cp.lineTo(x + r * 0.2, yy - r * 0.8); cp.closePath(); cel(g, cp, P.crest); } g.strokeStyle = '#d02020'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + r * 1.0 + strike * r0 * 2, yy + r * 0.2); g.lineTo(x + r * 1.5 + strike * r0 * 2, yy + r * 0.1 + Math.sin(t * 20) * 3); g.stroke(); } }
}
/* ---------- the training dummy ---------- */
function drawStake(g, P, A, px) { LW = Math.max(1, 1.2 / px); const hit = A.act ? Math.sin(A.act.k01 * 30) * 0.12 * (1 - A.act.k01) : 0; g.save(); g.rotate(hit); const post = new Path2D(); post.rect(-10, -230, 20, 230); cel(g, post, '#6a4a2a'); const bar = new Path2D(); bar.rect(-70, -170, 140, 16); cel(g, bar, '#c8b070'); const body = smoothP([[-34, -200], [34, -200], [38, -120], [-38, -120]]); cel(g, body, '#d8c080'); const head = ellP(0, -235, 30, 32); cel(g, head, '#e0c888'); g.strokeStyle = '#a08040'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-30, -190 + i * 18); g.lineTo(30, -186 + i * 18); g.stroke(); } g.restore(); }
function drawBeast(g, P, A, px) { if (P.rig === 'bird') return drawBird(g, P, A, px); if (P.rig === 'snake') return drawSnake(g, P, A, px); if (P.rig === 'stake') return drawStake(g, P, A, px); return drawQuad(g, P, A, px); }
