/* ================= 第十四夜 · 报丧女妖 ================= */
(() => {
  /* 标题卡在窄屏上只在全角空格处折行 */
  const nb = s => s.split('　').map(p => [...p].join('⁠')).join('　');
  const CN = '零一二三四五六七八九';
  const cn = n => n < 10 ? CN[n] : n < 20 ? '十' + (n % 10 ? CN[n % 10] : '') : CN[(n / 10) | 0] + '十' + (n % 10 ? CN[n % 10] : '');

  /* 她：长白发一直垂到腰下，右手里一把银梳子 */
  function beanExtra(g, d, fr, G, R) {
    const h = '#d8d8de';
    if (d === 0) { R(3, G.tT, 1, 10, h); R(12, G.tT, 1, 10, h); R(2, G.tT + 4, 1, 7, '#c4c4cc'); R(13, G.tT + 7, 2, 1, '#e8eef4'); R(13, G.tT + 6, 1, 1, '#ffffff'); }
    else if (d === 3) { R(4, G.tT + 3, 8, 11, h); R(5, G.tT + 14, 6, 3, '#c4c4cc'); R(12, G.tT + 2, 2, 1, '#e8eef4'); }
    else { R(9, G.tT + 2, 3, 12, h); R(4, G.tT + 6, 2, 1, '#e8eef4'); }
  }
  /* ---------- 跨重来保留的数据（不进 S.f，读档/开新局时在 intro 里清零） ---------- */
  let FORD_DIED = 0, FATE_LEFT = null, FATE_FAILS = 0;
  const FATE_BASE = 120, FATE_FLOOR = 85, FATE_PEN = 15;

  /* ---------- 声音 ---------- */
  /* 哀嚎：一段一段往上爬、再往下落的滑音，每段都带一点抽泣似的颤 */
  const KEEN_C = [520, 640, 780, 900, 880, 820, 700, 600, 520, 470];
  function keen(S, vol = .05, lp = 1600, delay = 0, cut = 99) {
    const seg = .28;
    for (let i = 0; i < KEEN_C.length - 1 && i < cut; i++) {
      const d = delay + i * seg * .92;
      S.tone('sawtooth', KEEN_C[i], KEEN_C[i + 1], seg + .08, vol, d, lp);
      S.tone('sine', KEEN_C[i] * 2, KEEN_C[i + 1] * 2, seg + .08, vol * .45, d, lp * 1.6);
    }
  }
  function sob(S, vol = .04) { S.tone('triangle', 640, 380, .22, vol, 0, 1300); S.tone('triangle', 560, 340, .26, vol * .8, .3, 1100); }
  function strike(S, n) { for (let i = 0; i < n; i++) { S.tone('triangle', 784, 780, 1.5, .06, i * .95, 2600); S.tone('sine', 1568, 1560, .9, .02, i * .95, 3000); } }
  function hammer(S) { S.tone('square', 1900, 1300, .07, .05, 0, 3500); S.tone('triangle', 420, 300, .12, .05, 0, 1800); S.sfx('thud'); }
  function whine(S, vol = .03) { S.tone('sine', 900, 1300, .45, vol, 0, 2400); S.tone('sine', 1300, 700, .7, vol, .45, 2400); }
  function rooster(S) { S.tone('sawtooth', 500, 900, .25, .04, 0, 2200); S.tone('sawtooth', 900, 1000, .45, .04, .25, 2200); S.tone('sawtooth', 1000, 600, .6, .04, .7, 2200); }
  function snort(S) { S.tone('sawtooth', 240, 110, .4, .03, 0, 700); }

  /* ---------- 渡口的芦苇（不实心，躲进去她就看不见） ---------- */
  const FORD_ROWS = [
    'TTTTTTTTTTTddTTTTTTTTTTT',
    'TTTTTTTTTTTddTTTTTTTTTTT',
    'TTTTTTTTT"dddd"TTTTTTTTT',
    'TT""""""""""d"""""""""TT',
    'TT""""""""""drr"""""""TT',
    'TT"""rr"""""drr"""""""TT',
    'T""""r""""""d""""""""""T',
    'T""""""""rr"d"""""rr"""T',
    'T""""""""rr"d"""""r""""T',
    'T"""""""""""d""""""""""T',
    'T"""""""""""drr""""""""T',
    'T"""rr""""""drr""""""""T',
    'T"""""""""""d""""""rr""T',
    'Te"""""""rr"d"""""""""eT',
    'TeuuuuuuuurrrruuurruuueT',
    'TeuuuuuuuuururuuuuuuuueT',
    'eeeuuuuuuuoooKouuuuuueee',
    '~~~~~~~~~~ooooo~~~~~~~~~',
    '~~~~~~~~~~ooooo~~~~~~~~~',
    '~~~~~~~~~~ooooo~~~~~~~~~',
    'TTTTTTTTT"udddu"TTTTTTTT',
    'TTTTTTTTTTTddTTTTTTTTTTT'];
  const COVER = new Set(); FORD_ROWS.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'r') COVER.add(x + ',' + y); }));
  const PEEK = new Set(['11,14', '12,14', '13,14', '11,15', '13,15']);
  const HX = 12, HY = 16;           // 她跪的地方
  const SIGHT = 9, NEAR = 2.2, MAXC = 9;

  /* ---------- 谜题 ---------- */
  const WHO = ['奶奶', '妈妈', '迈克尔叔叔', '小肖恩', '汤米', '我'];
  const HOW = ['发高烧', '走过渡口时失足', '赶车过渡口时翻车', '掉进井里', '从谷仓的梯子上摔下来'];
  const WHO_TXT = '她为谁而哭？\n（键盘 1 奶奶　2 妈妈　3 迈克尔叔叔\n　　　4 小肖恩　5 汤米　6 我）';
  const HOW_TXT = '会怎么出事？\n（键盘 1 发高烧　2 走过渡口时失足\n　3 赶车过渡口时翻车　4 掉进井里\n　5 从谷仓的梯子上摔下来）';

  function nightGoal(S) {
    if (S.has('shirt')) return '回屋告诉奶奶：她为谁哭、会怎么出事';
    return '找出她为谁而哭：族谱、她站的窗下、渡口' + (S.coop ? '（双人：一人念笺，一人去看）' : '');
  }
  function fateGoal(S) {
    const f = S.f, left = [];
    if (!f.cartFixed) left.push(S.has('pin') ? '换上车辖（院里大车）' : '修好车辖（谷仓工具箱）');
    if (!f.tommyUp) left.push('叫醒汤米（谷仓）');
    if (!f.shirtShown) left.push('拿衬衫劝住叔叔（灶屋）');
    if (!left.length) return '等天亮';
    return '四点前：' + left.join('、') + (S.coop && left.length > 1 ? '（双人：分头去）' : '');
  }
  function clockText(S) {
    const f = S.f;
    if (f.ph === 'fate' && S.timerLeft != null) { const m = Math.min(59, Math.max(0, 60 - Math.ceil(S.timerLeft / 2))); return '三点' + (m ? cn(m) + '分' : '整'); }
    if (f.ph === 'eve') return '十点一刻';
    const t = 65 + (f.pen || 0) / FATE_PEN * 20 + (f.sawWash ? 35 : 0);
    const h = Math.min(3, Math.floor(t / 60)), m = Math.round(t % 60);
    return cn(h) + '点' + (m ? cn(m) + '分' : '整');
  }

  defChapter({
    id: 'banshee', n: 14, title: '报丧女妖', sub: '深夜，屋外有个女人在哭。老人们说，只有老姓的人家，才有人替他们先哭。', origin: '爱尔兰民间传说', color: '#2c3a48',
    icon: '@bean', iconX: 30, amb: 'wind', floor: 'stone', wall: 'plain', dark: .7, plr: 3.2,
    endings: { dawn: '哭声停在天亮', comb: '银梳子', ford: '渡口', boston: '海那边' },
    people: {
      me: { key: 'eileen', skin: '#f2d4bc', hair: '#8a3a1e', hs: 'long', top: '#4e5e46', top2: '#3e4a38', bottom: '#4e5e46', dress: true, shoes: '#2a1e16',
        extra(g, d, fr, G, R) { const c = '#7a2a2a'; if (d === 0) { R(3, G.tT, 10, 3, c); R(6, G.tT + 3, 4, 2, c); R(7, G.tT + 5, 2, 1, c); } else if (d === 3) R(3, G.tT, 10, 5, c); else R(4, G.tT, 7, 3, c); } },
      nan: { key: 'nan', skin: '#e6c6ae', hair: '#e2ded6', hs: 'bun', hat: 'hood', hatC: '#1e1a1e', top: '#2a2428', top2: '#1e1a1e', bottom: '#2a2428', skirt: true, shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT + 3, 1, 5, '#cfc6b4'); R(6, G.tT + 8, 3, 1, '#cfc6b4'); } } },
      mam: { skin: '#eccab2', hair: '#5a3a24', hs: 'bun', top: '#5e4a5a', bottom: '#3a2e38', skirt: true, apron: '#d8d0c0', shoes: '#2a1e16' },
      mick: { key: 'mick', skin: '#e8c4a8', hair: '#4a2a18', hs: 'short', top: '#e2e4e8', top2: '#f4f4f4', bottom: '#3a3a44', shoes: '#1a1410',
        extra(g, d, fr, G, R) { const v = '#3a3a46'; if (d === 0) { R(4, G.tT + 1, 3, G.tB - G.tT, v); R(9, G.tT + 1, 3, G.tB - G.tT, v); R(7, G.tT + 4, 2, 1, '#c9a35a'); R(9, G.tT + 4, 1, 1, '#c9a35a'); } else if (d === 3) R(4, G.tT, 8, G.tB - G.tT + 1, v); else R(5, G.tT + 1, 5, G.tB - G.tT, v); } },
      tommy: { skin: '#f0cfb4', hair: '#c8a060', hs: 'messy', hat: 'cap', hatC: '#4a4038', top: '#b8ac8a', top2: '#a0946e', bottom: '#3a3428', shoes: '#2a1e16' },
      bean: { key: 'bean', skin: '#dcdcd8', hair: '#d8d8de', hs: 'long', cover: true, redEye: true, ghost: true, dress: true, top: '#3e5446', hat: 'hood', hatC: '#5c5e66',
        extra: beanExtra },
      bean_big: { key: 'bean-big', big: true, skin: '#dcdcd8', hair: '#d8d8de', hs: 'long', cover: true, redEye: true, ghost: true, dress: true, top: '#3e5446', hat: 'hood', hatC: '#5c5e66',
        extra: beanExtra }
    },
    /* 惊吓大头像：灰斗篷、被风吹开的白发、一张长长的灰白的脸、哭肿的红眼眶、越张越大的嘴 */
    faces: {
      bean(R, a, t) {
        const HD = '#4a4c54', HD2 = '#2e3036', HA = '#e6e6ea', HA2 = '#b4b4bc', SK = '#d8dad6', SK2 = '#a4a8a6', RIM = '#b02020', K = '#0a0608';
        R(4, 0, 24, 4, HD); R(2, 3, 28, 29, HD); R(2, 3, 2, 29, HD2); R(28, 3, 2, 29, HD2);
        const w = Math.round(Math.sin(t * 3));
        R(5, 4, 22, 4, HA); R(4 + w, 8, 4, 24, HA); R(24 - w, 8, 4, 24, HA); R(5 + w, 25, 4, 7, HA2); R(23 - w, 25, 4, 7, HA2); R(3 + w, 14, 1, 14, HA2); R(28 - w, 12, 1, 16, HA2);
        R(9, 7, 14, 20, SK); R(10, 27, 12, 2, SK); R(11, 29, 10, 1, SK); R(20, 8, 3, 19, SK2);
        R(9, 6, 14, 3, HA); R(15, 6, 2, 5, HA2); R(9, 9, 2, 6, HA); R(21, 9, 2, 5, HA);
        R(10, 11, 5, 6, '#5a5e62'); R(17, 11, 5, 6, '#5a5e62');
        R(10, 12, 5, 4, K); R(17, 12, 5, 4, K); R(10, 11, 5, 1, RIM); R(17, 11, 5, 1, RIM); R(10, 16, 5, 1, RIM); R(17, 16, 5, 1, RIM); R(9, 13, 1, 2, RIM); R(22, 13, 1, 2, RIM);
        R(12, 13, 2, 2, '#ff3a3a'); R(19, 13, 2, 2, '#ff3a3a'); R(12, 13, 1, 1, '#ffd0d0'); R(19, 13, 1, 1, '#ffd0d0');
        for (let i = 0; i < 6; i++) R(9 + i, 9 + i * 2, 1, 2, HA2); for (let i = 0; i < 5; i++) R(22 - i, 10 + i * 3, 1, 2, HA);
        R(11, 17, 1, 8, '#9ab8d0'); R(21, 17, 1, 7, '#9ab8d0');
        R(9, 18, 2, 5, SK2); R(21, 18, 2, 5, SK2);
        const mh = 3 + Math.round(Math.min(1, a * 2) * 7);
        R(14, 20, 4, mh + 1, K); R(13, 21, 6, mh - 1, K); R(14, 22, 4, mh - 3, '#3a0a0e'); R(14, 20, 1, 1, '#c8c8c0'); R(17, 20, 1, 1, '#c8c8c0');
      }
    },
    thumb(g, w, h) {
      const gy = h - 22;
      g.fillStyle = '#0e1622'; g.fillRect(0, 0, w, gy);
      g.fillStyle = 'rgba(180,190,205,.10)'; for (let i = 0; i < 4; i++) g.fillRect(0, gy - 14 - i * 9, w, 4);
      g.fillStyle = '#e8ecf0'; g.beginPath(); g.arc(w * .8, 18, 9, 0, 7); g.fill(); g.fillStyle = '#0e1622'; g.beginPath(); g.arc(w * .8 + 4, 15, 8, 0, 7); g.fill();
      /* 茅草屋：屋顶、白墙、一扇亮着的窗 */
      g.fillStyle = '#3a2e1a'; g.beginPath(); g.moveTo(4, gy - 26); g.lineTo(18, gy - 44); g.lineTo(70, gy - 44); g.lineTo(84, gy - 26); g.closePath(); g.fill();
      g.fillStyle = '#5a4a2a'; for (let i = 0; i < 9; i++) g.fillRect(10 + i * 8, gy - 42, 1, 15);
      g.fillStyle = '#9a968a'; g.fillRect(8, gy - 26, 72, 26);
      g.fillStyle = '#e8b860'; g.fillRect(20, gy - 20, 9, 8); g.fillStyle = '#5a4a30'; g.fillRect(24, gy - 20, 1, 8); g.fillRect(20, gy - 17, 9, 1);
      g.fillStyle = '#1a1612'; g.fillRect(56, gy - 19, 9, 8); g.fillStyle = '#2a2018'; g.fillRect(40, gy - 18, 8, 18);
      const gr = g.createRadialGradient(24, gy - 16, 2, 24, gy - 16, 26); gr.addColorStop(0, 'rgba(255,200,120,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, gy - 44, 60, 44);
      /* 地上的银梳子 */
      g.fillStyle = '#c8ccd6'; g.fillRect(14, gy + 6, 18, 4); for (let i = 0; i < 8; i++) g.fillRect(15 + i * 2, gy + 10, 1, 4);
      g.fillStyle = '#ffffff'; g.fillRect(28, gy + 5, 3, 1); g.fillRect(29, gy + 4, 1, 3);
      g.fillStyle = '#d8d8de'; g.fillRect(8, gy + 9, 7, 1); g.fillRect(6, gy + 11, 8, 1);
    },
    items: {
      shirt: { name: '湿衬衫', desc: '蓝白细条纹，硬领子，湿得往下滴水。领口里面印着一行褪了色的英文：BOSTON。' },
      tongs: { name: '火钳', desc: '灶台边的铁火钳，夹泥炭用的。奶奶说，她的东西，只能用铁去碰。' },
      combt: { name: '火钳夹着的银梳子', desc: '你把胳膊伸得直直的，火钳离身子远远的。梳子凉得连火钳都是冰的。' },
      tongsb: { name: '拧弯的火钳', desc: '两条铁腿拧成了一股麻花。谁的手劲能把铁拧成这样？' },
      pin: { name: '新车辖', desc: '一根新打的铁车辖：插在车轴头上、挡住车轮不往外跑的那根销子。汤米上礼拜在铁匠铺打的。' },
      hammer: { name: '锤子', desc: '汤米的羊角锤，木柄被手磨得发亮。' }
    },
    notes: {
      bible: { title: '族谱（家用圣经的扉页）', text: '几代人的字挤在一起，最早的几行已经褪成了褐色。\n\n西穆斯·奥弗林　1831—1889\n　1858年娶 诺拉·伯克（戈尔韦郡人）\n　（旁边是奶奶的字：那三夜，我听见了她。）\n长子 帕德里克·奥弗林　1862—1904\n　1890年娶 玛格丽特·沃尔什\n　（奶奶的字：她又来了。）\n　长女 艾琳　1893年生\n次子 迈克尔·奥弗林　1875年生，1898年去了美国波士顿\n　长子 肖恩　1901年生于波士顿\n\n最底下一行是妈妈的字：\n1897年冬，奶奶的母亲伯克老太太在这屋里过世。那一夜，外头静得很。' },
      letter: { title: '迈克尔叔叔的信（1904年，从波士顿寄回）', text: '亲爱的妈妈：\n\n电报是礼拜四到的。可是礼拜三夜里，我就知道了。\n\n那天夜里我在码头边的寄宿屋，三楼，窗户对着海湾。半夜有个女人在窗下哭，哭得整栋楼的狗都不叫了。同屋的意大利人说是猫。\n我知道不是猫。小时候我听过一回，爸爸走的那年。\n\n这边的人说，美国没有鬼。\n可她跟着我们家上了船，过了海。\n\n别告诉嫂子我信这个。我现在是美国人了。\n\n——迈克尔' },
      copybook: { title: '艾琳的作文本：《班西》', text: '老派迪说，「班西」（bean sí）的意思是「仙丘里的女人」。\n她不害人。她只是哭——一家里有人要走之前，她先替这家人哭。\n\n她只跟着最老的那些姓：名字前头带「奥」（Ó）和「麦克」（Mac）的。后来的人家，她看不上。\n\n有人看见她是个年轻姑娘，有人看见她是个穿灰斗篷的老太婆，眼睛哭得通红。\n还有人看见她蹲在河边的浅滩上，一件一件地洗衣裳——洗的是快要死的那个人的衣裳。\n\n她一边哭一边梳头，用一把银梳子。路上看见梳子，千万别捡。\n\n（老师的红笔：迷信。字写得不错。）' },
      keen: { title: '一张旧纸（奶奶的箱子里）', text: '奶奶年轻时一个字一个字记下的，纸已经软得像布。\n\n「我的心肝，白马上的少年，\n　你为什么不等到天亮？\n　门开着，火还红着，\n　你为什么不等到天亮？」\n\n底下是奶奶的小字：\n我母亲那一辈，办丧事要请哭丧的女人。她们披着头巾坐在死人身边，一哭就是一整夜。后来神父不许了。\n我母亲说：人不哭了，就轮到她替人哭。\n她站在谁的窗底下，就是替谁先哭。' }
    },
    legend: '「报丧女妖」在爱尔兰语里叫 bean sí（旧拼作 bean sídhe，音近「班西」），意思是「仙丘的女人」——住在古冢和土丘里的「仙族」（aos sí）中的一个。她不害人，也不索命，只是在某个家族有人将死之前，夜里在屋外哀嚎。人们多半只听见她，很少看见她；见过的人说法不一：有的说是年轻美丽的姑娘，有的说是披灰斗篷、穿绿衣裳的老妇人，长头发，眼睛哭得通红。还有一种形象，是蹲在河边浅滩上洗衣裳的女人，洗的是快要死的那个人的衣服——古爱尔兰的英雄故事里，战争女神莫丽甘就曾化身「浅滩边的洗衣妇」，苏格兰高地也有类似的 bean nighe。\n\n她只为古老的家族哭。民间常说，只有姓氏前带「Ó」或「Mac」的老盖尔家族才有自己的班西，常被举出的有奥尼尔、奥布赖恩、奥康纳、奥格雷迪、卡瓦纳等。也有不少移民家庭说，亲人在故乡去世的那一夜，他们远在美国、澳大利亚，也听见了她。她的哭声常被拿来和爱尔兰丧礼上的「哭丧」（caoineadh）相比：从前守灵要请哭丧的女人在死者身旁哀歌，十九世纪起受到教会劝阻，渐渐没人再唱——班西，也就被看成了仙界的哭丧女。\n\n银梳子的说法流传很广：她一边哭一边梳头，路边看见梳子千万不能捡，不然她会上门来讨。据说有人捡了梳子，夜里听见敲窗，用火钳夹着梳子从窗口递出去，火钳被一把夺走，第二天在窗下找到时已经拧弯了（也有版本说是折断）。另有一种说法认为，所谓班西的哀嚎，其实是夜里仓鸮的尖叫或母狐的叫声。\n\n（本章的奥弗林一家、基尔莫纳这个地方、族谱和信件，「她在谁的窗下哭就是为谁哭」「嫁进来的人她不哭」的讲法，「她哭的是还没发生的事，天亮以前还能改」「让不姓这家的人去就能躲过」的规则，以及渡口和马车的情节，均为游戏虚构或改写。）',
    start: { map: 'house', x: 12, y: 4, dir: 0 },
    async intro(S) {
      FORD_DIED = 0; FATE_LEFT = null; FATE_FAILS = 0;
      S.f.ph = 'eve'; S.f.pen = 0; S.f.wrong = 0;
      await S.card(nb('第十四夜　报丧女妖'), nb('1908年深秋　爱尔兰西部　克莱尔郡'), '西风刮了三天三夜。\n海边的人家说，风什么都刮得进屋，\n只有哭声，刮不走。\n\n奶奶说，有些老姓的人家，\n是有人替他们先哭的。');
    },
    resume: {
      night: async S => { S.norun(false); },
      ford: async S => {
        fordReset(S);
        if (FORD_DIED > 0) await S.think(FORD_DIED > 1 ? '哭声一停，就站住别动。\n一丛芦苇、一丛芦苇地往前挪——最后那丛，就在她身后两步。' : '……哭声停的时候，她会抬头。\n那时候别动。芦苇丛里，她看不见我。');
      },
      fate: async S => {
        S.norun(false);
        if (FATE_FAILS > 0) await S.think('来得及。先去谷仓：工具箱，叫醒汤米。\n回来把车辖换上，再把衬衫拿给叔叔看。');
        startFate(S, Math.max(FATE_FLOOR, FATE_LEFT ?? baseT(S)));
      }
    },
    tick(S, dt) {
      const f = S.f;
      if (f.ph === 'fate' && S.timerLeft != null) {
        FATE_LEFT = S.timerLeft;
        if (S.timerLeft < 30 && !f._w30) { f._w30 = 1; S.toast('灶屋里，迈克尔叔叔在系靴带了……'); strike(S, 1); }
        if (S.timerLeft < 12 && !f._w12) { f._w12 = 1; S.toast('迈克尔叔叔拿起了马鞭。'); S.sfx('heart'); }
        if (S.map === 'house') { f._tk = (f._tk ?? 1) - dt; if (f._tk <= 0) { f._tk = S.timerLeft < 30 ? 1 : 2; S.sfx('tick'); } }
      }
      if (S.busy || (f.ph !== 'night' && f.ph !== 'fate')) return;
      /* 背景里的哀嚎：屋里闷，院子里清楚，谷仓里最远 */
      f._wl = (f._wl ?? 6) - dt;
      if (f._wl <= 0) {
        f._wl = 9 + Math.random() * 5;
        const far = f.sawBean ? .7 : 1;
        if (S.map === 'house') keen(S, .03 * far, f.sawBean ? 650 : 850);
        else if (S.map === 'yard') { keen(S, .045 * far, f.sawBean ? 1100 : 1500); if (Math.random() < .5) S.after(2600, async S => { whine(S); S.bubble('dog', '…', 1400); }); }
        else if (S.map === 'barn') keen(S, .022, 700);
        else if (S.map === 'ford') keen(S, .02, 900);
      }
    },
    tiles: {
      thatch: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#5e4a26');
        for (let i = 0; i < 7; i++) { const x = (hash(X, Y, i) * 15) | 0; R(x, 0, 1, 16, i % 2 ? '#7a6232' : '#4a3a1e'); }
        R(0, (Y * 5) % 8, 16, 1, '#3e3018'); if (hash(X, Y, 9) < .3) R((hash(X, Y, 10) * 12) | 0, 6, 3, 2, '#3a4a26');
        R(0, 14, 16, 2, '#3a2c16');
      } },
      whitewash: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#cfcabe'); R(0, 0, 16, 3, '#7e7a6c'); R(0, 3, 16, 1, '#a8a496');
        if (hash(X, Y, 3) < .5) R((hash(X, Y, 4) * 12) | 0, 6 + ((hash(X, Y, 5) * 4) | 0), 3, 2, '#bdb8aa');
        R(0, 13, 16, 3, '#5a564c'); R(0, 13, 16, 1, '#6e6a5e');
      } },
      byrewall: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#5a5a54'); R(0, 0, 16, 3, '#3e3e38');
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R(c * 6 - (r % 2) * 3 + 1, 4 + r * 4, 5, 3, ['#6e6e66', '#64645c', '#76766e'][(c + r + X) % 3]);
        R(0, 14, 16, 2, '#2e2e2a');
      } },
      shedroof: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#3a2e22'); for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, '#2a2018');
        R(0, 0, 16, 2, '#4a3a2a'); if (Y % 2) { R(0, 12, 16, 4, '#1a140e'); R(X % 3 === 0 ? 7 : 20, 6, 2, 10, '#4a3626'); }
      } },
      drystone: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#24301e');
        const cs = ['#6a6a62', '#5a5a54', '#76766c', '#4e4e48'];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const w = 4 + ((hash(X + c, Y + r, 7) * 3) | 0); R(c * 5 + ((hash(X, Y + r, 2) * 2) | 0), 3 + r * 4, w, 3, cs[(c * 3 + r + X + Y) % 4]); }
        R(0, 15, 16, 1, '#141a10');
      } },
      turfstack: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#2a1e14');
        for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) R(c * 8 + (r % 2) * 4 - 2, r * 4, 7, 3, ['#4a3626', '#3e2c1e', '#54402c'][(r + c + X) % 3]);
      } },
      cobble: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, '#3a3832');
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) R(c * 4 + (r % 2) * 2, r * 4, 3, 3, ['#56524a', '#4e4a44', '#5e5a50'][(c + r * 3 + X + Y) % 3]);
      } },
      straw: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, '#6e5a30');
        for (let i = 0; i < 12; i++) { const x = (hash(X, Y, i) * 15) | 0, y = (hash(Y, X, i + 5) * 15) | 0; R(x, y, 3, 1, i % 2 ? '#9a8248' : '#b89a58'); }
      } },
      reedc: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, '#262a1a');
        for (let i = 0; i < 9; i++) { const x = (hash(X, Y, i) * 15) | 0; R(x, 2 + ((hash(X, Y, i + 9) * 6) | 0), 1, 12, i % 2 ? '#4a5a30' : '#3a4826'); }
      } }
    },
    sprites: {
      /* 敞口灶：石砌的烟囱、泥炭火、铁吊臂上挂着一口锅 */
      hearth(g, e, t, R) {
        box(R, -2, -12, 36, 28, '#6a6460'); R(-2, -12, 36, 3, '#4a4440');
        R(0, -8, 32, 1, '#5a5450'); R(0, -3, 32, 1, '#5a5450');
        R(4, 0, 24, 16, '#140c08');
        for (let i = 0; i < 4; i++) R(6 + i * 5, 12, 5, 3, ['#3a2418', '#4a2e1c'][i % 2]);
        for (let i = 0; i < 6; i++) { const h = 2 + ((Math.sin(t * 8 + i * 1.9) + 1) * 2.4) | 0; R(7 + i * 3, 12 - h, 2, h, i % 2 ? '#ff8a2a' : '#ffc050'); }
        R(6, 1, 1, 11, '#2a2a2e'); R(6, 1, 13, 1, '#2a2a2e'); R(16, 2, 1, 4, '#2a2a2e');
        box(R, 13, 5, 8, 6, '#1e1e22'); R(14, 5, 6, 1, '#3a3a40');
        for (let i = 0; i < 2; i++) { const p = (t * .6 + i * .5) % 1; R(16 + Math.sin(t * 2 + i) * 2, 4 - p * 10, 1, 1, `rgba(220,220,220,${(.5 * (1 - p)).toFixed(2)})`); }
      },
      wagclock(g, e, t, R) {
        box(R, 3, 0, 10, 10, '#3a2a1a'); R(5, 2, 6, 6, '#e8e0c8'); R(7, 3, 1, 3, '#111'); R(8, 5, 2, 1, '#111');
        const s = Math.round(Math.sin(t * 3.14) * 2); R(8 + s, 10, 1, 5, '#c9a35a'); R(7 + s, 14, 3, 2, '#c9a35a');
        R(5, 10, 1, 4, '#555'); R(4, 13, 2, 3, '#777'); R(11, 10, 1, 2, '#555'); R(10, 11, 2, 3, '#777');
      },
      brigid(g, e, t, R) { const c = '#c8b070', d = '#a08848'; R(7, 1, 2, 12, c); R(2, 6, 12, 2, c); R(6, 5, 4, 4, d); R(7, 1, 1, 2, d); R(13, 6, 1, 2, d); R(8, 11, 1, 2, d); R(2, 7, 1, 1, d); },
      sacred(g, e, t, R) {
        box(R, 3, 0, 10, 11, '#8a6a2a'); R(4, 1, 8, 9, '#6a2a2a'); R(6, 2, 4, 3, '#d8b090'); R(5, 2, 6, 1, '#4a2a1a'); R(5, 5, 6, 5, '#8a1a1a'); R(7, 6, 2, 2, '#ff5040'); R(7, 5, 2, 1, '#ffd060');
        R(6, 12, 4, 3, '#7a0a0a'); const f = Math.sin(t * 11) > 0 ? 1 : 0; R(7, 10 + f, 2, 2 - f, '#ff6040');
      },
      /* 碗柜：上面摆着蓝边的瓷盘，台面上放着家用圣经 */
      dresserI(g, e, t, R) {
        box(R, 0, -14, 16, 29, '#5a3a24'); R(1, -13, 14, 1, '#7a5a3a');
        for (let r = 0; r < 2; r++) { R(1, -7 + r * 6, 14, 1, '#3a2414'); for (let i = 0; i < 3; i++) { R(2 + i * 4, -12 + r * 6, 4, 5, '#2e4e8a'); R(3 + i * 4, -11 + r * 6, 2, 3, '#e8eef4'); } }
        R(0, 0, 16, 2, '#7a5a3a'); R(3, -2, 8, 2, '#2a1a14'); R(4, -2, 6, 1, '#c9a35a');
        R(1, 3, 14, 11, '#4a2e1c'); R(7, 3, 2, 11, '#3a2414'); R(5, 7, 1, 2, '#c9a35a'); R(10, 7, 1, 2, '#c9a35a');
      },
      nanbox(g, e, t, R) { box(R, 2, 5, 12, 9, '#5a3a24'); R(2, 4, 12, 2, '#6e4a2e'); R(7, 7, 2, 2, '#c9a35a'); },
      tongs(g, e, t, R) { R(6, -6, 1, 20, '#2a2a2e'); R(9, -6, 1, 20, '#2a2a2e'); R(6, -7, 4, 2, '#4a4a50'); R(5, 13, 2, 1, '#2a2a2e'); R(9, 13, 2, 1, '#2a2a2e'); },
      chairshirt(g, e, t, R) {
        const c = '#6a4a2a'; R(3, -4, 2, 18, c); R(11, -4, 2, 18, c); R(3, -3, 10, 1, c); R(3, 0, 10, 1, c);
        box(R, 2, 6, 12, 4, '#a08a50'); for (let i = 0; i < 5; i++) R(3 + i * 2, 7, 1, 2, '#7a6838'); R(3, 10, 2, 5, c); R(11, 10, 2, 5, c);
        if (e.shirt) { R(2, -5, 12, 11, '#dfe6f0'); for (let i = 0; i < 6; i++) R(3 + i * 2, -4, 1, 10, '#5a78b0'); R(4, -6, 8, 2, '#f4f6fa'); R(7, -4, 2, 1, '#9aa'); }
      },
      settle(g, e, t, R) { box(R, 1, -6, 14, 36, '#6a4a30'); R(2, -5, 12, 2, '#8a6a42'); R(2, 2, 12, 26, '#7a5a3a'); for (let i = 0; i < 4; i++) R(2, 6 + i * 6, 12, 1, '#5a3a22'); R(3, 2, 10, 4, '#b8b0a0'); },
      spinwheel(g, e, t, R) {
        const c = '#7a5a34'; R(3, 4, 10, 10, '#3a2a18'); R(4, 5, 8, 8, '#00000000'); R(3, 4, 10, 1, c); R(3, 13, 10, 1, c); R(3, 4, 1, 10, c); R(12, 4, 1, 10, c);
        R(7, 4, 1, 10, c); R(3, 8, 10, 1, c); R(7, 8, 2, 2, '#c9a35a'); R(1, 12, 14, 2, c); R(2, 14, 1, 2, c); R(13, 14, 1, 2, c); R(13, 0, 1, 12, c); R(12, 0, 3, 2, '#e8e0c8');
      },
      creel(g, e, t, R) { box(R, 2, 4, 12, 10, '#8a6a3a'); for (let i = 0; i < 3; i++) R(3 + i * 4, 1, 3, 4, ['#3a2a1c', '#4a3424', '#2e2016'][i]); for (let i = 0; i < 4; i++) R(3, 6 + i * 2, 10, 1, '#6a4e2a'); },
      font(g, e, t, R) { R(7, 6, 2, 9, '#5a5a58'); box(R, 4, 3, 8, 4, '#c8c8c0'); R(5, 4, 6, 1, '#7a9ab0'); R(7, 0, 2, 3, '#c8c8c0'); R(6, 1, 4, 1, '#c8c8c0'); },
      /* 生病的小肖恩：枕头上一张烧得通红的小脸 */
      sbed(g, e, t, R) {
        box(R, 1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 6, '#e6e2d6');
        R(5, 3, 6, 5, '#f0c8b0'); R(5, 2, 6, 2, '#8a3a1e'); R(6, 5, 1, 1, '#2a1a14'); R(9, 5, 1, 1, '#2a1a14'); R(5, 6, 1, 1, '#e86060'); R(10, 6, 1, 1, '#e86060');
        const c = '#6a7a9a'; R(2, 9, 12, 20, c); R(2, 9, 12, 2, shade(c, .2)); R(2, 27, 12, 2, shade(c, -.25));
        if (Math.sin(t * 2.4) > .3) R(7, 12, 2, 1, shade(c, .15));
      },
      trunk(g, e, t, R) { box(R, 0, 3, 16, 12, '#34465a'); R(0, 6, 16, 1, '#6a4a2a'); R(3, 3, 2, 12, '#6a4a2a'); R(11, 3, 2, 12, '#6a4a2a'); R(5, 9, 6, 3, '#e8e0c8'); R(6, 10, 4, 1, '#3a3a3a'); R(7, 4, 2, 2, '#c9a35a'); },
      /* 大车：车身两格，车辕伸进左边一格；左轮上的车辖裂着，换了以后发亮 */
      cart2(g, e, t, R) {
        R(-16, 8, 18, 2, '#5a4024'); R(-16, 4, 18, 2, '#4a3420'); R(-16, 4, 2, 6, '#3a2818');
        box(R, 0, -2, 32, 11, '#6a4a2a'); R(1, -1, 30, 2, '#8a6a3a'); R(0, 6, 32, 2, '#4a3420'); for (let i = 1; i < 4; i++) R(i * 8, -1, 1, 7, '#5a3c22');
        R(9, 3, 14, 13, '#2a2018'); R(10, 4, 12, 11, '#4e3e2a'); R(15, 4, 2, 11, '#2a2018'); R(10, 9, 12, 2, '#2a2018'); R(14, 8, 4, 4, '#6a5a48');
        if (e.fixed) { R(15, 9, 2, 2, '#d8dce0'); R(15, 8, 1, 1, '#ffffff'); }
        else { R(15, 9, 2, 2, '#7a6a58'); R(16, 9, 1, 2, '#140a06'); }
      },
      comb(g, e, t, R) {
        R(1, 4, 4, 1, '#d8d8de'); R(0, 6, 5, 1, '#c4c4cc');
        R(3, 3, 10, 2, '#c8ccd6'); R(4, 2, 8, 1, '#e8ecf2'); for (let i = 0; i < 5; i++) R(4 + i * 2, 5, 1, 2, '#b4b8c2');
        if (Math.sin(t * 2.6) > .55) { R(11, 1, 3, 1, '#ffffff'); R(12, 0, 1, 3, '#ffffff'); }
      },
      horse(g, e, t, R) {
        const c = '#5a3a22', d = '#3e2816', b = Math.sin(t * 1.6) > 0 ? 1 : 0;
        box(R, 6, -2 + b, 22, 10, c); R(7, 6 + b, 20, 2, d);
        R(8, 8, 2, 7, d); R(12, 8, 2, 7, c); R(22, 8, 2, 7, d); R(26, 8, 2, 7, c); R(8, 14, 2, 1, '#1a1008'); R(26, 14, 2, 1, '#1a1008');
        R(2, -8, 6, 9, c); R(0, -4, 4, 5, c); R(0, -1, 3, 2, '#2a1a10'); R(4, -10, 2, 3, d); R(3, -6, 1, 1, '#0a0606');
        R(6, -8, 3, 8, '#2a1a10'); const s = Math.round(Math.sin(t * 2.2) * 1.5); R(28 + s, 0, 2, 9, '#2a1a10');
      },
      dog(g, e, t, R) {
        const b = Math.sin(t * 3) > .6 ? 1 : 0;
        R(3, 8 + b, 11, 5, '#1a1a1e'); R(3, 10 + b, 4, 3, '#e8e4dc'); R(12, 11, 3, 2, '#1a1a1e');
        R(0, 6 + b, 5, 5, '#1a1a1e'); R(1, 8 + b, 2, 3, '#e8e4dc'); R(0, 6 + b, 1, 2, '#2a2a2e'); R(4, 5 + b, 2, 2, '#1a1a1e'); R(1, 7 + b, 1, 1, '#c8b040');
      },
      /* 仙女刺：一棵独自长在地里、谁也不敢砍的山楂树 */
      hawthorn(g, e, t, R) {
        const c = '#3a2e22', d = '#2a2018';
        R(6, -2, 3, 17, c); R(5, 4, 2, 4, d); R(9, -6, 2, 6, c); R(3, -8, 3, 7, c); R(11, -12, 2, 7, d); R(1, -12, 3, 5, d); R(7, -16, 2, 8, c);
        R(-2, -10, 4, 1, d); R(12, -6, 5, 1, d); R(-1, -15, 3, 1, d); R(13, -14, 4, 1, d); R(5, -18, 6, 1, d);
        for (const [x, y] of [[1, -11], [12, -7], [8, -17], [-1, -9], [14, -13], [4, -9]]) R(x, y, 1, 1, '#a02020');
      },
      washer(g, e, t, R) {
        const lk = e.look || 0, lift = e.lift || 0, beat = (lk || lift) ? 0 : (Math.sin(t * 5) > 0 ? 1 : 0);
        R(1, 6, 14, 9, '#4a4c54'); R(2, 3, 12, 5, '#55575f'); R(3, 1, 10, 3, '#5c5e66');
        R(4, -4, 8, 15, '#d8d8de'); R(3, -1, 1, 9, '#c4c4cc'); R(12, -1, 1, 9, '#c4c4cc'); R(5, 11, 6, 3, '#c4c4cc');
        R(3, -7, 10, 4, '#5c5e66'); R(4, -8, 8, 1, '#5c5e66');
        if (lk) { R(5, -5, 6, 6, '#dcdcd8'); R(4, -5, 1, 7, '#d8d8de'); R(11, -5, 1, 7, '#d8d8de'); R(6, -3, 1, 1, '#ff3030'); R(9, -3, 1, 1, '#ff3030'); if (lk > 1) { R(6, -2, 1, 1, '#7a1010'); R(9, -2, 1, 1, '#7a1010'); R(7, 0, 2, 1, '#2a0808'); } }
        const sy = 9 - beat * 3 - lift * 9;
        R(12, sy, 7, 5, '#dfe6f0'); for (let i = 0; i < 4; i++) R(12 + i * 2, sy, 1, 5, '#5a78b0'); R(12, sy + 5, 7, 1, 'rgba(120,20,20,.6)');
        R(11, sy - 1, 2, 3, '#dcdcd8');
        if (!lk && !lift && beat) R(18, 13, 3, 1, 'rgba(200,220,240,.7)');
      },
      wstone(g, e, t, R) { if (e.shirt) { R(1, 4, 14, 7, '#dfe6f0'); for (let i = 0; i < 7; i++) R(1 + i * 2, 4, 1, 7, '#5a78b0'); R(3, 3, 6, 2, '#f4f6fa'); R(2, 11, 3, 2, 'rgba(160,190,220,.6)'); } },
      reedfg(g, e, t, R) {
        for (let i = 0; i < 6; i++) {
          const x = ((hash(e.x, e.y, i) * 15) | 0), hgt = 9 + ((hash(e.y, e.x, i) * 7) | 0), sw = Math.round(Math.sin(t * 1.7 + i + e.x) * .8);
          R(x + sw, 14 - hgt, 1, hgt, i % 2 ? 'rgba(84,104,54,.92)' : 'rgba(64,82,40,.92)');
          if (i % 2) R(x + sw, 13 - hgt, 1, 3, '#7a6a40'); else R(x + sw, 14 - hgt, 1, 1, 'rgba(200,210,225,.55)');
        }
      },
      /* 谷仓：草堆里睡着的汤米 */
      haybed(g, e, t, R) {
        R(0, 2, 48, 13, '#9a7e3e'); R(2, 0, 44, 4, '#b4964c'); for (let i = 0; i < 16; i++) R((hash(i, 2, 5) * 46) | 0, 1 + ((hash(i, 3, 5) * 12) | 0), 3, 1, i % 2 ? '#c8aa5a' : '#7a6230');
        if (!e.empty) { R(22, 4, 16, 8, '#6a5a40'); R(22, 4, 16, 2, '#7a6a4a'); R(16, 3, 6, 6, '#f0cfb4'); R(15, 2, 7, 3, '#4a4038'); R(17, 6, 1, 1, '#2a1a14'); R(19, 6, 1, 1, '#2a1a14');
          const z = (t * .8) % 1; R(14 - z * 4, -2 - z * 8, 2, 1, `rgba(230,230,230,${(1 - z).toFixed(2)})`); R(14 - z * 4, -1 - z * 8, 1, 1, `rgba(230,230,230,${(1 - z).toFixed(2)})`); }
      },
      toolbox(g, e, t, R) { box(R, 1, 6, 14, 8, '#6a4a2a'); R(6, 3, 4, 1, '#3a2a1a'); R(5, 3, 1, 3, '#3a2a1a'); R(10, 3, 1, 3, '#3a2a1a'); R(3, 4, 1, 3, '#888'); R(2, 3, 3, 1, '#666'); R(12, 2, 1, 5, '#8a6a3a'); if (!e.took) R(8, 5, 4, 1, '#9aa0a8'); },
      harness(g, e, t, R) { R(7, 0, 2, 3, '#2a2a2a'); R(3, 2, 10, 11, '#3a2a1a'); R(5, 4, 6, 7, '#5a5050'); R(3, 2, 1, 11, '#c9a35a'); R(12, 2, 1, 11, '#c9a35a'); },
      ladder(g, e, t, R) { R(3, -10, 2, 26, '#7a5a34'); R(11, -10, 2, 26, '#7a5a34'); for (let y = -8; y < 16; y += 4) R(5, y, 6, 1, '#6a4a2a'); },
      cow(g, e, t, R) {
        const b = Math.sin(t * 1.2) > 0 ? 1 : 0;
        box(R, 6, 0, 22, 10, '#e8e2d6'); R(10, 1, 7, 6, '#5a3a24'); R(20, 3, 6, 5, '#5a3a24');
        R(8, 9, 2, 6, '#c8c2b6'); R(24, 9, 2, 6, '#c8c2b6');
        R(0, -3 + b, 8, 7, '#e8e2d6'); R(0, 1 + b, 4, 3, '#d8a8a0'); R(1, -4 + b, 2, 2, '#c8c0a8'); R(5, -4 + b, 2, 2, '#c8c0a8'); R(2, -1 + b, 1, 1, '#1a1010');
        R(28, 2, 1, 8, '#5a3a24');
      },
      wheelspare(g, e, t, R) { R(2, -2, 12, 16, '#3a2a1a'); R(3, -1, 10, 14, '#5a4630'); R(7, -1, 2, 14, '#3a2a1a'); R(3, 5, 10, 2, '#3a2a1a'); R(6, 4, 4, 4, '#6a5a48'); },
      cat(g, e, t, R) { const b = Math.sin(t * 2) > .8 ? 1 : 0; R(4, 9, 8, 5, '#3a3430'); R(10, 6, 5, 5, '#3a3430'); R(10, 5, 1, 2, '#3a3430'); R(14, 5, 1, 2, '#3a3430'); if (!b) { R(11, 8, 1, 1, '#c8d040'); R(13, 8, 1, 1, '#c8d040'); } R(2, 11, 3, 1, '#3a3430'); }
    },
    maps: {
      /* ---------------- 农舍 ---------------- */
      house: {
        amb: 'fire', dark: .5, plr: 3, wall: 'plain', floor: 'stone',
        legend: { w: 'wood', k: 'stone' },
        rows: [
          '########################',
          '########################',
          '#wwwwww#kkkkkkkk#wwwwww#',
          '#wwwwww#kkkkkkkk#wwwwww#',
          '#wwwwww#kkkkkkkk#wwwwww#',
          '#wwwwwwwkkkkkkkkwwwwwww#',
          '#wwwwww#kkkkkkkk#wwwwww#',
          '#wwwwww#kkkkkkkk#wwwwww#',
          '#wwwwww#kkkkkkkk#wwwwww#',
          '###########k############'],
        ents: [
          { id: 'hexit', x: 11, y: 9, spr: 'invisible', touch: S => leaveHouse(S) },
          /* 西屋：迈克尔叔叔和小肖恩 */
          { id: 'wwin', x: 3, y: 1, spr: 'window', on: S => westWindow(S) },
          { id: 'sbed', x: 2, y: 2, h: 2, spr: 'sbed', on: S => seanBed(S) },
          { id: 'mbed', x: 5, y: 2, h: 2, spr: 'bed', col: '#4a5a6a', on: S => S.narr(S.f.ph === 'eve' ? '迈克尔叔叔的床。枕头边上放着一顶圆顶礼帽，是在波士顿买的，回村以后一次也没戴过。' : '迈克尔叔叔的床，被子掀在一边。他一整夜都没躺下。') },
          { id: 'trunk', x: 5, y: 7, spr: 'trunk', async on(S) {
            if (S.once('trunk')) await S.narr('迈克尔叔叔的海员箱，蓝漆，铁皮包角。箱盖上贴着一张船票的存根：昆士敦 → 波士顿。\n箱子没锁。最上面压着一封旧信——是他当年寄回家、奶奶又塞还给他的。');
            await S.note('letter'); S.f.readLetter = true;
          } },
          { id: 'wchair', x: 2, y: 7, spr: 'chair', col: '#5a3a22', on: S => S.narr('椅子上搭着肖恩的小外套，口袋里装着一颗波士顿带来的玻璃弹子。') },
          /* 灶屋 */
          { id: 'brigid', x: 8, y: 1, spr: 'brigid', on: S => S.narr('门楣上挂着一个灯心草编的十字——圣布里吉德十字。每年二月初一编一个新的，旧的就挂在房梁上，护着这一家不着火。') },
          { id: 'clock', x: 9, y: 1, spr: 'wagclock', async on(S) { S.sfx('tick'); await S.narr('挂钟的钟摆左一下、右一下。\n现在是' + clockText(S) + '。'); if (S.f.ph === 'night') await S.think('迈克尔叔叔说，四点就走。'); } },
          { id: 'hearth', x: 11, y: 1, w: 2, spr: 'hearth', light: { r: 5.2, col: 'rgba(255,140,60,.26)', flick: true, dy: 12 }, on: S => S.narr(S.f.ph === 'eve' ? '泥炭火烧得通红。这火从奶奶嫁过来那年起就没灭过——夜里埋上灰，早上拨开，还是红的。' : '火埋上了灰，只剩一点暗红。屋里一股泥炭烟的苦味。') },
          { id: 'sacred', x: 13, y: 1, spr: 'sacred', light: { r: 1.6, col: 'rgba(255,40,30,.22)', dy: 13 }, on: S => S.narr('圣心像。底下那盏小红灯，奶奶一辈子没让它灭过。') },
          { id: 'kwin', x: 14, y: 1, spr: 'window', on: S => kitchenWindow(S) },
          { id: 'dresser', x: 15, y: 2, spr: 'dresserI', async on(S) {
            if (S.once('bible')) await S.narr('碗柜上摆着过节才用的蓝边瓷盘。台面上放着家用圣经，皮面磨得发白。\n翻开扉页，是奥弗林家的族谱。');
            await S.note('bible'); S.f.readBible = true;
          } },
          { id: 'nanbox', x: 9, y: 3, spr: 'nanbox', async on(S) {
            if (S.once('nanbox')) await S.narr('奶奶的小木箱，放着她的念珠、一绺用丝带扎着的头发，和一张折了很多折的旧纸。');
            await S.note('keen'); S.f.readKeen = true;
          } },
          { id: 'tongs', x: 10, y: 2, spr: 'tongs', on: S => tongs(S) },
          { id: 'nan', x: 10, y: 3, spr: '@nan', dir: 0, on: S => nanTalk(S) },
          { id: 'chair', x: 13, y: 3, spr: 'chairshirt', s: { shirt: true }, on: S => shirtChair(S) },
          { id: 'table', x: 11, y: 5, w: 2, spr: 'table2', col: '#6a4a2e', on: S => S.narr(S.f.ph === 'eve' ? '桌上摆着吃剩的土豆、一罐酪乳，和迈克尔叔叔从美国带回来的一听咖啡——谁也不知道该怎么煮。' : '桌上的蜡烛快烧完了。蜡油顺着烛台流到桌面上，凝成了一个小白丘。') },
          { id: 'mam', x: 10, y: 6, spr: '@mam', dir: 2, on: S => mamTalk(S) },
          { id: 'mick', x: 13, y: 6, spr: '@mick', dir: 1, on: S => mickTalk(S) },
          { id: 'tommy_h', x: 12, y: 7, spr: '@tommy', hidden: true, dir: 3, on: S => S.say('汤米', '……我真没碰那梳子。真的。') },
          { id: 'settle', x: 8, y: 7, h: 2, spr: 'settle', on: S => S.narr('炉边的长条靠背椅。白天是椅子，翻开就是一张床。来串门的人坐在这儿讲故事，一讲就讲到后半夜。') },
          { id: 'wheel', x: 15, y: 7, spr: 'spinwheel', on: S => S.narr('纺车。妈妈冬天在这儿纺羊毛，奶奶在旁边讲古。轮子上还缠着半截灰毛线。') },
          { id: 'creel', x: 14, y: 8, spr: 'creel', on: S => S.narr('一筐泥炭，是汤米白天从沼地里背回来的，还带着一股湿土的气味。') },
          { id: 'font', x: 10, y: 8, spr: 'font', on: S => S.narr('门边的小圣水盂。出门以前，奶奶总要蘸一点，在你额头上画个十字。') },
          /* 东屋：妈妈和你 */
          { id: 'ewin', x: 20, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'eve' ? '窗外起雾了，什么也看不见。' : '东屋的窗外只有雾。哭声在房子的另一头。') },
          { id: 'bed_m', x: 18, y: 2, h: 2, spr: 'bed', col: '#6a5a4a', on: S => S.narr('妈妈的床。枕头底下压着爸爸的一块怀表，早就不走了。') },
          { id: 'bed_e', x: 21, y: 2, h: 2, spr: 'bed', col: '#7a3a3a', on: S => myBed(S) },
          { id: 'copy', x: 22, y: 7, spr: 'book', solid: true, col: '#3a4a6a', async on(S) { await S.note('copybook'); S.f.readCopy = true; } },
          { id: 'edress', x: 18, y: 8, spr: 'dresser', col: '#5a4030', on: S => S.narr('五斗柜上放着妈妈的针线筐，和你过坚振礼时戴过的白头纱。') }
        ],
        async enter(S, first) { if (first && S.f.ph === 'eve') await opening(S); },
        step(S, x, y) {
          if (S.f.ph === 'night' && !S.f.gathered && x >= 8 && x <= 15) return gather(S);
        }
      },
      /* ---------------- 院子 ---------------- */
      yard: {
        amb: 'wind', dark: .76, plr: 3.2, floor: 'dirt', floor2: 'cobble', fog: .18,
        legend: { '^': 'thatch', H: 'whitewash', I: 'byrewall', Q: 'shedroof', G: 'drystone', S: 'turfstack' },
        tileOpts: { grassC: '#22301e', treeC: '#121c14' },
        rows: [
          'T^^^^^^^^^^^^^^^^^^^^^TTTTTTTT',
          'T^^^^^^^^^^^^^^^^^^^^^QQQQQQTT',
          'TIIIIHHHHHHHHHHHHHHHHHQQQQQQTT',
          'G,,,,,,,,,,,,,,,,,,,,,dddddddG',
          'GddSSddddddddddddddddddddddddG',
          'GddSSddddddddddddddddddddddddG',
          'GddddddddddddddddddddddddddddG',
          'GddddddddddddddddddddddddddddG',
          'G"""dddddddddddddddddddddddddG',
          'G"""""""""ddddddddddd""""""""G',
          'G"""""""""ddddddddddd""""""""G',
          'G"""""""""ddddddddddd""""""""G',
          'GGGGGGGGGGGGdGGGGGGGGGGGGGGGGG',
          'TTTTTTTTTThdddhTTTTTTTTTTTTTTT',
          'TTTTTTTTTThdddhTTTTTTTTTTTTTTT',
          'TTTTTTTTTThdddhTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTdTTTTTTTTTTTTTTTTT'],
        ents: [
          { id: 'door_h', x: 12, y: 2, spr: 'door', col: '#7a2a22', async on(S) { S.sfx('open'); await S.go('house', 11, 8, 3); } },
          { id: 'door_b', x: 3, y: 2, spr: 'door', col: '#3a2a1a', async on(S) { S.sfx('open'); await S.go('barn', 5, 7, 3); } },
          { id: 'wwin_y', x: 7, y: 2, spr: 'window', on: S => S.narr(S.f.sawBean ? '西屋的窗户。窗台底下的泥地上，一个脚印也没有。\n可是窗台上落着几根长长的白头发。' : '西屋的窗户，黑着。肖恩和迈克尔叔叔睡在里面。') },
          { id: 'kwin_y', x: 15, y: 2, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,170,90,.16)' }, on: S => S.narr('灶屋的窗户里透出一点火光。奶奶的影子映在窗纸上，一动不动。') },
          { id: 'ewin_y', x: 19, y: 2, spr: 'window', on: S => S.narr('东屋的窗户。你的床就在窗户底下。') },
          { id: 'bean_y', x: 7, y: 3, spr: '@bean_big', hidden: true, solid: false, dir: 3, light: { r: 2.4, col: 'rgba(190,205,225,.18)' } },
          { id: 'cart', x: 24, y: 3, w: 2, spr: 'cart2', on: S => cartUse(S) },
          { id: 'comb', x: 23, y: 3, spr: 'comb', light: { r: .9, col: 'rgba(210,220,240,.25)' }, on: S => combUse(S) },
          { id: 'horse', x: 26, y: 5, w: 2, spr: 'horse', async on(S) { snort(S); await S.narr(S.f.ph === 'eve' ? '老马贝丝。' : '老马贝丝不安地刨着蹄子，耳朵一直朝着南边——朝着渡口。'); } },
          { id: 'tommy_y', x: 25, y: 5, spr: '@tommy', hidden: true, dir: 1, on: S => tommyYard(S) },
          { id: 'dog', x: 9, y: 4, spr: 'dog', async on(S) { whine(S, .025); S.bubble('dog', '…', 1200); await S.narr('牧羊狗布兰趴在墙根底下，尾巴夹在两腿中间，浑身发抖。\n它平时连狐狸都敢追。'); } },
          { id: 'turf', x: 3, y: 4, w: 2, h: 2, spr: 'invisible', solid: true, on: S => S.narr('码得整整齐齐的泥炭垛，够烧一个冬天。') },
          { id: 'well', x: 17, y: 6, spr: 'well', on: S => S.narr('井口盖着木板。往下看，水面黑得像一只眼睛。') },
          { id: 'barrel', x: 21, y: 4, spr: 'barrel', on: S => S.narr('接雨水的木桶，满满的。水面上浮着一层薄薄的雾。') },
          { id: 'haw', x: 4, y: 10, spr: 'hawthorn', on: S => S.narr('地中间孤零零一棵山楂树。爷爷犁地的时候，宁可绕着它犁一个圈，也不肯砍。\n老人们说，那是「仙女的刺」。') },
          { id: 'lane', x: 12, y: 16, spr: 'invisible', touch: S => toFord(S) },
          { id: 'moonY', x: 18, y: 7, spr: 'invisible', light: { r: 9, a: .35, col: 'rgba(140,160,200,.06)' } },
          { id: 'moonC', x: 24, y: 4, spr: 'invisible', light: { r: 3.4, a: .45, col: 'rgba(150,170,210,.08)' } }
        ],
        async enter(S, first) {
          if (S.f.ph === 'night' && !S.f.sawBean) return beanAtWindow(S);
        }
      },
      /* ---------------- 谷仓 ---------------- */
      barn: {
        amb: 'room', dark: .7, plr: 2.8, wall: 'stone', floor: 'dirt',
        legend: { y: 'straw' },
        rows: [
          '############',
          '############',
          '#yyyyyyyyyy#',
          '#yyyyyyyyyy#',
          '#dddddddddd#',
          '#dddddddddd#',
          '#dddddddddd#',
          '#dddddddddd#',
          '#####d######'],
        ents: [
          { id: 'bexit', x: 5, y: 8, spr: 'invisible', to: ['yard', 3, 3, 0] },
          { id: 'blamp', x: 2, y: 1, spr: 'lantern', light: { r: 3.4, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('马灯挂在钉子上，火苗压得很低。') },
          { id: 'harness', x: 5, y: 1, spr: 'harness', on: S => S.narr('贝丝的挽具挂在墙上，铜扣子擦得锃亮。') },
          { id: 'ladder', x: 10, y: 1, spr: 'ladder', on: S => S.narr('梯子通到草料阁楼上。汤米说上面有一窝猫头鹰，夜里叫起来像女人哭。\n……可外头那个声音，不是猫头鹰。') },
          { id: 'hay', x: 7, y: 2, w: 3, spr: 'haybed', on: S => tommyHay(S) },
          { id: 'toolbox', x: 2, y: 4, spr: 'toolbox', on: S => toolbox(S) },
          { id: 'cow', x: 7, y: 6, w: 2, spr: 'cow', on: S => S.narr('老奶牛莫莉慢慢地嚼着草，大眼睛在黑暗里一眨一眨。\n它是这屋里唯一一个不怕的。') },
          { id: 'wheelb', x: 10, y: 5, spr: 'wheelspare', on: S => S.narr('一只备用的车轮靠在墙上，铁箍生了锈。') },
          { id: 'sack', x: 1, y: 7, spr: 'sack', on: S => S.narr('一袋燕麦，是给贝丝的。') },
          { id: 'cat', x: 3, y: 7, spr: 'cat', solid: true, on: S => S.narr('谷仓里的黑猫。它背上的毛一直竖着，眼睛盯着门口。') }
        ],
        async enter(S, first) { if (first) await S.narr('谷仓里一股干草和牛粪的味道。\n老牛在黑暗里慢慢地嚼着，汤米的呼噜声从草堆里传出来。'); }
      },
      /* ---------------- 渡口 ---------------- */
      ford: {
        amb: 'river', dark: .8, plr: 2.8, floor: 'mud', fog: .26,
        legend: { r: 'reedc' },
        tileOpts: { grassC: '#1e2a1a', treeC: '#101a12' },
        rows: FORD_ROWS,
        ents: [
          { id: 'fexit', x: 11, y: 0, spr: 'invisible', touch: S => leaveFord(S) },
          { id: 'fexit2', x: 12, y: 0, spr: 'invisible', touch: S => leaveFord(S) },
          { id: 'road', x: 11, y: 21, spr: 'invisible', touch: S => roadEnnis(S) },
          { id: 'road2', x: 12, y: 21, spr: 'invisible', touch: S => roadEnnis(S) },
          { id: 'moon', x: 12, y: 17, spr: 'invisible', light: { r: 3.2, col: 'rgba(150,170,200,.12)' } },
          { id: 'moonB', x: 12, y: 9, spr: 'invisible', light: { r: 7.5, a: .3, col: 'rgba(140,160,200,.05)' } },
          { id: 'washer', x: HX, y: HY, spr: 'washer', solid: false, light: { r: 2.2, col: 'rgba(190,205,225,.2)' } },
          { id: 'wstone', x: 13, y: 16, spr: 'wstone', solid: true, on: S => washStone(S) },
          ...[...COVER].map(k => { const [x, y] = k.split(',').map(Number); return { x, y, spr: 'reedfg', z: 1, solid: false }; })
        ],
        async enter(S, first) { if (S.f.ph === 'ford') await fordStart(S); },
        step(S, x, y) { if (S.f.ph === 'ford' && PEEK.has(x + ',' + y)) return peek(S); },
        tick(S, dt) { if (S.f.ph === 'ford' && !S.busy) fordTick(S, dt); }
      }
    }
  });

  /* ================= 剧情 ================= */
  async function opening(S) {
    await S.narr('泥炭火烧得通红。烟从烟囱里出不去的那一半，在屋梁底下慢慢地打着转。\n西屋里传来小肖恩一阵一阵的咳嗽。');
    await S.say('妈妈', '迈克尔，你那件美国衬衫我给洗了，搭在炉边椅背上，明早就干。');
    S.sfx('open'); S.place('tommy_h', 11, 8, 3); await S.walk('tommy_h', [12, 7], 4);
    await S.say('汤米', '……奶奶，我刚才在院子里，看见车辕上坐着一个女的。灰斗篷，白头发一直拖到地上，一边梳头一边哼着什么。');
    S.bubble('nan', '!', 900);
    await S.say('奶奶', '你碰了什么没有？');
    await S.say('汤米', '没、没有！我喊了一声，一眨眼人就没了。车辕上落着一把梳子，银的，在月亮底下闪。');
    await S.say('奶奶', '谁也不许去碰那把梳子。听见没有？谁也不许。');
    await S.say('迈克尔叔叔', '妈，汤米八成是看见隔壁的寡妇出来收衣裳了。……仙女？波士顿可没有这玩意儿。');
    await S.narr('奶奶没有笑。她盯着炉火，手里的念珠一颗一颗地往下捻。');
    await S.say('妈妈', '好了，都早点睡。汤米，回谷仓去。艾琳，跟奶奶道个晚安，回东屋睡觉。');
    S.sfx('close'); S.hide('tommy_h');
    S.goal('跟家里人说说话，回东屋睡觉');
  }

  async function leaveHouse(S) {
    const ph = S.f.ph;
    if (ph === 'eve') { await S.narr('外头起雾了。妈妈说过，天黑以后谁也不许出门。'); return S.walk('pl', 'u', 5); }
    if (ph === 'done') { await S.narr('天就要亮了。哪儿也别去了。'); return S.walk('pl', 'u', 5); }
    S.sfx('open'); await S.go('yard', 12, 3, 0);
  }

  async function myBed(S) {
    if (S.f.ph !== 'eve') return S.narr('你的床。被窝早就凉了。');
    if (await S.ask('睡觉吗？', ['睡吧', '再等等']) === 1) return;
    await nightFalls(S);
  }

  async function nightFalls(S) {
    await S.fade(1, 800);
    S.f.ph = 'night'; S.ent('chair').s.shirt = false; S.ent('wwin').face = true;
    S.place('mam', 14, 4, 1); S.place('mick', 13, 6, 1); S.face('nan', 0);
    S.pos(21, 4, 3); S.dark(.62);
    await S.card('', '夜里', '……\n\n你是被一阵哭声吵醒的。');
    await S.fade(0, 700);
    keen(S, .07, 1700); S.shake(300, 1);
    await S.narr('那不是人的哭声。……又像，又不像。\n它从屋外头来，绕着房子，一圈，又一圈。');
    whine(S, .04);
    await S.think('院子里的布兰也在叫……不对，它在呜咽。\n妈妈的床空着。灶屋里有亮光。');
    S.goal('去灶屋看看');
  }

  async function gather(S) {
    S.f.gathered = true;
    S.face('mam', 'pl');
    await S.narr('灶屋里，妈妈举着蜡烛站在炉边。奶奶坐在她的椅子上，一动不动，像是根本就没睡。');
    await S.say('妈妈', '妈……是不是……是不是为您来的？');
    await S.say('奶奶', ['不是我。', '我是伯克家的人，嫁进来的。她不跟嫁进来的人。']);
    S.face('mick', 'nan');
    await S.say('迈克尔叔叔', ['肖恩烧得更厉害了，一直说胡话，说窗户外头有个女人在梳头。', '我不管外头是猫是狐狸——四点我就套车，去恩尼斯请大夫。']);
    S.face('nan', 'pl');
    await S.say('奶奶', ['……艾琳，过来。', '她只为奥弗林家的血哭。有人在河边的浅滩上见过她，在洗那个人的衣裳。', '她哭的是要来的事、还没来的事。天一亮，她就得走——天亮以前，命还能拧一拧。', '车辕上那把梳子，谁也不许用手碰。真要碰，用灶台边的火钳，从窗缝里还给她。']);
    await S.think('她在为谁哭？\n奶奶的族谱、她站在哪个窗户底下、渡口……');
    S.goal(nightGoal(S));
    S.cp('night');
  }

  async function nanTalk(S) {
    const ph = S.f.ph; S.face('nan', 'pl');
    if (ph === 'eve') return S.say('奶奶', ['奥弗林是老姓，孩子。比这房子老，比教堂老。', '睡吧。今天夜里不管听见什么，别开窗。']);
    if (ph === 'fate') return S.say('奶奶', S.f.combBack ? '去吧。四点以前。' : ['去吧。四点以前。', '……车辕上那把梳子，赶车的人一伸手就碰着了。']);
    if (ph === 'done') return S.say('奶奶', '天快亮了。');
    const r = await S.ask('奶奶抬起眼睛看着你。', ['我知道她为谁哭了', '再说说她的事', '没什么'], '奶奶');
    if (r === 2) return;
    if (r === 1) return S.say('奶奶', [
      '我嫁过来那年，你爷爷带我去看那棵山楂树。他说，奥弗林家有个女人跟着，比他的姓还老。',
      '她来过两回。你爷爷走那年，你爸爸走那年。两回我都听见了，两回都是三夜。',
      S.f.sawWash ? '你都看见了。去对一对吧：族谱、窗户、衣裳。' : '她在哪个窗下哭、在浅滩上洗谁的衣裳——看清楚了，就知道是谁。'
    ]);
    if (!S.f.sawWash) {
      const tip = !S.f.readBible ? '先翻翻碗柜上的圣经，看看哪些人是奥弗林家的血。' : !(S.f.sawBean || S.f.seanTold) ? '听听她在哪个窗户底下哭。出去看看，或者问问西屋的肖恩。' : '她在浅滩上洗的是谁的衣裳，比什么都准。从院门出去，顺着小路往南，就是渡口。';
      return S.say('奶奶', ['……你还没看全。', tip]);
    }
    return guess(S);
  }

  async function guess(S) {
    const who = await S.keypad(WHO_TXT, WHO, 1, { alias: { 1: WHO[0], 2: WHO[1], 3: WHO[2], 4: WHO[3], 5: WHO[4], 6: WHO[5] } });
    if (who == null) return S.say('奶奶', '想好了再说。');
    const how = await S.keypad(HOW_TXT, HOW, 1, { alias: { 1: HOW[0], 2: HOW[1], 3: HOW[2], 4: HOW[3], 5: HOW[4] } });
    if (how == null) return S.say('奶奶', '想好了再说。');
    if (who === '迈克尔叔叔' && how === HOW[2]) return rightAnswer(S);
    const f = S.f; f.wrong = (f.wrong || 0) + 1; f.pen = Math.min(FATE_PEN * 3, (f.pen || 0) + FATE_PEN);
    keen(S, .075, 2000); S.shake(500, 2); S.sfx('heart');
    await S.narr('外头的哭声一下子高了起来，像是就贴在门板上。\n挂钟的指针往前跳了一大截——离四点，又近了。');
    const lines = [];
    if (who !== '迈克尔叔叔') lines.push({
      '奶奶': '傻孩子，我是伯克家的人，嫁进来的。族谱上写着呢。',
      '妈妈': '你妈妈是沃尔什家的，也是嫁进来的。她不跟嫁进来的人。',
      '汤米': '汤米？那孩子连这家的姓都不姓。',
      '小肖恩': '西屋的窗下没错……可你在浅滩上看见的，是孩子穿的衣裳吗？',
      '我': '你是奥弗林家的血，这不假。可她站在你的窗底下了吗？'
    }[who]);
    else lines.push(how === HOW[1] ? '人对了，地方也对了。可他是走着过河的吗？她的梳子，落在什么上头了？' : '人……对了。可是怎么出事？她把梳子落在哪儿了？她又是在哪儿洗的衣裳？');
    if (f.wrong === 2) lines.push('三样东西对一对：族谱上的血、她站的窗下、她洗的衣裳。三样都对得上的，只有一个人。');
    if (f.wrong === 3) lines.push('西屋里睡着两个人，孩子的衣裳没有那么大。梳子落在车辕上，左轮的车辖裂着，衣裳在车道下水的地方洗。');
    if (f.wrong >= 4) lines.push('……是迈克尔。是那辆车，在渡口。');
    await S.say('奶奶', lines);
  }

  function baseT(S) { return Math.max(FATE_FLOOR, FATE_BASE - (S.f.pen || 0)); }
  function startFate(S, T) { S.goal(fateGoal(S)); S.timer(T, '离四点', fateTimeout, { during: true }); }

  async function rightAnswer(S) {
    S.f.ph = 'fate';
    await S.narr('奶奶闭上眼睛，很久没有说话。');
    await S.say('奶奶', '……迈克尔。');
    S.bubble('mick', '!', 900); S.face('mick', 'nan');
    await S.say('迈克尔叔叔', '妈？');
    await S.say('奶奶', ['你天不亮要赶车去恩尼斯，要过渡口。', '车辕上落着她的梳子。渡口的浅滩上，她在洗你的衬衫。']);
    await S.say('迈克尔叔叔', '……妈，那是迷信。肖恩烧成这样，四点我就走，谁也拦不住。');
    S.face('nan', 'pl');
    await S.say('奶奶', ['命还没落地，就还能拧一拧。', '别让他上那辆车。车要去，就让不姓奥弗林的人赶——车也得修结实了。']);
    S.place('mick', 12, 7, 0);
    await S.think('四点……钟上已经快三点了。');
    FATE_LEFT = null;
    S.goal(fateGoal(S)); S.cp('fate');
    startFate(S, baseT(S));
  }

  async function westWindow(S) {
    const f = S.f;
    if (f.ph === 'eve') return S.narr('西屋的小窗。玻璃上起了一层雾气。');
    if (!f.sawWash) {
      await S.narr('窗玻璃上蒙着一层白雾。雾上有几道印子，从上往下，一道一道的——\n像是有人隔着玻璃，在梳头发。');
      if (S.once('wwinFace')) { S.sfx('sting'); await S.think('窗外……有个白白的影子。\n一眨眼，又没了。'); }
      return;
    }
    S.ent('wwin').face = false;
    await S.narr('窗玻璃上的雾干了。那几道梳子印还在。');
  }

  async function seanBed(S) {
    const f = S.f;
    if (f.ph === 'eve') return S.say('小肖恩', ['（咳、咳）……艾琳姐姐。', '汤米说车上坐着一个仙女。她唱的歌，我在被窝里也听见了。好难过的歌。']);
    if (f.ph === 'done') return S.narr('肖恩睡着了，呼吸比刚才匀了一些。迈克尔叔叔握着他的手。');
    await S.narr('肖恩烧得满脸通红，迷迷糊糊地睁开眼睛。');
    await S.say('小肖恩', ['……艾琳姐姐，窗户外面有个阿姨在梳头。头发好长好长，白的。', '她一边梳一边哭。……她是在哭谁呀？']);
    f.seanTold = true;
  }

  async function shirtChair(S) {
    const f = S.f;
    if (f.ph === 'eve') return S.narr('炉边的椅背上搭着迈克尔叔叔的衬衫：蓝白细条纹，硬领子，是在波士顿的百货公司里买的。\n村里没有人穿这样的衬衫。');
    if (S.has('shirt') || f.shirtShown) return S.narr('椅背上空空的。那件衬衫是从这里不见的。');
    await S.narr('椅背上空了。');
    await S.think('……迈克尔叔叔那件条纹衬衫呢？\n门一直闩着，谁也没出去过。');
    f.shirtGone = true;
  }

  async function mamTalk(S) {
    const ph = S.f.ph; S.face('mam', 'pl');
    if (ph === 'eve') return S.say('妈妈', ['你叔叔这回回来，人胖了，话也多了。', '可是他半夜老站在门口抽烟，往南边看。……大概是想他那边的家了。']);
    if (ph === 'night') return S.say('妈妈', ['你奶奶说不是为她……那是为谁？', '……你要出去？那就快去快回。别走到河边去。']);
    if (ph === 'fate') return S.say('妈妈', '我去给肖恩换块凉毛巾。你快去，艾琳。');
    return S.say('妈妈', '天快亮了。');
  }

  async function mickTalk(S) {
    const f = S.f; S.face('mick', 'pl');
    if (f.ph === 'eve') return S.say('迈克尔叔叔', ['波士顿的电车整夜整夜地响，响得人睡不着。回到这儿，倒是静得睡不着了。', '肖恩烧了三天了。明早要是还不退，我就套车去恩尼斯请大夫——过了渡口，十几里路。']);
    if (f.ph === 'night') return S.say('迈克尔叔叔', ['别跟我说仙女，艾琳。我在波士顿住了十年，从来没有谁在窗外哭过。', '……四点。四点我就走。']);
    if (f.ph === 'done') return S.say('迈克尔叔叔', '我守着肖恩。');
    if (f.shirtShown) {
      if (!f.tommyUp) return S.say('迈克尔叔叔', '汤米？那小子睡得跟死猪一样。你叫得醒他，我就不去。');
      if (!f.cartFixed) return S.say('迈克尔叔叔', '汤米在院子里套马了？……车辖呢？左轮那根裂了，你换上没有？');
      return;
    }
    await S.say('迈克尔叔叔', '别拦我，艾琳。肖恩烧成这样，我等不了。');
    if (!S.has('shirt')) return;
    if (await S.ask('叔叔在系外套的扣子。', ['给他看那件湿衬衫', '……']) === 1) return;
    S.take('shirt'); f.shirtShown = true;
    await S.narr('你把那件湿透的条纹衬衫递给他。水顺着他的手指往下滴。');
    S.bubble('mick', '!', 900);
    await S.say('迈克尔叔叔', ['……这是我的。', '在渡口？……在她手里？']);
    await S.narr(f.readLetter ? '迈克尔叔叔看着那件衬衫，脸一点一点地白了。\n你知道他想起了什么——波士顿码头边的寄宿屋，三楼，窗户对着海湾。' : '迈克尔叔叔看着那件衬衫，脸一点一点地白了。');
    await S.say('迈克尔叔叔', '……好。我不去。可是总得有人去恩尼斯请大夫——你看肖恩烧成什么样了。');
    S.goal(fateGoal(S));
    await checkFate(S);
  }

  /* ---------- 院子 ---------- */
  async function beanAtWindow(S) {
    S.f.sawBean = true;
    const b = S.ent('bean_y'); S.place('bean_y', 7, 3, 3); b.alpha = 1;
    S.focus(9, 4); keen(S, .065, 1800);
    await S.narr('西屋的窗户底下，站着一个人。');
    await S.narr('灰斗篷，长长的白头发一直垂到脚跟。她背对着你，对着那扇黑窗户，一下一下地梳头。\n哭声就是从她那里来的。');
    S.bubble('pl', '!', 900); S.sfx('heart');
    await S.think('……她站在西屋的窗下。');
    await S.alpha('bean_y', 0, 1300);
    S.focus(null);
    await S.narr('一眨眼，窗下只剩下雾。\n哭声远了，往南边去了——往渡口那边。');
  }

  async function cartUse(S) {
    const f = S.f;
    if (f.cartFixed) return S.narr('新车辖插得紧紧的。左轮转起来，一点也不晃了。');
    if (!f.crack) {
      f.crack = true;
      await S.narr('家里的大车。车辕上搁着汤米白天卸下的挽绳。');
      await S.think('……左边车轮的车辖——挡着轮子不往外跑的那根铁销——上头有一道细细的裂纹。\n要是在渡口那种乱石底子上颠一下……');
    }
    if (!(S.has('pin') && S.has('hammer'))) return S.narr(f.ph === 'fate' ? '得找根新车辖换上。汤米的工具箱在谷仓里。' : '车辖裂了。汤米说过要换——他的工具箱在谷仓里。');
    if (await S.ask('把裂了的车辖换下来吗？', ['换', '先不动']) === 1) return;
    await S.narr('你把裂了的旧车辖拔出来，新车辖插进车轴头上的孔里。');
    const v = await S.keypad('敲紧它！敲三下\n（点按钮，或按数字 1）', ['敲'], 3, { cancel: false, alias: { 1: '敲', 2: '敲', 3: '敲' } });
    void v; hammer(S); await S.wait(160); hammer(S);
    S.take('pin'); f.cartFixed = true; S.ent('cart').s.fixed = true;
    await S.narr('当、当、当。新车辖敲到了底，在月光底下发亮。');
    if (f.ph === 'fate') { S.goal(fateGoal(S)); await checkFate(S); }
  }

  async function combUse(S) {
    const f = S.f;
    await S.narr('车辕上搁着一把梳子。\n银的，齿很密，梳齿缝里缠着几根长长的白头发。月光照在上面，一闪，一闪。');
    if (f.ph === 'eve') return;
    const opts = ['捡起来', '别碰它']; if (S.has('tongs')) opts.splice(1, 0, '用火钳夹起来');
    const r = await S.ask('……', opts);
    const pick = opts[r];
    if (pick === '别碰它') return S.think(f.gathered ? '奶奶说过，谁也不许用手碰。' : '……不知道为什么，我不想碰它。');
    if (pick === '用火钳夹起来') {
      S.take('tongs'); S.give('combt'); S.hide('comb'); f.combTongs = true;
      await S.narr('你用火钳夹住梳子，胳膊伸得直直的，离身子远远的。\n火钳一下子凉透了，凉得手心发疼。');
      await S.think('奶奶说，从窗缝里还给她。……灶屋的窗户。');
      return;
    }
    return combBad(S);
  }

  async function combBad(S) {
    if (S.f.ph === 'fate') FATE_FAILS++;
    S.clearTimer(); S.hide('comb');
    await S.narr('你弯下腰，把梳子捡了起来。\n它比井水还凉，凉得像是攥着一块冰。');
    S.amb('none');
    await S.narr('哭声停了。\n院子里静得能听见雾落在地上的声音。');
    await S.fade(1, 900);
    await S.card('', '那天夜里', '有人在敲东屋的窗户。\n一下，一下，不紧不慢。');
    await S.go('house', 21, 4, 3, { fade: false });
    S.ent('ewin').face = true; S.dark(.75);
    await S.fade(0, 700);
    S.sfx('knock'); await S.wait(500); S.sfx('knock');
    await S.narr('窗外站着一个人。灰斗篷，白头发一直垂到地上。\n她隔着玻璃，朝你伸着一只手。');
    await S.ask('梳子在你手心里，越来越凉。', ['推开窗，把梳子递给她', '把梳子藏进被窝里']);
    keen(S, .09, 2400);
    await S.scare('face', { spr: '@bean', sfx: 'scream', dur: 1.1 });
    const who = S.f.shirtShown ? '那一年，奥弗林家的人又听见她哭了一回——为窗下的你。' : '那一年，奥弗林家的人听见她哭了两回。\n一回，为天亮前赶车出门的迈克尔；一回，为窗下的你。';
    await S.end({ bad: true, id: 'comb', title: '银梳子', text: '第二天早上，妈妈在东屋的窗下找到了你。\n你的右手攥得紧紧的，怎么也掰不开。手心里什么也没有。\n\n' + who + '\n\n（路上看见的梳子，千万别用手去捡。）' });
  }

  async function tongs(S) {
    if (S.f.ph === 'eve') return S.narr('灶台边靠着一把铁火钳，夹泥炭用的。');
    if (!S.f.gathered) return S.narr('灶台边靠着一把铁火钳。');
    if (await S.ask('灶台边靠着一把铁火钳。', ['拿上', '不用']) === 1) return;
    S.hide('tongs'); S.give('tongs');
    await S.think('奶奶说，真要碰那把梳子，就用火钳。');
  }

  async function kitchenWindow(S) {
    const f = S.f;
    if (!S.has('combt')) return S.narr(f.combBack ? '窗户关得紧紧的。窗台上留着一道湿湿的、长长的印子。' : f.ph === 'eve' ? '窗外的雾白茫茫的，什么也看不见。' : '窗外一片白雾。哭声就在雾里，时远时近。');
    await S.narr('你把窗户推开一道缝。雾一下子涌了进来，冷得像水。');
    await S.narr('你把火钳伸出去，夹着那把梳子，胳膊伸得直直的。');
    keen(S, .08, 2200); S.shake(400, 2);
    await S.wait(700);
    await S.scare('face', { spr: '@bean', dur: 1 });
    await S.narr('有什么东西猛地一拽——火钳差点脱了手。\n你死死攥住，把它拖了回来，砰地关上窗户。');
    S.take('combt'); S.give('tongsb'); f.combBack = true;
    await S.narr('火钳的两条铁腿，拧成了一股麻花。\n梳子不见了。');
    if (f.ph !== 'eve') { S.face('nan', 'pl'); await S.say('奶奶', '……好孩子。她拿回了自己的东西，就不会再上门来讨。'); }
  }

  async function toFord(S) {
    const ph = S.f.ph;
    if (ph === 'fate') { await S.narr('四点以前要办的事，都在院子里和谷仓里。'); return S.walk('pl', 'u', 5); }
    if (S.f.sawWash) { await S.narr('你不想再去渡口了。'); return S.walk('pl', 'u', 5); }
    S.f.ph = 'ford';
    await S.go('ford', 12, 1, 0);
  }

  async function leaveFord(S) {
    if (S.f.sawWash && S.ent('wstone').s.shirt) { await S.think('……石头上那件衬衫。得带回去。'); return S.walk('pl', 'd', 4); }
    if (S.f.ph === 'ford') { S.f.ph = 'night'; S.norun(false); S.plr(null); await S.go('yard', 12, 15, 3); return S.think('……还没看清她洗的是什么。'); }
    await S.go('yard', 12, 15, 3);
  }

  async function roadEnnis(S) { await S.narr('过了河，就是去恩尼斯的路。走路要走到天亮。'); return S.walk('pl', 'u', 4); }

  async function washStone(S) {
    const st = S.ent('wstone');
    if (!st.s.shirt) return S.narr(S.f.sawWash ? '一块平平的大石头，白天村里的女人在这儿洗衣裳。' : '一块平平的大石头。');
    st.s.shirt = false; S.give('shirt');
    await S.narr('你把那件衬衫从石头上拿起来。湿透了，沉甸甸的，冷得像刚从冰里捞出来。\n领口里面印着一行褪了色的英文：BOSTON。');
    await S.think('车道就是从这儿下水的，过了河才是去恩尼斯的路。\n今夜的水，比白天涨了一尺多。');
    S.goal(nightGoal(S));
  }

  /* ---------- 渡口潜行 ---------- */
  function fordReset(S) {
    const f = S.f; f.ph = 'ford'; f._fph = 'k'; f._ft = 2.6 + Math.random() * 1.2; f._fc = 0; f._seg = 0; f._ki = 0; f.seen = 0;
    const w = S.ent('washer'); if (w) { S.place('washer', HX, HY, 0); w.alpha = 1; w.s.look = 0; w.s.lift = 0; }
    S.norun(true); S.plr(null);
  }
  async function fordStart(S) {
    fordReset(S);
    if (S.once('fordIntro')) {
      await S.narr('小路一直往下，雾从河面上漫上来，没过了脚脖子。\n脚底下是烂泥，跑不起来。');
      S.focus(12, 15); keen(S, .055, 1500);
      await S.narr('渡口的浅滩上，跪着一个人。\n她背对着岸，面前一块平平的大石头。她在洗衣裳——一下，一下，往石头上捶。');
      sob(S);
      S.ent('washer').s.look = 1; S.plr(1.9); S.sfx('heart');
      await S.narr('哭声停了。\n她抬起头，慢慢地转过来，朝岸上望。');
      await S.think('……别动。');
      S.ent('washer').s.look = 0; S.plr(null); keen(S, .05, 1500);
      await S.narr('过了一会儿，她又低下头去，接着捶那件衣裳。哭声又起来了。');
      S.focus(null);
    } else await S.narr('雾还是那么浓。浅滩上，她还在洗。');
    S.goal('靠近她，看清她洗的是什么（哭声停时别动；芦苇里她看不见你）');
    S.cp('ford');
  }
  function fordTick(S, dt) {
    const f = S.f, w = S.ent('washer'); if (!w) return;
    const p = W.pl, d = Math.hypot(p.x - HX, p.y - HY), vol = .02 + .06 * Math.max(0, 1 - d / 16);
    f._ft -= dt;
    if (f._fph === 'k') {
      f._seg = (f._seg || 0) - dt;
      if (f._seg <= 0) {
        f._seg = .26; const i = f._ki = ((f._ki || 0) + 1) % (KEEN_C.length - 1);
        S.tone('sawtooth', KEEN_C[i], KEEN_C[i + 1], .34, vol, 0, 1600); S.tone('sine', KEEN_C[i] * 2, KEEN_C[i + 1] * 2, .34, vol * .45, 0, 2400);
      }
      if (f._ft <= 0) { f._fph = 'w'; f._ft = .8; sob(S, vol); S.bubble('washer', '…', 900); S.bubble('pl', '…', 900); w.s.look = 0; }
    } else if (f._fph === 'w') {
      if (f._ft <= 0) { f._fph = 'l'; f._ft = 2 + Math.random() * .8; w.s.look = 1; S.plr(1.9); S.sfx('heart'); }
    } else if (f._fph === 'l') {
      const cov = COVER.has(p.x + ',' + p.y);
      if (!cov && ((S.moving && d <= SIGHT) || d <= NEAR)) { f._fph = 'x'; S.run(spotted); return; }
      if (f._ft <= 0) {
        w.s.look = 0; S.plr(null); f._fc = (f._fc || 0) + 1;
        if (f._fc >= MAXC) { f._fph = 'x'; S.run(washDone); return; }
        if (f._fc === MAXC - 2) { S.toast('她把衣裳拎起来拧了拧——快洗完了'); w.s.lift = 1; S.after(700, async S => { S.ent('washer').s.lift = 0; }); }
        f._fph = 'k'; f._ft = 2.6 + Math.random() * 1.4; f._seg = 0;
      }
    }
  }
  async function spotted(S) {
    const f = S.f, w = S.ent('washer'); f.seen = (f.seen || 0) + 1; w.s.look = 2;
    if (f.seen === 1) {
      S.sfx('heart'); await S.scare('red', { sfx: 'sting' });
      await S.narr('她的头停住了——正对着你这边。\n雾里，两点红红的光。');
      await S.think('……别动。别动。别动。');
      await S.wait(500);
      await S.narr('过了很久，很久，她才慢慢低下头去，接着捶那件衣裳。');
      S.toast('哭声停的时候别动——或者躲进芦苇里');
      w.s.look = 0; S.plr(null); f._fph = 'k'; f._ft = 2.8 + Math.random(); f._seg = 0;
      return;
    }
    FORD_DIED++;
    keen(S, .09, 2600);
    await S.scare('face', { spr: '@bean', sfx: 'scream', dur: 1.1 });
    await S.die('她站了起来——比你想的高得多。\n雾里传来一声长长的哭嚎。这一回，是冲着你的。\n\n（哭声停的时候，她会抬头。那时别动；芦苇丛里，她看不见你。）', '她看见你了');
  }
  async function washDone(S) {
    FORD_DIED++;
    const w = S.ent('washer'); w.s.lift = 1;
    await S.narr('她把那件衣裳从水里拎起来，拧干，搭在肩上。');
    await S.alpha('washer', 0, 1200);
    await S.die('她站起身，走进了雾里。\n你没能看清，她洗的是谁的衣裳。\n\n（一丛芦苇、一丛芦苇地往前挪，别等太久。）', '她洗完了');
  }
  async function peek(S) {
    const f = S.f; f._fph = 'x'; f.ph = 'night'; f.sawWash = true; S.norun(false); S.plr(null);
    const w = S.ent('washer'); w.s.look = 0;
    S.focus(12, 15);
    await S.narr('你从芦苇缝里看过去。她就在你面前两步远。');
    w.s.lift = 1;
    await S.narr('她手里拎着一件衣裳。是一件男人的衬衫——\n蓝白相间的细条纹，硬领子。这一带，没有人穿这样的衬衫。');
    w.s.lift = 0;
    await S.narr('她把它按在石头上，一下，一下地捶。\n顺着石头流回河里的水，在雾里是黑红色的。');
    keen(S, .085, 2400); S.shake(600, 2);
    await S.narr('她停了手，站起来，转过身——不是朝你，是朝着你家的方向。\n然后她哭了。这一回，哭得整条河都在抖。');
    await S.alpha('washer', 0, 1400);
    S.ent('wstone').s.shirt = true;
    S.focus(null);
    await S.narr('雾散开的时候，浅滩上什么也没有了。\n只有那块石头上，搭着那件湿衬衫。');
    S.goal('把石头上的衬衫拿上');
  }

  /* ---------- 谷仓 ---------- */
  async function tommyHay(S) {
    const f = S.f, hay = S.ent('hay');
    if (hay.s.empty) return S.narr('草堆上还留着一个人形的坑，暖乎乎的。');
    if (f.ph === 'fate') {
      if (!f.tommyShake) { f.tommyShake = true; await S.narr('汤米睡得像块石头。你使劲摇他。'); await S.say('汤米', '嗯……再五分钟……', { style: 'whisper' }); return S.think('……再摇一下。'); }
      await S.narr('你揪住他的耳朵。汤米一下子坐了起来。');
      await S.say('汤米', ['哎哟！艾琳？……去恩尼斯请大夫？现在？', '……行。她又不为我哭。我们凯里来的穷小子，祖上连个姓都没人记得——仙女看不上我们。']);
      await S.say('汤米', f.cartFixed ? '车辖换好了？那我这就去套马。' : '我去套马。可那左轮的车辖裂了，不换我可不过渡口——工具箱里有新的，你换上。');
      hay.s.empty = true; f.tommyUp = true; S.show('tommy_y');
      S.goal(fateGoal(S));
      return checkFate(S);
    }
    if (f.ph === 'eve' || !f.gathered) return S.narr('汤米在草堆里睡得正香。');
    if (f.tommyTalk) return S.narr('汤米把头蒙在毯子里，一动不动。毯子在发抖。');
    if (await S.ask('汤米睡得像块石头。', ['摇醒他', '让他睡吧']) === 1) return;
    f.tommyTalk = true;
    await S.say('汤米', ['嗯？……艾琳？外头那是什么在哭……是她吧？我就说我看见了！', '别怕，她不会为我哭的。我们凯里的穷小子，祖上连个姓都没人记得。', '那梳子还在车辕上，我才不碰。……我、我把头蒙上了。']);
  }

  async function toolbox(S) {
    const f = S.f;
    if (S.has('pin') || f.cartFixed) return S.narr('工具箱里剩下凿子、铁丝，和一把生锈的钳子。');
    if (!f.crack && f.ph !== 'fate') return S.narr('汤米的工具箱：锤子、凿子、一捆铁丝，还有一根新打的铁车辖，用油布包着。');
    S.give('pin'); S.give('hammer'); S.ent('toolbox').s.took = true;
    await S.narr('你拿出那根新车辖，还有锤子。\n汤米说过，车辖早该换了。');
    if (f.ph === 'fate') S.goal(fateGoal(S));
  }

  async function tommyYard(S) {
    S.face('tommy_y', 'pl');
    if (S.f.ph !== 'fate') return S.say('汤米', '路上冷，我多穿了一件。');
    return S.say('汤米', S.f.cartFixed ? '马套好了，车也修好了。就等叔叔一句话。' : '车辖换好了吗？裂着的那根，过渡口准掉。');
  }

  /* ---------- 四点 ---------- */
  async function checkFate(S) {
    const f = S.f;
    if (f.ph !== 'fate' || !(f.cartFixed && f.tommyUp && f.shirtShown)) return;
    return finale(S);
  }

  async function fateTimeout(S) {
    const f = S.f; f.ph = 'gone'; FATE_LEFT = 0; FATE_FAILS++;
    await S.fade(1, 600);
    if (S.map !== 'house') await S.go('house', 13, 4, 0, { fade: false });
    S.place('mick', 11, 7, 0); S.pos(13, 4, 0); S.face('pl', 'mick');
    await S.fade(0, 500);
    strike(S, 4);
    await S.narr('墙上的挂钟，敲了四下。');
    await S.say('迈克尔叔叔', f.shirtShown ? (f.tommyUp ? '车辖还裂着，汤米不肯走……那我自己去。' : '汤米叫不醒……那我自己去。') : '我不能再等了。');
    await S.walk('mick', [11, 8], 4); S.sfx('open'); S.hide('mick');
    await S.narr('院子里，马打了个响鼻。车轮碾过石子，出了院门，往渡口去了。');
    await S.fade(1, 900);
    if (f.cartFixed) {
      await S.end({ bad: true, id: 'boston', title: '海那边', text: '车过了渡口，没有翻。新车辖插得紧紧的。\n天亮以前，迈克尔叔叔带着恩尼斯的大夫回来了。肖恩的烧，第二天就退了。\n\n可是那天夜里，哭声没有停在天亮。它一直哭到第三夜。\n\n开春，叔叔带着肖恩回了波士顿。\n到了秋天，从波士顿来了一封信，信封是黑边的。\n\n（车修好了，可他还是上了那辆车。命只拧了一半。）' });
    } else {
      await S.end({ bad: true, id: 'ford', title: '渡口', text: '天亮以前，大车在渡口翻了。\n左轮的车辖断在乱石底子上，车轮滚进了黑水里。\n\n那天早上，哭声停了。停在天亮。\n\n人们说，奥弗林家的班西从来不会哭错人。\n奶奶说，她只是比谁都早知道。\n\n（四点以前：修好车辖、叫醒汤米、拿衬衫劝住叔叔。）' });
    }
  }

  async function finale(S) {
    const f = S.f; S.clearTimer(); f.ph = 'done'; S.goal('等天亮');
    await S.narr('院子里传来马蹄声。汤米赶着大车，出了院门，往渡口去了。\n车轮转得稳稳的，一点也不晃。');
    await S.fade(1, 800);
    if (S.map !== 'house') await S.go('house', 4, 4, 3, { fade: false });
    S.place('mick', 3, 4, 1); S.pos(4, 5, 1); S.place('mam', 9, 5, 0); S.face('nan', 0);
    await S.fade(0, 700);
    strike(S, 4);
    await S.narr('挂钟敲了四下。\n迈克尔叔叔坐在肖恩的床边，攥着儿子的手。他一句话也没说。');
    keen(S, .045, 1300);
    await S.narr('哭声一直没有停。它绕着房子，一圈，一圈。\n奶奶在灶屋里捻着念珠。妈妈往炉子里添了一块泥炭。');
    await S.wait(400);
    S.dark(.25);
    await S.narr('窗玻璃上的雾，慢慢地发白了。');
    rooster(S);
    keen(S, .05, 1500, .9, 4);
    await S.wait(1500);
    await S.narr('哭声停了。\n不是慢慢小下去的——是一口气吸到一半，停住了。像有人在门外，轻轻地把门带上。');
    await S.say('奶奶', '……天亮了。', { style: 'whisper' });
    if (f.readLetter) await S.say('迈克尔叔叔', ['……那年在波士顿，我也听见过她。', '我跟谁都说是猫。'], { style: 'whisper' });
    const tail = f.combBack
      ? '那把拧成麻花的火钳，奶奶一直挂在灶台边上，谁也掰不直。\n从那以后，基尔莫纳再没有人在路上见过银梳子。'
      : '车辕上那把银梳子，天亮的时候不见了。汤米说他碰都没碰。谁也不知道是什么时候没的。';
    await S.end({ id: 'dawn', title: '哭声停在天亮', text: '上午，汤米带着恩尼斯的大夫回来了。肖恩的烧，到中午就退了。\n\n开春，迈克尔叔叔带着肖恩回了波士顿。\n后来他每年圣诞都寄信回来，信的末尾总是写一句：「替我谢谢艾琳。」\n\n' + tail + '\n\n老人们说，班西从来不害人。\n她只是比谁都早知道。' });
  }
})();
