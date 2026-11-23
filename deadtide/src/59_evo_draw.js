/* ---------- (round 38) 第二形态: the six beasts, remodelled ----------
   Model space as for the mechs: +x forward, +y up, z to the side. mkBeast(v) builds one; BEAST_TICK[v](p, g, dt, ev) animates it every frame
   (ev = seconds since it evolved, for the entrance animation); evoDraw swaps mech ↔ beast.
   Bodies are sculpted once per beast type from signed-distance shapes (surface nets, cached) and skinned to a few bones, so they bend
   in one piece; the snake and the dragon are a tube re-laid along their spine every frame. Materials are PBR with a small canvas sky
   for reflections; detail comes from vertex colours, canvas scale textures and a handful of rigid attachments. */
const EVW = new THREE.Vector3(), EVQ = new THREE.Quaternion(), EVV = new THREE.Vector3();
const BX = { geo: {}, tex: {} };
const bxSm = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
const bxSx = (a, b, k) => -bxSm(-a, -b, k);
const bxSS = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bxMix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const bxC = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
function bxHash(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function bxNoise(x, y, z) { // value noise, smooth
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t, h = bxHash;
  return L(L(L(h(X, Y, Z), h(X + 1, Y, Z), u), L(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), u), v), L(L(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), u), L(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), u), v), w) * 2 - 1;
}
// a small sky to reflect: PBR metals look dead without one (the game has no environment map)
function bxEnv() {
  if (BX.env) return BX.env; const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#e8f0ff'); gr.addColorStop(0.42, '#a8b8d0'); gr.addColorStop(0.5, '#7a6a58'); gr.addColorStop(0.56, '#4a4036'); gr.addColorStop(1, '#141210');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  for (const [x, y, r, a] of [[60, 26, 26, 1], [190, 40, 40, 0.45]]) { const s = g.createRadialGradient(x, y, 1, x, y, r); s.addColorStop(0, `rgba(255,248,230,${a})`); s.addColorStop(1, 'rgba(255,248,230,0)'); g.fillStyle = s; g.fillRect(0, 0, 256, 128); }
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return BX.env = t;
}
const bxStd = o => new THREE.MeshStandardMaterial(Object.assign({ envMap: bxEnv(), envMapIntensity: 0.7, roughness: 0.5, metalness: 0 }, o));
const bxGlow = (c, o) => o != null ? new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }) : new THREE.MeshBasicMaterial({ color: c });
// per-vertex emissive ('glow' attribute) with a pulsing strength uniform
function bxGlowAttr(mat, col) { const u = { value: 1 }; mat.userData.glowU = u;
  mat.onBeforeCompile = sh => { sh.uniforms.glowC = { value: new THREE.Color(col) }; sh.uniforms.glowK = u;
    sh.vertexShader = 'attribute float glow;\nvarying float vGlow;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = 'uniform vec3 glowC;\nuniform float glowK;\nvarying float vGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += glowC * vGlow * glowK;'); };
  mat.customProgramCacheKey = () => 'bxglow'; return mat; }

/* ---------- canvas scale texture: x along the body, y around it (belly band in the middle) ---------- */
function bxScales(key, o) {
  if (BX.tex[key]) return BX.tex[key];
  const w = 256, h = 256, mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cc = mk(), mc = mk(), gc = cc.getContext('2d'), gm = mc.getContext('2d');
  gc.fillStyle = o.gap; gc.fillRect(0, 0, w, h); gm.fillStyle = 'rgb(0,150,0)'; gm.fillRect(0, 0, w, h); // roughnessMap = G, metalnessMap = B
  const cols = o.cols, rows = o.rows, sw = w / cols, sh = h / rows, bw = o.belly ? (o.bellyW || 0.3) : 0, y0 = h * (0.5 - bw / 2), y1 = h * (0.5 + bw / 2);
  const shape = (g, x, y) => { g.beginPath(); g.moveTo(x - sw * 0.72, y); g.quadraticCurveTo(x - sw * 0.2, y - sh * 0.85, x + sw * 0.4, y - sh * 0.5); g.quadraticCurveTo(x + sw * 0.95, y, x + sw * 0.4, y + sh * 0.5); g.quadraticCurveTo(x - sw * 0.2, y + sh * 0.85, x - sw * 0.72, y); g.closePath(); };
  for (let c = cols; c >= 0; c--) for (let r = 0; r <= rows; r++) { const cy = (r + (c % 2) * 0.5) * sh; if (bw && cy > y0 - sh * 0.4 && cy < y1 + sh * 0.4) continue;
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const x = c * sw + ox, y = cy + oy;
      const rg = gc.createRadialGradient(x + sw * 0.15, y - sh * 0.15, 1, x, y, sw * 0.8); rg.addColorStop(0, o.hi); rg.addColorStop(0.55, o.base); rg.addColorStop(1, o.dark);
      shape(gc, x, y); gc.fillStyle = rg; gc.fill(); gc.lineWidth = 1.4; gc.strokeStyle = o.line; gc.stroke();
      shape(gm, x, y); gm.fillStyle = 'rgb(0,95,0)'; gm.fill(); gm.lineWidth = 1.4; gm.strokeStyle = o.lineMetal ? 'rgb(0,80,255)' : 'rgb(0,150,0)'; gm.stroke(); } }
  if (bw) { const n = o.bellyN || 8, pw = w / n;
    for (let c = 0; c < n; c++) { const x = c * pw, lg = gc.createLinearGradient(x, 0, x + pw, 0); lg.addColorStop(0, o.bellyD); lg.addColorStop(0.35, o.bellyH); lg.addColorStop(1, o.belly);
      gc.fillStyle = lg; gc.fillRect(x + 1, y0, pw - 2, y1 - y0); gc.strokeStyle = o.bellyLine || o.line; gc.lineWidth = 1.2; gc.strokeRect(x + 1, y0, pw - 2, y1 - y0);
      gm.fillStyle = 'rgb(0,120,0)'; gm.fillRect(x + 1, y0, pw - 2, y1 - y0); } }
  const tx = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return BX.tex[key] = { map: tx(cc, 1), mr: tx(mc, 0) };
}

/* ---------- a tube re-laid along a moving spine every frame (snake / dragon bodies) ----------
   spine: Float32Array of N points (x,y,z), index 0 at the head end. radius(i) per ring; flat = [side, up] squash. Optional dorsal fin strip. */
function bxTube(N, R, radius, mat, o = {}) {
  const V = N * (R + 1), pos = new Float32Array(V * 3), nor = new Float32Array(V * 3), uv = new Float32Array(V * 2), idx = [];
  const rr = new Float32Array(N); for (let i = 0; i < N; i++) rr[i] = radius(i / (N - 1));
  for (let i = 0; i < N; i++) for (let j = 0; j <= R; j++) { const q = i * (R + 1) + j; uv[q * 2] = i / (N - 1) * (o.uRep || 8); uv[q * 2 + 1] = j / R; }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  const T = { mesh, geo, N, R, rr, spine: new Float32Array(N * 3), fx: new Float32Array(N * 9), roll: 0, sx: o.flat ? o.flat[0] : 1, sy: o.flat ? o.flat[1] : 1 };
  if (o.fin) { // dorsal fin strip: one blade per `every` rings
    const nf = Math.floor((N - 2) / o.fin.every), fp = new Float32Array(nf * 4 * 3), fi = [], fc = new Float32Array(nf * 4 * 3);
    for (let k = 0; k < nf; k++) { const b = k * 4; fi.push(b, b + 1, b + 2, b, b + 2, b + 3); const c0 = o.fin.c0, c1 = o.fin.c1; for (let m = 0; m < 4; m++) { const c = m === 2 ? c1 : c0; fc.set(c, (b + m) * 3); } }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('color', new THREE.BufferAttribute(fc, 3)); fg.setIndex(fi);
    T.fin = { mesh: new THREE.Mesh(fg, o.fin.mat), geo: fg, nf, every: o.fin.every, h: o.fin.h, from: o.fin.from || 1 }; T.fin.mesh.frustumCulled = false;
  }
  return T;
}
// frames by parallel transport from the head (index 0); fx[i] = T(3) Nup(3) B(3)
function bxTubeUpdate(T) {
  const { N, R, spine: P, fx, rr } = T, pos = T.geo.attributes.position.array, nor = T.geo.attributes.normal.array;
  let nx = 0, ny = 1, nz = 0;
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
    let tx = P[b * 3] - P[a * 3], ty = P[b * 3 + 1] - P[a * 3 + 1], tz = P[b * 3 + 2] - P[a * 3 + 2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    if (i === 0) { const r = T.roll, c = Math.cos(r), s = Math.sin(r); if (T.ref) { nx = T.ref[0]; ny = T.ref[1]; nz = T.ref[2]; } else { nx = 0; ny = 1; nz = 0; } // up (or a given reference), rolled about the tangent
      const sx0 = ty * nz - tz * ny, sy0 = tz * nx - tx * nz, sz0 = tx * ny - ty * nx; nx = nx * c + sx0 * s; ny = ny * c + sy0 * s; nz = nz * c + sz0 * s; }
    const d = nx * tx + ny * ty + nz * tz; nx -= d * tx; ny -= d * ty; nz -= d * tz; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    fx[i * 9] = tx; fx[i * 9 + 1] = ty; fx[i * 9 + 2] = tz; fx[i * 9 + 3] = nx; fx[i * 9 + 4] = ny; fx[i * 9 + 5] = nz; fx[i * 9 + 6] = bx; fx[i * 9 + 7] = by; fx[i * 9 + 8] = bz;
    const r = rr[i], px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2];
    for (let j = 0; j <= R; j++) { const th = j / R * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), q = (i * (R + 1) + j) * 3;
      const ux = nx * c * T.sy + bx * s * T.sx, uy = ny * c * T.sy + by * s * T.sx, uz = nz * c * T.sy + bz * s * T.sx;
      pos[q] = px + ux * r; pos[q + 1] = py + uy * r; pos[q + 2] = pz + uz * r;
      let gx = nx * c / T.sy + bx * s / T.sx, gy = ny * c / T.sy + by * s / T.sx, gz = nz * c / T.sy + bz * s / T.sx; const gl = Math.hypot(gx, gy, gz) || 1; nor[q] = gx / gl; nor[q + 1] = gy / gl; nor[q + 2] = gz / gl; }
  }
  T.geo.attributes.position.needsUpdate = true; T.geo.attributes.normal.needsUpdate = true;
  if (T.fin) { const F = T.fin, fp = F.geo.attributes.position.array;
    for (let k = 0; k < F.nf; k++) { const i = F.from + k * F.every, j = Math.min(N - 1, i + F.every), r0 = rr[i] * 0.9 * T.sy, r1 = rr[j] * 0.9 * T.sy, hh = rr[i] * F.h, b = k * 12;
      const P0 = [P[i * 3] + fx[i * 9 + 3] * r0, P[i * 3 + 1] + fx[i * 9 + 4] * r0, P[i * 3 + 2] + fx[i * 9 + 5] * r0], P1 = [P[j * 3] + fx[j * 9 + 3] * r1, P[j * 3 + 1] + fx[j * 9 + 4] * r1, P[j * 3 + 2] + fx[j * 9 + 5] * r1];
      fp[b] = P0[0]; fp[b + 1] = P0[1]; fp[b + 2] = P0[2];
      fp[b + 3] = P0[0] * 0.35 + P1[0] * 0.65 + fx[i * 9 + 3] * hh * 0.55; fp[b + 4] = P0[1] * 0.35 + P1[1] * 0.65 + fx[i * 9 + 4] * hh * 0.55; fp[b + 5] = P0[2] * 0.35 + P1[2] * 0.65 + fx[i * 9 + 5] * hh * 0.55;
      fp[b + 6] = P1[0] + fx[j * 9 + 3] * hh; fp[b + 7] = P1[1] + fx[j * 9 + 4] * hh; fp[b + 8] = P1[2] + fx[j * 9 + 5] * hh; // tip leans back toward the tail
      fp[b + 9] = P1[0]; fp[b + 10] = P1[1]; fp[b + 11] = P1[2]; }
    F.geo.attributes.position.needsUpdate = true; F.geo.computeVertexNormals(); }
}
// place an object on ring i: +x along -tangent-or-tangent (dir), +y up (frame normal)
function bxOnRing(T, i, obj, dir = 1, off = [0, 0, 0]) {
  const f = T.fx, P = T.spine, q = i * 9;
  const X = EVV.set(f[q] * dir, f[q + 1] * dir, f[q + 2] * dir), Y = new THREE.Vector3(f[q + 3], f[q + 4], f[q + 5]), Z = new THREE.Vector3().crossVectors(X, Y);
  const m = new THREE.Matrix4().makeBasis(X, Y, Z); obj.quaternion.setFromRotationMatrix(m);
  obj.position.set(P[i * 3] + X.x * off[0] + Y.x * off[1] + Z.x * off[2], P[i * 3 + 1] + X.y * off[0] + Y.y * off[1] + Z.y * off[2], P[i * 3 + 2] + X.z * off[0] + Y.z * off[1] + Z.z * off[2]);
}

/* ---------- sculpting: signed-distance primitives → surface-nets mesh, optionally skinned ---------- */
// primitives: { f(x,y,z) → distance, bb: [x0,y0,z0,x1,y1,z1], b: bone index, k: blend radius }
function bxE(b, c, r, k = 0.06, rot) { // ellipsoid, optional euler rotation [rx, ry, rz]
  let e = null; if (rot) e = new THREE.Matrix4().compose(new THREE.Vector3(...c), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(1, 1, 1)).invert().elements;
  const [cx, cy, cz] = c, [rx, ry, rz] = r, R = Math.max(rx, ry, rz);
  const f = e ? (x, y, z) => { const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14]; return bxEll(X, Y, Z, rx, ry, rz); }
    : (x, y, z) => bxEll(x - cx, y - cy, z - cz, rx, ry, rz);
  return { f, b, k, bb: [cx - R, cy - R, cz - R, cx + R, cy + R, cz + R] };
}
function bxEll(x, y, z, rx, ry, rz) { const k0 = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2 + (z / rz) ** 2), k1 = Math.sqrt((x / (rx * rx)) ** 2 + (y / (ry * ry)) ** 2 + (z / (rz * rz)) ** 2); return k1 < 1e-9 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1; }
function bxCap(b, a, c, ra, rb, k = 0.06) { // tapered capsule a → c
  const [ax, ay, az] = a, dx = c[0] - ax, dy = c[1] - ay, dz = c[2] - az, dd = dx * dx + dy * dy + dz * dz, R = Math.max(ra, rb);
  return { b, k, bb: [Math.min(ax, c[0]) - R, Math.min(ay, c[1]) - R, Math.min(az, c[2]) - R, Math.max(ax, c[0]) + R, Math.max(ay, c[1]) + R, Math.max(az, c[2]) + R],
    f: (x, y, z) => { const px = x - ax, py = y - ay, pz = z - az, h = clamp((px * dx + py * dy + pz * dz) / dd, 0, 1), qx = px - dx * h, qy = py - dy * h, qz = pz - dz * h; return Math.sqrt(qx * qx + qy * qy + qz * qz) - (ra + (rb - ra) * h); } };
}
function bxSph(b, c, r, k = 0.04) { const [cx, cy, cz] = c; return { b, k, bb: [cx - r, cy - r, cz - r, cx + r, cy + r, cz + r], f: (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - r }; }

// def: { prims, cuts:[{f,k}], h: voxel, detail(x,y,z), color(x,y,z,nx,ny,nz) → rgb, glow(x,y,z,nx,ny,nz) → 0..1, bones (count, for weights), sig }
function bxSculpt(def) {
  const P = def.prims, C = def.cuts || [], h = def.h, det = def.detail;
  const sdf = (x, y, z) => { let d = 1e9; for (let i = 0; i < P.length; i++) { const p = P[i], v = p.f(x, y, z); d = p.k ? bxSm(d, v, p.k) : Math.min(d, v); } if (d > 0.2) return d;
    for (let i = 0; i < C.length; i++) d = bxSx(d, -C[i].f(x, y, z), C[i].k); return det && d < 0.09 && d > -0.09 ? d + det(x, y, z) : d; }; // detail only near the surface
  const b0 = [1e9, 1e9, 1e9], b1 = [-1e9, -1e9, -1e9];
  for (const p of P) for (let a = 0; a < 3; a++) { b0[a] = Math.min(b0[a], p.bb[a]); b1[a] = Math.max(b1[a], p.bb[a + 3]); }
  const pad = h * 2 + (def.pad || 0.03), ox = b0[0] - pad, oy = b0[1] - pad, oz = b0[2] - pad;
  const nx = Math.ceil((b1[0] - b0[0] + pad * 2) / h) + 1, ny = Math.ceil((b1[1] - b0[1] + pad * 2) / h) + 1, nz = Math.ceil((b1[2] - b0[2] + pad * 2) / h) + 1;
  const sy = nx, sz = nx * ny, F = new Float32Array(nx * ny * nz);
  for (let k = 0, q = 0; k < nz; k++) { const z = oz + k * h; for (let j = 0; j < ny; j++) { const y = oy + j * h; for (let i = 0; i < nx; i++, q++) F[q] = sdf(ox + i * h, y, z); } }
  const cell = new Int32Array(nx * ny * nz).fill(-1), V = [];
  const CO = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1], ED = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7], cv = new Float32Array(8), off = [0, 1, sy, sy + 1, sz, sz + 1, sz + sy, sz + sy + 1];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const base = i + j * sy + k * sz; let m = 0; for (let c = 0; c < 8; c++) { const v = F[base + off[c]]; cv[c] = v; if (v < 0) m |= 1 << c; }
    if (m === 0 || m === 255) continue; let px = 0, py = 0, pz = 0, n = 0;
    for (let e = 0; e < 24; e += 2) { const a = ED[e], b = ED[e + 1]; if (((m >> a) & 1) !== ((m >> b) & 1)) { const t = cv[a] / (cv[a] - cv[b]); px += CO[a * 3] + t * (CO[b * 3] - CO[a * 3]); py += CO[a * 3 + 1] + t * (CO[b * 3 + 1] - CO[a * 3 + 1]); pz += CO[a * 3 + 2] + t * (CO[b * 3 + 2] - CO[a * 3 + 2]); n++; } }
    cell[base] = V.length / 3; V.push(ox + (i + px / n) * h, oy + (j + py / n) * h, oz + (k + pz / n) * h);
  }
  const I = [], quad = (a, b, c, d, fl) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (fl) I.push(a, b, c, a, c, d); else I.push(a, c, b, a, d, c); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const base = i + j * sy + k * sz, in0 = F[base] < 0;
    if (in0 !== (F[base + 1] < 0)) quad(cell[base], cell[base - sy], cell[base - sy - sz], cell[base - sz], in0);
    if (in0 !== (F[base + sy] < 0)) quad(cell[base], cell[base - sz], cell[base - 1 - sz], cell[base - 1], in0);
    if (in0 !== (F[base + sz] < 0)) quad(cell[base], cell[base - 1], cell[base - 1 - sy], cell[base - sy], in0);
  }
  const nv = V.length / 3, pos = new Float32Array(V), nor = new Float32Array(nv * 3), e = h * 0.5;
  for (let v = 0; v < nv; v++) { const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    const gx = sdf(x + e, y, z) - sdf(x - e, y, z), gy = sdf(x, y + e, z) - sdf(x, y - e, z), gz = sdf(x, y, z + e) - sdf(x, y, z - e), l = Math.hypot(gx, gy, gz) || 1;
    nor[v * 3] = gx / l; nor[v * 3 + 1] = gy / l; nor[v * 3 + 2] = gz / l; }
  for (let t = 0; t < I.length; t += 3) { // wind every triangle to face along the field gradient
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
    const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
    if (fx * (nor[a] + nor[b] + nor[c]) + fy * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + fz * (nor[a + 2] + nor[b + 2] + nor[c + 2]) < 0) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(I);
  if (def.color) { const col = new Float32Array(nv * 3); for (let v = 0; v < nv; v++) col.set(def.color(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]), v * 3); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  if (def.glow) { const gl = new Float32Array(nv); for (let v = 0; v < nv; v++) gl[v] = def.glow(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]); g.setAttribute('glow', new THREE.BufferAttribute(gl, 1)); }
  if (def.bones) { // skin weights: nearest bones by distance to their own primitives
    const nb = def.bones, si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), dB = new Float32Array(nb), sig = def.sig || 0.05;
    for (let v = 0; v < nv; v++) { const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2]; dB.fill(1e9);
      for (const p of P) { const d = p.f(x, y, z); if (d < dB[p.b]) dB[p.b] = d; }
      let dmin = 1e9; for (let b = 0; b < nb; b++) dmin = Math.min(dmin, dB[b]);
      const best = []; for (let b = 0; b < nb; b++) if (dB[b] < 1e8) best.push([b, Math.exp(-(dB[b] - dmin) / sig)]); best.sort((a, b) => b[1] - a[1]);
      let tot = 0; for (let q = 0; q < 4 && q < best.length; q++) tot += best[q][1];
      for (let q = 0; q < 4; q++) { si[v * 4 + q] = q < best.length ? best[q][0] : 0; sw[v * 4 + q] = q < best.length ? best[q][1] / tot : 0; } }
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); }
  g.computeBoundingSphere(); return g;
}
// bones: [[name, parentIndex, [x,y,z] rest position in model space]] → { mesh (SkinnedMesh), B: {name: Bone}, at: {name: [x,y,z]} }
function bxSkin(geo, mat, bones) {
  const list = [], B = {}, at = {};
  bones.forEach(([n, par, p], i) => { const b = new THREE.Bone(); b.name = n; const pp = par >= 0 ? bones[par][2] : [0, 0, 0]; b.position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]); if (par >= 0) list[par].add(b); list.push(b); B[n] = b; at[n] = p; b.userData.rest = b.position.clone(); });
  const mesh = new THREE.SkinnedMesh(geo, mat); mesh.add(list[0]); mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(list)); mesh.frustumCulled = false;
  return { mesh, B, at };
}
// attach a rigid mesh to a bone at a model-space rest position
function bxAt(S, bone, obj, p) { const a = S.at[bone]; obj.position.set(p[0] - a[0], p[1] - a[1], p[2] - a[2]); S.B[bone].add(obj); return obj; }
const bxR = (b, x = 0, y = 0, z = 0) => b.rotation.set(x, y, z);
const bxP = (b, x = 0, y = 0, z = 0) => b.position.set(b.userData.rest.x + x, b.userData.rest.y + y, b.userData.rest.z + z);
// a tapered strand along points (whiskers, horns, flame locks); colorFn(t) → rgb
function bxStrand(pts, r0, r1, radial = 6, seg = 16, colorFn) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), fr = c.computeFrenetFrames(seg, false), pos = [], col = [], idx = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg, P = c.getPointAt(t), r = r0 + (r1 - r0) * t, N = fr.normals[i], Bn = fr.binormals[i];
    for (let j = 0; j <= radial; j++) { const a = j / radial * Math.PI * 2; pos.push(P.x + (N.x * Math.cos(a) + Bn.x * Math.sin(a)) * r, P.y + (N.y * Math.cos(a) + Bn.y * Math.sin(a)) * r, P.z + (N.z * Math.cos(a) + Bn.z * Math.sin(a)) * r); if (colorFn) col.push(...colorFn(t)); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// merge geometries (all must share attributes); falls back to a group if the vendor build lacks mergeGeometries
function bxMerge(geos) { const ok = geos.every(g => !!g.attributes.color === !!geos[0].attributes.color); const m = THREE.mergeGeometries ? THREE.mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g), false) : null; return ok && m ? m : geos[0]; }
const bxMesh = (geo, mat, par, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (par) par.add(m); return m; };
// a sculpted, skinned body, geometry cached per key
function bxBody(key, mk, bones, mat) { const geo = BX.geo[key] || (BX.geo[key] = mk()); return bxSkin(geo, mat, bones); }


/* ---------- 青蛇: an emerald cobra with gold-edged scales — hood, fangs, forked tongue ---------- */
const SN_N = 40, SN_NK = 11;
const snR = t => t < 0.27 ? 0.105 + 0.11 * bxSS(0, 0.27, t) : 0.215 - 0.19 * Math.pow((t - 0.27) / 0.73, 1.25);
function snakeGeos() {
  if (BX.geo.snake) return BX.geo.snake;
  const G = bxC('#2a9a62'), Gd = bxC('#0e4a2e'), Gl = bxC('#7fe0a8'), Cr = bxC('#efe0a0'), Au = bxC('#e0bc52'), M = bxC('#5a1420');
  const up = bxSculpt({ h: 0.022, prims: [
    bxE(0, [0.12, 0.02, 0], [0.3, 0.155, 0.255]), bxE(0, [0.4, 0.0, 0], [0.24, 0.11, 0.18], 0.1), bxE(0, [-0.14, -0.01, 0], [0.3, 0.15, 0.175], 0.12),
    bxE(0, [0.23, 0.1, 0.15], [0.14, 0.055, 0.085], 0.05), bxE(0, [0.23, 0.1, -0.15], [0.14, 0.055, 0.085], 0.05)],
    cuts: [{ f: (x, y, z) => -(y - 0.145), k: 0.05 }, { f: (x, y, z) => -(-0.06 - y), k: 0.03 },
      { f: (x, y, z) => Math.hypot(x - 0.25, y - 0.075, Math.abs(z) - 0.205) - 0.07, k: 0.015 }, { f: (x, y, z) => Math.hypot(x - 0.6, y - 0.03, Math.abs(z) - 0.06) - 0.022, k: 0.01 }],
    color: (x, y, z, nx, ny) => { let c = bxMix3(Gd, G, bxSS(-0.05, 0.08, y)); c = bxMix3(c, Gl, 0.35 * bxSS(0.4, 0.95, ny) * bxSS(0, 0.4, x));
      if (y > 0.12 && Math.abs(z) < 0.045 * (1 - Math.abs(x - 0.05) / 0.16) && Math.abs(x - 0.05) < 0.16) c = Au; // crown mark
      if (ny < -0.6 && x > 0.05) c = M; else if (y < -0.03) c = bxMix3(c, Cr, 0.8); return c; },
    glow: (x, y, z) => (y > 0.12 && Math.abs(z) < 0.045 * (1 - Math.abs(x - 0.05) / 0.16) && Math.abs(x - 0.05) < 0.16) ? 1 : 0 });
  const jaw = bxSculpt({ h: 0.02, prims: [bxE(0, [0.26, -0.09, 0], [0.3, 0.06, 0.16]), bxE(0, [-0.02, -0.08, 0], [0.12, 0.06, 0.15], 0.08)],
    cuts: [{ f: (x, y) => -(y + 0.06), k: 0.015 }],
    color: (x, y, z, nx, ny) => ny > 0.55 && x > 0.02 && Math.abs(z) < 0.13 ? M : bxMix3(Cr, G, bxSS(-0.12, -0.06, y) * bxSS(0.3, 0.8, Math.abs(nx * 0 + z) / 0.16)) });
  // hood: a curved flap behind the head; local x = facing, y = up the neck, z = side
  const hood = bxSculpt({ h: 0.022, prims: [bxE(0, [0, 0.06, 0.17], [0.05, 0.42, 0.25], 0.08, [0, 0.45, 0]), bxE(0, [0, 0.06, -0.17], [0.05, 0.42, 0.25], 0.08, [0, -0.45, 0]), bxE(0, [-0.05, -0.15, 0], [0.12, 0.2, 0.15], 0.1)],
    color: (x, y, z, nx) => { if (nx > 0.15) return bxMix3(Cr, bxC('#c8b070'), (Math.floor(y * 9 + 9) & 1) * 0.35); // pale belly scales in front
      const d = Math.hypot(y - 0.12, Math.abs(z) - 0.17); if (d < 0.085 && d > 0.05) return bxC('#0a120c'); if (d <= 0.05) return bxC('#f6d24a'); // the spectacle mark behind
      const sp = (Math.floor(y * 16) + Math.floor(z * 16)) & 1; return bxMix3(G, Gd, sp ? 0.3 : 0); },
    glow: (x, y, z, nx) => nx < 0.15 && Math.hypot(y - 0.12, Math.abs(z) - 0.17) <= 0.05 ? 1 : 0 });
  return BX.geo.snake = { up, jaw, hood };
}
function mkSnake(E) {
  const g = new THREE.Group(), U = { k: 1 }; g.userData = U; const GG = snakeGeos();
  const tx = bxScales('snake', { cols: 12, rows: 14, base: '#2c9c64', hi: '#78e0a4', dark: '#0d462c', gap: '#0f3020', line: '#e2c058', lineMetal: 1, belly: '#f2e39a', bellyH: '#fffbd8', bellyD: '#c8b060', bellyLine: '#7a6a30', bellyW: 0.22, bellyN: 7 });
  const body = bxStd({ map: tx.map, roughnessMap: tx.mr, metalnessMap: tx.mr, metalness: 1, roughness: 1, envMapIntensity: 0.5 });
  U.tube = bxTube(SN_N, 14, snR, body, { flat: [1, 0.86], uRep: 4.2 }); g.add(U.tube.mesh);
  const skin = bxGlowAttr(bxStd({ vertexColors: true, roughness: 0.32, metalness: 0.05, envMapIntensity: 0.9 }), '#ffd860');
  const head = new THREE.Group(); g.add(head); U.head = head; head.scale.setScalar(0.74);
  bxMesh(GG.up, skin, head); const jaw = new THREE.Group(); jaw.position.set(-0.02, -0.055, 0); head.add(jaw); U.jaw = jaw; bxMesh(GG.jaw, skin, jaw, 0.02, 0.055, 0);
  const eyeM = bxStd({ color: '#ffc01c', emissive: '#ff8a00', emissiveIntensity: 0.9, roughness: 0.08 }), blk = bxStd({ color: '#060606', roughness: 0.2 });
  for (const z of [-1, 1]) { bxMesh(new THREE.SphereGeometry(0.062, 18, 14), eyeM, head, 0.25, 0.075, z * 0.205);
    const pu = bxMesh(new THREE.SphereGeometry(1, 10, 8), blk, head, 0.29, 0.078, z * 0.252); pu.scale.set(0.012, 0.048, 0.012); pu.rotation.y = -z * 0.6; }
  const fangM = bxStd({ color: '#fbf6ea', roughness: 0.25 }); U.fangs = [];
  for (const z of [-1, 1]) { const fg = new THREE.ConeGeometry(0.022, 0.15, 8); fg.rotateX(Math.PI); fg.translate(0, -0.075, 0); U.fangs.push(bxMesh(fg, fangM, head, 0.5, -0.05, z * 0.07)); }
  const tg = new THREE.Group(); tg.position.set(0.5, -0.07, 0); jaw.add(tg); U.tongue = tg; const tM = bxStd({ color: '#d42a48', roughness: 0.35 });
  bxMesh(bxStrand([[0, 0, 0], [0.12, 0.005, 0], [0.24, 0, 0]], 0.014, 0.01, 6, 6), tM, tg); for (const z of [-1, 1]) bxMesh(bxStrand([[0.23, 0, 0], [0.28, 0.01, z * 0.025], [0.33, 0, z * 0.05]], 0.01, 0.003, 5, 5), tM, tg);
  const hood = new THREE.Group(); g.add(hood); U.hood = hood; const hm = bxMesh(GG.hood, skin, hood); hm.scale.set(1, 1, 1); U.hoodM = hm;
  U.ph = 0; U.hs = 0.6; return g;
}
function snakeTick(p, g, dt, ev = 9) {
  const U = g.userData, T = U.tube, P = T.spine, sp = p._spd || 0, mv = clamp(sp / 4, 0, 1); U.ph += dt * (1.3 + sp * 2.6);
  const t = p._mpT != null ? p._mpT : 9, sT = p._msK === 'venom' && p._msT != null ? p._msT : 9, wt = W.t + p.i * 1.7;
  // attack: cock back, strike, hold, recover
  const cb = p._mcombo || 0, bt = 0; /* (round 38b) blows 1–2 whip the tail round; (round 38c) the third slams the tail down over its head — no more biting */
  const cock = bt * (t < 0.1 ? ease(t / 0.1) : t < 0.18 ? 1 - ease((t - 0.1) / 0.08) : 0), strike = bt * (t < 0.1 ? 0 : t < 0.18 ? ease((t - 0.1) / 0.08) : t < 0.28 ? 1 : t < 0.55 ? 1 - ease((t - 0.28) / 0.27) : 0);
  const wh = cb < 2 && t < 0.85 ? (t < 0.2 ? ease(t / 0.2) * 0.5 : t < 0.48 ? 0.5 - ease((t - 0.2) / 0.28) * 1.55 : -1.05 * (1 - ease((t - 0.48) / 0.37))) : 0, wTh = wh * (p._mpS ? 1 : -1) * 2.9; /* (round 38c) slower: wind 0.2 s, sweep 0.28 s, recover */
  const ts = cb === 2 && t < 0.95 ? (t < 0.32 ? ease(t / 0.32) * 2.1 : t < 0.43 ? 2.1 + ease((t - 0.32) / 0.11) * 0.95 : t < 0.6 ? 3.05 : 3.05 * (1 - ease((t - 0.6) / 0.35))) : 0; /* tail slam: up over the head, then down in front */
  // venom: rear up, draw back, spit
  const rear = sT < 0.25 ? ease(sT / 0.25) : sT < 0.85 ? 1 : sT < 1.2 ? 1 - ease((sT - 0.85) / 0.35) : 0, spit = sT > 0.35 && sT < 0.8 ? Math.sin((sT - 0.35) / 0.45 * Math.PI) : 0;
  const intro = ev < 1.4 ? ease(clamp((ev - 0.1) / 0.85, 0, 1)) : 1;
  const sway = Math.sin(wt * 0.9) * 0.05 * (1 - mv);
  let Hx = 0.16 - cock * 0.22 + strike * 0.85 - rear * 0.12 - spit * 0.05 - Math.min(1, ts) * 0.12, Hy = 1.02 + Math.sin(wt * 1.3) * 0.03 + cock * 0.12 - strike * 0.42 + rear * 0.45 + Math.min(1, ts) * 0.12, Hz = sway * 2 - Math.min(1, ts) * 0.25;
  const Cx = -0.06 + strike * 0.35 - rear * 0.05, Cy = 0.2 + strike * 0.05, Gx = -0.58 + strike * 0.2, Gy = snR(SN_NK / (SN_N - 1)) * 0.86;
  const amp = 0.1 + 0.2 * mv, seg = 0.125;
  for (let i = 0; i < SN_N; i++) { let x, y, z;
    if (i <= SN_NK) { const s = i / SN_NK, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; x = a * Hx + b * Cx + c * Gx; y = a * Hy + b * Cy + c * Gy; z = a * Hz + Math.sin(wt * 0.7 - i * 0.3) * 0.04 * s; }
    else { const k = i - SN_NK, w = Math.min(1, k / 5); x = Gx - k * seg * (1 - 0.12 * mv); y = snR(i / (SN_N - 1)) * 0.86; z = Math.sin(U.ph - k * 0.5) * amp * w;
      if (wTh) { const ww = Math.min(1, k / 9), an = wTh * ww * (0.75 + 0.25 * ww), dx = x - Gx, c2 = Math.cos(an), s2 = Math.sin(an); x = Gx + dx * c2 - z * s2; z = dx * s2 + z * c2; y += Math.abs(wh) * 0.22 * ww; }
      if (ts) { const ww = Math.min(1, k / 7), an = ts * ww, dx = x - Gx, dy = y - Gy, c2 = Math.cos(an), s2 = Math.sin(an); x = Gx + dx * c2 + dy * s2; y = Gy - dx * s2 + dy * c2; y = Math.max(y, snR(i / (SN_N - 1)) * 0.5); z += Math.sin(Math.min(an, Math.PI)) * 0.55 * ww; } }
    if (intro < 1) { // coiled up at first, the coil unwinding as it rears
      const a = 1.2 + i * 0.52, rr = 0.16 + i * 0.019, cx = -0.45 + Math.cos(a) * rr, cz = Math.sin(a) * rr, cy = snR(i / (SN_N - 1)) * 0.86 + (i < 6 ? (6 - i) * 0.07 * intro : 0);
      x = cx + (x - cx) * intro; y = cy + (y - cy) * intro; z = cz + (z - cz) * intro; }
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; }
  T.roll = 0; bxTubeUpdateRef(T, -0.75, 0.66, 0);
  // head on the neck's top, looking forward (pitched by the strike / spit)
  U.head.position.set(P[0], P[1], P[2]);
  U.head.rotation.set(Math.sin(wt * 0.6) * 0.04, -sway * 1.5, -cock * 0.25 + strike * 0.12 + rear * 0.15 - spit * 0.45 - (1 - intro) * 0.4);
  const open = Math.max(strike * 0.85, cock * 0.3, spit * 0.95, ev < 1.6 && ev > 1.0 ? Math.sin((ev - 1.0) / 0.6 * Math.PI) * 0.7 : 0);
  U.jaw.rotation.z = -open * 0.9;
  for (const f of U.fangs) f.scale.set(1, 0.25 + 0.75 * clamp(open * 1.6, 0, 1), 1);
  const fl = (W.t * 1.3 + p.i) % 2.1; U.tongue.scale.x = open > 0.2 ? 0.001 : fl < 0.28 ? Math.sin(fl / 0.28 * Math.PI) : 0.001; U.tongue.rotation.y = Math.sin(W.t * 38) * 0.18;
  // hood: half open, flared when striking / spitting, snapping open at the end of the entrance
  const hsT = 0.62 + 0.25 * strike + 0.18 * cock + 0.45 * rear + (ev < 1.5 ? Math.max(0, Math.sin(clamp((ev - 0.8) / 0.7, 0, 1) * Math.PI)) * 0.5 - (ev < 0.8 ? 0.5 : 0) : 0);
  U.hs = lerp(U.hs, clamp(hsT, 0.15, 1.3), Math.min(1, dt * 14));
  const f = T.fx, q = 2 * 9, X = new THREE.Vector3(-f[q + 3], -f[q + 4], -f[q + 5]), Y = new THREE.Vector3(-f[q], -f[q + 1], -f[q + 2]), Z = new THREE.Vector3().crossVectors(X, Y);
  U.hood.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); U.hood.position.set(P[6] + X.x * 0.04, P[7] + X.y * 0.04, P[8] + X.z * 0.04);
  U.hoodM.scale.set(1, 0.55 + 0.45 * U.hs, 0.35 + 0.65 * U.hs); U.hoodM.material.userData.glowU && (U.hoodM.material.userData.glowU.value = 0.8 + 0.6 * Math.max(strike, rear) + Math.sin(W.t * 3) * 0.15);
  if (spit > 0.3 && FXR() < dt * 40) { U.head.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(p._ly) * 4 + frnd(-1, 1), vy: Math.sin(p._ly) * 4 + frnd(-1, 1), vz: 0.6, g: 0.2, col: '#8dff5a', s: 0.12, life: 0.6, smoke: 1 }); }
  if (ts && t > 0.43 && t < 0.48 && FXR() < 0.7) { const j = (SN_N - 1) * 3; EVW.set(P[j], P[j + 1], P[j + 2]); g.localToWorld(EVW); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: 1, g: 4, col: '#8a8a70', s: 0.12, life: 0.5, smoke: 1 }); } }
  if (cb < 2 && t > 0.2 && t < 0.48) { const j = (SN_N - 1) * 3; EVW.set(P[j], P[j + 1], P[j + 2]); g.localToWorld(EVW); for (let k = 0; k < 2; k++) addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: frnd(-0.8, 0.8), vy: frnd(-0.8, 0.8), vz: 0.3, g: 0.6, col: k ? '#9dff6a' : '#d8f0c0', s: 0.09, life: 0.35 }); } /* the whip's swish */
  if (strike > 0.9 && FXR() < dt * 20) { U.head.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y - 0.1, vx: frnd(-1, 1), vy: frnd(-1, 1), vz: 0.4, g: 0.5, col: '#b8ff7a', s: 0.06, life: 0.4 }); }
}
// tube update with a reference "up" for the first ring (the cobra's neck hangs straight down from its head)
function bxTubeUpdateRef(T, rx, ry, rz) { T.ref = [rx, ry, rz]; bxTubeUpdate(T); }


/* ---------- 赤龙: a crimson Chinese dragon — gold-edged scales, golden belly plates, flame fins, antlers, whiskers, mane, a flaming pearl ---------- */
const DR_N = 44;
const drR = t => 0.05 + 0.22 * Math.sin(Math.min(1, 0.3 + t * 0.85) * Math.PI) * (1 - t * 0.3) + 0.03 * (1 - bxSS(0, 0.12, t));
const drFlame = t => bxMix3(bxC('#e8300c'), bxC('#ffc850'), Math.pow(t, 1.1));
function dragonGeos() {
  if (BX.geo.dragon) return BX.geo.dragon;
  const red = bxC('#b8161c'), dred = bxC('#4a0508'), hi = bxC('#ff5a3a'), gold = bxC('#eab552'), M = bxC('#5a0c12');
  // head: +x forward, z side
  const up = bxSculpt({ h: 0.024, prims: [
    bxE(0, [0, 0.05, 0], [0.22, 0.17, 0.2]), bxE(0, [0.33, 0.0, 0], [0.22, 0.09, 0.13], 0.1), bxE(0, [0.52, 0.055, 0], [0.075, 0.065, 0.105], 0.06),
    bxSph(0, [0.545, 0.085, 0.06], 0.035, 0.03), bxSph(0, [0.545, 0.085, -0.06], 0.035, 0.03),
    bxE(0, [0.13, 0.175, 0.11], [0.13, 0.05, 0.085], 0.05), bxE(0, [0.13, 0.175, -0.11], [0.13, 0.05, 0.085], 0.05),
    bxE(0, [0.04, -0.02, 0.15], [0.13, 0.1, 0.09], 0.06), bxE(0, [0.04, -0.02, -0.15], [0.13, 0.1, 0.09], 0.06), bxE(0, [-0.18, 0, 0], [0.2, 0.15, 0.15], 0.08)],
    cuts: [{ f: (x, y) => Math.max(y + 0.04, 0.06 - x), k: 0.02 }, { f: (x, y, z) => Math.hypot(x - 0.578, y - 0.09, Math.abs(z) - 0.065) - 0.016, k: 0.01 }, { f: (x, y, z) => Math.hypot(x - 0.17, y - 0.11, Math.abs(z) - 0.14) - 0.05, k: 0.015 }],
    color: (x, y, z, nx, ny) => { let c = bxMix3(dred, red, bxSS(-0.1, 0.1, y)); c = bxMix3(c, hi, 0.3 * bxSS(0.4, 1, ny)); c = bxMix3(c, gold, bxSS(0.0, -0.09, y) * bxSS(-0.05, 0.1, x));
      if (y > 0.15 && Math.abs(Math.abs(z) - 0.11) < 0.05 && x > 0.02 && x < 0.25) c = bxMix3(c, gold, 0.85); if (x > 0.08 && ny < -0.5 && y < -0.02) c = M; return c; } });
  const jaw = bxSculpt({ h: 0.022, prims: [bxE(0, [0.26, -0.075, 0], [0.25, 0.05, 0.115]), bxE(0, [0.42, -0.09, 0], [0.08, 0.04, 0.07], 0.04), bxE(0, [0.02, -0.06, 0], [0.1, 0.06, 0.13], 0.06)],
    cuts: [{ f: (x, y) => -(y + 0.04), k: 0.015 }], color: (x, y, z, nx, ny) => ny > 0.5 && x > 0.06 ? M : bxMix3(gold, red, bxSS(-0.1, -0.05, y) * 0.4) });
  const limbU = bxSculpt({ h: 0.02, prims: [bxE(0, [0, -0.02, 0], [0.075, 0.09, 0.07]), bxCap(0, [0, -0.03, 0], [0.03, -0.26, 0], 0.062, 0.045, 0.05)], color: (x, y) => bxMix3(red, dred, bxSS(0, -0.25, y) * 0.5) });
  const limbL = bxSculpt({ h: 0.018, prims: [bxCap(0, [0, 0, 0], [0.06, -0.2, 0], 0.045, 0.036, 0.04), bxE(0, [0.1, -0.23, 0], [0.08, 0.045, 0.075], 0.04)], color: (x, y) => y < -0.18 ? gold : red });
  const claws = [], horn = [], whisk = [], mane = [];
  for (let c = 0; c < 4; c++) { const a = (c - 1.5) * 0.42; claws.push(bxStrand([[0.12, -0.24, 0], [0.12 + Math.cos(a) * 0.08, -0.25, Math.sin(a) * 0.08], [0.12 + Math.cos(a) * 0.13, -0.32, Math.sin(a) * 0.12]], 0.018, 0.002, 5, 6)); }
  for (const s of [1, -1]) {
    horn.push(bxStrand([[-0.02, 0.19, s * 0.1], [-0.2, 0.32, s * 0.16], [-0.42, 0.44, s * 0.19], [-0.62, 0.58, s * 0.15]], 0.045, 0.006, 8, 18));
    horn.push(bxStrand([[-0.27, 0.36, s * 0.17], [-0.33, 0.44, s * 0.27], [-0.3, 0.58, s * 0.36]], 0.024, 0.004, 6, 10));
    horn.push(bxStrand([[-0.46, 0.46, s * 0.19], [-0.5, 0.56, s * 0.27], [-0.46, 0.68, s * 0.3]], 0.018, 0.003, 6, 10));
    whisk.push(bxStrand([[0.5, 0.03, s * 0.09], [0.52, 0.06, s * 0.24], [0.38, -0.02, s * 0.45], [0.12, 0.1, s * 0.6], [-0.15, 0, s * 0.72], [-0.42, -0.16, s * 0.66], [-0.6, -0.3, s * 0.74]], 0.016, 0.002, 5, 40, t => bxMix3(bxC('#ffd060'), bxC('#ff6a10'), t)));
    whisk.push(bxStrand([[0.3, -0.12, s * 0.05], [0.25, -0.25, s * 0.07], [0.3, -0.35, s * 0.05], [0.22, -0.45, s * 0.09]], 0.03, 0.002, 5, 12, drFlame)); }
  for (let k = 0; k < 13; k++) { const a = -0.9 + k / 12 * (Math.PI + 1.8), ox = Math.cos(a), oy = Math.sin(a), L = 0.32 + 0.08 * Math.sin(k * 2.3);
    const P5 = [0, 0.25, 0.5, 0.75, 1].map(f => [-0.08 - L * 1.1 * f, 0.04 + 0.17 * oy + L * 0.5 * Math.sqrt(f) * (oy * 0.9 + 0.2) * 0.6 + 0.1 * f * f + 0.04 * Math.cos(f * 6 + k * 2) * f, 0.17 * ox + L * 0.6 * Math.sqrt(f) * ox * 0.6 + 0.05 * Math.sin(f * 7 + k) * f]);
    mane.push(bxStrand(P5, 0.05, 0.002, 6, 14, drFlame)); }
  const tail = []; for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.4; tail.push(bxStrand([[0, 0, 0], [0.18, Math.cos(a) * 0.12, Math.sin(a) * 0.12], [0.4, Math.cos(a) * 0.2 + 0.05, Math.sin(a) * 0.22]], 0.05, 0.002, 6, 10, drFlame)); }
  return BX.geo.dragon = { up, jaw, limbU, limbL, claws: bxMerge(claws), horn: bxMerge(horn), whisk: bxMerge(whisk), mane: bxMerge(mane), tail: bxMerge(tail) };
}
function mkDragon(E) {
  const g = new THREE.Group(), U = { k: 2, legs: [] }; g.userData = U; const GG = dragonGeos();
  const tx = bxScales('dragon', { cols: 12, rows: 14, base: '#a8121a', hi: '#ec4630', dark: '#34030a', gap: '#2a0306', line: '#e8b850', lineMetal: 1, belly: '#f2b23c', bellyH: '#ffe28a', bellyD: '#b87a20', bellyLine: '#7a4a14', bellyW: 0.28, bellyN: 7 });
  const scale = bxStd({ map: tx.map, roughnessMap: tx.mr, metalnessMap: tx.mr, metalness: 1, roughness: 1, envMapIntensity: 0.55 });
  const finM = bxStd({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.3, emissive: '#801400', emissiveIntensity: 0.4 });
  U.tube = bxTube(DR_N, 14, drR, scale, { flat: [1, 0.92], uRep: 6.5, fin: { every: 2, h: 1.15, mat: finM, c0: bxC('#d8380e'), c1: bxC('#ffc04a'), from: 2 } });
  g.add(U.tube.mesh); g.add(U.tube.fin.mesh);
  const skin = bxStd({ vertexColors: true, roughness: 0.34, metalness: 0.1, envMapIntensity: 0.7 }), flame = bxStd({ vertexColors: true, roughness: 0.45, emissive: '#ff3a00', emissiveIntensity: 0.35 });
  const hornM = bxStd({ color: '#f2dc9a', roughness: 0.3, metalness: 0.5 }), goldM = bxStd({ color: '#f0c050', roughness: 0.25, metalness: 0.9 });
  const head = new THREE.Group(); g.add(head); U.head = head; head.scale.setScalar(1.15);
  bxMesh(GG.up, skin, head); const jaw = new THREE.Group(); jaw.position.set(0.02, -0.03, 0); head.add(jaw); U.jaw = jaw; bxMesh(GG.jaw, skin, jaw, -0.02, 0.03, 0);
  bxMesh(GG.horn, hornM, head); U.whisk = bxMesh(GG.whisk, flame, head); U.mane = bxMesh(GG.mane, flame, head);
  const eyeM = bxStd({ color: '#ffe066', emissive: '#ffb000', emissiveIntensity: 1.5, roughness: 0.1 }), blk = bxStd({ color: '#0a0000' }), tooth = bxStd({ color: '#fff8e6', roughness: 0.25 });
  for (const z of [-1, 1]) { bxMesh(new THREE.SphereGeometry(0.045, 16, 12), eyeM, head, 0.17, 0.11, z * 0.14); const pu = bxMesh(new THREE.SphereGeometry(1, 8, 6), blk, head, 0.2, 0.112, z * 0.178); pu.scale.set(0.01, 0.034, 0.008); pu.rotation.y = -z * 0.9;
    for (let k = 0; k < 5; k++) { const x = 0.16 + k * 0.075, w = 0.09 * (1 - (x - 0.1) * 0.6), big = k === 3;
      const t1 = bxMesh(new THREE.ConeGeometry(big ? 0.018 : 0.011, big ? 0.08 : 0.04, 6), tooth, head, x, -0.06 - (big ? 0.03 : 0.01), z * w); t1.rotation.x = Math.PI;
      bxMesh(new THREE.ConeGeometry(big ? 0.014 : 0.009, big ? 0.06 : 0.03, 6), tooth, jaw, x - 0.02, -0.025 + (big ? 0.02 : 0.008), z * w * 0.95); } }
  bxMesh(bxStrand([[0.05, -0.06, 0], [0.2, -0.07, 0], [0.36, -0.075, 0]], 0.035, 0.014, 8, 6), bxStd({ color: '#d0203a', roughness: 0.35 }), jaw);
  U.mouth = new THREE.Object3D(); U.mouth.position.set(0.62, -0.06, 0); head.add(U.mouth);
  // legs at two rings, both sides
  for (const [ri, side] of [[9, -1], [9, 1], [25, -1], [25, 1]]) { const hip = new THREE.Group(); g.add(hip); const up2 = new THREE.Group(); hip.add(up2); bxMesh(GG.limbU, skin, up2);
    const kn = new THREE.Group(); kn.position.set(0.03, -0.26, 0); up2.add(kn); bxMesh(GG.limbL, skin, kn); bxMesh(GG.claws, hornM, kn); U.legs.push({ ri, side, hip, up: up2, kn }); }
  const tail = new THREE.Group(); g.add(tail); bxMesh(GG.tail, flame, tail); U.tail = tail;
  U.pearl = new THREE.Group(); g.add(U.pearl); bxMesh(new THREE.SphereGeometry(0.1, 20, 14), bxStd({ color: '#ffffff', emissive: '#ffd27a', emissiveIntensity: 1.6, roughness: 0.1 }), U.pearl);
  U.halo = bxMesh(new THREE.SphereGeometry(0.17, 14, 10), bxGlow('#ffb040', 0.25), U.pearl); for (let k = 0; k < 3; k++) { const r = bxMesh(new THREE.TorusGeometry(0.15 + k * 0.02, 0.008, 4, 24), bxGlow('#ff8a20', 0.5), U.pearl); r.rotation.set(k * 1.1, k * 0.7, 0); }
  U.ph = 0; U.roll = 0; return g;
}
function dragonTick(p, g, dt, ev = 9) {
  const U = g.userData, T = U.tube, P = T.spine, sp = p._spd || 0; U.ph += dt * (1.5 + sp * 1.4); const ph = U.ph, wt = W.t + p.i * 2.1;
  const br = W.t - (p._brT != null ? p._brT : -9) < 0.28 ? 1 : 0; U.brS = lerp(U.brS || 0, br, Math.min(1, dt * 12));
  const sT = p._msK === 'dragdash' && p._msT != null ? p._msT : 9, dash = sT < 0.5 ? ease(Math.min(1, sT / 0.08)) : sT < 0.8 ? 1 - ease((sT - 0.5) / 0.3) : 0;
  const intro = ev < 1.6 ? ease(clamp((ev - 0.05) / 1.1, 0, 1)) : 1, cy = 1.55, seg = 0.145 * (1 - dash * 0.15);
  const ampY = 0.28 * (1 - dash * 0.8), ampZ = (0.36 + clamp(sp / 4, 0, 1) * 0.12) * (1 - dash * 0.75);
  for (let i = 0; i < DR_N; i++) { const k = Math.min(1, i / 6);
    let x = 0.1 - i * seg, y = cy + Math.sin(ph - i * 0.21) * ampY * k + i * 0.006 - U.brS * 0.08 * (1 - k), z = Math.sin(ph * 0.8 - i * 0.165) * ampZ * k;
    if (intro < 1) { const a = i * 0.36 - ev * 5, rr = 0.75, hx = Math.cos(a) * rr - 0.4, hz = Math.sin(a) * rr, hy = 0.35 + (DR_N - i) * 0.04 * (0.3 + intro);
      x = hx + (x - hx) * intro; y = hy + (y - hy) * intro; z = hz + (z - hz) * intro; }
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; }
  U.roll += dt * dash * 16; if (!dash) U.roll = lerp(U.roll % (Math.PI * 2), 0, Math.min(1, dt * 5)); T.roll = U.roll;
  bxTubeUpdate(T);
  // head: at the front ring, mostly looking ahead; lunges and opens wide to breathe fire
  const f = T.fx; U.head.position.set(P[0] + U.brS * 0.1 + dash * 0.1, P[1] + 0.05, P[2]);
  const yaw = Math.atan2(f[2], -f[0]) * 0.5, pitch = Math.atan2(-f[1], Math.hypot(f[0], f[2])) * 0.5;
  const roar = ev < 1.9 && ev > 1.0 ? Math.sin((ev - 1.0) / 0.9 * Math.PI) : 0;
  U.head.rotation.set(dash ? U.roll * 0.15 : 0, yaw, pitch - U.brS * 0.12 + roar * 0.35 + Math.sin(wt * 1.1) * 0.04);
  U.jaw.rotation.z = -(U.brS * (0.55 + Math.sin(W.t * 30) * 0.06) + dash * 0.35 + roar * 0.6);
  U.whisk.rotation.set(Math.sin(wt * 2.1) * 0.05, Math.sin(wt * 1.7) * 0.06, Math.sin(wt * 2.4) * 0.04); U.mane.rotation.x = Math.sin(wt * 3) * 0.03;
  // legs paddle; tucked during the dash
  for (const L of U.legs) { const q = L.ri * 9, r = T.rr[L.ri]; const X = new THREE.Vector3(-f[q], -f[q + 1], -f[q + 2]), Y = new THREE.Vector3(f[q + 3], f[q + 4], f[q + 5]), Z = new THREE.Vector3().crossVectors(X, Y);
    L.hip.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    L.hip.position.set(P[L.ri * 3] - Y.x * r * 0.35 + Z.x * L.side * r * 0.72, P[L.ri * 3 + 1] - Y.y * r * 0.35 + Z.y * L.side * r * 0.72, P[L.ri * 3 + 2] - Y.z * r * 0.35 + Z.z * L.side * r * 0.72);
    const w = Math.sin(ph * 1.5 + L.ri * 0.3 + (L.side > 0 ? Math.PI : 0)), front = L.ri < 15 ? 1 : 0;
    L.up.rotation.set(L.side * (0.35 + 0.15 * w), 0, (front ? 0.5 : -0.2) + w * 0.6 * (1 - dash) - dash * 1.1 + front * U.brS * 0.4);
    L.kn.rotation.z = -0.5 + Math.max(0, -w) * 0.7 - dash * 0.8; L.hip.scale.setScalar(1.1); }
  { const n = DR_N - 1, q = n * 9, X = new THREE.Vector3(f[q], f[q + 1], f[q + 2]), Y = new THREE.Vector3(f[q + 3], f[q + 4], f[q + 5]), Z = new THREE.Vector3().crossVectors(X, Y);
    U.tail.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); U.tail.position.set(P[n * 3], P[n * 3 + 1], P[n * 3 + 2]); U.tail.scale.setScalar(0.9 + Math.sin(W.t * 16) * 0.12 + dash * 0.4); }
  U.pearl.position.set(0.95 + Math.sin(wt * 1.3) * 0.1 - U.brS * 0.3, cy + 0.32 + Math.sin(wt * 2.1) * 0.1, Math.cos(wt * 1.3) * 0.25 + (intro < 1 ? (1 - intro) * 0.6 : 0)); U.pearl.rotation.y += dt * 2;
  U.halo.scale.setScalar(1 + Math.sin(W.t * 6) * 0.1);
  if (br) { U.mouth.getWorldPosition(EVW); const a = p._ly; for (let k = 0; k < 4; k++) { const s2 = frnd(5, 9), aa = a + frnd(-0.35, 0.35); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(aa) * s2, vy: Math.sin(aa) * s2, vz: frnd(-1.2, 0.3), g: 0.4, col: FXR() < 0.5 ? '#ffb030' : '#ff5a1a', s: 0.16 + FXR() * 0.1, life: 0.55, smoke: 0 }); } }
  if (dash && FXR() < dt * 60) { const i = (FXR() * DR_N) | 0; T.mesh.localToWorld(EVW.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: frnd(-1, 1), vy: frnd(-1, 1), vz: 0.8, g: 0.3, col: '#ff8a2a', s: 0.18, life: 0.5 }); }
  if (intro < 1 && FXR() < dt * 40) { const i = (FXR() * DR_N) | 0; T.mesh.localToWorld(EVW.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: frnd(-0.5, 0.5), vy: frnd(-0.5, 0.5), vz: 1, g: 0.2, col: '#ffb040', s: 0.14, life: 0.5 }); }
}


/* ---------- 玉兔: a white-jade rabbit with jade-green veins — ruby eyes, gold crescent on the brow, a gold collar and bell ---------- */
const RB_BONES = [['root', -1, [0, 0.75, 0]], ['chest', 0, [0.05, 1.15, 0]], ['head', 1, [0.08, 1.55, 0]],
  ['earL', 2, [-0.02, 1.95, 0.15]], ['earLt', 3, [-0.07, 2.3, 0.19]], ['earR', 2, [-0.02, 1.95, -0.15]], ['earRt', 5, [-0.07, 2.3, -0.19]],
  ['armL', 1, [0.22, 1.32, 0.28]], ['handL', 7, [0.36, 1.05, 0.26]], ['armR', 1, [0.22, 1.32, -0.28]], ['handR', 9, [0.36, 1.05, -0.26]],
  ['thighL', 0, [-0.05, 0.55, 0.3]], ['footL', 11, [-0.05, 0.14, 0.32]], ['thighR', 0, [-0.05, 0.55, -0.3]], ['footR', 13, [-0.05, 0.14, -0.32]], ['tail', 0, [-0.42, 0.68, 0]]];
function rabbitGeo() {
  const J = bxC('#eef7f0'), J2 = bxC('#acd8bc'), V = bxC('#3f9e72'), Pk = bxC('#f6b8c4');
  const pr = [bxE(0, [0, 0.74, 0], [0.45, 0.5, 0.41]), bxE(0, [0.18, 0.92, 0], [0.3, 0.38, 0.31], 0.1), bxE(1, [0.08, 1.2, 0], [0.34, 0.33, 0.32], 0.12),
    bxE(2, [0.08, 1.68, 0], [0.35, 0.31, 0.35], 0.1), bxE(2, [0.22, 1.58, 0.17], [0.17, 0.14, 0.15], 0.06), bxE(2, [0.22, 1.58, -0.17], [0.17, 0.14, 0.15], 0.06), bxE(2, [0.36, 1.6, 0], [0.12, 0.1, 0.12], 0.06), bxSph(2, [0.47, 1.645, 0], 0.035, 0.03)];
  for (const s of [1, -1]) {
    pr.push(bxE(s > 0 ? 3 : 5, [-0.03, 2.1, s * 0.16], [0.05, 0.24, 0.105], 0.07, [s * -0.12, 0, 0.08]), bxE(s > 0 ? 4 : 6, [-0.08, 2.44, s * 0.2], [0.045, 0.2, 0.095], 0.05, [s * -0.12, 0, 0.12]));
    pr.push(bxCap(s > 0 ? 7 : 9, [0.22, 1.32, s * 0.27], [0.36, 1.06, s * 0.25], 0.1, 0.08, 0.06), bxE(s > 0 ? 8 : 10, [0.4, 0.99, s * 0.24], [0.085, 0.07, 0.075], 0.04));
    pr.push(bxE(s > 0 ? 11 : 13, [-0.05, 0.42, s * 0.29], [0.3, 0.32, 0.2], 0.08), bxE(s > 0 ? 12 : 14, [0.12, 0.08, s * 0.31], [0.28, 0.08, 0.11], 0.1)); }
  pr.push(bxSph(15, [-0.45, 0.7, 0], 0.15, 0.04));
  return bxSculpt({ h: 0.033, prims: pr, bones: RB_BONES.length, sig: 0.05,
    cuts: [{ f: (x, y) => y, k: 0.02 }, { f: (x, y, z) => Math.hypot(x - 0.29, y - 1.72, Math.abs(z) - 0.2) - 0.065, k: 0.015 },
      { f: (x, y, z) => { const s = Math.sign(z); return bxEll(x + 0.02 - 0.035, y - 2.2, Math.abs(z) - 0.17, 0.02, 0.3, 0.06); }, k: 0.02 }],
    detail: (x, y, z) => 0.004 * bxNoise(x * 9, y * 9, z * 9),
    color: (x, y, z, nx) => { let c = bxMix3(J, J2, bxSS(-0.2, 0.5, bxNoise(x * 2.5, y * 2.5, z * 2.5)));
      const v = Math.abs(bxNoise(x * 4 + 3, y * 3, z * 4)); c = bxMix3(c, V, (1 - bxSS(0, 0.06, v)) * 0.55);
      if (y > 2.3) c = bxMix3(c, V, bxSS(2.3, 2.6, y) * 0.7); if (y < 0.12) c = bxMix3(c, V, 0.5); // jade tips
      if (y > 1.95 && nx > 0.4) c = bxMix3(c, Pk, 0.7); // inner ears
      if (Math.hypot(x - 0.28, y - 1.57, Math.abs(z) - 0.25) < 0.06) c = bxMix3(c, Pk, 0.6); // blush
      if (Math.hypot(x - 0.47, y - 1.645, z) < 0.045) c = Pk; return c; } });
}
function mkRabbit(E) {
  const g = new THREE.Group(), U = { k: 3 }; g.userData = U;
  const jade = bxStd({ vertexColors: true, roughness: 0.2, metalness: 0, envMapIntensity: 1.1, emissive: '#16342a', emissiveIntensity: 0.18 });
  const S = bxBody('rabbit', rabbitGeo, RB_BONES, jade); U.S = S; U.B = S.B; const body = new THREE.Group(); g.add(body); body.add(S.mesh); U.body = body;
  const ruby = bxStd({ color: '#e0103a', emissive: '#90001c', emissiveIntensity: 0.7, roughness: 0.05, metalness: 0.2 }), shine = bxGlow('#ffffff'), gold = bxStd({ color: '#f0c45a', roughness: 0.2, metalness: 1 });
  U.eyes = []; for (const z of [-1, 1]) { const e = bxAt(S, 'head', bxMesh(new THREE.SphereGeometry(0.052, 18, 14), ruby), [0.3, 1.72, z * 0.205]); U.eyes.push(e); bxAt(S, 'head', bxMesh(new THREE.SphereGeometry(0.014, 8, 6), shine), [0.35, 1.745, z * 0.23]);
    const wk = bxStd({ color: '#e8e8e8', roughness: 0.4 }); for (let w = -1; w <= 1; w++) bxAt(S, 'head', bxMesh(bxStrand([[0, 0, 0], [0.04, w * 0.02, z * 0.12], [0.02, w * 0.05 - 0.02, z * 0.24]], 0.005, 0.002, 4, 5), wk), [0.42, 1.6 + w * 0.025, z * 0.08]); }
  const moon = bxAt(S, 'head', bxMesh(new THREE.TorusGeometry(0.085, 0.02, 8, 24, Math.PI * 1.25), gold), [0.33, 1.88, 0]); moon.rotation.set(0, Math.PI / 2, Math.PI * 0.88); moon.rotation.x = -0.35;
  const col = bxAt(S, 'chest', bxMesh(new THREE.TorusGeometry(0.29, 0.03, 10, 40), gold), [0.08, 1.4, 0]); col.rotation.set(Math.PI / 2, 0.3, 0);
  bxAt(S, 'chest', bxMesh(new THREE.SphereGeometry(0.06, 18, 14), gold), [0.37, 1.32, 0]);
  const silk = bxStd({ color: '#d0183a', roughness: 0.55 }); for (const z of [-1, 1]) bxAt(S, 'chest', bxMesh(bxStrand([[0, 0, 0], [0.02, -0.1, z * 0.04], [0.0, -0.22, z * 0.05]], 0.022, 0.012, 6, 6), silk), [0.38, 1.27, z * 0.02]);
  U.ph = 0; U.wasAir = false; U.land = 9; return g;
}
function rabbitTick(p, g, dt, ev = 9) {
  const U = g.userData, B = U.B, sp = p._spd || 0, jz = p.rjz != null ? p.rjz : p.jz || 0, air = jz > 0.05, wt = W.t + p.i * 1.3;
  const hopping = sp > 0.4 && !air; U.ph += dt * (hopping ? 3 + sp * 1.1 : 0);
  if (U.wasAir && !air) U.land = 0; U.wasAir = air; U.land += dt;
  const moon = p._msK === 'moon' && p._msT != null && p._msT < 1.15 ? p._msT : -1;
  let drop = 0; if (ev < 0.45) { drop = Math.pow(1 - ev / 0.45, 2) * 3.2; } else if (ev < 0.5) U.land = Math.min(U.land, ev - 0.45);
  const hop = hopping ? Math.abs(Math.sin(U.ph)) : 0, push = hopping ? Math.max(0, Math.cos(U.ph * 2)) : 0;
  const sq = U.land < 0.28 ? Math.sin(U.land / 0.28 * Math.PI) * (1 - U.land / 0.28 * 0.4) : 0, crouch = moon >= 0 && moon < 0.12 ? Math.sin(moon / 0.12 * Math.PI) : 0;
  U.body.position.y = hop * 0.36 + drop; const sY = 1 - 0.22 * sq - 0.15 * crouch + (air ? 0.06 : 0) + 0.06 * hop; U.body.scale.set(1 + (1 - sY) * 0.6, sY, 1 + (1 - sY) * 0.6);
  // root pitch: leaning into the hop, a forward flip during 月落
  const flip = moon > 0.18 && moon < 0.85 ? -Math.PI * 2 * ease((moon - 0.18) / 0.62) : 0;
  bxR(B.root, 0, 0, (hopping ? -0.12 + Math.cos(U.ph * 2) * 0.14 : 0) + (air ? -0.2 : 0) + flip);
  if (flip) { B.root.position.y = B.root.userData.rest.y; }
  const br = Math.sin(wt * 2) * 0.012; B.chest.scale.set(1 + br, 1 + br, 1 + br);
  // legs: push back on the ground, tuck in the air
  const tuck = air ? 1 : 0; for (const [th, ft, s] of [[B.thighL, B.footL, 1], [B.thighR, B.footR, -1]]) {
    bxR(th, 0, 0, 0.55 * tuck - 0.5 * push + 0.25 * hop + crouch * 0.4 + 0.3 * sq); bxR(ft, 0, 0, -0.7 * tuck + 0.6 * push - crouch * 0.3); }
  const reach = moon > 0 && moon < 0.6 ? 1 : 0;
  for (const [ar, hd, s] of [[B.armL, B.handL, 1], [B.armR, B.handR, -1]]) {
    bxR(ar, s * (0.1 * tuck), 0, 0.5 * tuck - 0.35 * hop + reach * 2.2 + Math.sin(wt * 2 + s) * 0.04 - 0.3 * sq); bxR(hd, 0, 0, 0.3 * tuck + reach * 0.4); }
  // ears: flop back with speed, stream in the air, twitch now and then, boing on landing
  const tw = (wt % 3.7) < 0.18 ? Math.sin((wt % 3.7) / 0.18 * Math.PI) : 0, boing = U.land < 0.9 ? Math.sin(U.land * 18) * Math.exp(-U.land * 4) : 0;
  const back = (air ? 0.9 : 0.25 * hop) + clamp(sp / 5, 0, 0.3) - boing * 0.7;
  bxR(B.earL, -0.15 - 0.08 * hop - tw * 0.25, 0, -back); bxR(B.earR, 0.15 + 0.08 * hop, 0, -back - tw * 0.15);
  bxR(B.earLt, 0, 0, -back * 0.7 - boing * 0.5); bxR(B.earRt, 0, 0, -back * 0.7 - boing * 0.5);
  bxR(B.head, Math.sin(wt * 0.8) * 0.05, Math.sin(wt * 0.5) * 0.15 * (sp < 0.4 ? 1 : 0), (air ? 0.18 : Math.sin(wt * 1.2) * 0.04) + sq * 0.15);
  bxR(B.tail, 0, Math.sin(wt * 5) * 0.2, 0);
  const blink = (wt % 4.3) < 0.12 ? 0.1 : 1; for (const e of U.eyes) e.scale.set(1, blink, 1);
  if (moon > 0 && moon < 1 && FXR() < dt * 40) { g.getWorldPosition(EVW); addP({ x: EVW.x + frnd(-0.5, 0.5), y: EVW.z + frnd(-0.5, 0.5), z: EVW.y + 1, vx: 0, vy: 0, vz: -1, g: 0, col: '#bff8ff', s: 0.12, life: 0.6 }); }
  if (U.land < 0.05 && FXR() < 0.5) { g.getWorldPosition(EVW); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; addP({ x: EVW.x, y: EVW.z, z: EVW.y + 0.05, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 0.4, g: 2, col: '#d8fff0', s: 0.08, life: 0.4 }); } }
}


/* ---------- 玄龟: the black tortoise (玄武) — an obsidian shell of domed scutes with glowing rune grooves, a gold rim, a serpent for a tail ---------- */
const TT_BONES = [['root', -1, [0, 0.45, 0]], ['neck', 0, [0.9, 0.52, 0]], ['head', 1, [1.38, 0.7, 0]], ['jaw', 2, [1.42, 0.63, 0]],
  ['hipFL', 0, [0.68, 0.45, 0.72]], ['footFL', 4, [0.8, 0.16, 0.86]], ['hipFR', 0, [0.68, 0.45, -0.72]], ['footFR', 6, [0.8, 0.16, -0.86]],
  ['hipBL', 0, [-0.68, 0.45, 0.72]], ['footBL', 8, [-0.8, 0.16, 0.86]], ['hipBR', 0, [-0.68, 0.45, -0.72]], ['footBR', 10, [-0.8, 0.16, -0.86]], ['tail', 0, [-1.05, 0.42, 0]]];
const TT_SC = (() => { const c = [[0, 1, 0]]; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; c.push([Math.sin(0.72) * Math.cos(a), Math.cos(0.72), Math.sin(0.72) * Math.sin(a)]); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; c.push([Math.sin(1.28) * Math.cos(a), Math.cos(1.28), Math.sin(1.28) * Math.sin(a)]); } return c; })();
function ttScute(x, y, z) { // angular distance to the nearest scute border (F2 - F1) and index of the scute
  let dx = x / 1.22, dy = (y - 0.48) / 0.8, dz = z / 1.02; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
  let a1 = 9, a2 = 9, i1 = 0; for (let i = 0; i < TT_SC.length; i++) { const c = TT_SC[i], a = Math.acos(clamp(c[0] * dx + c[1] * dy + c[2] * dz, -1, 1)); if (a < a1) { a2 = a1; a1 = a; i1 = i; } else if (a < a2) a2 = a; }
  return [a2 - a1, i1, a1];
}
function turtleGeos() {
  if (BX.geo.turtle) return BX.geo.turtle;
  const ob = bxC('#141e19'), ob2 = bxC('#34503f'), gr = bxC('#0a120e'), gold = bxC('#d8b04a'), bel = bxC('#b9a26a');
  const shell = bxSculpt({ h: 0.04, prims: [bxE(0, [0, 0.48, 0], [1.22, 0.8, 1.02]), bxE(0, [0, 0.47, 0], [1.3, 0.12, 1.1], 0.08), bxE(0, [0, 0.36, 0], [1.1, 0.15, 0.9], 0.08)],
    cuts: [{ f: (x, y) => y - 0.25, k: 0.04 }],
    detail: (x, y, z) => { if (y < 0.55) return 0; const [e, , a] = ttScute(x, y, z); return 0.035 * (1 - bxSS(0, 0.06, e)) - 0.03 * bxSS(0.05, 0.35, e) + 0.004 * bxNoise(x * 12, y * 12, z * 12); },
    color: (x, y, z, nx, ny) => { if (y < 0.42) return bel; if (y < 0.56 && ny < 0.75) return gold;
      const [e, i] = ttScute(x, y, z); let c = bxMix3(ob2, ob, bxSS(0.02, 0.3, e)); c = bxMix3(c, bxC('#5a8a6a'), 0.25 * bxSS(-0.2, 0.6, bxNoise(x * 4, y * 4, z * 4))); return e < 0.03 ? gr : c; },
    glow: (x, y, z) => { if (y < 0.56) return 0; const [e, i, a] = ttScute(x, y, z); let g = (1 - bxSS(0.008, 0.03, e)) * 0.9; if (i < 7 && Math.abs(a - 0.1) < 0.018) g = 1.2; if (i === 0 && a < 0.035) g = 1.3; return g; } });
  const body = bxSculpt({ h: 0.038, bones: TT_BONES.length, sig: 0.05, prims: (() => { const P = [bxE(0, [0, 0.42, 0], [0.98, 0.28, 0.82]),
      bxCap(1, [0.75, 0.5, 0], [1.28, 0.66, 0], 0.21, 0.17, 0.08), bxE(2, [1.48, 0.73, 0], [0.27, 0.19, 0.22], 0.08), bxE(2, [1.7, 0.69, 0], [0.12, 0.1, 0.15], 0.06),
      bxE(2, [1.55, 0.83, 0.12], [0.11, 0.045, 0.08], 0.04), bxE(2, [1.55, 0.83, -0.12], [0.11, 0.045, 0.08], 0.04), bxE(3, [1.58, 0.6, 0], [0.22, 0.06, 0.17], 0.03),
      bxCap(12, [-1.0, 0.42, 0], [-1.42, 0.4, 0], 0.13, 0.07, 0.06)];
      for (const [h, f, sx, sz] of [[4, 5, 1, 1], [6, 7, 1, -1], [8, 9, -1, 1], [10, 11, -1, -1]]) { P.push(bxCap(h, [0.6 * sx, 0.45, 0.62 * sz], [0.8 * sx, 0.2, 0.86 * sz], 0.24, 0.19, 0.08), bxE(f, [0.86 * sx, 0.09, 0.88 * sz], [0.26, 0.1, 0.22], 0.08)); } return P; })(),
    cuts: [{ f: (x, y, z) => Math.hypot(x - 1.58, y - 0.78, Math.abs(z) - 0.17) - 0.05, k: 0.012 }, { f: (x, y) => y + 0.01, k: 0.02 }],
    detail: (x, y, z) => 0.012 * Math.max(0, bxNoise(x * 16, y * 16, z * 16)),
    color: (x, y, z, nx, ny) => { const sk = bxC('#5a7a5c'), dk = bxC('#34503a'); const n = bxNoise(x * 26, y * 26, z * 26); let c = bxMix3(sk, dk, bxSS(-0.1, 0.4, n) * 0.7);
      if (ny < -0.3 && x > 0.7) c = bxMix3(c, bxC('#c8b27a'), 0.7); if (y < 0.06) c = bxMix3(c, dk, 0.6); return c; } });
  const head = bxSculpt({ h: 0.012, prims: [bxE(0, [0.06, 0, 0], [0.11, 0.055, 0.075]), bxE(0, [0.16, -0.005, 0], [0.07, 0.04, 0.05], 0.04), bxE(0, [-0.06, 0, 0], [0.08, 0.05, 0.055], 0.05)],
    color: (x, y) => y < -0.02 ? bxC('#c8a24a') : bxC('#14201c') });
  const claws = []; for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const one = []; claws.push(one); for (let c = -1; c <= 1; c++) { const a = c * 0.35 + (sz > 0 ? 0.3 : -0.3) * sx; one.push(bxStrand([[0.86 * sx + Math.cos(a) * 0.2 * sx, 0.07, 0.88 * sz + Math.sin(a) * 0.2 * sx], [0.86 * sx + Math.cos(a) * 0.3 * sx, 0.05, 0.88 * sz + Math.sin(a) * 0.3 * sx], [0.86 * sx + Math.cos(a) * 0.36 * sx, 0.0, 0.88 * sz + Math.sin(a) * 0.36 * sx]], 0.035, 0.004, 5, 4)); } }
  const studs = []; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, c = new THREE.ConeGeometry(0.06, 0.14, 6); c.rotateZ(-Math.PI / 2); c.rotateY(-a); c.translate(Math.cos(a) * 1.33, 0.47, Math.sin(a) * 1.12); studs.push(c); }
  return BX.geo.turtle = { shell, body, head, claws: claws.map(bxMerge), studs: bxMerge(studs) };
}
function mkTurtle(E) {
  const g = new THREE.Group(), U = { k: 4 }; g.userData = U; const GG = turtleGeos();
  const spin = new THREE.Group(); g.add(spin); U.spin = spin;
  const shellM = bxGlowAttr(bxStd({ vertexColors: true, roughness: 0.3, metalness: 0.25, envMapIntensity: 0.9 }), E.glow); U.shellM = shellM;
  U.shell = bxMesh(GG.shell, shellM, spin); const gold = bxStd({ color: '#e0b850', roughness: 0.25, metalness: 1 }); bxMesh(GG.studs, gold, U.shell);
  const skin = bxStd({ vertexColors: true, roughness: 0.6, metalness: 0, envMapIntensity: 0.5 });
  const S = bxSkin(GG.body, skin, TT_BONES); U.B = S.B; spin.add(S.mesh);
  ['footFL', 'footFR', 'footBL', 'footBR'].forEach((n, k) => bxAt(S, n, bxMesh(GG.claws[k], gold), [0, 0, 0])); // claws ride on the feet
  const eyeM = bxGlow(E.glow); U.eyes = []; for (const z of [-1, 1]) U.eyes.push(bxAt(S, 'head', bxMesh(new THREE.SphereGeometry(0.055, 14, 10), eyeM), [1.58, 0.78, z * 0.175]));
  for (const z of [-1, 1]) { const h = bxAt(S, 'head', bxMesh(new THREE.ConeGeometry(0.035, 0.12, 6), gold), [1.4, 0.88, z * 0.12]); h.rotation.set(z * 0.4, 0, 0.9); }
  // the serpent tail
  const tx = bxScales('xuanwu', { cols: 10, rows: 12, base: '#1c3a34', hi: '#3a7a6a', dark: '#081814', gap: '#04100c', line: '#7fffd0', lineMetal: 0, belly: '#c8a24a', bellyH: '#f0d080', bellyD: '#806020', bellyW: 0.25, bellyN: 6 });
  U.snake = bxTube(18, 10, t => 0.1 - 0.05 * bxSS(0.55, 1, t) + 0.015 * (1 - bxSS(0, 0.12, t)), bxStd({ map: tx.map, roughnessMap: tx.mr, roughness: 1, metalness: 0.1 }), { uRep: 2.5 });
  spin.add(U.snake.mesh); U.sHead = new THREE.Group(); spin.add(U.sHead); bxMesh(GG.head, bxStd({ vertexColors: true, roughness: 0.3 }), U.sHead);
  for (const z of [-1, 1]) bxMesh(new THREE.SphereGeometry(0.022, 8, 6), bxGlow('#ff4030'), U.sHead, 0.1, 0.03, z * 0.055);
  U.ring = bxMesh(new THREE.TorusGeometry(1.55, 0.05, 6, 48), bxGlow(E.glow, 0.7), g, 0, 0.5, 0); U.ring.rotation.x = Math.PI / 2; U.ring.visible = false;
  U.ph = 0; U.rt = 0; return g;
}
function turtleTick(p, g, dt, ev = 9) {
  const U = g.userData, B = U.B, sp = p._spd || 0, wt = W.t + p.i * 0.9, spin = p.spinT > 0 || (p._msK === 'spin' && p._msT != null && p._msT < 6);
  U.ph += dt * (sp > 0.3 ? 2 + sp * 1.5 : 0); const walk = sp > 0.3 ? 1 : 0;
  // entrance: falls in shut, slams down, then legs / head / tail come out and the runes light up
  const fall = ev < 0.35 ? Math.pow(1 - ev / 0.35, 2) : 0, out = ev < 0.4 ? 0 : ev < 1.1 ? ease((ev - 0.4) / 0.7) : 1;
  U.rt = lerp(U.rt, spin ? 1 : 0, Math.min(1, dt * 9));
  if (spin) U.spin.rotation.y += dt * 16; else U.spin.rotation.y = lerp(U.spin.rotation.y % (Math.PI * 2), 0, Math.min(1, dt * 6));
  const t = p._mpT != null ? p._mpT : 9, ram = t < 0.06 ? ease(t / 0.06) : t < 0.32 ? 1 : t < 0.5 ? 1 - ease((t - 0.32) / 0.18) : 0, cock = 0, bash = t > 0.3 && t < 0.55 ? Math.sin((t - 0.3) / 0.25 * Math.PI) : 0; /* (round 38b) it pulls in and charges with the shell; the head pops out snapping at the end */
  const r = Math.max(U.rt, 1 - out, ram), keep = 1 - r * 0.92;
  const land = ev >= 0.35 && ev < 0.7 ? Math.sin((ev - 0.35) / 0.35 * Math.PI) : 0;
  U.spin.position.set(bash * 0.45 - cock * 0.15, fall * 2.6 + Math.abs(Math.sin(U.ph)) * 0.035 * walk + U.rt * 0.18 - land * 0.08 + Math.sin(wt * 1.5) * 0.01, 0);
  U.spin.rotation.z = -ram * 0.2 - bash * 0.08; U.spin.rotation.x = ram * Math.sin(W.t * 45) * 0.05; /* nose down, rattling over the ground */
  if (ram > 0.5 && FXR() < dt * 60) { g.getWorldPosition(EVW); const a = p._ly + Math.PI + frnd(-0.6, 0.6); addP({ x: EVW.x + Math.cos(a) * 1.2, y: EVW.z + Math.sin(a) * 1.2, z: EVW.y + 0.1, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: 0.8, g: 2, col: '#8a8070', s: 0.14, life: 0.5, smoke: 1 }); } U.spin.scale.set(1 + land * 0.06, 1 - land * 0.1, 1 + land * 0.06);
  // limbs: diagonal gait; pulled into the shell when spinning
  const legs = [[B.hipFL, B.footFL, 0, 1, 1], [B.hipFR, B.footFR, Math.PI, 1, -1], [B.hipBL, B.footBL, Math.PI, -1, 1], [B.hipBR, B.footBR, 0, -1, -1]];
  legs.forEach(([h, f, o, sx, sz], k) => { const w = Math.sin(U.ph + o) * walk, lift = Math.max(0, Math.cos(U.ph + o)) * walk;
    const pop = clamp((out - k * 0.12) / 0.5, 0, 1), kk = Math.max(0.05, Math.min(keep, 0.05 + pop * 0.95));
    h.scale.setScalar(kk); bxP(h, -sx * 0.25 * (1 - kk), 0.02 * (1 - kk), -sz * 0.3 * (1 - kk)); bxR(h, sz * 0.1, 0, w * 0.45 + sx * bash * 0.2); bxR(f, 0, 0, -w * 0.25); bxP(f, 0, lift * 0.12, 0); });
  const headOut = clamp((out - 0.45) / 0.45, 0, 1), hk = Math.max(0.05, Math.min(keep, 0.05 + headOut * 0.95)), snap = ev > 0.85 && ev < 1.3 ? Math.sin((ev - 0.85) / 0.45 * Math.PI) : 0;
  B.neck.scale.setScalar(hk); bxP(B.neck, -0.45 * (1 - hk) - bash * 0.25, 0, 0);
  bxR(B.neck, 0, Math.sin(wt * 0.5) * 0.35 * (1 - walk) * (1 - bash), Math.sin(U.ph * 0.5) * 0.05 - bash * 0.25 + snap * 0.4);
  bxR(B.head, 0, Math.sin(wt * 0.5 + 0.6) * 0.2 * (1 - walk), Math.sin(wt * 0.9) * 0.05 + snap * 0.2); bxR(B.jaw, 0, 0, -(bash * 0.35 + snap * 0.6 + (p._msK === 'spin' && p._msT < 0.3 ? 0.4 : 0)));
  B.tail.scale.setScalar(Math.max(0.05, keep)); bxR(B.tail, 0, Math.sin(wt * 1.4) * 0.25, 0);
  // runes: light up in order on entry, pulse, blaze while spinning
  if (U.shellM.userData.glowU) U.shellM.userData.glowU.value = (out < 1 ? out : 1) * (0.75 + Math.sin(wt * 2.2) * 0.2) + U.rt * 0.8 + bash * 0.5;
  U.ring.visible = U.rt > 0.3; U.ring.scale.setScalar(0.9 + Math.sin(W.t * 20) * 0.08); U.ring.material.opacity = 0.5 * U.rt;
  for (const e of U.eyes) e.scale.setScalar(1 + bash * 0.4);
  // serpent: curls up over the back from the tail, head swaying, ducks in when spinning
  const P = U.snake.spine, sk = Math.max(0.15, keep) * clamp((out - 0.3) / 0.6, 0.1, 1);
  for (let i = 0; i < 18; i++) { const s = i / 17, a = s * Math.PI; // from the tail, arching up over the back of the shell
    const x = -1.45 + s * 1.15 * sk, y = 0.42 + Math.sin(a * 0.75) * 1.05 * sk + s * 0.25 * sk + Math.sin(s * 6 + wt * 1.5) * 0.04 * sk, z = Math.sin(s * 5 + wt * 0.8) * 0.18 * sk * (0.3 + s);
    const j = 17 - i; P[j * 3] = x; P[j * 3 + 1] = y; P[j * 3 + 2] = z; }
  bxTubeUpdate(U.snake); U.sHead.position.set(P[0], P[1], P[2]); U.sHead.scale.setScalar(sk * 1.5); U.sHead.rotation.set(0, Math.sin(wt * 1.1) * 0.6, -0.5 + Math.sin(wt * 1.7) * 0.15);
  if (spin && FXR() < dt * 30) { const a = FXR() * 6.28; g.getWorldPosition(EVW); addP({ x: EVW.x + Math.cos(a) * 1.6, y: EVW.z + Math.sin(a) * 1.6, z: EVW.y + 0.3, vx: -Math.sin(a) * 5, vy: Math.cos(a) * 5, vz: 0.6, g: 0.4, col: '#9fffe0', s: 0.1, life: 0.35 }); }
  if (land > 0.9 && FXR() < 0.6) { g.getWorldPosition(EVW); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; addP({ x: EVW.x + Math.cos(a) * 1.3, y: EVW.z + Math.sin(a) * 1.3, z: EVW.y + 0.05, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: 0.8, g: 3, col: '#8a8070', s: 0.12, life: 0.5, smoke: 1 }); } }
}


/* ---------- 火凤: the phoenix — a crimson body with a gold breast, burning wings of layered feathers, a crest, five flowing tail plumes ---------- */
const PH_BONES = [['root', -1, [0, 0.9, 0]], ['neck', 0, [0.36, 1.02, 0]], ['head', 1, [0.6, 1.36, 0]]];
// a feather: from the origin back along -x, width profile, colour from root to tip
function bxFeather(len, w, c0, c1, c2, droop = 0.12, curl = 0) {
  const n = 8, pos = [], col = [], idx = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = -len * t, y = -droop * len * t * t, ww = w * Math.pow(Math.sin(Math.PI * Math.min(0.98, 0.15 + t * 0.85)), 0.7) * (1 - 0.3 * t), c = t < 0.5 ? bxMix3(c0, c1, t * 2) : bxMix3(c1, c2, (t - 0.5) * 2);
    for (const s of [-1, 0, 1]) { pos.push(x, y + Math.abs(s) * 0.01 + curl * s * t, s * ww); col.push(...(s ? c : bxMix3(c, [1, 0.95, 0.7], 0.25))); } }
  for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function phoenixGeos() {
  if (BX.geo.phoenix) return BX.geo.phoenix;
  const R1 = bxC('#a00c06'), R2 = bxC('#e2300a'), O = bxC('#ff6a0c'), Y = bxC('#ffb52a'), Au = bxC('#f0b020');
  const body = bxSculpt({ h: 0.022, bones: 3, sig: 0.04, prims: [bxE(0, [0, 0.9, 0], [0.42, 0.18, 0.18]), bxE(0, [0.2, 0.93, 0], [0.22, 0.19, 0.16], 0.08), bxE(0, [-0.38, 0.9, 0], [0.22, 0.07, 0.11], 0.08),
      bxCap(1, [0.3, 1.0, 0], [0.56, 1.32, 0], 0.08, 0.05, 0.06), bxE(2, [0.66, 1.38, 0], [0.13, 0.075, 0.07], 0.05)],
    detail: (x, y, z) => 0.006 * Math.sin(x * 40 + Math.sin(z * 30) * 2),
    color: (x, y, z, nx, ny) => { let c = bxMix3(R1, R2, bxSS(0.8, 1.1, y)); c = bxMix3(c, Au, 0.8 * bxSS(0.1, 0.6, nx) * bxSS(1.1, 0.95, y) * bxSS(0.0, 0.2, x)); if (x > 0.5) c = bxMix3(c, O, 0.45); return c; } });
  const fW = (k, n) => k / (n - 1);
  const arm = [], hand = [], crest = [];
  for (let k = 0; k < 7; k++) { const z = 0.08 + k * 0.075, t = fW(k, 7);
    const g1 = bxFeather(0.5 + t * 0.12, 0.07, R1, R2, O); g1.rotateY(-0.12 - t * 0.1); g1.translate(-0.02, -0.01, z); arm.push(g1); // secondaries
    const g2 = bxFeather(0.24, 0.06, R2, O, Y, 0.05); g2.rotateY(-0.2); g2.translate(0.02, 0.015, z); arm.push(g2); } // coverts
  for (let k = 0; k < 9; k++) { const t = fW(k, 9), L = 0.68 + t * 0.32 - (t > 0.75 ? (t - 0.75) * 0.9 : 0);
    const g = bxFeather(L, 0.075, R2, O, Y, 0.1); g.rotateY(-0.2 - t * 1.25); g.translate(0, -0.005 + t * 0.01, 0.04 + t * 0.32); hand.push(g);
    const g2 = bxFeather(0.3, 0.06, R1, R2, O, 0.04); g2.rotateY(-0.25 - t * 1.0); g2.translate(0.02, 0.012, 0.04 + t * 0.25); hand.push(g2); }
  for (let k = 0; k < 3; k++) crest.push(bxStrand([[0, 0.05, 0], [-0.06, 0.22 + k * 0.04, (k - 1) * 0.04], [-0.24, 0.36 + k * 0.05, (k - 1) * 0.08], [-0.45, 0.34 + k * 0.06, (k - 1) * 0.12]], 0.02, 0.006, 5, 14, t => bxMix3(R2, Au, t)));
  return BX.geo.phoenix = { body, arm: bxMerge(arm), hand: bxMerge(hand), crest: bxMerge(crest), pR: [R1, R2, O, Y, Au] };
}
function mkPhoenix(E) {
  const g = new THREE.Group(), U = { k: 5, wings: [], plumes: [] }; g.userData = U; const GG = phoenixGeos();
  const bodyM = bxStd({ vertexColors: true, roughness: 0.4, emissive: '#5a1000', emissiveIntensity: 0.6 }), fire = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: '#d0d0d0' });
  const S = bxSkin(GG.body, bodyM, PH_BONES); U.B = S.B; const rig = new THREE.Group(); g.add(rig); rig.add(S.mesh); U.rig = rig;
  const gold = bxStd({ color: '#ffcf4a', roughness: 0.25, metalness: 1, emissive: '#402000' });
  const bk = bxAt(S, 'head', bxMesh(new THREE.ConeGeometry(0.04, 0.18, 10), gold), [0.83, 1.375, 0]); bk.rotation.z = -Math.PI / 2 - 0.2;
  U.lowBeak = bxAt(S, 'head', bxMesh(new THREE.ConeGeometry(0.035, 0.13, 8), gold), [0.79, 1.33, 0]); U.lowBeak.geometry.translate(0, 0.065, 0); U.lowBeak.position.x -= 0.065; U.lowBeak.rotation.z = -Math.PI / 2 + 0.1;
  for (const z of [-1, 1]) { bxAt(S, 'head', bxMesh(new THREE.SphereGeometry(0.035, 10, 8), bxGlow('#ffd040')), [0.71, 1.4, z * 0.06]).scale.set(0.7, 0.55, 0.7); bxAt(S, 'head', bxMesh(new THREE.SphereGeometry(0.012, 6, 4), bxStd({ color: '#200000' })), [0.73, 1.402, z * 0.075]); }
  bxAt(S, 'head', bxMesh(GG.crest, fire), [0.58, 1.42, 0]).position.set(-0.02, 0.06, 0);
  U.aura = bxMesh(new THREE.SphereGeometry(0.6, 16, 12), bxGlow('#ff6a20', 0.04), rig, 0, 0.92, 0); U.aura.scale.set(1.6, 0.85, 1);
  for (const z of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(0.05, 1.0, z * 0.17); rig.add(sh); const arm = new THREE.Group(); sh.add(arm);
    const am = bxMesh(GG.arm, fire, arm); const hand = new THREE.Group(); hand.position.set(0, 0, z * 0.58); arm.add(hand); const hm = bxMesh(GG.hand, fire, hand);
    if (z < 0) { am.scale.z = -1; hm.scale.z = -1; } U.wings.push({ sh, arm, hand, z }); }
  // tail plumes: ribbons re-laid every frame
  for (let k = 0; k < 5; k++) { const n = 16, pos = new Float32Array((n + 1) * 3 * 3), col = new Float32Array((n + 1) * 3 * 3), idx = [], [R1, R2, O, Y, Au] = GG.pR;
    for (let i = 0; i <= n; i++) { const t = i / n, c = t < 0.75 ? bxMix3(R2, O, t / 0.75) : bxMix3(Y, Au, (t - 0.75) * 4); for (let j = 0; j < 3; j++) col.set(t > 0.86 && j === 1 ? [0.1, 0.5, 0.9] : c, (i * 3 + j) * 3); }
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, fire); m.frustumCulled = false; rig.add(m); U.plumes.push({ geo, n, k }); }
  return g;
}
function phoenixTick(p, g, dt, ev = 9) {
  const U = g.userData, B = U.B, sp = p._spd || 0, wt = W.t + p.i * 1.1, t = p._mpT != null ? p._mpT : 9, sT = p._msK === 'rebirth' && p._msT != null ? p._msT : 9;
  const cockF = t < 0.08 ? ease(t / 0.08) : t < 0.14 ? 1 - ease((t - 0.08) / 0.06) : 0, shoot = t < 0.08 ? 0 : t < 0.18 ? ease((t - 0.08) / 0.1) : t < 0.42 ? 1 - ease((t - 0.18) / 0.24) : 0, beat = Math.max(cockF, shoot); /* (round 38b) a big wing beat throws the feathers */
  const wrap = sT < 0.3 ? ease(sT / 0.3) : sT < 0.42 ? 1 - ease((sT - 0.3) / 0.12) : 0, burst = sT > 0.3 && sT < 1.1 ? Math.sin(clamp((sT - 0.3) / 0.8, 0, 1) * Math.PI) : 0;
  const born = ev < 1.3 ? ev : 9, fold = born < 0.45 ? 1 : born < 0.75 ? 1 - ease((born - 0.45) / 0.3) : 0, cry = born > 0.6 && born < 1.3 ? Math.sin((born - 0.6) / 0.7 * Math.PI) : 0;
  const fr = 5.5 + sp * 0.6 + burst * 6, fl = Math.sin(wt * fr), fl2 = Math.sin(wt * fr - 0.7);
  for (const Wg of U.wings) { const s = Wg.z, lift = (fl * 0.6 + 0.4) * (1 - beat);
    Wg.sh.rotation.set(-s * (lift * (1 - fold) - wrap * 0.4 + burst * 0.6 - fold * 0.3 + cockF * 1.0 - shoot * 0.85), -s * (shoot * 1.15 - cockF * 0.35 + wrap * 1.4 + fold * 1.3 + sp * 0.02), -0.1 + shoot * 0.35);
    if (shoot > 0.4 && t < 0.24 && FXR() < dt * 70) { Wg.hand.getWorldPosition(EVW); const a = p._ly + frnd(-0.4, 0.4); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, vz: frnd(-1, 0.5), g: 0.3, col: FXR() < 0.5 ? '#ffd060' : '#ff6a1e', s: 0.13, life: 0.4 }); }
    Wg.hand.rotation.set(-s * fl2 * 0.45 * (1 - fold), -s * (wrap * 0.9 + fold * 1.2 - burst * 0.3), 0); }
  U.rig.position.y = fl * 0.06 + (born < 0.45 ? -0.5 * (1 - born / 0.45) : 0); U.rig.rotation.z = -clamp(sp * 0.04, 0, 0.25) + shoot * 0.12 - burst * 0.15;
  const s0 = born < 0.45 ? 0.3 + 0.7 * ease(born / 0.45) : 1; U.rig.scale.setScalar(s0 * (1 + burst * 0.12));
  bxR(B.neck, 0, Math.sin(wt * 0.7) * 0.1, shoot * 0.2 + cry * 0.35 + burst * 0.2); bxR(B.head, 0, 0, Math.sin(wt * 1.3) * 0.06 + cry * 0.25 - shoot * 0.1);
  U.lowBeak.rotation.z = -Math.PI / 2 + 0.1 - (cry * 0.5 + shoot * 0.25 + burst * 0.3);
  const reb = p.rebT > 0 ? 1 : 0; /* (round 38c) 涅槃之火 lingers around it */ U.aura.material.opacity = 0.03 + burst * 0.07 + reb * (0.06 + Math.sin(W.t * 9) * 0.02) + (born < 0.8 ? (0.8 - born) * 0.2 : 0); U.aura.visible = burst > 0.02 || born < 0.8 || reb;
  if (reb && FXR() < dt * 45) { g.getWorldPosition(EVW); const a = FXR() * 6.28, rr = 1 + FXR() * 3; addP({ x: EVW.x + Math.cos(a) * rr, y: EVW.z + Math.sin(a) * rr, z: EVW.y - 0.2 + FXR() * 1.5, vx: -Math.sin(a) * 1.5, vy: Math.cos(a) * 1.5, vz: 1.2, g: -0.3, col: FXR() < 0.5 ? '#ffb030' : '#ff5a1a', s: 0.16, life: 0.6 }); } U.aura.scale.set(1.1 * (1 + burst), 0.6 * (1 + burst), 0.7 * (1 + burst));
  // plumes: flowing behind, fanned
  for (const Pl of U.plumes) { const pos = Pl.geo.attributes.position.array, k = Pl.k, sp2 = (k - 2) * 0.22, L = 1.6 + (k === 2 ? 0.35 : 0);
    let x = -0.42, y = 0.92, z = (k - 2) * 0.05;
    for (let i = 0; i <= Pl.n; i++) { const tt = i / Pl.n, d = L / Pl.n, a = sp2 * (0.4 + tt), wave = Math.sin(wt * 3 - tt * 4 + k) * 0.25 * tt, droop = -0.35 * tt - clamp(sp * 0.05, 0, 0.2) * -1 + wave;
      if (i) { x -= Math.cos(a) * d; z += Math.sin(a) * d * 0.9; y += droop * d; }
      const w = (0.035 + 0.04 * Math.sin(Math.PI * tt)) * (tt > 0.85 ? 1.9 : 1);
      for (let j = 0; j < 3; j++) { const o = (j - 1) * w, q = (i * 3 + j) * 3; pos[q] = x - Math.sin(a) * o * 0.3; pos[q + 1] = y + Math.abs(j - 1) * 0.01; pos[q + 2] = z + Math.cos(a) * o; } }
    Pl.geo.attributes.position.needsUpdate = true; Pl.geo.computeVertexNormals(); }
  if (FXR() < dt * 26) { const Wg = U.wings[(FXR() * 2) | 0]; Wg.hand.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: frnd(-0.6, 0.6), vy: frnd(-0.6, 0.6), vz: frnd(-0.8, 0.2), g: 0.5, col: FXR() < 0.5 ? '#ffb43a' : '#ff5a1a', s: 0.1, life: 0.55 }); }
  if ((burst || born < 0.7) && FXR() < dt * 50) { g.getWorldPosition(EVW); const a = FXR() * 6.28; addP({ x: EVW.x, y: EVW.z, z: EVW.y + 1, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, vz: frnd(-1, 1), g: 0.2, col: '#ffd060', s: 0.18, life: 0.6 }); }
}


/* ---------- 铁熊: an armoured war-bear — thick fur, steel pauldrons and back plates, exhaust stacks from the old tank, steel claws, burning eyes ---------- */
const BR_BONES = [['root', -1, [-0.6, 1.0, 0]], ['chest', 0, [-0.15, 1.05, 0]], ['neck', 1, [0.75, 1.3, 0]], ['head', 2, [1.1, 1.38, 0]], ['jaw', 3, [1.3, 1.2, 0]],
  ['shL', 1, [0.5, 1.0, 0.42]], ['elL', 5, [0.58, 0.52, 0.44]], ['pwL', 6, [0.62, 0.12, 0.44]], ['shR', 1, [0.5, 1.0, -0.42]], ['elR', 8, [0.58, 0.52, -0.44]], ['pwR', 9, [0.62, 0.12, -0.44]],
  ['hpL', 0, [-0.72, 0.95, 0.4]], ['knL', 11, [-0.84, 0.5, 0.43]], ['hwL', 12, [-0.74, 0.12, 0.43]], ['hpR', 0, [-0.72, 0.95, -0.4]], ['knR', 14, [-0.84, 0.5, -0.43]], ['hwR', 15, [-0.74, 0.12, -0.43]], ['tail', 0, [-1.12, 1.1, 0]]];
function bearGeos() {
  if (BX.geo.bear) return BX.geo.bear;
  const F = bxC('#7a5232'), Fd = bxC('#3a2616'), Fl = bxC('#b08860'), N = bxC('#141010');
  const pr = [bxE(0, [-0.6, 1.0, 0], [0.55, 0.5, 0.45]), bxE(1, [0.25, 1.1, 0], [0.62, 0.55, 0.48], 0.15), bxE(1, [0.15, 1.45, 0], [0.42, 0.25, 0.36], 0.15), bxE(1, [0.35, 0.82, 0], [0.4, 0.3, 0.36], 0.12),
    bxE(2, [0.8, 1.3, 0], [0.3, 0.3, 0.3], 0.12), bxE(3, [1.12, 1.4, 0], [0.3, 0.27, 0.28], 0.1), bxE(3, [1.4, 1.29, 0], [0.19, 0.12, 0.14], 0.07), bxSph(3, [1.57, 1.32, 0], 0.06, 0.04),
    bxSph(3, [0.98, 1.64, 0.2], 0.1, 0.04), bxSph(3, [0.98, 1.64, -0.2], 0.1, 0.04), bxE(3, [1.25, 1.5, 0.12], [0.12, 0.05, 0.08], 0.04), bxE(3, [1.25, 1.5, -0.12], [0.12, 0.05, 0.08], 0.04),
    bxE(4, [1.38, 1.17, 0], [0.18, 0.06, 0.12], 0.03), bxSph(17, [-1.13, 1.1, 0], 0.12, 0.05)];
  for (const s of [1, -1]) { const b = s > 0 ? 0 : 3;
    pr.push(bxCap(5 + b, [0.5, 1.0, s * 0.4], [0.58, 0.52, s * 0.43], 0.24, 0.17, 0.1), bxCap(6 + b, [0.58, 0.52, s * 0.43], [0.62, 0.15, s * 0.44], 0.16, 0.14, 0.06), bxE(7 + b, [0.7, 0.09, s * 0.44], [0.22, 0.09, 0.17], 0.06));
    pr.push(bxCap(11 + b, [-0.72, 0.98, s * 0.38], [-0.84, 0.5, s * 0.43], 0.3, 0.18, 0.1), bxCap(12 + b, [-0.84, 0.5, s * 0.43], [-0.74, 0.15, s * 0.44], 0.16, 0.14, 0.06), bxE(13 + b, [-0.64, 0.09, s * 0.44], [0.22, 0.09, 0.17], 0.06)); }
  const body = bxSculpt({ h: 0.04, prims: pr, bones: BR_BONES.length, sig: 0.06,
    cuts: [{ f: (x, y) => y + 0.0, k: 0.02 }, { f: (x, y, z) => Math.hypot(x - 1.27, y - 1.46, Math.abs(z) - 0.15) - 0.05, k: 0.015 }],
    detail: (x, y, z) => 0.016 * bxNoise(x * 7, y * 7, z * 7) + 0.006 * bxNoise(x * 22, y * 22 + x * 8, z * 22),
    color: (x, y, z, nx, ny) => { const n = bxNoise(x * 6, y * 9, z * 6); let c = bxMix3(F, Fd, bxSS(-0.3, 0.6, n) * 0.6);
      if (y < 0.55) c = bxMix3(c, Fd, 0.55); if (x > 1.3) c = bxMix3(c, Fl, 0.8); if (ny < -0.5 && x > 0) c = bxMix3(c, Fl, 0.35);
      if (Math.hypot(x - 1.57, y - 1.32, z) < 0.075) c = N; if (y < 0.12) c = bxMix3(c, N, 0.6); return c; } });
  const pauld = bxSculpt({ h: 0.02, prims: [bxE(0, [0, 0, 0], [0.3, 0.22, 0.26])], cuts: [{ f: (x, y, z) => bxEll(x, y + 0.03, z, 0.27, 0.2, 0.23), k: 0.01 }, { f: (x, y) => y + 0.02, k: 0.01 }],
    color: (x, y) => Math.abs(y - 0.05) < 0.02 || Math.abs(y - 0.13) < 0.015 ? bxC('#c8a24a') : bxC('#9aa2aa') });
  const claws = []; for (const s of [1, -1]) { const one = []; for (let c = -1; c <= 1; c++) { const z = s * 0.44 + c * 0.08; one.push(bxStrand([[0.82, 0.1, z], [0.94, 0.08, z * 1.02], [1.02, 0.0, z * 1.03]], 0.04, 0.004, 6, 6)); } claws.push(bxMerge(one)); }
  return BX.geo.bear = { body, pauld, clawL: claws[0], clawR: claws[1] };
}
function mkBear(E) {
  const g = new THREE.Group(), U = { k: 6 }; g.userData = U; const GG = bearGeos();
  const fur = bxStd({ vertexColors: true, roughness: 0.88, metalness: 0, envMapIntensity: 0.35 });
  const S = bxSkin(GG.body, fur, BR_BONES); U.B = S.B; g.add(S.mesh);
  const steel = bxStd({ color: '#9aa2aa', roughness: 0.32, metalness: 1, envMapIntensity: 1 }), steelD = bxStd({ color: '#4a5058', roughness: 0.4, metalness: 1 }), brass = bxStd({ color: '#c8a24a', roughness: 0.3, metalness: 1 });
  const pm = bxStd({ vertexColors: true, roughness: 0.32, metalness: 1, envMapIntensity: 1 });
  for (const s of [1, -1]) { const p = bxAt(S, s > 0 ? 'shL' : 'shR', bxMesh(GG.pauld, pm), [0.48, 1.18, s * 0.47]); p.rotation.set(s * 0.55, 0, -0.25);
    const ga = bxAt(S, s > 0 ? 'elL' : 'elR', bxMesh(new THREE.CylinderGeometry(0.19, 0.2, 0.2, 16), steel), [0.6, 0.36, s * 0.44]); ga.rotation.z = 0.08;
    bxAt(S, s > 0 ? 'elL' : 'elR', bxMesh(new THREE.TorusGeometry(0.195, 0.022, 6, 20), brass), [0.6, 0.27, s * 0.44]).rotation.x = Math.PI / 2;
    bxAt(S, s > 0 ? 'pwL' : 'pwR', bxMesh(s > 0 ? GG.clawL : GG.clawR, steel), [0, 0, 0]); }
  // segmented back plates + exhaust stacks
  for (let k = 0; k < 4; k++) { const pl = bxAt(S, 'chest', bxMesh(new THREE.CylinderGeometry(0.6, 0.6, 0.24, 20, 1, true, Math.PI * 0.12, Math.PI * 0.76), steel), [-0.5 + k * 0.26, 1.12 + Math.sin(k * 0.9) * 0.04, 0]);
    pl.rotation.set(0, 0, Math.PI / 2); pl.scale.set(0.82 + (k === 3 ? 0.06 : 0), 1, 1.0 + k * 0.04); pl.material = k % 2 ? steelD : steel; pl.material.side = THREE.DoubleSide; }
  U.pipes = []; for (const z of [-1, 1]) { const pp = bxAt(S, 'chest', bxMesh(new THREE.CylinderGeometry(0.06, 0.075, 0.45, 12), steelD), [-0.55, 1.65, z * 0.18]); pp.rotation.z = 0.35;
    bxAt(S, 'chest', bxMesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), brass), [-0.47, 1.85, z * 0.18]).rotation.set(Math.PI / 2, 0.35, 0); U.pipes.push(pp); }
  const helm = bxAt(S, 'head', bxMesh(new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.32), steel), [1.12, 1.42, 0]); helm.rotation.z = -0.5;
  bxAt(S, 'head', bxMesh(new THREE.BoxGeometry(0.34, 0.05, 0.3), brass), [1.38, 1.38, 0]).rotation.z = -0.2;
  const em = bxAt(S, 'chest', bxMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 6), brass), [0.82, 1.0, 0]); em.rotation.z = Math.PI / 2 - 0.4;
  U.core = bxAt(S, 'chest', bxMesh(new THREE.SphereGeometry(0.055, 12, 8), bxGlow(E.glow)), [0.85, 1.01, 0]);
  U.eyes = []; for (const z of [-1, 1]) U.eyes.push(bxAt(S, 'head', bxMesh(new THREE.SphereGeometry(0.045, 12, 8), bxGlow(E.glow)), [1.3, 1.46, z * 0.15]));
  const tooth = bxStd({ color: '#f4eee0', roughness: 0.3 }); for (const z of [-1, 1]) { const t1 = bxAt(S, 'jaw', bxMesh(new THREE.ConeGeometry(0.025, 0.08, 6), tooth), [1.48, 1.24, z * 0.08]); bxAt(S, 'head', bxMesh(new THREE.ConeGeometry(0.028, 0.09, 6), tooth), [1.5, 1.22, z * 0.08]).rotation.x = Math.PI; void t1; }
  U.ph = 0; return g;
}
function bearTick(p, g, dt, ev = 9) {
  const U = g.userData, B = U.B, sp = p._spd || 0, wt = W.t + p.i * 1.7; U.ph += dt * (sp > 0.3 ? 2.2 + sp * 1.3 : 0); const ph = U.ph, w = sp > 0.3 ? clamp(sp / 3, 0.4, 1) : 0;
  const t = p._mpT != null ? p._mpT : 9, c = p._mcombo || 0, side = p._mpS ? 1 : -1;
  const cock = t < 0.12 ? ease(t / 0.12) : 0, hit = t < 0.12 ? 0 : t < 0.22 ? ease((t - 0.12) / 0.1) : t < 0.55 ? 1 - ease((t - 0.22) / 0.33) : 0; /* (rear for the slap: up a little as the paw lifts, down as it lands) */
  const roarT = p._msK === 'roar' && p._msT != null ? p._msT : 9, roar = roarT < 1.4 ? Math.sin(Math.min(1, roarT / 1.4) * Math.PI) : 0;
  const intro = ev < 1.6 ? ev : 9, rise = intro < 0.35 ? 0 : intro < 0.7 ? ease((intro - 0.35) / 0.35) : intro < 1.3 ? 1 : intro < 1.6 ? 1 - ease((intro - 1.3) / 0.3) : 0, crouchI = intro < 0.35 ? 1 - intro / 0.35 : 0;
  // rear: the slam combo lifts the front high then drives it down; the roar and the entrance stand it up
  const slam = c === 2 && t < 0.6 ? (t < 0.2 ? ease(t / 0.2) * 0.85 : t < 0.32 ? 0.85 - ease((t - 0.2) / 0.12) * 1.05 : -0.2 * (1 - (t - 0.32) / 0.28)) : 0;
  const rear = (c < 2 ? (cock * 0.15 + hit * 0.25) * (t < 0.6 ? 1 : 0) : slam) + roar * 0.5 + rise * 1.0;
  bxR(B.root, 0, 0, rear * 0.35); bxP(B.root, 0, Math.abs(Math.sin(ph)) * 0.05 * w - crouchI * 0.35 + rise * 0.15, 0); bxR(B.chest, Math.sin(ph) * 0.04 * w, 0, rear * 0.55 - crouchI * 0.15);
  const br = Math.sin(wt * 1.8) * 0.015; B.chest.scale.set(1 + br, 1 + br, 1 + br);
  // legs: diagonal walk cycle
  const leg = (sh, el, pw, k, front) => { const s = Math.sin(ph + k), lift = Math.max(0, -Math.cos(ph + k));
    bxR(sh, 0, 0, s * 0.5 * w + (front ? -rear * 0.4 : -rear * 0.3) + crouchI * (front ? 0.5 : -0.4)); bxR(el, 0, 0, front ? -lift * 0.7 * w - crouchI * 0.6 : lift * 0.7 * w + crouchI * 0.8); bxR(pw, 0, 0, front ? lift * 0.5 * w : -lift * 0.4 * w); };
  leg(B.shL, B.elL, B.pwL, 0, 1); leg(B.hpR, B.knR, B.hwR, 0.2, 0); leg(B.shR, B.elR, B.pwR, Math.PI, 1); leg(B.hpL, B.knL, B.hwL, Math.PI + 0.2, 0);
  // swipes: the striking arm lifts out and rakes across; the slam: both arms high then down
  if (c < 2 && t < 0.55) { /* (round 38b) slap: the paw goes up high, then comes down flat in front */ const up = t < 0.12 ? ease(t / 0.12) : t < 0.19 ? 1 - ease((t - 0.12) / 0.07) : 0, dn = t < 0.12 ? 0 : t < 0.19 ? ease((t - 0.12) / 0.07) : t < 0.52 ? 1 - ease((t - 0.19) / 0.33) : 0;
    const [sh, el, pw] = side > 0 ? [B.shL, B.elL, B.pwL] : [B.shR, B.elR, B.pwR]; bxR(sh, side * -0.45 * up, side * 0.15 * up, 3.0 * up - 0.45 * dn); bxR(el, 0, 0, -0.35 * up + 0.25 * dn); bxR(pw, 0, 0, 0.6 * up - 0.3 * dn); bxR(B.chest, side * 0.18 * (up - dn), side * 0.2 * up, (rear * 0.55) + 0.32 * up - 0.15 * dn); bxR(B.root, 0, 0, rear * 0.35 + 0.12 * up - 0.06 * dn);
    if (t > 0.17 && t < 0.22 && FXR() < 0.7) { pw.getWorldPosition(EVW); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 0.8, g: 4, col: '#8a7a60', s: 0.11, life: 0.45, smoke: 1 }); } } }
  if (c === 2 && t < 0.6) for (const [sh, el] of [[B.shL, B.elL], [B.shR, B.elR]]) { bxR(sh, 0, 0, slam * 1.6); bxR(el, 0, 0, -0.3 - Math.max(0, slam) * 0.4); }
  if (rise > 0 || roar > 0) for (const [sh, el, s] of [[B.shL, B.elL, 1], [B.shR, B.elR, -1]]) { const a = Math.max(rise, roar); bxR(sh, s * -0.5 * a, 0, -rear * 0.3 + 0.9 * a); bxR(el, 0, 0, -0.9 * a); }
  bxR(B.neck, 0, Math.sin(wt * 0.6) * 0.12 * (1 - w), -rear * 0.25 + roar * 0.35 + rise * 0.3 + (sp < 0.3 ? Math.sin(wt * 3.1) * 0.03 : 0));
  bxR(B.head, roar ? Math.sin(W.t * 38) * 0.08 : 0, 0, roar * 0.35 + hit * 0.1 + Math.max(0, rise - 0.5) * 0.5);
  const roarI = intro > 0.7 && intro < 1.4 ? Math.sin((intro - 0.7) / 0.7 * Math.PI) : 0; bxR(B.jaw, 0, 0, -(roar * 0.75 + roarI * 0.75 + hit * 0.3 + cock * 0.15));
  bxR(B.tail, 0, Math.sin(wt * 3) * 0.2, 0);
  const rg = p.rageT > 0; for (const e of U.eyes) { e.material.color.set(rg ? '#ff3020' : '#ff8a3a'); e.scale.setScalar(rg ? 1.3 + Math.sin(W.t * 12) * 0.2 : 1); }
  U.core.material.color.set(rg ? '#ff3020' : '#ff8a3a'); U.core.scale.setScalar(1 + Math.sin(W.t * (rg ? 10 : 3)) * 0.15);
  if ((rg || sp > 2 || roar > 0.5) && FXR() < dt * (rg ? 20 : 8)) { const pp = U.pipes[FXR() < 0.5 ? 0 : 1]; pp.getWorldPosition(EVW); addP({ x: EVW.x, y: EVW.z, z: EVW.y + 0.25, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: 1.4, g: -0.4, col: rg ? '#ff7a40' : '#888888', s: 0.14, life: 0.8, smoke: 1 }); }
  if (c === 2 && t > 0.3 && t < 0.36 && FXR() < 0.6) { B.pwL.getWorldPosition(EVW); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; addP({ x: EVW.x, y: EVW.z, z: EVW.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: 1, g: 4, col: '#8a7a60', s: 0.12, life: 0.5, smoke: 1 }); } }
}


const BEAST_S = [0, 1.3, 1.25, 1.25, 1.3, 1.25, 1.25]; // overall size per beast
const BEAST_MK = [null, mkSnake, mkDragon, mkRabbit, mkTurtle, mkPhoenix, mkBear], BEAST_TICK = [null, snakeTick, dragonTick, rabbitTick, turtleTick, phoenixTick, bearTick];
function mkBeast(v) { const E = EVO[v], g = BEAST_MK[v](E), root = new THREE.Group(); root.add(g); root.userData = { k: v, g, S: BEAST_S[v] }; g.scale.setScalar(BEAST_S[v]); root.traverse(o => { if (o.isMesh && o.material.blending !== THREE.AdditiveBlending) o.castShadow = true; }); return root; }
// mech ↔ beast: returns how much of the mech to show (1 = all, 0 = hidden)
function evoDraw(p, m, dt) {
  const E = EVO[p.veh], on = !!(p.evoOn && E && inMech(p)); if (p._evT != null) p._evT += dt; const ev = p._evT != null ? p._evT : 9;
  if (E && inMech(p) && !BX.warm[p.veh]) { const v = BX.warm[p.veh] = p.veh; setTimeout(() => mkBeast(v), 1200); } // sculpt this mech's beast once, a moment after first climbing in (bodies are cached)
  const show = on || (E && p._evOn === 0 && ev < 0.45 && inMech(p));
  if (!show) { if (m.evo) m.evo.visible = false; return 1; }
  if (!m.evo || m.evo.userData.k !== p.veh) { if (m.evo) m.g.remove(m.evo); m.evo = mkBeast(p.veh); m.g.add(m.evo); }
  const sB = on ? ease(clamp((ev - 0.05) / 0.35, 0.02, 1)) : clamp(1 - ev / 0.4, 0, 1); m.evo.visible = sB > 0.02; m.evo.scale.setScalar(sB); m.evo.rotation.y = -p._ly;
  if (m.evo.visible) BEAST_TICK[p.veh](p, m.evo.userData.g, dt, on ? ev : 9);
  return on ? clamp(1 - ev / 0.3, 0, 1) : clamp((ev - 0.3) / 0.3, 0, 1);
}
BX.warm = {};

// events
function evoEvent(e) { const q = W.p[e.o]; if (!q) return; q._evT = 0; q._evOn = e.on ? 1 : 0; const E = EVO[e.v];
  sfx(e.on ? 'xform' : 'clank', e.x, e.y); shake(e.x, e.y, e.on ? 0.5 : 0.15);
  const col = E ? E.glow : '#ffffff'; fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.1, s0: 0.5, s1: e.on ? BAL.evoBurst + 0.5 : 2, life: 0.5, col, op: 0.9 }); fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z + 1.2, s0: 0.4, s1: 2.6, life: 0.45, col, op: 0.7 });
  for (let k = 0; k < (e.on ? 40 : 14); k++) { const a = FXR() * 6.28, s2 = frnd(2, 6); addP({ x: e.x, y: e.y, z: e.z + 0.5 + FXR() * 1.5, vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, vz: frnd(0, 3), g: 0.3, col, s: 0.12, life: 0.7 }); }
  if (e.on && e.o === ME && E) { const b = document.createElement('div'); b.className = 'evoban'; b.textContent = '进化 · ' + E.name; document.body.appendChild(b); setTimeout(() => b.remove(), 1900); }
}
function evoSkillFx(e) { const q = W.p[e.o], E = q && EVO[q.veh];
  if (e.t === 'venom') { sfx('smoke', e.x, e.y); for (let k = 0; k < 20; k++) { const a = FXR() * 6.28, r = FXR() * 4; addP({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, z: e.z + 0.3, vx: 0, vy: 0, vz: 0.8, g: 0.1, col: '#7ae04a', s: 0.25, life: 1.2, smoke: 1 }); } }
  else if (e.t === 'dragdash') { sfx('mdash', e.x, e.y); sfx('flame', e.x, e.y); for (let k = 0; k < 30; k++) { const d = FXR() * (e.d || 10), aa = e.a + frnd(-0.2, 0.2); addP({ x: e.x + Math.cos(e.a) * d, y: e.y + Math.sin(e.a) * d, z: e.z + 1, vx: Math.cos(aa) * 2, vy: Math.sin(aa) * 2, vz: frnd(0, 2), g: 0.4, col: FXR() < 0.5 ? '#ff8a2a' : '#ffd040', s: 0.2, life: 0.7 }); } }
  else if (e.t === 'moon') { sfx('jump', e.x, e.y); fxAdd({ kind: 'disc', x: e.e[0], y: e.e[1], z: e.z + 0.06, s0: 6, s1: 6, life: 0.95, col: '#bff8ff', op: 0.25 }); }
  else if (e.t === 'spin') { sfx('mdash', e.x, e.y); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.3, s0: 1, s1: 2.8, life: 0.4, col: '#7fffd0', op: 0.8 }); }
  else if (e.t === 'rebirth') { sfx('blood', e.x, e.y); shake(e.x, e.y, 0.5); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z, s0: 0.5, s1: 6.5, life: 0.6, col: '#ffb030', op: 0.9 }); fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z + 0.8, s0: 0.6, s1: 6, life: 0.55, col: '#ff6a1e', op: 0.5 });
    for (let k = 0; k < 60; k++) { const a = FXR() * 6.28, s2 = frnd(3, 9); addP({ x: e.x, y: e.y, z: e.z + 0.8, vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, vz: frnd(-2, 3), g: 0.2, col: FXR() < 0.5 ? '#ffd060' : '#ff4a1a', s: 0.2, life: 0.8 }); } }
  else if (e.t === 'roar') { sfx('bigdie', e.x, e.y); shake(e.x, e.y, 0.7); for (let k = 0; k < 3; k++) fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.4 + k * 0.5, s0: 1, s1: 9, life: 0.5 + k * 0.15, col: '#ffcc88', op: 0.6 }); }
  void E;
}
function evoFeathers(e) { const q = W.p[e.o]; if (q) { q._mpT = 0; q._mA = e.a; q._mAT = 0.3; } sfx('mswing', e.x, e.y);
  for (let i = 0; i + 2 < e.e.length; i += 3) { const sx = e.s ? e.s[i] : e.x, sy = e.s ? e.s[i + 1] : e.y, sz = e.s ? e.s[i + 2] : e.z; RND.tracers.push({ x: sx, y: sy, z: sz, x2: e.e[i], y2: e.e[i + 1], z2: e.e[i + 2], t: 0, life: 0.12, w: 0.06, col: [1, 0.55, 0.15] }); (RND.mrk = RND.mrk || []).push({ x: sx, y: sy, z: sz, e: [e.e[i], e.e[i + 1], e.e[i + 2]], T: Math.max(0.05, Math.hypot(e.e[i] - sx, e.e[i + 1] - sy) / 32), t: 0, kd: 'feather' }); } }
function evoMoonFx(e) { shake(e.x, e.y, 0.9); sfx('collapse', e.x, e.y); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.08, s0: 0.8, s1: e.r, life: 0.6, col: '#bff8ff', op: 0.9 }); fxAdd({ kind: 'ball', x: e.x, y: e.y, z: e.z + 0.5, s0: 0.5, s1: 3.5, life: 0.4, col: '#eaffff', op: 0.6 });
  for (let k = 0; k < 50; k++) { const a = FXR() * 6.28, r = FXR() * e.r; addP({ x: e.x + Math.cos(a) * r * 0.3, y: e.y + Math.sin(a) * r * 0.3, z: e.z + 0.1, vx: Math.cos(a) * frnd(3, 8), vy: Math.sin(a) * frnd(3, 8), vz: frnd(1, 5), g: -9, col: FXR() < 0.5 ? '#9a8a70' : '#bff8ff', s: 0.15, life: 0.8 }); }
  if (typeof addDecal === 'function') addDecal(e.x, e.y, e.z + 0.02, e.r * 0.5, '#2a2a30'); }

/* (round 38c) lingering skill zones: 赤龙's burning trail, 玉兔's moonlit crater */
const EVZ = [];
function evoZone(e) { const end = W.t + e.t; EVZ.push({ k: e.zk, x: e.x, y: e.y, x2: e.x2, y2: e.y2, z: e.z, r: e.r, end });
  if (e.zk === 'moon') { fxAdd({ kind: 'disc', x: e.x, y: e.y, z: e.z + 0.05, s0: e.r, s1: e.r, life: e.t, col: '#bff0ff', op: 0.16 }); fxAdd({ kind: 'ring', x: e.x, y: e.y, z: e.z + 0.06, s0: e.r, s1: e.r, life: e.t, col: '#dffaff', op: 0.5 }); } }
function evoZoneTick(dt) {
  for (let i = EVZ.length - 1; i >= 0; i--) { const Z = EVZ[i], left = Z.end - W.t; if (left <= 0) { EVZ.splice(i, 1); continue; } const f = Math.min(1, left / 0.8);
    if (Z.k === 'fire') { const n = Math.ceil(dt * 70 * f); for (let k = 0; k < n; k++) { const u = FXR(), x = Z.x + (Z.x2 - Z.x) * u + frnd(-0.6, 0.6), y = Z.y + (Z.y2 - Z.y) * u + frnd(-0.6, 0.6); addP({ x, y, z: Z.z + 0.05, vx: frnd(-0.3, 0.3), vy: frnd(-0.3, 0.3), vz: frnd(1, 2.2), g: -0.5, col: FXR() < 0.4 ? '#ffd040' : FXR() < 0.7 ? '#ff7a20' : '#d03010', s: 0.16 + FXR() * 0.1, life: 0.55 }); } if (thr('ezf', 0.5)) sfx('flamer', (Z.x + Z.x2) / 2, (Z.y + Z.y2) / 2); }
    else if (Z.k === 'moon') { if (FXR() < dt * 30 * f) { const a = FXR() * 6.28, rr = Math.sqrt(FXR()) * Z.r; addP({ x: Z.x + Math.cos(a) * rr, y: Z.y + Math.sin(a) * rr, z: Z.z + 0.1, vx: 0, vy: 0, vz: 0.9, g: -0.1, col: FXR() < 0.5 ? '#eaffff' : '#9fe8ff', s: 0.08, life: 1.0 }); } } }
}
