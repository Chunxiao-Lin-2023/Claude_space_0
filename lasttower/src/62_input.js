/* ================= input: keyboard + mouse, touch sticks & buttons ================= */
const INP = { keys: {}, mx: VW / 2, my: VH / 2, mL: false, mR: false, mouseT: 0, touch: false, lastTouch: 0,
  move: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, aim: { id: null, ox: 0, oy: 0, x: 0, y: 0, a: 0, t: 0 }, useHeld: false, jumpEdge: false, upPrev: false, bldT: 0, bldLast: '' };
const KD = k => !!INP.keys[k];
const inGame = () => STATE.mode === 'play' && W && !W.over;
const panelOpen = () => !document.getElementById('craft').classList.contains('hidden') || !document.getElementById('pause').classList.contains('hidden') || !document.getElementById('help').classList.contains('hidden');
function act(a, v) {
  const me = W && W.p[ME]; if (!me) return;
  if (a === 'wpn' && (me.down || !me.owned[v])) return;
  if (NETROLE === 'guest') {
    netSendCtl({ t: 'act', a, v });
    if (a === 'wpn') { me.wpn = v; me.wpnLock = performance.now() + 700; }
    if (a === 'mode') me.build = !!v;
    if (a === 'reload' && W.p[ME].mag[me.wpn] < WPN[me.wpn].mag) { sfx('reload'); me.reloadVis = WPN[me.wpn].reload; }
    if (a === 'wpn') sfx('swap');
  } else doAct(me, a, v);
}
function toggleBuild(v) {
  const me = W.p[ME]; if (me.down || me.dead) return;
  const on = v == null ? !me.build : v; me.build = on; if (!on) me.demo = false;
  act('mode', on ? 1 : 0); uiBuildBar(); sfx('click');
}
function selBlock(id) { const me = W.p[ME]; me.sel = id; me.demo = false; uiBuildBar(); sfx('click'); }
function cycleWpn(d) { const me = W.p[ME]; let w = me.wpn; for (let k = 0; k < 4; k++) { w = (w + d + 4) % 4; if (me.owned[w]) break; } if (w !== me.wpn) act('wpn', w); }
function useMed() { act('med'); }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  audioInit();
  if (k === 'Escape') { if (STATE.mode === 'play') togglePause(); e.preventDefault(); return; }
  if (!INP.keys[k]) onKeyPress(k, e);
  INP.keys[k] = true;
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; INP.keys[k] = false; });
addEventListener('blur', () => { INP.keys = {}; INP.mL = INP.mR = false; });
function onKeyPress(k) {
  if (k === 'm') { setMute(!SET.mute); uiMute(); return; }
  if (STATE.mode !== 'play' || !W) { if (k === 'Enter' && STATE.mode === 'title') document.getElementById('soloBtn').click(); return; }
  if (k === 'z') { SET.zoom = SET.zoom === 2 ? 1 : 2; saveSet(); return; }
  if (k === 'h' && !document.getElementById('help').classList.contains('hidden')) { closeHelp(); return; }
  if (panelOpen()) { if (k === 'e' || k === 'c') closeCraft(); return; }
  if (W.over) return;
  const me = W.p[ME];
  if (k === 'b') return toggleBuild();
  if (me.build) {
    const n = '1234567890'.indexOf(k); if (n >= 0 && PAL[n]) return selBlock(PAL[n]);
    if (k === 'x') { me.demo = !me.demo; uiBuildBar(); return; }
  } else {
    const n = '1234'.indexOf(k); if (n >= 0) return act('wpn', n);
  }
  if (k === 'q') return cycleWpn(1);
  if (k === 'r') return act('reload');
  if (k === 'f') return act('shove');
  if (k === 'g') return act('nade');
  if (k === 'h') return useMed();
  if (k === 'n') return toggleReady();
  if (k === 'c') return openCraft();
  if (k === 'e') { if (nearBench(me) && !useTarget(me)) return openCraft(); }
  if (k === ' ') INP.jumpEdge = true;
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
CV.addEventListener('wheel', e => {
  if (!inGame()) return; e.preventDefault();
  const me = W.p[ME], d = e.deltaY > 0 ? 1 : -1;
  if (me.build) { const n = PAL.indexOf(me.sel); selBlock(PAL[(n + d + PAL.length) % PAL.length]); }
  else cycleWpn(d);
}, { passive: false });

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
  audioInit(); setTouch(true); INP.lastTouch = performance.now(); e.preventDefault();
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
  if (INP.paint === e.pointerId && inGame() && W.p[ME].build) touchBuild(e.clientX, e.clientY);
  if (INP.aim.id === e.pointerId && Math.hypot(INP.aim.x, INP.aim.y) > 0.25) { INP.aim.a = Math.atan2(INP.aim.y, INP.aim.x); INP.aim.t = performance.now(); }
}, { passive: false });
function endPtr(e) {
  if (e.pointerType !== 'touch') return;
  if (INP.paint === e.pointerId) INP.paint = null;
  if (INP.move.id === e.pointerId && !INP.move.far && performance.now() - INP.move.t0 < 350 && inGame() && W.p[ME].build) touchBuild(INP.move.ox, INP.move.oy); // a quick tap on the left half builds too
  if (INP.move.id === e.pointerId) { INP.move.id = null; INP.move.x = INP.move.y = 0; stickDraw(stickL, INP.move); }
  if (INP.aim.id === e.pointerId) { INP.aim.id = null; INP.aim.x = INP.aim.y = 0; INP.aim.t = performance.now(); stickDraw(stickR, INP.aim); }
}
CV.addEventListener('pointerup', endPtr); CV.addEventListener('pointercancel', endPtr);
function touchBuild(sx, sy) {
  const me = W.p[ME], [wx, wy] = s2w(sx, sy), tx = Math.floor(wx / T), ty = Math.floor(wy / T), key = tx + ',' + ty;
  if (INP.bldLast === key) return; INP.bldLast = key;
  BUILD_HOVER = { tx, ty, ok: true, t: 1 };
  buildAt(me, tx, ty, me.demo);
}
function buildAt(me, tx, ty, demo) {
  if (ty < 0 || ty >= MH || tx < 0 || tx >= MW) return;
  if (demo) { const t = tileAt(tx, ty); if (t && t !== DIRT) act('demo', { x: tx, y: ty }); return; }
  const t = tileAt(tx, ty);
  if (!t) {
    const why = canPlace(tx, ty, me.sel) || (!inReach(me, tx, ty) ? '太远了' : '') || (!affordable(W.res, TF[me.sel].cost) ? '材料不足' : '');
    if (why) { if (thr('denyL', 0.3)) { toast(why, '#ff8a7a'); sfx('deny'); } return; }
  }
  act('build', { x: tx, y: ty, b: me.sel });
}
// on-screen buttons (hold-aware)
function bindBtn(id, down, up) {
  const el = document.getElementById(id); if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); if (e.pointerType === 'touch') { setTouch(true); INP.lastTouch = performance.now(); } el.classList.add('on'); down && down(); try { el.setPointerCapture(e.pointerId); } catch (_) { } });
  const end = e => { el.classList.remove('on'); up && up(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
bindBtn('tJump', () => { INP.jumpEdge = true; INP.tJump = true; }, () => { INP.tJump = false; });
bindBtn('tReload', () => inGame() && act('reload'));
bindBtn('tSwap', () => inGame() && cycleWpn(1));
bindBtn('tShove', () => inGame() && act('shove'));
bindBtn('tNade', () => inGame() && act('nade'));
bindBtn('tMed', () => inGame() && useMed());
bindBtn('tUse', () => { if (!inGame()) return; const me = W.p[ME]; if (nearBench(me) && !useTarget(me)) openCraft(); INP.useHeld = true; }, () => { INP.useHeld = false; });
bindBtn('tBuild', () => inGame() && toggleBuild());

/* ---------- per-frame: fold devices into the local player's input ---------- */
function readInput(dt) {
  const me = W.p[ME], I = me.inp, blocked = panelOpen() || W.over || STATE.paused;
  const mv = INP.move.id != null ? INP.move : null;
  const onLad = ladderAt(me) >= 0;
  I.l = !blocked && (KD('a') || KD('ArrowLeft') || (mv && mv.x < -0.3)) ? 1 : 0;
  I.r = !blocked && (KD('d') || KD('ArrowRight') || (mv && mv.x > 0.3)) ? 1 : 0;
  const upNow = !blocked && (KD('w') || KD('ArrowUp') || (mv && mv.y < -0.55) || (INP.tJump && onLad));
  I.up = upNow ? 1 : 0;
  I.dn = !blocked && (KD('s') || KD('ArrowDown') || (mv && mv.y > 0.55)) ? 1 : 0;
  if (!blocked && ((INP.jumpEdge) || (upNow && !INP.upPrev && !onLad && !me.climbing))) I.jumpP = true;
  INP.jumpEdge = false; INP.upPrev = upNow;
  I.use = !blocked && (KD('e') || INP.useHeld) ? 1 : 0;
  // aim
  const [, , sx, sy] = muzzle(me);
  const usingMouse = !INP.touch || performance.now() - INP.mouseT < 1500 && performance.now() - INP.lastTouch > 1500;
  if (usingMouse) {
    if (INP.touch && performance.now() - INP.mouseT < 300) setTouch(false);
    const [wx, wy] = s2w(INP.mx, INP.my); me.aim = Math.atan2(wy - sy, wx - sx);
    CAM.lookX = lerp(CAM.lookX, clamp((wx - me.x) * 0.22, -4 * T, 4 * T), Math.min(1, dt * 4)); CAM.lookY = lerp(CAM.lookY, clamp((wy - me.y) * 0.15, -3 * T, 2 * T), Math.min(1, dt * 4));
    I.fire = !blocked && INP.mL && !me.build ? 1 : 0;
    if (me.build && !blocked) {
      const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
      const t = tileAt(tx, ty), why = t ? '' : (canPlace(tx, ty, me.sel) || (!inReach(me, tx, ty) ? '太远了' : '') || (!affordable(W.res, TF[me.sel].cost) ? '材料不足' : ''));
      BUILD_HOVER = { tx, ty, ok: !why, why };
      INP.bldT -= dt;
      const key = tx + ',' + ty;
      if ((INP.mL || INP.mR) && INP.bldT <= 0 && INP.bldLast !== key) { INP.bldT = 0.08; INP.bldLast = key; buildAt(me, tx, ty, INP.mR || me.demo); }
    } else BUILD_HOVER = null;
  } else {
    const A = INP.aim, active = A.id != null && Math.hypot(A.x, A.y) > 0.3;
    if (active) me.aim = A.a;
    else if (performance.now() - A.t > 700) { if (I.r) me.aim = 0; else if (I.l) me.aim = Math.PI; }
    I.fire = !blocked && active && !me.build ? 1 : 0;
    CAM.lookX = lerp(CAM.lookX, Math.cos(me.aim) * 2.5 * T, Math.min(1, dt * 2)); CAM.lookY = lerp(CAM.lookY, 0, Math.min(1, dt * 2));
    if (!BUILD_HOVER || !BUILD_HOVER.t || !me.build) BUILD_HOVER = null;
  }
  if (blocked) { I.fire = 0; }
}
