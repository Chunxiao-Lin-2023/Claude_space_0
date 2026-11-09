/* ================= renderer: low-poly 2.5D (orthographic, yawed), painter's sort by footprint ================= */
const cv = $('cv'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const CAM = { x: 12, y: 11, S: 50, zoom: LS.get('zoom', 1) };
const YAW = 0.34, CY = Math.cos(YAW), SY = Math.sin(YAW), SP = 0.78, ZP = 0.74;
const LX = -0.42, LY = 0.9;
function resize() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
addEventListener('resize', resize);
const P = (x, y, z) => { const dx = x - CAM.x, dy = y - CAM.y; return [W / 2 + (dx * CY - dy * SY) * CAM.S, H / 2 + (dx * SY + dy * CY) * CAM.S * SP - z * CAM.S * ZP]; };
const unP = (sx, sy) => { const xr = (sx - W / 2) / CAM.S, yr = (sy - H / 2) / (CAM.S * SP); return [CAM.x + xr * CY + yr * SY, CAM.y - xr * SY + yr * CY]; };
const rotY = (x, y) => x * SY + y * CY, rotX = (x, y) => x * CY - y * SY;

/* colour shading with a cache */
const SHC = {};
function shade(hex, k) {
  const key = hex + (k * 64 | 0); let s = SHC[key]; if (s) return s;
  const n = parseInt(hex.slice(1, 7), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k)));
  return (SHC[key] = 'rgb(' + f(n >> 16 & 255) + ',' + f(n >> 8 & 255) + ',' + f(n & 255) + ')');
}

/* project prisms of one object into faces */
function projObj(prs, ox, dim, keep) {
  const faces = [], list = prs.map(p => { let cx = 0, cy = 0; for (const q of p.pts) { cx += q[0]; cy += q[1]; } return [p, Math.round(p.z0 * 50), rotY(cx / p.pts.length, cy / p.pts.length)]; });
  if (!keep) list.sort((a, b) => a[1] - b[1] || a[2] - b[2]);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [pr] of list) {
    const n = pr.pts.length, bot = [], top = [];
    const tp = pr.pts2 || pr.pts;
    for (let i = 0; i < n; i++) { const b = P(pr.pts[i][0], pr.pts[i][1], pr.z0), t = P(tp[i][0], tp[i][1], pr.z1); b[0] += ox; t[0] += ox; bot.push(b); top.push(t); }
    if (!pr.pts2) for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ex = pr.pts[j][0] - pr.pts[i][0], ey = pr.pts[j][1] - pr.pts[i][1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L;
      if (nx * SY + ny * CY > 0.02) { const k = (0.62 + 0.25 * (nx * LX + ny * LY)) * dim; faces.push({ p: [bot[i], bot[j], top[j], top[i]], f: shade(pr.c, k), s: shade(pr.c, k * .72) }); }
    } else for (let i = 0; i < n; i++) {   // frustum side: true 3D normal (e1 x e2)
      const j = (i + 1) % n, e1x = pr.pts[j][0] - pr.pts[i][0], e1y = pr.pts[j][1] - pr.pts[i][1], e2x = tp[i][0] - pr.pts[i][0], e2y = tp[i][1] - pr.pts[i][1], e2z = pr.z1 - pr.z0;
      let nx = e1y * e2z, ny = -e1x * e2z, nz = e1x * e2y - e1y * e2x; const L = Math.hypot(nx, ny, nz); if (L < 1e-7) continue; nx /= L; ny /= L; nz /= L;
      if ((nx * SY + ny * CY) * ZP + nz * SP <= 0.01) continue;
      const h = Math.hypot(nx, ny) || 1, up = Math.max(0, nz), k = ((0.62 + 0.25 * (nx / h * LX + ny / h * LY)) * (1 - up) + 1.02 * up) * dim;
      faces.push({ p: [bot[i], bot[j], top[j], top[i]], f: shade(pr.c, k), s: shade(pr.c, k * .8) });
    }
    if (!pr.noTop && (!pr.pts2 || pr.pts2.some((q, i) => Math.hypot(q[0] - pr.pts2[(i + 1) % n][0], q[1] - pr.pts2[(i + 1) % n][1]) > .012))) faces.push({ p: top, f: shade(pr.c, dim), s: shade(pr.c, dim * (pr.pts2 ? .85 : .74)) });
    for (const q of top) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; }
    for (const q of bot) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] > y1) y1 = q[1]; if (q[1] < y0) y0 = q[1]; }
  }
  return { faces, bb: [x0, y0, x1, y1] };
}
function polyPath(p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
function drawFaces(faces, alpha) {
  ctx.lineWidth = 1; ctx.lineJoin = 'round'; if (alpha != null) ctx.globalAlpha = alpha;
  for (const f of faces) { polyPath(f.p); ctx.fillStyle = f.f; ctx.fill(); ctx.strokeStyle = f.s; ctx.stroke(); }
  ctx.globalAlpha = 1;
}
function inPoly(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; }

/* footprint in rotated space, for ordering */
function rq(fp) { const pts = [[fp[0], fp[1]], [fp[2], fp[1]], [fp[2], fp[3]], [fp[0], fp[3]]].map(([x, y]) => [rotX(x, y), rotY(x, y)]); let a = 1e9, b = -1e9; for (const q of pts) { if (q[0] < a) a = q[0]; if (q[0] > b) b = q[0]; } return { pts, x0: a, x1: b }; }
function section(q, c) { let mn = 1e9, mx = -1e9; const p = q.pts; for (let i = 0; i < 4; i++) { const a = p[i], b = p[(i + 1) & 3]; if ((a[0] - c) * (b[0] - c) <= 0 && a[0] !== b[0]) { const y = a[1] + (c - a[0]) / (b[0] - a[0]) * (b[1] - a[1]); if (y < mn) mn = y; if (y > mx) mx = y; } } return mn > mx ? null : [mn, mx]; }
function before(A, B) {   // -1: A behind B, 1: B behind A, 0: unknown
  const lo = Math.max(A.q.x0, B.q.x0), hi = Math.min(A.q.x1, B.q.x1); if (hi - lo < 1e-4) return 0;
  const c = (lo + hi) / 2, a = section(A.q, c), b = section(B.q, c); if (!a || !b) return 0;
  if (a[1] <= b[0] + 1e-3) return -1; if (b[1] <= a[0] + 1e-3) return 1;
  const d = (a[0] + a[1]) - (b[0] + b[1]); return Math.abs(d) < 1e-4 ? (A.h - B.h) : d;
}
function topoSort(objs) {
  const n = objs.length, indeg = new Array(n).fill(0), adj = objs.map(() => []);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const A = objs[i], B = objs[j];
    if (A.bb[2] < B.bb[0] || B.bb[2] < A.bb[0] || A.bb[3] < B.bb[1] || B.bb[3] < A.bb[1]) continue;
    const o = before(A, B); if (o < 0) { adj[i].push(j); indeg[j]++; } else if (o > 0) { adj[j].push(i); indeg[i]++; }
  }
  const out = [], done = new Array(n).fill(false);
  for (let c = 0; c < n; c++) {
    let best = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (best < 0 || objs[i].dep < objs[best].dep)) best = i;
    if (best < 0) for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || objs[i].dep < objs[best].dep)) best = i;   // cycle: break it
    done[best] = true; out.push(objs[best]); for (const j of adj[best]) indeg[j]--;
  }
  return out;
}

function plPrims(i) {
  const p = G.pl[i];
  if (p.dg) return prismsFor(p.dg.k, p.dg.v, p.dg.r, p.x, p.y);
  const set = PEOPLE[G.scene] || PEOPLE.house; return humanPrims(p, i === G.hider ? set.hide : set.seek, STATE.t + i);
}

/* ---------- frame ---------- */
let DRAWN = [];
function render(dt) {
  ctx.fillStyle = SCENE ? SCENE.bg : '#5c7a52'; ctx.fillRect(0, 0, W, H);
  if (!MAP) return;
  const play = isPlay() && G.phase !== '';
  const meSeek = play && ME === seekerIdx() && G.mode === 'rt' && G.phase !== 'end';
  const lit = play ? (meSeek ? litRooms() : ROOMS.map(r => r.i)) : ROOMS.map(r => r.i);
  const litSet = new Set(lit), seekLit = play && G.mode === 'rt' ? new Set(litRooms()) : null;
  // ground outside the fence
  { const c = [[-8, -8], [HOUSE.w + 8, -8], [HOUSE.w + 8, HOUSE.h + 8], [-8, HOUSE.h + 8]].map(([x, y]) => P(x, y, 0)); polyPath(c); ctx.fillStyle = SCENE.bg || '#6f8f5c'; ctx.fill(); }
  for (const r of ROOMS) drawFloor(r, litSet.has(r.i), seekLit && !meSeek && seekLit.has(r.i) && G.phase === 'seek');
  // flat things (rugs) + shadows
  const objs = [];
  for (const it of MAP.items) {
    if (!litSet.has(it.room)) continue;
    it.wob = Math.max(0, it.wob - dt * 1.6);
    const ox = it.wob > 0 ? Math.sin(STATE.t * 48) * it.wob * 3.2 : 0;
    if (it.flat) { const o = projObj(it.pr, ox, 1); drawFaces(o.faces); DRAWN_FLAT.push({ it, ...o }); continue; }
    if (!it.q) { it.q = rq(it.fp); it.h = Math.max(...it.pr.map(p => p.z1)); it.dep = rotY(it.x, it.y); }
    objs.push({ kind: 'item', it, q: it.q, h: it.h, dep: it.dep, pr: it.pr, ox });
  }
  for (const w of WALLS) { if (!w.q) { w.q = rq(w.fp); w.dep = rotY((w.fp[0] + w.fp[2]) / 2, (w.fp[1] + w.fp[3]) / 2); } objs.push({ kind: 'wall', w, q: w.q, h: w.h, dep: w.dep, pr: w.pr, ox: 0 }); }
  if (play) for (let i = 0; i < 2; i++) {
    const p = G.pl[i], key = p.dg ? p.dg.k + p.dg.v : '';
    if (STATE.dgKey[i] !== undefined && STATE.dgKey[i] !== key && (i !== G.hider || !meSeek || hiderSeen())) puff(p.x, p.y);
    STATE.dgKey[i] = key;
    if (p.gone && i !== ME) continue;
    if (G.mode === 'turn') { if (i !== G.hider || !p.dg) continue; }
    if (i === G.hider && meSeek && !hiderSeen()) continue;
    if (i === G.hider && p.dg && T[p.dg.k].flat) { const o = projObj(plPrims(i), 0, 1); drawFaces(o.faces); DRAWN_FLAT.push({ pl: i, ...o }); continue; }
    const fp = plBox(p, p.x, p.y);
    objs.push({ kind: 'pl', i, q: rq(fp), h: p.dg ? 1 : 1.3, dep: rotY(p.x, p.y), pr: plPrims(i), ox: 0, keep: !p.dg });
  }
  // shadows
  ctx.fillStyle = 'rgba(30,20,10,.16)';
  for (const o of objs) { if (o.kind === 'wall') continue; if (o.kind === 'pl' && !G.pl[o.i].dg) { const p = G.pl[o.i], [cx, cy] = P(p.x, p.y, 0); ctx.beginPath(); ctx.ellipse(cx, cy, .27 * CAM.S, .27 * CAM.S * SP, 0, 0, 6.283); ctx.fill(); continue; } const f = o.kind === 'item' ? o.it.fp : plBox(G.pl[o.i], G.pl[o.i].x, G.pl[o.i].y); const e = o.kind === 'pl' && !G.pl[o.i].dg ? -.04 : .05; polyPath([P(f[0] - e, f[1] - e, 0), P(f[2] + e, f[1] - e, 0), P(f[2] + e + .06, f[3] + e + .06, 0), P(f[0] - e + .06, f[3] + e + .06, 0)]); ctx.fill(); }
  for (const o of objs) { const r = projObj(o.pr, o.ox, 1, o.keep); o.faces = r.faces; o.bb = r.bb; }
  const sorted = topoSort(objs);
  for (const o of sorted) drawFaces(o.faces);
  DRAWN = sorted;
  drawMarks(lit, litSet);
  drawPuffs(dt);
  if (SCENE.water) drawWater(dt);
  drawFx(dt);
  DRAWN_FLAT_LAST = DRAWN_FLAT; DRAWN_FLAT = [];
}
let DRAWN_FLAT = [], DRAWN_FLAT_LAST = [];
function drawFloor(r, on, seekTint) {
  const [x0, y0, x1, y1] = r.r, poly = [P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)];
  polyPath(poly);
  if (!on) {
    ctx.fillStyle = SCENE.water ? '#0a1e30' : '#1b1d24'; ctx.fill();
    const [cx, cy] = P((x0 + x1) / 2, (y0 + y1) / 2, 0); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.font = '600 ' + Math.round(CAM.S * .32) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.n, cx, cy);
    return;
  }
  ctx.fillStyle = r.fc[0]; ctx.fill();
  ctx.save(); polyPath(poly); ctx.clip(); ctx.strokeStyle = r.fc[1]; ctx.lineWidth = 1;
  const L = (ax, ay, bx, by) => { const a = P(ax, ay, 0), b = P(bx, by, 0); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); };
  const area = (x1 - x0) * (y1 - y0), fl = r.fl, seed = r.i * 1013 + 7;
  ctx.beginPath();
  if (fl === 'tile' || fl === 'lino' || fl === 'concrete' || fl === 'stone') {
    const st = fl === 'tile' ? .5 : fl === 'lino' ? 1 : fl === 'concrete' ? 1.5 : 1;
    for (let x = x0; x <= x1; x += st) L(x, y0, x, y1);
    if (fl === 'stone') { let k = 0; for (let y = y0; y <= y1; y += .8, k++) L(x0, y, x1, y); }
    else for (let y = y0; y <= y1; y += st) L(x0, y, x1, y);
  } else if (fl === 'checker') {
    ctx.fillStyle = r.fc[1]; for (let y = y0, j = 0; y < y1; y += .5, j++) for (let x = x0 + (j & 1) * .5; x < x1; x += 1) { polyPath([P(x, y, 0), P(x + .5, y, 0), P(x + .5, y + .5, 0), P(x, y + .5, 0)]); ctx.fill(); }
    ctx.beginPath();
  } else if (fl === 'wood' || fl === 'deck' || fl === 'gym') {
    const st = fl === 'deck' ? .32 : .25; let k = 0;
    for (let y = y0; y <= y1; y += st, k++) { L(x0, y, x1, y); for (let x = x0 + (k % 3) * .55; x < x1; x += 1.6) L(x, y, x, Math.min(y1, y + st)); }
  } else if (fl === 'grass' || fl === 'forest') {
    for (let i = 0; i < area * 1.4; i++) { const x = x0 + hash(i, seed) * (x1 - x0), y = y0 + hash(i, seed + 1) * (y1 - y0); L(x, y, x + .05, y - .1); }
  } else if (fl === 'sand' || fl === 'dirt' || fl === 'seabed' || fl === 'cave') {
    for (let i = 0; i < area * 1.1; i++) { const x = x0 + hash(i, seed) * (x1 - x0), y = y0 + hash(i, seed + 1) * (y1 - y0), w = fl === 'cave' ? .35 : .12; L(x, y, x + w, y + (fl === 'cave' ? .12 : 0)); }
  }
  ctx.stroke();
  if (fl === 'gym') { ctx.strokeStyle = '#f4f2ea'; ctx.lineWidth = 2; const m = .8; polyPath([P(x0 + m, y0 + m, 0), P(x1 - m, y0 + m, 0), P(x1 - m, y1 - m, 0), P(x0 + m, y1 - m, 0)]); ctx.stroke(); const [cx, cy] = P((x0 + x1) / 2, (y0 + y1) / 2, 0); ctx.beginPath(); ctx.ellipse(cx, cy, 1.4 * CAM.S, 1.4 * CAM.S * SP, 0, 0, 6.283); ctx.stroke(); ctx.beginPath(); L((x0 + x1) / 2, y0 + m, (x0 + x1) / 2, y1 - m); ctx.stroke(); }
  if (fl === 'forest') { ctx.fillStyle = 'rgba(40,70,30,.35)'; for (let i = 0; i < area * .25; i++) { const x = x0 + hash(i, seed + 5) * (x1 - x0), y = y0 + hash(i, seed + 6) * (y1 - y0), [px, py] = P(x, y, 0); ctx.beginPath(); ctx.ellipse(px, py, .22 * CAM.S, .22 * CAM.S * SP, 0, 0, 6.283); ctx.fill(); } }
  if (fl === 'seabed') { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = y0 + .6; y < y1; y += 1.1) for (let x = x0; x < x1; x += .6) { const yy = y + Math.sin(x * 1.7 + y) * .12; L(x, yy, x + .6, y + Math.sin((x + .6) * 1.7 + y) * .12); } ctx.stroke(); }
  if (r.path) { const [a, b, c, d] = r.path; ctx.fillStyle = SCENE.pathc || '#d9c9a4'; polyPath([P(a, b, 0), P(c, b, 0), P(c, d, 0), P(a, d, 0)]); ctx.fill(); }
  if (r.water) {
    const [a, b, c, d] = r.water, t = STATE.t; ctx.fillStyle = '#5fa8d0'; polyPath([P(a, b, 0), P(c, b, 0), P(c, d, 0), P(a, d, 0)]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < (c - a) * (d - b) * .8; i++) { const x = a + hash(i, seed + 9) * (c - a), y = b + ((hash(i, seed + 10) * (d - b) + t * .15) % (d - b)); L(x, y, x + .3, y); }
    ctx.stroke();
  }
  if (seekTint) { polyPath(poly); ctx.fillStyle = 'rgba(255,214,90,.16)'; ctx.fill(); }
  ctx.restore();
}
const FONT = '"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

/* markers: hover outline, own-disguise arrow, turn-mode hint rings, seeker reach ring */
function drawMarks(lit, litSet) {
  if (!isPlay()) return;
  const t = STATE.t;
  // turn-mode hints
  if (G.mode === 'turn' || G.phase === 'end') for (const [id, band] of G.hints) {
    const it = MAP.items[id]; if (!it || !litSet.has(it.room)) continue;
    const [cx, cy] = P(it.x, it.y, 0), rx = (Math.max(it.fp[2] - it.fp[0], it.fp[3] - it.fp[1]) / 2 + .25) * CAM.S;
    ctx.strokeStyle = BAND[band].c; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, rx, rx * SP, 0, 0, 6.283); ctx.stroke();
    const [tx, ty] = P(it.x, it.y, it.h + .35); tag(tx, ty, BAND[band].n, BAND[band].c);
  }
  // focus outline
  const f = STATE.focus;
  if (f) {
    const o = f.kind === 'pl' ? DRAWN.find(d => d.kind === 'pl' && d.i === f.i) || DRAWN_FLAT_LAST.find(d => d.pl === f.i) : DRAWN.find(d => d.kind === 'item' && d.it === f.it) || DRAWN_FLAT_LAST.find(d => d.it === f.it);
    if (o) { ctx.lineWidth = 2.5; ctx.strokeStyle = f.ok ? 'rgba(255,255,255,' + (.65 + .3 * Math.sin(t * 7)) + ')' : 'rgba(255,255,255,.3)'; for (const fc of o.faces) { polyPath(fc.p); ctx.stroke(); } }
  }
  // turn-mode pending ghost
  if (STATE.ghost) {
    const g = STATE.ghost, o = projObj(prismsFor(g.k, g.v, g.r, g.x, g.y), 0, 1);
    drawFaces(o.faces, .55); ctx.lineWidth = 2; ctx.strokeStyle = g.ok ? '#7dff9a' : '#ff6a5a'; for (const fc of o.faces) { polyPath(fc.p); ctx.stroke(); }
  }
  // own marker when disguised / range circles
  if (amHider() && G.phase !== 'end') {
    const p = G.pl[ME];
    if (G.mode === 'turn' && G.phase === 'hturn' && p.dg) { const [cx, cy] = P(p.x, p.y, 0), r = BAL.turnMove * CAM.S; ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(125,255,154,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * SP, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); }
    if (p.dg || G.mode === 'rt') { const h = p.dg ? Math.max(...prismsFor(p.dg.k, p.dg.v, p.dg.r, 0, 0).map(q => q.z1)) : 1.35; const [ax, ay] = P(p.x, p.y, h + .3); const b = Math.sin(t * 5) * 3; ctx.fillStyle = '#7dff9a'; ctx.beginPath(); ctx.moveTo(ax, ay + 8 + b); ctx.lineTo(ax - 7, ay - 2 + b); ctx.lineTo(ax + 7, ay - 2 + b); ctx.fill(); if (G.mode === 'rt') tag(ax, ay - 12 + b, '你', '#7dff9a'); }
  }
  // hider sees the seeker counting
  if (G.mode === 'rt' && G.phase === 'hide' && amHider()) { const s = G.pl[seekerIdx()], [x, y] = P(s.x, s.y, 1.75); tag(x, y, '闭眼数数 ' + Math.ceil(G.t), '#ffd36a'); }
  if (G.mode === 'rt' && ME === seekerIdx() && G.phase === 'seek') { const s = G.pl[ME], [cx, cy] = P(s.x, s.y, 0), r = BAL.reach * CAM.S; ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * SP, 0, 0, 6.283); ctx.stroke(); }
  // end: reveal
  if (G.phase === 'end') { const h = G.pl[G.hider]; const [cx, cy] = P(h.x, h.y, 0), r = (1 + .15 * Math.sin(t * 6)) * CAM.S; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * SP, 0, 0, 6.283); ctx.stroke(); const [tx, ty] = P(h.x, h.y, 1.8); tag(tx, ty, h.dg ? '藏在这里：' + T[h.dg.k].n : '藏在这里', '#ffd36a'); }
}
function tag(x, y, s, col) {
  ctx.font = '700 13px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(s).width + 12; ctx.fillStyle = 'rgba(14,16,22,.78)'; rrect(x - w / 2, y - 10, w, 20, 6); ctx.fill();
  ctx.fillStyle = col; ctx.fillText(s, x, y + 1);
}
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* effects: whistle ripples, floating text */
function drawFx(dt) {
  STATE.ripples = STATE.ripples.filter(r => (r.t += dt) < 2.6);
  for (const r of STATE.ripples) {
    const [cx, cy] = P(r.x, r.y, 0);
    for (let k = 0; k < 3; k++) { const tt = r.t - k * .35; if (tt < 0) continue; const rad = (.4 + tt * 1.3) * CAM.S, a = Math.max(0, 1 - tt / 2.2); ctx.strokeStyle = (r.taunt ? 'rgba(255,120,200,' : 'rgba(255,214,90,') + a * .85 + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * SP, 0, 0, 6.283); ctx.stroke(); }
    if (r.t < 2) { ctx.globalAlpha = Math.min(1, 2 - r.t); tag(cx, cy - 30, (r.taunt ? '😜 ' : '🔔 ') + r.room, r.taunt ? '#ff9bd8' : '#ffd36a'); ctx.globalAlpha = 1; }
  }
  STATE.pops = STATE.pops.filter(p => (p.t += dt) < 1.6);
  for (const p of STATE.pops) { const [x, y] = P(p.x, p.y, p.z + p.t * .7); ctx.globalAlpha = Math.min(1, (1.6 - p.t) * 2); ctx.font = '900 ' + (p.big ? 24 : 17) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,10,14,.8)'; ctx.strokeText(p.s, x, y); ctx.fillStyle = p.c; ctx.fillText(p.s, x, y); ctx.globalAlpha = 1; }
}
function drawWater(dt) {
  const t = STATE.t;
  ctx.fillStyle = 'rgba(20,90,170,.2)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const x = ((i * 0.23 + t * .012) % 1.2 - .1) * W, w = W * .07; ctx.fillStyle = 'rgba(120,200,255,.05)'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w * 2.4 - W * .15, H); ctx.lineTo(x + w * 1.2 - W * .15, H); ctx.fill(); }
  ctx.restore();
  if (!STATE.bub) STATE.bub = []; if (STATE.bub.length < 40 && Math.random() < dt * 14) STATE.bub.push({ x: Math.random() * W, y: H + 10, r: 1.5 + Math.random() * 3.5, v: 25 + Math.random() * 40, ph: Math.random() * 6 });
  ctx.strokeStyle = 'rgba(220,240,255,.55)'; ctx.lineWidth = 1.2;
  STATE.bub = STATE.bub.filter(b => (b.y -= b.v * dt) > -10); for (const b of STATE.bub) { ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 2 + b.ph) * 4, b.y, b.r, 0, 6.283); ctx.stroke(); }
}
function puff(x, y) { for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + Math.random() * .5; STATE.puffs.push({ x, y, a, z: .25 + Math.random() * .7, t: -Math.random() * .08, s: .7 + Math.random() * .6 }); } }
function drawPuffs(dt) {
  STATE.puffs = STATE.puffs.filter(q => (q.t += dt) < .7);
  for (const q of STATE.puffs) { if (q.t < 0) continue; const k = q.t / .7, d = .15 + k * .55, [x, y] = P(q.x + Math.cos(q.a) * d, q.y + Math.sin(q.a) * d, q.z + k * .4), r = (.1 + k * .16) * q.s * CAM.S;
    ctx.fillStyle = 'rgba(250,248,240,' + (1 - k) * .85 + ')'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(190,185,175,' + (1 - k) * .6 + ')'; ctx.lineWidth = 1.5; ctx.stroke(); }
}
function pop(x, y, z, s, c, big) { STATE.pops.push({ x, y, z, s, c, t: 0, big }); }

/* picking: front-most drawn object under the pointer */
function pickAt(sx, sy) {
  for (let i = DRAWN.length - 1; i >= 0; i--) { const o = DRAWN[i]; if (o.kind === 'wall') continue; if (sx < o.bb[0] || sx > o.bb[2] || sy < o.bb[1] || sy > o.bb[3]) continue; for (const f of o.faces) if (inPoly(f.p, sx, sy)) return o.kind === 'pl' ? { kind: 'pl', i: o.i } : { kind: 'item', it: o.it }; }
  for (let i = DRAWN_FLAT_LAST.length - 1; i >= 0; i--) { const o = DRAWN_FLAT_LAST[i]; for (const f of o.faces) if (inPoly(f.p, sx, sy)) return o.pl != null ? { kind: 'pl', i: o.pl } : { kind: 'item', it: o.it }; }
  return null;
}

/* camera */
function camStep(dt) {
  let tx = 12, ty = 11, tS = Math.min(W, H) / 10.5 * CAM.zoom;
  if (isPlay()) {
    if (G.mode === 'turn' || (G.phase === 'end')) {
      if (G.mode === 'turn' && G.phase !== 'end') { const fit = fitHouse(); tS = fit * STATE.tz; const xr = STATE.fitOff[0] / tS, yr = STATE.fitOff[1] / (tS * SP); tx = HOUSE.w / 2 - (xr * CY + yr * SY) + STATE.tpan[0]; ty = HOUSE.h / 2 - (-xr * SY + yr * CY) + STATE.tpan[1]; }
      else { const h = G.pl[G.hider]; tx = h.x; ty = h.y; tS = Math.min(W, H) / 9; }
    } else { const p = G.pl[ME]; tx = p.x; ty = p.y; tS = clamp(Math.min(W, H) / 10.5, 32, 90) * CAM.zoom; }
  } else { tS = fitHouse() * 1.15; tx = HOUSE.w / 2 + Math.sin(STATE.t * .07) * 3; ty = HOUSE.h / 2 + Math.cos(STATE.t * .05) * 2; }
  const k = 1 - Math.exp(-dt * 6);
  CAM.x += (tx - CAM.x) * k; CAM.y += (ty - CAM.y) * k; CAM.S += (tS - CAM.S) * k;
}
function fitHouse() {
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  const hw = HOUSE.w / 2, hh = HOUSE.h / 2; for (const [x, y] of [[0, 0], [HOUSE.w, 0], [HOUSE.w, HOUSE.h], [0, HOUSE.h]]) { const xr = rotX(x - hw, y - hh), yr = rotY(x - hw, y - hh) * SP; a = Math.min(a, xr); b = Math.max(b, xr); c = Math.min(c, yr - 2.4 * ZP); d = Math.max(d, yr); }
  const land = TOUCH && H < 500, pad = W < 700 ? 16 : 50, top = land ? 44 : 96, bot = land ? 10 : W < 700 ? 200 : 150, right = land ? Math.min(340, W * .42) : 0;
  const s = Math.min((W - pad * 2 - right) / (b - a), (H - top - bot) / (d - c));
  STATE.fitOff = [-right / 2, (top - bot) / 2]; return s;
}
