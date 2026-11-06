/* turn a hi-res vector render into pixel art: box-downsample by k, alpha threshold, k-means palette, clean outline */
function pixelize(src, k, o = {}) {
  const W = Math.floor(src.width / k), H = Math.floor(src.height / k), sd = src.getContext('2d').getImageData(0, 0, src.width, src.height).data, P = new PX(W, H);
  const cols = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0, dark = 0; for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const q = ((y * k + j) * src.width + x * k + i) * 4, al = sd[q + 3] / 255; r += sd[q] * al; g += sd[q + 1] * al; b += sd[q + 2] * al; a += al; if (al > 0.5 && sd[q] + sd[q + 1] + sd[q + 2] < (o.inkT || 150)) dark++; }
    const cov = a / (k * k); if (cov < (o.aT || 0.45)) continue;
    let c = [r / a, g / a, b / a]; if (dark >= k * k * (o.inkF || 0.3)) c = [c[0] * 0.35, c[1] * 0.3, c[2] * 0.38];
    P.put(x, y, c); cols.push([x, y, c]);
  }
  // k-means palette
  const N = Math.min(o.colors || 22, cols.length); if (!N) return P; let C = []; for (let i = 0; i < N; i++) C.push(cols[Math.floor(i / N * cols.length)][2].slice());
  for (let it = 0; it < 8; it++) { const s = C.map(() => [0, 0, 0, 0]); for (const p of cols) { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const d = (p[2][0] - C[i][0]) ** 2 * 0.3 + (p[2][1] - C[i][1]) ** 2 * 0.59 + (p[2][2] - C[i][2]) ** 2 * 0.11; if (d < bd) { bd = d; bi = i; } } p.ci = bi; const q = s[bi]; q[0] += p[2][0]; q[1] += p[2][1]; q[2] += p[2][2]; q[3]++; } C = C.map((c, i) => s[i][3] ? [s[i][0] / s[i][3], s[i][1] / s[i][3], s[i][2] / s[i][3]] : c); }
  for (const p of cols) P.put(p[0], p[1], C[p.ci].map(Math.round));
  if (o.outline !== false) P.outline({ ink: INKC });
  return P;
}
