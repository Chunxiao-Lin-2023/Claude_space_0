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
const E_TIGER = { name: '黑纹虎', sub: '虎穴之主', intro: ['腥风扑面。它比你见过的任何一头老虎都大。'], phase: '黑纹虎伏低身子，背上的黑纹一道道亮起来，像烧红的铁。', low: { who: '清风', t: '（你想起清风攥着补天石，在山门外等你的样子。）……还有人在等这朵莲花。' } };
async function S_wake() {
  await chapterCard('第一章', '石村', '大荒深处，一株烧焦的柳树下');
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
  const win = await fight({ mobs: [['eagle', 5]], title: '石林 · 青鳞鹰', noLose: true, flee: false, noPet: true, allies: c === 0 ? [] : ['a_kids'],
    epic: { name: '青鳞鹰', sub: '太古魔禽的后裔 · 石林之主', intro: ['它的翅膀遮住了半边天。', '你怀里还抱着那枚蛋。'], phase: '青鳞鹰一声厉啸，翅上的骨文全亮了——每一片鳞都成了刀！',
      low: c === 0 ? { who: '你自己', t: '不能倒。我倒了，它就去追大壮他们了。' } : { who: '大壮', t: '“小不点——！你撑住啊！我们都在呢！”' } } });
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
  if (!await fightRetry({ mobs: [['fengbei', slv(7, -1, 1)]], title: '风狈', epic: { name: '风狈', sub: '狈村百年才出一个的天才', intro: ['狂风卷着落叶，在他身后聚成一头狈的虚影。', '他比你大好几岁，看你的眼神，像在看一块肉。'], phase: '风狈额头的狈祖图腾渗出了血——他把祖灵请到了自己身上！', low: { who: '族长', t: '（耳边忽然响起族长的声音）“石村的孩子，挨了打，要站着还回去。”' }, end: ['风停了。'] } })) return false;
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
  await cine('光门合上的那一刻，你回头看了一眼。<br>你出生……不，你长大的那个石村，<br>被岩浆一寸一寸地吞了下去。');
  await nar('再睁眼时，眼前是一片山清水秀的谷地。溪水从身边流过，鸟在叫。柳神的树桩扎在新的土里，那根柳枝轻轻晃着，像是累坏了。');
  F().moved = 1; give('baoyao', 1);
  await say('chief', '……石村，还在。（老人跪下来，冲柳神磕了三个头）');
  tip('石村搬家了。旧村的废墟在<b>大荒深处的东边</b>。');
}
async function S_ruin() {
  await cine('旧村只剩一片黑石。<br>你蹲在一块还算完整的大石头前，用指甲一笔一画地刻：<br><b>“石村迁往……”</b>');
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
  await cine('你看见搬血境的尽头，还有一段路。<br>路上没有脚印——几百年来，没有人走过。<br>你一步一步，走了上去。');
  learnGongfa('jijing'); F().jijing = 1;
  await nar('远处的山梁上，一个穿红衣服的小姑娘骑在一只火红的大鸟背上，正好往这边看了一眼。她眨了眨眼睛，大鸟一振翅，飞远了。');
  await say('chief', '搬血极境……几百年来，大荒里能走到这一步的，我只听说过。（他沉默了很久）小不点，晚上来我屋里。有些事，该告诉你了。');
}
/* ---------------- 第二章 · 出村 ---------------- */
async function S_memory() {
  await chapterCard('第二章', '出村', '胸口那道疤，是有来历的');
  await say('chief', '你不是石村生的。你被人送来那年，胸口有一道很长的疤，刚刚长好。');
  await nar('族长的话像一块石头扔进了水里。你脑子里“嗡”的一声，那些很久很久以前的画面，一下子全浮了上来——');
  await cine('一个高大的老人背着你去猎貔貅，你骑在他脖子上咯咯地笑。', 'mem');
  await cine('一只女人的手按住你的胸口。刀锋很凉。<br>她从你胸口取走了一块骨头——那块骨头，在发光。', 'mem');
  await cine('一男一女红着眼睛冲进一座大宅子。<br>他们把你护在身后，和一屋子的人打了起来。<br>……那是你爹，你娘。', 'mem');
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
  await cine('一座、两座、三座。<br>三片小小的天地在你体内撑开，神光从里面涌出来。<br><b>洞天境</b>——你一口气开了三座洞天。');
  if (C.lv < 10) { C.lv = 10; C.exp = 0; fullHeal(); logLine('<b class="lvup">踏入洞天境！</b>', 'sys'); }
  if (!await fightRetry({ mobs: [['jiling', slv(11, -1, 1)]], title: '山贼的祭灵', epic: { name: '祭灵', sub: '山贼供了三代的邪物 · 吃过七个村子的香火', seal: '邪祟', intro: ['族长被绑在木桩上，冲你拼命摇头。', '你没有看他。你看着那团黑影。'], phase: '祭灵张开了一张不存在的嘴——营地里所有的火把同时熄灭了。', low: { who: '族长', t: '“小不点，跑啊——！”<br>……你没有跑。是这个老人，一口兽奶一口米汤，把你喂大的。' }, end: ['黑影在你拳下碎成了一千片。', '你回过头。族长在哭。'] } })) return false;
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
  await cine('你走到村口，回头看了一眼。<br>大壮在哭，皮猴在跳着挥手，二猛背过了身去。<br>柳神的那根柳枝在风里摇着——像是在说，去吧。');
  F().butian = 1;
  await cine('<div class="cc"><small>第一章</small><b>石村</b><i>完</i></div>', 'card');
  tip('沿着出山古道一直往北，就是<b>补天阁</b>。');
}
/* ---------------- 第三章 · 补天阁 ---------------- */
async function S_gate() {
  await chapterCard('第三章', '补天阁', '大荒之外，还有更大的天');
  await nar('补天阁的山门比你想的还要高。门口排着长长的队伍，都是来拜师的少年，每个人手里都捧着一块发光的石头——补天石，补天阁收徒的信物。');
  await say('qingfeng', '我们的补天石，族长给的，在你包袱里。');
  await nar('你一摸包袱，空了。人群里一个瘦高个正挤出去，冲你挤了挤眼睛，转眼就没影了。');
  await me('……我的石头！');
  await say('守门弟子', '没有补天石？那就按老规矩：去阁外山林的虎穴里，把那朵黑莲带回来。带得回来，就算你过了。带不回来……（他笑了笑）也就不用回来了。');
  tip('<b>虎穴</b>在阁外山林的西边。');
}
async function S_lotus() {
  await nar('虎穴里腥风扑面。洞底一汪黑水，水面上开着一朵黑色的莲花，花瓣边缘泛着一圈幽光。一头黑纹虎正趴在水边打盹。');
  await nar('洞壁的阴影里，还趴着另一头，呼噜打得震天响。你屏住呼吸——');
  const sn = await miniGame('sneak', { title: '潜行', desc: '一步一步挪过去。老虎呼气的时候，正是你迈步的时候。', steps: 6 });
  if (sn.ok) { await nar('你挪到了水边，手指碰到了黑莲的花瓣——'); await nar('“咕——噜噜噜噜——”'); await nar('你的肚子叫了。叫得整个山洞都在回响。离你最近的那头黑纹虎猛地睁开了眼睛。另一头翻了个身，接着睡。'); await me('……我早上就喝了一口兽奶。');
    if (!await fightRetry({ mobs: [['tiger', slv(12)]], title: '虎穴 · 黑纹虎', epic: E_TIGER })) return false; }
  else { await nar('脚下“咔嚓”一声，你踩断了一根骨头。两头黑纹虎同时睁开了眼睛。'); await me('……我就说这洞里骨头太多了。');
    if (!await fightRetry({ mobs: [['tiger', slv(12)], ['tiger', slv(11)]], title: '虎穴 · 黑纹虎', epic: E_TIGER })) return false; }
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
  for (let k = 0; ; k++) { const th = await miniGame('thunder', { title: '引雷', desc: k ? '再来。这回看准了。' : '一道雷光在云里亮起，朝你直劈下来——', strikes: 5, need: 3 }); if (th.ok || th.skip || th.gaveUp) break; await nar('你被劈得眼前一黑，头发全竖了起来，鼻子里全是焦糊味。缓过气来，接着坐。'); fullHeal(); }
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
  await chapterCard('第四章', '百断山', '活着出来，是唯一的规矩');
  await say('gezhu', '百断山要开了。各族的少年天才都会进去抢机缘——宝药、宝骨、上古留下来的兵器。补天阁要派人去，我想让你去。');
  await say('gezhu', '里面的规矩只有一条：活着出来。');
  await say('guiye', '……（诡爷突然开口了，声音沙哑得像两块石头在磨）分宝崖上……有一柄锈剑。');
  await nar('你愣了一下，再看他，他又不说话了，好像刚才那句不是他说的。');
  F().baiduan = 1;
  tip('<b>百断山</b>从补天阁内院往北走。');
}
async function S_bdgate() {
  await nar('百断山口挤满了人。各族的少年骑着异兽，背着兵器，谁看谁都不顺眼。');
  await say('xiaotian', '小师弟，跟紧我。我叫萧天，阁主让我带你。……先说好，我是来找太一真水的，别的机缘你自己抢。');
  await me('萧天师兄，你饿不饿？');
  await say('xiaotian', '……刚进山，你就饿了？');
  await nar('你从包袱里掏出一口小铁锅、一把盐、半袋香料，又从林子里拎回来一只肥得流油的山鸡。萧天看着你生火、拔毛、翻烤，嘴张得越来越大。');
  await say('xiaotian', '你……进百断山，带了锅？');
  await me('出门在外，吃饭最大。鸡腿给你一个。');
  await nar('鸡腿的香味飘出去老远。人群里挤出一个银发少年，身后浮着一圈淡淡的灵光——灵族的太古遗种。');
  await say('灵族少年', '大荒来的野孩子，在百断山里烤鸡？这只鸡，本少收下了。你，也一起收下当个烧火童子。');
  const c = await choose(['（把鸡腿往嘴里一塞）先吃完再打。', '鸡是我的。你是谁？']);
  if (c === 0) await nar('你三口两口啃完了鸡腿，擦了擦嘴，站了起来。灵族少年的脸都气白了。');
  if (!await fightRetry({ mobs: [['lingyi', slv(13, 0, 1)]], title: '百断山口 · 灵族遗种', epic: { name: '灵族遗种', sub: '太古灵族的血脉 · 眼睛长在头顶上', seal: '天骄', intro: ['他看你的眼神，像在看一只会走路的烤鸡。'], phase: '灵族少年身后的灵光凝成了一张古老的脸——他把祖上的血脉催动了！', low: { who: '萧天', t: '“小师弟！他的灵光撑不了多久，耗他！”' } } })) return false;
  await say('灵族少年', '……你、你给我等着！');
  await say('xiaotian', '（盯着你看了半天）阁主让我带你……我现在觉得，是你带我。');
  await nar('一个穿红衣服的小姑娘骑在火红的大鸟背上，正好看见了这一幕——是那天在大荒山梁上的那个。');
  await say('huolinger', '是你？大荒里那个小不点？我叫火灵儿。听说你在虚神界把好几个记录都刷了？');
  await me('你骑的那只大鸟……能吃吗？');
  await say('huolinger', '（脸一下子红了）你敢！');
  await nar('话音没落，一只更大、更凶的红毛鸟从天上俯冲下来，叼走了你锅里剩下的半只鸡。');
  if (!await fightRetry({ mobs: [['dahongbird', slv(13)]], title: '抢鸡的大红鸟' })) return false;
  await nar('那只大鸟挨了一顿揍，扑棱着飞走了，临走还回头冲你骂了一声。你记住它了。');
  tip('<b>狮岭</b>在百断山口北边。火灵儿说她要去那边的神窟。');
}
async function S_lion() {
  await nar('狮岭顶上的洞里，九道吼声同时响起。一头生着九个脑袋的金色巨狮从洞里走了出来，每个脑袋都比你整个人还大。');
  await say('九头狮', '人族的小崽子？正好，本王缺一个战仆。跪下，给本王梳鬃毛。');
  await say('huolinger', '（追了上来）黄金九头狮！它守着神窟的门——一起上！');
  if (!await fightRetry({ mobs: [['lion', slv(14, -1, 1)]], allies: ['a_huo'], title: '黄金九头狮' })) return false;
  await nar('九头狮趴在地上，九个脑袋晕了八个。剩下那个最小的，眼泪汪汪地看着你。');
  await me('（盯着那个最小的脑袋看了半天）……九个头，少一个，应该也不影响走路吧？');
  await say('九头狮', '！！！（九个脑袋同时清醒了过来）大、大哥！有话好说！我、我给你当小弟！');
  await say('huolinger', '……你刚才是不是真的在想“红烧狮子头”？');
  await me('清蒸也行。');
  await nar('九头狮浑身一哆嗦，从此认定你是这世上最可怕的人族——不，最可怕的大哥。');
  F().lion = 1; gainExp(BAL.expNext(C.lv) * 0.3);
  await say('huolinger', '神窟就在狮岭西边。我先去了，你……你别跟来！');
  tip('<b>神窟</b>在狮岭西边。九头狮以后会在要紧的时候来帮你。');
}
async function S_cave() {
  await nar('神窟里黑得伸手不见五指，只有洞壁上的古老骨文一明一暗。再往里走，你听见了狼嚎，还有火焰炸开的声音。');
  await nar('火灵儿被一群眼睛发绿的窟狼堵在洞底，她的火鸟受了伤，缩在她身后。她咬着嘴唇，手里的火焰已经越来越弱了。');
  await say('huolinger', '……谁让你跟来的！');
  await me('我饿了，进来找吃的。');
  if (!await fightRetry({ mobs: [['cavewolf', slv(14)], ['cavewolf', slv(14)], ['cavewolf', slv(13)]], allies: ['a_lion'], title: '神窟 · 窟狼群', epic: { name: '窟狼群', sub: '神窟深处的狼，见过血就不会走', seal: '狼群', intro: ['几十双绿眼睛在黑暗里同时亮了起来。', '九头狮在你身后，九个脑袋一起咽了口唾沫。'], low: { who: '火灵儿', t: '“喂……你别死在我前面啊。”' }, end: ['最后一头狼倒下的时候，洞里的骨文全亮了。'] } })) return false;
  await nar('你转过身。火灵儿坐在地上，看着你，好半天没说话。');
  await say('huolinger', '……谢谢。（她别过脸，从怀里摸出一根火红的羽毛，塞进你手里）这是朱雀真羽，我从小带着的。你……你拿着。不许弄丢！');
  gainRelic('r_zhuque'); F().cave = 1;
  await cine('那根羽毛很轻，可握在手里，是烫的。<br>火灵儿走在前面，一直没有回头。<br>你看见她的耳朵，红得跟那根羽毛一样。');
  tip('雨族的人在<b>断山荒漠</b>那边打听你。');
}
async function S_yu() {
  await nar('荒漠里，风沙忽然停了。一群披着冰甲的人从四面围了上来，身后跟着几头比马还大的白狼。');
  await nar('沙丘上坐着一个穿紫衣的雨族少年，手里转着一枚冰符，看你的眼神像在看一只蚂蚁。');
  await say('雨紫陌', '补天阁的小子？我是雨紫陌。你在虚神界抢了我们雨族的名次——百断山里死个把人，再正常不过。');
  await say('雨紫陌', '动手。留口气就行，我想看看他是怎么死的。');
  if (!await fightRetry({ mobs: [['yuzu', slv(14)], ['bigwolf', slv(14)], ['bigwolf', slv(14)]], allies: ['a_lion'], title: '雨族截杀' })) return false;
  if (!await fightRetry({ mobs: [['yuchief', slv(15, -1, 1)]], title: '雨族高手', epic: { name: '雨族高手', sub: '雨紫陌手下的头号打手', intro: ['冰甲上结着霜。他每走一步，脚下的沙子就冻成一片。', '沙丘上，雨紫陌在笑。'], phase: '他摘下了面罩。寒气倒灌出来，整片荒漠下起了冰雨。', low: { who: '柳神', t: '（胸口那片柳叶做的护符微微一热，像有人在你耳边说：别睡。）' } } })) return false;
  await nar('雨紫陌脸上的笑没了。他捏碎了手里的冰符——一股寒气瞬间把你冻成了一座冰雕。你动不了，只能眼睁睁看着剩下的雨族战士围上来——');
  await nar('一团红影从天上砸了下来，一爪子把冰雕抓了起来——是那只抢过你鸡的大红鸟！它驮着你，跌跌撞撞地飞出了荒漠。');
  await nar('冰化开以后，你躺在一片沙丘上。那只大红鸟蹲在旁边，歪着脑袋，死死盯着你怀里——那根朱雀真羽露出了一截，在发光。');
  await say('大红鸟', '（它的眼神变了。它慢慢低下头，用脑袋碰了碰那根羽毛，又碰了碰你。）');
  await nar('你后来才知道，大红鸟身上流着朱雀的血。它闻到了先祖的气息，就认定了你。');
  const c = await choose(['（摸摸它的脑袋）谢了，兄弟。', '……你是不是想等我化了再吃？']);
  if (c === 1) await nar('大红鸟“嘎”地叫了一声，一嘴啄在你脑门上。');
  await nar('它用脑袋蹭了蹭你的胳膊。从今天起，它跟你了。你给它起名叫<b>大红</b>。');
  gainPet('dahong'); C.pets.dahong.aff = c === 0 ? 22 : 12; F().yuDone = 1;
  await say('xiaotian', '（萧天气喘吁吁地找了过来）小师弟！你还活着？！……太好了。我打听到了，太一真水就在荒漠东边的潭里——可雨族的人也在往那边去。');
  tip('<b>太一真水潭</b>在断山荒漠东边。灵兽伙伴在“灵兽”页里换着带，战斗里也能换上场。');
}
async function S_water() {
  await nar('荒漠东边，一汪小小的水潭藏在两块断石中间，水清得像不存在。潭边已经站满了雨族的人，雨紫陌也在。');
  await say('雨紫陌', '又是你？太一真水是雨族先找到的。识相的，滚。');
  await say('xiaotian', '（把一颗定光珠塞进你手里）小师弟，用这个装。装一滴就够我用了！');
  await me('一滴？');
  await nar('你看了看定光珠，又看了看那一潭水。雨族的人已经围了上来。');
  const c = await choose(['装一滴就跑', '（一个更好的主意）']);
  if (c === 0) await nar('你刚把定光珠伸进潭里，一支冰矛就擦着你的耳朵飞了过去——装一滴是来不及了。那就——');
  await nar('你一头扎进了潭里。');
  const ms = await miniGame('mash', { title: '喝干太一真水', desc: '咕咚咕咚咕咚——趁雨族的人还没反应过来！', time: 6500, rate: 8 });
  await nar(ms.ok ? '等雨紫陌回过神来，潭底已经见了石头。你打了一个长长的、亮晶晶的嗝。' : '你喝到一半呛住了，可还是喝下去了大半潭。剩下的被你用定光珠装得满满当当。');
  await say('雨紫陌', '你……你把太一真水……喝了？！整潭？！');
  await say('xiaotian', '（萧天捂住了脸）……我只要一滴啊……');
  learnGongfa('taiyi'); F().water = 1; F().guRegrow = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  await cine('真水在你身体里化开，凉得像冬天的溪。<br>它一路往下流，流到胸口那道疤的地方，停住了。<br>那里……很痒。像有什么东西，在慢慢地、慢慢地长。', 'mem');
  await nar('你低头看了看胸口。那道疤底下，隐隐透出一点光——很淡，淡得像是错觉。');
  await say('雨紫陌', '给我杀了他！');
  if (!await fightRetry({ mobs: [['yuzu', slv(15)], ['yuzu', slv(15)], ['fengyin', slv(16, 0, 1)]], allies: ['a_lion'], title: '真水潭 · 雨族封印者', epic: { name: '雨族封印者', sub: '把境界压在门槛下混进来的老怪物', seal: '封印', intro: ['一个看起来和你差不多大的雨族少年走了出来。', '可他的眼睛，老得像一口枯井。'], phase: '他撕开了身上的封印——真正的境界一点点漏了出来，整片天都暗了！', low: { who: '萧天', t: '“小师弟！撑住！百断山……百断山有规矩的！”' } } })) return false;
  await cine('封印者的境界一漏出来，天就裂开了。<br>一道比山还粗的雷，从断口里劈下来——<br>正正劈在他头上。<br>百断山的规矩只有一条：<b>境界高的，不准进来。</b>');
  await nar('雷光散去，地上只剩一块焦黑的冰符。雨紫陌的脸白得像纸，一句话没说，带着人走了。');
  await say('xiaotian', '……（萧天把定光珠揣进怀里，看着里面那一点点水）够了。真的够了。小师弟，我欠你一条命。');
  give('taiyi');
  tip('诡爷说的锈剑在<b>分宝崖</b>，从狮岭往北走。');
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
  if (!await fightRetry({ mobs: [['whitetiger', slv(16, -1, 1)]], title: '不老泉 · 白虎', epic: { name: '白虎', sub: '不老泉的守泉兽', intro: ['它守着这眼泉，守了不知道多少年。'], phase: '白虎周身腾起白色的煞气，泉水都跟着沸了。' } })) return false;
  await nar('白虎倒下，天上的金鹏发出一声暴怒的长啸，收起翅膀直扑下来。');
  if (!await fightRetry({ mobs: [['jinpeng', slv(17, -1, 1)]], allies: ['a_yunxi'], title: '半血金鹏', epic: { name: '半血金鹏', sub: '身上流着一半金翅大鹏的血', intro: ['它收起翅膀扑下来，整片天都暗了。', '云曦第一次拔出了剑，站到了你旁边。'], phase: '金鹏半边身子燃起了金火——那是它体内金翅大鹏的血，在烧。', low: { who: '云曦', t: '“……站起来。你不是要泉水吗？”' }, end: ['金色的羽毛落了一地，像下了一场雨。'] } })) return false;
  await nar('你提着锈剑站在泉边，满身是血，金鹏的羽毛落了一地。云曦看了你很久，取了一瓢泉水，转身走了。');
  await nar('可泉眼冒水越来越慢了——不老泉，快干了。你看了看手里的小壶，又看了看那眼泉。');
  await me('……一壶不够神藤喝的吧。');
  await nar('你蹲下去，两只手插进泉底的石头缝里，“嘿”的一声——把整眼泉，连着泉底那块大青石，一起抱了起来。');
  await nar('泉水顺着石头往下淌，淌了你一身。远处的几个少年看傻了，有一个手里的兵器掉在了地上。');
  give('bulao'); F().spring = 1; F().carrySpring = 1;
  tip('<b>天骨禁区</b>在分宝崖西边，<b>花果山</b>在不老泉北边。');
}
async function S_tianguDone() {
  await nar('残魂散去，那副巨大的骨架“哗啦”一声塌了下来。骨堆里露出一块会发光的骨头，上面的符文你一个也不认识——可你记住了它的样子。');
  await nar('骨堆最底下，压着一样小东西。你扒开碎骨，是一座只有巴掌大、四层高的小塔，灰扑扑的，像谁家孩子丢的玩具。');
  await nar('你把它捡起来，挂在了脖子上。……挺好看的。');
  await cine('小塔贴着你的胸口，凉凉的。<br>你没有看见——在你挂上它的那一刻，<br>它的最底下一层，极轻极轻地亮了一下。');
  learnSkill('ta');
}
async function S_mount() {
  await nar('花果山上的果树一棵挨着一棵，可林子正中的那棵大树长得怪极了——树皮像人脸，枝条像手臂，结着一颗颗毛茸茸的种子。');
  await nar('种子一碰就炸开，满天都是花粉。你眼前一花，看见了爹娘……不对，是幻象！');
  if (!await fightRetry({ mobs: [['pumo', slv(18, -1, 1)]], title: '蒲魔树', epic: { name: '蒲魔树', sub: '会造梦的妖树', seal: '妖', intro: ['花粉里，你看见了爹娘。他们冲你伸出了手。', '……是假的。你知道是假的。'], phase: '蒲魔树把根扎进了你的影子里——你听见娘在叫你的小名。', low: { who: '你自己', t: '（你咬破了舌尖）……他们还没见过长大的我。我不能死在一个梦里。' }, end: ['幻象碎了。', '你在原地站了很久，才想起擦一擦脸。'] } })) return false;
  await nar('山顶传来一声震天的怒吼。你爬上去一看——神猴王站在山巅，比山还高，脚边是一棵通体发光的桃树，结着几颗红得透亮的桃子：<b>仙桃圣药</b>。');
  await nar('各族的天才已经把它围住了。最前面站着两个人：一个是云曦，白衣上已经染了血；另一个少年背对着你，身边绕着一只巨大的妖蝶。');
  await nar('他回过头看了一眼战场。你看见了他的眼睛——<b>每只眼睛里，都有两个瞳孔</b>。');
  await say('各族少年', '是石毅！石国的重瞳者！有他在前面顶着，我们有机会！');
  const c = await choose(['冲到前面，跟他们一起打神猴王', '（绕到后面……那棵桃树没人看着）']);
  if (c === 0) {
    const w = await fight({ mobs: [['monkeyking', 22]], title: '神猴王 · 山巅', noLose: true, flee: false, allies: ['a_yunxi'], epic: { name: '神猴王', sub: '花果山之主 · 百断山里最古老的凶物', seal: '太古', intro: ['它站起来的时候，山矮了一截。', '重瞳少年在它左边，云曦在它右边——你在正面。'], phase: '神猴王抓起半座山，抡了下来！', low: { who: '小塔', t: '（挂在你脖子上的那座小塔，第一次发烫了。）' } } });
    await nar(w ? '你一拳打在神猴王的脚趾上，它疼得跳了起来——趁它跳起来的那一下，你一个翻滚，滚到了桃树底下。' : '你被一巴掌拍飞了出去，正好砸在桃树底下。……这也行？'); }
  else { const sn = await miniGame('sneak', { title: '偷圣药', desc: '神猴王在前面打得正凶。它回头看的时候，千万别动。', steps: 6 });
    await nar(sn.ok ? '你一步一步挪到了桃树底下，神猴王一次都没发现。' : '神猴王回头瞥了一眼，你立刻趴在地上装成一块石头——它没看出来。'); }
  await nar('你抱住那棵仙桃圣药，“嘿”的一声——<b>连根拔了起来</b>。');
  await nar('神猴王愣住了。所有人都愣住了。重瞳少年转过头，第一次正眼看你。');
  await say('神猴王', '我的……圣药？！我的圣药！！！');
  give('xiantao', 2); F().shengyao = 1;
  await nar('它一脚跺下去，湖水冲天而起，结成一座大阵，把你、云曦，还有好几个来偷桃的少年全困在了里面。阵越收越紧，水压得你喘不过气——');
  await cine('就在这时，你胸口那座小塔，亮了。<br>它垂下一道光幕，轻轻一磕——<br>“咔嚓”。灵湖阵裂开了一道缝。');
  learnSkill('ta');
  const c2 = await choose(['从裂缝里钻出去，赶紧跑！', '回头把云曦也拉出来']);
  if (c2 === 1) { F().yunxi = 1; await nar('你一头扎回阵里，抓住云曦的手腕，把她拖了出来。她看着你，第一次露出了一点笑。'); }
  await nar('神猴王疯了一样追过来，一屁股坐在百断山的出口上，把路堵得死死的。');
  await say('神猴王', '交出圣药！不然，谁也别想出去！');
  await nar('天边忽然烧了起来。一只燃着火的巨掌，隔着不知多远，从天外伸进百断山——');
  await say('huolinger', '（她一下子跳了起来）是我父皇！是<b>火皇</b>！');
  await cine('火皇的手掌落下来，没有声音。<br>神猴王被按进了山里，半天没爬起来。<br>它看了那只手很久，终于让开了路。');
  await nar('百断山的门开始关了。你扛着整眼不老泉、抱着一棵仙桃圣药、背着锈剑、揣着打神石，跟着人流冲了出去。');
  await nar('出口外的山梁上，那只巨大的妖蝶停在半空。蝶背上的重瞳少年低头看着你，看了很久。');
  await cine('他的眼睛里有两个瞳孔。<br>你不认识他。<br>可不知道为什么，你胸口那道疤，忽然疼了一下。', 'mem');
  F().mount = 1; F().sawShiyi = 1;
}
async function S_return() {
  if (F().carrySpring) { await nar('你扛着一块往下淌水的大青石走进内院。补天阁的弟子一路跟在你后面，越跟越多。'); await say('gezhu', '……你把整眼不老泉，搬回来了？'); await me('一壶不够它喝。'); await say('guiye', '……（诡爷的嘴角，好像动了一下）'); }
  else await say('gezhu', '你回来了。（他看着你手里那壶不老泉水，眼睛亮了）这是……');
  if (F().shengyao) await nar('你又把那棵仙桃圣药种在了神藤旁边。两株灵根挨在一起，叶子轻轻碰了碰，像是在打招呼。');
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
  await cine('<div class="cc"><small>第一卷</small><b>石村少年</b><i>完</i></div>', 'card');
  await nar('石村的小不点走出了大荒，在补天阁站稳了脚跟，在百断山里闯出了名字。<br>你胸口的那道疤还在，爹娘还没有消息，那块被挖走的骨头还在别人身上。<br>路还很长。');
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
  { id: 'q_cave', ch: 4, title: '神窟', goal: '去狮岭西边的神窟找火灵儿', type: 'enter', loc: 'bd_cave', scene: S_cave, rec: 14 },
  { id: 'q_yu', ch: 4, title: '雨族', goal: '去断山荒漠', type: 'enter', loc: 'bd_desert', scene: S_yu, rec: 15 },
  { id: 'q_water', ch: 4, title: '太一真水', goal: '去断山荒漠东边的太一真水潭', type: 'enter', loc: 'bd_water', scene: S_water, rec: 15 },
  { id: 'q_cliff', ch: 4, title: '分宝崖', goal: '去分宝崖找诡爷说的锈剑', type: 'enter', loc: 'bd_cliff', scene: S_fenbao, rec: 15 },
  { id: 'q_spring', ch: 4, title: '不老泉', goal: '去不老泉', type: 'enter', loc: 'bd_spring', scene: S_spring, rec: 16 },
  { id: 'q_tiangu', ch: 4, title: '天骨禁区', goal: '闯过分宝崖西边的天骨禁区', type: 'dungeon', dungeon: 'tiangu', loc: 'bd_bone', npc: null, scene: S_tianguDone, rec: 17 },
  { id: 'q_mount', ch: 4, title: '花果山', goal: '去花果山', type: 'enter', loc: 'bd_mount', scene: S_mount, rec: 18 },
  { id: 'q_return', ch: 4, title: '神藤', goal: '回补天阁内院，把不老泉水带给阁主', type: 'talk', npc: 'gezhu', scene: S_return },
  { id: 'q_end', ch: 5, title: '第二卷 · 石国', goal: '回石村，去柳神那里', type: 'talk', npc: 'willow', scene: S_v2start },
  { id: 'q_sgarrive', ch: 5, title: '皇都', goal: '往北走到石国皇都的城门', type: 'enter', loc: 'sg_gate', scene: S_sgArrive, rec: 20 },
  { id: 'q_sgmarket', ch: 5, title: '坊市', goal: '进城，去皇都坊市', type: 'enter', loc: 'sg_market', scene: S_sgMarket, rec: 20 },
  { id: 'q_yuwang', ch: 5, title: '雨王府', goal: '去坊市西边的雨王府“吃饭”', type: 'enter', loc: 'sg_yuwang', scene: S_yuwang, rec: 21 },
  { id: 'q_zhong', ch: 5, title: '钟伯', goal: '……', type: 'auto', scene: S_zhong },
  { id: 'q_wuwang', ch: 5, title: '武王府', goal: '去坊市东边的武王府，问一句“是谁”', type: 'enter', loc: 'sg_wuwang', scene: S_wuwang, rec: 22 },
  { id: 'q_invite', ch: 6, title: '请帖', goal: '坊市里，雷族的雷霆在找你', type: 'talk', npc: 'leiting', scene: S_invite },
  { id: 'q_shouyan', ch: 6, title: '人皇寿宴', goal: '去坊市北边的皇宫赴宴', type: 'enter', loc: 'sg_palace', scene: S_shouyan, rec: 23 },
  { id: 'q_jiaojun', ch: 6, title: '校军场', goal: '去皇宫西边的校军场，两个尊者在等你', type: 'enter', loc: 'sg_field', scene: S_jiaojun, rec: 24 },
  { id: 'q_houfu', ch: 6, title: '荒天侯', goal: '去皇宫东边看看你的侯府', type: 'enter', loc: 'sg_hou', scene: S_houfu },
  { id: 'q_leiting', ch: 6, title: '你娘的消息', goal: '去坊市找雷霆', type: 'talk', npc: 'leiting', scene: S_leiting },
  { id: 'q_v3', ch: 7, title: '第三卷 · 石皇', goal: '出皇都往东，去火国边关', type: 'enter', loc: 'hg_border', scene: S_v3start, rec: 25 },
  { id: 'q_huohuang', ch: 7, title: '火国', goal: '去火国皇城', type: 'enter', loc: 'hg_city', scene: S_huohuang, rec: 25 },
  { id: 'q_niepan', ch: 7, title: '涅槃池', goal: '去皇城东边的祖地 · 涅槃池', type: 'enter', loc: 'hg_nirvana', scene: S_niepan, rec: 26 },
  { id: 'q_letter', ch: 7, title: '战书', goal: '……', type: 'auto', scene: S_letter },
  { id: 'q_shiyi2', ch: 7, title: '双石', goal: '回皇都，从荒天侯府往北，登上天空战场', type: 'enter', loc: 'sg_sky', scene: S_shiyiDuel, rec: 28, lvNeed: 26 },
  { id: 'q_dajie', ch: 8, title: '大劫', goal: '回荒天侯府找钟伯', type: 'talk', npc: 'laozhong', scene: S_dajie },
  { id: 'q_tiangong', ch: 8, title: '中央天宫', goal: '闯进皇宫北边的中央天宫', type: 'enter', loc: 'sg_inner', scene: S_tiangong, rec: 29 },
  { id: 'q_qishen', ch: 9, title: '七神', goal: '……', type: 'auto', scene: S_qishen },
  { id: 'q_shengdi', ch: 9, title: '血祭台', goal: '去中央天宫西边的血祭台', type: 'enter', loc: 'sg_altar', scene: S_shengdi, rec: 32 },
  { id: 'q_parents', ch: 9, title: '封印', goal: '……', type: 'auto', scene: S_parents },
  { id: 'q_farewell', ch: 9, title: '回家', goal: '带爹娘回石村找族长', type: 'talk', npc: 'chief', scene: S_farewell },
  { id: 'q_v3end', ch: 10, title: '第四卷 · 登天', goal: '回皇都的荒天侯府，钟伯在找你', type: 'talk', npc: 'laozhong', scene: S_v4start },
  { id: 'q_bzcamp', ch: 10, title: '百族营地', goal: '从血祭台往西，去下界边陲的百族营地', type: 'enter', loc: 'bz_camp', scene: S_bzCamp, rec: 34 },
  { id: 'q_baojie', ch: 10, title: '太古宝界', goal: '闯过营地西边的太古宝界，找到地火液海', type: 'dungeon', dungeon: 'baojie', loc: 'bz_baojie', npc: null, scene: S_baojieDone, rec: 35 },
  { id: 'q_bzfield', ch: 10, title: '百族战场', goal: '在百族战场打倒三个金乌族战士', type: 'kill', mob: 'jinwu', n: 3, loc: 'bz_field', npc: 'bzlao', scene: S_bzField, rec: 36 },
  { id: 'q_bzcore', ch: 10, title: '战场尽头', goal: '去百族战场北边的战场尽头', type: 'enter', loc: 'bz_core', scene: S_bzCore, rec: 37 },
  { id: 'q_altar', ch: 10, title: '飞升祭坛', goal: '去百族战场东边的飞升祭坛', type: 'enter', loc: 'bz_altar', scene: S_altar, rec: 38 },
  { id: 'q_yunzu', ch: 10, title: '云族', goal: '去营地东边的云族遗地', type: 'enter', loc: 'bz_yun', scene: S_yunzu, rec: 38 },
  { id: 'q_huobye', ch: 11, title: '火灵儿', goal: '去火国皇城找火灵儿', type: 'talk', npc: 'huolinger', scene: S_huoFarewell },
  { id: 'q_dengtian', ch: 11, title: '登天路', goal: '走上战场尽头东边的登天路', type: 'enter', loc: 'bz_road', scene: S_dengtian, rec: 39, lvNeed: 37 },
  { id: 'q_v5', ch: 12, title: '第五卷 · 上界', goal: '……', type: 'auto', scene: S_v5start },
  { id: 'q_ladder', ch: 12, title: '天梯', goal: '去登天路尽头东边的天梯', type: 'enter', loc: 'sj_ladder', scene: S_ladder, rec: 40 },
  { id: 'q_qidao', ch: 12, title: '齐道临', goal: '……', type: 'auto', scene: S_qidaolin },
  { id: 'q_dojo', ch: 12, title: '至尊道场', goal: '跟齐道临去天梯南边的荒漠', type: 'enter', loc: 'sj_desert', scene: S_dojo, rec: 40 },
  { id: 'q_tianren', ch: 13, title: '天人城', goal: '去天仙城西边的天人城', type: 'enter', loc: 'sj_tianren', scene: S_tianren, rec: 41 },
  { id: 'q_kuang', ch: 13, title: '天人族矿脉', goal: '闯进天人城南边的矿脉', type: 'dungeon', dungeon: 'kuangmai', loc: 'sj_mine', npc: null, scene: S_kuangDone, rec: 42 },
  { id: 'q_gutai', ch: 13, title: '至尊古台', goal: '登上天人城北边的至尊古台', type: 'enter', loc: 'sj_gutai', scene: S_gutai, rec: 43 },
  { id: 'q_tianshen', ch: 13, title: '天神', goal: '……', type: 'auto', scene: S_tianshen },
  { id: 'q_wild', ch: 13, title: '无人区', goal: '去天仙城北边的无人区', type: 'enter', loc: 'sj_wild', scene: S_wild, rec: 44 },
  { id: 'q_v5end', ch: 14, title: '第六卷 · 争霸', goal: '回天仙城找齐道临', type: 'talk', npc: 'qidaolin', scene: S_v6start },
  { id: 'q_sqtown', ch: 14, title: '争霸城', goal: '从无人区往北，去三千州的争霸城', type: 'enter', loc: 'sq_town', scene: S_sqTown, rec: 45 },
  { id: 'q_yinmo', ch: 14, title: '银磨山', goal: '从八珍谷往北上银磨山', type: 'enter', loc: 'sq_yinmo', scene: S_yinmo, rec: 47 },
  { id: 'q_shiyi3', ch: 14, title: '石毅', goal: '……', type: 'auto', scene: S_shiyiBack },
  { id: 'q_arena', ch: 15, title: '争霸台', goal: '去争霸城北边的争霸台，守擂', type: 'enter', loc: 'sq_arena', scene: S_arena1, rec: 47 },
  { id: 'q_kuliu', ch: 15, title: '枯柳崖', goal: '去争霸台东边的枯柳崖', type: 'enter', loc: 'sq_cliff', scene: S_liushen },
  { id: 'q_arena2', ch: 15, title: '回到台上', goal: '回争霸台', type: 'enter', loc: 'sq_arena', scene: S_arena2, rec: 49, lvNeed: 47 },
  { id: 'q_v7', ch: 16, title: '第七卷 · 仙古', goal: '从争霸台往北，进仙古遗地', type: 'enter', loc: 'xg_gate', scene: S_v7start, rec: 50 },
  { id: 'q_xgruins', ch: 16, title: '帝冲化身', goal: '去仙古遗迹', type: 'enter', loc: 'xg_ruins', scene: S_xgAvatar, rec: 51 },
  { id: 'q_xglake', ch: 16, title: '血湖', goal: '去遗迹东边的血湖', type: 'enter', loc: 'xg_lake', scene: S_xgLake, rec: 52 },
  { id: 'q_xgdian', ch: 16, title: '仙古古殿', goal: '闯过古林北边的仙古古殿', type: 'dungeon', dungeon: 'xiangudian', loc: 'xg_palace', npc: null, scene: S_xgDian, rec: 53 },
  { id: 'q_dichong', ch: 17, title: '帝冲', goal: '上古殿东边的帝冲峰', type: 'enter', loc: 'xg_peak', scene: S_dichong, rec: 54 },
  { id: 'q_xgend', ch: 17, title: '仙古深处', goal: '去帝冲峰东边的仙古深处', type: 'enter', loc: 'xg_core', scene: S_xgEnd },
  { id: 'q_v8', ch: 18, title: '第八卷 · 帝关', goal: '从仙古入口往东，去帝关城', type: 'enter', loc: 'dg_city', scene: S_v8start, rec: 55 },
  { id: 'q_qiwang', ch: 18, title: '七王祠', goal: '去帝关城西边的七王祠', type: 'enter', loc: 'dg_qiwang', scene: S_qiwang },
  { id: 'q_wangjia', ch: 18, title: '城头', goal: '上帝关城头', type: 'enter', loc: 'dg_wall', scene: S_wangjia, rec: 56 },
  { id: 'q_dizu', ch: 18, title: '边荒战场', goal: '去城头北边的边荒战场', type: 'enter', loc: 'dg_field', scene: S_dizu, rec: 58 },
  { id: 'q_bianhuang', ch: 19, title: '边荒古阵', goal: '闯过城头东边的边荒古阵', type: 'dungeon', dungeon: 'bianhuang', loc: 'dg_ancient', npc: null, scene: S_bhDone, rec: 58 },
  { id: 'q_box', ch: 19, title: '烂木盒子', goal: '去边荒战场东边的边荒深处', type: 'enter', loc: 'dg_deep', scene: S_box, rec: 59 },
  { id: 'q_betray', ch: 19, title: '五百年', goal: '……', type: 'auto', scene: S_betray },
  { id: 'q_yy', ch: 20, title: '第九卷 · 异域', goal: '……', type: 'auto', scene: S_yyStart },
  { id: 'q_yyarena', ch: 20, title: '磨刀场', goal: '去异域城门北边的磨刀场', type: 'enter', loc: 'yy_arena', scene: S_yyArena, rec: 61 },
  { id: 'q_yytree', ch: 20, title: '悟道茶树', goal: '去城门西边的悟道茶树', type: 'enter', loc: 'yy_tree', scene: S_yyTree, rec: 62 },
  { id: 'q_guzu', ch: 20, title: '蛄祖', goal: '去天牢东边的蛄祖洞', type: 'enter', loc: 'yy_guzu', scene: S_guzu },
  { id: 'q_yyfalls', ch: 21, title: '海瀑', goal: '去茶树南边的海瀑', type: 'enter', loc: 'yy_falls', scene: S_yyFalls, rec: 62 },
  { id: 'q_xy', ch: 22, title: '第十卷 · 仙域', goal: '……', type: 'auto', scene: S_xyStart },
  { id: 'q_yuanshi', ch: 22, title: '原始帝城', goal: '去界海之滨北边的原始帝城', type: 'enter', loc: 'xy_yuanshi', scene: S_yuanshi, rec: 65 },
  { id: 'q_back', ch: 22, title: '回帝关', goal: '从仙域古城往东，回帝关城', type: 'enter', loc: 'dg_city', scene: S_back },
  { id: 'q_anlan', ch: 23, title: '安澜', goal: '上帝关城头', type: 'enter', loc: 'dg_wall', scene: S_anlan },
  { id: 'q_v9', ch: 24, title: '第十一卷 · 清算', goal: '……', type: 'auto', scene: S_v9start },
  { id: 'q_envoy', ch: 24, title: '仙域使者', goal: '带着留影晶石，去九天的天门', type: 'enter', loc: 'jt_gate', scene: S_envoy, rec: 66 },
  { id: 'q_train', ch: 24, title: '从头练', goal: '回石村找族长', type: 'talk', npc: 'chief', scene: S_train },
  { id: 'q_army', ch: 25, title: '石村八百兵', goal: '去村前空地找大壮', type: 'talk', npc: 'dazhuang', scene: S_army },
  { id: 'q_purge', ch: 25, title: '七大道统', goal: '带着石村八百兵，去九天的七大道统', type: 'enter', loc: 'jt_sect', scene: S_purge, rec: 68 },
  { id: 'q_jin', ch: 25, title: '金家', goal: '去七大道统东边的金家', type: 'enter', loc: 'jt_jin', scene: S_jin, rec: 69 },
  { id: 'q_feng', ch: 25, title: '风族', goal: '去金家北边的风族', type: 'enter', loc: 'jt_feng', scene: S_feng, rec: 70 },
  { id: 'q_peace', ch: 25, title: '九天之巅', goal: '上风族西边的九天之巅', type: 'enter', loc: 'jt_peak', scene: S_peace, rec: 71 },
  { id: 'q_v9end', ch: 26, title: '第十二卷 · 天庭', goal: '回石村找族长', type: 'talk', npc: 'chief', scene: S_v12start },
  { id: 'q_canxian', ch: 26, title: '残仙', goal: '去九天之巅西边的残仙墓', type: 'enter', loc: 'jt_canxian', scene: S_canxian, rec: 74 },
  { id: 'q_tianting', ch: 26, title: '立天庭', goal: '去天门东边，立天庭', type: 'enter', loc: 'jt_court', scene: S_tianting },
  { id: 'q_dam', ch: 26, title: '堤坝', goal: '从仙域的界海之滨往西，上堤坝', type: 'enter', loc: 'jh_dam', scene: S_dam, rec: 74 },
  { id: 'q_xwhy', ch: 27, title: '仙王后裔', goal: '去仙域古城', type: 'enter', loc: 'xy_city', scene: S_xwhy, rec: 75 },
  { id: 'q_zaohua', ch: 27, title: '造化之门', goal: '去仙域古城北边的造化之门', type: 'enter', loc: 'xy_gate', scene: S_zaohua, rec: 75 },
  { id: 'q_v13', ch: 28, title: '第十三卷 · 帝落', goal: '从造化之门往北，走进时光长河', type: 'enter', loc: 'dl_river', scene: S_v13start, rec: 76 },
  { id: 'q_dlage', ch: 28, title: '帝落古战场', goal: '去长河北边的帝落古战场', type: 'enter', loc: 'dl_age', scene: S_dlAge, rec: 78 },
  { id: 'q_lives', ch: 29, title: '八世', goal: '去长河东边的八世轮回', type: 'enter', loc: 'dl_lives', scene: S_lives, rec: 79 },
  { id: 'q_dlend', ch: 29, title: '长河尽头', goal: '去长河尽头', type: 'enter', loc: 'dl_end', scene: S_dlEnd, rec: 80 },
  { id: 'q_v14', ch: 30, title: '第十四卷 · 异域之战', goal: '从帝关一路往西，去异域封印地', type: 'enter', loc: 'yy_seal', scene: S_v14start, rec: 82 },
  { id: 'q_liushen2', ch: 30, title: '黑柳', goal: '从堤坝往北，进界海', type: 'enter', loc: 'jh_sea', scene: S_liushenBack, rec: 82 },
  { id: 'q_chiwang', ch: 31, title: '赤王', goal: '去异域城门', type: 'enter', loc: 'yy_gate', scene: S_chiwang, rec: 83 },
  { id: 'q_kundi', ch: 31, title: '鲲帝', goal: '……', type: 'auto', scene: S_kundiChase },
  { id: 'q_xianwar', ch: 31, title: '仙域之战', goal: '回仙域古城', type: 'enter', loc: 'xy_city', scene: S_xianwar, rec: 84 },
  { id: 'q_kundi2', ch: 31, title: '鲲帝城', goal: '去异域封印地北边的鲲帝城', type: 'enter', loc: 'yy_capital', scene: S_kundiEnd, rec: 84 },
  { id: 'q_v15', ch: 32, title: '第十五卷 · 独断万古', goal: '……', type: 'auto', scene: S_v15start },
  { id: 'q_shihai', ch: 33, title: '尸骸仙帝', goal: '去界海深处', type: 'enter', loc: 'jh_deep', scene: S_shihai, rec: 84 },
  { id: 'q_duduan', ch: 33, title: '独断万古', goal: '……', type: 'auto', scene: S_duduan },
  { id: 'q_fin', ch: 33, title: '全书完', goal: '石昊的故事讲完了。你可以在各处走走，挑战虚神界，把宝术练到圆满。', type: 'none' },
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
function questWhere() { const q = curQ(); const npcLoc = n => PLACES[npcLocNow(n)] || Object.values(PLACES).find(p => (p.npcs || []).includes(n)); // an NPC found in several places: the one you can reach now
  if (q.type === 'enter') return q.loc; if (q.type === 'talk') return npcLoc(q.npc)?.id; if (q.type === 'arena') return q.loc;
  if (q.type === 'kill' || q.type === 'dungeon') return questReady(q) && q.npc ? npcLoc(q.npc)?.id : q.loc; return null; }
function storyKill(mob) { bountyKill(mob); const q = curQ(); if (q.type === 'kill' && q.mob === mob && C.story.n < q.n) { C.story.n++; logLine(`【主线】${MOBS[mob].name} ${C.story.n}/${q.n}`, 'quest'); if (C.story.n >= q.n) logLine(`【主线】回去找<b>${NPCS[q.npc].name}</b>。`, 'quest'); }
  if (itemN('peaegg') && !C.pets.ertuzi) { F().eggWins = (F().eggWins || 0) + 1; if (F().eggWins >= 8) setTimeout(hatchEgg, 600); } }
function storyArena() { const q = curQ(); if (q.type === 'arena' && C.story.n < q.n) { C.story.n++; if (C.story.n >= q.n) setTimeout(() => questComplete(q), 500); } }
function storyDungeon(id) { const q = curQ(); if (q.type === 'dungeon' && q.dungeon === id) { C.story.n = 1; if (!q.npc) setTimeout(() => questComplete(q), 600); else logLine(`【主线】回去找<b>${NPCS[q.npc].name}</b>。`, 'quest'); } }
async function hatchEgg() { if (C.pets.ertuzi || !itemN('peaegg') || STATE.scene || STATE.battle) { if (!C.pets.ertuzi && itemN('peaegg')) setTimeout(hatchEgg, 3000); return; }
  await runScene(async function S_hatch() { takeItem('peaegg'); await nar('怀里的蛋“咔”地裂开了。钻出来一只小鸟，浑身光溜溜的，一根毛都没有，冲你“啾”了一声。'); await me('……你怎么是秃的？那就叫你二秃子吧。'); gainPet('ertuzi'); await nar('后来你才知道，二秃子是孔雀一族。只是它的毛，好像一直都长不出来。'); }, { title: '二秃子' }); }
async function storyPoll() { if (!C || STATE.scene || STATE.battle || STATE.dungeon || STATE.mode !== 'play' || NETROLE === 'guest') return; const q = curQ(); if (q.type === 'auto') return questComplete(q); if (q.type === 'enter' && q.loc === C.loc && !STATE.dungeon) return questComplete(q); /* already standing there */ if (STATE.dtPending) return dongtianPick(); }
async function sideOffer(id) { const S = SIDE[id]; C.side = C.side || {}; await runScene(async () => { await say(S.npc, S.ask); const c = await choose(['交给我', '下次吧']); if (c === 0) { C.side[id] = 'on'; logLine(`【支线】${S.title}：${S.need.map(([k, n]) => ITEMS[k].name + '×' + n).join('、')} → ${NPCS[S.npc].name}`, 'quest'); } }); }
async function sideDone(id) { const S = SIDE[id]; await runScene(async () => { for (const [k, n] of S.need) takeItem(k, n); await say(S.npc, S.done); S.reward(); C.side[id] = 'done'; }); }
