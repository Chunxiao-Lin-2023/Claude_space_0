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
];

/* ---------- daily bounties: one small job per person per day ---------- */
const BOUNTY_FROM = [
  { npc: 'linhu', open: () => C.story.q >= qi('q_tomb0'), areas: ['dahuang'] },
  { npc: 'libelder', open: () => !!C.story.f.joined, areas: ['butian', 'dahuang'] },
  { npc: 'huolinger', open: () => C.story.q >= qi('q_lion'), areas: ['baiduan'] },
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
  { id: 'dacheng', n: '一术大成', d: '任意一门宝术练到大成', ok: () => C.sk.some(id => profLevel(id) === 2) },
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
