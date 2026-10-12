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
  }
];
