/* ================= input: keyboard + mouse, touch sticks ================= */
const INP = { keys: {}, mx: innerWidth / 2, my: innerHeight / 2, mouseT: -9, rdown: false, ePress: 0, eHeld: false, boost: 0, touch: { move: null, aim: null }, lastTouch: 0, runToggle: false, touchAim: null, aimAng: -HP };
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.0), hitP = new THREE.Vector3();
function groundAt(sx, sy) { ndc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, R3.cam); return ray.ray.intersectPlane(gplane, hitP) ? { x: hitP.x, z: hitP.z } : null; }
function initInput() {
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!INP.keys[k]) onKeyPress(k, e);
    INP.keys[k] = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) && STATE.mode === 'play') e.preventDefault();
  });
  addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; INP.keys[k] = false; if (k === 'e') INP.eHeld = false; });
  addEventListener('blur', () => { INP.keys = {}; INP.eHeld = false; INP.rdown = false; });
  const ov = document.getElementById('ov');
  ov.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now(); } });
  ov.addEventListener('pointerdown', e => {
    audioInit(); if (e.pointerType !== 'mouse') return;
    INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now();
    if (STATE.mode !== 'play') return;
    if (e.button === 2 || (e.button === 0 && e.shiftKey)) { INP.boost++; }
    if (e.button === 0 && !e.shiftKey) { INP.ePress++; INP.eHeld = true; INP.mouseHold = true; }
    if (e.button === 1) { e.preventDefault(); requestPing(); }
  });
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0 && INP.mouseHold) { INP.mouseHold = false; if (!INP.keys.e) INP.eHeld = false; } });
  ov.addEventListener('contextmenu', e => e.preventDefault());
  initTouch();
}
function onKeyPress(k, e) {
  if (STATE.mode === 'play') {
    if (UI.modal) { modalKey(k, e); return; }
    if (k === 'e') { INP.ePress++; INP.eHeld = true; }
    if (k === 'f' || k === ' ') INP.boost++;
    if (k === 'q') requestPing();
    if (k === 'c') INP.runToggle = !INP.runToggle;
    if ('1234'.includes(k)) requestQuick(QUICK[+k - 1].k);
    if (k === 'j' || k === 'Tab') toggleJournal();
    if (k === 'g') toggleGlyphs();
    if (k === 'Escape' || k === 'p') togglePause();
    if (k === 'm') setMute(!AU.muted);
  } else if (STATE.mode === 'result') { if (k === 'Enter') document.getElementById('rAgain').click(); }
  else if (k === 'm') setMute(!AU.muted);
}
/* --- touch: floating move stick (left half), aim stick (right), action buttons --- */
function initTouch() {
  const zone = document.getElementById('touchMove'), aimZ = document.getElementById('touchAim');
  const stick = (el, kind) => {
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; e.preventDefault(); audioInit(); INP.lastTouch = performance.now(); INP.touch[kind] = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY }; try { el.setPointerCapture(e.pointerId); } catch (_) { } showStick(kind, e.clientX, e.clientY, e.clientX, e.clientY); });
    el.addEventListener('pointermove', e => { const T = INP.touch[kind]; if (!T || T.id !== e.pointerId) return; T.x = e.clientX; T.y = e.clientY; showStick(kind, T.ox, T.oy, T.x, T.y); });
    const end = e => { const T = INP.touch[kind]; if (!T || T.id !== e.pointerId) return; INP.touch[kind] = null; hideStick(kind); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  };
  stick(zone, 'move'); stick(aimZ, 'aim');
  const btn = (id, down, up) => { const b = document.getElementById(id); b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); INP.lastTouch = performance.now(); b.classList.add('on'); down(e); try { b.setPointerCapture(e.pointerId); } catch (_) { } }); const u = e => { b.classList.remove('on'); if (up) up(e); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); };
  btn('tAct', () => { INP.ePress++; INP.eHeld = true; }, () => { INP.eHeld = false; });
  btn('tBoost', () => { INP.boost++; });
  btn('tRun', () => { INP.runToggle = !INP.runToggle; document.getElementById('tRun').classList.toggle('lit', INP.runToggle); });
  btn('tPing', () => requestPing());
  btn('tChat', () => document.getElementById('quickPanel').classList.toggle('hidden'));
  btn('tGlyph', () => toggleGlyphs());
}
function showStick(kind, ox, oy, x, y) { const b = document.getElementById(kind === 'move' ? 'mvBase' : 'amBase'), k = document.getElementById(kind === 'move' ? 'mvKnob' : 'amKnob'); b.style.display = k.style.display = 'block'; b.style.left = ox + 'px'; b.style.top = oy + 'px'; const dx = x - ox, dy = y - oy, L = Math.hypot(dx, dy), m = 52, s = L > m ? m / L : 1; k.style.left = ox + dx * s + 'px'; k.style.top = oy + dy * s + 'px'; }
function hideStick(kind) { document.getElementById(kind === 'move' ? 'mvBase' : 'amBase').style.display = 'none'; document.getElementById(kind === 'move' ? 'mvKnob' : 'amKnob').style.display = 'none'; }
/* screen direction → world: the camera looks north (−z) from the south, so screen right = +x and screen down = +z */
function readInput(me) {
  const inp = me.inp, K = INP.keys;
  let mx = (K.d || K.ArrowRight ? 1 : 0) - (K.a || K.ArrowLeft ? 1 : 0), mz = (K.s || K.ArrowDown ? 1 : 0) - (K.w || K.ArrowUp ? 1 : 0);
  const T = INP.touch.move;
  if (T) { const dx = T.x - T.ox, dy = T.y - T.oy, L = Math.hypot(dx, dy); if (L > 6) { const k = Math.min(1, L / 48); mx = dx / L * k; mz = dy / L * k; } }
  if (UI.modal) { mx = 0; mz = 0; }
  inp.mx = mx; inp.mz = mz;
  inp.run = !!(K.Shift || INP.runToggle);
  const usingMouse = performance.now() - INP.mouseT < 4000 && performance.now() - INP.lastTouch > 1500;
  const A = INP.touch.aim;
  if (A) { const dx = A.x - A.ox, dy = A.y - A.oy; if (Math.hypot(dx, dy) > 10) INP.aimAng = Math.atan2(dy * 1.3, dx); }
  else if (usingMouse) { const gp = groundAt(INP.mx, INP.my); if (gp && dist(gp.x, gp.z, me.x, me.z) > 0.25) INP.aimAng = Math.atan2(gp.z - me.z, gp.x - me.x); }
  else if (Math.hypot(mx, mz) > 0.2) INP.aimAng = INP.aimAng + angDiff(INP.aimAng, Math.atan2(mz, mx)) * 0.25;
  inp.aim = INP.aimAng;
  const best = bestInteract(me, W); inp.act = best ? best.id : -1; UI.best = best;
  inp.hold = INP.eHeld; inp.press = INP.ePress; inp.boost = INP.boost;
}
