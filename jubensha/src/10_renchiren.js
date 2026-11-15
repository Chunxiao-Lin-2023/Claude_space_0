/* 《人吃人》剧本数据。原文（背景、人物剧本、案件解析）在 text/rcr_*.txt，构建时注入 TEXT。
   线索卡文字取自原文两轮线索；侦探开场、AI 台词、答卷、结局是游戏版新增。
   when(P) 里能用：P.has(...ids) 全部已公开、P.any(...ids)、P.round（1/2）、P.brk(role, topic)、P.human(role) */
SCRIPTS.renchiren = {
  id: 'renchiren', title: '人吃人', sub: '山村毒杀案', minutes: '45–60 分钟', players: '1–2 名真人 + AI',
  blurb: '2032 年，A 国南城外与世隔绝的大山里，来村里投资办厂的赵慈善死在借住的屋子里——农药中毒，墙上却有弹孔。四个嫌疑人，一个凶手；只有凶手会说谎。',
  victim: '赵慈善', killer: 'wang', suspects: ['wang', 'zhang', 'li', 'hu'],
  bg: 'rcr_bg', truth: 'rcr_truth',
  roles: {
    wang: { name: '王村长', seal: '王', title: '山村的村长', color: '#8a5a2b', book: 'rcr_wang',
      intro: '各位领导辛苦了。我是这村的村长，姓王，祖上几代都在这儿当村长。村里穷，乡亲们不会说外面的话，有什么事尽管问我，我给大家翻译。赵老板是来帮我们村的大善人，出了这种事，我心里比谁都难受。',
      side: '隐藏自己利用贫穷控制人心的勾当（不主动承认开赌局，也没被投出去）' },
    zhang: { name: '张村民', seal: '张', title: '不爱与人交流的村民', color: '#4f6b3a', book: 'rcr_zhang',
      intro: '……张。村里的。（他说话带着很重的方言，一个词一个词往外蹦，眼睛一直盯着地面。）',
      side: '不主动暴露自己是杀人狂（被别人分析出来也算完成）' },
    li: { name: '李警察', seal: '李', title: '在山村执行任务的警察', color: '#2f4f6f', book: 'rcr_li',
      intro: '李，南城来的。在村里住了三个月，办点事，具体的不方便说。赵慈善……我跟他不熟。',
      side: '在村中找到杀人狂的线索，并且发现明确证据或者原因' },
    hu: { name: '胡调研', seal: '胡', title: '来山村调研贫困人口的调研员', color: '#6b3f5e', book: 'rcr_hu',
      intro: '我姓胡，市里扶贫调研组的，研究贫困问题很多年了。来这个村子三个月，说实话，从来没见过穷到这种地步的地方。',
      side: '调查王村长隐藏的秘密' },
    det: { name: '侦探', seal: '探', title: '南城刑警队派来的探员', color: '#7a2a2a', detective: true,
      bookText: '你是南城刑警队的探员。\n\n2032年5月15日清晨，山村里唯一会说普通话的王村长托人下山报案：来村里投资办厂的赵慈善，死在了借住的屋子里。\n\n你沿着十几里泥泞的山路赶到时，天刚亮。村里三个外来人——住了三个月、说是来“办事”的李警察，市里派来的扶贫调研员胡调研，还有被王村长叫来的村民张村民——都已经被聚在了村长家。王村长忙前忙后，给你倒水、递烟。\n\n你谁也不认识，手里只有现场和他们的证词。\n\n【规则】这四个人里只有凶手会说谎；其他人或许会隐瞒、回避，但不会说假话。回避本身也是线索——找出他们在隐瞒什么，你就离真相不远了。\n\n【你的任务】锁定杀害赵慈善的凶手，并尽可能还原那一夜发生的一切。最后由你一个人指认凶手，其他人的投票只作参考。' }
  },
  rules: [
    '只有凶手可以说假话；其他人可以隐瞒、回避，但不能说假话。',
    '第一轮：现场勘查，线索全部公开，大家一起看。',
    '第二轮：搜身搜屋。每人有行动点（AP），查一条花 1 点；不能搜自己。一条线索被谁搜走就归谁，公开不公开由他决定。',
    '讨论时可以向任何人提问，也可以出示线索或证词。被出示了关键证据，隐瞒的人可能就会说实话。',
    '最后填答卷、投票。找出凶手占一半分，还原故事占一半；嫌疑人完成支线另加 10 分。'
  ],

  /* 赵家平面图上的位置（0–1） */
  spots: {
    c_body: [0.33, 0.66], c_cup: [0.22, 0.42], c_candle: [0.38, 0.36], c_bullets: [0.07, 0.30],
    c_msg: [0.44, 0.76], c_room: [0.73, 0.32], c_map: [0.90, 0.86], c_cellar: [0.74, 0.58]
  },
  clues: {
    c_body: { r: 1, title: '尸体', text: '死者赵慈善，死于2032年5月14日8点-10点间，死于农药中毒。死者倒在地上，口吐大量鲜血，身体无外伤，身上有大量灰土。' },
    c_cup: { r: 1, title: '桌上的水杯', text: '桌上有一杯新鲜的井水，在其中发现了农药。\n\n农药在村中很多，谁都可以得到。' },
    c_candle: { r: 1, title: '蜡烛', text: '村中没有通电，照明设备只有蜡烛，死者住处的蜡烛燃烧了一半。' },
    c_bullets: { r: 1, title: '墙上的弹孔', text: '房内发现了几颗子弹和弹壳，子弹射击在墙壁上。需要说明的是，死者身上并没有枪伤。' },
    c_msg: { r: 1, title: '死亡讯息', img: 'msg', text: '死者右手边留下了一些信息，已经被吐出来的血覆盖了一部分，看不清到底是什么，但能借此判断此案系他杀。\n\n（死者留下的信息，颜色、血液形状等并不隐藏任何线索）' },
    c_room: { r: 1, title: '卧室', text: '死者住处很小，只有一个客厅和一间卧室，卧室中有一些衣物、食物和矿泉水。' },
    c_map: { r: 1, title: '村内地图', img: 'map', text: '村子很小，几个地方都相隔一两分钟的路程。\n\n村中除了住屋，没有任何基础设施，如学校、诊所、商店等。李警察、赵慈善、胡调研，都是住在没有人住的空房中。' },
    c_cellar: { r: 2, scene: true, title: '卧室的床板（深入调查）', text: '床板可以整块掀开，底下是一个挖得很规整的地下室，砖石有些年头了，地上有扭打过的痕迹，还扔着一根木棒。\n\n村民比划着说：这间空房，是王家祖上的老宅。', isNew: 1 },
    c_li_gf: { r: 2, owner: 'li', title: '女友父母的供述', text: '李警察女友的父母供述，李警察的女友在上个月上吊自杀了，而且是在村中自杀的，原因未知，是李警察将女友的遗体送回来的。' },
    c_li_gun: { r: 2, owner: 'li', title: '配枪', text: '有一把配枪，还有消音器。' },
    c_li_records: { r: 2, owner: 'li', title: '村民记录', text: '各种村民的记录，包括照片，日常行为等等，非常详细。' },
    c_zh_loan: { r: 2, owner: 'zhang', title: '一张借条', text: '借款书：今有借款人张富贵（张村民之父）向贷款人李三柱借款8000元人民币，将在协议签署后30日内归还，届时一并支付利息5000元。\n\n贷款人：李三柱　2022年3月14日　借款人：（一个指印）' },
    c_zh_father: { r: 2, owner: 'zhang', title: '村里人的说法', text: '村中人表示，2022年张村民将其父的尸体背回来，全身伤痕，眼睛也没了。张村民的母亲也早因难产而死。' },
    c_zh_knife: { r: 2, owner: 'zhang', title: '一把柴刀', text: '一把柴刀。' },
    c_wang_form: { r: 2, owner: 'wang', title: '《贫困扶持申请表》', text: '一张名叫《贫困扶持申请表》的表格，是空的，已经很陈旧了，底部信息是“请贫困村村长如实填写表格中所列项，交于南城xx局申请贫困扶持计划”。\n\n查阅记录资料，发现这个村子并没有申请任何的贫困补助。' },
    c_wang_tools: { r: 2, owner: 'wang', title: '农具', text: '镰刀，锄头等农具。' },
    c_hu_rec: { r: 2, owner: 'hu', title: '录音笔', text: '录音笔，打开以后有一段录音：“我都跟你说了，那些穷光蛋，给点饭吃就行了，不用急着发工资。项目干不完，让他们加班加点干啊？什么？加班工资？你有病吧，他们懂什么叫加班吗？……”\n\n能听出来是赵慈善的声音。' },
    c_hu_sons: { r: 2, owner: 'hu', title: '学校老师的供述', text: '据学校老师供述，胡调研的两个儿子从上个月开始就没再来上过学了。' },
    c_hu_knife: { r: 2, owner: 'hu', title: '水果刀', text: '一把水果刀。' },
    c_hu_report: { r: 2, owner: 'hu', title: '研究报告', text: '一篇研究报告，题目是《扶贫项目中做好知识扶持的必要性》。' }
  },

  /* 证词与推论：who 用来放进时间线板，t 是时间（没有就放在“其他”一栏） */
  facts: {
    f_wang_lie: { who: 'wang', t: '20:30', text: '王村长：八点多去赵家谈扶贫，九点前就回家了，那时赵慈善还好好的' },
    f_wang_home: { who: 'wang', t: '21:00', text: '王村长：那晚一直在家，没出过门' },
    f_wang_nocellar: { who: 'wang', text: '王村长：不知道赵家床底下有什么地洞' },
    f_wang_cellar: { who: 'wang', text: '王村长：赵家那间房是他家祖上的老宅，床底下有地下室，他小时候就知道' },
    f_wang_mineral: { who: 'wang', text: '王村长：赵慈善喝不惯井水，只喝自己背上山的矿泉水' },
    f_wang_visit: { who: 'wang', text: '王村长：晚上乡亲们来他家只是“串门聊庄稼”' },
    f_wang_seehu: { who: 'hu', t: '21:25', text: '王村长：九点多出门解手，看见一个提着灯笼的人往赵家走，看身形像胡调研' },
    f_wang_seezh: { who: 'zhang', t: '21:40', text: '王村长：九点四十左右看见张村民一身灰土、慌慌张张地从赵家那边回来' },
    f_wang_seeli: { who: 'li', t: '21:10', text: '王村长：九点多看见李警察从赵家那边出来，手里像是拿着什么' },
    f_li_night: { who: 'li', text: '李警察：夜里常有村民三三两两去村长家，很久才走' },
    f_li_shot: { who: 'li', t: '21:10', text: '李警察：九点十分带枪去赵家，开了几枪没打中；赵逃进卧室反锁，踹开门屋里已空、窗户开着，翻窗追出没找到，回家' },
    f_li_alive: { who: 'zhao', t: '21:10', text: '赵慈善九点十分还活着，在屋里看书，见李警察就逃进卧室（李警察证词）' },
    f_li_gf: { who: 'li', text: '李警察：女友在村里被赵慈善所害，回来后上吊自杀' },
    f_li_case: { who: 'li', text: '李警察：在查南城连环杀人案，凶手专挑有钱人，每次砍下死者的食指和中指' },
    f_li_zk: { who: 'li', text: '李警察：柴刀、被戳瞎双眼的父亲、食指和中指——南城杀人狂就是张村民' },
    f_zh_hide: { who: 'zhang', t: '21:05', text: '张村民：九点五分到赵家，躲在屋外树丛里' },
    f_zh_saw: { who: 'zhang', t: '21:10', text: '张村民：看见有人进屋，一声很响的踹门声，接着有人从屋后绕出来四处找，看不清是谁' },
    f_zh_cellar: { who: 'zhang', t: '21:15', text: '张村民：九点一刻进屋，吹灭蜡烛，在卧室床下发现地洞，跳下去头上挨了一棍，晕了' },
    f_zh_wake: { who: 'zhang', t: '21:40', text: '张村民：醒来爬出地洞，赵慈善已经吐血死在地上；离开，路上碰见提灯笼的胡调研' },
    f_zh_dad: { who: 'zhang', text: '张村民：村长家晚上人多，他爹以前也常去' },
    f_hu_940: { who: 'hu', t: '21:40', text: '胡调研：九点四十提着灯笼去赵家，路上碰见张村民，到了发现赵慈善已经死了' },
    f_hu_925: { who: 'hu', t: '21:25', text: '胡调研：九点二十五带着水果刀摸进赵家，屋里黑着，卧室床上没人，害怕就回去了' },
    f_hu_threat: { who: 'hu', text: '胡调研：录下了赵慈善压榨工人的话，赵慈善绑走他两个儿子，逼他交出录音' },
    f_hu_theory: { who: 'hu', text: '胡调研：研究定理——越贫穷的地方，人们心智越不开化，越容易沉迷黄赌毒' },
    d_water: { who: 'deduce', text: '推论：死者自己带了矿泉水、喝不惯井水，桌上那杯下了毒的井水是别人亲手倒给他的——而且是他肯接的人' },
    d_noshot: { who: 'deduce', text: '推论：刚朝赵慈善开过枪的李警察，倒的水赵慈善不可能喝' },
    d_time: { who: 'deduce', text: '推论：赵慈善九点一刻还在地洞里打晕了张村民，九点二十五胡调研来时也没发现他——他是九点二十五以后才从地洞出来、被毒死的' },
    d_cellar: { who: 'deduce', text: '推论：能把吓得躲在地洞里的赵慈善劝出来的人，得知道那个地洞，还得让他觉得是来救他的' },
    d_gamble: { who: 'deduce', text: '推论：高利贷借条、夜里聚在村长家、穷地方易沉迷赌博——王村长在村里开赌局' },
    d_poor: { who: 'deduce', text: '推论：村子明明符合补助条件却从没申请——有人故意让村子一直穷下去' },
    d_word: { who: 'deduce', text: '推论：死亡讯息左边是“贝”字旁，右边上半是“土”——“赌徒”' },
    d_hid: { who: 'deduce', text: '推论：死者身上的灰土来自卧室床下的地洞——他死前躲进过地洞' },
    d_gun: { who: 'deduce', text: '推论：墙上的子弹出自李警察那把装了消音器的配枪' },
    d_zk: { who: 'deduce', text: '推论：柴刀、被戳瞎双眼的父亲、专砍食指和中指——南城杀人狂就是张村民' }
  },
  /* 公开后，AI 心里对嫌疑人的怀疑加减 */
  sus: {
    c_bullets: { li: 1 }, c_li_gun: { li: 2 }, c_li_gf: { li: 2 }, f_li_gf: { li: 1 }, f_li_shot: { li: 1 },
    c_zh_knife: { zhang: 2 }, c_zh_father: { zhang: 1 }, f_li_case: { zhang: 1 }, f_li_zk: { zhang: 2 }, f_zh_cellar: { zhang: 1 },
    c_hu_knife: { hu: 2 }, c_hu_sons: { hu: 1 }, c_hu_rec: { hu: 1 }, f_hu_threat: { hu: 2 }, f_hu_925: { hu: 1 },
    c_wang_form: { wang: 1 }, f_wang_cellar: { wang: 2 }, f_wang_visit: { wang: 1 }, f_li_night: { wang: 1 },
    d_water: { wang: 1, zhang: -1, hu: -1 }, d_noshot: { li: -4, wang: 1 }, d_time: { wang: 1, zhang: -1 }, d_cellar: { wang: 3, hu: -1, zhang: -1 },
    d_gamble: { wang: 2 }, d_poor: { wang: 1 }, d_word: { wang: 2 }, d_gun: { li: 1 }, d_zk: { zhang: 2 }, f_zh_wake: { zhang: -1 }, f_hu_940: { hu: -1 }
  },
  /* 两条一起公开 = 有人撒谎被抓 */
  contra: [
    { a: 'f_wang_nocellar', b: 'c_cellar', who: 'wang', add: 2, by: ['li', 'hu'], say: '王村长，这是你家祖上的老宅。你会不知道自己家床底下有个地下室？' },
    { a: 'f_wang_seehu', b: 'f_hu_925', who: 'wang', add: 3, by: ['hu', 'li'], say: '我九点二十五去的时候根本没提灯笼，是摸黑去的！王村长，你看见的到底是谁？还是你根本就没看见？' },
    { a: 'f_wang_seehu', b: 'f_wang_lie', who: 'wang', add: 2, by: ['li', 'hu'], say: '你不是说九点前就回家睡了吗？怎么九点多又在外面看见人了？' },
    { a: 'f_wang_seeli', b: 'f_wang_home', who: 'wang', add: 2, by: ['li', 'hu'], say: '一晚上没出门，却看见我从赵家出来？村长，你到底出没出门？' },
    { a: 'f_wang_visit', b: 'c_zh_loan', who: 'wang', add: 2, by: ['li', 'hu'], say: '串门聊庄稼？那张家借高利贷的借条怎么解释？一个连路都没有的村子，八千块借来干什么？' }
  ],

  topics: [
    { id: 'where', q: '那天晚上你在哪？做了什么？' },
    { id: 'saw', q: '那晚你看到或听到什么了吗？' },
    { id: 'zhao', q: '你和赵慈善是什么关系？' },
    { id: 'village', q: '这个村子有什么不对劲的地方？' },
    { id: 'cellar', q: '你知道赵家床底下有个地洞吗？', when: P => P.any('c_cellar', 'f_zh_cellar') }
  ],

  /* AI 回答：从上往下第一条 when 成立的 */
  ans: {
    wang: {
      where: [
        { when: P => P.has('d_cellar', 'd_gamble'), kind: 'crack', say: '我……我说了，九点前就回去了！你们城里人编故事真有一套，这是要冤枉一个老实人？', reveal: ['f_wang_lie'] },
        { kind: 'lie', say: '那天晚上八点多，我提着灯笼去赵老板那儿，跟他商量扶贫工厂的事。他好好的，还说第二天一早就走。不到九点我就回家睡了。', reveal: ['f_wang_lie'] }
      ],
      saw: [{ kind: 'lie', say: '回去的路上黑灯瞎火的，什么也没看见。哦对了，村里张家那小子，大半夜经常在外头晃，你们可以问问他。' }],
      zhao: [
        { when: P => P.has('c_hu_rec'), kind: 'evade', say: '录音？那……那是城里人厂子里的事，我们乡下人不懂什么加班不加班的。赵老板对我们村可是没话说。' },
        { kind: 'lie', say: '赵老板是大善人，要给我们村盖工厂。我们全村都盼着呢，谁会害他？' }
      ],
      village: [
        { when: P => P.has('c_wang_form'), kind: 'crack', say: '那张表……字太多，我看不懂，就放着了。申请那个要跑好几趟城里，乡亲们走不开……这有什么好问的！', reveal: ['f_wang_visit'] },
        { when: P => P.any('f_li_night', 'f_zh_dad'), kind: 'lie', say: '乡亲们晚上来我家？串门！聊聊庄稼。乡下人晚上没事干，不来我这儿去哪儿？', reveal: ['f_wang_visit'] },
        { kind: 'lie', say: '我们村穷是穷，可乡亲们心齐，都听我的。有我在，村里太平得很。' }
      ],
      cellar: [{ kind: 'truth', say: '那屋子是我家祖上盖的老宅，床底下有个地下室，我小时候还在里面躲过猫猫。怎么，赵老板钻进去了？', reveal: ['f_wang_cellar'] }],
      about_zhang: [{ kind: 'lie', say: '张家那小子，爹死得早，性子野，天天往山里钻，有时候一走好几天，谁也不知道去哪了。腰里一直别着把柴刀。' }],
      about_li: [{ kind: 'lie', say: '李同志住了好几个月，神神秘秘的，天天拿个本子记村里人。前阵子他带来的那个姑娘……唉，后来是抬下山的。' }],
      about_hu: [{ kind: 'lie', say: '胡同志是好人，就是最近总发呆，跟丢了魂似的。赵老板来了以后就这样。' }]
    },
    li: {
      where: [
        { when: P => P.brk('li', 'where'), kind: 'truth', say: '……是我。九点十分，我带着枪去了他家。他正在看书，看见我就跑，我开了几枪，手抖，都没打中。他躲进卧室把门反锁了，我一脚踹开，屋里没人，窗户开着。我翻窗出去找了一圈，没找到，就回去了。\n\n我没杀他——他身上没有枪伤，你们都看到了。', reveal: ['f_li_shot', 'f_li_alive'] },
        { kind: 'evade', say: '那晚我在住处。……九点多出去了一趟。去哪，我不想说。' }
      ],
      saw: [{ kind: 'truth', say: '我在村里住了三个月，一直在观察这些村民。晚上常有人三三两两去村长家，待很久才走。听不懂他们说什么。', reveal: ['f_li_night'] }],
      zhao: [
        { when: P => P.brk('li', 'zhao'), kind: 'truth', say: '我女朋友跟我一起进的村。四月她失踪了几天，回来的时候眼神是空的，衣服破了，她哭着说“赵慈善，这个恶魔，他不是人”。我去给她拿吃的，回来的时候，她已经吊在房梁上了。', reveal: ['f_li_gf'] },
        { kind: 'evade', say: '我不想谈他。' }
      ],
      village: [{ kind: 'truth', say: '这村子不对劲。所有人的眼神都像监狱里等死的犯人。我听不懂他们的方言，只能靠王村长翻译——可他翻的话，我一句都不信。' }],
      cellar: [
        { when: P => P.brk('li', 'where'), kind: 'truth', say: '不知道。……原来他躲在那里。我找遍了屋外，没想到人就在屋里。' },
        { kind: 'evade', say: '不知道。我没进过他的卧室……那晚之前没进过。' }
      ],
      about_wang: [{ kind: 'truth', say: '他太热情了。一个穷成这样的村子，村长的手上却没有一点老茧。' }],
      about_zhang: [{ kind: 'truth', say: '我一直在盯着他。我在查南城的一桩连环杀人案，凶手专挑有钱人，每次都砍下死者的食指和中指。这孩子经常一个人出山，一走好几天。', reveal: ['f_li_case'] }],
      about_hu: [{ kind: 'truth', say: '胡调研以前很健谈。赵慈善来了以后，他就像变了个人，经常在村里发呆。' }]
    },
    zhang: {
      where: [
        { when: P => P.brk('zhang', 'where'), kind: 'truth', say: '……我去了。九点五分，在外面树丛里，等。九点十分有人进去，踹门，砰。又从屋后绕出来，找东西，看不清是谁。\n\n九点一刻，我进去，吹了蜡烛。床底下有洞，我跳下去，头上挨了一棍，晕了。醒来，他躺在地上，死了。不是我。我走了。路上碰见那个姓胡的。', reveal: ['f_zh_hide', 'f_zh_saw', 'f_zh_cellar', 'f_zh_wake'] },
        { kind: 'evade', say: '……不说。' }
      ],
      saw: [
        { when: P => P.brk('zhang', 'where'), kind: 'truth', say: '说了。踹门的人，从屋后绕出来，找了一圈，走了。看不清脸。' },
        { kind: 'evade', say: '……（他摇摇头，不说话。）' }
      ],
      zhao: [
        { when: P => P.has('c_zh_father'), kind: 'evade', say: '有钱人……都该死。爹说的。（他说完就闭紧了嘴。）' },
        { kind: 'evade', say: '有钱人。' }
      ],
      village: [{ kind: 'truth', say: '穷。都穷。……村长不穷。' }],
      cellar: [
        { when: P => P.brk('zhang', 'where'), kind: 'truth', say: '知道。跳下去了，挨了一棍。' },
        { kind: 'evade', say: '……（他摸了摸后脑勺，没吭声。）' }
      ],
      about_wang: [{ kind: 'truth', say: '……村长家，晚上，人多。爹以前，也去。', reveal: ['f_zh_dad'] }],
      about_li: [{ kind: 'truth', say: '那个人，一直跟着我。' }],
      about_hu: [{ kind: 'truth', say: '那个人，老找我说话。村长翻的。我随便说的。' }]
    },
    hu: {
      where: [
        { when: P => P.brk('hu', 'where'), kind: 'truth', say: '……好吧，我其实去了两次。九点二十五第一次去，屋里黑漆漆的，我摸到卧室，往床上一摸——没人。我……我身上带着刀。我害怕了，给自己找了个借口就跑回去了。\n\n九点四十我又提着灯笼去，路上碰到张村民，到了就看见他倒在地上……', reveal: ['f_hu_925', 'f_hu_940'] },
        { kind: 'evade', say: '九点四十左右，我提着灯笼想去找赵慈善谈点事，路上碰到了张村民。到了他那儿，就看见他……已经倒在地上了。', reveal: ['f_hu_940'] }
      ],
      saw: [{ kind: 'truth', say: '路上碰到张村民，他走得很急，一句话没说。到了赵慈善那儿，桌上点着半截蜡烛……不对，我去的时候是黑的，我自己提着灯笼。' }],
      zhao: [
        { when: P => P.brk('hu', 'zhao'), kind: 'truth', say: '他不是什么慈善家！他在贫困区开厂，工资给得少得可怜，还逼人白白加班。我录下了他的话，被他发现了。后来……他给我看了一段视频，我两个儿子被绑在椅子上哭。他要我交出录音。\n\n我想先抓住他，逼他说出孩子在哪……可我去的时候，他不在。', reveal: ['f_hu_threat'] },
        { kind: 'evade', say: '我对他……有些看法。不过人都死了，不说也罢。' }
      ],
      village: [{ kind: 'truth', say: '贫困研究里有个定理：越贫穷的地方，人们的心智就越不开化，越容易沉迷黄赌毒。这个村子是我见过最典型的。奇怪的是，它明明符合申请扶贫补助的所有条件。', reveal: ['f_hu_theory'] }],
      cellar: [{ kind: 'truth', say: '地洞？我不知道……怪不得，我摸到床上没人，原来他就在床底下。' }],
      about_wang: [{ kind: 'truth', say: '我和村民说话全靠王村长翻译。可我每次问得深一点，村民的回答就越来越短。我有时候怀疑他根本没照实翻。' }],
      about_zhang: [{ kind: 'truth', say: '我想和他聊聊他的生活，他总是随便糊弄过去——当然，也是村长翻的。' }],
      about_li: [{ kind: 'truth', say: '李警察是来办案的，不肯说什么案。我们偶尔聊聊，都是体制内的，他人不坏。' }]
    }
  },

  /* 被出示某条线索或证词时的反应；brk 把对应话题“打开”，之后问他就说实话 */
  show: {
    wang: {
      c_cellar: { say: '床底下那个地洞？那屋子是我家祖上盖的，地洞早就有了，我小时候还在里面躲过猫猫。怎么，赵老板钻进去了？', reveal: ['f_wang_cellar'] },
      f_zh_cellar: { say: '地洞……对，那是我家老宅的地下室。张家小子跳进去了？他半夜跑去赵老板屋里干什么！', reveal: ['f_wang_cellar'] },
      c_room: { say: '城里人讲究，喝不惯我们的井水，自己背了好几箱矿泉水上山。', reveal: ['f_wang_mineral'] },
      c_cup: { say: '井水村里家家都喝，农药也是家家都有。这能说明什么？……赵老板？他喝不惯井水的，都喝自己带的矿泉水。', reveal: ['f_wang_mineral'] },
      c_zh_loan: { say: '李三柱？不认识。张富贵出去打工欠的钱，跟我可没关系。' },
      c_wang_form: { say: '那张表……字太多，我看不懂，就放着了。申请那个要跑好几趟城里，乡亲们走不开。', reveal: ['f_wang_visit'] },
      f_li_night: { say: '乡亲们晚上来我家？串门！聊聊庄稼。乡下人晚上没事干嘛。', reveal: ['f_wang_visit'] },
      f_zh_dad: { say: '张富贵是常来，来借粮食！那年头家家都揭不开锅……' },
      d_gamble: { say: '赌局？胡说八道！你们城里人编故事真有一套！' },
      d_word: { say: '这血糊糊的两个字，你说是啥就是啥？我认得的字不多……' },
      c_msg: { say: '这血糊糊的，看不出写的啥。我认得的字不多。' },
      c_li_gun: { say: '枪！还装了消音器！我就说他神神秘秘的！领导，开枪的肯定是他！' },
      c_zh_knife: { say: '看看，柴刀！我早说了这孩子不对劲。' },
      c_hu_knife: { say: '胡同志也带着刀？这……读书人带刀干什么？' },
      c_hu_rec: { say: '录音？那是城里厂子里的事，我们乡下人不懂。' },
      _: ['这……这跟我有什么关系？', '领导，我就是个种地的，这些我真不懂。', '我们村的人老实，不会干这种事的。']
    },
    li: {
      c_li_gun: { say: '……', brk: ['where'] }, c_bullets: { when: P => P.has('c_li_gun'), say: '……', brk: ['where'] },
      f_zh_saw: { say: '……', brk: ['where'] },
      c_li_gf: { say: '……', brk: ['zhao'] },
      c_li_records: { say: '我说了，我在办案。这些都是村民的记录。……我在找一个人。', reveal: ['f_li_case'] },
      c_zh_knife: { when: P => P.has('c_zh_father'), say: '柴刀……被戳瞎双眼的父亲……食指和中指。是他。南城杀人狂就是张村民。', reveal: ['f_li_case', 'f_li_zk'] },
      c_zh_father: { when: P => P.has('c_zh_knife'), say: '柴刀……被戳瞎双眼的父亲……食指和中指。是他。南城杀人狂就是张村民。', reveal: ['f_li_case', 'f_li_zk'] },
      c_cup: { when: P => P.any('c_room', 'f_wang_mineral'), say: '他自己带了矿泉水，桌上却是一杯井水。是有人倒给他的，而且是他愿意喝的人倒的。', reveal: ['d_water'] },
      c_msg: { say: '两个字。左边那个，能看出“贝”字旁；右边那个，上面像个“土”。' },
      f_wang_cellar: { when: P => P.has('d_time'), say: '他知道那个地洞。赵慈善那晚吓得躲在地洞里，能把他骗出来的，只能是知道地洞、又让他觉得是来救他的人。', reveal: ['d_cellar'] },
      c_cellar: { say: '地洞？……原来他躲在那里。我找遍了屋外，没想到人就在屋里。' },
      _: ['看不出什么。', '这个我不清楚。', '……你自己判断吧。']
    },
    zhang: {
      c_cellar: { say: '……（他下意识摸了摸后脑勺。）', brk: ['where'] },
      c_body: { when: P => P.has('c_cellar'), say: '……灰土。地洞里的。', brk: ['where'] },
      f_hu_940: { say: '……他看见我了。好，我说。', brk: ['where'] },
      f_zh_saw: { say: '……', brk: ['where'] },
      c_zh_knife: { say: '……砍柴的。' },
      c_zh_loan: { say: '爹的。……爹出山干活，回来带了好多钱。后来……（他不说了。）' },
      c_zh_father: { say: '……（他攥紧了拳头，一句话也不说。）' },
      f_li_zk: { say: '（他抬起头，第一次直直地看着对方。）……他，不是我杀的。' },
      c_msg: { say: '……不认字。' },
      _: ['……', '不知道。', '（他摇摇头。）']
    },
    hu: {
      c_hu_knife: { say: '……', brk: ['where'] }, f_zh_wake: { say: '……', brk: ['where'] },
      c_hu_rec: { say: '……', brk: ['zhao'] }, c_hu_sons: { say: '……', brk: ['zhao'] },
      c_hu_report: { say: '知识扶持……我一直觉得，光给钱没用，得让人知道外面的世界是什么样子。' },
      c_wang_form: { say: '空的？这个村子从来没申请过补助？……原来如此。有人不想让这个村子富起来。', reveal: ['d_poor'] },
      c_zh_loan: { when: P => P.has('f_li_night', 'f_hu_theory'), say: '借高利贷、晚上聚在村长家、穷地方最容易沉迷赌博……我明白了。是赌。王村长在村里开赌局。', reveal: ['d_gamble'] },
      f_li_night: { when: P => P.any('c_zh_loan', 'f_zh_dad') && P.has('f_hu_theory'), say: '借高利贷、晚上聚在村长家、穷地方最容易沉迷赌博……我明白了。是赌。王村长在村里开赌局。', reveal: ['d_gamble'] },
      c_msg: { when: P => P.has('d_gamble'), say: '贝字旁……右边上头是个“土”……“赌”字左边就是贝，“徒”字右上是土——“赌徒”！赵慈善留下的是“赌徒”。', reveal: ['d_word'] },
      d_gamble: { say: '“赌徒”……死亡讯息！左边是贝字旁，右边上头是土。赵慈善临死写下的，就是“赌徒”。', reveal: ['d_word'] },
      _: ['这个……我也说不好。', '我不知道该怎么解释。', '我是研究贫困的，这种事我不懂。']
    }
  },

  /* 讨论里 AI 的主动发言和互相质问。who 可以是数组：取第一个不是真人的。ask/show 是 AI 之间的动作（对真人就弹出让他答） */
  talk: [
    { id: 't1', r: 1, who: 'wang', say: '各位领导，赵老板身上没有枪伤，是喝了农药死的。农药家家都有……我看，得查查那晚谁不在家。' },
    { id: 't2', r: 1, who: ['li', 'hu'], say: '墙上有弹孔，死者却没中枪。那晚至少有两拨人去过他家。' },
    { id: 't3', r: 1, who: ['hu', 'li'], say: '他身上全是灰土，可这屋子并不脏。他去过什么脏地方？' },
    { id: 't4', r: 1, who: 'li', ask: { to: 'zhang', topic: 'where' } },
    { id: 't5', r: 1, who: 'wang', ask: { to: 'li', topic: 'where' } },
    { id: 't6', r: 1, who: ['hu', 'li'], say: '死亡讯息是两个字，被血盖住了大半……左边那个像是“贝”字旁。' },
    { id: 't7', r: 1, who: 'li', ask: { to: 'hu', topic: 'where' } },
    { id: 't8', r: 1, who: 'hu', ask: { to: 'wang', topic: 'where' } },
    { id: 't9', r: 1, who: 'hu', ask: { to: 'wang', topic: 'village' } },
    { id: 't10', r: 1, who: 'li', ask: { to: 'zhang', topic: 'about_wang' } },
    { id: 't11', r: 1, who: 'hu', ask: { to: 'li', topic: 'saw' } },
    { id: 't12', r: 1, who: 'li', ask: { to: 'hu', topic: 'village' } },

    { id: 'u1', r: 2, when: P => P.has('c_li_gun'), who: 'wang', say: '枪！还装着消音器！墙上的弹孔就是他打的！' },
    { id: 'u2', r: 2, when: P => P.has('c_li_gun') && !P.brk('li', 'where'), who: ['hu', 'wang'], show: { to: 'li', id: 'c_li_gun' } },
    { id: 'u3', r: 2, when: P => P.has('c_zh_knife'), who: 'wang', say: '张家小子的柴刀！我就说这孩子不对劲，你们看看他那双眼睛。' },
    { id: 'u11', r: 2, when: P => P.has('c_cup') && P.any('c_room', 'f_wang_mineral') && !P.has('d_water'), who: ['li', 'hu'], say: '他自己背了矿泉水上山，桌上却是一杯井水。毒不是下在井里等他自己喝的——是有人亲手倒给他，而且是他肯接的人。', reveal: ['d_water'] },
    { id: 'u12', r: 2, when: P => P.has('d_water', 'f_li_shot') && !P.has('d_noshot'), who: ['li', 'hu'], say: P => P.who === 'li' ? '我朝他开过枪。我递过去的水，他会喝吗？' : '李警察刚朝他开过枪，他怎么可能喝李警察递的水？', reveal: ['d_noshot'] },
    { id: 'u13', r: 2, when: P => P.has('f_zh_cellar', 'f_hu_925') && !P.has('d_time'), who: ['li', 'hu'], say: '九点一刻，张村民在地洞里被打晕——那时赵慈善还活着，就躲在地洞里。九点二十五胡调研来，屋里也没人。所以他是九点二十五以后才出来、被毒死的。', reveal: ['d_time'] },
    { id: 'u14', r: 2, when: P => P.has('c_cellar') && !P.has('f_wang_cellar') && !P.has('f_wang_nocellar'), who: ['li', 'hu'], ask: { to: 'wang', topic: 'cellar' } },
    { id: 'u15', r: 2, when: P => P.has('f_wang_cellar', 'd_time') && !P.has('d_cellar'), who: ['li', 'hu'], say: '赵慈善被枪吓得躲进地洞，谁叫都不该出来。能把他劝出来的人，得知道那个地洞，还得让他觉得是来救他的……这屋子是谁家的老宅？', reveal: ['d_cellar'] },
    { id: 'u16', r: 2, when: P => P.has('c_wang_form') && !P.has('d_poor'), who: ['hu', 'li'], say: '这张申请表是空的。这个村子明明符合补助条件，却从来没申请过——有人不想让它富起来。', reveal: ['d_poor'] },
    { id: 'u17', r: 2, when: P => P.has('f_li_night', 'f_hu_theory') && P.any('c_zh_loan', 'f_zh_dad') && !P.has('d_gamble'), who: ['hu', 'li'], say: '高利贷的借条，夜里三三两两聚在村长家，再加上“越穷越容易沉迷赌博”……王村长在村里开赌局。', reveal: ['d_gamble'] },
    { id: 'u18', r: 2, when: P => P.has('d_gamble') && !P.has('d_word'), who: ['hu', 'li'], say: '死亡讯息！左边是“贝”字旁，右边上头是个“土”——“赌徒”。赵慈善临死前写下的是“赌徒”。', reveal: ['d_word'] },
    { id: 'u4', r: 2, when: P => P.has('c_zh_knife', 'c_zh_father'), who: 'li', show: { to: 'li', id: 'c_zh_knife' }, self: 1 },
    { id: 'u5', r: 2, when: P => P.has('c_cellar') && !P.brk('zhang', 'where'), who: ['li', 'hu'], show: { to: 'zhang', id: 'c_cellar' } },
    { id: 'u6', r: 2, when: P => P.any('f_hu_940') && !P.brk('zhang', 'where'), who: ['hu', 'li'], show: { to: 'zhang', id: 'f_hu_940' } },
    { id: 'u7', r: 2, when: P => P.has('c_hu_knife') && !P.brk('hu', 'where'), who: ['li', 'wang'], show: { to: 'hu', id: 'c_hu_knife' } },
    { id: 'u8', r: 2, when: P => P.has('f_zh_wake') && !P.brk('hu', 'where'), who: ['li'], show: { to: 'hu', id: 'f_zh_wake' } },
    { id: 'u9', r: 2, when: P => P.any('c_hu_rec', 'c_hu_sons') && !P.brk('hu', 'zhao'), who: ['li', 'wang'], show: { to: 'hu', id: P => P.has('c_hu_rec') ? 'c_hu_rec' : 'c_hu_sons' } },
    { id: 'u10', r: 2, when: P => P.has('c_li_gf') && !P.brk('li', 'zhao'), who: ['hu', 'wang'], show: { to: 'li', id: 'c_li_gf' } },
    { id: 'u19', r: 2, when: P => P.has('d_gamble'), who: 'wang', say: '你们……你们城里人懂什么！没有我，这村子早就散了！乡亲们都是自愿的！……我是说，我什么都没干。' },
    { id: 'u20', r: 2, when: P => P.has('f_li_zk'), who: 'zhang', say: '（他抬起头，第一次直直地看着所有人。）……赵慈善，不是我杀的。' },
    { id: 'u21', r: 2, who: 'li', ask: { to: 'wang', topic: 'where' }, when: P => P.has('d_time') },
    { id: 'u22', r: 2, who: ['hu'], ask: { to: 'li', topic: 'zhao' }, when: P => !P.brk('li', 'zhao') },
    { id: 'u23', r: 2, who: ['li'], ask: { to: 'zhang', topic: 'about_wang' }, when: P => !P.has('f_zh_dad') },
    { id: 'u24', r: 2, who: ['hu', 'li'], ask: { to: 'wang', topic: 'village' }, when: P => P.any('c_wang_form', 'f_li_night') },
    /* AI 凶手反击（标准、困难）和无辜 AI 的回击 */
    { id: 'w1', r: 2, diff: 'rebut', when: P => P.has('d_gamble') && !P.cut('d_gamble'), who: 'wang', cut: 'd_gamble', say: '高利贷是张富贵出山干活欠下的，跟村里有什么关系？乡亲们晚上来我家，是借粮！你们城里人没饿过肚子，不懂。' },
    { id: 'w1c', r: 2, diff: 'rebut', when: P => P.cut('d_gamble') && P.has('f_li_night'), who: ['li', 'hu'], uncut: 'd_gamble', say: '借粮要三三两两、大半夜去，一待就是好几个钟头？村长，这话你自己信吗？' },
    { id: 'w2', r: 2, diff: 'rebut', when: P => P.has('d_word') && !P.cut('d_word'), who: 'wang', cut: 'd_word', push: { zhang: 1 }, say: '那两个字糊成那样，非说是“赌徒”？左边是贝字旁，也可以是个“财”字——他是说有人图他的钱！谁专盯有钱人，大家心里有数。' },
    { id: 'w2c', r: 2, diff: 'rebut', when: P => P.cut('d_word') && P.has('d_gamble'), who: ['hu', 'li'], uncut: 'd_word', say: '“财”字的右边是个“才”，不是“土”。死亡讯息右边那个字上头是土——就是“徒”。' },
    { id: 'w3', r: 2, diff: 'rebut', when: P => P.has('d_water') && !P.cut('d_water'), who: 'wang', cut: 'd_water', say: '给客人倒碗井水是我们山里的规矩，谁进他屋都会倒一杯，他自己也会倒，这能说明什么？' },
    { id: 'w4', r: 2, diff: 'frame', who: 'wang', reveal: ['f_wang_seezh'], push: { zhang: 3 }, say: '有件事我一直没敢说……那晚九点四十左右，我起夜，看见张家小子一身灰土、慌慌张张地从赵老板那边跑回来。' }
  ],
  idle: {
    wang: ['领导们喝口水，慢慢查，不着急。', '要我说，外面来的人里才有坏人。', '我们村的人老实，一辈子没出过山。'],
    li: ['……', '再看看线索。', '证据不会说谎。'],
    zhang: ['……', '（他盯着窗外。）', '饿了。'],
    hu: ['我们再把时间理一理？', '一定有我们漏掉的东西。', '要是能找到我儿子……']
  },

  /* 真人扮演嫌疑人时，被问到某个话题的可选回答（只有凶手能选 lie）。vol=可以主动说 */
  deck: {
    wang: {
      where: [
        { kind: 'lie', vol: 1, say: '那天晚上八点多，我去赵老板那儿商量扶贫的事，他好好的。不到九点我就回家了。', reveal: ['f_wang_lie'], tip: '原文推荐的说法' },
        { kind: 'lie', vol: 1, say: '我一晚上都在家，没出过门。', reveal: ['f_wang_home'] },
        { kind: 'truth', say: '九点半我提着灯笼去了，在床底下的地洞里找到他，劝他出来，给他倒了杯水……', reveal: ['f_wang_cellar'], confess: 1, tip: '等于认罪' },
        { kind: 'evade', say: '人老了，记不清了。' }
      ],
      saw: [
        { kind: 'lie', vol: 1, say: '黑灯瞎火的，什么也没看见。倒是张家那小子，大半夜常在外头晃。' },
        { kind: 'lie', vol: 1, say: '九点多我出门解手，远远看见一个人提着灯笼往赵家那边走，看身形……像是胡同志。', reveal: ['f_wang_seehu'], push: { hu: 3 }, tip: '嫁祸胡调研（有风险）' },
        { kind: 'lie', vol: 1, say: '九点四十左右，我看见张家小子一身灰土，慌慌张张地从赵家那边回来。', reveal: ['f_wang_seezh'], push: { zhang: 3 }, tip: '嫁祸张村民' },
        { kind: 'lie', vol: 1, say: '九点多，我看见李同志从赵家那边出来，手里像是拿着什么东西。', reveal: ['f_wang_seeli'], push: { li: 2 }, tip: '嫁祸李警察' },
        { kind: 'evade', say: '没注意。' }
      ],
      zhao: [{ kind: 'lie', vol: 1, say: '赵老板是大善人，要给我们村盖工厂，谁会害他？' }, { kind: 'evade', say: '人家是大老板，我们说不上几句话。' }],
      village: [
        { kind: 'lie', vol: 1, say: '乡亲们晚上来我家就是串门，聊聊庄稼。', reveal: ['f_wang_visit'] },
        { kind: 'truth', say: '……是，我在村里坐庄开了几张赌桌。', reveal: ['d_gamble'], confess: 2, tip: '支线失败' },
        { kind: 'evade', say: '村里的事，说了你们城里人也不懂。' }
      ],
      cellar: [
        { kind: 'truth', vol: 1, say: '那是我家祖上的老宅，床底下有个地下室，我知道。', reveal: ['f_wang_cellar'] },
        { kind: 'lie', vol: 1, say: '地洞？什么地洞？我不知道。', reveal: ['f_wang_nocellar'] },
        { kind: 'evade', say: '老房子了，谁记得底下有什么。' }
      ],
      rebut: [
        { kind: 'lie', vol: 1, when: P => P.has('d_gamble'), cut: 'd_gamble', say: '高利贷是张富贵出山干活欠下的，跟村里有什么关系？乡亲们晚上来我家，是借粮！你们城里人没饿过肚子，不懂。', tip: '反驳“开赌局”' },
        { kind: 'lie', vol: 1, when: P => P.has('d_word'), cut: 'd_word', push: { zhang: 1 }, say: '那两个字糊成那样，非说是“赌徒”？左边是贝字旁，也可以是个“财”字——他是说有人图他的钱！谁专盯有钱人，大家心里有数。', tip: '反驳死亡讯息' },
        { kind: 'lie', vol: 1, when: P => P.has('d_water'), cut: 'd_water', say: '给客人倒碗井水是我们山里的规矩，谁进他屋都会倒一杯，他自己也会倒，这能说明什么？', tip: '反驳“亲手倒水”' },
        { kind: 'lie', vol: 1, when: P => P.has('d_cellar'), cut: 'd_cellar', push: { zhang: 1 }, say: '知道那个地洞的人多了！张家小子不就跳进去了？他能跳进去，就能把人叫出来。', tip: '反驳“知道地洞的人”' }
      ],
      _: [{ kind: 'lie', say: '这跟我可没关系。' }, { kind: 'evade', say: '我一个种地的，这些不懂。' }]
    },
    zhang: {
      where: [
        { kind: 'truth', vol: 1, say: '我去了。在外面树丛里等，看见有人进去踹门、绕屋后找人。九点一刻我进去，跳进床下的地洞，被打晕了，醒来他已经死了。', reveal: ['f_zh_hide', 'f_zh_saw', 'f_zh_cellar', 'f_zh_wake'] },
        { kind: 'evade', say: '……不说。' }
      ],
      saw: [{ kind: 'truth', vol: 1, say: '九点十分，有人进去，踹门，又从屋后绕出来找，看不清是谁。', reveal: ['f_zh_saw'] }, { kind: 'evade', say: '……' }],
      zhao: [{ kind: 'evade', say: '有钱人。' }, { kind: 'truth', say: '有钱人都该死。……我杀过很多有钱人，砍下他们的两根手指。', reveal: ['f_li_zk'], confess: 2, tip: '暴露杀人狂身份，支线失败' }],
      village: [{ kind: 'truth', vol: 1, say: '穷。都穷。村长不穷。村长家晚上人多，我爹以前也去。', reveal: ['f_zh_dad'] }, { kind: 'evade', say: '……' }],
      cellar: [{ kind: 'truth', vol: 1, say: '知道。我跳下去过，挨了一棍。', reveal: ['f_zh_cellar'] }, { kind: 'evade', say: '……' }],
      _: [{ kind: 'evade', say: '……不知道。' }]
    },
    li: {
      where: [
        { kind: 'truth', vol: 1, say: '九点十分我带枪去了他家，开了几枪没打中。他躲进卧室，我踹开门，人已经不见了，窗户开着。我追出去没找到，就回去了。', reveal: ['f_li_shot', 'f_li_alive'] },
        { kind: 'evade', say: '那晚我在住处，九点多出去了一趟。去哪不想说。' }
      ],
      saw: [{ kind: 'truth', vol: 1, say: '晚上常有村民三三两两去村长家，很久才走。', reveal: ['f_li_night'] }, { kind: 'evade', say: '没什么特别的。' }],
      zhao: [{ kind: 'truth', vol: 1, say: '我女朋友被他害了，回来就上吊了。', reveal: ['f_li_gf'] }, { kind: 'evade', say: '我不想谈他。' }],
      village: [{ kind: 'truth', vol: 1, say: '我在查南城连环杀人案，凶手专挑有钱人，砍下死者的食指和中指。', reveal: ['f_li_case'] }, { kind: 'truth', vol: 1, say: '夜里常有村民去村长家，很久才走。', reveal: ['f_li_night'] }],
      cellar: [{ kind: 'truth', say: '不知道有地洞。原来他躲在那里。' }, { kind: 'evade', say: '不清楚。' }],
      _: [{ kind: 'evade', say: '这个我不清楚。' }]
    },
    hu: {
      where: [
        { kind: 'truth', vol: 1, say: '九点四十我提灯去找他，路上碰到张村民，到了就看见他死了。', reveal: ['f_hu_940'] },
        { kind: 'truth', vol: 1, say: '我其实去了两次。九点二十五带着刀去过一次，屋里黑着，床上没人，我就回去了。九点四十又去，他已经死了。', reveal: ['f_hu_925', 'f_hu_940'] },
        { kind: 'evade', say: '我在住处。' }
      ],
      saw: [{ kind: 'truth', vol: 1, say: '路上碰到张村民，他走得很急。', reveal: ['f_hu_940'] }, { kind: 'evade', say: '没看到什么。' }],
      zhao: [{ kind: 'truth', vol: 1, say: '他压榨工人。我录了音，他就绑走了我两个儿子逼我交出来。', reveal: ['f_hu_threat'] }, { kind: 'evade', say: '人都死了，不说也罢。' }],
      village: [{ kind: 'truth', vol: 1, say: '越贫穷的地方心智越不开化，越容易沉迷黄赌毒。这个村子明明符合补助条件。', reveal: ['f_hu_theory'] }, { kind: 'evade', say: '只是很穷而已。' }],
      cellar: [{ kind: 'truth', say: '不知道。怪不得床上没人。' }, { kind: 'evade', say: '不清楚。' }],
      _: [{ kind: 'evade', say: '这个我也说不好。' }]
    }
  },
  /* AI 向真人出示某条线索时，按哪个话题给真人选回答 */
  showTopic: { c_li_gun: 'where', c_bullets: 'where', c_li_gf: 'zhao', c_cellar: 'cellar', f_hu_940: 'where', f_zh_wake: 'where', c_hu_knife: 'where', c_hu_rec: 'zhao', c_hu_sons: 'zhao', c_zh_knife: 'zhao', c_zh_father: 'zhao', c_wang_form: 'village', f_li_night: 'village', c_zh_loan: 'village', f_zh_cellar: 'cellar' },

  questions: [
    { q: '杀死赵慈善的凶手是谁？', opts: ['王村长', '张村民', '李警察', '胡调研'], a: 0, killer: 1, roles: ['wang', 'zhang', 'li', 'hu'] },
    { q: '死亡讯息里被血盖住的两个字是什么？', opts: ['赌徒', '财主', '贼人', '村长'], a: 0 },
    { q: '毒是怎么下的？', opts: ['凶手亲手倒了一杯下了农药的井水给他', '有人往井里投了毒', '农药混在他带来的矿泉水里', '他自己误喝了农药'], a: 0 },
    { q: '是谁朝赵慈善开的枪？', opts: ['王村长', '张村民', '李警察', '胡调研'], a: 2 },
    { q: '那晚被打晕在地洞里的人是谁？', opts: ['张村民', '胡调研', '李警察', '没有人'], a: 0 },
    { q: '南城杀人狂是谁？', opts: ['王村长', '张村民', '李警察', '不在这几个人里'], a: 1 },
    { q: '王村长隐藏的秘密是什么？', opts: ['开赌局、故意不申请扶贫，让村民一直穷下去', '私吞了扶贫款', '和赵慈善合伙压榨村民', '他就是南城杀人狂'], a: 0 },
    { q: '赵慈善的真面目是？', opts: ['压榨贫困工人、绑走胡调研的儿子、害死李警察的女友', '真心扶贫的大善人', '被王村长逼走的投资商', '南城杀人狂的同伙'], a: 0 }
  ],
  /* 支线：真人扮演嫌疑人时结算 */
  sides: {
    wang: G => !G.confess.wang2 && G.verdict !== 'wang',
    zhang: G => !G.confess.zhang2,
    li: (G, role) => (G.answers[role] || [])[5] === 1 || G.pub.includes('f_li_zk') || G.pub.includes('d_zk'),
    hu: (G, role) => (G.answers[role] || [])[6] === 0
  },

  /* 复盘：时间线矩阵（原文案件解析整理） */
  timeline: {
    cols: ['wang', 'zhang', 'li', 'hu', 'zhao'],
    colName: { zhao: '赵慈善' },
    rows: [
      ['21:05', '在家', '埋伏在赵家屋外树丛', '在家', '在家', '在屋里看书'],
      ['21:10', '在家', '看见有人进屋、踹门、绕屋后找人', '带枪进屋开枪未中，踹开卧室门，翻窗追出未果', '在家', '逃进卧室反锁，躲进床下地洞'],
      ['21:15', '在家', '进屋吹灭蜡烛，跳进地洞被一棍打晕', '回家', '在家', '在地洞里用木棒打晕张村民'],
      ['21:25', '在家', '昏迷在地洞里', '在家', '带刀摸进卧室，床上没人，离开', '躲在地洞里'],
      ['21:30', '提灯笼到赵家，劝赵出地洞，倒井水下农药', '昏迷在地洞里', '在家', '在家', '喝下毒水，临死写下“赌徒”'],
      ['21:40', '已回家', '醒来见尸体，离开，路遇胡调研', '在家', '提灯再去，路遇张村民，发现尸体', '死亡']
    ]
  },

  endings: {
    wang: { title: '赌徒', text: '赵慈善临死前用血写下的两个字，终于被人读懂了。\n\n南城的警察顺着那张空白的《贫困扶持申请表》查下去，查出了王家几代人在这座山里织下的网：赌桌、高利贷、被故意截断的消息、被故意留住的贫穷。王村长被带下山的那天，村民们站在路边看着，没有人说话——他们听不懂外面的话，也还不知道，自己的穷原来是被人“养”出来的。\n\n半年后，第一批扶贫干部带着会说方言的翻译进了村。山路修到一半的时候，有个孩子问翻译：外面是什么样子的？\n\n这个世界从来也不是非黑即白的。有吃人的利益，就有吃人的人。' },
    other: { title: '吃人的人', text: '你们指认了 {name}。\n\n王村长在送走警察的那天，在村口站了很久。他给每一位领导都塞了一袋山货，笑着说“常来”。\n\n没有人再去读那两个被血盖住的字。那张空白的申请表被他塞进灶膛，一下就烧没了。赌桌照常在夜里摆开，村民照常三三两两地走进村长家的院子。\n\n山还是那么高，路还是那么烂。凶手还在，而且他从来没有离开过。' },
    none: { title: '悬案', text: '票数打平，没有人被指认。\n\n赵慈善的尸体被抬下山，案子挂了起来。外来的人一个个离开，只有王村长一直把他们送到村口。\n\n那两个被血盖住的字，被雨水冲得越来越淡。' }
  },
  epilogues: [
    { role: 'li', text: G => G.pub.includes('f_li_shot') ? '李警察：他主动交出了配枪，承认那晚带枪私闯民宅、开枪伤人未遂。处分下来那天，他去女友的墓前坐了一下午。' : '李警察：他始终没说那晚九点十分去过哪里。直到弹道鉴定报告摆到他面前。' },
    { role: 'zhang', text: G => (G.pub.includes('f_li_zk') || G.pub.includes('d_zk') || G.answersRight(5)) ? '张村民：南城杀人狂的案子在李警察的报告里结了案。被带走的时候，张村民没有反抗，只是回头看了一眼山——他父亲埋在那里。' : '张村民：没有人把柴刀和那些被砍掉的手指联系起来。几个月后，南城又发生了一起命案。' },
    { role: 'hu', text: G => (G.pub.includes('f_hu_threat') || G.pub.includes('c_hu_rec')) ? '胡调研：那段录音被交了上去。警方顺着赵慈善的工厂，在一间仓库里找到了他的两个儿子——饿瘦了，但都还活着。' : '胡调研：他没能说出儿子被绑的事。赵慈善死了，知道孩子下落的人也就没了。他在山下的派出所门口坐了三天。' },
    { role: 'wang', text: G => G.verdict === 'wang' ? '王村长：判决下来时，他还在念叨“没有我，这村子早散了”。' : '王村长：他依旧是这座山里的“帝王”。直到下一个外乡人进村。' }
  ]
};
