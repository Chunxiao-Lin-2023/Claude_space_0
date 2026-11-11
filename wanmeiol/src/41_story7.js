/* ================= 石昊's story, volume 12 (天庭) and volume 13 (帝落) =================
   Beats follow the novel's later stages as summarised by readers: at the peak of 至尊 he rules 九天, destroys the 残仙 hiding
   beneath it and founds the 天庭; he goes to the 堤坝 and looks out over the 界海; in 仙域 he reaches the combat power of a
   true immortal, beats the heirs of the 仙王 and goes through the 造化之门; then the 帝落时代 — he goes up the river of time,
   lives eight lives backwards, and comes back. The novel tells these stages briefly and at a great scale; the game keeps to
   that outline, and the scenes in between are written fresh. */

/* ---------------- 第十二卷 · 天庭 ---------------- */
async function S_v12start() {
  await cine('<div class="cc"><small>第十二卷</small><b>天庭</b><i>下一次黑暗来的时候</i></div>', 'card');
  await chapterCard('第二十六章', '天庭', '站在一起');
  await say('chief', '（族长坐在柳神的树桩旁边，晒着太阳）……九天太平了？');
  await me('太平了一阵子。');
  await say('chief', '一阵子？（他眯着眼睛看你）你这孩子，打完了架，还皱着眉。');
  await me('九天底下，还有东西在吃九天。帝关外面，还有界海。黑暗不会只来一次。');
  await say('chief', '那你打算怎么办？一个人，一次一次地去挡？');
  await nar('你没说话。你想起了帝关，想起了原始帝城——城里的人跑了，七王没跑。');
  await me('……不能再一个人挡了。得有个地方，让九天十地站在一起。');
  await say('chief', '（他笑了，皱纹挤成一团）那就去立一个。吃饱了再去。');
  F().v12 = 1;
  tip('九天之巅西边，有一座<b>残仙墓</b>。先把那个吃九天的东西清掉。');
}
async function S_canxian() {
  await nar('残仙墓里有呼吸声，很慢，很深。墓底下躺着一个东西——它曾经是仙，现在只剩一半。另一半，是它从九天吸来的灵气、寿元、和人。');
  await say('残仙', '……又一个至尊。（它睁开一只眼睛）九天的至尊，我吃过十七个。你是第十八个。');
  if (!await fightRetry({ mobs: [['canxiantu', slv(72)], ['canxiantu', slv(72)]], title: '残仙墓 · 信徒' })) return false;
  if (!await fightRetry({ mobs: [['canxian', slv(74, -1, 1)]], title: '残仙墓 · 残仙', epic: { name: '残仙', sub: '靠吃九天活着的仙', seal: '残仙', intro: ['它吃过十七个至尊。', '你是第十八个——它是这么想的。'], phase: '残仙张开嘴，九天的灵气全往它嘴里灌！', low: { who: '孟天正', t: '“……这辈子，没成仙啊。”<br>（师父。仙要是长这样，不成也罢。）' }, end: ['残仙散了。', '九天的灵气，第一次没有往地底下流。'] } })) return false;
  F().canxian = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('天门东边，那片空地——在那里立<b>天庭</b>。');
}
async function S_tianting() {
  await nar('你在天门东边那片空地上，立了一根柱子。就一根。');
  await say('qidaolin', '（齐道临挤过来，胡子都白了）徒弟，这……这就是天庭？');
  await me('嗯。不收钱，不分家，谁来都行。黑暗来的时候，站到这根柱子下面来。');
  await nar('第一天，没人来。第二天，小七带着帝关活下来的那几个孩子来了，站到了柱子下面。第三天，三藏和神冥来了。第四天，石毅来了，什么都没说，站在了你旁边。');
  await nar('第十天，柱子下面站满了人。有九天的，有十地的，有下界的。大壮带着石村八百兵，扛着石锁，挤在最后面。');
  await say('qidaolin', '（他抹了一把眼睛）……为师这辈子，就盼着至尊道场能热闹起来。没想到，热闹成这样。');
  await cine('那一天，九天十地，<b>第一次站在了一起</b>。<br>没有人叫它“罪血的天庭”。<br>他们叫它——<b>天庭</b>。');
  F().tiantingDone = 1; gainExp(BAL.expNext(C.lv) * 0.3);
  tip('仙域的界海之滨往西，是<b>堤坝</b>。去看看界海。');
}
async function S_dam() {
  await nar('堤坝很长很长，长得看不到头。坝上站着守坝的人，一个隔一个，都朝着外面。');
  await nar('外面是界海。海是黑的，没有边，海上漂着一片一片的东西——你走近了才看清，那是死掉的世界，像枯叶一样。');
  await say('守坝的老人', '新来的？（他头也不回）别往海里看太久。看久了，你会觉得，我们这一片，也不过是一片叶子。');
  if (!await fightRetry({ mobs: [['jieling', slv(73)], ['jieling', slv(73)], ['jieling', slv(73)]], title: '堤坝 · 黑暗生灵' })) return false;
  await nar('黑暗生灵退回了海里。你站在坝上，看着那片黑，看了很久。');
  await me('……那边，有什么？');
  await say('守坝的老人', '有很多帝。有很多死了的帝。还有一个，最黑的。（他终于转过头来，看了你一眼）你会去的。迟早。');
  F().dam = 1; gainExp(BAL.expNext(C.lv) * 0.3);
  tip('去<b>仙域古城</b>。仙王的后人们，听说了一个从下界爬上来的人。');
}
async function S_xwhy() {
  await chapterCard('第二十七章', '造化', '真仙');
  await nar('仙域古城里，来了一群年轻人。他们走路的样子，跟你在上界见过的所有人都不一样——他们的爹，都是仙王。');
  await say('仙王后裔', '你就是那个下界来的？罪血？（他笑了，笑得很好看）仙域不收罪血。你走吧，我不跟你打。');
  await me('不打？');
  await say('仙王后裔', '跟你打，赢了没面子，输了……（他想了想）我不会输。');
  if (!await fightRetry({ mobs: [['xwhy', slv(75, -1, 1)]], title: '仙域古城 · 仙王后裔', epic: { name: '仙王后裔', sub: '他的父亲，是一位仙王', seal: '仙王', intro: ['他从生下来就没输过。'], phase: '他身后浮出了他父亲的法相——一位仙王的影子！', low: { who: '族长', t: '“吃饱了再打！”' }, end: ['他输了。', '他坐在地上，看着自己的手，很久没说话。然后他笑了：“……原来，输是这种感觉。”'] } })) return false;
  F().xwhyDone = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('仙域古城北边，是<b>造化之门</b>。');
}
async function S_zaohua() {
  await nar('造化之门很高，门缝里漏出来的光比太阳还亮。门前躺着很多骨头——没走出来的人。');
  if (!await fightRetry({ mobs: [['zaohua', slv(75, -1, 1)]], title: '造化之门 · 守灵', epic: { name: '造化之门守灵', sub: '过了它，就是真仙', seal: '造化', intro: ['门前那些骨头，都是想过去的人。'], phase: '门里伸出了无数只手，要把你拖进去！', end: ['守灵让开了。', '门，开了一道缝。'] } })) return false;
  await cine('你走进了造化之门。<br>门里没有路，只有光。<br>光把你拆开，又拼起来。拆了九次，拼了九次。<br>你走出来的时候，第一次觉得——<b>天，没那么高了</b>。');
  learnGongfa('zhenxian'); F().v12end = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  await cine('<div class="cc"><small>第十二卷</small><b>天庭</b><i>完</i></div>', 'card');
  tip('造化之门北边，有一条看不见源头的河——<b>时光长河</b>。境界可以突破到<b>仙王境</b>了。');
}

/* ---------------- 第十三卷 · 帝落 ---------------- */
async function S_v13start() {
  await cine('<div class="cc"><small>第十三卷</small><b>帝落</b><i>往上游走，活八辈子</i></div>', 'card');
  await chapterCard('第二十八章', '帝落', '时光长河的上游');
  await nar('时光长河里流的不是水，是时间。你踩进去，河水往回流——你看见了昨天，看见了去年，看见了石村那棵还没被雷劈的柳树。');
  await nar('你往上游走。走了很久很久。河两边的天，一点一点地暗下去。');
  await cine('你走到了一个时代。<br>那个时代的天上，所有的帝星，都在往下掉。<br>人们管它叫——<b>帝落时代</b>。');
  F().v13 = 1;
  tip('往北，<b>帝落古战场</b>。');
}
async function S_dlAge() {
  await nar('帝落古战场上的兵，盔甲上刻着你不认得的字。他们看见你，愣了一下，然后举起了矛——在这个时代，你是一个不该出现的人。');
  if (!await fightRetry({ mobs: [['diluobing', slv(77)], ['diluobing', slv(77)], ['shiguang', slv(77)]], title: '帝落古战场' })) return false;
  await nar('一个老兵倒在你面前，看着你的脸，忽然笑了：“……你长得，像我们那个时代的一个传说。”');
  await me('什么传说？');
  await say('帝落古兵', '一个从下面爬上来的孩子。（他闭上了眼睛）……他们说，他会回来的。');
  F().dlAge = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('长河东边，<b>八世轮回</b>。');
}
async function S_lives() {
  await chapterCard('第二十九章', '八世', '一世一世地活回去');
  await cine('第一世，你是一个铁匠。打了一辈子刀，没打过一架。<br>第二世，你是一个将军。守了一辈子城，城没破。<br>第三世，你是一个乞丐，在一座很大的城门下，看着一个被吊着的人。', 'mem');
  await cine('第四世，你是一棵树。<br>第五世，你是一个母亲，抱着孩子在一个池子边跪了三天。<br>第六世，你是一个守坝的人，一辈子没回过头。', 'mem');
  await cine('第七世，你是一个老人，坐在一个小村子的树桩边，等一个孩子回家。<br>……<br>第八世——<b>它来了</b>。', 'mem');
  await say('前世之敌', '每一世，我都会找到你。（一个看不清脸的影子站在你面前）上一世，我杀过你一次。这一世——');
  if (!await fightRetry({ mobs: [['qianshi', slv(79, -1, 1)]], title: '八世轮回 · 前世之敌', epic: { name: '前世之敌', sub: '每一世都会遇见的那个人', seal: '宿命', intro: ['它说，上一世，它杀过你一次。'], phase: '它说：“上一世，我杀过你一次。”', low: { who: '你娘', t: '“昊儿，活下去。”<br>（那是第五世的你，跪在池子边上，说给自己听的话。）' }, end: ['宿命，断了。', '八世的你，同时睁开了眼睛。'] } })) return false;
  learnGongfa('baxi'); F().baxi = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('<b>长河尽头</b>在北边。该回去了。');
}
async function S_dlEnd() {
  await nar('长河尽头有一盏很亮的灯——那是你出发的地方。可在灯和你之间，压着一片很大很大的黑。');
  await say('万古之劫', '……活了八世的人。（那片黑说话了）你回不去的。你会被冲回第一世，永远在河里打转。');
  if (!await fightRetry({ mobs: [['wangujie', slv(80, -1, 1)]], title: '长河尽头 · 万古之劫', epic: { name: '万古之劫', sub: '帝落时代压在所有人头顶的劫', seal: '万古', intro: ['八世的你，都站在你身后。'], phase: '时光长河在你脚下倒流——它要把你冲回第一世！', low: { who: '族长', t: '（第七世的你，坐在树桩边，等一个孩子回家。<br>那个孩子，得回去。）' }, end: ['劫，散了。', '你跳进了那盏灯里。'] } }, '长河把你冲了回去。你站起来——第九次。')) return false;
  await cine('你回来的时候，九天十地，已经过去了很久很久。<br>天庭还在。那根柱子，被人摸得发亮。<br>石村还在。村口的石头上，刻满了一代一代孩子的名字。<br><b>你回来了。</b>');
  F().v13end = 1; gainExp(BAL.expNext(C.lv) * 0.6);
  await cine('<div class="cc"><small>第十三卷</small><b>帝落</b><i>完</i></div>', 'card');
  tip('有人从异域那边带回来一个消息——关于一个很久以前被抓走的人。境界可以突破到<b>准仙帝</b>了。');
}
