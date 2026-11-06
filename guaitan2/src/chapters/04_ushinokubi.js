/* ================= 第四夜 · 牛首 ================= */
(() => {
  /* ---------- 颜色 ---------- */
  const BLUE = 'rgba(120,160,255,.20)';
  const WARM = 'rgba(255,175,90,.22)';
  const MOON = 'rgba(150,175,220,.08)';
  const NUM = '一二三四五六七八九十';

  /* ---------- 合成音效（S.tone，双方都听得到） ---------- */
  /* 拍子木：两声干脆的「梆、梆」，一个故事开始/结束 */
  function clack(S) { S.tone('square', 2100, 1900, .035, .09, 0, 5000); S.tone('square', 2300, 2000, .035, .08, .17, 5000); }
  /* 掐灭灯芯：一声很短的「嗤」 */
  function snuff(S, v = .03) { S.tone('sawtooth', 900, 180, .16, v, 0, 1200); S.tone('sine', 300, 120, .2, v, 0); }
  /* 很远的地方，一声牛叫：低沉、拖长、往下沉 */
  function moo(S, v = .05) { S.tone('sawtooth', 118, 84, 1.8, v, 0, 360); S.tone('sawtooth', 121, 86, 1.8, v * .6, .04, 300); S.tone('sine', 59, 42, 1.8, v * .8, 0); }
  /* 隔着纸门听见有人在讲话：听不清字，只有一起一伏的调子 */
  function murmur(S, n = 6, vol = .022) { for (let i = 0; i < n; i++) { const f = 140 + Math.random() * 110; S.tone('triangle', f, f * (.85 + Math.random() * .2), .09 + Math.random() * .1, vol, i * .13, 650); } }
  /* 心跳 */
  function heart(S, v = .09) { S.tone('sine', 62, 40, .14, v, 0); S.tone('sine', 58, 38, .14, v * .8, .24); }
  /* 耳鸣：话到了嘴边的那一下 */
  function ring(S) { S.tone('sine', 3200, 3100, 1.2, .02, 0); S.tone('sine', 3260, 3150, 1.1, .012, .02); }
  /* 天亮，山下寺里的钟 */
  function bell(S) { S.tone('sine', 392, 390, 3, .05, 0); S.tone('sine', 784, 780, 2.2, .025, 0); S.tone('sine', 1176, 1170, 1.4, .012, 0); }

  /* 死过几次（重来时给一句规则小结） */
  const DIED = { accuse: 0, final: 0 };

  /* 剩下几根灯芯（行灯上画出来） */
  function setCnt(S, n) { S.f.cnt = n; const a = S.ent('andon'); if (a) a.num = 100 - n; S.dark(Math.min(.93, .8 + (n - 88) * .012), 'hall'); }

  defChapter({
    id: 'ushinokubi', n: 4, title: '牛首', sub: '世上最可怕的怪谈。人人都听过它的名字，却没有一个人讲得出它的内容。', origin: '日本都市传说「牛の首」', color: '#26304a',
    icon: '@ushicard', amb: 'rain', floor: 'tatami', wall: 'shoji', dark: .8, plr: 2.8,
    endings: { ninetynine: '第九十九支', silent: '一个字也没说（隐藏）', told: '你把它讲完了', hundred: '第一百支' },
    /* 选章卡片：一排蜡烛，只剩最后一支亮着 */
    thumb(g, w, h) {
      for (let i = 0; i < 9; i++) {
        const x = 8 + i * ((w - 16) / 9), hh = 8 + (i * 7 % 5);
        g.fillStyle = '#d8d0b8'; g.fillRect(x, h - 22 - hh, 4, hh);
        if (i === 8) { g.fillStyle = '#ffcf5a'; g.fillRect(x + 1, h - 22 - hh - 5, 2, 4); g.fillStyle = 'rgba(255,200,120,.25)'; g.fillRect(x - 4, h - 22 - hh - 9, 12, 12); }
        else { g.fillStyle = '#3a3a40'; g.fillRect(x + 1, h - 22 - hh - 2, 2, 2); }
      }
    },
    /* 惊吓大头像（32×32） */
    faces: {
      /* 「牛首」：粗草袋套住了整个头，两只牛角戳破袋子；袋子上撕开一个洞，洞里是一只湿漉漉的牛眼睛。袋口底下，一张人的嘴还在讲 */
      ushi(R, a) {
        const S1 = '#a8884a', S2 = '#8a6c34', S3 = '#c4a462', HN = '#e8e0cc', HN2 = '#a89c84', K = '#120806', RB = '#b8b0a0';
        R(0, 27, 32, 5, RB); R(0, 27, 32, 1, '#d4ccbc'); R(11, 26, 10, 6, '#d8d0c0'); R(15, 26, 2, 6, '#9a9284');
        // 牛角：从袋子两角戳出来
        R(3, 0, 3, 7, HN); R(1, 0, 2, 3, HN); R(5, 5, 2, 2, HN2); R(26, 0, 3, 7, HN); R(29, 0, 2, 3, HN); R(25, 5, 2, 2, HN2);
        // 草袋
        R(7, 3, 18, 2, S1); R(5, 5, 22, 18, S1); R(4, 8, 24, 12, S1); R(6, 23, 20, 2, S1);
        for (let y = 6; y < 24; y += 3) R(5, y, 22, 1, S2);
        for (let x = 6; x < 27; x += 4) for (let y = 7; y < 23; y += 3) R(x + (y % 2), y, 1, 1, S3);
        R(4, 9, 1, 10, S2); R(27, 9, 1, 10, S2);
        // 撕开的洞和那只眼睛：a 越大，洞越大、眼睛越近
        const hw = 8 + Math.round(a * 3), hh = 6 + Math.round(a * 2), hx = 16 - (hw >> 1) - 1, hy = 10 - (a > .5 ? 1 : 0);
        R(hx - 1, hy - 1, hw + 2, hh + 2, S2); R(hx, hy, hw, hh, K);
        R(hx + 1, hy + 1, hw - 2, hh - 2, '#e2d6c0'); R(hx + 2, hy + 1, hw - 4, hh - 2, '#3a1c0c');
        R(hx + 2, hy + (hh >> 1) - 1, hw - 4, 2, '#000'); R(hx + hw - 4, hy + 1, 1, 1, '#ffffff');
        R(hx + 1, hy + hh - 2, hw - 2, 1, '#6a3020');
        // 草绳勒住袋口
        R(5, 24, 22, 2, '#5a4220'); R(14, 24, 2, 3, '#4a3418');
        // 袋口底下：一张人的嘴，一张一合
        const mh = 1 + Math.round(a * 2 + Math.sin(a * 20) * .8);
        R(12, 26, 8, 1, '#b07a6a'); R(13, 27, 6, Math.max(1, mh), '#2a0a0a'); R(12, 27 + Math.max(1, mh), 8, 1, '#a06a5a');
      },
      /* 濑川：苍白、头发分得整整齐齐、开领白衬衫。先是眯着眼笑，凑近了眼睛睁开——全是黑的，嘴一直在讲 */
      segawa(R, a) {
        const SK = '#ecdccc', SK2 = '#c8b4a4', H = '#0e0c10', H2 = '#2a2630', W1 = '#f4f2ea', W2 = '#cfcbbf';
        R(0, 26, 32, 6, W1); R(0, 26, 32, 1, W2); R(13, 25, 6, 7, SK2); R(10, 26, 4, 6, W2); R(18, 26, 4, 6, W2); R(14, 26, 4, 3, SK);
        R(13, 22, 6, 4, SK2);
        R(9, 5, 14, 2, SK); R(8, 7, 16, 13, SK); R(9, 20, 14, 2, SK); R(11, 22, 10, 1, SK);
        R(22, 8, 2, 11, SK2); R(8, 19, 1, 1, SK2);
        // 头发：七三分，梳得一丝不乱
        R(8, 2, 16, 4, H); R(7, 4, 2, 7, H); R(23, 4, 2, 6, H); R(9, 6, 5, 2, H); R(17, 6, 7, 1, H); R(13, 3, 1, 3, H2); R(14, 2, 1, 1, H2);
        if (a < .5) {
          // 眯着眼笑
          R(10, 12, 4, 1, '#3a2a2a'); R(18, 12, 4, 1, '#3a2a2a'); R(10, 11, 1, 1, '#3a2a2a'); R(21, 11, 1, 1, '#3a2a2a');
          R(13, 18, 6, 1, '#8a5a50'); R(12, 17, 1, 1, '#8a5a50'); R(19, 17, 1, 1, '#8a5a50');
        } else {
          // 睁开：整只眼睛都是黑的，中间一个针尖大的白点
          R(9, 10, 6, 4, '#050305'); R(17, 10, 6, 4, '#050305'); R(11, 11, 1, 1, '#d8d8d8'); R(19, 11, 1, 1, '#d8d8d8');
          R(9, 14, 6, 1, SK2); R(17, 14, 6, 1, SK2);
          const mh = 2 + Math.round((a - .5) * 6);
          R(13, 17, 6, mh, '#1a0808'); R(12, 17, 1, Math.max(1, mh - 1), '#8a5a50'); R(19, 17, 1, Math.max(1, mh - 1), '#8a5a50');
        }
        R(15, 14, 2, 2, SK2);
      }
    },
    people: {
      me: { key: 'ug-me', skin: '#f0c8a0', hair: '#1e1818', hs: 'messy', top: '#e8e4da', top2: '#c8c4b8', bottom: '#3a4a6a', shoes: '#d8d8d8',
        extra(g, d, fr, G, R) { if (d === 3) { R(4, G.tT + 1, 8, 6, '#5a6a4a'); R(4, G.tT + 1, 8, 1, '#6a7a5a'); } else if (d === 1) R(10, G.tT + 1, 2, 6, '#5a6a4a'); else { R(4, G.tT, 1, 4, '#4a5a3a'); R(11, G.tT, 1, 4, '#4a5a3a'); } } },
      kasai: { key: 'ug-ka', skin: '#eac4a0', hair: '#181414', hs: 'short', top: '#2a3a5a', top2: '#e8e8e8', bottom: '#4a4a3a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#2a2a2a'); R(9, G.hT + 4, 2, 1, '#2a2a2a'); R(7, G.hT + 4, 2, 1, '#555'); } else if (d === 1) R(5, G.hT + 4, 3, 1, '#2a2a2a'); } },
      yuki: { skin: '#f2d4bc', hair: '#120e10', hs: 'long', top: '#4a5a7a', top2: '#e8e4dc', dress: true, bottom: '#4a5a7a', shoes: '#c8b8a0' },
      okabe: { skin: '#d8a880', hair: '#1a1410', hs: 'messy', top: '#8a3a2a', top2: '#6a2a1e', bottom: '#3a3a40' },
      chitose: { skin: '#f6d8c4', hair: '#2a1a12', hs: 'bob', top: '#e8a8a8', top2: '#f4e8e0', skirt: true, bottom: '#6a5a7a', blush: '#e8a0a0' },
      makabe: { key: 'ug-ma', skin: '#e8c8a8', hair: '#221a16', hs: 'short', top: '#ecebe4', top2: '#c8c4b8', bottom: '#2a2a30',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 2, '#3a3a3a'); R(9, G.hT + 3, 2, 2, '#3a3a3a'); R(6, G.hT + 4, 1, 1, '#d8e0e8'); R(10, G.hT + 4, 1, 1, '#d8e0e8'); R(11, G.tT + 4, 2, 3, '#7a4a2a'); } else if (d === 1) R(5, G.hT + 3, 2, 2, '#3a3a3a'); } },
      segawa: { key: 'ug-se', skin: '#ecdccc', hair: '#0e0c10', hs: 'short', top: '#f4f2ea', top2: '#ecdccc', bottom: '#18181c', shoes: '#0c0c0c',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT, 2, 2, '#ecdccc'); R(6, G.tT, 1, 1, '#d4d0c4'); R(9, G.tT, 1, 1, '#d4d0c4'); R(6, G.hT, 1, 2, '#2a2630'); } } },
      okami: { skin: '#e6c6a6', hair: '#bdb8b0', hs: 'bun', top: '#3a4658', top2: '#e8e4d8', robe: true, bottom: '#3a4658', apron: '#d8d2c4', shoes: '#e8e4d8' },
      /* 「牛首」：粗草袋套着头，两只角戳破袋子，穿着褪色的白衣 */
      ushi: { key: 'ug-ushi', big: true, skin: '#d8ccb8', hair: '#000', hs: 'bald', top: '#d4ccba', top2: '#a89e8a', robe: true, noFeet: true,
        extra(g, d, fr, G, R) { ushiHead(d, G, R); } },
      ushicard: { key: 'ug-ushic', skin: '#d8ccb8', hair: '#000', hs: 'bald', top: '#c8c0ae', top2: '#a89e8a', robe: true, noFeet: true, ghost: true,
        extra(g, d, fr, G, R) { ushiHead(d, G, R); } }
    },
    items: {
      cloth: { name: '镜台的罩布', desc: '一块洗得发白的紫色绉绸。女将婆婆说：百物语讲完了，要把里间的镜子盖上。' },
      kurakey: { name: '库房钥匙', desc: '一把老式的铜钥匙，拴着一块木牌：「库」。木牌被摸得发亮。' },
      kakera: { name: '记住的几句话', desc: '你不想记住，可是一句也忘不掉。它们自己在脑子里排好了队，等着下一句。' }
    },
    notes: {
      rules: { title: '百物语的规矩（葛西发的油印纸）', text: '怪谈研究会·夏季合宿　百物语\n\n一、选没有月亮的夜晚。三间屋子连着：人在最外间讲，最里间点一盏糊了青纸的行灯，灯里一百根灯芯，旁边放一面镜子。\n二、讲完一个，讲的人自己穿过中间那间屋，到里间掐灭一根灯芯，照一照镜子，再回来。\n三、灯芯一根一根少下去，屋里一点一点暗下去。\n四、讲到第一百个、最后一根灯芯熄灭的时候——据说，真的会有什么出来。江户的书上把它画成「青行灯」。\n五、所以我们讲到第九十九个就停。第一百根，留着。\n\n（背面有人用铅笔补了一句：「最可怕的是《牛首》——可惜谁也讲不出来。」）' },
      clip: { title: '《牛首》（雪村剪下来的杂志页）', text: '世上最可怕的怪谈是什么？很多人会说：《牛首》。\n可是你去问，谁也讲不出它讲的是什么。只知道它可怕到听的人受不了，讲的人也讲不完。\n\n流传最广的是这样一个开头：某所小学去远足，回程的大巴上，老师讲起了《牛首》。孩子们一开始还笑，后来脸越来越白，哭着求他别讲了，他却停不下来。等他回过神，满车的孩子都吓昏了过去。从那以后，他再也没提过这个故事。\n\n也有人说，有个怪谈迷想在百物语的最后一个讲它，刚开了个头，就被人拦住了。\n\n至于内容，有人说和「件」有关（牛身人面，生下来就说出预言，说完就死），有人说是饥荒年间的一桩旧事。都查无实据。\n\n（页边是雪村的字：「讲不出来，所以永远是最可怕的。」）' },
      old: { title: '昭和三十七年的百物语帐（库房）', text: '（一本受了潮的帐本。封面：「昭和三十七年八月　百物语之会　于九十九庵」）\n\n……\n第九十七话　四座《雪女》　吹灯　四座\n第九十八话　二座《头发》　吹灯　二座\n第九十九话　六座《替身》　吹灯　六座\n第百话　　　六座《牛の首》\n\n「第百话」后面是空的，没有写吹灯的人。下一页被撕掉了，只剩一道毛边。\n\n帐本里夹着一张黑白合影：七个大学生在大广间里跪坐成一圈，每个人膝前的坐垫上都用白笔标了座号。\n标着「六」的那个人，穿着开领的白衬衫，头发整整齐齐地分在一边。脸被一块霉斑盖住了。' }
    },
    legend: '「牛の首」（牛首）是日本流传很广的一则「讲不出来的怪谈」。人们只传它的外壳：这是世上最可怕的故事，可怕到听的人受不了、讲的人讲不完，所以谁也不知道它讲的是什么——据说听完的人都没有好下场。最常见的「前情」是：一位老师在远足的大巴上讲起了它，孩子们吓得哭喊，等他回过神来，满车的孩子都昏了过去，从此他再也不提；另一种说法是有人想在百物语的最后一个讲它，刚开头就被拦住。无论哪个版本，正文都是空的。\n\n作家小松左京在 1960 年代写过一篇同名短篇小说，把「人人都说它可怕、却谁也讲不出来」的套子写成了一个绝妙的玩笑，这篇小说让这个说法广为人知；但它到底是小说之前就在作家圈子里口耳相传，还是被小说带火了才流进民间，说法不一。有人把它和「件」（牛身人面、生下来说出预言就死去的怪物）、牛头天王、牛鬼一类的形象联想到一起，也有人说它源自饥荒年间的旧事，这些都查无实据——它真正的「内容」，也许就是那句「谁也讲不出来」。\n\n百物语是江户时代流行的怪谈会：夜里众人聚在一起，每讲完一个怪谈就熄掉一根灯芯，讲满一百个时会有真正的怪异出现。1666 年刊行的《伽婢子》里写过它的规矩：糊了青纸的行灯、一百根灯芯、放一面镜子，讲完的人要到里间灭灯、照镜。鸟山石燕在《今昔百鬼拾遗》（1781）里把第一百个故事之后出现的妖怪画成了「青行灯」。也正因为如此，许多人讲到第九十九个就停下来。\n\n（本章中的九十九庵、怪谈研究会的众人、濑川与昭和三十七年的那场百物语、「借别人的嘴一句一句地讲」「拔掉第一百根灯芯」等情节，以及《牛首》里出现的所有句子，均为游戏虚构——真正的《牛首》，没有正文。）',
    start: { map: 'iriguchi', x: 2, y: 3, dir: 3 },
    resume: {
      break: async S => { S.amb('rain'); stepGoal(S); },
      accuse: async S => {
        S.amb('rain');
        if (DIED.accuse) await S.think('……刚才，差一点就听完了。\n真壁的本子：那两句怪话之后，是谁替人去吹的灯？座位从床之间正前方顺时针数。');
        S.goal('第九十七个了：告诉雪村，是谁在借嘴讲《牛首》');
      },
      final: async S => { await startFinal(S); }
    },
    async intro(S) {
      DIED.accuse = 0; DIED.final = 0;
      await S.card('第四夜　牛首', '1992年8月　长野县　山中的旅馆「九十九庵」', '世上最可怕的怪谈，叫《牛首》。\n人人都听过它的名字。\n可是没有一个人，讲得出它的内容。\n\n——据说，听完的人都死了。');
    },
    sprites: {
      /* 坐垫；角上缝着布签，n 个小点 = 第几号 */
      zabuton(g, e, t, R) { const c = e.col || '#7a2a34'; R(2, 5, 12, 10, shade(c, -.4)); R(3, 6, 10, 8, c); R(4, 7, 8, 1, shade(c, .15)); R(7, 9, 2, 2, shade(c, -.25)); R(-1, 9, 5, 9, '#3a2a20'); R(0, 10, 3, 7, '#e8e2d0'); for (let i = 0; i < (e.n || 0); i++) R(i % 2 ? 2 : 0, 10 + (i >> 1) * 2, 1, 1, '#2a2020'); },
      /* 大广间正中的烛台 */
      shokudai(g, e, t, R) { R(5, 13, 6, 2, '#2a1e14'); R(7, 2, 2, 12, '#3a2a1a'); R(5, 2, 6, 1, '#4a3622'); if (!e.off) { const f = Math.sin(t * 13) > 0 ? 1 : 0; R(7, -4, 2, 6, '#e8e2cc'); R(7, -8 + f, 2, 4 - f, '#ffcf5a'); R(7, -7, 1, 2, '#fff6c0'); } else R(7, -2, 2, 4, '#c8c0a8'); },
      /* 里间的行灯：糊青纸的纸罩，里面的灯芯一根根亮着（num = 剩几根） */
      andon(g, e, t, R) {
        const n = e.num == null ? 12 : e.num;
        R(3, 13, 10, 2, '#2a1e14'); R(3, -10, 1, 24, '#3a2a1a'); R(12, -10, 1, 24, '#3a2a1a'); R(3, -11, 10, 1, '#3a2a1a');
        R(4, -10, 8, 18, n > 0 ? '#5a78b8' : '#1a2238'); R(4, -4, 8, 1, '#3a2a1a'); R(4, 2, 8, 1, '#3a2a1a');
        for (let i = 0; i < Math.min(n, 12); i++) { const x = 5 + (i % 6), y = 4 - ((i / 6) | 0) * 3; const f = Math.sin(t * 11 + i * 1.7) > 0 ? 1 : 0; R(x, y - 2 + f, 1, 2 - f, '#d8ecff'); }
        if (n > 0) R(5, -8, 6, 3, 'rgba(200,220,255,.35)');
        R(5, 8, 6, 4, '#2a1e14');
        if (e.pulled) R(13, 12, 3, 1, '#e8e2cc');
      },
      /* 镜台：covered = 盖上罩布；face = 镜子里有张白脸 */
      kyodai(g, e, t, R) {
        box(R, 1, 6, 14, 9, '#5a3420'); R(2, 9, 12, 1, '#3a2014'); R(7, 11, 2, 1, '#c9a35a');
        R(3, -9, 10, 15, '#4a2a18');
        if (e.covered) { R(2, -10, 12, 16, '#5a3a6a'); R(3, -9, 10, 2, '#6a4a7a'); R(2, 4, 3, 3, '#5a3a6a'); R(11, 4, 3, 3, '#5a3a6a'); R(7, -8, 1, 12, '#4a2a5a'); return; }
        R(4, -8, 8, 13, '#8a9aa8'); R(5, -7, 2, 4, '#c8d4dc');
        if (e.face) { R(6, -5, 4, 5, '#ecdccc'); R(6, -6, 4, 2, '#0e0c10'); R(6, -3, 1, 1, '#111'); R(9, -3, 1, 1, '#111'); R(7, -1, 2, 1, '#5a2a2a'); R(5, 0, 6, 4, '#f4f2ea'); }
      },
      /* 衣桁上挂着一件开领白衬衫 */
      ikou(g, e, t, R) { R(1, -12, 1, 27, '#3a2a1a'); R(14, -12, 1, 27, '#3a2a1a'); R(0, -12, 16, 2, '#4a3622'); R(0, 13, 4, 2, '#2a1e14'); R(12, 13, 4, 2, '#2a1e14'); R(3, -10, 10, 12, '#e8e6dc'); R(7, -10, 2, 3, '#a8a49a'); R(6, -10, 1, 2, '#f4f2ea'); R(9, -10, 1, 2, '#f4f2ea'); R(3, -10, 2, 9, '#d8d6cc'); R(11, -10, 2, 9, '#d8d6cc'); },
      /* 茶盘 */
      teatray(g, e, t, R) { R(1, 4, 14, 8, '#4a2a18'); R(2, 5, 12, 6, '#6a3a22'); for (let i = 0; i < 4; i++) { R(3 + i * 3, 6, 2, 3, '#e8e4d8'); R(3 + i * 3, 6, 2, 1, '#8a9a7a'); } R(4, 9, 2, 2, '#e8e4d8'); R(10, 9, 2, 2, '#e8e4d8'); },
      /* 神龛（挂在墙面） */
      kamidana(g, e, t, R) { R(0, 3, 16, 2, '#6a4a2a'); R(3, -2, 10, 5, '#d8c8a0'); R(5, -4, 6, 2, '#5a3a20'); R(7, 0, 2, 3, '#3a2a1a'); R(1, 5, 14, 1, '#e8e4d8'); for (let i = 0; i < 4; i++) R(2 + i * 4, 6, 2, 3, '#f4f2ea'); },
      /* 玄关的玻璃拉门，外面在下雨 */
      garado(g, e, t, R) { R(0, -2, 16, 16, '#3a2a1a'); R(1, -1, 7, 14, '#0e1622'); R(8, -1, 7, 14, '#0e1622'); for (let i = 0; i < 5; i++) { const y = ((t * 30 + i * 37) % 14) | 0; R(2 + i * 3, -1 + y, 1, 2, 'rgba(160,190,220,.5)'); } R(7, -1, 2, 14, '#3a2a1a'); },
      /* 鞋柜 */
      getabako(g, e, t, R) { box(R, 0, -4, 16, 18, '#5a4028'); for (let r = 0; r < 3; r++) R(1, -2 + r * 5, 14, 1, '#3a2818'); R(2, 6, 4, 2, '#e8e8e8'); R(8, 6, 5, 2, '#2a2a2a'); R(2, 1, 5, 2, '#c84a4a'); R(9, 1, 4, 2, '#1a1a1a'); R(9, 0, 4, 1, '#3a3028'); },
      /* 雨伞桶 */
      kasa(g, e, t, R) { R(4, 6, 8, 9, '#5a5a5e'); R(4, 6, 8, 1, '#7a7a7e'); R(5, -2, 1, 9, '#2a3a6a'); R(8, -4, 1, 11, '#8a2a2a'); R(10, -1, 1, 8, '#e8e4d8'); },
      /* 衣柜式的老木箱（库房） */
      tansu(g, e, t, R) { box(R, 0, -6, 16, 20, '#6a4428'); for (let r = 0; r < 4; r++) { R(1, -5 + r * 5, 14, 1, '#3a2414'); R(7, -3 + r * 5, 2, 1, '#c9a35a'); } if (e.open) { R(1, 10, 14, 3, '#140c06'); R(3, 10, 8, 1, '#d8ccb0'); } },
      /* 障子窗（墙面），透一点月光 */
      shojiwin(g, e, t, R) { R(1, 0, 14, 12, '#3a2a1a'); R(2, 1, 12, 10, '#bdb6a2'); for (let x = 2; x < 14; x += 4) R(x + 3, 1, 1, 10, '#5a4630'); R(2, 6, 12, 1, '#5a4630'); if (e.face) { R(6, 2, 4, 4, 'rgba(20,16,20,.55)'); R(5, 0, 1, 3, 'rgba(20,16,20,.5)'); R(10, 0, 1, 3, 'rgba(20,16,20,.5)'); } },
      /* 挂轴 */
      kakejiku(g, e, t, R) { R(4, -2, 8, 14, '#e2d6b8'); R(3, -3, 10, 1, '#3a2414'); R(3, 12, 10, 1, '#3a2414'); if (e.col === 'ao') { R(6, 1, 4, 6, '#5a78b8'); R(7, 2, 2, 2, '#d8ecff'); R(6, 7, 4, 3, '#2a3a5a'); } else if (e.col === 'cow') { R(5, 4, 6, 3, '#2a2420'); R(4, 3, 2, 2, '#2a2420'); R(5, 7, 1, 2, '#2a2420'); R(10, 7, 1, 2, '#2a2420'); } else { R(7, 0, 2, 2, '#222'); R(6, 3, 4, 1, '#222'); R(7, 5, 2, 3, '#222'); R(6, 9, 4, 1, '#222'); } },
      /* 拍子木 */
      hyoshigi(g, e, t, R) { R(3, 9, 10, 2, '#c8a870'); R(3, 12, 10, 2, '#b89860'); R(2, 10, 1, 3, '#e8e4d8'); },
      /* 一堆背包 */
      bags(g, e, t, R) { box(R, 1, 6, 8, 8, '#4a5a3a'); box(R, 7, 4, 8, 10, '#2a3a5a'); R(9, 6, 4, 1, '#c8c8c8'); box(R, 3, 10, 6, 5, '#8a3a2a'); }
    },
    tiles: {
      /* 屏风：金地上画着牛，立在榻榻米上（实心） */
      byobu: { solid: true, paint(R, X, Y) {
        TILE.tatami.paint(R, X, Y);
        R(0, 13, 16, 3, 'rgba(10,6,2,.55)');
        for (let i = 0; i < 4; i++) { const x = i * 4, up = i % 2 ? 1 : 0; R(x, 0 + up, 4, 13 - up, '#2a1c0c'); R(x + (i % 2 ? 0 : 1), 1 + up, 3, 11 - up, i % 2 ? '#a07e2c' : '#c8a646'); }
        R(0, 0, 16, 1, '#1a1006'); R(0, 12, 16, 1, '#1a1006');
        const k = (X * 7 + Y * 3) % 4;
        if (k === 0) { R(3, 7, 5, 2, '#2a2016'); R(2, 6, 2, 1, '#2a2016'); R(3, 9, 1, 2, '#2a2016'); R(7, 9, 1, 2, '#2a2016'); }
        else if (k === 1) { R(9, 5, 4, 2, '#2a2016'); R(12, 4, 2, 1, '#2a2016'); R(9, 7, 1, 2, '#2a2016'); R(12, 7, 1, 2, '#2a2016'); }
        else if (k === 2) { R(2, 3, 12, 1, 'rgba(90,110,60,.6)'); R(5, 2, 1, 3, 'rgba(90,110,60,.6)'); }
      } }
    },
    maps: {
      /* ---------------- 九十九庵 · 玄关与帐场（左上：库房） ---------------- */
      iriguchi: {
        amb: 'rain', dark: .72, plr: 3, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#5a3e28' },
        legend: { 'k': 'stone', 'x': 'concrete', 'C': 'counterT' },
        rows: [
          '######################',
          '######################',
          '#kkkk#xxxx#wwwwwwwwww#',
          '#kkkk#xxxx#wwwwwwwwww#',
          '#kkkk###.##wCCCCwwwww#',
          '#kkkkwwwwwwwwwwwwwwww#',
          '#kkkkwwwwwwwwwwwwwwww#',
          '#kkkkwwwwwwwwwwwwwwww#',
          '######################'],
        ents: [
          { x: 2, y: 1, spr: 'garado', on: S => S.narr(S.f.ph === 'final' || S.f.ph === 'done' ? '雨停了。' : '玻璃门外，雨下得像一堵墙。山路上一点灯也没有。\n末班车早就没了。今晚，谁也走不了。') },
          { x: 4, y: 2, spr: 'getabako', on: S => S.narr(['鞋柜里摆着七双鞋：运动鞋、凉鞋、一双粉色的帆布鞋……', '最下面一格，是一双黑色的旧皮鞋。鞋跟磨得很薄，鞋油擦得锃亮，样式老得像是从旧照片里走出来的。']) },
          { x: 1, y: 7, spr: 'kasa', on: S => S.narr('伞桶里插着几把伞，还在往下滴水。\n你的伞是最湿的那一把。') },
          { x: 3, y: 6, spr: 'invisible', light: { r: 2.2, col: MOON } },
          { x: 11, y: 1, spr: 'kamidana', on: S => S.narr('帐场墙上的神龛。杨桐枝是新换的，供着一小碟盐、一杯清水。\n纸垂在穿堂风里，轻轻地晃。') },
          { x: 13, y: 1, spr: 'painting', col: '#4a4a3a', on: S => S.narr('一张褪了色的老照片：「九十九庵　昭和三十年代」。\n旅馆门口站着一排人，最边上是个梳着辫子的年轻姑娘，眉眼有点像女将婆婆。') },
          { x: 16, y: 1, spr: 'wallclock', on: S => S.narr(S.f.ph === 'arrive' ? '一点四十分。' : '两点多。指针走得很慢，慢得像是在等什么。') },
          { id: 'hdoor', x: 19, y: 1, spr: 'sliding', async on(S) { S.sfx('open'); await S.go('hall', 2, 2, 0); } },
          { x: 18, y: 1, spr: 'invisible', light: { r: 2.4, col: WARM } },
          /* 帐场 */
          { x: 12, y: 4, spr: 'teatray', on: S => S.narr('茶盘里扣着一排茶杯。数了数，八只。\n「人数对不上的时候，总有一个用得着。」——女将婆婆是这么说的。') },
          { id: 'register', x: 13, y: 4, spr: 'book', col: '#3a2a1a', on: S => S.narr(['柜台上摊着宿帐。最新的一行是女将婆婆的毛笔字：', '「八月七日　怪谈研究会　葛西様　外六名」\n一共七个人。\n往前翻，同一页的最上面，有一行褪成了灰色的字：「昭和三十七年八月　某大学　百物语之会　七名」。']) },
          { id: 'phone', x: 15, y: 4, spr: 'phone', on: S => phoneCall(S) },
          { x: 14, y: 4, spr: 'invisible', light: { r: 3.2, col: WARM } },
          { id: 'okami', x: 17, y: 3, spr: '@okami', dir: 0, on: S => talkOkami(S) },
          /* 库房 */
          { id: 'kuradoor', x: 8, y: 4, spr: 'sliding', col: '#3a2a1a', locked: true, async on(S) {
            const d = S.ent('kuradoor');
            if (!d.locked) return S.narr('库房的门开着。里面一股樟脑和霉纸的味道。');
            if (!S.has('kurakey')) { S.sfx('locked'); return S.narr(S.f.ph === 'break' || S.f.ph === 'accuse' ? '库房的门锁着。钥匙大概在女将婆婆那里。' : '一扇厚厚的木门，挂着一把老锁。门上贴着一张褪色的纸：「库」。'); }
            S.take('kurakey'); d.locked = false; d.open = true; d.solid = false; S.sfx('open');
            await S.narr('铜钥匙「咔」地一声拧开了老锁。\n门轴发出一声很长的「吱——」。');
          } },
          { x: 6, y: 2, spr: 'bookshelf', on: S => S.narr('架子上是一本本宿帐，从昭和二十年代一直排到今年。\n只有一个年份，帐本的书脊被人摸得发亮。') },
          { id: 'chest', x: 9, y: 2, spr: 'tansu', on: S => openChest(S) },
          { x: 6, y: 3, spr: 'box', on: S => S.narr('纸箱上写着「座布团　旧」。里面是一摞褪色的坐垫，每个角上都缝着一块布签。\n最上面那个，布签上写着「六」。') },
          { x: 8, y: 2, spr: 'invisible', light: { r: 2, col: 'rgba(200,190,160,.08)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.ph = 'arrive'; setCnt(S, 88);
          await S.narr('末班车在半山腰抛了锚。你冒着雨走了四十分钟，推开旅馆的门时，已经是凌晨一点四十分。');
          S.face('okami', 1); S.bubble('okami', '!', 900);
          await S.say('女将', ['是森下先生吧？哎呀，淋成这个样子。', '他们在最里面的大广间，已经讲到第八十八个了。']);
          await S.say('女将', ['从大广间再往里，还连着两间屋子。最里面那间点着行灯，一百根灯芯，旁边一面镜子。', '讲完一个，就自己走进去，掐掉一根灯芯，照一照镜子，再回来。……这是老规矩。']);
          S.give('cloth');
          await S.say('女将', ['这块布，是里间镜台的罩布。', '等你们讲完了，麻烦你把镜子盖上。……千万记得。']);
          S.goal('去最里面的大广间（帐场右边的拉门）');
        }
      },

      /* ---------------- 大广间（百物语的「第一间」） ---------------- */
      hall: {
        amb: 'rain', dark: .86, plr: 2.6, wall: 'shoji', floor: 'tatami',
        rows: [
          '##################',
          '##################',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '##################'],
        ents: [
          { id: 'hdoorL', x: 2, y: 1, spr: 'sliding', async on(S) {
            if (!['break', 'accuse'].includes(S.f.ph)) return S.say('葛西', '哎，别乱跑，大家都等着呢。');
            S.sfx('open'); await S.go('iriguchi', 19, 2, 0);
          } },
          { x: 5, y: 1, spr: 'shojiwin', on: S => S.narr('障子外面是走廊，再外面是雨。\n纸上映着烛台的光，还有一圈人的影子。') },
          { id: 'win2', x: 11, y: 1, spr: 'shojiwin', async on(S) {
        const w = S.ent('win2');
        if (w.face) {
          S.sfx('sting'); heart(S, .06);
          await S.narr('障子上的影子，你数了一遍：一、二、三……\n有一个影子，头上多了两只角。');
          w.face = false; S.fx('flash', { dur: .3 });
          return S.narr('你眨了一下眼。\n角没了。每个影子都坐得端端正正。');
        }
        await S.narr(S.f.P >= 2 ? '障子上的影子坐得端端正正。没有哪个多出一对角来。\n……你为什么会想到角？' : '障子上映着大家的影子，被烛火拉得很长，一晃一晃。');
      } },
          { x: 8, y: 1, spr: 'kakejiku', on: S => S.narr('床之间里挂着一幅字：「百物语」。墨迹淋漓，落款是旅馆上一代的主人。\n底下的花瓶里，插着一枝早就蔫了的桔梗。') },
          { id: 'hdoorR', x: 15, y: 1, spr: 'sliding', async on(S) {
            if (S.f.ph === 'h89') return S.narr('拉门那边黑漆漆的。还没轮到你。');
            if (S.f.ph === 'back') return S.narr('该回座位了。');
            S.sfx('open'); await S.go('oku', 2, 2, 0);
          } },
          { id: 'cstand', x: 8, y: 6, spr: 'shokudai', light: { r: 4.6, col: WARM, flick: true }, on: S => S.narr('烛台上只点着一支蜡烛。百物语的屋子不能太亮，这是规矩。\n火苗不时往一边歪，像有人从旁边轻轻吹了一口气。') },
          /* 八个坐垫（顺时针：一号在床之间正前方） */
          ...[[8, 3], [11, 4], [12, 6], [11, 8], [8, 9], [5, 8], [4, 6], [5, 4]].map(([x, y], i) => ({ id: 'c' + (i + 1), x, y, spr: 'zabuton', decal: true, s: { n: i + 1 }, on: S => cushion(S, i + 1) })),
          { id: 'kasai', x: 8, y: 3, spr: '@kasai', dir: 0, on: S => talk(S, 'kasai') },
          { id: 'yuki', x: 11, y: 4, spr: '@yuki', dir: 1, on: S => talkYuki(S) },
          { id: 'okabe', x: 12, y: 6, spr: '@okabe', dir: 1, on: S => talk(S, 'okabe') },
          { id: 'chitose', x: 11, y: 8, spr: '@chitose', dir: 1, on: S => talk(S, 'chitose') },
          { id: 'segawa', x: 5, y: 8, spr: '@segawa', dir: 2, on: S => talk(S, 'segawa') },
          { id: 'makabe', x: 4, y: 6, spr: '@makabe', dir: 2, on: S => talkMakabe(S) },
          { id: 'rules', x: 10, y: 10, spr: 'note', on: async S => { await S.note('rules'); S.f.readRules = true; } },
          { x: 7, y: 2, spr: 'hyoshigi', on: S => S.narr('葛西的拍子木。两块白木头，用绳子拴着。\n每个故事开头敲一下，结尾敲一下。「梆——梆」') },
          { x: 15, y: 10, spr: 'bags', on: S => S.narr('大家的背包堆在墙角。最上面压着一本翻烂了的《日本怪谈大全》。') },
          { x: 1, y: 10, spr: 'flashlight', on: S => S.narr('冈部带来的手电筒。「怕停电」，他说。\n按了按开关——不亮。电池是新换的。') },
          { x: 15, y: 5, spr: 'teatray', on: S => S.narr('茶早就凉了。茶杯摆了八只，有一只一直没人碰，满满的，水面上浮着一点灰。') }
        ],
        async enter(S, first) {
          if (first) return hallFirst(S);
          if (S.f.ph === 'back') return round91(S);
          if (S.f.ph === 'break' && S.f.readLog && S.f.saw1962) return round97(S);
        }
      },

      /* ---------------- 中间的屋子（屏风）+ 里间（行灯与镜台） ---------------- */
      oku: {
        amb: 'drone', dark: .93, plr: 2.6, wall: 'paper', floor: 'tatami', darkC: '#03040a',
        wallC: { face: '#4a4250', trim: '#22182a' },
        legend: { 'S': 'byobu' },
        rows: [
          '##########################',
          '##########################',
          '#..............#.........#',
          '#.SS..SSS..SS..#.........#',
          '#..............#.........#',
          '#.SSS..SS.SSS..#.........#',
          '#........................#',
          '#..SS.SSS..SS..#.........#',
          '#..............#.........#',
          '#.SSS..SS..SSS.#.........#',
          '#..............#.........#',
          '##########################'],
        ents: [
          { id: 'odoor', x: 2, y: 1, spr: 'sliding', async on(S) {
            if (S.f.ph === 'final') return S.narr('拉门那边，大广间里一点声音也没有。\n……回不去了。往里走。');
            if (S.f.ph === 'myturn') return S.narr('灯芯还没掐呢。规矩是规矩。');
            if (S.f.ph === 'mirror') return S.narr('还没照镜子。……规矩是规矩。');
            S.sfx('open'); await S.go('hall', 15, 2, 0);
          } },
          { x: 8, y: 1, spr: 'kakejiku', col: 'cow', on: S => S.narr('一幅墨画：一头牛低着头，站在空空的牛棚里。\n画上没有题字。牛的眼睛被谁用指甲刮掉了。') },
          { x: 6, y: 3, spr: 'invisible', solid: true, on: S => S.narr('金地屏风。画的是放牧：远山、柳树、七八头黑牛。\n凑近了看，每一头牛都转过头来，看着画外面。') },
          { x: 10, y: 7, spr: 'invisible', solid: true, on: S => S.narr('屏风的金箔剥落了好几块。剥落的地方，露出底下另一层画——\n还是牛。只是这一层的牛，都没有头。') },
          { x: 1, y: 10, spr: 'ikou', on: S => { S.f.sawShirt = true; return S.narr(['墙角的衣桁上，搭着一件开领的白衬衫。浆得笔挺，领口有点发黄。', '衣领内侧，用蓝线绣着一个小小的字。线褪色了，认不出来。\n……濑川学长，好像也穿着一件这样的衬衫。']); } },
          { x: 11, y: 6, spr: 'invisible', light: { r: 1.6, col: 'rgba(120,150,220,.05)' } },
          /* 里间 */
          { x: 17, y: 1, spr: 'shojiwin', on: S => S.narr('里间的障子窗。窗外是后山，黑得什么也看不见。') },
          { x: 21, y: 1, spr: 'kakejiku', col: 'ao', on: S => S.narr('一幅旧画：青色的纸灯笼下面，站着一个穿白衣、拖着长发的女人，头上长着一对角。\n旁边题着三个字：「青行灯」。') },
          { id: 'kyodai', x: 19, y: 2, spr: 'kyodai', on: S => mirror(S) },
          { id: 'andon', x: 22, y: 4, spr: 'andon', num: 12, light: { r: 4, col: BLUE, flick: true }, on: S => andon(S) },
          { x: 24, y: 2, spr: 'desk', col: '#4a2e1a', on: S => S.narr('一张小小的文机。砚台里的墨早就干了，镇纸底下压着一张白纸。\n白纸上什么也没写。') },
          { x: 24, y: 9, spr: 'cushion', col: '#4a3a5a', on: S => S.narr('角落里放着一个坐垫，凹下去一块，像有人刚刚从上面站起来。') },
          { id: 'ushi', x: 6, y: 9, spr: '@ushi', hidden: true, solid: false, light: { r: 2.3, col: 'rgba(230,215,160,.16)', a: .95, dy: 0 } }
        ],
        async enter(S, first) {
          if (S.f.ph === 'final') return;
          if (first) {
            await S.narr('中间这间屋子没有点灯。屏风一扇接一扇地立着，金箔在手烛的光里一闪一闪。');
            await S.narr('最里面，有一点青幽幽的光。');
          }
        },
        tick(S, dt) { finalTick(S, dt); }
      }
    }
  });

  /* ================= 工具 ================= */
  /* 结局之后不再往下跑（S.end 在重来时会被放行） */
  async function finish(S, o) { await S.end(o); throw ABORT; }
  /* 「牛首」的头：粗草袋套住，两只角戳破袋子 */
  function ushiHead(d, G, R) {
    const hT = G.hT, S1 = '#a8884a', S2 = '#8a6c34', HN = '#e8e0cc';
    if (d === 1) { R(4, hT - 1, 8, 9, S1); R(4, hT + 2, 8, 1, S2); R(4, hT + 5, 8, 1, S2); R(4, hT + 7, 8, 1, '#5a4220'); R(9, 0, 2, 2, HN); R(11, 0, 1, 1, HN); R(5, hT + 3, 1, 2, '#1a0e08'); return; }
    R(3, hT - 1, 10, 9, S1); R(3, hT + 2, 10, 1, S2); R(3, hT + 5, 10, 1, S2); R(3, hT + 7, 10, 1, '#5a4220');
    R(2, 0, 2, 2, HN); R(1, 0, 1, 1, HN); R(12, 0, 2, 2, HN); R(14, 0, 1, 1, HN);
    if (d === 0) { R(7, hT + 2, 2, 2, '#1a0e08'); R(8, hT + 2, 1, 1, '#f0f0f0'); }
  }
  const seatOf = id => { const e = SAPI.ent(id); return [Math.round(e.px / TS), Math.round(e.py / TS), e.dir]; };
  /* 有人替讲故事的人去里间吹灯：走到拉门、消失、远远一声「嗤」、回来 */
  async function blowerTrip(S, id) {
    const [sx, sy, sd] = seatOf(id);
    await S.walk(id, [15, 2], 5); S.face(id, 3); S.sfx('open'); S.hide(id);
    await S.wait(1100); snuff(S, .012); await S.wait(900);
    S.sfx('close'); S.place(id, 15, 2, 0); await S.walk(id, [sx, sy], 5); S.face(id, sd);
  }
  /* 一句《牛首》从别人嘴里冒出来 */
  async function frag(S, who, text) {
    S.amb('none'); murmur(S, 10, .026); await S.wait(500);
    await S.say(who, text, { style: 'whisper' });
    S.f.P = (S.f.P || 0) + 1; moo(S, .03);
    if (!S.has('kakera')) S.give('kakera', true);
    S.toast('（你记住了一句。它们在你脑子里，自己接上了。）');
    S.amb('rain');
  }
  /* 讲出来的冲动：第三次就停不下来了 */
  async function urge(S) {
    S.f.urge = (S.f.urge || 0) + 1; ring(S);
    if (S.f.urge >= 3) return badTold(S);
    if (S.f.urge === 1) {
      S.fx('red');
      await S.narr('话刚到嘴边，屋里的火光齐齐地朝你这边歪了一下。\n你猛地咬住了舌头。嘴里一股铁锈味。');
      await S.think('……我刚才，想说什么来着？');
    } else {
      heart(S); await S.scare('red', { sfx: 'heart' });
      await S.narr('你的嘴自己张开了。下一句已经到了牙齿后面——你用手死死捂住了嘴。');
      await S.think('再有一次……我就停不下来了。');
    }
  }
  async function badTold(S, last) {
    S.clearTimer(); S.stop('ushi'); S.amb('none');
    await S.narr(last ? '你张开了嘴。\n罩布底下的人，安安静静地等着。' : '你张开了嘴。\n这一次，没有什么拦得住它。');
    murmur(S, 14, .03); await S.scare('glitch', { sfx: 'whisper', dur: 1.2 });
    await finish(S, { bad: true, id: 'told', title: '你把它讲完了', text: (last ? '最后一句从你嘴里出来的时候，罩布底下的人轻轻地说了一声：「谢谢。」\n然后，换成你坐在了六号垫子上。\n\n明年八月，九十九庵的大广间里，又会多摆一个坐垫。' : '那一句之后，还有下一句，下一句之后，还有下一句。\n你听见自己的声音又轻又平，像在念一张早就背熟了的纸。\n屋子里的人，一个一个地，不动了。') + '\n\n《牛首》是世上最可怕的怪谈。\n因为讲完它的人，就成了下一个想把它讲完的人。\n\n（不要接下去。不管你多想知道下一句。）' });
  }

  /* ================= 目标 ================= */
  function stepGoal(S) {
    if (S.f.ph !== 'break') return;
    const a = S.f.readLog, b = S.f.saw1962;
    if (!a && !b) return S.goal(`休息（第${S.f.cnt}个后）：找出是谁借嘴讲《牛首》——看真壁的记录、问女将婆婆`);
    if (!a) return S.goal('再去看看真壁的记录本（他坐在烛台左边）');
    if (!b) return S.goal(S.has('kurakey') || !S.ent('kuradoor').locked ? '去帐场旁的库房，找昭和三十七年的东西' : '去帐场问女将婆婆（六号是谁？「笺」里的记录：一人念，一人数座位）');
    S.goal('回大广间——休息快结束了');
  }

  /* ================= 玄关 · 女将、电话、库房 ================= */
  async function talkOkami(S) {
    S.face('okami', 'pl');
    const ph = S.f.ph;
    if (ph === 'arrive') return S.say('女将', '大广间在帐场右边那道拉门里面。快去吧，大家都等着呢。');
    if (ph === 'accuse') return S.say('女将', '……去吧。别让那孩子，再等一个三十年。');
    if (ph !== 'break') return S.say('女将', '……');
    if (S.f.okamiTalk) return S.say('女将', ['「人数对不上的时候，总有一个用得着。」', '……每年八月，我都多摆一个坐垫。']);
    S.bubble('okami', '…', 1200);
    await S.say('女将', ['……讲到第九十一个了？', '是不是有人讲着讲着，说出了不是自己的话？']);
    await S.say('女将', ['三十年前，昭和三十七年的夏天，也有一群大学生在这里讲百物语。那年我十六岁，在这儿帮工，给他们端茶。', '坐六号垫子的那个孩子，说话轻轻的，总爱替别人去里间吹灯。', '讲到第一百个，他说：「最后这个，我来。」', '……他讲的就是那个。名字我不说。', '讲到一半，灯全灭了。等大家摸黑点上灯——六号垫子上，只剩一个空坐垫。', '那天晚上的帐本和照片，都收在帐场旁边的库房里。钥匙给你。']);
    S.give('kurakey'); S.f.okamiTalk = true; stepGoal(S);
  }
  async function phoneCall(S) {
    if ((S.f.ph === 'break' || S.f.ph === 'accuse') && S.once('phone')) {
      S.sfx('phone'); await S.wait(600);
      await S.narr('电话忽然响了一声，又不响了。\n你拿起听筒。没有拨号音，只有沙沙的雨声。');
      moo(S, .03); await S.wait(900);
      return S.narr('雨声底下，很远很远的地方，有一声牛叫。');
    }
    await S.narr('一台黑色的转盘电话。听筒冰凉。');
  }
  async function openChest(S) {
    const c = S.ent('chest');
    if (S.f.saw1962) return S.note('old');
    c.open = true; S.sfx('open');
    await S.narr('最下面一格抽屉里，用油纸包着一本帐本。');
    await S.note('old'); S.f.saw1962 = true;
    await S.narr('帐本最后，夹着几片撕碎的纸。钢笔字，断断续续：「……那年……牛……草袋……」\n拼起来，大概就是被撕掉的那一页。');
    const r = await S.ask('碎纸在你手心里，轻得像几片灰。', ['放回去，合上抽屉', '把碎纸拼起来，念出声']);
    if (r === 1) {
      await S.narr('你把碎纸一片片对齐，嘴唇跟着字动了起来——');
      await urge(S);
      await S.narr('……你一把把碎纸塞回了油纸里。手在抖。');
    } else await S.narr('你把碎纸原样包好，放了回去。有些东西，不该拼起来。');
    if (S.f.readLog) await S.think('真壁的本子，六号。三十年前的帐本，也是六号。');
    stepGoal(S);
  }

  /* ================= 大广间 · 人 ================= */
  async function cushion(S, n) {
    if (n === 5) return S.narr('你的坐垫。角上缝着一块布签：「五」。');
    if (n === 8) return S.narr('八号垫子空着。角上的布签写着「八」。\n葛西说，是女将婆婆非要摆八个的。');
    if (n === 6) return S.narr('六号坐垫。布签上的「六」，针脚比别的都旧。\n垫子上还留着一个浅浅的坑，摸上去是冰的。');
    await S.narr(`坐垫角上的布签：「${NUM[n - 1]}」。`);
  }
  const LINES = {
    kasai: { early: '「先听，先听。」葛西冲你挤挤眼。', brk: ['说实话，我有点后悔把合宿定在这儿了。', '不过讲到九十九就停，规矩不会错的。……你别瞎想。'], acc: '「还剩两个就到九十九了。讲完赶紧睡觉。」葛西的嗓子有点发干。' },
    okabe: { early: '冈部冲你比了个大拇指：「新人，待会儿给我们来个狠的！」', brk: ['我真不记得我说过那句。什么牛？我家三代都住东京，连牛都没摸过。', '……那会儿替我去吹灯的是谁来着？脑子一团浆糊。'], acc: '冈部抱着胳膊，一个劲地搓。「这屋怎么越来越冷……」' },
    chitose: { early: '千岁抱着膝盖缩成一团，小声说：「我、我已经讲过一个了……」', brk: ['森下……你也听见了吧？', '我念那句话的时候，耳朵后面一直有一口凉气。像有人凑得很近，很近。'], acc: '千岁攥着你的袖子不放。' },
    segawa: { early: '濑川冲你笑了笑，没说话。', brk: ['百物语啊，最怕的不是第一百个。', '是第九十九个讲完以后，那一下安静。大家都在等，谁也不说话。', '……要是有个故事一直没讲完，你说，它会不会难受？'], acc: '濑川安安静静地坐着，嘴唇轻轻地动，像在默念什么。' }
  };
  const NAME = { kasai: '葛西', okabe: '冈部', chitose: '千岁', segawa: '濑川' };
  async function talk(S, id) {
    S.face(id, 'pl');
    const L = LINES[id], ph = S.f.ph;
    if (ph === 'break') return S.say(NAME[id], L.brk);
    if (ph === 'accuse') return S.narr(L.acc);
    return S.narr(L.early);
  }
  function logText(S) {
    return '（真壁的记录本。字很小，一格一格画得整整齐齐。）\n座号按顺时针记：一号＝床之间正前方。「（代）」＝替讲的人去里间吹灯。\n\nNo.84　三号《厕所里的红纸蓝纸》　吹灯：三号\nNo.85　一号《半夜的电梯》　吹灯：一号\nNo.86　七号《雪夜访客》　吹灯：七号\nNo.87　二号《头发》　吹灯：二号\nNo.88　四号《隔壁的敲墙声》　吹灯：四号\n——一点四十五分，森下到——\nNo.89　三号《隧道里的出租车》　吹灯：六号（代）\n　　※最后一句与本故事无关。本人不记得说过。\nNo.90　五号《' + (S.f.myStory || '……') + '》　吹灯：五号\nNo.91　四号《镜子里的第二个人》　吹灯：六号（代）\n　　※同上。';
  }
  async function talkMakabe(S) {
    S.face('makabe', 'pl');
    const ph = S.f.ph;
    if (ph !== 'break' && ph !== 'accuse') return S.narr('真壁低着头，在本子上一笔一画地记着什么。');
    if (!S.f.readLog) await S.say('真壁', ['……你想看记录？给。', '每个故事的号码、谁讲的、谁去吹的灯，我都记了。名字写起来慢，我记的是座号。']);
    await S.note('真壁的记录本', logText(S), 'log');
    if (S.f.readLog) return;
    S.f.readLog = true;
    await S.think('那两句怪话之后，去吹灯的，都不是讲故事的人。\n……六号。六号是哪个垫子？');
    if (S.f.saw1962 && ph === 'break') return round97(S);
    stepGoal(S);
  }
  async function talkYuki(S) {
    S.face('yuki', 'pl');
    const ph = S.f.ph;
    if (ph === 'break') return S.say('雪村', ['冈部那一句，千岁那一句，前后接得上。是同一个故事。', '从别人嘴里冒出来，讲的人自己却不知道……那就得看，每一次，是谁在旁边。', '真壁什么都记。女将婆婆在这儿待了一辈子。']);
    if (ph !== 'accuse') return S.narr('雪村竖起一根手指，放在嘴唇上。');
    const r = await S.ask('「你心里有数了吧？是谁？」', ['我知道是谁了', '给我点提示', '再想想'], '雪村');
    if (r === 2) return;
    if (r === 1) return hint(S, Math.min(3, (S.f.hint || 0) + 1));
    const p = await S.ask('是谁在借大家的嘴讲《牛首》？', ['葛西', '冈部', '千岁', '真壁', '濑川', '……再想想']);
    if (p === 5) return;
    if (p === 4) return unmask(S);
    return wrong(S, p);
  }
  const HINTS = [null,
    ['你看过真壁的本子吧。冈部那句、千岁那句之后，去吹灯的是谁？', '讲故事的人一直在换。可去里间照镜子的人，没换过。'],
    ['两次都是「六号（代）」。真壁按座号记：一号在床之间正前方，顺时针往下数。', '冈部是三号，千岁是四号，你是五号——那六号呢？'],
    ['……六号，就在你左手边。', '是濑川。']];
  async function hint(S, lv) { S.f.hint = lv; await S.say('雪村', HINTS[lv]); }
  async function wrong(S, p) {
    const who = ['葛西', '冈部', '千岁', '真壁'][p];
    const reply = [['我？我从八点讲到现在，嗓子都哑了！', '……再说那两句又不是从我嘴里出来的。'], ['我连自己说过什么都不记得啊！'], ['……不是我……真的不是我……'], ['我一直在记录。你看我的本子——每一个故事，我都记下来了。']][p];
    S.bubble(['kasai', 'okabe', 'chitose', 'makabe'][p], '!', 1000);
    await S.say(who, reply);
    S.f.wrong = (S.f.wrong || 0) + 1;
    await S.think('……眼角余光里，有人在笑。');
    if (S.f.wrong >= 2) {
      DIED.accuse++;
      clack(S); S.amb('none');
      await S.narr('拍子木自己响了。\n这一次，所有人的嘴一起张开了。');
      murmur(S, 16, .04); moo(S, .06);
      await S.scare('face', { spr: '@ushi', face: 'ushi' });
      await S.die('……再也没有人打断。\n一圈人的嘴一起动着，一个字一个字地，讲完了它。\n你听完了。\n\n（真壁的本子：那几句怪话之后，是谁替人去吹的灯？座位从床之间正前方顺时针数。也可以先问雪村要提示。）', '你听完了');
      return;
    }
    clack(S);
    await S.narr('没有人说「开始」。可是拍子木自己「梆」地响了一下。');
    await frag(S, p === 0 ? '冈部' : '葛西', '「……喊的那个名字，是——」');
    clack(S); S.shake(300, 2);
    await S.narr('拍子木又响了一下，把后半句硬生生截断了。\n……行灯那边，又灭了一根。');
    setCnt(S, 98);
    await S.say('雪村', [['葛西学长一直坐一号。冈部和千岁那两次，他连地方都没挪过。', '冈部是三号。那句话是从他嘴里出来的——可他是被借了嘴的那个。借嘴的人，不会自己站起来。', '千岁是四号，她是被借了嘴的。你记得那之后，是谁替她起身的吗？', '真壁坐七号，他一直在记。他本子上「吹灯」那一栏，写的不是七号。'][p]]);
    await hint(S, Math.max(2, S.f.hint || 0));
    await S.think('第九十八个了。……不能再错了。');
  }
  async function unmask(S) {
    await S.say('你', '……濑川学长。');
    S.face('segawa', 'pl');
    await S.narr('那几句怪话之后，起身去里间吹灯的，都是他。\n去吹灯的人，要照镜子。');
    S.bubble('kasai', '?', 1400);
    await S.say('葛西', ['濑川？', '……濑川是谁？咱们社里，有姓濑川的吗？']);
    await S.narr('你回头去看六号垫子。\n濑川还坐在那儿，端端正正，冲你笑。');
    await S.scare('face', { spr: '@segawa', face: 'segawa' });
    await S.say('濑川', ['被认出来了啊。', '三十年前，我也坐在六号。讲到第一百个，刚开了个头，灯就灭了。', '后来我一直在等。等一场百物语，等第九十九个讲完的那一下安静。', '我只是想把它讲完。讲完了，我就能走了。', '第九十八根，我已经替大家吹了。最后这一个——我去里间讲。你们听着就好。']);
    setCnt(S, 98);
    await S.walk('segawa', [15, 2], 4); S.face('segawa', 3); S.sfx('open'); S.hide('segawa');
    await S.narr('他一走，屋里的人都不动了。\n葛西、冈部、千岁、真壁……眼睛都睁着，望着那道拉门，嘴唇一张一合，像在跟着谁默念。');
    moo(S, .05); murmur(S, 10, .02);
    S.face('yuki', 'pl');
    await S.say('雪村', ['（她两只手死死捂着耳朵）……森下！你还听得见我说话吧？', '去里间，把镜子盖上——他是从镜子里讲的。', '然后掐灭第九十九根灯芯，把第一百根拔出来。凑不满一百，这个故事就永远讲不完。', '路上那声音会一直往耳朵里钻：走着，就会听见它往下讲；停下来捂住耳朵，它就讲不下去——', '可是别停太久。黑地里，还有东西。']);
    S.f.ph = 'final';
    await S.go('oku', 2, 2, 0);
    await S.narr('中间的屋子里，屏风一扇一扇立着。里间透出一点青光。\n那个声音从青光里传出来，轻轻的，一句接一句。');
    S.goal('去里间：盖上镜子，掐第九十九根、拔第一百根');
    S.cp('final');
    await startFinal(S);
  }

  /* ================= 剧情 · 大广间 ================= */
  async function hallFirst(S) {
    S.f.ph = 'h89';
    await S.narr('大广间里只点着一支蜡烛。六个人围坐成一圈，影子投在障子上，又高又长。');
    S.bubble('kasai', '!', 900);
    await S.say('葛西', '森下！你可算来了！');
    S.face('segawa', 'pl');
    await S.say('濑川', '这边。给你留了位子。');
    await S.think('说话的是濑川学长。……入社才半年，这几位学长学姐，你连谁是哪个系的都还没弄清。');
    await S.walk('pl', [8, 9], 5); S.turn(3); S.face('segawa', 2);
    await S.say('葛西', ['刚讲完第八十八个。讲到九十九就停，第一百个不讲——规矩纸在你脚边，回头自己看。']);
    clack(S);
    await S.say('冈部', ['那我来！第八十九个，《隧道里的出租车》。', '……司机从后视镜里看了一眼，后座上没有人。可是座椅一直往下陷着，像有人坐在那儿。', '车子出了隧道，座椅「噗」地一声弹了起来。司机回头一看——']);
    await frag(S, '冈部', '「……那一年，村子里的牛，一头接一头地，不肯吃草了。」');
    await S.narr('屋子里静了一下。');
    await S.say('冈部', '……嗯？我说到哪儿了？');
    await S.say('葛西', '说到座椅弹起来了！讲着讲着自己串台了吧你？');
    S.bubble('yuki', '…', 1400); clack(S);
    await S.say('濑川', '冈部腿麻了吧？我替你去吹。');
    await blowerTrip(S, 'segawa'); setCnt(S, 89);
    await S.say('葛西', '第九十个——森下，新人来一个！讲完了自己去里间掐灯芯、照镜子。');
    await myStory(S);
  }
  const MYST = [
    ['二楼尽头的那间房', '你讲了宿舍二楼尽头那间房：门上贴着封条，每天夜里两点，里面会传出拖椅子的声音。\n有一天封条被人撕了，门开着——屋里一把椅子也没有。'],
    ['半夜打来的电话', '你讲了那通电话：每天半夜三点，响一声就挂。后来你干脆拔了电话线。\n那天夜里三点，电话又响了。']];
  async function myStory(S) {
    for (;;) {
      const r = await S.ask('讲哪一个？', ['《二楼尽头的那间房》', '《半夜打来的电话》', '《牛首》']);
      if (r === 2) {
        await S.think('你张开嘴，那两个字自己滚到了舌尖上。');
        await urge(S);
        S.bubble('yuki', '!', 1000);
        await S.say('葛西', '哈哈，新人挺懂行嘛。可惜《牛首》谁也讲不出来——换一个，换一个。');
        continue;
      }
      S.f.myStory = MYST[r][0];
      clack(S); await S.narr(MYST[r][1]); clack(S);
      break;
    }
    await S.say('冈部', '……喂，这个有点吓人啊。');
    S.f.ph = 'myturn';
    S.goal('第九十个讲完了：去里间掐一根灯芯，照一照镜子（右上拉门）');
  }
  async function round91(S) {
    await S.walk('pl', [8, 9], 5); S.turn(3);
    clack(S);
    await S.say('千岁', ['第、第九十一个……《镜子里的第二个人》。', '我姐姐说，半夜照镜子，要是看见身后多站了一个人……千万不能回头。', '要假装没看见，慢慢地，慢慢地把灯关掉——']);
    await S.think('……你后脑勺一阵发凉。');
    await frag(S, '千岁', '「……牛棚的门上缠了三道草绳。第七天夜里，牛棚里有东西，用人的声音，喊了一个名字。」');
    S.bubble('chitose', '!', 1000);
    await S.say('千岁', ['……不是我！刚才那句不是我说的！', '我的嘴自己在动……好像有人贴在耳朵后面先说一遍，我跟着念……']);
    await S.say('濑川', '别怕别怕。我替你去吹吧。');
    await blowerTrip(S, 'segawa'); setCnt(S, 91);
    S.face('yuki', 'pl');
    await S.say('雪村', ['森下，你过来一下。', '冈部那句，千岁这句……你也听见了吧。那不是他们的故事。', '那是《牛首》。世上最可怕的怪谈——谁都知道名字，谁都讲不出来。据说听完的人，都没有好下场。', '可现在，它一句一句地，从别人嘴里冒出来。像是有谁在借我们的嘴讲。', '得在最后一句之前，找出是谁。……这个你先拿着。']);
    await S.note('clip');
    await S.say('葛西', ['……好了好了，大家都累了。', '休息十分钟！上厕所的上厕所，泡茶的泡茶。']);
    S.ent('win2').face = true;
    S.f.ph = 'break'; stepGoal(S); S.cp('break');
  }
  async function round97(S) {
    S.f.ph = 'r97';
    await S.walk('pl', [8, 9], 5); S.turn(3);
    await S.say('葛西', '……好，休息结束。接着来。');
    clack(S);
    await S.narr('第九十二个、第九十三个、第九十四个……\n故事一个接一个，灯芯一根接一根地灭。每一次，都是讲的人自己起身去里间。');
    setCnt(S, 96); snuff(S, .01);
    clack(S);
    await S.say('葛西', ['第九十七个，我来。讲个有名的——《远足的大巴》。', '有个小学老师，带学生远足回来，在大巴上给孩子们讲了一个故事。', '孩子们先是笑，后来脸越来越白，哭着求他别讲了。可老师停不下来，一句接一句。', '等他回过神来——满车的孩子都吓昏了过去。从那以后，他再也没讲过那个故事。', '他讲的那个故事，就叫——']);
    await frag(S, '葛西', '「……那东西的头，被人用草袋套住了。草袋底下，一直有声音在讲话——讲的，就是这个故事。」');
    await S.narr('葛西愣愣地张着嘴，像忘了自己是谁。\n……他讲的，就是大巴上那个老师讲的东西。');
    ring(S);
    const r = await S.ask('（你知道下一句是什么。它就在你舌头底下。）', ['咬住嘴唇', '……说出来']);
    if (r === 1) await urge(S);
    else await S.narr('你把嘴唇咬出了一道白印。那句话在嘴里转了一圈，又沉了下去。');
    await S.say('濑川', '我去吹吧。');
    await blowerTrip(S, 'segawa'); setCnt(S, 97);
    S.face('yuki', 'pl');
    await S.say('雪村', ['……第九十七个了。再讲两个，就是九十九。', '下一句，大概就是最后一段了。来不及了。', '你心里有数了吧？告诉我，是谁。']);
    S.f.ph = 'accuse';
    S.goal('第九十七个了：告诉雪村，是谁在借嘴讲《牛首》');
    S.cp('accuse');
  }

  /* ================= 里间 · 行灯与镜台 ================= */
  async function andon(S) {
    const ph = S.f.ph, a = S.ent('andon');
    if (ph === 'final') return finalAndon(S);
    if (ph === 'myturn') {
      snuff(S); setCnt(S, 90); S.f.ph = 'mirror';
      await S.narr('你捏住一根灯芯。火苗在指尖「嗤」地一声灭了，青纸罩子暗了一点点。\n还剩十根。');
      return S.goal('照一照镜子（行灯左边的镜台）');
    }
    if (ph === 'mirror') return S.narr('灯芯已经掐过了。规矩的下一步：照镜子。');
    if (ph === 'done') return S.narr('行灯黑着。第一百根灯芯横在灯座边上，再也点不着了。');
    const n = a.num;
    await S.narr(`青纸糊的行灯。里面还亮着 ${n} 根灯芯，火苗细得像头发。` + (n <= 3 ? '\n……就快到头了。' : ''));
  }
  async function mirror(S) {
    const ph = S.f.ph, k = S.ent('kyodai');
    if (ph === 'final') return finalMirror(S);
    if (ph === 'mirror') {
      await S.narr('镜子里是你自己，脸被青光照得发白。');
      await S.narr('……还有你身后那道拉门。拉门开了一条缝，缝里有一张白白的脸，正看着你的后脑勺。');
      S.fx('flash'); S.sfx('sting'); heart(S);
      await S.narr('你猛地回头。\n拉门关得好好的。');
      await S.think('……一定是看错了。');
      S.f.ph = 'back';
      return S.goal('回大广间（中间屋子左上的拉门）');
    }
    if (k.covered) return S.narr('镜台盖着罩布。布底下，什么声音也没有了。');
    if (ph === 'myturn') return S.narr('先掐灯芯，再照镜子。规矩的顺序不能乱。');
    await S.narr('镜子里只有你自己。\n罩布要等全部讲完了才盖——女将婆婆是这么说的。');
  }

  /* ================= 危险：别听完 ================= */
  const FT = { still: 0, mur: 0, was: false, n: 0, hb: 0, oku: false };
  const TALE = ['「……他们把那东西的头，用草袋套了起来……」', '「……套上以后，草袋底下，一直有个声音在讲话……」', '「……讲的，就是这个故事……」', '「……最后一句是——」'];
  const chaseO = () => ({ spd: 2.4, catch: ushiCatch, zone: (x, y) => x <= 14 });
  async function startFinal(S) {
    S.clearTimer(); S.stop('ushi'); S.hide('ushi');
    S.pos(2, 2, 0);
    const k = S.ent('kyodai'), a = S.ent('andon');
    k.covered = false; k.face = true; a.num = 2; a.s.pulled = false;
    Object.assign(S.f, { ph: 'final', caught: 0, tI: 0, half: false, covered: false });
    S.dark(.95); S.plr(2.4); S.amb('none'); S.lights(null);
    FT.still = 0; FT.mur = 0; FT.was = false; FT.n = 0; FT.hb = 0; FT.oku = false;
    if (DIED.final) await S.think('走着会听见它讲；停下捂住耳朵，它讲不下去——可那东西会过来。\n别犹豫，绕开它，直接去里间。');
    S.place('ushi', 6, 9, 0); S.ent('ushi').alpha = 0; S.sfx('thud');
    await S.alpha('ushi', 1, 700);
    moo(S, .04);
    if (!DIED.final && S.once('ushiSeen')) await S.narr('屏风后面，有个东西慢慢站了起来。\n头上套着一只草袋。草袋上，戳出两只角。');
    S.chase('ushi', chaseO()); S.ent('ushi').chase.wait = .8;
    S.timer(13, '《牛首》', heardEnd, { during: true });
    S.toast('走着会听见它讲；停下捂耳朵，那东西会过来');
  }
  function finalTick(S, dt) {
    if (S.f.ph !== 'final' || S.timerLeft == null) return;
    if (!S.busy && !S.moving) FT.still += dt; else FT.still = 0;
    const still = FT.still > .25;
    if (still) S.timerAdd(dt);
    const u = S.ent('ushi'); if (u && u.chase) u.chase.spd = still ? 4.2 : 2.4;
    if (still && !FT.was && FT.n < 2) { FT.n++; S.toast('你捂住了耳朵——黑地里，有什么东西加快了脚步'); }
    FT.was = still;
    FT.mur -= dt;
    if (!still && FT.mur <= 0) { FT.mur = .8; murmur(S, 5, .018 + Math.max(0, 15 - S.timerLeft) * .002); }
    /* 离它越近，心跳越响越快 */
    if (u && !u.hidden) {
      const d = Math.abs(Math.round(u.px / TS) - S.pl.x) + Math.abs(Math.round(u.py / TS) - S.pl.y);
      FT.hb -= dt;
      if (d < 7 && FT.hb <= 0) { FT.hb = .35 + d * .12; heart(S, .1 - d * .012); }
    }
    if (S.pl.x >= 16 && !FT.oku) { FT.oku = true; S.toast('它停在了屏风那边——它不进里间'); }
    const th = [10, 7.5, 5, 2.5];
    if (S.f.tI < 4 && S.timerLeft < th[S.f.tI]) { S.toast(TALE[S.f.tI]); S.f.tI++; moo(S, .02); }
  }
  async function ushiCatch(S) {
    if (!S.f.caught) {
      S.f.caught = 1; S.fx('static'); S.sfx('thud'); S.shake(400, 3);
      await S.narr('草袋擦过你的脸——粗糙、潮湿，一股干草和铁锈的味道。\n袋口底下，有一张嘴贴着你的耳朵，讲了一整句。');
      const L = S.timerLeft; if (L != null) S.timerAdd(Math.max(9, L - 2) - L);   // 扣一点时间，但至少留够走完一趟
      S.pos(2, 2, 0); S.place('ushi', 6, 9, 0);
      S.chase('ushi', chaseO()); S.ent('ushi').chase.wait = 1.2;
      S.toast('（你被推回了门口。再被它碰到，就听完了）');
      return;
    }
    DIED.final++; S.clearTimer();
    await S.scare('face', { spr: '@ushi', face: 'ushi', dur: 1.1 });
    await S.die('草袋凑到了你脸前。袋口底下有一张嘴，贴着你的耳朵，一句一句地讲。\n你想捂住耳朵。可是你的手，已经不听使唤了。\n\n（它只在你停下捂耳朵的时候变快。屏风之间有好几条路，绕开它，别在它附近停下。）', '它在你耳边');
  }
  async function heardEnd(S) {
    DIED.final++; S.stop('ushi');
    S.fx('black', { dur: 1.4 }); murmur(S, 14, .04); moo(S, .06);
    await S.wait(700);
    await S.say('', '「…………………………」', { style: 'big' });
    await S.die('那个声音讲到了最后一句。\n你听见了。你听懂了。\n……然后，就再也听不见别的了。\n\n（走着会听见故事往下讲；停下捂住耳朵，故事就停住——可那东西会追过来。别犹豫，直接去里间。）', '你听完了');
  }
  async function finalMirror(S) {
    const k = S.ent('kyodai');
    if (S.f.covered) return S.narr('镜子盖好了。布底下，那个声音闷闷的，还在讲。');
    await S.narr('镜子里，濑川正对着你，嘴一张一合。');
    S.sfx('paper'); k.covered = true; k.face = false; S.f.covered = true;
    await S.narr('你把罩布抖开，蒙了上去。\n布落下去的那一刻，他的嘴还在动。');
    S.timerAdd(2); S.toast('那个声音闷了下去');
    S.goal('掐灭第九十九根灯芯，拔出第一百根（行灯）');
  }
  async function finalAndon(S) {
    const a = S.ent('andon');
    if (!S.f.covered) {
      await S.scare('face', { spr: '@segawa', face: 'segawa' });
      return S.narr('你伸手去够灯芯。镜子里，濑川转过脸来，睁着全黑的眼睛看着你。\n你的手停在半空，怎么也落不下去。\n——先把镜子盖上！');
    }
    const opts = S.f.half ? ['把第一百根拔出来', '把第一百根也掐灭'] : ['掐灭第九十九根，拔出第一百根', '两根一起吹灭', '只掐灭第九十九根'];
    const r = await S.ask(S.f.half ? '只剩第一百根了。' : '行灯里还剩两根灯芯：第九十九根，和第一百根。', opts);
    if (r === 1) return hundred(S);
    if (r === 2) {
      snuff(S); a.num = 1; S.f.half = true;
      await S.narr('第九十九根灭了。\n可第一百根还亮着。那个声音顿了一下，又接着往下讲——');
      S.timerAdd(-2);
      return;
    }
    snuff(S); a.num = 0; a.s.pulled = true;
    return finalWin(S);
  }
  async function hundred(S) {
    const a = S.ent('andon');
    S.clearTimer(); S.stop('ushi'); a.num = 0; snuff(S); snuff(S, .02);
    S.dark(1); S.plr(.8);
    await S.narr('你一口气吹了下去。两根灯芯一起灭了。\n一百个故事，一个不少。');
    S.sfx('thud'); moo(S, .07);
    await S.scare('face', { spr: '@ushi', face: 'ushi', dur: 1.2 });
    await finish(S, { bad: true, id: 'hundred', title: '第一百支', text: '青纸的灯罩里，黑影一点一点站了起来：白衣，长发，头上一对角。\n里间墙上那幅画，管它叫「青行灯」。\n\n黑暗里，又有什么东西在你身后，慢慢地坐了下来。\n草袋摩擦的声音。\n然后，一个很近很近的声音，开始讲第一百零一个——\n\n（第九十九根掐灭，第一百根拔出来。凑不满一百，它就讲不完。）' });
  }
  async function finalWin(S) {
    S.clearTimer(); S.stop('ushi'); S.f.ph = 'done';
    await S.narr('第九十九根灯芯在指尖灭了。你捏住第一百根，连着灯油，把它整根拔了出来。\n行灯黑了。');
    S.alpha('ushi', 0, 600);
    S.dark(.97); S.plr(2); S.amb('none');
    await S.wait(800);
    await S.narr('那个声音停了。\n停了很久。');
    await S.say('罩布底下', ['……还差最后一句。', '你知道的。你听了一整晚，它就在你舌头底下。', '替我讲完吧。讲完了，我就能走了。'], { style: 'whisper' });
    ring(S);
    const r = await S.ask('（最后一句，真的就在你舌头底下。）', ['闭上嘴', '替他讲完']);
    if (r === 1) return badTold(S, true);
    await S.narr('你闭上嘴。用力地，闭上嘴。\n罩布底下，很轻很轻地，有人叹了一口气。');
    await S.say('濑川', ['……这样啊。', '讲不完，也好。'], { style: 'whisper' });
    await S.narr('后来，就什么声音也没有了。');
    bell(S);
    await S.card('早上五点', '九十九庵', '雨停了。\n山下的寺里，敲响了第一声钟。');
    const silent = !S.f.urge;
    let text = '天亮的时候，大广间里的人一个接一个醒过来，揉着眼睛，说昨晚讲着讲着就睡着了。\n谁也想不起第九十八个故事是谁讲的。社团的名册上，从来没有一个姓濑川的人。\n\n女将婆婆端着一杯热茶走进里间，放在盖着罩布的镜台前面。\n「辛苦了。」她说，「讲不完，也没关系的。」\n「今年起，」她又说，「不用再多摆一个坐垫了。」\n\n行灯里，第一百根灯芯横在灯座边上。百物语停在了第九十九个。\n\n《牛首》讲的到底是什么，你到现在也不知道。\n你只知道，它是世上最可怕的怪谈——因为没有人讲完过它。';
    if (S.f.sawShirt) text += '\n\n中间那间屋子的衣桁上，那件开领白衬衫不见了。';
    if (silent) text += '\n\n那一整晚，你一个字也没让它从嘴里溜出去。\n很多年以后，有人在酒桌上问你：「听说过《牛首》吗？」\n你想了很久，说：「听过名字。」';
    await finish(S, { id: silent ? 'silent' : 'ninetynine', title: silent ? '一个字也没说' : '第九十九支', text });
  }
})();
