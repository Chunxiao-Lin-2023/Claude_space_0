/* ================= pixel kit: canvas helpers, palette, floor tiles, wall faces =================
   Projection (3/4 top-down, camera looks north): screen x = x·PX, screen y = z·PX − y·PX·VS.
   PX = pixels per metre, VS = how much a metre of height rises on screen. */
const PX = 20, VS = 0.6;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const hash = (x, y, s = 0) => { let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 2147483647; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return (h >>> 0) / 4294967296; };
function shade(hex, k) {   // k>0 lighter, k<0 darker
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => clamp(Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)), 0, 255);
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
const mixHex = (a, b, t) => { const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), Bc = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, Bc[i], t)).toString(16).padStart(2, '0')).join(''); };
/* a rect painter bound to a context (integer pixels, null colour = skip) */
const RP = (g, ox = 0, oy = 0) => (x, y, w, h, col) => { if (!col || w <= 0 || h <= 0) return; g.fillStyle = col; g.fillRect(Math.round(ox + x), Math.round(oy + y), Math.round(w), Math.round(h)); };
const OUTLINE = [14, 10, 14];
function outlinePass(c, alpha = 255, col = OUTLINE) {
  const g = c.getContext('2d'), W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), d = im.data, src = new Uint8ClampedArray(d);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; if (src[i + 3] > 0) continue;
    const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && src[(yy * W + xx) * 4 + 3] > 60;
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = alpha; }
  }
  g.putImageData(im, 0, 0);
}
/* tint every opaque pixel of a sprite (used for silhouettes and the spirit outline) */
function tinted(c, col, a = 1) { const o = mk(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, o.width, o.height); return o; }
function speck(R, w, h, base, cols, n, s) { R(0, 0, w, h, base); for (let i = 0; i < n; i++) R((hash(i, s, 1) * w) | 0, (hash(s, i, 2) * h) | 0, 1, 1, cols[i % cols.length]); }

/* ---------- floor tiles: each painter fills a PX×PX cell at world cell (X, Y) ---------- */
const FLOORPAINT = {
  wood: (R, X, Y) => { const base = '#5e4027'; for (let r = 0; r < 4; r++) { const h = hash(X, Y * 4 + r, 1); R(0, r * 5, PX, 5, shade(base, (hash((X / 3) | 0, Y * 4 + r, 2) - 0.5) * 0.22 + (h - 0.5) * 0.05)); R(0, r * 5 + 4, PX, 1, shade(base, -0.38)); if (h < 0.3) { const cx = ((h * 997) | 0) % PX; R(cx, r * 5, 1, 4, shade(base, -0.42)); } if (h < 0.2) R(((h * 51) | 0) % 16 + 2, r * 5 + 2, 2, 1, shade(base, -0.2)); } },
  wood2: (R, X, Y) => { const a = '#4e3422', b = '#442c1c'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const odd = (i + j + X + Y) % 2; R(i * 5, j * 5, 5, 5, shade(odd ? a : b, (hash(X * 4 + i, Y * 4 + j, 3) - 0.5) * 0.07)); R(i * 5 + (odd ? 4 : 0), j * 5, 1, 5, shade(b, -0.35)); R(i * 5, j * 5 + (odd ? 0 : 4), 5, 1, shade(b, -0.3)); } },
  marble: (R, X, Y) => { const dark = (X + Y) % 2; const c = dark ? '#2a2a30' : '#b9b4a8'; R(0, 0, PX, PX, c); R(0, PX - 1, PX, 1, shade(c, -0.25)); R(PX - 1, 0, 1, PX, shade(c, -0.25)); const h = hash(X, Y, 12); R((h * 12) | 0, 4 + ((h * 37) | 0) % 10, 6, 1, shade(c, dark ? 0.12 : -0.1)); R(((h * 12) | 0) + 5, 5 + ((h * 37) | 0) % 10, 4, 1, shade(c, dark ? 0.1 : -0.08)); },
  tile: (R, X, Y) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) R(i * 10, j * 10, 10, 10, (i + j) % 2 ? '#2b2c30' : '#a9a69b'); R(0, 0, PX, 1, '#1d1d20'); R(0, 0, 1, PX, '#1d1d20'); if (hash(X, Y, 4) < 0.2) R(3, 12, 3, 1, '#6c6a60'); },
  tile2: (R, X, Y) => { R(0, 0, PX, PX, '#9fb3b0'); for (let k = 0; k < PX; k += 5) { R(k, 0, 1, PX, '#7e908e'); R(0, k, PX, 1, '#7e908e'); } if (hash(X, Y, 5) < 0.3) R(6, 6, 4, 4, '#b8c8c4'); },
  tile3: (R, X, Y) => { R(0, 0, PX, PX, '#8a9392'); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const o = j % 2 ? 2 : 0, h = hash(X * 4 + i, Y * 4 + j, 6); R(i * 5 + o, j * 5 + 1, 4, 3, h < 0.12 ? '#5d7a7c' : h > 0.9 ? '#b4bcb8' : '#a1aaa7'); } },
  stone: (R, X, Y) => { R(0, 0, PX, PX, '#3e3b37'); const o = Y % 2 ? 5 : 0; for (let i = -1; i < 2; i++) { R(o + i * 10 + 1, 1, 8, 8, shade('#5a5650', (hash(X, Y, i) - 0.5) * 0.25)); R(((o + 5) % 10) + i * 10 + 1, 11, 8, 8, shade('#5a5650', (hash(X, Y, i + 9) - 0.5) * 0.25)); } },
  concrete: (R, X, Y) => { speck(R, PX, PX, '#4e4e50', ['#5a5a5c', '#424244', '#555557'], 22, X * 97 + Y); if (hash(X, Y, 9) < 0.12) { R(4, 8, 5, 1, '#3a3a3c'); R(9, 9, 4, 1, '#3a3a3c'); } },
  attic: (R, X, Y) => { const base = '#3a2a1e'; for (let r = 0; r < 2; r++) { const h = hash(X, Y * 2 + r, 8); R(0, r * 10, PX, 10, shade(base, (h - 0.5) * 0.3)); R(0, r * 10 + 9, PX, 1, '#1a120c'); if (h < 0.12) { R(3, r * 10 + 4, 1, 1, '#5a4a3a'); } if (h > 0.85) R(((h * 300) | 0) % 14, r * 10 + 4, 4, 1, shade(base, -0.3)); if (((X + r * 3 + Y) % 5) === 0) R(0, r * 10, 1, 9, '#1e140e'); } },
  ground: (R, X, Y) => { speck(R, PX, PX, '#1e2a1c', ['#26341f', '#172115', '#2c3a22'], 26, X * 31 + Y * 7); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 40 + i); R((h * 18) | 0, (hash(Y, X, 50 + i) * 17) | 0, 1, 2, '#35462a'); } },
  path: (R, X, Y) => { speck(R, PX, PX, '#3b3631', ['#48423b', '#2f2b27'], 18, X * 13 + Y * 3); },
  roof: (R, X, Y) => { const o = Y % 2 ? 5 : 0; R(0, 0, PX, PX, '#24222a'); for (let i = -1; i < 3; i++) { R(o + i * 10, 0, 9, 9, shade('#34313b', (hash(X * 3 + i, Y, 2) - 0.5) * 0.3)); R(((o + 5) % 10) + i * 10, 10, 9, 9, shade('#34313b', (hash(X * 3 + i, Y, 7) - 0.5) * 0.3)); } R(0, 9, PX, 1, '#16151a'); R(0, 19, PX, 1, '#16151a'); },
};

/* ---------- wall faces (the south-facing side of an east-west wall) ---------- */
const WALLPAL = {
  damask: { a: '#5a1e24', b: '#7a2e30', trim: '#2a1410', pat: 'damask' }, damask2: { a: '#3a2440', b: '#54365a', trim: '#1e1420', pat: 'damask' },
  green: { a: '#28402e', b: '#365640', trim: '#1a2016', pat: 'stripe' }, red: { a: '#5c1a1a', b: '#6e2622', trim: '#2a1210', pat: 'stripe' },
  nursery: { a: '#8a8a70', b: '#a0a080', trim: '#4a4030', pat: 'nursery' }, panel: { a: '#4a3020', b: '#5e3e28', trim: '#2a1a10', pat: 'panel' },
  plaster: { a: '#706a5e', b: '#7e776a', trim: '#3a3428', pat: 'plaster' }, stone: { a: '#4a4640', b: '#5a554d', trim: '#2a2824', pat: 'stone' },
  tilewall: { a: '#a8b4ae', b: '#c0cac4', trim: '#4a5450', pat: 'tile' }, conserv: { a: '#304436', b: '#3e5a46', trim: '#1a2418', pat: 'glass' },
  studio: { a: '#6a6660', b: '#7a7670', trim: '#33302c', pat: 'studio' }, attic: { a: '#3a2a1e', b: '#4a3626', trim: '#1a120c', pat: 'planks' },
  ext: { a: '#3a2622', b: '#4a302a', trim: '#1a1210', pat: 'brick' },
};
/* paints a wall face of w×h px whose left edge is at world x0 (so patterns line up across segments) */
function paintWallFace(g, w, h, key, x0) {
  const P = WALLPAL[key] || WALLPAL.plaster, R = RP(g), base = h - 3, wains = Math.round(h * 0.34);
  R(0, 0, w, h, P.a);
  for (let x = 0; x < w; x++) {
    const X = Math.round(x0 + x);
    if (P.pat === 'damask') { const m = ((X % 10) + 10) % 10; for (let y = 3; y < base - wains; y += 9) { const yy = y + ((Math.floor(X / 10) % 2) ? 4 : 0); if (m === 4 || m === 5) R(x, yy, 1, 3, P.b); if (m === 3 || m === 6) R(x, yy + 1, 1, 1, P.b); } }
    if (P.pat === 'stripe') { if (((X % 8) + 8) % 8 < 3) R(x, 0, 1, base - wains, P.b); }
    if (P.pat === 'nursery') { if (((X % 6) + 6) % 6 < 3) R(x, 0, 1, base - wains, P.b); if (((X % 14) + 14) % 14 === 7) { R(x, 7, 1, 2, '#c8a84a'); } }
    if (P.pat === 'plaster') { if (hash(X, 0, 4) < 0.05) R(x, (hash(X, 1, 5) * (h - 8)) | 0, 1, 3, shade(P.a, -0.2)); }
    if (P.pat === 'tile') { if (((X % 6) + 6) % 6 === 0) R(x, 0, 1, base, shade(P.a, -0.18)); }
    if (P.pat === 'studio') { if (hash(X, 2, 6) < 0.04) R(x, 4 + ((hash(X, 3, 7) * (h - 12)) | 0), 2, 2, pick2(['#8a3a3a', '#3a5a8a', '#c8a848'], X)); }
    if (P.pat === 'planks') { if (((X % 9) + 9) % 9 === 0) R(x, 0, 1, h, P.trim); if (hash(X, 9, 1) < 0.03) R(x, (hash(X, 4, 2) * h) | 0, 1, 1, '#7a6a55'); }
    if (P.pat === 'brick') { for (let y = 0; y < h; y += 4) { const off = (y / 4) % 2 ? 4 : 0; if (((X + off) % 8 + 8) % 8 === 0) R(x, y, 1, 3, P.trim); } }
    if (P.pat === 'glass') { if (((X % 10) + 10) % 10 === 0) R(x, 0, 1, base, '#1a2418'); }
    if (P.pat === 'stone') { for (let y = 0; y < h; y += 6) { const off = (y / 6) % 2 ? 5 : 0; if (((X + off) % 10 + 10) % 10 === 0) R(x, y, 1, 5, P.trim); } }
  }
  if (P.pat === 'tile') for (let y = 0; y < base; y += 6) R(0, y, w, 1, shade(P.a, -0.15));
  if (P.pat === 'brick') for (let y = 0; y < h; y += 4) R(0, y + 3, w, 1, P.trim);
  if (P.pat === 'stone') for (let y = 0; y < h; y += 6) R(0, y + 5, w, 1, P.trim);
  if (P.pat === 'glass') { R(0, 0, w, base, 'rgba(120,170,150,0.25)'); for (let x = 0; x < w; x++) if (hash(Math.round(x0 + x), 7, 3) < 0.25) R(x, base - 4 - ((hash(Math.round(x0 + x), 8, 1) * 8) | 0), 1, 4, '#2e5a34'); }
  if (P.pat === 'panel') { for (let x = 0; x < w; x++) { const X = Math.round(x0 + x); if (((X % 12) + 12) % 12 === 0) R(x, 2, 1, base - 2, P.trim); if (((X % 12) + 12) % 12 === 1) R(x, 2, 1, base - 2, P.b); } R(0, 2, w, 1, P.b); }
  else if (!['tile', 'brick', 'stone', 'planks', 'glass'].includes(P.pat)) { R(0, base - wains, w, wains, '#3a2618'); R(0, base - wains, w, 1, '#5a3e28'); R(0, base - wains + 1, w, 1, '#24160e'); for (let x = 0; x < w; x++) if (((Math.round(x0 + x) % 14) + 14) % 14 === 0) R(x, base - wains + 3, 1, wains - 4, '#2a1a10'); }
  R(0, base, w, 3, P.trim); R(0, 0, w, 1, 'rgba(0,0,0,0.35)');
  // grime gradient toward the floor
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
const pick2 = (a, k) => a[Math.abs(k | 0) % a.length];
const WALLTOP = '#141016', WALLTOP_EDGE = '#2a2228';
/* tiny props can compute negative radii; clamp instead of throwing */
{ const P = CanvasRenderingContext2D.prototype, e0 = P.ellipse, a0 = P.arc; P.ellipse = function (x, y, rx, ry, ...r) { return e0.call(this, x, y, Math.max(0.5, rx), Math.max(0.5, ry), ...r); }; P.arc = function (x, y, r, ...o) { return a0.call(this, x, y, Math.max(0.5, r), ...o); }; }
