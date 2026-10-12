'use strict';
/* ================= core utils ================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const d2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
const dist = (ax, az, bx, bz) => Math.sqrt(d2(ax, az, bx, bz));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const rr = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const QS = new URLSearchParams(location.search);
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || QS.get('touch') === '1';
const LS = { get(k, d) { try { const v = localStorage.getItem('dunerumble.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('dunerumble.' + k, JSON.stringify(v)); } catch (e) { } } };

/* player settings (persisted) */
const SET = Object.assign({ cb: false, shake: true, nums: true, quality: 'auto', stick: 1, hand: 'right', autoDiff: true, vol: 0.55 }, LS.get('settings', {}));
const saveSet = () => LS.set('settings', SET);

/* ================= balance (all tunables in one place) ================= */
const BAL = {
  N: 40,                 // map size in tiles
  R: 0.4,                // brawler collision radius
  ammoMax: 3,
  minGap: 0.32,          // min seconds between two attacks
  regenDelay: 3.0, regenPct: 0.13,
  cubeHp: 0.10, cubeDmg: 0.10,
  boxHp: 4000,
  revealT: 1.3,          // seconds a brawler is revealed after shooting / being hit in a bush
  bushSeeR: 2.4,         // enemies closer than this see you in a bush
  gasStart: 40, gasEnd: 155, gasMin: 2.5, gasDps: 900, gasDpsGrow: 8,
  duoRespawn: 12,
  hpMul: 1.35,          // global HP multiplier (keeps fights from ending in one volley)
  superFill: 1,
  turretLife: 20, turretHp: 2600, turretRange: 7.5, turretRate: 0.45, turretDmg: 260,
};
/* AI difficulty profiles. err = aim error (rad), lead = how much of the target's motion is predicted,
   supDelay = seconds a bot waits before using a ready super, warm = first-shot error multiplier on a new target */
const DIFF = [
  { name: '简单', err: 0.34, react: 0.75, dodge: 0.08, think: 0.26, superP: 0.4, supDelay: [1.0, 2.2], keep: 1, fireCd: 1.2, lead: [0, 0.3], warm: 1.8 },
  { name: '普通', err: 0.28, react: 0.65, dodge: 0.20, think: 0.17, superP: 0.5, supDelay: [0.5, 1.5], keep: 0, fireCd: 0.95, lead: [0.3, 0.6], warm: 1.6 },
  { name: '困难', err: 0.06, react: 0.16, dodge: 0.70, think: 0.11, superP: 1, supDelay: [0, 0.3], keep: 0, fireCd: 0.38, lead: [0.55, 1.0], warm: 1.15 },
];
const GADGETS = {
  nova: { name: '冲击波', desc: '推开身边的敌人并造成少量伤害', cd: 6 },
  freeze: { name: '冰霜新星', desc: '冻住身边的敌人 1 秒', cd: 7 },
  blink: { name: '闪现', desc: '向瞄准方向瞬移 3.5 格，可以穿墙', cd: 6 },
  armor: { name: '岩石护甲', desc: '2.5 秒内受到的伤害减少 60%', cd: 8 },
  trap: { name: '捕兽夹', desc: '在脚下放一个敌人看不见的陷阱，踩中会眩晕', cd: 5 },
  reload: { name: '快速装填', desc: '立刻装满弹药', cd: 7 },
  heal: { name: '急救包', desc: '立刻恢复 30% 生命', cd: 9 },
  speed: { name: '疾跑', desc: '3 秒内移速 +45%', cd: 7 },
  dash: { name: '翻滚', desc: '朝移动方向快速翻滚 3 格', cd: 4 },
};
const GADGET_USES = 3;
const STARS = {
  tough: { name: '铜皮铁骨', desc: '最大生命 +15%' },
  power: { name: '火力全开', desc: '伤害 +10%' },
  swift: { name: '健步如飞', desc: '移速 +8%' },
  vamp: { name: '嗜血', desc: '击败敌人时回复 35% 生命' },
  charge: { name: '超能充电', desc: '大招充能速度 +25%' },
  quick: { name: '快手', desc: '弹药装填速度 +15%' },
  bushheal: { name: '草丛疗养', desc: '在草丛里回血速度翻倍' },
  laststand: { name: '背水一战', desc: '生命低于 35% 时受到伤害 -25%' },
};

/* ================= heroes (original characters) =================
   atk/sup.type: spread | single | fan | flame | lob | burst | bounce | dash | ring | turret */
const HEROES = [
  {
    k: 'anvil', gad: 'nova', sps: ['tough', 'laststand'], name: '铁砧', title: '霰弹工匠', color: '#f39233', hp: 4700, spd: 3.0, reload: 1.55,
    atk: { type: 'spread', n: 5, spread: 0.52, range: 6.6, speed: 17, dmg: 330, size: 0.17, proj: 'pellet' },
    sup: { type: 'spread', n: 9, spread: 0.78, range: 8.5, speed: 18, dmg: 420, size: 0.22, proj: 'slug', kb: 2.6, breakWalls: true },
    charge: 0.05, ai: { pref: 2.6 },
    desc: '粗壮的矿山工匠，近身一炮五发霰弹，贴脸伤害极高。',
    atkName: '矿山霰弹', atkDesc: '扇形喷出 5 发弹丸，越近命中越多。',
    supName: '开山炮', supDesc: '9 发重弹，击退敌人并轰碎墙体。',
  },
  {
    k: 'vixen', gad: 'blink', sps: ['power', 'swift'], name: '灵狐', title: '沙海游侠', color: '#2bb5a4', hp: 2800, spd: 3.0, reload: 2.0,
    atk: { type: 'single', range: 10.5, speed: 21, dmg: 1350, size: 0.2, proj: 'bolt' },
    sup: { type: 'fan', n: 3, spread: 0.3, range: 11.5, speed: 24, dmg: 1800, size: 0.26, proj: 'bolt2', pierce: true },
    charge: 0.34, ai: { pref: 7.5 },
    desc: '狐耳兜帽的游侠，手持弩箭远程狙击。',
    atkName: '狐火弩箭', atkDesc: '射出一支高伤害长程弩箭。',
    supName: '三连穿云', supDesc: '三支穿透箭矢，可贯穿多个敌人。',
  },
  {
    k: 'magma', gad: 'armor', sps: ['vamp', 'tough'], name: '熔岩', title: '岩心巨像', color: '#e8542c', hp: 5400, spd: 2.75, reload: 1.3,
    atk: { type: 'flame', n: 6, spread: 0.5, range: 3.6, speed: 11, dmg: 225, size: 0.42, proj: 'flame', pierce: true },
    sup: { type: 'dash', range: 6.5, speed: 17, dmg: 1500, kb: 2.2, breakWalls: true },
    charge: 0.028, ai: { pref: 1.8 },
    desc: '体内流淌熔岩的石头巨像，皮糙肉厚。',
    atkName: '熔流喷射', atkDesc: '近距离喷出贯穿火焰。',
    supName: '岩崩冲撞', supDesc: '向前冲锋，撞飞敌人、撞碎墙体。',
  },
  {
    k: 'boomcat', gad: 'trap', sps: ['charge', 'power'], name: '炸弹喵', title: '爆破专家', color: '#9b5de5', hp: 3000, spd: 3.0, reload: 1.8,
    atk: { type: 'lob', range: 7.5, flight: 0.62, radius: 1.25, dmg: 1150, proj: 'bomb' },
    sup: { type: 'lob', range: 8.5, flight: 0.85, radius: 2.7, dmg: 2300, proj: 'megabomb', breakWalls: true },
    charge: 0.3, ai: { pref: 6 },
    desc: '戴护目镜的猫咪，炸弹能越过墙壁。',
    atkName: '喵喵炸弹', atkDesc: '抛出一颗越墙炸弹，范围爆炸。',
    supName: '超级毛线弹', supDesc: '巨型炸弹，大范围伤害并夷平墙体。',
  },
  {
    k: 'kite', gad: 'reload', sps: ['quick', 'swift'], name: '飞鸢', title: '天空海盗', color: '#e63946', hp: 3600, spd: 3.1, reload: 1.4,
    atk: { type: 'burst', n: 4, gap: 0.085, range: 8.2, speed: 19, dmg: 390, size: 0.15, proj: 'bullet' },
    sup: { type: 'ring', n: 26, waves: 2, range: 7, speed: 16, dmg: 380, size: 0.17, proj: 'bullet2' },
    charge: 0.07, ai: { pref: 5.5 },
    desc: '驾驶飞艇的海盗船长，双枪连射。',
    atkName: '双枪连射', atkDesc: '左右手交替打出 4 发子弹。',
    supName: '风暴弹幕', supDesc: '原地旋转，向四周倾泻两轮弹幕。',
  },
  {
    k: 'sprocket', gad: 'heal', sps: ['charge', 'bushheal'], name: '扳手兔', title: '机械工程师', color: '#3a86ff', hp: 3800, spd: 3.0, reload: 1.5,
    atk: { type: 'bounce', range: 8.5, speed: 15, dmg: 920, size: 0.24, proj: 'orb', bounces: 1 },
    sup: { type: 'turret', range: 4.5 },
    charge: 0.25, ai: { pref: 6 },
    desc: '机械兔耳头盔的小工程师，会造炮台。',
    atkName: '弹跳能量球', atkDesc: '能量球撞墙会反弹一次。',
    supName: '兔兔炮台', supDesc: '放置一座自动射击的炮台。',
  },
  {
    k: 'spore', gad: 'speed', sps: ['bushheal', 'charge'], name: '蘑菇婆婆', title: '孢子药师', color: '#e67e9a', hp: 4000, spd: 2.95, reload: 1.7,
    atk: { type: 'pool', range: 7.5, flight: 0.7, radius: 1.3, dmg: 400, proj: 'spore', zone: { k: 'poison', r: 1.5, life: 2.5, dps: 800 } },
    sup: { type: 'zone', range: 6, zone: { k: 'heal', r: 2.6, life: 5, dps: 650 } },
    charge: 0.07, ai: { pref: 6.2 },
    desc: '戴蘑菇帽的老婆婆，毒雾封路、治疗队友。',
    atkName: '毒孢弹', atkDesc: '抛出孢子弹，落地留下持续伤害的毒圈。',
    supName: '回春蘑菇圈', supDesc: '种下一圈蘑菇，持续为自己和队友回血。',
  },
  {
    k: 'frost', gad: 'freeze', sps: ['quick', 'tough'], name: '冰冰', title: '雪原企鹅', color: '#5dade2', hp: 3500, spd: 3.0, reload: 1.45,
    atk: { type: 'single', range: 8.5, speed: 15, dmg: 820, size: 0.22, proj: 'snowball', slow: 1.6 },
    sup: { type: 'zone', range: 8, zone: { k: 'frost', r: 2.6, life: 4, dps: 520, slow: true } },
    charge: 0.26, ai: { pref: 6.5 },
    desc: '戴毛线帽的小企鹅，雪球会冻住敌人的脚。',
    atkName: '冰冻雪球', atkDesc: '雪球命中后让敌人减速 1.6 秒。',
    supName: '暴风雪', supDesc: '召唤一片暴风雪，区域内敌人持续受伤并减速。',
  },
  {
    k: 'quill', gad: 'blink', sps: ['vamp', 'swift'], name: '阿刺', title: '刺猬刺客', color: '#c27c3e', hp: 4700, spd: 3.35, reload: 1.0,
    atk: { type: 'dash', range: 2.8, speed: 15, dmg: 1150 },
    sup: { type: 'leap', range: 7, dmg: 1600, radius: 1.6 },
    charge: 0.3, ai: { pref: 2.2 },
    desc: '跑得飞快的刺猬，专门近身偷袭。',
    atkName: '利爪突刺', atkDesc: '向前突进一小段，划伤路径上的敌人。',
    supName: '刺球飞扑', supDesc: '跳向目标点，落地对周围造成伤害，可越过墙壁。',
  },
  {
    k: 'wisp', gad: 'dash', sps: ['swift', 'bushheal'], name: '灯灯', title: '灯笼幽灵', color: '#f4c430', hp: 3300, spd: 3.1, reload: 1.6,
    atk: { type: 'boomerang', range: 7, speed: 12, dmg: 800, size: 0.3, proj: 'lantern' },
    sup: { type: 'stealth', dur: 4.5, range: 0 },
    charge: 0.2, ai: { pref: 4.5 },
    desc: '提着灯笼的小幽灵，灯笼能穿墙。',
    atkName: '回旋灯笼', atkDesc: '灯笼穿墙飞出再飞回，去回各能打中一次。',
    supName: '幽灵隐身', supDesc: '隐身 4.5 秒并加速，攻击会现形。',
  },
  {
    k: 'bruin', gad: 'nova', sps: ['laststand', 'vamp'], name: '熊大锤', title: '北境战熊', color: '#8e6145', hp: 6000, spd: 2.8, reload: 1.6,
    atk: { type: 'melee', range: 2.4, spread: 2.2, dmg: 1500 },
    sup: { type: 'fan', n: 7, spread: 0.9, range: 6, speed: 13, dmg: 900, size: 0.35, proj: 'quake', pierce: true, stun: 1.2, breakWalls: true },
    charge: 0.25, ai: { pref: 1.5 },
    desc: '戴角盔的巨熊，一锤一个坑。',
    atkName: '大锤横扫', atkDesc: '大范围近身锤击。',
    supName: '震地波', supDesc: '扇形地震波，眩晕敌人 1.2 秒并震碎墙体。',
  },
  {
    k: 'zap', gad: 'reload', sps: ['charge', 'quick'], name: '电光', title: '摇滚吉他手', color: '#d65ad6', hp: 3300, spd: 3.05, reload: 1.5,
    atk: { type: 'chain', range: 7, dmg: 680, chains: 2, chainR: 3.2 },
    sup: { type: 'shield', range: 3.8, amount: 1800, dur: 4.5 },
    charge: 0.22, ai: { pref: 5.5 },
    desc: '背着电吉他的摇滚歌手，闪电会在敌人之间跳跃。',
    atkName: '连锁闪电', atkDesc: '闪电打中前方敌人，再跳向附近 2 个敌人。',
    supName: '电磁护盾', supDesc: '给自己和附近队友加一层 1800 点护盾。',
  },
];
// hidden units (not selectable): PvE boss, its minions, training dummies
HEROES.push(
  { k: 'boss', hidden: true, gad: 'nova', sps: [], name: '钢铁巨像', title: 'Boss', color: '#c0392b', hp: 110000, spd: 1.7, reload: 99, rad: 1.05,
    atk: { type: 'single', range: 9, speed: 15, dmg: 500, size: 0.3, proj: 'bossshot' }, sup: { type: 'ring', n: 20, waves: 3, range: 9, speed: 11, dmg: 450, size: 0.28, proj: 'bossshot' },
    charge: 0, ai: { pref: 4 }, desc: '', atkName: '', atkDesc: '', supName: '', supDesc: '' },
  { k: 'minion', hidden: true, gad: 'dash', sps: [], name: '小机兵', title: '', color: '#7f8c8d', hp: 1300, spd: 2.6, reload: 1.4,
    atk: { type: 'single', range: 6, speed: 13, dmg: 320, size: 0.16, proj: 'tshot' }, sup: { type: 'single', range: 6, speed: 13, dmg: 320, size: 0.16, proj: 'tshot' },
    charge: 0, ai: { pref: 4.5 }, desc: '', atkName: '', atkDesc: '', supName: '', supDesc: '' },
  { k: 'dummy', hidden: true, gad: 'heal', sps: [], name: '木桩', title: '', color: '#b07440', hp: 4000, spd: 1.2, reload: 99,
    atk: { type: 'single', range: 1, speed: 1, dmg: 0, proj: 'tshot' }, sup: { type: 'single', range: 1, speed: 1, dmg: 0, proj: 'tshot' },
    charge: 0, ai: { pref: 3 }, desc: '', atkName: '', atkDesc: '', supName: '', supDesc: '' },
);
const PLAYABLE = HEROES.map((h, i) => i).filter(i => !HEROES[i].hidden);
const HERO_IDX = Object.fromEntries(HEROES.map((h, i) => [h.k, i]));
const BOT_NAMES = ['沙蝎', '仙人掌', '小旋风', '石头人', '阿呆', '豆豆', '火柴', '咕噜', '铁蛋', '跳跳', '团子', '闪电', '芒果', '奶糖', '大胃王', '麦芽', '风滚草', '橘子', '花卷', '饭团'];
const PROJ_KINDS = ['pellet', 'slug', 'bolt', 'bolt2', 'flame', 'bomb', 'megabomb', 'bullet', 'bullet2', 'orb', 'tshot', 'spore', 'snowball', 'lantern', 'quake', 'bossshot', 'rocket', 'meteor'];
const LOB_KINDS = new Set(['bomb', 'megabomb', 'spore', 'rocket', 'meteor']);
const ZONE_KINDS = ['poison', 'heal', 'frost'];
const ignoresWalls = a => a.type === 'lob' || a.type === 'pool' || a.type === 'boomerang' || a.type === 'zone' || a.type === 'leap';
const PK_IDX = Object.fromEntries(PROJ_KINDS.map((k, i) => [k, i]));
