/* ================= input: keyboard + mouse, touch sticks ================= */
const INP = { keys: {}, codes: {}, p2: { ePress: 0, eHeld: false, boost: 0, aimAng: -HP, runToggle: false }, mx: innerWidth / 2, my: innerHeight / 2, mouseT: -9, rdown: false, ePress: 0, eHeld: false, boost: 0, touch: { move: null, aim: null }, pad: [], lastTouch: 0, runToggle: false, touchAim: null, aimAng: -HP };
/* CSS screen point → floor point (the pixel view has no perspective: screen y grows with z) */
function groundAt(sx, sy) { const k = R3.DPR / R3.SC; return { x: (sx * k + R3.cam.x) / PX, z: (sy * k + R3.cam.y) / PX }; }
function initInput() {
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    INP.codes[e.code] = true;
    if (!INP.keys[k]) onKeyPress(k, e);
    INP.keys[k] = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) && STATE.mode === 'play') e.preventDefault();
  });
  addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; INP.keys[k] = false; INP.codes[e.code] = false; if (k === 'e') INP.eHeld = false; if (k === 'Enter' || k === 'l') INP.p2.eHeld = false; });
  addEventListener('blur', () => { INP.keys = {}; INP.codes = {}; INP.eHeld = false; INP.rdown = false; INP.p2.eHeld = false; });
  const ov = document.getElementById('ov');
  ov.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now(); } });
  ov.addEventListener('pointerdown', e => {
    audioInit(); if (e.pointerType !== 'mouse') return;
    INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now();
    if (STATE.mode !== 'play') return;
    if (STAGE.sc) { lineAdvance(); return; }
    if (e.button === 2 || (e.button === 0 && e.shiftKey)) { INP.boost++; }
    if (e.button === 0 && !e.shiftKey) { INP.ePress++; INP.eHeld = true; INP.mouseHold = true; }
    if (e.button === 1) { e.preventDefault(); requestPing(); }
  });
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0 && INP.mouseHold) { INP.mouseHold = false; if (!INP.keys.e) INP.eHeld = false; } });
  ov.addEventListener('contextmenu', e => e.preventDefault());
  initTouch();
  document.getElementById('stageBox').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); lineAdvance(); });
}
function onKeyPress(k, e) {
  if (STATE.mode === 'play') {
    if (STAGE.sc && ['e', 'Enter', ' ', 'Escape', 'l'].includes(k)) { stageKey(k); return; }
    if (UI.modal) { modalKey(k, e); return; }
    if (STATE.local) { if (k === 'Enter' || k === 'l') { INP.p2.ePress++; INP.p2.eHeld = true; return; } if (k === '/' || k === 'k') { INP.p2.boost++; return; } }
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
  btn('tAct', () => { if (STAGE.sc) { lineAdvance(); return; } INP.ePress++; INP.eHeld = true; }, () => { INP.eHeld = false; });
  btn('tAct2', () => { if (STAGE.sc) { lineAdvance(); return; } INP.p2.ePress++; INP.p2.eHeld = true; }, () => { INP.p2.eHeld = false; });
  btn('tRun2', () => { INP.p2.runToggle = !INP.p2.runToggle; document.getElementById('tRun2').classList.toggle('lit', INP.p2.runToggle); });
  btn('tBoost', () => { INP.boost++; });
  btn('tRun', () => { INP.runToggle = !INP.runToggle; document.getElementById('tRun').classList.toggle('lit', INP.runToggle); });
  btn('tPing', () => requestPing());
  btn('tChat', () => document.getElementById('quickPanel').classList.toggle('hidden'));
  btn('tGlyph', () => toggleGlyphs());
}
function showStick(kind, ox, oy, x, y) { const b = document.getElementById(kind === 'move' ? 'mvBase' : 'amBase'), k = document.getElementById(kind === 'move' ? 'mvKnob' : 'amKnob'); b.style.display = k.style.display = 'block'; b.style.left = ox + 'px'; b.style.top = oy + 'px'; const dx = x - ox, dy = y - oy, L = Math.hypot(dx, dy), m = 52, s = L > m ? m / L : 1; k.style.left = ox + dx * s + 'px'; k.style.top = oy + dy * s + 'px'; }
function hideStick(kind) { document.getElementById(kind === 'move' ? 'mvBase' : 'amBase').style.display = 'none'; document.getElementById(kind === 'move' ? 'mvKnob' : 'amKnob').style.display = 'none'; }
/* screen direction → world: the camera looks north (−z) from the south, so screen right = +x and screen down = +z */
function stickVec(T) { if (!T) return null; const dx = T.x - T.ox, dy = T.y - T.oy, L = Math.hypot(dx, dy); if (L <= 6) return [0, 0]; const k = Math.min(1, L / 48); return [dx / L * k, dy / L * k]; }
/* local co-op leash: nobody may walk off the shared screen */
function leash(p, mx, mz) {
  if (!STATE.local || !W) return [mx, mz];
  const o = W.p[1 - p.id], lx = R3.VW / PX - 2.4, lz = R3.VH / PX - 3.2, dx = p.x - o.x, dz = p.z - o.z;
  if (Math.abs(dx) > lx && Math.sign(mx) === Math.sign(dx)) mx = 0;
  if (Math.abs(dz) > lz && Math.sign(mz) === Math.sign(dz)) mz = 0;
  return [mx, mz];
}
function readInput(me) {
  if (STAGE.held || (typeof STAGE !== 'undefined' && STAGE.sc)) { const i = me.inp; i.mx = i.mz = 0; i.hold = false; return; }
  if (STATE.local) { readLocal(); return; }
  const inp = me.inp, K = INP.keys;
  let mx = (K.d || K.ArrowRight ? 1 : 0) - (K.a || K.ArrowLeft ? 1 : 0), mz = (K.s || K.ArrowDown ? 1 : 0) - (K.w || K.ArrowUp ? 1 : 0);
  const mv = stickVec(INP.touch.move); if (mv && (mv[0] || mv[1])) { mx = mv[0]; mz = mv[1]; }
  if (UI.modal) { mx = 0; mz = 0; }
  inp.mx = mx; inp.mz = mz;
  inp.run = !!(K.Shift || INP.runToggle);
  const usingMouse = performance.now() - INP.mouseT < 4000 && performance.now() - INP.lastTouch > 1500;
  const A = INP.touch.aim;
  if (A) { const dx = A.x - A.ox, dy = A.y - A.oy; if (Math.hypot(dx, dy) > 10) INP.aimAng = Math.atan2(dy, dx); }
  else if (usingMouse) { const s = toScreen(me.x, 0.9, me.z); if (Math.hypot(INP.mx - s.x, INP.my - s.y) > 6) INP.aimAng = Math.atan2(INP.my - s.y, INP.mx - s.x); }
  else if (Math.hypot(mx, mz) > 0.2) INP.aimAng = INP.aimAng + angDiff(INP.aimAng, Math.atan2(mz, mx)) * 0.25;
  inp.aim = INP.aimAng;
  const best = bestInteract(me, W); inp.act = best ? best.id : -1; UI.best = best;
  inp.hold = INP.eHeld; inp.press = INP.ePress; inp.boost = INP.boost;
}
/* one keyboard, two people: 阿岩 = WASD (+ mouse to aim) · E · F/Space · left Shift;  小雾 = arrows · Enter/L · right Shift
   one tablet: left stick + left buttons = 阿岩, right stick + right buttons = 小雾 */
function readLocal() {
  const K = INP.keys, C = INP.codes, A = W.p[0], S = W.p[1];
  let ax = (K.d ? 1 : 0) - (K.a ? 1 : 0), az = (K.s ? 1 : 0) - (K.w ? 1 : 0);
  let sx = (K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0), sz = (K.ArrowDown ? 1 : 0) - (K.ArrowUp ? 1 : 0);
  const m1 = stickVec(INP.touch.move), m2 = stickVec(INP.touch.aim);
  if (m1 && (m1[0] || m1[1])) { ax = m1[0]; az = m1[1]; } if (m2 && (m2[0] || m2[1])) { sx = m2[0]; sz = m2[1]; }
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  pads.forEach((gp, i) => { if (i > 1) return; const x = gp.axes[0] || 0, y = gp.axes[1] || 0, on = Math.hypot(x, y) > 0.2, b = gp.buttons; const st = INP.pad[i] || (INP.pad[i] = {}); const P = i === 0 ? INP : INP.p2; if (on) { if (i === 0) { ax = x; az = y; } else { sx = x; sz = y; } } const a = b[0] && b[0].pressed, f = (b[2] && b[2].pressed) || (b[5] && b[5].pressed); if (a && !st.a) { if (STAGE.sc) lineAdvance(); else { P.ePress++; } } P.eHeld = a || (i === 0 ? INP.keys.e : INP.keys.Enter) || false; if (f && !st.f) P.boost++; st.a = a; st.f = f; st.run = b[1] && b[1].pressed; });
  if (UI.modal) { ax = az = sx = sz = 0; }
  [ax, az] = leash(A, ax, az); [sx, sz] = leash(S, sx, sz);
  A.inp.mx = ax; A.inp.mz = az; S.inp.mx = sx; S.inp.mz = sz;
  A.inp.run = !!(C.ShiftLeft || INP.runToggle || (INP.pad[0] && INP.pad[0].run)); S.inp.run = !!(C.ShiftRight || INP.p2.runToggle || (INP.pad[1] && INP.pad[1].run));
  const usingMouse = performance.now() - INP.mouseT < 4000 && performance.now() - INP.lastTouch > 1500;
  if (usingMouse) { const s = toScreen(A.x, 0.9, A.z); if (Math.hypot(INP.mx - s.x, INP.my - s.y) > 6) INP.aimAng = Math.atan2(INP.my - s.y, INP.mx - s.x); }
  else if (Math.hypot(ax, az) > 0.2) INP.aimAng = INP.aimAng + angDiff(INP.aimAng, Math.atan2(az, ax)) * 0.3;
  if (Math.hypot(sx, sz) > 0.2) INP.p2.aimAng = INP.p2.aimAng + angDiff(INP.p2.aimAng, Math.atan2(sz, sx)) * 0.3;
  A.inp.aim = INP.aimAng; S.inp.aim = INP.p2.aimAng;
  const b1 = bestInteract(A, W), b2 = bestInteract(S, W); A.inp.act = b1 ? b1.id : -1; S.inp.act = b2 ? b2.id : -1; UI.best = b1; UI.best2 = b2;
  A.inp.hold = INP.eHeld; A.inp.press = INP.ePress; A.inp.boost = INP.boost;
  S.inp.hold = INP.p2.eHeld; S.inp.press = INP.p2.ePress; S.inp.boost = INP.p2.boost;
}
