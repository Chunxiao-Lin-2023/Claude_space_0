/* ================= 石昊's story, volume 1: 石村 → 出村 → 补天阁 → 百断山 =================
   Beats follow the novel; every line of prose is written fresh for the game. You are 小不点. */
const F = () => C.story.f;
const ME = () => '小不点';
const sub = s => s;
const nar = t => dlgShow({ who: '', text: t });
const me = t => dlgShow({ who: ME(), text: t, mine: 1 });
const say = (npc, t) => { const N = NPCS[npc]; return dlgShow({ who: N ? N.name : npc, npc: N ? npc : '', text: t }); };
const choose = opts => dlgChoose(opts.map(o => typeof o === 'string' ? { t: o } : o));
const tip = t => logLine('【指引】' + t, 'tip');
const give = (id, n = 1) => addItem(id, n);
async function fight(spec) { const r = await startBattle(Object.assign({ flee: false, story: 1 }, spec)); return r && r.win; }
async function fightRetry(spec, loseText) {
  for (; ;) { if (await fight(Object.assign({ noLose: true }, spec))) return true; await nar(loseText || '你被打翻在地，眼前一黑……再睁眼时，伤口已经被人包好了。');
    fullHeal(); refresh(); const c = await choose(['再来！', '先回去练练']); if (c === 1) return false; }
}
const slv = (base, lo = -1, hi = 2) => clamp(C.lv, base + lo, base + hi);

/* ---------------- 第一章 · 石村 ---------------- */
async function S_wake() {
  await nar('天刚蒙蒙亮，大荒深处传来几声兽吼，震得石屋顶上的灰簌簌往下掉。');
  await nar('你叫石昊，可全村没人这么叫你——大家都叫你<b>小不点</b>。你是被人送到石村来的，那时候还在襁褓里，是族长一口兽奶一口米汤把你喂大的。');
  await say('chief', '小不点！太阳都要出来了，还赖着？去村前空地，迎霞锻体。');
  await me('来啦来啦！（一骨碌爬起来，顺手抓起桌上的兽奶灌了一大口）');
  await say('chief', '……那是我的。');
  tip('点下方“前往”里的地点就能走过去。村前空地在<b>村中</b>的南边：先往西出门，再往南。');
}
async function S_yard() {
  await nar('朝霞刚刚升起，一群孩子光着膀子站在空地上，学着大人的样子吐纳。霞光落在身上，暖洋洋的，皮肉底下像有一条条小溪在流。');
  await say('dazhuang', '小不点，又是你最后一个！今天举石锁，输了的人去给族长刷药鼎！');
  await say('ermeng', '我先来！（他憋红了脸，把一只石锁抱到了胸口）');
  await nar('轮到你了。你个头还不到石锁高，几个大孩子都在偷笑。');
  const lf = await miniGame('lift', { title: '举石锁', desc: '石锁比你还高。两手抠住把手，等它晃到最稳的那一下——', rounds: 3, need: 2 });
  if (!lf.ok) await nar('石锁晃了晃，没起来。大壮笑得在地上打滚。你憋着一口气，换了个架势又抓住了把手——');
  await nar('“嘿！”你把石锁举过了头顶，又嫌不过瘾，跑去青铜大鼎那边，双手一抬——几百斤的大鼎离了地。空地上一下子安静了。');
  await say('linhu', '（扛着弓走过来，看了你半天）这小子……行，以后进山算你一个。');
  await nar('话音没落，村口一阵喧哗。猎手们拖着一头庞然大物回来了——一头<b>双头火犀</b>，两个脑袋还在冒着热气。');
  await say('chief', '是双头火犀！它的宝血是好东西。生火，熬！孩子们都来喝一碗。');
  await nar('药汤熬了整整一天。别的孩子喝一碗就撑得直打嗝，你一连灌下去七八碗，最后连锅底的血精都舔干净了。当天夜里，你浑身滚烫，骨头噼啪作响。');
  learnGongfa('xixue');
  await say('chief', '（摸着你的头，又惊又喜）这么一大锅血精，全让你一个人炼化了……');
  tip('<b>迎霞锻体</b>和<b>双头火犀宝血</b>都在“修炼”里能看到，它们一直在给你加成。');
}
async function S_wolfAsk() {
  await say('linhu', '小不点，山林里的山狼最近太猖狂，叼走了好几只羊。你不是力气大吗？去打三头回来，让我看看你的本事。');
  tip('从村中往北出村口，就是<b>山林</b>。在野外点<b>探索</b>，会遇到凶兽，也能采到药草。');
}
async function S_wolfDone() {
  await say('linhu', '三头山狼，一头不少！好小子，比你那几个哥哥强多了。');
  await say('chief', '光有力气不行。你过来，我教你认骨文。凶兽的宝术都刻在它们的骨头上，认得骨文，才看得懂宝术。');
  await nar('族长从墙上取下一块兽骨，骨头上的纹路弯弯曲曲，像虫子爬过的痕迹。你盯着看了一会儿，那些纹路好像在你眼前慢慢动了起来。');
  learnGongfa('guwen'); give('milk', 3);
}
async function S_eggPlan() {
  await say('dazhuang', '（压低声音，把你拉到墙角）小不点，石林那面最高的崖上有个青鳞鹰的窝，我昨天看见老鹰飞走了，窝里有蛋！');
  await say('pihou', '鹰蛋！比水盆还大！烤着吃能香死人！');
  await say('ermeng', '可是……林虎叔说不让我们去石林。');
  const c = await choose(['去！我爬得最快。', '那可是青鳞鹰，太危险了。', '……鹰蛋好吃吗？']);
  if (c === 1) await say('dazhuang', '你怕啥，老鹰又不在！再说你力气比我们都大，真有事你扛着。');
  if (c === 2) await say('pihou', '（咽了口口水）好吃！肯定好吃！');
  await nar('最后，四个孩子还是偷偷溜出了村子。');
  tip('<b>石林</b>在山林的西边。');
}
async function S_cliff() {
  await nar('石林的崖壁陡得像刀削的。你们手脚并用爬上去，崖顶那个窝是用整棵古树搭的，里面卧着三枚青色的大蛋，每一枚都有水盆那么大。');
  await say('dazhuang', '哎哟！（大壮一脚踩在一片青色的鳞片上，脚底划开一道大口子）这鳞片比刀还快！');
  await me('这是青鳞鹰掉的鳞……你们看，上面有骨文，是它一族的符文。它是太古魔禽的后代！');
  await nar('你们一人抱着一枚蛋往下爬，刚落地，天一下子暗了——一声尖啸撕开了云层。<b>青鳞鹰</b>回来了。');
  await say('pihou', '快跑啊——！');
  const c = await choose(['（冲另一个方向大喊）“喂！蛋在我这儿！”', '大家一起跑，往村子跑！']);
  if (c === 0) { F().lure = 1; await nar('那只鹰拐了个弯，冲着你扑了下来。你抱着一枚蛋往反方向狂奔，身后的大树一棵接一棵地被它撞断。'); }
  else await nar('鹰一路追着你们撞断了半片林子。眼看就要追上大壮了，你一咬牙，回身冲它扔了一块石头——它盯上了你。');
  const win = await fight({ mobs: [['eagle', 5]], title: '石林 · 青鳞鹰', noLose: true, flee: false, noPet: true, allies: c === 0 ? [] : ['a_kids'] });
  await nar(win ? '你一拳砸在鹰爪上，它吃痛松开了你，可它比你大太多了，又一次扑了下来——' : '你被一爪子拍飞，滚出去老远。它张开爪子扑了下来——');
  await nar('就在这时，村子方向亮起一道柔和的绿光。一根柳枝从天边伸过来，轻轻一拂，青鳞鹰像撞上了一堵看不见的墙，翻滚着退开了。');
  await nar('你怀里那枚蛋在逃跑时裂开了，里面的小鹰早产出壳，湿漉漉的，眼看就要不行了。柳枝的绿光落在它身上，它慢慢睁开了眼睛。');
  await say('willow', '（柳枝轻轻摇了摇。什么都没说，可你觉得它在笑。）');
  await nar('那天晚上，你满脑子都是青鳞鹰扑下来时，翅膀和爪子上流转的骨文。你照着那些纹路，在空地上一遍遍比划……');
  await study('qly'); F().tomb = 1;
  await nar('第二天，你在门口捡到一根青色的长羽，硬得像铁片——是那只鹰撞树时掉的。你把它别在了腰上。'); gainRelic('r_eagle');
  await say('chief', '（第二天一早，脸黑得像锅底）你们几个！谁让你们去石林的？！……小不点，你过来。');
}
async function S_tombAsk() {
  if (F().lure) { await say('chief', '大壮都跟我说了。是你冲着老鹰喊，把它引开的？'); await me('……蛋是我先抱的嘛。'); await say('chief', '（他张了张嘴，骂人的话到底没说出来，从柜子里摸出两罐兽奶塞给你）'); give('milk', 2); }
  else await say('chief', '石林是能随便去的吗？那只鹰要是再快一点，你们四个连骨头都剩不下！（他骂了足足一炷香）');
  await say('chief', '你们这一闹，把石林深处一座古墓惊动了。那里面葬着一头狻猊，死了不知多少年，可它的魂还在。');
  await say('chief', '附近几个村子的人已经往那边去了，都想要狻猊的宝骨。……我知道拦不住你。去吧，别逞强，打不过就跑。');
  tip('<b>狻猊墓</b>在石林北边，是个要一关关闯的地方。建议 5 层以上，多带几口兽奶。');
}
async function S_tombDone() {
  await nar('你从墓里出来时，身后传来一声长长的叹息。那头狻猊终于闭上了眼睛，它的头骨里，有一颗暗金色的珠子在发光。');
  await say('chief', '（接过那颗珠子，手都在抖）狻猊宝珠……它肯把这个留给你。好，好！等我把药鼎熬好，让你好好洗一洗。');
  F().bei = 1;
  await say('linhu', '族长，狈村的人在墓外头吃了亏，正憋着气。小不点这几天出门，得小心。');
}
async function S_bei() {
  await nar('你刚走进狈村地界，林子里就“嗖嗖”飞出几支骨箭。一群狈村的猎手围了上来，领头的是一个脸上涂着狈祖图腾的少年。');
  await say('风狈', '就是这个小崽子拿走了狻猊宝珠？交出来，饶你一条小命！');
  await me('那是狻猊自己给我的。你要，自己去墓里问它啊。');
  if (!await fightRetry({ mobs: [['beihunter', slv(6)], ['beihunter', slv(6)]], title: '狈村伏击' })) return false;
  await say('风狈', '废物！（他一把推开倒在地上的猎手，身上卷起一阵狂风）');
  if (!await fightRetry({ mobs: [['fengbei', slv(7, -1, 1)]], title: '风狈' })) return false;
  await nar('你双手结出青鳞鹰的骨文，一爪掏在风狈胸口。他倒下的时候，眼睛还瞪得大大的，不敢相信自己输给了一个小娃娃。');
  await nar('林子深处传来一声暴喝。一个干瘦的老头踏着树梢冲了过来，身后跟着一团黑乎乎的影子——那是狈村供奉的祭灵。');
  await say('烈老', '小畜生，杀我狈村天才，拿命来！');
  await nar('你撒腿就跑，那老头一掌拍下来，你身后的大树齐刷刷断成了两截。眼看就要被追上——');
  await nar('一根柳枝从村子的方向伸来，在你身后轻轻一挡。烈老的掌力撞在柳枝上，像撞上了一座山。那团黑影尖叫着扑过去，被柳枝一卷，就再也没有出来。');
  await nar('烈老脸色惨白，盯着柳枝看了半天，一句话没说，转身走了。');
  F().deep = 1;
}
async function S_yaoding() {
  await say('chief', '药鼎熬好了。脱衣服，跳进去！');
  await nar('大鼎里的药汤翻滚着，颜色黑得发亮，那颗狻猊宝珠沉在鼎底。你一跳进去，就疼得龇牙咧嘴——像是全身的骨头都被拆开，又一根根重新装上。');
  await say('chief', '忍着！狻猊宝珠里的宝术，得靠你自己去悟！');
  await nar('不知过了多久，你眼前浮现出一头狻猊的影子。它冲你张开了嘴，没有咬下来，而是一声长吼——你的骨头跟着它一起吼了出来。');
  learnGongfa('yaoding'); await study('sn');
  await say('chief', '（看着鼎里的药汤一点点变清，长出一口气）狻猊宝术……成了。');
  tip('宝术可以在“石昊”页里选择带哪些进战斗（最多 4 门）。');
}
async function S_shanbao() {
  await nar('大荒深处，天突然暗了下来。你抬头一看，四道恐怖的气息冲天而起，把云都撕碎了。');
  await nar('一头浑身金毛的巨猿、一只燃着火的神禽、一头生着双翼的猛虎、一只张嘴能吞天的雀鸟——<b>朱厌、朱雀、穷奇、吞天雀</b>，大荒里的四大至尊，在争一件“山宝”。');
  await nar('它们每交手一次，大地就裂开一道口子。远处的火山被打穿了，岩浆像河一样往外涌——朝着石村的方向。');
  const c = await choose(['拼命往回跑，去报信！', '再看一眼……那是什么宝贝？']);
  if (c === 1) await nar('你刚探出头，一道余波扫过来，把你连人带石头掀飞了出去。你在地上滚了十几圈，爬起来就往回跑。');
  await nar('你冲回村子的时候，天边已经一片通红。族长在嘶吼，大人们抱着孩子，扛着兽肉，乱成一团。');
  await nar('柳神的那根柳枝突然亮得刺眼。它往地上一扎，一道光门在村子中央打开了。');
  await say('chief', '是柳神！快，都进去！老人孩子先走！');
  const c2 = await choose(['先帮大家搬东西', '扛起族长的药鼎就走']);
  if (c2 === 1) { F().ding = 1; const ms = await miniGame('mash', { title: '扛鼎', desc: '药鼎几百斤重，岩浆已经漫到了村口。', time: 6500, rate: 8 }); if (!ms.ok) await nar('鼎太沉，你一个趔趄差点跪下。咬着牙，到底还是把它扛上了肩。'); }
  if (c2 === 1) await nar('你一个人扛起那口几百斤的药鼎，从岩浆边上冲了过去，把它扔进光门。族长回头看见，眼眶都红了。');
  else await nar('你来来回回跑了十几趟，把走不动的老人一个个背进了光门。最后一趟，岩浆已经漫到了村口。');
  await nar('光门合上的那一刻，旧石村被岩浆吞没了。');
  await nar('再睁眼时，眼前是一片山清水秀的谷地。溪水从身边流过，鸟在叫。柳神的树桩扎在新的土里，那根柳枝轻轻晃着，像是累坏了。');
  F().moved = 1; give('baoyao', 1);
  await say('chief', '……石村，还在。（老人跪下来，冲柳神磕了三个头）');
  tip('石村搬家了。旧村的废墟在<b>大荒深处的东边</b>。');
}
async function S_ruin() {
  await nar('旧村只剩一片黑石，岩浆把一切都烧成了灰。你蹲在一块还算完整的大石头前，用指甲一笔一画地刻：“石村迁往……”');
  await me('要是爹娘哪天回来找我，至少知道该去哪儿。');
  await nar('石头后面传来细细的哼哼声。你绕过去一看，一只金毛小猴缩在石缝里，浑身是伤，一条腿被压在石头底下，冲你龇着牙。');
  const c = await choose(['把石头搬开，给它敷药', '（它好像挺好吃的……）', '扔给它一块兽肉，看它吃不吃']);
  if (c === 1) await nar('你咽了口口水，小猴子“吱”地一声尖叫，拼命往石缝里缩。你叹了口气，还是决定把石头搬开。');
  if (c !== 2) { const ms = await miniGame('mash', { title: '搬石', desc: '压着它的是半块烧焦的大磨盘，比你整个人还宽。', time: 7000 }); await nar(ms.ok ? '“起——！”磨盘被你掀到了一边，轰的一声砸进灰里。' : '磨盘纹丝不动。你喘了口气，把肩膀顶在磨盘底下，一寸一寸地往外挪……总算挪开了。'); }
  if (c === 2) await nar('小猴子盯着兽肉看了半天，一把抢过去，狼吞虎咽。吃完了，它就盯着你，不叫了。');
  await nar('你把它抱回了新村，给它敷了止血草。它的伤好得出奇地快，三天就能满村乱窜，把好几户人家的兽奶罐子舔了个底朝天。你给它起了个名字，叫<b>毛球</b>。');
  gainPet('maoqiu'); if (c === 2) C.pets.maoqiu.aff = 22; if (c === 1) { C.pets.maoqiu.aff = 4; await nar('毛球记仇。头几天它一看见你就龇牙，还偷偷往你的兽奶里吐口水。'); }
  await nar('你不知道的是，那天在大荒深处争夺山宝的四大至尊里，有一个就是朱厌——浑身金毛的朱厌。');
  tip('毛球是你的<b>灵兽伙伴</b>，会跟着你战斗，每回合由你给它选招。在“灵兽”页里可以喂它，亲近越高，它会的本事越多；亲近满了还会觉醒。');
}
async function S_jijing() {
  await say('willow', '（柳枝垂下来，轻轻点在你的额头上。）');
  await nar('一股清凉的光从额头灌下去，流遍全身。你体内那层撞了很久的壁，“咔”地裂开了一条缝——不是破开，是被撑开。');
  await nar('你看见搬血境的尽头，还有一段别人没走过的路。你一步一步走了上去。');
  learnGongfa('jijing'); F().jijing = 1;
  await nar('远处的山梁上，一个穿红衣服的小姑娘骑在一只火红的大鸟背上，正好往这边看了一眼。她眨了眨眼睛，大鸟一振翅，飞远了。');
  await say('chief', '搬血极境……几百年来，大荒里能走到这一步的，我只听说过。（他沉默了很久）小不点，晚上来我屋里。有些事，该告诉你了。');
}
/* ---------------- 第二章 · 出村 ---------------- */
async function S_memory() {
  await say('chief', '你不是石村生的。你被人送来那年，胸口有一道很长的疤，刚刚长好。');
  await nar('族长的话像一块石头扔进了水里。你脑子里“嗡”的一声，那些很久很久以前的画面，一下子全浮了上来——');
  await nar('一个高大的老人背着你去猎貔貅，你骑在他脖子上笑；一个女人的手按住你的胸口，冰凉的刀锋……她挖走了你胸口的一块骨头，那块骨头会发光；你的爹娘红着眼睛，冲进一座大宅子，和一群人打了起来……');
  await me('……那是我的骨头。她把我的骨头拿走了，给了别人。');
  await say('chief', '你爹娘为了你，跟整个石族翻了脸。后来他们把你送到这里，就再也没有消息。');
  const c = await choose(['我要去找他们。', '我要把我的骨头拿回来。', '（什么也没说，攥紧了拳头）']);
  F().vow = ['find', 'bone', 'quiet'][c];
  await say('chief', c === 0 ? '……好孩子。' : c === 1 ? '你的骨头没了，可你还在。比骨头重要的，是你自己。' : '（老人伸手，把你搂进了怀里）');
  await say('chief', '要出去，先得变得更强。出山的古道最近不太平，你先去那边走走，开开眼界。');
  F().out = 1;
  tip('<b>出山古道</b>在大荒深处的北边。');
}
async function S_qingfeng() {
  await nar('古道边，一个老仆背靠着一辆翻倒的兽车，浑身是血，手里还攥着一把断刀。他身后护着一个小姑娘，几头黑罴正围着他们打转。');
  await say('老仆', '小、小兄弟……求你……带小姐走……');
  if (!await fightRetry({ mobs: [['bear', slv(9)], ['bear', slv(9)]], title: '古道 · 黑罴' })) return false;
  await nar('黑罴倒下的时候，老仆也闭上了眼睛。小姑娘跪在他身边，一声都没哭出来，只是咬着嘴唇，咬出了血。');
  await say('qingfeng', '……我叫清风。');
  await me('跟我回石村吧。我们村有柳神，谁也欺负不了你。');
  F().qingfeng = 1;
}
async function S_bandit() {
  await nar('你带着清风回到村子，村口一片狼藉。石林虎浑身是伤地靠在巨石上。');
  await say('linhu', '小不点……山贼！一伙山贼趁我们出去打猎，把族长和好几个人绑走了！他们供着一个祭灵，族长不是对手……');
  await say('linhu', '他们往古道那边去了。你……你别一个人去！');
  await me('他们抓的是我爷爷。');
  tip('山贼的老窝在<b>出山古道</b>。建议 10 层以上。');
}
async function S_banditFight() {
  await nar('山贼的营地扎在古道尽头的山坳里。族长被绑在一根木桩上，嘴角带血，看见你来了，拼命摇头。');
  if (!await fightRetry({ mobs: [['bandit', slv(10)], ['bandit', slv(10)], ['bandit', slv(10)]], title: '山贼营地' })) return false;
  await nar('山贼头子一把扯开胸前的兽皮，露出一块刻满符文的骨牌。阴风四起，一团扭曲的黑影从骨牌里钻了出来——是他们供奉的祭灵。');
  await nar('黑影压下来的那一刻，你体内有什么东西轰地炸开了——一座、两座、三座，三片小小的天地在你体内开辟出来，神光从里面涌出。');
  await nar('<b>洞天境</b>。你一口气开了三座洞天。');
  if (C.lv < 10) { C.lv = 10; C.exp = 0; fullHeal(); logLine('<b class="lvup">踏入洞天境！</b>', 'sys'); }
  if (!await fightRetry({ mobs: [['jiling', slv(11, -1, 1)]], title: '山贼的祭灵' })) return false;
  await nar('祭灵散成了一缕黑烟。山贼们哭爹喊娘地跑了。你把族长从木桩上解下来，族长一把抱住你，半天说不出话。');
  F().saved = 1; F().xushen = 1;
  await say('chief', '……三座洞天。好，好。柳神说得对，你是要走出大荒的人。');
  setTimeout(dongtianPick, 400);
}
async function S_xushen() {
  await say('willow', '（柳枝垂到你面前，轻轻一点。你的神魂一轻，像是飘了起来。）');
  await nar('你“醒”过来的时候，站在一片灰白的虚空里。四周悬着一块块石台，石台上站着一个个和你差不多大的少年，有的头上长角，有的背后生翅，有的眼睛里有两个瞳孔。');
  await nar('半空中的光幕上写着一行字：<b>虚神界</b>。各族少年的神魂在这里交手，伤不及肉身。');
  tip('在虚神界里挑战排名在你前面的人，赢了就能换到他的名次。每天能挑战 5 次。');
}
async function S_xushenDone() {
  await nar('你连赢了三场，光幕上你的名字一路往上窜，把好几个记录都刷新了。四周的石台上一片哗然。');
  await nar('“那个小娃娃是谁？哪一族的？”“没见过，好像是从下面一个叫大荒的地方来的……”');
  await say('willow', '（你醒过来，柳枝在你头顶轻轻摇晃。你觉得它有点得意。）');
}
async function S_leave() {
  await say('chief', '外面有座补天阁，是附近最大的宗门。去那里，学真本事，打听你爹娘的消息。他们要找你，迟早会去古神山——补天阁离那儿不远。');
  await say('chief', '清风那孩子也想去，你们路上做个伴。');
  if (F().vow === 'bone') await say('chief', '你的骨头……要是在外头碰见了，别急着动手。先看清楚，拿着它的是什么人。');
  else if (F().vow === 'find') await say('chief', '打听你爹娘的时候，别说你是石村的。外头的人，不都像柳神这么护着你。');
  await say('dazhuang', '（红着眼睛）小不点，你、你别忘了我们啊！');
  if (F().lure) await say('dazhuang', '那年在石林，你冲着老鹰喊“蛋在我这儿”……我一直没跟你说谢谢。');
  await say('pihou', '在外面要是有人欺负你，就回来，我们一起揍他！');
  await say('ermeng', '……给你。（塞过来一罐兽奶）我偷的。');
  give('milk', 5); give('baoyao', 2);
  await nar('你走到村口，回头看了一眼。柳神的那根柳枝在风里摇着，像是在挥手。');
  F().butian = 1;
  await nar('<b>【第一章 · 石村　完】</b>');
  tip('沿着出山古道一直往北，就是<b>补天阁</b>。');
}
/* ---------------- 第三章 · 补天阁 ---------------- */
async function S_gate() {
  await nar('补天阁的山门比你想的还要高。门口排着长长的队伍，都是来拜师的少年，每个人手里都捧着一块发光的石头——补天石，补天阁收徒的信物。');
  await say('qingfeng', '我们的补天石，族长给的，在你包袱里。');
  await nar('你一摸包袱，空了。人群里一个瘦高个正挤出去，冲你挤了挤眼睛，转眼就没影了。');
  await me('……我的石头！');
  await say('守门弟子', '没有补天石？那就按老规矩：去阁外山林的虎穴里，把那朵黑莲带回来。带得回来，就算你过了。带不回来……（他笑了笑）也就不用回来了。');
  tip('<b>虎穴</b>在阁外山林的北边。');
}
async function S_lotus() {
  await nar('虎穴里腥风扑面。洞底一汪黑水，水面上开着一朵黑色的莲花，花瓣边缘泛着一圈幽光。一头黑纹虎正趴在水边打盹。');
  await nar('洞壁的阴影里，还趴着另一头，呼噜打得震天响。你屏住呼吸——');
  const sn = await miniGame('sneak', { title: '潜行', desc: '一步一步挪过去。老虎呼气的时候，正是你迈步的时候。', steps: 6 });
  if (sn.ok) { await nar('你挪到了水边，手指碰到了黑莲的花瓣——'); await nar('“咕——噜噜噜噜——”'); await nar('你的肚子叫了。叫得整个山洞都在回响。离你最近的那头黑纹虎猛地睁开了眼睛。另一头翻了个身，接着睡。'); await me('……我早上就喝了一口兽奶。');
    if (!await fightRetry({ mobs: [['tiger', slv(12)]], title: '虎穴 · 黑纹虎' })) return false; }
  else { await nar('脚下“咔嚓”一声，你踩断了一根骨头。两头黑纹虎同时睁开了眼睛。'); await me('……我就说这洞里骨头太多了。');
    if (!await fightRetry({ mobs: [['tiger', slv(12)], ['tiger', slv(11)]], title: '虎穴 · 黑纹虎' })) return false; }
  give('heilian'); await nar('你把黑莲揣进怀里，顺手把虎肉也扛了回去。');
}
async function S_join() {
  await say('守门弟子', '（盯着你手里的黑莲，又看了看你扛着的半扇虎肉）……你真去了？');
  takeItem('heilian');
  await say('gezhu', '（不知什么时候站在了山门上）让他进来。');
  await nar('阁主把你领进了内院。内院中央攀着一株枯了一半的神藤，藤上挂着几个干瘪的葫芦。院子四周刻着一圈阵纹，阵纹里站起了几具铜傀儡。');
  await say('gezhu', '入阁的最后一关：破阵。');
  await nar('院子四周的阵纹亮了起来，几具铜傀儡“咔咔”地站直了身子。阵纹一明一暗，像是连在一起的。');
  const lt = await miniGame('lights', { title: '破阵', desc: '阵纹一道连着一道。按下一道，它旁边的几道也会跟着变。', presses: 4 });
  if (lt.ok) await nar('你按下最后一道阵纹，满院的光“噗”地一下全灭了。铜傀儡僵在半路，哗啦啦散了一地。');
  else { await nar('阵纹越按越乱，傀儡已经冲到了跟前——那就打吧！'); if (!await fightRetry({ mobs: [['puppet', slv(12)], ['puppet', slv(12)]], title: '补天阁 · 护阁傀儡' })) return false; }
  await nar('阵纹熄灭了。神藤边上，一个一直没动过的老人慢慢转过头来，看了你一眼。');
  await say('guiye', '……');
  await say('gezhu', '那是诡爷。他守着这株神藤，已经很多很多年了。他不爱说话，你别去烦他。');
  F().joined = 1; give('baoyao', 2);
  await nar('清风也过了入阁的考核。可第二天的内门试炼，她站在试炼石前，石头只亮了一下就灭了——根骨不够。');
  await say('外门弟子', '外门的，这边走。');
  await nar('她跟着走了，一次也没回头。你看见她的手在袖子里攥得发白。');
  tip('补天阁内院可以休息。先回<b>内院</b>认认地方。');
}
async function S_bully() {
  await nar('你扛着铺盖卷走进内院，还没找到住的地方，就被三个穿青袍的师兄堵在了神藤底下。');
  await say('外门师兄', '新来的？补天阁的规矩懂不懂？头一个月的灵药份例，得孝敬师兄们。');
  const c = await choose(['什么是“份例”？能吃吗？', '不给。', '（把背上那半扇虎肉往地上一扔）这个给你们，够不够？']);
  if (c === 0) await say('外门师兄', '（愣了一下）……装傻是吧？');
  if (c === 1) await say('外门师兄', '嘿，大荒来的野孩子，口气倒不小。');
  if (c === 2) await say('外门师兄', '谁要你的生肉！（他一脚把虎肉踢开）');
  if (!await fightRetry({ mobs: [['senior', slv(12)], ['senior', slv(11)]], title: '神藤下 · 师兄的规矩' }, '你被一张定身符贴在了神藤上，挨了好几下。等符力散了，那几个人已经走了。')) return false;
  await nar('最后一个师兄捂着肚子坐在地上。他刚要喊人——');
  await say('guiye', '……吵。');
  await nar('声音沙哑得像两块石头在磨。神藤边上那个老人连眼睛都没睁开。三个师兄脸色一白，爬起来就跑，鞋都跑掉了一只。');
  await me('（小声）诡爷，你会说话啊？');
  await nar('他没再理你。可你走出去老远，回头看时，他好像在看你。');
  F().bully = 1;
  await nar('傍晚，阁主差人送来一块温润的玉符。“入了阁，就是自家人。这东西能带你回村、回阁里。”');
  tip('<b>雷池</b>在内院东边，<b>藏经阁</b>在西边。玉符：在城镇里点<b>🌀 传送</b>，能在石村、补天阁、百断山口之间直接来回。');
}
async function S_qf1() {
  await nar('傍晚，你溜到山门外找清风。外门的院子里早就没人了，只有她一个人还在打一套最基础的拳，一遍，又一遍。');
  await nar('她的指节破了，血印在木桩上，一个摞一个。');
  await say('qingfeng', '……你来干什么？内门的人不用练这个。');
  const c = await choose(['我陪你练。', '（掏出止血草递过去）手先包上。', '（什么也没说，悄悄走开，不打扰她）']);
  F().qf = ['spar', 'herb', 'leave'][c];
  if (c === 0) { await nar('你们对着打了半宿。你力气大，她就绕着你走；你出拳直，她就侧身让。到最后，她居然有两回绕到了你背后。'); await say('qingfeng', '（喘着气，第一次笑出了声）你是不是故意让我的？'); await me('才没有。'); }
  if (c === 1) { await nar('她瞪了你一眼，还是把手伸了过来。你笨手笨脚地给她缠上，缠得像两个大馒头。'); await say('qingfeng', '……难看死了。（她没拆）'); }
  if (c === 2) await nar('你在墙角站了一会儿，听着木桩一声一声地响，转身回去了。那天晚上，外门的拳声响到了后半夜。');
  await say('qingfeng', '根骨不够，就多练几年。总有一天，我会自己走进内门。');
}
async function S_qf2() {
  await nar('外门在比武。圈子中间，清风对着一个比她高一个头的少年，已经被打倒了两次。');
  await say('外门弟子', '还起来？外门的规矩，输三次就别想参加下个月的内门试炼了。');
  await nar('清风撑着地站了起来，抹了一把嘴角的血。');
  if (F().qf === 'spar') await nar('那少年一拳砸过来，清风没有硬接，脚下一错，绕到了他身后——就是那天晚上她绕到你背后的那一步。');
  else if (F().qf === 'herb') await nar('她手上还缠着你那天包的止血草，丑得像两个馒头。她用缠着草的手接住了那一拳，顺势一拧——');
  else await nar('她出拳很慢，每一拳都是最基础的那一套，打了不知几千遍的那一套。那少年的拳头快，可每一下都落空了。');
  await nar('少年摔出了圈子。四周安静了一下，然后有人鼓起了掌。');
  const c = await choose(['（大喊）清风！好样的！', '（使劲鼓掌）', '（冲那个少年做了个鬼脸）']);
  if (c === 2) await say('外门弟子', '你、你个内门的小崽子……！');
  await say('qingfeng', '（看见了你，脸一下子红了）你什么时候来的？……别喊了，丢人。');
  F().qf2 = 1;
}
async function S_qf3() {
  await say('qingfeng', '听说你要去百断山了。');
  await me('嗯。阁主说，活着出来就行。');
  await say('qingfeng', '下个月的内门试炼，我报了名。这次……你别来看。我想自己去。');
  const c = await choose(['好。等我回来，你得在内门等我。', '你肯定行。', '那我回来请你吃烤肉。']);
  if (c === 2) await say('qingfeng', '……又是肉。（她扭过头，可你看见她嘴角翘起来了）');
  else await say('qingfeng', '嗯。');
  await nar('她把一个小布包塞进你手里。里面是几株灵药，根须都洗干净了。');
  give('lingyao', 3); F().qf3 = 1;
}
async function S_lei() {
  await nar('雷池是一片山顶石台。天上的雷云压得极低，一道道雷光劈下来，砸在石台上，炸得碎石乱飞。几个师兄坐在雷光里，头发根根竖起，冒着青烟。');
  await say('雷池师兄', '新来的？雷道法则得自己挨着劈去悟。坐那儿，什么时候被劈明白了，什么时候算完。');
  await nar('你坐了下去。第一道雷劈下来，你眼前一白，鼻子里全是焦糊味。第二道、第三道……');
  for (let k = 0; ; k++) { const th = await miniGame('thunder', { title: '引雷', desc: k ? '再来。这回看准了。' : '一道雷光在云里亮起，朝你直劈下来——', strikes: 5, need: 3 }); if (th.ok || th.skip) break; await nar('你被劈得眼前一黑，头发全竖了起来，鼻子里全是焦糊味。缓过气来，接着坐。'); fullHeal(); }
  await nar('不知道挨了多少下，你忽然看清了雷光里的纹路——它们和骨文一样，是有规律的。');
  await study('lei');
  await nar('你抬起手，一道细细的电光在你指尖跳了起来。');
  await say('雷池师兄', '（瞪大了眼睛）这才几天？！');
}
async function S_lib() {
  await say('libelder', '藏经阁的书，一层比一层难。小娃娃，你能看懂第一层就不错了。');
  await nar('你在第一层翻了两天，第三天偷偷爬上了第五层。那里有一卷残破的骨简，上面全是你认得的骨文——讲的是怎么用骨文结成锁链，困住敌人。');
  await study('gw');
  await say('libelder', '（第四天早上，看见你从第五层下来）……你怎么上去的？');
}
/* ---------------- 第四章 · 百断山 ---------------- */
async function S_baiduan() {
  await say('gezhu', '百断山要开了。各族的少年天才都会进去抢机缘——宝药、宝骨、上古留下来的兵器。补天阁要派人去，我想让你去。');
  await say('gezhu', '里面的规矩只有一条：活着出来。');
  await say('guiye', '……（诡爷突然开口了，声音沙哑得像两块石头在磨）分宝崖上……有一柄锈剑。');
  await nar('你愣了一下，再看他，他又不说话了，好像刚才那句不是他说的。');
  F().baiduan = 1;
  tip('<b>百断山</b>从补天阁内院往北走。');
}
async function S_bdgate() {
  await nar('百断山口挤满了人。各族的少年骑着异兽，背着兵器，谁看谁都不顺眼。一个穿红衣服的小姑娘骑在火红的大鸟背上，正好看了你一眼——是那天在大荒山梁上的那个。');
  await say('huolinger', '是你？大荒里那个小不点？我叫火灵儿。听说你在虚神界把好几个记录都刷了？');
  await me('你骑的那只大鸟……能吃吗？');
  await say('huolinger', '（脸一下子红了）你敢！');
  await nar('一只更大、更凶的红毛鸟从天上俯冲下来，叼走了你手里的烤肉。');
  if (!await fightRetry({ mobs: [['dahongbird', slv(13)]], title: '抢肉的大红鸟' })) return false;
  await nar('那只大鸟挨了一顿揍，扑棱着飞走了，临走还回头冲你骂了一声。你记住它了。');
  tip('<b>狮岭</b>在百断山口北边。');
}
async function S_lion() {
  await nar('狮岭顶上的洞里，九道吼声同时响起。一头生着九个脑袋的金色巨狮从洞里走了出来，每个脑袋都比你整个人还大。');
  await say('huolinger', '（追了上来）黄金九头狮！一个人打不过的——一起上！');
  if (!await fightRetry({ mobs: [['lion', slv(14, -1, 1)]], allies: ['a_huo'], title: '黄金九头狮' })) return false;
  await say('huolinger', '……你这人，看着小，下手倒是真狠。');
  await nar('那只大红鸟又飞来了，这回没抢东西，蹲在不远处的树上，歪着头看你。');
}
async function S_yu() {
  await nar('荒漠里，风沙忽然停了。一群披着冰甲的人从四面围了上来，身后跟着几头比马还大的白狼。');
  await say('雨族高手', '补天阁的小子？听说你在虚神界很威风。雨族办事，你就当自己倒霉吧。');
  if (!await fightRetry({ mobs: [['yuzu', slv(14)], ['bigwolf', slv(14)], ['bigwolf', slv(14)]], title: '雨族截杀' })) return false;
  if (!await fightRetry({ mobs: [['yuchief', slv(15, -1, 1)]], title: '雨族高手' })) return false;
  await nar('雨族高手临死前捏碎了一块玉符，一股寒气瞬间把你冻成了一座冰雕。你动不了，只能眼睁睁看着剩下的雨族战士围上来——');
  await nar('一团红影从天上砸了下来，一爪子把冰雕抓了起来——是那只大红鸟！它驮着你，跌跌撞撞地飞出了荒漠。');
  await nar('冰化开以后，你躺在一片沙丘上，那只大红鸟蹲在旁边，用嘴梳着被冻掉的羽毛。');
  const c = await choose(['（摸摸它的脑袋）谢了，兄弟。', '……你是不是想等我化了再吃？']);
  if (c === 1) await nar('大红鸟“嘎”地叫了一声，一嘴啄在你脑门上。');
  await nar('打了那么多架，它终于低下了头，用脑袋蹭了蹭你的胳膊。从今天起，它跟你了。你给它起名叫<b>大红</b>。');
  gainPet('dahong'); C.pets.dahong.aff = c === 0 ? 22 : 12;
  await nar('你在沙丘底下摸到了一个小石瓶，瓶底只有一滴水，晶莹得像一颗星星。');
  give('taiyi');
  tip('<b>太一真水</b>在背包里，喝下去就能永久提升。灵兽伙伴在“灵兽”页里换着带，战斗里也能换上场。');
}
async function S_fenbao() {
  await nar('分宝崖上插满了古兵器，锈成了一片红褐色。不少少年在崖前拔了半天，脸都憋紫了，一件也拔不出来。');
  await nar('你想起诡爷的话，在崖上找了很久，终于在最不起眼的角落里，看见一柄锈得几乎看不出样子的剑。');
  await nar('你握住剑柄。整面石崖都震了一下。');
  await nar('剑出来了。锈迹斑斑，可剑身里有一股锋锐的意志在醒过来，顺着你的手臂往上爬。你恍惚看见一个年轻人握着这柄剑，在百断山上一剑斩断了一座山。');
  learnSkill('jian');
  await nar('崖脚下，你还捡到了一块灰扑扑的石头，比拳头大不了多少，沉得出奇。你拿它砸了一下旁边的石柱——石柱碎了，石头一点事没有。');
  learnSkill('dsh');
  await nar('还有一颗蛋，滚在石缝里，没有鸟窝，没有母鸟。你把它揣进了怀里。');
  give('peaegg'); F().cliff = 1; F().eggWins = 0;
  tip('那颗蛋需要暖着，多打几场仗，它也许就孵出来了。');
}
async function S_spring() {
  await nar('不老泉边围着三头凶兽。一头白虎守着泉眼，一头半边身子泛着金光的大鹏盘旋在天上，一个白衣少女静静站在泉边，看着它们。');
  await say('云曦', '你也是来取泉水的？……那就先过了白虎这一关。');
  if (!await fightRetry({ mobs: [['whitetiger', slv(16, -1, 1)]], title: '不老泉 · 白虎' })) return false;
  await nar('白虎倒下，天上的金鹏发出一声暴怒的长啸，收起翅膀直扑下来。');
  if (!await fightRetry({ mobs: [['jinpeng', slv(17, -1, 1)]], allies: ['a_yunxi'], title: '半血金鹏' })) return false;
  await nar('你提着锈剑站在泉边，满身是血，金鹏的羽毛落了一地。云曦看了你很久，取了一瓢泉水，转身走了。');
  give('bulao'); F().spring = 1;
  await nar('你装了一瓶泉水，又打了一壶带走——补天阁的神藤快枯死了，阁主说过，它需要好水。');
  tip('<b>天骨禁区</b>在分宝崖西边，<b>花果山</b>在不老泉北边。');
}
async function S_tianguDone() {
  await nar('残魂散去，那副巨大的骨架“哗啦”一声塌了下来。骨堆里露出一块会发光的骨头，上面的符文你一个也不认识——可你记住了它的样子。');
}
async function S_mount() {
  await nar('花果山上的果树一棵挨着一棵，可林子正中的那棵大树长得怪极了——树皮像人脸，枝条像手臂，结着一颗颗毛茸茸的种子。');
  await nar('种子一碰就炸开，满天都是花粉。你眼前一花，看见了爹娘……不对，是幻象！');
  if (!await fightRetry({ mobs: [['pumo', slv(18, -1, 1)]], title: '蒲魔树' })) return false;
  await nar('蒲魔树倒下，你饿了一路，顺手挖了一截树根啃——居然是甜的。啃着啃着，你看见树后面的崖上，长着两个红得发亮的桃子。');
  const c = await choose(['摘！', '这么好的桃子，肯定有主人……（但是摘！）']);
  give('xiantao');
  await nar('你刚把桃子揣进怀里，整座山就晃了一下。山顶上，那个比山还沉的身影站了起来——<b>神猴王</b>。');
  await nar('它抓起半座山当锤子，砸了下来。湖水冲天而起，结成一座大阵，把你、云曦，还有好几个来偷桃的少年全困在了里面。');
  const w = await fight({ mobs: [['monkeyking', 22]], title: '神猴王 · 灵湖阵', noLose: true, flee: false });
  await nar(w ? '你竟然把神猴王的一只手打得缩了回去！可灵湖阵越收越紧——' : '你被一锤砸进了湖底，大阵越收越紧，水压得你喘不过气——');
  await nar('就在这时，你挂在脖子上当装饰的那个小东西亮了。那是一座只有四层的小塔，你一直以为它就是个好看的坠子。');
  await nar('小塔垂下一道光幕，“咔嚓”一声，灵湖阵裂开了一道缝。');
  learnSkill('ta');
  const c2 = await choose(['从裂缝里钻出去，赶紧跑！', '回头把云曦也拉出来']);
  if (c2 === 1) { F().yunxi = 1; await nar('你一头扎回阵里，抓住云曦的手腕，把她拖了出来。她看着你，第一次露出了一点笑。'); }
  await nar('天边伸来一只巨大的手掌，隔着不知多远，一掌把神猴王拍翻在地——那是百断山外某位大人物出的手。百断山的法则锁链轰然作响，抽向那只手掌。神猴王趁乱遁走了。');
  F().mount = 1;
  await nar('百断山的门开始关了。你带着锈剑、打神石、两个桃子和一壶不老泉水，跟着人流冲了出去。');
}
async function S_return() {
  await say('gezhu', '你回来了。（他看着你手里那壶不老泉水，眼睛亮了）这是……');
  await nar('你们一起把泉水浇在神藤的根上。干瘪的葫芦一个接一个鼓了起来，枯黄的叶子转绿，整株神藤发出一声低沉的嗡鸣。');
  await nar('诡爷站在神藤边上，把那柄锈剑接过去看了很久，又递还给你。');
  await say('guiye', '……它认你。拿着。');
  await say('gezhu', '补天阁欠你一个大人情。小不点——不，以后该叫你石昊了。');
  await nar('你走出内院的时候，神藤下站着一个穿内门青衫的身影。');
  await say('qingfeng', '试炼石亮了三下。我自己考进来的。');
  if (F().qf === 'spar') await say('qingfeng', '最后一关，我绕到了守关师兄背后。……你教的。');
  else if (F().qf === 'herb') await say('qingfeng', '那天你包的止血草，我留了一根，考试的时候揣在怀里。');
  else await say('qingfeng', '那天晚上你走开了。我知道你在墙角站了一会儿。……谢谢你没进来。');
  await me('我就知道！（伸手）烤肉，我欠你一顿。');
  F().qfIn = 1;
  F().end = 1; gainExp(1);
  await nar('<b>【第一卷 · 完】</b><br>石村的小不点走出了大荒，在补天阁站稳了脚跟，在百断山里闯出了名字。<br>你胸口的那道疤还在，爹娘还没有消息，那块被挖走的骨头还在别人身上。<br>路还很长。<br><br>（第二卷之后再写。大荒、补天阁、百断山都还开着，虚神界和凶兽首领也是。）');
}

async function S_yunxiBack() {
  if (F().yunxi) {
    await nar('不老泉边的白气里，站着一个白衣少女。是云曦。');
    await say('云曦', '我在等你。灵湖阵里那一下，我欠你的。');
    await nar('她摊开手，掌心里是三株沾着泉水的灵药。');
    await say('云曦', '百断山还没关严。以后你在这里撞上凶兽首领，我会来。');
    give('lingyao', 3); F().yunxiHelp = 1;
    tip('在<b>百断山</b>里打凶兽首领时，云曦会来帮你。');
  } else {
    await nar('泉边空无一人。只有一块石头上，留着一瓢水舀过的湿痕，正在慢慢变干。');
    await nar('你想起灵湖阵里自己头也不回地钻了出去。……算了，想也没用。');
  }
}
async function S_shiyi() {
  await nar('虚神界的光幕上，你的名字挤进了前十。四周的石台忽然安静了下来。');
  await nar('最高的那座石台上，一个少年慢慢转过头来。他的眼睛里，有两个瞳孔。');
  await say('石毅', '大荒来的？……排名爬得挺快。');
  await nar('你看着他，胸口那道早就长好的疤，突然一跳一跳地疼了起来。');
  if (F().vow === 'bone') { await nar('你说不清为什么，可你的眼睛离不开他的胸口。那里好像有什么东西，在和你的疤一起跳。'); await me('……你胸口疼不疼？'); await say('石毅', '（皱了皱眉）莫名其妙。'); }
  else if (F().vow === 'find') { await me('你知不知道……有一对姓石的夫妻，丢了一个孩子？'); await say('石毅', '石族姓石的人多了。（他顿了一下）丢了孩子的……也不止一家。'); }
  else { await nar('你们谁也没说话，隔着整片虚空对看了很久。'); }
  await nar('他转回身去，光幕上他的名字一动不动，挂在最前面。');
  await say('石毅', '想跟我交手，先爬到第一。');
  F().shiyi = 1;
}
async function study(id) { // learning a 宝术 by reading its 骨文: a short memory game (skippable)
  await nar('骨文在你眼前流转起来，一道接着一道。看清它们亮起的顺序，跟着走一遍——');
  const first = await runeGame(id);
  learnSkill(id);
  if (first) { C.prof = C.prof || {}; C.prof[id] = Math.max(C.prof[id] || 0, 12); logLine(`一次就看透了骨文的走向——${SKILLS[id].name} 熟练度起步就比别人高（${C.prof[id]}/${PROF[1].at}）。`, 'sys'); }
}
const EVENTS = [ // one-time scenes when you arrive somewhere (checked after the main quest's own trigger)
  { id: 'yunxi', loc: 'bd_spring', title: '不老泉边', when: () => F().mount, scene: S_yunxiBack },
];

const MAIN = [
  { id: 'q_wake', ch: 1, title: '小不点', goal: '起床', type: 'auto', scene: S_wake },
  { id: 'q_yard', ch: 1, title: '迎霞锻体', goal: '去村前空地', type: 'enter', loc: 'sc_yard', scene: S_yard },
  { id: 'q_wolf0', ch: 1, title: '进山', goal: '找林虎叔说话', type: 'talk', npc: 'linhu', scene: S_wolfAsk },
  { id: 'q_wolf', ch: 1, title: '进山', goal: '在山林打三头山狼', type: 'kill', mob: 'wolf', n: 3, loc: 'dh_forest', npc: 'chief', scene: S_wolfDone },
  { id: 'q_egg0', ch: 1, title: '鹰蛋', goal: '大壮好像有事找你', type: 'talk', npc: 'dazhuang', scene: S_eggPlan, rec: 3 },
  { id: 'q_egg', ch: 1, title: '鹰蛋', goal: '去石林的崖顶', type: 'enter', loc: 'dh_stone', scene: S_cliff, rec: 4 },
  { id: 'q_tomb0', ch: 1, title: '狻猊墓', goal: '去族长家挨骂', type: 'talk', npc: 'chief', scene: S_tombAsk },
  { id: 'q_tomb', ch: 1, title: '狻猊墓', goal: '闯过石林北边的狻猊墓', type: 'dungeon', dungeon: 'tomb', loc: 'dh_tomb', npc: 'chief', scene: S_tombDone, rec: 5 },
  { id: 'q_bei', ch: 1, title: '狈村', goal: '去狈村外看看', type: 'enter', loc: 'dh_bei', scene: S_bei, rec: 6 },
  { id: 'q_yaoding', ch: 1, title: '药鼎', goal: '回族长家，药鼎熬好了', type: 'talk', npc: 'chief', scene: S_yaoding },
  { id: 'q_shanbao', ch: 1, title: '山宝', goal: '去大荒深处', type: 'enter', loc: 'dh_deep', scene: S_shanbao, rec: 7 },
  { id: 'q_ruin', ch: 1, title: '旧村', goal: '回旧村遗址看看', type: 'enter', loc: 'dh_ruin', scene: S_ruin, rec: 8 },
  { id: 'q_jijing', ch: 1, title: '极境', goal: '练到搬血境第 9 层，然后去柳神那里', type: 'talk', npc: 'willow', scene: S_jijing, lvNeed: 9, rec: 9 },
  { id: 'q_memory', ch: 2, title: '胸口的疤', goal: '晚上去族长家', type: 'talk', npc: 'chief', scene: S_memory },
  { id: 'q_qingfeng', ch: 2, title: '清风', goal: '去出山古道', type: 'enter', loc: 'dh_road', scene: S_qingfeng, rec: 9 },
  { id: 'q_bandit0', ch: 2, title: '山贼', goal: '回村', type: 'enter', loc: 'sc_gate', scene: S_bandit },
  { id: 'q_bandit', ch: 2, title: '山贼', goal: '去出山古道救族长', type: 'enter', loc: 'dh_road', scene: S_banditFight, rec: 10 },
  { id: 'q_xushen0', ch: 2, title: '虚神界', goal: '去柳神那里', type: 'talk', npc: 'willow', scene: S_xushen },
  { id: 'q_xushen', ch: 2, title: '虚神界', goal: '在虚神界赢三场', type: 'arena', n: 3, loc: 'xs_hall', scene: S_xushenDone },
  { id: 'q_leave', ch: 2, title: '出村', goal: '去族长家告别', type: 'talk', npc: 'chief', scene: S_leave },
  { id: 'q_gate', ch: 3, title: '补天阁', goal: '沿出山古道去补天阁', type: 'enter', loc: 'bt_gate', scene: S_gate, rec: 11 },
  { id: 'q_lotus', ch: 3, title: '黑莲', goal: '去阁外山林的虎穴取黑莲', type: 'enter', loc: 'bt_tiger', scene: S_lotus, rec: 12 },
  { id: 'q_join', ch: 3, title: '入阁', goal: '回补天阁山门', type: 'talk', npc: 'qingfeng', scene: S_join },
  { id: 'q_bully', ch: 3, title: '师兄的规矩', goal: '回内院认认地方', type: 'enter', loc: 'bt_court', scene: S_bully, rec: 12 },
  { id: 'q_lei', ch: 3, title: '雷池', goal: '去雷池参悟雷道', type: 'enter', loc: 'bt_train', scene: S_lei, rec: 12 },
  { id: 'q_qf1', ch: 3, title: '外门的拳声', goal: '傍晚去山门外看看清风', type: 'talk', npc: 'qingfeng', scene: S_qf1 },
  { id: 'q_lib', ch: 3, title: '藏经阁', goal: '去藏经阁找书看', type: 'talk', npc: 'libelder', scene: S_lib },
  { id: 'q_qf2', ch: 3, title: '外门小比', goal: '山门外在比武，清风也在', type: 'enter', loc: 'bt_gate', scene: S_qf2 },
  { id: 'q_baiduan', ch: 4, title: '百断山', goal: '去内院见阁主', type: 'talk', npc: 'gezhu', scene: S_baiduan, rec: 13 },
  { id: 'q_qf3', ch: 4, title: '临行', goal: '走之前，去山门跟清风说一声', type: 'talk', npc: 'qingfeng', scene: S_qf3 },
  { id: 'q_bdgate', ch: 4, title: '百断山', goal: '去百断山口', type: 'enter', loc: 'bd_gate', scene: S_bdgate, rec: 13 },
  { id: 'q_lion', ch: 4, title: '九头狮', goal: '去狮岭', type: 'enter', loc: 'bd_lion', scene: S_lion, rec: 14 },
  { id: 'q_yu', ch: 4, title: '雨族', goal: '去断山荒漠', type: 'enter', loc: 'bd_desert', scene: S_yu, rec: 15 },
  { id: 'q_cliff', ch: 4, title: '分宝崖', goal: '去分宝崖找诡爷说的锈剑', type: 'enter', loc: 'bd_cliff', scene: S_fenbao, rec: 15 },
  { id: 'q_spring', ch: 4, title: '不老泉', goal: '去不老泉', type: 'enter', loc: 'bd_spring', scene: S_spring, rec: 16 },
  { id: 'q_tiangu', ch: 4, title: '天骨禁区', goal: '闯过分宝崖西边的天骨禁区', type: 'dungeon', dungeon: 'tiangu', loc: 'bd_bone', npc: null, scene: S_tianguDone, rec: 17 },
  { id: 'q_mount', ch: 4, title: '花果山', goal: '去花果山', type: 'enter', loc: 'bd_mount', scene: S_mount, rec: 18 },
  { id: 'q_return', ch: 4, title: '神藤', goal: '回补天阁内院，把不老泉水带给阁主', type: 'talk', npc: 'gezhu', scene: S_return },
  { id: 'q_end', ch: 4, title: '第一卷 · 完', goal: '第二卷之后再写。可以继续在各地历练、挑战虚神界和凶兽首领。', type: 'none' },
];
const SIDE = {
  sq_milk: { npc: 'ermeng', title: '二猛的兽骨', minQ: 'q_egg0', need: [['bone', 3]], ask: '小不点，给我弄三块兽骨呗？我想刻个骨牌，跟你那样认骨文。', done: '嘿嘿，够了够了！这罐兽奶给你，我从家里顺的。', reward: () => { give('milk', 4); gainExp(60); } },
  sq_herb: { npc: 'chief', title: '族长的药鼎', minQ: 'q_yaoding', need: [['lingyao', 3]], ask: '药鼎还得续几味药，大荒深处的灵药，弄三株来。', done: '好。这两颗宝药，你留着防身。', reward: () => { give('baoyao', F().ding ? 3 : 2); if (F().ding) logLine('族长多塞了一颗：“那口鼎，是你扛出来的。”', 'dim'); gainExp(200); } },
  sq_qf: { npc: 'qingfeng', title: '清风的骨牌', minQ: 'q_qf1', need: [['bone', 4]], ask: '外门不教骨文，我想自己学。你能给我弄几块带纹路的兽骨吗？我照着刻。', done: '（她把兽骨一块块摆好，眼睛亮亮的）够我刻一个月了。谢谢你，小不点。', reward: () => { give('baoyao', 2); gainExp(600); } },
};

/* ---------------- quest engine ---------------- */
const curQ = () => MAIN[C.story.q];
function questAdvance() { C.story.q = Math.min(MAIN.length - 1, C.story.q + 1); C.story.n = 0; const q = curQ(); logLine(`<span class="qnew">【主线】${q.title}</span>：${q.goal}`, 'quest'); save(); refresh(); setTimeout(storyPoll, 300); }
async function runScene(fn, meta) { // meta = { title, ch } → the scene's lines are kept in the 回忆录
  if (STATE.scene) return false; STATE.scene = fn.name || 'scene'; UI.hist = []; UI.cur = null; if (meta && NETROLE !== 'guest') UI.jEntry = { t: meta.title, ch: meta.ch || curQ().ch, l: [], at: now() }; refresh(); netSync(); let r;
  try { r = await fn(); } catch (e) { console.error(e); } finally { STATE.scene = null; const J = UI.jEntry; UI.jEntry = null; if (J && J.l.length) { JOURNAL.push(J); saveJournal(); } dlgClose(); save(); refresh(); netSync(); }
  return r !== false;
}
async function questComplete(q) { if (q.lvNeed && C.lv < q.lvNeed) { toast(`要先练到第 ${q.lvNeed} 层`); return false; } const ok = await runScene(q.scene, { title: q.title, ch: q.ch }); if (ok && curQ() === q) questAdvance(); return ok; }
function storyEvents(loc) { for (const E of EVENTS) if (E.loc === loc && !F()['ev_' + E.id] && E.when()) { F()['ev_' + E.id] = 1; runScene(E.scene, { title: E.title }); return true; } return false; }
function questTalkOptions(npc) {
  const q = curQ(), out = [];
  if (q.type === 'talk' && q.npc === npc) out.push({ t: (q.lvNeed && C.lv < q.lvNeed ? '🔒 ' : '❗ ') + q.title, f: () => questComplete(q) });
  if ((q.type === 'kill' || q.type === 'dungeon') && q.npc === npc && questReady(q)) out.push({ t: '✔ ' + q.title, f: () => questComplete(q) });
  for (const [id, S] of Object.entries(SIDE)) { if (S.npc !== npc || C.story.q < qi(S.minQ)) continue; const st = C.side?.[id]; if (st === 'done') continue;
    if (!st) out.push({ t: '❔ ' + S.title, f: () => sideOffer(id) }); else if (S.need.every(([k, n]) => itemN(k) >= n)) out.push({ t: '✔ ' + S.title, f: () => sideDone(id) }); }
  return out;
}
function questReady(q) { if (q.type === 'kill' || q.type === 'arena') return C.story.n >= q.n; if (q.type === 'dungeon') return C.story.n >= 1; return false; }
function questGoalText() { const q = curQ(); let t = q.goal;
  if (q.type === 'kill' || q.type === 'arena') t += `（${Math.min(C.story.n, q.n)}/${q.n}）` + (questReady(q) && q.npc ? ` → 回去找${NPCS[q.npc].name}` : '');
  if (q.type === 'dungeon' && questReady(q) && q.npc) t += ` → 回去找${NPCS[q.npc].name}`; if (q.lvNeed && C.lv < q.lvNeed) t += `（现在第 ${C.lv} 层）`; return t; }
function questWhere() { const q = curQ(); const npcLoc = n => Object.values(PLACES).find(p => (p.npcs || []).includes(n));
  if (q.type === 'enter') return q.loc; if (q.type === 'talk') return npcLoc(q.npc)?.id; if (q.type === 'arena') return q.loc;
  if (q.type === 'kill' || q.type === 'dungeon') return questReady(q) && q.npc ? npcLoc(q.npc)?.id : q.loc; return null; }
function storyKill(mob) { bountyKill(mob); const q = curQ(); if (q.type === 'kill' && q.mob === mob && C.story.n < q.n) { C.story.n++; logLine(`【主线】${MOBS[mob].name} ${C.story.n}/${q.n}`, 'quest'); if (C.story.n >= q.n) logLine(`【主线】回去找<b>${NPCS[q.npc].name}</b>。`, 'quest'); }
  if (itemN('peaegg') && !C.pets.ertuzi) { F().eggWins = (F().eggWins || 0) + 1; if (F().eggWins >= 8) setTimeout(hatchEgg, 600); } }
function storyArena() { const q = curQ(); if (q.type === 'arena' && C.story.n < q.n) { C.story.n++; if (C.story.n >= q.n) setTimeout(() => questComplete(q), 500); } }
function storyDungeon(id) { const q = curQ(); if (q.type === 'dungeon' && q.dungeon === id) { C.story.n = 1; if (!q.npc) setTimeout(() => questComplete(q), 600); else logLine(`【主线】回去找<b>${NPCS[q.npc].name}</b>。`, 'quest'); } }
async function hatchEgg() { if (C.pets.ertuzi || !itemN('peaegg') || STATE.scene || STATE.battle) { if (!C.pets.ertuzi && itemN('peaegg')) setTimeout(hatchEgg, 3000); return; }
  await runScene(async function S_hatch() { takeItem('peaegg'); await nar('怀里的蛋“咔”地裂开了。钻出来一只小鸟，浑身光溜溜的，一根毛都没有，冲你“啾”了一声。'); await me('……你怎么是秃的？那就叫你二秃子吧。'); gainPet('ertuzi'); await nar('后来你才知道，二秃子是孔雀一族。只是它的毛，好像一直都长不出来。'); }, { title: '二秃子' }); }
async function storyPoll() { if (!C || STATE.scene || STATE.battle || STATE.dungeon || STATE.mode !== 'play' || NETROLE === 'guest') return; const q = curQ(); if (q.type === 'auto') return questComplete(q); if (STATE.dtPending) return dongtianPick(); }
async function sideOffer(id) { const S = SIDE[id]; C.side = C.side || {}; await runScene(async () => { await say(S.npc, S.ask); const c = await choose(['交给我', '下次吧']); if (c === 0) { C.side[id] = 'on'; logLine(`【支线】${S.title}：${S.need.map(([k, n]) => ITEMS[k].name + '×' + n).join('、')} → ${NPCS[S.npc].name}`, 'quest'); } }); }
async function sideDone(id) { const S = SIDE[id]; await runScene(async () => { for (const [k, n] of S.need) takeItem(k, n); await say(S.npc, S.done); S.reward(); C.side[id] = 'done'; }); }
