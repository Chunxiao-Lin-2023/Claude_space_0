/* ================= synthesized audio (Web Audio, no files) ================= */
const AU = { ctx: null, master: null, noise: null, amb: null, ambG: null, last: {} };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.connect(C.destination);
    const m = C.createGain(); m.gain.value = SET.mute ? 0 : 0.7; m.connect(comp);
    const nb = C.createBuffer(1, C.sampleRate, C.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    Object.assign(AU, { ctx: C, master: m, noise: nb });
    // ambient night drone
    const g = C.createGain(); g.gain.value = 0; g.connect(m);
    const o1 = C.createOscillator(), o2 = C.createOscillator(), lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    o1.type = 'sawtooth'; o1.frequency.value = 55; o2.type = 'sawtooth'; o2.frequency.value = 55.6; o1.connect(lp); o2.connect(lp); lp.connect(g); o1.start(); o2.start();
    const lfo = C.createOscillator(), lg = C.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 90; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    AU.ambG = g;
  } catch (e) { }
}
function setMute(v) { SET.mute = v; saveSet(); if (AU.master) AU.master.gain.value = v ? 0 : 0.7; }
function tone(type, f0, f1, dur, vol, delay = 0, lp = 0) {
  const C = AU.ctx; if (!C) return; const t = C.currentTime + delay;
  const o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o; if (lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
  n.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, ft = 'lowpass', f0 = 2000, f1 = f0, Q = 1, delay = 0) {
  const C = AU.ctx; if (!C) return; const t = C.currentTime + delay;
  const s = C.createBufferSource(); s.buffer = AU.noise; s.loop = true;
  const f = C.createBiquadFilter(); f.type = ft; f.Q.value = Q; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  const g = C.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const LIM = { pistol: 0.04, rifle: 0.05, shotgun: 0.05, flesh: 0.05, bash: 0.08, zdie: 0.08, brk: 0.05, build: 0.04, groan: 1.2 };
function sfx(n, x, y) {
  if (!AU.ctx || SET.mute || (W && W.demo)) return;
  const now = AU.ctx.currentTime; if (LIM[n] && AU.last[n] && now - AU.last[n] < LIM[n]) return; AU.last[n] = now;
  let v = 1;
  if (x != null && W && W.p[ME]) { const me = W.p[ME]; v = clamp(1 - d2(x, y, me.x, me.y) / 30, 0.12, 1); }
  const r = 1 + (Math.random() - 0.5) * 0.16, hurt = W && W.p[ME] ? 1 + (1 - W.p[ME].hp / W.p[ME].maxHp) * 0.3 : 1;
  switch (n) {
    case 'pistol': noise(0.12, 0.5 * v, 'bandpass', 2400 * r, 600, 0.8); tone('square', 180 * r, 60, 0.08, 0.18 * v); break;
    case 'shotgun': noise(0.32, 0.8 * v, 'lowpass', 3000 * r, 300, 0.7); tone('sawtooth', 110 * r, 40, 0.18, 0.3 * v, 0, 800); break;
    case 'rifle': noise(0.09, 0.45 * v, 'bandpass', 3000 * r, 900, 0.9); tone('square', 150 * r, 70, 0.06, 0.14 * v); break;
    case 'sniper': noise(0.5, 0.85 * v, 'lowpass', 5000 * r, 200, 0.6); tone('sawtooth', 220 * r, 50, 0.3, 0.3 * v, 0, 1500); noise(0.6, 0.15 * v, 'bandpass', 900, 300, 2, 0.12); break;
    case 'empty': tone('square', 1300, 1100, 0.03, 0.12); break;
    case 'reload': tone('square', 600 * r, 500, 0.04, 0.1 * v); noise(0.05, 0.2 * v, 'highpass', 3000, 3000, 1, 0.12); tone('square', 900 * r, 700, 0.05, 0.12 * v, 0.35); break;
    case 'swap': noise(0.06, 0.2, 'highpass', 2500); tone('triangle', 500, 700, 0.05, 0.08, 0.04); break;
    case 'flesh': noise(0.08, 0.28 * v, 'lowpass', 900 * r, 300); break;
    case 'head': noise(0.1, 0.4 * v, 'lowpass', 1400 * r, 300); tone('sine', 160, 60, 0.1, 0.25 * v); break;
    case 'zdie': tone('sawtooth', 160 * r, 60, 0.4, 0.14 * v, 0, 600); noise(0.25, 0.18 * v, 'lowpass', 500, 150); break;
    case 'bigdie': tone('sawtooth', 90 * r, 30, 0.9, 0.3 * v, 0, 500); noise(0.6, 0.35 * v, 'lowpass', 400, 80); break;
    case 'groan': tone('sawtooth', (90 + Math.random() * 40) * r, 70 * r, 0.9, 0.06 * v, 0, 380); break;
    case 'bash': noise(0.12, 0.42 * v, 'lowpass', 700 * r, 200, 1); tone('sine', 90 * r, 50, 0.1, 0.2 * v); break;
    case 'smash': noise(0.3, 0.7 * v, 'lowpass', 600 * r, 90, 1); tone('sine', 60 * r, 30, 0.3, 0.45 * v); break;
    case 'brk': noise(0.35, 0.5 * v, 'lowpass', 1600 * r, 200, 0.8); tone('triangle', 200 * r, 60, 0.2, 0.15 * v); break;
    case 'brkMetal': noise(0.35, 0.4 * v, 'bandpass', 2600 * r, 800, 3); tone('square', 420 * r, 180, 0.3, 0.1 * v); break;
    case 'fall': noise(0.45, 0.45 * v, 'lowpass', 900 * r, 120, 0.7); break;
    case 'collapse': noise(1.4, 0.8 * v, 'lowpass', 500, 60, 0.6); tone('sine', 50, 25, 1.2, 0.4 * v); break;
    case 'build': tone('square', 220 * r, 200, 0.04, 0.14 * v, 0, 1800); noise(0.05, 0.25 * v, 'bandpass', 1500 * r, 1500, 2, 0.02); break;
    case 'demo': noise(0.18, 0.3 * v, 'lowpass', 1200, 300); tone('triangle', 300, 150, 0.12, 0.1 * v); break;
    case 'loot': [660, 880, 1100].forEach((f, i) => tone('triangle', f, f, 0.12, 0.12, i * 0.06)); break;
    case 'craft': [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.14, 0.13, i * 0.07)); break;
    case 'deny': tone('square', 200, 140, 0.15, 0.12); break;
    case 'hurt': tone('sawtooth', 220 * hurt, 90, 0.18, 0.22); noise(0.12, 0.25, 'lowpass', 900); break;
    case 'down': tone('sawtooth', 300, 60, 0.9, 0.2, 0, 900); break;
    case 'revive': [392, 523, 659].forEach((f, i) => tone('sine', f, f, 0.2, 0.15, i * 0.09)); break;
    case 'heal': tone('sine', 520, 780, 0.3, 0.14); break;
    case 'med': noise(0.2, 0.15, 'highpass', 4000); break;
    case 'night': tone('sawtooth', 220, 440, 1.6, 0.13, 0, 1200); tone('sawtooth', 440, 220, 1.6, 0.13, 1.6, 1200); break;
    case 'blood': [0, 0.9, 1.8].forEach(d => tone('sawtooth', 110, 55, 0.85, 0.24, d, 700)); noise(2.6, 0.2, 'lowpass', 300, 60); break;
    case 'dawn': [523, 659, 784, 1046, 784].forEach((f, i) => tone('sine', f, f, 0.5, 0.11, i * 0.16)); break;
    case 'boom': noise(0.9, 1.0 * v, 'lowpass', 1800, 60, 0.6); tone('sine', 70, 25, 0.7, 0.6 * v); break;
    case 'throw': noise(0.15, 0.2, 'bandpass', 900, 2400, 1); break;
    case 'clink': tone('triangle', 1800 * r, 1500, 0.05, 0.08 * v); break;
    case 'spit': noise(0.25, 0.25 * v, 'bandpass', 600 * r, 1500, 3); break;
    case 'acid': noise(0.3, 0.25 * v, 'highpass', 2500 * r, 6000, 1); break;
    case 'rhit': tone('square', 880, 880, 0.08, 0.12); tone('square', 660, 660, 0.08, 0.12, 0.1); noise(0.1, 0.25, 'bandpass', 2000); break;
    case 'shove': noise(0.12, 0.2, 'bandpass', 700, 1600, 1); break;
    case 'shoveHit': noise(0.12, 0.4, 'lowpass', 800, 200); tone('sine', 120, 60, 0.1, 0.3); break;
    case 'land': noise(0.08, 0.12, 'lowpass', 500); break;
    case 'chop': noise(0.12, 0.35 * v, 'bandpass', 900 * r, 500, 2); tone('triangle', 180 * r, 120, 0.1, 0.18 * v); noise(0.5, 0.25 * v, 'lowpass', 600, 120, 1, 0.15); break;
    case 'click': tone('triangle', 900, 900, 0.03, 0.08); break;
    case 'ready': tone('triangle', 660, 990, 0.12, 0.12); break;
  }
}
function audioTick(dt) {
  if (!AU.ctx || !W) return;
  const target = W.phase === 'night' ? (isBlood(W.night) ? 0.09 : 0.05) : 0;
  AU.ambG.gain.value = lerp(AU.ambG.gain.value, SET.mute ? 0 : target, Math.min(1, dt * 0.8));
  // random distant groans
  if (W.zs.length && Math.random() < dt * Math.min(1.2, W.zs.length * 0.06)) { const z = W.zs[(Math.random() * W.zs.length) | 0]; if (z) sfx('groan', z.x, z.y); }
}
