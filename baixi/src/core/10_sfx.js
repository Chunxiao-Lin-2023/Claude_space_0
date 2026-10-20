/* ===================== synthesized sound effects (Web Audio, no files) ===================== */
BX.sfx = (function () {
  let ac = null, master = null, noiseBuf = null;
  let muted = BX.store.get('mute', false);
  const last = {};
  function init() {
    if (ac) return true;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6;
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(comp); comp.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { return false; }
  }
  const unlock = () => { if (init() && ac.state === 'suspended') ac.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(t => addEventListener(t, unlock, {passive: true}));
  const J = () => 1 + (Math.random() - .5) * .16;
  function tone(type, f0, f1, dur, vol = .3, delay = 0, lp = 0) {
    if (!ac) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.012, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = o; if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
    n.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, vol = .3, ft = 'bandpass', f0 = 1000, f1 = 0, Q = 1, delay = 0) {
    if (!ac) return; const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = ft; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = Q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
  }
  const notes = (arr, type = 'triangle', step = .09, vol = .22, dur = .22) => arr.forEach((f, i) => tone(type, f, f, dur, vol, i * step));
  const S = {
    click: () => { tone('square', 900 * J(), 600, .04, .08, 0, 3000); },
    select: () => { tone('triangle', 660 * J(), 880, .08, .15); },
    place: () => { noise(.06, .5, 'bandpass', 1800 * J(), 900, 3); tone('sine', 220 * J(), 140, .08, .25); },   // wooden piece on board
    stone: () => { noise(.035, .55, 'highpass', 3000 * J(), 0, .7); tone('sine', 1300 * J(), 900, .05, .18); },   // go stone clack
    move: () => { noise(.12, .18, 'lowpass', 900 * J(), 300, 1); },
    capture: () => { noise(.08, .5, 'bandpass', 1200 * J(), 500, 2); tone('square', 180 * J(), 90, .12, .14, 0, 1200); },
    card: () => { noise(.07, .35, 'highpass', 2500 * J(), 5000, .8); },
    deal: () => { for (let i = 0; i < 4; i++) noise(.05, .25, 'highpass', 3000 * J(), 0, .8, i * .06); },
    shuffle: () => { for (let i = 0; i < 10; i++) noise(.04, .2, 'highpass', 2500 + Math.random() * 2000, 0, .8, i * .035); },
    flip: () => { noise(.05, .3, 'bandpass', 3000 * J(), 1500, 1.5); },
    dice: () => { for (let i = 0; i < 7; i++) { noise(.03, .35, 'bandpass', 2200 + Math.random() * 1600, 0, 4, i * .045 + Math.random() * .02); } },
    coin: () => { tone('square', 988, 988, .08, .1, 0, 4000); tone('square', 1319, 1319, .25, .1, .08, 4000); },
    chip: () => { tone('sine', 2600 * J(), 2200, .05, .12); noise(.03, .2, 'highpass', 4000, 0, 1); },
    tick: () => { tone('sine', 1500, 1500, .03, .1); },
    bell: () => { tone('sine', 880, 880, .9, .2); tone('sine', 1760, 1760, .6, .06); },
    whoosh: () => { noise(.25, .25, 'bandpass', 400, 2400, 1.2); },
    hit: () => { noise(.07, .5, 'lowpass', 1500 * J(), 400, 1); tone('sine', 160 * J(), 80, .1, .3); },
    bounce: () => { tone('sine', 500 * J(), 260, .08, .22); },
    pop: () => { tone('sine', 400 * J(), 1200, .07, .2); },
    buzz: () => { tone('sawtooth', 140, 120, .22, .12, 0, 900); },
    error: () => { tone('square', 220, 180, .14, .09, 0, 1500); tone('square', 180, 150, .16, .09, .1, 1500); },
    score: () => notes([660, 880, 1100], 'triangle', .07, .18, .18),
    start: () => notes([392, 523, 659, 784], 'triangle', .08, .18, .25),
    win: () => notes([523, 659, 784, 1047, 1319], 'triangle', .1, .22, .35),
    lose: () => notes([392, 330, 262, 196], 'sine', .14, .2, .35),
    draw: () => notes([440, 440, 494], 'sine', .12, .15, .25),
    your: () => notes([784, 1047], 'sine', .08, .14, .2),
    gong: () => { tone('sine', 140, 120, 1.6, .35); tone('triangle', 280, 250, 1.2, .12); noise(.4, .15, 'bandpass', 600, 300, 2); },
    splash: () => { noise(.35, .3, 'lowpass', 2500, 300, .8); },
    crash: () => { noise(.5, .5, 'lowpass', 3000, 200, .7); tone('sawtooth', 90, 40, .4, .15, 0, 600); },
    boom: () => { noise(.7, .6, 'lowpass', 1200, 60, .7); tone('sine', 90, 30, .6, .45); },
    roll: () => { noise(.5, .15, 'lowpass', 400, 200, 1); },
    swish: () => { noise(.15, .25, 'highpass', 1500, 4000, .7); },
    pen: () => { noise(.03, .06, 'highpass', 4000, 0, .5); },
  };
  function play(name, opt) {
    if (muted || BX.fastReplay) return; if (!init()) return;
    const now = performance.now(); if (last[name] && now - last[name] < 35) return; last[name] = now;
    try { (S[name] || S.click)(opt); } catch (e) {}
  }
  return {
    play, tone: (...a) => { if (!muted && init()) tone(...a); }, noise: (...a) => { if (!muted && init()) noise(...a); }, names: Object.keys(S),
    get muted() { return muted; },
    setMuted(m) { muted = !!m; BX.store.set('mute', muted); if (master) master.gain.value = muted ? 0 : .5; document.dispatchEvent(new Event('bx-mute')); },
    toggle() { this.setMuted(!muted); return muted; },
  };
})();
