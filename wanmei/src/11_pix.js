/* ================= pixel-art toolkit =================
   Sprites are built in an RGBA buffer from shaded primitives (lit from the upper left, 5-tone hue-shifted ramps),
   each body part can get its own selective outline, then the buffer becomes a small canvas that is blitted 1:1
   onto the low-resolution game canvas. */
const INKC = [26, 16, 24];
let PIXLW = 1; // line-width multiplier while rendering vectors for pixelisation
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const bayer = (x, y) => BAYER4[(y & 3) * 4 + (x & 3)];
const LGT = (() => { const v = [-0.48, -0.6, 0.64], n = Math.hypot(...v); return v.map(a => a / n); })();
function toRGB(c) { if (Array.isArray(c)) return c; return rgbOf(hex(c)); }
function rgb2hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2rgb([h, s, l]) { h = ((h % 360) + 360) % 360 / 360; const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; } const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [Math.round(f(p, q, h + 1 / 3) * 255), Math.round(f(p, q, h) * 255), Math.round(f(p, q, h - 1 / 3) * 255)]; }
function hueTo(h, t, k) { let d = ((t - h + 540) % 360) - 180; return h + d * k; }
const _ramps = new Map();
/* 5 tones: 0 deep shadow, 1 shadow, 2 base, 3 light, 4 highlight. Shadows drift toward violet, lights toward warm yellow. */
function ramp(c, o = {}) {
  const key = (typeof c === 'string' ? c : JSON.stringify(c)) + (o.soft ? 's' : '') + (o.cool ? 'c' : ''); let R = _ramps.get(key); if (R) return R;
  const [h, s, l] = rgb2hsl(toRGB(c)); R = [];
  for (let k = -2; k <= 2; k++) {
    if (k === 0) { R.push(toRGB(c)); continue; }
    if (k < 0) { const a = -k * (o.soft ? 0.7 : 1); R.push(hsl2rgb([hueTo(h, o.cool ? 220 : 255, 0.09 * a), clamp(s + 0.06 * a, 0, 1), clamp(l * (1 - 0.2 * a), 0, 1)])); }
    else { const a = k * (o.soft ? 0.7 : 1); R.push(hsl2rgb([hueTo(h, 52, 0.07 * a), clamp(s - 0.03 * a, 0, 1), clamp(l + (1 - l) * 0.26 * a, 0, 1)])); }
  }
  R = [R[0], R[1], R[2], R[3], R[4]]; _ramps.set(key, R); return R;
}
const rampOf = c => Array.isArray(c) && Array.isArray(c[0]) ? c : ramp(c);
function toneOf(nx, ny, nz, o) { let l = nx * LGT[0] + ny * LGT[1] + nz * LGT[2] + (o.bias || 0); let t = l > 0.86 ? 4 : l > 0.5 ? 3 : l > 0.06 ? 2 : l > -0.36 ? 1 : 0; if (o.max != null && t > o.max) t = o.max; if (o.min != null && t < o.min) t = o.min; return t; }
class PX {
  constructor(w, h) { this.w = w | 0; this.h = h | 0; this.d = new Uint8ClampedArray(this.w * this.h * 4); }
  put(x, y, c, a = 255) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a; }
  pc(x, y, col) { this.put(x, y, toRGB(col)); }
  alpha(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[(y * this.w + x) * 4 + 3]; }
  rgbAt(x, y) { const i = (y * this.w + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2]]; }
  rect(x, y, w, h, col, t) { const c = Array.isArray(col) && Array.isArray(col[0]) ? col[t ?? 2] : toRGB(col); x = Math.round(x); y = Math.round(y); for (let j = 0; j < Math.round(h); j++) for (let i = 0; i < Math.round(w); i++) this.put(x + i, y + j, c); }
  /* shaded ellipse (a sphere-ish blob) */
  ell(cx, cy, rx, ry, col, o = {}) {
    const R = rampOf(col), x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / Math.max(0.5, rx), ny = (y + 0.5 - cy) / Math.max(0.5, ry), r2 = nx * nx + ny * ny; if (r2 > 1) continue;
      if (o.clip && !o.clip(x, y)) continue;
      const t = o.flat != null ? o.flat : toneOf(nx, ny, Math.sqrt(1 - r2), o); this.put(x, y, R[o.dither && t < 4 && bayer(x, y) < o.dither ? t + 1 : t]);
    }
  }
  /* capsule / limb from (x0,y0) radius r0 to (x1,y1) radius r1, shaded like a cylinder */
  cap(x0, y0, x1, y1, r0, r1, col, o = {}) {
    const R = rampOf(col), dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-6, m = Math.max(r0, r1) + 1;
    for (let y = Math.floor(Math.min(y0, y1) - m); y <= Math.ceil(Math.max(y0, y1) + m); y++) for (let x = Math.floor(Math.min(x0, x1) - m); x <= Math.ceil(Math.max(x0, x1) + m); x++) {
      const px = x + 0.5, py = y + 0.5; let t = ((px - x0) * dx + (py - y0) * dy) / L2; t = clamp(t, 0, 1); const qx = x0 + dx * t, qy = y0 + dy * t, r = lerp(r0, r1, t), ex = px - qx, ey = py - qy, d2 = ex * ex + ey * ey; if (d2 > r * r) continue;
      if (o.clip && !o.clip(x, y)) continue;
      const nx = ex / Math.max(0.5, r), ny = ey / Math.max(0.5, r), nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); this.put(x, y, R[o.flat != null ? o.flat : toneOf(nx, ny * (o.round ? 1 : 0.4), nz, o)]);
    }
  }
  /* filled polygon; shading: flat tone, or vertical/horizontal gradient bands */
  poly(pts, col, o = {}) {
    const R = rampOf(col); let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; for (const [x, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const py = y + 0.5, xs = []; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [ax, ay] = pts[i], [bx, by] = pts[j]; if ((ay > py) !== (by > py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); } xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) { if (o.clip && !o.clip(x, y)) continue; let t = o.flat ?? 2; if (o.grad === 'v') t = clamp(Math.round(lerp(o.g0 ?? 3, o.g1 ?? 1, (py - y0) / Math.max(1, y1 - y0)) + (o.dither ? bayer(x, y) - 0.5 : 0)), 0, 4); else if (o.grad === 'h') t = clamp(Math.round(lerp(o.g0 ?? 3, o.g1 ?? 1, (x + 0.5 - x0) / Math.max(1, x1 - x0)) + (o.dither ? bayer(x, y) - 0.5 : 0)), 0, 4); this.put(x, y, R[t]); } }
  }
  line(x0, y0, x1, y1, col, t = 2) { const c = Array.isArray(col) && Array.isArray(col[0]) ? col[t] : toRGB(col); x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (; ;) { this.put(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  /* selective outline: transparent pixels touching the shape get a dark version of the neighbour colour */
  outline(o = {}) {
    const W = this.w, H = this.h, src = new Uint8ClampedArray(this.d), ink = o.ink ? toRGB(o.ink) : null, k = o.k ?? 0.28, diag = !!o.diag;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (src[i + 3] > 0) continue; let n = -1;
      const tst = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= W || yy >= H) return; const j = (yy * W + xx) * 4; if (src[j + 3] > 100 && n < 0) n = j; };
      tst(x - 1, y); tst(x + 1, y); tst(x, y - 1); tst(x, y + 1); if (diag) { tst(x - 1, y - 1); tst(x + 1, y - 1); tst(x - 1, y + 1); tst(x + 1, y + 1); }
      if (n < 0) continue;
      if (ink) { this.d[i] = ink[0]; this.d[i + 1] = ink[1]; this.d[i + 2] = ink[2]; } else { this.d[i] = src[n] * k + 14 * (1 - k); this.d[i + 1] = src[n + 1] * k + 8 * (1 - k); this.d[i + 2] = src[n + 2] * k + 18 * (1 - k); }
      this.d[i + 3] = o.a ?? 255;
    }
  }
  /* draw a part in its own layer, outline it, composite on top */
  part(fn, o = {}) { const L = new PX(this.w, this.h); fn(L); if (o.outline !== false) L.outline(o); this.over(L); return L; }
  over(L, dx = 0, dy = 0) { const W = this.w; for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const j = (y * L.w + x) * 4; if (L.d[j + 3] === 0) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= this.h) continue; const i = (Y * W + X) * 4; this.d[i] = L.d[j]; this.d[i + 1] = L.d[j + 1]; this.d[i + 2] = L.d[j + 2]; this.d[i + 3] = L.d[j + 3]; } }
  /* recolour already-drawn pixels of the buffer inside a region (e.g. cast shadows, stripes) */
  tint(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = (y * this.w + x) * 4; if (!this.d[i + 3]) continue; const c = fn(x, y, [this.d[i], this.d[i + 1], this.d[i + 2]]); if (c) { this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; } } }
  flipX() { const W = this.w, d = this.d; for (let y = 0; y < this.h; y++) for (let x = 0; x < W >> 1; x++) { const a = (y * W + x) * 4, b = (y * W + W - 1 - x) * 4; for (let k = 0; k < 4; k++) { const t = d[a + k]; d[a + k] = d[b + k]; d[b + k] = t; } } }
  canvas() { const c = cnv(this.w, this.h); if (this.w && this.h) c.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return c; }
}
const darker = (c, k = 0.7) => toRGB(c).map(v => v * k);
const lighter = (c, k = 0.3) => toRGB(c).map(v => v + (255 - v) * k);
/* turn a hi-res vector render into pixel art: box-downsample by k, alpha threshold, k-means palette, clean outline */
function pixelize(src, k, o = {}) { // returns PX; o.pal = fixed palette (array of rgb) to snap to, o.colors = k-means size
  const W = Math.floor(src.width / k), H = Math.floor(src.height / k), sd = src.getContext('2d').getImageData(0, 0, src.width, src.height).data, P = new PX(W, H);
  const cols = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0, dark = 0; for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const q = ((y * k + j) * src.width + x * k + i) * 4, al = sd[q + 3] / 255; r += sd[q] * al; g += sd[q + 1] * al; b += sd[q + 2] * al; a += al; if (al > 0.5 && sd[q] + sd[q + 1] + sd[q + 2] < (o.inkT || 150)) dark++; }
    const cov = a / (k * k); if (cov < (o.aT || 0.45)) continue;
    let c = [r / a, g / a, b / a]; if (dark >= k * k * (o.inkF || 0.3)) c = [c[0] * 0.35, c[1] * 0.3, c[2] * 0.38];
    P.put(x, y, c); cols.push([x, y, c]);
  }
  // k-means palette
  const N = o.pal ? o.pal.length : Math.min(o.colors || 22, cols.length); if (!N) return P; let C = []; if (o.pal) C = o.pal; else for (let i = 0; i < N; i++) C.push(cols[Math.floor(i / N * cols.length)][2].slice());
  for (let it = 0; it < (o.pal ? 1 : 8); it++) { const s = C.map(() => [0, 0, 0, 0]); for (const p of cols) { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const d = (p[2][0] - C[i][0]) ** 2 * 0.3 + (p[2][1] - C[i][1]) ** 2 * 0.59 + (p[2][2] - C[i][2]) ** 2 * 0.11; if (d < bd) { bd = d; bi = i; } } p.ci = bi; const q = s[bi]; q[0] += p[2][0]; q[1] += p[2][1]; q[2] += p[2][2]; q[3]++; } if (!o.pal) C = C.map((c, i) => s[i][3] ? [s[i][0] / s[i][3], s[i][1] / s[i][3], s[i][2] / s[i][3]] : c); }
  for (const p of cols) P.put(p[0], p[1], C[p.ci].map(Math.round));
  if (o.outline !== false) P.outline({ ink: INKC });
  P.pal = C; return P;
}
