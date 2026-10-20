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
    F(g, 0, 0, 10, 1, 'P'); F(g, 1, 0, 9, 1, '#'); F(g, 0, 2, 10, 4, 'x'); g[5][9] = 'x'; g[5][10] = 'x';
    // 磨坊溪与桥
    F(g, 25, 0, 30, 3, '~'); F(g, 25, 11, 30, 15, '~');
    for (let x = 25; x <= 30; x++) { g[4][x] = 'L'; g[10][x] = 'L'; }
    for (const y of [0, 1, 2, 3, 11, 12, 13, 14, 15]) { g[y][24] = 'K'; g[y][31] = 'K'; }
    // 树林段：路边空出一小块，立块旧广告牌
    g[3][41] = 'G'; g[3][42] = 'G';
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
    for (let x = 5; x <= 14; x++) g[19][x] = 'd';   // 大门往西通工具棚的小路
    for (const [x, y] of [[3, 3], [26, 3], [25, 11], [3, 14], [10, 21], [24, 20], [12, 3]]) g[y][x] = 'T';
    return ROWS(g);
  }

  const LEG = { 'v': 'gravel', 'Y': 'corn', 'F': 'ifence', 'G': { t: 'grass', solid: true } };
  /* ---------- 小工具 ---------- */
  const inCar = S => typeof S.pl.spr === 'string' && S.pl.spr[0] !== '@';
  const meSpr = S => (S.f.coat && !S.f.coatBack) ? '@me2' : '@me';
  /* 车身只画横向两个朝向（L/R），上下变道时保持最后一次的水平朝向；pass = 副驾驶上有人 */
  const carWear = (S, pass) => S.wear((pass ? 'autop' : 'auto') + (S.f.cf === 1 ? 'L' : 'R'));
  const lookX = S => S.pl.px / TS + (S.f.cf === 1 ? -1 : 1) * (PHONE ? 4 : 2.5);   // 开车时镜头往车头前方多看几格
  /* 车灯：跟着玩家（pl:true），双方各自按本地玩家位置画；朝向变化时换一个 light 对象（会同步） */
  const HL = { 1: { pl: true, r: 3.8, col: 'rgba(255,236,170,.17)', dx: 8 - 38, dy: 6 }, 2: { pl: true, r: 3.8, col: 'rgba(255,236,170,.17)', dx: 8 + 38, dy: 6 } };
  async function goP(S, map, x, y, dir, car = false) {
    await S.fade(1, 300);
    S.f.inCar = car;
    if (car && (dir === 1 || dir === 2)) S.f.cf = dir;
    if (car) carWear(S, S.f.phase === 'ride'); else S.wear(meSpr(S));
    S.speed(1); S.norun(car);
    S.plr(null);
    await S.go(map, x, y, dir);
  }
  const her = S => (S.f.named ? '莉莉' : '姑娘');
  const settle = () => new Promise(r => { let n = 0; const c = () => (!W.pl.mv || ++n > 90) ? r() : setTimeout(c, 16); c(); });
  /* 联机：关键选择两人各投一票（单人时等同 ask） */
  async function choose(S, q, opts, who) {
    if (S.coop) S.toast('联机：这一下，两个人各投一票');
    const r = await S.vote(q, opts, who);
    if (!r.agree) await S.narr('你心里有两个声音在吵。一个说「' + opts[r.h] + '」，一个说「' + opts[r.g] + '」。\n最后，还是握着方向盘的那只手说了算。');
    return r.v;
  }

  /* ---------- 那支慢三步（单簧管式方波 + 低通；oom-pah-pah 低音） ---------- */
  const WALTZ = [[659, 2], [587, 1], [494, 3], [523, 2], [494, 1], [440, 3], [392, 2], [440, 1], [494, 1], [440, 1], [370, 1], [330, 3]];
  const WBASS = [82, 98, 110, 110, 98, 123, 82];
  function waltz(S, o = {}) {
    const beat = o.beat || .42, mul = o.oct ? 2 : 1, type = o.type || 'square', vol = o.vol ?? .035, lp = o.lp ?? 1200, d0 = o.delay || 0;
    let b = 0;
    for (const [f, n] of WALTZ) { S.tone(type, f * mul, f * mul, o.pluck ? Math.min(.6, n * beat) : n * beat * .95, vol, d0 + b * beat, lp); b += n; }
    if (o.bass !== false) for (let i = 0; i < WBASS.length; i++) {
      S.tone('triangle', WBASS[i], WBASS[i], beat * .9, vol * 1.2, d0 + i * 3 * beat, 600);
      for (let k = 1; k < 3; k++) S.tone('triangle', WBASS[i] * 3, WBASS[i] * 3, beat * .45, vol * .35, d0 + (i * 3 + k) * beat, 900);
    }
    return b * beat;
  }

  /* ---------- 车内特写 cabin（状态全在 e.s 里，客机同步） ---------- */
  function placeCab(S) { const c = getEnt('cabin', 'road'); if (!c) return; c.px = Math.round(lookX(S) * TS + 8 - 48); c.py = 26; }
  function cab(S, st) { const c = getEnt('cabin', 'road'); if (c) Object.assign(c.s, st); }
  async function cabIn(S, st, ms = 450) {
    const c = getEnt('cabin', 'road'); if (!c) return;
    c.s = Object.assign({}, st); placeCab(S);
    if (c.hidden) { c.alpha = 0; c.hidden = false; }
    await S.alpha('cabin', 1, ms);
  }
  async function cabOut(S, ms = 450) { const c = getEnt('cabin', 'road'); if (c && !c.hidden) await S.alpha('cabin', 0, ms); }

  /* ---------- 加油站：沃尔特 ---------- */
  async function waltTalk(S) {
    S.face('walt', 'pl');
    const lines = [
      '月光舞厅早就拆了。那块地现在是饲料公司的仓库，一下雨，满街都是豆粕味儿。',
      '我年轻时也在那儿跳过舞。那会儿一到周六晚上，这条路上的车灯能连成一串。',
      '别这么看我，孩子。我没见过她。我只是把别人的话记在本子上。',
      ['我爷爷那辈人讲的是马车。', '说有个姑娘坐在马车后头，过了溪，赶车的一回头——车板上只剩一摊水。', '……故事比这条路老。'],
      '雨夜过桥，开慢点。那座桥的护栏，这些年换过三回了。'
    ];
    await S.say('沃尔特', lines[(S.f._wl = ((S.f._wl ?? -1) + 1) % lines.length)]);
  }

  /* ---------- 上车 ---------- */
  async function enterCar(S) {
    S.sfx('close');
    S.hide('mycar'); S.f.cf = 2; S.pos(8, 5, 2);
    carWear(S, false); S.speed(1); S.norun(true); S.f.inCar = true; S.amb('car');
    S.sfx('car');
    await S.narr('你钻进驾驶座，拧了两下钥匙。老雪佛兰咳嗽了一声，总算发动了。\n雨刷开到最快，也只能在挡风玻璃上刮出两道扇形的清楚。');
    S.f.phase = 'drive1'; S.f.hx = 33;
    S.goal('沿老磨坊路往东开，回家');
    S.cp('drive');
  }

  /* ---------- 桥头：白衣姑娘 ---------- */
  async function encounter(S) {
    const f = S.f, n = f.pass || 0;
    if (n >= 2) {   // 第三回：不拦车了——她已经坐在副驾驶上
      carWear(S, true); S.sfx('sting');
      await cabIn(S, { her: 1, drip: 1 }, 300);
      await S.narr('雨刷刮过去，又刮回来。\n你眼角的余光里，副驾驶座上，多了一团白色。');
      await S.narr('她已经坐在那儿了。湿透的白裙子贴在身上，头发上的水顺着下巴，一滴一滴往下掉。\n车门从头到尾，都没有开过。');
      await S.say('姑娘', ['……你开过去了两次。', '他们都开过去了。'], { style: 'whisper' });
      return pickup(S, true);
    }
    W._camHold = true; S.focus(f.hx, 8);
    if (n === 0) {
      await S.narr('车灯扫过桥头的路灯——\n路灯底下，站着一个人。');
      await S.narr('是个姑娘。没有打伞，穿着一条白色的长裙，是那种只有老电影里才见得到的舞会礼服。\n她朝你的车，轻轻招了招手。');
      await S.think('……「过了磨坊溪那座桥，要是路边有个姑娘招手——别停车。」');
    } else {
      await S.narr('车灯照亮的雨幕里，路边又站着一个白色的人影。\n同样的裙子，同样湿透的头发，同样慢慢抬起来的手。');
      await S.think('不可能。你刚刚明明已经把她甩在桥头了。');
    }
    S.focus(null); W._camHold = false;
    const r = await choose(S, '要停车吗？', ['停车', '踩油门开过去']);
    if (r === 0) return pickup(S, false);
    S.sfx('car');
    await S.alpha('hh', 0, 700);
    f.pass = n + 1;
    if (n === 0) {
      await S.narr('你一脚油门，从她身边开了过去。\n后视镜里，那个白色的人影站在雨里一动不动，越来越小，最后被雾吞掉了。');
      f.hx = 36; S.place('hh', 36, 9, 1); S.hide('hh');
    } else {
      await S.narr('你咬着牙，又一次开了过去。\n这一次，你没敢看后视镜。');
      f.hx = 40; S.hide('hh');
    }
  }
  async function pickup(S, forced) {
    const f = S.f;
    if (forced) {
      await S.say('雷', '……你、你怎么……');
      await S.say('姑娘', '……送我回家吧。', { style: 'whisper' });
      await S.narr('你的手在方向盘上抖了一下。\n可不知道为什么，你没有踩刹车，也没有叫她下去。');
    } else {
      S.sfx('brake'); S.shake(300, 1);
      S.face('hh', 'pl');
      await S.narr('车在她身边停下。你摇下车窗，冷雨一下子扑了进来。\n她浑身都湿透了，白裙子贴在身上，头发一绺一绺地往下滴水。胸前别着一朵白花，花瓣被雨打得有点蔫了。');
      await S.say('雷', f.pass ? '……你、你刚才不是在桥头吗？……这么大的雨，你要去哪儿？' : '嘿……你还好吗？这么大的雨，你要去哪儿？');
      await S.say('姑娘', '……能送我回家吗？');
      const r = await S.ask('（雨刷来回刮着。她在等你开口。）', ['上来吧，快。', '你一个人站在这儿干什么？'], '雷');
      if (r === 1) { await S.say('姑娘', '我在等人送我回家。'); await S.say('姑娘', '……等了很久了。', { style: 'whisper' }); await S.say('雷', '……先上车吧。'); }
      S.sfx('open'); await S.wait(300);
      S.hide('hh'); carWear(S, true); S.sfx('close');
      await cabIn(S, { her: 1, drip: 1 }, 300);
      await S.narr('她拉开车门，坐进副驾驶座，把湿透的裙摆小心地拢在膝盖上。\n车门关上的那一瞬间，车里好像一下子冷了好几度。');
      await S.narr('雨大得看不清路。你不由自主地，把车开得很慢很慢。');
    }
    await cabOut(S);
    f.phase = 'ride'; f.ev = 0; f.rideT = 0;
    S.goal('送她回家');
  }

  /* ---------- 车上：一边开一边说的那一段路 ---------- */
  const RIDE = [
    async S => {   // 地址
      await S.say('雷', '我叫雷。在城里的罐头厂上晚班。……你住哪儿？');
      await S.say('姑娘', ['枫树街十七号。在艾什福德镇上。', '过了墓园，再往前一点就是。']);
      await S.say('雷', '巧了，我回农场正好路过镇子。……你叫什么名字？');
      await S.say('姑娘', '……莉莉。');
      S.f.named = true;
      S.goal('送莉莉回家：艾什福德镇，枫树街十七号');
    },
    async S => {   // 冷
      cab(S, { frost: 1 });
      await S.narr('车里越来越冷。暖风已经开到了最大，吹出来的却是凉风。\n挡风玻璃的内侧，慢慢结起了一层薄薄的白霜。');
      await S.narr('你瞥了一眼副驾驶。莉莉抱着胳膊，肩膀在发抖。湿裙子上的水顺着座椅边往下滴，滴答，滴答。');
      S.sfx('drip');
      let r = await choose(S, '她冷得发抖。', ['把外套脱下来给她', '把暖风再拧大一点']);
      if (r === 1) {
        await S.narr('你把暖风旋钮拧到了底。出风口呼呼作响，可吹在手背上的风，凉得像井水。');
        r = await S.ask('莉莉还在发抖。', ['……还是把外套给她吧', '快到了，再忍一忍']) === 0 ? 0 : 2;
      }
      if (r === 0) {
        await S.say('雷', '穿上吧。高中橄榄球校队的夹克，背后那个号码……你别笑话我。');
        cab(S, { coat: 1 });
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
      cab(S, { look: 1 });
      const r = await S.ask('她把额头抵在冰凉的车窗上。', ['什么也是星期六？', '（不说话，专心开车）'], '雷');
      if (r === 0) {
        S.f.askedSat = true;
        await S.say('莉莉', ['舞会那天。', '我跳了一整个晚上。只有最后一支舞没有跳——比利说，十一点半之前一定得送我到家。妈妈说，晚一分钟都不行。']);
      } else await S.narr('雨刷来回刮着。她没有再说话，只是侧着脸，看着窗外黑漆漆的树林。');
    },
    async S => {   // 收音机
      S.sfx('tv'); cab(S, { radio: 1 });
      waltz(S, { vol: .028, lp: 950, delay: .5 });
      await S.narr('收音机「咔」地响了一声，自己换了台。\n沙沙的杂音里，钻出一支很老很老的曲子：单簧管拖着长音，慢三步，像是从很远很远的舞池里飘过来的。');
      await S.say('莉莉', '……是这首。', { style: 'whisper' });
      await S.narr('她轻轻地跟着哼。你从来没听过这首歌，可不知道为什么，听着听着，心里有点发酸。');
      S.sfx('whisper');
      await S.say('收音机', '……这里是 KWLT，月光舞厅现场。现在是一九四八年十月二十三日，晚上十一点三十八分。下面是今晚的最后一支舞——', { style: 'whisper' });
      S.sfx('tv'); cab(S, { radio: 0 });
      await S.narr('杂音一下子吞没了后半句。');
      await S.say('雷', '……他刚才说，哪一年？');
      await S.narr('莉莉没有回答。');
    }
  ];
  /* 每段车内戏：特写淡入，车自己慢慢往前开（不 await），对话说完、车停稳再淡出 */
  async function rideSeg(S) {
    const f = S.f, i = f.ev; if (i >= RIDE.length) return;
    f.ev = i + 1;
    await settle();
    await cabIn(S, { her: 1, drip: 1, coat: f.coat ? 1 : 0, frost: i >= 2 ? 1 : 0, look: i >= 3 ? 1 : 0 });
    const tx = Math.min(54, S.pl.x + 3);
    const wk = tx > S.pl.x ? S.walk('pl', [tx, S.pl.y], 1.1) : null;
    if (wk) wk.catch(() => { });
    await RIDE[i](S);
    if (wk) await wk;
    await cabOut(S);
    f.rideT = 0;
  }
  async function vanish(S) {
    const f = S.f;
    await settle();
    await cabIn(S, { her: 1, drip: 1, coat: f.coat ? 1 : 0, frost: 1, look: 1 });
    await S.narr('车窗外，一排黑色的铁栅栏从雾里浮了出来。栅栏后面，是一块一块歪斜的墓碑。\n圣安妮墓园。');
    await S.say('莉莉', '……到了。', { style: 'whisper' });
    await S.say('雷', '嗯？还没呢，枫树街还要再往前开一段——');
    S.amb('none');
    await S.wait(900);
    await S.narr('你转过头。');
    cab(S, { her: 0, coat: 0, drip: 0, empty: 1 });
    carWear(S, false); S.sfx('brake'); S.shake(500, 2); S.fx('flash');
    await S.wait(700);
    await S.narr('副驾驶座上，空空的。');
    await S.narr('座椅湿透了。坐垫凹下去一小块，像是刚刚还有人坐在那里，凹陷里积着一小摊冰凉的水。\n水面上，漂着一片白色的花瓣。' + (f.coat ? '\n\n你的外套，也不见了。' : ''));
    await S.think('车门从头到尾都没有开过。');
    await S.say('雷', '……莉莉？');
    S.amb('car');
    await S.narr('只有雨声。');
    await cabOut(S, 700);
    f.phase = 'toaddr';
    S.goal('去枫树街十七号（继续往东，进镇）');
    S.cp('addr');
  }
  async function rideStep(S, x) {
    if (S.f.ev < RIDE.length) { if (x >= 54) return rideSeg(S); return; }
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
    const f = S.f;
    carWear(S, true); S.sfx('sting');
    await S.narr('你没有停。');
    await cabIn(S, { her: 1, drip: 1, coat: f.coat ? 1 : 0, frost: 1 }, 200);
    await S.narr('下一秒，副驾驶座上就坐着一个人。湿透的白裙子，冰凉的手，轻轻地搭在你握方向盘的手上。');
    await S.say('莉莉', '……不是这边。', { style: 'whisper' });
    S.sfx('brake'); S.fx('flash'); S.shake(900, 4);
    S.ent('cabin').hidden = true;
    await S.wait(250);
    S.sfx('splash');
    await S.fade(1, 500);
    S.amb('rain');
    waltz(S, { vol: .018, lp: 600, bass: false, delay: .3 });
    await S.wait(2600);
    await S.end({ bad: true, title: '她没能回家', text: '第二天早上，有人在磨坊溪的桥下发现了一辆旧雪佛兰。\n车里没有人。副驾驶座上，放着一朵泡得发白的栀子花。\n\n老沃尔特开着拖车去了现场。他站在断掉的护栏旁边，看了很久。\n\n那座桥的护栏，又要换第四回了。' });
  }

  /* ---------- 墓园 ---------- */
  const GRAVES = [
    { id: 'g_finch', x: 4, y: 5, kind: 'round', moss: true, t: '「埃德加·芬奇　1862—1931」\n下面一行小字：主啊，求你记念。\n碑脚长满了青苔，像一圈毛茸茸的领子。' },
    { id: 'g_walker', x: 7, y: 5, kind: 'cross', carve: 'rose', t: '石头十字架。底座上刻着：\n「莉莲·沃克　1930—1948」\n「三月的玫瑰，开得太早了。」\n十字架脚下，刻着一朵暗红色的玫瑰。' },
    { id: 'g_baby', x: 10, y: 5, kind: 'small', t: '一块小得像面包的石头，上面只刻着「1944」。\n石头上放着几颗被雨泡胀了的水果糖。不知道是谁放的。' },
    { id: 'g_flu', x: 5, y: 7, kind: 'flat', moss: true, t: '「列兵 奥斯卡·林德　1899—1918」\n不是死在战场上。碑文说，他死在回家的运兵船上——那年冬天的流感。' },
    { id: 'g_ogden', x: 9, y: 7, kind: 'double', t: '一块双人碑。「亨利·奥格登　1870—1939」「玛莎·奥格登　1872—1939」\n死在同一年。中间刻着一行字：「谁也没让谁等太久。」' },
    { id: 'g_edith', x: 19, y: 5, kind: 'obelisk', moss: true, carve: 'lily', t: '一座细高的方尖碑，名字被青苔糊住了大半：\n「伊……·哈珀　186……—1948」\n底座上刻着一枝百合，花朵像一只小喇叭。' },
    { id: 'g_thomas', x: 21, y: 5, kind: 'round', t: '「托马斯·J·哈珀　1899—1961」\n「他每天晚上都给家人留着门廊的灯。」' },
    { id: 'g_lill', x: 23, y: 5, kind: 'round', moss: true, carve: 'gardenia', lill: true, t: '一块不大的圆顶碑，名字被青苔吃掉了，只剩下一个「……·哈珀」。\n年份还看得清：「1931—1948」。\n名字下面刻着一朵小小的花：厚厚的花瓣，一层压着一层。\n最底下一行字：「她只是先回家了。」' },
    { id: 'g_nameless', x: 19, y: 7, kind: 'flat', t: '一块无字碑。石头被人擦得很干净，碑前却从来没有花。' },
    { id: 'g_bell', x: 4, y: 12, kind: 'round', carve: 'gardenia', t: '「玛格丽特·贝尔　1952—1968」\n名字下面刻着一朵栀子花，刻得很深，像是刻字的人很用力。' },
    { id: 'g_ww2', x: 7, y: 12, kind: 'cross', t: '「下士 雷蒙德·哈斯　1923—1944」\n「诺曼底」\n碑前插着一面褪成粉色的小国旗。' },
    { id: 'g_crane', x: 19, y: 12, kind: 'double', t: '一块双人碑。左边刻着「琼·克兰　1928—1970」；\n右边刻着「沃尔特·克兰　1926—」，后面空着。\n……加油站的老沃尔特？他早就给自己买好了地方，就在老伴旁边。' },
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
  const WISPS = ['wisp1', 'wisp2', 'wisp3'], CHASERS = [...WISPS, 'shade'];
  async function restScene(S, grave) {
    const f = S.f, sad = !f.coat && (f.pass || 0) >= 2;
    f.rest = true; f.variant = sad;
    for (const id of CHASERS) S.stop(id);
    S.take('gardenia'); grave.flowers = true; S.sfx('chime');
    await S.narr('你把栀子花轻轻放在碑前。\n雨，忽然小了。');
    await Promise.all(CHASERS.map(id => S.ent(id).hidden ? null : S.alpha(id, 0, 1400)));
    S.amb('rain');
    await S.narr('那些绿色的光一团一团地暗了下去，像是有人挨个吹熄了蜡烛。');
    if (f.coat) {
      grave.coat = true; S.sfx('sting');
      await S.narr('你这才看清，墓碑顶上搭着一样东西——\n一件深蓝色的校队夹克，叠得整整齐齐。背后绣着一个白色的「23」。');
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
    if (sad) {   // 开过去两回、也没给外套：她不邀舞了
      await S.say('莉莉', '……谢谢你，最后还是停下了。', { style: 'whisper' });
      await S.narr('她朝你抬了抬手，像是想邀你跳一支舞。\n手抬到一半，又轻轻地放了下去。');
      waltz(S, { vol: .022, lp: 800, bass: false });
      await S.narr('雾里好像有一支单簧管，在很远的地方起了个头。\n只吹了几个音，就停了。');
      await S.alpha('lilyg', 0, 2200);
      await S.narr('最后一支舞，她终究没有跳完。');
    } else {
      await S.say('莉莉', '……雷，你会跳慢三步吗？');
      const r2 = await S.ask('她朝你伸出一只手。', ['我……不太会。', '我试试。'], '雷');
      await S.say('莉莉', r2 === 0 ? '没关系。我教你。' : '那就跟着我。一、二、三……');
      const dur = waltz(S, { vol: .04, lp: 1400 });
      await S.narr('你握住了她的手。很凉，像握着一捧雨水。\n你们在墓碑之间，转了一个很慢很慢的圈。');
      await S.walk('lilyg', 'dl', 1.2); S.face('pl', 'lilyg');
      waltz(S, { vol: .04, lp: 1400, delay: Math.max(0, dur - 2.5) });
      await S.narr('她的脚步很轻，像是踩在舞池光滑的地板上。\n恍惚之间，你好像听见了单簧管，听见了很多人的笑声，看见了头顶上一串一串的彩灯——');
      await S.walk('lilyg', 'ru', 1.2); S.face('lilyg', 'pl'); S.face('pl', 'lilyg');
      await S.narr('一曲终了。');
      await S.say('莉莉', '这是我的最后一支舞。……谢谢你，替比利跳完了它。', { style: 'whisper' });
      await S.alpha('lilyg', 0, 2200);
      await S.narr('你的手里，只剩下一点雨水。');
    }
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
  /* 白影：不用大头像跳吓，先在场景里演——它就站在你背后 */
  const shadeCatch = async S => {
    const p = S.pl, d = DIRS[p.dir];
    for (const id of WISPS) S.stop(id);
    S.place('shade', p.x - d[0], p.y - d[1]); S.ent('shade').alpha = 1;
    S.dark(.97); S.plr(.55);
    S.sfx('whisper');
    await S.wait(900);
    S.face('pl', [3, 2, 1, 0][p.dir]); S.sfx('heart');
    await S.wait(600);
    await S.scare('face', { face: 'shade', sfx: 'scream', dur: .8 });
    S.fx('static');
    await S.die('你转过身。\n它就站在那儿，近得能闻到湿头发上的土腥味。\n刚才，真不该背过身去。', '你没有看着它');
  };
  async function shadeIntro(S) {
    const s = S.ent('shade');
    W._camHold = true; S.focus(Math.round(s.px / TS), Math.round(s.py / TS));
    s.alpha = 1; S.sfx('whisper');
    await S.wait(1000);
    S.focus(null); W._camHold = false;
    await S.narr('雾里站着一个白色的人影。长头发一直垂到腰上，把脸全遮住了。\n你一眨眼——它好像近了一点。');
    await S.think('守墓人的日志……「转过身，盯住它」。');
    if (S.coop) S.toast('联机：白影子在旁观的人眼里更清楚——替同伴盯着身后');
    for (const id of WISPS) { const e = getEnt(id, 'cem'); if (e && e.chase) e.chase.wait = 1.5; }
  }
  const ZONE = (x, y) => x >= 2 && x <= 27 && y >= 2 && y <= 17;
  function wander(e, m) {
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), d = (Math.random() * 4) | 0;
    const nx = ex + DIRS[d][0], ny = ey + DIRS[d][1];
    if (ZONE(nx, ny) && passable(m, nx, ny, e)) startMove(e, d, 1.1);
  }
  let wispIntroSeen = false;

  /* ---------- 结局 ---------- */
  function waltLine(f) {
    const parts = [f.pass ? (f.pass >= 2 ? '第三回才停。' : '第二回才停。') : '头一回就停了。'];
    if (f.coat) parts.push('借了一件夹克。');
    if (f.askedSat) parts.push('听她讲了舞会。');
    if (f.roomSeen) parts.push('上楼看过她的房间。');
    const full = !f.pass && f.coat && f.askedSat && f.roomSeen;
    return '1976.10.23　农场的雷。' + parts.join('') + '\n她到家了。' + (f.variant ? '最后一支舞，没跳完。' : '') + (full ? '\n\n他写得很慢。这一行，比本子上别的都长。' : '');
  }
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
    if (f.variant) {
      await cabIn(S, { wet: 1, frost: 0 }, 700);
      await S.narr('副驾驶座上没有花。\n只有一摊水，冰凉冰凉的，在座椅的凹陷里轻轻晃。');
    } else {
      await cabIn(S, { flower: 1, frost: 0 }, 700);
      await S.narr('副驾驶座上，放着一朵白色的栀子花。\n花瓣上全是水珠，像是刚刚才从雨里摘下来的。');
    }
    await S.fade(1, 1400);
    S.ent('cabin').hidden = true;
    await S.card('第二天早上', '', '你把车开回了沃尔特的加油站。\n老沃尔特什么也没问，只是给你倒了一杯热咖啡，\n然后翻开那个旧账本，在最后一页上写下：\n\n' + waltLine(f) + '\n\n他合上本子，看着窗外的雨，很久没有说话。');
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
      harper: { skin: '#ecccb4', hair: '#dcdcdc', hs: 'bun', top: '#6a5a6e', top2: '#e8e0d8', bottom: '#4a3e4c', skirt: true, shoes: '#2a2228' }
    },
    faces: {
      /* 白影：湿长发从头顶一直垂下来，发缝里露出一只睁得很大的眼睛，下面的嘴慢慢张开 */
      shade(R, a, t) {
        const H = '#1c2026', H2 = '#3a424c', SK = '#dfe2e4', SK2 = '#b8bec3';
        R(0, 0, 32, 32, '#030304');
        R(10, 1, 12, 2, H); R(8, 3, 16, 3, H); R(6, 6, 20, 6, H); R(5, 12, 22, 20, H); R(3, 18, 26, 14, H); R(1, 25, 30, 7, H);
        for (let i = 0; i < 12; i++) { const x = 4 + i * 2 + (i % 3); R(x, 4 + (i % 4) * 2, 1, 24 - (i % 3) * 4, H2); }
        R(11, 8, 10, 19, SK2); R(12, 7, 8, 21, SK);
        R(11, 8, 1, 19, H); R(20, 9, 1, 18, H); R(14, 7, 1, 5, '#2a3038'); R(19, 16, 1, 11, '#2a3038');
        R(13, 11, 5, 1, '#5a6066'); R(13, 12, 5, 3, '#f4f2ec'); R(13, 14, 5, 1, '#c8a0a0'); R(14, 15, 3, 1, '#9a5a5a'); R(15, 12, 2, 2, '#050505'); R(13, 12, 1, 1, '#d89a9a');
        if (Math.sin(t * 17) > -.3) R(19, 13, 1, 1, '#f4f2ec');
        R(16, 16, 1, 2, '#9ea4a8');
        const mh = 2 + Math.round(a * 7);
        R(14, 20, 4, mh, '#0a0204'); R(14, 20, 4, 1, '#5a2e34'); R(15, 20, 1, 1, '#c8bfb2'); R(17, 21, 1, 1, '#a89f92'); if (mh > 4) R(15, 22, 2, mh - 3, '#000');
      }
    },
    items: {
      gardenia: { name: '白栀子花', desc: '哈珀太太每年今天都会买的一朵栀子花。花瓣厚厚的，香得发甜。' },
      lantern: { name: '马灯', desc: '守墓人工具棚门口挂着的煤油马灯。玻璃罩上有一道裂纹。' }
    },
    notes: {
      log: { title: '沃尔特的旧账本（最后几页）', text: '（前面记的是油钱和赊账。最后几页的字迹不一样了，像是不同年份写上去的。）\n\n1950.10.23　奥马哈来的牧师。说她在车上告诉他：今年冬天会很长，你别走那座桥。（那年冬天，桥面结冰，翻了两辆车。）\n1951.10.23　卡车司机，从得梅因来。说在桥头载了个穿白裙子的姑娘，开到墓园那段，人没了。咖啡洒了一裤子。\n1955.10.22　推销员。说她跟他要了根烟，没点就不见了。（不像。她不抽烟。）\n1959.10.23　送牛奶的小汉森。座位是湿的。他哭了。\n1963.10.23　两个大学生，开玩笑去桥头等她，没等到。回来的路上，后座多了一摊水。\n1968.10.23　开旅行车的一位太太。姑娘问她：今天几号？\n1971.10.23　借走了一条红围巾。第二天在圣安妮墓园找着了，叠得方方正正。\n\n（最后一行，墨水最新：）\n每年都是二十三号前后，每年都是那座桥。\n莉莉，你到底是想去哪儿？' },
      clip: { title: '旧剪报 ·《艾什福德信使报》1948年10月25日', text: '本周六深夜十一时许，一辆从月光舞厅返家的轿车在老磨坊路的磨坊溪桥上打滑，撞断护栏，坠入溪中。\n\n车上十七岁的莉莲·哈珀小姐不幸遇难。驾车的同学比利·肖受轻伤，被闻讯赶来的加油站拖车司机沃尔特·克兰先生从水中救起。\n\n据舞会上的同学回忆，哈珀小姐当晚身穿一条白色舞会礼服，胸前别着一朵栀子花。她是当晚最后一个离开舞池的人。\n\n葬礼将于周三上午在圣安妮墓园举行。' },
      dancecard: { title: '舞伴卡 · 月光舞厅秋季舞会　1948.10.23', text: '（一张巴掌大的硬纸卡，用丝带系着一支小铅笔。那个年代的姑娘们，用它记下每一支舞的舞伴。）\n\n1. 狐步　——　比利\n2. 华尔兹　——　比利\n3. 林迪舞　——　汤米（踩了我两脚！）\n4. 狐步　——　比利\n5. 伦巴　——　（坐着休息，鞋子太挤）\n6. 华尔兹　——　比利\n7. 最后一支舞　——　\n\n（最后一栏是空的。卡片背面，有一行很小的字：）\n比利保证十一点半之前送我到家。妈妈说，晚一分钟都不行。' },
      keeper: { title: '守墓人日志（钉在工具棚门上）', text: '1955.10.24　哈珀家姑娘的碑上搭着一件男式外套。不知道是谁的。挂在棚里，一直没人来领。\n1962.10.24　又是一件。灰色呢子大衣，口袋里有一张加油站的收据。\n1971.10.24　一条红围巾，叠得方方正正。\n\n给接我班的人：\n夜里别往旧墓区走。磷火多。老人们说，那些是一直没人来接的。它们跟着人走，走得慢，别停下来就行。\n要是看见一个白影子，别跑，也别背对着它。转过身，盯住它，等它不动了，再侧着身子走开。走两步，回头看它一眼。\n它只在你背对着它的时候，才往前挪。\n（白影子一出来，磷火也会愣一下。你有工夫回头。）' }
    },
    legend: '「消失的搭车客」（The Vanishing Hitchhiker）大概是美国流传最广的都市传说。骨架几乎从不改变：夜里开车的人在路边载上一个年轻姑娘——常常穿着白裙子，或者刚从舞会回来——她报出一个地址，一路上很少说话；车开到半路，人却不见了。司机按地址找过去，开门的老人告诉他：那是我的女儿，很多年前的今天死在这条路上。你不是第一个了。\n\n1942到1943年，民俗学家理查德·比尔兹利和罗莎莉·汉基在《加利福尼亚民俗季刊》上发表了对这个故事的系统研究，他们从全美各地收集了七十多个书面版本，归纳出几种主要类型——其中一类里，搭车客在消失前会留下一句预言（比如战争何时结束、某场灾难）。据说更早的版本里，载人的是马车或骑马的旅人；欧洲民间也有许多「途中消失的乘客」的故事。1981年，扬·哈罗德·布鲁范德用它做了自己那本都市传说研究的书名，这本书也让「都市传说」这个说法走进了大众视野。\n\n故事在流传中长出了许多细节：座椅是湿的；姑娘借走了司机的外套或围巾，第二天这件衣服整整齐齐地搭在她的墓碑上；她只问今天是几号。芝加哥西南郊的「复活玛丽」是最有名的地方版本之一：据说她是一个穿白色舞裙的金发姑娘，在阿彻大道上的舞厅跳完舞后搭车，车经过复活公墓门口时，她就消失了——几十年来一直有司机说自己载过她。\n\n它几乎是世界性的。夏威夷的版本里，搭车的是火山女神佩蕾；中国和东南亚有出租车司机载到「不存在的乘客」、第二天在钱箱里发现冥币的故事；据说2011年东日本大地震之后，石卷一带的出租车司机也讲起过载到海啸遇难者的经历，一位大学生把这些讲述写进了毕业论文。人们一遍遍讲它，也许是因为它讲的不只是鬼，而是那些没能回家的人，和一直在等门的人。\n\n（本章的老磨坊路、艾什福德镇、圣安妮墓园、月光舞厅、哈珀一家、沃尔特加油站，以及所有人物和情节，均为游戏虚构。）',
    start: { map: 'store', x: 3, y: 5, dir: 3 },
    resume: { cem: async S => { S.plr(S.has('lantern') ? 3.1 : 1.3); } },
    async intro(S) {
      wispIntroSeen = false;
      await S.card('第七夜　消失的搭车客', '1976年10月23日　美国艾奥瓦州　老磨坊路', '下了一整天的冷雨。\n你在城里的罐头厂上完小夜班，开着老爸那辆旧雪佛兰回农场。\n抄老磨坊路，能省半个钟头。\n\n油表的指针，已经贴在了 E 上。');
    },
    /* 章节级 tick：引擎在客机操作时主机不推进玩家的 S.walk —— 这里补一下（只在剧本运行、主机不操作时） */
    tick(S, dt) {
      const p = W.pl;
      // （客机操作时主机推进剧本里的 S.walk('pl') —— 已由引擎处理）
    },
    sprites: {
      auto(g, e, t, R) { carSpr(e, R, false, e.dir === 1 ? 1 : 2); },
      autop(g, e, t, R) { carSpr(e, R, true, e.dir === 1 ? 1 : 2); },
      autoL(g, e, t, R) { carSpr(e, R, false, 1); },
      autoR(g, e, t, R) { carSpr(e, R, false, 2); },
      autopL(g, e, t, R) { carSpr(e, R, true, 1); },
      autopR(g, e, t, R) { carSpr(e, R, true, 2); },
      cabin(g, e, t, R) { cabinSpr(e, t, R); },
      /* 白影：自己画（不是人物精灵），这样能按客户端区分——旁观的人看得更清楚 */
      shadeS(g, e, t, R) {
        const viewer = !iControl();
        if (e.light) e.light.r = viewer ? 2.4 : 1.1;   // 本地改光圈半径：只影响这一端的绘制（不进快照）
        if (viewer) { g.globalAlpha = 1; R(1, -12, 14, 28, 'rgba(255,255,255,.16)'); }
        const H = '#3e444c', H2 = '#5c646e', D1 = '#aeb4ba', D2 = '#c6cbd0', SK = '#9aa2a8', sw = Math.round(Math.sin(t * 1.7 + e.px * .1) * .6);
        R(4, 3, 8, 10, D1); R(5, 3, 6, 10, D2); R(4, 13, 8, 2, 'rgba(174,180,186,.6)'); R(5, 15, 6, 1, 'rgba(174,180,186,.3)');
        R(2, 3, 2, 10, SK); R(12, 3, 2, 10, SK); R(2, 13, 1, 3, SK); R(3, 13, 1, 2, SK); R(12, 13, 1, 2, SK); R(13, 13, 1, 3, SK);
        R(5, -11, 6, 2, H); R(4, -9, 8, 3, H); R(3, -6, 3, 14 + sw, H); R(10, -6, 3, 14 - sw, H); R(4, 6, 2, 3, H); R(10, 6, 2, 4, H);
        R(6, -6, 4, 8, '#b4bac0'); R(7, -6, 1, 9, H2); R(9, -5, 1, 7, H2); R(4, -8, 1, 12, H2); R(11, -7, 1, 13, H2);
        R(8, -3, 1, 1, '#08080a');
      },
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
        if (k === 'round') { R(3, 1, 10, 13, Sd); R(4, 0, 8, 1, Sd); R(4, 1, 8, 12, S1); R(5, 0, 6, 1, S1); R(5, 2, 1, 8, Sl); R(6, 3, 4, 1, Sd); R(6, 4, 4, 1, Sd); }
        else if (k === 'cross') { R(6, -6, 4, 20, Sd); R(7, -5, 2, 18, S1); R(2, -2, 12, 4, Sd); R(3, -1, 10, 2, S1); R(3, 11, 10, 4, Sd); R(4, 11, 8, 3, S1); }
        else if (k === 'small') { R(5, 7, 6, 7, Sd); R(6, 6, 4, 7, S1); R(6, 6, 1, 4, Sl); }
        else if (k === 'obelisk') { R(5, -10, 6, 24, Sd); R(6, -9, 4, 22, S1); R(7, -12, 2, 3, Sd); R(3, 7, 10, 8, Sd); R(4, 7, 8, 7, S1); R(6, -8, 1, 14, Sl); }
        else if (k === 'flat') { R(2, 6, 12, 8, Sd); R(3, 7, 10, 6, S1); R(5, 9, 6, 1, Sd); }
        else if (k === 'double') { R(-1, 1, 18, 13, Sd); R(0, 2, 16, 11, S1); R(7, 2, 1, 11, Sd); R(2, 4, 4, 1, Sd); R(10, 4, 4, 1, Sd); R(2, 6, 3, 1, Sd); R(10, 6, 3, 1, Sd); }
        if (e.moss) for (let i = 0; i < 7; i++) { const mx = 4 + ((hash(i, e.x, 3) * 8) | 0), my = 1 + ((hash(i, e.y, 4) * 5) | 0); R(mx, my, 2, 1, '#3e5a32'); }
        if (e.carve) {
          /* 雕花放大到 6×6，三种花形状、颜色可分；拿着马灯站到碑前一格内，雕花会微微亮一下（本地按 W.pl 判断） */
          const cy = k === 'cross' ? 7 : k === 'obelisk' ? 7 : 6, cx = 5;
          const near = W.inv.includes('lantern') && Math.abs(W.pl.px - e.px) + Math.abs(W.pl.py - e.py) <= 20;
          const gl = near ? .55 + Math.sin(t * 3) * .25 : 0;
          if (near) R(cx - 1, cy - 1, 8, 8, `rgba(255,240,200,${(gl * .35).toFixed(2)})`);
          const P = (x, y, w, h, c) => R(cx + x, cy + y, w, h, c);
          if (e.carve === 'gardenia') { const W1 = near ? '#fffef6' : '#e4e0d4', W2 = near ? '#d8d2bc' : '#b0aa98'; P(1, 0, 4, 1, W1); P(0, 1, 6, 3, W1); P(1, 4, 4, 1, W1); P(2, 1, 2, 1, W2); P(1, 2, 1, 1, W2); P(4, 2, 1, 1, W2); P(2, 3, 2, 1, W2); P(2, 2, 2, 1, '#e8dc98'); P(4, 5, 2, 1, '#4e6a3e'); P(0, 5, 2, 1, '#4e6a3e'); }
          if (e.carve === 'lily') { const W1 = near ? '#f6f4ea' : '#d4d2c4'; P(0, 0, 1, 2, W1); P(5, 0, 1, 2, W1); P(1, 1, 4, 2, W1); P(2, 3, 2, 2, W1); P(2, 1, 1, 1, '#d8b850'); P(3, 1, 1, 1, '#d8b850'); P(2, 5, 1, 1, '#4e6a3e'); P(3, 5, 2, 1, '#4e6a3e'); }
          if (e.carve === 'rose') { const C1 = near ? '#b03a3a' : '#7a2a2a', C2 = near ? '#d85050' : '#9a3a3a'; P(1, 0, 4, 4, C1); P(0, 1, 6, 2, C1); P(2, 1, 2, 2, C2); P(2, 1, 1, 1, '#4a1414'); P(2, 4, 1, 2, '#3e5a2e'); P(3, 4, 2, 1, '#3e5a2e'); }
        }
        if (e.coat) { R(2, -2, 12, 6, '#1a2038'); R(3, -1, 10, 4, '#2e3a5e'); R(4, -1, 8, 1, '#44507a'); R(7, 0, 1, 2, '#e8e8e8'); R(8, 0, 1, 1, '#e8e8e8'); R(1, 1, 2, 5, '#2e3a5e'); }
        if (e.flowers) { R(5, 12, 4, 3, '#f6f4ea'); R(6, 13, 2, 1, '#e0d890'); R(9, 14, 3, 1, '#3a5a2a'); }
      },
      wisp(g, e, t, R) {
        const b = Math.round(Math.sin(t * 3 + e.px * .07) * 2), fl = Math.sin(t * 9 + e.py) > .6;
        if (!iControl()) { g.globalAlpha = 1; R(3, b, 10, 10, 'rgba(200,255,230,.18)'); }   // 旁观的人看得更清楚
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
      mausoleum(g, e, t, R) { R(0, -20, 48, 35, '#3a3834'); R(1, -19, 46, 33, '#56534c'); R(-2, -24, 52, 5, '#2a2826'); R(10, -28, 28, 4, '#2a2826'); R(18, -31, 12, 3, '#2a2826'); for (const x of [4, 12, 32, 40]) { R(x, -18, 4, 32, '#6a675e'); R(x, -18, 1, 32, '#7a776e'); } R(18, -6, 12, 20, '#121114'); R(19, -12, 10, 3, '#3a3834'); R(16, 13, 16, 2, '#4a4844'); },
      /* 路边的白十字架：脚下一朵花 */
      rcross(g, e, t, R) { R(7, -6, 2, 20, '#d8d4cc'); R(3, -2, 10, 2, '#d8d4cc'); R(7, -6, 1, 20, '#f0ece4'); R(5, 13, 6, 2, '#3a3a38'); R(9, 11, 3, 3, '#f6f4ea'); R(10, 12, 1, 1, '#e0d890'); R(8, 13, 2, 1, '#3a5a2a'); },
      /* 树林里的旧广告牌 */
      billboard(g, e, t, R) {
        R(4, -4, 2, 19, '#2e241a'); R(26, -4, 2, 19, '#2e241a');
        R(0, -18, 32, 15, '#1e1812'); R(1, -17, 30, 13, '#6e6250'); R(1, -17, 30, 2, '#4a3e30');
        R(3, -14, 12, 2, '#a89060'); R(3, -11, 9, 1, '#8a7a58');
        R(19, -14, 3, 9, '#2a2430'); R(19, -15, 3, 2, '#3a2a20'); R(23, -14, 3, 9, '#e8e2d6'); R(23, -15, 3, 2, '#2a2020'); R(22, -12, 2, 2, '#c8bca8');
        R(3, -8, 13, 1, '#5a4e3e'); for (let i = 0; i < 4; i++) R(2 + i * 8, -17 + ((i * 5) % 9), 3, 2, 'rgba(30,24,18,.6)');
      },
      /* 湿脚印：女孩子的小鞋印，一左一右 */
      wetprint(g, e, t, R) { const c = 'rgba(150,185,215,.6)', c2 = 'rgba(190,215,235,.75)'; R(3, 3, 2, 4, c); R(3, 8, 2, 2, c); R(3, 3, 2, 1, c2); R(10, 9, 2, 4, c); R(10, 14, 2, 1, c); R(10, 9, 2, 1, c2); },
      /* 一只舞鞋 */
      shoe1(g, e, t, R) { R(4, 13, 9, 1, '#2a2218'); R(5, 10, 7, 3, '#ece6de'); R(5, 8, 2, 3, '#ece6de'); R(4, 12, 1, 1, '#c8c0b8'); R(8, 10, 3, 1, '#c8c0b8'); R(7, 9, 3, 1, '#d8d0c8'); R(11, 12, 2, 1, '#d8d0c8'); R(6, 11, 1, 1, 'rgba(150,180,210,.6)'); }
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
            waltz(S, { vol: .012, lp: 650, bass: false });
            await S.narr('……还有很远很远的地方，一支乐队在奏慢三步。\n单簧管拖着长音，一、二、三，一、二、三。\n你挂上了电话。');
          } },
          { x: 3, y: 3, spr: 'pump', on: S => S.narr('老式加油机。转盘上的数字停在 12.40，油枪上滴着雨水。') },
          { x: 6, y: 3, spr: 'pump', on: S => S.narr('这台加油机上挂着一块牌子：「坏了，别用」。底下有人补了一行：「坏了十年了」。') },
          { x: 10, y: 2, spr: 'sign', col: '#7a2a20', light: { r: 1.6, col: 'rgba(255,90,60,.16)', dy: -6 }, on: S => S.narr('「沃尔特加油站　24小时拖车」\n招牌上的灯管坏了一半，只剩「沃尔特　拖车」几个字还亮着。') },
          { x: 4, y: 3, spr: 'invisible', light: { r: 4.4, col: 'rgba(255,230,170,.12)' } },
          { id: 'mycar', x: 8, y: 5, spr: 'autoR', dir: 2, async on(S) { await enterCar(S); } },
          { id: 'hl', x: 8, y: 5, spr: 'invisible', hidden: true, light: HL[2] },
          { id: 'cabin', x: 0, y: 1, spr: 'cabin', z: 1, solid: false, hidden: true, light: { r: 4.4, dx: 48, dy: 22 } },
          // 路上
          { id: 'lamp14', x: 14, y: 4, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,220,140,.14)', dy: -2 }, on: S => S.narr('一盏孤零零的路灯，灯罩里积满了死虫子。') },
          { x: 19, y: 10, spr: 'sign', col: '#2a5a3a', on: S => S.narr('里程牌：「艾什福德　6」。\n牌子上有几个锈穿了的小洞，像是被猎枪打过。') },
          { id: 'cross', x: 32, y: 10, spr: 'rcross', on: S => S.narr('路边立着一个小小的白色十字架，漆皮已经剥落了。\n十字架脚下，有人放了一朵新鲜的白花。厚厚的花瓣，香得发甜。') },
          { id: 'lamp34', x: 34, y: 10, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(220,230,255,.16)', dy: -4 }, on: S => S.narr('桥头的路灯。冷白色的光底下，雨丝看得清清楚楚。') },
          { id: 'hh', x: 33, y: 9, spr: '@lily', dir: 1, hidden: true, light: { r: 1.3, col: 'rgba(220,230,255,.14)' }, async on(S) { if (S.f.phase === 'drive1') await encounter(S); } },
          { x: 38, y: 10, spr: 'sign', col: '#b08a20', on: S => S.narr('黄色的菱形牌子：「小心鹿」。\n牌子底下的草丛里，有一双绿莹莹的眼睛。你一眨眼，它就不见了。') },
          { x: 41, y: 3, w: 2, spr: 'billboard', solid: false },
          { id: 'lamp44', x: 44, y: 4, spr: 'streetlamp', flicker: true, light: { r: 3, col: 'rgba(255,220,140,.1)', dy: -2 }, on: S => S.narr('路灯一闪一闪的，像是随时会灭掉。') },
          { id: 'lamp53', x: 53, y: 10, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,220,140,.12)', dy: -2 } },
          // 墓园（路北）
          { x: 51, y: 2, spr: 'gravestone' }, { x: 54, y: 3, spr: 'gravestone' }, { x: 53, y: 1, spr: 'cross' }, { x: 58, y: 2, spr: 'gravestone' }, { x: 60, y: 3, spr: 'gravestone' }, { x: 59, y: 1, spr: 'statue' },
          { id: 'rgate', x: 56, y: 4, spr: 'hgate', async on(S) {
            if (S.f.phase === 'tocem' || S.f.rest) return gatePrompt(S);
            await S.narr('「圣安妮墓园」。\n铁门上缠着一圈生锈的铁链，挂着一把大锁。门里面黑沉沉的，只有雾在动。');
          } },
          { id: 'hhg', x: 56, y: 5, spr: '@lilyg', solid: false, hidden: true, light: { r: 1.8, col: 'rgba(210,225,255,.2)' } },
          // 回程：一串湿脚印从镇上一直通到墓园门口，路肩上多了一只舞鞋
          ...[67, 65, 63, 61, 59, 57].map((x, i) => ({ id: 'fp' + i, x, y: 5, spr: 'wetprint', solid: false, decal: true, hidden: true })),
          { id: 'fp6', x: 56, y: 5, spr: 'wetprint', solid: false, decal: true, hidden: true },
          { id: 'rshoe', x: 60, y: 9, spr: 'shoe1', solid: false, hidden: true, on: S => S.narr('路肩的泥里，躺着一只白色的舞鞋。鞋跟陷进泥里一半。\n右脚的。\n……莉莉房间里那只，是左脚。刚才开过来的时候，这里明明什么都没有。') },
          // 艾什福德镇
          { id: 'lamp63', x: 63, y: 4, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,220,140,.12)', dy: -2 } },
          { x: 64, y: 3, w: 3, spr: 'hhouse', col: '#4a5258', on: S => S.narr('邻居家的窗户全黑着。屋里有条狗叫了两声，又不叫了。') },
          { x: 67, y: 4, spr: 'mailbox', on: S => S.narr('信箱上用白漆写着：「17　哈珀」。\n漆刷了一层又一层，最底下那层字，看起来很旧很旧了。') },
          { id: 'hhouse', x: 68, y: 3, w: 3, spr: 'hhouse', col: '#6a5a4a', lit: true, on: S => S.f.phase === 'toaddr' ? arriveHouse(S) : S.narr('一栋白色护墙板的老房子。窗户里透着昏黄的灯光。\n这么晚了，门廊的灯还亮着。') },
          { x: 69, y: 4, spr: 'invisible', light: { r: 2.8, col: 'rgba(255,210,130,.2)' } },
          { id: 'lamp71', x: 71, y: 4, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,220,140,.12)', dy: -2 } },
          { x: 72, y: 3, w: 3, spr: 'hhouse', col: '#584a4a', on: S => S.narr('窗台上摆着一排南瓜灯，都没有点。') },
          ...[6, 7, 8].map(y => ({ x: 77, y, spr: 'barrier', lamp: y === 7, light: y === 7 ? { r: 2.2, col: 'rgba(255,170,60,.18)', dy: 2 } : null, on: S => S.narr('「前方积水　道路封闭」\n木头路障上挂着一盏快没油的马灯。再往前，磨坊溪漫过了路面。') }))
        ],
        async enter(S, first) {
          const f = S.f;
          S.plr(null);
          if (!f.inCar) {
            S.amb('rain');
            if (first) { await S.narr('雨比刚才更大了。你那辆旧雪佛兰停在路肩上，车头朝东，车顶上溅着一层白蒙蒙的水花。'); S.goal('上车'); }
            return;
          }
          S.amb('car');
          if (f.rest) { if (S.once('finale')) await finale(S); return; }
          if (f.phase === 'tocem' && S.once('tocemIntro')) {
            await S.narr('你回到车上。副驾驶座还是湿的。\n你把那朵栀子花小心地放在了仪表台上。');
            await S.narr('车灯照出去——人行道上，有一串湿漉漉的脚印。\n很小，像是女孩子的鞋。一直往西，往墓园的方向去了。');
            S.goal('跟着脚印，去圣安妮墓园（往西开，墓园大门）');
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
            const h = S.ent('hh');
            if ((f.pass || 0) < 2 && x >= f.hx - 8 && h.hidden) { h.hidden = false; h.alpha = 0; W._hhFade = true; S.sfx('whisper'); }   // 从雨雾里慢慢浮出来
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
        tick(S, dt) {
          const f = S.f, p = S.pl, car = inCar(S);
          const hl = getEnt('hl', 'road');
          if (hl) { hl.hidden = !car; if (car) { const L = HL[f.cf === 1 ? 1 : 2]; if (hl.light !== L) hl.light = L; } }
          if (W._hhFade) { const h = getEnt('hh', 'road'); if (!h || h.hidden) W._hhFade = false; else { h.alpha = Math.min(1, h.alpha + dt * .8); if (h.alpha >= 1) W._hhFade = false; } }
          const cb = getEnt('cabin', 'road'); if (cb && !cb.hidden) placeCab(S);
          S.norun(car);
          if (!car) { if (W._look) { W._look = false; S.focus(null); } return; }
          // 镜头前瞻
          if (!W._camHold) { S.focus(lookX(S), 7); W._look = true; }
          // 车身朝向：只在左右之间切换
          if (p.dir === 1 || p.dir === 2) f.cf = p.dir;
          const want = (String(p.spr).startsWith('autop') ? 'autop' : 'auto') + (f.cf === 1 ? 'L' : 'R');
          if (p.spr !== want) S.wear(want);
          // 油门：同向持续行驶 0.8 秒从 1.0 加到最高；停下或掉头就重来；变道时限速
          const D = W._drv || (W._drv = { t: 0, idle: 0, h: 0 });
          if (S.moving) {
            D.idle = 0;
            if ((p.dir === 1 || p.dir === 2) && D.h !== p.dir) { if (D.h && p.speed > 1.6) S.sfx('brake'); D.t = 0; D.h = p.dir; }
            D.t += dt;
          } else { D.idle += dt; if (D.idle > .15 && D.h) { if (p.speed > 1.7 && !W.busy) S.sfx('brake'); D.t = 0; D.h = 0; } }
          const cap = f.phase === 'ride' ? 1 : 2.1;
          let sp = 1 + (cap - 1) * Math.min(1, D.t / .8);
          if (p.dir === 0 || p.dir === 3) sp = Math.min(sp, 1.2);
          if (Math.abs((p.speed || 1) - sp) > .01) S.speed(sp);
          // 雨刷
          W._wp = (W._wp ?? 1.2) - dt; if (W._wp <= 0) { W._wp = 1.2; S.tone('sawtooth', 95, 62, .28, .012, 0, 420); }
          // 车内戏：按「往前开的秒数」触发，离墓园太近时补上没讲完的
          if (f.phase === 'ride' && !W.busy && !W.ended) {
            if (S.moving && p.dir === 2) f.rideT = (f.rideT || 0) + dt;
            const left = RIDE.length - (f.ev || 0);
            if (left > 0 && (f.rideT >= (f.ev ? 1.1 : .5) || 54 - p.x <= left * 2.5)) { f.rideT = 0; runScript(rideSeg); }
          }
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
          { id: 'fire', x: 4, y: 2, w: 2, spr: 'fireplace', light: { r: 4.4, col: 'rgba(255,140,60,.22)', flick: true }, async on(S) {
            await S.narr('壁炉里的火烧得很小，像是怕把屋子烤暖了似的。\n壁炉台上的座钟，指针停在十一点四十分。钟面上落了一层灰，钟摆却被人擦得锃亮。');
            if (S.f.photo && S.once('h_clock')) await harperAside(S, ['十一点四十分，那座钟停了。我没让人修。', '我在门廊上等到天亮。来的是警长，还有沃尔特·克兰——加油站那个年轻人。', '他浑身都湿透了，手里攥着她的一只舞鞋。右脚的。']);
          } },
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
          { id: 'letters', x: 10, y: 2, spr: 'sidetable', async on(S) {
            await S.narr('小桌上放着一个饼干铁盒，盒盖已经合不上了——里面塞满了信。');
            await S.narr('信封上的邮戳，从1950年代一直到今年春天。得梅因、奥马哈、芝加哥、圣路易斯……\n你抽出最上面的一封。「亲爱的哈珀太太，您不认识我……」\n每一封的开头，都差不多。');
            if (S.f.photo && S.once('h_letters')) await harperAside(S, ['这二十八年，每隔一两年，就会有人半夜来敲我的门。', '卡车司机，推销员，还有像你这么大的孩子。每个人都说，有个姑娘让他们送她回家。', '他们回去以后，好多人都给我写信。……我一封也没扔。']);
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
          { id: 'umbrella', x: 9, y: 7, spr: 'plant', async on(S) {
            await S.narr('门边的伞架上插着一把男式的黑伞。伞面早就干透了，像是很多年没人撑过。');
            if (S.f.photo && S.once('h_umb')) await harperAside(S, ['那是她爸爸的伞。汤姆走了十五年了。', '他活着的时候，每天晚上都给我们留着门廊的灯。……现在换我留。']);
          } },
          { x: 7, y: 8, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (!f.story) { await S.narr('就这么走了？……哈珀太太还在看着你。'); return S.walk('pl', 'u', 5); }
            if (!S.has('gardenia') && !f.rest) { await S.narr('哈珀太太说的那朵花，还在餐桌的瓶子里。'); return S.walk('pl', 'u', 5); }
            S.face('harper', 'pl');
            await S.say('哈珀太太', f.rest ? '……谢谢你，孩子。' : '路上小心，孩子。下雨天，那座桥很滑。');
            if (!f.rest) { f.phase = 'tocem'; tocemRoad(S); }
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
            const e = S.ent('mbox'); e.open = true;
            const dur = waltz(S, { type: 'sine', oct: true, vol: .05, lp: 0, bass: false, beat: .36, pluck: true });
            await S.narr('梳妆柜上放着一个八音盒。你掀开盖子，里面的小人慢慢转起来，叮叮咚咚地放出一支慢三步。');
            await S.narr('……你愣住了。\n是收音机里的那一首。');
            await S.wait(Math.min(1500, dur * 300)); e.open = false;
          } },
          { x: 7, y: 1, spr: 'wphoto', on: S => S.narr('墙上钉着一张小照片：一个瘦高的男孩子穿着明显借来的西装，正笨手笨脚地往她胸前别花。\n背面写着：「比利和我，出门前。1948.10.23」') },
          { x: 8, y: 2, spr: 'vanity', async on(S) {
            if (S.once('card')) await S.narr('梳妆镜上插着一张小卡片，用一根褪了色的丝带系着一支小铅笔。');
            await S.note('dancecard');
          } },
          { x: 9, y: 3, spr: 'wardrobe', col: '#e0d8d0', on: S => S.narr('衣柜里挂着一排连衣裙，按颜色排得整整齐齐。\n正中间，空着一个衣架。') },
          { x: 1, y: 6, spr: 'stairsdown', solid: false, to: ['house', 2, 2, 2] },
          { x: 5, y: 5, spr: 'shoe1', solid: false, on: S => S.narr('床脚边放着一只白色的舞鞋。只有左脚。\n另一只不在这儿。') },
          { x: 7, y: 6, spr: 'lamp', light: { r: 3.6, col: 'rgba(255,200,150,.12)' }, on: S => S.narr('台灯的灯罩上绣着小小的雏菊。灯泡是新换的。') }
        ],
        async enter(S, first) { S.plr(null); S.f.roomSeen = true; if (first) await S.narr('楼上的房间很冷，有一股樟脑丸和旧香水混在一起的味道。\n这是一个十七岁姑娘的房间。所有东西，都停在了1948年。'); }
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
          { id: 'lanternp', x: 5, y: 18, spr: 'lantern', light: { r: 2.2, col: 'rgba(255,170,80,.2)', flick: true }, async on(S) {
            S.hide('lanternp'); S.give('lantern', true); S.sfx('match');
            S.plr(3.1);
            await S.narr('工具棚门口挂着一盏煤油马灯，灯芯还剩一点火苗。\n你把它摘下来，拧大了灯芯。昏黄的光圈晃了晃，把四周的雾推开了一点点。');
            S.goal(S.has('gardenia') ? '找到莉莉的墓（她爸爸旁边，栀子花，1948年）' : '在墓园里找找');
            S.cp('cem');
          } },
          { x: 6, y: 20, w: 2, spr: 'bench', on: S => S.narr('一条湿透的长椅。椅背上有一块小铜牌：「纪念琼，她喜欢在这里看日落。——W.C.」') },
          { id: 'mauso', x: 14, y: 2, w: 3, spr: 'mausoleum', on: S => S.narr('一座小小的家族墓室，石门上刻着「安息」两个字。\n门缝里透出一股潮湿的冷气，一下，一下，像是有人在里面轻轻地呼吸。') },
          { x: 25, y: 7, spr: 'statue', on: S => S.narr('一尊石头天使，低着头，双手合在胸前。\n底座上刻着：「我们的小安妮　1958」。天使的脸颊上，有两道雨水冲出来的黑印子。') },
          ...GRAVES.map(gd => ({ id: gd.id, x: gd.x, y: gd.y, spr: 'hgrave', kind: gd.kind, moss: gd.moss, carve: gd.carve, on: S => graveOn(S, gd) })),
          { x: 24, y: 13, spr: 'candle', solid: false, light: { r: 2.2, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('新坟前点着一根白蜡烛，罩在一个玻璃果酱瓶里。\n雨下了一整夜，它居然还没有灭。') },
          { id: 'plamp', x: 15, y: 22, spr: 'invisible', hidden: true, light: { pl: true, r: 2.6, col: 'rgba(255,180,90,.16)', flick: true } },
          { id: 'lilyg', x: 24, y: 6, spr: '@lilyg', solid: false, hidden: true, light: { r: 1.6, col: 'rgba(210,225,255,.18)' } },
          { id: 'wisp1', x: 8, y: 11, spr: 'wisp', solid: false, hidden: true, light: { r: 1.9, col: 'rgba(90,255,170,.24)' } },
          { id: 'wisp2', x: 21, y: 10, spr: 'wisp', solid: false, hidden: true, light: { r: 1.9, col: 'rgba(90,255,170,.24)' } },
          { id: 'wisp3', x: 9, y: 3, spr: 'wisp', solid: false, hidden: true, light: { r: 1.9, col: 'rgba(90,255,170,.24)' } },
          { id: 'shade', x: 27, y: 9, spr: 'shadeS', solid: false, hidden: true, light: { r: 1.1, col: 'rgba(200,210,230,.12)' } }
        ],
        async enter(S, first) {
          S.plr(S.has('lantern') ? 3.1 : 1.3);
          if (S.f.rest) return;
          if (first) {
            S.sfx('close');
            await S.narr('铁门在你身后「吱呀」一声合上了。\n墓园里的雾比路上还浓，你几乎看不见三步以外的东西。\n只有西边，雾里透出一小点昏黄的光。');
            S.goal('去西边那点灯光处（工具棚）找盏灯');
            S.cp('cem');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.rest || y > 17) return;
          if (!S.has('lantern')) return (async () => { await S.narr('太黑了。雾把一切都吞掉了，你连自己的脚都看不清。\n先去西边亮着一点灯光的工具棚，找盏灯吧。'); await S.walk('pl', 'd', 5); })();
          if (!f.wispsOn) return (async () => {
            f.wispsOn = true;
            for (const id of CHASERS) S.show(id);
            S.ent('shade').alpha = .35;
            S.amb('drone');
            if (!wispIntroSeen) {
              wispIntroSeen = true;
              await S.narr('你刚踏进墓区，四周的雾里，就一团一团地亮起了幽绿色的光。');
              await S.narr('它们停了一下。然后，慢慢地，朝你这边飘了过来。');
              S.after(1500, async S => S.toast('磷火跟着人走——别停下来'));
            } else await S.narr('雾里的绿光，又亮起来了。');
            S.goal(S.has('gardenia') ? '找到莉莉的墓（她爸爸旁边，栀子花，1948年）' : '在墓园里找找');
          })();
        },
        tick(S, dt) {
          const lp = getEnt('plamp', 'cem');
          if (lp) lp.hidden = !S.has('lantern');
          const f = S.f; if (!f.wispsOn || f.rest || W.ended) return;
          const m = W.maps.cem, p = S.pl, busy = W.busy;
          if (busy) for (const id of WISPS) { const e = getEnt(id, 'cem'); if (e && e.chase) e.chase.wait = Math.max(e.chase.wait || 0, .8); }
          for (const id of WISPS) {
            const e = getEnt(id, 'cem'); if (!e || e.hidden) continue;
            const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), dist = Math.abs(ex - p.x) + Math.abs(ey - p.y);
            if (e.chase) { if (dist > 8 || p.y > 17) e.chase = null; }
            else if (!busy && dist <= 5 && p.y <= 17) e.chase = { spd: f.wspd || 2.5, zone: ZONE, catch: wispCatch };
            else if (!busy && !e.mv && Math.random() < dt * 1.2) wander(e, m);
          }
          /* 白影：被盯着（面向它，或 0.6 秒内面向过它）就不动、变实；背对它时变淡，每 0.8 秒「瞬移」一格 */
          const s = getEnt('shade', 'cem');
          if (s && !s.hidden && !W._shCaught) {
            const sx = Math.round(s.px / TS), sy = Math.round(s.py / TS), dx = sx - p.x, dy = sy - p.y, dist = Math.abs(dx) + Math.abs(dy);
            const d = DIRS[p.dir], along = dx * d[0] + dy * d[1], perp = Math.abs(dx * d[1] - dy * d[0]);
            if (along > 0 && perp <= along + 1) W._seenT = W.t;
            const watched = W.t - (W._seenT ?? -9) < .6;
            s.alpha += ((watched ? 1 : .35) - s.alpha) * Math.min(1, dt * 6);
            if (busy || p.y > 17 || dist > 10) return;
            if (!f.shadeSeen && dist <= 6) { f.shadeSeen = true; runScript(shadeIntro); return; }
            if (!s.mv && sx === p.x && sy === p.y) { W._shCaught = true; runScript(shadeCatch); return; }
            if (watched) { W._shT = Math.max(W._shT ?? .8, .45); return; }
            if (s.mv) return;
            W._shT = (W._shT ?? .8) - dt;
            if (W._shT <= 0) {
              W._shT = dist <= 3 ? .55 : .8;
              const nd = bfsStep(m, sx, sy, p.x, p.y, s);
              if (nd >= 0) { const nx = sx + DIRS[nd][0], ny = sy + DIRS[nd][1]; if (ZONE(nx, ny) || (nx === p.x && ny === p.y)) { startMove(s, nd, 8); S.sfx('heart'); if (dist <= 3) S.tone('sine', 62, 40, .14, .35, .2); } }
            }
          }
        }
      }
    }
  });

  /* ---------- 回程：路随剧情变 ---------- */
  function tocemRoad(S) {
    getEnt('rgate', 'road').open = true;
    for (let i = 0; i <= 6; i++) getEnt('fp' + i, 'road').hidden = false;
    getEnt('rshoe', 'road').hidden = false;
    const fl = id => { const e = getEnt(id, 'road'); e.flicker = true; e.light = Object.assign({}, e.light, { flick: true }); };
    fl('lamp63'); fl('lamp53'); fl('lamp34');
    getEnt('lamp71', 'road').off = true; getEnt('lamp44', 'road').off = true;
  }

  /* ---------- 哈珀太太 ---------- */
  async function harperAside(S, lines) {   // 调查屋里的东西之后，她在扶手椅上回一句
    await S.wait(500);
    S.bubble('harper', '…', 1000);
    await S.say('哈珀太太', lines);
  }
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
    await S.say('哈珀太太', ['她没有回来。', '……你不是第一个了，孩子。', '她从来没有走到过家门口。每一回，她都是在墓园门口，就下车了。']);
    if ((f.pass || 0) >= 2) await S.say('哈珀太太', '你开过去两回，是不是？……别难过。大多数人，一回都没停。');
    else if (f.pass === 1) await S.say('哈珀太太', '头一回，你没停吧？……她不记仇的。');
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

  /* ---------- 汽车精灵（只画横向；face 1=朝左 2=朝右；pass=副驾驶上有白衣人影） ---------- */
  function carSpr(e, R, pass, face) {
    const B = '#7a2c26', Bd = '#3e1410', Bl = '#a0443a', GL = '#141c28', GLh = '#2c3c4e', CH = '#c8c6bc', TY = '#0c0a0a';
    const WH = '#ece8e0', HR = '#2e221c', DR = '#06080c';
    const H = (x, y, w, h, c) => R(face === 2 ? x : 16 - x - w, y, w, h, c);
    H(-8, 14, 32, 2, 'rgba(0,0,0,.5)');
    H(-9, 5, 34, 10, Bd); H(-8, 6, 32, 7, B); H(-8, 6, 32, 1, Bl);
    H(-3, -1, 19, 8, Bd); H(-2, 0, 17, 6, B); H(-2, 0, 17, 1, Bl);
    H(-1, 1, 6, 5, GL); H(6, 1, 8, 5, GL); H(14, 1, 1, 5, GLh);
    H(-8, 10, 32, 1, CH);
    H(-6, 11, 7, 5, TY); H(14, 11, 7, 5, TY); H(-4, 13, 3, 2, '#666'); H(16, 13, 3, 2, '#666');
    H(23, 7, 2, 3, '#fff2b0'); H(-9, 7, 1, 3, '#d02020');
    H(11, 2, 2, 4, DR); H(11, 1, 2, 1, DR);
    if (pass) { H(7, 1, 3, 5, WH); H(7, 1, 3, 2, HR); H(7, 3, 1, 3, HR); H(9, 4, 1, 1, '#fffde0'); }
  }

  /* ---------- 车内特写：96×48 —— 挡风玻璃、雨刷、仪表台、收音机、副驾驶座和她的侧影 ---------- */
  function cabinSpr(e, t, R) {
    const K = '#08090d';
    R(-2, -2, 100, 52, '#000'); R(0, 0, 96, 48, K);
    // 挡风玻璃与窗外：两边树影，中间一条被车灯照亮、往远处收窄的路
    R(3, 3, 76, 17, '#0b1320');
    for (let i = 0; i < 9; i++) { R(3 + i * 2, 5 + (i % 3) * 2, 2, 15, i % 2 ? '#09120e' : '#0c1612'); R(61 + i * 2, 5 + ((i + 1) % 3) * 2, 2, 15, i % 2 ? '#09120e' : '#0c1612'); }
    for (let y = 10; y < 20; y++) { const w = 4 + (y - 10) * 5; R(41 - w / 2, y, w, 1, y < 13 ? '#141618' : '#1b1d20'); R(41 - w / 2 + 2, y, Math.max(1, w - 4), 1, `rgba(255,226,150,${(.04 + (y - 10) * .014).toFixed(3)})`); }
    const sc = (t * 1.6) % 1;
    for (let i = 0; i < 3; i++) { const y = 11 + Math.floor((i + sc) * 3); R(41 - (i >> 1), y, 1 + i, 1, '#8a7a30'); }
    for (let i = 0; i < 18; i++) { const x = 4 + ((hash(i, 7, 1) * 74) | 0), y = 3 + ((t * (10 + (i % 5) * 4) + hash(i, 8, 1) * 17) % 16 | 0); R(x, y, 1, 2, 'rgba(170,190,220,.55)'); }
    // 雨刷
    const a = (Math.sin(t * 2.6) * .5 + .5) * 2.3 + .4;
    for (const [px, len] of [[20, 22], [50, 25]]) for (let k = 2; k < len; k++) { const x = px - Math.cos(a) * k, y = 19 - Math.sin(a) * k; if (y >= 3 && x >= 3 && x < 79) R(x, y, 1, 1, '#24262c'); }
    // 结霜
    if (e.frost) {
      R(3, 3, 76, 2, 'rgba(215,232,244,.35)'); R(3, 3, 5, 17, 'rgba(215,232,244,.28)'); R(74, 3, 5, 17, 'rgba(215,232,244,.28)');
      for (let i = 0; i < 14; i++) { const x = i < 7 ? 4 + ((hash(i, 2, 9) * 8) | 0) : 70 + ((hash(i, 3, 9) * 8) | 0), y = 4 + ((hash(i, 4, 9) * 15) | 0); R(x, y, 2, 1, 'rgba(235,245,252,.55)'); }
      R(0, 0, 96, 48, 'rgba(120,150,190,.06)');
    }
    // 车顶、立柱、右侧车窗
    R(0, 0, 96, 3, '#16161c'); R(0, 0, 3, 22, '#16161c'); R(79, 0, 3, 22, '#16161c'); R(94, 0, 2, 22, '#16161c');
    R(82, 3, 12, 17, '#090e16'); for (let i = 0; i < 5; i++) R(83 + ((hash(i, 5, 2) * 10) | 0), 4 + ((t * 8 + i * 4) % 15 | 0), 1, 2, 'rgba(170,190,220,.45)');
    // 后视镜（旁观的人有时会在里面看见一个白影）
    R(40, 3, 14, 5, '#26282e'); R(41, 4, 12, 3, '#3a4250'); R(46, 2, 2, 1, '#26282e');
    if (!iControl() && Math.sin(t * .9) > .2) { R(45, 4, 2, 3, '#e6eaee'); R(45, 4, 2, 1, '#8a9098'); }
    // 仪表台
    R(0, 20, 96, 8, '#2a1a14'); R(0, 20, 96, 1, '#4e3226'); R(0, 27, 96, 1, '#1a100c');
    R(8, 22, 15, 4, '#120c0a'); R(10, 23, 3, 2, '#5a8a6a'); R(17, 23, 3, 2, '#5a8a6a'); R(11, 23, 1, 1, '#c8e0b0');
    R(38, 22, 16, 5, '#140e0c'); R(39, 23, 10, 3, e.radio ? (Math.sin(t * 23) > -.5 ? '#ffb050' : '#c07a30') : '#3a2a18'); R(51, 23, 2, 2, '#8a7a60');
    if (e.radio) R(39 + ((t * 3) % 9 | 0), 23, 1, 3, '#fff2c0');
    // 方向盘、手
    for (let k = 0; k < 28; k++) { const an = k / 28 * Math.PI * 2, x = 15 + Math.cos(an) * 11, y = 37 + Math.sin(an) * 8; if (y < 47) R(x, y, 2, 2, '#1c1c22'); }
    R(14, 36, 4, 3, '#1c1c22'); R(6, 37, 9, 1, '#1c1c22'); R(18, 37, 9, 1, '#1c1c22');
    R(4, 31, 4, 3, '#c8a07e'); R(23, 31, 4, 3, '#c8a07e');
    // 中控、档把
    R(42, 30, 4, 18, '#140f0c'); R(41, 28, 6, 3, '#2a2a30');
    // 副驾驶座（长条座椅）
    R(54, 26, 34, 22, '#3e1612'); R(56, 28, 30, 20, '#5e221c'); for (let y = 32; y < 48; y += 4) R(56, y, 30, 1, '#4a1a16'); R(54, 26, 34, 1, '#6e2c24');
    if (e.empty || e.wet) {
      R(60, 38, 22, 6, '#4a1a16'); R(61, 40, 20, 3, 'rgba(130,165,195,.7)'); R(63, 40, 6, 1, 'rgba(220,235,245,.8)');
      if (e.empty) { R(70, 40, 3, 2, '#f6f4ea'); R(71, 41, 1, 1, '#e0d890'); }
      R(84, 43 + ((t * 6) % 4 | 0), 1, 2, 'rgba(150,180,210,.75)');
    }
    if (e.flower) { R(66, 38, 6, 4, '#f6f4ea'); R(67, 37, 4, 1, '#f6f4ea'); R(68, 39, 2, 1, '#e8dc90'); R(67, 39, 1, 1, '#c8c4b0'); R(72, 41, 5, 1, '#3a5a2a'); R(65, 37, 1, 1, '#cfe4f4'); R(70, 36, 1, 1, '#cfe4f4'); }
    // 她：侧坐，脸朝右边车窗；look=额头抵着车窗
    if (e.her && !e.empty) {
      const bx = 66, by = 8, hx = bx + (e.look ? 2 : 0), hy = by + (e.look ? 1 : 0);
      const HR = '#1a1412', HR2 = '#2c2220', SK = '#e6dcd6', SK2 = '#bfb2ac', DR = '#e6e3da', DR2 = '#b8b6ae', DR3 = '#d2cfc6';
      const C = (x, y, w, h, c) => { const y1 = Math.min(47, y + h); if (y1 > y) R(x, y, w, y1 - y, c); };
      // 裙子（坐着：肩、身子、腿往右前方伸）
      C(bx - 1, by + 12, 11, 3, DR); C(bx, by + 15, 10, 11, DR); C(bx - 2, by + 25, 16, 6, DR); C(bx + 10, by + 29, 5, 12, DR3);
      C(bx - 1, by + 12, 1, 19, DR2); C(bx - 2, by + 30, 16, 1, DR2); C(bx + 14, by + 29, 1, 12, DR2); C(bx + 3, by + 26, 6, 1, DR3);
      // 抱着胳膊
      C(bx + 6, by + 13, 2, 7, SK); C(bx + 2, by + 19, 8, 2, SK); C(bx + 2, by + 21, 8, 1, SK2); C(bx + 9, by + 18, 1, 2, SK2);
      C(bx + 2, by + 13, 2, 2, '#fffdf2'); C(bx + 2, by + 13, 1, 1, '#d8d090');
      // 脖子、头
      C(hx + 3, hy + 9, 3, 4, SK2);
      C(hx, hy, 8, 2, HR); C(hx - 1, hy + 1, 4, 6, HR); C(hx - 2, hy + 6, 4, 12, HR); C(hx - 3, hy + 12, 3, 12, HR2); C(hx - 1, hy + 17, 2, 6, HR2);
      C(hx + 3, hy + 2, 5, 7, SK); C(hx + 8, hy + 5, 1, 2, SK); C(hx + 4, hy + 8, 3, 1, SK2);
      C(hx + 3, hy + 1, 5, 2, HR); C(hx + 2, hy + 2, 2, 6, HR); C(hx + 7, hy + 2, 1, 1, HR);
      C(hx + 5, hy + 5, 2, 1, e.look ? '#7a6a6a' : '#241a1c'); C(hx + 7, hy + 8, 1, 1, '#a07c80');
      if (e.coat) { C(bx - 3, by + 11, 13, 11, '#2e3a5e'); C(bx - 3, by + 11, 13, 1, '#44507a'); C(hx + 2, hy + 7, 2, 5, '#2e3a5e'); C(bx - 2, by + 14, 2, 4, '#e8e8e8'); C(bx + 6, by + 13, 3, 8, '#26304e'); C(bx - 3, by + 20, 13, 1, '#d8d4c8'); }
      if (e.drip) for (let i = 0; i < 3; i++) { const yy = (t * 16 + i * 6) % 14; C(bx - 3 + i * 2, by + 24 + yy, 1, 2, 'rgba(160,190,220,.85)'); }
    }
  }
})();
