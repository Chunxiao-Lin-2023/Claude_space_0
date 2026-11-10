/* ================= 完美世界OL · 文字版 — core =================
   single-file text MMO-flavoured RPG.  save keys use the prefix `wanmeiol.` */
'use strict';
const $ = id => document.getElementById(id);
const QS = new URLSearchParams(location.search);
const HUB = /\/wanmeiol\/(index\.html)?$/.test(location.pathname);
const IS_TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
const PREFIX = 'wanmeiol.';
const store = {
  get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) { } },
};
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const wpick = (list, wf = x => x.w || 1) => { let s = 0; for (const x of list) s += wf(x); let r = Math.random() * s; for (const x of list) { r -= wf(x); if (r <= 0) return x; } return list[list.length - 1]; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// seeded hash rng — used where several clients must agree (who is standing where this minute, etc.)
const hash = (...xs) => { let h = 2166136261; for (const x of xs) { const s = String(x); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= 0x9e37; } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
const srng = seed => { let s = Math.floor(hash(seed) * 4294967296) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => n >= 1e8 ? (n / 1e8).toFixed(1) + '亿' : n >= 1e4 ? (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + '万' : String(Math.round(n));
const now = () => Date.now();
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const hhmm = (t = now()) => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const uid = () => Math.random().toString(36).slice(2, 9);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ---------- settings ---------- */
const SET = Object.assign({ mute: false, vol: 0.6, fast: false, chatWorld: true, autoFollow: true }, store.get('set', {}));
const saveSet = () => store.set('set', SET);

/* ---------- synth sfx (Web Audio, no files) ---------- */
const AU = { ctx: null, master: null, noise: null, last: {} };
function audioInit() {
  if (AU.ctx) return; try { const C = new (window.AudioContext || window.webkitAudioContext)(); AU.ctx = C; const comp = C.createDynamicsCompressor(); AU.master = C.createGain(); AU.master.gain.value = SET.vol; AU.master.connect(comp); comp.connect(C.destination);
    const b = C.createBuffer(1, C.sampleRate, C.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = b; } catch (e) { }
}
function tone(type, f0, f1, dur, vol = 0.2, delay = 0, lp = 0) {
  const C = AU.ctx; if (!C || SET.mute) return; const t = C.currentTime + delay, o = C.createOscillator(), g = C.createGain(); o.type = type; const j = 1 + (Math.random() - 0.5) * 0.08;
  o.frequency.setValueAtTime(f0 * j, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * j), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o; if (lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; } n.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol = 0.2, type = 'lowpass', f0 = 1200, f1 = 300, Q = 1, delay = 0) {
  const C = AU.ctx; if (!C || SET.mute) return; const t = C.currentTime + delay, s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain(); s.buffer = AU.noise; f.type = type; f.Q.value = Q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(AU.master); s.start(t); s.stop(t + dur + 0.05);
}
function sfx(k) {
  const t = performance.now(); if (AU.last[k] && t - AU.last[k] < 60) return; AU.last[k] = t;
  switch (k) {
    case 'click': tone('triangle', 660, 520, 0.05, 0.06); break;
    case 'hit': noise(0.12, 0.25, 'lowpass', 1800, 200); tone('square', 160, 70, 0.1, 0.08, 0, 900); break;
    case 'crit': noise(0.18, 0.35, 'lowpass', 3000, 200); tone('sawtooth', 300, 60, 0.18, 0.12, 0, 1400); break;
    case 'magic': tone('sine', 520, 1300, 0.25, 0.12); tone('triangle', 780, 1600, 0.2, 0.06, 0.05); break;
    case 'heal': tone('sine', 520, 780, 0.3, 0.1); tone('sine', 780, 1040, 0.3, 0.07, 0.1); break;
    case 'miss': noise(0.1, 0.08, 'highpass', 3000, 6000); break;
    case 'win': [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.22, 0.1, i * 0.09)); break;
    case 'lose': [392, 330, 262].forEach((f, i) => tone('triangle', f, f * 0.98, 0.3, 0.1, i * 0.16)); break;
    case 'level': [523, 659, 784, 1046, 1318].forEach((f, i) => tone('sine', f, f, 0.3, 0.1, i * 0.08)); break;
    case 'loot': tone('triangle', 880, 1320, 0.12, 0.08); tone('triangle', 1320, 1760, 0.12, 0.06, 0.07); break;
    case 'epic': [659, 831, 988, 1318].forEach((f, i) => tone('sine', f, f, 0.4, 0.09, i * 0.06)); break;
    case 'chat': tone('sine', 1200, 1100, 0.05, 0.03); break;
    case 'fail': tone('sawtooth', 220, 110, 0.35, 0.09, 0, 800); break;
    case 'step': noise(0.06, 0.05, 'bandpass', 500, 300, 2); break;
    case 'gold': tone('triangle', 1500, 1500, 0.06, 0.06); tone('triangle', 2000, 2000, 0.08, 0.05, 0.05); break;
  }
}
