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
const MUD_SLOW = 0.78;               // walking speed in mud (players and zombies)
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
defB(22, { key: 'tree', nat: 1, res: 'wood', hp: 1, trunk: 0.2 }); // not a whole-cell block: only the round trunk pushes you aside (moveEnt), so woods are walkable
defB(23, { key: 'water', P: 1, Z: 1, nat: 1 });
defB(24, { key: 'ruin', P: 1, Z: 1, B: 1, top: 1, nat: 1, brk: 1, hp: 260, col: '#7c4a3a' });
defB(25, { key: 'car', P: 1, Z: 1, B: 1, nat: 1, spot: 'car' });
defB(26, { key: 'crate', P: 1, Z: 1, B: 1, nat: 1, spot: 'crate', low: 0.55 });
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
defB(36, { key: 'milcrate', P: 1, Z: 1, B: 1, nat: 1, spot: 'milcrate', low: 0.45 });
defB(37, { key: 'barrel', P: 1, Z: 1, B: 1, nat: 1, spot: 'barrel', low: 0.74 });
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
// town furniture: desks / counters / sofas and low shop shelving. Waist-high: you shoot over them, vault them; zombies smash through
defB(48, { key: 'desk', P: 1, Z: 1, B: 1, nat: 1, brk: 1, vault: 1, hp: 150, low: 0.5, col: '#6a4a30' });
defB(49, { key: 'shelf', P: 1, Z: 1, B: 1, nat: 1, brk: 1, vault: 1, hp: 180, low: 0.62, col: '#8a9096' });
defB(50, { key: 'halfwall', P: 1, Z: 1, B: 1, nat: 1, brk: 1, vault: 1, hp: 220, low: 0.62, col: '#c8b890' }); // waist-high plaster partition (ward fronts, office cubicles, counters)
// 尸城求生 (round 19): builds you unlock with blueprints
defB(51, { key: 'mine', name: '地雷', cost: { steel: 2, parts: 3 }, hp: 60, dep: 1, mine: 1, col: '#4a4a3a', tip: '丧尸踩上去就炸（半径 2.4），用一次就没；人踩不响' });
defB(52, { key: 'turret', name: '机枪塔', cost: { steel: 8, parts: 10 }, hp: 450, P: 1, Z: 1, dep: 1, brk: 1, turret: 1, col: '#5a6670', tip: '自动打 9 格内看得见的丧尸，一次装 240 发；打空了走过去按 F 花 3 零件装满' });
defB(53, { key: 'barricade', name: '木板路障', cost: { wood: 3 }, hp: 300, P: 1, Z: 1, B: 1, dep: 1, brk: 1, low: 0.6, vault: 1, col: '#8a6a44', tip: '快速封门洞、窗洞：丧尸要砸，子弹能从上面打过去，人能翻过去' });
defB(54, { key: 'ammobox', nat: 1, spot: 'ammobox' });
defB(55, { key: 'bpcase', P: 1, Z: 1, B: 1, nat: 1, spot: 'bpcase', low: 0.7 });
// (round 22) one-shot jump pad: step on it and it flings you ~5 tiles the way you're going, up onto a roof if there is one; placeable anywhere
defB(56, { key: 'pad', name: '跳板', cost: { wood: 3, parts: 2 }, hp: 40, dep: 1, pad: 1, any: 1, col: '#d8a03a', tip: '踩上去把你弹出去约 9 格（朝你走的方向，前面有矮楼顶就弹上去），用一次就没；哪里都能放' });
defB(42, { key: 'rail', P: 1, Z: 1, nat: 1, brk: 1, vault: 1, hp: 120, col: '#6a6f74' }); // balcony / roof / mezzanine railing: low, vaultable, bullets pass
// (round 22) the placeables as items: one slot per kind; tap the slot again to switch material / variant. None of them care which way you face
// (round 25) six slots: walls, floors and the door share one; the searchlight is gone from the bar (old ones still stand)
const ITEMS = [
  { k: 'build', name: '墙·地板·门', ids: [1, 2, 3, 4, 5, 7] },
  { k: 'ladder', name: '梯子', ids: [6] },
  { k: 'cover', name: '掩体', ids: [53, 12, 14, 8] },
  { k: 'trap', name: '陷阱', ids: [15, 9, 13, 51] },
  { k: 'turret', name: '机枪塔', ids: [52] },
  { k: 'pad', name: '跳板', ids: [56] },
];
const PAL = ITEMS.flatMap(g => g.ids);
// (round 23) the gear-type items (cover, traps, turret, lamp, jump pad) go down anywhere in every mode; walls / floors / ladders / doors stay in the build zone outside 尸城求生
for (const g of ITEMS) if (!['build', 'ladder'].includes(g.k)) for (const id of g.ids) B[id].any = 1;
const itemOf = id => ITEMS.find(g => g.ids.includes(id)) || ITEMS[0];
// vehicles (round 22: their own category; you pick a default and T gets on it). spd = walking speed multiplier, seats 2 = a pillion seat
const VEH = [null,
  { k: 'bike', name: '自行车', spd: 1.6, tag: '便宜轻快：走得快 60%' },
  { k: 'moto', name: '摩托车', spd: 1.9, seats: 2, tag: '最快：走得快 90%，后座能带一个队友' },
  { k: 'cargo', name: '货运三轮', spd: 1.45, search: 1, tag: '搜刮用：坐在车上就能搜（够得更远、时间减半），搜到的材料 +50%' },
  { k: 'armor', name: '装甲车', spd: 1.3, seats: 2, armor: 0.35, ram: 1, tag: '保护用：受到的伤害只剩 35%，撞开挡路的丧尸，后座能带一个队友' },
];
const NVEH = VEH.length - 1;
// (round 24) grenade types: 0 frag (p.nades), 1–3 in p.gn[t - 1]
const GREN = [
  { k: 'frag', name: '破片手雷', sn: '破片', tag: '炸一片：伤害高' },
  { k: 'slow', name: '减速雷', sn: '减速', tag: '一片黏液 8 秒：里面的丧尸只剩 30% 速度' },
  { k: 'smoke', name: '烟雾弹', sn: '烟雾', tag: '一团烟 10 秒：里面的丧尸找不到你、乱走、不咬人' },
  { k: 'blast', name: '爆破弹', sn: '爆破', tag: '伤害低，把一大片丧尸炸飞、晕住，清出一条路' },
];
const gCount = (p, t) => t ? ((p.gn || [])[t - 1] || 0) : p.nades;
const gCap = t => t ? BAL.gnCap : BAL.nadeCap;
// blueprints (尸城求生): what you can build / make from the start, and what has to be found first
const BP_BASE = [1, 4, 6, 7, 12, 53, 56];
const BP_LIST = [2, 3, 5, 8, 13, 14, 9, 15, 51, 52, 'bike', 'moto', 'cargo', 'armor'];
const bpName = k => typeof k === 'number' ? B[k].name : (VEH.find(v => v && v.k === k) || { name: k }).name;
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
  { k: 'pistol', sn: '手枪', name: '手枪', dmg: 26, rate: 0.3, mag: 12, reload: 1.0, spread: 0.03, range: 15, pellets: 1, inf: 1, kick: 0.6, shake: 0.12, hs: 2.0, loot: 0, tag: '子弹无限的备用枪：准，爆头 ×2，伤害最低' },
  { k: 'shotgun', sn: '霰弹', name: '霰弹枪', dmg: 17, rate: 0.72, mag: 6, reload: 1.7, spread: 0.17, range: 8, pellets: 8, pierce: 2, kick: 2.6, shake: 0.35, start: 24, stun: 0.3, falloff: 1, loot: 8, tag: '近身清群：8 颗弹丸各穿 2 只、打得丧尸一顿，远了就散' },
  { k: 'rifle', sn: '步枪', name: '步枪', dmg: 34, rate: 0.12, mag: 30, reload: 1.6, spread: 0.035, range: 20, pellets: 1, kick: 0.4, shake: 0.12, bloom: 0.22, loot: 30, tag: '持续火力：单发比手枪狠、射速快 2.5 倍，连射越打越散' },
  { k: 'sniper', sn: '狙击', name: '狙击枪', dmg: 220, rate: 1.05, mag: 5, reload: 2.1, spread: 0.004, range: 45, pellets: 1, pierce: 5, kick: 4, shake: 0.4, stun: 0.5, laser: 1, hs: 2.5, loot: 4, tag: '打精英：一枪 220（爆头 ×2.5）穿 5 只，最远，但慢' },
  { k: 'crossbow', sn: '弩', name: '弩', dmg: 110, rate: 0.75, mag: 6, reload: 1.5, spread: 0.008, range: 26, pellets: 1, pierce: 3, kick: 0.6, shake: 0.06, pin: 1.1, hs: 2.0, loot: 6, tag: '几乎没声音：一箭 110 穿 3 只、把丧尸钉住，偷偷清楼用' },
  { k: 'flamer', sn: '喷火', name: '喷火器', dmg: 12, rate: 0.07, mag: 80, reload: 2.2, spread: 0.5, range: 5.6, pellets: 1, flame: 1, burn: 3.5, kick: 0, shake: 0.02, loot: 40, tag: '堵门神器：近距离扇形喷火，着火会传给旁边的' },
  { k: 'launcher', sn: '榴弹', name: '榴弹发射器', blastR: 3.0, dmg: 220, rate: 0.9, mag: 4, reload: 2.6, spread: 0.015, range: 22, pellets: 1, gl: 1, kick: 0, shake: 0.3, loot: 2, tag: '炸一片：落地就炸，半径 3，扎堆时用' },
];
const NW = WPN.length;

/* ---------- zombies (speeds in tiles/s) ---------- */
const ZT = {
  walker: { name: '游荡者', hp: 70, spd: 1.0, r: 0.31, h: 1.2, dmg: 12, bdmg: 12, cd: 1.0, sc: 1.2 },
  runner: { name: '疾跑者', hp: 55, spd: 3.1, r: 0.29, h: 1.14, dmg: 8, bdmg: 7, cd: 0.6, sc: 1.14 },
  climber: { name: '攀爬者', hp: 70, spd: 2.3, r: 0.29, h: 0.84, dmg: 7, bdmg: 8, cd: 0.7, sc: 1.08, climb: 1 },
  spitter: { name: '喷吐者', hp: 170, spd: 0.9, r: 0.36, h: 1.26, dmg: 10, bdmg: 8, cd: 1.0, sc: 1.26, range: 9, spitCD: 3 },
  brute: { name: '重锤', hp: 800, spd: 1.0, r: 0.44, h: 1.74, dmg: 28, bdmg: 75, cd: 1.6, sc: 1.74, kb: 6, charge: 1 }, // (round 23) faster, plus a telegraphed charge and a ground slam
  boss: { name: '巨尸', hp: 2600, spd: 0.65, r: 0.69, h: 2.64, dmg: 45, bdmg: 220, cd: 2.0, sc: 2.64, kb: 9 },
  dog: { name: '尸犬', hp: 40, spd: 3.7, r: 0.27, h: 0.66, dmg: 8, bdmg: 3, cd: 0.5, sc: 1.2 },
  crawler: { name: '爬行尸', hp: 60, spd: 0.75, r: 0.3, h: 0.46, dmg: 11, bdmg: 9, cd: 0.9, sc: 1.2 },
  bloater: { name: '爆尸', hp: 200, spd: 0.75, r: 0.4, h: 1.32, dmg: 10, bdmg: 10, cd: 1.1, sc: 1.32, blast: 1 },
  screamer: { name: '尖叫者', hp: 150, spd: 1.5, r: 0.3, h: 1.26, dmg: 9, bdmg: 6, cd: 0.9, sc: 1.26, scream: 1 },
  leaper: { name: '飞扑尸王', hp: 2300, spd: 1.15, r: 0.5, h: 2.1, dmg: 30, bdmg: 60, cd: 1.2, sc: 2.0, kb: 7, boss: 1, look: 'boss', skin: '#7a4a3a' },
  digger: { name: '掘地尸王', hp: 2700, spd: 0.95, r: 0.55, h: 2.0, dmg: 34, bdmg: 90, cd: 1.4, sc: 2.0, kb: 8, boss: 1, look: 'brute', skin: '#6a6048' },
  summoner: { name: '召唤尸王', hp: 2100, spd: 0.72, r: 0.5, h: 2.3, dmg: 22, bdmg: 40, cd: 1.4, sc: 2.2, boss: 1, look: 'boss', skin: '#5a5470' },
  venom: { name: '毒液尸王', hp: 2300, spd: 0.85, r: 0.52, h: 2.1, dmg: 26, bdmg: 50, cd: 1.3, sc: 2.1, range: 12, boss: 1, look: 'bloater', skin: '#7a9a3a' },
  armored: { name: '防暴尸', hp: 260, spd: 0.9, r: 0.36, h: 1.26, dmg: 15, bdmg: 16, cd: 1.1, sc: 1.3, armor: 0.3 },
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
  ammobox: { name: '弹药盒', loot: {}, ammo: 1.4, allAmmo: 1, vanish: 1, n: 40 },              // bullets lying about: for every gun, owned or not yet
  bpcase: { name: '图纸箱', loot: { parts: [3, 6] }, ammo: 1, bp: 1, vanish: 1 },               // in a building zombies hold: always a blueprint
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
  { id: 'rifle', cat: 'gun', name: '步枪', desc: '持续火力：单发 34、全自动 30 发，连射越打越散', cost: { parts: 12, steel: 6 }, wpn: 2 },
  { id: 'sniper', cat: 'gun', name: '狙击枪', desc: '打精英：一枪 220（爆头 ×2.5）穿 5 只，最远，但慢', cost: { parts: 18, steel: 8 }, wpn: 3 },
  { id: 'shells', cat: 'gun', name: '霰弹 ×12', desc: '', cost: { parts: 2 }, ammo: [1, 12] },
  { id: 'rounds', cat: 'gun', name: '步枪弹 ×60', desc: '', cost: { parts: 3 }, ammo: [2, 60] },
  { id: 'slugs', cat: 'gun', name: '狙击弹 ×10', desc: '', cost: { parts: 3 }, ammo: [3, 10] },
  { id: 'crossbow', cat: 'gun', name: '弩', desc: '几乎没声音：一箭 110 穿 3 只，钉住 1 秒，偷偷清楼用', cost: { parts: 12, wood: 12 }, wpn: 4 },
  { id: 'flamer', cat: 'gun', name: '喷火器', desc: '近距离喷火，点着的丧尸会烧，火还会传给旁边的', cost: { parts: 20, steel: 10 }, wpn: 5 },
  { id: 'launcher', cat: 'gun', name: '榴弹发射器', desc: '打出去落地就炸，炸一片', cost: { parts: 26, steel: 14 }, wpn: 6 },
  { id: 'bolts', cat: 'gun', name: '弩箭 ×12', desc: '', cost: { wood: 4, parts: 1 }, ammo: [4, 12] },
  { id: 'fuel', cat: 'gun', name: '燃料 ×120', desc: '', cost: { parts: 3, steel: 1 }, ammo: [5, 120] },
  { id: 'shells40', cat: 'gun', name: '榴弹 ×4', desc: '', cost: { parts: 5, steel: 2 }, ammo: [6, 4] },
  { id: 'nade', cat: 'item', name: '破片手雷 ×2', desc: '炸一片，伤害高；最多带 15 颗', cost: { parts: 4 }, nade: 2, gt: 0 },
  { id: 'gslow', cat: 'item', name: '减速雷 ×2', desc: '落地一片黏液 8 秒，丧尸只剩 30% 速度；最多 8 颗', cost: { parts: 3, steel: 1 }, nade: 2, gt: 1 },
  { id: 'gsmoke', cat: 'item', name: '烟雾弹 ×2', desc: '一团烟 10 秒，里面的丧尸找不到你、不咬人；最多 8 颗', cost: { wood: 2, parts: 2 }, nade: 2, gt: 2 },
  { id: 'gblast', cat: 'item', name: '爆破弹 ×2', desc: '把一大片丧尸炸飞 3–5 格、晕 1.6 秒，清出一条路；最多 8 颗', cost: { parts: 4, steel: 2 }, nade: 2, gt: 3 },
  { id: 'med', cat: 'item', name: '医疗包', desc: '回复 60 生命，最多带 8 个；H 用，也能救回阵亡的队友', cost: { parts: 3, wood: 2 }, med: 1 },
  { id: 'shield', cat: 'melee', name: '防暴盾', desc: '近战武器（和刀二选一）：猛推前方一片丧尸，撞开 3 格、晕 1 秒；拿着它时正面挨打少受一半', cost: { steel: 6, parts: 4 }, shield: 1 },
  { id: 'bike', cat: 'veh', name: '自行车', desc: VEH[1].tag, cost: { wood: 6, steel: 6, parts: 4 }, veh: 1, bp: 'bike' },
  { id: 'moto', cat: 'veh', name: '摩托车', desc: VEH[2].tag, cost: { steel: 14, parts: 12 }, veh: 2, bp: 'moto' },
  { id: 'cargo', cat: 'veh', name: '货运三轮', desc: VEH[3].tag, cost: { wood: 8, steel: 10, parts: 8 }, veh: 3, bp: 'cargo' },
  { id: 'armor', cat: 'veh', name: '装甲车', desc: VEH[4].tag, cost: { steel: 24, parts: 16 }, veh: 4, bp: 'armor' },
  { id: 'upg', cat: 'upg', name: '强化弹头', desc: '全队伤害 +12%（最多 5 级）', cost: { parts: 8 }, upg: 1 },
];

/* ---------- balance ---------- */
const BAL = {
  nights: 15,
  dayLen: [300, 240],            // first day, later days (seconds)
  pMaxHp: 100, pSpeed: 4.4, pReach: 7.5, /* (round 25) 6.5 → 7.5 */
  stairHold: 0.18, ledgeHold: 0.45,  // seconds of pushing before you walk down stairs / jump off a ledge
  downTime: 30, reviveTime: 2.4, soloDownTime: 8, respawnHp: 0.5,
  respawnDay: 20, respawnNight: 20, respawnInv: 2.5, lives: { easy: 5, normal: 3, hard: 1 }, livesLong: 2, /* respawns each: by difficulty, +2 in the long modes (经典 15 夜 / 尸城求生 10 夜) */ /* (round 24) 20 s day or night (was 60 at night), back at the base, 2.5 s untouchable */ rezTime: 6, rezHp: 0.4, // (round 20) a dead teammate comes back by a living one after this long (or at dawn); a medkit at the body brings them back at once
  searchTime: 1.5, healTime: 1.0, medHeal: 60,
  shieldBlock: 0.5, shieldCos: 0.26,                          // (round 23) riot shield is a melee weapon now: with it out, hits from within ~75° of your aim lose half; no wear
  chgWind: 0.85, chgSpd: 7.5, chgTime: 1.2, chgDmg: 34, chgKB: 10, chgWall: 400, chgStun: 1.4, chgCD: 6, chgMin: 3.2, chgMax: 10, // brute charge: red line on the ground, then a rush
  slamR: 2.6, slamWind: 0.55, slamDmg: 22, slamKB: 7, slamCD: 4,  // brute ground slam: red ring, then everything inside gets hit and thrown
  bashR: 2.4, bashCos: 0.34, bashKB: 20, bashStun: 1.0, bashDmg: 20, bashCD: 0.85, bashMax: 8, // shield bash: everything in front (up to 8) shoved ~3 tiles back and stunned
  padDist: 9, padUp: 2,  /* (round 25) 5 → 9 tiles */                                        // jump pad: how far / how many floors up it can throw you
  ramDmg: 30, ramCD: 0.7, ramSpd: 2.2,                         // armoured car: hitting a zombie at speed
  cargoSearch: 0.5, cargoLoot: 1.5, cargoReach: 2.3,           // cargo trike: search time x, loot x, reach from the seat
  knifeDmg: 55, knifeKB: 2.5, knifeCD: 0.5, knifeRange: 2.3, knifeLunge: 1.3, knifeBack: 2, // melee (was a shove: 18 dmg, KB 6, CD 0.55, 1.3 cone)
  nadeCap: 15, medCap: 8, gnCap: 8,                            // (round 24) carry: frag grenades / medkits / each special grenade (was 10 / 5 in 23d)
  slowR: 3.6, slowT: 8, slowMul: 0.3,                           // slow grenade: a sticky field, zombies inside crawl at 30%
  smokeR: 3.8, smokeT: 10, smokeConf: 1.2,                      // smoke: zombies in the cloud lose you, wander and don't bite (and for 1.2 s after leaving)
  blastR: 4.4, blastDmg: 70, blastKB: 24, blastStun: 1.6,       // blast: little damage, throws everything out of the way (clears a path)
  nadeRange: 12, nadeDmg: 286, nadeR: 3.4, nadeFuse: 1.6, nadeLand: 0.35, nadeMin: 0.5, // (round 18: radius 2.8 -> 3.4, damage at the edge 35% -> 50%, goes off 0.35 s after landing where you aimed)
  headshot: 1.6,
  radioHp: 1500, radioDmg: 0.5,
  startRes: { wood: 90, stone: 30, steel: 20, parts: 8 },
  refund: 0.5,
  nightSpawn: n => Math.round(30 + n * 12),     // (round 18: was 22 + 9n)
  bloodMul: 1.5,
  hpMul: n => 1 + 0.15 * (n - 1),               // (was 0.13 per night)
  spdMul: n => 1 + 0.03 * (n - 1),              // (was 0.02 per night)
  spawnDur: n => 35 + n * 4,      // the horde trickles in over this long (was 50 + 4n)
  zCap: () => TOUCHY ? 95 : 140,  // most zombies alive at once; the rest of the horde waits its turn
  nightMin: n => 150 + n * 6,     // a night lasts at least this long; small groups keep coming until then
  nightTrickleCD: 7, nightTrickleMax: 8,
  dayStragglers: 8, dayStragglerCD: 10,
  burnSpread: 2.5, burnSpreadR: 1.15, // burning zombies set fire to others this close, about 2.5 times a second (was: same cell only, 1.2 / s)
  barrelR: 3.2, barrelDmg: 240, barrelBurn: 3, // red oil barrels go up when shot
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
