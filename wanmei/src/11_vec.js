/* ================= vector painting helpers (cel-shaded fills + ink outlines) ================= */
function hex(c) { return typeof c === 'string' ? c : '#' + (c >>> 0).toString(16).padStart(6, '0'); }
function rgbOf(c) { c = hex(c); if (c.startsWith('rgb')) { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2]]; } if (c.length === 4) return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)]; return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function mix(a, b, t) { const A = rgbOf(a), B = rgbOf(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
function rgba(c, a) { const A = rgbOf(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }
const _shadeCache = new Map();
function shadeOf(c) { c = hex(c); let s = _shadeCache.get(c); if (!s) { s = mix(mix(c, '#5a4a7a', 0.28), '#000', 0.12); _shadeCache.set(c, s); } return s; }
function lightOf(c) { return mix(c, '#fffaf0', 0.35); }
function smoothP(pts, closed = true, t = 0.5) {
  const p = new Path2D(), n = pts.length; if (n < 2) return p; p.moveTo(pts[0][0], pts[0][1]);
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3, p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3, p2[0], p2[1]); }
  if (closed) p.closePath(); return p;
}
const sc2 = (pts, s, ox = 0, oy = 0) => pts.map(q => [q[0] * s + ox, q[1] * s + oy]);
function ellP(cx, cy, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot, 0, TAU); return p; }
function limbP(x0, y0, x1, y1, r0, r1, bulge = 0.08) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-3, nx = -dy / L, ny = dx / L, m = 1 + bulge; const p = new Path2D();
  p.moveTo(x0 + nx * r0, y0 + ny * r0); p.bezierCurveTo(x0 + nx * r0 * m + dx * 0.33, y0 + ny * r0 * m + dy * 0.33, x1 + nx * r1 * m - dx * 0.33, y1 + ny * r1 * m - dy * 0.33, x1 + nx * r1, y1 + ny * r1);
  p.arc(x1, y1, r1, Math.atan2(ny, nx), Math.atan2(ny, nx) + PI, true); p.bezierCurveTo(x1 - nx * r1 * m - dx * 0.33, y1 - ny * r1 * m - dy * 0.33, x0 - nx * r0 * m + dx * 0.33, y0 - ny * r0 * m + dy * 0.33, x0 - nx * r0, y0 - ny * r0);
  p.arc(x0, y0, r0, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + PI, true); p.closePath(); return p; }
function polyQ(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; p.quadraticCurveTo((a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.08, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.08, b[0], b[1]); } p.closePath(); return p; }
const INK = '#3a2430';
let LW = 3;
function cel(g, p, col, o = {}) {
  g.fillStyle = o.shade || shadeOf(col); g.fill(p);
  g.save(); g.clip(p); g.translate(o.sx ?? -7, o.sy ?? -6); g.fillStyle = col; g.fill(p);
  if (o.hl) { g.globalAlpha = o.hla ?? 0.4; g.fillStyle = o.hl === true ? lightOf(col) : o.hl; g.translate(o.hx ?? -6, o.hy ?? -6); g.fill(p); g.globalAlpha = 1; }
  g.restore();
  if (o.line !== false) { g.lineWidth = (o.lw || 1) * LW; g.strokeStyle = o.ink || INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p); }
}
function flatP(g, p, col, line = true, lw = 1) { g.fillStyle = col; g.fill(p); if (line) { g.lineWidth = lw * LW; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(p); } }
function inkP(g, p, w = 1, col = INK) { g.lineWidth = w * LW; g.strokeStyle = col; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p); }
function line(g, x0, y0, x1, y1, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
function shadowBlob(g, sx, sy, rx, ry, a = 0.22) { g.fillStyle = `rgba(20,30,10,${a})`; g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, 0, TAU); g.fill(); }
