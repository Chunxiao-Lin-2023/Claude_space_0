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
const MW = 240, MH = 240, ML = 10;     // grid columns, rows, layers (round 33: 160 → 240; the old 160×160 map sits in the middle)
const MOFF = 40, MW0 = 160;              // (round 33) where the classic 160×160 layout starts, its size
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
defB(15, { key: 'trap', name: '捕兽夹', cost: { steel: 1, parts: 2 }, hp: 60, dep: 1, trap: 1, col: '#5a5a55', tip: '周围一圈（空地上 3×3）都有夹子：踩进去被夹住 1.8 秒、松开后瘸 3 秒走得慢；能夹 3 次' });
defB(9, { key: 'wire', name: '铁丝网', cost: { steel: 2, parts: 1 }, hp: 200, dep: 1, wire: 1, brk: 0, col: '#9aa0a6', tip: '铺开一片（空地上 3×3）：经过的丧尸走得慢一半、慢慢割伤，会磨损' });
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
defB(51, { key: 'mine', name: '地雷', cost: { steel: 2, parts: 3 }, hp: 60, dep: 1, mine: 1, col: '#4a4a3a', tip: '丧尸走进周围一圈（空地上 3×3）就炸：半径 3.2，炸完留下一片黏地让丧尸慢 4 秒；用一次就没，人踩不响' });
defB(52, { key: 'turret', name: '机枪塔', cost: { steel: 8, parts: 10 }, hp: 450, P: 1, Z: 1, dep: 1, brk: 1, turret: 1, col: '#5a6670', tip: '自动扫射 9 格内看得见的丧尸，一次装 240 发；打空了走过去按 F 花 3 零件装满' });
// (round 28) more turrets: each fills a different job
defB(57, { key: 'tshot', name: '霰弹塔', cost: { wood: 4, steel: 8, parts: 8 }, hp: 450, P: 1, Z: 1, dep: 1, brk: 1, turret: 1, col: '#7a5a3a', tip: '守门口：5 格内一轰一片、把丧尸往后推，一次装 60 发' });
defB(58, { key: 'tfrost', name: '减速塔', cost: { steel: 6, parts: 10 }, hp: 380, P: 1, Z: 1, dep: 1, brk: 1, turret: 1, col: '#4a7a9a', tip: '往 6 格内丧尸最多的地方喷黏液，一团慢 2.5 秒，几乎没伤害；一次装 50 发' });
defB(59, { key: 'tsnipe', name: '狙击塔', cost: { steel: 12, parts: 14 }, hp: 380, P: 1, Z: 1, dep: 1, brk: 1, turret: 1, col: '#5a6a4a', tip: '16 格内专挑血最厚的打（重锤、尸王、防暴尸），一枪 110，一次装 30 发' });
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
  { k: 'cover', name: '掩体', ids: [53, 8] },        /* (round 39) trimmed to 2-3 kinds each: 沙袋矮墙 12 / 铁皮掩体 14 / 捕兽夹 15 / 拒马 13 / 减速塔 58 retired (old ones still stand and work) */
  { k: 'trap', name: '陷阱', ids: [9, 51] },
  { k: 'turret', name: '炮塔', ids: [52, 57, 59] },  // (round 28) machine gun / shotgun / sniper
  { k: 'pad', name: '跳板', ids: [56] },
];
// (round 28) turrets (every mode): range, seconds between shots, damage, magazine, refill cost
const TUR = {
  52: { k: 'mg', range: 9, rate: 0.32, dmg: 11, ammo: 240, refill: { parts: 3 } },                         // damage 18 → 11
  57: { k: 'shot', range: 5, rate: 1.2, dmg: 6, pellets: 6, cone: 0.42, kb: 3.5, ammo: 60, refill: { parts: 3 } },
  58: { k: 'frost', range: 6, rate: 1.6, dmg: 4, ammo: 50, refill: { parts: 3 } },
  59: { k: 'snipe', range: 16, rate: 2.4, dmg: 110, ammo: 30, refill: { parts: 4 } },
};
const TRAP_R = 1;                                       // (round 28) traps act on the open floor around them, up to 3×3
const PAL = ITEMS.flatMap(g => g.ids);
// (round 23) the gear-type items (cover, traps, turret, lamp, jump pad) go down anywhere in every mode; walls / floors / ladders / doors stay in the build zone outside 尸城求生
const RETIRED = [12, 13, 14, 15, 58]; /* (round 39) no longer buildable */
for (const g of ITEMS) if (!['build', 'ladder'].includes(g.k)) for (const id of g.ids) B[id].any = 1; for (const id of RETIRED) B[id].any = 1;
const itemOf = id => ITEMS.find(g => g.ids.includes(id)) || ITEMS[0];
// vehicles (round 22: their own category; you pick a default and T gets on it). spd = walking speed multiplier, seats 2 = a pillion seat
const VEH = [null,
  { k: 'bike', name: '自行车', vis: 18,  spd: 1.7, quiet: 1, mud: 1, dodge: 0.4, rideDmg: 1.15, /* (round 36n) 骑射 + 闪避 */ tag: '便宜、安静、灵活：走得快 70%，泥地不减速，没有发动机（攻楼时不吵醒楼里的丧尸）。骑射：骑着开枪射速不降、伤害 +15%（别的车上射速减半还多）。闪避：骑起来时 40% 的攻击躲开' },
  { k: 'moto', name: '摩托车', vis: 18,  spd: 1.9, seats: 2, noise: 6, tag: '最快：走得快 90%，后座能带一个队友；发动机响，攻楼时会吵醒附近楼里的丧尸' },
  { k: 'cargo', name: '货运三轮', vis: 17,  spd: 1.45, search: 1, noise: 5, tag: '搜刮用：坐在车上就能搜（够得更远、时间减半），搜到的材料 +50%' },
  { k: 'armor', name: '装甲车', vis: 13,  spd: 1.3, seats: 2, armor: 0.3, ram: 1, heal: 4, port: 1, noise: 8, /* (round 36n) armour 0.35 → 0.3, heals, protects the back seat too, rams hard */ tag: '保护用：车里的人（含后座）受到的伤害只剩 30%；3 秒没挨打就每秒回 4 血（移动医疗站）；撞击 70 伤害并撞倒丧尸；后座能带一个队友，从射击孔开枪射速不降' },
  { k: 'gyro', name: '旋翼机', vis: 26,  spd: 1.9, fly: 1, fuel: 60, seats: 2, gun: 'chin', noise: 9, tag: '会飞：越过屋顶和尸群。只能从地面或楼顶起飞（头顶不能有屋顶）；一箱油飞 60 秒，没满就能加：商店「载具」栏一键加满，或在有屋顶的房间里按 F；飞着用机头下的机枪打（机上自己的子弹，商店里买），手里的枪不能用；后座能带一个队友，队友能开枪' }, // (round 29)
  { k: 'tank', name: '坦克', vis: 16,  spd: 1.0, armor: 0.2, ram: 1, gun: 'cannon', outdoor: 1, noise: 10, tag: '自带炮塔：开火打炮弹（落点爆炸 120，半径 2.3），炮弹商店里买；受到的伤害只剩 20%，撞开丧尸；慢，太大进不了楼' }, // (round 31)
];
const NVEH = VEH.length - 1;
const MECH_ON = true;
const KAIJU_ON = MECH_ON; // (round 34) kaiju come with the mechs

// (round 34b) every vehicle has a second stage: press 变形 while driving and in 1 s it stands up as a mech (no blueprint).
// hp = hull, armor = share of damage the hull takes, dmg / rate / reach / arc / kb = the punch, spd = walking speed, skill + cooldown, noise (攻楼)
const MECHS = [null,
  { k: 'gale', name: '疾风', hp: 1000, armor: 1.0, /* (round 36n) 800 / 1.15 → 1000 / 1.0 */ dmg: 15, rate: 0.09, range: 16, /* (round 36n) a machine gun: endless fire, no reload (was low kicks 42) */ reach: 3.2, arc: 1.4, kb: 3, spd: 1.65, skill: 'drones', sn: '浮游炮', cd: 22, /* (round 36n) was 滑铲 (slide 90, cd 6) */ noise: 0, style: 'scout', atk: 'mgun', col: ['#3fb8b0', '#5a6068', '#f2c230'], glow: '#7fe8ff' /* (round 36i) the teal toy robot (was yellow #e8c02a) */, tag: '最快最安静，拿机枪：一直按着一直打，不用换弹（每发 15，跟着弹头升级变强，能打飞的）；装甲 1000。技能「浮游炮」：放出 10 台悬浮机枪绕着你飞，10 秒里自己找丧尸扫射，冷却 22 秒' },
  { k: 'edge', name: '赤刃', hp: 1200, armor: 1.0, dmg: 65, rate: 0.42, reach: 3.6, arc: 1.5, /* (round 35) 2.7 → 3.6, 1.05 → 1.5 */ kb: 4, spd: 1.45, skill: 'dash', sn: '冲斩', cd: 10, noise: 6, style: 'slim', atk: 'chop', col: ['#a8262a', '#2a1d20', '#e8e2d6'], glow: '#ffa040', tag: '臂刃往下劈，快、够得远；装甲 1200。技能「冲斩」：朝目标冲 8 格，路上的丧尸受 180，冷却 10 秒' },
  { k: 'worker', name: '工蜂', hp: 1600, armor: 0.9, dmg: 36, rate: 0.5, /* (round 36n) one parcel 45 / 0.55 s → three parcels of 36 / 0.5 s */ reach: 2.4, arc: 1.2, kb: 4, spd: 1.0, skill: 'parcels', sn: '快递雨', cd: 12, /* (round 36n) 5 × 90, cd 9 → a torrent of 36 × 55 over 2 s, cd 12 */ noise: 5, style: 'worker', atk: 'parcel', range: 12, blast: 1.4, /* (round 35) 1.1 → 1.6; (round 36n) → 1.4 (three at a time) */ col: ['#f1d9a0', '#5b4a3a', '#8fd6c4'], glow: '#9ff0e0' /* (round 36i) cream + mint chibi (36h teal toy robot moved to 疾风; originally orange #e07a1f) */, tag: '被动：走过踩平的树、石头、废铁、原木、灌木直接收进资源（普通采集的 60%）。快递机甲：普攻一次扔出 3 个快递箱砸丧尸（每个 36、半径 1.4、射程 12）；技能「快递雨」：2 秒里朝目标一带倾泻 36 个大快递箱（每个 55、半径 1.5、砸晕），冷却 12 秒；机甲形态照样能搜刮（够得远、材料 +50%）；慢，装甲 1600（×0.9）' },
  { k: 'bastion', name: '铁卫', hp: 2400, armor: 0.7, dmg: 95, rate: 0.75, reach: 3.4, arc: 1.6, /* (round 35) 2.5 → 3.4, 1.25 → 1.6 */ kb: 7, spd: 0.95, skill: 'slam', sn: '掀地', cd: 10, /* (round 36n) 震地 4.5 / 220 / cd 12 → 掀地 7 / 260 / cd 10, throws them up */ noise: 8, style: 'big', atk: 'heavy', col: ['#55606c', '#2c333b', '#e2b93b'], glow: '#5fe0ff', tag: '最耐打（2400，挨打 ×0.7），普攻是捶地：左拳、右拳、双拳，每下砸一圈（半径 2.5，第三下 3.1 更痛），走路撞开丧尸；慢。技能「掀地」：把周围 7 格的地掀起来，丧尸全被掀飞到空中（260 伤害，越近越痛，落地晕 2 秒），冷却 10 秒' },
  { k: 'falcon', name: '苍隼', hp: 1000, armor: 1.1, dmg: 55, rate: 0.5, reach: 2.4, arc: 1.15, kb: 5, spd: 1.3, skill: 'fly', sn: '飞行', cd: 1, noise: 9, style: 'fly', atk: 'rocket', range: 16, blast: 2.0, /* (round 35) 1.6 → 2.0 */ col: ['#dfe6ee', '#3a5a7a', '#59b8ff'], glow: '#9fe8ff', tag: '会飞：技能键起飞 / 降落，像旋翼机一样越过屋顶一直飞（飞着耗电 ×2，丧尸够不着，喷吐者能打到）；普攻是肩上的火箭弹（55、半径 2.0、射程 16）；飞在天上时一次齐射 3 发、每发 72；装甲薄（1000，挨打 ×1.1）' },
  { k: 'howitzer', name: '重炮', hp: 2000, armor: 0.8, dmg: 60, rate: 0.6, reach: 2.4, arc: 1.1, kb: 6, spd: 0.8, skill: 'volley', sn: '齐射', cd: 7, noise: 10, style: 'cannon', atk: 'cannon', range: 18, blast: 1.9, /* (round 35) 1.4 → 1.9 */ dmg2: 60, col: ['#5a6b3a', '#2e3622', '#c8b88a'], glow: '#ff9a3a', tag: '普攻是手臂炮（60、半径 1.9、射程 18，不耗弹药），耐打（2000，挨打 ×0.8）；最慢。技能「齐射」：朝目标打 3 发炮弹（每发 110、半径 2.2，用坦克的炮弹），冷却 7 秒' },
];
const MECH_CRUSH = new Set([21, 22, 27, 29, 32, 39, 40, 41]); // (round 34d) what a mech just walks over and flattens: rocks, trees, fences, rubble, bins, scrap, logs, bushes
const inMech = p => !!(p && p.ride && p.mform === 1 && MECHS[p.veh]);
const mechMul = () => 1 + BAL.mechUpg * Math.max(0, (W.upg || 0) - BAL.upgStart); /* (round 36n) */
/* (round 37) 第二形态: a full 进化 meter turns a mech into its beast for a while (same hull, own attack / skill / speed / armour) */
const EVO = [null,
  { k: 'snake', evo: 1, name: '青蛇', from: '疾风', hp: 1000, armor: 0.6, /* (round 38f) 0.75 → 0.6 */ spd: 1.95, dmg: 75, rate: 0.95, /* (round 38c) 0.42 → 0.95: slower, much heavier tail blows */ reach: 3.8, atk: 'bite', skill: 'venom', sn: '毒雾', cd: 9, col: ['#2f9a6a', '#173d2c', '#e8d24a'], glow: '#9dff6a', noise: 0,
    tag: '贴地游走，最快；有人打它 35% 闪开。普攻只用尾巴：前两下甩尾横扫一圈（半径 3.6，120，抽飞 + 晕 1 秒 + 中毒），第三下尾巴从头顶砸下（前方半径 2.7，165，晕 1.6 秒）。技能「毒雾」：吐出一团毒雾（半径 4.5，9 秒，每秒 30 + 减速一半），冷却 9 秒' },
  { k: 'dragon', evo: 1, name: '赤龙', from: '赤刃', hp: 1200, armor: 0.55, /* (round 38f) 0.7 → 0.55 */ spd: 1.75, dmg: 24, rate: 0.12, reach: 6.5, atk: 'breath', skill: 'dragdash', sn: '龙腾', cd: 8, col: ['#c8282a', '#5a1012', '#f2c040'], glow: '#ffb040', noise: 7,
    tag: '浮在半空的长龙。普攻「龙息」：按住朝前喷火（6.5 格扇形，每 0.12 秒 24，点着丧尸）。技能「龙腾」：卷着火朝前冲 12 格，路上的丧尸受 260 并着火，冲过的路烧 5 秒（每秒 30），冷却 8 秒' },
  { k: 'rabbit', evo: 1, name: '玉兔', from: '工蜂', hp: 1600, armor: 0.45, /* (round 38f) 0.8 → 0.45 */ spd: 1.6, dmg: 110, rate: 0.75, reach: 6.2, atk: 'ears', skill: 'moon', sn: '月落', cd: 10, col: ['#eef4f2', '#7fd8c4', '#ff9ab0'], glow: '#bff8ff', noise: 4,
    tag: '一蹦一跳的白玉兔，皮实耐打（挨打 ×0.45）。普攻「耳鞭」：两只耳朵像鞭子一样甩长，往正前方抽下去（前方 6.2 格、宽 3 格一条，110，抽退 + 晕），连到第三下原地转一圈，长耳朵扫一整圈（半径 5.8，×1.6，甩飞 + 晕 1 秒）。技能「月落」：高高跳起砸向 14 格内的落点（半径 6，320，砸晕 1.5 秒），之后月光照着坑 6 秒（里面的丧尸减速、每秒 22），冷却 10 秒；照样能踩平收资源' },
  { k: 'turtle', evo: 1, name: '玄龟', from: '铁卫', hp: 2400, armor: 0.3, /* (round 38f) 0.35 → 0.3 */ spd: 0.95, dmg: 150, rate: 0.85, reach: 3, atk: 'shell', skill: 'spin', sn: '旋甲', cd: 10, col: ['#3d5a48', '#1d2a22', '#c9a446'], glow: '#7fffd0', noise: 6,
    tag: '最硬（挨打 ×0.3），身边 5 格的队友挨打少 40%（玄甲）。普攻「甲撞」：缩进壳里往前冲 3.6 格，路上的丧尸都被撞开（150，撞晕），停下时再震一下。技能「旋甲」：缩进壳里高速旋转 6 秒，刀枪不入、跑得快，碰到的丧尸每 0.4 秒 70 并弹飞，冷却 10 秒' },
  { k: 'phoenix', evo: 1, name: '火凤', from: '苍隼', hp: 1000, armor: 0.65, /* (round 38f) 0.85 → 0.65 */ spd: 1.6, dmg: 34, rate: 0.45, range: 14, atk: 'feather', skill: 'rebirth', sn: '涅槃', cd: 16, col: ['#ff6a1e', '#9a1a10', '#ffd24a'], glow: '#ffcf60', noise: 8,
    tag: '一直在天上飞。普攻「火羽」：猛扇一下翅膀，从两边翅尖射出 5 根火羽扎向目标（每根 34，14 格，点着丧尸）。技能「涅槃」：一圈烈火（半径 6，240 并着火），自己装甲回 40%，8 格内的队友回 60 血；之后 7 秒身边燃着涅槃之火（4 格内每秒 30、队友每秒回 8 血），冷却 16 秒' },
  { k: 'bear', evo: 1, name: '铁熊', from: '重炮', hp: 2000, armor: 0.45, /* (round 38f) 0.55 → 0.45 */ spd: 1.3, dmg: 135, rate: 0.6, reach: 3.4, arc: 1.5, atk: 'claw', skill: 'roar', sn: '熊吼', cd: 11, col: ['#7a5232', '#3a2616', '#d8d0c0'], glow: '#ff8a3a', noise: 9,
    tag: '每杀一只回 1.5% 装甲。普攻「熊掌」：左右掌轮流举高拍下去（前方半径 1.9，135），第三下人立双掌砸地（半径 2.6，×1.5）。技能「熊吼」：一吼震住 9 格内的丧尸 3.5 秒（4 格内再受 120），之后 12 秒狂暴：伤害 +40%、出手更快，冷却 11 秒' },
];
/* (round 38i/j) blueprints outside 尸城求生: a new run starts with two vehicles of your choice; searching now and then turns up a blueprint (about one in 20, no counter shown): a vehicle (unlocked at once), a mech upgrade or a gun upgrade (installed in the shop with materials; each level visibly changes the model) */
const VKEY = k => VEH.findIndex(v => v && v.k === k);
const VSTART = ['bike', 'cargo'];
const bpOn = () => !!(W && W.vbp) && !(typeof isSiege === 'function' && isSiege());
const upgOn = () => !!W && (bpOn() || (typeof isSiege === 'function' && isSiege())); /* (round 39) mech / gun / armour blueprints drop in every mode (尸城求生 keeps its own vehicle blueprints) */
const vbpMask = () => W && W.vbp ? W.vbp.reduce((m, k) => m | 1 << VKEY(k), 0) : 126;
const mlvOf = v => ((W && W.mlv) || [])[v] || 0;
const UPG_MAX = 3, GUP = [{ n: '原厂', m: 1, r: 1, d: 1, f: 1 }, { n: '扩容弹匣', m: 1.4, r: 1, d: 1, f: 1 }, { n: '双持', m: 1.4, r: 1, d: 2, f: 0.6 }, { n: '终极形态', m: 1.7, r: 1, d: 2, f: 0.55 }]; /* (round 38j) gun upgrade levels: magazine × m, fire rate × r; (round 39c) d = guns in hand (Lv2 a second one in the off hand), f = damage per round; Lv3 also turns the gun into its final form (GEVO) */
const GEVO = ['悬浮无人机', '肩炮霰弹', '肩扛重机枪', '电磁轨道炮', '分裂弩箭', '长龙火鞭', '背部火箭巢']; /* (round 39c) each gun's Lv3 form */
const GEVO_D = ['两台无人机跟着你飞，你开枪它们一起打，你停手时自己找附近的丧尸打', '右肩多一门霰弹炮，每次一起轰一大片，把丧尸掀开', '右肩扛一挺固定重机枪，跟着你一起扫', '子弹变成电磁轨道弹，一条线上的丧尸全部打穿、无视防暴盾', '弩箭飞出 3.5 格后分裂成 5 支散开', '火焰变成 13 格长的火鞭，甩动瞄准就能横扫一片，扫过的地面烧一会儿', '背后火箭巢每次再打 2 枚火箭，直飞瞄准点'];
const gunUpName = (wi, lv) => lv >= 3 ? GEVO[wi] : GUP[lv].n;
const MUP = [{ n: '原厂', d: 1, t: 1 }, { n: '强化装甲', d: 1, t: 1.15 }, { n: '动力背包', d: 1.15, t: 1.15 }, { n: '王牌涂装', d: 1.25, t: 1.25 }]; /* mech upgrade levels: damage × d, toughness × t */
/* (round 38k) 等身战甲: six pieces each found as a blueprint and worn by whoever installs it; modest bonuses, and each piece shows on the model */
const ARM = [{ k: 'helm', n: '战甲头盔', d: '视野 +3 格、受到伤害 −5%' }, { k: 'chest', n: '战甲胸甲', d: '受到伤害 −20%' }, { k: 'pauld', n: '战甲肩甲', d: '被击退减半、受到伤害 −8%' }, { k: 'gaunt', n: '战甲护臂', d: '换弹快 25%、射速 +10%' }, { k: 'legs', n: '战甲腿甲', d: '步行快 12%' }, { k: 'pack', n: '动力背包', d: '生命上限 +40、4 秒没挨打就每秒回 3 血' }]; /* (round 38l) stronger: a full set can kite a horde or a 怪兽 */
const ARM_SET = '全套：受到伤害再 −10%、怪兽 / 能力者打你再 −15%，战甲纹路全亮';
const armHas = (p, k) => !!(((p && p.arm) || 0) >> k & 1), armFull = p => ((p && p.arm) || 0) === 63;
const armDmgMul = p => (armHas(p, 0) ? 0.95 : 1) * (armHas(p, 1) ? 0.8 : 1) * (armHas(p, 2) ? 0.92 : 1) * (armFull(p) ? 0.9 : 1);
const pMaxHpOf = p => BAL.pMaxHp + (armHas(p, 5) ? 40 : 0);
const armCost = () => ({ steel: 18, parts: 14 });
const wlvOf = wi => ((W && W.wlv) || [])[wi] || 0;
const magCap = wi => Math.max(1, Math.round(WPN[wi].mag * GUP[wlvOf(wi)].m)); /* (round 38j) per gun */
const rofMul = wi => 1 / GUP[wlvOf(wi)].r;
const gunCost = lv => ({ steel: 12 * (lv + 1), parts: 14 * (lv + 1) });
const mlvCost = lv => ({ steel: 20 * (lv + 1), parts: 15 * (lv + 1) });
const mupName = (v, lv) => lv && typeof MUPG_NAME !== 'undefined' && MUPG_NAME[v] ? MUPG_NAME[v][lv - 1] : MUP[lv].n; /* (round 39) each mech's own level names */
const bpLabel = b => b[0] === 'm' ? MECHS[+b.slice(1)].name + ' · ' + mupName(+b.slice(1), Math.min(UPG_MAX, mlvOf(+b.slice(1)) + 1)) : WPN[+b.slice(1)].name + ' · ' + gunUpName(+b.slice(1), Math.min(UPG_MAX, wlvOf(+b.slice(1)) + 1));
const isBig = z => { const T = ZT[z.k]; return !!(T && T.kaiju); }; /* (round 38g) the tough ones — (round 38h) just the 怪兽 now */
let FUS_ALT = false; /* (round 40d) true while a capsule fusion's module attacks: the driver fights with the module's mech for that one blow */
const mechOf = p => { const F = p && W && W.fus && (W.fus.a === p.i || W.fus.b === p.i) ? W.fus : null; if (F && FUS_ALT && F.v) return MECHS[F.kp]; if (F) return MECHS[F.d === p.i ? F.kb : F.kp]; /* (round 40) fused: the driver fights with the body's attack, the gunner with the module's */ return (p && p.evoOn && EVO[p.veh]) || MECHS[p && p.veh] || MECHS[4]; }; /* (round 37) in beast form its EVO entry stands in for the mech */
const mhpOf = (p, v) => { v = v || p.veh; const M = MECHS[v]; if (!M) return 0; const h = p.mh && p.mh[v]; return h == null ? M.hp : h; };
const PILLION = 0.38;                                   // how far behind the driver the back-seat rider sits
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
const BP_BASE = [1, 2, 3, 4, 5, 6, 7, 53, 56]; /* (round 39) sandbags retired; (round 40e) every wall / floor / door is free: brick + steel walls and steel floor moved here */
const BP_LIST = [8, 9, 51, 52, 57, 59, 'bike', 'moto', 'cargo', 'armor', 'gyro', 'tank'];
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
  { k: 'launcher', sn: '榴弹', name: '榴弹发射器', blastR: 2.6, dmg: 160, rate: 0.9, mag: 4, reload: 2.6, spread: 0.015, range: 22, pellets: 1, gl: 1, kick: 0, shake: 0.3, loot: 2, tag: '炸一片：落地就炸，半径 2.6，扎堆时用' },
];
const NW = WPN.length;

/* ---------- zombies (speeds in tiles/s) ---------- */
const ZT = {
  walker: { name: '游荡者', hp: 70, spd: 1.0, r: 0.31, h: 1.2, dmg: 12, bdmg: 12, cd: 1.0, sc: 1.2 },
  runner: { name: '疾跑者', hp: 45, /* (round 36m) fast ones are frailer: 55 → 45 */ spd: 3.1, r: 0.29, h: 1.14, dmg: 6, bdmg: 7, cd: 0.6, sc: 1.14, lunge: { r: 3.4, cd: 4, dmg: 9 }, sprint: { cd: 7, t: 1.2, mul: 1.45 } }, // (round 34d) pounces and bursts of speed; bite 8 → 6
  climber: { name: '攀爬者', hp: 50, /* (round 36m) fast ones are frailer: 70 → 50 */ spd: 2.3, r: 0.29, h: 0.84, dmg: 6, bdmg: 8, cd: 0.7, sc: 1.08, climb: 1, lunge: { r: 3, cd: 5, dmg: 8 }, sprint: { cd: 8, t: 1.2, mul: 1.4 } },
  spitter: { name: '喷吐者', hp: 170, spd: 0.9, r: 0.4, h: 1.55, dmg: 8, bdmg: 8, cd: 1.0, sc: 1.55, range: 9, spitCD: 2.6, sprint: { cd: 9, t: 1.0, mul: 1.6 } }, // spits more often; backs off at a run
  brute: { name: '重锤', hp: 800, spd: 1.0, r: 0.44, h: 1.74, dmg: 24, bdmg: 75, cd: 1.6, sc: 1.74, kb: 6, charge: 1, sprint: { cd: 9, t: 1.5, mul: 1.5 } }, // (round 23) faster, plus a telegraphed charge and a ground slam
  boss: { name: '巨尸', hp: 2600, spd: 0.65, r: 0.69, h: 2.64, dmg: 45, bdmg: 220, cd: 2.0, sc: 2.64, kb: 9 },
  dog: { name: '尸犬', hp: 32, /* (round 36m) fast ones are frailer: 40 → 32 */ spd: 3.7, r: 0.27, h: 0.66, dmg: 6, bdmg: 3, cd: 0.5, sc: 1.2, lunge: { r: 3.6, cd: 3, dmg: 8 } },
  crawler: { name: '爬行尸', hp: 60, spd: 0.75, r: 0.3, h: 0.46, dmg: 11, bdmg: 9, cd: 0.9, sc: 1.2 },
  bloater: { name: '爆尸', hp: 200, spd: 0.75, r: 0.46, h: 1.65, dmg: 8, bdmg: 10, cd: 1.1, sc: 1.65, blast: 1, lob: { r: 7, cd: 5 } }, // lobs a glob of bile
  screamer: { name: '尖叫者', hp: 120, /* (round 36m) fast ones are frailer: 150 → 120 */ spd: 1.5, r: 0.34, h: 1.5, dmg: 7, bdmg: 6, cd: 0.9, sc: 1.5, scream: 1, sonic: { r: 6, cd: 6, dmg: 7 }, sprint: { cd: 8, t: 1.2, mul: 1.5 } }, // a shriek that knocks you back
  leaper: { name: '飞扑尸王', hp: 2300, spd: 1.15, r: 0.5, h: 2.1, dmg: 30, bdmg: 60, cd: 1.2, sc: 2.0, kb: 7, boss: 1, look: 'boss', skin: '#7a4a3a' },
  digger: { name: '掘地尸王', hp: 2700, spd: 0.95, r: 0.55, h: 2.0, dmg: 34, bdmg: 90, cd: 1.4, sc: 2.0, kb: 8, boss: 1, look: 'brute', skin: '#6a6048' },
  summoner: { name: '召唤尸王', hp: 2100, spd: 0.72, r: 0.5, h: 2.3, dmg: 22, bdmg: 40, cd: 1.4, sc: 2.2, boss: 1, look: 'boss', skin: '#5a5470' },
  venom: { name: '毒液尸王', hp: 2300, spd: 0.85, r: 0.52, h: 2.1, dmg: 26, bdmg: 50, cd: 1.3, sc: 2.1, range: 12, boss: 1, look: 'bloater', skin: '#7a9a3a' },
  // (round 34) kaiju: walking monsters about 40-80% of a mech, each with its own telegraphed skill; from night 5 (level 3)
  kjaw: { name: '裂颚兽', hp: 2000, spd: 0.95, r: 0.85, h: 3.2, dmg: 30, /* (round 36l) hp 2600 → 2000, bite 42 → 30 */ bdmg: 260, cd: 1.4, sc: 1, kb: 8, kaiju: 'acid', skin: '#4a6a3a' },
  ktail: { name: '钢尾兽', hp: 2300, spd: 1.0, r: 0.9, h: 2.8, dmg: 32, /* (round 36l) 3000 → 2300, 45 → 32 */ bdmg: 300, cd: 1.6, sc: 1, kb: 10, kaiju: 'tail', skin: '#5a5a66' },
  kwing: { name: '翼龙兽', hp: 1700, spd: 3.0, r: 1.0, h: 1.4, dmg: 0, bdmg: 0, cd: 2, sc: 1, kb: 8, kaiju: 'wing', fly: { alt: 5.2, orbit: 6.5, dive: 16, cd: 4, spd: 4.4 } }, // (round 36m) the flying kaiju: swoops along a marked line and lands (an opening), rains acid on you (roofs too), flaps a gust; hit it hard in a tell and it crashes down
  kdig: { name: '掘地兽', hp: 1800, spd: 0.9, r: 0.8, h: 2.5, dmg: 28, /* (round 36l) 2300 → 1800, 40 → 28 */ bdmg: 220, cd: 1.4, sc: 1, kb: 8, kaiju: 'dig', skin: '#7a5a3a' },
  armored: { name: '防暴尸', hp: 260, spd: 0.9, r: 0.4, h: 1.5, dmg: 12, bdmg: 16, cd: 1.1, sc: 1.55, armor: 0.3, lunge: { r: 2.8, cd: 5, dmg: 12 } }, // a shield-first lunge
  // (round 35) flyers: flocks that cruise over walls and roofs, circle you and dive in for a peck (36_beasts); a roof over your head keeps them off
  crow: { name: '尸鸦', hp: 22, spd: 4.2, r: 0.3, h: 0.5, dmg: 6, bdmg: 0, cd: 1, sc: 1, fly: { alt: 1.9, orbit: 3.2, dive: 8, cd: 2.4, spd: 2.0 } }, /* (round 36b) peck 5 → 6, dive every 3.4 → 2.4 s, dive speed ×1.8 → ×2.0 */
  vult: { name: '尸鹫', hp: 60, spd: 3.4, r: 0.4, h: 0.6, dmg: 12, bdmg: 0, cd: 1, sc: 1, fly: { alt: 3.4, orbit: 4.4, dive: 10, cd: 3.2, spd: 1.6, bomb: 1 } }, // (round 36l) circles high and drops acid globs on the spot you are heading for (marked)
  bat: { name: '尸蝠', hp: 34, spd: 3.7, r: 0.32, h: 0.5, dmg: 7, bdmg: 0, cd: 1, sc: 1, fly: { alt: 2.2, orbit: 2.6, dive: 9, cd: 2.0, spd: 2.2, drain: 8 } }, /* (round 36b) bite 6 → 7, 2.7 → 2.0 s, ×2.0 → ×2.2 */ // a bite heals it
  // (round 35) 能力者: rare elites, each with one strong telegraphed skill (36_beasts), a coloured aura and a name over the head
  blinker: { name: '闪影者', hp: 520, spd: 1.55, r: 0.35, h: 1.7, dmg: 14, bdmg: 12, cd: 0.8, sc: 1.6, look: 'runner', skin: '#7a66aa', elite: { k: 'blink', cd: 6.5, col: '#b47aff', tip: '会瞬移到你身后再砍一刀，看到紫光就闪开' } },
  caller: { name: '唤尸者', hp: 650, spd: 0.85, r: 0.37, h: 1.7, dmg: 12, bdmg: 10, cd: 1.0, sc: 1.65, look: 'screamer', skin: '#5e8268', elite: { k: 'call', cd: 11, col: '#6aff9a', tip: '会从地下叫出一群丧尸，打断它（晕住）就叫不出来' } },
  warden: { name: '护盾者', hp: 800, spd: 0.8, r: 0.41, h: 1.7, dmg: 16, bdmg: 16, cd: 1.1, sc: 1.7, look: 'spitter', skin: '#5e7eae', elite: { k: 'shield', cd: 9, col: '#6ac8ff', tip: '给周围的丧尸套护盾，钻进蓝色护盾里打才打得动，爆破弹能直接打碎' } },
  shade: { name: '隐身者', hp: 420, spd: 1.5, r: 0.35, h: 1.6, dmg: 12, bdmg: 10, cd: 0.9, sc: 1.55, look: 'walker', skin: '#50505e', elite: { k: 'cloak', cd: 6, col: '#c0c0e0', tip: '隐身摸到你身边偷袭，留意空气里的扭曲，附近炸一下就现形' } },
};
const ELITES = ['blinker', 'caller', 'warden', 'shade'];
const BUILD_TAG = '第 40d 轮'; // (round 36b) shown in the pause menu so you can tell whether a phone is still on a cached older version
// aim assist (SET.assist): fire-button lock range (x weapon range), lock-on time before it fires, spread while auto-aimed, mouse/finger magnet
const PORT = 1.25; // firing port: your own shots pass a wall / door you built if it is this close to you
const ASSIST = [{ name: '关', range: 0, acq: 0, spread: 1, mag: 0 }, { name: '标准', range: 0.75, acq: 0.3, spread: 1.5, mag: 1 }, { name: '强', range: 1, acq: 0, spread: 1, mag: 1 }];
const assistLv = () => ASSIST[SET.assist == null ? 1 : SET.assist] || ASSIST[1];
const ZKEYS = ['walker', 'runner', 'climber', 'spitter', 'brute', 'boss', 'dog', 'crawler', 'bloater', 'screamer', 'armored', 'leaper', 'digger', 'summoner', 'venom', 'kjaw', 'ktail', 'kdig', 'crow', 'bat', 'blinker', 'caller', 'warden', 'shade', 'vult', 'kwing']; // order is the net id

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
/* ---------- (round 32) permanent tasks: counters that build up over the whole run; each tier reached gives the team a permanent upgrade ---------- */
const PERM = [
  { k: 'kill', name: '击杀丧尸', need: [60, 200, 500, 1200, 2500], perk: 'hp' },
  { k: 'search', name: '搜刮', need: [25, 80, 200, 450], perk: 'bag' },
  { k: 'build', name: '建造 / 放置', need: [40, 150, 400], perk: 'med' },
  { k: 'nade', name: '用手雷炸死丧尸', need: [15, 60, 160], perk: 'nade' },
  { k: 'clean', name: '整夜没有人倒下', need: [2, 5, 9], perk: 'life' },
  { k: 'elite', name: '击杀精英（重锤、防暴尸、尸王）', need: [5, 20, 50], perk: 'upg' }, // (round 36f) raises 强化弹头 (the shop no longer sells it)
  { k: 'shove', name: '刀命中', need: [50, 200, 500], perk: 'bag' },
  { k: 'gather', name: '砍树、采石', need: [30, 100, 250], perk: 'med' },
];
const PERK = { hp: ['生命上限 +10', 10], bag: ['背包：弹药上限 +25%', 0.25], med: ['医疗包上限 +2', 2], nade: ['手雷上限 +3（特殊手雷各 +2）', 3], life: ['复活次数 +1', 1], upg: ['强化弹头 +1（全队伤害 +12%）', 1] };
const perkLv = k => (typeof W !== 'undefined' && W && W.perk && W.perk[k]) || 0;
// carry limits grow with the upgrades (read through getters so every place that checks a cap sees the current one)
const ammoCap = wi => Math.round((WPN[wi].gl ? 60 : 500) * (1 + PERK.bag[1] * perkLv('bag'))); // (round 33) 500 rounds a gun (grenade launcher 100), +25% per backpack upgrade
/* ---------- daily tasks (before round 32): three are rolled every dawn (and at the start) and last until the next dawn ---------- */
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
  { id: 'tshell', cat: 'gun', name: '坦克炮弹 ×25', desc: '坦克主炮用的炮弹，车里最多放 200 发；造坦克时送 100 发', cost: { parts: 4, steel: 3 }, shl: 25 }, // (round 31)
  { id: 'gfuel', cat: 'fuel', name: '给旋翼机加满油', desc: '', cost: {}, fuel: 1 }, // (round 30) refuel from the shop too (free, instant; F in a roofed room still works)
  { id: 'gammo', cat: 'gun', name: '旋翼机机枪弹 ×150', desc: '旋翼机机头下的机枪用的子弹（飞的时候按开火），机上最多存 500 发；造旋翼机时送 250 发', cost: { parts: 3, steel: 2 }, gam: 150 }, // (round 30)
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
  { id: 'bike', cat: 'veh', name: '自行车', desc: VEH[1].tag, cost: { wood: 6, steel: 6, parts: 4 }, veh: 1, bp: 'bike' },
  { id: 'moto', cat: 'veh', name: '摩托车', desc: VEH[2].tag, cost: { steel: 14, parts: 12 }, veh: 2, bp: 'moto' },
  { id: 'cargo', cat: 'veh', name: '货运三轮', desc: VEH[3].tag, cost: { wood: 8, steel: 10, parts: 8 }, veh: 3, bp: 'cargo' },
  { id: 'armor', cat: 'veh', name: '装甲车', desc: VEH[4].tag, cost: { steel: 24, parts: 16 }, veh: 4, bp: 'armor' },
  { id: 'gyro', cat: 'veh', name: '旋翼机', desc: VEH[5].tag, cost: { steel: 20, parts: 24 }, veh: 5, bp: 'gyro' },
  { id: 'tank', cat: 'veh', name: '坦克', desc: VEH[6].tag, cost: { steel: 40, parts: 30 }, veh: 6, bp: 'tank' },
  { id: 'mfix', cat: 'fuel', name: '修好机甲装甲', desc: '', cost: { steel: 8, parts: 8 }, mfix: 1 }, // (round 34b) all your mechs' hulls
  { id: 'mbat', cat: 'fuel', name: '给机甲充满电', desc: '', cost: { parts: 4 }, mbat: 1 },
  /* (round 36f) the riot shield and the 强化弹头 purchase are gone: the knife is the melee weapon, and the team starts at 弹头 Lv 3 (tasks raise it further) */
];

/* ---------- balance ---------- */
const BAL = {
  nights: 15,
  evoCap: 500, /* (round 38j) 200 → 500 */ evoT: 22, evoKill: 4, /* (round 38i) the meter banks up to 200 (= 2 × 22 s) and fills from kills on foot / in a vehicle too */ evoBig: 15, evoBurst: 3.5, evoAura: 5, evoAuraMul: 0.6, /* (round 37) 进化 meter: 100 = full; 22 s in beast form; kills fill it */
  flyRk: 3, flyRkMul: 1.3, /* (round 36n) 苍隼 in the air: three rockets a shot, ×1.3 each */ rainN: 36, rainT: 2.0, rainR: 4.5, rainDmg: 55, /* (round 36n) 工蜂 快递雨 */
  mgSpread: 0.03, droneN: 10, droneT: 10, droneDmg: 7, droneRate: 0.3, droneRange: 12, quakeR: 7, quakeDmg: 260, /* (round 36n) 疾风 machine gun + 浮游炮; 铁卫 掀地 */
  upgStart: 3, upgMax: 6, mechUpg: 0.12, /* (round 36n) mechs gain +12% for each 弹头 level earned above the start (they used to gain nothing) */         // (round 36f) 强化弹头 (+12% team damage a level) starts at 3 (was 0, bought up to 5 in the shop); the 击杀精英 task's three tiers push it to 6
  dayLen: [300, 240],            // first day, later days (seconds); (round 34b) from day 2 dayFor(n) shortens it
  dayFor: n => n <= 1 ? 300 : Math.max(150, 240 - (n - 1) * 12), // day n (after night n - 1): 240, 228, 216 … down to 150
  pMaxHp: 100, pSpeed: 4.4, pReach: 7.5, /* (round 25) 6.5 → 7.5 */
  stairHold: 0.18, ledgeHold: 0.45,  // seconds of pushing before you walk down stairs / jump off a ledge
  downTime: 30, reviveTime: 2.4, soloDownTime: 8, respawnHp: 0.5,
  respawnDay: 20, respawnNight: 20, respawnInv: 4, lives: { easy: 5, normal: 3, hard: 1 }, livesLong: 2, /* respawns each: by difficulty, +2 in the long modes (经典 15 夜 / 尸城求生 10 夜) */ /* (round 24) 20 s day or night (was 60 at night), back at the base, 2.5 s untouchable */ rezTime: 6, rezHp: 0.4, // (round 20) a dead teammate comes back by a living one after this long (or at dawn); a medkit at the body brings them back at once
  searchTime: 1.5, healTime: 1.0, medHeal: 60,
  shieldBlock: 0.5, shieldCos: 0.26,                          // (round 23) riot shield is a melee weapon now: with it out, hits from within ~75° of your aim lose half; no wear
  chgWind: 0.85, chgSpd: 7.5, chgTime: 1.2, chgDmg: 34, chgKB: 10, chgWall: 400, chgStun: 1.4, chgCD: 6, chgMin: 3.2, chgMax: 10, // brute charge: red line on the ground, then a rush
  slamR: 2.6, slamWind: 0.55, slamDmg: 22, slamKB: 7, slamCD: 4,  // brute ground slam: red ring, then everything inside gets hit and thrown
  bashR: 2.4, bashCos: 0.34, bashKB: 20, bashStun: 1.0, bashDmg: 20, bashCD: 0.85, bashMax: 8, // shield bash: everything in front (up to 8) shoved ~3 tiles back and stunned
  padDist: 9, padUp: 2,  /* (round 25) 5 → 9 tiles */                                        // jump pad: how far / how many floors up it can throw you
  ramDmg: 70, ramCD: 0.7, ramSpd: 1.6, /* (round 36n) 30 / 2.2 → 70 / 1.6, and it knocks them down */                         // armoured car: hitting a zombie at speed
  cargoSearch: 0.5, cargoLoot: 1.5, cargoReach: 2.3,           // cargo trike: search time x, loot x, reach from the seat
  knifeDmg: 55, knifeKB: 2.5, knifeCD: 0.5, knifeRange: 2.3, knifeLunge: 1.3, knifeBack: 2, // melee (was a shove: 18 dmg, KB 6, CD 0.55, 1.3 cone)
  nadeCap: 10, medCap: 8, gnCap: 8,                            // (round 24) carry: frag grenades / medkits / each special grenade (was 10 / 5 in 23d)
  slowR: 3.6, slowT: 8, slowMul: 0.3,                           // slow grenade: a sticky field, zombies inside crawl at 30%
  smokeR: 3.8, smokeT: 10, smokeConf: 1.2,                      // smoke: zombies in the cloud lose you, wander and don't bite (and for 1.2 s after leaving)
  blastR: 4.4, blastDmg: 70, blastKB: 24, blastStun: 1.6,       // blast: little damage, throws everything out of the way (clears a path)
  tankDmg: 120, tankR: 2.3, tankRate: 1.45, /* (round 36b) 1.6 → 1.45 */ tankRange: 20, tankCap: 200, tankStart: 100, // (round 31) tank cannon: a shell that bursts where it hits
  mechBat: 120, mechLow: 20, mechPass: 0.1, evoPass: 0.05, biteWU: 0.45, biteDrive: 2.2, bpOdds: 0.035, bpPity: 32, capOdds: 0.03, capPity: 45, capMax: 4, capT: 45, /* (round 40d) fusion capsules: 3% of searches (at the latest every 45th) while someone has a mech, hold 4, a fusion lasts 45 s */ /* (round 38j) a search finds a blueprint 3.5% of the time, at the latest every 32 searches (≈ one in 20) */ mechDmg: 1.5, mechTough: 1.5, bigHp: 1.25, /* (round 38g) mechs / beasts hit 1.5× harder and lose hull 1.5× slower; (round 38h) only 怪兽 get more hp (1.5 → 1.25, and 尸王 / 巨尸 / 能力者 back to 1): the control skills carry the difficulty now. Everything that isn't a mech does ×bigHp to a 怪兽, so on foot nothing changes */ /* (round 38g) on foot / in a vehicle a zombie must hold on 0.45 s before the first bite; a vehicle moving faster than 2.2 isn't bitten */ /* (round 38f) in beast form only half as much gets through to the pilot */ mechRegen: 0.015, batRegen: 0.4, xformT: 1.0, // (round 34b) mech energy (s), low warning, share of a hit the pilot still feels, hull / energy coming back while not a mech (/s), transform time
  gyroDmg: 12, gyroRate: 0.11, /* (round 36b) 0.12 → 0.11 */ gyroSpread: 0.06, gyroRange: 22, gyroCap: 500, gyroStart: 250, // (round 30) gyrocopter chin gun: its own ammo, bought in the shop
  flyHover: 2.2, flyClimb: 0.8, flyDrop: 0.6, fuelLow: 10, refuelT: 4, // (round 29) gyrocopter: cruise 2.2 floors over whatever is below, climb / descend rate (of the take-off curve per second), warn at 10 s of fuel, 4 s to refuel indoors
  zSlope: 0.45, zSlopeC: 0.7, // (round 36) zombie speed going UP a hill slope (climbers barely mind)
  workerGather: 0.6, workerRegrow: 0.6, // (round 36b) and 60% of what it gathered grows back at dawn // (round 36) 工蜂 passive: flattening a tree / rock / scrap / logs / bush gathers it, at this share of a normal gather
  kaijuHpPer: 0.09, kaijuPair: 0.8, xposeMul: 2, // (round 36l) kaiju hp grows +9% a night (was +18% like everything), two in a night ×0.8 each; a 破绽 (opening) doubles the damage it takes
  bigFoot: 0.65, // (round 36) kaiju / 能力者 damage to someone not in a mech
  vis: { foot: 18, floor: 3.5, night: 0.85, mech: 20, fly: 28 }, /* (round 35) 12 / 2.5 / 0.75 / 14 / 20 → 16 / 3 / 0.8 / 18 / 26; (round 36) → 18 / 3.5 / 0.85 / 20 / 28 */ // (round 34d) how far you see zombies (shared with your teammate): on foot, + per floor up, × at night; vehicles have their own (VEH[].vis)
  nadeRange: 12, nadeDmg: 220, nadeR: 3.0, nadeFuse: 1.9, nadeLand: 0.35, nadeMin: 0.3, // (round 18: radius 2.8 -> 3.4, damage at the edge 35% -> 50%, goes off 0.35 s after landing where you aimed)
  headshot: 1.6,
  radioHp: 1500, radioDmg: 0.5,
  startRes: { wood: 90, stone: 30, steel: 20, parts: 8 },
  refund: 0.5,
  nightSpawn: n => Math.round(32 + n * 15),     // (round 34b: 30 + 12n → 32 + 15n; round 18: was 22 + 9n)
  bloodMul: 1.5,
  hpMul: n => 1 + 0.18 * (Math.min(n, 8) - 1) + 0.08 * Math.max(0, n - 8), /* (round 36n) +18% a night up to night 8, then +8% (was +18% all the way: night 19 ×4.24 → ×3.14) */ // (round 34b: 0.15 → 0.18 per night)
  nightLv: n => Math.max(1, n),                 // (round 34b) back to a step every night (round 31 had one every two nights)
  lvN: n => Math.max(1, n),                     // the night number the numbers are worked out from (round 31–34a: in steps of two)
  spdMul: n => Math.min(1.6, 1 + 0.035 * (n - 1)), // (round 34b: 0.03 → 0.035 per night, capped at ×1.6)
  spawnDur: n => 35 + n * 6,      // the horde trickles in over this long (round 34b: 35 + 4n → 35 + 6n)
  zCap: () => TOUCHY ? 95 : 140,  // most zombies alive at once; the rest of the horde waits its turn
  nightMin: n => Math.min(330, 150 + Math.max(0, n - 1) * 15), // a night lasts at least this long; small groups keep coming until then (round 34b: 150 + 6n → from night 2 +15 s a night, up to 330)
  nightTrickleCD: 7, nightTrickleMax: 8,
  dayStragglers: 6, dayStragglerCD: 14, // (round 36b) quieter days: 8 / 10 s → 6 / 14 s
  day: { spd: 0.8, dmg: 0.75, notice: 0.7 }, // (round 36b) by day zombies are sluggish: slower, bite softer, no pounces / sprints / skills, sleepers slower to notice you
  burnSpread: 2.5, burnSpreadR: 1.15, // burning zombies set fire to others this close, about 2.5 times a second (was: same cell only, 1.2 / s)
  barrelR: 3.2, barrelDmg: 240, barrelBurn: 3, // red oil barrels go up when shot
  burnDps: 28, blastR: 2.3, blastDmgP: 32, blastDmgB: 160, screamR: 9, screamCD: 9, rageMul: 1.45,
  lootFar: 30, wireDps: 8, wireSlow: 0.5, wireWear: 6,          // (round 28) wire covers a 3×3 patch: 14 → 8 / s, slow ×0.45 → ×0.5
  trapStun: 1.8, trapDmg: 18, trapUses: 3, limpT: 3, limpMul: 0.6, // (round 28) bear traps: 3×3, stun 2.5 → 1.8 s, 30 → 18 damage, 1 → 3 catches, then a 3 s limp
  mineR: 3.2, mineDmg: 120, mineSlowR: 2.6, mineSlowT: 4,       // (round 28) mines: set off anywhere in their 3×3, blast 2.4 → 3.2, 200 → 120 damage, leave a 4 s sticky patch
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
// (round 32) carry limits grow with the permanent upgrades: read through getters, so every place that checks a cap sees the current one
for (const [k, base, per, perk] of [['pMaxHp', 100, 10, 'hp'], ['medCap', 8, 2, 'med'], ['nadeCap', 10, 3, 'nade'], ['gnCap', 8, 2, 'nade']]) Object.defineProperty(BAL, k, { get: () => base + per * perkLv(perk), configurable: true });
