/* ================= 第三章 · 红舞鞋 ================= */
async function S_date() { await chapterCard('三', '红舞鞋', '西城私立学院 · 第一次约会'); setClock(10, '凌晨 1:40');
  const r = await nt('date'); if (!r) return; }
async function S_dance() { setClock(10, '凌晨 2 点');
  const r = await nt('dance', { autoF: { k_vow: 0 } }); if (!r) return;
  F().vow = r.f.k_vow != null ? r.f.k_vow : 0;
  await T_(`李队|你“又”发现一起命案？`); if (r.kind === 'end') gainExp(30); }
async function S_shoes() { setClock(11, '凌晨 4 点'); let quit = 0; await preOnce('shoes', async () => { await T_(`^call 李队
我|四年前这所学校有个女孩坠楼。不是自杀，是被逼的。逼她的人身高一米八左右，有点驼背，能随便进出舞蹈室。
李队|陈歌，办案不是儿戏。……不过，严格公正是警察的宗旨。你等着。
` + (F().vow === 1 ? `我|（我说过替她记着。现在该让别人也记住了。）` : `我|（我答应过她，会报警。现在报了。）`) + `
^hang 李队`);
  const r = await nt('shoes'); if (!r) { quit = 1; return false; }
  await T_(`~phone
@天亮之前成功找到张雅的红色舞鞋，好感度任务完成。非你莫属！你可以写下想要她去完成的一件事（不能违背张雅的意愿）。`);
  let c = await choose([['“我希望张雅永远听从我的话。”', ''], ['“请帮我除掉镜子里的那个东西。”', '']]);
  if (c === 0) { F().greedy = 1; await T_(`@很抱歉，你违背了张雅的意愿，请更换一个请求。
我|……我就试试。`); }
  await T_(`@请求已记录。
@恭喜你完成稀有级红衣厉鬼好感度任务，本任务为四星级恐怖场景——通灵鬼校支线任务之一！
可解锁场景那一栏里，多了一个血红色的名字。光看那些支线的描述，你的鸡皮疙瘩就起来了。
我|四星……以后再说。`); }); if (quit) return;
  const r2 = await nt('mirrorhall'); if (!r2) return;
  go('hh_hall', true, true);
  gainTitle('dater'); addItem('shoes'); F().shoes = 1; F().tongling = 1; F().wsClosed = 0; await dayCard('上午 10 点'); go('hh_rest', true, true); }
async function S_parking() { await preOnce('parking', async () => {
  await T_(`^in 颜队长 13
市分局来了人。
颜队长|陈歌同志。灭门案的凶手、在逃的张鹏，都是你提供的关键线索。这是奖章。赏金随后到账。
^out 颜队长
老爷子托人带了话：他个人悬赏的五千块，也给你。
徐叔|小陈啊。知道东郊那个虚拟未来乐园吧？全国少见的第四代游乐园，三个月后建成。到时候咱们拿什么跟人家争？现在上上下下都在给自己找后路，就你还傻愣愣地往前冲。
我|徐叔，我想把地下停车场租下来。
徐叔|${F().xushu === 'paid' ? '……你上回还知道先交一点。行，我带你去见罗董。' : '水电费你都没交齐！……算了，我带你去见罗董。成不成看你自己。'}
罗董|小陈，说说看。凭什么租给你？`);
  const pc = await choose([['把这个月的游客数和好评摆在桌上', '当月 ' + C.hh.month + ' 人 · 好评 ' + goodRate() + '%'], ['说起爸妈当年怎么做这座鬼屋', '']]); F().pitch = pc;
  await T_(pc === 0 ? `罗董看了很久那张表。
罗董|这个月比上个月翻了几倍……行。租金头一个月减半。` : `罗董|你爸当年也是这么站在我面前的。一间小屋子，两个人，扮鬼卖票全包。
他摆了摆手。
罗董|租给你。别让他们失望。`);
  if (pc === 0) gainMoney(200, '租金减半');
  await T_(`罗董|地下停车场闲着也是闲着。租给你，租金从门票里扣。
我|（银行卡里的数字，第一次突破了四位数。）`);
  gainMoney(800, '赏金'); addItem('medal'); gainTitle('hero'); F().parking = 1;
  await T_(`^stage parking
^fx dark
你用碳素笔在僵尸复活夜旁边的地板上，圈出一个范围。
~phone
@选定场地，第一次扩建成功。恭喜你获得特殊建筑——午夜售票台（残缺）：有千分之一的概率吸引到特殊的“游客”。它们与众不同，或许能成为你的助力。
@一般难度任务完成：一次免费恐怖转盘机会。
我|扩建就扩建出一截楼梯？`); });
  const r = await nt('stairs'); if (!r) return;
  await T_(`我|三个月。在东郊建成之前，尽可能多地解锁场景。
你顺手把控制台的总闸也接到了手边。`); addItem('ticketbooth'); C.hh.spins++; learnSkill('lights'); learnSkill('paper'); }
async function S_fanyu() { await T_(`^in 姑姑 13
^in 范郁 14
正午。一个女人牵着一个八九岁的男孩，站在恐怖屋门口。
我|小朋友不能进。十二岁以下——
女人面带苦笑，揉了揉男孩的头发。男孩一句话不说，只盯着黑帘子后面。
午夜售票台在柜台下面，轻轻响了一声。
我|（特效触发了？千分之一？艳阳高照的，应该不会是……）
我|……先签免责协议。进去以后跟在我后面。`);
  go('hh_2f', true, true);
  await T_(`^at 姑姑 3
^at 范郁 4
^prop l1 lantern 7 3
^prop l2 lantern 9 3 {"off":1}
^prop wl well 14 5
冥婚。四合院门口点着白灯笼。
^to 范郁 14
男孩突然挣开手跑了进去。他停在院子中间的枯井边，上半身探进了井里。
^turn 范郁 B
姑姑|范郁！
我|你在往井里看什么？井里住着人吗？
^turn 范郁 L
范郁瞥了一眼你的身后，想了很久。
范郁|我在找东西。
^in 徐婉 17
徐婉提着嫁衣的裙摆从厢房迈出来。
^to 范郁 16
男孩凑到她面前，仰着头，死死盯着她看——直到她离开。
^out 徐婉
^to 范郁 14
^recall past 范郁五岁那年
^stage school
^at 范郁的爸爸 7
^at 范郁 9
^at 范郁的妈妈 11
姑姑|小郁的父母都是暮阳中学的老师，先后失踪。
^out 范郁的爸爸
^wait 500
^out 范郁的妈妈
^turn 范郁 L
姑姑|那时候他才五岁。我只能骗他说，爸爸妈妈去了一个叫天堂的地方。
^stage wellyard
^fx dark
^fx fog
^at 范郁 9
^sfx drip
范郁|天堂在井里。
^recall off`);
  const c = await choose([['蹲下来，问他愿不愿意画给你看', ''], ['不打扰他，让他在井边多待一会', '']]); F().fanyu = c;
  await T_(c === 0 ? `他画了一栋黑色的房子。房子里，有很多红色的小人。还有两个黑色的。
他把画送给了你。` : `他趴在井边，很安静。走的时候，他把一张画塞进了你手里：黑色的房子，红色的小人。`);
  await T_(`范郁走之前，扯了扯你的衣角。
^at 张雅 1
^turn 张雅 R
范郁|你后面那个姐姐，为什么一直不说话？
^fx red
你没有回头。
^out 张雅
^fx clear
我|（越是阴森的地方他越兴奋。他不是不害怕——他是喜欢和“它们”待在一起。）
~phone
@不同的选择，结果会全然不同。第一位特殊游客已经离开，你做出了最正确的选择。解锁隐藏试炼任务——暮阳中学！
@该场景为四星恐怖场景通灵鬼校分支场景。暮阳中学试炼任务（尖叫指数二星）：该场景内有四条分支任务，全部体验后仍旧存活，场景解锁成功。
我|要求只是“存活”。在手机看来，活着本身已经是考验了。
天上堆起了厚厚的云。范郁父母失踪的那个夜晚，也是暴雨。`); F().a_muyang = 1; F().know_my = 1; go('hh_door', true, true); addItem('g_raincoat'); }

/* ================= 第四章 · 暮阳中学 ================= */
async function S_muyang() { await chapterCard('四', '暮阳中学', '雨夜 · 四条支线'); setClock(8, '晚上 9 点');
  const r = await nt('muyang'); if (!r) return;
  await T_(`^call 鹤山
鹤山|老大！你快去平台首页看看，有人抢你饭碗！那个秦广，六十万粉的大主播，说下一期也要“夜探凶宅”！
我|他播的都是我玩剩下的。
你开了直播。信号很差，弹幕半天刷不出一条，然后突然涌出一大片。`); liveOn(80);
  await T_(`>来了来了／主播这次又去哪作死／暮阳中学？我表哥以前就是那的，说有一个班……／前面的把话说完啊！`); }
async function S_pen() { setClock(8, '晚上 9:30');
  const r = await nt('pen', { autoF: { k_penQ: 0 } }); if (!r) return;
  F().penQ = r.f.k_penQ != null ? r.f.k_penQ : 0;
  await T_(`>？？？？主播在威胁笔仙／笔：我只是一支笔／人气两万了！`); gainTitle('host'); if (r.kind === 'end') gainExp(30); STATE.live && (STATE.live.hot = Math.max(STATE.live.hot, 21000)); }
async function S_wc() { setClock(8, '晚上 10 点');
  const r = await nt('wc'); if (!r) return;
  await T_(`>主播追着鬼打？？／该害怕的是鬼才对啊／那两个小孩呢`); }
async function S_office() { setClock(8, '晚上 10:30');
  const r = await nt('office'); if (!r) return;
  await T_(`范郁的父亲，范老师，因为“酒后误事”被学校开除。`); if (F().fanyu === 0) gainExp(20); }
async function S_last() { setClock(9, '晚上 11:40');
  const r = await nt('last'); if (!r) return;
  liveOff(); F().my_hill = 1; }
async function S_well() { setClock(10, '凌晨 3 点');
  const r = await nt('well'); if (!r) return;
  await T_(`~phone
@玩家成功体验四条支线任务，并存活至天亮，暮阳中学试炼任务完成！
@试炼任务完成度超过百分之九十，获得隐藏道具——怨念缠绕的圆珠笔（残破）：笔仙并不想搭理你，它朝你翻了个白眼，并把自己藏了起来。
这所学校里滞留的，不是恶灵。包括笔仙在内，它们大多没有害人的心思。
^stage room
^fx clear
^prop pp paper 9 5
回到休息室，你用胶带把那支一拿就碎的圆珠笔缠好了。
我|笔仙笔仙，我知道你对我有怨念。笔我修好了。如果你原谅我，请在纸上画圈。
纸上出现了一个很小、很不情愿的圈。`); addItem('pen'); F().know_my = 1; C.fans += 3000; await dayCard('早上 7 点'); go('hh_rest', true, true); }
async function S_qinguang() { await T_(`^in 中年人 12
^in 费友亮 14
^in 朱佳宁 16
一个矮个中年人，带着两个扛设备的年轻人，站在门口。
中年人|秦广工作室。你最近蹭我们的热度蹭得很猛啊。合则两利：公开道歉，我们给你补偿。要是一意孤行……平台是我们的平台。
我|我没请过水军。还有，暮阳中学不是布景。替我转告他，别去。
中年人|呵。小费，小朱，买票，进去看看他的“真实”。
他们身上藏了摄像头，想拍下“员工殴打游客”的证据。
^out 费友亮
^out 朱佳宁
你把场景选在了三楼。
^in 小小 3
我|小小，今天不用躲。`);
  const win = await fight({ scare: 1, scene: 'ws', mobs: [['feiyl', L(1)], ['zhujn', L(0)]], title: '午夜逃杀 · 秦广工作室', epic: { name: '费友亮', sub: '秦广工作室 · 带着摄像头', seal: '砸场', intro: ['“铁骨铮铮费友亮，这辈子没怕过。”', '他要找的是“动手的员工”。', '可这屋子里，没有员工。'], phase: '不是员工，是鬼——这屋子里没有员工！' } });
  await T_(`^stage wc
朱佳宁|（电话里）它踩在友亮肩膀上了！
^in 中年人 14
^at 费友亮 9
^down 费友亮
中年人冲进来的时候，两个人瘫在厕所里。
中年人|你们敢在鬼屋里袭击游客！
我|你可以去做指纹鉴定。没有人碰过他们双手以外的任何地方。摄像头是你们自己带的，放出来看看？
视频放了五六分钟。全是两个人自己在大呼小叫，连个鬼影都没有。
^fx tv
只有一帧：费友亮的肩膀上，蹲着一个很小的影子，正低头看着镜头。
^fx clear
你按了暂停，把那一帧删了。
${win ? '围观的游客开始排队买票。' : '围观的游客将信将疑，但还是有人买了票。'}
~phone
@幸运的厉鬼眷顾者！恭喜你触发二星恐怖场景暮阳中学隐藏任务——笔仙的心愿！奖励：有一定几率雇佣笔仙，使其成为恐怖屋员工！
你盯着最后一句话看了很久。鬼怪团队成员那一栏，一直是“无”。`); C.hh.total += 8; C.hh.month += 8; }
async function S_wish() { await T_(`^stage room
^prop pp paper 10 5
圆珠笔在纸上写了一个名字：王欣。
^recall past 当年的笔仙
^stage classroom
^fx dark
^fx candle 9
^at 男生 6
^at 女生 8
^at 王欣 10
^at 女生乙 11
^at 男生乙 13
^prop pq paper 9 5
当年和它一起玩笔仙的，是五个学生。
^fx flicker
^sfx chalk
^out 女生乙
^out 男生乙
笔自己写完了最后一个字。有两个人被吓出了毛病。
^zoom 王欣 2
它想知道，她后来怎么样了。
^recall off
你打给李队，又按他说的在领养登记网站上找了半个小时。收养她的人，姓顾。给她做过治疗的医生，姓高。
^call 高医生
高医生|我是高汝雪的父亲。她回来以后，三天没敢关灯睡觉。……你想问王欣？
高医生|当年那五个孩子，现在只有一个还活着。她过得很好，考上了大学，已经不记得那所学校了。
^hang 高医生
笔停在纸上，很久没有动。`);
  const c = await choose([['“她不记得了，是好事。你也可以不用记着了。”', ''], ['“你要是没地方去，我这里缺人。包吃包住，没有工资。”', '']]); F().bixian = c;
  await T_(c === 0 ? `笔画了一个圈。很圆。` : `笔在纸上戳了一个洞。然后，在洞旁边画了一个圈。`);
  await T_(`@隐藏任务——笔仙的心愿已完成！
@幸运的厉鬼眷顾者，恭喜你成功雇佣特殊种类厉鬼——笔仙！
你把它的资料看了好几遍。它能负责一个小场景，还能在一定范围内“预知”。
我|万事开头难。以后会有更多新员工的。
@激活隐藏任务下一环节：为二十四个名字，制作出寄托残念的人偶。`); gainPet('bixian'); petAff('bixian', 20); if (c === 1) petAff('bixian', 12); }
async function S_guest() { setClock(9, '午夜 0 点');
  const r = await nt('guest'); if (!r) return; if (r.f.k_saw) F().sawRuoyu = 1;
  await T_(`^stage room
^prop ph photo 10 5
你从上锁的抽屉里取出相册。第一页，一家三口。
还有一张：父亲指着恐怖屋在向你炫耀，母亲半蹲在地上，伸手轻轻抚摸着——空气。
我|……这老两口对鬼的态度也太好了。摊上这样的父母，何愁不被厉鬼眷顾。
千纸鹤放了很久了。你把它拆开。沾着一小片血污的白纸上，写着九个字：
#第三病栋第三个房间
字迹很像家里人的。没头没尾，只有一个地点。
~phone
@恭喜你完成噩梦级别日常任务，奖励——初级天赋技能：活偶。
@三次噩梦任务完成，日常任务中的噩梦级别任务已改为随机刷新。你获得了一次随机解锁试炼任务的机会。
我|第三病栋。手机自带的唯一一个三星场景。……现在去，是送死。先留着。`); learnTalent('huoou'); learnSkill('livedoll'); F().note = 1; }
async function S_mennan() { await T_(`^in 门楠 13
午夜售票台又响了。
门口站着一个年轻人，头发是湿的。他说话的时候，总忍不住去摸自己的后脑。
门楠|我不是来玩的。我……一直做同一个梦。梦里有个人，离我越来越近。昨晚，他已经站到我床边了。
门楠|我每天要洗很多次头。总觉得头发上有东西。
^fx glitch
他说话的时候，你看了一眼柜台的玻璃。玻璃里的门楠，嘴型和他说的话，对不上。` + (C.pets.bixian ? `
^prop pp paper 10 5
口袋里的圆珠笔动了一下。你摸出来，它在你掌心的纸上写了两个字：` + (F().bixian === 1 ? `有。加班吗？` : `有的。`) + `
^del pp` : '') + `
我|你还记得梦里是什么地方吗？
`);
  const r = await nt('dream'); if (!r) return;
  await T_(`门楠|我小时候……我曾听他们说过一个词，“第三病栋”。我不知道那是哪。`);
  const c = await choose([['“今晚我去你住的地方看看。”', ''], ['“我认识一位心理医生，一起去。”', '高医生']]); F().mennan = c;
  await T_(`~phone
@第二位特殊游客已经离开，成功获得任务信息！解锁隐藏试炼任务——三个人的房间（尖叫指数一星）：午夜之前抵达海明公寓，找出特殊游客的病因。
@本任务与三星恐怖场景第三病栋存在关联。
我|任务的名字，本身就是提示。门楠算一个，梦里的人算一个。第三个……
下午四点，你把钥匙交给徐婉，钻进了工具间。`); F().a_haiming = 1; F().know_room = 1; }
async function S_haiming() { setClock(8, '晚上 11 点');
  const r = await nt('haiming'); if (!r) return;
  await T_(`门楠|我……想起来一点。我是在一所医院里出生的。
~phone
@一星试炼任务完成！全新恐怖场景「三个人的房间」已解锁。隐藏道具——自知力钥匙（怨念值十三）：当你出现类似的症状时，这把钥匙可以帮你一次。
我|“当我出现类似的症状时”？这是在婉转地说我也有病？
从那个地方跑出来的东西，知道“红衣”。也就是说，第三病栋里，很可能有和张雅同级的东西。`); addItem('key'); C.hh.scenes.push('room'); await dayCard('早上 8 点'); go('hh_rest', true, true); }
async function S_cat() { await preOnce('cat', async () => { await T_(`^stage park
^prop bx box 12 5
^prop ct cat 11 5
乐园后门的垃圾桶边，一只白猫守着一个纸箱。箱子里的小猫，已经不动了。
它不让任何人靠近。你蹲了二十分钟。
我|你的孩子已经不在了。守着也改变不了什么。
^del bx
宠物店的店长赵雯给它处理了伤口。它一只眼睛蓝，一只眼睛黄。
我|就叫你白虎。
徐婉|你给一只猫取名叫白虎？……行吧，你开心就好。
它不认这个名字。但它跟着你回了休息室。
^stage room
^prop ct cat 7 5
^at 小小 13
进门的时候，它对着床底下的小小看了一眼，没理。
我|（好歹也是个厉鬼，不至于弱到被猫无视吧。）
^del ct
^out 小小
然后它耳朵竖了起来，冲出去，在一楼卫生间的门板上留下了一道道刻痕——就是你锁上的那个隔间。
我|它看得见。`); gainPet('baimao'); petAff('baimao', 20); addItem('g_coat'); });
  const r = await nt('doll24'); if (!r) return; const ok = true;
  await T_(`~phone
@暮阳中学隐藏任务——为二十四个名字制作躯体完成！奖励：回归者的信任，你可以通过手机简单操控它们。
^stage classroom
^prop d1 doll 8 5 {"col":"#3e4e6e"}
^prop d2 doll 11 5 {"col":"#3e4e6e"}
^prop d3 doll 14 5 {"col":"#3e4e6e"}
暮阳中学没有出口，只有一个入口。你把二十四个校牌藏在各个角落，在床板背面用血浆写了新规则：
#二十分钟内找到二十个校牌，通关。／全部找到：退票，另奖现金两万。／只能一个人进。
我|想赢奖金，就按规矩来：先通关星级低的场景，才能挑战新的。
^stage clear
开业第一天。
王海龙|两万是吧？老板，说话算数？
王文龙|哥，要不我们五个一起进，找齐了给五千也行……`);
  gainPet('canmian'); petAff('canmian', 15); if (ok) petAff('canmian', 15); C.hh.scenes.push('my');
  const win = await fight({ scare: 1, scene: 'my', mobs: [['wanghl', L(1)], ['wangwl', L(0)]], title: '暮阳中学 · 两万元', epic: { name: '王海龙', sub: '开业第一天 · 奖金两万', seal: '挑战', intro: ['教室中间，一个人偶的领口上挂着校牌。', '想拿到，得从所有人偶中间穿过去。', '“一开局就是地狱难度？”'], phase: '龙哥没哭！是这屋里灰大！' } });
  await T_(`${win ? '龙哥是哭着出来的。' : '龙哥撑到了最后，一个校牌都没拿全。'}
^recall past 王声龙小时候
^stage oldward
^fx dark
^at 瘦长怪物 9
^at 王声龙 9
王海龙|老板……我弟弟王声龙，小时候住过院。
^sfx creak
^zoom 瘦长怪物 1.35
王海龙|出来以后，他说有个“很高的人”一直踩在他肩膀上，跟他玩一个游戏，叫“看谁先开口说话”。
^fx pulse
病床边的孩子两只手捂着嘴，一整夜没敢出声。
^recall off
王海龙|他住的那个地方，叫第三封闭病区。也有人叫它——第三病栋。
所有的线索，都指向同一个地方。`); C.hh.total += 12; C.hh.month += 12; }
