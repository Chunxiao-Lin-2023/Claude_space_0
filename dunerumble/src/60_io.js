/* ================= synthesized audio ================= */
const AU = { ctx: null, master: null, noise: null, muted: LS.get('mute', false), last: {} };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6; comp.connect(C.destination);
    const m = C.createGain(); m.gain.value = AU.muted ? 0 : 0.55; m.connect(comp);
    const nb = C.createBuffer(1, C.sampleRate, C.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    Object.assign(AU, { ctx: C, master: m, noise: nb });
  } catch (e) { }
}
function setMute(v) { AU.muted = v; LS.set('mute', v); if (AU.master) AU.master.gain.value = v ? 0 : 0.55; const b = document.getElementById('muteBtn'); if (b) b.textContent = v ? '🔇' : '🔊'; }
function tone(type, f0, f1, dur, vol, delay = 0, lp = 0) {
  const C = AU.ctx; if (!C || AU.muted) return; const t = C.currentTime + delay, j = 1 + (Math.random() - .5) * 0.16;
  const o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.setValueAtTime(f0 * j, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * j), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o; if (lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
  n.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, ft = 'lowpass', f0 = 2000, f1 = 400, Q = 1, delay = 0) {
  const C = AU.ctx; if (!C || AU.muted) return; const t = C.currentTime + delay;
  const s = C.createBufferSource(); s.buffer = AU.noise; s.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = C.createBiquadFilter(); f.type = ft; f.Q.value = Q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  const g = C.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function sfx(name, x, z, vol = 1) {
  if (!AU.ctx || AU.muted) return;
  const now = performance.now(); if (AU.last[name] && now - AU.last[name] < 35) return; AU.last[name] = now;
  if (x != null) { const d = dist(x, z, R3.camT.x, R3.camT.z); vol *= clamp(1.15 - d / 16, 0, 1); if (vol < 0.04) return; }
  const v = vol;
  switch (name) {
    case 'anvil': noise(0.22, 0.55 * v, 'lowpass', 3000, 300); tone('square', 150, 50, 0.12, 0.18 * v, 0, 900); break;
    case 'anvilS': noise(0.4, 0.8 * v, 'lowpass', 2500, 120); tone('sawtooth', 120, 35, 0.35, 0.3 * v, 0, 700); break;
    case 'vixen': tone('triangle', 980, 260, 0.14, 0.3 * v); noise(0.05, 0.2 * v, 'highpass', 3000, 6000); break;
    case 'vixenS': for (let i = 0; i < 3; i++) tone('triangle', 1200, 300, 0.16, 0.25 * v, i * 0.03); break;
    case 'magma': noise(0.32, 0.35 * v, 'bandpass', 1400, 500, 0.8); break;
    case 'magmaS': noise(0.5, 0.6 * v, 'lowpass', 1200, 150); tone('sawtooth', 90, 45, 0.45, 0.25 * v, 0, 500); break;
    case 'boomcat': tone('sine', 260, 760, 0.16, 0.28 * v); noise(0.12, 0.1 * v, 'bandpass', 800, 2400, 2); break;
    case 'boomcatS': tone('sine', 180, 620, 0.3, 0.35 * v); break;
    case 'kite': noise(0.05, 0.3 * v, 'highpass', 1800, 4000); tone('square', 520, 180, 0.05, 0.12 * v, 0, 2400); break;
    case 'kiteS': for (let i = 0; i < 5; i++) noise(0.05, 0.25 * v, 'highpass', 2000, 4000, 1, i * 0.05); break;
    case 'sprocket': tone('sawtooth', 300, 1300, 0.13, 0.17 * v, 0, 2600); tone('sine', 1500, 600, 0.12, 0.12 * v); break;
    case 'spore': tone('sine', 300, 650, 0.14, 0.22 * v); noise(0.1, 0.12 * v, 'bandpass', 900, 1800, 2); break;
    case 'sporeS': case 'sporeHit': noise(0.3, 0.2 * v, 'bandpass', 600, 300, 2); tone('sine', 520, 380, 0.25, 0.12 * v); break;
    case 'frost': tone('triangle', 600, 300, 0.12, 0.2 * v); noise(0.08, 0.12 * v, 'highpass', 3000, 5000); break;
    case 'frostS': noise(0.6, 0.35 * v, 'highpass', 2500, 800); tone('sine', 1400, 900, 0.4, 0.08 * v); break;
    case 'quill': noise(0.08, 0.35 * v, 'bandpass', 3000, 1200, 1.5); break;
    case 'quillS': tone('sine', 200, 600, 0.25, 0.25 * v); break;
    case 'wisp': tone('sine', 700, 900, 0.18, 0.15 * v); tone('sine', 1050, 1350, 0.18, 0.08 * v, 0.03); break;
    case 'wispS': tone('sine', 900, 300, 0.4, 0.15 * v); noise(0.4, 0.1 * v, 'bandpass', 2000, 600, 3); break;
    case 'bruin': noise(0.22, 0.5 * v, 'lowpass', 900, 120); tone('sine', 120, 50, 0.2, 0.3 * v); break;
    case 'bruinS': noise(0.55, 0.75 * v, 'lowpass', 700, 60); tone('sawtooth', 70, 30, 0.5, 0.3 * v, 0, 400); break;
    case 'zap': case 'zapHit': noise(0.12, 0.3 * v, 'highpass', 4000, 1500); tone('sawtooth', 1800, 400, 0.1, 0.1 * v, 0, 4000); break;
    case 'zapS': tone('square', 330, 660, 0.3, 0.14 * v, 0, 2000); tone('square', 440, 880, 0.3, 0.1 * v, 0.05, 2000); break;
    case 'sprocketS': tone('square', 200, 800, 0.25, 0.18 * v, 0, 1800); tone('sine', 800, 1600, 0.2, 0.15 * v, 0.15); break;
    case 'hit': noise(0.07, 0.3 * v, 'lowpass', 2200, 500); tone('sine', 220, 90, 0.08, 0.2 * v); break;
    case 'hurt': tone('square', 230, 110, 0.13, 0.16 * v, 0, 1600); noise(0.08, 0.25 * v, 'lowpass', 1500, 300); break;
    case 'boom': noise(0.65, 0.85 * v, 'lowpass', 1800, 80); tone('sine', 110, 30, 0.55, 0.45 * v); break;
    case 'box': noise(0.28, 0.55 * v, 'bandpass', 900, 250, 1.2); tone('triangle', 320, 90, 0.2, 0.2 * v); break;
    case 'bhit': tone('square', 420, 300, 0.04, 0.08 * v, 0, 1500); break;
    case 'wall': noise(0.38, 0.55 * v, 'lowpass', 700, 90); break;
    case 'cube': tone('sine', 880, 1320, 0.1, 0.22 * v); tone('sine', 1320, 1760, 0.14, 0.2 * v, 0.07); break;
    case 'supready': [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.14, 0.18 * v, i * 0.06)); break;
    case 'kill': tone('square', 660, 990, 0.1, 0.14 * v, 0, 3000); tone('square', 990, 1320, 0.14, 0.14 * v, 0.09, 3000); break;
    case 'death': tone('sawtooth', 420, 70, 0.6, 0.25 * v, 0, 1200); break;
    case 'win': [523, 659, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.22, 0.22, i * 0.11)); break;
    case 'lose': [523, 440, 349, 262].forEach((f, i) => tone('triangle', f, f * 0.98, 0.26, 0.2, i * 0.15)); break;
    case 'click': tone('sine', 700, 500, 0.05, 0.15 * v); break;
    case 'gas': noise(0.12, 0.18 * v, 'bandpass', 400, 200, 2); break;
    case 'turret': tone('square', 300, 600, 0.15, 0.12 * v, 0, 1500); break;
    case 'tshot': tone('square', 900, 400, 0.05, 0.06 * v, 0, 2500); break;
    case 'respawn': [392, 523, 659].forEach((f, i) => tone('sine', f, f, 0.15, 0.18 * v, i * 0.07)); break;
  }
}

/* ================= input ================= */
const INP = { keys: {}, mx: innerWidth / 2, my: innerHeight / 2, mdown: false, rdown: false, mouseT: -9, pendFire: false, pendSup: false, autoFire: false, autoSup: false, aimHeld: false, supHeld: false, gx: 20, gz: 20, touch: { move: null, atk: null, sup: null }, lastTouch: 0 };
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();
function groundAt(sx, sy) { ndc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, R3.cam); return ray.ray.intersectPlane(gplane, hitP) ? { x: hitP.x, z: hitP.z } : null; }
function initInput() {
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!INP.keys[k]) onKeyPress(k, e);
    INP.keys[k] = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) && STATE.mode === 'play') e.preventDefault();
  });
  addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; INP.keys[k] = false; if ((k === 'e' || k === 'Shift') && INP.supHeld) { INP.supHeld = false; INP.pendSup = true; } });
  addEventListener('blur', () => { INP.keys = {}; INP.mdown = false; INP.rdown = false; INP.supHeld = false; });
  const gl = document.getElementById('ov');
  gl.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now(); } });
  gl.addEventListener('pointerdown', e => {
    audioInit();
    if (e.pointerType !== 'mouse') return;
    INP.mx = e.clientX; INP.my = e.clientY; INP.mouseT = performance.now();
    if (e.button === 0) { INP.mdown = true; INP.pendFire = true; }
    if (e.button === 2) { INP.rdown = true; INP.supHeld = true; }
  });
  addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') return; if (e.button === 0) INP.mdown = false; if (e.button === 2 && INP.rdown) { INP.rdown = false; INP.supHeld = false; INP.pendSup = true; } });
  gl.addEventListener('contextmenu', e => e.preventDefault());
  initTouch();
}
function onKeyPress(k, e) {
  if (STATE.mode === 'play') {
    if (k === ' ' || k === 'j') INP.autoFire = true;
    if (k === 'k' || k === 'f' || k === 'q') INP.autoSup = true;
    if (k === 'e' || k === 'Shift') INP.supHeld = true;
    if (k === 'Escape' || k === 'p') togglePause();
    if (k === 'm') setMute(!AU.muted);
  } else if (STATE.mode === 'menu') menuKey(k, e);
  else if (STATE.mode === 'result') { if (k === 'Enter' || k === ' ') document.getElementById('rAgain').click(); if (k === 'Escape') document.getElementById('rMenu').click(); }
  else if (STATE.mode === 'pause') { if (k === 'Escape' || k === 'p' || k === 'Enter') togglePause(); if (k === 'q') quitToMenu(); }
}

/* --- touch: floating move stick (left), attack & super sticks (right) --- */
function initTouch() {
  const zone = document.getElementById('touchZone'), atk = document.getElementById('atkStick'), sup = document.getElementById('supStick');
  const st = (el, kind) => {
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      e.preventDefault(); e.stopPropagation(); audioInit(); INP.lastTouch = performance.now();
      const r = el.getBoundingClientRect(), cx = kind === 'move' ? e.clientX : r.left + r.width / 2, cy = kind === 'move' ? e.clientY : r.top + r.height / 2;
      INP.touch[kind] = { id: e.pointerId, ox: cx, oy: cy, x: e.clientX, y: e.clientY, el };
      try { el.setPointerCapture(e.pointerId); } catch (_) { }
      if (kind === 'move') showMoveStick(cx, cy, cx, cy);
    });
    el.addEventListener('pointermove', e => { const T = INP.touch[kind]; if (!T || T.id !== e.pointerId) return; T.x = e.clientX; T.y = e.clientY; if (kind === 'move') showMoveStick(T.ox, T.oy, T.x, T.y); else knob(T); });
    const end = e => {
      const T = INP.touch[kind]; if (!T || T.id !== e.pointerId) return;
      INP.touch[kind] = null;
      if (kind === 'move') { hideMoveStick(); return; }
      const dx = T.x - T.ox, dy = T.y - T.oy, L = Math.hypot(dx, dy);
      resetKnob(T.el);
      if (e.type === 'pointercancel') return;
      if (kind === 'atk') { if (L > 18) { INP.touchAim = touchAimOf(dx, dy, L, 'atk'); INP.pendFire = true; } else INP.autoFire = true; }
      else { if (L > 18) { INP.touchAim = touchAimOf(dx, dy, L, 'sup'); INP.pendSup = true; } else INP.autoSup = true; }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  };
  st(zone, 'move'); st(atk, 'atk'); st(sup, 'sup');
}
function touchAimOf(dx, dy, L, kind) {
  // screen -> world: camera looks toward -z, so screen right = +x, screen down = +z (approximately)
  const ang = Math.atan2(dy * 1.25, dx), f = clamp((L - 18) / 70, 0, 1);
  return { ang, f, kind };
}
function knob(T) { const dx = T.x - T.ox, dy = T.y - T.oy, L = Math.hypot(dx, dy), m = 46, k = L > m ? m / L : 1; const kn = T.el.querySelector('.knob'); if (kn) kn.style.transform = `translate(${dx * k}px,${dy * k}px)`; }
function resetKnob(el) { const kn = el.querySelector('.knob'); if (kn) kn.style.transform = ''; }
function showMoveStick(ox, oy, x, y) { const b = document.getElementById('mvBase'), k = document.getElementById('mvKnob'); b.style.display = k.style.display = 'block'; b.style.left = ox + 'px'; b.style.top = oy + 'px'; const dx = x - ox, dy = y - oy, L = Math.hypot(dx, dy), m = 50, s = L > m ? m / L : 1; k.style.left = ox + dx * s + 'px'; k.style.top = oy + dy * s + 'px'; }
function hideMoveStick() { document.getElementById('mvBase').style.display = 'none'; document.getElementById('mvKnob').style.display = 'none'; }

/* auto-aim target: nearest visible enemy, else turret, else box */
function autoTarget(me, range) {
  let best = null, bd = 1e9;
  for (const e of viewBrawlers()) { if (!e.alive || e.team === me.team || e.vis === false) continue; const d = dist(me.x, me.z, e.x, e.z); if (d < range + 1.5 && d < bd) { bd = d; best = e; } }
  if (!best) for (const t of viewTurrets()) { if (t.team === me.team) continue; const d = dist(me.x, me.z, t.x, t.z); if (d < range && d < bd) { bd = d; best = t; } }
  if (!best) for (const b of M.boxes) { if (b.hp <= 0) continue; const x = b.tx + .5, z = b.tz + .5, d = dist(me.x, me.z, x, z); if (d < range && d < bd) { bd = d; best = { x, z }; } }
  return best;
}
/* fills me.inp from devices; returns {mode, ang, tx, tz, strength} for the aim indicator */
function readInput(me) {
  const inp = me.inp, K = INP.keys;
  let mx = (K.d || K.ArrowRight ? 1 : 0) - (K.a || K.ArrowLeft ? 1 : 0), mz = (K.s || K.ArrowDown ? 1 : 0) - (K.w || K.ArrowUp ? 1 : 0);
  const T = INP.touch.move;
  if (T) { const dx = T.x - T.ox, dy = T.y - T.oy, L = Math.hypot(dx, dy); if (L > 6) { const k = Math.min(1, L / 45); mx = dx / L * k; mz = dy / L * k * 1; } }
  const L = Math.hypot(mx, mz); if (L > 1) { mx /= L; mz /= L; }
  inp.mx = mx; inp.mz = mz;
  let show = null;
  const usingMouse = performance.now() - INP.mouseT < 2500 && performance.now() - INP.lastTouch > 1500;
  if (usingMouse) {
    const gp = groundAt(INP.mx, INP.my);
    if (gp) { INP.gx = gp.x; INP.gz = gp.z; inp.aim = Math.atan2(gp.z - me.z, gp.x - me.x); inp.tx = gp.x; inp.tz = gp.z; }
    show = { mode: INP.supHeld && me.sup >= 1 ? 'sup' : 'atk', strength: INP.mdown || INP.supHeld ? 0.36 : 0.16 };
  } else if (L > 0.2 && me.alive) { inp.aim = Math.atan2(mz, mx); inp.tx = me.x + Math.cos(inp.aim) * me.H.atk.range * 0.7; inp.tz = me.z + Math.sin(inp.aim) * me.H.atk.range * 0.7; }
  // touch aiming sticks (live preview)
  for (const kind of ['atk', 'sup']) {
    const S = INP.touch[kind]; if (!S) continue;
    const dx = S.x - S.ox, dy = S.y - S.oy, Ld = Math.hypot(dx, dy);
    if (Ld > 18) { const ta = touchAimOf(dx, dy, Ld, kind); applyTouchAim(me, ta); show = { mode: kind, strength: 0.4 }; }
  }
  INP.aimHeld = !!(INP.mdown || INP.supHeld || INP.touch.atk || INP.touch.sup);
  if (INP.touchAim) { applyTouchAim(me, INP.touchAim); INP.touchAim = null; }
  const doAuto = (isSup) => {
    const a = isSup ? me.H.sup : me.H.atk, rng = a.range || 8;
    const t = autoTarget(me, rng);
    if (t) { inp.aim = Math.atan2(t.z - me.z, t.x - me.x); inp.tx = t.x; inp.tz = t.z; }
    else if (L > 0.2) { inp.aim = Math.atan2(mz, mx); inp.tx = me.x + Math.cos(inp.aim) * rng * 0.8; inp.tz = me.z + Math.sin(inp.aim) * rng * 0.8; }
    else { inp.tx = me.x + Math.cos(inp.aim) * rng * 0.8; inp.tz = me.z + Math.sin(inp.aim) * rng * 0.8; }
  };
  let fire = false, sup = false;
  if (INP.autoFire) { doAuto(false); fire = true; INP.autoFire = false; }
  if (INP.autoSup) { doAuto(true); sup = true; INP.autoSup = false; }
  if (INP.pendFire || INP.mdown || K[' '] || K.j) { if ((K[' '] || K.j) && !INP.mdown && !INP.pendFire) doAuto(false); fire = true; INP.pendFire = false; }
  if (INP.pendSup) { sup = true; INP.pendSup = false; }
  if (fire) inp.fire = true;
  if (sup) inp.sup = true;
  if (show) show = Object.assign(show, { ang: inp.aim, tx: inp.tx, tz: inp.tz });
  return show;
}
function applyTouchAim(me, ta) {
  const a = ta.kind === 'sup' ? me.H.sup : me.H.atk, rng = a.range || 6;
  me.inp.aim = ta.ang; const D = rng * Math.max(0.15, ta.f);
  me.inp.tx = me.x + Math.cos(ta.ang) * D; me.inp.tz = me.z + Math.sin(ta.ang) * D;
}
