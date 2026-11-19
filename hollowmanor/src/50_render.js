/* ================= pixel renderer: world build (floor cache, wall pieces, props, fixtures) ================= */
const R3 = {
  world: false, cv: null, ctx: null, buf: null, bg: null, dark: null, dg: null, glow: null, gg: null,
  SC: 3, DPR: 1, VW: 320, VH: 180, cam: { x: 0, y: 0 }, camT: { x: 17, z: 20, set(x, _, z) { this.x = x; this.z = z; } },
  shake: 0, flash: 0, flash2: 0, bells: [], floorC: null, M: 6, FH: 36, drawables: [], pieces: [], lights: [], mirrors: [], props: [],
  lastCalls: 0, lastTris: 0,
};
function initRender() {
  R3.cv = document.getElementById('gl'); R3.ctx = R3.cv.getContext('2d');
  R3.buf = mk(4, 4); R3.bg = R3.buf.getContext('2d');
  R3.dark = mk(4, 4); R3.dg = R3.dark.getContext('2d');
  R3.glow = mk(4, 4); R3.gg = R3.glow.getContext('2d');
  addEventListener('resize', resizeRender); resizeRender();
}
/* integer pixel scale; the short side shows ~12 m online, a little more on one shared screen */
function resizeRender() {
  const DPR = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
  const target = (STATE && STATE.local ? 300 : 240) * (Math.min(W, H) < 500 ? 0.86 : 1);
  const SC = Math.max(1, Math.round(Math.min(W, H) * DPR / target));
  R3.DPR = DPR; R3.SC = SC;
  R3.cv.width = Math.round(W * DPR); R3.cv.height = Math.round(H * DPR);
  R3.VW = Math.ceil(R3.cv.width / SC); R3.VH = Math.ceil(R3.cv.height / SC);
  for (const c of [R3.buf, R3.dark, R3.glow]) { c.width = R3.VW; c.height = R3.VH; }
  R3.ctx.imageSmoothingEnabled = false;
}
const wallTopY = () => R3.FH;
/* ---------- the floor cache: every room's floor, rugs, stairs, the yard or roof around the house ---------- */
function buildFloorCache() {
  const M = R3.M, Wp = (MAP.W + M * 2) * PX, Hp = (MAP.H + M * 2) * PX;
  const c = R3.floorC = mk(Wp, Hp), g = c.getContext('2d'), R = RP(g);
  const outside = MAP.F.outside === 'roof' ? 'roof' : 'ground';
  for (let Y = 0; Y < MAP.H + M * 2; Y++) for (let X = 0; X < MAP.W + M * 2; X++) { const R2 = RP(g, X * PX, Y * PX); FLOORPAINT[outside](R2, X, Y); }
  if (outside === 'ground') { // a stone path to the front steps, wet lawn, hedges along the edges
    const gate = MAP.doors.find(d => d.kind === 'front'); if (gate) { const x0 = (gate.cx + M - 1.2) * PX, z0 = (gate.cz + M) * PX; for (let y = z0; y < Hp; y += PX) for (let x = x0; x < x0 + 2.4 * PX; x += PX) FLOORPAINT.path(RP(g, x, y), x / PX | 0, y / PX | 0); }
    for (let X = 0; X < MAP.W + M * 2; X++) for (const Y of [0, MAP.H + M * 2 - 1]) { R(X * PX, Y * PX, PX, PX, '#142414'); for (let i = 0; i < 8; i++) R(X * PX + ((hash(X, Y, i) * 18) | 0), Y * PX + ((hash(Y, X, i) * 16) | 0), 3, 3, i % 2 ? '#1e3a1e' : '#0e1a0e'); }
  } else { g.fillStyle = 'rgba(10,10,20,.35)'; g.fillRect(0, 0, Wp, Hp); }
  // house footprint shadow
  g.fillStyle = 'rgba(0,0,0,.55)'; for (const r of MAP.rooms) g.fillRect((r.r[0] + M) * PX - 4, (r.r[1] + M) * PX - 2, (r.r[2] - r.r[0]) * PX + 8, (r.r[3] - r.r[1]) * PX + 8);
  // room floors (cells of 1 m, clipped to the room)
  for (const r of MAP.rooms) {
    const P = FLOORPAINT[r.floor] || FLOORPAINT.wood; g.save(); g.beginPath(); g.rect((r.r[0] + M) * PX, (r.r[1] + M) * PX, (r.r[2] - r.r[0]) * PX, (r.r[3] - r.r[1]) * PX); g.clip();
    for (let Y = Math.floor(r.r[1]); Y < Math.ceil(r.r[3]); Y++) for (let X = Math.floor(r.r[0]); X < Math.ceil(r.r[2]); X++) P(RP(g, (X + M) * PX, (Y + M) * PX), X, Y);
    // ambient occlusion along the walls
    const x0 = (r.r[0] + M) * PX, z0 = (r.r[1] + M) * PX, w = (r.r[2] - r.r[0]) * PX, h = (r.r[3] - r.r[1]) * PX;
    g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(x0, z0, w, 3); g.fillRect(x0, z0, 3, h); g.fillRect(x0 + w - 3, z0, 3, h); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0, z0 + 3, w, 3); g.fillRect(x0 + 3, z0, 2, h); g.fillRect(x0 + w - 5, z0, 2, h);
    // wear: a few stains and scratches
    for (let i = 0; i < Math.round(w * h / 1800); i++) { const sx = x0 + hash(i, r.idx, 1) * w, sy = z0 + hash(r.idx, i, 2) * h; g.fillStyle = `rgba(0,0,0,${0.08 + hash(i, i, r.idx) * 0.1})`; g.beginPath(); g.ellipse(sx, sy, 3 + hash(i, 3, r.idx) * 8, 2 + hash(i, 4, r.idx) * 5, 0, 0, TAU); g.fill(); }
    g.restore();
  }
  for (const f of MAP.furn) if (f.k === 'rug') paintRug(g, f, M);
  for (const f of MAP.furn) if (f.k === 'stairs') paintStairs(g, f, M, true); else if (f.k === 'stairwell') paintStairs(g, f, M, false);
  // door sills: a worn stone/brass strip across every doorway, so the step from one room into the next reads
  for (const d of MAP.doors) {
    if (d.kind === 'crack') continue;
    const arch = d.kind === 'arch', base = arch ? '#6a6258' : d.kind === 'front' ? '#5a5650' : '#6e5638', T0 = arch ? 0.16 : 0.13;
    let x0, z0, w, h; if (d.dir === 'h') { x0 = d.a; w = d.b - d.a; z0 = d.at - T0; h = T0 * 2 + 0.08; } else { x0 = d.at - T0; w = T0 * 2; z0 = d.a; h = d.b - d.a; }
    const X0 = Math.round((x0 + M) * PX), Z0 = Math.round((z0 + M) * PX), Wd = Math.max(2, Math.round(w * PX)), Hd = Math.max(2, Math.round(h * PX));
    g.fillStyle = shade(base, -0.45); g.fillRect(X0 - 1, Z0 - 1, Wd + 2, Hd + 2);
    g.fillStyle = base; g.fillRect(X0, Z0, Wd, Hd);
    g.fillStyle = shade(base, 0.22); if (d.dir === 'h') g.fillRect(X0, Z0 + Hd - 2, Wd, 1); else g.fillRect(X0 + Wd - 2, Z0, 1, Hd);
    g.fillStyle = shade(base, -0.25); for (let k = 3; k < (d.dir === 'h' ? Wd : Hd) - 2; k += 7) { if (d.dir === 'h') g.fillRect(X0 + k, Z0 + 1, 1, Hd - 2); else g.fillRect(X0 + 1, Z0 + k, Wd - 2, 1); }
  }
  // spatter of old blood near the ritual rooms and a drag mark on floor 1 (one wrong detail per floor)
  const wrong = [[9.2, 13.4], [20.2, 9.8], [9.5, 8.4]][MAP.fi]; if (wrong) { const R2 = RP(g, (wrong[0] + M) * PX, (wrong[1] + M) * PX); for (let i = 0; i < 14; i++) R2(i * 2, Math.round(Math.sin(i * 0.7) * 2), 2, 1, 'rgba(70,10,12,.55)'); R2(-2, -1, 3, 3, 'rgba(70,10,12,.5)'); }
}
function paintRug(g, f, M) {
  const o = f.o, w = (o.w || 1) * PX, d = (o.d || 1) * PX, x0 = (f.x + M) * PX - w / 2, z0 = (f.z + M) * PX - d / 2, R = RP(g, x0, z0), pat = o.pat || 'persian';
  const C = { persian: ['#5a1a1e', '#7a2a26', '#c8a050', '#1e2a40'], persian2: ['#1e2a40', '#2a3a5a', '#b88a40', '#6a1a1e'], runner: ['#4a1418', '#6a2024', '#a88040', '#2a0a0c'], runnerRed: ['#6a1a1e', '#8a2a2a', '#c8a050', '#3a0a0c'], woven: ['#6a5a40', '#7a6a4a', '#4a3a28', '#8a7a5a'], round: ['#3a2440', '#4e3256', '#a88a50', '#20142a'] }[pat] || ['#5a1a1e', '#7a2a26', '#c8a050', '#1e2a40'];
  if (pat === 'round') { g.fillStyle = C[0]; g.beginPath(); g.ellipse(x0 + w / 2, z0 + d / 2, w / 2, d / 2, 0, 0, TAU); g.fill(); g.strokeStyle = C[2]; g.beginPath(); g.ellipse(x0 + w / 2, z0 + d / 2, w / 2 - 4, d / 2 - 4, 0, 0, TAU); g.stroke(); g.fillStyle = C[1]; g.beginPath(); g.ellipse(x0 + w / 2, z0 + d / 2, w / 4, d / 4, 0, 0, TAU); g.fill(); return; }
  R(0, 0, w, d, C[0]); R(2, 2, w - 4, d - 4, C[1]); R(4, 4, w - 8, 1, C[2]); R(4, d - 5, w - 8, 1, C[2]); R(4, 4, 1, d - 8, C[2]); R(w - 5, 4, 1, d - 8, C[2]);
  if (pat === 'woven') { for (let y = 3; y < d - 3; y += 3) R(3, y, w - 6, 1, C[2]); }
  else for (let y = 8; y < d - 8; y += 8) for (let x = 8; x < w - 8; x += 8) { R(x, y, 3, 3, C[3]); R(x + 1, y - 1, 1, 1, C[2]); R(x + 1, y + 3, 1, 1, C[2]); }
  for (let x = 0; x < w; x += 2) { R(x, -2, 1, 2, C[2]); R(x, d, 1, 2, C[2]); }
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 4; i++) g.fillRect(x0 + hash(i, f.id, 1) * w, z0 + hash(f.id, i, 1) * d, 6, 3);
}
/* stairs climb north (z decreasing); a stairwell is the hole going down, with a banister */
function paintStairs(g, f, M, up) {
  const w = f.w * PX, d = f.d * PX, x0 = (f.x + M) * PX - w / 2, z0 = (f.z + M) * PX - d / 2, R = RP(g, x0, z0), n = 16;
  R(0, 0, w, d, '#0a0808');
  for (let i = 0; i < n; i++) {
    const k = up ? i / n : 1 - i / n, y = Math.round(i * d / n), h = Math.ceil(d / n);
    const c = shade('#5a3a24', -0.75 * (1 - k) * (up ? 1 : 1.1));
    R(4, y, w - 8, h, c); R(4, y + h - 2, w - 8, 2, shade(c, -0.35)); R(4, y, w - 8, 1, shade(c, 0.12));
    if (i % 2 === 0) R(w / 2 - 6, y, 12, h, shade('#5a1a1e', -0.7 * (1 - k)));
  }
  R(0, 0, 4, d, '#2a1a10'); R(w - 4, 0, 4, d, '#2a1a10'); R(1, 0, 1, d, '#4a3020'); R(w - 2, 0, 1, d, '#4a3020');
  const gr = g.createLinearGradient(0, z0, 0, z0 + d * 0.6); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x0, z0, w, d * 0.6);
}

/* ---------- wall pieces: 0.5 m slices of every wall edge, drawn in depth order with the props ---------- */
function buildWorld(setup) {
  const saved = RNG; RNG = mulberry32(4242);
  R3.world = true; R3.FH = Math.round(MAP.WALL_H * PX * VS);
  buildFloorCache();
  const CS = MAP.CS, T = MAP.WT / 2, list = R3.drawables = [];
  R3.pieces = [];
  // horizontal edges (east-west walls) – the face is the south side
  for (let j = 0; j <= MAP.GH; j++) for (let i = 0; i < MAP.GW; i++) {
    const c = MAP.hE[hIdx(i, j)]; if (!c) continue;
    const ra = roomAtCell(i, j - 1), rb = roomAtCell(i, j), did = c === 3 ? MAP.hD[hIdx(i, j)] : -1;
    const p = { t: 'h', c, x0: i * CS, x1: (i + 1) * CS, z: j * CS, ra, rb, did, low: rb < 0, key: j * CS + T };
    R3.pieces.push(p); list.push(p);
  }
  // vertical edges (north-south walls) – seen from above as a cap, with an end face where the run stops
  for (let i = 0; i <= MAP.GW; i++) for (let j = 0; j < MAP.GH; j++) {
    const c = MAP.vE[vIdx(i, j)]; if (!c) continue;
    const below = j + 1 < MAP.GH ? MAP.vE[vIdx(i, j + 1)] : 0, hBelow = MAP.hE[hIdx(Math.max(0, i - 1), j + 1)] || MAP.hE[hIdx(Math.min(MAP.GW - 1, i), j + 1)];
    const p = { t: 'v', c, x: i * CS, z0: j * CS, z1: (j + 1) * CS, did: c === 3 ? MAP.vD[vIdx(i, j)] : -1, end: !below && !hBelow, low: false, key: (j + 1) * CS - 0.01 };
    R3.pieces.push(p); list.push(p);
  }
  // pre-paint the wall faces per south room so patterns run continuously
  R3.faceC = {}; const keys = new Set(R3.pieces.filter(p => p.t === 'h').map(p => p.rb < 0 ? 'ext' : MAP.rooms[p.rb].wall));
  for (const k of keys) { const c = mk((MAP.W + 1) * PX, R3.FH + 2); paintWallFace(c.getContext('2d'), c.width, R3.FH, k, 0); R3.faceC[k] = c; }
  const lowC = mk((MAP.W + 1) * PX, 14); paintWallFace(lowC.getContext('2d'), lowC.width, 12, 'ext', 0); R3.faceC._low = lowC;
  // props
  R3.props = [];
  for (const f of MAP.furn) {
    if (f.k === 'rug' || f.k === 'stairs' || f.k === 'stairwell') { if (f.k !== 'rug') list.push({ t: 'rail', f, key: f.z + f.hd - 0.02, up: f.k === 'stairs' }); continue; }
    const b = propBuild(f); const o = { t: 'prop', f, b, key: f.z + Math.min(f.hd, b.HD) - (f.k === 'ritualCircle' ? 99 : 0) + (f.o.y ? 0.01 : 0), y: f.o.y || 0 };
    R3.props.push(o); list.push(o);
  }
  // wall decor, paintings, mirrors, light fixtures
  for (const w of MAP.wallDecor) list.push({ t: 'decor', w, key: w.z + 0.12 + (Math.abs(Math.sin(w.r)) > 0.5 ? 0.3 : 0) });
  MAP.paint.forEach(([x, z, r, s, kind], i) => list.push({ t: 'paint', x, z, r, s: s || 1, kind, i, key: z + 0.11 }));
  for (const l of MAP.lights) list.push({ t: 'fix', l, key: l.z + (l.k === 'sconce' ? 0.12 : 0.05) });
  if (MAP.F.gateAt) list.push({ t: 'gate', at: MAP.F.gateAt, key: MAP.F.gateAt.z + 0.05 });
  R3.bells = []; for (const f of MAP.furn) if (f.o.bell != null) R3.bells[f.o.bell] = { f, sw: 0 };
  R3.manq = MAP.furn.filter(f => f.k === 'mannequin').map(f => ({ f, a: HP }));
  R3.fx = []; R3.dust = []; for (let i = 0; i < 70; i++) R3.dust.push({ x: rr(0, MAP.W), z: rr(0, MAP.H), y: rr(0.3, 2.4), ph: rr(0, 9) });
  RNG = saved;
  R3.setup = null;
  if (setup) buildSetup(setup);
}
function buildSetup(st) { R3.setup = st; }
/* ---------- drawing the static pieces (called from the frame loop, in depth order) ---------- */
const doorCol = d => d.kind === 'shutter' ? '#4a4e54' : d.kind === 'attic' ? '#4a3422' : d.kind === 'seal' ? '#2a1a1a' : d.kind === 'front' ? '#3a1e14' : d.kind === 'rune' ? '#2a2234' : '#4a2c1a';
function drawPiece(g, p, W, cx, cy, fade) {
  const FH = p.low ? 12 : R3.FH, T = MAP.WT / 2;
  if (p.t === 'h') {
    const x = Math.round(p.x0 * PX - cx), w = Math.round(p.x1 * PX - cx) - x, zf = Math.round((p.z + T) * PX - cy), zb = Math.round((p.z - T) * PX - cy);
    const faceK = p.low ? '_low' : p.rb < 0 ? 'ext' : MAP.rooms[p.rb].wall, src = R3.faceC[faceK], sx = Math.round(p.x0 * PX);
    if (fade < 1) g.globalAlpha = fade;
    if (p.c === 1) g.drawImage(src, sx, 0, w, FH, x, zf - FH, w, FH);
    else if (p.c === 2) { // window: sill + glass with rain
      g.drawImage(src, sx, 0, w, FH, x, zf - FH, w, FH); const wy = zf - FH + 6, wh = FH - 18; g.fillStyle = '#1a1612'; g.fillRect(x, wy - 1, w, wh + 2); g.fillStyle = R3.flashK > 0.3 ? '#9ab0d8' : '#0c1424'; g.fillRect(x + 1, wy, w - 2, wh); g.fillStyle = 'rgba(120,150,190,.35)'; for (let k = 0; k < 3; k++) { const ry = (wy + ((performance.now() / 18 + k * 9 + x) % wh)) | 0; g.fillRect(x + 1 + ((k * 3 + x) % Math.max(1, w - 2)), ry, 1, 3); } if ((Math.round(p.x0 / CSZ) % 2) === 0) { g.fillStyle = '#1a1612'; g.fillRect(x + w - 1, wy, 1, wh); } g.fillStyle = '#5a4a3a'; g.fillRect(x, wy + wh, w, 2);
    } else if (p.c === 3) {
      const d = MAP.doors[p.did], st = W && W.doors ? W.doors[p.did] : { open: d.open, locked: d.locked }, DH = Math.round(Math.min(2.2, MAP.WALL_H - 0.4) * PX * VS);
      if (d.kind === 'crack') { g.drawImage(src, sx, 0, w, FH, x, zf - FH, w, FH); if (R3.seerView) { g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(x + 2, zf - DH, w - 4, DH); } g.fillStyle = '#060406'; for (let k = 0; k < DH; k += 2) g.fillRect(x + w / 2 + Math.round(Math.sin(k * 0.7) * 2), zf - DH + k, 1, 2); if (R3.seerView) { g.fillStyle = 'rgba(140,220,255,.5)'; g.fillRect(x + w / 2 - 1, zf - DH, 1, DH); } g.globalAlpha = 1; return; }
      g.drawImage(src, sx, 0, w, FH - DH, x, zf - FH, w, FH - DH);
      const o = d.kind === 'arch' ? 1 : st.open;
      if (d.kind === 'arch') { g.fillStyle = '#2a1a10'; g.fillRect(x, zf - DH - 1, w, 2); }
      else if (d.kind === 'shutter') { const hh = Math.round(DH * (1 - o)); g.fillStyle = '#3e4248'; g.fillRect(x, zf - DH, w, hh); g.fillStyle = '#2a2e34'; for (let k = 2; k < hh; k += 3) g.fillRect(x, zf - DH + k, w, 1); }
      else if (d.kind === 'shelf') { const off = Math.round(o * w * 0.9 * (p.x0 - d.a < 0.01 ? 1 : 1)); if (o < 0.95) { g.fillStyle = '#3a2416'; g.fillRect(x - off, zf - DH, w, DH); g.fillStyle = '#1a100a'; for (let k = 4; k < DH; k += 6) g.fillRect(x - off + 1, zf - DH + k, w - 2, 1); for (let k = 0; k < w; k += 2) { g.fillStyle = BOOKC[(k + p.x0 * 7) & 7]; g.fillRect(x - off + k, zf - DH + 6, 1, 3); g.fillRect(x - off + k, zf - DH + 12, 1, 3); } } }
      else {
        const hingeL = (p.x0 - d.a) < (d.b - p.x1), col = doorCol(d);
        if (o < 0.5) { // closed leaf
          g.fillStyle = col; g.fillRect(x, zf - DH, w, DH); g.fillStyle = shade(col, -0.3); g.fillRect(x + (hingeL ? 0 : w - 1), zf - DH, 1, DH); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 2, zf - DH + 3, w - 4, Math.round(DH / 2) - 4); g.fillRect(x + 2, zf - DH + Math.round(DH / 2) + 1, w - 4, Math.round(DH / 2) - 4);
          if (!hingeL || d.b - d.a < 0.6) { g.fillStyle = PAL.brassL; g.fillRect(hingeL ? x + w - 3 : x + 2, zf - Math.round(DH * 0.45), 1, 2); }
          if (d.kind === 'rune' || d.kind === 'seal') { g.fillStyle = d.kind === 'seal' ? '#c8b06a' : '#7a5aa8'; g.fillRect(x + 2, zf - DH + 4, w - 4, 2); g.fillRect(x + 3, zf - DH + 8, 2, 7); }
          if (st.locked && d.kind !== 'front') { g.fillStyle = '#6a6e74'; g.fillRect(x + (w >> 1) - 1, zf - (DH >> 1), 3, 3); }
        } else { // open: dark opening, leaf turned into the room
          g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, zf - DH, w, 2);
          const lw = 3, lx = hingeL ? x : x + w - lw; g.fillStyle = col; g.fillRect(lx, zf - DH, lw, DH + Math.round(o * 4)); g.fillStyle = shade(col, 0.15); g.fillRect(lx, zf - DH, 1, DH);
        }
      }
      g.fillStyle = '#20140c'; g.fillRect(x, zf - DH - 2, w, 2); if (p.x0 <= d.a + 0.01) g.fillRect(x, zf - DH, 2, DH); if (p.x1 >= d.b - 0.01) g.fillRect(x + w - 2, zf - DH, 2, DH);
    }
    g.fillStyle = WALLTOP; g.fillRect(x, zb - FH, w, zf - zb); g.fillStyle = WALLTOP_EDGE; g.fillRect(x, zf - FH - 1, w, 1);
    g.globalAlpha = 1;
  } else {
    const x = Math.round((p.x - T) * PX - cx), w = Math.round(MAP.WT * PX), z0 = Math.round(p.z0 * PX - cy), z1 = Math.round(p.z1 * PX - cy);
    if (fade < 1) g.globalAlpha = fade;
    if (p.c === 3) {
      const d = MAP.doors[p.did], st = W && W.doors ? W.doors[p.did] : { open: d.open }, DH = Math.round(Math.min(2.2, MAP.WALL_H - 0.4) * PX * VS), o = d.kind === 'arch' ? 1 : st.open;
      g.fillStyle = WALLTOP; g.fillRect(x, z0 - R3.FH, w, z1 - z0);
      if (d.kind === 'crack') { g.fillStyle = WALLTOP; g.fillRect(x, z0 - R3.FH, w, z1 - z0 + R3.FH - DH); g.fillStyle = R3.seerView ? 'rgba(30,40,60,.6)' : '#1e1a20'; g.fillRect(x, z1 - DH, w, DH); if (R3.seerView) { g.fillStyle = 'rgba(140,220,255,.6)'; g.fillRect(x + 1, z0 - DH, 1, z1 - z0 + DH); } }
      else if (o < 0.5) { const col = doorCol(d); g.fillStyle = col; g.fillRect(x + 1, z0 - DH, w - 2, z1 - z0 + DH); g.fillStyle = shade(col, 0.2); g.fillRect(x + 1, z0 - DH, 1, z1 - z0 + DH); }
      else if (d.kind !== 'arch') { const first = p.z0 <= d.a + 0.01; if (first) { const col = doorCol(d), lw = Math.round((d.b - d.a) * PX * 0.9 * o); g.fillStyle = col; g.fillRect(x + w, z0 - DH, lw, DH); g.fillStyle = shade(col, -0.3); g.fillRect(x + w, z0 - 1, lw, 1); } }
    } else {
      g.fillStyle = WALLTOP; g.fillRect(x, z0 - R3.FH, w, z1 - z0);
      if (p.c === 2) { g.fillStyle = R3.flashK > 0.3 ? '#9ab0d8' : '#22344a'; g.fillRect(x + 1, z0 - R3.FH, w - 2, z1 - z0); }
      g.fillStyle = WALLTOP_EDGE; g.fillRect(x, z0 - R3.FH, 1, z1 - z0); g.fillRect(x + w - 1, z0 - R3.FH, 1, z1 - z0);
      if (p.end) { const P = WALLPAL.plaster; g.fillStyle = shade(P.a, -0.25); g.fillRect(x, z1 - R3.FH, w, R3.FH); g.fillStyle = '#2a1a10'; g.fillRect(x, z1 - 3, w, 3); }
    }
    g.globalAlpha = 1;
  }
}
const CSZ = 0.5;
/* stair railings and the up-stair hood (so the stairs read as going up into darkness) */
function drawRail(g, o, cx, cy) {
  const f = o.f, x0 = Math.round((f.x - f.w / 2) * PX - cx), x1 = Math.round((f.x + f.w / 2) * PX - cx), z0 = Math.round((f.z - f.d / 2) * PX - cy), z1 = Math.round((f.z + f.d / 2) * PX - cy), rh = 12;
  g.fillStyle = '#3a2416';
  if (o.up) { for (const x of [x0, x1 - 2]) { g.fillRect(x, z0 - rh, 2, z1 - z0); for (let z = z0; z < z1; z += 8) g.fillRect(x, z - rh, 2, rh); } g.fillStyle = '#5a3a24'; g.fillRect(x0, z1 - rh - 2, 3, rh + 2); g.fillRect(x1 - 3, z1 - rh - 2, 3, rh + 2); }
  else { g.fillRect(x0 - 2, z0 - rh, x1 - x0 + 4, 2); for (const x of [x0 - 2, x1]) g.fillRect(x, z0 - rh, 2, z1 - z0 - 10); for (let x = x0; x < x1; x += 6) g.fillRect(x, z0 - rh, 1, rh); for (let z = z0; z < z1 - 10; z += 6) { g.fillRect(x0 - 2, z - rh, 1, rh); g.fillRect(x1 + 1, z - rh, 1, rh); } }
}
/* wall-mounted things (lever, fuse box, rune panel, mirrors, valve, bolt, shelves) */
function drawDecor(g, o, W, cx, cy, t) {
  const w = o.w, side = Math.abs(Math.sin(w.r)) > 0.5, X = Math.round(w.x * PX - cx), Y = Math.round(w.z * PX - w.y * PX * VS - cy), R = RP(g, X, Y);
  if (side) { // seen edge-on on an east/west wall: a small block
    R(-1, -6, 3, 10, w.k === 'wallMirror' || w.k === 'mantelMirror' ? '#5a7a88' : w.k === 'fuseBox' ? '#5a5e66' : '#4a3020');
    if (w.k === 'lever') { const on = W && W.lv && W.lv[w.o.lever] > 0; R(on ? 1 : -3, on ? 2 : -10, 3, 6, PAL.iron); R(on ? 2 : -4, on ? 7 : -11, 2, 2, '#c83a3a'); }
    return;
  }
  if (w.k === 'lever') { const on = W && W.lv && W.lv[w.o.lever] > 0; R(-4, -6, 8, 12, '#3a3e44'); R(-3, -5, 6, 10, '#2a2e34'); R(-1, on ? 0 : -9, 2, 9, PAL.metalL); R(-2, on ? 7 : -11, 4, 3, '#c83a3a'); }
  else if (w.k === 'fuseBox') { R(-6, -8, 12, 14, '#4a4e54'); R(-5, -7, 10, 12, '#3a3e44'); for (let i = 0; i < 3; i++) R(-4 + i * 3, -5, 2, 4, i === 1 && !(W && W.f && W.f.power) ? '#141414' : '#e8e4d8'); R(3, 2, 2, 2, W && W.f && W.f.power ? '#3aff6a' : '#ff3a2a'); }
  else if (w.k === 'runePanel') { R(-14, -8, 28, 14, '#2a2234'); R(-13, -7, 26, 12, '#3a3046'); if (W && W.dials) W.dials.forEach((v, i) => { R(-11 + i * 6, -5, 5, 7, '#1a1420'); g.fillStyle = '#c8a8ff'; g.font = '6px monospace'; g.fillText(GLYPHS[v] || '?', X - 11 + i * 6, Y + 1); }); }
  else if (w.k === 'wallMirror' || w.k === 'mantelMirror') { const mw = w.k === 'mantelMirror' ? 20 : 14, mh = w.k === 'mantelMirror' ? 14 : 20; R(-mw / 2 - 2, -mh / 2 - 2, mw + 4, mh + 4, '#8a6a2a'); R(-mw / 2, -mh / 2, mw, mh, '#2a3a44'); R(-mw / 2 + 2, -mh / 2 + 2, 1, mh - 6, 'rgba(220,240,255,.35)'); o.mx = X; o.my = Y; o.mw = mw; o.mh = mh; }
  else if (w.k === 'valve') { const turned = W && W.f && W.f.drained; R(-1, -4, 2, 14, '#5a5e66'); g.save(); g.translate(X, Y - 4); g.rotate(turned ? 0.8 : 0); g.fillStyle = '#a82a2a'; g.fillRect(-5, -1, 10, 2); g.fillRect(-1, -5, 2, 10); g.restore(); R(-1, -5, 2, 2, PAL.brassL); }
  else if (w.k === 'bolt') { const open = W && W.doors && MAP.doors.find(d => d.id === w.o.door); R(-6, -2, 12, 4, '#5a5e66'); R(-4, -1, 8, 2, '#3a3e44'); R(open && W.doors[open.idx] && !W.doors[open.idx].locked ? -8 : -2, -2, 4, 4, PAL.metalL); }
  else if (w.k === 'dollShelf') { R(-16, 0, 32, 3, PAL.wm); for (let i = 0; i < 5; i++) { R(-14 + i * 6, -7, 4, 7, pick2(['#a84a4a', '#e8d8c8', '#4a6a8a', '#c8a84a'], i)); R(-13 + i * 6, -9, 3, 3, '#e8d8c0'); R(-13 + i * 6, -8, 1, 1, '#141414'); } }
  else if (w.k === 'potRack') { R(-14, -8, 28, 2, PAL.iron); for (let i = 0; i < 4; i++) { R(-12 + i * 7, -6, 1, 3, PAL.iron); R(-14 + i * 7, -3, 5, 4, '#7a5a3a'); } }
  else R(-4, -4, 8, 8, '#4a3020');
}
/* paintings: heavy gilt frames; one per floor is "the lady", whose eyes follow you */
function drawPainting(g, o, cx, cy, t, me) {
  const side = Math.abs(Math.sin(o.r)) > 0.5, X = Math.round(o.x * PX - cx), Y = Math.round(o.z * PX - Math.min(1.75, MAP.WALL_H - 0.75) * PX * VS - cy), R = RP(g, X, Y);
  if (side) { R(-1, -8, 3, 16, '#8a6a2a'); return; }
  const w = Math.round(14 * o.s), h = Math.round(18 * o.s);
  R(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, '#7a5a22'); R(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, '#a8823a'); R(-w / 2, -h / 2, w, h, '#1a1410');
  if (o.kind === 'lady' || o.i % 3 === 0) {
    R(-w / 2, -h / 2, w, h, '#2a1e1a'); R(-3, -h / 2 + 3, 6, 7, '#d8c8b8'); R(-4, -h / 2 + 1, 8, 4, '#2a1a20'); R(-5, -h / 2 + 3, 2, 8, '#2a1a20'); R(3, -h / 2 + 3, 2, 8, '#2a1a20'); R(-5, -h / 2 + 10, 10, h - 10, o.kind === 'lady' ? '#4a3a5a' : '#3a2a2a');
    const look = me ? clamp(Math.round((me.x - o.x) * 0.6), -1, 1) : 0, by = -h / 2 + 6; R(-2 + look, by, 1, 1, o.kind === 'lady' && R3.huntK > 0.5 ? '#ff2a2a' : '#141010'); R(1 + look, by, 1, 1, o.kind === 'lady' && R3.huntK > 0.5 ? '#ff2a2a' : '#141010');
  } else if (o.i % 3 === 1) { R(-w / 2, -h / 2, w, h, '#1e2a24'); R(-w / 2, 0, w, h / 2, '#2a3a24'); R(-2, -4, 4, 8, '#3a2a1a'); R(-5, -6, 10, 4, '#1a3a1a'); }
  else { R(-w / 2, -h / 2, w, h, '#2a2432'); for (let i = 0; i < 6; i++) R(-w / 2 + 2 + i * 2, -h / 2 + 4 + (i % 3) * 3, 2, 2, pick2(['#8a3a3a', '#c8a84a', '#e8e0d0'], i)); }
}
/* light fixtures (the light itself is added in the lighting pass) */
function drawFixture(g, o, W, cx, cy, t) {
  const l = o.l, X = Math.round(l.x * PX - cx), Y = Math.round(l.z * PX - l.y * PX * VS - cy), R = RP(g, X, Y), k = l.k;
  const on = lightOn(l, W);
  if (k === 'chandelier' || k === 'chandelierBig') { const s = k === 'chandelierBig' ? 1.4 : 1; R(0, -16, 1, 12, PAL.iron); R(-8 * s, -4, 16 * s, 2, PAL.brass); R(-6 * s, -2, 12 * s, 2, drk(PAL.brass)); for (let i = 0; i < 5; i++) { const xx = Math.round(-7 * s + i * 3.5 * s); R(xx, -6, 1, 2, '#e8e0c8'); R(xx, -8, 1, 2, on ? '#ffe6a0' : '#5a5040'); } for (let i = 0; i < 4; i++) R(Math.round(-6 * s + i * 4 * s), 0, 1, 3, '#a8c8d8'); }
  else if (k === 'pendant') { R(0, -14, 1, 10, PAL.iron); R(-3, -4, 6, 3, '#3a3e3a'); R(-1, -1, 2, 1, on ? '#ffe6a0' : '#4a4a40'); }
  else if (k === 'bulb') { R(0, -12, 1, 9, PAL.iron); R(-1, -3, 2, 3, on ? '#fff0b0' : '#5a5a50'); }
  else if (k === 'sconce') { const side = Math.abs(Math.sin(l.r || 0)) > 0.5; R(-1, -2, 3, 5, PAL.brass); R(-1, -5, 1, 3, '#e8e0c8'); if (side) R(0, -6, 1, 1, on ? '#ffd890' : '#3a3428'); else { R(1, -5, 1, 3, '#e8e0c8'); R(-1, -7, 3, 2, on ? 'rgba(255,220,150,.9)' : '#3a3428'); } }
  else if (k === 'candles' || k === 'candleS') { const n = k === 'candles' ? 3 : 1; for (let i = 0; i < n; i++) { const xx = -3 + i * 3, hh = 4 + (i % 2) * 2; R(xx, -hh, 2, hh, '#e8e0c8'); if (on) R(xx, -hh - 2 - ((Math.sin(t * 13 + i) > 0.6) ? 1 : 0), 2, 2, '#ffcf6b'); } }
  else if (k === 'oilLamp') { R(-3, -1, 6, 2, PAL.brass); R(-2, -7, 4, 6, on ? 'rgba(255,214,140,.9)' : 'rgba(120,120,110,.6)'); R(-3, -8, 6, 1, PAL.brass); R(-1, -9, 2, 1, PAL.iron); if (on) R(0, -5, 1, 2, '#fff4c8'); }
  else if (k === 'fire') { if (on) for (let i = 0; i < 4; i++) R(-4 + i * 2, -3 - ((hash(i, (t * 10) | 0, 1) * 4) | 0), 2, 3, i % 2 ? '#ff8a3a' : '#ffcf5a'); }
}
function lightOn(l, W) {
  if (!W) return l.k !== 'oilLamp';
  if (l.k === 'oilLamp') return !!(W.lamps && W.lamps[MAP.lamps.indexOf(l)]);
  if (l.always || ['candles', 'candleS', 'fire'].includes(l.k)) return true;
  return !!(W.f && W.f.power);
}
