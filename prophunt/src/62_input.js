/* ================= input: keyboard, mouse, touch joystick ================= */
const KEY = {};
const PTR = { mx: -1, my: -1, mouseT: 0, joy: null, taps: {} };
const menuOpen = () => !$('menu').classList.contains('hidden') || !$('help').classList.contains('hidden');
function canWalk() {
  if (!isPlay() || G.mode !== 'rt' || G.phase === 'end' || menuOpen()) return false;
  return amHider() ? (G.phase === 'hide' || G.phase === 'seek') : G.phase === 'seek';
}
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') { if (e.key === 'Enter' && e.target.id === 'codeIn') $('joinBtn').click(); return; }
  audioInit();
  const k = e.key.toLowerCase(); KEY[k] = 1;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'm') { setSound(!AU.on); return; }
  if (k === 'escape') { if (!$('help').classList.contains('hidden')) { $('help').classList.add('hidden'); return; } if (isPlay()) { menuOpen() ? closeMenu() : openMenu(); } return; }
  if (!isPlay() || menuOpen() || e.repeat) return;
  if (k === 'e' || k === ' ' || k === 'enter') primary();
  else if (k === 'q') revert();
  else if (k === 'r') rotateKey();
  else if (k === 't') taunt();
});
addEventListener('keyup', e => { KEY[e.key.toLowerCase()] = 0; });
addEventListener('blur', () => { for (const k in KEY) KEY[k] = 0; });

cv.addEventListener('pointerdown', e => {
  audioInit(); if (!isPlay() || menuOpen()) return;
  if (e.pointerType !== 'mouse' && canWalk() && !PTR.joy && e.clientX < W * .5 && e.clientY > H * .3) {
    PTR.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY }; joyShow(); return;
  }
  PTR.taps[e.pointerId] = { x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY };
  if (e.pointerType === 'mouse') { PTR.mx = e.clientX; PTR.my = e.clientY; PTR.mouseT = performance.now(); }
});
addEventListener('pointermove', e => {
  if (PTR.joy && e.pointerId === PTR.joy.id) { PTR.joy.x = e.clientX; PTR.joy.y = e.clientY; joyShow(); return; }
  const t = PTR.taps[e.pointerId];
  if (t && isPlay() && G.mode === 'turn') { dragPan(t, e.clientX, e.clientY); t.cx = e.clientX; t.cy = e.clientY; }
  if (e.pointerType === 'mouse') { PTR.mx = e.clientX; PTR.my = e.clientY; PTR.mouseT = performance.now(); }
});
const endPtr = e => {
  if (PTR.joy && e.pointerId === PTR.joy.id) { PTR.joy = null; $('joy').classList.add('hidden'); return; }
  const t = PTR.taps[e.pointerId]; delete PTR.taps[e.pointerId]; if (Object.keys(PTR.taps).length < 2) PTR.pinch = 0;
  if (t && !t.drag && e.type === 'pointerup' && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 14 && isPlay() && !menuOpen()) tapAt(e.clientX, e.clientY, e.pointerType);
};
addEventListener('pointerup', endPtr); addEventListener('pointercancel', endPtr);
cv.addEventListener('wheel', e => {
  if (!isPlay()) return; e.preventDefault(); const f = e.deltaY > 0 ? .9 : 1.1;
  if (G.mode === 'turn') { const [ax, ay] = unP(e.clientX, e.clientY); STATE.tz = clamp(STATE.tz * f, 1, 3.2); if (STATE.tz === 1) STATE.tpan = [0, 0]; else { STATE.tpan[0] += (ax - CAM.x) * (1 - 1 / f); STATE.tpan[1] += (ay - CAM.y) * (1 - 1 / f); clampPan(); } return; }
  CAM.zoom = clamp(CAM.zoom * f, .6, 1.7); LS.set('zoom', CAM.zoom);
}, { passive: false });
function clampPan() { const m = 9 * (1 - 1 / STATE.tz) + 1; STATE.tpan[0] = clamp(STATE.tpan[0], -m, m); STATE.tpan[1] = clamp(STATE.tpan[1], -m, m); }
function dragPan(t, x, y) {   // turn mode: one finger / mouse drags the view, two fingers pinch
  const ids = Object.keys(PTR.taps);
  if (ids.length >= 2) {
    const [a, b] = ids.map(k => PTR.taps[k]), d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
    if (PTR.pinch) { STATE.tz = clamp(STATE.tz * d / PTR.pinch, 1, 3.2); if (STATE.tz === 1) STATE.tpan = [0, 0]; }
    PTR.pinch = d; a.drag = b.drag = true; return;
  }
  if (!t.drag && Math.hypot(x - t.x, y - t.y) < 14) return;
  t.drag = true; if (STATE.tz <= 1.001) return;
  const [ax, ay] = unP(t.cx, t.cy), [bx, by] = unP(x, y);
  STATE.tpan[0] -= bx - ax; STATE.tpan[1] -= by - ay; CAM.x -= bx - ax; CAM.y -= by - ay; clampPan();
}
cv.addEventListener('contextmenu', e => e.preventDefault());
function joyShow() {
  const j = PTR.joy, el = $('joy'), dx = j.x - j.x0, dy = j.y - j.y0, L = Math.hypot(dx, dy), m = Math.min(L, 50), k = L ? m / L : 0;
  el.classList.remove('hidden'); el.style.left = (j.x0 - 60) + 'px'; el.style.top = (j.y0 - 60) + 'px';
  $('joyKnob').style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)';
}
function moveInput() {
  let mx = (KEY.d || KEY.arrowright ? 1 : 0) - (KEY.a || KEY.arrowleft ? 1 : 0), my = (KEY.s || KEY.arrowdown ? 1 : 0) - (KEY.w || KEY.arrowup ? 1 : 0);
  if (PTR.joy) { const dx = PTR.joy.x - PTR.joy.x0, dy = PTR.joy.y - PTR.joy.y0, L = Math.hypot(dx, dy); if (L > 8) { const s = Math.min(1, L / 50); mx = dx / L * s; my = dy / L * s; } }
  const L = Math.hypot(mx, my); if (L > 1) { mx /= L; my /= L; }
  return [mx, my];
}

/* ---------- what the player is pointing at ---------- */
function validTarget(o) {
  if (!o) return false;
  if (amHider()) return o.kind === 'item';
  if (o.kind === 'pl') return o.i === G.hider;
  return true;
}
function targetFp(o) { if (o.kind === 'item') return o.it.fp; const p = G.pl[o.i]; return plBox(p, p.x, p.y); }
function inReach(o) { const p = G.pl[ME]; return distFp(p.x, p.y, targetFp(o)) <= (amHider() ? BAL.copyReach : BAL.reach); }
function computeFocus() {
  STATE.focus = null; if (!isPlay() || G.phase === 'end' || menuOpen()) return;
  const mouseRecent = performance.now() - PTR.mouseT < 4000 && PTR.mx >= 0;
  if (G.mode === 'turn') {
    if (STATE.sel) { STATE.focus = { ...STATE.sel, ok: true }; return; }
    if (mouseRecent) { const o = pickAt(PTR.mx, PTR.my); if (o && (o.kind === 'item' || (o.i === G.hider && !amHider()))) STATE.focus = { ...o, ok: false }; }
    return;
  }
  if (!amHider() && G.phase !== 'seek') return;
  let c = null;
  if (mouseRecent) { const o = pickAt(PTR.mx, PTR.my); if (validTarget(o)) c = o; }
  if (!c) {   // nearest in reach, biased to where I face
    const p = G.pl[ME], fx = -Math.sin(p.d), fy = Math.cos(p.d); let bs = 1e9;
    for (const d of DRAWN) {
      if (d.kind === 'wall') continue; const o = d.kind === 'pl' ? { kind: 'pl', i: d.i } : { kind: 'item', it: d.it };
      if (!validTarget(o) || (o.kind === 'pl' && o.i === ME)) continue;
      const f = targetFp(o), dist = distFp(p.x, p.y, f); if (dist > (amHider() ? BAL.copyReach : BAL.reach)) continue;
      const cx = (f[0] + f[2]) / 2 - p.x, cy = (f[1] + f[3]) / 2 - p.y, L = Math.hypot(cx, cy) || 1, sc = dist - .7 * (cx * fx + cy * fy) / L;
      if (sc < bs) { bs = sc; c = o; }
    }
  }
  if (c) { c.ok = inReach(c); STATE.focus = c; }
}

/* ---------- actions ---------- */
function primary() {
  if (!isPlay() || G.phase === 'end') return;
  if (G.mode === 'turn') { turnConfirm(); return; }
  const f = STATE.focus;
  if (!f) { if (!amHider() && G.phase === 'seek') toast('附近没有能敲的东西', 'warn'); return; }
  useTarget(f);
}
function useTarget(o) {
  if (!validTarget(o)) return;
  if (!inReach(o)) { toast(amHider() ? '太远了，走近一点才能变' : '太远了，走近一点', 'warn'); return; }
  if (amHider()) {
    if (G.phase !== 'hide' && G.phase !== 'seek') return;
    const e = tryDisguise(ME, o.it); if (e) { toast(e, 'bad'); sfx('err'); return; }
    sfx('poof'); const p = G.pl[ME]; pop(p.x, p.y, 1, '变成了' + T[o.it.k].n, '#7dff9a'); renderActs();
  } else {
    if (G.phase !== 'seek') return;
    if (STATE.kcd > 0) return; STATE.kcd = BAL.knockCD;
    act('knock', { id: o.kind === 'pl' ? -1 : o.it.id });
  }
}
function revert() { if (!isPlay() || !amHider() || G.mode !== 'rt' || G.phase === 'end') return; const p = G.pl[ME]; if (!p.dg) return; p.dg = null; sfx('unpoof'); renderActs(); }
function rotateKey() {
  if (!isPlay() || !amHider() || G.phase === 'end') return;
  if (G.mode === 'turn') { turnRotate(); return; }
  const e = rotateDisguise(ME); if (e) { toast(e, 'warn'); sfx('err'); } else sfx('rot');
}
function taunt() { if (!isPlay() || !amHider() || G.mode !== 'rt' || G.phase !== 'seek') return; if (G.tauntCD > 0) { toast('嘲讽冷却中', 'warn'); return; } act('taunt'); }
function tapAt(sx, sy, ptype) {
  const o = pickAt(sx, sy);
  if (G.mode === 'turn') { turnTap(sx, sy, o); return; }
  if (o && validTarget(o) && !(o.kind === 'pl' && o.i === ME)) { STATE.focus = { ...o, ok: inReach(o) }; useTarget(o); }
}

/* ---------- turn mode ---------- */
function turnTap(sx, sy, o) {
  if (G.phase === 'end') return;
  if (!amHider()) {
    if (G.phase !== 'seek') return;
    if (!o || !(o.kind === 'item' || o.i === G.hider)) { STATE.sel = null; turnPanel(); return; }
    const same = STATE.sel && STATE.sel.kind === o.kind && (o.kind === 'pl' || STATE.sel.it === o.it);
    if (same) { turnConfirm(); return; }
    STATE.sel = o; sfx('click'); turnPanel(); return;
  }
  const p = G.pl[ME];
  if (G.phase === 'place') {
    if (o && o.kind === 'item') { STATE.form = { k: o.it.k, v: o.it.v }; STATE.ghostR = o.it.r; sfx('click'); if (STATE.pend) setPend(STATE.pend.x, STATE.pend.y); turnPanel(); return; }
    if (!STATE.form) { toast('先点一件家具，选好要变成什么', 'warn'); return; }
    const [x, y] = unP(sx, sy); setPend(x, y); return;
  }
  if (G.phase === 'hturn') {
    if (o && o.kind === 'item') {
      if (distFp(p.x, p.y, o.it.fp) > BAL.turnMove) { toast('只能变成虚线圈里的东西', 'warn'); return; }
      const sp = findFit(ME, { k: o.it.k, v: o.it.v, r: o.it.r }, p.x, p.y);
      STATE.pend = sp ? { x: sp[0], y: sp[1], k: o.it.k, v: o.it.v, r: o.it.r } : { x: p.x, y: p.y, k: o.it.k, v: o.it.v, r: o.it.r };
      STATE.ghostR = o.it.r; validatePend(); sfx('click'); return;
    }
    const [x, y] = unP(sx, sy);
    STATE.pend = { x: Math.round(x * 20) / 20, y: Math.round(y * 20) / 20, k: p.dg.k, v: p.dg.v, r: STATE.ghostR }; validatePend(); sfx('click');
  }
}
function setPend(x, y) { STATE.pend = { x: Math.round(x * 20) / 20, y: Math.round(y * 20) / 20, k: STATE.form.k, v: STATE.form.v, r: STATE.ghostR }; validatePend(); sfx('click'); }
function validatePend() {
  const q = STATE.pend; if (!q) { STATE.ghost = null; turnPanel(); return; }
  q.err = checkPlace(ME, q, G.phase === 'place' ? 'place' : 'tmove') || null;
  STATE.ghost = { ...q, ok: !q.err }; turnPanel();
}
function turnRotate() {
  STATE.ghostR = (STATE.ghostR + 1) & 3; sfx('rot');
  if (STATE.pend) { STATE.pend.r = STATE.ghostR; validatePend(); }
  else if (G.phase === 'hturn') { const p = G.pl[ME]; STATE.pend = { x: p.x, y: p.y, k: p.dg.k, v: p.dg.v, r: STATE.ghostR }; validatePend(); }
}
function turnConfirm() {
  if (G.phase === 'end') return;
  if (!amHider()) { if (G.phase !== 'seek' || !STATE.sel) return; const s = STATE.sel; STATE.sel = null; act('knock', { id: s.kind === 'pl' ? -1 : s.it.id }); turnPanel(); return; }
  const q = STATE.pend; if (!q) { toast(G.phase === 'place' ? '先选家具再点地板放下' : '没有改动：要不动就点「不动」', 'warn'); return; }
  if (q.err) { toast(q.err, 'bad'); sfx('err'); return; }
  act(G.phase === 'place' ? 'place' : 'tmove', { x: q.x, y: q.y, k: q.k, v: q.v, r: q.r });
}
function turnPass() { if (isPlay() && amHider() && G.phase === 'hturn') act('tpass'); }
