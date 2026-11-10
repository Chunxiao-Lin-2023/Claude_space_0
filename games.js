/* 游戏与工具列表：大厅只读这一个文件。加一个新游戏或工具 = 在下面加一项 + 在 covers/ 放一张 16:9 封面。
   大厅只放链接，不包含任何游戏代码，所以改动这里不会影响任何游戏，反之亦然。

   kind:   可省略，省略时是游戏 | 'tool' 工具（大厅里单独分类，卡片按钮写“打开工具”）
   status: 'done' 已完成 | 'dev' 开发中
   url:    游戏所在文件夹（相对路径），或完整网址
   cover:  可省略，省略时显示标题色块 */
window.GAMES = [
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
    id: 'dunerumble',
    title: '沙丘乱斗',
    sub: '3D 吃鸡乱斗 · 英雄射击',
    desc: '十二位原创 Q 版英雄的俯视角乱斗：吃鸡、宝石争霸、乱斗足球、赏金猎人、机甲 Boss 和训练场，副技能、星徽、皮肤、奖杯段位和每日任务，单人对抗 AI，或 2–6 人联机。',
    url: 'dunerumble/',
    cover: 'covers/dunerumble.webp',
    status: 'dev',
    tags: ['单人', '多人联机', 'iPad'],
    hue: 280
  },
  {
    id: 'pawpals',
    title: '猫猫咕咕的家',
    sub: '养猫小屋 · 生活模拟',
    desc: '三花猫猫猫和狸花猫咕咕的三层小屋：爸爸妈妈和小宝的日常、院子和小镇出游、十几种对战小游戏。双击猫或家人就能自己操控，也能两个人联机住在一起。',
    url: 'pawpals/',
    cover: 'covers/pawpals.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 28
  },
  {
    id: 'hollowmanor',
    title: '幽宅双影',
    sub: '双人鬼屋探索 · 非对称合作',
    desc: '雨夜被困老宅三层楼：持灯者用手电照出霜痕、用强光定住怨灵；灵视者看得见隔墙的怨灵、灵痕和只有她读得懂的线索。认出怨灵、找到遗物、驱散它，一层层往上，直到阁楼里的宅主。',
    url: 'hollowmanor/',
    cover: 'covers/hollowmanor.webp',
    status: 'dev',
    tags: ['双人联机', 'iPad', '恐怖'],
    hue: 205
  },
  {
    id: 'nighttales',
    title: '百物语·壹',
    sub: '像素恐怖探索 · 三十则怪谈',
    desc: '三卷三十个流传已久的怪谈：血腥玛丽、裂口女、花子、如月车站、八尺大人、湘西赶尸、笔仙、贝尔女巫、くねくね、黄皮子讨封、恩菲尔德、新娘潭、坤蒂拉娜……每个怪谈一章俯视角探索解谜。两人联机共享同一个角色，轮流操作。',
    url: 'nighttales/',
    cover: 'covers/nighttales.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 350
  },
  {
    id: 'guaitan2',
    title: '百物语·贰',
    sub: '像素恐怖探索 · 又三十则怪谈',
    desc: '再讲三十个：玛丽的电话、子取箱、犬鸣村、雪女、杉泽村、聂小倩、水鬼找替身、冥婚、封门村、林投姐、鬼市、长山虎、香港奶奶、飞头、布包鬼、巴恩加尔古堡、托克洛希、红岛空城……从日本、中国、韩国一路讲到东南亚、南亚、非洲与中东。两人联机共享同一个角色，轮流操作。',
    url: 'guaitan2/',
    cover: 'covers/guaitan2.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 20
  },
  {
    id: 'guaitan3',
    title: '百物语·叁',
    sub: '像素恐怖探索 · 终卷三十则',
    desc: '最后三十个：亲爱的大卫、Polybius、烛湾、泰德的洞穴、复活玛丽、罗伯特娃娃、娃娃岛、吹哨人、天蛾人、无头骑士、飞翔的荷兰人、玛丽·赛勒斯特号、报丧女妖、哈默林的捕鼠人、芭芭雅嘎、迪亚特洛夫山口、布拉格的魔像、热沃当怪兽、坎卜斯、敏敏光、法老的诅咒、弗兰南灯塔……从美洲、欧洲一路讲到澳洲内陆与极北的海岛。最后一盏灯，两人同看。',
    url: 'guaitan3/',
    cover: 'covers/guaitan3.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 200
  },
  {
    id: 'lasttower',
    title: '尸夜孤楼',
    sub: '盖楼守夜 · 丧尸生存',
    desc: '白天出门搜物资，在空地上一层层盖楼、造枪；夜里尸潮从两边涌来，守住电台撑过十五夜。墙会被砸穿、承重断了楼会塌，攀爬者翻墙、重锤拆楼、血月巨尸压阵。单人或双人联机。',
    url: 'lasttower/',
    cover: 'covers/lasttower.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 8
  },
  {
    id: 'deadtide',
    title: '尸潮堡垒',
    sub: '2.5D 盖楼守夜 · 丧尸生存',
    desc: '低多边形 3D 斜俯视：河流、桥、山坡、树林和废弃小镇。白天砍树采石、搜车搜箱，在电台周围一层层盖堡垒；夜里尸潮过桥翻山涌来，砸墙、走楼梯、翻墙。可缩放、转镜头、逐层查看楼内。单人或双人联机。',
    url: 'deadtide/',
    cover: 'covers/deadtide.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '3D'],
    hue: 24
  },
  {
    id: 'baixi',
    title: '百戏茶馆',
    sub: '59 款棋牌与小游戏合集',
    desc: '一间国风茶馆里的游戏合集：象棋围棋、斗地主麻将、德州二十一点、飞行棋地产大亨、桌球冰壶、你画我猜成语接龙、双人厨房……按 16 个类别排好。每款都能和三档电脑对战、同屏对战，或开房间双人联机。',
    url: 'baixi/',
    cover: 'covers/baixi.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '棋牌'],
    hue: 6
  },
  {
    id: 'housemogul',
    title: '房产大亨',
    sub: '2.5D 实时炒房 · 低买高卖',
    desc: '一座会自己长大的等距小城：开发商在空地盖新楼，老房子被拆掉，房价每秒都在涨跌，挂牌房倒计时一到就撤。看准便宜的点一下买下，等价签变红「赚」再卖掉，攒够现金买下山顶豪宅。可选纯粹玩法或加上贷款、房租、装修、验房、新闻；单人可暂停加速，也能对抗王老板或双人联机抢房。',
    url: 'housemogul/',
    cover: 'covers/housemogul.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad', '经营'],
    hue: 44
  },
  {
    id: 'prophunt',
    title: '百变迷藏',
    sub: '变身捉迷藏 · 一个藏一个找',
    desc: 'Prop Hunt 式变身捉迷藏：躲方变成场景里的家具道具，抓方一件件去敲。六张地图：小家、学校、饭店后厨、医院、林间营地、海底，每张有专属角色。实时追逐（敲击次数会恢复，最后 20 秒躲方出声、只剩 3 次）或回合推理（烫/热/温/冷）。单人找电脑，或双人联机轮流藏。',
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
    desc: '根据辰东《完美世界》改编的像素动作 RPG：石村、山林、石林、梧木巢一块块打开，跟着原著剧情长大。另一位玩家扮演神兽伙伴，和小不点一起升级，并进化成他每个阶段伙伴的种族：绒灵 → 青鳞鹰 → 朱厌……',
    url: 'wanmei/',
    cover: 'covers/wanmei.webp',
    status: 'dev',
    tags: ['单人', '双人联机', '剧情', '像素'],
    hue: 120
  },
  {
    id: 'wanmeiol',
    title: '完美世界OL',
    sub: '文字网游 · 手写剧情 · 四人联机',
    desc: '《完美世界》题材的文字角色扮演网游：从石村醒来，走过大荒、石国边城，一路进入补天阁。分支剧情全部手写；世界频道里有上百个“玩家”聊天、组队、摆摊、抢世界首领；还有公会、交易行、装备强化、虚神界排名、每日悬赏和副本。可以和最多三个朋友真人联机组队。',
    url: 'wanmeiol/',
    cover: 'covers/wanmeiol.webp',
    status: 'dev',
    tags: ['单人', '四人联机', '剧情', '文字', 'iPhone'],
    hue: 38
  },
  {
    id: 'reader',
    kind: 'tool',
    title: '墨阅',
    sub: '文档阅读器 · 中英文排版',
    desc: '打开 PDF、EPUB、MOBI、DOCX、TXT、Markdown、表格、幻灯片、代码和漫画。中文和英文字体分开选，滚动、分页或双页阅读，划线笔记、全文搜索、朗读；书和笔记可同步到自己的 GitHub 私有仓库，也有 Windows / macOS 桌面版。',
    url: 'reader/',
    cover: 'covers/reader.webp',
    status: 'done',
    tags: ['电脑', 'iPad', 'iPhone', '桌面版', 'GitHub 同步'],
    hue: 210
  }
];
