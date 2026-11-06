/* ================= anime chibi humanoids: one parametric rig, three views ('front','back','side'=facing right) =================
   Design units: head radius 100 (×build.head). Origin at the feet, y down. drawChibi(g, P, A, px) where px = on-screen px per unit. */
const BUILD = {
  kid: { head: 1.0, torso: 108, waist: 54, shoulder: 60, hip: 50, arm: 118, armR: 16, leg: 150, legR: 20, neck: 10, belly: 1.05 },
  child: { head: 0.9, torso: 140, waist: 58, shoulder: 70, hip: 56, arm: 148, armR: 17, leg: 185, legR: 21, neck: 14, belly: 1.0 },
  teen: { head: 0.82, torso: 190, waist: 56, shoulder: 82, hip: 58, arm: 200, armR: 17, leg: 255, legR: 21, neck: 22, belly: 0.9 },
  man: { head: 0.8, torso: 215, waist: 74, shoulder: 104, hip: 70, arm: 220, armR: 23, leg: 255, legR: 27, neck: 24, belly: 1.0 },
  brute: { head: 0.78, torso: 245, waist: 94, shoulder: 136, hip: 84, arm: 245, armR: 32, leg: 260, legR: 35, neck: 28, belly: 1.1 },
  woman: { head: 0.8, torso: 195, waist: 56, shoulder: 82, hip: 72, arm: 200, armR: 17, leg: 255, legR: 21, neck: 24, belly: 0.9 },
  old: { head: 0.82, torso: 200, waist: 68, shoulder: 90, hip: 66, arm: 205, armR: 19, leg: 220, legR: 22, neck: 18, belly: 1.0 },
};
function chibiHeight(P) { const B = BUILD[P.build || 'kid']; return B.leg + B.torso + B.neck + 92 * B.head + 150 * B.head; }
/* ---------- eyes / mouth ---------- */
function eyeFront(g, cx, cy, s, ew, eh, F, mode, inn, det) {
  if (mode === 'closed' || mode === 'happy') { g.lineWidth = 5.5 * s; g.strokeStyle = '#1a1420'; g.lineCap = 'round'; g.beginPath(); if (mode === 'happy') { g.moveTo(cx + inn * ew, cy + 6 * s); g.quadraticCurveTo(cx, cy - eh * 0.6, cx - inn * ew, cy + 6 * s); } else { g.moveTo(cx + inn * ew * 0.95, cy + 2 * s); g.quadraticCurveTo(cx, cy + eh * 0.32, cx - inn * ew * 1.05, cy - 2 * s); } g.stroke(); return; }
  const sq = mode === 'angry' ? 0.72 : mode === 'surprise' ? 1.12 : mode === 'sad' ? 0.9 : 1, h = eh * sq;
  const shape = new Path2D(); shape.moveTo(cx + inn * ew * 0.98, cy + h * 0.05); shape.bezierCurveTo(cx + inn * ew * 0.85, cy - h * 0.72, cx - inn * ew * 0.55, cy - h * 0.8, cx - inn * ew * 1.04, cy - h * 0.22); shape.bezierCurveTo(cx - inn * ew * 1.0, cy + h * 0.5, cx - inn * ew * 0.2, cy + h * 0.72, cx + inn * ew * 0.3, cy + h * 0.62); shape.bezierCurveTo(cx + inn * ew * 0.75, cy + h * 0.52, cx + inn * ew * 1.0, cy + h * 0.32, cx + inn * ew * 0.98, cy + h * 0.05); shape.closePath();
  g.fillStyle = '#fffdfa'; g.fill(shape);
  g.save(); g.clip(shape);
  const ix = cx - inn * ew * 0.04 + (F.look || 0) * ew * 0.15, iy = cy + h * 0.08, iw = ew * (F.irisW || 0.66), ih = eh * 0.68;
  const I = F.iris || ['#07060c', '#1c1830', '#4a3f78', '#8a7cc0'];
  let gr = g.createLinearGradient(0, iy - ih, 0, iy + ih); gr.addColorStop(0, I[0]); gr.addColorStop(0.45, I[1]); gr.addColorStop(0.82, I[2]); gr.addColorStop(1, I[3]); g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, iw, ih, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineWidth = 2.4 * s; g.stroke();
  if (det) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1.2 * s; for (let q = 0; q < 22; q++) { const a = q / 22 * TAU; g.beginPath(); g.moveTo(ix + Math.cos(a) * iw * 0.45, iy + Math.sin(a) * ih * 0.45); g.lineTo(ix + Math.cos(a) * iw * 0.9, iy + Math.sin(a) * ih * 0.9); g.stroke(); } }
  g.fillStyle = 'rgba(4,3,8,.95)'; if (F.dbl) { for (const q of [-1, 1]) { g.beginPath(); g.ellipse(ix + q * iw * 0.36, iy + ih * 0.05, iw * 0.24, ih * 0.32, 0, 0, TAU); g.fill(); } } else { g.beginPath(); g.ellipse(ix, iy + ih * 0.06, iw * (F.slit ? 0.14 : 0.42), ih * 0.5, 0, 0, TAU); g.fill(); }
  if (det) { gr = g.createRadialGradient(ix, iy + ih * 0.65, 1, ix, iy + ih * 0.6, iw * 0.9); gr.addColorStop(0, F.glow || 'rgba(190,175,255,.6)'); gr.addColorStop(1, 'rgba(190,175,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy + ih * 0.5, iw * 0.85, ih * 0.5, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix - inn * iw * 0.34, iy - ih * 0.42, iw * 0.34, ih * 0.26, -0.4, 0, TAU); g.fill(); g.beginPath(); g.arc(ix + inn * iw * 0.36, iy + ih * 0.38, iw * 0.12, 0, TAU); g.fill();
  if (det) { gr = g.createLinearGradient(0, cy - h * 0.8, 0, cy - h * 0.1); gr.addColorStop(0, 'rgba(80,40,60,.5)'); gr.addColorStop(1, 'rgba(80,40,60,0)'); g.fillStyle = gr; g.fillRect(cx - ew * 1.3, cy - eh, ew * 2.6, eh); }
  g.restore();
  g.fillStyle = F.lash || '#120e18'; g.beginPath(); g.moveTo(cx + inn * ew * 0.92, cy - h * 0.02); g.bezierCurveTo(cx + inn * ew * 0.8, cy - h * 0.74, cx - inn * ew * 0.55, cy - h * 0.88, cx - inn * ew * 1.12, cy - h * 0.3); g.lineTo(cx - inn * ew * (F.flick ? 1.42 : 1.28), cy - h * (F.flick ? 0.58 : 0.46)); g.lineTo(cx - inn * ew * 1.1, cy - h * 0.14); g.bezierCurveTo(cx - inn * ew * 0.6, cy - h * 0.62, cx + inn * ew * 0.62, cy - h * 0.58, cx + inn * ew * 0.92, cy - h * 0.02); g.fill();
  if (det) { g.strokeStyle = 'rgba(90,50,60,.7)'; g.lineWidth = 2 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - inn * ew * 0.85, cy + h * 0.44); g.quadraticCurveTo(cx - inn * ew * 0.2, cy + h * 0.74, cx + inn * ew * 0.35, cy + h * 0.62); g.stroke(); }
  if (F.scar && inn < 0) { g.strokeStyle = 'rgba(150,60,50,.75)'; g.lineWidth = 2.6 * s; g.beginPath(); g.moveTo(cx - 6 * s, cy - eh * 1.3); g.lineTo(cx + 10 * s, cy + eh * 1.2); g.stroke(); }
}
function eyeSide(g, cx, cy, s, ew, eh, F, mode) {
  if (mode === 'closed' || mode === 'happy') { g.lineWidth = 5 * s; g.strokeStyle = '#1a1420'; g.lineCap = 'round'; g.beginPath(); if (mode === 'happy') { g.moveTo(cx - ew * 0.6, cy + 4 * s); g.quadraticCurveTo(cx, cy - eh * 0.5, cx + ew * 0.5, cy + 3 * s); } else { g.moveTo(cx - ew * 0.6, cy); g.quadraticCurveTo(cx, cy + eh * 0.3, cx + ew * 0.5, cy - 2 * s); } g.stroke(); return; }
  const sq = mode === 'angry' ? 0.72 : 1, h = eh * sq, w = ew * 0.62;
  const shape = new Path2D(); shape.moveTo(cx - w, cy - h * 0.2); shape.bezierCurveTo(cx - w * 0.6, cy - h * 0.82, cx + w * 0.5, cy - h * 0.8, cx + w * 0.92, cy - h * 0.35); shape.bezierCurveTo(cx + w, cy + h * 0.2, cx + w * 0.6, cy + h * 0.65, cx + w * 0.1, cy + h * 0.66); shape.bezierCurveTo(cx - w * 0.5, cy + h * 0.62, cx - w * 0.95, cy + h * 0.2, cx - w, cy - h * 0.2); shape.closePath();
  g.fillStyle = '#fffdfa'; g.fill(shape); g.save(); g.clip(shape);
  const I = F.iris || ['#07060c', '#1c1830', '#4a3f78', '#8a7cc0'], ix = cx + w * 0.3, iy = cy + h * 0.08, iw = w * 0.62, ih = eh * 0.68;
  let gr = g.createLinearGradient(0, iy - ih, 0, iy + ih); gr.addColorStop(0, I[0]); gr.addColorStop(0.45, I[1]); gr.addColorStop(0.82, I[2]); gr.addColorStop(1, I[3]); g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, iw, ih, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(4,3,8,.95)'; g.beginPath(); g.ellipse(ix + iw * 0.1, iy + ih * 0.06, iw * (F.slit ? 0.14 : 0.4), ih * 0.5, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix - iw * 0.25, iy - ih * 0.42, iw * 0.32, ih * 0.24, -0.3, 0, TAU); g.fill(); g.beginPath(); g.arc(ix + iw * 0.35, iy + ih * 0.38, iw * 0.12, 0, TAU); g.fill();
  g.restore();
  g.fillStyle = F.lash || '#120e18'; g.beginPath(); g.moveTo(cx - w * 1.08, cy - h * 0.12); g.bezierCurveTo(cx - w * 0.6, cy - h * 0.92, cx + w * 0.5, cy - h * 0.88, cx + w * 1.0, cy - h * 0.38); g.lineTo(cx + w * 0.92, cy - h * 0.25); g.bezierCurveTo(cx + w * 0.4, cy - h * 0.66, cx - w * 0.5, cy - h * 0.7, cx - w * 1.08, cy - h * 0.12); g.fill();
  g.beginPath(); g.moveTo(cx - w * 0.9, cy - h * 0.45); g.lineTo(cx - w * 1.35, cy - h * 0.7); g.lineTo(cx - w * 0.75, cy - h * 0.6); g.fill();
}
function mouthD(g, mx, my, s, mode, F, side) {
  const w = (F.mouthW || 13) * s * (side ? 0.7 : 1); g.lineCap = 'round';
  if (mode === 'talk' || mode === 'surprise' || mode === 'happy') { const hh = mode === 'surprise' ? 15 : mode === 'talk' ? 10 : 12; g.fillStyle = '#9a3a44'; g.beginPath(); g.moveTo(mx - w, my - 2 * s); g.quadraticCurveTo(mx, my + hh * s * 1.6, mx + w, my - 2 * s); g.quadraticCurveTo(mx, my + 2 * s, mx - w, my - 2 * s); g.fill(); g.fillStyle = '#ee8a92'; g.beginPath(); g.ellipse(mx, my + hh * 0.75 * s, w * 0.45, 3.5 * s, 0, 0, TAU); g.fill(); g.strokeStyle = '#5a2228'; g.lineWidth = 2.2 * s; g.beginPath(); g.moveTo(mx - w, my - 2 * s); g.quadraticCurveTo(mx, my + 1.5 * s, mx + w, my - 2 * s); g.stroke(); }
  else if (mode === 'angry') { g.strokeStyle = '#5a2228'; g.lineWidth = 2.6 * s; g.beginPath(); g.moveTo(mx - w * 0.8, my + 3 * s); g.quadraticCurveTo(mx, my - 3 * s, mx + w * 0.8, my + 3 * s); g.stroke(); }
  else if (mode === 'sad') { g.strokeStyle = '#5a2228'; g.lineWidth = 2.4 * s; g.beginPath(); g.moveTo(mx - w * 0.6, my + 2 * s); g.quadraticCurveTo(mx, my - 2 * s, mx + w * 0.6, my + 2 * s); g.stroke(); }
  else { g.strokeStyle = F.lip || '#6a2a30'; g.lineWidth = 2.4 * s; g.beginPath(); g.moveTo(mx - w * 0.6, my - 1 * s); g.quadraticCurveTo(mx, my + (F.smile ?? 5) * s, mx + w * 0.6, my - 1 * s); g.stroke(); }
  if (F.milk && mode !== 'angry') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(mx + w * 1.25, my + 2 * s, 4 * s, 3 * s, 0.3, 0, TAU); g.fill(); g.strokeStyle = 'rgba(180,170,160,.8)'; g.lineWidth = 1 * s; g.stroke(); }
  if (F.fang && mode !== 'sad') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx + w * 0.25, my); g.lineTo(mx + w * 0.38, my + 7 * s); g.lineTo(mx + w * 0.52, my); g.fill(); }
}
/* ---------- parametric hair ---------- */
const HAIRS = {
  kid: { vol: 1.04, top: -146, base: -64, bangs: [34, 52, 30, 58, 40, 62, 36, 54, 28], side: 98, back: 112, ahoge: true },
  short: { vol: 1.0, top: -136, base: -70, bangs: [18, 26, 14, 28, 20, 26, 16], side: 20, back: 20, spikes: 5, spH: 14 },
  spiky: { vol: 1.02, top: -138, base: -72, bangs: [26, 40, 20, 44, 24, 36], side: 30, back: 40, spikes: 9, spH: 34 },
  wild: { vol: 1.1, top: -140, base: -74, bangs: [22, 36, 18, 40, 24], side: 60, back: 150, spikes: 7, spH: 22, band: '#8a2a1a' },
  topknot: { vol: 1.0, top: -130, base: -88, bangs: null, side: 0, back: 20, knot: true },
  long: { vol: 1.04, top: -142, base: -66, bangs: [26, 44, 30, 50, 34, 46, 28], side: 130, back: 300, tie: null },
  longtie: { vol: 1.03, top: -140, base: -68, bangs: [22, 40, 26, 46, 30, 40], side: 110, back: 260, tie: '#7a1a14' },
  bun: { vol: 1.0, top: -136, base: -74, bangs: [16, 26, 18, 28, 16], side: 40, back: 20, bun: true },
  bald: { vol: 1.0, top: -104, base: -100, bangs: null, side: 0, back: 0, bald: true },
};
function hairShine(g, path, C, top, s) { g.save(); g.clip(path); g.globalAlpha = 0.38; g.strokeStyle = C.hl; g.lineWidth = 7 * s; g.beginPath(); g.ellipse(0, top + 30 * s, 80 * s, 46 * s, 0, PI * 1.12, PI * 1.88); g.stroke(); g.globalAlpha = 0.6; g.lineWidth = 2.2 * s; g.beginPath(); g.ellipse(0, top + 26 * s, 74 * s, 42 * s, 0, PI * 1.2, PI * 1.45); g.stroke(); g.beginPath(); g.ellipse(0, top + 26 * s, 74 * s, 42 * s, 0, PI * 1.55, PI * 1.8); g.stroke(); g.restore(); }
function bangPts(H, s) { const L = H.bangs, n = L.length, x0 = -96 * s, x1 = 96 * s, yb = H.base * s, pts = [[x0 - 8 * s, yb - 44 * s]]; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); if (i > 0) pts.push([x - (x1 - x0) / n / 2 + (i / n - 0.5) * 8 * s, yb + L[i - 1] * s]); pts.push([x, yb - 2 * s]); } pts.push([x1 + 8 * s, yb - 44 * s]); return pts; }
function domePts(H, s, inner) { const v = H.vol, t = H.top; const outer = [[-104 * v, 10], [-110 * v, -70], [-72 * v, t + 20], [0, t], [72 * v, t + 20], [110 * v, -70], [104 * v, 10]]; const hl = H.base; const inn = [[92, hl + 44], [60, hl + 22], [0, hl + 16], [-60, hl + 22], [-92, hl + 44]]; return sc2(outer.concat(inner === false ? [] : inn), s); }
function spikesPath(H, s) { if (!H.spikes) return null; const n = H.spikes, pts = []; for (let i = 0; i <= n; i++) { const a = PI * 1.05 + i / n * PI * 0.9, r = 108 * H.vol; pts.push([Math.cos(a) * r * s, (Math.sin(a) * (-H.top) * 0.98) * s]); if (i < n) { const am = a + PI * 0.9 / n / 2; pts.push([Math.cos(am) * (r + H.spH * 1.2) * s, (Math.sin(am) * (-H.top + H.spH)) * s]); } } pts.push([0, -40 * s]); return polyQ(pts); }
const HAIRDRAW = {
  back(g, H, C, s) { if (!H.back || H.back < 30) return; const b = H.back, v = H.vol; const pts = [[-104 * v, -60], [-112 * v, 10], [-110 * v, b * 0.5], [-90 * v, b]]; const n = 6; for (let i = 1; i < n; i++) pts.push([lerp(-90 * v, 90 * v, i / n), b + (i % 2 ? -18 : 6)]); pts.push([90 * v, b], [110 * v, b * 0.5], [112 * v, 10], [104 * v, -60]); cel(g, smoothP(sc2(pts, s)), C.c, { shade: C.sh }); if (H.tie) { const tp = ellP(0, 120 * s, 16 * s, 10 * s); cel(g, tp, H.tie); } },
  front(g, H, C, s) {
    if (H.bald) { const p = smoothP(sc2([[-100, -40], [-90, -80], [-50, -100], [0, -106], [50, -100], [90, -80], [100, -40], [80, -60], [0, -84], [-80, -60]], s)); g.globalAlpha = 0.35; cel(g, p, C.c, { line: false }); g.globalAlpha = 1; return; }
    if (H.knot) { const kp = ellP(0, (H.top - 26) * s, 34 * s, 28 * s); cel(g, kp, C.c, { shade: C.sh }); line(g, -40 * s, (H.top - 30) * s, 40 * s, (H.top - 22) * s, 5 * s, '#6a4a2a'); }
    if (H.bun) { const bp = ellP(0, (H.top - 10) * s, 46 * s, 34 * s); cel(g, bp, C.c, { shade: C.sh }); line(g, -60 * s, (H.top - 18) * s, 54 * s, (H.top - 2) * s, 4 * s, '#d8c070'); }
    const sp = spikesPath(H, s); if (sp) cel(g, sp, C.c, { shade: C.sh });
    const dome = smoothP(domePts(H, s)); cel(g, dome, C.c, { shade: C.sh, sx: -8 * s, sy: -10 * s, line: false }); inkP(g, dome, 1);
    if (H.bangs) { const b = polyQ(bangPts(H, s)); cel(g, b, C.c, { shade: C.sh, sx: -6 * s, sy: -8 * s }); }
    else { g.strokeStyle = C.sh; g.lineWidth = 2.5 * s; for (const x of [-60, -30, 0, 30, 60]) { g.beginPath(); g.moveTo(x * s, (H.base + 14) * s); g.quadraticCurveTo(x * 0.9 * s, (H.top + 30) * s, x * 0.4 * s, (H.top + 4) * s); g.stroke(); } }
    if (H.side) for (const sd of [-1, 1]) { const L = H.side; const sl = smoothP(sc2([[sd * 96, -70], [sd * 110, -10], [sd * 108, L * 0.6], [sd * 98, L], [sd * 90, L * 0.6], [sd * 86, L * 0.2], [sd * 80, -40]], s)); cel(g, sl, C.c, { shade: C.sh }); }
    hairShine(g, dome, C, (H.top + 50) * s, s);
    if (H.band) { const bp = new Path2D(); bp.moveTo(-108 * s, -78 * s); bp.quadraticCurveTo(0, -112 * s, 108 * s, -78 * s); bp.lineTo(106 * s, -64 * s); bp.quadraticCurveTo(0, -98 * s, -106 * s, -64 * s); bp.closePath(); cel(g, bp, H.band); }
    if (H.ahoge) { const ah = new Path2D(); ah.moveTo(-6 * s, (H.top + 6) * s); ah.bezierCurveTo(-14 * s, (H.top - 24) * s, 8 * s, (H.top - 46) * s, 30 * s, (H.top - 40) * s); ah.bezierCurveTo(14 * s, (H.top - 32) * s, 6 * s, (H.top - 16) * s, 8 * s, (H.top + 4) * s); ah.closePath(); cel(g, ah, C.c, { shade: C.sh }); }
  },
  side(g, H, C, s) { // facing right
    if (H.bald) return HAIRDRAW.front(g, H, C, s);
    const v = H.vol, t = H.top, b = Math.max(H.back, 10);
    if (H.knot) { const kp = ellP(-10 * s, (t - 24) * s, 32 * s, 26 * s); cel(g, kp, C.c, { shade: C.sh }); }
    if (H.bun) { const bp = ellP(-70 * s, (t + 30) * s, 40 * s, 36 * s); cel(g, bp, C.c, { shade: C.sh }); }
    const pts = [[-102 * v, -40], [-106 * v, -96], [-60, t + 8], [10, t], [70, t + 26], [100 * v, -70], [96, H.base + 24]];
    if (H.bangs) pts.push([82, H.base + 10], [88, H.base + 52], [64, H.base + 22], [56, H.base + 6], [30, H.base]); else pts.push([60, H.base + 10], [20, H.base + 6]);
    pts.push([16, -40], [0, -56], [-24, -24]);
    if (H.back >= 30) pts.push([-44, 30], [-36, b * 0.6], [-56, b], [-84, b * 0.92], [-102, b * 0.5], [-110, 10]); else pts.push([-60, 40], [-96, 20]);
    const p = smoothP(sc2(pts, s)); cel(g, p, C.c, { shade: C.sh, sx: -8 * s, sy: -10 * s });
    const sp = spikesPath(H, s); if (sp) { g.save(); g.translate(-10 * s, 0); cel(g, sp, C.c, { shade: C.sh }); g.restore(); cel(g, p, C.c, { shade: C.sh, sx: -8 * s, sy: -10 * s, line: false }); }
    hairShine(g, p, C, (t + 50) * s, s);
    if (H.band) { const bp = new Path2D(); bp.moveTo(-106 * s, -70 * s); bp.quadraticCurveTo(0, -108 * s, 100 * s, -80 * s); bp.lineTo(100 * s, -66 * s); bp.quadraticCurveTo(0, -94 * s, -104 * s, -56 * s); bp.closePath(); cel(g, bp, H.band); }
    if (H.ahoge) { const ah = new Path2D(); ah.moveTo(-10 * s, (t + 6) * s); ah.bezierCurveTo(-24 * s, (t - 26) * s, 0, (t - 48) * s, 26 * s, (t - 42) * s); ah.bezierCurveTo(8 * s, (t - 30) * s, 0, (t - 14) * s, 4 * s, (t + 4) * s); ah.closePath(); cel(g, ah, C.c, { shade: C.sh }); }
    if (H.tie && H.back > 100) { const tp = ellP(-60 * s, 110 * s, 12 * s, 16 * s); cel(g, tp, H.tie); }
  },
  backView(g, H, C, s) {
    if (H.bald) return;
    if (H.knot) { const kp = ellP(0, (H.top - 26) * s, 34 * s, 28 * s); cel(g, kp, C.c, { shade: C.sh }); }
    if (H.bun) { const bp = ellP(0, (H.top + 30) * s, 46 * s, 40 * s); cel(g, bp, C.c, { shade: C.sh }); }
    const sp = spikesPath(H, s); if (sp) cel(g, sp, C.c, { shade: C.sh });
    const v = H.vol, b = Math.max(H.back, 60), pts = [[-110 * v, 10], [-114 * v, -70], [-72 * v, H.top + 14], [0, H.top - 2], [72 * v, H.top + 14], [114 * v, -70], [110 * v, 10], [106 * v, b * 0.6], [86 * v, b]]; const n = 6; for (let i = 1; i < n; i++) pts.push([lerp(86 * v, -86 * v, i / n), b + (i % 2 ? 14 : -6)]); pts.push([-86 * v, b], [-106 * v, b * 0.6]);
    const p = smoothP(sc2(pts, s)); cel(g, p, C.c, { shade: C.sh, sx: -8 * s, sy: -12 * s }); hairShine(g, p, C, (H.top + 50) * s, s);
    g.strokeStyle = C.sh; g.lineWidth = 2.5 * s; for (const x of [-60, -25, 10, 45, 75]) { g.beginPath(); g.moveTo(x * s, -60 * s); g.quadraticCurveTo((x + 6) * s, b * 0.3 * s, (x - 4) * s, b * 0.9 * s); g.stroke(); }
    if (H.tie && H.back > 100) { const tp = ellP(0, 110 * s, 16 * s, 10 * s); cel(g, tp, H.tie); }
    if (H.band) { const bp = new Path2D(); bp.moveTo(-110 * s, -70 * s); bp.quadraticCurveTo(0, -50 * s, 110 * s, -70 * s); bp.lineTo(110 * s, -56 * s); bp.quadraticCurveTo(0, -36 * s, -110 * s, -56 * s); bp.closePath(); cel(g, bp, H.band); }
    if (H.ahoge) { const ah = new Path2D(); ah.moveTo(-6 * s, (H.top + 4) * s); ah.bezierCurveTo(-14 * s, (H.top - 26) * s, 8 * s, (H.top - 48) * s, 30 * s, (H.top - 42) * s); ah.bezierCurveTo(14 * s, (H.top - 34) * s, 6 * s, (H.top - 18) * s, 8 * s, (H.top + 2) * s); ah.closePath(); cel(g, ah, C.c, { shade: C.sh }); }
  },
};
/* ---------- weapons carried on the back / in hand (drawn in design units) ---------- */
function weaponPath(kind, s) {
  const P = new Path2D();
  if (kind === 'greatsword') { P.moveTo(-14 * s, 0); P.lineTo(14 * s, 0); P.lineTo(16 * s, -300 * s); P.lineTo(0, -330 * s); P.lineTo(-16 * s, -300 * s); P.closePath(); }
  else if (kind === 'spear' || kind === 'redspear') { P.rect(-5 * s, -60 * s, 10 * s, 340 * s); P.moveTo(-14 * s, -60 * s); P.lineTo(0, -110 * s); P.lineTo(14 * s, -60 * s); P.closePath(); }
  else if (kind === 'club') { P.rect(-7 * s, -40 * s, 14 * s, 160 * s); P.ellipse(0, -60 * s, 22 * s, 40 * s, 0, 0, TAU); }
  else if (kind === 'bow') { P.moveTo(0, -150 * s); P.quadraticCurveTo(60 * s, 0, 0, 150 * s); P.quadraticCurveTo(46 * s, 0, 0, -150 * s); }
  return P;
}
const WCOL = { greatsword: '#5a5a66', spear: '#6a4a30', redspear: '#7a1a14', club: '#6a4a34', bow: '#2a2420' };
function drawWeapon(g, kind, s) { const p = weaponPath(kind, s); cel(g, p, WCOL[kind] || '#555', { sx: -3 * s, sy: 0 }); if (kind === 'greatsword') { const gp = new Path2D(); gp.rect(-30 * s, -6 * s, 60 * s, 14 * s); cel(g, gp, '#3a3030'); const hp = new Path2D(); hp.rect(-7 * s, 8 * s, 14 * s, 60 * s); cel(g, hp, '#4a2c1a'); } if (kind === 'club') { g.fillStyle = '#f0e8d8'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 20 * s, -60 * s + Math.sin(a) * 36 * s); g.lineTo(Math.cos(a) * 34 * s, -60 * s + Math.sin(a) * 50 * s); g.lineTo(Math.cos(a + 0.3) * 20 * s, -60 * s + Math.sin(a + 0.3) * 36 * s); g.fill(); } } if (kind === 'bow') { line(g, 0, -150 * s, 0, 150 * s, 1.5 * s, '#e8e0d0'); } }
/* ================= the rig =================
   A: { view, ph, walk (0..1), act:{k,k01}, pose, mood, blink, talk, tilt, look, carry } */
function drawChibi(g, P, A, px) {
  const B = BUILD[P.build || 'kid'], s = B.head, view = A.view || 'front', w = A.walk || 0, ph = A.ph || 0, det = px * s > 0.42;
  LW = Math.max(1.0, 1.2 / px) * (P.lwK || 1);
  const H = HAIRS[P.hair || 'short'];
  const C = { skin: P.skin || '#fde8dc', skinSh: P.skinSh || mix(P.skin || '#fde8dc', '#d87a78', 0.28), hair: { c: P.hairC || '#1a1b28', sh: P.hairSh || mix(P.hairC || '#1a1b28', '#000', 0.45), hl: P.hairHl || mix(P.hairC || '#1a1b28', '#b8c4ff', 0.4) } };
  const sw = Math.sin(ph), cw = Math.cos(ph), bob = Math.abs(sw) * 6 * w;
  let hunch = P.hunch || 0;
  const legL = B.leg; let hipY = -legL + bob * 0.4;
  if (A.pose === 'sit' || A.pose === 'cross') hipY = -legL * 0.42; else if (A.pose === 'kneel') hipY = -legL * 0.6;
  const torsoT = B.torso, chestY = hipY - torsoT, headY = chestY - B.neck - 90 * s;
  const act = A.act, k = act ? act.k01 : 0, up = act ? sstep(0, 0.35, k) * (1 - sstep(0.6, 1, k)) : 0;
  let lean = hunch, armL = { sh: 0.12 + sw * 0.5 * w, el: 0.25 }, armR = { sh: 0.12 - sw * 0.5 * w, el: 0.25 }, legLa = sw * 0.55 * w, legRa = -sw * 0.55 * w, jumpY = 0;
  if (view !== 'side') { armL.sh = 0.12 + Math.abs(sw) * 0.14 * w; armR.sh = 0.12 + Math.abs(cw) * 0.14 * w; armL.el = armR.el = 0.2; }
  const P_ = A.pose;
  if (P_ === 'train') { const q = Math.sin((A.t || 0) * 3); armL.sh = 1.2 + q * 0.3; armR.sh = 1.2 - q * 0.3; armL.el = armR.el = 1.4; }
  if (P_ === 'pray') { armL.sh = armR.sh = view === 'side' ? 1.0 : 0.55; armL.el = armR.el = 1.7; }
  if (P_ === 'carry' || P_ === 'lift') { armL.sh = armR.sh = view === 'side' ? 3.0 : 2.75; armL.el = armR.el = 0.3; }
  if (P_ === 'arms') { armL.sh = armR.sh = 0.5; armL.el = armR.el = 1.9; }
  if (P_ === 'drink') { armR.sh = view === 'side' ? 1.6 : 1.3; armR.el = 1.9; }
  if (P_ === 'wave') { armR.sh = 2.7 + Math.sin((A.t || 0) * 10) * 0.25; armR.el = 0.5; }
  if (P_ === 'point') { armR.sh = view === 'side' ? 1.6 : 1.4; armR.el = 0; }
  if (act) switch (act.k) {
    case 'punch': if (view === 'side') { armR.sh = lerp(-0.4, 1.55, up); armR.el = lerp(1.6, 0, up); lean += 0.1 * up; } else { armR.sh = 0.2 + 1.5 * up; armR.el = 0.1; } break;
    case 'kick': legRa = view === 'side' ? 1.4 * up : 0; if (view !== 'side') jumpY = -20 * up; lean -= 0.12 * up; break;
    case 'cast': armR.sh = view === 'side' ? 1.5 * up : 1.3 * up; armR.el = 0.1; armL.sh = 0.6 * up; break;
    case 'cast2': armL.sh = armR.sh = 2.6 * up; armL.el = armR.el = 0.4; break;
    case 'throw': armR.sh = view === 'side' ? (k < 0.45 ? lerp(-0.2, -2.6, sstep(0, 0.45, k)) : lerp(-2.6, 1.3, sstep(0.45, 0.65, k))) : 2.4 * up; break;
    case 'lift': armL.sh = armR.sh = (view === 'side' ? 3.0 : 2.75) * up; armL.el = armR.el = 0.3; jumpY = 8 * Math.sin(k * PI); break;
    case 'slam': armL.sh = armR.sh = k < 0.5 ? 3.0 * sstep(0, 0.5, k) : lerp(3.0, view === 'side' ? 1.2 : 0.6, sstep(0.5, 0.65, k)); break;
    case 'hit': lean -= 0.25 * up; armL.sh = armR.sh = 0.7 * up; break;
    case 'cheer': armL.sh = armR.sh = 2.6 * up; jumpY = -Math.abs(Math.sin(k * TAU * 2)) * 24; break;
    case 'stab': armR.sh = view === 'side' ? lerp(0.4, 1.5, up) : 1.4 * up; armR.el = lerp(1.2, 0, up); break;
    case 'swing': armR.sh = view === 'side' ? (k < 0.4 ? lerp(0, 2.6, sstep(0, 0.4, k)) : lerp(2.6, 0.4, sstep(0.4, 0.7, k))) : 2.2 * up; break;
    case 'shoot': armL.sh = view === 'side' ? 1.55 : 1.4; armL.el = 0; armR.sh = view === 'side' ? 1.5 : 1.3; armR.el = k < 0.7 ? 1.9 : 0.2; break;
    case 'nod': A.tilt = Math.sin(k * TAU * 2) * 0.12; break;
    case 'shake': A.tilt = Math.sin(k * TAU * 3) * 0.15; break;
    case 'roll': break;
    case 'spin': break;
    case 'stomp': legLa = view === 'side' ? 0.9 * up : 0; jumpY = -10 * up; break;
  }
  g.save();
  if (act && act.k === 'roll') { g.translate(0, -60); g.rotate(k * TAU * (view === 'side' ? 1 : 0)); g.translate(0, 60); if (view !== 'side') g.scale(1, 1 - Math.sin(k * PI) * 0.4); }
  if (act && act.k === 'spin') { g.scale(Math.cos(k * TAU * 2), 1); }
  if (P_ === 'down' || P_ === 'lie') { g.translate(0, -30); g.rotate(-HP * 0.95 * (view === 'side' ? 1 : 0)); if (view !== 'side') { g.scale(1, 0.55); } }
  g.translate(0, jumpY);
  if (view === 'front' || view === 'back') {
    const back = view === 'back', shW = B.shoulder, hipW = B.hip;
    if (!back && P.hair) { g.save(); g.translate(0, headY); HAIRDRAW.back(g, H, C.hair, s); g.restore(); }
    if (!back && P.weapon) { g.save(); g.translate(shW * 0.5, chestY + torsoT * 0.4); g.rotate(-0.5); drawWeapon(g, P.weapon, 1); g.restore(); }
    // legs
    const legs = () => { for (const sd of [-1, 1]) { const lift = Math.max(0, sd < 0 ? sw : -sw) * 16 * w; let x0 = sd * hipW * 0.45, y0 = hipY, x1 = sd * hipW * 0.5, y1 = -10 - lift; if (P_ === 'sit' || P_ === 'cross') { x1 = sd * hipW * 1.4; y1 = hipY + 34; } if (P_ === 'kneel') { y1 = -10; x1 = sd * hipW * 0.7; }
      const lp = limbP(x0, y0, x1, y1, B.legR, B.legR * 0.82); cel(g, lp, P.legC || C.skin, { shade: P.legC ? shadeOf(P.legC) : C.skinSh, sx: -5, sy: 0 });
      if (P.wraps) { g.save(); g.clip(lp); g.fillStyle = P.wraps; for (let i = 0; i < 3; i++) { const yy = lerp(y0, y1, 0.55 + i * 0.12); g.beginPath(); g.moveTo(x1 - 40, yy); g.lineTo(x1 + 40, yy - 8); g.lineTo(x1 + 40, yy + 2); g.lineTo(x1 - 40, yy + 10); g.fill(); } g.restore(); inkP(g, lp, 1); }
      const bc = P.boot || '#8a6040', boot = smoothP([[x1 - B.legR * 1.05, y1 - 26], [x1 + B.legR * 1.05, y1 - 26], [x1 + B.legR * 1.15, y1 + 2], [x1 + B.legR * 0.6, y1 + 10], [x1 - B.legR * 0.8, y1 + 10], [x1 - B.legR * 1.2, y1 + 2]]); cel(g, boot, bc, { sx: -4, sy: -3 }); line(g, x1 - B.legR, y1 - 18, x1 + B.legR, y1 - 18, 2, shadeOf(bc)); } };
    const drawArm = (sd, a) => { const x0 = sd * shW * 0.86, y0 = chestY + 14, L1 = B.arm * 0.5, L2 = B.arm * 0.48; const a1 = sd * a.sh, ex = x0 + Math.sin(a1) * L1, ey = y0 + Math.cos(a1) * L1, a2 = a1 - sd * a.el, hx = ex + Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
      const skin = C.skin, sl = P.sleeve; const ap = limbP(x0, y0, ex, ey, B.armR * 1.05, B.armR * 0.9); cel(g, ap, sl ? P.top : skin, { shade: sl ? shadeOf(P.top) : C.skinSh, sx: -5 * sd, sy: -2 });
      const fp = limbP(ex, ey, hx, hy, B.armR * 0.9, B.armR * 0.78); cel(g, fp, sl === 'long' ? P.top : skin, { shade: sl === 'long' ? shadeOf(P.top) : C.skinSh, sx: -4 * sd, sy: -2 });
      if (P.bracer) { const bp = limbP(lerp(ex, hx, 0.45), lerp(ey, hy, 0.45), lerp(ex, hx, 0.85), lerp(ey, hy, 0.85), B.armR * 0.95, B.armR * 0.85, 0); cel(g, bp, P.bracer); }
      if (P.armband) { const bp = limbP(lerp(x0, ex, 0.55), lerp(y0, ey, 0.55), lerp(x0, ex, 0.7), lerp(y0, ey, 0.7), B.armR * 1.0, B.armR * 0.98, 0); cel(g, bp, P.armband); }
      if (P.puff !== false && !sl) { const sp = smoothP([[x0 - B.armR * 1.25, y0 - 6], [x0 + B.armR * 1.25, y0 - 8], [x0 + Math.sin(a1) * L1 * 0.42 + B.armR * 1.15, y0 + Math.cos(a1) * L1 * 0.42], [x0 + Math.sin(a1) * L1 * 0.45 - B.armR * 1.1, y0 + Math.cos(a1) * L1 * 0.45 + 3]]); cel(g, sp, P.top, { shade: shadeOf(P.top) }); }
      if (P.bracelet && sd > 0) { g.fillStyle = '#fbf6e8'; g.strokeStyle = INK; g.lineWidth = 0.8 * LW; for (let i = -2; i <= 2; i++) { const bx = lerp(ex, hx, 0.88) + i * B.armR * 0.38, by = lerp(ey, hy, 0.88); g.beginPath(); g.moveTo(bx - 3, by); g.lineTo(bx, by + 8); g.lineTo(bx + 3, by); g.closePath(); g.fill(); g.stroke(); } }
      const hp = ellP(hx, hy + 2, B.armR * 1.05, B.armR * 1.15); cel(g, hp, skin, { shade: C.skinSh, sx: -3, sy: -3 });
      if (A.hold && sd < 0 && !back) A.hold(g, hx, hy);
      return [hx, hy]; };
    const kiltBot = hipY + (P.kiltL ?? 58) * s * 1.1;
    const lowerG = () => { if (P.robe) return; if (P.pants) return; const kp = new Path2D(); const kw = hipW * 1.05, kb = hipW * 1.32; kp.moveTo(-kw, hipY - 10); kp.lineTo(kw, hipY - 10); kp.lineTo(kb, kiltBot); const n = 8; for (let i = 1; i <= n; i++) { const x = lerp(kb, -kb, i / n); kp.lineTo(x + (kb * 2 / n) * 0.5, kiltBot + (i % 2 ? 12 : 4)); kp.lineTo(x, kiltBot); } kp.closePath(); const kc = P.kilt || '#b6844f'; cel(g, kp, kc, { sx: -10, sy: 0 }); g.strokeStyle = shadeOf(kc); g.lineWidth = 2.2; g.beginPath(); g.moveTo(-kw * 0.4, hipY); g.lineTo(-kb * 0.45, kiltBot - 4); g.moveTo(kw * 0.45, hipY); g.lineTo(kb * 0.5, kiltBot - 4); g.stroke(); };
    const torso = () => { const tw = shW * 0.92, ww = B.waist * B.belly, rb = P.robe ? -14 : hipY + 4, tc = P.top || '#efe4cc';
      const tp = smoothP([[-tw, chestY + 4], [-tw * 0.98, chestY + torsoT * 0.35], [-ww * 1.02, hipY - 16], [-ww * (P.robe ? 1.35 : 1.06), rb], [0, rb + 6], [ww * (P.robe ? 1.35 : 1.06), rb], [ww * 1.02, hipY - 16], [tw * 0.98, chestY + torsoT * 0.35], [tw, chestY + 4], [0, chestY - 6]]);
      cel(g, tp, tc, { sx: -12, sy: -4 });
      if (!back) { g.save(); g.clip(tp); if (P.vest) { const vp = new Path2D(); vp.moveTo(-tw * 0.22, chestY - 2); vp.lineTo(tw * 0.22, chestY - 2); vp.lineTo(ww * 0.16, hipY - 12); vp.lineTo(-ww * 0.16, hipY - 12); vp.closePath(); cel(g, vp, C.skin, { shade: C.skinSh, sx: -4, sy: 0 }); if (P.build === 'brute' || P.build === 'man') { g.strokeStyle = rgba(C.skinSh, 0.9); g.lineWidth = 2.2; g.beginPath(); g.moveTo(-tw * 0.1, chestY + torsoT * 0.3); g.quadraticCurveTo(0, chestY + torsoT * 0.36, tw * 0.1, chestY + torsoT * 0.3); g.moveTo(0, chestY + torsoT * 0.4); g.lineTo(0, hipY - 30); g.stroke(); } }
        else if (!P.robe) { g.strokeStyle = shadeOf(tc); g.lineWidth = 2.4; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(0, chestY + 12); g.lineTo(0, hipY - 12); g.stroke(); g.setLineDash([]); }
        g.restore(); }
      if (P.robe && !back) { g.strokeStyle = P.trim || shadeOf(tc); g.lineWidth = 7; g.beginPath(); g.moveTo(-tw * 0.32, chestY + 2); g.quadraticCurveTo(-6, chestY + 70, tw * 0.25, chestY + 130); g.lineTo(ww * 0.4, rb); g.stroke(); g.lineWidth = LW; g.strokeStyle = INK; g.stroke(); }
      if (P.sash) { const sp = new Path2D(); sp.moveTo(-ww * 1.08, hipY - 22); sp.quadraticCurveTo(0, hipY - 12, ww * 1.08, hipY - 22); sp.lineTo(ww * 1.1, hipY - 2); sp.quadraticCurveTo(0, hipY + 8, -ww * 1.1, hipY - 2); sp.closePath(); cel(g, sp, P.sash); if (!back) { const kn = smoothP([[ww * 0.3, hipY - 10], [ww * 0.55, hipY - 4], [ww * 0.5, hipY + 40], [ww * 0.36, hipY + 44], [ww * 0.4, hipY + 6]]); cel(g, kn, P.sash); } }
      if (P.belt !== false && !P.robe && !P.sash) { const bp = new Path2D(); bp.moveTo(-ww * 1.08, hipY - 14); bp.quadraticCurveTo(0, hipY - 6, ww * 1.08, hipY - 14); bp.lineTo(ww * 1.1, hipY + 2); bp.quadraticCurveTo(0, hipY + 10, -ww * 1.1, hipY + 2); bp.closePath(); cel(g, bp, P.belt || '#6a4428'); if (!back) { const bk = new Path2D(); bk.roundRect(-11, hipY - 11, 22, 17, 4); cel(g, bk, '#e0c060', { sx: -2, sy: -2 }); } }
      if (P.necklace && !back) { g.fillStyle = '#f4eedc'; g.strokeStyle = INK; g.lineWidth = 0.8 * LW; for (let i = 0; i < 7; i++) { const a = -0.9 + i / 6 * 1.8, bx = Math.sin(a) * tw * 0.5, by = chestY + 24 + Math.cos(a) * 18; g.beginPath(); g.moveTo(bx - 4, by); g.lineTo(bx, by + 13); g.lineTo(bx + 4, by); g.closePath(); g.fill(); g.stroke(); } }
      if (P.fur) { const n = 9, cp = new Path2D(), r0 = tw * 0.8; cp.moveTo(-r0, chestY + 6); for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(-r0, r0, t), y = chestY + 8 + Math.sin(t * PI) * (back ? 4 : 10); cp.quadraticCurveTo(x - r0 / n, y + 16, x, y + 6); } for (let i = n; i >= 0; i--) { const t = i / n, x = lerp(-r0, r0, t); cp.quadraticCurveTo(x + r0 / n * 0.5, chestY - 12 - Math.sin(t * PI) * 4, x, chestY - 4); } cp.closePath(); cel(g, cp, P.fur, { sx: -3, sy: -5 }); } };
    if (P.pants) { /* trousers are just coloured legs */ }
    legs();
    if (back) { drawArm(-1, armL); drawArm(1, armR); lowerG(); torso(); if (P.weapon) { g.save(); g.translate(-shW * 0.3, chestY + torsoT * 0.5); g.rotate(0.5); drawWeapon(g, P.weapon, 1); g.restore(); } }
    else { lowerG(); torso(); }
    if (!back) { const np = limbP(0, chestY + 2, 0, headY + 80 * s, B.neck * 0.4 + 9 * s, B.neck * 0.38 + 9 * s, 0); cel(g, np, C.skinSh, { shade: mix(C.skinSh, '#a06060', 0.2) }); drawArm(-1, armL); drawArm(1, armR); }
    g.save(); g.translate(0, headY); g.rotate(lean * 0.3 + (A.tilt || 0));
    if (back) { const hp = ellP(0, 0, 104 * s, 100 * s); cel(g, hp, C.skin, { shade: C.skinSh }); if (P.hair) HAIRDRAW.backView(g, H, C.hair, s); }
    else {
      for (const sd of [-1, 1]) { const ep = ellP(sd * 100 * s, 10 * s, 13 * s, 20 * s, sd * 0.2); cel(g, ep, C.skin, { shade: C.skinSh }); }
      const F = P.face || {}; const jaw = F.jaw ?? 0;
      const face = smoothP(sc2([[-104, -50], [-106, 0], [-96 + jaw * 4, 44], [-70 + jaw * 8, 80], [-34 + jaw * 6, 100 + jaw * 4], [0, 106 + jaw * 8], [34 - jaw * 6, 100 + jaw * 4], [70 - jaw * 8, 80], [96 - jaw * 4, 44], [106, 0], [104, -50], [60, -96], [0, -104], [-60, -96]], s)); cel(g, face, C.skin, { shade: C.skinSh, sx: -10 * s, sy: -6 * s });
      g.save(); g.clip(face); g.fillStyle = 'rgba(220,140,130,.28)'; g.beginPath(); g.ellipse(0, (HAIRS[P.hair || 'short'].base + 16) * s, 110 * s, 30 * s, 0, 0, TAU); g.fill(); if (F.stubble) { g.fillStyle = 'rgba(60,60,80,.16)'; g.beginPath(); g.ellipse(0, 76 * s, 60 * s, 32 * s, 0, 0, TAU); g.fill(); } g.restore();
      const mood = A.blink ? (A.mood === 'happy' ? 'happy' : 'closed') : (A.mood || 'open');
      const bl = F.blush ?? 0.3; for (const sd of [-1, 1]) { const bx = sd * 60 * s, by = 40 * s; const gr = g.createRadialGradient(bx, by, 1, bx, by, 26 * s); gr.addColorStop(0, `rgba(255,120,130,${bl})`); gr.addColorStop(1, 'rgba(255,120,130,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(bx, by, 28 * s, 16 * s, 0, 0, TAU); g.fill(); if (bl > 0.34 && det) { g.strokeStyle = 'rgba(235,105,115,.55)'; g.lineWidth = 1.6 * s; for (let q = -1; q <= 1; q++) { g.beginPath(); g.moveTo(bx + q * 7 * s - 3 * s, by + 4 * s); g.lineTo(bx + q * 7 * s + 2 * s, by - 4 * s); g.stroke(); } } }
      const ew = (F.ew || 30) * s, eh = (F.eh || 38) * s, ey = (F.ey ?? 8) * s, sep = (F.sep ?? 44) * s;
      for (const sd of [-1, 1]) { const inn = -sd; g.strokeStyle = F.browC || 'rgba(30,22,30,.8)'; g.lineWidth = (F.browW || 4.5) * s; g.lineCap = 'round'; const bt = (mood === 'angry' ? 8 : mood === 'sad' ? -6 : 0) + (F.browT || 0); g.beginPath(); g.moveTo(sd * sep + inn * ew * 0.55, ey - eh * 1.15 + bt * s); g.quadraticCurveTo(sd * sep, ey - eh * 1.35, sd * sep - inn * ew * 0.7, ey - eh * 1.18 - bt * 0.3 * s); g.stroke(); }
      for (const sd of [-1, 1]) eyeFront(g, sd * sep, ey, s, ew, eh, F, mood, -sd, det);
      if (F.wrinkle) { g.strokeStyle = 'rgba(120,70,60,.5)'; g.lineWidth = 2 * s; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 22 * s, 48 * s); g.quadraticCurveTo(sd * 30 * s, 64 * s, sd * 26 * s, 78 * s); g.stroke(); g.beginPath(); g.moveTo(sd * (sep + ew * 1.1), ey - 4 * s); g.lineTo(sd * (sep + ew * 1.35), ey + 4 * s); g.stroke(); } }
      g.fillStyle = 'rgba(210,130,120,.6)'; g.beginPath(); g.ellipse(2 * s, 44 * s, 2.5 * s, 2 * s, 0, 0, TAU); g.fill();
      if (F.beard) { const bp = smoothP(sc2([[-52, 54], [-40, 100], [-14, 140], [0, 152], [14, 140], [40, 100], [52, 54], [24, 80], [0, 84], [-24, 80]], s)); cel(g, bp, F.beard, { sx: -4, sy: -4 }); const mp = smoothP(sc2([[-34, 60], [-12, 52], [0, 56], [12, 52], [34, 60], [14, 66], [0, 62], [-14, 66]], s)); cel(g, mp, F.beard); }
      else mouthD(g, 0, 66 * s, s, A.talk ? 'talk' : (A.mood || 'open'), F, false);
      if (P.hair) HAIRDRAW.front(g, H, C.hair, s);
    }
    g.restore();
  } else {
    // ---------------- SIDE (facing right) ----------------
    const hipW = B.hip, shW = B.shoulder;
    const leg = (a, far) => { const x0 = 4, y0 = hipY, L1 = legL * 0.52, L2 = legL * 0.5; let kx = x0 + Math.sin(a) * L1, ky = y0 + Math.cos(a) * L1, knee = Math.max(0, -Math.sin(a + 0.3)) * 0.9 * w; if (P_ === 'sit' || P_ === 'cross' || P_ === 'kneel') { kx = x0 + L1 * 0.95; ky = y0 + 6; knee = -1.5; } const fx = kx + Math.sin(a - knee) * L2, fy = Math.min(-8, ky + Math.cos(a - knee) * L2);
      const col = P.legC || C.skin, shc = P.legC ? shadeOf(P.legC) : C.skinSh; g.save(); if (far) g.filter = 'brightness(0.82)';
      const p1 = limbP(x0, y0, kx, ky, B.legR, B.legR * 0.86), p2 = limbP(kx, ky, fx, fy, B.legR * 0.86, B.legR * 0.78); cel(g, p1, col, { shade: shc, sx: -6, sy: -2 }); cel(g, p2, col, { shade: shc, sx: -6, sy: -2 });
      if (P.wraps) { g.save(); g.clip(p2); g.fillStyle = P.wraps; for (let i = 0; i < 3; i++) { const t = 0.4 + i * 0.16, yy = lerp(ky, fy, t), xx = lerp(kx, fx, t); g.beginPath(); g.moveTo(xx - 40, yy); g.lineTo(xx + 40, yy - 6); g.lineTo(xx + 40, yy + 4); g.lineTo(xx - 40, yy + 10); g.fill(); } g.restore(); inkP(g, p2, 1); }
      const boot = smoothP([[fx - B.legR * 1.1, fy - 24], [fx + B.legR * 0.9, fy - 24], [fx + B.legR * 1.0, fy - 8], [fx + B.legR * 2.2, fy + 2], [fx + B.legR * 1.8, fy + 10], [fx - B.legR * 1.1, fy + 10]]); cel(g, boot, P.boot || '#8a6040', { sx: -4, sy: -3 });
      g.restore(); };
    const arm = (a, el, far) => { const x0 = 0, y0 = chestY + 16, L1 = B.arm * 0.5, L2 = B.arm * 0.48; const EX = x0 + Math.sin(a) * L1, EY = y0 + Math.cos(a) * L1, a2 = a + el, HX = EX + Math.sin(a2) * L2, HY = EY + Math.cos(a2) * L2, sl = P.sleeve;
      g.save(); if (far) g.filter = 'brightness(0.8)';
      const p1 = limbP(x0, y0, EX, EY, B.armR * 1.05, B.armR * 0.9), p2 = limbP(EX, EY, HX, HY, B.armR * 0.9, B.armR * 0.78);
      cel(g, p1, sl ? P.top : C.skin, { shade: sl ? shadeOf(P.top) : C.skinSh, sx: -5, sy: -2 }); cel(g, p2, sl === 'long' ? P.top : C.skin, { shade: sl === 'long' ? shadeOf(P.top) : C.skinSh, sx: -5, sy: -2 });
      if (P.bracer) { const bp = limbP(lerp(EX, HX, 0.45), lerp(EY, HY, 0.45), lerp(EX, HX, 0.85), lerp(EY, HY, 0.85), B.armR * 0.95, B.armR * 0.85, 0); cel(g, bp, P.bracer); }
      if (P.puff !== false && !sl) { const sp = smoothP([[x0 - B.armR * 1.3, y0 - 10], [x0 + B.armR * 1.3, y0 - 10], [EX * 0.5 + B.armR * 1.15, y0 + (EY - y0) * 0.5], [EX * 0.5 - B.armR * 1.15, y0 + (EY - y0) * 0.5 + 4]]); cel(g, sp, P.top, { shade: shadeOf(P.top) }); }
      if (P.bracelet && far) { g.fillStyle = '#fbf6e8'; for (let i = -1; i <= 1; i++) { const bx = lerp(EX, HX, 0.88) + i * 6, by = lerp(EY, HY, 0.88); g.beginPath(); g.moveTo(bx - 3, by); g.lineTo(bx, by + 8); g.lineTo(bx + 3, by); g.closePath(); g.fill(); } }
      const hp = ellP(HX, HY, B.armR * 1.05, B.armR * 1.1); cel(g, hp, C.skin, { shade: C.skinSh, sx: -3, sy: -3 });
      if (A.hold && !far) A.hold(g, HX, HY);
      g.restore(); };
    if (P.hair && H.back >= 120) { g.save(); g.translate(-10 * s, headY); const b = H.back; const bp = smoothP(sc2([[-40, 0], [-30, b * 0.6], [-56, b], [-90, b * 0.9], [-106, b * 0.5], [-100, 0]], s)); cel(g, bp, C.hair.c, { shade: C.hair.sh }); g.restore(); }
    if (P.weapon) { g.save(); g.translate(-shW * 0.4, chestY + torsoT * 0.45); g.rotate(-0.45); drawWeapon(g, P.weapon, 1); g.restore(); }
    arm(-armL.sh * 0.9 - 0.05, -armL.el, true);
    leg(legLa, true); leg(legRa, false);
    if (!P.robe && !P.pants) { const kb = hipY + (P.kiltL ?? 58) * s * 1.1, kp = new Path2D(); kp.moveTo(-hipW * 0.95, hipY - 10); kp.lineTo(hipW * 0.95, hipY - 10); kp.lineTo(hipW * 1.25, kb); for (let i = 1; i <= 6; i++) { const x = lerp(hipW * 1.25, -hipW * 1.15, i / 6); kp.lineTo(x + hipW * 0.2, kb + (i % 2 ? 11 : 4)); kp.lineTo(x, kb); } kp.closePath(); cel(g, kp, P.kilt || '#b6844f', { sx: -10, sy: 0 }); }
    g.save(); g.translate(0, hipY); g.rotate(lean); g.translate(0, -hipY);
    const tw = shW * 0.62, ww = B.waist * 0.78 * B.belly, rb = P.robe ? -14 : hipY + 4, tc = P.top || '#efe4cc';
    const tp = smoothP([[-tw, chestY + 6], [-tw * 1.02, chestY + torsoT * 0.4], [-ww, hipY - 14], [-ww * (P.robe ? 1.3 : 1.05), rb], [ww * (P.robe ? 1.4 : 1.08), rb], [ww * 1.1, hipY - 16], [tw * 1.08, chestY + torsoT * 0.42], [tw, chestY + 4], [0, chestY - 6]]);
    cel(g, tp, tc, { sx: -10, sy: -4 });
    if (P.vest) { g.save(); g.clip(tp); const vp = new Path2D(); vp.moveTo(tw * 0.5, chestY - 4); vp.lineTo(tw * 1.2, chestY - 4); vp.lineTo(ww * 1.2, hipY - 14); vp.lineTo(ww * 0.6, hipY - 14); vp.closePath(); cel(g, vp, C.skin, { shade: C.skinSh }); g.restore(); }
    if (P.sash) { const sp = new Path2D(); sp.moveTo(-ww * 1.06, hipY - 22); sp.lineTo(ww * 1.12, hipY - 24); sp.lineTo(ww * 1.14, hipY - 2); sp.lineTo(-ww * 1.08, hipY); sp.closePath(); cel(g, sp, P.sash); }
    else if (P.belt !== false && !P.robe) { const bp = new Path2D(); bp.moveTo(-ww * 1.06, hipY - 14); bp.lineTo(ww * 1.12, hipY - 16); bp.lineTo(ww * 1.14, hipY); bp.lineTo(-ww * 1.08, hipY + 2); bp.closePath(); cel(g, bp, P.belt || '#6a4428'); }
    if (P.fur) { const cp = new Path2D(); cp.moveTo(-tw * 0.95, chestY + 4); for (let i = 0; i <= 5; i++) { const x = lerp(-tw * 0.95, tw * 1.0, i / 5); cp.quadraticCurveTo(x - tw * 0.2, chestY + 22, x, chestY + 10); } cp.lineTo(tw * 0.8, chestY - 12); cp.quadraticCurveTo(0, chestY - 20, -tw * 0.8, chestY - 10); cp.closePath(); cel(g, cp, P.fur, { sx: -3, sy: -5 }); }
    const np = limbP(6 * s, chestY + 4, 10 * s, headY + 76 * s, B.neck * 0.4 + 9 * s, B.neck * 0.38 + 9 * s, 0); cel(g, np, C.skinSh, { shade: mix(C.skinSh, '#a06060', 0.2) });
    g.save(); g.translate(0, headY); g.rotate(A.tilt || 0);
    const F = P.face || {}; const mood = A.blink ? (A.mood === 'happy' ? 'happy' : 'closed') : (A.mood || 'open'); const jaw = F.jaw ?? 0;
    const prof = smoothP(sc2([[-98, -30], [-96, 30], [-70, 74], [-30, 96], [18, 104 + jaw * 6], [52, 96 + jaw * 4], [78, 74], [92, 52], [96, 38], [102, 22], [96, 12], [100, -10], [96, -50], [60, -96], [0, -104], [-60, -90]], s));
    cel(g, prof, C.skin, { shade: C.skinSh, sx: 8 * s, sy: -6 * s });
    g.save(); g.clip(prof); g.fillStyle = 'rgba(220,140,130,.28)'; g.beginPath(); g.ellipse(20 * s, (H.base + 16) * s, 110 * s, 30 * s, 0, 0, TAU); g.fill(); g.restore();
    const ep = ellP(-12 * s, 12 * s, 13 * s, 20 * s, 0.1); cel(g, ep, C.skin, { shade: C.skinSh });
    const bl = F.blush ?? 0.3, bx = 64 * s, by = 42 * s, gr = g.createRadialGradient(bx, by, 1, bx, by, 24 * s); gr.addColorStop(0, `rgba(255,120,130,${bl})`); gr.addColorStop(1, 'rgba(255,120,130,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(bx, by, 24 * s, 14 * s, 0, 0, TAU); g.fill();
    const ew = (F.ew || 30) * s, eh = (F.eh || 38) * s, ey = (F.ey ?? 8) * s;
    g.strokeStyle = F.browC || 'rgba(30,22,30,.8)'; g.lineWidth = (F.browW || 4.5) * s; g.lineCap = 'round'; const bt = (mood === 'angry' ? 9 : 0) + (F.browT || 0); g.beginPath(); g.moveTo(44 * s, ey - eh * 1.2); g.quadraticCurveTo(64 * s, ey - eh * 1.36 + bt * 0.8 * s, 82 * s, ey - eh * 1.18 + bt * s); g.stroke();
    eyeSide(g, 66 * s, ey, s, ew, eh, F, mood);
    if (F.beard) { const bp = smoothP(sc2([[40, 50], [92, 54], [86, 110], [60, 150], [30, 120], [20, 80]], s)); cel(g, bp, F.beard); }
    else mouthD(g, 84 * s, 66 * s, s, A.talk ? 'talk' : (A.mood || 'open'), Object.assign({}, F, { milk: false }), true);
    if (P.hair) HAIRDRAW.side(g, H, C.hair, s);
    g.restore(); g.restore();
    arm(armR.sh * 0.9 + 0.05, armR.el, false);
  }
  g.restore();
}
/* ---------- portrait (bust) for dialogue / unit frames ---------- */
const PORTRAITS = new Map();
function chibiPortrait(P, mood = 'open', size = 256) {
  const key = (P.key || JSON.stringify(P).length) + '|' + mood + '|' + size; let c = PORTRAITS.get(key); if (c) return c;
  c = cnv(size, size); const g = c.getContext('2d'); const B = BUILD[P.build || 'kid'], s = B.head;
  const headY = -(B.leg + B.torso + B.neck + 90 * s); const zoom = size / (340 * s);
  g.translate(size / 2, size * 0.5); g.scale(zoom, zoom); g.translate(0, -headY - 20 * s);
  drawChibi(g, P, { view: 'front', mood }, zoom);
  PORTRAITS.set(key, c); return c;
}
