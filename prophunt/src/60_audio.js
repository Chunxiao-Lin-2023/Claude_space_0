/* ================= synthesized sound (Web Audio, no files) ================= */
const AU = { ctx: null, master: null, noise: null, on: LS.get('sound', true), last: {} };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    const comp = C.createDynamicsCompressor(); comp.connect(C.destination);
    const m = C.createGain(); m.gain.value = AU.on ? 0.55 : 0; m.connect(comp);
    const b = C.createBuffer(1, C.sampleRate, C.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AU.ctx = C; AU.master = m; AU.noise = b;
  } catch (e) { }
}
function setSound(on) { AU.on = on; LS.set('sound', on); if (AU.master) AU.master.gain.value = on ? 0.55 : 0; $('sndBtn').textContent = on ? '🔊' : '🔇'; $('mSound').textContent = '音效：' + (on ? '开' : '关'); }
function outNode(pan) { const C = AU.ctx; if (pan == null || !C.createStereoPanner) return AU.master; const p = C.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(AU.master); return p; }
function tone(type, f0, f1, dur, vol, delay, lp, pan) {
  const C = AU.ctx; if (!C || !AU.on || vol < .002) return;
  const t0 = C.currentTime + (delay || 0), o = C.createOscillator(), g = C.createGain(), j = 1 + (Math.random() - 0.5) * 0.08;
  o.type = type; o.frequency.setValueAtTime(f0 * j, t0); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * j), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = g; if (lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; g.connect(f); out = f; }
  o.connect(g); out.connect(outNode(pan)); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol, ft, f0, f1, Q, delay, pan) {
  const C = AU.ctx; if (!C || !AU.on || vol < .002) return;
  const t0 = C.currentTime + (delay || 0), s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain();
  s.buffer = AU.noise; f.type = ft; f.Q.value = Q || 1; f.frequency.setValueAtTime(f0, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(outNode(pan)); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
}
// where a world point sits for the listener: volume 0..1 and pan -1..1
function spatial(x, y) {
  if (!G) return [1, 0];
  const p = G.mode === 'rt' ? G.pl[ME] : { x: CAM.x, y: CAM.y }, d = Math.hypot(x - p.x, y - p.y);
  const [sx] = P(x, y, 0); return [clamp(1.15 - d / 16, .12, 1), clamp((sx - W / 2) / (W / 2), -1, 1) * .8];
}
function sfx(k, a, b) {
  const now = performance.now(); if (AU.last[k] && now - AU.last[k] < 60) return; AU.last[k] = now;
  switch (k) {
    case 'click': tone('triangle', 880, 660, 0.05, 0.07); break;
    case 'knock': noise(0.08, 0.35, 'bandpass', 520, 300, 3); tone('sine', 190, 120, 0.12, 0.22); noise(0.06, 0.25, 'bandpass', 600, 380, 3, .13); tone('sine', 200, 125, 0.1, 0.16, .13); break;
    case 'empty': tone('triangle', 330, 180, 0.32, 0.12, .25); tone('triangle', 250, 140, 0.3, 0.08, .38); break;
    case 'near': tone('sine', 110, 104, 0.9, 0.16, .3); tone('sine', 165, 160, 0.9, 0.08, .3); break;
    case 'catch': noise(0.15, 0.3, 'highpass', 2000); [523, 659, 784, 1046].forEach((f, i) => tone('square', f, f, .16, .07, .1 + i * .08, 3000)); tone('triangle', 1318, 1318, .6, .12, .45); break;
    case 'poof': noise(0.28, 0.22, 'bandpass', 3200, 600, 1.4); tone('sine', 520, 1300, .18, .07); break;
    case 'unpoof': noise(0.2, 0.16, 'bandpass', 700, 2600, 1.4); break;
    case 'rot': noise(0.07, 0.1, 'bandpass', 1500, 900, 4); break;
    case 'whistle': {  // a: volume 0..1, b: pan
      const v = (a == null ? 1 : a) * .16, p = b || 0;
      tone('sine', 1650, 2300, .22, v, 0, 0, p); tone('sine', 2300, 1700, .25, v, .24, 0, p); tone('sine', 1700, 2500, .3, v, .5, 0, p); break;
    }
    case 'taunt': { const v = (a == null ? 1 : a) * .14, p = b || 0; [880, 660, 990, 740, 1180].forEach((f, i) => tone('square', f, f * 1.05, .1, v * .6, i * .09, 2400, p)); break; }
    case 'step': noise(0.05, (a || .5) * .12, 'lowpass', 500, 200, 1, 0, b); break;
    case 'scrape': noise(0.22, (a || .5) * .1, 'bandpass', 900, 500, 2, 0, b); break;
    case 'tick': tone('square', 1200, 1200, 0.04, 0.05, 0, 2500); break;
    case 'go': tone('triangle', 523, 523, .12, .1); tone('triangle', 784, 784, .2, .12, .12); break;
    case 'turn': tone('sine', 660, 990, 0.14, 0.08); break;
    case 'err': tone('square', 220, 180, 0.12, 0.06, 0, 1200); break;
    case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, i === 6 ? 0.8 : 0.22, 0.13, i * 0.13)); break;
    case 'lose': [392, 349, 311, 262].forEach((f, i) => tone('triangle', f, f, 0.4, 0.1, i * 0.2)); break;
    case 'ready': tone('sine', 660, 990, 0.14, 0.08); break;
  }
}
