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

/* —— 声音：全部现场合成，没有音频文件。v2：混响、左右声道、恐怖氛围分层 —— */
const AU = { ctx: null, master: null, noiseBuf: null, verbIn: null, musBus: null, last: {} };
/* 混响用的冲激响应：一段越来越暗、慢慢消失的噪声（像空旷的走廊） */
function auGraph(c) { const g = {}; g.master = c.createGain(); g.master.gain.value = .55; const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; g.master.connect(comp); comp.connect(c.destination);
  const len = Math.floor(c.sampleRate * 3.4), ir = c.createBuffer(2, len, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const k = i / len; lp += ((Math.random() * 2 - 1) - lp) * (.5 - .42 * k); d[i] = lp * Math.pow(1 - k, 2.6) * (i < c.sampleRate * .012 ? i / (c.sampleRate * .012) : 1); } }
  const cv = c.createConvolver(); cv.buffer = ir; g.verbIn = c.createGain(); g.verbIn.gain.value = 1; const vo = c.createGain(); vo.gain.value = .85; g.verbIn.connect(cv); cv.connect(vo); vo.connect(g.master);
  g.musBus = c.createGain(); g.musBus.gain.value = SET.mus ? 1 : 0; g.musBus.connect(g.master); const ms = c.createGain(); ms.gain.value = .55; g.musBus.connect(ms); ms.connect(g.verbIn);
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), dd = b.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; g.noiseBuf = b; return g; }
function audioInit() { if (AU.ctx || !SET.snd && !SET.mus) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { const c = AU.ctx = new AC(); Object.assign(AU, auGraph(c)); } catch (e) { AU.ctx = null; } }
/* 一个声音：振荡器或噪声 → 滤波 → 包络 → 声像 → 干声 + 混响 */
function V(o) { const c = AU.ctx; if (!c) return; if (o.mus ? !SET.mus : !SET.snd) return; const t = (o.at != null ? o.at : c.currentTime + (AU.off || 0)) + (o.delay || 0), dur = o.dur || .3, vol = (o.vol || .1) * (AU.gm || 1); let src;
  if (o.noise) { src = c.createBufferSource(); src.buffer = AU.noiseBuf; src.loop = true; src.playbackRate.value = o.rate || 1; }
  else { src = c.createOscillator(); src.type = o.type || 'sine'; const j = o.exact ? 1 : 1 + (Math.random() - .5) * .03; src.frequency.setValueAtTime(o.f0 * j, t); if (o.f1) src.frequency[o.lin ? 'linearRampToValueAtTime' : 'exponentialRampToValueAtTime'](Math.max(20, o.f1 * j), t + dur * (o.glide || 1)); if (o.det) src.detune.value = o.det;
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(src.frequency); l.start(t); l.stop(t + dur + .1); } }
  let n = src; const filt = (type, f0, f1, q) => { const f = c.createBiquadFilter(); f.type = type; f.Q.value = q || .8; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); n.connect(f); n = f; };
  if (o.hp) filt('highpass', o.hp); if (o.lp) filt('lowpass', o.lp, o.lp1, o.lq);
  if (o.bp2) { const sum = c.createGain(); for (const fr of [o.bp, o.bp2]) { const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = o.q || 4; n.connect(f); f.connect(sum); } n = sum; } else if (o.bp) filt('bandpass', o.bp, o.bp1, o.q || 4);
  const g = c.createGain(), at = o.att != null ? o.att : .008; g.gain.setValueAtTime(0, t);
  if (o.swell) { g.gain.linearRampToValueAtTime(vol, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .03); }
  else { g.gain.linearRampToValueAtTime(vol, t + at); if (o.hold) g.gain.setValueAtTime(vol, t + at + o.hold); g.gain.exponentialRampToValueAtTime(.0006, t + dur); }
  if (o.am) { const l = c.createOscillator(), lg = c.createGain(), ag = c.createGain(); l.type = o.am[2] || 'sine'; l.frequency.value = o.am[0]; lg.gain.value = o.am[1] * .5; ag.gain.value = 1 - o.am[1] * .5; l.connect(lg); lg.connect(ag.gain); n.connect(ag); n = ag; l.start(t); l.stop(t + dur + .1); }
  n.connect(g); let out = g; if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.setValueAtTime(o.pan, t); if (o.pan1 != null) p.pan.linearRampToValueAtTime(o.pan1, t + dur); g.connect(p); out = p; }
  out.connect(o.mus ? AU.musBus : AU.master); if (o.rv) { const s = c.createGain(); s.gain.value = o.rv; out.connect(s); s.connect(AU.verbIn); }
  src.start(t); src.stop(t + dur + (o.swell ? .06 : .05)); }
/* 旧接口照旧能用 */
function tone(type, f0, f1, dur, vol, delay, lp) { V({ type, f0, f1, dur, vol, delay, lp, rv: .12 }); }
function noise(dur, vol, ft, f0, f1, q, delay) { V({ noise: 1, dur, vol, delay, [ft === 'highpass' ? 'hp' : ft === 'bandpass' ? 'bp' : 'lp']: f0 || 800, bp1: ft === 'bandpass' ? f1 : undefined, lp1: ft === 'lowpass' || !ft ? f1 : undefined, q, att: .004, rv: .1 }); }
const rnd2 = (a, b) => a + Math.random() * (b - a), side = () => (Math.random() < .5 ? -1 : 1) * rnd2(.4, .9);
const SFX = {
  tap() { V({ f0: 520, f1: 380, dur: .05, vol: .05 }); }, page() { V({ noise: 1, hp: 2500, dur: .07, vol: .05 }); }, ok() { V({ type: 'triangle', f0: 520, f1: 780, dur: .12, vol: .08, rv: .2 }); V({ type: 'triangle', f0: 780, f1: 1040, dur: .14, vol: .06, delay: .09, rv: .2 }); },
  bad() { V({ type: 'sawtooth', f0: 160, f1: 90, dur: .25, vol: .08, lp: 600, rv: .2 }); }, hit() { V({ noise: 1, lp: 900, lp1: 200, dur: .1, vol: .22 }); V({ type: 'square', f0: 120, f1: 50, dur: .12, vol: .1, lp: 400 }); },
  heavy() { V({ noise: 1, lp: 600, lp1: 80, dur: .25, vol: .32, rv: .25 }); V({ f0: 90, f1: 32, dur: .4, vol: .32 }); }, blade() { V({ noise: 1, hp: 3000, bp: 5000, q: 2, dur: .09, vol: .16, rv: .15 }); },
  hurt() { V({ type: 'sawtooth', f0: 220, f1: 110, dur: .18, vol: .09, lp: 900 }); V({ noise: 1, lp: 500, dur: .07, vol: .1 }); }, miss() { V({ noise: 1, hp: 1800, dur: .12, vol: .05, pan: side() }); },
  guard() { V({ type: 'triangle', f0: 200, f1: 260, dur: .1, vol: .1 }); }, coin() { V({ type: 'square', f0: 1200, f1: 1600, dur: .06, vol: .04 }); V({ type: 'square', f0: 1600, f1: 2100, dur: .09, vol: .04, delay: .06 }); },
  spin() { V({ type: 'square', f0: 500, dur: .03, vol: .04 }); }, big() { [392, 523, 784].forEach((f, i) => V({ type: 'triangle', f0: f, dur: .4, vol: .09, delay: i * .12, rv: .3, exact: 1 })); }, chalk() { V({ noise: 1, bp: 2600, q: 8, dur: .25, vol: .05, am: [28, .8] }); },
  phone() { V({ f0: 1320, dur: .09, vol: .09, exact: 1 }); V({ f0: 1320, dur: .09, vol: .09, delay: .16, exact: 1 }); V({ noise: 1, bp: 160, q: 3, dur: .35, vol: .03 }); },
  static() { V({ noise: 1, hp: 3000, dur: .45, vol: .07, am: [37, .7, 'square'] }); },
  /* —— 心跳：低沉的“扑通”，有分量 —— */
  heart() { for (const [d, v] of [[0, .5], [.2, .36]]) { V({ f0: 58, f1: 36, dur: .16, vol: v, delay: d, lp: 140 }); V({ noise: 1, lp: 180, dur: .05, vol: v * .5, delay: d }); } },
  /* —— 惊吓的重击：不协和的弦乐群 + 尖啸 + 低频下坠，混响很长 —— */
  stinger() { [0, 1, 6, 7, 13, 18].forEach(s => V({ type: 'sawtooth', f0: 110 * Math.pow(2, s / 12), f1: 104 * Math.pow(2, s / 12), dur: 1.5, vol: .07, lp: 2600, lp1: 600, att: .004, rv: .7, pan: rnd2(-.6, .6) }));
    V({ type: 'sawtooth', f0: 1900, f1: 2500, dur: 1.1, vol: .05, vib: [9, 60], bp: 2200, q: 2, rv: .8 }); V({ noise: 1, bp: 1800, bp1: 400, q: .7, dur: .6, vol: .45, att: .002, rv: .6 }); V({ f0: 62, f1: 26, dur: 1.4, vol: .5, att: .003 }); },
  /* 倒放的“吸气”：惊吓前一秒越来越响，然后戛然而止 */
  reverse() { [0, 1, 6, 11].forEach(s => V({ type: 'sawtooth', f0: 98 * Math.pow(2, s / 12), dur: .9, vol: .06, lp: 1400, swell: 1, rv: .3 })); V({ noise: 1, bp: 900, q: .8, dur: .9, vol: .2, swell: 1 }); },
  /* 镜子裂开：越来越密的脆响 + 玻璃的回音 */
  crack() { for (let i = 0; i < 7; i++) { const d = i * (.11 - i * .012); V({ noise: 1, hp: 2600, dur: .03, vol: .2 + i * .02, att: .001, delay: d, rv: .5, pan: rnd2(-.3, .3) }); V({ f0: rnd2(3800, 6200), dur: .5, vol: .025, delay: d, rv: .8, exact: 1 }); } V({ f0: 70, f1: 40, dur: .4, vol: .15, delay: .5 }); },
  shatter() { for (let i = 0; i < 18; i++) { const d = rnd2(0, .6); V({ noise: 1, hp: 3000, dur: .05, vol: .16, att: .001, delay: d, pan: rnd2(-.9, .9), rv: .5 }); V({ f0: rnd2(3000, 7500), dur: rnd2(.3, .9), vol: .02, delay: d, rv: .7, exact: 1 }); } V({ noise: 1, lp: 400, dur: .5, vol: .25 }); },
  /* 耳语：像人说话的气声，左右飘，听不清在说什么 */
  whisper() { const p = side(); for (let i = 0; i < 7; i++) { const d = i * rnd2(.14, .22); V({ noise: 1, bp: rnd2(700, 1100), bp2: rnd2(2000, 2900), q: 7, dur: rnd2(.12, .22), vol: .09, att: .03, delay: d, pan: p, pan1: p * .7, rv: .55 }); } },
  /* 呼吸：贴着耳朵，先吸后呼 */
  breath() { const p = rnd2(.5, .8) * (Math.random() < .5 ? -1 : 1); V({ noise: 1, bp: 800, bp1: 1500, q: 1.3, dur: .8, vol: .12, swell: 1, pan: p, rv: .08 }); V({ noise: 1, bp: 1300, bp1: 500, q: 1.1, dur: 1.1, vol: .12, att: .08, delay: .85, pan: p, rv: .08 }); },
  /* 脚步：很重、很慢，从一边走到另一边 */
  steps() { const a = side(); for (let i = 0; i < 3; i++) { const pn = a + (-a * 2) * i / 3; V({ noise: 1, lp: 340, lp1: 90, dur: .14, vol: .26, att: .003, delay: i * .62, pan: pn, rv: .5 }); V({ f0: 72, f1: 44, dur: .14, vol: .18, delay: i * .62, pan: pn }); } },
  /* 门轴的吱呀：一顿一顿的摩擦 */
  creak() { V({ type: 'sawtooth', f0: 95, f1: 150, dur: 1.3, vol: .06, bp: 700, q: 3, am: [34, .9, 'square'], rv: .5, pan: side(), lin: 1 }); V({ type: 'sawtooth', f0: 150, f1: 88, dur: .7, vol: .05, bp: 600, q: 3, am: [46, .9, 'square'], delay: 1.2, rv: .5 }); },
  door() { AU.gm = SFX_GAIN.creak; SFX.creak(); AU.gm = 1; V({ noise: 1, lp: 300, dur: .2, vol: .3, delay: 1.9, rv: .5 }); V({ f0: 80, f1: 40, dur: .3, vol: .25, delay: 1.9 }); },
  /* 敲门：木头的闷响，混在走廊的回声里 */
  knock() { for (let i = 0; i < 3; i++) { V({ noise: 1, lp: 1200, lp1: 300, dur: .07, vol: .4, att: .001, delay: i * .3, rv: .5 }); V({ noise: 1, bp: 190, q: 8, dur: .12, vol: .35, delay: i * .3, rv: .4 }); V({ f0: 140, f1: 90, dur: .09, vol: .18, delay: i * .3 }); } },
  /* 水滴：往上挑的“咚”，空荡荡的 */
  drip() { V({ f0: 700, f1: 1700, dur: .06, vol: .09, rv: .8, pan: rnd2(-.5, .5) }); },
  wind() { V({ noise: 1, bp: 300, bp1: 800, q: 2, dur: 2.2, vol: .08, swell: 0, att: .8, rv: .3, pan: -.6, pan1: .6 }); },
  /* 小孩的笑声：从远处传来 */
  giggle() { const p = side(); [1180, 1250, 1120, 1320, 1050].forEach((f, i) => V({ type: 'triangle', f0: f, f1: f * .9, dur: .1, vol: .05, delay: i * .11, vib: [8, 25], bp: 1400, q: 1.5, pan: p, rv: .75 })); },
  /* 女人的尖叫/哀嚎：带颤音、带共鸣 */
  scream() { V({ type: 'sawtooth', f0: 520, f1: 1150, dur: 1.2, vol: .08, vib: [6.5, 35], bp: 1100, q: 3, rv: .7, glide: .5 }); V({ type: 'sawtooth', f0: 760, f1: 1500, dur: 1.1, vol: .05, vib: [7, 40], bp: 2400, q: 4, rv: .7 }); V({ noise: 1, bp: 1800, q: 2, dur: 1, vol: .08, rv: .5 }); },
  /* 指甲刮玻璃 */
  scrape() { V({ noise: 1, bp: 2900, q: 14, dur: 1, vol: .14, am: [31, .9, 'square'], rv: .4, pan: side() }); V({ type: 'sawtooth', f0: 2300, f1: 2100, dur: 1, vol: .02, bp: 2300, q: 8, am: [31, .9, 'square'] }); },
  /* 走调的哼歌：每个音都低一点点，有回声 */
  hum() { [392, 370, 349, 330, 311, 330].forEach((f, i) => { V({ f0: f, f1: f * .985, dur: .5, vol: .045, delay: i * .44, lp: 900, vib: [5, 3], rv: .8, pan: -.3 }); V({ f0: f * 1.006, dur: .5, vol: .02, delay: i * .44, lp: 900, rv: .8, pan: .3 }); }); },
  /* 丧钟：不和谐的金属泛音，余音很长 */
  bell() { [1, 2.76, 5.4, 8.93].forEach((m, i) => V({ f0: 196 * m, dur: 3.6 - i * .6, vol: .07 / (i + 1), att: .002, rv: .7, exact: 1 })); },
  /* 钟表：滴答四声 */
  clock() { for (let i = 0; i < 4; i++) V({ noise: 1, bp: 3200, q: 9, dur: .03, vol: .18, att: .001, delay: i * .5, rv: .5 }); },
  boom() { V({ f0: 55, f1: 25, dur: 2.2, vol: .5, att: .01, rv: .5 }); V({ noise: 1, lp: 200, dur: 1.2, vol: .25, rv: .6 }); },
  cat() { V({ type: 'sawtooth', f0: 620, f1: 900, dur: .2, vol: .06, bp: 1200, q: 2, rv: .4 }); V({ type: 'sawtooth', f0: 900, f1: 520, dur: .35, vol: .06, bp: 1100, q: 2, delay: .18, vib: [7, 15], rv: .4 }); },
  metal() { [1, 1.47, 2.09, 2.83, 3.6].forEach((m, i) => V({ f0: 310 * m, dur: 2.4, vol: .03, att: .002, rv: .8, exact: 1, pan: rnd2(-.7, .7) })); }
};
/* 每个音效的音量校准（离线渲染量过：氛围音峰值约 0.06–0.15，惊吓重击 0.2–0.3，背景音乐 rms 约 0.02） */
const SFX_GAIN = { tap: 3.5, page: 2.8, miss: 3, guard: 2.3, coin: 2, blade: 3, hurt: 3, hit: 2.5, bad: 2.5, spin: 6, chalk: 15, cat: 3, whisper: 4.3, breath: 2.6, creak: 6.5, drip: 6, wind: 6.5, giggle: 3.3, scream: 5, scrape: 7, clock: 5, metal: 2, hum: 1.6, static: 2 };
function sfxRaw(n) { AU.gm = SFX_GAIN[n] || 1; try { SFX[n] && SFX[n](); } catch (e) {} AU.gm = 1; }
function sfx(n) { const now = performance.now(); if (now - (AU.last[n] || 0) < 45) return; AU.last[n] = now; audioInit(); sfxRaw(n); }

/* —— 背景氛围：低沉的持续音（会“呼吸”）+ 风/底噪 + 不定时出现的声音事件，按情境切换 —— */
const MUS = { mood: '', drone: null, next: {} };
/* root 根音；dr 持续音的音程；w 波形；dv 音量；cut 滤波范围；nz 底噪[音量,中心频率]；ev 事件[名字, 最短秒, 最长秒] */
const MOODS = {
  day: { root: 98, dr: [0, 7], w: 'sine', dv: .022, cut: [500, 900], nz: 0, ev: [['box', 4, 8]] },
  house: { root: 73.4, dr: [0, 6], w: 'sawtooth', dv: .022, cut: [180, 420], nz: [.012, 500], ev: [['box', 5, 9], ['creak', 18, 30], ['drip', 7, 13]] },
  night: { root: 55, dr: [0, 1, 7], w: 'sawtooth', dv: .026, cut: [140, 340], nz: [.02, 380], ev: [['thump', 10, 18], ['whisper', 14, 26], ['knock', 26, 44], ['steps', 22, 36], ['screech', 28, 46], ['swell', 18, 30]] },
  fight: { root: 61.7, dr: [0, 6], w: 'sawtooth', dv: .028, cut: [260, 700], nz: [.012, 900], ev: [['pulse', .34, .34], ['screech', 7, 12], ['metal', 6, 10]] },
  scare: { root: 87.3, dr: [0, 7], w: 'triangle', dv: .018, cut: [400, 800], nz: 0, ev: [['tune', .46, .46], ['giggle', 9, 16]] },
  door: { root: 46.2, dr: [0, 1, 6, 11], w: 'sawtooth', dv: .03, cut: [120, 300], nz: [.024, 260], ev: [['whisper', 6, 11], ['swell', 9, 16], ['metal', 8, 14], ['hum', 30, 44], ['thump', 7, 12]] },
  phone: { root: 73.4, dr: [0, 1], w: 'sine', dv: .022, cut: [300, 500], nz: [.008, 3000], ev: [['static', 6, 10]] },
  mirror: { root: 523, dr: [0, 6], w: 'sine', dv: .009, cut: [1800, 2600], nz: [.01, 600], sub: 55, ev: [['drip', 4, 7], ['breath', 9, 15], ['whisper', 11, 18], ['glass', 7, 12]] }
};
const BOX = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15], TUNE = [7, 10, 12, 10, 7, 6, 7, -1, 3, 6, 7, 6, 3, 2, 3, -1];
function musEvent(k, at, M) { const r = M.root, o = { mus: 1, at };
  if (k === 'box') { const s = BOX[Math.floor(Math.random() * BOX.length)], f = r * 4 * Math.pow(2, s / 12); V({ ...o, f0: f, dur: 2.2, vol: .03, att: .002, rv: .9, det: rnd2(-25, 25), pan: rnd2(-.5, .5) }); V({ ...o, f0: f * 2.01, dur: 1, vol: .008, att: .002, rv: .9 }); }
  else if (k === 'tune') { const s = TUNE[MUS.step++ % TUNE.length]; if (s >= 0) { const f = r * 4 * Math.pow(2, s / 12); V({ ...o, type: 'triangle', f0: f, dur: .7, vol: .028, att: .003, rv: .6, det: rnd2(-18, 18) }); V({ ...o, f0: f * 3.01, dur: .35, vol: .006, rv: .6 }); } }
  else if (k === 'pulse') { const s = (MUS.step++ % 8) < 6 ? 0 : 1, acc = MUS.step % 4 === 1; V({ ...o, type: 'sawtooth', f0: r * 2 * Math.pow(2, s / 12), dur: .3, vol: acc ? .05 : .03, lp: acc ? 900 : 500, att: .004 }); if (MUS.step % 8 === 1) V({ ...o, f0: 55, f1: 38, dur: .16, vol: .2, lp: 140 }); }
  else if (k === 'thump') V({ ...o, f0: 48, f1: 30, dur: 1.2, vol: .16, rv: .7, pan: rnd2(-.5, .5) });
  else if (k === 'swell') [0, 1, 6].forEach(s => V({ ...o, type: 'sawtooth', f0: r * 2 * Math.pow(2, s / 12), dur: rnd2(2.5, 4), vol: .025, lp: 900, swell: 1, rv: .8, pan: rnd2(-.6, .6) }));
  else if (k === 'screech') V({ ...o, type: 'sawtooth', f0: rnd2(1500, 2100), f1: rnd2(1300, 2600), dur: 2.6, vol: .012, bp: 2000, q: 3, vib: [5, 18], att: 1.2, rv: .9, pan: rnd2(-.8, .8) });
  else if (k === 'glass') { const f = rnd2(1700, 2600); V({ ...o, f0: f, dur: 3.5, vol: .014, att: .6, rv: .9, exact: 1, pan: -.4 }); V({ ...o, f0: f * 1.004, dur: 3.5, vol: .014, att: .6, rv: .9, exact: 1, pan: .4 }); }
  else if (SFX[k] && SET.snd) { AU.off = Math.max(0, at - AU.ctx.currentTime); sfxRaw(k); AU.off = 0; }
}
/* 持续音：几只略微走调的振荡器，滤波器慢慢开合，像在喘气 */
function musDrone(M, at) { const c = AU.ctx, g = c.createGain(), lp = c.createBiquadFilter(), parts = []; lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.value = M.cut[0];
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .06 + Math.random() * .05; lg.gain.value = (M.cut[1] - M.cut[0]) / 2; lfo.connect(lg); lg.connect(lp.frequency); lp.frequency.setValueAtTime((M.cut[0] + M.cut[1]) / 2, at);
  const amp = c.createOscillator(), ag = c.createGain(); amp.frequency.value = .09; ag.gain.value = M.dv * .35; amp.connect(ag); ag.connect(g.gain);
  for (const s of M.dr) for (const dt of [-7, 6]) { const o = c.createOscillator(); o.type = M.w; o.frequency.value = M.root * Math.pow(2, s / 12); o.detune.value = dt + rnd2(-3, 3); o.connect(lp); parts.push(o); }
  if (M.sub) { const o = c.createOscillator(); o.frequency.value = M.sub; const sg = c.createGain(); sg.gain.value = 1.6; o.connect(sg); sg.connect(g); parts.push(o); }
  let nz = null; if (M.nz) { nz = c.createBufferSource(); nz.buffer = AU.noiseBuf; nz.loop = true; const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = M.nz[1]; nf.Q.value = 1.2; const ng = c.createGain(); ng.gain.value = M.nz[0] / M.dv; const nl = c.createOscillator(), nlg = c.createGain(); nl.frequency.value = .05; nlg.gain.value = M.nz[1] * .4; nl.connect(nlg); nlg.connect(nf.frequency); nz.connect(nf); nf.connect(ng); ng.connect(g); parts.push(nl); }
  lp.connect(g); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(M.dv, at + 2.5); g.connect(AU.musBus); for (const p of parts.concat([lfo, amp])) p.start(at); if (nz) nz.start(at);
  return { g, stop(t) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 1.8); for (const p of parts.concat([lfo, amp])) p.stop(t + 2); if (nz) nz.stop(t + 2); } }; }
function musicMode(m) { if (MUS.mood === m) return; MUS.mood = m; MUS.step = 0; MUS.next = {}; const c = AU.ctx; if (!c) return; const now = c.currentTime; if (MUS.drone) { MUS.drone.stop(now); MUS.drone = null; } }
function musicTick(at) { const c = AU.ctx; if (!c || !MUS.mood || document.hidden) return; if (!SET.mus) { if (MUS.drone) { MUS.drone.stop(c.currentTime); MUS.drone = null; } return; } const M = MOODS[MUS.mood]; if (!M) return; const now = at != null ? at : c.currentTime;
  if (!MUS.drone) MUS.drone = musDrone(M, now + .05);
  for (const e of M.ev) { const k = e[0]; if (MUS.next[k] == null) MUS.next[k] = now + (e[1] < 1 ? 0 : rnd2(e[1] * .3, e[1])); while (MUS.next[k] <= now + .25) { musEvent(k, Math.max(now, MUS.next[k]), M); MUS.next[k] += rnd2(e[1], e[2]); } } }
setInterval(() => { if (!AU.offline) musicTick(); }, 120);
/* 测试用：离线渲染一段声音（不出声），返回 {peak, rms, buf}；页面里也能拿来做试听文件 */
async function auRender(secs, fn) { const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; const c = new OC(2, Math.ceil(44100 * secs), 44100), keep = { ...AU }, mk = { ...MUS }; Object.assign(AU, auGraph(c), { ctx: c, last: {}, offline: 1 });
  try { fn(c); } finally { } const buf = await c.startRendering(); Object.assign(AU, keep, { offline: 0 }); Object.assign(MUS, mk); let pk = 0, ss = 0; for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pk) pk = v; ss += v * v; } } return { peak: pk, rms: Math.sqrt(ss / (buf.length * 2)), buf }; }
function auWav(buf) { const n = buf.length, ch = 2, out = new DataView(new ArrayBuffer(44 + n * ch * 2)); const W = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  W(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); W(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, 44100, true); out.setUint32(28, 44100 * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); W(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const L = buf.getChannelData(0), R = buf.getChannelData(1); for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); } return new Uint8Array(out.buffer); }
