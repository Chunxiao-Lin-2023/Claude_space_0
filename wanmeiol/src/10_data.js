/* ================= data: balance, the hero (石昊), 宝术, 功法, pets, items, beasts =================
   Names of people, places, beasts, 宝术 and treasures follow the novel; all prose is original. */
const BAL = {
  expNext: lv => Math.round(16 * Math.pow(lv, 1.7) + 14),
  realms: [ // crossing 9→10 needs 极境 (story); 19→20 needs the story's last step
    { name: '搬血境', from: 1, to: 9 }, { name: '洞天境', from: 10, to: 19 }, { name: '化灵境', from: 20, to: 20 }],
  lvCap: 20,
  defK: 40,
  critMul: 1.7,
  enemy: lv => ({ hp: 26 + lv * 20, atk: 5 + lv * 2.7, def: 2 + lv * 1.9, spd: 8 + lv * 0.35, exp: 9 + Math.round(lv * 6.5 + lv * lv * 0.35) }),
  flee: 0.65,
  deathExpLoss: 0.12,
  mpRegen: 0.07,
  bossEvery: 20,  // minutes between roaming 凶兽首领 (wall clock)
  bossOpen: 8,
  arenaTries: 5,
  // later levels need many more fights per story step; these two shorten the grind (approved: suggestion 14)
  expMul: lv => lv >= 10 ? 1 + (lv - 9) * 0.06 : 1,   // ×1.06 at 10 … ×1.54 at 18
  storyExp: 2,                                        // story fights give double exp
  phaseAtk: 0.25,                                     // a boss at half health gets angry: +25% attack
  weakMul: 1.5,                                       // hitting a weakness
};
/* 宝术熟练度: uses → 小成 / 大成 */
const PROF = [{ n: '', s: '', at: 0, b: 0 }, { n: '小成', s: '小', at: 30, b: 0.1 }, { n: '大成', s: '大', at: 100, b: 0.2 }];
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
  ta: { name: '小塔', icon: '🗼', got: 'sk_ta', mp: 22, cd: 5, tgt: 'allies', shield: 1.6, desc: '那座只有四层的小塔垂下光幕，全队获得 1.6 倍攻击的护盾。' },
};
const SKILL_ORDER = ['qly', 'sn', 'gw', 'lei', 'dsh', 'jian', 'ta'];
const STATUS = { stun: { n: '眩晕', c: '#ffd34a' }, bleed: { n: '流血', c: '#ff6a6a' }, burn: { n: '灼烧', c: '#ff8a3a' }, poison: { n: '中毒', c: '#9ad84a' }, def: { n: '坚守', c: '#ffd28a' }, taunt: { n: '嘲讽', c: '#ffb36a' }, atk: { n: '凶性', c: '#ff9a6a' }, dodge: { n: '灵动', c: '#9ad8ff' }, sure: { n: '必暴', c: '#ffe46a' }, shield: { n: '护盾', c: '#9ae8b0' }, guard: { n: '防御', c: '#c8c0b0' }, weak: { n: '虚弱', c: '#b0a0ff' }, bound: { n: '锁链', c: '#d8b070' }, freeze: { n: '冰封', c: '#9ad8ff' }, rage: { n: '狂怒', c: '#ff4a2a' } };

/* ---------- 功法 / 修炼所得 (passive) ---------- */
const GONGFA = {
  yingxia: { name: '迎霞锻体', icon: '🌅', desc: '每天清晨迎着朝霞吐纳锻体。气血 +8%。', b: { hpP: 0.08 } },
  guwen: { name: '骨文', icon: '📜', desc: '跟族长学认宝骨上的符文。符力 +15%，宝术更好使。', b: { mpP: 0.15 } },
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
const PETS = {
  maoqiu: { name: '毛球', race: '朱厌幼崽', role: '输出', icon: '🐒', desc: '在旧村废墟里捡到的金毛小猴，伤好了以后赖着不走。它其实是争夺山宝的四大至尊之一——朱厌。', mul: { hp: 0.75, atk: 0.8, def: 0.8, spd: 1.15 },
    sk: [{ n: '金爪', dmg: 1.15, w: 3 }, { n: '连环爪', dmg: 1.6, w: 2, aff: 40 }, { n: '撼山', dmg: 2.3, el: 'blunt', w: 1, aff: 80 }, { n: '朱厌之怒', dmg: 1.3, aoe: 1, st: { k: 'weak', t: 2, v: 0.2, p: 0.7 }, w: 2, evo: 1 }] },
  dahong: { name: '大红', race: '大红鸟', role: '群攻', icon: '🐦', desc: '百断山里一只脾气暴躁的大红鸟。你想吃它，它想啄你，打了好几架以后，它认了你当老大。', mul: { hp: 0.7, atk: 0.8, def: 0.7, spd: 1.4 },
    sk: [{ n: '啄击', dmg: 0.95, w: 2 }, { n: '火羽', dmg: 0.7, aoe: 1, el: 'fire', st: { k: 'burn', t: 2, v: 0.25, p: 0.5 }, w: 3 }, { n: '烈焰俯冲', dmg: 1.2, aoe: 1, el: 'fire', w: 1, aff: 60 }, { n: '赤焰风暴', dmg: 1.4, aoe: 1, el: 'fire', st: { k: 'burn', t: 3, v: 0.3, p: 0.8 }, w: 2, evo: 1 }] },
  ertuzi: { name: '二秃子', race: '孔雀一族', role: '控制 · 治疗', icon: '🐣', desc: '百断山捡到的一颗蛋孵出来的小鸟，一根毛都没有。别看它秃，它是孔雀一族。', mul: { hp: 0.55, atk: 0.65, def: 0.6, spd: 1.2 },
    sk: [{ n: '啄', dmg: 0.85, w: 2 }, { n: '五色神光', dmg: 1, mag: 1, st: { k: 'stun', t: 1, p: 0.4 }, w: 2 }, { n: '五色护体', healAlly: 0.2, w: 2 }, { n: '五色屏障', shieldAll: 0.9, w: 1, aff: 60 }, { n: '五色神光·满', dmg: 0.8, mag: 1, aoe: 1, st: { k: 'stun', t: 1, p: 0.3 }, w: 2, evo: 1 }] },
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
};
for (const m of Object.values(MOBS)) if (m.weak) for (const k in m.weak) m.weak[k] = k === 'fire' && m.boss ? 1.6 : BAL.weakMul;
const ROAMERS = ['r_rhino', 'r_snake', 'r_bird'];
