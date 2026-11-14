/* ================= 第五章 · 第三病栋 ================= */
async function S_prep() { await chapterCard('五', '第三病栋', '第三精神疾病康复中心 · 尖叫指数三星');
  await T_(`^call 高医生
高医生把查到的东西念给你听。
高医生|第三精神疾病康复中心，打着公立旗号的私人医院，四五年前被封停。第三病栋是封闭病区。十间病室，九个病人。`);
  await look('你把病历一份一份往下翻。', [
    ['一号到三号', `高医生|一号，王声龙，天使症候群，年纪最小。二号，一个女人，名字被涂掉了，过分关注自己的容貌。三号是空房间。`],
    ['四号到六号', `高医生|四号，失去一条手臂，幻肢症。五号，许童，认为身边所有人都是同一个人伪装的。六号，韩宝儿，午夜秀场主播——主治医师在病历末尾写：上帝究竟是多想毁掉一个人，才会赋予她这样的美丽。`],
    ['七号到九号', `高医生|七号，认为自己已经死了。八号加固了铁门：熊青，曾是这里的医生，三十岁患上偏侧空间失调症——他觉得完整的人不顺眼。九号，吴非，到封停都没确诊。`],
    ['十号', `高医生|最危险的是十号。没有名字，只有编号。
高医生|……奇怪。十号的病历上，照片那一栏是空的。可夹照片的回形针上，缠着一根很长的头发。
^sfx breath
电话那头安静了几秒。
高医生|我刚才把它拿起来的时候，它是湿的。`]]);
  await T_(`我|九个病人，十间病房。为什么偏偏空着三号？
千纸鹤上写的，就是第三个房间。
` + (F().penQ === 0 ? `笔仙在纸上画了一扇门。门上是一个“三”。——上次你问它爸妈在哪，它答不上来。这一次，它像是在补那道题。` : `笔仙在纸上写了一个“徐”，又涂掉了。然后画了一扇门。`) + (F().bixian === 1 ? `\n它在门旁边写了两个字：加班。` : '') + ``);
  await T_(`尖叫攒够了一次，上回扩建还送了一次。你连抽了两次。
我|总不可能两次都是厉鬼吧。
~spin
@抽奖完成！恭喜你获得特殊道具——白色情人节糖果（张雅好感度达到情有独钟时，有百分之七概率出现）：当你吃掉糖果时，张雅就会出现。
~spin
@抽奖完成！幸运的厉鬼眷顾者，恭喜你获得稀有类特殊道具——哭泣的磁带（中奖概率百分之三）！恭喜你又一次抽中稀有厉鬼！
我|……
磁带里只有哭声。它暂时还不肯理你。`); addItem('candy'); addItem('tape'); if (C.hh.spins > 0) C.hh.spins--;
  await T_(`^hang 高医生
^in 刘刀 13
刘刀|陈老板，秦广背后是平台。你一个人扛不住。我们工作室给你设备、渠道和推荐位，你在直播间挂我们的广告。
刘刀|本来想给你写剧本、布置场景的……你说不用？
我|我的直播不需要剧本。
他留下了一台能别在胸口的高清摄像机，和一个手腕上的小镜头。
^out 刘刀
^prop kn knife 9 5
^prop sl salt 10 5
^prop s2 salt 11 5
^prop ct cat 12 5
你做了准备：菜市场收来的一把老杀猪刀，几袋盐，一只活鸡——老人说这些东西“它们”忌讳。笔仙、小小、白猫，全都带上。
徐婉|老板，你带鸡去干什么？
我|……灵异美食。
@使用随机解锁机会。幸运的厉鬼眷顾者，恭喜你获得第三病栋试炼任务！午夜之前进入第三病栋，存活至天亮。`);
  addItem('g_cam'); swapSkill('knife', 'pigknife'); learnSkill('pigknife', 1); learnSkill('salt'); addItem('saltbag', 3); addItem('drink', 2); addItem('coffee', 1); F().a_kangfu = 1; F().know_ward = 1; toast('从乐园广场打车去「康复中心」'); }
async function S_ward() { setClock(8, '晚上 11 点'); await T_(`^in 刘刀 14
刘刀的人在大门外扎了帐篷。
刘刀|顶不住就往回跑。路上做标记。我的电话设成一键拨号。那地方谁也没进去过。
我|你们晚上待在帐篷里。不管看到什么、听到什么，都不要来找我。
三栋病楼品字排开。第一、第二病栋住普通病人，出口朝阳。第三栋在最里面，背阴。`); liveOn(25000);
  await T_(`>主播手里为什么提着一只鸡／灵异美食博主？／秦广今晚也播，去的是暮阳中学／笑死，他不是说那是布景吗
秦广的直播间有四十万人。他的车刚冲进了暮阳中学外面的荒地——司机说，有东西趴在了挡风玻璃上。
我|我给过他忠告的。`);
  go('kf_b1', true, true);
  const r = await nt('ward'); if (!r) return; }
async function S_laundry() { setClock(9, '午夜 0:30');
  const r = await nt('laundry', { autoF: { k_cage: 0 } }); if (!r) return;
  F().cage = r.f.k_cage != null ? r.f.k_cage : 0;
  await T_(`>主播追着精神病打？？？／这剧情逼真得主播自己看了都害怕／人气十五万`); }
async function S_b3() { setClock(9, '凌晨 1 点');
  const r = await nt('b3', { autoF: { k_sneak: 1 } }); if (!r) return;
  F().sneakNurse = r.f.k_sneak ? 1 : 0; }
async function S_dean() { setClock(10, '凌晨 2 点');
  const r = await nt('dean'); if (!r) return;
  await T_(`^call 刘刀
刘刀|你快看你的直播间！！
三十万。还在涨。
刘刀|不是平台出问题，是秦广出问题了！他带人进了暮阳中学最后一间教室，画面黑了二十五分钟！
>秦广那边黑屏了／都来这边了／所以这个是真的？？？
我|暮阳中学里的不是恶灵。他应该不会有生命危险。……希望他下次别再跟风了。
你把直播间的名字，改成了恐怖屋的地址。`); if (STATE.live) STATE.live.hot = 300000; }
async function S_door() { setClock(10, '凌晨 2:30');
  const r = await nt('door'); if (!r) return;
  if (r.f.k_fail) C.hp = Math.max(1, Math.round(C.hp * .8));
  go('kf_b3_4', true, true); }
async function S_candy() { setClock(10, '凌晨 3 点');
  const r = await nt('candy'); if (!r) return;
  if (itemN('candy')) takeItem('candy');
  await T_(`手机里的声音|陈歌！我找到门楠了！
^call 门楠
我|门楠，你是在这所医院出生的。你在三号病房里长到了三岁。唤醒你身体里最小的那个人格——我要找的是他！
电话那边沉默了很久。
门楠|……他不在我身上。他把自己关进了门里。
^recall past 门楠的记忆
^stage room
^at 小门楠 13
^in 院长 5
^in 陈医生 8
门楠|十几年前，院长和一位姓陈的医生来找过我。
^fx flicker
^out 院长
^out 陈医生
^fx dark
^fx steady
^prop ck wallclock 7 1
门楠|等我再清醒，已经是午夜十二点。
^turn 小门楠 F
门楠|他走之前好像对我说过：如果有一天要去找他，进了门后那个血红色的房间，千万不要开口说话。
^recall off
你正要劝张雅离开。
#r黑发像潮水一样从她身后涌出。／那一袭红衣，直接朝楼下冲了过去。
^out 张雅
我|……这也太刚了。
三号病房的门大开着。她进去了。`); F().inside = 1; go('kf_b3_1', true, true); toast('三号病房的门开着'); }
async function S_inside() { setClock(11, '凌晨 3:30'); liveOff(); musicMode('door');
  const r = await nt('inside', { autoF: { k_spoke: 0 } }); if (!r) return;
  F().spoke = r.f.k_spoke ? 1 : 0; if (F().spoke) C.mp = Math.round(C.mp * .7);
  F().in3 = 1; go('kf_in3', true, true); }
async function S_boy() {
  const r = await nt('boy'); if (!r) return;
  await T_(`男孩身上，也是一件红衣。他笑着，看了你很久。
` + (F().spoke ? `男孩|你开过口。它们都听见了。下次进来，别再喊人的名字。` : `男孩|你一路上没出声。很聪明。上一个这么聪明的人，姓陈。`) + `
男孩|我答应过陈医生，进了门，就一直守在这里。
^recall past 四年前
^stage doorhall
^fx dark
^fx red
^sfx door
^in 院长 7
男孩|直到四年前，门被人从外面打开。
^in 病人 4
^in 病人乙 5
^fx glitch
男孩|院长得了癌症，想进来续命。他带了七个病人。四个被最低级的东西占了身体。剩下的三个，我看不透。
^at 美丽的女人 11
^at 毁容的男人 13
^at 吴非 15
男孩|一个很美的女人。一个毁了容的男人。还有一个，叫吴非。
^zoom 吴非 2.2
^recall off
他说到最后那个名字的时候，牙咬在了一起。
男孩|设局害我睡过去的，就是他。他们出去了。你和他们起过冲突，他们会去找你的。
我|这个世界……到底是什么？
男孩|人心最深处的黑暗。映着恐惧和邪念。它和你们的世界很像，又完全不同——就像白天和黑夜。这里很大。应该还有别的门。
男孩|我只是一道人格，以门后的病栋为躯体。帮我照看外面那个“我”。我替你把门关上。
男孩|我能撑的极限，是一分钟。别磨蹭。
张雅站在离你一尺远的地方。男孩看了她一眼，很快移开了目光。
我|（这孩子……在怕她？）`);
  F().inside = 0; F().in3 = 0; go('kf_b3_1', true, true); musicMode('night'); setClock(11, '凌晨 5 点');
  await T_(`门在你身后合上了。血色从门板上一点一点退掉。它又是一扇普通的木门。
你硬是耗到了天亮。
~phone
@玩家在规定时间内抵达任务场地，并存活至天亮，三星试炼任务完成！全新恐怖场景「第三病栋」已解锁。
直播间被暂时封停了。一个晚上，关注涨了十五万。最高人气，四十多万。
^in 刘刀 13
刘刀|大哥！你不是说精神病院里那些都是你鬼屋的特技演员吗？我跟警察保证过的！
我|里面确实有我鬼屋的员工。只不过你没看见罢了。
^in 李队 16
你坐在警车上，有一种回了家的感觉。甚至有点想睡。
李队|……陈歌。你脑袋里装的是铁吗？
李队|对了。西城那个体育用品管理员，认了。床板底下那些鞋，一双一双都对上了人。
` + (F().vow === 1 ? `我|（我说过替她记着。现在，有人陪我一起记着了。）` : `我|（我答应过她报警。说到，做到了。）`) + (F().greedy ? '' : `
^at 张雅 9
警车的后视镜里，你身边的座位上坐着一个低着头的女孩。
^out 张雅`));
  C.hh.scenes.push('ward'); gainTitle('keeper'); C.fans += 150000; await dayCard('中午 12 点'); go('hh_rest', true, true);
  await cine(['几天后。', '恐怖屋的门缝里，塞进来一张宣传单。', '上面只有一行字，和一个地址：', '“怪谈协会 · 诚邀您讲述自己的故事。”'], '');
  await cine(['第一卷 · 完', ['你相信，这个世界上有鬼吗？', '你不信。可你已经见过太多了。', '你说“应该有吧”。现在你知道答案了。'][F().believe || 0], '——门后的世界、怪谈协会、通灵鬼校，留给下一卷。', '现在，你可以继续经营恐怖屋，夜里回到去过的地方。']); }
/* 主线步骤：id 不能改、不能重名（build.py 检查）。at = 在哪里触发；auto = 走到就开始；night/day = 需要的时段 */
const MAIN = [
  { id: 'q_open', ch: 1, title: '濒临倒闭', goal: '恐怖屋门口', at: 'hh_door', act: '开门营业', run: S_open },
  { id: 'q_attic', ch: 1, title: '三楼的旧箱子', goal: '去三楼找剩下的血浆', at: 'hh_3f', act: '翻箱子', run: S_attic },
  { id: 'q_daily1', ch: 1, title: '另类的日常任务', goal: '夜里去道具间，看看手机说的“日常任务”', at: 'hh_prop', act: '看任务', night: 1, run: S_daily1 },
  { id: 'q_mirror', ch: 1, title: '噩梦级任务', goal: '凌晨，一楼卫生间的镜子前', at: 'hh_wc', act: '点蜡烛', night: 1, run: S_mirror },
  { id: 'q_firstday', ch: 1, title: '医学生被吓哭了', goal: '天亮后到恐怖屋门口', at: 'hh_door', act: '开门', day: 1, run: S_firstday },
  { id: 'q_wheel', ch: 1, title: '转盘', goal: '回员工休息室，试试那个转盘', at: 'hh_rest', act: '抽奖', run: S_wheel },
  { id: 'q_trial', ch: 2, title: '平安公寓', goal: '打车去平安公寓，到公寓院子', at: 'pa_yard', act: '进楼', run: S_trial },
  { id: 'q_wangqi', ch: 2, title: '贴寻人启事的人', goal: '二楼走廊，找王琦问问', at: 'pa_2f', act: '搭话', night: 1, run: S_wangqi },
  { id: 'q_live', ch: 2, title: '凶宅直播', goal: '回 208，想想怎么撑过今晚', at: 'pa_208', act: '打电话', night: 1, run: S_live },
  { id: 'q_3f', ch: 2, title: '三楼', goal: '午夜，去三楼看看', at: 'pa_3f', act: '搜', night: 1, run: S_3f },
  { id: 'q_escape', ch: 2, title: '午夜逃杀', goal: '回二楼走廊，想办法离开', at: 'pa_2f', act: '回房间', night: 1, run: S_escape },
  { id: 'q_hut', ch: 2, title: '真凶', goal: '密林东边有一间木屋', at: 'pa_hut', act: '推门', night: 1, run: S_hut },
  { id: 'q_scene', ch: 2, title: '场景开启', goal: '白天在恐怖屋门口，试试新场景', at: 'hh_door', act: '开放午夜逃杀', day: 1, run: S_scene },
  { id: 'q_water', ch: 2, title: '深水', goal: '夜里，三楼有切东西的声音', at: 'hh_3f', act: '上去看', night: 1, run: S_water },
  { id: 'q_zhangpeng', ch: 2, title: '有人要杀我', goal: '夜里守在员工休息室', at: 'hh_rest', act: '接电话', night: 1, run: S_zhangpeng },
  { id: 'q_date', ch: 3, title: '第一次约会', goal: '打车去西城私立学院', at: 'xc_gate', act: '翻进去', night: 1, run: S_date },
  { id: 'q_dance', ch: 3, title: '不能被提及的名字', goal: '穿过操场，上活动中心四楼的舞蹈室', at: 'xc_dance', act: '找红舞鞋', night: 1, run: S_dance },
  { id: 'q_shoes', ch: 3, title: '红舞鞋', goal: '她指的是办公楼', at: 'xc_office', act: '等李队', night: 1, run: S_shoes },
  { id: 'q_parking', ch: 3, title: '为她建一座乐园', goal: '白天去综合管理处找徐叔', at: 'pk_office', act: '谈场地', day: 1, needAt: 'hh_door', need: () => C.hh.month >= 100 && goodRate() >= 60 ? '' : '扩建条件：当月游客 ' + C.hh.month + '/100，好评率 ' + goodRate() + '%/60%——白天在恐怖屋门口接待游客', run: S_parking },
  { id: 'q_fanyu', ch: 3, title: '特殊的游客', goal: '白天在恐怖屋门口等', at: 'hh_door', act: '午夜售票台响了', day: 1, auto: 1, need: () => sinceBatch() >= 2 ? '' : '午夜售票台：白天在门口再接待 ' + (2 - sinceBatch()) + ' 批游客，特殊的“游客”会混在里面', run: S_fanyu },
  { id: 'q_muyang', ch: 4, title: '雨夜入校', goal: '打车去暮阳中学，进校园', at: 'my_yard', act: '开直播', night: 1, run: S_muyang },
  { id: 'q_pen', ch: 4, title: '送不走的笔仙', goal: '宿舍楼二楼', at: 'my_dorm', act: '握笔', night: 1, run: S_pen },
  { id: 'q_wc', ch: 4, title: '厕所的第五个隔间', goal: '教学楼三楼厕所', at: 'my_wc', act: '开门', night: 1, run: S_wc },
  { id: 'q_office', ch: 4, title: '唯一的目击者', goal: '办公楼数学组', at: 'my_office', act: '翻抽屉', night: 1, run: S_office },
  { id: 'q_last', ch: 4, title: '最后一间教室', goal: '教学楼尽头', at: 'my_last', act: '进去', night: 1, run: S_last },
  { id: 'q_well', ch: 4, title: '深井', goal: '后山', at: 'my_hill', act: '带路', night: 1, run: S_well },
  { id: 'q_qinguang', ch: 4, title: '找上门来了', goal: '白天，恐怖屋门口有人找你', at: 'hh_door', act: '接待', day: 1, auto: 1, need: () => sinceBatch() >= 1 ? '' : '白天在门口接待一批游客——秦广工作室的人混在排队的人里', run: S_qinguang },
  { id: 'q_wish', ch: 4, title: '笔仙的心愿', goal: '去道具间，把那支笔拿出来', at: 'hh_prop', act: '铺纸', run: S_wish },
  { id: 'q_guest', ch: 4, title: '看不见的客人', goal: '夜里在员工休息室', at: 'hh_rest', act: '躺到床下', night: 1, run: S_guest },
  { id: 'q_mennan', ch: 4, title: '第二个特殊游客', goal: '白天在恐怖屋门口', at: 'hh_door', act: '接待', day: 1, auto: 1, need: () => sinceBatch() >= 2 ? '' : '午夜售票台：白天在门口再接待 ' + (2 - sinceBatch()) + ' 批游客，特殊的“游客”会混在里面', run: S_mennan },
  { id: 'q_haiming', ch: 4, title: '三个人的房间', goal: '午夜前到海明公寓 303', at: 'hm_303', act: '关灯', night: 1, run: S_haiming },
  { id: 'q_cat', ch: 4, title: '欢迎来到暮阳中学', goal: '白天去乐园广场', at: 'pk_gate', act: '后门有只猫', day: 1, run: S_cat },
  { id: 'q_prep', ch: 5, title: '九个病人，十间病房', goal: '回员工休息室做准备', at: 'hh_rest', act: '接电话', run: S_prep },
  { id: 'q_ward', ch: 5, title: '精神疾病康复中心', goal: '打车去康复中心大门', at: 'kf_gate', act: '开播', night: 1, run: S_ward },
  { id: 'q_laundry', ch: 5, title: '两碗水', goal: '从二楼连廊去第二病栋', at: 'kf_b2', act: '掀开被子', night: 1, run: S_laundry },
  { id: 'q_b3', ch: 5, title: '谁在扮演医生', goal: '穿过铁门，进第三病栋', at: 'kf_b3', act: '往里走', night: 1, run: S_b3 },
  { id: 'q_dean', ch: 5, title: '三号房的病人', goal: '院长办公室', at: 'kf_dean', act: '拆信', night: 1, run: S_dean },
  { id: 'q_door', ch: 5, title: '门', goal: '下到一楼，三号病房', at: 'kf_b3_1', act: '关门', night: 1, run: S_door },
  { id: 'q_candy', ch: 5, title: '最后一张底牌', goal: '四楼', at: 'kf_b3_4', act: '背靠墙', night: 1, auto: 1, run: S_candy },
  { id: 'q_inside', ch: 5, title: '他一直在门里', goal: '回一楼，走进三号病房的门', at: 'kf_inside', act: '进去', night: 1, auto: 1, run: S_inside },
  { id: 'q_boy', ch: 5, title: '三号病房', goal: '门后的三号病房', at: 'kf_in3', act: '走近那张床', night: 1, auto: 1, run: S_boy }
];
