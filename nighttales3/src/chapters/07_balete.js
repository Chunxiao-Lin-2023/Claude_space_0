/* ================= 第七夜 · 巴雷特大道的白衣女人 ================= */
(() => {
  /* ---------- 地图生成小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));
  const WS = { style: 'whisper' };

  /* 巴雷特大道：64×15，自西（E. 罗德里格斯大道）向东（N. 多明戈街） */
  function driveRows() {
    const g = G(64, 15, 'H');
    F(g, 0, 2, 63, 3, 'G'); F(g, 0, 11, 63, 12, 'G');
    F(g, 0, 4, 63, 4, 'S'); F(g, 0, 10, 63, 10, 'S');
    F(g, 0, 5, 63, 9, ':'); F(g, 0, 7, 63, 7, '=');
    for (const [a, b] of [[3, 11], [38, 47], [50, 56]]) F(g, a, 1, b, 3, '#');
    for (const [a, b] of [[20, 29], [42, 52]]) F(g, a, 11, b, 13, '#');
    return ROWS(g);
  }
  /* 大榕树 Lola 底下：24×18 */
  function groveRows() {
    const g = G(24, 18, '"');
    F(g, 0, 0, 23, 1, '#');
    for (let y = 0; y < 13; y++) { g[y][0] = 'h'; g[y][23] = 'h'; }
    F(g, 3, 2, 18, 12, 'd');
    F(g, 5, 3, 16, 9, 'Q');
    F(g, 0, 13, 23, 13, '_');
    F(g, 0, 14, 23, 17, ':'); F(g, 0, 16, 23, 16, '=');
    return ROWS(g);
  }
  /* 阿尔塞加老宅一楼：22×13 */
  function casaRows() {
    const g = G(22, 13, '#');
    F(g, 1, 2, 8, 5, 'W'); F(g, 10, 2, 14, 5, 'W'); F(g, 16, 2, 20, 5, 'q');
    g[6][4] = 'W'; g[6][12] = 'W'; g[6][18] = 'q';
    F(g, 1, 7, 20, 11, 'w');
    g[12][10] = 'w';
    return ROWS(g);
  }

  /* ---------- 小工具 ---------- */
  function setM(S, o) { const m = S.ent('rvm'); if (m) Object.assign(m.s, o); }
  /* 联机：关键选择两人各投一票（单人等同 ask）。safe != null 时，意见不合按 safe 处理（「诱惑」类选项不让一个人把两个人都搭进去） */
  async function choose(S, q, opts, who, safe) {
    const r = await S.vote(q, opts, who);
    if (r.agree) return r.v;
    if (safe != null) {
      await S.narr('你心里有两个声音在吵。一个说「' + opts[r.h] + '」，一个说「' + opts[r.g] + '」。\n……最后，是怕的那一个赢了。');
      return safe;
    }
    await S.narr('你心里有两个声音在吵。一个说「' + opts[r.h] + '」，一个说「' + opts[r.g] + '」。\n最后，还是握方向盘的那只手说了算。');
    return r.v;
  }
  /* 合成音：kundiman 的几小节（三拍子、小调、慢得像叹气）；空街上的汽车喇叭；没有弦的钢琴响了一声 */
  const KUND = [[440, 1], [523, 1], [494, 1], [440, 3], [330, 3], [349, 1], [440, 1], [392, 1], [349, 2], [330, 1], [294, 3], [330, 3]];
  function hum(S, d0 = 0, vol = .03) {
    const beat = .62; let b = 0;
    for (const [f, n] of KUND) { S.tone('sine', f, f * .995, n * beat * .92, vol, d0 + b * beat, 900); S.tone('triangle', f / 2, f / 2, n * beat * .8, vol * .35, d0 + b * beat, 500); b += n; }
    return b * beat;
  }
  function horn(S, d0 = 0) { for (const [f, d] of [[392, 0], [494, 0], [392, .7], [494, .7]]) S.tone('square', f, f * .98, .5, .028, d0 + d, 1400); }
  function ghostKey(S) { S.tone('triangle', 466, 462, 2.2, .07, 0, 2400); S.tone('sine', 932, 925, 1.4, .025, 0, 3000); S.tone('sine', 233, 233, 1.8, .03, .02, 800); }
  async function goP(S, map, x, y, dir, car) {
    const f = S.f;
    await S.fade(1, 300);
    f.inCar = !!car;
    S.wear(car ? (f.phase === 'ride' ? 'taxip' : 'taxi') : '@me');
    S.speed(car ? (f.phase === 'ride' ? .55 : 1.6) : 1);
    S.plr(null); S.dark(null, map);
    await S.go(map, x, y, dir);
  }

  /* ---------- 出租车精灵（四个朝向；pass = 后座上有白衣人影） ---------- */
  function taxiSpr(e, R, pass) {
    const d = e.dir ?? 0;
    const B = '#d8b838', Bd = '#5a4612', Bl = '#f0d870', GL = '#141c28', GLh = '#2c3c4e', CH = '#c8c6bc', TY = '#0c0a0a';
    const WT = '#eceae6', HR = '#0e0a0c', DR = '#06080c', SG = '#f6efc0';
    if (d === 1 || d === 2) {
      const H = (x, y, w, h, c) => R(d === 2 ? x : 16 - x - w, y, w, h, c);
      H(-8, 14, 32, 2, 'rgba(0,0,0,.5)');
      H(-9, 5, 34, 10, Bd); H(-8, 6, 32, 7, B); H(-8, 6, 32, 1, Bl);
      H(-3, -1, 19, 8, Bd); H(-2, 0, 17, 6, B); H(-2, 0, 17, 1, Bl);
      H(-1, 1, 6, 5, GL); H(6, 1, 8, 5, GL); H(14, 1, 1, 5, GLh);
      H(3, -4, 8, 3, Bd); H(4, -3, 6, 2, SG); H(5, -3, 1, 1, '#5a4a20'); H(8, -3, 1, 1, '#5a4a20');
      H(-8, 10, 32, 1, CH);
      for (let i = 0; i < 6; i++) H(-4 + i * 4, 8, 2, 1, '#2a2416');
      H(-6, 11, 7, 5, TY); H(14, 11, 7, 5, TY); H(-4, 13, 3, 2, '#666'); H(16, 13, 3, 2, '#666');
      H(23, 7, 2, 3, '#fff2b0'); H(-9, 7, 1, 3, '#d02020');
      H(11, 2, 2, 4, DR); H(11, 1, 2, 1, DR);
      if (pass) { H(0, 2, 3, 4, WT); H(0, 1, 3, 2, HR); H(0, 2, 1, 4, HR); H(2, 2, 1, 4, HR); }
    } else {
      const V = (x, y, w, h, c) => R(x, d === 0 ? 15 - y - h : y - 9, w, h, c);
      R(2, 14, 13, 2, 'rgba(0,0,0,.5)');
      V(0, 2, 1, 5, TY); V(15, 2, 1, 5, TY); V(0, 17, 1, 5, TY); V(15, 17, 1, 5, TY);
      V(1, 0, 14, 25, Bd); V(2, 1, 12, 23, B); V(3, 1, 1, 6, Bl); V(12, 1, 1, 6, Bl);
      V(2, 0, 3, 1, '#fff2b0'); V(11, 0, 3, 1, '#fff2b0'); V(5, 0, 6, 1, CH);
      V(2, 7, 12, 4, GL); V(3, 11, 10, 6, Bl); V(4, 12, 8, 4, B); V(5, 13, 6, 2, SG); V(2, 17, 12, 2, GL);
      V(2, 24, 2, 1, '#d02020'); V(12, 24, 2, 1, '#d02020');
      if (d === 0) V(9, 8, 3, 3, DR); else V(4, 17, 3, 2, DR);
      if (pass) { if (d === 0) V(4, 16, 3, 1, HR); else { V(9, 17, 3, 2, HR); V(10, 17, 1, 1, WT); } }
    }
  }

  /* ================= 小吃摊 ================= */
  async function bertoTalk(S) {
    const f = S.f;
    S.face('berto', 'pl');
    if (f.berto) {
      const lines = [
        '规矩墙上都写着。别嫌啰嗦——写的人，都是吓破过胆的。',
        '我表哥那回，后座上有人摸了一路脚垫。他一眼都没敢看后视镜。第二天就把车卖了。',
        '帕辛奶奶那儿有 sampaguita，挂一串在后视镜上。五块钱，买个安心。',
        'Ingat ka, pare. 到家了给内娜打个电话。'
      ];
      return S.say('伯托', lines[(f._bl = ((f._bl ?? -1) + 1) % lines.length)]);
    }
    await S.say('伯托', '要收工了？Ramon，走哪条路回去？');
    await S.say('拉蒙', '巴雷特大道。穿过去，省十分钟。');
    S.bubble('berto', '!', 1200);
    await S.say('伯托', ['Diyos ko. 今晚？今晚是十月三十一号的夜里，pare——天一亮就是 Undas。', '每年就是这一夜，她出来得最勤。']);
    const r = await S.ask('伯托把咖啡杯往桌上一放。', ['……谁？', '（笑）白衣女人？你也信那个？'], '拉蒙');
    if (r === 1) await S.say('伯托', '信不信是你的事。这条街上跑夜班的，十个有九个不走那条路。');
    await S.say('伯托', ['那条路两边全是 balete。老人说，balete 里住着「不是我们的」东西——树杈上抽大雪茄的 kapre，土包里的 nuno，还有 tikbalang。', '从我爸爸那一辈起，司机们就说：半夜开过巴雷特大道，路边会有个白衣服、长头发的女人招手拦车。', '有人没停，一抬眼——她已经坐在后座上了，在后视镜里。有的说她满脸是血，有的说，她根本没有脸。']);
    const r2 = await S.ask('', ['她到底是谁？', '……那些司机后来怎么样了？'], '拉蒙');
    if (r2 === 0) await S.say('伯托', ['说法多了。有人说她是被车撞的，撞她的人跑了，再没找着。', '还有人说——是被一个开出租的害的，就埋在大树底下。所以她专拦我们。传了四十年，每个人讲的都不一样。']);
    else await S.say('伯托', ['大部分人没事，就是吓得半个月不敢开夜车。', '也有人说，她在后座上一直弯着腰，在脚垫上摸来摸去，像在找什么东西。']);
    await S.say('伯托', ['墙上那张纸，是司机们这些年一条一条添上去的规矩。你自己看。', '最要紧的一条：别看后视镜。真看见了——别对上她的眼睛。']);
    await S.say('拉蒙', '我开了二十年夜车，天天走那条路，从来没碰见过。');
    await S.say('伯托', '那是她还没看上你的车。……Ingat ka, pare.');
    f.berto = true;
    S.goal('开车回家（出租车停在路边）');
  }
  async function nenaTalk(S) {
    const f = S.f;
    S.face('nena', 'pl');
    const lines = [
      '这条街上跑夜班的，十个有九个绕开巴雷特大道。剩下那一个，就是你。',
      '天一亮就是 Undas，我也要回八打雁给我爸妈扫墓。小摊关一天。',
      '我 Lola 说过，那个姑娘不是坏人。她只是……找不到路了。',
      '有个熟客说，他载过她。她在后座上一直问：「你看见我的东西了吗？」……他说完就把车钥匙都扔了。'
    ];
    await S.say('内娜阿姨', lines[(f._nl = ((f._nl ?? -1) + 1) % lines.length)]);
  }
  async function pacingTalk(S) {
    const f = S.f;
    S.face('pacing', 'pl');
    if (f.pacingDone) {
      if (!S.has('kandila') && !f.gotPolvera && !f.boughtCandle) {
        const r = await S.ask('「再买根蜡烛？天亮扫墓用。」', ['买一根', '不用了'], '帕辛奶奶');
        if (r === 0) { f.boughtCandle = true; S.give('kandila'); return S.say('帕辛奶奶', '火柴塞在报纸里了。Ingat, anak.'); }
        return;
      }
      return S.say('帕辛奶奶', ['经过 Lola——最大的那棵 balete——记得说 tabi tabi po。', '它们不坏。你客客气气的，它们也客客气气的。']);
    }
    await S.say('帕辛奶奶', ['Anak，买串 sampaguita 吧。五块钱一串，刚穿好的。', '天亮就是 Undas，我还有给过世的人点的白蜡烛。']);
    const r = await S.ask('竹匾上的茉莉花串，白得在夜里发亮。', ['花和蜡烛，都要一样。', '……一串花就好。'], '拉蒙');
    S.give('sampa');
    if (r === 0) { f.boughtCandle = true; S.give('kandila'); }
    await S.say('帕辛奶奶', '花挂在后视镜上，圣母会替你看着后座。');
    if (r === 0) await S.say('帕辛奶奶', '蜡烛我用报纸包好了，里面塞了一小盒火柴。……今晚说不定就用得上。');
    await S.say('帕辛奶奶', ['经过 Lola——就是最大的那棵 balete——记得说一声 tabi tabi po。', '请让让路。它们在那儿住得比我们久。']);
    f.pacingDone = true;
  }
  async function board(S) {
    const f = S.f;
    if (!f.ate) return S.narr('桌上那碗 lugaw 还冒着热气。\n空着肚子开夜车，迟早要出事。');
    if (!f.berto) { S.bubble('berto', '!', 1200); return S.say('伯托', 'Hoy, Ramon！先别走——过来，坐一下。'); }
    const r = await S.ask('上车回家吗？', ['上车', '再待一会儿']);
    if (r) return;
    S.sfx('close');
    if (S.has('sampa')) {
      S.take('sampa'); f.sampa = true; setM(S, { flower: true }); S.sfx('item');
      await S.narr('你把那串 sampaguita 挂在了后视镜上。\n甜甜的茉莉香一下子灌满了车厢，压住了汽油和汗的味道。');
    }
    await S.narr('出租车咳嗽了两声，发动了。\n内娜阿姨在后面喊：「Ingat, Ramon！」');
    f.phase = 'drive1';
    await goP(S, 'drive', 2, 8, 2, true);
  }

  /* ================= 巴雷特大道（第一次） ================= */
  async function mirrorUse(S) {
    const f = S.f, m = S.ent('rvm');
    if (f.phase === 'ride') {
      if (m.s.up) { flipDown(S); S.toast('你把后视镜扳了下去'); return; }
      return S.think('镜子扳下去了。不看，就对不上。');
    }
    if (f.phase === 'drive1') {
      if (f.d1c && !f.d1d) {
        setM(S, { up: true }); S.sfx('heart');
        await S.narr('她还在。头低着，两只手在脚垫上一下一下地摸。\n……你赶紧把眼睛转回了路上。');
        return;
      }
      const up = !m.s.up; setM(S, { up }); S.sfx('switch');
      if (!up) return S.narr('你把后视镜扳了下去。镜面暗了，只剩一层灰蒙蒙的影子。');
      return S.narr('后视镜里是空空的后座，和后窗外面一盏一盏往后退的路灯。' + (f.sampa ? '\n镜子底下，sampaguita 花串轻轻地晃。' : ''));
    }
    if (f.phase === 'pickup') { const up = !m.s.up; setM(S, { up, her: 0 }); S.sfx('switch'); return S.narr(up ? '后座空着。……她在大道尽头等着。' : '你把后视镜扳了下去。'); }
  }
  async function flagger(S) {
    S.show('wl1'); S.ent('wl1').alpha = 1;
    S.focus(18, 9);
    S.sfx('whisper');
    await S.narr('前面路边，一棵 balete 底下，站着一个人。\n白衣服。长头发一直垂到腰。车灯扫过去的时候，她抬起了一只手——');
    await S.think('「路边穿白衣服的女人招手，别停。不管她多可怜。」');
    S.focus(null);
    const r = await choose(S, '要停车吗？', ['（踩刹车）', '（别停。盯着前面，开过去）'], '拉蒙');
    if (r === 0) {
      S.sfx('brake'); S.shake(300, 1);
      await S.narr('车在她跟前停下了。你摇下车窗——');
      S.ent('wl1').dir = 3;
      await S.narr('她没有走过来。\n她转过身，蹲了下去，两只手伸进榕树根的缝里，一下一下地摸，像在找什么东西。');
      await S.say('白衣女人', 'Nasaan… nasaan na…', WS);
      await S.narr('在哪儿……在哪儿去了……');
      S.sfx('whisper');
      await S.alpha('wl1', 0, 900);
      await S.narr('一阵风刮过去，树底下什么也没有了。\n只有气根在晃。');
      await S.think('……她在找东西？');
    } else {
      S.sfx('car');
      await S.narr('你一脚油门，从她身边开了过去。\n她的手还举着，白得在车灯里发亮。');
      await S.alpha('wl1', 0, 700);
      await S.think('没停。没看。……没事了。');
    }
    S.hide('wl1');
  }
  async function backseat(S) {
    const f = S.f;
    S.amb('none');
    await S.narr('车里忽然冷了下来。冷气明明没开。\n后视镜上的' + (f.sampa ? '茉莉花串，' : '小挂件，') + '无风自动，轻轻地转了一圈。');
    const m = S.ent('rvm');
    S.wear('taxip');
    if (!m.s.up) {
      /* 守了第三条规矩：镜子没翻上来，她只被「听见」 */
      S.sfx('switch'); S.shake(250, 1);
      await S.narr('「啪」。\n扳下去的后视镜猛地一跳，想自己翻回来——你一把按住了它。');
      await S.narr('你没看镜子。\n可你听见了：后座上有人。窸窸窣窣的，像是两只手在脚垫上一下一下地摸。\n还有湿头发的味道。');
      S.sfx('heart'); S.amb('car');
    } else {
      setM(S, { up: true, her: 1 });
      await S.narr('你的眼睛，不由自主地往镜子里瞥了一下——');
      await S.scare('face', { spr: '@luz', dur: .9 });
      S.amb('car');
      await S.narr('后座上坐着一个人。\n白衣服。长头发垂下来，盖住了整张脸。她弯着腰，两只手在后座的脚垫上摸来摸去。');
    }
    await S.say('白衣女人', 'Nasaan… nasaan na…', WS);
    const r = await choose(S, '方向盘在你手里发抖。', ['……小、小姐？你在找什么？', '（别看。别看。盯着前面的路）'], '拉蒙');
    if (r === 0) {
      await S.say('白衣女人', '……我的镜子。', WS);
      await S.say('白衣女人', '我看不见我的脸了。', WS);
    } else {
      await S.narr('你把眼睛钉在挡风玻璃上。后座上窸窸窣窣的声音，一直没停。');
      await S.say('白衣女人', '……镜子……我的镜子……', WS);
    }
    f.heardMirror = true;
  }
  async function stall(S) {
    const f = S.f;
    S.focus(33, 3);
    await S.narr('左手边，一棵比别的树都大得多的 balete 从黑暗里浮了出来。\n气根像帘子一样垂到地上。树底下点着一圈白蜡烛。');
    S.amb('none'); S.sfx('car');
    await S.narr('发动机咳了两声——熄火了。\n车灯闪了闪，也灭了。');
    f.dead = true; S.dark(.95);
    await S.wait(900);
    setM(S, { up: true, her: 0 }); S.wear('taxi');
    S.sfx('heart');
    await S.narr('你终于抬眼看了后视镜。\n后座空了。');
    await S.narr('脚垫上落着几片湿漉漉的榕树叶子，还有一根很长很长的黑头发。');
    await S.think('镜子。她在找镜子。……在这棵树底下？');
    S.focus(null);
    await S.narr('钥匙拧了好几下，仪表盘一点反应都没有。\n……只能下车看看了。');
    f.phase = 'grove'; f.dead = false;
    await goP(S, 'grove', 11, 14, 3, false);
  }

  /* ================= 大榕树 Lola ================= */
  const ROOTS = [
    { id: 'r1', x: 7, y: 5, kind: 'coin', t: '一条粗得像柱子的气根。树皮缝里塞满了硬币——一比索的、五十分的，还有几枚西班牙时代的老铜币，绿得发黑。' },
    { id: 'r2', x: 8, y: 7, kind: 'rosary', t: '气根上挂着一串塑料念珠，被太阳晒得发白。小十字架歪着，像是被人匆匆挂上去就跑了。' },
    { id: 'r3', x: 10, y: 7, kind: 'ribbon', col: '#8a2a2a', t: '一条系着红布条的气根。布条褪成了旧砖头的颜色，结打得又小又紧，是很多年前系上去的。\n这里的根缠得比别处都密，缝隙深处黑漆漆的。' },
    { id: 'r4', x: 12, y: 7, kind: 'hanky', t: '根上搭着一块白手帕，角上绣着一个认不出的字母。\n这么潮的夜里，手帕是干的。干得出奇。' },
    { id: 'r5', x: 14, y: 5, kind: 'wax', t: '根底下淌满了蜡油，一层叠一层，像一圈白色的钟乳石。\n不知道多少年来，有多少人在这里点过蜡烛。' }
  ];
  async function tabi(S) {
    const r = await S.ask('这么大的一棵 balete……伸手之前，要不要先说点什么？', ['「Tabi tabi po.」（请让让路）', '（直接伸手）'], '拉蒙');
    if (r === 0) {
      S.f.tabi = true;
      await S.narr('你低下头，小声说：「Tabi tabi po.」\n风从气根之间穿过去，沙沙地响了一阵，像是有谁往旁边让了让。');
      return true;
    }
    S.sfx('whisper'); S.shake(300, 2); S.fx('flash');
    await S.narr('你的手刚碰到气根，就像被什么东西狠狠拍了一下——手背上一阵火辣辣的疼。\n榕树深处，传来一声很轻很轻的、像老人一样的咳嗽。');
    if (S.once('tonyoYell')) { S.bubble('tonyo', '!', 1200); await S.say('托尼奥（远处）', 'Hoy！你干什么！先说 tabi tabi po 啊，pare！'); }
    return false;
  }
  async function rootOn(S, rd) {
    const f = S.f;
    if (f.phase === 'final') return S.narr(rd.id === 'r3' ? '红布条底下，你点的那根蜡烛还亮着。' : rd.t);
    if (!f.tabi && !(await tabi(S))) return;
    await S.narr(rd.t);
    if (f.gotPolvera) return;
    if (!f.diary) return S.narr('根缝里黑漆漆的。……你也不知道自己要找什么。');
    if (rd.id !== 'r3') {
      S.sfx('whisper');
      if (!f.rootKnown) return S.think('根这么多，缝这么深……掉在哪儿了？\n日记里说，她给最大的那棵系过一根红布条。……要不，从车上的后视镜里看看她站在哪儿？');
      return S.think('不是这条。镜子里，她站在系着红布条的那条根旁边。');
    }
    if (!f.rootKnown) {
      f.rootKnown = true;
      await S.think('红布条。\n「我还给最大的那棵系了一根红布条，许了个愿。是秘密。」\n……就是这条。');
      S.goal('在系着红布条的气根下找她的粉盒');
    }
    if (!S.has('kandila')) {
      await S.narr('你刚想伸手，又停住了。\n跟它们要东西，总得先给它们点什么。');
      S.goal('找一根蜡烛供在根下（圣母龛那边有）');
      return;
    }
    const ok = await S.ask('点一根蜡烛，供在根下吗？', ['点上蜡烛', '再等等'], '拉蒙');
    if (ok) return;
    S.take('kandila'); S.sfx('match');
    const e = S.ent('r3'); e.lit = true; e.light = { r: 2.4, col: 'rgba(255,180,90,.22)', flick: true };
    await S.narr('火柴「嚓」地一声亮了。你把白蜡烛立在根底下，用手拢着火苗。');
    await S.say('拉蒙', ['Tabi tabi po.', '我不是来拿你们的东西。', '我是来……替一个姑娘，拿回她自己的东西。']);
    S.sfx('whisper'); S.shake(500, 1);
    await S.narr('风停了。\n烛火直直地立着，一动不动。');
    await S.narr('然后——很慢、很慢地——那几条缠得最紧的气根，松开了一道缝。\n像一只攥了很多年的手，终于张开了。');
    await S.narr('你把手伸了进去。里面又湿又凉，全是泥土和烂叶子的味道。\n指尖碰到了一个硬硬的、圆圆的东西。');
    S.give('polvera'); f.gotPolvera = true; f.phase = 'pickup';
    await S.narr('一个巴掌大的圆粉盒。盖子上镶着珍珠母贝，在烛光里泛着一层淡淡的虹光。\n盖子背面刻着一行小字：\n「Para kay Luz — Mama, 1953」');
    S.sfx('sting'); await S.wait(400);
    horn(S); await S.wait(1300);
    await S.narr('你身后的大道上，远远地，传来两声汽车喇叭。\n可是整条路上，一辆车也没有。');
    S.goal('回到车上，开到大道尽头去接她');
    S.cp('pickup');
  }
  async function bigOn(S) {
    await S.narr('Lola。\n这棵 balete 大得不像一棵树，像几十棵树拧成了一股：粗粗细细的根从半空垂下来，扎进土里，又长成了新的树干。');
    await S.narr('树皮的缝里塞满了东西：硬币、褪色的布条、叠成小方块的纸条、一张身份证大小的圣像卡。');
    if (S.once('kapre')) {
      const b = S.ent('bigb'); b.s.ember = true; S.sfx('whisper');
      await S.narr('……树杈高处，有个小红点亮了一下，又暗了下去。\n像是有人坐在上面，慢悠悠地抽着一根大雪茄。');
      b.s.ember = false;
      await S.think('别往上看。别往上看。');
    }
  }
  async function grottoOn(S) {
    const f = S.f;
    await S.narr('树旁边砌着一个小小的圣母龛。玛利亚披着蓝斗篷，低着头，脚边堆满了烧化的蜡烛和干掉的花。\n水泥上有人用马克笔写着：「Birhen ng Balete, ipanalangin mo kami.」——巴雷特的圣母，为我们祈祷。');
    if (!S.has('kandila') && !f.gotPolvera && f.diary && S.once('borrowCandle')) {
      await S.narr('龛前还放着一捆没点过的白蜡烛，用橡皮筋扎着，旁边压着一盒火柴。\n你在胸前画了个十字，小声说了句对不起，抽了一根。');
      S.give('kandila');
    }
  }
  async function tonyoTalk(S) {
    const f = S.f;
    S.face('tonyo', 'pl');
    if (f.phase === 'final') return S.say('托尼奥', '（他攥着一串念珠，嘴唇一直在动）……Susmaryosep. 去吧，pare。我在这儿看着。');
    if (!f.tonyo) {
      f.tonyo = true;
      await S.say('托尼奥', ['Magandang gabi——晚上好。车坏了？', '这条路上，车半夜熄火，不稀奇。']);
      await S.say('拉蒙', '你是这儿的保安？');
      await S.say('托尼奥', ['隔壁那家请的。我在这岗亭里坐了十一年夜班。', '这棵树，我们叫它 Lola——老奶奶。几百岁了，没人说得清。', '你要从它底下过，得说一声 Tabi tabi po——请让让路。不说的话，回家就肚子疼、发烧，严重的……总之，说一声不吃亏。']);
      const r = await S.ask('他用手电筒的光，在榕树根上慢慢扫了一圈。', ['刚才……我车上坐了一个白衣服的女人。', '这条路上，是不是有个白衣女人？'], '拉蒙');
      if (r === 0) { S.bubble('tonyo', '…', 1500); await S.say('托尼奥', '……又一个。'); }
      await S.say('托尼奥', ['我见过她。每年都见。她从来不看我——她只看车。', '有时候她在路边招手，有时候就蹲在这些树根底下，摸一整夜。']);
      await S.say('托尼奥', ['说她是谁的都有。我 lola 说，她是这条路上某户大宅子里的小姐，很多年前 Undas 前一夜出了事。', '也有人说她是个女大学生，到现在还在这条街上找害她的人。还有人说，根本没这回事，是五十年代报纸上编出来卖报的。']);
      await S.say('托尼奥', ['可是——（他朝身后那扇生锈的铁门抬了抬下巴）', '那是阿尔塞加家的老宅。四十多年没人住了。门上的铁链，早就断了。']);
      await S.say('托尼奥', ['你要进去，别乱拿东西。', '还有，千万别砍、别折 Lola 的根。前年有个包工头嫌一根挡路，拿锯子锯了半截——第二个礼拜就从脚手架上摔下来了。']);
      S.goal('去阿尔塞加老宅看看（左上的铁门）');
      return;
    }
    let lines;
    if (f.phase === 'pickup') lines = ['找到了？……Diyos ko。', '她每天晚上都在大道尽头、N. 多明戈街口那盏路灯底下拦车。司机们说，她是想回到这棵树下。', '去接她吧。记住——后视镜。'];
    else if (f.diary) lines = [
      '后视镜？……对。司机们都说，她只在后视镜里看得清。你的车停在那儿，镜子正对着 Lola。……别看太久就行。',
      '要从 Lola 的根里拿东西，得先给它点什么。一根蜡烛，一句好话。圣母龛前面有人留的蜡烛。',
      '红布条？有。靠下边当中那条根上系着一根，褪成砖头色了。我来的时候就在了。'
    ];
    else lines = [
      '老宅在左上那扇铁门里头。我这手电就一支，借不了你。',
      '「Tabi tabi po」，记住了。',
      '老辈人说，以前大道正当中还长着一棵更大的 balete，车都得绕着它开。后来修路，砍了。现在剩下的老树里，就数 Lola 最大。',
      '她在找东西？……难怪。她每次都蹲在树根底下摸。'
    ];
    await S.say('托尼奥', lines[(f._tl = ((f._tl ?? -1) + 1) % lines.length)]);
  }
  async function gtaxiOn(S) {
    const f = S.f;
    if (f.phase === 'final') return S.narr('……先把东西还给她。');
    if (f.phase === 'pickup') {
      const r = await choose(S, '粉盒揣在胸前的口袋里。……接下来呢？', ['开到大道尽头去接她', '……不管了。直接开回家', '再等等'], '拉蒙', 0);
      if (r === 2) return;
      if (r === 1) return keepEnd(S);
      S.sfx('close');
      await goP(S, 'drive', 35, 8, 2, true);
      return;
    }
    if (!f.diary) {
      S.sfx('locked');
      await S.narr('你坐进驾驶座，拧了拧钥匙。仪表盘一点反应都没有。');
      await S.narr('后视镜里，是你自己的脸，和车后面黑沉沉的大榕树。\n……什么也没有。');
      return;
    }
    if (f.mirrorSeen) {
      if (f.gotPolvera) return S.narr('车还是打不着。');
      return S.narr('你又看了一眼后视镜。\n红布条那条根的旁边，白色的人影还站着，一只手指着脚下。\n……你赶紧把镜子扳了下去。');
    }
    return taxiMirrorLook(S);
  }
  async function taxiMirrorLook(S) {
    const f = S.f;
    await S.narr('你坐进驾驶座，把后视镜掰正，对准车后的大榕树。');
    S.sfx('heart');
    await S.narr('镜子里，榕树底下站着一个白色的人影。\n你猛地回头——树下什么也没有。只有蜡烛在风里晃。');
    await S.narr('你再看镜子。她还在。\n她站在一条系着褪色红布条的气根旁边，低着头，一只手指着脚下的泥土。');
    f.rootKnown = true; f.mirrorSeen = true;
    if (!f.gotPolvera) S.goal('去系着红布条的那条气根，找她的粉盒');
    await S.wait(500); S.sfx('whisper');
    const r = await choose(S, '镜子里的她，慢慢地……转过身来。', ['移开视线', '（再看一会儿）'], '拉蒙', 0);
    if (r === 1) return stareChain(S, '镜子里，她抬起了头。\n长发向两边分开——后面没有脸。\n只有一片白，像一块起了雾的玻璃。', true);
    await S.narr('你把后视镜猛地扳了下去，心脏跳得像打鼓。');
    S.cp('find2');
  }
  /* 第三结局：拿了粉盒，不去接她 */
  async function keepEnd(S) {
    S.sfx('close');
    await S.narr('你坐进驾驶座。这一回，钥匙一拧就着了。\n你没有往大道尽头开。你掉过车头，朝 E. 罗德里格斯大道的方向，一脚油门踩了下去。');
    S.sfx('car');
    await S.narr('后视镜里，大道尽头那盏路灯底下，站着一个白色的人影。\n越来越小。越来越小。\n她一直没有招手。');
    await S.fade(1, 1000);
    await S.end({ bad: true, id: 'keep', title: '她的镜子', text: '粉盒你没舍得扔。珍珠母贝的盖子在灯底下泛着虹光，你十七岁的女儿一眼就看上了。\n「爸，哪儿买的？」\n「……路边捡的。」\n\n她每天出门以前都要打开照一照。\n一个礼拜以后，她坐在你的出租车后座上，捧着粉盒，忽然小声问你：\n「爸，镜子里，我肩膀后面那个低着头的姐姐……是谁？」\n\n粉盒是找到了。\n只是一直没有还到它主人的手里。' });
  }

  /* ================= 阿尔塞加老宅 ================= */
  async function stairLock(S) {
    const f = S.f, e = S.ent('sgate');
    if (f.unlocked) { await goP(S, 'cuarto', 2, 7, 2, false); return; }
    await S.narr('楼梯口拦着一道铁栅门，挂着一把老式的数字锁。\n四个小转轮，锈得发涩。');
    const v = await S.keypad('数字锁 · 四位', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) return;
    if (v === '2008') {
      f.unlocked = true; e.open = true; S.sfx('open');
      await S.narr('「咔」。\n锁头弹开了。铁栅门吱吱呀呀地往里转开，楼梯上扑下来一股樟脑丸的味道。');
      S.goal('上楼看看');
      return;
    }
    S.sfx('locked');
    f.lockN = (f.lockN || 0) + 1;
    const near = { '0820': '锁纹丝不动。\n……日在前，月在后。伊辛的信上写的是「日」和「月」。', '1953': '锁纹丝不动。\n1953 是年份。锁的是生日的「日」和「月」。', '1935': '锁纹丝不动。\n那是她出生的年份。要的是「日」和「月」。', '3110': '锁纹丝不动。\n十月三十一号是她出事的那天，不是生日。', '1031': '锁纹丝不动。\n十月三十一号是她出事的那天，不是生日。' }[v];
    if (near && f.yaya) return S.narr(near);
    if (!f.yaya) return S.narr('锁纹丝不动。\n……这房子里，也许有人留下过线索。' + (f.lockN >= 2 ? '\n饭厅那个碗柜的抽屉，好像没关严。' : ''));
    if (!f.cert) return S.narr('锁纹丝不动。\n伊辛的信上说，锁的是小姐生日的「日」和「月」。……小姐是哪天生的？' + (f.lockN >= 2 ? '\n小祭坛那边墙上，挂着一张镶框的证书。' : ''));
    if (f.lockN >= 3) return S.narr('锁纹丝不动。\n证书上写着：veinte de agosto——八月二十号。\n日在前，月在后：2、0、0、8。');
    return S.narr('锁纹丝不动。\n日在前，月在后。二十号……八月……');
  }
  async function hallMirror(S) {
    const e = S.ent('hmirror');
    if (S.f.hmScare) return S.narr('黑布又好好地蒙在镜子上了。你不打算再掀第二次。');
    await S.narr('走廊里的穿衣镜，也用黑布蒙着。\n老人说，家里办丧事的时候要把镜子都蒙起来——免得刚走的人在镜子里迷了路，回不了家。');
    const r = await choose(S, '黑布的一角，垂下来了一点。', ['掀开看看', '别动它'], '拉蒙');
    if (r) return S.narr('你把手缩了回来。\n有些规矩，最好别破。');
    S.f.hmScare = true; e.covered = null; S.sfx('tear');
    await S.narr('你捏住布角，轻轻一拉——');
    await S.narr('镜子里是你自己。肩膀上搭着毛巾，脸色发青。\n还有你身后，走廊尽头的楼梯口——');
    /* 不用大头像：镜子里多出一张白脸，一闪 */
    e.face = 'pale'; S.focus(7, 7);
    await S.scare('glitch', { sfx: 'sting', dur: .8, shake: 2 });
    e.face = null; e.covered = '#141014'; S.sfx('thud'); S.focus(null);
    await S.narr('黑布「唰」地一声自己落了回去，盖得严严实实。\n你回过头。楼梯口什么也没有。');
    await S.think('……她就在这栋房子里长大的。');
  }
  async function pianoOn(S) {
    if (!S.once('piano')) return S.narr('琴盖上落满了灰。你没敢再碰它。');
    await S.narr('一架老立式钢琴，琴盖上摆着几张泛黄的乐谱。最上面一张是一首 kundiman，旁边用铅笔写着：「Luz，左手慢一点。」');
    await S.narr('你按了一个琴键。\n没有声音——琴弦大概早就锈断了。');
    await S.wait(900); ghostKey(S); await S.wait(600);
    await S.narr('……你身后，另一个琴键，自己「叮」地响了一声。\n走了调的、长长的一声，在空房子里荡了很久。');
  }
  async function certOn(S) {
    const f = S.f;
    await S.narr('墙上挂着一个镶框的洗礼证书，西班牙文，花体字：\n「Certificado de Bautismo」\n「…Luz María Arcega y Reyes, nacida el día veinte de agosto de mil novecientos treinta y cinco…」');
    await S.narr('你只认得几个词：Luz，Arcega……\nveinte 是二十，agosto 是八月——他加禄话里的月份，也是这么叫的。');
    await S.think('露丝·玛利亚·阿尔塞加。八月二十号生的。');
    f.cert = true; f.knowName = true;
    if (!f.unlocked) S.goal(f.yaya ? '楼梯口的数字锁：小姐生日的「日」和「月」' : '在老宅里找找线索（楼梯口锁着）');
  }
  async function diaryOn(S) {
    const f = S.f;
    if (S.once('diaryFind')) await S.narr('书桌的抽屉里，压着一本蓝布面的小日记本。');
    await S.note('diary');
    if (f.diary) return;
    f.diary = true; f.knowName = true; f.phase = 'find';
    await S.think('粉盒。她找了四十三年的「镜子」，是这个。\n……掉在了大榕树的根里。');
    await S.think('可是根那么多。\n她只在镜子里出现……车上的后视镜，正对着 Lola。');
    S.goal('回大榕树下，从车上的后视镜里找她');
    S.cp('find');
  }
  async function wardrobeOn(S) {
    const e = S.ent('ward');
    if (S.f.wScare) return S.narr('衣柜门关着。里面那面长镜子……你不想再看见了。');
    S.f.wScare = true; e.open = true; S.sfx('open');
    await S.narr('衣柜里挂着几条旧裙子，都是白的、浅粉的，熨得平平整整。\n柜门内侧镶着一面长长的镜子。镜子里照出你，和你身后的房间——');
    /* 场景惊吓：床沿上真的坐着一个白衣人，回头就没了 */
    S.sfx('whisper'); await S.wait(400);
    const g = S.ent('bedg'); g.alpha = 1; S.show('bedg');
    await S.narr('床沿上，坐着一个人。\n白衣服，背对着你，头低着。长头发一直垂到床单上。');
    S.sfx('sting'); S.fx('glitch'); S.hide('bedg');
    e.open = false; S.sfx('close');
    await S.narr('你猛地回头。\n床上只有那件白色的 terno，平平整整地摊着，袖子像一对合起来的翅膀。');
  }

  /* ================= 接她，送她回 Lola ================= */
  /* 后视镜弹起：限时扳下去。守了规矩（挂了 sampaguita）多两秒 */
  const popT = S => (S.f.sampa ? 7 : 5);
  function flipDown(S, silent) { setM(S, { up: false, her: 1, eyes: false, lift: 0 }); S.clearTimer(); S.f.flipX = S.pl.x; if (!silent) S.sfx('switch'); }
  function popMirror(S) {
    if (S.f.phase !== 'ride') return;
    setM(S, { up: true, her: 2, eyes: false, lift: 0 }); S.sfx('switch'); S.bubble('pl', '!', 900);
    S.tone('sine', 1850, 1900, .9, .018, 0, 4000);
    S.timer(popT(S), '她在抬头', stareTimeout);
  }
  async function stareTimeout(S) {
    const f = S.f; if (f.phase !== 'ride') return;
    f.stares = (f.stares || 0) + 1;
    if (f.stares >= 3) {
      setM(S, { up: true, her: 3, eyes: true });
      await S.narr('后视镜里，她又抬起了头。\n这一次，你没能把眼睛移开。');
      return lookTooLong(S);
    }
    await S.scare('flash', { sfx: 'sting', dur: .5 });
    await stareChain(S, f.stares === 1 ? '你没来得及扳下后视镜。\n镜子里，她抬起了头——长发后面，是一片雾一样的白。' : '又一次。\n镜子里那片白，离你更近了。');
    if (f.stares === 2 && f.phase === 'ride') await S.think('不能再看了。下一次……我一定会忍不住。');
  }
  async function stareChain(S, text, parked) {
    setM(S, { up: true, her: 3 }); S.sfx('sting');
    await S.narr(text);
    let r = await choose(S, '你的眼睛，像是被什么东西勾住了。', ['移开视线！', '（再看一会儿）'], '拉蒙', 0);
    if (r === 0) { flipDown(S); await S.narr('你猛地把后视镜扳了下去，心脏差点从嗓子眼里跳出来。'); return; }
    setM(S, { eyes: true }); S.sfx('whisper');
    await S.scare('face', { spr: '@luz', face: 'glass', dur: .7, shake: 1 });
    await S.narr('白雾一样的脸上，慢慢浮出了一双眼睛。\n她在看你。不——她在看你的脸。看得很仔细，很仔细，像是在照镜子。');
    r = await choose(S, '……', ['移开！快移开！', '（……）'], '拉蒙', 0);
    if (r === 0) { flipDown(S); S.shake(400, 2); await S.narr('你用尽全身的力气，把视线从镜子上撕了下来。\n手心里全是汗。'); return; }
    return lookTooLong(S, parked);
  }
  async function lookTooLong(S, parked) {
    S.clearTimer(); S.amb('none');
    await S.scare('face', { spr: '@luz', face: 'glass', dur: 1.4 });
    S.fx('static');
    await S.narr('那双眼睛离你越来越近。\n不，是你离镜子越来越近。');
    await S.narr('镜子里的那张脸，一点一点，变成了你自己的。\n肩膀上搭着白毛巾，眼睛底下挂着两块青——');
    await S.narr('而你这边，什么也看不见了。\n只剩一片白。');
    await S.end({ bad: true, id: 'mirror', title: '后视镜里的脸', text: (parked ? '天亮以后，托尼奥在大榕树下发现了那辆出租车。' : '天亮以后，Undas 第一批扫墓的人路过巴雷特大道，看见一辆出租车停在大榕树下，') + '发动机还热着，驾驶座上没有人。\n后视镜被扳得正对着后座。\n\n后来，跑夜班的司机之间多了一个说法：\n半夜在巴雷特大道上，千万别看后视镜——镜子里现在不止一个了。\n有时候是个穿白衣服的姑娘；有时候，是个肩膀上搭着白毛巾的中年男人，低着头，在后座上摸来摸去，找自己的脸。' });
    await S.wait(10);
  }
  async function pickupScene(S) {
    const f = S.f;
    f.phase = 'ride0';
    S.ent('wl2').alpha = 1; S.show('wl2'); S.focus(57, 9);
    S.sfx('brake'); S.shake(300, 1);
    await S.narr('大道尽头，N. 多明戈街口的最后一盏路灯底下，站着一个穿白衣服的人。');
    await S.narr('她没有招手。\n她就站在那里，脸朝着你车上的后视镜。');
    S.focus(null);
    await S.narr('你把车停在她身边。还没等你开口，后车门就「咔哒」一声，自己开了。');
    S.sfx('open'); await S.alpha('wl2', 0, 600); S.sfx('close');
    S.wear('taxip'); setM(S, { up: true, her: 1 });
    await S.narr('后视镜里，她坐在后座正中间，低着头，两只手规规矩矩地放在膝盖上。\n湿头发的味道，混着一股很淡很淡的、老式香粉的味道。');
    await S.say('白衣女人', '……Manong. 回 Lola 那儿。', WS);
    const r = await S.ask('', ['……好。坐稳了。', '你……知道我找到它了？'], '拉蒙');
    if (r === 1) await S.say('白衣女人', '我闻到了。Mama 的粉的味道。', WS);
    await S.narr('你掉过车头。\n发动机在喘，油门踩到了底，车也只肯慢慢地往前爬——像拖着什么很重的东西。');
    S.turn(1); S.speed(.55);
    f.phase = 'ride'; f.ev = 0; f.stares = 0; f.midDone = 0;
    setM(S, { up: false, her: 1 });
    S.toast('后视镜一弹起来，就按调查键把它扳下去（' + popT(S) + ' 秒内）。别停车');
    S.goal('送她回大榕树下——别和后视镜里的她对视');
    f.flipX = S.pl.x;
    S.cp('ride');
    popMirror(S);
  }
  const RIDE_X = [52, 47, 42, 37];
  const RIDE = [
    async S => {
      await S.narr('路两边的 balete 一棵接一棵往后退。垂下来的气根扫过车顶，沙——沙——');
      await S.say('白衣女人', '……Manong。你找到了，对不对？', WS);
      const r = await choose(S, '粉盒在你胸前的口袋里，隔着衬衫，冰凉冰凉的。', ['找到了。到了 Lola 底下，就还给你。', '（把粉盒递到后面去）'], '拉蒙');
      if (r === 1) {
        await S.narr('你的手刚伸到椅背后面，就被一只手按住了。\n那只手冷得像刚从冰柜里拿出来。它轻轻地、却不容商量地，把你的手推了回来。');
        await S.say('白衣女人', '不是这里。……这里太亮了。我看不见。', WS);
      } else await S.say('白衣女人', '……嗯。', WS);
    },
    async S => {
      hum(S, .2);
      await S.narr('后座上，她轻轻地哼起歌来。\n一支很老很老的 kundiman——你 Lola 以前守着收音机听的那种，慢得像在叹气的情歌。');
      await S.narr('后窗外面，路灯一盏、一盏地灭了。\n是从你开过去的地方开始灭的。好像这条路正跟在车后面，慢慢合上。');
      await S.say('白衣女人', 'Manong，你有女儿吗？', WS);
      await S.ask('', ['有。十七岁了。', '……有。'], '拉蒙');
      await S.say('白衣女人', ['十七岁。……我十八了。', '跟她说，晚上出门以前，照一照镜子。', '照一照，就记得自己是谁，记得回家的路。'], WS);
    },
    async S => {
      await S.say('白衣女人', ['Manong……你看看我。', '我的脸……还在吗？'], WS);
      setM(S, { up: true, her: 2, lift: 2 }); S.sfx('heart');
      const r = await choose(S, '后视镜「啪」地一声，自己弹了起来。镜子边上，一缕黑头发慢慢地垂下来。', ['（不看。眼睛盯着前面的路）', '（抬眼看后视镜）'], '拉蒙', 0);
      if (r === 1) return stareChain(S, '镜子里，她抬起了头。\n长发向两边分开——后面没有脸。\n只有一片白，像一块起了雾的玻璃。');
      flipDown(S);
      await S.narr('你伸手把后视镜扳了下去，眼睛一直没离开挡风玻璃。');
      await S.say('拉蒙', '……还在。到了 Lola 底下，你自己看。');
      await S.say('白衣女人', '……Salamat.', WS);
    },
    async S => {
      S.sfx('heart');
      await S.narr('一只冰凉的手，轻轻搭在了你的肩膀上。搭在那条白毛巾上。');
      await S.narr('你没有回头，也没有看镜子。\n前面，大榕树的影子从黑暗里浮了出来。树下有一点小小的火光——是你点的那根蜡烛。');
      await S.say('白衣女人', 'Para po.', WS);
      await S.narr('她说「Para po」——就像每一个坐吉普尼、坐出租车的马尼拉人到站时说的那样。\n请停车。');
    }
  ];
  async function rideStep(S, x) {
    const f = S.f;
    if (f.ev < RIDE.length && x <= RIDE_X[f.ev]) {
      const i = f.ev++;
      flipDown(S, true);
      await RIDE[i](S);
      if (f.phase !== 'ride') return;
      if (f.ev < RIDE.length) { S.sfx('thud'); S.shake(200, 1); popMirror(S); return; }
      return arrive(S);
    }
    /* 两段剧情之间：扳下去开出两格以后，她还会再试一次 */
    const m = S.ent('rvm');
    if (f.phase === 'ride' && f.ev > 0 && f.ev < RIDE.length && f.midDone !== f.ev && m && !m.s.up && S.timerLeft == null && f.flipX != null && x <= f.flipX - 2 && x >= RIDE_X[f.ev] + 2) {
      f.midDone = f.ev; S.sfx('thud'); S.shake(200, 1); popMirror(S);
    }
  }
  async function arrive(S) {
    const f = S.f;
    S.clearTimer(); f.phase = 'final';
    S.sfx('brake');
    await S.narr('车在大榕树前停了下来。不是你踩的刹车——发动机自己熄了火。');
    setM(S, { up: true, her: 0 }); S.wear('taxi');
    await S.narr('你看了一眼后视镜。后座空了。\n树底下，那条系着红布条的气根前面，站着一个穿白衣服的人。');
    await goP(S, 'grove', 11, 14, 3, false);
  }

  /* ================= 结局 ================= */
  async function finale(S) {
    const f = S.f;
    await S.narr('她背对着你，站在 Lola 的气根前面。\n白衣服的下摆一动不动——明明有风。');
    await S.say('白衣女人', '……你知道我叫什么吗？', WS);
    const opts = ['你是……巴雷特大道的白衣女人。', '露丝。露丝·阿尔塞加。', '……我不知道。'];
    const rv = await S.vote('她没有回头。', opts, '拉蒙');
    if (!rv.agree) {
      await S.narr('你张了张嘴，脑子里却同时冒出了两个回答：「' + opts[rv.h] + '」「' + opts[rv.g] + '」\n两个声音搅在一起，哪一个都不像是在叫她。');
      await S.narr('她的肩膀轻轻抖了一下。');
      S.goal('一起叫出她的名字（联机时两人要选同一个）');
      return;
    }
    const r = rv.v;
    if (r !== 1) {
      await S.say('白衣女人', r === 0 ? ['大家都这么叫我。', '四十三年了。开车的、走路的、写报纸的……都这么叫我。'] : '……', WS);
      await S.narr('她的肩膀轻轻抖了一下。\n她想听的，不是这个。');
      S.goal('叫她的名字（老宅里的洗礼证书和日记上写着）');
      return;
    }
    const g = S.ent('luzg'); g.dir = 0;
    await S.narr('她慢慢地转过身来。\n长发还垂着，遮住了整张脸。');
    await S.say('露丝', '……露丝。对。我叫露丝。', WS);
    await S.narr('你从口袋里掏出那个粉盒，双手递了过去。');
    S.take('polvera');
    await S.narr('她接了过去。指尖碰到你的手，冷得像井水。\n她用拇指摸着盖子上的珍珠母贝，摸了很久，很久。');
    S.sfx('open'); await S.wait(500); S.sfx('chime');
    await S.narr('「咔哒」。粉盒打开了。\n她把脸凑近那面小小的圆镜子——');
    g.spr = '@luzf'; S.fx('flash'); g.light = { r: 2.4, col: 'rgba(240,240,255,.22)' };
    await S.narr('长发向两边滑开了。\n后面是一张十八岁姑娘的脸：圆圆的，眉毛很浓，左边嘴角有一颗小小的痣。\n和老宅二楼那张照片上的，一模一样。');
    await S.say('露丝', ['……原来我长这样。我都快忘了。', '那天晚上出门以前，我照了好久。Mama 说，照一照，就记得回家的路。', '后来它掉进了 Lola 的根里。我找啊找……找不到镜子，就看不见自己的脸。看不见自己的脸，就想不起来，家在哪儿。']);
    await S.say('露丝', '所以我只好……借别人的镜子看一看。', WS);
    await S.say('拉蒙', '……所以你才一直坐在后座上。');
    await S.say('露丝', '吓到你们了吧。……Pasensya na po. 对不起。');
    const fw = ['回家吧，露丝。你 Mama 在等你。', '……替我们这些开夜车的，道一声晚安吧。'];
    const r2 = await S.vote('她把粉盒合上，捂在胸口。', fw, '拉蒙');
    if (!r2.agree) {
      await S.narr('你一开口，两句话一起涌了出来：「' + fw[0] + '」「' + fw[1] + '」');
      await S.say('露丝', ['（她笑了）……两句我都听见了。', '这一回，我记得路了。晚安，Manong。开车小心——别看后视镜。'], WS);
    } else await S.say('露丝', r2.v === 0 ? '嗯。……这一回，我记得路了。' : ['（她笑了）……晚安，Manong。', '开车小心。别看后视镜。'], WS);
    await S.say('露丝', 'Salamat po.', WS);
    g.dir = 3;
    await S.narr('她转过身，对着大榕树，低下了头。');
    await S.say('露丝', 'Tabi tabi po.', WS);
    S.sfx('chime');
    await S.narr('气根像帘子一样，轻轻地向两边分开了。\n她走了进去。');
    await S.walk('luzg', 'u', 1.2);
    await S.alpha('luzg', 0, 2000);
    const e = S.ent('r3'); e.lit = false; e.light = null;
    S.sfx('whisper');
    await S.narr('树下的蜡烛「噗」地一声灭了。\n风从气根之间穿过去，沙沙地响了很久，像一声长长的叹气。');
    S.dark(.55); S.amb('night');
    await S.narr('东边的天，开始发白。\n远处传来第一班吉普尼的喇叭声。');
    await S.say('托尼奥（远处）', 'Pare……！天亮了！你的车——你的车灯自己亮了！');
    await S.fade(1, 1400);
    await S.card('十一月一日　Undas', '', '天亮以后，你把车开回了内娜阿姨的小摊。\n伯托什么也没问，给你倒了一杯滚烫的 kapeng barako。\n墙上那张规矩，第七条的后半句还糊在油渍底下。\n你借了内娜阿姨的圆珠笔，在旁边补上：\n「——帮她找。」\n\n下午，你带着老婆和女儿去公墓扫墓。\n回来的路上，你在大榕树底下停了停车，点了一根白蜡烛。\n女儿问你，这是给谁的。\n你说：给一个找到了回家的路的姑娘。');
    await S.end({ id: 'home', title: '第七夜　完', text: '后来，巴雷特大道上还是有人说见过白衣女人。传说就是这样，一旦讲开了，就再也收不回去。\n\n只是跑夜班的司机之间，慢慢多了一个新的说法：\n要是半夜在后座上看见一个穿白衣服的姑娘，别怕。\n她手里攥着一个粉盒，偶尔打开来照一照——\n\n她只是在确认，自己还记得回家的路。' });
  }

  const lampOn = t => S => S.narr(t);
  let idleT = 0;   // 载她回去时停车的时长（只在主机 tick 里用）
  defChapter({
    id: 'balete', n: 7, title: '巴雷特大道的白衣女人', sub: '凌晨的老路，两旁是住着精灵的榕树。别看后视镜——她就坐在后座上，在找什么东西。', origin: '菲律宾马尼拉都市传说', color: '#1e2c1c',
    icon: '@luz', amb: 'night', floor: 'concrete', wall: 'concrete', dark: .8, plr: 3,
    people: {
      me: { key: 'bl-me', skin: '#b8865e', hair: '#1a1414', hs: 'short', top: '#4a6a5a', top2: '#d8d0c0', bottom: '#3a3a44', shoes: '#2a2018',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT, 3, 5, '#ecead8'); R(4, G.tT + 5, 2, 1, '#d0ceba'); } else if (d === 1) { R(6, G.tT, 4, 2, '#ecead8'); R(8, G.tT + 2, 2, 3, '#ecead8'); } else if (d === 3) { R(9, G.tT, 3, 5, '#ecead8'); } } },
      berto: { key: 'bl-berto', skin: '#a87a54', hair: '#b8b4ac', hs: 'short', hat: 'cap', hatC: '#2a4a8a', top: '#9a3a2a', top2: '#e0d0b0', bottom: '#4a4038', shoes: '#2a2018',
        extra(g, d, fr, G, R) { if (d === 0) R(6, G.hT + 6, 4, 1, '#8a8680'); else if (d === 1) R(4, G.hT + 6, 2, 1, '#8a8680'); } },
      nena: { skin: '#c08a64', hair: '#1e1616', hs: 'bun', top: '#c86a8a', top2: '#f0e0e8', bottom: '#4a3a4a', skirt: true, apron: '#e8e0d0', shoes: '#3a2a2a' },
      pacing: { skin: '#a87a58', hair: '#c8c4bc', hs: 'bun', hat: 'scarf', hatC: '#6a5a8a', top: '#7a6a4a', top2: '#5a4a34', bottom: '#4a3a2a', skirt: true, shoes: '#2a2018' },
      tonyo: { key: 'bl-tonyo', skin: '#b0805a', hair: '#1a1414', hs: 'short', hat: 'cap', hatC: '#1e2a4a', top: '#8aa8c8', top2: '#1e2a4a', bottom: '#1e2a4a', shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(9, G.tT + 2, 1, 1, '#e8c860'); R(4, G.tT + 7, 1, 2, '#2a2a2a'); } } },
      luz: { key: 'bl-luz', skin: '#e6e8ec', hair: '#0e0a0c', hs: 'long', cover: true, top: '#f0f0f2', top2: '#ffffff', bottom: '#f0f0f2', dress: true, ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT, 1, 8, '#0e0a0c'); R(12, G.tT, 1, 8, '#0e0a0c'); } else if (d === 3) R(4, G.tT, 8, 7, '#0e0a0c'); } },
      luzf: { key: 'bl-luzf', skin: '#e8dcd0', hair: '#1a1214', hs: 'long', top: '#f4f2ee', top2: '#ffffff', bottom: '#f4f2ee', dress: true, ghost: true, mouth: '#b07070',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 3, 1, 1, '#1a1214'); R(9, G.hT + 3, 1, 1, '#1a1214'); R(6, G.hT + 6, 1, 1, '#5a4040'); } } }
    },
    items: {
      sampa: { name: 'Sampaguita 花串', desc: '帕辛奶奶用细线穿的茉莉花串，白得发亮，香得发甜。司机们喜欢把它挂在后视镜上。' },
      kandila: { name: '白蜡烛', desc: '一根白蜡烛，用旧报纸包着，里面塞了一小盒火柴。本来是给 Undas 扫墓点的。' },
      polvera: { name: '珍珠母贝粉盒', desc: '巴掌大的圆粉盒，盖子镶着珍珠母贝，在暗处泛着一层虹光。打开是一面小圆镜。\n盖子背面刻着：Para kay Luz — Mama, 1953。' }
    },
    notes: {
      rules: { title: '巴雷特大道　夜班须知', text: '（一张油腻腻的硬纸板，用胶带贴在小吃摊的墙上。字迹换过好几种笔，像是很多人一条一条添上去的。）\n\n1. 过了十二点，能绕就绕。\n2. 路边穿白衣服的女人招手，别停。不管她多可怜。\n3. 开进大道之前，把后视镜扳下去。别看后座。\n4. 经过最大的那棵 balete（Lola），心里说一声：Tabi tabi po。\n5. 后视镜上挂一串 sampaguita，或者一串念珠。\n6. 要是她已经坐在后座上了——别回头。别对着镜子看她的眼睛。开到有灯的地方去。\n\n（底下有人用红圆珠笔添了一行：）\n7. 她要是问你看没看见她的东西——\n\n（后半句被一块油渍糊掉了。）' },
      clip: { title: '旧剪报 ·《马尼拉夜报》1953年11月3日', text: '新马尼拉区一少女诸圣节前夜未归\n\n上月三十一日深夜，家住巴雷特大道的阿尔塞加家十八岁长女露丝小姐，从亲戚家返家途中失去联络。两日后，有人在大道旁的一棵大榕树下找到了她。警方表示仍在调查。邻居说，露丝小姐性情温和，每个礼拜天都在教堂唱诗班唱歌。\n\n（背面贴着几年以后的一则读者来信：）\n「……我的司机发誓说，半夜开过巴雷特大道时，后视镜里的后座上坐着一位白衣小姐，一直低着头，像在找什么东西。他停车回头，后座是空的。」' },
      yaya: { title: '女佣伊辛的信（没有寄出）', text: 'Señora：\n\n您和老爷搬去宿务以后，我还是每个礼拜来擦一次房子。镜子都照您说的，用黑布蒙着——小姐出殡那天蒙上的，一直没揭开。\n\n小姐房间的楼梯门，我用您那把数字锁锁上了。您锁东西从来只用一个数：小姐生日那天的「日」和「月」，日在前。\n\n镇上的司机开始说，大道上有个白衣服的女人拦车，坐在后座上找东西。\nSeñora，我知道她在找什么。那天晚上出门以前，她把您送的珍珠母贝粉盒揣进了兜里。警察送回来的东西里，没有它。\n\n我去大榕树底下找过。根太密了，我不敢伸手。\n\n——伊辛　1954年　万灵节' },
      diary: { title: '露丝的日记（最后几页）', text: '1953年8月20日\n十八岁了！Mama 送了我一个粉盒，盖子是珍珠母贝的，里面嵌着一面小圆镜。Mama 说：「女孩子出门以前照一照，就记得自己是谁，记得回家的路。」\n\n1953年9月14日\n大道上的 balete 又垂下好多根，像头发。Lola（真的奶奶）说那里住着「不是我们的」东西，经过要说 tabi tabi po。我每次都说。我还给最大的那棵系了一根红布条，许了个愿。是秘密。\n\n1953年10月31日\n今晚去 Tita 家帮忙扎 Undas 的花，会晚一点回来。Mama 不放心，我说没事——我带着镜子呢。我记得回家的路。\n\n（后面的页，都是空的。）' },
    },
    legend: '巴雷特大道（Balete Drive）是马尼拉大都会奎松市新马尼拉区的一条老路。据说它得名于从前长在路中央的一棵巨大的 balete 树，车到那里都得绕着走；那棵树如今已经不在了。balete 是一类会缠绕、绞杀宿主的榕属植物，菲律宾民间普遍相信它是精灵和鬼魂的住处：树杈上坐着抽大雪茄的巨人 kapre，还有 diwata、tikbalang；树旁的土丘里住着「土丘老人」nuno sa punso。很多人家不愿在院子里种它。经过大树或荒僻的地方，老一辈会低声说一句「Tabi tabi po」——请让让路，免得冒犯看不见的住户。\n\n白衣女人（White Lady）的故事据说从二十世纪五十年代就开始流传。最常见的讲法是：深夜开车经过的人，看见一个白衣长发的年轻女人在路边招手；或者一抬眼，她已经坐在后座上了，再回头，座位是空的。有的说她很美，有的说她脸上带着伤和血。据说五十年代有一位警官讲过：他在巡逻车上载过一位白衣姑娘，开到半路回头，人不见了，车门却还锁着。出租车司机之间流传着各种忌讳：夜里尽量绕开这条路，别载独自一人的白衣女子，别看后视镜；不少车的后视镜上挂着念珠或茉莉花串（sampaguita）。\n\n关于她的来历，几乎每个版本都离不开那棵路中央的大树：有的说她被车撞死，肇事的人逃了；有的说她被一个出租车司机所害，就埋在树下，所以专拦出租车；有的说她是个女大学生，还在这条街上找害她的人；也有的说她是路边某座大宅里的小姐，被自己家里人所害，向路过的司机求救。另一种说法认为，故事是 1953 年一位记者为了写出好看的稿子编出来的；还有人考证，它是从五十年代初一篇杂志文章一路添油加醋来的，真正的车祸发生在附近的 E. 罗德里格斯大道上。七十年代以后，这条路铺成了柏油大路，两旁的老树砍掉了不少，但它仍是菲律宾最有名的「闹鬼的路」，1988 年还被拍成了恐怖电影。菲律宾各地也有许多别的「白衣女人」，比如碧瑶的 Loakan 路。\n\n（本章中的露丝·阿尔塞加、阿尔塞加老宅、珍珠母贝粉盒、她「没有脸」而在找镜子的设定、大榕树 Lola、「夜班须知」上的规矩，以及内娜阿姨、伯托、帕辛奶奶、托尼奥等所有人物和情节，均为游戏虚构。）',
    endings: { home: '找到了回家的路', mirror: '后视镜里的脸', keep: '她的镜子' },
    start: { map: 'stand', x: 9, y: 6, dir: 3 },
    resume: {
      ride: async S => {
        setM(S, { up: false, her: 1, eyes: false, lift: 0 }); S.amb('car'); S.f.flipX = S.pl.x;
        S.toast('后视镜一弹起来，就按调查键把它扳下去。别停车');
        S.after(1500, async S2 => popMirror(S2));
      }
    },
    faces: {
      /* 后座上的她：湿长发像帘子一样垂着，发缝慢慢分开——后面是一片没有五官的白；底下两只手伸上来 */
      luz(R, a, t) {
        const H = '#0a0709', H2 = '#1e171a', H3 = '#2c2428', SK = '#eceef1', SK2 = '#c4c8ce', DR = '#dcdee2';
        R(0, 0, 32, 32, '#020203');
        R(2, 25, 28, 7, DR); R(4, 24, 24, 2, '#f4f5f7'); R(14, 24, 4, 3, '#b8bcc2');
        R(10, 1, 12, 2, H); R(8, 3, 16, 3, H); R(6, 6, 20, 6, H); R(5, 12, 22, 14, H); R(4, 18, 24, 10, H); R(3, 24, 4, 6, H); R(25, 24, 4, 6, H);
        const g = Math.min(5, Math.round(a * 7)), sw = Math.round(Math.sin(t * 3) * .6);
        if (g > 0) {
          R(16 - g, 8, g * 2, 15, SK2); R(17 - g, 7, g * 2 - 2, 17, SK);
          if (g > 2) { R(13, 13, 2, 1, '#d8dbe0'); R(17, 13, 2, 1, '#d8dbe0'); R(15, 19, 2, 1, '#d4d7dc'); }   // 该有五官的地方，只有几道浅浅的雾痕
          for (let i = 0; i < 3; i++) R(16 - g + i * 2 + 1, 9 + i * 4, 1, 5, 'rgba(10,7,9,.75)');           // 贴在脸上的几缕湿发
        }
        for (let i = 0; i < 11; i++) { const x = 5 + i * 2 + (i % 3 === 0 ? 1 : 0); if (g && x > 15 - g && x < 16 + g) continue; R(x + (i % 2 ? sw : 0), 5 + (i % 4) * 2, 1, 21 - (i % 3) * 3, i % 2 ? H2 : H3); }
        R(8, 26, 1, 3, '#7a8a9a'); R(23, 27, 1, 3, '#7a8a9a');   // 发梢滴水
        const hy = 31 - Math.round(a * 5);
        R(7, hy, 2, 6, SK2); R(9, hy - 1, 1, 7, SK2); R(6, hy + 1, 1, 5, SK2); R(23, hy, 2, 6, SK2); R(22, hy - 1, 1, 7, SK2); R(25, hy + 1, 1, 5, SK2);
      },
      /* 后视镜里：一片雾白的脸，眼睛慢慢浮出来——最后变成你自己（白毛巾、眼袋、短头发） */
      glass(R, a, t) {
        R(0, 0, 32, 32, '#000');
        R(0, 6, 32, 20, '#141416'); R(1, 7, 30, 18, '#2a2a2e'); R(2, 8, 28, 16, '#18202c');
        const me = a > .62, H = '#0e0a0c', SK = me ? '#c9a07e' : '#e8eaee';
        if (!me) { R(8, 8, 16, 16, H); R(7, 12, 3, 12, H); R(22, 12, 3, 12, H); }
        else { R(11, 8, 10, 4, '#1a1414'); R(10, 9, 1, 4, '#1a1414'); R(21, 9, 1, 4, '#1a1414'); R(4, 21, 7, 3, '#ecead8'); R(5, 20, 4, 1, '#ecead8'); R(11, 22, 10, 2, '#4a6a5a'); }
        R(11, 10, 10, 13, SK); R(12, 9, 8, 1, SK);
        for (let i = 0; i < 4; i++) R(11, 11 + i * 3, 10, 1, me ? 'rgba(160,120,90,.35)' : 'rgba(200,205,215,.6)');   // 雾
        if (a > .2) { const e = a > .45 ? 2 : 1; R(13, 14, 2, e, '#0a0a0c'); R(17, 14, 2, e, '#0a0a0c'); if (a > .45) { R(13, 14, 1, 1, '#fff'); R(17, 14, 1, 1, '#fff'); } }
        if (me) { R(13, 16, 2, 1, '#6a5a6a'); R(17, 16, 2, 1, '#6a5a6a'); R(14, 20, 4, 1, '#7a4a3a'); }
        R(2, 8, 1, 16, 'rgba(255,255,255,.18)'); R(3, 8, 6, 1, 'rgba(255,255,255,.12)');
        if (Math.sin(t * 40) > .7) R(2, 8 + ((t * 60) | 0) % 16, 28, 1, 'rgba(255,255,255,.08)');
      }
    },
    async intro(S) {
      await S.card('第七夜　巴雷特大道的白衣女人', '1996年11月1日　凌晨一点四十分　菲律宾 马尼拉 奎松市', '天一亮就是 Undas——诸圣节，菲律宾人回家扫墓的日子。\n半个马尼拉都挤上了回乡下的大巴，街上空得出奇。\n\n你跑了一整夜出租车，\n在 E. 罗德里格斯大道路口的小吃摊上，吃今晚的第一顿饭。\n\n回家最近的路，是穿过新马尼拉区的那条老路——\n巴雷特大道。');
    },
    thumb(g, w, h) {
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      R(0, 0, w, 24, '#08100b');
      for (let i = 0; i < 26; i++) R(i * 6 + ((hash(i, 1, 7) * 4) | 0), 14, 1, 22 + ((hash(i, 2, 7) * 34) | 0), '#1c2618');
      R(10, 18, 14, 50, '#1e1a14'); R(136, 16, 14, 52, '#1e1a14');
      const gr = g.createRadialGradient(118, 30, 0, 118, 30, 46); gr.addColorStop(0, 'rgba(255,205,110,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(60, 0, 100, 80);
      R(117, 30, 2, 38, '#2a2a2e'); R(113, 27, 10, 3, '#ffe08a');
      R(14, 4, 46, 15, '#111'); R(16, 6, 42, 11, '#1e2632'); R(40, 8, 7, 9, '#e8e8ec'); R(39, 7, 9, 5, '#0e0a0c'); R(39, 9, 1, 7, '#0e0a0c'); R(47, 9, 1, 7, '#0e0a0c');
      for (let i = 0; i < 9; i++) R(28 + i, 19 + Math.round(Math.sin(i / 8 * Math.PI) * 4), 1, 1, '#f8f6ea');
    },
    sprites: {
      taxi(g, e, t, R) { taxiSpr(e, R, false); },
      taxip(g, e, t, R) { taxiSpr(e, R, true); },
      rvm(g, e, t, R) {   // 后视镜：挂在出租车上方（实体与玩家同格）
        const x0 = -12, y0 = -38;
        R(7, y0 + 12, 2, 4, '#1a1a1a');
        const warn = e.up && e.her === 2 && Math.sin(t * 9) > 0;   // 她在抬头：镜框一闪一闪地泛红
        R(x0, y0, 40, 13, warn ? '#8a1414' : '#0c0c0e'); R(x0 + 1, y0 + 1, 38, 11, warn ? '#4a1a1c' : '#2c2c30');
        const gx = x0 + 2, gy = y0 + 2, gw = 36, gh = 9;
        if (!e.up) { R(gx, gy, gw, gh, '#0b0d12'); R(gx + 3, gy + 2, 10, 1, '#1c2230'); R(gx + 20, gy + 5, 8, 1, '#1c2230'); }
        else {
          R(gx, gy, gw, gh, '#141a24');
          R(gx + 5, gy, 26, 5, '#0a0e16');
          for (let i = 0; i < 3; i++) R(gx + 8 + i * 8, gy + 2, 1, 1, Math.sin(t * 2 + i) > 0 ? '#e8c870' : '#7a6438');
          R(gx, gy + 6, gw, 3, '#3a2a22'); R(gx, gy + 6, gw, 1, '#4a382c');
          const h = e.her | 0, hx = gx + 22;
          if (h === 1) { R(hx, gy + 3, 6, 6, '#e8e6e0'); R(hx, gy + 2, 6, 6, '#120c0e'); }
          else if (h === 2) { const L = e.lift | 0, u = L > 1 ? 1 : 0; R(hx, gy + 2 - u, 6, 7 + u, '#e8e6e0'); R(hx, gy + 1 - u, 6, Math.max(1, 4 - L), '#120c0e'); R(hx, gy + 5 - L, 1, 4 + L, '#120c0e'); R(hx + 5, gy + 5 - L, 1, 4 + L, '#120c0e'); if (L < 3) R(hx + 2, gy + 4, 2, 1, '#d8d4cc'); }
          else if (h === 3) { R(hx - 2, gy, 10, 9, '#120c0e'); R(hx, gy + 1, 6, 6, '#f2f0ec'); R(hx, gy + 7, 6, 2, '#e8e6e0'); if (e.eyes) { R(hx + 1, gy + 3, 1, 1, '#111'); R(hx + 4, gy + 3, 1, 1, '#111'); } }
          R(gx + 1, gy, 1, gh, 'rgba(255,255,255,.12)');
        }
        if (e.flower) { for (let i = 0; i < 11; i++) R(x0 + 14 + i, y0 + 13 + Math.round(Math.sin(i / 10 * Math.PI) * 4), 1, 1, i % 2 ? '#f8f6ea' : '#dfe8d0'); R(x0 + 19, y0 + 18, 2, 2, '#f8f6ea'); }
      },
      btree(g, e, t, R) {   // 路边的 balete：占一格，向上伸出树冠和气根
        const k = e.big ? 1 : 0, D = '#09110c', C = '#132219', C2 = '#1b2f20';
        const sth = e.south ? 1 : 0, cw = 52 + k * 24 - sth * 12, cx = 8 - cw / 2, cy = -50 - k * 10 + sth * 18;
        R(cx, cy, cw, 30 + k * 6, D); R(cx + 6, cy - 6, cw - 12, 8, D);
        for (let i = 0; i < 12 + k * 6; i++) R(cx + 2 + ((hash(i, e.x, 1) * (cw - 6)) | 0), cy - 2 + ((hash(i, e.x, 2) * 26) | 0), 4, 3, i % 2 ? C : C2);
        const ty = e.south ? -12 : -24; for (let i = 0; i < 8; i++) R(1 + i * 2, ty, 2, 14 - ty, i % 2 ? '#3a3226' : '#2a2419');
        for (let i = 0; i < 10 + k * 4; i++) { const x = cx + 3 + i * 5 + ((hash(i, e.x, 3) * 3) | 0), len = (e.south ? 6 : 12) + ((hash(i, e.x, 4) * (e.south ? 14 : 26)) | 0); R(x, ty, 1, len, '#2a2419'); }
        R(-3, 13, 22, 3, 'rgba(0,0,0,.45)');
      },
      bigbalete(g, e, t, R) {   // Lola：6×3
        const D = '#08100b', C = '#122017', C2 = '#1a2e1f';
        R(-44, -86, 184, 52, D); R(-30, -96, 156, 14, D); R(-52, -70, 16, 30, D); R(132, -72, 14, 30, D);
        for (let i = 0; i < 46; i++) R(-40 + ((hash(i, 3, 11) * 176) | 0), -92 + ((hash(i, 4, 11) * 54) | 0), 6, 4, i % 3 ? C : C2);
        for (let i = 0; i < 26; i++) { const x = -38 + i * 7 + ((hash(i, 5, 11) * 4) | 0), len = 24 + ((hash(i, 6, 11) * 40) | 0); R(x, -40, 1, len, i % 2 ? '#2e281e' : '#241f17'); }
        for (let i = 0; i < 31; i++) { const x = 2 + i * 3, off = (hash(i, 7, 11) * 10) | 0; R(x, -38 + off, 3, 84 - off, i % 3 === 0 ? '#4a3e2c' : i % 3 === 1 ? '#362c20' : '#2a2218'); }
        R(30, 8, 10, 16, '#06050a'); R(56, -6, 8, 12, '#06050a'); R(18, 20, 6, 8, '#06050a'); R(70, 24, 8, 10, '#06050a');
        R(20, 2, 2, 6, '#8a2a2a'); R(60, 0, 4, 3, '#e8e0c8'); R(76, 12, 2, 6, '#c8b840'); R(44, -10, 3, 4, '#d8d0e8'); R(84, -4, 4, 3, '#e8e0c8');
        R(-6, 44, 108, 4, 'rgba(0,0,0,.45)');
        if (e.ember) { R(70, -62, 2, 2, Math.sin(t * 6) > 0 ? '#ff7a2a' : '#c04010'); R(68, -66, 1, 3, 'rgba(200,200,200,.3)'); }
      },
      broot(g, e, t, R) {   // Lola 的一条气根
        for (let i = 0; i < 6; i++) { const o = (hash(i, e.y, 5) * 6) | 0; R(1 + i * 2 + ((hash(i, e.x, 9) * 2) | 0), -12 + o, 2, 27 - o, i % 2 ? '#3e3426' : '#2c241a'); }
        R(0, 13, 16, 2, '#1e1810');
        const k = e.kind;
        if (k === 'coin') { R(5, 2, 2, 2, '#c9a35a'); R(9, 6, 2, 2, '#8a9a6a'); R(6, 9, 2, 2, '#c9a35a'); }
        if (k === 'rosary') { for (let i = 0; i < 7; i++) R(4 + i, 1 + Math.abs(i - 3), 1, 1, '#e0dce8'); R(7, 5, 1, 3, '#e0dce8'); R(6, 6, 3, 1, '#e0dce8'); }
        if (k === 'ribbon') { const c = e.col || '#8a2a2a'; R(5, -4, 6, 2, c); R(6, -2, 1, 6, c); R(9, -2, 1, 4, c); }
        if (k === 'hanky') { R(4, 1, 7, 6, '#e8e4d8'); R(4, 6, 7, 1, '#c8c4b8'); }
        if (k === 'wax') { R(2, 10, 3, 5, '#e8e2cc'); R(9, 11, 4, 4, '#e8e2cc'); R(6, 12, 2, 3, '#d8d2bc'); }
        if (e.lit) { R(6, 9, 3, 6, '#f0ead4'); const f = Math.sin(t * 15 + e.x) > 0 ? 1 : 0; R(7, 5 + f, 1, 4 - f, '#ffcf5a'); R(7, 7, 1, 1, '#fff2b0'); }
      },
      grotto(g, e, t, R) {
        box(R, 1, -14, 14, 28, '#8a8478'); R(3, -12, 10, 18, '#22222c');
        R(6, -10, 4, 3, '#e8dcc8'); R(5, -9, 6, 2, '#5a7ab0'); R(5, -7, 6, 12, '#5a7ab0'); R(7, -7, 2, 11, '#e8e8f0'); R(5, -12, 6, 2, '#f0e8a0');
        for (let i = 0; i < 3; i++) { R(3 + i * 4, 8, 2, 5, '#e8e2cc'); const f = Math.sin(t * 13 + i * 2) > 0 ? 1 : 0; R(3 + i * 4, 5 + f, 2, 3 - f, '#ffcf5a'); }
        R(0, 13, 16, 2, '#4a4640'); R(11, 10, 3, 3, '#c84a4a');
      },
      punso(g, e, t, R) { R(2, 9, 12, 6, '#4a3a28'); R(4, 7, 8, 3, '#5a4632'); R(6, 5, 4, 2, '#6a5640'); R(7, 4, 2, 1, '#6a5640'); R(5, 10, 1, 1, '#2a2018'); R(10, 11, 1, 1, '#2a2018'); },
      mgate(g, e, t, R) {
        R(-2, -6, 5, 20, '#6a6660'); R(13, -6, 5, 20, '#6a6660'); R(-3, -8, 7, 3, '#4a4640'); R(12, -8, 7, 3, '#4a4640');
        R(3, -2, 10, 16, '#0a0a0c'); for (let x = 3; x < 13; x += 2) R(x, -2, 1, 16, '#2a2a30'); R(3, 2, 10, 1, '#3a3a44'); R(3, 9, 10, 1, '#3a3a44');
      },
      agate(g, e, t, R) {
        const rust = '#6a3e22';
        R(-2, -6, 5, 20, '#5e5850'); R(13, -6, 5, 20, '#5e5850'); R(-3, -8, 7, 3, '#3e3a34'); R(12, -8, 7, 3, '#3e3a34');
        R(-1, 0, 3, 2, '#9a7a3a');
        R(3, -2, 10, 16, '#070708');
        for (let x = 3; x < 13; x += 2) if (!e.open || x < 6) R(x, -2, 1, 16, rust);
        R(3, 3, 10, 1, '#4a2e1a'); R(6, 13, 2, 1, '#6a6a6a'); R(8, 14, 3, 1, '#6a6a6a');
        R(-1, 10, 2, 4, '#2a3a1e'); R(13, 9, 3, 5, '#2a3a1e');
      },
      guardhouse(g, e, t, R) {
        R(0, 14, 32, 2, 'rgba(0,0,0,.4)'); box(R, 1, -14, 30, 29, '#b8b098'); R(-1, -18, 34, 5, '#3a4a5a');
        R(4, -8, 14, 9, '#2a2418'); R(5, -7, 12, 7, '#e8d080'); R(7, -5, 3, 2, '#c8a860');
        R(21, -6, 8, 20, '#5a4a3a'); R(27, 4, 1, 2, '#c9a35a'); R(6, -16, 20, 3, '#1e2a4a'); R(9, -15, 14, 1, '#e8e8e8');
      },
      jeep(g, e, t, R) {   // 吉普尼，横向 3 格
        R(0, 14, 48, 2, 'rgba(0,0,0,.45)');
        box(R, 0, -2, 44, 14, '#c8ccd4'); R(1, 0, 42, 2, '#d83030'); R(1, 8, 42, 1, '#2a6ab0'); R(1, 9, 42, 1, '#f0c030');
        R(2, -10, 36, 9, '#e8e0c8'); R(2, -11, 36, 2, '#c8302a'); R(6, -8, 10, 2, '#2a2a2a'); R(19, -8, 14, 2, '#2a2a2a');
        for (let i = 0; i < 5; i++) R(4 + i * 6, 1, 4, 5, '#141820');
        R(37, 1, 6, 6, '#141820'); box(R, 42, 2, 6, 10, '#b8bcc4');
        R(44, -4, 2, 4, '#e8e8f0'); R(43, -6, 4, 2, '#e8e8f0'); R(46, 5, 2, 3, '#fff2b0');
        R(4, 10, 8, 6, '#111'); R(32, 10, 8, 6, '#111'); R(6, 12, 4, 2, '#666'); R(34, 12, 4, 2, '#666');
      },
      csign(g, e, t, R) { R(0, 0, 48, 13, '#2a1a10'); R(1, 1, 46, 11, '#b8302a'); for (let i = 0; i < 7; i++) R(3 + i * 6, 3, 4, 3, '#f8e070'); R(3, 8, 42, 1, '#f8d8a0'); for (let i = 0; i < 4; i++) R(8 + i * 9, 10, 5, 1, '#f8d8a0'); },
      kaldero(g, e, t, R) {
        SPR.counter(g, e, t, R); const c = e.pot || '#8a8a90';
        R(2, -5, 12, 6, shade(c, -.3)); R(3, -4, 10, 5, c); R(2, -6, 12, 1, shade(c, .2)); R(6, -8, 4, 2, '#333');
        const s = Math.sin(t * 2 + e.x); R(5 + s, -12, 1, 3, 'rgba(230,230,230,.35)'); R(9 - s, -14, 1, 3, 'rgba(230,230,230,.25)');
      },
      radio(g, e, t, R) { SPR.counter(g, e, t, R); R(3, -4, 10, 6, '#3a2a1e'); R(4, -3, 5, 4, '#c8b080'); for (let y = -3; y < 1; y += 2) R(4, y, 5, 1, '#8a7050'); R(10, -3, 2, 2, Math.sin(t * 3) > 0 ? '#ffb040' : '#c87020'); R(11, -10, 1, 7, '#aaa'); },
      sari(g, e, t, R) { box(R, 0, 0, 32, 14, '#5a4a32'); R(2, 2, 28, 10, '#1a1612'); for (let i = 0; i < 9; i++) R(3 + i * 3, 3 + (i % 2), 2, 5, ['#e85a30', '#3a8ae8', '#f0d040', '#3ac060'][i % 4]); for (let x = 3; x < 30; x += 3) R(x, 2, 1, 10, '#6a6a70'); R(4, -2, 24, 2, '#e8e8e8'); R(6, -2, 6, 1, '#c03030'); },
      bilao(g, e, t, R) { R(1, 8, 14, 6, '#a8844a'); R(2, 7, 12, 1, '#c8a060'); for (let i = 0; i < 5; i++) { R(3 + i * 2, 8, 1, 1, '#f8f8ea'); R(3 + i * 2, 10, 1, 1, '#f0f4e0'); } R(10, 9, 2, 4, '#e8e2cc'); R(12, 9, 2, 4, '#e8e2cc'); },
      aso(g, e, t, R) { const b = Math.sin(t * 1.5) > 0 ? 0 : 1; R(3, 9 + b, 10, 5 - b, '#b88a4a'); R(1, 8, 5, 4, '#a87a3a'); R(1, 7, 1, 2, '#8a5a2a'); R(4, 7, 1, 2, '#8a5a2a'); R(12, 11, 3, 1, '#a87a3a'); R(2, 9, 1, 1, '#111'); },
      barrier(g, e, t, R) { R(2, 7, 2, 8, '#3a3a3a'); R(12, 7, 2, 8, '#3a3a3a'); R(0, 4, 16, 4, '#e8e0d0'); for (let x = 0; x < 16; x += 6) R(x, 4, 3, 4, '#c03020'); },
      capiz(g, e, t, R) { box(R, 1, 0, 14, 13, '#3e2c1c'); for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) R(2 + x * 3, 1 + y * 4, 2, 3, e.lit ? '#e8dcc0' : 'rgba(205,195,170,.5)'); },
      famphoto(g, e, t, R) { box(R, 1, 0, 14, 12, '#5a3a1a'); R(2, 1, 12, 10, '#6a6458'); R(3, 3, 2, 2, '#c8b090'); R(3, 2, 2, 1, '#1a1414'); R(3, 5, 2, 5, '#e8e4d8'); R(11, 3, 2, 2, '#c8b090'); R(11, 2, 2, 1, '#2a2020'); R(11, 5, 2, 5, '#3a3a44'); R(6, 2, 4, 2, '#1a1414'); R(7, 3, 2, 2, '#f0f0f0'); R(6, 5, 4, 5, '#f0f0f0'); },
      lphoto(g, e, t, R) { R(4, 2, 9, 10, '#e8e4d8'); R(5, 3, 7, 7, '#4a5048'); R(5, 3, 7, 3, '#2a3a2a'); R(6, 5, 1, 5, '#3a3226'); R(10, 4, 1, 6, '#3a3226'); R(8, 6, 2, 2, '#d8c8b0'); R(8, 5, 2, 1, '#1a1414'); R(8, 8, 2, 2, '#f0f0f0'); R(7, 8, 1, 1, '#e8e0f0'); },
      cert(g, e, t, R) { box(R, 2, 0, 12, 13, '#6a4a1a'); R(3, 1, 10, 11, '#e8dcc0'); R(5, 2, 6, 1, '#5a4a3a'); for (let y = 4; y < 10; y += 2) R(4, y, 8, 1, '#a89878'); R(9, 10, 3, 1, '#7a2a2a'); },
      cal53(g, e, t, R) { R(4, 1, 8, 11, '#e8e0cc'); R(4, 1, 8, 3, '#7a5a3a'); for (let y = 5; y < 11; y += 2) for (let x = 5; x < 11; x += 2) R(x, y, 1, 1, '#8a8070'); R(9, 9, 2, 2, '#a02a2a'); },
      altar2(g, e, t, R) {
        box(R, 0, 1, 32, 14, '#5a3a24'); R(1, 1, 30, 3, '#ece8dc'); R(2, 4, 28, 1, '#d8d0c0');
        R(13, -12, 6, 13, '#a02020'); R(13, -12, 6, 1, '#c84040'); R(14, -15, 4, 4, '#e8c8a0'); R(13, -17, 6, 2, '#e8c050'); R(15, -19, 2, 2, '#e8c050'); R(19, -8, 3, 1, '#e8c050');
        R(23, -8, 4, 9, '#5a7ab0'); R(24, -10, 2, 2, '#e8d8c0');
        for (const x of [4, 8, 27]) { R(x, -4, 2, 5, '#d8d0b8'); R(x, -5, 2, 1, '#5a4a3a'); }
        R(5, 0, 6, 1, '#c8c0a8');
      },
      sgate(g, e, t, R) {
        SPR.stairsup(g, e, t, R);
        if (!e.open) { for (let x = 1; x < 16; x += 3) R(x, -6, 1, 21, '#2a2a30'); R(0, -6, 16, 1, '#3a3a44'); R(0, 4, 16, 1, '#3a3a44'); R(6, 5, 4, 4, '#a08a4a'); R(7, 3, 2, 2, '#a08a4a'); R(7, 6, 2, 1, '#3a2a1a'); }
      },
      vanity2(g, e, t, R) { box(R, 1, -10, 14, 12, '#7a5a2a'); R(3, -8, 10, 8, '#4b3e4e'); R(4, -6, 3, 2, '#3a2e3a'); R(9, -4, 2, 3, '#3a2e3a'); box(R, 0, 2, 16, 12, '#6b4a30'); R(5, 0, 6, 3, '#5a1a2a'); R(6, 1, 4, 1, '#2a0a14'); R(7, 6, 2, 1, '#c9a35a'); }
    },
    tiles: {
      canopy: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#070c09'); for (let i = 0; i < 5; i++) R((hash(X, Y, i) * 13) | 0, (hash(Y, X, i + 3) * 13) | 0, 4, 3, i % 2 ? '#0e1a12' : '#0b150e'); } },
      rootg: { solid: false, paint(R, X, Y) { speck(R, '#3a2e22', ['#463828', '#2c2219', '#4e4030'], X, Y, 16, 31); for (let i = 0; i < 2; i++) { const h = hash(X, Y, 40 + i); if (h < .6) { const y = 3 + ((hash(X, Y, 50 + i) * 10) | 0); R(0, y, 16, 1, '#5a4a34'); R(0, y + 1, 16, 1, '#241c14'); } } } }
    },
    tileOpts: { grassC: '#1e2e1e', treeC: '#122016' },
    maps: {
      /* ---------------- 内娜阿姨的小吃摊 ---------------- */
      stand: {
        amb: 'night', dark: .5, plr: 3.6, wall: 'concrete', floor: 'concrete',
        rows: [
          '####################',
          '####################',
          '#xxxxxxCxxxxxxxxxxx#',
          '#CxxxxxCxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxxx#',
          '____________________',
          '::::::::::::::::::::',
          '====================',
          '::::::::::::::::::::',
          'BBBBBBBBBBBBBBBBBBBB'],
        ents: [
          { x: 2, y: 1, w: 3, spr: 'csign', light: { r: 2.4, col: 'rgba(255,120,80,.14)', dx: 24, dy: 6 }, on: S => S.narr('「NENA\'S CARINDERIA · 24 ORAS」\n红底黄字的招牌，灯管坏了一根，「24」那两个字一闪一闪。') },
          { x: 9, y: 1, spr: 'paper', on: S => S.note('rules') },
          { x: 11, y: 1, spr: 'window', lit: true, light: { r: 1.6, col: 'rgba(255,220,150,.1)', dy: 20 }, on: S => S.narr('楼上人家的窗户还亮着。电视的蓝光一跳一跳，里面在放深夜的鬼故事特辑。') },
          { x: 12, y: 1, w: 2, spr: 'sari', on: S => S.narr('隔壁的 sari-sari 小店早就拉下了铁栅栏。\n栅栏缝里还挂着一串串洗发水小包和三合一咖啡小包，在风里轻轻地打转。') },
          { x: 16, y: 1, spr: 'poster', col: '#d8c890', on: S => S.narr('一张褪色的竞选海报，候选人笑得很灿烂。\n有人在他脸上画了两撇胡子。') },
          { x: 18, y: 1, spr: 'window', on: S => S.narr('黑着的窗户。玻璃上映出小吃摊的灯，和你自己疲惫的脸。') },
          { x: 2, y: 3, spr: 'kaldero', pot: '#6a4a3a', on: S => S.narr('一锅 adobo，酱油和醋炖的鸡肉，咕嘟咕嘟冒着小泡。\n内娜阿姨说，这锅从傍晚炖到现在，越炖越香。') },
          { x: 3, y: 3, spr: 'kaldero', pot: '#8a8a90', on: S => S.narr('sinigang，酸汤。罗望子的酸味直冲鼻子，一下子把你的瞌睡赶跑了一半。') },
          { x: 4, y: 3, spr: 'counter', col: '#7a6a52', on: nenaTalk },
          { x: 5, y: 3, spr: 'radio', col: '#7a6a52', async on(S) {
            S.sfx('tv');
            await S.narr('柜台上的半导体收音机，正在放深夜鬼故事节目。主持人压低了嗓子，用他加禄语慢悠悠地讲：');
            await S.say('收音机', '「……于是，那个司机慢慢地、慢慢地，抬起头，看了一眼后视镜——」', WS);
            S.sfx('tv');
            await S.narr('一阵沙沙的杂音把后半句吞了。\n内娜阿姨伸手「啪」地关掉了它：「大半夜的，听这个干什么。」');
          } },
          { x: 6, y: 3, spr: 'kaldero', pot: '#a8a090', on: S => S.narr('一大锅 lugaw，米粥熬得稠稠的。旁边一碟炸蒜，一碟葱花，一碗卤蛋。') },
          { id: 'nena', x: 4, y: 2, spr: '@nena', dir: 0, on: nenaTalk },
          { x: 4, y: 4, spr: 'invisible', light: { r: 4.8, col: 'rgba(255,200,120,.16)' } },
          { id: 'bowl', x: 9, y: 5, spr: 'table', col: '#e8e6dc', async on(S) {
            const f = S.f;
            if (f.ate) return S.narr('空碗。碗底还剩一点蒜末。\n塑料桌面上有一圈一圈的水印，像年轮。');
            f.ate = true;
            await S.narr('一碗热腾腾的 lugaw，上面撒着炸蒜和葱花，还卧着半个卤蛋。\n你三口两口喝完了。胃里暖起来，眼皮却更沉了。');
            S.goal(f.berto ? '开车回家（出租车停在路边）' : '跟伯托打个招呼，然后开车回家');
          } },
          { x: 8, y: 5, spr: 'chair', col: '#e8e6dc', on: S => S.narr('白色的塑料凳子，一条腿短了一截，坐上去会晃。') },
          { id: 'berto', x: 10, y: 5, spr: '@berto', dir: 1, on: bertoTalk },
          { x: 14, y: 4, spr: 'table', col: '#e8e6dc', on: S => S.narr('邻桌摆着两个空的 San Miguel 啤酒瓶，和一副没收的扑克牌。') },
          { x: 13, y: 4, spr: 'chair', col: '#e8e6dc', on: S => S.narr('塑料凳上搭着一件吉普尼司机落下的外套。') },
          { x: 15, y: 4, spr: 'chair', col: '#e8e6dc', on: S => S.narr('凳子底下扔着一张用过的乐透彩票。没中。') },
          { x: 16, y: 3, spr: 'aso', solid: true, async on(S) { S.sfx('whisper'); await S.narr('一条黄狗蜷在墙根底下睡觉——这一带的 askal，谁的也不是，谁都喂它。'); await S.narr('你一走近，它就抬起头，朝巴雷特大道的方向，低低地呜了一声。'); } },
          { id: 'pacing', x: 16, y: 6, spr: '@pacing', dir: 0, on: pacingTalk },
          { x: 17, y: 6, spr: 'bilao', solid: true, on: pacingTalk },
          { x: 1, y: 7, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,200,110,.16)', dy: -4 }, on: S => S.narr('钠灯的光是黄的，黄得发腻。蛾子绕着灯罩一圈一圈地飞。') },
          { x: 18, y: 7, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,200,110,.16)', dy: -4 }, on: S => S.narr('路灯杆上贴满了小广告：通下水道、算命、补习英语。') },
          { id: 'taxi', x: 5, y: 8, w: 2, spr: 'taxi', dir: 2, on: board },
          { x: 12, y: 8, w: 3, spr: 'jeep', on: S => S.narr('一辆停着的吉普尼，车身上画满了花和圣母像，车头立着两匹镀铬的小马。\n司机躺在后排的长椅上打呼噜。路牌上写着：CUBAO — QUIAPO。') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('凌晨一点四十分。E. 罗德里格斯大道上几乎看不见车。\n内娜阿姨的小吃摊，是这条街上唯一亮着的一盏灯。');
          await S.say('内娜阿姨', 'Ramon！Kain ka muna——先吃。你的 lugaw，趁热。');
          S.goal('吃完宵夜（桌上那碗）');
        }
      },
      /* ---------------- 巴雷特大道 ---------------- */
      drive: {
        amb: 'car', dark: .88, plr: 2.2, wall: 'stone', floor: 'asphalt',
        legend: { 'H': 'canopy', 'G': { t: 'grass', solid: true }, 'S': { t: 'sidewalk', solid: true } },
        rows: driveRows(),
        ents: [
          ...[1, 14, 24, 48, 58, 61].map(x => ({ x, y: 3, spr: 'btree' })),
          ...[2, 9, 15, 18, 31, 35, 40, 54, 60].map(x => ({ x, y: 11, spr: 'btree', south: true, z: -1 })),
          { x: 32, y: 3, spr: 'btree', big: true }, { x: 34, y: 3, spr: 'btree', big: true }, { x: 33, y: 3, spr: 'btree', big: true },
          { x: 36, y: 3, spr: 'grotto', light: { r: 1.8, col: 'rgba(255,170,80,.18)', flick: true } },
          { x: 32, y: 4, spr: 'candles', light: { r: 2, col: 'rgba(255,170,80,.16)', flick: true }, on: S => S.narr('树根底下点着一圈白蜡烛。有人一直在这里点蜡烛——四十多年了，没断过。') },
          { x: 34, y: 4, spr: 'candles', light: { r: 1.6, col: 'rgba(255,170,80,.14)', flick: true }, on: S => S.narr('蜡烛的火苗齐齐地朝树干那边歪着。\n……可是风是从树那边吹过来的。') },
          { x: 7, y: 3, spr: 'mgate' }, { x: 52, y: 3, spr: 'mgate' }, { x: 42, y: 3, spr: 'agate' },
          ...[6, 22, 44, 59].map(x => ({ x, y: 4, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,200,110,.16)', dy: -2 }, on: lampOn(x === 44 ? '路灯一闪一闪的，像是随时会灭。灯底下停着一只很大的白蛾子，一动不动。' : '一盏钠灯。黄光照在气根上，影子像一张网，罩在路面上。') })),
          ...[12, 28, 37, 50, 58].map(x => ({ x, y: 10, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,200,110,.16)', dy: -2 }, on: lampOn('路灯杆上缠着 balete 的细根，一圈一圈，像是要把它慢慢勒进树里去。') })),
          ...[5, 6, 7, 8, 9].map(y => ({ x: 0, y, spr: 'barrier', on: S => S.narr('E. 罗德里格斯大道那头。……回去？内娜阿姨还以为你已经到家了。') })),
          ...[5, 6, 7, 8, 9].map(y => ({ x: 63, y, spr: 'barrier', on: S => S.narr('「前方施工」。N. 多明戈街口被木头路障拦住了。') })),
          { id: 'wl1', x: 18, y: 10, spr: '@luz', dir: 0, solid: false, hidden: true, light: { r: 1.4, col: 'rgba(220,230,255,.16)' } },
          { id: 'wl2', x: 57, y: 10, spr: '@luz', dir: 3, solid: false, hidden: true, light: { r: 1.4, col: 'rgba(220,230,255,.16)' } },
          { id: 'hl', x: 2, y: 8, spr: 'invisible', light: { r: 3.4, col: 'rgba(255,236,170,.14)' } },
          { id: 'rvm', x: 2, y: 8, spr: 'rvm', z: 1, solid: false, s: { up: true, her: 0 }, light: { r: 1.7, dx: 8, dy: -24, col: 'rgba(190,200,220,.08)' }, on: mirrorUse }
        ],
        async enter(S, first) {
          const f = S.f;
          S.amb('car');
          if (f.phase === 'drive1' && first) {
            await S.narr('车拐进了巴雷特大道。\n路一下子窄了，也暗了。两边的 balete 把枝子在头顶上搭在一起，像一条长长的、黑绿色的隧道。');
            await S.narr('气根从树杈上垂下来，一绺一绺的，像没梳开的长头发。车灯扫过去，它们就轻轻地晃。');
            const r = await choose(S, '「开进大道之前，把后视镜扳下去。」——墙上的规矩是这么写的。', ['（扳下去）', '（算了。开了二十年夜车，哪来那么多讲究）'], '拉蒙');
            setM(S, { up: r === 1 }); S.sfx('switch');
            S.toast('在车里按调查键，可以扳动后视镜');
            S.goal('开过巴雷特大道，回家（往前开）');
            S.cp('drive');
            return;
          }
          if (f.phase === 'pickup' && S.once('pickupIn')) {
            setM(S, { up: true, her: 0 });
            await S.narr('钥匙一拧，发动机就着了——好像它一直在等你。\n粉盒揣在胸前的口袋里，隔着衬衫，凉得像一块冰。');
            S.goal('开到大道尽头（N. 多明戈街口）去接她');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.phase === 'drive1') {
            if (x >= 11 && !f.d1a) { f.d1a = true; S.show('wl1'); S.sfx('whisper'); }
            if (x >= 15 && !f.d1b) { f.d1b = true; return flagger(S); }
            if (x >= 25 && !f.d1c) { f.d1c = true; return backseat(S); }
            if (x >= 30 && !f.d1d) { f.d1d = true; return stall(S); }
            return;
          }
          if (f.phase === 'pickup') {
            if (x < 31) return (async () => { await S.narr('她在大道尽头等着。……往前开。'); await S.walk('pl', 'r', 5); })();
            if (x >= 55) return pickupScene(S);
            return;
          }
          if (f.phase === 'ride') return rideStep(S, x);
        },
        tick(S, dt) {
          const p = S.pl, f = S.f, hl = getEnt('hl', 'drive'), rv = getEnt('rvm', 'drive');
          if (hl) { const d = DIRS[p.dir]; hl.px = p.px + d[0] * 40; hl.py = p.py + d[1] * 40; hl.hidden = !!f.dead; }
          if (rv) { rv.px = p.px; rv.py = p.py; }
          if (f.phase !== 'ride' || !rv) { idleT = 0; return; }
          /* 她抬头的进度画在镜子里（0..3） */
          const tl = S.timerLeft;
          if (rv.s.her === 2 && tl != null) { const L = Math.min(3, Math.floor((1 - tl / popT(S)) * 4)); if (rv.s.lift !== L) rv.s.lift = L; }
          /* 规矩第 6 条：开到有灯的地方去——车停着不走，她会凑上来（S.moving 对客机操作也准确） */
          if (W.busy || rv.s.up || tl != null) { idleT = 0; return; }
          if (S.moving) { idleT = 0; return; }
          idleT += dt;
          if (idleT > 4) {
            idleT = 0;
            S.run(async S2 => {
              S2.sfx('whisper');
              await S2.say('白衣女人', '……Manong。怎么停了？', WS);
              popMirror(S2);
            });
          }
        }
      },
      /* ---------------- 大榕树 Lola ---------------- */
      grove: {
        amb: 'night', dark: .84, plr: 2.8, wall: 'stone', floor: 'dirt',
        legend: { 'Q': 'rootg' },
        rows: groveRows(),
        ents: [
          { id: 'agate', x: 4, y: 1, spr: 'agate', open: true, async on(S) {
            if (!S.f.tonyo && S.once('gateFirst')) await S.narr('一扇生锈的铁门，门柱上的铜牌被绿锈糊住了，勉强认得出「ARCEGA」。\n铁链断成两截，垂在地上。门开着一条缝。');
            S.sfx('open');
            await goP(S, 'casa', 10, 11, 3, false);
          } },
          { x: 21, y: 1, spr: 'mgate', on: S => S.narr('隔壁人家的大铁门，门后是一栋新盖的水泥大房子。\n门柱上装着监视器，红灯一闪一闪。') },
          { id: 'ghouse', x: 19, y: 2, w: 2, spr: 'guardhouse', light: { r: 2.2, col: 'rgba(255,220,140,.16)', dx: 11, dy: 4 }, on: S => S.narr('保安岗亭。小窗里亮着一盏灯，桌上摊着值班登记本、一个保温壶，还有一台开着的收音机。\n墙上钉着一张圣婴像的小日历。') },
          { id: 'tonyo', x: 18, y: 5, spr: '@tonyo', dir: 1, on: tonyoTalk },
          { id: 'bigb', x: 8, y: 4, w: 6, h: 3, spr: 'bigbalete', on: bigOn },
          { x: 10, y: 5, spr: 'invisible', light: { r: 5.5, a: .5, col: 'rgba(150,170,130,.05)' } },
          ...ROOTS.map(rd => ({ id: rd.id, x: rd.x, y: rd.y, spr: 'broot', kind: rd.kind, col: rd.col, solid: true, on: S => rootOn(S, rd) })),
          { id: 'grotto', x: 16, y: 4, spr: 'grotto', light: { r: 2, col: 'rgba(255,170,80,.18)', flick: true }, on: grottoOn },
          { x: 6, y: 9, spr: 'candles', light: { r: 1.8, col: 'rgba(255,170,80,.16)', flick: true }, on: S => S.narr('有人在树根前摆了三根蜡烛，旁边放着一个小纸盘，里面是一块 kakanin（糯米糕）。\n明天就是 Undas。给死人的，也给树里的。') },
          { x: 15, y: 8, spr: 'candles', light: { r: 1.6, col: 'rgba(255,170,80,.14)', flick: true }, on: S => S.narr('蜡烛底下压着一张叠成小方块的纸条。你没有打开——那不是写给你的。') },
          { x: 4, y: 8, spr: 'punso', solid: true, on: S => S.narr('树旁边有一个半人高的小土包，上面长着几簇草。\n老人说，nuno sa punso——土丘里的小老头——就住在这种土包里。踢了它，脚会肿上一个月。\n你绕开了它。') },
          { id: 'gtaxi', x: 9, y: 15, w: 2, spr: 'taxi', dir: 2, on: gtaxiOn },
          { x: 3, y: 13, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,200,110,.16)', dy: -2 }, on: S => S.narr('路灯的光照不进树底下。好像光走到气根跟前，就自己停住了。') },
          { x: 20, y: 13, spr: 'streetlamp', flicker: true, light: { r: 2.8, col: 'rgba(255,200,110,.12)', dy: -2 }, on: S => S.narr('这一盏一闪一闪的。每闪一下，树底下的影子就像多出一个。') },
          { id: 'luzg', x: 10, y: 8, spr: '@luz', dir: 3, hidden: true, light: { r: 1.8, col: 'rgba(220,230,255,.2)' }, on: finale }
        ],
        async enter(S, first) {
          const f = S.f;
          S.amb('night');
          if (f.phase === 'final') {
            S.show('luzg'); S.ent('luzg').alpha = 1;
            if (S.once('finalIn')) {
              await S.narr('你下了车。\n夜里的虫子一下子全都不叫了。');
              S.goal('把粉盒还给她');
              S.cp('final');
            }
            return;
          }
          if (first) {
            await S.narr('你推开车门。热烘烘、湿漉漉的夜风扑在脸上，带着泥土和烂树叶的味道。\n大榕树就在眼前，大得像一座房子。');
            S.bubble('tonyo', '!', 1200);
            await S.say('？？？', 'Hoy！车坏了啊？');
            await S.narr('树旁边的保安岗亭里，一个穿制服的男人探出了半个身子，手电筒的光晃了过来。');
            S.goal('问问岗亭那边的保安');
            S.cp('grove');
            return;
          }
          if (f.phase === 'find' && S.once('findIn')) await S.think('镜子……她只在镜子里出现。\n车上的后视镜，正对着这棵树。');
        }
      },
      /* ---------------- 阿尔塞加老宅（一楼） ---------------- */
      casa: {
        amb: 'drone', dark: .9, plr: 2.6, wall: 'wood', floor: 'darkwood',
        tileOpts: { woodC: '#5a4028' },
        rows: casaRows(),
        ents: [
          // 客厅
          { x: 2, y: 1, spr: 'famphoto', on: S => S.narr('一张全家福。穿白西装的父亲，梳着发髻的母亲，中间站着一个穿白色 terno（蝴蝶袖礼服）的姑娘。\n照片受过潮。别处都还清清楚楚，只有姑娘的脸，糊成了一团白。') },
          { id: 'smirror', x: 4, y: 1, spr: 'mirror', covered: '#141014', on: S => S.narr('这面镜子也用黑布蒙着。布上落满了灰，四个角用图钉钉死在墙上。\n……整栋房子的镜子，都蒙着。') },
          { x: 6, y: 1, spr: 'capiz', on: S => S.narr('窗格里嵌的不是玻璃，是一片一片磨薄了的 capiz 贝壳，半透明，泛着珍珠一样的光。\n外面大榕树的影子映在上面，一晃，一晃。') },
          { x: 7, y: 2, w: 2, spr: 'piano', on: pianoOn },
          { x: 1, y: 4, w: 2, spr: 'sofa', col: '#5a4a3a', on: S => S.narr('藤编的长沙发，坐垫早就塌了。扶手上搭着一条钩花的白垫布，黄得像旧牙齿。') },
          { id: 'clipT', x: 5, y: 3, spr: 'table', col: '#4a3020', async on(S) {
            if (S.once('clipFind')) await S.narr('小圆桌上压着一本剪贴簿，翻开的那一页贴着一张发黄的剪报。');
            await S.note('clip');
          } },
          { x: 5, y: 3, spr: 'newspaper', solid: false, decal: false, oy: -6, z: 0 },
          { x: 6, y: 4, spr: 'armchair', col: '#5a3a2a', on: S => S.narr('一把摇椅。你没碰它，它却轻轻地、轻轻地，前后晃了两下。') },
          { x: 8, y: 5, spr: 'lamp', off: true, on: S => S.narr('落地灯的灯罩上绣着小小的 sampaguita 花。开关拧了两下——四十年前就停电了。') },
          // 饭厅
          { x: 11, y: 1, spr: 'cal53', on: S => S.narr('墙上的挂历停在1953年10月。\n31号那一格，用秀气的铅笔字写着：「Luz — kina Tita（去姑妈家）」。') },
          { x: 13, y: 1, spr: 'capiz', on: S => S.narr('capiz 窗外是一片长疯了的院子。草里有萤火虫，一闪，一闪。') },
          { x: 11, y: 3, w: 2, spr: 'table2', col: '#4a3020', on: S => S.narr('长餐桌上摆着四套餐具，盘子里落着厚厚一层灰。\n有一把椅子是转过去的，椅背冲着桌子——像是有人刚站起来，急急忙忙出了门。') },
          { x: 10, y: 3, spr: 'chair', col: '#4a3020', dir: 2, on: S => S.narr('父亲的位子。椅背上雕着一个「A」。') },
          { x: 13, y: 3, spr: 'chair', col: '#4a3020', on: S => S.narr('这把椅子转了过去，背对着桌子。椅垫上放着一把小小的檀香扇。') },
          { id: 'aparador', x: 14, y: 2, spr: 'cabinet', col: '#4a3020', async on(S) {
            if (S.once('yayaFind')) await S.narr('老式的 aparador（碗柜）。玻璃门里是一套落灰的瓷器。\n最底下的抽屉里，压着一封没有封口的信。');
            await S.note('yaya'); S.f.yaya = true;
            if (!S.f.unlocked) S.goal('楼梯口的数字锁：小姐生日的「日」和「月」');
          } },
          // 小祭堂
          { x: 16, y: 2, w: 2, spr: 'altar2', on: S => S.narr('家里的小祭坛。穿红袍、戴金冠的圣婴——Santo Niño——站在正中间，旁边是一尊小小的圣母像。\n两边的蜡烛早就烧完了，烛台上结着厚厚的蜡泪。') },
          { id: 'cert', x: 19, y: 1, spr: 'cert', on: certOn },
          { x: 20, y: 3, spr: 'candles', off: true, on: S => S.narr('三根蜡烛，一根也没点过。烛芯上落着蛛网。') },
          { x: 17, y: 4, spr: 'cushion', col: '#6a2a2a', on: S => S.narr('跪垫上压出了两个浅浅的坑。旁边的地板上，丢着一串断了线的念珠，珠子滚得到处都是。') },
          // 走廊
          { x: 1, y: 7, spr: 'clock', on: S => S.narr('落地钟停了。指针停在十一点二十分。\n钟面的玻璃上有一道裂纹，正好从「十二」划到「六」。') },
          { id: 'hmirror', x: 7, y: 6, spr: 'mirror', covered: '#141014', on: hallMirror },
          { x: 14, y: 6, spr: 'portrait', on: S => S.narr('一幅油画像，画着一位留八字胡的老先生。画框底下的小铜牌：Don Ernesto Arcega。\n他的眼睛，正对着楼梯。') },
          { x: 5, y: 10, w: 2, spr: 'bench', on: S => S.narr('门厅的长凳。凳子底下整整齐齐摆着一双小小的白皮鞋，鞋头朝外。') },
          { x: 2, y: 11, spr: 'deadplant', on: S => S.narr('一盆早就干死的 sampaguita。枯枝上还挂着一朵干成纸片的小白花。') },
          { x: 15, y: 9, spr: 'armchair', col: '#4a3a3a', on: S => S.narr('一把扶手椅冲着大门摆着，像是有人坐在这里等门。\n椅面上的灰，中间少了一块。') },
          { id: 'sgate', x: 20, y: 8, spr: 'sgate', on: stairLock },
          { x: 10, y: 12, spr: 'invisible', touch: async S => { S.sfx('open'); await goP(S, 'grove', 4, 2, 0, false); } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('院子里的草长到了膝盖。老宅是西班牙时代的样式：下层是石头，上层是木头，窗户上嵌着一格一格的 capiz 贝壳。\n大门没锁。你推开门，一股霉味和老香粉的味道扑了出来。');
          await S.narr('你从口袋里摸出打火机。\n火苗一晃，照亮了门厅——墙上的镜子，全都用黑布蒙着。');
          S.goal('在老宅里找找线索（楼梯口锁着）');
        }
      },
      /* ---------------- 露丝的房间（二楼） ---------------- */
      cuarto: {
        amb: 'drone', dark: .86, plr: 2.6, wall: 'wood', floor: 'lightwood',
        rows: [
          '############',
          '############',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '############'],
        ents: [
          { x: 2, y: 1, spr: 'lphoto', on: S => S.narr('一张小照片，用图钉钉在墙上。\n一个圆脸的姑娘站在一棵大 balete 底下，手里举着一个圆圆的小粉盒，对着镜头笑。眉毛很浓，左边嘴角有一颗小痣。\n这是整栋房子里，唯一一张还看得清她的脸的照片。\n背面写着：「Ako at si Lola——我和 Lola。1953」') },
          { x: 6, y: 1, spr: 'capiz', lit: true, light: { r: 1.8, col: 'rgba(200,210,230,.08)', dy: 16 }, on: S => S.narr('从窗格的缝里，正好能看见大道上那棵大榕树的树冠。\n黑乎乎的一大团，比别的树都高。') },
          { x: 1, y: 2, h: 2, spr: 'bed', col: '#e8e4dc', on: S => S.narr('床上平平整整地摊着一件白色的 terno——蝴蝶袖，长裙摆，出门做客穿的衣服。\n……白衣服。') },
          { x: 4, y: 2, spr: 'vanity2', on: S => S.narr('梳妆台上的镜子被人拆掉了，只剩一个空框，框里露着发霉的墙皮。\n台面上放着一个暗红色的丝绒小盒子。盒子是空的，衬垫上压着一个圆圆的印子——正好放得下一个粉盒。') },
          { id: 'ward', x: 9, y: 2, spr: 'wardrobe', col: '#6a4a30', on: wardrobeOn },
          { id: 'desk', x: 10, y: 4, spr: 'desk', on: diaryOn },
          { x: 10, y: 7, spr: 'lamp', off: true, on: S => S.narr('台灯的灯罩上用别针别着一张小卡片：「Happy 18th, Luz!」') },
          { id: 'bedg', x: 2, y: 3, spr: '@luz', dir: 3, solid: false, hidden: true, light: { r: 1.6, col: 'rgba(220,230,255,.18)' } },
          { x: 1, y: 7, spr: 'stairsdown', solid: false, to: ['casa', 19, 8, 1] }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('楼上的房间不大。空气里有一股樟脑丸和老香粉混在一起的味道。\n……和出租车后座上那股味道，一模一样。');
        }
      }
    }
  });
})();
