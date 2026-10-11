/* =================== utilities =================== */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const dirOf = a => ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; // 0=E,1=SE,2=S...
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const $ = id => document.getElementById(id);
const QS = new URLSearchParams(location.search);
const IS_TOUCH = matchMedia('(pointer:coarse)').matches || (navigator.maxTouchPoints > 1 && !matchMedia('(pointer:fine)').matches);
if (IS_TOUCH) document.documentElement.classList.add('coarse');
const PHONE = matchMedia('(pointer:coarse) and (max-height:500px), (pointer:coarse) and (max-width:500px)');

/* =================== save data =================== */
const SAVE_KEY = 'riftwardens_v1';
function defSave() { return {hero: 'warmage', best: {}, bestN: {}, spent: 0, traps: {spikes: 1, barricade: 1, tar: 1, arrow: 1}, heroUp: {warmage: 0, sorc: 0, paladin: 0, ranger: 0, alch: 0, blade: 0}, mute: false, name: '', diff: 'normal', bright: 2, music: true, shake: true, trinkets: [], equip: [], weapons: {}, wsel: {}, chal: {}, endless: {}, daily: {}, badges: 0, layouts: {}}; }
let SAVE = (() => { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.best) { const d = defSave(); const o = Object.assign(d, s); o.heroUp = Object.assign(defSave().heroUp, s.heroUp || {}); o.bestN = s.bestN || {}; for (const k of ['chal', 'endless', 'daily', 'weapons', 'wsel', 'layouts']) o[k] = s[k] || {}; o.trinkets = s.trinkets || []; o.equip = s.equip || []; return o; } } catch (e) {} return defSave(); })();
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
const skullsEarned = () => Object.values(SAVE.best).reduce((a, b) => a + b, 0) + Object.values(SAVE.bestN || {}).reduce((a, b) => a + b, 0) + Object.keys(SAVE.chal || {}).length;
const skullsFree = () => skullsEarned() - SAVE.spent;
const levelOpen = i => i === 0 || (SAVE.best[LEVELS[i - 1].id] || 0) > 0 || QS.has('unlockall');

/* =================== audio (synthesized) =================== */
const AU = {ctx: null, master: null, noise: null, last: {}, muted: SAVE.mute};
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)();
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6;
    const m = C.createGain(); m.gain.value = AU.muted ? 0 : 0.55; m.connect(comp); comp.connect(C.destination);
    const nb = C.createBuffer(1, C.sampleRate, C.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    Object.assign(AU, {ctx: C, master: m, noise: nb});
  } catch (e) {}
}
function setMute(m) { AU.muted = m; SAVE.mute = m; saveGame(); if (AU.master) AU.master.gain.value = m ? 0 : 0.55; const b = $('bMute'); if (b) b.textContent = m ? '✕' : '♪'; }
function tone(type, f0, f1, dur, vol, delay = 0, lp = 0) {
  const C = AU.ctx; if (!C) return; const t = C.currentTime + delay;
  const o = C.createOscillator(), g = C.createGain(); o.type = type;
  const j = 1 + (Math.random() - 0.5) * 0.16;
  o.frequency.setValueAtTime(f0 * j, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * j), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.012, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o; if (lp) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
  n.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, ft = 'bandpass', f0 = 1000, f1 = 1000, Q = 1, delay = 0) {
  const C = AU.ctx; if (!C) return; const t = C.currentTime + delay;
  const s = C.createBufferSource(); s.buffer = AU.noise; s.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = C.createBiquadFilter(); f.type = ft; f.Q.value = Q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  const g = C.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const SFX = {
  bolt: v => { noise(0.08, 0.35 * v, 'highpass', 3000, 1500, 1); tone('square', 520, 180, 0.07, 0.08 * v, 0, 2000); },
  orb: v => { tone('sine', 880, 1400, 0.1, 0.12 * v); tone('triangle', 1320, 700, 0.12, 0.05 * v, 0.02); },
  blast: v => { noise(0.35, 0.6 * v, 'lowpass', 1600, 120, 0.8); tone('sine', 140, 50, 0.3, 0.35 * v); },
  fireball: v => { noise(0.25, 0.3 * v, 'bandpass', 600, 1800, 1.2); tone('sawtooth', 200, 380, 0.2, 0.06 * v, 0, 900); },
  boom: v => { noise(0.6, 0.8 * v, 'lowpass', 2200, 80, 0.7); tone('sine', 110, 35, 0.5, 0.5 * v); },
  nova: v => { noise(0.5, 0.35 * v, 'highpass', 6000, 2500, 0.8); for (let i = 0; i < 4; i++) tone('sine', 1800 + i * 400, 900, 0.3, 0.06 * v, i * 0.03); },
  charm: v => { for (let i = 0; i < 3; i++) tone('sine', 660 * Math.pow(1.26, i), 700 * Math.pow(1.26, i), 0.18, 0.08 * v, i * 0.07); },
  dash: v => { noise(0.18, 0.3 * v, 'bandpass', 900, 2600, 1.4); },
  blink: v => { tone('sine', 400, 2000, 0.16, 0.12 * v); noise(0.12, 0.15 * v, 'highpass', 4000, 6000, 1); },
  hit: v => { noise(0.07, 0.4 * v, 'bandpass', 1800, 600, 1.5); tone('square', 180, 90, 0.06, 0.07 * v, 0, 1200); },
  hitB: v => { noise(0.1, 0.5 * v, 'lowpass', 900, 200, 1); tone('sine', 120, 60, 0.12, 0.25 * v); },
  orcDie: v => { tone('sawtooth', 220, 70, 0.32, 0.12 * v, 0, 700); noise(0.2, 0.2 * v, 'lowpass', 800, 200, 1); },
  batDie: v => { tone('square', 1400, 300, 0.2, 0.06 * v, 0, 3000); },
  fall: v => { tone('sine', 600, 80, 0.7, 0.15 * v); },
  burn: v => { noise(0.4, 0.3 * v, 'bandpass', 400, 1200, 0.7); },
  coin: v => { tone('square', 1320, 1320, 0.05, 0.04 * v, 0, 4000); tone('square', 1760, 1760, 0.08, 0.04 * v, 0.05, 4000); },
  spike: v => { noise(0.12, 0.45 * v, 'highpass', 2500, 5000, 2); tone('square', 900, 300, 0.08, 0.05 * v); },
  arrow: v => { noise(0.1, 0.25 * v, 'bandpass', 2500, 900, 2); },
  spring: v => { tone('triangle', 180, 720, 0.25, 0.2 * v); tone('sine', 90, 400, 0.2, 0.15 * v); },
  brim: v => { noise(0.6, 0.55 * v, 'lowpass', 400, 2400, 0.8); tone('sawtooth', 70, 140, 0.4, 0.1 * v, 0, 500); },
  frost: v => { noise(0.5, 0.35 * v, 'highpass', 5000, 1800, 0.8); tone('sine', 2400, 1200, 0.35, 0.05 * v); },
  grind: v => { noise(0.12, 0.2 * v, 'bandpass', 1200, 1600, 3); tone('sawtooth', 95, 90, 0.1, 0.04 * v, 0, 600); },
  barBreak: v => { noise(0.4, 0.6 * v, 'lowpass', 1600, 150, 0.6); tone('square', 150, 60, 0.2, 0.1 * v, 0, 800); },
  barHit: v => { noise(0.08, 0.35 * v, 'bandpass', 700, 300, 2); },
  place: v => { tone('square', 220, 110, 0.08, 0.1 * v, 0, 1500); noise(0.08, 0.25 * v, 'lowpass', 1200, 300, 1); },
  sell: v => { tone('triangle', 900, 500, 0.12, 0.08 * v); SFX.coin(v * 0.6); },
  deny: v => { tone('square', 160, 120, 0.15, 0.08 * v, 0, 900); },
  rift: v => { tone('sawtooth', 300, 140, 0.4, 0.14 * v, 0, 1400); tone('sine', 600, 280, 0.4, 0.12 * v, 0.05); },
  horn: v => { tone('sawtooth', 110, 116, 0.9, 0.14 * v, 0, 700); tone('sawtooth', 165, 170, 0.9, 0.08 * v, 0.05, 900); },
  win: v => { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.4, 0.13 * v, i * 0.14)); },
  lose: v => { [392, 330, 262, 196].forEach((f, i) => tone('sawtooth', f, f * 0.97, 0.45, 0.09 * v, i * 0.2, 1500)); },
  potion: v => { tone('sine', 500, 1100, 0.2, 0.12 * v); tone('sine', 750, 1600, 0.2, 0.08 * v, 0.08); },
  pHurt: v => { tone('square', 300, 120, 0.12, 0.1 * v, 0, 1400); noise(0.08, 0.2 * v, 'bandpass', 1200, 500, 1); },
  pDie: v => { tone('sawtooth', 400, 80, 0.8, 0.13 * v, 0, 1600); },
  click: v => { tone('square', 700, 600, 0.04, 0.05 * v, 0, 3000); },
  slam: v => { noise(0.5, 0.8 * v, 'lowpass', 900, 60, 0.6); tone('sine', 70, 30, 0.5, 0.6 * v); },
  ready: v => { tone('triangle', 660, 660, 0.1, 0.1 * v); tone('triangle', 990, 990, 0.14, 0.1 * v, 0.09); },
  zap: v => { noise(0.14, 0.3 * v, 'highpass', 3500, 6000, 1); tone('square', 900, 1800, 0.08, 0.05 * v, 0, 4000); },
  swing: v => { noise(0.12, 0.35 * v, 'bandpass', 700, 2200, 1.2); },
  throw: v => { noise(0.1, 0.18 * v, 'bandpass', 1400, 600, 1.5); },
  splash: v => { noise(0.25, 0.4 * v, 'bandpass', 900, 300, 0.9); tone('sine', 520, 200, 0.18, 0.08 * v); },
  guard: v => { tone('triangle', 440, 880, 0.3, 0.12 * v); tone('sine', 660, 1320, 0.35, 0.08 * v, 0.05); },
  judg: v => { SFX.slam(v); tone('triangle', 880, 660, 0.4, 0.1 * v, 0.05); },
  volley: v => { for (let i = 0; i < 4; i++) noise(0.08, 0.2 * v, 'bandpass', 2600, 1000, 2, i * 0.025); },
  falcon: v => { tone('sine', 2200, 3000, 0.12, 0.08 * v); tone('sine', 2600, 1800, 0.18, 0.08 * v, 0.13); },
  turret: v => { tone('square', 300, 500, 0.15, 0.06 * v, 0, 1500); noise(0.1, 0.2 * v, 'lowpass', 1500, 400, 1); },
  tshot: v => { noise(0.06, 0.25 * v, 'lowpass', 2400, 500, 1); },
  fog: v => { noise(0.6, 0.25 * v, 'lowpass', 600, 1600, 0.6); },
  storm: v => { for (let i = 0; i < 6; i++) noise(0.1, 0.22 * v, 'bandpass', 900 + i * 200, 2400, 1.4, i * 0.09); },
};
const SFX_GAP = {swing: 0.05, tshot: 0.06, splash: 0.05, hit: 0.04, hitB: 0.05, coin: 0.05, grind: 0.12, arrow: 0.05, orcDie: 0.05, bolt: 0.03, orb: 0.03, barHit: 0.08, burn: 0.2, spike: 0.05};
function sfx(name, x, y, vol = 1) {
  if (!AU.ctx || AU.muted || !SFX[name]) return;
  const now = AU.ctx.currentTime, gap = SFX_GAP[name] || 0.02;
  if (AU.last[name] && now - AU.last[name] < gap) return; AU.last[name] = now;
  if (x != null && CAM) { const d = Math.hypot(x - CAM.x, y - CAM.y); const f = clamp(1.25 - d / 700, 0, 1); if (f <= 0.02) return; vol *= f; }
  try { SFX[name](vol); } catch (e) {}
}

/* =================== atlases =================== */
const ATLAS = __ATLAS_META__;
const SHEET_SRC = {warmage: '__SHEET_warmage__', sorc: '__SHEET_sorc__', paladin: '__SHEET_paladin__', ranger: '__SHEET_ranger__', alch: '__SHEET_alch__', blade: '__SHEET_blade__', grunt: '__SHEET_grunt__', shield: '__SHEET_shield__', gxbow: '__SHEET_gxbow__', gknight: '__SHEET_gknight__', sapper: '__SHEET_sapper__', shaman: '__SHEET_shaman__', kobold: '__SHEET_kobold__', archer: '__SHEET_archer__', ogre: '__SHEET_ogre__', bat: '__SHEET_bat__', chief: '__SHEET_chief__', props: '__SHEET_props__'};
const IMG = {};
function loadSheets() {
  return Promise.all(Object.entries(SHEET_SRC).map(([k, src]) => new Promise(res => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => res(); im.src = src; })));
}
// draw a unit frame; anim key from atlas, fi frame index, dir 0..7 ; (x,y) ground point in world
function drawUnit(ctx, name, anim, fi, dir, x, y, opt) {
  const A = ATLAS.units[name], im = IMG[name]; if (!A || !im) return;
  const an = A.anims[anim] || A.anims.walk; const col = an[0] + (fi % an[1]);
  const k = ATLAS.uk * (opt && opt.scale || 1);
  const sx = col * A.cw, sy = dir * A.ch, w = A.cw * k, h = A.ch * k, dx = x - A.ax * k, dy = y - A.ay * k;
  if (opt && (opt.tint || opt.flash)) {
    const c = scratch(A.cw, A.ch); const g = c.getContext('2d');
    g.globalCompositeOperation = 'copy'; g.drawImage(im, sx, sy, A.cw, A.ch, 0, 0, A.cw, A.ch);
    g.globalCompositeOperation = 'source-atop';
    if (opt.tint) { g.fillStyle = opt.tint; g.fillRect(0, 0, A.cw, A.ch); }
    if (opt.flash) { g.fillStyle = 'rgba(255,255,255,' + opt.flash + ')'; g.fillRect(0, 0, A.cw, A.ch); }
    ctx.drawImage(c, 0, 0, A.cw, A.ch, dx, dy, w, h);
  } else ctx.drawImage(im, sx, sy, A.cw, A.ch, dx, dy, w, h);
}
let _scr = null;
function scratch(w, h) { if (!_scr) _scr = document.createElement('canvas'); if (_scr.width < w) _scr.width = w; if (_scr.height < h) _scr.height = h; return _scr; }
// props atlas: key like 'spikes_2_2'; anchor = ground center of tile ; s scale (display)
function drawProp(ctx, key, x, y, s = 1, alpha = 1) {
  const r = ATLAS.props[key], im = IMG.props; if (!r || !im) return;
  const k = ATLAS.pk * s;
  if (alpha !== 1) ctx.globalAlpha = alpha;
  ctx.drawImage(im, r[0], r[1], r[2], r[3], x - r[4] * k, y - r[5] * k, r[2] * k, r[3] * k);
  if (alpha !== 1) ctx.globalAlpha = 1;
}
const ROT_DIR = [0, 2, 4, 6]; // trap rot (E,S,W,N) -> prop dir
