/* 剧本杀 · 合成音效（无音频文件） */
const AU = { ctx: null, out: null, noise: null, amb: 0, last: {} };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const c = AU.ctx = new C();
    const comp = c.createDynamicsCompressor(); AU.out = c.createGain(); AU.out.gain.value = .5; AU.out.connect(comp); comp.connect(c.destination);
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = b;
    ambLoop();
  } catch (e) { }
}
function tone(type, f0, f1, dur, vol, delay, lp) {
  const c = AU.ctx; if (!c || !OPT.sound) return; const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type; const j = 1 + (Math.random() - .5) * .08; o.frequency.setValueAtTime(f0 * j, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1 * j, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let n = o; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
  n.connect(g); g.connect(AU.out); o.start(t); o.stop(t + dur + .05);
}
function noise(dur, vol, type, f0, f1, Q, delay) {
  const c = AU.ctx; if (!c || !OPT.sound) return; const t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AU.noise; f.type = type || 'bandpass'; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = Q || 1;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(g); g.connect(AU.out); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
}
const SFX = {
  tick() { tone('sine', 880, 660, .06, .05); },
  page() { noise(.35, .12, 'highpass', 2500, 6000, .7); },
  fact() { tone('triangle', 660, 0, .25, .08); tone('triangle', 990, 0, .35, .06, .08); },
  break() { tone('sine', 220, 110, .9, .18, 0, 900); tone('triangle', 440, 0, .6, .08, .05); noise(.5, .08, 'lowpass', 400, 120); },
  contra() { tone('square', 330, 0, .12, .06, 0, 1600); tone('square', 247, 0, .3, .06, .12, 1600); },
  bell() { [523, 784, 1046].forEach((f, i) => tone('sine', f, 0, 1.4, .07, i * .02)); }
};
function sfx(k) { if (!AU.ctx || !OPT.sound) return; const now = performance.now(); if (AU.last[k] && now - AU.last[k] < 70) return; AU.last[k] = now; try { SFX[k] && SFX[k](); } catch (e) { } }
/* 夜里的虫鸣：讨论和搜证时轻轻地响 */
function ambLoop() {
  clearTimeout(AU.amb); AU.amb = setTimeout(ambLoop, 900 + Math.random() * 2600);
  if (!OPT.sound || document.hidden || !AU.ctx) return; const scr = document.body.dataset.scr;
  if (!['title', 'r1', 'r2', 'd1', 'd2', 'intro', 'setup'].includes(scr)) return;
  const f = 4200 + Math.random() * 900; for (let i = 0; i < 3 + (Math.random() * 3 | 0); i++) tone('sine', f, f * .98, .05, .012, i * .085);
}
addEventListener('pointerdown', auInit, { passive: true });
addEventListener('keydown', auInit);
