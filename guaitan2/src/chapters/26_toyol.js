/* ================= 第二十六夜 · 鬼仔 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const pick = a => a[(Math.random() * a.length) | 0];

  /* ---------- 四样诱饵 ----------
     它是个孩子：看见豆子就要数，看见镜子就要照，看见弹珠就要玩，看见螃蟹就要追。
     拖住它的时间：豆子 > 镜子 > 弹珠 > 螃蟹（拓婆的话、阿依莎的本子、夜里的实际表现三处一致；第二夜木盒的顺序就是它反过来） */
  const LN = { kacang: '绿豆', cermin: '镜子', guli: '弹珠', ketam: '螃蟹' };
  const LDESC = {
    kacang: '一把绿豆撒在圈里，绿莹莹的，像一地小眼睛。',
    cermin: '镜子斜靠在地上，照着黑乎乎的走廊。',
    guli: '一小堆玻璃弹珠，在暗处闪着一点一点的光。',
    ketam: '螃蟹扣在一只破碗底下，碗沿时不时「咔咔」地动一下。'
  };
  /* 夜一：守钱罐 */
  const N1 = { len: 65, goSpd: 2.4, backSpd: 3.4, R: 2, dur: { kacang: 12, guli: 5, ketam: 3.5 }, mir: [8, 4, 2], out: { steal: 4, guli: 9, ketam: 3, dawn: 99 }, first: 2.5, lose: 2 };
  const DRAIN1 = [2, 2], TILL1 = [4, 9];
  /* 夜二：Seman 家，饿了的鬼仔 */
  const N2 = { prowl: 2.0, hunt: 3.0, huntFed: 3.5, R: 3, see: 3, seeRunFar: 10, bleed: 2, dur: { kacang: 9, guli: 4, ketam: 3.5 }, mir: [7, 4, 2], lost: 7, huntMax: 8, rest: 2.5 };
  const WP2 = [[2, 4], [10, 3], [16, 4], [17, 8], [10, 9], [3, 8]];
  const HOME2 = [1, 4];
  let n1Fails = 0, n2Fails = 0;

  /* ---------- 合成音效 ---------- */
  function giggle(S, v = .045, d = 0, lp = 6500) { [1900, 2300, 1750, 2150, 1600].forEach((f, i) => S.tone('triangle', f, f * .82, .07, v, d + i * .085, lp)); }
  function beanTicks(S, n = 5, gap = .17) { for (let i = 0; i < n; i++) S.tone('square', 2600 + (i % 3) * 140, 2450, .022, .018, i * gap, 5000); }
  function clink(S, v = .05) { S.tone('sine', 3100, 3050, .09, v, 0, 8000); S.tone('sine', 4200, 4150, .06, v * .5, .05, 8000); S.tone('sine', 3100, 3050, .06, v * .3, .22, 6000); }
  function crabClick(S) { for (let i = 0; i < 4; i++) S.tone('square', 3400, 2800, .018, .028, i * .07, 7000); }
  function shimmer(S) { S.tone('sine', 1100, 1800, .5, .03, 0, 5000); S.tone('sine', 1650, 2700, .5, .015, .12, 6000); }
  function gurgle(S, v = .05) { for (let i = 0; i < 5; i++) S.tone('sine', 160 - i * 12, 90, .14, v, i * .12, 600); }
  function biteSnd(S) { S.tone('square', 260, 70, .18, .06, 0, 1800); S.tone('sawtooth', 120, 60, .25, .03, .05, 900); }
  function rooster(S) { S.tone('triangle', 620, 880, .22, .05, 0, 4000); S.tone('triangle', 880, 820, .35, .05, .22, 4000); S.tone('triangle', 820, 560, .45, .045, .57, 3500); }
  function heart(S, v = .09) { S.tone('sine', 70, 40, .12, v, 0, 300); S.tone('sine', 66, 40, .12, v * .8, .22, 300); }
  function coins(S) { [2600, 3300, 2900, 3600].forEach((f, i) => S.tone('sine', f, f * .97, .07, .035, i * .06, 8000)); }
  function rattle(S) { for (let i = 0; i < 7; i++) S.tone('square', 300 + (i % 2) * 180, 200, .04, .05, i * .06, 2500); }
  function hum(S, v = .03) { /* 拓婆哼的摇篮曲 Dodoi（五声音阶） */
    let t = .1;
    for (const [f, d] of [[392, .5], [440, .5], [392, .5], [330, 1], [294, .5], [330, .5], [392, 1.2], [440, .5], [392, .5], [330, .5], [294, 1.4]]) { S.tone('sine', f, f * .995, d * .95, v, t, 1400); S.tone('triangle', f / 2, f / 2, d * .9, v * .3, t, 700); t += d; }
  }
  function azan(S) { [[392, 392, 2.4, 0], [440, 415, 2, 2.3], [392, 370, 2.8, 4.2], [349, 392, 2.2, 7]].forEach(([a, b, d, t]) => { S.tone('sine', a, b, d, .04, t, 1100); S.tone('sine', a * 2, b * 2, d, .011, t, 1600); }); }

  /* ---------- 人物 ---------- */
  const SKY = '#7ab0c8';
  function songkok(c) { return (g, d, fr, G, R) => { R(4, G.hT - 2, 8, 3, c); if (d === 0) R(4, G.hT, 8, 1, shade(c, .2)); }; }
  const people = {
    me: { skin: '#e8c49a', hair: '#151012', hs: 'short', child: true, top: '#f2f2ec', top2: '#dcdcd4', bottom: '#2a4a7a', shoes: '#3a6aa0' },
    abah: { key: 'ty-abah', skin: '#d8b088', hair: '#2a2424', hs: 'short', top: '#efefe6', top2: '#d6d6cc', bottom: '#2a2a30', shoes: '#4a3a2a',
      extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT + 1, 1, 4, '#d8b088'); R(12, G.tT + 1, 1, 4, '#c8a078'); R(5, G.hT + 4, 2, 1, '#3a3a3a'); R(9, G.hT + 4, 2, 1, '#3a3a3a'); R(7, G.hT + 4, 2, 1, '#555'); } else if (d === 1) R(4, G.hT + 4, 3, 1, '#3a3a3a'); } },
    aisyah: { key: 'ty-aisyah', skin: '#c8946a', hair: '#151010', hs: 'long', child: true, hat: 'scarf', hatC: '#f0ece0', dress: true, top: SKY, top2: '#f0ece0', bottom: SKY, shoes: '#e8e0d0', mouth: '#9a5a4a' },
    tokwan: { key: 'ty-tokwan', skin: '#b4865e', hair: '#dcdcdc', hs: 'bun', hat: 'scarf', hatC: '#e6dcc4', top: '#7a4a5a', top2: '#e6dcc4', bottom: '#4a3a5a', skirt: true, shoes: '#3a2a1a',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 1, 1, '#8a2a2a'); R(9, G.hT + 6, 1, 1, '#8a2a2a'); } } },
    ketua: { key: 'ty-ketua', skin: '#b8885e', hair: '#2a2020', hs: 'short', top: '#c8b070', top2: '#a89050', bottom: '#5a3a5a', skirt: true, shoes: '#2a2a2a',
      extra(g, d, fr, G, R) { songkok('#141418')(g, d, fr, G, R); if (d === 0) { R(6, G.hT + 6, 4, 1, '#2a2020'); } } },
    imam: { key: 'ty-imam', skin: '#b08458', hair: '#2a2020', hs: 'short', top: '#f0f0ea', top2: '#dcdcd4', bottom: '#f0f0ea', robe: true, shoes: '#3a2a1a',
      extra(g, d, fr, G, R) { R(4, G.hT - 2, 8, 3, '#f4f4ee'); if (d === 0) { R(5, G.hT + 6, 6, 2, '#dcdcd8'); } else if (d === 1) R(4, G.hT + 6, 3, 2, '#dcdcd8'); } },
    muthu: { key: 'ty-muthu', skin: '#7a5034', hair: '#141010', hs: 'short', top: '#e8e4f0', top2: '#c8c4d8', bottom: '#3a3a4a', shoes: '#2a1a10',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 6, 1, '#141010'); R(7, G.hT, 2, 1, '#c03030'); } else if (d === 1) R(4, G.hT + 5, 3, 1, '#141010'); } },
    rama: { key: 'ty-rama', skin: '#6a4430', hair: '#141010', hs: 'short', top: '#ecebe4', top2: '#d4d2c8', bottom: '#e0dccc', skirt: true, shoes: '#3a2a1a',
      extra(g, d, fr, G, R) { R(4, G.hT - 1, 8, 2, '#e8e0c8'); if (d === 0) { R(5, G.hT + 5, 6, 1, '#d8d8d0'); R(13, G.tT + 2, 1, 5, '#8a8a90'); } } },
    seman: { key: 'ty-seman', skin: '#b0825a', hair: '#1c1616', hs: 'messy', top: '#5a6a4a', top2: '#4a5a3a', bottom: '#3a4a6a', skirt: true, shoes: '#3a2a1a',
      extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tB - 1, 1, 2, '#f4f4ee'); R(12, G.tB - 1, 1, 2, '#f4f4ee'); R(5, G.hT + 3, 2, 1, '#5a3a2a'); R(9, G.hT + 3, 2, 1, '#5a3a2a'); } else if (d === 1) R(7, G.tB - 1, 2, 2, '#f4f4ee'); } },
    timah: { key: 'ty-timah', skin: '#c09068', hair: '#2a2020', hs: 'bun', hat: 'scarf', hatC: '#c86a7a', top: '#d8a050', top2: '#c86a7a', bottom: '#6a3a3a', skirt: true, shoes: '#3a2a1a' },
    kopi: { key: 'ty-kopi', skin: '#a87a52', hair: '#2a2020', hs: 'short', top: '#4a6a8a', top2: '#3a5a7a', bottom: '#4a3a5a', skirt: true, shoes: '#2a2a2a', extra: songkok('#141418') },
    kopi2: { key: 'ty-kopi2', skin: '#d8b088', hair: '#8a8a88', hs: 'short', top: '#f0f0e8', bottom: '#2a2a30', shoes: '#4a3a2a' }
  };

  /* ---------- 惊吓大头像（32×32） ---------- */
  function tyHead(R, sad) {
    const sk = '#8a9c84', sd = '#6a7c66', hi = '#a4b69c';
    R(0, 0, 32, 32, '#050705');
    R(2, 12, 5, 6, sk); R(1, 10, 2, 4, sk); R(0, 8, 2, 3, sk); R(25, 12, 5, 6, sk); R(29, 10, 2, 4, sk); R(30, 8, 2, 3, sk);   // 尖耳朵
    R(7, 4, 18, 24, sk); R(8, 3, 16, 1, sk); R(9, 2, 14, 1, sk); R(6, 7, 1, 18, sk); R(25, 7, 1, 18, sk); R(9, 28, 14, 2, sd);
    R(10, 4, 8, 2, hi); R(7, 8, 1, 14, sd); R(24, 8, 1, 14, sd);
    R(12, 9, 1, 1, sd); R(19, 8, 1, 2, sd); R(15, 6, 1, 1, sd);   // 头顶的青筋
    if (sad) {
      R(10, 13, 5, 4, '#1a1a14'); R(17, 13, 5, 4, '#1a1a14'); R(11, 14, 2, 2, '#4a3a2a'); R(18, 14, 2, 2, '#4a3a2a'); R(11, 14, 1, 1, '#f0f0e8'); R(18, 14, 1, 1, '#f0f0e8');
      R(10, 12, 5, 1, sd); R(17, 12, 5, 1, sd);
    } else {
      R(9, 12, 6, 6, '#060606'); R(17, 12, 6, 6, '#060606'); R(10, 11, 4, 1, '#060606'); R(18, 11, 4, 1, '#060606');
    }
    R(15, 19, 1, 1, sd); R(17, 19, 1, 1, sd);
  }
  const faces = {
    toyol(R, a, t) {
      tyHead(R, false);
      const bl = Math.sin(t * 9) > .9 ? 0 : 1;
      if (bl) { R(12, 14, 2, 2, '#e8d040'); R(20, 14, 2, 2, '#e8d040'); R(12, 14, 1, 1, '#fff8b0'); R(20, 14, 1, 1, '#fff8b0'); }
      const o = Math.min(5, 1 + Math.floor(a * 9));
      R(10, 22, 12, o, '#2a0808'); R(9, 21, 1, 1, '#2a0808'); R(22, 21, 1, 1, '#2a0808');
      for (let i = 0; i < 6; i++) { R(10 + i * 2, 22, 1, 1, '#ecebe0'); if (o > 2) R(11 + i * 2, 21 + o, 1, 1, '#ecebe0'); }
      R(8, 29, 16, 1, '#b02020'); R(15, 30, 2, 2, '#b02020');   // 脖子上的红线
    },
    tysad(R, a, t) {
      tyHead(R, true);
      const k = ((t * 1.4) % 1);
      R(11, 17 + Math.floor(k * 8), 1, 2, '#9ac8e8'); R(20, 18 + Math.floor(((t * 1.4 + .5) % 1) * 7), 1, 2, '#9ac8e8');   // 眼泪
      if (a > .5) { R(14, 23, 4, 1, '#4a2a2a'); } else { R(13, 23, 6, 1, '#4a2a2a'); R(13, 24, 1, 1, '#4a2a2a'); R(18, 24, 1, 1, '#4a2a2a'); }
      R(10, 19, 2, 1, '#b08a80'); R(20, 19, 2, 1, '#b08a80');
    }
  };

  /* ---------- 物品、笔记、档案 ---------- */
  const items = {
    kacang: { name: '一袋绿豆（kacang hijau）', desc: '店里麻袋里舀出来的绿豆，装在纸袋里。够撒两回。' },
    bilis: { name: '一小把江鱼仔（ikan bilis）', desc: '晒干的小银鱼，腥得很。拿来引螃蟹。' },
    guli: { name: '一罐弹珠（guli）', desc: '你攒了三年的弹珠。最漂亮的那颗是「猫眼」——透明的玻璃里裹着一道蓝，阿公在世时从新加坡带回来的。' },
    guli2: { name: '一把弹珠（guli）', desc: '罐子里剩下的普通弹珠，有几颗已经磨花了。' },
    mata: { name: '猫眼弹珠', desc: '透明的玻璃里裹着一道蓝，对着光看，像一只眯起来的眼睛。阿公留给你的。' },
    cermin: { name: '一面旧镜子（cermin）', desc: '穆图理发店换下来的镜子，左下角裂了一道。巴掌宽，一尺来高。' },
    ketam: { name: '一只螃蟹（ketam）', desc: '河边泥滩上抓的小螃蟹，扣在一只破碗里，钳子一张一合。' },
    botol: { name: '鬼仔的瓶子', desc: '褐色的小玻璃瓶，瓶口用黄布扎着，缠了七道红线。拿在手里是温的，里面有什么东西在轻轻地敲玻璃。' }
  };
  const notes = {
    akhbar: { title: '剪报 ·《南洋奇谈》专栏（1986年2月）', text: '（咖啡摊柱子上钉着的一张华文报剪报。）\n\n〈鬼仔又来了？〉\n\n近来北马数个甘榜传出「门窗紧闭、钱却少了」的怪事。乡民议论纷纷，都说是「鬼仔」（Toyol）作祟。\n\n老一辈人说：鬼仔是巫师用秘法养出来的小鬼，样子像光头的小孩，平时住在瓶子里。主人要定时喂它，它就替主人偷钱。一般人看不见它，门锁窗闩都挡不住。\n\n防它的办法，说来像哄小孩：钱旁边撒一把绿豆，它非数完不可；摆一面镜子，它会对着镜子玩个不停；放几颗弹珠、一只螃蟹，它就忘了正事。\n\n也有人说，这些都是穷日子里的疑心病。锡矿关门以后，偷钱的未必是鬼。\n\n——本栏姑妄言之，读者姑妄听之。' },
    senarai: { title: '村长的本子（Tok Ketua 抄的失窃单）', text: '（村长用圆珠笔写的马来文，你和阿依莎一起看懂了。）\n\n三月　丢钱的人家：\n一号　拓婆家 —— 米缸底下，二十元\n二号　苏莱曼伊玛目 —— 祈祷室的捐款箱，一半\n三号　振兴号 —— 钱罐，三回\n四号　穆图理发店 —— 抽屉，一半\n五号　咖啡摊 —— 钱箱，两回\n六号　村长家 —— 衣柜，四十元\n七号　Timah 姐 —— 枕头套里的私房钱，一半\n九号　空屋（主人去了吉隆坡）\n\n都是晚上，都是门窗关好的。\n都是只拿走一半。\n\n（最底下又添了一行，字写得很重：）\n割胶的拉玛萨米，三月初才搬来。' },
    buku: { title: '阿依莎的练习簿', text: '（封面写着「Aisyah binti Hassan　六年级」。中间一页，是她一边听外婆说、一边记的。）\n\n外婆说的 —— 鬼仔（toyol）\n· 是巫师用一个没能出世的孩子「养」出来的。住在瓶子里。\n· 主人要喂它。喂什么？外婆不肯说，只说「喂它的人，手指头上总缠着布」。\n· 大人看不见它，小孩有时候看得见。\n· 它只拿一半。它是个孩子，分东西总是一人一半。\n\n怎么拖住它（外婆说的，从久到短）：\n1. 绿豆 —— 它非数完不可，最久。\n2. 镜子 —— 它能照好久，可是照多了会腻。\n3. 弹珠 —— 玩一会儿就揣一颗跑回家。\n4. 螃蟹 —— 一爬走它就忘了，追着跑，最短。\n\n要摆在它一定会经过的地方！\n\n（页边画了一个光头小人，被她涂黑了。）' },
    surat: { title: '巫师的纸（爪夷文，Seman 用铅笔在旁边注了马来文）', text: '（叠成小方块，夹在饼干罐里。纸很旧，有一角沾着褐色的印子。）\n\n养它的人要记住：\n一、它是孩子。拿回来的钱一半归你，一半放在瓶子边上，让它自己数。\n二、礼拜四晚上（malam Jumaat）喂它，用你自己的——（这几个字被人用指甲刮掉了）\n三、别让它看见镜子。它会想起自己是什么。\n四、瓶子锁在木盒里。盒盖上的四块木片，顺序和它的心思反过来：它最放不下的，放在最后；最容易丢下的，放在最前。这样它自己永远打不开。\n五、谁拿着瓶子，它就跟着谁。\n六、不想养了，不能扔、不能砸。天亮的时候，在流动的水边，让它照一照镜子，还它一样孩子玩的东西，再打开瓶口。\n\n（第六条底下，有人用铅笔描了很多遍，把纸都描破了。）' }
  };
  const legend = '鬼仔（Toyol，印度尼西亚叫 Tuyul）是马来世界流传最广的小鬼之一。通常的说法是：它由巫师（bomoh）用秘法从一个夭折的胎儿或婴儿「养」出来，样子像一两岁的光头小孩，皮肤发青发灰、眼睛很大，有人说耳朵尖、牙齿尖。它住在瓶子或小陶罐里，主人要定期喂它——流传最广的说法是喂主人自己的血，让它吸手指或脚趾；也有说喂牛奶和糖果的。它唯一的本事是替主人偷钱，一般人看不见它，门窗关着也挡不住。不少说法里它只拿走一部分钱，这样主人家不容易起疑。\n\n民间防它的办法很孩子气：在钱旁边撒绿豆，据说它会忍不住一颗一颗地数，一直数到天亮；放镜子，它会对着镜子玩；放螃蟹、弹珠之类的玩意儿，它会去玩，忘了偷。有的地方还在绿豆里插几根针。人们还相信，鬼仔不能随手扔掉——不想养了，要请人「送」走，或把瓶子投进海里、流水里，否则它会回头缠住主人，甚至主人的后代。爪哇的 Tuyul 传说里，还有要主人的妻子给它喂奶的说法；泰国的「古曼通」（Kuman Thong）也是用胎儿做成的小童子，但多被当作带来好运的护身童子，和专门偷钱的鬼仔并不完全一样。\n\n马来西亚、新加坡和印尼的报纸上，「疑似鬼仔偷钱」的新闻时有出现，也有巫师声称「抓到了鬼仔」、装在瓶里展示、引来围观的报道，这些大多查无实据。伊斯兰教的学者普遍认为，养鬼求财属于以物配主（syirik）的大罪。本章的时代背景是真实的：1985 年 10 月，国际锡业理事会资金枯竭，伦敦金属交易所的锡交易被迫暂停，锡价暴跌；曾经是世界锡都的霹雳州坚打谷，大批锡矿在之后几年关门，只留下一个个碧绿色的废矿湖。\n\n（本章的甘榜、振兴号、阿明、阿依莎、拓婆、Seman 一家、拉玛萨米、穆图和村长等人物，「只拿一半」的分钱规矩、巫师的纸与四块木片的锁、礼拜四夜里喂它的规矩、「照镜子想起自己是什么」以及在河边送它走的做法，均为游戏虚构。）';

  /* ---------- 自定义精灵 ---------- */
  const sprites = {
    toyol(g, e, t, R) {   // 鬼仔：比小孩还矮一截，大光头、尖耳朵、两只黑眼睛；脚踝拴着红线
      const sk = '#8a9c84', sd = '#64765e', d = e.dir, md = e.mode;
      const bob = e.fr === 1 || e.fr === 3 ? 1 : 0, cr = md === 'count' || md === 'cry' ? 2 : 0;
      const y0 = 4 + cr - bob;
      R(4, 14, 8, 2, 'rgba(0,0,0,.28)');
      if (md !== 'peek') {
        R(6, y0 + 7, 4, 4 - cr, sk); R(6, y0 + 9, 4, 1, '#3a2c22');   // 身子 + 兜裆布
        if (!cr) { R(6, y0 + 11, 1, 1 + bob, sk); R(9, y0 + 11, 1, 2 - bob, sk); R(6, y0 + 12, 1, 1, '#b02020'); }
        else { R(5, y0 + 10, 2, 1, sk); R(9, y0 + 10, 2, 1, sk); }
        if (md === 'count') { R(4, y0 + 9, 2, 1, sk); R(10, y0 + 9, 2, 1, sk); }
        else if (md === 'cry') { R(5, y0 + 4, 1, 3, sk); R(10, y0 + 4, 1, 3, sk); }
        else { R(5, y0 + 7, 1, 3, sd); R(10, y0 + 7, 1, 3, sd); }
      }
      R(4, y0, 8, 7, sk); R(5, y0 - 1, 6, 1, sk); R(4, y0 + 6, 8, 1, sd);
      if (d === 3) { R(5, y0, 6, 1, '#a4b69c'); R(2, y0 + 2, 2, 2, sk); R(12, y0 + 2, 2, 2, sk); return; }
      if (d === 0) {
        R(2, y0 + 2, 2, 2, sk); R(1, y0 + 1, 1, 2, sk); R(12, y0 + 2, 2, 2, sk); R(14, y0 + 1, 1, 2, sk);
        if (md === 'cry') { R(5, y0 + 3, 2, 1, '#1a1a14'); R(9, y0 + 3, 2, 1, '#1a1a14'); R(5, y0 + 4 + ((t * 3) % 2 | 0), 1, 1, '#9ac8e8'); R(10, y0 + 5, 1, 1, '#9ac8e8'); }
        else { R(5, y0 + 2, 2, 3, '#060606'); R(9, y0 + 2, 2, 3, '#060606'); if (Math.sin(t * 5 + e.px) > -.8) { R(6, y0 + 3, 1, 1, '#e8d040'); R(9, y0 + 3, 1, 1, '#e8d040'); } R(6, y0 + 5, 4, 1, '#2a1010'); }
      } else {   // 侧面（朝左；朝右自动镜像由 dir 2 处理）
        const fl = d === 2; const X = x => fl ? 15 - x : x;
        R(X(11) - (fl ? 1 : 0), y0 + 2, 2, 2, sk); R(X(13), y0 + 1, 1, 2, sk);
        R(X(5) - (fl ? 1 : 0), y0 + 2, 2, 3, '#060606'); if (Math.sin(t * 5 + e.px) > -.8) R(X(5), y0 + 3, 1, 1, '#e8d040');
        R(X(4) - (fl ? 1 : 0), y0 + 5, 2, 1, '#2a1010');
      }
    },
    spot(g, e, t, R) {   // 阿依莎用粉笔画的圈；圈里摆着诱饵
      const c = 'rgba(236,232,214,.5)';
      R(3, 3, 10, 1, c); R(3, 13, 10, 1, c); R(2, 4, 1, 9, c); R(13, 4, 1, 9, c);
      if (e.mess) for (let i = 0; i < 9; i++) R(1 + ((hash(e.px, i, 3) * 14) | 0), 2 + ((hash(i, e.py, 4) * 13) | 0), 1, 1, '#5a8a3a');
      const k = e.k;
      if (k === 'kacang') { for (let i = 0; i < 16; i++) R(4 + ((hash(e.px, i, 1) * 8) | 0), 5 + ((hash(i, e.py, 2) * 7) | 0), 1, 1, i % 3 ? '#6aa64a' : '#8ac860'); }
      else if (k === 'cermin') { box(R, 5, 1, 7, 11, '#8a6a3a'); R(6, 2, 5, 9, '#4b5c6b'); R(7, 3, 2, 4, e.n >= 3 ? '#6a7a86' : '#9ab0c0'); R(9, 8, 1, 2, '#ddd'); R(10, 9, 1, 1, '#ddd'); R(5, 12, 7, 1, '#3a2a1a'); }
      else if (k === 'guli') { [['#4a90d0', 5, 8], ['#d04a4a', 8, 9], ['#e0c040', 10, 7], ['#60b060', 7, 6], ['#d0d0e0', 9, 11]].forEach(([col, x, y]) => { R(x, y, 2, 2, col); R(x, y, 1, 1, '#ffffff'); }); }
      else if (k === 'ketam') { R(4, 8, 8, 4, '#c8bca0'); R(5, 7, 6, 1, '#d8ccb0'); const s = Math.sin(t * 9) > 0 ? 1 : 0; R(3 - s, 10, 2, 1, '#b8502a'); R(11 + s, 10, 2, 1, '#b8502a'); }
    },
    crab(g, e, t, R) {   // 跑走的螃蟹
      const s = Math.sin(t * 20) > 0 ? 1 : 0;
      R(5, 9, 6, 4, '#b8502a'); R(6, 8, 4, 1, '#c8603a'); R(6, 8, 1, 1, '#111'); R(9, 8, 1, 1, '#111');
      R(3, 7 + s, 2, 2, '#c8603a'); R(11, 7 - s, 2, 2, '#c8603a'); R(4, 13, 1, 1, '#8a3a1a'); R(6, 13 - s, 1, 1, '#8a3a1a'); R(9, 13 - s, 1, 1, '#8a3a1a'); R(11, 13, 1, 1, '#8a3a1a');
    },
    drain(g, e, t, R) {   // 墙脚的水沟口：铁栅栏缺了两根
      R(2, 9, 12, 7, '#0c0e0c'); R(2, 8, 12, 1, '#5a5a52'); R(1, 9, 1, 7, '#5a5a52'); R(14, 9, 1, 7, '#5a5a52');
      for (const x of [4, 7, 12]) R(x, 9, 1, 7, '#3a3a34');
      R(3, 15, 10, 1, 'rgba(120,150,140,.5)');
      if (e.wet) R(5, 15, 6, 1, '#4a6a5a');
    },
    tin(g, e, t, R) {   // 饼干罐改的钱罐，摆在柜台上
      box(R, 0, 1, 16, 14, '#8a6a42'); R(1, 2, 14, 2, shade('#8a6a42', .2)); R(3, 7, 10, 1, shade('#8a6a42', -.3));
      R(4, -4, 8, 9, '#b8a040'); R(4, -4, 8, 2, '#d8c060'); R(5, -1, 6, 4, '#a83a2a'); R(6, 0, 4, 1, '#e8d080');
      for (let i = 0; i < (e.n ?? 3); i++) R(5 + i * 2, -6, 2, 2, '#c8c4a8');
    },
    karung(g, e, t, R) {   // 敞口的绿豆麻袋
      box(R, 2, 2, 12, 13, '#bca878'); R(3, 2, 10, 3, '#a89060'); R(4, 1, 8, 3, e.empty ? '#6a5a3a' : '#5a8a3a');
      if (!e.empty) for (let i = 0; i < 8; i++) R(4 + ((hash(i, 2, 5) * 8) | 0), 1 + ((hash(i, 3, 5) * 3) | 0), 1, 1, '#8ac860');
      R(5, 8, 6, 1, '#7a6040'); R(6, 10, 4, 1, '#7a6040');
    },
    balang(g, e, t, R) {   // 玻璃罐，装江鱼仔
      R(3, 4, 10, 10, 'rgba(200,220,220,.55)'); R(4, 2, 8, 2, '#c84a3a'); R(4, 8, 8, 5, '#c8c0a0'); for (let i = 0; i < 6; i++) R(4 + i, 9 + (i % 2), 1, 1, '#9a9070'); R(4, 5, 1, 6, 'rgba(255,255,255,.5)');
      R(3, 14, 10, 1, 'rgba(0,0,0,.3)');
    },
    marbletin(g, e, t, R) { R(4, 6, 8, 8, '#6a7a8a'); R(4, 6, 8, 2, '#8a9aaa'); R(6, 9, 4, 3, '#c84a3a'); if (!e.empty) { R(5, 5, 2, 2, '#4a90d0'); R(8, 4, 2, 2, '#e0c040'); R(10, 5, 1, 1, '#d04a4a'); } },
    kalendar(g, e, t, R) {   // 振兴号送的挂历（月份牌）
      R(3, -1, 10, 14, '#f0ece0'); R(3, -1, 10, 4, '#c03028'); R(5, 0, 6, 1, '#e8c860'); R(4, 4, 8, 1, '#7a7a70');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) R(4 + c * 2, 6 + r * 2, 1, 1, '#9a9a90');
      if (e.dots) { R(8, 6, 1, 1, '#a01818'); R(8, 8, 1, 1, '#a01818'); R(7, 10, 3, 3, 'rgba(160,24,24,.0)'); R(8, 10, 1, 1, '#c02020'); R(7, 9, 3, 1, '#a01818'); R(7, 11, 3, 1, '#a01818'); R(7, 10, 1, 1, '#a01818'); R(9, 10, 1, 1, '#a01818'); }
    },
    signboard(g, e, t, R) {   // 店招：红底金字「振兴号」
      R(0, 2, 32, 9, '#3a1810'); R(1, 3, 30, 7, '#a82820');
      for (const x of [5, 13, 21]) { R(x, 4, 5, 1, '#e8c860'); R(x + 2, 4, 1, 5, '#e8c860'); R(x, 6, 5, 1, '#e8c860'); R(x, 8, 5, 1, '#e8c860'); }
    },
    antena(g, e, t, R) { R(7, -12, 1, 14, '#9a9aa0'); R(2, -10, 12, 1, '#b8b8c0'); R(4, -7, 8, 1, '#b8b8c0'); R(5, -4, 6, 1, '#b8b8c0'); },
    motor(g, e, t, R) {   // 崭新的本田 C70
      R(1, 10, 5, 5, '#141414'); R(10, 10, 5, 5, '#141414'); R(2, 11, 3, 3, '#7a7a7a'); R(11, 11, 3, 3, '#7a7a7a');
      R(3, 7, 10, 3, '#c02028'); R(5, 5, 6, 2, '#d8d8d0'); R(11, 3, 2, 5, '#5a5a5a'); R(10, 2, 4, 1, '#2a2a2a'); R(4, 6, 4, 1, '#3a2a1a'); R(12, 4, 2, 2, '#f0e8a0');
    },
    tiang(g, e, t, R) {   // 高脚屋的木柱子 + 楼梯；柱子上缠着红线
      R(6, -14, 4, 28, '#6a4a2e'); R(6, -14, 1, 28, '#7a5a3a'); R(0, 8, 16, 2, '#5a3e26'); R(0, 12, 16, 2, '#5a3e26');
      R(5, 0, 6, 1, '#c02020'); R(5, 2, 6, 1, '#c02020'); R(10, 1, 3, 1, '#c02020'); R(12, 2, 1, 3, '#c02020');
    },
    peti(g, e, t, R) {   // 雕花小木盒，盖子上四块能转的木片
      box(R, 1, 3, 14, 11, '#5a3a20'); R(2, 4, 12, 2, '#7a5230');
      if (e.open) { R(2, 1, 12, 3, '#3a2414'); R(3, 5, 10, 6, '#140c08'); return; }
      const ic = [['#b8502a', 2], ['#4a90d0', 5], ['#9ab0c0', 8], ['#6aa64a', 11]];
      for (const [c, x] of ic) { R(x, 7, 3, 3, '#8a6a42'); R(x + 1, 8, 1, 1, c); }
      R(7, 12, 2, 1, '#c9a35a');
    },
    lubang(g, e, t, R) { R(5, 7, 6, 4, '#1a140c'); R(4, 8, 1, 2, '#3a2c1c'); R(11, 8, 1, 2, '#3a2c1c'); if (Math.sin(t * 2 + e.px) > .7) { R(6, 6, 1, 1, '#b8502a'); R(9, 6, 1, 1, '#b8502a'); } },
    pole(g, e, t, R) {   // 理发店的旋转灯柱
      R(6, -10, 4, 22, '#f0f0f0'); const o = Math.floor(t * 6) % 4; for (let y = -10 + o; y < 12; y += 4) { R(6, y, 4, 1, '#c02020'); R(6, y + 2, 4, 1, '#2040a0'); }
      R(5, -12, 6, 2, '#c8c8c8'); R(5, 12, 6, 2, '#c8c8c8');
    },
    ranjang(g, e, t, R) {   // 阿爸的木床，蚊帐
      box(R, 1, -2, 14, 30, '#5a3c26'); R(2, 0, 12, 4, '#e6e2d6'); R(2, 6, 12, 20, '#6a7a5a');
      if (e.zz) { R(5, 0, 6, 4, '#d8b088'); R(5, 0, 6, 1, '#2a2424'); R(3, 6, 10, 9, '#8a9a7a'); }
      R(0, -10, 16, 1, 'rgba(230,230,230,.35)'); R(0, -10, 1, 38, 'rgba(230,230,230,.25)'); R(15, -10, 1, 38, 'rgba(230,230,230,.25)');
    },
    topi(g, e, t, R) { R(4, 4, 8, 5, '#d8a830'); R(3, 8, 10, 2, '#b88820'); R(7, 3, 2, 2, '#e8e8d0'); R(7, 1, 2, 2, '#c8c8b8'); },
    piring(g, e, t, R) {   // 鬼仔的角落：一块小草席、一只小碟子
      R(1, 4, 14, 10, '#a08a58'); for (let y = 4; y < 14; y += 2) R(1, y, 14, 1, '#94804e');
      R(5, 8, 6, 3, '#e8e4d8'); R(6, 9, 4, 1, '#6a1a1a'); for (let i = 0; i < 5; i++) R(2 + i * 3, 12, 1, 1, '#c9a35a');
    },
    tempayan(g, e, t, R) { R(3, 4, 10, 10, '#7a4a2a'); R(2, 6, 12, 6, '#8a5432'); R(4, 2, 8, 2, '#6a3a20'); R(5, 2, 6, 1, '#1a2a30'); R(3, 14, 10, 1, '#3a2014'); },
    peti_ais(g, e, t, R) { box(R, 1, -6, 14, 21, '#c83028'); R(2, -5, 12, 4, '#e8e4dc'); R(3, 0, 10, 1, '#901c18'); R(12, 3, 1, 4, '#d8d8d8'); },
    rak(g, e, t, R) {   // 货架：罐头、饼干桶、蚊香
      box(R, 0, -6, 16, 20, '#6a5038'); R(1, 1, 14, 1, '#3a2818'); R(1, 7, 14, 1, '#3a2818');
      for (let i = 0; i < 4; i++) R(2 + i * 3, -4, 2, 5, ['#d84a3a', '#e8c040', '#3a8a5a', '#d8d8d0'][i]);
      for (let i = 0; i < 3; i++) R(2 + i * 4, 3, 3, 4, ['#3a6aa0', '#c86a2a', '#2a8a3a'][i]);
      R(2, 9, 12, 4, '#8a7050');
    },
    kerusi(g, e, t, R) { box(R, 2, 4, 12, 10, '#a8a8a0'); R(3, 2, 10, 3, '#8a8a82'); R(4, 6, 8, 5, '#c84a3a'); },
    kain(g, e, t, R) { const s = Math.sin(t * 2.4 + e.px) > 0 ? 1 : 0; R(4, 1, 8, 1, '#ece8dc'); R(4, 2, 8, 7 + s, e.col || '#d8c8a0'); R(5, 4, 6, 1, shade(e.col || '#d8c8a0', -.2)); },
    ayam(g, e, t, R) { const p = Math.sin(t * 3 + e.px) > .6 ? 1 : 0; R(5, 8, 7, 5, '#c8a070'); R(10, 5 + p, 3, 4, '#c8a070'); R(11, 4 + p, 1, 1, '#c02020'); R(13, 6 + p, 1, 1, '#e0a020'); R(4, 7, 2, 3, '#8a5a2a'); R(7, 13, 1, 2, '#e0a020'); R(10, 13, 1, 2, '#e0a020'); },
    biskut(g, e, t, R) { box(R, 1, -2, 14, 16, '#5a3a22'); R(2, -1, 12, 2, '#7a5232'); R(4, -6, 8, 5, '#3a6aa0'); R(4, -6, 8, 1, '#5a8ac0'); R(6, -4, 4, 2, '#e8c860'); },
    gelas(g, e, t, R) { R(6, 6, 4, 6, 'rgba(220,200,160,.7)'); R(6, 6, 4, 1, '#f0e8d0'); }
  };

  /* ---------- 自定义瓦片 ---------- */
  const tiles = {
    getah: { solid: true, paint(R, X, Y) {   // 橡胶树
      speck(R, '#232a1a', ['#2a3220', '#1c2214'], X, Y, 12, 41);
      R(6, 0, 4, 16, '#5e5a52'); R(6, 0, 1, 16, '#77736a'); R(9, 0, 1, 16, '#46423c');
      for (let i = 0; i < 3; i++) R(6, 5 + i * 2, 4, 1, '#c8c0a8');
      R(5, 11, 6, 2, '#5a3a22'); R(6, 11, 4, 1, '#e8e4d8'); R(3, 14, 10, 2, '#141a0e');
    } },
    kelapa: { solid: true, paint(R, X, Y, o) {   // 椰子树（树冠用实体画会更高，这里只画树干和一片影子）
      speck(R, o.grassC || '#2c4428', ['#34502e', '#243a20'], X, Y, 12, 13);
      R(7, 2, 3, 14, '#7a6448'); for (let y = 3; y < 16; y += 3) R(7, y, 3, 1, '#5a4a34');
      R(0, 0, 16, 3, '#1e3a1e'); R(2, 0, 4, 5, '#24461f'); R(10, 0, 5, 4, '#24461f'); R(6, 2, 4, 2, '#4a3a20');
    } },
    lombong: { solid: true, paint(R, X, Y) {   // 废矿湖：碧绿得不像真的
      R(0, 0, 16, 16, '#2a8a86'); R(0, 0, 16, 1, hash(X, Y, 3) < .5 ? '#3a9a94' : '#2a8a86');
      if (hash(X, Y, 9) < .4) R(((hash(X, Y, 2) * 12) | 0), ((hash(Y, X, 2) * 14) | 0), 4, 1, '#5ab8b0');
    } },
    pasir: { solid: false, paint(R, X, Y) { speck(R, '#a8a69a', ['#bab8ac', '#929084', '#c8c6ba'], X, Y, 18, 6); } },   // 灰白的锡矿砂
    papan: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#6a5038'); for (let r = 0; r < 4; r++) { R(0, r * 4 + 3, 16, 1, '#3a2a1a'); if (hash(X, Y * 4 + r, 3) < .5) R(((hash(X, Y, r) * 14) | 0), r * 4, 1, 3, '#55402a'); } } },
    tikar: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#a08a58'); for (let y = 0; y < 16; y += 2) R(0, y, 16, 1, (y / 2 + X) % 2 ? '#b09a66' : '#94804e'); if (X % 3 === 0) R(0, 0, 1, 16, '#7a3a2a'); } },
    longkang: { solid: false, paint(R, X, Y, o) { speck(R, o.grassC || '#2c4428', ['#34502e'], X, Y, 6, 2); R(0, 5, 16, 6, '#5a5a52'); R(0, 6, 16, 4, '#1a2420'); R(0, 7, 16, 1, '#3a4a40'); if (hash(X, Y, 4) < .3) R(((hash(X, Y, 5) * 12) | 0), 8, 3, 1, '#4a6a5a'); } },
    simen: { solid: false, paint(R, X, Y) { speck(R, '#8a8678', ['#948f80', '#7e7a6c'], X, Y, 10, 4); if (hash(X, Y, 8) < .2) R(3, 9, 6, 1, '#7a766a'); } }
  };

  const FP = 'rgba(90,112,100,.6)', FPG = 'rgba(200,198,186,.7)';
  const TYL = { r: 1.1, col: 'rgba(170,220,170,.10)' };
  const KR = ['T'.repeat(34),
    'T' + 'Y'.repeat(16) + 'd' + 'Y'.repeat(12) + 'OOOT',
    'T"#######""######d"#####a#####OOOT',
    'T"#######""######d"#####a#####OOOT',
    'T"#######""######d"#####a#####OOOT',
    'T' + 'd'.repeat(23) + 'aaaaaa' + 'OOOT',
    'T' + '"'.repeat(16) + 'd' + '"'.repeat(6) + 'aaaaaa' + 'OOOT',
    'T' + '"'.repeat(16) + 'd' + '"'.repeat(15) + 'T',
    'T"#######"####""dddddd"######""""T',
    'T"#######"####""dddddd"######""""T',
    'T"#######"####""dddddd"######""""T',
    'T' + 'd'.repeat(32) + 'T',
    'T' + '"'.repeat(32) + 'T',
    'T' + 'v'.repeat(32) + 'T',
    'T""J"""""J""""""J"""""J""""J""J""T',
    'T' + 'u'.repeat(32) + 'T',
    'T' + 'o'.repeat(32) + 'T',
    '~'.repeat(34), '~'.repeat(34), '~'.repeat(34)];
  const TRAIL = [[4, 12], [7, 12], [10, 12], [13, 12], [16, 12], [17, 10], [17, 8], [17, 6], [19, 5], [21, 5], [23, 5], [25, 6]];

  defChapter({
    id: 'toyol', n: 26, title: '鬼仔', sub: '门锁着，窗关着，钱罐里的钱一夜少一半。豆子、镜子、弹珠、螃蟹——它毕竟是个孩子。', origin: '马来西亚民间传说', color: '#24402e',
    thumb(g, w, h) {   // 一只扎着黄布、缠着红线的小瓶子，瓶里蜷着一个光头小人；地上撒着绿豆
      const x = w * .2, y = h - 22 - 58;
      g.fillStyle = '#3a2a14'; g.fillRect(x + 4, y + 14, 28, 44); g.fillStyle = '#6a4a20'; g.fillRect(x + 6, y + 16, 24, 40);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 8, y + 18, 4, 30);
      g.fillStyle = '#3a2a14'; g.fillRect(x + 12, y + 4, 12, 12); g.fillStyle = '#d8b030'; g.fillRect(x + 10, y, 16, 8);
      g.fillStyle = '#b02020'; for (let i = 0; i < 3; i++) g.fillRect(x + 10, y + 8 + i * 2, 16, 1);
      g.fillStyle = '#8a9c84'; g.fillRect(x + 12, y + 30, 12, 10); g.fillRect(x + 10, y + 32, 2, 3); g.fillRect(x + 24, y + 32, 2, 3); g.fillRect(x + 14, y + 40, 8, 10);
      g.fillStyle = '#060606'; g.fillRect(x + 14, y + 33, 3, 3); g.fillRect(x + 19, y + 33, 3, 3); g.fillStyle = '#e8d040'; g.fillRect(x + 15, y + 34, 1, 1); g.fillRect(x + 20, y + 34, 1, 1);
      for (let i = 0; i < 26; i++) { g.fillStyle = i % 3 ? '#6aa64a' : '#8ac860'; g.fillRect((hash(i, 7, 26) * w) | 0, h - 20 + ((hash(i, 8, 26) * 16) | 0), 2, 2); }
    },
    endings: { pulang: '送它回家', simpan: '留下的瓶子', pecah: '碎掉的瓶子' },
    amb: 'night', floor: 'dirt', wall: 'wood', dark: .3, plr: 3,
    people, faces, items, notes, legend, sprites, tiles,
    start: { map: 'kedai', x: 8, y: 11, dir: 3 },
    async intro(S) {
      await S.card('第二十六夜　鬼仔', '1986年3月　马来西亚 霹雳州 坚打谷的一个甘榜', '去年十月，伦敦的锡价崩了。\n坚打谷的锡矿一个接一个关门，\n挖锡的人回到甘榜，口袋一天比一天空。\n\n这个月，村里的钱开始自己变少。\n门锁着，窗闩着，\n第二天一早，钱就少了一半。');
    },
    resume: {
      malam1: async S => { n1Reset(S); if (n1Fails) await S.think('（照着脚印的路线摆：豆子数得最久，镜子能用好几回，弹珠会让它跑回家一阵，螃蟹会把它引回水沟。\n离它远一点——它会咬人。）'); n1Start(S); },
      malam2: async S => { n2Reset(S); if (n2Fails) await S.think('（别在屋里跑，跑起来它隔着两间屋都听得见。\n先用诱饵把它引开，再去厨房看纸、去卧室开盒子。）'); }
    },
    maps: {
      /* ---------------- 振兴号（杂货店 + 后屋） ---------------- */
      kedai: {
        amb: 'room', dark: .25, plr: 3, wall: 'wood', floor: 'simen',
        legend: { x: 'simen' },
        tileOpts: { tileC: '#b8c4b8', woodC: '#6b4a2f' },
        rows: [
          '###################',
          '###################',
          '#+++++#wwwww#wwwww#',
          '#+++++#wwwww#wwwww#',
          '#+++++#wwwww#wwwww#',
          '#+++++##w#####w####',
          '#+++++nnnnnnnnnnnn#',
          '##########n########',
          '##########n########',
          '#xxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxx#',
          '########x##########'],
        ents: [
          { x: 8, y: 13, spr: 'invisible', touch: S => leaveShop(S) },
          { id: 'abah', x: 3, y: 9, spr: '@abah', dir: 0, on: S => abahTalk(S) },
          ...[2, 3, 5, 6].map(x => ({ x, y: 10, spr: 'counter', col: '#8a6a42', on: S => S.narr(cyc(S, '_ctr', ['木头柜台，台面被手肘磨得发亮。玻璃底下压着一张褪色的价目表：白糖一斤六角，炼奶一罐九角。', '柜台边上挂着一本赊账簿，用绳子拴着一支圆珠笔。这几个月，簿子越来越厚。'])) })),
          { id: 'till', x: 4, y: 10, spr: 'tin', s: { n: 3 }, on: S => tillOn(S) },
          { x: 12, y: 9, spr: 'rak', on: S => S.narr('货架上一排罐头：沙丁鱼、炼奶、午餐肉。最上层是一桶桶苏打饼干，铁皮盖子上印着红色的公鸡。') },
          { x: 13, y: 9, spr: 'rak', on: S => S.narr('蚊香、火柴、蜡烛、电池……锡矿关门以后，村里买蜡烛的人多了，买电池的人少了。') },
          { x: 14, y: 9, spr: 'rak', on: S => S.narr('一格一格的香料：八角、桂皮、咖喱粉、峇拉煎（belacan）。整个店都是这股又咸又香的味道。') },
          { x: 17, y: 9, spr: 'peti_ais', on: S => S.narr('红色的冰柜，嗡嗡地响。里面冰着汽水和一包包冰棒。\n阿爸说电费贵，一到晚上就把它关了。') },
          { id: 'balang', x: 12, y: 12, spr: 'balang', on: S => balangOn(S) },
          { id: 'karung', x: 15, y: 12, spr: 'karung', on: S => karungOn(S) },
          { x: 16, y: 12, spr: 'sack', on: S => S.narr('一袋泰国香米。袋子上印着一头大象。') },
          { x: 17, y: 12, spr: 'sack', on: S => S.narr('一袋白糖，袋口用麻绳扎着。几只蚂蚁排着队往上爬。') },
          { x: 1, y: 12, spr: 'incense', light: { r: 1.2, col: 'rgba(255,90,60,.14)', flick: true }, on: S => S.narr('墙角地上供着地主公的小神台，红纸上写着「五方五土龙神，前后地主财神」。\n阿爸每天早上都给它上三炷香。这个月，他上香的时候嘴里念得特别久。') },
          { x: 15, y: 8, spr: 'kalendar', on: S => S.narr('「振兴号　敬赠」的月份牌。每年过年，阿爸都印一百本送给熟客。\n三月那一页，礼拜六用红笔圈着：交店租。') },
          { x: 6, y: 8, spr: 'scroll', on: S => S.narr('墙上挂着一幅红底金字：「生意兴隆」。\n字是阿公写的。阿公写的时候，锡矿还在挖，这条街上每天都有罗厘（lori）来来去去。') },
          { x: 8, y: 8, spr: 'wallclock', on: S => S.narr(S.f.ph === 'n1' ? '十二点过了。秒针一格一格地走，好像比白天慢。' : '挂钟滴答滴答。阿爸每个礼拜天给它上一次发条。') },
          /* 厨房 */
          { id: 'drain', x: 2, y: 1, spr: 'drain', on: S => drainOn(S) },
          { x: 3, y: 2, spr: 'stove', on: S => S.narr('煤油炉子上坐着一锅冷掉的白粥。锅盖上搁着两根咸鱼。') },
          { x: 5, y: 2, spr: 'tempayan', on: S => S.narr('一口装雨水的大陶缸。水面上浮着一只椰壳瓢。') },
          ...[[2, 3], [2, 5], [5, 6], [8, 6], [10, 8], [8, 9], [5, 9]].map(([x, y], i) => ({ id: 'fp' + i, x, y, spr: 'footprints', col: FP, decal: true, on: i === 0 ? (S => footOn(S)) : undefined })),
          /* 阿明的房间 */
          { x: 8, y: 2, h: 2, spr: 'futon', col: '#3a6a8a', on: S => S.narr('你的床铺：一张草席，一个枕头，一床洗得发白的薄被。\n枕头底下压着一本翻烂了的《老夫子》。') },
          { id: 'mtin', x: 10, y: 2, spr: 'marbletin', on: S => marbleOn(S) },
          { x: 9, y: 1, spr: 'poster', col: '#3a7a4a', on: S => S.narr('墙上贴着一张足球海报，绿色的草地，一个黄衣服的前锋高高跳起来顶球。\n海报的一角翘起来了，你用饭粒粘了好几回。') },
          /* 阿爸的房间 */
          { id: 'ranjang', x: 14, y: 2, h: 2, spr: 'ranjang', on: S => S.narr(S.f.ph === 'n1' ? '阿爸睡得很沉，鼾声一阵一阵的。他看不见它——大人都看不见。' : '阿爸的木床，挂着一顶打了补丁的蚊帐。') },
          { x: 16, y: 1, spr: 'portrait', on: S => S.narr('阿母的照片。照片里她穿着一件碎花旗袍，站在怡保火车站前面。\n那年你五岁。你不太记得她的声音了。') },
          { x: 17, y: 2, spr: 'wardrobe', on: S => S.narr('衣柜门关不严，露出阿爸那件过年才穿的白衬衫。') },
          { x: 12, y: 5, spr: 'wallclock', on: S => S.narr('走廊墙上还挂着一只坏了的钟，停在四点十分。没人记得它是哪一年停的。') },
          /* 放诱饵的圈 */
          ...[[3, 4], [7, 6], [10, 7], [7, 9], [9, 3], [14, 11]].map(([x, y], i) => ({ id: 'k' + (i + 1), x, y, spr: 'spot', decal: true, hidden: true, s: { k: '', n: 0, mess: 0 }, on: S => spotOn(S, 'k' + (i + 1)) })),
          { id: 'ty', x: 2, y: 2, spr: 'toyol', solid: false, hidden: true, alpha: .72, light: TYL, s: { mode: '' } },
          { id: 'crabR', x: 2, y: 2, spr: 'crab', solid: false, hidden: true }
        ],
        async enter(S, first) {
          if (first) return opening(S);
          if (S.f.ph === 'dusk') return dusk1(S);
        },
        tick(S, dt) { n1Tick(S, dt); }
      },
      /* ---------------- 甘榜 ---------------- */
      kampung: {
        amb: 'wind', dark: .12, plr: 4, wall: 'wood', floor: 'dirt',
        legend: { Y: 'getah', J: 'kelapa', O: 'lombong', a: 'pasir', v: 'longkang' },
        tileOpts: { grassC: '#2e4a2a', treeC: '#16241a' },
        rows: KR,
        ents: [
          /* 1 号　拓婆和阿依莎家 */
          { x: 5, y: 4, spr: 'door', col: '#6a4a2e', on: S => S.narr(S.f.ph === 'n2pre' ? '阿依莎家的门关着，门缝里透出一点煤油灯的光。拓婆还没睡。' : '阿依莎家的木门开着，门槛上搁着一双小小的胶拖鞋。屋里飘出椰浆饭的香味。') },
          { x: 3, y: 4, spr: 'window', lit: true, on: S => S.narr('窗台上晒着几条咸鱼和一小簸箕辣椒。') },
          { x: 7, y: 4, spr: 'window', on: S => S.narr('窗框上挂着一串风干的班兰叶。') },
          { x: 2, y: 4, spr: 'sign', col: '#4a6a4a', text: true, on: S => S.narr('门牌：1。') },
          { id: 'tokwan', x: 4, y: 5, spr: '@tokwan', dir: 0, on: S => tokwanTalk(S) },
          { id: 'aisyah', x: 7, y: 5, spr: '@aisyah', dir: 0, on: S => aisyahTalk(S) },
          /* 2 号　祈祷室 */
          { x: 13, y: 4, spr: 'door', col: '#2e5a44', on: S => S.narr('祈祷室（surau）的门。晌礼还没到，门虚掩着，里面铺着绿地毯。') },
          { x: 11, y: 4, spr: 'sign', col: '#2e5a44', on: S => S.narr('绿底白字：SURAU AL-FALAH。底下挂着一只捐款箱，铁皮上贴着一张手写的纸：「屋顶漏水，请大家帮忙」。\n锁是新换的。') },
          { x: 15, y: 4, spr: 'window', lit: true, on: S => S.narr('祈祷室的窗户擦得很干净，窗台上摆着一排叠好的礼拜帽。') },
          { id: 'imam', x: 14, y: 5, spr: '@imam', dir: 0, on: S => imamTalk(S) },
          /* 7 号　Timah 姐家 */
          { x: 21, y: 4, spr: 'door', col: '#6a4a2e', on: S => S.narr('Timah 姐家的门。门上用粉笔写着：7。') },
          { x: 19, y: 4, spr: 'window', on: S => S.narr('窗里挂着一件洗得发白的校服，是她儿子的。她儿子去了新加坡做工。') },
          { id: 'timah', x: 21, y: 5, spr: '@timah', dir: 0, on: S => timahTalk(S) },
          /* 8 号　Seman 家 */
          { id: 'sdoor', x: 27, y: 4, spr: 'door', col: '#5a3a22', on: S => semanDoor(S) },
          { id: 'swin', x: 25, y: 4, spr: 'window', on: S => S.narr(S.f.ph === 'n2pre' ? '窗户黑着。屋里一点声音都没有……不，有。很轻很轻的，像小孩用指甲刮木板。' : '窗帘拉着。窗帘缝里看得见一台崭新的彩色电视机，屏幕上还贴着出厂的塑料膜。') },
          { x: 28, y: 2, spr: 'antena', z: 1, on: S => S.narr('屋顶上新竖了一根电视天线，铝杆子在太阳底下亮得晃眼。\n整条街，只有村长家和他家有。') },
          { id: 'tiang', x: 26, y: 5, spr: 'tiang', on: S => tiangOn(S) },
          { id: 'seman', x: 28, y: 5, spr: '@seman', dir: 1, on: S => semanTalk(S) },
          { id: 'motor', x: 29, y: 5, spr: 'motor', on: S => S.narr(S.f.ph === 'n2pre' ? '摩托车不在。他骑着它去怡保了。' : '一辆崭新的红色本田 C70，挡泥板上的贴纸都还没撕。\n锡矿关门以后，这条街上已经很久没人买新东西了。') },
          { id: 'evSand', x: 25, y: 6, spr: 'footprints', col: FPG, decal: true, hidden: true, on: S => evSand(S) },
          { id: 'evWrap', x: 27, y: 6, spr: 'paper', hidden: true, on: S => evWrap(S) },
          { id: 'evMata', x: 24, y: 6, spr: 'sparkle', hidden: true, on: S => evMata(S) },
          { x: 31, y: 7, spr: 'sign', col: '#8a6a3a', on: S => S.narr('一块歪倒的木牌：「LOMBONG — BAHAYA」（矿湖——危险）。\n湖水碧绿碧绿的，看不见底。村里的老人说，矿湖底下埋着挖锡挖出来的整座山。') },
          /* 3 号　振兴号 */
          { x: 5, y: 10, spr: 'door', col: '#7a3a2a', on: S => enterShop(S) },
          { x: 3, y: 10, spr: 'window', lit: true, on: S => S.narr('店里的玻璃窗上贴着红纸剪的「福」字，有一角被晒得发白了。') },
          { x: 6, y: 10, w: 2, spr: 'signboard', oy: -6, on: S => S.narr('「振兴号」——阿公起的名字。\n阿公说，「振兴」就是「会好起来」的意思。') },
          /* 4 号　穆图理发店 */
          { x: 11, y: 10, spr: 'door', col: '#3a5a8a', on: S => S.narr('理发店的门开着，收音机里放着淡米尔歌，一个女人的声音又高又亮。') },
          { x: 12, y: 10, spr: 'window', lit: true, on: S => S.narr('理发店的大镜子新换过了，亮得能照见整条街。') },
          { x: 13, y: 10, spr: 'pole', on: S => S.narr('红白蓝三色的灯柱，一圈一圈地转。') },
          { id: 'muthu', x: 12, y: 11, spr: '@muthu', dir: 0, on: S => muthuTalk(S) },
          /* 5 号　咖啡摊 */
          { x: 19, y: 8, w: 2, spr: 'stall2', col: '#2a6a5a', on: S => S.narr('咖啡摊的柜台：一只大铝壶，一排倒扣的玻璃杯，一罐炼奶。\n老板拉茶（teh tarik）的手扬得老高，茶从一个杯子「哗」地拉进另一个杯子。') },
          { x: 16, y: 9, spr: 'table', on: S => S.narr('桌上摆着几杯喝了一半的拉茶，杯底沉着一层炼奶。') },
          { x: 21, y: 10, spr: 'table', on: S => S.narr('桌上有人用茶水画了一个圈，圈里写着一个「八」字，又被人用手抹掉了。') },
          { id: 'clip', x: 16, y: 8, spr: 'sign', col: '#c8c0a0', async on(S) { if (S.once('clip')) await S.narr('咖啡摊的柱子上钉着一张华文报的剪报。'); await S.note('akhbar'); } },
          { id: 'ketua', x: 18, y: 9, spr: '@ketua', dir: 0, on: S => ketuaTalk(S) },
          { id: 'kopi', x: 20, y: 10, spr: '@kopi', dir: 1, on: S => S.say('喝茶的阿伯', cyc(S, '_kp', ['锡矿关了，我那个大儿子去了新加坡，小儿子去了吉隆坡。现在甘榜里只剩老人和小孩。', '我也丢了钱，枕头底下的。……一半。拿一半，留一半。哪有这样的贼？', '晚上门窗关好，钱旁边撒把绿豆。我奶奶那个年代就这么干。'])) },
          { id: 'kopi2', x: 15, y: 10, spr: '@kopi2', dir: 2, on: S => S.say('喝茶的阿伯（福建人）', cyc(S, '_kp2', ['阿明，你阿爸的店也丢了？唉。锡价跌成这样，人心也跟着跌。', '马来人说是 toyol，我们福建人叫「鬼仔」。小时候我阿嬷说，养鬼仔的人，手指头上永远有伤。', '你别乱讲是谁。乱讲，会害死人的。'])) },
          /* 6 号　村长家 */
          { x: 25, y: 10, spr: 'door', col: '#5a3a5a', on: S => S.narr('村长家的门锁着。他白天都在咖啡摊上。') },
          { x: 27, y: 10, spr: 'window', lit: true, on: S => S.narr('窗里看得见一台黑白电视，上面盖着一块钩花的白布。') },
          /* 拉玛萨米 */
          { id: 'rama', x: 17, y: 1, spr: '@rama', dir: 0, on: S => ramaTalk(S) },
          /* 河边 */
          ...[[6, 15], [15, 15], [24, 15]].map(([x, y], i) => ({ id: 'lb' + i, x, y, spr: 'lubang', decal: true, on: S => crabOn(S) })),
          { id: 'outlet', x: 3, y: 12, spr: 'puddle', decal: true, on: S => S.narr('振兴号后面，厨房的水沟口通到这条大水沟里。水沟边的泥是湿的。') },
          ...TRAIL.map(([x, y], i) => ({ id: 'tr' + i, x, y, spr: 'footprints', col: FPG, decal: true, hidden: true, on: i % 3 === 0 ? (S => trailOn(S)) : undefined })),
          { x: 10, y: 12, spr: 'ayam', on: S => S.narr('一只母鸡在地上啄来啄去。它啄起一颗什么东西，又吐掉了。') },
          { x: 22, y: 12, spr: 'ayam', on: S => S.narr('一只公鸡歪着头看你，喉咙里咕咕地响。') },
          { id: 'lamp', x: 9, y: 11, spr: 'streetlamp', off: true, on: S => S.narr('路灯杆上贴满了寻人启事和补习班的广告。') },
          { x: 30, y: 12, spr: 'invisible', solid: false, on: S => S.narr('坚打河从这里往东流。往下游走半个钟头，有一个没人用了的旧码头，从前是用来装锡砂上船的。') },
          { id: 'aisN', x: 23, y: 6, spr: '@aisyah', dir: 2, hidden: true, on: S => S.say('阿依莎', cyc(S, '_an', ['我在这儿望风。有人来，我就学猫叫。', '……我外婆说，大人看不见它。可是我们看得见。你别怕。', '快去吧。后门的门闩是坏的，推一下就开。'])) }
        ],
        async enter(S, first) { return kampungEnter(S, first); },
        step(S, x, y) { if (S.f.ph === 'd1a' && y >= 15) return S.think('河边泥滩上有好些小洞。螃蟹洞。'); }
      },
      /* ---------------- 8 号　Seman 家 ---------------- */
      rumah: {
        amb: 'none', dark: .86, plr: 2.5, wall: 'wood', floor: 'papan',
        legend: { p: 'papan', i: 'tikar' },
        rows: [
          '####################',
          '####################',
          '#ppppp#iiiiiii#pppp#',
          '#ppppp#iiiiiii#pppp#',
          '#pppppiiiiiiiiipppp#',
          '#ppppp#iiiiiii#pppp#',
          '###p###iiiiiii###p##',
          '###p###iiiiiii###p##',
          '#pppppppppppppppppp#',
          '#pppppppppppppppppp#',
          '##p#################'],
        ents: [
          { x: 2, y: 10, spr: 'invisible', touch: S => leaveSeman(S) },
          /* 厨房 */
          { x: 2, y: 2, spr: 'stove', on: S => S.narr('灶是冷的。锅里什么都没有。\n灶台上摆着一包没拆的方便面——Seman 伯这几天大概都没好好吃饭。') },
          { id: 'kaleng', x: 4, y: 2, spr: 'biskut', on: S => kalengOn(S) },
          { x: 5, y: 2, spr: 'tempayan', on: S => S.narr('水缸。水面上漂着一层灰。') },
          { x: 3, y: 1, spr: 'window', on: S => S.narr('厨房的窗户关得死死的。窗外的矿湖在月光底下绿得发黑。') },
          { id: 'piring', x: 1, y: 4, spr: 'piring', decal: true, on: S => piringOn(S) },
          /* 厅 */
          { id: 'tv', x: 10, y: 2, spr: 'tv', on: S => S.narr('一台崭新的十四寸彩色电视机，屏幕上的塑料膜还没撕。\n电视机顶上摆着一个空了的药瓶，标签上印着「怡保中央医院」。') },
          { id: 'cal2', x: 8, y: 1, spr: 'kalendar', s: { dots: 1 }, on: S => cal2On(S) },
          { x: 12, y: 1, spr: 'photo', on: S => S.narr('一张小女孩的照片，穿着蓝色的校服裙，缺了一颗门牙，笑得眼睛都没了。\n照片背面写着：Nurul，八岁。') },
          { x: 13, y: 2, spr: 'topi', on: S => S.narr('一顶黄色的矿工安全帽，帽檐上的头灯已经锈了。\n帽子里面用圆珠笔写着一个工号，还有一行字：「愿真主保佑这个矿」。') },
          { x: 10, y: 5, w: 2, spr: 'sofa', col: '#8a3a2a', on: S => S.narr('一张新沙发，红色的人造皮。坐垫上还套着透明塑料。') },
          { x: 7, y: 2, spr: 'deadplant', on: S => S.narr('一盆枯了一半的九重葛。没人浇水。') },
          /* 卧室 */
          { x: 16, y: 2, h: 2, spr: 'futon', col: '#6a5a8a', on: S => S.narr('床褥叠得整整齐齐。枕头边放着一个小书包，书包上挂着一只塑料小熊。') },
          { id: 'peti', x: 17, y: 2, spr: 'peti', on: S => petiOn(S) },
          { x: 18, y: 2, spr: 'wardrobe', on: S => S.narr('衣柜里挂着几件旧衬衫，一件矿场发的工作服，口袋里装满了碎锡砂。') },
          { x: 15, y: 3, spr: 'paper', on: S => S.narr('地上一张蜡笔画：一栋高脚屋，屋顶上有一根天线，屋前站着一个大人、一个小女孩……\n还有一个光头的小人，躲在屋子底下，只画了一双眼睛。') },
          /* 走廊 */
          { x: 9, y: 9, spr: 'shoes', col: '#3a3a3a', decal: true, on: S => S.narr('一双男人的胶鞋，鞋底沾满了灰白的锡矿砂。') },
          { x: 15, y: 7, spr: 'window', on: S => S.narr('窗外是黑沉沉的橡胶园。远处，祈祷室的方向，亮着一盏小灯。') },
          { x: 5, y: 7, spr: 'window', on: S => S.narr('窗外就是矿湖。月亮掉在湖里，碎成了好几片。') },
          ...[[4, 4], [10, 4], [16, 5], [10, 9], [3, 8], [17, 8]].map(([x, y], i) => ({ id: 'r' + (i + 1), x, y, spr: 'spot', decal: true, hidden: true, s: { k: '', n: 0, mess: 0 }, on: S => spotOn(S, 'r' + (i + 1)) })),
          { id: 'ty2', x: 1, y: 4, spr: 'toyol', solid: false, alpha: .72, light: TYL, s: { mode: 'count' } },
          { id: 'crabR2', x: 1, y: 4, spr: 'crab', solid: false, hidden: true }
        ],
        async enter(S, first) { if (S.f.ph === 'n2pre') return n2Enter(S); },
        tick(S, dt) { n2Tick(S, dt); }
      },
      /* ---------------- 旧码头（天亮前） ---------------- */
      sungai: {
        amb: 'river', dark: .6, plr: 3.2, wall: 'wood', floor: 'dirt', fog: .22,
        legend: { Y: 'getah', p: 'papan' },
        tileOpts: { grassC: '#2a3e28' },
        rows: [
          'TTTTTTTTTTddTTTTTTTTTT',
          'TYdYdYdYdYddYdYdYdYdYT',
          'TddddddddddddddddddddT',
          'TYdYdYdYdYddYdYdYdYdYT',
          'TddddddddddddddddddddT',
          'TYdYdYdYdYddYdYdYdYdYT',
          'T""""""""""""""""""""T',
          'T""""""""""""""""""""d',
          'T""""""""""ss"""""""""',
          'sssssssssssssKssssssss',
          '~~~~~~~~~~pp~~~~~~~~~~',
          '~~~~~~~~~~pp~~~~~~~~~~',
          '~~~~~~~~~~pp~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          { id: 'tyS', x: 11, y: 1, spr: 'toyol', solid: false, alpha: .8, light: TYL, s: { mode: 'cry' } },
          { id: 'aisS', x: 9, y: 8, spr: '@aisyah', dir: 3, on: S => S.say('阿依莎', S.f.rit ? '……它在看你。' : '你拿到了！……它一直跟着你？') },
          { id: 'tokwanS', x: 10, y: 8, spr: '@tokwan', dir: 3, light: { r: 3, col: 'rgba(255,180,90,.2)', flick: true }, on: S => S.say('拓婆', '到码头尽头去。天一亮，就照纸上写的做。') },
          { id: 'imamS', x: 12, y: 8, spr: '@imam', dir: 3, on: S => S.say('伊玛目', '我不念巫师那一套。等一会儿，我替这个孩子念一段祈祷。') },
          { id: 'semanS', x: 21, y: 7, spr: '@seman', dir: 1, hidden: true },
          { x: 13, y: 9, spr: 'invisible', solid: false, on: S => S.narr('一块黑色的大石头，被河水冲得光溜溜的。从前装锡砂的工人，在这上面磨过刀。') },
          { x: 3, y: 8, spr: 'kain', col: '#c8b890', on: S => S.narr('一块褪了色的布条系在树枝上，被风吹得一飘一飘。不知道是谁、为了什么系上去的。') },
          { x: 18, y: 8, spr: 'crate', on: S => S.narr('一只烂了一半的木箱，箱板上还看得出几个字：「KINTA TIN — PERAK」。') },
          { id: 'tepi', x: 10, y: 12, w: 2, spr: 'invisible', solid: false, on: S => tepiOn(S) }
        ],
        async enter(S, first) { if (first) return dawnEnter(S); },
        step(S, x, y) { if (S.f.ph === 'dawn' && y >= 7 && !S.f.met) return meetBank(S); }
      }
    }
  });

  /* ================= 小工具 ================= */
  const tp = e => [Math.round(e.px / TS), Math.round(e.py / TS)];
  const near = (a, b, px) => Math.abs(a.px - b.px) + Math.abs(a.py - b.py) < px;
  function stepTo(e, tx, ty, spd) {   // 往目标走一步（玩家不算障碍）；已经到了返回 true
    const m = curMap(), [ex, ey] = tp(e); if (ex === tx && ey === ty) return true;
    const d = bfsStep(m, ex, ey, tx, ty, W.pl); if (d >= 0) startMove(e, d, spd); return false;
  }
  function pathLen(sx, sy, tx, ty, max) {   // 真实步数（墙算数），超过 max 返回 99
    if (sx === tx && sy === ty) return 0;
    const m = curMap(), seen = new Set([sx + ',' + sy]); let fr = [[sx, sy]];
    for (let d = 1; d <= max; d++) {
      const nx = [];
      for (const [x, y] of fr) for (const [dx, dy] of DIRS) {
        const a = x + dx, b = y + dy, k = a + ',' + b; if (seen.has(k)) continue; seen.add(k);
        if (a === tx && b === ty) return d;
        if (passable(m, a, b, W.pl)) nx.push([a, b]);
      }
      fr = nx; if (!fr.length) break;
    }
    return 99;
  }
  const spotsHere = () => curMap().ents.filter(z => z.spr === 'spot' && !z.hidden);
  function findLure(e, R, T, walk) {
    const [ex, ey] = tp(e); let best = null, bd = 1e9;
    for (const z of spotsHere()) {
      const k = z.s.k; if (!k) continue;
      if (k === 'cermin' && (z.s.n >= 3 || T.seen.includes(z.id))) continue;
      const [zx, zy] = tp(z), d = walk ? pathLen(ex, ey, zx, zy, R) : Math.abs(zx - ex) + Math.abs(zy - ey);
      if (d <= R && d < bd) { bd = d; best = z; }
    }
    return best;
  }
  function haveLures(S) { return Object.keys(LN).filter(k => k === 'kacang' ? (S.f.kac || 0) > 0 : k === 'guli' ? (S.has('guli') || S.has('guli2')) : S.has(k)); }
  function lureName(S, k) { return k === 'kacang' ? `绿豆（还剩 ${S.f.kac} 把）` : LN[k]; }

  /* ---------- 放诱饵 ---------- */
  async function spotOn(S, id) {
    const e = S.ent(id), k = e.s.k, ph = S.f.ph;
    if (ph !== 'n1' && ph !== 'n2') return S.narr('地上一个粉笔画的圈。');
    if (k === 'cermin') {
      const r = await S.ask(e.s.n >= 3 ? '镜子还立在这里。它已经照腻了。' : '镜子立在这里。', ['拿起来，换个地方摆', '就放在这儿']);
      if (r === 0) { e.s.k = ''; S.give('cermin', true); S.sfx('item'); S.toast('拿起了镜子'); }
      return;
    }
    if (k) return S.narr(LDESC[k]);
    const have = haveLures(S);
    if (!have.length) return S.narr('手里没有能摆的东西了。');
    const r = await S.ask(e.s.mess ? '圈里还散着几颗被扒乱的绿豆。摆什么？' : '在这个圈里摆什么？', [...have.map(t => lureName(S, t)), '先不摆']);
    if (r >= have.length) return;
    const t = have[r]; e.s.k = t; e.s.n = 0; e.s.mess = 0;
    if (t === 'kacang') { S.f.kac--; if (S.f.kac <= 0) S.take('kacang'); beanTicks(S, 8, .04); }
    else if (t === 'guli') { if (S.has('guli2')) S.take('guli2'); else S.take('guli'); clink(S); }
    else { S.take(t); if (t === 'cermin') shimmer(S); else crabClick(S); }
    S.toast(`摆好了：${LN[t]}`);
  }
  function engage(S, e, T, L, cfg, idT) {
    const k = L.s.k; T.m = 'lure'; T.k = k; T.lure = L.id; T.snd = .3;
    if (k === 'cermin') { T.t = cfg.mir[Math.min(L.s.n, 2)]; L.s.n++; T.seen.push(L.id); }
    else T.t = cfg.dur[k];
    e.s.mode = k === 'kacang' ? 'count' : ''; e.dir = 0;
    const c = S.f.cl || (S.f.cl = {}), first = !c[k];
    if (k === 'kacang') S.toast(first && S.f.ph === 'n1' ? '它蹲在豆子前面，一颗一颗地数：「satu、dua、tiga……」' : '它扑到豆子上，又数了起来。');
    else if (k === 'cermin') { shimmer(S); S.toast(L.s.n >= 3 ? '它又看了一眼镜子……有点不耐烦了。' : first && S.f.ph === 'n1' ? '它看见了镜子里的自己，愣住了，伸手去摸——镜子里，它的脚踝上拴着一圈红线。' : '它又凑到镜子跟前，歪着头照来照去。'); }
    else if (k === 'guli') { clink(S); S.toast(first && S.f.ph === 'n1' ? '它扑向弹珠，抓起最亮的那颗——猫眼！对着光看个不停。' : '它扑向弹珠，一颗一颗地拨着玩。'); }
    else if (k === 'ketam') { crabClick(S); S.toast(first && S.f.ph === 'n1' ? '它伸手去抓螃蟹——螃蟹一钳子夹住了它的手指！' : '它蹲下去逗那只螃蟹。'); }
    S.bubble(idT, k === 'kacang' ? '…' : '?', 900);
  }
  function lureSnd(S, T, dt, idT) {
    T.snd -= dt; if (T.snd > 0) return; T.snd = 1.1;
    if (T.k === 'kacang') { beanTicks(S, 5); S.bubble(idT, '…', 700); }
    else if (T.k === 'guli') clink(S, .03);
    else if (T.k === 'ketam') crabClick(S);
    else if (T.k === 'cermin' && Math.random() < .5) giggle(S, .02);
  }
  /* 诱饵用完；返回它接下来去哪：'go' 继续 / 'home' 揣着弹珠回家 / 'crab' 追螃蟹 */
  function spend(S, e, T, crabId, crabTo) {
    const L = S.ent(T.lure), k = T.k, c = S.f.cl, first = !c[k], n1 = S.f.ph === 'n1';
    c[k] = true; e.s.mode = '';
    if (!L) return 'go';
    if (k === 'kacang') { L.s.k = ''; L.s.mess = 1; S.toast(first && n1 ? '……数完了。它对着水沟口小声说：「Abah, lapar.」（爸爸，饿。）' : '豆子数完了，被它扒得满地都是。'); return 'go'; }
    if (k === 'cermin') { S.toast(L.s.n >= 3 ? '它对着镜子打了个哈欠——照腻了。' : '它恋恋不舍地离开了镜子。'); return 'go'; }
    if (k === 'guli') { L.s.k = ''; if (n1) S.f.lostMata = true; S.toast(n1 ? '它把猫眼攥在手里，咯咯笑着跑开了——它要拿回家去。' : '它抓了一颗弹珠，咯咯笑着跑回了它的角落。'); return 'home'; }
    L.s.k = '';
    const cr = S.ent(crabId), [lx, ly] = tp(L); cr.px = lx * TS; cr.py = ly * TS; cr.x = lx; cr.y = ly; cr.mv = null; cr.hidden = false;
    S.f.crabTo = crabTo;
    S.toast(first && n1 ? '螃蟹横着爬跑了，它尖叫着追过去——地上留下一串灰白的小脚印，像锡矿湖边的细沙。' : '螃蟹横着爬跑了，它尖叫着追了过去。');
    return 'crab';
  }
  function crabTick(S, id) {
    const cr = S.ent(id); if (!cr || cr.hidden || cr.mv || !S.f.crabTo) return;
    if (stepTo(cr, S.f.crabTo[0], S.f.crabTo[1], 4.4)) cr.hidden = true;
  }

  /* ================= 第一天：振兴号 ================= */
  async function opening(S) {
    S.f.ph = 'd1a';
    await S.narr('礼拜三早上。店门的门板才卸下一半，太阳斜斜地照进来，照着满屋子的灰。\n阿爸坐在柜台后面，把钱罐里的钱倒在台面上，数了一遍，又数一遍。');
    S.face('abah', 'pl');
    await S.say('阿爸', ['阿明，过来。', '罐子里本来六卷，一卷十张十块的。下个月的店租，加上进货的钱。', '……今早剩三卷。']);
    await S.say('阿明', '又少了？');
    await S.say('阿爸', ['这个月第三回了。门是我自己闩的，窗也闩着。', '……阿明，你老实讲，是不是你拿去买弹珠了？']);
    const r = await S.ask('阿爸看着你。', ['「我没有！」', '（把裤袋翻出来给他看）'], '阿明');
    if (r === 1) await S.narr('你把两个裤袋都翻了出来：一颗弹珠、半块香口胶、一张公仔纸。\n阿爸看了一眼，叹了口气。');
    await S.say('阿爸', ['……我知道不是你。你要偷，也不会每回刚好拿一半。', '村里好几家都丢了。村长说是新搬来割胶的拉玛萨米。我看不像——他来买米，一分钱都要找清楚。', '剩下这三卷，是礼拜六交店租的。丢一卷，还能跟房东求个情；再丢两卷……我们就得搬去怡保投靠你三叔了。']);
    S.goal('看看钱罐，还有店里有什么不对劲');
  }
  async function d1aCheck(S) {
    if (S.f.ph !== 'd1a' || !S.f.sTin || !S.f.sFoot) return;
    await S.think('……一个小孩？\n一个能从水沟里钻进来、还会把硬币码整齐的小孩？');
    S.f.ph = 'd1b';
    S.goal('出去问问，村里是不是也丢了钱');
  }
  async function tillOn(S) {
    const ph = S.f.ph, n = S.ent('till').s.n;
    if (ph === 'n1') return S.narr(`钱罐里还剩 ${n} 卷。再丢${n >= 3 ? '两' : '一'}卷，店租就交不上了。`);
    if (ph === 'd1a' && !S.f.sTin) {
      await S.narr('一只苏打饼干的铁罐，阿爸拿来当钱罐用。罐底压着三卷用旧报纸包好的钞票，橡皮筋箍着，纸上是阿爸的字：「振兴　三月」。');
      await S.narr('旁边剩下的硬币，被人一摞一摞码得整整齐齐。每摞十个，一个不多，一个不少。\n阿爸从来不这样码钱。');
      S.f.sTin = true; return d1aCheck(S);
    }
    return S.narr(ph === 'd2' || ph === 'd2b' ? `钱罐里还剩 ${n} 卷。阿爸今早数了三遍。` : '钱罐里压着那几卷钱。阿爸把罐子摆在柜台正中间，像是故意给谁看。');
  }
  async function footOn(S) {
    if (S.f.ph === 'n1') return S.narr('那串小脚印：水沟口 → 走廊 → 店面 → 柜台后面。它每回都走这条路。');
    await S.narr('水泥地上一串湿脚印，从厨房墙脚的水沟口出来，穿过走廊，一直走到柜台后面。\n只有你半个巴掌大，五个脚趾头清清楚楚。');
    if (S.f.ph === 'd1a' && !S.f.sFoot) { S.f.sFoot = true; return d1aCheck(S); }
  }
  async function drainOn(S) {
    if (S.f.ph === 'n1') return S.narr('水沟口黑洞洞的。里面有水在流，咕噜……咕噜……');
    await S.narr('厨房墙脚的水沟口，铁栅栏缺了两根，黑洞洞的，一直通到街边的大水沟。\n洞口边上的青苔，被什么东西蹭掉了一小块。');
    if (S.f.ph === 'd1a' && !S.f.sFoot) await S.think('地上好像有脚印……');
  }
  async function abahTalk(S) {
    S.face('abah', 'pl');
    const ph = S.f.ph;
    if (ph === 'd1a') return S.say('阿爸', cyc(S, '_ab0', ['钱罐你看过了？……硬币是谁码的，我也不知道。', '厨房那边地上湿湿的，你小心别滑倒。']));
    if (ph === 'd1b') return S.say('阿爸', '去吧，问问街坊。别乱讲是谁偷的，啊。');
    if (ph === 'd1c' || ph === 'dusk') return S.say('阿爸', cyc(S, '_ab1', ['绿豆？麻袋里自己舀。江鱼仔在玻璃罐里。……你要这些做什么？', '拓婆跟你讲鬼仔？……我阿嬷那辈人也讲。我是不信的。', '……不过你要摆，就摆吧。']));
    if (ph === 'd2' || ph === 'd2b') return S.say('阿爸', cyc(S, '_ab2', ['昨晚你在走廊上睡的？脖子都睡歪了。', `钱罐里还剩 ${S.ent('till').s.n} 卷。……奇怪，真奇怪。`]));
    return S.say('阿爸', '……');
  }
  async function leaveShop(S) {
    const ph = S.f.ph;
    if (ph === 'd1a') { await S.narr('先看看店里——钱罐、还有厨房那边。'); return S.walk('pl', 'u', 5); }
    if (ph === 'n1') { await S.narr('外面黑漆漆的。钱罐还在柜台上。'); return S.walk('pl', 'u', 5); }
    await S.go('kampung', 5, 11, 0);
  }
  async function enterShop(S) { S.sfx('open'); await S.go('kedai', 8, 12, 3); }
  async function balangOn(S) {
    if ((S.f.ph === 'd1c' || S.f.ph === 'dusk') && !S.has('bilis') && !S.has('ketam')) { S.give('bilis'); return S.narr('你从玻璃罐里抓了一小把江鱼仔，塞进裤袋。一股咸腥味。'); }
    return S.narr('一排玻璃罐：江鱼仔、虾米、花生糖、橡皮糖。盖子是红色的。');
  }
  async function karungOn(S) {
    if ((S.f.ph === 'd1c' || S.f.ph === 'dusk') && !S.f.gotKac) { S.f.gotKac = true; S.f.kac = 2; S.give('kacang'); await S.narr('你用纸袋从麻袋里舀了满满一袋绿豆。够撒两回。'); return checkLures(S); }
    return S.narr('一麻袋绿豆。马来人拿它煮甜汤（bubur kacang），华人也拿它煮绿豆汤。');
  }
  async function marbleOn(S) {
    if ((S.f.ph === 'd1c' || S.f.ph === 'dusk') && !S.f.gotGuli) {
      S.f.gotGuli = true; S.give('guli'); S.ent('mtin').s.empty = 1;
      await S.narr('你把弹珠罐抱了出来。三年攒的，四十几颗。\n最上面那颗是「猫眼」——透明的玻璃里裹着一道蓝。阿公在世的时候，从新加坡给你带回来的。');
      await S.think('……它要是喜欢弹珠，最喜欢的一定是这颗。');
      return checkLures(S);
    }
    return S.narr(S.f.gotGuli ? '弹珠罐空了。罐底还留着几道玻璃珠划出来的印子。' : '你的弹珠罐，铁皮的，盖子上印着一只老虎。');
  }
  function lureGoal(S) {
    const miss = [];
    if (!S.f.gotKac) miss.push('绿豆（店里的麻袋）');
    if (!S.has('cermin')) miss.push('镜子（穆图理发店）');
    if (!S.f.gotGuli) miss.push('弹珠（你的房间）');
    if (!S.has('ketam')) miss.push('螃蟹（河边泥滩）');
    return miss.length ? '找齐诱饵：' + miss.join('、') : '天快黑了，回振兴号守着钱罐';
  }
  async function checkLures(S) {
    if (S.f.ph !== 'd1c') return;
    if (S.f.gotKac && S.has('cermin') && S.f.gotGuli && S.has('ketam')) {
      S.f.ph = 'dusk';
      await S.think('绿豆、镜子、弹珠、螃蟹——都齐了。\n太阳快下山了。');
      S.goal(lureGoal(S));
      if (S.map === 'kedai') return dusk1(S);
      return;
    }
    S.goal(lureGoal(S));
  }

  /* ================= 甘榜 ================= */
  function kampungSetup(S) {
    const ph = S.f.ph, night = ph === 'n2pre', trail = ph === 'd2' || ph === 'd2b';
    S.dark(night ? .84 : .12); S.plr(night ? 2.8 : null);
    for (const id of ['tokwan', 'aisyah', 'imam', 'timah', 'muthu', 'ketua', 'kopi', 'kopi2', 'rama', 'seman', 'motor']) S.show(id, !night);
    S.show('aisN', night);
    TRAIL.forEach((_, i) => S.show('tr' + i, trail));
    S.show('evSand', trail); S.show('evWrap', trail && !S.f.ev_wrap); S.show('evMata', trail && !!S.f.lostMata && !S.f.ev_mata);
    const L = S.ent('lamp'); L.off = !night; L.light = night ? { r: 3.2, col: 'rgba(255,220,150,.16)' } : null;
  }
  async function kampungEnter(S, first) {
    kampungSetup(S);
    const ph = S.f.ph;
    S.amb(ph === 'n2pre' ? 'night' : 'wind');
    if (first && (ph === 'd1b' || ph === 'd1c')) {
      await S.narr('甘榜的早上。高脚屋一排一排，屋檐下晒着纱笼和咸鱼。\n北边是割胶的橡胶园；东边是废了的锡矿湖，碧绿碧绿的，绿得不像真的。');
      await S.think('咖啡摊上人最多。去问问吧。');
    }
    if (ph === 'd2' && S.once('trail')) {
      await S.narr('店后面的水沟边，泥地上有一串小小的脚印。\n湿的，沾着灰白色的细沙，一路往东去了。');
      S.goal('跟着水沟边的小脚印，找到鬼仔的家');
    }
  }
  async function trailOn(S) {
    await S.narr(cyc(S, '_tr', ['湿湿的小脚印，五个脚趾头。沾着灰白色的细沙，一路往东。', '脚印绕过了咖啡摊的桌子底下，好像还在那儿停了一下——桌腿边掉着一枚五分钱硬币。', '脚印越往东，沙子越多。东边……是矿湖。']));
  }
  async function aisyahTalk(S) {
    S.face('aisyah', 'pl');
    const ph = S.f.ph;
    if (ph === 'd1a') return S.say('阿依莎', '阿明！你家也丢了？');
    if (ph === 'd1b') {
      if (!S.f.aisT) {
        S.f.aisT = true;
        await S.say('阿依莎', ['阿明！你家也丢了？我外婆的米缸底下也少了二十块。', '……小脚印？还把硬币码得整整齐齐？']);
        await S.narr('阿依莎的眼睛一下子瞪圆了。她左右看看，压低了声音。');
        await S.say('阿依莎', ['是 toyol。鬼仔！我外婆讲过，鬼仔偷钱就是这样的！', '走，去问我外婆。她就坐在楼梯上。']);
        S.goal('跟阿依莎去问拓婆（1 号门口）');
        return;
      }
      return S.say('阿依莎', '我外婆就在那儿，楼梯上。快去问！');
    }
    if (ph === 'd1c') {
      const m = lureGoal(S).replace('找齐诱饵：', '');
      return S.say('阿依莎', ['我外婆说的四样，你还差：' + m + '。', cyc(S, '_ah', ['螃蟹得拿腥的东西引出来，空手抓不到。', '穆图叔叔的理发店前几天换了新镜子，旧的说不定还没扔。', '弹珠你自己有一罐，我知道的。'])]);
    }
    if (ph === 'dusk') return S.say('阿依莎', '都齐了？天黑之前我去你家，帮你在地上画圈。快回去吧！');
    if (ph === 'd2') return S.say('阿依莎', cyc(S, '_ad', ['跟着脚印走！它往东去了。', '脚印到矿湖那边……那边只有 Timah 姐家和 Seman 伯家。', '找到三样能证明的东西，我们再去告诉外婆。']));
    if (ph === 'd2b') return S.say('阿依莎', '……真的是 Seman 伯。走，去告诉我外婆。');
    return S.say('阿依莎', '……');
  }
  async function tokwanTalk(S) {
    S.face('tokwan', 'pl');
    const ph = S.f.ph;
    if (ph === 'd1b' && S.f.aisT) return tokwanLore(S);
    if (ph === 'd2b') return plan2(S);
    if (ph === 'd1a' || ph === 'd1b') return S.say('拓婆', cyc(S, '_tw0', ['孩子，吃过早饭没有？来，拿块九层糕（kuih lapis）。', '你阿爸的店也丢了钱？……唉，这个月不太平。']));
    if (ph === 'd1c' || ph === 'dusk') return S.say('拓婆', cyc(S, '_tw1', ['东西要摆在它一定会经过的地方。它不会绕路去找。', '豆子最久，镜子能照好几回，弹珠它会揣一颗回家，螃蟹最短。', '它咬人的。别让它碰到你。']));
    if (ph === 'd2') return S.say('拓婆', cyc(S, '_tw2', ['它从水沟回去……跟着水沟走，就能找到它的家。', '找到了，先别声张。回来告诉我。']));
    return S.say('拓婆', '去吧，孩子。');
  }
  async function tokwanLore(S) {
    S.f.ph = 'd1c0';
    await S.say('阿依莎', '外婆，阿明家也丢了钱！地上有小小的脚印，硬币还被码得整整齐齐！');
    await S.narr('拓婆正在嚼槟榔。她停下来，看了你很久。');
    await S.say('拓婆', ['小脚印，从水沟里来……硬币码得整整齐齐，钱只拿一半……', '是鬼仔（toyol）。']);
    await S.say('拓婆', ['有人请巫师养的小鬼。用一个……没能来到这世上的孩子养出来的。住在瓶子里。', '主人喂它，它就替主人偷钱。门窗关着也没用，它从水沟、从屋顶缝里钻进来。', '大人看不见它。小孩子，有时候看得见。']);
    await S.say('拓婆', ['它偷钱，就像小孩分糖：你一半，我一半。', '主人拿什么喂它，你们别问。……只记住，喂它的人，手指头上总缠着布。']);
    await S.say('阿依莎', '外婆，那怎么办？');
    await S.say('拓婆', ['它毕竟是个孩子。孩子会分心。', '撒一把绿豆，它非一颗一颗数完不可——这个拖得最久。', '摆一面镜子，它会对着镜子照个没完。可是照多了，也会腻。', '放几颗弹珠，它会玩一阵，揣一颗跑回家去，过一会儿才回来。', '放一只螃蟹，它会追着螃蟹跑。螃蟹一爬走它就忘了——这个最短。']);
    await S.say('拓婆', ['东西要摆在它一定会经过的地方。它不会绕路去找。', '还有，别让它碰到你。它咬人。', '……今晚守着你家的钱罐，看清楚它从哪里来，回哪里去。']);
    await S.narr('阿依莎飞快地在练习簿上记着，写完撕下来塞给你。');
    await S.note('buku');
    S.f.ph = 'd1c';
    S.goal(lureGoal(S));
  }
  async function ketuaTalk(S) {
    S.face('ketua', 'pl');
    const ph = S.f.ph;
    if (!S.f.list) {
      await S.say('村长', ['振兴号的阿明？你阿爸的店也丢了吧？', '这个月整条街，家家都丢。一半，一半，跟算好了一样。']);
      await S.say('村长', ['我看就是那个割胶的印度人。三月初才搬来，他一来，钱就开始丢。', '今晚我们几个要去胶园的工寮里搜一搜。']);
      const r = await S.ask('村长拍了拍桌子。', ['「有人看见他偷了吗？」', '「村长，都有谁家丢了？」'], '阿明');
      if (r === 0) await S.say('村长', '……没人看见。可是除了他，还能有谁？这条街上的人，我从小看着长大的。');
      await S.narr('村长从衬衫口袋里掏出一个小本子，翻开给你看。');
      await S.note('senarai');
      S.f.list = true;
      await S.think('……一号到九号，好像少了一家？');
      return;
    }
    if (ph === 'd2' || ph === 'd2b') return S.say('村长', cyc(S, '_k2', ['我们昨晚去工寮搜了。只有一锅咖喱、一张草席、一张他老婆孩子的照片。……唉。', '你说……不是他？那是谁？']));
    return S.say('村长', cyc(S, '_k1', ['本子你看过了。都是一半，都是晚上。', '要是让我抓到，我亲手把他送去警察局。']));
  }
  async function timahTalk(S) {
    S.face('timah', 'pl');
    if (S.f.ph === 'd2' || S.f.ph === 'd2b') return S.say('Timah 姐', cyc(S, '_t2', ['昨晚？昨晚我家倒是没丢。……隔壁 Seman 家的狗叫了半夜。他家什么时候养狗了？', 'Seman 啊……锡矿关的那天，他在矿湖边坐到天黑。后来就买了电视，买了摩托车。']));
    return S.say('Timah 姐', cyc(S, '_t1', ['我的私房钱……塞在枕头套里，连我儿子都不知道。它拿走了一半。', '一半！你说这贼是不是还有点良心？', '我儿子在新加坡做工，每个月寄一点回来……这一半，是他三个月的血汗。']));
  }
  async function ramaTalk(S) {
    S.face('rama', 'pl'); S.f.ramaT = true;
    if (S.once('rama1')) {
      await S.say('拉玛萨米', ['你是振兴号老板的孩子吧。你阿爸是个好人，赊给我两回米。', '他们说是我偷的。……我在槟城的胶园割了二十年胶。胶园卖给了发展商，我才搬来这里。']);
      await S.say('拉玛萨米', ['我不跟他们吵。吵，他们也不会信。', '我只是想，要是哪天真相出来了，有人会不会来跟我说一声。']);
      return;
    }
    return S.say('拉玛萨米', cyc(S, '_r', ['凌晨四点，我就要进胶园了。夜里的事，我什么都没看见。', '……我女儿在槟城读书。她写信来问，新的地方好不好。我还没回信。']));
  }
  async function imamTalk(S) {
    S.face('imam', 'pl');
    if (S.f.ph === 'd2' || S.f.ph === 'd2b') return S.say('伊玛目', ['要是你们找到了那个瓶子，别砸，也别乱扔。', '不管它被拿来做了什么，它自己是无辜的。']);
    if (S.once('im1')) {
      await S.say('伊玛目', ['Assalamualaikum（愿你平安），孩子。', '祈祷室的捐款箱也少了一半。屋顶漏水，那是大家一分一分捐的。']);
      await S.say('伊玛目', ['有人说是鬼仔。……养鬼求财，在我们的信仰里是很大的罪，叫 syirik——去求真主以外的东西。', '可是被养的那个小东西，它自己能选吗？']);
      return;
    }
    return S.say('伊玛目', '早点回家吧，孩子。');
  }
  async function muthuTalk(S) {
    S.face('muthu', 'pl');
    if ((S.f.ph === 'd1c' || S.f.ph === 'dusk') && !S.has('cermin') && !S.f.gotMir) {
      await S.say('阿明', '穆图叔叔，你那面换下来的旧镜子，还在吗？');
      await S.say('穆图', ['镜子？要镜子做什么？……哦！鬼仔！哈哈！', '我奶奶在泰米尔纳德邦的村子里也讲小孩鬼的故事。全世界的小孩鬼都一样，爱照镜子。', '后面那面旧的，裂了个角，我正想扔。拿去吧，别割着手。']);
      S.f.gotMir = true; S.give('cermin');
      return checkLures(S);
    }
    if (S.f.ph === 'd2' || S.f.ph === 'd2b') return S.say('穆图', cyc(S, '_m2', ['昨晚我抽屉里一分没少！你说奇不奇怪？', '那面镜子用着还行吧？……我是说，那个小东西，喜欢吗？']));
    return S.say('穆图', cyc(S, '_m1', ['阿明！要剪头吗？……不剪？那陪我聊聊。这个月来剪头的人少了一半。', '我抽屉里也丢了钱。一半。……我这抽屉连锁都没有，要偷就全偷了，干吗留一半？', '村长说是拉玛萨米。我跟他一起在庙里拜过神。他不是那种人。']));
  }
  async function crabOn(S) {
    const ph = S.f.ph;
    if (ph !== 'd1c' && ph !== 'dusk') return S.narr('泥滩上的螃蟹洞。洞口一圈小泥球，是螃蟹推出来的。');
    if (S.has('ketam')) return S.narr('碗里那只已经够凶了。');
    if (!S.has('bilis')) return S.narr('一只小螃蟹探出头来，看见你，「嗖」地缩了回去。\n空手是抓不到的。得拿点腥的东西把它引出来——店里玻璃罐里有江鱼仔。');
    S.take('bilis');
    await S.narr('你把几条江鱼仔丢在洞口，蹲在旁边，大气都不敢出。\n过了一会儿，两只眼睛像两根小火柴棍，从洞里竖了起来……');
    crabClick(S);
    await S.narr('你一把扣下去！\n螃蟹的钳子夹住了你的指甲盖，疼得你直甩手——可总算抓住了。你从泥里捡了一只破碗，把它扣在里面。');
    S.give('ketam');
    return checkLures(S);
  }

  /* ---------- 第二天：找主人 ---------- */
  function evAdd(S, k) { if (S.f['ev_' + k]) return false; S.f['ev_' + k] = true; S.f.evN = (S.f.evN || 0) + 1; return true; }
  async function evCheck(S) {
    if (S.f.ph !== 'd2') return;
    if ((S.f.evN || 0) >= 3) {
      S.f.ph = 'd2b';
      await S.say('阿依莎', ['红线、矿砂、包钱的纸……还有他手上的布。', '……阿明，是 Seman 伯。']);
      await S.think('Seman 伯。矿关门那天，在矿湖边坐到天黑的 Seman 伯。');
      S.goal('回 1 号，把发现告诉拓婆');
      return;
    }
    S.goal(`在 8 号 Seman 家附近找证据（${S.f.evN || 0}/3）`);
  }
  async function tiangOn(S) {
    const ph = S.f.ph;
    if (ph === 'd2') {
      await S.narr('高脚屋的楼梯柱子上，缠着一圈红线，系得很紧，线头剪得齐齐的。');
      if (S.f.cl && S.f.cl.cermin) await S.think('……和镜子里，它脚踝上拴的那圈一模一样。');
      else await S.think('马来人家里不兴在柱子上缠红线。这是……拴什么东西用的？');
      if (evAdd(S, 'thread')) return evCheck(S);
      return;
    }
    return S.narr(ph === 'n2pre' ? '柱子上的红线在月光底下黑得像一道疤。' : '高脚屋的木头柱子，底下垫着石块，防白蚁。柱子上缠着一圈红线。');
  }
  async function evSand(S) {
    await S.narr('脚印到这里就乱了。院子里铺的不是泥，是灰白色的锡矿砂——只有矿湖边才有。');
    if (S.f.cl && S.f.cl.ketam) await S.think('它被螃蟹夹了以后，脚底沾的就是这种沙。');
    if (evAdd(S, 'sand')) return evCheck(S);
  }
  async function evWrap(S) {
    await S.narr('楼梯底下压着一张揉皱的旧报纸。展开一看，上面是阿爸的字：「振兴　三月」。\n——是包钱的纸。');
    S.hide('evWrap');
    if (evAdd(S, 'wrap')) return evCheck(S);
  }
  async function evMata(S) {
    await S.narr('高脚屋底下的阴影里，有个东西亮了一下。\n你趴下去，伸长手——是你的猫眼弹珠。玻璃上还沾着一点灰白的沙。');
    S.give('mata'); S.hide('evMata');
    if (evAdd(S, 'mata')) return evCheck(S);
  }
  async function semanTalk(S) {
    S.face('seman', 'pl');
    const ph = S.f.ph;
    if (ph === 'd2' || ph === 'd2b') {
      if (!S.f.semT) {
        S.f.semT = true;
        await S.say('Seman 伯', ['哟，振兴号的小老板？还有 Hassan 家的丫头。', '找我有事？……我今天要去怡保。Nurul 在中央医院，割盲肠。']);
        await S.narr('他在擦那辆新摩托车。擦车的那只手上，好几根手指都缠着白布，布上渗着一点一点的褐色。');
        const r = await S.ask('', ['「伯，你的手怎么了？」', '「伯，你这摩托车好新啊。」'], '阿明');
        if (r === 0) { await S.say('Seman 伯', '杀鱼割的。'); await S.narr('他把手往身后藏了藏。'); }
        else await S.say('Seman 伯', ['在怡保找到了工作，开罗厘。……分期付款的，分期付款。', '你看什么？']);
        await S.say('Seman 伯', ['好了好了，大人有事要忙。你们小孩子去玩吧。', '……晚上别到处乱跑。']);
        if (evAdd(S, 'band')) return evCheck(S);
        return;
      }
      return S.say('Seman 伯', cyc(S, '_s2', ['我要去车站了。……你们怎么还在这儿？', 'Nurul 怕打针。我得在她醒过来之前到。']));
    }
    return S.say('Seman 伯', cyc(S, '_s1', ['锡矿关门那天，我在那个矿干了整整十七年。', '现在？现在好了，好了。……真主保佑。', '你阿爸的店还好吧？……替我跟他说，上个月赊的账，过两天就还。']));
  }
  async function semanDoor(S) {
    const ph = S.f.ph;
    if (ph === 'n2pre') { S.sfx('open'); return S.go('rumah', 2, 9, 3); }
    if (ph === 'd2' || ph === 'd2b') return S.narr('门关着。屋里有电视的声音，一个女人在唱马来情歌。……可是 Seman 伯就在外面擦车。电视开着给谁看？');
    return S.narr('8 号。Seman 伯家的门关着。');
  }
  async function plan2(S) {
    S.f.ph = 'n2p0';
    await S.say('阿依莎', '外婆！是 Seman 伯！楼梯柱子上有红线，院子里有矿砂，还有阿明家包钱的纸！');
    await S.narr('拓婆沉默了很久，手里的槟榔叶捏碎了。');
    await S.say('拓婆', ['……Seman。', '他在矿上干了十七年。矿关了，老婆跑回娘家，女儿又病了。']);
    await S.say('拓婆', ['今天是礼拜四。今晚是 malam Jumaat（礼拜五前夜）。', '养鬼仔的人，这一晚要喂它。他去了怡保——它今晚吃不上。', '饿了的鬼仔，是会咬人的。']);
    await S.say('阿依莎', '那……我们还要去吗？');
    await S.say('拓婆', ['不去，它饿过这一晚，下个礼拜四，Seman 就得多喂它一些。', '我老了，高脚屋的楼梯爬不上去。你们去。把它的瓶子找出来。', '别打开，别砸。天亮的时候，带到下游的旧码头来。我去请伊玛目。']);
    S.f.kac = 2; S.give('kacang', true); S.give('ketam', true); S.give('guli2', true);
    if (S.has('guli')) { S.take('guli'); S.give('mata', true); }
    await S.narr('拓婆往你的纸袋里又倒了两把绿豆。阿依莎去河边又抓来一只螃蟹，扣在破碗里。');
    await S.narr(S.has('mata') ? '你把猫眼揣进口袋，剩下的普通弹珠装了一把，留着当诱饵。镜子用旧纱笼包好，夹在胳肢窝底下。' : '你把剩下的普通弹珠装了一把，留着当诱饵。镜子用旧纱笼包好，夹在胳肢窝底下。');
    S.toast('获得：绿豆、螃蟹、一把弹珠');
    await S.fade(1, 800);
    await S.card('三月十三日　礼拜四', '夜里十一点', 'Seman 伯的摩托车，傍晚就往怡保去了。\n8 号的高脚屋黑着灯。\n矿湖在月亮底下，绿得发黑。');
    S.f.ph = 'n2pre';
    kampungSetup(S); S.amb('night');
    S.pos(22, 6, 2);
    await S.fade(0, 600);
    await S.say('阿依莎', ['我在外面望风。有人来，我就学猫叫。', '后门的门闩是坏的，推一下就开——我小时候在他家玩过。']);
    S.goal('进 8 号 Seman 家，找到鬼仔的瓶子（阿依莎在外面望风）');
    S.cp('n2pre');
  }

  /* ================= 第一夜：守钱罐 ================= */
  async function dusk1(S) {
    S.f.ph = 'dusk2';
    S.dark(.45);
    await S.narr('太阳下山了。阿爸把门板一块一块装回去，上了闩。');
    S.face('abah', 'pl');
    await S.say('阿爸', ['今晚早点睡。', '……罐子我就摆在柜台上。要真是贼，我倒要看看他怎么进来。']);
    S.hide('abah'); S.ent('ranjang').s.zz = 1;
    await S.narr('天黑之前，阿依莎从后门溜进来，蹲在地上，照着那串小脚印，用粉笔画了几个圈。');
    for (let i = 1; i <= 6; i++) S.show('k' + i);
    await S.say('阿依莎', ['外婆说，东西要摆在它一定会经过的地方。我画了几个圈——有的在脚印上，有的不在，你自己挑。', '我得回家了，天黑以后我妈不让我出门。明天一早我来找你！']);
    await S.fade(1, 700);
    await S.card('', '夜里十一点四十分', '阿爸的鼾声从里屋传出来，一阵一阵的。\n你坐在走廊的黑暗里，抱着膝盖，\n盯着厨房墙脚那个黑洞洞的水沟口。');
    S.pos(9, 6, 1); S.dark(.8); S.plr(2.8); S.amb('none');
    await S.fade(0, 700);
    gurgle(S, .06);
    await S.wait(900);
    const e = S.ent('ty'); e.s.mode = 'peek'; e.px = DRAIN1[0] * TS; e.py = DRAIN1[1] * TS; e.alpha = 0; e.hidden = false; e.dir = 0;
    S.focus(3, 4);
    await S.alpha('ty', .75, 900);
    giggle(S, .05);
    await S.narr('水沟口里，探出来半个光溜溜的脑袋。');
    await S.scare('face', { face: 'toyol', sfx: 'sting', dur: .8 });
    await S.narr('两只眼睛黑得像两个洞，眼珠子是黄的。\n它看了你一眼，咯咯一笑，又缩了回去。');
    await S.alpha('ty', 0, 400);
    S.focus(null);
    await S.think('……它还会再来。\n先把东西摆好——摆在那串脚印上的圈里。');
    S.goal('守住钱罐到天亮：诱饵摆在它路上的圈里（一人盯它、一人摆），别让它碰到你');
    n1Reset(S);
    S.cp('malam1');
    n1Start(S);
  }
  function n1Reset(S) {
    const f = S.f; f.ph = 'n1';
    f.T = { m: 'out', t: N1.first, lure: '', k: '', cd: 0, fed: 0, stun: 0, bites: 0, seen: [], snd: 0, why: 'steal', trips: 0 };
    f.stolen = f.stolen || 0; f.crabTo = null; f.cl = f.cl || {};
    const e = S.ent('ty'); S.stop('ty'); e.hidden = true; e.s.mode = ''; e.alpha = .72; e.px = DRAIN1[0] * TS; e.py = DRAIN1[1] * TS; e.x = DRAIN1[0]; e.y = DRAIN1[1];
    S.hide('crabR'); S.speed(1); S.norun(false); S.dark(.8); S.plr(2.8);
    S.ent('till').s.n = 3 - f.stolen;
    for (let i = 1; i <= 6; i++) S.show('k' + i);
  }
  function n1Start(S) { S.amb('none'); S.timer(N1.len, '离天亮', dawn1); }
  function n1Tick(S, dt) {
    const f = S.f; if (f.ph !== 'n1' || S.busy) return;
    const T = f.T, e = S.ent('ty'); if (!e || !T) return;
    T.cd = Math.max(0, T.cd - dt); T.fed = Math.max(0, T.fed - dt);
    if (T.stun > 0) { T.stun -= dt; if (T.stun <= 0) S.speed(1); }
    crabTick(S, 'crabR');
    T.zz = (T.zz || 0) - dt; if (T.zz <= 0) { T.zz = 3.2; S.tone('sawtooth', 90, 70, .6, .012, 0, 300); }   // 阿爸的鼾声
    if (T.m === 'lure') { T.t -= dt; lureSnd(S, T, dt, 'ty'); }
    if (T.m === 'out') { T.t -= dt; if (T.t <= 0) emerge1(S, e, T); return; }
    if (!e.hidden && T.cd <= 0 && near(e, W.pl, 12)) return bite1(S, T);
    if (e.mv) return;
    const sp = v => v * (T.fed > 0 ? 1.35 : 1);
    const [ex, ey] = tp(e);
    if (T.m === 'go') {
      const L = findLure(e, N1.R, T, false);
      if (L) { T.m = 'toLure'; T.lure = L.id; return; }
      if (ex === TILL1[0] && ey === TILL1[1]) return steal1(S, e, T);
      stepTo(e, TILL1[0], TILL1[1], sp(N1.goSpd)); return;
    }
    if (T.m === 'toLure') {
      const L = S.ent(T.lure); if (!L || !L.s.k) { T.m = 'go'; return; }
      const [lx, ly] = tp(L); if (ex === lx && ey === ly) return engage(S, e, T, L, N1, 'ty');
      stepTo(e, lx, ly, sp(N1.goSpd + .4)); return;
    }
    if (T.m === 'lure') {
      const L = S.ent(T.lure);
      if (L && T.k === 'cermin' && !L.s.k) { T.t = 0; }   // 镜子被拿走了
      if (T.t > 0) return;
      const nx = spend(S, e, T, 'crabR', DRAIN1);
      if (nx === 'go') T.m = 'go'; else { T.m = 'back'; T.why = nx === 'home' ? 'guli' : 'ketam'; }
      return;
    }
    if (T.m === 'back') {
      if (ex === DRAIN1[0] && ey === DRAIN1[1]) { e.hidden = true; T.m = 'out'; T.t = N1.out[T.why]; T.seen = []; gurgle(S, .03); return; }
      stepTo(e, DRAIN1[0], DRAIN1[1], sp(N1.backSpd)); return;
    }
  }
  function emerge1(S, e, T) {
    e.px = DRAIN1[0] * TS; e.py = DRAIN1[1] * TS; e.x = DRAIN1[0]; e.y = DRAIN1[1]; e.mv = null; e.s.mode = ''; e.alpha = .72; e.hidden = false; e.dir = 0;
    T.m = 'go'; T.trips++; gurgle(S, .05); giggle(S, .035, .3);
    S.toast(T.trips === 1 ? '水沟口咕噜一声——它出来了。' : cyc(S, '_em', ['它又从水沟里钻出来了。', '咕噜……它又来了。', '水沟口一声轻笑。']));
  }
  function bite1(S, T) {
    T.cd = 3.5; T.fed = 6; T.bites++; T.stun = 1.6;
    biteSnd(S); S.sfx('cut'); S.fx('red'); S.shake(300, 2); S.speed(.35);
    S.toast(T.bites === 1 ? '脚踝一阵刺痛——它咬了你一口！它舔舔嘴角，跑得更快了。' : '又被咬了一口！别挡在它前面。');
    S.bubble('ty', '♥', 900);
  }
  function steal1(S, e, T) {
    const f = S.f, till = S.ent('till');
    f.stolen++; till.s.n = Math.max(0, 3 - f.stolen);
    coins(S); giggle(S, .04); S.bubble('ty', '♥', 900);
    if (f.stolen >= N1.lose) { f.ph = 'n1x'; S.run(fail1); return; }
    S.toast(`叮——它从钱罐里抓走了一卷钱！（还剩 ${till.s.n} 卷；再丢一卷，店租就交不上了）`);
    T.m = 'back'; T.why = 'steal';
  }
  async function fail1(S) {
    n1Fails++; S.clearTimer(); S.stop('ty');
    await S.narr('它又从钱罐里抓走一卷，咯咯笑着钻回了水沟。\n罐子里只剩下最后一卷。');
    await S.die('天亮以后，阿爸对着钱罐坐了很久，一句话也没说。\n下午，他坐巴士去了一趟怡保。回来的时候，眼睛红红的。\n\n（照着脚印摆：豆子数得最久，镜子能用好几回，弹珠让它跑回家一阵，螃蟹把它引回水沟。离它远一点。）', '钱罐空了');
  }
  async function dawn1(S) {
    if (S.f.ph !== 'n1') return;
    S.f.ph = 'n1end';
    const e = S.ent('ty'); S.stop('ty'); S.speed(1);
    rooster(S);
    if (!e.hidden) { S.bubble('ty', '!', 800); await S.narr('村子那头，第一声鸡叫。\n它像被烫了一下，扔下手里的东西，一溜烟钻回了水沟。'); }
    else await S.narr('村子那头，第一声鸡叫。\n水沟里咕噜咕噜响了一阵，然后就什么声音都没有了。');
    e.hidden = true; S.hide('crabR');
    for (let i = 1; i <= 6; i++) { const z = S.ent('k' + i); if (z.s.k === 'cermin') S.give('cermin', true); z.s.k = ''; z.s.mess = 0; z.hidden = true; }
    const n = S.ent('till').s.n;
    await S.narr(n >= 3 ? '钱罐里，三卷钱一卷不少。' : '钱罐里还剩两卷。丢了一卷——还能跟房东求个情。');
    const c = S.f.cl || {}, L = [];
    if (c.cermin) L.push('镜子里，它的脚踝上拴着一圈红线');
    if (c.ketam) L.push('它脚底沾着灰白的细沙，像矿湖边的砂');
    if (c.guli) L.push('它把阿公留给我的猫眼拿回家了');
    if (c.kacang) L.push('它数完豆子，叫了一声「Abah」——爸爸');
    await S.think((L.length ? '我记住了：\n· ' + L.join('\n· ') + '\n' : '') + '……它每回都是从水沟回去的。跟着水沟，就能找到它的家。');
    await S.fade(1, 900);
    S.ent('ranjang').s.zz = 0; S.place('abah', 3, 9, 0); S.pos(8, 11, 3); S.dark(.25); S.plr(null); S.amb('room');
    await S.card('三月十三日　礼拜四', '早上', '你在走廊上靠着墙睡着了。\n醒过来的时候，脖子是歪的，手里还攥着那袋没撒完的绿豆。');
    await S.fade(0, 600);
    S.face('abah', 'pl');
    await S.say('阿爸', n >= 3 ? ['一卷不少！……阿明，你昨晚在走廊上睡的？', '奇怪。真奇怪。地上怎么撒得到处是绿豆？'] : ['少了一卷……可还剩两卷。够跟房东求个情了。', '地上怎么撒得到处是绿豆？……算了，算了。']);
    await S.narr('阿依莎在门口探进半个脑袋，冲你使劲招手。');
    await S.say('阿依莎', ['怎么样？你看见它了？', '……它从水沟回去的？你们家的水沟通到街边的大水沟。走，跟着脚印找！']);
    S.f.ph = 'd2';
    S.goal('出门，跟着店后水沟边的小脚印，找到鬼仔的家');
    S.cp('d2');
  }

  /* ================= 第二夜：Seman 家 ================= */
  async function n2Enter(S) {
    S.f.ph = 'n2s';
    await S.narr('你踮着脚爬上后面的木楼梯，推了推门。门闩果然是坏的，「吱——」地开了一条缝。\n屋里一股铁锈似的腥味，混着樟脑丸的气味。');
    const e = S.ent('ty2'); e.s.mode = 'count'; e.dir = 3;
    S.focus(3, 5);
    await S.narr('厨房的角落里，一个光头的小东西背对着门蹲着，在数什么。\n一枚，一枚，硬币碰着硬币，叮，叮。');
    coins(S);
    await S.wait(600);
    S.face('ty2', 'pl'); e.s.mode = ''; giggle(S, .03, 0, 2500);
    await S.narr('它停下来，慢慢地转过头。\n鼻子一抽一抽的，像在闻什么。');
    S.focus(null);
    await S.think('……它饿了。拓婆说，饿了的鬼仔会咬人。\n瓶子……应该在最里面的卧室。');
    await S.narr('你摸出阿依莎塞给你的那截粉笔，在门口、厅里、卧室和走廊几个地方飞快地画了圈。');
    S.goal('找到鬼仔的瓶子（它饿了：别跑，别让它靠近；用诱饵把它引开）');
    n2Reset(S);
    S.cp('malam2');
    S.toast('它在厨房。慢慢走——跑起来，它隔着两间屋都听得见。');
  }
  function n2Reset(S) {
    const f = S.f; f.ph = 'n2';
    f.T2 = { m: 'rest', t: 2.5, wp: 1, cd: 0, bites: 0, seen: [], lost: 0, ht: 0, pc: 0, pd: 99, snd: 0, k: '', lure: '', why: '', fed: 0, hb: 0 };
    f.crabTo = null; f.cl = f.cl || {};
    const e = S.ent('ty2'); S.stop('ty2'); S.follow('ty2', false); e.solid = false;
    e.px = HOME2[0] * TS; e.py = HOME2[1] * TS; e.x = HOME2[0]; e.y = HOME2[1]; e.hidden = false; e.alpha = .72; e.s.mode = 'count'; e.dir = 0;
    S.hide('crabR2'); S.speed(1); S.norun(false);
    for (let i = 1; i <= 6; i++) S.show('r' + i);
  }
  function n2Tick(S, dt) {
    const f = S.f; if (f.ph !== 'n2' || S.busy) return;
    const T = f.T2, e = S.ent('ty2'); if (!e || !T) return;
    T.cd = Math.max(0, T.cd - dt);
    crabTick(S, 'crabR2');
    const [ex, ey] = tp(e), p = W.pl;
    if (T.m === 'hunt') {
      T.ht += dt; T.pc -= dt; if (T.pc <= 0) { T.pc = .15; T.pd = pathLen(ex, ey, p.x, p.y, 10); }
      if (T.pd > N2.lost) T.lost += dt; else T.lost = 0;
      T.hb -= dt; if (T.hb <= 0) { T.hb = .62; heart(S, .07); }
    }
    if (T.m === 'rest') T.t -= dt;
    if (T.m === 'lure') { T.t -= dt; lureSnd(S, T, dt, 'ty2'); }
    if ((T.m === 'prowl' || T.m === 'hunt' || T.m === 'toLure' || T.m === 'crab') && T.cd <= 0 && near(e, p, 12)) return bite2(S, T);
    if (e.mv) return;
    if (T.m === 'rest') {
      if (T.why !== 'bite') {
        const L = findLure(e, N2.R, T, true); if (L) { T.m = 'toLure'; T.lure = L.id; e.s.mode = ''; return; }
        if (pathLen(ex, ey, p.x, p.y, 3) <= 2) { T.m = 'prowl'; e.s.mode = ''; T.t = 0; }   // 蹲在角落里也会闻到贴近的人
      }
      if (T.t <= 0) { T.m = 'prowl'; e.s.mode = ''; T.why = ''; }
      return;
    }
    if (T.m === 'prowl' || T.m === 'hunt') {
      const L = findLure(e, N2.R, T, true);
      if (L) { T.m = 'toLure'; T.lure = L.id; S.bubble('ty2', '?', 600); return; }
      if (T.m === 'prowl') {
        const pd = pathLen(ex, ey, p.x, p.y, 9), bl = T.bites ? N2.bleed : 0;   // 被咬过一口，脚踝在流血，它隔得更远也闻得到
        if (pd <= (S.running ? N2.seeRunFar : N2.see + bl)) { T.m = 'hunt'; T.ht = 0; T.lost = 0; T.pd = pd; S.bubble('ty2', '!', 800); giggle(S, .05); S.toast(T.huntN ? '它又闻到你了！' : '它闻到你了——它追过来了！'); T.huntN = (T.huntN || 0) + 1; return; }
        const w = WP2[T.wp]; if (stepTo(e, w[0], w[1], N2.prowl)) T.wp = (T.wp + 1 + (Math.random() < .3 ? 1 : 0)) % WP2.length;
        return;
      }
      if (T.lost > 1.5 || T.ht > N2.huntMax) {
        T.m = 'prowl'; S.toast('它没追上来……又在屋里转悠了。');
        let bi = 0, bd = 1e9; WP2.forEach(([x, y], i) => { const d = Math.abs(x - ex) + Math.abs(y - ey); if (d < bd) { bd = d; bi = i; } }); T.wp = bi;
        return;
      }
      stepTo(e, p.x, p.y, T.fed ? N2.huntFed : N2.hunt); return;
    }
    if (T.m === 'toLure') {
      const L = S.ent(T.lure); if (!L || !L.s.k) { T.m = 'prowl'; return; }
      const [lx, ly] = tp(L); if (ex === lx && ey === ly) return engage(S, e, T, L, N2, 'ty2');
      stepTo(e, lx, ly, N2.prowl + .8); return;
    }
    if (T.m === 'lure') {
      const L = S.ent(T.lure);
      if (L && T.k === 'cermin' && !L.s.k) T.t = 0;
      if (T.t > 0) return;
      let far = WP2[0], fd = -1; for (const w of WP2) { const d = Math.abs(w[0] - p.x) + Math.abs(w[1] - p.y); if (d > fd) { fd = d; far = w; } }
      const nx = spend(S, e, T, 'crabR2', far);
      T.m = nx === 'go' ? 'prowl' : nx === 'home' ? 'home' : 'crab'; T.why = nx === 'home' ? 'guli' : '';
      return;
    }
    if (T.m === 'home') {
      if (stepTo(e, HOME2[0], HOME2[1], 3.4)) { T.m = 'rest'; T.t = T.why === 'bite' ? N2.rest : N2.dur.guli; e.s.mode = 'count'; }
      return;
    }
    if (T.m === 'crab') {
      const to = f.crabTo || HOME2; if (stepTo(e, to[0], to[1], 3.2)) { T.m = 'prowl'; T.wp = WP2.findIndex(w => w[0] === to[0] && w[1] === to[1]); if (T.wp < 0) T.wp = 0; }
    }
  }
  function bite2(S, T) {
    T.bites++; T.cd = 3; T.fed = 1;
    biteSnd(S); S.sfx('cut'); S.fx('red'); S.shake(400, 3);
    if (T.bites >= 2) { S.f.ph = 'n2x'; S.stop('ty2'); S.run(dead2); return; }
    T.m = 'home'; T.why = 'bite'; S.stop('ty2');
    S.run(async S => {
      await S.scare('face', { face: 'toyol', sfx: 'scream', dur: .8 });
      await S.narr('脚踝上一阵针扎似的疼。一张冰凉的小嘴贴在你的皮肤上，吸了一口——\n然后它松开嘴，舔了舔嘴角，咯咯笑着退回了厨房。');
      await S.think('……血。它要的是血。\n再让它咬一口，我就站不起来了。');
    });
  }
  async function dead2(S) {
    n2Fails++;
    await S.scare('face', { face: 'toyol', sfx: 'scream', dur: .9 });
    await S.die('它又一次咬住了你的脚踝，这一回，没有松口。\n冰凉的小嘴一下一下地吸着。你腿一软，坐倒在地板上，屋顶慢慢地转了起来。\n\n天亮以后，阿依莎在楼梯底下找到了你。你的脚踝上，有两排小小的牙印。\n\n（别在屋里跑；先用诱饵把它引到别处，再去拿纸、开盒子。被咬过一次以后，它会追得更快。）', '它饿了');
  }
  /* 它就在身后（追着你、或者贴着你转悠）的时候，腾不出手去开罐子、转木片 */
  function threat(S) {
    const T = S.f.T2, e = S.ent('ty2'); if (S.f.ph !== 'n2' || !T || !e) return false;
    const [ex, ey] = tp(e), d = pathLen(ex, ey, S.pl.x, S.pl.y, 4);
    return (T.m === 'hunt' && d <= 3) || ((T.m === 'prowl' || T.m === 'toLure') && d <= 2);
  }
  async function kalengOn(S) {
    if (S.f.ph !== 'n2' && S.f.ph !== 'n2got') return S.narr('一只饼干铁罐。');
    if (threat(S)) { S.toast('你刚伸出手——它已经扑到你脚边了！'); return bite2(S, S.f.T2); }
    if (S.once('kaleng')) await S.narr('灶台边一只蓝色的饼干铁罐。打开，里面没有饼干——只有一叠叠码好的硬币，和一张叠成小方块的纸。');
    S.f.readSurat = true;
    await S.note('surat');
  }
  async function piringOn(S) {
    await S.narr('厨房角落里铺着一块小草席，席上一只小碟子。碟子底干了一圈暗红色的东西。\n草席边上，硬币一摞一摞码得整整齐齐。每摞十个。');
  }
  async function cal2On(S) {
    await S.narr('「振兴号　敬赠」——是阿爸送的月份牌。\n三月那一页，每个礼拜四的日子底下，都点着一个小小的褐色圆点。六号有。今天，十三号，还没有。');
    await S.think('……礼拜四晚上，喂它。用自己的……');
  }
  async function petiOn(S) {
    const f = S.f;
    if (f.peti) return S.narr('木盒空了。盒底垫着一块黄布，布上有一圈瓶底压出来的印子。');
    if (threat(S)) { S.toast('你刚蹲下去——它已经扑到你脚边了！'); return bite2(S, f.T2); }
    if (S.once('peti0')) await S.narr('床边放着一个雕花小木盒，有饭盒那么大。盒盖上嵌着四块能转的小木片，每块都能转出四种图案：螃蟹、弹珠、镜子、绿豆。\n盒子里有什么东西，「咚」地敲了一下盖子。');
    if (!f.readSurat && S.once('peti1')) await S.think('顺序不对，肯定打不开。\nSeman 伯不像记得住这种东西的人——巫师应该给他留了说明。');
    const v = await S.keypad('盒盖上的四块木片，从左到右依次转成：\n（键盘 1 螃蟹　2 弹珠　3 镜子　4 绿豆）', ['螃蟹', '弹珠', '镜子', '绿豆'], 4, { sep: '·', alias: { 1: '螃蟹', 2: '弹珠', 3: '镜子', 4: '绿豆' } });
    if (v == null) return;
    if (v === '螃蟹·弹珠·镜子·绿豆') return petiOpen(S);
    f.pw = (f.pw || 0) + 1;
    rattle(S); S.shake(300, 2);
    const T = f.T2;
    if (T && (T.m === 'prowl' || T.m === 'rest')) { T.m = 'hunt'; T.ht = 0; T.lost = 0; T.pd = 0; T.why = ''; S.ent('ty2').s.mode = ''; S.bubble('ty2', '!', 800); }
    await S.narr('「咔哒」——四块木片自己转回了原样。盒子里的东西狠狠撞了一下盖子。\n厨房那边，有个小东西尖尖地笑了一声，光脚踩着地板，啪嗒、啪嗒。');
    let h = '';
    if (v === '绿豆·镜子·弹珠·螃蟹') h = '……这是它自己会按的顺序：最喜欢的放最前。巫师防的就是这个。';
    else if (f.pw === 2) h = '顺序……巫师的纸上写过怎么排；阿依莎的本子上记着它最放不下什么。（翻翻笔记）';
    else if (f.pw === 3) h = '纸上说：「和它的心思反过来」——最放不下的放最后，最容易丢下的放最前。\n本子上从久到短：绿豆、镜子、弹珠、螃蟹。';
    else if (f.pw >= 4) h = '反过来，就是：螃蟹、弹珠、镜子、绿豆。';
    if (h) await S.think(h);
    if (T && T.m === 'hunt') S.toast('它来了——躲开，或者丢个诱饵！');
  }
  async function petiOpen(S) {
    const f = S.f; f.peti = true; f.ph = 'n2o';
    const box0 = S.ent('peti'); box0.open = true; S.sfx('open');
    S.stop('ty2'); S.hide('crabR2');
    await S.narr('「咔」的一声，盒盖弹开了。\n黄布上躺着一只褐色的小玻璃瓶，瓶口扎着黄布，缠了七道红线。瓶子里有一小撮头发，还有什么东西在里面轻轻地、轻轻地敲着玻璃。');
    S.give('botol');
    for (let i = 1; i <= 6; i++) { const z = S.ent('r' + i); if (z.s.k === 'cermin') { S.give('cermin', true); z.s.k = ''; } }
    const e = S.ent('ty2'), p = S.pl;
    const c = [[p.x - 1, p.y], [p.x, p.y + 1], [p.x + 1, p.y], [p.x, p.y - 1]].find(([x, y]) => passable(curMap(), x, y, null)) || [p.x, p.y + 1];
    e.px = c[0] * TS; e.py = c[1] * TS; e.x = c[0]; e.y = c[1]; e.alpha = 0; e.hidden = false; e.s.mode = '';
    await S.narr('身后，啪嗒、啪嗒的脚步声停了。');
    S.face('ty2', 'pl'); S.turn(c[0] < p.x ? 1 : c[0] > p.x ? 2 : c[1] > p.y ? 0 : 3);
    await S.alpha('ty2', .8, 600);
    await S.narr('它就站在你旁边，仰着光溜溜的脑袋，看着你手里的瓶子。\n它没有扑过来。');
    e.s.mode = 'cry';
    await S.narr('两只黑洞洞的眼睛里，慢慢地渗出了水。');
    await S.think('巫师的纸上写着：谁拿着瓶子，它就跟着谁。');
    S.follow('ty2', true);
    f.ph = 'n2got';
    S.goal('带着瓶子下楼（后门楼梯），天亮前去下游的旧码头');
    S.cp('got');
  }
  async function leaveSeman(S) {
    const ph = S.f.ph;
    if (ph !== 'n2got') { await S.narr('瓶子还在屋里。'); return S.walk('pl', 'u', 5); }
    S.f.ph = 'dawn0';
    await S.fade(1, 900);
    await S.card('三月十四日　礼拜五', '凌晨六点', '你和阿依莎沿着河岸往下游走。\n谁都没有说话。\n它光着小脚跟在你身后，啪嗒，啪嗒。\n你停，它也停。');
    await S.go('sungai', 11, 1, 0, { ms: 500 });
  }

  /* ================= 天亮前：旧码头 ================= */
  async function dawnEnter(S) {
    S.f.ph = 'dawn';
    const t = S.ent('tyS'); t.px = 11 * TS; t.py = 0; t.hidden = false; S.follow('tyS', true);
    await S.narr('下游的旧码头。天边还是黑的，河面上浮着一层白雾。\n从前装锡砂上船的木板码头，一半已经塌进了水里。');
    await S.narr('码头前面亮着一盏煤油灯。拓婆、伊玛目，还有先跑过来报信的阿依莎，都在那里等着。');
    S.goal('去码头，和拓婆、伊玛目会合');
  }
  async function meetBank(S) {
    S.f.met = true;
    S.face('tokwanS', 'pl'); S.face('aisS', 'pl');
    await S.say('拓婆', ['让我看看……', '……七道红线。Seman 这个傻瓜。']);
    await S.say('伊玛目', ['孩子，我是来祈祷的。巫师那一套，我不懂，也不想懂。', '可是这个小东西……不管它被拿来做了什么，它本来是无辜的。']);
    const s = S.ent('semanS'); S.place('semanS', 21, 7, 1);
    await S.narr('橡胶园那边的小路上，有人跌跌撞撞地跑过来。');
    await S.walk('semanS', [15, 8], 4.2);
    S.face('semanS', 'pl');
    await S.say('Seman 伯', ['还给我……把瓶子还给我！'], { style: 'big' });
    await S.narr('他浑身是泥，大概是骑着摩托车连夜从怡保赶回来的。他喘着气，盯着你手里的瓶子。');
    await S.say('Seman 伯', ['Nurul 的手术费，四百块。医院说不先交钱，就排到下个月。', '矿关了，我能怎么办？我去北边找那个巫师。他说，养一个月就够了，一个月……', '每个礼拜四，我割开自己的手指头……']);
    await S.say('拓婆', 'Seman。你看看它。');
    S.face('semanS', 'tyS');
    await S.narr('Seman 伯低下头。它躲在你身后，攥着你的裤脚，只露出半个光溜溜的脑袋。');
    await S.say('Seman 伯', ['……它叫我 Abah。', '它第一次开口叫我 Abah 的时候，我就知道，我完了。']);
    await S.narr('他慢慢地跪在了泥地里。');
    await S.say('Seman 伯', '……拿去吧。我不要了。我不敢要了。');
    void s;
    S.f.ph = 'rit';
    S.goal('走到码头尽头，照巫师纸上第六条送它走');
    S.cp('rit');
  }
  async function tepiOn(S) {
    if (S.f.ph !== 'rit') return S.narr('码头的木板泡得发软。水在底下哗哗地流。');
    S.f.ph = 'rit2';
    azan(S); S.dark(.38); S.amb('river');
    await S.narr('东边的天，透出一点灰白。\n村子那边传来了晨礼的宣礼声（azan Subuh），拖得很长很长，飘在河上的雾里。');
    await S.say('伊玛目', '天亮了。……做吧，孩子。我在这里为它祈祷。');
    await S.narr('巫师的纸，第六条：「天亮的时候，在流动的水边，让它照一照镜子，还它一样孩子玩的东西，再打开瓶口。」');
    S.follow('tyS', false); S.ent('tyS').solid = false; S.place('tyS', S.pl.x === 10 ? 11 : 10, 11, 0);
    S.face('tyS', 'pl');
    if (S.has('cermin')) await S.ask('', ['把那面裂了角的镜子，举到它面前'], '阿明');
    else await S.ask('', ['让它低头看一看码头底下的水面'], '阿明');
    shimmer(S);
    await S.scare('face', { face: 'tysad', sfx: 'chime', dur: 1.8, shake: .5, shakeMs: 80 });
    await S.narr('它看着' + (S.has('cermin') ? '镜子里' : '水里') + '的自己，看了很久。\n里面不是一个青灰色的小怪物，是一个很小很小的孩子，蜷着身子，像还在睡觉——像从来没有醒过。');
    S.sfx('cry');
    await S.narr('它伸出手，摸了摸里面那张脸。\n然后它哭了。不是咯咯的笑，是一个婴儿那样细细的哭声。');
    const hasMata = S.has('mata');
    const r = await S.ask('「还它一样孩子玩的东西。」', hasMata ? ['把阿公留下的猫眼弹珠给它', '给它一颗普通的弹珠'] : ['给它一颗普通的弹珠'], '阿明');
    S.f.gaveMata = hasMata && r === 0;
    clink(S);
    if (S.f.gaveMata) { S.take('mata'); await S.narr('你把猫眼放进它的小手里。\n它把弹珠举起来，对着天边那一点光看，玻璃里的那道蓝，亮了一下。它不哭了。'); }
    else await S.narr('你把一颗磨花了的弹珠放进它的小手里。\n它攥着弹珠，翻来覆去地看。它不哭了。');
    await S.narr('瓶口的黄布已经松了。七道红线，一圈一圈缠在你的手指上。');
    await S.think('……振兴号的店租。阿爸红红的眼睛。\n「谁拿着瓶子，它就跟着谁。」');
    const c = await S.ask('它仰着头，等着你。', ['解开红线，打开瓶口，把瓶子放进流水里', '……把瓶子塞进书包', '把瓶子往石头上砸'], '阿明');
    if (c === 0) return endPulang(S);
    if (c === 1) return endSimpan(S);
    return endPecah(S);
  }
  async function endPulang(S) {
    S.take('botol');
    await S.narr('你解开最后一道红线，拔掉瓶口的黄布，蹲下来，把瓶子轻轻放进水里。');
    await S.narr('瓶子没有沉。它在水面上打了个转，慢慢地，往下游漂去。');
    await S.say('伊玛目', '（他闭上眼睛，低声念起了一段祈祷。你听不懂，可你知道，那是在为一个孩子祈祷。）', { style: 'whisper' });
    hum(S, .03);
    await S.narr('拓婆轻轻地哼起了一支摇篮曲。\nDodoi, dodoi sayang……');
    await S.narr('它站在码头的最边上，回头看了你一眼。' + (S.f.gaveMata ? '手里攥着那颗猫眼。' : '手里攥着那颗弹珠。') + '\n然后，它往前走了一步，走进了雾里。没有水花。');
    await S.alpha('tyS', 0, 1800);
    await S.narr('雾慢慢散了。太阳从橡胶园后面升起来，河面上一片金光。\nSeman 伯跪在泥地里，捂着脸，哭得像个孩子。');
    await S.fade(1, 1400);
    const ext = [];
    ext.push('那个礼拜，Seman 伯卖掉了电视机和摩托车，挨家挨户把钱还回去。还不上的，他在祈祷室门口一家一家地道歉。');
    ext.push(S.f.ramaT ? '村长提着一袋米，走进胶园的工寮，跟拉玛萨米坐着喝了一下午的茶。' : '拉玛萨米没过多久就搬走了。村长后来说，他一直想去跟人家道个歉，可是没找到机会。');
    ext.push('伊玛目在祈祷室门口放了一个新的捐款箱，给 Nurul 凑手术费。这一回，箱子没有上锁。');
    await S.card('1986年3月', '', ext.join('\n\n'));
    await S.end({ id: 'pulang', title: '第二十六夜　完', text: (S.f.gaveMata ? '你再也没见过那颗猫眼。\n只是那年雨季，坚打河涨水又退了以后，你在码头边的河滩上看见一串很小很小的脚印，从水里走上来，在你从前蹲过的地方转了一圈，又走回了水里。\n脚印中间的沙子上，压着一个小小的圆坑，像有人在那里放过一颗弹珠，看了很久，又拿走了。' : '后来你常常想起那颗磨花了的弹珠。\n要是那天给它的是猫眼，它会不会多回头看一眼？') + '\n\n锡价再也没有回到从前。\n坚打谷的矿湖还是那么绿，绿得不像真的。\n村里的钱，再也没有少过一半。' });
  }
  async function endSimpan(S) {
    await S.narr('你把瓶子塞进书包，拉上拉链。');
    await S.say('拓婆', '阿明……', { style: 'whisper' });
    await S.narr('它不哭了。\n它走过来，站在你脚边，仰起头看着你，像一只认了新主人的小狗。');
    await S.narr('Seman 伯抬起头，看着你，脸上的表情说不清是可怜，还是松了一口气。');
    await S.say('Seman 伯', '……礼拜四晚上。别忘了。', { style: 'whisper' });
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'simpan', title: '留下的瓶子', text: '那年年底，振兴号的生意突然好了起来。\n阿爸说，是人心又活了。他在门口挂了一块新招牌。\n\n村里的钱，还是会少。一半，一半。\n大家都说，鬼仔一定是跟着 Seman 搬走了。\n\n只有你知道，每个礼拜四晚上，你都要关上房门，打开书包里那只褐色的小瓶子……\n\n从那以后，你左手的食指上，总缠着一圈胶布。' });
  }
  async function endPecah(S) {
    await S.narr('你举起瓶子，狠狠地砸在那块黑石头上。');
    S.sfx('glass'); S.shake(500, 3); S.fx('flash');
    await S.narr('玻璃碎了一地。一缕灰白的烟从碎片里冒出来，在雾里打了个转，散了。');
    await S.say('拓婆', '纸上写着……不能砸的啊。', { style: 'whisper' });
    await S.narr('它站在碎玻璃中间，低头看着。\n它没有哭，也没有笑。它只是……不知道该去哪儿了。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'pecah', title: '碎掉的瓶子', text: '从那以后，村里再也没有丢过钱。\n\n可是每天早上你醒过来，床边的地上都撒着一把绿豆，一颗一颗，排得整整齐齐。\n有时候是三十七颗，有时候是一百零三颗。\n\n它没有家了。它只认得你。\n\n它每天晚上都在数，好像只要数对了，就能数回它原来的地方去。' });
  }
})();
