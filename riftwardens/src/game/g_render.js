/* =================== rendering =================== */
const cv = $('cv'); const ctx = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1;
const LAYER = {floor: null, walls: null, mini: null, FS: 1.5, id: ''};
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  CAM.baseZ = clamp(Math.min(VW / (17 * T), VH / (10.5 * T)), 0.62, 1.5);
  if (IS_TOUCH) CAM.baseZ = clamp(Math.min(VW / (14 * T), VH / (9 * T)), 0.6, 1.4);
  if (!CAM.over) CAM.z = CAM.baseZ;
}
window.addEventListener('resize', resize);

/* ---------- map prerender ---------- */
function hashStr(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function prerenderMap() {
  const m = G.map, FS = LAYER.FS, W = m.w * T, H = m.h * T;
  const R = mulberry(hashStr(m.id));
  const fl = document.createElement('canvas'); fl.width = Math.ceil(W * FS); fl.height = Math.ceil(H * FS);
  const g = fl.getContext('2d'); g.scale(FS, FS);
  g.fillStyle = '#100d12'; g.fillRect(0, 0, W, H);
  const t = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? TW : m.t[y * m.w + x];
  const isFloorish = v => v === TF || v === TD || v === TO;
  const lavaAny = m.t.includes(TL);
  // flagstones
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const v = t(x, y), X = x * T, Y = y * T;
    if (isFloorish(v)) {
      g.fillStyle = '#1a1612'; g.fillRect(X, Y, T, T);
      const lay = R() * 4 | 0; const rects = lay === 0 ? [[0, 0, T, T]] : lay === 1 ? [[0, 0, T / 2, T], [T / 2, 0, T / 2, T]] : lay === 2 ? [[0, 0, T, T / 2], [0, T / 2, T, T / 2]] : [[0, 0, T / 2, T / 2], [T / 2, 0, T / 2, T / 2], [0, T / 2, T / 2, T / 2], [T / 2, T / 2, T / 2, T / 2]];
      for (const [rx, ry, rw, rh] of rects) {
        const L = 30 + R() * 9, hue = 28 + R() * 18, sat = 8 + R() * 8;
        const gr = g.createLinearGradient(X + rx, Y + ry, X + rx + rw, Y + ry + rh);
        gr.addColorStop(0, `hsl(${hue},${sat}%,${L + 5}%)`); gr.addColorStop(1, `hsl(${hue},${sat}%,${L - 4}%)`);
        g.fillStyle = gr; rrect(g, X + rx + 1.5, Y + ry + 1.5, rw - 3, rh - 3, 4); g.fill();
        g.strokeStyle = 'rgba(255,240,210,.07)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X + rx + 3, Y + ry + rh - 3); g.lineTo(X + rx + 3, Y + ry + 3); g.lineTo(X + rx + rw - 3, Y + ry + 3); g.stroke();
        if (R() < 0.25) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); let cx = X + rx + R() * rw, cy = Y + ry + R() * rh; g.moveTo(cx, cy); for (let k = 0; k < 3; k++) { cx += (R() - 0.5) * 14; cy += (R() - 0.5) * 14; g.lineTo(clamp(cx, X + rx + 2, X + rx + rw - 2), clamp(cy, Y + ry + 2, Y + ry + rh - 2)); } g.stroke(); }
      }
      for (let k = 0; k < 3; k++) { g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,230,200,.05)'; g.beginPath(); g.arc(X + R() * T, Y + R() * T, 0.8 + R() * 1.6, 0, TAU); g.fill(); }
      // moss near walls
      const nearW = t(x, y - 1) === TW || t(x - 1, y) === TW || t(x + 1, y) === TW;
      if (nearW && R() < 0.5) for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${70 + R() * 30 | 0},${100 + R() * 40 | 0},50,${0.12 + R() * 0.12})`; g.beginPath(); g.arc(X + R() * T, Y + (t(x, y - 1) === TW ? R() * 10 : R() * T), 1.5 + R() * 3, 0, TAU); g.fill(); }
    } else if (v === TP) {
      const gr = g.createRadialGradient(X + T / 2, Y + T / 2, 4, X + T / 2, Y + T / 2, T);
      gr.addColorStop(0, '#0a0712'); gr.addColorStop(1, '#030205'); g.fillStyle = gr; g.fillRect(X, Y, T, T);
      if (R() < 0.3) { g.fillStyle = 'rgba(120,60,200,.06)'; g.beginPath(); g.arc(X + R() * T, Y + R() * T, 6 + R() * 10, 0, TAU); g.fill(); }
    } else if (v === TL) {
      g.fillStyle = '#b8330c'; g.fillRect(X, Y, T, T);
      for (let k = 0; k < 4; k++) { const gr = g.createRadialGradient(X + R() * T, Y + R() * T, 1, X + R() * T, Y + R() * T, 10 + R() * 14); gr.addColorStop(0, 'rgba(255,200,60,.9)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(X, Y, T, T); }
      for (let k = 0; k < 7; k++) { g.fillStyle = `rgba(${50 + R() * 30 | 0},12,4,${0.25 + R() * 0.25})`; g.beginPath(); g.arc(X + R() * T, Y + R() * T, 3 + R() * 7, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(255,230,120,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X + R() * T, Y); g.quadraticCurveTo(X + R() * T, Y + T / 2, X + R() * T, Y + T); g.stroke();
    }
  }
  // cliffs (pit / lava edges facing south of floor) and shadows
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const v = t(x, y), X = x * T, Y = y * T;
    if ((v === TP || v === TL) && isFloorish(t(x, y - 1))) {
      const h = v === TP ? 22 : 12; const gr = g.createLinearGradient(0, Y, 0, Y + h);
      gr.addColorStop(0, '#4a4036'); gr.addColorStop(0.35, '#2e2620'); gr.addColorStop(1, v === TP ? 'rgba(5,4,8,0)' : 'rgba(80,20,4,0)');
      g.fillStyle = gr; g.fillRect(X, Y, T, h);
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(X, Y + k * 5); g.lineTo(X + T, Y + k * 5 + (R() - 0.5) * 2); g.stroke(); }
    }
    if ((v === TP || v === TL)) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1]]) if (isFloorish(t(x + dx, y + dy))) {
        g.fillStyle = v === TL ? 'rgba(255,190,80,.5)' : 'rgba(0,0,0,.6)';
        if (dx) g.fillRect(dx < 0 ? X : X + T - 3, Y, 3, T); else g.fillRect(X, Y + T - 3, T, 3);
      }
    }
    if (isFloorish(v)) {
      if (t(x, y - 1) === TW) { const gr = g.createLinearGradient(0, Y, 0, Y + 26); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X, Y, T, 26); }
      if (t(x - 1, y) === TW) { const gr = g.createLinearGradient(X, 0, X + 12, 0); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X, Y, 12, T); }
      if (t(x + 1, y) === TW) { const gr = g.createLinearGradient(X + T, 0, X + T - 12, 0); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X + T - 12, Y, 12, T); }
    }
  }
  // gate & rift floor glyphs
  for (const gt of m.gates) glyph(g, tc(gt.x), tc(gt.y), 40, '#ff4a2a', R);
  for (const rf of m.rifts) glyph(g, tc(rf.x), tc(rf.y), 46, '#56c8ff', R);
  // big soft grime
  for (let k = 0; k < m.w * m.h / 6; k++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); const x = R() * W, y = R() * H, r = 20 + R() * 60; g.save(); g.translate(x, y); g.scale(r, r); gr.addColorStop(0, 'rgba(0,0,0,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore(); }

  // ---- walls (single canvas; row band y covers [yT-WH, (y+1)T-WH) ) ----
  const wl = document.createElement('canvas'); wl.width = Math.ceil(W * FS); wl.height = Math.ceil((H + WH) * FS);
  const w = wl.getContext('2d'); w.scale(FS, FS); w.translate(0, WH);
  const nearOpen = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (t(x + dx, y + dy) !== TW) return true; return false; };
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (t(x, y) !== TW) continue;
    const X = x * T, Y = y * T - WH;
    if (!nearOpen(x, y)) { // deep rock
      w.fillStyle = '#0f0d12'; w.fillRect(X, Y, T, T);
      if (R() < 0.4) { w.fillStyle = 'rgba(255,255,255,.025)'; w.fillRect(X + R() * 30, Y + R() * 30, 6 + R() * 12, 4 + R() * 8); }
      if (t(x, y + 1) !== TW) drawFace(w, X, (y + 1) * T - WH, R);
      continue;
    }
    // cap: continuous running-bond masonry (world-aligned), cool slate tones
    w.save(); w.beginPath(); w.rect(X, Y, T, T); w.clip();
    w.fillStyle = '#17151c'; w.fillRect(X, Y, T, T);
    const BH = 12, BW = 24;
    for (let r = 0; r < T / BH; r++) {
      const gy = y * (T / BH) + r, off = (gy % 2) * (BW / 2);
      for (let bx = -BW + off; bx < T; bx += BW) {
        const gx = x * T + bx, hsh = mulberry(gx * 7919 + gy * 104729)();
        const L = 24 + hsh * 9;
        w.fillStyle = `hsl(${232 + hsh * 20},${9 + hsh * 6}%,${L}%)`; w.fillRect(X + bx + 1, Y + r * BH + 1, BW - 2, BH - 2);
        w.fillStyle = 'rgba(255,255,255,.07)'; w.fillRect(X + bx + 1, Y + r * BH + 1, BW - 2, 2);
        w.fillStyle = 'rgba(0,0,0,.22)'; w.fillRect(X + bx + 1, Y + r * BH + BH - 3, BW - 2, 2);
      }
    }
    w.restore();
    // rims toward open sides: light stone lip
    w.fillStyle = 'rgba(205,200,220,.55)';
    if (t(x, y - 1) !== TW) w.fillRect(X, Y, T, 3);
    if (t(x, y + 1) !== TW) w.fillRect(X, Y + T - 3, T, 3);
    if (t(x - 1, y) !== TW) w.fillRect(X, Y, 3, T);
    if (t(x + 1, y) !== TW) w.fillRect(X + T - 3, Y, 3, T);
    if (t(x, y + 1) !== TW) drawFace(w, X, (y + 1) * T - WH, R);
  }
  for (const d of m.doors || []) if (t(d.x, d.y) === TW) { const X = d.x * T, Y = d.y * T - WH; w.fillStyle = '#2a1a10'; w.fillRect(X + 2, Y + 2, T - 4, T + WH - 4); w.fillStyle = '#7a7f88'; for (let i = 0; i < 5; i++) w.fillRect(X + 5 + i * 9, Y + 2, 3, T + WH - 4); w.fillRect(X + 2, Y + 14, T - 4, 3); w.fillRect(X + 2, Y + T, T - 4, 3); }
  LAYER.floor = fl; LAYER.walls = wl; LAYER.id = m.id;
  // minimap base
  const ms = 4, mm = document.createElement('canvas'); mm.width = m.w * ms; mm.height = m.h * ms; const mg = mm.getContext('2d');
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const v = t(x, y); mg.fillStyle = v === TW ? (nearOpen(x, y) ? '#3a3542' : 'rgba(0,0,0,0)') : v === TP ? '#050408' : v === TL ? '#b8400f' : '#6b6152'; mg.fillRect(x * ms, y * ms, ms, ms); }
  LAYER.mini = mm; LAYER.ms = ms;
  const mc = $('mini'); mc.width = m.w * ms; mc.height = m.h * ms; const mf = PHONE.matches ? 0.45 : 0.75; mc.style.width = (m.w * ms * mf | 0) + 'px'; mc.style.height = (m.h * ms * mf | 0) + 'px';
  // static light list
  m.lights = [];
  for (const tq of m.torches) if (t(tq.x, tq.y + 1) !== TW) m.lights.push({x: tc(tq.x), y: (tq.y + 1) * T - WH * 0.5, r: 190, c: '255,170,80', f: 1, torch: 1});
  for (const d of m.decor) if (d.k === 'brazier') m.lights.push({x: tc(d.x), y: tc(d.y) - 20, r: 230, c: '255,150,60', f: 1});
  for (const r of m.rifts) m.lights.push({x: tc(r.x), y: tc(r.y) - 20, r: 260, c: '90,190,255', f: 0, rift: 1});
  for (const gt of m.gates) m.lights.push({x: tc(gt.x), y: tc(gt.y), r: 200, c: '255,70,40', f: 0});
  if (lavaAny) for (let y = 0; y < m.h; y += 3) for (let x = 0; x < m.w; x += 3) { let n = 0; for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) if (t(x + dx, y + dy) === TL) n++; if (n >= 3) m.lights.push({x: (x + 1.5) * T, y: (y + 1.5) * T, r: 150, c: '255,110,30', f: 0.3}); }
}
function drawFace(w, X, Y, R) {
  const gr = w.createLinearGradient(0, Y, 0, Y + WH); gr.addColorStop(0, '#3e3a47'); gr.addColorStop(1, '#221f28');
  w.fillStyle = gr; w.fillRect(X, Y, T, WH);
  w.strokeStyle = 'rgba(0,0,0,.45)'; w.lineWidth = 1;
  for (let r = 0; r < 2; r++) { const yy = Y + r * 12; w.beginPath(); w.moveTo(X, yy + 0.5); w.lineTo(X + T, yy + 0.5); w.stroke(); const off = (r % 2) * 12 + (R() * 4 | 0); for (let bx = off; bx < T; bx += 24) { w.beginPath(); w.moveTo(X + bx + 0.5, yy); w.lineTo(X + bx + 0.5, yy + 12); w.stroke(); } }
  w.fillStyle = 'rgba(255,240,220,.06)'; w.fillRect(X, Y + 1, T, 2);
  w.fillStyle = 'rgba(0,0,0,.5)'; w.fillRect(X, Y + WH - 3, T, 3);
}
function glyph(g, x, y, r, col, R) {
  g.save(); g.translate(x, y); g.globalAlpha = 0.55; g.strokeStyle = col; g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r - 7, 0, TAU); g.stroke();
  for (let k = 0; k < 8; k++) { const a = k * TAU / 8; g.save(); g.rotate(a); g.beginPath(); g.moveTo(r - 6, 0); g.lineTo(r - 1, -3); g.lineTo(r - 1, 3); g.closePath(); g.fillStyle = col; g.fill(); g.restore(); }
  g.globalAlpha = 0.18; g.fillStyle = col; g.beginPath(); g.arc(0, 0, r - 7, 0, TAU); g.fill(); g.restore();
}
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* ---------- client-side view of world (host = G directly, guest = mirrored) ---------- */
// VIEW provides lists to draw: enemies, traps, projs, drops (host: from G; guest: CL)
const CL = {enemies: new Map(), projs: [], drops: [], traps: [], evMax: 0, local: []};
function viewEnemies() { return IS_HOST ? G.enemies : [...CL.enemies.values()]; }
function viewTraps() { return IS_HOST ? G.traps : CL.traps; }
function viewProjs() { return IS_HOST ? G.projs : CL.projs.concat(CL.local); }
function viewDrops() { return IS_HOST ? G.drops : CL.drops; }

/* ---------- FX ---------- */
function fx(o) { if (FX.length < 700) FX.push(Object.assign({t: 0, life: 0.6, vx: 0, vy: 0, g: 0, s: 3, a: 1}, o)); }
function burst(x, y, n, col, sp = 160, life = 0.5, s = 3, g = 300, k = 'p') { for (let i = 0; i < n; i++) { const a = rnd(TAU), v = rnd(0.3, 1) * sp; fx({k, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.4, life: life * rnd(0.6, 1.2), col, s: s * rnd(0.6, 1.3), g}); } }
function ftxt(x, y, s, col, big) { TXT.push({x, y, s, col, t: 0, big}); if (TXT.length > 60) TXT.shift(); }
function updFx(dt) {
  for (const f of FX) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += f.g * dt; if (f.drag) { f.vx *= Math.exp(-f.drag * dt); f.vy *= Math.exp(-f.drag * dt); } }
  for (let i = FX.length - 1; i >= 0; i--) if (FX[i].t >= FX[i].life) FX.splice(i, 1);
  for (const t of TXT) t.t += dt;
  for (let i = TXT.length - 1; i >= 0; i--) if (TXT[i].t > 1.1) TXT.splice(i, 1);
}
function drawFx(g) {
  for (const f of FX) {
    const k = f.t / f.life, a = (1 - k) * f.a;
    if (f.k === 'p') { g.globalAlpha = a; g.fillStyle = f.col; g.beginPath(); g.arc(f.x, f.y, f.s * (1 - k * 0.5), 0, TAU); g.fill(); }
    else if (f.k === 'glow') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; const r = f.s * (1 + k * (f.grow || 0)); const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); gr.addColorStop(0, `rgba(${f.col},1)`); gr.addColorStop(1, `rgba(${f.col},0)`); g.fillStyle = gr; g.fillRect(f.x - r, f.y - r, 2 * r, 2 * r); g.globalCompositeOperation = 'source-over'; }
    else if (f.k === 'ring') { g.globalAlpha = a; g.strokeStyle = f.col; g.lineWidth = (f.w || 4) * (1 - k); g.beginPath(); g.ellipse(f.x, f.y, f.s + (f.r1 - f.s) * Math.sqrt(k), (f.s + (f.r1 - f.s) * Math.sqrt(k)) * (f.flat || 0.7), 0, 0, TAU); g.stroke(); }
    else if (f.k === 'cone') { g.globalAlpha = a * 0.8; const r = f.r1 * (0.4 + 0.6 * Math.sqrt(k)); const gr = g.createRadialGradient(f.x, f.y, r * 0.3, f.x, f.y, r); gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(0.8, 'rgba(255,220,150,.55)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(f.x, f.y); g.arc(f.x, f.y, r, f.ang - f.arc, f.ang + f.arc); g.closePath(); g.fill(); }
    else if (f.k === 'smoke') { g.globalAlpha = a * 0.5; g.fillStyle = f.col || '#3a3238'; g.beginPath(); g.arc(f.x, f.y, f.s * (1 + k * 1.5), 0, TAU); g.fill(); }
    else if (f.k === 'ghost') { g.globalAlpha = a * 0.45; drawUnit(g, f.u, 'walk', f.fi, f.d, f.x, f.y, {tint: f.tint}); }
    else if (f.k === 'slash') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.strokeStyle = `rgba(${f.col},1)`; g.lineCap = 'round'; const r = f.r1 * (0.75 + 0.25 * k); for (let i = 0; i < 3; i++) { g.lineWidth = (7 - i * 2.5) * (1 - k * 0.5); g.globalAlpha = a * (0.35 + i * 0.3); g.beginPath(); g.ellipse(f.x, f.y + 18, r - i * 6, (r - i * 6) * 0.72, 0, f.ang - f.arc * (0.3 + k * 0.7), f.ang + f.arc * (0.3 + k * 0.7)); g.stroke(); } g.globalCompositeOperation = 'source-over'; }
    else if (f.k === 'bolt') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.strokeStyle = '#bfe0ff'; g.lineWidth = 3 * (1 - k) + 1; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.stroke(); g.globalCompositeOperation = 'source-over'; }
    else if (f.k === 'heart') { g.globalAlpha = a; g.fillStyle = '#ff6fd8'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText('♥', f.x, f.y); }
    else if (f.k === 'shard') { g.globalAlpha = a; g.fillStyle = f.col; g.save(); g.translate(f.x, f.y); g.rotate(f.rot || 0); g.fillRect(-f.s, -f.s * 0.35, f.s * 2, f.s * 0.7); g.restore(); }
    else if (f.k === 'pillar') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; const h = f.h * Math.sin(Math.min(1, k * 3) * Math.PI / 2); const gr = g.createLinearGradient(0, f.y - h, 0, f.y); gr.addColorStop(0, `rgba(${f.col},0)`); gr.addColorStop(1, `rgba(${f.col},.85)`); g.fillStyle = gr; g.fillRect(f.x - f.s, f.y - h, f.s * 2, h); g.globalCompositeOperation = 'source-over'; }
  }
  g.globalAlpha = 1;
}

/* ---------- entity drawing ---------- */
function shadow(g, x, y, r, a = 0.35) { g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.ellipse(x, y, r, r * 0.45, 0, 0, TAU); g.fill(); }
function frameOf(e) {
  const A = ATLAS.units[e.type]; if (!A) return ['walk', 0];
  if (e.anim === 'attack' && A.anims.attack) { const n = A.anims.attack[1]; const k = e.act ? e.act.t / atkDur(e.type) : (e.at || 0) / atkDur(e.type); return ['attack', clamp(Math.floor(k * n), 0, n - 1)]; }
  if (e.anim === 'idle' && A.anims.idle) return ['idle', 0];
  const n = A.anims.walk[1]; const sp = ORCS[e.type].speed / 60; return ['walk', Math.floor(e.at * B.animFps * clamp(sp, 0.7, 1.6)) % n];
}
function drawEnemy(g, e, now) {
  const D = ORCS[e.type];
  let x = e.rx != null ? e.rx : e.x, y = e.ry != null ? e.ry : e.y;
  const lift = (e.z && !D.fly) ? e.z * 46 : 0;
  if (e.fall) { // sinking into pit/lava
    const k = clamp(e.fall / 0.8, 0, 1); g.save(); g.translate(x, y + k * 10); g.scale(1 - k * 0.8, 1 - k * 0.8); g.globalAlpha = 1 - k;
    const [an, fi] = frameOf(e); drawUnit(g, e.type, an, fi, e.dir, 0, 0, {tint: 'rgba(0,0,0,' + (k * 0.7) + ')'}); g.restore(); g.globalAlpha = 1; return;
  }
  if (e.dead) { // corpse fade
    const k = clamp(e.dead / 0.9, 0, 1); if (e.leaked) { g.globalAlpha = 1 - k; drawUnit(g, e.type, 'walk', 0, e.dir, x, y - k * 30, {tint: 'rgba(120,200,255,.7)'}); g.globalAlpha = 1; return; }
    g.save(); g.translate(x, y); g.scale(1, 1 - k * 0.65); g.globalAlpha = 1 - k * k; drawUnit(g, e.type, 'idle', 0, e.dir, 0, 0, {tint: 'rgba(40,10,10,' + (0.3 + k * 0.4) + ')'}); g.restore(); g.globalAlpha = 1; return;
  }
  shadow(g, x, y, D.r * (D.fly ? 0.8 : 1.15), D.fly ? 0.22 : 0.35);
  if (e.charm > 0) { g.strokeStyle = 'rgba(255,110,220,.8)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, D.r * 1.4, D.r * 0.6, 0, 0, TAU); g.stroke(); }
  const [an, fi] = frameOf(e);
  let tint = null; if (e.frz > 0) tint = 'rgba(150,225,255,.55)'; else if (e.enr) tint = 'rgba(255,40,20,.3)'; else if (e.haste > 0) tint = 'rgba(255,140,40,.2)'; else if (e.charm > 0) tint = 'rgba(255,110,220,.25)'; else if (e.burn > 0) tint = 'rgba(255,120,30,.22)';
  if (lift > 2) { g.save(); g.translate(x, y - lift - 30); g.rotate(now * 14 + e.id); drawUnit(g, e.type, an, fi, e.dir, 0, 30, {tint, flash: e.flash > 0 ? 0.65 : 0}); g.restore(); }
  else drawUnit(g, e.type, an, fi, e.dir, x, y - lift, {tint, flash: e.flash > 0 ? 0.65 : 0});
  if (e.frz > 0) { g.fillStyle = 'rgba(200,240,255,.35)'; g.strokeStyle = 'rgba(230,250,255,.7)'; g.lineWidth = 1; const h = D.fly ? 56 : D.r * 3.2, b = D.fly ? 34 : 0; rrect(g, x - D.r * 1.2, y - h - b - lift, D.r * 2.4, h, 6); g.fill(); g.stroke(); }
  if (e.burn > 0 && Math.random() < 0.4) fx({k: 'p', x: x + rnd(-D.r, D.r), y: y - rnd(D.r * 2) - lift, vy: -60, life: 0.4, col: Math.random() < 0.5 ? '#ffb02e' : '#ff5a1a', s: 3});
  if ((e.hpShow > 0 || (e.hp < e.mhp && D.mass >= 4)) && !D.boss) {
    const w = clamp(D.r * 2.2, 26, 60), hy = y - (D.fly ? 92 : D.r * 3.6 + 14) - lift; const f = clamp(e.hp / e.mhp, 0, 1);
    g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(x - w / 2 - 1, hy - 1, w + 2, 6); g.fillStyle = e.charm > 0 ? '#ff7adf' : f > 0.5 ? '#7bd650' : f > 0.25 ? '#e6c040' : '#e0493e'; g.fillRect(x - w / 2, hy, w * f, 4);
  }
}
function drawHero(g, p, now) {
  const H = HEROES[p.hero]; const x = p.rx != null ? p.rx : p.x, y = p.ry != null ? p.ry : p.y;
  if (p.dead) { g.globalAlpha = 0.5; shadow(g, x, y, 14); g.fillStyle = '#ddd'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('复活 ' + Math.ceil(p.rt || 0), x, y - 10); g.globalAlpha = 1; return; }
  shadow(g, x, y, 15);
  if (p === ME) { g.strokeStyle = 'rgba(243,210,122,.55)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 20, 9, 0, 0, TAU); g.stroke(); }
  else { g.strokeStyle = 'rgba(120,200,255,.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 20, 9, 0, 0, TAU); g.stroke(); }
  const d = dirOf(p.aim), A = ATLAS.units[H.atlas];
  let an = p.anim === 'walk' ? 'walk' : 'idle', fi = 0;
  if (p.spin > 0) { an = 'cast'; fi = Math.floor(now * 24) % A.anims.cast[1]; }
  else if (p.cast > 0) { an = 'cast'; const n = A.anims.cast[1]; fi = clamp(Math.floor((1 - p.cast / 0.5) * n), 0, n - 1); }
  else if (p.atk > 0 && A.anims.attack) { an = 'attack'; const n = A.anims.attack[1]; fi = clamp(Math.floor((1 - p.atk / 0.3) * n), 0, n - 1); }
  else if (an === 'walk') fi = Math.floor(p.at * B.animFps * 1.1) % 8;
  const blink = p.inv > 0 && p.inv < 2.5 && Math.floor(now * 12) % 2 === 0;
  if (blink) g.globalAlpha = 0.45;
  drawUnit(g, H.atlas, an, fi, d, x, y, {flash: p.hurtT > 0 ? 0.5 : 0, tint: p.hurtT > 0 ? 'rgba(255,40,40,.35)' : null});
  g.globalAlpha = 1;
  if (p.guard > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const pu = 0.85 + 0.15 * Math.sin(now * 10); g.strokeStyle = `rgba(255,220,120,${0.7 * pu})`; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y - 34, 30, 44, 0, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,220,120,.12)'; g.fill(); g.restore(); }
  if (p !== ME) { g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(p.name, x + 1, y - 69); g.fillStyle = '#9fe3ff'; g.fillText(p.name, x, y - 70); const f = clamp(p.hp / p.mhp, 0, 1); g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(x - 16, y - 64, 32, 5); g.fillStyle = '#e0493e'; g.fillRect(x - 15, y - 63, 30 * f, 3); }
}
function trapFrame(tr, now) {
  switch (tr.k) {
    case 'spikes': return 'spikes_' + (tr.anim > 0.35 ? 1 : tr.anim > 0 ? 2 : 0) + '_2';
    case 'tar': return 'tar_0_2';
    case 'spring': return 'spring_' + (tr.anim > 0 ? 1 : 0) + '_' + ROT_DIR[tr.rot];
    case 'barricade': return 'barricade_' + (tr.hp < tr.mhp * 0.5 ? 1 : 0) + '_2';
    case 'brim': return 'brimstone_' + (tr.anim > 0 ? 1 : 0) + '_2';
    case 'frost': return 'frost_' + (tr.anim > 0 ? 1 : 0) + '_2';
    case 'arrow': return 'arrowwall_' + (tr.anim > 0 ? 1 : 0) + '_' + ROT_DIR[tr.rot];
    case 'grinder': return 'grinder_' + (tr.anim > 0 ? Math.floor(now * 18) % 3 : 0) + '_' + ROT_DIR[tr.rot];
  }
}
function trapStars(g, tr, x, y) { if (!tr.lv) return; g.font = '900 10px sans-serif'; g.textAlign = 'right'; g.fillStyle = '#000'; g.fillText('★'.repeat(tr.lv), x + 22, y - 12); g.fillStyle = '#9fe3ff'; g.fillText('★'.repeat(tr.lv), x + 21, y - 13); }
function drawFloorTrap(g, tr, now) {
  const x = tc(tr.tx), y = tc(tr.ty);
  drawProp(g, trapFrame(tr, now), x, y); trapStars(g, tr, x, y);
  if (tr.k === 'tar') { for (let k = 0; k < 2; k++) { const ph = (now * 0.7 + k * 0.5 + tr.id * 0.37) % 1; g.globalAlpha = 1 - ph; g.strokeStyle = 'rgba(160,150,190,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(x - 8 + k * 14, y - 4 + k * 6, 2 + ph * 5, 0, TAU); g.stroke(); } g.globalAlpha = 1; }
  if (tr.k === 'brim' && tr.cd > 0 && tr.anim <= 0) { g.globalAlpha = 0.3; g.fillStyle = '#000'; g.fillRect(x - 18, y - 18, 36, 36); g.globalAlpha = 1; }
}
function drawRift(g, r, now) {
  const x = tc(r.x), y = tc(r.y);
  g.save(); g.translate(x, y); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { g.rotate(now * (0.6 + k * 0.3) * (k % 2 ? -1 : 1)); g.strokeStyle = `rgba(90,200,255,${0.35 - k * 0.08})`; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 34 + k * 9, (34 + k * 9) * 0.55, 0, k, k + 4.2); g.stroke(); }
  g.restore();
  const hit = (G._riftFlash || 0) > now;
  drawProp(g, 'rift_0_2', x, y + 6, 0.9);
  if (hit) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,60,60,.35)'; g.beginPath(); g.arc(x, y - 30, 40, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over'; }
  if (Math.random() < 0.15) fx({k: 'p', x: x + rnd(-20, 20), y: y - rnd(10, 40), vy: -40, life: 1, col: '#9fe8ff', s: 2});
}
function drawGate(g, gt, now) {
  const x = tc(gt.x), y = tc(gt.y);
  g.save(); g.translate(x, y);
  const gr = g.createRadialGradient(0, 0, 2, 0, 0, 34); gr.addColorStop(0, 'rgba(10,0,0,.95)'); gr.addColorStop(0.7, 'rgba(90,10,6,.75)'); gr.addColorStop(1, 'rgba(255,60,20,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 34, 22, 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(255,${80 + k * 30},40,${0.45 - k * 0.12})`; g.lineWidth = 2.5; g.beginPath(); const a = now * (1.2 + k * 0.4) * (k % 2 ? -1 : 1); g.ellipse(0, 0, 26 + k * 6, (26 + k * 6) * 0.6, 0, a, a + 3.6); g.stroke(); }
  g.restore();
  if (Math.random() < 0.1) fx({k: 'p', x: x + rnd(-22, 22), y: y + rnd(-8, 8), vy: -50, life: 0.9, col: '#ff6a3a', s: 2.2});
}
function drawPillar(g, x, y) {
  const cx = tc(x), by = (y + 1) * T - 6;
  shadow(g, cx, by, 24, 0.4);
  const h = 78, r = 16;
  const gr = g.createLinearGradient(cx - r, 0, cx + r, 0); gr.addColorStop(0, '#2c2833'); gr.addColorStop(0.35, '#6e6878'); gr.addColorStop(0.7, '#4a4552'); gr.addColorStop(1, '#25222b');
  g.fillStyle = gr; g.fillRect(cx - r, by - h, r * 2, h);
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = -1; k <= 1; k++) g.fillRect(cx + k * 8 - 1, by - h + 8, 2, h - 16);
  g.fillStyle = '#58525f'; g.fillRect(cx - r - 5, by - 10, r * 2 + 10, 10); g.fillRect(cx - r - 5, by - h - 4, r * 2 + 10, 10);
  g.fillStyle = '#7a7484'; g.fillRect(cx - r - 5, by - h - 4, r * 2 + 10, 3);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - r - 5, by - 2, r * 2 + 10, 2);
}
function drawTorch(g, tq, now) {
  const x = tc(tq.x), y = (tq.y + 1) * T - WH * 0.55;
  g.fillStyle = '#2a1d12'; g.fillRect(x - 3, y - 2, 6, 12); g.fillStyle = '#8a6a3a'; g.fillRect(x - 5, y - 4, 10, 4);
  const f = 0.8 + 0.2 * Math.sin(now * 17 + tq.x * 3) + 0.1 * Math.sin(now * 29 + tq.y);
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y - 10, 0, x, y - 10, 16 * f); gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.4, 'rgba(255,160,50,.85)'); gr.addColorStop(1, 'rgba(255,80,20,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - 10, 9 * f, 15 * f, 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'source-over';
  if (Math.random() < 0.05) fx({k: 'p', x: x + rnd(-3, 3), y: y - 18, vy: -40, life: 0.6, col: '#ffcf6a', s: 1.6});
}
function drawProj(g, q, now) {
  const a = Math.atan2(q.vy, q.vx);
  if (q.k === 'flask') {
    const z = q.L ? Math.sin(Math.PI * (1 - clamp(q.life / q.L, 0, 1))) * 70 : 30;
    shadow(g, q.x, q.y, 6, 0.3);
    g.save(); g.translate(q.x, q.y - z - 10); g.rotate(now * 14 + q.x * 0.01);
    g.fillStyle = 'rgba(190,240,255,.85)'; g.beginPath(); g.arc(0, 2, 6, 0, TAU); g.fill(); g.fillStyle = '#7cff5a'; g.beginPath(); g.arc(0, 3, 4.5, 0, TAU); g.fill(); g.fillStyle = '#8a5a2e'; g.fillRect(-2, -7, 4, 5);
    g.restore(); return;
  }
  if (q.k === 'knife') { g.save(); g.translate(q.x, q.y); g.rotate(now * 30); g.fillStyle = '#e8edf3'; g.strokeStyle = '#555'; g.lineWidth = 1; g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(0, -5, 10, 0); g.quadraticCurveTo(0, 2, -9, 0); g.fill(); g.stroke(); g.restore(); return; }
  if (q.k === 'shell') { g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 10); gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gr; g.fillRect(q.x - 10, q.y - 10, 20, 20); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#c88a34'; g.beginPath(); g.arc(q.x, q.y, 3.5, 0, TAU); g.fill(); return; }
  if (q.k === 'bolt' || q.k === 'tarrow' || q.k === 'arrow' || q.k === 'parrow') {
    g.save(); g.translate(q.x, q.y); g.rotate(a);
    g.strokeStyle = q.k === 'bolt' ? '#f2e2b0' : '#c9a46a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-16, 0); g.lineTo(6, 0); g.stroke();
    g.fillStyle = q.k === 'arrow' ? '#ff6a5a' : q.k === 'parrow' ? '#9cff7a' : '#dfe6ee'; g.beginPath(); g.moveTo(10, 0); g.lineTo(3, -3.5); g.lineTo(3, 3.5); g.fill();
    if (q.k === 'bolt') { g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,200,120,.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-26, 0); g.lineTo(0, 0); g.stroke(); }
    g.restore(); g.globalCompositeOperation = 'source-over';
  } else if (q.k === 'orb') {
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 14); gr.addColorStop(0, 'rgba(230,255,255,1)'); gr.addColorStop(0.35, 'rgba(90,220,255,.9)'); gr.addColorStop(1, 'rgba(120,80,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, 14, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
    if (Math.random() < 0.5) fx({k: 'p', x: q.x, y: q.y, life: 0.25, col: '#8fe6ff', s: 2});
  } else if (q.k === 'fireball') {
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 24); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.3, 'rgba(255,170,40,.95)'); gr.addColorStop(1, 'rgba(255,60,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, 24, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
    fx({k: 'p', x: q.x + rnd(-6, 6), y: q.y + rnd(-6, 6), vx: -q.vx * 0.1, vy: -q.vy * 0.1 - 30, life: 0.4, col: Math.random() < 0.5 ? '#ffb02e' : '#ff5a1a', s: 4});
  }
}
function drawDrop(g, d, now) {
  const y = d.y - 10 + Math.sin(now * 4 + d.id) * 3;
  shadow(g, d.x, d.y, 8, 0.3);
  const col = d.k === 'hp' ? ['#ff5a5a', '#8a1010'] : ['#5aaeff', '#10308a'];
  g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(d.x, y, 0, d.x, y, 18); gr.addColorStop(0, col[0] + 'aa'); gr.addColorStop(1, col[0] + '00'); g.fillStyle = gr; g.fillRect(d.x - 18, y - 18, 36, 36); g.globalCompositeOperation = 'source-over';
  g.fillStyle = col[1]; g.beginPath(); g.arc(d.x, y + 2, 7, 0, TAU); g.fill(); g.fillStyle = col[0]; g.beginPath(); g.arc(d.x, y + 1, 5.5, 0, TAU); g.fill();
  g.fillStyle = '#d8c8a0'; g.fillRect(d.x - 2.5, y - 9, 5, 5); g.fillStyle = '#fff'; g.globalAlpha = 0.7; g.fillRect(d.x - 3, y - 1, 2, 2); g.globalAlpha = 1;
}

/* ---------- lighting ---------- */
const LIT = document.createElement('canvas'); const lg = LIT.getContext('2d');
function drawLighting(g, now, x0, y0, x1, y1) {
  const s = 0.33, w = Math.ceil(VW * s), h = Math.ceil(VH * s);
  if (LIT.width !== w || LIT.height !== h) { LIT.width = w; LIT.height = h; }
  lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over';
  lg.fillStyle = `rgba(8,6,18,${CAM.over ? 0.08 : (BRIGHT[SAVE.bright] ?? BRIGHT[2])})`; lg.fillRect(0, 0, w, h);
  lg.setTransform(s * CAM.z, 0, 0, s * CAM.z, w / 2 - CAM.x * s * CAM.z, h / 2 - CAM.y * s * CAM.z);
  lg.globalCompositeOperation = 'destination-out';
  const L = lightsNow(now);
  for (const l of L) { if (l.x < x0 - l.r || l.x > x1 + l.r || l.y < y0 - l.r || l.y > y1 + l.r) continue; const gr = lg.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); gr.addColorStop(0, `rgba(0,0,0,${l.a || 0.95})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gr; lg.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.drawImage(LIT, 0, 0, w, h, 0, 0, VW, VH);
  // colored additive glow
  g.setTransform(DPR * CAM.z, 0, 0, DPR * CAM.z, DPR * (VW / 2 - CAM.x * CAM.z), DPR * (VH / 2 - CAM.y * CAM.z));
  g.globalCompositeOperation = 'lighter';
  for (const l of L) { if (!l.c || l.x < x0 - l.r || l.x > x1 + l.r || l.y < y0 - l.r || l.y > y1 + l.r) continue; const r = l.r * 0.55; const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, r); gr.addColorStop(0, `rgba(${l.c},${0.22 * (l.ca || 1)})`); gr.addColorStop(1, `rgba(${l.c},0)`); g.fillStyle = gr; g.fillRect(l.x - r, l.y - r, r * 2, r * 2); }
  g.globalCompositeOperation = 'source-over';
}
function lightsNow(now) {
  const out = [];
  for (const l of G.map.lights) { const f = l.f ? 1 + 0.08 * Math.sin(now * 13 + l.x) + 0.05 * Math.sin(now * 23 + l.y) : 1; out.push({x: l.x, y: l.y, r: l.r * f, c: l.c, a: l.rift ? 0.95 : 0.9}); }
  for (const p of P) if (p && !p.dead) out.push({x: p.rx != null ? p.rx : p.x, y: (p.ry != null ? p.ry : p.y) - 20, r: p === ME ? 300 : 200, a: 0.85});
  for (const z of (G.zones || [])) if (z.k === 'fog') out.push({x: z.x, y: z.y, r: z.r * 1.3, c: '120,255,120', a: 0.7});
  for (const f of (G.pets || [])) out.push({x: f.x, y: f.y, r: 70, a: 0.5});
  for (const q of viewProjs()) if (q.k === 'fireball' || q.k === 'orb') out.push({x: q.x, y: q.y, r: q.k === 'fireball' ? 150 : 80, c: q.k === 'fireball' ? '255,140,40' : '100,200,255', a: 0.8});
  for (const f of FX) if (f.light) out.push({x: f.x, y: f.y, r: f.light * (1 - f.t / f.life), c: f.lc, a: 0.9});
  for (const tr of viewTraps()) if (tr.k === 'brim' && tr.anim > 0.3) out.push({x: tc(tr.tx), y: tc(tr.ty), r: 160, c: '255,120,30', a: 0.9});
  return out;
}

/* ---------- main render ---------- */
function render(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, VW, VH);
  if (!G || !LAYER.floor) return;
  const z = CAM.z, m = G.map;
  ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (VW / 2 - CAM.x * z), DPR * (VH / 2 - CAM.y * z));
  const x0 = CAM.x - VW / 2 / z, y0 = CAM.y - VH / 2 / z, x1 = CAM.x + VW / 2 / z, y1 = CAM.y + VH / 2 / z;
  const FS = LAYER.FS;
  // floor
  const fx0 = clamp(x0, 0, m.w * T), fy0 = clamp(y0, 0, m.h * T), fx1 = clamp(x1, 0, m.w * T), fy1 = clamp(y1, 0, m.h * T);
  if (fx1 > fx0 && fy1 > fy0) ctx.drawImage(LAYER.floor, fx0 * FS, fy0 * FS, (fx1 - fx0) * FS, (fy1 - fy0) * FS, fx0, fy0, fx1 - fx0, fy1 - fy0);
  const tx0 = Math.max(0, Math.floor(x0 / T) - 1), tx1 = Math.min(m.w - 1, Math.ceil(x1 / T) + 1), ty0 = Math.max(0, Math.floor(y0 / T) - 1), ty1 = Math.min(m.h - 1, Math.ceil(y1 / T) + 2);
  // lava shimmer
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (m.t[y * m.w + x] === TL) { const a = 0.12 + 0.1 * Math.sin(now * 2 + x * 0.9 + y * 1.3); ctx.fillStyle = `rgba(255,190,60,${a})`; ctx.fillRect(x * T, y * T, T, T); }
  for (const gt of m.gates) drawGate(ctx, gt, now);
  // flat things
  const traps = viewTraps();
  for (const tr of traps) if (TRAPS[tr.k].place === 'floor' && !TRAPS[tr.k].tall) drawFloorTrap(ctx, tr, now);
  for (const d of m.decor) if (d.flat) drawProp(ctx, 'bones_0_2', tc(d.x), tc(d.y) + 4, 0.8);
  for (const z of (G.zones || [])) drawZone(ctx, z, now);
  drawPaths(ctx, now);
  drawGhost(ctx, now);
  // y-sorted entities bucketed by row
  const rows = new Map(); const add = (y, f) => { const r = clamp(Math.floor(y / T), 0, m.h - 1); if (!rows.has(r)) rows.set(r, []); rows.get(r).push([y, f]); };
  for (const e of viewEnemies()) { const ey = e.ry != null ? e.ry : e.y; add(ey + (ORCS[e.type].fly ? T * 0.6 : 0), () => drawEnemy(ctx, e, now)); }
  for (const p of P) if (p) add(p.ry != null ? p.ry : p.y, () => drawHero(ctx, p, now));
  for (const tr of traps) if (TRAPS[tr.k].unit) add(tc(tr.ty) + 8, () => drawGuardian(ctx, tr, now)); else if (TRAPS[tr.k].proc) add(tc(tr.ty) + 4, () => drawPendulum(ctx, tr, now));
  for (const tr of traps) if (TRAPS[tr.k].tall && !TRAPS[tr.k].unit && !TRAPS[tr.k].proc) add(tc(tr.ty) + 8, () => { drawProp(ctx, trapFrame(tr, now), tc(tr.tx), tc(tr.ty) + 6, 0.95); if (tr.hp < tr.mhp) { ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(tc(tr.tx) - 17, tc(tr.ty) - 48, 34, 5); ctx.fillStyle = '#d9ae4e'; ctx.fillRect(tc(tr.tx) - 16, tc(tr.ty) - 47, 32 * tr.hp / tr.mhp, 3); } });
  for (const d of m.decor) if (!d.flat) add(tc(d.y) + 10, () => { drawProp(ctx, d.k + '_0_2', tc(d.x), tc(d.y) + 8, d.k === 'brazier' ? 0.9 : 0.85); if (d.k === 'brazier') brazierFire(ctx, tc(d.x), tc(d.y) - 22, now); });
  for (const pl of m.pillars) add((pl.y + 1) * T - 6, () => drawPillar(ctx, pl.x, pl.y));
  for (const r of m.rifts) add(tc(r.y) + 6, () => drawRift(ctx, r, now));
  for (const d of viewDrops()) add(d.y, () => drawDrop(ctx, d, now));
  for (const tu of (G.turrets || [])) add(tu.y, () => drawTurret(ctx, tu, now));
  const wallTraps = traps.filter(tr => TRAPS[tr.k].place === 'wall');
  for (let y = ty0; y <= ty1; y++) {
    // wall band y: [yT-WH, (y+1)T-WH)
    const sy = y * T - WH;
    ctx.drawImage(LAYER.walls, Math.max(0, x0) * FS, (sy + WH) * FS, (Math.min(x1, m.w * T) - Math.max(0, x0)) * FS, T * FS, Math.max(0, x0), sy, Math.min(x1, m.w * T) - Math.max(0, x0), T);
    for (const tq of m.torches) if (tq.y === y - 1 && tq.x >= tx0 && tq.x <= tx1 && m.t[y * m.w + tq.x] !== TW) drawTorch(ctx, tq, now);
    for (const tr of wallTraps) if (tr.ty === y) { drawProp(ctx, trapFrame(tr, now), tc(tr.tx), tc(tr.ty) - WH + 4, 0.92); trapStars(ctx, tr, tc(tr.tx), tc(tr.ty) - WH); }
    const list = rows.get(y); if (list) { list.sort((a, b) => a[0] - b[0]); for (const [, f] of list) f(); }
  }
  for (const q of viewProjs()) drawProj(ctx, q, now);
  for (const f of (G.pets || [])) drawFalcon(ctx, f, now);
  drawPings(ctx, now);
  for (const w of (G.warn || [])) { const k = clamp(w.t / 1.3, 0, 1); ctx.strokeStyle = `rgba(255,${120 + 100 * k | 0},40,${0.4 + 0.5 * Math.abs(Math.sin(now * 12))})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(w.x, w.y, 95, 66, 0, 0, TAU); ctx.stroke(); w.t -= 1 / 60; }
  if (G.warn) G.warn = G.warn.filter(w => w.t > 0);
  drawGateLabels(ctx);
  drawFx(ctx);
  drawLighting(ctx, now, x0, y0, x1, y1);
  // texts (world space, after lighting)
  ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (VW / 2 - CAM.x * z), DPR * (VH / 2 - CAM.y * z));
  ctx.textAlign = 'center';
  for (const t of TXT) { const k = t.t / 1.1; ctx.globalAlpha = 1 - k * k; ctx.font = `900 ${t.big ? 18 : 13}px sans-serif`; ctx.fillStyle = '#000'; ctx.fillText(t.s, t.x + 1, t.y - k * 34 + 1); ctx.fillStyle = t.col; ctx.fillText(t.s, t.x, t.y - k * 34); }
  ctx.globalAlpha = 1;
  drawAimAid(ctx);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBossBar(ctx);
}
function brazierFire(g, x, y, now) {
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const f = 0.8 + 0.25 * Math.sin(now * (11 + k * 4) + k); const gr = g.createRadialGradient(x, y - k * 5, 0, x, y - k * 5, 18 * f); gr.addColorStop(0, 'rgba(255,230,150,.9)'); gr.addColorStop(0.5, 'rgba(255,130,30,.6)'); gr.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - k * 6, 12 * f, 18 * f, 0, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  if (Math.random() < 0.15) fx({k: 'p', x: x + rnd(-6, 6), y: y - 10, vy: -70, vx: rnd(-10, 10), life: 0.8, col: '#ffcf6a', s: 1.8});
}
function drawBossBar(g) {
  const b = viewEnemies().find(e => ORCS[e.type].boss && !e.dead && !e.fall); if (!b) return;
  const w = Math.min(420, VW * 0.6), x = VW / 2 - w / 2; let y = (IS_TOUCH ? 96 : 92);
  if (PHONE.matches) { const r = $('tc').getBoundingClientRect(); y = r.bottom + 10; }
  g.fillStyle = 'rgba(10,6,8,.85)'; g.fillRect(x - 4, y - 4, w + 8, 22); g.strokeStyle = '#a32020'; g.strokeRect(x - 4, y - 4, w + 8, 22);
  const f = clamp(b.hp / b.mhp, 0, 1); const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#7a0e0e'); gr.addColorStop(1, '#e23b2b'); g.fillStyle = gr; g.fillRect(x, y, w * f, 14);
  g.font = '800 12px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffe1d6'; g.fillText('兽人督军', VW / 2, y + 11);
}

/* ---------- build-phase path preview & gate labels ---------- */
const BRIGHT = [0, 0.1, 0.24, 0.42];
const GATE_COL = ['#ff6a3a', '#ffc23a', '#c77dff'];
let PATHC = {key: '', paths: []};
function gatePaths() {
  const key = G.li + '|' + (G.flowV || 0) + '|' + G.wave;
  if (PATHC.key === key) return PATHC.paths;
  const out = []; const W = waveDef(G.wave) || [];
  const flyGates = new Set(W.filter(g => ORCS[g[1]].fly).map(g => g[0])), groundGates = new Set(W.filter(g => !ORCS[g[1]].fly).map(g => g[0]));
  G.map.gates.forEach((gt, gi) => {
    for (const fly of [false, true]) {
      if (fly ? !flyGates.has(gi) : !groundGates.has(gi) && W.length) continue;
      const pts = [[tc(gt.x), tc(gt.y)]]; let o = {x: tc(gt.x), y: tc(gt.y)};
      for (let k = 0; k < 400; k++) { const st = nextStep(o, fly); if (st.here <= 0.5 || (st.tx === Math.floor(o.x / T) && st.ty === Math.floor(o.y / T))) break; o = {x: st.x, y: st.y}; pts.push([st.x, st.y]); }
      out.push({gi, fly, pts});
    }
  });
  PATHC = {key, paths: out}; return out;
}
function drawPaths(g, now) {
  if (!G || G.demo || G.phase !== 'build' || !G.flow) return;
  for (const pth of gatePaths()) {
    const col = GATE_COL[pth.gi % 3], pts = pth.pts; if (pts.length < 2) continue;
    g.save(); g.strokeStyle = col; g.globalAlpha = pth.fly ? 0.45 : 0.7; g.lineWidth = pth.fly ? 2 : 3.5; g.setLineDash(pth.fly ? [3, 9] : [14, 10]); g.lineDashOffset = -now * 40; g.lineJoin = 'round';
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]);
    g.fillStyle = col;
    for (let i = 3; i < pts.length - 1; i += 4) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const a = Math.atan2(y1 - y0, x1 - x0); g.save(); g.translate(x1, y1); g.rotate(a); g.beginPath(); g.moveTo(8, 0); g.lineTo(-5, -6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore(); }
    g.restore();
  }
}
function drawGateLabels(g) {
  if (!G || G.demo) return;
  G.map.gates.forEach((gt, i) => {
    const x = tc(gt.x), y = tc(gt.y) - 44;
    g.fillStyle = 'rgba(10,6,8,.8)'; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill();
    g.strokeStyle = GATE_COL[i % 3]; g.lineWidth = 2; g.stroke();
    g.fillStyle = GATE_COL[i % 3]; g.font = '900 14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ABC'[i], x, y + 1); g.textBaseline = 'alphabetic';
  });
}
