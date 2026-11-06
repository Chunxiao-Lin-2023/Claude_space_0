/* ================= main loop ================= */
let lastT = performance.now();
function localControl(dt) {
  const me = G.pl[ME];
  if (!canWalk()) { me.mv = 0; return; }
  const [mx, my] = moveInput(), L = Math.hypot(mx, my);
  if (L < .05) { me.mv = 0; return; }
  const dx = mx * CY + my * SY, dy = -mx * SY + my * CY;
  const spd = amHider() ? (me.dg ? BAL.spdProp : BAL.spdHide) : BAL.spdSeek;
  const ox = me.x, oy = me.y;
  movePl(ME, dx * spd * dt, dy * spd * dt);
  if (!me.dg) me.d = Math.atan2(-dx, dy);
  me.mv = Math.hypot(me.x - ox, me.y - oy) > .001 ? 1 : 0;
}
// the seeker hears the hider move (footsteps when human, scraping when disguised)
function hearHider(dt) {
  if (G.mode !== 'rt' || G.phase !== 'seek' || amHider()) return;
  const h = G.pl[G.hider], s = G.pl[ME];
  if (!h.mv) return;
  if ((STATE.stepT = (STATE.stepT || 0) - dt) > 0) return;
  STATE.stepT = h.dg ? .45 : .32;
  const d = Math.hypot(h.x - s.x, h.y - s.y); if (d > 9) return;
  const [, p] = spatial(h.x, h.y); sfx(h.dg ? 'scrape' : 'step', 1 - d / 9, p);
}
function placeHoverGhost() {
  if (G.mode !== 'turn' || !amHider() || STATE.pend) return;
  if (G.phase !== 'place' || !STATE.form || TOUCH || performance.now() - PTR.mouseT > 4000) { STATE.ghost = null; return; }
  const [x, y] = unP(PTR.mx, PTR.my), q = { x: Math.round(x * 20) / 20, y: Math.round(y * 20) / 20, k: STATE.form.k, v: STATE.form.v, r: STATE.ghostR };
  STATE.ghost = { ...q, ok: !checkPlace(ME, q, 'place') };
}
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; STATE.t += dt;
  STATE.kcd = Math.max(0, (STATE.kcd || 0) - dt);
  try {
    if (isPlay()) {
      if (NETROLE === 'solo' || NETROLE === 'host') simTick(dt);
      if (STATE.lastPhase !== G.phase) { STATE.lastPhase = G.phase; onPhase(); }
      localControl(dt); hearHider(dt); placeHoverGhost();
    }
    if (NETROLE === 'host') hostNetTick(dt); else if (NETROLE === 'guest') guestNetTick(dt);
    camStep(dt); render(dt); computeFocus(); hudTick(dt);
  } catch (e) { console.error(e); if (window.__dbg) throw e; }
  requestAnimationFrame(frame);
}
