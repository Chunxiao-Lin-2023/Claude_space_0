/* ================= 第一夜 · 亲爱的大卫 ================= */
(() => {
  /* 核心玩法：问题配额。梦里每晚只能对大卫问两个问题，问题从线索里来；不叫「亲爱的大卫」不回答，但也算一个；问第三个就完了。
     第一夜：问出他是谁、在等什么 → 白天：对门的贝丝讲出露丝与暗号歌、露丝的箱子（信 + 被水泡过的歌词）
     第二夜：梦里的仓库（危险段：梦里跑不起来，跟着煤球的绿眼睛走）→ 问对两个问题：缺的两个音 + 红绳钥匙
     → 走出梦里的5C，在楼梯上哼暗号（密码盘），用大卫的钥匙开门：露丝回家了。
     双人：一人在「笺」里看推特串、露丝的信和歌词，一人选问题、按音符。 */
  const TUNE = '356531';                       // 小 大 卫，别 睡 着 —— 纸上缺第 3、5 格
  const TUNEHINT = '第三个音比第二个高一格，第五个音和第一个一样';
  const JP = { 1: 262, 2: 294, 3: 330, 4: 349, 5: 392, 6: 440, 7: 494 };
  const WS = { style: 'whisper' };
  let DIED = 0;                                // 本局在仓库被抓住（死）几次（只影响重来时的提示和惊吓种类）
  let THIRD = 0;                               // 本局问过几次第三个问题（重来时给一句规则小结）
  const bx = (R, x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };

  /* ---------- 合成音 ---------- */
  function hum(S, seq, t0 = 0, gap = .52, vol = .15) {   // 哼唱：柔和的正弦，带一点泛音
    [...seq].forEach((n, i) => { const f = JP[n], t = t0 + i * gap; S.tone('sine', f, f * .992, gap * .92, vol, t, 1500); S.tone('triangle', f * 2, f * 2, gap * .45, vol * .1, t, 1800); });
  }
  function meow(S, v = .1, t = 0) { S.tone('triangle', 560, 830, .12, v, t, 2600); S.tone('triangle', 830, 470, .28, v, t + .12, 2200); }
  function creak(S, n = 2, t0 = 0, v = .045) { for (let i = 0; i < n; i++) S.tone('sawtooth', 150, 104, .28, v, t0 + i * 1.15, 520); }
  function drag(S, n = 1, gap = .7, v = .26) { for (let i = 0; i < n; i++) { S.tone('sine', 88, 52, .2, v, i * gap, 0); S.tone('triangle', 240, 140, .34, v * .12, i * gap + .06, 420); } }
  function buzz(S) { for (let i = 0; i < 3; i++) S.tone('sawtooth', 120, 120, .35, .012, i * .5, 900); }   // 走廊灯管
  function purr(S, t0 = 0) { for (let i = 0; i < 10; i++) S.tone('triangle', 58, 48, .08, .07, t0 + i * .1, 260); }   // 猫打呼噜
  function chime(S, n = 3) { for (let i = 0; i < n; i++) { S.tone('sine', 523, 518, 1.5, .07, i * 1.0, 0); S.tone('sine', 1046, 1040, .5, .015, i * 1.0, 0); } }   // 隔壁贝丝家的老座钟
  const dav = (S, t, o) => { S.tone('sine', 920, 860, .25, .018, 0, 0); return S.say('大卫', t, o || WS); };

  /* ---------- 问题库 ---------- */
  const QS = {
    who: { q: '「亲爱的大卫，你是谁？」', set: 'kChair', a: ['大卫。……这是我家。', '你睡在我的床上。', '角落那把椅子，是妈妈的。'] },
    die: { q: '「亲爱的大卫，你是怎么死的？」', set: 'kStool', a: ['（他抬起一只手，摸了摸头上瘪下去的那一块。）', '门上的小洞太高了。我踩着小板凳，踮起脚……', '板凳晃了一下。然后我就一直很困。'] },
    want: { q: '「亲爱的大卫，你想要什么？」', set: 'kWait', a: ['等妈妈。', '妈妈说，十二点就回来。……十二点。'] },
    np1: { q: '「你为什么还不走？」', np: true },
    np2: { q: '「大卫，你几岁了？」', np: true },
    where: { q: '「亲爱的大卫，你妈妈现在在哪儿？」', a: ['在上班。', '……她说十二点。现在几点了？'] },
    songNP: { q: '「妈妈上楼的时候，哼的是什么调子？」', np: true, need: f => f.kHum },
    key: { q: '「亲爱的大卫，你脖子上那把钥匙，藏在哪儿了？」', set: 'gotKey', need: f => f.kKey, a: ['（他低头摸了摸脖子。那里只剩一截断掉的红绳。）', '藏起来了。妈妈说，钥匙千万别弄丢。', '在门口的暖气片后面。……嘘。别告诉别人。'] },
    song: { q: '「亲爱的大卫，妈妈上楼的时候，哼的是什么调子？」', set: 'gotSong', need: f => f.kHum },
    keyNP: { q: '「大卫，你的钥匙呢？」', np: true, need: f => f.kKey },
    mkey: { q: '「亲爱的大卫，妈妈的钥匙在哪儿？」', need: f => f.kKey, a: ['妈妈的钥匙，在妈妈那儿。', '妈妈有钥匙。妈妈自己会开门。……她怎么还不开？'] },
    why: { q: '「亲爱的大卫，你为什么要吓走他？」', a: ['他把妈妈的椅子从下面搬上来了。', '我以为……椅子回来了，妈妈也会回来。', '他一直不睡觉。我想问他，妈妈去哪儿了。'] }
  };
  const QN1 = ['who', 'die', 'want', 'np1', 'np2'];
  const QN2 = ['where', 'songNP', 'mkey', 'key', 'die', 'song', 'keyNP', 'why'];

  /* ---------- 惊吓大头像（32×32）：头的一边瘪下去一块，眼睛的地方是两个黑洞 ---------- */
  const FACES = {
    david(R, a) {
      const SK = '#c9cdc2', SK2 = '#a6ab9c', SK3 = '#787c6e', BR = '#6a4c5c', HO = '#030303', HR = '#2e261e', V = '#0a090c';
      R(3, 26, 26, 6, '#5e6e8e'); for (const y of [27, 30]) R(3, y, 26, 1, '#93a3c3'); R(12, 25, 8, 2, '#e4e4dc'); R(13, 22, 6, 4, SK2);
      R(9, 3, 15, 2, SK); R(7, 5, 19, 3, SK); R(6, 8, 21, 12, SK); R(7, 20, 19, 2, SK); R(9, 22, 15, 2, SK);
      R(23, 6, 3, 15, SK2); R(21, 21, 3, 2, SK2);
      R(6, 4, 7, 4, V); R(6, 8, 3, 4, V); R(9, 3, 2, 1, V);               // 左上角整块塌进去
      R(12, 4, 1, 4, SK3); R(11, 8, 1, 1, SK3); R(9, 8, 2, 1, SK3); R(9, 9, 1, 4, SK3); R(6, 12, 3, 1, SK3);   // 凹坑的内沿
      R(13, 5, 2, 3, BR); R(10, 9, 2, 3, BR); R(13, 8, 1, 1, BR);         // 一圈发紫的淤痕
      R(14, 3, 8, 1, HR); R(13, 4, 2, 1, HR); R(19, 4, 4, 1, HR); R(16, 2, 1, 1, HR);
      const e = a < .2 ? 4 : 6;                                         // 眼窝越张越大，里面什么都没有
      for (const x of [10, 18]) { R(x - 1, 11, e + 2, 1, SK3); R(x, 12, e, e, HO); R(x - 1, 12, 1, e, SK3); R(x + e, 12, 1, e, SK2); }
      if (a > .5) R(20, 14, 1, 1, '#d8e0e8');                           // 黑洞深处，一个针尖大的亮点
      R(16, 19, 1, 2, SK3);
      const mh = 1 + Math.round(a * 3); R(14, 22, 5, mh, '#1a0a0a'); R(14, 22, 5, 1, '#5a3a3a');
    }
  };

  defChapter({
    id: 'deardavid', n: 1, title: '亲爱的大卫', sub: '纽约的老公寓。午夜，绿摇椅上坐着一个头瘪了一块的小男孩。你只能问他两个问题。', origin: '美国 · 2017年推特连载', color: '#2c4a3a',
    icon: '@david', iconX: 26, amb: 'room', floor: 'wood', wall: 'paper', dark: .5, plr: 3.2,
    thumb(g, w, h) {
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      P(10, 12, 30, 38, '#241c2a'); P(12, 14, 26, 34, '#0c1628'); P(24, 14, 2, 34, '#241c2a'); P(12, 30, 26, 2, '#241c2a'); P(28, 18, 6, 6, '#e8e4c8'); P(29, 19, 4, 4, '#fffbe0');
      g.fillStyle = 'rgba(190,200,255,.10)'; g.beginPath(); g.moveTo(12, 50); g.lineTo(38, 50); g.lineTo(78, 68); g.lineTo(36, 68); g.fill();
      const R = (x, y, ww, hh, c) => P(44 + x * 2, 36 + y * 2, ww * 2, hh * 2, c), G = '#3f7a44', G2 = '#24482a', G3 = '#6aa66a';
      R(1, 13, 14, 1, '#2a1e14'); R(0, 12, 2, 1, '#2a1e14'); R(14, 12, 2, 1, '#2a1e14'); R(3, 9, 1, 4, G2); R(12, 9, 1, 4, G2);
      R(3, -8, 10, 2, G); R(4, -9, 8, 1, G3); R(3, -6, 1, 9, G2); R(12, -6, 1, 9, G2); for (let x = 5; x < 12; x += 2) R(x, -6, 1, 9, G);
      R(2, 3, 12, 3, G); R(2, 3, 12, 1, G3); R(1, 0, 2, 7, G2); R(13, 0, 2, 7, G2); R(4, 2, 8, 2, '#c8b890');
    },
    people: {
      me: { key: 'dd-me', skin: '#f0c8a0', hair: '#2a2020', hs: 'messy', top: '#4a6a5a', top2: '#3a5448', bottom: '#33384a', shoes: '#d8d8d0',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.tT + 4, 4, 2, '#3a5448'); R(5, G.tT, 1, 3, '#e8e8e0'); R(10, G.tT, 1, 3, '#e8e8e0'); } else if (d === 3) R(4, G.hT + 6, 8, 2, '#4a6a5a'); } },   // 连帽卫衣
      david: { key: 'dd-david', skin: '#c9cdc2', hair: '#3a3028', hs: 'short', child: true, top: '#7a8aa8', top2: '#e4e4dc', bottom: '#7a8aa8', shoes: '#c9cdc2', eye: '#030303',
        extra(g, d, fr, G, R) {
          if (d === 0) { g.clearRect(3, G.hT - 1, 4, 3); g.clearRect(4, G.hT + 2, 1, 1); R(5, G.hT + 2, 2, 1, '#6a4c5c'); R(7, G.hT, 1, 2, '#8a8e82'); R(5, G.hT + 4, 2, 2, '#030303'); R(9, G.hT + 4, 2, 2, '#030303'); R(4, G.tT + 2, 8, 1, '#a8b8d0'); R(4, G.tT + 5, 8, 1, '#a8b8d0'); }
          else if (d === 1) { g.clearRect(8, G.hT - 1, 4, 3); R(8, G.hT + 2, 2, 1, '#6a4c5c'); R(5, G.hT + 4, 2, 2, '#030303'); R(5, G.tT + 2, 6, 1, '#a8b8d0'); R(5, G.tT + 5, 6, 1, '#a8b8d0'); }
          else { g.clearRect(9, G.hT - 1, 4, 3); R(9, G.hT + 2, 2, 1, '#6a4c5c'); R(4, G.tT + 2, 8, 1, '#a8b8d0'); R(4, G.tT + 5, 8, 1, '#a8b8d0'); }
        } },
      girl: { key: 'dd-girl', skin: '#f0caa8', hair: '#5a3a24', hs: 'twin', child: true, dress: true, top: '#e0c030', top2: '#f0dc70', shoes: '#c03030', hat: 'hood', hatC: '#e0c030' },
      beth: { key: 'dd-beth', skin: '#e8c4a8', hair: '#8a7a6a', hs: 'bun', top: '#6a5a7a', top2: '#e8dcc8', bottom: '#4a3a4a', skirt: true, coat: true, shoes: '#3a2a2a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#2a2a2a'); R(9, G.hT + 4, 2, 1, '#2a2a2a'); R(7, G.hT + 4, 2, 1, '#2a2a2a'); } } },   // 老花镜
      ruth: { key: 'dd-ruth', skin: '#ecd8c8', hair: '#5a3a2a', hs: 'long', top: '#7a6a58', top2: '#e8dcc8', bottom: '#4a4a52', coat: true, ghost: true, hat: 'scarf', hatC: '#a83a3a' }
    },
    faces: FACES,
    items: {
      photo: { name: '露丝的照片', desc: '一张褪色的彩色照片：围红围巾的女人抱着穿条纹睡衣的小男孩，坐在一把绿色摇椅上，两个人都在笑。背面：「1978，我们的椅子。」' },
      rkey: { name: '红绳钥匙', desc: '一把黄铜门钥匙，拴着一截褪色的红绳，绳子断过，打了一个小小的死结。摸上去是温的。' }
    },
    notes: {
      thread1: { title: '推特串（一）· @墨水瓶', text: '@墨水瓶 · 8月7日\n我的公寓好像闹鬼了。是个死掉的小孩，他好像想杀我。（串）\n\n我梦见卧室角落那把绿摇椅上，坐着一个小男孩，头的一边是瘪的。他从椅子上下来，拖着脚朝我的床走过来。我动不了。\n过了几晚，梦里一个穿黄雨衣的小女孩说：「你遇上的是『亲爱的大卫』。」\n· 他已经死了，只在午夜出来。\n· 可以问他两个问题，每个问题前面必须先叫「亲爱的大卫」。\n· 绝不能问第三个。问了，他会杀了你。\n后来我在梦里问了他三个。第三个一出口我就醒了。从那以后，事情越来越不对。\n（摇椅是我从地下室储物格里拖上来的，管理员说是几十年前的租客留下的。）\n\n@墨水瓶 · 8月9日\n两只猫每晚快十二点就跑到门口，坐成一排，仰头盯着猫眼。\n\n@墨水瓶 · 8月12日\n隔着猫眼拍了一张走廊，好像有东西。拍立得拍的走廊，显影出来全是黑的。\n\n@夜猫子：楼主千万别问第三个！！　@理性看帖：坐等官宣拍电影。' },
      thread2: { title: '推特串（二）· @墨水瓶', text: '@墨水瓶 · 8月22日\n梦见他攥着我的胳膊，拉我穿过一座没有尽头的仓库。早上胳膊上一圈淤青，很小，像小孩的手。\n\n@墨水瓶 · 8月29日\n宠物摄像头：半夜十二点零几分，绿摇椅自己摇了起来，墙上的龟壳掉了，茶几上的绿玻璃罐自己滑出去半尺。\n\n@墨水瓶 · 9月3日\n睡眠App说我每晚三点有五分钟「噪音」。点开听，只有沙沙声。\n\n@墨水瓶 · 12月12日\n让手机每六十秒自动拍一张。几百张空房间。然后：他趴在摇椅上。下一张，他站在我床边，看着镜头。下一张，更近。\n\n@墨水瓶 · 12月30日\n我搬走了，猫托给了朋友。如果你在看：对不起。只问两个。\n\n@物理老师：罐子底下有水，表面张力。\n@调亮了看：床边真的有个小孩。　@不信：在连载恐怖小说吧？' },
      letter: { title: '露丝的信（夹在箱子里）', text: '亲爱的玛丽安：\n\n箱子先放你这儿。等我安顿好了，就回来拿。\n\n钥匙我交回给管理员了，只交了一把。另一把——挂在大卫脖子上、拴红绳子的那把——到处都找不到。我知道这很傻，可我总觉得是他藏起来了。他老怕弄丢。\n\n那把绿摇椅我带不走，留在地下室了。我没法再坐上去。\n\n贝丝问我，大卫晚上还会不会等门。告诉她：会的。\n他会等妈妈在楼梯上哼歌。那是我们俩的暗号——谁敲门都不许开，只有听见那几个音，再听见钥匙在锁眼里一转，才开。\n\n那天晚上下大雪，地铁停在半路。\n我晚了四十分钟。\n\n——露丝　1980年2月' },
      lullaby: { title: '歌词纸（铅笔，被水泡过）', text: '（一张对折的作业纸。上半截被水泡过，有两格字迹晕成了一团。）\n\n　　　　《妈妈上楼梯》\n　　　　——露丝给大卫编的\n\n　3　　5　　▒　　5　　▒　　1\n　小　 大　 卫，　别　 睡　 着，\n　听，钥匙响，\n　妈妈上楼梯，一、二、三——\n　门开了，到家了。\n\n（右下角，大人的字：只哼第一句。听见了，钥匙转了，才开门。）\n（简谱：1 do　2 re　3 mi　4 fa　5 sol　6 la　7 si）' }
    },
    legend: '「亲爱的大卫」（Dear David）出自2017年8月7日起的一串推文：一位住在纽约的插画作者说，他的公寓里闹鬼，是一个死去的小孩，而且那个小孩似乎想杀他。据他讲，他先梦见卧室里的绿色摇椅上坐着一个头部畸形的男孩，男孩从椅子上下来，拖着脚朝床走过来，而他躺着动弹不得；几晚后，另一个梦里的小女孩告诉他：你遇上的是「亲爱的大卫」。规矩是——大卫已经死了，只在午夜出现；见到他可以问两个问题，每问之前必须先叫「亲爱的大卫」；绝不能问第三个，否则他会杀了你。楼主说，他后来在梦里问了三个问题，事情从此变本加厉。第一条推文被转发了几万次。\n\n此后几个月他陆续更新（以下均为楼主自述）：家里的两只猫每到午夜前后就聚到大门口；他隔着猫眼拍下走廊，觉得照片里有东西；拍立得拍的走廊显影出来一片漆黑，网友说在里面看到了人脸；宠物摄像头拍到绿摇椅自己摇动、墙上的龟壳掉落、茶几上的绿玻璃罐自己滑开；睡眠App每晚三点左右录到几分钟杂音；他梦见被大卫拉着穿过一座仓库，醒来手臂上有淤青；12月，他让手机每六十秒自动拍一张，说拍到了大卫趴在椅子上、站到他床边、朝镜头走来。\n\n怀疑的声音从一开始就有：有网友指出玻璃罐底下有水，表面张力就能让它滑动；调亮的暗照片被认为是人脑「看图成脸」的错觉；整个故事的节奏也很像网络怪谈（creepypasta）。楼主本人说，他从没想说服谁相信有鬼。2018年起更新渐少，同年传出电影改编的消息，电影《亲爱的大卫》于2023年上映。原串里，大卫是谁、为什么偏偏在那间公寓，始终没有说法，也查无实据。\n\n（游戏虚构：你、对门的贝丝和她的母亲、露丝和大卫的身世——服装仓库的夜班、下大雪的那一晚、门口的小板凳、楼梯上的暗号歌、红绳钥匙、「两个问题，然后睡觉」的睡前规矩——以及推特账号与推文措辞、楼主搬走与留言、摇椅的来历、两只猫的名字、梦里的仓库是露丝上班的地方、三种结局，都是游戏虚构。真实的楼主不写姓名；猫在门口、猫眼与拍立得、宠物摄像头、三点的杂音、仓库与淤青、六十秒拍照等细节取自原串的流传版本。）',
    endings: { home: '妈妈回来了', third: '第三个问题', curb: '路边的摇椅' },
    start: { map: 'hall', x: 3, y: 3, dir: 2 },
    resume: {
      n1: async S => { dreamBed(S, 1); if (THIRD) await thirdHint(S); await qa(S, 1); },
      n2: async S => { dreamBed(S, 2); if (THIRD) await thirdHint(S); await qa(S, 2); },
      ware: async S => {
        wareLight(S); S.pos(5, 12, 2); S.hide('wdv');
        S.focus(19, 2); await S.wait(600); S.focus(17, 11); meow(S, .12); await S.wait(700); S.focus(null);
        if (DIED) { S.sfx('heart'); await S.think(DIED === 1 ? '……再来。\n梦里跑不起来。别停下——跟着煤球的绿眼睛，一个缺口一个缺口往上走。' : '它只走直线。我只要不走回头路，它就追不上。\n绿眼睛在哪儿，缺口就在哪儿。'); }
        startChase(S);
      },
      rite: async S => { riteSet(S); }
    },
    async intro(S) {
      DIED = 0; THIRD = 0;
      await S.card('第一夜　亲爱的大卫', '2018年1月　美国纽约　一栋没有电梯的老公寓', '他在推特上连载了五个月：\n他的公寓里，有一个死去的小男孩。\n\n上个月，他忽然搬走了。\n临走前给你发了一条私信——\n\n「两只猫拜托你了。钥匙在门垫底下。」\n「别在卧室睡。要是梦见他，只问两个。」');
    },
    tick(S, dt) {
      if (W.busy) return;
      const f = S.f;
      if (S.map === 'ware' && f.chase) {
        const c = S.ent('wdv');
        if (c && !c.hidden) { const d = (Math.abs(c.px - W.pl.px) + Math.abs(c.py - W.pl.py)) / 16; f._hb = (f._hb ?? 0) - dt; if (d < 7 && f._hb <= 0) { f._hb = .28 + d * .12; S.sfx('heart'); } f._dg = (f._dg ?? 0) - dt; if (f._dg <= 0) { f._dg = .9; drag(S, 1, .7, Math.max(.05, .3 - d * .03)); } }
        const y = W.pl.y, g = y >= 12 ? [17, 11] : y >= 10 ? [4, 9] : y >= 8 ? [14, 7] : y >= 6 ? [3, 5] : y >= 4 ? [16, 3] : [18, 2];
        const k = S.ent('wcat'); if (Math.round(k.px / 16) !== g[0] || Math.round(k.py / 16) !== g[1]) S.place('wcat', g[0], g[1], 0);
        f._sw = (f._sw ?? 2) - dt; if (f._sw <= 0) { f._sw = 6 + Math.random() * 4; for (let i = 0; i < 12; i++) S.tone('square', 1100, 820, .02, .012, i * .07, 2200); S.tone('sawtooth', 52, 50, 2.4, .02, 0, 180); }   // 远处有一台缝纫机在空转，传送带低低地嗡
        f._mw = (f._mw ?? 0) - dt; if (f._mw <= 0) { f._mw = 2.2; const d = (Math.abs(k.px - W.pl.px) + Math.abs(k.py - W.pl.py)) / 16; meow(S, Math.max(.03, .14 - d * .007)); }
      }
      if (S.map === 'apt' && f.act === 'eve' && W.pl.x < 8) { f._ck = (f._ck ?? 4) - dt; if (f._ck <= 0) { f._ck = 9 + Math.random() * 6; creak(S, 2, 0, .03); } }   // 卧室里，摇椅偶尔「吱呀」一声
      if (S.map === 'dream' && f.act === 'rite' && W.pl.y > 20) { f._dh = (f._dh ?? 3) - dt; if (f._dh <= 0) { f._dh = 8 + Math.random() * 4; S.tone('sine', 330, 326, .5, .025, 0, 900); S.tone('sine', 392, 388, .5, .025, .55, 900); } }   // 门里面有人在轻轻地哼前两个音
    },
    sprites: {
      rocker(g, e, t, R0) {   // 绿色摇椅（正面）；s.rock 自己在摇，s.photo 椅背上放着照片
        const sw = e.rock ? Math.round(Math.sin(t * 2.6) * 1.6) : 0, R = (x, y, w, h, c) => R0(x + (y < 8 ? sw : 0), y, w, h, c);
        const G = '#3f7a44', G2 = '#24482a', G3 = '#6aa66a';
        R0(1, 13, 14, 1, '#2a1e14'); R0(0, 12 - (sw < 0 ? 1 : 0), 2, 1, '#2a1e14'); R0(14, 12 - (sw > 0 ? 1 : 0), 2, 1, '#2a1e14');
        R0(3, 9, 1, 4, G2); R0(12, 9, 1, 4, G2);
        R(3, -8, 10, 2, G); R(4, -9, 8, 1, G3); R(3, -6, 1, 9, G2); R(12, -6, 1, 9, G2); for (let x = 5; x < 12; x += 2) R(x, -6, 1, 9, G);
        R(2, 3, 12, 3, G); R(2, 3, 12, 1, G3); R(2, 6, 12, 1, G2); R(1, 0, 2, 7, G2); R(13, 0, 2, 7, G2); R(1, 0, 2, 1, G3); R(13, 0, 2, 1, G3);
        R(4, 2, 8, 2, '#c8b890');
        if (e.photo) { R(6, -5, 4, 5, '#e8e4d8'); R(7, -4, 2, 2, '#a83a3a'); R(7, -2, 2, 1, '#7a8aa8'); }
      },
      cat(g, e, t, R) {   // s.col 毛色，s.patch 斑，s.up 背对着仰头看门，s.sleep 蜷着睡
        const c = e.col || '#1a1a1e', p = e.patch, ey = e.eyeC || '#c8e060';
        if (e.up) { R(5, 9, 6, 6, c); R(6, 5, 4, 5, c); R(6, 4, 1, 1, c); R(9, 4, 1, 1, c); R(10, 13, 3, 1, c); R(12, 11, 1, 3, c); if (p) { R(6, 10, 3, 2, p); R(7, 6, 2, 1, p); } return; }
        if (e.sleep) { R(3, 10, 10, 5, c); R(2, 11, 3, 3, c); R(2, 10, 1, 1, c); R(4, 10, 1, 1, c); R(11, 13, 4, 2, c); if (p) R(6, 11, 4, 2, p); return; }
        R(5, 9, 6, 6, c); R(5, 4, 6, 5, c); R(5, 3, 1, 1, c); R(10, 3, 1, 1, c);
        if (Math.sin(t * 1.3 + e.px) < .96) { R(6, 6, 1, 1, ey); R(9, 6, 1, 1, ey); }
        R(7, 8, 2, 1, '#c87a7a'); R(11, 13, 3, 1, c); R(13, 11, 1, 2, c); if (p) { R(5, 4, 2, 2, p); R(9, 10, 2, 3, p); }
      },
      radiator(g, e, t, R) { R(1, 2, 14, 12, '#5e5e58'); for (let x = 2; x < 14; x += 2) R(x, 1, 1, 13, '#86867e'); R(1, 13, 14, 1, '#3e3e3a'); R(0, 4, 1, 2, '#9a9a90'); R(2, 14, 1, 2, '#2e2e2a'); R(13, 14, 1, 2, '#2e2e2a'); R(14, 3, 2, 1, '#9a9a90'); if (e.glint) R(14, 11, 1, 2, '#c03030'); },
      bedP(g, e, t, R) {   // 床；s.occ 有人睡着
        const c = e.col || '#5a6a8a'; bx(R, 1, -2, 14, 32, '#4a3424'); R(2, -1, 12, 4, '#5a4030'); R(3, 3, 10, 6, '#e6e2d6');
        if (e.occ) { R(5, 1, 6, 4, '#2a2020'); R(5, 4, 6, 3, '#f0c8a0'); R(6, 5, 1, 1, '#3a2a2a'); R(9, 5, 1, 1, '#3a2a2a'); R(2, 7, 12, 22, c); R(2, 7, 12, 2, shade(c, .2)); R(4, 13, 8, 7, shade(c, .08)); }
        else { R(2, 10, 12, 19, c); R(2, 10, 12, 2, shade(c, .2)); }
        R(2, 27, 12, 2, shade(c, -.25));
      },
      deskpc(g, e, t, R) {   // 书桌：笔记本电脑（s.scr 屏幕亮）+ 拍立得 + 一摞全黑的照片
        bx(R, 0, 1, 16, 13, '#5d4632'); R(1, 2, 14, 2, '#73583e');
        R(2, -5, 9, 7, '#2a2a30'); R(3, -4, 7, 5, e.scr ? '#8ab4e8' : '#1a2230'); if (e.scr) { R(4, -3, 5, 1, '#e8f0ff'); R(4, -1, 3, 1, '#c8d8f0'); }
        R(1, 2, 11, 2, '#3a3a40'); R(12, -1, 4, 4, '#e8c8d8'); R(13, 0, 2, 2, '#2a2a2a'); R(12, 5, 3, 4, '#e8e4d8'); R(13, 6, 1, 2, '#0a0a0a');
      },
      shelfcam(g, e, t, R) {   // 书架，顶上是宠物摄像头（红灯一闪一闪）
        bx(R, 0, -12, 16, 27, '#4a3424');
        for (const y of [-9, -2, 5]) { R(1, y + 5, 14, 1, '#2a1a10'); for (let x = 2; x < 14; x += 2) R(x, y, 1, 5, ['#8a3a3a', '#3a5a8a', '#c8a050', '#4a7a4a'][((x >> 1) + y) & 3]); }
        R(5, -16, 6, 4, '#e8e8e8'); R(7, -15, 2, 2, '#222'); R(10, -16, 1, 1, Math.sin(t * 3) > 0 ? '#ff3030' : '#601010');
      },
      turtle(g, e, t, R) {   // 墙上的龟壳；s.fell 掉到了地上
        R(7, 1, 2, 2, '#9a9a90');
        const y = e.fell ? 17 : 3; R(4, y + 1, 8, 6, '#5a4a2a'); R(5, y, 6, 8, '#6a5a32'); R(6, y + 2, 4, 4, '#8a7a4a'); R(7, y + 1, 2, 1, '#8a7a4a'); R(5, y + 3, 1, 1, '#3a2a14'); R(10, y + 4, 1, 1, '#3a2a14');
      },
      ctable(g, e, t, R) {   // 茶几 + 绿玻璃罐（s.jx 罐子滑出去多远）
        bx(R, 0, 3, 32, 9, '#5a3a24'); R(1, 4, 30, 2, '#7a5a3a'); R(2, 12, 2, 3, '#3a2414'); R(28, 12, 2, 3, '#3a2414');
        const j = e.jx || 0; R(5 + j, -3, 5, 7, '#2e7a4a'); R(6 + j, -2, 1, 4, '#6ac08a'); R(5 + j, -4, 5, 1, '#1e5a34'); if (j) R(5, 4, 4, 1, 'rgba(160,200,220,.5)');
        R(18, 2, 8, 2, '#d8d0c0'); R(19, 2, 6, 1, '#c84a4a');
      },
      bowls(g, e, t, R) { R(1, 10, 6, 3, '#c84a4a'); R(2, 13, 4, 1, '#8a2a2a'); R(9, 10, 6, 3, '#4a6ac8'); R(10, 13, 4, 1, '#2a4a8a'); if (e.full) { R(2, 10, 4, 1, '#8a5a2a'); R(10, 10, 4, 1, '#cfe0f0'); } },
      stool(g, e, t, R) { if (e.tip) { R(2, 10, 10, 3, '#8a6a40'); R(11, 7, 2, 6, '#6a4a28'); R(3, 13, 2, 2, '#6a4a28'); return; } R(3, 5, 10, 3, '#8a6a40'); R(3, 5, 10, 1, '#aa8a5a'); R(4, 8, 1, 6, '#6a4a28'); R(11, 8, 1, 6, '#6a4a28'); R(4, 11, 8, 1, '#6a4a28'); },
      mat(g, e, t, R) { R(1, 4, 14, 9, '#5a2e22'); R(2, 5, 12, 7, '#7a4030'); for (let x = 3; x < 13; x += 2) R(x, 6, 1, 5, '#6a3628'); },
      rbox(g, e, t, R) { bx(R, 1, 4, 14, 11, '#a8844a'); R(2, 5, 12, 2, '#5a4020'); R(0, 2, 5, 3, '#c8a464'); R(11, 2, 5, 3, '#c8a464'); R(4, 3, 5, 3, '#e8e4d8'); R(9, 3, 3, 2, '#b03030'); },
      exitdoor(g, e, t, R) { bx(R, 2, -2, 12, 16, '#3a3e44'); R(4, 0, 8, 12, '#2a2e34'); R(11, 6, 2, 2, '#888'); R(3, -7, 10, 4, '#1a0606'); R(4, -6, 8, 2, Math.sin(t * 2) > -.8 ? '#ff3030' : '#802020'); },
      bdoor(g, e, t, R) {   // 走廊里的门：门牌 + 猫眼；s.ajar 开了一条缝
        bx(R, 2, -2, 12, 16, e.col || '#6a3a2a'); R(4, 0, 8, 5, shade(e.col || '#6a3a2a', .1)); R(4, 7, 8, 5, shade(e.col || '#6a3a2a', .1)); R(11, 6, 2, 2, '#c9a35a');
        R(6, -1, 4, 2, '#c9a35a'); R(7, 2, 2, 1, '#111'); if (e.ajar) { R(12, -2, 2, 16, '#0a0806'); R(12, 4, 2, 2, '#f0d090'); }
      }
    },
    tiles: {
      rack: { solid: true, paint(R, X, Y) {   // 仓库铁架（俯视）
        R(0, 0, 16, 16, '#26262a'); R(0, 0, 16, 2, '#4a4a52'); R(0, 14, 16, 2, '#16161a'); R(0, 0, 1, 16, '#5a5a62'); R(15, 0, 1, 16, '#5a5a62');
        if (hash(X, Y, 5) < .72) { R(2, 3, 6, 9, '#7a5c38'); R(2, 3, 6, 1, '#9a7a4e'); R(4, 6, 2, 1, '#e8e0c8'); }
        if (hash(X, Y, 9) < .6) { R(9, 5, 5, 7, '#6a4e2e'); R(9, 5, 5, 1, '#8a6c44'); }
        if (hash(X, Y, 13) < .2) { R(3, 4, 10, 8, '#b8b0a0'); R(3, 7, 10, 1, '#8a8478'); }   // 一捆捆裹着塑料布的布料
      } }
    },
    maps: {
      /* ---------------- 五楼走廊（白天、傍晚） ---------------- */
      hall: {
        amb: 'room', dark: .55, plr: 3, wall: 'brick', floor: 'linoleum',
        tileOpts: { tileC: '#9a9484' },
        rows: [
          '####################',
          '####################',
          '#nnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnn#',
          '####################'],
        ents: [
          { x: 1, y: 3, spr: 'stairsdown', solid: false, touch: S => stairsOut(S) },
          { x: 1, y: 4, spr: 'stairsdown', solid: false, touch: S => stairsOut(S) },
          { x: 1, y: 2, spr: 'stairsup', solid: false, on: S => S.narr('往上是六楼。楼梯扶手上的漆被几十年的手摸得发亮，有一段低低的地方，磨得特别厉害——小孩扶的高度。') },
          { x: 4, y: 1, spr: 'bdoor', col: '#4a3a5a', on: S => S.narr('5B。门把手上挂着「请勿打扰」的酒店牌子，大概是从哪儿顺回来的。\n门里有电视的声音，在放球赛。') },
          { id: 'door5c', x: 9, y: 1, spr: 'bdoor', col: '#2e4a3a', on: S => door5c(S) },
          { id: 'door5d', x: 14, y: 1, spr: 'bdoor', col: '#6a3a2a', on: S => S.narr(S.f.act === 'arrive' ? '5D。门开着一条缝，链子挂着。门缝里有一只眼睛在看你。' : '5D，贝丝家。门上贴着一张褪色的圣诞贴纸，门里有座钟「嗒、嗒」地走。') },
          { x: 18, y: 1, spr: 'window', on: S => S.narr(['arrive', 'eve'].includes(S.f.act) ? '走廊尽头的窗户。外面是对面楼的消防梯，一层一层，在雪里黑黢黢的。' : '外面在下小雪。楼下的人行道上，有人在铲雪，铲子刮地的声音一下一下传上来。') },
          { x: 9, y: 2, spr: 'mat', decal: true, solid: false },   // 门垫只是装饰：站在上面调查要落到门上
          { id: 'beth', x: 14, y: 2, spr: '@beth', dir: 0, on: S => bethTalk(S) },
          { id: 'bcat', x: 16, y: 3, spr: 'cat', solid: false, s: { col: '#8a7a6a', patch: '#5a4a3a', eyeC: '#d8b040' }, on: S => { meow(S, .06); return S.narr('贝丝家的老猫，毛都花白了。它蹲在走廊中间，一动不动，一直盯着5C的门。\n你伸手去摸它，它也不回头。'); } },
          { id: 'rbox', x: 13, y: 2, spr: 'rbox', hidden: true, on: S => boxOn(S) },
          { x: 6, y: 3, spr: 'invisible', light: { r: 4, col: 'rgba(255,220,150,.14)' } },
          { x: 14, y: 3, spr: 'invisible', light: { r: 3.4, col: 'rgba(255,220,150,.12)', flick: true } }
        ],
        async enter(S, first) {
          if (first) S.f.act = 'arrive';
          hallStage(S);
          if (!first) return;
          buzz(S);
          await S.narr('五楼。楼梯间里一股暖气片烤灰的味道，混着谁家煮卷心菜的味儿。\n走廊的灯管一闪一闪，「滋——滋——」。');
          S.face('beth', 'pl'); S.bubble('beth', '?', 900);
          await S.say('5D门缝里的女人', ['你是那个画画的小伙子的朋友？来喂猫的？', '……晚上听见什么，别开门。'], WS);
          S.sfx('close'); S.hide('beth'); S.ent('door5d').s.ajar = false;
          await S.think('爬楼的时候，你又把他那条推特串从头翻了一遍。');
          await S.note('thread1');
          S.goal('进5C（钥匙在门垫底下）');
        }
      },
      /* ---------------- 5C：现实中的公寓 ---------------- */
      apt: {
        amb: 'room', dark: .5, plr: 3.2, wall: 'paper', wallC: { face: '#7a8a78', trim: '#3e4a3c', top: '#1c221a' }, floor: 'wood',
        legend: { l: 'lightwood' }, tileOpts: { carpetC: '#5a4a5a' },
        rows: [
          '####################',
          '####################',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc.llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '####################'],
        ents: [
          /* 卧室 */
          { id: 'bed', x: 1, y: 2, h: 2, spr: 'bedP', on: S => S.narr(S.f.act === 'eve' ? '他的床。被子没叠，枕头上还有一个凹下去的坑。\n他说：别在卧室睡。' : '你昨晚明明睡在沙发上。\n可这张床的被子，被人掀开过一角。') },
          { id: 'blamp', x: 2, y: 2, spr: 'lamp', light: { r: 3, col: 'rgba(255,200,120,.16)' }, on: S => S.narr('床头的落地灯。灯罩歪着，像一个人歪着头。') },
          { x: 3, y: 2, spr: 'wardrobe', col: '#4a3a2a', on: S => S.narr('衣柜门关不严，留着一条黑缝。\n推特里有人说，他拍的卧室照片里，衣柜缝里有张脸。你把门推上了。门又慢慢地自己滑开一条缝。') },
          { x: 4, y: 1, spr: 'window', on: S => S.narr(S.f.act === 'eve' ? '卧室窗外是消防梯。雪落在铁栏杆上，积了薄薄一层。' : '白天看，消防梯的铁栏杆上有一串小小的、光着脚的脚印。\n……是猫的吧。') },
          { id: 'rocker', x: 6, y: 2, spr: 'rocker', on: S => rockerOn(S) },
          { id: 'desk', x: 1, y: 7, spr: 'deskpc', s: { scr: true }, light: { r: 2, col: 'rgba(140,180,255,.14)' }, on: S => deskOn(S) },
          { x: 5, y: 8, spr: 'box', on: S => S.narr('打包了一半的纸箱。最上面是一摞画稿，画的全是同一把椅子。') },
          { x: 6, y: 8, spr: 'box', on: S => S.narr('纸箱上用马克笔写着「卧室·易碎」。他走得很急，胶带只封了一半。') },
          /* 客厅 / 厨房 */
          { x: 9, y: 2, spr: 'fridge', on: S => S.narr('冰箱上贴着一张猫粮购物清单，还有一张便利贴：「别忘了：12点前关灯睡觉。」字迹越写越小。') },
          { x: 10, y: 2, spr: 'stove', on: S => S.narr('炉灶很干净，大概从来没开过火。') },
          { x: 11, y: 2, spr: 'sink', on: S => S.narr('水槽里只有两只猫碗的勺子。') },
          { x: 12, y: 2, spr: 'counter', on: S => S.narr('台面上摆着一捆没点完的鼠尾草，烧焦的一头黑乎乎的。\n他在推特里说过：熏过了，没用。') },
          { id: 'turtle', x: 14, y: 1, spr: 'turtle', solid: false, on: S => S.narr(S.ent('turtle').s.fell ? '龟壳掉在地上了。墙上的钉子还好好的，挂绳也没断。' : '墙上挂着一只龟壳，是他从跳蚤市场淘来的。挂绳很结实。') },
          { id: 'door5', x: 16, y: 1, spr: 'door', col: '#2e4a3a', on: S => aptDoor(S) },
          { id: 'rad', x: 17, y: 2, spr: 'radiator', on: S => radOn(S) },
          { id: 'bowls', x: 10, y: 4, spr: 'bowls', solid: false, on: S => bowlsOn(S) },
          { id: 'ctable', x: 13, y: 4, w: 2, spr: 'ctable', on: S => S.narr(S.ent('ctable').s.jx ? '那只绿玻璃罐，从茶几这头滑到了那头。原来的位置上有一圈水印。\n……推特底下有人说过：表面张力。' : '茶几上的绿玻璃罐，里面插着几支干掉的薰衣草。旁边是一摞没拆的信。') },
          { id: 'sofa', x: 13, y: 6, w: 2, spr: 'sofa', col: '#5a4a3a', on: S => sofaOn(S) },
          { id: 'cam', x: 18, y: 5, spr: 'shelfcam', on: S => camOn(S) },
          { id: 'llamp', x: 9, y: 7, spr: 'lamp', light: { r: 3.4, col: 'rgba(255,200,120,.16)' }, on: S => S.narr('客厅的落地灯，灯泡有点接触不良，隔一会儿「滋」一声。') },
          { x: 16, y: 8, spr: 'box', on: S => S.narr('纸箱上写着「客厅」。里面塞着一台拍立得相纸，和几十张显影出来全黑的照片。') },
          { x: 17, y: 8, spr: 'box', on: S => S.narr('猫砂、猫抓板、逗猫棒。他连猫的东西都打包好了，只是没带走猫。') },
          { x: 18, y: 8, spr: 'box', on: S => S.narr('一箱书。最上面一本是《睡眠瘫痪：你并不孤单》，书角被折了好几页。') },
          { id: 'cat1', x: 11, y: 5, spr: 'cat', solid: false, s: { col: '#e8e4dc', patch: '#b08850', eyeC: '#7aa0c8' }, on: S => catOn(S, 1) },
          { id: 'cat2', x: 16, y: 6, spr: 'cat', solid: false, s: { col: '#18181c' }, on: S => catOn(S, 2) }
        ],
        async enter(S, first) { aptStage(S); if (first) await aptFirst(S); }
      },
      /* ---------------- 梦：5C（午夜）+ 门外的走廊 ---------------- */
      dream: {
        amb: 'drone', dark: .84, plr: 2.6, wall: 'paper', wallC: { face: '#4a5a58', trim: '#26302e', top: '#0e1212' }, floor: 'wood', fog: .14, darkC: '#0b0718',
        legend: { l: 'lightwood' }, tileOpts: { carpetC: '#3a2e44', tileC: '#6a6a74' },
        rows: [
          '####################',
          '####################',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc.llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '#ccccccc#llllllllll#',
          '####################',
          ...Array(13).fill('                    '),
          '####################',
          '####################',
          '#nnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnn#',
          '####################'],
        ents: [
          { id: 'd_bed', x: 1, y: 2, h: 2, spr: 'bedP', col: '#4a5a7a', on: S => S.narr('床单是冰的。枕头上的凹坑，比你的头小得多。') },
          { x: 2, y: 2, spr: 'lamp', off: true, on: S => S.narr('灯不亮。开关拨上拨下，「咔哒、咔哒」。') },
          { x: 3, y: 2, spr: 'wardrobe', col: '#3a2e24', on: S => S.narr('衣柜门大开着。里面挂着的全是小孩的衣服：条纹睡衣，小毛衣，一件很小的雪地靴。') },
          { id: 'd_win', x: 4, y: 1, spr: 'window', light: { r: 3.6, col: 'rgba(140,150,255,.13)' }, on: S => S.narr('窗外没有消防梯，没有对面的楼。\n只有雪，一直下，一直下，落不到地上。') },
          { id: 'd_rock', x: 6, y: 2, spr: 'rocker', s: { rock: true }, on: S => S.narr(S.f.act === 'rite' ? '摇椅停了。坐垫上，凹下去小小的一块。' : '摇椅在自己摇。吱——呀。') },
          { id: 'dv', x: 6, y: 2, spr: '@david', hidden: true, solid: false, z: 1, oy: -3, dir: 0, light: { r: 1.4, col: 'rgba(170,190,210,.10)', a: .6 } },
          { id: 'girl', x: 7, y: 5, spr: '@girl', hidden: true, solid: false, dir: 1 },
      { id: 'puddle', x: 7, y: 5, spr: 'puddle', hidden: true, decal: true, on: S => S.narr('卧室门口的一摊水，冰凉，里面漂着一片小小的黄色塑料——像是从雨衣扣子上掉下来的。') },
          { x: 1, y: 7, spr: 'deskpc', on: S => S.narr('书桌上没有电脑。只有一盒蜡笔，和一张画：一个大人，一个小孩，一扇门，门上画了一个圆圈。') },
          { x: 9, y: 2, spr: 'fridge', on: S => S.narr('冰箱上贴着一张蜡笔画，画的是一个围红围巾的女人。旁边歪歪扭扭写着：妈妈 12点。') },
          { x: 10, y: 2, spr: 'stove' }, { x: 11, y: 2, spr: 'sink' }, { x: 12, y: 2, spr: 'counter' },
          { x: 13, y: 4, w: 2, spr: 'ctable', s: { jx: 9 }, on: S => S.narr('绿玻璃罐自己在茶几上慢慢地滑，滑到边上，停住，又滑回来。') },
          { x: 13, y: 6, w: 2, spr: 'sofa', col: '#4a3a2e', on: S => S.narr('沙发上，有一个你躺过的形状。\n……你还躺在那儿吗？') },
          { id: 'd_door', x: 16, y: 1, spr: 'door', col: '#2e4a3a', on: S => dDoor(S) },
          { id: 'd_stool', x: 15, y: 2, spr: 'stool', on: S => S.narr('门边一张小板凳，正好够一个七岁的孩子踩上去，踮起脚，凑到猫眼上。\n一条凳子腿，比另外三条短一截。') },
          { id: 'd_rad', x: 17, y: 2, spr: 'radiator', on: S => dRad(S) },
          { id: 'd_cat1', x: 14, y: 3, spr: 'cat', solid: false, s: { col: '#e8e4dc', patch: '#b08850', eyeC: '#7aa0c8', up: true }, on: S => S.narr('棉花背对着你坐着，仰着头，盯着门。它在梦里也在等。') },
          { id: 'd_cat2', x: 17, y: 3, spr: 'cat', solid: false, s: { col: '#18181c', up: true }, on: S => { meow(S, .08); return S.narr('煤球回头看了你一眼，「喵」了一声，又转回去盯着门。'); } },
          /* 门外的走廊（梦） */
          { id: 'hdoor', x: 9, y: 24, spr: 'bdoor', col: '#2e4a3a', on: S => hDoor(S) },
          { x: 14, y: 24, spr: 'bdoor', col: '#6a3a2a', on: S => S.narr('5D的门。门缝底下有光，有一个小女孩在里面小声地数：一、二、三……') },
          { x: 4, y: 24, spr: 'bdoor', col: '#4a3a5a', on: S => S.narr('5B的门上没有门牌，没有把手。只是一块刷了漆的墙。') },
          { x: 18, y: 24, spr: 'window', light: { r: 3, col: 'rgba(140,150,255,.12)' }, on: S => S.narr('窗外的雪停在半空中，一片一片，一动不动。') },
          { x: 1, y: 25, spr: 'stairsdown', solid: false }, { x: 1, y: 27, spr: 'stairsdown', solid: false },
          { id: 'stairs', x: 1, y: 26, spr: 'stairsdown', solid: false, light: { r: 2.2, col: 'rgba(255,210,150,.10)' }, on: S => stairsHum(S) },
          { id: 'ruth', x: 1, y: 27, spr: '@ruth', hidden: true, solid: false, dir: 2, alpha: .85 },
          { x: 9, y: 26, spr: 'invisible', light: { r: 3.2, col: 'rgba(255,220,160,.08)', flick: true } }
        ],
        async enter(S, first) { }
      },
      /* ---------------- 梦：仓库（露丝上夜班的地方） ---------------- */
      ware: {
        amb: 'otherworld', dark: .93, plr: 2.1, wall: 'concrete', floor: 'concrete', darkC: '#060408',
        legend: { H: 'rack' },
        rows: [
          '######################',
          '######################',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#HHHHHHHHHHHHHHHxHHHH#',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#HHxHHHHHHHHHHHHHHHHH#',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#HHHHHHHHHHHHHxHHHHHH#',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#HHHxHHHHHHHHHHHHHHHH#',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#HHHHHHHHHHHHHHHHxHHH#',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '######################'],
        ents: [
          { id: 'exitd', x: 19, y: 1, spr: 'exitdoor', light: { r: 2.4, col: 'rgba(255,40,40,.22)', dy: -2 }, on: S => exitWare(S) },
          { x: 19, y: 2, spr: 'invisible', touch: S => exitWare(S) },
          { x: 7, y: 1, spr: 'clock', on: S => S.narr('墙上的打卡钟。指针停在十一点二十。\n下面一排打卡格里，只有一张卡片还插着：「露丝 · 夜班」。') },
          { x: 2, y: 1, spr: 'poster', on: S => S.narr('褪色的告示：「夜班理货员请注意：暴雪天地铁停运，请自行安排回家。」') },
          { id: 'wcat', x: 17, y: 11, spr: 'cat', solid: false, s: { col: '#18181c' }, light: { r: 1.3, col: 'rgba(150,255,120,.16)' } },
          { id: 'wdv', x: 3, y: 12, spr: '@david', hidden: true, solid: false, dir: 2, light: { r: 1.3, col: 'rgba(170,190,210,.12)', a: .55 } }
        ],
        async enter(S, first) { }
      }
    }
  });

  /* ======================= 摆放与灯光 ======================= */
  function hallStage(S) {
    const a = S.f.act, day = ['day', 'day2'].includes(a);
    if (a === 'arrive' && !S.f._bethSeen) { S.f._bethSeen = true; S.place('beth', 14, 2, 0); S.ent('door5d').s.ajar = true; }   // 门缝里探出头
    else if (day && !S.f._bethDay) { S.f._bethDay = true; S.place('beth', 12, 3, 1); S.ent('door5d').s.ajar = false; }   // 白天在走廊里收洗好的衣服；之后就留在原地
    else if (!day) { S.hide('beth'); S.ent('door5d').s.ajar = false; }
    S.show('rbox', !!S.f.boxDown);
    S.dark(day ? .18 : null, 'hall');
  }
  function aptStage(S) {
    const a = S.f.act, day = ['day', 'day2'].includes(a);
    const c1 = S.ent('cat1'), c2 = S.ent('cat2');
    if (a === 'eve' && S.f.midnight) { S.place('cat1', 15, 2, 3); S.place('cat2', 16, 3, 3); c1.s.up = c2.s.up = true; c1.s.sleep = c2.s.sleep = false; }
    else if (a === 'eve') { if (!S.f.fed) { S.place('cat1', 11, 5, 0); S.place('cat2', 16, 6, 1); } c1.s.up = c2.s.up = false; }
    else if (day) { S.place('cat1', 14, 6, 0); c1.oy = -5; c1.s.sleep = true; c1.s.up = false; S.place('cat2', 10, 5, 0); c2.s.up = false; c2.s.sleep = false; }
    S.ent('ctable').s.jx = day ? 9 : 0; S.ent('turtle').s.fell = day;
    S.ent('rocker').s.photo = !!S.f.photoOn; S.ent('bed').s.occ = false;
    S.dark(day ? .16 : null, 'apt');
    S.ent('blamp').off = day; S.ent('llamp').off = day;
  }
  function wareLight(S) { S.dark(.93, 'ware'); S.plr(2.1); S.norun(true); S.speed(.8); S.place('wcat', 17, 11, 0); }

  /* ======================= 走廊 ======================= */
  async function stairsOut(S) {
    await S.narr(['arrive', 'eve'].includes(S.f.act) ? '楼梯通到楼下。你是来喂猫的，还没进门呢。' : '楼下是大街和铲雪的声音。……你还不能走。猫还在屋里，事情也还没完。');
    await S.walk('pl', 'r', 6);
  }
  async function door5c(S) {
    if (S.once('matKey')) { S.sfx('item'); await S.narr('你掀开门垫。一把铜钥匙，拴着一个猫爪形状的钥匙扣。'); }
    S.sfx('open'); await S.go('apt', 16, 2, 0);
  }
  async function bethTalk(S) {
    const f = S.f; S.face('beth', 'pl');
    if (!['day', 'day2'].includes(f.act)) return;
    if (!f.bethTold) return bethStory(S);
    const r = await S.ask('「还有什么事？」', ['「梦里有个穿黄雨衣的小女孩，告诉我规矩。」', '「那把绿摇椅……」', '「只能问两个问题——这规矩是哪儿来的？」', '「没什么了。」'], '贝丝');
    if (r === 2) {
      await S.say('贝丝', ['……那是露丝的规矩。我在他们家过夜的时候，她也这么管我们俩。', '关了灯，大卫总有问不完的问题。露丝就说：', '「两个问题，然后睡觉。第三个——妈妈要生气了。」'], WS);
      return S.think('两个问题，然后睡觉。\n……原来那不是诅咒。是一个妈妈的睡前规矩。');
    }
    if (r === 3) return S.say('贝丝', '晚上要是又梦见他……只问两个。', WS);
    if (r === 0) {
      await S.say('贝丝', ['……黄雨衣？', '我九岁那年有一件，露丝给我买的。大卫老说我像一只鸭子。', '……我也梦见过他，你知道吗。小时候，好多次。梦里，我站在他家的卧室门口，跟一个睡在他床上的陌生人说话。', '我一直以为那只是个梦。'], WS);
      return;
    }
    if (r === 1) {
      await S.say('贝丝', ['那是露丝的椅子。她早上下了夜班，就抱着大卫坐在上面摇，一摇就是一个钟头，两个人都睡着了。', '她搬走的时候说，她没法再坐上去了，就扔在了地下室。……没想到又被人搬上来了。', '要我说，把它扔了。扔到大街上去，让清洁车拉走。'], WS);
      f.curbIdea = true; return;
    }
  }
  async function bethStory(S) {
    const f = S.f;
    await S.say('贝丝', '早。……你脸色真差。昨晚睡沙发了？');
    await S.ask('你说：', ['「我梦见一个小男孩。他说他叫大卫。」', '「以前住在5C的，是什么人？」'], '贝丝');
    S.sfx('thud'); await S.narr('贝丝手里的洗衣篮掉在了地上。');
    await S.say('贝丝', ['……大卫。', '我九岁那年，5C住着露丝和她儿子大卫。七岁，瘦瘦小小的，脖子上老挂着家门钥匙，红绳子拴着。', '露丝在河边的服装仓库上夜班，每天晚上十二点到家。', '她跟大卫有个暗号：她在楼梯上就开始哼歌，一边哼一边上楼，走到门口正好哼完——钥匙一转，门开了，大卫扑上来。别人敲门，一律不许开。'], WS);
    hum(S, '35', 0, .55, .12); S.tone('sine', 400, 380, .6, .06, 1.1, 1500);
    await S.say('贝丝', ['小、大……后面我记不住了。四十年了，整栋楼都听过的。', '那年冬天，有一晚下大雪，地铁停在半路，露丝晚回来了四十分钟。……后面的事，你别问了。', '等等。露丝搬走的时候，托我妈保管过一个箱子。说好了回来拿，可她再也没回来。'], WS);
    f.kHum = true; f.bethTold = true;
    S.ent('door5d').s.ajar = true; S.sfx('open');
    await S.walk('beth', [14, 2], 3); S.hide('beth'); await S.wait(900);
    S.show('beth'); await S.walk('beth', [13, 3], 3); S.face('beth', 'pl');
    f.boxDown = true; S.show('rbox'); S.sfx('thud'); S.ent('door5d').s.ajar = false;
    await S.say('贝丝', '露丝前几年走了。她外甥说，她最后那几天一直在念叨：「我得回家，给他开门。」……东西你看吧。', WS);
    S.goal('看看露丝的箱子（贝丝放在走廊地上了）');
    S.cp();
  }
  async function boxOn(S) {
    const f = S.f;
    if (!f.boxRead) {
      await S.narr('一只旧纸箱，胶带早就脆了。\n里面是一条红围巾、一双小孩的连指手套、几张照片——还有一封没寄出去的信，和一张对折的作业纸。');
      await S.note('letter');
      await S.note('lullaby');
      S.give('photo');
      f.kKey = true; f.boxRead = true;
      await S.think('露丝回家的样子：在楼梯上哼歌，走到门口，钥匙一转。\n可是歌词纸上的调子，被水泡掉了两个音。露丝的钥匙交回去了；大卫那把，谁也不知道在哪儿。\n\n……只有大卫知道。');
      await S.think('今晚，我只能问他两个问题。');
      S.goal('天黑后，回5C在沙发上睡下。今晚只问两个——想好问哪两个（两人时：一人在「笺」里看露丝的信和歌词）');
      S.cp(); return;
    }
    const r = await S.ask('露丝的箱子。', ['看那封信', '看歌词纸', '（合上箱子）']);
    if (r === 0) await S.note('letter'); else if (r === 1) await S.note('lullaby');
  }

  /* ======================= 公寓（现实） ======================= */
  async function aptFirst(S) {
    S.f.act = 'eve'; aptStage(S);
    meow(S, .1); S.bubble('cat1', '!', 900);
    await S.narr('门一开，两只猫就迎了上来：白底黄斑的那只叫棉花，黑的那只叫煤球。\n屋里很暖，暖得发闷。一半的东西已经装进了纸箱。');
    await S.think('他说过：卧室角落那把绿摇椅。……我先别往卧室看。');
    S.goal('喂猫（厨房地上的猫碗），再看看他书桌上的笔记本电脑');
    S.cp();
  }
  async function catOn(S, k) {
    const a = S.f.act;
    meow(S, .09);
    if (a === 'eve' && S.f.midnight) { if (k === 2) purr(S); return S.narr(k === 1 ? '棉花仰着头，眼睛一眨不眨地盯着猫眼。你挡在它前面，它就绕过你，接着看。' : '煤球的尾巴竖得笔直，尾巴尖一抖一抖。它在冲着门「咕噜咕噜」——那是它见到熟人才有的声音。'); }
    if (['day', 'day2'].includes(a)) return S.narr(k === 1 ? '棉花蜷在沙发上睡得正香。它们守了一夜的门。' : '煤球在舔爪子。它的左前爪上，粘着一根褪色的红线头。');
    if (!S.f.fed) return S.narr(k === 1 ? '棉花蹭着你的裤腿，绕着圈喵喵叫。饿了。' : '煤球蹲在猫碗旁边，用一种「你迟到了」的眼神看着你。');
    return S.narr(k === 1 ? '棉花吃饱了，在地毯上打滚。' : '煤球吃完了，把碗舔得锃亮。');
  }
  async function bowlsOn(S) {
    if (S.f.act !== 'eve' || S.f.fed) return S.narr('猫碗。红的是棉花的，蓝的是煤球的。');
    S.f.fed = true; S.ent('bowls').s.full = true; S.sfx('item');
    await S.narr('你倒上猫粮，又换了清水。两只猫埋头就吃，「咔嚓咔嚓」响。');
    await S.walk('cat1', [10, 5], 4); S.place('cat2', 11, 4, 1);
    await evePost(S);
  }
  async function deskOn(S) {
    if (S.f.act !== 'eve' || S.f.readT2) {
      if (S.f.act === 'eve') return S.note('thread2');
      const r = await S.ask('他的电脑还停在推特页面上。', ['看推特串（一）', '看推特串（二）', '（合上）']);
      if (r === 0) await S.note('thread1'); else if (r === 1) await S.note('thread2');
      return;
    }
    await S.narr('他的笔记本电脑没关，屏幕停在推特页面上。\n那条串，他一直更新到上个月。');
    await S.note('thread2');
    S.f.readT2 = true;
    await S.think('三个问题……他问了三个，然后就不只在梦里了。\n「对不起。只问两个。」');
    await evePost(S);
  }
  async function evePost(S) {   // 两件事都做完：快十二点了，猫去门口排队
    const f = S.f;
    if (!(f.fed && f.readT2)) { S.goal(f.fed ? '看看他书桌上的笔记本电脑（卧室）' : '喂猫（厨房地上的猫碗）'); return; }
    if (f.midnight) return;
    await S.wait(500);
    await S.narr('你看了一眼手机：23:58。');
    chime(S); await S.wait(400);
    await S.narr('隔壁贝丝家的座钟，提前敲了起来。');
    S.ent('cat1').s.up = false; S.ent('cat2').s.up = false;
    await Promise.all([S.walk('cat1', [15, 2], 3.5), (async () => { await S.wait(250); await S.walk('cat2', [16, 3], 3.5); })()]);
    S.face('cat1', 3); S.face('cat2', 3); S.ent('cat1').s.up = true; S.ent('cat2').s.up = true;
    f.midnight = true;
    purr(S, .3);
    await S.narr('两只猫同时停下，一前一后走到门口，坐好。\n仰着脸，一动不动，盯着门上的猫眼。煤球的喉咙里，「咕噜咕噜」地响——它只有见到熟人才这样。');
    await S.think('……他推特里写过。每天晚上，快十二点。');
    S.goal('在客厅沙发上睡下（他说过：别睡卧室）');
    S.cp();
  }
  async function aptDoor(S) {
    const a = S.f.act;
    if (a === 'eve' && S.f.midnight) {
      if (S.once('peep')) {
        await S.narr('你凑到猫眼上。\n走廊的灯管一闪一闪。空的。');
        S.sfx('heart'); await S.wait(500);
        await S.narr('……猫眼视野的最底下，有一撮头发。很低，低得像一个小孩的头顶。\n它贴着门，一动不动。');
        S.sfx('sting'); S.shake(300, 1.5);
        await S.narr('你往后退了一步。再凑上去——什么也没有了。');
        return S.think('猫眼开得很高。一个小孩要看外面，得踩着什么东西。');
      }
      return S.narr('你不想再看猫眼了。\n门把手是冰的，比屋里任何东西都冰。');
    }
    if (a === 'eve') return S.narr('门口的猫眼开得很高，你都得稍微踮一下脚。\n现在出去也没事可做。');
    S.sfx('open'); await S.go('hall', 9, 2, 0);
  }
  async function radOn(S) {
    const f = S.f;
    if (f.kKey) return S.narr('你趴下来往暖气片后面看。几十年的灰、一枚1979年的硬币、一颗玻璃弹珠。\n没有钥匙。——在这边，没有。');
    if (f.kStool) return S.narr('老式铸铁暖气片，就在门边。边角很锋利，漆掉了一块。\n……门上的猫眼很高。一个踩着小板凳的孩子，要是从板凳上摔下来——\n你没再往下想。');
    await S.narr('老式铸铁暖气片，烫手，「咣当咣当」地响，像有人在里面敲。');
  }
  async function camOn(S) {
    const a = S.f.act;
    if (a === 'eve') return S.narr('书架顶上的宠物摄像头，红灯一闪一闪。\n他推特里那段摇椅自己摇的视频，就是它拍的。');
    if (!S.once('camReplay')) return S.narr('宠物摄像头的红灯一闪一闪。你不想再看一遍回放了。');
    await S.narr('你用他的电脑打开宠物摄像头的回放。昨晚，00:00。');
    S.sfx('tv');
    await S.narr('00:00:12　两只猫坐在门口，仰着头。\n00:01:40　卧室门口那一角画面里，绿摇椅开始摇。没有人。');
    creak(S, 3);
    await S.narr('00:02:05　墙上的龟壳「啪」地掉在地上。两只猫一起回头。\n00:02:31　茶几上的绿玻璃罐，慢慢地，自己滑到了另一头。');
    S.sfx('heart');
    await S.narr('00:03:18　沙发上，你坐了起来。\n你闭着眼睛，站起身，光着脚，一步一步，走进了卧室。');
    S.fx('static', { dur: .5 });
    await S.narr('00:03:19　画面一片雪花。\n03:00:00　五分钟的沙沙声。\n06:10:44　你躺在沙发上，好好的。');
    await S.think('……我从来没有梦游过。');
  }
  async function rockerOn(S) {
    const f = S.f, a = f.act;
    if (a === 'eve') return S.narr(f.midnight ? '绿摇椅一动不动。可是你刚才从卧室门口经过的时候，明明听见它「吱呀」了一声。' : '就是它。一把漆成墨绿色的木头摇椅，坐垫磨得发亮。\n你没有碰它。它很轻地，前后晃了一下。');
    if (!['day', 'day2'].includes(a)) return;
    const opts = ['（就这么看着它）'];
    if (S.has('photo') && !f.photoOn) opts.push('把露丝的照片放在椅背上');
    opts.push('把它搬下楼，扔到路边去');
    await S.narr(f.kChair ? '露丝的椅子。坐垫上，有两块颜色更深的地方——一大一小。' : '绿摇椅。白天看，它只是一把旧椅子。');
    const r = await S.ask('你想……', opts);
    const o = opts[r];
    if (o.startsWith('把露丝')) { S.take('photo'); f.photoOn = true; S.ent('rocker').s.photo = true; S.sfx('paper'); return S.narr('你把照片轻轻靠在椅背上。照片里，围红围巾的女人抱着孩子，就坐在这把椅子上。\n椅子很轻地，摇了一下。'); }
    if (o.startsWith('把它搬')) return curbEnd(S);
  }
  async function curbEnd(S) {
    const r = await S.ask(S.f.curbIdea ? '贝丝说：扔了吧。让清洁车拉走。' : '只要椅子不在这屋里，他就不会来了吧？', ['扛下楼，扔掉', '……算了'], '');
    if (r === 1) return;
    S.sfx('thud'); await S.fade(1, 800);
    await S.narr('你把那把绿摇椅扛下五楼，放在了路边的垃圾桶旁。\n雪落在椅面上，它在风里，很轻地摇着。');
    S.hide('rocker');
    await S.end({ bad: true, id: 'curb', title: '路边的摇椅', text: '那天夜里，你睡得很沉，什么也没梦见。\n两只猫在门口坐了一整夜，天亮才散。\n\n第三天早上，你在楼门口碰见二楼新搬来的一家人。\n他们正把一把绿色摇椅抬进门，说是在路边捡的，刷刷漆还能用。\n\n他们家有个七岁的男孩。\n男孩趴在楼梯扶手上，问他妈妈：\n「妈妈，你晚上几点下班？」' });
  }
  async function sofaOn(S) {
    const f = S.f, a = f.act;
    if (a === 'eve' && !f.midnight) return S.narr('沙发上搭着一条毯子。现在还早——先把猫喂了，看看他留下的东西。');
    if (a === 'eve') return sleep1(S);
    if (a === 'day' || a === 'day2') {
      if (!(f.kHum && f.kKey)) {
        f._sofaN = (f._sofaN || 0) + 1;
        await S.narr('你还不困。天还亮着。');
        if (!f.bethTold) return S.think(f._sofaN > 1 ? '对门的贝丝在这楼里住了一辈子。去走廊问问她，以前5C住的是谁。' : '「这是我家」「等妈妈」……以前住在5C的是谁？问问邻居。');
        return S.think('贝丝把露丝的箱子放在走廊上了。先看看里面有什么。');
      }
      return a === 'day' ? sleep2(S) : sleep2b(S);
    }
  }

  /* ======================= 第一夜 ======================= */
  async function sleep1(S) {
    await S.narr('你关了灯，裹上毯子，在沙发上躺下。\n门口，两只猫的影子一动不动。');
    await S.fade(1, 900);
    await S.card('00:00', '', '你没有听见座钟敲十二下。\n你只听见，卧室里——\n\n吱——呀。\n吱——呀。');
    S.f.act = 'n1';
    await S.go('dream', 1, 3, 0, { ms: 500 });
    dreamBed(S, 1); S.hide('dv'); S.ent('d_rock').s.rock = true;
    creak(S, 3);
    await S.narr('你醒了。你躺在他的床上——你明明睡在沙发上。\n窗外，城市一点声音都没有。');
    await S.narr('你动不了。手指、脚趾，连眼皮都动不了。只有眼珠能转。');
    S.focus(6, 3); creak(S, 2);
    await S.narr('角落里，那把绿摇椅在自己摇。\n吱——呀。吱——呀。');
    await S.alpha('dv', 1, 1500);
    await S.narr('椅子上坐着一个小男孩。条纹睡衣，光着脚。\n他的头，一边是瘪的。');
    S.focus(null); const d = S.ent('dv'); d.oy = 0; S.ent('d_rock').s.rock = false;
    drag(S, 4, .75); await S.walk('dv', [4, 4], 1.3); await S.walk('dv', [3, 4], 1.3); S.face('dv', 1);
    await S.narr('他从椅子上下来，拖着脚，一步，一步，朝床走过来。');
    S.sfx('heart');
    S.show('girl'); S.ent('girl').alpha = 0; await S.alpha('girl', .9, 900);
    await S.say('门口的小女孩', ['你遇上的是「亲爱的大卫」。他已经死了，只在午夜出来。', '你可以问他两个问题。每一个，前面都要先叫「亲爱的大卫」。', '不能问第三个。……上一个人问了三个。他跑得快。'], WS);
    await S.alpha('girl', 0, 900); S.show('puddle');
    await S.narr('门口空了。只剩黄雨衣滴下来的水，在地板上汪成一小摊。');
    await S.say('大卫', '……', WS);
    S.cp('n1');
    await qa(S, 1);
  }
  function dreamBed(S, night) {   // 躺在梦里的床上，动不了
    S.hidePlayer(true); S.pos(1, 3, 0); S.ent('d_bed').s.occ = true; S.plr(1.2);
    S.ent('d_cat1').s.up = true; S.ent('d_cat2').s.up = true; S.place('d_cat1', 14, 3, 3); S.place('d_cat2', 17, 3, 3);
    S.ent('d_stool').s.tip = night === 2;
    S.hide('girl'); S.hide('ruth');
  }

  /* ======================= 问答 ======================= */
  async function qa(S, night) {
    const f = S.f;
    let left = (night === 1 ? QN1 : QN2).filter(k => !QS[k].need || QS[k].need(f));
    let n = 0, wasted = 0;
    while (n < 2) {
      const r = await S.ask(n === 0 ? '他在等你开口。\n（只能问两个。每个问题前面，先叫「亲爱的大卫」）' + (night === 2 ? '\n（两人时：一人在「笺」里翻露丝的信，一人选问题）' : '') : '还能问一个。', left.map(k => QS[k].q + (f['asked_' + k] ? '（问过）' : '')));
      const k = left[r]; left = left.filter(z => z !== k); n++;
      await S.say('你', QS[k].q.slice(1, -1));
      if (QS[k].np) { wasted++; await noName(S, wasted); continue; }
      await answer(S, k);
    }
    await dav(S, '两个问题。……然后睡觉。');
    const c = await S.ask('他还站在那儿，看着你。', ['（闭上嘴。等这个梦过去。）', '（再问一个。）']);
    if (c === 1) {
      S.sfx('heart'); S.shake(300, 1);
      const r = await S.ask('第三个问题。你确定？', [...left.map(k => QS[k].q), '（……不。闭上嘴。）']);
      if (r < left.length) return thirdEnd(S, left[r]);
    }
    if (night === 1) return wake1(S);
    if (f.gotSong && f.gotKey) return riteStart(S);
    return n2Fail(S);
  }
  async function answer(S, k) {
    const f = S.f, Q = QS[k];
    if (k === 'song') {
      await S.narr('他想了想，闭上眼睛，很轻很轻地哼了起来——');
      hum(S, TUNE, .3, .55, .13); await S.wait(3800);
      await dav(S, ['小、大、卫——第三个音要踮起脚，比第二个高一格。', '别、睡、着——第五个音，和第一个一样。', '……妈妈哼完，钥匙就响了。']);
    } else if (f['asked_' + k] && !Q.set) {
      await dav(S, '……我说过了。');
    } else await dav(S, Q.a);
    f['asked_' + k] = true;
    if (Q.set) f[Q.set] = true;
    if (Q.set === 'gotSong' || Q.set === 'gotKey') S.goal('记住：' + [f.gotKey && '钥匙在门口的暖气片后面', f.gotSong && TUNEHINT].filter(Boolean).join('；'));
  }
  async function noName(S, w) {
    const f = S.f;
    await S.narr('他歪了歪头。没有回答。');
    if (S.once('npRule')) await S.say('小女孩的声音', '你没有叫他。不叫「亲爱的大卫」，他就不回答——可这也算一个问题。', WS);
    drag(S, 1, .7, .3); S.sfx('heart');
    if (w === 1) { await S.walk('dv', [2, 4], 1.4); S.face('dv', 3); return S.narr('他拖着脚，往床边挪了一步。'); }
    await S.walk('dv', [2, 3], 1.4); S.face('dv', 1);
    if (faceOK(S)) await S.scare('face', { spr: '@david', dur: .8 }); else { S.fx('static', { dur: .5 }); S.sfx('sting'); }
    await S.narr('他就站在床边，低着头看你。离你的脸只有一个巴掌远。\n你闻到一股旧毛衣和铁锈的味道。');
  }
  async function thirdHint(S) { S.sfx('heart'); await S.think(THIRD === 1 ? '……两个。只问两个。\n问完了，就闭上嘴，等这个梦过去。' : '不管多想知道——第三个，不能问。'); }
  async function thirdEnd(S, k) {
    THIRD++;
    await S.say('你', QS[k].q.slice(1, -1));
    S.amb('none'); await S.wait(700);
    await S.narr('他没有回答。\n他慢慢地，把那颗瘪了一块的头，转向你。');
    drag(S, 2, .5, .34); await S.walk('dv', [2, 3], 2); S.face('dv', 1);
    await dav(S, ['三个了。', '妈妈说，第三个问题……就轮到我问了。']);
    S.shake(600, 2);
    await S.say('大卫', '你能留下来，陪我等妈妈吗？', { style: 'big' });
    await S.scare('face', { spr: '@david', dur: 1.1, sfx: 'scream' });
    await S.end({ bad: true, id: 'third', title: '第三个问题', text: '早上，两只猫在门口叫了很久。\n对门的贝丝敲了半天门，最后叫来了管理员。\n\n你躺在他的床上，表情很安详，像在等什么人。\n\n卧室角落里，那把绿摇椅轻轻地摇着。\n吱——呀。吱——呀。\n像是有两个人，挤在上面。' });
  }
  async function wake1(S) {
    await S.narr('他转过身，拖着脚，走回那把摇椅，坐下。\n椅子又摇了起来。吱——呀。');
    await S.fade(1, 1000);
    S.f.act = 'day'; S.hidePlayer(false); S.plr(null); S.ent('d_bed').s.occ = false; S.hide('dv');
    await S.go('apt', 12, 7, 0, { ms: 400, fade: false });
    await S.card('早上 06:10', '', '你在沙发上醒过来。毯子掉在地上。\n手机屏幕亮着，是睡眠App的推送：\n「昨晚 03:00—03:05，检测到持续噪音。」\n\n你点开。只有沙沙的雪花声。');
    await S.fade(0, 600);
    await photos(S);
    const f = S.f, got = [f.kChair && '「这是我家」「那是妈妈的椅子」', f.kStool && '「门上的小洞太高了」「小板凳」', f.kWait && '「等妈妈，十二点」'].filter(Boolean);
    await S.think(got.length ? '他说的话，我都记得：\n' + got.join('\n') + '\n\n……他以前就住在这儿。' : '我什么也没问出来。\n可他看我的样子，像这屋子是他的。');
    await S.think('对门的老太太在这楼里住了很多年。去问问她，以前5C住的是谁。');
    S.goal('去走廊问问对门5D的邻居：以前5C住的是谁');
    S.cp();
  }

  async function photos(S) {   // 名场面：每六十秒一张——你没有拍过的照片
    await S.narr('相册里多了三张照片。拍摄时间 00:04、00:05、00:06。\n你没有拍过。三张都是全黑的。');
    S.sfx('paper'); S.fx('flash', { dur: .3 });
    await S.narr('你把亮度拉到最高。\n第一张：卧室。绿摇椅上，趴着一个小小的人影。');
    S.sfx('heart'); S.fx('flash', { dur: .3 });
    await S.narr('第二张：床。床上躺着你，眼睛睁着。\n床边站着一个小孩，低着头，在看你。');
    S.sfx('heart'); await S.wait(500);
    await S.narr('第三张——');
    if (faceOK(S)) await S.scare('face', { spr: '@david', dur: .8 }); else S.fx('static', { dur: .6 });
    await S.narr('他的脸，贴在镜头上。\n眼睛的地方，是两个黑洞。');
  }
  function faceOK(S) { const n = S.f.faceN || 0; if (n >= 2) return false; S.f.faceN = n + 1; return true; }   // 剧情里的大头像最多两次，死亡和第三个问题另算

  /* ======================= 第二夜：仓库 ======================= */
  async function sleep2(S) {
    await S.fade(1, 800);
    await S.card('当天夜里　23:58', '', '两只猫又去门口排好了队。\n\n你把毯子拉到下巴，盯着天花板。\n调子，和钥匙。\n只问两个。');
    S.f.act = 'n2';
    await S.go('ware', 2, 12, 2, { ms: 400 });
    wareLight(S); S.place('wdv', 3, 12, 1); S.ent('wdv').alpha = 1;
    await S.narr('你不在沙发上。\n你站在一座很大的仓库里，一排排铁架子一直排进黑暗里，空气里全是布料和机油的味道。');
    await S.narr('有一只冰凉的小手，攥着你的手腕。');
    S.face('pl', 2);
    await dav(S, '妈妈在这里上班。我们去找她。');
    drag(S, 3, .6);
    await Promise.all([S.walk('wdv', [6, 12], 2.2), (async () => { await S.wait(300); await S.walk('pl', [5, 12], 2.2); })()]);
    await dav(S, ['妈妈？……', '妈妈——？']);
    S.tone('sine', 900, 860, .6, .02, .4, 0); S.tone('sine', 900, 860, .6, .01, 1.2, 0);
    await S.wait(900);
    await dav(S, ['妈妈不在。', '……你也要走了吗？大家都走了。']);
    S.sfx('switch'); await S.alpha('wdv', 0, 700); S.hide('wdv');
    await S.narr('他松开了手。\n黑暗里，什么都没有了。');
    S.focus(19, 2);
    await S.narr('仓库最远的那一头，亮着一盏红色的「出口」灯。');
    S.focus(17, 11); meow(S, .12);
    await S.narr('「喵——」\n……煤球？黑猫蹲在架子的缺口那儿，两只眼睛发着绿光。');
    S.focus(null);
    await S.narr('你想跑。可是在梦里，腿像灌了铅。');
    S.cp('ware');
    startChase(S);
  }
  function behind(S, k) {   // 沿着来路往回数 k 格（BFS 距离为 k、且离起点最近的格子），把甩开的大卫放在那儿
    const m = W.maps.ware, w = m.w, h = m.h, bfs = (sx, sy) => { const D = new Map([[sx + ',' + sy, 0]]), q = [[sx, sy]]; while (q.length) { const [x, y] = q.shift(), d = D.get(x + ',' + y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, kk = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= w || ny >= h || D.has(kk) || tileSolid(m, nx, ny)) continue; D.set(kk, d + 1); q.push([nx, ny]); } } return D; };
    const fromP = bfs(W.pl.x, W.pl.y), fromS = bfs(1, 12), me = fromS.get(W.pl.x + ',' + W.pl.y) ?? 0; let best = null, bd = -1;
    for (const [kk, d] of fromP) { const ds = fromS.get(kk) ?? 1e9; if (d >= 2 && d <= k && ds < me && (d > bd || d === bd && ds < fromS.get(best))) { bd = d; best = kk; } }   // 只往来路上放，不会放到玩家前面
    return best ? best.split(',').map(Number) : [1, 12];
  }
  const SPD = 2.9;
  function startChase(S) {
    const f = S.f; f.chase = true; f._hb = 0; f._dg = 0; f._mw = 0;
    S.place('wdv', 1, 12, 2); S.ent('wdv').alpha = 1;
    drag(S, 2, .5, .3); S.sfx('heart');
    S.chase('wdv', { spd: SPD, catch: caught });
    S.ent('wdv').chase.wait = 1.3;
    S.goal('身后有拖着脚的声音——跟着煤球的绿眼睛，找到出口（梦里跑不起来，别停下）');
  }
  async function caught(S) {
    const f = S.f;
    if (!f.grabbed) {   // 第一次：挣脱，留一圈淤青；他被甩开几步
      f.grabbed = true; S.sfx('thud'); S.shake(500, 3); S.fx('red', { dur: .6 });
      await S.narr('一只冰凉的小手攥住了你的胳膊！\n你拼命一甩——挣开了。胳膊上火辣辣的。');
      const [bx0, by0] = behind(S, 4); S.place('wdv', bx0, by0, 0);
      await S.think('下一次，就挣不开了。别停。');
      S.chase('wdv', { spd: SPD, catch: caught }); S.ent('wdv').chase.wait = .8;
      return;
    }
    DIED++; f.chase = false;
    if (DIED === 1) await S.scare('face', { spr: '@david', dur: .9 }); else { S.fx('static', { dur: .7 }); S.sfx('scream'); await S.wait(700); }
    await S.die('一只冰凉的小手攥住了你的胳膊，攥得很紧很紧。\n「留下来。」\n\n仓库的灯一盏一盏地灭了。', '留在了仓库里');
  }
  async function exitWare(S) {
    const f = S.f; if (!f.chase) return;
    f.chase = false; S.stop('wdv'); S.hide('wdv'); S.norun(false); S.speed(1);
    S.sfx('open');
    await S.narr('你撞开那扇门——');
    f.wareDone = true;
    await S.go('dream', 1, 3, 0, { ms: 600 });
    await n2Start(S);
  }
  async function n2Start(S) {
    const f = S.f;
    dreamBed(S, 2); S.place('dv', 6, 2, 0); const d = S.ent('dv'); d.oy = -3; d.alpha = 1; S.ent('d_rock').s.rock = true;
    creak(S, 2);
    await S.narr('——你又躺在他的床上。动不了。\n胳膊上，被他攥过的地方，火辣辣地疼。');
    d.oy = 0; S.ent('d_rock').s.rock = false;
    const nf = f.n2fail || 0;
    drag(S, 3 + nf, .75); await S.walk('dv', [3, 4], 1.3);
    if (nf >= 1) { S.sfx('heart'); await S.walk('dv', [2, 4], 1.3); }
    if (nf >= 2) { await S.walk('dv', [2, 3], 1.3); S.fx('static', { dur: .4 }); S.sfx('sting'); }
    S.face('dv', nf >= 2 ? 1 : nf ? 3 : 1);
    if (nf) await S.narr(nf >= 2 ? '他没有在床尾停下。他一直走到你枕头边，低头看着你。\n……他的耐心，快用完了。' : '他比昨晚走得更近了。');
    await dav(S, '……');
    const need = [!f.gotSong && '缺的那两个音', !f.gotKey && '大卫的钥匙'].filter(Boolean);
    await S.think(need.length === 2 ? '调子缺的那两个音。钥匙在哪儿。\n两个问题。先叫他的名字。' : '还差' + need[0] + '。\n两个问题——每一个，都先叫他的名字。');
    S.cp('n2');
    await qa(S, 2);
  }
  async function n2Fail(S) {
    const f = S.f; f.n2fail = (f.n2fail || 0) + 1;
    await S.narr('他转过身，拖着脚，走回那把摇椅。\n「两个问题」——他说话算话。');
    await S.fade(1, 1000);
    f.act = 'day2'; S.hidePlayer(false); S.plr(null); S.ent('d_bed').s.occ = false; S.hide('dv');
    await S.go('apt', 12, 7, 0, { ms: 400, fade: false });
    await S.card('清晨 06:10', '', '你在沙发上醒过来。\n胳膊上一圈青紫的指印，很小，像小孩的手。');
    await S.fade(0, 600);
    const n = f.n2fail, miss = [!f.gotSong && '调子缺的两个音', !f.gotKey && '钥匙藏在哪儿'].filter(Boolean);
    if (n === 1) await S.think('我问错了。\n露丝回家要两样东西：她哼的调子，和一把钥匙。\n现在还缺：' + miss.join('、') + '。只有大卫知道。');
    else if (n === 2) await S.think('还缺：' + miss.join('、') + '。\n露丝那把钥匙早就交回去了——要问的是大卫自己那把，拴红绳的。\n还有：每一个问题，都得先叫「亲爱的大卫」。没叫的，他不回答，也照样算一个。');
    else await S.think('今晚就问这个：\n' + [!f.gotSong && QS.song.q, !f.gotKey && QS.key.q].filter(Boolean).join('\n') + '\n一个字都别漏。');
    S.goal('天黑后，在沙发上睡下。今晚还缺：' + miss.join('、'));
    S.cp();
  }
  async function sleep2b(S) {   // 仓库已经逃出来过：直接回到卧室
    await S.fade(1, 800);
    await S.card('那天夜里　00:00', '', '吱——呀。\n吱——呀。');
    S.f.act = 'n2';
    await S.go('dream', 1, 3, 0, { ms: 400 });
    await n2Start(S);
  }

  /* ======================= 第二夜：回家的路 ======================= */
  async function riteStart(S) {
    await dav(S, ['……妈妈快回来了。', '我去门口等。']);
    S.ent('d_bed').s.occ = false;
    drag(S, 6, .5, .2);
    await S.walk('dv', [[8, 5], [15, 3]], 2.2); S.face('dv', 3);
    riteSet(S);
    await S.narr('你能动了。\n大卫站在门口那张小板凳旁边，仰着头，看着门上的猫眼。两只猫一左一右，陪着他。');
    await S.think('露丝回家的样子：在楼梯上开始哼，走到门口正好哼完，钥匙一转。\n先拿到钥匙。');
    S.goal('拿到门口暖气片后面的钥匙，从前门出去');
    S.cp('rite');
  }
  function riteSet(S) {
    S.f.act = 'rite';
    S.hidePlayer(false); S.plr(null); S.ent('d_bed').s.occ = false;
    if (S.map === 'dream' && W.pl.y < 12 && W.pl.x === 1 && W.pl.y === 3) S.pos(2, 4, 0);
    S.place('dv', 15, 3, 3); S.ent('dv').oy = 0; S.ent('d_rock').s.rock = false; S.ent('d_stool').s.tip = false;
    S.ent('d_rad').s.glint = !S.has('rkey') && !S.f.keyTaken;
  }
  async function dRad(S) {
    const f = S.f;
    if (f.act !== 'rite') return S.narr('暖气片冰凉。梦里的暖气片，一点热气都没有。');
    if (S.has('rkey')) return S.narr('暖气片后面空了。只剩一圈灰尘印子，正好一把钥匙那么大。');
    await S.narr('你趴下来，把手伸进暖气片后面。\n灰，很厚的灰。然后——一截细细的绳子。');
    S.give('rkey'); f.keyTaken = true; S.ent('d_rad').s.glint = false;
    await S.narr('一把黄铜钥匙，拴着褪色的红绳。绳子断过，打了一个小小的死结。\n摸上去，是温的。');
    S.bubble('dv', '!', 900); S.face('dv', 2);
    await dav(S, '那是我的。……妈妈说，别弄丢。');
    S.face('dv', 3);
    S.goal('从前门出去（门在你身后会锁上）');
  }
  async function dDoor(S) {
    const f = S.f;
    if (f.act !== 'rite') return S.narr('门把手转不动。门外，很远很远的地方，有人在楼梯上走。');
    if (!S.has('rkey')) return S.narr('门没锁。可你知道：出去了，就得自己开门进来。\n先把钥匙拿到。');
    S.face('dv', 'pl');
    await dav(S, ['妈妈说，谁敲门都不许开。', '只有听见她哼歌，听见钥匙响，才开。']);
    S.sfx('open'); await S.go('dream', 9, 25, 0, { ms: 500 });
    S.sfx('close'); await S.wait(300); S.sfx('locked');
    await S.narr('门在你身后关上了。咔哒。\n走廊很长，灯管一闪一闪。最左边，是楼梯口。');
    S.goal('回到走廊最左边的楼梯口，像露丝那样，一边哼一边上楼（两人时：一人在「笺」里看歌词纸）');
    S.cp('rite');
  }
  async function hDoor(S) {
    if (S.f.act !== 'rite') return;
    if (!S.f.hummed) {
      await S.narr('你把钥匙举到锁眼前——停住了。\n门里面，一个小孩的呼吸声，贴着门板。');
      return S.think('不能就这么开。他会害怕。\n露丝是从楼梯上开始哼的。');
    }
  }
  async function stairsHum(S) {
    const f = S.f;
    if (f.act !== 'rite') return;
    if (!S.has('rkey')) return S.narr('楼梯通向楼下的黑暗。');
    const v = await S.keypad('像露丝那样，一边上楼一边哼。\n小　大　卫，别　睡　着\n大卫说：' + TUNEHINT + '\n（歌词纸在「笺」里 · 1 do　2 re　3 mi　4 fa　5 sol　6 la　7 si）', ['1', '2', '3', '4', '5', '6', '7'], 6);
    if (v == null) return;
    hum(S, v, 0, .45, .12);
    await S.wait(2900);
    if (v === TUNE) return homecoming(S);
    f.humFail = (f.humFail || 0) + 1;
    const known = [0, 1, 3, 5].every(i => v[i] === TUNE[i]);
    S.sfx('heart');
    await S.narr(known ? '最后一个音落下。门里面，那串小小的脚步声跑到一半——停住了。\n被水泡掉的那两格，不对。' : '你哼完了。门里面一点动静都没有。\n……纸上写得清清楚楚的那几格，你哼错了。');
    if (f.humFail === 1 && S.once('peepBlack')) { S.fx('static', { dur: .5 }); S.sfx('sting'); await S.narr('5C门上的猫眼，忽然黑了。\n有什么东西，从里面，贴了上来。'); await S.say('门里面', '……你不是妈妈。', WS); }
    if (f.humFail === 2) await S.think('纸上：3　5　▒　5　▒　1。\n缺的两格，大卫哼给我听过，也说过它们是什么。');
    else if (f.humFail === 3) await S.think('「第三个音要踮起脚，比第二个高一格。」5 再高一格……\n「第五个音，和第一个一样。」');
    else if (f.humFail >= 4) await S.think('3　5　6　5　3　1。\n就是这个。');
  }
  async function homecoming(S) {
    const f = S.f; f.hummed = true;
    S.amb('none');
    await S.narr('你清了清嗓子，踩上第一级台阶——');
    hum(S, TUNE, 0, .62, .14);
    await S.walk('pl', [9, 25], 2.1); S.face('pl', 3);
    await S.narr('最后一个音落下的时候，你正好站在5C门口。');
    S.take('rkey'); S.sfx('switch'); await S.wait(400);
    await S.narr('你把红绳钥匙插进锁眼，一转——\n咔哒。');
    S.tone('sine', 120, 90, .15, .2, 0, 0); S.tone('sine', 120, 90, .15, .2, .25, 0); S.tone('sine', 120, 90, .15, .2, .5, 0);
    await S.narr('门里面，一串小小的、光着脚的脚步声，「啪嗒啪嗒」地跑了过来。');
    await S.walk('pl', 'd', 3); S.face('pl', 3);
    S.sfx('open'); S.place('dv', 9, 25, 0); S.ent('dv').alpha = 1;
    await S.narr('门开了。\n大卫站在门口，仰着头。他看着你——不，他在看你身后。');
    hum(S, TUNE, 0, .62, .1);
    S.show('ruth'); S.ent('ruth').alpha = 0; await S.alpha('ruth', .85, 1400);
    await S.narr('楼梯口，有人在跟着哼。\n一个围红围巾的女人，一级一级地走上来，肩膀上落满了雪。');
    await S.walk('ruth', [8, 25], 1.8); S.face('ruth', 2); S.face('dv', 1);
    await S.say('露丝', ['我回来了，大卫。', '……对不起。妈妈晚了。'], WS);
    await dav(S, '妈妈！', { style: '' });
    await S.narr('他扑了过去。她蹲下来，接住了他，把那颗瘪了一块的小脑袋，按进自己的围巾里。');
    await S.say('露丝', '两个问题。然后睡觉。', WS);
    await dav(S, '你为什么回来晚了？');
    await S.say('露丝', '下大雪了。地铁停在半路。妈妈是一路跑回来的。', WS);
    await dav(S, '……你还走吗？');
    await S.say('露丝', '不走了。', WS);
    if (f.photoOn) {
      S.face('ruth', 0);
      await S.say('露丝', ['……谢谢你，把我们的照片放回椅子上。', '我在那把椅子上，抱着他摇了七年。'], WS);
    } else { S.face('ruth', 0); await S.narr('她抬起头，看了你一眼，很轻地点了点头。'); }
    S.face('ruth', 3); S.face('dv', 3);
    await Promise.all([S.alpha('ruth', 0, 1800), S.alpha('dv', 0, 1800)]);
    S.sfx('close');
    await S.narr('门很轻地关上了。\n门里面，有人在哼歌，越哼越轻，越哼越轻。\n吱——呀。吱——呀。');
    S.sfx('chime');
    await S.fade(1, 1500);
    await S.card('早上', '', '你在沙发上醒过来。\n两只猫一左一右，蜷在你脚边，睡得正沉。\n它们第一次没有守着门。\n\n卧室里，那把绿摇椅一动不动。\n茶几上，放着一截褪色的红绳。');
    await S.end({ id: 'home', title: '第一夜　完', text: '你把露丝的箱子还给了贝丝。那截红绳，你系在了5C门后的钉子上。\n' + (f.photoOn ? '照片留在了摇椅上。照片里的女人抱着孩子，笑得很好看。\n' : '') + '\n你给他发了一条私信：「结束了。」\n过了很久，他回：「你问了几个？」\n\n你回：「两个。」' });
  }
})();
