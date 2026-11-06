/* ================= 2D rigs: wrap the vector chibi / beast painters into objects the game can animate ================= */
/* pixel sizes: humans by build (sprite height in art px), beasts by size (art px per design unit) */
const PXH = { kid: 38, child: 44, teen: 52, woman: 52, man: 58, old: 54, brute: 64 };
const PXB = 0.2;
const pxPerUnitC = P => (PXH[P.build || 'kid'] || 46) * (P.pxK || 1) / chibiHeight(P);
const UM_C = 1 / 20 * (52 / 690); // nominal (metres per chibi unit for a man) – real size comes from pxPerUnitC
const UM_B = PXB / 20;
function rigKind(spec) { const r = spec.rig || 'chibi'; return r === 'chibi' || r === 'human' ? 'human' : r; }
function buildRig(spec) {
  const R = { kind: rigKind(spec), spec, h: specHeight(spec), A: { t: Math.random() * 10 }, flip: 1 }; R.hpx = R.h * 20;
  R.root = new Obj2D((g, K, o) => drawRigged(g, R, R.curA || R.A, K, o.rotation.y, o.scale.x), { noScale: true }); R.root.rig = R;
  return R;
}
const buildBird = spec => buildRig(Object.assign({ rig: 'bird' }, spec));
const buildHuman = spec => buildRig(Object.assign({ rig: 'chibi' }, spec));
function act(A, k, d, o) { A.act = Object.assign({ k, t: 0, d, k01: 0 }, o || {}); }
function poseRig(R, A, dt) {
  R.curA = A; A.t = (A.t || 0) + dt;
  const spd = A.spd || 0, big = R.kind === 'human' ? 1 : Math.max(0.6, (R.spec.size || 1));
  A.walk = spd > 0.15 ? lerp(A.walk || 0, clamp(0.45 + spd / 4, 0, 1), Math.min(1, dt * 10)) : lerp(A.walk || 0, 0, Math.min(1, dt * 14));
  // stride-based cadence (one cycle ≈ 1.3 body heights), never slower than ~1 step cycle per second while moving so frames keep turning over
  const cyc = R.kind === 'human' ? clamp(spd / (1.3 * R.h), 1.05, 2.6) : clamp(spd / (2.2 * Math.sqrt(big)), 0.9, 2.6);
  if (spd > 0.15) A.ph = (A.ph || 0) + dt * cyc * TAU;
  if (A.act) { A.act.t += dt; A.act.k01 = clamp(A.act.t / (A.act.d || 0.3), 0, 1); if (A.act.t >= A.act.d) A.act = null; }
  A.blink = (A.t % 3.7) < 0.12 || ((A.t + 0.25) % 7.3) < 0.1;
  A.mood = A.face || (A.act && A.act.k === 'hit' ? 'closed' : A.sleep ? 'closed' : null); A.talk = !!A.talkOn && Math.floor(A.t * 7) % 2 === 0;
}
/* choose front / back / side from the facing, and remember the last left/right so beasts don't flicker */
function viewOf(R, rot) { const fx = Math.sin(rot), fz = Math.cos(rot); if (Math.abs(fx) > 0.25) R.flip = fx > 0 ? 1 : -1; if (R.kind !== 'human') return 'side'; if (Math.abs(fx) > 0.72) return 'side'; return fz >= 0 ? 'front' : 'back'; }
/* ---------- sprite cache: each animation frame is painted once with the vector rig at 5× and pixelised ---------- */
const WALKF = 6; // walk-cycle frames per step cycle
const SPR = { m: new Map(), px: 0, cap: 9e6, budget: 0, pal: new Map() };
const PXK = 5;
function sprGet(key) { const c = SPR.m.get(key); if (c) { SPR.m.delete(key); SPR.m.set(key, c); } return c; }
function sprPut(key, c) { SPR.m.set(key, c); SPR.px += c.cv.width * c.cv.height; while (SPR.px > SPR.cap && SPR.m.size > 1) { const [k0, c0] = SPR.m.entries().next().value; SPR.m.delete(k0); SPR.px -= c0.cv.width * c0.cv.height; } }
function rigScale(R) { const P = R.spec; return R.kind === 'human' ? pxPerUnitC(P) : PXB * (P.size || 1); } // art px per design unit
function sprBox(R, A) { // art px: [w, h, anchorX, anchorY]
  const P = R.spec, h = R.hpx;
  if (R.kind === 'human') { const down = A.pose === 'down' || A.pose === 'lie'; return [Math.ceil(h * (down ? 2.3 : 1.7)) + 4, Math.ceil(h * 1.5) + 4, 0.5, 0.84]; }
  const u = PXB * (P.size || 1);
  if (R.kind === 'bird') return [Math.ceil(460 * u) + 6, Math.ceil(520 * u) + 6, 0.5, 0.72];
  if (R.kind === 'snake') { const L = (P.n || 14) * P.r * 1.3 + P.r * 6; return [Math.ceil(L * 2 * u) + 6, Math.ceil(P.r * 9 * u) + 6, 0.5, 0.75]; }
  if (R.kind === 'stake') return [Math.ceil(260 * u) + 4, Math.ceil(330 * u) + 4, 0.5, 0.9];
  return [Math.ceil((P.len * 2.7 + 60) * u) + 6, Math.ceil((P.legH + P.bodyR * 2.8 + 80) * u * 1.5) + 6, 0.5, 0.8];
}
function paintRig(R, A2, view, Pd, bw, bh, ax, ay, dead) {
  const k = PXK, cv = cnv(bw * k, bh * k), cg = cv.getContext('2d'); cg.translate(bw * k * ax, bh * k * ay); const u = rigScale(R) * k;
  PIXLW = 0.72 * k / 1.2;
  try { if (R.kind === 'human') { cg.scale(u, u); A2.view = view; drawChibi(cg, Pd, A2, u); }
    else { cg.scale(u, u); if (dead) { cg.translate(0, -20); cg.rotate(HP * 0.9); } drawBeast(cg, R.spec, A2, u); } } finally { PIXLW = 1; }
  return cv;
}
function rigPalette(R) { // one palette per character keeps colours stable between frames
  const key = R.spec.key || 'x'; let pal = SPR.pal.get(key); if (pal) return pal;
  const A0 = { t: 0, walk: 0, ph: 0 }, [bw, bh, ax, ay] = sprBox(R, A0); const views = R.kind === 'human' ? ['front', 'back', 'side'] : ['side'];
  const big = cnv(bw * PXK * views.length, bh * PXK), bg = big.getContext('2d'); views.forEach((v, i) => bg.drawImage(paintRig(R, Object.assign({}, A0), v, R.spec, bw, bh, ax, ay, false), i * bw * PXK, 0));
  pal = pixelize(big, PXK, { colors: R.kind === 'human' ? 22 : 16, outline: false, inkF: 0.5 }).pal; SPR.pal.set(key, pal); return pal;
}
function drawRigged(g, R, A, K, rot, sc = 1) {
  const P = R.spec, view = viewOf(R, rot);
  let wep = null; for (const c of R.root.children) if (c.kind) wep = c.kind;
  const Pd = wep && P.weapon !== wep ? (R._wp && R._wp.weapon === wep ? R._wp : (R._wp = Object.assign({}, P, { weapon: wep }))) : P;
  const dead = A.pose === 'dead' && R.kind !== 'quad';
  const walking = (A.walk || 0) > 0.3, wf = walking ? ((Math.floor((A.ph || 0) / TAU * WALKF) % WALKF) + WALKF) % WALKF : -1;
  const ak = A.act ? A.act.k + (A.act.side || '') + Math.min(2, Math.floor(A.act.k01 * 3)) : '';
  const tq = R.kind === 'human' ? (A.pose === 'train' || A.pose === 'wave' ? Math.floor(A.t * 4) % 4 : 0) : (A.fly ? Math.floor(A.t * 8) % 4 : Math.floor(A.t * 3) % 6);
  const key = (P.key || 'x') + (R._wp && Pd === R._wp ? '+' + wep : '') + '|' + view + '|' + (A.pose || '') + '|' + ak + '|' + wf + '|' + (A.mood || '') + (A.blink ? 'b' : '') + (A.talk ? 't' : '') + '|' + Math.round((A.tilt || 0) * 10) + '|' + tq + '|' + (A.fly ? 'f' : '') + '|' + (sc !== 1 ? sc.toFixed(2) : '');
  let F = sprGet(key);
  if (!F && SPR.budget <= 0 && R.lastF) F = R.lastF;
  if (!F) {
    SPR.budget--; R.hpx = R.hpx || specHeight(P) * V.PPM; const [bw0, bh0, ax, ay] = sprBox(R, A), m = dead ? Math.max(bw0, bh0) : 0, bw = Math.ceil((m || bw0) * sc), bh = Math.ceil((m || bh0) * sc);
    const A2 = Object.assign({}, A, { walk: walking ? 1 : 0, ph: walking ? (wf + 0.5) / WALKF * TAU : 0, t: R.kind === 'human' ? tq / 4 : tq / (A.fly ? 8 : 3), act: A.act ? { k: A.act.k, side: A.act.side, k01: (Math.min(2, Math.floor(A.act.k01 * 3)) + 0.5) / 3 } : null });
    if (R.kind === 'human' && !PXSPR.vector) { F = pxFrame(R, A2, view, Pd, bw, bh, ax, ay, sc); sprPut(key, F); R.lastF = F; R.lastFlip = view === 'side' ? R.flip : 1; const fl = view === 'side' ? R.flip : 1; g.save(); g.scale(fl, 1); g.drawImage(F.cv, -F.ax, -F.ay); g.restore(); return; }
    let hi; if (sc !== 1) { const R2 = Object.assign({}, R, { spec: P }); const base = paintRigScaled(R, A2, view, Pd, bw, bh, ax, ay, dead, sc); hi = base; } else hi = paintRig(R, A2, view, Pd, bw, bh, ax, ay, dead);
    const px = pixelize(hi, PXK, { pal: sc !== 1 && R.spec.size > 3 ? null : rigPalette(R), colors: 24, inkF: 0.5 });
    F = { cv: px.canvas(), ax: Math.round(bw * ax), ay: Math.round(bh * ay) }; sprPut(key, F);
  }
  R.lastF = F; R.lastFlip = view === 'side' ? R.flip : 1;
  const flip = view === 'side' ? R.flip : 1;
  g.save(); g.scale(flip, 1); g.drawImage(F.cv, -F.ax, -F.ay); g.restore();
}
function paintRigScaled(R, A2, view, Pd, bw, bh, ax, ay, dead, sc) { const k = PXK, cv = cnv(bw * k, bh * k), cg = cv.getContext('2d'); cg.translate(bw * k * ax, bh * k * ay); cg.scale(sc, sc); const inner = paintRig(R, A2, view, Pd, bw / sc, bh / sc, ax, ay, dead); cg.drawImage(inner, -inner.width * ax, -inner.height * ay); return cv; }
function attach(R, side, obj) { obj.visible = false; R.root.add(obj); return obj; }

function satBoost(c, k = 1.15) { const [h, s, l] = rgb2hsl(c); return hsl2rgb([h, clamp(s * k, 0, 1), l]); }

/* the silhouette of a flyer, cast on the ground below it */
function flyerShadow(g, R, sx, sy, sc = 1) {
  const F = R.lastF; if (!F) return; if (!F.sh) { const c = cnv(F.cv.width, F.cv.height), cg = c.getContext('2d'); cg.drawImage(F.cv, 0, 0); cg.globalCompositeOperation = 'source-in'; cg.fillStyle = 'rgb(20,16,30)'; cg.fillRect(0, 0, c.width, c.height); F.sh = c; }
  const lift = R.kind === 'bird' && !(R.spec.chibi > 0.45) ? Math.round(130 * PXB * (R.spec.size || 1) * sc) : 0;
  g.save(); g.globalAlpha = 0.34; g.translate(sx, sy + lift); g.scale(R.lastFlip || 1, 0.8); g.drawImage(F.sh, -F.ax, -F.ay); g.restore();
}

/* native pixel human frame (see 12_pxman.js) */
function pxFrame(R, A, view, P, bw, bh, ax, ay, sc = 1) {
  const hpx = R.hpx * sc, down = A.pose === 'down' || A.pose === 'lie' || A.pose === 'dead';
  if (down) { const A2 = Object.assign({}, A, { pose: null, act: null, walk: 0 }), tw = Math.ceil(hpx * 1.7) + 4, th = Math.ceil(hpx * 1.5) + 4, X = pxHuman(P, A2, 'front', tw, th, 0.5, 0.84, hpx); X.outline({ k: 0.5, a: 0 }); const Y = pxRotate(X, false); const ax0 = Math.round(tw * 0.5), ay0 = Math.round(th * 0.84); return { cv: Y.canvas(), ax: Math.round(ay0 - hpx * 0.5), ay: tw - 1 - ax0 + 5 }; }
  let A2 = A; if (A.act && A.act.k === 'roll') A2 = Object.assign({}, A, { pose: 'kneel', act: null });
  const X = pxHuman(P, A2, view, bw, bh, ax, ay, hpx); if (A.act && A.act.k === 'spin' && Math.cos(A.act.k01 * TAU * 2) < 0) X.flipX();
  return { cv: X.canvas(), ax: Math.round(bw * ax), ay: Math.round(bh * ay) };
}
