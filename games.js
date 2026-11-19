/* 游戏与工具列表：大厅只读这一个文件。加一个新游戏或工具 = 在下面加一项 + 在 covers/ 放一张 16:9 封面。
   大厅只放链接，不包含任何游戏代码，所以改动这里不会影响任何游戏，反之亦然。

   kind:   可省略，省略时是游戏 | 'tool' 工具（大厅里单独分类，卡片按钮写“打开工具”）
   status: 'done' 已完成 | 'dev' 开发中
   url:    游戏所在文件夹（相对路径），或完整网址
   cover:  可省略，省略时显示标题色块 */
window.GAMES = [
  {
    id: 'jubensha',
    title: '剧本杀 · 夜半推理馆',
    sub: '人吃人 · 1–2 人 + AI · 45–60 分钟',
    desc: '大山村里的投资商离奇身亡，四个嫌疑人只有凶手会说谎。当侦探审问 AI 嫌疑人，或拿剧本入局互相质问，可双人联机。',
    url: 'jubensha/',
    cover: 'covers/jubensha.webp',
    status: 'dev',
    tags: ['单人', '双人联机', '剧情', '推理', 'iPad'],
    hue: 20
  },
  {
    id: 'kongbuwu',
    title: '我有一座恐怖屋 · 陈歌篇',
    sub: '文字版 · 原著剧情 · 经营鬼屋 + 夜探凶宅',
    desc: '扮演陈歌经营快倒闭的恐怖屋：白天吓游客攒尖叫，夜里闯公寓、学校、病栋，把怪谈请回来当员工。含惊吓画面，可关闭。',
    url: 'kongbuwu/',
    cover: 'covers/kongbuwu.webp',
    status: 'dev',
    tags: ['单人', '剧情', '文字', '恐怖', 'iPhone'],
    hue: 0
  },
  {
    id: 'wanmeiol',
    title: '完美世界 · 石昊篇',
    sub: '文字版 · 原著剧情 · 双人共享画面',
    desc: '化身石村小不点，从锻体、出村一路走到界海独断万古，十五卷完整剧情。宝术、洞天、副本齐全，朋友可同屏轮流操作。',
    url: 'wanmeiol/',
    cover: 'covers/wanmeiol.webp',
    status: 'dev',
    tags: ['单人', '双人联机', '剧情', '文字', 'iPhone'],
    hue: 38
  },
  {
    id: 'jiqiao',
    title: '机巧百战',
    sub: '十六波闯关 · 构筑',
    desc: '选一位英雄扛住十六波机关兽，每波之间升级、开箱、逛商店，把武器一路合成到金阶。',
    url: 'jiqiao/',
    cover: 'covers/jiqiao.webp',
    status: 'done',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 38
  },
  {
    id: 'cloudisle',
    title: '云岛冒险',
    sub: '横版刷怪 · 职业技能',
    desc: '冒险岛风格的横版 RPG：职业与转职、地图与 Boss、装备与任务，支持全键盘操作和双人联机。',
    url: 'cloudisle/',
    cover: 'covers/cloudisle.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '全键盘'],
    hue: 200
  },
  {
    id: 'riftwardens',
    title: '裂隙守卫',
    sub: '陷阱塔防 · 动作',
    desc: '在兽人冲向裂隙的通路上布置尖刺、路障、箭墙和弹射板，再操控战法师或女术士亲自参战。',
    url: 'riftwardens/',
    cover: 'covers/riftwardens.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 12
  },
  {
    id: 'hollowmanor',
    title: '幽宅双影',
    sub: '像素鬼屋 · 非对称合作 · 单人或双人',
    desc: '雨夜被困三层老宅：一人掌灯，一人见鬼。认出怨灵、驱散它，一层层上到阁楼。',
    url: 'hollowmanor/',
    cover: 'covers/hollowmanor.webp',
    status: 'dev',
    tags: ['单人 AI 队友', '双人同屏', '联机', 'iPad', '恐怖'],
    hue: 205
  },
  {
    id: 'baiwuyu',
    title: '百物语',
    sub: '像素恐怖探索 · 三部九十则怪谈',
    desc: '九十个经典怪谈分三部：血腥玛丽、裂口女、如月车站、湘西赶尸……每夜一章俯视角探索解谜，两人联机轮流操作。',
    url: 'baiwuyu/',
    cover: 'covers/baiwuyu.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '恐怖'],
    hue: 350
  },
  {
    id: 'lasttower',
    title: '尸夜孤楼',
    sub: '盖楼守夜 · 丧尸生存',
    desc: '白天搜物资、盖楼造枪，夜里守住电台抵挡两侧尸潮，撑过十五夜。墙会被砸穿，楼会塌。单人或双人联机。',
    url: 'lasttower/',
    cover: 'covers/lasttower.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 8
  },
  {
    id: 'deadtide',
    title: '尸潮堡垒',
    sub: '2.5D 盖楼守夜 · 丧尸生存 · 六种模式',
    desc: '3D 斜俯视丧尸生存：六种模式与六张地图自由组合，白天搜刮建造，夜里死守尸潮，还有四只尸王。可双人联机。',
    url: 'deadtide/',
    cover: 'covers/deadtide.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '3D'],
    hue: 24
  },
  {
    id: 'baixi',
    title: '百戏茶馆',
    sub: '62 款棋牌与小游戏合集',
    desc: '国风茶馆里的游戏合集：象棋围棋、斗地主麻将、桌球冰壶、沙丘乱斗、房产大亨、猫猫咕咕的家……可人机、同屏或联机。',
    url: 'baixi/',
    cover: 'covers/baixi.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '棋牌'],
    hue: 6
  },
  {
    id: 'prophunt',
    title: '百变迷藏',
    sub: '变身捉迷藏 · 一个藏一个找',
    desc: '变身捉迷藏：躲方变成家具道具，抓方挨个去敲。六张主题地图，实时追逐或回合推理两种玩法，单人或双人联机。',
    url: 'prophunt/',
    cover: 'covers/prophunt.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '派对'],
    hue: 46
  },
  {
    id: 'wanmei',
    title: '完美世界',
    sub: '双人剧情 · 石村篇（试玩）',
    desc: '辰东《完美世界》改编的像素动作 RPG：跟着原著在石村长大，另一位玩家扮演会一路进化的神兽伙伴。',
    url: 'wanmei/',
    cover: 'covers/wanmei.webp',
    status: 'dev',
    hidden: true, /* old pixel version, superseded by wanmeiol; still playable at wanmei/ */
    tags: ['单人', '双人联机', '剧情', '像素'],
    hue: 120
  },
  {
    id: 'reader',
    kind: 'tool',
    title: '墨阅',
    sub: '文档阅读器 · 中英文排版',
    desc: '打开 PDF、EPUB、Word、漫画等各种文档，划线笔记、全文搜索、朗读，书和笔记可同步到 GitHub 私有仓库。',
    url: 'reader/',
    cover: 'covers/reader.webp',
    status: 'done',
    tags: ['电脑', 'iPad', 'iPhone', '桌面版', 'GitHub 同步'],
    hue: 210
  }
];
