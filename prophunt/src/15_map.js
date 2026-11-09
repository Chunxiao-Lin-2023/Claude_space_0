/* ================= scene engine: rooms, doors, auto-built walls, random furnishing =================
   A scene = rectangular rooms on an integer grid + door gaps. Walls are generated on every room boundary
   (style per scene / per room), door gaps are cut out, then split into 1 m pieces for sorting. */
const SCENES = {};               // filled by 16_scenes.js
let SCENE = null, ROOMS = [], DOORS = [], HOUSE = { w: 24, h: 22 }, WALLS = [], DOORZ = [], KEEP = [], SPAWN_SEEK = [0, 0], SPAWN_HIDE = [0, 0], GEN = {};
const WALL_T = 0.16;
const WSTYLE = {   // thickness, low height, tall height (north/west outer edge)
  wall: [.16, .5, 2.4], log: [.2, .55, 2.2], fence: [.12, .7, .7], hedge: [.5, .75, 2.2], rock: [.55, .7, 2.0],
  reef: [.55, .65, 1.6], hull: [.22, .6, 1.8], ruin: [.3, .55, 1.4], steel: [.16, .5, 2.4]
};
const WPRIO = ['wall', 'steel', 'log', 'hull', 'ruin', 'fence', 'hedge', 'rock', 'reef'];
function useScene(id) {
  SCENE = SCENES[id] || SCENES.house;
  ROOMS = SCENE.rooms; ROOMS.forEach((r, i) => r.i = i);
  DOORS = SCENE.doors; HOUSE = { w: SCENE.w, h: SCENE.h };
  WALLS = SCENE._walls || (SCENE._walls = buildWalls(SCENE));
  DOORZ = DOORS.map(d => { const t = 1.35 + (d.t || 0); return d.v ? [d.c - t, d.a - .1, d.c + t, d.b + .1] : [d.a - .1, d.c - t, d.b + .1, d.c + t]; });
  KEEP = SCENE.keep || []; SPAWN_SEEK = SCENE.seek; SPAWN_HIDE = SCENE.hide; GEN = SCENE.gen;
}
const ovl = (a, b, m) => { m = m || 0; return a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m; };
const inner = room => { const t = (room.inset || WALL_T) / 2; return [room.r[0] + t, room.r[1] + t, room.r[2] - t, room.r[3] - t]; };
function fpOf(k, r, x, y) { const [w, d] = footWD(k, r); return [x - w / 2, y - d / 2, x + w / 2, y + d / 2]; }
function roomAt(x, y, pad) { pad = pad || 0; for (const r of ROOMS) if (x >= r.r[0] - pad && x <= r.r[2] + pad && y >= r.r[1] - pad && y <= r.r[3] + pad) return r; return null; }
function roomsNear(x, y, pad) { const out = []; for (const r of ROOMS) if (x >= r.r[0] - pad && x <= r.r[2] + pad && y >= r.r[1] - pad && y <= r.r[3] + pad) out.push(r.i); return out; }
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((h >>> 0) % 10000) / 10000; };

function buildWalls(sc) {
  const rooms = sc.rooms, W = sc.w, H = sc.h;
  const own = (x, y) => { for (const r of rooms) if (x > r.r[0] && x < r.r[2] && y > r.r[1] && y < r.r[3]) return r; return null; };
  const styleOf = (A, B) => {
    if (!A || !B) { const r = A || B; return r.wso || sc.outer || 'wall'; }
    const a = A.ws || sc.inner || 'wall', b = B.ws || sc.inner || 'wall'; return WPRIO.indexOf(a) <= WPRIO.indexOf(b) ? a : b;
  };
  const units = [];   // [hz, c, a, style, tall]
  for (let y = 0; y <= H; y++) for (let x = 0; x < W; x++) {
    const A = own(x + .5, y - .5), B = own(x + .5, y + .5); if (A === B || (A && B && A.open && A.open === B.open)) continue;
    const st = styleOf(A, B); units.push([1, y, x, st, !A && !!B]);
  }
  for (let x = 0; x <= W; x++) for (let y = 0; y < H; y++) {
    const A = own(x - .5, y + .5), B = own(x + .5, y + .5); if (A === B || (A && B && A.open && A.open === B.open)) continue;
    const st = styleOf(A, B); units.push([0, x, y, st, !A && !!B]);
  }
  // merge contiguous unit edges into lines
  units.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
  const lines = [];
  for (const u of units) { const L = lines[lines.length - 1]; if (L && L[0] === u[0] && L[1] === u[1] && L[3] === u[2] && L[4] === u[3] && L[5] === u[4]) L[3] = u[2] + 1; else lines.push([u[0], u[1], u[2], u[2] + 1, u[3], u[4]]); }
  const out = [];
  for (const [hz, c, a, b, st, tall] of lines) {
    const [th, hl, ht] = WSTYLE[st] || WSTYLE.wall, h = tall ? ht : hl, t = th / 2;
    let spans = [[a, b]];
    for (const d of sc.doors) if ((d.v === 0) === !!hz && d.c === c) spans = spans.flatMap(([s, e]) => d.b <= s || d.a >= e ? [[s, e]] : [[s, d.a], [d.b, e]].filter(q => q[1] - q[0] > .01));
    for (const [s, e] of spans) {
      const n = Math.max(1, Math.round(e - s));
      for (let i = 0; i < n; i++) {
        let s0 = s + (e - s) * i / n, s1 = s + (e - s) * (i + 1) / n;
        if (i === 0 && s === a) s0 -= t; if (i === n - 1 && e === b) s1 += t;
        const fp = hz ? [s0, c - t, s1, c + t] : [c - t, s0, c + t, s1];
        out.push({ wall: 1, st, h, fp, tall: h > 1, pr: wallPrisms(st, fp, h, hz, sc, hash(Math.round(s0 * 7) + c * 31, hz)) });
      }
    }
  }
  return out;
}
function wallPrisms(st, fp, h, hz, sc, rv) {
  const box = (x0, y0, x1, y1, z0, z1, col) => ({ pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, c: col });
  const cyl = (cx, cy, r, z0, z1, col, n) => { const pts = []; n = n || 7; for (let i = 0; i < n; i++) { const a = (i + .5) / n * 6.2832; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return { pts, z0, z1, c: col }; };
  const [x0, y0, x1, y1] = fp, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, len = hz ? x1 - x0 : y1 - y0, th = hz ? y1 - y0 : x1 - x0;
  const C = sc.wallc || ['#efe6d6', '#9c8a72', '#c9b28e', '#e2d6c0'];
  if (st === 'fence') {
    const px = hz ? [x0, y0, x0 + .09, y1] : [x0, y0, x1, y0 + .09];
    return [box(px[0], px[1], px[2], px[3], 0, .74, '#f4efe4'), box(x0, y0 + (hz ? .015 : 0), x1, y1 - (hz ? .015 : 0), .52, .6, '#e8e1d2'), box(x0, y0 + (hz ? .015 : 0), x1, y1 - (hz ? .015 : 0), .24, .32, '#e8e1d2')];
  }
  if (st === 'hedge') {
    const g = sc.hedgec || ['#3f7a38', '#5a9a46', '#4c8a3e'], L = [box(x0, y0, x1, y1, 0, h * .78, g[0])];
    for (let k = 0; k < 2; k++) { const f = (k + .5) / 2, cx = hz ? x0 + len * f : mx, cy = hz ? my : y0 + len * f; L.push(cyl(cx, cy, th * .62 + rv * .05, h * .5, h * (.95 + rv * .1), k ? g[2] : g[1], 7)); }
    return L;
  }
  if (st === 'rock' || st === 'reef') {
    const g = st === 'rock' ? (sc.rockc || ['#8d8a84', '#a6a29a', '#77736c']) : ['#6f7f86', '#86969c', '#5c6a70'];
    const L = [box(x0, y0, x1, y1, 0, h * (.75 + rv * .2), g[0])];
    const cx = hz ? x0 + len * (.3 + rv * .4) : mx, cy = hz ? my : y0 + len * (.3 + rv * .4);
    L.push(cyl(cx, cy, th * .55, h * .3, h * (.95 + rv * .15), g[1], 6));
    if (st === 'reef') { const cc = ['#ff7a8a', '#ffb04a', '#b98cff', '#5fd0c0'][Math.floor(rv * 4)]; L.push(cyl(hz ? x0 + len * .75 : mx, hz ? my : y0 + len * .75, .1, h * .8, h + .35, cc, 5), cyl(hz ? x0 + len * .2 : mx + .05, hz ? my + .05 : y0 + len * .2, .08, h * .7, h + .22, cc, 5)); }
    return L;
  }
  if (st === 'hull') return [box(x0, y0, x1, y1, 0, h, '#7a5634'), box(x0, y0, x1, y1 + .004, h * .3, h * .36, '#5c3f24'), box(x0, y0, x1, y1 + .004, h * .65, h * .71, '#5c3f24'), box(x0 - .01, y0 - .01, x1 + .01, y1 + .01, h, h + .05, '#4a321c')];
  if (st === 'ruin') { const hh = h * (.6 + rv * .5); return [box(x0, y0, x1, y1, 0, hh, '#cfc3a6'), box(x0 - .01, y0 - .01, x1 + .01, y1 + .01, hh, hh + .06, '#b3a688')]; }
  if (st === 'log') return [box(x0, y0, x1, y1, 0, h, '#9a6a3e'), box(x0, y0, x1, y1 + .004, h * .33, h * .37, '#7a5030'), box(x0, y0, x1, y1 + .004, h * .66, h * .7, '#7a5030'), box(x0 - .005, y0 - .005, x1 + .005, y1 + .005, h, h + .04, '#5c3a22')];
  const col = st === 'steel' ? '#dfe4e8' : h > 1 ? C[3] : C[0];
  const L = [box(x0, y0, x1, y1, 0, h, col), box(x0 - .005, y0 - .005, x1 + .005, y1 + .005, h, h + .03, C[1])];
  if (h > 1) L.splice(1, 0, box(x0, y0, x1, y1 + .004, 0, .9, C[2]));
  return L;
}
/* ---------- random furnishing (deterministic from the seed; no trig here) ---------- */
function genMap(seed) {
  const R = mkRng(seed ^ 0x5bd1e995), M = { seed, items: [] };
  const X = { R, M, vv: {}, ri: (a, b) => a + Math.floor(R() * (b - a + 1)), rf: (a, b) => a + R() * (b - a), ch: a => a[Math.floor(R() * a.length)] };
  for (const room of ROOMS) { const g = GEN[room.id]; if (typeof g === 'function') g(room, X); else if (g) recipe(room, X, g); }
  M.items.forEach((it, i) => { it.id = i; it.pr = prismsFor(it.k, it.v, it.r, it.x, it.y); it.flat = !!T[it.k].flat; it.room = roomAt(it.x, it.y).i; it.wob = 0; it.mark = -1; });
  return M;
}
const snap = v => Math.round(v * 20) / 20;
const offR = (r, lx, ly) => { const [co, si] = ROT4[r & 3]; return [lx * co - ly * si, lx * si + ly * co]; };
function vOf(X, room, k) { const key = room.id + k; if (X.vv[key] == null) X.vv[key] = Math.floor(X.R() * T[k].vars.length); return X.vv[key]; }
function canPut(X, room, k, r, x, y, m) {
  const f = fpOf(k, r, x, y), ib = inner(room), e = .035, flat = !!T[k].flat;
  if (f[0] < ib[0] - e || f[1] < ib[1] - e || f[2] > ib[2] + e || f[3] > ib[3] + e) return false;
  for (const z of DOORZ) if (ovl(f, z)) return false;
  for (const z of KEEP) if (ovl(f, z)) return false;
  for (const it of X.M.items) { const fl2 = !!T[it.k].flat; if (flat !== fl2) continue; if (ovl(f, it.fp, m)) return false; }
  return true;
}
function put(X, room, k, r, x, y, v) { const it = { k, v: v == null ? vOf(X, room, k) : v, r: r & 3, x: snap(x), y: snap(y) }; it.fp = fpOf(k, it.r, it.x, it.y); X.M.items.push(it); return it; }
function tryPut(X, room, k, r, x, y, m) { x = snap(x); y = snap(y); return canPut(X, room, k, r, x, y, m == null ? .04 : m) ? put(X, room, k, r, x, y) : null; }
// side: 0=N 1=E 2=S 3=W ; the piece's back goes against that wall
function wallPut(X, room, k, o) {
  o = o || {}; const ib = inner(room), sides = o.sides || [0, 1, 2, 3], gap = o.gap || 0;
  for (let t = 0; t < (o.tries || 40); t++) {
    const s = X.ch(sides), r = s, [w, d] = footWD(k, r);
    let x, y;
    const along = (lo, hi, sz) => o.corner ? (X.R() < .5 ? lo + sz / 2 : hi - sz / 2) : X.rf(lo + sz / 2, hi - sz / 2);
    if (s === 0) { y = ib[1] + d / 2 + gap; x = along(ib[0], ib[2], w); }
    else if (s === 2) { y = ib[3] - d / 2 - gap; x = along(ib[0], ib[2], w); }
    else if (s === 1) { x = ib[2] - w / 2 - gap; y = along(ib[1], ib[3], d); }
    else { x = ib[0] + w / 2 + gap; y = along(ib[1], ib[3], d); }
    const it = tryPut(X, room, k, r, x, y, o.m == null ? .05 : o.m); if (it) return it;
  }
  return null;
}
function freePut(X, room, k, o) {
  o = o || {}; const ib = inner(room);
  for (let t = 0; t < (o.tries || 40); t++) {
    const r = o.r != null ? o.r : X.ri(0, 3); let x, y;
    if (o.near) { x = o.near[0] + X.rf(-o.near[2], o.near[2]); y = o.near[1] + X.rf(-o.near[2], o.near[2]); }
    else { x = X.rf(ib[0] + .4, ib[2] - .4); y = X.rf(ib[1] + .4, ib[3] - .4); }
    const it = tryPut(X, room, k, r, x, y, o.m == null ? .45 : o.m); if (it) return it;
  }
  return null;
}
const times = (X, a, b, f) => { const n = X.ri(a, b); for (let i = 0; i < n; i++) f(i); };
// a piece plus things arranged around it in its local frame: [k, lx, ly, dr]  (dr = rotation relative to the anchor)
function around(X, room, anchor, list, m) { for (const [k, lx, ly, dr] of list) { const [ox, oy] = offR(anchor.r, lx, ly); tryPut(X, room, k, (anchor.r + dr) & 3, anchor.x + ox, anchor.y + oy, m == null ? .02 : m); } }
function diningSet(X, room, cx, cy, chairs) {
  const r = X.ri(0, 1), t = tryPut(X, room, 'dtable', r, cx, cy, .9) || freePut(X, room, 'dtable', { r, m: .9 });
  if (!t) return;
  const L = [['chair', -.4, -.74, 0], ['chair', .4, -.74, 0], ['chair', -.4, .74, 2], ['chair', .4, .74, 2]];
  if (chairs > 4) L.push(['chair', -1.08, 0, 3]); if (chairs > 5) L.push(['chair', 1.08, 0, 1]);
  around(X, room, t, L);
}
function sofaSet(X, room) {
  const s = X.ri(0, 3), sofa = wallPut(X, room, 'sofa', { sides: [s], m: .3 }) || wallPut(X, room, 'sofa', { m: .3 }); if (!sofa) return;
  around(X, room, sofa, [['ctable', 0, 1.05, 0], ['rug', 0, 1.15, 0]], .05);
  if (X.R() < .8) around(X, room, sofa, [['armchair', -1.55, 1.1, 1]], .1);
  if (X.R() < .5) around(X, room, sofa, [['armchair', 1.55, 1.1, 3]], .1);
  wallPut(X, room, 'tv', { sides: [(sofa.r + 2) & 3], m: .2 });
}
function deskSet(X, room, ck) { const d = wallPut(X, room, 'desk', { m: .5 }); if (d) around(X, room, d, [[ck || 'ochair', -.15, .62, 2]], .02); return d; }
function bedSet(X, room, k) {
  const b = wallPut(X, room, k || 'bed', { sides: k ? [0, 1, 2, 3] : [0], m: .3 }); if (!b) return;
  const [w, d] = [T[b.k].w, T[b.k].d];
  if (!k) around(X, room, b, [['nstand', -(w / 2 + .27), -d / 2 + .2, 0], ['nstand', w / 2 + .27, -d / 2 + .2, 0]]);
  if (X.R() < .5) around(X, room, b, [['rug', 0, d / 2 + .3, 0]], .05);
}

// recipe rows: ['w'|'c'|'f', kind or [kinds], min, max, opts]  (w = against a wall, c = corner, f = free-standing)  or ['fn', fn]
function recipe(room, X, steps) {
  for (const s of steps) {
    if (s[0] === 'fn') { s[1](X, room); continue; }
    const [how, k, a, b, o] = s, ks = Array.isArray(k) ? k : [k];
    times(X, a, b, () => { const kk = X.ch(ks); if (how === 'f') freePut(X, room, kk, o); else wallPut(X, room, kk, how === 'c' ? Object.assign({ corner: 1 }, o) : o); });
  }
}
// rows of identical pieces, e.g. desks in a classroom
function grid(X, room, k, r, x0, y0, dx, dy, nx, ny, m, after) { for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const it = tryPut(X, room, k, r, x0 + i * dx, y0 + j * dy, m == null ? .02 : m); if (it && after) after(it); } }
