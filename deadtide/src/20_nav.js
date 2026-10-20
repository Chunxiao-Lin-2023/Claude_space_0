/* ================= navigation: grid movement with stairs & ledges, flow fields, 3D rays ================= */
const enterable = (x, y, L, who) => inMap(x, y) && L >= 0 && L < ML && !solidFor(W.blk[ci(x, y, L)], who);
// moving the centre from column (cx,cy) into (nx,ny) at layer L: returns the new layer or -1 if blocked
function transition(cx, cy, nx, ny, L, who, canDrop) {
  const hi = ci(cx, cy, L), here = W.blk[hi];
  if (B[here].stairs) { const d = DIRS[W.bdir[hi]]; if (nx - cx === d[0] && ny - cy === d[1] && standable(nx, ny, L + 1, who)) return L + 1; }
  if (standable(nx, ny, L, who)) return L;
  if (L > 0 && enterable(nx, ny, L, who) && !support(nx, ny, L)) {
    const b = blkAt(nx, ny, L - 1);
    if (B[b].stairs) { const d = DIRS[W.bdir[ci(nx, ny, L - 1)]]; if (nx + d[0] === cx && ny + d[1] === cy) return L - 1; }
    if (canDrop) { for (let l = L - 1; l >= 0; l--) { if (standable(nx, ny, l, who)) return l; if (!enterable(nx, ny, l, who)) return -1; } }
  }
  return -1;
}
// elevation (world units) of an entity standing at (x,y) on layer L (stairs are ramps)
function surfZ(x, y, L) {
  const cx = Math.floor(x), cy = Math.floor(y);
  if (!inMap(cx, cy)) return L * FH;
  const i = ci(cx, cy, L);
  if (B[W.blk[i]].stairs) {
    const d = W.bdir[i], fx = x - cx, fy = y - cy;
    const t = d === 0 ? fx : d === 1 ? fy : d === 2 ? 1 - fx : 1 - fy;
    return (L + clamp(t, 0, 1)) * FH;
  }
  return L * FH;
}
// move entity e by (dx,dy) tiles; sets e.bump (cell index of a solid block it ran into) and e.dropped
function moveEnt(e, dx, dy, who, canDrop) {
  e.bump = -1;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.2));
  for (let s = 0; s < n; s++) {
    for (let ax = 0; ax < 2; ax++) {
      const d = (ax ? dy : dx) / n; if (!d) continue;
      const cx = Math.floor(e.x), cy = Math.floor(e.y);
      let v = (ax ? e.y : e.x) + d;
      const cur = ax ? cy : cx, nc = Math.floor(v);
      if (nc !== cur) {
        const nx = ax ? cx : nc, ny = ax ? nc : cy;
        const L2 = transition(cx, cy, nx, ny, e.L, who, canDrop);
        if (L2 < 0) { v = d > 0 ? nc - 0.001 : cur + 0.001; noteBump(e, nx, ny); }
        else { if (L2 < e.L && !B[blkAt(nx, ny, L2)].stairs) e.dropped = e.L - L2; e.L = L2; }
      } else {
        // keep a radius from blocked neighbour columns
        const f = v - cur, sgnd = d > 0 ? 1 : -1;
        if ((sgnd > 0 && f > 1 - e.r) || (sgnd < 0 && f < e.r)) {
          const nx = ax ? cx : cx + sgnd, ny = ax ? cy + sgnd : cy;
          if (transition(cx, cy, nx, ny, e.L, who, canDrop) < 0) { v = sgnd > 0 ? cur + 1 - e.r : cur + e.r; noteBump(e, nx, ny); }
        }
      }
      if (ax) e.y = v; else e.x = v;
    }
  }
  e.x = clamp(e.x, 0.3, MW - 0.3); e.y = clamp(e.y, 0.3, MH - 0.3);
}
function noteBump(e, nx, ny) { if (inMap(nx, ny)) { const i = ci(nx, ny, e.L); if (W.blk[i]) e.bump = i; } }

/* ---------- flow fields (Dijkstra over cells, reversed from the targets) ---------- */
class Heap {
  constructor(n) { this.k = new Float32Array(n); this.v = new Int32Array(n); this.n = 0; }
  push(k, v) { let i = this.n++; const K = this.k, V = this.v; while (i > 0) { const p = (i - 1) >> 1; if (K[p] <= k) break; K[i] = K[p]; V[i] = V[p]; i = p; } K[i] = k; V[i] = v; }
  pop() { const K = this.k, V = this.v, top = V[0], k = K[--this.n], v = V[this.n]; let i = 0; const n = this.n; while (true) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && K[c + 1] < K[c]) c++; if (K[c] >= k) break; K[i] = K[c]; V[i] = V[c]; i = c; } K[i] = k; V[i] = v; this.lastK = K[0]; return top; }
}
const HEAP = new Heap(NC * 6);
// cost of stepping INTO cell i for a zombie (Infinity = never)
function enterCost(i) {
  const b = W.blk[i];
  if (!b) return 1;
  const Bb = B[b];
  if (Bb.stairs || !Bb.Z) return Bb.wire ? 3 : 1;
  if (Bb.brk) return 1 + W.bhp[i] / 15;
  return Infinity;
}
// is cell i a node a zombie can occupy (possibly after smashing what's in it)?
function navNode(x, y, L) { const i = ci(x, y, L), b = W.blk[i]; if (b && !B[b].stairs && B[b].Z && !B[b].brk) return false; return support(x, y, L); }
// neighbours of cell (x,y,L) for zombies; climb adds wall-climbing moves. cb(nx,ny,nL,extraCost)
function navNbrs(x, y, L, climb, cb) {
  const i = ci(x, y, L), b = W.blk[i];
  if (B[b].stairs) { const d = DIRS[W.bdir[i]]; const nx = x + d[0], ny = y + d[1]; if (inMap(nx, ny) && L + 1 < ML && navNode(nx, ny, L + 1)) cb(nx, ny, L + 1, 0); }
  for (let k = 0; k < 4; k++) {
    const [dx, dy] = DIRS[k], nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue;
    if (navNode(nx, ny, L)) cb(nx, ny, L, 0);
    else if (L > 0) { const sb = blkAt(nx, ny, L - 1); if (B[sb].stairs) { const d = DIRS[W.bdir[ci(nx, ny, L - 1)]]; if (nx + d[0] === x && ny + d[1] === y && enterable(nx, ny, L, 'z')) cb(nx, ny, L - 1, 0); } }
    if (climb && L + 1 < ML) {
      const nb = W.blk[ci(nx, ny, L)];
      if (nb && B[nb].top && B[nb].Z && enterable(nx, ny, L + 1, 'z') && enterable(x, y, L + 1, 'z')) cb(nx, ny, L + 1, 1.5);
      if (L > 0 && B[b].top === 0 && enterable(nx, ny, L, 'z') && !support(nx, ny, L) && navNode(nx, ny, L - 1)) cb(nx, ny, L - 1, 0.5);
    }
  }
}
function buildField(out, sources, climb) {
  out.fill(Infinity);
  const H = HEAP; H.n = 0;
  for (const s of sources) { out[s] = 0; H.push(0, s); }
  while (H.n) {
    const k = H.k[0], v = H.pop();
    if (k > out[v]) continue;
    const x = cx_(v), y = cy_(v), L = cl_(v), ec = enterCost(v) + 0;
    navNbrs(x, y, L, climb, (nx, ny, nL, extra) => {
      const u = ci(nx, ny, nL), nd = k + (v === u ? 0 : ec) + extra;
      if (nd < out[u]) { out[u] = nd; H.push(nd, u); }
    });
  }
}
function radioSources() {
  const out = [], { x, y } = W.radio, L = gAt(x, y);
  for (const [dx, dy] of DIRS) { const i = ci(x + dx, y + dy, L); if (navNode(x + dx, y + dy, L)) out.push(i); }
  return out;
}
function updateFields(dt, force) {
  const F = W.ff;
  F.rT -= dt; F.pT -= dt;
  if ((W.navDirty && F.rT <= 0) || force) { buildField(F.rw, radioSources(), false); if (W.zs.some(z => z.k === 'climber')) buildField(F.rc, radioSources(), true); else F.rc.set(F.rw); W.navDirty = false; F.rT = 0.4; }
  if (F.pT <= 0 || force) {
    F.pT = 0.35;
    const src = W.p.filter(p => !p.gone && !p.dead).map(p => ci(Math.floor(p.x), Math.floor(p.y), p.L));
    buildField(F.pw, src, false);
    if (W.zs.some(z => z.k === 'climber')) buildField(F.pc, src, true); else F.pc.set(F.pw);
  }
}

/* ---------- 3D rays (world: x east, y south, z up; cells are 1 x 1 x FH) ---------- */
// returns {d, i} distance to the first bullet-stopping cell / floor, i = cell index or -1
function rayWorld(ox, oy, oz, dx, dy, dz, maxD, opt) {
  const maxL = opt && opt.maxL != null ? opt.maxL : ML - 1, pick = opt && opt.pick;
  let x = Math.floor(ox), y = Math.floor(oy), l = Math.floor(oz / FH);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx ? Math.abs(1 / dx) : 1e9, tdy = dy ? Math.abs(1 / dy) : 1e9, tdz = dz ? Math.abs(FH / dz) : 1e9;
  let tmx = dx ? ((dx > 0 ? x + 1 - ox : ox - x) * tdx) : 1e9;
  let tmy = dy ? ((dy > 0 ? y + 1 - oy : oy - y) * tdy) : 1e9;
  let tmz = dz ? ((dz > 0 ? (l + 1) * FH - oz : oz - l * FH) / Math.abs(dz)) : 1e9;
  let d = 0, face = -1;
  const blocks = (x, y, l) => {
    if (l < 0) return true;
    if (!inMap(x, y) || l >= ML) return false;
    if (l > maxL) return false;
    const b = W.blk[ci(x, y, l)];
    if (!b) return false;
    if (B[b].B) return true;
    if (pick && (b === 22 || b === 21 || b === 23 || B[b].P)) return true;
    return false;
  };
  for (let it = 0; it < 400 && d <= maxD; it++) {
    if (blocks(x, y, l)) return { d, i: inMap(x, y) && l >= 0 && l < ML ? ci(x, y, l) : -1, face, x, y, l };
    if (tmx < tmy && tmx < tmz) { d = tmx; tmx += tdx; x += sx; face = 0; }
    else if (tmy < tmz) { d = tmy; tmy += tdy; y += sy; face = 1; }
    else {
      d = tmz; tmz += tdz;
      const upper = sz > 0 ? l + 1 : l; // the layer whose floor we cross
      if (inMap(x, y) && upper >= 0 && upper < ML && upper <= maxL && (W.slab[ci(x, y, upper)] || (pick && upper === gAt(x, y) && upper > 0 && false))) return { d, i: ci(x, y, upper), face: 2, slab: 1, x, y, l: upper };
      l += sz; face = 2;
      if (l >= ML + 2 && sz > 0) break;
    }
    if (x < -2 || y < -2 || x > MW + 2 || y > MH + 2) break;
  }
  return { d: maxD, i: -1 };
}
// ray vs axis-aligned box (min corner + size), returns entry distance or -1
function rayBox(ox, oy, oz, dx, dy, dz, bx, by, bz, sx, sy, sz, maxD) {
  let t0 = 0, t1 = maxD;
  for (const [o, d, lo, hi] of [[ox, dx, bx, bx + sx], [oy, dy, by, by + sy], [oz, dz, bz, bz + sz]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return -1; continue; }
    let a = (lo - o) / d, b = (hi - o) / d; if (a > b) { const q = a; a = b; b = q; }
    t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return -1;
  }
  return t0;
}
// line of sight between two points (bullet rules)
function los(ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz); if (L < 1e-6) return true;
  return rayWorld(ax, ay, az, dx / L, dy / L, dz / L, L).d >= L - 0.05;
}
