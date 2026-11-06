/* ================= 第十三夜 · 冥婚 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };
  const RED = '#c01828', RED2 = '#e83a3a', GOLD = '#e0b040', PAPER = '#f2eee2', INK = '#141014';

  /* ---------------- 合成音效（双方都听得到） ---------------- */
  function gust(S, v = 1) { S.tone('sawtooth', 140, 55, 1.4, .03 * v, 0, 380); S.tone('triangle', 320, 160, 1.1, .015 * v, .15, 900); }
  /* 纸人走动：一串很短的高频「沙沙」 */
  function rustle(S, v = 1) { for (let i = 0; i < 5; i++) S.tone('square', 2200 + Math.random() * 1800, 1600, .035, .01 * v, i * .06 + Math.random() * .03, 3400); }
  /* 拜堂的锣：包了布，闷 */
  function gong(S, v = 1) { S.tone('triangle', 196, 176, 1.5, .065 * v, 0, 1300); S.tone('sine', 392, 366, .9, .02 * v, 0, 2000); S.tone('square', 98, 90, .7, .012 * v, 0, 500); }
  /* 鞭炮：一串噼啪 */
  function crackers(S, n = 16, v = 1) { for (let i = 0; i < n; i++) S.tone('square', 80 + Math.random() * 70, 36, .05, .05 * v, i * .075 + Math.random() * .03, 1900); }
  /* 远处的喜乐：二胡似的颤音，五声音阶，慢一拍——像喜事又像丧事 */
  function xiyue(S, v = 1, sad) {
    const N = sad ? [523, 466, 392, 349, 392] : [659, 587, 523, 587, 659, 784, 659];
    N.forEach((f, i) => { S.tone('triangle', f, f * (i % 2 ? 1.012 : .988), .42, .022 * v, i * .4, 2200); if (i % 2 === 0) S.tone('square', 1500, 1400, .03, .012 * v, i * .4, 3000); });
  }
  /* 挂钟报时 */
  function chime(S, n = 3) { for (let i = 0; i < n; i++) { S.tone('sine', 880, 872, 1.3, .045, i * .9, 3200); S.tone('sine', 440, 438, 1.5, .028, i * .9, 2000); } }

  /* ---------------- 囍字（7×6 像素） ---------------- */
  const XI = ['.#...#.', '###.###', '.#...#.', '#######', '#.#.#.#', '#######'];
  function xiChar(R, x, y, col) { XI.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') R(x + i, y + j, 1, 1, col); })); }

  /* ---------------- 人物 ---------------- */
  /* 纸人：白脸、红腮、画上去的头发；竹篾骨架从肩头露出来 */
  function paperX(kind) {
    return function (g, d, fr, G, R) {
      const h = G.hT;
      if (d === 0) {
        R(3, G.tT + 1, 1, 6, '#9a7a4a'); R(12, G.tT + 1, 1, 6, '#9a7a4a');   // 竹篾
        R(7, h, 2, 1, '#3a3038');                                         // 画出来的中分
        R(5, G.tT + 3, 6, 1, 'rgba(0,0,0,.12)'); R(4, G.tB - 1, 8, 1, GOLD);
      } else if (d === 1) { R(9, G.tT + 1, 1, 6, '#9a7a4a'); R(4, G.tB - 1, 7, 1, GOLD); }
      if (kind === 'lamp') {   // 挑着一盏红灯笼
        if (d === 0) { R(13, G.tT - 3, 1, 9, '#4a3a2a'); R(12, G.tT + 5, 4, 5, '#d82030'); R(12, G.tT + 6, 4, 1, GOLD); R(13, G.tT + 10, 2, 1, GOLD); }
        else if (d === 1) { R(1, G.tT - 3, 1, 9, '#4a3a2a'); R(0, G.tT + 5, 4, 5, '#d82030'); R(0, G.tT + 6, 4, 1, GOLD); }
        else if (d === 3) { R(2, G.tT - 3, 1, 9, '#4a3a2a'); R(1, G.tT + 5, 4, 5, '#a01820'); }
      }
      if (kind === 'bride') {   // 纸凤冠
        R(4, h - 2, 8, 2, GOLD); if (d !== 3) { R(5, h - 3, 1, 1, '#f0d060'); R(8, h - 3, 1, 1, '#f0d060'); R(10, h - 3, 1, 1, '#f0d060'); R(3, h, 1, 4, GOLD); R(12, h, 1, 4, GOLD); }
        if (d === 0) { R(6, G.tT + 2, 4, 1, GOLD); xiDot(R, 7, G.tT + 4); }
      }
    };
  }
  function xiDot(R, x, y) { R(x, y, 2, 2, GOLD); }
  /* 八十年代的姑娘：两条麻花辫扎红头绳，碎花棉袄 */
  function girlX(red) {
    return function (g, d, fr, G, R) {
      const h = G.hT;
      if (d !== 3) { R(1, h + 8, 2, 1, '#c01828'); R(13, h + 8, 2, 1, '#c01828'); R(1, h + 9, 2, 2, '#0e0a0c'); R(13, h + 9, 2, 2, '#0e0a0c'); }
      else { R(5, h + 2, 2, 9, '#0e0a0c'); R(9, h + 2, 2, 9, '#0e0a0c'); R(5, h + 11, 2, 1, '#c01828'); R(9, h + 11, 2, 1, '#c01828'); }
      if (d === 0) {
        if (red) { R(6, G.tT + 1, 4, 1, GOLD); R(5, G.tT + 4, 1, 1, GOLD); R(10, G.tT + 6, 1, 1, GOLD); }
        else { [[5, 1], [9, 2], [6, 4], [10, 5], [5, 6], [8, 7]].forEach(([x, y], i) => R(x, G.tT + y, 1, 1, i % 2 ? '#c03040' : '#3a5a9a')); }
      } else if (d === 1 && !red) { R(6, G.tT + 2, 1, 1, '#c03040'); R(8, G.tT + 5, 1, 1, '#3a5a9a'); }
    };
  }
  function hongyiX(g, d, fr, G, R) {
    if (d === 0) { R(10, G.hT + 6, 1, 1, '#2a1010'); R(4, G.hT - 1, 2, 2, '#e83a4a'); R(5, G.tT + 2, 6, 1, GOLD); }
    else if (d === 1) R(9, G.hT - 1, 2, 2, '#e83a4a');
  }

  /* ---------------- 纸人巡夜 ---------------- */
  const PAT = {
    z1: { a: [5, 9], b: [16, 9], st: [12, 9], to: 0 },
    z2: { a: [1, 4], b: [24, 4], st: [20, 4], to: 0 },
    z3: { a: [1, 14], b: [25, 14], st: [6, 14], to: 1 },
    z4: { a: [17, 9], b: [26, 9], st: [23, 9], to: 1 }
  };
  const PSPD = 1.5, SIGHT = 4, T0 = 110, TMIN = 70;
  let lastLeft = null, deaths = 0, lastCause = '';
  const dirTo = (a, b) => { const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]); return dx > 0 ? 2 : dx < 0 ? 1 : dy > 0 ? 0 : 3; };
  const tileOf = e => [Math.round(e.px / TS), Math.round(e.py / TS)];
  function setLamp(e) { const [dx, dy] = DIRS[e.dir]; e.light = { r: 2.4, col: 'rgba(255,80,60,.24)', flick: true, dx: 8 + dx * 26, dy: 8 + dy * 26 }; e._ld = e.dir; }
  function patReset(S, show) {
    for (const id in PAT) {
      const P = PAT[id], e = S.ent(id); if (!e) continue;
      S.place(id, P.st[0], P.st[1]); e.hidden = !show; e.alpha = 1; e.fr = 0;
      e.s = { to: P.to, pause: 0 }; e.dir = dirTo(P.st, P.to ? P.b : P.a); setLamp(e);
    }
  }
  function patHide(S) { for (const id in PAT) { const e = S.ent(id); if (e) { e.hidden = true; e.mv = null; } } }
  /* 纸人看不看得见你：正前方 SIGHT 格以内（墙挡住视线），或者贴身一格 */
  function seen(e) {
    const m = curMap(), p = W.pl, px = Math.round(p.px / TS), py = Math.round(p.py / TS), [ex, ey] = tileOf(e);
    if (Math.abs(ex - px) + Math.abs(ey - py) <= 1) return 'near';
    const [dx, dy] = DIRS[e.dir];
    for (let k = 1; k <= SIGHT; k++) { const x = ex + dx * k, y = ey + dy * k; if (tileSolid(m, x, y)) break; if (x === px && y === py) return 'see'; }
    return null;
  }
  function patMove(S, e, dt) {
    if (e.mv) return;
    if (e.s.pause > 0) { e.s.pause -= dt; return; }
    const P = PAT[e.id], [ex, ey] = tileOf(e), tgt = e.s.to ? P.b : P.a;
    if (ex === tgt[0] && ey === tgt[1]) { e.s.to = 1 - e.s.to; e.s.pause = 1.1; e.dir = dirTo([ex, ey], e.s.to ? P.b : P.a); return; }
    startMove(e, dirTo([ex, ey], tgt), PSPD);
  }

  /* 纸人的大头像：eyes = 点了睛 */
  function paperFace(R, a, t, eyes) {
        R(0, 0, 32, 32, '#0a0608');
        R(5, 1, 1, 9, '#9a7a4a'); R(26, 1, 1, 9, '#9a7a4a'); R(5, 1, 22, 1, '#9a7a4a');
        R(7, 3, 18, 6, INK); R(6, 6, 2, 9, INK); R(24, 6, 2, 9, INK); R(15, 3, 2, 3, '#3a3038');
        R(8, 8, 16, 17, PAPER); R(9, 25, 14, 2, '#e4dfd0');
        R(10, 11, 1, 10, '#dcd6c6'); R(21, 9, 1, 13, '#dcd6c6'); R(12, 24, 8, 1, '#dcd6c6');
        R(10, 12, 5, 1, '#1a1418'); R(17, 12, 5, 1, '#1a1418');
        R(11, 15, 3, 1, '#c8c0b0'); R(18, 15, 3, 1, '#c8c0b0');
        if (eyes && a > .3) { const s = a > .65 ? 2 : 1; R(12, 15, s, s + 1, '#000'); R(19, 15, s, s + 1, '#000'); }
        if (!eyes) { R(11, 14, 3, 3, '#ebe6d8'); R(18, 14, 3, 3, '#ebe6d8'); }
        if (eyes && a > .8) { R(12, 18, 1, 2, '#7a0808'); R(20, 18, 1, 2, '#7a0808'); }
        R(9, 18, 4, 3, '#e85a6a'); R(19, 18, 4, 3, '#e85a6a'); R(10, 19, 2, 1, '#f48a96'); R(20, 19, 2, 1, '#f48a96');
        R(14, 21, 4, 2, '#c81828'); R(15, 23, 2, 1, '#c81828');
        R(4, 27, 24, 5, '#c82838'); R(12, 27, 8, 2, GOLD); R(4, 27, 24, 1, '#e04050');
        }

  /* 坂头村地图：三条东西向的巷子（北后巷 y4、正街 y9、南后巷 y14），中间是房子，东头是榕树广场和村道 */
  const VROWS = (() => {
    const P = { 0: 'TTTTTT', 1: 'TTTTTT', 2: 'TTTTTT', 3: 'T""""T', 9: 'dddddd', 15: 'TTTTTT', 16: 'TTTTTT' }, rows = [];
    for (let y = 0; y < 17; y++) {
      let L;
      if (y <= 3 || y >= 15) L = '#'.repeat(27);
      else if (y === 4 || y === 9 || y === 14) L = '#' + '.'.repeat(26);
      else if (y <= 8) L = '########.########.#########';
      else L = '###.########.#########.####';
      rows.push(L + (P[y] || '""""""') + ':');
    }
    return rows;
  })();

  defChapter({
    id: 'minghun', n: 13, title: '冥婚', sub: '路边有个红包。风把它送到你脚下，你就是新郎了。', origin: '中国民间习俗与传说', color: '#6a1018',
    icon: '@zxn', iconX: 22, amb: 'wind', floor: 'stone', wall: 'brick', dark: .5, plr: 3,
    endings: { heart: '心上人', bai: '拜了堂', burn: '烧了红包' },
    people: {
      me: { skin: '#eec6a0', hair: '#1a1414', hs: 'short', top: '#34485e', top2: '#c8ccd0', bottom: '#2a2a34', shoes: '#e2e2da' },
      ama: { skin: '#d6a882', hair: '#bcb8b0', hs: 'bun', top: '#3a3a4c', top2: '#5a5a6a', bottom: '#26262e', shoes: '#1a1a1a' },
      man: { child: true, skin: '#f0c8a4', hair: '#1a1010', hs: 'twin', top: '#3468b0', top2: '#ececec', bottom: '#3468b0', shoes: '#ececec' },
      linbo: { skin: '#c49670', hair: '#8a8680', hs: 'short', top: '#2a2a2c', top2: '#4a4a4c', bottom: '#1c1c20', shoes: '#141414' },
      linshen: { skin: '#d6ae8e', hair: '#4a4440', hs: 'bun', top: '#4a3040', top2: '#6a4a58', bottom: '#2a2028', shoes: '#1a1414' },
      hongyi: { key: 'mh-hy', skin: '#e2ba9a', hair: '#141010', hs: 'bun', top: '#b01c28', top2: GOLD, bottom: '#2a1018', shoes: '#1a0a0e', mouth: '#a01020', extra: hongyiX },
      song: { skin: '#c4966c', hair: '#6a6660', hs: 'bald', top: '#46564a', top2: '#2a3a2e', bottom: '#2a2a2a', apron: '#8a7a5a', shoes: '#222' },
      zr: { key: 'mh-zr', skin: PAPER, hair: INK, hs: 'short', top: '#c82838', top2: GOLD, bottom: '#2a4a9a', shoes: INK, eye: '#000', blush: '#e85060', mouth: '#d02030', extra: paperX('lamp') },
      zr2: { key: 'mh-zr2', skin: PAPER, hair: INK, hs: 'twin', top: '#2a8a5a', top2: GOLD, bottom: '#c82838', shoes: INK, eye: '#000', blush: '#e85060', mouth: '#d02030', extra: paperX('lamp') },
      zr0: { key: 'mh-zr0', skin: PAPER, hair: INK, hs: 'short', top: '#c82838', top2: GOLD, bottom: '#2a4a9a', shoes: INK, eye: PAPER, blush: '#e85060', mouth: '#d02030', extra: paperX('') },
      zr0b: { key: 'mh-zr0b', skin: PAPER, hair: INK, hs: 'twin', top: '#2a8a5a', top2: GOLD, bottom: '#c82838', shoes: INK, eye: PAPER, blush: '#e85060', mouth: '#d02030', extra: paperX('') },
      zxn: { key: 'mh-zxn', skin: PAPER, hair: INK, hs: 'bun', top: RED, top2: GOLD, robe: true, shoes: RED, eye: PAPER, blush: '#e85060', mouth: '#d02030', extra: paperX('bride') },
      yh: { key: 'mh-yh', skin: '#d8dad4', hair: '#0e0a0c', hs: 'twin', top: '#b8c4d8', top2: '#e8ecf4', ghost: true, eye: '#050405', extra: girlX(false) },
      yhr: { key: 'mh-yhr', skin: '#ecdcd0', hair: '#0e0a0c', hs: 'twin', top: '#b01820', top2: GOLD, ghost: true, blush: '#e8a0a0', mouth: '#b02030', extra: girlX(true) },
      shu: { key: 'mh-shu', skin: '#e0c4a8', hair: '#141010', hs: 'short', top: '#ecebe4', top2: '#d8d6cc', bottom: '#2a3a5a', ghost: true }
    },
    faces: {
      zhiren(R, a, t) { paperFace(R, a, t, true); },     /* 点了睛的纸人：眼眶里慢慢「点」上墨 */
      zhiren0(R, a, t) { paperFace(R, a, t, false); },   /* 没点睛的纸人：眼睛是空的 */
      /* 月蕙：两条辫子，碎花棉袄，眼睛是两个黑洞 */
      yuehui(R, a, t) {
        R(0, 0, 32, 32, '#05060a');
        R(8, 3, 16, 6, '#0e0a0c'); R(7, 6, 3, 13, '#0e0a0c'); R(22, 6, 3, 13, '#0e0a0c');
        for (let i = 0; i < 4; i++) { R(6 + (i % 2), 19 + i * 3, 3, 2, '#0e0a0c'); R(23 - (i % 2), 19 + i * 3, 3, 2, '#0e0a0c'); }
        R(6, 30, 3, 2, '#c01828'); R(23, 30, 3, 2, '#c01828');
        R(10, 9, 12, 15, '#d4d8d2'); R(11, 24, 10, 2, '#c2c6c0');
        R(9, 8, 14, 3, '#0e0a0c'); R(11, 11, 1, 1, '#0e0a0c'); R(16, 11, 2, 1, '#0e0a0c'); R(20, 11, 1, 1, '#0e0a0c');
        const eh = 2 + Math.round(a * 2); R(12, 14, 3, eh, '#050405'); R(17, 14, 3, eh, '#050405');
        if (a > .5) { R(13, 14 + eh, 1, 3 + Math.round(a * 3), '#5a6a7a'); R(18, 14 + eh, 1, 2 + Math.round(a * 4), '#5a6a7a'); }
        R(14, 20, 4, 1, '#6a3a3a'); R(15, 21, 2, Math.round(a * 2), '#1a0a0a');
        R(9, 26, 14, 6, '#b8c4d8'); R(13, 26, 6, 2, '#e8ecf4');
        [[10, 28], [14, 30], [18, 28], [21, 30], [11, 31]].forEach(([x, y], i) => R(x, y, 1, 1, i % 2 ? '#3a5a9a' : '#c03040'));
      }
    },
    items: {
      hongbao: { name: '红包', desc: '路边捡的红包，封口缠着红线。里面是一张庚帖、一缕头发、六张一百块。\n扔不掉。' },
      gtshu: { name: '阿树的庚帖', desc: '陈松照你念的，一笔一画写在红纸上：乾造　陈树　丙午年　五月初五　丑时。' },
      paiwei: { name: '阿树的牌位', desc: '一块巴掌宽的木牌位，漆面磨得发亮。上面写着「陈公讳树之神位」。' },
      diary: { name: '月蕙的日记', desc: '塑料皮日记本，最后几页的字越写越轻。' },
      halfgt: { name: '半张庚帖', desc: '烧焦了一半的红纸。剩下的半边上写着「乾造　陈树」。' }
    },
    notes: {
      gengtie: { title: '红包里的庚帖', text: '（红纸对折，墨迹已经发灰。里面夹着一缕用红线扎住的头发，和六张一百块。）\n\n坤造　林氏　月蕙\n生于　己酉年　三月十二　辰时\n殁于　丙寅年　冬月\n年十八\n\n谨请　天作之合\n\n（红纸背面，有人用铅笔写过一行小字，又被涂掉了，只辨得出半句：「……不要别人……」）' },
      tongshu: { title: '阿公的通书', text: '（一本卷了边的《通书》，阿公生前天天翻。几页被他用红笔圈过。）\n\n【干支纪年】\n一九六四 甲辰（龙）　一九六五 乙巳（蛇）\n一九六六 丙午（马）　一九六七 丁未（羊）\n一九六八 戊申（猴）　一九六九 己酉（鸡）\n一九七〇 庚戌（狗）　一九七一 辛亥（猪）\n\n【时辰歌】\n夜半子　鸡鸣丑　平旦寅　日出卯\n食时辰　隅中巳　日中午　日昳未\n晡时申　日入酉　黄昏戌　人定亥\n\n【节令】\n正月初一 春节　三月初三 上巳\n五月初五 端午　七月初七 七夕\n八月十五 中秋　九月初九 重阳\n\n（页边是阿公的字：排八字，先年，后月日，再时辰。）' },
      letter: { title: '铁盒里的信', text: '阿树：\n\n你又笑我字写得歪。你比我大三岁，就爱管我。\n\n我爹还是不肯。他说陈家穷，连辆自行车都买不起。我说我不要自行车，我走路去你家。\n\n你说等攒够了钱，头一件事就买一辆「永久」，载我去镇上看电影。我等着。\n\n我们换的庚帖，我藏在梳妆台的抽屉里。我爹要是翻出来……我不管。\n\n这个冬天好冷，我咳了半个月。娘说，开春就好了。\n\n　　　　　　　　　　　　月蕙　丙寅年冬' },
      diary: { title: '月蕙的日记', text: '（塑料皮日记本，最后几页的字越写越轻。）\n\n十月初九\n爹把阿树的庚帖翻出来，撕了，扔进灶里。我抢出来半张，手上烫起一个泡。\n\n十月二十\n爹说镇上有户人家来提亲，开春就嫁。我不吃饭。\n\n冬月初三\n咳得睡不着。娘偷偷哭。\n\n冬月十一\n爹，我不怪你了。\n可是我这辈子只嫁阿树一个。\n要是我等不到开春，你别把我随便许给谁。\n我只要他。\n\n（后面全是空白页。）' }
    },
    legend: '冥婚，又叫阴婚、配骨、结阴亲，是给未婚而亡的人办的婚事。它在中国由来已久：《周礼·地官·媒氏》里就有「禁迁葬者与嫁殇者」，说明至迟在那时已有这种风俗，而且官方并不赞成；《三国志》记载曹操的爱子曹冲早夭，曹操为他聘了甄氏的亡女合葬；宋代笔记里还写到专门替亡者说亲的「鬼媒人」。背后的想法大同小异：怕亡者在那边孤单，也怕没有归宿的魂灵不得安宁。\n\n「路边红包」的做法，在台湾和闽南一带的说法里最常见。传统上，未出嫁就过世的女儿不能进自家的祖先牌位，家人有时会把装着她生辰八字、头发或指甲和一些钱的红包放在路边，躲在一旁看——据说捡起红包的男子就是「天定」的新郎，家属会出来认亲，拒绝被认为不吉利。俗称「娶神主牌」，新郎日后仍可另娶，但亡妻被视为正室。各地还有「姑娘庙」，供奉没有出嫁的女性亡灵。民间也流传「捡了红包推不掉」「退亲要让女方自己点头」之类的说法，都属传闻，并无定式。\n\n今天的冥婚大多只是象征性的仪式：纸扎、牌位、婚书。纸扎行里也有「纸人不点睛」的老讲究，据说点了眼睛的纸人会「活」过来。需要说明的是，近年的新闻里也出现过因「配阴婚」引发的盗墓、买卖遗体等案件，这些都是违法犯罪，已被依法查处。\n\n（本章中的坂头村、林月蕙、陈树、陈松、红姨及所有人物，庚帖、婚书、日记与信件的内容，纸人点睛巡夜、把婚书「改回」给心上人的法子，以及所有结局，均为游戏虚构。）',
    start: { map: 'village', x: 33, y: 9, dir: 1 },
    async intro(S) {
      await S.card('第十三夜　冥婚', '2005年冬　闽南山区　坂头村', '阿公过世满三年。\n明天是他的「三年」，按老规矩要做法事。\n\n我坐末班车回村。\n车开走的时候，山已经黑了一半。');
    },
    resume: {
      sneak: async S => { await sneakBrief(S); },
      lu: async S => { await arrival(S); },
      final: async S => { await ceremony(S); }
    },
    thumb(g, w, h) {   // 红包 + 囍
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const x0 = 10, y0 = h - 22 - 46;
      R(x0 - 6, y0 - 6, 46, 58, 'rgba(255,90,60,.10)');
      R(x0, y0, 34, 46, '#b01420'); R(x0 + 2, y0 + 2, 30, 42, '#c81828'); R(x0, y0, 34, 12, '#9a1018'); R(x0 + 14, y0 + 9, 6, 6, GOLD);
      XI.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') R(x0 + 6 + i * 3, y0 + 20 + j * 3, 3, 3, GOLD); }));
      R(x0 + 33, y0 + 10, 14, 1, '#e83a3a'); R(x0 + 46, y0 + 10, 1, 18, '#e83a3a');
    },
    sprites: {
      banyan(g, e, t, R) {   // 2×2 格，树冠向上伸
        R(-16, -30, 64, 34, '#16301c'); R(-10, -36, 52, 8, '#1e3a24'); R(-20, -22, 10, 22, '#14281a'); R(42, -24, 10, 18, '#14281a');
        for (let i = 0; i < 30; i++) R(((hash(i, 1, 7) * 66) | 0) - 18, ((hash(i, 2, 7) * 34) | 0) - 34, 3, 2, i % 3 ? '#26462c' : '#2e5434');
        for (const x of [-8, -2, 4, 27, 33, 39]) R(x, -6, 1, 28 + (x & 3), '#3a2e22');
        R(9, -2, 14, 32, '#4a3a2a'); R(6, 22, 20, 8, '#4a3a2a'); R(12, 0, 2, 24, '#5a4a36'); R(18, 4, 1, 20, '#3a2c1e');
        R(9, 10, 14, 2, '#b01820'); R(19, 12, 2, 6, '#b01820'); R(20, 18, 1, 2, '#e83a3a');
      },
      tudi(g, e, t, R) {
        R(0, -6, 16, 3, '#7a2a1a'); R(-1, -7, 18, 1, '#9a3a22'); R(1, -8, 2, 1, '#9a3a22'); R(13, -8, 2, 1, '#9a3a22');
        box(R, 1, -3, 14, 17, '#8a7a66'); R(4, -1, 8, 8, '#2a1a10'); R(6, 1, 4, 5, '#c84030'); R(7, 1, 2, 2, '#e8c8a0');
        R(4, 9, 8, 2, '#6a4a2a'); R(6, 8, 1, 3, '#a03020'); R(8, 8, 1, 3, '#a03020'); R(10, 8, 1, 3, '#a03020');
        R(6, 5 + Math.sin(t * 2), 1, 2, 'rgba(220,220,220,.45)'); R(9, 4 + Math.sin(t * 2.4), 1, 2, 'rgba(220,220,220,.35)');
      },
      hongbao(g, e, t, R) {
        const w = Math.sin(t * 5) > .3 ? 1 : 0;
        R(3, 9 + w, 10, 7, 'rgba(0,0,0,.3)'); R(3, 7 + w, 10, 7, RED); R(3, 7 + w, 10, 2, '#9a1018'); R(7, 9 + w, 2, 2, GOLD);
        R(12, 6 + w, 3, 1, RED2); R(14, 5, 1, 1, RED2);
      },
      denglong(g, e, t, R) {   // 挂在墙面上的红灯笼
        R(7, -4, 2, 3, '#3a2a1a'); R(4, -1, 8, 2, '#8a1018'); R(3, 1, 10, 8, '#d82030'); R(4, 9, 8, 2, '#8a1018');
        R(3, 3, 10, 1, '#a01820'); R(3, 6, 10, 1, '#a01820'); R(6, 3, 4, 3, GOLD); R(7, 11, 2, 3, GOLD);
        if (!e.off) R(5, 2, 2, 5, 'rgba(255,220,160,.45)');
      },
      gate(g, e, t, R) {   // 林家大门：红门板，左右各贴一个囍
        box(R, 0, -5, 16, 19, '#2a1410');
        if (e.open) { R(2, -3, 12, 16, '#0a0604'); R(2, -3, 2, 16, '#5a1012'); R(12, -3, 2, 16, '#5a1012'); return; }
        R(1, -4, 7, 17, '#7a1418'); R(8, -4, 7, 17, '#7a1418'); R(7, -4, 2, 17, '#3a0a0a');
        R(1, -1, 7, 8, RED); R(8, -1, 7, 8, RED); xiChar(R, 1, 0, GOLD); xiChar(R, 8, 0, GOLD);
        R(6, 9, 1, 1, '#c9a35a'); R(9, 9, 1, 1, '#c9a35a'); R(0, 13, 16, 1, '#4a2a1a');
      },
      xi(g, e, t, R) { R(2, 0, 12, 11, RED); R(2, 0, 12, 1, RED2); xiChar(R, 4, 2, GOLD); },
      bigxi(g, e, t, R) { R(2, -6, 28, 20, RED); R(2, -6, 28, 1, RED2); XI.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') R(6 + i * 3, -3 + j * 2, 3, 2, GOLD); })); },
      shopsign(g, e, t, R) {
        R(3, -7, 10, 19, '#3a2a1a'); R(4, -6, 8, 17, '#e8dcc0');
        R(5, -4, 6, 1, INK); R(7, -5, 1, 4, INK); R(5, -2, 2, 2, INK); R(9, -2, 2, 1, INK);
        R(5, 3, 6, 1, INK); R(6, 2, 1, 5, INK); R(9, 2, 1, 6, INK); R(8, 7, 3, 1, INK);
      },
      zhiqian(g, e, t, R) {
        for (let i = 0; i < 5; i++) {
          const x = (hash(e.x, e.y, i) * 12) | 0, y = (hash(e.y, e.x, i + 3) * 12) | 0;
          if (i % 2) { R(x, y, 4, 4, '#d8c070'); R(x + 1, y + 1, 2, 2, '#4a3a2a'); } else R(x, y, 5, 3, '#e8e4d8');
        }
      },
      jiazhuang(g, e, t, R) {   // 纸扎的嫁妆：红木箱、电视机、缝纫机（3 格宽）
        box(R, 1, 2, 14, 12, '#b01c28'); R(2, 3, 12, 2, '#d03040'); R(6, 7, 4, 3, GOLD); xiChar(R, 5, 6, GOLD);
        box(R, 18, 0, 12, 11, '#3a3a40'); R(19, 1, 8, 7, '#8aa0b0'); R(20, 2, 3, 2, '#c8d8e0'); R(28, 2, 1, 1, RED); R(28, 5, 1, 1, GOLD); R(21, 11, 6, 3, '#2a2a30');
        box(R, 33, 6, 14, 8, '#2a2a2e'); R(35, 2, 10, 4, '#1a1a1e'); R(43, 0, 2, 6, '#1a1a1e'); R(36, 3, 6, 1, GOLD); R(34, 10, 12, 1, '#7a6a4a');
        R(0, 14, 48, 1, 'rgba(0,0,0,.25)');
      },
      zao(g, e, t, R) {   // 砖砌土灶（2 格宽）
        R(22, -18, 6, 20, '#6a3a2a'); R(22, -18, 6, 2, '#4a2a1a');
        box(R, 0, 0, 32, 15, '#8a4a34'); for (let y = 2; y < 14; y += 4) R(1, y, 30, 1, '#6a3424');
        R(4, 1, 9, 4, '#1a1a1a'); R(5, 1, 7, 2, '#3a3a3a'); R(18, 1, 9, 4, '#1a1a1a'); R(19, 1, 7, 2, '#3a3a3a');
        R(12, 8, 8, 6, '#120806'); if (e.lit) { R(13, 11, 6, 3, '#c84a1a'); R(14 + (Math.sin(t * 9) > 0 ? 1 : 0), 10, 3, 2, '#ff9a3a'); }
      },
      tongshu(g, e, t, R) { R(4, -2, 8, 13, '#e8e0c8'); R(4, -2, 8, 3, RED); R(5, 3, 6, 1, '#8a8070'); R(5, 5, 5, 1, '#8a8070'); R(5, 7, 6, 1, '#8a8070'); R(9, 8, 2, 2, RED); R(7, -4, 2, 2, '#3a2a1a'); },
      bench(g, e, t, R) {   // 纸扎工作台（2 格宽）
        box(R, 0, 2, 32, 12, '#6a4a2e'); R(1, 3, 30, 2, '#8a6a42');
        for (let i = 0; i < 6; i++) R(2 + i * 2, 4, 1, 9, '#c8a868');
        R(15, 3, 8, 6, e.done ? '#d82030' : '#c81828'); if (e.done) { R(16, 4, 1, 4, INK); R(18, 4, 1, 4, INK); R(20, 4, 1, 3, INK); }
        R(25, 4, 4, 4, '#d8d0c0'); R(26, 3, 2, 1, '#4a3a2a'); R(27, 0, 1, 4, '#3a2a1a');
      },
      pwshelf(g, e, t, R) {   // 小神龛：阿树的牌位
        box(R, 0, -10, 16, 24, '#4a2a18'); R(1, -9, 14, 2, '#6a3a20'); R(2, -6, 12, 13, '#1a0e08');
        if (!e.taken) { R(5, -6, 6, 12, '#5a3a20'); R(6, -5, 4, 10, '#6a4428'); R(7, -4, 2, 8, GOLD); R(5, -7, 6, 1, '#7a5030'); }
        else R(5, 5, 6, 1, '#3a2614');
        R(3, 8, 10, 3, '#7a5a3a'); R(7, 6, 1, 3, '#8a3a2a'); R(7, 5 + Math.sin(t * 2), 1, 1, 'rgba(220,220,220,.45)');
      },
      tinbox(g, e, t, R) { R(3, 9, 10, 6, '#5a3a22'); R(4, 14, 1, 2, '#3a2a18'); R(11, 14, 1, 2, '#3a2a18'); box(R, 2, 3, 12, 7, '#2a6a5a'); R(3, 4, 10, 1, '#4a9a8a'); R(6, 6, 4, 2, '#e0c060'); if (e.open) R(2, 0, 12, 3, '#3a7a6a'); },
      zhiche(g, e, t, R) {   // 纸扎的二八自行车（2 格宽）
        const C = e.burn ? '#4a3a30' : '#e8e4da', K = e.burn ? '#2a1a14' : '#2a2a2e';
        for (const cx of [6, 26]) { R(cx - 6, 4, 12, 1, K); R(cx - 6, 14, 12, 1, K); R(cx - 7, 5, 1, 9, K); R(cx + 6, 5, 1, 9, K); R(cx - 1, 8, 2, 2, C); }
        R(6, 9, 20, 1, K); R(12, 2, 1, 8, K); R(10, 1, 6, 2, '#3a2a2a'); R(22, -1, 1, 10, K); R(19, -2, 7, 1, K);
        R(2, 3, 9, 2, K); R(24, -2, 3, 3, '#d82030'); R(26, 1, 1, 4, '#d82030');
      },
      zhima(g, e, t, R) { R(2, 0, 11, 7, PAPER); R(10, -5, 4, 7, PAPER); R(12, -6, 2, 2, INK); R(13, -3, 1, 1, '#000'); R(3, 7, 2, 7, PAPER); R(10, 7, 2, 7, PAPER); R(5, 1, 5, 3, RED); R(1, 1, 2, 5, INK); R(2, 13, 11, 1, 'rgba(0,0,0,.2)'); },
      zhiwu(g, e, t, R) {   // 纸扎的小洋楼（2 格宽）
        R(2, -10, 28, 4, RED); R(4, -12, 24, 2, '#8a1018'); box(R, 3, -6, 26, 20, '#e8dcc0');
        for (let i = 0; i < 3; i++) { R(6 + i * 8, -3, 4, 4, '#4a6a9a'); R(6 + i * 8, 5, 4, 4, '#4a6a9a'); }
        R(14, 8, 4, 6, '#7a1418'); R(3, 2, 26, 1, GOLD);
      },
      halfphoto(g, e, t, R) {   // 墙上钉着半张照片
        R(4, 0, 8, 10, '#d8ccb0'); R(5, 1, 6, 8, '#8a7a60'); R(6, 2, 4, 3, '#c8b090'); R(6, 1, 4, 1, '#2a2020'); R(5, 5, 6, 4, '#e8e4d8');
        for (let y = 0; y < 10; y += 2) R(11 + (y % 4 ? 1 : 0), y, 1, 2, '#d8ccb0');
        R(7, -1, 2, 1, '#c03030');
      },
      hunshu(g, e, t, R) {   // 供桌：婚书、月蕙的牌位（2 格宽）
        box(R, 0, 1, 32, 13, '#5a2a1a'); R(1, 2, 30, 4, RED); R(1, 6, 30, 1, GOLD);
        R(18, -10, 7, 13, '#3a2214'); R(19, -9, 5, 11, '#4a2c18'); R(21, -8, 1, 8, GOLD); R(17, -11, 9, 2, RED);
        R(4, 1, 10, 5, '#e83a3a'); R(5, 2, 8, 1, GOLD); R(6, 4, 6, 1, INK);
        if (e.swapped) { R(6, 0, 9, 5, '#c81828'); R(7, 1, 1, 3, INK); R(9, 1, 1, 3, INK); R(11, 1, 1, 3, INK); R(13, 1, 1, 2, INK); }
      },
      gchair(g, e, t, R) {   // 新郎的椅子
        R(3, -10, 10, 12, '#5a2a18'); R(4, -9, 8, 10, '#6a3a20'); R(6, -8, 4, 2, RED);
        box(R, 2, 2, 12, 5, '#6a3a20'); R(3, 2, 10, 2, RED); R(3, 7, 2, 7, '#4a2a18'); R(11, 7, 2, 7, '#4a2a18');
        if (e.pw) { R(5, -6, 6, 9, '#4a2c18'); R(6, -5, 4, 7, '#5a3a20'); R(7, -4, 2, 5, GOLD); R(4, -7, 8, 1, RED); }
      },
      cornershelf(g, e, t, R) { R(1, -6, 14, 2, '#4a2a18'); R(2, -4, 1, 4, '#3a2014'); R(13, -4, 1, 4, '#3a2014'); R(5, -10, 6, 4, 'rgba(120,110,100,.4)'); R(5, -6, 6, 1, '#6a5a4a'); R(3, -8, 1, 2, 'rgba(200,200,200,.18)'); R(12, -9, 1, 3, 'rgba(200,200,200,.15)'); },
      yuanzhuo(g, e, t, R) {
        R(1, 3, 14, 10, '#5a2a1a'); R(0, 4, 16, 8, RED); R(2, 2, 12, 2, RED); R(2, 12, 12, 2, '#8a1018');
        for (const [x, y] of [[2, 5], [11, 5], [6, 3], [6, 10], [3, 9], [11, 9]]) { R(x, y, 3, 2, '#e8e8e0'); R(x + 1, y, 1, 1, '#c8c8c0'); }
        R(7, 6, 3, 3, '#d8d0b8'); R(13, 4, 1, 4, '#6a4a2a');
      },
      paohua(g, e, t, R) { for (let i = 0; i < 7; i++) R((hash(e.x, e.y, i) * 14) | 0, (hash(e.y, e.x, i + 5) * 14) | 0, 2, 1 + (i % 2), i % 3 ? '#b01820' : '#e8c070'); },
      hongzhu(g, e, t, R) {
        R(5, 10, 6, 4, '#6a4a2a'); R(6, 1, 4, 10, '#c81828'); R(6, 1, 1, 10, '#e84050');
        if (!e.off) { const f = Math.sin(t * 11 + e.x) > 0 ? 1 : 0; R(7, -2 - f, 2, 3, '#ffd070'); R(7, -1, 2, 1, '#ff8a3a'); }
      },
      fire(g, e, t, R) {
        for (let i = 0; i < 9; i++) { const h = 6 + ((Math.sin(t * 9 + i * 1.7) + 1) * 4) | 0; R(2 + i * 1.4, 14 - h, 2, h, i % 3 === 0 ? '#ffd070' : i % 2 ? '#ff7a2a' : '#e84a1a'); }
        R(1, 13, 14, 2, '#3a2a1a');
        for (let i = 0; i < 3; i++) R(4 + i * 4, ((t * 20 + i * 7) % 14) - 12, 1, 1, '#ffb050');
      },
      homedoor(g, e, t, R) {   // 阿嬷家的门：贴着门神
        const c = '#5a3a22';
        if (e.open) { R(2, -2, 12, 16, '#08070a'); return; }
        box(R, 2, -2, 12, 16, c); R(7, -2, 2, 16, '#3a2414');
        R(3, 0, 4, 9, '#c8a050'); R(4, 1, 2, 2, '#e8c8a0'); R(3, 3, 4, 3, '#a02018'); R(4, 6, 2, 3, '#2a4a7a');
        R(9, 0, 4, 9, '#c8a050'); R(10, 1, 2, 2, '#e8c8a0'); R(9, 3, 4, 3, '#2a5a3a'); R(10, 6, 2, 3, '#a02018');
        if (e.locked) R(7, 8, 2, 2, '#8a8a8a');
      },
      xitieS(g, e, t, R) { R(3, 10, 11, 5, 'rgba(0,0,0,.3)'); R(3, 8, 11, 6, RED); R(4, 9, 9, 1, GOLD); xiChar(R, 5, 9, GOLD); },
      guali(g, e, t, R) { R(3, -2, 10, 14, '#e8e4d8'); R(4, -1, 8, 6, '#d88a8a'); R(6, 0, 4, 3, '#f0d0b0'); R(6, -1, 4, 1, '#2a1a1a'); R(4, 6, 8, 1, RED); R(5, 8, 6, 1, '#8a8a80'); R(5, 10, 6, 1, '#8a8a80'); },
      zhumie(g, e, t, R) { for (let i = 0; i < 7; i++) R(3 + i, -4 + (i % 3), 1, 18 - (i % 3), i % 2 ? '#c8a868' : '#a88848'); R(2, 6, 10, 2, RED); },
      bed2(g, e, t, R) { box(R, 1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 6, '#e6e2d6'); R(2, 10, 12, 19, e.col || '#a84a5a'); R(2, 10, 12, 2, '#c86a7a'); for (let i = 0; i < 4; i++) R(4 + i * 3, 15 + (i % 2) * 5, 2, 2, '#e8c070'); if (e.bag) { R(5, 12, 7, 6, '#2a3a4a'); R(6, 11, 5, 2, '#1a2a3a'); } }
    },
    tiles: {
      zhuan: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#7a3a2c'); R(0, 7, 16, 1, '#5a2a20'); R(0, 15, 16, 1, '#5a2a20'); R(Y % 2 ? 4 : 12, 0, 1, 7, '#5a2a20'); R(Y % 2 ? 12 : 4, 8, 1, 7, '#5a2a20'); if (hash(X, Y, 3) < .3) R((hash(X, Y, 4) * 12) | 0, (hash(X, Y, 5) * 12) | 0, 2, 1, '#8a4a38'); } }
    },
    maps: {
      /* ---------------- 坂头村：一条正街、两条后巷，东头是大榕树 ---------------- */
      village: {
        amb: 'wind', dark: .42, plr: 3, floor: 'stone', wall: 'brick',
        tileOpts: { grassC: '#2a3e26', treeC: '#16301c' },
        rows: VROWS,
        ents: [
          { id: 'luDoor', x: 4, y: 8, spr: 'gate', on: S => luDoor(S) },
          { id: 'dl1', x: 3, y: 8, spr: 'denglong', solid: false, light: { r: 1.9, col: 'rgba(255,70,50,.22)', flick: true, dy: 14 }, on: S => S.narr('林家门口挂着一对新糊的红灯笼，灯笼纸上贴着金色的「囍」。\n灯笼底下的地上，扫得干干净净。') },
          { id: 'dl2', x: 5, y: 8, spr: 'denglong', solid: false, light: { r: 1.9, col: 'rgba(255,70,50,.22)', flick: true, dy: 14 }, on: S => S.narr('灯笼里的蜡烛烧得很稳，风吹过来，火苗一动也不动。') },
          { x: 6, y: 8, spr: 'xi', solid: false, on: S => S.narr('墙上贴着一张大红的「囍」字。\n纸是新的，浆糊还没干。可是边上，压着半张褪了色的白纸——那是撕剩下的挽联。') },
          { x: 1, y: 8, spr: 'window', on: S => S.narr('林家的窗户糊着红纸，里面人影晃动，听不见说话声。') },
          { id: 'shopDoor', x: 20, y: 8, spr: 'door', col: '#4a3a2a', on: S => shopDoor(S) },
          { x: 21, y: 8, spr: 'shopsign', on: S => S.narr('木招牌：「松记纸扎」。\n底下一行小字：寿衣　花圈　纸屋　车马　喜事白事　一应俱全。') },
          { id: 'shopWin', x: 19, y: 8, spr: 'window', lit: true, on: S => S.narr(S.f.night ? '纸扎铺的窗户还亮着。\n窗纸上映着好几个人影，站得笔直，一动不动。' : '纸扎铺的窗户里，挂着一排纸糊的灯笼。') },
          { id: 'homeDoor', x: 24, y: 8, spr: 'homedoor', on: S => homeDoor(S) },
          { x: 23, y: 8, spr: 'window', lit: true, on: S => S.narr('阿嬷家的窗户亮着。灶房那边飘出来一股番薯粥的味道。') },
          { x: 25, y: 8, spr: 'window', on: S => S.narr('窗台上摆着一排晒干的萝卜干，是阿嬷腌的。') },
          { x: 11, y: 8, spr: 'window', on: S => S.narr(S.f.night ? '窗户黑着。里面的人好像把灯关了，躲在窗帘后头往外看。' : '这户的窗台上蹲着一只花猫，盯着林家的方向。') },
          { x: 14, y: 8, spr: 'window', on: S => S.narr('窗户关得死死的，门上新贴了一道黄符。') },
          { x: 4, y: 3, spr: 'window', on: S => S.narr('后巷的窗户里，有人在念经，念到一半停了。') },
          { x: 12, y: 3, spr: 'window', on: S => S.narr('窗户上倒扣着一面小镜子。闽南人说，镜子照着门口，脏东西就不敢进来。') },
          { x: 15, y: 3, spr: 'door', on: S => knock(S) },
          { x: 21, y: 3, spr: 'window', on: S => S.narr('窗户里黑着。窗台上放着一碗米，米上插着三根香。') },
          { x: 6, y: 13, spr: 'window', on: S => S.narr('窗户里电视开着，没有声音。蓝光一闪一闪。') },
          { x: 16, y: 13, spr: 'window', on: S => S.narr('窗台上搁着一双小孩的红布鞋，鞋尖朝里。') },
          { x: 19, y: 13, spr: 'door', on: S => knock(S) },
          { id: 'banyan', x: 28, y: 5, w: 2, h: 2, spr: 'banyan', on: S => S.narr(S.f.hb ? '大榕树的树干上缠着一圈红布。\n刚才林家的人，就是从这棵树后面走出来的。树根边上还留着几个烟头。' : '村口的大榕树，几百岁了。树干上缠着红布，气根垂下来，像一道道帘子。') },
          { x: 31, y: 6, spr: 'tudi', on: S => tudi(S) },
          { x: 32, y: 10, spr: 'busstop', on: S => S.narr('「坂头村」站牌。末班车五点四十。\n站牌柱子上贴着一张寻物启事，已经被雨泡烂了。') },
          { id: 'bin', x: 28, y: 12, spr: 'barrel', on: S => bin(S) },
          { id: 'lamp', x: 27, y: 8, spr: 'streetlamp', light: { r: 3, col: 'rgba(255,220,150,.12)' }, on: S => S.narr('村口唯一一盏路灯。灯泡上糊满了虫子。') },
          { id: 'hb', x: 30, y: 9, spr: 'hongbao', decal: true, solid: false, on: S => S.narr('一个红包，躺在村口的路中间。') },
          { id: 'v_lb', x: 28, y: 7, spr: '@linbo', hidden: true, dir: 2, on: S => S.say('林伯', '捡了红包，就由不得你了。') },
          { id: 'v_ls', x: 29, y: 7, spr: '@linshen', hidden: true, dir: 0, on: S => S.say('林婶', '……') },
          { id: 'v_hy', x: 30, y: 7, spr: '@hongyi', hidden: true, dir: 0, on: S => S.say('红姨', '姑爷，子时见。') },
          ...[[7, 9], [11, 9], [15, 9], [18, 9], [22, 9], [24, 9]].map(([x, y], i) => ({ id: 'zq' + i, x, y, spr: 'zhiqian', decal: true, solid: false, hidden: true, on: S => S.narr(i === 5 ? '纸钱一路撒到了阿嬷家门口，在门槛前面整整齐齐地码成一小叠。\n像是有人来过礼。' : '地上撒着纸钱，一张接一张，从林家门口一直撒过来。') })),
          { id: 'z1', x: 12, y: 9, spr: '@zr', hidden: true, solid: false, on: S => S.narr('纸人。') },
          { id: 'z2', x: 20, y: 4, spr: '@zr2', hidden: true, solid: false, on: S => S.narr('纸人。') },
          { id: 'z3', x: 6, y: 14, spr: '@zr', hidden: true, solid: false, on: S => S.narr('纸人。') },
          { id: 'z4', x: 23, y: 9, spr: '@zr2', hidden: true, solid: false, on: S => S.narr('纸人。') }
        ],
        async enter(S, first) {
          vLight(S);
          if (first) return opening(S);
          if (S.f.ph === 'sneak') return startSneak(S);
        },
        step(S, x, y) {
          const f = S.f;
          if (f.ph === 'dusk' && !f.hb && x <= 31) return envelope(S);
        },
        tick(S, dt) { sneakTick(S, dt); }
      },
      /* ---------------- 阿嬷家：里屋、厅堂、灶房，前面是天井 ---------------- */
      home: {
        amb: 'room', dark: .5, plr: 3.4, floor: 'zhuan', wall: 'plain',
        legend: { Z: 'zhuan' },
        rows: [
          '##################',
          '##################',
          '#wwwww#ZZZZZ#xxxx#',
          '#wwwww#ZZZZZ#xxxx#',
          '#wwwww#ZZZZZ#xxxx#',
          '#wwwww#ZZZZZ#xxxx#',
          '###w#####Z####x###',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#########k########'],
        ents: [
          { id: 'bed', x: 1, y: 2, h: 2, spr: 'bed2', col: '#4a6a8a', on: S => bed(S) },
          { id: 'mirror', x: 4, y: 1, spr: 'mirror', on: S => mirrorOn(S) },
          { x: 5, y: 2, spr: 'dresser', on: S => S.narr('樟木柜子。拉开抽屉，一股樟脑丸的味道。\n里面叠着阿公的旧衣服，最上面是他那顶灰呢子帽。') },
          { x: 2, y: 5, spr: 'box', on: S => S.narr('一口旧木箱，上面压着两床棉被。阿嬷说，等你结婚，这两床被子给你。') },
          { id: 'altar', x: 8, y: 2, w: 2, spr: 'altar', light: { r: 2.2, col: 'rgba(255,140,70,.18)', flick: true }, on: S => S.narr(['供桌上摆着阿公的牌位，香炉里三炷香刚点上。', '明天就是阿公的「三年」了。阿嬷说，做完三年，阿公就真的走了。']) },
          { x: 10, y: 1, spr: 'portrait', on: S => S.narr('阿公的遗像。黑白照片，穿着中山装，嘴抿得紧紧的。\n小时候你最怕他，他却总偷偷往你口袋里塞糖。') },
          { id: 'tongshu', x: 11, y: 1, spr: 'tongshu', on: S => readTongshu(S) },
          { x: 10, y: 4, spr: 'lowtable', on: S => S.narr('矮桌上摊着小满的作业本，还有一碟花生。') },
          { id: 'ama', x: 7, y: 4, spr: '@ama', dir: 2, on: S => amaTalk(S) },
          { id: 'man', x: 11, y: 4, spr: '@man', dir: 1, on: S => manTalk(S) },
          { id: 'zao', x: 14, y: 2, w: 2, spr: 'zao', lit: true, light: { r: 1.8, col: 'rgba(255,120,50,.2)', flick: true, dy: 12 }, on: S => zaoOn(S) },
          { x: 13, y: 2, spr: 'cabinet', on: S => S.narr('碗柜里扣着一摞碗。最上面一只，是你小时候用的，碗底有个缺口。') },
          { x: 16, y: 2, spr: 'barrel', on: S => S.narr('大水缸，盖着木板。水面上漂着一片榕树叶。') },
          { x: 4, y: 8, spr: 'well', on: S => S.narr('天井里的水井。井口盖着一块石板，石板上压着一把生锈的剪刀。\n阿嬷说，压剪刀是防小孩掉下去的。你一直觉得不只是这样。') },
          { x: 1, y: 7, spr: 'plant', on: S => S.narr('一盆万年青。叶子上落了一层香灰。') },
          { x: 16, y: 7, spr: 'plant', on: S => S.narr('一盆金桔，是过年要摆在厅里的。现在还青着。') },
          { id: 'jz', x: 11, y: 8, w: 3, spr: 'jiazhuang', hidden: true, on: S => S.narr(['纸扎的嫁妆：一口描金红木箱，一台「熊猫」电视机，一台「蝴蝶」缝纫机。', '都是八十年代姑娘出嫁最体面的东西。\n纸糊得一丝不苟——只是每样东西上，都贴着一张小红纸，写着「许川」。']) },
          { id: 'zrA', x: 10, y: 9, spr: '@zr0', hidden: true, solid: false, dir: 0 },
          { id: 'zrB', x: 14, y: 9, spr: '@zr0b', hidden: true, solid: false, dir: 0 },
          { id: 'xitie', x: 9, y: 10, spr: 'xitieS', solid: false, hidden: true, on: S => xitie(S) },
          { x: 9, y: 11, spr: 'invisible', touch: S => leaveHome(S) }
        ],
        async enter(S, first) { if (first) return homeArrive(S); },
        step(S, x, y) {
          const f = S.f;
          if (f.sawMirror && !f.knocked && y <= 5 && x >= 7 && x <= 11) return knockScene(S);
        }
      },
      /* ---------------- 松记纸扎 ---------------- */
      shop: {
        amb: 'room', dark: .55, plr: 3, floor: 'concrete', wall: 'plain',
        rows: [
          '#############',
          '#############',
          '#xxxxxxxxxxx#',
          '#xxxxxxxxxxx#',
          '#xxxxxxxxxxx#',
          '#xxxxxxxxxxx#',
          '#xxxxxxxxxxx#',
          '#xxxxxxxxxxx#',
          '#xxxxxxxxxxx#',
          '######x######'],
        ents: [
          { x: 6, y: 3, spr: 'invisible', light: { r: 4.5, col: 'rgba(255,230,170,.16)' } },
          { id: 'sz1', x: 1, y: 2, spr: '@zr0', dir: 0, on: S => S.narr('纸扎的童男，脸白得发亮，两团腮红画得圆圆的。\n眼睛的位置空着，什么也没画。') },
          { id: 'sz2', x: 2, y: 2, spr: '@zr0b', dir: 0, on: S => S.narr('纸扎的童女，梳着两个髻。\n纸做的手指头，一根一根，都是竹篾撑出来的。') },
          { x: 3, y: 2, spr: 'zhima', on: S => S.narr('一匹纸马，白身红鞍。马眼睛也是空的。') },
          { x: 8, y: 2, w: 2, spr: 'zhiwu', on: S => S.narr('一栋纸扎的小洋楼，三层，带阳台。\n门牌上写着：林府。') },
          { id: 'sz3', x: 10, y: 2, spr: '@zr0', dir: 0, on: S => S.narr('这个纸人的脸上……有两个淡淡的墨点，又被人用白粉盖掉了。') },
          { id: 'sz4', x: 11, y: 2, spr: '@zr0b', dir: 0, on: S => S.narr('纸童女的手上挑着一盏没点的灯笼。灯笼是空的，地上的纸人少了好几个。') },
          { id: 'photo', x: 6, y: 1, spr: 'halfphoto', on: S => photoOn(S) },
          { id: 'bench', x: 4, y: 4, w: 2, spr: 'bench', on: S => benchOn(S) },
          { id: 'song', x: 8, y: 4, spr: '@song', dir: 1, on: S => songTalk(S) },
          { id: 'pwshelf', x: 11, y: 5, spr: 'pwshelf', on: S => pwShelf(S) },
          { id: 'tin', x: 11, y: 7, spr: 'tinbox', on: S => tinOn(S) },
          { id: 'zhiche', x: 1, y: 6, w: 2, spr: 'zhiche', on: S => bikeOn(S) },
          { x: 1, y: 8, spr: 'zhumie', on: S => S.narr('一捆劈好的竹篾，用红纸条扎着。') },
          { x: 6, y: 9, spr: 'invisible', touch: S => leaveShop(S) }
        ],
        async enter(S, first) { if (first) return shopArrive(S); if (S.f.ph === 'sneak') await S.say('陈松', '还回来做什么？快去！子时一到它们就进铺子了！'); }
      },
      /* ---------------- 林家祖厝：左边闺房，正中喜堂，前面院子 ---------------- */
      lu: {
        amb: 'room', dark: .52, plr: 3, floor: 'zhuan', wall: 'red',
        legend: { Z: 'zhuan' },
        rows: [
          '####################',
          '####################',
          '#wwwww#ZZZZZZZZZZZZ#',
          '#wwwww#ZZZZZZZZZZZZ#',
          '#wwwww#ZZZZZZZZZZZZ#',
          '#wwwww#ZZZZZZZZZZZZ#',
          '#wwwww#ZZZZZZZZZZZZ#',
          '###w######ZZZZZ#####',
          '#kkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkk#',
          '##########k#########'],
        ents: [
          { x: 12, y: 1, w: 2, spr: 'bigxi', solid: false },
          { x: 12, y: 2, w: 2, spr: 'altar', on: S => S.narr('林家的祖先牌位，一排一排，擦得锃亮。\n最下面一层空着一个位置——空了十九年。') },
          { id: 'c1', x: 11, y: 2, spr: 'hongzhu', light: { r: 2.4, col: 'rgba(255,90,60,.22)', flick: true }, on: S => S.narr('红蜡烛。蜡油一滴一滴往下淌，红得像——\n你没有再往下想。') },
          { id: 'c2', x: 14, y: 2, spr: 'hongzhu', light: { r: 2.4, col: 'rgba(255,90,60,.22)', flick: true }, on: S => S.narr('烛台底下压着一张白纸条，写着「月蕙　十九年」。') },
          { id: 'hunshu', x: 12, y: 4, w: 2, spr: 'hunshu', on: S => hunshuOn(S) },
          { id: 'gchair', x: 11, y: 4, spr: 'gchair', on: S => chairOn(S) },
          { id: 'zxn', x: 14, y: 4, spr: '@zxn', dir: 0, on: S => S.narr(S.f.agreed ? '纸新娘的脸还是那样白。\n可你总觉得，她的头比刚才低了一点。' : '纸扎的新娘，凤冠霞帔，脸白得像一张没写字的纸。\n眼睛的位置——空着。') },
          { x: 12, y: 5, spr: 'cushion', col: RED, solid: false, decal: true },
          { x: 13, y: 5, spr: 'cushion', col: RED, solid: false, decal: true },
          { id: 'corner', x: 18, y: 2, spr: 'cornershelf', on: S => S.narr(['门后头的墙角，钉着一块小木板。', '木板上落满了灰，只有正中间干干净净——一块牌位大小的印子。\n月蕙的牌位，在这里放了十九年。']) },
          { x: 16, y: 1, spr: 'wallclock', on: S => S.narr(S.f.cer ? '挂钟的指针指着十二点。' : '挂钟的指针指着十一点五十。\n钟摆的声音，比心跳还响。') },
          { id: 'linbo', x: 8, y: 3, spr: '@linbo', dir: 2, on: S => linboTalk(S) },
          { id: 'linshen', x: 17, y: 4, spr: '@linshen', dir: 1, on: S => linshenTalk(S) },
          { id: 'hongyi', x: 16, y: 6, spr: '@hongyi', dir: 1, on: S => hongyiTalk(S) },
          { id: 'yhr', x: 14, y: 4, spr: '@yhr', hidden: true, solid: false, dir: 0 },
          { id: 'shu', x: 13, y: 6, spr: '@shu', hidden: true, solid: false, dir: 3 },
          /* 闺房 */
          { x: 1, y: 2, h: 2, spr: 'bed2', col: '#b85a6a', on: S => S.narr('一张小木床，铺着粉红的确良床单，叠得整整齐齐。\n枕头边上放着一个塑料发卡。') },
          { id: 'vanity', x: 4, y: 2, spr: 'vanity', on: S => vanityOn(S) },
          { x: 2, y: 1, spr: 'window', on: S => S.narr('窗户上贴着一对窗花：两只喜鹊。\n纸已经黄了。是她自己剪的。') },
          { x: 5, y: 1, spr: 'guali', on: S => S.narr('墙上的挂历停在一九八六年十二月。\n画上是一个烫卷发的电影明星，冲着空屋子笑。') },
          { x: 5, y: 6, spr: 'box', on: S => S.narr('一口小木箱，锁扣上系着红头绳。\n里面是几件叠好的碎花棉袄，和一双没穿过的红皮鞋。') },
          { id: 'yhg', x: 4, y: 3, spr: '@yh', hidden: true, solid: false, dir: 3 },
          /* 院子 */
          { x: 4, y: 9, spr: 'yuanzhuo', on: S => S.narr('酒席摆好了，碗筷一副一副排得整整齐齐。\n一桌十个位子，一个客人也没有。') },
          { x: 15, y: 9, spr: 'yuanzhuo', on: S => S.narr('这一桌的碗里，盛着一碗碗白米饭，饭上都插着一双筷子。') },
          { x: 8, y: 7, spr: 'denglong', solid: false, light: { r: 2, col: 'rgba(255,70,50,.2)', flick: true, dy: 14 } },
          { x: 16, y: 7, spr: 'denglong', solid: false, light: { r: 2, col: 'rgba(255,70,50,.2)', flick: true, dy: 14 } },
          ...[[2, 10], [7, 11], [12, 9], [17, 11], [13, 11]].map(([x, y]) => ({ x, y, spr: 'paohua', decal: true, solid: false })),
          { id: 'songL', x: 10, y: 11, spr: '@song', hidden: true, dir: 3 },
          { id: 'bikeL', x: 9, y: 9, w: 2, spr: 'zhiche', hidden: true, solid: false },
          { id: 'fireL', x: 9, y: 9, w: 2, spr: 'fire', hidden: true, solid: false, light: { r: 3.4, col: 'rgba(255,150,60,.3)', flick: true } },
          { x: 10, y: 12, spr: 'invisible', async touch(S) { await S.think('今晚，得把这件事了了。'); S.pos(10, 11, 3); } }
        ],
        async enter(S, first) { if (first && S.f.ph === 'lu') return arrival(S); },
        step(S, x, y) {
          const f = S.f;
          if (f.ph === 'lu' && !f.boudoir && x <= 5 && y <= 6) return boudoir(S);
        }
      }
    }
  });

  const TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const MD = ['正月初一', '三月初三', '五月初五', '七月初七', '八月十五', '九月初九'];
  const SC = DZ.map(z => z + '时');
  const GOAL_SNEAK = '子时前把牌位送进林家大门（别站到纸人灯笼前面，别跑）';

  /* ================= 村子 ================= */
  function vLight(S) {
    const f = S.f, night = !!f.night;
    S.dark(night ? .86 : .42); S.amb(night ? 'night' : 'wind');
    for (let i = 0; i < 6; i++) { const e = S.ent('zq' + i); if (e) e.hidden = !night; }
    const l = S.ent('lamp'); if (l) l.flicker = night;
    const w = S.ent('shopWin'); if (w) w.lit = true;
  }
  async function opening(S) {
    S.f.ph = 'dusk'; gust(S);
    await S.narr('村口的大榕树底下黑压压的，土地公庙前插着三炷新香。\n山风灌进衣领，冷得刺骨。');
    await S.think('阿嬷家在正街上，榕树往西数，第一户贴门神的就是。\n……路中间那是什么？');
    S.goal('回阿嬷家（正街上，贴门神的那户）');
  }
  /* 名场面：风把红包送到脚下，树后面走出来一家人 */
  async function envelope(S) {
    const f = S.f, p = W.pl; f.hb = true;
    gust(S, 1.3); S.sfx('paper');
    S.place('hb', p.x - 1, p.y); S.turn(1);
    await S.narr('一阵风卷过来，那个红包在地上翻了两个跟头，停在你的鞋尖前。');
    let r = await S.ask('红包鼓鼓的，封口缠着一圈红线。', ['（捡起来看看）', '（绕开它）'], '许川');
    if (r === 1) {
      gust(S);
      await S.narr('你往旁边让了一步。\n风又一卷——红包贴着地皮滑过来，又停在你的鞋尖前。');
      r = await S.ask('……', ['（捡起来）', '（抬脚跨过去）'], '许川');
      if (r === 1) await S.narr('你抬脚跨过去。落脚的时候，鞋底「啪」地轻响了一声——\n红包贴在了你的鞋底上。你只好弯腰，把它揭了下来。');
    }
    S.hide('hb'); S.give('hongbao');
    await S.narr('你捏着红包，还没来得及拆——');
    for (const id of ['v_lb', 'v_ls', 'v_hy']) { S.show(id); S.ent(id).alpha = 0; }
    bg(S.alpha('v_lb', 1, 500)); bg(S.alpha('v_ls', 1, 500)); await S.alpha('v_hy', 1, 500);
    crackers(S, 10, .6);
    ['v_lb', 'v_ls', 'v_hy'].forEach(id => S.face(id, 'pl')); S.face('pl', 'v_hy');
    await S.say('红姨', '捡了！捡了！林家的姑爷捡红包了！', { style: 'big' });
    await S.narr('大榕树后面走出来三个人。\n穿红袄的女人拍着手，一对老夫妻跟在后面。老太太一边走，一边抹眼泪。');
    await S.say('林伯', ['后生，你手里拿的，是我女儿月蕙的红包。', '风把它送到你脚底下——这就是天定的。']);
    r = await S.ask('红姨上下打量着你：「姑爷是哪家的？」', ['「我姓许，许家阿嬷的孙子……」', '「你们认错人了。」'], '许川');
    if (r === 1) await S.say('红姨', '红包认人，不会认错。你是许家阿嬷的孙子吧？刚下的末班车。');
    await S.say('红姨', '生辰八字报上来，红姨给你们合一合。');
    r = await S.ask('红姨伸着一只手，等你报八字。', ['（报自己真正的生日）', '（随口编一个）'], '许川');
    f.lie = r === 1;
    await S.narr('红姨掐着指头念念有词，忽然一拍大腿。');
    await S.say('红姨', '合！合得不能再合！');
    await S.say('林伯', ['今晚子时，林家拜堂。', '到时候，自然有人来请你。']);
    await S.say('许川', '等一下，我没答应——');
    await S.say('林伯', '捡了红包，就由不得你了。');
    const w1 = bg(S.walk('v_lb', [24, 9], 3)), w2 = bg(S.walk('v_ls', [25, 9], 3));
    await S.walk('v_hy', [26, 9], 3); await w1; await w2;
    bg(S.alpha('v_lb', 0, 700)); bg(S.alpha('v_ls', 0, 700)); await S.alpha('v_hy', 0, 700);
    await S.think('……都什么年代了。');
    await S.narr('你拆开了红包。');
    await S.note('gengtie');
    await S.think('林月蕙。丙寅年……一九八六年，就已经不在了。');
    S.goal('回阿嬷家，问问这是怎么回事');
    S.cp();
  }
  async function tudi(S) {
    await S.narr('土地公庙，只有半人高。香炉里三炷香刚点上，香灰还没落。');
    if (S.f.hb) await S.narr('供台上摆着一只空碟子，碟子底下压着一张红纸条：「月蕙出阁，土地公作证」。');
  }
  async function knock(S) {
    S.sfx('knock');
    await S.narr(S.f.night ? '你敲了敲门。\n门里的人屏住了气，过了好久，才有人压着嗓子说：「……林家的事，莫来问我们。」' : '门上挂着锁，主人家还在田里。');
  }
  async function bin(S) {
    const f = S.f;
    if (!S.has('hongbao') || f.threw) return S.narr('垃圾桶里塞满了烧过的纸钱灰。');
    const r = await S.ask('垃圾桶就在脚边。', ['（把红包扔进去）', '（算了）'], '许川');
    if (r !== 0) return;
    f.threw = true; S.take('hongbao'); S.sfx('paper');
    await S.narr('你把红包扔进了垃圾桶，拍了拍手。');
    S.after(2500, async S2 => {
      S2.give('hongbao', true); S2.toast('红包回到了你的口袋里');
      await S2.think('外套口袋忽然一沉。\n……红包又回来了。封口的红线，缠得比刚才还紧。');
    });
  }
  async function homeDoor(S) {
    if (S.f.ph === 'sneak') { S.sfx('locked'); return S.narr('阿嬷家的门从里面闩上了。\n门缝里，阿嬷压着嗓子：「阿川，快去！别在门口站着！」'); }
    S.sfx('open'); await S.go('home', 9, 10, 3);
  }
  async function shopDoor(S) {
    const f = S.f;
    if (f.ph === 'dusk' || f.ph === 'home') {
      S.sfx('locked');
      return S.narr('纸扎铺的门关着。门缝里透出灯光，有刷浆糊的声音。' + (f.ph === 'dusk' ? '\n……先回阿嬷家。' : ''));
    }
    S.sfx('open'); await S.go('shop', 6, 8, 3);
  }
  async function luDoor(S) {
    const f = S.f;
    if (f.ph === 'sneak') {
      f.sneakOn = false; S.clearTimer(); patHide(S); f.ph = 'lu';
      S.ent('luDoor').open = true; S.sfx('open');
      return S.go('lu', 10, 11, 3);
    }
    if (f.ph === 'dusk') return S.narr(f.hb ? '林家的大门关着。刚才那三个人，就是进了这扇门。\n门里传来剁肉的声音，像在准备酒席。' : '林家的大门。门上贴着两张崭新的「囍」字。');
    await S.think('门缝里漏出红光，还有人在低声念叨。红姨就在门后头。\n——现在进去，就是去拜堂的。');
    const r = await S.ask('……', ['（推门进去）', '（先不进）'], '许川');
    if (r === 0) return badBai(S, 'early');
  }

  /* ================= 阿嬷家 ================= */
  async function homeArrive(S) {
    const f = S.f; f.night = true; f.ph = 'home';
    S.face('ama', 'pl');
    await S.say('阿嬷', '阿川回来啦！冷不冷？锅里有番薯粥——');
    S.bubble('ama', '!', 1200);
    await S.say('阿嬷', '……你手里拿的什么？！');
    await S.say('许川', '路上捡的。林家的人从榕树后面跳出来，说我是他们家姑爷。');
    await S.say('阿嬷', ['哎哟，我的天公伯……', '那是林家给月蕙配阴亲的红包！捡了，就是人家的姑爷了。']);
    S.face('man', 'pl');
    await S.say('小满', '表哥，你也太倒霉了吧……');
    await S.say('阿嬷', ['月蕙是林老三的女儿，八六年冬天病没的，才十八。', '女儿家没出嫁就走了，进不了自家祖先的牌位。林家把她的牌位搁在门后头，一搁就是十九年。', '红包扔不掉，也千万别烧——烧了，就是断了她的路，她只会更缠着你。', '你先去里屋把行李放下。阿嬷想想法子。']);
    S.goal('把行李放到左边里屋的床上');
  }
  async function bed(S) {
    const f = S.f;
    if (f.sawMirror) return S.narr('床上是你的背包。被子刚晒过，有一股太阳的味道。');
    S.ent('bed').s.bag = true;
    await S.narr('你把背包扔到床上。屋里有一股樟脑丸的味道。');
    await S.walk('pl', [4, 2], 3); S.turn(3);
    await S.narr('墙上的镜子蒙着一层灰。你用袖子擦了擦——\n镜子里是你自己，和你身后那扇门。');
    S.amb('none'); await S.wait(700);
    S.ent('mirror').face = 'pale'; S.sfx('whisper');
    await S.narr('……门边站着一个人。\n两条麻花辫，碎花棉袄。');
    await S.scare('face', { face: 'yuehui' });
    await S.say('？？？', '……不是你……', { style: 'whisper' });
    S.ent('mirror').face = null; S.turn(0);
    await S.narr('你猛地回头。\n门边只挂着阿公的一件旧蓑衣。');
    S.amb('room'); f.sawMirror = true;
    await S.think('「不是你」……？');
    S.goal('回厅里告诉阿嬷');
  }
  async function mirrorOn(S) {
    if (!S.f.sawMirror) return S.narr('墙上一面旧镜子，蒙着一层灰。');
    await S.narr('镜子里只有你自己，脸色白得吓人。\n你不敢多看。');
  }
  async function knockScene(S) {
    const f = S.f; f.knocked = true;
    S.face('ama', 'pl');
    await S.say('许川', '阿嬷……镜子里有个姑娘，扎两条辫子。她跟我说「不是你」。');
    await S.say('阿嬷', '……不是你？');
    S.sfx('knock'); await S.wait(450); S.sfx('knock'); await S.wait(450); S.sfx('knock');
    S.face('man', 0);
    await S.say('小满', '这么晚了，谁啊？');
    await S.narr('没有人应。\n天井那头，大门底下的缝里，慢慢塞进来一张红纸。');
    S.show('xitie');
    await S.say('阿嬷', '阿川，你别——');
    await S.say('许川', '阿嬷你坐着，我去看。');
    S.goal('去天井的大门口，看看那张红纸');
  }
  async function xitie(S) {
    const f = S.f; S.hide('xitie');
    await S.narr('一张大红的喜帖，烫金的字，还有一股新墨的味道。');
    await S.narr('谨詹于今夜子时\n为小女　林月蕙\n与　许川　先生　举行婚礼\n恭请光临　　　　林府　敬约\n\n（新郎的名字底下，端端正正写着你的生辰八字。）');
    await S.think(f.lie ? '……我刚才报的是假八字。\n可这上面写的，是我真正的生日，连时辰都对。' : '我只报了生日。他们怎么连时辰都知道？');
    S.amb('none'); rustle(S, .8); await S.wait(600); rustle(S, 1.1);
    S.show('jz'); S.show('zrA'); S.show('zrB'); S.ent('zrA').dir = 3; S.ent('zrB').dir = 3;
    await S.narr('身后传来纸张摩擦的声音。\n沙……沙……');
    S.turn(3);
    await S.narr('天井里站着两个纸人，一左一右，守着一堆红彤彤的东西。\n它们的脸，慢慢转了过来。');
    S.face('zrA', 'pl'); S.face('zrB', 'pl');
    await S.scare('face', { face: 'zhiren0', sfx: 'scream' });
    await S.narr('白脸，红腮帮。眼睛的位置——空着。\n两个纸人朝你弯了弯腰，像是行礼。然后「啪」的一声，平平地倒在地上，成了两张纸。');
    S.hide('zrA'); S.hide('zrB'); S.amb('room');
    S.face('man', 0);
    await S.say('小满', '表、表哥！！', { style: 'big' });
    f.dowry = true;
    S.goal('回厅里跟阿嬷说');
  }
  async function amaTalk(S) {
    const f = S.f; S.face('ama', 'pl');
    if (!f.sawMirror) return S.say('阿嬷', '先去里屋把行李放下。……这个林老三，糊涂啊。');
    if (!f.dowry) return S.say('阿嬷', '门口那张红纸……你去看看，别用手指头戳它。');
    if (!f.amaDone) {
      await S.say('阿嬷', ['纸人送嫁妆……这是要把礼走完啊。', '你说镜子里那姑娘讲「不是你」……我想起来了。']);
      await S.say('阿嬷', ['那年月蕙跟陈家的小儿子阿树好过。林老三嫌陈家穷，死活不肯，把阿树的庚帖都撕了。', '月蕙走了以后，阿树出去打工。听说过了几年，也没了。']);
      await S.say('阿嬷', ['老辈人讲，退阴亲，得弄清楚姑娘自己想嫁谁。', '她心里要是有人，就把婚书改回给那个人——拿那人的庚帖，换掉你的。', '阿树他哥陈松，开纸扎铺的，就在咱家往西隔一户。林家的纸人，都是他扎的。']);
      await S.say('阿嬷', '排八字用得着你阿公那本通书，就挂在墙上，阿公的相片旁边。');
      f.amaDone = true; f.ph = 'shop';
      S.goal('去隔壁「松记纸扎」找陈松（排八字可以看厅里墙上的通书）');
      S.cp();
      return;
    }
    const L = ['陈松那人脾气硬，心是软的。你好好跟他说。', '通书在墙上，阿公的相片旁边。', '月蕙那孩子，小时候常来咱家借酱油，见人就笑。', '记住，红包别扔，别烧。'];
    await S.say('阿嬷', L[(f._al = ((f._al ?? -1) + 1) % L.length)]);
  }
  async function manTalk(S) {
    const f = S.f; S.face('man', 'pl');
    if (!f.dowry) return S.say('小满', ['表哥，林家那个姐姐我听说过。', '学校里都说，她家门后头那块牌位，半夜会自己转过来。']);
    if (!f.amaDone) return S.say('小满', ['那两个纸人……眼睛是空的。', '空的就好。空的就看不见我们……对吧？']);
    if (f.ph === 'shop') return S.say('小满', ['八字我会排！我们历史课学过干支纪年。', '先查年份，再看日子，最后对时辰——都在阿公的通书里。']);
    await S.say('小满', '表哥，你小心点。');
  }
  async function readTongshu(S) {
    await S.note('tongshu'); S.f.readTS = true;
    if (S.once('ts1')) await S.think('干支纪年、时辰、节令……阿公连这个都圈出来了。');
  }
  async function zaoOn(S) {
    const f = S.f;
    if (!S.has('hongbao') || f.ph === 'sneak' || f.ph === 'lu') return S.narr('灶膛里的火烧得正旺，锅里的番薯粥咕嘟咕嘟冒着泡。');
    const r = await S.ask('灶膛里的火烧得正旺。\n阿嬷说过：红包千万别烧。', ['（把红包扔进灶膛）', '（算了）'], '许川');
    if (r === 0) return badBurn(S);
  }
  async function leaveHome(S) {
    const f = S.f;
    if (!f.amaDone) { await S.say('阿嬷', '天都黑了，先别出去！'); return S.pos(9, 10, 3); }
    await S.go('village', 24, 9, 0);
  }

  /* ================= 松记纸扎 ================= */
  async function shopArrive(S) {
    await S.narr('松记纸扎。\n一屋子的纸人纸马靠墙站成一排，白脸红腮，全都朝着门口。');
    S.face('song', 'pl');
    await S.say('陈松', '关门了。林家的东西都扎完了，要拿明天来。');
    S.goal('跟陈松说说红包的事');
  }
  async function songTalk(S) {
    const f = S.f; S.face('song', 'pl');
    if (f.ph === 'sneak') return S.say('陈松', '还愣着做什么？子时一到，它们就进铺子请人了！');
    if (!f.songTold) {
      await S.say('许川', '松伯，我捡了林家月蕙的红包。可是她……她在镜子里跟我说「不是你」。');
      await S.narr('陈松手里的竹篾「啪」地折断了。');
      await S.say('陈松', ['……不是你。', '那就是还在等阿树。']);
      await S.say('陈松', ['阿树是我弟弟。月蕙走了以后，他出去打工，在外省的采石场……听说是塌方。九〇年的事。', '我去把他接回来的。没成家的人进不了祠堂，他的牌位，我一直供在铺子里。']);
      await S.say('陈松', ['要把婚书改回给阿树，得有阿树的庚帖。当年那张，叫林老三撕了；家里的八字底子，又让八八年的大水冲没了。', '我只记得零碎的：他是端午生的。时辰……我娘总念叨，是鸡叫头遍落的地。', '年份？他比月蕙大几岁来着……人老了。他那个铁盒子里有月蕙写给他的信，你翻翻。']);
      await S.say('陈松', '想好了，就在工作台上写。我手抖，写不了。');
      f.songTold = true;
      S.goal('在工作台上写出阿树的庚帖（线索：陈松的话、铁盒里的信、通书）');
      if (S.coop) S.toast('两个人：一个翻「笺」（日志里的笔记）念线索，一个在工作台上写');
      return;
    }
    const L = ['他是端午那天生的。我娘说，粽子包到一半就发作了。', '时辰是鸡叫头遍。我娘念叨了一辈子。', '年份……你看看那封信。月蕙那丫头，最爱拿岁数说事。'];
    if (f.bzWrong >= 3) L.push('我想起来了，阿树属马。我娘总说他跟马一样犟。');
    await S.say('陈松', L[(f._sl = ((f._sl ?? -1) + 1) % L.length)]);
  }
  async function tinOn(S) {
    const f = S.f; S.ent('tin').open = true;
    if (S.once('tin1')) await S.narr('一个绿色的铁皮饼干盒。\n里面是一沓信、两张电影票根，还有一个塑料发夹。');
    await S.note('letter'); f.readLetter = true;
    if (S.once('tin2')) await S.think('「你比我大三岁」……');
  }
  async function photoOn(S) {
    await S.narr('墙上钉着半张照片。照片上的后生剃着平头，笑出一口白牙，一只手搭在旁边——旁边被撕掉了。');
    if (S.f.songTold) await S.say('陈松', '另一半，在月蕙那儿。林老三撕的。');
  }
  async function pwShelf(S) {
    if (S.ent('pwshelf').s.taken) return S.narr('神龛空了，只剩一只小香炉。香还在烧。');
    await S.narr('小神龛里供着一块牌位：「陈公讳树之神位」。\n香炉里的香刚续上。');
  }
  async function bikeOn(S) {
    const f = S.f;
    if (f.bikeAsked) return S.narr(f.bike ? '纸自行车靠在墙边，车把上的红绸子被陈松重新系过了。' : '纸扎的二八自行车。车把上系着红绸子。');
    await S.narr('一辆纸扎的二八自行车，车把上系着红绸子，车铃是锡纸卷的。\n做工比铺子里别的东西都细。');
    if (!f.songTold) return;
    f.bikeAsked = true; S.face('song', 'pl');
    await S.say('陈松', ['每年阿树的忌日，我扎一辆，烧给他。', '他欠月蕙一辆「永久」。到死也没买成。']);
    const r = await S.ask('陈松低头看着那辆纸车。', ['「松伯，今晚把它带去林家吧。」', '（不说什么）'], '许川');
    if (r === 0) { f.bike = true; await S.say('陈松', '……好。我收拾收拾，随后就到。'); }
  }
  async function benchOn(S) {
    const f = S.f;
    if (f.solved) return S.narr('工作台上摊着竹篾和彩纸。写剩的红纸边角，被陈松收进了抽屉。');
    if (!f.songTold) return S.narr('工作台上摊着竹篾、彩纸和一碗浆糊。还有一沓裁好的红纸。');
    await S.narr('你铺开一张红纸，提起毛笔。\n乾造　陈树　□□年　□□□□　□□　生');
    const tg = await S.keypad('乾造　陈树　□□年\n年份的天干是？', TG, 1); if (tg == null) return;
    const dz = await S.keypad(`乾造　陈树　${tg}□年\n年份的地支是？`, DZ, 1); if (dz == null) return;
    const md = await S.keypad(`乾造　陈树　${tg}${dz}年\n哪一天生的？`, MD, 1); if (md == null) return;
    const sc = await S.keypad(`乾造　陈树　${tg}${dz}年　${md}\n什么时辰？`, SC, 1); if (sc == null) return;
    const okY = tg === '丙' && dz === '午', okD = md === '五月初五', okH = sc === '丑时';
    if (okY && okD && okH) return solved(S);
    const n = f.bzWrong = (f.bzWrong || 0) + 1;
    S.sfx('bad'); rustle(S, 1.2);
    const z = 'sz' + (1 + (n - 1) % 4); S.face(z, 'pl');
    if (n === 1) await S.narr('笔尖一顿，墨在红纸上洇开一大团。\n墙边有个纸人，脸朝你这边歪了一歪。');
    else if (n === 2) { S.fx('flash'); await S.narr('灯泡「滋」地闪了一下。\n靠墙的纸人，又有一个转过了脸。'); }
    else await S.narr('……又一个纸人转过了脸，空眼眶对着你。');
    const bad = []; if (!okY) bad.push('年份'); if (!okD) bad.push('日子'); if (!okH) bad.push('时辰');
    await S.say('陈松', bad.join('、') + '……不对。');
    if (n >= 4) return S.say('陈松', ['我想起来了！丙午年，五月初五，丑时。', '我娘念叨过一百遍——你就这么写。']);
    const H = {
      2: { 年份: '年份：月蕙是哪年生的？她的庚帖上有，通书上能对出是公历哪一年。阿树比她大三岁。', 日子: '日子：端午是哪一天？通书的「节令」里写着。', 时辰: '时辰：「鸡叫头遍」是什么时辰？通书里有一首时辰歌。' },
      3: { 年份: '年份：月蕙是己酉年生的，通书上己酉是一九六九年。往前数三年，一九六六年——通书上写的是哪两个字？', 日子: '日子：端午，五月初五。', 时辰: '时辰：时辰歌第二句——「鸡鸣丑」。' }
    }[n];
    if (H) await S.think(bad.map(b => H[b]).join('\n'));
  }
  async function solved(S) {
    const f = S.f; f.solved = true; S.ent('bench').s.done = true;
    S.sfx('chime');
    await S.narr('丙午年　五月初五　丑时。\n最后一笔落下，墨还没干，字迹像是自己往红纸里渗进去了一点。');
    S.face('song', 'pl');
    await S.say('陈松', ['……丙午，属马。端午，鸡叫头遍。', '对，对上了。我娘说过，这孩子是跟着鸡一块儿把全村叫醒的。']);
    S.give('gtshu');
    await S.narr('陈松从神龛上捧下阿树的牌位，用袖子擦了又擦，放进你手里。');
    S.ent('pwshelf').s.taken = true; S.give('paiwei');
    await S.say('陈松', '替我……把他送过去。');
    S.amb('none'); await S.wait(500);
    xiyue(S, .7, true); await S.wait(900); rustle(S, .9);
    await S.narr('门外传来一阵细细的乐声，像喜事，又像丧事。\n还有纸张摩擦的「沙沙」声，从门缝底下钻进来。');
    await S.walk('song', [6, 8], 3); S.face('song', 0);
    await S.narr('陈松凑到门缝上看了一眼，脸色一下子白了。');
    S.face('song', 'pl');
    await S.say('陈松', ['那是我给林家扎的纸人……我扎纸人，从来不点睛。谁给点上了？！', '……红姨。她怕你跑了，拿鸡血给它们点了眼睛。']);
    await S.say('陈松', ['你听好：点了睛的纸人看得见。可它们的脖子是竹篾扎的，转不过来——只看得见正前面，灯笼照得到的那四五步。', '别跑。纸人耳朵灵，跑起来的脚步声它们听得见，会转过身来。', '也别贴着它们走，碰一下，就让它们拽住了。', '子时一到，它们就直接进铺子请人。你得赶在子时之前，把牌位送进林家大门。']);
    await S.walk('song', [8, 4], 3); S.face('song', 1);
    S.amb('room');
    f.ph = 'sneak'; lastLeft = null; deaths = 0; lastCause = '';
    S.goal(GOAL_SNEAK);
    if (S.coop) S.toast('两个人：一个盯着纸人的背影报方向，一个走');
    S.cp('sneak');
  }
  async function sneakBrief(S) {
    S.goal(GOAL_SNEAK);
    if (deaths > 0) await S.think(lastCause === 'time'
      ? '……太慢了。纸人走到巷子尽头会停一下，再掉头。\n趁它背对你的时候走，别在一个地方干等。'
      : '纸人只看得见正前方四步，脖子转不过来。\n躲进岔巷深处，等它背过身再走。别跑，也别贴着它。');
  }
  async function leaveShop(S) {
    await S.go('village', 20, 9, 0);
  }

  /* ================= 纸人巡夜 ================= */
  async function startSneak(S) {
    const f = S.f;
    if (f.sneakOn) return;
    f.warned = false; f.grace = 0; f._pend = false; f._sn = 0;
    patReset(S, true);
    if (!deaths && S.once('sneak1')) {
      rustle(S, 1);
      await S.narr('巷子里亮着四盏红灯笼。\n灯笼底下，是四个挑着灯的纸人，一步一顿地走着，脚不沾地。');
      await S.think('林家在正街最西头。\n……躲开灯笼照着的地方。等它们背过身去。');
    }
    f.sneakOn = true;
    S.timer(lastLeft == null ? T0 : Math.max(lastLeft, TMIN), '子时', S2 => timeUp(S2), { during: true });
  }
  function sneakTick(S, dt) {
    const f = S.f;
    if (f.night && f.ph === 'shop' && !S.busy) { f._xy = (f._xy ?? 8) - dt; if (f._xy <= 0) { f._xy = 22 + Math.random() * 10; xiyue(S, .35, true); } }
    if (f.ph !== 'sneak' || !f.sneakOn || S.busy || W.endScreen || f._pend) return;
    const p = W.pl, px = Math.round(p.px / TS), py = Math.round(p.py / TS);
    let near = 99;
    if (f.grace > 0) f.grace -= dt;
    for (const id in PAT) {
      const e = S.ent(id); if (!e || e.hidden) continue;
      const [ex, ey] = tileOf(e), d = Math.abs(ex - px) + Math.abs(ey - py); near = Math.min(near, d);
      if (e.s.heard > 0) e.s.heard -= dt;
      else if (S.running && d <= 4 && !e.mv) {   // 听见跑步声：转过身来
        e.dir = Math.abs(px - ex) >= Math.abs(py - ey) ? (px < ex ? 1 : 2) : (py < ey ? 3 : 0);
        e.s.pause = Math.max(e.s.pause || 0, 1.6); e.s.heard = 2.5; e.bubble = { k: '?', until: RT + 1 };
      }
      patMove(S, e, dt);
      if (e.dir !== e._ld) setLamp(e);
      const r = seen(e);
      if (r && f.grace <= 0) {
        if (!f.warned) { f.warned = true; f.grace = 2.4; e.s.pause = Math.max(e.s.pause || 0, 2.6); S.run(S2 => warnSeen(S2, id, r)); }
        else { f._pend = true; S.run(S2 => caught(S2, id)); }
        return;
      }
    }
    f._sn = (f._sn || 0) - dt;
    if (f._sn <= 0) { f._sn = 1.2; if (near <= 6) rustle(S, Math.max(.3, 1.3 - near * .15)); if (near <= 3) S.sfx('heart'); }
  }
  async function warnSeen(S, id, r) {
    const e = S.ent(id);
    S.sfx('sting'); S.shake(300, 2); if (e) e.bubble = { k: '!', until: RT + 1.8 };
    rustle(S, 1.4);
    await S.think(r === 'near'
      ? '——碰到它了！纸做的袖子擦过手背，凉得像冰。\n快走开！（再被发现一次，就没有下次了。）'
      : '——灯笼照到我了！它停住了……\n快离开它的正前方！（再被发现一次，就没有下次了。）');
  }
  async function caught(S, id) {
    const f = S.f; f.sneakOn = false; lastLeft = S.timerLeft; S.clearTimer(); deaths++; lastCause = 'caught';
    if (S.ent(id)) S.face(id, 'pl');
    xiyue(S, 1, false);
    await S.scare('face', { face: 'zhiren', sfx: 'scream' });
    await S.die('两只纸糊的手，一左一右架住了你的胳膊。\n竹篾扎的手指轻得像没有分量，可你怎么也挣不开。\n灯笼在前头引路，喜乐吹起来了——它们抬着你，朝林家走去。', '被纸人请去了喜堂');
  }
  async function timeUp(S) {
    const f = S.f; if (!f.sneakOn) return;
    f.sneakOn = false; lastLeft = 0; deaths++; lastCause = 'time';
    chime(S, 3); await S.wait(1200);
    await S.narr('远处传来钟声。一下，两下……十二下。\n子时到了。');
    for (const id in PAT) { const e = S.ent(id); if (e && !e.hidden) { S.face(id, 'pl'); e.bubble = { k: '!', until: RT + 2 }; } }
    await S.scare('face', { face: 'zhiren', sfx: 'scream' });
    await S.die('四盏红灯笼，从四条巷子里同时朝你飘过来。\n「吉时到——请新郎——」', '子时到了');
  }

  /* ================= 林家 ================= */
  async function arrival(S) {
    const f = S.f;
    ['yhr', 'shu', 'songL', 'bikeL', 'fireL', 'yhg'].forEach(id => S.hide(id)); S.show('zxn');
    S.pos(10, 11, 3);
    if (!f.arrSeen) {
      await S.narr('林家的大门在身后「吱呀」一声合上了。\n院子里摆着两桌酒席，碗筷整整齐齐，一个客人也没有。厅堂里点满了红蜡烛。');
      xiyue(S, .8, false);
      f.arrSeen = true;
      S.goal('别跪。先弄清楚月蕙想要什么');
      S.cp('lu');
    }
    S.face('hongyi', 'pl');
    await S.say('红姨', '哎哟，姑爷可算来了！吉时就到——快，到堂前跪下！');
    const r = await S.ask('纸新娘立在供桌旁边，白脸朝着门口。', ['（走过去，跪下）', '「等一下！」'], '许川');
    if (r === 0) return badBai(S, 'arrive');
    await S.say('许川', '等一下！');
    S.face('linbo', 'pl');
    await S.say('林伯', '你怀里抱的什么？');
    await S.say('许川', '阿树的牌位。');
    S.bubble('linbo', '!', 1200); S.shake(300, 2);
    await S.say('林伯', ['陈家的东西，也敢抱进我林家的门！', '给我扔出去！']);
    S.face('linshen', 'pl');
    await S.say('林婶', ['老三……让孩子去看看月蕙的屋子吧。', '十九年了，你一次都没进去过。']);
    S.face('linbo', 3);
    await S.narr('林伯张了张嘴，什么也没说，转过身去，对着祖先的牌位。');
    S.goal('去左边月蕙的闺房看看');
  }
  async function boudoir(S) {
    const f = S.f; f.boudoir = true;
    S.amb('none');
    S.place('yhg', 4, 3, 3); S.ent('yhg').alpha = 0; await S.alpha('yhg', .85, 900);
    await S.narr('闺房里冷得像地窖。\n梳妆台前坐着一个人，背对着你，在梳辫子。一下，一下。');
    S.sfx('whisper');
    await S.narr('镜子里，映出她的脸——');
    await S.scare('face', { face: 'yuehui' });
    await S.say('月蕙', ['……你不是他。', '……抽屉……'], { style: 'whisper' });
    await S.alpha('yhg', 0, 1000);
    S.amb('room');
    S.goal('拉开梳妆台的抽屉');
  }
  async function vanityOn(S) {
    const f = S.f;
    if (f.gotDiary) return S.narr('梳妆台上摆着一把桃木梳，梳齿间还缠着几根长头发。');
    f.gotDiary = true;
    await S.narr('梳妆台最底下的抽屉卡得很紧。你用力一拉——\n里面是一本塑料皮日记本，和半张烧焦的红纸。');
    S.give('halfgt');
    await S.narr('红纸上写着「乾造　陈树」，后半边烧没了。\n焦黑的边上，留着一个小小的、手指头大的印子。');
    await S.think('这就是阿树的庚帖。她从灶里抢出来的那半张。');
    S.give('diary'); await S.note('diary');
    S.goal('把月蕙的东西拿给林伯看');
  }
  async function linboTalk(S) {
    const f = S.f; S.face('linbo', 'pl');
    if (f.agreed) return S.say('林伯', f.swapped ? '……把牌位摆上去吧。' : '改吧。照她的意思改。');
    if (!S.has('diary')) return S.say('林伯', '……红包认人。你跑不了的。');
    const r = await S.ask('林伯背对着你。给他看什么？', ['（月蕙的日记）', '（半张烧焦的庚帖）', '（阿树的牌位）'], '许川');
    if (r === 0) return agree(S);
    f.evWrong = (f.evWrong || 0) + 1;
    if (r === 1) await S.say('林伯', ['……这张纸是我撕的。', '撕了就撕了！陈家那时候穷得叮当响，我能让女儿跟着他吃苦？']);
    else await S.say('林伯', '拿开！');
    S.face('hongyi', 'pl');
    await S.say('红姨', '老三，吉时不等人哪！');
    if (f.evWrong >= 2) await S.think('他认得这些东西，却不肯认错……\n也许，得让他听听月蕙自己的话。');
  }
  async function agree(S) {
    const f = S.f; S.take('diary');
    await S.narr('林伯接过日记本，翻到最后一页。\n他的手开始抖，抖得纸页沙沙地响。');
    await S.say('林伯', ['……「爹，我不怪你了。」', '……「我只要他。」']);
    await S.narr('老人慢慢蹲了下去，把日记本按在胸口。');
    await S.say('林伯', ['十九年，我一次都不敢进那个屋子。', '我总想着给她找户好人家，让她有个地方去，不用再缩在门后头……', '她要的，从来就不是什么好人家。']);
    S.face('hongyi', 'linbo');
    await S.say('红姨', '老三！八字合过了，喜帖也发了，临时换人，是要遭报应的！');
    S.face('linbo', 'hongyi');
    await S.say('林伯', ['我女儿的婚事——这一回，让她自己做主。', '改。']);
    S.face('linshen', 'pl');
    await S.say('林婶', '……月蕙。', { style: 'whisper' });
    f.agreed = true;
    S.goal('把阿树的庚帖放进供桌上的婚书');
  }
  async function hunshuOn(S) {
    const f = S.f;
    if (f.swapped) return S.narr('婚书上，新郎一栏写着：陈树。\n月蕙的牌位上，红布被风掀起了一角。');
    if (!f.agreed) return S.narr(['供桌上摊着一张婚书。「新郎」一栏，写着你的名字。', '旁边立着月蕙的牌位，盖着一块红布。\n——要改婚书，得主婚的林伯点头。']);
    await S.narr('婚书上，「新郎」一栏写着你的名字，名字底下是你的八字。');
    S.take('gtshu'); S.take('halfgt'); S.ent('hunshu').s.swapped = true; f.swapped = true;
    await S.narr('你把陈松写的那张庚帖压在上面，又把月蕙抢出来的那半张拼在旁边。\n一新一旧两张红纸，写的是同一个名字：陈树。');
    S.sfx('chime');
    await S.narr('烛火「噗」地往上一蹿，红得发亮。');
    S.goal('把阿树的牌位摆上新郎的椅子');
  }
  async function chairOn(S) {
    const f = S.f;
    if (!f.swapped) return S.narr('新郎的椅子，铺着红缎坐垫。空着，在等人坐上去。');
    if (f.cer) return S.narr('阿树的牌位端端正正地摆在椅子上。');
    S.take('paiwei'); S.ent('gchair').s.pw = true; f.cer = true;
    await S.narr('你把阿树的牌位，端端正正地摆在新郎的椅子上。');
    S.goal('拜堂');
    S.cp('final');
    await ceremony(S);
  }
  async function ceremony(S) {
    const f = S.f;
    ['shu', 'fireL'].forEach(id => S.hide(id)); S.ent('gchair').s.pw = true;
    S.pos(12, 5, 3);
    if (!f.cerSeen) {
      S.amb('none'); await S.wait(500);
      chime(S, 3); await S.wait(800);
      await S.narr('墙上的挂钟「当——」地敲响了。\n一下，两下……十二下。子时。');
      await S.narr('满屋的红蜡烛同时矮了一截。\n供桌旁边，纸新娘的脸——慢慢地转了过来。');
      S.place('yhr', 14, 4, 0); S.ent('yhr').alpha = 0;
      bg(S.alpha('zxn', 0, 1200)); await S.alpha('yhr', .95, 1200);
      await S.narr('站在那里的，不再是纸人了。\n是一个穿红袄的姑娘，两条麻花辫扎着红头绳。她看看椅子上的牌位，又看看你。');
      if (f.bike) {
        S.place('songL', 10, 11, 3); S.show('bikeL');
        await S.say('陈松', '……等等我！');
        await S.walk('songL', [10, 8], 3);
        await S.narr('陈松气喘吁吁地跑进院子，把那辆纸扎的自行车，轻轻放在天井中间。');
      }
      f.cerSeen = true; S.cp('final');
    } else {
      S.hide('zxn'); S.place('yhr', 14, 4, 0); S.ent('yhr').alpha = .95;
      if (f.bike) { S.place('songL', 10, 8, 3); S.show('bikeL'); }
    }
    S.goal('拜堂'); S.amb('room');
    S.face('linbo', 'pl');
    await S.say('林伯', '……我来喊。');
    gong(S);
    const r = await S.ask('林伯：「一拜天地——」', ['（捧起阿树的牌位，替他拜）', '（自己跪下）'], '许川');
    if (r === 1) return badBai(S, 'final');
    S.ent('gchair').s.pw = false;
    await S.narr('你从椅子上捧起阿树的牌位，抱在胸前，在红垫子上跪下，朝门外的天磕了一个头。');
    gong(S);
    await S.say('林伯', '二拜高堂——');
    S.turn(1);
    await S.narr('你转过身，朝林伯和林婶磕了一个头。\n林婶捂着嘴，哭出了声。');
    gong(S);
    await S.say('林伯', '夫妻对拜——');
    S.turn(2); S.face('yhr', 1);
    await S.narr('你转向她。\n她也转过来——不是对着你，是对着你怀里的牌位。');
    gong(S, 1.2);
    S.place('shu', 13, 5, 1); S.ent('shu').alpha = 0;
    await S.alpha('shu', .9, 1000);
    await S.narr('怀里的牌位忽然轻了。\n你身边多了一个人：白衬衫，袖子挽到胳膊肘，剃着平头。');
    await S.narr('他和她，隔着一张供桌，一起弯下了腰。');
    S.sfx('chime'); crackers(S, 18, .8);
    await S.say('月蕙', ['……阿树。', '你怎么才来。'], { style: 'whisper' });
    await S.say('阿树', '路太远了。我来晚了。', { style: 'whisper' });
    S.face('yhr', 'pl');
    await S.say('月蕙', ['谢谢你。', '对不住，吓着你了。'], { style: 'whisper' });
    if (f.bike) {
      S.place('fireL', 9, 9); S.show('fireL'); S.ent('bikeL').s.burn = 1; S.face('songL', 0);
      await S.narr('天井里，陈松划着了火柴。纸扎的自行车一碰到火苗，「呼」地烧了起来。');
      await S.say('陈松', '阿树……车给你扎好了。这回，别再让人家姑娘走路。');
      S.tone('sine', 2100, 2080, .25, .05, 0, 4000); S.tone('sine', 2100, 2080, .25, .05, .35, 4000);
      await S.narr('火光里，一个后生推着一辆二八自行车，后座上坐着梳辫子的姑娘。\n车铃「叮铃、叮铃」响了两声。');
    } else await S.narr('两个人并肩走下台阶，走过空荡荡的酒席，走出了林家的大门。\n谁也没有回头。');
    bg(S.alpha('yhr', 0, 1400)); await S.alpha('shu', 0, 1400);
    S.take('hongbao');
    await S.narr('你摸了摸口袋。红包轻了。\n打开一看，里面只剩一张红纸，墨迹淡得几乎看不见了。');
    await S.fade(1, 1400);
    await S.card('三天后', '', '阿公的三年法事做完了。\n\n林伯亲手捧着月蕙的牌位，走进陈家的祠堂，\n和阿树的并排放着。\n那是十九年来，林老三第一次进陈家的门。\n\n红包，我还给了林伯。\n他把里面的钱压在两块牌位底下，说是月蕙的嫁妆。');
    await S.end({
      id: 'heart', title: '第十三夜　完',
      text: f.bike
        ? '回城那天，车经过村口。\n大榕树底下，有人看见一辆自行车拐进了老巷子，后座上坐着梳辫子的姑娘，车把上系着红绸。\n\n车铃响了两声。\n像是在跟谁打招呼。'
        : '回城那天，车经过村口。\n大榕树上缠的那圈红布，不知道被谁解了下来，系在了土地公庙的门环上。\n\n风一吹，红布飘起来，\n像两条麻花辫上的红头绳。'
    });
  }

  /* ================= 坏结局 ================= */
  async function badBai(S, kind) {
    if (kind === 'early') {
      S.ent('luDoor').open = true; S.sfx('open');
      await S.go('lu', 10, 11, 3);
      S.face('hongyi', 'pl');
      await S.say('红姨', '哎哟，姑爷自己上门了！好，好！吉时提前，拜！');
    }
    if (kind === 'final') { S.ent('gchair').s.pw = true; await S.narr('你把阿树的牌位留在椅子上，自己在红垫子上跪了下去。'); }
    else await S.walk('pl', [12, 5], 3);
    S.turn(3); S.amb('none');
    await S.say('红姨', '一拜天地——', { style: 'big' }); gong(S);
    await S.narr('一只手按在你的后颈上，冰凉。你的额头碰到了地砖。');
    await S.say('红姨', '二拜高堂——', { style: 'big' }); gong(S);
    await S.narr('林伯坐在上首，眼睛通红。林婶别过了脸。');
    await S.say('红姨', '夫妻对拜——', { style: 'big' }); gong(S, 1.3);
    S.turn(2);
    await S.narr(kind === 'final'
      ? '你转过身。对面的姑娘没有弯腰。\n她只是看着椅子上的牌位，看了很久，很久。'
      : '你转过身。纸新娘慢慢地、慢慢地低下了头。\n纸做的脸上，两团胭脂红得发亮。');
    await S.scare('face', { face: 'yuehui' });
    crackers(S, 20, 1);
    await S.say('红姨', '礼成——送入洞房——', { style: 'big' });
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'bai', title: '拜了堂', text: '那年冬天以后，坂头村的人都说，许家那个孙子娶了林家的姑娘。\n\n你回了城里，照常上班，照常过日子。只是每一个跟你相亲的姑娘，第二天都会推掉，说夜里梦见一个梳辫子的女孩坐在床边，对她说：「他有人了。」\n\n可你知道，那个女孩每晚坐在你床边的时候，望着的从来不是你。\n她望着窗外，像在等一辆自行车。' });
  }
  async function badBurn(S) {
    S.take('hongbao'); S.sfx('paper');
    await S.narr('你把红包丢进灶膛。\n火舌一卷，红纸卷了边，那缕头发「滋」地一声缩成了一团。');
    crackers(S, 6, .4);
    await S.narr('……你松了一口气。');
    await S.fade(1, 1000);
    S.amb('none');
    await S.narr('半夜，你被冻醒了。\n屋里一股烧纸的味道。');
    await S.narr('床前站着一个梳辫子的姑娘，浑身都是灰。\n她弯下腰，凑到你耳边。');
    await S.scare('face', { face: 'yuehui', sfx: 'scream' });
    await S.say('月蕙', ['……你把我的八字烧了。', '现在，我谁也找不到了。', '我只认得你。'], { style: 'whisper' });
    await S.end({ bad: true, id: 'burn', title: '烧了红包', text: '第二天一早，阿嬷在你的枕头边发现一小撮纸灰。灰里裹着一根红线，一头系在你的无名指上，怎么也解不开。\n\n从那以后，你走到哪里，身后都跟着一股烧纸的味道。\n\n老人们说，红包烧了，就是把她唯一认得的路烧了。\n她回不去，只好跟着你。' });
  }

  /* ================= 林家的人 ================= */
  async function linshenTalk(S) {
    S.face('linshen', 'pl');
    if (S.f.agreed) return S.say('林婶', '后生，谢谢你。……月蕙小时候最怕黑，今晚点了这么多蜡烛，她不怕了。');
    await S.say('林婶', ['月蕙的屋子，在左边。十九年了，我天天擦，他一次都没进去过。', '你去看看吧。她要是有话，会跟你说的。']);
  }
  async function hongyiTalk(S) {
    S.face('hongyi', 'pl');
    if (S.f.agreed) return S.say('红姨', '哼，坏了规矩。出了事，可别怪我红姨没说过。');
    await S.say('红姨', ['姑爷，磨蹭什么呀？吉时不等人。', '……你手里那块牌位，最好别让老三看见。']);
  }
})();
