/* ================= background music: synthesised live, four moods (village, wild, battle, 补天阁) + 虚神界 =================
   A small step sequencer on Web Audio: pentatonic random-walk melody over a slow chord loop. No audio files. */
const MUS = { cur: null, bus: null, timer: 0, t: 0, step: 0, last: 0, chord: 0 };
const MOODS = {
  village: { bpm: 78, root: 62, scale: [0, 2, 4, 7, 9], prog: [0, 5, -3, 7], lead: 'triangle', lp: 2600, dens: 0.55, bass: 1, pad: 0.03 },
  wild: { bpm: 58, root: 57, scale: [0, 3, 5, 7, 10], prog: [0, -2, 3, -4], lead: 'sine', lp: 1800, dens: 0.28, drone: 1, pad: 0.025 },
  battle: { bpm: 136, root: 52, scale: [0, 3, 5, 7, 10], prog: [0, 0, 3, -2], lead: 'sawtooth', lp: 1500, dens: 0.6, bass: 2, drums: 1 },
  butian: { bpm: 66, root: 60, scale: [0, 2, 5, 7, 9], prog: [0, 5, 2, 7], lead: 'sine', lp: 3200, dens: 0.35, bell: 1, pad: 0.03 },
  court: { bpm: 72, root: 57, scale: [0, 2, 4, 7, 9], prog: [0, 7, 5, 2], lead: 'triangle', lp: 2800, dens: 0.4, bell: 1, pad: 0.03 },
  fire: { bpm: 84, root: 55, scale: [0, 3, 5, 7, 10], prog: [0, 5, 3, 7], lead: 'triangle', lp: 2200, dens: 0.45, drone: 1, pad: 0.03 },
  boss: { bpm: 148, root: 50, scale: [0, 1, 5, 7, 8], prog: [0, -4, 1, -2], lead: 'sawtooth', lp: 2000, dens: 0.72, bass: 2, drums: 1, pad: 0.03 },
  xushen: { bpm: 52, root: 64, scale: [0, 2, 4, 7, 11], prog: [0, 4, -3, 2], lead: 'sine', lp: 4000, dens: 0.3, bell: 1, pad: 0.035 },
};
const mfreq = m => 440 * Math.pow(2, (m - 69) / 12);
function mvoice(type, m, t, dur, vol, lp = 0, att = 0.01) {
  const X = AU.ctx, o = X.createOscillator(), g = X.createGain(); o.type = type; o.frequency.value = mfreq(m);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o; if (lp) { const f = X.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; } n.connect(g); g.connect(MUS.bus); o.start(t); o.stop(t + dur + 0.05);
}
function mnoise(t, dur, vol, type, f) { const X = AU.ctx, s = X.createBufferSource(), fl = X.createBiquadFilter(), g = X.createGain(); s.buffer = AU.noise; fl.type = type; fl.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(MUS.bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); }
function musicWanted() { if (!SET.music || SET.mute || STATE.mode !== 'play' || !C || !AU.ctx) return null; if (STATE.battle) return STATE.battle.epic ? 'boss' : 'battle'; const a = PLACES[C.loc].area; return { shicun: 'village', dahuang: 'wild', baiduan: 'wild', butian: 'butian', xushen: 'xushen', shiguo: 'court', huoguo: 'fire' }[a] || 'wild'; }
function musicMode() {
  const want = musicWanted(); if (want === MUS.cur) return; const X = AU.ctx; if (!X) return;
  if (!MUS.bus) { MUS.bus = X.createGain(); MUS.bus.gain.value = 0; MUS.bus.connect(AU.master); }
  const g = MUS.bus.gain, t = X.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.4);
  MUS.cur = want; clearInterval(MUS.timer); MUS.timer = 0; if (!want) return;
  setTimeout(() => { if (MUS.cur !== want) return; MUS.t = X.currentTime + 0.05; MUS.step = 0; MUS.last = 2; const t2 = X.currentTime; g.cancelScheduledValues(t2); g.setValueAtTime(0, t2); g.linearRampToValueAtTime(want === 'battle' || want === 'boss' ? 0.3 : 0.26, t2 + 1.2); MUS.timer = setInterval(musicTick, 90); }, 450);
}
function musicTick() {
  const X = AU.ctx, M = MOODS[MUS.cur]; if (!X || !M) return; const sd = 60 / M.bpm / 2;
  while (MUS.t < X.currentTime + 0.35) { const t = MUS.t, s = MUS.step % 32, bar = Math.floor(s / 8), beat = s % 8, root = M.root + M.prog[bar];
    if (beat === 0) { MUS.chord = root; if (M.pad) for (const iv of [0, 7, 12]) mvoice('triangle', root - 12 + iv, t, sd * 8.5, M.pad, 900, 0.4); if (M.drone) mvoice('sine', root - 24, t, sd * 16, 0.06, 400, 0.8); }
    if (M.bass === 1 && (beat === 0 || beat === 4)) mvoice('triangle', root - 24, t, sd * 3, 0.09, 600);
    if (M.bass === 2 && beat % 2 === 0) mvoice('square', root - 24 + (beat === 6 ? 7 : 0), t, sd * 0.9, 0.05, 500);
    if (M.drums) { if (beat === 0 || beat === 4 || (beat === 7 && Math.random() < 0.4)) { mvoice('sine', 50, t, 0.18, 0.22); } if (beat === 2 || beat === 6) mnoise(t, 0.12, 0.12, 'bandpass', 1800); mnoise(t, 0.04, 0.03, 'highpass', 7000); }
    if (Math.random() < M.dens && !(beat % 2 && Math.random() < 0.5)) { MUS.last = clamp(MUS.last + pick([-2, -1, -1, 0, 1, 1, 2]), 0, M.scale.length * 2 - 1); const deg = MUS.last, m = root + M.scale[deg % M.scale.length] + 12 * Math.floor(deg / M.scale.length);
      const len = sd * pick([1, 1, 2, 2, 3]); mvoice(M.lead, m, t, len * 1.1, M.lead === 'sawtooth' ? 0.035 : 0.07, M.lp); if (M.bell && Math.random() < 0.35) mvoice('sine', m + 24, t, len * 2.5, 0.025, 0, 0.003); }
    MUS.t += sd; MUS.step++; }
}
