/* ================= growth & long-term goals: 宝骨 (relics), difficulty, trades, daily bounties, titles, 雷池深处 ================= */

/* ---------- difficulty (per save, changeable any time in 设置) ---------- */
const DIFF = [{ n: '简单', hp: 0.75, atk: 0.8, exp: 1 }, { n: '标准', hp: 1, atk: 1, exp: 1 }, { n: '困难', hp: 1.25, atk: 1.15, exp: 1.15 }];
const diffOf = () => DIFF[C && C.diff != null ? C.diff : 1];

/* ---------- 宝骨: the first time you beat a 首领 it leaves something behind; wear two ----------
   b = passive stats (same keys as 功法); sp = battle effect */
const RELICS = {
  r_eagle: { n: '青鳞鹰羽', from: 'eagle', i: '🪶', d: '身法 +3，更难被打中。', b: { spd: 3 } },
  r_suanni: { n: '狻猊宝骨', from: 'suanni', i: '🦴', d: '开战时获得 15% 最大气血的护盾。', sp: { shieldStart: 0.15 } },
  r_fengbei: { n: '狈祖骨牌', from: 'fengbei', i: '🪬', d: '第一回合必定先出手，攻击 +15%。', sp: { first: 0.15 } },
  r_jiling: { n: '祭灵残片', from: 'jiling', i: '👻', d: '造成伤害的 5% 回复气血。', b: { leech: 0.05 } },
  r_lion: { n: '金狮鬃', from: 'lion', i: '🦁', d: '暴击 +5%。', b: { crit: 0.05 } },
  r_yu: { n: '雨族冰符', from: 'yuchief', i: '❄️', d: '防御 +8%。', b: { defP: 0.08 } },
  r_tiger: { n: '白虎爪', from: 'whitetiger', i: '🐯', d: '攻击 +6%。', b: { atkP: 0.06 } },
  r_peng: { n: '金鹏翎', from: 'jinpeng', i: '✨', d: '身法 +4。', b: { spd: 4 } },
  r_boneking: { n: '天骨碎片', from: 'boneking', i: '💀', d: '每回合额外回复 3% 符力。', sp: { mp: 0.03 } },
  r_pumo: { n: '蒲魔树根', from: 'pumo', i: '🌿', d: '每回合回复 2% 气血。', b: { regen: 0.02 } },
  r_rhino: { n: '兕角', from: 'r_rhino', i: '🦏', d: '防御 +8%，气血 +5%。', b: { defP: 0.08, hpP: 0.05 } },
  r_snake: { n: '赤鳞', from: 'r_snake', i: '🐍', d: '不会中毒。', sp: { noPoison: 1 } },
  r_bird: { n: '雷翅羽', from: 'r_bird', i: '⚡', d: '雷道的伤害 +20%。', sp: { lei: 0.2 } },
  r_zhuque: { n: '朱雀真羽', from: '', i: '🔥', d: '火灵儿从小带着的羽毛。攻击 +5%，身法 +2。', b: { atkP: 0.05, spd: 2 } },
  r_ziteng: { n: '石子腾的战戟碎片', from: 'shiziteng', i: '🔱', d: '攻击 +8%。', b: { atkP: 0.08 } },
  r_jinzhu: { n: '金蛛腿甲', from: 'jinzhu', i: '🕷️', d: '防御 +10%。', b: { defP: 0.1 } },
  r_mozhu: { n: '魔蛛毒囊', from: 'mozhu', i: '🧪', d: '攻击 +6%，不会中毒。', b: { atkP: 0.06 }, sp: { noPoison: 1 } },
  r_qingluan: { n: '青鸾翎', from: 'qingluan', i: '🪶', d: '身法 +5，暴击 +3%。', b: { spd: 5, crit: 0.03 } },
  r_shichong: { n: '傀儡皇冠', from: 'shichong', i: '👑', d: '符力 +15%。', b: { mpP: 0.15 } },
  r_shenhuo: { n: '神火余烬', from: 'shenming2', i: '🔥', d: '攻击 +10%，暴击 +4%。', b: { atkP: 0.1, crit: 0.04 } },
  r_chiwang: { n: '赤王血', from: 'chiwanghy', i: '🩸', d: '攻击 +10%，暴击 +4%。', b: { atkP: 0.1, crit: 0.04 } },
  r_chashu: { n: '悟道茶叶', from: 'chashu', i: '🍃', d: '符力 +15%，气血 +6%。', b: { mpP: 0.15, hpP: 0.06 } },
  r_canxian: { n: '残仙骨', from: 'canxian', i: '🦴', d: '气血 +12%，攻击 +8%。', b: { hpP: 0.12, atkP: 0.08 } },
  r_xwhy: { n: '仙王血晶', from: 'xwhy', i: '💎', d: '全属性 +6%。', b: { hpP: 0.06, atkP: 0.06, defP: 0.06, mpP: 0.06 } },
  r_kundi: { n: '鲲帝之鳞', from: 'kundi', i: '🐋', d: '防御 +14%，气血 +10%。', b: { defP: 0.14, hpP: 0.1 } },
  r_shihai: { n: '尸骸仙帝的灰', from: 'shihai', i: '⚱️', d: '全属性 +10%。', b: { hpP: 0.1, atkP: 0.1, defP: 0.1, mpP: 0.1 } },
  r_baishi: { n: '白狮鬃', from: 'baishi', i: '🦁', d: '攻击 +8%，防御 +6%。', b: { atkP: 0.08, defP: 0.06 } },
  r_ningchuan: { n: '麒麟血晶', from: 'ningchuan', i: '🩸', d: '气血 +10%，攻击 +8%。', b: { hpP: 0.1, atkP: 0.08 } },
  r_dichong: { n: '帝冲战甲片', from: 'dichong', i: '🛡️', d: '防御 +12%，气血 +6%。', b: { defP: 0.12, hpP: 0.06 } },
  r_dizu: { n: '帝族血玉', from: 'dizu', i: '🔴', d: '攻击 +10%，暴击 +4%。', b: { atkP: 0.1, crit: 0.04 } },
  r_heian: { n: '黑暗至尊之核', from: 'heianzz', i: '⚫', d: '全属性 +7%。', b: { hpP: 0.07, atkP: 0.07, defP: 0.07, mpP: 0.07 } },
  r_dihuo: { n: '地火液晶', from: 'baoling', i: '🔶', d: '攻击 +8%，气血 +6%。', b: { atkP: 0.08, hpP: 0.06 } },
  r_zhanhun: { n: '古灵战旗', from: 'zhanhun', i: '🚩', d: '攻击 +6%，暴击 +4%。', b: { atkP: 0.06, crit: 0.04 } },
  r_jitan: { n: '锁仙链', from: 'jitanshi', i: '⛓️', d: '防御 +8%，符力 +8%。', b: { defP: 0.08, mpP: 0.08 } },
  r_tianming: { n: '天命石碎片', from: 'tianming', i: '💠', d: '全属性 +5%。', b: { hpP: 0.05, atkP: 0.05, defP: 0.05, mpP: 0.05 } },
  r_kuang: { n: '傀王心核', from: 'kuangwang', i: '🪨', d: '气血 +12%，防御 +8%。', b: { hpP: 0.12, defP: 0.08 } },
  r_shenqi: { n: '天神器残片', from: 'yaolong', i: '🗡️', d: '攻击 +10%，暴击 +4%。', b: { atkP: 0.1, crit: 0.04 } },
  r_rongyan: { n: '熔岩龟甲', from: 'rongwang', i: '🐢', d: '气血 +10%，防御 +6%。', b: { hpP: 0.1, defP: 0.06 } },
  r_leishou: { n: '雷兽心核', from: 'leishou', i: '🔷', d: '符力 +12%，暴击 +3%。', b: { mpP: 0.12, crit: 0.03 } },
};
const relicSp = (k, c = C) => (c.eq || []).reduce((s, id) => s + ((RELICS[id] && RELICS[id].sp && RELICS[id].sp[k]) || 0), 0);

/* ---------- trading surplus materials ---------- */
const TRADES = [
  { npc: 'chief', t: '兽骨 ×5 → 宝药 ×1', need: [['bone', 5]], give: () => addItem('baoyao') },
  { npc: 'chief', t: '凶兽肉 ×4 → 宝药 ×1', need: [['meat', 4]], give: () => addItem('baoyao') },
  { npc: 'libelder', t: '灵药 ×3 → 一门宝术熟练度 +8', need: [['lingyao', 3]], prof: 8 },
  { npc: 'libelder', t: '兽骨 ×6 → 一门宝术熟练度 +10', need: [['bone', 6]], prof: 10 },
  { npc: 'huolinger', t: '凶兽肉 ×3 → 灵药 ×2（她的火鸟爱吃）', need: [['meat', 3]], give: () => addItem('lingyao', 2) },
  { npc: 'laozhong', t: '兽骨 ×8 → 宝药 ×2（侯府库房里换的）', need: [['bone', 8]], give: () => addItem('baoyao', 2) },
  { npc: 'leiting', t: '灵药 ×4 → 一门宝术熟练度 +15（雷族的炼体法）', need: [['lingyao', 4]], prof: 15 },
  { npc: 'huohuang', t: '凶兽肉 ×5 → 一门宝术熟练度 +15（在祖地边上练）', need: [['meat', 5]], prof: 15 },
  { npc: 'bzlao', t: '兽骨 ×10 → 宝药 ×3（战场上捡来的）', need: [['bone', 10]], give: () => addItem('baoyao', 3) },
  { npc: 'yunlao', t: '灵药 ×5 → 一门宝术熟练度 +20（云族的心法）', need: [['lingyao', 5]], prof: 20 },
  { npc: 'qidaolin', t: '宝药 ×2 → 一门宝术熟练度 +30（无敌道的练法，“学费”）', need: [['baoyao', 2]], prof: 30 },
  { npc: 'mengtz', t: '兽骨 ×12 → 宝药 ×4（帝关的军需）', need: [['bone', 12]], give: () => addItem('baoyao', 4) },
  { npc: 'qiwanghou', t: '凶兽肉 ×4 → 一门宝术熟练度 +25（七王祠里的旧拳谱）', need: [['meat', 4]], prof: 25 },
  { npc: 'guzu', t: '灵药 ×6 → 一门宝术熟练度 +40（蛄祖替你理一遍道则）', need: [['lingyao', 6]], prof: 40 },
];

/* ---------- daily bounties: one small job per person per day ---------- */
const BOUNTY_FROM = [
  { npc: 'linhu', open: () => C.story.q >= qi('q_tomb0'), areas: ['dahuang'] },
  { npc: 'libelder', open: () => !!C.story.f.joined, areas: ['butian', 'dahuang'] },
  { npc: 'huolinger', open: () => C.story.q >= qi('q_lion'), areas: ['baiduan'] },
  { npc: 'leiting', open: () => C.story.q >= qi('q_shouyan'), areas: ['shiguo'] },
  { npc: 'huohuang', open: () => !!C.story.f.huohuang, areas: ['huoguo'] },
  { npc: 'bzlao', open: () => C.story.q >= qi('q_baojie'), areas: ['baizu'] },
  { npc: 'qidaolin', open: () => !!C.story.f.dojo, areas: ['shangjie', 'sanqian', 'xiangu'] },
  { npc: 'mengtz', open: () => !!C.story.f.v8, areas: ['diguan'] },
];

/* ---------- titles (achievements) ---------- */
const ACH = [
  { id: 'first', n: '初生牛犊', d: '打赢第一场仗', ok: () => C.stats.kills >= 1 },
  { id: 'k100', n: '大荒小霸王', d: '打倒 100 头凶兽', ok: () => C.stats.kills >= 100 },
  { id: 'k500', n: '凶兽见了绕道走', d: '打倒 500 头凶兽', ok: () => C.stats.kills >= 500 },
  { id: 'boss10', n: '屠首领', d: '打倒 10 个首领', ok: () => C.stats.bosses >= 10 },
  { id: 'night', n: '夜行者', d: '打倒 10 头夜行凶兽', ok: () => (C.kills.owl || 0) + (C.kills.wisp || 0) >= 10 },
  { id: 'lei', n: '雷池常客', d: '在雷池挨劈 20 次', ok: () => (C.stats.train || 0) >= 20 },
  { id: 'sk7', n: '宝术七门', d: '学会全部 7 门宝术', ok: () => C.sk.length >= 7 },
  { id: 'dacheng', n: '一术大成', d: '任意一门宝术练到大成', ok: () => C.sk.some(id => profLevel(id) >= 4) },
  { id: 'hou', n: '荒天侯', d: '在校军场打赢两位尊者，被人皇封侯', ok: () => !!C.story.f.hou },
  { id: 'shihuang', n: '石皇', d: '坐上石国的龙椅（记得要垫子）', ok: () => !!C.story.f.shihuang },
  { id: 'zhanshen', n: '斩神', d: '死过一回，再站起来，斩下一位神明', ok: () => !!C.story.f.qishen },
  { id: 'dengtian', n: '登天者', d: '走完几千年没人走完的登天路', ok: () => !!C.story.f.v4end },
  { id: 'zui', n: '罪血登顶', d: '在至尊古台第九层的天碑上，刻下一个“罪”字', ok: () => !!C.story.f.gutai },
  { id: 'zhengba', n: '三千州第一', d: '赢下三千州天才争霸', ok: () => !!C.story.f.v6end },
  { id: 'shuangshi', n: '双石同心', d: '和石毅并肩，打退宁川', ok: () => !!C.story.f.xgNing },
  { id: 'qiwang', n: '七王之后', d: '知道了“罪血”这两个字真正的意思', ok: () => !!C.story.f.qiwangDone },
  { id: 'heishui', n: '黑水一百年', d: '在异域的黑水天牢里熬过一百年，从海瀑跳了出去', ok: () => !!C.story.f.yyEnd },
  { id: 'tianting', n: '天庭', d: '立起天庭，让九天十地第一次站在一起', ok: () => !!C.story.f.tiantingDone },
  { id: 'baxi', n: '逆活八世', d: '在时光长河里活了八辈子，又回来了', ok: () => !!C.story.f.baxi },
  { id: 'huangtiandi', n: '荒天帝', d: '死在界海深处，又从记得你的人心里化了回来', ok: () => !!C.story.f.xiandi },
  { id: 'duduan', n: '独断万古', d: '一剑斩断时光长河', ok: () => !!C.story.f.v15end },
  { id: 'taiping', n: '万年太平', d: '带着石村八百兵，替九天十地挣来一万年太平', ok: () => !!C.story.f.v9end },
  { id: 'pets3', n: '一猴两鸟', d: '凑齐三个伙伴', ok: () => Object.keys(C.pets).length >= 3 },
  { id: 'evo', n: '血脉觉醒', d: '让一个伙伴觉醒', ok: () => Object.values(C.pets).some(p => p.evo) },
  { id: 'codex', n: '博闻', d: '凶兽图鉴见过 30 种', ok: () => Object.keys(C.codex || {}).length >= 30 },
  { id: 'relic5', n: '骨头收藏家', d: '收集 5 件宝骨', ok: () => Object.keys(C.relics || {}).length >= 5 },
  { id: 'ex10', n: '踏遍大荒', d: '把 10 个地方探索完', ok: () => Object.values(C.ex || {}).filter(e => e.done).length >= 10 },
  { id: 'bounty10', n: '有求必应', d: '完成 10 次悬赏', ok: () => (C.stats.bounty || 0) >= 10 },
  { id: 'arena1', n: '虚神界第一', d: '在虚神界登顶', ok: () => C.arena.rank === 1 },
  { id: 'hard', n: '不走寻常路', d: '通关一次困难秘境', ok: () => Object.keys(C.dungeons || {}).some(k => k.endsWith('_hard')) },
  { id: 'dt9', n: '九座洞天', d: '开辟九座洞天', ok: () => C.dt.length >= 9 },
  { id: 'end', n: '走出大荒', d: '读完第一卷', ok: () => !!C.story.f.end },
];
