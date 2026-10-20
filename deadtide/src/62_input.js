/* ================= input: keyboard + mouse, touch sticks & buttons, camera controls ================= */
const INP = { keys: {}, mx: 0, my: 0, mL: false, mR: false, mouseT: 0, touch: false, lastTouch: 0,
  move: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, aim: { id: null, ox: 0, oy: 0, x: 0, y: 0, a: 0, t: 0 }, useHeld: false, bldT: 0, bldLast: '', paint: null, aimT: 0 };
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
  act('mode', on ? 1 : 0); uiBuildBar(); sfx('click');
}
function selBlock(id) { const me = W.p[ME]; me.sel = id; me.demo = false; uiBuildBar(); sfx('click'); }
function rotStairs() { const me = W.p[ME]; me.sdir = (me.sdir + 1) & 3; uiBuildBar(); sfx('click'); }
function cycleWpn(d) { const me = W.p[ME]; let w = me.wpn; for (let k = 0; k < 4; k++) { w = (w + d + 4) % 4; if (me.owned[w]) break; } if (w !== me.wpn) act('wpn', w); }
// camera controls (shared by keys and the HUD buttons)
function camRot(d) { CAM.rot = (CAM.rot + d + 4) % 4; sfx('click'); }
function camZoom(f) { CAM.zoom = clamp(CAM.zoom * f, 4, 22); SET.zoom = CAM.zoom; saveSet(); }
function viewStep(d) { if (!W) return; const me = W.p[ME]; if (VIEW.auto) { VIEW.auto = false; VIEW.L = Math.min(viewL(), topBuiltL()); } VIEW.L = clamp(VIEW.L + d, 0, ML - 2); uiView(); sfx('click'); }
function topBuiltL() { let t = 0; for (let i = 0; i < NC; i++) if ((W.slab[i] && B[W.slab[i]].cost) || (W.blk[i] && B[W.blk[i]].cost)) t = Math.max(t, cl_(i)); return Math.min(ML - 2, t + 1); }
function viewAuto() { VIEW.auto = true; uiView(); sfx('click'); }
// default stairs direction: up the screen
function screenUpDir() { const [fx, fy] = camFwd(); let best = 0, bd = -2; DIRS.forEach(([dx, dy], k) => { const d = dx * fx + dy * fy; if (d > bd) { bd = d; best = k; } }); return best; }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  audioInit();
  if (k === 'Escape') { if (STATE.mode === 'play') togglePause(); e.preventDefault(); return; }
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
  } else { const n = '1234'.indexOf(k); if (n >= 0) return act('wpn', n); if (k === 'r') return act('reload'); }
  if (k === 'v') return act('shove');
  if (k === 'g') return act('nade');
  if (k === 'h') return act('med');
  if (k === 'n') return toggleReady();
  if (k === 'c') return openCraft();
  if (k === 'f') { if (nearBench(me) && !useTarget(me)) return openCraft(); }
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
  el.classList.remove('hidden'); el.style.left = s.ox + 'px'; el.style.top = s.oy + 'px';
  const k = el.firstElementChild, m = Math.hypot(s.x, s.y), f = m > 1 ? 1 / m : 1;
  k.style.transform = `translate(${s.x * f * R}px,${s.y * f * R}px)`;
}
const STICK_R = () => Math.min(64, Math.max(44, Math.min(VW, VH) * 0.09));
CV.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  audioInit(); e.preventDefault();
  if (!inGame()) return;
  const me = W.p[ME];
  if (e.clientX < VW * 0.45 && INP.move.id == null) { Object.assign(INP.move, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0, t0: performance.now(), far: false }); stickDraw(stickL, INP.move, STICK_R()); }
  else if (me.build) { INP.paint = e.pointerId; INP.bldLast = ''; touchBuild(e.clientX, e.clientY); }
  else if (INP.aim.id == null) { Object.assign(INP.aim, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 }); stickDraw(stickR, INP.aim, STICK_R()); }
  try { CV.setPointerCapture(e.pointerId); } catch (_) { }
}, { passive: false });
CV.addEventListener('pointermove', e => {
  if (e.pointerType !== 'touch') return; e.preventDefault();
  const R = STICK_R();
  for (const s of [INP.move, INP.aim]) if (s.id === e.pointerId) { s.x = (e.clientX - s.ox) / R; s.y = (e.clientY - s.oy) / R; if (Math.hypot(e.clientX - s.ox, e.clientY - s.oy) > 14) s.far = true; stickDraw(s === INP.move ? stickL : stickR, s, R); }
  if (INP.aim.id === e.pointerId && Math.hypot(INP.aim.x, INP.aim.y) > 0.25) INP.aim.t = performance.now();
  if (INP.paint === e.pointerId && inGame() && W.p[ME].build) touchBuild(e.clientX, e.clientY);
}, { passive: false });
function endPtr(e) {
  if (e.pointerType !== 'touch') return;
  if (INP.paint === e.pointerId) INP.paint = null;
  if (INP.move.id === e.pointerId && !INP.move.far && performance.now() - INP.move.t0 < 350 && inGame() && W.p[ME].build) touchBuild(INP.move.ox, INP.move.oy);
  if (INP.move.id === e.pointerId) { INP.move.id = null; INP.move.x = INP.move.y = 0; stickDraw(stickL, INP.move); }
  if (INP.aim.id === e.pointerId) { INP.aim.id = null; INP.aim.x = INP.aim.y = 0; INP.aim.t = performance.now(); stickDraw(stickR, INP.aim); }
}
CV.addEventListener('pointerup', endPtr); CV.addEventListener('pointercancel', endPtr);
function touchBuild(sx, sy) {
  const me = W.p[ME], c = buildPick(sx, sy, buildL()); if (!c) return;
  const key = c.x + ',' + c.y + ',' + c.L; if (INP.bldLast === key) return; INP.bldLast = key;
  BUILD_HOVER = Object.assign(c, { ok: true, t: 1 });
  buildAt(me, c.x, c.y, c.L, me.demo);
}
function buildWhy(me, x, y, L) {
  const i = inMap(x, y) && L >= 0 && L < ML ? ci(x, y, L) : -1;
  const cur = i < 0 ? 0 : B[me.sel].slab ? W.slab[i] : W.blk[i];
  if (cur && B[cur].cost) return ''; // repair
  return canPlace(x, y, L, me.sel, me.sdir) || (!inReach(me, x, y, L) ? '太远了' : '') || (!affordable(W.res, B[me.sel].cost) ? '材料不足' : '');
}
function buildAt(me, x, y, L, demo) {
  if (!inMap(x, y) || L < 0 || L >= ML) return;
  if (demo) { const i = ci(x, y, L); if ((W.blk[i] && B[W.blk[i]].cost) || (W.slab[i] && B[W.slab[i]].cost)) act('demo', { x, y, l: L }); return; }
  const why = buildWhy(me, x, y, L);
  if (why) { if (thr('denyL', 0.3)) { toast(why, '#ff8a7a'); sfx('deny'); } return; }
  act('build', { x, y, l: L, b: me.sel, d: me.sdir });
}
function bindBtn(id, down, up) {
  const el = document.getElementById(id); if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); el.classList.add('on'); down && down(); try { el.setPointerCapture(e.pointerId); } catch (_) { } });
  const end = () => { el.classList.remove('on'); up && up(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
bindBtn('tReload', () => inGame() && (W.p[ME].build ? rotStairs() : act('reload')));
bindBtn('tSwap', () => inGame() && cycleWpn(1));
bindBtn('tShove', () => inGame() && act('shove'));
bindBtn('tNade', () => inGame() && act('nade'));
bindBtn('tMed', () => inGame() && act('med'));
bindBtn('tUse', () => { if (!inGame()) return; const me = W.p[ME]; if (nearBench(me) && !useTarget(me)) openCraft(); INP.useHeld = true; }, () => { INP.useHeld = false; });
bindBtn('tBuild', () => inGame() && toggleBuild());
bindBtn('vZin', () => camZoom(0.8)); bindBtn('vZout', () => camZoom(1.25));
bindBtn('vRl', () => camRot(-1)); bindBtn('vRr', () => camRot(1));
bindBtn('vUp', () => viewStep(1)); bindBtn('vDn', () => viewStep(-1)); bindBtn('vAuto', () => viewAuto());

/* ---------- per-frame: fold devices into the local player's input ---------- */
function touchAutoAim(me, dirx, diry) {
  const [sx, sy, sz] = shoulder(me); let best = null, bs = 1e9;
  const wi = me.down ? 0 : me.wpn, range = WPN[wi].range, a0 = Math.atan2(diry, dirx);
  for (const z of W.zs) {
    if (z.L > viewL()) continue;
    const dx = z.x - sx, dy = z.y - sy, d = Math.hypot(dx, dy); if (d > range || d < 0.2) continue;
    const da = Math.abs(angDiff(a0, Math.atan2(dy, dx))); if (da > 0.38) continue;
    const score = d + da * 12; if (score < bs && los(sx, sy, sz, z.x, z.y, z.z + z.h * 0.6)) { bs = score; best = z; }
  }
  if (best) return { x: best.x, y: best.y, z: best.z + best.h * 0.6 };
  return { x: sx + dirx * 6, y: sy + diry * 6, z: sz };
}
function readInput(dt) {
  const me = W.p[ME], I = me.inp, blocked = panelOpen() || W.over || STATE.paused;
  const [fx, fy] = camFwd(), [rx, ry] = camRight();
  let sx = 0, sy = 0;
  if (!blocked) {
    sx = (KD('d') || KD('ArrowRight') ? 1 : 0) - (KD('a') || KD('ArrowLeft') ? 1 : 0);
    sy = (KD('w') || KD('ArrowUp') ? 1 : 0) - (KD('s') || KD('ArrowDown') ? 1 : 0);
    const mv = INP.move.id != null ? INP.move : null;
    if (mv && Math.hypot(mv.x, mv.y) > 0.18) { const m = Math.min(1, Math.hypot(mv.x, mv.y)); const a = Math.atan2(-mv.y, mv.x); sx = Math.cos(a) * m; sy = Math.sin(a) * m; }
  }
  I.mx = rx * sx + fx * sy; I.my = ry * sx + fy * sy;
  I.use = !blocked && (KD('f') || INP.useHeld) ? 1 : 0;
  const usingMouse = !INP.touch || (performance.now() - INP.mouseT < 1500 && performance.now() - INP.lastTouch > 1500);
  if (usingMouse) {
    if (INP.touch && performance.now() - INP.mouseT < 300) setTouch(false);
    const pt = aimPick(INP.mx, INP.my);
    me.aimPt = pt; me.aim = Math.atan2(pt.y - me.y, pt.x - me.x);
    CAM.lookX = lerp(CAM.lookX || 0, clamp((pt.x - me.x) * 0.18, -3, 3), Math.min(1, dt * 3)); CAM.lookY = lerp(CAM.lookY || 0, clamp((pt.y - me.y) * 0.18, -3, 3), Math.min(1, dt * 3));
    I.fire = !blocked && INP.mL && !me.build ? 1 : 0;
    if (me.build && !blocked) {
      const c = buildPick(INP.mx, INP.my, buildL());
      if (c) {
        const why = INP.mR || me.demo ? '' : buildWhy(me, c.x, c.y, c.L);
        BUILD_HOVER = Object.assign(c, { ok: !why, why });
        INP.bldT -= dt; const key = c.x + ',' + c.y + ',' + c.L;
        if ((INP.mL || INP.mR) && INP.bldT <= 0 && INP.bldLast !== key) { INP.bldT = 0.08; INP.bldLast = key; buildAt(me, c.x, c.y, c.L, INP.mR || me.demo); }
      } else BUILD_HOVER = null;
    } else BUILD_HOVER = null;
  } else {
    const A = INP.aim, active = A.id != null && Math.hypot(A.x, A.y) > 0.3;
    if (active) {
      const a = Math.atan2(-A.y, A.x), wx = rx * Math.cos(a) + fx * Math.sin(a), wy = ry * Math.cos(a) + fy * Math.sin(a);
      INP.aimT -= dt; if (INP.aimT <= 0 || !me.aimPt) { INP.aimT = 0.1; me.aimPt = touchAutoAim(me, wx, wy); }
      me.aim = Math.atan2(me.aimPt.y - me.y, me.aimPt.x - me.x);
    } else if (performance.now() - A.t > 600 && Math.hypot(I.mx, I.my) > 0.2) { me.aim = Math.atan2(I.my, I.mx); me.aimPt = null; }
    I.fire = !blocked && active && !me.build ? 1 : 0;
    CAM.lookX = lerp(CAM.lookX || 0, Math.cos(me.aim) * 1.5, Math.min(1, dt * 2)); CAM.lookY = lerp(CAM.lookY || 0, Math.sin(me.aim) * 1.5, Math.min(1, dt * 2));
    if (!me.build || !BUILD_HOVER || !BUILD_HOVER.t) BUILD_HOVER = me.build ? BUILD_HOVER : null;
  }
  if (blocked) I.fire = 0;
}
