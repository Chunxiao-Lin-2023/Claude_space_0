/* ================= input: keyboard + mouse (MMO camera), touch sticks & buttons ================= */
const INP = { keys: {}, jump: false, jumpHeld: false, intHeld: false, walk: false, drag: null, touchMove: null, touchCam: null, pinch: null, lastClick: 0 };
const KEYMAP = { attack: ['j'], s1: ['1'], s2: ['2'], s3: ['3'], s4: ['4'], s5: ['5'], dodge: ['Shift'], jump: [' '], int: ['f'], bag: ['b'], skills: ['k'], quests: ['l'], map: ['m'], char: ['c'], tab: ['Tab'], walk: ['v'] };
function inputMove() {
  if (INP.touchMove) return [-INP.touchMove.x, -INP.touchMove.y];
  const k = INP.keys; let x = 0, z = 0; if (k.w || k.ArrowUp) z += 1; if (k.s || k.ArrowDown) z -= 1; if (k.a || k.ArrowLeft) x += 1; if (k.d || k.ArrowRight) x -= 1; return [x, z];
}
function pickEnt(sx, sy) {
  const K = k(); let best = null, bd = 1e9;
  for (const e of W.ents) { if (!e.root || !e.vis || !e.root.visible || e === W.P[W.me] || e.type === 'prop' && !e.interact && !e.name) continue;
    const [ex, ey] = w2s(e.x, e.z, e.y - groundH(e.x, e.z)), hh = Math.max(0.6, e.h) * K, hw = Math.max(e.r * 1.4, e.h * 0.32, 0.45) * K;
    if (sx > ex - hw && sx < ex + hw && sy > ey - hh - 6 && sy < ey + 8) { const d = Math.abs(sx - ex) + Math.abs(sy - (ey - hh / 2)) * 0.5 - e.z * 0.01; if (d < bd) { bd = d; best = e; } } }
  return best;
}
function clickWorld(sx, sy, hold) {
  const me = W.P[W.me]; if (!me || W.cine || DLG.open || UI.modal) return;
  const hit = hold ? null : pickEnt(sx, sy);
  if (hit) { setTarget(hit); INP.moveTo = null;
    if (isFoe(me, hit)) { INP.chase = hit; return; }
    if (edist(me, hit) < (hit.ir || BAL.interactR) + hit.r + 0.4) doInteract(me, hit); else INP.moveTo = { x: hit.x, z: hit.z, ent: hit, stop: (hit.ir || BAL.interactR) + hit.r - 0.4 };
    return; }
  const [wx, wz] = s2w(sx, sy); INP.chase = null; INP.moveTo = { x: wx, z: wz }; if (!hold) clickMark(wx, wz);
}
function clickMark(x, z) { fxDraw(0.5, { x, z, layer: 0, draw: (g, f, kk) => { const [sx, sy] = w2s(x, z); g.strokeStyle = `rgba(255,236,170,${1 - kk})`; g.lineWidth = 2; g.beginPath(); g.ellipse(sx, sy, 14 * (1 - kk * 0.5), 6 * (1 - kk * 0.5), 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(sx, sy, 5, 2, 0, 0, TAU); g.stroke(); } }); }
function initInput() {
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!INP.keys[k]) onKeyPress(k, e);
    INP.keys[k] = true;
    if ([' ', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && STATE.mode === 'play') e.preventDefault();
  });
  addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; INP.keys[k] = false; if (k === ' ') INP.jumpHeld = false; if (k === 'f') INP.intHeld = false; });
  addEventListener('blur', () => { INP.keys = {}; INP.intHeld = false; INP.drag = null; });
  const cv = document.getElementById('gl');
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    audioInit(); if (e.pointerType !== 'mouse') return; if (STATE.mode !== 'play') return;
    INP.drag = { x: e.clientX, y: e.clientY, b: e.button, t: performance.now() }; cv.setPointerCapture(e.pointerId);
    clickWorld(e.clientX, e.clientY, false);
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return; const [wx, wz] = s2w(e.clientX, e.clientY); INP.aimW = [wx, wz, W.t]; INP.mouse = [e.clientX, e.clientY];
    const D = INP.drag; if (D && performance.now() - D.t > 180 && !INP.chase && INP.moveTo && !INP.moveTo.ent) INP.moveTo = { x: wx, z: wz };
  });
  cv.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') return; INP.drag = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); CAM.zoomT = clamp(CAM.zoomT * (1 - Math.sign(e.deltaY) * 0.1), 0.6, 1.5); }, { passive: false });
  initTouch();
}
function rotateCam() { }
function onKeyPress(k, e) {
  if (STATE.mode !== 'play') { if (STATE.mode === 'title' && (k === 'Enter' || k === ' ')) titleConfirm(); return; }
  if (UI.chatOpen) return;
  if (k === 'Escape' && W.cine && STORY.running) { skipCine(); return; }
  if (k === 'Escape') { if (DLG.open) return; if (UI.modal) { closeModal(); return; } if (UI.target) { setTarget(null); return; } togglePause(); return; }
  if (UI.choice) { if (k >= '1' && k <= '9') UI.choice(+k - 1); return; }
  if (DLG.open) { if (k === ' ' || k === 'f' || k === 'Enter' || k === 'j') { advanceOrSend(); } return; }
  if (UI.modal) { if (k === 'b' && UI.modal === 'bag' || k === 'k' && UI.modal === 'skills' || k === 'l' && UI.modal === 'quests' || k === 'm' && UI.modal === 'map' || k === 'c' && UI.modal === 'char') closeModal(); return; }
  if (W.cine) { if (k === ' ' || k === 'Enter') skipCine(); return; }
  if (k === ' ') { INP.jump = true; INP.jumpHeld = true; }
  else if (k === 'j') heroAction('attack');
  else if (k >= '1' && k <= '5') heroAction('s' + k);
  else if (k === 'Shift') heroAction('dodge');
  else if (k === 'f') { INP.intHeld = true; const me = W.P[W.me]; if (me) doInteract(me, findInteract(me)); }
  else if (k === 'Tab') cycleTarget();
  else if (k === 'b') openModal('bag'); else if (k === 'k') openModal('skills'); else if (k === 'l') openModal('quests'); else if (k === 'm') openModal('map'); else if (k === 'c') openModal('char');
  else if (k === 'v') INP.walk = !INP.walk;
    else if (k === 'Enter' || k === 't') openChat();
  else if (k === 'r') { const me = W.P[W.me]; if (me && hasItem('yaosan')) useItem('yaosan'); else if (hasItem('milk')) useItem('milk'); else if (hasItem('meat')) useItem('meat'); else if (hasItem('berry')) useItem('berry'); }
  else if (k === 'p') togglePause();
  else if (k === 'n') setMute(!AU.muted);
}
function advanceOrSend() { if (NETROLE === 'guest') netSendCtl({ t: 'adv' }); else advanceDlg(); }
function heroAction(a) {
  const me = W.P[W.me]; if (!me || !me.alive || W.cine || DLG.open || UI.modal) return;
  const bar = me.type === 'player' ? P1_BAR : partnerBar();
  const tgt = UI.target && UI.target.alive && UI.target.team === 1 ? UI.target : autoTarget(me);
  if (a === 'attack') castSkill(me, bar[0], tgt);
  else if (a === 'dodge') { const mv = inputMove(); const dir = Math.hypot(mv[0], mv[1]) > 0.1 ? Math.atan2(mv[0], mv[1]) + CAM.yaw : me.rot; castSkill(me, 'dodge', null, dir); }
  else { const i = +a.slice(1); const id = bar[i]; if (id) { castSkill(me, id, tgt); } }
  hudDirty();
}
function autoTarget(me) { // soft lock: nearest foe roughly in front of the camera within 12 m
  let best = null, bs = 1e9; for (const t of W.ents) { if (!isFoe(me, t)) continue; const d = edist(me, t); if (d > 14) continue; const a = Math.abs(angDiff(me.rot, Math.atan2(t.x - me.x, t.z - me.z))) * 0.5; const s = d * (1 + a * 1.5); if (a < 1.4 && s < bs) { bs = s; best = t; } } if (best && !UI.target) setTarget(best, true); return best;
}
function cycleTarget() { const me = W.P[W.me]; if (!me) return; const foes = W.ents.filter(t => isFoe(me, t) && edist(me, t) < 30).sort((a, b) => edist(me, a) - edist(me, b)); if (!foes.length) { setTarget(null); return; } const i = foes.indexOf(UI.target); setTarget(foes[(i + 1) % foes.length]); }
/* ---------- touch ---------- */
function initTouch() {
  const cv = document.getElementById('gl'), stick = document.getElementById('stick'), knob = document.getElementById('knob');
  const tp = new Map();
  cv.addEventListener('touchstart', e => { audioInit(); e.preventDefault(); for (const t of e.changedTouches) { const left = t.clientX < R3.W * 0.36; if (left && !INP.touchMove) { INP.touchMove = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: 0, y: 0 }; stick.style.display = 'block'; stick.style.left = (t.clientX - 60) + 'px'; stick.style.top = (t.clientY - 60) + 'px'; knob.style.transform = 'translate(0px,0px)'; } else { tp.set(t.identifier, { x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY, t: performance.now() }); } }
    if (tp.size === 2) { const [a, b] = [...tp.values()]; INP.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: CAM.zoomT }; } }, { passive: false });
  cv.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) { if (INP.touchMove && t.identifier === INP.touchMove.id) { const M = INP.touchMove; let dx = t.clientX - M.x0, dy = t.clientY - M.y0; const L = Math.hypot(dx, dy), R = 55; if (L > R) { dx *= R / L; dy *= R / L; } M.x = dx / R; M.y = dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`; } else if (tp.has(t.identifier)) { const P = tp.get(t.identifier); const dx = t.clientX - P.x, dy = t.clientY - P.y; P.x = t.clientX; P.y = t.clientY;  } }
    if (tp.size === 2 && INP.pinch) { const [a, b] = [...tp.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); CAM.zoomT = clamp(INP.pinch.zoom * d / Math.max(20, INP.pinch.d), 0.6, 1.5); } }, { passive: false });
  const end = e => { for (const t of e.changedTouches) { if (INP.touchMove && t.identifier === INP.touchMove.id) { INP.touchMove = null; stick.style.display = 'none'; } else if (tp.has(t.identifier)) { const P = tp.get(t.identifier); if (Math.hypot(P.x - P.sx, P.y - P.sy) < 10 && performance.now() - P.t < 300) { if (DLG.open) advanceOrSend(); else clickWorld(P.x, P.y, false); } tp.delete(t.identifier); } } if (tp.size < 2) INP.pinch = null; };
  cv.addEventListener('touchend', end); cv.addEventListener('touchcancel', end);
}
