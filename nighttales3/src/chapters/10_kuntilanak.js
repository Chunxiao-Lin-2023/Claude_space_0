/* ================= 第十夜 · 坤蒂拉娜 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];

  /* ---------- 笑声：听起来的远近，和她真正的远近是反的 ----------
     'near'（听着近＝她其实还远）：又响又亮、又快又干，两个声部叠着，像贴着耳朵笑；
     'far' （听着远＝她其实就在身边）：又闷又慢、调子低，后面拖着两次越来越弱的回声，像隔着一整片林子。
     两种笑在音量、音色、快慢、回声上都不一样——耳机、外放都分得清；再配上虫鸣停、画面标记（cue）。 */
  function laugh(S, sounds) {
    if (sounds === 'near') {
      [1320, 1180, 1420, 1240, 1480, 1200, 1560].forEach((f, i) => {
        S.tone('triangle', f, f * .8, .09, .12, i * .1, 6000);
        S.tone('square', f * 1.01, f * .82, .07, .014, i * .1, 5000);
      });
    } else {
      [1000, 900, 1060, 940, 980].forEach((f, i) => {
        for (const [d, v, lp] of [[0, .034, 750], [.5, .014, 520], [1, .006, 400]]) S.tone('triangle', f, f * .68, .24, v, .1 + i * .3 + d, lp);
      });
    }
  }
  /* 画面提示：'L' 耳朵两边炸开锯齿声纹（笑声响）；'S' 头顶往下落鸡蛋花瓣（笑声轻、她就在旁边） */
  function cue(S, m, sec) {
    const e = curMap().ents.find(z => z.id === 'ear'); if (!e) return;
    if (!m) { e.hidden = true; e.s.m = 0; S.f.cueT = 0; return; }
    e.s.m = m; e.hidden = false; e.px = W.pl.px; e.py = W.pl.py; S.f.cueT = sec;
  }
  function cueTick(S, dt) {
    if (!(S.f.cueT > 0)) return;
    S.f.cueT -= dt;
    const e = curMap().ents.find(z => z.id === 'ear'); if (!e) return;
    if (S.f.cueT <= 0) { e.hidden = true; e.s.m = 0; return; }
    e.px = W.pl.px; e.py = W.pl.py;
  }
  const EAR = { id: 'ear', x: 1, y: 1, spr: 'sheng', solid: false, hidden: true, z: 2 };
  const LOUD = ['嘻嘻嘻嘻嘻！（又响又尖——就在耳边！她还远：快走）', '嘻嘻嘻……嘻嘻！（近得像贴着耳朵——她还远）', '哈哈……嘻嘻嘻嘻！（响得刺耳！）'];
  const SOFT = ['……嘻……嘻嘻……（又轻又闷，像隔着一整片林子）', '……嘻嘻……（远远的，还带着回声）', '……嘻……（轻得像风吹过树叶）'];
  const SMELL = ['虫子不叫了。一股鸡蛋花的香味，浓得发甜。', '虫子不叫了。花瓣落在你头发上。', '四下里一点虫声都没有。甜腻的花香，一下子涌了过来。'];

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
  const KR = [
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
          'TTTTTTTTTTTdTTTTTTTTTT'];
  const GLOW = { r: 2.2, col: 'rgba(220,230,220,.14)' };
  /* 坟场里的鸡蛋花树：白花在黑里泛着一点光（红花那棵泛粉），一眼看得出树长在坟的哪一头 */
  const TRAIL = { r: .8, col: 'rgba(240,240,225,.08)' };
  const KLW = { r: 1.25, col: 'rgba(240,240,225,.12)', dy: -8 }, KLR = { r: 1.25, col: 'rgba(240,120,150,.14)', dy: -8 };

  const caughtK = async S => {
    laugh(S, 'far');
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
        R(12, 12, 3, 1, '#3a2a20'); R(18, 12, 3, 1, '#3a2a20');
        if (a < .45) { R(12, 14, 3, 1, '#3a2418'); R(18, 14, 3, 1, '#3a2418'); }   // 先闭着眼……
        else { R(12, 13, 3, 2, '#1a1010'); R(18, 13, 3, 2, '#1a1010'); R(13, 13, 1, 1, '#e8e0d8'); R(19, 13, 1, 1, '#e8e0d8'); }   // ……再睁开
        R(11, 17, 2, 1, '#e8a8a0'); R(20, 17, 2, 1, '#e8a8a0');
        if (a > .7) { R(14, 21, 4, 1, '#b06060'); R(13, 20, 1, 1, '#b06060'); R(18, 20, 1, 1, '#b06060'); } else R(14, 21, 4, 1, '#b06060');   // 最后笑了
        R(7, 4, 3, 3, '#f8f4ee'); R(8, 5, 1, 1, '#f0d060'); R(6, 5, 1, 1, '#f8f4ee'); R(10, 5, 1, 1, '#f8f4ee');
      }
    },
    items: {
      minyak: { name: '一瓶煤油', desc: '阿伯装在旧芬达瓶子里的煤油（minyak tanah），瓶口塞着一团报纸。' },
      bedung: { name: '发黄的襁褓', desc: '一块洗得发软的白布，边上用褪色的红线绣着一圈小小的鸡蛋花。是外婆刚出生时裹过的。' },
      paku: { name: '生锈的长铁钉', desc: '一根手指那么长的铁钉，钉帽是方的。外婆说，这是养大她的 Mak Long 留下来的。' },
      bayi: { name: '表姐的孩子', desc: '小小的，软软的，裹在一块旧白布里，睡得很沉。' }
    },
    notes: {
      kota: { title: '剪报 · 华文报纸副刊《坤甸地名小考》', text: '（钉在杂货铺门边的一张剪报，纸已经黄透了。）\n\n城中老人说：一七七一年，后来成为坤甸第一代苏丹的那位谢里夫，带着船队溯卡普阿斯河而上，到了它与兰达克河交汇的河口。夜里岸边密林中笑声、哭声不绝，船上的人都说是 Kuntilanak（马来人叫 Pontianak）。\n\n据说他下令朝林子开炮，轰了几天几夜，鬼声才止。炮弹落处，后来建起了清真寺和王宫，城便以她为名。\n\n至今每逢开斋节，两岸仍燃放「电石竹炮」（meriam karbit）。老一辈说，一半是庆贺，一半是「吓她」。\n\n——地名学者另有考证，姑且一记。' },
      surat: { title: '一封爪夷文的旧信', text: '（爪夷文——阿拉伯字母拼的马来语。外婆年轻时请人念过，在行间用铅笔注了罗马字。下面是你一边看一边翻出来的意思。）\n\n阿米娜，我的孩子：\n\n生你的那个人不是我。她叫西蒂，河上游渔夫的女儿，十七岁嫁到这间高脚屋。\n\n你出生那晚下着大雨，她流了很多血。你生下来一声都不哭。她一直问：「她怎么不哭？她怎么不哭？」问着问着，就不问了。\n后来我抱着你走到门口，走进雨里，你才「哇」地哭出来。她没有听见。\n\n她怀着你的时候，天天坐在窗边唱「Tidurlah, tidurlah, anakku sayang」。我就一直唱给你听。\n\n我们把她埋在村北老坟场的大木棉树底下。那年穷，没钱刻字，碑就是一块扁扁的河石。我在她头那边种了一棵白鸡蛋花，好让我找得到。\n\n每到雨季的夜里，我都闻得到鸡蛋花香。我不怕她。\n我只怕，她一直在找一个哭声。\n\n——Mak Long' },
      papan: { title: '割胶工棚里的木板', text: '（割胶棚门口钉着一块木板，印尼文，用木炭一遍遍描得很粗。）\n\n割胶的兄弟们注意：\n一、凌晨四点以前，别一个人进园。\n二、听见女人笑，别抬头看树。\n三、笑声又响又尖、就在耳边——没事，她还远。快走。\n四、笑声又轻又闷、远远的还带回声——站住，别动，别出声。她就在你旁边。这时候虫子会先不叫，花会往你头上落。\n五、闻到鸡蛋花香，屏住气；香味变成臭味——跑。\n六、爪哇来的阿迪说，他们那边还有一种叫 Sundel Bolong 的，背上有个大洞，用长头发遮着。看见了，别跟她走。\n\n（最底下有人用小刀刻了一道道竖线，像在数日子。刻到第十七道，就没有了。）' },
      daftar: { title: '祈祷室的旧登记簿（1932年）', text: '（布包着的厚本子，纸页一碰就掉渣。是哈桑老师的爷爷那一辈的伊玛目记的。）\n\n伊斯兰历一三五一年，雨季。\n西蒂，渔夫之女，年十七。分娩时去世。\n女婴存活，由邻家 Mak Long 抚养，取名阿米娜。\n亡者已洗净、裹布、礼拜，安葬于老坟场大木棉树的西边，头北脚南，面向天房。未立名碑。\n\n（另有一行墨色新些的小字：）\n分娩时去世的妇女是殉道者（syahid）。愿真主怜悯她。\n\n（页边是哈桑老师刚用铅笔补的两行：）\n头北脚南——北头那块碑是头。\n男人的碑圆，女人的碑扁。' }
    },
    legend: '坤蒂拉娜（Kuntilanak），马来半岛和新加坡一带多叫庞蒂雅娜（Pontianak），是印度尼西亚、马来西亚等地流传最广的女鬼。通常的说法是：她生前是一个死于难产、或怀着孩子死去的女人，死后穿着白衣、披着一头长发，夜里栖在大树上——榕树、木棉、鸡蛋花树。她出现之前，人们会先闻到一阵鸡蛋花（frangipani，印尼人叫 kemboja，常种在坟场里）的香味，香味随后变成腐臭；她会发出婴儿似的哭声，或者尖细的笑声。最著名的一条规矩是：笑声听起来很远，她其实就在身边；听起来很近，她反而还远。\n\n关于名字，有一种民间说法把 pontianak 解释成「死于分娩的女人」（perempuan mati beranak）的缩略，学界并不都认同；二十世纪初英国殖民官员记录的马来民俗里，pontianak 有时指的是死产的婴儿，而难产而死的母亲另有名字，叫「兰苏尔」（langsuir）。各地版本差异很大：马来西亚的版本里她指甲尖长、会剖人肚腹；印尼的版本更多是吓人、盯上孕妇和新生儿；爪哇还有背上有个大洞的「孙德尔·波隆」（Sundel Bolong）。流传很广的一条说法是：她的后颈上有一个洞，把一根钉子钉进去，她就会变回一个美丽的女人，甚至能嫁人生子；钉子一拔出来，她又变回原形。民间常让孕妇和婴儿身边带着剪刀、钉子之类的铁器护身。\n\n西加里曼丹的坤甸（Pontianak）城名据说就来自她：一七七一年，一位阿拉伯裔的谢里夫（后来坤甸苏丹国的第一代苏丹）在卡普阿斯河与兰达克河的交汇处建城，传说他曾开炮驱赶在那里作祟的坤蒂拉娜，炮弹落处建起了清真寺和王宫。直到今天，坤甸人在开斋节沿河燃放「电石竹炮」（meriam karbit）的习俗仍很有名。另一方面，伊斯兰教的不少学者认为，因分娩而去世的妇女是殉道者（syahid），在真主那里享有尊荣——坤蒂拉娜是民间故事，并不是宗教信仰的一部分。1957 年的马来亚电影《庞蒂雅娜》之后，她成了东南亚恐怖片里最常见的面孔之一。\n\n（本章的甘榜、人物、西蒂与阿米娜的身世、那封信、那支摇篮曲，以及不用钉子、而是在晨礼的呼唤里让她安息的结局，均为游戏虚构。）',
    start: { map: 'rumah', x: 7, y: 8, dir: 3 },
    async intro(S) {
      await S.card('第十夜　坤蒂拉娜', '1997年11月　印度尼西亚 西加里曼丹　坤甸城外的河边甘榜', '坤甸（Pontianak）这座城的名字，\n据说来自一个女鬼。\n\n外婆住的甘榜在卡普阿斯河的一条支流边上，\n高脚木屋一排一排地踩在水上。\n雨季的晚上，停电是常事。\n\n外婆说，停电的晚上，\n要是闻到鸡蛋花的香味——\n就别回头。');
    },
    resume: {
      kebun: async S => { resetK(S); await S.think('（笑声又响又近——快走。\n笑声又轻又闷、虫子不叫、头顶落花——站住，等它过去。）'); },
      makam: async S => { if (S.f.phase === 'wait') { S.f.still = 0; S.f.wt = 1; } }
    },
    tick(S, dt) {
      cueTick(S, dt);
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
      sheng(g, e, t, R) {   // 笑声的画面提示，跟着玩家画（客机按自己画面里的玩家位置画，不会拖影）
        const ox = W.pl.px - e.px, oy = W.pl.py - e.py;
        if (e.m === 'L') {   // 笑声响：耳朵两边炸开的锯齿声纹
          for (let k = 0; k < 3; k++) {
            const p = (t * 3 + k / 3) % 1, r = 2 + p * 9, c = `rgba(255,244,200,${((1 - p) * .9).toFixed(2)})`;
            for (let j = -3; j <= 2; j++) { const jx = j & 1; R(ox + 1 - r - jx, oy - 3 + j * 2, 1, 2, c); R(ox + 14 + r + jx, oy - 3 + j * 2, 1, 2, c); }
          }
        } else if (e.m === 'S') {   // 笑声轻：她就在头顶——鸡蛋花瓣一片一片往下落
          for (let i = 0; i < 7; i++) {
            const y = ((t * 9 + i * 7.3) % 30) - 24, x = 7 + Math.sin(t * 1.3 + i * 2.1) * (6 + (i % 3) * 4), a = Math.min(1, (6 - y) / 10) * .85;
            const c = `rgba(244,240,228,${a.toFixed(2)})`; R(ox + x, oy + y, 3, 1, c); R(ox + x + 1, oy + y - 1, 1, 3, c); R(ox + x + 1, oy + y, 1, 1, `rgba(240,200,80,${a.toFixed(2)})`);
          }
          if ((t * 1.5) % 1 < .6) for (let i = 0; i < 3; i++) R(ox + 4 + i * 3, oy - 14, 1, 1, 'rgba(210,220,210,.75)');
        }
      },
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
        R(7, 0, 2, 15, '#8a8276'); R(4, -6, 2, 8, '#8a8276'); R(10, -7, 2, 9, '#8a8276'); R(5, 0, 3, 2, '#8a8276'); R(9, -1, 2, 2, '#8a8276'); R(7, -3, 2, 4, '#7a7268');
        for (const [x, y] of [[-1, -13], [5, -17], [10, -14], [2, -9], [9, -9]]) { R(x, y, 8, 6, '#1f3d26'); R(x + 1, y - 1, 6, 1, '#2c5032'); R(x + 1, y + 1, 3, 2, '#2c5032'); }
        for (const [x, y] of [[0, -12], [6, -16], [12, -13], [3, -8], [11, -8], [8, -12], [14, -10]]) { R(x, y, 3, 1, fl); R(x + 1, y - 1, 1, 3, fl); R(x + 1, y, 1, 1, cen); }
        R(4, 14, 9, 2, 'rgba(0,0,0,.3)');
      },
      kapuk(g, e, t, R) {   // 大木棉树：板状根，灰白的树干，树冠遮住半边天
        for (const [x, y, w, h] of [[-10, -46, 30, 22], [10, -54, 30, 26], [30, -46, 28, 22], [-4, -30, 56, 16], [-8, -20, 20, 8], [36, -20, 18, 8]]) { R(x, y, w, h, '#1c2e22'); R(x + 2, y + 2, w - 6, 3, '#28402e'); R(x + 4, y + h - 3, w - 8, 2, '#142218'); }
        for (let i = 0; i < 10; i++) R(((hash(i, 2, 7) * 60) | 0) - 8, -50 + ((hash(i, 3, 7) * 34) | 0), 2, 2, '#c8c4b8');
        R(18, -12, 12, 42, '#4e4840'); R(18, -12, 2, 42, '#625a50'); R(27, -12, 3, 42, '#3a3530'); R(22, 0, 1, 6, '#3a3530'); R(24, 10, 1, 8, '#3a3530');
        R(4, 24, 16, 6, '#4e4840'); R(28, 24, 16, 6, '#443e36'); R(11, 16, 8, 10, '#4e4840'); R(29, 16, 8, 10, '#443e36'); R(4, 24, 16, 1, '#625a50'); R(28, 24, 16, 1, '#5a5248');
        R(10, -14, 10, 3, '#4e4840'); R(28, -18, 14, 3, '#4e4840'); R(22, -24, 4, 12, '#4e4840');
        R(4, 29, 40, 3, '#1a160e');
      },
      kanopi(g, e, t, R) { R(-3, -12, 22, 11, '#14241a'); R(0, -15, 14, 4, '#1a2e20'); R(-1, -11, 8, 2, '#203626'); R(9, -6, 7, 2, '#203626'); R(4, -2, 8, 3, '#14241a'); },
      kubur(g, e, t, R) {   // 马来老坟：石头围起来的长方形坟，两块墓碑（头一块大、脚一块小）；flat=扁碑（女人），否则圆柱碑（男人）
        R(1, 8, 14, 22, '#5a584e'); R(2, 9, 12, 20, '#3a3226'); R(3, 10, 10, 18, '#4a4030'); R(1, 29, 14, 1, '#2e2c26');
        for (let i = 0; i < 4; i++) R(3 + ((hash(e.x, e.y, i) * 9) | 0), 12 + ((hash(e.y, e.x, i) * 14) | 0), 1, 2, '#2c4428');
        const st = e.old ? '#7a7c72' : '#9a9a90', sd = shade(st, -.3);
        if (e.flat) { R(4, -1, 8, 12, st); R(3, 1, 1, 6, st); R(12, 1, 1, 6, st); R(5, -2, 6, 1, st); R(4, 9, 8, 2, sd); }
        else { R(6, -3, 4, 14, st); R(5, -1, 6, 10, st); R(7, -4, 2, 1, st); R(5, 9, 6, 2, sd); }
        if (e.text) { R(6, 2, 4, 1, '#2a2a24'); R(6, 4, 4, 1, '#2a2a24'); R(7, 6, 2, 1, '#2a2a24'); }
        if (e.old) { R(4, 3, 2, 3, '#3a5a34'); R(9, 6, 2, 2, '#3a5a34'); }
        if (e.flat) { R(6, 24, 4, 5, st); R(5, 25, 1, 3, st); R(10, 25, 1, 3, st); } else R(7, 23, 2, 6, st);
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
          { x: 7, y: 10, spr: 'invisible', touch: S => exitHouse(S) }, EAR,
          { x: 2, y: 1, spr: 'portrait', on: S => S.narr('外公的照片。他戴着黑色的宋谷帽（songkok），站在一条新船前面，笑得有点僵。\n外婆说，他照相的时候总忘了呼吸。') },
          { id: 'win1', x: 4, y: 1, spr: 'window', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '窗外的雨停了。整个甘榜黑得像沉在河底。\n只有村北的方向，飘着一点说不清的白。' : '雨点打在亚答叶屋檐上，噼噼啪啪。窗外的高脚屋一排排黑着，只有几扇窗户里亮着豆大的灯。\n今年秋天林子烧了两个多月，烟把白天都熏成了黄昏。直到这个月雨季来了，才把烟压下去。') },
          { x: 6, y: 1, spr: 'khat', on: S => S.narr('墙上挂着一幅阿拉伯文的书法，金字写在墨绿色的底子上。\n外婆每天晚上睡觉前，都会抬头看它一眼，嘴唇轻轻动几下。') },
          { x: 7, y: 1, spr: 'wallclock', on: S => S.narr(S.f.phase === 'taken' || S.f.phase === 'night' ? '三点十几分。秒针走得很响。' : S.f.phase === 'home2' ? '八点过一刻。' : '七点四十分。停电以后，屋里只剩下这只钟还在走。') },
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
          { x: 9, y: 1, spr: 'blackboard', text: true, on: S => S.narr('一块小黑板，用粉笔写着今天的礼拜时间：\n晨礼（Subuh）04:04　晌礼（Zuhur）11:30　晡礼（Asar）14:52\n昏礼（Maghrib）17:33　宵礼（Isya）18:45\n坤甸就在赤道上，一年到头，天亮天黑都差不多是这个钟点。') },
          { x: 12, y: 1, spr: 'kentongan', on: S => S.narr('一截挖空的木梆子（kentongan）。村里有急事的时候，就敲它。') },
          { x: 12, y: 2, spr: 'bedug', on: S => S.narr('一面大鼓（bedug），鼓皮是牛皮的。礼拜之前先敲鼓，再唱宣礼。\n停电的晚上，扩音器不响，就全靠它了。') },
          { id: 'petro', x: 10, y: 6, spr: 'lantern', light: { r: 5, col: 'rgba(255,230,170,.2)' }, on: S => S.narr('一盏汽灯（petromaks），嘶嘶地响，照得满屋雪亮。\n全村停电的晚上，这里是最亮的地方。') },
          { x: 12, y: 6, spr: 'shelf', on: S => S.narr('架子上叠着女人礼拜时披的白色长袍（mukena）、几顶男人戴的黑色宋谷帽，还有一摞旧登记簿。') },
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
          ...[15, 16, 17].map(x => ({ x, y: 0, spr: 'invisible', touch: S => toKebun(S) })), EAR,
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
        amb: 'night', dark: .86, plr: 2.6, floor: 'dirt', fog: .1,
        legend: { Y: 'karet', p: 'papan' },
        tileOpts: { grassC: '#1e2c1c' },
        rows: KR,
        ents: [
          { x: 11, y: 29, spr: 'invisible', async touch(S) { await S.narr('不能回去。孩子还在她手里。\n天亮之前，得把孩子带回来。'); await S.walk('pl', 'u', 5); } },
          { x: 11, y: 0, spr: 'invisible', async touch(S) { await S.go('makam', 11, 17, 3); } },
          { id: 'pondok', x: 3, y: 24, w: 2, spr: 'pondok', async on(S) { if (S.once('pondok')) await S.narr('割胶工的小棚子。棚里挂着几把割胶刀，一盏熄了的头灯。\n门口钉着一块木板，上面用木炭写满了字。'); await S.note('papan'); } },
          /* 地上一路落着的鸡蛋花，微微泛白，引着人走到每一道木板桥 */
          { x: 16, y: 26, spr: 'bunga', decal: true, light: TRAIL, on: S => S.narr('地上又是几朵鸡蛋花，花心朝上，像一只只睁着的眼睛。') },
          ...[[13, 26], [19, 22], [15, 17], [8, 17], [3, 15], [10, 11], [14, 9], [19, 8], [13, 3], [9, 2]].map(([x, y]) => ({ x, y, spr: 'bunga', decal: true, light: TRAIL })),
          { x: 13, y: 18, spr: 'kain', z: 1, on: S => S.narr('一缕白布挂在橡胶树的割口上，被树胶粘住了。\n布边绣着一圈红线。') },
          { x: 8, y: 11, spr: 'barrel', on: S => S.narr('一只接胶水的铁桶，里面的胶乳已经凝成了白色的一坨，像一块冷掉的豆腐。') },
          { x: 15, y: 5, spr: 'basket', on: S => S.narr('一只倒扣的竹篮，篮子底下压着一双胶鞋。\n鞋子是湿的，鞋尖朝着村子的方向，好像有人脱了鞋，光着脚往林子深处去了。') },
          { x: 19, y: 15, spr: 'invisible', solid: false, on: S => S.narr('一棵橡胶树的树皮上，被人用刀刻了一个小小的记号：一个圈，圈里一点。\n割胶工的记号，意思是「这棵树，别在夜里割」。') },
          ...KR.flatMap((r, y) => [...r].map((c, x) => c === 'Y' ? { x, y, spr: 'kanopi', solid: false, alpha: .9 } : null).filter(Boolean)),
          { id: 'kk', x: 11, y: 20, spr: '@kunti', hidden: true, solid: false, light: GLOW }, EAR
        ],
        async enter(S, first) {
          if (S.f.phase === 'night') {
            S.f.phase = 'kebun';
            await S.narr('橡胶树一排一排，整整齐齐，像一队站着睡着的人。\n每棵树干上都斜斜地割着一道道口子，底下挂着接胶的椰壳碗。风一吹，碗和碗碰在一起，咯咯地响。');
            await S.narr('地上的鸡蛋花，一朵，一朵，在黑里泛着一点白，一直引到前面的水沟边。');
            await S.think('外婆说过：笑声听着近，她还远；听着远——她就在旁边。\n地上全是落叶和椰壳碗，跑起来动静太大。慢慢走。');
            S.goal('往北穿过橡胶园（笑声轻、虫不叫、头顶落花＝站住别动）');
            resetK(S); S.f.kt = 1.2; S.f.kn = 0;
            S.cp('kebun');
          }
        },
        step(S, x, y) {   // 每过一道水沟的木板桥，存一次
          if (S.f.phase === 'kebun' && (y === 21 || y === 14 || y === 7) && !S.f['kbr' + y] && S.f.kph !== 'hunt') {
            S.f['kbr' + y] = true; S.toast('过了一道水沟。（已存档）'); S.cp('kebun');
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
          { id: 'kapuk', x: 11, y: 6, w: 3, h: 2, spr: 'kapuk', on: S => kapukOn(S) },
          /* 坟：头在北（上），脚在南（下） */
          { id: 'g1', x: 3, y: 5, h: 2, spr: 'kubur', old: true, on: S => grave(S, 'g1') },
          { x: 3, y: 4, spr: 'kemboja', light: KLW, on: S => S.narr('一棵白鸡蛋花树，长在这座坟的北头。') },
          { id: 'g2', x: 8, y: 5, h: 2, spr: 'kubur', flat: true, text: true, on: S => grave(S, 'g2') },
          { x: 8, y: 4, spr: 'kemboja', light: KLW, on: S => S.narr('白鸡蛋花，开在这座坟的北头。') },
          { id: 'g6', x: 6, y: 6, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g6') },
          { x: 6, y: 5, spr: 'kemboja', light: KLW, on: S => S.narr('一棵很老的白鸡蛋花树，长在这座坟的北头。树干拧得像一股绳子，花落了一地。') },
          { id: 'g4', x: 4, y: 10, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g4') },
          { x: 4, y: 9, spr: 'kemboja', col: 'r', light: KLR, on: S => S.narr('一棵开红花的鸡蛋花树，长在这座坟的北头。\n红得像在暗处渗出来的血。') },
          { id: 'g3', x: 8, y: 10, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g3') },
          { x: 8, y: 12, spr: 'kemboja', light: KLW, on: S => S.narr('白鸡蛋花树。它长在这座坟的南头——脚那一边。') },
          { id: 'g5', x: 17, y: 6, h: 2, spr: 'kubur', flat: true, old: true, on: S => grave(S, 'g5') },
          { x: 17, y: 5, spr: 'kemboja', light: KLW, on: S => S.narr('白鸡蛋花树，长在这座坟的北头。') },
          { id: 'g7', x: 20, y: 5, h: 2, spr: 'kubur', text: true, on: S => grave(S, 'g7') },
          { id: 'g8', x: 15, y: 11, h: 2, spr: 'kubur', flat: true, text: true, on: S => grave(S, 'g8') },
          { id: 'g9', x: 19, y: 10, h: 2, spr: 'kubur', old: true, on: S => grave(S, 'g9') },
          { x: 20, y: 9, spr: 'kemboja', light: KLW, on: S => S.narr('坟场东边的一棵鸡蛋花树，歪歪地斜向河那边。') },
          { x: 16, y: 16, spr: 'invisible', solid: false, on: S => S.narr('一条小路，穿过芦苇往河边去了。\n河上的雾很浓，看不清对岸。') },
          { id: 'kb', x: 12, y: 6, spr: '@kunti_b', hidden: true, solid: false, oy: -30, z: 1, light: { r: 3, col: 'rgba(220,230,220,.18)' } },
          { id: 'kfar', x: 22, y: 15, spr: '@kunti_b', hidden: true, solid: false, light: { r: 2, col: 'rgba(220,230,220,.12)' } },
          { id: 'kme', x: 6, y: 9, spr: '@kunti_b', hidden: true, solid: false, light: { r: 3.2, col: 'rgba(220,230,220,.2)' } },
          { id: 'nenekM', x: 12, y: 18, spr: '@nenek_l', hidden: true, solid: false, dir: 3, light: { r: 4, col: 'rgba(255,170,80,.24)', flick: true } },
          { id: 'ustazM', x: 11, y: 18, spr: '@ustaz', hidden: true, solid: false, dir: 3 }, EAR
        ],
        async enter(S, first) { if (S.f.phase === 'kebun') return enterMakam(S); },
        step(S, x, y) {
          if (S.f.phase === 'wait' && x >= 20 && y >= 15) return badFar(S);
          if (S.f.phase === 'wait' && x >= 17 && y >= 14 && !S.f.warnR) return riverWarn(S);
        },
        tick(S, dt) { waitTick(S, dt); }
      }
    }
  });
  /* ================= 小工具 ================= */
  const pick = a => a[(Math.random() * a.length) | 0];
  function howl(S) {
    S.tone('sine', 480, 720, .9, .045, 0, 1400); S.tone('sine', 720, 520, 1.3, .04, .9, 1400);
    if (S.map === 'kampung') S.bubble('dog', '…', 1400);
  }
  function behind(S) {
    const p = S.pl, m = curMap(), d = DIRS[p.dir];
    const c = [[p.x - d[0], p.y - d[1]], [p.x, p.y + 1], [p.x - 1, p.y], [p.x + 1, p.y], [p.x, p.y - 1]];
    for (const [x, y] of c) if (passable(m, x, y, null)) return [x, y];
    return [p.x, p.y + 1];
  }
  function dirTo(p, x, y) { const dx = x - p.x, dy = y - p.y; return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); }
  function spot(S, dmin, dmax) {   // 离玩家 dmin..dmax 格、能站人的地方（偏向玩家前方——北边）
    const m = curMap(), p = S.pl, c = [];
    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
      const d = Math.abs(x - p.x) + Math.abs(y - p.y);
      if (d < dmin || d > dmax || !passable(m, x, y, null)) continue;
      const w = y < p.y ? 3 : 1; for (let i = 0; i < w; i++) c.push([x, y]);
    }
    return c.length ? pick(c) : [p.x, Math.max(1, p.y - dmin)];
  }

  /* ================= 开场：外婆家 ================= */
  async function opening(S) {
    S.f.phase = 'arrive';
    await S.narr('天黑以后，整个甘榜又停电了（mati lampu）。\n屋里只点着一盏煤油灯（pelita），火苗只有黄豆那么大。雨点打在亚答叶屋顶上，噼噼啪啪。');
    S.face('nenek', 'pl');
    await S.say('外婆', ['阿宁，过来，让外婆看看。……瘦了。雅加达的饭不养人。', '灯油快烧干了。去村路西头阿伯的杂货铺打一瓶煤油，就说外婆要的，他会记账。']);
    await S.say('阿宁', '……外婆，雅加达早就没人点煤油灯了。');
    await S.say('外婆', '雅加达不停电？');
    await S.say('外婆', ['你表姐刚生完孩子二十天，还在坐月子（pantang）。晚上别在外头大声喊她的名字。', '还有——路过村口那棵大木棉树（pohon kapuk），别在树底下停。闻到鸡蛋花的香味，别抬头，别回头，接着走。']);
    const r = await S.ask('外婆的眼睛在灯光里亮得有点吓人。', ['……为什么？', '（笑）外婆，你又讲鬼故事吓我。'], '阿宁');
    if (r === 1) await S.say('外婆', '你六岁的时候听这个故事，吓得三天不敢一个人上茅房。现在长大了，倒会笑了。');
    await S.say('外婆', ['她叫坤蒂拉娜（Kuntilanak），马来西亚那边叫庞蒂雅娜（Pontianak）——咱们坤甸城的名字，据说就是从她来的。', '生孩子的时候死了的女人。白衣服，长头发，夜里坐在大树上，专找刚生下来的孩子。', '你要是听见她笑，记住一句话——']);
    S.amb('none');
    await S.say('外婆', '笑声听着近，她还远；\n笑声听着远——她就在你旁边。', { style: 'big' });
    S.amb('rain');
    await S.say('外婆', '去吧。快去快回。');
    S.f.phase = 'errand';
    S.goal('去村路西头阿伯的杂货铺，买一瓶煤油');
  }

  async function nenekTalk(S) {
    S.face('nenek', 'pl');
    const ph = S.f.phase;
    if (ph === 'errand') return S.say('外婆', cyc(S, '_n1', ['阿伯的铺子在村路西头，门口挂着红灯笼的那家。', '快去快回。别在大木棉树底下停。', '……你还站在这儿干什么？灯要灭了。']));
    if (ph === 'back' || ph === 'home2') return S.say('外婆', '煤油呢？拿来，外婆给你灌上。');
    if (ph === 'taken') {
      if (!S.f.nenekT) return nenekReveal(S);
      if (!S.f.tin) return S.say('外婆', '柜子里的铁盒。快。');
      return S.say('外婆', ['去祈祷室找哈桑老师。他会告诉你老坟场里谁埋在哪儿。', '……阿宁。替我跟她说一声。我活下来了。']);
    }
    if (ph === 'night') return S.say('外婆', '哈桑老师来接我了。你先走——走橡胶园的小路，快。');
  }
  async function nenekReveal(S) {
    S.f.nenekT = true;
    await S.narr('外婆坐在灯前，一动不动。灯火把她的影子投在墙上，很大，很黑。');
    await S.say('外婆', ['……她来了。', '我早该知道。今年雨季，鸡蛋花开得特别早。']);
    await S.say('阿宁', '外婆！报警——叫人——叫……');
    await S.say('外婆', ['半夜三点多，叫谁？警察在城里，坐船要两个钟头。', '听我说，阿宁。她不会伤孩子。她只是……想抱一抱。', '可是天亮以前不把孩子抱回来，老人们说，孩子的魂就跟着她走了。']);
    await S.narr('外婆抬起头看着你。她的眼睛很湿，可是没有哭。');
    await S.say('外婆', ['我一直不敢说。', 'Mak Long 临死前告诉我：我亲娘叫西蒂。她就是生我的那天晚上死的。死在这间屋子里，死在里屋那扇窗户底下。', '……那个坐在树上笑的，是我娘。']);
    await S.say('外婆', ['衣柜最底下有个铁盒子。钥匙在这儿。', '把盒子里的东西都带上。那封信，你自己看。']);
    S.goal('打开外婆的衣柜，拿出铁盒');
  }
  async function almariOn(S) {
    if (S.f.phase !== 'taken' && S.f.phase !== 'night') return S.narr('外婆的老柚木衣柜，雕着藤蔓花纹。锁着。\n钥匙用红绳拴着，挂在外婆脖子上。');
    if (!S.f.nenekT) return S.narr('衣柜锁着。钥匙在外婆脖子上。');
    if (S.f.tin) return S.narr('衣柜里只剩外婆的几件旧纱笼，叠得整整齐齐，一股樟脑味。');
    S.ent('almari').open = true; S.sfx('open');
    await S.narr('衣柜最底下压着一个饼干铁盒。盒盖上印着一个穿纱笼的姑娘，漆都快掉光了。');
    S.give('bedung');
    await S.narr('盒子里有一块叠得方方正正的白布——是婴儿的襁褓。\n布边上，用褪了色的红线绣着一圈小小的鸡蛋花。');
    S.give('paku');
    await S.narr('布底下压着一根生锈的长铁钉，钉帽是方的。\n还有一封信。信纸折了很多折，上面是弯弯曲曲的爪夷文。');
    await S.note('surat');
    await S.think('……「我只怕，她一直在找一个哭声。」');
    S.face('nenek', 'pl');
    await S.say('外婆', ['那根钉子，是 Mak Long 留下的。', '老人们说，钉进她的后脖子，她就会变回一个漂亮女人，不会再吓人了。Mak Long 说，要是哪天我想让我娘不再是「那个东西」……', '……可是我一辈子都没敢用。', '你看着办吧。']);
    S.f.tin = true;
    S.goal('去村东头的祈祷室，找哈桑老师');
    S.cp('tin');
  }
  async function buaianOn(S) {
    if (S.f.phase === 'taken' || S.f.phase === 'night') return S.narr('摇篮空了。里面的小枕头还是温的。\n一朵鸡蛋花躺在孩子刚才躺的地方，花心朝上。');
    await S.narr('藤编的吊摇篮（buaian），用一根大弹簧吊在房梁上，一碰就上下轻轻地颠。\n孩子睡在里面，小拳头攥着，眉头皱着，像在做一个很认真的梦。');
    await S.narr('摇篮边上系着一小串蒜头，还别着一根缝衣针。');
  }
  async function ratnaTalk(S) {
    S.face('ratna', 'pl');
    const ph = S.f.phase;
    if (ph === 'taken' || ph === 'night') {
      if (S.once('ratnaT')) {
        await S.narr('表姐跪在空摇篮边上，两只手死死抓着摇篮的边。');
        await S.say('拉特娜表姐', ['我就闭了一下眼睛……就一下……', '窗户是关着的，我拿筷子别着的……', '剪刀还在枕头底下。她不怕剪刀。她就是……就是把孩子抱走了。']);
        await S.say('拉特娜表姐', ['阿宁，我听见她在窗外笑。笑声很远，很远，像在河对岸……', '可是那个味道，就在我脸上。'], { style: 'whisper' });
        if (!S.f.nenekT) S.goal('外婆在外屋——去问外婆');
        return;
      }
      return S.say('拉特娜表姐', ph === 'night' ? '……把她带回来。求你了，阿宁。' : '外婆……外婆知道。她一定知道。');
    }
    if (ph === 'home2' || ph === 'back' || ph === 'tut') return S.say('拉特娜表姐', '嘘——你听，外头又起风了。');
    if (S.once('ratna1')) {
      await S.say('拉特娜表姐', ['嘘——刚睡着。', '阿宁，你看她，像不像我？……像她爸？她爸跟船出海了，还没见过她呢。']);
      await S.say('拉特娜表姐', ['外婆非要把剪刀塞在我枕头底下，刀尖还得朝外。摇篮上挂蒜头、别缝衣针……', '我在城里医院生的孩子，护士要是看见这些，得笑死。', '……可是晚上听见外头有动静，我还是会伸手摸一摸那把剪刀。']);
      return;
    }
    await S.say('拉特娜表姐', cyc(S, '_r1', ['孩子还没取名字。本来第七天要剃胎发、取名字（aqiqah），她爸不在，就拖着。', '外婆一晚上都没睡，一直坐在灯底下。', '快去吧，灯要灭了。']));
  }
  async function exitHouse(S) {
    if (S.f.phase === 'taken' && !S.f.tin) { await S.narr(S.f.nenekT ? '外婆让你先把衣柜里的铁盒拿上。' : '孩子不见了——先去里屋看看，问问外婆！'); return S.walk('pl', 'u', 5); }
    await S.go('kampung', 5, 5, 0);
  }

  /* ================= 夜里：外婆的故事，孩子不见了 ================= */
  async function homeNight(S) {
    S.f.phase = 'home';
    S.take('minyak'); S.f.lamp = true;
    const L = S.ent('pelita'); L.s.big = 1; L.light = { r: 4.2, col: 'rgba(255,170,80,.24)', flick: true };
    S.dark(.6);
    await S.narr('外婆接过瓶子，把煤油慢慢灌进灯里。火苗「噗」地蹿高了，屋里一下子亮堂起来。');
    S.face('nenek', 'pl');
    await S.say('外婆', '……你闻到了，是不是。');
    await S.say('阿宁', '路上有人在笑。先是很近，然后很远。还有一股鸡蛋花的味道……肯定是哪家的小孩在恶作剧。');
    await S.narr('外婆没有说话。她把灯芯捻低了一点，又捻高了一点。');
    await S.say('外婆', ['我没见过我亲娘。养大我的是隔壁的 Mak Long。', '她说我是在这间屋子里出生的。那天晚上也下着大雨。我亲娘生完我……没来得及抱我一下。', '每年雨季，村里有孩子生下来，就有人半夜闻到鸡蛋花香。今年，是你表姐的孩子。']);
    S.sfx('cry');
    await S.narr('里屋传来孩子的哭声，细细的，一声接一声。\n外婆走到里屋门口，轻轻地哼起了一支歌。');
    lullaby(S);
    await S.say('外婆', 'Tidurlah, tidurlah, anakku sayang,\nbulan di atas, sungai pun tenang……\n（睡吧，睡吧，我的心肝宝贝，\n月亮在天上，河水也睡了……）', { style: 'whisper' });
    await S.narr('哭声慢慢地停了。');
    await S.say('阿宁', '这是什么歌？');
    await S.say('外婆', ['不知道。Mak Long 唱给我听的。好像……我生下来就会。', '睡吧，阿宁。门窗都关好。']);
    await S.fade(1, 900);
    S.pos(6, 7, 3);
    S.dark(.84); L.s.big = 0; L.light = { r: 2, col: 'rgba(255,170,80,.2)', flick: true };
    await S.card('', '凌晨三点十分', '……\n\n你是被一阵香味熏醒的。\n甜的，腻的，满屋子都是。');
    await S.fade(0, 700);
    S.amb('none');
    await S.narr('鸡蛋花的香味。浓得像有人把一整棵树塞进了屋里。\n……然后，香味变了。变成了一股烂花瓣泡在死水里的臭味。');
    laugh(S, 'far'); cue(S, 'S', 3); S.toast(SOFT[0]);
    await S.wait(1500);
    S.sfx('scream'); S.shake(500, 2);
    S.ent('buaian').s.empty = 1; S.show('kb1'); S.show('kb2');
    await S.say('表姐（里屋）', '孩子——！孩子呢？！我的孩子呢？！', { style: 'big' });
    S.amb('night');
    S.f.phase = 'taken';
    S.goal('孩子不见了——去里屋看看');
    S.cp('taken');
  }

  /* ================= 村里的人 ================= */
  async function ahpekTalk(S) {
    S.face('ahpek', 'pl');
    if (S.f.phase === 'errand') {
      await S.say('阿伯', ['哟，阿宁？雅加达的大学生回来啦！你外婆天天念你，念得我耳朵起茧。', '煤油？有有有。外婆要的，记账。', '……这个月煤油又涨了。卢比跌成这样，城里人都在抢米。也就你外婆，还当它是从前的价钱。']);
      S.give('minyak');
      await S.narr('阿伯从柜台底下摸出一个旧芬达瓶子，灌满煤油，瓶口塞了一团报纸。');
      await S.say('阿伯', ['……停电的晚上，一个女孩子家出来打油。你外婆没跟你讲？', '我阿公从汕头过番，在这条河上撑了一辈子舢舨。他说，刚来南洋的时候什么都不信，后来什么都信了。']);
      await S.say('阿伯', ['你知道坤甸为什么叫坤甸吗？', '两百多年前，苏丹的船队开到河口，夜里林子里全是女人的笑声。苏丹就叫人开炮，轰了几天几夜，才把她们轰走。', '我把报纸上那篇文章钉在门边了，你自己看。']);
      await S.say('阿伯', ['路上要是听见笑，记住：笑得远，站住别动；笑得近，赶快走。', '是反过来的，记住啦。']);
      S.f.phase = 'back';
      S.goal('把煤油带回外婆家');
      return;
    }
    await S.say('阿伯', cyc(S, '_a1', ['开斋节那天你要在就好了。河两岸的电石竹炮一起放，轰——轰——整条河都在抖，比过年放鞭炮还热闹。', '老人说放炮一半是庆祝，一半是吓她。\n……我看她也没被吓走。', '快回去吧。路上别回头。']));
  }
  async function dartoTalk(S) {
    S.face('darto', 'pl');
    const ph = S.f.phase;
    if (ph === 'taken' || ph === 'night') {
      if (S.once('darto2')) {
        await S.say('达多伯', ['孩子被抱走了？Ya Allah（真主啊）……', '我看见了。三点多，我在河上等雾散，一团白的从你外婆家里屋的窗口飘出来，飘得很慢。怀里抱着个东西。', '往村北去了——橡胶园那边，再过去就是老坟场。']);
        await S.say('达多伯', '去找哈桑老师。老坟场里谁埋在哪儿，只有他那本旧账上有。');
        return;
      }
      return S.say('达多伯', '我在这儿守着河。她要是往水里去，我就喊。');
    }
    if (S.once('darto1')) {
      await S.say('达多伯', ['Mbak Ning（宁姑娘）？这么晚还出来。', '我？等雾散了出船。夜里的虾好卖。']);
      await S.say('达多伯', ['我们爪哇老家也有她，叫 Kuntilanak。你们马来人叫 Pontianak，说的是一样的东西。', '爪哇还有一种，叫 Sundel Bolong，背上有个大窟窿，拿长头发遮着。那个更凶。', '我奶奶说，她夜里会变成一只鸟，叫起来「kik——kik——kik」。叫得越远，人越该害怕。']);
      await S.say('达多伯', ['马来西亚那边的人还说，往她后脖子上钉一根钉子，她就变成一个漂亮女人，能嫁人，能生孩子。钉子一拔，又变回去。', '……你说，被钉住的那个，还是她自己吗？']);
      return;
    }
    await S.say('达多伯', cyc(S, '_d1', ['河上的雾越来越浓了。今晚不出船了。', '她喜欢待在大树上——木棉、榕树、鸡蛋花树。晚上从树底下走，别抬头。', '……kik、kik、kik。你听见了吗？没有？那就好。']));
  }
  async function ustazTalk(S) {
    S.face('ustaz', 'pl');
    const ph = S.f.phase;
    if (ph === 'taken' || ph === 'night') {
      if (!S.f.tin) return S.say('哈桑老师', '阿宁？你外婆家出什么事了？……先回去问清楚你外婆，把该带的东西带上。我在这里等你。');
      if (S.f.ust2) return S.say('哈桑老师', ['头朝北，脚朝南。男人的碑圆，女人的碑扁。', '我这就去接你外婆。去吧，孩子。']);
      S.f.ust2 = true;
      await S.say('阿宁', '哈桑老师！表姐的孩子被……被抱走了。外婆说，是西蒂。');
      await S.say('哈桑老师', ['Astaghfirullah（求真主宽恕）……', '西蒂。这个名字，我在我爷爷的本子上见过。']);
      await S.narr('哈桑老师从架子上抽出一本用布包着的厚登记簿，小心地一页页翻开。');
      await S.note('daftar');
      await S.say('哈桑老师', ['我爷爷那时候是这里的伊玛目。坟场里没刻字的坟，只有这本子记得。', '记住：我们这里埋人，头朝北，脚朝南，身子侧着，脸朝西边的天房。所以坟北头那块碑，就是头。', '还有一条老规矩：男人的碑是圆柱的，女人的碑是扁的。']);
      await S.say('哈桑老师', ['你外婆那双腿走不了橡胶园的小路。我去接她，走河边的大路绕过去——大路远，我们会晚一点到。', '离晨礼不到一个钟头了。']);
      const r = await S.ask('哈桑老师拿起了汽灯旁边的手电筒。', ['老师，她……真的是鬼吗？', '（点点头）我这就去。'], '阿宁');
      if (r === 0) await S.say('哈桑老师', ['我不知道她是什么，阿宁。', '我只知道，一个十七岁的姑娘，生孩子死了，到死都没听见孩子哭一声。', '如果她还在这里，那不是因为她恶。是因为没有人告诉过她，后来怎么样了。']);
      await S.say('哈桑老师', 'Bismillah（以真主之名）。去吧，孩子。');
      S.f.phase = 'night';
      S.goal('跟着花往北，穿过橡胶园，去老坟场的大木棉树');
      S.cp('night');
      return;
    }
    if (S.once('ust1')) {
      await S.say('哈桑老师', 'Assalamualaikum（愿你平安）。阿宁？阿米娜大娘的外孙女？');
      await S.say('阿宁', 'Waalaikumsalam（也愿你平安），老师。');
      await S.say('哈桑老师', ['宵礼做完了，我在等汽灯里的油烧完再回去。全村停电，总得有个地方亮着。', '……坤蒂拉娜？你外婆跟你讲了？']);
      await S.say('哈桑老师', ['在我们的信仰里，因为生孩子而去世的女人，是殉道者（syahid）。真主会给她最好的地方。她不是什么魔鬼。', '坤蒂拉娜，是老人们的故事。', '可是……人心里有放不下的东西，就会变成故事。故事讲得久了，就跟真的一样。']);
      await S.say('哈桑老师', '你外婆小时候的事——你问过她吗？');
      return;
    }
    await S.say('哈桑老师', cyc(S, '_u1', ['早点回去。路上要是怕，就念一句 Bismillah。', '停电的晚上，来这里坐坐也好。汽灯亮，人心也亮。', '黑板上写着明早的礼拜时间。晨礼是四点零四分——天亮之前最黑的那一会儿。']));
  }
  async function toKebun(S) {
    const ph = S.f.phase;
    if (ph === 'night') return S.go('kebun', 11, 28, 3);
    if (ph === 'taken') { await S.narr(S.f.tin ? '先去祈祷室找哈桑老师——老坟场里谁埋在哪儿，只有他知道。' : '外婆还在屋里等你。先回去！'); return S.walk('pl', 'd', 5); }
    await S.narr('往北是橡胶园，再过去是村里的老坟场。\n大半夜的，去那儿干什么。');
    return S.walk('pl', 'd', 5);
  }

  /* ================= 村路上：第一次听见她 ================= */
  async function tutorial(S) {
    S.f.phase = 'tut0';
    S.amb('none');
    await S.narr('走到一半，河上的风忽然停了。\n青蛙、虫子，一下子全都不叫了。');
    laugh(S, 'near'); cue(S, 'L', 1.6); S.toast(LOUD[0]); S.shake(300, 1);
    await S.wait(900);
    S.bubble('pl', '!', 900);
    await S.narr('你猛地回过头。\n身后什么也没有。只有空荡荡的土路，和大木棉树黑压压的影子。');
    await S.think('……外婆说：笑声听着近，她还远。');
    await S.wait(600);
    laugh(S, 'far'); cue(S, 'S', 30); S.toast(SOFT[0]);
    await S.wait(1600);
    await S.narr('又一声。这一次又轻又闷，拖着回声，像是从河对岸飘过来的。\n一片白花瓣，轻轻落在你的肩膀上。甜得发腻的香味——是鸡蛋花。');
    await S.think('笑声听着远……\n——她就在旁边。就在我头顶上。');
    S.goal('别动。等那股香味过去');
    S.f.phase = 'tut'; S.f.tutT = 0; S.norun(true);
  }
  function tutTick(S, dt) {
    if (S.f.phase !== 'tut' || W.busy) return;
    S.f.tutT += dt;
    if (S.f.tutT > .6 && S.moving) { S.f.phase = 'tutx'; S.after(0, tutFail); return; }   // 头 0.6 秒不算：对话刚关、手还按在方向键上
    if (S.f.tutT >= 3.6) { S.f.phase = 'tutx'; S.after(0, tutPass); }
  }
  async function tutFail(S) {
    S.f.tutFails = (S.f.tutFails || 0) + 1;
    const [bx, by] = behind(S);
    S.place('kt2', bx, by); S.face('kt2', 'pl'); S.ent('kt2').alpha = 1;
    S.toast('香味一下子变成了腐臭——');
    await S.scare('face', { spr: '@kunti', face: 'kunti' });
    await S.narr('一只冰凉的手，搭在了你的后脖子上。指甲又长又弯。\n——下一秒，它又不见了。');
    S.hide('kt2');
    await S.think('……我动了。听着远的时候，她就在旁边。\n这次，别动。');
    laugh(S, 'far'); cue(S, 'S', 30); S.toast(SOFT[1]);
    S.f.phase = 'tut'; S.f.tutT = 0;
  }
  async function tutPass(S) {
    cue(S, 0, 0); S.toast('香味……慢慢淡了。');
    const k = S.ent('kt'); k.alpha = 0; S.show('kt');
    S.focus(20, 6);
    await S.alpha('kt', .8, 900);
    await S.narr('你用眼角的余光瞥见——\n大木棉树最低的那根树杈上，坐着一个白色的影子。长头发一直垂下来，垂到了树根。');
    laugh(S, 'near'); cue(S, 'L', 1.6); S.toast(LOUD[1]);
    await S.alpha('kt', 0, 1200);
    S.focus(null);
    await S.think('……这一声又响又近。\n那就是说，她已经走远了。');
    S.amb('night'); S.norun(false);
    S.f.phase = 'home2'; S.f.tutDone = true;
    S.goal('回外婆家');
    S.cp('home2');
  }

  /* ================= 橡胶园：反着听 ================= */
  /* 事件表：L＝笑声又响又近（她其实在远处的树间，快走）；S＝笑声又轻又闷（她就在身边，站住别动）。
     进园先来一次 L，第二次一定是 S（进园约 5 秒）；照规矩走完全程（禁跑）约 30 秒，会遇到 3 次左右的 S。 */
  const SEQ = 'LSLSSLSLSSLS';
  const KNEAR = 4.4, KGRACE = 1.3;   // 轻笑持续 4.4 秒；轻笑响起后头 1.3 秒内还在走不算（真人要听清、反应、松手）
  function resetK(S) {
    S.stop('kk'); const k = S.ent('kk');
    if (k) { k.hidden = false; k.alpha = 0; k.light = null; S.place('kk', 11, 15); k.alpha = 0; }
    S.f.kph = 'gap'; S.f.kt = 1.5; S.f.kmv = 0;
    S.norun(true); S.amb('night'); cue(S, 0);
  }
  function kTick(S, dt) {
    const f = S.f; if (f.phase !== 'kebun' || W.busy) return;
    const k = S.ent('kk'); if (!k) return;
    f.kt -= dt;
    if (f.kph === 'near') {
      if (f.kt < KNEAR - KGRACE && S.moving) f.kmv += dt;
      if (f.kmv > .35) {   // 她看见你了：木板第五条——香味变臭，跑
        f.kph = 'hunt'; f.kt = 4.2; k.alpha = 1; k.light = GLOW; cue(S, 0);
        S.sfx('sting'); laugh(S, 'far'); S.toast('香味一下子变成了腐臭——她看见你了！跑！'); S.bubble('kk', '!', 800);
        S.norun(false);
        S.chase('kk', { spd: 3.2, catch: caughtK });
        return;
      }
      if (f.kt <= 0) { k.alpha = 0; k.light = null; f.kph = 'gap'; f.kt = .9 + Math.random() * .6; S.amb('night'); S.toast('香味……散了。虫子又叫起来了。'); }
      return;
    }
    if (f.kph === 'hunt') { if (f.kt <= 0) { S.stop('kk'); k.alpha = 0; k.light = null; f.kph = 'gap'; f.kt = 1.6; S.norun(true); S.amb('night'); S.toast('腐臭慢慢淡了。她又不见了。'); } return; }
    if (f.kph === 'far') { if (f.kt <= 0) { k.alpha = 0; k.light = null; f.kph = 'gap'; f.kt = .7 + Math.random() * .5; } return; }
    if (f.kt > 0) return;
    const c = SEQ[(f.kn || 0) % SEQ.length]; f.kn = (f.kn || 0) + 1;
    if (c === 'S') {   // 听着远：虫子先停，头顶落花，她半透明地站在两三格外
      const [x, y] = spot(S, 2, 3); S.place('kk', x, y); S.face('kk', 'pl');
      k.alpha = .3; k.light = { r: 1.2, col: 'rgba(220,230,220,.08)' };
      f.kph = 'near'; f.kt = KNEAR; f.kmv = 0;
      S.amb('none'); laugh(S, 'far'); cue(S, 'S', KNEAR); S.bubble('pl', '…', 1200);
      S.toast(pick(SOFT)); S.toast(pick(SMELL));
    } else {   // 听着近：耳边炸开，远处树间闪过一个发着白光的影子
      const [x, y] = spot(S, 7, 11); S.place('kk', x, y); S.face('kk', 'pl');
      k.alpha = .55; k.light = GLOW;
      f.kph = 'far'; f.kt = 2.2 + Math.random() * .5;
      laugh(S, 'near'); cue(S, 'L', 1.5); S.shake(250, 1); S.bubble('pl', '!', 700);
      S.toast(pick(LOUD));
    }
  }

  /* ================= 老坟场 ================= */
  async function enterMakam(S) {
    S.f.phase = 'makam'; S.stop('kk'); S.norun(false); cue(S, 0);
    await S.narr('橡胶园到头了。\n眼前是一片荒了很多年的坟场。草长到膝盖，一块块墓碑歪在草里，像一群低着头的人。');
    S.sfx('cry');
    await S.narr('孩子的哭声！\n从坟场正中间那棵大木棉树上传下来。');
    const k = S.ent('kb'); k.alpha = 0; S.show('kb'); S.focus(12, 5);
    await S.alpha('kb', 1, 1200);
    await S.narr('最低的那根树杈上，坐着一个穿白衣服的女人。\n长头发从树杈上垂下来，像一道黑色的瀑布。她怀里抱着一个白布包着的小东西，一下一下地摇。');
    await S.say('？？？', 'Anakku…… anakku……\n（我的孩子……我的孩子……）', { style: 'whisper' });
    laugh(S, 'near'); cue(S, 'L', 1.5); S.toast(LOUD[2]);
    await S.wait(500);
    await S.scare('face', { spr: '@kunti', face: 'kunti', dur: .7 });
    S.hide('kb'); S.focus(null);
    await S.narr('再看时，树杈上已经空了。\n哭声也停了。');
    await S.think('信上说：她葬在大木棉树底下。她在找一个哭声——她自己孩子的哭声。\n……把外婆的襁褓放到她的坟上。让她知道，她的孩子在这里。');
    S.goal('找到西蒂的坟，把襁褓放上去');
    S.cp('makam');
  }
  async function kapukOn(S) {   // 大木棉树：卡住时在这里整理线索（第一次给方向，第二次给全部条件）
    if (S.f.phase !== 'makam') return S.narr('大木棉树。树根把好几座老坟都拱歪了。');
    if (S.once('kapukM')) return S.narr('老坟场正中间的大木棉树，比村口那棵还要老、还要高。\n树杈上空了。地上的鸡蛋花，到这里就没有了。');
    S.f.kapH = (S.f.kapH || 0) + 1;
    if (S.f.kapH === 1) return S.think('她埋在这棵树附近……信里和登记簿里都写了。\n（翻翻笔记：Mak Long 的信，祈祷室的登记簿。）');
    return S.think('把记得的拼起来：\n· 登记簿：大木棉树的西边，头北脚南。\n· 哈桑老师：北头那块是头碑；女人的碑扁。\n· 信：没钱刻字；在她头那边种了一棵白鸡蛋花。');
  }
  const GR = {
    g1: '一座老坟。头上那块碑是圆柱形的，顶上圆圆的，像一截粗木桩。没有刻字。\n北头长着一棵白鸡蛋花树。',
    g2: '一块扁扁的石碑。碑面上刻着几行阿拉伯字母，底下一行罗马字还认得出：「……binti Yusof　1961」。\n北头长着一棵白鸡蛋花树。',
    g6: '一块扁扁的河石，青苔把它包得严严实实。没有字。\n北头那棵老鸡蛋花树开得正白，落花把整座坟都盖住了。',
    g4: '扁扁的石碑，没有字。\n北头长着一棵鸡蛋花树——开的是红花。',
    g3: '扁扁的石碑，没有字。\n碑在北头，可是那棵白鸡蛋花树长在南头，脚那一边。',
    g5: '扁扁的石碑，没有字。北头长着一棵白鸡蛋花树。\n这座坟在大木棉树的东边。',
    g7: '圆柱形的墓碑，刻着字：「……bin Ahmad　1978」。\n坟头插着一把新鲜的班兰叶，还有人来看他。',
    g8: '一座很小很小的坟。扁扁的碑上刻着一个名字、一个年份，下面还刻着一朵小花。\n是个孩子的坟。',
    g9: '圆柱形的墓碑，歪向一边。没有字，也没有树。'
  };
  const WRONG = {
    g1: '圆柱形的碑……哈桑老师说，男人的碑才是圆的。', g2: '这座刻了名字。信上说，那年穷，没钱刻字。',
    g4: '红花……Mak Long 种的是白鸡蛋花。', g3: '树长在脚那一头。信上说，树种在她「头那边」——头朝北。',
    g5: '东边……登记簿上写的是大木棉树的「西边」。', g7: '有名字，碑是圆的。不是她。', g8: '是个孩子……不是她。', g9: '圆柱形的碑。是个男人。'
  };
  async function grave(S, id) {
    const e = S.ent(id);
    if (S.f.phase === 'wait' || S.f.phase === 'final') return S.narr(id === 'g6' ? '襁褓静静地铺在坟上。鸡蛋花一朵一朵落在上面。' : GR[id]);
    await S.narr(GR[id]);
    if (S.f.phase !== 'makam' || !S.has('bedung')) return;
    const v = await S.vote('把襁褓放在这座坟上吗？', ['放下襁褓', '再看看别的坟']);
    if (!v.agree) await S.think(v.v === 0 ? '（一只手已经把襁褓铺开了，另一只手还攥着一角。）' : '（一只手把襁褓递了出去，另一只手又把它拉了回来。）');
    if (v.v) return;
    if (id !== 'g6') {
      S.f.wrong = (S.f.wrong || 0) + 1;
      e.covered = true; S.sfx('tear'); await S.wait(500);
      S.amb('none'); laugh(S, 'near'); S.toast(LOUD[S.f.wrong % 3]); S.fx('red'); S.shake(400, 2);
      await S.wait(400);
      e.covered = false;
      await S.narr('一阵风贴着地面卷过来，把襁褓从坟上掀起来，「啪」地拍回你怀里。\n林子里，那个笑声又尖又响。');
      S.amb('night');
      const w = S.f.wrong;
      await S.think(WRONG[id] + (w === 2 ? '\n……信里、登记簿里都写了她埋在哪儿。再翻一遍笔记。' : w >= 3 ? '\n……扁的碑、没有字、白鸡蛋花种在北头（头那边）、在大木棉树的西边。' : ''));
      return;
    }
    S.take('bedung'); e.covered = true; e.flowers = true;
    await S.narr('你跪下来，把襁褓轻轻铺在坟上。\n红线绣的那一圈小鸡蛋花，和树上落下来的真花混在一起，分不出来了。');
    await S.say('阿宁', ['西蒂……', '这是你女儿的襁褓。她活下来了。她叫阿米娜。', '……你听见了吗？']);
    S.amb('none'); await S.wait(800);
    await S.narr('没有回答。\n坟场里静得能听见鸡蛋花落在草上的声音。');
    const kf = S.ent('kfar'); S.place('kfar', 22, 15, 1); kf.alpha = .55;
    laugh(S, 'far'); cue(S, 'S', 6); S.toast('……嘻……嘻嘻……（很远很远，从河那边）');
    S.focus(20, 14); await S.wait(900);
    await S.narr('很远的地方，河边的雾里，站着一个白色的影子，怀里抱着什么东西。\n笑声从那边飘过来，轻得像一根头发。');
    S.focus(null);
    await S.think('她在那边……抱着孩子，往河里去了？');
    S.f.phase = 'wait'; S.f.still = 0; S.f.wt = 2; S.f.wTot = 0;
    S.goal('……笑声很远，从河边传来。花瓣落在你头上');
    S.cp('makam');
  }
  function waitTick(S, dt) {
    const f = S.f; if (f.phase !== 'wait' || W.busy) return;
    if (S.moving) f.still = 0; else f.still = (f.still || 0) + dt;
    f.wTot = (f.wTot || 0) + dt;
    f.wt -= dt;
    if (f.wt <= 0) {
      f.wt = 3.4; f.wn = (f.wn || 0) + 1;
      laugh(S, 'far'); cue(S, 'S', 3.6); S.toast(cyc(S, '_w', ['……嘻嘻……（很远，在河那边）', '……嘻……（越来越远了）', '……（远得几乎听不见）']));
      if (f.wn % 2 === 0) S.toast('……可是，鸡蛋花的香味好近。');
    }
    if (f.still >= 5) { f.phase = 'final'; S.after(0, finale); return; }
    if (f.wTot > 16 && !f.wHint) { f.wHint = true; S.after(0, async S => S.think('笑声越来越远……可是花瓣一直往我头上落，虫子一声都不叫。\n外婆说：听着远——她就在旁边。……别动。')); }
  }
  async function riverWarn(S) {   // 走向河边之前，给一次回头的机会
    S.f.warnR = true;
    laugh(S, 'far'); cue(S, 'S', 3.6);
    await S.think('笑声从河那边来，又轻又远，还拖着回声。\n……外婆是怎么说的来着？');
  }
  async function badFar(S) {
    S.f.phase = 'far';
    await S.narr('你朝河边走过去。\n笑声还是很远、很远——你走得越近，它好像就越远。');
    laugh(S, 'far'); cue(S, 'S', 4); S.toast(SOFT[0]);
    await S.walk('pl', [21, 15], 3);
    S.hide('kfar');
    await S.narr('雾里的白影子不见了。\n脚下的泥变成了水。水漫过了脚踝，凉丝丝的。');
    S.amb('none'); S.toast('鸡蛋花的香味，就贴在你的耳朵边上。');
    await S.wait(900);
    await S.think('……笑声听着远的时候——');
    const [bx, by] = behind(S); S.place('kme', bx, by); S.face('kme', 'pl'); S.ent('kme').alpha = 1;
    await S.scare('face', { spr: '@kunti_b', face: 'kunti', sfx: 'scream' });
    await S.narr('——她一直就在你身后。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'far', title: '很远很远的笑声', text: '天亮以后，哈桑老师在大木棉树底下找到了表姐的孩子。孩子裹着一块绣着鸡蛋花的旧襁褓，睡得很香。\n\n阿宁没有回来。\n\n后来，河边割胶的工人说，雨季的夜里，雾里有时会传来两个人的笑声。\n两个都很轻，都很远。\n\n没有人敢往那边走。' });
  }
  function nearFree(S, x, y) {
    const m = curMap();
    for (const [dx, dy] of [[0, 2], [1, 2], [-1, 2], [2, 1], [-2, 1], [0, 3], [2, 0], [-2, 0], [1, 3]]) {
      const nx = x + dx, ny = y + dy; if (passable(m, nx, ny, null) && !(nx === S.pl.x && ny === S.pl.y)) return [nx, ny];
    }
    return [12, 14];
  }
  /* 外婆的摇篮曲：Ti-dur-lah, ti-dur-lah, a-nak-ku sa-yang（五声音阶，轻轻地哼） */
  function lullaby(S, vol = .04) {
    let t = .2;
    for (const [f, d] of [[440, .42], [370, .42], [330, .84], [440, .42], [370, .42], [330, .84], [294, .42], [330, .42], [370, .42], [440, .42], [370, 1.4]]) {
      S.tone('sine', f, f * .995, d * .95, vol, t, 1500); S.tone('triangle', f / 2, f / 2, d * .95, vol * .3, t, 700); t += d;
    }
  }
  function azan(S) {
    [[392, 392, 2.4, 0], [440, 415, 2, 2.3], [392, 370, 2.8, 4.2], [349, 392, 2.2, 7]].forEach(([a, b, d, t]) => { S.tone('sine', a, b, d, .045, t, 1100); S.tone('sine', a * 2, b * 2, d, .012, t, 1600); });
  }
  async function finale(S) {
    S.f.phase = 'final';
    S.hide('kfar'); S.amb('none'); cue(S, 0);
    S.toast('鸡蛋花的香味，就贴在你的后脖子上。');
    await S.wait(500);
    await S.narr('笑声停了。\n河边那个白影子，不知道什么时候不见了。\n……香味就在你身后。近得能感觉到一口凉气，吹在你的后脖子上。');
    const [bx, by] = behind(S);
    S.place('kme', bx, by); const K2 = S.ent('kme'); K2.alpha = 0; S.face('kme', 'pl');
    await S.alpha('kme', 1, 1000);
    S.turn(dirTo(S.pl, bx, by));
    await S.scare('face', { spr: '@kunti_b', face: 'kunti', dur: .8 });
    await S.narr('她就站在你身后。一直都在。\n长头发底下，一只眼睛从发缝里看着你。她怀里抱着表姐的孩子——孩子睡得很沉，小嘴还在一动一动。');
    await S.say('坤蒂拉娜', 'Anakku…… kenapa dia tak menangis?\n（我的孩子……她为什么不哭？）', { style: 'whisper' });
    await S.think('「她一直问：她怎么不哭？她怎么不哭？」');
    const v = await S.vote('她低下头，看着怀里的孩子。长发分开，后颈露了出来——白得发青。', ['「西蒂。你的女儿，活下来了。」', '（握紧口袋里的铁钉）把钉子钉进她的后颈'], '阿宁');
    if (v.v === 1) return nailEnd(S, v);
    if (!v.agree) await S.think('（两只手。一只伸进了口袋，一只按住了它。）');
    await S.say('阿宁', ['西蒂。', '这不是你的孩子。你的孩子……她活下来了。', '她生下来的时候不哭。Mak Long 抱着她走到门口，走进雨里，她才哭出来。你没有听见——可是她哭了。哭得很响。']);
    await S.say('坤蒂拉娜', 'Bohong……\n（骗人……）', { style: 'whisper' });
    S.shake(500, 2); S.fx('red'); S.toast('香味一下子又变成了腐臭。'); S.sfx('sting');
    await S.narr('她的头发猛地扬了起来。指甲又长又弯，停在你脸前一寸的地方。');
    await S.say('阿宁', ['她叫阿米娜。她今年六十五岁了。她每天晚上都在唱你的歌。', '……你看。她来了。']);
    const [nx, ny] = nearFree(S, S.pl.x, S.pl.y);
    S.place('nenekM', 11, 18, 3); S.place('ustazM', 11, 19, 3);
    S.focus(11, 15);
    await S.narr('坟场南边的小路上，亮起了一点煤油灯的光。\n外婆拄着拐杖，一步一步地走过来。哈桑老师跟在她身后，一只手扶着她的胳膊。');
    S.focus(null);
    const w2 = bg(S.walk('ustazM', [12, 13], 2.4));
    await S.walk('nenekM', [nx, ny], 2.2); await w2;
    S.face('nenekM', 'kme');
    await S.say('外婆', 'Mak……', { style: 'whisper' });
    await S.narr('外婆这辈子，从来没有叫过谁「妈」。\n这一声叫出来，很轻，很生，像一个刚学说话的孩子。');
    await S.say('外婆', ['Mak，是我。阿米娜。', '……我老了。比你老多了。']);
    S.face('kme', 'nenekM');
    await S.narr('白衣的女人，慢慢地转过头去。');
    lullaby(S, .05);
    await S.say('外婆', 'Tidurlah, tidurlah, anakku sayang,\nbulan di atas, sungai pun tenang.\nEmak di sini, jangan menangis,\nesok pagi, matahari manis……\n（睡吧，睡吧，我的心肝宝贝，月亮在天上，河水也睡了。\n妈妈在这里，你别哭，明天早上，太阳甜甜的……）', { style: 'whisper' });
    S.sfx('chime');
    S.toast('腐臭散了。只剩下鸡蛋花的香味——淡淡的，干净的。');
    await S.alpha('kme', .15, 700);
    K2.spr = '@siti_b';
    await S.alpha('kme', 1, 1000);
    S.fx('flash');
    await S.scare('face', { face: 'siti', sfx: 'chime', shake: .01, shakeMs: 100, dur: 1.8 });
    await S.narr('长头发底下，露出了一张年轻的脸。\n十七岁。眉毛细细的，嘴唇抿着，鬓边别着一朵白鸡蛋花。\n不用钉子。她自己变回来了。');
    await S.say('西蒂', '……Aminah?', { style: 'whisper' });
    await S.say('外婆', 'Ya, Mak. Saya di sini.\n（是我，妈。我在这儿。）');
    await S.narr('西蒂低下头，看了看怀里的孩子，又看了看你。\n然后，她把孩子轻轻地放进了你的怀里。');
    K2.spr = '@siti_n'; S.give('bayi');
    S.sfx('cry');
    await S.narr('孩子「哇」的一声哭了出来。又响，又亮。');
    await S.say('西蒂', '……dia menangis.\n（她哭了。）', { style: 'whisper' });
    await S.narr('西蒂笑了。不是那种尖细的、忽远忽近的笑。\n是一个年轻的妈妈，听见孩子哭的时候，那种又心疼、又放下心来的笑。');
    await S.narr('她走到外婆面前，伸出手，摸了摸外婆满是皱纹的脸。\n外婆闭上眼睛，像一个小女孩那样，把脸贴在那只手上。');
    S.amb('wind');
    await S.wait(400);
    S.sfx('knock'); await S.wait(500); S.sfx('knock'); await S.wait(500); S.sfx('knock');
    azan(S);
    await S.narr('远处，村子的方向，传来了咚、咚、咚的鼓声。\n然后，一个拖得很长的声音，在河上的雾里慢慢升起来——\n是晨礼的宣礼（azan Subuh）。天快亮了。');
    S.face('ustazM', 'pl');
    await S.say('哈桑老师', ['……是我的学生在敲鼓。我让他四点整准时敲。', '我们得回去礼拜了。她……也该走了。']);
    await S.narr('东边的天，透出了一点点灰白。\n西蒂抬起头，望着那片光，好像很多很多年都没有见过早晨了。');
    bg(S.alpha('kme', 0, 3200));
    await S.say('西蒂', 'Terima kasih.\n（谢谢。）', { style: 'whisper' });
    await S.wait(2600);
    await S.narr('她淡了下去，像晨雾被太阳照透了。\n坟上只剩下那块绣着鸡蛋花的襁褓，和一地落花。\n香味还在。淡淡的，干净的，像刚洗过晒干的白布。');
    await S.say('哈桑老师', ['……愿真主怜悯她。', '她是殉道者。她早就该去她该去的地方了——只是一直在等一句话。']);
    S.face('nenekM', 'pl');
    await S.say('外婆', ['下个月，请人给她刻一块碑吧。', '刻上她的名字：西蒂。……再刻上一行：她的女儿，活到了老。']);
    await S.fade(1, 1500);
    await S.card('1997年11月　清晨', '', '那天早上，表姐抱着孩子，哭了很久。\n孩子满四十四天的那天，哈桑老师来给她剃了胎发（aqiqah）。\n表姐给她取了名字：西蒂。\n\n老坟场大木棉树的西边，多了一块刻了字的扁石碑。\n碑的北头，那棵老鸡蛋花树，一年四季都开着白花。');
    await S.end({ id: 'subuh', title: '第十夜　完', text: '后来，甘榜通了电，路灯整夜亮着。\n雨季的晚上，再也没有人闻到过鸡蛋花变臭的味道。\n外婆说，她现在睡觉前唱那支歌，总觉得有人在跟她一起哼。\n\n这一季的十个夜晚，也讲完了。\n田那头扭动的白影，冬夜走廊里「テケ、テケ」的手肘声，越弹越长的红色窗口；\n雪夜里讨封的黄鼠狼，铁路桥洞里的兔子装，空街上跳着舞的笑脸；\n榕树夹道的老路上坐在后座的白衣女人，墙里敲个不停的声音，山涧黄昏的唢呐——\n还有今晚，鸡蛋花香里，要反着听的笑声。\n\n别看清楚，别回头，别应声，别看后视镜。这一季的十个，大多在考你怎么看、怎么听。\n\n三季，三十个夜晚，讲到这里就讲完了。\n那些在黑暗里笑着、哭着、找着什么的东西，\n大多数，只是想有人记得它们原来的名字。\n\n两个人一起看了三十个晚上的那盏灯，可以吹熄了。\n天亮了。' });
  }
  async function nailEnd(S, v) {
    if (!v.agree) await S.think('（两只手。一只想按住它，另一只已经把钉子攥紧了。）');
    S.take('paku');
    await S.narr('你攥紧了那根生锈的铁钉。\n她还低着头，看着怀里的孩子。后颈白得发青。');
    S.sfx('cut'); S.shake(400, 3); S.fx('flash');
    await S.narr('铁钉扎进去的时候，没有声音。\n她浑身一震，像一盏灯被人一口吹灭了。');
    S.ent('kme').spr = '@siti_b';
    await S.narr('长头发底下，露出了一张年轻的、好看的脸。\n腐臭散了。鸡蛋花的香味淡淡的，好闻极了。\n——就像传说里讲的一样。');
    S.give('bayi'); S.ent('kme').spr = '@siti_n';
    await S.narr('她把孩子递给你，动作很轻，很温柔。\n然后她看着你，笑了一下。眼睛里什么都没有。');
    await S.say('阿宁', '……西蒂？');
    await S.narr('她没有反应。\n她已经不记得这个名字了。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'paku', title: '后颈上的铁钉', text: '孩子平安地回了家。\n\n那以后，甘榜里多了一个不说话的漂亮女人。她住在河边的空屋里，帮人洗衣服，见了孩子就笑。\n没有人敢问她从哪里来。\n\n外婆每天都去看她，叫她「Mak」。\n她每次都礼貌地点点头——像在听一个陌生人的名字。\n\n她的长头发，永远盖着后脖子。' });
  }
})();
