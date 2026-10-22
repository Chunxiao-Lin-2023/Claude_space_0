/* ================= synthesized sound (Web Audio, no files) ================= */
const AU = { ctx: null, master: null, noise: null, on: LS.get('sound', true), last: {} };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    const comp = C.createDynamicsCompressor(); comp.connect(C.destination);
    const m = C.createGain(); m.gain.value = AU.on ? 0.5 : 0; m.connect(comp);
    const b = C.createBuffer(1, C.sampleRate, C.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AU.ctx = C; AU.master = m; AU.noise = b;
  } catch (e) { }
}
function setSound(on) { AU.on = on; LS.set('sound', on); if (AU.master) AU.master.gain.value = on ? 0.5 : 0; const t = on ? '🔊' : '🔇'; $('sndBtn').textContent = t; $('mSound').textContent = '音效：' + (on ? '开' : '关'); }
function tone(type, f0, f1, dur, vol, delay, lp) {
  const C = AU.ctx; if (!C || !AU.on) return;
  const t0 = C.currentTime + (delay || 0), o = C.createOscillator(), g = C.createGain(), j = 1 + (Math.random() - 0.5) * 0.06;
  o.type = type; o.frequency.setValueAtTime(f0 * j, t0); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * j), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = g; if (lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; g.connect(f); out = f; }
  o.connect(g); out.connect(AU.master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol, ft, f0, f1, Q, delay) {
  const C = AU.ctx; if (!C || !AU.on) return;
  const t0 = C.currentTime + (delay || 0), s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain();
  s.buffer = AU.noise; f.type = ft; f.Q.value = Q || 1; f.frequency.setValueAtTime(f0, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
}
function sfx(k, big) {
  const now = performance.now(); if (AU.last[k] && now - AU.last[k] < 70) return; AU.last[k] = now;
  switch (k) {
    case 'click': tone('triangle', 880, 660, 0.06, 0.08); break;
    case 'sel': tone('sine', 620, 820, 0.08, 0.07); break;
    case 'buy': noise(0.05, 0.12, 'highpass', 4000); [1046, 1318, 1568].forEach((f, i) => tone('triangle', f, f, 0.22, 0.12, i * 0.06)); break;
    case 'sell':
      noise(0.04, 0.15, 'bandpass', 3000, 0, 2); tone('square', 1568, 1568, 0.08, 0.05, 0.02, 3000);
      [1318, 1760, 2093].forEach((f, i) => tone('triangle', f, f, 0.3, 0.12, 0.08 + i * 0.07));
      if (big) [2637, 3136].forEach((f, i) => tone('sine', f, f, 0.4, 0.07, 0.3 + i * 0.08)); break;
    case 'loss': tone('triangle', 520, 330, 0.35, 0.12); tone('triangle', 390, 260, 0.4, 0.08, 0.12); break;
    case 'month': noise(0.18, 0.06, 'bandpass', 1800, 900, 1.5); tone('sine', 523, 523, 0.18, 0.06, 0.05); tone('sine', 784, 784, 0.25, 0.05, 0.13); break;
    case 'news': tone('sine', 1318, 1318, 0.12, 0.06); tone('sine', 1046, 1046, 0.18, 0.05, 0.1); break;
    case 'good': tone('triangle', 784, 1046, 0.2, 0.08); break;
    case 'bad': tone('sawtooth', 220, 150, 0.3, 0.05, 0, 900); break;
    case 'err': tone('square', 220, 180, 0.12, 0.06, 0, 1200); break;
    case 'insp': noise(0.12, 0.08, 'bandpass', 2500, 1200, 3); tone('sine', 1200, 1500, 0.1, 0.05, 0.1); break;
    case 'reno': for (let i = 0; i < 3; i++) noise(0.06, 0.14, 'bandpass', 900 + i * 300, 0, 4, i * 0.09); break;
    case 'ready': tone('sine', 660, 990, 0.14, 0.08); break;
    case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, i === 6 ? 0.8 : 0.22, 0.13, i * 0.13)); break;
    case 'lose': [392, 349, 311, 262].forEach((f, i) => tone('triangle', f, f, 0.4, 0.1, i * 0.2)); break;
  }
}
