/* ================= 2D rigs: wrap the vector chibi / beast painters into objects the game can animate ================= */
const UM_C = 0.00255;  // metres per chibi design unit (a grown man ≈ 1.75 m)
const UM_B = 0.0056;   // metres per beast design unit (× spec.size)
function rigKind(spec) { const r = spec.rig || 'chibi'; return r === 'chibi' || r === 'human' ? 'human' : r; }
function buildRig(spec) {
  const R = { kind: rigKind(spec), spec, h: specHeight(spec), A: { t: Math.random() * 10 }, flip: 1 };
  R.root = new Obj2D((g, K, o) => drawRigged(g, R, R.curA || R.A, K, o.rotation.y, o.scale.x));
  return R;
}
const buildBird = spec => buildRig(Object.assign({ rig: 'bird' }, spec));
const buildHuman = spec => buildRig(Object.assign({ rig: 'chibi' }, spec));
function act(A, k, d, o) { A.act = Object.assign({ k, t: 0, d, k01: 0 }, o || {}); }
function poseRig(R, A, dt) {
  R.curA = A; A.t = (A.t || 0) + dt;
  const spd = A.spd || 0, big = R.kind === 'human' ? 1 : Math.max(0.6, (R.spec.size || 1));
  A.walk = lerp(A.walk || 0, clamp(spd / (R.kind === 'human' ? 2.2 : 2.6), 0, 1), Math.min(1, dt * 10));
  A.ph = (A.ph || 0) + dt * Math.min(spd, 7.5) * (R.kind === 'human' ? 2.3 : 1.7) / Math.sqrt(big);
  if (A.act) { A.act.t += dt; A.act.k01 = clamp(A.act.t / (A.act.d || 0.3), 0, 1); if (A.act.t >= A.act.d) A.act = null; }
  A.blink = (A.t % 3.7) < 0.12 || ((A.t + 0.25) % 7.3) < 0.1;
  A.mood = A.face || (A.act && A.act.k === 'hit' ? 'closed' : A.sleep ? 'closed' : null); A.talk = !!A.talkOn && Math.floor(A.t * 7) % 2 === 0;
}
/* choose front / back / side from the facing, and remember the last left/right so beasts don't flicker */
function viewOf(R, rot) { const fx = Math.sin(rot), fz = Math.cos(rot); if (Math.abs(fx) > 0.25) R.flip = fx > 0 ? 1 : -1; if (R.kind !== 'human') return 'side'; if (Math.abs(fx) > 0.72) return 'side'; return fz >= 0 ? 'front' : 'back'; }
/* ---------- sprite cache: vector frames are painted once per (pose, quantised phase, zoom bucket) and blitted ---------- */
const SPR = { m: new Map(), px: 0, cap: 26e6, budget: 0 };
function sprGet(key) { const c = SPR.m.get(key); if (c) { SPR.m.delete(key); SPR.m.set(key, c); } return c; }
function sprPut(key, c) { SPR.m.set(key, c); SPR.px += c.cv.width * c.cv.height; while (SPR.px > SPR.cap && SPR.m.size > 1) { const [k0, c0] = SPR.m.entries().next().value; SPR.m.delete(k0); SPR.px -= c0.cv.width * c0.cv.height; } }
function sprBox(R, A) { // metres: [w, h, anchorX, anchorY]
  const P = R.spec;
  if (R.kind === 'human') { const h = R.h, down = A.pose === 'down' || A.pose === 'lie'; return [h * (down ? 2.3 : 1.7), h * 1.5, 0.5, 0.82]; }
  const u = UM_B * (P.size || 1);
  if (R.kind === 'bird') return [440 * u, 420 * u, 0.5, 0.74];
  if (R.kind === 'snake') { const L = (P.n || 14) * P.r * 1.3 + P.r * 6; return [L * 2 * u, P.r * 9 * u, 0.5, 0.75]; }
  if (R.kind === 'stake') return [260 * u, 330 * u, 0.5, 0.9];
  return [(P.len * 2.7 + 60) * u, (P.legH + P.bodyR * 2.8 + 80) * u * 1.5, 0.5, 0.8];
}
function drawRigged(g, R, A, K, rot, sc = 1) {
  const P = R.spec, view = viewOf(R, rot);
  let wep = null; for (const c of R.root.children) if (c.kind) wep = c.kind;
  const Pd = wep && P.weapon !== wep ? (R._wp && R._wp.weapon === wep ? R._wp : (R._wp = Object.assign({}, P, { weapon: wep }))) : P;
  const dead = A.pose === 'dead' && R.kind !== 'quad';
  const Ks = Math.pow(2, Math.round(Math.log2(K * sc * V.dpr) * 4) / 4); // render bucket (device px per metre)
  // quantise the animation state into a frame key
  const walking = (A.walk || 0) > 0.15, wf = walking ? ((Math.floor((A.ph || 0) / TAU * 8) % 8) + 8) % 8 : -1;
  const ak = A.act ? A.act.k + (A.act.side || '') + Math.floor(A.act.k01 * 10) : '';
  const tq = R.kind === 'human' ? (A.pose === 'train' || A.pose === 'wave' ? Math.floor(A.t * 8) % 16 : 0) : Math.floor(A.t * 8) % 40;
  const key = (P.key || 'x') + (R._wp && Pd === R._wp ? '+' + wep : '') + '|' + view + '|' + (A.pose || '') + '|' + ak + '|' + wf + '|' + (A.mood || '') + (A.blink ? 'b' : '') + (A.talk ? 't' : '') + '|' + Math.round((A.tilt || 0) * 20) + '|' + tq + '|' + (A.fly ? 'f' : '') + '|' + Ks.toFixed(1);
  let F = sprGet(key);
  if (!F && SPR.budget <= 0 && R.lastF) F = R.lastF;
  if (!F) {
    SPR.budget--; const [bw, bh, ax, ay] = sprBox(R, A), m = dead ? Math.max(bw, bh) : 0, W2 = Math.min(1400, Math.ceil((m || bw) * Ks)), H2 = Math.min(1400, Math.ceil((m || bh) * Ks));
    const cv = cnv(W2, H2), cg = cv.getContext('2d'); cg.translate(W2 * ax, H2 * ay);
    const A2 = Object.assign({}, A, { walk: walking ? 1 : 0, ph: walking ? (wf + 0.5) / 8 * TAU : 0, t: tq / 8, act: A.act ? { k: A.act.k, side: A.act.side, k01: (Math.floor(A.act.k01 * 10) + 0.5) / 10 } : null });
    if (R.kind === 'human') { const px = UM_C * Ks; cg.scale(px, px); A2.view = view; drawChibi(cg, Pd, A2, px); }
    else { const px = UM_B * Ks * (P.size || 1); cg.scale(px, px); if (dead) { cg.translate(0, -20); cg.rotate(HP * 0.9); } drawBeast(cg, P, A2, px); }
    F = { cv, ax: W2 * ax, ay: H2 * ay }; sprPut(key, F);
  }
  R.lastF = F;
  const flip = view === 'side' ? R.flip : 1, s2 = K / Ks;
  g.save(); g.scale(flip * s2, s2); g.drawImage(F.cv, -F.ax, -F.ay); g.restore();
}
function attach(R, side, obj) { obj.visible = false; R.root.add(obj); return obj; }
