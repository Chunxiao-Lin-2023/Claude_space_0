/* ================= world: tiles, collision, structural support, building rules ================= */
const ix = (tx, ty) => ty * MW + tx;
function tileAt(tx, ty) {
  if (tx < 0 || tx >= MW || ty >= MH) return DIRT;
  if (ty < 0) return 0;
  return W.tiles[ty * MW + tx];
}
const tf = t => TF[t];
const solidFor = (t, who) => t !== 0 && !!(who === 'p' ? TF[t].P : who === 'z' ? TF[t].Z : TF[t].B);
const isPlat = (tx, ty) => { const t = tileAt(tx, ty); return t !== 0 && (TF[t].plat || (TF[t].lad && tileAt(tx, ty - 1) !== t)); };
const inZone = tx => tx >= BZ0 && tx < BZ1;

/* ---------- map generation (deterministic from seed) ---------- */
function genMap(seed) {
  const tiles = new Uint8Array(MW * MH), thp = new Float32Array(MW * MH);
  for (let y = GR; y < MH; y++) for (let x = 0; x < MW; x++) tiles[ix(x, y)] = DIRT;
  const put = (x, y, id) => { tiles[ix(x, y)] = id; thp[ix(x, y)] = TF[id].hp; };
  // starter shack: two storeys, interior cols 65..74
  for (const c of [64, 75]) { put(c, 37, 1); put(c, 38, 7); put(c, 39, 7); put(c, 33, 1); put(c, 34, 8); put(c, 35, 1); }
  for (let c = 64; c <= 75; c++) put(c, 36, 4);
  for (let r = 36; r <= 39; r++) put(66, r, 6);
  put(73, 35, 10);
  // scavenging spots on both sides
  const rng = mulberry(seed ^ 0x5bd1e995), spots = [];
  const kinds = ['car', 'wood', 'rubble', 'crate', 'wood', 'rubble', 'car', 'crate'];
  for (const side of [-1, 1]) {
    let x = side < 0 ? 44 : 96;
    for (let i = 0; i < 9; i++) {
      const k = kinds[Math.floor(rng() * kinds.length)];
      spots.push({ i: spots.length, k, x: (x + 0.5) * T, searched: false, var: Math.floor(rng() * 3) });
      x += side * (3.6 + rng() * 1.6);
    }
  }
  return { tiles, thp, spots };
}

/* ---------- body vs tiles (feet-anchored AABB: x = centre, y = feet) ---------- */
function moveBody(b, dt, who) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.vx), Math.abs(b.vy)) * dt / (T * 0.35)));
  const sdt = dt / steps;
  b.blockX = 0; b.blockTile = -1; b.ground = false; b.hitHead = false;
  for (let s = 0; s < steps; s++) {
    // horizontal
    if (b.vx !== 0) {
      let nx = b.x + b.vx * sdt;
      const edge = b.vx > 0 ? nx + b.w / 2 : nx - b.w / 2, tx = Math.floor(edge / T);
      const ty0 = Math.floor((b.y - b.h + 1) / T), ty1 = Math.floor((b.y - 1) / T);
      for (let ty = ty1; ty >= ty0; ty--) {
        if (solidFor(tileAt(tx, ty), who)) {
          nx = b.vx > 0 ? tx * T - b.w / 2 - 0.01 : (tx + 1) * T + b.w / 2 + 0.01;
          b.blockX = sgn(b.vx); if (b.blockTile < 0 || ty > b.blockTileY) { b.blockTile = ix(tx, ty); b.blockTileY = ty; }
        }
      }
      if (b.blockX) b.vxBlocked = true;
      b.x = nx;
    }
    // vertical
    let ny = b.y + b.vy * sdt;
    const tx0 = Math.floor((b.x - b.w / 2 + 1) / T), tx1 = Math.floor((b.x + b.w / 2 - 1) / T);
    if (b.vy >= 0) {
      const rA = Math.floor((b.y - 0.5) / T), rB = Math.floor(ny / T);
      outer: for (let r = Math.max(rA, 0); r <= rB; r++) {
        const top = r * T; if (top < b.y - 0.5 || top > ny) continue;
        for (let tx = tx0; tx <= tx1; tx++) {
          const t = tileAt(tx, r);
          if (solidFor(t, who) || (!b.drop && !b.climbing && isPlat(tx, r))) { ny = top; b.vy = 0; b.ground = true; break outer; }
        }
      }
    } else {
      const hA = Math.floor((b.y - b.h + 0.5) / T), hB = Math.floor((ny - b.h) / T);
      outer2: for (let r = hA - 1; r >= hB; r--) {
        for (let tx = tx0; tx <= tx1; tx++) if (solidFor(tileAt(tx, r), who)) { ny = (r + 1) * T + b.h + 0.01; b.vy = 0; b.hitHead = true; b.headTile = ix(tx, r); break outer2; }
      }
    }
    b.y = ny;
  }
  if (b.x < b.w / 2) { b.x = b.w / 2; b.vx = 0; }
  if (b.x > MW * T - b.w / 2) { b.x = MW * T - b.w / 2; b.vx = 0; }
}
// does a box overlap any tile solid for `who`?
function boxSolid(x, y, w, h, who) {
  const tx0 = Math.floor((x - w / 2 + 1) / T), tx1 = Math.floor((x + w / 2 - 1) / T), ty0 = Math.floor((y - h + 1) / T), ty1 = Math.floor((y - 1) / T);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (solidFor(tileAt(tx, ty), who)) return true;
  return false;
}
function ladderAt(b) { // ladder column overlapping the body centre
  const tx = Math.floor(b.x / T), ty0 = Math.floor((b.y - b.h + 2) / T), ty1 = Math.floor((b.y + 1) / T);
  for (let ty = ty0; ty <= ty1; ty++) if (TF[tileAt(tx, ty)].lad) return tx;
  return -1;
}

/* ---------- bullet raycast (grid DDA) -> distance to first bullet-stopping tile ---------- */
function rayTiles(x0, y0, dx, dy, maxD) {
  let tx = Math.floor(x0 / T), ty = Math.floor(y0 / T);
  if (solidFor(tileAt(tx, ty), 'b')) return { d: 0, i: ix(tx, ty) };
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(T / dx) : 1e9, tdy = dy !== 0 ? Math.abs(T / dy) : 1e9;
  let tmx = dx !== 0 ? ((dx > 0 ? (tx + 1) * T - x0 : x0 - tx * T) / Math.abs(dx)) : 1e9;
  let tmy = dy !== 0 ? ((dy > 0 ? (ty + 1) * T - y0 : y0 - ty * T) / Math.abs(dy)) : 1e9;
  let d = 0;
  while (d < maxD) {
    if (tmx < tmy) { d = tmx; tmx += tdx; tx += sx; } else { d = tmy; tmy += tdy; ty += sy; }
    if (d > maxD) break;
    if (ty < -4 || tx < 0 || tx >= MW) return { d: maxD, i: -1 };
    if (solidFor(tileAt(tx, ty), 'b')) return { d, i: tx >= 0 && tx < MW && ty >= 0 && ty < MH ? ix(tx, ty) : -1 };
  }
  return { d: maxD, i: -1 };
}
// segment vs AABB (top-left x0,y0 size w,h) -> entry distance or -1
function rayBox(x0, y0, dx, dy, bx, by, bw, bh, maxD) {
  let tmin = 0, tmax = maxD;
  for (const [o, d, lo, hi] of [[x0, dx, bx, bx + bw], [y0, dy, by, by + bh]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return -1; continue; }
    let t1 = (lo - o) / d, t2 = (hi - o) / d; if (t1 > t2) { const q = t1; t1 = t2; t2 = q; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return -1;
  }
  return tmin;
}

/* ---------- structural support ----------
   A structural block resting on ground has support = its cap. Support passes straight up (capped by the upper
   block's own cap) and sideways losing 1 per tile. Blocks with 0 support collapse. Dependents (wire, lamp) need a
   supported block or ground right below. */
function recomputeStab() {
  const { tiles } = W, stab = W.stab; stab.fill(0);
  const Q = Array.from({ length: 14 }, () => []);
  for (let ty = 0; ty < GR; ty++) for (let tx = 0; tx < MW; tx++) {
    const t = tiles[ix(tx, ty)]; if (!t || !TF[t].st) continue;
    if (tileAt(tx, ty + 1) === DIRT) { stab[ix(tx, ty)] = TF[t].cap; Q[TF[t].cap].push(ix(tx, ty)); }
  }
  for (let s = 13; s >= 1; s--) {
    const q = Q[s];
    while (q.length) {
      const u = q.pop(); if (stab[u] !== s) continue;
      const ux = u % MW, uy = (u / MW) | 0;
      const nb = [[ux, uy - 1, 0], [ux - 1, uy, 1], [ux + 1, uy, 1]];
      for (const [nx, ny, side] of nb) {
        if (nx < 0 || nx >= MW || ny < 0) continue;
        const v = ix(nx, ny), t = tiles[v]; if (!t || !TF[t].st) continue;
        const val = Math.min(TF[t].cap, s - side);
        if (val > stab[v]) { stab[v] = val; Q[val].push(v); }
      }
    }
  }
}
function unsupported() {
  const out = [];
  for (let ty = 0; ty < GR; ty++) for (let tx = 0; tx < MW; tx++) {
    const i = ix(tx, ty), t = W.tiles[i]; if (!t || t === DIRT) continue;
    if (TF[t].st) { if (W.stab[i] <= 0) out.push(i); }
    else if (TF[t].dep) { const b = tileAt(tx, ty + 1); if (!(b === DIRT || (b && TF[b].st && W.stab[ix(tx, ty + 1)] > 0))) out.push(i); }
  }
  return out;
}
// support a new block would get at (tx,ty) given current stab
function supportIf(tx, ty, id) {
  const B = TF[id];
  if (B.dep) { const b = tileAt(tx, ty + 1); return (b === DIRT || (b && TF[b].st && W.stab[ix(tx, ty + 1)] > 0)) ? 1 : 0; }
  let s = 0; const below = tileAt(tx, ty + 1);
  if (below === DIRT) s = B.cap; else if (below && TF[below].st) s = Math.min(B.cap, W.stab[ix(tx, ty + 1)]);
  for (const dx of [-1, 1]) { const n = tileAt(tx + dx, ty); if (n && n !== DIRT && TF[n].st) s = Math.max(s, Math.min(B.cap, W.stab[ix(tx + dx, ty)] - 1)); }
  return s;
}
const reserved = (tx, ty) => (ty >= GR - 2 && ty < GR && tx >= RADIO.c0 && tx <= RADIO.c1) || (ty === GR - 1 && tx >= BENCH.c0 && tx <= BENCH.c1);
// can block `id` be placed at (tx,ty)? returns '' or a reason
function canPlace(tx, ty, id) {
  if (!inZone(tx)) return '只能在建造区内建造';
  if (ty < 2 || ty >= GR) return '这里不能建造';
  if (tileAt(tx, ty) !== 0) return '这里已经有东西了';
  if (reserved(tx, ty)) return '电台和工作台的位置要留空';
  const B = TF[id];
  if (B.P || B.Z) {
    const x0 = tx * T, y0 = ty * T;
    const hit = b => b.x + b.w / 2 > x0 + 1 && b.x - b.w / 2 < x0 + T - 1 && b.y > y0 + 1 && b.y - b.h < y0 + T - 1;
    for (const p of W.p) if (!p.gone && !p.dead && (B.P || p.down) && hit(p)) return '有人站在这里';
    if (B.Z) for (const z of W.zs) if (hit(z)) return '有丧尸挡着';
  }
  if (supportIf(tx, ty, id) <= 0) return '没有支撑，会塌';
  return '';
}
const affordable = (res, cost) => Object.keys(cost).every(k => (res[k] || 0) >= cost[k]);
