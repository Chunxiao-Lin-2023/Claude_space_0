/* 数值与数据表。改 BAL / HERO / 怪物倍率前先给用户看 旧值 → 新值（RULES 第 8 条） */
const BAL = {
  dayLen: 12, duskAt: 7,            /* 一天 12 格：0–6 白天（乐园营业），7–11 夜里 */
  weakMul: 1.5, critMul: 1.5, guardMul: .5, phaseAtk: 1.25, storyExp: 2,
  lowHp: .3, lowHeal: .25, lowAtk: 1.3, /* 绝境：三成体力以下触发一次 */
  scareAtk: .62, screamPerSpin: 100, ticket: 20, restCamp: .4, sellRate: .5,
  foeHp: l => 1 + Math.max(0, l - 8) * .03, foeAtk: l => 1 + Math.max(0, l - 8) * .012
};
const DIFF = [{ n: '简单', hp: .75, atk: .8, exp: 1 }, { n: '标准', hp: 1, atk: 1, exp: 1 }, { n: '困难', hp: 1.25, atk: 1.15, exp: 1.15 }];
const HERO = { hp: l => 96 + 24 * l, mp: l => 42 + 6 * l, atk: l => 13 + 4.2 * l, def: l => 4 + 2 * l, spd: l => 10 + l, need: l => Math.round(36 + 26 * Math.pow(l, 1.55)), cap: 22 };
const barSlots = lv => 4 + (lv >= 6) + (lv >= 11) + (lv >= 16), gearSlots = lv => 2 + (lv >= 8) + (lv >= 14);
const PROF = [[0, '生疏', 0], [10, '入门', .04], [25, '熟练', .1], [50, '精通', .15], [90, '老手', .2], [140, '炉火纯青', .26]];
const EL = { blunt: '钝击', blade: '利刃', light: '强光', salt: '盐', name: '唤名', sound: '声音', cat: '猫', story: '暗示', jump: '突脸', chase: '追逐', doll: '人偶', none: '' };
const RANKS = ['新人老板', '吓人学徒', '凶宅常客', '午夜主播', '厉鬼眷顾者', '怪谈猎手', '门前守夜人']; const rankOf = lv => RANKS[Math.min(RANKS.length - 1, Math.floor((lv - 1) / 3))];

/* 手段：m = n 夜里对峙 / d 白天吓游客 / b 都能用 */
const SKILLS = {
  hammer: { n: '工具锤', ic: '🔨', m: 'n', el: 'blunt', cost: 0, pow: 1, d: '多用工具锤，修道具也修人。不耗精神。' },
  skull: { n: '碎颅锤', ic: '⚒️', m: 'n', el: 'blunt', cost: 6, pow: 1.5, stun: .25, d: '碎颅医生那把四十多厘米长的铁锤。1.5 倍伤害，25% 砸懵；对鬼怪也有效。' },
  knife: { n: '水果刀', ic: '🔪', m: 'n', el: 'blade', cost: 5, pow: 1.05, st: ['bleed', 3], d: '练过几次抽刀。造成流血 3 回合。' },
  feint: { n: '门后偷袭', ic: '🚪', m: 'n', el: 'blunt', cost: 8, pow: 1.3, first: 1.7, d: '藏在门后，不管进来的是谁先给一锤。对还没出过手的敌人 ×1.7。' },
  flash: { n: '手电直射', ic: '🔦', m: 'n', el: 'light', cost: 6, pow: .5, st: ['weak', 2], stun: .3, d: '强光照脸。伤害低，让对方动摇 2 回合（攻击 -25%），30% 晃懵。' },
  callname: { n: '念出名字', ic: '🗣️', m: 'n', el: 'name', cost: 8, pow: .7, st: ['vuln', 3], d: '镜子游戏教会你的事：名字有分量。让对方出现破绽 3 回合（防御 -30%）。' },
  doll: { n: '布偶护身', ic: '🧸', m: 'n', el: 'none', cost: 10, self: 1, st: ['shield', 2], d: '把父母留下的布偶塞进领口。2 回合内替你挡下三成体力的伤害。' },
  yintong: { n: '阴瞳', ic: '👁️', m: 'n', el: 'none', cost: 10, self: 1, st: ['see', 3], d: '视之不详，通之地阴。3 回合内暴击 +35%，看得见敌人的弱点。' },
  salt: { n: '撒盐', ic: '🧂', m: 'n', el: 'salt', cost: 8, pow: .9, all: 1, st: ['slow', 2], d: '在地上洒一条线。全体盐伤害，禁锢 2 回合（出手变慢，蓄力被打断）。' },
  pigknife: { n: '杀猪刀', ic: '🗡️', m: 'n', el: 'blade', cost: 9, pow: 1.45, ghost: 1.3, st: ['bleed', 3], d: '沾过无数牲畜血的老刀，煞气重。对鬼怪 ×1.3，流血 3 回合。' },
  friday: { n: '黑色星期五', ic: '📀', m: 'b', el: 'sound', cost: 12, pow: .45, all: 1, st: ['fear', 3], d: '那首禁忌之曲。全体恐惧 3 回合（每回合掉一截）。' },
  story: { n: '背景故事', ic: '📖', m: 'd', el: 'story', cost: 5, pow: .4, all: 1, st: ['vuln', 3], d: '“我们脚下，五十年前是九江最大的乱葬岗。”全体心理暗示 3 回合（防线 -30%）。' },
  jump: { n: '开门杀', ic: '🚪', m: 'd', el: 'jump', cost: 0, pow: 1, dark: 1.5, d: '最经典的桥段。不耗精神；漆黑里 ×1.5。' },
  lights: { n: '断电', ic: '💡', m: 'd', el: 'light', cost: 6, pow: .3, all: 1, st: ['dark', 2], d: '控制台一拉闸。全体陷入漆黑 2 回合（开门杀更狠，对方拆穿变难）。' },
  paper: { n: '殓容纸人', ic: '🎎', m: 'd', el: 'doll', cost: 9, pow: 1.1, all: 1, d: '上过妆的纸人，死意里透着生机。全体人偶惊吓。' },
  chase: { n: '碎颅医生', ic: '🥼', m: 'd', el: 'chase', cost: 13, pow: 1.9, stun: .3, d: '换上那件制服，拖着铁锤追。单体 1.9 倍，30% 吓到腿软。' },
  jiayi: { n: '嫁衣', ic: '👰', m: 'd', el: 'sound', cost: 14, pow: .95, all: 1, stun: .25, d: '和冥婚完美契合的曲子，少用为好。全体，25% 腿软。' },
  livedoll: { n: '活偶', ic: '🪆', m: 'd', el: 'doll', cost: 12, pow: 1.5, st: ['mark', 3], d: '你做的人偶像是随时会转头。1.5 倍，留下印记（员工打它 +30%）。' }
};
const SKILL_ORDER = Object.keys(SKILLS);
const STATUS = { stun: ['懵', '跳过一回合'], bleed: ['流血', '每回合掉血'], fear: ['恐惧', '每回合掉一截'], vuln: ['破绽', '防御 -30%'], weak: ['动摇', '攻击 -25%'], slow: ['禁锢', '出手变慢，无法蓄力'], mark: ['印记', '搭档打它 +30%'],
  rage: ['狂怒', '攻击 +25%'], shield: ['护身', '挡下一部分伤害'], see: ['阴瞳', '暴击 +35%'], dark: ['漆黑', '开门杀 ×1.5'], taunt: ['挡在前面', '敌人先打搭档'], bless: ['预知', '下一击必暴击'], brave: ['不退', '攻击 +30%'] };

/* 天赋（噩梦任务的奖励，直接作用在陈歌身上） */
const TALENTS = {
  lianrong: { n: '殓容', d: '只为尸体化妆的手艺。白天吓人的手段伤害 +12%。' }, yintong: { n: '阴瞳', d: '黑夜里也看得清。夜里探索更容易发现东西，学会「阴瞳」。' },
  huoou: { n: '活偶', d: '手变得更灵活，做出的人偶能寄托残念。学会「活偶」。' }, run: { n: '夜跑', d: '平安公寓那晚如果跑得不够快，现在已经埋在土里了。身法 +3。' }
};
/* 称号 */
const TITLES = {
  rookie: { n: '噩梦之城新人', d: '第一次完成噩梦难度日常任务。精神上限 +6。', mp: 6 }, favored: { n: '厉鬼眷顾者', d: '首次抽奖抽中厉鬼。有一定几率获得厉鬼的帮助：绝境时多回 10% 体力。', low: .1 },
  hero: { n: '见义勇为', d: '抓住了五年前灭门案的凶手。体力上限 +20。', hp: 20 }, host: { n: '午夜主播', d: '直播间人气破万。直播时经验 +10%。', exp: .1 }, dater: { n: '非你莫属', d: '完成了红衣厉鬼的好感度任务。', atk: 2 },
  keeper: { n: '第三病栋回归者', d: '从门后走了回来。体力上限 +30，精神上限 +10。', hp: 30, mp: 10 }, boss20: { n: '吓哭医学生', d: '吓晕过法医学院的学生。白天手段 +5%。' }
};

/* 员工（鬼怪团队 + 活人）。moves 按好感 0/25/50/75 解锁 */
const PET_CAT = { atk: '出手', buf: '帮你', deb: '搅乱', def: '护着' };
const PETS = {
  wan: { n: '徐婉', sub: '兼职 · 扮鬼的小姐姐', m: 'd', seal: 'park', hp: .8, atk: .85, moves: [
    { id: 'w1', n: '鬼妻追魂', c: 'atk', el: 'jump', pow: 1.25, d: '从厢房门后钻出来。' }, { id: 'w2', n: '补妆', c: 'buf', st: ['bless', 2], d: '“老板，往这边引。”你下一击必暴击。' },
    { id: 'w3', n: '碎颅医生小婉', c: 'atk', el: 'chase', pow: 1.6, need: 25, stun: .25, d: '制服大了两号，锤子拖在地上。' }, { id: 'w4', n: '挡在出口', c: 'deb', all: 1, pow: .4, st: ['vuln', 2], need: 50, d: '游客回头，出口站着个新娘。' }] },
  xiaoxiao: { n: '殷小小', sub: '厉鬼 · 住在布偶里的小家伙', m: 'b', seal: 'ghost', hp: .6, atk: .7, moves: [
    { id: 'x1', n: '拽衣角', c: 'deb', pow: .5, st: ['mark', 3], d: '对方低头，什么都没有。留下印记。' }, { id: 'x2', n: '躲进布偶', c: 'def', guard: 1, st: ['shield', 2], d: '替你挡一下。她其实比你还怕。' },
    { id: 'x3', n: '捉迷藏', c: 'atk', el: 'doll', pow: .9, stun: .4, need: 25, d: '“找到你了。”40% 吓懵。' }, { id: 'x4', n: '一家人', c: 'atk', el: 'doll', pow: .8, all: 1, st: ['fear', 2], need: 60, d: '四个布偶并排坐在房间正中央。' }] },
  bixian: { n: '笔仙', sub: '特殊种类厉鬼 · 没什么原则', m: 'b', seal: 'ghost', hp: .6, atk: .9, moves: [
    { id: 'b1', n: '预知', c: 'buf', st: ['bless', 2], see: 1, d: '在纸上画了个圈。你下一击必暴击，并看穿对方意图。' }, { id: 'b2', n: '戳眼', c: 'atk', el: 'blade', pow: 1.2, st: ['weak', 2], d: '圆珠笔，笔尖朝前。' },
    { id: 'b3', n: '鬼画符', c: 'deb', all: 1, pow: .4, st: ['vuln', 3], need: 25, d: '纸上的字自己在动。全体破绽。' }, { id: 'b4', n: '送不走', c: 'deb', pow: .6, st: ['slow', 3], need: 50, d: '请来容易，送走难。禁锢 3 回合。' }] },
  baimao: { n: '白猫', sub: '异色瞳 · 你叫它白虎，它不认', m: 'n', seal: 'park', hp: .7, atk: 1, moves: [
    { id: 'm1', n: '扑脸', c: 'atk', el: 'cat', pow: 1.1, brk: 1, d: '直接扑到脸上。必定打断蓄力。' }, { id: 'm2', n: '炸毛', c: 'def', guard: 1, st: ['shield', 2], d: '它先看见了。替你预警。' },
    { id: 'm3', n: '异色瞳', c: 'deb', pow: .3, st: ['mark', 3], need: 25, d: '盯住“它们”。留下印记。' }, { id: 'm4', n: '挠', c: 'atk', el: 'cat', pow: 1.3, st: ['bleed', 3], need: 50, d: '门板上都能留下刻痕的爪子。' }] },
  canmian: { n: '校服残念', sub: '最后一间教室的二十四个名字', m: 'd', seal: 'ghost', hp: .9, atk: .8, moves: [
    { id: 'c1', n: '齐刷刷回头', c: 'atk', el: 'doll', pow: .85, all: 1, d: '二十四个低着头的人偶，同时回头。' }, { id: 'c2', n: '传纸条', c: 'deb', pow: .3, st: ['mark', 3], d: '“你后背有人。”' },
    { id: 'c3', n: '上课', c: 'deb', all: 1, pow: .4, st: ['fear', 3], need: 25, d: '没有人进去过的教室，一到午夜人头攒动。' }, { id: 'c4', n: '点名', c: 'atk', el: 'name', pow: 1.7, need: 50, d: '黑板上多了一个名字。' }] },
  zhangya: { n: '张雅', sub: '红衣厉鬼 · 住在你的影子里', m: 'x', seal: 'red', hp: 9, atk: 3.2, moves: [
    { id: 'z1', n: '黑发', c: 'atk', el: 'none', pow: 1.6, all: 1, d: '如潮水般的黑发。' }, { id: 'z2', n: '撕碎', c: 'atk', el: 'none', pow: 2.6, d: '看不顺眼就直接撕碎。' }] }
};

/* 物品：k = use 消耗 / key 道具库 / gear 佩戴 */
const ITEMS = {
  drink: { n: '功能饮料', ic: '🥤', k: 'use', heal: .4, price: 12, d: '回复 40% 体力。' }, bread: { n: '面包', ic: '🍞', k: 'use', heal: .2, price: 5, d: '回复 20% 体力。' },
  smoke: { n: '香烟', ic: '🚬', k: 'use', mp: .35, price: 8, d: '点一根，冷静一下。回复 35% 精神。' }, coffee: { n: '罐装咖啡', ic: '☕', k: 'use', mp: .7, price: 16, d: '回复 70% 精神。' },
  bandage: { n: '绷带', ic: '🩹', k: 'use', heal: .25, cure: 1, price: 10, d: '回复 25% 体力并止血。' }, saltbag: { n: '袋装盐', ic: '🧂', k: 'use', price: 6, battle: 'salt', d: '战斗里扔出去：全体盐伤害。平时没用。' },
  fruit: { n: '灵果', ic: '🍑', k: 'use', maxhp: 12, d: '转盘里说“增加寿命”的那种。体力上限永久 +12。' },
  phone: { n: '黑色手机', ic: '📱', k: 'key', d: '在父母失踪的地方找到的手机。只有一个应用，用鬼屋的门充当图标。' }, ragdoll: { n: '布偶', ic: '🧸', k: 'key', d: '你小时候做的第一个玩具，和手机一起被找到。' },
  cd: { n: '《黑色星期五》', ic: '📀', k: 'key', d: '背景曲目。据说听过的人会不由自主想起自己最害怕的东西。' }, letter: { n: '被诅咒的情书', ic: '💌', k: 'key', d: '“自高楼坠落的那一刻起，她便成了校园中的禁忌。”你这辈子收到的第一封情书。' },
  notice: { n: '王琦的寻人启事', ic: '📄', k: 'key', d: '怨念值十一。“我每天都在寻找那个被自己杀死的人。”' }, uniform: { n: '碎颅医生的制服', ic: '🥼', k: 'key', d: '服装道具。配一把四十多厘米长的铁锤，和一张人皮面具。' },
  jiayicd: { n: '《嫁衣》', ic: '💿', k: 'key', d: '背景曲目，和冥婚场景完美契合。' }, pen: { n: '怨念缠绕的圆珠笔', ic: '🖊️', k: 'key', d: '（残破）笔仙并不想搭理你，它朝你翻了个白眼，并把自己藏了起来。' },
  key: { n: '自知力钥匙', ic: '🗝️', k: 'key', d: '怨念值十三。“当你出现类似的症状时，这把钥匙可以帮你一次。”' }, tape: { n: '哭泣的磁带', ic: '📼', k: 'key', d: '稀有类特殊道具。按下播放键，只有哭声。现在它还不肯理你。' },
  candy: { n: '白色情人节糖果', ic: '🍬', k: 'key', d: '香甜的味道萦绕在舌尖，当你吃掉糖果时，张雅就会出现。只有一颗。' }, medal: { n: '荣誉奖章', ic: '🎖️', k: 'key', d: '市分局发的。颜队长亲手给你别上的。' },
  ticketbooth: { n: '午夜售票台（残缺）', ic: '🎟️', k: 'key', d: '特殊建筑。有千分之一的概率吸引到特殊的“游客”。' }, shoes: { n: '红舞鞋', ic: '🩰', k: 'key', d: '被血染成黑红色的芭蕾舞鞋。已经交给警方，这是你记在心里的那一双。' },
  /* 佩戴 */
  g_torch: { n: '强光手电', ic: '🔦', k: 'gear', price: 60, d: '手电直射伤害 +40%，夜里探索更容易先发现对方。', sk: { flash: 1.4 } }, g_shoes: { n: '跑鞋', ic: '👟', k: 'gear', price: 80, d: '身法 +4。逃跑必定成功。', spd: 4 },
  g_coat: { n: '带小猫气味的外套', ic: '🧥', k: 'gear', d: '白猫的孩子躺过。白猫出手 +15%。', pet: { baimao: 1.15 } }, g_mask: { n: '人皮面具', ic: '🎭', k: 'gear', d: '碎颅医生的脸。追逐类手段 +25%，夜里对活人的惊吓：开场对方动摇 2 回合。', sk: { chase: 1.25 }, awe: 1 },
  g_cam: { n: '高清摄像机', ic: '📹', k: 'gear', d: '刘刀工作室借你的。直播人气涨得更快，夜里经验 +10%。', exp: .1 }, g_raincoat: { n: '雨衣', ic: '🥾', k: 'gear', price: 30, d: '体力上限 +15。', hp: 15 }
};

/* 对手。hp/atk/def 是倍率；k = human 活人 / ghost 鬼怪 / visitor 游客。moves: p 威力 w 权重 ch 蓄力大招 */
const MOBS = {
  /* —— 游客（白天） —— */
  stu: { n: '学生', k: 'visitor', hp: .8, atk: .8, def: .8, spd: 9, weak: ['jump'], mv: [{ n: '“道具太假”', p: .9, w: 3 }, { n: '打游戏分心', p: .5, w: 1 }] },
  skeptic: { n: '唯物主义者', k: 'visitor', hp: 1.1, atk: 1, def: 1.2, spd: 8, weak: ['sound'], mv: [{ n: '“无所畏惧！”', p: 1, w: 3 }, { n: '现场科普', p: 1.2, w: 1, st: ['weak', 2] }] },
  couple: { n: '情侣', k: 'visitor', hp: .9, atk: .9, def: .9, spd: 10, weak: ['doll'], mv: [{ n: '搂紧一点', p: .7, w: 2 }, { n: '“有我在”', p: 1, w: 2 }] },
  med: { n: '医学生', k: 'visitor', hp: 1.2, atk: 1.05, def: 1.3, spd: 9, weak: ['sound', 'story'], mv: [{ n: '“真的尸体我都见过”', p: 1, w: 3 }, { n: '点评道具做工', p: 1.3, w: 1 }] },
  tough: { n: '壮汉', k: 'visitor', hp: 1.5, atk: 1.2, def: 1, spd: 7, weak: ['chase'], mv: [{ n: '“就这？”', p: 1.1, w: 3 }, { n: '撸袖子', p: 1.6, w: 1, ch: 1, cn: '要去掀道具' }] },
  vlog: { n: '探店主播', k: 'visitor', hp: 1, atk: 1.2, def: 1, spd: 11, weak: ['light'], mv: [{ n: '怼脸拍机关', p: 1.2, w: 3 }, { n: '“家人们，都是假的”', p: 1.5, w: 1, ch: 1, cn: '要对着镜头拆穿' }] },
  heshan: { n: '鹤山', k: 'visitor', hp: 1, atk: .7, def: .8, spd: 10, weak: ['jump', 'doll'], mv: [{ n: '躲到学姐身后', p: .5, w: 3 }, { n: '“学姐等等我！”', p: .7, w: 1 }] },
  gaoru: { n: '高汝雪', k: 'visitor', boss: 1, hp: 2, atk: 1.2, def: 1.5, spd: 11, weak: ['sound'], mv: [{ n: '“吊不死人的高度”', p: 1.1, w: 3 }, { n: '逐条分析你的心理暗示', p: 1.7, w: 1, ch: 1, cn: '要把你的套路全说破' }] },
  feiyl: { n: '费友亮', k: 'visitor', boss: 1, hp: 2, atk: 1.3, def: 1.2, spd: 9, weak: ['doll', 'name'], mv: [{ n: '“铁骨铮铮！”', p: 1.2, w: 3 }, { n: '举着摄像头找员工', p: 1.7, w: 1, ch: 1, cn: '要拍下“殴打游客”的证据' }] },
  zhujn: { n: '朱佳宁', k: 'visitor', hp: 1.3, atk: 1, def: 1, spd: 10, weak: ['jump'], mv: [{ n: '给外面打电话', p: 1, w: 2 }, { n: '“友亮你后背有人”', p: .6, w: 1 }] },
  wanghl: { n: '王海龙', k: 'visitor', boss: 1, hp: 2.2, atk: 1.3, def: 1.2, spd: 9, weak: ['doll', 'sound'], mv: [{ n: '“两万块我拿定了”', p: 1.2, w: 3 }, { n: '一把抓向校牌', p: 1.8, w: 1, ch: 1, cn: '要硬闯人偶堆' }] },
  wangwl: { n: '王文龙', k: 'visitor', hp: 1.3, atk: 1, def: 1, spd: 9, weak: ['jump'], mv: [{ n: '“老板说话算数吗”', p: 1, w: 2 }, { n: '给哥哥壮胆', p: .8, w: 1 }] },
  /* —— 活人（夜里） —— */
  tattoo: { n: '纹身男', k: 'human', hp: 1.1, atk: 1, def: .9, spd: 10, weak: ['light'], mv: [{ n: '钢钎横扫', p: 1, w: 3 }, { n: '堵楼梯口', p: .6, w: 1, st: ['slow', 2] }] },
  landlord: { n: '跛脚房东', k: 'human', hp: 1.2, atk: 1.1, def: 1, spd: 7, weak: ['blunt'], mv: [{ n: '菜刀', p: 1.1, w: 3 }, { n: '扔菜刀', p: 1.7, w: 1, ch: 1, cn: '举起了菜刀' }] },
  wangqi: { n: '王琦', k: 'human', boss: 1, hp: 2.3, atk: 1.15, def: 1, spd: 9, weak: ['name', 'light'], mv: [{ n: '斧头', p: 1, w: 3 }, { n: '“我也不想这样的……”', p: .5, w: 1, st: ['weak', 2] }, { n: '劈砍', p: 2, w: 1, ch: 1, cn: '把斧头举过了头顶' }] },
  zhangpeng: { n: '张鹏', k: 'human', boss: 1, hp: 2.2, atk: 1.2, def: 1, spd: 11, weak: ['blunt', 'chase'], mv: [{ n: '尖刀', p: 1, w: 3, st: ['bleed', 2] }, { n: '乱捅', p: 1.9, w: 1, ch: 1, cn: '红着眼冲过来' }] },
  aunt: { n: '范郁的姑姑', k: 'human', boss: 1, hp: 2, atk: 1.15, def: .9, spd: 10, weak: ['name', 'blunt'], mv: [{ n: '石块', p: 1, w: 3 }, { n: '从背后推', p: 1.9, w: 1, ch: 1, cn: '绕到了你身后' }] },
  onearm: { n: '独臂男人', k: 'human', hp: 1.3, atk: 1.1, def: 1, spd: 9, weak: ['blunt'], mv: [{ n: '那只“还在”的手', p: 1, w: 3 }, { n: '锯子', p: 1.5, w: 1, st: ['bleed', 2] }] },
  xiong: { n: '畸形脸 · 熊青', k: 'human', boss: 1, hp: 2.4, atk: 1.2, def: 1.1, spd: 10, weak: ['blunt', 'light'], mv: [{ n: '掰向一边', p: 1.05, w: 3 }, { n: '“只剩半边才顺眼”', p: 2, w: 1, ch: 1, cn: '歪着头，在比划你的左半边' }, { n: '怪笑', p: .4, w: 1, st: ['weak', 2] }] },
  drunk: { n: '醉汉', k: 'human', hp: .9, atk: .9, def: .8, spd: 6, weak: ['light'], mv: [{ n: '酒瓶', p: 1, w: 2 }, { n: '骂骂咧咧', p: .5, w: 1 }] },
  dog: { n: '野狗', k: 'human', hp: .8, atk: 1, def: .7, spd: 13, weak: ['blunt', 'light'], mv: [{ n: '扑咬', p: 1, w: 3, st: ['bleed', 2] }, { n: '（龇牙，绕着你转）', p: .4, w: 1 }] },
  /* —— 鬼怪 —— */
  remnant: { n: '残念', k: 'ghost', hp: .8, atk: .8, def: .7, spd: 9, weak: ['name', 'salt'], mv: [{ n: '（贴在你背后）', p: .9, w: 3 }, { n: '（低声重复一句话）', p: .5, w: 1, st: ['fear', 2] }] },
  chairgirl: { n: '椅子里的女生', k: 'ghost', hp: 1.05, atk: .95, def: .9, spd: 9, weak: ['blunt', 'name'], mv: [{ n: '（按你坐下）', p: 1, w: 3 }, { n: '（哀求变成怨毒）', p: .5, w: 1, st: ['fear', 2] }, { n: '勒住脖颈', p: 1.7, w: 1, ch: 1, cn: '椅子自己转了过来' }] },
  mirror: { n: '镜中怪物', k: 'ghost', boss: 1, hp: 2.4, atk: 1.2, def: 1.1, spd: 11, weak: ['light', 'cat'], mv: [{ n: '（一只手按住你的头）', p: 1.1, w: 3 }, { n: '（切割声）', p: .5, w: 1, st: ['fear', 3] }, { n: '往外撞', p: 2, w: 1, ch: 1, cn: '镜面出现了裂痕' }] },
  redshadow: { n: '红影', k: 'ghost', hp: 1.5, atk: 1, def: 1, spd: 12, weak: ['blunt', 'light'], mv: [{ n: '（探头进隔间）', p: 1, w: 3 }, { n: '（拉门把手）', p: .6, w: 1, st: ['fear', 2] }] },
  twoface: { n: '两张脸的黑影', k: 'ghost', boss: 1, hp: 2.3, atk: 1.15, def: 1.1, spd: 10, weak: ['cat', 'light', 'name'], mv: [{ n: '（两张脸互相咒骂）', p: .5, w: 1, st: ['weak', 2] }, { n: '（从镜子里伸手）', p: 1.1, w: 3 }, { n: '拽进镜子', p: 2, w: 1, ch: 1, cn: '镜面像水一样晃了一下' }] },
  nurse: { n: '女护士', k: 'ghost', boss: 1, hp: 2.6, atk: 1.2, def: 1.2, spd: 9, weak: ['blade', 'cat'], mv: [{ n: '（腰部弯折，缠上来）', p: 1.1, w: 3 }, { n: '（发药）', p: .5, w: 1, st: ['slow', 2] }, { n: '“该吃药了”', p: 2, w: 1, ch: 1, cn: '对照着笔记本，念到了你的名字' }] },
  tallone: { n: '瘦长怪物', k: 'ghost', boss: 1, hp: 2.4, atk: 1.2, def: 1.2, spd: 10, weak: ['blade', 'cat'], mv: [{ n: '（踩上肩膀）', p: 1.2, w: 3 }, { n: '“看谁先开口说话”', p: .5, w: 1, st: ['fear', 3] }, { n: '吞下去', p: 2.2, w: 1, ch: 1, cn: '白布下面露出了几张人脸' }] },
  dean: { n: '红衣 · 老院长', k: 'ghost', boss: 1, hp: 3.4, atk: 1.3, def: 1.25, spd: 10, weak: ['name', 'blade'], mv: [{ n: '（一步就到了面前）', p: 1.15, w: 3 }, { n: '“送我离开？”', p: .5, w: 1, st: ['weak', 2] }, { n: '红衣翻涌', p: 2.1, w: 1, ch: 1, all: 1, cn: '身上的红衣在往外渗' }] },
  doorhand: { n: '门后的手', k: 'ghost', hp: 1.6, atk: 1.2, def: 1.3, spd: 8, weak: ['blade', 'salt'], mv: [{ n: '（长满毛发的手）', p: 1.1, w: 3 }, { n: '撞门', p: 1.8, w: 1, ch: 1, cn: '门板在往外鼓' }] }
};

/* 鬼屋里的场景：star = 尖叫指数 */
const SCENES = {
  zombie: { n: '僵尸复活夜', star: 0, d: '糟糕的道具、差劲的演员，毫无故事性和逻辑可言。', pool: ['stu', 'stu', 'couple'] },
  mh: { n: '冥婚', star: .5, d: '生时非夫妇，死者葬同穴，鬼妻追魂。', pool: ['stu', 'couple', 'skeptic', 'med'] },
  ws: { n: '午夜逃杀', star: 1, d: '破旧的公寓楼内住进了一个危险的精神病患者，他手持剪刀和铁锤，正在你的房门外徘徊。', pool: ['stu', 'med', 'tough', 'couple', 'skeptic'] },
  room: { n: '三个人的房间', star: 1, d: '屋子里有三个“人”。你数到了几个？', pool: ['couple', 'vlog', 'skeptic', 'med'] },
  my: { n: '暮阳中学', star: 2, d: '没有出口，只有一个入口。二十分钟内找到二十个校牌。', pool: ['tough', 'vlog', 'med', 'skeptic', 'tough'] },
  ward: { n: '第三病栋', star: 3, d: '这座废弃的医院每到深夜都会发出奇怪的声音，你作为报社记者将进入一探究竟。', pool: ['tough', 'vlog', 'med', 'tough', 'vlog'] }
};
const starTxt = s => s <= 0 ? '无' : (s === .5 ? '半颗星' : '★'.repeat(Math.floor(s)) + (s % 1 ? '½' : ''));
