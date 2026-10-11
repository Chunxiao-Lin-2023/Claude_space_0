'use strict';
/* =================== constants & balance =================== */
const T = 48, WH = 24, TAU = Math.PI * 2;
const VERSION = 'rw1';
const B = {
  riftHP: 20,
  coopHp: 1.3,          // enemy hp multiplier when 2 players
  coopCount: 1.25,      // enemy count multiplier when 2 players
  waveHp: 0.06,         // +hp per wave index inside a level
  coopGold: 1.25,       // starting gold multiplier when 2 players
  respawn: 6,           // seconds
  respawnInv: 2,
  potionChance: 0.07,
  sellBuild: 1, sellWave: 0.5,
  placeRange: 7.5 * T,
  waveBonus: [180, 40], // base + per wave index
  chaseTime: 3.5, chaseCool: 2.0,
  animFps: 10,
  heroUp: [2, 3, 4],    // skulls per weapon mastery level
  heroUpDmg: 0.15,
  trapUp: [2, 3],       // skulls for trap lv2 / lv3
};
/* =================== heroes =================== */
const HEROES = {
  warmage: {
    name: '战法师', atlas: 'warmage', hp: 220, mp: 100, mpRegen: 9, speed: 190, r: 14,
    desc: '手持连弩的前线法师。震荡冲击能把兽人掀进深渊，火球清理成群敌人。',
    primary: {name: '连弩', rate: 3.3, dmg: 24, speed: 980, kind: 'bolt', life: 0.75},
    alt: {name: '震荡冲击', key: '右键', mp: 22, cd: 0.8, dmg: 18, r: 150, arc: 1.0, push: 560},
    skill: {name: '炎爆火球', key: 'Q', mp: 40, cd: 5, dmg: 120, r: 100, burn: 25},
    dash: {name: '翻滚', key: '空格', cd: 2.4, dist: 170},
  },
  sorc: {
    name: '女术士', atlas: 'sorc', hp: 170, mp: 140, mpRegen: 12, speed: 200, r: 13,
    desc: '操纵奥术与寒冰的施法者。魅惑兽人替你作战，冰霜新星冻结整片敌群。',
    primary: {name: '奥术飞弹', rate: 4, dmg: 17, speed: 720, kind: 'orb', life: 0.9, pierce: 1},
    alt: {name: '魅惑', key: '右键', mp: 35, cd: 1.2, dur: 10},
    skill: {name: '冰霜新星', key: 'Q', mp: 45, cd: 7, dmg: 30, r: 175, freeze: 2.6},
    dash: {name: '闪现', key: '空格', cd: 3, dist: 175},
  },
  paladin: {
    name: '圣骑士', atlas: 'paladin', hp: 300, mp: 100, mpRegen: 8, speed: 178, r: 15, role: '近战坦克',
    desc: '身披板甲的守护者。举盾嘲讽兽人替队友扛伤害，审判之锤震晕一片。',
    passive: '光环：附近队友每秒回复 2% 生命',
    primary: {name: '战锤横扫', rate: 1.7, dmg: 36, kind: 'melee', range: 78, arc: 1.0, push: 140},
    alt: {name: '圣盾', key: '右键', mp: 30, cd: 8, dur: 3, taunt: 240},
    skill: {name: '审判之锤', key: 'Q', mp: 45, cd: 7, dmg: 95, r: 135, stun: 1.6},
    dash: {name: '冲锋', key: '空格', cd: 3, dist: 210, dmg: 22},
  },
  ranger: {
    name: '游侠', atlas: 'ranger', hp: 180, mp: 110, mpRegen: 10, speed: 212, r: 13, role: '陷阱专家',
    desc: '林地猎手，长弓箭矢可穿透多名敌人。猎鹰专抓飞行的地狱蝙蝠。',
    passive: '陷阱专家：自己布置的陷阱便宜 15%，冷却快 20%',
    primary: {name: '长弓', rate: 2.6, dmg: 30, speed: 1100, kind: 'parrow', life: 0.7, pierce: 2},
    alt: {name: '散射', key: '右键', mp: 20, cd: 1.2, n: 5, spread: 0.55, dmg: 22},
    skill: {name: '猎鹰', key: 'Q', mp: 45, cd: 14, dur: 12, dps: 34},
    dash: {name: '后跃', key: '空格', cd: 2.5, dist: 170, back: true},
  },
  alch: {
    name: '炼金术士', atlas: 'alch', hp: 190, mp: 130, mpRegen: 11, speed: 196, r: 13, role: '爆破辅助',
    desc: '背着铜罐的发明家。投掷溅射酸液瓶，布置自动炮塔，药雾给队友回血。',
    passive: '药剂学：拾取药水效果 +50%',
    primary: {name: '酸液瓶', rate: 2.0, dmg: 26, speed: 520, kind: 'flask', r: 58, max: 430},
    alt: {name: '自动炮塔', key: '右键', mp: 40, cd: 4, dur: 20, max: 2, dmg: 13, rate: 3, range: 300},
    skill: {name: '药雾', key: 'Q', mp: 50, cd: 10, dur: 4.5, r: 150, heal: 0.06, dps: 28},
    dash: {name: '烟雾翻滚', key: '空格', cd: 3, dist: 150, slow: 0.5},
  },
  blade: {
    name: '刃舞者', atlas: 'blade', hp: 210, mp: 90, mpRegen: 9, speed: 228, r: 13, role: '高机动近战',
    desc: '双刀刺客，连斩第三击加倍并击退。影步穿过敌群，剑刃风暴绞碎四周。',
    passive: '连斩：每第三击伤害翻倍并击退',
    primary: {name: '双刃连斩', rate: 3.4, dmg: 21, kind: 'melee', range: 68, arc: 0.95, combo: 3},
    alt: {name: '飞刃', key: '右键', mp: 18, cd: 1.4, n: 3, dmg: 30, speed: 900, pierce: 3},
    skill: {name: '剑刃风暴', key: 'Q', mp: 50, cd: 9, dur: 2.6, r: 92, tick: 0.25, dmg: 22},
    dash: {name: '影步', key: '空格', cd: 2, dist: 200, dmg: 32},
  },
};
HEROES.warmage.role = '远程控场'; HEROES.sorc.role = '法术控制';
HEROES.warmage.passive = '连弩命中有轻微击退'; HEROES.sorc.passive = '奥术飞弹会追踪敌人';
/* =================== difficulty =================== */
const DIFF = {
  easy: {name: '简单', hp: 0.75, gold: 1.25, rift: 30, cap: 3, spd: 1},
  normal: {name: '普通', hp: 1, gold: 1, rift: 20, cap: 5, spd: 1},
  nightmare: {name: '噩梦', hp: 1.45, gold: 0.9, rift: 12, cap: 5, spd: 1.1},
};
/* =================== orcs =================== */
const ORCS = {
  grunt:  {name: '兽人步兵', hp: 110, speed: 68,  dmg: 14, atk: 0.6, cd: 1.1, range: 40, r: 15, gold: 20, rift: 1, mass: 1, aggro: 150},
  kobold: {name: '狗头人',   hp: 45,  speed: 128, dmg: 6,  atk: 0.5, cd: 1.0, range: 30, r: 10, gold: 12, rift: 1, mass: 0.6, aggro: 0, sneaky: true},
  archer: {name: '兽人弓手', hp: 80,  speed: 62,  dmg: 12, atk: 0.6, cd: 1.6, range: 300, r: 14, gold: 26, rift: 1, mass: 0.9, aggro: 300, ranged: true},
  ogre:   {name: '食人魔',   hp: 900, speed: 46,  dmg: 45, atk: 0.7, cd: 2.0, range: 62, r: 27, gold: 120, rift: 5, mass: 4, aggro: 130, smash: 3},
  bat:    {name: '地狱蝙蝠', hp: 70,  speed: 96,  dmg: 9,  atk: 0.5, cd: 1.0, range: 36, r: 14, gold: 22, rift: 1, mass: 0.7, aggro: 70, fly: true},
  chief:  {name: '兽人督军', hp: 4200, speed: 52, dmg: 70, atk: 0.7, cd: 2.4, range: 72, r: 31, gold: 600, rift: 10, mass: 8, aggro: 220, smash: 5, boss: true},
};
const ORC_KEYS = Object.keys(ORCS);
/* =================== traps =================== */
// place: floor | wall ; lv arrays index 0..2
const TRAPS = {
  spikes:    {name: '尖刺陷阱', place: 'floor', cost: 300, unlock: 0, spr: 'spikes', desc: '敌人踩上时刺出钢钉。', dmg: [70, 95, 125], cd: [1.6, 1.4, 1.15]},
  barricade: {name: '路障', place: 'floor', cost: 120, unlock: 0, spr: 'barricade', desc: '阻挡并改变兽人路线，会被砸毁。', hp: [450, 700, 1000], tall: true},
  tar:       {name: '焦油陷阱', place: 'floor', cost: 220, unlock: 0, spr: 'tar', desc: '大幅减慢踩入的敌人。', slow: [0.5, 0.62, 0.72]},
  arrow:     {name: '箭墙', place: 'wall', cost: 550, unlock: 0, spr: 'arrowwall', desc: '装在墙上，向前方 6 格射出连箭，可打飞行敌人。', dmg: [28, 36, 46], cd: [1.0, 0.82, 0.66], range: 6},
  spring:    {name: '弹射板', place: 'floor', cost: 400, unlock: 1, spr: 'spring', desc: '把敌人弹飞数格，弹进深渊或熔岩即死。R 键旋转。', cd: [3, 2.4, 1.8], push: [620, 700, 780], dir: true},
  brim:      {name: '烈焰地砖', place: 'floor', cost: 700, unlock: 2, spr: 'brimstone', desc: '踩中后喷发烈焰，点燃 3×3 范围敌人。', dmg: [20, 30, 40], burn: [25, 36, 50], cd: [5, 4.2, 3.4]},
  frost:     {name: '寒霜喷口', place: 'floor', cost: 800, unlock: 3, spr: 'frost', desc: '冻结 3×3 范围内所有敌人（含飞行）。', freeze: [2.0, 2.6, 3.2], cd: [7, 6, 5]},
  grinder:   {name: '绞肉机', place: 'wall', cost: 1100, unlock: 4, spr: 'grinder', desc: '墙面旋刃，持续绞碎正前方一格的敌人。', dps: [110, 150, 200]},
};
const TRAP_KEYS = Object.keys(TRAPS);
/* =================== levels =================== */
// wave group: [gate, type, count, delay, gap]
const LEVELS = [
  {id: 'm1', name: '边境哨站', desc: '兽人第一次冲击边境哨站。熟悉陷阱与武器，把它们挡在裂隙之外。', gold: 1500, hp: 1.0,
    waves: [
      [[0, 'grunt', 6, 0, 1.7]],
      [[0, 'grunt', 8, 0, 1.4], [0, 'kobold', 4, 8, 1.0]],
      [[0, 'grunt', 8, 0, 1.3], [0, 'archer', 4, 4, 2.5], [0, 'kobold', 6, 14, 0.8]],
      [[0, 'grunt', 12, 0, 1.1], [0, 'archer', 6, 6, 2], [0, 'kobold', 8, 18, 0.7]],
      [[0, 'grunt', 14, 0, 1.0], [0, 'archer', 6, 5, 2], [0, 'kobold', 10, 14, 0.6], [0, 'ogre', 1, 22, 0]],
    ]},
  {id: 'm2', name: '熔岩之桥', desc: '两路兽人汇聚于熔岩桥。弹射板与震荡冲击能把它们送进岩浆。', gold: 2000, hp: 1.12,
    waves: [
      [[0, 'grunt', 6, 0, 1.5], [1, 'grunt', 6, 3, 1.5]],
      [[0, 'grunt', 8, 0, 1.3], [1, 'kobold', 8, 4, 0.9]],
      [[0, 'archer', 5, 0, 2], [1, 'grunt', 10, 0, 1.2], [0, 'grunt', 6, 10, 1.2]],
      [[0, 'ogre', 1, 0, 0], [1, 'grunt', 12, 2, 1], [0, 'kobold', 8, 12, 0.7]],
      [[0, 'grunt', 12, 0, 1], [1, 'grunt', 12, 0, 1], [0, 'archer', 6, 8, 1.6], [1, 'ogre', 2, 15, 6]],
      [[0, 'grunt', 16, 0, 0.9], [1, 'kobold', 14, 0, 0.6], [0, 'ogre', 2, 12, 8], [1, 'archer', 8, 10, 1.5], [1, 'ogre', 1, 30, 0]],
    ]},
  {id: 'm3', name: '裂隙要塞', desc: '三面来袭，地狱蝙蝠会越过深渊直扑裂隙。墙面陷阱与冰霜是关键。', gold: 2600, hp: 1.25,
    waves: [
      [[0, 'grunt', 6, 0, 1.4], [2, 'grunt', 6, 0, 1.4]],
      [[1, 'bat', 6, 0, 1.2], [0, 'grunt', 8, 3, 1.2]],
      [[2, 'grunt', 10, 0, 1.1], [1, 'bat', 8, 4, 1], [0, 'kobold', 8, 6, 0.7]],
      [[0, 'ogre', 1, 0, 0], [2, 'ogre', 1, 6, 0], [1, 'grunt', 12, 0, 1], [1, 'archer', 6, 8, 1.6]],
      [[0, 'grunt', 12, 0, 1], [2, 'grunt', 12, 0, 1], [1, 'bat', 12, 6, 0.8], [1, 'kobold', 10, 12, 0.6]],
      [[1, 'ogre', 2, 0, 8], [0, 'archer', 8, 2, 1.4], [2, 'archer', 8, 2, 1.4], [0, 'grunt', 14, 10, 0.9], [2, 'bat', 10, 14, 0.8]],
      [[0, 'grunt', 18, 0, 0.8], [1, 'grunt', 18, 0, 0.8], [2, 'grunt', 18, 0, 0.8], [0, 'ogre', 2, 12, 6], [2, 'ogre', 2, 12, 6], [1, 'bat', 16, 8, 0.6], [1, 'kobold', 14, 20, 0.5]],
    ]},
  {id: 'm4', name: '督军之门', desc: '兽人督军亲自率军。守住八波攻势，在最后一波击倒督军！', gold: 3200, hp: 1.4,
    waves: [
      [[0, 'grunt', 8, 0, 1.2], [1, 'grunt', 8, 0, 1.2]],
      [[2, 'kobold', 10, 0, 0.7], [0, 'archer', 6, 2, 1.6], [1, 'grunt', 10, 4, 1.1]],
      [[0, 'ogre', 1, 0, 0], [1, 'ogre', 1, 0, 0], [2, 'grunt', 14, 0, 0.9], [0, 'bat', 8, 8, 0.8]],
      [[0, 'grunt', 14, 0, 0.9], [1, 'grunt', 14, 0, 0.9], [2, 'archer', 10, 4, 1.2], [1, 'bat', 10, 10, 0.7]],
      [[2, 'ogre', 3, 0, 6], [0, 'kobold', 14, 0, 0.5], [1, 'kobold', 14, 0, 0.5], [0, 'archer', 8, 10, 1.2]],
      [[0, 'grunt', 18, 0, 0.7], [1, 'grunt', 18, 0, 0.7], [2, 'grunt', 18, 0, 0.7], [0, 'bat', 12, 10, 0.6], [1, 'ogre', 2, 14, 6]],
      [[0, 'ogre', 3, 0, 5], [1, 'ogre', 3, 0, 5], [2, 'archer', 12, 0, 1], [2, 'kobold', 16, 8, 0.4], [0, 'bat', 14, 12, 0.5]],
      [[1, 'chief', 1, 0, 0], [0, 'grunt', 20, 0, 0.7], [2, 'grunt', 20, 0, 0.7], [1, 'grunt', 12, 6, 0.8], [0, 'ogre', 2, 15, 8], [2, 'ogre', 2, 15, 8], [1, 'bat', 16, 10, 0.6]],
    ]},
];
/* tile codes */
const TF = 0, TW = 1, TP = 2, TL = 3, TO = 4, TD = 5; // floor wall pit lava pillar decor-block
const DIRV = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // rot 0=E 1=S 2=W 3=N
