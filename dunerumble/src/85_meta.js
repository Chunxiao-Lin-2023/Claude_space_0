/* ================= progression: trophies, ranks, coins, quests, achievements, unlocks ================= */
const RANKS = [
  { n: '青铜', t: 0, c: '#c98b52' }, { n: '白银', t: 100, c: '#c9d6e0' }, { n: '黄金', t: 250, c: '#ffd23f' },
  { n: '钻石', t: 500, c: '#7ad8ff' }, { n: '大师', t: 900, c: '#ff7ac0' }, { n: '传奇', t: 1400, c: '#ff4d4d' },
];
const PROG_DEFAULT = { trophies: 0, ht: {}, coins: 0, skins: {}, life: { kills: 0, dmg: 0, boxes: 0, gad: 0, games: 0, wins: 0, cubes: 0, heroes: {} }, quests: { day: '', list: [] }, ach: {}, streak: { w: 0, l: 0 } };
let PROG = Object.assign(JSON.parse(JSON.stringify(PROG_DEFAULT)), LS.get('prog', {}));
const saveProg = () => LS.set('prog', PROG);
const rankOf = t => { let r = RANKS[0], i = 0; RANKS.forEach((R, k) => { if (t >= R.t) { r = R; i = k; } }); return Object.assign({ i, next: RANKS[i + 1] }, r); };
const TROPHY_TABLE = { solo: [0, 10, 8, 7, 6, 4, 2, 0, -1, -2, -3], duo: [0, 9, 7, 4, 0, -3] };
function trophyDelta(mode, rank, draw) {
  if (mode === 'train') return 0;
  if (TROPHY_TABLE[mode]) return TROPHY_TABLE[mode][rank] || 0;
  if (mode === 'boss') return rank === 1 ? 6 : 0;
  return draw ? 0 : rank === 1 ? 8 : -3;
}
const QUEST_TPL = [
  { k: 'kills', n: 8, t: '击败 8 名敌人', r: 60 }, { k: 'dmg', n: 30000, t: '造成 30000 点伤害', r: 60 }, { k: 'boxes', n: 6, t: '打开 6 个能量箱', r: 50 },
  { k: 'gad', n: 5, t: '使用 5 次副技能', r: 40 }, { k: 'win', n: 1, t: '赢得 1 局任意模式', r: 60 }, { k: 'cubes', n: 15, t: '收集 15 个能量块', r: 50 },
  { k: 'play_gem', n: 1, t: '玩 1 局宝石争霸', r: 40 }, { k: 'play_ball', n: 1, t: '玩 1 局乱斗足球', r: 40 }, { k: 'play_bounty', n: 1, t: '玩 1 局赏金猎人', r: 40 },
  { k: 'play_boss', n: 1, t: '挑战 1 次机甲 Boss', r: 50 }, { k: 'top3', n: 2, t: '吃鸡模式 2 次进入前三', r: 70 }, { k: 'heal', n: 8000, t: '累计回复 8000 点生命', r: 50 },
];
const ACH = [
  { k: 'firstWin', t: '初尝胜果', d: '赢得第一局', r: 50, f: (L, m) => L.wins >= 1 },
  { k: 'train', t: '新兵毕业', d: '完成训练场', r: 60, f: (L, m) => m.mode === 'train' && m.win },
  { k: 'triple', t: '三杀！', d: '4.5 秒内连续击败 3 名敌人', r: 80, f: (L, m) => m.maxMulti >= 3 },
  { k: 'streak5', t: '势不可挡', d: '一条命连续击败 5 名敌人', r: 100, f: (L, m) => m.maxStreak >= 5 },
  { k: 'kills100', t: '百人斩', d: '累计击败 100 名敌人', r: 150, f: L => L.kills >= 100 },
  { k: 'dmg1m', t: '伤害输出机', d: '累计造成 100 万伤害', r: 200, f: L => L.dmg >= 1e6 },
  { k: 'boxes50', t: '开箱达人', d: '累计打开 50 个能量箱', r: 100, f: L => L.boxes >= 50 },
  { k: 'gad30', t: '道具大师', d: '累计使用 30 次副技能', r: 80, f: L => L.gad >= 30 },
  { k: 'allHeroes', t: '全能选手', d: '用每位英雄各玩一局', r: 200, f: L => PLAYABLE.every(i => L.heroes[HEROES[i].k]) },
  { k: 'boss', t: '机甲克星', d: '击败钢铁巨像', r: 120, f: (L, m) => m.mode === 'boss' && m.win },
  { k: 'hat', t: '梅开二度', d: '单局乱斗足球进 2 球', r: 100, f: (L, m) => m.goals >= 2 },
  { k: 'gems10', t: '宝石大亨', d: '单局同时携带 10 颗宝石', r: 100, f: (L, m) => m.maxGems >= 10 },
  { k: 'bounty7', t: '头号通缉', d: '赏金猎人中头顶 7 颗星', r: 100, f: (L, m) => m.maxBounty >= 7 },
  { k: 'chicken', t: '沙丘之王', d: '单人吃鸡获得第一', r: 100, f: (L, m) => m.mode === 'solo' && m.rank === 1 },
  { k: 'gold', t: '黄金段位', d: '奖杯达到 250', r: 150, f: () => PROG.trophies >= 250 },
  { k: 'diamond', t: '钻石段位', d: '奖杯达到 500', r: 300, f: () => PROG.trophies >= 500 },
  { k: 'skin', t: '时尚达人', d: '解锁任意一套皮肤', r: 50, f: () => Object.keys(PROG.skins).length > 0 },
];
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function dailyQuests() {
  const day = todayKey();
  if (PROG.quests.day !== day) {
    let h = 0; for (const c of day) h = (h * 31 + c.charCodeAt(0)) | 0;
    const rng = mulberry32(h), pool = QUEST_TPL.slice(), list = [];
    while (list.length < 3) { const q = pool.splice(Math.floor(rng() * pool.length), 1)[0]; list.push({ k: q.k, n: q.n, t: q.t, r: q.r, p: 0, done: false }); }
    PROG.quests = { day, list }; saveProg();
  }
  return PROG.quests.list;
}
/* m = summary of the finished match for the local player */
function recordMatch(m) {
  const out = { dT: trophyDelta(m.mode, m.rank, m.draw), coins: 0, quests: [], ach: [], rankUp: null, unlocks: [] };
  if (m.mode === 'train' && !m.win) out.dT = 0;
  const before = rankOf(PROG.trophies);
  PROG.trophies = Math.max(0, PROG.trophies + out.dT);
  PROG.ht[m.hero] = Math.max(0, (PROG.ht[m.hero] || 0) + out.dT);
  out.coins = m.mode === 'train' ? 0 : 8 + m.kills * 2 + (m.win ? 15 : 0) + Math.min(10, m.boxes);
  const L = PROG.life;
  L.kills += m.kills; L.dmg += m.dmg; L.boxes += m.boxes; L.gad += m.gad; if (m.mode !== 'train') { L.games++; if (m.win) L.wins++; } L.cubes += m.cubes; L.heroes[m.hero] = (L.heroes[m.hero] || 0) + 1;
  // win/loss streak for adaptive difficulty
  // showdown: top 4 (solo) / top 2 (duo) counts as a good game, bottom 4 / bottom 2 as a bad one
  const sd = m.mode === 'solo' || m.mode === 'duo', good = m.win || (sd && m.rank <= (m.mode === 'solo' ? 4 : 2)), bad = sd ? m.rank >= (m.mode === 'solo' ? 7 : 4) : !m.win && !m.draw;
  if (m.mode !== 'train') { if (good) PROG.streak = { w: PROG.streak.w + 1, l: 0 }; else if (bad) PROG.streak = { w: 0, l: PROG.streak.l + 1 }; }
  // quests
  for (const q of dailyQuests()) {
    if (q.done) continue;
    const inc = q.k === 'kills' ? m.kills : q.k === 'dmg' ? m.dmg : q.k === 'boxes' ? m.boxes : q.k === 'gad' ? m.gad : q.k === 'win' ? (m.win ? 1 : 0) : q.k === 'cubes' ? m.cubes
      : q.k === 'heal' ? m.heal : q.k === 'top3' ? ((m.mode === 'solo' || m.mode === 'duo') && m.rank <= 3 ? 1 : 0) : q.k.startsWith('play_') ? (m.mode === q.k.slice(5) ? 1 : 0) : 0;
    q.p = Math.min(q.n, q.p + inc);
    if (q.p >= q.n) { q.done = true; out.coins += q.r; out.quests.push(q); }
  }
  // achievements
  for (const A of ACH) if (!PROG.ach[A.k] && A.f(L, m)) { PROG.ach[A.k] = Date.now(); out.coins += A.r; out.ach.push(A); }
  PROG.coins += out.coins;
  const after = rankOf(PROG.trophies);
  if (after.i > before.i) { out.rankUp = after; for (const [k, th] of Object.entries(THEMES)) if (th.locked && th.locked > before.t && th.locked <= PROG.trophies) out.unlocks.push(th.name); }
  saveProg();
  return out;
}
function adaptDifficulty() {
  if (!SET.autoDiff) return null;
  if (PROG.streak.l >= 3 && SEL.diff > 0) { SEL.diff--; PROG.streak.l = 0; saveProg(); saveSel(); return '连输 3 局，AI 难度降为「' + DIFF[SEL.diff].name + '」'; }
  if (PROG.streak.w >= 3 && SEL.diff < 1) { /* never auto-promote into 困难: that step is too big to spring on someone */ SEL.diff++; PROG.streak.w = 0; saveProg(); saveSel(); return '连胜 3 局，AI 难度升为「' + DIFF[SEL.diff].name + '」'; }
  return null;
}
const themeUnlocked = k => !THEMES[k].locked || PROG.trophies >= THEMES[k].locked;
const skinOwned = (hk, i) => i === 0 || !!PROG.skins[hk + '|' + i];
function buySkin(hk, i) {
  const S = SKINS[i]; if (skinOwned(hk, i) || PROG.coins < S.cost) return false;
  PROG.coins -= S.cost; PROG.skins[hk + '|' + i] = 1; saveProg(); return true;
}
