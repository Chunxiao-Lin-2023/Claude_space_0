/* ================= data tables: balance, classes, skills, items, equipment, monsters ================= */
const BAL = {
  expNext: lv => Math.round(16 * Math.pow(lv, 1.7) + 14),
  realms: [ // level band → realm.  crossing 9→10 and 19→20 needs a breakthrough item
    { name: '搬血境', from: 1, to: 9 }, { name: '洞天境', from: 10, to: 19, need: 'jinghua' }, { name: '化灵境', from: 20, to: 29, need: 'baoxue' }, { name: '铭纹境', from: 30, to: 30, need: 'mingwen' }],
  lvCap: 30,
  defK: 40,              // damage taken = raw * K / (K + def)  (K grows with attacker level)
  critMul: 1.7,
  enemy: lv => ({ hp: 26 + lv * 20, atk: 5 + lv * 2.7, def: 2 + lv * 1.9, spd: 8 + lv * 0.35, exp: 9 + Math.round(lv * 6.5 + lv * lv * 0.35), gold: 3 + lv * 2 }),
  flee: 0.65,
  deathExpLoss: 0.15,    // fraction of the current level bar lost on defeat
  mpRegen: 0.06,         // per battle round, fraction of max MP
  enhRate: [1, 1, 0.95, 0.85, 0.72, 0.58, 0.44, 0.32, 0.22, 0.14], // chance of +n → +n+1
  enhStones: p => p + 1,
  enhGold: p => 40 * (p + 1) * (p + 1),
  enhPer: 0.09,          // each + adds 9% of the item's base stats
  enhDropFrom: 5,        // failing from +5 or higher drops one level (unless a 保护符 is used)
  rarity: [{ n: '凡品', c: '#d6cfbf', m: 1 }, { n: '良品', c: '#7fd36f', m: 1.18 }, { n: '上品', c: '#5aa8ff', m: 1.4 }, { n: '珍品', c: '#bb82ff', m: 1.7 }, { n: '至宝', c: '#ff9b3d', m: 2.05 }],
  rarityW: [56, 28, 12, 3.4, 0.6],
  marketTax: 0.05,
  bountyPerDay: 3,
  partyMax: 4,
  worldBossEvery: 15,    // minutes, aligned to the wall clock
  worldBossOpen: 6,      // minutes the boss stays up
};
const realmOf = lv => BAL.realms.find(r => lv >= r.from && lv <= r.to) || BAL.realms[0];

/* ---------- classes (宝术传承) ---------- */
const CLASSES = {
  mangniu: { name: '莽牛', role: '体修 · 坦克', icon: '🐂', color: '#e3a457', desc: '承莽牛宝术，皮糙肉厚，冲撞、金身、战吼。站在最前面替队友挡刀。',
    base: { hp: 160, mp: 34, atk: 11, def: 7, spd: 8, crit: 0.05 }, grow: { hp: 31, mp: 3, atk: 2.8, def: 2.0, spd: 0.2, crit: 0 }, skills: ['mn_charge', 'mn_gold', 'mn_roar', 'mn_rage'] },
  kunpeng: { name: '鲲鹏', role: '身法 · 输出', icon: '🦅', color: '#6cc0ff', desc: '悟鲲鹏宝术，快得只剩残影。连斩、撕裂、扶摇，一击要命。',
    base: { hp: 118, mp: 42, atk: 14, def: 4, spd: 12, crit: 0.15 }, grow: { hp: 21, mp: 4, atk: 3.3, def: 1.1, spd: 0.35, crit: 0.002 }, skills: ['kp_wing', 'kp_rend', 'kp_swift', 'kp_storm'] },
  liushen: { name: '柳神', role: '灵修 · 治疗', icon: '🌿', color: '#8fe0a0', desc: '受柳神一缕神光，柳枝能伤人也能救人。回春、庇护、符文天雷。',
    base: { hp: 110, mp: 72, atk: 12, def: 4.5, spd: 10, crit: 0.08 }, grow: { hp: 19.5, mp: 8, atk: 2.9, def: 1.2, spd: 0.25, crit: 0.001 }, skills: ['ls_whip', 'ls_heal', 'ls_ward', 'ls_rune'] },
};

/* ---------- skills ----------
   tgt: enemy | enemies | ally | allies | self
   dmg: multiple of attack (hits splits it), mag: ignore half of defence, heal/shield: multiple of attack (+% of target max HP)
   st: statuses applied to targets [{k, t, p, v}]  self: statuses on the caster */
const SKILLS = {
  atk: { name: '普攻', icon: '👊', mp: 0, cd: 0, tgt: 'enemy', dmg: 1, desc: '平平无奇的一击。' },
  guard: { name: '防御', icon: '🛡️', mp: 0, cd: 0, tgt: 'self', self: [{ k: 'guard', t: 1, v: 0.5 }], mpBack: 0.1, desc: '本回合受到伤害减半，回复 10% 符力。' },
  mn_charge: { name: '莽牛冲撞', icon: '🐂', cls: 'mangniu', lv: 1, mp: 8, cd: 2, tgt: 'enemy', dmg: 1.45, st: [{ k: 'stun', t: 1, p: 0.45 }], desc: '低头猛撞，1.45 倍伤害，45% 几率击晕 1 回合。' },
  mn_gold: { name: '金身', icon: '✨', cls: 'mangniu', lv: 3, mp: 10, cd: 3, tgt: 'self', self: [{ k: 'def', t: 2, v: 0.6 }, { k: 'taunt', t: 2 }], desc: '骨文覆体，2 回合内防御 +60% 并嘲讽敌人。' },
  mn_roar: { name: '蛮荒战吼', icon: '📣', cls: 'mangniu', lv: 6, mp: 14, cd: 3, tgt: 'enemies', dmg: 0.6, allyBuff: [{ k: 'atk', t: 3, v: 0.25 }], desc: '对全体敌人 0.6 倍伤害，全队攻击 +25%，持续 3 回合。' },
  mn_rage: { name: '莽牛撼山', icon: '⛰️', cls: 'mangniu', lv: 12, mp: 22, cd: 4, tgt: 'enemy', dmg: 2.7, lowHpBonus: 1, desc: '2.7 倍伤害，自身血越少伤害越高（最多再 +100%）。' },
  kp_wing: { name: '鲲鹏翼斩', icon: '🪶', cls: 'kunpeng', lv: 1, mp: 7, cd: 1, tgt: 'enemy', dmg: 1.7, hits: 2, desc: '双翼连斩两次，共 1.7 倍伤害。' },
  kp_rend: { name: '撕裂', icon: '🩸', cls: 'kunpeng', lv: 3, mp: 10, cd: 2, tgt: 'enemy', dmg: 1.0, st: [{ k: 'bleed', t: 3, v: 0.35, p: 1 }], desc: '1 倍伤害并流血 3 回合（每回合 0.35 倍攻击）。' },
  kp_swift: { name: '极速', icon: '💨', cls: 'kunpeng', lv: 6, mp: 12, cd: 4, tgt: 'self', self: [{ k: 'dodge', t: 2, v: 0.45 }, { k: 'sure', t: 2 }], desc: '2 回合内闪避 +45%，攻击必定暴击。' },
  kp_storm: { name: '扶摇九万里', icon: '🌪️', cls: 'kunpeng', lv: 12, mp: 24, cd: 4, tgt: 'enemies', dmg: 1.55, desc: '卷起风暴，对全体敌人 1.55 倍伤害。' },
  ls_whip: { name: '柳枝抽', icon: '🌿', cls: 'liushen', lv: 1, mp: 5, cd: 0, tgt: 'enemy', dmg: 1.25, mag: 1, desc: '1.25 倍伤害，无视一半防御。' },
  ls_heal: { name: '回春', icon: '💚', cls: 'liushen', lv: 2, mp: 12, cd: 1, tgt: 'ally', heal: 1.8, healPct: 0.1, desc: '为一名队友回复 1.8 倍攻击 + 10% 最大气血。' },
  ls_ward: { name: '柳荫庇护', icon: '🍃', cls: 'liushen', lv: 5, mp: 16, cd: 3, tgt: 'allies', shield: 1.25, desc: '全队获得 1.25 倍攻击的护盾，持续 3 回合。' },
  ls_rune: { name: '符文天雷', icon: '⚡', cls: 'liushen', lv: 12, mp: 24, cd: 3, tgt: 'enemies', dmg: 1.35, mag: 1, st: [{ k: 'stun', t: 1, p: 0.25 }], desc: '全体 1.35 倍伤害（无视一半防御），25% 击晕。' },
  sk_thunder: { name: '雷鸟宝术', icon: '🌩️', story: 1, mp: 18, cd: 3, tgt: 'enemies', dmg: 1.3, mag: 1, st: [{ k: 'stun', t: 1, p: 0.2 }], desc: '从雷鸟宝骨中悟出：雷光四射，全体 1.3 倍伤害，20% 击晕。' },
  sk_suanni: { name: '狻猊吞火', icon: '🦁', story: 1, mp: 20, cd: 4, tgt: 'enemy', dmg: 2.2, st: [{ k: 'burn', t: 3, v: 0.3, p: 1 }], desc: '狻猊之火：2.2 倍伤害并灼烧 3 回合。' },
};
const STATUS = { stun: { n: '眩晕', c: '#ffd34a' }, bleed: { n: '流血', c: '#ff6a6a' }, burn: { n: '灼烧', c: '#ff8a3a' }, poison: { n: '中毒', c: '#9ad84a' }, def: { n: '金身', c: '#ffd28a' }, taunt: { n: '嘲讽', c: '#ffb36a' }, atk: { n: '战意', c: '#ff9a6a' }, dodge: { n: '极速', c: '#9ad8ff' }, sure: { n: '必暴', c: '#ffe46a' }, shield: { n: '护盾', c: '#9ae8b0' }, guard: { n: '防御', c: '#c8c0b0' }, weak: { n: '虚弱', c: '#b0a0ff' }, charge: { n: '蓄力', c: '#ff5a5a' } };

/* ---------- items ---------- */
const ITEMS = {
  herb: { name: '止血草', type: 'use', icon: '🌱', price: 12, heal: 0.3, desc: '嚼碎敷上，回复 30% 气血。' },
  pill: { name: '回气丹', type: 'use', icon: '💊', price: 18, mpHeal: 0.4, desc: '回复 40% 符力。' },
  elixir: { name: '大还丹', type: 'use', icon: '🔮', price: 60, heal: 0.75, desc: '回复 75% 气血。' },
  milk: { name: '兽奶', type: 'use', icon: '🥛', price: 6, heal: 0.15, desc: '石村特产，喝一口回复 15% 气血。小不点最爱。' },
  meat: { name: '烤兽肉', type: 'use', icon: '🍖', price: 10, heal: 0.25, mpHeal: 0.1, desc: '回复 25% 气血和 10% 符力。' },
  scroll: { name: '回城符', type: 'use', icon: '📜', price: 30, recall: 1, desc: '战斗外使用，回到最近的城镇。' },
  stone: { name: '强化石', type: 'mat', icon: '💎', price: 25, desc: '强化装备的材料。' },
  protect: { name: '保护符', type: 'mat', icon: '🧧', price: 160, desc: '强化失败时不掉级。' },
  jinghua: { name: '天地精华', type: 'key', icon: '🌟', price: 0, desc: '突破洞天境所需。' },
  baoxue: { name: '太古宝血', type: 'key', icon: '🩸', price: 0, desc: '突破化灵境所需。' },
  mingwen: { name: '铭纹残篇', type: 'key', icon: '📿', price: 0, desc: '突破铭纹境所需（下一卷开放）。' },
  wolfpelt: { name: '狼皮', type: 'mat', icon: '🐺', price: 8, desc: '完整的灰狼皮，可以卖钱。' },
  fang: { name: '兽牙', type: 'mat', icon: '🦷', price: 6, desc: '尖利的兽牙。' },
  bullhorn: { name: '莽牛角', type: 'mat', icon: '🐂', price: 16, desc: '乌黑发亮的牛角。' },
  bone: { name: '兽骨', type: 'mat', icon: '🦴', price: 10, desc: '残留着淡淡符文的兽骨。' },
  feather: { name: '青鳞羽', type: 'mat', icon: '🪶', price: 30, desc: '青鳞鹰的羽毛，边缘泛着金属光泽。' },
  venom: { name: '毒囊', type: 'mat', icon: '🧪', price: 14, desc: '碧鳞蝎的毒囊，药铺收。' },
  ore: { name: '赤铜矿', type: 'mat', icon: '🪨', price: 15, desc: '炼器用的矿石。' },
  lingyao: { name: '灵药', type: 'mat', icon: '🌿', price: 22, desc: '山中长了十几年的灵药，药香扑鼻。' },
  thunderbone: { name: '雷鸟骨', type: 'mat', icon: '⚡', price: 45, desc: '雷鸟的骨头，摸上去会麻手。' },
  soulshard: { name: '魂晶', type: 'mat', icon: '💠', price: 50, desc: '百断山魂兵死后留下的晶体。' },
  ancientscale: { name: '太古鳞片', type: 'mat', icon: '🐉', price: 80, desc: '太古凶兽的鳞片，坚不可摧。' },
  letter: { name: '族长的信', type: 'key', icon: '✉️', price: 0, desc: '石云峰写给边城旧友的信。' },
  token: { name: '补天阁引荐令', type: 'key', icon: '🎫', price: 0, desc: '凭此令可参加补天阁入门试炼。' },
  egg: { name: '青鳞鹰蛋', type: 'key', icon: '🥚', price: 0, desc: '还带着体温的鹰蛋。' },
  gift: { name: '新手礼包', type: 'use', icon: '🎁', price: 0, box: [['herb', 5], ['pill', 3], ['scroll', 2], ['stone', 5]], desc: '打开获得：止血草×5、回气丹×3、回城符×2、强化石×5。' },
  box1: { name: '签到宝箱', type: 'use', icon: '📦', price: 0, box: [['herb', 3], ['pill', 2], ['stone', 3]], gold: 60, desc: '打开获得一些补给和银两。' },
  box2: { name: '首领宝箱', type: 'use', icon: '🎁', price: 0, box: [['elixir', 2], ['stone', 6]], equip: 2, gold: 200, desc: '世界首领的战利品，必出上品以上装备。' },
};

/* ---------- equipment: base × rarity × enhancement, plus random affixes ---------- */
const EQ_SLOTS = { weapon: '兵器', armor: '护甲', acc: '饰品' };
const EQ_BASES = [
  // weapon: atk   armor: def + hp   acc: hp + crit
  { id: 'w1', slot: 'weapon', name: '骨矛', lv: 1, atk: 5 }, { id: 'w2', slot: 'weapon', name: '青铜刀', lv: 5, atk: 12 }, { id: 'w3', slot: 'weapon', name: '赤铜战戟', lv: 10, atk: 22 },
  { id: 'w4', slot: 'weapon', name: '玄铁重剑', lv: 15, atk: 34 }, { id: 'w5', slot: 'weapon', name: '雷纹宝刃', lv: 20, atk: 48 }, { id: 'w6', slot: 'weapon', name: '补天剑', lv: 25, atk: 64 },
  { id: 'a1', slot: 'armor', name: '兽皮衣', lv: 1, def: 3, hp: 20 }, { id: 'a2', slot: 'armor', name: '莽牛皮甲', lv: 5, def: 7, hp: 50 }, { id: 'a3', slot: 'armor', name: '青鳞甲', lv: 10, def: 12, hp: 95 },
  { id: 'a4', slot: 'armor', name: '玄铁甲', lv: 15, def: 18, hp: 150 }, { id: 'a5', slot: 'armor', name: '雷纹法衣', lv: 20, def: 25, hp: 220 }, { id: 'a6', slot: 'armor', name: '补天道袍', lv: 25, def: 33, hp: 300 },
  { id: 'c1', slot: 'acc', name: '骨坠', lv: 1, hp: 15, crit: 0.01 }, { id: 'c2', slot: 'acc', name: '兽牙链', lv: 5, hp: 35, crit: 0.02 }, { id: 'c3', slot: 'acc', name: '青鳞羽饰', lv: 10, hp: 65, crit: 0.03 },
  { id: 'c4', slot: 'acc', name: '灵玉佩', lv: 15, hp: 100, crit: 0.04 }, { id: 'c5', slot: 'acc', name: '雷纹玉', lv: 20, hp: 145, crit: 0.05 }, { id: 'c6', slot: 'acc', name: '补天令', lv: 25, hp: 200, crit: 0.06 },
];
const EQB = Object.fromEntries(EQ_BASES.map(b => [b.id, b]));
const AFFIX = [
  { k: 'atkP', n: '攻击', f: v => '+' + Math.round(v * 100) + '%', r: [0.03, 0.08] }, { k: 'defP', n: '防御', f: v => '+' + Math.round(v * 100) + '%', r: [0.04, 0.1] },
  { k: 'hpP', n: '气血', f: v => '+' + Math.round(v * 100) + '%', r: [0.04, 0.1] }, { k: 'crit', n: '暴击', f: v => '+' + (v * 100).toFixed(1) + '%', r: [0.015, 0.045] },
  { k: 'spd', n: '身法', f: v => '+' + Math.round(v), r: [1, 4] }, { k: 'mpP', n: '符力', f: v => '+' + Math.round(v * 100) + '%', r: [0.06, 0.14] },
  { k: 'leech', n: '吸血', f: v => '+' + Math.round(v * 100) + '%', r: [0.03, 0.07] }];
const AFX = Object.fromEntries(AFFIX.map(a => [a.k, a]));
function rollRarity(bonus = 0) { const w = BAL.rarityW.map((x, i) => x * (i ? 1 + bonus * i : 1)); let s = w.reduce((a, b) => a + b), r = Math.random() * s; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return 0; }
function makeEquip(baseId, rar, plus = 0) {
  const b = EQB[baseId]; const af = []; const pool = shuffle(AFFIX.slice());
  for (let i = 0; i < rar && i < pool.length; i++) { const a = pool[i]; let v = rnd(a.r[0], a.r[1]) * (1 + b.lv / 30); if (a.k === 'spd') v = Math.round(v); af.push([a.k, +v.toFixed(3)]); }
  return { u: uid(), b: baseId, r: rar, p: plus, af };
}
function rollEquip(lv, bonus = 0, minRar = 0) { // a random drop suited to level lv
  const cands = EQ_BASES.filter(b => b.lv <= lv + 1 && b.lv >= lv - 9); const b = pick(cands.length ? cands : EQ_BASES.slice(0, 3));
  return makeEquip(b.id, Math.max(minRar, rollRarity(bonus)));
}
function eqStats(e) { // stats an equipment piece adds
  const b = EQB[e.b], m = BAL.rarity[e.r].m * (1 + e.p * BAL.enhPer), s = { atk: 0, def: 0, hp: 0, crit: 0, spd: 0, atkP: 0, defP: 0, hpP: 0, mpP: 0, leech: 0 };
  if (b.atk) s.atk = Math.round(b.atk * m); if (b.def) s.def = Math.round(b.def * m); if (b.hp) s.hp = Math.round(b.hp * m); if (b.crit) s.crit = b.crit * BAL.rarity[e.r].m;
  for (const [k, v] of e.af) s[k] += v; return s;
}
const eqName = e => (e.p ? '+' + e.p + ' ' : '') + EQB[e.b].name;
const eqPrice = e => Math.round((8 + EQB[e.b].lv * 6) * (1 + e.r * e.r * 0.8) * (1 + e.p * 0.3));
const eqPower = e => { const s = eqStats(e); return Math.round(s.atk * 4 + s.def * 4 + s.hp * 0.4 + s.crit * 900 + s.spd * 12 + (s.atkP + s.defP + s.hpP) * 600 + s.mpP * 200 + s.leech * 800); };

/* ---------- monsters ----------
   mul: multipliers on BAL.enemy(lv).  sk: enemy moves; charge = telegraphed a round ahead  */
const MOBS = {
  dummy: { name: '木人桩', lv: 1, mul: { hp: 0.9, atk: 0.35, def: 0.5 }, sk: [{ n: '晃了晃', dmg: 0.6, w: 1 }], loot: [], desc: '练武场上被打得坑坑洼洼的木人。' },
  boar: { name: '獠牙野猪', lv: 1, mul: { hp: 1, atk: 0.9 }, sk: [{ n: '拱撞', dmg: 1, w: 3 }, { n: '獠牙挑刺', dmg: 1.5, w: 1, charge: 1 }], loot: [['meat', 0.5], ['fang', 0.4]] },
  wolf: { name: '山狼', lv: 2, mul: { hp: 0.9, atk: 1.05, spd: 1.2 }, sk: [{ n: '撕咬', dmg: 1, w: 3 }, { n: '嚎叫', buff: { k: 'atk', t: 2, v: 0.3 }, w: 1 }, { n: '猛扑', dmg: 1.7, w: 1, charge: 1 }], loot: [['wolfpelt', 0.55], ['fang', 0.4]] },
  monkey: { name: '石猴', lv: 3, mul: { hp: 0.85, atk: 1, spd: 1.4 }, sk: [{ n: '抓挠', dmg: 0.9, w: 3 }, { n: '扔石头', dmg: 1.1, w: 2, aoe: 1 }], loot: [['lingyao', 0.2], ['herb', 0.3]] },
  snake: { name: '青鳞蛇', lv: 3, mul: { hp: 0.8, atk: 1 }, sk: [{ n: '毒牙', dmg: 0.9, st: { k: 'poison', t: 3, v: 0.25, p: 0.6 }, w: 3 }], loot: [['venom', 0.4]] },
  calf: { name: '莽牛犊', lv: 3, mul: { hp: 1.1, atk: 0.8 }, sk: [{ n: '顶撞', dmg: 1, w: 1 }], loot: [['meat', 0.6]] },
  bull: { name: '莽牛', lv: 4, mul: { hp: 1.6, atk: 1.05, def: 1.3, spd: 0.8 }, sk: [{ n: '踩踏', dmg: 1, w: 3 }, { n: '冲锋', dmg: 1.9, st: { k: 'stun', t: 1, p: 0.3 }, w: 1, charge: 1 }], loot: [['bullhorn', 0.5], ['meat', 0.7]] },
  hawk: { name: '赤羽隼', lv: 4, mul: { hp: 0.8, atk: 1.15, spd: 1.6 }, sk: [{ n: '俯冲', dmg: 1.2, w: 3 }], loot: [['feather', 0.08], ['fang', 0.3]] },
  stoneape: { name: '石猿', lv: 5, mul: { hp: 1.3, atk: 1.05, def: 1.4 }, sk: [{ n: '巨拳', dmg: 1.1, w: 3 }, { n: '捶胸', buff: { k: 'def', t: 2, v: 0.5 }, w: 1 }], loot: [['ore', 0.4], ['bone', 0.3]] },
  scorpion: { name: '碧鳞蝎', lv: 5, mul: { hp: 0.95, atk: 1.05 }, sk: [{ n: '尾针', dmg: 1, st: { k: 'poison', t: 3, v: 0.3, p: 0.7 }, w: 3 }], loot: [['venom', 0.5]] },
  wolfking: { name: '狼王·银背', lv: 6, boss: 1, mul: { hp: 3.6, atk: 1.2, def: 1.2, spd: 1.2 }, sk: [{ n: '撕咬', dmg: 1.1, w: 3 }, { n: '狼嚎', summon: 'wolf', w: 1, max: 2 }, { n: '月下扑杀', dmg: 2.2, w: 1, charge: 1 }], loot: [['wolfpelt', 1], ['bone', 1], ['stone', 0.8]], equip: [1, 0.6] },
  leopard: { name: '赤豹', lv: 6, mul: { hp: 1, atk: 1.15, spd: 1.5 }, sk: [{ n: '利爪', dmg: 1, st: { k: 'bleed', t: 2, v: 0.25, p: 0.4 }, w: 3 }], loot: [['fang', 0.6], ['bone', 0.2]] },
  python: { name: '巨蟒', lv: 7, mul: { hp: 1.6, atk: 1 }, sk: [{ n: '缠绕', dmg: 0.8, st: { k: 'stun', t: 1, p: 0.35 }, w: 2 }, { n: '吞噬', dmg: 1.5, w: 1, charge: 1 }], loot: [['venom', 0.5], ['bone', 0.3]] },
  bear: { name: '黑熊', lv: 7, mul: { hp: 1.8, atk: 1.1, def: 1.2, spd: 0.8 }, sk: [{ n: '熊掌', dmg: 1.15, w: 3 }, { n: '人立而起', dmg: 2, w: 1, charge: 1 }], loot: [['meat', 0.8], ['bone', 0.4]] },
  beihunter: { name: '狈村猎手', lv: 8, mul: { hp: 1.1, atk: 1.15 }, sk: [{ n: '骨箭', dmg: 1.1, w: 3 }, { n: '淬毒箭', dmg: 0.9, st: { k: 'poison', t: 3, v: 0.3, p: 0.8 }, w: 1 }], loot: [['bone', 0.4], ['herb', 0.3]] },
  beishaman: { name: '狈村巫祝', lv: 8, mul: { hp: 0.95, atk: 1 }, sk: [{ n: '骨咒', dmg: 1, mag: 1, w: 2 }, { n: '血祭', healAlly: 0.25, w: 1 }], loot: [['lingyao', 0.3], ['bone', 0.4]] },
  beichief: { name: '狈村头领·狈烈', lv: 9, boss: 1, mul: { hp: 4.4, atk: 1.25, def: 1.3 }, sk: [{ n: '狼牙棒', dmg: 1.15, w: 3 }, { n: '横扫', dmg: 0.85, aoe: 1, w: 2 }, { n: '狈祖附体', buff: { k: 'atk', t: 3, v: 0.4 }, w: 1 }, { n: '碎骨重击', dmg: 2.3, w: 1, charge: 1 }], loot: [['bone', 1], ['stone', 1]], equip: [1, 1] },
  crow: { name: '食腐黑鸦', lv: 8, mul: { hp: 0.8, atk: 1.1, spd: 1.6 }, sk: [{ n: '啄眼', dmg: 1, st: { k: 'weak', t: 2, v: 0.25, p: 0.3 }, w: 3 }], loot: [['feather', 0.05]] },
  eagle: { name: '青鳞鹰', lv: 9, boss: 1, mul: { hp: 3.8, atk: 1.25, spd: 1.8, def: 1.1 }, sk: [{ n: '铁爪', dmg: 1.15, w: 3 }, { n: '羽刃风暴', dmg: 0.8, aoe: 1, w: 2 }, { n: '高空俯冲', dmg: 2.4, w: 1, charge: 1 }], loot: [['feather', 1], ['feather', 0.6]], equip: [1, 0.8] },
  frog: { name: '雷蛙', lv: 10, mul: { hp: 1.1, atk: 1.05 }, sk: [{ n: '电舌', dmg: 1, mag: 1, w: 3 }, { n: '鼓腹雷鸣', dmg: 0.7, aoe: 1, mag: 1, w: 1 }], loot: [['thunderbone', 0.15], ['lingyao', 0.2]] },
  lizard: { name: '泽蜥', lv: 11, mul: { hp: 1.4, atk: 1.1, def: 1.4 }, sk: [{ n: '尾鞭', dmg: 1.1, w: 3 }, { n: '泥沼', dmg: 0.6, st: { k: 'weak', t: 2, v: 0.25, p: 0.7 }, w: 1 }], loot: [['bone', 0.4], ['ore', 0.3]] },
  thunderbird: { name: '雷鸟', lv: 12, boss: 1, mul: { hp: 4.6, atk: 1.3, def: 1.2, spd: 1.5 }, sk: [{ n: '雷喙', dmg: 1.15, mag: 1, w: 3 }, { n: '雷暴', dmg: 0.9, aoe: 1, mag: 1, st: { k: 'stun', t: 1, p: 0.2 }, w: 2 }, { n: '九天落雷', dmg: 2.5, mag: 1, w: 1, charge: 1 }], loot: [['thunderbone', 1], ['stone', 1]], equip: [1, 1] },
  bandit: { name: '山匪', lv: 11, mul: { hp: 1.1, atk: 1.1 }, sk: [{ n: '砍刀', dmg: 1.05, w: 3 }, { n: '撒石灰', dmg: 0.5, st: { k: 'weak', t: 2, v: 0.3, p: 0.8 }, w: 1 }], loot: [['herb', 0.4]], gold: 2 },
  banditboss: { name: '匪首·独眼狼', lv: 13, boss: 1, mul: { hp: 4, atk: 1.25, def: 1.2 }, sk: [{ n: '鬼头刀', dmg: 1.15, w: 3 }, { n: '旋风斩', dmg: 0.9, aoe: 1, w: 2 }, { n: '断头一刀', dmg: 2.4, w: 1, charge: 1 }], loot: [['stone', 1], ['elixir', 0.6]], equip: [1, 1], gold: 4 },
  shade: { name: '虚影', lv: 12, mul: { hp: 1.8, atk: 1.15, def: 1.1, spd: 1.1 }, sk: [{ n: '虚空一击', dmg: 1.1, w: 3 }, { n: '宝术残影', dmg: 1.7, w: 1, charge: 1 }], loot: [] },
  puppet: { name: '试炼傀儡', lv: 14, mul: { hp: 1.6, atk: 1.05, def: 1.5 }, sk: [{ n: '铜拳', dmg: 1, w: 3 }, { n: '符文轰击', dmg: 1.3, mag: 1, w: 1 }], loot: [['ore', 0.5]] },
  disciple: { name: '外门弟子', lv: 15, mul: { hp: 2.2, atk: 1.15, def: 1.1, spd: 1.1 }, sk: [{ n: '剑气', dmg: 1.1, w: 3 }, { n: '宝术', dmg: 1.6, w: 1, charge: 1 }], loot: [] },
  ghoul: { name: '断山魂兵', lv: 16, mul: { hp: 1.2, atk: 1.1 }, sk: [{ n: '锈戈', dmg: 1.05, w: 3 }, { n: '魂啸', dmg: 0.6, aoe: 1, st: { k: 'weak', t: 2, v: 0.2, p: 0.5 }, w: 1 }], loot: [['soulshard', 0.3]] },
  firelion: { name: '火狮', lv: 17, mul: { hp: 1.4, atk: 1.2, spd: 1.2 }, sk: [{ n: '火爪', dmg: 1.1, st: { k: 'burn', t: 2, v: 0.3, p: 0.5 }, w: 3 }, { n: '烈焰吐息', dmg: 0.9, aoe: 1, w: 1 }], loot: [['bone', 0.5], ['soulshard', 0.2]] },
  rockbeast: { name: '古岩兽', lv: 18, mul: { hp: 2, atk: 1.1, def: 1.8, spd: 0.7 }, sk: [{ n: '岩拳', dmg: 1.15, w: 3 }, { n: '石化', dmg: 0.5, st: { k: 'stun', t: 1, p: 0.5 }, w: 1 }], loot: [['ore', 0.8], ['soulshard', 0.2]] },
  ancient: { name: '太古残魂', lv: 20, boss: 1, mul: { hp: 5.2, atk: 1.3, def: 1.3, spd: 1.2 }, sk: [{ n: '魂刃', dmg: 1.15, mag: 1, w: 3 }, { n: '百断魂潮', dmg: 0.95, aoe: 1, mag: 1, w: 2 }, { n: '召唤魂兵', summon: 'ghoul', w: 1, max: 2 }, { n: '断山一击', dmg: 2.6, w: 1, charge: 1 }], loot: [['soulshard', 1], ['baoxue', 0.35], ['stone', 1]], equip: [1, 1, 0.4] },
  wraith: { name: '游荡魂影', lv: 21, mul: { hp: 1.2, atk: 1.15, spd: 1.3 }, sk: [{ n: '冥爪', dmg: 1, mag: 1, w: 3 }, { n: '吸魂', dmg: 0.9, leech: 0.5, w: 1 }], loot: [['soulshard', 0.4]] },
  ancientbeast: { name: '太古凶兽', lv: 22, mul: { hp: 2.2, atk: 1.2, def: 1.4 }, sk: [{ n: '撕咬', dmg: 1.15, w: 3 }, { n: '凶威', dmg: 0.5, aoe: 1, st: { k: 'weak', t: 2, v: 0.25, p: 0.6 }, w: 1 }, { n: '暴怒', dmg: 2.1, w: 1, charge: 1 }], loot: [['ancientscale', 0.5], ['bone', 0.5]] },
  jiao: { name: '蛟', lv: 24, mul: { hp: 3, atk: 1.25, def: 1.3, spd: 1.2 }, sk: [{ n: '蛟尾', dmg: 1.15, w: 3 }, { n: '翻江', dmg: 1, aoe: 1, w: 2 }], loot: [['ancientscale', 1], ['baoxue', 0.15]], equip: [0.6] },
  // world bosses (level set when they spawn)
  wb_suanni: { name: '狻猊幼崽', boss: 1, world: 1, mul: { hp: 22, atk: 1.3, def: 1.4 }, sk: [{ n: '狻猊爪', dmg: 1.1, w: 3 }, { n: '吞火', dmg: 0.9, aoe: 1, st: { k: 'burn', t: 2, v: 0.3, p: 0.6 }, w: 2 }, { n: '金焰焚天', dmg: 2.2, aoe: 1, w: 1, charge: 1 }] },
  wb_bull: { name: '太古莽牛王', boss: 1, world: 1, mul: { hp: 26, atk: 1.25, def: 1.6 }, sk: [{ n: '践踏', dmg: 0.9, aoe: 1, w: 3 }, { n: '撼地冲锋', dmg: 2.3, w: 1, charge: 1 }] },
  wb_bird: { name: '五色雷雀', boss: 1, world: 1, mul: { hp: 20, atk: 1.35, def: 1.2, spd: 1.6 }, sk: [{ n: '五色雷光', dmg: 1, aoe: 1, mag: 1, w: 3 }, { n: '雷池', dmg: 2.1, aoe: 1, mag: 1, w: 1, charge: 1 }] },
};
const WORLD_BOSSES = [{ id: 'wb_suanni', loc: 'mn_slope' }, { id: 'wb_bull', loc: 'fl_path' }, { id: 'wb_bird', loc: 'th_marsh' }];
