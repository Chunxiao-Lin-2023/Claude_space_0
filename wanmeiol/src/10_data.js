/* ================= data: balance, the hero (石昊), 宝术, 功法, pets, items, beasts =================
   Names of people, places, beasts, 宝术 and treasures follow the novel; all prose is original. */
const BAL = {
  expNext: lv => Math.round(16 * Math.pow(lv, 1.7) + 14),
  realms: [ // crossing 9→10 needs 极境 (story); 19→20 needs the story's last step
    { name: '搬血境', from: 1, to: 9 }, { name: '洞天境', from: 10, to: 19 }, { name: '化灵境', from: 20, to: 24 }, { name: '铭纹境', from: 25, to: 29 }, { name: '列阵境', from: 30, to: 34 }],
  lvCap: 34, // 24→25 needs the end of 第二卷, 29→30 needs 石皇 (第三卷)
  defK: 40,
  critMul: 1.7,
  enemy: lv => ({ hp: 26 + lv * 20, atk: 5 + lv * 2.7, def: 2 + lv * 1.9, spd: 8 + lv * 0.35, exp: 9 + Math.round(lv * 6.5 + lv * lv * 0.35) }),
  flee: 0.65,
  deathExpLoss: 0.12,
  mpRegen: 0.07,
  dayLen: 16, duskAt: 11,   // in-game time: actions move the clock (探索 1, 走一步 ¼, 歇脚 1, 秘境 2); from 11 it is night; past 16 a new day dawns
  arenaTries: 5,
  // later levels need many more fights per story step; these two shorten the grind (approved: suggestion 14)
  expMul: lv => lv >= 10 ? 1 + (lv - 9) * 0.06 : 1,   // ×1.06 at 10 … ×1.54 at 18
  storyExp: 2,                                        // story fights give double exp
  phaseAtk: 0.25,                                     // a boss at half health gets angry: +25% attack
  weakMul: 1.5,                                       // hitting a weakness
  // enemies get tougher as you climb (2026-11): unchanged up to 11 层, gently at first, reaching 气血 ×1.6 / 攻击 ×1.25 at 18 层 — the same stretch where 宝术 / 宝骨 slots and partner moves open up
  foeRamp: lv => Math.pow(clamp((lv - 11) / 7, 0, 1), 1.5), foeHp: lv => 1 + 0.6 * BAL.foeRamp(lv) + 0.03 * Math.max(0, lv - 20), foeAtk: lv => 1 + 0.25 * BAL.foeRamp(lv) + 0.01 * Math.max(0, lv - 20), // 第二、三卷: a little more past 20
};
/* slots grow with the realm: 宝术 you can take into battle, 宝骨 you can wear */
const barSlots = lv => 4 + (lv >= 10) + (lv >= 14) + (lv >= 18) + (lv >= 22) + (lv >= 27) + (lv >= 32);
const relicSlots = lv => 2 + (lv >= 12) + (lv >= 17) + (lv >= 24) + (lv >= 30);
/* 宝术熟练度: uses → 小成 / 大成 */
const PROF = [{ n: '', s: '', at: 0, b: 0 }, { n: '入门', s: '入', at: 12, b: 0.04 }, { n: '小成', s: '小', at: 30, b: 0.1 }, { n: '精通', s: '精', at: 60, b: 0.15 }, { n: '大成', s: '大', at: 100, b: 0.2 }, { n: '圆满', s: '圆', at: 160, b: 0.26 }]; // 圆满 opens 宝术合成
/* elements: a few beasts take more from one kind of attack */
const EL = { lei: { n: '雷', i: '⚡' }, fire: { n: '火', i: '🔥' }, blunt: { n: '钝击', i: '🪨' }, bone: { n: '骨文', i: '📿' } };
const realmOf = lv => BAL.realms.find(r => lv >= r.from && lv <= r.to) || BAL.realms[0];
const HERO = { name: '石昊', nick: '小不点', base: { hp: 130, mp: 40, atk: 13, def: 5, spd: 11, crit: 0.1 }, grow: { hp: 24, mp: 5, atk: 3.1, def: 1.6, spd: 0.3, crit: 0.002 } };

/* ---------- 宝术 (active) ----------  got: story flag that teaches it */
const SKILLS = {
  atk: { name: '拳脚', icon: '👊', mp: 0, cd: 0, tgt: 'enemy', dmg: 1, desc: '小拳头砸过去。别看他小，力气大得吓人。' },
  guard: { name: '防御', icon: '🛡️', mp: 0, cd: 0, tgt: 'self', self: [{ k: 'guard', t: 1, v: 0.5 }], mpBack: 0.12, desc: '本回合受到伤害减半，回复 12% 符力。' },
  qly: { name: '青鳞鹰宝术', icon: '🦅', got: 'sk_qly', mp: 8, cd: 1, tgt: 'enemy', dmg: 1.8, hits: 2, st: [{ k: 'bleed', t: 2, v: 0.25, p: 0.5 }], desc: '鹰爪符文覆在手上，连抓两下，共 1.8 倍伤害，可能流血。' },
  sn: { name: '狻猊宝术', icon: '🦁', got: 'sk_sn', mp: 14, cd: 3, tgt: 'enemy', dmg: 2.3, st: [{ k: 'stun', t: 1, p: 0.35 }], desc: '狻猊之力灌满全身，一击 2.3 倍伤害，35% 击晕。' },
  gw: { name: '骨文·缚', icon: '📿', got: 'sk_gw', mp: 10, cd: 3, tgt: 'enemies', dmg: 0.5, mag: 1, el: 'bone', st: [{ k: 'weak', t: 2, v: 0.25, p: 0.8 }], desc: '以骨文结成锁链，全体 0.5 倍伤害，让他们虚弱（攻击 -25%）；被锁住的敌人，下一次挨的拳脚、爪击伤害 +30%。残魂最怕它。' },
  lei: { name: '雷道', icon: '⚡', got: 'sk_lei', mp: 20, cd: 3, tgt: 'enemies', dmg: 1.4, mag: 1, el: 'lei', st: [{ k: 'stun', t: 1, p: 0.22 }], desc: '在补天阁悟出的雷道法则：雷光四射，全体 1.4 倍伤害，无视一半防御；劈在被打晕的敌人身上 ×1.25。雨族怕雷。' },
  dsh: { name: '打神石', icon: '🪨', got: 'sk_dsh', mp: 16, cd: 4, tgt: 'enemy', dmg: 2.6, pierce: 1, el: 'blunt', desc: '从百断山捡来的怪石，砸出去完全无视防御，2.6 倍伤害。专砸硬壳。' },
  jian: { name: '锈剑', icon: '🗡️', got: 'sk_jian', mp: 18, cd: 3, tgt: 'enemy', dmg: 2.1, mag: 1, st: [{ k: 'bleed', t: 3, v: 0.4, p: 1 }], desc: '诡爷那柄生锈的古剑，剑意犹在：2.1 倍伤害并重创流血；砍在已经流血的敌人身上 ×1.35。' },
  zhuque: { name: '朱雀宝术', icon: '🔥', got: 'sk_zhuque', mp: 24, cd: 3, tgt: 'enemies', dmg: 1.6, mag: 1, el: 'fire', st: [{ k: 'burn', t: 3, v: 0.35, p: 0.8 }], desc: '朱雀真羽在涅槃池里认了主：火羽漫天，全体 1.6 倍伤害，大概率灼烧三回合。' },
  zhizun: { name: '至尊神光', icon: '🌟', got: 'sk_zhizun', mp: 30, cd: 4, tgt: 'enemy', dmg: 3.4, mag: 1, pierce: 1, self: [{ k: 'shield', t: 2, v: 0.6 }], desc: '重生的至尊骨放出的神光：3.4 倍伤害，无视防御，自己得到一层护盾。' },
  lunhui: { name: '轮回', icon: '☯️', got: 'sk_lunhui', mp: 40, cd: 5, tgt: 'enemies', dmg: 2.6, mag: 1, pierce: 1, st: [{ k: 'stun', t: 1, p: 0.5 }], desc: '死过一回才看见的东西：全体 2.6 倍伤害，无视防御，一半概率眩晕。连神也挡不住。' },
  ta: { name: '小塔', icon: '🗼', got: 'sk_ta', mp: 22, cd: 5, tgt: 'allies', shield: 1.6, desc: '那座只有四层的小塔垂下光幕，全队获得 1.6 倍攻击的护盾。' },
};
const SKILL_ORDER = ['qly', 'sn', 'gw', 'lei', 'dsh', 'jian', 'ta', 'zhuque', 'zhizun', 'lunhui'];
const STATUS = { burst: { n: '绝境', c: '#ffe08a' }, stun: { n: '眩晕', c: '#ffd34a' }, bleed: { n: '流血', c: '#ff6a6a' }, burn: { n: '灼烧', c: '#ff8a3a' }, poison: { n: '中毒', c: '#9ad84a' }, def: { n: '坚守', c: '#ffd28a' }, taunt: { n: '嘲讽', c: '#ffb36a' }, atk: { n: '凶性', c: '#ff9a6a' }, dodge: { n: '灵动', c: '#9ad8ff' }, sure: { n: '必暴', c: '#ffe46a' }, shield: { n: '护盾', c: '#9ae8b0' }, guard: { n: '防御', c: '#c8c0b0' }, weak: { n: '虚弱', c: '#b0a0ff' }, bound: { n: '锁链', c: '#d8b070' }, brk: { n: '破甲', c: '#e0a070' }, mark: { n: '印记', c: '#c08aff' }, freeze: { n: '冰封', c: '#9ad8ff' }, rage: { n: '狂怒', c: '#ff4a2a' } };

/* ---------- 功法 / 修炼所得 (passive) ---------- */
const GONGFA = {
  yingxia: { name: '迎霞锻体', icon: '🌅', desc: '每天清晨迎着朝霞吐纳锻体。气血 +8%。', b: { hpP: 0.08 } },
  guwen: { name: '骨文', icon: '📜', desc: '跟族长学认宝骨上的符文。符力 +15%，宝术更好使。', b: { mpP: 0.15 } },
  niepan: { name: '涅槃', icon: '🔥', desc: '在火国祖地的涅槃池里死过一回又活过来。气血 +12%，每回合回复 2% 气血。', b: { hpP: 0.12, regen: 0.02 } },
  zhizungu: { name: '至尊骨', icon: '🦴', desc: '被挖走的至尊骨重新长了回来，在和石毅的血战里长成。攻击 +10%，暴击 +5%。', b: { atkP: 0.1, crit: 0.05 } },
  renhuang: { name: '人皇印', icon: '🔱', desc: '石国的气运落在你身上。气血、攻击、防御各 +8%。', b: { hpP: 0.08, atkP: 0.08, defP: 0.08 } },
  lingshen: { name: '四道灵身', icon: '👥', desc: '一身化四，各领一军。攻击 +8%，身法 +4。', b: { atkP: 0.08, spd: 4 } },
  xixue: { name: '双头火犀宝血', icon: '🔥', desc: '炼化了双头火犀的宝血精华。攻击 +6%。', b: { atkP: 0.06 } },
  yaoding: { name: '药鼎洗礼', icon: '🏺', desc: '泡在族长熬的大药鼎里，脱胎换骨。气血 +6%，防御 +6%。', b: { hpP: 0.06, defP: 0.06 } },
  jijing: { name: '搬血极境', icon: '🌋', desc: '把搬血境走到了尽头。全属性 +8%。', b: { hpP: 0.08, atkP: 0.08, defP: 0.08, mpP: 0.08 } },
  taiyi: { name: '太一真水', icon: '💧', desc: '饮下一滴太一真水。防御 +10%，符力 +10%。', b: { defP: 0.1, mpP: 0.1 } },
  bulao: { name: '不老泉', icon: '⛲', desc: '在不老泉里泡过。气血 +10%，每回合额外回复 2% 气血。', b: { hpP: 0.1, regen: 0.02 } },
  xiantao: { name: '花果山仙桃', icon: '🍑', desc: '吃了一个神猴王的桃子。攻击 +6%，暴击 +4%。', b: { atkP: 0.06, crit: 0.04 } },
};
// 洞天: each level from 10 to 18 opens one; the player picks one of two
const DONGTIAN = [
  { k: 'li', n: '力之洞天', d: '攻击 +5%', b: { atkP: 0.05 } }, { k: 'ti', n: '体之洞天', d: '气血 +7%', b: { hpP: 0.07 } }, { k: 'ling', n: '灵之洞天', d: '符力 +12%', b: { mpP: 0.12 } },
  { k: 'shou', n: '守之洞天', d: '防御 +7%', b: { defP: 0.07 } }, { k: 'su', n: '速之洞天', d: '身法 +2', b: { spd: 2 } }, { k: 'feng', n: '锋之洞天', d: '暴击 +3%', b: { crit: 0.03 } }];

/* ---------- pets (from the novel) ----------  stats are multiples of 石昊's at the same level */
/* each 灵兽伙伴 has four kinds of move — 攻击 / 增益 (on 石昊) / 减益 (on enemies) / 防守 — unlocked with affection (亲近);
   most of them set 石昊 up: 破甲 and 印记 make his 宝术 land harder, 战吼 and 加持 boost him, 嘲讽 draws the hits away from him */
const PET_CAT = { atk: { n: '攻击', c: '#e07a5a' }, buff: { n: '增益', c: '#d4ad62' }, debuff: { n: '减益', c: '#a08ae0' }, def: { n: '防守', c: '#6fbf7a' } };
const PETS = {
  maoqiu: { name: '毛球', race: '朱厌幼崽', role: '近战 · 破甲', icon: '🐒', desc: '在旧村废墟里捡到的金毛小猴，伤好了以后赖着不走。它其实是争夺山宝的四大至尊之一——朱厌。', mul: { hp: 0.8, atk: 0.8, def: 0.85, spd: 1.15 },
    sk: [{ n: '金爪', cat: 'atk', dmg: 1.15, w: 3, d: '一爪子挠过去。' },
      { n: '挡在身前', cat: 'def', taunt: 2, guard: 1, w: 1, d: '跳到石昊前面龇牙，两回合内敌人都冲它来，这回合它受伤减半。' },
      { n: '朱厌战吼', cat: 'buff', buffHero: { k: 'atk', t: 2, v: 0.25 }, w: 1, aff: 25, d: '一声吼，石昊两回合内攻击 +25%。' },
      { n: '撼地', cat: 'debuff', dmg: 0.5, aoe: 1, el: 'blunt', st: { k: 'brk', t: 2, v: 0.35, p: 1 }, w: 1, aff: 50, d: '砸地面震翻全体，破甲：防御 -35%，石昊的宝术打得更痛。' },
      { n: '撼山', cat: 'atk', dmg: 2.3, el: 'blunt', w: 1, aff: 75, d: '抡起一块大石头砸下去，单体重击。' },
      { n: '朱厌之怒', cat: 'atk', dmg: 1.3, aoe: 1, st: { k: 'weak', t: 2, v: 0.2, p: 0.7 }, w: 2, evo: 1, d: '觉醒后：金毛炸起，全体重击并虚弱。' }] },
  dahong: { name: '大红', race: '大红鸟', role: '群攻 · 护身', icon: '🐦', desc: '百断山里一只脾气暴躁的大红鸟。你想吃它，它想啄你，打了好几架以后，它认了你当老大。', mul: { hp: 0.7, atk: 0.8, def: 0.7, spd: 1.4 },
    sk: [{ n: '火羽', cat: 'atk', dmg: 0.7, aoe: 1, el: 'fire', st: { k: 'burn', t: 2, v: 0.25, p: 0.5 }, w: 3, d: '甩出一片火羽，全体伤害，可能灼烧。' },
      { n: '火羽护身', cat: 'def', shieldHero: 1.2, w: 1, d: '把火羽围在石昊身边，给他一层护盾。' },
      { n: '鼓翼', cat: 'buff', buffHero: { k: 'dodge', t: 2, v: 0.25 }, w: 1, aff: 25, d: '在石昊头顶扇风，两回合内他更难被打中（闪避 +25%）。' },
      { n: '灼目', cat: 'debuff', dmg: 0.6, el: 'fire', st: { k: 'weak', t: 2, v: 0.3, p: 1 }, w: 1, aff: 50, d: '一口火喷在敌人脸上，它两回合内攻击 -30%。' },
      { n: '烈焰俯冲', cat: 'atk', dmg: 1.2, aoe: 1, el: 'fire', w: 1, aff: 75, d: '带着火从天上扎下来，全体伤害。' },
      { n: '赤焰风暴', cat: 'atk', dmg: 1.4, aoe: 1, el: 'fire', st: { k: 'burn', t: 3, v: 0.3, p: 0.8 }, w: 2, evo: 1, d: '觉醒后：火焰风暴，全体重伤并灼烧。' }] },
  ertuzi: { name: '二秃子', race: '孔雀一族', role: '控制 · 治疗', icon: '🐣', desc: '百断山捡到的一颗蛋孵出来的小鸟，一根毛都没有。别看它秃，它是孔雀一族。', mul: { hp: 0.6, atk: 0.7, def: 0.65, spd: 1.2 },
    sk: [{ n: '五色神光', cat: 'atk', dmg: 1, mag: 1, st: { k: 'stun', t: 1, p: 0.4 }, w: 3, d: '一道五色光，可能把敌人照晕（晕住的敌人挨石昊、伙伴的打都更痛）。' },
      { n: '五色护体', cat: 'def', healAlly: 0.22, w: 1, d: '给伤得最重的同伴回 22% 气血。' },
      { n: '五色加持', cat: 'buff', buffHero: { k: 'sure', t: 2, v: 0 }, w: 1, aff: 25, d: '五色光落在石昊身上，他的下一击必定暴击。' },
      { n: '摄魂', cat: 'debuff', dmg: 0.3, mag: 1, st: { k: 'mark', t: 3, v: 0.3, p: 1 }, w: 1, aff: 50, d: '在敌人身上留下印记，三回合内石昊打它伤害 +30%。' },
      { n: '五色屏障', cat: 'def', shieldAll: 0.9, w: 1, aff: 75, d: '全队一层护盾。' },
      { n: '五色神光·满', cat: 'atk', dmg: 0.8, mag: 1, aoe: 1, st: { k: 'stun', t: 1, p: 0.3 }, w: 2, evo: 1, d: '觉醒后：全体五色神光，可能照晕。' }] },
};

/* ---------- items ---------- */
const ITEMS = {
  milk: { name: '兽奶', type: 'use', icon: '🥛', heal: 0.2, food: 6, desc: '石村特产。回复 20% 气血。小不点最爱，偷喝的更香。' },
  herb: { name: '止血草', type: 'use', icon: '🌱', heal: 0.3, desc: '嚼碎了敷上。回复 30% 气血。' },
  meat: { name: '凶兽肉', type: 'use', icon: '🍖', heal: 0.25, mp: 0.1, food: 10, desc: '烤得滋滋冒油。回复 25% 气血、10% 符力，灵兽伙伴也爱吃。' },
  lingyao: { name: '灵药', type: 'use', icon: '🌿', mp: 0.45, food: 15, desc: '回复 45% 符力。给灵兽伙伴吃能长不少亲近。' },
  baoyao: { name: '宝药', type: 'use', icon: '🔮', heal: 0.7, mp: 0.3, food: 25, desc: '族长珍藏的宝药。回复 70% 气血、30% 符力。' },
  taiyi: { name: '太一真水', type: 'gf', icon: '💧', gf: 'taiyi', desc: '一滴传说中的真水。饮下后永久提升（功法）。' },
  bulao: { name: '不老泉水', type: 'gf', icon: '⛲', gf: 'bulao', desc: '不老泉的泉水。饮下后永久提升（功法）。' },
  xiantao: { name: '仙桃', type: 'gf', icon: '🍑', gf: 'xiantao', desc: '神猴王守着的桃子。吃下后永久提升（功法）。' },
  peaegg: { name: '奇怪的蛋', type: 'key', icon: '🥚', desc: '百断山里捡的蛋，揣在怀里暖着。好像快孵出来了。' },
  butianshi: { name: '补天石', type: 'key', icon: '💠', desc: '补天阁收徒的信物。' },
  heilian: { name: '黑莲', type: 'key', icon: '🖤', desc: '从虎穴里偷出来的黑色莲花。' },
  bone: { name: '兽骨', type: 'mat', icon: '🦴', food: 4, desc: '带着淡淡符文的兽骨，灵兽伙伴喜欢啃。' },
};

/* ---------- beasts & foes ---------- */
const MOBS = {
  dummy: { name: '石锁', lv: 1, mul: { hp: 0.8, atk: 0.3, def: 0.5 }, sk: [{ n: '纹丝不动', dmg: 0.5, w: 1 }], loot: [], nocodex: 1 },
  boar: { name: '獠牙野猪', lv: 1, mul: { hp: 1, atk: 0.9 }, sk: [{ n: '拱撞', dmg: 1, w: 3 }, { n: '獠牙挑刺', dmg: 1.5, w: 1, charge: 1 }], loot: [['meat', 0.5]], d: '山林里最常见的野兽，獠牙能把小树拱倒。肉很香。' },
  wolf: { name: '山狼', lv: 2, mul: { hp: 0.9, atk: 1.05, spd: 1.2 }, sk: [{ n: '撕咬', dmg: 1, w: 3 }, { n: '嚎叫', buff: { k: 'atk', t: 2, v: 0.3 }, w: 1 }, { n: '猛扑', dmg: 1.7, w: 1, charge: 1 }], loot: [['meat', 0.4], ['bone', 0.3]], d: '成群出没，一头嚎叫，别的就会更凶。' },
  monkey: { name: '石猿', lv: 3, weak: { blunt: 1 }, mul: { hp: 1.1, atk: 1, def: 1.2 }, sk: [{ n: '巨拳', dmg: 1.05, w: 3 }, { n: '扔石头', dmg: 0.8, aoe: 1, w: 1 }], loot: [['herb', 0.3]], d: '住在石林里，皮糙得像石头。拿钝的东西砸它最管用。' },
  snake: { name: '青鳞蛇', lv: 3, mul: { hp: 0.8, atk: 1 }, sk: [{ n: '毒牙', dmg: 0.9, st: { k: 'poison', t: 3, v: 0.25, p: 0.6 }, w: 3 }], loot: [['herb', 0.3]], d: '藏在草里的小蛇，咬一口麻半天。' },
  owl: { name: '夜枭', lv: 3, night: 1, mul: { hp: 0.8, atk: 1.05, spd: 1.6 }, sk: [{ n: '夜啼', dmg: 0.5, st: { k: 'weak', t: 2, v: 0.2, p: 0.7 }, w: 2 }, { n: '无声爪', dmg: 1.1, w: 3 }], loot: [['bone', 0.4]], d: '只在夜里出来的大鸟，飞起来一点声音都没有。' },
  rhino: { name: '双头火犀', lv: 4, boss: 1, weak: { blunt: 1 }, mul: { hp: 3.4, atk: 1.15, def: 1.4, spd: 0.8 }, sk: [{ n: '犀角顶', dmg: 1.1, w: 3 }, { n: '双首喷火', dmg: 0.8, aoe: 1, st: { k: 'burn', t: 2, v: 0.25, p: 0.6 }, w: 2 }, { n: '冲撞', dmg: 2.1, w: 1, charge: 1 }], loot: [['meat', 1], ['meat', 1]], p2: '两个脑袋同时喷出火柱，它被打疼了，眼睛红得发亮！', d: '两个脑袋，一身厚皮。它的宝血能让孩子们壮实一大截。' },
  eagle: { name: '青鳞鹰', lv: 5, boss: 1, mul: { hp: 3.2, atk: 1.25, spd: 1.8, def: 1.1 }, sk: [{ n: '铁爪', dmg: 1.15, w: 3 }, { n: '鳞羽如刀', dmg: 0.8, aoe: 1, w: 2 }, { n: '高空俯冲', dmg: 2.3, w: 1, charge: 1 }], loot: [], p2: '青鳞鹰尖啸一声，浑身鳞羽炸开，速度更快了！', d: '太古魔禽的后代，羽毛比刀还快。它翅膀上的骨文，你看过一眼就忘不掉。' },
  tombguard: { name: '墓中石兽', lv: 5, weak: { blunt: 1 }, mul: { hp: 1.4, atk: 1, def: 1.6, spd: 0.7 }, sk: [{ n: '石爪', dmg: 1.05, w: 3 }], loot: [['bone', 0.5]], d: '狻猊墓里守门的石兽，刀砍上去只冒火星。' },
  tombbat: { name: '墓穴蝠群', lv: 5, weak: { fire: 1 }, mul: { hp: 0.7, atk: 0.95, spd: 1.6 }, sk: [{ n: '吸血', dmg: 0.9, leech: 0.5, w: 3 }], loot: [], d: '一大群挤在一起的蝙蝠，见了火就乱。' },
  suanni: { name: '狻猊残魂', lv: 6, boss: 1, weak: { bone: 1 }, mul: { hp: 3.8, atk: 1.25, def: 1.3 }, sk: [{ n: '狻猊爪', dmg: 1.1, w: 3 }, { n: '狻猊吼', dmg: 0.7, aoe: 1, st: { k: 'stun', t: 1, p: 0.25 }, w: 2 }, { n: '吞天一口', dmg: 2.3, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '狻猊残魂发出一声震动墓穴的长吼，干枯的身体里重新燃起了凶光！', d: '死了不知多少年，魂还守着自己的骨头。它在等一个配得上它宝术的人。' },
  beihunter: { name: '狈村猎手', lv: 6, mul: { hp: 1.1, atk: 1.1 }, sk: [{ n: '骨箭', dmg: 1.05, w: 3 }, { n: '淬毒箭', dmg: 0.85, st: { k: 'poison', t: 3, v: 0.3, p: 0.8 }, w: 1 }], loot: [['herb', 0.3], ['bone', 0.3]], d: '狈村的人，箭上喜欢抹毒。' },
  fengbei: { name: '风狈', lv: 7, boss: 1, mul: { hp: 3.4, atk: 1.25, def: 1.1, spd: 1.5 }, sk: [{ n: '风刃', dmg: 1.1, mag: 1, w: 3 }, { n: '卷地狂风', dmg: 0.8, aoe: 1, w: 2 }, { n: '狈祖附体', buff: { k: 'atk', t: 3, v: 0.25 }, w: 1 }], loot: [['baoyao', 0.6]], p2: '风狈咬破舌尖，喷出一口血雾——狈祖图腾在他背后亮了起来！', d: '狈村这一代最出挑的少年，脸上涂着狈祖图腾。' },
  lielao: { name: '狈村·烈老', lv: 10, boss: 1, mul: { hp: 5, atk: 1.6, def: 1.6 }, sk: [{ n: '枯骨掌', dmg: 1.3, w: 3 }, { n: '祭灵之力', dmg: 2.4, w: 1, charge: 1 }], loot: [], nocodex: 1 },
  leopard: { name: '赤豹', lv: 7, mul: { hp: 1, atk: 1.15, spd: 1.5 }, sk: [{ n: '利爪', dmg: 1, st: { k: 'bleed', t: 2, v: 0.25, p: 0.4 }, w: 3 }], loot: [['meat', 0.5]], d: '大荒深处跑得最快的东西之一，爪子一划就是一道血口。' },
  python: { name: '巨蟒', lv: 8, mul: { hp: 1.6, atk: 1 }, sk: [{ n: '缠绕', dmg: 0.8, st: { k: 'stun', t: 1, p: 0.3 }, w: 2 }, { n: '吞噬', dmg: 1.5, w: 1, charge: 1 }], loot: [['meat', 0.5]], d: '水桶粗的蟒蛇，被它缠上就动不了。' },
  bear: { name: '黑罴', lv: 8, mul: { hp: 1.8, atk: 1.1, def: 1.2, spd: 0.8 }, sk: [{ n: '熊掌', dmg: 1.15, w: 3 }, { n: '人立而起', dmg: 2, w: 1, charge: 1 }], loot: [['meat', 0.8]], d: '站起来比屋子还高。它一人立，就是要拍下来了。' },
  bandit: { name: '山贼', lv: 9, mul: { hp: 1.1, atk: 1.1 }, sk: [{ n: '砍刀', dmg: 1.05, w: 3 }, { n: '撒石灰', dmg: 0.5, st: { k: 'weak', t: 2, v: 0.3, p: 0.8 }, w: 1 }], loot: [['herb', 0.4], ['meat', 0.3]], d: '在出山古道上劫道的人，打不过就撒石灰。' },
  jiling: { name: '山贼供奉的祭灵', lv: 11, boss: 1, weak: { bone: 1 }, mul: { hp: 4.4, atk: 1.25, def: 1.3 }, sk: [{ n: '阴风', dmg: 1.1, mag: 1, w: 3 }, { n: '鬼火', dmg: 0.8, aoe: 1, st: { k: 'burn', t: 2, v: 0.3, p: 0.6 }, w: 2 }, { n: '吞魂', dmg: 2.3, mag: 1, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '祭灵扭曲着膨胀开来，阴风里全是凄厉的哭声！', d: '山贼从骨牌里放出来的东西，没有身子，只有一团阴风。' },
  tiger: { name: '黑纹虎', lv: 11, mul: { hp: 1.5, atk: 1.2, spd: 1.2 }, sk: [{ n: '虎扑', dmg: 1.15, w: 3 }, { n: '虎啸', dmg: 0.6, aoe: 1, st: { k: 'weak', t: 2, v: 0.2, p: 0.5 }, w: 1 }], loot: [['meat', 0.7]], d: '补天阁外的老虎，睡觉打呼噜，耳朵却灵得很。' },
  ape: { name: '雷猿', lv: 12, mul: { hp: 1.3, atk: 1.1, def: 1.2 }, sk: [{ n: '雷拳', dmg: 1.05, mag: 1, w: 3 }], loot: [['lingyao', 0.3]], d: '拳头上带电的猿猴。雷池里的幻影，就是照着它们的样子显化的。' },
  puppet: { name: '护阁傀儡', lv: 12, weak: { blunt: 1 }, mul: { hp: 1.6, atk: 1, def: 1.6 }, sk: [{ n: '铜拳', dmg: 1, w: 3 }, { n: '阵纹轰击', dmg: 1.3, mag: 1, w: 1 }], loot: [], d: '补天阁用阵纹驱动的铜人，不知疼，只怕砸。' },
  senior: { name: '补天阁师兄', lv: 12, mul: { hp: 1.2, atk: 1.05, def: 1.1 }, sk: [{ n: '开山掌', dmg: 1.05, w: 3 }, { n: '定身符', dmg: 0.4, st: { k: 'stun', t: 1, p: 0.35 }, w: 1 }], loot: [], d: '早入门几年的师兄。有的真心教你，有的只想要你的灵药份例。' },
  wisp: { name: '游魂鬼火', lv: 14, night: 1, weak: { bone: 1 }, mul: { hp: 1, atk: 1.15, spd: 1.4 }, sk: [{ n: '鬼火', dmg: 1, mag: 1, st: { k: 'burn', t: 2, v: 0.25, p: 0.5 }, w: 3 }], loot: [['lingyao', 0.3]], d: '夜里在断山之间飘的幽火，是死在这里的人和兽留下的。骨文能把它们锁住。' },
  lion: { name: '黄金九头狮', lv: 14, boss: 1, mul: { hp: 5, atk: 1.3, def: 1.4 }, sk: [{ n: '九首噬咬', dmg: 0.55, aoe: 1, w: 3 }, { n: '金焰', dmg: 1.15, st: { k: 'burn', t: 2, v: 0.3, p: 0.6 }, w: 2 }, { n: '狮王怒', dmg: 2.4, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '九个脑袋同时咆哮，金色的鬃毛燃起了火焰！', d: '九个脑袋，每个都比你整个人大。它住的洞里堆满了金色的碎骨。' },
  yuzu: { name: '雨族战士', lv: 14, weak: { lei: 1 }, mul: { hp: 1.3, atk: 1.15 }, sk: [{ n: '冰矛', dmg: 1.05, w: 3 }, { n: '寒气', dmg: 0.6, st: { k: 'freeze', t: 1, p: 0.3 }, w: 1 }], loot: [['herb', 0.4]], d: '披着冰甲的雨族人。冰甲遇雷就裂。' },
  bigwolf: { name: '雨族巨狼', lv: 14, weak: { lei: 1 }, mul: { hp: 1.4, atk: 1.15, spd: 1.3 }, sk: [{ n: '撕咬', dmg: 1.1, w: 3 }, { n: '冰息', dmg: 0.7, aoe: 1, w: 1 }], loot: [['meat', 0.6]], d: '雨族养的白狼，比马还大，呼出来的气都是冷的。' },
  lingyi: { name: '灵族遗种', lv: 13, boss: 1, mul: { hp: 3.8, atk: 1.2, def: 1.2, spd: 1.3 }, sk: [{ n: '灵光刺', dmg: 1.15, mag: 1, w: 3 }, { n: '太古灵压', dmg: 0.7, aoe: 1, st: { k: 'weak', t: 2, v: 0.2, p: 0.5 }, w: 2 }, { n: '祖灵显化', dmg: 2.2, w: 1, charge: 1 }], loot: [['baoyao', 0.6]], p2: '灵族少年身后的灵光凝成了一张古老的脸！', d: '太古灵族的后代，身后浮着一圈灵光。天生傲气，看谁都像看仆人。' },
  cavewolf: { name: '窟狼', lv: 14, mul: { hp: 1.2, atk: 1.2, spd: 1.4 }, sk: [{ n: '撕咬', dmg: 1.1, st: { k: 'bleed', t: 2, v: 0.25, p: 0.4 }, w: 3 }, { n: '狼嚎', buff: { k: 'atk', t: 2, v: 0.2 }, w: 1 }], loot: [['meat', 0.6]], d: '神窟深处的狼，眼睛是绿的，从来不单独出现。' },
  fengyin: { name: '雨族封印者', lv: 16, boss: 1, weak: { lei: 1 }, mul: { hp: 4.6, atk: 1.35, def: 1.3 }, sk: [{ n: '寒魄指', dmg: 1.25, w: 3 }, { n: '冰河倒卷', dmg: 0.85, aoe: 1, st: { k: 'freeze', t: 1, p: 0.35 }, w: 2 }, { n: '解封', dmg: 2.5, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '封印者撕开了身上的符——真正的境界漏了出来！', d: '把境界压在门槛下面混进百断山的雨族老人，长着一张少年的脸。' },
  yuchief: { name: '雨族高手', lv: 15, boss: 1, weak: { lei: 1 }, mul: { hp: 4.4, atk: 1.3, def: 1.3 }, sk: [{ n: '冰封千里', dmg: 0.8, aoe: 1, st: { k: 'freeze', t: 1, p: 0.35 }, w: 2 }, { n: '寒冰掌', dmg: 1.2, w: 3 }, { n: '冰狱', dmg: 2.3, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '雨族高手捏碎一枚冰符，周身寒气暴涨！', d: '雨族这次进百断山领头的人，心眼和冰一样硬。' },
  dahongbird: { name: '大红鸟', lv: 14, boss: 1, mul: { hp: 3.4, atk: 1.2, spd: 1.6 }, sk: [{ n: '啄击', dmg: 1.1, w: 3 }, { n: '火羽', dmg: 0.8, aoe: 1, w: 2 }], loot: [], p2: '大红鸟气得浑身羽毛倒竖，火星子噼里啪啦往下掉！', d: '一只脾气比个头还大的红毛鸟。抢过你的烤肉。' },
  scorpion: { name: '沙漠毒蝎', lv: 15, weak: { blunt: 1 }, mul: { hp: 1.3, atk: 1.15, def: 1.4 }, sk: [{ n: '尾针', dmg: 1, st: { k: 'poison', t: 3, v: 0.3, p: 0.7 }, w: 3 }], loot: [['herb', 0.4]], d: '断山荒漠里的大蝎子，壳硬，一砸就碎。' },
  whitetiger: { name: '白虎', lv: 16, boss: 1, mul: { hp: 4.4, atk: 1.35, def: 1.3, spd: 1.3 }, sk: [{ n: '白虎爪', dmg: 1.15, w: 3 }, { n: '杀伐之气', dmg: 0.85, aoe: 1, w: 2 }, { n: '虎啸山林', dmg: 2.4, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '白虎仰天长啸，杀伐之气凝成了实质！', d: '守在不老泉边的白虎，一身杀气。' },
  jinpeng: { name: '半血金鹏', lv: 17, boss: 1, mul: { hp: 4.8, atk: 1.4, def: 1.2, spd: 1.8 }, sk: [{ n: '金翅斩', dmg: 1.15, w: 3 }, { n: '金羽暴雨', dmg: 0.9, aoe: 1, w: 2 }, { n: '扶摇而上', dmg: 2.5, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '金鹏半边身子的金光大盛，那是它体内的真血在燃烧！', d: '半边身子泛着金光的大鹏，据说身上流着上古金鹏的血。' },
  bonewraith: { name: '天骨残魂', lv: 17, weak: { bone: 1 }, mul: { hp: 1.3, atk: 1.2, spd: 1.2 }, sk: [{ n: '骨刺', dmg: 1.05, mag: 1, w: 3 }], loot: [['bone', 0.6]], d: '从骨缝里飘出来的残魂，记不得自己是谁。' },
  boneking: { name: '天骨巨兽残魂', lv: 17, boss: 1, weak: { bone: 1 }, mul: { hp: 4.6, atk: 1.3, def: 1.4 }, sk: [{ n: '骨爪', dmg: 1.15, w: 3 }, { n: '骨刺林', dmg: 0.85, aoe: 1, w: 2 }, { n: '天骨镇压', dmg: 2.4, mag: 1, w: 1, charge: 1 }], loot: [['baoyao', 1], ['bone', 1]], p2: '骨架上的符文一起亮了起来，残魂发出一声不属于这个时代的怒吼！', d: '一副山一样大的骨架里残留的魂，还记得自己活着时有多凶。' },
  pumo: { name: '蒲魔树', lv: 18, boss: 1, weak: { fire: 1 }, mul: { hp: 5, atk: 1.3, def: 1.5, spd: 0.8 }, sk: [{ n: '藤鞭', dmg: 1.1, w: 3 }, { n: '迷幻种子', dmg: 0.6, aoe: 1, st: { k: 'weak', t: 2, v: 0.3, p: 0.7 }, w: 2 }, { n: '吞噬', dmg: 2.2, leech: 0.5, w: 1, charge: 1 }], loot: [], p2: '蒲魔树的树皮裂开，露出一张张扭曲的脸，花粉像雪一样落下！', d: '花果山上会吃人的树，花粉让人看见最想见的人。怕火。根是甜的。' },
  monkeyking: { name: '神猴王', lv: 22, boss: 1, mul: { hp: 9, atk: 1.6, def: 1.8, spd: 1.4 }, sk: [{ n: '以山为锤', dmg: 1.3, aoe: 1, w: 3 }, { n: '灵湖阵', dmg: 0.6, aoe: 1, st: { k: 'stun', t: 1, p: 0.4 }, w: 1 }], loot: [], p2: '神猴王把半座山扛上了肩，灵湖翻涌！', d: '花果山的主人，拿山当锤子。你偷了它的桃。' },
  leishou: { name: '雷池古兽', lv: 20, boss: 1, weak: { blunt: 1 }, mul: { hp: 5.5, atk: 1.35, def: 1.5, spd: 1.1 }, sk: [{ n: '雷鳞', dmg: 1.1, mag: 1, w: 3 }, { n: '紫雷落地', dmg: 0.9, aoe: 1, mag: 1, st: { k: 'stun', t: 1, p: 0.25 }, w: 2 }, { n: '万雷归一', dmg: 2.5, mag: 1, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '雷池古兽仰天一吼，整片雷池的电光都朝它涌了过去！', d: '压在雷池底下的上古雷兽，鳞甲比铜傀儡还硬。补天阁的雷池，就是借它的雷养出来的。' },
  peach: { name: '护桃灵猴', lv: 17, mul: { hp: 1.2, atk: 1.15, spd: 1.5 }, sk: [{ n: '抓挠', dmg: 1, w: 3 }], loot: [['herb', 0.3]], d: '花果山的猴子，见了生人就扑，专挠脸。' },
  // roaming 凶兽首领 (level set when they appear)
  r_rhino: { name: '独角兕', boss: 1, roam: 1, weak: { blunt: 1 }, mul: { hp: 6, atk: 1.25, def: 1.6, spd: 0.8 }, sk: [{ n: '践踏', dmg: 0.9, aoe: 1, w: 3 }, { n: '撼地冲锋', dmg: 2.3, w: 1, charge: 1 }], loot: [['baoyao', 1], ['meat', 1]], p2: '独角兕的独角开始发光，脚下的地面寸寸龟裂！', d: '到处游荡的凶兽首领，一身甲壳刀枪不入，只怕重砸。' },
  r_snake: { name: '赤鳞巨蟒', boss: 1, roam: 1, mul: { hp: 5.5, atk: 1.3, def: 1.3 }, sk: [{ n: '毒雾', dmg: 0.7, aoe: 1, st: { k: 'poison', t: 3, v: 0.3, p: 0.7 }, w: 2 }, { n: '绞杀', dmg: 1.2, w: 3 }, { n: '吞噬', dmg: 2.3, w: 1, charge: 1 }], loot: [['baoyao', 1], ['lingyao', 1]], p2: '赤鳞巨蟒蜕下一层旧皮，鳞片红得像烧透的铁！', d: '到处游荡的凶兽首领，喷出来的雾能毒倒一片林子。' },
  r_bird: { name: '雷翅雕', boss: 1, roam: 1, mul: { hp: 5, atk: 1.35, def: 1.2, spd: 1.6 }, sk: [{ n: '雷翅', dmg: 1, aoe: 1, mag: 1, w: 3 }, { n: '雷池', dmg: 2.1, aoe: 1, mag: 1, w: 1, charge: 1 }], loot: [['baoyao', 1], ['lingyao', 1]], p2: '雷翅雕双翅一振，乌云在它头顶聚成了雷池！', d: '到处游荡的凶兽首领，翅膀扇一下就是一道雷。' },
  tiebei: { name: '铁背狼', lv: 20, mul: { hp: 1.25, atk: 1.15, def: 1.3, spd: 1.3 }, sk: [{ n: '铁背撞', dmg: 1.1, w: 3 }, { n: '群嚎', buff: { k: 'atk', t: 2, v: 0.2 }, w: 1 }], loot: [['meat', 0.6], ['bone', 0.4]], d: '石国皇都外的狼，背上的毛硬得像铁片。' },
  jinyuan: { name: '金眼猿', lv: 21, weak: { blunt: 1 }, mul: { hp: 1.4, atk: 1.2 }, sk: [{ n: '金眼', dmg: 0.9, st: { k: 'weak', t: 2, v: 0.2, p: 0.5 }, w: 2 }, { n: '捶地', dmg: 1.15, w: 3 }], loot: [['lingyao', 0.3]], d: '眼睛是金色的大猿，看你一眼，你就浑身发软。皮厚，得砸。' },
  qingjiao: { name: '青蛟', lv: 22, weak: { lei: 1 }, mul: { hp: 1.5, atk: 1.25, def: 1.2 }, sk: [{ n: '蛟尾', dmg: 1.15, w: 3 }, { n: '吐雾', dmg: 0.7, aoe: 1, st: { k: 'poison', t: 2, v: 0.3, p: 0.5 }, w: 1 }], loot: [['baoyao', 0.15], ['bone', 0.5]], d: '护城河外的老蛟，身上的鳞片是青的。怕雷。' },
  yinbing: { name: '夜巡阴兵', lv: 21, nocodex: 0, weak: { bone: 1 }, mul: { hp: 1.2, atk: 1.2, def: 1.1 }, sk: [{ n: '阴戟', dmg: 1.1, mag: 1, w: 3 }], loot: [['lingyao', 0.3]], d: '夜里在皇都城墙外巡逻的阴兵，据说是石国历代战死的兵。骨文锁得住它们。' },
  xiaozhu: { name: '小金蛛', lv: 21, mul: { hp: 0.9, atk: 1.1, spd: 1.4 }, sk: [{ n: '吐丝', dmg: 0.6, st: { k: 'bound', t: 1, p: 0.4 }, w: 2 }, { n: '咬', dmg: 1.05, w: 3 }], loot: [['bone', 0.4]], d: '蛛巢里的小蛛，个头已经比狗大。' },
  duzhu: { name: '毒蛛', lv: 22, mul: { hp: 1.2, atk: 1.2 }, sk: [{ n: '毒牙', dmg: 1, st: { k: 'poison', t: 3, v: 0.35, p: 0.7 }, w: 3 }], loot: [['herb', 0.5]], d: '背上长着花纹的毒蛛，咬一口半边身子发麻。' },
  jinzhu: { name: '大金蛛', lv: 23, boss: 1, mul: { hp: 4.6, atk: 1.3, def: 1.4 }, sk: [{ n: '金丝网', dmg: 0.6, aoe: 1, st: { k: 'bound', t: 1, p: 0.45 }, w: 2 }, { n: '金刚蛛腿', dmg: 1.25, w: 3 }, { n: '毒雾', dmg: 2.3, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '大金蛛八条腿同时立起来，背上的金纹亮得刺眼！', d: '太古魔蛛的孙子，八条腿金光闪闪。听说蛛腿烤着吃，是脆的。' },
  yuwangling: { name: '雨王府统领', lv: 21, boss: 1, weak: { lei: 1 }, mul: { hp: 4.2, atk: 1.3, def: 1.3 }, sk: [{ n: '冰戟', dmg: 1.2, w: 3 }, { n: '雨幕', dmg: 0.8, aoe: 1, st: { k: 'freeze', t: 1, p: 0.3 }, w: 2 }, { n: '雨神诀', dmg: 2.3, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '统领祭出一卷雨神法旨，满院子下起了冰雨！', d: '雨王府看门的头领，说话比冰还冷。' },
  shiziteng: { name: '石子腾', lv: 22, boss: 1, mul: { hp: 5.2, atk: 1.35, def: 1.4, spd: 1.2 }, sk: [{ n: '战戟横扫', dmg: 0.85, aoe: 1, w: 2 }, { n: '武王拳', dmg: 1.3, w: 3 }, { n: '天戟破', dmg: 2.5, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '石子腾把战戟往地上一插，武王府的阵纹全亮了！', d: '武王府的人，石毅的父亲。手里一杆战戟，脸上没有一点愧色。' },
  mozhu: { name: '太古魔蛛', lv: 25, boss: 1, mul: { hp: 3.0, atk: 1.0, def: 1.4 }, sk: [{ n: '噬魂丝', dmg: 0.8, aoe: 1, st: { k: 'bound', t: 1, p: 0.5 }, w: 2 }, { n: '魔蛛毒', dmg: 1.25, st: { k: 'poison', t: 3, v: 0.4, p: 0.8 }, w: 3 }, { n: '尊者威压', dmg: 2.6, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '太古魔蛛放开了尊者的威压——整座校军场的地面都在往下陷！', d: '太古神山来的老魔蛛，尊者。大金蛛的爷爷，护短护得出了名。' },
  qingluan: { name: '青鸾尊者', lv: 25, boss: 1, mul: { hp: 2.8, atk: 1.05, def: 1.3, spd: 1.4 }, sk: [{ n: '青羽刃', dmg: 1.2, hits: 2, w: 3 }, { n: '鸾鸣', dmg: 0.9, aoe: 1, st: { k: 'stun', t: 1, p: 0.25 }, w: 2 }, { n: '青鸾焚天', dmg: 2.5, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '青鸾尊者现出了本相——一只青色的神鸟，翅膀遮住了半个校军场！', d: '太古神山的纯血青鸾，尊者。看人从来只用眼角。' },
  huolang: { name: '火狼', lv: 24, weak: { blunt: 1 }, mul: { hp: 1.3, atk: 1.25, spd: 1.3 }, sk: [{ n: '火牙', dmg: 1.1, st: { k: 'burn', t: 2, v: 0.25, p: 0.4 }, w: 3 }], loot: [['meat', 0.6]], d: '火国边关的狼，毛是烧着的。' },
  rongjia: { name: '熔甲龟', lv: 25, weak: { blunt: 1 }, mul: { hp: 1.8, atk: 1.1, def: 1.8, spd: 0.6 }, sk: [{ n: '熔岩喷', dmg: 0.8, aoe: 1, st: { k: 'burn', t: 2, v: 0.3, p: 0.5 }, w: 2 }, { n: '缩壳', buff: { k: 'def', t: 2, v: 0.4 }, w: 1 }], loot: [['bone', 0.6]], d: '背着一层熔岩做的壳。刀砍不动，得砸。' },
  yanque: { name: '炎雀', lv: 25, mul: { hp: 1.1, atk: 1.3, spd: 1.6 }, sk: [{ n: '炎翎', dmg: 1.05, hits: 2, w: 3 }], loot: [['lingyao', 0.3]], d: '火山口飞来飞去的小雀，一身火，脾气比个头大。' },
  rongwang: { name: '熔岩龟王', lv: 26, boss: 1, weak: { blunt: 1 }, mul: { hp: 6, atk: 1.3, def: 1.8, spd: 0.6 }, sk: [{ n: '地火喷涌', dmg: 0.9, aoe: 1, st: { k: 'burn', t: 2, v: 0.35, p: 0.6 }, w: 2 }, { n: '龟甲撞', dmg: 1.3, w: 3 }, { n: '熔岩海', dmg: 2.4, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '龟王背上的熔岩壳裂开了，地火从缝里喷了出来！', d: '熔岩地宫最深处的老龟，壳上能煮饭。' },
  yuwai: { name: '域外大教强者', lv: 29, mul: { hp: 2.2, atk: 1.25, def: 1.3 }, sk: [{ n: '域外神通', dmg: 1.2, mag: 1, w: 3 }, { n: '镇压', dmg: 0.8, aoe: 1, st: { k: 'weak', t: 2, v: 0.2, p: 0.5 }, w: 1 }], loot: [['baoyao', 0.4]], d: '从石国之外来的大教中人，说是来“帮”石国，其实是来管石国的。' },
  wanghou: { name: '叛变的王侯', lv: 29, boss: 1, mul: { hp: 7.2, atk: 1.95, def: 1.4 }, sk: [{ n: '王侯印', dmg: 1.25, w: 3 }, { n: '私兵结阵', buff: { k: 'def', t: 2, v: 0.3 }, w: 1 }, { n: '叛王一击', dmg: 2.5, w: 1, charge: 1 }], loot: [['baoyao', 1]], p2: '王侯撕下了脸皮：“石国早该换个主子了！”', d: '石皇一走就投靠了外人的王侯。' },
  shichong: { name: '石崇', lv: 30, boss: 1, mul: { hp: 6.8, atk: 1.85, def: 1.4 }, sk: [{ n: '皇道龙拳', dmg: 1.3, w: 3 }, { n: '龙气护体', buff: { k: 'def', t: 2, v: 0.4 }, w: 1 }, { n: '假龙吟', dmg: 2.6, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '石崇抓起案上的假皇印，硬生生催出一缕龙气！', d: '被外人扶上皇位的傀儡。坐在龙椅上的样子，像借了别人的衣裳。' },
  shenming: { name: '下界的神', lv: 36, boss: 1, nocodex: 1, mul: { hp: 9, atk: 2.2, def: 2.2 }, sk: [{ n: '神火', dmg: 1.6, aoe: 1, w: 3 }, { n: '神威', dmg: 2.6, w: 1, charge: 1 }], p2: '神火铺天盖地——这根本不是能打的东西！', d: '从上面下来的神。' },
  shenming2: { name: '神火境神明', lv: 32, boss: 1, mul: { hp: 5.2, atk: 1.45, def: 1.6 }, sk: [{ n: '神火焚身', dmg: 1, aoe: 1, st: { k: 'burn', t: 2, v: 0.35, p: 0.6 }, w: 2 }, { n: '神明一指', dmg: 1.35, w: 3 }, { n: '天罚', dmg: 2.7, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '神明的神火烧到了极致——祂第一次害怕了！', d: '七神之一，神火境。祂以为自己是来收庄稼的。' },
  butianjiao: { name: '补天教长老', lv: 31, boss: 1, mul: { hp: 6.6, atk: 1.85, def: 1.4 }, sk: [{ n: '补天手', dmg: 1.25, w: 3 }, { n: '血祭阵', dmg: 0.9, aoe: 1, st: { k: 'weak', t: 2, v: 0.25, p: 0.5 }, w: 2 }, { n: '补天印', dmg: 2.6, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '长老咬破手指，在血祭阵上画下了最后一笔！', d: '补天教的人（不是补天阁），想拿石国的血换自己的路。' },
  bulaoshan: { name: '不老山主', lv: 32, boss: 1, mul: { hp: 7.0, atk: 1.85, def: 1.5 }, sk: [{ n: '不老藤', dmg: 0.9, aoe: 1, st: { k: 'bound', t: 1, p: 0.4 }, w: 2 }, { n: '枯荣掌', dmg: 1.3, w: 3 }, { n: '万木同悲', dmg: 2.6, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '不老山主的皮肤一下子枯了下去——他在烧自己的寿元！', d: '活了不知道多少年的老人，最怕的是死。' },
  ningjin: { name: '凝金门主', lv: 33, boss: 1, weak: { lei: 1 }, mul: { hp: 7.4, atk: 2.05, def: 1.6 }, sk: [{ n: '凝金指', dmg: 1.3, pierce: 1, w: 3 }, { n: '金身', buff: { k: 'def', t: 2, v: 0.5 }, w: 1 }, { n: '万金归一', dmg: 2.7, w: 1, charge: 1 }], loot: [['baoyao', 2]], p2: '凝金门主的身子一寸寸变成了金子——刀枪不入！雷能劈开它。', d: '凝金门的门主，一身金子，心也是金子做的——硬，冷。' },
};
for (const m of Object.values(MOBS)) if (m.weak) for (const k in m.weak) m.weak[k] = k === 'fire' && m.boss ? 1.6 : BAL.weakMul;
const ROAMERS = ['r_rhino', 'r_snake', 'r_bird'];
