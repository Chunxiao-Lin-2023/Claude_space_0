'use strict';
/* ================= core utils ================= */
const TAU = Math.PI * 2, PI = Math.PI, HP = Math.PI / 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));
const d2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
const dist = (ax, az, bx, bz) => Math.sqrt(d2(ax, az, bx, bz));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
const angLerp = (a, b, t) => a + angDiff(a, b) * t;
const fmt = n => n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万' : '' + Math.round(n);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let RNG = mulberry32(20261028);
const rnd = () => RNG();
const rr = (a, b) => a + RNG() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = a => a[Math.floor(RNG() * a.length)];
/* deterministic hash noise (value noise + fbm) used by terrain and scatter, independent of RNG */
function hash2(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1; }
function fbm(x, y, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += vnoise(x * f + i * 17.3, y * f - i * 9.1) * a; n += a; a *= 0.5; f *= 2.03; } return s / n; }
function ridged(x, y, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += (1 - Math.abs(vnoise(x * f + i * 5.7, y * f + i * 3.3))) * a; n += a; a *= 0.5; f *= 2.1; } return s / n; }
/* distance from point to polyline segment set; returns {d, t(0..1 along), i} */
function segDist(px, pz, ax, az, bx, bz) { const vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz || 1e-9; let t = ((px - ax) * vx + (pz - az) * vz) / L; t = clamp(t, 0, 1); return [Math.hypot(px - ax - vx * t, pz - az - vz * t), t]; }
function polyDist(px, pz, pts) { let best = 1e9, bt = 0, acc = 0, tot = 0; const lens = []; for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); lens.push(l); tot += l; } for (let i = 0; i < pts.length - 1; i++) { const [d, t] = segDist(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); if (d < best) { best = d; bt = (acc + t * lens[i]) / (tot || 1); } acc += lens[i]; } return { d: best, t: bt }; }

const QS = new URLSearchParams(location.search);
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || QS.get('touch') === '1';
const PFX = 'wanmei.';
const LS = { get(k, d) { try { const v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { } }, del(k) { try { localStorage.removeItem(PFX + k); } catch (e) { } } };
const SET = Object.assign({ vol: 0.7, music: 0.5, quality: IS_TOUCH ? 'mid' : 'high', shake: true, name: '', camSens: 1, invertY: false, dmgNum: true }, LS.get('settings', {}));
const saveSet = () => LS.set('settings', SET);
if (QS.get('q')) SET.quality = QS.get('q');
let NETROLE = null; // 'host' | 'guest' | null(single)
const HUB = /\/wanmei\/(index\.html)?$/.test(location.pathname);
const DBG = window.__dbg || null;
const now = () => performance.now() / 1000;

/* ================= balance (every tunable number in one place) ================= */
const BAL = {
  grav: 26, jumpV: 9.2, stepUp: 0.9, slopeMax: 1.35,
  walk: 3.2, run: 7.4, runKid: 7.0, swim: 2.6, dodgeV: 15, dodgeT: 0.26, dodgeCD: 0.9, dodgeIFrame: 0.3,
  camMin: 2.6, camMax: 26, camDef: 8.5, camPitchMin: -0.35, camPitchMax: 1.35,
  regenOOC: 0.035, regenIn: 0.004, mpRegen: 0.06, oocT: 5,
  xpCurve: lv => Math.round(60 * Math.pow(lv, 1.55) + 40),
  hpPerLv: 26, atkPerLv: 3.2, defPerLv: 1.2,
  aggroR: 13, leashR: 38, mobRespawn: 75, reviveT: 3.2, downedT: 30,
  critBase: 0.08, critMul: 1.75,
  lootR: 2.2, interactR: 2.6,
  partnerFollow: 4.2, partnerTele: 32,
  shadowFar: 55,
};
