/* ================= the living village: NPC chatter tied to where you are and how far the story has gone,
   rumours about roaming beasts, and the 虚神界 ladder ================= */
const qi = id => MAIN.findIndex(q => q.id === id);
// { at: place id or area id, from / to: quest ids (inclusive range of the current main step), who, t }
const CHATTER = [
  // 石村, early
  { at: 'shicun', from: 'q_wake', to: 'q_egg', who: 'dazhuang', t: '小不点，你昨天又偷喝族长的兽奶了吧？嘴边那圈白的还没擦呢。' },
  { at: 'shicun', from: 'q_wake', to: 'q_egg', who: 'pihou', t: '我昨天爬到村口那块大石头顶上了！你行吗？……你当然行，你连大鼎都举得起来。' },
  { at: 'shicun', from: 'q_wake', to: 'q_wolf', who: 'ermeng', t: '林虎叔说进山的时候不能大声说话，凶兽耳朵灵着呢。' },
  { at: 'sc_yard', from: 'q_yard', to: 'q_tomb', who: 'linhu', t: '迎霞锻体，一天都不能落下。霞光里的精气，过了时辰就散了。' },
  { at: 'sc_chief', from: 'q_wake', to: 'q_bei', who: 'chief', t: '骨文这东西，认得越多，越知道自己认得少。' },
  { at: 'sc_willow', from: 'q_wake', to: 'q_leave', who: 'willow', t: '（柳枝轻轻晃了晃，一片嫩叶落在你头顶。）' },
  { at: 'sc_gate', from: 'q_wolf0', to: 'q_wolf', who: 'pihou', t: '林虎叔说山狼都是成群的，一头冲出来，后面准还跟着。' },
  { at: 'dh_forest', from: 'q_wolf', to: 'q_egg', who: '', t: '林子里传来几声狼嚎，一声比一声近。' },
  // after the eggs
  { at: 'shicun', from: 'q_tomb0', to: 'q_bei', who: 'dazhuang', t: '（脚上缠着厚厚的兽皮）那鳞片是真快……小不点，你那天回头冲老鹰扔石头，真够种。' },
  { at: 'shicun', from: 'q_tomb0', to: 'q_bei', who: 'ermeng', t: '那只小鹰被柳神救活了，现在天天蹲在柳树上，谁靠近就啄谁，就不啄你。' },
  { at: 'shicun', from: 'q_tomb0', to: 'q_tomb', who: 'linhu', t: '狻猊墓那边，邻村的猎手去了好几拨，回来的没几个。' },
  { at: 'dh_stone', from: 'q_tomb0', to: 'q_tomb', who: '', t: '石林深处吹来一阵阴风，风里有一股很老很老的味道。' },
  // 狈村 trouble
  { at: 'shicun', from: 'q_bei', to: 'q_yaoding', who: 'linhu', t: '狈村那帮人记仇。你一个人出去，记得绕着狈村走。' },
  { at: 'shicun', from: 'q_yaoding', to: 'q_shanbao', who: 'pihou', t: '烈老被柳神吓跑了！我爹说，那老东西在狈村横了几十年，第一次见他跑这么快。' },
  { at: 'sc_chief', from: 'q_yaoding', to: 'q_shanbao', who: 'chief', t: '狻猊宝术是凶兽里排得上号的宝术。别在村里乱使，房子会塌的。' },
  { at: 'dh_bei', from: 'q_yaoding', to: 'q_end', who: '', t: '狈村的猎手远远看见你，掉头就钻进了林子。' },
  { at: 'dh_deep', from: 'q_shanbao', to: 'q_shanbao', who: '', t: '大荒深处安静得反常，连鸟都不叫了。' },
  // after the move
  { at: 'shicun', from: 'q_ruin', to: 'q_memory', who: 'dazhuang', t: '新村子的溪水真甜！就是夜里青蛙太吵了。' },
  { at: 'shicun', from: 'q_ruin', to: 'q_memory', who: 'ermeng', t: '毛球又把我家的兽奶罐子掀翻了！小不点，你管管它！' },
  { at: 'shicun', from: 'q_ruin', to: 'q_jijing', who: 'linhu', t: '搬了家，打猎的地方远了，可山里的东西也肥了。' },
  { at: 'sc_chief', from: 'q_ruin', to: 'q_jijing', who: 'chief', t: '你最近气血涨得厉害。到了第九层，去柳神那儿坐坐。' },
  { at: 'dh_ruin', from: 'q_ruin', to: 'q_end', who: '', t: '你刻在石头上的字还在。没有人来过。' },
  // 出村 chapter
  { at: 'shicun', from: 'q_memory', to: 'q_bandit', who: 'pihou', t: '小不点，你这几天怎么老往古道那边跑？' },
  { at: 'shicun', from: 'q_bandit0', to: 'q_bandit', who: 'linhu', t: '（咬着牙给伤口换药）都怪我……族长要是有个三长两短……' },
  { at: 'shicun', from: 'q_xushen0', to: 'q_leave', who: 'dazhuang', t: '听说你一口气开了三座洞天？洞天是啥？能吃吗？' },
  { at: 'shicun', from: 'q_xushen0', to: 'q_leave', who: 'ermeng', t: '清风姐姐教我们认字了！她说外面的人都认字。' },
  { at: 'sc_chief', from: 'q_xushen0', to: 'q_leave', who: 'chief', t: '我年轻时也想出去看看。后来有了石村，就走不开了。' },
  { at: 'xs_hall', from: 'q_xushen', to: 'q_end', who: '', t: '光幕上，一个名字后面带着“重瞳”二字的少年，一直稳稳地挂在最前面。' },
  { at: 'xs_hall', from: 'q_xushen', to: 'q_end', who: '', t: '“那个从大荒来的小娃娃又来了！”远处的石台上有人喊了一声。' },
  { at: 'dh_road', from: 'q_qingfeng', to: 'q_gate', who: '', t: '古道上偶尔能看见几辆兽车的残骸，车辙一直延伸到山外。' },
  // 补天阁
  { at: 'bt_gate', from: 'q_gate', to: 'q_join', who: 'qingfeng', t: '那个偷石头的人，我好像在山门里见过……算了，等你进去了再说。' },
  { at: 'bt_gate', from: 'q_bully', to: 'q_qf1', who: 'qingfeng', t: '外门也挺好的。真的。（她把头扭到一边）' },
  { at: 'bt_gate', from: 'q_qf1', to: 'q_qf3', who: 'qingfeng', t: '今天我把那套拳打了三百遍。……你别那样看我，我不累。' },
  { at: 'bt_gate', from: 'q_qf2', to: 'q_qf3', who: '外门弟子', t: '那个清风，平时不声不响的，打起架来是真不要命。' },
  { at: 'bt_court', from: 'q_end', to: 'q_end', who: 'qingfeng', t: '内门的功课好难。……可我一点都不想回去。' },
  { at: 'bt_court', from: 'q_bully', to: 'q_end', who: '补天阁弟子', t: '听说了吗？新来的小师弟把三个外门师兄打趴下了，诡爷还开口了！诡爷！' },
  { at: 'bt_train', from: 'q_qf1', to: 'q_end', who: '雷池师兄', t: '雨族的冰甲？挨一道雷就裂。我亲眼见过。' },
  { at: 'bt_lib', from: 'q_qf2', to: 'q_end', who: 'libelder', t: '残魂没有肉身，刀剑砍不着。可骨文是刻在魂上的，锁得住它们。' },
  { at: 'bd_desert', from: 'q_yu', to: 'q_end', who: '', t: '沙地上躺着一只被砸碎的蝎壳。看来有人知道该怎么对付它们——硬壳要砸，不要砍。' },
  { at: 'bt_court', from: 'q_lei', to: 'q_baiduan', who: 'guiye', t: '……（诡爷盯着神藤上那几个干瘪的葫芦，一动不动。）' },
  { at: 'bt_court', from: 'q_lei', to: 'q_baiduan', who: 'gezhu', t: '神藤一年不如一年了。补天阁的根，都在它身上。' },
  { at: 'bt_court', from: 'q_join', to: 'q_end', who: '补天阁弟子', t: '那个就是扛着半扇虎肉进山门的小娃娃？' },
  { at: 'bt_train', from: 'q_lib', to: 'q_end', who: '雷池师兄', t: '（头发还竖着）小师弟，你再来一次，我这辈子都不来雷池了。' },
  { at: 'bt_lib', from: 'q_lib', to: 'q_end', who: 'libelder', t: '第五层的楼梯，我加了一道锁。……你别看我，我知道锁不住你。' },
  { at: 'bt_wild', from: 'q_gate', to: 'q_lotus', who: '', t: '林子深处的虎穴里，传来一阵沉闷的呼噜声。' },
  // 百断山
  { at: 'baiduan', from: 'q_bdgate', to: 'q_yu', who: 'huolinger', t: '雨族的人在找你。他们那一族心眼小，你小心点。' },
  { at: 'baiduan', from: 'q_lion', to: 'q_spring', who: 'huolinger', t: '我那只火鸟最近总往你那只大红鸟边上凑……你管管你的鸟！' },
  { at: 'baiduan', from: 'q_lion', to: 'q_mount', who: 'huolinger', t: '花果山那棵怪树我远远见过，一身的油。要是我的火鸟在，一口火就能让它叫唤。' },
  { at: 'shicun', from: 'q_tomb0', to: 'q_tomb', who: 'linhu', t: '墓里的石兽，刀砍上去只冒火星子。对付那种东西，得用砸的。' },
  // night
  { at: 'shicun', night: 1, from: 'q_wake', to: 'q_shanbao', who: 'linhu', t: '天黑了别出村。大荒的夜，是凶兽的白天。' },
  { at: 'shicun', night: 1, from: 'q_ruin', to: 'q_end', who: 'ermeng', t: '（打着哈欠）新村夜里的星星真多啊……小不点你怎么还不睡？' },
  { at: 'sc_willow', night: 1, from: 'q_wake', to: 'q_end', who: 'willow', t: '（月光下，柳枝上浮着一层极淡的光，一明一暗，像在呼吸。）' },
  { at: 'sc_chief', night: 1, from: 'q_wake', to: 'q_end', who: 'chief', t: '（族长还没睡，就着油灯一遍遍摸那块刻满骨文的兽骨。）' },
  { at: 'dahuang', night: 1, from: 'q_wolf', to: 'q_end', who: '', t: '林子里亮起一对对绿莹莹的眼睛，又悄悄熄灭了。' },
  { at: 'dahuang', night: 1, from: 'q_wolf', to: 'q_end', who: '', t: '头顶有什么东西无声地掠过，带起一阵冷风。是夜枭。' },
  { at: 'bt_court', night: 1, from: 'q_bully', to: 'q_end', who: 'guiye', t: '（夜深了，诡爷还站在神藤下。月光照着他，他的影子好像比人还老。）' },
  { at: 'bt_gate', night: 1, from: 'q_qf1', to: 'q_qf3', who: '', t: '外门的院子里，木桩还在一声一声地响。' },
  { at: 'baiduan', night: 1, from: 'q_bdgate', to: 'q_end', who: '', t: '断山之间飘起一串幽绿的鬼火，排成一行，慢慢往山谷深处去了。' },
  { at: 'xs_hall', night: 1, from: 'q_xushen', to: 'q_end', who: '', t: '夜里的虚神界人少了些。光幕上的名字一个个暗下去，只有最前面那一个，一直亮着。' },
  { at: 'bd_gate', from: 'q_bdgate', to: 'q_end', who: '', t: '断口平整得像镜子，照出你的影子。据说这里的每一座山，都是被一剑斩断的。' },
  { at: 'bd_cliff', from: 'q_cliff', to: 'q_end', who: '', t: '崖上的古兵器在风里嗡嗡作响，像是在说话。' },
  { at: 'bd_spring', from: 'q_spring', to: 'q_end', who: '', t: '泉眼冒着白气。那头金鹏留下的羽毛，还散落在泉边。' },
  { at: 'bd_mount', from: 'q_mount', to: 'q_end', who: '', t: '山顶空荡荡的。神猴王不在，可满山的猴子都瞪着你，你怀里的桃子位置有点烫。' },
  // pets
  { at: '*', pet: 'maoqiu', who: '毛球', t: '（毛球蹲在你肩膀上，偷偷把你口袋里的肉干掏出来吃了。）' },
  { at: '*', pet: 'maoqiu', who: '毛球', t: '（毛球冲远处龇了龇牙。那边的灌木丛里，有什么东西悄悄退走了。）' },
  { at: '*', pet: 'dahong', who: '大红', t: '（大红在你头顶盘旋，嘎嘎叫着，好像在嘲笑谁。）' },
  { at: '*', pet: 'ertuzi', who: '二秃子', t: '（二秃子缩在你衣领里，光溜溜的身子打了个哆嗦。）' },
];
let chatT = 0, lastChat = {};
function chatterFor(loc) { const P = PLACES[loc], q = C.story.q;
  return CHATTER.filter(c => (c.at === '*' ? c.pet && C.pet === c.pet : c.at === loc || c.at === P.area) && (!c.night || isNight()) && (!c.from || q >= qi(c.from)) && (!c.to || q <= qi(c.to))); }
/* who is standing here right now (some people move as the story goes on) */
function npcsHere(loc) { const P = PLACES[loc], f = C.story.f; let L = (P.npcs || []).filter(n => !(n === 'qingfeng' && (!f.qingfeng || f.qfIn)) && !(n === 'huolinger' && C.story.q < qi('q_bdgate'))); if (loc === 'bt_court' && f.qfIn) L = [...L, 'qingfeng']; return L; }
function npcSay(c) { lastChat[CHATTER.indexOf(c)] = now(); const N = NPCS[c.who]; logLine(c.who ? `<span class="who">${N ? N.name : c.who}</span>${c.t}` : c.t, 'npc'); }
function npcOnArrive(loc) { if (!C || NETROLE === 'guest' || STATE.scene) return; const L = chatterFor(loc).filter(c => !lastChat[CHATTER.indexOf(c)] || now() - lastChat[CHATTER.indexOf(c)] > 300000); if (L.length && chance(0.55)) setTimeout(() => { if (!STATE.scene && !STATE.battle) npcSay(pick(L)); }, 700); chatT = now() + rint(40000, 70000); }
function npcTick() { if (!C || STATE.mode !== 'play' || NETROLE === 'guest' || STATE.scene || STATE.battle || STATE.dungeon || now() < chatT) return; chatT = now() + rint(45000, 80000);
  const L = chatterFor(C.loc).filter(c => !lastChat[CHATTER.indexOf(c)] || now() - lastChat[CHATTER.indexOf(c)] > 300000); if (L.length) npcSay(pick(L)); }
function npcRumor(text) { const P = PLACES[C.loc]; const who = P.area === 'shicun' ? NPCS.linhu : P.area === 'butian' ? NPCS.gezhu : P.area === 'baiduan' ? NPCS.huolinger : null; logLine(who ? `<span class="who">${who.name}</span>${text}` : '【传闻】' + text, 'npc'); }
function npcTalk(id) { // clicking a person: their quest or side errand, otherwise a line that fits right now
  if (STATE.scene || STATE.battle) return; const opts = talkOptions(id); const lines = chatterFor(C.loc).filter(c => c.who === id);
  const fallback = { chief: '去玩吧，别跑太远。', willow: '（柳枝静静垂着。）', linhu: '弓要常擦，箭要常磨。', dazhuang: '小不点，下回进山带上我！', ermeng: '嘿嘿。', pihou: '你看你看，我又能多翻一个跟头了！', qingfeng: C.story.f.qfIn ? '内门的饭比外门的好吃。……你别告诉别人我说的。' : '……嗯。', guiye: '……', gezhu: '好好修行。', libelder: '书别弄脏了。', huolinger: '看什么看？' }[id] || '……';
  runScene(async () => { await say(id, lines.length ? pick(lines).t : fallback); if (opts.length) { const c = await choose([...opts.map(o => ({ t: o.t, dis: !!o.dis })), { t: '没事了' }]); if (c < opts.length) setTimeout(() => opts[c].f(), 0); } });
}
function talkOptions(id) { return [...questTalkOptions(id), ...bountyOptions(id), ...tradeOptions(id), ...(id === 'willow' && C.dt.length ? [{ t: '🔄 重开一座洞天（灵药 ×1）', dis: !itemN('lingyao'), f: dongtianRedo }] : [])]; }
const npcMark = id => questTalkOptions(id).length ? ' ❗' : bountyToday().some(b => b.npc === id && (b.st === 'new' || (b.st === 'on' && bountyReady(b)))) ? ' 📋' : '';

/* ---------- 虚神界 ladder: the young geniuses of every clan ---------- */
const RIVAL_NAMES = ['石毅（重瞳）', '火灵儿', '云曦', '金乌族少年', '雷族少年', '赤龙族少年', '天角蚁族少年', '孔雀族少女', '白虎族少年', '羽族天才', '风族少年', '雨族少年', '战王族少年', '狰族少年', '玄龟族少年', '紫金鼠族少年', '石国皇子', '火国少年', '雷国少年', '风国少女', '青鳞鹰族少年', '狈族少年', '山猿族少年', '蛇族少女', '金翅族少年'];
function rivalAt(rank) { const r = srng('rv' + rank); const name = rank <= RIVAL_NAMES.length ? RIVAL_NAMES[rank - 1] : RIVAL_NAMES[Math.floor(r() * RIVAL_NAMES.length)].replace(/少年|少女|天才/, '') + '·' + '甲乙丙丁戊己庚辛壬癸'[rank % 10] + '号';
  const lv = clamp(C.lv + Math.round((60 - rank) / 28), 1, 25); let sks = [['qly'], ['sn'], ['qly', 'sn'], ['lei'], ['sn', 'lei'], ['gw', 'qly'], ['jian', 'lei']][Math.floor(r() * 7)]; if (rank <= 20) sks = [...new Set([...sks, ...[['jian', 'ta'], ['dsh', 'lei'], ['sn', 'jian']][rank % 3]])];
  if (rank === 1) return { rank, name, lv: lv + 1, gear: 1.35, sk: ['sn', 'lei', 'jian', 'qly'], icon: '👁️', shiyi: 1 };
  return { rank, name, lv, gear: 0.85 + Math.max(0, 100 - rank) / 100 * 0.35 + (rank <= 20 ? 0.08 : 0), sk: sks, icon: ['🧑', '👦', '👧', '🦁', '🐉', '🦅'][Math.floor(r() * 6)] }; }
function arenaDaily() { const d = gameDay(); if (C.arena.day !== d) { C.arena.day = d; C.arena.tries = BAL.arenaTries; } }
function arenaRank() { if (!C.arena.rank) C.arena.rank = 120; return C.arena.rank; }
function arenaOpponents() { const r = arenaRank(), seed = srng('ao' + gameDay() + r + C.arena.wins), out = []; const span = Math.max(3, Math.min(30, Math.round(r * 0.3)));
  const ranks = new Set(); while (ranks.size < 3 && ranks.size < r - 1) ranks.add(Math.max(1, r - 1 - Math.floor(seed() * span))); return [...ranks].sort((a, b) => b - a).map(rivalAt); }
async function arenaFight(o) {
  arenaDaily(); if (C.arena.tries <= 0) { toast('今天打累了，明天再来'); return; } C.arena.tries--; fullHeal(); closeModal();
  if (o.shiyi) logLine('石毅的两个瞳孔一起转了过来。<b>重瞳</b>：同一门宝术连着对他用，会被他看穿（伤害减半）。', 'tip');
  const r = await startBattle({ rivals: [o], title: `虚神界 · 挑战第 ${o.rank} 名 ${o.name}`, noLose: true, flee: false, arena: 1, noPet: true });
  if (r && r.win && o.shiyi && !C.story.f.shiyiWin) { C.story.f.shiyiWin = 1; setTimeout(() => runScene(async () => { await nar('光幕上，你的名字压过了那个带着“重瞳”二字的名字。'); await say('石毅', '……第一，你先拿着。'); await nar('他转身走进了光里，没有回头。你胸口的疤，又跳了一下。'); }, { title: '登顶' }), 900); }
  fullHeal(); if (r && r.win) { C.arena.wins++; const old = C.arena.rank; if (o.rank < old) C.arena.rank = o.rank; logLine(`虚神界排名 ${old > 100 ? '榜外' : old} → <b>${C.arena.rank}</b>`, 'sys'); arenaMilestones(); storyArena(); }
  else logLine('输了。光幕上你的名字没动。', 'dim'); save(); refresh();
}

/* ---------- 虚神界 rewards: one-time when you first reach the top 50 / 10 / 1, and a daily gift by rank ---------- */
const ARENA_MS = [{ r: 50, t: '光幕上，你的名字第一次镶上了金边。', items: [['baoyao', 2]], exp: 0.3 }, { r: 10, t: '你挤进了虚神界前十。各族的天才开始记住“大荒来的小不点”这个名字。', items: [['baoyao', 3], ['lingyao', 3]], exp: 0.5 }, { r: 1, t: '虚神界第一！光幕上，你的名字压在了所有人的头上。', items: [['baoyao', 5], ['lingyao', 5]], exp: 1 }];
function arenaMilestones() { const r = C.arena.rank; C.arena.best = Math.min(C.arena.best || 999, r); C.arena.got = C.arena.got || {};
  for (const M of ARENA_MS) if (r <= M.r && !C.arena.got[M.r]) { C.arena.got[M.r] = 1; logLine(`<b class="lvup">${M.t}</b>`, 'sys'); for (const [k, n] of M.items) addItem(k, n); gainExp(BAL.expNext(C.lv) * M.exp); sfx('epic'); }
  if (r <= 10 && !C.story.f.shiyi) setTimeout(() => runScene(S_shiyi, { title: '重瞳' }), 700); }
const arenaGift = r => r <= 10 ? { items: [['baoyao', 2], ['lingyao', 2]], exp: 0.25 } : r <= 50 ? { items: [['baoyao', 1], ['lingyao', 1]], exp: 0.15 } : r <= 100 ? { items: [['lingyao', 1], ['herb', 2]], exp: 0.08 } : { items: [['herb', 2]], exp: 0.04 };
function arenaClaim() { if (C.arena.claimed === gameDay()) return; C.arena.claimed = gameDay(); const g = arenaGift(arenaRank()); logLine(`虚神界的光幕洒下一片微光——按今天的排名（${arenaRank() > 100 ? '榜外' : '第 ' + arenaRank() + ' 名'}）领到了奖励。`, 'sys'); for (const [k, n] of g.items) addItem(k, n); gainExp(BAL.expNext(C.lv) * g.exp); sfx('loot'); save(); refresh(); }
