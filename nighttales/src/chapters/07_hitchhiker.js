/* ================= 第七夜 · 消失的搭车客 ================= */
(() => {
  /* ---------- 地图生成小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));
  const woods = (g, x0, y0, x1, y1, s) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = hash(x, y, s) < .55 ? 'P' : 'T'; };

  /* 老磨坊路：80×16，自西向东 —— 加油站 / 玉米地 / 磨坊溪桥 / 树林 / 圣安妮墓园 / 艾什福德镇 */
  function roadRows() {
    const g = G(80, 16, 'G');
    woods(g, 0, 0, 79, 1, 3); woods(g, 0, 14, 79, 15, 4);
    F(g, 11, 2, 23, 3, 'Y'); F(g, 11, 11, 23, 13, 'Y');
    woods(g, 32, 2, 48, 3, 5); woods(g, 32, 11, 48, 13, 6);
    F(g, 49, 11, 62, 13, 'Y'); woods(g, 63, 11, 79, 13, 8);
    for (let x = 0; x < 80; x++) { g[5][x] = 'v'; g[6][x] = ':'; g[7][x] = '='; g[8][x] = ':'; g[9][x] = 'v'; }
    // 沃尔特加油站
    F(g, 0, 0, 10, 1, 'P'); F(g, 1, 0, 9, 1, '#'); F(g, 0, 2, 10, 5, 'x');
    // 磨坊溪与桥
    F(g, 25, 0, 30, 3, '~'); F(g, 25, 11, 30, 15, '~');
    for (let x = 25; x <= 30; x++) { g[4][x] = 'L'; g[10][x] = 'L'; }
    for (const y of [0, 1, 2, 3, 11, 12, 13, 14, 15]) { g[y][24] = 'K'; g[y][31] = 'K'; }
    // 圣安妮墓园（路北）
    F(g, 49, 0, 62, 3, '"'); F(g, 49, 4, 62, 4, 'F'); for (let y = 0; y < 4; y++) { g[y][49] = 'F'; g[y][62] = 'F'; }
    g[1][50] = 'T'; g[0][57] = 'T'; g[1][61] = 'T';
    // 艾什福德镇
    for (let x = 63; x <= 76; x++) { g[5][x] = '_'; g[4][x] = '"'; }
    g[4][69] = 'k';
    // 东头：积水封路
    g[5][77] = 'G'; g[9][77] = 'G'; F(g, 78, 0, 79, 15, 'P');
    return ROWS(g);
  }
  /* 圣安妮墓园：30×24 */
  function cemRows() {
    const g = G(30, 24, '"');
    for (let x = 0; x < 30; x++) { g[0][x] = 'P'; g[1][x] = 'F'; g[23][x] = 'F'; }
    for (let y = 0; y < 24; y++) { g[y][0] = 'P'; g[y][29] = 'P'; g[y][1] = 'F'; g[y][28] = 'F'; }
    for (let y = 3; y <= 22; y++) g[y][15] = 'd';
    for (let x = 2; x <= 27; x++) { g[9][x] = 'd'; g[16][x] = 'd'; }
    for (const [x, y] of [[3, 3], [26, 3], [25, 11], [3, 14], [10, 19], [24, 20], [12, 3]]) g[y][x] = 'T';
    return ROWS(g);
  }

  const LEG = { 'v': 'gravel', 'Y': 'corn', 'F': 'ifence', 'G': { t: 'grass', solid: true } };
  /* ---------- 小工具 ---------- */
  const inCar = S => typeof S.pl.spr === 'string' && S.pl.spr[0] !== '@';
  const meSpr = S => (S.f.coat && !S.f.coatBack) ? '@me2' : '@me';
  async function goP(S, map, x, y, dir, car = false) {
    await S.fade(1, 300);
    S.f.inCar = car;
    S.wear(car ? (S.f.phase === 'ride' ? 'autop' : 'auto') : meSpr(S));
    S.speed(car ? 2.1 : 1);
    S.plr(null);
    await S.go(map, x, y, dir);
  }
  const her = S => (S.f.named ? '莉莉' : '姑娘');

  /* ---------- 加油站：沃尔特 ---------- */
  async function waltTalk(S) {
    S.face('walt', 'pl');
    const lines = [
      '月光舞厅早就拆了。那块地现在是饲料公司的仓库，一下雨，满街都是豆粕味儿。',
      '我年轻时也在那儿跳过舞。那会儿一到周六晚上，这条路上的车灯能连成一串。',
      '别这么看我，孩子。我没见过她。我只是把别人的话记在本子上。',
      '雨夜过桥，开慢点。那座桥的护栏，这些年换过三回了。'
    ];
    await S.say('沃尔特', lines[(S.f._wl = ((S.f._wl ?? -1) + 1) % lines.length)]);
  }

  /* ---------- 上车 ---------- */
  async function enterCar(S) {
    S.sfx('close');
    S.hide('mycar'); S.pos(8, 3, 0);
    S.wear('auto'); S.speed(2.1); S.f.inCar = true; S.amb('car');
    S.sfx('car');
    await S.narr('你钻进驾驶座，拧了两下钥匙。老雪佛兰咳嗽了一声，总算发动了。\n雨刷开到最快，也只能在挡风玻璃上刮出两道扇形的清楚。');
    S.f.phase = 'drive1'; S.f.hx = 33;
    S.goal('沿老磨坊路往东开，回家');
    S.cp('drive');
  }

  /* ---------- 桥头：白衣姑娘 ---------- */
  async function encounter(S) {
    const f = S.f, p = S.pl, n = f.pass || 0;
    if (n >= 2) {
      S.place('hh', Math.min(76, p.x + 2), p.y, 1);
      S.sfx('brake'); S.shake(500, 2);
      await S.narr('她就站在路中间。\n白裙子，湿头发，被车灯照得几乎透明——你猛踩刹车，轮胎在湿路面上尖叫着滑出去好几米。');
      await S.narr('车头停在她膝盖前面一拳远的地方。她没有躲，连眼睛都没有眨。');
      await S.say('姑娘', '……你终于停下来了。', { style: 'whisper' });
      return pickup(S, true);
    }
    S.focus(f.hx, 8);
    if (n === 0) {
      await S.narr('车灯扫过桥头的路灯——\n路灯底下，站着一个人。');
      await S.narr('是个姑娘。没有打伞，穿着一条白色的长裙，是那种只有老电影里才见得到的舞会礼服。\n她朝你的车，轻轻招了招手。');
      await S.think('……「过了磨坊溪那座桥，要是路边有个姑娘招手——别停车。」');
    } else {
      await S.narr('车灯照亮的雨幕里，路边又站着一个白色的人影。\n同样的裙子，同样湿透的头发，同样慢慢抬起来的手。');
      await S.think('不可能。你刚刚明明已经把她甩在桥头了。');
    }
    S.focus(null);
    const r = await S.ask('要停车吗？', ['停车', '踩油门开过去']);
    if (r === 0) return pickup(S, false);
    S.sfx('car');
    await S.alpha('hh', 0, 700);
    f.pass = n + 1;
    if (n === 0) {
      await S.narr('你一脚油门，从她身边开了过去。\n后视镜里，那个白色的人影站在雨里一动不动，越来越小，最后被雾吞掉了。');
      f.hx = 43; S.place('hh', 43, 9, 1); S.ent('hh').alpha = 1; S.hide('hh');
    } else {
      await S.narr('你咬着牙，又一次开了过去。\n这一次，你没敢看后视镜。');
      f.hx = 50; S.hide('hh');
    }
  }
  async function pickup(S, forced) {
    const f = S.f;
    if (!forced) { S.sfx('brake'); S.shake(300, 1); }
    S.face('hh', 'pl');
    await S.narr('车在她身边停下。你摇下车窗，冷雨一下子扑了进来。\n她浑身都湿透了，白裙子贴在身上，头发一绺一绺地往下滴水。胸前别着一朵白花，花瓣被雨打得有点蔫了。');
    await S.say('雷', '嘿……你还好吗？这么大的雨，你要去哪儿？');
    await S.say('姑娘', '……能送我回家吗？');
    const r = await S.ask('（雨刷来回刮着。她在等你开口。）', ['上来吧，快。', '你一个人站在这儿干什么？'], '雷');
    if (r === 1) { await S.say('姑娘', '我在等人送我回家。'); await S.say('姑娘', '……等了很久了。', { style: 'whisper' }); await S.say('雷', '……先上车吧。'); }
    S.sfx('open'); await S.wait(300);
    S.hide('hh'); S.wear('autop'); S.sfx('close');
    await S.narr('她拉开车门，坐进副驾驶座，把湿透的裙摆小心地拢在膝盖上。\n车门关上的那一瞬间，车里好像一下子冷了好几度。');
    f.phase = 'ride'; f.ev = 0; f.nextX = S.pl.x + clamp(Math.floor((53 - S.pl.x) / RIDE.length), 1, 3);
    S.goal('送她回家');
  }

  /* ---------- 车上：一段一段的沉默 ---------- */
  const RIDE = [
    async S => {   // 地址
      await S.say('雷', '我叫雷。在城里的罐头厂上夜班。……你住哪儿？');
      await S.say('姑娘', ['枫树街十七号。在艾什福德镇上。', '过了墓园，再往前一点就是。']);
      await S.say('雷', '巧了，我回农场正好路过镇子。……你叫什么名字？');
      await S.say('姑娘', '……莉莉。');
      S.f.named = true;
      S.goal('送莉莉回家：艾什福德镇，枫树街十七号');
    },
    async S => {   // 冷
      await S.narr('车里越来越冷。暖风已经开到了最大，吹出来的却是凉风。\n挡风玻璃的内侧，慢慢结起了一层薄薄的白霜。');
      await S.narr('你瞥了一眼副驾驶。莉莉抱着胳膊，肩膀在发抖。湿裙子上的水顺着座椅边往下滴，滴答，滴答。');
      let r = await S.ask('她冷得发抖。', ['把外套脱下来给她', '把暖风再拧大一点']);
      if (r === 1) {
        await S.narr('你把暖风旋钮拧到了底。出风口呼呼作响，可吹在手背上的风，凉得像井水。');
        r = await S.ask('莉莉还在发抖。', ['……还是把外套给她吧', '快到了，再忍一忍']) === 0 ? 0 : 2;
      }
      if (r === 0) {
        await S.say('雷', '穿上吧。高中橄榄球队的夹克，背后那个号码……你别笑话我。');
        await S.say('莉莉', '……谢谢你。');
        await S.narr('她把你那件深蓝色的夹克裹在身上，领子竖起来，遮住了半张脸。\n夹克的袖口，很快就被她的手浸湿了。');
        S.f.coat = true;
      } else {
        await S.say('莉莉', '没关系。', { style: 'whisper' });
        await S.say('莉莉', '……我已经习惯了。', { style: 'whisper' });
      }
    },
    async S => {   // 几号
      await S.say('莉莉', '……今天是几号？');
      await S.say('雷', '二十三号。十月二十三号。');
      await S.say('莉莉', '哪一年？');
      S.bubble('pl', '?', 1200);
      await S.say('雷', '一九七六年啊。你……没事吧？');
      await S.wait(900);
      await S.say('莉莉', '……也是星期六。', { style: 'whisper' });
      const r = await S.ask('她把额头抵在冰凉的车窗上。', ['什么也是星期六？', '（不说话，专心开车）'], '雷');
      if (r === 0) {
        await S.say('莉莉', ['舞会那天。', '我跳了一整个晚上。只有最后一支舞没有跳——比利说，十一点半之前一定得送我到家。妈妈说，晚一分钟都不行。']);
      } else await S.narr('雨刷来回刮着。她没有再说话，只是侧着脸，看着窗外黑漆漆的树林。');
    },
    async S => {   // 收音机
      S.sfx('tv');
      await S.narr('收音机「咔」地响了一声，自己换了台。\n沙沙的杂音里，钻出一支很老很老的曲子：单簧管拖着长音，慢三步，像是从很远很远的舞池里飘过来的。');
      await S.say('莉莉', '……是这首。', { style: 'whisper' });
      await S.narr('她轻轻地跟着哼。你从来没听过这首歌，可不知道为什么，听着听着，心里有点发酸。');
      S.sfx('whisper');
      await S.say('收音机', '……这里是 KWLT，月光舞厅现场。现在是一九四八年十月二十三日，晚上十一点三十八分。下面是今晚的最后一支舞——', { style: 'whisper' });
      S.sfx('tv');
      await S.narr('杂音一下子吞没了后半句。');
      await S.say('雷', '……他刚才说，哪一年？');
      await S.narr('莉莉没有回答。');
    }
  ];
  async function vanish(S) {
    const f = S.f;
    await S.narr('车窗外，一排黑色的铁栅栏从雾里浮了出来。栅栏后面，是一块一块歪斜的墓碑。\n圣安妮墓园。');
    await S.say('莉莉', '……到了。', { style: 'whisper' });
    await S.say('雷', '嗯？还没呢，枫树街还要再往前开一段——');
    S.amb('none');
    await S.wait(900);
    await S.narr('你转过头。');
    S.wear('auto'); S.sfx('brake'); S.shake(500, 2); S.fx('flash');
    await S.wait(700);
    await S.narr('副驾驶座上，空空的。');
    await S.narr('座椅湿透了。坐垫凹下去一小块，像是刚刚还有人坐在那里，凹陷里积着一小摊冰凉的水。\n水面上，漂着一片白色的花瓣。' + (f.coat ? '\n\n你的外套，也不见了。' : ''));
    await S.think('车门从头到尾都没有开过。');
    await S.say('雷', '……莉莉？');
    S.amb('car');
    await S.narr('只有雨声。');
    f.phase = 'toaddr';
    S.goal('去枫树街十七号（继续往东，进镇）');
    S.cp('addr');
  }
  async function rideStep(S, x) {
    const f = S.f;
    if (f.ev < RIDE.length) { if (x >= f.nextX) { const i = f.ev++; f.nextX = x + clamp(Math.floor((53 - x) / Math.max(1, RIDE.length - f.ev)), 1, 4); await RIDE[i](S); } return; }
    if (x >= 55) return vanish(S);
  }

  /* ---------- 枫树街十七号 ---------- */
  async function arriveHouse(S) {
    await S.narr('枫树街十七号。整条街都黑着，只有这一家门廊上的灯还亮着，在雨里晕成一团黄。');
    const r = await S.ask('下车敲门吗？', ['下车', '再想想']);
    if (r) return;
    S.sfx('close'); S.f.phase = 'house';
    await goP(S, 'house', 7, 7, 3);
  }

  /* ---------- 回墓园 ---------- */
  async function gatePrompt(S) {
    const r = await S.ask(S.f.rest ? '墓园的大门半开着。' : '圣安妮墓园的铁门……开着一条缝。门上的铁链垂在地上。\n停车吗？', ['停车，进墓园', '先不']);
    if (r) return;
    S.sfx('close');
    await goP(S, 'cem', 15, 22, 3);
  }
  async function warn(S) {
    const p = S.pl; S.f.warned = true;
    S.place('hh', Math.max(1, p.x - 2), p.y, 2); S.ent('hh').alpha = .85;
    S.sfx('brake'); S.shake(500, 2);
    await S.narr('车灯里，忽然站着一个人。\n你猛踩刹车——是她。湿透的白裙子贴在身上，头发上的水一直往下淌。');
    await S.narr('她没有招手。她慢慢抬起手臂，指着你身后——\n墓园的方向。');
    await S.say('莉莉', '不是这边。', { style: 'whisper' });
    await S.alpha('hh', 0, 900);
    S.turn(2);
    await S.think('墓园在身后。……哈珀太太说，她就在那儿等着。');
  }
  async function crash(S) {
    S.wear('autop'); S.sfx('sting');
    await S.narr('你没有停。');
    await S.narr('下一秒，副驾驶座上就坐着一个人。湿透的白裙子，冰凉的手，轻轻地搭在你握方向盘的手上。');
    await S.say('莉莉', '……不是这边。', { style: 'whisper' });
    S.sfx('brake'); await S.scare('face', { spr: '@lilyg', dur: 1 });
    S.sfx('splash'); S.shake(900, 4);
    await S.end({ bad: true, title: '她没能回家', text: '第二天早上，有人在磨坊溪的桥下发现了一辆旧雪佛兰。\n车里没有人。副驾驶座上，放着一朵泡得发白的栀子花。\n\n老沃尔特开着拖车去了现场。他站在断掉的护栏旁边，看了很久。\n\n那座桥的护栏，又要换第四回了。' });
  }

  /* ---------- 墓园 ---------- */
  const GRAVES = [
    { id: 'g_finch', x: 4, y: 5, kind: 'round', moss: true, t: '「埃德加·芬奇　1862—1931」\n下面一行小字：主啊，求你记念。\n碑脚长满了青苔，像一圈毛茸茸的领子。' },
    { id: 'g_walker', x: 7, y: 5, kind: 'cross', carve: 'rose', t: '石头十字架。底座上刻着：\n「莉莲·沃克　1930—1948」\n「三月的玫瑰，开得太早了。」\n十字架脚下刻着一束玫瑰。……也叫莉莲，也是1948年。' },
    { id: 'g_baby', x: 10, y: 5, kind: 'small', t: '一块小得像面包的石头，上面只刻着「1944」。\n石头上放着几颗被雨泡胀了的水果糖。不知道是谁放的。' },
    { id: 'g_flu', x: 5, y: 7, kind: 'flat', moss: true, t: '「列兵 奥斯卡·林德　1899—1918」\n不是死在战场上。碑文说，他死在回家的运兵船上——那年冬天的流感。' },
    { id: 'g_ogden', x: 9, y: 7, kind: 'double', t: '一块双人碑。「亨利·奥格登　1870—1939」「玛莎·奥格登　1872—1939」\n死在同一年。中间刻着一行字：「谁也没让谁等太久。」' },
    { id: 'g_edith', x: 19, y: 5, kind: 'obelisk', moss: true, carve: 'lily', t: '一座细高的方尖碑，名字被青苔糊住了大半：\n「伊……·哈珀　186……—1948」\n底座上刻着一枝百合花。也是姓哈珀，也是1948年……\n可是莉莉十七岁。这个人，至少活了八十岁。' },
    { id: 'g_thomas', x: 21, y: 5, kind: 'round', t: '「托马斯·J·哈珀　1899—1961」\n「他每天晚上都给家人留着门廊的灯。」\n……是莉莉的爸爸。' },
    { id: 'g_lill', x: 23, y: 5, kind: 'round', moss: true, carve: 'gardenia', lill: true, t: '一块不大的圆顶碑，名字被青苔吃掉了，只剩下一个「……·哈珀」。\n年份还看得清：「1931—1948」。\n名字下面刻着一朵小小的花：厚厚的花瓣，一层压着一层。\n最底下一行字：「她只是先回家了。」' },
    { id: 'g_nameless', x: 19, y: 7, kind: 'flat', t: '一块无字碑。石头被人擦得很干净，碑前却从来没有花。' },
    { id: 'g_bell', x: 4, y: 12, kind: 'round', carve: 'gardenia', t: '「玛格丽特·贝尔　1952—1968」\n名字下面刻着一朵栀子花，刻得很深，像是刻字的人很用力。\n……十六岁。可这是1968年。' },
    { id: 'g_ww2', x: 7, y: 12, kind: 'cross', t: '「下士 雷蒙德·哈斯　1923—1944」\n「诺曼底」\n碑前插着一面褪成粉色的小国旗。' },
    { id: 'g_crane', x: 19, y: 12, kind: 'double', t: '一块双人碑。左边刻着「琼·克兰　1914—1970」；\n右边刻着「沃尔特·克兰　1911—」，后面空着。\n……加油站的老沃尔特？他早就给自己买好了地方，就在老伴旁边。' },
    { id: 'g_new', x: 23, y: 12, kind: 'flat', t: '一块崭新的碑，坟上的土还是松的。「1976年9月」\n碑前的菊花还没有谢。' },
    { id: 'g_farm', x: 11, y: 12, kind: 'obelisk', t: '「克努森家族」。这一带种玉米的老户人家。\n碑的四面刻满了名字，最早的一个是1871年。' }
  ];
  async function graveOn(S, gd) {
    const e = S.ent(gd.id);
    if (gd.lill && S.f.rest) return S.narr(S.f.coat ? '碑前放着那朵栀子花。碑顶上，你的外套留下了一块叠过的湿印子。' : '碑前放着那朵栀子花。花瓣上的水珠，一颗也没有落下来。');
    await S.narr(gd.t);
    if (!S.has('gardenia') || S.f.rest) return;
    const r = await S.ask('把栀子花放在这里吗？', ['放下', '不是这儿']);
    if (r) return;
    if (gd.lill) return restScene(S, e);
    S.sfx('whisper'); S.shake(400, 2);
    await S.narr('花刚放下，一阵冷风就贴着地皮卷过来，把它吹得滚出去老远。\n你赶紧追过去，把它捡了回来。花瓣上沾满了泥。');
    S.f.wspd = Math.min(3.1, (S.f.wspd || 2.5) + .2);
    await S.narr('雾里，那些绿色的光好像……更亮了一点。');
    await S.think('哈珀太太说过：认不出名字，就认那朵花，认那一年。');
  }
  const CHASERS = ['wisp1', 'wisp2', 'wisp3', 'shade'];
  async function restScene(S, grave) {
    const f = S.f;
    f.rest = true;
    for (const id of CHASERS) S.stop(id);
    S.take('gardenia'); grave.flowers = true; S.sfx('chime');
    await S.narr('你把栀子花轻轻放在碑前。\n雨，忽然小了。');
    await Promise.all(CHASERS.map(id => S.ent(id).hidden ? null : S.alpha(id, 0, 1400)));
    S.amb('rain');
    await S.narr('那些绿色的光一团一团地暗了下去，像是有人挨个吹熄了蜡烛。');
    if (f.coat) {
      grave.coat = true; S.sfx('sting');
      await S.narr('你这才看清，墓碑顶上搭着一样东西——\n一件深蓝色的棒球夹克，叠得整整齐齐。背后绣着一个白色的「23」。');
      await S.think('……是你的外套。可刚才，那里明明什么都没有。');
    } else {
      await S.narr('墓碑前的草地上，有一小摊水。像是有人刚刚在这里站了很久很久。');
    }
    S.ent('lilyg').alpha = 0; S.place('lilyg', 24, 6, 1);
    await S.alpha('lilyg', .8, 1600);
    S.face('pl', 'lilyg');
    await S.say('莉莉', '……你来了。', { style: 'whisper' });
    await S.say('雷', '莉莉。');
    await S.say('莉莉', ['我一直以为，只要有人肯停车送我，我就能回到家。', '可每次车开到这儿，我就想起来了。', '……我已经到家了。很早很早以前，就到了。']);
    if (f.coat) await S.say('莉莉', '外套还给你。……很暖和。谢谢你。');
    const r = await S.ask('她看着你，像是在等你说点什么。', ['你妈妈一直在等你。', '你还有什么话，要我带给谁吗？'], '雷');
    if (r === 0) await S.say('莉莉', '我知道。门廊的灯，我每年都看得见。');
    await S.say('莉莉', ['告诉妈妈，我到家了。', '告诉她——这一回，我没有晚一分钟。']);
    await S.wait(500);
    await S.say('莉莉', '……雷，你会跳慢三步吗？');
    const r2 = await S.ask('她朝你伸出一只手。', ['我……不太会。', '我试试。'], '雷');
    await S.say('莉莉', r2 === 0 ? '没关系。我教你。' : '那就跟着我。一、二、三……');
    S.sfx('chime');
    await S.narr('你握住了她的手。很凉，像握着一捧雨水。\n你们在墓碑之间，转了一个很慢很慢的圈。');
    await S.walk('lilyg', 'dl', 1.2); S.face('pl', 'lilyg');
    S.sfx('chime');
    await S.narr('她的脚步很轻，像是踩在舞池光滑的地板上。\n恍惚之间，你好像听见了单簧管，听见了很多人的笑声，看见了头顶上一串一串的彩灯——');
    await S.walk('lilyg', 'ru', 1.2); S.face('lilyg', 'pl'); S.face('pl', 'lilyg');
    await S.narr('一曲终了。');
    await S.say('莉莉', '这是我的最后一支舞。……谢谢你，替比利跳完了它。', { style: 'whisper' });
    await S.alpha('lilyg', 0, 2200);
    await S.narr('你的手里，只剩下一点雨水。');
    if (f.coat) {
      f.coatBack = true; grave.coat = false; S.wear('@me');
      await S.narr('你把外套从墓碑上拿下来，穿在身上。\n夹克湿漉漉的，可里子是暖的。');
    }
    S.goal('回到车上');
    S.cp('rest');
  }
  const wispCatch = async S => {
    S.sfx('whisper');
    await S.scare('flash', { sfx: 'scream', dur: .8 });
    await S.die('那团绿光贴上来的一瞬间，你听见了很多很多人的声音。\n它们挤在你耳朵边上，说的都是同一句话：\n「送我回家。」', '你留在了墓园里');
  };
  const shadeCatch = async S => {
    await S.scare('face', { spr: '@shade', dur: 1 });
    await S.die('一只冰凉的手，轻轻搭在了你的后颈上。\n你最后想到的是：刚才，真不该背过身去。', '你没有看着它');
  };
  const ZONE = (x, y) => x >= 2 && x <= 27 && y >= 2 && y <= 17;
  function wander(e, m) {
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), d = (Math.random() * 4) | 0;
    const nx = ex + DIRS[d][0], ny = ey + DIRS[d][1];
    if (ZONE(nx, ny) && passable(m, nx, ny, e)) startMove(e, d, 1.1);
  }
  let wispIntroSeen = false;

  /* ---------- 结局 ---------- */
  async function finale(S) {
    const f = S.f;
    S.amb('car');
    await S.narr('你坐回驾驶座，发动了车子。' + (f.coat ? '\n副驾驶座上还是湿的。你没有去擦。' : ''));
    await S.walk('pl', [[56, 6], [61, 6]], 4);
    S.ent('hhg').alpha = 0; S.place('hhg', 56, 5, 2);
    await S.alpha('hhg', .75, 1200);
    await S.narr('后视镜里，墓园的铁门前，站着一个穿白裙子的姑娘。\n她没有招手。她只是站在那里，安安静静地，看着你的车开远。');
    await S.alpha('hhg', 0, 1600);
    await S.narr('雨小了。\n你下意识地往旁边看了一眼——');
    S.sfx('chime');
    await S.narr('副驾驶座上，放着一朵白色的栀子花。\n花瓣上全是水珠，像是刚刚才从雨里摘下来的。');
    await S.fade(1, 1400);
    await S.card('第二天早上', '', '你把车开回了沃尔特的加油站。\n老沃尔特什么也没问，只是给你倒了一杯热咖啡，\n然后翻开那个旧账本，在最后一页上写下：\n\n1976.10.23　农场的雷。' + (f.coat ? '借了一件夹克。' : '') + '\n她到家了。\n\n他合上本子，看着窗外的雨，很久没有说话。');
    await S.end({ title: '第七夜　完', text: '后来，你在老磨坊路上又开了很多年的车。\n你再也没有见过她。\n\n只是每年十月二十三号，不管那天下不下雨——\n你那辆车的副驾驶座，总会湿一小块。' });
  }

  defChapter({
    id: 'hitchhiker', n: 7, title: '消失的搭车客', sub: '雨夜的老公路上，穿白色舞裙的姑娘招手搭车。她说，她只想回家。', origin: '美国都市传说', color: '#22303e',
    icon: '@lily', amb: 'rain', floor: 'asphalt', wall: 'wood', dark: .82, plr: 2.6,
    people: {
      me: { skin: '#eac4a0', hair: '#5a3a22', hs: 'short', top: '#2e3a5e', top2: '#d8d0c0', bottom: '#3a4a6a', shoes: '#3a2a1e' },
      me2: { key: 'hh-me2', skin: '#eac4a0', hair: '#5a3a22', hs: 'short', top: '#8a3a2a', top2: '#d8c8a8', bottom: '#3a4a6a', shoes: '#3a2a1e', extra(g, d, fr, G, R) { if (d !== 3) { R(4, G.tT + 3, 8, 1, '#6a2a20'); R(4, G.tT + 6, 8, 1, '#6a2a20'); } } },
      walt: { skin: '#e2b48e', hair: '#b0b0b0', hs: 'short', hat: 'cap', hatC: '#9a2a20', top: '#4a5a6a', top2: '#d8d0c0', bottom: '#3a4048', shoes: '#2a2018' },
      lily: { key: 'hh-lily', skin: '#ece2dc', hair: '#2e221c', hs: 'long', top: '#eeebe4', top2: '#f8f6f0', bottom: '#eeebe4', dress: true, shoes: '#d8d0c8',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 1, 2, 2, '#fffdf0'); R(6, G.tT + 1, 1, 1, '#d8d090'); R(3, G.tT + 1, 1, 4, '#2e221c'); R(12, G.tT + 2, 1, 3, '#2e221c'); R(5, 22, 1, 1, '#8fb0c8'); R(10, 21, 1, 1, '#8fb0c8'); } else if (d === 1) { R(5, G.tT + 1, 2, 2, '#fffdf0'); R(10, G.tT + 2, 1, 4, '#2e221c'); R(6, 22, 1, 1, '#8fb0c8'); } } },
      lilyg: { key: 'hh-lilyg', skin: '#e4e8ee', hair: '#2e2628', hs: 'long', top: '#eef0f4', top2: '#f8f8fc', bottom: '#eef0f4', dress: true, ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 1, 2, 2, '#fffdf0'); R(3, G.tT + 1, 1, 4, '#2e2628'); R(12, G.tT + 2, 1, 3, '#2e2628'); } } },
      harper: { skin: '#ecccb4', hair: '#dcdcdc', hs: 'bun', top: '#6a5a6e', top2: '#e8e0d8', bottom: '#4a3e4c', skirt: true, shoes: '#2a2228' },
      shade: { skin: '#bfc4c8', hair: '#8a9098', hs: 'long', cover: true, top: '#aab0b8', ghost: true }
    },
    items: {
      gardenia: { name: '白栀子花', desc: '哈珀太太每年今天都会买的一朵栀子花。花瓣厚厚的，香得发甜。' },
      lantern: { name: '马灯', desc: '守墓人工具棚门口挂着的煤油马灯。玻璃罩上有一道裂纹。' }
    },
    notes: {
      log: { title: '沃尔特的旧账本（最后几页）', text: '（前面记的是油钱和赊账。最后几页的字迹不一样了，像是不同年份写上去的。）\n\n1951.10.23　卡车司机，从得梅因来。说在桥头载了个穿白裙子的姑娘，开到墓园那段，人没了。咖啡洒了一裤子。\n1955.10.22　推销员。说她跟他要了根烟，没点就不见了。（不像。她不抽烟。）\n1959.10.23　送牛奶的小汉森。座位是湿的。他哭了。\n1963.10.23　两个大学生，开玩笑去桥头等她，没等到。回来的路上，后座多了一摊水。\n1968.10.23　开旅行车的一位太太。姑娘问她：今天几号？\n1971.10.23　借走了一条红围巾。第二天在圣安妮墓园找着了，叠得方方正正。\n\n（最后一行，墨水最新：）\n每年都是二十三号前后，每年都是那座桥。\n莉莉，你到底是想去哪儿？' },
      clip: { title: '旧剪报 ·《艾什福德信使报》1948年10月25日', text: '本周六深夜十一时许，一辆从月光舞厅返家的轿车在老磨坊路的磨坊溪桥上打滑，撞断护栏，坠入溪中。\n\n车上十七岁的莉莲·哈珀小姐不幸遇难。驾车的同学比利·肖受轻伤，被闻讯赶来的加油站拖车司机沃尔特·克兰先生从水中救起。\n\n据舞会上的同学回忆，哈珀小姐当晚身穿一条白色舞会礼服，胸前别着一朵栀子花。她是当晚最后一个离开舞池的人。\n\n葬礼将于周三上午在圣安妮墓园举行。' },
      dancecard: { title: '舞伴卡 · 月光舞厅秋季舞会　1948.10.23', text: '（一张巴掌大的硬纸卡，用丝带系着一支小铅笔。那个年代的姑娘们，用它记下每一支舞的舞伴。）\n\n1. 狐步　——　比利\n2. 华尔兹　——　比利\n3. 林迪舞　——　汤米（踩了我两脚！）\n4. 狐步　——　比利\n5. 伦巴　——　（坐着休息，鞋子太挤）\n6. 华尔兹　——　比利\n7. 最后一支舞　——　\n\n（最后一栏是空的。卡片背面，有一行很小的字：）\n比利保证十一点半之前送我到家。妈妈说，晚一分钟都不行。' },
      keeper: { title: '守墓人日志（钉在工具棚门上）', text: '1955.10.24　哈珀家姑娘的碑上搭着一件男式外套。不知道是谁的。挂在棚里，一直没人来领。\n1962.10.24　又是一件。灰色呢子大衣，口袋里有一张加油站的收据。\n1971.10.24　一条红围巾，叠得方方正正。\n\n给接我班的人：\n夜里别往旧墓区走。磷火多。老人们说，那些是一直没人来接的。它们跟着人走，走得慢，别停下来就行。\n要是看见一个白影子，就盯着它，倒退着走。\n它只在你不看它的时候，才往前挪。' }
    },
    legend: '「消失的搭车客」（The Vanishing Hitchhiker）大概是美国流传最广的都市传说。骨架几乎从不改变：夜里开车的人在路边载上一个年轻姑娘——常常穿着白裙子，或者刚从舞会回来——她报出一个地址，一路上很少说话；车开到半路，人却不见了。司机按地址找过去，开门的老人告诉他：那是我的女儿，很多年前的今天死在这条路上。你不是第一个了。\n\n1942到1943年，民俗学家理查德·比尔兹利和罗莎莉·汉基在《加利福尼亚民俗季刊》上发表了对这个故事的系统研究，他们从全美各地收集了七十多个书面版本，归纳出几种主要类型。据说更早的版本里，载人的是马车或骑马的旅人；欧洲民间也有许多「途中消失的乘客」的故事。1981年，扬·哈罗德·布鲁范德用它做了自己那本都市传说研究的书名，这本书也让「都市传说」这个说法走进了大众视野。\n\n故事在流传中长出了许多细节：座椅是湿的；姑娘借走了司机的外套或围巾，第二天这件衣服整整齐齐地搭在她的墓碑上；她只问今天是几号。芝加哥西南郊的「复活玛丽」是最有名的地方版本之一：据说她是一个穿白色舞裙的金发姑娘，在阿彻大道上的舞厅跳完舞后搭车，车经过复活公墓门口时，她就消失了——几十年来一直有司机说自己载过她。\n\n它几乎是世界性的。夏威夷的版本里，搭车的是火山女神佩蕾；中国和东南亚有出租车司机载到「不存在的乘客」、第二天在钱箱里发现冥币的故事；据说2011年东日本大地震之后，石卷一带的出租车司机也讲起过载到海啸遇难者的经历，一位大学生把这些讲述写进了毕业论文。人们一遍遍讲它，也许是因为它讲的不只是鬼，而是那些没能回家的人，和一直在等门的人。\n\n（本章的老磨坊路、艾什福德镇、圣安妮墓园、月光舞厅、哈珀一家、沃尔特加油站，以及所有人物和情节，均为游戏虚构。）',
    start: { map: 'store', x: 3, y: 5, dir: 3 },
    resume: { cem: async S => { S.plr(S.has('lantern') ? 3.1 : 1.3); } },
    async intro(S) {
      wispIntroSeen = false;
      await S.card('第七夜　消失的搭车客', '1976年10月23日　美国艾奥瓦州　老磨坊路', '下了一整天的冷雨。\n你在城里的罐头厂上完夜班，开着老爸那辆旧雪佛兰回农场。\n抄老磨坊路，能省半个钟头。\n\n油表的指针，已经贴在了 E 上。');
    },
    sprites: {
      auto(g, e, t, R) { carSpr(e, R, false); },
      autop(g, e, t, R) { carSpr(e, R, true); },
      hgate(g, e, t, R) {
        const S1 = '#5a5852', Sd = '#34322e', I = '#16161a', Il = '#3a3a44';
        R(-5, -14, 6, 29, Sd); R(-4, -13, 4, 27, S1); R(-6, -16, 8, 3, Sd);
        R(15, -14, 6, 29, Sd); R(16, -13, 4, 27, S1); R(14, -16, 8, 3, Sd);
        R(0, -12, 16, 2, I); R(2, -15, 12, 2, I); R(7, -20, 2, 6, I); R(5, -18, 6, 1, I);
        if (e.open) { for (const x of [0, 2, 13, 15]) R(x, -10, 1, 25, I); R(0, -6, 3, 1, Il); R(13, -6, 3, 1, Il); R(6, 13, 5, 1, '#6a645a'); R(5, 14, 2, 1, '#6a645a'); }
        else { for (let x = 1; x < 16; x += 2) R(x, -10, 1, 25, I); R(0, -6, 16, 1, Il); R(0, 8, 16, 1, Il); R(4, 0, 8, 1, '#7a7468'); R(3, 1, 2, 2, '#7a7468'); R(11, 1, 2, 2, '#7a7468'); R(7, 2, 2, 3, '#6a5a3a'); }
      },
      hgrave(g, e, t, R) {
        const k = e.kind || 'round', S1 = e.stone || '#6e6c68', Sd = shade(S1, -.4), Sl = shade(S1, .14);
        R(1, 13, 14, 2, 'rgba(0,0,0,.35)');
        if (k === 'round') { R(3, 1, 10, 13, Sd); R(4, 0, 8, 1, Sd); R(4, 1, 8, 12, S1); R(5, 0, 6, 1, S1); R(5, 2, 1, 8, Sl); R(6, 4, 4, 1, Sd); R(6, 6, 4, 1, Sd); }
        else if (k === 'cross') { R(6, -6, 4, 20, Sd); R(7, -5, 2, 18, S1); R(2, -2, 12, 4, Sd); R(3, -1, 10, 2, S1); R(4, 12, 8, 3, Sd); }
        else if (k === 'small') { R(5, 7, 6, 7, Sd); R(6, 6, 4, 7, S1); R(6, 6, 1, 4, Sl); }
        else if (k === 'obelisk') { R(5, -10, 6, 24, Sd); R(6, -9, 4, 22, S1); R(7, -12, 2, 3, Sd); R(3, 11, 10, 4, Sd); R(6, -8, 1, 18, Sl); }
        else if (k === 'flat') { R(2, 6, 12, 8, Sd); R(3, 7, 10, 6, S1); R(5, 9, 6, 1, Sd); }
        else if (k === 'double') { R(-1, 1, 18, 13, Sd); R(0, 2, 16, 11, S1); R(7, 2, 1, 11, Sd); R(2, 4, 4, 1, Sd); R(10, 4, 4, 1, Sd); R(2, 6, 3, 1, Sd); R(10, 6, 3, 1, Sd); }
        if (e.moss) for (let i = 0; i < 7; i++) R(4 + ((hash(i, e.x, 3) * 8) | 0), 2 + ((hash(i, e.y, 4) * 10) | 0), 2, 1, '#3e5a32');
        if (e.carve === 'gardenia') { R(7, 8, 2, 2, '#e8e4d8'); R(6, 9, 1, 1, '#c8c4b8'); R(9, 9, 1, 1, '#c8c4b8'); R(7, 10, 2, 1, '#c8c4b8'); }
        if (e.carve === 'lily') { R(7, 4, 1, 6, '#d0d0c4'); R(6, 4, 1, 2, '#d0d0c4'); R(8, 4, 1, 2, '#d0d0c4'); }
        if (e.carve === 'rose') { R(7, 6, 2, 2, '#9a6a64'); R(8, 8, 1, 4, '#5a6a4a'); }
        if (e.coat) { R(2, -2, 12, 6, '#1a2038'); R(3, -1, 10, 4, '#2e3a5e'); R(4, -1, 8, 1, '#44507a'); R(7, 0, 1, 2, '#e8e8e8'); R(8, 0, 1, 1, '#e8e8e8'); R(1, 1, 2, 5, '#2e3a5e'); }
        if (e.flowers) { R(5, 12, 4, 3, '#f6f4ea'); R(6, 13, 2, 1, '#e0d890'); R(9, 14, 3, 1, '#3a5a2a'); }
      },
      wisp(g, e, t, R) {
        const b = Math.round(Math.sin(t * 3 + e.px * .07) * 2), fl = Math.sin(t * 9 + e.py) > .6;
        R(4, 1 + b, 8, 8, 'rgba(110,255,180,.16)'); R(5, 2 + b, 6, 6, 'rgba(140,255,200,.35)'); R(6, 3 + b, 4, 4, fl ? '#d8fff0' : 'rgba(190,255,220,.85)'); R(7, 4 + b, 2, 2, '#f4fff8');
        R(7, 9 + b, 2, 2, 'rgba(120,255,190,.3)'); R(8, 11 + b, 1, 2, 'rgba(120,255,190,.18)');
      },
      pump(g, e, t, R) { R(2, 14, 12, 2, 'rgba(0,0,0,.4)'); R(3, -10, 10, 25, '#5a5650'); R(4, -9, 8, 23, '#d8d0c0'); R(4, -9, 8, 4, '#a02a24'); R(5, -3, 6, 4, '#1a1e14'); R(6, -2, 4, 1, '#c8e070'); R(13, -4, 2, 10, '#222'); R(12, 5, 3, 2, '#444'); R(5, 4, 6, 1, '#a8a090'); },
      ctr(g, e, t, R) {
        SPR.counter(g, e, t, R);
        const it = e.item;
        if (it === 'radio') { R(2, -5, 12, 8, '#4a2e18'); R(3, -4, 6, 6, '#c8b088'); for (let y = -3; y < 2; y += 2) R(3, y, 6, 1, '#8a7050'); R(10, -3, 3, 3, Math.sin(t * 2) > 0 ? '#ffc860' : '#e8a040'); R(11, 1, 1, 1, '#c9a35a'); }
        if (it === 'register') { R(3, -6, 10, 9, '#444'); R(4, -5, 8, 3, '#1a2a1a'); R(5, -4, 5, 1, '#7aff7a'); for (let i = 0; i < 3; i++) R(4 + i * 3, 0, 2, 1, '#bbb'); }
        if (it === 'ledger') { R(3, -2, 10, 5, '#5a2a1a'); R(4, -2, 8, 1, '#e8e0c8'); R(8, -2, 1, 5, '#3a1a10'); if (!e.read) R(7, -7 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); }
        if (it === 'coffee') { R(4, -3, 8, 5, '#2a2a2a'); R(5, -8, 6, 6, 'rgba(160,190,200,.6)'); R(5, -5, 6, 3, '#3a2010'); R(11, -6, 2, 3, '#2a2a2a'); R(6, -10 + Math.sin(t * 2), 1, 2, 'rgba(230,230,230,.4)'); }
        if (it === 'vase') { R(5, -6, 4, 7, '#a8c0c8'); if (e.full) { R(3, -11, 3, 3, '#f8f6ec'); R(7, -12, 3, 3, '#f6f4e8'); R(9, -9, 3, 3, '#f8f6ec'); R(5, -8, 1, 3, '#3a5a2a'); } else { R(6, -10, 3, 3, '#f8f6ec'); R(7, -8, 1, 3, '#3a5a2a'); } }
      },
      bigphoto(g, e, t, R) {
        R(1, 0, 30, 13, '#2a1c10'); R(2, 1, 28, 11, '#8a8478');
        for (let i = 0; i < 9; i++) { R(3 + i * 3, 3 + (i % 2), 2, 3, '#3a3630'); R(3 + i * 3, 2 + (i % 2), 2, 1, '#c8b8a0'); }
        for (let i = 0; i < 6; i++) if (i !== 3) { R(4 + i * 4, 7, 2, 4, i % 2 ? '#d8d0c0' : '#2a2620'); R(4 + i * 4, 6, 2, 1, '#c8b8a0'); }
        R(15, 6, 3, 5, '#f8f6f0'); R(15, 5, 3, 2, 'rgba(210,205,200,.9)'); R(16, 7, 1, 1, '#fffde0');
      },
      calendar(g, e, t, R) { R(4, 1, 8, 11, '#e8e4d8'); R(4, 1, 8, 3, '#a02a24'); for (let y = 5; y < 11; y += 2) for (let x = 5; x < 11; x += 2) R(x, y, 1, 1, '#8a8478'); R(8, 8, 3, 3, '#c02020'); R(9, 9, 1, 1, '#e8e4d8'); },
      wallmap(g, e, t, R) { R(1, 1, 14, 11, '#d8d0a8'); R(2, 6, 12, 1, '#8a3a2a'); R(6, 2, 1, 9, '#3a6a9a'); R(9, 3, 3, 2, '#6a8a5a'); R(8, 7, 1, 1, '#ff2020'); R(7, 8, 1, 1, '#ff2020'); R(9, 8, 1, 1, '#ff2020'); R(7, 6, 1, 1, '#ff2020'); R(9, 6, 1, 1, '#ff2020'); },
      lphoto(g, e, t, R) { R(3, 0, 10, 13, '#6a4a1a'); R(4, 1, 8, 11, '#c9a35a'); R(5, 2, 6, 9, '#2a2a2e'); R(6, 3, 4, 3, '#e8dcd0'); R(5, 2, 6, 2, '#2e221c'); R(5, 4, 1, 4, '#2e221c'); R(10, 4, 1, 4, '#2e221c'); R(6, 6, 4, 5, '#eeebe4'); R(6, 7, 1, 1, '#fffde0'); },
      wphoto(g, e, t, R) { R(4, 3, 8, 9, '#e8e4d8'); R(5, 4, 6, 6, '#6a6a6e'); R(6, 5, 1, 4, '#2a2a2a'); R(6, 4, 1, 1, '#d8c8b0'); R(8, 6, 2, 4, '#e8e8e8'); R(8, 5, 2, 1, '#d8c8b0'); },
      mbdresser(g, e, t, R) { SPR.dresser(g, e, t, R); R(4, -4, 8, 4, '#6a3a5a'); R(4, -4, 8, 1, '#8a5a7a'); if (e.open) { R(4, -9, 8, 5, '#8a5a7a'); R(5, -8, 6, 3, '#b8a8b8'); R(7, -7 + (Math.sin(t * 6) > 0 ? 1 : 0), 2, 3, '#fff'); } R(7, -2, 2, 1, '#c9a35a'); },
      sidetable(g, e, t, R) { SPR.table(g, e, t, R); R(4, -2, 8, 5, '#7a2a2a'); R(4, -2, 8, 1, '#a04040'); R(5, 0, 6, 1, '#c9a35a'); },
      hhouse(g, e, t, R) {
        const W1 = e.col || '#5a5048', Wd = shade(W1, -.4), RF = '#1e181c';
        R(-2, -26, 52, 4, RF); R(0, -30, 48, 4, RF); R(4, -33, 40, 3, RF); R(0, -26, 48, 1, '#3a3034');
        R(0, -22, 48, 37, Wd); R(1, -21, 46, 35, W1);
        for (let y = -19; y < 14; y += 4) R(1, y, 46, 1, shade(W1, -.15));
        const win = (x, y) => { R(x, y, 8, 9, '#1a1410'); R(x + 1, y + 1, 6, 7, e.lit ? '#e8c878' : '#0e1420'); R(x + 4, y + 1, 1, 7, '#1a1410'); R(x + 1, y + 4, 6, 1, '#1a1410'); };
        win(5, -16); win(35, -16); win(5, 1); win(35, 1);
        R(19, 0, 10, 15, '#1a1410'); R(20, 1, 8, 14, e.lit ? '#5a3a24' : '#33251a'); R(26, 8, 1, 1, '#c9a35a');
        if (e.lit) { R(23, -4, 2, 3, '#ffe8a0'); }
        R(16, 14, 16, 2, '#4a4440');
      },
      mailbox(g, e, t, R) { R(7, 2, 2, 13, '#4a3a2a'); R(3, -3, 10, 6, '#3a4a5a'); R(3, -3, 10, 1, '#5a6a7a'); R(12, -7, 1, 5, '#c02020'); R(12, -7, 2, 2, '#c02020'); R(5, -1, 1, 3, '#eee'); R(7, -1, 2, 1, '#eee'); R(8, 0, 1, 2, '#eee'); },
      barrier(g, e, t, R) { R(1, 8, 2, 7, '#3a3a3a'); R(13, 8, 2, 7, '#3a3a3a'); R(-1, 3, 18, 5, '#e8e0d0'); for (let x = 0; x < 16; x += 6) R(x, 3, 3, 5, '#c03020'); if (e.lamp) { R(6, -2, 4, 5, '#3a3a3a'); R(7, -1, 2, 3, '#ffb040'); } },
      shed(g, e, t, R) { R(0, -14, 32, 29, '#2e241a'); R(1, -13, 30, 27, '#4a3a2a'); for (let x = 1; x < 31; x += 4) R(x, -13, 1, 27, '#3a2c1e'); R(-2, -18, 36, 5, '#1e1a16'); R(10, 0, 12, 15, '#1a120c'); R(14, 3, 4, 5, '#e8e0c8'); R(15, 4, 2, 1, '#6a6050'); R(15, 6, 2, 1, '#6a6050'); },
      mausoleum(g, e, t, R) { R(0, -20, 48, 35, '#3a3834'); R(1, -19, 46, 33, '#56534c'); R(-2, -24, 52, 5, '#2a2826'); R(10, -28, 28, 4, '#2a2826'); R(18, -31, 12, 3, '#2a2826'); for (const x of [4, 12, 32, 40]) { R(x, -18, 4, 32, '#6a675e'); R(x, -18, 1, 32, '#7a776e'); } R(18, -6, 12, 20, '#121114'); R(19, -12, 10, 3, '#3a3834'); R(16, 13, 16, 2, '#4a4844'); }
    },
    tiles: {
      gravel: { solid: false, paint(R, X, Y) { speck(R, '#46443f', ['#56544e', '#383632', '#62605a'], X, Y, 20, 22); } },
      corn: { solid: true, paint(R, X, Y) { speck(R, '#33291d', ['#3f3426', '#2a2116'], X, Y, 12, 21); for (let i = 0; i < 4; i++) { const x = (i * 4 + ((hash(X, Y, i) * 3) | 0)) % 16; R(x, 3 + (i % 2) * 2, 1, 9, '#6e6038'); R(x, 2 + (i % 2) * 2, 1, 1, '#8e7e50'); if (hash(X, Y, i + 9) < .4) R(x + 1, 6, 2, 1, '#5e5030'); } } },
      ifence: { solid: true, paint(R, X, Y, o) { TILE.grass.paint(R, X, Y, o); R(0, 4, 16, 1, '#1e1e24'); R(0, 12, 16, 1, '#1e1e24'); for (let x = 1; x < 16; x += 3) { R(x, 2, 1, 13, '#16161c'); R(x, 1, 1, 1, '#3a3a44'); } } }
    },
    tileOpts: { grassC: '#24322a', treeC: '#16261a' },
    maps: {
      /* ---------------- 沃尔特加油站（店里） ---------------- */
      store: {
        amb: 'room', dark: .4, plr: 4, wall: 'wood', floor: 'linoleum',
        rows: [
          '##############',
          '##############',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '######n#######'],
        ents: [
          { x: 2, y: 1, spr: 'window', on: S => S.narr('窗外，雨把加油站的招牌灯泡打得一闪一闪。\n玻璃上映出你自己的脸，眼睛下面挂着两块青。') },
          { id: 'bigphoto', x: 5, y: 1, w: 2, spr: 'bigphoto', async on(S) {
            await S.narr('一张放大的老照片，相框玻璃上积了一层油烟。底下的铜牌写着：\n「月光舞厅　1948年秋季舞会」');
            await S.narr('几十个年轻人挤在舞台前面。男孩子们打着领结，头发抹得锃亮；姑娘们的裙摆，像一朵一朵倒扣着的花。');
            await S.narr('前排正中间，站着一个穿白裙子的姑娘，胸前别着一朵白花。\n整张照片上，只有她的脸是糊的——像是快门按下去的那一瞬间，她回了一下头。');
            if (S.f.talked && S.once('photoWalt')) { S.bubble('walt', '…', 1500); await S.say('沃尔特', '……那张照片是我挂的。挂了二十八年了。'); }
          } },
          { x: 8, y: 1, spr: 'calendar', on: S => S.narr('饲料公司送的挂历，翻在十月。\n二十三号那一格，被人用红铅笔圈了起来。圈得很用力，纸都快划破了。') },
          { x: 10, y: 1, spr: 'wallmap', on: S => S.narr('县里的公路地图。老磨坊路从加油站一路往东，跨过磨坊溪，擦着圣安妮墓园的围墙，进艾什福德镇。\n桥和墓园之间，有人用红笔画了一个小小的叉。') },
          { x: 12, y: 1, spr: 'window', on: S => S.narr('外面停着你那辆旧雪佛兰。雨水顺着车顶往下淌，像一层流动的玻璃。') },
          { x: 1, y: 2, spr: 'fridge', light: { r: 1.4, col: 'rgba(160,200,255,.08)' }, on: S => S.narr('冷柜嗡嗡地响。里面只剩几瓶可乐，和一盒不知道放了几天的鸡蛋。') },
          { x: 11, y: 2, spr: 'ctr', item: 'coffee', on: S => S.narr('咖啡壶里的咖啡已经熬得发苦了。旁边摞着一大叠纸杯——比一个乡下加油站一晚上用得着的，多得多。') },
          { x: 7, y: 6, spr: 'shelf', on: S => S.narr('货架上是机油、火花塞、牛肉干，还有一袋落了灰的万圣节南瓜糖。') },
          { x: 8, y: 6, spr: 'shelf', on: S => S.narr('一排地图册和手电筒电池。最底层塞着几把雨伞，伞柄上贴着价签：一块五。') },
          { x: 10, y: 4, spr: 'table', col: '#5a4a3a', on: S => S.narr('靠墙的小桌上摆着两个没洗的咖啡杯，一个杯沿上留着口红印。\n桌面上有人用小刀刻了一行字：「她问我今天几号」。') },
          { x: 9, y: 4, spr: 'chair', col: '#7a3a2a' }, { x: 11, y: 4, spr: 'chair', col: '#7a3a2a' },
          { x: 11, y: 7, spr: 'newspaper', on: S => S.narr('今天的报纸。头版是福特和卡特的最后一场电视辩论。\n角落里的天气预报：「全县有雨，夜间转冷。桥面可能结冰，请谨慎驾驶。」') },
          { id: 'walt', x: 3, y: 3, spr: '@walt', dir: 0, on: waltTalk },
          { x: 1, y: 4, spr: 'ctr', on: S => S.narr('柜台上贴着一张手写的纸条：「24小时拖车服务。夜里敲窗户。」') },
          { x: 2, y: 4, spr: 'ctr', item: 'radio', on: S => S.narr('柜台上的老式收音机，在放一首慢悠悠的乡村歌。\n主持人说：「这首歌，送给今晚还在路上的人。」') },
          { x: 3, y: 4, spr: 'ctr', on: waltTalk },
          { x: 4, y: 4, spr: 'ctr', item: 'register', on: S => S.narr('收银机的小窗口里，绿色的数字还停在 12.40。') },
          { id: 'ledger', x: 5, y: 4, spr: 'ctr', item: 'ledger', async on(S) {
            if (S.once('ledger')) { S.face('walt', 'pl'); await S.say('沃尔特', '想看就看吧。前面是赊账，别笑话我字丑。'); }
            await S.note('log');
          } },
          { x: 6, y: 1, spr: 'invisible', light: { r: 5, col: 'rgba(255,240,200,.06)', dy: 50 } },
          { x: 6, y: 8, spr: 'invisible', touch: async S => { await goP(S, 'road', 5, 2, 0); } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.say('沃尔特', '一共十二块四毛。……这么晚了，还往东开？走老磨坊路？');
          await S.say('雷', '回农场。抄近道能省半个钟头。');
          S.bubble('walt', '…', 1500);
          await S.narr('老沃尔特没有接钱。他回头看了一眼墙上的挂历。');
          await S.say('沃尔特', ['今天二十三号。', '听我一句，孩子。过了磨坊溪那座桥，要是路边有个姑娘朝你招手——', '别停车。']);
          const r = await S.ask('老沃尔特盯着你，没有笑。', ['……为什么？', '（笑）你是说那个鬼故事？'], '雷');
          if (r === 0) await S.say('沃尔特', '因为她不是在等车。她是在等一个肯送她回家的人。');
          else await S.say('沃尔特', '鬼故事？哼。你去问问这些年在我这儿喝热咖啡、手抖得连杯子都端不住的那些人。');
          await S.say('沃尔特', ['穿白裙子，浑身湿透。上了车就说要回家，给你一个地址。', '然后你开着开着，一转头——副驾驶座上就没人了。只剩一摊水。', '这些年跑到我这儿来讲这事的，少说也有十来个。卡车司机、推销员、送牛奶的……我都记在本子上了。']);
          await S.say('雷', '……老板，你自己信吗？');
          await S.say('沃尔特', '我信不信不要紧。我只知道，每年这个晚上，我都会多煮一壶咖啡。');
          S.f.talked = true;
          S.goal('开车回家（车停在门外）');
        }
      },
      /* ---------------- 老磨坊路 ---------------- */
      road: {
        amb: 'rain', dark: .84, plr: 2.4, wall: 'wood', floor: 'asphalt', rain: true, fog: .22,
        legend: LEG, rows: roadRows(),
        ents: [
          // 加油站
          { x: 5, y: 1, spr: 'door', col: '#3a4a3a', lock: S => !S.f.inCar, lockMsg: '你已经坐进车里了。雨这么大，别再耽搁了。', to: ['store', 6, 7, 3] },
          { x: 3, y: 1, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,220,140,.16)', dy: 22 }, on: S => S.narr('店里的灯光是黄的。老沃尔特坐在柜台后面，一动不动地看着窗外的路。') },
          { x: 7, y: 1, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,220,140,.16)', dy: 22 }, on: S => S.narr('窗玻璃上贴着一张褪色的寻人启事，被雨汽洇得只剩一个「寻」字。') },
          { x: 1, y: 2, spr: 'payphone', async on(S) {
            S.sfx('tv');
            await S.narr('你想给家里打个电话，说一声晚点到。\n听筒里没有拨号音，只有沙沙的雨声。');
            await S.narr('……还有很远很远的地方，一支乐队在奏慢三步。\n你挂上了电话。');
          } },
          { x: 3, y: 3, spr: 'pump', on: S => S.narr('老式加油机。转盘上的数字停在 12.40，油枪上滴着雨水。') },
          { x: 6, y: 3, spr: 'pump', on: S => S.narr('这台加油机上挂着一块牌子：「坏了，别用」。底下有人补了一行：「坏了十年了」。') },
          { x: 10, y: 2, spr: 'sign', col: '#7a2a20', light: { r: 1.6, col: 'rgba(255,90,60,.16)', dy: -6 }, on: S => S.narr('「沃尔特加油站　24小时拖车」\n招牌上的灯管坏了一半，只剩「沃尔特　拖车」几个字还亮着。') },
          { x: 4, y: 3, spr: 'invisible', light: { r: 4.4, col: 'rgba(255,230,170,.12)' } },
          { id: 'mycar', x: 8, y: 3, spr: 'auto', dir: 0, async on(S) { await enterCar(S); } },
          { id: 'hl', x: 8, y: 5, spr: 'invisible', hidden: true, light: { r: 3.6, col: 'rgba(255,236,170,.16)' } },
          // 路上
          { x: 14, y: 4, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,220,140,.14)', dy: -2 }, on: S => S.narr('一盏孤零零的路灯，灯罩里积满了死虫子。') },
          { x: 19, y: 10, spr: 'sign', col: '#2a5a3a', on: S => S.narr('里程牌：「艾什福德　6」。\n牌子上有几个锈穿了的小洞，像是被猎枪打过。') },
          { id: 'cross', x: 32, y: 10, spr: 'cross', on: S => S.narr('路边立着一个小小的白色十字架，漆皮已经剥落了。\n十字架脚下，有人放了一朵新鲜的白花。') },
          { x: 34, y: 10, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(220,230,255,.16)', dy: -4 }, on: S => S.narr('桥头的路灯。冷白色的光底下，雨丝看得清清楚楚。') },
          { id: 'hh', x: 33, y: 9, spr: '@lily', dir: 1, hidden: true, light: { r: 1.3, col: 'rgba(220,230,255,.14)' }, async on(S) { if (S.f.phase === 'drive1') await encounter(S); } },
          { x: 44, y: 4, spr: 'streetlamp', flicker: true, light: { r: 3, col: 'rgba(255,220,140,.1)', dy: -2 }, on: S => S.narr('路灯一闪一闪的，像是随时会灭掉。') },
          { x: 53, y: 10, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,220,140,.12)', dy: -2 } },
          // 墓园（路北）
          { x: 51, y: 2, spr: 'gravestone' }, { x: 54, y: 3, spr: 'gravestone' }, { x: 53, y: 1, spr: 'cross' }, { x: 58, y: 2, spr: 'gravestone' }, { x: 60, y: 3, spr: 'gravestone' }, { x: 59, y: 1, spr: 'statue' },
          { id: 'rgate', x: 56, y: 4, spr: 'hgate', async on(S) {
            if (S.f.phase === 'tocem' || S.f.rest) return gatePrompt(S);
            await S.narr('「圣安妮墓园」。\n铁门上缠着一圈生锈的铁链，挂着一把大锁。门里面黑沉沉的，只有雾在动。');
          } },
          { id: 'hhg', x: 56, y: 5, spr: '@lilyg', solid: false, hidden: true, light: { r: 1.8, col: 'rgba(210,225,255,.2)' } },
          // 艾什福德镇
          { x: 63, y: 4, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,220,140,.12)', dy: -2 } },
          { x: 64, y: 3, w: 3, spr: 'hhouse', col: '#4a5258', on: S => S.narr('邻居家的窗户全黑着。屋里有条狗叫了两声，又不叫了。') },
          { x: 67, y: 4, spr: 'mailbox', on: S => S.narr('信箱上用白漆写着：「17　哈珀」。\n漆刷了一层又一层，最底下那层字，看起来很旧很旧了。') },
          { id: 'hhouse', x: 68, y: 3, w: 3, spr: 'hhouse', col: '#6a5a4a', lit: true, on: S => S.f.phase === 'toaddr' ? arriveHouse(S) : S.narr('一栋白色护墙板的老房子。窗户里透着昏黄的灯光。\n这么晚了，门廊的灯还亮着。') },
          { x: 69, y: 4, spr: 'invisible', light: { r: 2.8, col: 'rgba(255,210,130,.2)' } },
          { x: 71, y: 4, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,220,140,.12)', dy: -2 } },
          { x: 72, y: 3, w: 3, spr: 'hhouse', col: '#584a4a', on: S => S.narr('窗台上摆着一排南瓜灯，都没有点。') },
          ...[6, 7, 8].map(y => ({ x: 77, y, spr: 'barrier', lamp: y === 7, light: y === 7 ? { r: 2.2, col: 'rgba(255,170,60,.18)', dy: 2 } : null, on: S => S.narr('「前方积水　道路封闭」\n木头路障上挂着一盏快没油的马灯。再往前，磨坊溪漫过了路面。') }))
        ],
        async enter(S, first) {
          const f = S.f;
          S.plr(null);
          if (!f.inCar) {
            S.amb('rain');
            if (first) { await S.narr('雨比刚才更大了。你那辆旧雪佛兰停在加油机旁边，车顶上溅着一层白蒙蒙的水花。'); S.goal('上车'); }
            return;
          }
          S.amb('car');
          if (f.rest) { if (S.once('finale')) await finale(S); return; }
          if (f.phase === 'tocem' && S.once('tocemIntro')) {
            await S.narr('你回到车上。副驾驶座还是湿的。\n你把那朵栀子花小心地放在了仪表台上。');
            S.goal('去圣安妮墓园（往西开，墓园大门）');
            S.cp('tocem');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (!f.inCar) {
            if (y >= 6 || x >= 11) return (async () => { await S.narr('雨水顺着领口往里灌。走回农场得走上一整夜——\n还是开车吧。'); await S.walk('pl', y >= 6 ? 'u' : 'l', 5); })();
            return;
          }
          if (f.phase === 'drive1') {
            if ((f.pass || 0) < 2 && x >= f.hx - 8 && S.ent('hh').hidden) { S.show('hh'); S.sfx('whisper'); }
            if (x >= f.hx - 2) return encounter(S);
            return;
          }
          if (f.phase === 'ride') return rideStep(S, x);
          if (f.phase === 'toaddr') { if (x === 69) return arriveHouse(S); return; }
          if (f.phase === 'tocem') {
            if (x === 56) { if (!f.skipGate) return gatePrompt(S); return; }
            f.skipGate = false;
            if (!f.warned && x <= 51) return warn(S);
            if (f.warned && x <= 46) return crash(S);
          }
        },
        tick(S) {
          const hl = getEnt('hl', 'road'); if (!hl) return;
          const p = S.pl, car = inCar(S);
          hl.hidden = !car;
          if (car) { const d = DIRS[p.dir]; hl.px = p.px + d[0] * 36; hl.py = p.py + d[1] * 36; }
        }
      },
      /* ---------------- 枫树街十七号 ---------------- */
      house: {
        amb: 'fire', dark: .6, plr: 3, wall: 'paper', floor: 'wood', tileOpts: { rugC: '#5a3a3a', woodC: '#5e4430' },
        rows: [
          '################',
          '################',
          '#wwwwwwwwwwlllw#',
          '#wwwrrrrwwwlllw#',
          '#wwwrrrrwwwlllw#',
          '#wwwrrrrwwwlllw#',
          '#wwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwww#',
          '#######w########'],
        ents: [
          { x: 1, y: 2, spr: 'stairsup', solid: false, to: ['lroom', 2, 6, 2] },
          { x: 2, y: 1, spr: 'window', on: S => S.narr('窗外是枫树街。整条街都睡了，只有你的车停在路边，车灯还开着。') },
          { id: 'fire', x: 4, y: 2, w: 2, spr: 'fireplace', light: { r: 4.4, col: 'rgba(255,140,60,.22)', flick: true }, on: S => S.narr('壁炉里的火烧得很小，像是怕把屋子烤暖了似的。\n壁炉台上的座钟，指针停在十一点四十分。钟面上落了一层灰，钟摆却被人擦得锃亮。') },
          { x: 4, y: 2, ox: 8, oy: -14, z: 1, spr: 'wallclock', solid: false },
          { id: 'lphoto', x: 8, y: 1, spr: 'lphoto', async on(S) {
            if (S.f.photo) return S.narr('照片里的莉莉微微歪着头，在笑。\n她不知道，自己会一直停在十七岁。');
            S.sfx('sting');
            await S.narr('墙上挂着一个姑娘的照片。黑白照，边上用手工上了一点颜色：白裙子，栀子花，微微歪着头笑。');
            await S.narr('……是她。\n车上的那个姑娘。连头发别在耳朵后面的样子，都一模一样。');
            await S.narr('照片下面的木框上，刻着一行小字：「莉莲　1931—1948」。');
            S.f.photo = true;
            S.goal('和哈珀太太谈谈');
          } },
          { x: 10, y: 2, spr: 'sidetable', async on(S) {
            await S.narr('小桌上放着一个饼干铁盒，盒盖已经合不上了——里面塞满了信。');
            await S.narr('信封上的邮戳，从1950年代一直到今年春天。得梅因、奥马哈、芝加哥、圣路易斯……\n你抽出最上面的一封。「亲爱的哈珀太太，您不认识我……」\n每一封的开头，都差不多。');
          } },
          { x: 14, y: 1, spr: 'window', on: S => S.narr('窗台上摆着一盆半死不活的天竺葵。玻璃上的雨，一道一道往下流。') },
          { x: 12, y: 2, spr: 'stove', on: S => S.narr('炉子上坐着一把水壶，水早就凉了。') },
          { x: 13, y: 2, spr: 'sink', on: S => S.narr('水池里只有一个杯子，一个盘子。') },
          { id: 'ktable', x: 12, y: 4, spr: 'ctr', item: 'vase', full: true, col: '#7a5a3a', async on(S) {
            const e = S.ent('ktable');
            if (!S.f.story) return S.narr('桌上的玻璃瓶里插着几朵白色的栀子花，香得发甜。\n不是你的东西，还是先别碰了。');
            if (S.has('gardenia') || S.f.rest) return S.narr('瓶子里剩下的那朵栀子花，花瓣边上已经开始发黄了。');
            e.full = false; S.give('gardenia');
            await S.narr('你从瓶子里抽出一朵栀子花。花茎是湿的，冰凉冰凉。');
            S.goal('去圣安妮墓园，找到莉莉的墓');
          } },
          { x: 13, y: 4, spr: 'chair', col: '#6a4a30', on: S => S.narr('餐桌边只有一把椅子。另外两把，靠墙放着，椅面上落满了灰。') },
          { id: 'sofa', x: 1, y: 6, w: 2, spr: 'sofa', col: '#4a3a4a', async on(S) {
            if (S.once('album')) await S.narr('沙发扶手上放着一本厚厚的剪贴簿。翻开的那一页上，贴着一张发黄的剪报。');
            await S.note('clip');
          } },
          { x: 6, y: 4, spr: 'armchair', col: '#5a3a3a' },
          { id: 'harper', x: 7, y: 6, spr: '@harper', dir: 0, on: harperTalk },
          { x: 9, y: 7, spr: 'plant', on: S => S.narr('门边的伞架上插着一把男式的黑伞。伞面早就干透了，像是很多年没人撑过。') },
          { x: 7, y: 8, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (!f.story) { await S.narr('就这么走了？……哈珀太太还在看着你。'); return S.walk('pl', 'u', 5); }
            if (!S.has('gardenia') && !f.rest) { await S.narr('哈珀太太说的那朵花，还在餐桌的瓶子里。'); return S.walk('pl', 'u', 5); }
            S.face('harper', 'pl');
            await S.say('哈珀太太', f.rest ? '……谢谢你，孩子。' : '路上小心，孩子。下雨天，那座桥很滑。');
            if (!f.rest) { f.phase = 'tocem'; S.ent('rgate').open = true; }
            await goP(S, 'road', 69, 6, 1, true);
          } }
        ],
        async enter(S, first) {
          S.plr(null);
          if (!first) return;
          S.sfx('knock'); await S.wait(450); S.sfx('knock'); await S.wait(450); S.sfx('knock');
          await S.narr('你敲了三下门。\n过了很久，门开了一条缝。一个头发全白了的老太太，扶着门框看着你。');
          S.face('harper', 'pl');
          await S.say('老太太', '……这么晚了。');
          await S.say('雷', '对不起，太太，这么晚打扰您。我……刚才在路上载了一个姑娘，她说她住在这儿，枫树街十七号。她叫莉莉。');
          await S.say('雷', '可她……她在半路上……');
          S.bubble('harper', '…', 1800);
          await S.wait(800);
          await S.say('老太太', ['穿白裙子。头发湿透了。', '她问你，今天是几号。']);
          await S.say('雷', '……您怎么知道？');
          await S.say('老太太', '进来吧，孩子。外面冷。');
          await S.walk('harper', [6, 4], 2);
          S.ent('harper').oy = -3; S.face('harper', 0);
          await S.narr('她慢慢地走回扶手椅，坐了下来，朝墙上抬了抬下巴。');
          S.goal('看看墙上的照片');
        }
      },
      /* ---------------- 莉莉的房间 ---------------- */
      lroom: {
        amb: 'room', dark: .72, plr: 2.8, wall: 'paper', floor: 'carpet', tileOpts: { carpetC: '#5a3e4a' },
        rows: [
          '###########',
          '###########',
          '#cccccccc.#',
          '#ccccccccc#',
          '#ccccccccc#',
          '#ccccccccc#',
          '#ccccccccc#',
          '###########'],
        ents: [
          { id: 'lbed', x: 2, y: 2, h: 2, spr: 'bed', col: '#e8dce0', on: S => S.narr('床铺得整整齐齐，枕头上坐着一只褪了色的布兔子。\n被子上落着一层薄薄的灰——二十八年了，没有人在上面睡过。') },
          { id: 'lwin', x: 5, y: 1, spr: 'window', async on(S) {
            if (!S.once('reflect')) return S.narr('窗外是雨。窗玻璃里映着你自己，和你身后空荡荡的房间。');
            await S.narr('窗玻璃上全是雨。玻璃里映出你身后的房间——');
            S.sfx('whisper'); S.ent('lwin').face = true;
            await S.narr('床沿上，坐着一个穿白裙子的人。');
            await S.wait(600); S.ent('lwin').face = false;
            S.sfx('heart');
            await S.narr('你猛地回过头。\n床上只有那只布兔子，歪着脑袋看着你。');
          } },
          { id: 'mbox', x: 6, y: 2, spr: 'mbdresser', col: '#6a4a3a', async on(S) {
            const e = S.ent('mbox'); e.open = true; S.sfx('chime');
            await S.narr('梳妆柜上放着一个八音盒。你掀开盖子，里面的小人慢慢转起来，叮叮咚咚地放出一支慢三步。');
            await S.narr('……你愣住了。\n是收音机里的那一首。');
            await S.wait(400); e.open = false;
          } },
          { x: 7, y: 1, spr: 'wphoto', on: S => S.narr('墙上钉着一张小照片：一个瘦高的男孩子穿着明显借来的西装，正笨手笨脚地往她胸前别花。\n背面写着：「比利和我，出门前。1948.10.23」') },
          { x: 8, y: 2, spr: 'vanity', async on(S) {
            if (S.once('card')) await S.narr('梳妆镜上插着一张小卡片，用一根褪了色的丝带系着一支小铅笔。');
            await S.note('dancecard');
          } },
          { x: 9, y: 3, spr: 'wardrobe', col: '#e0d8d0', on: S => S.narr('衣柜里挂着一排连衣裙，按颜色排得整整齐齐。\n正中间，空着一个衣架。') },
          { x: 1, y: 6, spr: 'stairsdown', solid: false, to: ['house', 2, 2, 2] },
          { x: 5, y: 5, spr: 'shoes', col: '#e8e0d8', on: S => S.narr('床脚边放着一双白色的舞鞋。只有左脚的一只。') },
          { x: 7, y: 6, spr: 'lamp', light: { r: 3.6, col: 'rgba(255,200,150,.12)' }, on: S => S.narr('台灯的灯罩上绣着小小的雏菊。灯泡是新换的。') }
        ],
        async enter(S, first) { S.plr(null); if (first) await S.narr('楼上的房间很冷，有一股樟脑丸和旧香水混在一起的味道。\n这是一个十七岁姑娘的房间。所有东西，都停在了1948年。'); }
      },
      /* ---------------- 圣安妮墓园 ---------------- */
      cem: {
        amb: 'rain', dark: .84, plr: 1.3, floor: 'grass', rain: true, fog: .35, tileOpts: { grassC: '#22302a' },
        legend: LEG, rows: cemRows(),
        ents: [
          { id: 'cgate', x: 15, y: 23, spr: 'hgate', open: true, async on(S) {
            if (!S.f.rest && !S.f.leftOnce) { const r = await S.ask('现在就回车上吗？', ['回去', '再找找']); if (r) return; S.f.leftOnce = true; }
            S.sfx('open'); S.f.skipGate = true;
            await goP(S, 'road', 56, 5, 0, true);
          } },
          { id: 'shed', x: 3, y: 18, w: 2, spr: 'shed', async on(S) {
            if (S.once('shed')) await S.narr('守墓人的工具棚，门上挂着一把锁。门板上钉着一张纸，被雨水泡得发软。');
            await S.note('keeper');
          } },
          { id: 'lanternp', x: 5, y: 18, spr: 'lantern', off: true, async on(S) {
            S.hide('lanternp'); S.give('lantern'); S.sfx('match');
            S.plr(3.1);
            await S.narr('工具棚门口挂着一盏煤油马灯。你划了好几根火柴，才把灯芯点着。\n昏黄的光圈晃了晃，把四周的雾推开了一点点。');
            S.goal(S.has('gardenia') ? '找到莉莉的墓（她爸爸旁边，栀子花，1948年）' : '在墓园里找找');
            S.cp('cem');
          } },
          { x: 6, y: 19, w: 2, spr: 'bench', on: S => S.narr('一条湿透的长椅。椅背上有一块小铜牌：「纪念琼，她喜欢在这里看日落。——W.C.」') },
          { id: 'mauso', x: 14, y: 2, w: 3, spr: 'mausoleum', on: S => S.narr('一座小小的家族墓室，石门上刻着「安息」两个字。\n门缝里透出一股潮湿的冷气，一下，一下，像是有人在里面轻轻地呼吸。') },
          { x: 25, y: 7, spr: 'statue', on: S => S.narr('一尊石头天使，低着头，双手合在胸前。\n底座上刻着：「我们的小安妮　1958」。天使的脸颊上，有两道雨水冲出来的黑印子。') },
          ...GRAVES.map(gd => ({ id: gd.id, x: gd.x, y: gd.y, spr: 'hgrave', kind: gd.kind, moss: gd.moss, carve: gd.carve, on: S => graveOn(S, gd) })),
          { x: 24, y: 13, spr: 'candle', solid: false, light: { r: 2.2, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('新坟前点着一根白蜡烛，罩在一个玻璃果酱瓶里。\n雨下了一整夜，它居然还没有灭。') },
          { id: 'plamp', x: 15, y: 22, spr: 'invisible', hidden: true, light: { r: 2.6, col: 'rgba(255,180,90,.16)', flick: true } },
          { id: 'lilyg', x: 24, y: 6, spr: '@lilyg', solid: false, hidden: true, light: { r: 1.6, col: 'rgba(210,225,255,.18)' } },
          { id: 'wisp1', x: 8, y: 11, spr: 'wisp', solid: false, hidden: true, light: { r: 1.9, col: 'rgba(90,255,170,.24)' } },
          { id: 'wisp2', x: 21, y: 10, spr: 'wisp', solid: false, hidden: true, light: { r: 1.9, col: 'rgba(90,255,170,.24)' } },
          { id: 'wisp3', x: 9, y: 3, spr: 'wisp', solid: false, hidden: true, light: { r: 1.9, col: 'rgba(90,255,170,.24)' } },
          { id: 'shade', x: 27, y: 9, spr: '@shade', solid: false, hidden: true, light: { r: 1.1, col: 'rgba(200,210,230,.12)' } }
        ],
        async enter(S, first) {
          S.plr(S.has('lantern') ? 3.1 : 1.3);
          if (S.f.rest) return;
          if (first) {
            S.sfx('close');
            await S.narr('铁门在你身后「吱呀」一声合上了。\n墓园里的雾比路上还浓，你几乎看不见三步以外的东西。');
            S.goal('找一盏灯（门边的工具棚）');
            S.cp('cem');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.rest || y > 17) return;
          if (!S.has('lantern')) return (async () => { await S.narr('太黑了。雾把一切都吞掉了，你连自己的脚都看不清。\n先去门边的工具棚找盏灯吧。'); await S.walk('pl', 'd', 5); })();
          if (!f.wispsOn) return (async () => {
            f.wispsOn = true;
            for (const id of CHASERS) S.show(id);
            S.amb('drone');
            if (!wispIntroSeen) {
              wispIntroSeen = true;
              await S.narr('你刚踏进墓区，四周的雾里，就一团一团地亮起了幽绿色的光。');
              await S.narr('它们停了一下。然后，慢慢地，朝你这边飘了过来。');
              S.toast('磷火跟着人走——别停下来');
            } else await S.narr('雾里的绿光，又亮起来了。');
            S.goal(S.has('gardenia') ? '找到莉莉的墓（她爸爸旁边，栀子花，1948年）' : '在墓园里找找');
          })();
        },
        tick(S, dt) {
          const lp = getEnt('plamp', 'cem');
          if (lp) { lp.hidden = !S.has('lantern'); lp.px = S.pl.px; lp.py = S.pl.py; }
          const f = S.f; if (!f.wispsOn || f.rest || W.ended) return;
          const m = W.maps.cem, p = S.pl, busy = W.busy;
          if (busy) for (const id of CHASERS) { const e = getEnt(id, 'cem'); if (e && e.chase) e.chase.wait = .8; }
          for (const id of ['wisp1', 'wisp2', 'wisp3']) {
            const e = getEnt(id, 'cem'); if (!e || e.hidden) continue;
            const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), dist = Math.abs(ex - p.x) + Math.abs(ey - p.y);
            if (e.chase) { if (dist > 8 || p.y > 17) e.chase = null; }
            else if (!busy && dist <= 5 && p.y <= 17) e.chase = { spd: f.wspd || 2.5, zone: ZONE, catch: wispCatch };
            else if (!busy && !e.mv && Math.random() < dt * 1.2) wander(e, m);
          }
          const s = getEnt('shade', 'cem');
          if (s && !s.hidden) {
            const sx = Math.round(s.px / TS), sy = Math.round(s.py / TS), dx = sx - p.x, dy = sy - p.y, dist = Math.abs(dx) + Math.abs(dy);
            const d = DIRS[p.dir], along = dx * d[0] + dy * d[1], perp = Math.abs(dx * d[1] - dy * d[0]);
            const watched = along > 0 && perp <= along + 1;
            if (watched || dist > 10 || p.y > 17) { if (s.chase) s.chase = null; }
            else if (!busy && !s.chase) { s.chase = { spd: 3, zone: ZONE, catch: shadeCatch }; S.sfx('whisper'); }
          }
        }
      }
    }
  });

  /* ---------- 哈珀太太 ---------- */
  async function harperTalk(S) {
    const f = S.f;
    S.face('harper', 'pl');
    if (!f.photo) { S.bubble('harper', '…', 1200); return S.say('哈珀太太', '……你先看看墙上那张照片吧。'); }
    if (f.story) {
      const lines = [
        '楼上是她的房间。我每个礼拜都上去掸灰。你想看，就去看看吧。',
        '比利·肖后来去了芝加哥，再也没有开过车。每年圣诞节，他都给我寄一张卡片，什么也不写。',
        '旧墓区的碑，好多都被青苔糊住了。认不出名字，就认那朵花，认那一年。',
        '沃尔特那孩子，每年这天都多煮一壶咖啡，是不是？……他那天晚上跳进溪里，捞了她一个钟头。'
      ];
      return S.say('哈珀太太', lines[(f._hl = ((f._hl ?? -1) + 1) % lines.length)]);
    }
    await S.say('哈珀太太', ['她叫莉莲。莉莲·哈珀。我们都叫她莉莉。', '1948年10月23日，也是个星期六，也下着雨。月光舞厅办秋季舞会，比利·肖开着他爸爸的车来接她。', '我站在门廊上，替她把栀子花别好。我跟她说：十一点半之前，必须到家。晚一分钟都不行。']);
    S.bubble('harper', '…', 1600);
    await S.wait(700);
    await S.say('哈珀太太', ['十一点四十分，壁炉上那座钟停了。', '我在门廊上等到天亮。来的是警长，还有沃尔特·克兰——加油站那个年轻人。他浑身都湿透了，手里攥着她的一只舞鞋。']);
    await S.say('雷', '……对不起。');
    await S.say('哈珀太太', ['你不是第一个了，孩子。', '这二十八年，每隔一两年，就会有人半夜来敲我的门。卡车司机，推销员，还有像你这么大的孩子。每个人都说，有个姑娘让他们送她回家。', '可她从来没有走到过家门口。她总是在墓园门口，就下车了。']);
    const r = await S.ask('炉火噼啪响了一声。', ['她为什么总在那儿下车？', '我能为她做点什么吗？'], '雷');
    if (r === 0) await S.say('哈珀太太', '也许……她自己心里也知道，那儿才是家了。');
    else await S.say('哈珀太太', '……这么多年，你是头一个这么问的。');
    if (f.coat) await S.say('哈珀太太', '你把外套借给她了，是不是？……那她会好好叠起来的。她从小就爱干净。');
    else await S.say('哈珀太太', '她又说冷了吧。……她从小就怕冷。');
    await S.say('哈珀太太', ['我的腿不中用了，已经三年没去墓园看她。每年这一天，我还是会买一朵栀子花，插在桌上，看着它谢。', '替我把花带给她吧。', '她就葬在她爸爸旁边。碑上刻着一朵栀子花——是她爸爸亲手挑的。', '旧墓区的碑，好多都被青苔糊住了。认不出名字，就认那朵花，认那一年。']);
    const r2 = await S.ask('她把那双满是皱纹的手，叠在膝盖上。', ['我这就去。', '……这个时候，墓园进得去吗？'], '雷');
    if (r2 === 1) await S.say('哈珀太太', '大门不会锁的。今天晚上，它从来都不锁。');
    f.story = true;
    S.goal('拿上餐桌上的栀子花，去圣安妮墓园');
  }

  /* ---------- 汽车精灵（四个朝向；pass=副驾驶上有白衣人影） ---------- */
  function carSpr(e, R, pass) {
    const d = e.dir ?? 0;
    const B = '#7a2c26', Bd = '#3e1410', Bl = '#a0443a', GL = '#141c28', GLh = '#2c3c4e', CH = '#c8c6bc', TY = '#0c0a0a';
    const WH = '#ece8e0', HR = '#2e221c', DR = '#06080c';
    if (d === 1 || d === 2) {
      const H = (x, y, w, h, c) => R(d === 2 ? x : 16 - x - w, y, w, h, c);
      H(-8, 14, 32, 2, 'rgba(0,0,0,.5)');
      H(-9, 5, 34, 10, Bd); H(-8, 6, 32, 7, B); H(-8, 6, 32, 1, Bl);
      H(-3, -1, 19, 8, Bd); H(-2, 0, 17, 6, B); H(-2, 0, 17, 1, Bl);
      H(-1, 1, 6, 5, GL); H(6, 1, 8, 5, GL); H(14, 1, 1, 5, GLh);
      H(-8, 10, 32, 1, CH);
      H(-6, 11, 7, 5, TY); H(14, 11, 7, 5, TY); H(-4, 13, 3, 2, '#666'); H(16, 13, 3, 2, '#666');
      H(23, 7, 2, 3, '#fff2b0'); H(-9, 7, 1, 3, '#d02020');
      H(11, 2, 2, 4, DR); H(11, 1, 2, 1, DR);
      if (pass) { H(7, 2, 3, 4, WH); H(7, 1, 3, 2, HR); H(7, 3, 1, 3, HR); H(8, 4, 1, 1, '#fffde0'); }
    } else {
      const V = (x, y, w, h, c) => R(x, d === 0 ? 15 - y - h : y - 9, w, h, c);   // y 从车头量起
      R(2, 14, 13, 2, 'rgba(0,0,0,.5)');
      V(0, 2, 1, 5, TY); V(15, 2, 1, 5, TY); V(0, 17, 1, 5, TY); V(15, 17, 1, 5, TY);
      V(1, 0, 14, 25, Bd); V(2, 1, 12, 23, B); V(3, 1, 1, 6, Bl); V(12, 1, 1, 6, Bl);
      V(2, 0, 3, 1, '#fff2b0'); V(11, 0, 3, 1, '#fff2b0'); V(5, 0, 6, 1, CH);
      V(2, 7, 12, 4, GL); V(3, 11, 10, 6, Bl); V(4, 12, 8, 4, B); V(2, 17, 12, 2, GL);
      V(2, 24, 2, 1, '#d02020'); V(12, 24, 2, 1, '#d02020');
      if (d === 0) { V(9, 8, 3, 3, DR); if (pass) { V(4, 8, 3, 3, WH); V(4, 10, 3, 1, HR); V(3, 8, 1, 3, HR); } }
      else { V(4, 17, 3, 2, DR); if (pass) { V(9, 17, 3, 2, HR); V(10, 17, 1, 1, WH); } }
    }
  }
})();
