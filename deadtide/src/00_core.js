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
const MW = 160, MH = 160, ML = 10;     // grid columns, rows, layers
const FH = 1.3;
const PH = 0.62;
const LEAN = 1.7;                   // shooters lean over parapets this close to them                    // parapet height: upper-floor walls with nothing on top are only waist high                      // height of one layer (storey / terrain step) in world units
const NC = MW * MH * ML;
const ci = (x, y, L) => (L * MH + y) * MW + x;
const cx_ = i => i % MW, cy_ = i => ((i / MW) | 0) % MH, cl_ = i => (i / (MW * MH)) | 0;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // 0:+x(east) 1:+y(south) 2:-x(west) 3:-y(north)
const BUILD_R = 20;                 // build zone: Chebyshev distance from the camp centre
const GRAV = 22;

/* ---------- blocks (cell contents) ----------
   P/Z: blocks players / zombies, B: stops bullets, top: can be stood on (supports the layer above),
   st: structural (takes part in support), cap: support it passes on, brk: zombies can smash it */
const B = [];
const defB = (id, o) => { B[id] = Object.assign({ id, P: 0, Z: 0, B: 0, top: 0, st: 0, cap: 0, hp: 0, brk: 0, nat: 0 }, o); };
defB(0, { key: 'air' });
defB(1, { key: 'wood', name: '木墙', cost: { wood: 4 }, hp: 260, cap: 6, P: 1, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#86603a', tip: '便宜的墙，撑得住 5 格跨度' });
defB(2, { key: 'brick', name: '砖墙', cost: { stone: 4 }, hp: 600, cap: 8, P: 1, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#8a4c3a', tip: '结实，承重更好' });
defB(3, { key: 'steel', name: '钢墙', cost: { steel: 4 }, hp: 1100, cap: 12, P: 1, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#6f8494', tip: '最硬的墙，重锤也要砸半天' });
defB(4, { key: 'wfloor', name: '木地板', cost: { wood: 2 }, hp: 90, cap: 6, slab: 1, st: 1, brk: 1, col: '#7a5232', tip: '指墙顶就铺在墙上，指屋里就铺成天花板，站在楼上指外面能往外延伸' });
defB(5, { key: 'sfloor', name: '钢地板', cost: { steel: 2 }, hp: 280, cap: 10, slab: 1, st: 1, brk: 1, col: '#64788a', tip: '跨度大的楼板' });
defB(6, { key: 'stairs', name: '爬梯', cost: { wood: 3 }, hp: 120, cap: 5, stairs: 1, st: 1, brk: 1, col: '#8a6440', tip: '靠墙的梯子：朝箭头方向走就爬上去，R 键转方向。丧尸爬梯子很慢，正好守着打' });
defB(7, { key: 'door', name: '木门', cost: { wood: 6 }, hp: 320, cap: 6, Z: 1, B: 1, top: 1, st: 1, brk: 1, col: '#5c3c22', tip: '人能穿过，丧尸只能砸' });
defB(8, { key: 'bars', name: '射击栅栏', cost: { steel: 3 }, hp: 300, cap: 6, P: 1, Z: 1, top: 1, st: 1, brk: 1, col: '#6f7f8c', tip: '挡人挡丧尸，子弹能穿过' });
// obstacles: people vault over them, zombies have to smash through
defB(12, { key: 'sandbag', name: '沙袋矮墙', cost: { stone: 3 }, hp: 260, P: 1, Z: 1, dep: 1, brk: 1, vault: 1, col: '#a8946a', tip: '半人高：人能翻过去、子弹能从上面打过去，丧尸只能砸' });
defB(13, { key: 'spikes', name: '拒马', cost: { wood: 4, steel: 1 }, hp: 200, P: 1, Z: 1, dep: 1, brk: 1, vault: 1, thorns: 10, col: '#6a5038', tip: '丧尸砸它会被扎伤，人能翻过去' });
defB(14, { key: 'cover', name: '铁皮掩体', cost: { steel: 3 }, hp: 420, P: 1, Z: 1, B: 1, dep: 1, brk: 1, vault: 1, col: '#7a8590', tip: '挡子弹的掩体，人能翻过去' });
defB(15, { key: 'trap', name: '捕兽夹', cost: { steel: 1, parts: 2 }, hp: 40, dep: 1, trap: 1, col: '#5a5a55', tip: '丧尸踩上去被夹住 2.5 秒，用一次就坏' });
defB(9, { key: 'wire', name: '铁丝网', cost: { steel: 2, parts: 1 }, hp: 110, dep: 1, wire: 1, brk: 0, col: '#9aa0a6', tip: '减速并割伤经过的丧尸，会磨损' });
defB(10, { key: 'lamp', name: '探照灯', cost: { parts: 3, wood: 1 }, hp: 60, dep: 1, lamp: 1, col: '#ffe9a8', tip: '夜里照亮周围' });
// natural / fixed
defB(20, { key: 'dirt', P: 1, Z: 1, B: 1, top: 1, nat: 1 });
defB(21, { key: 'rock', P: 1, Z: 1, nat: 1, res: 'stone', hp: 1 });
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
// more things to search (spot) and gather (res) around the map
defB(32, { key: 'trash', P: 1, Z: 1, nat: 1, spot: 'trash' });
defB(33, { key: 'backpack', nat: 1, spot: 'backpack' });
defB(34, { key: 'cabinet', P: 1, Z: 1, B: 1, nat: 1, spot: 'cabinet' });
defB(35, { key: 'toolbox', nat: 1, spot: 'toolbox' });
defB(36, { key: 'milcrate', P: 1, Z: 1, B: 1, nat: 1, spot: 'milcrate' });
defB(37, { key: 'barrel', P: 1, Z: 1, B: 1, nat: 1, spot: 'barrel' });
defB(38, { key: 'vending', P: 1, Z: 1, B: 1, nat: 1, spot: 'vending' });
defB(39, { key: 'scrap', P: 1, Z: 1, nat: 1, res: 'steel', hp: 1 });
defB(40, { key: 'logs', P: 1, Z: 1, nat: 1, res: 'wood', hp: 1 });
defB(41, { key: 'bush', nat: 1, res: 'wood', hp: 1 });
// mode objectives (not breakable by zombies; the player damages nests through modeHit)
defB(43, { key: 'objbox', P: 1, Z: 1, nat: 1, obj: 1, col: '#ffcf3a' });
defB(44, { key: 'nest', P: 1, Z: 1, B: 1, nat: 1, obj: 1, hp: 1500, col: '#6a1f2a' });
defB(45, { key: 'tower', P: 1, Z: 1, B: 1, nat: 1, obj: 1, col: '#8a96a0' });
defB(46, { key: 'drop', P: 1, Z: 1, B: 1, nat: 1, obj: 1, col: '#3a6ea8' });
defB(47, { key: 'truck', P: 1, Z: 1, B: 1, nat: 1, obj: 1, col: '#5a6a3a' });
defB(42, { key: 'rail', P: 1, Z: 1, nat: 1, brk: 1, vault: 1, hp: 120, col: '#6a6f74' }); // balcony / roof / mezzanine railing: low, vaultable, bullets pass
const PAL = [1, 2, 3, 4, 5, 6, 7, 8, 12, 13, 14, 9, 15, 10];
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
// each gun has its own trick: pistol headshots, shotgun knock-back + stagger (falls off with range), rifle bloom,
// sniper pierce + laser, crossbow pins, flamer sets fire, launcher explodes. loot = ammo found per supply pickup.
const WPN = [
  { k: 'pistol', name: '手枪', dmg: 34, rate: 0.3, mag: 12, reload: 1.0, spread: 0.03, range: 15, pellets: 1, inf: 1, kick: 0.6, shake: 0.12, hs: 2.2, loot: 0 },
  { k: 'shotgun', name: '霰弹枪', dmg: 17, rate: 0.72, mag: 6, reload: 1.7, spread: 0.17, range: 8, pellets: 8, kick: 2.6, shake: 0.35, start: 24, stun: 0.3, falloff: 1, loot: 8 },
  { k: 'rifle', name: '步枪', dmg: 30, rate: 0.12, mag: 30, reload: 1.6, spread: 0.035, range: 20, pellets: 1, kick: 0.4, shake: 0.12, bloom: 0.22, loot: 30 },
  { k: 'sniper', name: '狙击枪', dmg: 195, rate: 1.05, mag: 5, reload: 2.1, spread: 0.004, range: 45, pellets: 1, pierce: 5, kick: 4, shake: 0.4, stun: 0.5, laser: 1, loot: 4 },
  { k: 'crossbow', name: '弩', dmg: 110, rate: 0.75, mag: 6, reload: 1.5, spread: 0.008, range: 26, pellets: 1, pierce: 3, kick: 0.6, shake: 0.06, pin: 1.1, loot: 6 },
  { k: 'flamer', name: '喷火器', dmg: 12, rate: 0.07, mag: 80, reload: 2.2, spread: 0.32, range: 4.8, pellets: 1, flame: 1, burn: 3.5, kick: 0, shake: 0.02, loot: 40 },
  { k: 'launcher', name: '榴弹发射器', dmg: 220, rate: 0.9, mag: 4, reload: 2.6, spread: 0.015, range: 22, pellets: 1, gl: 1, kick: 0, shake: 0.3, loot: 2 },
];
const NW = WPN.length;

/* ---------- zombies (speeds in tiles/s) ---------- */
const ZT = {
  walker: { name: '游荡者', hp: 70, spd: 1.0, r: 0.31, h: 1.2, dmg: 12, bdmg: 12, cd: 1.0, sc: 1.2 },
  runner: { name: '疾跑者', hp: 45, spd: 3.1, r: 0.29, h: 1.14, dmg: 8, bdmg: 7, cd: 0.6, sc: 1.14 },
  climber: { name: '攀爬者', hp: 50, spd: 2.3, r: 0.29, h: 0.84, dmg: 7, bdmg: 8, cd: 0.7, sc: 1.08, climb: 1 },
  spitter: { name: '喷吐者', hp: 95, spd: 0.9, r: 0.36, h: 1.26, dmg: 10, bdmg: 8, cd: 1.0, sc: 1.26, range: 9, spitCD: 3 },
  brute: { name: '重锤', hp: 650, spd: 0.8, r: 0.44, h: 1.74, dmg: 28, bdmg: 75, cd: 1.6, sc: 1.74, kb: 6 },
  boss: { name: '巨尸', hp: 2600, spd: 0.65, r: 0.69, h: 2.64, dmg: 45, bdmg: 220, cd: 2.0, sc: 2.64, kb: 9 },
  dog: { name: '尸犬', hp: 40, spd: 3.7, r: 0.27, h: 0.66, dmg: 8, bdmg: 3, cd: 0.5, sc: 1.2 },
  crawler: { name: '爬行尸', hp: 60, spd: 0.75, r: 0.3, h: 0.46, dmg: 11, bdmg: 9, cd: 0.9, sc: 1.2 },
  bloater: { name: '爆尸', hp: 120, spd: 0.75, r: 0.4, h: 1.32, dmg: 10, bdmg: 10, cd: 1.1, sc: 1.32, blast: 1 },
  screamer: { name: '尖叫者', hp: 80, spd: 1.5, r: 0.3, h: 1.26, dmg: 9, bdmg: 6, cd: 0.9, sc: 1.26, scream: 1 },
  leaper: { name: '飞扑尸王', hp: 2300, spd: 1.15, r: 0.5, h: 2.1, dmg: 30, bdmg: 60, cd: 1.2, sc: 2.0, kb: 7, boss: 1, look: 'boss', skin: '#7a4a3a' },
  digger: { name: '掘地尸王', hp: 2700, spd: 0.95, r: 0.55, h: 2.0, dmg: 34, bdmg: 90, cd: 1.4, sc: 2.0, kb: 8, boss: 1, look: 'brute', skin: '#6a6048' },
  summoner: { name: '召唤尸王', hp: 2100, spd: 0.72, r: 0.5, h: 2.3, dmg: 22, bdmg: 40, cd: 1.4, sc: 2.2, boss: 1, look: 'boss', skin: '#5a5470' },
  venom: { name: '毒液尸王', hp: 2300, spd: 0.85, r: 0.52, h: 2.1, dmg: 26, bdmg: 50, cd: 1.3, sc: 2.1, range: 12, boss: 1, look: 'bloater', skin: '#7a9a3a' },
  armored: { name: '防暴尸', hp: 170, spd: 0.9, r: 0.36, h: 1.26, dmg: 15, bdmg: 16, cd: 1.1, sc: 1.3, armor: 0.3 },
};
// aim assist (SET.assist): fire-button lock range (x weapon range), lock-on time before it fires, spread while auto-aimed, mouse/finger magnet
const PORT = 1.25; // firing port: your own shots pass a wall / door you built if it is this close to you
const ASSIST = [{ name: '关', range: 0, acq: 0, spread: 1, mag: 0 }, { name: '标准', range: 0.75, acq: 0.3, spread: 1.5, mag: 1 }, { name: '强', range: 1, acq: 0, spread: 1, mag: 1 }];
const assistLv = () => ASSIST[SET.assist == null ? 1 : SET.assist] || ASSIST[1];
const ZKEYS = ['walker', 'runner', 'climber', 'spitter', 'brute', 'boss', 'dog', 'crawler', 'bloater', 'screamer', 'armored', 'leaper', 'digger', 'summoner', 'venom']; // order is the net id

/* ---------- scavenging / gathering ---------- */
// vanish: searched once and gone (restocked at random places every dawn); otherwise a fixture that refills sometimes
// ammo: x supply pickups for the whole team; med / nade: chance of one; fuel: flamer fuel if someone owns it
const SPOTS = {
  car: { name: '汽车残骸', loot: { steel: [3, 6], parts: [1, 3] }, refill: 1 },
  vending: { name: '售货机', loot: { parts: [1, 3] }, med: 0.5, refill: 1 },
  crate: { name: '补给箱', loot: { parts: [2, 4] }, ammo: 1, med: 0.35, nade: 0.35, vanish: 1, n: 30 },
  rubble: { name: '废墟瓦砾', loot: { stone: [5, 9], wood: [2, 4] }, vanish: 1, n: 40 },
  trash: { name: '垃圾桶', loot: { parts: [0, 2], wood: [1, 3] }, med: 0.12, vanish: 1, n: 40 },
  backpack: { name: '遇难者的背包', loot: { parts: [1, 2] }, ammo: 1, med: 0.5, nade: 0.3, vanish: 1, n: 24 },
  cabinet: { name: '柜子', loot: { parts: [1, 3], wood: [2, 4] }, med: 0.35, vanish: 1, n: 24 },
  toolbox: { name: '工具箱', loot: { parts: [3, 5], steel: [2, 4] }, vanish: 1, n: 16 },
  milcrate: { name: '军用物资箱', loot: { parts: [2, 4] }, ammo: 2, nade: 1, vanish: 1, n: 8 },
  barrel: { name: '油桶', loot: { steel: [2, 4] }, fuel: 40, vanish: 1, n: 24 },
};
/* ---------- daily tasks: three are rolled every dawn (and at the start) and last until the next dawn ---------- */
// need(d, W) -> target count for upcoming night d; min = first night it can appear; rw = reward pool keys
const TASKS = {
  kill: { t: n => '击杀 ' + n + ' 只丧尸', need: d => Math.round(BAL.nightSpawn(d) * 0.6), w: 3, rw: ['parts', 'ammo', 'steel'] },
  runner: { t: n => '击杀 ' + n + ' 只奔跑者', need: d => 3 + Math.floor(d / 2), min: 3, w: 2, rw: ['parts', 'ammo'] },
  climber: { t: n => '击杀 ' + n + ' 只爬墙尸', need: d => 2 + Math.floor(d / 4), min: 5, w: 1.3, rw: ['parts', 'nade'] },
  brute: { t: n => '击杀 ' + n + ' 只巨尸', need: () => 1, min: 6, w: 1.3, rw: ['parts', 'upg'] },
  nade: { t: n => '用手雷炸死 ' + n + ' 只丧尸', need: d => 4 + Math.floor(d / 2), min: 2, w: 1.2, rw: ['nade', 'ammo'] },
  shove: { t: n => '用刀砍中 ' + n + ' 次丧尸', need: d => 10 + d, w: 1, rw: ['med', 'wood'] },
  search: { t: n => '搜索 ' + n + ' 处汽车 / 补给箱 / 瓦砾', need: d => 5 + Math.floor(d / 3), w: 2, rw: ['steel', 'ammo', 'med'] },
  far: { t: n => '去建造区外搜索 ' + n + ' 处', need: () => 3, w: 1.6, rw: ['parts', 'nade', 'med'] },
  gather: { t: n => '砍树或采石 ' + n + ' 次', need: d => 6 + Math.floor(d / 3), w: 1.5, rw: ['steel', 'parts'] },
  build: { t: n => '建造 ' + n + ' 个方块', need: d => 12 + d * 2, w: 2, rw: ['wood', 'stone', 'parts'] },
  high: { t: n => '在 3 层或更高处建造 ' + n + ' 个方块', need: () => 6, min: 2, w: 1, rw: ['steel', 'parts'] },
  clean: { t: () => '今夜没有人倒下', need: () => 1, min: 2, w: 1.4, rw: ['upg', 'med', 'nade'] },
};
// reward pools: what one completed task pays out (d = night the task was rolled for)
const TASK_RW = {
  parts: d => ({ res: { parts: 6 + Math.floor(d / 2) } }),
  steel: d => ({ res: { steel: 8 + d } }),
  wood: d => ({ res: { wood: 30 + d * 3 } }),
  stone: d => ({ res: { stone: 25 + d * 3 } }),
  ammo: () => ({ ammo: 2 }),
  med: () => ({ med: 1 }),
  nade: () => ({ nade: 2 }),
  upg: d => ({ upg: 1, res: { parts: 4 } }),
};
function taskRewardText(r) {
  const out = [];
  if (r.res) for (const k in r.res) out.push(RES.find(x => x.k === k).name + '+' + r.res[k]);
  if (r.ammo) out.push('全队弹药');
  if (r.med) out.push('每人医疗包');
  if (r.nade) out.push('每人手雷+' + r.nade);
  if (r.upg) out.push('强化弹头+1');
  return out.join(' ');
}
const GATHER = {
  22: { name: '砍树', res: 'wood', n: [6, 10], t: 1.6 }, 21: { name: '采石', res: 'stone', n: [6, 10], t: 2.0 },
  39: { name: '拆废铁', res: 'steel', n: [4, 7], t: 2.0 }, 40: { name: '搬原木', res: 'wood', n: [10, 16], t: 2.2 }, 41: { name: '砍灌木', res: 'wood', n: [2, 4], t: 0.7 },
};

/* ---------- crafting (workbench in the starter house) ---------- */
const CRAFT = [
  { id: 'rifle', name: '步枪', desc: '全自动，30 发弹匣', cost: { parts: 12, steel: 6 }, wpn: 2 },
  { id: 'sniper', name: '狙击枪', desc: '一枪穿透 5 只', cost: { parts: 18, steel: 8 }, wpn: 3 },
  { id: 'shells', name: '霰弹 ×12', desc: '', cost: { parts: 2 }, ammo: [1, 12] },
  { id: 'rounds', name: '步枪弹 ×60', desc: '', cost: { parts: 3 }, ammo: [2, 60] },
  { id: 'slugs', name: '狙击弹 ×10', desc: '', cost: { parts: 3 }, ammo: [3, 10] },
  { id: 'crossbow', name: '弩', desc: '穿透 3 只，把丧尸钉在原地 1 秒', cost: { parts: 12, wood: 12 }, wpn: 4 },
  { id: 'flamer', name: '喷火器', desc: '近距离喷火，点着的丧尸会烧，火还会传给旁边的', cost: { parts: 20, steel: 10 }, wpn: 5 },
  { id: 'launcher', name: '榴弹发射器', desc: '打出去落地就炸，炸一片', cost: { parts: 26, steel: 14 }, wpn: 6 },
  { id: 'bolts', name: '弩箭 ×12', desc: '', cost: { wood: 4, parts: 1 }, ammo: [4, 12] },
  { id: 'fuel', name: '燃料 ×120', desc: '', cost: { parts: 3, steel: 1 }, ammo: [5, 120] },
  { id: 'shells40', name: '榴弹 ×4', desc: '', cost: { parts: 5, steel: 2 }, ammo: [6, 4] },
  { id: 'nade', name: '手雷 ×2', desc: '最多带 6 颗', cost: { parts: 4 }, nade: 2 },
  { id: 'med', name: '医疗包', desc: '回复 60 生命，最多 3 个', cost: { parts: 3, wood: 2 }, med: 1 },
  { id: 'upg', name: '强化弹头', desc: '全队伤害 +12%（最多 5 级）', cost: { parts: 8 }, upg: 1 },
];

/* ---------- balance ---------- */
const BAL = {
  nights: 15,
  dayLen: [300, 240],            // first day, later days (seconds)
  pMaxHp: 100, pSpeed: 4.4, pReach: 6.5,
  stairHold: 0.18, ledgeHold: 0.45,  // seconds of pushing before you walk down stairs / jump off a ledge
  downTime: 30, reviveTime: 2.4, soloDownTime: 8, respawnHp: 0.5,
  searchTime: 1.5, healTime: 1.0, medHeal: 60,
  knifeDmg: 55, knifeKB: 2.5, knifeCD: 0.5, knifeRange: 2.3, knifeLunge: 1.3, knifeBack: 2, // melee (was a shove: 18 dmg, KB 6, CD 0.55, 1.3 cone)
  nadeDmg: 286, nadeR: 2.8, nadeFuse: 1.6,
  headshot: 1.6,
  radioHp: 1500, radioDmg: 0.5,
  startRes: { wood: 90, stone: 30, steel: 20, parts: 8 },
  refund: 0.5,
  nightSpawn: n => Math.round(22 + n * 9),
  bloodMul: 1.5,
  hpMul: n => 1 + 0.13 * (n - 1),
  spdMul: n => 1 + 0.02 * (n - 1),
  spawnDur: n => 50 + n * 4,      // the horde trickles in over this long
  nightMin: n => 150 + n * 6,     // a night lasts at least this long; small groups keep coming until then
  nightTrickleCD: 7, nightTrickleMax: 8,
  dayStragglers: 8, dayStragglerCD: 10,
  burnDps: 28, blastR: 2.3, blastDmgP: 32, blastDmgB: 160, screamR: 9, screamCD: 9, rageMul: 1.45,
  lootFar: 30, wireDps: 14, wireSlow: 0.45, wireWear: 6,
  aggro: 11,                     // (legacy) zombies now always hunt the nearest reachable player
  diff: { easy: { hp: 0.75, n: 0.75, dmg: 0.7 }, normal: { hp: 1, n: 1, dmg: 1 }, hard: { hp: 1.3, n: 1.3, dmg: 1.25 } },
};
const isBlood = n => n % 5 === 0;

/* ---------- settings / storage ---------- */
const SKEY = 'deadtide.';
function lsGet(k, d) { try { const v = localStorage.getItem(SKEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(SKEY + k, JSON.stringify(v)); } catch (e) { } }
const SET = Object.assign({ name: '', mute: false, diff: 'normal', zoom: 1, shadows: 1, bconf: 1, assist: 1 }, lsGet('set', {}));
const saveSet = () => lsSet('set', SET);

let W = null, ME = 0, NETROLE = null;
const STATE = { mode: 'title', paused: false };
const HUB = /\/deadtide\/(index\.html)?$/.test(location.pathname);
