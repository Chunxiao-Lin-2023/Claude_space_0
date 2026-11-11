/* ================= 石昊's story, volume 6 (争霸) and volume 7 (仙古) =================
   Beats follow the novel: at 银磨山 eight 神火境 geniuses (太古莽牛初代, 紫金鹄初代, 火蝎族初代, a 三眼兽族 genius, 银葵初代,
   a 冥土 genius, 龙雀 and 白狮初代) lay a formation to force 蓝一尘 to give up the 八珍麒 — 石昊 kills all eight (打神石 on 银葵);
   ancient geniuses surface (龙女, 堕神子, 黑暗神子, 长弓衍, 孤剑云), the 十冠王 shows a sapling of the world tree, 石毅 is back.
   At the 三千州 tournament he holds the stage for 588 wins until he is badly hurt; 银坤 stirs the crowd to swarm him, 孤剑云
   holds back; he burns his 至尊 blood to learn the 柳神法, returns, kills 银坤 with the 大罗剑胎; 宁川 (六冠王, 十凶麒麟血) comes,
   then 谪仙, the 十冠王, 天子; 轮回's disc is blocked by the world tree; 石昊 reaches 涅槃圆满, kills 轮回 with 石毅 striking last,
   beats 宁川 in one move and wins. In 仙古 he kills 帝冲's avatar; 宁川 calls them both 罪血后代 and 石昊 and 石毅 fight him
   together; 帝冲's real body fuses with what is left of the avatar and dies too. The prose is written fresh for the game. */

/* ---------------- 第六卷 · 争霸 ---------------- */
async function S_v6start() {
  await cine('<div class="cc"><small>第六卷</small><b>争霸</b><i>三千州的天才，都来了</i></div>', 'card');
  await chapterCard('第十四章', '银磨山', '八个天骄，一头麒麟');
  await say('qidaolin', '徒弟！（齐道临一路小跑过来，胡子上还挂着面条）三千州天才争霸，定了！就在无人区北边，搭了一座争霸城。');
  await say('qidaolin', '三千州所有的道统、世家、古族，都会把最好的年轻人送过去。赢的人……（他压低声音）整个三千州都会记住他的名字。');
  await me('输的人呢？');
  await say('qidaolin', '输的人？（他想了想）输的人回家，被家里长辈骂一顿，然后接着练。……你不会输的，对吧？');
  const c = await choose(['不会。', '会输。但不会一直输。', '赢了管饭吗？']);
  if (c === 1) await say('qidaolin', '（他愣了一下，然后点点头）……这话比“不会”有分量。');
  else if (c === 2) await say('qidaolin', '管！为师请你吃三千州最贵的馆子！……先赊着。');
  else await say('qidaolin', '好！为师就爱听这个！');
  F().v6 = 1;
  tip('<b>争霸城</b>在无人区北边。');
}
async function S_sqTown() {
  await nar('争霸城是一夜之间搭起来的。街上走的每一个人，身上的气息都压得人喘不过气——三千州的天骄，全在这儿了。');
  await say('争霸城的说书人', '诸位！还没开打，银磨山那边就出事了！八个神火境的天骄联手，在山上布了一座大阵——逼一个叫蓝一尘的人，把他养的八珍麒交出来！');
  await say('台下的人', '八个神火境？那蓝一尘死定了。');
  await nar('你想起了云族那个趴在云边上的小娃娃，想起了被祭坛锁成坐骑的影子。你放下手里的烤肉，站了起来。');
  await say('qidaolin', '……徒弟，你又要干嘛？');
  await me('去银磨山看看。');
  await say('qidaolin', '（他叹了口气，从怀里摸出一块干饼塞给你）路上吃。……那八个人，没有一个好惹的。');
  tip('<b>银磨山</b>在争霸城西边，从八珍谷往北走。');
}
async function S_yinmo() {
  await nar('银磨山顶上，八道身影围成一圈，一座大阵罩住了半座山。阵中间跪着一个满身是血的青年，怀里护着一头小小的麒麟——八珍麒，浑身的毛是八种颜色。');
  await say('白狮初代', '蓝一尘，最后问一次。麒麟，交还是不交？');
  await say('蓝一尘', '（青年咬着牙，把麒麟抱得更紧了）……它是我从小喂大的。');
  await nar('你踩着阵纹走了进去。阵纹在你脚下一道一道地碎。八个人同时转过头来。');
  await say('太古莽牛初代', '哪来的小子？下界的味道……罪血？');
  await me('我饿了。听说八珍麒是八种灵草喂大的，我想看看它长什么样。');
  await say('紫金鹄初代', '……他在说什么？');
  if (!await fightRetry({ mobs: [['manniu', slv(46)], ['zijinhu', slv(46)]], title: '银磨山 · 莽牛与紫金鹄' })) return false;
  await nar('两个初代倒在了阵里。剩下六个人的脸色，全变了。');
  if (!await fightRetry({ mobs: [['huoxie', slv(46)], ['sanyan', slv(46)], ['mingtu', slv(47)]], title: '银磨山 · 火蝎、三眼、冥土' })) return false;
  await nar('银葵初代的花刃朝你切过来的时候，你没有躲。你从怀里摸出了一块灰扑扑的石头——打神石。');
  if (!await fightRetry({ mobs: [['yinkui', slv(47)], ['longque', slv(47)]], title: '银磨山 · 银葵与龙雀' })) return false;
  await cine('打神石砸下去，银葵初代的花瓣，碎了一地。<br>龙雀想飞，你一伸手，把它从天上拽了下来。');
  await say('白狮初代', '（八个人，只剩下他一个。他的白毛一根一根地竖了起来）……你到底是谁？');
  await me('石村的。他们管我叫“荒”。');
  if (!await fightRetry({ mobs: [['baishi', slv(48, -1, 1)]], title: '银磨山 · 白狮初代', epic: { name: '白狮初代', sub: '八个天骄里最强的那个 · 神火境后期', seal: '天骄', intro: ['七个人倒在他身边。', '他是最后一个，也是最强的一个。'], phase: '白狮初代站了起来，一身白毛根根倒竖——神火境后期的气势压了下来！', low: { who: '蓝一尘', t: '“……小心！它的右爪是虚的，左爪才是真的！”' }, end: ['白狮倒了下去。', '银磨山顶，八个天骄，一个都没下山。'] } })) return false;
  await nar('大阵碎了。蓝一尘抱着麒麟站起来，冲你深深地弯下了腰。八珍麒从他怀里探出脑袋，舔了舔你的手指——八种灵草的香味。');
  await me('……原来是这个味儿。（你咽了口口水）放心，我不吃它。');
  await cine('就在这时，银磨山四面的云，一下子散开了。<br>山脚下、云层里、古老的洞府里，一道一道的身影站了起来——<br>龙宫的龙女、堕神子、黑暗神子、长弓衍、孤剑云……<br>沉睡在三千州各处的<b>古代天骄</b>，都醒了。');
  await cine('最远的那片云上，站着一个人。他身后，有一棵小小的树苗，叶子是金色的。<br>有人在山下小声说了一个名字——<b>十冠王</b>。');
  F().yinmo = 1; gainExp(BAL.expNext(C.lv) * 0.5);
}
async function S_shiyiBack() {
  await nar('你从银磨山下来，山脚下的石头上坐着一个人。白衣，两只眼睛里各有两个瞳孔。');
  await say('石毅', '……好久不见。');
  await nar('你站住了。上一次见他，是在天空战场上，他躺在台子上看着天，被一个重瞳的女人抱走。');
  await me('你没死。');
  await say('石毅', '差一点。（他站起来，拍了拍衣服）那个人把我救了回来。我在她那儿待了很久，学了很多……也想了很多。');
  const c = await choose(['还想打吗？', '你想通了什么？', '（递给他半块干饼）']);
  if (c === 0) await say('石毅', '想。可不是现在。（他看着远处）宁川要出关了。他看不起我，也看不起你——他说我们这一脉，都是罪血。');
  else if (c === 1) await say('石毅', '（他沉默了一会儿）那块骨头……不是我的。可我这身本事，是我自己的。我想用我自己的东西，跟你打一场。');
  else { await nar('他看着那半块饼，愣了很久，然后接了过去。'); await say('石毅', '……齐道临给你的？硬得能砸死人。（他咬了一口）还行。'); }
  await say('石毅', '争霸台上见。别在我之前输了。');
  F().shiyi3 = 1;
  tip('<b>争霸台</b>在争霸城北边。');
}
async function S_arena1() {
  await chapterCard('第十五章', '争霸', '台上只剩一个人的时候');
  await nar('争霸台是一整块青石，台下坐满了人，一眼望不到头。规矩很简单：守住台子，一直守，守到没人敢上来为止。');
  await say('裁判', '下一位——下界罪州，荒！');
  await nar('台下一阵哄笑。你走上台，第一个对手还没站稳，就被你一拳打下了台。笑声停了。');
  if (!await fightRetry({ mobs: [['tiaozhan', slv(46)], ['tiaozhan', slv(46)], ['tiaozhan', slv(46)]], title: '争霸台 · 车轮战' })) return false;
  await cine('一百场。<br>台下没人笑了。<br>三百场。<br>台下有人开始下注——不是赌你输，是赌你能撑到第几场。');
  if (!await fightRetry({ mobs: [['tianjiao6', slv(47)], ['tianjiao6', slv(47)], ['tiaozhan', slv(47)]], title: '争霸台 · 第五百场' })) return false;
  await cine('五百八十八场。<br>你的手在抖，嘴里全是血。上台的人一个比一个强。<br>你站着，可你知道，你快站不住了。');
  await say('银坤', '（台下一个穿银袍的人站了起来，大声喊）诸位！看见了吗？他快不行了！一个罪血，凭什么占着三千州的台子？一起上！');
  await nar('台下哗地站起来一片人。有人拔剑，有人祭宝。你握紧了拳头。');
  await say('孤剑云', '（一个抱着剑的青年拦在了人群前面）……不急。（他看着你）他的生机还没断。现在上去的，都是趁人之危。');
  await nar('人群停了一停。你趁着这一停，一步一步地走下了台，走出了争霸城。背后，有人在笑，有人在骂，有人在喊：“罪血跑了！”');
  F().wounded = 1;
  tip('往东边的<b>枯柳崖</b>去。你也不知道为什么，就是想去那儿。');
}
async function S_liushen() {
  await nar('枯柳崖上只有一截枯了的柳树根。你靠着它坐下，身上的血把树根染红了一片。');
  await nar('你闭上眼睛。耳边很吵——台下的笑声、骂声、“罪血跑了”。然后，慢慢地，安静了。');
  await cine('你看见了石村。<br>那棵烧焦的柳树，只剩一根柳枝是绿的。<br>你小时候爬上去掏鸟窝，摔下来，那根柳枝接住了你。<br>你那时候不知道，它是在护着你。', 'mem');
  await cine('柳神说过一句话。<br>那时候你太小，没听懂。<br><b>“烧掉旧的，才长得出新的。”</b>', 'mem');
  await me('……烧掉旧的。');
  const c = await choose(['（燃烧至尊血）', '（深吸一口气，燃烧至尊血）']);
  await cine('你体内那两块至尊骨里流着的血，一滴一滴地烧了起来。<br>很疼。<br>比涅槃池疼，比地火液海疼，比被挖骨的那一夜还疼。<br>烧完了，你的骨头里，长出了一根很细很细的<b>柳枝</b>。');
  await nar('你睁开眼睛。崖上那截枯柳根，冒出了一点绿。');
  learnSkill('liushen'); F().liushen = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('回<b>争霸台</b>。他们还以为你跑了。');
}
async function S_arena2() {
  await nar('你走回争霸台的时候，台上站着银坤。他正在跟台下的人说：“那个罪血，早就吓破胆了……”');
  await nar('他转过身，看见你，话卡在了嗓子里。');
  await me('你刚才说，一起上？');
  await say('银坤', '……（他咬了咬牙）一个半死的罪血，我一个人就够了！');
  await nar('你从怀里摸出那枚贴身带了很久、一直没舍得用的东西——一枚还没开锋的剑胎。<b>大罗剑胎</b>。');
  learnSkill('daluo');
  if (!await fightRetry({ mobs: [['yinkun', slv(48, -1, 1)]], title: '争霸台 · 银坤', epic: { name: '银坤', sub: '喊“一起上”的那个人', seal: '小人', intro: ['他白天喊得最大声。', '现在，台上只有他一个人。'], phase: '银坤冲台下大喊：“他快不行了！一起上！”——这回，台下没有一个人动。' } })) return false;
  await cine('大罗剑胎斩下去的时候，没有声音。<br>银坤低头看着自己的胸口，好像不明白发生了什么。<br>他倒下去的时候，台下几千人，一个出声的都没有。');
  await cine('孤剑云抱着剑上了台，守了两百场。<br>然后，一个人从天边走了过来——<b>宁川</b>，六冠王。<br>他守了四百场，台下的人，连呼吸都放轻了。');
  await cine('谪仙来了。十冠王来了。天子来了。长弓衍来了。<br>石毅也来了。<br>还有一个人，手里托着一面盘子——<b>轮回</b>。');
  await say('轮回', '（他把盘子对准了你和石毅）你们两个，同一块骨头，同一个罪。一起进轮回吧。');
  await nar('轮回盘转了起来——转到一半，被一棵金色的树影挡住了。十冠王在远处淡淡地看了一眼，什么都没说。');
  await say('石毅', '（他站到了你旁边）……这一个，一起。');
  if (!await fightRetry({ mobs: [['lunhuizi', slv(49, -1, 1)]], allies: ['a_shiyi'], title: '争霸台 · 轮回', epic: { name: '轮回', sub: '一面盘子 · 想把你们两个都送进去', seal: '轮回', intro: ['你和石毅，第一次站在同一边。'], phase: '轮回祭出了轮回盘——可盘子被一棵世界树的影子挡住了半边！', end: ['你一拳打穿了轮回盘。', '石毅的重瞳亮了一下——最后一击，是他的。'] } })) return false;
  await nar('轮回倒下去的时候，石毅看了你一眼。你们谁也没说话。');
  await say('宁川', '（宁川慢慢地走上台来，身后升起一头麒麟的影子）罪血后代，倒是挺齐心。……可惜，罪血终究是罪血。');
  if (!await fightRetry({ mobs: [['ningchuan', slv(49, -1, 1)]], title: '争霸台 · 宁川', epic: { name: '宁川', sub: '六冠王 · 十凶麒麟血', seal: '六冠', intro: ['三千州公认最难对付的人。', '他看你的眼神，跟上界那些人一样。'], phase: '宁川身后升起了一头麒麟的影子——十凶的血，醒了！', low: { who: '柳神', t: '“烧掉旧的，才长得出新的。”<br>（你骨头里那根柳枝，长出了第二片叶子。<b>涅槃，圆满了。</b>）' }, end: ['一招。', '宁川倒退了十步，站在台边上，再没往前走。'] } }, '宁川把你打下了台。台下没人笑——上回笑的人，都被你打下去了。再来！')) return false;
  learnGongfa('niepanyuan');
  await cine('裁判的声音在发抖：<br><b>“三千州天才争霸——荒，胜！”</b>');
  await nar('台下静了很久。然后，有人喊了一声“荒”，接着是第二声，第三声。和至尊古台下那天一样，可这一次，喊的人更多。');
  await say('qidaolin', '（齐道临挤在人堆里，眼睛通红，扯着嗓子喊）那是我徒弟！至尊道场的！至尊道场！');
  F().v6end = 1; gainExp(BAL.expNext(C.lv) * 0.6);
  await cine('<div class="cc"><small>第六卷</small><b>争霸</b><i>完</i></div>', 'card');
  tip('争霸台北边，一座石门开了——<b>仙古遗地</b>。境界可以突破到<b>圣祭境</b>了。');
}

/* ---------------- 第七卷 · 仙古 ---------------- */
async function S_v7start() {
  await cine('<div class="cc"><small>第七卷</small><b>仙古</b><i>一个被埋掉的纪元</i></div>', 'card');
  await chapterCard('第十六章', '仙古', '石门后面，是另一个时代');
  await nar('仙古的石门比山还高。门上刻着一行字，三千州没有一个人认得出来。争霸赢下来的天骄，一个接一个地走了进去。');
  await say('qidaolin', '徒弟，仙古里死过一个纪元的人。（他难得没有笑）里面的东西，比外面的人还危险。……还有，帝冲也进去了。');
  await me('帝冲是谁？');
  await say('qidaolin', '一个很狂的人。（他想了想）狂到……比你还狂。他放了个化身先进去探路。');
  await me('那我先去找他的化身。');
  await say('qidaolin', '……为师就知道。');
  F().v7 = 1;
  tip('往北走，进<b>仙古遗迹</b>。');
}
async function S_xgAvatar() {
  await nar('仙古遗迹里，倒塌的柱子比树还粗。一个人坐在一根断柱上，晃着腿，冲你笑。');
  await say('帝冲化身', '你就是那个争霸台上的荒？（他跳下来）本体让我来看看你。……就这？比我想的矮。');
  await me('你也比我想的话多。');
  if (!await fightRetry({ mobs: [['dichongz', slv(51, -1, 1)]], title: '仙古遗迹 · 帝冲化身', epic: { name: '帝冲化身', sub: '只是一个化身', seal: '帝', intro: ['只是化身，就已经很不好惹。'], phase: '化身咧嘴一笑：“打死我又怎样？本体就在仙古里等你。”', end: ['化身碎了。', '碎片飘向仙古深处——飘向它的本体。'] } })) return false;
  await nar('化身碎掉之前，冲你眨了眨眼：“本体会来找你的。他记仇。”');
  F().xgAvatar = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('遗迹东边有一片<b>血湖</b>。石毅好像往那边去了。');
}
async function S_xgLake() {
  await nar('血湖边上站着两个人。一个是石毅，一个是宁川。宁川的身后，那头麒麟的影子比争霸台上的时候更大了。');
  await say('宁川', '……正好。两个罪血后代，一起送走。');
  await say('石毅', '（他的重瞳缩了一下）你再说一遍。');
  await say('宁川', '罪血。你们石家那一脉，祖上是罪人，生下来就是罪人。三千州谁不知道？');
  await nar('你想起了上界路边那个人，想起了至尊古台上那块天碑，想起了你刻下去的那个字。');
  await me('（走到石毅旁边）石毅。');
  await say('石毅', '……嗯。');
  await me('这一个，也一起。');
  if (!await fightRetry({ mobs: [['ningchuan', slv(52, -1, 1)]], allies: ['a_shiyi'], title: '血湖 · 双石对宁川', epic: { name: '宁川', sub: '六冠王 · 又来了', seal: '六冠', intro: ['两块骨头，一个罪。', '这一次，你们站在一起。'], phase: '宁川身后升起了一头麒麟的影子——十凶的血，醒了！', low: { who: '石毅', t: '“……你别倒。你倒了，我一个人打不过。”' }, end: ['宁川退了。', '他看了你们很久，什么都没说，消失在了血湖的雾里。'] } })) return false;
  await say('石毅', '（他喘着气，忽然笑了一下）……我们小时候，要是没出那件事，是不是天天这样打架？');
  await me('嗯。你打不过我，回家告状。');
  await say('石毅', '（他愣了一下，然后笑出了声，笑得重瞳都弯了）……可能吧。');
  F().xgNing = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('古林北边有一座完整的<b>仙古古殿</b>。');
}
async function S_xgDian() {
  await nar('守殿傀倒下去的时候，那池仙泉一下子沸了起来。泉水自己飞起来，绕着你转了一圈，然后一头扎进了你的身子里。');
  await cine('你的骨头、你的筋、你的血，被一个纪元前的泉水洗了一遍。<br>你听见泉水里有人在说话——<br>是仙古纪元最后那些人。他们说：<b>“别让它再来一次。”</b>');
  await me('……让什么再来一次？');
  await nar('没有人回答。泉水干了。殿里的画，最后一幅，画着一道城墙，城墙外面，是一片漆黑。');
  learnGongfa('xiangu'); F().xgDian = 1; gainExp(BAL.expNext(C.lv) * 0.4);
  tip('<b>帝冲峰</b>在古殿东边。他在等你。');
}
async function S_dichong() {
  await chapterCard('第十七章', '帝冲', '本体来了');
  await nar('帝冲峰顶刻着一个大大的“帝”字。字下面站着一个人，和那个化身长得一模一样，可眼神不一样——化身的眼神是笑的，他的眼神是冷的。');
  await say('帝冲', '我的化身，是你打碎的。');
  await me('它话太多。');
  await say('帝冲', '（他张开手，化身的碎片从四面八方飞回来，钻进了他的身子）化身见过你，我就等于见过你。你的招，我都知道了。');
  if (!await fightRetry({ mobs: [['dichong', slv(54, -1, 1)]], title: '帝冲峰 · 帝冲', epic: { name: '帝冲', sub: '仙古里最狂的天骄 · 本体', seal: '帝', intro: ['他身上，有化身的影子。', '他知道你所有的招。'], phase: '帝冲把化身的残骸吞了回去——本体和化身合在一起，气势翻了一倍！', low: { who: '齐道临', t: '“这条路只有一个规矩：往前，不回头。”<br>（他知道你所有的招——可他不知道，你下一招是什么。因为你自己也不知道。）' }, end: ['帝冲倒在了那个“帝”字下面。', '他最后看了一眼那个字，说：“……刻得太大了。”'] } }, '帝冲把你打下了峰顶。他说：“你的招，我都知道了。”——那就换新招。')) return false;
  F().dichong = 1; gainExp(BAL.expNext(C.lv) * 0.5);
  tip('<b>仙古深处</b>在帝冲峰东边。出口就在那里。');
}
async function S_xgEnd() {
  await nar('仙古深处是一片很安静的灰。灰的尽头，站着一个老人，背着一把很旧的剑。他好像已经等了你很久。');
  await say('mengtz', '你就是那个从下界走上来的孩子？（他上下看了看你）补天道，孟天正。你在下界的时候，进过补天阁吧？那是我们补天道在下界的一支。');
  await me('进过。还把他们的宝药吃了不少。');
  await say('mengtz', '（他笑了，笑起来眼角全是褶子）好。能吃，是好事。……你听说过帝关吗？');
  await me('没有。');
  await say('mengtz', '九天十地最边上，有一道关。关外面是边荒，边荒外面，是<b>异域</b>。异域的人，想进来。我们，不让。');
  await nar('你想起了仙古古殿里最后那幅画：一道城墙，城墙外面，一片漆黑。');
  await say('mengtz', '帝关缺人。缺年轻人。（他看着你）你愿意去，我带你去。不愿意，我也不怪你。那地方……会死人。');
  const c = await choose(['我去。', '去了，管饭吗？']);
  if (c === 1) await say('mengtz', '（他愣了一下，然后哈哈大笑）管！帝关的饭难吃，可管够！');
  else await say('mengtz', '（他点了点头，没再说话，转身往灰里走去）');
  F().v7end = 1;
  await cine('<div class="cc"><small>第七卷</small><b>仙古</b><i>完</i></div>', 'card');
  tip('出口通向<b>帝关城</b>（仙古入口往东）。境界可以突破到<b>天神境</b>了。');
}
