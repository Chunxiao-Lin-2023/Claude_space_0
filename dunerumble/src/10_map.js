/* ================= map: generation, queries, LOS, A* ================= */
const T_FLOOR = 0, T_WALL = 1, T_BUSH = 2, T_WATER = 3, T_BORDER = 4;
const THEMES = {
  desert: {
    name: '仙人掌峡谷', g1: 0xeac68b, g2: 0xe1ba7c, speck: 0xc99a5c, rock: 0xc8653f, rockTop: 0xe08a58, crate: 0xb07440, crateTop: 0xd29a5c,
    bush: [0x5bb043, 0x4e9e37, 0x6cc04f], water: 0x3aa6dc, waterDeep: 0x2a7fb8, border: 0xa65234, borderTop: 0xc56b45, out: 0xc99a62, outFar: 0xb98955,
    sky: 0xf4d9a6, fog: 0xe9c58f, deco: 'cactus', ice: false,
  },
  snow: {
    name: '雪松冰原', g1: 0xeef4f9, g2: 0xe2ebf3, speck: 0xc6d4e2, rock: 0x7f93ad, rockTop: 0xf4f8fc, crate: 0x8f6a4b, crateTop: 0xf1f5f9,
    bush: [0x2e8a62, 0x267a55, 0x36a070], water: 0x8fd3f2, waterDeep: 0x6bb7e0, border: 0x6c7f99, borderTop: 0xf2f7fb, out: 0xd8e3ee, outFar: 0xc8d6e4,
    sky: 0xdfeaf5, fog: 0xd5e2ee, deco: 'pine', ice: true,
  },
  dusk: {
    name: '落日绿洲', g1: 0xd9b38c, g2: 0xcfa983, speck: 0xb88b62, rock: 0x8c5a8a, rockTop: 0xb17bb0, crate: 0x9a6338, crateTop: 0xc58b52,
    bush: [0x3fa36b, 0x35915e, 0x4cb87b], water: 0x37b5b0, waterDeep: 0x248f95, border: 0x6e4470, borderTop: 0x8f5d92, out: 0xb98d6c, outFar: 0xa47b5d,
    sky: 0xf2b88a, fog: 0xe0a77d, deco: 'palm', ice: false,
  },
  lava: {
    name: '熔岩火山', g1: 0x6b5a58, g2: 0x625250, speck: 0x4a3c3a, rock: 0x3d3338, rockTop: 0x5c4c52, crate: 0x6b4a33, crateTop: 0x8a6448,
    bush: [0x8a6d3b, 0x7a5f33, 0x9a7a44], water: 0xff7a1a, waterDeep: 0xc8361a, border: 0x2e262b, borderTop: 0x4a3e44, out: 0x3e3236, outFar: 0x30282c,
    sky: 0x5a3a3a, fog: 0x4a3434, deco: 'spire', ice: false, lava: true, locked: 250,
  },
};
const M = { N: BAL.N, t: null, sty: null, box: null, boxes: [], spawns: [], theme: 'desert', seed: 1, ver: 0, deco: [] };
const tIdx = (x, z) => z * M.N + x;
const inMap = (x, z) => x >= 0 && z >= 0 && x < M.N && z < M.N;
function tileAt(x, z) { const tx = Math.floor(x), tz = Math.floor(z); if (!inMap(tx, tz)) return T_BORDER; return M.t[tIdx(tx, tz)]; }
function solidTile(tx, tz) { if (!inMap(tx, tz)) return true; const i = tIdx(tx, tz), t = M.t[i]; return t === T_WALL || t === T_BORDER || t === T_WATER || M.box[i] >= 0; }
function blockShotTile(tx, tz) { if (!inMap(tx, tz)) return true; const i = tIdx(tx, tz), t = M.t[i]; return t === T_WALL || t === T_BORDER || M.box[i] >= 0; }
function inBush(x, z) { return tileAt(x, z) === T_BUSH; }

function genMap(seed, theme) {
  const N = BAL.N, H = N / 2, rng = mulberry32(seed * 9973 + 17);
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  M.N = N; M.seed = seed; M.theme = theme; M.ver++;
  M.t = new Uint8Array(N * N); M.sty = new Uint8Array(N * N); M.box = new Int16Array(N * N).fill(-1); M.boxes = []; M.deco = [];
  const q = new Uint8Array(H * H); const qs = new Uint8Array(H * H); // quadrant
  const qset = (x, z, v, s) => { if (x >= 1 && z >= 1 && x < H && z < H) { q[z * H + x] = v; if (s != null) qs[z * H + x] = s; } };
  const qget = (x, z) => (x >= 0 && z >= 0 && x < H && z < H) ? q[z * H + x] : 255;
  // walls
  const nW = ri(8, 11);
  for (let i = 0; i < nW; i++) {
    const x = ri(2, H - 2), z = ri(2, H - 2), s = rng() < 0.62 ? 0 : 1, kind = ri(0, 4);
    if (kind === 0) { const L = ri(2, 5); for (let k = 0; k < L; k++) qset(x + k, z, 1, s); }
    else if (kind === 1) { const L = ri(2, 5); for (let k = 0; k < L; k++) qset(x, z + k, 1, s); }
    else if (kind === 2) { qset(x, z, 1, s); qset(x + 1, z, 1, s); qset(x, z + 1, 1, s); qset(x + 1, z + 1, 1, s); }
    else if (kind === 3) { const L = ri(3, 4); for (let k = 0; k < L; k++) qset(x + k, z, 1, s); for (let k = 1; k < 3; k++) qset(x, z + k, 1, s); }
    else { qset(x, z, 1, s); qset(x + 1, z, 1, s); qset(x - 1, z, 1, s); qset(x, z + 1, 1, s); }
  }
  const blob = (v, n) => {
    let x = ri(2, H - 2), z = ri(2, H - 2), tries = 0;
    while (qget(x, z) !== 0 && tries++ < 30) { x = ri(2, H - 2); z = ri(2, H - 2); }
    const cells = [[x, z]]; qset(x, z, v);
    for (let k = 1; k < n; k++) {
      const c = cells[Math.floor(rng() * cells.length)], d = ri(0, 3), nx = c[0] + [1, -1, 0, 0][d], nz = c[1] + [0, 0, 1, -1][d];
      if (qget(nx, nz) === 0) { qset(nx, nz, v); cells.push([nx, nz]); }
    }
  };
  if (rng() < 0.75) blob(T_WATER, ri(4, 8));
  const nB = ri(6, 9); for (let i = 0; i < nB; i++) blob(T_BUSH, ri(4, 11));
  // mirror into full map
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const qx = x < H ? x : N - 1 - x, qz = z < H ? z : N - 1 - z;
    M.t[tIdx(x, z)] = q[qz * H + qx]; M.sty[tIdx(x, z)] = qs[qz * H + qx];
    if (x === 0 || z === 0 || x === N - 1 || z === N - 1) M.t[tIdx(x, z)] = T_BORDER;
  }
  // center plaza
  for (let z = H - 2; z <= H + 1; z++) for (let x = H - 2; x <= H + 1; x++) if (M.t[tIdx(x, z)] !== T_BUSH) M.t[tIdx(x, z)] = T_FLOOR;
  // spawns on a ring
  M.spawns = [];
  const a0 = rng() * TAU;
  for (let i = 0; i < 10; i++) {
    const a = a0 + i * TAU / 10, r = 14.5;
    const sx = Math.floor(H + Math.cos(a) * r), sz = Math.floor(H + Math.sin(a) * r);
    for (let z = sz - 1; z <= sz + 1; z++) for (let x = sx - 1; x <= sx + 1; x++) if (inMap(x, z) && M.t[tIdx(x, z)] !== T_BORDER) M.t[tIdx(x, z)] = T_FLOOR;
    M.spawns.push({ x: sx + 0.5, z: sz + 0.5 });
  }
  // connectivity: carve from each spawn toward center if unreachable
  const reach = () => {
    const seen = new Uint8Array(N * N), st = [tIdx(H, H)]; seen[st[0]] = 1;
    while (st.length) { const i = st.pop(), x = i % N, z = (i / N) | 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (!inMap(nx, nz)) continue; const j = tIdx(nx, nz), t = M.t[j]; if (seen[j] || t === T_WALL || t === T_BORDER || t === T_WATER) continue; seen[j] = 1; st.push(j); } }
    return seen;
  };
  let seen = reach();
  for (const s of M.spawns) {
    let x = Math.floor(s.x), z = Math.floor(s.z), g = 0;
    while (!seen[tIdx(x, z)] && g++ < 40) {
      if (M.t[tIdx(x, z)] !== T_BORDER) M.t[tIdx(x, z)] = T_FLOOR;
      const dx = H - x, dz = H - z; if (Math.abs(dx) > Math.abs(dz)) x += Math.sign(dx); else z += Math.sign(dz);
      if (M.t[tIdx(x, z)] !== T_BORDER && !seen[tIdx(x, z)]) M.t[tIdx(x, z)] = M.t[tIdx(x, z)] === T_BUSH ? T_BUSH : T_FLOOR;
    }
    seen = reach();
  }
  for (let i = 0; i < N * N; i++) if (!seen[i] && (M.t[i] === T_FLOOR || M.t[i] === T_BUSH)) { M.t[i] = T_WALL; M.sty[i] = 0; }
  // power boxes: 3 per quadrant mirrored + center 4
  const spawnNear = (x, z) => M.spawns.some(s => d2(s.x, s.z, x + .5, z + .5) < 9);
  const boxSpots = [];
  let tries = 0;
  while (boxSpots.length < 4 && tries++ < 300) {
    const x = ri(3, H - 2), z = ri(3, H - 2);
    if (M.t[tIdx(x, z)] !== T_FLOOR || spawnNear(x, z) || boxSpots.some(b => Math.abs(b[0] - x) + Math.abs(b[1] - z) < 4)) continue;
    boxSpots.push([x, z]);
  }
  const addBox = (x, z) => { if (M.box[tIdx(x, z)] >= 0 || M.t[tIdx(x, z)] !== T_FLOOR) return; const b = { id: M.boxes.length, tx: x, tz: z, hp: BAL.boxHp }; M.boxes.push(b); M.box[tIdx(x, z)] = b.id; };
  for (const [x, z] of boxSpots) { addBox(x, z); addBox(N - 1 - x, z); addBox(x, N - 1 - z); addBox(N - 1 - x, N - 1 - z); }
  addBox(H - 1, H - 1); addBox(H, H); addBox(H - 1, H); addBox(H, H - 1);
  // decorations (visual only, no collision)
  M.arena = null; M.goals = null; M.teamSpawns = null;
  for (let i = 0; i < N * N; i++) if (M.t[i] === T_FLOOR && M.box[i] < 0 && rng() < 0.09) M.deco.push({ x: (i % N) + 0.2 + rng() * 0.6, z: ((i / N) | 0) + 0.2 + rng() * 0.6, k: ri(0, 2), r: rng() * TAU, s: 0.7 + rng() * 0.6 });
  genGimmicks(rng, 'solo');
}

function los(ax, az, bx, bz, ignoreTarget) {
  const dx = bx - ax, dz = bz - az, L = Math.sqrt(dx * dx + dz * dz), n = Math.ceil(L / 0.25);
  const gx = Math.floor(bx), gz = Math.floor(bz);
  for (let i = 1; i < n; i++) { const x = ax + dx * i / n, z = az + dz * i / n, tx = Math.floor(x), tz = Math.floor(z); if (ignoreTarget && tx === gx && tz === gz) continue; if (blockShotTile(tx, tz)) return false; }
  return true;
}

/* A* on tile grid (8-dir, no corner cutting). allowGoalSolid lets a bot path up to a box. */
const ASTAR = { g: null, f: null, from: null, closed: null, stamp: 0, mark: null };
function astar(sx, sz, gx, gz, maxIter = 2500) {
  const N = M.N;
  sx = clamp(Math.floor(sx), 0, N - 1); sz = clamp(Math.floor(sz), 0, N - 1); gx = clamp(Math.floor(gx), 0, N - 1); gz = clamp(Math.floor(gz), 0, N - 1);
  if (!ASTAR.g || ASTAR.g.length !== N * N) { ASTAR.g = new Float32Array(N * N); ASTAR.from = new Int32Array(N * N); ASTAR.mark = new Uint32Array(N * N); ASTAR.closed = new Uint32Array(N * N); }
  const st = ++ASTAR.stamp, g = ASTAR.g, from = ASTAR.from, mark = ASTAR.mark, closed = ASTAR.closed;
  const start = tIdx(sx, sz), goal = tIdx(gx, gz);
  const heap = []; // [f, idx]
  const push = (f, i) => { heap.push([f, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (; ;) { const l = c * 2 + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  const h = (x, z) => { const dx = Math.abs(x - gx), dz = Math.abs(z - gz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  mark[start] = st; g[start] = 0; from[start] = -1; push(h(sx, sz), start);
  let it = 0, best = start, bestH = h(sx, sz);
  while (heap.length && it++ < maxIter) {
    const [, i] = pop(); if (closed[i] === st) continue; closed[i] = st;
    if (i === goal) { best = i; break; }
    const x = i % N, z = (i / N) | 0;
    const hh = h(x, z); if (hh < bestH) { bestH = hh; best = i; }
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const nx = x + dx, nz = z + dz; if (!inMap(nx, nz)) continue;
      const j = tIdx(nx, nz);
      if (j !== goal && solidTile(nx, nz)) continue;
      if (dx && dz && (solidTile(x + dx, z) || solidTile(x, z + dz))) continue;
      const ng = g[i] + (dx && dz ? 1.414 : 1) + (M.t[j] === T_BUSH ? -0.05 : 0);
      if (mark[j] === st && ng >= g[j]) continue;
      mark[j] = st; g[j] = ng; from[j] = i; push(ng + h(nx, nz), j);
    }
  }
  const path = []; let c = best;
  while (c !== -1 && c !== start && path.length < 400) { path.push({ x: (c % N) + 0.5, z: ((c / N) | 0) + 0.5 }); c = from[c]; }
  path.reverse();
  return path;
}
