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
const DIFF = [
  { name: '简单', err: 0.30, react: 0.65, dodge: 0.10, think: 0.26, superP: 0.5, keep: 1, fireCd: 1.0 },
  { name: '普通', err: 0.19, react: 0.42, dodge: 0.35, think: 0.17, superP: 0.85, keep: 0, fireCd: 0.6 },
  { name: '困难', err: 0.06, react: 0.16, dodge: 0.70, think: 0.11, superP: 1, keep: 0, fireCd: 0.38 },
];

/* ================= heroes (original characters) =================
   atk/sup.type: spread | single | fan | flame | lob | burst | bounce | dash | ring | turret */
const HEROES = [
  {
    k: 'anvil', name: '铁砧', title: '霰弹工匠', color: '#f39233', hp: 4700, spd: 3.0, reload: 1.55,
    atk: { type: 'spread', n: 5, spread: 0.52, range: 6.6, speed: 17, dmg: 380, size: 0.17, proj: 'pellet' },
    sup: { type: 'spread', n: 9, spread: 0.78, range: 8.5, speed: 18, dmg: 420, size: 0.22, proj: 'slug', kb: 2.6, breakWalls: true },
    charge: 0.05, ai: { pref: 2.6 },
    desc: '粗壮的矿山工匠，近身一炮五发霰弹，贴脸伤害极高。',
    atkName: '矿山霰弹', atkDesc: '扇形喷出 5 发弹丸，越近命中越多。',
    supName: '开山炮', supDesc: '9 发重弹，击退敌人并轰碎墙体。',
  },
  {
    k: 'vixen', name: '灵狐', title: '沙海游侠', color: '#2bb5a4', hp: 2800, spd: 3.0, reload: 2.0,
    atk: { type: 'single', range: 10.5, speed: 21, dmg: 1350, size: 0.2, proj: 'bolt' },
    sup: { type: 'fan', n: 3, spread: 0.3, range: 11.5, speed: 24, dmg: 1800, size: 0.26, proj: 'bolt2', pierce: true },
    charge: 0.34, ai: { pref: 7.5 },
    desc: '狐耳兜帽的游侠，手持弩箭远程狙击。',
    atkName: '狐火弩箭', atkDesc: '射出一支高伤害长程弩箭。',
    supName: '三连穿云', supDesc: '三支穿透箭矢，可贯穿多个敌人。',
  },
  {
    k: 'magma', name: '熔岩', title: '岩心巨像', color: '#e8542c', hp: 5400, spd: 2.75, reload: 1.3,
    atk: { type: 'flame', n: 6, spread: 0.5, range: 3.6, speed: 11, dmg: 225, size: 0.42, proj: 'flame', pierce: true },
    sup: { type: 'dash', range: 6.5, speed: 17, dmg: 1500, kb: 2.2, breakWalls: true },
    charge: 0.028, ai: { pref: 1.8 },
    desc: '体内流淌熔岩的石头巨像，皮糙肉厚。',
    atkName: '熔流喷射', atkDesc: '近距离喷出贯穿火焰。',
    supName: '岩崩冲撞', supDesc: '向前冲锋，撞飞敌人、撞碎墙体。',
  },
  {
    k: 'boomcat', name: '炸弹喵', title: '爆破专家', color: '#9b5de5', hp: 3000, spd: 3.0, reload: 1.8,
    atk: { type: 'lob', range: 7.5, flight: 0.62, radius: 1.25, dmg: 1150, proj: 'bomb' },
    sup: { type: 'lob', range: 8.5, flight: 0.85, radius: 2.7, dmg: 2300, proj: 'megabomb', breakWalls: true },
    charge: 0.3, ai: { pref: 6 },
    desc: '戴护目镜的猫咪，炸弹能越过墙壁。',
    atkName: '喵喵炸弹', atkDesc: '抛出一颗越墙炸弹，范围爆炸。',
    supName: '超级毛线弹', supDesc: '巨型炸弹，大范围伤害并夷平墙体。',
  },
  {
    k: 'kite', name: '飞鸢', title: '天空海盗', color: '#e63946', hp: 3600, spd: 3.1, reload: 1.4,
    atk: { type: 'burst', n: 4, gap: 0.085, range: 8.2, speed: 19, dmg: 390, size: 0.15, proj: 'bullet' },
    sup: { type: 'ring', n: 26, waves: 2, range: 7, speed: 16, dmg: 380, size: 0.17, proj: 'bullet2' },
    charge: 0.07, ai: { pref: 5.5 },
    desc: '驾驶飞艇的海盗船长，双枪连射。',
    atkName: '双枪连射', atkDesc: '左右手交替打出 4 发子弹。',
    supName: '风暴弹幕', supDesc: '原地旋转，向四周倾泻两轮弹幕。',
  },
  {
    k: 'sprocket', name: '扳手兔', title: '机械工程师', color: '#3a86ff', hp: 3800, spd: 3.0, reload: 1.5,
    atk: { type: 'bounce', range: 8.5, speed: 15, dmg: 920, size: 0.24, proj: 'orb', bounces: 1 },
    sup: { type: 'turret', range: 4.5 },
    charge: 0.25, ai: { pref: 6 },
    desc: '机械兔耳头盔的小工程师，会造炮台。',
    atkName: '弹跳能量球', atkDesc: '能量球撞墙会反弹一次。',
    supName: '兔兔炮台', supDesc: '放置一座自动射击的炮台。',
  },
];
const HERO_IDX = Object.fromEntries(HEROES.map((h, i) => [h.k, i]));
const BOT_NAMES = ['沙蝎', '仙人掌', '小旋风', '石头人', '阿呆', '豆豆', '火柴', '咕噜', '铁蛋', '跳跳', '团子', '闪电', '芒果', '奶糖', '大胃王', '麦芽', '风滚草', '橘子', '花卷', '饭团'];
const PROJ_KINDS = ['pellet', 'slug', 'bolt', 'bolt2', 'flame', 'bomb', 'megabomb', 'bullet', 'bullet2', 'orb', 'tshot'];
const PK_IDX = Object.fromEntries(PROJ_KINDS.map((k, i) => [k, i]));
