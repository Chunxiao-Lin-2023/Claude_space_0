/* 游戏列表：大厅只读这一个文件。加一个新游戏 = 在下面加一项 + 在 covers/ 放一张 16:9 封面。
   大厅只放链接，不包含任何游戏代码，所以改动这里不会影响任何游戏，反之亦然。

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
    title: '十夜怪谈',
    sub: '像素恐怖探索 · 十个怪谈',
    desc: '血腥玛丽、裂口女、厕所里的花子、一个人的捉迷藏、电梯游戏、375路末班车、消失的搭车客、猴爪、画皮、哭泣的女人——每个怪谈一章俯视角探索解谜。两人联机共享同一个角色，轮流操作。',
    url: 'nighttales/',
    cover: 'covers/nighttales.webp',
    status: 'dev',
    tags: ['单人', '双人联机', 'iPad'],
    hue: 350
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
  }
];
