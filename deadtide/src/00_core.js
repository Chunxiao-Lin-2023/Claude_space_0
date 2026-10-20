'use strict';
/* ================= 尸潮堡垒 Dead Tide — core: constants, data tables, balance, utils ================= */
const QS = new URLSearchParams(location.search);
const DBG = window.__dbg || null;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sgn = v => v > 0 ? 1 : v < 0 ? -1 : 0;
const r2 = v => Math.round(v * 100) / 100;
const r3 = v => Math.round(v * 1000) / 1000;
const d2 = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const FXR = mulberry(99); const frnd = (a = 0, b = 1) => a + FXR() * (b - a);
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

/* ---------- world geometry ---------- */
const MW = 64, MH = 64, ML = 8;     // grid columns, rows, layers
const FH = 1.3;                      // height of one layer (storey / terrain step) in world units
const NC = MW * MH * ML;
const ci = (x, y, L) => (L * MH + y) * MW + x;
const cx_ = i => i % MW, cy_ = i => ((i / MW) | 0) % MH, cl_ = i => (i / (MW * MH)) | 0;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // 0:+x(east) 1:+y(south) 2:-x(west) 3:-y(north)
const BUILD_R = 13;                 // build zone: Chebyshev distance from the radio
const GRAV = 22;

/* ---------- blocks (cell contents) ----------
   P/Z: blocks players / zombies, B: stops bullets, top: can be stood on (supports the layer above),
   st: structural (takes part in support), cap: support it passes on, brk: zombies can smash it */
const B = [];
const defB = (id, o) => { B[id] = Object.assign({ id, P: 0, Z: 0, B: 0, top: 0, st: 0, cap: 0, hp: 0, brk: 0, nat: 0 }, o); };
defB(0, { key: 'air' });
defB(1, { key: 'wood', name: '木墙', cost: { wood: 4 }, hp: 140, cap: 6, P: 1, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#86603a', tip: '便宜的墙，撑得住 5 格跨度' });
defB(2, { key: 'brick', name: '砖墙', cost: { stone: 4 }, hp: 340, cap: 8, P: 1, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#8a4c3a', tip: '结实，承重更好' });
defB(3, { key: 'steel', name: '钢墙', cost: { steel: 4 }, hp: 700, cap: 12, P: 1, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#6f8494', tip: '最硬的墙，重锤也要砸半天' });
defB(4, { key: 'wfloor', name: '木地板', cost: { wood: 2 }, hp: 90, cap: 6, slab: 1, st: 1, brk: 1, col: '#7a5232', tip: '楼板：要建在当前视图层，往上一层就切到上一层再建' });
defB(5, { key: 'sfloor', name: '钢地板', cost: { steel: 2 }, hp: 280, cap: 10, slab: 1, st: 1, brk: 1, col: '#64788a', tip: '跨度大的楼板' });
defB(6, { key: 'stairs', name: '楼梯', cost: { wood: 4 }, hp: 120, cap: 5, stairs: 1, st: 1, brk: 1, col: '#8a6440', tip: '朝向是放置时屏幕的「上」，R 键旋转。攀爬者以外的丧尸也会走楼梯' });
defB(7, { key: 'door', name: '木门', cost: { wood: 6 }, hp: 200, cap: 6, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#5c3c22', tip: '人能穿过，丧尸只能砸' });
defB(8, { key: 'bars', name: '射击栅栏', cost: { steel: 3 }, hp: 300, cap: 6, P: 1, Z: 1, top: 1, st: 1, brk: 1, col: '#6f7f8c', tip: '挡人挡丧尸，子弹能穿过' });
defB(9, { key: 'wire', name: '铁丝网', cost: { steel: 2, parts: 1 }, hp: 110, dep: 1, wire: 1, brk: 0, col: '#9aa0a6', tip: '减速并割伤经过的丧尸，会磨损' });
defB(10, { key: 'lamp', name: '探照灯', cost: { parts: 3, wood: 1 }, hp: 60, dep: 1, lamp: 1, col: '#ffe9a8', tip: '夜里照亮周围' });
// natural / fixed
defB(20, { key: 'dirt', P: 1, Z: 1, B: 1, top: 1, nat: 1 });
defB(21, { key: 'rock', P: 1, Z: 1, B: 1, nat: 1, res: 'stone', hp: 1 });
defB(22, { key: 'tree', P: 1, Z: 1, nat: 1, res: 'wood', hp: 1 });
defB(23, { key: 'water', P: 1, Z: 1, nat: 1 });
defB(24, { key: 'ruin', P: 1, Z: 1, B: 1, top: 1, nat: 1, brk: 1, hp: 260, col: '#7c4a3a' });
defB(25, { key: 'car', P: 1, Z: 1, B: 1, nat: 1, spot: 'car' });
defB(26, { key: 'crate', P: 1, Z: 1, B: 1, nat: 1, spot: 'crate' });
defB(27, { key: 'fence', P: 1, Z: 1, nat: 1 });
defB(28, { key: 'ramp', stairs: 1, nat: 1 });
defB(29, { key: 'rubble', P: 1, Z: 1, nat: 1, spot: 'rubble' });
defB(30, { key: 'radio', P: 1, Z: 1, B: 1, nat: 1 });
defB(31, { key: 'bench', P: 1, Z: 1, B: 1, nat: 1 });
const PAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SLAB_BRIDGE = 11; // slab id for the pre-built bridges (not buildable)
defB(11, { key: 'bridge', slab: 1, nat: 1, col: '#7e5a36' });
const RES = [
  { k: 'wood', name: '木材', col: '#c98b4a' },
  { k: 'stone', name: '砖石', col: '#b9a99a' },
  { k: 'steel', name: '钢材', col: '#9fb7c9' },
  { k: 'parts', name: '零件', col: '#e6c55a' },
];
const costText = c => Object.keys(c).map(k => RES.find(r => r.k === k).name + c[k]).join(' ');
const affordable = (res, cost) => Object.keys(cost).every(k => (res[k] || 0) >= cost[k]);

/* ---------- weapons (ranges in tiles) ---------- */
const WPN = [
  { k: 'pistol', name: '手枪', dmg: 24, rate: 0.2, mag: 12, reload: 1.0, spread: 0.03, range: 15, pellets: 1, inf: 1, kick: 0.6, shake: 0.12 },
  { k: 'shotgun', name: '霰弹枪', dmg: 13, rate: 0.72, mag: 6, reload: 1.7, spread: 0.17, range: 8, pellets: 8, kick: 1.6, shake: 0.35, start: 24 },
  { k: 'rifle', name: '步枪', dmg: 23, rate: 0.095, mag: 30, reload: 1.6, spread: 0.045, range: 20, pellets: 1, kick: 0.4, shake: 0.12 },
  { k: 'sniper', name: '狙击枪', dmg: 150, rate: 1.05, mag: 5, reload: 2.1, spread: 0.004, range: 45, pellets: 1, pierce: 5, kick: 2, shake: 0.4 },
];

/* ---------- zombies (speeds in tiles/s) ---------- */
const ZT = {
  walker: { name: '游荡者', hp: 70, spd: 1.0, r: 0.28, h: 1.0, dmg: 12, bdmg: 12, cd: 1.0, sc: 1 },
  runner: { name: '疾跑者', hp: 45, spd: 3.1, r: 0.26, h: 0.95, dmg: 8, bdmg: 7, cd: 0.6, sc: 0.95 },
  climber: { name: '攀爬者', hp: 50, spd: 2.3, r: 0.26, h: 0.7, dmg: 7, bdmg: 8, cd: 0.7, sc: 0.9, climb: 1 },
  spitter: { name: '喷吐者', hp: 95, spd: 0.9, r: 0.32, h: 1.05, dmg: 10, bdmg: 8, cd: 1.0, sc: 1.05, range: 9, spitCD: 3 },
  brute: { name: '重锤', hp: 650, spd: 0.8, r: 0.42, h: 1.45, dmg: 28, bdmg: 75, cd: 1.6, sc: 1.45, kb: 6 },
  boss: { name: '巨尸', hp: 2600, spd: 0.65, r: 0.62, h: 2.2, dmg: 45, bdmg: 220, cd: 2.0, sc: 2.2, kb: 9 },
};
const ZKEYS = ['walker', 'runner', 'climber', 'spitter', 'brute', 'boss'];

/* ---------- scavenging / gathering ---------- */
const SPOTS = {
  car: { name: '汽车残骸', loot: { steel: [3, 6], parts: [1, 3] } },
  crate: { name: '补给箱', loot: { parts: [2, 4] }, ammo: 1 },
  rubble: { name: '废墟瓦砾', loot: { stone: [5, 9], wood: [2, 4] } },
};
const GATHER = { 22: { name: '砍树', res: 'wood', n: [6, 10], t: 1.6 }, 21: { name: '采石', res: 'stone', n: [6, 10], t: 2.0 } };

/* ---------- crafting (workbench next to the radio) ---------- */
const CRAFT = [
  { id: 'rifle', name: '步枪', desc: '全自动，30 发弹匣', cost: { parts: 12, steel: 6 }, wpn: 2 },
  { id: 'sniper', name: '狙击枪', desc: '一枪穿透 5 只', cost: { parts: 18, steel: 8 }, wpn: 3 },
  { id: 'shells', name: '霰弹 ×12', desc: '', cost: { parts: 2 }, ammo: [1, 12] },
  { id: 'rounds', name: '步枪弹 ×60', desc: '', cost: { parts: 3 }, ammo: [2, 60] },
  { id: 'slugs', name: '狙击弹 ×10', desc: '', cost: { parts: 3 }, ammo: [3, 10] },
  { id: 'nade', name: '手雷 ×2', desc: '最多带 6 颗', cost: { parts: 4 }, nade: 2 },
  { id: 'med', name: '医疗包', desc: '回复 60 生命，最多 3 个', cost: { parts: 3, wood: 2 }, med: 1 },
  { id: 'radio', name: '加固电台', desc: '电台 +250 生命', cost: { steel: 6, parts: 2 }, radio: 250 },
  { id: 'upg', name: '强化弹头', desc: '全队伤害 +12%（最多 5 级）', cost: { parts: 8 }, upg: 1 },
];

/* ---------- balance ---------- */
const BAL = {
  nights: 15,
  dayLen: [160, 120],
  pMaxHp: 100, pSpeed: 4.4, pReach: 6.5,
  downTime: 30, reviveTime: 2.4, soloDownTime: 8, respawnHp: 0.5,
  searchTime: 1.5, healTime: 1.0, medHeal: 60,
  shoveDmg: 18, shoveKB: 6, shoveCD: 0.55, shoveRange: 1.3,
  nadeDmg: 220, nadeR: 2.8, nadeFuse: 1.6,
  headshot: 1.6,
  radioHp: 1500, radioDmg: 0.5,
  startRes: { wood: 90, stone: 30, steel: 20, parts: 8 },
  refund: 0.5,
  nightSpawn: n => Math.round(12 + n * 6),
  bloodMul: 1.5,
  hpMul: n => 1 + 0.11 * (n - 1),
  spdMul: n => 1 + 0.02 * (n - 1),
  spawnDur: n => 45 + n * 3,
  dayStragglers: 4, dayStragglerCD: 13,
  lootFar: 30, wireDps: 14, wireSlow: 0.45, wireWear: 6,
  aggro: 11,                     // path distance at which zombies switch from the radio to a player
  diff: { easy: { hp: 0.75, n: 0.75, dmg: 0.7 }, normal: { hp: 1, n: 1, dmg: 1 }, hard: { hp: 1.3, n: 1.3, dmg: 1.25 } },
};
const isBlood = n => n % 5 === 0;

/* ---------- settings / storage ---------- */
const SKEY = 'deadtide.';
function lsGet(k, d) { try { const v = localStorage.getItem(SKEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(SKEY + k, JSON.stringify(v)); } catch (e) { } }
const SET = Object.assign({ name: '', mute: false, diff: 'normal', zoom: 1, shadows: 1 }, lsGet('set', {}));
const saveSet = () => lsSet('set', SET);

let W = null, ME = 0, NETROLE = null;
const STATE = { mode: 'title', paused: false };
const HUB = /\/deadtide\/(index\.html)?$/.test(location.pathname);
