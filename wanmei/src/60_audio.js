/* ================= synthesized audio (no files): sfx + a pentatonic guzheng/flute ambience ================= */
const AU = { ctx: null, master: null, sfxG: null, musG: null, noise: null, muted: LS.get('mute', false), last: {}, musT: 0, musOn: false, mood: 'calm' };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const c = AU.ctx; AU.master = c.createGain(); const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; AU.master.connect(comp); comp.connect(c.destination);
  AU.sfxG = c.createGain(); AU.sfxG.connect(AU.master); AU.musG = c.createGain(); AU.musG.connect(AU.master);
  const rev = c.createConvolver(); const L = c.sampleRate * 2.2, ir = c.createBuffer(2, L, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 2.6); } rev.buffer = ir; AU.rev = c.createGain(); AU.rev.gain.value = 0.35; AU.rev.connect(rev); rev.connect(AU.musG);
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; AU.noise = nb;
  setVol(); AU.musOn = true;
}
function setVol() { if (!AU.ctx) return; AU.master.gain.value = AU.muted ? 0 : SET.vol; AU.musG.gain.value = SET.music * 0.55; }
function setMute(m) { AU.muted = m; LS.set('mute', m); setVol(); toast(m ? '已静音（N 恢复）' : '声音已开启'); }
function tone(type, f0, f1, dur, vol, delay = 0, lp = 0, dest) { const c = AU.ctx; if (!c) return; const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); let n = o; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; } n.connect(g); g.connect(dest || AU.sfxG); o.start(t); o.stop(t + dur + 0.05); }
function noise(dur, vol, ft = 'lowpass', f0 = 1200, f1 = 0, Q = 1, delay = 0, dest) { const c = AU.ctx; if (!c) return; const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AU.noise; f.type = ft; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur); f.Q.value = Q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(dest || AU.sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); }
function sfx(k, o = {}) {
  if (!AU.ctx || AU.muted) return; const nowT = AU.ctx.currentTime; if (AU.last[k] && nowT - AU.last[k] < 0.045) return; AU.last[k] = nowT; const j = 1 + (Math.random() - 0.5) * 0.16, v = o.k || 0;
  switch (k) {
    case 'punch': noise(0.09, 0.5, 'lowpass', 900 * j, 200); tone('sine', 140 * j, 50, 0.12, 0.5); break;
    case 'hit': noise(0.08, 0.35 + v * 0.3, 'bandpass', 1400 * j, 500, 1.2); tone('triangle', 220 * j, 90, 0.1, 0.2); break;
    case 'hurt': noise(0.12, 0.4, 'lowpass', 700, 150); tone('sawtooth', 180 * j, 90, 0.15, 0.12, 0, 900); break;
    case 'whoosh': noise(0.16, 0.18, 'bandpass', 600 * j, 2400, 2); break;
    case 'bonk': tone('sine', 420 * j, 160, 0.12, 0.35); break;
    case 'peck': noise(0.05, 0.3, 'highpass', 2500); tone('square', 900 * j, 500, 0.05, 0.08); break;
    case 'bite': noise(0.1, 0.4, 'bandpass', 900, 300, 2); break;
    case 'moon': tone('sine', 900 * j, 1800, 0.25, 0.18); tone('triangle', 1350 * j, 2700, 0.3, 0.1, 0.03); noise(0.3, 0.12, 'highpass', 3000, 6000); break;
    case 'fire': noise(0.35, 0.3, 'bandpass', 800, 2400, 0.8); tone('sawtooth', 300 * j, 600, 0.2, 0.06, 0, 1500); break;
    case 'orb': tone('sine', 660 * j, 990, 0.2, 0.2); tone('sine', 990 * j, 1320, 0.25, 0.12, 0.05); break;
    case 'shield': tone('sine', 523, 523, 0.5, 0.15); tone('sine', 784, 784, 0.6, 0.12, 0.08); tone('sine', 1046, 1046, 0.7, 0.1, 0.16); break;
    case 'sniff': for (let i = 0; i < 3; i++) noise(0.06, 0.2, 'bandpass', 2000 + i * 300, 0, 3, i * 0.09); break;
    case 'lift': noise(0.4, 0.3, 'lowpass', 300, 120); tone('sine', 70, 50, 0.4, 0.4); break;
    case 'boom': noise(0.6, 0.7, 'lowpass', 600, 60); tone('sine', 90, 30, 0.6, 0.7); break;
    case 'bow': noise(0.12, 0.25, 'bandpass', 1800, 700, 3); tone('triangle', 320 * j, 120, 0.12, 0.12); break;
    case 'roar': noise(0.7, 0.45 + v * 0.3, 'bandpass', 300, 120, 1); tone('sawtooth', 110 * j, 60, 0.7, 0.18, 0, 500); break;
    case 'roar2': noise(1.0, 0.5, 'bandpass', 500, 200, 1); tone('sawtooth', 220, 110, 1.0, 0.2, 0, 1200); tone('sawtooth', 330, 140, 1.0, 0.12, 0.05, 1500); break;
    case 'jump': noise(0.08, 0.12, 'lowpass', 600); break;
    case 'land': noise(0.12, 0.3, 'lowpass', 300, 80); break;
    case 'die': tone('sawtooth', 200 * j, 60, 0.5, 0.15, 0, 800); noise(0.4, 0.25, 'lowpass', 500, 100); break;
    case 'down': tone('sine', 440, 110, 0.9, 0.3); break;
    case 'revive': [523, 659, 784, 1046].forEach((f, i) => tone('sine', f, f, 0.4, 0.15, i * 0.08)); break;
    case 'loot': tone('sine', 1320 * j, 1760, 0.12, 0.12); tone('sine', 1760 * j, 2200, 0.12, 0.08, 0.06); break;
    case 'drink': for (let i = 0; i < 3; i++) tone('sine', 300 + i * 40, 500, 0.08, 0.12, i * 0.12); break;
    case 'quest': [587, 784, 988].forEach((f, i) => tone('triangle', f, f, 0.25, 0.14, i * 0.09)); break;
    case 'questdone': [523, 659, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.35, 0.14, i * 0.08)); break;
    case 'levelup': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => { tone('triangle', f, f, 0.5, 0.15, i * 0.07); tone('sine', f * 2, f * 2, 0.4, 0.05, i * 0.07 + 0.02); }); break;
    case 'evolve': for (let i = 0; i < 12; i++) tone('sine', 300 + i * 90, 600 + i * 120, 0.3, 0.08, i * 0.06); noise(1.2, 0.2, 'highpass', 2000, 8000); break;
    case 'blip': tone('square', 1200 * j, 1200, 0.03, 0.03, 0, 2400); break;
    case 'ui': tone('triangle', 880, 880, 0.06, 0.08); break;
    case 'chapter': guzheng([0, 2, 4, 7, 9, 12], 0.12, 0.25); break;
    case 'tick': noise(0.04, 0.12, 'bandpass', 1500); break;
    case 'eagle': tone('sawtooth', 1800 * j, 900, 0.6, 0.12, 0, 3000); tone('sawtooth', 2100 * j, 1100, 0.5, 0.08, 0.05, 3000); break;
    case 'chirp': tone('sine', 2800 * j, 3600, 0.06, 0.06); tone('sine', 3200 * j, 2600, 0.07, 0.05, 0.08); break;
    case 'step': noise(0.05, 0.05, 'lowpass', 400); break;
    case 'glow': tone('sine', 528, 528, 1.5, 0.08); tone('sine', 792, 792, 1.5, 0.05, 0.2); break;
  }
}
/* ---------- music: generative pentatonic (宫商角徵羽) plucks over a bamboo-flute drone ---------- */
const PENTA = [0, 2, 4, 7, 9];
function guzheng(steps, gap = 0.18, vol = 0.18, base = 293.66) { if (!AU.ctx) return; steps.forEach((s, i) => { const f = base * Math.pow(2, s / 12); tone('triangle', f, f * 0.995, 1.4, vol, i * gap, 2600, AU.rev); tone('sine', f * 2, f * 2, 0.6, vol * 0.3, i * gap, 0, AU.rev); }); }
function flute(f, dur, vol, delay) { const c = AU.ctx; if (!c) return; const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 5; lg.gain.value = f * 0.008; lfo.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AU.rev); g.connect(AU.musG); o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1); noise(dur, vol * 0.15, 'bandpass', f * 2, 0, 6, delay, AU.rev); }
function tickMusic(dt) {
  if (!AU.ctx || !AU.musOn || AU.muted || SET.music <= 0) return; AU.musT -= dt; if (AU.musT > 0) return;
  const mood = AU.mood, base = mood === 'battle' ? 220 : mood === 'night' ? 196 : 293.66;
  if (mood === 'battle') { AU.musT = 1.6; for (let i = 0; i < 4; i++) { tone('sine', 70, 45, 0.3, 0.25, i * 0.4, 0, AU.musG); noise(0.08, 0.15, 'bandpass', 180, 0, 2, i * 0.4 + 0.2, AU.musG); } const s = PENTA[ri(0, 4)] + 12 * ri(0, 1); guzheng([s, s + 2 > 12 ? s : s + 2, PENTA[ri(0, 4)]], 0.2, 0.1, base); return; }
  AU.musT = rr(3.5, 7);
  const phrase = []; let p = ri(0, 4); for (let i = 0; i < ri(3, 6); i++) { p = clamp(p + ri(-2, 2), 0, 9); phrase.push(PENTA[p % 5] + 12 * Math.floor(p / 5)); }
  guzheng(phrase, rr(0.22, 0.38), 0.11, base);
  if (rnd() < 0.55) { const f = base * 2 * Math.pow(2, PENTA[ri(0, 4)] / 12); flute(f, rr(2.5, 4), 0.05, rr(0.3, 1.2)); }
}
