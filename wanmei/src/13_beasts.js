/* ================= beasts, hand-drawn in a Don't-Starve spirit (side view, facing right) =================
   Exaggerated silhouettes, spindly legs, toothy jaws, inky wobbly outlines and hatched shadow sides.
   Design units, ground at y = 0. P.size scales (applied by the caller). drawBeast(g, P, A, px). */
const DSINK = '#16100e'; let DSLW = 0.7;
function dsLeg(g, pts, w, col, dark) { // a jointed stick leg: ink first, colour on top
  g.lineJoin = 'round'; g.lineCap = 'round'; const draw = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); };
  g.strokeStyle = DSINK; g.lineWidth = w + LW * 2.4; draw(); g.strokeStyle = dark ? mix(col, '#000', 0.35) : col; g.lineWidth = w; draw();
  if (!dark) { g.strokeStyle = rgba(mix(col, '#fff', 0.35), 0.6); g.lineWidth = w * 0.3; g.beginPath(); g.moveTo(pts[0][0] - w * 0.2, pts[0][1]); g.lineTo(pts[1][0] - w * 0.2, pts[1][1]); g.stroke(); }
}
function dsHatch(g, p, col, sp = 7, dx = 1, dy = 1.4, x0 = -300, x1 = 300, y0 = -400, y1 = 50) { g.save(); g.clip(p); g.strokeStyle = col; g.lineWidth = LW * 0.9; g.beginPath(); for (let x = x0; x < x1; x += sp) { g.moveTo(x, y0); g.lineTo(x + (y1 - y0) * dx / dy, y1); } g.stroke(); g.restore(); }
function dsBody(g, pts, col, o = {}) { const p = smoothP(pts, true, o.t ?? 0.45); g.fillStyle = col; g.fill(p); g.save(); g.clip(p); g.fillStyle = o.shade || mix(col, '#1a1428', 0.38); g.translate(o.sx ?? 10, o.sy ?? 14); g.fill(p); g.restore(); if (o.hatch !== false) dsHatch(g, p, rgba(mix(col, '#000', 0.55), 0.35), o.hs || 9, 1, 1.3, -300, 300, -400, 40); if (o.hl) { g.save(); g.clip(p); g.fillStyle = rgba(mix(col, '#fff8d8', 0.5), 0.55); g.translate(-(o.sx ?? 10) * 0.8, -(o.sy ?? 14) * 0.8); g.globalCompositeOperation = 'source-atop'; g.restore(); } g.strokeStyle = DSINK; g.lineWidth = LW * 2.2; g.lineJoin = 'round'; g.stroke(p); return p; }
function dsSpikes(g, x0, y0, x1, y1, n, h, col, lean = -0.4) { // a jagged ridge of fur spikes along a line
  const p = new Path2D(); p.moveTo(x0, y0); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2, bx = lerp(x0, x1, tm), by = lerp(y0, y1, tm); p.lineTo(bx + h * lean, by - h * (0.7 + (i % 2) * 0.4)); p.lineTo(lerp(x0, x1, t1), lerp(y0, y1, t1)); } p.closePath(); g.fillStyle = col; g.fill(p); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.lineJoin = 'miter'; g.stroke(p);
}
function dsEye(g, x, y, r, P, A, o = {}) {
  if (A.dead || A.pose === 'dead') { g.strokeStyle = DSINK; g.lineWidth = r * 0.5; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke(); return; }
  if (A.blink || A.mood === 'closed') { g.strokeStyle = DSINK; g.lineWidth = r * 0.45; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + r * 0.6, x + r, y); g.stroke(); return; }
  const I = P.iris || ['#5a2a0a', '#d89a20', '#ffe070'], cute = o.cute ?? (P.mood === 'cute');
  if (cute) { g.fillStyle = DSINK; g.beginPath(); g.ellipse(x, y, r * 0.95, r * 1.1, 0, 0, TAU); g.fill(); g.fillStyle = I[1]; g.beginPath(); g.ellipse(x + r * 0.05, y + r * 0.2, r * 0.6, r * 0.62, 0, 0, TAU); g.fill(); g.fillStyle = '#08060a'; g.beginPath(); g.ellipse(x + r * 0.1, y + r * 0.22, r * 0.34, r * 0.4, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.38, r * 0.34, 0, TAU); g.fill(); g.beginPath(); g.arc(x + r * 0.38, y + r * 0.45, r * 0.13, 0, TAU); g.fill(); return; }
  // fierce: a glinting slit eye under a heavy brow
  g.fillStyle = I[2] || '#ffe070'; g.beginPath(); g.moveTo(x - r, y + r * 0.2); g.quadraticCurveTo(x, y - r * 0.8, x + r, y - r * 0.2); g.quadraticCurveTo(x + r * 0.2, y + r * 0.7, x - r, y + r * 0.2); g.fill(); g.fillStyle = DSINK; g.beginPath(); g.ellipse(x + r * 0.12, y + r * 0.05, r * 0.2, r * 0.48, 0, 0, TAU); g.fill();
  g.strokeStyle = DSINK; g.lineWidth = r * 0.42; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r * 1.25, y - r * 0.55); g.lineTo(x + r * 1.1, y - r * (A.mood === 'angry' ? 0.2 : 0.75)); g.stroke();
}
function dsTeeth(g, x0, y0, x1, y1, n, h, up) { g.fillStyle = '#fbf6e6'; g.strokeStyle = DSINK; g.lineWidth = LW * 1.1; for (let i = 0; i < n; i++) { const a = lerp(x0, x1, i / n), b = lerp(x0, x1, (i + 1) / n), ya = lerp(y0, y1, i / n), yb = lerp(y0, y1, (i + 1) / n); g.beginPath(); g.moveTo(a, ya); g.lineTo((a + b) / 2, (ya + yb) / 2 + (up ? -h : h)); g.lineTo(b, yb); g.closePath(); g.fill(); g.stroke(); } }
const gaitPh = (A, off) => { const w = A.walk || 0; return Math.sin((A.ph || 0) + off) * w; };
/* ---------- quadrupeds ---------- */
function drawQuad(g, P, A, px) {
  LW = Math.max(1, 1.2 / px) * PIXLW * DSLW;
  const F = P.form || 'hound';
  ({ hound: dsHound, cat: dsCat, ox: dsOx, fluff: dsFluff, ape: dsApe, dog: dsDog }[F] || dsHound)(g, P, A, px);
}
function actK(A, ks) { return A.act && ks.includes(A.act.k) ? A.act.k01 : -1; }
function dsHound(g, P, A) { // 山狼: lean hound with a spiky ridge and a jaw full of teeth
  const L = P.len || 170, H = P.legH || 72, c1 = P.c1 || '#565b6a', c2 = P.c2 || '#8a8f9e', bel = P.belly || '#b8bcc8', ridge = P.ridge || mix(c1, '#000', 0.35);
  const bite = actK(A, ['bite', 'claw', 'swipe']), pounce = actK(A, ['pounce', 'charge']), roar = actK(A, ['roar']), hit = actK(A, ['hit']);
  const bob = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 4 - Math.sin((A.t || 0) * 2.4) * 1.5;
  const tilt = pounce >= 0 ? Math.sin(pounce * PI) * -0.22 : hit >= 0 ? 0.06 : 0;
  g.save(); g.translate(0, -bob); g.rotate(tilt);
  const by = -H - 30, fx = L * 0.3, hx = -L * 0.32;
  // far legs
  const leg = (x, ph, far, front) => { const s = gaitPh(A, ph) * 16 + (pounce >= 0 ? (front ? 22 : -18) * Math.sin(pounce * PI) : 0); const top = [x, by + 14]; if (front) dsLeg(g, [top, [x + 6 + s * 0.3, -H * 0.45], [x + s, -2], [x + s + 8, 0]], 8, c1, far); else dsLeg(g, [top, [x - 16 + s * 0.2, -H * 0.55], [x - 6 + s, -H * 0.18], [x + s, -2], [x + s + 8, 0]], 9, c1, far); };
  leg(fx - 8, PI, true, true); leg(hx - 6, 0, true, false);
  // tail: a spiky brush
  const tw = Math.sin((A.t || 0) * 5) * 6 + (A.walk || 0) * 8; const tail = [[hx - 20, by - 6], [hx - 52, by - 18 + tw * 0.3], [hx - 80, by - 4 + tw], [hx - 64, by + 4 + tw * 0.6], [hx - 40, by + 8]]; dsBody(g, tail, c1, { hs: 7 });
  // body: deep chest, tucked waist
  const body = [[fx + 26, by - 18], [fx - 10, by - 32], [-L * 0.05, by - 26], [hx, by - 22], [hx - 24, by - 6], [hx - 18, by + 16], [hx + 10, by + 10], [-L * 0.02, by + 12], [fx - 4, by + 30], [fx + 30, by + 18]];
  dsBody(g, body, c1, { sx: 8, sy: 12 });
  g.save(); g.clip(smoothP(body, true, 0.45)); g.fillStyle = bel; g.beginPath(); g.ellipse(fx, by + 30, 38, 22, 0.2, 0, TAU); g.fill(); g.restore();
  dsSpikes(g, fx - 2, by - 30, hx - 6, by - 20, 7, 14, ridge, -0.5);
  // near legs
  leg(fx + 6, 0, false, true); leg(hx + 8, PI, false, false);
  // head
  const hx0 = fx + 36 + (bite >= 0 ? Math.sin(bite * PI) * 22 : 0) + (pounce >= 0 ? Math.sin(pounce * PI) * 10 : 0), hy0 = by - 26 + (roar >= 0 ? -16 : 0) + (bite >= 0 ? Math.sin(bite * PI) * 6 : 0);
  const open = bite >= 0 ? Math.sin(bite * PI) : roar >= 0 ? 0.9 : pounce >= 0 ? 0.6 : 0.18;
  g.save(); g.translate(hx0, hy0); g.rotate(roar >= 0 ? -0.35 : 0); g.scale(1.25, 1.25);
  // neck
  dsBody(g, [[-30, -10], [-6, -20], [10, 4], [-12, 22], [-40, 24]], c1, { hatch: false });
  // lower jaw
  g.save(); g.translate(8, 6); g.rotate(open * 0.5); const jaw = smoothP([[-2, -2], [48, 0], [52, 6], [40, 10], [0, 12]], true, 0.3); g.fillStyle = mix(c1, '#000', 0.15); g.fill(jaw); g.strokeStyle = DSINK; g.lineWidth = LW * 2; g.stroke(jaw); dsTeeth(g, 8, -1, 46, 0, 6, 6, true); g.restore();
  // mouth interior
  if (open > 0.25) { g.fillStyle = '#5a1820'; g.beginPath(); g.moveTo(10, 4); g.lineTo(52, 2); g.lineTo(48, 4 + open * 20); g.closePath(); g.fill(); }
  // skull + upper snout
  const skull = [[-16, -6], [0, -24], [22, -22], [56, -10], [64, -4], [58, 4], [14, 6], [-12, 10]]; dsBody(g, skull, c2, { sx: 5, sy: 8, hs: 8 });
  dsTeeth(g, 14, 5, 58, 3, 7, 6, false);
  g.fillStyle = DSINK; g.beginPath(); g.ellipse(62, -5, 5, 4, 0, 0, TAU); g.fill();
  // ears: tall and pointed, laid back
  const ear = smoothP([[-6, -18], [-18, -46], [4, -22]], true, 0.2); g.fillStyle = c1; g.fill(ear); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(ear); g.fillStyle = '#7a3a3a'; g.beginPath(); g.moveTo(-8, -20); g.lineTo(-15, -38); g.lineTo(-1, -22); g.fill();
  dsEye(g, 16, -12, 6, P, A); g.restore();
  g.restore();
}
function dsCat(g, P, A) { // 猞猁: long-legged cat with tufted ears, spots and a short tail; optional horn
  const L = P.len || 160, H = P.legH || 60, c1 = P.c1 || '#b8864e', c2 = P.c2 || '#d8b078', bel = P.belly || '#f0e0c8';
  const att = actK(A, ['bite', 'claw', 'swipe', 'pounce']), bob = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 3;
  g.save(); g.translate(0, -bob); const by = -H - 26, fx = L * 0.3, hx = -L * 0.3;
  const leg = (x, ph, far, front) => { const s = gaitPh(A, ph) * 14 + (att >= 0 && front && !far ? Math.sin(att * PI) * 20 : 0); dsLeg(g, front ? [[x, by + 10], [x + 4 + s * 0.3, -H * 0.5], [x + s, -2], [x + s + 7, 0]] : [[x, by + 10], [x - 14, -H * 0.55], [x - 4 + s, -H * 0.15], [x + s, -2], [x + s + 7, 0]], 9, c1, far); };
  const wingF = far => { if (!P.wings) return; const fl = Math.sin((A.t || 0) * (att >= 0 ? 9 : 2)) * 0.25; g.save(); g.translate(-6, by - 18); g.rotate(-0.5 - fl + (far ? -0.25 : 0)); const w = new Path2D(); w.moveTo(0, 0); w.bezierCurveTo(-20, -60, -70, -90, -110, -84); for (let i = 0; i < 4; i++) w.lineTo(-100 + i * 26, -60 + i * 16 + (i % 2) * 14); w.closePath(); const col = far ? mix(P.wings, '#000', 0.35) : P.wings; g.fillStyle = col; g.fill(w); g.strokeStyle = DSINK; g.lineWidth = LW * 2; g.stroke(w); for (let i = 0; i < 3; i++) line(g, -10, -6, -90 + i * 26, -64 + i * 16, LW * 1.2, DSINK); g.restore(); };
  wingF(true); leg(fx - 6, PI, true, true); leg(hx - 4, 0, true, false);
  const tw = Math.sin((A.t || 0) * 4) * 6; dsBody(g, [[hx - 18, by - 8], [hx - 44, by - 26 + tw], [hx - 50, by - 16 + tw], [hx - 22, by + 2]], c1, { hatch: false });
  const body = [[fx + 24, by - 14], [0, by - 24], [hx, by - 20], [hx - 22, by - 2], [hx - 10, by + 18], [fx, by + 22], [fx + 28, by + 10]]; dsBody(g, body, c1);
  g.save(); g.clip(smoothP(body, true, 0.45)); g.fillStyle = bel; g.beginPath(); g.ellipse(fx - 10, by + 22, 50, 16, 0, 0, TAU); g.fill(); if (P.stripes) { g.fillStyle = P.stripes; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(hx + 10 + i * 13, by - 10 + (i % 3) * 8, 4, 3, 0, 0, TAU); g.fill(); } } g.restore();
  leg(fx + 6, 0, false, true); leg(hx + 8, PI, false, false); wingF(false);
  const hx0 = fx + 34 + (att >= 0 ? Math.sin(att * PI) * 12 : 0), hy0 = by - 22;
  g.save(); g.translate(hx0, hy0); g.scale(1.3, 1.3);
  for (const s of [-1, 1]) { const ex = s < 0 ? -10 : 8; const ear = smoothP([[ex - 8, -16], [ex - 2 + s, -44], [ex + 8, -14]], true, 0.2); g.fillStyle = s < 0 ? mix(c1, '#000', 0.3) : c1; g.fill(ear); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(ear); line(g, ex - 2 + s, -44, ex - 2 + s, -56, LW * 2.2, DSINK); }
  const head = [[-22, 0], [-14, -22], [12, -24], [32, -10], [40, 2], [30, 14], [0, 18], [-20, 12]]; dsBody(g, head, c2, { sx: 5, sy: 7, hs: 7 });
  g.fillStyle = bel; g.beginPath(); g.ellipse(26, 8, 14, 9, 0, 0, TAU); g.fill(); g.fillStyle = DSINK; g.beginPath(); g.moveTo(38, 0); g.lineTo(42, 2); g.lineTo(38, 5); g.fill();
  if (P.horns) { const hl = (P.hornL || 0.9) * 30; const hp = smoothP([[-2, -20], [8, -22], [0 - hl * 0.3, -22 - hl], [-8, -24]], true, 0.2); g.fillStyle = P.horns; g.fill(hp); g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.stroke(hp); }
  for (let i = 0; i < 3; i++) line(g, 30, 8 + i * 3, 48, 4 + i * 5, LW * 0.9, DSINK);
  dsEye(g, 12, -6, 6.5, P, A); g.restore(); g.restore();
}
function dsOx(g, P, A) { // 莽牛: a hulking shaggy beast, stumpy legs, a tiny face and huge horns
  const L = P.len || 230, H = P.legH || 70, c1 = P.c1 || '#2c3c34', c2 = P.c2 || '#3e5244', fur = mix(c1, '#000', 0.25);
  const charge = actK(A, ['charge', 'pounce', 'bite']), bob = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 4 - Math.sin((A.t || 0) * 1.8) * 2;
  g.save(); g.translate(0, -bob); const by = -H * 0.42 - 62, fx = L * 0.3, hx = -L * 0.3;
  const leg = (x, ph, far) => { const s = gaitPh(A, ph) * 10; const col = far ? mix(c2, '#000', 0.35) : mix(c2, c1, 0.4); const lp = smoothP([[x - 14, by + 20], [x + 14, by + 20], [x + 11 + s, -8], [x - 11 + s, -8]], true, 0.15); g.fillStyle = col; g.fill(lp); g.strokeStyle = DSINK; g.lineWidth = LW * 2; g.stroke(lp); g.fillStyle = P.hoof || '#1a1a1a'; g.beginPath(); g.ellipse(x + s, -5, 14, 6, 0, 0, TAU); g.fill(); g.stroke(); };
  leg(fx - 18, PI, true); leg(hx - 12, 0, true);
  leg(fx + 6, 0, false); leg(hx + 12, PI, false);
  // shaggy body: lumpy outline, high hump over the shoulders
  const n = 26, body = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, r = (i % 2 ? 1 : 0.88); const top = Math.sin(a) < 0; body.push([Math.cos(a) * L * 0.52 * r, by - 10 + Math.sin(a) * 58 * r * (top ? (Math.cos(a) > 0.1 ? 1.35 : 1.05) : 0.85)]); }
  dsBody(g, body, c1, { t: 0.3, hs: 10 });
  g.strokeStyle = rgba(mix(c1, '#fff', 0.3), 0.75); g.lineWidth = LW * 1.6; for (let i = 0; i < 18; i++) { const x = -L * 0.42 + i * L * 0.048, y = by - 40 + (i % 3) * 20 - (x > 0 ? 12 : 0); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y + 10, x - 2, y + 18); g.stroke(); }
  // tail tuft
  dsLeg(g, [[-L * 0.5, by - 14], [-L * 0.58, by + 10]], 5, c1); g.fillStyle = P.tailTuft || fur; g.beginPath(); g.ellipse(-L * 0.59, by + 16, 8, 11, 0, 0, TAU); g.fill(); g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.stroke();
  // head peeking out under the hump
  const hx0 = fx + 46 + (charge >= 0 ? Math.sin(charge * PI) * 18 : 0), hy0 = by + 8 + (charge >= 0 ? 10 : 0);
  g.save(); g.translate(hx0, hy0); g.rotate(charge >= 0 ? 0.25 : 0); g.scale(1.3, 1.3);
  const head = [[-26, -14], [8, -26], [34, -12], [44, 10], [34, 26], [6, 28], [-22, 16]]; dsBody(g, head, c2, { sx: 5, sy: 7 });
  g.fillStyle = mix(c2, '#c8a090', 0.35); g.beginPath(); g.ellipse(32, 14, 14, 11, 0, 0, TAU); g.fill(); g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.stroke(); g.fillStyle = DSINK; g.beginPath(); g.arc(36, 12, 2.5, 0, TAU); g.arc(36, 19, 2.5, 0, TAU); g.fill();
  // horns
  const hc = P.horns || '#e0d4b0', hl = (P.hornL || 1.5) * 26; for (const s of [-1, 1]) { const hp = new Path2D(); const bx = s < 0 ? -10 : 6; hp.moveTo(bx - 6, -20); hp.bezierCurveTo(bx - 30 - hl * 0.3, -30, bx - 34 - hl * 0.2, -60 - hl * 0.3, bx - 6 + s * 4, -56 - hl * 0.4); hp.bezierCurveTo(bx - 20, -50, bx - 18, -34, bx + 6, -20); hp.closePath(); g.fillStyle = s < 0 ? mix(hc, '#000', 0.3) : hc; g.fill(hp); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(hp); }
  // fringe over the eyes
  dsSpikes(g, -26, -8, 22, -18, 6, 10, fur, 0.5); dsEye(g, 14, -4, 5, P, A);
  g.restore(); g.restore();
}
function dsFluff(g, P, A) { // 绒灵: a round ball of glowing fluff with tiny legs, long ears and enormous eyes
  const R = P.bodyR || 52, c1 = P.c1 || '#f4f6ff', c2 = P.c2 || '#dfeaff', hop = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 10 + Math.sin((A.t || 0) * 2.6) * 2;
  const att = actK(A, ['bite', 'pounce', 'peck', 'charge']), sq = att >= 0 ? 1 + Math.sin(att * PI) * 0.18 : 1 + Math.sin((A.t || 0) * 2.6) * 0.03;
  g.save(); g.translate(0, -hop);
  for (const [x, far] of [[-R * 0.4, true], [R * 0.35, true], [-R * 0.25, false], [R * 0.5, false]]) { const s = gaitPh(A, far ? PI : 0) * 6; g.fillStyle = far ? c2 : c1; g.beginPath(); g.ellipse(x + s, -8, 11, 9, 0, 0, TAU); g.fill(); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(); }
  // tail
  const tw = Math.sin((A.t || 0) * 4) * 0.3; g.save(); g.translate(-R * 0.9, -R * 1.1); g.rotate(-0.6 + tw); const tl = smoothP([[0, 0], [-30, -30], [-14, -50], [6, -36], [10, -8]], true, 0.5); g.fillStyle = P.tailTuft || '#bfe8ff'; g.fill(tl); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(tl); g.restore();
  // ball body with a fluffy edge
  const n = 26, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, r = R * (i % 2 ? 1.05 : 0.95); pts.push([Math.cos(a) * r * (2 - sq) * 1.05, -R - 6 + Math.sin(a) * r * sq]); } const body = dsBody(g, pts, c1, { t: 0.35, shade: '#cfd8f0', sx: 8, sy: 12, hatch: false });
  g.save(); g.clip(body); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(-R * 0.3, -R * 1.45, R * 0.35, R * 0.22, -0.3, 0, TAU); g.fill(); g.restore();
  // ears
  for (const [s, far] of [[-1, true], [1, false]]) { g.save(); g.translate(R * 0.15 + s * 14, -R * 1.85); g.rotate(-0.5 + s * 0.25 + Math.sin((A.t || 0) * 3 + s) * 0.08); const ear = smoothP([[-8, 4], [-14, -40], [0, -54], [10, -36], [8, 4]], true, 0.5); g.fillStyle = far ? c2 : (P.earC || c1); g.fill(ear); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(ear); g.fillStyle = 'rgba(255,170,200,0.55)'; g.beginPath(); g.ellipse(0, -20, 4, 14, 0, 0, TAU); g.fill(); g.restore(); }
  if (P.horn1) { const hp = smoothP([[R * 0.45 - 5, -R * 1.9], [R * 0.45, -R * 2.25], [R * 0.45 + 5, -R * 1.88]], true, 0.2); g.fillStyle = P.horn1; g.fill(hp); g.strokeStyle = DSINK; g.lineWidth = LW * 1.5; g.stroke(hp); }
  dsEye(g, R * 0.42, -R * 1.18, R * 0.3, P, A, { cute: true }); dsEye(g, R * 0.9, -R * 1.16, R * 0.22, P, A, { cute: true });
  if (P.blush) { g.fillStyle = 'rgba(255,150,180,0.6)'; g.beginPath(); g.ellipse(R * 0.6, -R * 0.82, R * 0.16, R * 0.08, 0, 0, TAU); g.fill(); }
  g.fillStyle = DSINK; g.beginPath(); g.arc(R * 0.86, -R * 0.86, 2.6, 0, TAU); g.fill();
  g.restore();
}
function dsApe(g, P, A) { // 朱厌: a golden ape sitting up, red limbs, a long curling tail and a big round face
  const c1 = P.c1 || '#e8b020', c2 = P.c2 || '#ffd860', red = P.legC || '#d83020', hop = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 8 + Math.sin((A.t || 0) * 2.4) * 1.5;
  const att = actK(A, ['bite', 'claw', 'swipe', 'pounce', 'charge']);
  g.save(); g.translate(0, -hop);
  const tw = Math.sin((A.t || 0) * 2.5) * 8; g.strokeStyle = DSINK; g.lineCap = 'round'; g.lineWidth = 9 + LW * 2.4; const tp = () => { g.beginPath(); g.moveTo(-24, -34); g.bezierCurveTo(-70, -30, -76, -96 + tw, -48, -104 + tw); g.bezierCurveTo(-30, -110 + tw, -30, -86, -44, -86); g.stroke(); }; tp(); g.strokeStyle = c1; g.lineWidth = 9; tp();
  dsLeg(g, [[-14, -40], [-30 + gaitPh(A, PI) * 8, -24], [-20 + gaitPh(A, PI) * 10, -2]], 11, red, true);
  dsLeg(g, [[-2, -88], [-22, -58], [-14, -28]], 8, c1, true);
  dsBody(g, [[-30, -30], [-28, -76], [-4, -96], [22, -80], [22, -36], [0, -22]], c1, { hs: 8 });
  g.save(); g.clip(smoothP([[-30, -30], [-28, -76], [-4, -96], [22, -80], [22, -36], [0, -22]], true, 0.45)); g.fillStyle = c2; g.beginPath(); g.ellipse(10, -54, 14, 26, 0, 0, TAU); g.fill(); g.restore();
  dsLeg(g, [[0, -36], [-12 + gaitPh(A, 0) * 8, -20], [2 + gaitPh(A, 0) * 10, -2]], 12, red);
  const ar = att >= 0 ? Math.sin(att * PI) : 0; dsLeg(g, [[8, -82], [26 + ar * 20, -60 - ar * 20], [30 + ar * 30, -30 - ar * 30]], 9, c1); g.fillStyle = red; g.beginPath(); g.arc(30 + ar * 30, -28 - ar * 30, 6, 0, TAU); g.fill(); g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.stroke();
  g.save(); g.translate(8, -118);
  for (const s of [-1, 1]) { g.fillStyle = s < 0 ? mix(c1, '#000', 0.25) : c1; g.beginPath(); g.ellipse(s * 26 - 2, -2, 9, 11, 0, 0, TAU); g.fill(); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(); }
  dsBody(g, [[-28, 4], [-26, -22], [0, -34], [26, -22], [30, 6], [16, 26], [-14, 26]], c1, { sx: 4, sy: 6, hs: 7 });
  dsSpikes(g, -16, -28, 18, -28, 4, 9, c2, 0.1);
  const face = smoothP([[-14, -10], [4, -18], [24, -8], [26, 12], [6, 22], [-12, 14]], true, 0.5); g.fillStyle = '#f8d8b0'; g.fill(face); g.strokeStyle = DSINK; g.lineWidth = LW * 1.4; g.stroke(face);
  dsEye(g, 2, -4, 6, P, A, { cute: true }); dsEye(g, 18, -4, 5, P, A, { cute: true });
  g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.beginPath(); if (att >= 0) { g.ellipse(12, 12, 5, 4, 0, 0, TAU); } else { g.moveTo(6, 12); g.quadraticCurveTo(12, 16, 18, 11); } g.stroke(); g.fillStyle = 'rgba(255,120,120,0.55)'; g.beginPath(); g.ellipse(-6, 6, 4, 2.5, 0, 0, TAU); g.ellipse(24, 6, 3, 2.5, 0, 0, TAU); g.fill();
  g.restore(); g.restore();
}
function dsDog(g, P, A) { // village dog: round and floppy
  const H = P.legH || 50, c1 = P.c1 || '#d8a040', c2 = P.c2 || '#e8c070', bob = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 4;
  g.save(); g.translate(0, -bob); const by = -H - 24;
  for (const [x, ph, far] of [[30, PI, true], [-30, 0, true]]) dsLeg(g, [[x, by + 10], [x + gaitPh(A, ph) * 10, -2]], 9, c1, far);
  const tw = Math.sin((A.t || 0) * 9) * 0.5; g.save(); g.translate(-46, by - 6); g.rotate(-1 + tw); dsBody(g, [[0, 0], [-8, -22], [0, -32], [6, -18], [6, 0]], c1, { hatch: false }); g.restore();
  dsBody(g, [[44, by - 12], [0, by - 22], [-46, by - 14], [-50, by + 10], [0, by + 20], [44, by + 14]], c1, { hs: 8 });
  for (const [x, ph] of [[34, 0], [-26, PI]]) dsLeg(g, [[x, by + 10], [x + gaitPh(A, ph) * 10, -2]], 9, c1);
  g.save(); g.translate(56, by - 18); dsBody(g, [[-20, 6], [-12, -20], [14, -20], [30, -4], [26, 14], [0, 20]], c2, { sx: 4, sy: 6 }); dsBody(g, [[-14, -14], [-24, 4], [-18, 22], [-8, 8]], mix(c1, '#000', 0.2), { hatch: false }); g.fillStyle = DSINK; g.beginPath(); g.arc(30, -2, 4, 0, TAU); g.fill(); dsEye(g, 10, -6, 5, P, A, { cute: true }); g.restore();
  g.restore();
}
/* ---------- birds ---------- */
function drawBird(g, P, A, px) {
  LW = Math.max(1, 1.2 / px) * PIXLW * DSLW;
  const ch = P.chibi || 0; if (ch > 0.45) return dsChick(g, P, A);
  const c1 = P.c1 || '#1e6a64', c2 = P.c2 || '#5ac0b0', bel = P.belly || '#9ad8c8', beak = P.beak || '#1a1a1a', spike = P.spike || '#e8e0c8';
  const peck = actK(A, ['peck', 'bite', 'claw']), dive = actK(A, ['dive', 'pounce', 'charge']), hit = actK(A, ['hit']);
  const scales = (p, col) => { g.save(); g.clip(p); g.strokeStyle = rgba(mix(col, '#fff', 0.45), 0.75); g.lineWidth = LW * 1.1; for (let y = -260; y < 40; y += 11) for (let x = -200; x < 200; x += 14) { const ox = (Math.floor(y / 11) % 2) * 7; g.beginPath(); g.arc(x + ox, y, 7, 0.15 * PI, 0.85 * PI); g.stroke(); } g.restore(); };
  if (A.fly) { // ----- in flight, seen from above: wings spread across the screen, flapping foreshortens them -----
    const glide = dive >= 0, f = (A.t || 0) * 4 * PI, fl = glide ? 0 : Math.sin(f), soar = A.soar ? 0.15 : 1;
    const ang = fl * 0.85 * soar, span = 200 * (glide ? 0.55 : 0.62 + 0.38 * Math.cos(ang)), lift = (glide ? 10 : Math.sin(ang) * 70), sweep = glide ? 50 : 0;
    g.save(); g.translate(0, -130);
    const wing = d => { // d = -1 far wing (up the screen), +1 near wing
      const P2 = ([x, v]) => [x * 1.3 - sweep * v, d * v * span - lift * v];
      const pts = [[34, 0], [32, 0.5], [20, 0.86], [8, 1], [1, 0.92], [-5, 1.0], [-12, 0.9], [-18, 0.96], [-26, 0.84], [-34, 0.6], [-40, 0.28], [-30, 0]].map(P2);
      const col = d < 0 ? mix(c1, '#fff', 0.06) : c1, p = smoothP(pts, true, 0.12);
      g.fillStyle = col; g.fill(p); scales(p, col);
      const cov = smoothP([[34, 0], [32, 0.5], [20, 0.86], [10, 0.78], [16, 0.42], [18, 0]].map(P2), true, 0.2); g.fillStyle = c2; g.fill(cov); scales(cov, c2);
      g.save(); g.clip(p); g.fillStyle = rgba('#000', 0.18); const sh = smoothP([[-34, 0.6], [-40, 0.28], [-30, 0], [-14, 0], [-20, 0.5]].map(P2), true, 0.3); g.fill(sh); g.restore();
      g.strokeStyle = DSINK; g.lineWidth = LW * 2.2; g.lineJoin = 'round'; g.stroke(p);
      for (let i = 0; i < 5; i++) { const x = -26 + i * 8; const [x0, y0] = P2([x + 4, 0.5]), [x1, y1] = P2([x, 0.9 + (i % 2) * 0.06]); line(g, x0, y0, x1, y1, LW * 1.1, rgba(DSINK, 0.7)); }
    };
    wing(-1);
    // fan tail
    const tail = smoothP([[-50, -12], [-118, -34], [-128, 0], [-118, 34], [-50, 12]], true, 0.35); g.fillStyle = c1; g.fill(tail); scales(tail, c1); g.strokeStyle = DSINK; g.lineWidth = LW * 2; g.stroke(tail); for (const y of [-20, 0, 20]) line(g, -58, y * 0.3, -120, y, LW * 1.1, DSINK);
    const body = smoothP([[70, -6], [40, -24], [-20, -22], [-62, -10], [-62, 10], [-20, 22], [40, 24], [70, 6]], true, 0.4); g.fillStyle = c1; g.fill(body); scales(body, c1); g.save(); g.clip(body); g.fillStyle = rgba(bel, 0.6); g.fillRect(-70, 8, 150, 30); g.restore(); g.strokeStyle = DSINK; g.lineWidth = LW * 2.2; g.stroke(body);
    for (let i = 0; i < 5; i++) { const sp = smoothP([[30 - i * 16, -6], [10 - i * 16, (i % 2 ? -26 : 24) * 0.3], [26 - i * 16, 6]], true, 0.2); g.fillStyle = spike; g.fill(sp); g.strokeStyle = DSINK; g.lineWidth = LW * 1.2; g.stroke(sp); }
    if (glide) { dsLeg(g, [[10, 18], [40, 40], [60, 40]], 7, P.legC || '#c8a040'); for (let i = 0; i < 3; i++) line(g, 60, 40, 72, 34 + i * 6, LW * 2, DSINK); }
    wing(1);
    g.save(); g.translate(78, -4); g.scale(0.8, 0.8); birdHead(g, P, A, c1, c2, beak, spike, peck >= 0 ? Math.sin(peck * PI) : glide ? 0.8 : 0.1, 1); g.restore();
    g.restore(); return;
  }
  // ----- perched / walking: upright like a raptor -----
  const bob = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 5 + Math.sin((A.t || 0) * 2) * 1.5;
  g.save(); g.translate(0, -bob);
  const lg = (x, ph, far) => { const s = gaitPh(A, ph) * 10; dsLeg(g, [[x, -70], [x - 6 + s * 0.3, -36], [x + s, -6]], 10, P.legC || '#c8a040', far); for (let i = 0; i < 3; i++) line(g, x + s, -6, x + s + 10 - i * 8, 0, LW * 2.2, DSINK); };
  lg(-6, PI, true);
  const tail = smoothP([[-40, -70], [-92, -32], [-86, -18], [-34, -50]], true, 0.3); g.fillStyle = c1; g.fill(tail); g.strokeStyle = DSINK; g.lineWidth = LW * 2; g.stroke(tail);
  g.save(); g.rotate(hit >= 0 ? -0.1 : peck >= 0 ? Math.sin(peck * PI) * 0.35 : 0);
  const body = dsBody(g, [[30, -150], [-10, -156], [-46, -110], [-44, -62], [-10, -48], [30, -70], [44, -112]], c1, { hatch: false }); scales(body, c1);
  g.save(); g.clip(body); g.fillStyle = bel; g.beginPath(); g.ellipse(26, -96, 22, 46, 0, 0, TAU); g.fill(); scales(body, bel); g.restore(); g.strokeStyle = DSINK; g.lineWidth = LW * 2.2; g.stroke(body);
  // folded wing
  const wg = smoothP([[24, -140], [-24, -146], [-70, -84], [-56, -60], [-18, -80], [20, -108]], true, 0.35); g.fillStyle = c2; g.fill(wg); scales(wg, c2); g.save(); g.clip(wg); g.fillStyle = rgba('#000', 0.18); g.translate(6, 10); g.fill(wg); g.restore(); g.strokeStyle = DSINK; g.lineWidth = LW * 2.2; g.stroke(wg); for (let i = 0; i < 4; i++) line(g, -30 + i * 6, -84 + i * 4, -64 + i * 4, -64 + i * 2, LW * 1.4, DSINK);
  g.save(); g.translate(26, -152); birdHead(g, P, A, c1, c2, beak, spike, peck >= 0 ? Math.sin(peck * PI) : 0.1, 1); g.restore();
  g.restore();
  lg(10, 0, false);
  g.restore();
}
function birdHead(g, P, A, c1, c2, beak, spike, open, k) {
  // bony crest spikes
  for (let i = 0; i < 4; i++) { const sp = smoothP([[-26 + i * 8, -18 + i * 2], [-40 + i * 6, -44 + i * 6], [-18 + i * 8, -22 + i * 2]], true, 0.2); g.fillStyle = spike; g.fill(sp); g.strokeStyle = DSINK; g.lineWidth = LW * 1.5; g.stroke(sp); }
  const head = dsBody(g, [[-26, 6], [-24, -18], [0, -28], [24, -20], [34, -4], [26, 12], [0, 18]], c1, { sx: 4, sy: 6, hatch: false });
  // hooked beak, upper and lower
  g.save(); g.translate(26, -4); g.save(); g.rotate(open * 0.45); const lb = smoothP([[0, 4], [28, 4], [24, 12], [0, 12]], true, 0.3); g.fillStyle = mix(beak, '#555', 0.3); g.fill(lb); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(lb); g.restore();
  const ub = new Path2D(); ub.moveTo(-4, -12); ub.bezierCurveTo(20, -18, 44, -10, 44, 10); ub.bezierCurveTo(40, 4, 34, 2, 28, 6); ub.lineTo(0, 6); ub.closePath(); g.fillStyle = beak; g.fill(ub); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(ub); g.fillStyle = rgba('#fff', 0.35); g.beginPath(); g.ellipse(14, -8, 8, 2.5, 0, 0, TAU); g.fill(); g.restore();
  dsEye(g, 10, -8, 7, P, A, { cute: false });
}
function dsChick(g, P, A) { // fledgling: a round bundle with stubby wings and big eyes
  const c1 = P.c1 || '#2a7a6a', c2 = P.c2 || '#7ad8c0', bel = P.belly || '#c8f0e0', R = 46, hop = (A.walk || 0) * Math.abs(Math.sin(A.ph || 0)) * 8 + (A.fly ? 40 : 0);
  const flap = A.fly ? Math.sin((A.t || 0) * 16) : Math.sin((A.t || 0) * 3) * 0.15; const peck = actK(A, ['peck', 'bite', 'claw']);
  g.save(); g.translate(0, -hop);
  if (!A.fly) for (const [x, far] of [[-10, true], [10, false]]) { dsLeg(g, [[x, -14], [x + gaitPh(A, far ? PI : 0) * 6, -2]], 5, '#e8b040', far); line(g, x - 4, -1, x + 8, -1, LW * 2, DSINK); }
  g.save(); g.translate(-R * 0.75, -R * 1.2); g.rotate(-0.5 - flap * 0.6); const wf = smoothP([[0, 0], [-30, -10], [-26, 14], [-4, 12]], true, 0.4); g.fillStyle = mix(c1, '#000', 0.3); g.fill(wf); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(wf); g.restore();
  const n = 20, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, r = R * (i % 2 ? 1.04 : 0.96); pts.push([Math.cos(a) * r, -R - 10 + Math.sin(a) * r]); } const body = dsBody(g, pts, c1, { t: 0.4, hatch: false, sx: 7, sy: 10 });
  g.save(); g.clip(body); g.fillStyle = bel; g.beginPath(); g.ellipse(R * 0.25, -R * 0.55, R * 0.6, R * 0.45, 0, 0, TAU); g.fill(); g.restore(); g.strokeStyle = DSINK; g.lineWidth = LW * 2; g.stroke(body);
  if (P.spike) for (let i = 0; i < 3; i++) { const sp = smoothP([[-10 + i * 12, -R * 1.95], [-16 + i * 12, -R * 2.4], [-4 + i * 12, -R * 1.95]], true, 0.2); g.fillStyle = P.spike; g.fill(sp); g.strokeStyle = DSINK; g.lineWidth = LW * 1.4; g.stroke(sp); } else { const tuft = smoothP([[0, -R * 1.95], [-6, -R * 2.35], [8, -R * 2.0], [14, -R * 2.3], [12, -R * 1.92]], true, 0.3); g.fillStyle = c2; g.fill(tuft); g.strokeStyle = DSINK; g.lineWidth = LW * 1.4; g.stroke(tuft); }
  g.save(); g.translate(R * 0.88, -R * 1.05 + (peck >= 0 ? Math.sin(peck * PI) * 10 : 0)); const bk = smoothP([[-4, -8], [18, 0], [-4, 8]], true, 0.2); g.fillStyle = P.beak || '#f0b030'; g.fill(bk); g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.stroke(bk); g.restore();
  dsEye(g, R * 0.4, -R * 1.3, R * 0.26, P, A, { cute: true });
  g.save(); g.translate(R * 0.1, -R * 1.0); g.rotate(0.3 + flap * 0.7); const wn = smoothP([[0, 0], [-34, 4], [-28, 26], [-4, 16]], true, 0.4); g.fillStyle = c2; g.fill(wn); g.strokeStyle = DSINK; g.lineWidth = LW * 1.8; g.stroke(wn); g.restore();
  g.restore();
}
/* ---------- snakes ---------- */
function drawSnake(g, P, A, px) {
  LW = Math.max(1, 1.2 / px) * PIXLW * DSLW;
  const n = P.n || 16, r = P.r || 15, c1 = P.c1 || '#3a5a2a', c2 = P.c2 || '#8aa04a', strike = actK(A, ['bite', 'pounce', 'charge']), t = A.t || 0, mv = (A.walk || 0) * 1.5 + 0.4;
  const pts = []; for (let i = 0; i < n; i++) { const u = i / (n - 1), x = 40 - i * r * 1.15, y = -r - Math.sin(t * 4 * mv - i * 0.7) * r * 0.5 * (0.2 + u); pts.push([x, y]); }
  const rise = strike >= 0 ? Math.sin(strike * PI) : 0.3; pts[0] = [pts[0][0] + rise * 30, -r - 40 * rise - 22]; pts[1] = [pts[1][0] + rise * 14, -r - 26 * rise - 12]; pts[2] = [pts[2][0], -r - 10 * rise - 4];
  g.lineCap = 'round'; g.lineJoin = 'round';
  const stroke = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[n - 1][0], pts[n - 1][1]); for (let i = n - 2; i >= 0; i--) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); };
  stroke(r * 2 + LW * 4, DSINK); stroke(r * 2, c1); g.setLineDash([r * 0.8, r * 1.2]); stroke(r * 1.3, c2); g.setLineDash([]); stroke(r * 0.5, rgba(mix(c1, '#fff', 0.35), 0.5));
  const [hx, hy] = pts[0]; g.save(); g.translate(hx, hy); g.rotate(-0.2 - rise * 0.3);
  if (P.crest) { const cr = smoothP([[-14, -10], [-30, -40], [-4, -18], [0, -36], [8, -14]], true, 0.3); g.fillStyle = P.crest; g.fill(cr); g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.stroke(cr); }
  const head = dsBody(g, [[-14, -12], [10, -16], [30, -8], [34, 4], [20, 12], [-10, 12]], c1, { hatch: false, sx: 3, sy: 5 });
  if (strike >= 0 || Math.floor(t * 3) % 4 === 0) { g.strokeStyle = '#d02040'; g.lineWidth = LW * 1.6; g.beginPath(); g.moveTo(34, 2); g.lineTo(46, 2); g.lineTo(52, -2); g.moveTo(46, 2); g.lineTo(52, 6); g.stroke(); }
  if (strike >= 0) dsTeeth(g, 14, 10, 30, 8, 2, 7, false);
  const ec = typeof P.eye === 'number' ? hex(P.eye) : (P.eye || '#ffd020'); dsEye(g, 12, -5, 5, Object.assign({}, P, { iris: ['#000', ec, ec] }), A);
  g.restore();
}
function drawStake(g, P, A, px) { LW = Math.max(1, 1.2 / px) * PIXLW * DSLW; const hit = A.act ? Math.sin(A.act.k01 * 30) * 0.12 * (1 - A.act.k01) : 0; g.save(); g.rotate(hit); const post = smoothP([[-16, 0], [-14, -190], [-6, -206], [10, -204], [16, -186], [16, 0]], true, 0.2); dsBody(g, [[-16, 0], [-14, -190], [-6, -206], [10, -204], [16, -186], [16, 0]], '#8a6a44', { hs: 8 }); for (const y of [-150, -80]) { g.fillStyle = '#c8b080'; g.fillRect(-20, y, 40, 14); g.strokeStyle = DSINK; g.lineWidth = LW * 1.6; g.strokeRect(-20, y, 40, 14); } g.restore(); }
function drawBeast(g, P, A, px) { if (P.rig === 'bird') return drawBird(g, P, A, px); if (P.rig === 'snake') return drawSnake(g, P, A, px); if (P.rig === 'stake') return drawStake(g, P, A, px); return drawQuad(g, P, A, px); }
