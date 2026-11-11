/* ================= 石昊's story, volume 8 (帝关) and volume 9 (清算) =================
   Beats follow the novel: at 帝关 on the 边荒 frontier the young generation of 九天十地 fights 异域; 石昊 learns that the 七王
   held the pass and their descendants, slandered as 罪血, kept holding it; the 王家 of the long-lived families goes after him on
   the wall; he outmatches the 异域 帝族 youth but the war is costly; the 不朽之王 安澜 comes; 孟天正 gives up his own road to
   immortality to defend the pass, kills a foe already on that road, and is lost in the dark of 边荒; 石昊 risks his life for a
   rotten wooden box in 边荒 and flees back to 下界. Back home he records 王家, 金家 and 风族 dealing with dark creatures on
   留影晶石 and shows them when the 仙域 envoy comes: 王长生 kills his own six sons and hands over the 平乱诀 to buy his family a
   place; 金家 and 风族 lose theirs. After years of training he is back at 至尊境, leads 800 men of 石村 up and tears down 仙殿,
   天国, 剑谷, 妖龙道门, 罗浮真谷, 冥土 and 火云洞, wipes out 金家 and 风族 who were still hiding two dark 至尊, and drives the
   dark creatures out of 九天十地 — ten thousand years of peace. Every line of prose is written fresh for the game. */

/* ---------------- 第八卷 · 帝关 ---------------- */
async function S_v8start() {
  await cine('<div class="cc"><small>第八卷</small><b>帝关</b><i>他们说你是罪血。他们说错了。</i></div>', 'card');
  await chapterCard('第十八章', '帝关', '九天十地的最后一道门');
  await nar('帝关的城墙是黑的。不是石头的颜色——是血，泡了不知道多少年，渗进了每一块砖里。');
  await nar('城里没有人在笑。街上走的都是兵，年轻的、老的、缺胳膊的。每一个人的眼睛，都朝着城外。');
  await say('mengtz', '这就是帝关。（孟天正走在你前面，背上的旧剑一晃一晃）九天十地的人在里面喝酒、修道、争谁家的天才更厉害。帝关的人在外面，替他们挡着。');
  await me('挡什么？');
  await say('mengtz', '（他指了指城墙外面）那边。边荒的那一边，是异域。异域有不朽之王，有帝族，有数不清的大军。他们想进来，想了很多很多年。');
  await nar('城门口，几个半大的孩子在磨刀。你走过去的时候，他们抬头看了你一眼。其中一个，额头上烙着一个字——<b>“罪”</b>。');
  await nar('你站住了。');
  F().v8 = 1;
  tip('城西有一座<b>七王祠</b>。那几个孩子，住在那里。');
}
async function S_qiwang() {
  await nar('七王祠很旧，供着七个牌位。牌位前的长明灯，一盏都没灭。守灯的是那个额头上烙着“罪”字的孩子。');
  await say('qiwanghou', '……你也是罪州来的？（他看了看你，又低下头去添灯油）我叫小七。我们这一支，排到我，是第七代。');
  await me('你额头上那个字……');
  await say('qiwanghou', '城里的大人烙的。罪血之后，都要烙。（他说得很平淡，像在说今天吃了什么）');
  await say('mengtz', '（孟天正站在祠堂门口，很久没说话，最后走了进来）……孩子，我给你讲个故事。');
  await cine('很久很久以前，异域打过来。<br>九天十地的大人物们，一个接一个地跑了。<br>只有七个人没跑。他们站在帝关的城头上，一直站，一直打——<br><b>七王</b>。', 'mem');
  await cine('七王战死了。<br>他们的孩子接着守。孩子的孩子，也接着守。<br>跑掉的那些人回来以后，怕人说他们是逃兵——<br>他们就说：<b>七王是罪人，七王的后人，是罪血。</b>', 'mem');
  await nar('你站在祠堂里，浑身发冷。你想起了上界路边那个人说的话：“下界八域，是上界关犯人的地方。你们是罪血的后代。”');
  await nar('你想起了至尊古台第九层，你刻在天碑上的那个字。');
  await me('……罪。');
  await say('mengtz', '你刻在天碑上那个字，消息传到帝关来了。（他看着你）帝关所有的“罪血”，那天晚上，都喝了酒。');
  await say('qiwanghou', '（小七抬起头，眼睛亮得吓人）……是你？天碑上那个字，是你刻的？');
  const c = await choose(['是我。', '（摸了摸他额头上的字）这个字，以后会有人替你们洗掉。', '……我当时只是生气。']);
  if (c === 2) await say('qiwanghou', '（他笑了，第一次笑）生气好。我们都生气。生了好几代了。');
  else if (c === 1) await say('qiwanghou', '（他愣了很久，然后用袖子使劲擦了擦眼睛）……谁？');
  else await say('qiwanghou', '（他把手里的灯油放下，冲你磕了一个头）……谢谢。');
  await cine('那天夜里，你在七王的牌位前坐了一整夜。<br>你身上的血，在发烫。<br>那不是至尊骨的血——是更老的东西，在你身体里醒过来了。');
  learnGongfa('qiwang'); F().qiwangDone = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('明天上<b>城头</b>。孟天正说，城头上，最近不太平——不只是外面。');
}
async function S_wangjia() {
  await nar('城头上的风是从边荒吹过来的，带着铁锈味。你和几个守城的兵一起，盯着边荒里那些黑色的影子。');
  await nar('一个穿着华服的年轻人走了过来。他身上一点血都没有，衣服白得发亮——在帝关，这比什么都扎眼。');
  await say('王家天骄', '你就是那个罪血？长生世家，王家。（他笑得很客气）家里长辈让我来看看你。');
  await me('看完了吗？');
  await say('王家天骄', '看完了。（他的手按在了你的后背上）长辈说，看完了，就不用让你回去了。');
  if (!await fightRetry({ mobs: [['wangjia', slv(56, -1, 1)]], title: '帝关城头 · 王家', epic: { name: '王家天骄', sub: '长生世家 · 在城头上找你', seal: '暗刀', intro: ['帝关是守城的地方。', '他却在城头上，找自己人下手。'], phase: '王家天骄撕下了脸皮：“帝关上死个把人，谁会追究？”', low: { who: '小七', t: '“我们守城，从来不回头看。……可今天，我替你看着背后。”' }, end: ['王家天骄从城头上摔了下去。', '摔下去之前，他袖子里掉出来一块令牌——上面的花纹，你在边荒那些黑影身上见过。'] } })) return false;
  await nar('那天夜里，你悄悄出了城。王家天骄袖子里的令牌，把你领到了边荒里一处背风的山坳。');
  await nar('山坳里点着一堆黑色的火。火边坐着几个人——王家的、金家的、风族的。火的对面，坐着几团看不清脸的黑影。');
  await say('金家的人', '……帝关那边，我们会想办法拖着。条件照旧。');
  await nar('你屏住呼吸，从怀里摸出三块留影晶石。');
  const sn = await miniGame('sneak', { title: '留影', desc: '一点一点地挪近。黑影转头的时候，别动。', steps: 6 });
  if (!sn.ok) await nar('你差点被发现。一团黑影朝你这边“看”了很久——最后，它转回去了。');
  await cine('三块留影晶石，一块一块地亮了起来。<br>王家、金家、风族，和黑暗生灵坐在一堆火边上的样子，<br><b>全被记下来了</b>。');
  F().wangDone = 1; F().crystal = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('<b>边荒战场</b>在城头北边。异域的年轻一代，明天要来了。');
}
async function S_dizu() {
  await nar('边荒战场上，九天十地的年轻一代和异域的年轻一代，面对面站着。你站在最前面。');
  await say('异域帝族天骄', '九天十地，就剩你们这些了？（他笑了）一群罪血，和一群被家里赶出来送死的。');
  if (!await fightRetry({ mobs: [['yiyubing', slv(56)], ['yiyubing', slv(56)], ['yiyuqi', slv(57)]], allies: ['a_meng'], title: '边荒战场 · 前锋' })) return false;
  await cine('那一仗打了三天。<br>你身边的人，一个一个地倒下去。<br>有个总跟你抢饭吃的胖子，有个只会说“我不怕”的姑娘，有个说打完这一仗就回家成亲的少年。');
  if (!await fightRetry({ mobs: [['dizu', slv(58, -1, 1)]], allies: ['a_meng'], title: '边荒战场 · 帝族', epic: { name: '异域帝族天骄', sub: '异域最尊贵的血 · 看不起九天十地', seal: '异域', intro: ['他身后，是整个异域的年轻一代。', '你身后，越来越少。'], phase: '帝族天骄身上的血光烧了起来：“九天十地，不过是我们的牧场！”', low: { who: '小七', t: '“我们守城，从来不回头看。”<br>（你也不回头。你身后那些倒下去的人，替你看着呢。）' }, end: ['帝族天骄跪在了边荒的沙子里。', '异域的年轻一代，退了。'] } })) return false;
  await nar('异域退了。可你回头看的时候，战场上站着的人，比来的时候，少了一大半。');
  await say('mengtz', '（孟天正站在你身边，很久没说话）……帝关的每一场胜仗，都是这样的。');
  F().dizuDone = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('城头东边的<b>边荒古阵</b>，是七王当年布下的。孟天正说，你该去看看。');
}
async function S_bhDone() {
  await chapterCard('第十九章', '边荒', '有些人，守着守着，就成了城墙');
  await nar('古阵灵在阵眼里散去之前，靠近你，闻了闻你身上的血。然后它跪了下来，就像在跪拜一个很老很老的人。');
  await cine('阵眼里浮出七道影子。<br>他们穿着破烂的甲，看不清脸，可你知道他们是谁。<br>他们冲你点了点头。<br>其中一个，伸手拍了拍你的肩膀——<b>像族长那样</b>。', 'mem');
  gainExp(BAL.expNext(C.lv) * 0.4); F().bianhuang = 1;
}
async function S_box() {
  await nar('异域的人在边荒里追了你三天三夜。你从葬士的古坟里钻过去，从天兽的林子里滚过去，一直逃到了边荒最深的那片废墟。');
  if (!await fightRetry({ mobs: [['bhhun', slv(58)], ['yiyuqi', slv(58)], ['yiyubing', slv(58)]], title: '边荒深处 · 追兵' })) return false;
  await nar('废墟最深处，埋着一只烂木盒子。很旧，很轻，上面一个字都没有。可你一碰到它，整片边荒都安静了——连追你的异域兵，都停下了脚步。');
  await say('异域追兵', '……那只盒子！不朽之王点名要的东西！抢过来！');
  const ms = await miniGame('mash', { title: '逃', desc: '抱着盒子跑！别回头——跑回帝关！', time: 7000, rate: 7 });
  if (!ms.ok) await nar('你摔倒了三次。第四次，你是抱着盒子爬回城门的。');
  await nar('帝关的城门在你身后关上。你靠着城墙坐下，看着怀里的盒子。你不知道里面是什么。你只知道，异域的人，很想要它。');
  F().box = 1; gainExp(BAL.expNext(C.lv) * 0.4);
}
async function S_betray() {
  await nar('三天以后，异域的大军压到了帝关城下。黑色的旗子，从边荒的这头，排到那头。');
  await nar('一个异域帝族的至尊走到城下，声音不大，整座帝关都听得见：');
  await say('异域帝族至尊', '把那个叫荒的罪血交出来，连同他抢走的盒子。交出来，异域五百年不犯帝关。');
  await nar('城头上，一片死寂。孟天正在至尊大战里受了重伤，正在闭关——他不知道。');
  await say('金太君', '（金家的老太君拄着金杖站了出来）诸位，五百年太平。用一个罪血换，划算。');
  await say('qiwanghou', '（小七冲到了她面前，额头上那个“罪”字涨得通红）他是帝关的人！他替我们守过城！');
  await say('金太君', '罪血也配说“帝关的人”？（她看都没看小七）谁反对，谁就去替他。');
  await nar('有人说话了，有人没说话。说话的声音，一个一个地低了下去。');
  await nar('你站起来，把那只烂木盒子塞进了小七怀里。');
  await me('……帮我收着。别给他们。');
  await say('qiwanghou', '你、你要干嘛？！');
  const c = await choose(['（自己走下城头）', '……孟老醒了，替我跟他说一声。我吃过饭了。']);
  if (c === 1) await nar('小七抱着盒子，哭得一个字都说不出来。');
  await cine('你自己走下了城头，走出了城门。<br>一个至尊给你戴上了锁链，把你推进了一辆囚车。<br>囚车往边荒深处走去。<br>你回头看了一眼帝关——<b>城头上，小七抱着盒子，一直站着</b>。');
  F().yiyu0 = 1;
  await cine('<div class="cc"><small>第八卷</small><b>帝关</b><i>完</i></div>', 'card');
  go('yy_jail', false, true);
}
/* ---------------- 第十卷 · 仙域（结尾）: 安澜 ---------------- */
async function S_anlan() {
  await chapterCard('第二十三章', '安澜', '那一剑');
  await nar('你回到帝关的第七天早上，边荒的天，忽然暗了下来。');
  await cine('一个人从异域那边走过来。<br>他走得不快，可他每走一步，边荒的沙就退一里。<br>帝关城头上，所有的兵，同时握紧了兵器——手在抖。<br>有人小声说了一个名字：<b>安澜</b>。不朽之王。');
  await say('mengtz', '（孟天正把你拉到身后）……你打不过他。帝关所有人加起来，也打不过他。');
  await me('那也得打。');
  await fight({ mobs: [['anlan', 90]], title: '帝关 · 安澜', noLose: true, noPet: true, allies: ['a_meng'], epic: { name: '安澜', sub: '异域的不朽之王', seal: '不朽', intro: ['他抬了抬手。', '天，塌了一块。'], phase: '安澜看了你一眼——就一眼，你的骨头响了三声。' } });
  await nar('你倒在城墙下面，动不了。你看见孟天正站在城头上，背着那把旧剑，一个人。');
  await say('mengtz', '（他回头看了你一眼，笑了）孩子。我这辈子就想成仙。修了几万年，就差一步了。');
  await say('mengtz', '……不成了。');
  await cine('孟天正拔出了那把旧剑。<br>他把这辈子攒下来的、通往成仙的那条路，<b>一剑斩断了</b>，<br>全部烧进了剑里。');
  await cine('那一剑，斩落了异域一个已经踏上成仙路的强者。<br>边荒的天，被劈开了一道口子。<br>安澜停下了脚步。');
  await nar('孟天正站在城头上，身子晃了晃。他看着天上那道口子，像在看一扇他这辈子都没能推开的门。');
  await say('mengtz', '……这辈子，没成仙啊。（他轻轻地说，像在跟自己说）也好。帝关……还在。');
  await cine('然后，边荒的黑暗涌了上来，<br>把那个背着旧剑的老人，<b>淹没了</b>。<br>你再也没有找到他。', 'mem');
  await nar('七王祠的孩子们，冲上了城头。他们没有喊口号，没有哭，一个一个地站在了孟天正站过的地方。小七站在最前面。');
  await cine('那一天，七王的后人，又死了很多。<br>帝关，没有破。<br>活下来的，只有几个孩子。小七是其中一个。');
  F().anlan = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  await say('qiwanghou', '（小七浑身是血，把你从城墙下面拖出来，把那只烂木盒子塞进你怀里）……孟老说过，你要是活着，就带着它回家。走！');
  const ms = await miniGame('mash', { title: '逃', desc: '跑！别回头——往下界跑！', time: 7000, rate: 7 });
  if (!ms.ok) await nar('你摔倒了三次。第四次，你是爬着过去的。');
  await cine('你穿过了帝关，穿过了九天十地，穿过了登天路——<br>一路往下掉，往下掉。<br>最后掉进了一片你闭着眼睛都认得出来的林子里。<br>你闻到了兽奶的味道。');
  F().v8end = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  await cine('<div class="cc"><small>第十卷</small><b>仙域</b><i>完</i></div>', 'card');
  go('sc_willow', false, true);
}

/* ---------------- 第十一卷 · 清算 ---------------- */
async function S_v9start() {
  await cine('<div class="cc"><small>第十一卷</small><b>清算</b><i>账，一笔一笔地算</i></div>', 'card');
  await chapterCard('第二十四章', '蛰伏', '回家');
  await nar('你醒过来的时候，躺在族长家的小木床上。床太小了，你的脚伸在外面。');
  await say('你娘', '（她坐在床边，眼睛肿得像桃子）……醒了？醒了就好。醒了就好。');
  await say('chief', '（族长拄着拐杖站在门口）你掉在柳神的树桩旁边，浑身是血，怀里死死抱着一个烂木盒子。谁拿都拿不走。');
  await nar('你摸了摸怀里。盒子还在。你想说点什么，一张嘴，先哭了。你已经很多年没哭过了。');
  await nar('你把帝关的事，一件一件地说了：七王，小七，帝族，安澜，孟天正那一剑。说到最后，屋里没有一个人说话。');
  await say('石子凌', '（你爹站在窗边，背对着你）……那些人。在帝关后面算账的那些人。');
  await me('我记下来了。（你从怀里摸出三块留影晶石）王家，金家，风族。');
  await say('chief', '（族长看着那三块晶石，眼睛眯了起来）……听说，仙域的使者，要下到九天来了。要挑谁家能进仙域。');
  F().v9 = 1; F().envoy0 = 1;
  tip('<b>九天 · 天门</b>在争霸场外往东。（传送玉符能直接过去）');
}
async function S_envoy() {
  await nar('九天的天门下面，站满了长生世家的人。天门上，坐着一个看不清脸的人——仙域使者。他说话的声音，像是从很远很远的地方飘过来的。');
  await say('仙域使者', '仙域的门，只开给干净的人家。');
  await nar('王家、金家、风族的家主站在最前面，衣服一个比一个干净。你从人群里走出来，举起了三块留影晶石。');
  await cine('晶石亮了。<br>边荒的山坳，黑色的火，火边坐着的人，和火对面的黑影。<br>“帝关那边，我们会想办法拖着。条件照旧。”');
  await nar('天门下面，一片死寂。');
  await say('王长生', '（王家家主沉默了很久，然后转过身，看着身后的六个儿子）……是你们做的。');
  await nar('他抬起了手。<b>六个儿子，一个都没来得及开口。</b>');
  await say('王长生', '（他擦了擦手，冲仙域使者行了一礼）家门不幸，已经清理干净了。王家愿献上《平乱诀》，替仙域平定九天之乱。');
  await say('仙域使者', '……王家，可入仙域。');
  await nar('金家和风族的家主还在喊冤，喊得嗓子都破了。仙域使者没有理他们。');
  await say('仙域使者', '金家、风族，不得入仙域。族中核心，自行处置。');
  await nar('你站在天门下面，看着王长生的背影。你赢了。可你一点都不觉得高兴。');
  await me('（小声）……这个人，比他们都可怕。');
  await nar('你的伤还没好。你知道，现在的你，还对付不了他们。你转身，回了下界。');
  F().envoy = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('回<b>石村</b>找族长。该养伤了——也该重新练了。');
}
async function S_train() {
  await say('chief', '回来了？（族长一点都不意外）伤成这样，回来养着。养好了，再从头练。');
  await me('从头练？');
  await say('chief', '你小时候，举不动石锁，被大壮笑了一个月。（他笑了）那时候你怎么办的？');
  await me('……天天举。');
  await cine('第一年，你天天在村前空地上举石锁。<br>大壮的儿子在旁边看着，笑你举得歪。<br>第三年，你又能引雷了。<br>第五年，你坐在柳神的树桩旁边，第一次听见那根枯根里，有东西在动。');
  const ms = await miniGame('lift', { title: '从头练', desc: '跟小时候一样。一下一下地举。', rounds: 3, need: 2 });
  if (!ms.ok) await nar('你举了一千次，失败了九百次。第一千零一次，你举起来了。');
  await cine('很多年以后的一个早上，你站在村口，<br>伸了个懒腰。<br>整个大荒的凶兽，<b>同时趴了下去</b>。<br>——重回至尊。');
  learnGongfa('chongzhi'); F().zhizun = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('村前空地上，大壮好像有话要跟你说。');
}
async function S_army() {
  await chapterCard('第二十五章', '清算', '石村八百兵');
  await nar('村前空地上，站满了人。不是几个，是<b>八百个</b>。');
  await say('dazhuang', '（大壮——现在是大壮爷爷了——站在最前面，胡子都白了）小不点。这些年，你在练，我们也在练。');
  await say('dazhuang', '石村的娃娃，从会走路起就举石锁。现在……能打的，都在这儿了。');
  await say('ermeng', '（二猛背着一张大弓，怀里还揣着一罐兽奶）……这回不是偷的。');
  await nar('皮猴站在队伍里，冲你翻了一个跟头——第十一个。他翻过去了。全村的人都笑了。');
  const c = await choose(['（看着他们，很久说不出话）', '……这一仗，会死人的。']);
  if (c === 1) await say('dazhuang', '帝关死了那么多人，替我们挡着的。（他拍了拍胸口）石村的人，也该替别人挡一回了。');
  else await say('chief', '（族长拄着拐杖，站在队伍最后面）……去吧。吃饱了再去。');
  await nar('那天，石村摆了八百一十一桌。吃完饭，八百个人跟着你，走上了登天路。');
  F().army = 1;
  tip('带着石村八百兵，去九天的<b>七大道统</b>。帝关血战的时候，他们一个人都没派。');
}
async function S_purge() {
  await nar('九天的七大道统挤在一片山上：仙殿、天国、剑谷、妖龙道门、罗浮真谷、冥土、火云洞。七座山门，一座比一座气派。');
  await say('道统弟子', '下、下界的罪血打上来了！还带着……一群举石锁的？！');
  await me('帝关血战的时候，你们在哪儿？');
  await nar('没有人回答。');
  if (!await fightRetry({ mobs: [['daotong', slv(66)], ['daotong', slv(66)], ['jtguard', slv(66)]], allies: ['a_shicun'], title: '七大道统 · 山门' })) return false;
  if (!await fightRetry({ mobs: [['xiandian', slv(67, -1, 1)]], allies: ['a_shicun'], title: '七大道统 · 仙殿', epic: { name: '仙殿长老', sub: '帝关血战的时候，仙殿在后面算账', seal: '仙殿', intro: ['他说：“一个下界的罪血，也敢打上仙殿？”'], phase: '长老祭出了仙殿的镇殿之宝：“一个下界的罪血，也敢打上仙殿？”', low: { who: '二猛', t: '“小不点！兽奶！接着！”<br>（一罐兽奶从人堆里飞过来，正砸在你脑袋上。……还挺甜。）' } } })) return false;
  if (!await fightRetry({ mobs: [['jiangu', slv(68, -1, 1)]], allies: ['a_shicun'], title: '七大道统 · 剑谷', epic: { name: '剑谷剑主', sub: '剑练得很好，心歪了', seal: '剑谷', intro: ['满谷的剑都在抖。'], phase: '剑谷满谷的剑同时出鞘，剑尖全对准了你！', low: { who: '孟天正', t: '（你想起了那把很旧的剑。<br>想起了那一剑——斩断自己成仙路的那一剑。<br>你的剑胎，在手里，发烫。）' } } })) return false;
  await cine('仙殿塌了。天国塌了。剑谷的剑断了。<br>妖龙道门、罗浮真谷、冥土、火云洞——<br>七座山门，一座一座地，倒了下去。<br>石村八百兵站在废墟上，没有一个人欢呼。他们只是把石锁，放在了地上。');
  F().purge = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('金家和风族没进成仙域，可他们……好像还在跟黑暗做买卖。<b>金家</b>在七大道统东边。');
}
async function S_jin() {
  await nar('金家的宅子是金子修的，金得晃眼。可你一进门，就闻到了一股味道——边荒山坳里，那堆黑色的火的味道。');
  await say('金家家主', '（他站在大殿里，脸色惨白）你、你别过来！我们已经被仙域除名了！你还想怎样？！');
  await me('你们宅子底下，藏着什么？');
  await nar('大殿的地板裂开了。一团看不清脸的黑影，从地底下慢慢地升了上来——<b>黑暗至尊</b>。');
  if (!await fightRetry({ mobs: [['heianzz', slv(69, -1, 1)]], allies: ['a_shicun'], title: '金家 · 黑暗至尊', epic: { name: '黑暗至尊', sub: '藏在金家地底', seal: '黑暗', intro: ['金家用它换了万年富贵。'], phase: '黑暗至尊张开了嘴——整座宅子的光，都被它吞了下去！', low: { who: '小七', t: '“我们守城，从来不回头看。”<br>（小七，你看，帝关后面的账，我在替你们算。）' }, end: ['黑暗至尊散了。', '金家的金子，一夜之间，全变成了黑色。'] } })) return false;
  F().jin = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('<b>风族</b>在金家北边。那里还有一个。');
}
async function S_feng() {
  await nar('风族的山上，风是往回吹的。山顶上，风族的族长跪在地上，背后站着第二团黑影。');
  await say('风族族长', '……我们是被逼的。（他没有抬头）不跟它做买卖，风族活不过这一纪元。');
  await me('帝关的人，也没打算活过这一纪元。可他们没跟它做买卖。');
  if (!await fightRetry({ mobs: [['heianzz', slv(70, -1, 1)]], allies: ['a_shicun'], title: '风族 · 黑暗至尊', epic: { name: '黑暗至尊', sub: '藏在风族山上', seal: '黑暗', intro: ['风往回吹，是因为它在吸。'], phase: '黑暗至尊张开了嘴——整座山的风，都被它吞了下去！', low: { who: '你娘', t: '“……这回，记得回家。”' } } })) return false;
  await cine('第二团黑影散了。<br>风族山上的风，第一次，往前吹了。');
  F().jinfeng = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('九天十地里还有黑暗生灵在往里漏。去<b>九天之巅</b>，看看它们是从哪儿进来的。');
}
async function S_peace() {
  await nar('九天之巅上，能看见整个九天十地的灯火——也能看见那道裂缝。黑暗生灵正从裂缝里，一团一团地往外爬。');
  await say('dazhuang', '（大壮带着石村的人，站在你身后）……小不点，这回打完，能回家了吧？');
  await me('能。');
  if (!await fightRetry({ mobs: [['heian', slv(70)], ['heian', slv(70)], ['heian', slv(70)]], allies: ['a_shicun'], title: '九天之巅 · 黑暗生灵' })) return false;
  if (!await fightRetry({ mobs: [['heianwang', slv(71, -1, 1)]], allies: ['a_shicun'], title: '九天之巅 · 黑暗生灵之首', epic: { name: '黑暗生灵之首', sub: '从裂缝里爬出来的最大的那一个', seal: '永夜', intro: ['它身后，是一整个永夜。', '你身后，是九天十地的灯火，和石村八百个人。'], phase: '它身后的黑暗裂开了一道口子，更多的黑暗生灵正在往外爬！', low: { who: '孟天正', t: '“……这辈子，没成仙啊。也好。帝关……还在。”<br>（师父。九天十地，也还在。）' }, end: ['你一拳把它打回了裂缝里。', '然后，你亲手把裂缝合上了。'] } }, '黑暗把你推了回去。大壮把你扶起来：“吃饱了再打！”')) return false;
  await cine('那一天以后，九天十地，<b>太平了一万年</b>。<br>没有人再提“罪血”两个字。<br>帝关的城门口，七王祠的门匾，被人换了一块新的——<br>上面写着：<b>“七王之后，镇守帝关”</b>。');
  await nar('你回到石村的时候，是一个傍晚。柳神留下的那截树桩旁边，那只烂木盒子安安静静地放着。你一直没有打开它。');
  await nar('树桩上，冒出了一片很小很小的新叶。');
  F().v9end = 1; gainExp(BAL.expNext(C.lv) * 0.6);
  await cine('<div class="cc"><small>第十一卷</small><b>清算</b><i>完</i></div>', 'card');
}
