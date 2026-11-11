/* 话：对手的台词、战斗里的插话、路过听到的闲话、💬 闲聊。闲话都带地点和剧情区间（build.py 检查），绝不超出当前进度 */
const SAY = {
  stu: { open: ['就这？', '我的鲲都八十级了，来这干嘛。'], low: ['等、等一下，那个纸人刚才是不是动了？'], die: ['妈妈——！'] }, skeptic: { open: ['唯物主义者无所畏惧。'], low: ['热胀冷缩……一定是热胀冷缩……'], die: ['我信了我信了！'] },
  couple: { open: ['别怕，有我在。'], low: ['你别掐我啊！'], die: ['你先跑还是我先跑？！'] }, med: { open: ['真的尸体我都见过，还怕这个？'], low: ['这做工……不像道具。'], die: ['学姐救我！'] },
  tough: { open: ['就这？我一拳一个。'], low: ['……谁关的灯。'], die: ['让开让开让我先出去！'] }, vlog: { open: ['家人们，今天带你们拆穿一家网红鬼屋。'], low: ['家人们……摄像头里多了个人。'], die: ['下播！下播！'] },
  heshan: { open: ['学姐你走前面。'], low: ['铜鸡流血，纸人睁眼……'], die: ['纸人睁眼了——！'] }, gaoru: { open: ['白绫离地一米五，吊不死人。细节不错，可惜。'], low: ['明知道都是假的……我为什么在害怕？'], die: ['……（她蹲在地上，哭了）'] },
  feiyl: { open: ['铁骨铮铮费友亮，这辈子没怕过。'], low: ['小朱，我肩膀上是不是有东西？'], die: ['不是员工——是鬼——'] }, zhujn: { open: ['友亮，镜头开着呢。'], die: ['喂？喂？！快进来！'] },
  wanghl: { open: ['两万块，哥今天拿定了。'], low: ['……这些人偶刚才是朝这边的吗？'], die: ['龙哥没哭！是灰大！'] }, wangwl: { open: ['哥，我跟着你。'], die: ['哥你别丢下我！'] },
  tattoo: { open: ['新来的，你看见什么了？'], low: ['妈的，这小子下手真黑。'], die: ['（他抱着头蹲了下去）'] }, landlord: { open: ['我说过，午夜以后别出门！'], low: ['别让他跑了！'], die: ['（菜刀掉在地上）'] },
  wangqi: { open: ['你不该翻床底下的。'], low: ['她为什么总能找到我？！'], die: ['……救我。'] }, zhangpeng: { open: ['就是你报的警。'], low: ['求求你放我走吧！'], die: ['别过来！别过来！'] },
  aunt: { open: ['我是来救你的。'], low: ['你根本不知道那天发生了什么！'], die: ['……小郁怎么办。'] }, onearm: { open: ['（他在挠那条不存在的胳膊）'], die: ['我的手——我另一只手——'] },
  xiong: { open: ['你长得不对。多了半边。'], low: ['你到底是病人，还是我是病人？！'], die: ['（他歪着头，终于安静了）'] }, drunk: { open: ['看什么看！'], die: ['呕——'] }, dog: { open: ['（低吼）'], die: ['（夹着尾巴跑了）'] },
  remnant: { open: ['（有人在你耳边重复同一句话）'], die: ['（那句话终于说完了）'] }, chairgirl: { open: ['（坐下。）'], low: ['（哀求的脸，一点点变成怨毒）'], die: ['（椅子碎了）'] },
  mirror: { open: ['（镜子里的你，没有跟着你动）'], low: ['（切割声越来越急）'], die: ['（一地碎镜子，每一片里都是空的）'] }, redshadow: { open: ['（它在一间一间地找）'], die: ['（红影淡了下去）'] },
  twoface: { open: ['（“闭嘴！”“你才闭嘴！”）'], low: ['（“别把红衣引来！”）'], die: ['（镜面晃了几下，平了）'] }, nurse: { open: ['（她在对名字）'], low: ['（“该吃药了。”）'], die: ['（白大褂落在地上）'] },
  tallone: { open: ['（它踩着什么人的肩膀）'], low: ['（白布下的脸一起张开了嘴）'], die: ['（黑色的雪）'] }, dean: { open: ['很多年没有活人进来过了。'], low: ['你把魔鬼吵醒了！'], die: ['魔……鬼……'] }, doorhand: { open: ['（撞门声）'], die: ['（手缩了回去）'] }
};
const HERO_SAY = { visitor: ['祝你们玩得愉快。', '实在害怕，就对着监控喊。', '门票不退。'], human: ['不好意思，砸歪了。', '我只是个开鬼屋的。', '你知道我每天琢磨的是什么吗？怎么吓人。'], ghost: ['有话好好说……算了。', '你吓人的手法太老了。', '有没有兴趣来我这上班？包住。'] };
const PET_SAY = { wan: ['老板，往这边引！', '这个妆热死了。'], xiaoxiao: ['（衣角被拽了一下）', '（床底下传来咯咯的笑）'], bixian: ['（纸上多了一个白眼）', '（笔写：加钱。）'], baimao: ['（它看了你一眼，像在看累赘）', '喵。'], canmian: ['（二十四个人同时翻了一页书）'], zhangya: ['（黑发从你肩上滑过去）', '……'] };
const WIN_SAY = { d: ['欢迎下次再来。', '大众点评记得给好评。', '……刚才那声尖叫超过七十分贝了。'], n: ['活着。还活着。', '你把锤子在裤子上擦了擦。', '布偶还在领口。'] };
function sayLine(B, key, txt, foe) { blog(B, (key === 'hero' ? '陈歌' : unitByKey(B, key).n) + '：' + txt, 'say'); fxe(B, { t: 'say', who: key, txt, foe }); }
function sayOk(B) { if (B.sayTurn !== B.turn) { B.sayTurn = B.turn; B.sayN = 0; } return B.sayN++ < 2; } /* 每回合最多两句，不刷屏 */
function battleSay(B, u, kind) { const S = SAY[u.id]; if (!S || !S[kind]) return; if (kind !== 'die' && !sayOk(B)) return; sayLine(B, u.key, pickFresh('say_' + u.id + kind, S[kind]), 1); }
function battleOpenSay(B) { B.foes.slice(0, 2).forEach((f, i) => { const S = SAY[f.id]; if (!S || !S.open) return; const t = pickFresh('say_' + f.id + 'open', S.open); blog(B, f.n + '：' + t, 'say'); setTimeout(() => { if (STATE.battle === B) fxSay(f.key, t, 1); }, 500 + i * 1500); }); }
function foeKind(B) { return B.scare ? 'visitor' : (alive(B.foes)[0] || B.foes[0]).k; }
function banterAct(B, k) { if (chance(.2) && sayOk(B)) sayLine(B, 'hero', pickFresh('hs_' + foeKind(B), HERO_SAY[foeKind(B)])); }
function banterRound(B) { for (const f of alive(B.foes)) if (!f.saidLow && f.hp < f.mhp * .35) { f.saidLow = 1; battleSay(B, f, 'low'); break; } if (B.pet && B.pet.hp > 0 && PET_SAY[B.pet.id] && chance(.18) && sayOk(B)) sayLine(B, 'pet', pickFresh('ps_' + B.pet.id, PET_SAY[B.pet.id])); }
function battleWinSay(B) { blog(B, '陈歌：' + pickFresh('ws_' + (B.scare ? 'd' : 'n'), WIN_SAY[B.scare ? 'd' : 'n']), 'say'); }
async function candyScene(B) { if (C.f.greedy) { await cine(['她还记得。', '你第一次写下的请求，是让她永远听你的话。'], 'red'); if (B) { B.hero.hp = Math.max(1, Math.round(B.hero.hp - B.hero.mhp * .15)); blog(B, '黑发勒得你喘不过气（体力 -15%）。她来了，但没那么温柔。', 'warn'); } } sfx('heart'); await cine(['你把那颗糖放进了嘴里。', '甜的。', '然后是无穷的怨念，和阴冷——像被人从背后抱住。', '黑色的长发如同浪潮拍在墙上。'], 'red'); await scare('red'); }

/* 路过听到的话。at = 地点；from（含）～ to（不含）= 剧情区间；q_end = 一直有效 */
const CHATTER = [
  { at: 'hh_door', from: 'q_open', to: 'q_firstday', who: '游客', t: '“恐怖屋？就门口那个丑娃娃吓人。”' },
  { at: 'hh_door', from: 'q_wheel', to: 'q_end', who: '游客', t: '“就是这家！那个镜子视频就是这的老板拍的。”' },
  { at: 'hh_door', from: 'q_scene', to: 'q_end', who: '游客', t: '“听说有医学生被抬出来？真的假的。”' },
  { at: 'hh_door', from: 'q_parking', to: 'q_end', who: '游客', t: '“老板上过新闻，抓过杀人犯的。”“那他这鬼屋……不会是真的吧？”' },
  { at: 'hh_door', from: 'q_cat', to: 'q_end', who: '游客', t: '“找齐二十个校牌给两万！”“你去。”“你去。”' },
  { at: 'hh_door', from: 'q_firstday', to: 'q_end', who: 'xuwan', t: '“老板，今天排队的人比昨天多。”' },
  { at: 'hh_door', from: 'q_scene', to: 'q_end', who: 'xuwan', t: '“老板，三楼今天又自己变干净了。你半夜起来打扫的？”' },
  { at: 'hh_door', from: 'q_cat', to: 'q_end', who: 'xuwan', t: '“白虎今天又不理我。”' },
  { at: 'pk_gate', from: 'q_open', to: 'q_firstday', who: '游客', t: '“鬼屋？不去。上次去了一圈，笑出来了。”' },
  { at: 'pk_gate', from: 'q_firstday', to: 'q_end', who: '游客', t: '旋转木马的工作人员：“小陈那边大清早就排长队，邪门。”' },
  { at: 'pk_gate', from: 'q_parking', to: 'q_end', who: '游客', t: '“东郊那个虚拟未来乐园快建好了。”“那这里呢？”没人接话。' },
  { at: 'pk_gate', from: 'q_scene', to: 'q_end', who: 'heshan', t: '“老大！学姐让我问你……算了她没让我问。”' },
  { at: 'pk_gate', from: 'q_well', to: 'q_end', who: 'heshan', t: '“老大，秦广的粉丝在你评论区吵起来了，我帮你骂回去了三百条。”' },
  { at: 'pk_gate', from: 'q_prep', to: 'q_end', who: 'heshan', t: '“学姐她爸说你是他见过心理素质最好的……病例。”' },
  { at: 'pk_office', from: 'q_open', to: 'q_parking', who: 'xushu', t: '“水电费。”' },
  { at: 'pk_office', from: 'q_parking', to: 'q_end', who: 'xushu', t: '“这个月你那边的营业额……我还以为报表印错了。”' },
  { at: 'pk_office', from: 'q_parking', to: 'q_end', who: 'luo', t: '“小陈，地下那块地你放心用。……晚上别待太晚。”' },
  { at: 'pk_office', from: 'q_guest', to: 'q_end', who: 'luo', t: '罗董看着你口袋里露出的手链，很久没有说话。' },
  { at: 'pk_shop', from: 'q_open', to: 'q_end', who: 'shop', t: '“又买面包？小陈，吃点好的。”' },
  { at: 'pk_shop', from: 'q_hut', to: 'q_end', who: 'shop', t: '“电视上那个打码的是你吧？我认得那件衣服。”' },
  { at: 'pk_shop', from: 'q_prep', to: 'q_end', who: 'shop', t: '“盐？你一次买这么多盐干什么？”' },
  { at: 'hh_hall', from: 'q_mirror', to: 'q_shoes', who: '', t: '走廊尽头有很轻的切割声。你停下，它也停下。', night: 1 },
  { at: 'hh_hall', from: 'q_scene', to: 'q_end', who: '', t: '一个小小的影子从人偶后面探出半个头，又缩了回去。', night: 1 },
  { at: 'hh_rest', from: 'q_wheel', to: 'q_end', who: '', t: '地上你的影子，比你本人慢了半拍。' },
  { at: 'hh_rest', from: 'q_cat', to: 'q_end', who: '', t: '白猫占了你的枕头。小小躲在床底下，不敢出来。' },
  { at: 'hh_wc', from: 'q_fanyu', to: 'q_end', who: '', t: '镜子里，最里面那个隔间的门是红色的。你回头，是白色的。', night: 1 },
  { at: 'hh_wc', from: 'q_cat', to: 'q_end', who: '', t: '隔间门板上有几道很深的抓痕。是猫留下的。' },
  { at: 'hh_3f', from: 'q_scene', to: 'q_end', who: '', t: '四个布偶并排坐着。最小的那个，今天换了个位置。' },
  { at: 'hh_2f', from: 'q_firstday', to: 'q_end', who: '', t: '纸人的妆是你画的。画得太好了，你自己都不太想看。' },
  { at: 'hh_prop', from: 'q_wish', to: 'q_end', who: '', t: '那支缠着胶带的圆珠笔，在纸上画了一个小人，头上写着“老板”，然后打了个叉。' },
  { at: 'hh_park', from: 'q_guest', to: 'q_end', who: '', t: '墙角那个小洞，你没有堵上。' },
  { at: 'hh_ctrl', from: 'q_firstday', to: 'q_end', who: '', t: '声控台的曲库里，《黑色星期五》排在第一个。你把它往下拖了拖。' },
  { at: 'pa_yard', from: 'q_scene', to: 'q_end', who: '', t: '警戒线还没撤。铁门边那张寻人启事，被雨泡烂了。' },
  { at: 'pa_3f', from: 'q_scene', to: 'q_end', who: '', t: '走廊尽头的墙被凿开了。里面是空的。' },
  { at: 'xc_dance', from: 'q_parking', to: 'q_end', who: '', t: '镜子前的三把椅子不见了。地上有一颗糖，包装纸上写着字。你没有捡。', night: 1 },
  { at: 'my_last', from: 'q_cat', to: 'q_end', who: '', t: '教室空了。黑板上有人用粉笔写了两个字：谢谢。' },
  { at: 'my_yard', from: 'q_prep', to: 'q_end', who: '', t: '荒地里停着一辆陷进泥里的直播车，车门开着。' },
  { at: 'kf_gate', from: 'q_boy', to: 'q_end', who: '', t: '封条换了新的。第三栋最里面的那扇窗，没有再亮过。' },
  { at: 'hh_door', from: 'q_firstday', to: 'q_hut', who: '游客', t: '“那个吓哭法医的鬼屋就是这？”“看着挺普通啊。”' },
  { at: 'hh_door', from: 'q_hut', to: 'q_parking', who: '游客', t: '“早间新闻那个抓凶手的，是不是这家老板？”' },
  { at: 'hh_door', from: 'q_scene', to: 'q_end', who: '游客', t: '“午夜逃杀里有个小孩跟着我。”“哪有小孩？”“……对啊，哪有小孩。”' },
  { at: 'hh_door', from: 'q_parking', to: 'q_end', who: '游客', t: '“地下也是他家的了？那以后得排多久。”' },
  { at: 'hh_door', from: 'q_qinguang', to: 'q_end', who: '游客', t: '“秦广那期视频我看了，两个人瘫在厕所里，笑死。”' },
  { at: 'hh_door', from: 'q_boy', to: 'q_end', who: '游客', t: '“精神病院那场直播你看了吗？四十万人在线。”“我看到一半关了，不敢看。”' },
  { at: 'hh_door', from: 'q_parking', to: 'q_end', who: 'xuwan', t: '“老板，售票台那个旧机器，晚上自己会响。我是不是该报修？”' },
  { at: 'hh_door', from: 'q_boy', to: 'q_end', who: 'xuwan', t: '“老板你那晚到底去哪了？直播一黑，我一整夜没睡。”' },
  { at: 'pk_gate', from: 'q_mirror', to: 'q_firstday', who: '游客', t: '“昨晚刷到一个镜子视频，吓得我手机都扔了。”' },
  { at: 'pk_gate', from: 'q_hut', to: 'q_end', who: '游客', t: '旋转木马的小哥：“小陈，你那晚真一个人去了凶宅？”' },
  { at: 'pk_gate', from: 'q_cat', to: 'q_end', who: '游客', t: '“后门那只白猫，最近不在垃圾桶边上了。”' },
  { at: 'pk_gate', from: 'q_mennan', to: 'q_end', who: 'heshan', t: '“老大，学姐说她爸最近总在看一个病人的档案，看到半夜。”' },
  { at: 'pk_gate', from: 'q_boy', to: 'q_end', who: 'heshan', t: '“老大！你上热搜了！……不过是被封的那个热搜。”' },
  { at: 'pk_office', from: 'q_scene', to: 'q_parking', who: 'xushu', t: '“你上了电视，管理层都知道你了。……水电费还是要交。”' },
  { at: 'pk_office', from: 'q_cat', to: 'q_end', who: 'xushu', t: '“东郊那边又挖了两个人。你那儿人手够吗？”' },
  { at: 'pk_office', from: 'q_boy', to: 'q_end', who: 'luo', t: '“小陈，听说你那晚去了城郊的医院。你父母……当年也去过那里。”' },
  { at: 'pk_shop', from: 'q_scene', to: 'q_end', who: 'shop', t: '“你那个员工小姑娘，每天来买两瓶饮料，一瓶说是给‘小妹妹’的。”' },
  { at: 'pk_shop', from: 'q_muyang', to: 'q_end', who: 'shop', t: '“雨衣？又要去哪？……算了，别告诉我。”' },
  { at: 'pk_shop', from: 'q_boy', to: 'q_end', who: 'shop', t: '“直播那晚我一直开着电视等你。没事就好，没事就好。”' },
  { at: 'hh_hall', from: 'q_water', to: 'q_end', who: '', t: '你路过员工通道。木板钉过的地方有几个新的指甲印。', night: 1 },
  { at: 'hh_hall', from: 'q_cat', to: 'q_end', who: '', t: '白猫蹲在走廊中间，盯着楼梯口，尾巴一下一下地扫。', night: 1 },
  { at: 'hh_rest', from: 'q_water', to: 'q_shoes', who: '', t: '墙上那个用笔记下的数字，又小了一个。' },
  { at: 'hh_rest', from: 'q_wish', to: 'q_end', who: '', t: '桌上的白纸上多了一行歪歪扭扭的字：老板，涨工资。' },
  { at: 'hh_ctrl', from: 'q_parking', to: 'q_end', who: '', t: '控制台的总闸接到了手边。你拉了一下，整栋楼黑了，监控里有人尖叫。是徐婉。' },
  { at: 'hh_prop', from: 'q_cat', to: 'q_end', who: '', t: '做人偶剩下的二十四块名牌边角料，你没舍得扔。' },
  { at: 'hh_wc', from: 'q_mirror', to: 'q_shoes', who: '', t: '镜子是新换的。你还是不太想照。' },
  { at: 'hh_2f', from: 'q_zhangpeng', to: 'q_end', who: '', t: '《嫁衣》在循环。你把音量调低了一格，还是觉得后背发凉。' },
  { at: 'hh_park', from: 'q_parking', to: 'q_end', who: '', t: '新扩出来的楼梯往下延伸了一截，尽头是一堵白墙。' },
  { at: 'pa_208', from: 'q_scene', to: 'q_end', who: '', t: '你住过的 208 门上贴了封条。锁眼里还卡着一根头发。' },
  { at: 'pa_hut', from: 'q_scene', to: 'q_end', who: '', t: '木屋被搬空了。地上只剩一块干掉的泥印子，像一个人的形状。' },
  { at: 'xc_gate', from: 'q_shoes', to: 'q_end', who: '', t: '校门的锁链换了一根新的。有人在铁门上挂了一双芭蕾舞鞋的钥匙扣。' },
  { at: 'xc_office', from: 'q_parking', to: 'q_end', who: '', t: '器材室的床板被拆走了。墙角用粉笔写着一行很小的字：对不起。' },
  { at: 'my_yard', from: 'q_well', to: 'q_prep', who: '', t: '标牌被人重新立起来了。“危楼，禁止入内”。' },
  { at: 'my_dorm', from: 'q_wish', to: 'q_end', who: '', t: '四把椅子还在。纸上什么都没写。' },
  { at: 'my_wc', from: 'q_cat', to: 'q_end', who: '', t: '第六个隔间的隔板换掉了。新的隔板上，没有一只眼睛。' },
  { at: 'hm_303', from: 'q_cat', to: 'q_end', who: '', t: '303 贴出了招租。房租比别的房间便宜一半。' },
  { at: 'hm_3f', from: 'q_cat', to: 'q_end', who: '', t: '301 的大叔看见你，把电视声音关小了。“那孩子好点了吗？”' },
  { at: 'kf_dean', from: 'q_boy', to: 'q_end', who: '', t: '抽屉空了。那四封信你带走了，夹在相册里。' },
  { at: 'kf_b3_1', from: 'q_boy', to: 'q_end', who: '', t: '三号病房的门是普通的木门。你还是没有伸手去推。' }
];
function qCur() { return C.q === 'q_end' ? MAIN.length : qIdx(C.q); }
function inRange(o) { const c = qCur(), a = o.from ? qIdx(o.from) : 0, b = !o.to || o.to === 'q_end' ? 1e9 : qIdx(o.to); return c >= a && c < b; }
function chatterFor(loc, who) { return CHATTER.filter(c => c.at === loc && inRange(c) && (!c.night || isNight()) && (who === undefined || c.who === who) && !(isNight() && (c.who === '游客' || c.who === 'xuwan' || c.who === 'heshan'))); }
function npcOnArrive() { if (!chance(.4)) return; const fresh = chatterFor(C.loc).filter(c => !C.seen['c_' + c.t.slice(0, 12)]); if (!fresh.length) return; const c = pick(fresh); C.seen['c_' + c.t.slice(0, 12)] = 1; logLine((NPCS[c.who] ? NPCS[c.who].name + '：' : '') + c.t); }
function npcsHere() { const out = []; for (const k in NPCS) { const N = NPCS[k]; if (N.at !== C.loc || !inRange(N)) continue; if (isNight() && k !== 'shop') continue; out.push(k); } return out; }
/* 💬 闲聊：每段只有一次，带一个选项 */
const TALKS = [
  { id: 'tk_wan1', npc: 'xuwan', from: 'q_wheel', to: 'q_end', s: `徐婉|老板，你那天给我化的妆……能再画一次吗？我想拍张照。
我|那是殓容。
徐婉|我知道。可是真的很好看。`, ch: [['“下次。给你画个活人的。”', '徐婉|说话算数！', 6], ['“画完你三天不敢照镜子。”', '徐婉|……那算了。不对，还是画。', 3]] },
  { id: 'tk_wan2', npc: 'xuwan', from: 'q_scene', to: 'q_end', s: `徐婉|老板，三楼那个场景里，是不是还有别的员工？我老听见小孩笑。
我|你听错了。`, ch: [['“……是新来的。很怕生。”', '徐婉|哦！那我下次给她带糖。\n床底下，有什么东西高兴地滚了一圈。', 5], ['“别乱想，好好扮你的鬼。”', '徐婉|我扮的是鬼，可我怕鬼啊老板！', 2]] },
  { id: 'tk_wan3', npc: 'xuwan', from: 'q_parking', to: 'q_end', s: `徐婉|小魏那封辞职信，你一直没批。
我|他想回来随时可以回来。${''}`, ch: [['“你当时为什么没走？”', '徐婉|……因为老板你还没发我上个月工资啊。\n她笑了，没说实话。', 6], ['“这个月开始，给你涨工资。”', '徐婉|真的？！老板万岁！', 8]] },
  { id: 'tk_xu1', npc: 'xushu', from: 'q_attic', to: 'q_parking', s: `徐叔|你爸妈刚来乐园的时候，就一间小屋子。扮鬼、卖票、修道具，全是两个人。
徐叔|他们对这地方是有感情的。你也是。我知道。`, ch: [['“他们会回来的。”', '徐叔|……嗯。回来了让他们先把水电费结了。'], ['“徐叔，谢谢你一直帮我拖着。”', '徐叔|少来这套。']] },
  { id: 'tk_xu2', npc: 'xushu', from: 'q_parking', to: 'q_end', s: `徐叔|东郊那边开出了三倍工资挖人。咱们这已经走了四个了。
我|你呢？`, ch: [['“你要走，我不怪你。”', '徐叔|我走了谁给你看大门？……再说了，我在这二十年了。'], ['“等我把这里做成主题乐园，你当园长。”', '徐叔|你小子……口气越来越像你爸了。']] },
  { id: 'tk_he1', npc: 'heshan', from: 'q_scene', to: 'q_end', s: `鹤山|老大，我跟你说实话。那天我晕过去以前，看见那个纸人娃娃对我笑了。
鹤山|是机关吧？是吧？`, ch: [['“是机关。”', '鹤山|我就说嘛！……那它为什么第二天换了个位置？\n你没有回答。'], ['“你猜。”', '鹤山|老大你别这样！']] },
  { id: 'tk_he2', npc: 'heshan', from: 'q_well', to: 'q_end', s: `鹤山|学姐的微信我要到了。
鹤山|是她爸给的。让我转给你。说有问题随时问。
我|……那是高医生的微信。`, ch: [['“谢了。请你吃饭。”', '鹤山|顺便带我参观新场景！\n他说完自己打了个哆嗦。'], ['“你学姐还好吗？”', '鹤山|她现在路过解剖室都要开灯了。以前她都是摸黑进去的。']] },
  { id: 'tk_shop1', npc: 'shop', from: 'q_firstday', to: 'q_end', s: `老板娘|小陈，你那鬼屋晚上是不是有人值班？我关门的时候，老看见二楼窗户站着个穿红衣服的。
我|……您看错了。`, ch: [['“可能是道具。”', '老板娘|道具会招手啊？'], ['“下次看见，别跟她招手。”', '老板娘|你这孩子，吓唬阿姨呢。\n她把卷帘门又往下拉了一截。']] },
  { id: 'tk_gao1', npc: 'heshan', from: 'q_wish', to: 'q_end', s: `鹤山|老大，学姐让我带句话：她爸说，你上次问的那个叫王欣的女孩，过得挺好的。
鹤山|学姐还说……谢谢你那天把她吓哭。她说她好久没哭过了。`, ch: [['“替我谢谢高医生。”', '鹤山|好嘞！……那学姐那句呢？'], ['“让她下次再来，门票打折。”', '鹤山|我不敢转达。']] },
  { id: 'tk_shop2', npc: 'shop', from: 'q_prep', to: 'q_end', s: `老板娘|小陈，盐、鸡、杀猪刀……你这一趟买的东西，我都不敢问。
老板娘|你爸妈以前也这样。大晚上来买蜡烛和白米。`, ch: [['“他们买那些干什么？”', '老板娘|没说。你妈只说了一句：给“客人”准备的。'], ['“下次给我留几袋盐。”', '老板娘|给你留着。不收钱。']] },
  { id: 'tk_xu3', npc: 'xushu', from: 'q_boy', to: 'q_end', s: `徐叔|小陈。那晚你在医院里，罗董一直在办公室没走。
徐叔|他让我跟你说：地下那块地，以后有什么要扩的，直接找他。`, ch: [['“替我谢谢罗董。”', '徐叔|自己去谢。他等着呢。'], ['“徐叔，你也一夜没睡吧。”', '徐叔|……少废话。把水电费交了。']] },
  { id: 'tk_wan4', npc: 'xuwan', from: 'q_boy', to: 'q_end', s: `徐婉|老板，我想好了。我不走了。
徐婉|反正……别的鬼屋也不会有这么奇怪的老板。`, ch: [['“那从今天起你是正式员工。”', '徐婉|真的？！那我要五险一金！', 8], ['“你确定？这里真的有鬼。”', '徐婉|我知道。……我早就知道了。', 5]] },
  { id: 'tk_luo1', npc: 'luo', from: 'q_guest', to: 'q_end', s: `罗董|这座乐园，是我女儿出生那年建的。她最喜欢旋转木马。
他没有往下说。
你想起了那串塑料手链。`, ch: [['把手链轻轻放在他桌上', '罗董拿起来看了很久。\n罗董|……她还在这里，是不是？\n我|她一直在看着这座乐园。'], ['什么都不说', '有些事，等他自己问。']] }
];
function talkNext(k) { return TALKS.find(t => t.npc === k && inRange(t) && !C.seen[t.id]) || null; }
function npcTalk(k) { if (STATE.scene || STATE.battle) return; const N = NPCS[k], tk = talkNext(k);
  if (tk) return runScene(async () => { C.seen[tk.id] = 1; await T_(tk.s); const i = await choose(tk.ch.map(c => [c[0]])); await T_(tk.ch[i][1]); if (tk.npc === 'xuwan' && tk.ch[i][2]) petAff('wan', tk.ch[i][2]); }, '闲聊 · ' + N.name);
  const ls = chatterFor(C.loc, k); logLine(N.name + '：' + (ls.length ? pickFresh('ct_' + k + C.loc, ls).t : pick(['“嗯？”', '“忙着呢。”', '（点了点头）']))); sfx('page'); }
