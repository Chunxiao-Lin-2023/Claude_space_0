'use strict';
/* ================= 十夜怪谈 · core：工具、画布、输入、合成音效 ================= */
const TS = 16;                       // 瓦片像素
const LSP = 'nighttales.';           // 本地存储前缀
const QS = new URLSearchParams(location.search);
const FAST = Math.max(1, +(QS.get('fast') || 1));   // 测试用：加速剧本等待
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const now = () => performance.now();
const DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]];   // 0下 1左 2右 3上
const DIRN = { down: 0, left: 1, right: 2, up: 3 };
function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const store = {
  get(k, d) { try { const v = localStorage.getItem(LSP + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(LSP + k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(LSP + k); } catch (e) { } }
};
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---------------- 画布：按短边约 12 格选整数倍缩放 ---------------- */
const cv = $('cv'), cx = cv.getContext('2d');
const buf = mk(320, 200), bx = buf.getContext('2d');
let VW = 320, VH = 200, SC = 4, DPR = 1, SW = 0, SH = 0;
const PHONE_MQ = matchMedia('(pointer:coarse) and (max-height:500px), (pointer:coarse) and (max-width:500px)');
let PHONE = PHONE_MQ.matches;
const TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
function resize() {
  SW = innerWidth; SH = innerHeight; PHONE = PHONE_MQ.matches;
  SC = Math.max(1, Math.round(Math.min(SW, SH) / (12 * TS)));
  VW = Math.ceil(SW / SC); VH = Math.ceil(SH / SC);
  buf.width = VW; buf.height = VH;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(SW * DPR); cv.height = Math.round(SH * DPR);
  cv.style.width = SW + 'px'; cv.style.height = SH + 'px';
  document.body.classList.toggle('phone', PHONE);
  document.body.classList.toggle('touch', TOUCH);
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 120));
resize();

/* ---------------- 输入 ---------------- */
const IN = {
  stack: [], run: false, runLatch: false, joy: null, joyDir: -1,
  handlers: [],                      // (name)=>bool ，返回 true 表示已处理
  press(n) { for (let i = this.handlers.length - 1; i >= 0; i--) if (this.handlers[i](n)) return; },
  dir() { if (this.joyDir >= 0) return this.joyDir; return this.stack.length ? this.stack[this.stack.length - 1] : -1; },
  running() { return this.run || this.runLatch; }
};
const KEYDIR = { ArrowDown: 0, KeyS: 0, ArrowLeft: 1, KeyA: 1, ArrowRight: 2, KeyD: 2, ArrowUp: 3, KeyW: 3 };
const KEYACT = { Space: 'a', Enter: 'a', KeyZ: 'a', KeyE: 'a', NumpadEnter: 'a', Escape: 'menu', KeyI: 'inv', Tab: 'inv', KeyJ: 'journal', KeyT: 'ctrl', KeyY: 'yes', KeyN: 'no', KeyM: 'mute', KeyX: 'b', Backspace: 'del' };   // del：密码盘里删一位，其他地方等同 b
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  AU.init();
  if (e.code in KEYDIR) {
    const d = KEYDIR[e.code]; if (!IN.stack.includes(d)) IN.stack.push(d);
    if (!e.repeat) IN.press(['down', 'left', 'right', 'up'][d]); e.preventDefault(); return;   // 按住不放不连发（避免选项来回跳）
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { IN.run = true; return; }
  if (e.repeat) return;
  const a = KEYACT[e.code];
  if (a) { IN.press(a); if (e.code === 'Tab' || e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') e.preventDefault(); }
});
addEventListener('keyup', e => {
  if (e.code in KEYDIR) { const d = KEYDIR[e.code]; IN.stack = IN.stack.filter(x => x !== d); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') IN.run = false;
});
addEventListener('blur', () => { IN.stack = []; IN.run = false; IN.joy = null; IN.joyDir = -1; });

/* ---------------- 合成音效（Web Audio，无音频文件） ---------------- */
const AU = {
  ctx: null, master: null, muted: store.get('mute', false), nb: null, amb: null, ambName: '', last: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const c = this.ctx = new C();
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6;
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(comp); comp.connect(c.destination);
      const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.nb = b;
      if (this.ambName) { const a = this.ambName; this.ambName = ''; this.ambient(a); }
    } catch (e) { this.ctx = null; }
  },
  setMute(m) { this.muted = m; store.set('mute', m); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05); },
  tone(type, f0, f1, dur, vol, delay = 0, lp = 0, out) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; const j = 1 + (Math.random() - .5) * .08;
    o.frequency.setValueAtTime(f0 * j, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1 * j), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.02, dur * .2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g); g.connect(out || this.master); o.start(t); o.stop(t + dur + .05);
  },
  noise(dur, vol, ft = 'lowpass', f0 = 1000, f1 = f0, Q = 1, delay = 0, out) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nb; s.loop = true; f.type = ft; f.Q.value = Q;
    f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.03, dur * .2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || this.master); s.start(t, Math.random()); s.stop(t + dur + .05);
  },
  sfx(name) {
    if (!this.ctx) return;
    const tnow = now(), lim = { step: 90, blip: 45, tick: 200 }[name] || 30;
    if (this.last[name] && tnow - this.last[name] < lim) return; this.last[name] = tnow;
    const T = this.tone.bind(this), N = this.noise.bind(this);
    switch (name) {
      case 'step': N(.06, .05, 'lowpass', 700, 300, 1); break;
      case 'blip': T('square', 520, 520, .03, .012, 0, 1800); break;
      case 'select': T('square', 440, 660, .06, .03, 0, 2000); break;
      case 'item': T('sine', 660, 990, .15, .15); T('sine', 990, 1320, .25, .12, .09); break;
      case 'paper': N(.25, .12, 'bandpass', 2500, 4000, 1.5); break;
      case 'open': T('sawtooth', 140, 80, .5, .06, 0, 600); N(.4, .05, 'bandpass', 900, 400, 4); break;
      case 'close': N(.15, .25, 'lowpass', 400, 120, 1); T('sine', 90, 50, .2, .2); break;
      case 'locked': N(.08, .2, 'highpass', 2000, 2000, 1); N(.08, .2, 'highpass', 2200, 2200, 1, .12); break;
      case 'knock': N(.09, .45, 'lowpass', 500, 150, 2); T('sine', 120, 70, .12, .35); break;
      case 'switch': N(.04, .2, 'highpass', 3000, 3000, 1); break;
      case 'match': N(.35, .18, 'highpass', 2500, 800, 1); T('sine', 180, 120, .4, .05); break;
      case 'scare': [233, 247, 349, 370, 494].forEach((f, i) => T('sawtooth', f, f * .92, 1.4, .09, 0, 3000)); N(.6, .35, 'highpass', 1200, 4000, 1); T('sine', 60, 30, 1, .5); break;
      case 'sting': [311, 330, 466].forEach(f => T('sawtooth', f, f * .97, .8, .07, 0, 2200)); N(.3, .15, 'highpass', 2000, 2000, 1); break;
      case 'heart': T('sine', 62, 40, .16, .5); T('sine', 58, 38, .2, .4, .22); break;
      case 'whisper': N(1.6, .12, 'bandpass', 1800, 3200, 7); N(1.2, .08, 'bandpass', 2600, 1400, 9, .3); break;
      case 'bell': case 'ding': T('sine', 1318, 1318, 1.2, .18); T('sine', 1046, 1046, 1.4, .14, .25); break;
      case 'glass': N(.5, .3, 'highpass', 3000, 6000, 1); [2100, 2900, 3700].forEach((f, i) => T('triangle', f, f * .97, .4, .05, i * .03)); break;
      case 'scream': T('sawtooth', 880, 520, 1.1, .12, 0, 2400); T('sawtooth', 930, 560, 1.1, .08, .02, 2400); N(.9, .1, 'bandpass', 1500, 900, 2); break;
      case 'thud': N(.25, .5, 'lowpass', 300, 80, 1); T('sine', 70, 40, .3, .45); break;
      case 'cry': for (let i = 0; i < 3; i++) T('triangle', 560 - i * 20, 430 - i * 15, .9, .06, i * .55, 1400); break;
      case 'tv': N(1.2, .12, 'highpass', 1500, 1500, .7); break;
      case 'giggle': [990, 1180, 1050, 1250, 1100].forEach((f, i) => T('triangle', f, f * .85, .09, .06, i * .11)); break;
      case 'drip': T('sine', 1400, 380, .09, .08); break;
      case 'water': N(.8, .15, 'lowpass', 900, 300, 1); break;
      case 'splash': N(.7, .35, 'bandpass', 1200, 300, 1); T('sine', 200, 60, .4, .2); break;
      case 'phone': for (let i = 0; i < 2; i++) { T('square', 880, 880, .35, .03, i * .5, 2000); T('square', 1100, 1100, .35, .025, i * .5, 2000); } break;
      case 'tick': T('square', 2200, 2200, .02, .03, 0, 4000); break;
      case 'car': T('sawtooth', 60, 90, .8, .08, 0, 300); N(.8, .1, 'lowpass', 400, 200, 1); break;
      case 'brake': N(.8, .15, 'bandpass', 2200, 1400, 6); break;
      case 'tear': N(.5, .3, 'bandpass', 1200, 3000, 3); break;
      case 'chime': [523, 659, 784, 1046].forEach((f, i) => T('sine', f, f, 1.0, .08, i * .12)); break;
      case 'good': [392, 494, 587, 784].forEach((f, i) => T('sine', f, f, 2.2, .07, i * .18)); break;
      case 'bad': [196, 207, 277].forEach((f, i) => T('sawtooth', f, f * .9, 2.5, .06, i * .05, 900)); T('sine', 50, 30, 2, .4); break;
      case 'laugh': [300, 280, 310, 270, 290].forEach((f, i) => T('sawtooth', f, f * .7, .14, .07, i * .16, 900)); break;
      case 'chant': for (let i = 0; i < 4; i++) T('sine', 110 + (i % 2) * 7, 110 + (i % 2) * 7, .5, .08, i * .5, 600); break;
      case 'cut': N(.12, .3, 'highpass', 4000, 4000, 1); T('square', 3000, 1500, .1, .04); break;
      default: T('sine', 440, 440, .1, .05);
    }
  },
  /* 环境声：循环节点，交叉淡入淡出 */
  ambient(name) {
    if (name === this.ambName) return; this.ambName = name;
    const c = this.ctx; if (!c) return;
    const old = this.amb; this.amb = null;
    if (old) { old.g.gain.setTargetAtTime(0.0001, c.currentTime, .5); setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) { } }), 2500); }
    if (!name || name === 'none') return;
    const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.master);
    const nodes = [];
    const osc = (type, f, vol, lp) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f; og.gain.value = vol; if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); fl.connect(og); } else o.connect(og); og.connect(g); o.start(); nodes.push(o); return { o, og }; };
    const noi = (ft, f, Q, vol) => { const s = c.createBufferSource(), fl = c.createBiquadFilter(), ng = c.createGain(); s.buffer = this.nb; s.loop = true; fl.type = ft; fl.frequency.value = f; fl.Q.value = Q; ng.gain.value = vol; s.connect(fl); fl.connect(ng); ng.connect(g); s.start(0, Math.random()); nodes.push(s); return { s, fl, ng }; };
    const lfo = (target, f, depth, base) => { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = f; lg.gain.value = depth; l.connect(lg); lg.connect(target); if (base != null) target.value = base; l.start(); nodes.push(l); };
    switch (name) {
      case 'drone': { const a = osc('sine', 55, .25), b = osc('sine', 58.3, .2); osc('triangle', 110.5, .04, 400); lfo(a.og.gain, .07, .12, .2); const w = noi('bandpass', 400, .8, .05); lfo(w.fl.frequency, .05, 250, 450); break; }
      case 'room': { osc('sine', 60, .05); osc('sine', 120, .02); noi('lowpass', 300, .5, .04); break; }
      case 'wind': { const w = noi('bandpass', 500, 1.2, .18); lfo(w.fl.frequency, .09, 300, 550); lfo(w.ng.gain, .13, .08, .14); osc('sine', 49, .08); break; }
      case 'rain': { noi('highpass', 1200, .4, .09); noi('lowpass', 500, .6, .1); const t = noi('bandpass', 2800, 2, .03); lfo(t.ng.gain, 2.3, .02, .03); break; }
      case 'bus': { osc('sawtooth', 42, .12, 160); osc('sawtooth', 43.5, .08, 160); const r = noi('lowpass', 250, .7, .2); lfo(r.ng.gain, .6, .06, .18); break; }
      case 'car': { osc('sawtooth', 55, .09, 220); noi('lowpass', 350, .7, .12); noi('highpass', 1500, .4, .05); break; }
      case 'river': { const w = noi('lowpass', 700, .7, .22); lfo(w.fl.frequency, .2, 200, 700); noi('bandpass', 2000, 1.5, .03); const k = osc('sine', 4400, .0, 0); lfo(k.og.gain, 13, .01, 0); break; }
      case 'night': { const k = osc('sine', 4300, 0); lfo(k.og.gain, 11, .012, 0); const k2 = osc('sine', 3900, 0); lfo(k2.og.gain, 7, .008, 0); noi('lowpass', 300, .5, .05); break; }
      case 'tv': { noi('highpass', 1800, .6, .06); osc('sine', 15734 / 2, .004); osc('sine', 60, .04); break; }
      case 'elevator': { osc('sine', 98, .1); osc('sine', 196, .03); noi('lowpass', 200, .5, .08); break; }
      case 'otherworld': { osc('sine', 41, .3); osc('sine', 43.6, .25); const w = noi('bandpass', 250, 3, .1); lfo(w.fl.frequency, .03, 150, 260); osc('triangle', 622, .012, 900); break; }
      case 'school': { osc('sine', 50, .1); const w = noi('bandpass', 700, 1, .06); lfo(w.fl.frequency, .07, 300, 700); break; }
      case 'fire': { const f = noi('lowpass', 600, .7, .12); lfo(f.ng.gain, 6, .05, .1); noi('bandpass', 3000, 3, .02); osc('sine', 55, .06); break; }
      case 'market': { noi('bandpass', 900, .5, .06); osc('sine', 70, .05); break; }
    }
    g.gain.setTargetAtTime(1, c.currentTime, .8);
    this.amb = { g, nodes };
  }
};
['pointerdown', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => AU.init(), { passive: true }));
