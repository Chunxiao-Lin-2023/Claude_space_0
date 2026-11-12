/* ================= 石昊's story, volume 14 (异域之战) and volume 15 (独断万古) =================
   Beats follow the novel's final stages as summarised by readers: he goes into 异域, frees 火灵儿 (taken long ago; her spirit
   sleeps), kills a 准不朽之王, and three 仙王 ambush him and his body falls — 他化自在大法 carries him through; he brings the
   dark 柳神 back out of the 界海; he kills 赤王 in the 界海 / 异域 while more than a dozen 仙王 close in, uses 他化自在 bodies
   and blows up the pair's weapons to get away; he beats 鲲帝, chases him into 异域 and is wounded by the 原始古器's dark
   matter; at the great battle in 仙域 he breaks through to 准仙帝 and kills 刀王, 蒲魔王, 九头魔, 无殇, then goes into 异域 and
   kills 鲲帝 and 屈冲 — 异域 is pacified. In the 界海 he fights three emperors, holds down the four dark emperors, is killed in
   its depths by the 尸骸仙帝, becomes 仙帝 through 他化自在大法 and kills him; he wakes 火灵儿; with one stroke he cuts the
   river of time — 独断万古 — and keeps the darkness of 上苍之上 away from home. Prose is written fresh for the game. */

/* ---------------- 第十四卷 · 异域之战 ---------------- */
async function S_v14start() {
  await cine('<div class="cc"><small>第十四卷</small><b>异域之战</b><i>这一次，是你打过去</i></div>', 'card');
  await chapterCard('第三十章', '火灵儿', '封印里的一点火');
  await nar('消息是三藏带回来的。他说，异域深处有一座封印，准不朽之王守着。封印里关着一个人——很久以前，从下界的火国被抓走的。');
  await nar('你在帝关城头上站了一夜。第二天早上，你一个人，走进了异域。');
  await nar('封印里有一点火光。很小，很倔。你走近了，看见了一张很熟悉的脸——红衣服，眼睛闭着，像睡着了。');
  await me('……火灵儿。');
  await say('准不朽之王', '（封印前站起来一个人，身上亮着不朽的光）九天十地的仙王？来救她？她的魂早就睡死了。你救回去的，只是一具身子。');
  if (!await fightRetry({ mobs: [['zbx', slv(82, -1, 1)]], title: '异域封印地 · 准不朽之王', epic: { name: '准不朽之王', sub: '守着封印 · 就差一步不朽', seal: '不朽', intro: ['封印里，有一点火光。', '很小，很倔。'], phase: '他身上亮起了不朽的光——就差一步，他就是不朽之王！', low: { who: '火灵儿', t: '“喂！你答应过请我吃烤肉的！”<br>（那是很多很多年以前，百断山里的声音。）' }, end: ['准不朽之王倒下了。', '封印碎了。'] } })) return false;
  await nar('你把火灵儿从封印里抱出来。她很轻，很凉。你把她背在背上，往回走。');
  await nar('走到一半，天上亮起了三道光。三位异域仙王，同时出手——');
  const h3 = await holdOut({ mobs: [['sanxw', 95], ['sanxw', 95], ['sanxw', 95]], title: '异域 · 三仙王伏击', noPet: true, allies: ['a_huolingS'], protect: 'a_huolingS', epic: { name: '三位仙王', sub: '他们等了你很久', seal: '伏击', intro: ['三道光，从三个方向。'], phase: '你护着背上的人，只能硬接。' } }, 3);
  if (h3.survived && h3.protectOk) { F().huoGuard = 1; await nar('三个回合，你一步没让。三位仙王的光，没有一道落在你背上那个人身上。'); }
  await cine('你的身子，碎了。<br>可在碎掉的那一刻，你想起了一门很老的法——<b>他化自在</b>。<br>一个你倒下去，就有另一个你站起来。');
  const tc = await miniGame('clones', { title: '他化自在', desc: '化出来的每一个你，都要挡住一路追兵。背上的人，不能被碰到。' });
  if (tc.ok) { F().tahuaOk = 1; await nar('八路追兵，八个你。每一个你都挡住了。背上那个人，连头发都没乱。'); }
  else await nar('有一路追兵冲了过去，擦着你的背过去——你用身子挡住了。又碎了一个你。还好，你有很多个。');
  await cine('你从三位仙王的眼皮底下，背着火灵儿，<b>走了出来</b>。');
  learnSkill('tahua'); F().huoling = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  await breath(30);
  tip('你把火灵儿安顿在天庭。她的魂还睡着。……还有一个人，在<b>界海</b>里等你。');
}
async function S_liushenBack() {
  await nar('界海上漂着死掉的世界。在一片最大的枯叶上，长着一棵柳树——黑色的，枝条垂进海里。');
  await nar('你一眼就认出了它。');
  await me('……柳神。');
  await nar('黑柳的枝条动了动，慢慢地抬起来，像小时候那样，在你额头上点了一下。很凉。');
  await say('willow', '（柳神的声音很轻，像风吹过枯叶）……长大了。');
  await cine('你小时候爬它的树掏鸟窝，摔下来，它接住你。<br>它被雷劈焦了，只剩一根绿枝，护了整个石村。<br>七神下界那天，它走了，去挡更大的东西。<br>它在界海里，挡了很久很久。<b>挡黑了</b>。');
  const c = await choose(['跟我回家。', '……这些年，你一个人？']);
  if (c === 1) await say('willow', '……不是一个人。（黑色的柳枝指了指界海深处）还有很多守坝的人。只是他们，都没回去。');
  await say('willow', '（柳枝缠住了你的手腕）……走吧。');
  F().liushenBack = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('赤王听说你杀了他的后人，又闯了异域。他在<b>异域城门</b>等你——你被吊过的那座城门。');
}
async function S_chiwang() {
  await chapterCard('第三十一章', '仙王', '三场仙王之战');
  await nar('异域城门上，还留着那根勒过你的绳子。城门下站着赤王，一身赤红，像一团烧了几十万年的火。');
  await say('赤王', '我的后人，在你手里跪过。（他看着你）那座城门，你还记得吗？');
  await me('记得。我还记得，是谁在下面笑。');
  if (!await fightRetry({ mobs: [['chiwang', slv(83, -1, 1)]], allies: ['a_liushen'], title: '异域城门 · 赤王', epic: { name: '赤王', sub: '异域仙王 · 他的后人在你手里跪过', seal: '赤王', intro: ['城门上那根绳子，还在风里晃。'], phase: '又有仙王赶来了——八个，十个，越来越多！', low: { who: '小七', t: '“我们守城，从来不回头看。”' }, end: ['你斩下了赤王的头。', '十几位异域仙王，围了上来。'] } })) return false;
  await cine('他化自在。<br>一个你，两个你，十个你——每一个，都是仙王。<br>你引爆了赤王的兵器，把他的尸身朝追兵砸了过去。<br>然后，你转身，<b>回了仙域</b>。');
  F().chiwangDone = 1; gainExp(BAL.expNext(C.lv) * 0.4);
}
async function S_kundiChase() {
  await nar('鲲帝来了。异域真正的主人，自称异域第一。他在界海上拦住你，身后跟着异域所有的仙王。');
  await say('鲲帝', '赤王死在你手里。……你知道异域死一个仙王，要多少年才能补回来吗？');
  await me('帝关死了多少人，你知道吗？');
  await fight({ mobs: [['kundi', 84]], title: '界海 · 鲲帝', noLose: true, epic: { name: '鲲帝', sub: '异域第一 · 这一次，你追着他打', seal: '鲲帝', intro: ['你追着他，从界海打进了异域。'], phase: '鲲帝祭出了原始古器，黑色的物质从器里涌了出来！' } });
  await cine('你打得鲲帝节节后退，一路追进了异域。<br>大罗剑胎斩下去的那一刻，原始古器里涌出了黑色的物质——<br>它咬在你身上，像界海里的黑一样，往骨头里钻。');
  await tzKundi();
  await cine('<b>十几位仙域的仙王</b>冲进界海，把你接了回去。');
  await breath(31);
  F().kundiWar = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('伤还没好，界海和异域的巨头就打到了<b>仙域古城</b>下。');
}
async function S_xianwar() {
  await nar('仙域古城下，界海来的巨头和异域的巨头站成了一片：刀王、屈冲、九头魔、无殇、蒲魔王，还有鲲帝和异域所有的仙王。');
  await nar('仙域这边，能跟他们正面打的巨头，只有寥寥几个：你，还有……一棵黑色的柳树。二十几位仙域仙王，很快就倒了一大半。');
  await say('willow', '（黑柳的枝条挡在你身前，一根一根地断）……昊儿。你不是一直想看看，自己能走多远吗？');
  if (!await siegeRetry({ waves: [[['yyxwb', slv(83)], ['yyxwb', slv(83)]], [['yyxwb', slv(84)], ['yyxwb', slv(84)], ['jieling', slv(84)]]], allies: ['a_liushen'], title: '仙域城下 · 守' }, '巨头们的兵先压了上来。柳神的枝条在你身边一根一根地竖起来——你站在哪儿？')) return false;
  if (!await fightRetry({ mobs: [['daowang', slv(84, -1, 1)]], allies: ['a_liushen'], title: '仙域 · 刀王', epic: { name: '刀王', sub: '界海来的巨头', seal: '刀王', intro: ['他的刀，斩过很多仙王。'], phase: '刀王的刀光把仙域的天劈成了两半！', low: { who: '柳神', t: '“……昊儿。你不是一直想看看，自己能走多远吗？”<br>（你骨头里那根柳枝，动了一下。）' } } })) return false;
  await tzZhun();
  learnGongfa('zhunxiandi');
  if (!await fightRetry({ mobs: [['pumowang', slv(84, -1, 1)]], allies: ['a_liushen'], title: '仙域 · 蒲魔王', epic: { name: '蒲魔王', sub: '异域巨头', seal: '魔王', intro: ['刀王已经倒下了。'], phase: '蒲魔王身后升起一片魔海！' } })) return false;
  await cine('刀王倒了。蒲魔王倒了。<br>九头魔想跑，被你一把扯了回来。<br>无殇，也倒了。<br>仙域的天，被你一个人，撑住了。');
  F().xianwar = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('鲲帝逃回了异域。<b>鲲帝城</b>在异域封印地北边。这一次，你打过去。');
}
async function S_kundiEnd() {
  await nar('鲲帝城的城墙，是用一条鲲的骨头搭的。城门开着。鲲帝站在城中间，身边只剩下屈冲。');
  await say('鲲帝', '……你赢不了的。异域的根，你拔不干净。');
  await me('我不拔根。我只是要你们，别再往帝关那边看。');
  await nar('你进城的时候，经过了那座城门。那根勒过你的绳子已经烂了，只剩一截，挂在风里。' + (F().wd_yy_stone ? '城门下面，有人放了一块饼。' : ''));
  if (!await fightRetry({ mobs: [['kundi', slv(84, -1, 1)]], allies: ['a_liushen'], title: '鲲帝城 · 鲲帝', epic: { name: '鲲帝', sub: '异域第一 · 最后一次', seal: '鲲帝', intro: ['他身边，只剩下屈冲。'], phase: '鲲帝祭出了原始古器——这一次，你没有退！', low: { who: '孟天正', t: '“帝关……还在。”<br>（师父，异域，从今天起，再也不会往那边看了。）' }, end: ['鲲帝倒下了。屈冲也倒下了。', '异域剩下的仙王，跪了一地。'] } })) return false;
  await cine('那一天以后，异域平了。<br>天下没有人，再敢跟你动手。<br>帝关的城头上，小七——现在是一个白胡子老人了——把七王祠的门匾，又擦了一遍。');
  F().v14end = 1; gainExp(BAL.expNext(C.lv) * 0.6);
  await cine('<div class="cc"><small>第十四卷</small><b>异域之战</b><i>完</i></div>', 'card'); await volRecap('十四');
}

/* ---------------- 第十五卷 · 独断万古 ---------------- */
async function S_v15start() {
  await cine('<div class="cc"><small>第十五卷</small><b>独断万古</b><i>最后一剑</i></div>', 'card');
  await chapterCard('第三十二章', '界海', '最黑的那一个');
  await nar('异域平了，可黑暗没有停。它从界海深处来，一波一波，比异域更深，更冷。');
  await nar('你站在堤坝上，回头看了一眼。天庭的柱子下面站满了人；火灵儿睡在天庭最高的那间屋子里，她的魂还没回来；柳神的黑枝条缠在你的手腕上。');
  await breath(32);
  await say('willow', '……去吧。我替你看着家。');
  await nar('你跳进了界海。');
  if ((F().qinhao || 0) >= 2) { await nar('跳下去之前，有人拽住了你的袖子。是秦昊。他胸口没有骨头了，可他身上的血，烫得像火。');
    await say('秦昊', '哥。（他笑了，笑得跟你小时候一模一样）他们说我是为你生的。我以前不信。……现在我信了。');
    await nar('他跟着你跳了下去。'); }
  await cine('界海里没有白天，也没有年。<br>只有黑，一波一波地压过来。');
  if (!await siegeRetry({ waves: [[['jieling', slv(84)], ['jieling', slv(84)]], [['jieling', slv(84)], ['yyxwb', slv(84)], ['jieling', slv(84)]], [['yyxwb', slv(85)], ['yyxwb', slv(85)], ['jieling', slv(85)]]], allies: ['a_liushen'], title: '界海 · 三万年' }, '第一万年。黑从四面八方涌过来，你背后是堤坝，堤坝后面是家——你站在哪儿？', '黑把你推回了堤坝上。柳神的枝条缠住了你的手腕：“……歇一口气，再去。”')) return false;
  await cine('第一万年，你的剑卷了刃。<br>第二万年，你忘了自己上一次睡觉是什么时候。<br>第三万年，你还站着。<br>黑暗四帝从界海的四个方向压过来——你把它们，一个一个，按回了海底。<br>只剩最后一个。');
  if ((F().qinhao || 0) >= 2) await cine('三万年里，有一年，三位帝里最狠的那一个，一掌拍向你的后心。<br>秦昊挡在了你身后。<br>他把一辈子的血，一次烧完了。<br>你接住他的时候，他很轻。<br>“……哥，到了那边，记得把我捞回来。”<br><b>你答应了。</b>', 'mem');
  if (!await fightRetry({ mobs: [['heiandi', slv(84, -1, 1)]], allies: ['a_liushen'], title: '界海 · 黑暗之帝', epic: { name: '黑暗之帝', sub: '黑暗四帝之一', seal: '黑暗', intro: ['三万年。', '你还站着。'], phase: '黑暗之帝张开了界海——整片海都是它的身子！', low: { who: '族长', t: '“吃饱了再打！”<br>（族长，三万年了。我还记得。）' }, end: ['最后一位黑暗之帝，沉进了海底。'] } })) return false;
  F().heiandiDone = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('黑暗的源头，在<b>界海深处</b>。');
}
async function S_shihai() {
  await chapterCard('第三十三章', '独断万古', '一剑');
  await nar('界海深处的黑，是有重量的。黑的最中间，坐着一个人——不，一具尸骸。它是仙帝。它是所有黑暗的源头。');
  await say('尸骸仙帝', '……准仙帝。（它的声音像是从很多很多个时代同时传过来）你走得很远了。可惜，到这里为止。');
  const hS = await holdOut({ mobs: [['shihai0', 120]], title: '界海深处 · 尸骸仙帝', noPet: true, epic: { name: '尸骸仙帝', sub: '黑暗的源头', seal: '仙帝', intro: ['它抬起了一根手指。'], phase: '那一根手指，压下来的是整个界海。' } }, 2);
  if (hS.survived) { F().heldShihai = 1; await nar('你在那根手指下面撑了两个回合。两个回合，够了——够你记住它出手的样子。'); }
  await cine('你死了。<br>这一次，是真的死了。<br>身子碎了，元神碎了，连名字，都快要被黑暗吞掉了。');
  if ((F().shiyiQ || 0) >= 2) await cine('你碎掉的时候，有一个人从界海外面冲了进来。<br>他的两只眼睛里，各有两个瞳孔。<br>他把手按在你碎掉的胸口上，点燃了自己身上所有的至尊古血——<br>那块骨头，那块从你身上挖走、在他身上长了一辈子的骨头，<b>亮成了一盏灯</b>。<br>“……还你了。”<br>灯灭了。可你多撑了一口气。', 'mem');
  await dieBackSea();
  await cine('他化自在。<br>你从每一个记得你的人心里，<b>化了回来</b>。<br>一个你，两个你，千千万万个你——<br>合成了一个。<br><b>仙帝。</b>');
  learnGongfa('xiandi'); F().xiandi = 1; gainExp(BAL.expNext(C.lv) * 0.6);
  await say('尸骸仙帝', '……不可能。我杀了你。');
  await me('你杀了一个。可记得我的人，太多了。');
  if (!await fightRetry({ mobs: [['shihai', slv(85, -1, 0)]], allies: ['a_liushen'], title: '界海深处 · 尸骸仙帝', epic: { name: '尸骸仙帝', sub: '黑暗的源头 · 他杀过你一次', seal: '仙帝', intro: ['它杀过你一次。', '这一次，你是仙帝。'], phase: '尸骸仙帝把整个界海的黑暗都收了回来，压在你一个人身上！', low: { who: '火灵儿', t: '“……喂。你答应过请我吃烤肉的。”<br>（这一次，不是回忆。是她的声音。她醒了。）' }, end: ['尸骸仙帝，碎成了灰。', '界海的黑，第一次，淡了。'] } }, '黑暗把你压回了海底。你又站了起来——你已经死过一次了，不怕第二次。')) return false;
  F().shihaiDone = 1;
}
async function S_duduan() {
  await nar('你从界海里走出来的时候，堤坝上站满了人。火灵儿站在最前面，红衣服在风里响。她瘦了很多，眼睛却还是那么亮。');
  await say('huolinger', '……你答应过请我吃烤肉的。欠了多少年了？');
  await me('（从怀里掏出一块烤肉）一直揣着。');
  await nar('她看着那块烤肉，“噗”地笑了，眼泪一下子掉了下来。');
  await say('huolinger', '……凉了。');
  await nar('可你知道，事情还没完。尸骸仙帝只是黑暗在这一边的根。界海的更上面——上苍之上——还有更大的黑，迟早会顺着时光长河流下来，流到九天十地，流到下界，流到石村。');
  await say('willow', '（柳神的黑枝条轻轻缠住了你的手腕）……你想好了？');
  await me('想好了。');
  const ech = finaleEchoes(); if (ech.length) await cine('你想起了很多事。<br>' + ech.slice(0, 7).join('<br>'), 'mem');
  if ((F().qinhao || 0) >= 2) await nar('你还想起了界海里那个很轻的人。到了那边，第一件事，就是把他捞回来。');
  const c = await choose(['（拔出剑）', '（最后看一眼石村的方向）']);
  if (c === 1) await cine('你最后看了一眼石村的方向。<br>村口的石头上，刻着一代一代孩子的名字。<br>最上面那个，是“小不点”' + (F().stoneName === 3 ? '——那个空了很久的位置，终于有人替你刻上了。' : '。') + '');
  const rh = await miniGame('rhythm', { title: '独断万古', desc: '一剑。可这一剑里，有你走过的每一步。' });
  if (rh.ok) await cine('每一步，都踩在了点上：<br>石村的石锁，补天阁的雷，百断山的血，帝关的城墙，黑水的一百年，八辈子——<br>全都落在了这一剑上。');
  await cine('你一剑斩下去。<br>斩的不是人，不是帝，<br>是时光长河。<br><b>独断万古。</b>');
  await cine('长河断成了两截。<br>这一边，是九天十地，是下界八域，是石村。<br>那一边，是上苍之上，是所有的黑。<br>只要你站在断口上，<b>黑就流不过来</b>。');
  learnSkill('duduan');
  await nar('你要去那一边了。去上苍之上，守着那道断口。');
  await nar('跟你一起走的，有一棵黑色的柳树，一个穿红衣服的姑娘，一只烂木盒子——你一直没打开它，你觉得，等到了那边，就是打开它的时候了。');
  await say('dazhuang', '（大壮的孙子的孙子的孙子，站在石村村口，冲着天大喊）小不点——！吃饱了再走——！');
  await me('（你笑了）……吃饱了。');
  F().v15end = 1; gainExp(BAL.expNext(C.lv) * 0.6);
  go('jh_top', false, true);
  await cine('很多很多年以后，石村的孩子们，还在村口举石锁。<br>举不动的时候，大人就会指着天上说：<br><b>“很久以前，有个小不点，也举不动。”</b>');
  await cine('<div class="cc"><small>完美世界 · 石昊篇</small><b>全书完</b><i>谢谢你陪他走完这一路</i></div>', 'card');
  await nar('主线到这里就结束了。你还可以回到下界、上界、九天十地、仙域和界海的任何地方走走，挑战虚神界，把宝术都练到圆满，合成更强的宝术。');
}
