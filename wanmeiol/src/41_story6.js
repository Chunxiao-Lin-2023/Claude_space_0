/* ================= 石昊's story, volume 9 (异域) and volume 10 (仙域) =================
   Beats follow the novel: handed over to 异域 for "500 years of peace", he is chained in the 黑水天牢 (the black water eats at
   his feet, his cultivation sealed), hung at the city gate and mocked, then let out to be the whetstone for 异域's young
   geniuses — he beats the 赤王后裔 and fights for the 悟道茶树; over a hundred years his 道基 is completed, all his arts merge
   into one, and 蛄祖 helps fill in his 道则. He escapes through the 海瀑 (a branch of the 界海), catches a 始祖鱼苗 and rides it
   past 异域's strongmen with 三藏 and 神冥, reaches 仙域, finds the 原始帝城 and the truth about 罪血, and goes back to 帝关 at
   late 斩我境 — where 孟天正, out of seclusion, had already gone after 金家 and 王长生 for him. Prose written fresh. */

/* ---------------- 第九卷 · 异域 ---------------- */
async function S_yyStart() {
  await cine('<div class="cc"><small>第九卷</small><b>异域</b><i>他们拿你，换了五百年</i></div>', 'card');
  await chapterCard('第二十章', '黑水', '一百年');
  await nar('黑水天牢的水是黑的，冰的，一碰到皮肉，就往骨头里钻。你的脚泡在里面，三天就烂了。你的修为被一道一道的锁封住，一点都用不出来。');
  await say('黑水狱卒', '九天十地最强的那个？（他用鞭子挑起你的下巴）就这？');
  await nar('你没说话。你在数。数黑水一滴一滴落下来的声音。');
  await cine('第十天，他们把你拖出天牢，用绳子吊在了异域大城的城门上。<br>城门下面，异域的人一个一个走过去，冲你吐口水，扔石头，笑。<br>你挂在上面，看着边荒的方向。<br>帝关在那边。小七在那边。<b>你答应过回去的</b>。');
  await nar('有一天夜里，城门下来了一群人，十几个，个个是异域的强者。他们想趁你被封着修为，把你的道基挖出来。');
  await nar('你被吊着，修为被封着，脚是烂的。你用牙咬断了绳子，掉下来，用头撞，用肘砸，用烂掉的脚踢。天亮的时候，城门下面躺了一地。');
  await say('异域的长老', '（他看着满地的人，又看着你，眼神变了）……留着他。这么好的磨刀石，杀了可惜。');
  F().yyHung = 1;
  tip('城门北边是<b>磨刀场</b>。从今天起，异域的天骄，都要拿你磨刀。');
}
async function S_yyArena() {
  await nar('磨刀场上，异域的天骄排着队。他们暂时解开了你一道封印——刚好够你打，不够你逃。');
  await say('异域天骄', '九天十地最强的？我第一个来！');
  if (!await fightRetry({ mobs: [['yytj', slv(60)], ['yytj', slv(60)], ['yuzu9', slv(60)]], title: '磨刀场' })) return false;
  await cine('第一年，你被抬下去三十次。<br>第五年，你被抬下去三次。<br>第十年，抬下去的，都是他们。');
  await say('赤王后裔', '（一个浑身赤红的少年走上场，台下所有人都站了起来）……我祖上是赤王。你，配给我磨刀吗？');
  if (!await fightRetry({ mobs: [['chiwanghy', slv(61, -1, 1)]], title: '磨刀场 · 赤王后裔', epic: { name: '赤王后裔', sub: '异域仙王赤王的后人', seal: '赤王', intro: ['异域年轻一代里最傲的那一个。', '你身上，还锁着三道封印。'], phase: '他身上的血烧成了赤色——赤王的血，醒了！', low: { who: '小七', t: '“我们守城，从来不回头看。”<br>（小七。我还没回去。所以，我还不能倒。）' }, end: ['赤王后裔跪在了磨刀场上。', '台下，几万个异域人，没有一个出声。'] } })) return false;
  await nar('那天以后，磨刀场上的规矩变了：异域的天骄想跟你打，要排三个月的队。');
  await breath(20);
  F().yyArena = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('城门西边有一棵<b>悟道茶树</b>，异域各族都想要它。今年，他们要你也去争。');
}
async function S_yyTree() {
  await nar('悟道茶树很老，叶子上的纹路像在写字。树下站着异域各族的天骄，最前面是一个穿金袍的年轻人——异域帝族的帝子。');
  await say('异域帝子', '这棵树，异域打了几十万年。今年是我的。（他看了你一眼）你只是被带来凑数的。');
  await me('我在天牢里待了好多年。好久没看见这么绿的东西了。');
  if (!await fightRetry({ mobs: [['chashu', slv(62, -1, 1)]], title: '悟道茶树 · 帝子', epic: { name: '异域帝子', sub: '异域帝族最有希望的帝子', seal: '茶树', intro: ['他想要那棵茶树。', '也想要你的命。'], phase: '帝子摘下一片茶叶含在嘴里，道则一下子清楚了十倍！', end: ['帝子倒在了茶树下。', '一片茶叶落下来，落在你的手心。'] } })) return false;
  await nar('你在茶树下坐了一夜。茶叶在你手心里化开，你脑子里那些乱七八糟的宝术——狻猊、鲲鹏、雷帝、柳神——一样一样地，排好了队。');
  await cine('它们本来就是一样东西。<br>你以前不知道。<br><b>现在你知道了。</b>');
  F().yyTree = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('天牢最深处有个洞，听说住着一个很老的存在。狱卒都不敢靠近——<b>蛄祖洞</b>在天牢东边。');
}
async function S_guzu() {
  await nar('洞里有一盏灯。灯下坐着一个很老的影子，老得看不出是人是兽，像一块会喘气的石头。');
  await say('guzu', '……九天十地的孩子。（它的声音很慢，像从地底下传上来）他们说你是磨刀石。');
  await me('你是谁？');
  await say('guzu', '一个活得太久的东西。（它笑了，或者是在咳嗽）我看着异域打了很多很多年。打来打去，都是一样的。');
  await say('guzu', '你的道，有洞。不是你的错——你从下界一路爬上来，每一步都是抢来的，补来的。（它伸出一根像树根一样的手指）我替你补上。');
  const c = await choose(['……为什么帮我？', '（伸出手）']);
  if (c === 0) await say('guzu', '因为我想看看，一个不一样的结局。');
  await cine('那根手指点在你的眉心。<br>你看见了道则——不是一条一条的，是一张网。<br>网上有很多洞，蛄祖一个一个地补。补了很久。<br><b>道基，圆满了。</b>');
  learnGongfa('daoze'); F().daoze = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  await say('guzu', '去吧。茶树南边，是海瀑。从那里跳下去，就是界海。……能不能活，看你的命。');
}
async function S_yyFalls() {
  await chapterCard('第二十一章', '海瀑', '跳下去');
  await nar('海瀑的声音大得把心跳都盖住了。界海的一条支流从异域的边上倒灌下去，成了一道看不到底的瀑布。');
  await nar('瀑布边上蹲着两个人，也是被关了很多年的九天十地的人。一个光头，一个瘦得像竹竿。');
  await say('三藏', '（光头冲你挤了挤眼睛）听说你要跑？带上我们。我叫三藏，他叫神冥。我们俩在天牢里商量了五十年，就是没胆子跳。');
  await say('海瀑追兵', '在那儿！别让他们跳！');
  if (!await fightRetry({ mobs: [['haipu', slv(62)], ['haipu', slv(62)], ['haipu', slv(62)]], allies: ['a_sanzang'], title: '海瀑 · 追兵' })) return false;
  await breath(21);
  await nar('瀑布底下的黑水里，游过一条小小的、发着光的鱼——始祖鱼苗。你想都没想，一把抓住了它的尾巴。');
  await me('跳！');
  const ms = await miniGame('mash', { title: '海瀑', desc: '抓紧鱼尾巴！别松手！', time: 7000, rate: 7 });
  if (!ms.ok) await nar('你松了三次手，又抓回来三次。三藏在后面拽着你的脚，神冥拽着三藏的脚。');
  await cine('始祖鱼苗拖着你们三个，冲进了界海。<br>身后，异域的强者追了上来——一个，两个，三个。<br>你用尽了最后一点仙术，三藏念了一路的经，神冥一直在哭。<br>死了好几回。<br><b>没死成。</b>');
  F().yyEnd = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  await cine('<div class="cc"><small>第九卷</small><b>异域</b><i>完</i></div>', 'card'); await volRecap('九');
  go('xy_shore', false, true);
}

/* ---------------- 第十卷 · 仙域 ---------------- */
async function S_xyStart() {
  await cine('<div class="cc"><small>第十卷</small><b>仙域</b><i>罪血，是什么血</i></div>', 'card');
  await chapterCard('第二十二章', '仙域', '一座比帝关还老的城');
  await nar('始祖鱼苗把你们扔在了一片黑色的海岸上。岸上是仙域——传说里，九天十地所有人都想进去的地方。');
  await say('三藏', '（他趴在沙滩上，把一嘴的海水吐出来）……活着！神冥，我们活着！');
  await nar('神冥抱着三藏哭得更厉害了。你站起来，往岸上看。远处，有一座白色的城——白得像骨头。');
  F().xy = 1;
  tip('往北，那座白色的城——<b>原始帝城</b>。');
}
async function S_yuanshi() {
  await nar('原始帝城的城墙是白的，每一块砖上都刻着一个名字。城门上，刻着七个很大的名字。你认得其中一个——你在帝关的七王祠里，见过它的牌位。');
  await nar('城里到处是残魂。它们还穿着甲，还拿着枪，还在城墙上走来走去。');
  if (!await fightRetry({ mobs: [['ysmo', slv(63)], ['ysmo', slv(63)], ['ysmo', slv(64)]], title: '原始帝城 · 残魂' })) return false;
  await say('帝城守将残念', '（城门下站起来一个比城门还高的影子）……你身上，有七王的血。（它的枪尖对准了你）回答我：帝关，还在吗？');
  if (!await fightRetry({ mobs: [['ysjiang', slv(65, -1, 1)]], title: '原始帝城 · 守将', epic: { name: '帝城守将残念', sub: '原始帝城最后一个守将', seal: '帝城', intro: ['它只想知道一件事：帝关还在不在。'], phase: '残念身后，整座原始帝城的城墙都亮了！', end: ['你一拳打在它的枪杆上。', '你说：“还在。小七守着呢。”'] } })) return false;
  await say('帝城守将残念', '（它放下了枪，很久没说话）……还在。还在就好。');
  await cine('原始帝城，是很久很久以前，九天十地所有人的城。<br>后来黑暗来了。城守不住了。<br>七王带着一群人，退到了城外一道关——帝关——继续守。<br><b>城里的人跑了。七王没跑。</b>', 'mem');
  await cine('跑掉的人活了下来，成了长生世家，成了道统，成了九天十地的主人。<br>没跑的人，死了。<br>他们的孩子被叫做——<b>罪血</b>。<br>因为只有说他们是罪人，跑掉的人，才不是逃兵。', 'mem');
  await nar('你站在原始帝城的城门下，很久没有动。三藏在你身后，第一次没有念经。');
  await me('……我要回帝关。');
  await breath(22);
  learnGongfa('yuanshi'); F().yuanshiDone = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('仙域古城往东，有一条回帝关的路。');
}
async function S_back() {
  await nar('你回到帝关的时候，没人认得你了。你瘦得像一根柴火棍，脚上全是黑水泡烂的疤，身上的修为——斩我境后期。比你走的时候，高了一大截。');
  await say('qiwanghou', '（小七在七王祠门口添灯油，抬头看见你，灯油壶“哐当”一声掉在了地上）……你、你……');
  await me('我吃过饭了。');
  await nar('小七冲过来，一头撞进你怀里，哭得像个孩子——他本来就是个孩子。他怀里，还抱着那只烂木盒子。一百年了，他一直抱着。');
  await say('mengtz', '（孟天正从城头上走下来，背上的旧剑一晃一晃。他走到你面前，看了你很久）……瘦了。');
  await nar('你后来才知道：孟天正出关那天，听说你被交了出去，一句话没说，提着剑就去了金家。金家的长老倒了一地。然后他去了王家，跟王长生打了一架，打得王家下了一道令——谁也不许再动你。');
  await me('……孟老。');
  await say('mengtz', '叫师父。（他别过脸去）……你在异域那一百年，我天天在城头上看。看边荒那一边，看你会不会回来。');
  const c = await choose(['……师父。', '我回来了。', '师父，帝关的饭还是那么难吃吗？']);
  if (c === 2) await say('mengtz', '（他愣了一下，然后笑出了眼泪）……还是那么难吃。走，吃饭去。');
  else await say('mengtz', '（他拍了拍你的肩膀，拍得很重）……好。好。');
  F().back = 1; gainExp(BAL.expNext(C.lv) * 0.3);
  tip('孟天正说，最近边荒那边太安静了。安静得不对劲。上<b>城头</b>看看。');
}
