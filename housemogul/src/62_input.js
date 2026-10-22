/* ================= input: pan / zoom / pick, keyboard ================= */
const PTR = new Map();
let pinch0 = null, drag = null;
function zoomAt(sx, sy, nz) {
  nz = clamp(nz, 0.32, 2.6); const [wx, wy] = s2w(sx, sy);
  CAM.z = nz; CAM.tz = null; CAM.tx = CAM.ty = null;
  CAM.x = wx - (sx - VW / 2) / nz; CAM.y = wy - (sy - VH / 2) / nz;
}
cv.addEventListener('pointerdown', e => {
  audioInit();
  cv.setPointerCapture(e.pointerId); PTR.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (PTR.size === 1) drag = { x: e.clientX, y: e.clientY, cx: CAM.x, cy: CAM.y, moved: 0 };
  else if (PTR.size === 2) { const [a, b] = [...PTR.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: CAM.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; if (drag) drag.moved = 99; }
});
cv.addEventListener('pointermove', e => {
  if (!PTR.has(e.pointerId)) {
    if (e.pointerType === 'mouse' && STATE.mode === 'play') { const h = pickAt(e.clientX, e.clientY); if (h !== STATE.hover) { STATE.hover = h; cv.style.cursor = h >= 0 ? 'pointer' : ''; } }
    return;
  }
  PTR.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (PTR.size === 2 && pinch0) {
    const [a, b] = [...PTR.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    zoomAt(pinch0.mx, pinch0.my, pinch0.z * d / Math.max(20, pinch0.d)); return;
  }
  if (drag && PTR.size === 1) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved > 6) { cv.classList.add('drag'); CAM.tx = CAM.ty = null; CAM.x = drag.cx - dx / CAM.z; CAM.y = drag.cy - dy / CAM.z; }
  }
});
function ptrUp(e) {
  if (!PTR.has(e.pointerId)) return;
  PTR.delete(e.pointerId); cv.classList.remove('drag');
  if (PTR.size < 2) pinch0 = null;
  if (drag && PTR.size === 0) {
    if (drag.moved <= 6 && STATE.mode === 'play') { const id = pickAt(e.clientX, e.clientY); selectProp(id, false); }
    drag = null;
  }
}
cv.addEventListener('pointerup', ptrUp); cv.addEventListener('pointercancel', ptrUp);
cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, CAM.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => { if (e.target === cv) e.preventDefault(); });

const KEYS = {};
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') { if (e.key === 'Enter' && e.target.id === 'codeIn') $('joinBtn').click(); return; }
  audioInit();
  const k = e.key.toLowerCase(); KEYS[k] = true;
  if (STATE.mode !== 'play') { if (k === 'escape') { if (!$('help').classList.contains('hidden')) closeHelp(); } return; }
  if (k === 'escape') { if (!$('confirm').classList.contains('hidden')) closeConfirm(); else if (!$('menuScr').classList.contains('hidden')) closeMenu(); else if (!$('help').classList.contains('hidden')) closeHelp(); else if (STATE.sel >= 0) selectProp(-1); else openMenu(); e.preventDefault(); return; }
  if (!$('menuScr').classList.contains('hidden') || !$('confirm').classList.contains('hidden') || !$('help').classList.contains('hidden')) return;
  if (k === 'enter') { e.preventDefault(); endTurnClick(); }
  else if (k === 'm') setSound(!AU.on);
  else if (k === '=' || k === '+') zoomAt(VW / 2, VH / 2, CAM.z * 1.2);
  else if (k === '-' || k === '_') zoomAt(VW / 2, VH / 2, CAM.z / 1.2);
  else if (k === 'f') { fitCam(); }
  else if (k === '1') setTab('mkt'); else if (k === '2') setTab('list'); else if (k === '3') setTab('mine'); else if (k === '4') setTab('news');
});
addEventListener('keyup', e => { KEYS[e.key.toLowerCase()] = false; });
function keyPan(dt) {
  if (STATE.mode !== 'play' && STATE.mode !== 'end') return;
  const s = 520 * dt / CAM.z; let dx = 0, dy = 0;
  if (KEYS.arrowleft || KEYS.a) dx -= s; if (KEYS.arrowright || KEYS.d) dx += s; if (KEYS.arrowup || KEYS.w) dy -= s; if (KEYS.arrowdown || KEYS.s) dy += s;
  if (dx || dy) { CAM.tx = CAM.ty = null; CAM.x += dx; CAM.y += dy; }
}
