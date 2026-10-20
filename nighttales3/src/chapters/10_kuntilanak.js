/* ================= 第十夜 · 坤蒂拉娜 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];

  /* ---------- 笑声：听起来的远近，和她真正的远近是反的 ----------
     sounds === 'near'：又响又亮（她其实很远）；sounds === 'far'：又轻又闷（她其实就在身边） */
  function laugh(S, sounds) {
    const N = [1320, 1180, 1400, 1240, 1460, 1200];
    if (sounds === 'near') N.forEach((f, i) => S.tone('triangle', f, f * .82, .11, .085, i * .12, 5200));
    else N.slice(0, 5).forEach((f, i) => S.tone('triangle', f * .9, f * .72, .16, .016, .15 + i * .19, 900));
  }
  const LOUD = ['嘻嘻嘻嘻嘻！（又响又尖——就在耳边！）', '嘻嘻嘻……嘻嘻！（近得像贴着你的耳朵）', '哈哈……嘻嘻嘻嘻！（响得刺耳！）'];
  const SOFT = ['……嘻……嘻嘻……（很轻，很远，像隔着一整片林子）', '……嘻嘻……（远远的，几乎听不见）', '……嘻……（轻得像风吹过树叶）'];
  const SMELL = ['一股鸡蛋花的香味，浓得发甜。', '鸡蛋花的香味，就在鼻子底下。', '甜腻的花香，一下子涌了过来。'];

  /* 坤蒂拉娜：白衣、长发盖脸，衣摆脏了、破了；bundle = 怀里抱着一个白布襁褓 */
  function kuntiExtra(bundle) {
    return function (g, d, fr, G, R) {
      if (d === 0) {
        R(3, G.tT, 1, 9, '#0c0909'); R(12, G.tT, 1, 10, '#0c0909'); R(4, G.tT + 1, 1, 5, '#0c0909');
        R(4, G.lB - 1, 1, 2, '#8a847a'); R(8, G.lB, 2, 1, '#8a847a'); R(11, G.lB - 2, 1, 2, '#7a746a');
        if (bundle) { R(4, G.tT + 4, 8, 4, '#ecebe2'); R(5, G.tT + 4, 3, 3, '#d8b090'); R(4, G.tT + 7, 8, 1, '#c8c4b8'); }
      } else if (d === 3) { R(3, G.hT + 2, 10, G.tB - G.hT + 1, '#0c0909'); R(5, G.tB + 1, 6, 3, '#0c0909'); }
      else { R(9, G.hT + 3, 4, G.tB - G.hT, '#0c0909'); if (bundle) { R(2, G.tT + 4, 5, 4, '#ecebe2'); R(2, G.tT + 4, 2, 2, '#d8b090'); } }
    };
  }
  function sitiExtra(bundle) {
    return function (g, d, fr, G, R) {
      if (d === 0) {
        R(3, G.tT, 1, 7, '#100c0c'); R(12, G.tT, 1, 7, '#100c0c');
        R(5, G.tT + 2, 6, 1, '#e8dcc0'); R(7, G.hT - 1, 2, 1, '#f4f0f0'); R(6, G.hT - 1, 1, 1, '#f0e0a0');   // 鬓边一朵鸡蛋花
        if (bundle) { R(4, G.tT + 4, 8, 4, '#ecebe2'); R(5, G.tT + 4, 3, 3, '#d8b090'); }
      } else if (d === 1) { R(9, G.hT + 3, 3, 8, '#100c0c'); if (bundle) R(2, G.tT + 4, 5, 4, '#ecebe2'); }
    };
  }
  const K = { skin: '#e4e0da', hair: '#0a0808', hs: 'long', cover: true, redEye: true, ghost: true, dress: true, top: '#ecebe4' };
  const SI = { skin: '#e2c09c', hair: '#100c0c', hs: 'long', ghost: true, dress: true, top: '#f4f0e6', top2: '#e8dcc0', mouth: '#b06060', blush: '#e8a8a0', eye: '#1a1010' };
  const GLOW = { r: 2.2, col: 'rgba(220,230,220,.14)' };

  const caughtK = async S => {
    S.sfx('laugh');
    await S.scare('face', { spr: '@kunti', face: 'kunti', sfx: 'scream' });
    await S.die('鸡蛋花的香味一下子变成了腐臭。\n一只冰凉的手从背后搭上你的后脖子，指甲又长又弯。\n耳边，那个笑声轻得像是从很远很远的地方传来——', '她就在你身边');
  };

  defChapter({
    id: 'kuntilanak', n: 10, title: '坤蒂拉娜', sub: '停电的雨夜，鸡蛋花香。笑声听着越远，她就离你越近。', origin: '印度尼西亚 / 马来民间传说', color: '#22302a',
    icon: '@kunti', amb: 'night', floor: 'dirt', wall: 'wood', dark: .78, plr: 3,
    thumb(g, w, h) {
      const fl = (x, y, s) => { g.fillStyle = '#f4f0e4'; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.fillRect(x + Math.cos(a) * s * 1.6 - s / 2, y + Math.sin(a) * s * 1.6 - s / 2, s, s); } g.fillStyle = '#f0c850'; g.fillRect(x - s / 2, y - s / 2, s, s); };
      g.fillStyle = '#0e1612'; g.fillRect(0, 10, w * .55, 6); g.fillRect(w * .3, 0, 5, 16);
      fl(w * .12, 14, 3); fl(w * .3, 22, 3); fl(w * .5, 12, 3); fl(w * .82, h * .55, 2); fl(w * .2, h * .62, 2);
    },
    endings: { subuh: '晨礼的呼唤', far: '很远很远的笑声', paku: '后颈上的铁钉' },
    people: {
      me: { skin: '#d8b08a', hair: '#1a1414', hs: 'bob', top: '#3a5a8a', top2: '#e0e0e0', bottom: '#2a3040', shoes: '#e0e0e0' },
      nenek: { key: 'kt-nenek', skin: '#b88a62', hair: '#d8d8d8', hs: 'bun', hat: 'scarf', hatC: '#ece8dc', top: '#6a4a7a', top2: '#ece8dc', bottom: '#5a3a2a', skirt: true, shoes: '#3a2a1a',
        extra(g, d, fr, G, R) { if (d !== 3) { R(4, G.tB + 1, 1, 1, '#c8a050'); R(7, G.tB + 2, 1, 1, '#c8a050'); R(10, G.tB + 1, 1, 1, '#c8a050'); } } },
      ratna: { key: 'kt-ratna', skin: '#c89a72', hair: '#120e0e', hs: 'long', top: '#c86a5a', top2: '#e8d8c8', bottom: '#4a5a3a', skirt: true, shoes: '#3a2a1a',
        extra(g, d, fr, G, R) { if (d !== 3) { R(5, G.tB + 1, 1, 1, '#c8b060'); R(9, G.tB + 2, 1, 1, '#c8b060'); } } },
      ahpek: { key: 'kt-ahpek', skin: '#e0b890', hair: '#bdbdb8', hs: 'bald', top: '#eeeeea', top2: '#d8d8d4', bottom: '#3a3a4a', shoes: '#4a3a2a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#555'); R(9, G.hT + 4, 2, 1, '#555'); R(7, G.hT + 4, 2, 1, '#777'); } else if (d === 1) R(4, G.hT + 4, 3, 1, '#555'); } },
      ustaz: { key: 'kt-ustaz', skin: '#b88a62', hair: '#1a1414', hs: 'short', top: '#f0f0ea', top2: '#d8d8d0', bottom: '#3a4a5a', skirt: true, shoes: '#2a2a2a',
        extra(g, d, fr, G, R) { R(4, G.hT - 2, 8, 3, '#141418'); if (d === 0) { R(6, G.hT + 7, 4, 2, '#2a2020'); R(7, G.tT + 1, 2, 1, '#c8c8c0'); } else if (d === 1) R(4, G.hT + 7, 3, 2, '#2a2020'); } },
      darto: { skin: '#a87a52', hair: '#2a2020', hs: 'short', hat: 'straw', hatC: '#c0a060', top: '#5a6a7a', top2: '#4a5a6a', bottom: '#3a3a3a', shoes: '#3a3020' },
      kunti: Object.assign({ key: 'kt-kunti', extra: kuntiExtra(false) }, K),
      kunti_b: Object.assign({ key: 'kt-kunti-b', big: true, extra: kuntiExtra(true) }, K),
      kunti_big: Object.assign({ key: 'kt-kunti-big', big: true, extra: kuntiExtra(false) }, K),
      siti_b: Object.assign({ key: 'kt-siti-b', big: true, extra: sitiExtra(true) }, SI),
      siti_n: Object.assign({ key: 'kt-siti-n', big: true, extra: sitiExtra(false) }, SI),
      nenek_l: { key: 'kt-nenek-l', skin: '#b88a62', hair: '#d8d8d8', hs: 'bun', hat: 'scarf', hatC: '#ece8dc', top: '#6a4a7a', top2: '#ece8dc', bottom: '#5a3a2a', skirt: true, shoes: '#3a2a1a',
        extra(g, d, fr, G, R) { if (d === 0) { R(11, G.tT + 3, 3, 4, '#e8a050'); R(12, G.tT + 2, 1, 1, '#fff0a0'); } } }
    },
    faces: {
      kunti(R, a, t) {
        R(0, 0, 32, 32, '#050404'); R(3, 0, 26, 32, '#0c0909');
        R(9, 6, 14, 20, '#dcd6cc'); R(10, 5, 12, 1, '#dcd6cc'); R(10, 26, 12, 2, '#cec8be');
        R(9, 6, 2, 20, '#b6aea4'); R(21, 6, 2, 20, '#b6aea4');
        R(8, 3, 16, 5, '#0c0909'); R(9, 8, 2, 13, '#0c0909'); R(12, 8, 1, 4, '#0c0909'); R(19, 8, 1, 15, '#0c0909'); R(21, 8, 2, 19, '#0c0909'); R(15, 7, 1, 3, '#0c0909');
        R(12, 12, 4, 3, '#2a1212'); R(17, 12, 4, 3, '#2a1212');
        const bl = Math.sin(t * 7) > .93 ? 0 : 1;
        if (bl) { R(13, 13, 2, 1, '#ff3a30'); R(18, 13, 2, 1, '#ff3a30'); }
        R(12, 17, 1, 2, '#9a8f84'); R(20, 17, 1, 2, '#9a8f84');
        const o = Math.min(5, 1 + Math.floor(a * 8));
        R(11, 21, 11, o, '#1a0606'); R(10, 20, 1, 1, '#1a0606'); R(22, 20, 1, 1, '#1a0606');
        for (let i = 0; i < 5; i++) { R(12 + i * 2, 21, 1, 1, '#e8e4d8'); if (o > 2) R(12 + i * 2, 20 + o, 1, 1, '#e8e4d8'); }
      },
      siti(R, a, t) {
        R(0, 0, 32, 32, '#0a0c0a'); R(5, 1, 22, 31, '#100c0c');
        R(9, 6, 14, 19, '#e2c09c'); R(10, 5, 12, 1, '#e2c09c'); R(11, 25, 10, 2, '#d6b490');
        R(8, 3, 16, 4, '#100c0c'); R(9, 7, 1, 10, '#100c0c'); R(22, 7, 1, 12, '#100c0c');
        R(12, 13, 3, 2, '#1a1010'); R(18, 13, 3, 2, '#1a1010'); R(12, 12, 3, 1, '#3a2a20'); R(18, 12, 3, 1, '#3a2a20');
        R(11, 17, 2, 1, '#e8a8a0'); R(20, 17, 2, 1, '#e8a8a0'); R(14, 21, 4, 1, '#b06060');
        R(7, 4, 3, 3, '#f8f4ee'); R(8, 5, 1, 1, '#f0d060');
      }
    },
    items: {
      minyak: { name: '一瓶煤油', desc: '阿伯装在旧芬达瓶子里的煤油（minyak tanah），瓶口塞着一团报纸。' },
      bedung: { name: '发黄的襁褓', desc: '一块洗得发软的白布，边上用褪色的红线绣着一圈小小的鸡蛋花。是外婆刚出生时裹过的。' },
      paku: { name: '生锈的长铁钉', desc: '一根手指那么长的铁钉，钉帽是方的。外婆说，这是养大她的 Mak Long 留下来的。' },
      bayi: { name: '表姐的孩子', desc: '小小的，软软的，裹在一块旧白布里，睡得很沉。' }
    },
    notes: {
      kota: { title: '剪报 · 华文报纸副刊《坤甸地名小考》', text: '（阿伯用图钉钉在柜台后面的一块剪报，纸已经黄透了。）\n\n……关于「坤甸」一名的来历，城中老人多有一说：\n\n一七七一年，阿尔卡德里家族的谢里夫·阿卜杜拉赫曼带着船队溯卡普阿斯河而上，来到它与兰达克河交汇的河口。夜里，岸边的密林中笑声、哭声不绝，船上的人都说是 Kuntilanak（马来人称 Pontianak）。\n\n据说，他下令朝林子开炮，一连轰了几天几夜，鬼声才止。炮弹落下的地方，后来建起了清真寺与王宫，城便以她为名。\n\n今日每逢开斋节，两岸仍有燃放「电石竹炮」（meriam karbit）之俗，声震全城。老一辈说，一半是庆贺，一半是「吓她」。\n\n——当然，地名学者另有考证，此处姑且一记。' },
      surat: { title: '一封爪夷文的旧信', text: '（信是用爪夷文——阿拉伯字母拼的马来语——写的。外婆年轻时请人念过，在行间用铅笔注了罗马字。下面是你一边看一边翻出来的意思。）\n\n阿米娜，我的孩子：\n\n等你长大，认得字了，再看这封信。\n\n生你的那个人，不是我。她叫西蒂，是河上游一个渔夫的女儿，十七岁嫁到这间高脚屋里。你出生的那天晚上下着大雨，她流了很多血，接生婆说是孩子横着。你生下来的时候不哭，一声都不哭。她一直问：「她怎么不哭？她怎么不哭？」问着问着，就不问了。\n\n后来我抱着你走到门口，雨里，你才「哇」地哭出来。她没有听见。\n\n她怀着你的时候，天天坐在窗边唱一支歌：「Tidurlah, tidurlah, anakku sayang」。我就一直唱给你听。\n\n我们把她埋在村北老坟场的大木棉树底下。那年穷，没钱请人刻字，碑就是一块扁扁的河石——女人的碑。我在她头那边种了一棵白鸡蛋花，好让我找得到。\n\n这些年，每到雨季的夜里，我都闻得到鸡蛋花香。\n我不怕她。我只怕，她一直在找一个哭声。\n\n——Mak Long' },
      papan: { title: '割胶工棚里的木板', text: '（钉在割胶棚门口的一块木板，用印尼文写的，字是用烧过的木炭描的，一遍一遍描得很粗。）\n\n割胶的兄弟们注意：\n\n一、凌晨四点以前，不要一个人进园。\n二、听见女人笑，不要抬头看树。\n三、笑声很响、就在耳边——没事，她还远，快走。\n四、笑声很轻、远远的——站住，别动，别出声。她就在你旁边。\n五、闻到鸡蛋花香，屏住气；香味变成臭味——跑。\n六、爪哇来的阿迪说，他们那边还有一种，叫 Sundel Bolong，背后有个大洞，用长头发遮着。看见背上有洞的女人，别跟她走。\n\n（木板最底下，有人用小刀刻了一道一道的竖线，像是在数日子。刻到第十七道，就没有了。）' },
      daftar: { title: '祈祷室的旧登记簿（1932年）', text: '（一本用布包着的厚本子，纸页脆得一碰就掉渣。哈桑老师说，这是他爷爷那一辈的伊玛目记的。他替你翻到了那一页。）\n\n伊斯兰历一三五一年，雨季。\n\n西蒂，渔夫之女，年十七。分娩时去世。\n孩子（女）存活，由邻家 Mak Long 抚养，取名阿米娜。\n亡者已洗净、裹布、礼拜，安葬于老坟场大木棉树的西边，头北脚南，面向天房。\n未立名碑。\n\n（下面另有一行小字，墨色新一些：）\n分娩时去世的妇女是殉道者（syahid）。愿真主怜悯她，赐她安宁。\n——可是村里人都说，她夜里还在。' }
    },
    legend: '坤蒂拉娜（Kuntilanak），马来半岛和新加坡一带多叫庞蒂雅娜（Pontianak），是印度尼西亚、马来西亚等地流传最广的女鬼。通常的说法是：她生前是一个死于难产、或怀着孩子死去的女人，死后穿着白衣、披着一头长发，夜里栖在大树上——榕树、木棉、鸡蛋花树。她出现之前，人们会先闻到一阵鸡蛋花（frangipani，印尼人叫 kemboja，常种在坟场里）的香味，香味随后变成腐臭；她会发出婴儿似的哭声，或者尖细的笑声。最著名的一条规矩是：笑声听起来很远，她其实就在身边；听起来很近，她反而还远。\n\n关于名字，有一种民间说法把 pontianak 解释成「死于分娩的女人」（perempuan mati beranak）的缩略，学界并不都认同；二十世纪初英国殖民官员记录的马来民俗里，pontianak 有时指的是死产的婴儿，而难产而死的母亲另有名字，叫「兰苏尔」（langsuir）。各地版本差异很大：马来西亚的版本里她指甲尖长、会剖人肚腹；印尼的版本更多是吓人、盯上孕妇和新生儿；爪哇还有背上有个大洞的「孙德尔·波隆」（Sundel Bolong）。流传很广的一条说法是：把一根钉子钉进她的后颈，她就会变回一个美丽的女人，甚至能嫁人生子；钉子一拔出来，她又变回原形。民间常让孕妇和婴儿身边带着剪刀、钉子之类的铁器护身。\n\n西加里曼丹的坤甸（Pontianak）城名据说就来自她：一七七一年，谢里夫·阿卜杜拉赫曼·阿尔卡德里在卡普阿斯河与兰达克河的交汇处建城，传说他曾开炮驱赶在那里作祟的坤蒂拉娜，炮弹落处建起了清真寺和王宫。直到今天，坤甸人在开斋节沿河燃放「电石竹炮」（meriam karbit）的习俗仍很有名。另一方面，伊斯兰教的不少学者认为，因分娩而去世的妇女是殉道者（syahid），在真主那里享有尊荣——坤蒂拉娜是民间故事，并不是宗教信仰的一部分。1957 年的马来亚电影《庞蒂雅娜》之后，她成了东南亚恐怖片里最常见的面孔之一。\n\n（本章的甘榜、人物、西蒂与阿米娜的身世、那封信、那支摇篮曲，以及不用钉子、而是在晨礼的呼唤里让她安息的结局，均为游戏虚构。）',
    start: { map: 'rumah', x: 7, y: 8, dir: 3 },
    async intro(S) {
      await S.card('第十夜　坤蒂拉娜', '1997年11月　印度尼西亚 西加里曼丹　坤甸城外的河边甘榜', '坤甸（Pontianak）这座城的名字，\n据说来自一个女鬼。\n\n外婆住的甘榜在卡普阿斯河的一条支流边上，\n高脚木屋一排一排地踩在水上。\n雨季的晚上，停电是常事。\n\n外婆说，停电的晚上，\n要是闻到鸡蛋花的香味——\n就别回头。');
    },
    resume: {
      kebun: async S => { resetK(S); },
      makam: async S => { if (S.f.phase === 'wait') { S.f.still = 0; S.f.wt = 1; } }
    },
    tick(S, dt) {
      if (W.busy) return;
      if (S.f.phase === 'taken' || S.f.phase === 'night') {
        if (S.map === 'kampung') { S.f._dog = (S.f._dog ?? 2) - dt; if (S.f._dog <= 0) { S.f._dog = 9 + Math.random() * 4; howl(S); } }
      }
    },
    tiles: {
      karet: { solid: true, paint(R, X, Y, o) {   // 橡胶树：细长的灰树干，斜着一道道割口，挂着接胶的椰壳碗
        speck(R, '#2a2418', ['#33291c', '#221c14', '#2e3a22'], X, Y, 14, 41);
        R(6, 0, 4, 16, '#5e5a52'); R(6, 0, 1, 16, '#77736a'); R(9, 0, 1, 16, '#46423c');
        for (let i = 0; i < 3; i++) R(6, 5 + i * 2, 4, 1, '#c8c0a8');
        R(5, 11, 6, 2, '#5a3a22'); R(6, 11, 4, 1, '#e8e4d8');
        R(3, 14, 10, 2, '#1a160e');
      } },
      papan: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#1b2c34'); R(1, 0, 14, 16, '#5a4430'); for (let y = 0; y < 16; y += 4) R(1, y + 3, 14, 1, '#3a2a1e'); R(1, 0, 1, 16, '#4a3624'); R(14, 0, 1, 16, '#4a3624'); if (hash(X, Y, 5) < .4) R(4, 6, 3, 1, '#2a1e14'); } },
      tikar: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#a08a58'); for (let y = 0; y < 16; y += 2) R(0, y, 16, 1, (y / 2 + X) % 2 ? '#b09a66' : '#94804e'); for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, 'rgba(70,50,20,.25)'); if (X % 3 === 0) R(0, 0, 1, 16, '#6a2a2a'); } },
      lantai: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#6a5038'); for (let r = 0; r < 4; r++) { R(0, r * 4 + 3, 16, 1, '#2a1c12'); if (hash(X, Y * 4 + r, 3) < .5) R(((hash(X, Y, r) * 14) | 0), r * 4, 1, 3, '#4a3624'); } R(0, 15, 16, 1, '#120a06'); } }
    },
    sprites: {
      pelita(g, e, t, R) {   // 煤油小灯
        R(5, 9, 6, 5, '#7a7a70'); R(4, 13, 8, 2, '#5a5a52'); R(6, 8, 4, 1, '#9a9a90'); R(7, 6, 2, 2, '#3a3a34');
        if (!e.off) { const f = Math.sin(t * 15 + e.px) > 0 ? 1 : 0, b = e.big ? 2 : 0; R(7, 3 + f - b, 2, 3 - f + b, '#ffcf5a'); R(7, 2 + f - b, 1, 1, '#ff8a2a'); }
      },
      buaian(g, e, t, R) {   // 马来吊床摇篮：从房梁上用弹簧吊下来的布兜
        const s = Math.round(Math.sin(t * 1.6) * (e.empty ? 0 : 1));
        R(7, -18, 2, 10, '#5a5a52'); for (let i = 0; i < 4; i++) R(6, -14 + i * 2, 4, 1, '#7a7a70');
        R(3 + s, -8, 10, 1, '#4a3420');
        R(2 + s, -7, 12, 13, '#b8506a'); R(3 + s, -6, 10, 11, '#d0708a'); R(2 + s, -7, 12, 2, '#e8c860');
        if (!e.empty) { R(5 + s, -5, 6, 4, '#ecebe2'); R(6 + s, -5, 3, 3, '#d8b090'); }
        else { R(5 + s, -5, 6, 4, '#6a2a3a'); }
        R(4, 13, 8, 1, 'rgba(0,0,0,.25)');
      },
      khat(g, e, t, R) {   // 阿拉伯书法挂框
        box(R, 1, 1, 14, 11, '#6a4a22'); R(2, 2, 12, 9, '#1e3a2a');
        R(4, 5, 7, 1, '#d8b860'); R(10, 3, 1, 3, '#d8b860'); R(5, 7, 5, 1, '#d8b860'); R(4, 3, 1, 3, '#d8b860'); R(7, 4, 1, 1, '#d8b860'); R(12, 7, 1, 2, '#d8b860'); R(6, 9, 2, 1, '#d8b860');
      },
      almari(g, e, t, R) {   // 老柚木衣柜
        box(R, 0, -12, 16, 27, '#5a3a22'); R(1, -12, 14, 2, '#7a5232'); R(7, -9, 2, 23, '#3a2414');
        R(5, 0, 1, 3, '#c9a35a'); R(10, 0, 1, 3, '#c9a35a');
        if (e.open) { R(1, -9, 6, 23, '#140c08'); R(2, 2, 4, 3, '#8a8a80'); R(2, 2, 4, 1, '#b0b0a4'); }
      },
      tempayan(g, e, t, R) { R(3, 4, 10, 10, '#7a4a2a'); R(2, 6, 12, 6, '#8a5432'); R(4, 2, 8, 2, '#6a3a20'); R(5, 2, 6, 1, '#1a2a30'); R(4, 7, 3, 3, '#a06a42'); R(3, 14, 10, 1, '#3a2014'); },
      jerigen(g, e, t, R) { box(R, 4, 4, 9, 10, '#3a6a9a'); R(5, 5, 7, 2, '#5a8aba'); R(9, 2, 3, 3, '#2a4a6a'); R(6, 9, 5, 1, '#2a4a6a'); },
      kemboja(g, e, t, R) {   // 鸡蛋花树（印尼坟场常种的树）；col:'r' 开红花
        const fl = e.col === 'r' ? '#d8506a' : '#f4f0e4', cen = e.col === 'r' ? '#f0a0b0' : '#f0c850';
        R(7, 2, 2, 13, '#7a7268'); R(4, -4, 2, 8, '#7a7268'); R(10, -6, 2, 9, '#7a7268'); R(5, 2, 3, 2, '#7a7268'); R(9, 1, 2, 2, '#7a7268'); R(7, -2, 2, 5, '#6a625a');
        for (const [x, y] of [[2, -9], [8, -12], [11, -10], [5, -7]]) { R(x, y, 5, 4, '#1e3a24'); R(x + 1, y - 1, 3, 1, '#2a4a2e'); }
        for (const [x, y] of [[3, -9], [9, -12], [12, -9], [6, -6], [4, -10]]) { R(x, y, 2, 2, fl); R(x, y, 1, 1, cen); }
        R(4, 14, 9, 2, 'rgba(0,0,0,.3)');
      },
      kapuk(g, e, t, R) {   // 大木棉树：板状根，灰白的树干，树冠遮住半边天
        R(18, -6, 12, 38, '#6e6a62'); R(18, -6, 3, 38, '#8a867c'); R(27, -6, 3, 38, '#55514a');
        R(10, 22, 10, 8, '#6e6a62'); R(28, 22, 10, 8, '#6e6a62'); R(14, 18, 6, 6, '#6e6a62'); R(28, 18, 6, 6, '#5e5a52');
        R(6, 28, 36, 4, '#2a241c');
        R(10, -8, 28, 3, '#5e5a52'); R(4, -14, 10, 3, '#5e5a52'); R(34, -16, 10, 3, '#5e5a52');
        for (const [x, y, w, h] of [[-6, -40, 26, 18], [14, -48, 28, 22], [32, -38, 22, 18], [-2, -26, 18, 12], [34, -24, 18, 10]]) { R(x, y, w, h, '#14221a'); R(x + 2, y + 1, w - 6, 3, '#1e3024'); }
        for (let i = 0; i < 7; i++) R(((hash(i, 2, 7) * 50) | 0) - 4, -44 + ((hash(i, 3, 7) * 26) | 0), 2, 2, '#c8c4b8');
      },
      kubur(g, e, t, R) {   // 马来老坟：两块墓碑（头一块大、脚一块小）；flat=扁碑（女人），否则圆柱碑（男人）
        R(2, 9, 12, 20, '#3a3226'); R(3, 10, 10, 18, '#4a4030'); R(3, 10, 10, 1, '#5a5038');
        for (let i = 0; i < 4; i++) R(3 + ((hash(e.x, e.y, i) * 9) | 0), 12 + ((hash(e.y, e.x, i) * 14) | 0), 1, 2, '#2c4428');
        const st = e.old ? '#6a6e64' : '#8a8a80', sd = shade(st, -.3);
        if (e.flat) { R(4, -1, 8, 12, st); R(3, 1, 1, 6, st); R(12, 1, 1, 6, st); R(5, -2, 6, 1, st); R(4, 9, 8, 2, sd); }
        else { R(6, -3, 4, 14, st); R(5, -1, 6, 10, st); R(7, -4, 2, 1, st); R(5, 9, 6, 2, sd); }
        if (e.text) { R(6, 2, 4, 1, '#2a2a24'); R(6, 4, 4, 1, '#2a2a24'); R(7, 6, 2, 1, '#2a2a24'); }
        if (e.old) { R(4, 3, 2, 3, '#3a5a34'); R(9, 6, 2, 2, '#3a5a34'); }
        if (e.flat) { R(6, 25, 4, 5, st); R(5, 26, 1, 3, st); R(10, 26, 1, 3, st); } else R(7, 24, 2, 6, st);
        if (e.covered) { R(4, 13, 8, 8, '#ecebe2'); R(4, 13, 8, 1, '#c84a4a'); for (let i = 0; i < 4; i++) R(5 + i * 2, 20, 1, 1, '#c84a4a'); }
        if (e.flowers) for (let i = 0; i < 6; i++) { const x = 3 + ((hash(e.x, i, 9) * 9) | 0), y = 11 + ((hash(i, e.y, 9) * 14) | 0); R(x, y, 2, 2, '#f4f0e4'); R(x, y, 1, 1, '#f0c850'); }
      },
      bunga(g, e, t, R) { for (let i = 0; i < 3; i++) { const x = 2 + ((hash(e.x, e.y, i) * 10) | 0), y = 3 + ((hash(e.y, e.x, i + 4) * 10) | 0); R(x, y, 3, 1, '#f4f0e4'); R(x + 1, y - 1, 1, 3, '#f4f0e4'); R(x + 1, y, 1, 1, '#f0c850'); } },
      meriam(g, e, t, R) {   // 电石竹炮：一截掏空的大木头，用藤条箍着
        R(0, 6, 32, 8, '#5a4028'); R(0, 6, 32, 2, '#7a5838'); R(0, 13, 32, 1, '#3a2818');
        for (const x of [5, 13, 21]) R(x, 5, 2, 10, '#8a7040');
        R(28, 7, 4, 6, '#140c08'); R(3, 14, 3, 2, '#3a2a1a'); R(24, 14, 3, 2, '#3a2a1a');
      },
      anjing(g, e, t, R) {
        const c = '#8a6a42', ear = Math.sin(t * 2) > .8 ? 1 : 0;
        R(3, 9, 9, 5, c); R(10, 6, 5, 5, c); R(10, 5 - ear, 2, 2, '#5a4428'); R(13, 8, 1, 1, '#111'); R(14, 9, 1, 1, '#222'); R(1, 10, 3, 1, c); R(4, 13, 2, 2, c); R(9, 13, 2, 2, c);
      },
      sampan(g, e, t, R) { const b = Math.sin(t * 1.4) > 0 ? 1 : 0; R(0, 6 + b, 32, 7, '#4a3220'); R(2, 7 + b, 28, 4, '#2a1c12'); R(14, 3 + b, 1, 5, '#6a5040'); R(3, 9 + b, 6, 1, '#5a4230'); R(0, 13, 32, 1, 'rgba(160,190,210,.25)'); },
      mihrab(g, e, t, R) {   // 墙上的壁龛，指向天房（kiblat）
        R(1, -6, 14, 21, '#2e4a3a'); R(3, -3, 10, 18, '#1a2a22'); R(5, -5, 6, 2, '#2e4a3a'); R(4, -4, 8, 1, '#c9a35a'); R(3, -3, 1, 18, '#c9a35a'); R(12, -3, 1, 18, '#c9a35a');
      },
      bedug(g, e, t, R) { R(2, 10, 2, 5, '#4a3020'); R(12, 10, 2, 5, '#4a3020'); R(0, 0, 16, 11, '#7a4a2a'); R(1, 1, 3, 9, '#d8c8a0'); R(0, 0, 16, 1, '#5a3418'); R(0, 10, 16, 1, '#5a3418'); for (let x = 5; x < 15; x += 3) R(x, 0, 1, 11, '#c9a35a'); },
      rehal(g, e, t, R) { R(3, 8, 10, 2, '#6a4a2a'); R(4, 10, 2, 4, '#5a3a22'); R(10, 10, 2, 4, '#5a3a22'); R(4, 4, 8, 5, '#2a6a4a'); R(4, 4, 8, 1, '#c9a35a'); },
      pondok(g, e, t, R) {   // 割胶工的小棚
        R(1, -2, 2, 17, '#4a3420'); R(29, -2, 2, 17, '#4a3420'); R(3, 4, 26, 10, '#3a2a1a');
        R(-2, -10, 36, 9, '#6a5a32'); for (let x = -2; x < 34; x += 3) R(x, -10, 1, 9, '#55471f'); R(-2, -2, 36, 1, '#3a2e14');
        box(R, 5, 6, 12, 7, '#5a4430'); R(7, 8, 8, 3, '#e8e0c8'); R(8, 9, 5, 1, '#6a6050');
        R(21, 9, 5, 5, '#5a3a22'); R(22, 8, 3, 1, '#e8e4d8');
      },
      kain(g, e, t, R) { const s = Math.sin(t * 2.4 + e.x) > 0 ? 1 : 0; R(5, 1, 6, 1, '#e8e6de'); R(5, 2, 5, 6 + s, '#ecebe4'); R(6, 8 + s, 3, 3, '#d8d6ce'); },
      kentongan(g, e, t, R) { R(7, -8, 2, 6, '#4a3420'); R(5, -3, 6, 15, '#7a5a32'); R(7, 0, 2, 9, '#1a120a'); R(5, -3, 6, 1, '#9a7a4a'); }
    },
    maps: {
      /* ---------------- 外婆的高脚屋 ---------------- */
      rumah: {
        amb: 'rain', dark: .74, plr: 2.6, wall: 'wood',
        legend: { a: 'lantai', i: 'tikar' },
        rows: [
          '################',
          '################',
          '#aaaaaaa#aaaaaa#',
          '#aaiiiaa#aaaaaa#',
          '#aaiiiaaaaaaaaa#',
          '#aaiiiaa#aaaaaa#',
          '#aaaaaaa####a###',
          '#aaaaaaa####a###',
          '#aaaaaaa#WWWWWW#',
          '#aaaaaaa#WWWWWW#',
          '#######a########'],
        ents: [
          { x: 7, y: 10, spr: 'invisible', touch: S => exitHouse(S) },
          { x: 2, y: 1, spr: 'portrait', on: S => S.narr('外公的照片。他戴着黑色的宋谷帽（songkok），站在一条新船前面，笑得有点僵。\n外婆说，他照相的时候总忘了呼吸。') },
          { id: 'win1', x: 4, y: 1, spr: 'window', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '窗外的雨停了。整个甘榜黑得像沉在河底。\n只有村北的方向，飘着一点说不清的白。' : '雨点打在亚答叶屋檐上，噼噼啪啪。窗外的高脚屋一排排黑着，只有几扇窗户里亮着豆大的灯。') },
          { x: 6, y: 1, spr: 'khat', on: S => S.narr('墙上挂着一幅阿拉伯文的书法，金字写在墨绿色的底子上。\n外婆每天晚上睡觉前，都会抬头看它一眼，嘴唇轻轻动几下。') },
          { x: 7, y: 1, spr: 'wallclock', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '三点四十几分。秒针走得很响。' : S.f.phase === 'home2' ? '十点过一刻。' : '七点四十分。停电以后，屋里只剩下这只钟还在走。') },
          { id: 'almari', x: 1, y: 2, spr: 'almari', on: S => almariOn(S) },
          { id: 'nenek', x: 4, y: 3, spr: '@nenek', dir: 0, on: S => nenekTalk(S) },
          { id: 'pelita', x: 4, y: 5, spr: 'pelita', light: { r: 1.7, col: 'rgba(255,170,80,.22)', flick: true }, on: S => S.narr(S.f.lamp ? '灌满了油的煤油灯，火苗稳稳地站着。\n灯光照得到的地方，就是屋里最安全的地方。' : '煤油灯的火苗缩成了黄豆那么大，灯芯烧得发黑。\n油快没了。') },
          { x: 3, y: 5, spr: 'basket', on: S => S.narr('外婆的槟榔盒（tepak sirih），黄铜的，擦得发亮。\n里面整整齐齐放着槟榔叶、石灰膏和一把小铡刀。') },
          { x: 6, y: 9, spr: 'shoes', col: '#4a4a52', decal: true, on: S => S.narr('门口摆着几双拖鞋。你的运动鞋混在里面，白得有点扎眼。') },
          { x: 1, y: 9, spr: 'jerigen', on: S => S.narr(S.has('minyak') || S.f.lamp ? '空了的煤油桶。' : '蓝色的塑料煤油桶，摇一摇，空的。') },
          /* 里屋 */
          { id: 'kwin', x: 13, y: 1, spr: 'window', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '窗户大开着。窗台上落着几朵白色的鸡蛋花，花瓣还是湿的。\n这扇窗离地有两人多高——底下是河。' : '里屋的窗户关得严严实实，还用一根筷子别住了插销。') },
          { x: 10, y: 1, spr: 'poster', col: '#d8d0b0', on: S => S.narr('一本挂历，印着国家电力公司（PLN）的标志。\n十一月那一页上，外婆用圆珠笔圈了一个日子：孩子满四十四天，坐月子结束。') },
          { x: 13, y: 2, h: 2, spr: 'futon', col: '#b8506a', on: S => S.narr('表姐的床褥。枕头底下压着一把剪刀，刀尖朝外。') },
          { id: 'buaian', x: 11, y: 3, spr: 'buaian', on: S => buaianOn(S) },
          { id: 'ratna', x: 12, y: 2, spr: '@ratna', dir: 0, on: S => ratnaTalk(S) },
          { id: 'kb1', x: 12, y: 3, spr: 'bunga', decal: true, hidden: true, on: S => S.narr('地板上落着几朵鸡蛋花，从窗口一直落到摇篮底下。') },
          { id: 'kb2', x: 13, y: 4, spr: 'bunga', decal: true, hidden: true },
          /* 厨房 */
          { x: 9, y: 8, spr: 'tempayan', on: S => S.narr('一口大陶缸，盛着接来的雨水。水面上浮着一只椰壳瓢。\n你低头看了一眼——水里只有你自己的脸。') },
          { x: 10, y: 8, spr: 'stove', on: S => S.narr('灶上的锅里还剩着一点姜黄鸡汤，是给坐月子的表姐熬的。') },
          { x: 11, y: 8, spr: 'counter', on: S => S.narr('案板上放着一把姜、一小把班兰叶（pandan），和一头剥好的蒜。\n外婆说，月子里的屋子，蒜和铁器一样都不能少。') },
          { x: 14, y: 8, spr: 'sack', on: S => S.narr('一袋米。袋口别着一根大缝衣针。') },
          { x: 14, y: 7, spr: 'window', on: S => S.narr('厨房的小窗对着河。河上漂着一盏渔灯，一晃，一晃。') }
        ],
        async enter(S, first) {
          if (first) return opening(S);
          if (S.f.phase === 'home2') return homeNight(S);
        }
      },
      /* ---------------- 祈祷室（surau） ---------------- */
      surau: {
        amb: 'room', dark: .55, plr: 3, wall: 'plain',
        legend: { a: 'lantai' },
        tileOpts: { carpetC: '#24503a' },
        rows: [
          '##############',
          '##############',
          '#cccccccccccc#',
          '#cccccccccccc#',
          '#cccccccccccc#',
          '#cccccccccccc#',
          '#aaaaaaaaaaaa#',
          '#aaaaaaaaaaaa#',
          '######a#######'],
        ents: [
          { x: 6, y: 8, spr: 'invisible', touch: async S => { S.sfx('open'); await S.go('kampung', 26, 5, 0); } },
          { x: 0, y: 3, spr: 'mihrab', on: S => S.narr('西墙上的壁龛（mihrab），朝着天房（Ka\'bah）的方向。\n印尼在麦加的东边，所以这里的人礼拜时都面朝西——差不多是太阳落下去的地方。') },
          { id: 'ustaz', x: 3, y: 3, spr: '@ustaz', dir: 1, on: S => ustazTalk(S) },
          { x: 2, y: 5, spr: 'rehal', on: S => S.narr('木头经架上，放着一本用绿布包好的古兰经。\n你没有去碰它。') },
          { x: 5, y: 1, spr: 'window', lit: true, on: S => S.narr('窗外是村路。雨后的地上积着一个个小水洼，映着祈祷室里的灯光。') },
          { x: 9, y: 1, spr: 'blackboard', text: true, on: S => S.narr('一块小黑板，用粉笔写着今天的礼拜时间：\n晨礼（Subuh）04:31　晌礼 11:52　晡礼 15:14\n昏礼（Maghrib）18:01　宵礼（Isya）19:12') },
          { x: 12, y: 1, spr: 'kentongan', on: S => S.narr('一截挖空的木梆子（kentongan）。村里有急事的时候，就敲它。') },
          { x: 12, y: 2, spr: 'bedug', on: S => S.narr('一面大鼓（bedug），鼓皮是牛皮的。礼拜之前先敲鼓，再唱宣礼。\n停电的晚上，扩音器不响，就全靠它了。') },
          { id: 'petro', x: 10, y: 6, spr: 'lantern', light: { r: 5, col: 'rgba(255,230,170,.2)' }, on: S => S.narr('一盏汽灯（petromaks），嘶嘶地响，照得满屋雪亮。\n全村停电的晚上，这里是最亮的地方。') },
          { x: 12, y: 6, spr: 'shelf', on: S => S.narr('架子上叠着礼拜用的白袍（mukena）、几顶黑色宋谷帽，还有一摞旧登记簿。') },
          { x: 5, y: 7, spr: 'shoes', col: '#3a3a3a', decal: true }, { x: 7, y: 7, spr: 'shoes', col: '#e0e0e0', decal: true, on: S => S.narr('你在门口把鞋脱了，和哈桑老师的拖鞋并排放着。') }
        ],
        async enter(S, first) {
          if (first) await S.narr('祈祷室里铺着绿地毯，汽灯嘶嘶地响。你在门口脱了鞋。\n空气里有一股干净的、樟脑和白布的味道。');
        }
      },
      /* ---------------- 甘榜（河边的村子） ---------------- */
      kampung: {
        amb: 'night', dark: .8, plr: 3, wall: 'wood', floor: 'dirt',
        legend: { p: 'papan' },
        tileOpts: { grassC: '#22321f', treeC: '#132018' },
        rows: [
          'TTTTTTTTTTTTTTTdddTTTTTTTTTTTTTT',
          'TTTTTTTT"""""""ddd""""""TTTTTTTT',
          'TT#######""""""ddd"""""#######TT',
          'TT#######"""""""d""""""#######TT',
          'TT#######"""""""d""""""#######TT',
          'T"dddddddddddddddddddddddddddd"T',
          'T"""""""""""""""d""""""""""""""T',
          'T"""""""""""""""d""""""""""""""T',
          'T"""""""""""""""d""""""""""""""T',
          'T""#######""""""d""""""""""""""T',
          'T""#######""""""d""""""""""""""T',
          'T""#######""""""d""""""""""""""T',
          'T"dddddddddddddddddddddddddddd"T',
          'T"""""""""""""""dd"""""""""""""T',
          'Teeeee""""""""""dd""""""""eeeeeT',
          'eeeeeeeeooooooooppooooooooeeeeee',
          '~~~~~~~~~~~~~~~~pp~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~pp~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~pp~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~pp~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          ...[15, 16, 17].map(x => ({ x, y: 0, spr: 'invisible', touch: S => toKebun(S) })),
          { x: 14, y: 1, spr: 'sign', col: '#3a5a3a', on: S => S.narr('一块歪歪的木牌：KEBUN KARET（橡胶园）↑\n穿过橡胶园，就是村里的老坟场。') },
          /* 外婆家 */
          { x: 5, y: 4, spr: 'door', col: '#5a3a22', async on(S) { S.sfx('open'); await S.go('rumah', 7, 9, 3); } },
          { id: 'hw1', x: 3, y: 4, spr: 'window', lit: true, light: { r: 1.6, col: 'rgba(255,170,80,.14)' }, on: S => S.narr('外婆家的窗户。窗缝里透出一点煤油灯的光。') },
          { id: 'hw2', x: 7, y: 4, spr: 'window', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '里屋那扇窗开着。窗台底下就是黑黢黢的河水。' : '里屋的窗户黑着。表姐和孩子在里面睡觉。') },
          /* 祈祷室 */
          { x: 26, y: 4, spr: 'door', col: '#2e5a44', async on(S) { S.sfx('open'); await S.go('surau', 6, 7, 3); } },
          { x: 24, y: 4, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,230,170,.16)' }, on: S => S.narr('祈祷室的窗户亮得发白——里面点着汽灯。') },
          { x: 28, y: 4, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,230,170,.16)' }, on: S => S.narr('窗台上摆着一排拖鞋，整整齐齐。') },
          { x: 22, y: 4, spr: 'sign', col: '#2e5a44', on: S => S.narr('绿底白字的牌子：SURAU AL-IKHLAS（祈祷室）。\n牌子下面挂着一盏马灯，被风吹得吱呀吱呀地转。') },
          /* 杂货铺 */
          { x: 6, y: 11, spr: 'door', col: '#6a5a3a', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '杂货铺的木板门关得死死的。门缝里贴着一张褪色的红纸，写着「出入平安」。' : '杂货铺的门半开着，里面堆满了米袋、饼干罐和成捆的香。') },
          { x: 4, y: 11, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,190,110,.16)' }, on: S => S.narr('杂货铺里点着一根红蜡烛，照着柜台上的神龛——是土地公。') },
          { id: 'clip', x: 8, y: 11, spr: 'poster', col: '#d8ccaa', async on(S) { if (S.once('clip')) await S.narr('杂货铺门边的木板上钉着一张发黄的剪报。'); await S.note('kota'); } },
          { id: 'stall', x: 3, y: 12, w: 2, spr: 'stall2', col: '#a83a2a', light: { r: 2.2, col: 'rgba(255,180,90,.16)', flick: true }, on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '柜台上盖着一块油布。玻璃罐里的虾片，在黑暗里白得像一排牙。' : '杂货铺门口的摊子：成串的咖啡粉小包、虾片罐子、一盒一盒的丁香烟（kretek）。') },
          { id: 'ahpek', x: 5, y: 12, spr: '@ahpek', dir: 0, on: S => ahpekTalk(S) },
          /* 村中 */
          { id: 'kapukK', x: 19, y: 6, w: 3, h: 2, spr: 'kapuk', on: S => S.narr(S.f.tutDone ? '大木棉树。最低的那根树杈上空空的。\n……你不敢再往上看。' : '村口的大木棉树（pohon kapuk）。树干灰白，底下的板根像一面面竖起来的墙。\n雨季结的棉絮被雨打湿了，挂在枝头，像一团团没拧干的白布。') },
          { id: 'kt', x: 20, y: 6, spr: '@kunti', hidden: true, solid: false, oy: -26, z: 1, light: GLOW },
          { id: 'kt2', x: 16, y: 6, spr: '@kunti', hidden: true, solid: false, light: GLOW },
          { x: 12, y: 7, spr: 'kemboja', on: S => S.narr('路边一棵鸡蛋花树（kemboja），白花开得正盛。\n在城里，这是种在酒店门口的花；在甘榜，它种在坟头上。') },
          { x: 25, y: 9, spr: 'kemboja', on: S => S.narr('又一棵鸡蛋花树。落了一地的花，没人去扫。') },
          { x: 10, y: 6, spr: 'streetlamp', off: true, on: S => S.narr('村里唯一的一根路灯杆。停电了，灯泡是黑的，上面爬满了壁虎。') },
          { x: 23, y: 13, spr: 'streetlamp', off: true, on: S => S.narr('路灯黑着。灯罩里积着雨水。') },
          { x: 1, y: 7, spr: 'barrel', on: S => S.narr('接雨水的大铁桶，满了。水面上漂着一朵鸡蛋花。') },
          { id: 'dog', x: 28, y: 8, spr: 'anjing', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '邻居家的狗冲着村北的黑暗，喉咙里发出呜呜的声音，就是不肯叫出来。' : '邻居家的黄狗趴在地上，耳朵贴着脑袋。你蹲下去摸它，它没有摇尾巴，一直盯着村北。') },
          { x: 20, y: 14, w: 2, spr: 'meriam', on: S => S.narr('一门「电石竹炮」（meriam karbit）——一截掏空了的大树干，用藤条箍着，炮口对着河。\n开斋节的晚上，往里面放电石、加水、点火，「轰」的一声，整条河都在抖。') },
          ...[[9, 5], [11, 5], [13, 5], [15, 4], [16, 2], [16, 1]].map(([x, y], i) => ({ id: 'tr' + i, x, y, spr: 'bunga', decal: true, hidden: true })),
          /* 码头 */
          { id: 'darto', x: 17, y: 19, spr: '@darto', dir: 1, on: S => dartoTalk(S) },
          { x: 18, y: 18, w: 2, spr: 'sampan', on: S => S.narr('达多伯的小船（sampan），船舱里堆着湿漉漉的渔网，还有一盏没点的渔灯。') },
          { x: 16, y: 15, spr: 'invisible', solid: false, on: S => S.narr('码头的木板被水泡得发软，踩上去咯吱咯吱地响。\n木桩底下，河水黑得发亮。') }
        ],
        async enter(S, first) {
          const ph = S.f.phase;
          if (ph === 'taken' || ph === 'night') {
            for (let i = 0; i < 6; i++) S.show('tr' + i);
            S.hide('ahpek'); S.ent('stall').light = null;
            if (S.once('kNight')) {
              await S.narr('雨停了。整个甘榜没有一扇窗户是亮的，只有祈祷室那边，透出一片汽灯的白光。\n河上起了雾。');
              await S.narr('地上有花。\n白色的鸡蛋花，一朵，一朵，从外婆家的屋檐底下，一直往村北掉过去。');
              S.goal(S.f.ust2 ? '跟着花往北，穿过橡胶园，去老坟场的大木棉树' : '去村东头的祈祷室，找哈桑老师');
            }
            return;
          }
          if (first) {
            await S.narr('外面比屋里还黑。一排高脚屋踩着木桩站在河边，窗户里只有零零星星几点煤油灯的光。\n空气又湿又重，像一块拧不干的毛巾。河水在木桩底下哗哗地响。');
            await S.think('阿伯的杂货铺在村路西头……路过那棵大木棉树的时候，别停。');
          }
        },
        step(S, x, y) {
          if (S.f.phase === 'back' && y <= 8) return tutorial(S);
        },
        tick(S, dt) { tutTick(S, dt); }
      },
      /* ---------------- 橡胶园 ---------------- */
      kebun: {
        amb: 'night', dark: .9, plr: 2.5, floor: 'dirt', fog: .1,
        legend: { Y: 'karet', p: 'papan' },
        tileOpts: { grassC: '#1e2c1c' },
        rows: [
          'TTTTTTTTTTTdTTTTTTTTTT',
          'TddYddYddYddYddYddYddT',
          'TdddddddddddddBddddddT',
          'TBdddddddddddddddddddT',
          'TddYddYddYddYddYddYddT',
          'TddddddddddddddddddddT',
          'TddddddddddddddddddddT',
          'T~~~~~~~~~~~~~~~~~pp~T',
          'TddddddddddddddddddddT',
          'TddddddddddddddddddddT',
          'TddYddYddYddYddYddYdBT',
          'TddddddddddddddddddddT',
          'TddddddddddddddddddddT',
          'TddYddYddYddYddYddYddT',
          'T~pp~~~~~~~~~~~~~~~~~T',
          'TddddddddddddddddddddT',
          'TddYddYddYddYddYddYddT',
          'TddddddddddddddddddddT',
          'TBdddddddddddddddddddT',
          'TddYddYddYddYddYddYddT',
          'TddddddddddddddddddddT',
          'T~~~~~~~~~~~~~~~~~pp~T',
          'TddYddYddYddYddYddYddT',
          'TddddddddddddddddddddT',
          'TddddddddddddddddddddT',
          'TddYddYddYddYddYddYddT',
          'TdddddddddddddddddddBT',
          'TddddddBdddddddddddddT',
          'TddYddYddYddYddYddYddT',
          'TTTTTTTTTTTdTTTTTTTTTT'],
        ents: [
          { x: 11, y: 29, spr: 'invisible', async touch(S) { await S.narr('不能回去。孩子还在她手里。\n天亮之前，得把孩子带回来。'); await S.walk('pl', 'u', 5); } },
          { x: 11, y: 0, spr: 'invisible', async touch(S) { await S.go('makam', 12, 18, 3); } },
          { id: 'pondok', x: 3, y: 24, w: 2, spr: 'pondok', async on(S) { if (S.once('pondok')) await S.narr('割胶工的小棚子。棚里挂着几把割胶刀，一盏熄了的头灯。\n门口钉着一块木板，上面用木炭写满了字。'); await S.note('papan'); } },
          { x: 16, y: 26, spr: 'bunga', decal: true, on: S => S.narr('地上又是几朵鸡蛋花，花心朝上，像一只只睁着的眼睛。') },
          { x: 19, y: 22, spr: 'bunga', decal: true },
          { x: 3, y: 15, spr: 'bunga', decal: true },
          { x: 19, y: 8, spr: 'bunga', decal: true },
          { x: 9, y: 2, spr: 'bunga', decal: true },
          { x: 13, y: 18, spr: 'kain', z: 1, on: S => S.narr('一缕白布挂在橡胶树的割口上，被树胶粘住了。\n布边绣着一圈红线。') },
          { x: 8, y: 11, spr: 'barrel', on: S => S.narr('一只接胶水的铁桶，里面的胶乳已经凝成了白色的一坨，像一块冷掉的豆腐。') },
          { x: 15, y: 5, spr: 'basket', on: S => S.narr('一只倒扣的竹篮，篮子底下压着一双胶鞋。\n鞋子是湿的，鞋尖朝着村子的方向，好像有人脱了鞋，光着脚往林子深处去了。') },
          { x: 19, y: 15, spr: 'invisible', solid: false, on: S => S.narr('一棵橡胶树的树皮上，被人用刀刻了一个小小的记号：一个圈，圈里一点。\n割胶工的记号，意思是「这棵树，别在夜里割」。') },
          { id: 'kk', x: 11, y: 20, spr: '@kunti', hidden: true, solid: false, light: GLOW }
        ],
        async enter(S, first) {
          if (S.f.phase === 'night') {
            S.f.phase = 'kebun'; S.norun(false);
            await S.narr('橡胶树一排一排，整整齐齐，像一队站着睡着的人。\n每棵树干上都斜斜地割着一道道口子，底下挂着接胶的椰壳碗。风一吹，碗和碗碰在一起，咯咯地响。');
            await S.narr('地上的鸡蛋花，一朵，一朵，一直往北。');
            await S.think('外婆说过：笑声听着近，她还远；听着远——她就在旁边。\n听见很轻的笑声，就站住，别动。');
            S.goal('穿过橡胶园往北（笑声很轻＝她就在旁边：站住别动）');
            resetK(S); S.f.kt = 1.2; S.f.kn = 0;
            S.cp('kebun');
          }
        },
        tick(S, dt) { kTick(S, dt); }
      },
      /* ---------------- 老坟场 ---------------- */
      makam: {
        amb: 'night', dark: .88, plr: 2.6, floor: 'dirt', fog: .18,
        tileOpts: { grassC: '#1e2a1c', treeC: '#101a14' },
        rows: [
          'TTTTTTTTTTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTTTTTTTTTT',
          'TT""""""""""""""""""""TT',
          'TT""""""""""""""""""""TT',
          'TT""""""""""""""""""""TT',
          'TT""""""""""""""""""""TT',
          'TT""""""""""""""""""""TT',
          'TT""""""""""""""""""""TT',
          'TT""""""""""d"""""""""TT',
          'TT""""""""""d"""""""""TT',
          'TT""""""""""d"""""""""TT',
          'TT""""""""""d"""""""""TT',
          'TT""""""""""d"""""""""TT',
          'TT""""""""""d"""""""""TT',
          'TT""""""""""d"""""""""TT',
          'TT"""""""""ddddddddddoo~',
          'TT"""""""""d""""""eeoo~~',
          'TT"""""""""d""""eeeo~~~~',
          'TTTTTTTTTTTdTTTTTTT~~~~~',
          'TTTTTTTTTTTdTTTTTTTTTTTT'],
        ents: [
          { x: 11, y: 19, spr: 'invisible', async touch(S) { await S.narr(S.f.phase === 'final' ? '……' : '孩子还在这里。不能走。'); await S.walk('pl', 'u', 5); } },
          { id: 'kapuk', x: 11, y: 6, w: 3, h: 2, spr: 'kapuk', on: S => S.narr(S.f.phase === 'makam' ? '老坟场正中间的大木棉树，比村口那棵还要老、还要高。\n树杈上空了。地上的鸡蛋花，到这里就没有了。' : '大木棉树。树根把好几座老坟都拱歪了。') },
          /* 坟：头在北（上），脚在南（下） */
          { id: 'g1', x: 3, y: 5, h: 2, spr: 'kubur', old: true, on: S => grave(S, 'g1') },
          { x: 3, y: 4, spr: 'kemboja', on: S => S.narr('一棵白鸡蛋花树，长在这座坟的北头。') },
          { id: 'g2', x: 8, y: 5, h: 2, spr: 'kubur', flat: true, text: true, on: S => grave(S, 'g2') },
          { x: 8, y: 4, spr: 'kemboja', on: S => S.narr('白鸡蛋花，开在这座坟的北头。') },
          { id: 'g6', x: 6, y: 6, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g6') },
          { x: 6, y: 5, spr: 'kemboja', on: S => S.narr('一棵很老的白鸡蛋花树，长在这座坟的北头。树干拧得像一股绳子，花落了一地。') },
          { id: 'g4', x: 4, y: 10, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g4') },
          { x: 4, y: 9, spr: 'kemboja', col: 'r', on: S => S.narr('一棵开红花的鸡蛋花树，长在这座坟的北头。\n红得像在暗处渗出来的血。') },
          { id: 'g3', x: 8, y: 10, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g3') },
          { x: 8, y: 12, spr: 'kemboja', on: S => S.narr('白鸡蛋花树。它长在这座坟的南头——脚那一边。') },
          { id: 'g5', x: 17, y: 6, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g5') },
          { x: 17, y: 5, spr: 'kemboja', on: S => S.narr('白鸡蛋花树，长在这座坟的北头。') },
          { id: 'g7', x: 20, y: 5, h: 2, spr: 'kubur', text: true, on: S => grave(S, 'g7') },
          { id: 'g8', x: 15, y: 11, h: 2, spr: 'kubur', flat: true, text: true, on: S => grave(S, 'g8') },
          { id: 'g9', x: 19, y: 10, h: 2, spr: 'kubur', old: true, on: S => grave(S, 'g9') },
          { x: 20, y: 9, spr: 'kemboja', on: S => S.narr('坟场东边的一棵鸡蛋花树，歪歪地斜向河那边。') },
          { x: 16, y: 16, spr: 'invisible', solid: false, on: S => S.narr('一条小路，穿过芦苇往河边去了。\n河上的雾很浓，看不清对岸。') },
          { id: 'kb', x: 12, y: 6, spr: '@kunti_b', hidden: true, solid: false, oy: -30, z: 1, light: { r: 3, col: 'rgba(220,230,220,.18)' } },
          { id: 'kfar', x: 22, y: 15, spr: '@kunti_b', hidden: true, solid: false, light: { r: 2, col: 'rgba(220,230,220,.12)' } },
          { id: 'kme', x: 6, y: 9, spr: '@kunti_b', hidden: true, solid: false, light: { r: 3.2, col: 'rgba(220,230,220,.2)' } },
          { id: 'nenekM', x: 12, y: 18, spr: '@nenek_l', hidden: true, solid: false, dir: 3, light: { r: 4, col: 'rgba(255,170,80,.24)', flick: true } },
          { id: 'ustazM', x: 11, y: 18, spr: '@ustaz', hidden: true, solid: false, dir: 3 }
        ],
        async enter(S, first) { if (S.f.phase === 'kebun') return enterMakam(S); },
        step(S, x, y) {
          if (S.f.phase === 'wait' && x >= 20 && y >= 15) return badFar(S);
        },
        tick(S, dt) { waitTick(S, dt); }
      }
    }
  });
  /*@STORY@*/
})();
