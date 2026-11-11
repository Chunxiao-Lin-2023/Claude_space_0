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
  { at: 'shicun', from: 'q_jijing', to: 'q_memory', who: 'ermeng', t: '毛球又把我家的兽奶罐子掀翻了！小不点，你管管它！' },
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
  // more voices (2026-11): running jokes, everyone has a personality
  { at: 'sc_street', from: 'q_wake', to: 'q_egg', who: 'dazhuang', t: '我昨晚梦见一头烤好的野猪自己跑到我嘴边……醒了发现在啃枕头。' },
  { at: 'sc_street', from: 'q_egg0', to: 'q_tomb', who: 'dazhuang', t: '小不点，你打回来的狼，能不能分我一条腿？……两条也行。' },
  { at: 'sc_street', from: 'q_ruin', to: 'q_leave', who: 'dazhuang', t: '新村子哪儿都好，就是离山远了，打猎得多走半天。我腿都瘦了。……真的，你摸摸。' },
  { at: 'sc_gate', from: 'q_wake', to: 'q_egg', who: 'pihou', t: '我今天一口气翻了十个跟头！第十一个……我们不提第十一个。' },
  { at: 'sc_gate', from: 'q_tomb0', to: 'q_shanbao', who: 'pihou', t: '我跟邻村的娃娃说，我跟你一起掏过青鳞鹰的窝。他们问我是谁，我说我是你大哥。' },
  { at: 'sc_gate', from: 'q_jijing', to: 'q_leave', who: 'pihou', t: '毛球跟我比爬树，它赢了。它还冲我做鬼脸。我要跟它决斗！……你别告诉它。' },
  { at: 'sc_yard', from: 'q_wake', to: 'q_bei', who: 'ermeng', t: '……（二猛默默递给你半罐兽奶。你没问是谁家的，他也没说。）' },
  { at: 'sc_yard', from: 'q_jijing', to: 'q_leave', who: 'ermeng', t: '毛球偷兽奶，比我还熟练。……我有点不服。' },
  { at: 'sc_yard', from: 'q_egg0', to: 'q_bei', who: 'linhu', t: '你那一拳是怎么打的？下回教教我。……别笑，我是认真的。' },
  { at: 'sc_yard', from: 'q_shanbao', to: 'q_leave', who: 'linhu', t: '你洗完药鼎那天，我家那张弓自己响了一声。我当了三十年猎人，头一回见。' },
  { at: 'sc_chief', from: 'q_wake', to: 'q_egg', who: 'chief', t: '兽奶不能当水喝。……你又偷喝了是不是？嘴上那圈白的还在呢！' },
  { at: 'sc_chief', from: 'q_yaoding', to: 'q_leave', who: 'chief', t: '（族长在磨一根骨针）给你缝衣裳。你一天打三架，袖子就没有一条是全的。' },
  { at: 'sc_willow', from: 'q_egg0', to: 'q_leave', who: 'willow', t: '（你冲柳神说今天打了三头狼。一片叶子落下来，正好盖在你头上——像是在说“知道了，别显摆”。）' },
  { at: 'sc_willow', from: 'q_jijing', to: 'q_leave', who: 'willow', t: '（毛球想爬上柳枝去摘叶子。柳枝轻轻一抖，它就顺着树干滑了下来，四脚朝天。）' },
  { at: 'dh_forest', from: 'q_wolf', to: 'q_end', who: '', t: '一只野兔从你脚边窜过去，跑出老远才回头看了一眼，确认你没追。' },
  { at: 'dh_stone', from: 'q_tomb0', to: 'q_end', who: '', t: '崖顶上那个空了的鹰窝还在。窝边多了几根新羽毛——它回来看过。' },
  { at: 'dh_road', from: 'q_xushen0', to: 'q_end', who: '', t: '古道边的老树上，有人用刀刻了一行字：“此路有娃，慎行。”' },
  { at: 'bt_gate', from: 'q_gate', to: 'q_join', who: 'qingfeng', t: '……你别盯着前面那人的干粮看了。我这儿还有半块饼。' },
  { at: 'bt_gate', from: 'q_qf1', to: 'q_qf2', who: 'qingfeng', t: '听说你在雷池被劈了七回？……头发都焦了。（她别过脸去，肩膀在抖）我没笑。' },
  { at: 'bt_gate', from: 'q_qf2', to: 'q_qf3', who: '外门弟子', t: '清风姐让我们每天多打一百拳。谁有意见？……没人有意见。' },
  { at: 'bt_court', from: 'q_bully', to: 'q_end', who: 'guiye', t: '……（诡爷看了你一眼。你等了半天，他什么都没说。）' },
  { at: 'bt_court', from: 'q_bully', to: 'q_end', who: 'gezhu', t: '伙房的厨子来找我告状了，说你一顿顶他们一天的米。……多吃点，长个子。' },
  { at: 'bt_court', from: 'q_qf2', to: 'q_end', who: '补天阁弟子', t: '小师弟，你上回在藏经阁吃的那个……是守阁人养了十年的灵芝。' },
  { at: 'bt_lib', from: 'q_qf2', to: 'q_end', who: 'libelder', t: '书是拿来看的，不是拿来垫屁股的。……更不是拿来包肉的！' },
  { at: 'bt_train', from: 'q_qf1', to: 'q_end', who: '雷池师兄', t: '我在雷池坐了五年，雷都不搭理我。你来三天，雷追着你劈。……这世道。' },
  { at: 'bt_wild', from: 'q_join', to: 'q_end', who: '', t: '林子里的老虎远远看见你，转身就钻回了洞里。洞口还用石头堵上了。' },
  { at: 'bd_gate', from: 'q_bdgate', to: 'q_lion', who: 'huolinger', t: '我叫火灵儿，火国的公主。……你那是什么表情？公主怎么了？公主也能打你。' },
  { at: 'bd_gate', from: 'q_yu', to: 'q_end', who: 'huolinger', t: '我回去查了，九头狮的肉是酸的。你别惦记了。……我没偷偷尝！' },
  { at: 'bd_gate', from: 'q_cliff', to: 'q_end', who: 'huolinger', t: '你那只大红鸟，昨天叼走了我火鸟的一根尾羽，还在它面前晃！你管不管？！' },
  { at: 'bd_lion', from: 'q_yu', to: 'q_end', who: '', t: '九头狮的洞里空荡荡的，地上有九个排得整整齐齐的、脑袋形状的坑。' },
  { at: 'bd_desert', from: 'q_cliff', to: 'q_end', who: '', t: '沙丘上有一块人形的湿印子，四周全是大红的爪印。那是你被冻成冰的地方。' },
  { at: '*', pet: 'maoqiu', who: '毛球', t: '（毛球把一颗不知道从哪儿摘来的果子塞进你手里，然后伸手要你的肉干。这是交易。）' },
  { at: '*', pet: 'maoqiu', who: '毛球', t: '（毛球学你走路，学得太像了，你都不好意思骂它。）' },
  { at: '*', pet: 'dahong', who: '大红', t: '（大红落在你头顶，开始用嘴给你梳头。梳完了，你的头发比鸟窝还乱。）' },
  { at: '*', pet: 'dahong', who: '大红', t: '（远处飞过一只火红的鸟。大红立刻挺起胸膛，嘎了一声，响得震耳朵。）' },
  { at: '*', pet: 'ertuzi', who: '二秃子', t: '（二秃子盯着别的鸟看了很久，又低头看了看自己光溜溜的身子，叹了口气。鸟也会叹气。）' },
  { at: '*', pet: 'ertuzi', who: '二秃子', t: '（二秃子又饿了。它刚吃完。）' },
  // ---- round 2 ----
  { at: 'sc_street', from: 'q_wake', to: 'q_wolf', who: '石村的大婶', t: '小不点！昨天是不是你把我晾的肉干摘了？……算了算了，长身体呢。' },
  { at: 'sc_street', from: 'q_egg0', to: 'q_shanbao', who: '石村的大婶', t: '大壮他娘说，大壮那天回来，抱着鹰蛋哭了一晚上，说是舍不得吃。' },
  { at: 'sc_street', from: 'q_bei', to: 'q_shanbao', who: 'dazhuang', t: '狈村的人都怕你了！我今天去河边，他们看见我是石村的，扭头就走。我威风了一整天！' },
  { at: 'sc_street', from: 'q_jijing', to: 'q_leave', who: 'dazhuang', t: '毛球昨天偷了我一块肉，我追了它三圈，它爬到柳神身上冲我做鬼脸。我不敢上去。' },
  { at: 'sc_street', from: 'q_gate', to: 'q_end', who: 'dazhuang', t: '你不在，没人陪我进山了。我自己去了一回，被一只野猪追回来了。……别告诉皮猴。' },
  { at: 'sc_street', from: 'q_gate', to: 'q_end', who: '石村的大婶', t: '小不点回来啦！快快快，家里还有半只烤羊腿！……哎你别全拿走啊！' },
  { at: 'sc_gate', from: 'q_egg0', to: 'q_tomb', who: 'pihou', t: '族长罚我们几个扫三天村口。大壮扫了一天就说腰疼。他哪儿有腰？' },
  { at: 'sc_gate', from: 'q_bandit', to: 'q_leave', who: 'pihou', t: '你把族长救回来的时候，我在村口哭了。……那是沙子迷了眼！' },
  { at: 'sc_gate', from: 'q_gate', to: 'q_end', who: 'pihou', t: '我现在能翻十二个跟头了！第十一个和第十二个……我们一起不提。' },
  { at: 'sc_yard', from: 'q_egg0', to: 'q_tomb', who: 'ermeng', t: '那颗鹰蛋……要是孵不出来，能不能炒了？我就问问。' },
  { at: 'sc_yard', from: 'q_bandit', to: 'q_leave', who: 'linhu', t: '你开洞天那会儿，我离着二里地都看见光了。我还以为天要塌了。' },
  { at: 'sc_yard', from: 'q_gate', to: 'q_end', who: 'linhu', t: '村里的娃娃现在都学你，天不亮就爬起来迎霞锻体。可惜没一个学会的，全在空地上打瞌睡。' },
  { at: 'sc_yard', from: 'q_gate', to: 'q_end', who: 'ermeng', t: '……（二猛冲你点了点头，又从怀里摸出一罐兽奶。这是他打招呼的方式。）' },
  { at: 'sc_chief', from: 'q_egg0', to: 'q_tomb', who: 'chief', t: '那几只小鹰？柳神留下了一只。剩下的两枚蛋……（族长咳了一声）……补身子了。' },
  { at: 'sc_chief', from: 'q_bandit', to: 'q_leave', who: 'chief', t: '（族长的手腕上还有绳子勒出的印子）不碍事。比起当年猎貔貅，这算什么。' },
  { at: 'sc_chief', from: 'q_gate', to: 'q_end', who: 'chief', t: '你那张床我没让人动。被子晒过了，还是你走的时候那床。' },
  { at: 'sc_willow', from: 'q_bandit', to: 'q_leave', who: 'willow', t: '（柳枝上多了一片新叶。你数了数，比上个月多了三片。）' },
  { at: 'sc_willow', from: 'q_gate', to: 'q_end', who: 'willow', t: '（你回来的时候，柳枝垂得比平时低一点，碰了碰你的肩膀。）' },
  { at: 'dh_forest', from: 'q_egg0', to: 'q_end', who: '', t: '林子里有棵树上刻着几道歪歪扭扭的印子，是大壮比身高留下的。最下面一道，是你的。' },
  { at: 'dh_deep', from: 'q_ruin', to: 'q_end', who: '', t: '那四位至尊打出来的裂谷还在，深不见底。裂谷边上长出了一圈嫩草。' },
  { at: 'dh_tomb', from: 'q_bei', to: 'q_end', who: '', t: '狻猊墓的石门上，多了一道小小的手印——比你的手还小一点。是你自己按的，你忘了。' },
  { at: 'dh_bei', from: 'q_bei', to: 'q_end', who: '狈村的小孩', t: '（一个狈村的小孩远远看着你，壮着胆子喊了一声：“你、你能教我打拳吗？”然后被他娘拽走了。）' },
  { at: 'dh_road', from: 'q_qingfeng', to: 'q_end', who: '', t: '那辆翻倒的兽车已经被人拖走了。路边多了一个小小的土堆，土堆前插着一把断刀。' },
  { at: 'dh_road', from: 'q_gate', to: 'q_end', who: '过路的猎户', t: '小兄弟，前面那段路……哦，是你啊。那没事了，你走吧，该担心的是山里的东西。' },
  { at: 'xs_hall', from: 'q_xushen', to: 'q_end', who: '虚神界的少年', t: '你就是那个大荒来的？……能不能别用那种眼神看我？我们羽族不好吃！' },
  { at: 'xs_hall', from: 'q_xushen', to: 'q_end', who: '虚神界的少女', t: '光幕上又多了一个纪录。纪录后面的名字，写的是“小不点”。……这名字也太敷衍了吧。' },
  { at: 'xs_hall', from: 'q_xushen', to: 'q_end', who: '虚神界的少年', t: '我族长老说，跟大荒来的打架，先把干粮藏好。我以为他开玩笑，结果……我的干粮呢？' },
  { at: 'bt_gate', from: 'q_join', to: 'q_qf1', who: '外门弟子', t: '那个就是扛着虎肉拜师的？……我们外门三百年来，头一回有人带着“见面礼”进门。' },
  { at: 'bt_gate', from: 'q_qf1', to: 'q_qf2', who: 'qingfeng', t: '你别老来看我练拳……你在旁边吃东西，我饿。' },
  { at: 'bt_gate', from: 'q_qf3', to: 'q_end', who: '外门弟子', t: '清风师姐去了内门，外门的木桩终于不用每个月换了。' },
  { at: 'bt_court', from: 'q_bully', to: 'q_lei', who: '补天阁弟子', t: '那几个收份例的师兄被你打了以后，主动把份例全退了，还附赠了一句“小师弟好”。' },
  { at: 'bt_court', from: 'q_qf1', to: 'q_end', who: 'gezhu', t: '你在雷池那几天，雷池的雷少了三成。……雷池管事来找我诉苦了。' },
  { at: 'bt_court', from: 'q_qf2', to: 'q_end', who: 'guiye', t: '……（诡爷递给你一个干瘪的小葫芦。里面什么都没有，可你拿着它，心里莫名地静。）' },
  { at: 'bt_court', from: 'q_return', to: 'q_end', who: '补天阁弟子', t: '神藤上的葫芦今天又鼓了一个！阁主数了三遍，笑了三遍。' },
  { at: 'bt_lib', from: 'q_qf2', to: 'q_end', who: '藏经阁的扫地弟子', t: '守阁人这几天在第五层的锁上又加了一把锁。你说加了有用吗？……反正我是不敢说没用。' },
  { at: 'bt_train', from: 'q_qf1', to: 'q_end', who: '雷池师兄', t: '我们给雷池边那块焦黑的石头起了名字，叫“小师弟坐过的”。现在大家都抢着坐，图个吉利。' },
  { at: 'bt_wild', from: 'q_join', to: 'q_end', who: '补天阁弟子', t: '阁外山林的老虎最近都很乖，见了穿补天阁衣裳的人就绕道。……全是托你的福。' },
  { at: 'bt_tiger', from: 'q_join', to: 'q_end', who: '', t: '虎穴里那汪黑水还在，水面上空荡荡的。洞口多了一行字：“莲已摘，勿扰。”' },
  { at: 'bd_gate', from: 'q_bdgate', to: 'q_lion', who: '各族少年', t: '那个就是在虚神界刷纪录的？……他手里拿的是什么？烤肉？进百断山还带烤肉？' },
  { at: 'bd_gate', from: 'q_lion', to: 'q_end', who: '各族少年', t: '我们族的长辈说，进了百断山，先活着，再抢机缘。你那个火国公主朋友，好像只听了后半句。' },
  { at: 'bd_gate', from: 'q_cliff', to: 'q_end', who: 'huolinger', t: '你背上那把锈剑……看着跟烧火棍似的，可我的火鸟离它三丈远就不肯过去了。' },
  { at: 'bd_lion', from: 'q_bdgate', to: 'q_lion', who: '', t: '狮岭上的石头缝里，到处都是金色的长毛。山顶的洞里，传出很沉的呼吸声——九道。' },
  { at: 'bd_desert', from: 'q_lion', to: 'q_yu', who: '', t: '荒漠上一点风都没有。太安静了，像是有人在等你。' },
  { at: 'bd_cliff', from: 'q_cliff', to: 'q_end', who: '各族少年', t: '那块灰石头……就是你拿去砸碎石柱的？我拿起来试了试——我的手腕到现在还疼。' },
  { at: 'bd_spring', from: 'q_cliff', to: 'q_spring', who: '', t: '泉眼边上一点声音都没有。白虎趴着，金鹏盘着，一个白衣少女站着——三个都在等。' },
  { at: 'bd_bone', from: 'q_tiangu', to: 'q_end', who: '', t: '骨山塌了一半。风从骨头缝里吹过去，呜呜地响，不像哭，像是在哼一首很老的歌。' },
  { at: 'bd_mount', from: 'q_spring', to: 'q_mount', who: '', t: '满山的果子香得人发晕。你吞了好几口口水，毛球已经在流哈喇子了。' },
  { at: '*', pet: 'maoqiu', who: '毛球', t: '（毛球蹲在你头顶，用你的头发编了一根小辫子。你摸到的时候，它假装在看风景。）' },
  { at: '*', pet: 'maoqiu', who: '毛球', t: '（路过一棵果树，毛球“嗖”地上去了。下来的时候，嘴里两个，手里两个，尾巴上还卷着一个。）' },
  { at: '*', pet: 'maoqiu', who: '毛球', t: '（毛球冲一只路过的山雀龇牙。山雀没理它。毛球很受伤。）' },
  { at: '*', pet: 'dahong', who: '大红', t: '（大红叼来一只死老鼠放在你脚边，一脸“不用谢”。）' },
  { at: '*', pet: 'dahong', who: '大红', t: '（大红又在跟毛球抢一块肉。两个打成一团，最后肉掉进了草丛，谁也没吃着。）' },
  { at: '*', pet: 'dahong', who: '大红', t: '（大红站在高处，挺着胸，等你夸它。你不夸，它就一直站着。）' },
  { at: '*', pet: 'ertuzi', who: '二秃子', t: '（二秃子在你手心里睡着了，打着很小很小的呼噜。）' },
  { at: '*', pet: 'ertuzi', who: '二秃子', t: '（二秃子背上好像冒出了一根很细很细的绒毛。你们一起盯着它看了很久。）' },
];
let chatT = 0, lastChat = {};
function chatterFor(loc) { const P = PLACES[loc], q = C.story.q;
  return CHATTER.filter(c => (c.at === '*' ? c.pet && C.pet === c.pet : c.at === loc || c.at === P.area) && (!c.night || isNight()) && (!c.from || q >= qi(c.from)) && (!c.to || q <= qi(c.to))); }
/* who is standing here right now (some people move as the story goes on) */
function npcsHere(loc) { const P = PLACES[loc], f = C.story.f; let L = (P.npcs || []).filter(n => !(n === 'qingfeng' && (!f.qingfeng || f.qfIn)) && !(n === 'huolinger' && C.story.q < qi('q_bdgate'))); if (loc === 'bt_court' && f.qfIn) L = [...L, 'qingfeng']; return L; }
const chatKey = c => (c.who || '') + c.t.slice(0, 14);
const chatPick = L => { const H = C.chatHeard || {}, fresh = L.filter(c => !H[chatKey(c)]); return pick(fresh.length ? fresh : L); };
function npcSay(c) { lastChat[CHATTER.indexOf(c)] = now(); (C.chatHeard = C.chatHeard || {})[chatKey(c)] = 1; const N = NPCS[c.who]; logLine(c.who ? `<span class="who">${N ? N.name : c.who}</span>${c.t}` : c.t, 'npc'); }
function npcOnArrive(loc) { if (!C || NETROLE === 'guest' || STATE.scene) return; const L = chatterFor(loc).filter(c => !lastChat[CHATTER.indexOf(c)] || now() - lastChat[CHATTER.indexOf(c)] > 300000); if (L.length && chance(0.55)) setTimeout(() => { if (!STATE.scene && !STATE.battle) npcSay(chatPick(L)); }, 700); chatT = now() + rint(40000, 70000); }
function npcTick() { if (!C || STATE.mode !== 'play' || NETROLE === 'guest' || STATE.scene || STATE.battle || STATE.dungeon || now() < chatT) return; chatT = now() + rint(45000, 80000);
  const L = chatterFor(C.loc).filter(c => !lastChat[CHATTER.indexOf(c)] || now() - lastChat[CHATTER.indexOf(c)] > 300000); if (L.length) npcSay(chatPick(L)); }
function npcRumor(text) { const P = PLACES[C.loc]; const who = P.area === 'shicun' ? NPCS.linhu : P.area === 'butian' ? NPCS.gezhu : P.area === 'baiduan' ? NPCS.huolinger : null; logLine(who ? `<span class="who">${who.name}</span>${text}` : '【传闻】' + text, 'npc'); }
function npcTalk(id) { // clicking a person: their quest or side errand, otherwise a line that fits right now
  if (STATE.scene || STATE.battle) return; const opts = talkOptions(id); const lines = chatterFor(C.loc).filter(c => c.who === id);
  const fallback = { chief: '去玩吧，别跑太远。', willow: '（柳枝静静垂着。）', linhu: '弓要常擦，箭要常磨。', dazhuang: '小不点，下回进山带上我！', ermeng: '嘿嘿。', pihou: '你看你看，我又能多翻一个跟头了！', qingfeng: C.story.f.qfIn ? '内门的饭比外门的好吃。……你别告诉别人我说的。' : '……嗯。', guiye: '……', gezhu: '好好修行。', libelder: '书别弄脏了。', huolinger: '看什么看？' }[id] || '……';
  runScene(async () => { const ln = lines.length ? chatPick(lines) : null; if (ln) (C.chatHeard = C.chatHeard || {})[chatKey(ln)] = 1; await say(id, ln ? ln.t : fallback); if (opts.length) { const c = await choose([...opts.map(o => ({ t: o.t, dis: !!o.dis })), { t: '没事了' }]); if (c < opts.length) setTimeout(() => opts[c].f(), 0); } });
}
function talkOptions(id) { return [...questTalkOptions(id), ...bountyOptions(id), ...tradeOptions(id), ...(id === 'willow' && C.dt.length ? [{ t: '🔄 重开一座洞天（灵药 ×1）', dis: !itemN('lingyao'), f: dongtianRedo }] : []), ...(talkNext(id) ? [{ t: '💬 闲聊', f: () => talkPlay(id) }] : [])]; }
const npcMark = id => questTalkOptions(id).length ? ' ❗' : bountyToday().some(b => b.npc === id && (b.st === 'new' || (b.st === 'on' && bountyReady(b)))) ? ' 📋' : talkNext(id) ? ' 💬' : '';

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
