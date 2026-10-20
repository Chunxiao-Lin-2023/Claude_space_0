/* ================= rendering: textures, background, world, entities, lighting, effects ================= */
const CV = document.getElementById('cv'), cx = CV.getContext('2d');
const LC = document.createElement('canvas'), lx = LC.getContext('2d');
let VW = 0, VH = 0, DPR = 1;
const CAM = { x: RADIO.x, y: GY - 6 * T, s: 1, shake: 0, lookX: 0, lookY: 0 };
const RND = { parts: [], tracers: [], corpses: [], floats: [], flashes: [], booms: [], bgDirty: true, bgRects: [], eyes: [], tex: null, hurtV: 0, banner: null };
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  VW = innerWidth; VH = innerHeight;
  CV.width = Math.round(VW * DPR); CV.height = Math.round(VH * DPR);
  LC.width = Math.max(1, Math.round(VW / 2)); LC.height = Math.max(1, Math.round(VH / 2));
}
addEventListener('resize', resize); resize();
function camScale() {
  let s = VH > VW * 1.1 ? VW / (17 * T) : Math.min(VW / (34 * T), VH / (20 * T));
  if (SET.zoom === 2) s *= 0.68;
  return clamp(s, 0.32, 2.2);
}
const w2s = (x, y) => [(x - CAM.x) * CAM.s + VW / 2, (y - CAM.y) * CAM.s + VH / 2];
const s2w = (sx, sy) => [(sx - VW / 2) / CAM.s + CAM.x, (sy - VH / 2) / CAM.s + CAM.y];

/* ---------- textures (generated once, 2x resolution) ---------- */
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function genTextures() {
  const S = 64, V = 3, tex = {};
  const mk = (id, fn) => { tex[id] = []; for (let v = 0; v < V; v++) { const c = mkCanvas(S, S), g = c.getContext('2d'); const r = mulberry(id * 97 + v * 13 + 5); fn(g, r, v); tex[id].push(c); } };
  const noise = (g, r, n, col, a) => { g.fillStyle = col; for (let k = 0; k < n; k++) { g.globalAlpha = a * (0.4 + r() * 0.6); g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); } g.globalAlpha = 1; };
  mk(1, (g, r) => { // wood wall: vertical planks
    const cols = ['#7b5432', '#6e4a2b', '#86603a', '#734e2e'];
    for (let k = 0; k < 4; k++) { g.fillStyle = cols[(k + Math.floor(r() * 4)) % 4]; g.fillRect(k * 16, 0, 16, S); g.fillStyle = 'rgba(255,220,170,.08)'; g.fillRect(k * 16 + 2, 0, 2, S); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(k * 16 + 15, 0, 1, S); }
    g.strokeStyle = 'rgba(40,22,10,.35)'; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) { const x = r() * S; g.beginPath(); g.moveTo(x, r() * S); g.lineTo(x + (r() - 0.5) * 3, r() * S); g.stroke(); }
    g.fillStyle = 'rgba(30,18,8,.55)'; g.fillRect(0, 10, S, 4); g.fillRect(0, 50, S, 4);
    g.fillStyle = '#c9c2b5'; for (const y of [12, 52]) for (let k = 0; k < 4; k++) g.fillRect(k * 16 + 7, y - 1, 2, 2);
    noise(g, r, 120, '#000', 0.2);
  });
  mk(2, (g, r) => { // brick
    g.fillStyle = '#5d4b43'; g.fillRect(0, 0, S, S);
    for (let row = 0; row < 4; row++) for (let k = -1; k < 3; k++) {
      const x = k * 32 + (row % 2) * 16, y = row * 16;
      const h = 0.03 + r() * 0.05, l = 30 + r() * 10; g.fillStyle = `hsl(${12 + r() * 10},${30 + r() * 15}%,${l}%)`;
      g.fillRect(x + 1, y + 1, 30, 14); g.fillStyle = 'rgba(255,230,200,.10)'; g.fillRect(x + 1, y + 1, 30, 2); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 1, y + 13, 30, 2);
    }
    noise(g, r, 160, '#000', 0.25); noise(g, r, 60, '#d8c0a8', 0.12);
  });
  mk(3, (g, r) => { // steel plate
    const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#6f8494'); gr.addColorStop(1, '#4b5c69'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
    g.strokeStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.moveTo(3, S - 3); g.lineTo(3, 3); g.lineTo(S - 3, 3); g.stroke();
    g.fillStyle = '#2e3a43'; for (const [x, y] of [[7, 7], [S - 7, 7], [7, S - 7], [S - 7, S - 7]]) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.25)'; for (const [x, y] of [[6, 6], [S - 8, 6], [6, S - 8], [S - 8, S - 8]]) g.fillRect(x, y, 1.5, 1.5);
    noise(g, r, 90, '#20160e', 0.35); g.fillStyle = 'rgba(140,70,30,.18)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(r() * S, r() * S, 4 + r() * 8, 2 + r() * 4, r() * 3, 0, 7); g.fill(); }
  });
  mk(4, (g, r) => { // wood floor (platform slab on top)
    g.fillStyle = '#6a4628'; g.fillRect(0, 0, S, 16); g.fillStyle = '#8a6038'; g.fillRect(0, 0, S, 4); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 14, S, 2);
    g.fillStyle = 'rgba(0,0,0,.4)'; for (let k = 0; k < 3; k++) g.fillRect(Math.floor(r() * 4) * 16 + 15, 0, 1, 16);
    g.fillStyle = '#4b311b'; g.fillRect(6, 16, 6, 8); g.fillRect(S - 12, 16, 6, 8); // joists
    noise(g, r, 40, '#000', 0.2);
  });
  mk(5, (g, r) => { // steel floor grating
    g.fillStyle = '#56687a'; g.fillRect(0, 0, S, 14); g.fillStyle = '#8aa0b2'; g.fillRect(0, 0, S, 3);
    g.fillStyle = 'rgba(0,0,0,.45)'; for (let k = 0; k < 8; k++) g.fillRect(k * 8 + 3, 4, 3, 8);
    g.fillStyle = '#3c4a57'; g.fillRect(0, 14, S, 4); g.fillRect(4, 18, 5, 10); g.fillRect(S - 9, 18, 5, 10);
  });
  mk(6, (g) => { // ladder
    g.fillStyle = '#6b4a2a'; g.fillRect(12, 0, 6, S); g.fillRect(S - 18, 0, 6, S);
    g.fillStyle = 'rgba(255,220,170,.15)'; g.fillRect(12, 0, 2, S); g.fillRect(S - 18, 0, 2, S);
    g.fillStyle = '#80583a'; for (let k = 0; k < 4; k++) g.fillRect(14, k * 16 + 6, S - 28, 5);
    g.fillStyle = 'rgba(0,0,0,.3)'; for (let k = 0; k < 4; k++) g.fillRect(14, k * 16 + 10, S - 28, 1);
  });
  mk(7, (g, r) => { // door
    g.fillStyle = '#3b2716'; g.fillRect(0, 0, S, S);
    g.fillStyle = '#7d5634'; g.fillRect(6, 0, S - 12, S);
    g.strokeStyle = 'rgba(30,16,6,.6)'; g.lineWidth = 2; g.strokeRect(12, 6, S - 24, S - 12);
    g.fillStyle = 'rgba(255,220,170,.08)'; g.fillRect(8, 0, 3, S);
    noise(g, r, 70, '#000', 0.25);
  });
  mk(8, (g) => { // bars (shooting grate)
    g.fillStyle = '#3f4b55'; g.fillRect(0, 0, S, 6); g.fillRect(0, S - 6, S, 6); g.fillRect(0, 0, 6, S); g.fillRect(S - 6, 0, 6, S);
    g.fillStyle = '#5f7080'; for (let k = 1; k < 5; k++) g.fillRect(k * 12 - 2, 4, 4, S - 8);
    g.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 1; k < 5; k++) g.fillRect(k * 12 - 2, 4, 1, S - 8);
    g.fillStyle = '#4c5a66'; g.fillRect(0, S / 2 - 3, S, 6);
  });
  mk(9, (g, r) => { // barbed wire coil
    g.strokeStyle = '#8a8f94'; g.lineWidth = 2;
    for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(8 + k * 12, S - 18, 10, 14, 0, 0, 7); g.stroke(); }
    g.strokeStyle = '#b8bec4'; g.lineWidth = 1; for (let k = 0; k < 14; k++) { const x = r() * S, y = S - 30 + r() * 26; g.beginPath(); g.moveTo(x - 3, y - 3); g.lineTo(x + 3, y + 3); g.moveTo(x + 3, y - 3); g.lineTo(x - 3, y + 3); g.stroke(); }
    g.fillStyle = '#3d3226'; g.fillRect(4, S - 34, 4, 34); g.fillRect(S - 8, S - 34, 4, 34);
  });
  mk(10, (g) => { // lamp
    g.fillStyle = '#2d3238'; g.fillRect(29, 20, 6, S - 20); g.fillRect(18, S - 6, 28, 6);
    g.fillStyle = '#4a5560'; g.fillRect(16, 8, 32, 16); g.fillStyle = '#ffe9a8'; g.fillRect(19, 11, 26, 10); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(21, 12, 8, 3);
  });
  mk(DIRT, (g, r) => {
    g.fillStyle = '#3d2f25'; g.fillRect(0, 0, S, S); noise(g, r, 220, '#1d150f', 0.5); noise(g, r, 70, '#6b5644', 0.35);
    g.fillStyle = '#5a4a3e'; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(r() * S, r() * S, 3 + r() * 4, 2 + r() * 3, r() * 3, 0, 7); g.fill(); }
  });
  // cracks
  tex.crack = [1, 2, 3].map(lv => {
    const c = mkCanvas(S, S), g = c.getContext('2d'), r = mulberry(lv * 31);
    g.strokeStyle = 'rgba(10,6,4,.85)'; g.lineWidth = 1.6 + lv * 0.4;
    for (let k = 0; k < lv * 2; k++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4 + lv; s++) { x += (r() - 0.5) * 22; y += (r() - 0.5) * 22; g.lineTo(x, y); } g.stroke(); }
    return c;
  });
  return tex;
}

/* ---------- parallax background ---------- */
function genSkyline(w, h, seed, base, win, layer) {
  const c = mkCanvas(w, h), g = c.getContext('2d'), r = mulberry(seed);
  let x = 0;
  while (x < w) {
    const bw = 40 + r() * (layer ? 110 : 80), bh = h * (0.25 + r() * (layer ? 0.55 : 0.6));
    g.fillStyle = base; g.fillRect(x, h - bh, bw, bh);
    // broken top
    g.beginPath(); g.moveTo(x, h - bh); for (let k = 0; k <= 6; k++) g.lineTo(x + bw * k / 6, h - bh - r() * (layer ? 26 : 16)); g.lineTo(x + bw, h - bh); g.fill();
    if (r() < 0.35) { g.fillRect(x + bw * 0.4, h - bh - 30 - r() * 30, 3, 40); } // antenna / rebar
    g.fillStyle = win;
    for (let wy = h - bh + 12; wy < h - 10; wy += layer ? 18 : 12) for (let wx = x + 6; wx < x + bw - 8; wx += layer ? 14 : 9) if (r() < 0.55) g.fillRect(wx, wy, layer ? 7 : 4, layer ? 9 : 5);
    if (layer && r() < 0.4) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(x + bw * r(), h - bh); g.lineTo(x + bw * r(), h - bh * 0.5); g.lineTo(x + bw * r(), h - bh * 0.7); g.fill(); g.fillStyle = win; }
    x += bw + r() * (layer ? 30 : 12);
  }
  return c;
}
let SKY1, SKY2;
function initArt() {
  RND.tex = genTextures();
  SKY1 = genSkyline(2400, 420, 7, '#2a3040', 'rgba(10,12,18,.55)', 0);
  SKY2 = genSkyline(2400, 520, 19, '#1b1f29', 'rgba(5,6,10,.7)', 1);
}

/* ---------- time-of-day ---------- */
function darkness() {
  if (!W) return 0.5;
  if (DBG && DBG.dark != null) return DBG.dark;
  if (W.phase === 'night' || W.phase === 'lose') return 0.82;
  if (W.phase === 'win') return 0.2;
  const c = W.clock, since = W.dayLen - c;
  if (W.night > 0 && since < 7) return lerp(0.82, 0, since / 7);
  if (c < 30) return lerp(0.72, 0, c / 30);
  return 0;
}
const mixA = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const rgbS = c => 'rgb(' + c.map(Math.round).join(',') + ')';
function drawSky(dk) {
  const blood = W && W.phase === 'night' && isBlood(W.night);
  const t = clamp(dk / 0.88, 0, 1), dusk = Math.sin(t * Math.PI) * 0.9;
  let top = mixA([141, 156, 171], [7, 10, 20], t), bot = mixA([214, 195, 161], [27, 34, 54], t);
  if (t > 0.05 && t < 0.97) { top = mixA(top, [58, 52, 86], dusk * 0.6); bot = mixA(bot, [224, 137, 90], dusk * 0.75); }
  top = rgbS(top); bot = rgbS(bot);
  if (blood) { top = '#14050a'; bot = '#4e0f15'; }
  const g = cx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, top); g.addColorStop(1, bot);
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  // sun / moon
  const mx = VW * 0.78 - (CAM.x - RADIO.x) * 0.03, my = VH * 0.18 - (CAM.y - GY) * 0.02;
  if (t > 0.5) {
    const R = Math.min(VW, VH) * 0.06, mg = cx.createRadialGradient(mx, my, R * 0.5, mx, my, R * 4);
    mg.addColorStop(0, blood ? 'rgba(255,60,50,.35)' : 'rgba(200,215,255,.22)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = mg; cx.fillRect(mx - R * 4, my - R * 4, R * 8, R * 8);
    cx.fillStyle = blood ? '#d8423a' : '#e8ecf4'; cx.beginPath(); cx.arc(mx, my, R, 0, 7); cx.fill();
    cx.fillStyle = blood ? 'rgba(120,10,10,.5)' : 'rgba(160,170,190,.45)'; cx.beginPath(); cx.arc(mx - R * 0.3, my - R * 0.2, R * 0.22, 0, 7); cx.arc(mx + R * 0.25, my + R * 0.3, R * 0.15, 0, 7); cx.fill();
  } else {
    const R = Math.min(VW, VH) * 0.05, sx = VW * 0.25, sy = VH * (0.15 + (1 - W.clock / W.dayLen) * 0.25);
    const sg = cx.createRadialGradient(sx, sy, 0, sx, sy, R * 5); sg.addColorStop(0, 'rgba(255,230,180,.55)'); sg.addColorStop(1, 'rgba(255,200,140,0)');
    cx.fillStyle = sg; cx.fillRect(sx - R * 5, sy - R * 5, R * 10, R * 10);
  }
  // skyline layers
  const groundS = (GY - CAM.y) * CAM.s + VH / 2;
  for (const [img, par, sc, alpha] of [[SKY1, 0.12, 0.42, 0.42 + t * 0.4], [SKY2, 0.3, 0.55, 0.62 + t * 0.35]]) {
    const h = img.height * sc * Math.max(0.6, CAM.s), w = img.width * sc * Math.max(0.6, CAM.s);
    const off = ((-CAM.x * par * CAM.s) % w + w) % w, y = groundS - h + (par < 0.2 ? -10 : 8) * CAM.s + (CAM.y - (GY - 6 * T)) * par * 0.4 * CAM.s;
    cx.globalAlpha = alpha;
    for (let x = off - w; x < VW; x += w) cx.drawImage(img, x, y, w, h);
    cx.globalAlpha = 1;
    // haze
    const hz = cx.createLinearGradient(0, y + h * 0.4, 0, y + h); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, blood ? 'rgba(90,20,24,.35)' : t > 0.5 ? 'rgba(20,26,40,.5)' : 'rgba(210,190,160,.35)');
    cx.fillStyle = hz; cx.fillRect(0, y + h * 0.4, VW, h * 0.6 + 2);
  }
}

/* ---------- interior backdrop (rooms look like rooms) ---------- */
function rebuildBg() {
  RND.bgRects = [];
  for (let tx = BZ0 - 1; tx <= BZ1; tx++) {
    for (let ty = 2; ty < GR; ty++) {
      const t = tileAt(tx, ty); if (!t || !TF[t].plat && !TF[t].P && !TF[t].lad) continue;
      if (!TF[t].plat && !(TF[t].lad && tileAt(tx, ty - 1) !== t)) continue;
      let n = 0; for (let r = ty + 1; r < GR && n < 6; r++) { const u = tileAt(tx, r); if (u && (TF[u].plat || u === DIRT)) break; n++; }
      if (n > 0 && n < 6) RND.bgRects.push([tx, ty + 1, n]);
    }
  }
  RND.bgDirty = false;
}

/* ---------- characters ---------- */
const PCOL = [{ j: '#d9733a', j2: '#a85224', h: '#3a2618', p: '#2f3442' }, { j: '#2f9e94', j2: '#1f6f68', h: '#1b1b22', p: '#3b3a33' }];
function limb(g, x1, y1, x2, y2, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function drawGun(g, wi, build) {
  if (build) { g.fillStyle = '#6b4a2a'; g.fillRect(0, -1.5, 15, 3); g.fillStyle = '#9aa5ae'; g.fillRect(13, -5, 6, 10); return; }
  g.fillStyle = '#1c1f24';
  if (wi === 0) { g.fillRect(0, -2.5, 11, 5); g.fillRect(1, 1, 3, 5); }
  else if (wi === 1) { g.fillRect(-4, -2.5, 26, 5); g.fillStyle = '#5a3c22'; g.fillRect(-6, -2, 9, 5); g.fillRect(8, 2, 8, 3); }
  else if (wi === 2) { g.fillRect(-4, -2.5, 26, 5); g.fillRect(6, 1, 4, 7); g.fillStyle = '#383d44'; g.fillRect(-7, -2, 6, 6); g.fillRect(4, -5, 8, 2.5); }
  else { g.fillRect(-6, -2, 34, 4); g.fillStyle = '#41484f'; g.fillRect(4, -6, 12, 3.5); g.fillStyle = '#4a3420'; g.fillRect(-9, -2, 9, 6); }
}
function drawPlayer(p, isMe) {
  if (p.gone || p.dead) return;
  const g = cx, C = PCOL[p.i % 2];
  g.save(); g.translate(p.x, p.y);
  if (p.hurtT > 0 && Math.floor(p.hurtT * 30) % 2) g.globalAlpha = 0.6;
  if (p.down) {
    g.scale(p.face, 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, -1, 30, 4, 0, 0, 7); g.fill();
    limb(g, -24, -5, -6, -6, 8, C.p); limb(g, -6, -8, 12, -9, 13, C.j);
    g.fillStyle = '#e1b892'; g.beginPath(); g.arc(19, -11, 6.5, 0, 7); g.fill(); g.fillStyle = C.h; g.beginPath(); g.arc(18, -13, 6.5, Math.PI, 0); g.fill();
    g.save(); g.translate(14, -10); const a = p.face > 0 ? p.aim : Math.PI - p.aim; g.rotate(clamp(a, -1.2, 0.6)); limb(g, 0, 0, 10, 0, 5, C.j2); g.translate(10, 0); drawGun(g, 0, false); g.restore();
    g.fillStyle = 'rgba(208,69,63,.9)'; g.fillRect(-14, -26, 28 * clamp(p.downT / BAL.downTime, 0, 1), 3);
    g.restore(); return;
  }
  const f = p.face; g.scale(f, 1);
  const run = Math.abs(p.vx) > 20 && p.ground, sw = Math.sin(p.anim) * (run ? 0.7 : 0.05), cl = p.climbing;
  // shadow
  if (p.ground) { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 0, 13, 3, 0, 0, 7); g.fill(); }
  const hipY = -29, shY = -46;
  // legs
  const legA = cl ? Math.sin(p.anim) * 0.5 : sw, legB = cl ? -Math.sin(p.anim) * 0.5 : -sw;
  for (const [a, col] of [[legB, '#252a35'], [legA, C.p]]) {
    const kx = Math.sin(a) * 14, ky = hipY + Math.cos(a) * 14, fx = kx + Math.sin(a * 0.6 - (p.ground ? 0 : 0.4)) * 14, fy = Math.min(-1, ky + 14);
    limb(g, 0, hipY, kx, ky, 8, col); limb(g, kx, ky, fx, fy, 7, col);
    g.fillStyle = '#1a1a1e'; g.fillRect(fx - 4, fy - 3, 10, 4);
  }
  // backpack + torso
  g.fillStyle = '#4c4636'; g.beginPath(); g.roundRect(-14, shY + 2, 8, 15, 3); g.fill();
  g.fillStyle = C.j; g.beginPath(); g.roundRect(-8, shY, 16, 19, 4); g.fill();
  g.fillStyle = C.j2; g.fillRect(-8, shY + 14, 16, 4); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-6, shY + 2, 3, 12);
  // head
  const hy = shY - 8;
  g.fillStyle = '#e1b892'; g.beginPath(); g.arc(1, hy, 7, 0, 7); g.fill();
  g.fillStyle = C.h;
  if (p.i % 2 === 0) { g.beginPath(); g.arc(0, hy - 2, 7.4, Math.PI, 0.1); g.fill(); g.fillRect(-1, hy - 5, 11, 3); }
  else { g.beginPath(); g.arc(0, hy - 1.5, 7.8, Math.PI * 1.02, -0.05); g.fill(); g.fillStyle = '#c94b4b'; g.fillRect(-7, hy - 4, 15, 2.5); }
  g.fillStyle = '#222'; g.fillRect(4, hy - 1, 2, 2);
  // arms + gun
  const a = f > 0 ? p.aim : Math.PI - p.aim, la = clamp(Math.atan2(Math.sin(a), Math.cos(a)), -1.45, 1.45);
  g.save(); g.translate(0, shY + 5); g.rotate(la);
  const recoil = p.recoilT > 0 ? -p.recoilT * 30 : 0, sh = p.shoveT > 0 ? 6 : 0;
  limb(g, 0, 0, 13 + recoil + sh, 1, 5.5, C.j2); limb(g, 2, 3, 17 + recoil + sh, 2, 5, C.j);
  g.translate(13 + recoil + sh, 0); drawGun(g, p.down ? 0 : p.wpn, p.build); g.restore();
  g.restore();
  // name & bars for the teammate
  if (!isMe && W.p.length > 1) {
    g.font = '600 11px system-ui,sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(p.name, p.x, p.y - 70);
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(p.x - 16, p.y - 66, 32, 4); g.fillStyle = PCOL[p.i % 2].j; g.fillRect(p.x - 16, p.y - 66, 32 * p.hp / p.maxHp, 4);
  }
}
const ZSHIRT = ['#3c4652', '#4f3e33', '#34402f', '#5a4a3a', '#3e3446', '#46503f', '#5a3434', '#2f3a44'];
const ZSKIN = ['#93a383', '#82967a', '#a0aa8e', '#8a9a80', '#9a9c84'];
function zEyes(x, y, col, r) { RND.eyes.push([x, y, col, r]); }
function zSkin(z) { return z.k === 'walker' || z.k === 'runner' ? ZSKIN[z.seed % ZSKIN.length] : ZT[z.k].col; }
function drawZombie(z) {
  const g = cx, Z = ZT[z.k], f = z.face, hit = z.hitT > 0;
  const sk = hit ? '#f2efe6' : zSkin(z), sh = hit ? '#e0ddd6' : ZSHIRT[z.seed % ZSHIRT.length], pants = hit ? '#d8d8d8' : '#24282b', pants2 = hit ? '#cfcfcf' : '#2e3336';
  g.save(); g.translate(z.x, z.y); g.scale(f, 1);
  const k = z.k, h = z.h, big = k === 'brute' || k === 'boss', mv = Math.abs(z.vx) > 8;
  const ph = z.anim * (k === 'runner' ? 11 : k === 'climber' ? 9 : 4.5) * (mv ? 1 : 0.15);
  const atk = z.atk > 0 ? Math.sin(W.t * 16 + z.seed) : 0;
  if (!z.climbing && !z.ride) { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 0, z.w * 0.7, 3, 0, 0, 7); g.fill(); }
  const eyeCol = k === 'boss' ? '#ff3b2f' : k === 'spitter' ? '#b6ff4a' : '#ffd36a';
  const toW = (lx, ly) => [z.x + lx * f, z.y + ly];
  if (k === 'climber' && z.climbing) {
    // clinging to a wall or a ladder
    const c = Math.sin(ph);
    g.translate(z.w * 0.1, 0);
    limb(g, -2, -h * 0.2, 7, -h * 0.05 - c * 6, 5, pants); limb(g, -2, -h * 0.2, 7, -h * 0.3 + c * 6, 5, pants2);
    g.fillStyle = sh; g.beginPath(); g.roundRect(-8, -h * 0.82, 12, h * 0.66, 4); g.fill();
    limb(g, 0, -h * 0.72, 9, -h * 0.98 - c * 6, 4, sk); limb(g, 0, -h * 0.66, 9, -h * 0.5 + c * 6, 4, sk);
    g.fillStyle = sk; g.beginPath(); g.arc(-1, -h * 0.92, 6.5, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(-3, -h * 0.97, 5, Math.PI, 0); g.fill();
    const [ex, ey] = toW(z.w * 0.1 + 3, -h * 0.93); zEyes(ex, ey, eyeCol, 1.6);
  } else if (k === 'climber') {
    // crouched on all fours
    const c = Math.sin(ph);
    limb(g, -9, -14, -15 + c * 6, -1, 5, pants); limb(g, -9, -14, -4 - c * 6, -1, 5, pants2);
    g.fillStyle = sh; g.beginPath(); g.ellipse(-2, -21, 13, 7.5, -0.12, 0, 7); g.fill();
    limb(g, 7, -21, 14 + c * 5, -1, 4, sk); limb(g, 7, -21, 2 - c * 5, -1, 4, sk);
    g.fillStyle = sk; g.beginPath(); g.arc(13, -27, 6.5, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(12, -30, 5, Math.PI, 0); g.fill();
    g.fillStyle = '#1a0d0d'; g.fillRect(14, -24, 5, 2);
    const [ex, ey] = toW(16, -28); zEyes(ex, ey, eyeCol, 1.6);
  } else {
    const lean = k === 'runner' ? 0.38 : big ? 0.12 : 0.2;
    const hipY = -h * 0.48, legL = h * 0.25, sw = Math.sin(ph) * (k === 'runner' ? 0.85 : 0.45);
    const legW = k === 'boss' ? 16 : k === 'brute' ? 12 : 7;
    for (const [a, col] of [[-sw, pants], [sw, pants2]]) {
      const kx = Math.sin(a) * legL, ky = hipY + Math.cos(a) * legL, fx = kx + Math.sin(a * 0.5 - 0.1) * legL, fy = Math.min(-1, ky + legL);
      limb(g, 0, hipY, kx, ky, legW, col); limb(g, kx, ky, fx, fy, legW * 0.85, col);
      g.fillStyle = hit ? '#eee' : '#1d1b1a'; g.fillRect(fx - legW * 0.4, fy - 3, legW * 1.2, 4);
    }
    g.save(); g.translate(0, hipY); g.rotate(lean + Math.sin(ph * 0.5) * 0.05 + (z.atk > 0 ? 0.08 : 0));
    const tw = k === 'boss' ? 46 : k === 'brute' ? 30 : k === 'spitter' ? 22 : 16, th = h * 0.37;
    const armL = big ? h * 0.38 : h * 0.31, aw = k === 'boss' ? 14 : k === 'brute' ? 10 : 5;
    const reach = big ? 1.05 + atk * 0.9 : 0.28 + atk * 0.5 + Math.sin(ph) * 0.08;
    const arm = (oy, a, w, col) => { const ex = armL * Math.cos(a), ey = oy + armL * Math.sin(a); limb(g, 2, oy, ex, ey, w, col); g.fillStyle = col; g.beginPath(); g.arc(ex, ey, big ? w * 0.75 : w * 0.6, 0, 7); g.fill(); };
    arm(-th * 0.86, reach - 0.18, aw, hit ? sk : 'rgba(0,0,0,.25)'); arm(-th * 0.86, reach - 0.18, aw - 1, sk);
    // torso
    g.fillStyle = sh; g.beginPath(); g.roundRect(-tw / 2, -th, tw, th + 2, k === 'spitter' ? 10 : big ? 8 : 4); g.fill();
    if (big) { g.fillStyle = hit ? sk : 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(tw * 0.1, -th * 0.8, tw * 0.45, th * 0.28, 0, 0, 7); g.fill(); }
    if (k === 'spitter') { g.fillStyle = hit ? '#eee' : '#6c8c2a'; g.beginPath(); g.ellipse(5, -th * 0.38, tw * 0.58, th * 0.44, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(190,255,90,.75)'; for (const [px, py] of [[7, -th * 0.45], [1, -th * 0.22], [12, -th * 0.2]]) { g.beginPath(); g.arc(px, py, 2.6, 0, 7); g.fill(); } }
    if (k === 'boss') { g.fillStyle = hit ? '#fff' : '#d9d0c0'; for (let s = 0; s < 4; s++) { g.beginPath(); g.moveTo(-tw / 2 + 4 + s * 10, -th + 2); g.lineTo(-tw / 2 + 9 + s * 10, -th - 16); g.lineTo(-tw / 2 + 13 + s * 10, -th + 2); g.fill(); } }
    if (!hit) {
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.moveTo(-tw / 2, -5); g.lineTo(-tw / 4, 0); g.lineTo(0, -7); g.lineTo(tw / 4, 1); g.lineTo(tw / 2, -5); g.lineTo(tw / 2, 2); g.lineTo(-tw / 2, 2); g.fill();
      g.fillStyle = 'rgba(110,22,16,.55)'; g.beginPath(); g.ellipse(tw * 0.15, -th * 0.55, 3.5, 5.5, 0.5, 0, 7); g.fill();
      g.fillStyle = sk; g.globalAlpha = 0.8; g.fillRect(-tw * 0.3, -th * 0.35, 4, 5); g.globalAlpha = 1;
    }
    // head
    const hr = k === 'boss' ? 12 : k === 'brute' ? 8 : 7, hx = big ? tw * 0.3 : tw * 0.22, hy = -th - hr * (big ? 0.35 : 0.75);
    g.fillStyle = sk; g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fill();
    g.fillStyle = hit ? 'rgba(0,0,0,.1)' : 'rgba(0,0,0,.42)'; g.beginPath(); g.arc(hx - 2, hy - hr * 0.35, hr * 0.85, Math.PI * 1.05, Math.PI * 1.9); g.fill(); // hair / scalp
    g.fillStyle = '#1a0d0d'; g.beginPath(); g.arc(hx + hr * 0.45, hy - 1, hr * 0.28, 0, 7); g.fill(); // eye socket
    g.fillRect(hx + hr * 0.15, hy + hr * 0.42, hr * 0.75, 2.4); // mouth
    // near arm
    arm(-th * 0.8, reach, aw + 1, sk);
    g.restore();
    // eyes (world space)
    const ang = lean, lx2 = hx + hr * 0.45, ly2 = hy - 1;
    const [wx, wy] = toW(Math.cos(ang) * lx2 - Math.sin(ang) * ly2, hipY + Math.sin(ang) * lx2 + Math.cos(ang) * ly2);
    zEyes(wx, wy, eyeCol, k === 'boss' ? 3 : k === 'brute' ? 2.2 : 1.7);
  }
  g.restore();
  if (z.hp < z.max && z.max > 0) {
    const bw = Math.max(20, z.w * 1.1);
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(z.x - bw / 2, z.y - h - 9, bw, 3); g.fillStyle = k === 'boss' ? '#ff5a3c' : '#c8d26a'; g.fillRect(z.x - bw / 2, z.y - h - 9, bw * clamp(z.hp / z.max, 0, 1), 3);
  }
}
function drawCorpse(c) {
  const g = cx, Z = ZT[c.k], h = Z.h * T, w = Z.w * T, a = Math.min(1, c.t / 0.4), fade = clamp(1 - (c.t - 7) / 2, 0, 1);
  if (c.pool) { g.fillStyle = 'rgba(70,10,8,' + 0.55 * fade + ')'; g.beginPath(); g.ellipse(c.x - c.f * h * 0.45, c.y - 1, Math.min(c.t, 1.4) * h * 0.22, 3, 0, 0, 7); g.fill(); }
  g.save(); g.translate(c.x, c.y); g.scale(c.f, 1); g.globalAlpha = fade;
  g.rotate(-a * a * Math.PI / 2 * 0.97);
  const tw = Math.max(12, w * 0.6), sk = c.k === 'walker' || c.k === 'runner' ? ZSKIN[c.seed % ZSKIN.length] : Z.col;
  limb(g, 0, -h * 0.46, 3, -2, Math.max(6, w * 0.28), '#24282b');
  g.fillStyle = ZSHIRT[c.seed % ZSHIRT.length]; g.beginPath(); g.roundRect(-tw / 2, -h * 0.84, tw, h * 0.4, 4); g.fill();
  limb(g, 0, -h * 0.78, tw * 0.6 + 6, -h * 0.55, Math.max(4, w * 0.18), sk);
  g.fillStyle = sk; g.beginPath(); g.arc(1, -h * 0.9, Math.max(6, h * 0.07), 0, 7); g.fill();
  g.restore(); g.globalAlpha = 1;
}
/* ---------- props: radio, bench, scavenging spots ---------- */
function drawRadio() {
  const g = cx, x = RADIO.x, y = GY, R = W.radio, hurt = R.hitT > 0;
  g.save(); g.translate(x + (hurt ? frnd(-2, 2) : 0), y);
  g.fillStyle = '#2b2f2c'; g.fillRect(-26, -40, 52, 40); g.fillStyle = '#3e4540'; g.fillRect(-23, -37, 46, 34);
  g.fillStyle = '#9fd38b'; g.globalAlpha = 0.85; g.fillRect(-18, -32, 22, 10); g.globalAlpha = 1;
  g.fillStyle = '#1b1e1c'; for (let k = 0; k < 4; k++) g.fillRect(8, -33 + k * 5, 12, 2);
  g.fillStyle = '#7b8478'; g.beginPath(); g.arc(-10, -12, 5, 0, 7); g.arc(8, -12, 5, 0, 7); g.fill();
  g.strokeStyle = '#8a8f8a'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, -40); g.lineTo(26, -80); g.stroke();
  const blink = Math.sin(W.t * 6) > 0;
  g.fillStyle = blink ? '#ff4b3e' : '#5a1a16'; g.beginPath(); g.arc(26, -81, 3, 0, 7); g.fill();
  g.fillStyle = '#d9e8d0'; g.font = '700 7px monospace'; g.textAlign = 'left'; g.fillText('SOS', -17, -24);
  g.restore();
  const bw = 60; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x - bw / 2, y - 92, bw, 5); g.fillStyle = R.hp / R.max < 0.3 ? '#ff5a4a' : '#7fd36b'; g.fillRect(x - bw / 2, y - 92, bw * clamp(R.hp / R.max, 0, 1), 5);
}
function drawBench() {
  const g = cx, x = BENCH.x, y = GY;
  g.fillStyle = '#5b4026'; g.fillRect(x - 30, y - 26, 60, 7); g.fillStyle = '#3d2a18'; g.fillRect(x - 27, y - 19, 6, 19); g.fillRect(x + 21, y - 19, 6, 19);
  g.fillStyle = '#6c7a84'; g.fillRect(x - 18, y - 34, 14, 8); g.fillStyle = '#9a6b3a'; g.fillRect(x + 4, y - 31, 18, 3); g.fillStyle = '#b8c0c6'; g.fillRect(x + 18, y - 35, 6, 9);
  g.fillStyle = '#c84'; g.fillRect(x - 24, y - 12, 10, 12); g.fillStyle = '#e6c55a'; g.fillRect(x - 22, y - 10, 6, 3);
}
function drawSpot(s) {
  const g = cx, S = SPOTS[s.k], x = s.x, y = GY, w = S.w * T;
  g.save(); g.translate(x, y); if (s.var === 1) g.scale(-1, 1);
  if (s.k === 'car') {
    g.fillStyle = '#4b3b33'; g.beginPath(); g.moveTo(-w / 2, -8); g.lineTo(-w / 2 + 6, -26); g.lineTo(-w / 4, -28); g.lineTo(-w / 8, -44); g.lineTo(w / 4, -44); g.lineTo(w / 3, -28); g.lineTo(w / 2, -24); g.lineTo(w / 2, -8); g.fill();
    g.fillStyle = '#6a4c3b'; g.fillRect(-w / 2 + 4, -26, w - 8, 4); g.fillStyle = '#1b1d22'; g.fillRect(-w / 10, -40, w / 5, 11); g.fillRect(w / 7, -40, w / 9, 11);
    g.fillStyle = '#7a3e22'; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(-w / 5, -20, 12, 6, 0.2, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#16171a'; for (const wx of [-w / 3, w / 3]) { g.beginPath(); g.arc(wx, -8, 9, 0, 7); g.fill(); g.fillStyle = '#3a3c40'; g.beginPath(); g.arc(wx, -8, 4, 0, 7); g.fill(); g.fillStyle = '#16171a'; }
  } else if (s.k === 'wood') {
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) { g.fillStyle = ['#6e4a2b', '#7b5432', '#5e3e22'][(k + r) % 3]; g.beginPath(); g.arc(-w / 2 + 12 + k * 16 + r * 8, -8 - r * 14, 8, 0, 7); g.fill(); g.fillStyle = '#a07a50'; g.beginPath(); g.arc(-w / 2 + 12 + k * 16 + r * 8, -8 - r * 14, 4, 0, 7); g.fill(); }
  } else if (s.k === 'rubble') {
    g.fillStyle = '#5b5550'; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 3, -18); g.lineTo(-w / 8, -26); g.lineTo(w / 6, -20); g.lineTo(w / 3, -30); g.lineTo(w / 2, 0); g.fill();
    g.fillStyle = '#7a3f30'; g.fillRect(-w / 4, -16, 14, 7); g.fillRect(w / 8, -24, 12, 6); g.strokeStyle = '#8a6a50'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -24); g.lineTo(10, -46); g.moveTo(-10, -18); g.lineTo(-22, -38); g.stroke();
  } else {
    g.fillStyle = '#4c5a3a'; g.fillRect(-w / 2, -24, w, 24); g.fillStyle = '#5f7048'; g.fillRect(-w / 2, -24, w, 5);
    g.fillStyle = '#2d3524'; g.fillRect(-w / 2 + 3, -14, w - 6, 2); g.fillStyle = '#d9d0b0'; g.fillRect(-5, -18, 10, 8); g.fillStyle = '#b33'; g.fillRect(-1.5, -17, 3, 6); g.fillRect(-4, -15.5, 8, 3);
  }
  g.restore();
  if (!s.searched && W.phase !== 'night') {
    const by = y - 58 + Math.sin(W.t * 3 + s.i) * 3;
    g.fillStyle = 'rgba(255,210,110,.9)'; g.beginPath(); g.moveTo(x, by + 8); g.lineTo(x - 5, by); g.lineTo(x + 5, by); g.fill();
  }
}

/* ---------- particles ---------- */
function addP(o) { if (RND.parts.length < 900) RND.parts.push(Object.assign({ vx: 0, vy: 0, g: 900, life: 0.8, t: 0, s: 3, col: '#fff', shape: 0, bounce: 0 }, o)); }
function blood(x, y, n, green, dir) {
  for (let k = 0; k < n; k++) addP({ x, y, vx: frnd(-160, 160) + (dir || 0) * 120, vy: frnd(-260, 40), col: green ? (k % 2 ? '#7fb53a' : '#4f7a1e') : (k % 2 ? '#6e0d0b' : '#9b1712'), s: frnd(1.5, 3.5), life: frnd(0.35, 0.8), bounce: 0.1 });
}
function debris(x, y, col, n) {
  for (let k = 0; k < n; k++) addP({ x: x + frnd(-12, 12), y: y + frnd(-12, 12), vx: frnd(-200, 200), vy: frnd(-320, 0), col, s: frnd(2, 5), life: frnd(0.6, 1.3), bounce: 0.35, shape: 1, rot: frnd(0, 6) });
  for (let k = 0; k < n / 2; k++) addP({ x, y, vx: frnd(-40, 40), vy: frnd(-60, -10), g: -20, col: 'rgba(170,160,150,.35)', s: frnd(6, 12), life: frnd(0.6, 1.1), shape: 2 });
}
const TCOL = { 1: '#7b5432', 2: '#7a4a3a', 3: '#6f8494', 4: '#6a4628', 5: '#56687a', 6: '#6b4a2a', 7: '#7d5634', 8: '#5f7080', 9: '#8a8f94', 10: '#4a5560' };
function stepFx(dt) {
  for (const q of RND.parts) {
    q.t += dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.bounce && q.y > GY && q.vy > 0) { q.y = GY; q.vy *= -q.bounce; q.vx *= 0.6; }
  }
  RND.parts = RND.parts.filter(q => q.t < q.life);
  RND.tracers = RND.tracers.filter(t => (t.t += dt) < t.life);
  RND.flashes = RND.flashes.filter(f => (f.t += dt) < f.life);
  RND.booms = RND.booms.filter(b => (b.t += dt) < 0.6);
  for (const c of RND.corpses) c.t += dt;
  RND.corpses = RND.corpses.filter(c => c.t < 9);
  RND.floats = RND.floats.filter(f => { f.t += dt; f.y -= dt * 24; return f.t < 2.2; });
  CAM.shake = Math.max(0, CAM.shake - dt * 22);
  RND.hurtV = Math.max(0, RND.hurtV - dt * 1.6);
  for (const p of W.p) { if (p.recoilT > 0) p.recoilT -= dt; if (p.shoveT > 0) p.shoveT -= dt; }
}

/* ---------- lighting ---------- */
function drawLights(dk, lights) {
  const blood = W.phase === 'night' && isBlood(W.night);
  const w = LC.width, h = LC.height, k = w / VW;
  lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, w, h);
  lx.fillStyle = blood ? `rgba(22,3,6,${dk})` : `rgba(4,6,14,${dk})`; lx.fillRect(0, 0, w, h);
  lx.globalCompositeOperation = 'destination-out';
  for (const L of lights) {
    const [sx, sy] = w2s(L.x, L.y), R = L.r * CAM.s * k, X = sx * k, Y = sy * k;
    if (X < -R || X > w + R || Y < -R || Y > h + R) continue;
    if (L.cone != null) {
      const gr = lx.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, `rgba(0,0,0,${L.a})`); gr.addColorStop(0.7, `rgba(0,0,0,${L.a * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = gr; lx.beginPath(); lx.moveTo(X, Y); lx.arc(X, Y, R, L.cone - L.wd, L.cone + L.wd); lx.closePath(); lx.fill();
    } else {
      const gr = lx.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, `rgba(0,0,0,${L.a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = gr; lx.fillRect(X - R, Y - R, R * 2, R * 2);
    }
  }
  lx.globalCompositeOperation = 'source-over';
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.imageSmoothingEnabled = true;
  cx.drawImage(LC, 0, 0, VW, VH);
  // warm glow of light sources
  cx.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    if (!L.glow) continue;
    const [sx, sy] = w2s(L.x, L.y), R = L.r * CAM.s * 0.6;
    const gr = cx.createRadialGradient(sx, sy, 0, sx, sy, R); gr.addColorStop(0, L.glow); gr.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = gr; cx.fillRect(sx - R, sy - R, R * 2, R * 2);
  }
  cx.globalCompositeOperation = 'source-over';
}

/* ---------- main draw ---------- */
let BUILD_HOVER = null; // {tx,ty,ok,why}
function draw(dt) {
  if (!W || !RND.tex) return;
  stepFx(dt);
  const me = W.p[ME];
  // camera
  CAM.s = lerp(CAM.s, camScale(), Math.min(1, dt * 6));
  const halfW = VW / 2 / CAM.s, halfH = VH / 2 / CAM.s;
  let tx = me.x + CAM.lookX, ty = me.y - 1.6 * T + CAM.lookY;
  if (me.dead) { const o = W.p.find(p => !p.dead && !p.gone); if (o) { tx = o.x; ty = o.y - 1.6 * T; } }
  CAM.x = lerp(CAM.x, tx, Math.min(1, dt * 7)); CAM.y = lerp(CAM.y, ty, Math.min(1, dt * 7));
  const portrait = VH > VW * 1.1, bottomUI = INP.touch ? (portrait ? (me.build ? 330 : 270) : VH < 500 ? 70 : 90) : (me.build ? 110 : 40);
  CAM.x = clamp(CAM.x, halfW, MW * T - halfW); CAM.y = Math.min(CAM.y, GY - halfH + bottomUI / CAM.s + 1.5 * T);
  const shx = CAM.shake ? frnd(-CAM.shake, CAM.shake) : 0, shy = CAM.shake ? frnd(-CAM.shake, CAM.shake) : 0;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const dk = darkness();
  drawSky(dk);
  // world space
  cx.setTransform(DPR * CAM.s, 0, 0, DPR * CAM.s, DPR * (VW / 2 - CAM.x * CAM.s + shx), DPR * (VH / 2 - CAM.y * CAM.s + shy));
  const x0 = Math.max(0, Math.floor((CAM.x - halfW) / T) - 1), x1 = Math.min(MW - 1, Math.ceil((CAM.x + halfW) / T) + 1);
  const y0 = Math.max(0, Math.floor((CAM.y - halfH) / T) - 1), y1 = Math.min(MH - 1, Math.ceil((CAM.y + halfH) / T) + 1);
  // build zone posts
  cx.fillStyle = 'rgba(255,200,90,.35)';
  for (const c of [BZ0, BZ1]) { cx.fillRect(c * T - 2, GY - 46, 4, 46); cx.fillStyle = '#c9a23a'; cx.fillRect(c * T - 7, GY - 50, 14, 8); cx.fillStyle = 'rgba(255,200,90,.35)'; }
  // interior backdrop
  if (RND.bgDirty) rebuildBg();
  cx.fillStyle = 'rgba(28,24,26,.72)';
  for (const [bx, by, n] of RND.bgRects) if (bx >= x0 && bx <= x1) cx.fillRect(bx * T, by * T, T + 0.5, n * T);
  cx.fillStyle = 'rgba(0,0,0,.18)';
  for (const [bx, by, n] of RND.bgRects) if (bx >= x0 && bx <= x1 && (bx % 3 === 0)) cx.fillRect(bx * T + 14, by * T, 2, n * T);
  // spots, radio, bench, corpses
  for (const s of W.spots) if (s.x > (x0 - 3) * T && s.x < (x1 + 3) * T) drawSpot(s);
  drawBench(); drawRadio();
  for (const c of RND.corpses) drawCorpse(c);
  // tiles
  const TX = RND.tex;
  for (let ty = y0; ty <= y1; ty++) for (let txx = x0; txx <= x1; txx++) {
    const i = ty * MW + txx, t = W.tiles[i]; if (!t) continue;
    const v = (txx * 7 + ty * 13) % 3;
    if (t === DIRT) {
      cx.drawImage(TX[DIRT][v], txx * T, ty * T, T + 0.5, T + 0.5);
      if (ty === GR) {
        const road = txx >= BZ0 - 6 && txx < BZ1 + 6;
        cx.fillStyle = road ? '#2c2c2f' : '#4b4232'; cx.fillRect(txx * T, ty * T, T + 0.5, 7);
        if (road && txx % 3 === 0) { cx.fillStyle = 'rgba(220,200,120,.4)'; cx.fillRect(txx * T + 4, ty * T + 2, 14, 2); }
        if (!road && hash2(txx, 3) < 0.6) { cx.strokeStyle = '#6b6440'; cx.lineWidth = 1.2; cx.beginPath(); for (let k = 0; k < 3; k++) { const gx = txx * T + hash2(txx, k) * T; cx.moveTo(gx, ty * T); cx.lineTo(gx + (hash2(k, txx) - 0.5) * 6, ty * T - 5 - hash2(txx, k + 5) * 6); } cx.stroke(); }
      }
      continue;
    }
    const img = TX[t] && TX[t][v]; if (!img) continue;
    cx.drawImage(img, txx * T, ty * T, T + 0.3, T + 0.3);
    const hpR = W.thp[i] / TF[t].hp;
    if (hpR < 0.8) { const lv = hpR < 0.3 ? 2 : hpR < 0.55 ? 1 : 0; cx.globalAlpha = TF[t].plat ? 0.7 : 0.85; cx.drawImage(TX.crack[lv], txx * T, ty * T, T, TF[t].plat ? T * 0.3 : T); cx.globalAlpha = 1; }
    if (t === 7) { // door frame continuity + handle
      if (tileAt(txx, ty + 1) !== 7) { cx.fillStyle = '#c9b089'; cx.fillRect(txx * T + (txx < RADIO.c0 ? T - 9 : 6), ty * T + 4, 3, 3); }
    }
  }
  // projectiles
  for (const b of W.proj) {
    if (b.k === 'nade') { cx.fillStyle = '#3c4a32'; cx.beginPath(); cx.arc(b.x, b.y, 4.5, 0, 7); cx.fill(); cx.fillStyle = '#888'; cx.fillRect(b.x - 1, b.y - 7, 2, 3); if (Math.sin(W.t * 30) > 0) { cx.fillStyle = '#ff4b3e'; cx.fillRect(b.x - 1, b.y - 1, 2, 2); } }
    else { cx.fillStyle = '#9dff3a'; cx.globalAlpha = 0.85; cx.beginPath(); cx.arc(b.x, b.y, 5, 0, 7); cx.fill(); cx.globalAlpha = 0.4; cx.beginPath(); cx.arc(b.x - b.vx * 0.02, b.y - b.vy * 0.02, 4, 0, 7); cx.fill(); cx.globalAlpha = 1; }
  }
  // entities
  RND.eyes = [];
  for (const z of W.zs) if (z.x > (x0 - 3) * T && z.x < (x1 + 3) * T) drawZombie(z);
  for (const p of W.p) drawPlayer(p, p.i === ME);
  // particles
  for (const q of RND.parts) {
    const a = 1 - q.t / q.life; cx.globalAlpha = q.shape === 2 ? a * 0.8 : Math.min(1, a * 2);
    cx.fillStyle = q.col;
    if (q.shape === 2) { cx.beginPath(); cx.arc(q.x, q.y, q.s * (1 + q.t * 1.5), 0, 7); cx.fill(); }
    else if (q.shape === 1) { cx.save(); cx.translate(q.x, q.y); cx.rotate((q.rot || 0) + q.t * 8); cx.fillRect(-q.s / 2, -q.s / 2, q.s, q.s); cx.restore(); }
    else cx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
  }
  cx.globalAlpha = 1;
  // tracers
  cx.lineCap = 'round';
  for (const t of RND.tracers) {
    const a = 1 - t.t / t.life;
    cx.strokeStyle = t.sn ? `rgba(255,240,200,${a})` : `rgba(255,226,150,${a * 0.85})`; cx.lineWidth = (t.sn ? 2.6 : 1.5) / Math.max(0.6, CAM.s);
    cx.beginPath(); cx.moveTo(lerp(t.x, t.x2, t.t / t.life * 0.6), lerp(t.y, t.y2, t.t / t.life * 0.6)); cx.lineTo(t.x2, t.y2); cx.stroke();
  }
  for (const f of RND.flashes) {
    const a = 1 - f.t / f.life; cx.fillStyle = `rgba(255,220,120,${a})`;
    cx.save(); cx.translate(f.x, f.y); cx.rotate(f.a); cx.beginPath(); cx.moveTo(0, -4); cx.lineTo(f.big ? 22 : 13, 0); cx.lineTo(0, 4); cx.closePath(); cx.fill(); cx.beginPath(); cx.arc(0, 0, f.big ? 7 : 4, 0, 7); cx.fill(); cx.restore();
  }
  for (const b of RND.booms) {
    const a = 1 - b.t / 0.6, r = BAL.nadeR * T * (0.4 + b.t * 1.4);
    const gr = cx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r); gr.addColorStop(0, `rgba(255,240,180,${a})`); gr.addColorStop(0.4, `rgba(255,140,40,${a * 0.8})`); gr.addColorStop(1, 'rgba(80,30,10,0)');
    cx.fillStyle = gr; cx.beginPath(); cx.arc(b.x, b.y, r, 0, 7); cx.fill();
  }
  // build overlay
  if (me.build && !me.down && !me.dead) drawBuildOverlay(me, x0, x1, y0, y1);
  // lights
  if (dk > 0.02) {
    const lights = [];
    for (const p of W.p) {
      if (p.gone || p.dead) continue;
      const sy = p.y - (p.down ? 0.5 : 1.3) * T;
      lights.push({ x: p.x, y: sy, r: 4 * T, a: 0.85 });
      if (!p.down) lights.push({ x: p.x, y: sy, r: 12 * T, a: 0.95, cone: p.aim, wd: 0.42 });
    }
    for (let ty = 0; ty < GR; ty++) for (let txx = BZ0; txx < BZ1; txx++) if (W.tiles[ty * MW + txx] === 10) lights.push({ x: txx * T + T / 2, y: ty * T + T * 0.4, r: 7 * T, a: 0.95, glow: 'rgba(255,220,140,.45)' });
    lights.push({ x: RADIO.x + 26, y: GY - 81, r: 1.6 * T, a: Math.sin(W.t * 6) > 0 ? 0.6 : 0.2, glow: 'rgba(255,60,50,.35)' });
    lights.push({ x: RADIO.x, y: GY - 30, r: 2.4 * T, a: 0.5 });
    for (const f of RND.flashes) lights.push({ x: f.x, y: f.y, r: (f.big ? 7 : 5) * T, a: 0.9 * (1 - f.t / f.life), glow: 'rgba(255,200,100,.25)' });
    for (const b of RND.booms) lights.push({ x: b.x, y: b.y, r: 10 * T, a: 1 - b.t / 0.6, glow: 'rgba(255,150,60,.5)' });
    for (const b of W.proj) if (b.k === 'acid') lights.push({ x: b.x, y: b.y, r: 1.4 * T, a: 0.6, glow: 'rgba(150,255,60,.35)' });
    drawLights(dk, lights);
    // glowing eyes on top of the dark
    cx.setTransform(DPR * CAM.s, 0, 0, DPR * CAM.s, DPR * (VW / 2 - CAM.x * CAM.s + shx), DPR * (VH / 2 - CAM.y * CAM.s + shy));
    cx.globalAlpha = Math.min(1, dk * 1.4);
    for (const [ex, ey, col, r] of RND.eyes) { cx.fillStyle = col; cx.beginPath(); cx.arc(ex, ey, r, 0, 7); cx.fill(); }
    cx.globalAlpha = 1;
  }
  // world-space text
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.textAlign = 'center'; cx.font = '700 14px system-ui,sans-serif';
  for (const f of RND.floats) { const [sx, sy] = w2s(f.x, f.y); cx.globalAlpha = clamp(2.2 - f.t, 0, 1); cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillText(f.text, sx + 1, sy + 1); cx.fillStyle = f.col; cx.fillText(f.text, sx, sy); }
  cx.globalAlpha = 1;
  // teammate off-screen arrow
  for (const p of W.p) {
    if (p.i === ME || p.gone || p.dead) continue;
    const [sx, sy] = w2s(p.x, p.y - T);
    if (sx > 0 && sx < VW && sy > 0 && sy < VH) continue;
    const ax = clamp(sx, 30, VW - 30), ay = clamp(sy, 70, VH - 70), an = Math.atan2(sy - ay, sx - ax);
    cx.save(); cx.translate(ax, ay); cx.rotate(an); cx.fillStyle = p.down ? '#ff5a4a' : PCOL[p.i % 2].j; cx.beginPath(); cx.moveTo(14, 0); cx.lineTo(-6, -9); cx.lineTo(-6, 9); cx.fill(); cx.restore();
  }
  // zombies off-screen (night): edge markers with counts
  if ((W.phase === 'night' || W.zs.length) && !(DBG && DBG.cover)) {
    let nl = 0, nr = 0;
    for (const z of W.zs) { const sx = (z.x - CAM.x) * CAM.s + VW / 2; if (sx < -10) nl++; else if (sx > VW + 10) nr++; }
    const gy = clamp((GY - T - CAM.y) * CAM.s + VH / 2, 120, VH - 120);
    cx.font = '700 14px system-ui,sans-serif'; cx.textAlign = 'center';
    for (const [n, side] of [[nl, -1], [nr, 1]]) {
      if (!n) continue;
      const ex = side < 0 ? 18 : VW - 18, pul = 0.6 + Math.sin(W.t * 5) * 0.25;
      cx.fillStyle = `rgba(226,72,61,${pul})`; cx.beginPath(); cx.moveTo(ex + side * 8, gy); cx.lineTo(ex - side * 6, gy - 11); cx.lineTo(ex - side * 6, gy + 11); cx.fill();
      cx.fillStyle = '#ffd0c8'; cx.fillText(n, ex - side * 6, gy - 16);
    }
  }
  // vignette / damage
  const blood = W.phase === 'night' && isBlood(W.night);
  if (RND.hurtV > 0 || me.down || blood) {
    const a = Math.max(RND.hurtV * 0.55, me.down ? 0.45 + Math.sin(W.t * 4) * 0.1 : 0, blood ? 0.25 : 0);
    const gr = cx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.3, VW / 2, VH / 2, Math.max(VW, VH) * 0.75);
    gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(150,0,0,${a})`); cx.fillStyle = gr; cx.fillRect(0, 0, VW, VH);
  }
}
function drawBuildOverlay(me, x0, x1, y0, y1) {
  // support coloring
  for (let ty = Math.max(y0, 2); ty <= Math.min(y1, GR - 1); ty++) for (let txx = Math.max(x0, BZ0); txx <= Math.min(x1, BZ1 - 1); txx++) {
    const i = ty * MW + txx, t = W.tiles[i]; if (!t || !TF[t].st) continue;
    const r = W.stab[i] / TF[t].cap; cx.fillStyle = r > 0.6 ? 'rgba(90,220,110,.55)' : r > 0.3 ? 'rgba(240,200,60,.6)' : 'rgba(240,80,60,.7)';
    cx.fillRect(txx * T + 3, ty * T + T - 6, (T - 6) * r, 3);
  }
  // zone shading
  cx.fillStyle = 'rgba(255,210,100,.05)'; cx.fillRect(BZ0 * T, 2 * T, (BZ1 - BZ0) * T, (GR - 2) * T);
  cx.strokeStyle = 'rgba(255,210,100,.35)'; cx.lineWidth = 1.5; cx.setLineDash([8, 6]); cx.strokeRect(BZ0 * T, 2 * T, (BZ1 - BZ0) * T, (GR - 2) * T); cx.setLineDash([]);
  // reach circle
  cx.strokeStyle = 'rgba(255,255,255,.18)'; cx.beginPath(); cx.arc(me.x, me.y - me.h / 2, BAL.pReach * T, 0, 7); cx.stroke();
  const H = BUILD_HOVER; if (!H) return;
  const t = tileAt(H.tx, H.ty);
  cx.lineWidth = 2;
  if (me.demo) { cx.strokeStyle = t && t !== DIRT ? '#ff6b5a' : 'rgba(255,255,255,.3)'; cx.strokeRect(H.tx * T + 1, H.ty * T + 1, T - 2, T - 2); if (t && t !== DIRT) { cx.beginPath(); cx.moveTo(H.tx * T + 6, H.ty * T + 6); cx.lineTo(H.tx * T + T - 6, H.ty * T + T - 6); cx.moveTo(H.tx * T + T - 6, H.ty * T + 6); cx.lineTo(H.tx * T + 6, H.ty * T + T - 6); cx.stroke(); } return; }
  if (t && t !== DIRT) { cx.strokeStyle = W.thp[ix(H.tx, H.ty)] < TF[t].hp ? '#7fd3ff' : 'rgba(255,255,255,.35)'; cx.strokeRect(H.tx * T + 1, H.ty * T + 1, T - 2, T - 2); return; }
  cx.globalAlpha = 0.55; const img = RND.tex[me.sel] && RND.tex[me.sel][0]; if (img) cx.drawImage(img, H.tx * T, H.ty * T, T, T); cx.globalAlpha = 1;
  cx.strokeStyle = H.ok ? '#7dff8a' : '#ff5a4a'; cx.strokeRect(H.tx * T + 1, H.ty * T + 1, T - 2, T - 2);
}

/* ---------- events -> effects (+ guest-side state application) ---------- */
const sfxThr = {};
function thr(k, s) { const n = performance.now(); if (sfxThr[k] && n - sfxThr[k] < s * 1000) return false; sfxThr[k] = n; return true; }
function fxEvent(e) {
  if (!W) return;
  const guest = NETROLE === 'guest';
  switch (e.k) {
    case 'shot': {
      if (guest && e.o === ME) break; // predicted locally
      shotFx(e.o, e.w, e.x, e.y, e.e);
      break;
    }
    case 'hit': blood(e.x, e.y, e.h ? 9 : 5, e.g); if (thr('flesh', 0.05)) sfx(e.h ? 'head' : 'flesh', e.x, e.y); break;
    case 'zdie':
      RND.corpses.push({ x: e.x, y: e.y, k: e.z, f: e.f || 1, t: 0, seed: e.id * 7, pool: 1 }); if (RND.corpses.length > 70) RND.corpses.shift();
      blood(e.x, e.y - ZT[e.z].h * T * 0.6, 10, e.z === 'spitter');
      if (thr('zdie', 0.12)) sfx(e.z === 'brute' || e.z === 'boss' ? 'bigdie' : 'zdie', e.x, e.y);
      if (guest && W.zs) { const z = W.zs.find(z => z.id === e.id); if (z) z.hp = 0; }
      break;
    case 'tile': {
      const prev = W.tiles[e.i];
      if (guest) { W.tiles[e.i] = e.v; W.thp[e.i] = e.v ? TF[e.v].hp : 0; recomputeStab(); }
      RND.bgDirty = true;
      const x = (e.i % MW + 0.5) * T, y = (((e.i / MW) | 0) + 0.5) * T;
      if (e.c === 'brk' || e.c === 'fall') { debris(x, y, TCOL[prev] || '#777', e.c === 'fall' ? 6 : 10); if (thr('brk', 0.06)) sfx(e.c === 'fall' ? 'fall' : prev === 3 || prev === 5 || prev === 8 ? 'brkMetal' : 'brk', x, y); }
      else if (e.c === 'build') { sfx('build', x, y); addP({ x, y: y + T / 2, vx: 0, vy: -30, g: 0, col: 'rgba(200,190,170,.4)', s: 8, life: 0.4, shape: 2 }); }
      else if (e.c === 'demo') { sfx('demo', x, y); debris(x, y, TCOL[prev] || '#777', 4); }
      break;
    }
    case 'bash': { const x = (e.i % MW + 0.5) * T, y = (((e.i / MW) | 0) + 0.5) * T; if (thr('bash' + e.i, 0.15)) { sfx(e.z === 'brute' || e.z === 'boss' ? 'smash' : 'bash', x, y); addP({ x: x + frnd(-8, 8), y: y + frnd(-8, 8), vx: frnd(-80, 80), vy: frnd(-120, 0), col: TCOL[W.tiles[e.i]] || '#888', s: 2.5, life: 0.5, shape: 1, bounce: 0.3 }); if (e.z === 'brute' || e.z === 'boss') shake(x, y, 5); } break; }
    case 'collapse': { const x = (e.i % MW + 0.5) * T, y = (((e.i / MW) | 0) + 0.5) * T; sfx('collapse', x, y); shake(x, y, 9); break; }
    case 'repair': sfx('build', (e.i % MW + 0.5) * T, ((e.i / MW) | 0) * T); break;
    case 'spot': if (guest) W.spots[e.i].searched = !!e.v; break;
    case 'loot': RND.floats.push({ x: e.x, y: e.y, text: e.text, col: '#ffd76a', t: 0 }); if (e.p === ME || e.p < 0) sfx('loot'); break;
    case 'phurt': if (e.p === ME) { RND.hurtV = Math.min(1, RND.hurtV + 0.5); CAM.shake = Math.max(CAM.shake, 4); if (thr('hurt', 0.25)) sfx('hurt'); } break;
    case 'down': sfx('down', W.p[e.p].x, W.p[e.p].y); uiMsg(e.p === ME ? (W.p.length > 1 ? '你倒地了！等队友扶你，或按 H 用医疗包自救' : '你倒地了！按 H 用医疗包自救') : W.p[e.p].name + ' 倒地了！快去扶（按住 E）', '#ff6b5a'); break;
    case 'revive': sfx('revive'); uiMsg(e.p === e.by ? W.p[e.p].name + ' 自救成功' : W.p[e.by].name + ' 扶起了 ' + W.p[e.p].name, '#8fe39a'); break;
    case 'dead': uiMsg(W.p[e.p].name + ' 阵亡了，天亮后会在电台旁复活', '#ff6b5a'); break;
    case 'tp': if (guest && e.p === ME) { const p = W.p[ME]; p.x = e.x; p.y = e.y; p.vx = p.vy = 0; } break;
    case 'kb': if (guest && e.p === ME) { const p = W.p[ME]; p.vx = e.vx; p.vy = e.vy; p.kbT = 0.25; p.climbing = false; } break;
    case 'night': sfx(e.blood ? 'blood' : 'night'); banner(e.blood ? '第 ' + e.n + ' 夜 · 血月' : '第 ' + e.n + ' 夜', e.blood ? '尸潮规模大增，巨尸出没' : '守住电台，活到天亮', e.blood ? '#ff5a4a' : '#ffd27a'); break;
    case 'dawn': $('over').classList.add('hidden'); sfx('dawn'); banner('天亮了', '撑过了第 ' + e.n + ' 夜 · 出去搜物资、加固房子', '#ffe7b0'); break;
    case 'say': uiMsg(e.text, e.col); break;
    case 'craft': if (e.p === ME) { sfx('craft'); toast('制作完成：' + e.name); } break;
    case 'deny': if (e.p === ME) { if (thr('deny', 0.3)) { sfx('deny'); toast(e.why, '#ff8a7a'); } } break;
    case 'boom': RND.booms.push({ x: e.x, y: e.y, t: 0 }); debris(e.x, e.y, '#3a3530', 12); sfx('boom', e.x, e.y); shake(e.x, e.y, 12); break;
    case 'acid': for (let k = 0; k < 8; k++) addP({ x: e.x, y: e.y, vx: frnd(-120, 120), vy: frnd(-180, 0), col: k % 2 ? '#9dff3a' : '#5f9a20', s: 3, life: 0.5 }); sfx('acid', e.x, e.y); break;
    case 'rhit': if (thr('rhit', 0.3)) { sfx('rhit', RADIO.x, GY); for (let k = 0; k < 4; k++) addP({ x: RADIO.x + frnd(-20, 20), y: GY - frnd(10, 40), vx: frnd(-120, 120), vy: frnd(-200, -40), col: '#ffd76a', s: 2, life: 0.4 }); } break;
    case 'shove': sfx(e.n ? 'shoveHit' : 'shove', W.p[e.p].x, W.p[e.p].y); if (guest || e.p !== ME) W.p[e.p].shoveT = 0.18; break;
    case 'over': if (!W.demo && STATE.mode === 'play') showOver(e); break;
    case 'sfx': if (e.local || !(guest && e.o === ME && /reload|swap/.test(e.n))) sfx(e.n, e.x, e.y); if (e.n === 'reload' && e.o != null && W.p[e.o]) W.p[e.o].reloadVis = WPN[W.p[e.o].wpn].reload; break;
  }
}
function shotFx(o, wi, x, y, ends) {
  const p = W.p[o];
  for (const [x2, y2, wall] of ends) {
    RND.tracers.push({ x, y, x2, y2, t: 0, life: wi === 3 ? 0.16 : 0.07, sn: wi === 3 });
    if (wall) for (let k = 0; k < 3; k++) addP({ x: x2, y: y2, vx: frnd(-150, 150), vy: frnd(-150, 50), col: '#ffd76a', s: 1.6, life: 0.25 });
  }
  RND.flashes.push({ x, y, a: p ? p.aim : 0, t: 0, life: 0.05, big: wi === 1 || wi === 3 });
  if (p) { p.recoilT = 0.08; if (wi) addP({ x: p.x, y: p.y - 1.3 * T, vx: -p.face * frnd(60, 120), vy: frnd(-220, -120), col: '#c9a23a', s: 2.2, life: 0.7, bounce: 0.4, shape: 1 }); }
  sfx(WPN[wi].k, x, y);
  if (o === ME) CAM.shake = Math.max(CAM.shake, WPN[wi].shake);
}
function shake(x, y, a) { const me = W.p[ME]; const d = dist(x, y, me.x, me.y); CAM.shake = Math.max(CAM.shake, a * clamp(1 - d / (22 * T), 0, 1)); }
