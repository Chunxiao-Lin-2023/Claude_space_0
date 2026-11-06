/* ================= 第二十七夜 · 明天再来 ================= */
(() => {
  /* ---------- 写字：九个音节键，照作业本拼出「ನಾಳೆ ಬಾ」（naa·le·baa，明天再来） ---------- */
  const KEYS = ['ನಿ ni', 'ಬಾ baa', 'ಇಂ in', 'ಳೆ le', 'ನ್ನೆ nne', 'ದು du', 'ನಾ naa', 'ಬೇ be', 'ಡ da'];
  const ALIAS = {}; KEYS.forEach((k, i) => { ALIAS[String(i + 1)] = k; });
  const W_OK = 'ನಾ naa|ಳೆ le|ಬಾ baa', W_TODAY = 'ಇಂ in|ದು du|ಬಾ baa', W_YEST = 'ನಿ ni|ನ್ನೆ nne|ಬಾ baa';
  const NALE = 'ನಾಳೆ ಬಾ';
  let lastDeath = null, hintLv = 0;   // 跨重来保留：死因 / 第二天谜题失败次数（决定阿吉提示到第几级）

  /* ---------- 小工具 ---------- */
  const N = t => S => S.narr(t);
  const T = (x, y) => [x, y];
  void T;
  function force(S, fn) { if (W.busy) interruptWait(); S.run(fn); }   // 危险段里立刻打断当前对话/写字，开始一段剧本
  function tx(e) { return Math.round(e.px / TS); }
  function ty(e) { return Math.round(e.py / TS); }

  /* ---------- 合成音：脚镯、敲门回声、雷、牛、电话 ---------- */
  function jingle(S, v = .03) { S.tone('sine', 3520, 3380, .14, v, 0); S.tone('sine', 4186, 4010, .11, v * .7, .05); S.tone('sine', 2960, 2900, .09, v * .4, .1); }
  function jingleFar(S) { jingle(S, .012); }
  function thunder(S) { S.tone('sawtooth', 70, 32, 1.8, .07, 0, 180); S.tone('triangle', 48, 30, 2.2, .06, .15, 140); }
  function moo(S) { S.tone('sawtooth', 150, 118, .9, .028, 0, 460); S.tone('sawtooth', 152, 120, .5, .018, .9, 420); }
  function ring(S) { for (let i = 0; i < 2; i++) for (let k = 0; k < 9; k++) S.tone('square', k % 2 ? 980 : 1240, k % 2 ? 980 : 1240, .045, .02, i * 1.1 + k * .05, 2600); }
  function knockW(S, v = .07, n = 3) { for (let i = 0; i < n; i++) { S.tone('triangle', 150, 84, .09, v, i * .34, 700); S.tone('sine', 72, 48, .14, v * .9, i * .34, 260); } }   // 指节敲木门：闷、湿
  function knockM(S, v = .05) { for (let i = 0; i < 3; i++) { S.tone('square', 240, 170, .14, v * .5, i * .3, 1500); S.tone('sawtooth', 120, 90, .2, v * .6, i * .3 + .01, 900); } }   // 铁卷帘：哗啦啦的铁皮
  function caneTap(S, v = .03) { S.tone('triangle', 300, 220, .05, v, 0, 1400); }
  function heart(S) { S.tone('sine', 62, 48, .14, .07, 0, 200); S.tone('sine', 58, 44, .16, .06, .2, 200); }

  /* ================= 画面 ================= */
  function saree(col, bd, o = {}) {   // 纱丽：斜挎的帕鲁（pallu）+ 金边；o.veil 盖头
    return function (g, d, fr, G, R) {
      if (d === 0) { for (let i = 0; i < 7; i++) R(4 + i, G.tT + i, 2, 1, bd); R(3, 20, 10, 1, bd); }
      else if (d === 3) { R(5, G.tT, 6, 9, shade(col, -.15)); R(5, G.tT + 9, 6, 1, bd); R(3, 20, 10, 1, bd); }
      else { R(4, G.tT, 2, 7, bd); R(3, 20, 9, 1, bd); }
      if (o.veil) {
        if (d === 0) { R(3, G.hT - 1, 10, 3, col); R(2, G.hT + 1, 2, 11, col); R(12, G.hT + 1, 2, 11, col); R(3, G.hT - 1, 10, 1, bd); R(2, G.hT + 1, 1, 11, bd); R(13, G.hT + 1, 1, 11, bd); }
        else if (d === 3) { R(3, G.hT - 1, 10, 13, col); R(3, G.hT + 11, 10, 1, bd); }
        else { R(4, G.hT - 1, 9, 3, col); R(9, G.hT + 1, 4, 12, col); R(4, G.hT - 1, 9, 1, bd); }
        if (d !== 3) { R(4, G.hT + 1, 1, 1, '#f4f2e8'); R(11, G.hT + 1, 1, 1, '#f4f2e8'); R(12, G.hT + 3, 1, 1, '#f4f2e8'); }   // 茉莉
      }
      if (o.braid && d === 3) { R(7, G.hT + 6, 2, 10, '#141010'); R(7, G.hT + 16, 2, 1, '#e8d8a0'); }
      if (o.bindi && d === 0) R(7, G.hT + 2, 2, 1, '#c81e28');
    };
  }
  const PEOPLE = {
    me: { skin: '#a8714a', hair: '#141010', hs: 'long', top: '#3d6aa6', top2: '#f2ecd8', bottom: '#3d6aa6', dress: true, shoes: '#6a4a2a', key: 'nb_me',
      extra(g, d, fr, G, R) { if (d === 3) { R(7, G.hT + 6, 2, 11, '#141010'); R(7, G.hT + 17, 2, 1, '#e8d050'); } if (d === 0) { R(5, G.tT, 6, 2, '#f2ecd8'); R(7, G.hT + 2, 2, 1, '#c81e28'); } } },
    ajji: { skin: '#94603e', hair: '#dcd8d0', hs: 'bun', top: '#2e6a4a', top2: '#c8a040', robe: true, shoes: '#3a2a1a', key: 'nb_ajji', extra: saree('#2e6a4a', '#c8a040', { bindi: true }) },
    amma: { skin: '#a46a44', hair: '#141010', hs: 'bun', top: '#8a3a6a', top2: '#e0b040', robe: true, shoes: '#3a2418', key: 'nb_amma', extra: saree('#8a3a6a', '#e0b040', { bindi: true }) },
    muni: { skin: '#86563a', hair: '#ece8e0', hs: 'bald', top: '#ece8dc', top2: '#d8d0c0', bottom: '#ece8dc', robe: true, shoes: '#5a4030', key: 'nb_muni',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 6, 8, 2, '#ece8e0'); R(5, G.hT + 4, 2, 1, '#ece8e0'); R(9, G.hT + 4, 2, 1, '#ece8e0'); R(3, G.tT, 10, 3, '#b8a888'); } else if (d === 1) { R(3, G.hT + 6, 4, 2, '#ece8e0'); R(4, G.tT, 8, 3, '#b8a888'); } else R(3, G.tT, 10, 3, '#b8a888'); R(13, G.tT + 2, 1, 12, '#6a4a2a'); } },
    rahim: { skin: '#a87048', hair: '#2a2420', hs: 'short', top: '#ecece4', top2: '#c8c8c0', bottom: '#ecece4', robe: true, hat: 'cap', hatC: '#f6f6ee', shoes: '#3a3a3a', key: 'nb_rahim',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 5, 8, 3, '#3a3430'); R(6, G.hT + 8, 4, 2, '#3a3430'); R(6, G.hT + 5, 4, 1, '#a87048'); } else if (d === 1) R(3, G.hT + 5, 5, 4, '#3a3430'); R(12, G.tT + 4, 1, 3, '#d8b040'); } },
    geetha: { skin: '#aa724c', hair: '#141010', hs: 'long', top: '#c83a5a', top2: '#e8c040', robe: true, shoes: '#5a2a1a', key: 'nb_geetha', extra: saree('#c83a5a', '#e8c040', { bindi: true, braid: true }) },
    venkat: { skin: '#8a5634', hair: '#1a1410', hs: 'short', top: '#d8c8a0', top2: '#b8a880', bottom: '#ece8dc', robe: true, shoes: '#3a2a1a', key: 'nb_venkat',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 6, 1, '#1a1410'); R(4, G.hT + 1, 8, 1, '#e8e0d0'); R(7, G.hT + 1, 2, 1, '#c81e28'); } } },
    selvi: { skin: '#8a5636', hair: '#141010', hs: 'long', top: '#d8a030', top2: '#3a6a3a', robe: true, shoes: '#3a2a1a', key: 'nb_selvi', extra: saree('#d8a030', '#2a5a8a', { braid: true }) },
    rani: { skin: '#a06a46', hair: '#141010', hs: 'bun', top: '#4a7ab8', top2: '#e8e0d0', robe: true, shoes: '#3a2a1a', key: 'nb_rani', extra: saree('#4a7ab8', '#e8e0d0') },
    warden: { skin: '#8e5e3e', hair: '#5a5450', hs: 'bun', top: '#6a5a8a', top2: '#c8b8a0', robe: true, shoes: '#2a2a2a', key: 'nb_warden', extra: saree('#6a5a8a', '#c8b8a0', { bindi: true }) },
    nb: { skin: '#cfcac0', hair: '#070606', hs: 'long', cover: true, top: '#7a1a22', top2: '#c8a040', robe: true, noFeet: true, shoes: '#cfcac0', key: 'nb_nb',
      extra(g, d, fr, G, R) {
        saree('#7a1a22', '#b89040', { veil: true })(g, d, fr, G, R);
        if (d !== 3) { R(5, 21, 2, 2, '#cfcac0'); R(9, 21, 2, 2, '#cfcac0'); R(5, 22, 1, 1, '#d8b040'); R(10, 22, 1, 1, '#d8b040'); }   // 赤脚、脚镯
        if (d === 0) { R(5, G.tB - 2, 1, 3, '#cfcac0'); R(10, G.tB - 2, 1, 3, '#cfcac0'); R(5, G.tB - 2, 1, 1, '#c81e28'); R(10, G.tB - 2, 1, 1, '#c81e28'); }   // 手腕上的红手镯
      } }
  };

  const ITEMS = {
    chalk3: { name: '粉笔头（3 个）', desc: '学校发的白粉笔，一节一节攒下来的。每个只够在一扇门上写一回。\n粉笔怕水。' },
    chalk2: { name: '粉笔头（2 个）', desc: '还剩两个粉笔头。每个只够在一扇门上写一回。\n粉笔怕水，在刷了油漆的铁皮上也打滑。' },
    chalk1: { name: '粉笔头（1 个）', desc: '只剩最后一个粉笔头了。' },
    paint: { name: '红漆（够写一扇门）', desc: '过年刷门槛剩下的红漆，罐底只剩一点。够写一扇门。\n漆干了不怕水，铁皮上也写得上。' },
    coal: { name: '炭条', desc: '宿舍厨房灶膛里掏出来的炭，黑乎乎的，蹭一手。\n写在刷过石灰的白墙上，清清楚楚。' },
    chalkbox: { name: '一盒新粉笔', desc: '文卡特进货时顺手给你捎的一整盒。\n写多少扇门都够——只要墙是干的。' },
    paint2: { name: '招牌漆（够写一扇门）', desc: '拉希姆大叔刷招牌用的黄漆，小半罐，够写一扇门。\n「雨淋不掉。」他说。' },
    tarp: { name: '茶摊的油布', desc: '文卡特茶摊上的蓝色塑料油布，四角拴着麻绳。\n能把一扇门或一根柱子整个遮住。' },
    mallige: { name: '一串茉莉', desc: '在家门口台阶上捡到的一串茉莉花，已经蔫了，还是很香。\n巷子里没有人种茉莉。' }
  };

  const NOTES = {
    book: { title: '作业本背面（阿吉说的，你记的）', text: '一、她夜里来。敲门，用家里人的声音叫你。\n　　不管是谁的声音——别应，别开门。\n\n二、在门外写：ನಾಳೆ ಬಾ（naa·le·baa，明天再来）。\n　　她看见了，念一声「明天」，就走。\n　　门上没字，她就一直叫，叫到有人忍不住开门。\n\n三、字写在门上，或者门边伸手够得着的墙上、柱子上。\n　　（阿吉说：两家的门挨着，中间那根柱子上写一回，两家都算。）\n\n四、门外头挂着锁的人家，她不停。没人的屋子，她敲给谁听？\n\n五、一个字也不能错。\n　　ಇಂದು（in·du）是「今天」，ನಿನ್ನೆ（ni·nne）是「昨天」。\n　　写成「今天来」，就是请她进门。' },
    paper1: { title: '《城西晚报》剪报', text: '（茶摊上传了好几手，沾着茶渍。）\n\n【「明天再来」——城西多条街巷夜现怪事】\n近日，本市西区多处住宅区流传一种说法：深夜有女子挨家敲门，用屋内人亲人的声音呼唤。据称开门者「不出一日便会病倒」。\n记者走访发现，不少居民已在门上用粉笔、红漆写上卡纳达文「ನಾಳೆ ಬಾ」（明天再来）。据说「她」读到后便会离去，次日再来，次日又读到……\n多家文具店的粉笔一度卖空。\n警方表示，未接到任何相关伤亡报告，呼吁市民不要轻信谣言，夜间注意门户安全。\n\n（边上有人用圆珠笔补了一句：「我们这条巷子，昨晚也来了。」）' },
    letter: { title: '拉朱的航空邮简', text: '（蓝色的航空邮简，边角磨得起毛。穆尼大爷不识字，每回都请人念。）\n\n阿爸：\n我在这边很好，工地管吃管住，就是热。中午太阳底下，钢管烫手。\n钱托同乡带回去了，你别舍不得花，眼睛要去看医生。\n合同还有一年。下个月十五号，我往文卡特的茶摊打电话，你在那儿等我。\n阿爸，夜里有人敲门，你先问是谁。你耳朵不好，别谁叫都开。\n\n　　　　　　　　　　　　儿子　拉朱　于迪拜' },
    paper2: { title: '《城西晚报》 · 一周以后', text: '【「明天再来」风波渐息】\n持续一周多的「夜叩门」传言，近日明显降温。\n一位不愿具名的大学心理学讲师认为，这类传言在城市迅速扩张、外来人口增多、邻里互不相识的时候尤其容易流行：人们把说不清的不安，讲成一个有规矩可循的故事——只要照着做，就「安全」。\n「故事传得越广，照做的人越多；照做的人越多，故事就越像真的。」\n至今仍无任何因此伤亡的可靠记录。\n\n不过，记者注意到，西区许多老房子门上的「ನಾಳೆ ಬಾ」仍未擦去。一位老太太说：「擦了干什么？万一她明天又来呢。」' }
  };

  /* ---------- 惊吓大头像：红纱丽盖头，惨白的脸，晕开的眼线，金鼻环，嘴慢慢张开念「明天」 ---------- */
  const FACES = {
    nb(R, a, t) {
      const SA = '#7a1a22', SB = '#5a0e16', GD = '#c8a040', SK = '#cdc8bf', SK2 = '#a8a29a';
      R(0, 0, 32, 32, '#050304');
      R(2, 0, 28, 32, SA); for (let i = 0; i < 6; i++) R(3 + i * 5, 0, 1, 32, SB);   // 盖头的褶子
      R(2, 0, 28, 2, GD); R(5, 2, 1, 30, GD); R(26, 2, 1, 30, GD);                   // 金边
      R(7, 3, 18, 26, '#0a0708');                                                    // 垂下来的黑发
      R(10, 6, 12, 19, SK); R(11, 5, 10, 1, SK); R(11, 25, 10, 2, SK2); R(10, 6, 1, 19, SK2); R(21, 6, 1, 19, SK2);
      R(9, 5, 3, 16, '#0a0708'); R(20, 5, 3, 16, '#0a0708'); R(13, 4, 6, 3, '#0a0708');
      R(15, 4, 2, 3, '#c81e28');                                                     // 发缝里的朱砂
      for (let i = 0; i < 5; i++) R(8 + i * 4, 2 + (i % 2), 2, 2, '#f2f0e6');        // 茉莉
      const bl = Math.sin(t * 7) > .94 ? 1 : 0;
      R(11, 11, 5, 4, '#1a1012'); R(17, 11, 5, 4, '#1a1012');                        // 晕开的眼线
      R(12, 12, 3, 2 - bl, '#050404'); R(18, 12, 3, 2 - bl, '#050404');
      if (!bl) { R(13, 12, 1, 1, '#e8e4dc'); R(19, 12, 1, 1, '#e8e4dc'); }
      R(12, 15, 1, 3, 'rgba(20,10,12,.7)'); R(20, 15, 1, 4, 'rgba(20,10,12,.7)');    // 眼线淌下来
      R(15, 16, 2, 3, SK2); R(17, 18, 3, 3, GD); R(18, 19, 1, 1, '#050304'); R(19, 18, 4, 1, GD);   // 鼻环和链子
      const k = Math.min(1, a * 1.4);
      if (k < .4) { R(13, 22, 6, 1, '#5a1a1e'); }
      else { const h = 1 + Math.round((k - .4) * 6); R(13, 21, 6, h, '#4a0e12'); R(14, 22, 4, h - 1, '#100204'); }   // 「ನಾ……」
      R(0, 28, 32, 4, SA); R(0, 28, 32, 1, GD);
    }
  };

  /* ---------- 门上的字：像素版「ನಾಳೆ ಬಾ」（两行：ನಾಳೆ / ಬಾ） ---------- */
  const GL = [
    ['.#..#', '#.#.#', '#.#.#', '#.###'],   // ನಾ
    ['.##.', '#..#', '#.##', '.#.#'],       // ಳೆ
    ['#.#.#', '#.#.#', '.##.#', '..###']    // ಬಾ
  ];
  function glyph(R, x, y, gi, col) { const G = GL[gi]; for (let j = 0; j < G.length; j++) for (let i = 0; i < G[j].length; i++) if (G[j][i] === '#') R(x + i, y + j, 1, 1, col); R(x, y - 1, 2, 1, col); }
  function inkCol(e) {
    const a = e.fade == null ? 1 : Math.max(0, e.fade);
    if (e.ink === 'p') return 'rgba(200,30,40,.95)';
    if (e.ink === 'q') return 'rgba(236,196,40,.95)';
    if (e.ink === 'k') return 'rgba(18,16,16,.92)';
    return 'rgba(236,236,226,' + (.92 * a).toFixed(2) + ')';
  }
  function writing(R, x, y, e, vert) {   // 在 (x,y) 起写两行；vert = 柱子上竖着写三行
    if (!e.ink) return;
    const c = inkCol(e);
    if (vert) { glyph(R, x, y, 0, c); glyph(R, x, y + 6, 1, c); glyph(R, x, y + 12, 2, c); }
    else { glyph(R, x, y, 0, c); glyph(R, x + 6, y, 1, c); glyph(R, x + 2, y + 6, 2, c); }
    if (e.ink === 'c' && e.fade != null && e.fade < 1 && !e.tarp) { const a = (1 - e.fade) * .5; for (let i = 0; i < 4; i++) R(x + i * 3, y + 4, 1, 6 + (i % 2) * 4, 'rgba(230,230,220,' + a.toFixed(2) + ')'); }   // 被雨冲开的白道子
  }
  function tarpOver(R, x, w) {   // 亮蓝色塑料油布：四角麻绳、褶子、水珠
    R(x - 2, -9, w + 4, 17, '#2a74d0'); R(x - 2, -9, w + 4, 2, '#7ab8f8'); R(x - 2, 6, w + 4, 2, '#1a4a90');
    for (let i = 0; i < 3; i++) R(x + i * Math.floor(w / 3) + 1, -7, 1, 13, '#1e5aa8');
    R(x - 3, -10, 2, 2, '#d8c090'); R(x + w + 1, -10, 2, 2, '#d8c090'); R(x - 3, 7, 2, 2, '#d8c090'); R(x + w + 1, 7, 2, 2, '#d8c090');
    R(x + 1, -3, 1, 1, '#e8f4ff'); R(x + w - 2, 1, 1, 1, '#e8f4ff'); R(x + 3, 3, 1, 1, '#e8f4ff');
  }

  /* ---------- 道具精灵 ---------- */
  const SPRITES = {
    idoor(g, e, t, R) {   // 南印度木门（立在外墙下墙面上）：芒果叶门帘、门槛上的姜黄朱砂、字、挂锁、铁皮檐
      const c = e.col || '#6a4428';
      if (e.eave) { R(-3, -12, 22, 3, '#7a7e86'); R(-3, -9, 22, 1, '#4a4e56'); for (let i = 0; i < 6; i++) R(-2 + i * 4, -12, 1, 3, '#9a9ea6'); }
      R(1, -7, 14, 23, '#3a2a1e');
      if (e.open) { R(3, -5, 10, 21, '#050404'); R(3, -5, 2, 21, shade(c, -.2)); }
      else {
        box(R, 2, -6, 12, 22, c); R(7, -5, 1, 21, shade(c, -.4));
        R(3, -4, 3, 5, shade(c, .12)); R(9, -4, 3, 5, shade(c, .12)); R(3, 6, 3, 7, shade(c, .12)); R(9, 6, 3, 7, shade(c, .12));
        R(6, 3, 1, 2, '#c9a35a'); R(8, 3, 1, 2, '#c9a35a');
      }
      if (e.toran) for (let i = 0; i < 6; i++) { R(2 + i * 2, -7, 2, 1, '#2a5a20'); R(2 + i * 2, -6, 1, 2 + (i % 2), '#3a7a2a'); }
      R(1, 15, 14, 1, '#d8b030'); for (let i = 0; i < 4; i++) R(3 + i * 3, 15, 1, 1, '#c82020');
      if (!e.open) writing(R, 3, -2, e);
      if (e.locked) { R(6, 6, 4, 1, '#3a3a3a'); R(6, 6, 1, 3, '#3a3a3a'); R(9, 6, 1, 3, '#3a3a3a'); box(R, 5, 8, 6, 5, '#8a8678'); R(7, 10, 2, 1, '#2a2a2a'); }
      if (e.tarp) tarpOver(R, 2, 12);
    },
    pillar(g, e, t, R) {   // 两扇门中间的柱子
      R(4, -8, 8, 24, '#d8d0c0'); R(4, -8, 8, 2, '#b8b0a0'); R(4, 14, 8, 2, '#a8a090'); R(4, -8, 1, 24, '#ece6d8'); R(11, -8, 1, 24, '#b0a898');
      writing(R, 6, -4, e, true);
      if (e.tarp) tarpOver(R, 3, 10);
    },
    shutter(g, e, t, R) {   // 拉希姆裁缝铺：铁卷帘（w=2）+ 条纹雨棚
      R(-2, -12, 36, 4, '#2a6a5a'); for (let i = 0; i < 9; i++) R(-2 + i * 4, -12, 2, 4, '#e8e0c8'); R(-2, -8, 36, 1, '#1a3a32');
      R(1, -7, 30, 23, '#5a6068'); for (let y = -6; y < 15; y += 2) R(2, y, 28, 1, y % 4 ? '#8a9098' : '#7a8088'); R(1, 14, 30, 2, '#3a3e44');
      R(14, 11, 4, 2, '#2a2a2a');
      if (e.ink) { const c = inkCol(e); glyph(R, 6, -1, 0, c); glyph(R, 12, -1, 1, c); glyph(R, 19, -1, 2, c); }
      if (e.smear) { R(6, 0, 18, 1, 'rgba(230,230,220,.35)'); R(9, 3, 12, 1, 'rgba(230,230,220,.25)'); }
    },
    rsign(g, e, t, R) { box(R, 0, 2, 32, 10, '#f0e8d0'); R(2, 4, 4, 6, '#2a6a5a'); R(8, 4, 3, 1, '#2a6a5a'); R(8, 7, 9, 1, '#2a6a5a'); R(19, 5, 10, 1, '#c83030'); R(19, 8, 7, 1, '#2a6a5a'); R(3, 5, 2, 1, '#e8e0c8'); },
    stallT(g, e, t, R) {   // 文卡特的茶摊（w=2）：铁皮棚、油布、铜壶、玻璃杯
      if (!e.tarpGone) { R(-3, -13, 38, 5, '#2a60aa'); for (let i = 0; i < 6; i++) R(-2 + i * 6, -9, 2, 2, '#1a4a8a'); R(-3, -13, 38, 1, '#6aa0e0'); }
      else { R(-3, -12, 38, 3, '#7a7e86'); R(-3, -9, 38, 1, '#4a4e56'); }
      R(0, -8, 32, 16, '#3a2a1a'); R(1, -7, 30, 14, '#1a120c');
      for (let i = 0; i < 5; i++) { R(3 + i * 3, -4, 2, 4, 'rgba(220,230,240,.5)'); R(3 + i * 3, -1, 2, 1, '#b8742a'); }
      R(20, -6, 7, 7, '#c88a3a'); R(21, -7, 5, 1, '#e0a850'); R(27, -4, 2, 1, '#c88a3a'); R(22, -9, 1, 2, 'rgba(230,230,230,.3)');
      box(R, -1, 7, 34, 9, '#7a5634'); R(0, 8, 32, 1, '#9a7650');
      if (e.power) R(4, 9, 24, 1, '#e8c060');
    },
    pco(g, e, t, R) {   // 黄底黑字的 STD·PCO 公用电话牌
      box(R, 1, -10, 14, 8, '#f0c820'); R(3, -8, 3, 1, '#1a1a1a'); R(7, -8, 2, 1, '#1a1a1a'); R(10, -8, 3, 1, '#1a1a1a'); R(3, -5, 10, 1, '#1a1a1a');
      box(R, 2, 2, 12, 13, '#d8d0bc'); box(R, 4, 4, 8, 6, '#c03030'); R(5, 5, 6, 1, '#e05050'); R(6, 7, 4, 2, '#1a1a1a');
      if (e.ring) { const b = (t * 14 | 0) % 2; R(3 + b, 3, 1, 1, '#fff'); R(12 - b, 3, 1, 1, '#fff'); }
    },
    banyan(g, e, t, R) {   // 巷口的老榕树（w=2,h=2）：粗干、气根、石台
      R(-6, 26, 44, 6, 'rgba(0,0,0,.35)'); box(R, -4, 18, 40, 12, '#8a8274');
      R(8, -4, 16, 26, '#4a3a2a'); R(10, -2, 4, 22, '#5a4a36'); R(19, 0, 2, 20, '#3a2a1e');
      for (let i = 0; i < 9; i++) R(-2 + i * 4, -6 + (i % 3) * 2, 1, 22 - (i % 3) * 3, '#5a4a38');
      for (let i = 0; i < 14; i++) { const x = -10 + ((i * 11) % 50), y = -40 + ((i * 7) % 18); R(x, y, 14, 9, i % 2 ? '#1e3a1e' : '#284a24'); }
      R(14, 8, 4, 2, '#c81e28'); R(9, 10, 14, 1, '#d8b030');   // 树干上缠的红线、黄线
    },
    naga(g, e, t, R) {   // 蛇石（Nagakallu）：姜黄、朱砂、一朵花
      R(1, 12, 14, 3, 'rgba(0,0,0,.3)');
      box(R, 1, 1, 6, 13, '#6a665e'); box(R, 9, 3, 6, 11, '#6a665e');
      R(3, 3, 2, 8, '#4a4640'); R(2, 4, 1, 1, '#4a4640'); R(5, 6, 1, 1, '#4a4640'); R(11, 5, 2, 7, '#4a4640'); R(10, 7, 1, 1, '#4a4640');
      R(2, 9, 4, 2, '#d8b030'); R(10, 10, 4, 2, '#d8b030'); R(3, 8, 1, 1, '#c81e28'); R(11, 9, 1, 1, '#c81e28');
      if (e.flower) { for (let i = 0; i < 6; i++) R(2 + i * 2, 13 - (i % 2), 1, 1, '#f4f2e8'); }
    },
    tulasi(g, e, t, R) { R(1, 12, 14, 3, 'rgba(0,0,0,.3)'); box(R, 3, 3, 10, 11, '#c86a3a'); R(4, 6, 8, 1, '#e8d8a0'); R(7, 8, 2, 2, '#c81e28'); for (let i = 0; i < 6; i++) R(3 + i * 2, -3 + (i % 2) * 2, 2, 6, i % 2 ? '#3a7a2a' : '#2a6a20'); },
    cow(g, e, t, R) {   // 趴在巷子里的白牛，角涂成蓝色和红色
      const up = e.s.up;
      R(-4, 12, 24, 3, 'rgba(0,0,0,.35)');
      if (!up) { box(R, -3, 4, 20, 10, '#e8e4dc'); R(-3, 12, 20, 2, '#c8c4bc'); box(R, 14, 1, 7, 7, '#e8e4dc'); R(19, 4, 1, 1, '#1a1a1a'); R(15, -2, 1, 3, '#3a6ac8'); R(19, -2, 1, 3, '#c83030'); R(20, 6, 2, 1, '#b89080'); R(-4, 8, 1, 4, '#c8c4bc'); }
      else { box(R, -3, 0, 20, 10, '#e8e4dc'); R(-2, 10, 2, 5, '#c8c4bc'); R(14, 10, 2, 5, '#c8c4bc'); box(R, 14, -4, 7, 7, '#e8e4dc'); R(19, -1, 1, 1, '#1a1a1a'); R(15, -7, 1, 3, '#3a6ac8'); R(19, -7, 1, 3, '#c83030'); }
    },
    rangoli(g, e, t, R) { const c = e.col || '#f0ece0'; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) R(2 + i * 3, 4 + j * 3, 1, 1, c); R(4, 6, 8, 1, c); R(7, 3, 1, 8, c); R(3, 9, 10, 1, '#c83a5a'); R(6, 4, 4, 1, '#e8b030'); },
    mallige(g, e, t, R) { for (let i = 0; i < 7; i++) R(3 + i * 1.5, 9 + Math.round(Math.sin(i) * 1.5), 2, 2, i % 2 ? '#f4f2e8' : '#e6e2d4'); R(3, 11, 10, 1, '#5a7a3a'); },
    cycle(g, e, t, R) { const c = '#2a2a2a'; R(0, 8, 6, 6, c); R(1, 9, 4, 4, '#0c0c0c'); R(10, 8, 6, 6, c); R(11, 9, 4, 4, '#0c0c0c'); R(3, 6, 10, 1, '#3a5a8a'); R(6, 4, 1, 6, '#3a5a8a'); R(12, 3, 1, 6, '#3a5a8a'); R(5, 3, 3, 1, '#1a1a1a'); R(11, 2, 4, 1, '#1a1a1a'); },
    fgate(g, e, t, R) {   // 成衣厂铁门（w=2）
      R(-1, -10, 34, 26, '#3a3d42'); for (let i = 0; i < 8; i++) R(1 + i * 4, -8, 1, 23, '#5a5d62'); R(0, -2, 32, 1, '#5a5d62'); R(0, 8, 32, 1, '#5a5d62');
      box(R, 6, -16, 20, 6, '#e8e0c8'); R(8, -14, 7, 1, '#2a4a8a'); R(17, -14, 7, 1, '#c83030'); R(8, -12, 16, 1, '#2a4a8a');
      if (!e.open) { R(14, 2, 4, 3, '#8a8678'); R(13, 0, 6, 2, '#5a5850'); }
    },
    win(g, e, t, R) { box(R, 2, -2, 12, 11, '#5a3a22'); R(3, -1, 10, 9, e.lit ? '#e8b860' : '#0c1018'); for (let i = 0; i < 4; i++) R(4 + i * 3, -1, 1, 9, '#3a2a1a'); },
    /* ---- 屋里 ---- */
    mat(g, e, t, R) { const c = e.col || '#b89a5a'; R(0, 3, 16 * (e.w || 1), 10, c); for (let x = 1; x < 16 * (e.w || 1); x += 3) R(x, 3, 1, 10, shade(c, -.12)); R(0, 3, 16 * (e.w || 1), 1, shade(c, .15)); if (e.full) { R(2, 4, 5, 4, '#e8e0d0'); R(8, 5, 18, 7, e.full === 2 ? '#c8c0b0' : '#6a4a6a'); } },
    puja(g, e, t, R) {   // 神龛：一张神像画、铜油灯、花
      box(R, 1, -4, 14, 14, '#7a4a24'); R(2, -3, 12, 2, '#9a6a3a'); box(R, 4, -1, 8, 8, '#e8c060'); R(5, 0, 6, 6, '#3a6ab8'); R(7, 1, 2, 3, '#f0c8a0'); R(6, 4, 4, 2, '#e8a030');
      R(3, 8, 2, 2, '#c8a040'); R(11, 8, 2, 2, '#c8a040');
      if (!e.off) { const f = Math.sin(t * 9) > 0 ? 1 : 0; R(3, 6 - f, 2, 2, '#ffd060'); R(11, 6 - f, 2, 2, '#ffd060'); }
      for (let i = 0; i < 6; i++) R(3 + i * 2, -4, 1, 1, '#f4f2e8');
    },
    klamp(g, e, t, R) { R(4, 12, 8, 3, 'rgba(0,0,0,.3)'); R(5, 12, 6, 2, '#8a2a20'); R(6, 4, 4, 8, e.off ? '#3a3a40' : 'rgba(255,220,140,.75)'); R(7, 6 + (Math.sin(t * 8) > 0 ? 1 : 0), 2, 3, e.off ? '#2a2a2a' : '#fff0b0'); R(5, 3, 6, 1, '#8a2a20'); R(7, 0, 2, 3, '#5a5a5a'); },
    stoveI(g, e, t, R) { box(R, 1, 3, 14, 11, '#5a4a3a'); R(3, 1, 10, 3, '#3a3a3a'); R(4, -2, 8, 4, '#a8a8b0'); R(5, -3, 6, 1, '#c8c8d0'); R(3, 9, 2, 2, '#c84020'); },
    kodam(g, e, t, R) { R(2, 12, 12, 3, 'rgba(0,0,0,.3)'); R(2, 5, 7, 8, '#c8902a'); R(3, 3, 5, 2, '#d8a03a'); R(4, 2, 3, 1, '#a8701a'); R(9, 7, 6, 6, '#b8b8c0'); R(10, 6, 4, 1, '#d8d8e0'); },
    bag(g, e, t, R) { box(R, 3, 4, 10, 10, '#2a4a7a'); R(5, 2, 6, 2, '#1a3a5a'); R(4, 8, 8, 1, '#1a3a5a'); R(7, 9, 2, 2, '#c8c8c8'); },
    trunk(g, e, t, R) { box(R, 0, 4, 16, 11, '#6a7078'); R(1, 5, 14, 1, '#8a9098'); R(7, 7, 2, 3, '#c8a040'); R(0, 9, 16, 1, '#4a5058'); },
    radio(g, e, t, R) { box(R, 0, 4, 16, 11, '#6a4a2a'); box(R, 2, 6, 12, 7, '#4a3020'); box(R, 3, 0, 10, 7, '#8a6a4a'); R(4, 1, 8, 5, '#c8b890'); for (let i = 0; i < 3; i++) R(5, 2 + i * 1.5, 6, 1, '#6a5a3a'); R(14, -4, 1, 5, '#8a8a8a'); },
    cal(g, e, t, R) { box(R, 3, 0, 10, 13, '#f0ece0'); R(4, 1, 8, 6, '#3a6ab8'); R(6, 2, 4, 4, '#e8a050'); R(7, 3, 2, 2, '#f0c8a0'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) R(4 + i * 3, 8 + j * 2, 2, 1, '#6a6a6a'); },
    idoorIn(g, e, t, R) {   // 从屋里看的门（下墙）：门闩
      R(1, 0, 14, 16, '#3a2a1e'); box(R, 2, 1, 12, 15, '#6a4428'); R(7, 1, 1, 15, '#3a2214');
      R(4, 7, 8, 2, e.open ? '#3a3a3a' : '#9a9a9a'); R(e.open ? 3 : 9, 6, 2, 4, '#7a7a7a');
    },
    iwin(g, e, t, R) { box(R, 2, 1, 12, 11, '#5a3a22'); R(3, 2, 10, 9, '#0a0e14'); for (let i = 0; i < 4; i++) R(4 + i * 3, 2, 1, 9, '#7a7a80'); if (e.s.eye) { R(6, 5, 4, 3, '#cfcac0'); R(7, 6, 1, 1, '#050404'); R(9, 6, 1, 1, '#050404'); } },
    /* ---- 宿舍 ---- */
    ddoor(g, e, t, R) {   // 宿舍铁门：刷绿漆的铁皮门 + 左边一块刷了石灰的白墙（字写在这儿）+ 门牌
      R(6, -7, 10, 23, '#2a2a2a'); box(R, 7, -6, 8, 22, e.open ? '#050505' : '#2a6a4a');
      if (!e.open) { R(8, -4, 6, 1, '#3a8a5a'); R(13, 4, 1, 2, '#c8c8c8'); }
      box(R, 8, -14, 6, 7, e.knock ? '#e85040' : '#f0ece0'); dig(R, 9, -13, e.num || 0, e.knock ? '#fff' : '#2a2a2a'); if (e.knock) R(7, -15, 8, 1, 'rgba(255,90,60,.6)');
      if (e.ink) { const c = inkCol(e); glyph(R, 0, -4, 0, c); glyph(R, 0, 2, 1, c); glyph(R, 0, 8, 2, c); }
      if (e.smear) { R(0, -2, 5, 1, 'rgba(255,255,255,.6)'); R(1, 3, 4, 1, 'rgba(255,255,255,.5)'); }
    },
    hearth(g, e, t, R) {   // 宿舍厨房：开着的灶口（w=2）
      R(0, -7, 32, 23, '#3a3430'); R(2, -5, 28, 13, '#0a0606');
      box(R, 4, 2, 10, 8, '#6a5a4a'); R(6, 4, 6, 4, e.off ? '#2a1a14' : '#c84a18'); R(7, 5, 4, 2, e.off ? '#1a0e0a' : '#ffa040');
      box(R, 18, 1, 10, 9, '#4a4440'); for (let i = 0; i < 4; i++) R(19 + i * 2, 3, 2, 2, '#1a1414');
      R(3, -4, 6, 2, '#a8a8b0'); R(22, -4, 5, 3, '#a8a8b0');
    },
    tank(g, e, t, R) { R(-2, 12, 36, 4, 'rgba(0,0,0,.35)'); box(R, 2, -10, 28, 22, '#1e1e22'); for (let y = -8; y < 12; y += 4) R(3, y, 26, 1, '#2e2e34'); R(10, -12, 12, 2, '#2a2a30'); R(4, 6, 24, 1, '#3a3a40'); },
    line(g, e, t, R) {   // 晾衣绳上的纱丽（w=5）
      const w = (e.w || 5) * 16, sw = Math.round(Math.sin(t * 1.4) * 1);
      R(0, -14, 1, 28, '#5a5a5a'); R(w - 1, -14, 1, 28, '#5a5a5a'); R(0, -13, w, 1, '#c8c8c8');
      const cs = ['#d8a030', '#4a7ab8', '#c83a5a', '#3a8a5a', '#e8e0d0'];
      for (let i = 0; i < 5; i++) { const x = 6 + i * ((w - 12) / 5); R(x + sw, -12, 10, 16 + (i % 2) * 4, cs[i]); R(x + sw, 3 + (i % 2) * 4, 10, 1, shade(cs[i], -.3)); }
    },
    dboard(g, e, t, R) { box(R, 1, -6, 14, 14, '#7a5a3a'); R(2, -5, 12, 12, '#c8b890'); R(3, -4, 5, 6, '#f0ece0'); R(9, -3, 4, 5, '#f8e8a0'); R(4, -3, 3, 1, '#c83030'); R(4, -1, 3, 1, '#666'); R(10, -2, 2, 1, '#666'); R(3, 3, 9, 3, '#e8e0d0'); },
    tap(g, e, t, R) { R(7, -2, 2, 14, '#6a6a70'); R(5, -2, 6, 2, '#8a8a90'); R(10, 0, 3, 2, '#8a8a90'); R(3, 10, 10, 5, '#3a6ab8'); R(4, 10, 8, 1, '#5a8ad8'); if (e.water) R(11, 2, 1, 8, 'rgba(160,200,240,.6)'); },
    dgate(g, e, t, R) { R(2, -8, 12, 40, '#2a2c30'); for (let i = 0; i < 4; i++) R(3 + i * 3, -6, 1, 36, '#5a5d62'); R(2, 6, 12, 1, '#5a5d62'); R(2, 20, 12, 1, '#5a5d62'); if (e.locked) { R(6, 12, 5, 4, '#8a8678'); R(4, 10, 9, 2, '#5a5850'); } },
    rprint(g, e, t, R) {   // 雨里的赤脚印：脚尖朝着来的方向
      const c = 'rgba(200,196,188,.45)'; R(4, 6, 3, 5, c); R(4, 12, 1, 1, c); R(5, 12, 1, 1, c); R(6, 12, 1, 1, c); R(10, 1, 3, 5, c); R(10, 7, 1, 1, c); R(11, 7, 1, 1, c); R(12, 7, 1, 1, c);
    }
  };
  const DIG = { 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '##.', '#.#', '.#.'] };
  function dig(R, x, y, n, c) { const G = DIG[n]; if (!G) return; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (G[j][i] === '#') R(x + i, y + j, 1, 1, c); }

  /* ---------- 瓦片：彩色外墙、瓦屋顶、明沟、红氧化物地面、石灰墙 ---------- */
  const LANECOL = x => x <= 7 ? '#7aa6c2' : x <= 10 ? '#d8b84a' : x <= 14 ? '#d88aa0' : x <= 17 ? '#7aa87a' : x <= 21 ? '#e0dccc' : x <= 25 ? '#d89a4a' : '#8a8a84';
  const ROOFK = x => x <= 7 ? 'flat' : x <= 10 ? 'tin' : x <= 17 ? 'tile' : x <= 21 ? 'flat' : x <= 25 ? 'tile' : 'wall';
  const TILES = {
    laneF: { solid: true, paint(R, X, Y) {
      const c = LANECOL(X); R(0, 0, 16, 16, c); R(0, 0, 16, 1, shade(c, .12));
      if (Y >= 2) { R(0, 11, 16, 5, shade(c, -.22)); R(0, 11, 16, 1, shade(c, -.32)); }
      else if (hash(X, Y, 3) < .55 && X < 26) { box(R, 4, 3, 8, 8, '#4a3020'); R(5, 4, 6, 6, '#141a22'); R(7, 4, 1, 6, '#6a6a70'); R(9, 4, 1, 6, '#6a6a70'); }
      if (hash(X, Y, 5) < .3) R(((hash(X, Y, 6) * 12) | 0), ((hash(X, Y, 7) * 10) | 0), 3, 2, shade(c, -.12));
    } },
    laneR: { solid: true, paint(R, X, Y) {
      const k = ROOFK(X);
      if (k === 'tile') { R(0, 0, 16, 16, '#9a4a2a'); for (let y = 0; y < 16; y += 4) { R(0, y + 3, 16, 1, '#6a2a18'); for (let x = (y / 4 % 2) * 2; x < 16; x += 4) R(x, y, 2, 3, '#b45a34'); } }
      else if (k === 'tin') { R(0, 0, 16, 16, '#7a7e86'); for (let x = 0; x < 16; x += 3) R(x, 0, 1, 16, '#5a5e66'); R(0, 14, 16, 2, '#4a4e56'); }
      else if (k === 'wall') { R(0, 0, 16, 16, '#5a5a56'); R(0, 0, 16, 3, '#6a6a66'); for (let i = 0; i < 5; i++) R(1 + i * 3, 0, 1, 2, i % 2 ? '#7ab08a' : '#c8d8d0'); }
      else { R(0, 0, 16, 16, '#3a3a3e'); R(0, 12, 16, 4, shade(LANECOL(X), -.1)); R(0, 12, 16, 1, shade(LANECOL(X), .1)); if (hash(X, Y, 9) < .3) R(4, 3, 6, 5, '#2a2a2e'); }
    } },
    nala: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#4a4a46'); R(0, 0, 16, 2, '#6a6a64'); R(0, 14, 16, 2, '#5a5a54'); R(0, 4, 16, 8, '#141a14'); R(0, 6, 16, 3, '#1e2a1c'); if (hash(X, Y, 11) < .4) R(((hash(X, Y, 12) * 12) | 0), 7, 3, 1, '#3a4a2a'); } },
    oxide: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#8a2a22'); R(0, 0, 16, 1, '#9a3a30'); R(0, 15, 16, 1, '#6a1e18'); R(15, 0, 1, 16, '#7a241e'); if (hash(X, Y, 21) < .35) R(((hash(X, Y, 22) * 10) | 0) + 2, ((hash(X, Y, 23) * 10) | 0) + 2, 4, 1, '#a24238'); } },
    lime: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#ece8dc'); R(0, 0, 16, 1, '#f8f6ee'); if (Y >= 2) { R(0, 12, 16, 4, '#b8b4a8'); R(0, 12, 16, 1, '#a8a498'); } else if (hash(X, Y, 31) < .5 && X % 3 !== 1) { box(R, 4, 4, 8, 6, '#5a5a5a'); R(5, 5, 6, 4, '#141820'); } if (hash(X, Y, 32) < .3) R(((hash(X, Y, 33) * 12) | 0), ((hash(X, Y, 34) * 10) | 0), 2, 3, '#d8d2c4'); } },
    roofD: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#4a4a4e'); R(0, 13, 16, 3, '#d8d4c8'); R(0, 13, 16, 1, '#f0ece0'); if (hash(X, Y, 41) < .25) R(3, 3, 8, 6, '#3a3a3e'); } },
    hedgeW: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#6a645a'); R(0, 0, 16, 3, '#8a847a'); for (let i = 0; i < 4; i++) R(i * 4 + 1, 5, 3, 2, '#5a544a'); R(0, 10, 16, 6, '#2a3a24'); for (let i = 0; i < 5; i++) R(i * 3, 9 + (i % 2), 3, 3, '#3a4a2a'); } }
  };

  /* ================= 剧本 ================= */
  const V = {
    amma1: '卡薇娅——开门，是阿妈。厂里提前放工了……巷子里好黑。',
    raju: '阿爸——！是我，拉朱！我从迪拜回来了！开门呀，阿爸！',
    n2: { dA: '吉塔——是阿妈呀，从迈索尔来看你了，开开门……', dB: '阿妈，开门，是我，苏雷什。我钥匙丢了……', dM: '阿爸——是我，拉朱……', dR: '拉希姆，开门。是哥哥，从海德拉巴来了。' },
    dorm: { r1: '咚咚——（1 号）「செல்வி……塞尔维……」老妇人的泰米尔话', r2: '咚咚——（2 号）「拉妮，开门，阿爸来接你回家了。」', r3: '咚咚——（3 号）「查房！开门！」宿管大妈的大嗓门', r4: '咚咚——（4 号）「姐姐，是我呀，小妹……」', r5: '咚咚——（5 号）「开门，工头叫你们回车间加班！」', r6: '咚咚——（6 号）「阿妈……」' },
    rain: { dA: '咚咚——「吉塔——雨好大，让阿妈进去躲躲……」', dB: '咚咚——「阿妈，开门，我是苏雷什……」', dM: '咚咚——「阿爸！是我，拉朱！说好今天打电话的……」', dR: '咚咚——「拉希姆——开门——」', dH: '咚咚——「卡薇娅，开门，是阿妈。雨太大了……」' }
  };
  const DOORS = {
    dA: { name: '苏雷什和吉塔家的门', who: '吉塔', occ: true, exposed: true },
    pil: { name: '两扇门中间的柱子', pillar: true, exposed: true },
    dB: { name: '帕德玛阿姨家的门', who: '帕德玛阿姨', occ: true, exposed: true },
    stall: { name: '茶摊的木板', occ: false, exposed: true },
    dM: { name: '穆尼大爷家的门', who: '穆尼大爷', occ: true, exposed: true },
    dL: { name: '纳拉辛哈家的门', occ: false, exposed: true },
    dR: { name: '拉希姆大叔的铁卷帘', who: '拉希姆大叔', occ: true, metal: true },
    dH: { name: '自家的门', who: '阿吉', occ: true, eave: true },
    r1: { name: '1 号门', dorm: true }, r2: { name: '2 号门', dorm: true }, r3: { name: '3 号门', dorm: true },
    r4: { name: '4 号门', dorm: true }, r5: { name: '5 号门', dorm: true }, r6: { name: '6 号门', dorm: true }
  };
  const LANE_OCC = ['dA', 'dB', 'dM', 'dR', 'dH'];
  const RD = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];

  function chalkN(S) { return S.has('chalk3') ? 3 : S.has('chalk2') ? 2 : S.has('chalk1') ? 1 : 0; }
  function useChalk(S) { const n = chalkN(S); S.take('chalk' + n); if (n > 1) S.give('chalk' + (n - 1), true); }
  function legible(e) { return !!(e && e.s.ink && (e.s.fade == null || e.s.fade > .3)); }
  function safeAt(S, id) {
    if (id === 'dA' || id === 'dB') return legible(S.ent(id)) || legible(S.ent('pil'));
    if (id === 'dM') return legible(S.ent('dM')) || !!S.ent('dM').locked;
    return legible(S.ent(id));
  }
  function occupied(S, id) { return id === 'dM' ? !S.ent('dM').locked : !!(DOORS[id] && DOORS[id].occ); }
  function laneLeft(S) { return LANE_OCC.filter(id => occupied(S, id) && !safeAt(S, id)); }

  async function caught(S, kind, msg, title) {
    lastDeath = kind; const f = S.f; if (f.g) f.g.halt = true; f.rt = false;
    S.focus(null); S.hidePlayer(false);
    await S.scare('face', { spr: '@nb', face: 'nb', dur: 1.1 });
    await S.die(msg || '一只冰凉的手，搭在了你的肩膀上。\n脚镯声，就停在你耳朵边上。', title || '她看见你了');
  }

  /* ---------- 写字 ---------- */
  async function scrawl(S, what) {   // 返回 'ok' | 键串（写错）| null（放弃）
    const f = S.f, n = f.wrongN || 0;
    const tip = n >= 4 ? '\n（依次按 7、4、2）' : n >= 3 ? '\n（先 naa，再 le，最后 baa）' : n >= 2 ? '\n（作业本背面：ನಾಳೆ ಬಾ = naa · le · baa）' : '';
    const r = await S.keypad('在' + what + '上写「明天再来」——照作业本上的写，三个字' + tip + '\n（J 打开作业本 · 数字键 1–9 也能按 · 联机：一人念本子，一人写）', KEYS, 3, { sep: '|', alias: ALIAS });
    if (r == null) return null;
    return r === W_OK ? 'ok' : r;
  }
  async function wrongWrite(S, r) {
    const f = S.f; f.wrongN = (f.wrongN || 0) + 1;
    if (r === W_TODAY) {
      if (S.once('today')) { S.fx('red'); S.sfx('sting'); heart(S); await S.narr('你退后一步，看清了自己写的字——\n「ಇಂದು ಬಾ」。今天来。\n……你在请她今天来。'); await S.narr('你用袖子发疯似的把那几个字蹭掉了，手一直在抖。'); }
      else S.toast('写成了「ಇಂದು ಬಾ」（今天来）——赶紧擦掉！');
    } else if (r === W_YEST) { if (f.rt) S.toast('写成了「ನಿನ್ನೆ ಬಾ」（昨天来）——擦掉重写'); else await S.narr('「ನಿನ್ನೆ ಬಾ」——昨天来。\n昨天已经过去了。她会不会当真？你不敢赌，擦掉了。'); }
    else if (f.rt) S.toast('写出来的不成字——擦掉重写');
    else await S.narr('写出来的几个字歪七扭八，连你自己都认不出来。擦掉，重写。');
  }
  /* 在一扇门（或柱子）上写字：选材料、检查墙面、照本子写。返回 true = 写好了 */
  async function writeAt(S, id) {
    const f = S.f, e = S.ent(id), D = DOORS[id], rain = f.ph === 'rain';
    if (D.dorm) {
      if (!S.has('coal')) {
        if (S.has('chalk1') || chalkN(S)) { e.s.smear = true; f.chalkFail = true; await S.narr('你拿粉笔在门边比画了一下——\n白粉笔写在刚刷过石灰的白墙上，什么也看不见。\n门是刷了绿漆的铁皮，粉笔一划就打滑。'); e.s.smear = false; S.goal('白墙上粉笔看不见——去厨房灶膛拿炭（东头）'); return false; }
        return S.narr('手里没有能写字的东西。厨房灶膛里有炭。');
      }
      const r = await scrawl(S, D.name + '边的白墙'); if (r == null) return false;
      if (r !== 'ok') { await wrongWrite(S, r); return false; }
      e.s.ink = 'k'; S.sfx('paper');
      const left = RD.filter(k => !S.ent(k).s.ink).length;
      S.toast(left ? D.name + '写好了（还剩 ' + left + ' 扇）' : '六扇门都写好了——快进 6 号房！');
      if (!left) S.goal('六扇门都写好了——快进 6 号房（阿妈屋里）');
      return true;
    }
    const mats = [];
    if (S.has('chalkbox')) mats.push(['c', '粉笔']);
    else if (chalkN(S)) mats.push(['c', '粉笔头（还剩 ' + chalkN(S) + ' 个）']);
    if (S.has('paint')) mats.push(['p', '红漆（只够一扇门）']);
    if (S.has('paint2')) mats.push(['q', '招牌漆（只够一扇门）']);
    if (rain && S.has('tarp') && (D.exposed)) mats.unshift(['t', '用油布把它遮住']);
    if (!mats.length) { if (f.rt) return S.toast('手里没有能写字的东西了'), false; await S.narr('……手里已经没有能写字的东西了。'); return false; }
    if (legible(e) && !(rain && D.exposed && e.s.ink === 'c' && !e.s.tarp)) { if (f.rt) S.toast(D.name + '上的字还好好的'); else await S.narr(D.name + '上的字还好好的。'); return false; }
    if (!D.occ && !D.pillar && !f.rt) { await S.think(id === 'dL' ? '（门上挂着锁，屋里没人……）' : '（茶摊晚上没人睡。）'); if (await S.ask('还是写上？', ['不写了', '写上']) === 0) return false; }
    let m;
    const opts = mats.map(x => x[1]).concat(['先不写']);
    const k = await S.ask('在' + D.name + '上——', opts);
    if (k >= mats.length) return false;
    m = mats[k][0];
    if (m === 't') {
      if (!legible(e)) { S.toast('字已经冲没了——遮住也没用，得用漆重写'); return false; }
      e.s.tarp = true; S.take('tarp'); S.sfx('paper'); S.toast('油布绷好了——' + D.name + '上的字保住了'); return true;
    }
    if (m === 'c' && D.metal) { e.s.smear = true; if (f.rt) S.toast('粉笔在油漆铁皮上打滑，写不上'); else await S.narr('粉笔在刷了油漆的铁卷帘上直打滑。\n你使劲划了半天，一道印子也留不下。'); e.s.smear = false; return false; }
    if (m === 'c' && rain && !D.eave) { if (f.rt) S.toast('墙湿透了——粉笔一沾就化成白浆，写不上'); else await S.narr('墙湿透了。粉笔一沾上去就化成白浆，糊成一片。'); return false; }
    const r = await scrawl(S, D.name); if (r == null) return false;
    if (r !== 'ok') { await wrongWrite(S, r); return false; }
    if (m === 'c' && !S.has('chalkbox')) useChalk(S);
    if (m === 'p') S.take('paint');
    if (m === 'q') S.take('paint2');
    e.s.ink = m; delete e.s.fade; S.sfx('paper');
    if (f.rt) S.toast(D.name + '：写好了' + (m === 'c' ? '' : '（漆，不怕雨）'));
    else await S.narr(D.name + '上，' + (m === 'c' ? '白色的粉笔字' : m === 'p' ? '红漆写的字' : '黄漆写的字') + '歪歪扭扭：' + NALE + '。\n明天再来。');
    if (id === 'pil' && !f.rt) await S.narr('柱子就在两扇门正中间。\n站在哪一扇门前，都看得见这两个字。');
    if (f.ph === 'd2') {
      goal2(S);
      const L = laneLeft(S);
      if (L.length && !chalkN(S) && !S.has('paint') && S.once('out')) await S.think('（粉笔头和红漆都用完了……可还有 ' + L.length + ' 户门上没字。）' + (L.length === 1 && L[0] === 'dM' ? '' : '\n（今晚，怕是保不住每一家了。）'));
    }
    if (f.ph === 'd4') goal4(S);
    return true;
  }

  /* ================= 第一夜 ================= */
  async function homeEnter(S, first) {
    const f = S.f;
    if (first) {
      lampOn(S, true);
      await S.narr('城西，一条窄巷子里的老房子。\n晚上七点四十。又停电了，阿吉点上了煤油马灯。');
      await S.say('阿吉', '卡薇娅，你过来坐。');
      f.ph = 'n1a'; S.goal('和阿吉说说话');
    }
  }
  async function ajjiHome(S) {
    const f = S.f; S.face('ajjiH', 'pl');
    if (f.ph === 'n1a') {
      await S.say('阿吉', ['今天菜市场的人都在说一件事。', '说是这几天夜里，有个女人挨家挨户敲门。', '她会学你家里人的声音叫你。你阿妈的声音，你阿爸的声音……谁的都会学。', '开了门的人——据说，过不了一天。']);
      await S.say('阿吉', '有人说她是个新娘，成亲那天夜里就没了，头上还戴着茉莉。……谁知道呢。');
      await S.say('阿吉', ['破她的法子，菜市场的人也说了：在门外头写上「' + NALE + '」——明天再来。', '她看见了，念一声「明天」，就走。第二天再来，又看见，又走。']);
      await S.say('你', '那她……不就永远都在明天？');
      await S.say('阿吉', ['对。永远在明天。', '……我不认得字。你是学校里卡纳达语写得最好的。给咱家门上写一个吧。']);
      await S.narr('你翻出作业本，把阿吉说的一条一条记在最后一页。');
      await S.note('book');
      f.ph = 'n1b'; S.goal('从书包里拿粉笔（屋子右边）');
      return;
    }
    if (f.ph === 'n1b') return S.say('阿吉', '粉笔在你书包里吧？');
    if (f.ph === 'n1c') return S.say('阿吉', ['写在门外头。一个字都不能错。', '……写完赶紧回来，把门闩上。']);
    if (f.ph === 'n1d') return S.say('阿吉', '写好了？……好孩子。睡吧，明天还要上学。');
    await S.say('阿吉', '……');
  }
  async function bagUse(S) {
    const f = S.f;
    if (f.ph === 'n1b') { S.give('chalk3'); f.ph = 'n1c'; await S.narr('书包里有一个铁皮铅笔盒。盒子里躺着三个粉笔头——老师写剩的，你一节一节攒下来的。'); S.goal('到门外，在自家门上写字（J 看作业本）'); return; }
    await S.narr(f.ph === 'n1a' ? '你的书包。作业本、铅笔盒、一本卷了角的卡纳达语课本。' : '书包里只剩课本和作业本了。');
  }
  async function homeDoorIn(S) {
    const f = S.f;
    if (f.ph === 'n1a') return S.narr('先听阿吉把话说完。');
    if (f.ph === 'n1b') return S.narr('先去书包里拿粉笔。');
    if (f.ph === 'n1c') { S.sfx('open'); return S.go('lane', 23, 3, 3); }
    if (f.ph === 'n1d') return S.narr('门闩上了。外面已经黑透了。');
    if (f.ph === 'muni') return S.narr('门外还有声音。不能开。');
    await S.narr('木门闩得好好的。');
  }
  async function n1Sleep(S) {
    const f = S.f;
    if (f.ph !== 'n1d') return S.narr(f.ph === 'n1a' || f.ph === 'n1b' || f.ph === 'n1c' ? '你的席子。现在还不困。' : '你的席子，卷起来靠在墙边。');
    if (await S.ask('躺下睡觉？', ['躺下', '再等等'])) return;
    await S.narr('你和阿吉一人一张席子，躺在马灯旁边。\n阿吉把灯芯捻小了。巷子里的狗叫了两声，不叫了。');
    await S.fade(1, 900);
    S.hide('ajjiH'); S.ent('amat').full = 1; S.ent('kmat').full = 1; S.pos(5, 7, 0); S.hidePlayer(true);
    S.dark(.82, 'home'); S.plr(2.4); lampOn(S, false); S.amb('night');
    await S.card('夜里', '', '……');
    S.hidePlayer(false); S.pos(7, 8, 0);
    await S.fade(0, 700);
    f.ph = 'n1e'; S.goal('……有人敲门');
    S.cp('n1');
    await n1Knock(S);
  }
  async function n1Knock(S) {
    const f = S.f;
    await S.narr('半夜。\n你被一阵声音弄醒了。');
    jingleFar(S); await S.wait(600); jingleFar(S); await S.wait(700);
    knockW(S); await S.wait(1100);
    await S.say('门外', V.amma1, { style: 'whisper' });
    await S.think('（……阿妈？）');
    await S.say('阿吉', '……你阿妈这礼拜住厂里宿舍。别出声。', { style: 'whisper' });
    if (lastDeath === 'n1') { lastDeath = null; await S.think('（不管是谁的声音——别应，别开门。）'); }
    let loops = 0;
    for (;;) {
      const opts = []; if (!f.peep) opts.push('从门缝往外看一眼'); opts.push('问：「阿妈？你怎么回来了？」', '开门', '（捂住嘴，一声不出）');
      const k = opts[await S.ask('门外：「' + V.amma1 + '」', opts)];
      if (++loops === 3) await S.think('（作业本上记着：不管是谁的声音——别应，别开门。）');
      if (k === '从门缝往外看一眼') {
        f.peep = true;
        await S.narr('你凑到门缝上。马灯灭了，巷子里只有一点月光——');
        await S.scare('face', { spr: '@nb', face: 'nb', dur: 1 });
        await S.narr('一角红色的纱丽。一只赤着的、灰白的脚。\n……脚后跟，对着门。');
        await S.think('（她的脚……是反着长的？）');
        continue;
      }
      if (k === '问：「阿妈？你怎么回来了？」') {
        await S.say('你', '阿妈？……你怎么回来了？');
        await S.wait(500);
        await S.say('门外', V.amma1, { style: 'whisper' });
        await S.narr('一模一样的一句话。\n连那一声「卡薇娅——」拖长的调子，都一模一样。');
        await S.think('（她不回答。她只会叫门。）');
        continue;
      }
      if (k === '开门') {
        f.openTry = (f.openTry || 0) + 1;
        if (f.openTry >= 2) return caught(S, 'n1', '门闩拉开了。\n门外没有阿妈。\n只有一个低着头的女人。盖头底下，有人轻轻地笑了一声。', '你开了门');
        S.sfx('switch');
        await S.narr('你的手碰到了门闩——');
        S.shake(300, 2);
        await S.say('阿吉', '……你疯了？！', { style: 'whisper' });
        await S.narr('阿吉一把攥住你的手腕，攥得生疼。');
        continue;
      }
      break;
    }
    await S.narr('你捂住嘴，背靠着墙，大气都不敢出。');
    await S.wait(900);
    await S.narr('敲门声停了。\n门外安静了很久很久——久到你以为她走了。');
    await S.wait(700);
    await S.say('门外', '……ನಾಳೆ。', { style: 'whisper' });
    await S.narr('一个女人的声音，贴着门板，轻轻地念。\n「明天。」');
    jingle(S, .02); await S.wait(500); jingleFar(S);
    await S.narr('叮——叮——\n脚镯声，往巷子那头去了。');
    await S.wait(600); S.sfx('knock');
    await S.narr('远远地，又有人家的门响了。\n「阿爸——」\n……是穆尼大爷家。');
    await S.say('阿吉', '穆尼耳朵背，听不见的。……睡吧。', { style: 'whisper' });
    await S.fade(1, 1200);
    await day2(S);
  }

  /* ================= 巷子：傍晚（第一夜） ================= */
  function laneSet(S, k) {
    const P = { geetha: [5, 4, 0], rahim: [18, 4, 0], muniL: [14, 4, 0], venkat: [9, 4, 0], ajjiL: [22, 4, 0], ammaL: [24, 4, 0] };
    const on = { eve: ['geetha', 'rahim', 'muniL', 'venkat'], day2: ['geetha', 'rahim', 'muniL', 'venkat', 'ajjiL'], day3: ['geetha', 'rahim', 'muniL', 'venkat', 'ajjiL'], day4: ['geetha', 'rahim', 'muniL', 'venkat', 'ajjiL'], d8: ['geetha', 'rahim', 'muniL', 'venkat', 'ajjiL', 'ammaL'] }[k] || [];
    for (const id in P) { if (on.includes(id)) S.place(id, P[id][0], P[id][1], P[id][2]); else S.hide(id); }
    S.hide('nb'); S.ent('cow').s.up = false;
    for (let i = 1; i <= 5; i++) S.show('pr' + i, k === 'day3');
    S.ent('stall').power = k === 'eve';
  }
  async function laneEnter(S, first) {
    const f = S.f;
    if (f.ph === 'n1c' && first) {
      S.dark(.5, 'lane'); laneSet(S, 'eve');
      await S.narr('巷子里，家家户户正在关门。天边还剩一抹紫。\n远处的寺庙里，有人在敲傍晚的钟。');
      S.tone('sine', 520, 516, 1.6, .025, 0); S.tone('sine', 1040, 1030, 1, .01, .02);
    }
  }
  async function n1Lane(S, id) {   // 傍晚的门：只写自家的；别家都笑你
    const f = S.f;
    if (id === 'dH') {
      if (f.ph === 'n1c') {
        const ok = await writeAt(S, 'dH');
        if (!ok) return;
        f.ph = 'n1d';
        await S.narr('对面，拉希姆大叔「哗啦」一声拉下铁卷帘，冲你摇头。');
        await S.say('拉希姆大叔', '迷信！都是迷信！');
        S.goal('回屋，闩上门（自家门）');
        return;
      }
      if (f.ph === 'n1d') { S.sfx('open'); await S.go('home', 7, 8, 3); return S.goal('躺下睡觉（自己的席子）'); }
    }
    const msg = { dA: ['吉塔笑着摆手：「我才不信这些呢。」'], dB: ['帕德玛阿姨家门口挂着芒果叶。她在屋里念经。'], pil: ['两扇门中间的柱子，刷着天蓝色的漆。'], dM: ['穆尼大爷坐在门口，冲你「啊？」了一声，没听清。'], dR: ['拉希姆大叔正往下拉卷帘：「写什么写，别弄脏我的卷帘！」'], dL: ['门上挂着一把大铁锁。纳拉辛哈一家回乡下吃喜酒了。'], stall: ['文卡特在收摊，把玻璃杯一只只倒扣在木板上。'] }[id];
    if (f.ph === 'n1c') await S.think('（还是先写自家的门吧。）');
    else if (msg) await S.narr(msg[0]);
  }

  /* ================= 第二天：给整条巷子写字（资源分配谜题） ================= */
  async function day2(S) {
    const f = S.f;
    f.ph = 'd2m';
    S.ent('amat').full = 0; S.ent('kmat').full = 0; S.show('ajjiH'); lampOn(S, true); S.dark(null, 'home'); S.plr(null);
    laneSet(S, 'day2'); S.dark(null, 'lane'); S.amb('wind');
    S.ent('dH').s.ink = null; S.show('mallige');
    await S.go('lane', 23, 4, 3, { ms: 900 });
    await S.card('第二天', '', '');
    await S.narr('早上。阿吉在门口洒水、扫地，画新的兰果丽。\n……门板湿漉漉的。你昨晚写的字，一个都不剩了。');
    S.face('ajjiL', 'pl');
    await S.say('阿吉', '哎呀——我顺手把门也擦了……四十年的老习惯了。');
    await S.think('（粉笔字，一沾水就没了。）');
    S.face('geetha', 'pl');
    await S.say('吉塔', '卡薇娅！昨天夜里有人用我妈妈的声音叫门……我妈在迈索尔呢！给我们家也写一个吧！');
    await S.say('拉希姆大叔', '……也给我写一个。我只认得乌尔都文。');
    S.face('ajjiL', 'pl');
    await S.say('阿吉', '这罐红漆是过年刷门槛剩下的，只够写一扇门。加上你那两个粉笔头……省着点用。');
    S.give('paint');
    f.ph = 'd2';
    await S.think('（两个粉笔头，一扇门的红漆。先挨家问问情况。）');
    goal2(S);
    S.cp('day2');
  }
  function goal2(S) {
    const f = S.f; if (f.ph !== 'd2') return;
    const L = laneLeft(S);
    if (!L.length) return S.goal('该写的都写好了——回家等天黑');
    S.goal('帮邻居写字（粉笔' + chalkN(S) + '·红漆' + (S.has('paint') ? 1 : 0) + '）还剩 ' + L.length + ' 户' + (f.muniAsk && !f.muniAway ? '·去请阿吉劝穆尼' : '·卡住问阿吉'));
  }
  async function d2Resume(S) {
    const L = lastDeath; lastDeath = null;
    if (L && L.startsWith('n2:')) {
      const id = L.slice(3);
      const why = { dA: '吉塔家', dB: '帕德玛阿姨家', dM: '穆尼大爷家', dR: '拉希姆大叔的卷帘', dH: '咱家' }[id] || '';
      await S.think('（昨晚……要是' + why + '门上有字就好了。重新想想：两个粉笔头，一扇门的红漆，怎么分？）');
      if (hintLv >= 2) await S.think('（阿吉一定有办法。去问问她。）');
    }
    goal2(S);
  }
  const AJJI_HINT = [
    ['粉笔头两个，红漆一扇门，要写的门可不止三扇。', '……先数一数：今晚哪几户屋里有人？没人的屋子，用不着写。'],
    ['两家的门挨着的，中间柱子上写一回就够——你本子上不是记着嘛。', '拉希姆的铁卷帘刷着油漆，粉笔可写不上。红漆留给他。'],
    ['这么分还是差一扇，对不对？', '……穆尼一个人住。叫他今晚来咱家睡，把他的门从外头锁上。她不敲挂着锁的门。']
  ];
  async function ajjiLane(S) {
    const f = S.f; S.face('ajjiL', 'pl');
    if (f.ph === 'd2') {
      if (f.muniAsk && !f.muniAway) return persuade(S);
      const L = laneLeft(S), out = !chalkN(S) && !S.has('paint');
      const lv = Math.min(2, Math.max(f.hA || 0, hintLv, out ? 2 : 0));
      f.hA = (f.hA || 0) + 1;
      if (!L.length) return S.say('阿吉', '都写好了？……天快黑了，回屋吧。');
      if (out && !(L.length === 1 && L[0] === 'dM')) return S.say('阿吉', ['粉笔、红漆都用完了，还空着 ' + L.length + ' 户……', '今晚怕是要出事。卡薇娅，要是能重来一回，先数清楚、想明白了再下笔。']);
      return S.say('阿吉', AJJI_HINT[lv]);
    }
    if (f.ph === 'd3') return S.say('阿吉', '你阿妈打电话找你呢，快去茶摊。');
    if (f.ph === 'd3go') return S.say('阿吉', ['去吧。到了宿舍，听你阿妈的。', '天黑以后，谁叫门都别应。']);
    if (f.ph === 'd4') return S.say('阿吉', ['要下雨了。……季风来了。', '粉笔字最怕水。屋檐底下的还好，没遮没挡的……难说。']);
    if (f.ph === 'd8') return S.say('阿吉', ['擦不擦，听你的。', '……我只记得，她每回走的时候，念的都是「明天」。']);
    await S.say('阿吉', '……');
  }
  async function persuade(S) {
    const f = S.f;
    await S.say('你', '阿吉，穆尼大爷一个人住……我想请他今晚来咱家睡，把他的门锁上。可他不肯，说除非你亲自去请。');
    await S.say('阿吉', '这个犟老头。……我去说。');
    await S.walk('ajjiL', [14, 5], 3); S.face('ajjiL', 3); S.face('muniL', 0);
    await S.say('阿吉', ['穆尼！（大声）今晚到我家睡！', '你那个耳朵，半夜有人用拉朱的声音叫你，你开不开？']);
    await S.say('穆尼大爷', '……拉朱的声音……');
    await S.narr('穆尼大爷低头看着手里那封蓝色的信，看了很久。');
    await S.say('穆尼大爷', ['……好好好。我锁上门就过去。', '你家那个萨姆巴汤，还是四十年前的味道吗？']);
    await S.walk('muniL', [13, 3], 2.4); S.face('muniL', 3); S.sfx('locked');
    S.ent('dM').locked = true;
    await S.narr('穆尼大爷把门带上，「咔嚓」一声，挂上了一把旧铁锁。\n然后拄着拐，慢慢往你家走去。');
    await S.walk('muniL', [23, 3], 2.4); S.hide('muniL'); S.sfx('close');
    await S.walk('ajjiL', [22, 4], 3); S.face('ajjiL', 'pl');
    f.muniAway = true;
    await S.say('阿吉', '这下，他的门用不着写了。');
    goal2(S);
  }
  const EVE = f => f.ph === 'n1c' || f.ph === 'n1d';
  async function muniTalk(S) {
    const f = S.f; S.face('muniL', 'pl');
    if (EVE(f)) return S.say('穆尼大爷', ['啊？你说什么？……大声点！', '……女人敲门？我这耳朵，雷都听不见，还怕敲门？']);
    if (f.ph === 'd2') {
      if (!f.muniMet) { f.muniMet = true; await S.narr('穆尼大爷坐在门口的石阶上，手里捏着一封蓝色的信。他的耳朵不好，你得凑到他耳边大声喊。'); }
      const opts = ['（大声）「穆尼大爷！今晚来我家睡吧！」', '（大声）「我给您门上写字！」', '（大声）「这封信，要我念给您听吗？」', '算了'];
      const k = await S.ask('穆尼大爷：「啊？什么？」', opts);
      if (k === 0) {
        f.muniAsk = true;
        await S.say('穆尼大爷', ['啊？……去你家睡？', '不去不去。我在这屋里睡了四十年了。', '拉朱要是哪天半夜回来了，敲门，我不在家怎么行。']);
        await S.say('穆尼大爷', '……除非你阿吉亲自来请。四十年前她嫁到这条巷子，喜酒还是我帮着摆的。');
        return goal2(S);
      }
      if (k === 1) return S.say('穆尼大爷', '写字？……写吧写吧。你们年轻人信这个。');
      if (k === 2) { await S.narr('穆尼大爷把信递给你。是他儿子从迪拜寄来的。'); await S.note('letter'); f.readLetter = true; return S.say('穆尼大爷', '……「别谁叫都开」。嘿，这孩子。'); }
      return;
    }
    if (f.ph === 'd3' || f.ph === 'd3go') return S.say('穆尼大爷', ['卡薇娅！昨天夜里……多亏你了。', '那声音，真像拉朱啊。像得我心里发疼。']);
    if (f.ph === 'd4') {
      if (!f.muni4) { f.muni4 = true; await S.say('穆尼大爷', ['今天十五号。拉朱信上说，今天往茶摊打电话。', '我今晚哪儿也不去，就在自己家等着。他要是打来了，文卡特会来敲我窗户的。']); return goal4(S); }
      return S.say('穆尼大爷', safeAt(S, 'dM') ? '字写好了？好，好。' : '我的门，你也给写一个吧。');
    }
    if (f.ph === 'd8') return S.say('穆尼大爷', ['拉朱打电话来了！他说今年年底就回来，不走了！', '……我跟他说了，回来那天，先在门外喊一声暗号。']);
    await S.say('穆尼大爷', '啊？');
  }
  async function geethaTalk(S) {
    const f = S.f; S.face('geetha', 'pl');
    if (EVE(f)) return S.say('吉塔', ['卡薇娅，你也听说了？菜市场那个？', '嗐，吓唬小孩的。我才不信呢。']);
    if (f.ph === 'd2') return S.say('吉塔', ['我们家两间屋，门挨着门：左边是我和苏雷什，右边是婆婆。', '两扇门都要写吗？……粉笔够不够啊。']);
    if (f.ph === 'd4') return S.say('吉塔', '要下大雨了。我婆婆说，她小时候，季风头一场雨，能把巷子淹到膝盖。');
    if (f.ph === 'd8') return S.say('吉塔', '我婆婆说，门上的字她要留着，留到孙子会写字那天。');
    await S.say('吉塔', '卡薇娅，昨晚我听见她念「明天」了。……我一晚上没敢合眼。');
  }
  async function rahimTalk(S) {
    const f = S.f; S.face('rahim', 'pl');
    if (EVE(f)) return S.say('拉希姆大叔', '迷信！都是迷信！');
    if (f.ph === 'd2') return S.say('拉希姆大叔', ['我睡在铺子里。……昨天夜里，我听见我哥在卷帘外头叫我。他在海德拉巴，三年没见了。', '卷帘刷的是油漆，滑溜溜的。粉笔怕是写不上。']);
    if (f.ph === 'd4') {
      if (!S.has('paint2') && !f.gotP2) { f.gotP2 = true; S.give('paint2'); await S.say('拉希姆大叔', ['要下雨了。粉笔字可顶不住。', '拿着——刷招牌的漆，剩小半罐，够写一扇门。雨淋不掉。']); return goal4(S); }
      return S.say('拉希姆大叔', '下雨天，我这铺子的雨棚底下倒是淋不着。');
    }
    if (f.ph === 'd8') return S.say('拉希姆大叔', '我这卷帘上的字？不擦。开斋节刷漆，我也绕着它刷。');
    await S.say('拉希姆大叔', '……谢谢你，小姑娘。');
  }
  async function venkatTalk(S) {
    const f = S.f; S.face('venkat', 'pl');
    if (EVE(f)) return S.say('文卡特', ['今天茶摊上人人都在说那个女人，说得有鼻子有眼的。', '……我收摊了，回家睡觉喽。']);
    if (f.ph === 'd2') {
      await S.say('文卡特', ['我晚上回家睡，茶摊没人，不用给我写。', '给我写，她敲给谁听？']);
      if (!f.readPaper) { f.readPaper = true; await S.say('文卡特', '你看，报纸都登了。'); await S.note('paper1'); }
      return;
    }
    if (f.ph === 'd3') return S.say('文卡特', '电话！你阿妈在线上等着呢，快接！');
    if (f.ph === 'd3go') return S.say('文卡特', '宿舍七点锁大门，你快去吧。');
    if (f.ph === 'd4') {
      if (!S.has('chalkbox')) { S.give('chalkbox'); await S.say('文卡特', ['给，一整盒新粉笔，我进货顺手捎的。', '要下雨喽。我得把茶摊的油布放下来——雨再大，油布底下也淋不着。']); return goal4(S); }
      return S.say('文卡特', ['油布？下雨我就把它绷在棚子上。', '……穆尼要是等到电话，我就去敲他的窗户。']);
    }
    if (f.ph === 'd8') { await S.say('文卡特', ['又一份报纸。你看看，说是「风波渐息」。', '……我这茶摊的木板上，你也给我写一个吧。不为别的，留个念想。']); if (!f.read2) { f.read2 = true; await S.note('paper2'); } return; }
    await S.say('文卡特', '喝杯茶？');
  }
  async function stallUse(S) {
    const f = S.f, e = S.ent('stall');
    if (f.ph === 'rain') {
      if (!e.s.tarpGone) { e.s.tarpGone = true; S.give('tarp', true); S.sfx('paper'); S.toast('扯下了茶摊的油布（能遮住一扇门或一根柱子）'); return; }
      return S.toast('油布已经扯下来了');
    }
    if (f.ph === 'd2' || f.ph === 'd4') { const k = await S.ask('茶摊。铜壶里的奶茶还冒着热气。', ['看看', '在茶摊木板上写字']); if (k === 1) return writeAt(S, 'stall'); }
    if (f.ph === 'd8' && S.has('chalkbox') && !e.s.ink) { e.s.ink = 'c'; S.sfx('paper'); return S.narr('你在茶摊的木板上写了一个小小的「' + NALE + '」。\n文卡特看了半天，笑了。'); }
    await S.narr(f.ph === 'night' || f.ph === 'n2' ? '茶摊黑着。' : '文卡特的茶摊。铜壶里煮着加了姜的奶茶，玻璃杯一溜倒扣在木板上。\n棚顶上卷着一块蓝色的油布。');
  }
  /* 巷子里的门：按阶段分派 */
  function laneDoor(id) {
    return async S => {
      const f = S.f;
      if (f.ph === 'n1c' || f.ph === 'n1d') return n1Lane(S, id);
      if (id === 'dH') return homeDoorLane(S);
      if (f.ph === 'd2' || f.ph === 'd4' || f.ph === 'rain') {
        if (id === 'dM' && f.muniAway && f.ph === 'd2') return S.narr('穆尼大爷的门上挂着锁。屋里没人。');
        if (id === 'dL' && f.ph !== 'd2') return S.narr('纳拉辛哈家的门上还挂着锁。');
        return writeAt(S, id);
      }
      const e = S.ent(id), D = DOORS[id];
      await S.narr(D.name + (legible(e) ? '上写着「' + NALE + '」。' : '。') + (id === 'dL' ? '\n门上挂着一把大铁锁。纳拉辛哈一家回乡下吃喜酒了，下礼拜才回来。' : ''));
    };
  }
  async function homeDoorLane(S) {
    const f = S.f, e = S.ent('dH');
    if (f.ph === 'd2') {
      const opts = []; if (!legible(e)) opts.push('在门上写字'); opts.push('回屋，等天黑', '算了');
      const L = laneLeft(S);
      const k = opts[await S.ask(L.length ? '自家的门。（巷子里还有 ' + L.length + ' 户门上没字。）' : '自家的门。（该写的都写好了。）', opts)];
      if (k === '在门上写字') return writeAt(S, 'dH');
      if (k === '回屋，等天黑') {
        if (L.length && (await S.ask('还有 ' + L.length + ' 户没写好。真的回屋？', ['再看看', '回屋'])) === 0) return;
        return night2(S);
      }
      return;
    }
    if (f.ph === 'd3' || f.ph === 'd3go') return S.narr('自家的门。粉笔字还在。\n阿吉今天早上洒水的时候，特意绕开了门板。');
    if (f.ph === 'd4') {
      if (!safeAt(S, 'dM')) return S.narr('先给穆尼大爷的门写上字。');
      const k = await S.ask('天快黑了，乌云压得很低。回屋？', ['回屋', '再看看']);
      if (k === 0) return rainNight(S);
      return;
    }
    if (f.ph === 'rain') {
      const perm = id => { const e = S.ent(id); return e.s.ink === 'p' || e.s.ink === 'q' || (e.s.tarp && legible(e)); };
      const risk = [!(perm('pil') || (perm('dA') && perm('dB'))) && '吉塔家', !perm('dM') && '穆尼大爷家'].filter(Boolean);
      if (risk.length && !f.rainPassed && (await S.ask(risk.join('、') + '门上的字还在被雨冲。真的进屋？', ['再出去看看', '进屋'])) === 0) return;
      return rainHide(S);
    }
    await S.narr('自家的门。');
  }

  /* ================= 第二夜：她走过整条巷子 ================= */
  async function night2(S) {
    const f = S.f; f.ph = 'n2';
    await S.fade(1, 700);
    laneSet(S, 'night'); S.dark(.86, 'lane'); S.amb('night'); S.hidePlayer(true); S.pos(28, 6, 0);
    S.ent('stall').power = false;
    await S.card('第二夜', '', '巷子里家家户户都闩上了门。\n你趴在窗户后面，从木栅栏的缝里往外看。');
    S.place('nb', 0, 6, 2); S.ent('nb').alpha = 0; S.focus(2, 5);
    await S.fade(0, 700);
    jingleFar(S); await S.wait(500); jingleFar(S);
    await S.alpha('nb', 1, 900);
    await S.narr('巷口的老榕树底下，站着一个女人。\n红纱丽，盖头压得很低。她赤着脚，脚镯一步一响。');
    let first = true;
    const spd = hintLv > 0 ? 3.4 : 2.2;   // 失败重来过：她走得快些，少讲几句
    if (hintLv > 0) first = false;
    const stops = [['dA', 4], ['dB', 6], ['dM', 13], ['dL', 16], ['dR', 19]];
    for (const [id, x] of stops) {
      S.focus(x, 4); await S.walk('nb', [x, 3], spd); S.face('nb', 3); jingle(S, .02);
      if (x >= 16 && !S.ent('cow').s.up) { S.ent('cow').s.up = true; moo(S); await S.narr('趴在巷子当中的白牛站了起来，冲着她低低地叫了一声。'); }
      if (id === 'dL' || (id === 'dM' && S.ent('dM').locked)) {
        await S.narr(id === 'dL' ? '她在纳拉辛哈家门口停了一下。\n门上挂着锁。她没有敲，走了过去。' : '穆尼大爷的门上挂着锁。\n她歪着头看了一会儿，没有敲。');
        continue;
      }
      if (id === 'dR') knockM(S); else knockW(S, .07, 2);
      await S.say('门外', V.n2[id], { style: 'whisper' });
      if (!safeAt(S, id)) return n2Fail(S, id);
      if (first) { first = false; await S.narr('她凑近门上的字，歪着头，看了很久。'); }
      await S.say('门外', '……ನಾಳೆ。', { style: 'whisper' });
      if (id === 'dA') await S.narr('明天。\n她念完，转身走向下一家。');
    }
    S.focus(23, 4); await S.walk('nb', [23, 3], spd); S.face('nb', 3);
    knockW(S);
    if (!safeAt(S, 'dH')) return n2Fail(S, 'dH');
    if (!f.muniAway) { await S.say('门外', V.amma1, { style: 'whisper' }); await S.say('门外', '……ನಾಳೆ。', { style: 'whisper' }); return day3(S); }
    await S.say('门外', V.raju, { style: 'whisper' });
    await S.fade(1, 400);
    S.focus(null); S.hidePlayer(false); S.hide('nb');
    S.dark(.8, 'home'); S.plr(2.6); lampOn(S, false);
    S.hide('ajjiH'); S.ent('amat').full = 1; S.show('mmat'); S.place('muniH', 2, 5, 0);
    await S.go('home', 10, 8, 1, { fade: false });
    await S.fade(0, 500);
    await S.narr('席子上，穆尼大爷坐了起来。\n他的耳朵，这些年连打雷都听不清——可这一声，他听见了。');
    await S.say('穆尼大爷', '……拉朱？是拉朱！拉朱回来了！');
    f.ph = 'muni'; S.goal('拦住穆尼大爷——别让他开门！');
    S.cp('muni');
    startMuni(S);
  }
  async function n2Fail(S, id) {
    const who = DOORS[id].who;
    lastDeath = 'n2:' + id; hintLv++;
    await S.narr(id === 'dH' ? '她站在你家门前，一遍一遍地叫阿妈的声音。\n门上，一个字也没有。' : '她在门前站着，一遍一遍地叫。\n门上，一个字也没有。');
    await S.wait(500);
    if (S.ent(id).spr === 'idoor') S.ent(id).open = true;
    S.sfx('open');
    await S.narr(id === 'dH' ? '……天快亮的时候，阿吉再也受不了了。\n门闩「咔哒」响了一声。' : '……门闩「咔哒」响了一声。');
    await S.scare('face', { spr: '@nb', face: 'nb', dur: 1 });
    await S.die(who + '开了门。\n\n第二天早上，那扇门一直没有再打开。', '有人开了门');
  }
  function startMuni(S) { S.f.mw = { bolt: 0 }; S.ent('muniH').light = { r: 1.6, col: 'rgba(230,220,200,.1)' }; }
  async function muniOpen(S) {
    lastDeath = 'muni';
    S.ent('idoorIn').open = true; S.sfx('open');
    await S.narr('门闩拉开了。\n穆尼大爷张开胳膊：「拉朱——」');
    await S.scare('face', { spr: '@nb', face: 'nb', dur: 1 });
    await S.die('门外没有拉朱。\n只有一个低着头的女人，盖头底下，轻轻地笑。', '穆尼大爷开了门');
  }
  async function muniStopped(S) {
    const f = S.f; f.mw.done = true; S.goal(''); S.ent('muniH').light = null;
    S.face('muniH', 'pl');
    await S.narr('你一把抱住穆尼大爷的胳膊。');
    await S.say('穆尼大爷', ['放开！是拉朱！我儿子的声音，我还听不出来？', '拉朱——！']);
    S.show('ajjiH'); S.place('ajjiH', 9, 5, 1); S.ent('amat').full = 0;
    await S.say('阿吉', ['穆尼！', '拉朱在迪拜。他信上怎么说的？「夜里有人敲门，你先问是谁。」']);
    await S.say('门外', '阿爸——开门呀，阿爸——', { style: 'whisper' });
    await S.narr('穆尼大爷不挣了。他站在那儿，浑身发抖。');
    await S.wait(800);
    await S.say('门外', '……ನಾಳೆ。', { style: 'whisper' });
    jingle(S, .015); await S.wait(500); jingleFar(S);
    await S.narr('脚镯声，往成衣厂那头去了。');
    await S.say('穆尼大爷', ['……她念「明天」。', '拉朱也老是这么说。「阿爸，明年，明年我就回来。」']);
    await S.narr('穆尼大爷慢慢坐回席子上，用手背抹了一把脸。\n那一夜，谁也没有再睡着。');
    await S.fade(1, 1200);
    await day3(S);
  }

  /* ================= 第三天 → 成衣厂宿舍 ================= */
  async function day3(S) {
    const f = S.f; f.ph = 'd3';
    S.hide('muniH'); S.hide('mmat'); S.show('ajjiH'); S.place('ajjiH', 10, 4, 0); S.ent('amat').full = 0; S.ent('idoorIn').open = false;
    lampOn(S, true); S.dark(null, 'home'); S.plr(null);
    S.ent('dM').locked = false; laneSet(S, 'day3'); S.dark(null, 'lane'); S.amb('wind'); S.hidePlayer(false); S.focus(null);
    for (const id of LANE_OCC) if (S.ent(id).spr === 'idoor') S.ent(id).open = false;
    await S.go('lane', 22, 5, 3, { ms: 900 });
    await S.card('第三天', '', '巷子里的人见了你，都叫你「写字的小姑娘」。\n听说隔壁几条街，粉笔已经卖到五十派沙一根了。');
    await S.narr('巷子的泥地上，留着一串赤脚印，从巷口一直到成衣厂的铁门。\n……每一个脚印的脚尖，都朝着巷口。');
    S.ent('pco').s.ring = true; ring(S);
    await S.say('文卡特', '卡薇娅！电话！你阿妈从厂里打来的！');
    S.goal('接电话（茶摊旁边的公用电话）');
    S.cp('day3');
  }
  async function pcoUse(S) {
    const f = S.f, e = S.ent('pco');
    if (f.ph === 'd3' && e.s.ring) {
      e.s.ring = false;
      await S.say('阿妈（电话）', ['卡薇娅？是我。……你没事吧？阿吉呢？', '厂里宿舍的姑娘们吓坏了。昨天夜里，好几间屋都有人敲门。', '她们好多是从泰米尔那边、从乡下来的，不会写卡纳达字。宿管大妈也只认得几个。']);
      await S.say('阿妈（电话）', ['你下午能不能来一趟？帮她们在门上写字。', '宿舍七点锁大门。你就别回了，跟阿妈挤一晚上。']);
      f.ph = 'd3go'; S.ent('fgate').open = true;
      if (!chalkN(S)) { f.gotC1 = true; S.give('chalk1'); await S.say('文卡特', '粉笔用完了？文具店早卖光了……我这儿还有半截，记账用的，拿去。'); }
      return S.goal('去成衣厂宿舍（巷子东头的铁门）');
    }
    await S.narr('黄底黑字的牌子：「STD · ISD · PCO」。一部红色的电话，打一分钟一个卢比。');
  }
  async function fgateUse(S) {
    const f = S.f;
    if (f.ph === 'd3go') { S.sfx('open'); return S.go('dorm', 1, 4, 2); }
    await S.narr('成衣厂的铁门。换班的时候，女工们从这儿进进出出。\n门里头，是厂里的女工宿舍。');
  }
  async function dormEnter(S, first) {
    const f = S.f;
    if (!first) return;
    f.ph = 'dorm';
    S.dark(.42, 'dorm');
    await S.narr('成衣厂的女工宿舍是一排平房，围着一个小院子。\n墙是新刷的石灰，白得晃眼。晾衣绳上挂满了纱丽。');
    S.face('ammaD', 'pl');
    await S.say('阿妈', ['卡薇娅！', '就这六间。从大门那头数，一号到六号。阿妈住六号，最里头那间。']);
    S.face('selvi', 'pl');
    await S.say('塞尔维', ['小妹妹，我们村里也有这个说法——「நாளை வா」，naalai vaa，也是「明天来」。', '可我们不会写你们的字。她要是只认卡纳达字呢？']);
    await S.say('宿管大妈', '七点锁大门！七点以后，谁也不许进出！');
    S.goal('在 1–6 号六扇门边写字');
  }
  async function dormDoor(S, id) {
    const f = S.f, e = S.ent(id);
    if (f.ph === 'dorm') {
      if (!S.has('coal')) return writeAt(S, id);
      return;
    }
    if (f.ph === 'dark') {
      if (id === 'r6' && RD.every(k => S.ent(k).s.ink)) return room6(S);
      if (e.s.ink) return S.toast(id === 'r6' ? '还有门没写！阿妈在门里小声喊：「先写完！」' : DOORS[id].name + '边的字写好了');
      return writeAt(S, id);
    }
    await S.narr(DOORS[id].name + '。');
  }
  async function hearthUse(S) {
    const f = S.f;
    if (f.ph !== 'dorm') return S.narr(f.ph === 'dark' ? '灶膛里的炭火还红着一点。' : '宿舍的公用厨房。');
    if (!f.chalkFail) await S.say('阿妈', '粉笔写在白墙上可看不见。用炭！');
    S.give('coal');
    await S.narr('你从灶膛里掏出几根炭条，黑乎乎的，蹭了一手。');
    await cutPower(S);
  }
  async function cutPower(S) {
    const f = S.f;
    S.sfx('switch'); S.dark(.94, 'dorm'); S.plr(2.7);
    await S.narr('啪。\n整个宿舍的灯，一下子全灭了。');
    await S.narr('「停电了——！」\n姑娘们尖叫着，一窝蜂钻回屋里。门「砰、砰、砰」全关上了。');
    ['selvi', 'rani', 'warden', 'ammaD'].forEach(id => S.hide(id));
    S.sfx('locked'); await S.wait(300); S.sfx('locked'); jingleFar(S);
    await S.say('大门外', '阿妈——开门——我回来了——', { style: 'whisper' });
    await S.narr('大门外，铁链子哗啦啦地响。是宿管大妈女儿的声音。\n可宿管大妈的女儿，嫁到图姆库尔去了。');
    await S.think('（……她今晚来早了。六扇门，一个字都还没写。）');
    f.ph = 'dark';
    S.goal('她从大门一间间敲过来——抢在她前面，用炭写 1–6 号门');
    S.cp('dark');
    startDark(S);
  }
  function startDark(S) {
    const f = S.f;
    S.place('nb3', 0, 4, 2); S.hide('nb3');
    f.rt = true; f.g = { id: 'nb3', i: 0, wait: 5.5, spd: 1.25, kind: 'dorm', show: true };
  }
  async function dormOpened(S, id) {
    lastDeath = 'dorm'; S.f.rt = false;
    await S.narr('「……谁呀？」\n' + DOORS[id].name + '里，有个姑娘带着哭腔应了一声。\n门边的白墙上，一个字也没有。');
    S.ent(id).open = true; S.sfx('open');
    await S.scare('face', { spr: '@nb', face: 'nb', dur: 1 });
    await S.die('门开了。\n\n那一夜以后，宿舍里再也没有人提起那个房间。', '门开了');
  }
  async function room6(S) {
    const f = S.f; f.g.done = true; f.rt = false;
    S.sfx('open'); S.hidePlayer(true);
    await S.fade(1, 500);
    S.cp('room6');
    await room6Scene(S);
  }
  async function room6Scene(S) {
    const f = S.f;
    await S.narr('你钻进六号房。阿妈一把把你搂住，反手闩上了门。\n屋里黑得伸手不见五指。');
    if (lastDeath === 'r6') { lastDeath = null; await S.think('（门外那个，只会学人的声音。……别开门。拉住阿妈。）'); }
    jingle(S, .015); await S.wait(600); S.sfx('knock'); await S.wait(500);
    await S.narr('脚镯声，一间一间地近了。\n咚咚。……「ನಾಳೆ。」\n咚咚。……「ನಾಳೆ。」');
    jingle(S, .03); await S.wait(500);
    knockW(S, .06); await S.wait(1100);
    await S.say('门外', '阿妈，开门。是我，卡薇娅。我写完了……外面好黑。', { style: 'whisper' });
    await S.narr('是你的声音。');
    await S.say('阿妈', '……卡薇娅？', { style: 'whisper' });
    await S.narr('黑暗里，阿妈的手松开了。她摸索着往门口挪——\n这么黑，她看不见你就在她身边。');
    let said = false;
    for (;;) {
      const opts = ['一把拉住阿妈的手，不出声']; if (!said) opts.push('冲门外喊：「我在这儿！」'); opts.push('去开门');
      const k = opts[await S.ask('门外：「阿妈，开门。是我，卡薇娅。」', opts)];
      if (k === '冲门外喊：「我在这儿！」') {
        said = true;
        await S.say('你', '……我在这儿！');
        await S.wait(700);
        await S.say('门外', '……我在这儿。', { style: 'whisper' });
        await S.narr('你的声音，原原本本地，从门外传了回来。\n阿妈猛地停住了。');
        continue;
      }
      if (k === '去开门') return caught(S, 'r6', '你摸到了门闩——\n门开了一条缝。缝外面，一个和你一样高的影子，盖头底下，是你自己的脸。', '你开了门');
      break;
    }
    await S.narr('你在黑地里摸到阿妈的手，死死攥住。\n阿妈浑身一抖——然后也攥紧了你。');
    await S.wait(800);
    await S.say('门外', '……ನಾಳೆ。', { style: 'whisper' });
    jingle(S, .015); await S.wait(500); jingleFar(S);
    await S.narr('脚镯声，往厨房那头去了，再也没有回来。');
    await S.fade(1, 1200);
    await day4(S);
  }

  /* ================= 第四天 → 雨夜 ================= */
  async function day4(S) {
    const f = S.f; f.ph = 'd4'; f.rt = false;
    S.hidePlayer(false); S.focus(null); S.take('coal'); S.take('chalk1');
    laneSet(S, 'day4'); S.dark(null, 'lane'); S.amb('wind');
    await S.go('lane', 26, 4, 1, { ms: 900 });
    await S.card('第四天', '', '天亮的时候，来电了。\n你从宿舍回到巷子里，天边压着一层乌云，黑得发紫。\n收音机里说，今年的季风来得早。');
    thunder(S);
    await S.think('（要下雨了。……粉笔字，一沾水就没了。）');
    goal4(S);
    S.cp('day4');
  }
  function goal4(S) {
    const f = S.f; if (f.ph !== 'd4') return;
    if (!f.muni4) return S.goal('要变天了——先去看看穆尼大爷');
    if (!safeAt(S, 'dM')) return S.goal(S.has('chalkbox') || S.has('paint2') ? '给穆尼大爷的门写字（他今晚在家等电话）' : '给穆尼大爷的门写字——没粉笔了，问问文卡特和拉希姆');
    S.goal('天黑前回家——要下雨了');
  }
  async function rainNight(S) {
    const f = S.f;
    await S.fade(1, 800);
    laneSet(S, 'rain'); S.dark(.9, 'lane'); S.amb('night'); S.plr(3);
    f.ph = 'rain0';
    S.pos(23, 3, 3);
    await S.card('第四夜', '', '夜里十点。\n你刚要闩门——');
    await S.fade(0, 500);
    thunder(S); S.fx('flash'); S.shake(500, 2);
    S.ent('sky').s.rain = true; S.amb('rain');
    await S.say('阿吉（屋里）', '下雨了！门上的粉笔字——！');
    await S.narr('雨点砸下来，噼噼啪啪。\n巷子里，没遮没挡的粉笔字，一道一道往下淌。');
    await S.say('阿吉（屋里）', '屋檐底下的不碍事！没遮没挡的，用漆重写，或者拿东西遮上——快！');
    f.ph = 'rain';
    S.goal('雨在冲粉笔字！她来前：用漆重写或用油布（茶摊）遮住，再进屋');
    S.cp('rain');
    startRain(S);
  }
  function startRain(S) {
    const f = S.f;
    S.place('nb', 0, 6, 2); S.hide('nb');
    f.rt = true; f.watch = false; f.rainPassed = false;
    f.rain = { t: 0 };
    f.g = { id: 'nb', i: 0, wait: 9, spd: 1.25, kind: 'rain', show: true };
    for (const id of ['dA', 'pil', 'dB', 'dM', 'stall']) { const e = S.ent(id); if (e.s.ink === 'c' && !e.s.tarp) e.s.fade = 1; }
  }
  const FADE_T = { pil: 16, dA: 16, dB: 16, dM: 22, stall: 16 };   // 秒：冲到 30% 就认不出了（柱子约 11 秒，穆尼家约 15 秒）
  async function rainHide(S) {   // 躲进屋里，从门缝往外看
    const f = S.f;
    if (f.rainPassed) return rainGood(S);
    f.watch = true; S.hidePlayer(true); S.sfx('close');
    S.toast('你钻进屋里，从门缝往外看');
    while (f.watch && f.ph === 'rain') { const e = S.ent('nb'); if (e && !e.hidden) S.focus(tx(e), Math.max(4, ty(e))); else S.focus(8, 4); await S.wait(120); }
  }
  async function rainBad(S, id) {
    const f = S.f; f.rt = false; f.watch = false; lastDeath = 'rainBad';
    const e = S.ent('nb'); S.focus(tx(e), 4);
    await S.narr('雨水顺着门板往下淌。\n门上的字早就冲成了一道一道的白印子——谁也认不出那是什么字了。');
    await S.say('门外', id === 'dM' ? '阿爸……开门呀，是我，拉朱……' : '……开门哪……', { style: 'whisper' });
    if (S.ent(id).spr === 'idoor') S.ent(id).open = true;
    S.sfx('open');
    await S.narr(id === 'dM' ? '门开了。\n穆尼大爷站在门里，脸上全是笑：「拉朱……你回来啦……」' : '门开了一条缝。');
    await S.scare('face', { spr: '@nb', face: 'nb', dur: 1 });
    await S.fade(1, 1400);
    const text = id === 'dM'
      ? '第二天早上，雨停了。\n茶摊的电话响了很久，没有人去接。\n\n穆尼大爷家的门开着。屋里收拾得干干净净，像是出了远门。\n席子上，压着那封蓝色的航空邮简。\n\n巷子里的人都说，那天夜里，他们听见穆尼大爷在雨里笑，说：「拉朱，走慢点。」'
      : '第二天早上，雨停了。\n苏雷什家的门开着，门槛上的兰果丽被雨冲得一点不剩。\n\n那一年雨季结束以前，那两间屋子就空了。\n门上那根柱子，后来被人刷了三遍漆。';
    return S.end({ bad: true, id: 'rain', title: '雨夜', text });
  }
  async function rainGood(S) {
    const f = S.f; f.rt = false; f.watch = false; if (f.g) f.g.done = true;
    S.hidePlayer(true);
    S.focus(23, 4);
    if (!f.rainPassed) {
      await S.say('门外', '卡薇娅，开门，是阿妈。雨太大了，让阿妈进去……', { style: 'whisper' });
      await S.narr('屋檐底下，门上的粉笔字干干的，一笔都没花。');
      await S.say('门外', '……ನಾಳೆ。', { style: 'whisper' });
      jingle(S, .015); await S.wait(500); jingleFar(S);
      await S.narr('脚镯声顺着巷子，往成衣厂那头去了。\n雨，下了一整夜。');
    } else await S.narr('你钻进屋里，闩上门。\n脚镯声早已经远了。雨，下了一整夜。');
    await S.fade(1, 1200);
    await week(S);
  }

  /* ================= 一周以后 ================= */
  async function week(S) {
    const f = S.f; f.ph = 'd8'; f.rt = false;
    S.ent('sky').s.rain = false; S.hidePlayer(false); S.focus(null);
    laneSet(S, 'd8'); S.dark(null, 'lane'); S.amb('wind'); S.plr(null);
    for (const id of LANE_OCC) if (S.ent(id).spr === 'idoor') S.ent(id).open = false;
    await S.card('第五夜　第六夜　第七夜', '', '她每天夜里都来。\n挨家挨户，敲门，叫人，念一声「明天」，走了。\n\n巷子里，再也没有人开过门。\n\n第八天，她没有来。');
    await S.go('lane', 23, 4, 3, { ms: 900 });
    await S.narr('早上。阿妈从厂里回来了——那批出口的衬衫，总算赶完了。');
    S.face('ammaL', 'pl');
    await S.say('阿妈', ['报纸上说，城里的人都不怕了。好多人家都在擦门。', '咱家门上这字……红红白白的，邻居看着也不好。', '我去打盆水，擦了吧？']);
    S.goal('阿妈想擦掉门上的字——问问邻居，再回来和阿妈说');
    S.cp('d8');
  }
  async function choose8(S) {
    const f = S.f; S.face('ammaL', 'pl');
    if (!f.read2) { f.read2 = true; await S.say('阿妈', '你看，报纸上都这么说了。'); await S.note('paper2'); }
    const k = await S.ask('门上的「' + NALE + '」——', ['「阿妈，留着吧。」', '「……擦掉吧。」']);
    if (k === 1) return wiped(S);
    S.face('ajjiL', 'pl');
    await S.say('阿吉', ['留着。', '她念的是「明天」。明天，可还没过完呢。']);
    await S.narr('阿妈看了看阿吉，又看了看你。\n她把水盆放下了。');
    await S.fade(1, 1400);
    return S.end({ id: 'week', title: '第二十七夜　完', text: '那一年的雨季过去以后，「明天再来」的说法，渐渐没人提了。\n可这条巷子里，谁家也没有擦门。\n\n后来，卡薇娅当了小学老师。她教一年级的孩子写的第一个词，是「ನಾಳೆ」。\n明天。\n\n直到今天，城西的老房子门上，有时还能看见那两个褪了色的字。\n据说她每天夜里都来，念一声「明天」，就走了。\n明天再来。' + (f.mallige ? '\n\n每年雨季的头一夜，巷口榕树下的蛇石前，总会多一串新鲜的茉莉。\n没有人知道是谁放的。' : '') });
  }
  async function wiped(S) {
    lastDeath = 'wiped';
    await S.narr('你和阿妈打了一盆水，把门上的字擦得干干净净。\n阿吉站在一边，什么也没说。');
    S.ent('dH').s.ink = null;
    await S.fade(1, 1200);
    S.hide('ammaL'); S.hide('ajjiL'); laneSet(S, 'night'); S.dark(.9, 'lane'); S.amb('night'); S.pos(23, 4, 3); S.hidePlayer(true); S.focus(23, 4);
    await S.card('那天夜里', '', '');
    S.place('nb', 23, 3, 3);
    await S.fade(0, 600);
    jingle(S, .03); await S.wait(600);
    knockW(S, .08); await S.wait(1100);
    await S.say('门外', '……卡薇娅。', { style: 'whisper' });
    await S.say('门外', ['你写的。「ನಾಳೆ」。', '……今天，就是明天了。'], { style: 'whisper' });
    await S.scare('face', { spr: '@nb', face: 'nb', dur: 1.2 });
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'wiped', title: '明天', text: '门上已经没有字了。\n\n第二天早上，巷子里的人发现，你家的门开着。\n门槛上的兰果丽，被一双赤脚踩乱了——\n脚印的脚尖，朝着门外。' });
  }

  /* ================= 每帧：她沿着路线一家一家走（宿舍、雨夜） ================= */
  const ROUTE = {
    dorm: [{ x: 1, y: 3 }, { x: 4, y: 3, door: 'r1' }, { x: 7, y: 3, door: 'r2' }, { x: 10, y: 3, door: 'r3' }, { x: 13, y: 3, door: 'r4' }, { x: 16, y: 3, door: 'r5' }, { x: 19, y: 3, door: 'r6' }, { x: 22, y: 3, end: true }],
    rain: [{ x: 1, y: 5 }, { x: 4, y: 3, door: 'dA' }, { x: 6, y: 3, door: 'dB' }, { x: 13, y: 3, door: 'dM' }, { x: 16, y: 3, door: 'dL', skip: true }, { x: 19, y: 3, door: 'dR' }, { x: 23, y: 3, door: 'dH', last: true }, { x: 28, y: 4, end: true }]
  };
  function doorSafe(S, kind, id) { return kind === 'dorm' ? !!S.ent(id).s.ink : safeAt(S, id); }
  function drive(S, dt) {
    const f = S.f, g = f.g; if (!g || g.done || g.halt || W.endScreen) return;
    const e = S.ent(g.id); if (!e) return;
    const R = ROUTE[g.kind];
    if (g.show) {
      g.wait -= dt; if (g.wait > 0) return;
      if (Math.abs(tx(e) - W.pl.x) + Math.abs(ty(e) - W.pl.y) <= 4) { g.wait = .6; if (!g.near) { g.near = true; S.toast(g.kind === 'dorm' ? '大门外，铁链子在响……' : '巷口的榕树底下，有什么东西在动……'); } return; }   // 不刷在玩家身边
      g.show = false; S.show(g.id); e.alpha = 1; jingle(S, .02); S.toast(g.kind === 'dorm' ? '铁门「吱呀」一声，自己开了。脚镯声进了院子——' : '巷口的榕树底下，脚镯声响了——叮、叮'); return;
    }
    if (!W.pl.hidden) {
      const d = Math.abs(e.px - W.pl.px) + Math.abs(e.py - W.pl.py);
      if (d <= TS + 3) {
        if (g.grab) { g.halt = true; return force(S, s => caught(s, g.kind === 'dorm' ? 'dormC' : 'rainC')); }
        g.grab = 1; g.wait = Math.max(g.wait, 1.6);   // 第一次：辫子被揪住，挣脱
        const p = W.pl, ax = Math.sign(p.x - tx(e)) || (p.x < 12 ? 1 : -1), ay = Math.sign(p.y - ty(e));
        let nx = p.x, ny = p.y; for (let k = 0; k < 2; k++) { const cx = nx + (ay ? 0 : ax), cy = ny + ay; if (passable(curMap(), cx, cy, p)) { nx = cx; ny = cy; } }
        if (W.busy) interruptWait();
        S.pos(nx, ny); S.fx('flash'); S.shake(400, 3); S.sfx('scare'); heart(S);
        S.toast('一只冰凉的手揪住了你的辫子——你拼命挣脱了！别再让她碰到！');
        return;
      }
      if (d <= TS * 3.2) { if (!g.warn) { g.warn = true; S.toast('脚镯声就在身边——叮、叮！'); } }
      else if (d > TS * 4.5) g.warn = false;
      g.hb = (g.hb || 0) - dt; if (d < TS * 6 && g.hb <= 0) { g.hb = 1.1; heart(S); }
    }
    if (e.mv) return;
    if (g.wait > 0) {
      g.wait -= dt;
      if (g.wait <= 0 && g.pend) {
        const id = g.pend; g.pend = null; jingle(S, .015); S.ent(id).s.knock = false;
        S.toast('「……ನಾಳೆ。」她念了一声「明天」，走了');
        if (g.kind === 'rain' && id === 'dH' && W.pl.hidden) { g.done = true; return force(S, rainGood); }
      }
      return;
    }
    const st = R[g.i]; if (!st) { g.done = true; return; }
    const ex = tx(e), ey = ty(e);
    if (ex === st.x && ey === st.y) {
      g.i++;
      if (st.end) { g.done = true; S.hide(g.id); if (g.kind === 'rain') { f.rainPassed = true; S.toast('脚镯声往成衣厂那头去了——进屋吧'); S.goal('她走了——进屋（自家门）'); } else S.toast('脚镯声消失在厨房的黑暗里……'); return; }
      if (!st.door) return;
      S.face(g.id, 3);
      if (st.skip) { g.wait = .8; return; }
      if (st.door === 'dR') knockM(S); else knockW(S);
      S.ent(st.door).s.knock = true;
      const v = V[g.kind][st.door]; if (v && !W.pl.hidden) S.toast(v);
      if (!doorSafe(S, g.kind, st.door)) { g.halt = true; return force(S, s => g.kind === 'dorm' ? dormOpened(s, st.door) : rainBad(s, st.door)); }
      g.wait = W.pl.hidden ? 1.2 : 2.8; g.pend = st.door;
      return;
    }
    const d = bfsStep(curMap(), ex, ey, st.x, st.y, e); if (d < 0) { g.wait = .25; return; }
    startMove(e, d, W.pl.hidden ? 2.6 : g.spd);
    if ((g.stp = (g.stp || 0) + 1) % 2 === 0) { const dd = Math.abs(e.px - W.pl.px) + Math.abs(e.py - W.pl.py); jingle(S, .028 * Math.max(.15, 1 - dd / (TS * 12))); }
  }
  function rainTick(S, dt) {
    const f = S.f; if (f.ph !== 'rain' || !f.rain || W.endScreen) return;
    f.rain.t += dt;
    f.rain.th = (f.rain.th ?? 6) - dt;
    if (f.rain.th <= 0) { f.rain.th = 8 + Math.random() * 6; f.rain.fl = .35; thunder(S); S.dark(.45, 'lane'); }
    if (f.rain.fl > 0) { f.rain.fl -= dt; if (f.rain.fl <= 0) S.dark(.9, 'lane'); }
    for (const id in FADE_T) {
      const e = S.ent(id); if (!e || e.s.ink !== 'c' || e.s.tarp || e.s.fade == null) continue;
      const v = Math.max(0, Math.round((1 - f.rain.t / FADE_T[id]) * 20) / 20);
      if (v !== e.s.fade) { e.s.fade = v; if (v === .5 && DOORS[id].occ !== false) S.toast(DOORS[id].name + '上的粉笔字，快被冲没了！'); if (v === .3 && id === 'pil') S.toast('柱子上的字冲没了'); }
    }
    drive(S, dt);
  }
  function muniTick(S, dt) {
    const f = S.f; if (f.ph !== 'muni' || !f.mw || f.mw.done || W.endScreen) return;
    const e = S.ent('muniH'); if (e.mv) return;
    const ex = tx(e), ey = ty(e), p = S.pl;
    if (ex === 7 && ey === 8) {
      if (!f.mw.warn) { f.mw.warn = true; S.toast('穆尼大爷摸到了门闩——'); S.sfx('switch'); }
      f.mw.bolt += dt; if (f.mw.bolt > 1.1) { f.mw.done = true; force(S, muniOpen); }
      return;
    }
    if (p.x === 7 && p.y === 8 && Math.abs(ex - 7) + Math.abs(ey - 8) === 1) { f.mw.done = true; return force(S, muniStopped); }
    const d = bfsStep(curMap(), ex, ey, 7, 8, e);
    if (d < 0) { f.mw.blk = (f.mw.blk || 0) + dt; if (f.mw.blk > .6) { f.mw.done = true; force(S, muniStopped); } return; }
    startMove(e, d, 1.7); caneTap(S);
    if (Math.abs(ex - 7) + Math.abs(ey - 8) === 3) S.toast('拐杖笃、笃地往门口去了——');
  }

  /* ================= 地图 ================= */
  function laneRows() {
    const r = [];
    r.push('TTT' + 'Y'.repeat(27));
    r.push('TTT' + 'F'.repeat(27));
    r.push('TTT' + 'F'.repeat(27));
    for (let y = 3; y <= 6; y++) { let s = ''; for (let x = 0; x < 30; x++) s += (y === 4 || y === 5) && hash(x, y, 3) < .7 ? ',' : '.'; r.push(s); }
    r.push('N'.repeat(30));
    r.push('H'.repeat(30));
    r.push('T'.repeat(30));
    return r;
  }
  function homeRows() {
    return ['##############', '##############', '#OOOOOOOOOOOO#', '#OOOOOOOOOOOO#', '#OOOOOOOOOOOO#', '#OOOOOOOOOOOO#', '#OOOOOOOOOOOO#', '#OOOOOOOOOOOO#', '#OOOOOOOOOOOO#', '##############'];
  }
  function dormRows() {
    const r = ['Q'.repeat(26), 'V'.repeat(26), 'V'.repeat(26)];
    r.push('x'.repeat(25) + 'V'); r.push('x'.repeat(25) + 'V');
    for (let y = 5; y <= 9; y++) r.push('#' + 'd'.repeat(24) + '#');
    r.push('#'.repeat(26)); r.push('#'.repeat(26));
    return r;
  }
  function lampOn(S, on) { const e = S.ent('klamp'); e.off = !on; e.light = on ? { r: 3.6, col: 'rgba(255,190,110,.22)', flick: true } : null; }
  const LD = laneDoor;

  function MAPS() {
    return {
      home: {
        amb: 'night', dark: .55, plr: 3, floor: 'wood', wall: 'plain', wallC: { face: '#c8b07a', trim: '#7a5a3a' }, legend: { O: 'oxide' },
        rows: homeRows(),
        ents: [
          { id: 'cal', x: 3, y: 1, spr: 'cal', on: N('墙上挂着神像挂历。这个月十五号被阿妈用红笔圈了一下：「发工钱」。') },
          { id: 'puja', x: 6, y: 1, spr: 'puja', light: { r: 2.2, col: 'rgba(255,200,90,.16)', flick: true }, on: N('墙上的小神龛供着象头神的画像，铜油灯里的灯芯快烧完了。\n阿吉每天早晚都在这儿点灯。') },
          { id: 'stoveI', x: 1, y: 2, spr: 'stoveI', on: N('煤油炉上坐着一口锅，锅里还剩半锅米饭和一点萨姆巴汤。') },
          { id: 'kodam', x: 2, y: 2, spr: 'kodam', on: N('一只铜水罐、一只钢水罐。早上从巷口的公用水管接来的。') },
          { id: 'radio', x: 11, y: 2, spr: 'radio', on: S => S.narr(S.f.ph === 'd4' ? '收音机里说：今年的季风来得早。' : '收音机。停电了，什么也听不见。') },
          { id: 'trunk', x: 12, y: 2, spr: 'trunk', on: N('铁皮箱子，装着阿妈的嫁妆纱丽。阿妈说，等你出嫁那天给你。') },
          { id: 'klamp', x: 8, y: 3, spr: 'klamp', light: { r: 3.6, col: 'rgba(255,190,110,.22)', flick: true }, on: N('煤油马灯。玻璃罩被熏黑了一圈。\n这个月已经停了十几回电了。') },
          { id: 'amat', x: 9, y: 4, w: 2, spr: 'mat', col: '#8a6a9a', solid: false, decal: true, on: N('阿吉的席子，枕头边放着一串念珠。') },
          { id: 'ajjiH', x: 10, y: 4, spr: '@ajji', dir: 0, on: ajjiHome },
          { id: 'kmat', x: 4, y: 6, w: 2, spr: 'mat', solid: false, decal: true, on: n1Sleep },
          { id: 'mmat', x: 1, y: 5, w: 2, spr: 'mat', col: '#c8c0b0', full: 2, solid: false, decal: true, hidden: true, on: N('给穆尼大爷铺的席子。') },
          { id: 'muniH', x: 2, y: 5, spr: '@muni', dir: 0, hidden: true, on: async S => { if (S.f.ph === 'muni' && S.f.mw && !S.f.mw.done) return muniStopped(S); await S.say('穆尼大爷', '……'); } },
          { id: 'bag', x: 12, y: 6, spr: 'bag', on: bagUse },
          { id: 'idoorIn', x: 7, y: 9, spr: 'idoorIn', on: homeDoorIn },
          { id: 'iwin', x: 10, y: 9, spr: 'iwin', on: S => S.narr(S.f.ph === 'muni' ? '窗栅栏外面黑漆漆的。门外那个声音还在叫。' : '朝着巷子的木栅栏窗。从这儿能看见对面的拉希姆裁缝铺。') }
        ],
        enter: homeEnter,
        tick: muniTick
      },
      lane: {
        get rain() { try { const e = W.maps.lane.ents.find(z => z.id === 'sky'); return !!(e && e.s.rain); } catch (err) { return false; } },
        get amb() { try { return ['d2m', 'd2', 'd3', 'd3go', 'd4', 'd8'].includes(W.f.ph) ? 'market' : 'night'; } catch (err) { return 'night'; } },
        dark: .16, plr: 3.4, floor: 'dirt', floor2: 'concrete', wall: 'plain',
        legend: { Y: 'laneR', F: 'laneF', N: 'nala', H: 'hedgeW' }, tileOpts: { treeC: '#1e3a1e', grassC: '#2a4a24' },
        rows: laneRows(),
        ents: [
          { id: 'sky', x: 0, y: 9, s: { rain: false } },
          { id: 'banyan', x: 0, y: 3, w: 2, h: 2, spr: 'banyan', on: S => S.narr(S.f.ph === 'rain' || S.f.ph === 'n2' ? '老榕树的气根在雨里、风里轻轻地晃。' : '巷口的老榕树，比这条巷子还老。\n树干上缠着红线黄线。老人说，夜里别在树底下坐太久。') },
          { id: 'naga', x: 2, y: 3, spr: 'naga', on: nagaUse },
          { id: 'dA', x: 4, y: 2, spr: 'idoor', col: '#3a6a8a', toran: true, on: LD('dA') },
          { id: 'pil', x: 5, y: 2, spr: 'pillar', on: LD('pil') },
          { id: 'dB', x: 6, y: 2, spr: 'idoor', col: '#3a6a8a', toran: true, on: LD('dB') },
          { id: 'stall', x: 8, y: 2, w: 2, spr: 'stallT', light: { r: 2.4, col: 'rgba(255,200,120,.14)', dx: 16 }, on: stallUse },
          { id: 'pco', x: 10, y: 2, spr: 'pco', on: pcoUse },
          { id: 'tulasi', x: 12, y: 3, spr: 'tulasi', on: N('穆尼大爷门口的图拉西（圣罗勒）花台，抹着姜黄和朱砂。\n他老伴在世的时候，每天早上都绕着它走三圈。') },
          { id: 'dM', x: 13, y: 2, spr: 'idoor', col: '#6a4428', on: LD('dM') },
          { id: 'dL', x: 16, y: 2, spr: 'idoor', col: '#4a6a3a', locked: true, on: LD('dL') },
          { id: 'rsign', x: 19, y: 1, w: 2, spr: 'rsign', solid: false, decal: true },
          { id: 'dR', x: 19, y: 2, w: 2, spr: 'shutter', on: LD('dR') },
          { id: 'cycle', x: 21, y: 3, spr: 'cycle', on: N('拉希姆大叔的自行车，后座绑着一卷布料。') },
          { id: 'dH', x: 23, y: 2, spr: 'idoor', col: '#7a3a22', toran: true, eave: true, on: LD('dH') },
          { id: 'rangoli', x: 23, y: 3, spr: 'rangoli', solid: false, decal: true },
          { id: 'hwin', x: 24, y: 2, spr: 'win', on: N('自家的木栅栏窗。窗台上晒着阿吉的老花镜。') },
          { id: 'mallige', x: 24, y: 3, spr: 'mallige', solid: false, hidden: true, on: async S => { S.hide('mallige'); S.give('mallige'); await S.narr('台阶边上放着一串茉莉，已经蔫了，还是很香。\n巷子里，没有人种茉莉。'); await S.think('（阿吉说，她是个新娘，头上还戴着茉莉……）'); } },
          { id: 'fgate', x: 27, y: 2, w: 2, spr: 'fgate', on: fgateUse },
          { id: 'lamp1', x: 7, y: 7, spr: 'streetlamp', solid: false, light: { r: 3, col: 'rgba(255,220,150,.12)' }, on: N('路灯杆上贴满了寻人启事和电影海报。') },
          { id: 'lamp2', x: 15, y: 7, spr: 'streetlamp', solid: false, flicker: true, light: { r: 3, flick: true, col: 'rgba(255,220,150,.12)' }, on: N('这盏路灯一闪一闪的，报修了三个月也没人来。') },
          { id: 'lamp3', x: 25, y: 7, spr: 'streetlamp', solid: false, light: { r: 3, col: 'rgba(255,220,150,.12)' }, on: N('路灯底下，几只飞蛾在打转。') },
          { id: 'cow', x: 17, y: 6, spr: 'cow', on: S => S.narr(S.ent('cow').s.up ? '白牛站着，一动不动地盯着巷口。' : '一头白牛趴在巷子当中嚼草，角涂得一只蓝一只红。\n谁家的？没人知道。它每天都在这儿。') },
          { id: 'geetha', x: 5, y: 4, spr: '@geetha', hidden: true, on: geethaTalk },
          { id: 'venkat', x: 9, y: 4, spr: '@venkat', hidden: true, on: venkatTalk },
          { id: 'muniL', x: 14, y: 4, spr: '@muni', hidden: true, on: muniTalk },
          { id: 'rahim', x: 18, y: 4, spr: '@rahim', hidden: true, on: rahimTalk },
          { id: 'ajjiL', x: 22, y: 4, spr: '@ajji', hidden: true, on: ajjiLane },
          { id: 'ammaL', x: 24, y: 4, spr: '@amma', hidden: true, on: S => S.f.ph === 'd8' ? choose8(S) : S.say('阿妈', '……') },
          ...[[3, 5], [8, 5], [12, 4], [17, 4], [22, 5]].map(([x, y], i) => ({ id: 'pr' + (i + 1), x, y, spr: 'rprint', solid: false, decal: true, hidden: true, on: N('一串赤脚印，踩在昨夜的泥地上。\n脚尖朝着巷口，脚后跟朝着成衣厂——像是有人倒着走过了整条巷子。\n……或者，她的脚是反着长的。') })),
          { id: 'nb', x: 0, y: 6, spr: '@nb', hidden: true, solid: false, light: { r: 1.3, col: 'rgba(200,210,200,.08)' } }
        ],
        enter: laneEnter,
        tick: rainTick
      },
      dorm: {
        amb: 'night', dark: .42, plr: 3, floor: 'dirt', wall: 'plain', wallC: { face: '#e8e4d8', top: '#2a2a2a', trim: '#a8a498' }, legend: { Q: 'roofD', V: 'lime' },
        rows: dormRows(),
        ents: [
          { id: 'dgate', x: 0, y: 3, h: 2, spr: 'dgate', on: S => S.narr(S.f.ph === 'dark' ? '大门外黑漆漆的。铁链子还在晃。' : '宿舍的铁大门。宿管大妈七点准时锁门。') },
          { id: 'dboard', x: 2, y: 2, spr: 'dboard', on: N('宿舍告示：\n一、晚七点锁大门。\n二、停电时不许点蜡烛，不许出屋。\n三、不许留宿外人。\n\n底下贴着一张纸条，用泰米尔文、泰卢固文，还有歪歪扭扭的卡纳达文写着同一句话：\n「谁会写那两个字？」') },
          { id: 'r1', x: 4, y: 2, spr: 'ddoor', num: 1, on: S => dormDoor(S, 'r1') },
          { id: 'r2', x: 7, y: 2, spr: 'ddoor', num: 2, on: S => dormDoor(S, 'r2') },
          { id: 'r3', x: 10, y: 2, spr: 'ddoor', num: 3, on: S => dormDoor(S, 'r3') },
          { id: 'r4', x: 13, y: 2, spr: 'ddoor', num: 4, on: S => dormDoor(S, 'r4') },
          { id: 'r5', x: 16, y: 2, spr: 'ddoor', num: 5, on: S => dormDoor(S, 'r5') },
          { id: 'r6', x: 19, y: 2, spr: 'ddoor', num: 6, on: S => dormDoor(S, 'r6') },
          { id: 'hearth', x: 22, y: 2, w: 2, spr: 'hearth', light: { r: 1.8, col: 'rgba(255,120,40,.2)', flick: true, dx: 8 }, on: hearthUse },
          { id: 'line', x: 3, y: 6, w: 5, spr: 'line', solid: false, on: N('晾衣绳上挂满了纱丽：姜黄的、靛蓝的、玫红的。\n最边上那条，是阿妈的。') },
          { id: 'tap', x: 8, y: 8, spr: 'tap', water: true, on: N('院子里的公用水龙头，关不严，一直滴答滴答。') },
          { id: 'tank', x: 12, y: 7, w: 2, spr: 'tank', on: N('黑色的塑料水塔。夏天晒一下午，洗澡水都是烫的。') },
          { id: 'cycleD', x: 20, y: 8, spr: 'cycle', on: N('不知道谁的自行车，车筐里放着一包没吃完的饼干。') },
          { id: 'warden', x: 2, y: 5, spr: '@warden', dir: 2, on: S => S.say('宿管大妈', S.f.ph === 'dorm' ? ['七点锁大门！', '……小姑娘，那几个字，你可得写清楚了。'] : '……') },
          { id: 'selvi', x: 5, y: 5, spr: '@selvi', dir: 3, on: S => S.say('塞尔维', ['我们村里的老人说，她会叫你妈妈的声音。', '我妈妈在坦贾武尔。我已经两年没回家了。']) },
          { id: 'rani', x: 9, y: 5, spr: '@rani', dir: 3, on: S => S.say('拉妮', ['我住二号。我们屋四个人，就我认得几个英文字母。', '……写英文的「COME TOMORROW」，她看得懂吗？']) },
          { id: 'ammaD', x: 18, y: 4, spr: '@amma', dir: 1, on: S => S.say('阿妈', S.f.chalkFail ? '粉笔写在白墙上看不见的——厨房灶膛里有炭！' : ['从一号写起，一间都别落下。', '写完了就进阿妈屋里来。']) },
          { id: 'nb3', x: 0, y: 4, spr: '@nb', hidden: true, solid: false, light: { r: 2, col: 'rgba(190,215,200,.14)' } }
        ],
        enter: dormEnter,
        tick(S, dt) { if (S.f.ph === 'dark') drive(S, dt); }
      }
    };
  }
  async function nagaUse(S) {
    const f = S.f, e = S.ent('naga');
    if (S.has('mallige') && !f.mallige) {
      const k = await S.ask('榕树下的蛇石，抹着姜黄和朱砂。', ['把那串茉莉放在蛇石前', '算了']);
      if (k === 0) { S.take('mallige'); f.mallige = true; e.s.flower = true; await S.narr('你把那串茉莉轻轻放在蛇石前面。\n风停了一下。榕树上，好像有谁叹了一口气。'); return; }
      return;
    }
    await S.narr(e.s.flower ? '蛇石前放着那串茉莉。' : '榕树底下供着两块蛇石，抹着姜黄和朱砂。巷子里的女人每礼拜二来上供。');
  }

  const LEGEND = '「ನಾಳೆ ಬಾ」（Nale Ba，卡纳达语「明天再来」）是 1990 年代在印度南部城市班加罗尔流传的都市传说。说法大致是：深夜有一个女人挨家挨户敲门，用屋里人亲人的声音叫门；开了门的人，据说不出一天就会死去，也有说是被她带走。破解的办法同样简单：在门上写下「ನಾಳೆ ಬಾ」，她看见了，就会离开，第二天再来——然后又读到同一句话。一时间，城里不少人家的门上、墙上都出现了用粉笔或红漆写的这两个词。\n\n她是谁，说法不一：有人说是一个含冤而死的新娘，夜里出来找她的丈夫；有人说是女巫；也有人把她和北印度传说里脚掌反长的女鬼混在一起。类似的传言后来也在印度其他地方出现过。2018 年的印地语电影《Stree》借用了这个传说，片中人们在墙上写的是印地语「O Stree, kal aana」（女人啊，明天再来）。\n\n当时的报纸报道和口耳相传让传言迅速扩散，几个星期到几个月后又渐渐平息，但门上的字迹在不少老房子上留了很多年。评论者多把它看作一次典型的群体性恐慌：在城市迅速扩张、人口大量迁入的年代，一个有明确规矩、照做就能「安全」的故事，比说不清的不安更容易被人接受和传播。查无实据：没有任何可靠记录证明有人因此死亡。\n\n游戏虚构：卡薇娅一家、穆尼大爷和他在迪拜打工的儿子、拉希姆大叔、巷子里的各户人家和成衣厂宿舍；「门外挂锁她就不停」「两扇门中间的柱子写一次两家都算」「粉笔怕雨、在油漆铁皮上写不上」「写成『今天来』等于请她进门」这些规矩；两份报纸的具体内容；以及擦掉门上的字那一夜，都是本章为游戏编写的。';

  defChapter({
    id: 'naleba', n: 27, title: '明天再来', sub: '在门上写「明天再来」。她读了，就走。', origin: '印度班加罗尔都市传说', color: '#5a2418',
    amb: 'night', floor: 'dirt', wall: 'plain', dark: .3, plr: 3.2,
    people: PEOPLE, items: ITEMS, notes: NOTES, faces: FACES, sprites: SPRITES, tiles: TILES,
    endings: { week: '第二十七夜　完', rain: '雨夜', wiped: '明天' },
    legend: LEGEND,
    start: { map: 'home', x: 7, y: 6, dir: 3 },
    async intro(S) { await S.card('第二十七夜　明天再来', '1990年代　印度　班加罗尔城西', '那一年，城西的巷子里开始传一句话。\n\n夜里有人敲门，用你家里人的声音叫你——\n别应，别开门。\n\n在门上写两个字：ನಾಳೆ ಬಾ（Nale Ba）。\n明天再来。'); },
    thumb(g, w, h) {   // 一扇蓝色木门，门上红漆写着「ನಾಳೆ ಬಾ」；门边站着低头的红纱丽女人
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const by = h - 22;
      R(0, 0, w, by, '#1a1012');
      R(30, 6, 64, by - 6, '#7a6a4a'); R(32, 8, 60, by - 8, '#d89a4a');
      R(40, 12, 44, by - 12, '#2a1a10'); R(42, 14, 40, by - 14, '#3a6a8a'); R(61, 14, 2, by - 14, '#24485e');
      for (let i = 0; i < 8; i++) R(42 + i * 5, 12, 3, 4 + (i % 2) * 2, '#3a7a2a');
      g.strokeStyle = '#d0202a'; g.lineWidth = 2; g.lineCap = 'round';
      const arc = (x, y, r, a0, a1) => { g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); };
      const ln = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
      arc(50, 32, 4, Math.PI * .1, Math.PI * 1.9); ln(54, 30, 57, 36); ln(47, 26, 51, 25);   // ನಾ
      arc(64, 32, 4, 0, Math.PI * 2); ln(68, 32, 70, 38); ln(61, 26, 65, 25);               // ಳೆ
      arc(55, 48, 4, Math.PI, Math.PI * 2.8); ln(60, 46, 63, 52); ln(52, 42, 56, 41);       // ಬಾ
      for (let i = 0; i < 4; i++) R(47 + i * 6, 54 + (i % 2) * 3, 1, 5, 'rgba(200,30,40,.7)');
      R(40, by - 2, 44, 2, '#d8b030'); for (let i = 0; i < 6; i++) R(43 + i * 7, by - 2, 2, 2, '#c82020');
      const x0 = 104, y0 = 10;
      R(x0 + 2, y0, 22, 60, '#7a1a22'); R(x0, y0 + 4, 26, 4, '#7a1a22'); R(x0 + 2, y0, 22, 2, '#c8a040'); R(x0 + 1, y0 + 4, 2, 56, '#c8a040'); R(x0 + 23, y0 + 4, 2, 56, '#c8a040');
      R(x0 + 6, y0 + 4, 14, 26, '#070606'); R(x0 + 9, y0 + 14, 8, 10, '#cfcac0'); R(x0 + 6, y0 + 4, 4, 22, '#070606'); R(x0 + 16, y0 + 4, 4, 22, '#070606');
      R(x0 + 12, y0 + 3, 2, 3, '#c81e28'); for (let i = 0; i < 4; i++) R(x0 + 4 + i * 5, y0 + 2 + (i % 2), 2, 2, '#f2f0e6');
      R(x0 + 12, y0 + 22, 3, 2, '#c8a040');
      R(x0 - 4, y0 + 32, 6, 4, '#cfcac0'); R(x0 - 4, y0 + 30, 6, 2, '#c81e28');   // 伸向门板的手和红手镯
      R(x0 + 6, by - 4, 5, 4, '#cfcac0'); R(x0 + 15, by - 4, 5, 4, '#cfcac0'); R(x0 + 6, by - 2, 5, 1, '#d8b040'); R(x0 + 15, by - 2, 5, 1, '#d8b040');
    },
    resume: {
      n1: async S => { await n1Knock(S); },
      day2: async S => { await d2Resume(S); },
      muni: async S => {
        if (lastDeath === 'muni') { lastDeath = null; await S.think('（挡在门口——或者一把拉住他。）'); }
        S.toast('门外：「' + V.raju + '」'); startMuni(S);
      },
      day3: async S => { ring(S); },
      dark: async S => {
        if (lastDeath === 'dorm' || lastDeath === 'dormC') { lastDeath = null; await S.think('（她从大门那头一间一间敲过来。先跑去离大门最近的 1 号，再一间间往回写——别和她撞上。）'); }
        startDark(S);
      },
      room6: async S => { await room6Scene(S); },
      day4: async S => { goal4(S); },
      rain: async S => {
        if (lastDeath === 'rainC' || lastDeath === 'rainBad') { lastDeath = null; await S.think('（她先到吉塔家，再到穆尼大爷家。柱子上的字冲得最快——先管那儿。油布在茶摊，漆在手里。）'); }
        startRain(S);
      },
      d8: async S => { if (lastDeath === 'wiped') { lastDeath = null; await S.think('（她念的是「明天」。……字擦掉了，明天就到了。）'); } }
    },
    maps: MAPS()
  });
})();
