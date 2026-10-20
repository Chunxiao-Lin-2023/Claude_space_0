'use strict';
/* ================= 尸夜孤楼 Last Tower — core: constants, data tables, balance, utils ================= */
const QS = new URLSearchParams(location.search);
const DBG = window.__dbg || null;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const sgn = v => v > 0 ? 1 : v < 0 ? -1 : 0;
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const FX_RNG = mulberry(12345); // cosmetic randomness (never affects simulation)
const frnd = (a = 0, b = 1) => a + FX_RNG() * (b - a);

/* ---------- world geometry ---------- */
const T = 32;            // world px per tile
const MW = 140, MH = 48; // map size in tiles
const GR = 40;           // first ground row (rows >= GR are dirt)
const GY = GR * T;       // ground surface y in px
const BZ0 = 48, BZ1 = 92; // build zone columns [BZ0, BZ1)
const RADIO = { x: 70 * T, w: 1.5 * T, h: 1.3 * T, c0: 69, c1: 70 };
const BENCH = { x: 72.6 * T, c0: 72, c1: 73 };
const GRAV = 2200;

/* ---------- blocks ---------- */
// flags: P solid for players, Z solid for zombies, B stops bullets, plat = one-way floor, lad = ladder,
// st = carries structural support, dep = needs a block (or ground) right below, wire = barbed wire, lamp = light
const BLOCKS = [
  null,
  { id: 1, key: 'wood', name: '木墙', cost: { wood: 4 }, hp: 140, cap: 6, P: 1, Z: 1, B: 1, st: 1, tip: '便宜的墙，撑得住 5 格跨度' },
  { id: 2, key: 'brick', name: '砖墙', cost: { stone: 4 }, hp: 340, cap: 8, P: 1, Z: 1, B: 1, st: 1, tip: '结实，承重更好' },
  { id: 3, key: 'steel', name: '钢墙', cost: { steel: 4 }, hp: 700, cap: 12, P: 1, Z: 1, B: 1, st: 1, tip: '最硬的墙，重锤也要砸半天' },
  { id: 4, key: 'wfloor', name: '木地板', cost: { wood: 2 }, hp: 90, cap: 6, plat: 1, st: 1, tip: '单向楼板：可以从下面跳上来，按 S 落下' },
  { id: 5, key: 'sfloor', name: '钢地板', cost: { steel: 2 }, hp: 280, cap: 10, plat: 1, st: 1, tip: '跨度大的楼板' },
  { id: 6, key: 'ladder', name: '梯子', cost: { wood: 2 }, hp: 70, cap: 4, lad: 1, st: 1, tip: '上下楼。攀爬者也会爬！' },
  { id: 7, key: 'door', name: '木门', cost: { wood: 6 }, hp: 200, cap: 6, Z: 1, B: 1, st: 1, tip: '人能穿过，丧尸只能砸' },
  { id: 8, key: 'bars', name: '射击栅栏', cost: { steel: 3 }, hp: 300, cap: 6, P: 1, Z: 1, st: 1, tip: '挡人挡丧尸，子弹能穿过' },
  { id: 9, key: 'wire', name: '铁丝网', cost: { steel: 2, parts: 1 }, hp: 110, cap: 0, dep: 1, wire: 1, tip: '减速并割伤经过的丧尸，会磨损' },
  { id: 10, key: 'lamp', name: '探照灯', cost: { parts: 3, wood: 1 }, hp: 60, cap: 0, dep: 1, lamp: 1, tip: '夜里照亮周围 6 格' },
];
const DIRT = 20;
const TF = new Array(32).fill(0).map(() => ({}));
BLOCKS.forEach(b => { if (b) TF[b.id] = b; });
TF[DIRT] = { id: DIRT, P: 1, Z: 1, B: 1, ground: 1 };
const PAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RES = [
  { k: 'wood', name: '木材', col: '#c98b4a' },
  { k: 'stone', name: '砖石', col: '#b9a99a' },
  { k: 'steel', name: '钢材', col: '#9fb7c9' },
  { k: 'parts', name: '零件', col: '#e6c55a' },
];
const costText = c => Object.keys(c).map(k => RES.find(r => r.k === k).name + c[k]).join(' ');

/* ---------- weapons ---------- */
const WPN = [
  { k: 'pistol', name: '手枪', dmg: 24, rate: 0.2, mag: 12, reload: 1.0, spread: 0.035, range: 22 * T, pellets: 1, inf: 1, kick: 40, auto: 0, shake: 1.5 },
  { k: 'shotgun', name: '霰弹枪', dmg: 13, rate: 0.72, mag: 6, reload: 1.7, spread: 0.2, range: 11 * T, pellets: 8, kick: 120, auto: 0, shake: 5, start: 24 },
  { k: 'rifle', name: '步枪', dmg: 23, rate: 0.095, mag: 30, reload: 1.6, spread: 0.05, range: 28 * T, pellets: 1, kick: 30, auto: 1, shake: 2 },
  { k: 'sniper', name: '狙击枪', dmg: 150, rate: 1.05, mag: 5, reload: 2.1, spread: 0.004, range: 60 * T, pellets: 1, pierce: 5, kick: 160, auto: 0, shake: 6 },
];

/* ---------- zombies ---------- */
const ZT = {
  walker: { name: '游荡者', hp: 70, spd: 46, w: 0.7, h: 1.82, dmg: 12, bdmg: 12, cd: 1.0, score: 1, col: '#7d8f6a' },
  runner: { name: '疾跑者', hp: 45, spd: 150, w: 0.62, h: 1.75, dmg: 8, bdmg: 7, cd: 0.6, score: 1, col: '#8a8f70' },
  climber: { name: '攀爬者', hp: 50, spd: 105, climb: 95, w: 0.66, h: 1.2, dmg: 9, bdmg: 8, cd: 0.7, score: 2, col: '#6f7e86' },
  spitter: { name: '喷吐者', hp: 95, spd: 42, w: 0.85, h: 1.85, dmg: 10, bdmg: 8, cd: 1.0, score: 2, col: '#7f9a45', range: 10 * T, spitCD: 3.0 },
  brute: { name: '重锤', hp: 650, spd: 34, w: 1.15, h: 2.4, dmg: 28, bdmg: 75, cd: 1.6, score: 6, col: '#7a6f66', kb: 520 },
  boss: { name: '巨尸', hp: 3200, spd: 28, w: 1.7, h: 3.3, dmg: 45, bdmg: 220, cd: 2.0, score: 30, col: '#6d5d58', kb: 800 },
};
const ZKEYS = ['walker', 'runner', 'climber', 'spitter', 'brute', 'boss'];

/* ---------- scavenging spots ---------- */
const SPOTS = {
  car: { name: '汽车残骸', w: 3.2, loot: { steel: [3, 6], parts: [1, 3] } },
  wood: { name: '木料堆', w: 2.2, loot: { wood: [8, 14] } },
  rubble: { name: '废墟', w: 2.6, loot: { stone: [7, 12], wood: [1, 4] } },
  crate: { name: '补给箱', w: 1.4, loot: { parts: [2, 4] }, ammo: 1 },
};

/* ---------- crafting (workbench) ---------- */
const CRAFT = [
  { id: 'rifle', name: '步枪', desc: '全自动，30 发弹匣', cost: { parts: 12, steel: 6 }, wpn: 2 },
  { id: 'sniper', name: '狙击枪', desc: '一枪穿透 5 只', cost: { parts: 18, steel: 8 }, wpn: 3 },
  { id: 'shells', name: '霰弹 ×12', desc: '', cost: { parts: 2 }, ammo: [1, 12] },
  { id: 'rounds', name: '步枪弹 ×60', desc: '', cost: { parts: 3 }, ammo: [2, 60] },
  { id: 'slugs', name: '狙击弹 ×10', desc: '', cost: { parts: 3 }, ammo: [3, 10] },
  { id: 'nade', name: '手雷 ×2', desc: '最多带 6 颗', cost: { parts: 4 }, nade: 2 },
  { id: 'med', name: '医疗包', desc: '回复 60 生命，最多 3 个', cost: { parts: 3, wood: 2 }, med: 1 },
  { id: 'radio', name: '加固电台', desc: '电台 +200 生命', cost: { steel: 6, parts: 2 }, radio: 200 },
  { id: 'upg', name: '强化弹头', desc: '全队伤害 +12%（最多 5 级）', cost: { parts: 8 }, upg: 1 },
];

/* ---------- balance (all tunable numbers live here) ---------- */
const BAL = {
  nights: 15,                  // survive this many nights to be rescued
  dayLen: [150, 110],          // first day, later days (s)
  pMaxHp: 100, pSpeed: 200, pJump: 640, pClimb: 170, pReach: 6.5, // reach in tiles
  downTime: 30, reviveTime: 2.4, soloDownTime: 8, respawnHp: 0.5,
  searchTime: 1.5, healTime: 1.0, medHeal: 60,
  shoveDmg: 18, shoveKB: 380, shoveCD: 0.55, shoveRange: 1.4,
  nadeDmg: 220, nadeR: 3.2, nadeFuse: 1.6,
  headshot: 1.6,
  radioHp: 1200, radioDmg: 0.5,
  startRes: { wood: 110, stone: 30, steel: 20, parts: 8 },
  refund: 0.5,
  nightSpawn: n => Math.round(9 + n * 5.2),
  bloodMul: 1.55,
  hpMul: n => 1 + 0.11 * (n - 1),
  spdMul: n => 1 + 0.018 * (n - 1),
  spawnDur: n => 45 + n * 3,
  dayStragglers: 3, dayStragglerCD: 14,
  lootFar: 40,                 // loot multiplier grows by 1 per this many tiles from the radio
  wireDps: 14, wireSlow: 0.45, wireWear: 6,
  diff: { easy: { hp: 0.75, n: 0.75, dmg: 0.7 }, normal: { hp: 1, n: 1, dmg: 1 }, hard: { hp: 1.3, n: 1.3, dmg: 1.25 } },
};
const isBlood = n => n % 5 === 0;

/* ---------- settings / storage (prefix lasttower.) ---------- */
const SKEY = 'lasttower.';
function lsGet(k, d) { try { const v = localStorage.getItem(SKEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(SKEY + k, JSON.stringify(v)); } catch (e) { } }
const SET = Object.assign({ name: '', mute: false, diff: 'normal', zoom: 1 }, lsGet('set', {}));
const saveSet = () => lsSet('set', SET);

/* ---------- global state ---------- */
let W = null;           // the world (sim state)
let ME = 0;             // local player index
let NETROLE = null;     // null | 'solo' | 'host' | 'guest'
const STATE = { mode: 'title', paused: false };
const HUB = /\/lasttower\/(index\.html)?$/.test(location.pathname);
