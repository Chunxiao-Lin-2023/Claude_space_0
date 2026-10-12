/* ================= procedural textures & materials ================= */
const TEX = {};
const texRng = mulberry32(777);
const tr = (a, b) => a + texRng() * (b - a);
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function mkTex(c, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
function noiseLayer(g, w, h, amt, n = 6000, size = 2) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${texRng() < 0.5 ? '0,0,0' : '255,255,255'},${texRng() * amt})`; g.fillRect(texRng() * w, texRng() * h, size * texRng() + 0.5, size * texRng() + 0.5); } }
function grime(g, w, h, k = 1) {
  for (let i = 0; i < 26 * k; i++) {
    const x = texRng() * w, y = texRng() * h, r = tr(20, 140), gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(10,8,5,${tr(0.06, 0.22)})`); gr.addColorStop(1, 'rgba(10,8,5,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
/* wood grain strip into a rect */
function grainRect(g, x, y, w, h, base, vert) {
  g.fillStyle = base; g.fillRect(x, y, w, h);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const L = vert ? h : w, S = vert ? w : h;
  for (let i = 0; i < S * 0.9; i++) {
    const off = texRng() * S, a = tr(0.03, 0.14), dark = texRng() < 0.6;
    g.strokeStyle = dark ? `rgba(20,10,4,${a})` : `rgba(255,220,170,${a * 0.5})`; g.lineWidth = tr(0.5, 2.2);
    g.beginPath(); const amp = tr(0.5, 3), fr = tr(0.004, 0.02), ph = texRng() * 9;
    for (let t = 0; t <= L; t += 6) { const o = off + Math.sin(t * fr + ph) * amp; if (vert) { t ? g.lineTo(x + o, y + t) : g.moveTo(x + o, y + t); } else { t ? g.lineTo(x + t, y + o) : g.moveTo(x + t, y + o); } }
    g.stroke();
  }
  // knots
  if (texRng() < 0.5) { const kx = x + texRng() * w, ky = y + texRng() * h; for (let r = 2; r < 14; r += 2.5) { g.strokeStyle = `rgba(30,15,5,${0.25 - r * 0.012})`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(kx, ky, vert ? r * 0.6 : r * 1.8, vert ? r * 1.8 : r * 0.6, 0, 0, TAU); g.stroke(); } }
  g.restore();
}
function buildTextures() {
  // ---- floors (each covers 4 m × 4 m) ----
  const plank = (hue, sat, lit, key) => {
    const c = cnv(1024, 1024), g = c.getContext('2d'); const pw = 1024 / 16;
    for (let i = 0; i < 16; i++) { let y = -tr(0, 600); while (y < 1024) { const len = tr(420, 900); grainRect(g, i * pw, y, pw, len, hsl(hue + tr(-2, 2), sat + tr(-4, 4), lit + tr(-2.5, 2)), true); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(i * pw, y, pw, 2); y += len; } g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(i * pw, 0, 2, 1024); }
    grime(g, 1024, 1024, 1.4); noiseLayer(g, 1024, 1024, 0.06, 9000);
    TEX[key] = mkTex(c);
  };
  plank(26, 45, 24, 'wood'); plank(20, 40, 17, 'wood2b');
  { // herringbone
    const c = cnv(1024, 1024), g = c.getContext('2d'); g.fillStyle = '#2a170c'; g.fillRect(0, 0, 1024, 1024);
    const bw = 64, bl = 256;
    for (let row = -4; row < 20; row++) for (let col = -2; col < 10; col++) {
      const ox = col * bl, oy = row * bw * 2 + col * bw * 2;
      g.save(); g.translate(ox, oy); g.rotate(PI / 4); grainRect(g, 0, 0, bl, bw, hsl(22 + tr(-5, 5), 42, 19 + tr(-4, 4)), false); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; g.strokeRect(0, 0, bl, bw); g.restore();
      g.save(); g.translate(ox + bl * 0.707, oy + bl * 0.707); g.rotate(-PI / 4); grainRect(g, 0, -bw, bl, bw, hsl(22 + tr(-5, 5), 42, 19 + tr(-4, 4)), false); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; g.strokeRect(0, -bw, bl, bw); g.restore();
    }
    grime(g, 1024, 1024, 1.2); noiseLayer(g, 1024, 1024, 0.05, 8000); TEX.wood2 = mkTex(c);
  }
  { // marble checker
    const c = cnv(1024, 1024), g = c.getContext('2d'), n = 4, s = 1024 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const dark = (i + j) % 2; g.fillStyle = dark ? '#1b1c20' : '#cfc8bb'; g.fillRect(i * s, j * s, s, s);
      for (let v = 0; v < 7; v++) { g.strokeStyle = dark ? `rgba(160,160,170,${tr(0.05, 0.18)})` : `rgba(90,80,70,${tr(0.06, 0.2)})`; g.lineWidth = tr(0.6, 2.4); g.beginPath(); let x = i * s + texRng() * s, y = j * s; g.moveTo(x, y); while (y < (j + 1) * s) { x += tr(-14, 14); y += tr(8, 22); g.lineTo(x, y); } g.stroke(); }
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; g.strokeRect(i * s, j * s, s, s);
    }
    grime(g, 1024, 1024, 1.3); noiseLayer(g, 1024, 1024, 0.04); TEX.marble = mkTex(c);
  }
  { // flagstones
    const c = cnv(1024, 1024), g = c.getContext('2d'); g.fillStyle = '#1d1c1a'; g.fillRect(0, 0, 1024, 1024);
    let y = 0; while (y < 1024) { const h = tr(140, 220); let x = -tr(0, 150); while (x < 1024) { const w = tr(160, 300); const L = tr(24, 34); g.fillStyle = hsl(30 + tr(-10, 10), tr(4, 10), L); g.fillRect(x + 4, y + 4, w - 8, h - 8); for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(0,0,0,${tr(0.02, 0.09)})`; g.beginPath(); g.arc(x + texRng() * w, y + texRng() * h, tr(4, 26), 0, TAU); g.fill(); } x += w; } y += h; }
    grime(g, 1024, 1024, 2); noiseLayer(g, 1024, 1024, 0.09, 14000); TEX.stone = mkTex(c);
  }
  { // conservatory terracotta tiles
    const c = cnv(1024, 1024), g = c.getContext('2d'), n = 8, s = 1024 / n; g.fillStyle = '#2c241d'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const k = (i + j) % 2; g.fillStyle = k ? hsl(18 + tr(-3, 3), 45, 30 + tr(-4, 3)) : hsl(35, 18, 52 + tr(-5, 3)); g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
    for (let k = 0; k < 60; k++) { g.strokeStyle = `rgba(30,60,30,${tr(0.1, 0.3)})`; g.lineWidth = tr(1, 4); g.beginPath(); const x = texRng() * 1024, y = texRng() * 1024; g.moveTo(x, y); g.lineTo(x + tr(-60, 60), y + tr(-60, 60)); g.stroke(); }
    grime(g, 1024, 1024, 1.6); noiseLayer(g, 1024, 1024, 0.07); TEX.tile = mkTex(c);
  }
  { // kitchen small checker
    const c = cnv(1024, 1024), g = c.getContext('2d'), n = 16, s = 1024 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#202224' : hsl(45, 15, 72 + tr(-5, 3)); g.fillRect(i * s, j * s, s, s); g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeRect(i * s, j * s, s, s); }
    grime(g, 1024, 1024, 1.8); noiseLayer(g, 1024, 1024, 0.06); TEX.tile2 = mkTex(c);
  }
  { // concrete
    const c = cnv(512, 512), g = c.getContext('2d'); g.fillStyle = '#4a4744'; g.fillRect(0, 0, 512, 512); noiseLayer(g, 512, 512, 0.12, 20000, 3); grime(g, 512, 512, 2.5);
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.2; for (let k = 0; k < 5; k++) { g.beginPath(); let x = texRng() * 512, y = texRng() * 512; g.moveTo(x, y); for (let t = 0; t < 12; t++) { x += tr(-20, 20); y += tr(-20, 20); g.lineTo(x, y); } g.stroke(); }
    TEX.concrete = mkTex(c);
  }
  // ---- walls (texture = 2 m wide × 3 m tall) ----
  const wall = (key, paper, opt = {}) => {
    const c = cnv(512, 768), g = c.getContext('2d'), Hpx = 768, m = Hpx / 3; // px per meter = 256
    paper(g, 512, Hpx);
    // water stains & grime from the ceiling
    for (let k = 0; k < 5; k++) { const x = texRng() * 512, gr = g.createLinearGradient(0, 0, 0, tr(150, 420)); gr.addColorStop(0, `rgba(30,22,10,${tr(0.15, 0.35)})`); gr.addColorStop(1, 'rgba(30,22,10,0)'); g.fillStyle = gr; g.fillRect(x - tr(10, 60), 0, tr(20, 120), 420); }
    if (opt.wains !== false) { // wainscot panels (lower 1 m) + chair rail
      const top = Hpx - m * 1.0, wc = opt.wc || [24, 40, 20];
      grainRect(g, 0, top, 512, m * 1.0, hsl(wc[0], wc[1], wc[2]), false);
      for (let p = 0; p < 2; p++) { const x0 = p * 256 + 22, y0 = top + 34, w = 212, h = m * 1.0 - 80; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.strokeRect(x0, y0, w, h); g.strokeStyle = 'rgba(255,220,170,.10)'; g.lineWidth = 2; g.strokeRect(x0 + 5, y0 + 5, w - 10, h - 10); }
      g.fillStyle = hsl(wc[0], wc[1], wc[2] + 6); g.fillRect(0, top - 14, 512, 16); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, top + 1, 512, 3); g.fillStyle = 'rgba(255,230,190,.12)'; g.fillRect(0, top - 14, 512, 3);
      g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(0, Hpx - 26, 512, 26); // baseboard
    }
    // crown moulding
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, 512, 18); g.fillStyle = 'rgba(255,230,190,.08)'; g.fillRect(0, 18, 512, 3);
    noiseLayer(g, 512, Hpx, 0.05, 6000);
    TEX[key] = mkTex(c);
  };
  const damask = (bg, fg, fg2) => (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const tile = (cx, cy, s) => {
      g.save(); g.translate(cx, cy); g.fillStyle = fg;
      for (const sx of [1, -1]) { g.save(); g.scale(sx, 1); g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * 0.55, -s * 0.7, s * 0.2, -s * 0.2, s * 0.62, -s * 0.05); g.bezierCurveTo(s * 0.35, s * 0.25, s * 0.5, s * 0.65, 0, s); g.lineTo(0, -s); g.fill(); g.restore(); }
      g.fillStyle = fg2; g.beginPath(); g.ellipse(0, 0, s * 0.16, s * 0.3, 0, 0, TAU); g.fill();
      for (const sx of [1, -1]) { g.beginPath(); g.ellipse(sx * s * 0.35, -s * 0.55, s * 0.08, s * 0.16, sx * 0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(sx * s * 0.32, s * 0.55, s * 0.07, s * 0.14, -sx * 0.5, 0, TAU); g.fill(); }
      g.restore();
    };
    for (let y = 0; y < h + 128; y += 128) for (let x = 0; x <= w; x += 128) { tile(x + ((y / 128) % 2 ? 64 : 0), y, 46); }
    // fading + peeling seams
    for (let x = 0; x < w; x += 128) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, 0, 2, h); }
  };
  wall('w_damask', damask('#2e4a45', 'rgba(190,170,110,.3)', 'rgba(190,170,110,.38)'));
  wall('w_damask2', damask('#55282c', 'rgba(210,160,100,.24)', 'rgba(210,160,100,.32)'), { wc: [18, 38, 18] });
  wall('w_red', damask('#622022', 'rgba(20,0,0,.3)', 'rgba(220,170,100,.2)'), { wc: [16, 42, 16] });
  wall('w_green', (g, w, h) => { g.fillStyle = '#2e4438'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(150,170,120,.10)'; g.fillRect(x, 0, 22, h); g.fillStyle = 'rgba(210,190,120,.14)'; g.fillRect(x + 30, 0, 3, h); } }, { wc: [26, 30, 15] });
  wall('w_nursery', (g, w, h) => {
    g.fillStyle = '#5f6a70'; g.fillRect(0, 0, w, h);
    for (let y = 30; y < h; y += 90) for (let x = 20; x < w; x += 90) { const ox = x + ((y / 90) | 0) % 2 * 45; g.fillStyle = 'rgba(230,220,180,.22)'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - HP, r = k % 2 ? 6 : 15; g.lineTo(ox + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
    // peeling strips
    for (let k = 0; k < 4; k++) { const x = texRng() * w, y = tr(40, 380); g.fillStyle = 'rgba(200,190,170,.25)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y + 10); g.lineTo(x + 18, y + tr(80, 160)); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 2, y + 2, 38, 3); }
  }, { wc: [35, 18, 38] });
  wall('w_panel', (g, w, h) => {
    grainRect(g, 0, 0, w, h, '#4e3020', true);
    for (let p = 0; p < 2; p++) for (let q = 0; q < 2; q++) { const x0 = p * 256 + 26, y0 = 40 + q * 230, ww = 204, hh = 200; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 6; g.strokeRect(x0, y0, ww, hh); g.strokeStyle = 'rgba(255,210,150,.12)'; g.lineWidth = 2; g.strokeRect(x0 + 8, y0 + 8, ww - 16, hh - 16); }
  }, { wc: [20, 45, 14] });
  wall('w_plaster', (g, w, h) => { g.fillStyle = '#6a6458'; g.fillRect(0, 0, w, h); noiseLayer(g, w, h, 0.12, 9000, 4); grime(g, w, h, 3); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(70,60,50,.4)'; g.beginPath(); g.ellipse(texRng() * w, texRng() * h, tr(10, 40), tr(6, 20), texRng() * 3, 0, TAU); g.fill(); } }, { wains: false });
  wall('w_tilewall', (g, w, h) => {
    g.fillStyle = '#9a958a'; g.fillRect(0, 0, w, h);
    const top = h - 256 * 1.4; for (let y = top; y < h; y += 32) for (let x = -32 + ((y / 32) | 0) % 2 * 32; x < w; x += 64) { g.fillStyle = hsl(45, 12, 78 + tr(-6, 3)); g.fillRect(x + 2, y + 2, 60, 28); }
    grime(g, w, h, 2.2);
  }, { wains: false });
  wall('w_stone', (g, w, h) => {
    g.fillStyle = '#242220'; g.fillRect(0, 0, w, h);
    let y = 0, row = 0; while (y < h) { const bh = tr(60, 90); let x = row % 2 ? -60 : 0; while (x < w) { const bw = tr(100, 170); g.fillStyle = hsl(30, tr(3, 9), tr(22, 33)); g.fillRect(x + 3, y + 3, bw - 6, bh - 6); x += bw; } y += bh; row++; }
    noiseLayer(g, w, h, 0.1, 12000, 3); grime(g, w, h, 2);
  }, { wains: false });
  wall('w_conserv', (g, w, h) => { g.fillStyle = '#4c524b'; g.fillRect(0, 0, w, h); noiseLayer(g, w, h, 0.08, 6000, 3); for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(30,60,25,${tr(0.25, 0.5)})`; g.lineWidth = tr(2, 5); g.beginPath(); let x = texRng() * w, y = h; g.moveTo(x, y); for (let t = 0; t < 18; t++) { x += tr(-18, 18); y -= tr(14, 30); g.lineTo(x, y); } g.stroke(); } }, { wc: [90, 8, 26] });
  wall('w_ext', (g, w, h) => { // dark brick
    g.fillStyle = '#1a1210'; g.fillRect(0, 0, w, h);
    for (let y = 0, r = 0; y < h; y += 32, r++) for (let x = r % 2 ? -32 : 0; x < w; x += 64) { g.fillStyle = hsl(12 + tr(-4, 4), 30, tr(14, 22)); g.fillRect(x + 2, y + 2, 60, 28); }
    grime(g, w, h, 2);
  }, { wains: false });

  // ---- rugs ----
  const rug = (key, w, h, draw) => { const c = cnv(w, h), g = c.getContext('2d'); draw(g, w, h); noiseLayer(g, w, h, 0.08, 9000, 2); grime(g, w, h, 0.8); TEX[key] = mkTex(c, 1, 1); TEX[key].wrapS = TEX[key].wrapT = THREE.ClampToEdgeWrapping; };
  const persian = (c1, c2, c3, c4) => (g, w, h) => {
    g.fillStyle = c1; g.fillRect(0, 0, w, h);
    const b = Math.min(w, h) * 0.09; g.fillStyle = c2; g.fillRect(b * 0.4, b * 0.4, w - b * 0.8, h - b * 0.8); g.fillStyle = c1; g.fillRect(b, b, w - b * 2, h - b * 2);
    for (let x = b * 0.6; x < w - b * 0.6; x += 22) { g.fillStyle = c3; g.beginPath(); g.moveTo(x, b * 0.55); g.lineTo(x + 8, b * 0.7); g.lineTo(x, b * 0.85); g.lineTo(x - 8, b * 0.7); g.fill(); g.beginPath(); g.moveTo(x, h - b * 0.55); g.lineTo(x + 8, h - b * 0.7); g.lineTo(x, h - b * 0.85); g.lineTo(x - 8, h - b * 0.7); g.fill(); }
    // field of small repeating florets
    for (let y = b * 1.4; y < h - b * 1.2; y += 26) for (let x = b * 1.4; x < w - b * 1.2; x += 26) { g.globalAlpha = 0.35; g.fillStyle = (x + y) % 52 < 26 ? c2 : c3; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); for (let q = 0; q < 4; q++) { g.beginPath(); g.ellipse(x + Math.cos(q * HP) * 6, y + Math.sin(q * HP) * 6, 3, 1.6, q * HP, 0, TAU); g.fill(); } } g.globalAlpha = 1;
    g.save(); g.translate(w / 2, h / 2); const R = Math.min(w, h) * 0.34, sx = w / h > 1 ? 1.45 : 1;
    const lobe = (rad, n, amp, col) => { g.fillStyle = col; g.beginPath(); for (let a = 0; a <= 96; a++) { const ang = a / 96 * TAU, r2 = rad * (1 + Math.cos(ang * n) * amp); g.lineTo(Math.cos(ang) * r2 * sx, Math.sin(ang) * r2); } g.fill(); };
    lobe(R, 8, 0.1, c2); lobe(R * 0.86, 8, 0.1, c1); lobe(R * 0.7, 16, 0.06, c3); lobe(R * 0.6, 8, 0.08, c2); lobe(R * 0.42, 12, 0.08, c1); lobe(R * 0.3, 6, 0.12, c3); lobe(R * 0.14, 6, 0.1, c4);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.fillStyle = c4; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(Math.cos(a) * R * 0.5 * sx, Math.sin(a) * R * 0.5, 6, 3, a, 0, TAU); g.fill(); } g.globalAlpha = 1;
    g.restore();
    // corner spandrels
    for (const [cx, cy] of [[b, b], [w - b, b], [b, h - b], [w - b, h - b]]) { g.fillStyle = c2; g.globalAlpha = 0.8; g.beginPath(); g.arc(cx, cy, Math.min(w, h) * 0.09, 0, TAU); g.fill(); g.fillStyle = c3; g.globalAlpha = 0.6; g.beginPath(); g.arc(cx, cy, Math.min(w, h) * 0.05, 0, TAU); g.fill(); } g.globalAlpha = 1;
    // wear
    for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(200,180,150,.06)'; g.beginPath(); g.ellipse(texRng() * w, texRng() * h, tr(10, 50), tr(4, 18), texRng() * 3, 0, TAU); g.fill(); }
  };
  rug('r_persian', 768, 576, persian('#4a1414', '#1c2438', '#9a7a44', '#c8b48e'));
  rug('r_persian2', 768, 576, persian('#1e3028', '#4a1c1c', '#9a8044', '#cfc0a0'));
  rug('r_runner', 1024, 64, (g, w, h) => { g.fillStyle = '#4d1214'; g.fillRect(0, 0, w, h); g.fillStyle = '#b38a3c'; g.fillRect(0, 6, w, 3); g.fillRect(0, h - 9, w, 3); for (let x = 0; x < w; x += 32) { g.fillStyle = '#1a2340'; g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x + 10, h / 2 - 12); g.lineTo(x + 20, h / 2); g.lineTo(x + 10, h / 2 + 12); g.fill(); } });
  rug('r_runnerRed', 128, 512, (g, w, h) => { g.fillStyle = '#5a0d10'; g.fillRect(0, 0, w, h); g.fillStyle = '#c09040'; g.fillRect(8, 0, 4, h); g.fillRect(w - 12, 0, 4, h); });
  rug('r_round', 256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let k = 10; k > 0; k--) { g.fillStyle = ['#6d7f8a', '#a99a7a', '#7f6a7a', '#8a9a7a'][k % 4]; g.beginPath(); g.arc(w / 2, h / 2, w / 2 * k / 10, 0, TAU); g.fill(); } });
  rug('r_woven', 256, 256, (g, w, h) => { for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.fillStyle = (x / 8 + y / 8) % 2 ? '#6b5a3a' : '#57482c'; g.fillRect(x, y, 8, 8); } });

  // ---- generic material textures ----
  { const c = cnv(512, 512), g = c.getContext('2d'); grainRect(g, 0, 0, 512, 512, '#8a6a4a', true); TEX.grain = mkTex(c); }
  { const c = cnv(256, 256), g = c.getContext('2d'); g.fillStyle = '#888'; g.fillRect(0, 0, 256, 256); noiseLayer(g, 256, 256, 0.15, 8000, 2); TEX.fabric = mkTex(c, 2, 2); }
  { // book spines
    const c = cnv(512, 128), g = c.getContext('2d'); let x = 0;
    while (x < 512) { const w = tr(9, 22), h = tr(80, 124); const hue = [0, 15, 30, 120, 200, 220, 40, 350][Math.floor(texRng() * 8)]; g.fillStyle = hsl(hue, tr(25, 55), tr(14, 32)); g.fillRect(x, 128 - h, w - 1, h); g.fillStyle = 'rgba(210,180,100,.5)'; g.fillRect(x + 1, 128 - h + 10, w - 3, 2); g.fillRect(x + 1, 128 - h + 18, w - 3, 1); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + w - 2, 128 - h, 1, h); x += w; if (texRng() < 0.06) x += tr(10, 30); }
    TEX.books = mkTex(c);
  }
  // paintings (dim, oil-like)
  TEX.paint = [];
  for (let p = 0; p < 6; p++) {
    const c = cnv(256, 320), g = c.getContext('2d'), kind = p % 3;
    const bg = g.createLinearGradient(0, 0, 0, 320); bg.addColorStop(0, hsl(tr(15, 40), 30, tr(10, 18))); bg.addColorStop(1, hsl(tr(15, 40), 25, tr(4, 9))); g.fillStyle = bg; g.fillRect(0, 0, 256, 320);
    if (kind === 0 || kind === 1) { // portrait
      g.fillStyle = hsl(20, 25, 9); g.beginPath(); g.ellipse(128, 300, 100, 120, 0, 0, TAU); g.fill();
      g.fillStyle = kind ? hsl(350, 30, 16) : hsl(210, 20, 14); g.beginPath(); g.ellipse(128, 290, 82, 100, 0, PI, TAU); g.fill();
      g.fillStyle = hsl(28, 30, tr(40, 52)); g.beginPath(); g.ellipse(128, 140, 40, 52, 0, 0, TAU); g.fill();
      g.fillStyle = hsl(20, 20, 10); g.beginPath(); g.ellipse(128, 108, 46, 34, 0, PI, TAU); g.fill(); if (kind) { g.beginPath(); g.ellipse(90, 160, 16, 60, 0.15, 0, TAU); g.ellipse(166, 160, 16, 60, -0.15, 0, TAU); g.fill(); }
      // eyes (unsettling: plain dark)
      g.fillStyle = 'rgba(0,0,0,.75)'; g.beginPath(); g.ellipse(113, 142, 6, 4, 0, 0, TAU); g.ellipse(143, 142, 6, 4, 0, 0, TAU); g.fill();
    } else { // dark landscape
      g.fillStyle = hsl(220, 15, 14); g.fillRect(0, 0, 256, 190); g.fillStyle = hsl(40, 30, 55); g.beginPath(); g.arc(190, 70, 16, 0, TAU); g.fill();
      g.fillStyle = hsl(100, 15, 8); g.beginPath(); g.moveTo(0, 210); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 190 - Math.sin(x * 0.03 + p) * 20 - texRng() * 10); g.lineTo(256, 320); g.lineTo(0, 320); g.fill();
      g.fillStyle = hsl(20, 10, 5); g.fillRect(70, 150, 40, 50); g.beginPath(); g.moveTo(64, 152); g.lineTo(90, 120); g.lineTo(116, 152); g.fill();
    }
    for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(${texRng() < 0.5 ? '0,0,0' : '255,230,180'},${texRng() * 0.06})`; g.fillRect(texRng() * 256, texRng() * 320, tr(1, 5), tr(1, 2)); }
    const v = g.createRadialGradient(128, 160, 60, 128, 160, 220); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = v; g.fillRect(0, 0, 256, 320);
    const t = mkTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; TEX.paint.push(t);
  }
  // decals: handprint, frost, rune glyphs, glow dot
  {
    const c = cnv(256, 256), g = c.getContext('2d'); g.clearRect(0, 0, 256, 256);
    const hand = (ox, oy, rot, s) => { g.save(); g.translate(ox, oy); g.rotate(rot); g.scale(s, s); g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(0, 18, 26, 30, 0, 0, TAU); g.fill(); const fx = [[-22, -18, 8, 26, -0.35], [-9, -32, 7, 30, -0.1], [5, -34, 7, 31, 0.05], [18, -26, 7, 26, 0.2], [30, 10, 7, 20, 0.9]]; for (const [x, y, rx, ry, a] of fx) { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); } g.restore(); };
    hand(90, 120, -0.2, 1.2); hand(170, 140, 0.25, 1.05);
    const id = g.getImageData(0, 0, 256, 256); for (let i = 3; i < id.data.length; i += 4) id.data[i] *= 0.55 + texRng() * 0.45; g.putImageData(id, 0, 0);
    TEX.hand = mkTex(c); TEX.hand.wrapS = TEX.hand.wrapT = THREE.ClampToEdgeWrapping;
  }
  {
    const c = cnv(256, 256), g = c.getContext('2d'); g.clearRect(0, 0, 256, 256);
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 125); gr.addColorStop(0, 'rgba(220,240,255,.8)'); gr.addColorStop(0.6, 'rgba(200,230,255,.45)'); gr.addColorStop(1, 'rgba(200,230,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 90; k++) { const a = texRng() * TAU, r0 = texRng() * 90; let x = 128 + Math.cos(a) * r0, y = 128 + Math.sin(a) * r0; g.lineWidth = tr(0.5, 1.6); g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4; s++) { const b = a + tr(-1, 1); x += Math.cos(b) * tr(5, 14); y += Math.sin(b) * tr(5, 14); g.lineTo(x, y); } g.stroke(); }
    TEX.frost = mkTex(c); TEX.frost.wrapS = TEX.frost.wrapT = THREE.ClampToEdgeWrapping;
  }
  {
    const c = cnv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); TEX.glow = mkTex(c); TEX.glow.wrapS = TEX.glow.wrapT = THREE.ClampToEdgeWrapping;
  }
  { // soft beam gradient (for light shafts / volumetric cone)
    const c = cnv(64, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    TEX.shaft = mkTex(c, 1, 1, false); TEX.shaft.wrapS = TEX.shaft.wrapT = THREE.ClampToEdgeWrapping;
  }
  TEX.glyph = GLYPHS.map(gl => { const c = cnv(128, 128), g = c.getContext('2d'); g.clearRect(0, 0, 128, 128); g.fillStyle = '#fff'; g.font = 'bold 96px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#fff'; g.shadowBlur = 12; g.fillText(gl, 64, 70); const t = mkTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; });
  { // ghost figure for mirrors
    const c = cnv(128, 256), g = c.getContext('2d'); g.clearRect(0, 0, 128, 256);
    const gr = g.createLinearGradient(0, 40, 0, 256); gr.addColorStop(0, 'rgba(220,235,255,.85)'); gr.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = gr;
    g.beginPath(); g.ellipse(64, 52, 20, 26, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(40, 70); g.quadraticCurveTo(64, 60, 88, 70); g.lineTo(104, 250); g.lineTo(24, 250); g.closePath(); g.fill();
    g.fillStyle = 'rgba(10,10,20,.9)'; g.beginPath(); g.moveTo(42, 40); g.quadraticCurveTo(64, 20, 86, 40); g.lineTo(92, 140); g.lineTo(80, 70); g.lineTo(48, 70); g.lineTo(36, 140); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.95)'; g.beginPath(); g.ellipse(56, 54, 4, 6, 0, 0, TAU); g.ellipse(72, 54, 4, 6, 0, 0, TAU); g.fill();
    TEX.mirrorGhost = mkTex(c); TEX.mirrorGhost.wrapS = TEX.mirrorGhost.wrapT = THREE.ClampToEdgeWrapping;
  }
  { // outside ground (wet grass + gravel path)
    const c = cnv(512, 512), g = c.getContext('2d'); g.fillStyle = '#121812'; g.fillRect(0, 0, 512, 512);
    for (let k = 0; k < 9000; k++) { g.fillStyle = hsl(tr(80, 120), tr(15, 35), tr(5, 16)); g.fillRect(texRng() * 512, texRng() * 512, 1, tr(2, 6)); }
    grime(g, 512, 512, 2); TEX.grass = mkTex(c, 14, 14);
    const c2 = cnv(256, 256), g2 = c2.getContext('2d'); g2.fillStyle = '#262422'; g2.fillRect(0, 0, 256, 256); for (let k = 0; k < 3000; k++) { g2.fillStyle = hsl(30, 8, tr(10, 34)); g2.beginPath(); g2.arc(texRng() * 256, texRng() * 256, tr(1, 3), 0, TAU); g2.fill(); } TEX.gravel = mkTex(c2, 1, 6);
  }
}

/* ---------- materials ---------- */
const MAT = {};
const MATC = new Map();
/* every static-environment material gets the cut-away patch so walls between camera and players dissolve */
const CUT = { uP0: { value: new THREE.Vector3(0, -99, 0) }, uP1: { value: new THREE.Vector3(0, -99, 0) }, uCam: { value: new THREE.Vector3() }, uR: { value: 2.2 } };
function cutaway(m) {
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, CUT);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos; uniform vec3 uP0; uniform vec3 uP1; uniform vec3 uCam; uniform float uR;
float cutF(vec3 P){ vec3 a = uCam, d = P - uCam; float L = length(d); d /= L;
  vec3 w = vWPos - a; float t = dot(w, d); if (t > L - 0.55 || t < 0.0) return 0.0;
  float r = length(w - d * t); float k = 1.0 - smoothstep(uR * 0.62, uR, r); return k; }
float dith(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (vWPos.y > 0.95) { float k = max(cutF(uP0), cutF(uP1)) * smoothstep(0.95, 1.25, vWPos.y); if (k > 0.0 && dith(gl_FragCoord.xy) < k) discard; }`);
  };
  m.customProgramCacheKey = () => 'cut';
  return m;
}
function stdMat(o, key, cut = true) {
  if (key && MATC.has(key)) return MATC.get(key);
  const m = new THREE.MeshStandardMaterial(o); if (cut) cutaway(m); if (key) MATC.set(key, m); return m;
}
/* shorthand: colored wood / painted / metal etc (cached by key) */
const M = {
  wood: (c = 0x4a2c18, r = 0.62) => stdMat({ color: c, map: TEX.grain, roughness: r, bumpMap: TEX.grain, bumpScale: 0.6 }, 'wood' + c + r),
  paint: (c, r = 0.75) => stdMat({ color: c, roughness: r }, 'paint' + c + r),
  metal: (c = 0x8a7a5a, r = 0.38, me = 0.85) => stdMat({ color: c, roughness: r, metalness: me }, 'metal' + c + r + me),
  fabric: (c, r = 0.95) => stdMat({ color: c, map: TEX.fabric, roughness: r }, 'fab' + c),
  glow: (c, k = 2) => stdMat({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.6 }, 'glow' + c + k, false),
  glass: (c = 0x8aa0b0, o = 0.28) => { const k = 'glass' + c + o; if (MATC.has(k)) return MATC.get(k); const m = cutaway(new THREE.MeshStandardMaterial({ color: c, roughness: 0.08, metalness: 0.3, transparent: true, opacity: o, depthWrite: false })); MATC.set(k, m); return m; },
  ceramic: (c = 0xd8d2c4) => stdMat({ color: c, roughness: 0.25 }, 'cer' + c),
  books: () => stdMat({ map: TEX.books, roughness: 0.85 }, 'books'),
};
function buildMaterials() {
  const floor = k => stdMat({ map: TEX[k], roughness: k === 'marble' ? 0.28 : k === 'tile2' ? 0.35 : 0.72, bumpMap: TEX[k], bumpScale: 1.2, metalness: 0 }, 'floor' + k, false);
  MAT.floor = { wood: floor('wood'), wood2: floor('wood2'), marble: floor('marble'), stone: floor('stone'), tile: floor('tile'), tile2: floor('tile2'), concrete: floor('concrete') };
  MAT.wall = {};
  for (const k of ['damask', 'damask2', 'red', 'green', 'nursery', 'panel', 'plaster', 'tilewall', 'stone', 'conserv', 'ext']) MAT.wall[k] = stdMat({ map: TEX['w_' + k], roughness: 0.86, bumpMap: TEX['w_' + k], bumpScale: 0.9 }, 'wall' + k);
  MAT.wallTop = stdMat({ color: 0x0b0908, roughness: 1 }, 'walltop');
  MAT.trim = M.wood(0x2e1a0e, 0.55);
  MAT.rug = {};
  for (const k of ['persian', 'persian2', 'runner', 'runnerRed', 'round', 'woven']) MAT.rug[k] = stdMat({ map: TEX['r_' + k], roughness: 1, transparent: k === 'round', alphaTest: k === 'round' ? 0.5 : 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, 'rug' + k, false);
  MAT.paint = TEX.paint.map((t, i) => stdMat({ map: t, roughness: 0.55 }, 'pt' + i));
  MAT.shadowOnly = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  MAT.grass = new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 0.95, color: 0x8899aa });
  MAT.gravel = new THREE.MeshStandardMaterial({ map: TEX.gravel, roughness: 0.9 });
}
