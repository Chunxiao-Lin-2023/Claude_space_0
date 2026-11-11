'use strict';
/* 我有一座恐怖屋 · 陈歌篇 —— 基础工具、设置、合成音效 */
const $ = (s, r) => (r || document).querySelector(s), QS = new URLSearchParams(location.search);
const HUB = /\/kongbuwu\/(index\.html)?$/.test(location.pathname);
const PREFIX = 'kbw.';
const store = { get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) {} } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = () => (window.__dbg && __dbg.rng ? __dbg.rng() : Math.random());
const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[Math.floor(rnd() * a.length)], chance = p => rnd() < p;
const BAGS = {}; /* 洗牌袋：一组话全说过一遍才会重复 */
function pickFresh(key, arr) { let b = BAGS[key]; if (!b || !b.length) { b = BAGS[key] = arr.map((_, i) => i).sort(() => rnd() - .5); } return arr[b.pop()]; }
function srng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, (window.__dbg && __dbg.instant) ? 0 : ms));
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const SET = Object.assign({ motion: 1, scare: 1, snd: 1, mus: 1, font: 0, diff: 1 }, store.get('set', {}));
function saveSet() { store.set('set', SET); }

/* —— 声音：全部现场合成，没有音频文件 —— */
const AU = { ctx: null, master: null, noiseBuf: null, last: {} };
function audioInit() {
  if (AU.ctx || !SET.snd && !SET.mus) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { const c = AU.ctx = new AC(); AU.master = c.createGain(); AU.master.gain.value = .5; const comp = c.createDynamicsCompressor(); AU.master.connect(comp); comp.connect(c.destination);
    const b = AU.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } catch (e) { AU.ctx = null; }
}
function tone(type, f0, f1, dur, vol, delay, lp) { const c = AU.ctx; if (!c || !SET.snd) return; const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain(); o.type = type; const j = 1 + (Math.random() - .5) * .06;
  o.frequency.setValueAtTime(f0 * j, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * j), t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  let n = o; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; } n.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + .05); }
function noise(dur, vol, ft, f0, f1, q, delay) { const c = AU.ctx; if (!c || !SET.snd) return; const t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AU.noiseBuf; s.loop = true; f.type = ft || 'lowpass'; f.Q.value = q || 1;
  f.frequency.setValueAtTime(f0 || 800, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(f); f.connect(g); g.connect(AU.master); s.start(t); s.stop(t + dur + .05); }
const SFX = {
  tap() { tone('sine', 520, 380, .05, .05); }, page() { noise(.07, .05, 'highpass', 2500, 1200); }, ok() { tone('triangle', 520, 780, .12, .09); tone('triangle', 780, 1040, .14, .07, .09); },
  bad() { tone('sawtooth', 160, 90, .22, .09, 0, 600); }, hit() { noise(.09, .22, 'lowpass', 900, 200); tone('square', 120, 50, .1, .12, 0, 400); }, heavy() { noise(.2, .32, 'lowpass', 600, 80); tone('sine', 90, 35, .28, .3); },
  blade() { noise(.08, .16, 'highpass', 3000, 6000, 2); }, hurt() { tone('sawtooth', 220, 110, .16, .1, 0, 900); noise(.06, .1, 'lowpass', 500, 200); }, miss() { noise(.1, .05, 'highpass', 1800, 3600); },
  scream() { tone('sawtooth', 700, 1500, .18, .1, 0, 3000); tone('sawtooth', 1500, 500, .4, .1, .16, 3000); }, guard() { tone('triangle', 200, 260, .1, .1); },
  phone() { tone('sine', 1320, 1320, .09, .1); tone('sine', 1320, 1320, .09, .1, .16); noise(.3, .02, 'bandpass', 160, 160, 3); }, coin() { tone('square', 1200, 1600, .06, .05); tone('square', 1600, 2100, .09, .05, .06); },
  heart() { tone('sine', 62, 40, .12, .35); tone('sine', 55, 36, .14, .28, .2); }, door() { tone('sawtooth', 70, 110, .5, .06, 0, 300); noise(.5, .05, 'bandpass', 300, 500, 6); }, knock() { for (let i = 0; i < 3; i++) { noise(.05, .3, 'lowpass', 300, 120, 1, i * .28); tone('sine', 110, 60, .08, .2, i * .28); } },
  drip() { tone('sine', 1500, 600, .07, .06); }, wind() { noise(1.6, .05, 'bandpass', 300, 700, 2); }, cat() { tone('sawtooth', 620, 900, .16, .07, 0, 2400); tone('sawtooth', 900, 520, .3, .07, .15, 2400); },
  stinger() { noise(.5, .5, 'bandpass', 2600, 500, .7); tone('sawtooth', 66, 49, .7, .32); tone('square', 1400, 240, .32, .12, 0, 2600); tone('sawtooth', 933, 880, .6, .08, .02); },
  static() { noise(.4, .08, 'highpass', 4000, 6000); }, spin() { tone('square', 500, 500, .03, .05); }, big() { tone('triangle', 392, 392, .3, .1); tone('triangle', 523, 523, .3, .1, .12); tone('triangle', 784, 784, .5, .12, .24); }, chalk() { noise(.25, .04, 'bandpass', 2400, 3200, 8); }
};
function sfx(n) { const now = performance.now(); if (now - (AU.last[n] || 0) < 45) return; AU.last[n] = now; audioInit(); try { SFX[n] && SFX[n](); } catch (e) {} }

/* —— 背景氛围：很低的持续音 + 稀疏的音符，按情境切换 —— */
const MUS = { mood: '', t: 0, step: 0, drone: null };
const MOODS = { /* [根音Hz, 音阶半音, 每步秒, 音量, 音色] */
  day: [196, [0, 4, 7, 9, 12, 7], .62, .05, 'triangle'], house: [110, [0, 3, 7, 8, 12, 3], 1.1, .045, 'sine'], night: [82, [0, 1, 6, 7, 1, 0], 1.7, .05, 'sine'],
  fight: [98, [0, 3, 5, 6, 7, 10, 6, 3], .3, .06, 'sawtooth'], scare: [147, [0, 4, 7, 4, 12, 7, 4, 0], .26, .05, 'square'], door: [61, [0, 6, 1, 7], 2.2, .06, 'sine'], phone: [73, [0, 1], 2.6, .05, 'sine']
};
function musicMode(m) { if (MUS.mood === m) return; MUS.mood = m; MUS.step = 0; }
function musicTick() { const c = AU.ctx; if (!c || !SET.mus || !MUS.mood || document.hidden) return; const M = MOODS[MUS.mood]; if (!M) return; const now = c.currentTime; if (now < MUS.t) return; MUS.t = now + M[2];
  const semi = M[1][MUS.step++ % M[1].length], f = M[0] * Math.pow(2, semi / 12); const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = M[4]; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = M[4] === 'sine' ? 900 : 1300;
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(M[3], now + .05); g.gain.exponentialRampToValueAtTime(.0006, now + M[2] * 1.8); o.connect(lp); lp.connect(g); g.connect(AU.master); o.start(now); o.stop(now + M[2] * 1.9);
  if (MUS.step % 4 === 1) { const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'sine'; o2.frequency.value = M[0] / 2; g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(M[3] * .9, now + .3); g2.gain.exponentialRampToValueAtTime(.0006, now + M[2] * 4); o2.connect(g2); g2.connect(AU.master); o2.start(now); o2.stop(now + M[2] * 4.1); }
}
setInterval(musicTick, 90);
