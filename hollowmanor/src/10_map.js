/* ================= floor layout, grid, collision, line of sight, pathfinding =================
   World: x → east, z → south, y up. 1 unit = 1 m. Grid cell = 0.5 m.
   Furniture "front" faces +z at r = 0; r rotates around y (r = π/2 → faces east). */
const PI = Math.PI, HP = PI / 2;
const MAP = {
  W: 34, H: 26, CS: 0.5, GW: 68, GH: 52, WALL_H: 3.0, WT: 0.2,
  rooms: [], cell: null, vE: null, hE: null, vD: null, hD: null,
  segs: [], doors: [], windows: [], furn: [], boxes: [], inter: [], lights: [], slots: {}, hides: [], mirrors: [], wallDecor: [],
};
const FLOORS = [];
/* furniture definitions: footprint w (x) × d (z) at r = 0, height h; col = solid; tall = blocks view (cutaway) */
const FDEF = {
  bookshelf: { w: 1.5, d: 0.42, h: 2.3, col: 1 }, bookshelfS: { w: 1.1, d: 0.42, h: 2.0, col: 1 },
  wardrobe: { w: 1.2, d: 0.62, h: 2.15, col: 1 }, smallWardrobe: { w: 1.0, d: 0.55, h: 1.8, col: 1 },
  sofa: { w: 2.2, d: 0.9, h: 0.95, col: 1 }, armchair: { w: 0.9, d: 0.85, h: 1.05, col: 1 },
  coffeeTable: { w: 1.2, d: 0.6, h: 0.45, col: 1 }, sideTable: { w: 0.5, d: 0.5, h: 0.65, col: 1 }, roundTable: { w: 0.9, d: 0.9, h: 0.75, col: 1 },
  fireplace: { w: 2.0, d: 0.6, h: 1.35, col: 1 }, grandPiano: { w: 1.5, d: 2.0, h: 1.0, col: 1 }, pianoBench: { w: 0.8, d: 0.38, h: 0.5, col: 1 },
  gramophone: { w: 0.55, d: 0.55, h: 1.25, col: 1 }, musicStand: { w: 0.5, d: 0.4, h: 1.3, col: 0 }, cello: { w: 0.5, d: 0.4, h: 1.3, col: 1 },
  desk: { w: 1.8, d: 0.9, h: 0.8, col: 1 }, chair: { w: 0.5, d: 0.5, h: 1.0, col: 1 }, globe: { w: 0.6, d: 0.6, h: 1.1, col: 1 },
  bed: { w: 0.95, d: 1.9, h: 0.9, col: 1 }, crib: { w: 0.7, d: 1.2, h: 1.0, col: 1 }, rockingHorse: { w: 0.4, d: 1.0, h: 0.8, col: 1 },
  toyChest: { w: 0.9, d: 0.5, h: 0.55, col: 1 }, blocks: { w: 0.8, d: 0.8, h: 0.2, col: 0 },
  diningTable: { w: 5.2, d: 1.4, h: 0.78, col: 1 }, chinaCabinet: { w: 1.6, d: 0.5, h: 2.2, col: 1 }, sideboard: { w: 2.2, d: 0.55, h: 0.95, col: 1 },
  counter: { w: 1.5, d: 0.65, h: 0.92, col: 1 }, sink: { w: 1.5, d: 0.65, h: 0.92, col: 1 }, stove: { w: 1.3, d: 0.75, h: 1.0, col: 1 },
  icebox: { w: 0.8, d: 0.7, h: 1.7, col: 1 }, jarShelf: { w: 1.6, d: 0.35, h: 2.0, col: 1 }, kitchenTable: { w: 1.6, d: 1.0, h: 0.78, col: 1 },
  stool: { w: 0.4, d: 0.4, h: 0.6, col: 1 }, barrel: { w: 0.6, d: 0.6, h: 0.95, col: 1 }, crate: { w: 0.7, d: 0.7, h: 0.6, col: 1 },
  boiler: { w: 1.1, d: 1.1, h: 2.2, col: 1 }, workbench: { w: 1.6, d: 0.7, h: 0.9, col: 1 }, metalShelf: { w: 1.4, d: 0.45, h: 2.0, col: 1 }, bucket: { w: 0.4, d: 0.4, h: 0.5, col: 0 },
  altar: { w: 2.2, d: 0.9, h: 1.05, col: 1 }, pew: { w: 2.6, d: 0.6, h: 1.0, col: 1 }, candleStand: { w: 0.4, d: 0.4, h: 1.5, col: 1 }, statue: { w: 0.7, d: 0.7, h: 2.1, col: 1 },
  grandClock: { w: 0.6, d: 0.45, h: 2.3, col: 1 }, centerTable: { w: 1.4, d: 1.4, h: 0.78, col: 1 }, coatRack: { w: 0.5, d: 0.5, h: 1.8, col: 1 },
  bench: { w: 1.4, d: 0.45, h: 0.5, col: 1 }, consoleTable: { w: 1.4, d: 0.42, h: 0.85, col: 1 }, fern: { w: 0.6, d: 0.6, h: 1.2, col: 1 },
  potTree: { w: 0.9, d: 0.9, h: 2.4, col: 1 }, potPlant: { w: 0.5, d: 0.5, h: 0.9, col: 1 }, planterBench: { w: 3.2, d: 0.8, h: 0.9, col: 1 },
  wickerChair: { w: 0.8, d: 0.8, h: 1.1, col: 1 }, pedestal: { w: 0.45, d: 0.45, h: 1.6, col: 1 }, chevalMirror: { w: 0.8, d: 0.45, h: 1.9, col: 1 },
  rug: { w: 1, d: 1, h: 0.01, col: 0 }, stairs: { w: 2.6, d: 8, h: 3, col: 1 }, umbrella: { w: 0.35, d: 0.35, h: 0.8, col: 1 }, wateringCan: { w: 0.4, d: 0.3, h: 0.3, col: 0 },
};
/* ---------- build ---------- */
const cellIdx = (i, j) => i + j * MAP.GW;
function roomAtCell(i, j) { return i < 0 || j < 0 || i >= MAP.GW || j >= MAP.GH ? -1 : MAP.cell[cellIdx(i, j)]; }
function roomAt(x, z) { return roomAtCell(Math.floor(x / MAP.CS), Math.floor(z / MAP.CS)); }
const vIdx = (i, j) => i + j * (MAP.GW + 1);   // vertical edge at x = i*CS, row j
const hIdx = (i, j) => i + j * MAP.GW;         // horizontal edge at z = j*CS, column i
function buildMap(fi = 0) {
  const F = FLOORS[fi]; MAP.fi = fi; MAP.F = F; MAP.WALL_H = F.wallH || 3;
  const { GW, GH, CS } = MAP;
  MAP.rooms = F.rooms.map((r, i) => Object.assign({ idx: i, cx: (r.r[0] + r.r[2]) / 2, cz: (r.r[1] + r.r[3]) / 2 }, r));
  MAP.cell = new Int8Array(GW * GH).fill(-1);
  for (const r of MAP.rooms) for (let j = r.r[1] / CS; j < r.r[3] / CS; j++) for (let i = r.r[0] / CS; i < r.r[2] / CS; i++) MAP.cell[cellIdx(i, j)] = r.idx;
  MAP.vE = new Uint8Array((GW + 1) * GH); MAP.hE = new Uint8Array(GW * (GH + 1)); MAP.vD = new Int16Array((GW + 1) * GH).fill(-1); MAP.hD = new Int16Array(GW * (GH + 1)).fill(-1);
  for (let j = 0; j < GH; j++) for (let i = 0; i <= GW; i++) if (roomAtCell(i - 1, j) !== roomAtCell(i, j)) MAP.vE[vIdx(i, j)] = 1;
  for (let j = 0; j <= GH; j++) for (let i = 0; i < GW; i++) if (roomAtCell(i, j - 1) !== roomAtCell(i, j)) MAP.hE[hIdx(i, j)] = 1;
  // doors
  MAP.doors = F.doors.map((d, id) => {
    const o = Object.assign({ idx: id, open: d.kind === 'arch' ? 1 : 0, tgt: d.kind === 'arch' ? 1 : 0, locked: !!d.locked, w: d.b - d.a }, d);
    const at = Math.round(d.at / CS);
    for (let k = Math.round(d.a / CS); k < Math.round(d.b / CS); k++) {
      if (d.dir === 'h') { MAP.hE[hIdx(k, at)] = 3; MAP.hD[hIdx(k, at)] = id; } else { MAP.vE[vIdx(at, k)] = 3; MAP.vD[vIdx(at, k)] = id; }
    }
    if (d.dir === 'h') { o.cx = (d.a + d.b) / 2; o.cz = d.at; } else { o.cx = d.at; o.cz = (d.a + d.b) / 2; }
    // rooms on both sides
    o.rA = d.dir === 'h' ? roomAt(o.cx, o.cz - 0.25) : roomAt(o.cx - 0.25, o.cz);
    o.rB = d.dir === 'h' ? roomAt(o.cx, o.cz + 0.25) : roomAt(o.cx + 0.25, o.cz);
    return o;
  });
  // windows
  MAP.windows = F.windows.map(([dir, at, a, b, kind]) => {
    const L = Math.round(at / CS);
    for (let k = Math.round(a / CS); k < Math.round(b / CS); k++) { if (dir === 'h') MAP.hE[hIdx(k, L)] = 2; else MAP.vE[vIdx(L, k)] = 2; }
    return { dir, at, a, b, kind: kind || 'normal', room: dir === 'h' ? roomAt((a + b) / 2, at === 0 ? 0.25 : at - 0.25) : roomAt(at === 0 ? 0.25 : at - 0.25, (a + b) / 2) };
  });
  // merged wall segments (code 1 only; windows and doors are rendered separately)
  MAP.segs = [];
  for (let j = 0; j <= GH; j++) { let s = -1; for (let i = 0; i <= GW; i++) { const c = i < GW ? MAP.hE[hIdx(i, j)] : 0; if (c === 1 && s < 0) s = i; if (c !== 1 && s >= 0) { MAP.segs.push({ dir: 'h', at: j * CS, a: s * CS, b: i * CS, ext: j === 0 || j === GH }); s = -1; } } }
  for (let i = 0; i <= GW; i++) { let s = -1; for (let j = 0; j <= GH; j++) { const c = j < GH ? MAP.vE[vIdx(i, j)] : 0; if (c === 1 && s < 0) s = j; if (c !== 1 && s >= 0) { MAP.segs.push({ dir: 'v', at: i * CS, a: s * CS, b: j * CS, ext: i === 0 || i === GW }); s = -1; } } }
  // collision boxes: walls + windows
  MAP.boxes = []; const T = MAP.WT / 2;
  const addSegBox = (dir, at, a, b, tag) => MAP.boxes.push(dir === 'h' ? { x0: a - (a === 0 ? T : 0), x1: b + (b === MAP.W ? T : 0), z0: at - T, z1: at + T, tag } : { x0: at - T, x1: at + T, z0: a, z1: b, tag });
  for (const s of MAP.segs) addSegBox(s.dir, s.at, s.a, s.b, 'wall');
  for (const w of MAP.windows) addSegBox(w.dir, w.at, w.a, w.b, 'win');
  // furniture
  MAP.furn = []; MAP.hides = []; MAP.mirrors = []; MAP.inter = [];
  F.furn.forEach(([k, x, z, r, o], i) => {
    const def = FDEF[k]; if (!def) throw new Error('furn ' + k);
    const opts = Object.assign({}, o || {}); let w = opts.w || def.w, d = opts.d || def.d;
    const c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
    const shrink = (c > 0.02 && s > 0.02) ? 0.82 : 1;
    const hw = (w * c + d * s) / 2 * shrink, hd = (w * s + d * c) / 2 * shrink;
    const f = { id: i, k, x, z, r, o: opts, room: roomAt(x, z), w, d, h: def.h, hw, hd };
    MAP.furn.push(f);
    if (def.col && !opts.nocol) MAP.boxes.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, tag: k, f: i });
    if (opts.hide) { const hid = MAP.hides.length; MAP.hides.push({ id: hid, f: i, x, z, r, fx: x + Math.sin(r) * (d / 2 + 0.45), fz: z + Math.cos(r) * (d / 2 + 0.45) }); }
    if (opts.mirror) { const mz = opts.mz || 0; MAP.mirrors.push({ x: x + Math.sin(r) * mz, z: z + Math.cos(r) * mz, r, y: opts.my || 1.15, room: f.room, kind: k, mw: opts.mw || 0.62, mh: opts.mh || 1.4 }); }
  });
  MAP.wallDecor = F.wall.map(([k, x, z, r, y, o]) => ({ k, x, z, r, y, o: o || {}, room: roomAt(x + Math.sin(r) * 0.3, z + Math.cos(r) * 0.3) }));
  for (const w of MAP.wallDecor) if (w.o.mirror) MAP.mirrors.push({ x: w.x, z: w.z, r: w.r, y: w.y, room: w.room, kind: w.k, mw: w.k === 'mantelMirror' ? 1.1 : 0.8, mh: w.k === 'mantelMirror' ? 0.8 : 1.1 });
  MAP.lights = F.lights.map(([k, x, z, y, r, p], i) => ({ i, k, x, z, y, r, room: roomAt(x, z), powered: p !== 0, always: p === 0 }));
  MAP.lamps = MAP.lights.filter(l => l.k === 'oilLamp');
  MAP.slots = F.slots;
  MAP.clock = MAP.furn.find(f => f.k === 'grandClock') || null;
  MAP.crib = MAP.furn.find(f => f.k === 'crib') || null;
  MAP.paint = F.paint;
  // spatial hash of boxes (2 m buckets)
  MAP.bk = new Map();
  MAP.boxes.forEach((b, bi) => { for (let gx = Math.floor(b.x0 / 2); gx <= Math.floor(b.x1 / 2); gx++) for (let gz = Math.floor(b.z0 / 2); gz <= Math.floor(b.z1 / 2); gz++) { const key = gx * 1000 + gz; if (!MAP.bk.has(key)) MAP.bk.set(key, []); MAP.bk.get(key).push(bi); } });
  buildInteractables();
}
/* door blocker box (closed / locked doors) */
function doorBox(d) { const T = 0.12; return d.dir === 'h' ? { x0: d.a, x1: d.b, z0: d.at - T, z1: d.at + T } : { x0: d.at - T, x1: d.at + T, z0: d.a, z1: d.b }; }
/* a 'crack' is a spirit passage: a wall to everyone except the seer */
const doorSolid = (W, d, role) => d.kind === 'crack' ? role !== 'S' : d.kind !== 'arch' && (W.doors[d.idx].open < 0.55);

/* ---------- collision: circle vs boxes ---------- */
function pushOut(x, z, r, b) {
  const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1); let dx = x - cx, dz = z - cz; const dd = dx * dx + dz * dz;
  if (dd >= r * r) return null;
  if (dd > 1e-9) { const L = Math.sqrt(dd), k = (r - L) / L; return [dx * k, dz * k]; }
  // center inside box: push along smallest axis
  const l = x - b.x0 + r, rt = b.x1 - x + r, t = z - b.z0 + r, bt = b.z1 - z + r, m = Math.min(l, rt, t, bt);
  return m === l ? [-l, 0] : m === rt ? [rt, 0] : m === t ? [0, -t] : [0, bt];
}
/* moves (x,z) by (dx,dz) with collision; W = world state (doors). onDoor(d) called when bumping a closed unlocked door */
function moveCircle(x, z, dx, dz, r, W, onDoor, role) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.12));
  for (let s = 0; s < steps; s++) {
    x += dx / steps; z += dz / steps;
    for (let it = 0; it < 3; it++) {
      let moved = false;
      const near = new Set();
      for (let gx = Math.floor((x - r) / 2); gx <= Math.floor((x + r) / 2); gx++) for (let gz = Math.floor((z - r) / 2); gz <= Math.floor((z + r) / 2); gz++) { const l = MAP.bk.get(gx * 1000 + gz); if (l) for (const bi of l) near.add(bi); }
      for (const bi of near) { const p = pushOut(x, z, r, MAP.boxes[bi]); if (p) { x += p[0]; z += p[1]; moved = true; } }
      for (const d of MAP.doors) {
        if (!doorSolid(W, d, role)) continue;
        if (Math.abs(x - d.cx) > d.w / 2 + 1 || Math.abs(z - d.cz) > d.w / 2 + 1) continue;
        const p = pushOut(x, z, r, doorBox(d)); if (p) { x += p[0]; z += p[1]; moved = true; if (onDoor && d.kind !== 'crack') onDoor(d); }
      }
      if (!moved) break;
    }
  }
  return [clamp(x, 0.2, MAP.W - 0.2), clamp(z, 0.2, MAP.H - 0.2)];
}

/* ---------- line of sight across grid edges ---------- */
function edgeBlock(code, did, W, ghost) {
  if (code === 0) return false;
  if (code === 3) { const d = MAP.doors[did]; if (ghost) return false; if (d.kind === 'crack') return true; return doorSolid(W, d); }
  return true;
}
function crossV(i, j, W, g) { return edgeBlock(MAP.vE[vIdx(i, j)], MAP.vD[vIdx(i, j)], W, g); }
function crossH(i, j, W, g) { return edgeBlock(MAP.hE[hIdx(i, j)], MAP.hD[hIdx(i, j)], W, g); }
function los(x0, z0, x1, z1, W, ghost) {
  const CS = MAP.CS, L = dist(x0, z0, x1, z1), n = Math.max(1, Math.ceil(L / 0.1));
  let ci = Math.floor(x0 / CS), cj = Math.floor(z0 / CS);
  for (let s = 1; s <= n; s++) {
    const x = x0 + (x1 - x0) * s / n, z = z0 + (z1 - z0) * s / n, ni = Math.floor(x / CS), nj = Math.floor(z / CS);
    if (ni !== ci) { if (crossV(Math.max(ci, ni), cj, W, ghost)) return false; ci = ni; }
    if (nj !== cj) { if (crossH(ci, Math.max(cj, nj), W, ghost)) return false; cj = nj; }
  }
  return true;
}
/* ---------- A* on the cell grid (ghost: passes doors, not walls) ---------- */
function pathFind(x0, z0, x1, z1) {
  const { GW, GH, CS } = MAP, s = cellIdx(clamp(Math.floor(x0 / CS), 0, GW - 1), clamp(Math.floor(z0 / CS), 0, GH - 1)), t = cellIdx(clamp(Math.floor(x1 / CS), 0, GW - 1), clamp(Math.floor(z1 / CS), 0, GH - 1));
  if (s === t) return [[x1, z1]];
  const g = new Float32Array(GW * GH).fill(1e9), from = new Int32Array(GW * GH).fill(-1), open = [s], inO = new Uint8Array(GW * GH), done = new Uint8Array(GW * GH);
  const tx = t % GW, tz = (t / GW) | 0, h = c => Math.abs(c % GW - tx) + Math.abs(((c / GW) | 0) - tz);
  g[s] = 0; inO[s] = 1; const f = new Float32Array(GW * GH).fill(1e9); f[s] = h(s);
  let it = 0;
  while (open.length && it++ < 6000) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
    const c = open[bi]; open[bi] = open[open.length - 1]; open.pop(); inO[c] = 0;
    if (c === t) break; done[c] = 1;
    const i = c % GW, j = (c / GW) | 0;
    const nb = [];
    if (i > 0 && MAP.vE[vIdx(i, j)] % 3 === 0 && MAP.cell[c - 1] >= 0) nb.push(c - 1);
    if (i < GW - 1 && MAP.vE[vIdx(i + 1, j)] % 3 === 0 && MAP.cell[c + 1] >= 0) nb.push(c + 1);
    if (j > 0 && MAP.hE[hIdx(i, j)] % 3 === 0 && MAP.cell[c - GW] >= 0) nb.push(c - GW);
    if (j < GH - 1 && MAP.hE[hIdx(i, j + 1)] % 3 === 0 && MAP.cell[c + GW] >= 0) nb.push(c + GW);
    for (const n of nb) { if (done[n]) continue; const ng = g[c] + 1; if (ng < g[n]) { g[n] = ng; from[n] = c; f[n] = ng + h(n); if (!inO[n]) { inO[n] = 1; open.push(n); } } }
  }
  if (from[t] < 0) return null;
  const cells = []; for (let c = t; c !== s && c >= 0; c = from[c]) cells.push(c); cells.reverse();
  const pts = cells.map(c => [(c % GW + 0.5) * CS, (((c / GW) | 0) + 0.5) * CS]); pts[pts.length - 1] = [x1, z1];
  // string pulling (ghost LOS)
  const out = []; let ax = x0, az = z0, k = 0;
  while (k < pts.length) { let far = k; for (let m = Math.min(pts.length - 1, k + 14); m > k; m--) if (los(ax, az, pts[m][0], pts[m][1], null, true)) { far = m; break; } out.push(pts[far]); ax = pts[far][0]; az = pts[far][1]; k = far + 1; }
  return out;
}
/* random free floor point inside a room (not inside furniture) */
function randomFloorIn(room, margin = 0.6, tries = 40) {
  const r = MAP.rooms[room].r;
  for (let t = 0; t < tries; t++) {
    const x = rr(r[0] + margin, r[2] - margin), z = rr(r[1] + margin, r[3] - margin);
    if (MAP.boxes.some(b => x > b.x0 - 0.3 && x < b.x1 + 0.3 && z > b.z0 - 0.3 && z < b.z1 + 0.3)) continue;
    return [x, z];
  }
  return [MAP.rooms[room].cx, MAP.rooms[room].cz];
}
/* random point on an interior wall face of a room (for handprints / rune writing): returns {x,z,r,y} */
function randomWallSpot(room, avoid = []) {
  const R = MAP.rooms[room].r, sides = shuffle([0, 1, 2, 3]);
  for (let t = 0; t < 40; t++) {
    const side = sides[t % 4], o = 0.11;
    let x, z, r;
    if (side === 0) { x = rr(R[0] + 0.8, R[2] - 0.8); z = R[1] + o; r = 0; }
    else if (side === 1) { x = rr(R[0] + 0.8, R[2] - 0.8); z = R[3] - o; r = PI; }
    else if (side === 2) { x = R[0] + o; z = rr(R[1] + 0.8, R[3] - 0.8); r = HP; }
    else { x = R[2] - o; z = rr(R[1] + 0.8, R[3] - 0.8); r = -HP; }
    // must be a solid wall there (not a door/window), and not hidden behind tall furniture
    const CS = MAP.CS;
    const code = side < 2 ? MAP.hE[hIdx(Math.floor(x / CS), Math.round((side === 0 ? R[1] : R[3]) / CS))] : MAP.vE[vIdx(Math.round((side === 2 ? R[0] : R[2]) / CS), Math.floor(z / CS))];
    if (code !== 1) continue;
    const nx = x + Math.sin(r) * 0.5, nz = z + Math.cos(r) * 0.5;
    if (MAP.boxes.some(b => b.tag !== 'wall' && b.tag !== 'win' && nx > b.x0 - 0.5 && nx < b.x1 + 0.5 && nz > b.z0 - 0.5 && nz < b.z1 + 0.5)) continue;
    if (avoid.some(a => dist(a.x, a.z, x, z) < 1.4)) continue;
    // also keep away from wall decorations / paintings
    if (MAP.paint.some(p => dist(p[0], p[1], x, z) < 1.0) || MAP.wallDecor.some(w => dist(w.x, w.z, x, z) < 1.0) || MAP.lights.some(l => l.k === 'sconce' && dist(l.x, l.z, x, z) < 0.8)) continue;
    return { x, z, r, y: rr(0.9, 1.55) };
  }
  return null;
}

/* ---------- interactables ----------
   static ones come from wall decor / furniture flags and the floor's own `inter` list; items, anchors and revive are added at runtime */
function buildInteractables() {
  const I = MAP.inter = [];
  const add = o => { o.id = I.length; I.push(o); return o; };
  for (const h of MAP.hides) add({ k: 'hide', hid: h.id, x: h.fx, z: h.fz, role: '*' });
  MAP.wallDecor.forEach(w => {
    const fx = w.x + Math.sin(w.r) * 0.55, fz = w.z + Math.cos(w.r) * 0.55;
    if (w.k === 'lever') add({ k: 'lever', lv: w.o.lever, x: fx, z: fz, role: '*' });
    if (w.k === 'fuseBox') add({ k: 'fuse', x: fx, z: fz, role: 'L' });
    if (w.k === 'runePanel') add({ k: 'rune', x: fx, z: fz, role: 'L' });
    if (w.k === 'valve') add({ k: 'valve', x: fx, z: fz, role: 'L' });
    if (w.k === 'bolt') add({ k: 'bolt', door: MAP.doors.findIndex(d => d.id === w.o.door), x: fx, z: fz, role: '*' });
  });
  MAP.furn.forEach(f => { if (f.o.bell != null) add({ k: 'bell', bi: f.o.bell, x: f.x + Math.sin(f.r) * 0.7, z: f.z + Math.cos(f.r) * 0.7, role: 'L' }); });
  MAP.lamps.forEach((l, li) => add({ k: 'lamp', li, x: l.x + Math.sin(l.r || 0) * 0.5, z: l.z + Math.cos(l.r || 0) * 0.5, role: 'L' }));
  for (const it of MAP.F.inter || []) { const o = Object.assign({}, it); if (o.door && typeof o.door === 'string') o.door = MAP.doors.findIndex(d => d.id === it.door); add(o); }
  for (const d of MAP.doors) if (d.locked && d.kind !== 'shelf' && d.kind !== 'front' && d.kind !== 'crack') add({ k: 'locked', door: d.idx, x: d.cx, z: d.cz + (d.dir === 'h' ? 0.55 : 0), x2: d.cx, z2: d.cz - (d.dir === 'h' ? 0.55 : 0), role: '*' });
  // locked doors are interactable from both sides
  for (const it of [...I]) if (it.k === 'locked') { const d = MAP.doors[it.door]; if (d.dir === 'v') { it.x = d.cx + 0.55; it.z = d.cz; it.x2 = d.cx - 0.55; it.z2 = d.cz; } }
}
