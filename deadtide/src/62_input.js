/* ================= input: keyboard + mouse, touch sticks & buttons, camera controls ================= */
const INP = { keys: {}, mx: 0, my: 0, mL: false, mR: false, mouseT: 0, touch: false, lastTouch: 0,
  move: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, aim: { id: null, ox: 0, oy: 0, x: 0, y: 0, a: 0, t: 0, btn: false }, tp: {}, pinch: null, useHeld: false, bldT: 0, bldLast: '', paint: null, aimT: 0 };
const KD = k => !!INP.keys[k];
const inGame = () => STATE.mode === 'play' && W && !W.over;
const panelOpen = () => !$('craft').classList.contains('hidden') || !$('pause').classList.contains('hidden') || !$('help').classList.contains('hidden');
function act(a, v) {
  const me = W && W.p[ME]; if (!me) return;
  if (a === 'wpn' && (me.down || !me.owned[v])) return;
  if (NETROLE === 'guest') {
    netSendCtl({ t: 'act', a, v });
    if (a === 'wpn') { me.wpn = v; me.wpnLock = performance.now() + 700; sfx('swap'); }
    if (a === 'mode') me.build = !!v;
    if (a === 'reload' && me.mag[me.wpn] < WPN[me.wpn].mag) { sfx('reload'); me.reloadVis = WPN[me.wpn].reload; }
  } else doAct(me, a, v);
}
function toggleBuild(v) {
  const me = W.p[ME]; if (me.down || me.dead) return;
  const on = v == null ? !me.build : v; me.build = on; if (!on) me.demo = false; else me.sdir = screenUpDir();
  act('mode', on ? 1 : 0); uiBuildBar(); UI.keysK = ''; uiKeys(me); sfx('click');
}
function selBlock(id) { const me = W.p[ME]; me.sel = id; me.demo = false; uiBuildBar(); sfx('click'); }
function rotStairs() { const me = W.p[ME]; me.sdir = (me.sdir + 1) & 3; uiBuildBar(); sfx('click'); }
function cycleWpn(d) { const me = W.p[ME]; let w = me.wpn; for (let k = 0; k < NW; k++) { w = (w + d + NW) % NW; if (me.owned[w]) break; } if (w !== me.wpn) act('wpn', w); }
// knife: find the zombie, turn to it, lunge into reach and slash; the host settles the damage
function doKnife() {
  const me = W.p[ME]; if (!me || me.dead || me.down || me.build || me.medT > 0 || me.jmp || (me.knCD || 0) > performance.now()) return;
  me.knCD = performance.now() + BAL.knifeCD * 1000;
  const mv = Math.hypot(me.inp.mx, me.inp.my) > 0.3 && INP.touch ? Math.atan2(me.inp.my, me.inp.mx) : me.aim;
  const z = knifeTarget(me, mv);
  if (z) {
    const dx = z.x - me.x, dy = z.y - me.y, d = Math.hypot(dx, dy) || 1, go = clamp(d - (me.r + z.r + 0.12), 0, BAL.knifeLunge);
    me.aim = Math.atan2(dy, dx); me.aimPt = { x: z.x, y: z.y, z: z.z + z.h * 0.6, zb: z }; INP.aimT = 0.3;
    if (go > 0.05) me.dash = { t: 0, T: 0.06 + go * 0.07, dx: dx / d * go, dy: dy / d * go };
  }
  me.knT = 0.28; me.knZ = z; act('knife', z ? z.id : -1);
}
// jump: vault what's in front (or leap a gap), else a little hop. Direction = where you're walking, else where you aim
function doJump() {
  const me = W.p[ME]; if (!me || me.dead || me.down) return;
  let ax = me.inp.mx, ay = me.inp.my; if (Math.hypot(ax, ay) < 0.3) { ax = Math.cos(me.aim); ay = Math.sin(me.aim); }
  const dx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, dy = dx ? 0 : Math.sign(ay);
  startJump(me, dx, dy, true);
}
// camera controls (shared by keys and the HUD buttons)
function camRot(d) { CAM.rot = (CAM.rot + d + 4) % 4; sfx('click'); }
function camZoom(f) { CAM.zoom = clamp(CAM.zoom * f, 4, 22); SET.zoom = CAM.zoom; saveSet(); }
function viewStep(d) { if (!W) return; const me = W.p[ME]; if (VIEW.auto) { const base = me.build ? me.L : (cutBox() ? LCUT.L : topBuiltL()); VIEW.auto = false; VIEW.L = base; } VIEW.L = clamp(VIEW.L + d, 0, ML - 2); uiView(); sfx('click'); }
function topBuiltL() { let t = 0; for (let i = 0; i < NC; i++) if ((W.slab[i] && B[W.slab[i]].cost) || (W.blk[i] && B[W.blk[i]].cost)) t = Math.max(t, cl_(i)); return Math.min(ML - 2, t + 1); }
function viewAuto() { VIEW.auto = true; uiView(); sfx('click'); }
// default stairs direction: up the screen
function screenUpDir() { const [fx, fy] = camFwd(); let best = 0, bd = -2; DIRS.forEach(([dx, dy], k) => { const d = dx * fx + dy * fy; if (d > bd) { bd = d; best = k; } }); return best; }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  audioInit();
  if (k === 'Escape') { if (PLAN || PREV) { cancelPlan(); e.preventDefault(); return; } if (STATE.mode === 'play') togglePause(); e.preventDefault(); return; }
  if (!INP.keys[k]) onKeyPress(k);
  INP.keys[k] = true;
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'PageUp', 'PageDown', 'Home'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; INP.keys[k] = false; });
addEventListener('blur', () => { INP.keys = {}; INP.mL = INP.mR = false; });
function onKeyPress(k) {
  if (k === 'm') { setMute(!SET.mute); uiMute(); return; }
  if (STATE.mode !== 'play' || !W) { if (k === 'Enter' && STATE.mode === 'title') $('soloBtn').click(); return; }
  if (k === 'q') return camRot(-1);
  if (k === 'e') return camRot(1);
  if (k === '=' || k === '+') return camZoom(0.85);
  if (k === '-') return camZoom(1 / 0.85);
  if (k === 'PageUp') return viewStep(1);
  if (k === 'PageDown') return viewStep(-1);
  if (k === 'Home') return viewAuto();
  if (k === 'h' && !$('help').classList.contains('hidden')) { closeHelp(); return; }
  if (panelOpen()) { if (k === 'f' || k === 'c') closeCraft(); return; }
  if (W.over) return;
  const me = W.p[ME];
  if (k === 'b') return toggleBuild();
  if (me.build) {
    const n = '1234567890'.indexOf(k); if (n >= 0 && PAL[n]) return selBlock(PAL[n]);
    if (k === 'x') { me.demo = !me.demo; uiBuildBar(); return; }
    if (k === 'r') return rotStairs();
    if ((k === 'Enter' || k === ' ') && PLAN) return confirmPlan();
  } else { const n = '1234567'.indexOf(k); if (n >= 0) return act('wpn', n); if (k === 'r') return act('reload'); }
  if (k === ' ') return doJump();
  if (k === 'v') return doKnife();
  if (k === 'g') return act('nade');
  if (k === 'h') return act('med');
  if (k === 'n') return toggleReady();
  if (k === 'c') return openCraft();
  if (k === 'f') { if (nearBench(me) && !useTarget(me)) return openCraft(); if (INP.useLatch) INP.useLatch = null; else INP.useReq = true; }
}
function toggleReady() { const me = W.p[ME]; if (W.phase !== 'day') return; act('ready', me.ready ? 0 : 1); if (NETROLE === 'guest') me.ready = !me.ready; sfx('ready'); }
// mouse
CV.addEventListener('mousemove', e => { INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now(); });
CV.addEventListener('mousedown', e => {
  audioInit(); INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now();
  if (performance.now() - INP.lastTouch < 800) return;
  if (e.button === 0) INP.mL = true; if (e.button === 2) INP.mR = true; INP.bldLast = '';
});
addEventListener('mouseup', e => { if (e.button === 0) INP.mL = false; if (e.button === 2) INP.mR = false; });
CV.addEventListener('contextmenu', e => e.preventDefault());
CV.addEventListener('wheel', e => { if (STATE.mode !== 'play') return; e.preventDefault(); camZoom(e.deltaY > 0 ? 1.1 : 1 / 1.1); }, { passive: false });

/* ---------- touch ---------- */
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { setTouch(true); INP.lastTouch = performance.now(); } }, true);
const stickL = document.getElementById('stickL'), stickR = document.getElementById('stickR');
function setTouch(on) { if (INP.touch === on) return; INP.touch = on; document.body.classList.toggle('touch', on); }
function stickDraw(el, s, R) {
  if (s.id == null) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden'); el.style.left = s.ox + 'px'; el.style.top = s.oy + 'px'; if (R) el.style.setProperty('--R', R + 'px');
  const k = el.firstElementChild, m = Math.hypot(s.x, s.y), f = m > 1 ? 1 / m : 1;
  k.style.transform = `translate(${s.x * f * R}px,${s.y * f * R}px)`;
}
// where the move stick may appear: left part of the screen, below the top HUD cards
function moveZone(x, y) { return x < VW * (VH > VW ? 0.6 : 0.45) && y > Math.min(VH * 0.3, 150); }
let UIR = { t: -1, r: [] };
function nearUI(x, y) {
  const now = performance.now();
  if (now - UIR.t > 250) { UIR.t = now; UIR.r = [...document.querySelectorAll('#tctl button, #tFire, #hud button, #bbar, #viewBox')].map(el => el.getBoundingClientRect()).filter(r => r.width && r.height); }
  const m = 26; return UIR.r.some(r => x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m);
}
const STICK_R = () => Math.min(64, Math.max(44, Math.min(VW, VH) * 0.09));
CV.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  audioInit(); e.preventDefault();
  if (!inGame()) return;
  const me = W.p[ME], now = performance.now();
  INP.tp[e.pointerId] = { x: e.clientX, y: e.clientY, t: now };
  // two fingers landing together on the map = pinch to zoom
  const others = Object.keys(INP.tp).filter(k => +k !== e.pointerId);
  if (!me.build && others.length === 1 && !INP.pinch) {
    const o = INP.tp[others[0]];
    if (now - o.t < 350 && Math.hypot(o.x - (o.x0 == null ? o.x : o.x0), o.y - (o.y0 == null ? o.y : o.y0)) < 24) {
      for (const s of [INP.move, INP.aim]) if (s.id === +others[0] && !s.btn) { s.id = null; s.x = s.y = 0; }
      stickDraw(stickL, INP.move); if (!INP.aim.btn) stickDraw(stickR, INP.aim);
      INP.pinch = { a: +others[0], b: e.pointerId, d0: Math.max(30, Math.hypot(o.x - e.clientX, o.y - e.clientY)), z0: CAM.zoom };
      try { CV.setPointerCapture(e.pointerId); } catch (_) { } return;
    }
  }
  if (INP.pinch) return;
  INP.tp[e.pointerId].x0 = e.clientX; INP.tp[e.pointerId].y0 = e.clientY;
  // a near-miss on a button must not pop a joystick or place a block
  if (nearUI(e.clientX, e.clientY)) { delete INP.tp[e.pointerId]; return; }
  if (moveZone(e.clientX, e.clientY) && INP.move.id == null) { const R = STICK_R(), m = R * 0.6; Object.assign(INP.move, { id: e.pointerId, ox: clamp(e.clientX, m, VW - m), oy: clamp(e.clientY, m, VH - m), x: 0, y: 0, t0: performance.now(), far: false, sx: e.clientX, sy: e.clientY }); INP.move.x = (e.clientX - INP.move.ox) / R; INP.move.y = (e.clientY - INP.move.oy) / R; stickDraw(stickL, INP.move, R); }
  else if (me.build) { INP.paint = e.pointerId; touchBuild(e.clientX, e.clientY, true); }
  else return; // shooting is on the fire button; the rest of the right side does nothing
  try { CV.setPointerCapture(e.pointerId); } catch (_) { }
}, { passive: false });
CV.addEventListener('pointermove', e => {
  if (e.pointerType !== 'touch') return; e.preventDefault();
  const tp = INP.tp[e.pointerId]; if (tp) { tp.x = e.clientX; tp.y = e.clientY; }
  const P = INP.pinch;
  if (P && (e.pointerId === P.a || e.pointerId === P.b)) { const A = INP.tp[P.a], Bq = INP.tp[P.b]; if (A && Bq) { CAM.zoom = clamp(P.z0 * P.d0 / Math.max(20, Math.hypot(A.x - Bq.x, A.y - Bq.y)), 4, 22); SET.zoom = CAM.zoom; } return; }
  const R = STICK_R();
  for (const s of [INP.move, INP.aim]) if (s.id === e.pointerId) {
    let dx = e.clientX - s.ox, dy = e.clientY - s.oy; const dd = Math.hypot(dx, dy);
    // floating move stick: the base follows the thumb once it is dragged past the ring, so it never runs out of travel
    if (s === INP.move && dd > R * 1.15) { const k = (dd - R * 1.15) / dd; s.ox += dx * k; s.oy += dy * k; dx = e.clientX - s.ox; dy = e.clientY - s.oy; }
    s.x = dx / R; s.y = dy / R; if (Math.hypot(e.clientX - (s.sx == null ? s.ox : s.sx), e.clientY - (s.sy == null ? s.oy : s.sy)) > 14) s.far = true; stickDraw(s === INP.move ? stickL : stickR, s, R);
  }
  if (INP.aim.id === e.pointerId && Math.hypot(INP.aim.x, INP.aim.y) > 0.25) INP.aim.t = performance.now();
  if (INP.paint === e.pointerId && inGame() && W.p[ME].build) touchBuild(e.clientX, e.clientY, false);
}, { passive: false });
function endPtr(e) {
  if (e.pointerType !== 'touch') return;
  delete INP.tp[e.pointerId];
  if (INP.pinch && (e.pointerId === INP.pinch.a || e.pointerId === INP.pinch.b)) { INP.pinch = null; saveSet(); return; }
  if (INP.paint === e.pointerId) finishPaint();
  if (INP.move.id === e.pointerId && !INP.move.far && performance.now() - INP.move.t0 < 350 && inGame() && W.p[ME].build) { touchBuild(INP.move.ox, INP.move.oy, true); finishPaint(); }
  if (INP.move.id === e.pointerId) { INP.move.id = null; INP.move.x = INP.move.y = 0; stickDraw(stickL, INP.move); }
  if (INP.aim.id === e.pointerId && !INP.aim.btn) { INP.aim.id = null; INP.aim.x = INP.aim.y = 0; INP.aim.t = performance.now(); stickDraw(stickR, INP.aim); }
}
/* fire stick: hold to shoot (auto-aims at the nearest zombie), drag to choose the direction */
const FIRE = document.getElementById('tFire');
function fireKnob() { const k = FIRE.firstElementChild, R = FIRE.clientWidth * 0.36, m = Math.hypot(INP.aim.x, INP.aim.y), f = m > 1 ? 1 / m : 1; k.style.transform = INP.aim.id != null && INP.aim.btn ? `translate(${INP.aim.x * f * R}px,${INP.aim.y * f * R}px)` : ''; }
FIRE.addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation(); audioInit(); if (!inGame()) return;
  if (INP.aim.id != null && !INP.aim.btn) { INP.aim.id = null; stickDraw(stickR, INP.aim); }
  const r = FIRE.getBoundingClientRect();
  Object.assign(INP.aim, { id: e.pointerId, ox: r.left + r.width / 2, oy: r.top + r.height / 2, x: 0, y: 0, btn: true });
  INP.aimT = 0; W.p[ME].aimPt = null; FIRE.classList.add('on'); fireKnob();
  try { FIRE.setPointerCapture(e.pointerId); } catch (_) { }
});
FIRE.addEventListener('pointermove', e => {
  if (INP.aim.id !== e.pointerId || !INP.aim.btn) return; e.preventDefault();
  const R = FIRE.clientWidth * 0.5; INP.aim.x = (e.clientX - INP.aim.ox) / R; INP.aim.y = (e.clientY - INP.aim.oy) / R;
  if (Math.hypot(INP.aim.x, INP.aim.y) > 0.3) INP.aim.t = performance.now(); fireKnob();
});
function fireEnd(e) { if (INP.aim.id !== e.pointerId || !INP.aim.btn) return; Object.assign(INP.aim, { id: null, x: 0, y: 0, btn: false, t: performance.now() }); FIRE.classList.remove('on'); fireKnob(); }
FIRE.addEventListener('pointerup', fireEnd); FIRE.addEventListener('pointercancel', fireEnd);
CV.addEventListener('pointerup', endPtr); CV.addEventListener('pointercancel', endPtr);
/* ---------- build targeting: the surface under the cursor / finger decides the cell (no layer switching) ---------- */
// point at the top of a wall -> stack on it; at a wall's side -> build next to it; at a floor -> build on it.
// Floors also try the ceiling above what you point at, and your own level (balconies out over the edge).
function pickBuild(sx, sy, me, demo) {
  const { o, d } = screenRay(sx, sy), maxL = Math.min(ML - 1, viewL(), LCUT ? LCUT.L : ML - 1);
  const top = (maxL + 1) * FH + 0.01; let t0 = 0; if (o[2] > top && d[2] < 0) t0 = (o[2] - top) / -d[2];
  const h = rayWorld(o[0] + d[0] * t0, o[1] + d[1] * t0, o[2] + d[2] * t0, d[0], d[1], d[2], 300, { maxL, any: true, hide: lcHide });
  if (h.x == null || !inMap(h.x, h.y)) return null;
  let surf = null, front;
  if (h.slab) { surf = { x: h.x, y: h.y, L: h.l, slab: 1 }; front = { x: h.x, y: h.y, L: h.l }; }
  else if (h.l < 0) front = { x: h.x, y: h.y, L: 0 };
  else {
    surf = { x: h.x, y: h.y, L: h.l };
    const b = W.blk[h.i];
    if (b === 23) front = { x: h.x, y: h.y, L: h.l };
    else if (h.face === 0) front = { x: h.x - (d[0] > 0 ? 1 : -1), y: h.y, L: h.l };
    else if (h.face === 1) front = { x: h.x, y: h.y - (d[1] > 0 ? 1 : -1), L: h.l };
    else front = { x: h.x, y: h.y, L: h.l + 1 };
  }
  if (demo) {
    if (!surf) return null;
    const i = ci(surf.x, surf.y, surf.L), b = surf.slab ? W.slab[i] : W.blk[i];
    return b && B[b].cost ? { x: surf.x, y: surf.y, L: surf.L, ok: true } : null;
  }
  const slab = !!B[me.sel].slab, cands = [];
  if (surf && !!surf.slab === slab) {
    const i = ci(surf.x, surf.y, surf.L), cur = slab ? W.slab[i] : W.blk[i];
    if (cur && B[cur].cost && (slab ? W.shp[i] : W.bhp[i]) < B[cur].hp * 0.98) cands.push({ x: surf.x, y: surf.y, L: surf.L });
  }
  cands.push(front);
  if (slab) { cands.push(buildPick(sx, sy, front.L + 1), buildPick(sx, sy, me.L), buildPick(sx, sy, me.L + 1)); }
  else if (front.L < me.L) cands.push(buildPick(sx, sy, me.L));
  for (const c of cands) if (c && inMap(c.x, c.y) && c.L >= 0 && c.L < ML && !buildWhy(me, c.x, c.y, c.L)) return Object.assign(c, { ok: true, why: '' });
  return Object.assign(front, { ok: false, why: buildWhy(me, front.x, front.y, front.L) });
}
/* ---------- build plan: click / tap / drag makes a preview; confirm with the ✓ bar, Enter, or a second tap on it ---------- */
let PLAN = null, PREV = null;   // PREV: being drawn right now; PLAN: waiting for confirmation
function planHas(P, c) { return P && c && P.cells.some(q => q.x === c.x && q.y === c.y && q.L === c.L); }
function cancelPlan() { PLAN = null; PREV = null; INP.bA = null; uiPlan(); }
function confirmPlan() {
  const me = W.p[ME]; if (!PLAN || !me) return;
  PLAN.cells.forEach((c, k) => buildAt(me, c.x, c.y, c.L, PLAN.demo, k > 0));
  if (!PLAN.demo) me._swingT = 0.3; sfx(PLAN.demo ? 'demo' : 'click');
  PLAN = null; uiPlan();
}
function prevAdd(c, demo) {
  if (!PREV) PREV = { cells: [], demo, id: W.p[ME].sel, d: W.p[ME].sdir };
  if (!planHas(PREV, c) && PREV.cells.length < 40) PREV.cells.push({ x: c.x, y: c.y, L: c.L });
}
function finishPaint() {
  INP.paint = null;
  if (!SET.bconf || !PREV) { PREV = null; return; }
  const me = W.p[ME];
  // keep only what can actually be built / demolished
  PREV.cells = PREV.cells.filter(c => PREV.demo ? true : !buildWhy(me, c.x, c.y, c.L));
  PLAN = PREV.cells.length ? PREV : null; if (!PLAN && PREV.cells.length === 0 && BUILD_HOVER && BUILD_HOVER.why) { toast(BUILD_HOVER.why, '#ff8a7a'); sfx('deny'); }
  PREV = null; uiPlan();
}
function planCost() {
  if (!PLAN) return ''; const me = W.p[ME];
  if (PLAN.demo) return '拆掉 ' + PLAN.cells.length + ' 个';
  const B0 = B[PLAN.id], c = {}; for (const k in B0.cost) c[k] = B0.cost[k] * PLAN.cells.length;
  return '建 ' + PLAN.cells.length + ' 个' + B0.name + ' · ' + costText(c) + (affordable(W.res, c) ? '' : ' · 材料不够');
}
// one painting step (mouse held / finger down). Dragging builds a straight row on the first cell's floor.
function paintBuild(sx, sy, start, demo) {
  const me = W.p[ME]; if (!me || !me.build) return;
  if (start) {
    // tapping the waiting plan again confirms it; tapping elsewhere starts a new one
    if (PLAN) { const c = PLAN.demo ? pickBuild(sx, sy, me, true) : pickBuild(sx, sy, me, false); const q = c && buildPick(sx, sy, PLAN.cells[0].L); if (planHas(PLAN, c) || planHas(PLAN, q)) { confirmPlan(); INP.noPaint = true; return; } PLAN = null; uiPlan(); }
    INP.noPaint = false; PREV = null;
  }
  if (INP.noPaint) return;
  if (start) { INP.bA = null; INP.bAxis = null; INP.bPrev = null; INP.bldLast = ''; }
  if (!demo && INP.bA) {
    const A = INP.bA, q = buildPick(sx, sy, A.L); if (!q) return;
    if (!INP.bAxis && (q.x !== A.x || q.y !== A.y)) INP.bAxis = Math.abs(q.x - A.x) >= Math.abs(q.y - A.y) ? 'x' : 'y';
    const c = INP.bAxis === 'x' ? { x: q.x, y: A.y, L: A.L } : INP.bAxis === 'y' ? { x: A.x, y: q.y, L: A.L } : { x: A.x, y: A.y, L: A.L };
    const P = INP.bPrev || A, n = Math.abs(c.x - P.x) + Math.abs(c.y - P.y), sx_ = Math.sign(c.x - P.x), sy_ = Math.sign(c.y - P.y);
    for (let k = 1; k <= n; k++) { if (SET.bconf) prevAdd({ x: P.x + sx_ * k, y: P.y + sy_ * k, L: A.L }, false); else buildAt(me, P.x + sx_ * k, P.y + sy_ * k, A.L, false, true); }
    INP.bPrev = c;
    const why = buildWhy(me, c.x, c.y, c.L); BUILD_HOVER = Object.assign(c, { ok: !why, why, t: 1 });
    return;
  }
  const c = pickBuild(sx, sy, me, demo); if (!c) { BUILD_HOVER = null; return; }
  BUILD_HOVER = Object.assign(c, { t: 1 });
  const key = c.x + ',' + c.y + ',' + c.L; if (INP.bldLast === key) return; INP.bldLast = key;
  if (SET.bconf) prevAdd(c, demo); else buildAt(me, c.x, c.y, c.L, demo);
  if (!demo) { INP.bA = { x: c.x, y: c.y, L: c.L }; INP.bPrev = INP.bA; }
}
function touchBuild(sx, sy, start) { paintBuild(sx, sy, start, W.p[ME].demo); }
function buildWhy(me, x, y, L) {
  const i = inMap(x, y) && L >= 0 && L < ML ? ci(x, y, L) : -1;
  if (B[me.sel].stairs && i >= 0 && !W.blk[i]) me.sdir = ladderDir(x, y, L, me.sdir); // ladders turn to face the wall they hang on
  const slab = B[me.sel].slab, cur = i < 0 ? 0 : slab ? W.slab[i] : W.blk[i];
  if (cur && B[cur].cost) { // repair (only if damaged)
    if ((slab ? W.shp[i] : W.bhp[i]) >= B[cur].hp * 0.98) return slab ? '这里已经有楼板了' : '这里已经有东西了';
    return !inReach(me, x, y, L) ? '太远了' : '';
  }
  return canPlace(x, y, L, me.sel, me.sdir) || (!inReach(me, x, y, L) ? '太远了' : '') || (!affordable(W.res, B[me.sel].cost) ? '材料不足' : '');
}
function buildAt(me, x, y, L, demo, quiet) {
  if (!inMap(x, y) || L < 0 || L >= ML) return;
  if (demo) { const i = ci(x, y, L); if ((W.blk[i] && B[W.blk[i]].cost) || (W.slab[i] && B[W.slab[i]].cost)) act('demo', { x, y, l: L }); return; }
  const why = buildWhy(me, x, y, L);
  if (why) { if (!quiet && thr('denyL', 0.3)) { toast(why, '#ff8a7a'); sfx('deny'); } return; }
  act('build', { x, y, l: L, b: me.sel, d: me.sdir }); me._swingT = 0.3;
}
function bindBtn(id, down, up) {
  const el = document.getElementById(id); if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); el.classList.add('on'); down && down(); try { el.setPointerCapture(e.pointerId); } catch (_) { } });
  const end = () => { el.classList.remove('on'); up && up(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
bindBtn('tReload', () => inGame() && (W.p[ME].build ? rotStairs() : act('reload')));
bindBtn('tWpn', () => { if (!inGame()) return; const me = W.p[ME]; if (me.owned.filter(Boolean).length <= 2) cycleWpn(1); else toggleWpick(); });
// weapon picker: every gun you own in one tap instead of cycling through them
function toggleWpick(force) {
  const el = $('wpick'), open = force != null ? force : el.classList.contains('hidden');
  el.classList.toggle('hidden', !open); if (!open) return;
  const me = W.p[ME]; el.innerHTML = '';
  WPN.forEach((w, k) => {
    if (!me.owned[k]) return;
    const b = document.createElement('button'); b.className = k === me.wpn ? 'sel' : '';
    b.innerHTML = '<b>' + w.name + '</b><span>' + (w.inf ? '∞' : me.mag[k] + ' / ' + me.ammo[k]) + '</span>';
    b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); act('wpn', k); sfx('click'); toggleWpick(false); });
    el.appendChild(b);
  });
  const r = $('tWpn').getBoundingClientRect(); el.style.right = Math.max(8, VW - r.right) + 'px'; el.style.bottom = (VH - r.top + 8) + 'px';
}
document.addEventListener('pointerdown', e => { const el = $('wpick'); if (el && !el.classList.contains('hidden') && !el.contains(e.target) && e.target.id !== 'tWpn' && !$('tWpn').contains(e.target)) toggleWpick(false); }, true);
bindBtn('tLUp', () => viewStep(1)); bindBtn('tLDn', () => viewStep(-1));
bindBtn('vToggle', () => { document.body.classList.toggle('vopen'); $('vToggle').classList.toggle('on', document.body.classList.contains('vopen')); sfx('click'); });
bindBtn('tShove', () => { if (inGame()) { INP.knHeld = true; doKnife(); } }, () => { INP.knHeld = false; });
bindBtn('tJump', () => inGame() && doJump());
bindBtn('bcOk', () => confirmPlan()); bindBtn('bcNo', () => cancelPlan());
bindBtn('tNade', () => inGame() && act('nade'));
bindBtn('tMed', () => inGame() && act('med'));
bindBtn('tUse', () => { if (!inGame()) return; const me = W.p[ME]; if (nearBench(me) && !useTarget(me)) openCraft(); else if (INP.useLatch) INP.useLatch = null; else INP.useReq = true; });
bindBtn('tBuild', () => inGame() && toggleBuild());
bindBtn('vZin', () => camZoom(0.8)); bindBtn('vZout', () => camZoom(1.25));
bindBtn('vRl', () => camRot(-1)); bindBtn('vRr', () => camRot(1));
bindBtn('vUp', () => viewStep(1)); bindBtn('vDn', () => viewStep(-1)); bindBtn('vAuto', () => viewAuto());

/* ---------- per-frame: fold devices into the local player's input ---------- */
// touch auto-aim: best zombie in range and in sight; `any` = whole circle (fire button held), else a ~22° cone along the drag.
// Close zombies (< 2.5) win, and the current target is kept unless another is clearly better, so the aim doesn't flicker.
const zAlive = z => z && z.hp > 0 && W.zs.includes(z);
function touchAutoAim(me, dirx, diry, any, cur) {
  const [sx, sy, sz] = shoulder(me); let best = null, bs = 1e9, cs = 1e9;
  const wi = me.down ? 0 : me.wpn, range = WPN[wi].range, a0 = Math.atan2(diry, dirx), vl = viewL();
  for (const z of W.zs) {
    if (z.hp <= 0 || z.L > vl || lcHide(Math.floor(z.x), Math.floor(z.y), z.L)) continue;
    const dx = z.x - sx, dy = z.y - sy, d = Math.hypot(dx, dy); if (d > range || d < 0.2) continue;
    const da = Math.abs(angDiff(a0, Math.atan2(dy, dx))); if (!any && da > 0.38) continue;
    const score = (any ? d + da * 1.5 : d + da * 12) - (d < 2.5 ? 2.5 : 0);
    if ((score < bs || z === cur) && los(sx, sy, sz, z.x, z.y, z.z + z.h * 0.6, LEAN)) { if (z === cur) cs = score; if (score < bs) { bs = score; best = z; } }
  }
  if (cur && cs < 1e9 && cs <= bs * 1.35 + 0.6) best = cur;
  if (best) return { x: best.x, y: best.y, z: best.z + best.h * 0.6, zb: best };
  return { x: sx + dirx * 6, y: sy + diry * 6, z: sz };
}
// keep the aim point glued to a locked zombie between re-picks
function trackAim(me) { const z = me.aimPt && me.aimPt.zb; if (!z) return; if (!zAlive(z)) { INP.aimT = 0; return; } me.aimPt.x = z.x; me.aimPt.y = z.y; me.aimPt.z = z.z + z.h * 0.6; }
// desktop reticle: its circle is the weapon's real spread at that distance; red = on a zombie, yellow = headshot, dashed = out of range
function drawReticle(me, pt, show) {
  const el = $('reticle'); if (!el) return;
  document.body.classList.toggle('aiming', !!show); el.classList.toggle('hidden', !show); if (!show) return;
  const wi = me.down ? 0 : me.wpn, w = WPN[wi], [sx, sy, sz] = shoulder(me), dist = Math.hypot(pt.x - sx, pt.y - sy, pt.z - sz);
  const sp = w.spread * (me.down ? 1.6 : 1) * (1 + (w.bloom ? me.bloom || 0 : 0)), half = VH > VW ? clamp(CAM.zoom, 4, 22) * 1.25 : clamp(CAM.zoom, 4, 22);
  const px = clamp(2 * Math.tan(sp) * Math.min(dist, w.range) * VH / (2 * half), 12, 170);
  const c = el.children[0]; c.style.width = c.style.height = px + 'px';
  el.style.transform = `translate(${INP.mx}px,${INP.my}px)`;
  const rl = me.reloadT > 0 ? 1 - me.reloadT / WPN[me.reloadW != null ? me.reloadW : wi].reload : me.reloadVis > 0 ? 1 - me.reloadVis / w.reload : 0;
  el.children[1].style.display = rl > 0 ? '' : 'none'; el.children[1].style.setProperty('--p', (rl * 100).toFixed(0) + '%');
  const lock = !!pt.zb, head = lock && pt.head && !w.flame && !w.gl;
  el.classList.toggle('lock', lock && !head); el.classList.toggle('head', head); el.classList.toggle('far', Math.hypot(pt.x - sx, pt.y - sy) > w.range);
  $('rtTag').textContent = rl > 0 ? '换弹' : me.mag[wi] === 0 ? '没子弹 R' : head ? '爆头' : '';
}
function readInput(dt) {
  const me = W.p[ME], I = me.inp, blocked = panelOpen() || W.over || STATE.paused;
  const [fx, fy] = camFwd(), [rx, ry] = camRight();
  let sx = 0, sy = 0;
  if (!blocked) {
    sx = (KD('d') || KD('ArrowRight') ? 1 : 0) - (KD('a') || KD('ArrowLeft') ? 1 : 0);
    sy = (KD('w') || KD('ArrowUp') ? 1 : 0) - (KD('s') || KD('ArrowDown') ? 1 : 0);
    const mv = INP.move.id != null ? INP.move : null;
    const mm = mv ? Math.hypot(mv.x, mv.y) : 0;
    if (mm > 0.12) { const m = Math.min(1, (mm - 0.12) / 0.55), a = Math.atan2(-mv.y, mv.x); sx = Math.cos(a) * m; sy = Math.sin(a) * m; }
  }
  I.mx = rx * sx + fx * sy; I.my = ry * sx + fy * sy;
  // touch: snap to the grid axes when close, so walking along a wall or through a doorway stays straight
  if (INP.move.id != null && (I.mx || I.my)) {
    const m = Math.hypot(I.mx, I.my), a = Math.atan2(I.my, I.mx), q = Math.round(a / (Math.PI / 2)) * Math.PI / 2;
    if (Math.abs(a - q) < 0.2) { I.mx = Math.cos(q) * m; I.my = Math.sin(q) * m; }
  }
  // one tap starts a search / chop / revive and it carries on by itself; walking away or finishing ends it
  const ut = W.p[ME] && !blocked ? useTarget(W.p[ME]) : null, uk = ut ? ut.k + ':' + ut.i : '';
  if (INP.useReq) { INP.useLatch = uk || null; INP.useReq = false; }
  if (INP.useLatch && (INP.useLatch !== uk || Math.hypot(I.mx, I.my) > 0.3 || W.p[ME].down)) INP.useLatch = null;
  I.use = !blocked && (KD('f') || INP.useHeld || INP.useLatch) ? 1 : 0;
  const usingMouse = !INP.touch || (performance.now() - INP.mouseT < 1500 && performance.now() - INP.lastTouch > 1500);
  if (usingMouse) {
    if (INP.touch && performance.now() - INP.mouseT < 300) setTouch(false);
    const pt = DBG && DBG.aimAt ? DBG.aimAt() : aimPick(INP.mx, INP.my);
    me.aimPt = pt; me.aim = Math.atan2(pt.y - me.y, pt.x - me.x);
    drawReticle(me, pt, !blocked && !me.build && !me.dead);
    CAM.lookX = lerp(CAM.lookX || 0, clamp((pt.x - me.x) * 0.18, -3, 3), Math.min(1, dt * 3)); CAM.lookY = lerp(CAM.lookY || 0, clamp((pt.y - me.y) * 0.18, -3, 3), Math.min(1, dt * 3));
    I.fire = !blocked && INP.mL && !me.build ? 1 : 0;
    if (me.build && !blocked) {
      const down = INP.mL || INP.mR, demo = INP.mR || me.demo;
      if (down) paintBuild(INP.mx, INP.my, !INP.bDown, demo);
      else { if (INP.bDown) finishPaint(); const c = pickBuild(INP.mx, INP.my, me, me.demo); BUILD_HOVER = c; }
      INP.bDown = down;
    } else { BUILD_HOVER = null; INP.bDown = false; if (!me.build && (PLAN || PREV)) cancelPlan(); }
  } else {
    drawReticle(me, null, false);
    const A = INP.aim, held = A.id != null, active = held && Math.hypot(A.x, A.y) > 0.3;
    if (active) {
      const a = Math.atan2(-A.y, A.x), wx = rx * Math.cos(a) + fx * Math.sin(a), wy = ry * Math.cos(a) + fy * Math.sin(a);
      trackAim(me); INP.aimT -= dt; if (INP.aimT <= 0 || !me.aimPt) { INP.aimT = 0.1; me.aimPt = touchAutoAim(me, wx, wy, false, me.aimPt && me.aimPt.zb); }
      me.aim = Math.atan2(me.aimPt.y - me.y, me.aimPt.x - me.x);
    } else if (held && A.btn) {
      // just holding the fire button: lock on to the nearest zombie, otherwise shoot where you face
      trackAim(me); INP.aimT -= dt; if (INP.aimT <= 0 || !me.aimPt) { INP.aimT = 0.12; const f = Math.hypot(I.mx, I.my) > 0.2 ? [I.mx, I.my] : [Math.cos(me.aim), Math.sin(me.aim)]; me.aimPt = touchAutoAim(me, f[0], f[1], true, me.aimPt && me.aimPt.zb); }
      me.aim = Math.atan2(me.aimPt.y - me.y, me.aimPt.x - me.x);
    } else if (performance.now() - A.t > 600 && Math.hypot(I.mx, I.my) > 0.2) { me.aim = Math.atan2(I.my, I.mx); me.aimPt = null; }
    I.fire = !blocked && (active || (held && A.btn)) && !me.build ? 1 : 0;
    CAM.lookX = lerp(CAM.lookX || 0, Math.cos(me.aim) * 1.5, Math.min(1, dt * 2)); CAM.lookY = lerp(CAM.lookY || 0, Math.sin(me.aim) * 1.5, Math.min(1, dt * 2));
    if (!me.build || !BUILD_HOVER || !BUILD_HOVER.t) BUILD_HOVER = me.build ? BUILD_HOVER : null;
  }
  if (blocked) I.fire = 0;
  if (!blocked && (KD('v') || INP.knHeld)) doKnife(); // hold to keep slashing
  if (me.knT > 0 && zAlive(me.knZ)) me.aim = Math.atan2(me.knZ.y - me.y, me.knZ.x - me.x); // face what you're cutting
  INP.lockShow = !blocked && !me.build && !me.dead && me.aimPt && zAlive(me.aimPt.zb) && (usingMouse || I.fire) ? me.aimPt : null;
}
