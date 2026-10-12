/* ================= synthesized audio (no files) ================= */
const AU = { ctx: null, master: null, sfx: null, amb: null, noise: null, muted: LS.get('mute', false), last: {}, lx: 17, lz: 20, beatT: 0, ambN: {} };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 5; comp.connect(C.destination);
    const m = C.createGain(); m.gain.value = AU.muted ? 0 : SET.vol; m.connect(comp);
    const sf = C.createGain(); sf.gain.value = 1; sf.connect(m);
    const am = C.createGain(); am.gain.value = 0.6; am.connect(m);
    const nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // simple reverb (decaying noise impulse) for the old house
    const conv = C.createConvolver(), len = C.sampleRate * 2.2, ir = C.createBuffer(2, len, C.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const b = ir.getChannelData(ch); for (let i = 0; i < len; i++) b[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    conv.buffer = ir; const wet = C.createGain(); wet.gain.value = 0.28; conv.connect(wet); wet.connect(m);
    Object.assign(AU, { ctx: C, master: m, sfx: sf, amb: am, noise: nb, verb: conv });
    startAmbience();
  } catch (e) { }
}
function setMute(v) { AU.muted = v; LS.set('mute', v); if (AU.master) AU.master.gain.value = v ? 0 : SET.vol; document.querySelectorAll('.muteBtn').forEach(b => b.textContent = v ? '🔇' : '🔊'); }
/* output node with stereo pan + reverb send */
function outNode(pan = 0, verb = 0.3) {
  const C = AU.ctx, g = C.createGain(); let n = g;
  if (C.createStereoPanner) { const p = C.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); n = p; }
  n.connect(AU.sfx); if (verb > 0) { const s = C.createGain(); s.gain.value = verb; n.connect(s); s.connect(AU.verb); }
  return g;
}
function tone(type, f0, f1, dur, vol, delay = 0, o = {}) {
  const C = AU.ctx; if (!C || AU.muted) return; const t = C.currentTime + delay, j = o.nj ? 1 : 1 + (Math.random() - .5) * 0.1;
  const osc = C.createOscillator(), g = C.createGain(); osc.type = type; osc.frequency.setValueAtTime(f0 * j, t); osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * j), t + dur);
  if (o.vib) { const l = C.createOscillator(), lg = C.createGain(); l.frequency.value = o.vib; lg.gain.value = f0 * 0.02; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05); }
  const att = o.att || 0.008;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = osc; if (o.lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); n = f; }
  n.connect(g); g.connect(o.out || AU.sfx); osc.start(t); osc.stop(t + dur + 0.05);
}
function noise(dur, vol, ft = 'lowpass', f0 = 2000, f1 = 400, Q = 1, delay = 0, o = {}) {
  const C = AU.ctx; if (!C || AU.muted) return; const t = C.currentTime + delay;
  const s = C.createBufferSource(); s.buffer = AU.noise; s.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = C.createBiquadFilter(); f.type = ft; f.Q.value = Q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  const g = C.createGain(); const att = o.att || 0.006; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(o.out || AU.sfx); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
}
/* positional one-shot. x,z null = UI sound */
function sfx(name, x, z, vol = 1) {
  if (!AU.ctx || AU.muted) return;
  const now = performance.now(); if (AU.last[name] && now - AU.last[name] < 40) return; AU.last[name] = now;
  let pan = 0, dv = 1;
  if (x != null) { const d = dist(x, z, AU.lx, AU.lz); dv = clamp(1.25 - d / 18, 0, 1); if (dv < 0.03) return; pan = clamp((x - AU.lx) / 9, -0.9, 0.9); }
  const v = vol * dv, out = outNode(pan, 0.35), O = { out };
  const T = (type, a, b, du, vo, de = 0, extra) => tone(type, a, b, du, vo, de, Object.assign({ out }, extra || {}));
  const N = (du, vo, ft, a, b, Q = 1, de = 0, extra) => noise(du, vo, ft, a, b, Q, de, Object.assign({ out }, extra || {}));
  switch (name) {
    case 'step': N(0.08, 0.16 * v, 'lowpass', 600, 200, 1); if (Math.random() < 0.12) T('sawtooth', 140, 110, 0.18, 0.025 * v, 0.02, { lp: 700 }); break;
    case 'doorOpen': T('sawtooth', 220, 150, 0.7, 0.05 * v, 0, { lp: 1400, vib: 9 }); N(0.5, 0.08 * v, 'bandpass', 900, 500, 4); break;
    case 'slam': N(0.5, 0.9 * v, 'lowpass', 1600, 120); T('sine', 90, 40, 0.45, 0.6 * v); R3.shake = Math.max(R3.shake, 0.5 * dv); break;
    case 'lever': T('square', 400, 180, 0.08, 0.15 * v, 0, { lp: 2000 }); N(0.2, 0.3 * v, 'highpass', 2500, 1200); T('sine', 120, 60, 0.2, 0.3 * v, 0.05); break;
    case 'leverUp': T('square', 260, 380, 0.06, 0.08 * v, 0, { lp: 1800 }); N(0.12, 0.15 * v, 'highpass', 3000, 1500); break;
    case 'bigDoor': N(2.2, 0.45 * v, 'lowpass', 400, 80, 1, 0, { att: 0.3 }); T('sawtooth', 70, 55, 2.0, 0.12 * v, 0, { lp: 300, att: 0.3 }); N(1.5, 0.12 * v, 'bandpass', 1800, 900, 6, 0.2); break;
    case 'wardrobe': T('sawtooth', 300, 180, 0.35, 0.04 * v, 0, { lp: 1200, vib: 12 }); N(0.12, 0.3 * v, 'lowpass', 900, 200, 1, 0.3); break;
    case 'click': T('square', 1600, 1200, 0.03, 0.08 * v); break;
    case 'boost': T('sine', 900, 3200, 0.18, 0.12 * v); N(0.25, 0.35 * v, 'highpass', 5000, 2000, 1, 0.12); break;
    case 'spark': N(0.06, 0.25 * v, 'highpass', 4000, 6000, 1); T('square', 3000, 2000, 0.03, 0.04 * v); break;
    case 'scrape': N(0.4, 0.22 * v, 'bandpass', 700, 400, 3); break;
    case 'scrapeBig': N(1.4, 0.5 * v, 'bandpass', 500, 200, 2, 0, { att: 0.1 }); N(0.4, 0.4 * v, 'lowpass', 800, 100, 1, 1.2); break;
    case 'power': T('sawtooth', 50, 120, 1.4, 0.12 * v, 0, { lp: 500, att: 0.4 }); N(0.2, 0.5 * v, 'lowpass', 2000, 300); [0.4, 0.6, 0.75, 0.9].forEach(d => N(0.05, 0.25 * v, 'highpass', 3000, 4000, 1, d)); break;
    case 'revive': [523, 659, 784].forEach((f, i) => T('sine', f, f, 0.6, 0.12 * v, i * 0.08, { att: 0.05 })); break;
    case 'pick': T('sine', 880, 1320, 0.25, 0.14 * v); T('sine', 1320, 1760, 0.3, 0.1 * v, 0.08); break;
    case 'dial': T('square', 900, 700, 0.03, 0.08 * v); N(0.05, 0.12 * v, 'bandpass', 2000, 1500, 4); break;
    case 'unlock': T('sine', 200, 80, 0.3, 0.3 * v); [660, 990].forEach((f, i) => T('triangle', f, f, 0.5, 0.1 * v, 0.2 + i * 0.1)); break;
    case 'evidence': [392, 466, 587].forEach((f, i) => T('sine', f, f * 1.01, 1.2, 0.08 * v, i * 0.15, { att: 0.2, vib: 5 })); break;
    case 'ritualStart': [196, 233, 294, 349].forEach((f, i) => T('sine', f, f, 3.0, 0.07 * v, i * 0.2, { att: 0.6, vib: 4 })); break;
    case 'banish': [262, 330, 392, 523, 659, 784].forEach((f, i) => T('sine', f, f * 1.5, 2.5, 0.08 * v, i * 0.12, { att: 0.3 })); N(3, 0.2 * v, 'highpass', 2000, 8000, 1, 0, { att: 0.5 }); break;
    case 'wrong': [110, 116, 155, 233].forEach((f, i) => T('sawtooth', f, f * 0.7, 1.6, 0.1 * v, i * 0.03, { lp: 900 })); N(1.5, 0.5 * v, 'lowpass', 1200, 80); R3.shake = Math.max(R3.shake, 1); break;
    case 'huntWarn': T('sawtooth', 55, 52, 3.2, 0.2 * v, 0, { lp: 260, att: 1.4 }); T('sine', 37, 33, 3.2, 0.35 * v, 0, { att: 1.5 }); break;
    case 'huntStart': [311, 330, 349, 466].forEach((f, i) => T('sawtooth', f * 2, f * 1.8, 1.1, 0.06 * v, i * 0.02, { lp: 3000, vib: 7 })); N(0.9, 0.7 * v, 'lowpass', 2500, 60); T('sine', 70, 30, 0.9, 0.6 * v); R3.shake = Math.max(R3.shake, 0.8); break;
    case 'huntEnd': T('sine', 200, 60, 1.6, 0.12 * v, 0, { att: 0.4 }); N(1.2, 0.1 * v, 'lowpass', 600, 100, 1, 0, { att: 0.3 }); break;
    case 'ghostHit': T('sawtooth', 2400, 600, 0.6, 0.12 * v, 0, { lp: 5000, vib: 18 }); N(0.5, 0.3 * v, 'highpass', 3000, 1000); break;
    case 'caught': T('sawtooth', 1800, 300, 0.9, 0.16 * v, 0, { lp: 4000, vib: 22 }); N(0.4, 0.8 * v, 'lowpass', 2000, 100, 1, 0.1); T('sine', 60, 30, 0.6, 0.6 * v, 0.1); R3.shake = Math.max(R3.shake, 1.2); break;
    case 'chime': [0, 1.2, 2.4].forEach(d => { T('sine', 523, 520, 2.2, 0.12 * v, d, { att: 0.005, nj: 1 }); T('sine', 1046, 1040, 1.5, 0.05 * v, d, { nj: 1 }); T('sine', 784, 780, 1.8, 0.04 * v, d, { nj: 1 }); }); break;
    case 'thunder': { const tv = 0.7 * vol; noise(0.25, tv, 'lowpass', 3000, 400); noise(3.5, tv * 0.8, 'lowpass', 500, 60, 1, 0.1, { att: 0.15 }); noise(2.5, tv * 0.4, 'lowpass', 200, 40, 1, 0.6, { att: 0.4 }); break; }
    case 'buzz': T('square', 120, 118, 1.6, 0.04 * v, 0, { lp: 700 }); break;
    case 'stinger': T('sawtooth', 1480, 1400, 0.9, 0.08 * v, 0, { lp: 4000, vib: 11 }); T('sawtooth', 1568, 1500, 0.9, 0.06 * v, 0.03, { lp: 4000, vib: 13 }); break;
    case 'piano': { const sc = [220, 261, 311, 349, 415, 440, 523]; for (let k = 0; k < 4; k++) { const f = sc[Math.floor(Math.random() * sc.length)]; T('triangle', f, f, 1.4, 0.1 * v, k * rrLocal(0.3, 0.6), { nj: 1 }); T('sine', f * 2, f * 2, 1.0, 0.03 * v, k * 0.45, { nj: 1 }); } break; }
    case 'giggle': for (let k = 0; k < 5; k++) T('sine', 900 + k * 40, 700, 0.09, 0.07 * v, k * 0.11, { vib: 30 }); break;
    case 'wail': T('sine', 620, 380, 2.2, 0.09 * v, 0, { att: 0.5, vib: 6 }); T('sine', 930, 570, 2.2, 0.03 * v, 0, { att: 0.5, vib: 6 }); break;
    case 'whisper': for (let k = 0; k < 6; k++) N(0.18, 0.12 * v, 'bandpass', rrLocal(1500, 3500), rrLocal(800, 2500), 6, k * 0.16); break;
    case 'steps': for (let k = 0; k < 3; k++) N(0.09, 0.3 * v, 'lowpass', 500, 150, 1, k * 0.45); break;
    case 'creak': T('sawtooth', 160, 120, 0.6, 0.05 * v, 0, { lp: 900, vib: 14 }); break;
    case 'knock': for (let k = 0; k < 3; k++) { N(0.07, 0.6 * v, 'lowpass', 900, 200, 1, k * 0.32); T('sine', 140, 80, 0.08, 0.3 * v, k * 0.32); } break;
    case 'rattle': for (let k = 0; k < 5; k++) N(0.04, 0.2 * v, 'bandpass', 2500, 1800, 5, k * 0.07); break;
    case 'heart': T('sine', 62, 40, 0.14, 0.45 * v, 0, { nj: 1 }); T('sine', 58, 38, 0.12, 0.3 * v, 0.17, { nj: 1 }); break;
    case 'ping': T('triangle', 1046, 1046, 0.1, 0.12 * v); T('triangle', 1568, 1568, 0.16, 0.1 * v, 0.09); break;
    case 'quick': T('sine', 784, 988, 0.1, 0.1 * v); break;
    case 'win': [262, 330, 392, 523, 659].forEach((f, i) => T('sine', f, f, 1.6, 0.1, i * 0.18, { att: 0.08 })); break;
    case 'lose': [220, 208, 196, 147].forEach((f, i) => T('sawtooth', f, f * 0.98, 1.2, 0.06, i * 0.3, { lp: 800 })); break;
  }
}
/* continuous ambience: rain, wind, low drone; hunt / fear layers are modulated per frame */
function startAmbience() {
  const C = AU.ctx, A = AU.ambN;
  const loopNoise = (type, f, Q, vol) => { const s = C.createBufferSource(); s.buffer = AU.noise; s.loop = true; const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = Q; const g = C.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(AU.amb); s.start(); return { s, fl, g }; };
  A.rain = loopNoise('lowpass', 1800, 0.5, 0.12); A.rain2 = loopNoise('highpass', 5000, 0.5, 0.025);
  A.wind = loopNoise('bandpass', 380, 3, 0.05);
  const wl = C.createOscillator(), wg = C.createGain(); wl.frequency.value = 0.07; wg.gain.value = 160; wl.connect(wg); wg.connect(A.wind.fl.frequency); wl.start();
  const drone = (f, v) => { const o = C.createOscillator(), g = C.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(AU.amb); o.start(); return { o, g }; };
  A.d1 = drone(41, 0.07); A.d2 = drone(41.6, 0.06); A.d3 = drone(61.5, 0.0);
  const hunt = C.createOscillator(), hg = C.createGain(), hf = C.createBiquadFilter(); hunt.type = 'sawtooth'; hunt.frequency.value = 46; hf.type = 'lowpass'; hf.frequency.value = 220; hg.gain.value = 0; hunt.connect(hf); hf.connect(hg); hg.connect(AU.amb); hunt.start(); A.hunt = { o: hunt, g: hg };
}
function updateAmbience(W, me, dt, indoorsQuiet) {
  if (!AU.ctx || !AU.ambN.rain) return;
  const A = AU.ambN, t = AU.ctx.currentTime, G = W.g, hunting = G && (G.st === 'hunt' || G.st === 'ritual' || G.st === 'stun');
  A.hunt.g.gain.setTargetAtTime(hunting ? 0.07 : (G && G.st === 'warn' ? 0.04 : 0), t, 0.3);
  A.d3.g.gain.setTargetAtTime(clamp((me.fear - 40) / 60, 0, 1) * 0.06, t, 0.5);
  // rain is louder near windows / outer walls
  const edge = Math.min(me.x, MAP.W - me.x, me.z, MAP.H - me.z); A.rain.g.gain.setTargetAtTime(0.06 + clamp(1 - edge / 6, 0, 1) * 0.1, t, 0.5);
  // heartbeat
  AU.beatT -= dt; const bpm = 55 + me.fear * 0.9 + (hunting ? 35 : 0);
  if ((me.fear > 45 || hunting) && AU.beatT <= 0) { AU.beatT = 60 / bpm; sfx('heart', null, null, clamp((me.fear - 30) / 70, 0.25, 1)); }
}
