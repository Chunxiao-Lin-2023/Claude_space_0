/* ================= what enemies say in battle, and the rumours that drift across the location picture =================
   SAY: open (when the fight starts), low (under a quarter of its health), die (when it falls). Beasts don't talk — their lines are
   what they do, in （）. 小不点 sometimes answers back.
   RUMORS: one-liners heard from other people — what others saw of things that already happened, or a hint of what comes next.
   Each has from / to (main quest steps) like CHATTER, so nobody talks about what hasn't happened; build.py checks them. */
const SAY = {
  boar: { open: ['（獠牙野猪刨了刨蹄子，鼻孔里喷出两股白气。）'], low: ['（它哼哼着往后退了两步，又不甘心地冲上来。）'], die: ['（它轰地一声侧倒在地，四条腿蹬了两下。）'] },
  wolf: { open: ['（山狼压低身子，龇出一嘴黄牙。）', '（一声狼嚎，林子里远远有几声应和。）'], low: ['（它夹起了尾巴，可眼睛还死死盯着你的脖子。）'], die: ['（山狼呜咽了一声，不动了。）'] },
  monkey: { open: ['（石猿捶着胸口，捡起一块石头掂了掂。）'], low: ['（它把手里的石头扔了，转身想往石柱上爬。）'] },
  snake: { open: ['（青鳞蛇盘成一团，信子一吐一吐。）'] },
  owl: { open: ['（夜枭的眼睛在黑暗里亮得像两盏小灯。）'], die: ['（它扑腾了两下翅膀，掉进了草丛。）'] },
  rhino: { open: ['（两个脑袋一齐转过来，四只眼睛全红了。）'], low: ['（一个脑袋耷拉下来，另一个还在拼命喷火。）'], die: ['（火犀跪倒在地，两个脑袋同时垂了下去。）'] },
  eagle: { open: ['（青鳞鹰一声尖啸，翅膀一收，从云里直扎下来。）'], low: ['（它的鳞羽掉了一地，可攻势一点没慢。）'] },
  tombguard: { open: ['（石兽的眼眶里亮起两点绿火。）'], die: ['（石兽碎成了一地石块。）'] },
  tombbat: { open: ['（黑压压一片翅膀扑了上来，吱吱乱叫。）'] },
  suanni: { open: ['……又一个来抢骨头的？', '小娃娃。你身上……有股味道。'], low: ['你……想要我的宝术？那就拿出本事来。'], die: ['……好。给你了。'] },
  beihunter: { open: ['就是这小崽子！围住他！', '狈村的箭，可不长眼睛。'], low: ['这、这娃娃是什么怪物……'], die: ['风狈哥……给我报仇……'] },
  fengbei: { open: ['拿了狻猊宝珠，就想全须全尾地回去？', '我风狈从不跟小孩子一般见识——今天破个例。'], low: ['不可能……我是狈村这一代最强的！'], die: ['我……输给了……一个奶娃娃……'] },
  bandit: { open: ['小孩，把身上值钱的都留下！', '哟，送上门来的？'], low: ['点子扎手！扯呼——'], die: ['老、老大……这娃娃不对劲……'] },
  jiling: { open: ['嘻嘻嘻……新鲜的血肉……', '……你的魂，闻起来真香……'], low: ['不……我不想回到骨牌里去……'], die: ['……又是……一片黑……'] },
  tiger: { open: ['（黑纹虎甩了甩尾巴，喉咙里滚出一声闷雷似的低吼。）'], low: ['（它的呼噜声变成了喘息，可还是挡在洞口。）'] },
  ape: { open: ['（雷猿拳头上的电光噼啪作响。）'] },
  puppet: { open: ['（铜傀儡的阵纹一亮，咔咔地抬起了胳膊。）'], die: ['（阵纹熄了，铜人哐当一声倒在地上。）'] },
  senior: { open: ['新来的，师兄教你做人。', '一个月的份例都不肯交？那就打到你肯交。'], low: ['等、等等！有话好好说！'], die: ['……诡爷要是知道了……'] },
  wisp: { open: ['（幽绿的火苗绕着你转圈，像在打量你。）'], die: ['（火苗“噗”地一声灭了，只剩一缕青烟。）'] },
  lion: { open: ['（九个脑袋同时吼了一声，山顶的碎石哗哗往下滚。）'], low: ['（有几个脑袋已经抬不起来了，剩下的吼得更凶。）'], die: ['（巨狮缓缓趴下，九个脑袋一个接一个闭上了眼睛。）'] },
  yuzu: { open: ['补天阁的？正好拿你开刀。', '雨族办事，闲人滚开。'], low: ['冰甲……碎了？！'], die: ['高手大人……会替我们……'] },
  bigwolf: { open: ['（白狼呼出一口寒气，地上的沙子都结了霜。）'] },
  yuchief: { open: ['虚神界里那个大荒来的？在这儿，可没人护着你。', '百断山里死个把人，再正常不过。'], low: ['你……你这是什么宝术？！'], die: ['雨族……不会……放过你……'] },
  dahongbird: { open: ['（大红鸟歪着脑袋看你手里的肉，口水滴了下来。）'], low: ['（它气得羽毛炸开，嘎嘎乱叫。）'] },
  scorpion: { open: ['（毒蝎的尾针高高翘起，滴着绿色的汁液。）'] },
  whitetiger: { open: ['（白虎盯着你，一步一步踱过来，杀气重得压人。）'], low: ['（它身上的白毛染红了一片，眼神反倒更冷了。）'] },
  jinpeng: { open: ['（金鹏在天上盘旋，半边身子的金光刺得人睁不开眼。）'], low: ['（它的叫声变了调，带着一股不甘。）'] },
  bonewraith: { open: ['……谁……还活着……'], die: ['……终于……可以睡了……'] },
  boneking: { open: ['……又有人……来扰我……', '……我活着的时候……天都要让我三分……'], low: ['……这具骨头……老了……'], die: ['……记住……天骨……'] },
  pumo: { open: ['（树皮上一张张人脸同时咧开了嘴。）', '（花粉飘了过来，你好像听见有人在叫你的小名。）'], low: ['（树根在地上乱抽，几张人脸在尖叫。）'], die: ['（大树轰然倒下，那些人脸像烟一样散了。）'] },
  monkeyking: { open: ['偷我的桃？', '……小东西，胆子不小。'] },
  peach: { open: ['（一群猴子吱吱乱叫，专往你脸上挠。）'] },
  leishou: { open: ['（雷池古兽睁开眼睛，整个坑底都被照亮了。）'], low: ['（它鳞甲缝里的电光开始乱窜，压不住了。）'], die: ['（最后一道雷光从它身上散出去，坑底安静了。）'] },
  r_rhino: { open: ['（独角兕低下头，角尖对准了你，前蹄一下一下刨地。）'] },
  r_snake: { open: ['（赤鳞巨蟒慢慢抬起头，比你高出三个你。）'] },
  r_bird: { open: ['（雷翅雕的翅膀一扇，你的头发全竖了起来。）'] },
};
const RIVAL_SAY = {
  rival: { open: ['大荒来的？听都没听过。', '让你三招。', '光幕上的名字，可不是凭运气挂上去的。'], low: ['……有两下子。', '不可能！'], die: ['我记住你了。', '下回，可没这么便宜。'] },
  shiyi: { open: ['……你的眼睛里，有不服。', '来吧。让我看看，大荒能长出什么。'], low: ['……有意思。'], die: ['……第一，你先拿着。'] },
};
const RETORT = ['……你话真多。', '打完再说。', '我饿了，快点。', '你说完了？', '族长说，话多的都打不过我。'];
const sayOf = u => u.kind === 'rival' ? RIVAL_SAY[u.shiyi ? 'shiyi' : 'rival'] : SAY[u.mob];
function battleSay(B, u, kind) { const S = sayOf(u); if (!S || !S[kind] || !S[kind].length) return null; const t = pick(S[kind]); fxe(B, { k: 'say', t: u.id, text: t }); blog(B, `<span class="taunt"><span class="foe">${esc(u.name)}</span>：${t.startsWith('（') ? t : '「' + t + '」'}</span>`); return t; }

/* ---------- 江湖传闻 ---------- */
const RUMORS = [
  { from: 'q_wolf0', to: 'q_egg0', who: '邻村猎户', t: '石村有个三四岁的娃娃，举得动青铜大鼎？你喝多了吧。' },
  { from: 'q_wolf', to: 'q_egg', who: '赶山的老汉', t: '山林里的狼群这两天少了一大截，不知道被哪路人物收拾了。' },
  { from: 'q_tomb0', to: 'q_tomb', who: '邻村猎户', t: '石林那只青鳞鹰发了狂，撞断了半片林子——听说是几个娃娃掏了它的窝。' },
  { from: 'q_tomb0', to: 'q_bei', who: '路过的行脚商', t: '石林深处的古墓开了，好几个村子的人都往那儿跑，说里面有狻猊的宝骨。' },
  { from: 'q_yaoding', to: 'q_shanbao', who: '狈村的逃难人', t: '风狈……被一个小娃娃打趴下了。这话可别让烈老听见。' },
  { from: 'q_yaoding', to: 'q_ruin', who: '狈村猎手', t: '烈老回来以后一句话没说，把自己关在屋里关了三天。' },
  { from: 'q_shanbao', to: 'q_shanbao', who: '远处的猎人', t: '大荒深处那几天天都是红的，听说是有几头了不得的东西在争什么宝贝。' },
  { from: 'q_ruin', to: 'q_jijing', who: '迁徙的兽群', t: '（远处的山谷里，一群凶兽正绕着冒烟的火山口往外迁。）' },
  { from: 'q_ruin', to: 'q_memory', who: '邻村猎户', t: '石村那块地被岩浆吞了，可村里人一个都没少。也是怪事。' },
  { from: 'q_jijing', to: 'q_qingfeng', who: '过路的兽车商队', t: '出山的古道又不太平了，听说有伙山贼在那边落了脚。' },
  { from: 'q_memory', to: 'q_bandit0', who: '过路的兽车商队', t: '有辆往外走的兽车在古道上翻了，车上是一老一小，也不知道活下来没有。' },
  { from: 'q_bandit', to: 'q_leave', who: '山贼的余党', t: '老大的祭灵都被一个娃娃打散了……咱们赶紧换个山头吧。' },
  { from: 'q_xushen', to: 'q_gate', who: '虚神界里的少年', t: '那个从大荒来的，光幕上的名字一天一个样，跟坐了雷翅雕似的。' },
  { from: 'q_xushen0', to: 'q_leave', who: '过路的兽车商队', t: '补天阁又要收徒了，带上补天石去山门就行。' },
  { from: 'q_leave', to: 'q_lotus', who: '补天阁外门弟子', t: '虎穴里那朵黑莲，我听说已经好几年没人摘回来过了。' },
  { from: 'q_join', to: 'q_lei', who: '补天阁外门弟子', t: '扛着半扇虎肉进山门的那个，就是他。阁主亲自开的口。' },
  { from: 'q_bully', to: 'q_lib', who: '补天阁弟子', t: '诡爷开口了！我在阁里待了六年，头一回听见他出声。' },
  { from: 'q_lei', to: 'q_qf2', who: '雷池的师兄', t: '那个新来的小师弟，才坐了几天，雷光就绕着他的手指转了。' },
  { from: 'q_lib', to: 'q_baiduan', who: '藏经阁的扫地弟子', t: '第五层的锁又被人摸开了……守阁人说他知道是谁，但他不说。' },
  { from: 'q_qf1', to: 'q_qf3', who: '补天阁外门弟子', t: '外门那个叫清风的姑娘，每天练拳练到后半夜，木桩都打裂了两根。' },
  { from: 'q_lib', to: 'q_bdgate', who: '补天阁弟子', t: '百断山快开了，各族的天才都往这边赶。火国的公主好像也要来。' },
  { from: 'q_bdgate', to: 'q_lion', who: '火国侍卫', t: '公主说大荒来的那个小子“没规矩”。……可她说的时候在笑。' },
  { from: 'q_bdgate', to: 'q_yu', who: '雨族少年', t: '补天阁那个小子在虚神界抢了我们的名次。进了百断山，有他好看。' },
  { from: 'q_lion', to: 'q_cliff', who: '断山里的散修', t: '分宝崖上的兵器，几百年没人拔出来过。都说它们在等人。' },
  { from: 'q_yu', to: 'q_spring', who: '断山里的散修', t: '雨族那几个人吃了大亏，说是被一只大红鸟连人带冰叼走了。' },
  { from: 'q_cliff', to: 'q_spring', who: '各族少年', t: '不老泉边守着两头凶物，谁也不敢先过去。' },
  { from: 'q_spring', to: 'q_mount', who: '各族少年', t: '花果山上的猴王脾气不好。桃子碰不得——碰了就是把命押上去。' },
  { from: 'q_mount', to: 'q_return', who: '逃出来的少年', t: '神猴王被一只从天外伸进来的手拍翻了！那是什么人物？' },
  { from: 'q_end', to: 'q_end', who: '补天阁弟子', t: '神藤的葫芦又鼓起来了，阁主这几天走路都带风。' },
  { from: 'q_end', to: 'q_end', who: '过路的兽车商队', t: '外面的天下大着呢。听说更远的地方，有好些比补天阁大得多的地方。' },
  { from: 'q_end', to: 'q_end', who: '虚神界里的少年', t: '光幕最前面那个带“重瞳”的名字，最近好像很少出现了。' },
  { from: 'q_wolf0', to: 'q_wolf', who: '邻村的娃娃', t: '石村有个娃娃迎霞锻体，霞光吸多了，打了一早上的嗝。' },
  { from: 'q_egg0', to: 'q_egg', who: '赶山的老汉', t: '前两天在山里捡了张狼皮，剥得歪歪扭扭的，跟狗啃的一样——这手艺，八成是个娃娃。' },
  { from: 'q_tomb0', to: 'q_tomb', who: '石林的采药人', t: '石林上空老有一只大鹰在转圈，叫得那叫一个惨，跟被人掏了老窝似的。' },
  { from: 'q_bei', to: 'q_yaoding', who: '邻村的猎手', t: '狻猊墓里出来个娃娃，比墓门还矮。我们二十几个大人进去，被抬出来十几个。' },
  { from: 'q_bei', to: 'q_yaoding', who: '走村的货郎', t: '狈村在悬赏一个娃娃，赏金是一头肥羊。……这价开得也太看不起人了。' },
  { from: 'q_yaoding', to: 'q_shanbao', who: '狈村的小孩', t: '我娘说我再不听话，就把我送去石村，给那个小不点当沙包。' },
  { from: 'q_shanbao', to: 'q_ruin', who: '隔壁村的大婶', t: '石村那口药鼎熬了三天三夜，药味飘了十里地，我家的鸡到现在都不下蛋。' },
  { from: 'q_ruin', to: 'q_jijing', who: '逃难的猎户', t: '岩浆冲下来那天，有人说石村的人是从一道光里走掉的。说的人自己都不信。' },
  { from: 'q_ruin', to: 'q_jijing', who: '林子里的采药人', t: '大荒深处多了一只金毛小猴，偷东西专挑兽奶罐子，抓都抓不住。' },
  { from: 'q_memory', to: 'q_qingfeng', who: '火国的商队', t: '我们公主前几天骑着火鸟在大荒上转了一圈，回来说看见一个“特别能打的小矮子”。' },
  { from: 'q_memory', to: 'q_qingfeng', who: '邻村的猎户', t: '“大荒几百年没人走到搬血极境了”——这话是谁传出来的？石村族长喝多了自己说的。' },
  { from: 'q_qingfeng', to: 'q_bandit0', who: '邻村的猎户', t: '石村族长屋里的灯，那天晚上亮了一整夜。' },
  { from: 'q_bandit0', to: 'q_bandit', who: '古道边的茶摊老板', t: '那几头黑罴是被一个娃娃打死的？难怪这两天来喝茶的猎户，都把弓藏到桌子底下了。' },
  { from: 'q_xushen0', to: 'q_leave', who: '山贼的余党', t: '别问了。问就是这辈子不想再看见小孩。' },
  { from: 'q_leave', to: 'q_lotus', who: '虚神界里的少年', t: '大荒来的那个，打完了会问对面“你们族的人好吃吗”。我们族老让我们离他远点。' },
  { from: 'q_leave', to: 'q_gate', who: '虚神界里的少女', t: '那个小矮子赢了以后，在石台上蹲了半天找吃的。虚神界里哪有吃的啊！' },
  { from: 'q_gate', to: 'q_lotus', who: '古道上的车夫', t: '有两个娃娃搭我的车去补天阁，男娃一路问了我十七遍“这牛能吃吗”。那是犀，不是牛。' },
  { from: 'q_lotus', to: 'q_join', who: '补天阁外门弟子', t: '今年来拜师的有个娃娃，排队的时候把前头那人的干粮吃了一半，还夸人家手艺好。' },
  { from: 'q_bully', to: 'q_lei', who: '补天阁伙房的厨子', t: '新来的小师弟一顿吃了九碗饭。我掌勺二十年，头一回被吃怕了。' },
  { from: 'q_lei', to: 'q_qf1', who: '补天阁外门弟子', t: '那几个收份例的师兄，现在走路都绕着内院。听说是被新来的娃娃挨个“讲了讲道理”。' },
  { from: 'q_qf1', to: 'q_lib', who: '雷池的师兄', t: '雷池边那个小师弟又被劈了，他冲着天喊“再来一个！”。我们都躲远了。' },
  { from: 'q_qf2', to: 'q_baiduan', who: '藏经阁的扫地弟子', t: '藏经阁里少了三本书，多了一堆啃干净的骨头。守阁人的胡子都气翘了。' },
  { from: 'q_baiduan', to: 'q_bdgate', who: '补天阁外门弟子', t: '外门小比那天，清风一拳把守关师兄送出了场子。现在外门都管她叫“清风姐”。' },
  { from: 'q_qf3', to: 'q_bdgate', who: '补天阁弟子', t: '阁主点了小师弟去百断山。诡爷听说以后，只说了一个字：“……吵。”' },
  { from: 'q_lion', to: 'q_yu', who: '火国侍卫', t: '公主的火鸟被一只大红鸟抢了肉。公主说，要亲手把那只鸟拔成秃子。' },
  { from: 'q_yu', to: 'q_cliff', who: '断山里的散修', t: '九头狮倒了。动手的是补天阁那娃娃和火国公主——到底谁出力多，两个人吵了一路。' },
  { from: 'q_cliff', to: 'q_spring', who: '雨族少年', t: '我们的人说，补天阁那小子被冻成冰雕的时候都在笑。……他是不是脑子不太好？' },
  { from: 'q_spring', to: 'q_tiangu', who: '断山里的散修', t: '分宝崖上那把锈剑被拔走了！拔它的人还嫌它锈，说回去拿沙子磨一磨。' },
  { from: 'q_tiangu', to: 'q_mount', who: '各族少年', t: '不老泉边，云曦仙子居然出手帮了人。帮的是谁？一个满脸是血、还冲她傻笑的小矮子。' },
  { from: 'q_mount', to: 'q_return', who: '断山里的散修', t: '天骨禁区那堆骨头塌了。有人说塌之前，里面传出半句“记住……”。记住啥，没说完。' },
  { from: 'q_return', to: 'q_end', who: '各族少年', t: '神猴王那两个桃到底被谁摘了？现在百断山出来的人，人人都说是自己摘的。' },
  { from: 'q_end', to: 'q_end', who: '补天阁伙房的厨子', t: '小师弟从百断山回来，第一件事不是去见阁主，是来伙房找吃的。' },
  { from: 'q_end', to: 'q_end', who: '补天阁弟子', t: '外门的人都在学小师弟那句“这能吃吗”。诡爷听见了，说：“……吵。”' },
  { from: 'q_end', to: 'q_end', who: '过路的兽车商队', t: '大荒里现在流行一句话：出门遇见背着锈剑的小矮子，先把干粮藏好。' },
  { from: 'q_end', to: 'q_end', who: '捎话的猎户', t: '石村的大壮让我捎句话：“村里的兽奶罐子没人偷了，二猛说怪没意思的。”' },
  { from: 'q_end', to: 'q_end', who: '石国来的行商', t: '石国皇都要办天骄会了，各族的少年天才都在往那边赶。你不去凑凑热闹？' },
];
/* heard rumours are kept in the save (C.rumorLog) so they can be reread under 📜 记录 → 江湖传闻; co-op guests see the host's */
function rumorTick() {
  if (STATE.mode !== 'play' || !C || NETROLE === 'guest' || curMode() !== 'explore' || UI.nav || now() < (UI.rumorNext || 0)) return; UI.rumorNext = now() + rint(35000, 60000);
  const q = C.story.q, A = RUMORS.filter(r => q >= qi(r.from) && q <= qi(r.to)); if (!A.length) return;
  const heard = new Set((C.rumorLog || []).map(r => r.t)); // each rumour is heard once per save; when they run out, it stays quiet until the story moves on
  const L = A.filter(r => !heard.has(r.t)); if (!L.length) return;
  const r = pick(L); C.rumorLog = (C.rumorLog || []).concat([{ who: r.who, t: r.t, day: C.day || 1, at: C.loc, nt: isNight() ? 1 : 0, n: (C.rumorN = (C.rumorN || 0) + 1) }]).slice(-300);
  logLine(`【传闻 · ${esc(r.who)}】${r.t}`, 'rumor dim'); save(); renderRumor(); netSync(); }
const rumorWide = () => document.body.classList.contains('cols');
function renderRumor() { // wide screens: the last three, always there; phones: the newest one floats by for a few seconds
  const e = $('rumor'); if (!e || !C) return; const L = C.rumorLog || []; if (!L.length) { e.className = ''; e.innerHTML = ''; return; } const last = L[L.length - 1];
  if (rumorWide()) { e.className = 'multi'; e.innerHTML = L.slice(-3).reverse().map((r, i) => `<div class="rl ${i === 0 && UI.rumorKey !== last.n ? 'new' : ''}"><span class="rw">${esc(r.who)}</span>${r.t}</div>`).join('') + `<div class="rmore">江湖传闻 · 共 ${L.length} 条 ›</div>`; UI.rumorKey = last.n; return; }
  if (UI.rumorKey === last.n && e.classList.contains('one')) return; const fresh = UI.rumorKey !== last.n; UI.rumorKey = last.n; if (!fresh) { e.className = ''; return; }
  e.innerHTML = `<span class="rw">${esc(last.who)}</span>${last.t}<span class="rmore"> ›</span>`; e.className = ''; void e.offsetWidth; e.className = 'one on'; clearTimeout(UI.rumorT); UI.rumorT = setTimeout(() => e.classList.remove('on'), 9000); }
function openRumors() { UI.logTab = 'rumor'; if (UI.nav === 'log') { sfx('click'); renderSide(); } else navTo('log'); }
